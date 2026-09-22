---
id: l06-control-meets-vehicle
title: 'Control in the loop: TVC, gain scheduling and saturation'
minutes: 25
covers:
  - 'TVC attitude control with bending-mode and slosh notch or roll-off filtering, and gain scheduling against dynamic pressure and mass'
---

The classical-control module built gain scheduling, notch filtering and anti-windup in full generality, each on its own plant, each verified against its own margin requirement. This lesson applies all three to one specific, fully-specified vehicle in one specific, fast-changing flight phase, and in doing so finds one genuinely new thing the ascent-phase treatment never had reason to show: a gain schedule built the way this module builds it holds the loop's margins *exactly* constant across the burn, by construction rather than by luck — right up until it meets a commanded step the actuator cannot instantly deliver, which is where this lesson's join lives.

## Scheduling against mass, not dynamic pressure

A launch vehicle in the ascent phase schedules its attitude gains against dynamic pressure and mass together, because aerodynamic instability and control effectiveness both vary sharply through the atmosphere. A booster in its landing burn faces almost no dynamic pressure worth scheduling against — it has slowed to a controlled descent, well below the speeds where aerodynamic torque competes with thrust vector control — so the destabilizing aerodynamic term $\mu_\alpha$ that dominated the ascent-phase schedule is negligible here, and the schedule is driven almost entirely by the other half of the same formula: the vehicle's own rapidly falling mass.

::: key The landing-burn gain schedule
With $\mu_\alpha\approx0$, the pitch-attitude PD gains reduce to $K_p=\omega_n^2/\mu_\delta$ and $K_d=2\zeta\omega_n/\mu_\delta$, where $\mu_\delta=T\ell_T/I$ is control effectiveness — thrust times lever arm, divided by inertia. Because $I$ falls as propellant burns, $\mu_\delta$ rises through the burn, and the gains must fall in step to hold the same target $(\omega_n,\zeta)$: this is a schedule against mass, not dynamic pressure, the opposite emphasis from the ascent-phase schedule the classical-control module built.
:::

::: example The schedule, computed at three points in the burn
Target $\omega_n=3.0\,\mathrm{rad/s}$, $\zeta=0.7$, at $72\%$ representative throttle:

| Flight time | Mass (kg) | $I$ (kg m²) | $\mu_\delta$ | $K_p$ | $K_d$ | $\omega_{gc}$ (rad/s) | PM |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $t=0\,\mathrm s$ | $31{,}600$ | $4.645\times10^6$ | $2.720$ | $3.309$ | $1.544$ | $4.589$ | $54.79^\circ$ |
| $t=10\,\mathrm s$ | $29{,}168$ | $4.288\times10^6$ | $2.947$ | $3.054$ | $1.425$ | $4.589$ | $54.79^\circ$ |
| $t=20\,\mathrm s$ | $26{,}736$ | $3.930\times10^6$ | $3.215$ | $2.799$ | $1.306$ | $4.589$ | $54.79^\circ$ |

The gains fall by about $15\%$ over these twenty seconds, exactly tracking $1/\mu_\delta$ — and the crossover frequency and phase margin do not move at all, to the precision shown. This is not a coincidence of these particular numbers: because both the controller's gains and the plant's own effectiveness scale through the identical $\mu_\delta$, in opposite directions, the open-loop transfer function this schedule produces is *algebraically independent* of mass and thrust once the schedule tracks the plant's own $\mu_\delta$ correctly. A schedule built this way does not merely keep margins acceptable across a changing vehicle — it keeps them fixed, exactly, as a direct consequence of how the gains were derived.
:::

That invariance is a property of the *rigid-body* loop shape alone; it says nothing about whether tracking $\mu_\delta$ closely enough to realize it in practice is itself safe, which is a question about how fast $\mu_\delta$ actually moves relative to the schedule's own update rate — precisely the slow-variation check the rate-architecture lesson in this module already ran for this burn, finding the landing burn's mass changing about three times faster, relative to one control-loop period, than the ascent burn's own figure, and still comfortably inside the regime where a frozen-time schedule is trustworthy.

## The bending mode, and what the notch costs here

The reference vehicle's first bending mode in its landing configuration — light, nearly empty, a much smaller stack than at liftoff — sits at $25.1\,\mathrm{rad/s}$ ($4\,\mathrm{Hz}$), well above the $2.9\,\mathrm{Hz}$ ascent-phase mode the classical-control module's own worked example used, a direct consequence of a lighter structure carrying a stiffer effective spring. Left unfiltered, the flexible plant's peak open-loop gain near this mode reaches $+0.61\,\mathrm{dB}$ — inside a hair of the classical-control module's gain-stabilization requirement, close enough that dispersion in the mode's true frequency would risk crossing it. A notch removes the margin, gain-stabilizing the mode rather than gambling on its phase.

