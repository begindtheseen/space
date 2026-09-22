---
id: l05-maximum-a-posteriori-estimation
title: Maximum a posteriori estimation
minutes: 19
covers:
  - Maximum a posteriori estimation
---

Every estimator so far in this module starts from nothing: before the data arrive, $\mathbf{x}$ could be anything. That is rarely true in practice. A batch orbit determination almost always has an a priori state and covariance carried from the previous solution. A calibration knows the sensor was within its spec envelope when it left the factory. A landing-site position is known to within a kilometre from the map before a single range measurement is taken. **Maximum a posteriori (MAP) estimation** is the rule for folding a belief like this — a prior mean and covariance on $\mathbf{x}$ — together with new data into one estimate, using exactly the Bayes' theorem the probability module derived.

The result looks almost identical to weighted least squares, which is the point: MAP is what WLS becomes once the "no prior information" assumption is dropped, and seeing exactly how it generalizes explains what the prior buys and what it costs.

## From likelihood to posterior

Keep the measurement model $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$, $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, and add a **prior**: before seeing $\mathbf{y}$, treat $\mathbf{x}$ itself as Gaussian, $\mathbf{x}\sim\mathcal{N}(\mathbf{x}_0,\mathbf{P}_0)$, independent of $\mathbf{v}$. Bayes' theorem gives the **posterior** density of $\mathbf{x}$ given the data,

$$
p(\mathbf{x}\mid\mathbf{y}) = \frac{p(\mathbf{y}\mid\mathbf{x})\,p(\mathbf{x})}{p(\mathbf{y})} \;\propto\; p(\mathbf{y}\mid\mathbf{x})\,p(\mathbf{x}),
$$

since $p(\mathbf{y})$ does not depend on $\mathbf{x}$. MAP chooses the $\mathbf{x}$ that maximizes this posterior — the single most probable value given everything known, prior included. Taking $-\log$ of both Gaussian densities and dropping every term that does not involve $\mathbf{x}$,

$$
J_{\mathrm{MAP}}(\mathbf{x}) = \tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) \;+\; \tfrac12(\mathbf{x}-\mathbf{x}_0)^\mathsf{T}\mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0),
$$

the ordinary WLS cost with one extra quadratic term pulling $\mathbf{x}$ toward $\mathbf{x}_0$. Setting the gradient to zero,

$$
-\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) + \mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0) = \mathbf{0}
\;\Longrightarrow\;
\left(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\right)\hat{\mathbf{x}} = \mathbf{P}_0^{-1}\mathbf{x}_0 + \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y},
$$

so

$$
\hat{\mathbf{x}}_{\mathrm{MAP}} = \left(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\right)^{-1}\left(\mathbf{P}_0^{-1}\mathbf{x}_0 + \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}\right) .
$$

::: key MAP estimate with a Gaussian prior
$\hat{\mathbf{x}}_{\mathrm{MAP}} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$: information adds. Prior information $\mathbf{P}_0^{-1}$ plus measurement information $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ gives the posterior information; the posterior mean is the information-weighted combination of what the prior said and what the data say.
:::

## MAP is WLS with the prior treated as one more measurement

The cost $J_{\mathrm{MAP}}$ is exactly the WLS cost of an **augmented** problem: stack $\mathbf{x}_0$ underneath $\mathbf{y}$ as if it were a direct measurement of $\mathbf{x}$ with its own noise $\mathbf{P}_0$,

$$
\tilde{\mathbf{y}} = \begin{pmatrix}\mathbf{y}\\ \mathbf{x}_0\end{pmatrix}, \qquad
\tilde{\mathbf{H}} = \begin{pmatrix}\mathbf{H}\\ \mathbf{I}\end{pmatrix}, \qquad
\tilde{\mathbf{R}} = \begin{pmatrix}\mathbf{R} & \mathbf{0}\\ \mathbf{0} & \mathbf{P}_0\end{pmatrix} .
$$

Ordinary WLS on this stacked system, $(\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{R}}^{-1}\tilde{\mathbf{H}})^{-1}\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{R}}^{-1}\tilde{\mathbf{y}}$, expands block by block to exactly $\hat{\mathbf{x}}_{\mathrm{MAP}}$ above. A prior is not a different kind of object from a measurement; it is a measurement of $\mathbf{x}$ taken before the instrument was turned on, with $\mathbf{H}=\mathbf{I}$ and noise covariance $\mathbf{P}_0$, and everything this module has built for combining measurements — the sandwich formula, the additive information matrix, Gauss-Markov — applies to it unchanged.

