---
id: l09-the-integration-only-failure
title: The failure that only appears integrated
minutes: 23
covers:
  - A multiplicative extended Kalman filter on IMU, GNSS and radar altimeter, with error-state formulation and attitude error as a three-parameter local perturbation
  - 'TVC attitude control with bending-mode and slosh notch or roll-off filtering, and gain scheduling against dynamic pressure and mass'
---

The navigation-meets-guidance lesson in this module showed a correlated estimate error costing touchdown accuracy once guidance was in the loop to consume it. That was a failure with a clear address: it appeared in miss distance, guidance's own output, and guidance's assumption of exact current state was the natural place to look. This lesson builds a harder case, deliberately, because it is the one this module has been building toward from its opening lesson: two components, navigation and control, each one passing its own test exactly as specified, and a closed loop that still performs measurably worse than either test predicted — not because either test is wrong, but because the thing that fails lives in neither test's field of view, and only appears once the two components are actually running together.

## Two tests, both passing

Take the same correlated navigation error the earlier lesson built — an attitude estimate error with a fixed one-sigma magnitude of $0.08^\circ$, and a correlation time $\tau$ that varies from run to run. Two checks are run against it, independently, exactly as a real verification program would run them.

**Navigation's own test** checks the filter's reported accuracy against its specification: is the one-sigma attitude uncertainty at or below the required figure? It is, and it is *identically* $0.08^\circ$ regardless of $\tau$, for the same reason the earlier lesson found the filter's reported position uncertainty unchanged by correlation time — the covariance the filter reports depends on the noise model it was built with, and correlation time is not a parameter that model has any way to represent.

**Control's own test** checks the loop's classical margins — gain, phase and delay margin — against requirement, using the frozen-time methodology the control lesson in this module already ran. Those margins are properties of the open-loop transfer function $L(s)=C(s)G(s)$ alone, computed by breaking the loop and sweeping frequency with the reference held at zero; nothing about that calculation involves any particular disturbance's spectral content, so the same $54.79^\circ$ phase margin the control lesson measured holds regardless of what is actually driving the loop from cycle to cycle.

::: key Why both tests are blind to what is about to go wrong
A specification test on a component checks that component against a fixed threshold, using only quantities that component itself produces or is defined against. Neither test above has access to the *other* component's characteristic frequency content — navigation's spec check has no notion of "control's sensitivity peak," and control's margin calculation has no notion of "the correlation time of a specific disturbance." The failure this lesson builds lives exactly in that gap, and it is invisible to both tests by construction, not by oversight.
:::

## What the closed loop actually does

An attitude estimate error entering the control loop as a measurement disturbance is shaped by the loop's **complementary sensitivity**, $T(s)=L(s)/(1+L(s))$ — the same transfer function that describes command tracking, here describing how much of a disturbance at the measurement reaches the output essentially unattenuated.

::: example Where the loop actually amplifies, computed directly
Sweeping $T(j\omega)$ for the reference vehicle's gain-scheduled, notch-filtered attitude loop, its magnitude peaks at $\lvert T\rvert\approx1.35$ ($+2.6\,\mathrm{dB}$) near $\omega\approx2.69\,\mathrm{rad/s}$ ($0.43\,\mathrm{Hz}$) — below the loop's own $4.59\,\mathrm{rad/s}$ crossover, not on top of it, a real and independently checkable feature of this specific loop's shape rather than an assumption. A disturbance with meaningful energy at $0.43\,\mathrm{Hz}$ is not merely passed through — it is *amplified* by this loop, by about $35\%$, precisely because that is where $1+L(j\omega)$ comes closest to zero.
:::

Model the correlated attitude error as a standard correlated (Ornstein–Uhlenbeck) process with a fixed one-sigma amplitude and a swept correlation time, whose power spectral density has a corner frequency at $1/(2\pi\tau)$ — a short $\tau$ pushes most of the error's energy to frequencies well above the loop's sensitivity peak, where $T$ has rolled off and the loop filters it out; a very long $\tau$ concentrates energy near zero frequency, where $T\to1$ and the loop tracks it almost exactly, close to a fixed bias; the interesting case is the $\tau$ whose corner sits closest to the loop's own $0.43\,\mathrm{Hz}$ peak.

