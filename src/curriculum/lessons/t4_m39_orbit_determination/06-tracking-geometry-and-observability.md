---
id: l06-tracking-geometry-and-observability
title: Station and tracking geometry and its effect on observability
minutes: 14
covers:
  - Station and tracking geometry and its effect on observability
---

The batch lesson found $\boldsymbol\Lambda$ badly conditioned in kilometres and seconds, and non-dimensionalising fixed it completely — the same converged answer, computed on firmer numerical ground. This lesson is about a different, deeper kind of ill-conditioning that no change of units touches: the case where the tracking data itself, however precisely measured and however carefully scaled, does not constrain some direction of the state. That is what observability means for orbit determination, and it is exactly the condition-number language the least-squares module built for its own static-estimation problems, now applied to an arc of moving geometry instead of a fixed one.

## Observability is a property of the geometry, not the noise

A state is observable from a given arc of data when $\boldsymbol\Lambda=\sum\widetilde{\mathbf H}_i^\mathsf T\mathbf W_i\widetilde{\mathbf H}_i$ is nonsingular — in practice, when it is well conditioned enough that solving for $\delta\mathbf x_0$ does not amplify round-off or the noise itself into a useless answer. Perfectly accurate, zero-noise measurements do not fix a genuinely degenerate geometry: if every observation in an arc is sensitive to the same combination of state components and blind to some other combination, no amount of precision on those observations tells you anything about the direction they cannot see. This is precisely the same idea the least-squares module's condition-number lesson built for a single, fixed measurement geometry; the only thing new here is that the geometry itself changes with time as the spacecraft moves, which is what gives an *arc* — as opposed to one instant — any hope of resolving directions a single look cannot.

## Duration within one pass versus a second, separated pass

::: example Where the conditioning actually comes from
Using the same $420\,\mathrm{km}$ orbit and station as the earlier lessons, build the (canonically non-dimensionalised) weighted design matrix $\widetilde{\mathbf H}$ for range-and-range-rate data over several different arcs, and take its singular values directly by SVD — the numerically sound way to read off conditioning, exactly as the batch lesson recommended over forming $\boldsymbol\Lambda$ explicitly when conditioning is already suspect:

```python
# arc                                    N obs   cond(H~) = sigma_max/sigma_min
# first 60 s of one pass                    7       1.60e+11
# first 120 s of one pass                  13       2.63e+10
# one full pass (360 s)                    37       1.13e+09
# that pass + a second pass (~1.6 h later) 72       1.06e+04   <- five orders of magnitude better
# three passes spread over 12 h           111       4.51e+03
```

Extending a single continuous pass from $60\,\mathrm s$ to its full $360\,\mathrm s$ improves conditioning by only about two orders of magnitude; adding one *more* pass, separated in time rather than merely longer, improves it by five. Within one pass the tracking geometry changes only gradually — closely related to why a short-arc Gibbs or Gauss solution in the initial-orbit-determination lesson struggled: not enough of the orbit's curvature has been sampled for the data to distinguish nearby true states. A second pass, hours later, is nearly a different vantage point in time entirely, and resolves combinations of the state the first pass's near-linear stretch of data could not touch. For $\boldsymbol\Lambda$ itself, $\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$ from the batch lesson turns the $60\,\mathrm s$ arc's already-enormous $1.6\times10^{11}$ into roughly $2.6\times10^{22}$ — a number no 64-bit float can represent as a matrix at all, which is why attempting to solve the normal equations directly from an arc this short does not only give an imprecise answer; it can fail outright from round-off, not only from noise.
:::

## The covariance ellipsoid, read off directly

$\mathbf P=\boldsymbol\Lambda^{-1}$ is an ellipsoid in the (non-dimensional) state space, and its shape — not only its overall size — is what "observable in some directions, not others" looks like as a number rather than a claim.

::: example The worst- and best-observed directions, computed
Taking the right singular vectors of $\widetilde{\mathbf H}$ (equivalently, the eigenvectors of $\mathbf P$) for the $60\,\mathrm s$ single-pass arc and the full three-pass, twelve-hour arc:

```python
# 60 s, single pass:
#   smallest singular value 9.67e-03  -> that direction's 1-sigma ~ 1/9.67e-3 ~ 103 (canonical units!)
#   largest  singular value 1.55e+09  -> that direction's 1-sigma ~ 6.4e-10
#   ratio of best- to worst-constrained 1-sigma: > 10^11
#
# 3 passes, 12 h:
#   smallest singular value 4.67e+10
#   largest  singular value 1.04e+07... (note: values invert between Lambda's and P's sense)
#   ratio of best- to worst-constrained 1-sigma: ~ 4.5e3
```

In the short arc, the least-observed combination of position and velocity is left with a formal uncertainty *eleven orders of magnitude* larger than the best-observed one — for all practical purposes, entirely unconstrained, while another combination is already known to extraordinary precision from the same seven points. In the twelve-hour arc the spread has narrowed to about $4500$-to-$1$: still highly anisotropic — an ellipsoid, never a sphere, is the normal shape for an orbit determination covariance — but no longer catastrophically so. Neither the worst- nor best-observed direction, written in raw inertial $(x,y,z,v_x,v_y,v_z)$ components, is easy to read by eye; turning that mixture into a direction with physical meaning — radial, along-track, cross-track — is exactly what the RIC-frame lesson later in this module does with this same kind of result.
:::

## Multiple stations: geometry, not only more data

Adding observations does not automatically improve conditioning if they repeat information the arc already has. Comparing three passes seen by one station against two passes from that station plus one pass from a station on almost the opposite side of the Earth:

```python
# three passes, ALL from one station:        N=111  cond(H~)=4.51e+03
# two passes from that station + one from
#   a station near the antipode:              N=79   cond(H~)=3.33e+03
```

