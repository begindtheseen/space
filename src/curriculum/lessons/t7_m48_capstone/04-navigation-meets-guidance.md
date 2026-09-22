---
id: l04-navigation-meets-guidance
title: 'Navigation in the loop: the multiplicative EKF meets guidance'
minutes: 24
covers:
  - A multiplicative extended Kalman filter on IMU, GNSS and radar altimeter, with error-state formulation and attitude error as a three-parameter local perturbation
---

The nonlinear-filters and inertial-navigation modules built the multiplicative extended Kalman filter in full: the error-state architecture, the three-parameter local attitude perturbation $\boldsymbol\delta\theta$ multiplying a reference quaternion, injection and reset, the reset Jacobian that keeps the covariance honest after the nominal moves. None of that is re-derived here — a reader who needed the derivation has already built it, from scratch, with real numbers. What this lesson does instead is specialize that filter to the reference vehicle's actual sensor suite, verify it against the standard consistency test rather than assume it, and then connect its output to the module *downstream* of it. That connection is where this lesson's real content lives: guidance solves its boundary-value problem by treating the navigation estimate it reads as the vehicle's current, exact state, and this lesson shows precisely what happens to touchdown accuracy when that estimate carries a small, honest, *correlated* error instead — a failure that a navigation unit test, checking the filter against its own accuracy specification alone, cannot see at all.

## The filter, specialized to this vehicle

The reference vehicle's landing-burn navigation filter estimates position, velocity, attitude and accelerometer bias from three sensors: an IMU mechanized at the $200\,\mathrm{Hz}$ navigation rate the previous lesson fixed, GNSS position and velocity at $10\,\mathrm{Hz}$, and a radar altimeter reporting altitude alone at $20\,\mathrm{Hz}$ once the vehicle descends below $1500\,\mathrm m$. Every equation this filter runs is the general error-state MEKF the prerequisite modules built, specialized in two ways worth stating precisely rather than leaving implicit.

First, the demonstrations in this lesson use the vehicle's motion confined to a vertical plane — downrange and altitude, with a single pitch attitude angle — which reduces the general fifteen-state error vector $(\delta\mathbf p,\delta\mathbf v,\boldsymbol\phi,\delta\mathbf b_a,\delta\mathbf b_g)$ to its planar subset of seven states, exactly the way the inertial-navigation module's own worked example reduced the same fifteen-state filter to a single-axis five-state block to verify it by hand. The three-parameter attitude perturbation $\boldsymbol\delta\theta$ becomes one nonzero scalar component, the rotation confined to the plane; the other two components are structurally zero, not estimated to be small. One consequence is worth being precise about, because it is exactly the piece the prerequisite module's reset Jacobian existed to handle: a rotation confined to a plane is commutative, so composing two small rotations about the same axis never depends on order, and the reset Jacobian the general three-dimensional filter needs, $\mathbf G=\mathbf I-\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)$, collapses to exactly $\mathbf G=1$ here — not an approximation valid for small corrections, but exact, because the curvature that Jacobian corrects for does not exist in one dimension.

Second, gyro bias is treated as calibrated before flight — measured on the ground, per the inertial-navigation module's own alignment lesson — and removed directly in the mechanization, rather than carried as an additional state the filter estimates in flight. This is a genuine design choice with a genuine limitation, not a simplification made for convenience: attitude, in this configuration, has no direct sensor of its own — no star tracker, no dual-antenna GNSS heading, nothing that observes attitude except indirectly, through how an attitude error misprojects the accelerometer's specific force into a velocity error GNSS can see. That indirect channel is real — it is exactly the coupling term $\partial(\delta\dot{\mathbf v})/\partial\boldsymbol\delta\theta$ the inertial-navigation module derived — but it is also weak over a burn this short, and asking it to separate an attitude error from an *additionally estimated* gyro-bias error at the same time asks more of a short, indirect channel than it can reliably deliver. A vehicle whose mission profile could not afford ground calibration would need a dedicated attitude sensor instead; this one can, and does.

