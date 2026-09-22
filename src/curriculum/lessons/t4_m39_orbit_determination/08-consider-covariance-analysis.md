---
id: l08-consider-covariance-analysis
title: Consider-covariance analysis
minutes: 12
covers:
  - Consider-covariance analysis
---

The previous lesson ended with a third option for an uncertain parameter, after solving for it directly and absorbing it generically with process noise: leave it out of the state entirely, but do not pretend it is perfectly known either. A station's range bias, an unmodelled fraction of the drag coefficient, a gravity field coefficient truncated from the force model — any of these can be too poorly observed by a given arc to solve for sensibly, or simply not worth the extra state for a routine fit, without being zero. Consider-covariance analysis is the honest middle ground: the estimate does not change, but the reported covariance does, by exactly the amount the unconsidered parameter's own uncertainty deserves.

## Where the naive covariance goes wrong

Suppose the true measurement model is $\mathbf y=\mathbf H_x\mathbf x+\mathbf H_c\mathbf c+\mathbf v$, where $\mathbf c$ is a parameter — a bias, a coefficient — that the estimator does not solve for at all, fixing it at some nominal value $\bar{\mathbf c}$ (commonly zero, for a bias) instead. The WLS estimator built from $\mathbf H_x$ alone gives
$$
\delta\hat{\mathbf x} = \boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\,\delta\mathbf y, \qquad \boldsymbol\Lambda=\mathbf H_x^\mathsf T\mathbf W\mathbf H_x,
$$
exactly the normal-equations solution from the batch lesson. But the *actual* residual the data carries is $\delta\mathbf y=\mathbf H_c(\mathbf c-\bar{\mathbf c})+\mathbf v$ (linearizing about the true $\mathbf x$, so the $\mathbf H_x\mathbf x$ term drops out) — a bias term the estimator has no way to distinguish from a genuine state error, plus ordinary noise. Substituting,
$$
\delta\hat{\mathbf x} = \underbrace{\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c}_{\mathbf S}\,(\mathbf c-\bar{\mathbf c}) + \boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf v.
$$
$\mathbf S$ is the **sensitivity matrix** — how much the state estimate moves for a given error in the unconsidered parameter. Taking the covariance of both (independent) terms, with $\mathbf P_{cc}$ the prior uncertainty on $\mathbf c$ and $\mathbf W=\mathbf R^{-1}$ as usual,
$$
\operatorname{Cov}(\delta\hat{\mathbf x}) = \boldsymbol\Lambda^{-1} + \mathbf S\mathbf P_{cc}\mathbf S^\mathsf T.
$$

::: key The consider covariance
$$
\mathbf P_{xx}^{\text{consider}} = \boldsymbol\Lambda^{-1} + \mathbf S\mathbf P_{cc}\mathbf S^\mathsf T, \qquad \mathbf S=\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c.
$$
The estimate $\hat{\mathbf x}$ itself is unchanged from ordinary WLS — the fit still only solves for $\mathbf x$ — but the covariance gains a second term, always positive semi-definite, that grows with how sensitive the fit is to the unconsidered parameter ($\mathbf S$) and how uncertain that parameter really is ($\mathbf P_{cc}$). $\boldsymbol\Lambda^{-1}$ alone, the "naive" covariance, is a lower bound that is only honest when $\mathbf P_{cc}=\mathbf 0$.
:::

## A station bias, considered rather than solved

::: example Consider covariance versus what actually happens
The same three-pass, twelve-hour tracking arc as the batch lesson, with a station range bias of unknown true value (assume-zero-mean, $\sigma_{\text{bias}}=5\,\mathrm m$, never solved for) added to the measurement model. Building $\mathbf H_x$ (the usual $6$-column design matrix, canonical units) and $\mathbf H_c$ (one column, equal to $1$ on every range row and $0$ on every range-rate row, since a range bias does not affect range-rate):