The second configuration has *fewer* total observations and still conditions better, because a station near the antipode sees the spacecraft from a genuinely different geometric angle rather than a repeated variation on the first station's view. This is the same principle behind dilution of precision in the GNSS module — a receiver's position fix improves more from satellites spread across the sky than from the same number of satellites clustered together — applied here to ground-station geometry instead of satellite geometry. A tracking network's value is in how differently its sites see the object, not in how many looks it accumulates.

::: key Observability is about direction, conditioning is about degree
A short or repetitive arc does not fail loudly — the normal equations still solve, and without checking $\operatorname{cond}(\widetilde{\mathbf H})$ or examining $\mathbf P$'s eigenstructure, a poorly observed direction looks like any other number in the output. It reveals itself only as an enormous formal uncertainty along some combination of state components (or, in the numerically extreme case, as the solver failing outright), never as an explicit warning. Reading the covariance ellipsoid — not only its trace or its largest entry — is the only way to see which directions the data actually constrained.
:::

::: warning A well-conditioned fit from a short arc is still a short-arc fit
Adding a loose a priori, or proceeding only because the normal equations happened to solve without complaint, does not manufacture observability that the geometry does not contain. A regularized or Bayesian-looking answer from a single short pass reports *a* covariance, but the direction with the largest formal uncertainty in that covariance is telling the truth: the data barely touched it, and the estimate along it is close to whatever the prior said, not something the tracking data itself determined.
:::

## Check yourself

::: check
Why does the singular value decomposition of $\widetilde{\mathbf H}$, rather than the eigen-decomposition of $\boldsymbol\Lambda$, give a numerically trustworthy answer for the $60$-second arc in the first worked example, when $\boldsymbol\Lambda$'s own eigenvalues for that same arc turn out numerically unreliable?
:::

::: answer
$\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$, so whatever dynamic range $\widetilde{\mathbf H}$'s singular values already span is roughly squared when $\boldsymbol\Lambda=\widetilde{\mathbf H}^\mathsf T\mathbf W\widetilde{\mathbf H}$ is formed explicitly. For the $60$-second arc, $\widetilde{\mathbf H}$'s own condition number is already about $1.6\times10^{11}$; squaring that easily exceeds the roughly $10^{15}$–$10^{16}$ dynamic range double-precision arithmetic can represent reliably within one matrix, so $\boldsymbol\Lambda$'s smallest eigenvalues come out as numerical noise (including spurious negative values for a matrix that is mathematically positive semi-definite by construction). Working with $\widetilde{\mathbf H}$'s singular values directly avoids ever forming that squared, doubly ill-conditioned quantity.
:::

::: check
A station operator proposes fixing a poorly observed direction in the state by tracking twice as long during the same single pass. Based on the first worked example, how much improvement should be expected, and why is a second, separated pass different?
:::

::: answer
Not much — extending a single pass's duration only samples more of the same gradually changing geometry, and in the example doubling the duration from a short opening stretch of a pass improved conditioning by roughly one order of magnitude at best, far short of what is needed. A second pass hours later views the spacecraft from a different point in its orbit and a different point in the station's own rotation, which is a genuinely new piece of geometric information rather than an extension of the first; in the example it improved conditioning by five orders of magnitude, far more than any plausible amount of extra time within the original pass could.
:::

::: check
The three-pass, twelve-hour arc left the best- and worst-observed directions differing by a factor of about $4500$ in formal uncertainty. Does this mean the fit is unreliable?
:::

::: answer
Not necessarily — an anisotropic covariance is the normal outcome for orbit determination, not a sign of failure; the question is whether every direction that matters for the intended use (predicting a conjunction, planning a manoeuvre, handing off to another tracking asset) is constrained well enough for that purpose, not whether the ellipsoid is a sphere. A factor of $4500$ between the best- and worst-observed combinations is dramatically better than the $60$-second arc's factor exceeding $10^{11}$, and whether it is "good enough" depends on what the resulting covariance, examined directly (as the next lessons do in the RIC frame), actually says about the directions that matter operationally.
:::

::: check
Two candidate tracking plans offer the same total number of observations: one from three passes at a single station, the other from two passes at that station plus one pass at a station on nearly the opposite side of the Earth. Which would you expect to observe the state better, and why?
:::

::: answer
The two-station plan, generally — not because it has more data (in the module's own comparison it actually had fewer total observations) but because a station near the antipode views the orbit from a substantially different geometric angle, contributing information the first station's passes cannot, in the same way that a GNSS fix improves more from satellites spread across the sky than from an equal number clustered together. Repeating the same station's viewing geometry a third time adds redundancy in the directions already well observed rather than resolving the ones that are not.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{cond}(\widetilde{\mathbf H})$, via SVD | The numerically sound observability metric; avoid forming $\boldsymbol\Lambda$ directly when this is already large |
| $\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$ | Why a marginal arc's normal equations can fail from round-off, not only from noise |
| Extending one pass | Improves conditioning slowly — the geometry changes only gradually within a pass |
| A second, separated pass | Improves conditioning dramatically — a genuinely different vantage point in time |
| Eigenvectors of $\mathbf P=\boldsymbol\Lambda^{-1}$ | The actual best- and worst-observed directions; not physically readable until rotated into RIC |
| Station diversity over station count | Antipodal or widely separated sites resolve directions a repeated single site cannot — the GNSS module's DOP idea, applied to ground geometry |

The covariance ellipsoid in this lesson came from trusting the dynamics completely between observations. The next lesson asks what changes when that trust is not fully deserved — when a real, unmodelled force is quietly acting on the spacecraft between the measurements that are supposed to be pinning its state down.
