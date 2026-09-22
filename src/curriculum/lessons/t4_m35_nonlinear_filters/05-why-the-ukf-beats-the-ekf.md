---
id: l05-why-the-ukf-beats-the-ekf
title: Why the UKF beats the EKF for strong nonlinearity, and the cost
minutes: 20
covers:
  - Why the UKF beats the EKF for strong nonlinearity, and the cost comparison
---

The divergence lesson left a filter in a bad state: an EKF, correctly tuned in every respect, that overshot past a bearing sensor and reported a covariance forty times smaller than its actual error for the rest of a forty-step run. This lesson takes the identical scenario — same true trajectory, same measurements, same process and measurement noise, same starting point — and runs the Unscented Kalman Filter on it instead, cycle for cycle, to see precisely what changes and what does not. Then it prices the difference: the UKF's advantage was never free, and this lesson states exactly what it costs in function evaluations, so the choice between the two filters can be made on evidence rather than on reputation.

## The same collapse, replayed with the UKF

::: example Same data, two filters, at the moment that mattered
Recall the mechanism from the divergence lesson: at step 26 the EKF's predicted position overshot past the sensor, landing step 27's linearization point at a range of only $6.76\,\mathrm m$, where $\mathbf H$'s magnitude is roughly nine times what it was one step earlier. Run the UKF (scaled unscented transform, $\alpha=10^{-3}$, $\beta=2$, $\kappa=0$, as this module's exercises specify) through the identical sequence of measurements:

| step | $r_{\text{true}}\,(\mathrm m)$ | EKF error $(\mathrm m)$ | UKF error $(\mathrm m)$ | EKF NEES | UKF NEES | EKF $\operatorname{tr}\mathbf P$ | UKF $\operatorname{tr}\mathbf P$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | 35.88 | 31.74 | 48.90 | 1.13 | 1.42 | 1587.1 | 2697.1 |
| 26 | 25.53 | 16.50 | 2.66 | 3.94 | 2.73 | 965.5 | 2088.6 |
| 27 | 15.53 | 6.44 | 28.49 | **519.29** | **2.39** | **2.5** | 1325.5 |
| 30 | 19.64 | 4.33 | 19.64 | 184.56 | 1.75 | 0.7 | 561.0 |
| 35 | 71.66 | 15.94 | 10.42 | 137.98 | 2.75 | 3.3 | 173.7 |
| 40 | 122.70 | 26.42 | 8.34 | 97.38 | 1.15 | 11.7 | 334.7 |

The UKF is not magically more accurate at every instant — at step 27 its point error ($28.49\,\mathrm m$) is actually larger than the EKF's ($6.44\,\mathrm m$), because the sigma points genuinely sample a wide, honestly-uncertain region near a sharp measurement nonlinearity and the resulting update is more cautious. What never happens, at any step, is a collapse: $\operatorname{tr}\mathbf P$ for the UKF stays in the hundreds to low thousands throughout, and NEES never exceeds about $3$ across this entire window — against an ideal value of $4$ for a four-state filter, essentially perfect. By step 40 the UKF's position error has fallen to $8.34\,\mathrm m$, continuing to improve as more data arrives, while the EKF remains stuck near $26\,\mathrm m$, unable to use later measurements because its own gain has been throttled by the covariance it wrongly collapsed thirteen steps earlier.
:::

The EKF and UKF implementations, and the $\mathbf F,\mathbf Q,\mathbf H,\mathbf R$ they share, are exactly the ones the divergence and unscented-transform lessons already gave in full; this lesson only changes which sequence of measurements both filters are pointed at, and both are pointed at the identical one.

## The characteristic that decides

Both filters assume the posterior is Gaussian; nothing about the unscented transform changes that assumption, and the UKF is not a remedy for a genuinely non-Gaussian posterior — the particle filter lessons later in this module are. What the unscented transform changes is only *how a Gaussian is pushed through a nonlinearity*. The EKF asks "what does $\mathbf h$ look like at one point, to first order" and applies that single answer to the entire covariance ellipse. The UKF asks "what does $\mathbf h$ actually do to several representative points spread across that same ellipse" and lets the answer be whatever it genuinely is at each of them.

::: key What decides between the EKF and the UKF
The deciding question is how well a single linear approximation, taken at the current estimate, represents $\mathbf h$ (or $\mathbf f$) across the *whole spread* the current covariance describes — not merely at the estimate itself. Near the sensor in this lesson's scenario, the bearing measurement's sensitivity changes by an order of magnitude across a region the filter's own uncertainty ellipse was large enough to cover; a single linearization there is not describing the same function the true state actually experiences. The unscented transform does not need that single description to be accurate, because it never relies on one.
:::

## What the statistics say across many trials

::: example Fifty trials, and an honest reading of the advantage
Repeat the identical scenario across fifty independent noise realizations (the same batch the divergence lesson used, one trial excluded because its ordinary-form UKF covariance went briefly indefinite at an unusually close approach — precisely the square-root-UKF motivation from the previous lesson):

