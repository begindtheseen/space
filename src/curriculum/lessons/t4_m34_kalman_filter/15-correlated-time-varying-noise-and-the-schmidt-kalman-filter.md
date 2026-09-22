---
id: l15-correlated-time-varying-noise-and-the-schmidt-kalman-filter
title: Correlated and time-varying noise; the Schmidt-Kalman consider filter
minutes: 24
covers:
  - Correlated and time-varying noise; the Schmidt-Kalman consider filter
---

Four assumptions closed the stochastic model in the stochastic-model lesson: $\mathbf{w}$ and $\mathbf{v}$ each white, the two mutually independent, and the initial state independent of both. Every lesson since has quietly relied on all four. This lesson removes two of them in turn — mutual independence, and whiteness — and then spends its last part on a filter built for a situation none of the last fourteen lessons has needed: a state you cannot safely ignore and should not try to estimate either.

## When process and measurement noise share a cause

Suppose $\mathbb{E}[\mathbf{w}_k\mathbf{v}_k^{\mathsf{T}}] = \mathbf{M} \neq \mathbf{0}$ — the process noise driving $\mathbf{x}_{k+1}$ and the noise corrupting $\mathbf{z}_k$ arise, in part, from a shared source. This is not exotic: a continuous system sampled at a single rate often has exactly this structure, since the same underlying disturbance can enter both the dynamics and whatever is being measured of them.

The update at step $k$ itself is untouched: $\mathbf{v}_k$ is uncorrelated with $\mathbf{e}_k^-$ (built entirely from data through step $k-1$, before $\mathbf{w}_k$ or $\mathbf{v}_k$ exist), so the ordinary gain and update formulas apply exactly as before. What changes is the *next* predict step. $\mathbf{w}_k$ is no longer mean-zero given everything through step $k$, because $\mathbf{z}_k$ now carries information about it through the correlation with $\mathbf{v}_k$. Its correlation with the innovation $\boldsymbol{\nu}_k = \mathbf{H}\mathbf{e}_k^- + \mathbf{v}_k$ is $\operatorname{Cov}(\mathbf{w}_k, \boldsymbol{\nu}_k) = \mathbf{H}\operatorname{Cov}(\mathbf{w}_k,\mathbf{e}_k^-) + \operatorname{Cov}(\mathbf{w}_k,\mathbf{v}_k) = \mathbf{0} + \mathbf{M} = \mathbf{M}$, so the best linear estimate of $\mathbf{w}_k$ given the innovation is $\mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$ — the same linear-regression argument the minimum-variance lesson used throughout.

::: key The correlated-noise predict step
$$
\hat{\mathbf{x}}_{k+1}^- = \mathbf{F}\hat{\mathbf{x}}_k^+ + \mathbf{G}\mathbf{u}_k + \mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k.
$$
The extra term uses the same innovation the update just consumed, scaled by the process-measurement cross-covariance rather than the state gain. Ignoring it when $\mathbf{M}\neq\mathbf{0}$ discards real, available information about the very next step's process noise.
:::

The matching covariance is longer (propagating $\mathbf{e}_{k+1}^-$ and taking its variance picks up several cross-terms between $\mathbf{K}_k$, $\mathbf{M}$ and $\mathbf{S}_k$) but follows the identical technique used for every covariance in this module — expand the error, take its second moment, use whiteness to kill the cross-terms that vanish and keep the ones that do not.

::: example A correlated pair, and the cost of pretending it is not there
Take a two-state system with $\mathbf{M} = (0.05,\ 0.02)^{\mathsf{T}}$ — a real, checked cross-covariance between $\mathbf{w}_k$ and the scalar $v_k$ (the full $3\times3$ joint covariance of $(\mathbf{w}_k, v_k)$ has eigenvalues $0.010$, $0.049$, $0.310$, all positive, confirming it is a valid joint covariance to begin with). Run $400$ independent Monte Carlo trials of two filters against identical correlated noise: one applying the corrected predict step above, one using the ordinary predict step as though $\mathbf{M}$ were zero. Averaged NEES over the settled portion of the run, against a $95\%$ band of $[1.809, 2.201]$ for two states:

| Filter | Mean NEES |
| --- | --- |
| Corrected (M used) | $2.177$ |
| Naive (M ignored) | $1.413$ |

