---
id: l10-offline-trajectory-optimization
title: Ascent trajectory optimization as an offline problem
minutes: 14
covers:
  - Ascent trajectory optimization as an offline problem feeding onboard guidance
---

This module has, from its first lesson, treated the pitch-kick angle, the staging point, the acceleration limit, and the exoatmospheric target as given numbers, handed to the flight software from somewhere. This lesson is about that somewhere. None of those numbers is arbitrary, and none of them is computed in flight. They come out of an **offline trajectory optimization** — solved once, on the ground, before the vehicle ever leaves the pad, using tools deliberately more expensive than anything this module's onboard algorithms could afford — and the split between that offline problem and the onboard guidance this module has spent most of its time building is not a historical accident. It is a division of labor between two problems that need genuinely different tools.

## Two problems, two budgets

The offline problem can afford almost anything: hours of computer time, a full nonlinear vehicle model with real atmosphere, real aerodynamics, a structural loads model, and every constraint the vehicle actually has to respect, solved with the optimal control module's heavier machinery — direct collocation, or the iterative linear-quadratic and differential dynamic programming methods that module's own final lesson develops for exactly this class of nonlinear problem. It is run at most a handful of times before a given mission — during vehicle design, and again for a day-of-launch update this module returns to next — and its output is a reference: a pitch program, a staging time, a set of I-loads, the parameters this module's earlier lessons have been quietly assuming.

The onboard problem gets a guidance cycle's worth of time, on flight-qualified hardware, running for the entire burn — and it is exactly the constraint the linear tangent law, PEG, and Iterative Guidance Mode were all built to satisfy: closed form, or nearly so, fast enough to re-solve from scratch every few seconds for as long as the vehicle is powered. It does not have access to a full atmosphere model, a structural loads model, or hours of compute; it has a flat-gravity local approximation and the vehicle's current state, on purpose, because that is what fits the budget.

::: key
Offline optimization affords a full-fidelity vehicle and environment model, solved once (or occasionally) before flight, producing the reference and the parameters onboard guidance flies. Onboard guidance affords a deliberately cheap local model, re-solved every cycle, because that is what the real-time budget allows.
:::

## The constraint that actually decides the answer

It is tempting to picture the offline problem as "minimize propellant" alone and stop there, but this module's own first lesson already showed that picture is incomplete: gravity loss falls and drag loss rises as the pitch-kick angle steepens, and somewhere in between sits whichever angle minimizes their sum. Finding that minimum properly — the way an offline optimizer actually would — shows something the four-point comparison in that first lesson could only hint at.

::: example Where the loss-minimizing kick angle actually sits
Scanning the same vehicle's total loss ($\Delta v_{\text{grav}} + \Delta v_{\text{drag}}$) finely across kick angle:

| kick | gravity loss | drag loss | total loss | max-$\bar q$ |
| --- | --- | --- | --- | --- |
| $1.60^\circ$ | 540.4 m/s | 30.4 m/s | 570.8 m/s | 39.8 kPa |
| $2.00^\circ$ | 434.1 m/s | 37.1 m/s | 471.3$^\ast$ m/s | 44.6 kPa |
| $2.50^\circ$ | 319.9 m/s | 62.7 m/s | 382.5 m/s | 54.2 kPa |
| $2.60^\circ$ | 299.3 m/s | 75.0 m/s | 374.2 m/s | 57.2 kPa |
| $\mathbf{2.70^\circ}$ | 279.4 m/s | 92.8 m/s | $\mathbf{372.2}$ m/s | $\mathbf{84.4}$ kPa |
| $2.80^\circ$ | 260.1 m/s | 118.9 m/s | 379.0 m/s | 153.3 kPa |
| $3.00^\circ$ | 223.4 m/s | 215.2 m/s | 438.5 m/s | 479.9 kPa |

