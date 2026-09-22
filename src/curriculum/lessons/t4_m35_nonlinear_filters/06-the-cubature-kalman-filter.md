---
id: l06-the-cubature-kalman-filter
title: The cubature Kalman filter
minutes: 16
covers:
  - The cubature Kalman filter
---

The unscented transform's three tuning parameters buy flexibility, but flexibility is exactly what a filter designer sometimes does not want: a parameter with no obviously correct value is a parameter someone can get wrong, and $\alpha=10^{-3}$'s enormous cancelling weights showed that the wrong choice has real numerical consequences, not just cosmetic ones. The **cubature Kalman filter (CKF)** answers the same underlying problem — how to push a Gaussian through a nonlinear function without a Jacobian — with a point set that has no tuning parameters at all, derives from a different piece of mathematics (numerical integration of a Gaussian-weighted integral, rather than matching Taylor moments), and turns out, this lesson shows with exact numbers, to be very close relatives with the UKF rather than a genuinely different technique.

## The cubature rule

Where the unscented transform used $2n+1$ points, the cubature rule uses exactly $2n$ — no central point at all — placed at fixed multiples of the columns of a matrix square root of $\mathbf P$, with equal weights:

::: key The (third-degree) cubature rule
With $\mathbf S$ any matrix square root satisfying $\mathbf S\mathbf S^{\mathsf T}=n\mathbf P$, the cubature points and weights are
$$
\boldsymbol\xi_i = \hat{\mathbf x}+[\mathbf S]_i, \qquad \boldsymbol\xi_{n+i}=\hat{\mathbf x}-[\mathbf S]_i \quad (i=1,\ldots,n), \qquad w_i=\frac1{2n}\ \ \text{for every }i.
$$
Propagate each point through the true, unmodified $\mathbf g$ and reconstruct mean and covariance exactly as the unscented transform does, with these points and these — uniform, always positive — weights.
:::

This rule is not motivated by matching Taylor series terms the way the scaled unscented transform was. It comes from a numerical-integration argument: the mean and covariance the predict and update steps need are both Gaussian-weighted integrals, $\int \mathbf g(\mathbf x)\,\mathcal N(\mathbf x;\hat{\mathbf x},\mathbf P)\,d\mathbf x$ and its second-moment analogue, and the $2n$ points above are exactly the points a *third-degree spherical-radial cubature rule* — a standard numerical-integration recipe for this specific kind of integral — would choose to make the rule exact for any polynomial integrand up to degree three. Different derivation, but notice immediately what is missing: no $\alpha$, no $\beta$, no $\kappa$, and no free central point. Every weight is positive and identical, which by itself already avoids the extreme-cancelling-weights concern the previous lesson raised for small $\alpha$.

::: example The cubature points are the UKF's own points, with one specific tuning
Set $\alpha=1$ and $\kappa=0$ in the scaled unscented transform's own formula: $\lambda=\alpha^2(n+\kappa)-n=1^2(n+0)-n=0$ exactly, for *any* $n$. The central weight $W_0^{(m)}=\lambda/(n+\lambda)=0/n=0$: the center sigma point still exists, but it contributes nothing to the mean. The spread factor becomes $\sqrt{n+\lambda}=\sqrt n$ — exactly the cubature rule's scale. Building both point sets on a real $3\times3$ covariance:

$$
\mathbf P = \mathbf A\mathbf A^{\mathsf T}+2\mathbf I, \qquad \mathbf A=\begin{pmatrix}2.041 & -2.556 & 0.418\\ -0.568 & -0.453 & -0.216\\ -2.020 & -0.232 & -0.865\end{pmatrix}
$$

The six non-central UKF sigma points ($\alpha=1,\beta=2,\kappa=0$) and the six cubature points, computed independently from the two different formulas, agree to $16$ decimal digits — **exactly**, to the last bit of floating-point precision, not merely approximately. The UKF's non-central weight is $W_i^{(m)}=1/(2(n+\lambda))=1/(2n)=1/6=0.166667$, identical to the cubature weight $w_i=1/(2n)$.
:::

```python
import numpy as np

def sigma_points_ukf(x, P, alpha, beta, kappa):
    n = len(x); lam = alpha**2*(n+kappa) - n
    S = np.linalg.cholesky((n+lam)*P)
    chi = np.zeros((2*n+1, n)); chi[0] = x
    for i in range(n):
        chi[i+1] = x+S[:, i]; chi[n+i+1] = x-S[:, i]
    Wm = np.full(2*n+1, 1.0/(2*(n+lam))); Wc = Wm.copy()
    Wm[0] = lam/(n+lam); Wc[0] = lam/(n+lam) + (1-alpha**2+beta)
    return chi, Wm, Wc

def cubature_points(x, P):
    n = len(x); S = np.linalg.cholesky(n*P)
    pts = np.zeros((2*n, n))
    for i in range(n):
        pts[i] = x+S[:, i]; pts[n+i] = x-S[:, i]
    return pts, np.full(2*n, 1.0/(2*n))

n = 3
rng = np.random.default_rng(3)
x = np.array([1.0, -2.0, 0.5])
A = rng.standard_normal((n, n)); P = A@A.T + 2*np.eye(n)
chi, Wm, Wc = sigma_points_ukf(x, P, alpha=1.0, beta=2.0, kappa=0.0)
pts, w = cubature_points(x, P)
print(np.max(np.abs(chi[1:] - pts)))   # 0.0 -- exact match
print(Wm[0], Wc[0])                     # 0.0  2.0
```

