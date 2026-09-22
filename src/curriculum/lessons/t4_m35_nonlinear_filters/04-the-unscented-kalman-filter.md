---
id: l04-the-unscented-kalman-filter
title: The Unscented Kalman Filter
minutes: 22
covers:
  - 'The Unscented Kalman Filter: the unscented transform, sigma point selection (alpha, beta, kappa), the square-root UKF'
---

The last two lessons diagnosed the EKF's central weakness with some precision: it approximates how a Gaussian pushes through a nonlinear function by pushing a single point — the mean — through the function and linearizing everything around it. Every alternative this module builds from here on attacks that same weak point from a different angle. The Unscented Kalman Filter (UKF) attacks it by refusing to linearize $\mathbf f$ or $\mathbf h$ at all. Instead of one point and a Jacobian, it pushes a small, carefully chosen *set* of points through the true nonlinear function, unmodified, and reconstructs a mean and covariance from where they land. No derivative of $\mathbf f$ or $\mathbf h$ is ever computed.

This is not a minor implementation convenience. It changes what the filter is actually approximating. An EKF's covariance update is exact for a linear function and only approximate — first-order — for anything else. The **unscented transform**, the statistical machinery underneath the UKF, is exact for a linear function too, but it captures the *posterior mean* to third order in a Taylor sense and the *posterior covariance* to second order, for any nonlinear function, Jacobian or no Jacobian. It costs more function evaluations per step than the EKF's one evaluation plus one Jacobian, and it introduces three tuning parameters with real consequences if chosen carelessly — this lesson covers both the payoff and the cost precisely enough to weigh them on a real problem, which the next lesson does.

## The unscented transform

Suppose $\mathbf x\sim\mathcal N(\hat{\mathbf x},\mathbf P)$, $n$-dimensional, and you need the mean and covariance of $\mathbf y=\mathbf g(\mathbf x)$ for some nonlinear $\mathbf g$ — this is precisely what both the predict step ($\mathbf g=\mathbf f$) and the update step ($\mathbf g=\mathbf h$) need. The unscented transform answers this without linearizing $\mathbf g$ at all: it builds $2n+1$ **sigma points**, deterministically placed to match $\hat{\mathbf x}$ and $\mathbf P$ exactly, propagates every one of them through the *true*, unmodified $\mathbf g$, and recombines the results with fixed weights.

::: key The scaled unscented transform
With $\lambda=\alpha^2(n+\kappa)-n$ and $\mathbf S$ any matrix square root satisfying $\mathbf S\mathbf S^{\mathsf T}=(n+\lambda)\mathbf P$ (a Cholesky factor, in practice), the sigma points are
$$
\boldsymbol\chi_0=\hat{\mathbf x}, \qquad \boldsymbol\chi_i=\hat{\mathbf x}+[\mathbf S]_i,\quad \boldsymbol\chi_{n+i}=\hat{\mathbf x}-[\mathbf S]_i \quad (i=1,\ldots,n),
$$
with $[\mathbf S]_i$ the $i$-th column of $\mathbf S$. Weights: $W_0^{(m)}=\dfrac{\lambda}{n+\lambda}$, $W_0^{(c)}=\dfrac{\lambda}{n+\lambda}+(1-\alpha^2+\beta)$, and $W_i^{(m)}=W_i^{(c)}=\dfrac1{2(n+\lambda)}$ for $i=1,\ldots,2n$. Propagate every point, $\mathbf y_i=\mathbf g(\boldsymbol\chi_i)$, with no linearization anywhere, then reconstruct
$$
\hat{\mathbf y}=\sum_{i=0}^{2n}W_i^{(m)}\mathbf y_i, \qquad \mathbf P_{yy}=\sum_{i=0}^{2n}W_i^{(c)}(\mathbf y_i-\hat{\mathbf y})(\mathbf y_i-\hat{\mathbf y})^{\mathsf T}.
$$
:::