::: key What this lesson does and does not re-derive
The multiplicative error-state formulation, injection, reset and the vector-measurement Jacobian are the prerequisite modules' own content, unchanged. This lesson specializes them to a planar, seven-state reduction — position, velocity, one attitude angle, two accelerometer-bias components — with gyro bias calibrated and removed directly rather than estimated, and states exactly why: a short burn with no direct attitude sensor is a weak, indirect observability channel, not a channel worth asking to do two jobs at once.
:::

## Verifying consistency, not assuming it

A filter that tracks the truth reasonably well is not the same claim as a filter whose *reported* covariance is honest, and the second claim is the one every downstream consumer — guidance, control, FDIR — actually relies on. The standard check is the normalized estimation error squared, comparing the actual error against truth to what the filter's own covariance claims that error's spread should be:

$$
\mathrm{NEES} = \mathbf e^\top \mathbf P^{-1} \mathbf e, \qquad \mathbf e = \mathbf x_{\text{true}} - \hat{\mathbf x},
$$

which, for a consistent seven-state filter, should sit inside the $95\%$ two-sided bound of a chi-squared distribution with seven degrees of freedom, $(1.69,\,16.01)$, on almost every cycle.

::: example Running the filter through one full landing burn and checking it
Simulated against the reference vehicle's ignition-to-touchdown trajectory, IMU noise drawn from the same angular- and velocity-random-walk figures the inertial-navigation module's own worked examples used, and GNSS and altimeter noise at $3\,\mathrm m$, $0.15\,\mathrm{m/s}$ and $0.15\,\mathrm m$ respectively: over the bulk of the burn (the first $22\,\mathrm s$, excluding the last second and a half of terminal approach where the guidance law's own time-to-go floor makes the trajectory briefly aggressive enough that frozen consistency checks are not the right tool — the terminal-approach lesson later in this module handles that regime on its own terms), one representative run's NEES has a median of $10.07$ against an expected value of $7$, with $97.6\%$ of samples inside the $95\%$ chi-squared bound; across twenty independent seeds the fraction inside the bound averages $91\%$, ranging from $69\%$ to $100\%$ depending on the specific noise draw. The filter finishes the burn with a final position error of about $0.26\,\mathrm m$ and a final attitude error of about $0.15^\circ$ — small, and, more importantly, honestly reported: the filter's own final one-sigma position uncertainty, $0.23\,\mathrm m$ along the axis this burn stresses most, is not a number invented after the fact, it is what the covariance said throughout.
:::

A filter passing this check has cleared the bar every navigation unit test is built to check: it tracks truth, and it knows how well it is tracking truth. Nothing about that check, on its own, says anything at all about what happens once a *different* module starts consuming this filter's output as an input to its own optimization.

## The join: a correlated estimate meets a guidance law that assumes perfect knowledge

Convex powered-descent guidance, as the trajectory-optimization prerequisite built it, solves a boundary-value problem *from the current state* — whatever the navigation estimate reports, guidance treats as the vehicle's actual position and velocity, because that is the only state a re-solve has to work from. If the navigation estimate's error were zero-mean and uncorrelated from one guidance cycle to the next, this would cost little: each re-solve would aim from a slightly different random offset, and because guidance re-solves every $0.6\,\mathrm s$ for the rest of the burn, the closed loop would largely correct itself — each new solve responds to wherever the vehicle actually is, regardless of where the previous solve mistakenly aimed. Navigation error is not white, though; it is correlated over some characteristic timescale, set by the physics of whatever is corrupting the fix, and the interesting question is what happens when that correlation time sits near the guidance re-solve interval itself.

::: example Touchdown miss versus how long a GNSS error persists
Model the GNSS position measurement as corrupted by an additional slowly-varying error — a multipath-like effect whose geometry changes as the vehicle descends, exactly the kind of error source the GNSS module characterized as correlated rather than white — on top of the filter's own modeled white noise, with the same $2\,\mathrm m$ one-sigma magnitude held fixed and only its correlation time $\tau$ varied. Averaged over thirty seeds per case:

| Correlation time $\tau$ | Mean touchdown position error |
| --- | --- |
| $0.05\,\mathrm s$ (near-white) | $0.44\,\mathrm m$ |
| $0.3\,\mathrm s$ | $0.91\,\mathrm m$ |
| $0.6\,\mathrm s$ (guidance's own re-solve interval) | $1.03\,\mathrm m$ |
| $1.0\,\mathrm s$ | $1.02\,\mathrm m$ |
| $4.0\,\mathrm s$ | $0.71\,\mathrm m$ |
| $16.0\,\mathrm s$ (nearly a constant bias) | $0.43\,\mathrm m$ |
| No correlated error (white GNSS noise only) | $0.21\,\mathrm m$ |

The worst case sits almost exactly at the guidance re-solve interval, not at either extreme — nearly five times the all-white baseline, and noticeably worse than an error correlated for sixteen seconds, close to a constant bias GNSS itself would gradually average out. An error that persists for about one guidance cycle is the one that does the most damage, because it is long-lived enough that the *same* wrong displacement is still present the next time guidance re-solves, so guidance repeatedly re-aims from a consistently offset apparent position rather than one that a fresh re-solve corrects away — while an error correlated far longer than one cycle behaves, from guidance's perspective, almost like a fixed miscalibration that the filter's own GNSS updates slowly whittle down over many cycles instead.
:::

That number is not something a navigation unit test would ever produce, and this is worth being exact about why. A specification test on the filter checks its *reported* accuracy — the one-sigma figure in the worked example above — against a threshold, and that reported figure is **identical**, to four significant figures, in every row of the table: the filter's own covariance has no model of this extra correlated error at all, so it reports the same confidence whether the correlated component is negligible or the dominant contributor to touchdown miss. The filter genuinely does pass its own accuracy specification in every one of these cases. What fails, or nearly does, is a *different* quantity entirely — touchdown miss distance — that only exists once guidance is in the loop consuming the estimate, and no test scoped to navigation alone was ever going to see it.

::: key The join, stated precisely
Guidance treats the navigation estimate as the vehicle's current, exact state. A correlated navigation error with correlation time comparable to the guidance re-solve interval is the worst case for touchdown accuracy — not the largest error, not the longest-lived one, but the one whose persistence matches how often guidance gets a chance to notice it is wrong. The filter's own reported uncertainty does not change with this error's correlation time at all, so no navigation-only check can see the effect; it appears only once guidance is closed around navigation's output.
:::

::: warning "The filter passed its accuracy spec" is not the same claim as "guidance will land accurately"
A navigation acceptance test that checks reported one-sigma accuracy against a threshold, run in isolation, cannot distinguish the best row of the table above from the worst — both report the identical figure. Closing the loop with guidance and measuring touchdown miss directly is the only test that can see the difference, which is exactly why this module insists on an integrated campaign rather than trusting that four passing component tests imply a passing system.
:::

::: warning Correlation time is a property of the error source, not a dial you get to set
The $0.6\,\mathrm s$ worst case above is not a coincidence to be tuned away by picking a different guidance rate in isolation; a faster re-solve rate changes which correlation time is worst, it does not remove the effect, and the actual correlation time of a real multipath or thermal-drift error is set by the physics producing it, not by anything the guidance designer controls. The defense is not hoping the timescales miss each other — it is characterizing the real error sources well enough to know where they sit, which is exactly the dispersion-set discipline the verification module built.
:::

## Check yourself

::: check
Explain why the reset Jacobian for this lesson's planar attitude reduction is exactly $\mathbf G=1$, rather than merely a good approximation for small corrections, when the general three-dimensional MEKF needs $\mathbf G=\mathbf I-\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)$.
:::

::: answer
The general reset Jacobian corrects for the fact that the tangent space of a three-dimensional attitude depends on which attitude it is attached to — rotations about different axes do not commute, so moving the nominal attitude genuinely changes what the error's coordinates mean. A rotation confined to a single plane is a rotation about one fixed axis only, and rotations about a common fixed axis always commute; there is no curvature in the space of achievable rotations for the reset Jacobian to correct for, so the correction is exactly the identity, not merely negligible for a small correction.
:::

::: check
Why is gyro bias calibrated on the ground and removed directly, rather than estimated in flight, in this lesson's specific filter — and what mission profile would make that choice wrong?
:::

::: answer
With no direct attitude sensor, attitude is observable only indirectly, through how an attitude error misprojects the accelerometer's specific force into a velocity error GNSS can see — a real but weak channel over a burn this short, and asking that same weak channel to simultaneously separate attitude error from an in-flight-estimated gyro bias risks neither being well resolved. A vehicle that could not calibrate its gyro bias accurately before flight — a much longer coast before the landing burn, or a mission profile with no reliable ground alignment window — would need either a dedicated attitude sensor or a much longer aided period before trusting this same simplification.
:::

::: check
A colleague argues that since the filter's NEES check passed with a median close to the expected value of seven, the navigation estimate must be reliable enough for guidance to use without further analysis. What is the specific gap in that argument?
:::

::: answer
The NEES check verifies that the filter's *reported* covariance honestly describes its *own* error against truth — a statement entirely about navigation in isolation. It says nothing about how that error's *correlation structure* interacts with a downstream consumer's own update cadence, which is exactly the effect this lesson's touchdown-miss table demonstrates: every row of that table came from a filter whose reported accuracy, and by extension its NEES behavior, is essentially unchanged, while the touchdown miss it produces once guidance is closed around it varies by a factor of five.
:::

::: check
Using this lesson's table, explain why a navigation error correlated for $16\,\mathrm s$ produces a smaller touchdown miss than one correlated for $0.6\,\mathrm s$, even though the longer-lived error persists for far more of the burn.
:::

::: answer
An error correlated for $16\,\mathrm s$ changes so slowly that it behaves, from the filter's own GNSS updates, almost like a fixed bias — and a fixed bias is exactly the kind of error many GNSS updates in sequence, each contributing a small correction, gradually whittle down over the course of the burn. An error correlated for about one guidance cycle, by contrast, is long-lived enough to still be present, essentially unchanged, at the very next re-solve, but short-lived enough that the filter's slower, cumulative bias-correction mechanism never gets enough consistent signal to identify and remove it before it has already re-randomized.
:::

::: check
Propose one integrated (not navigation-only) check a program could add specifically to catch the failure mode this lesson demonstrates before it appears in a full Monte Carlo campaign, and explain what it would need to measure that the NEES check does not.
:::

::: answer
Run a smaller, targeted study — closing guidance around the navigation filter specifically, exactly as this lesson's table did — sweeping the correlation time of an injected error of realistic magnitude and plotting touchdown miss against it, rather than only checking the filter's reported accuracy against a threshold. The quantity it needs to measure that NEES never computes is the *closed-loop consequence* of an error's correlation time, not merely its magnitude — a measurement that requires guidance actually consuming the corrupted estimate and producing a trajectory, which a navigation-only test, however well the filter itself is verified, structurally cannot produce.
:::

## Summary

| Item | Statement |
| --- | --- |
| Filter, specialized | Planar reduction of the general MEKF: 7 states (position, velocity, attitude, accelerometer bias); gyro bias calibrated and removed directly, not estimated |
| Reset Jacobian, planar case | Exactly $\mathbf G=1$ — a fixed-axis rotation has no tangent-space curvature to correct for |
| Consistency check | NEES against a $\chi^2_7$ bound of $(1.69,16.01)$; measured median $\approx10$, $\approx91\%$ average fraction inside bound across seeds |
| The join | Guidance treats the nav estimate as exact current state; a correlated error persists across multiple re-solves instead of averaging out |
| Worst correlation time | $\approx0.6\,\mathrm s$, matching the guidance re-solve interval — touchdown miss $\approx1.03\,\mathrm m$, about $5\times$ the white-noise baseline of $\approx0.21\,\mathrm m$ |
| What a nav-only test sees | Nothing — the filter's reported one-sigma accuracy is identical across every correlation time tested |

Navigation feeding guidance is one join; the next lesson takes guidance's own output — a commanded thrust-pointing direction, re-solved every $0.6\,\mathrm s$ — and follows it into the control loop that has to actually track it, where the failure is not a subtle statistical one but a plain question of whether the vehicle can turn that fast at all.