The corrected filter sits close to the ideal value of $2$; the naive filter sits well outside its band, at $1.413$ — badly miscalibrated, though in the *conservative* direction here rather than the dangerous optimistic one, because of the particular sign of this $\mathbf{M}$. (Setting $\mathbf{M}=\mathbf{0}$ in both formulas reproduces the identical filter, to every digit checked — the corrected formula is a strict generalization, not a different filter.) The direction of the miscalibration from ignoring a real correlation is not fixed the way an under- or over-tuned $\mathbf{Q}$'s direction is; what is fixed is that ignoring a real, nonzero $\mathbf{M}$ costs calibration, in whichever direction that particular correlation happens to push it.
:::

## When noise is not white: the rule restated, and tested

The first lesson's rule for a correlated (colored) noise source was direct: it is not noise, it is a state, and it belongs in $\mathbf{x}$ with its own Gauss-Markov dynamics driven by genuinely white noise. That rule needs no new derivation here — only a demonstration that skipping it produces exactly the symptom the consistency-testing lesson built a tool for.

::: example A colored measurement bias, caught by its own innovations
A slowly wandering bias $b$ (correlation time $5$ steps, stationary standard deviation $2.0$) corrupts a position measurement alongside genuine white noise, $R_v=0.5$: $z = x + b + v$. One common shortcut folds $b$'s *stationary* variance into $R$ as though it were extra white noise, $R_{\mathrm{naive}} = R_v + \sigma_b^2 = 2.5$, and ignores $b$ entirely. The correct treatment augments $b$ as an explicit Gauss-Markov state, exactly as the stochastic-model lesson's gyro-bias example did.

Sample innovation autocorrelation over $400$ steps, band $\pm1.96/\sqrt{400}=0.098$:

| Lag | $1$ | $2$ | $3$ | $4$ | $5$ |
| --- | --- | --- | --- | --- | --- |
| Bias ignored | $0.529$ | $0.378$ | $0.254$ | $0.150$ | $0.009$ |
| Bias augmented | $-0.081$ | $0.005$ | $0.031$ | $0.057$ | $-0.079$ |

Folding $b$'s variance into $R$ produces exactly the slow, decaying autocorrelation the consistency-testing lesson's whiteness test is built to catch — lags $1$ through $4$ all outside the band, decaying on roughly the bias's own correlation timescale. Augmenting the state instead produces innovations indistinguishable from white noise at every lag tested, and reduces the RMS position error from $1.637$ to $1.526$ as a smaller side benefit — the state variable, once given somewhere to live, is doing what states do: being estimated, not merely tolerated.
:::

## The Schmidt-Kalman consider filter: the Joseph form's other use

Some nuisance parameters resist both remedies above. A bias correlated with almost nothing observable, or observable only weakly and only over a very long baseline, can be added to the state exactly as the rule prescribes — and the resulting filter can still be a poor engineering choice, because a weakly-observed state's gain is highly sensitive to any error in $\mathbf{Q}$ or $\mathbf{R}$, and a filter that overcommits to a badly-estimated nuisance parameter can let that error leak into every state correlated with it. The **Schmidt-Kalman consider filter** is the answer to a specific, narrower question: how do you let a nuisance parameter's uncertainty correctly inflate everything it touches, without ever letting the filter act on a guess about its value?

The construction is a direct application of a fact already fully proved: the Joseph form, $\mathbf{P}^+=(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}}+\mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$, is valid for **any** gain $\mathbf{K}$, not only the optimal one. Partition the state into an estimated part $\mathbf{x}$ and a *considered* part $\mathbf{y}$ — a nuisance parameter carried in the covariance but never corrected — and choose the gain deliberately:

::: key The consider filter as a constrained Joseph form
$$
\mathbf{K}_{\mathrm{consider}} = \begin{pmatrix}\mathbf{K}_x\\ \mathbf{0}\end{pmatrix},
$$
with $\mathbf{K}_x$ the $\mathbf{x}$-block of the *full*, jointly-optimal gain — computed from the complete joint $\mathbf{P}^-$, cross-covariance with $\mathbf{y}$ included — and the $\mathbf{y}$-block forced to zero. Applying the Joseph form with this gain updates $\hat{\mathbf{x}}$ and correctly propagates every entry of $\mathbf{P}$, including $\mathbf{y}$'s own variance and its cross-covariance with $\mathbf{x}$, while leaving $\hat{\mathbf{y}}$ untouched at every step. The Joseph form's guarantee — valid, symmetric, positive semi-definite for any gain — is exactly what makes deliberately choosing a suboptimal one safe to do.
:::