::: example Closed-loop attitude jitter, swept across correlation time
Integrating $\lvert T(j\omega)\rvert^2$ against the disturbance's power spectral density over frequency — checked directly against a four-times finer frequency grid and unchanged to six decimal places, so the result reported here does not depend on how finely the integral was evaluated:

| Correlation time $\tau$ | RMS attitude jitter |
| --- | --- |
| $0.05\,\mathrm s$ (near-white) | $0.045^\circ$ |
| $0.3\,\mathrm s$ | $0.079^\circ$ |
| $0.6\,\mathrm s$ | $0.085^\circ$ |
| $1.0\,\mathrm s$ | $0.085^\circ$ |
| $2.0\,\mathrm s$ | $0.084^\circ$ |
| $4.0\,\mathrm s$ | $0.081^\circ$ |
| $8.0\,\mathrm s$ | $0.079^\circ$ |
| $16.0\,\mathrm s$ (near-constant bias) | $0.077^\circ$ |

Every row uses the identical $0.08^\circ$ input amplitude that passes navigation's spec check identically in every case, driven through the identical loop that reports the identical $54.79^\circ$ phase margin in every case. The output jitter still varies by nearly a factor of two — $0.045^\circ$ at the fast end to a peak of $0.085^\circ$ near one second, before falling back toward the near-white figure as $\tau$ grows large enough that the disturbance behaves like a bias the loop's own low-frequency gain tracks cleanly. Neither the navigation test nor the control test, each passing without qualification in every single row, has any way to report this difference, because neither test computes it.
:::

## The diagnosis: overlay the two spectra, not either test alone

Finding this failure before it appears in a flight anomaly requires a specific, different calculation from either component's own verification: plot the disturbance's power spectral density and the loop's complementary-sensitivity magnitude on the *same* frequency axis, and look for where the two curves overlap. That overlay is not a byproduct of either component's own test — navigation's verification never computes a control transfer function, and control's margin sweep never characterizes a specific sensor error's correlation time — it is a calculation that exists only once someone deliberately asks the integration question, which is a different question from "does each piece meet its own spec."

::: key The diagnosis, stated as a procedure
Compute the disturbance's power spectral density from its own characterized correlation time. Compute the closed loop's complementary sensitivity $\lvert T(j\omega)\rvert$ from the control design alone. Overlay them on one frequency axis. A disturbance whose energy sits near the loop's own sensitivity peak costs more than the same disturbance's total power would suggest from either curve read separately — and no threshold check on either curve in isolation reveals that the overlap is the actual problem.
:::

::: warning A margin passing at every frozen point does not bound every possible disturbance
It is tempting to read a healthy phase margin as a blanket guarantee against any input the loop might see. A margin bounds how far the loop is from *instability* for the nominal loop shape; it says nothing about how much a *particular*, bounded, stable disturbance gets amplified on its way through — a loop can be robustly stable and still amplify a well-chosen disturbance by a meaningful factor, precisely because "stable" and "does not amplify some inputs" are different properties of the same transfer function.
:::

::: warning An error budget built from the wrong end of this table understates its own risk
If the control lesson's error allocation had been characterized against a white-noise assumption for navigation error — the $0.045^\circ$ end of this lesson's table, the smallest, easiest case — while the vehicle's real navigation error sits closer to the $0.085^\circ$ peak, the allocation understates the actual jitter by nearly a factor of two, silently spending margin nobody budgeted for. The error-budgeting lesson early in this module allocated one-sigma numbers assuming independence; this lesson is the concrete mechanism by which that independence assumption, and an unstated assumption about *which* noise characterization was used, can each quietly cost real margin.
:::

## Check yourself

::: check
Explain, without referring to any specific number in this lesson, why a navigation accuracy specification test and a control margin test can each pass without qualification while the closed loop's actual performance still varies by a factor of two.
:::

::: answer
Each test is scoped to one component and evaluated using only quantities that component itself defines: navigation's test checks reported accuracy against a threshold, control's test checks classical margins of the open-loop transfer function with the reference held at zero. Neither test's inputs include the *other* component's characteristic — navigation's test has no model of the control loop's sensitivity peak, and control's margin test has no model of a specific disturbance's spectral shape — so a quantity that depends on both together, such as this lesson's closed-loop jitter, cannot be computed, and therefore cannot be bounded, by either test running alone.
:::

::: check
This lesson found the complementary sensitivity's peak at $0.43\,\mathrm{Hz}$, below the loop's $0.73\,\mathrm{Hz}$ ($4.59\,\mathrm{rad/s}$) crossover rather than at it. Why is checking only the behavior *at* crossover not sufficient to catch this lesson's failure mode?
:::