## The one real difference: the beta term

If the non-central points and weights are identical, what distinguishes the two filters at all? The **center point's covariance weight**. The UKF's is $W_0^{(c)}=\lambda/(n+\lambda)+(1-\alpha^2+\beta)$; at $\lambda=0$, $\alpha=1$, this reduces to exactly $\beta$ — nonzero whenever $\beta\neq0$, and $\beta=2$ for a Gaussian prior is the standard, recommended choice. That center point carries zero weight in the *mean* reconstruction (since $W_0^{(m)}=0$) but a weight of $\beta=2$ in the *covariance* reconstruction — a genuine, if small, correction that encodes prior knowledge of the Gaussian's fourth moment. The cubature rule has no center point at all, so it has no analogous term: it is, in this precise sense, the $\alpha=1,\kappa=0,\beta=0$ member of the unscented family, with the additional simplification that the (zero-weighted-for-the-mean, but present) center point is dropped from the point set entirely rather than merely carrying zero mean-weight.

::: example The polar-to-Cartesian transform, once more, with cubature points
Apply the cubature rule to this module's running range-and-bearing-to-Cartesian problem: $(r,\theta)\sim\mathcal N\big((1000\,\mathrm m,30^\circ),\ \operatorname{diag}(50^2\,\mathrm m^2,15^{\circ\,2})\big)$. The mean, $(836.68,\,483.06)\,\mathrm m$, is *identical* to the previous lesson's $\alpha=1$ unscented result — expected, since the center point never contributed to either mean. The covariance,
$$
\begin{pmatrix}19{,}102 & -26{,}767\\-26{,}767 & 50{,}010\end{pmatrix}\mathrm{m^2},
$$
has a Frobenius error against the five-million-sample Monte Carlo truth of $1553$ — smaller than the $\alpha=1$ unscented result's error of $1904$ from the previous lesson, though larger than nothing at all. Dropping the $\beta=2$ correction happened to bring the covariance estimate slightly closer to the Monte Carlo truth on this particular problem; that is a fact about this specific nonlinearity's higher moments, not a general proof that $\beta=0$ is a better choice than $\beta=2$. The role $\beta$ plays is to encode a *generic* Gaussian correction that is correct on average across the space of nonlinear functions it is designed for, not one guaranteed to help on every individual case.
:::

```python
def polar_to_cart(rt):
    r, th = rt
    return np.array([r*np.cos(th), r*np.sin(th)])

mean0 = np.array([1000.0, np.radians(30.0)])
P0 = np.diag([50.0**2, np.radians(15.0)**2])
pts, w = cubature_points(mean0, P0)
Y = np.array([polar_to_cart(p) for p in pts])
y_mean = w @ Y
y_cov = sum(w[i]*np.outer(Y[i]-y_mean, Y[i]-y_mean) for i in range(len(w)))
print(y_mean, y_cov)
# [836.68465469 483.06011061]
# [[19101.85 -26767.13] [-26767.13 50009.87]]
```

::: key CKF as a special case, stated precisely
The cubature Kalman filter's point set is exactly the unscented transform's sigma points at $\alpha=1,\ \kappa=0$, with the zero-mean-weight center point dropped. The two filters therefore share every mean estimate the $\alpha=1,\kappa=0$ tuning of the UKF would produce, and differ only in the covariance's center-point correction, which the UKF calls $\beta$ and the CKF fixes, implicitly, at $0$.
:::

::: warning "No tuning parameters" is a trade, not a pure win
The CKF's fixed weights avoid the small-$\alpha$ cancellation concern entirely — every weight is positive and equal, so there is no analogue of the previous lesson's $\pm10^6$-magnitude weights to worry about. What is given up is exactly the flexibility that made those parameters useful in the first place: there is no way to shrink the spread for a nonlinearity that is only trustworthy very close to the mean, the way a small $\alpha$ allows, and no way to encode known non-Gaussian kurtosis the way $\beta$ does. Choosing between them is choosing between "one fixed, unparameterized rule that behaves predictably" and "a tunable family that can be matched more closely to what is actually known about a given problem, at the cost of a parameter someone has to set correctly."
:::

## Check yourself

::: check
For $n=6$ states, how many points does the cubature rule use, and how does this compare with the unscented transform's point count?
:::