($^\ast$ 434.1+37.1, matching the first lesson's figures to rounding.) The minimum of gravity-plus-drag loss sits near $2.70^\circ$, not the $2.0^\circ$ this module has flown as its running example throughout — and at that minimum, max dynamic pressure has already reached 84.4 kPa, roughly double the 25–40 kPa range a real orbital launcher is actually built to survive. The true, unconstrained loss minimum is not a candidate answer at all; a real offline optimization is solving a *constrained* problem, minimize loss subject to $\bar q_{\max}$ (or, more precisely, the $\bar q\alpha$ load indicator) staying inside the structural envelope, and the constraint — not the interior stationary point of the loss function — is what actually sets the kick angle a real vehicle flies. This module's $2.0^\circ$ running example sits comfortably inside that constraint with margin to spare for wind and dispersions; $2.70^\circ$ would not survive a real wind day at all.
:::

::: key
The offline ascent optimization is a *constrained* problem — minimize propellant loss subject to the structural load envelope — and for a real vehicle the load constraint is what actually binds. The unconstrained loss-minimizing trajectory typically overruns it, which is why the flown pitch program sits short of where propellant alone would put it.
:::

## Why the onboard model is allowed to be cheap

::: example The same cheap model, trusted for the wrong length of time
This module's Powered Explicit Guidance lesson computed a single guidance cycle's steering law from a flat-gravity, drag-free local model — the exoatmospheric stage-2 burn's very first cycle, solved for $(A,B,t_{go}) = (6.4124,\, -0.020982,\, 354.09\ \mathrm{s})$. That local model, asked to predict its own trajectory's outcome, believed it would reach the target orbit exactly — carried to full precision, its residual is the numerical solver's, not the model's, better than $10^{-9}$ in relative terms. Flown open loop against the true, curved-gravity dynamics for the entire 354 s burn, with no re-solving, the same steering law instead missed by 163.8 km of altitude, 343.5 m/s of tangential speed, and 1238.6 m/s of residual radial velocity.

Read from this lesson's side, the result says something about *time*, not accuracy: the local model was not wrong about its own mathematics, it was trusted for 354 seconds when its assumptions are good for a few. The offline optimizer's high-fidelity model is built to be trusted for the entire atmospheric phase — several hundred seconds — with nothing correcting it until the vehicle is airborne, which is exactly why it cannot afford the same flat-gravity, drag-free shortcuts the onboard cycle uses safely, one cycle at a time.
:::

It is not evidence that the local model is a bad model — it is evidence that a cheap model is only as good as how briefly it is trusted, and the offline/onboard split is built around that fact deliberately: the offline solution carries full fidelity because it has to be trusted for the *entire* flight, with nothing correcting it in real time beyond the day-of-launch update this module returns to shortly; the onboard solution can stay cheap precisely because it is never trusted for more than one guidance cycle before being thrown away and recomputed.

::: warning
Do not read "offline" as "fixed once and never touched again." A day-of-launch wind update re-runs a version of this same offline optimization a few hours before liftoff, with a measured atmosphere in place of a design-reference one, producing a new pitch program without changing anything about the onboard guidance algorithm itself. Offline and onboard describes *when* and *how expensively* a problem is solved, not how often its answer changes.
:::

## Check yourself

::: check
Explain why "minimize gravity loss plus drag loss" is not, by itself, a complete statement of the offline ascent optimization problem.
:::

::: answer
The worked example shows the unconstrained minimum of gravity-plus-drag loss sits near a $2.70^\circ$ kick angle, where maximum dynamic pressure reaches 84.4 kPa — roughly double what a real launcher's structure is built to survive. A trajectory that minimizes propellant loss without regard to the structural load it produces is not a usable answer; the real problem minimizes loss *subject to* the vehicle's load envelope, and for this vehicle that constraint binds well before the unconstrained minimum is reached.
:::

::: check
A design team wants to fly the $2.70^\circ$ kick angle from the worked example because it uses 99.1 m/s less propellant than the $2.0^\circ$ case. What single number from this lesson is the strongest argument against it, and why?
:::

::: answer
The 84.4 kPa maximum dynamic pressure at $2.70^\circ$, against a typical real-launcher structural range of 25–40 kPa. A propellant saving that requires flying at roughly double the dynamic pressure the vehicle's structure is sized for is not a saving available to the design at all — the vehicle would need to be substantially reinforced (at a mass cost likely exceeding the propellant saved) or the trajectory is not survivable as proposed at all.
:::

::: check
Why can the onboard guidance algorithm get away with a flat-gravity, drag-free local model when the offline optimizer cannot?
:::

::: answer
Onboard guidance never trusts its local model for more than one guidance cycle — a few seconds — before re-solving from the vehicle's true state, so the model's error has only that short an arc to accumulate over, as this module's PEG lesson demonstrated directly. The offline optimizer's output is flown open loop for the *entire* atmospheric phase, with nothing re-solving it in real time, so any inaccuracy in its model is carried, uncorrected, for the whole flight — which is exactly why it needs the full-fidelity atmosphere, aerodynamics and structural model the onboard algorithm has no time or hardware budget for.
:::

::: check
A day-of-launch wind update changes the pitch program a few hours before liftoff. Does this mean the guidance algorithm running onboard during ascent is different from the one that would have run without the update?
:::

::: answer
No. The update re-runs the offline optimization with a measured wind profile in place of a design-reference one, changing the *stored parameters* — the pitch program the vehicle flies open loop — not the onboard guidance algorithm's structure or code. The onboard algorithm (the open-loop pitch program through the atmosphere, PEG or IGM-style explicit guidance afterward) is exactly the same software either way; only the reference numbers it is handed differ.
:::

::: check
Suppose the offline optimizer used a cruder, faster atmosphere model to search many candidate kick angles quickly, then verified only the winning candidate with the full-fidelity model before finalizing it. Is this a reasonable engineering compromise, and what would you still want to check?
:::

::: answer
It is a reasonable and common pattern — use a cheap model for a broad search, then confirm the selected answer with the expensive one — provided the cheap model is accurate enough that its optimum is close to the true optimum, so the final verification is checking a good candidate rather than discovering the search missed the real answer entirely. What is worth checking specifically is not just whether the winning candidate satisfies the load constraint under the full model, but whether a neighboring candidate the cheap model ranked slightly worse might actually be better (or the true constrained optimum) under the full model — a cheap search model can shift where a constrained optimum appears to sit, not just its exact value.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Offline optimization | full-fidelity vehicle and environment model, solved before flight; produces the pitch program, staging point, load limits |
| Onboard guidance | deliberately cheap local model, re-solved every cycle; affordable only because it is never trusted for long |
| The real offline problem | minimize propellant loss *subject to* the structural load envelope — a constrained, not unconstrained, optimization |
| Worked kick-angle scan | unconstrained loss minimum near $2.70^\circ$ (84.4 kPa) vs. the flown $2.0^\circ$ (44.6 kPa, well inside the envelope) |
| Why cheap onboard models are safe | re-solved every few seconds, so local error never accumulates over more than one cycle |
| Why offline models must be expensive | flown open loop for the whole atmospheric phase, with nothing correcting them in real time |
| Day-of-launch update | re-runs the offline optimization with measured wind; changes parameters, not the onboard algorithm |

The next lesson takes up that day-of-launch update directly — what measured wind data actually changes about the pitch program, and how much performance and structural margin buying that accuracy is worth.