::: example A propellant estimate, two ways
Bookkeeping from mass-flow integration gives a prior estimate of remaining propellant, $x_0=100\,\mathrm{kg}$, $\sigma_0=15\,\mathrm{kg}$ (so $\mathbf{P}_0=225\,\mathrm{kg^2}$). A depletion-gauge reading then arrives: $y=80\,\mathrm{kg}$, $\sigma_y=25\,\mathrm{kg}$ ($\mathbf{R}=625\,\mathrm{kg^2}$). Solve for the posterior directly and by stacking the prior as a second measurement of the same scalar:

```python
import numpy as np

x0, sigma0, y, sigma_y = 100.0, 15.0, 80.0, 25.0
P0, R = sigma0**2, sigma_y**2

Lambda_post = 1/P0 + 1/R
x_map = (1/Lambda_post) * (x0/P0 + y/R)

H_aug, R_aug = np.array([[1.0], [1.0]]), np.diag([R, P0])
x_aug = np.linalg.solve(H_aug.T @ np.linalg.inv(R_aug) @ H_aug,
                         H_aug.T @ np.linalg.inv(R_aug) @ np.array([y, x0]))[0]

print(f"direct MAP formula: {x_map:.4f} kg   augmented WLS: {x_aug:.4f} kg")
print(f"posterior sigma: {np.sqrt(1/Lambda_post):.4f} kg")
# direct MAP formula: 94.7059 kg   augmented WLS: 94.7059 kg
# posterior sigma: 12.8624 kg
```

Both routes give $94.71\,\mathrm{kg}$, with posterior $\sigma=12.86\,\mathrm{kg}$ — tighter than either input alone ($15$ and $25\,\mathrm{kg}$), exactly as combining two sensors did in the Gauss-Markov lesson, because that is precisely what this is. The implied weights are $0.7353$ on the prior and $0.2647$ on the new reading, identical in form to that lesson's two-sensor combination. Widen the prior and the estimate slides toward the data alone: with $\mathbf{P}_0=10^2$, $10^6$, $10^{12}\,\mathrm{kg^2}$, $\hat x_{\mathrm{MAP}}$ comes out to $97.24$, $80.0125$, and $80.0000\,\mathrm{kg}$ — converging on the plain WLS answer $y=80\,\mathrm{kg}$ as the prior stops carrying any information, exactly as the additive-information formula predicts when $\mathbf{P}_0^{-1}\to\mathbf{0}$.
:::

## What the posterior covariance means — and does not mean

$\mathbf{P} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ answers a specific question: if $\mathbf{x}$ really were drawn from $\mathcal{N}(\mathbf{x}_0,\mathbf{P}_0)$ and then measured, how uncertain would you be about that particular draw, having seen $\mathbf{y}$? That is the Bayesian posterior covariance, and it is exactly the right quantity to carry forward as the a priori for the next batch, or to hand a Kalman filter as its initial covariance — the Kalman filter module treats this handoff as routine, because a filter's covariance at any time is nothing but a posterior that becomes the next prior.

It answers a *different* question than: for one fixed, particular $\mathbf{x}$, how would the MAP point estimate vary if the experiment were repeated with fresh measurement noise? Substituting the model into the estimator,

$$
\hat{\mathbf{x}}_{\mathrm{MAP}} = \underbrace{\mathbf{P}\left(\mathbf{P}_0^{-1}\mathbf{x}_0 + \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{x}\right)}_{\text{fixed, given the true }\mathbf{x}} + \;\mathbf{P}\,\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{v},
$$

so only the last term varies from trial to trial, with covariance $\mathbf{P}\,\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\,\mathbf{P}$ — the sandwich formula again, and *not* equal to $\mathbf{P}$ unless the prior carries no information. The two covariances answer two different questions and are not interchangeable.