::: example The notch, verified against its own design formula
Using $N(s)=(s^2+2\zeta_n\omega_ms+\omega_m^2)/(s^2+2\zeta_ds+\omega_m^2)$ with $\zeta_n=0.06$, $\zeta_d=0.35$: the depth at the modal frequency, computed directly from the frequency response, is $-15.32\,\mathrm{dB}$, matching the design formula $20\log_{10}(\zeta_n/\zeta_d)=20\log_{10}(0.06/0.35)\approx-15.32\,\mathrm{dB}$ exactly. At the loop's own crossover, far below the mode, the notch costs only $-6.23^\circ$ of phase — dropping phase margin from $61.15^\circ$ (no notch) to $54.79^\circ$ (with notch) — while pulling the bending-mode peak from $+0.61\,\mathrm{dB}$ down to $-13.97\,\mathrm{dB}$, comfortably gain-stabilized. Both the depth and the phase cost were computed directly from the same frequency response the margin table above used, not assumed from the design formula alone.
:::

Where a mode sits close enough to crossover that a notch would cost more phase than the loop can spare, the classical-control module's alternative — a wide, low-order roll-off shaping the loop's own gain down through the mode's frequency rather than a sharp notch tuned to it — is the standard fallback, at the cost of some bandwidth rather than some phase; this vehicle's four-fold separation between crossover and its bending mode leaves enough room that the sharper notch is the better trade here, but the choice is a real one to make explicitly rather than a default.

## The join: saturation meets the mode-transition step

A gain-scheduled, notch-filtered loop with over fifty degrees of phase margin sounds unconditionally safe. It is safe — for small commands, tracked from near the linear operating point every margin calculation above assumed. The mode-transition command the previous lesson in this module introduced, a $15.12^\circ$ reorientation commanded almost instantly at landing-burn ignition, is not a small command, and the actuator's own $5^\circ$ deflection limit saturates hard the moment that step arrives.

::: example What saturation does to three different integrators
Commanding the full $15.12^\circ$ step at ignition, with the schedule above and the actuator's real rate-and-position limits included, three integrator treatments diverge sharply:

| Integrator | Peak overshoot | Settling (2% band) | Final error at $6\,\mathrm s$ |
| --- | --- | --- | --- |
| Naive | $36.8^\circ$ beyond target | not settled by $6\,\mathrm s$ | $13.5^\circ$ |
| Back-calculation | $2.88^\circ$ beyond target ($19\%$) | $3.82\,\mathrm s$ | settled |
| Conditional integration | $13.2^\circ$ beyond target | not settled by $6\,\mathrm s$ | $11.3^\circ$ |

The naive integrator does not merely overshoot badly — its response, driven by an accumulated command the actuator can never deliver, swings past the target and keeps swinging for many seconds, the same open-loop-while-saturated mechanism the classical-control module derived, made dramatically worse here because the actuator's authority relative to this particular command is far smaller than that module's own worked example used. Back-calculation, feeding the difference between the actuator's actual, limited output and the controller's unlimited demand straight into the integrator, recovers a clean, converged response in well under four seconds; conditional integration, freezing rather than actively correcting the integrator, does better than naive but still has not settled six seconds after the step.
:::

Back-calculation's advantage here is not merely smaller overshoot — it is the difference between a controller that converges and one that does not, for a command this large relative to the actuator's authority. That gap is worth taking seriously as a design conclusion, not only a tuning preference: with an actuator this constrained relative to the commands guidance can hand it, the choice of anti-windup scheme decides whether the vehicle recovers from a large reorientation at all within a time that matters.

::: key The join, stated precisely
A gain-scheduled, notch-filtered loop's margins describe its behavior near the linear operating point the schedule was designed around. A command large enough to saturate the actuator leaves that regime entirely — the loop is, for as long as the actuator stays pinned, open — and which anti-windup scheme is running decides whether the vehicle recovers cleanly or oscillates for many seconds after the saturation ends.
:::

::: warning Margins and windup are two separate risks, not one
It is tempting to read a comfortable phase margin as blanket reassurance and stop checking anything else about a large command. The margin describes small-signal behavior; nothing about a $54.79^\circ$ phase margin bounds what happens once an actuator saturates, because saturation is a nonlinearity no linear margin calculation sees at all. Both checks are necessary, and neither substitutes for the other — this lesson's gain-schedule table and its windup table are answering genuinely different questions about the same loop.
:::

::: warning A large command should usually be shaped before it reaches this loop, not merely survived by it
This lesson shows the controller *recovering* well from a large step once a good anti-windup scheme is running — a real and valuable property. It is not the same claim as the step being a good idea to command in the first place. The mode-management lesson later in this module takes up the upstream fix directly: shaping the commanded reference itself so the actuator rarely saturates this hard to begin with, which is cheaper, in propellant and in risk, than recovering gracefully from a saturation that shaping could have avoided.
:::

## Check yourself

::: check
Explain, from the formulas $K_p=\omega_n^2/\mu_\delta$ and $K_d=2\zeta\omega_n/\mu_\delta$, why the open-loop transfer function's shape near crossover is unchanged as mass falls through the burn, even though both gains themselves fall by about $15\%$.
:::