Every quantity here is doing a specific job. $\alpha$ (typically $10^{-3}$ to $1$) sets how far the sigma points spread from the mean, scaled relative to $\sqrt{n+\kappa}$; small $\alpha$ keeps the points close to $\hat{\mathbf x}$, which matters when the nonlinearity is only trustworthy locally. $\kappa$ is a secondary scaling term, often $0$ or $3-n$. $\beta$ folds in prior knowledge of the distribution's shape — for a Gaussian, $\beta=2$ is the value that makes the fourth-moment term in the covariance reconstruction exactly correct, which is why it is the standard default. No Jacobian of $\mathbf g$ appears anywhere in this recipe — $\mathbf g$ is evaluated, never differentiated.

::: example Polar-to-Cartesian: the textbook case for why this matters
A range-and-bearing measurement, $(r,\theta)\sim\mathcal N\big((1000\,\mathrm m,\,30^\circ),\ \operatorname{diag}(50^2\,\mathrm m^2,\,15^{\circ\,2})\big)$ with the two independent, converted to Cartesian by $\mathbf y=(r\cos\theta,\,r\sin\theta)$ — an uncertain bearing this wide ($15^\circ$, one sigma) is exactly the regime where a single linearization struggles. Three ways to get the Cartesian mean and covariance:

**Monte Carlo** (five million samples, the closest thing to "truth" available here): mean $=(837.00,\,483.01)\,\mathrm m$, covariance $=\begin{pmatrix}19441&-25829\\-25829&49277\end{pmatrix}\mathrm{m^2}$.

**Linearized** (EKF-style, Jacobian at the mean): mean $=(866.03,\,500.00)\,\mathrm m$ — off by $33.6\,\mathrm m$ — covariance Frobenius error $4803$ against the Monte Carlo value.

**Unscented transform**, $\beta=2$, $\kappa=0$: at $\alpha=10^{-3}$, mean off by only $0.67\,\mathrm m$, covariance Frobenius error $4364$; at $\alpha=1$, mean off by $0.32\,\mathrm m$, covariance Frobenius error $1904$.

The mean is where the unscented transform's advantage is starkest — fifty to a hundred times closer to the Monte Carlo truth than the linearized mean, at *either* tested value of $\alpha$, because the transform's mean estimate is accurate to third order in the underlying Taylor expansion regardless of how tightly the sigma points are clustered. The covariance tells a subtler story: both unscented results beat the linearization, but the improvement is more modest at the tiny $\alpha=10^{-3}$ spread than at $\alpha=1$, because capturing the *spread* of a genuinely nonlinear map well benefits from sigma points that actually explore more of the distribution, not only from the guaranteed second-order correction the transform provides at any spread.
:::

```python
import numpy as np

def sigma_points(x, P, alpha, beta, kappa):
    n = len(x)
    lam = alpha**2*(n+kappa) - n
    S = np.linalg.cholesky((n+lam)*P)
    chi = np.zeros((2*n+1, n)); chi[0] = x
    for i in range(n):
        chi[i+1] = x + S[:, i]; chi[n+i+1] = x - S[:, i]
    Wm = np.full(2*n+1, 1.0/(2*(n+lam))); Wc = Wm.copy()
    Wm[0] = lam/(n+lam); Wc[0] = lam/(n+lam) + (1-alpha**2+beta)
    return chi, Wm, Wc

def polar_to_cart(rt):
    r, th = rt
    return np.array([r*np.cos(th), r*np.sin(th)])

mean0 = np.array([1000.0, np.radians(30.0)])
P0 = np.diag([50.0**2, np.radians(15.0)**2])
for alpha in [1e-3, 1.0]:
    chi, Wm, Wc = sigma_points(mean0, P0, alpha, beta=2.0, kappa=0.0)
    Y = np.array([polar_to_cart(pt) for pt in chi])
    y_mean = Wm @ Y
    y_cov = sum(Wc[i]*np.outer(Y[i]-y_mean, Y[i]-y_mean) for i in range(len(Wc)))
    print(alpha, y_mean, y_cov)
# 0.001 [836.34718136 482.86527031] [[20771.32 -27578.63] [-27578.63 52616.39]]
# 1.0   [836.68465469 483.06011061] [[20823.61 -25773.07] [-25773.07 50583.79]]
```