::: example Posterior covariance versus sampling covariance of the point estimate
Reuse a two-parameter fit with $\kappa(\mathbf{H})=1000$ (built exactly as in the earlier ill-conditioned examples), $m=50$, measurement $\sigma=0.02$, and a prior $\mathbf{x}_0=\mathbf{0}$, $\mathbf{P}_0=9\mathbf{I}$. The posterior-covariance formula gives $\mathbf{P}=\operatorname{diag}(4.306,4.306)$ with an off-diagonal of similar size. Two Monte Carlo experiments, $200{,}000$ trials each:

```python
import numpy as np

rng = np.random.default_rng(4)
m = 50
phi = 2e-3
h1 = rng.standard_normal(m); h1 /= np.linalg.norm(h1)
u = rng.standard_normal(m); u -= (u @ h1) * h1; u /= np.linalg.norm(u)
H = np.column_stack([h1, np.cos(phi) * h1 + np.sin(phi) * u])   # cond(H) ~ 1000

sigma = 0.02
Rinv = np.eye(m) / sigma**2
Lambda_data = H.T @ Rinv @ H
P0 = 9.0 * np.eye(2)                        # prior: x0 = 0, sigma_prior = 3
P = np.linalg.inv(np.linalg.inv(P0) + Lambda_data)
K = P @ H.T @ Rinv                          # data part of the MAP gain
N = 200_000

# Trial A: one fixed true x, only measurement noise v varies
x_true = np.array([1.0, 1.0])
y = (H @ x_true)[None, :] + rng.normal(0.0, sigma, size=(N, m))
xhat_A = (K @ y.T).T                        # + P @ inv(P0) @ x0, zero here since x0 = 0
print("Trial A  empirical Cov diag:", np.var(xhat_A, axis=0).round(4))
print("Trial A  sandwich P@Lambda_data@P diag:", np.diag(P @ Lambda_data @ P).round(4))
print("Trial A  trace(P) alone (wrong for this question):", round(np.trace(P), 3))

# Trial B: x itself drawn fresh from the prior N(0, P0) each trial
x_samples = rng.normal(0.0, 3.0, size=(N, 2))
y2 = (x_samples @ H.T) + rng.normal(0.0, sigma, size=(N, m))
xhat_B = (K @ y2.T).T
print("Trial B  empirical Cov(xhat-x) diag:", np.var(xhat_B - x_samples, axis=0).round(4))
print("Trial B  P diag:", np.diag(P).round(4))
# Trial A  empirical Cov diag: [0.185 0.185]
# Trial A  sandwich P@Lambda_data@P diag: [0.1855 0.1855]
# Trial A  trace(P) alone (wrong for this question): 8.613
# Trial B  empirical Cov(xhat-x) diag: [4.2966 4.2965]
# Trial B  P diag: [4.3063 4.3063]
```

The sampling covariance of the estimator, with the true $\mathbf{x}$ held fixed, matches the sandwich formula $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$ to three figures and has a trace more than twenty times smaller than $\operatorname{tr}(\mathbf{P})=8.613$; $\mathbf{P}$ only becomes the right answer once $\mathbf{x}$ is genuinely re-drawn from the prior on every trial, matching the model MAP was derived under, and Trial B confirms that match to within Monte Carlo noise. Reporting $\mathbf{P}$ as "how much the point estimate would move under repeated noise" — a fixed-truth question, the one a hardware-in-the-loop test asks — overstates that particular uncertainty by more than an order of magnitude here.
:::

::: warning Two covariances, not one
$\mathbf{P}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ is the right number to report as *belief about $\mathbf{x}$ given the data and the prior* — the standard, correct use, and what the formula on the flashcard means. It is the wrong number if you Monte Carlo a fixed truth with an engineering prior that was chosen as a regularizer rather than a genuine statistical belief, and compare against the sample covariance of the point estimate: use the sandwich $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$ there instead. No such gap exists without a prior — plain WLS's covariance is simultaneously the right answer to both questions, which is why this subtlety has not come up until now.
:::

## Trading bias for variance

$\hat{\mathbf{x}}_{\mathrm{MAP}}$ is, in the fixed-truth sense, **biased** whenever $\mathbf{x}_0\ne\mathbf{x}$: the bias is $\mathbf{P}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{x})-\mathbf{x}$, which vanishes only if $\mathbf{x}_0=\mathbf{x}$ or $\mathbf{P}_0^{-1}\to\mathbf{0}$. Lesson three's Gauss-Markov theorem promised that no *unbiased linear* estimator beats WLS in variance — and MAP does not contradict that, because MAP is not unbiased. It buys a variance reduction by giving up exactly the property Gauss-Markov's guarantee required, which raises the question of whether the trade is worth it. Total error is best judged by mean squared error, $\mathrm{MSE}=\lVert\text{bias}\rVert^2+\operatorname{tr}(\text{sampling covariance})$, and the ill-conditioned problems of lesson one are exactly where the trade pays most.

