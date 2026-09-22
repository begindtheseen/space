---
id: l09-tcm-and-linear-covariance
title: Trajectory correction manoeuvres and linear covariance analysis
minutes: 24
covers:
  - trajectory correction manoeuvres
  - linear covariance analysis of targeting errors
---

Every burn this module has discussed so far has been a single, clean event: solve Lambert, fly the answer. A real mission never gets to stop there. The launch vehicle's injection has its own error; the departure burn itself has execution error; navigation only knows the resulting state to some finite precision, not exactly. All of that dispersion has to be found and removed before arrival, and it is removed by small, deliberate burns — trajectory correction manoeuvres, TCMs — scheduled through the cruise using exactly the state transition matrix built up earlier in this module and already put to work in differential correction.

This lesson asks two questions about that process, both answerable with tools already in hand. First: does it matter *when* along the cruise a correction burn happens, for a fixed error to be removed — and if so, how much? Second: without running a Monte Carlo campaign of thousands of simulated trajectories, can a mission predict how large its dispersion at arrival will be, and how large the correction burns will need to be to fix it? The answer to both is the same object: the state transition matrix, propagating a covariance instead of a single perturbation.

## Why TCM timing is a genuine trade

A correction burn at time $t_c$, aimed at a fixed target reached at time $t_f$, needs $\delta\mathbf{v}(t_c) = \boldsymbol{\Phi}_{rv}(t_f,t_c)^{-1}\,\delta\mathbf{r}(t_c)$ — exactly the differential-correction formula from earlier in this module, applied to the sub-arc from the burn to the target. For a *fixed* position error $\delta\mathbf{r}$ to correct, the required $\delta\mathbf{v}$ shrinks as $\boldsymbol{\Phi}_{rv}(t_f,t_c)$ grows, and $\boldsymbol{\Phi}_{rv}$ generally grows with the remaining flight time — more time between the correction and the target gives the correction more "leverage" to redirect the trajectory with a smaller nudge.

::: example Leverage over an Earth–Mars cruise
Take the $270$-day, $C_3\approx8.7\,\mathrm{km^2/s^2}$ transfer from the porkchop-plot lesson as the nominal trajectory, and compute $\boldsymbol{\Phi}_{rv}$ for the sub-arc from a candidate burn day to the fixed $270$-day arrival, for a representative $1\,\mathrm{km}$ position error in the least-favourable direction (the smallest singular value of $\boldsymbol{\Phi}_{rv}$, i.e. the worst-case direction to have to correct):

| Time-to-go at burn | Required $\Delta v$ per $1\,\mathrm{km}$ error |
| --- | --- |
| $260\,\mathrm{d}$ | $1.65\,\mathrm{mm/s}$ |
| $220\,\mathrm{d}$ | $0.187\,\mathrm{mm/s}$ |
| $170\,\mathrm{d}$ | $0.118\,\mathrm{mm/s}$ |
| $120\,\mathrm{d}$ | $0.121\,\mathrm{mm/s}$ |
| $70\,\mathrm{d}$ | $0.177\,\mathrm{mm/s}$ |
| $30\,\mathrm{d}$ | $0.391\,\mathrm{mm/s}$ |
| $10\,\mathrm{d}$ | $1.159\,\mathrm{mm/s}$ |
| $1\,\mathrm{d}$ | $11.6\,\mathrm{mm/s}$ |

The last day of the cruise is dramatically the worst place to correct anything — an error that costs less than two-tenths of a millimetre per second to fix with $220$ days of leverage costs $11.6\,\mathrm{mm/s}$ with one day left, a factor of about sixty. Notice the trend is not perfectly monotonic: leverage is worst very early ($260\,\mathrm{d}$ to go) and very late ($1$–$10\,\mathrm{d}$ to go), with a broad, fairly flat minimum somewhere in the middle of this particular cruise. That interior structure is a genuine feature of this transfer's own geometry, not a rule to memorise — the qualitative lesson that survives across transfers is that waiting until the very end of a cruise to correct anything is always expensive, because $\boldsymbol{\Phi}_{rv}$ necessarily shrinks toward zero as the remaining time shrinks toward zero (matching the state-transition-matrix lesson's short-step limit, $\boldsymbol{\Phi}_{rv}\to\Delta t\,\mathbf{I}$).
:::