```python
# naive (Lambda^-1 only)      epoch sigma:  pos (m) = [0.204, 0.114, 0.096]   vel (mm/s) = [0.053, 0.700, 0.077]
# consider (+ S Pcc S^T)      epoch sigma:  pos (m) = [0.276, 0.157, 0.126]   vel (mm/s) = [0.053, 0.980, 0.091]
# Monte Carlo (3000 trials,
#  true bias drawn each time,
#  estimator never told)      epoch sigma:  pos (m) = [0.269, 0.153, 0.125]   vel (mm/s) = [0.052, 0.958, 0.090]
```

The consider covariance predicts the Monte Carlo result to within a few percent everywhere; the naive covariance understates the true scatter in every component, by as much as $40\,\%$ in one velocity component. The estimate itself does not move — the Monte Carlo trials use the exact same estimator, with the exact same $\mathbf H_x$, that produced the naive covariance in the first place — only the *honest description of how much that estimate actually varies* changes, because a real, uncertain bias was present in the data and never accounted for.
:::

## When the unconsidered parameter is dynamical, not just a bias

A parameter entering through the *dynamics* rather than a fixed measurement offset works exactly the same way, with $\mathbf H_c$ built from the sensitivity of the state to that parameter — $\partial\mathbf x(t)/\partial c$, propagated alongside the trajectory the same way $\boldsymbol\Phi$ is — instead of a constant column.