::: example MAP against WLS on a badly conditioned fit
Take the $\kappa(\mathbf{H})=1000$ problem above ($m=50$, $\sigma=0.02$, prior $\mathbf{x}_0=\mathbf{0}$, $\sigma_{\mathrm{prior}}=3$), with $\mathrm{tr}(\mathbf{P}_{\mathrm{WLS}})=200.0$ — the near-collinear columns make one direction barely observable, exactly as in the condition-number discussion of lesson one. Compare total MSE, over $200{,}000$ trials of fresh measurement noise, at two different true states:

| True $\mathbf{x}$ | Estimator | Bias | MSE | 
| --- | --- | --- | --- |
| $(1, 1)$ — aligned with the well-observed direction | WLS | $\approx\mathbf{0}$ | $199.5$ |
| $(1, 1)$ | MAP | $\approx\mathbf{0}$ | $0.370$ |
| $(1.3, 0.7)$ — has a component the data barely sees | WLS | $\approx\mathbf{0}$ | $201.4$ |
| $(1.3, 0.7)$ | MAP | $(-0.287,\ 0.287)$ | $0.539$ |

In the first case the prior happens to be exactly right about the poorly observed direction, and MAP wins by a factor of $539$ with essentially no bias at all. In the second, more honest case the true state does have a component the prior did not anticipate, MAP picks up a real, sustained bias of about $0.29$ per component — and still wins by a factor of $373$, because that bias contributes only about $0.17$ to the MSE while the variance WLS pays in the unobserved direction is close to $200$. Only when the prior is both informative (small $\mathbf{P}_0$) and wrong, on a direction the data itself constrain well, does MAP lose to WLS; on the direction the data barely constrain at all, almost any reasonable prior beats not having one.
:::

::: warning A strong, wrong prior can still hurt
The previous example is favourable to MAP because the prior was weak ($\sigma_{\mathrm{prior}}=3$ against data uncertainty near $10$ in the bad direction) and applied to a direction the data could not see. A *strong* prior ($\mathbf{P}_0$ small) placed on a direction the data measure well pulls the estimate toward $\mathbf{x}_0$ regardless of what the data say, and if $\mathbf{x}_0$ is wrong there, the bias is not bounded by ignorance the way it was above — it is imposed. Match the prior's confidence to how much you actually trust it, direction by direction, not to a single convenient scalar.
:::

## Check yourself

::: check
Starting from $J_{\mathrm{MAP}}(\mathbf{x}) = \tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) + \tfrac12(\mathbf{x}-\mathbf{x}_0)^\mathsf{T}\mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0)$, derive $\hat{\mathbf{x}}_{\mathrm{MAP}}$.
:::

::: answer
$\nabla_{\mathbf{x}}J_{\mathrm{MAP}} = -\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) + \mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0)$. Setting it to zero and collecting terms in $\mathbf{x}$: $(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})\mathbf{x} = \mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}$, so $\hat{\mathbf{x}}_{\mathrm{MAP}} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$.
:::

::: check
Explain, without formulas, why treating the prior as "one more measurement" is a legitimate way to think about MAP rather than a loose analogy.
:::

::: answer
Stacking $\mathbf{x}_0$ underneath $\mathbf{y}$ with measurement matrix $\mathbf{I}$ and noise covariance $\mathbf{P}_0$, and solving the resulting problem by ordinary WLS, produces the exact MAP formula when expanded — not an approximation of it. The prior is mathematically indistinguishable from a direct, independent measurement of $\mathbf{x}$ taken with a sensor whose noise covariance happens to be $\mathbf{P}_0$; everything already known about combining measurements — the sandwich covariance formula, additive information — applies to it without modification.
:::

::: check
As $\mathbf{P}_0 \to \infty$ (an infinitely uncertain, uninformative prior), what does $\hat{\mathbf{x}}_{\mathrm{MAP}}$ become, and why does this make sense?
:::