## Choosing alpha, beta, kappa

::: key UKF tuning parameters
$\alpha$ controls sigma-point spread, typically $10^{-3}\le\alpha\le1$; $\kappa$ is a secondary scaling, usually $0$ or $3-n$; $\beta=2$ is optimal for a Gaussian prior, encoding the known fourth cumulant of a normal distribution into the covariance weight $W_0^{(c)}$. All three appear only in the weights and the spread factor $\sqrt{n+\lambda}$ — never as derivatives of $\mathbf f$ or $\mathbf h$.
:::

A small $\alpha$ sounds like the safe default — keep the sigma points close to the mean, stay in the region the local Taylor expansion is trustworthy. It is not free. As $\alpha\to0$, $\lambda\to-n$, so $n+\lambda\to0$, and the weight $W_i^{(m)}=1/(2(n+\lambda))$ for the $2n$ non-central points grows without bound while the central weight $W_0^{(m)}=\lambda/(n+\lambda)$ grows large and negative — for the $\alpha=10^{-3}$, $n=4$ case in this module's exercises, the central mean weight is close to $-1{,}000{,}000$ and each of the other eight weights is close to $+125{,}000$, summing exactly to $1$ only through large cancellation. Nothing here is a mistake — those extreme weights are exactly what is needed to keep the mean's third-order accuracy even as the points crowd the mean — but it means the arithmetic is doing more work than the modest final answer suggests, and it is the reason the next section's numerical failure is worth taking seriously rather than dismissing as a coding slip.

::: warning Extreme weights are not a bug, but they are not free either
A UKF with $\alpha=10^{-3}$ on a four-state system carries weights around $\pm10^6$ that must cancel to $1$; the arithmetic remains exact in principle, but any downstream computation built from these — especially a covariance update that subtracts one large quantity from another — is more exposed to cancellation error than the same computation with a more moderate $\alpha$. This is a genuine reason implementations favor either a larger $\alpha$ when the problem tolerates it, or the square-root form covered next, rather than reflexively defaulting to the smallest available $\alpha$.
:::

## The square-root UKF

The ordinary (non-square-root) UKF's covariance update, $\mathbf P_{yy}=\sum_i W_i^{(c)}(\mathbf y_i-\hat{\mathbf y})(\mathbf y_i-\hat{\mathbf y})^{\mathsf T}$, is a weighted sum of outer products, and — because $W_0^{(c)}$ can be *negative*, as it typically is — this sum is not a manifestly positive semi-definite quantity the way a sum of squares with all-positive weights would be. In exact arithmetic, for a well-posed problem, the positive and negative contributions still combine into a valid covariance. In floating-point arithmetic, on a genuinely ill-conditioned update, they do not always.