$\mathbf{K}_x$ still uses the joint covariance, not a version with $\mathbf{y}$ deleted, so $\mathbf{y}$'s uncertainty and its correlation with $\mathbf{x}$ continue to shape how much $\mathbf{x}$ trusts each measurement and how large $\mathbf{P}_x$ is reported to be — the filter behaves as though it knows it does not know $\mathbf{y}$, at every step, without ever spending a degree of freedom trying to pin $\mathbf{y}$ down.

::: example Honest uncertainty, not better accuracy
A directly-relevant quantity $x$ (a weak random walk) is measured only as $z = x + y + v$, where $y$ is an unknown constant bias — completely unresolvable from $x$'s own motion except very slowly, over many measurements, as $x$'s fluctuations average out and leave $y$'s constant offset visible. Compare three treatments over $200$ steps, true $y=3.0$:

| Filter | $x$ RMS error (last 50 steps) | Reported $\sigma_x$ | $(\text{error}/\sigma_x)^2$, averaged |
| --- | --- | --- | --- |
| Full joint estimation of $x,y$ | $0.757$ | $1.074$ | $0.52$ |
| $y$ ignored entirely | $3.16$ | $0.447$ | $50.7$ |
| Consider ($K_y$ forced to zero) | $3.16$ | $2.049$ | $2.42$ |

Full estimation is the most accurate here by a wide margin, because it genuinely learns $y$ over time (converging to $2.3$–$2.5$ against the true $3.0$ across repeated trials) and corrects $x$ accordingly. Ignoring $y$ and considering $y$ reach *similar* point-estimate accuracy — neither one ever uses a measurement to move its belief about $y$ away from its initial guess, so both inherit almost the full, uncorrected bias into $x$. Where they differ sharply is honesty about that fact: ignoring $y$ reports $\sigma_x=0.447$ against a true error of over three metres, a filter confidently wrong by a factor the consistency-testing lesson's tools would catch immediately (a NEES-style ratio of $50.7$ against an ideal of $1$); considering $y$ reports $\sigma_x=2.049$, still imperfect but nowhere near as dangerously miscalibrated, a ratio of $2.4$. The consider filter did not make $x$ more accurate — nothing can, without either resolving $y$ or adding a measurement that does — it made the filter's *claim about its own accuracy* trustworthy despite the unresolved bias.
:::

::: warning Consider filtering is a calibration choice, not a free accuracy gain
The example above is the whole trade-off, stated plainly: full estimation bought better accuracy at the price of betting on a slowly, weakly identifiable parameter, and that bet paid off in this well-behaved simulation. It does not always: the process-noise-tuning lesson already showed how sensitive a filter's behaviour is to a wrong $\mathbf{Q}$, and a weakly observable state's gain is exactly where that sensitivity is sharpest, since a small modelling error there can be amplified into a large, confidently wrong correction to everything correlated with it. Reach for the consider filter when that risk is judged to outweigh the accuracy full estimation could otherwise provide — not as a default, and not because estimating $\mathbf{y}$ is impossible, only because getting it wrong would cost more than never trying.
:::

## Check yourself

::: check
In the correlated-noise predict step, explain why the correction term uses $\mathbf{S}_k^{-1}$ rather than $\mathbf{R}^{-1}$, even though $\mathbf{M}$ is a covariance with $\mathbf{v}_k$ specifically.
:::

::: answer
The correction is the best linear estimate of $\mathbf{w}_k$ given the *innovation* $\boldsymbol{\nu}_k$, not given $\mathbf{v}_k$ directly — $\mathbf{v}_k$ itself is never observed on its own, only through $\boldsymbol{\nu}_k = \mathbf{H}\mathbf{e}_k^-+\mathbf{v}_k$, whose own variance is $\mathbf{S}_k$, not $\mathbf{R}$. The ordinary linear-regression formula for $\mathbb{E}[\mathbf{w}_k\mid\boldsymbol{\nu}_k]$ is $\operatorname{Cov}(\mathbf{w}_k,\boldsymbol{\nu}_k)\operatorname{Var}(\boldsymbol{\nu}_k)^{-1}\boldsymbol{\nu}_k = \mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$, using the variance of the thing actually being conditioned on.
:::

::: check
Why does setting $\mathbf{M}=\mathbf{0}$ in the corrected predict-step formula reduce exactly to the ordinary predict step, rather than merely approximately?
:::

::: answer
The correction term is $\mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$, which is identically the zero vector whenever $\mathbf{M}=\mathbf{0}$, regardless of $\mathbf{S}_k$ or $\boldsymbol{\nu}_k$; the formula was derived as an *addition* to the ordinary predict step to account for information the correlation makes available, not as a different formula that happens to coincide with the old one in a special case. No correlation means no extra information to extract from the innovation about $\mathbf{w}_k$, so the term whose entire job is extracting that information vanishes exactly.
:::

