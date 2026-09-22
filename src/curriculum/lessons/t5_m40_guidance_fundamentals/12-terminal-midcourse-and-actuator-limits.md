---
id: l12-terminal-midcourse-and-actuator-limits
title: Terminal versus midcourse guidance, and actuator limits
minutes: 23
covers:
  - Terminal vs midcourse guidance; guidance under actuator limits
---

Every guidance law this module has derived was posed as though the vehicle could sense its state precisely and command whatever acceleration the law asked for. Neither assumption survives a whole flight intact. Far from the target, precise relative sensing may not exist yet at all — there is nothing to lock onto until the range closes enough. And every real actuator, whatever the law commands, can only push so hard. This closing lesson takes on both gaps: how a flight is split into a coarse phase and a precise one, and what actually happens when a guidance law asks for more than the vehicle can deliver.

## Midcourse guidance

**Midcourse guidance** covers the phase where the objective is coarse — get into the right neighborhood, on a safe and efficient path, ready for a precision phase to finish the job — not drive any error to zero. It typically runs before fine relative sensing is even available: a chaser far from a target vehicle, a missile before seeker lock-on, all have to fly on coarse navigation and a correspondingly coarse guidance law. The corridor-following, line-of-sight-style guidance from earlier in this module is a natural midcourse law for exactly this reason — cheap, well-behaved, and not asking for more precision than the available sensing can support.

## Terminal guidance and the handoff

**Terminal guidance** takes over once fine sensing is available and the remaining time is short enough that precision matters and is achievable — proportional navigation and zero-effort-miss/velocity guidance, with their steep, time-to-go-dependent gains, are built for exactly this phase and would be needlessly aggressive (and needlessly demanding of the sensing) run any earlier.