::: answer
Gain and phase margin are both defined at specific frequencies tied to crossover — where the open-loop gain is unity, or where its phase reaches $-180^\circ$ — and neither one reports where the *closed-loop* disturbance-rejection is actually weakest, which for this loop's specific shape turns out to sit at a different frequency than crossover itself. A check that only ever samples the loop's behavior at crossover would never notice that the sensitivity peak — the frequency this lesson's failure mode actually depends on — sits somewhere else on the same frequency axis entirely.
:::

::: check
The jitter table shows the near-white case ($\tau=0.05\,\mathrm s$) producing the *smallest* jitter, not the largest, even though a naive intuition might expect "more random, less predictable" noise to be worse. Explain why the near-white case is actually the most benign.
:::

::: answer
A near-white process spreads its energy across a very wide range of frequencies, most of which sit well above the loop's sensitivity peak, in the region where $\lvert T(j\omega)\rvert$ has rolled off and the loop attenuates rather than amplifies the disturbance. Only the fraction of a near-white process's energy that happens to fall near the $0.43\,\mathrm{Hz}$ peak contributes disproportionately to the output; because so little of a very short-correlation-time process's energy sits there, it passes through the loop more filtered, on average, than a process whose energy is concentrated closer to where the loop actually amplifies.
:::

::: check
A colleague proposes catching this failure mode earlier by tightening the navigation accuracy requirement alone, so that even the worst-case jitter row falls under some fixed limit. Evaluate this fix against what this lesson's diagnosis procedure actually found.
:::

::: answer
Tightening the navigation requirement reduces the disturbance's *amplitude* uniformly across every correlation time, which does shrink every row of the table proportionally — but it does not address the *mechanism*, the overlap between the disturbance's spectral content and the loop's own sensitivity peak, which would still exist at the same $\tau\approx1\,\mathrm s$ and still amplify whatever amplitude of error is present by the same relative factor. A control-side fix — reshaping the loop so its sensitivity peak sits further from the correlation times the real navigation error actually exhibits — addresses the mechanism directly; tightening navigation's requirement alone is a more expensive way to buy the same margin without ever diagnosing why that particular $\tau$ was the dangerous one.
:::

::: check
Why does this lesson insist on checking the numerical integration behind the jitter table against a finer frequency grid, given that the underlying physics — an OU process through a linear filter — has a closed mathematical form?
:::

::: answer
The lesson's own claim rests on a specific *computed* number, not on the existence of a closed form in principle — the actual integral was evaluated numerically over a finite frequency grid, and any numerical integration can in principle depend on how finely that grid resolves a sharp feature such as the sensitivity peak this lesson's whole argument depends on. Checking the result against a substantially finer grid and finding it unchanged to six decimal places is exactly the module's own standing requirement that an integration-derived claim be shown step-size independent before it is quoted, applied here to the one number this lesson's diagnosis could not afford to get wrong.
:::

## Summary

| Item | Statement |
| --- | --- |
| Navigation's own test | Reported one-sigma accuracy, $0.08^\circ$ — identical for every correlation time tested |
| Control's own test | Classical margins of $L(s)$ alone — PM $54.79^\circ$, identical regardless of disturbance content |
| Loop's sensitivity peak | $\lvert T(j\omega)\rvert\approx1.35$ near $0.43\,\mathrm{Hz}$, below the $0.73\,\mathrm{Hz}$ crossover |
| Closed-loop jitter, measured | $0.045^\circ$ ($\tau=0.05\,\mathrm s$) to $0.085^\circ$ ($\tau\approx1\,\mathrm s$) — a factor of $1.9$ from the identical input amplitude |
| The diagnosis | Overlay the disturbance PSD and $\lvert T(j\omega)\rvert$ on one frequency axis — a calculation neither component's own test performs |
| Why it is invisible to component tests | Each test uses only quantities its own component defines; the overlap is a joint property neither one computes |

This is the failure this module was built to make visible: two passing tests, a real closed-loop cost, and a diagnosis that exists only once the two components are actually run together. The next two lessons turn from finding failures to proving the system as a whole: how the algorithms in this module reach flight as one shared implementation, and then the dispersed campaign and written report that turn every claim this module has made into evidence someone else can audit.