::: answer
The open-loop transfer function near crossover is proportional to $C(s)\times\mu_\delta/s^2$ where $C(s)=K_p+K_ds$; substituting the schedule's own gains gives $C(s)\,\mu_\delta = \omega_n^2+2\zeta\omega_n s$, an expression with no $\mu_\delta$ left in it at all. Both the controller's gains and the plant's effectiveness scale through the same $\mu_\delta$, in exactly opposite directions, so the product the loop actually depends on is invariant to mass and thrust as long as the schedule tracks the plant's true, current $\mu_\delta$ — the individual gain values change because $\mu_\delta$ changes, while the loop they produce does not.
:::

::: check
Why does the landing-burn bending mode sit at a higher frequency, $4\,\mathrm{Hz}$, than the ascent-phase example's $2.9\,\mathrm{Hz}$, and why does that matter for the notch design?
:::

::: answer
A landing-burn vehicle is much lighter — dry structure plus a small remaining propellant load — while its structural stiffness is set mostly by the airframe itself, which does not shrink along with the propellant; a lighter mass on a comparably stiff structure raises the natural frequency of the mode. It matters for the notch because the *ratio* between crossover and the modal frequency sets the notch's phase cost at crossover: a mode further above crossover, in absolute or in relative terms, lets the same notch depth cost noticeably less phase, which is exactly why this lesson's notch only spends $6.23^\circ$ at crossover rather than the far larger cost a mode closer to crossover would exact.
:::

::: check
The windup table shows conditional integration performing better than naive but still not settled after six seconds. Using the mechanism the classical-control module derived, explain why conditional integration alone is not enough here, when it performed reasonably well on that module's own, more modestly saturated example.
:::

::: answer
Conditional integration freezes the integrator's accumulation while saturated but does nothing to drive it toward the value that actually corresponds to what the actuator is delivering — it stops digging the hole deeper without filling it back in. For a command this much larger than the actuator's authority, the integrator is pinned at whatever value it reached the instant saturation began, which can still be far from the value that would let the loop respond cleanly once the error starts to fall — exactly the "freezes wherever it happened to be, an accident of timing" weakness the classical-control module named, made more consequential here because the saturation this command produces lasts far longer than in that module's own gentler example.
:::

::: check
A colleague proposes fixing the windup problem entirely by increasing the actuator's gimbal deflection limit from $5^\circ$ to $15^\circ$, removing saturation from this specific step altogether. What does this lesson's gain-schedule section suggest should be checked before accepting that change?
:::

::: answer
The gain schedule and its margin invariance were derived and verified for the vehicle's actual torque authority at the existing deflection limit; a larger maximum deflection changes the vehicle's maximum available torque and hence its actual dynamic response near saturation, which is a legitimate design change but not a free one — it has its own cost in actuator mass, hydraulic or electric power, and possibly a different peak torque interacting with the bending mode's residue at the actuator station, all of which this lesson's margin and notch analysis would need to be re-run against, not merely assumed to still hold at the new limit.
:::

::: check
Both this lesson's gain-schedule margin table and its windup table were computed for the identical vehicle at the identical instant. Explain why a program cannot conclude "the loop is safe" from the margin table alone, using only what the windup table adds.
:::

::: answer
The margin table describes the loop's linear, small-signal behavior — how it responds to an infinitesimal perturbation about its operating point — while the windup table describes what happens for a large command that leaves that regime entirely by saturating the actuator, a genuinely nonlinear behavior no linear margin number encodes. A loop can carry a comfortable phase margin and still, for the right size of command, oscillate for many seconds under a poorly chosen anti-windup scheme; only a nonlinear, time-domain check like the windup table can see that risk, which is exactly why this module runs both rather than treating a passing margin as sufficient evidence on its own.
:::

## Summary

| Item | Statement |
| --- | --- |
| Landing-burn schedule | $\mu_\alpha\approx0$ (negligible aero); $K_p=\omega_n^2/\mu_\delta$, $K_d=2\zeta\omega_n/\mu_\delta$, driven by mass through $\mu_\delta=T\ell_T/I$ |
| Margin invariance | $\omega_{gc}=4.589\,\mathrm{rad/s}$, PM $=54.79^\circ$, identical at $t=0,10,20\,\mathrm s$ — an exact consequence of scheduling on the plant's own $\mu_\delta$ |
| Bending mode | $25.1\,\mathrm{rad/s}$ ($4\,\mathrm{Hz}$), higher than the ascent module's $2.9\,\mathrm{Hz}$ example — lighter vehicle, comparable stiffness |
| Notch | Depth $-15.32\,\mathrm{dB}$ (matches $20\log_{10}(\zeta_n/\zeta_d)$ exactly); phase cost at crossover $-6.23^\circ$; bending peak $+0.61\,\mathrm{dB}\to-13.97\,\mathrm{dB}$ |
| The join | A $15.12^\circ$ step saturates the $5^\circ$ actuator hard; naive integration overshoots $36.8^\circ$ and has not settled by $6\,\mathrm s$; back-calculation settles in $3.82\,\mathrm s$ |
| What margins do and do not cover | Small-signal behavior only — saturation is a nonlinearity no linear margin calculation detects |

Control's own recovery from a large command is one defense; the next lesson takes up the other, upstream one — the mode manager that decides when a command this large is issued in the first place, and what a discontinuous handover between guidance laws does at the boundary between two modes.