::: example A handoff that does not need to be perfect
Midcourse corridor guidance (the earlier lesson's law, $\ddot y = -k_1y-k_2\dot y$ with $k_1=4\times10^{-4}\,\mathrm{s^{-2}}$, $k_2=0.04\,\mathrm{s^{-1}}$) flies for $200\,\mathrm{s}$ from $y_0=8\,\mathrm{m}$, $\dot y_0=0.02\,\mathrm{m/s}$ — a shorter run than the earlier lesson's full example, deliberately handed off before it has fully converged:

```python
# midcourse: rhs = ydot, -k1*y - k2*ydot ; integrated to t=200s
print(y_h, ydot_h)
# 0.8059   -0.01282
```

$0.806\,\mathrm{m}$ and $-0.0128\,\mathrm{m/s}$ of residual at handoff — not zero, and not meant to be. Switch to ZEM/ZEV terminal guidance from there, targeting zero at $t_{go}=15\,\mathrm{s}$:

```python
# terminal: a = (6/tgo^2)*zem - (2/tgo)*zev, closed loop to tgo=0
print(yf, ydotf)
# 2.3e-21   -1.7e-14
```

Contact accuracy at the level of floating-point noise, from a handoff state that was still off by nearly a metre. The point of the handoff is precisely this: midcourse guidance's job is to get *close enough* that terminal guidance's much steeper gains can finish the correction in the time remaining — not to converge on its own.
:::

::: key Two phases, two jobs
Midcourse: coarse accuracy, whatever sensing is available, a safe and efficient path toward the engagement — not convergence. Terminal: fine sensing, steep time-to-go-dependent gains, drives the actual objective (miss, or position and velocity together) to zero in the time that remains. The handoff between them happens when fine sensing becomes available and enough flight time remains for terminal guidance's gains to do the work — not at some fixed range chosen in advance.
:::

## Guidance under actuator limits

Every law this module derived commands whatever acceleration $a_{lat} = NV_c\dot\lambda$ or $(6/t_{go}^2)ZEM-(2/t_{go})ZEV$ works out to, with no regard for whether a thruster, a gimbal, or a lifting surface can actually produce it. Real actuators saturate, and near intercept or touchdown — exactly where these laws' gains grow steepest — is exactly where the demanded acceleration is most likely to exceed what is available.

A saturated command is not simply a smaller version of the correct one. The **optimal control module's** treatment of a hard control bound, via Pontryagin's minimum principle, showed that the true optimal solution under a bound is generally **bang-bang** — full available authority in the needed direction for as long as the constraint binds, not a scaled-down copy of the unconstrained feedback law. Clipping a linear guidance law's output to the actuator limit is a common and reasonable practical approximation to that behavior — a heavily saturated linear law does end up commanding close to full authority in the needed direction, much like a bang-bang solution would — but it is an approximation, not the constrained-optimal trajectory itself; the truly optimal switching structure accounts for the bound *throughout* the remaining flight, while a clipped linear law only reacts to it one instant at a time.

::: example What a thrust limit actually costs at contact
Continuing the docking approach above from the same $t_{go}=8\,\mathrm{s}$ terminal state, compare the unsaturated command's peak magnitude against three available thrust limits:

| Available $\lvert a_{max}\rvert$ | Final $y$ | Final $\dot y$ |
| --- | --- | --- |
| unlimited (peak demanded: $0.0722\,\mathrm{m/s^2}$) | $\approx0$ | $\approx0$ |
| $0.05\,\mathrm{m/s^2}$ | $-0.0084\,\mathrm{m}$ | $-0.0183\,\mathrm{m/s}$ |
| $0.03\,\mathrm{m/s^2}$ | $-0.0669\,\mathrm{m}$ | $-0.1031\,\mathrm{m/s}$ |
| $0.02\,\mathrm{m/s^2}$ | $+0.0633\,\mathrm{m}$ | $-0.1728\,\mathrm{m/s}$ |

```python
a = zem_zev_accel_1d(y, ydot, tgo)
a = np.clip(a, -a_max, a_max)   # saturate to what the actuator can deliver
```

Halving the available thrust from $0.05$ to $0.02\,\mathrm{m/s^2}$ (well below the unsaturated law's $0.0722\,\mathrm{m/s^2}$ peak demand) roughly triples the residual offset and very nearly triples the contact velocity — and the residual even changes *sign* between the $0.03$ and $0.02\,\mathrm{m/s^2}$ cases, a sign a linear, unsaturated analysis would never predict: deep saturation does not merely scale the outcome down, it can change the qualitative shape of the terminal trajectory, including whether it overshoots the target line before arriving. A contact velocity of $0.17\,\mathrm{m/s}$ against a docking mechanism rated for a small fraction of that is the concrete, physical meaning of "the actuator could not keep up."
:::

::: warning A saturating law degrades silently, then all at once
Nothing in a clipped command announces that it has been clipped — it is still a number, still applied, and the vehicle still appears to be "flying the guidance law" right up until the resulting miss or contact velocity turns out unacceptable. This is the same silent-failure character time-to-go errors had two lessons ago, and for the same underlying reason: a law derived assuming unconstrained authority does not know, from its own output alone, when that assumption has stopped holding. Monitoring the *ratio* of commanded to available acceleration, not just the final outcome, is what catches this before contact rather than after.
:::

::: note Real terminal guidance is often designed around the limit, not surprised by it
A mature design does not discover the actuator limit empirically at contact — it sizes the terminal guidance gains, the handoff conditions, and the thruster or engine themselves together, so that the acceleration the law is expected to demand in the worst dispersion case stays inside what the hardware can deliver. The time-to-go lesson's root-finding example, choosing the latest $t_{go}$ whose initial command still respects a thrust limit, is exactly this kind of design decision made explicit rather than left to be discovered the hard way.
:::

## Check yourself

::: check
Why is it correct for midcourse guidance to hand off a nonzero residual error to terminal guidance, rather than being expected to converge on its own?
:::

::: answer
Midcourse guidance is doing a different job — getting into the right neighborhood with whatever coarse sensing is available — not driving the final objective to zero. Terminal guidance's gains, scaling as $1/t_{go}$ and $1/t_{go}^2$, become far steeper than any midcourse law's fixed gains as $t_{go}$ shrinks, so it is far better positioned to finish a small residual correction in the time remaining than midcourse guidance would be trying to reach the same precision over its own, much longer remaining flight. Expecting midcourse guidance to fully converge would mean running it with needlessly aggressive gains for needlessly long, against sensing that may not even support that precision yet.
:::

::: check
At handoff, the required terminal command was $-0.0181\,\mathrm{m/s^2}$ at $t_{go}=15\,\mathrm{s}$. If the available thruster can deliver at most $0.01\,\mathrm{m/s^2}$, what happens at this instant?
:::

::: answer
The required command's magnitude, $0.0181\,\mathrm{m/s^2}$, exceeds the $0.01\,\mathrm{m/s^2}$ available, so the actuator saturates immediately: the vehicle applies $-0.01\,\mathrm{m/s^2}$, the largest it can manage in the required direction, rather than the full $-0.0181\,\mathrm{m/s^2}$ the unconstrained law asked for. The guidance law's output is still computed correctly; what changes is that the vehicle cannot fully execute it, and the trajectory from this point on departs from what the unconstrained analysis predicted.
:::

::: check
Why is clipping a linear guidance law's output to an actuator limit only an *approximation* to the true constrained-optimal solution, rather than the same thing?
:::

::: answer
The true constrained-optimal solution, from the optimal control module's Pontryagin treatment of a hard bound, accounts for the constraint over the *entire* remaining trajectory when deciding the whole control history — it is generally bang-bang, full authority in one direction, then possibly the other, chosen so the overall trajectory is optimal given that the bound will bind. Clipping a linear feedback law only reacts to the bound instant by instant, using whatever the unconstrained law happens to prescribe at each moment and truncating it — it never re-derives what the best use of limited authority over the *whole* remaining flight would be, so a heavily saturated clipped law can behave close to bang-bang without actually being the optimal bang-bang solution to the constrained problem.
:::

::: check
In the docking example, tightening the thrust limit from $0.03$ to $0.02\,\mathrm{m/s^2}$ flipped the sign of the final position offset. Does this mean the guidance law is malfunctioning?
:::

::: answer
No — it is a real, if counterintuitive, consequence of deep saturation. An unsaturated linear law's response scales smoothly and predictably with its inputs; a saturated one does not, because the actuator is applying its maximum available effort for an extended stretch rather than the smoothly-varying amount the law would otherwise prescribe, which can let the state overshoot the target line before the remaining, still-limited authority can arrest and reverse it. This is exactly the kind of qualitative behavior change a linear, unsaturated analysis cannot predict, and exactly why monitoring how close a command runs to the actuator limit matters well before the limit is reached, not only after an unexpected result shows up.
:::

::: check
A design review proposes handing off from midcourse to terminal guidance as early as possible, on the reasoning that "more time for terminal guidance to work can only help." What does this lesson's material suggest is missing from that reasoning?
:::

::: answer
Terminal guidance needs fine sensing to be meaningful, and handing off before that sensing is actually available or reliable gains nothing — the steep terminal gains would be reacting to noisy or unavailable measurements rather than a genuinely better state estimate. There is also an actuator-authority argument in the other direction from what the proposal assumes: handing off later, closer to the target, generally means a *smaller* midcourse residual to correct and less total propellant spent fighting terminal guidance's steep gains against a large error, provided the remaining terminal time still comfortably respects the actuator limits worked out above. "Earlier is always better" ignores both the sensing precondition and the same actuator-saturation trade-off this lesson just quantified.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| Midcourse guidance | Coarse accuracy, available sensing, get to the right neighborhood — not convergence |
| Terminal guidance | Fine sensing, steep $1/t_{go}$-scaled gains, drives the real objective to zero |
| Handoff condition | When fine sensing becomes available and enough flight time remains for terminal gains to finish the job |
| Actuator saturation | The commanded acceleration can exceed what hardware delivers, especially late in flight where gains are steepest |
| Clipped vs constrained-optimal | Clipping reacts instant by instant; the true Pontryagin-optimal bang-bang solution accounts for the bound over the whole remaining flight |
| Consequence | Nonzero residual miss or contact velocity, sometimes with a qualitatively different (even sign-flipped) outcome than the unsaturated law predicts |

This module built the small set of laws nearly everything else in guidance is assembled from: the guidance/navigation/control split and its loop rates, open-loop and closed-loop and explicit guidance, proportional navigation in its true, pure and augmented forms, the linear-quadratic formulation that contains it, zero-effort-miss and zero-effort-velocity guidance for a soft landing, the adjoint method for pricing a disturbance, time-to-go and why it is the quantity every one of these laws is most fragile to, and the gravity turn that gets a vehicle into the regime where all of it applies. The ascent guidance module picks up directly from here, building Powered Explicit Guidance and the rest of a working ascent guidance system on top of the foundation this module derived.
