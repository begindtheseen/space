---
id: l09-load-relief-and-guidance
title: Load relief and its interaction with guidance
minutes: 14
covers:
  - Load relief and its interaction with guidance
---

The atmospheric flight module built the control law that runs through the high dynamic-pressure window: load relief, deliberately letting the vehicle weathervane partway into the wind to keep the bending load inside its certified envelope, at the cost of a bounded trajectory error it does not attempt to correct. This module's own second lesson explained why guidance cannot help during that window either. What neither lesson answered is what happens to that error afterward — it does not vanish when dynamic pressure decays, and exoatmospheric guidance inherits it as the very first thing it has to deal with. This lesson prices that inheritance, and finds that not every kind of leftover error costs the same.

## What guidance actually receives

At the moment closed-loop guidance activates — staging, or wherever this module's first lesson placed the handoff — load relief has been running for the whole high-$\bar q$ window, and whatever lateral velocity and lateral position it accumulated while holding the airframe's angle of attack inside its envelope is the vehicle's actual state at that instant, nothing more and nothing less. Guidance does not see "an error"; it sees a current position and velocity, exactly as it does for any dispersed initial condition, and — being the explicit algorithm this module built in detail — it re-solves toward the target from wherever that actually is. The question worth answering precisely is how expensive that re-solve turns out to be, and the answer depends on what *kind* of error load relief left behind.

## A velocity-direction error is cheap

Suppose load relief leaves the vehicle with a small velocity component perpendicular to the direction it needs to be traveling — a cross-range nudge from a wind gust the control law only partially compensated. Absorbing it costs a Δv penalty that is second order in the error, not first:

$$
\Delta v_{\text{penalty}} = \sqrt{v^2 + \delta v_\perp^2} - v \approx \frac{\delta v_\perp^2}{2v}
$$

for $\delta v_\perp \ll v$ — the standard small-angle result for correcting a velocity vector that is nearly, but not exactly, aligned with where it needs to point.

::: example How little a cross-range velocity error actually costs
At a representative exoatmospheric insertion speed $v = 7700\ \mathrm{m/s}$:

| $\delta v_\perp$ | penalty |
| --- | --- |
| 4 m/s | 0.0010 m/s |
| 8 m/s | 0.0042 m/s |
| 12 m/s | 0.0094 m/s |
| 20 m/s | 0.0260 m/s |

Even a 20 m/s cross-range velocity error — large for a load-relief-induced disturbance, which this module's atmospheric flight lesson found runs to a handful of metres per second for a realistic gust under a well-tuned gain — costs a fraction of a tenth of a metre per second to absorb. A purely perpendicular velocity error is nearly free, because the correction needed is dominated by rotating the velocity vector's direction slightly, and a small rotation barely changes a large vector's magnitude.
:::

::: key
A cross-range (perpendicular) velocity error costs a Δv penalty $\approx \delta v_\perp^2/(2v)$ — second order, and small for any realistic load-relief-scale disturbance. Guidance absorbs it almost for free.
:::

## A position error is a different kind of disturbance

A lateral or radial *position* offset at the moment guidance takes over is not the same kind of thing, and does not reduce to the formula above. This module's Powered Explicit Guidance lesson already measured its actual cost directly, by running the full guidance loop from deliberately offset starting altitudes rather than by a shortcut formula:

::: example What an altitude offset at handoff actually costs
From that lesson's dispersed-handoff table, holding speed at its nominal value: starting 10 km *higher* than planned left 6939.4 kg of stage-2 reserve at insertion, 1982.6 kg *more* than the nominal 4956.8 kg; starting 10 km *lower* left 3056.9 kg, 1899.9 kg *less*. Roughly two tonnes of propellant reserve, in either direction, for a 10 km position offset at the start of a burn with about 99 tonnes of propellant loaded — some 190 to 200 kg of reserve per kilometre of unplanned altitude, a cost three to four orders of magnitude larger, kilogram for kilogram of consequence, than the cross-range velocity error above.
:::

The reason is not that guidance handles the two cases differently — the same re-converging cycle handles both identically, as it must, being explicit. It is that the two disturbances are different in kind. A perpendicular velocity error is a small rotation of a vector that already has most of the right magnitude and direction; correcting it barely touches the trajectory's shape. A position offset changes the vehicle's *specific orbital energy relative to the target* at a *fixed remaining burn time* — guidance has no option to wait longer and close a radius gap for free, because the terminal time is exactly what it is also solving for, and closing a larger gap in the time actually available demands a more aggressive, less gravity-loss-efficient trajectory shape. A velocity-direction error and a position error are not the same disturbance measured on different scales; they cost guidance in fundamentally different ways, and load relief, because it accumulates lateral drift *as* a position error over the time it acts, hands guidance the expensive kind, not the cheap kind — bounded, and generally modest for a well-designed load-relief gain, but real, and worth pricing rather than assuming away.

::: warning
Do not conclude from the cross-range formula that load relief's cost to guidance is negligible in general. The formula above applies specifically to a *velocity*-direction error; the position error load relief accumulates over the same window is the costlier kind, and the number to reason about is the reserve a dispersed-start guidance run actually consumes, not a quick angle-based estimate.
:::

## The handoff, precisely