::: answer
$\mathbf{P}_0^{-1}\to\mathbf{0}$, so both the extra term in the information matrix and the $\mathbf{P}_0^{-1}\mathbf{x}_0$ term in the right-hand side vanish, leaving $\hat{\mathbf{x}}_{\mathrm{MAP}}\to(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} = \hat{\mathbf{x}}_{\mathrm{WLS}}$, exactly as the numerical example showed converging to $80\,\mathrm{kg}$. This makes sense: a prior that admits it knows nothing should contribute nothing, and plain WLS is what is left once no prior information is in play.
:::

::: check
Two engineers both compute $\mathbf{P}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ for the same MAP estimate. One reports it as "my uncertainty about $\mathbf{x}$." The other runs a hardware-in-the-loop test with a fixed true $\mathbf{x}$, collects the sample covariance of the estimate over many noise realisations, and finds it much smaller than $\mathbf{P}$. Whose number is wrong?
:::

::: answer
Neither is computing the wrong formula; they are answering different questions. The first engineer's $\mathbf{P}$ is the Bayesian posterior covariance, correct if $\mathbf{x}$ is genuinely treated as drawn from the stated prior. The second engineer is measuring the sampling covariance of the point estimate for one fixed, particular $\mathbf{x}$, which this lesson showed is the smaller sandwich quantity $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$, not $\mathbf{P}$ itself. The hardware-in-the-loop result is not evidence that $\mathbf{P}$ is miscomputed; it is evidence that $\mathbf{P}$ was the wrong quantity for that particular comparison.
:::

::: check
A prior is described as "weak" in one part of this lesson and "strong" in another, with opposite effects on how much MAP can help. What single number in the formula controls this, and what does it mean physically?
:::

::: answer
$\mathbf{P}_0^{-1}$, the prior information, controls it: small $\mathbf{P}_0$ (a tight, confident prior) means large $\mathbf{P}_0^{-1}$, which pulls hard toward $\mathbf{x}_0$ regardless of the data, for better or worse depending on whether $\mathbf{x}_0$ is right; large $\mathbf{P}_0$ (a loose, weak prior) means small $\mathbf{P}_0^{-1}$, which nudges the estimate only in directions the data cannot see for themselves and leaves well-measured directions essentially to the data. A prior's strength should reflect how much it is actually trusted, per direction, not be set to whatever number is numerically convenient.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{x}\sim\mathcal{N}(\mathbf{x}_0,\mathbf{P}_0)$ | Prior belief about $\mathbf{x}$ before the data |
| $J_{\mathrm{MAP}} = \tfrac12\lVert\mathbf{y}-\mathbf{H}\mathbf{x}\rVert^2_{\mathbf{R}^{-1}} + \tfrac12\lVert\mathbf{x}-\mathbf{x}_0\rVert^2_{\mathbf{P}_0^{-1}}$ | Negative log-posterior; WLS cost plus a pull toward the prior |
| $\hat{\mathbf{x}}_{\mathrm{MAP}} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$ | MAP estimate; information adds, prior plus data |
| Augmented system $\tilde{\mathbf{H}}=(\mathbf{H};\mathbf{I})$, $\tilde{\mathbf{R}}=\operatorname{blkdiag}(\mathbf{R},\mathbf{P}_0)$ | The prior is a measurement of $\mathbf{x}$ with $\mathbf{H}=\mathbf{I}$, noise $\mathbf{P}_0$ |
| $\mathbf{P}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ | Bayesian posterior covariance — belief given data and prior |
| $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$ | Sampling covariance of the point estimate, fixed true $\mathbf{x}$; smaller than $\mathbf{P}$ whenever the prior carries information |
| Bias $= \mathbf{P}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{x})-\mathbf{x}$ | Nonzero unless $\mathbf{x}_0=\mathbf{x}$ or the prior is uninformative |
| $\mathrm{MSE} = \lVert\text{bias}\rVert^2 + \operatorname{tr}(\text{sampling covariance})$ | The right criterion for judging whether the bias was worth it |

Every estimator up to here has assumed the measurement model is linear in $\mathbf{x}$. The next lesson drops that assumption and asks how to fit a model where $\mathbf{H}$ itself depends on $\mathbf{x}$ — the far more common situation once a spacecraft's own dynamics, or a sensor's own geometry, enter the picture.