::: example A real covariance update going indefinite
Running the bearings-only tracking scenario from the previous lesson's divergence example, but now with the ordinary UKF instead of the EKF, across fifty independent trials: forty-nine behave well, tracking the target and reporting sensible, consistent covariances throughout. The fiftieth trial's true trajectory happens to pass unusually close to the sensor, $r_{\min}=5.75\,\mathrm m$. At the update immediately following that closest approach, the predicted covariance has eigenvalues $(0.052,\ 1.835,\ 9.090,\ 2565.3)$ — perfectly reasonable — and the measurement's predicted variance is $\mathbf S=2.709\,\mathrm{rad^2}$. The **posterior** covariance computed by the ordinary weighted-outer-product formula has eigenvalues
$$
(-12{,}055,\ \ 0.052,\ \ 1.835,\ \ 9.098):
$$
one eigenvalue is a large **negative** number. $\mathbf P$ is no longer a valid covariance matrix at all — every downstream computation that assumes positive definiteness (a Cholesky factorization for the next cycle's sigma points, chief among them) would fail outright on the very next step.
:::

```python
import numpy as np

# Pm and K exactly as computed by a real UKF update, taken from a scenario
# and seed identical to the EKF-diverges lesson's, at the update immediately
# after a 5.75 m closest approach to the sensor.
Pm = np.array([[2311.08070, 763.792606, 37.3242880, 22.4192304],
               [763.792606, 262.144289, 10.8200812, 7.97395352],
               [37.3242880, 10.8200812, 2.61190903, 0.717172430],
               [22.4192304, 7.97395352, 0.717172430, 0.417271918]])
K = np.array([-69.67653628, -23.24181258, -1.09186787, -0.68836662])
Pzz = 2.7092214208096266

P_post = Pm - np.outer(K, K)*Pzz
print(np.linalg.eigvalsh(Pm))
print(np.linalg.eigvalsh(P_post))
# [5.23037707e-02 1.83524572e+00 9.08949668e+00 2.56527712e+03]
# [-1.20554990e+04  5.23037743e-02  1.83525378e+00  9.09815052e+00]
```

The fix is architectural, not a patch: instead of propagating $\mathbf P$ itself and hoping the update stays positive definite, the **square-root UKF** propagates a matrix square root $\mathbf S$ directly (so $\mathbf P=\mathbf S\mathbf S^{\mathsf T}$ is positive semi-definite *by construction*, for any $\mathbf S$ at all) and updates $\mathbf S$ using numerically stable rank-one Cholesky updates and downdates instead of ever reassembling $\mathbf P$ from a sum that could go negative. This costs a little more bookkeeping per cycle and removes the failure mode in the example above entirely — the same reasoning, and largely the same tools (QR and Cholesky factor updates), that the numerically-stable-formulations lesson used to motivate square-root and $\mathbf U\mathbf D\mathbf U^{\mathsf T}$ forms for the linear Kalman filter. The trigger is different here — extreme UKF weights rather than a poorly-conditioned $\mathbf H$ — but the remedy is the same family of idea: never let the algorithm depend on a subtraction that arithmetic alone is trusted to keep positive.

## Check yourself

::: check
State what is propagated through $\mathbf g$ in the unscented transform, and what is not.
:::

::: answer
The $2n+1$ sigma points $\boldsymbol\chi_i$ are propagated through the true, unmodified nonlinear function: $\mathbf y_i=\mathbf g(\boldsymbol\chi_i)$, exactly as $\mathbf g$ is actually defined, with no linearization or truncation of any kind. Nothing analogous to a Jacobian of $\mathbf g$ is ever computed or propagated — the entire recipe uses only evaluations of $\mathbf g$ itself, at the chosen points, recombined afterward with fixed weights.
:::

::: check
In the polar-to-Cartesian example, the unscented transform's mean was far closer to the Monte Carlo truth than its covariance was, relatively speaking. Explain why these two quantities are not corrected to the same degree.
:::

::: answer
The unscented transform is constructed to be accurate to third order in a Taylor sense for the mean but only second order for the covariance, for a generic nonlinear function — a structural difference in the transform itself, not an artifact of this particular example. The mean's higher-order accuracy is essentially guaranteed by the weighting scheme regardless of how tightly the sigma points are spread, which is why even the extremely clustered $\alpha=10^{-3}$ points still recovered the mean to sub-meter accuracy; the covariance's correction benefits more from the points genuinely exploring the nonlinearity, which is why widening the spread to $\alpha=1$ visibly improved the covariance result but barely changed the already-excellent mean result.
:::

::: check
Why does $\alpha=10^{-3}$ produce sigma-point weights on the order of $\pm10^6$ for a four-state system, and is this itself an error?
:::

::: answer
The non-central weights are $W_i^{(m)}=1/(2(n+\lambda))$ with $n+\lambda=\alpha^2(n+\kappa)$; for $n=4$, $\kappa=0$, $\alpha=10^{-3}$, $n+\lambda=4\times10^{-6}$, so $W_i^{(m)}=1/(2\times4\times10^{-6})=125{,}000$, with the central weight $W_0^{(m)}=\lambda/(n+\lambda)\approx-1{,}000{,}000$ taking a correspondingly large negative value so that all $2n+1$ weights still sum to exactly $1$. This is not an error — it is required for the transform to retain its accuracy guarantees even when the sigma points themselves are clustered very close to the mean — but it does mean the final answer is being computed as a difference of large numbers, which is a legitimate numerical-conditioning concern distinct from whether the underlying statistics are correct.
:::

::: check
Explain concretely why the ordinary (non-square-root) UKF's posterior covariance formula can produce a matrix with a negative eigenvalue, when the corresponding linear Kalman filter's covariance update cannot (in exact arithmetic).
:::

::: answer
The linear Kalman filter's Joseph-form update is a sum of terms each manifestly positive semi-definite by construction (a congruence transform of a PSD matrix, plus another PSD term), so positive semi-definiteness is guaranteed by the *shape* of the formula, not merely by correct arithmetic. The UKF's covariance reconstruction, $\sum_i W_i^{(c)}(\mathbf y_i-\hat{\mathbf y})(\mathbf y_i-\hat{\mathbf y})^{\mathsf T}$, is a sum of outer products with weights that are not all positive — $W_0^{(c)}$ is frequently negative — so the sum is only guaranteed positive semi-definite in exact arithmetic for a well-posed problem; floating-point rounding on an ill-conditioned case, such as the closest-approach update in the worked example, can push it over the edge into an indefinite matrix that exact arithmetic alone would not have produced.
:::

::: check
A colleague proposes fixing the negative-eigenvalue failure by clipping any negative eigenvalue of $\mathbf P$ to a small positive number after each update, rather than adopting the square-root form. What does this fix, and what does it not fix?
:::

::: answer
Clipping restores a positive-definite matrix immediately, which keeps the filter from crashing on the next Cholesky factorization — a real, practical benefit. It does not address why the indefiniteness happened in the first place, and it silently discards information: an eigenvalue that went to $-12{,}055$ was not "approximately zero," it was a sign that the weighted-outer-product cancellation had gone badly wrong in that direction, and replacing it with an arbitrary small positive number is a guess about what the true uncertainty in that direction should be, not a recovery of it. The square-root form avoids needing this guess at all, by never constructing a matrix that could go indefinite in the first place.
:::

## Summary

| Item | Statement |
| --- | --- |
| Unscented transform | $2n+1$ deterministic sigma points at $\hat{\mathbf x}$ and $\hat{\mathbf x}\pm$ columns of $\sqrt{(n+\lambda)\mathbf P}$, propagated through the true $\mathbf g$, recombined with weights $W^{(m)},W^{(c)}$ — no Jacobian of $\mathbf g$ anywhere |
| Accuracy | Mean accurate to third order, covariance to second order, in the underlying Taylor sense, for any differentiable nonlinearity |
| $\lambda$ | $\lambda=\alpha^2(n+\kappa)-n$; sets spread via $\sqrt{n+\lambda}$ and every weight |
| $\alpha,\beta,\kappa$ | $\alpha\in[10^{-3},1]$ controls spread; $\kappa$ usually $0$ or $3-n$; $\beta=2$ optimal for a Gaussian prior |
| Cost of small $\alpha$ | Weights scale like $1/\alpha^2$ in magnitude and must cancel to sum to $1$; a real, verified case produced a posterior eigenvalue of $-12{,}055$ from otherwise sensible inputs |
| Square-root UKF | Propagate a Cholesky factor $\mathbf S$ of $\mathbf P$ directly via rank-one updates, guaranteeing positive semi-definiteness by construction rather than by hoping cancellation behaves |

This lesson built the machinery; it has not yet asked, on a real filtering problem run over time rather than a single transform, whether the extra cost buys a result the EKF genuinely could not reach. The next lesson returns to the same bearings-only scenario the EKF-diverges lesson used and runs the UKF on it, measurement for measurement, against the filter that collapsed.