Nothing about this interaction requires load relief and guidance to communicate with each other in flight. Load relief runs, scheduled to the high-$\bar q$ window this module's second lesson defined, doing the best job it can at keeping $\bar q\alpha$ inside its envelope without any awareness that a guidance algorithm exists. Guidance activates afterward, reads the vehicle's actual state, and treats whatever that state is — on-nominal or displaced by a windy day's worth of load relief — as where the boundary-value problem starts, full stop. The interaction this lesson has been pricing is not a protocol between two control laws; it is the fact that one control law's leftover state is the other's entire input, and the cost of that handoff is measured, not designed away, by running the same explicit, re-converging guidance this module has built from the ground up on whatever state it is actually handed.

## Check yourself

::: check
A load-relief event leaves the vehicle with a 6 m/s cross-range velocity error at guidance handoff. Estimate the Δv penalty, using $v = 7700\ \mathrm{m/s}$.
:::

::: answer
$\Delta v_{\text{penalty}} \approx \delta v_\perp^2/(2v) = 6^2/(2\times7700) = 36/15{,}400 = 0.00234\ \mathrm{m/s}$ — a couple of thousandths of a metre per second, negligible against any real propellant budget.
:::

::: check
Explain why the cross-range velocity-error formula from this lesson cannot be reused as-is, with $\delta v_\perp$ replaced by some equivalent quantity, to estimate the cost of a position offset.
:::

::: answer
The formula's derivation assumes a velocity vector that is already close to the correct magnitude and direction, with the error being a small rotation — a genuinely second-order effect on Δv. A position offset does not rotate the current velocity vector at all; it changes where the vehicle is relative to the target at a fixed remaining burn time, which forces guidance to fly a different, generally less gravity-loss-efficient trajectory shape to close the gap in the time available. That is a first-order effect on the trajectory, not a small perturbation to an already-good velocity vector, so no substitution into the same formula captures it correctly — which is exactly why this lesson priced it by citing an actual guidance run rather than deriving a shortcut.
:::

::: check
Using the per-kilometre reserve costs from the lesson (approximately 190–200 kg per km), estimate the reserve cost of a 3 km low-altitude dispersion at guidance handoff, and state one reason the true cost might not scale exactly linearly from the 10 km figure.
:::

::: answer
Scaling linearly, $3\ \mathrm{km} \times \sim195\ \mathrm{kg/km} \approx 585\ \mathrm{kg}$ of reserve. The true relationship need not be exactly linear because the guidance solve is nonlinear — a small dispersion sits closer to the point the local flat-gravity approximation is centred on and may cost proportionally less than a large one, or the two effects (asymmetric high/low behaviour the lesson noted) may not scale identically in both directions; a linear estimate from a single data point is a reasonable order-of-magnitude guide, not a substitute for running the actual case.
:::

::: check
Why is it accurate to say guidance requires no special interaction protocol with load relief, even though load relief's output directly determines how much of guidance's propellant margin gets used?
:::

::: answer
Because guidance is explicit: it reads the vehicle's actual current state every cycle and re-solves toward the target from there, with no dependence on how that state came to be what it is. Load relief's leftover position and velocity error is, to guidance, indistinguishable from any other dispersed starting condition this module has already shown guidance absorbs — the two systems never need to exchange information, because guidance's own input (the true state) already carries everything load relief did, without either system needing to know the other exists.
:::

::: check
A vehicle's load-relief gain is retuned to cut its typical cross-range velocity error in half, at the cost of a somewhat larger typical position error (a real trade in load-relief design, since a stiffer attitude response reduces velocity drift but increases the aerodynamic loads that drove the trajectory off course a little longer before responding — the details are the atmospheric flight module's territory). Based on this lesson, is that trade clearly good for guidance's propellant budget?
:::

::: answer
No — and it may well be the opposite of good. This lesson found velocity-direction errors are cheap for guidance (a fraction of a metre per second even for tens of metres per second of error) while position errors are the expensive kind (hundreds of kilograms of reserve per kilometre). A retune that shrinks the already-cheap error while growing the already-expensive one could easily cost guidance more propellant margin overall, even though it looks like an improvement measured in velocity terms. Evaluating it properly means pricing both changes in the currency that actually matters to guidance — reserve consumed — not assuming a smaller number is automatically a cheaper one.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| What guidance inherits | load relief's leftover lateral position and velocity at the moment closed-loop guidance activates |
| $\Delta v_{\text{penalty}} \approx \delta v_\perp^2/(2v)$ | cost of a cross-range velocity error; second order, small for realistic disturbances |
| Cross-range example | 20 m/s error costs only 0.026 m/s to absorb, at $v=7700$ m/s |
| Position-error example | a 10 km altitude offset at handoff costs roughly 1900–2000 kg of stage-2 reserve, order 190–200 kg/km |
| Why the two differ | a velocity error is a small rotation of an already-good vector (cheap); a position error forces a reshaped trajectory in fixed remaining time (expensive) |
| The handoff | no protocol between load relief and guidance is needed — guidance reads the true state and re-solves, exactly as for any dispersed start |

Everything so far has treated the offline-designed pieces of the pitch program — the kick angle, the reference trajectory guidance measures its dispersions against — as given. The next lesson looks at where they actually come from: the offline optimization problem that sets them, and what it hands to the onboard algorithms this module has spent most of its time building.