Leverage alone would argue for correcting as early as possible, immediately after injection. The other side of the trade is that you cannot correct an error you have not yet measured: orbit determination needs tracking data, and tracking data needs time to accumulate before it pins down the actual departure error precisely enough to be worth correcting. Burn too early, using a poorly determined estimate of the error, and you risk correcting noise — spending propellant to chase an error bar rather than a real error, and potentially introducing a *new* error from the correction's own execution imprecision that is comparable in size to the one it removed. This is the trade card `c_tcm` calls genuine rather than a preference: leverage favours early, knowledge favours waiting, and a real TCM schedule (a first correction days after launch, a second at the cruise's approximate midpoint, a final one shortly before arrival to clean up anything the earlier ones and their own execution error left behind) is built by balancing the two against each other for the specific mission's navigation performance, not by a fixed rule.

## Linear covariance analysis

The leverage argument above used a single representative error. A mission does not have one error to correct; it has a *distribution* of possible errors, described by a covariance matrix, and wants to know how that distribution evolves — without running the thousands of individual trajectory simulations a full Monte Carlo campaign would need.

The state transition matrix answers this directly. If $\delta\mathbf{x}_0$ is a random vector with covariance $\mathbf{P}_0 = E[\delta\mathbf{x}_0\delta\mathbf{x}_0^{\!\top}]$ (zero-mean, from whatever combination of injection, navigation, and modelling errors the mission characterises at $t_0$), and $\delta\mathbf{x}_f = \boldsymbol{\Phi}(t_f,t_0)\,\delta\mathbf{x}_0$ from the state-transition-matrix lesson, then

$$
\mathbf{P}_f = E\big[\delta\mathbf{x}_f\delta\mathbf{x}_f^{\!\top}\big] = E\big[\boldsymbol{\Phi}\,\delta\mathbf{x}_0\delta\mathbf{x}_0^{\!\top}\boldsymbol{\Phi}^{\!\top}\big] = \boldsymbol{\Phi}\,\mathbf{P}_0\,\boldsymbol{\Phi}^{\!\top} ,
$$

using linearity of expectation and pulling the (deterministic) $\boldsymbol{\Phi}$ outside it.

::: key Linear covariance propagation
$$
\mathbf{P}_f = \boldsymbol{\Phi}(t_f,t_0)\,\mathbf{P}_0\,\boldsymbol{\Phi}(t_f,t_0)^{\!\top} .
$$
The same matrix that propagates one perturbation propagates an entire distribution's second moments — valid exactly as far as the underlying linearisation holds, and not a substitute for a nonlinear Monte Carlo once dispersions grow large enough that it does not.
:::

::: example An injection dispersion, stretched by a quarter-billion kilometres of cruise
Start with a modest, roughly isotropic departure covariance — $1\,\mathrm{km}$ position and $1\,\mathrm{m/s}$ velocity, $1\sigma$ in each axis, uncorrelated — on the same $270$-day Earth–Mars transfer. Propagating $\mathbf{P}_0$ through the full-cruise $\boldsymbol{\Phi}$ and extracting the eigenvalues of the position sub-block gives the semi-axes of the $1\sigma$ position-uncertainty ellipsoid at each epoch:

| Elapsed time | Position $1\sigma$ semi-axes |
| --- | --- |
| $10\,\mathrm{d}$ | $860,\ 860,\ 873\,\mathrm{km}$ |
| $30\,\mathrm{d}$ | $2481,\ 2486,\ 2818\,\mathrm{km}$ |
| $270\,\mathrm{d}$ (arrival) | $708,\ 10\,394,\ 84\,204\,\mathrm{km}$ |

