---
id: l14-vector-tracking-and-deep-coupling
title: Vector tracking and deep coupling
minutes: 22
covers:
  - Vector tracking and deep coupling
---

Every receiver this module has described, up to this lesson, runs one independent tracking loop per satellite per signal: each DLL and PLL sees only its own satellite's correlator outputs and knows nothing about what any other channel, or any other sensor on the vehicle, is doing. That independence is simple and, most of the time, good enough. It is also leaving real information on the table — a receiver tracking eight satellites has eight noisy but correlated views of the same underlying position, velocity and clock, and a vehicle carrying an inertial measurement unit has a ninth, completely independent view of its own dynamics. This lesson closes the module by combining all of it into a single estimator, and shows in concrete numbers what that combination buys against exactly the threats the rest of the module has raised: weak signals, high dynamics, and a reacquisition search too wide to search blindly.

## From independent loops to one filter: vector tracking

A conventional ("scalar") receiver runs $n$ independent DLL/PLL/FLL loops, each closing its own feedback path from its own discriminator to its own NCO. **Vector tracking** replaces the $n$ independent loop filters with a single filter — in practice, the same kind of Kalman filter the Kalman filtering module derives — that takes every channel's raw discriminator output as a measurement, estimates the full navigation state (position, velocity, clock bias and drift) from all of them at once, and pushes the predicted code phase and carrier frequency for *every* satellite back out to that channel's NCO. No channel closes its own loop any more; every channel is steered by the filter's shared estimate.

This changes what a weak channel needs to survive. A scalar PLL that cannot maintain lock on its own — its individual carrier-to-noise ratio too low to keep its own discriminator output meaningful — still produces a noisy but not worthless measurement, and a central filter that also has seven other, stronger channels and a dynamics model can combine that noisy measurement with everything else it knows to keep predicting where that satellite's code and carrier *should* be, feeding a corrected estimate back to the weak channel's NCO rather than asking the channel to find its own way. The weak channel rides on the strong ones' information and the filter's own dynamics model instead of standing alone — the literature on vector tracking consistently reports several decibels of extra tracking sensitivity from this alone, sensitivity a scalar loop, however well designed, structurally cannot reach because it never sees any other channel's information at all.