| | EKF | UKF |
| --- | --- | --- |
| mean, last-10-step NEES | $48.68$ | $3.80$ |
| median, last-10-step NEES | $3.83$ | $3.40$ |
| worst-case, last-10-step NEES | $1813.58$ | $9.35$ |
| trials exceeding $5\times$ ideal NEES | $4/49$ | $0/49$ |
| final-position RMSE | $26.30\,\mathrm m$ | $12.72\,\mathrm m$ |
| final-position median error | $11.70\,\mathrm m$ | $11.29\,\mathrm m$ |

Read the median rows first: $3.83$ against $3.40$ NEES, $11.70\,\mathrm m$ against $11.29\,\mathrm m$ final error — on a *typical* run, the two filters are close, and the UKF's edge is modest. Read the worst-case row next: $1813.58$ against $9.35$ — on the trials that go badly, the two filters are not close at all. The UKF's real advantage in this scenario is not that it tracks noticeably better on an easy day; it is that it does not have the EKF's rare, catastrophic failure mode at all. That is precisely why the mean NEES ($48.68$ against $3.80$) and the mean RMSE ($26.30\,\mathrm m$ against $12.72\,\mathrm m$) look far more dramatic than the median figures — both means are being pulled by the handful of EKF collapses, exactly as the divergence lesson's own fifty-trial statistic was.
:::

## Pricing the difference

None of this is free. Count what each filter actually evaluates per cycle, for the $n=4$ state used throughout this scenario:

::: key Cost comparison
The EKF evaluates $\mathbf f$ once and $\mathbf h$ once per cycle, plus one analytic (or finite-difference) Jacobian of each. The UKF evaluates $\mathbf f$ at $2n+1$ sigma points for the predict step and $\mathbf h$ at $2n+1$ (possibly re-drawn) sigma points for the update step, computing **no** Jacobian of either — for $n=4$, nine evaluations of each function against the EKF's one. The UKF additionally needs a matrix square root (Cholesky factorization, $O(n^3)$) at least once per cycle to build the sigma points.
:::

Whether $2n+1$ evaluations against one, plus a Jacobian, matters in practice depends entirely on what $\mathbf f$ and $\mathbf h$ actually cost to evaluate. For the bearing sensor in this lesson's scenario, both $\mathbf h$ and its Jacobian are a handful of floating-point operations — nine evaluations instead of one is immaterial next to everything else a flight computer does in a cycle. For a dynamics model that itself integrates a stiff, high-fidelity atmospheric or gravitational model — the kind of $\mathbf f$ an orbit-determination or entry-guidance filter might carry — evaluating it nine times per cycle instead of once, with no Jacobian required at all, can be a real, sometimes decisive, computational trade, in either direction: it may cost far more raw compute than an analytic Jacobian would, or it may cost far *less*, if that Jacobian would otherwise have to be derived by hand for a genuinely complicated model, or approximated by finite differences that themselves cost several extra evaluations of $\mathbf f$. There is no universal answer here; there is only the specific cost of the specific $\mathbf f$ and $\mathbf h$ a given problem carries, weighed against how much the accuracy and consistency gains demonstrated in this lesson are actually worth for that vehicle.

::: warning "The UKF is more accurate" is not the same claim as "the UKF is always better"
This lesson's own median-case numbers ($3.83$ against $3.40$ NEES; $11.70\,\mathrm m$ against $11.29\,\mathrm m$ error) show a small, not dramatic, typical-case advantage for the UKF on this problem. A design that only ever runs the easy case, with tight computational margins and a cheap, mild nonlinearity, may reasonably choose the EKF and verify directly — with the consistency tests the Kalman filter module built — that the rare failure mode this module has spent two lessons on does not actually arise for its specific geometry and noise levels. The UKF is the safer default when that verification is expensive or the failure mode is unacceptable; it is not a free upgrade with no engineering trade-off attached.
:::

::: warning A UKF that never diverges is not automatically a UKF with no failure modes
The square-root UKF lesson's negative-eigenvalue example came from a UKF run on this exact scenario — the ordinary-form UKF's own arithmetic can still misbehave on a sufficiently extreme case, through a different mechanism (large cancelling weights) than the EKF's linearization-at-a-bad-point collapse. Choosing the UKF over the EKF trades one specific, well-understood failure mode for a different one that is rarer here but not nonexistent, which is exactly why the square-root form exists rather than being an optional refinement.
:::

## Check yourself

::: check
At step 27 in the worked comparison, the UKF's point error was larger than the EKF's. Does this contradict the claim that the UKF handles this scenario better?
:::

::: answer
No. "Better" in this lesson's sense is about the *relationship* between reported uncertainty and actual error — consistency — not about which filter's point estimate happens to be closer at any single instant. At step 27 the UKF's larger error came with an honestly large reported covariance and a NEES of $2.39$, close to the ideal value; the EKF's smaller error at that same step came with a covariance that had recently collapsed to $2.5$, giving a NEES of $519.29$. A single instant's raw error says nothing about whether the filter's own claim about that error is trustworthy, which is exactly why NEES and NIS, not raw error alone, are the right tools for this comparison.
:::