Early on the ellipsoid is nearly a sphere — at $10$ days it is barely elongated at all, growing at close to the rate a pure $1\,\mathrm{m/s}$ velocity error would (compare $1\,\mathrm{m/s}\times10\,\mathrm{d} = 864\,\mathrm{km}$, matching the table to within the small effect of gravity's curvature over that short an arc). By arrival, it has stretched into a long, thin cigar: the largest axis, at $84\,204\,\mathrm{km}$, is almost $120$ times the smallest, at $708\,\mathrm{km}$. The dispersion has not grown uniformly in all directions — it has grown overwhelmingly along the direction associated with *when* the spacecraft arrives (the along-track component of the error, compounding over the whole cruise), while the cross-track geometry of the encounter stays comparatively tight. This is not an abstract remark: it is the quantitative reason the B-plane lesson insisted on separating a flyby's aim point from its arrival time — the covariance itself shows, numerically, that timing is where nearly all the uncertainty lives.
:::

## From covariance to correction statistics

The same linear map that propagates a state error forward also gives the correction burn's own statistics, without any new machinery. If a position covariance $\mathbf{P}_r$ exists at a candidate burn time $t_c$ (itself obtained by propagating $\mathbf{P}_0$ forward to $t_c$), the correction $\delta\mathbf{v} = -\boldsymbol{\Phi}_{rv}(t_f,t_c)^{-1}\delta\mathbf{r}$ from the differential-correction lesson is a linear function of a random vector, so its own covariance follows the identical rule:

$$
\mathbf{P}_{\delta v} = \boldsymbol{\Phi}_{rv}^{-1}\,\mathbf{P}_r\,\big(\boldsymbol{\Phi}_{rv}^{-1}\big)^{\!\top} .
$$

::: example How big should the TCM budget be?
Propagate the same $\mathbf{P}_0$ from above to a candidate correction at day $170$ ($100$ days of remaining leverage to the day-$270$ arrival). The position covariance there has $1\sigma$ semi-axes $(4411,\ 8762,\ 38\,524)\,\mathrm{km}$ — already substantially elongated, since more than half the cruise has passed. Mapping it through $\boldsymbol{\Phi}_{rv}(270\,\mathrm{d},170\,\mathrm{d})^{-1}$ gives the correction burn's own $1\sigma$ statistics: semi-axes $(0.594,\ 0.783,\ 5.082)\,\mathrm{m/s}$, for a root-sum-square $1\sigma$ correction magnitude of $5.18\,\mathrm{m/s}$.

That number — not a guess, not a round "few metres per second" rule of thumb, but a specific figure derived from the mission's own injection uncertainty and its own trajectory's own $\boldsymbol{\Phi}_{rv}$ — is exactly what a propellant budget for this TCM should be sized against, and exactly the kind of number linear covariance analysis produces without ever propagating a single Monte Carlo sample.
:::

::: warning Linear covariance is only as good as the linearisation
Every result in this lesson rests on $\delta\mathbf{x}_f \approx \boldsymbol{\Phi}\,\delta\mathbf{x}_0$ being an accurate first-order approximation. That holds well for the small, early dispersions typical of a well-controlled injection, and it is exactly why linear covariance analysis is standard practice for TCM sizing and B-plane statistics. It stops being trustworthy once a dispersion grows large enough, or the trajectory passes close enough to strongly nonlinear dynamics (a close planetary flyby, for instance), that second-order terms the linearisation drops become significant — which is why linear covariance results are a fast, cheap first answer that a full nonlinear Monte Carlo campaign, closer to launch, is run to confirm rather than replace.
:::

## Check yourself

::: check
Explain, without redoing the calculation, why the required correction $\Delta v$ for a fixed position error should grow as the remaining time to the target shrinks toward zero, using the state-transition-matrix lesson's short-step limit for $\boldsymbol{\Phi}_{rv}$.
:::

::: answer
The state-transition-matrix lesson showed $\boldsymbol{\Phi}_{rv}\to\Delta t\,\mathbf{I}$ for a short remaining arc, so as the time-to-go shrinks toward zero, $\boldsymbol{\Phi}_{rv}$ itself shrinks toward the zero matrix. Since the required correction is $\boldsymbol{\Phi}_{rv}^{-1}$ applied to the position error, and inverting a matrix that is shrinking toward zero blows up its inverse, the required $\Delta v$ for any fixed position error necessarily grows without bound as the correction is delayed toward the arrival time itself.
:::

::: check
A mission's navigation team says they cannot determine the spacecraft's position to better than $50\,\mathrm{km}$ until at least five days after launch. What does this imply about scheduling the first TCM, combined with the leverage argument above?
:::

::: answer
Scheduling a correction burn before the position is known to useful precision means correcting against a poorly determined estimate — the burn might remove real error, might chase noise in the estimate, or might do some of both, and in any case its own execution error adds a further, freshly introduced uncertainty. Combined with the leverage argument (earlier is better, all else equal), the right conclusion is not "burn as early as physically possible" but "burn as early as the navigation solution has converged enough to be trustworthy" — the five-day mark here, not before, even though a correction at day one would in principle need less $\Delta v$ per kilometre of true error.
:::

::: check
Using $\mathbf{P}_f = \boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\!\top}$, explain why $\mathbf{P}_f$ is guaranteed to be symmetric if $\mathbf{P}_0$ is.
:::