::: example An unconsidered drag coefficient, and how much it actually costs
Repeating the construction with the ballistic/drag parameter from the process-noise lesson as the unconsidered $c$ ($\sigma_B=0.003\,\mathrm{m^2/kg}$, never solved for, never given process noise — exactly the situation the previous lesson's "$\mathbf Q=0$" case was in, examined now through its effect on the *covariance* rather than the residuals):

```python
# naive epoch sigma:     pos (m) = [1.83, 1.03, 0.87]     vel (mm/s) = [0.53, 6.18, 0.72]
# consider epoch sigma:  pos (m) = [187., 53.8, 107.]      vel (mm/s) = [76.8, 356., 48.1]
# Monte Carlo:            pos (m) = [186., 53.3, 106.]      vel (mm/s) = [76.2, 353., 47.7]
```

Here the naive and consider covariances do not merely disagree by tens of percent — they disagree by one to two *orders of magnitude*. A drag uncertainty small enough to seem safely ignorable turns out to dominate the true uncertainty in this fit completely, once its effect is allowed to propagate through $\mathbf S$ into every state component. This is the quantitative version of the previous lesson's residual-structure argument: the same unmodelled force that leaves a visible trend in the residuals when ignored also leaves the reported covariance wrong by a large factor when its uncertainty is not considered, even in a fit whose residuals happen to look acceptable.
:::

::: warning A small parameter uncertainty does not mean a small consider correction
Nothing about $\sigma_c$ being modest guarantees $\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$ is modest — that correction depends on $\mathbf S$ as much as on $\mathbf P_{cc}$, and $\mathbf S$ can be large precisely when the state is *not* well separated from the unconsidered parameter's effect by the tracking geometry. The drag example above used a smaller relative parameter uncertainty than the station-bias example and produced a far larger covariance correction, because this particular arc's geometry happens to alias a drag-driven acceleration into the state much more strongly than it aliases a fixed range bias. There is no shortcut for actually computing $\mathbf S$.
:::

## Consider covariance does not change the answer, only its honesty

It is worth being precise about what considering a parameter does and does not do. It does not improve the estimate — $\hat{\mathbf x}$ is bit-for-bit whatever plain WLS on $\mathbf H_x$ alone produces, considered or not. It does not require guessing the parameter's *value* — only a prior on its *uncertainty*, $\mathbf P_{cc}$, is needed, and if that prior is wrong the consider covariance is wrong in the same proportion. What it buys is a covariance that will not silently understate risk: a conjunction-probability calculation or a downstream filter that consumes $\boldsymbol\Lambda^{-1}$ alone is trusting a number that assumed every unconsidered parameter in the force and measurement models is perfectly known, which is never quite true, and the drag example above shows just how badly that assumption can fail even when every individual parameter's own uncertainty looks unremarkable.

## Check yourself

::: check
Explain why $\mathbf S=\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c$ is called a sensitivity matrix, using its role in the derivation of $\delta\hat{\mathbf x}$.
:::

::: answer
$\mathbf S$ is exactly the coefficient multiplying $(\mathbf c-\bar{\mathbf c})$ in the expression for $\delta\hat{\mathbf x}$: it says how much the state estimate shifts per unit error in the unconsidered parameter, i.e. $\partial\hat{\mathbf x}/\partial\mathbf c$ for the linear estimator being used. That is precisely what "sensitivity" means here — not the sensitivity of a measurement to the state (that is $\mathbf H_x$ or $\mathbf H_c$), but the sensitivity of the already-computed *estimate* to an error in a parameter that estimate never directly saw.
:::

::: check
A colleague argues that since the consider covariance never changes $\hat{\mathbf x}$, it is purely a reporting exercise with no operational consequence. Use the drag example to argue against this.
:::

::: answer
The estimate not changing does not make the consideration inconsequential: any downstream use of the covariance — a conjunction probability, a hand-off uncertainty to another tracking asset, a decision about how much manoeuvre margin to carry — depends on the *reported* uncertainty, not on the point estimate alone. In the drag example, using the naive covariance instead of the consider covariance would report position uncertainty smaller than the truth by roughly a factor of $100$, which could make a genuinely risky conjunction look negligible, or make an achievable rendezvous accuracy look like it requires far less margin than it does. The estimate is the same either way; the decisions made from it are not.
:::

::: check
Why does the consider-covariance correction use $\mathbf H_x^\mathsf T\mathbf W\mathbf H_c$ rather than, say, $\mathbf H_c^\mathsf T\mathbf W\mathbf H_c$ on its own?
:::

::: answer
The correction has to capture how an error in $\mathbf c$ leaks *into the state estimate through the same estimator that processes the real data* — the sensitivity $\mathbf S$ is $\partial\hat{\mathbf x}/\partial\mathbf c$, and $\hat{\mathbf x}$ is built from $\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W$ applied to the residual. Substituting the residual's $\mathbf H_c(\mathbf c-\bar{\mathbf c})$ piece through that same map is exactly where $\mathbf H_x^\mathsf T\mathbf W\mathbf H_c$ comes from; $\mathbf H_c^\mathsf T\mathbf W\mathbf H_c$ alone would describe how well the data constrains $\mathbf c$ *if it were being solved for*, a different and unrelated quantity — this estimator never solves for $\mathbf c$ at all.
:::

::: check
Under what condition does the consider covariance reduce exactly to the naive covariance $\boldsymbol\Lambda^{-1}$?
:::

::: answer
When $\mathbf P_{cc}=\mathbf 0$ — that is, when the "unconsidered" parameter is in fact known exactly, with no uncertainty at all. In that case $\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$ vanishes regardless of how large $\mathbf S$ is, and $\mathbf P_{xx}^{\text{consider}}=\boldsymbol\Lambda^{-1}$ exactly, confirming that the naive covariance is the special case of considering a parameter whose uncertainty happens to be zero, not a fundamentally different calculation.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf y=\mathbf H_x\mathbf x+\mathbf H_c\mathbf c+\mathbf v$ | True model; $\mathbf c$ fixed at $\bar{\mathbf c}$ by the estimator, never solved for |
| $\mathbf S=\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c$ | Sensitivity of the estimate to the unconsidered parameter |
| $\mathbf P_{xx}^{\text{consider}}=\boldsymbol\Lambda^{-1}+\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$ | Honest covariance; reduces to $\boldsymbol\Lambda^{-1}$ only when $\mathbf P_{cc}=\mathbf 0$ |
| Estimate unchanged | Considering a parameter never alters $\hat{\mathbf x}$, only the reported uncertainty around it |
| Small $\sigma_c$ does not imply small correction | The correction depends on $\mathbf S$ as much as $\mathbf P_{cc}$; a well-aliased small uncertainty can dominate |

Solve for it, absorb it with process noise, or consider it — this module has now built all three answers to an uncertain parameter. The next lesson turns to the data itself: what a fit does when some of the observations feeding it are simply wrong.