::: answer
The cubature rule uses $2n=12$ points, with no central point at all. The unscented transform uses $2n+1=13$ points for the same $n$ — one more than the cubature rule — but at the $\alpha=1,\kappa=0$ tuning that makes the two rules coincide, that extra central point carries zero weight in the mean reconstruction, so the two rules produce the same mean from effectively the same $12$ points either way.
:::

::: check
Explain why the demonstrated agreement between the UKF's non-central sigma points and the cubature points, at $\alpha=1,\kappa=0$, is described as exact rather than approximate.
:::

::: answer
Both point sets reduce, algebraically, to $\hat{\mathbf x}\pm[\mathbf S]_i$ with $\mathbf S\mathbf S^{\mathsf T}=n\mathbf P$: the unscented transform's spread factor $\sqrt{n+\lambda}$ equals $\sqrt n$ exactly when $\lambda=\alpha^2(n+\kappa)-n=0$, which holds exactly at $\alpha=1,\kappa=0$ for any $n$ — not approximately, since $1^2\cdot(n+0)-n=0$ is an exact algebraic identity. The two formulas are therefore computing the identical quantity from the identical covariance, so any numerical library implementing both (with a consistent choice of matrix square root) should agree to the full precision of the arithmetic, which is exactly what the worked example's sixteen-digit agreement demonstrates.
:::

::: check
A filter designer wants a UKF whose covariance-update weight exactly matches the cubature filter's, without switching filters. What single parameter change accomplishes this, starting from the standard $\alpha=1,\beta=2,\kappa=0$ tuning?
:::

::: answer
Setting $\beta=0$ while keeping $\alpha=1,\kappa=0$: this makes $W_0^{(c)}=\lambda/(n+\lambda)+(1-\alpha^2+\beta)=0+(1-1+0)=0$, removing the center point's contribution to the covariance reconstruction entirely and leaving every remaining weight identical to the cubature rule's — reproducing the CKF's covariance formula exactly while still nominally running "the UKF," which is exactly the sense in which the CKF is a special case rather than a separate algorithm.
:::

::: check
In the polar-to-Cartesian worked example, the cubature filter's mean matched the $\alpha=1$ unscented result exactly. Is this a coincidence specific to this problem, or a general property?
:::

::: answer
A general property, not a coincidence: since the center sigma point carries zero mean-weight whenever $\lambda=0$ (which happens at $\alpha=1,\kappa=0$ regardless of what function is being propagated), the mean reconstruction $\sum_i W_i^{(m)}\mathbf y_i$ never actually uses the value $\mathbf g(\boldsymbol\chi_0)$ at all in that tuning — it is computed entirely from the same $2n$ non-central points the cubature rule also uses, with the same weights, so the two means must agree exactly for any nonlinearity $\mathbf g$, not merely for this particular polar-to-Cartesian map.
:::

::: check
Would you expect the cubature Kalman filter to be more or less exposed than a small-$\alpha$ UKF to the kind of large-cancelling-weight numerical concern raised in the previous lesson? Justify your answer from the weight formulas themselves.
:::

::: answer
Less exposed. Every cubature weight is exactly $1/(2n)$ — positive, identical, and bounded well away from either extreme regardless of $n$ — so there is no analogue of the UKF's $W_i^{(m)}\sim1/\alpha^2$ growth or its large, negative central weight that must cancel against the others to sum to one. The cubature rule's total weight sums to one as a simple consequence of having $2n$ equal terms each worth $1/(2n)$, with no cancellation involved at all, which is exactly the numerical-conditioning benefit this lesson's "no tuning parameters" framing is pointing at.
:::

## Summary

| Item | Statement |
| --- | --- |
| Cubature rule | $2n$ points, $\hat{\mathbf x}\pm[\mathbf S]_i$ with $\mathbf S\mathbf S^{\mathsf T}=n\mathbf P$, equal weights $1/(2n)$; no central point, no tuning parameters |
| Origin | A third-degree spherical-radial cubature rule for Gaussian-weighted integrals — a different derivation from the unscented transform's Taylor-moment matching |
| Exact relationship to the UKF | Identical to the UKF's non-central sigma points and weights at $\alpha=1,\kappa=0$ (verified to full floating-point precision); differs only in the dropped center point's covariance contribution |
| $\beta$ versus the CKF | UKF's center covariance weight reduces to exactly $\beta$ at this tuning; CKF has no analogous term, equivalent to fixing $\beta=0$ |
| Worked comparison | On the polar-to-Cartesian problem, CKF and $\alpha=1$ UKF share an identical mean; CKF's covariance Frobenius error ($1553$) was slightly smaller than the $\beta=2$ UKF's ($1904$) on this specific case |
| Trade-off | No cancellation-prone weights, but also no way to tune spread or encode known non-Gaussian kurtosis the way $\alpha$ and $\beta$ allow |

Every filter this module has built so far — EKF, UKF, CKF — shares one assumption underneath all their differences: the posterior is a single Gaussian, however it gets pushed through the nonlinearity. The next lesson leaves that assumption behind entirely, with a filter that represents the posterior as a cloud of weighted samples instead of one mean and one covariance.