::: answer
$\mathbf{P}_f^{\!\top} = (\boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\!\top})^{\!\top} = \boldsymbol{\Phi}\mathbf{P}_0^{\!\top}\boldsymbol{\Phi}^{\!\top}$ (reversing the order of the transpose of a product), and if $\mathbf{P}_0^{\!\top}=\mathbf{P}_0$ (symmetric), this equals $\boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\!\top} = \mathbf{P}_f$ — so $\mathbf{P}_f$ is symmetric too, for any $\boldsymbol{\Phi}$, which is a useful, cheap sanity check on a numerical implementation (a computed $\mathbf{P}_f$ that comes out visibly non-symmetric signals a coding error, not a property of the physics).
:::

::: check
Why does the position-uncertainty ellipsoid in the worked example become dramatically elongated by arrival, rather than staying close to a sphere the way it started?
:::

::: answer
The initial covariance included an isotropic velocity uncertainty, and a velocity error along the direction of travel accumulates into a position error that grows roughly in proportion to elapsed time (an along-track, or timing-like, effect compounding over the whole cruise), while a velocity error in other directions has comparatively less opportunity to build into as large a position spread over the same interval, especially once the trajectory's own curvature and the differing components of $\boldsymbol{\Phi}$ are accounted for. The result is that one direction of the uncertainty ellipsoid grows much faster than the others, producing the long, thin shape seen at arrival — the same effect, quantified, that motivates using B-plane coordinates to separate the well-behaved geometric miss from the poorly-behaved timing error.
:::

::: check
A colleague proposes skipping linear covariance analysis entirely and going straight to a full Monte Carlo simulation for every TCM sizing question. What is lost by doing only that, and not the linear analysis as well?
:::

::: answer
A full Monte Carlo campaign is more accurate once nonlinearity matters, but it is far more expensive computationally — thousands of individual nonlinear trajectory propagations rather than one matrix propagation — and it gives comparatively little insight into *why* a result comes out the way it does, since it does not hand you the underlying sensitivity structure ($\boldsymbol{\Phi}_{rv}$ and its blocks) the way the linear analysis does directly. Skipping the linear analysis means losing a fast, cheap, structurally informative first answer (useful for quick trade studies and for sizing the scope of the Monte Carlo campaign itself) in favour of a slower, more accurate but less immediately interpretable one — most missions run both, using the linear result to plan and interpret the Monte Carlo rather than replacing it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\delta\mathbf{v}(t_c) = \boldsymbol{\Phi}_{rv}(t_f,t_c)^{-1}\delta\mathbf{r}(t_c)$ | TCM correction; cost shrinks as remaining leverage ($\boldsymbol{\Phi}_{rv}$) grows |
| TCM timing trade | Leverage favours early correction; navigation convergence favours waiting; both matter |
| $\mathbf{P}_f = \boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\!\top}$ | Linear covariance propagation; symmetric if $\mathbf{P}_0$ is |
| Along-track stretching | A modest isotropic injection dispersion becomes a long, thin ellipsoid over a long cruise |
| $\mathbf{P}_{\delta v} = \boldsymbol{\Phi}_{rv}^{-1}\mathbf{P}_r(\boldsymbol{\Phi}_{rv}^{-1})^{\!\top}$ | Correction-burn statistics from position covariance, without a Monte Carlo |
| Validity | Only as good as the linearisation; a fast first answer, not a replacement for a nonlinear Monte Carlo near launch |

Every lesson in this module has built toward the same picture: Lambert gives the first guess, the state transition matrix says how sensitive that guess is, and differential correction, B-plane targeting, and TCM scheduling are all the same Newton-step idea, applied wherever the mission needs it — a loop that only works because each piece was checked, on real numbers, the way this module checked all of them.