::: key
Vector tracking: one Kalman filter (the Kalman filtering module's machinery) takes every channel's discriminator output as a measurement and feeds predicted code/carrier commands back to every NCO, replacing $n$ independent loops with one shared estimate. A channel too weak to close its own scalar loop can still be held by the filter, using the other channels' strength and the dynamics model — several decibels of tracking sensitivity a scalar architecture cannot reach.
:::

## Deep coupling: aiding from the inertial side

**Deep coupling** extends the same filter to include the vehicle's inertial measurements directly, estimating IMU errors (bias, scale factor) alongside position, velocity and clock — the same error-state design the Kalman filtering module builds for an inertial navigator, now sharing its state estimate with every GNSS tracking channel instead of only consuming GNSS as an external correction. The payoff is exactly the card fact this module has quoted without proof since the tracking-loop lesson: *inertial aiding removes the dynamics instead*.

Recall that lesson's result for a third-order PLL: steady-state phase error from a sustained jerk is $\theta_e=J/\omega_n^3$, and a launch vehicle's staging transient gave $J=4317\,\mathrm{rad/s^3}$ — $247^\circ$ of error at a noise-optimised $\omega_n=10\,\mathrm{rad/s}$, well past any lock threshold. An aided loop is not tracking that jerk at all. The inertial navigator is already predicting the vehicle's acceleration from its own accelerometers, and feeding that prediction forward to every NCO means the *tracking loop's* job shrinks to closing the gap between the true dynamics and the inertial prediction of them — which, for a reasonable inertial sensor, is the sensor's own error, not the vehicle's motion. An accelerometer bias is close to constant over the timescales a tracking loop responds on, and a constant acceleration error has zero jerk — a third-order loop tracks it with *zero* steady-state error, not merely a reduced one. What jerk survives comes only from the bias's own short-term instability, typically a small fraction of the bias itself over a fraction of a second:

```python
import numpy as np

g0, lam = 9.80665, 0.1903
bias_tactical = 1.0e-3 * g0            # tactical-grade accelerometer bias, 1 mg
instability_frac_per_s = 0.01           # representative short-term instability, 1%/s
residual_jerk_accel = bias_tactical * instability_frac_per_s
J_res = 2 * np.pi * (residual_jerk_accel / lam)
for omega_n in (10, 15, 20):
    print(omega_n, round(np.degrees(J_res / omega_n**3), 6))
# 10 0.000186
# 15 5.5e-05
# 20 2.3e-05
```

Against the $247^\circ$ the same $\omega_n=10\,\mathrm{rad/s}$ loop produced unaided, the aided residual is a few ten-thousandths of a degree — the bandwidth that the tracking-loop lesson's trade would only allow under gentle dynamics becomes safe again, not because the vehicle's dynamics changed, but because the loop is no longer the thing fighting them.

::: example The trade the previous lesson could not resolve, resolved
The tracking-loop lesson showed that surviving the staging jerk unaided needed $\omega_n\gtrsim25\,\mathrm{rad/s}$, which came at a real thermal-noise cost, especially on a weak or side-lobe signal. With inertial aiding removing the dynamics from the loop's own workload, that same $\omega_n=10\,\mathrm{rad/s}$ loop — chosen for its far lower thermal noise — survives the identical staging transient with error to spare. The bandwidth-versus-dynamics trade the previous lesson derived does not disappear under deep coupling; it is instead paid for almost entirely out of the inertial sensor's own error budget rather than the tracking loop's noise budget, which is the whole reason a vehicle expecting exactly this dynamics profile carries an inertial sensor good enough to make that trade worthwhile.
:::

## Reacquisition, aided

The space-based and launch-vehicle lessons both showed that a wider Doppler search window costs acquisition time in direct proportion, and that the window's width is set by how much uncertainty exists in the vehicle's own velocity. Without any independent estimate, that uncertainty after an outage has to cover the full range of dynamics the vehicle could plausibly be experiencing — for the same launch vehicle, as much as $4g$ of unresolved acceleration uncertainty. With deep coupling, the inertial navigator has continued predicting velocity throughout the outage from its own measurements, and the only uncertainty left is the inertial solution's own growing error, set by sensor grade rather than vehicle dynamics.

::: example Cold search against an eight-second, inertially bridged gap
$$
\delta f_d = \frac{\delta a\,\Delta t}{\lambda}: \qquad \Delta t = 8\,\mathrm{s},\quad \delta a_{\mathrm{unaided}}=4g_0,\ \ \delta a_{\mathrm{aided}}=1\,\mathrm{mg}\ (\text{tactical IMU bias}),
$$

$$
\delta f_{d,\mathrm{unaided}} = \frac{4\times9.80665\times8}{0.1903} = 1{,}649\,\mathrm{Hz},\qquad \delta f_{d,\mathrm{aided}} = \frac{0.001\times9.80665\times8}{0.1903} = 0.41\,\mathrm{Hz}.
$$

A four-thousand-fold narrower search, because the quantity driving the search width changed from "everything the vehicle's engines could plausibly be doing" to "how much a tactical-grade accelerometer's bias drifts in eight seconds unobserved" — the same distinction the outage discussion in the launch-vehicle lesson pointed at without the number attached. This is deep coupling's second, independent payoff beyond holding lock longer: reacquiring, when lock is lost anyway, in a search space many orders of magnitude smaller than a cold start ever faces.
:::

::: key
Deep coupling shares one error-state filter between the inertial navigator and every GNSS tracking channel. It removes vehicle dynamics from the tracking loop's own burden (a constant-bias residual has zero jerk, so a noise-optimised bandwidth survives dynamics that would otherwise demand a much wider one), and it shrinks post-outage reacquisition search width from the full dynamics envelope down to the inertial sensor's own short-term error — a difference of orders of magnitude for a decent tactical-grade unit.
:::

## What deep coupling costs

None of this is free. A loosely coupled architecture — GNSS fixes going into a navigation filter as independent measurements, the way the inertial navigation module's own filter consumes them — keeps a clean boundary: a bad GNSS fix can be rejected, down-weighted, or ignored by the outer filter without touching the inertial solution's own integrity. Deep coupling erases that boundary on purpose, which is exactly what buys the sensitivity and reacquisition gains above.

::: warning
Do not treat deep coupling as a strictly better version of loose coupling with no downside. Erasing the boundary between GNSS and inertial estimation means a fault the previous lesson's slope analysis showed a residual test cannot see does not stay confined to a position estimate the vehicle could otherwise fall back on inertial navigation to override — it can work its way into the shared state the inertial solution itself now depends on. A deeply coupled system needs its own integrity monitoring designed with that coupling in mind, not the RAIM machinery built for a standalone GNSS fix, and needs tight, well-characterised time synchronisation between the inertial measurements and the GNSS observables to combine them correctly at all.
:::

The complexity is real; so, for a vehicle that actually faces the dynamics, weak signals and outages this module has spent fourteen lessons quantifying, is the payoff.

## Check yourself

::: check
What does a vector-tracking architecture change about how a weak satellite's channel is tracked, compared to a scalar architecture?
:::

::: answer
In a scalar architecture, each channel closes its own independent feedback loop from its own discriminator to its own NCO, so a channel too weak to produce a reliable discriminator output on its own cannot maintain lock, full stop. In vector tracking, every channel's discriminator output is a measurement into one shared filter that also has every other (stronger) channel's information and a dynamics model; the filter's combined estimate, not the weak channel alone, drives that channel's NCO, so it can be held through a signal level a standalone scalar loop could never track.
:::

::: check
A third-order PLL unaided sees a jerk of $J=3000\,\mathrm{rad/s^3}$ at $\omega_n=12\,\mathrm{rad/s}$. With deep coupling, the residual jerk after inertial aiding falls to $J=0.01\,\mathrm{rad/s^3}$. Compute the steady-state phase error in both cases.
:::

::: answer
Unaided: $\theta_e=3000/12^3=1.736\,\mathrm{rad}=99.5^\circ$. Aided: $\theta_e=0.01/12^3=5.8\times10^{-6}\,\mathrm{rad}=0.00033^\circ$ — the same loop, the same bandwidth, the difference entirely in how much of the true dynamics the loop is still being asked to fight.
:::

::: check
Why does a constant accelerometer bias, left unaccounted for, still allow a third-order tracking loop to achieve zero steady-state jerk error, even though the bias itself is a real, nonzero dynamics input?
:::

::: answer
Steady-state error to the $n$-th derivative of the tracked quantity is set by the loop order relative to that derivative: a third-order loop drives the error from any input up to and including a constant *acceleration* to zero, because acceleration is only the second derivative and the loop has enough integrators to track it exactly. Jerk is the third derivative, and a constant acceleration's third derivative is exactly zero — there is no jerk in a perfectly constant bias for the loop to have any steady-state error against. Only the bias's own instability, its departure from being perfectly constant, contributes any jerk at all, and that is a far smaller quantity than the bias itself.
:::

::: check
Why does deep coupling narrow a post-outage Doppler search by orders of magnitude, when the underlying formula $\delta f_d=\delta a\,\Delta t/\lambda$ has not changed?
:::

::: answer
The formula is unchanged; what changes is which $\delta a$ belongs in it. Without an independent estimate, the receiver must search against the full range of acceleration the vehicle could plausibly have experienced during the outage — potentially several $g$. With deep coupling, the inertial navigator has been predicting velocity throughout the outage from its own measurements, so the only unresolved uncertainty is how much that prediction itself has drifted, set by the accelerometer's bias stability rather than by anything the vehicle's engines did — for a decent sensor, a difference of three to four orders of magnitude in $\delta a$, and the same factor in the resulting search width.
:::

::: check
What is the main integrity risk deep coupling introduces that a loosely coupled architecture does not have, and why does it matter given the previous lesson's slope analysis?
:::

::: answer
In a loosely coupled system, a bad GNSS fix is one more input to an outer filter, which can down-weight, reject, or ignore it while the inertial solution continues independently — a clean firewall. Deep coupling removes that firewall by design, folding GNSS measurements directly into the same state the inertial solution depends on, so a fault the integrity lesson's slope analysis showed produces little or no residual — precisely the kind of fault ordinary consistency checks cannot catch — is no longer confined to a position estimate the vehicle could fall back on inertial navigation to override; it can corrupt the shared state the inertial solution itself is now built from.
:::

## Summary

| Item | Statement |
| --- | --- |
| Vector tracking | One shared Kalman filter replaces $n$ independent DLL/PLL/FLL loops; every channel's discriminator is a measurement, every NCO is steered from the shared estimate |
| Weak-signal benefit | A channel too weak to close its own scalar loop can still be held by the filter, using other channels and the dynamics model; several dB of extra sensitivity |
| Deep coupling | Vector tracking plus a shared inertial/GNSS error-state filter; inertial prediction removes vehicle dynamics from the tracking loop's own burden |
| Dynamic stress, aided | Residual jerk is set by inertial sensor instability, not vehicle jerk; a constant bias alone gives a third-order loop zero steady-state error |
| Reacquisition, aided | $\delta f_d=\delta a\,\Delta t/\lambda$ with $\delta a$ = sensor error, not dynamics envelope; orders of magnitude narrower search |
| Cost | No loosely-coupled integrity firewall; an undetectable GNSS fault (previous lesson) can now corrupt the shared inertial state; tight time synchronisation required |

That is the module, closed on the same thread it opened with: a receiver reading time off a signal seventeen decibels under the noise, turning that into a position by iterating a handful of unit vectors, and surviving — through error budgets, redundancy, differencing, geometry above the constellation, and now a filter shared with the vehicle's own inertial sense of itself — everything real flight throws at that reading.