::: check
The colored-bias example folded $b$'s stationary variance into $R$ and found autocorrelated innovations. Would using a *larger* naive $R$ — inflating it further, beyond $\sigma_b^2$ alone — fix the autocorrelation problem?
:::

::: answer
No. Inflating $R$ changes the *gain*, making the filter trust each measurement less overall, but it does nothing to the *shape* of the correlation between consecutive residuals, which comes from $b$ itself persisting from one sample to the next — a purely dynamical fact about $b$'s correlation time, untouched by how large or small a number multiplies the innovation. A larger $R$ would shrink the autocorrelation's absolute scale somewhat (smaller gain means less of $b$'s persistence gets amplified into the state estimate and hence into the residual) but would not remove the correlation structure itself; only giving $b$ its own dynamics, as the augmented filter did, addresses the actual cause.
:::

::: check
In the consider-filter example, why is $\mathbf{K}_x$ computed from the full joint $\mathbf{P}^-$ (including $y$'s row and column) rather than from a version of $\mathbf{P}^-$ with $y$ deleted outright?
:::

::: answer
Deleting $y$ from $\mathbf{P}^-$ before computing $\mathbf{K}_x$ is exactly what the "ignore $y$ entirely" filter did, and the example showed it to be badly overconfident — $\sigma_x=0.447$ against a true error of over three metres. Using the full joint $\mathbf{P}^-$, cross-covariance with $y$ included, is what lets $y$'s real uncertainty correctly inflate $\mathbf{S}_k$ and hence lower $\mathbf{K}_x$ relative to the ignore-$y$ case, and correctly inflate the reported $\mathbf{P}_x$ afterward — the entire benefit of considering $y$ rather than ignoring it lives in keeping $y$'s row and column in the covariance even while its own gain is held at zero.
:::

::: check
A colleague proposes a "partial consider filter": instead of forcing $K_y$ to exactly zero, scale it down by some factor between zero and one. Is the Joseph-form guarantee of a valid, positive semi-definite $\mathbf{P}^+$ still available for this choice?
:::

::: answer
Yes — the Joseph form's guarantee holds for *any* gain matrix at all, which is precisely why the consider filter can force $K_y$ to exactly zero safely in the first place; a partially-scaled $K_y$ is another particular choice of gain, no more and no less valid a choice than zero or the fully optimal value from the Joseph form's point of view. What changes with a partial gain is the *behaviour*, not the covariance's validity: some correction to $\hat{y}$ would now occur each step, trading some of the consider filter's immunity to a badly wrong $y$-estimate for some of full estimation's potential accuracy gain, a genuine middle point on the same trade-off curve the chapter's example plotted at its two ends.
:::

## Summary

| Item | Statement |
| --- | --- |
| Correlated $\mathbf{w},\mathbf{v}$ | Update at step $k$ unchanged; predict gains a term $\mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$; ignoring a real $\mathbf{M}$ costs calibration, direction depending on $\mathbf{M}$'s sign |
| Colored noise | Still the stochastic-model lesson's rule: give it a state and Gauss-Markov dynamics; folding its variance into $R$ leaves a diagnosable autocorrelation signature in the innovations |
| Consider filter | Gain $\mathbf{K}_{\mathrm{consider}}=(\mathbf{K}_x;\mathbf{0})$ in the Joseph form; $\mathbf{y}$'s uncertainty inflates $\mathbf{P}_x$ correctly without ever updating $\hat{\mathbf{y}}$ |
| Consider vs. ignore | Similar point-estimate accuracy for $\mathbf{x}$; consider reports uncertainty honestly (NEES-style ratio $2.4$ vs. $50.7$ for ignoring) |
| Consider vs. full estimation | Full estimation is more accurate when its model of the nuisance parameter is trustworthy; consider trades that potential accuracy for immunity to a badly wrong bet on a weakly observable state |

This closes the linear Kalman filter as this module built it: derived from three directions, run recursively, tuned, driven to its steady state, tested for observability, made numerically bulletproof, diagnosed when it diverges, checked statistically rather than trusted, smoothed in hindsight, refactored for fusion, and finally protected against the one kind of state it should not gamble on. Every technique here assumed the model was linear and the noise Gaussian. The next step — for a vehicle whose dynamics or measurements genuinely are not — belongs to nonlinear filtering: the extended and unscented Kalman filters, particle filters, and the error-state formulations attitude and inertial navigation require, where a sibling module takes the derivations in this one and asks what survives when the straight lines curve.