::: check
Explain, using the median-versus-mean figures from the fifty-trial table, why summarizing this comparison with only the mean RMSE would be a misleading way to report it.
:::

::: answer
The mean final-position RMSE ($26.30\,\mathrm m$ EKF against $12.72\,\mathrm m$ UKF) suggests a filter that fails by roughly a factor of two on a typical run, but the median figures ($11.70\,\mathrm m$ against $11.29\,\mathrm m$) show the two filters performing almost identically on the majority of trials; the mean is dominated by a small number of EKF runs with very large errors (the same collapse mechanism the divergence lesson demonstrated), and reporting only the mean would misrepresent a rare, severe failure mode as if it were the filters' typical relative performance.
:::

::: check
For a bearing sensor whose Jacobian and value both cost a few floating-point operations to evaluate, is the $2n+1$-versus-one evaluation count from the cost comparison likely to be an important factor in choosing between the EKF and the UKF?
:::

::: answer
Not by itself. When both $\mathbf h$ and its Jacobian are cheap, the absolute cost difference between one evaluation and nine is negligible next to the rest of a flight computer's workload each cycle, so the deciding factors are the accuracy and consistency properties this lesson measured directly, not raw evaluation count. The evaluation-count argument becomes materially important only when $\mathbf f$ or $\mathbf h$ is itself expensive to compute — a high-fidelity dynamics or sensor model — which is not the case for this lesson's simple bearing sensor.
:::

::: check
A colleague argues that since the UKF requires no Jacobian at all, it is strictly simpler to implement correctly than the EKF, for any given nonlinear model. Is this a fair characterization?
:::

::: answer
Partly, and partly not. It is true that the UKF removes an entire class of implementation bug — a wrong hand-derived or finite-differenced Jacobian, which the EKF fundamentals lesson's finite-difference check exists specifically to catch — by never needing one. It introduces its own implementation surface in exchange: correctly forming sigma points, keeping the $\alpha,\beta,\kappa$ weights and the matrix square root consistent, and, as this module's square-root-UKF material showed, handling a covariance update that is not automatically guaranteed positive semi-definite. "No Jacobian required" is a genuine simplification in one specific place, not a blanket claim that the UKF has fewer ways to go wrong overall.
:::

::: check
Suppose the same bearings-only scenario were re-run with a much larger measurement noise, $\sigma_\theta=10^\circ$ instead of $2^\circ$. Based on what this lesson and the previous one established about the mechanism, would you expect the EKF's collapse near the sensor to become more or less likely, all else equal?
:::

::: answer
Less likely, on the mechanism this module has established: the EKF's covariance collapse near the sensor happened because a poorly-linearized $\mathbf H$, combined with a large predicted innovation, produced an $\mathbf S$ that made a genuinely surprising measurement look unsurprising and triggered an overconfident update. A much larger $\sigma_\theta$ inflates $\mathbf S=\mathbf H\mathbf P^-\mathbf H^{\mathsf T}+\mathbf R$ directly through the $\mathbf R$ term, which damps the resulting gain and makes any single update, however badly linearized, move the estimate less aggressively — reducing the chance of the kind of overshoot that put the estimate near $r=0$ in the first place. This does not make the EKF's linearization any more accurate; it only makes it less likely that one bad update pushes the filter somewhere the inaccuracy is severe.
:::

## Summary

| Item | Statement |
| --- | --- |
| Same-scenario replay | On the divergence lesson's exact trajectory and measurements, the UKF never collapsed: $\operatorname{tr}\mathbf P$ stayed in the hundreds throughout, NEES stayed near $1$–$3$, and final error reached $8.34\,\mathrm m$ against the EKF's stuck $26.42\,\mathrm m$ |
| Deciding factor | How well one linearization, taken at the estimate, represents the true function across the *whole* covariance spread — not merely at the estimate itself |
| Fifty-trial statistics | Median performance close between the two filters ($3.83$ vs $3.40$ NEES); mean performance dominated by the EKF's rare catastrophic trials ($48.68$ vs $3.80$ mean NEES) |
| Cost | $2n+1$ evaluations of $\mathbf f$ or $\mathbf h$ and no Jacobian, against $1$ evaluation plus a Jacobian; for $n=4$, nine against one |
| When the cost matters | Negligible for cheap $\mathbf f,\mathbf h$; potentially decisive, in either direction, for expensive high-fidelity models |

Both filters covered so far still assume, in the end, that a single Gaussian is a good enough description of the posterior — the UKF only changes how that Gaussian is pushed through a nonlinearity, not whether one Gaussian is the right shape at all. The next lesson introduces a third way of handling the same underlying integral, built from a different, more restrictive kind of point set, before this module turns to problems where one Gaussian is not the right shape to begin with.
