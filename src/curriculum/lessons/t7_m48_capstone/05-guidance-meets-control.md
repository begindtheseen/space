---
id: l05-guidance-meets-control
title: 'Guidance in the loop: convex descent guidance meets control'
minutes: 24
covers:
  - 'Convex powered-descent guidance in the loop: re-solve cadence, warm starting, deadline policy and the closed-form fallback'
---

The convex-guidance module proved, in full, that the minimum-fuel powered-descent problem — a non-convex thrust-magnitude bound, mass depletion, a free flight time — has an exact convex reformulation, solvable with a certified iteration bound before the flight computer ever sees real data. Nothing about that proof changes here. What changes is the question: that module asked whether a single solve is trustworthy, and this lesson asks what happens once that solve is one piece of a *running* system — re-solved every cycle from a moving state, sometimes late, always handed to a controller that has its own, independent physical limits. Guidance's translational optimization has no idea those limits exist. This lesson shows, with real numbers, what that blind spot costs.

## The solve, re-solved

At the reference vehicle's $1.667\,\mathrm{Hz}$ re-solve rate this module's rate-architecture lesson fixed, guidance recomputes a commanded thrust acceleration from the current navigation estimate every $0.6\,\mathrm s$, using the same relaxed thrust-magnitude constraint — $\lVert\mathbf a\rVert\le a_{\max}$ alone, the exact, lossless relaxation the convex-guidance module proved — that a certified flight solver would enforce.

::: example Re-solve cost and warm starting, measured
A small quadratic re-solve — minimize control effort over a ten-node discretized horizon subject to the relaxed thrust bound and linear point-mass dynamics, this module's own teaching solver rather than a flight-grade SOCP implementation, exactly the distinction the convex-guidance module drew for its own worked examples — costs, measured directly rather than assumed, an average of $34\,\mathrm{ms}$ solved cold and $25\,\mathrm{ms}$ warm-started from the previous cycle's answer, against a $600\,\mathrm{ms}$ cycle budget. Both numbers fit comfortably inside the budget for this small a horizon; the saving from warm-starting is real but modest here, because — as the convex-guidance module's own treatment of SCvx warned — the *solver's* own warm start and the *algorithm's* reuse of the previous cycle as a reference are two different things, and a general-purpose solver of the kind used here does not benefit from a warm start the way a purpose-built interior-point or first-order method tuned for it would.
:::

## The deadline policy and its closed-form fallback

A solve that has not returned by the time its cycle ends cannot be waited for — a hard real-time system does not get to run late — so the loop needs a decision rule fixed in advance, not improvised at the moment it happens. The rule this module uses has three branches: fly the fresh solution if the solver returned in time; keep flying the *previous* cycle's solution if it is still young enough to trust; otherwise, fall back to a closed-form law that costs microseconds and cannot miss its own deadline.

::: key The closed-form fallback: zero-effort-miss / zero-effort-velocity guidance
$$
\mathrm{ZEM} = \mathbf r_f - \left(\mathbf r + \mathbf v\,t_{go} + \tfrac12\mathbf g\,t_{go}^2\right), \qquad
\mathrm{ZEV} = \mathbf v_f - \left(\mathbf v + \mathbf g\,t_{go}\right),
$$
$$
\mathbf a_{\mathrm{cmd}} = \frac{6}{t_{go}^2}\,\mathrm{ZEM} - \frac{2}{t_{go}}\,\mathrm{ZEV},
$$
the minimum-energy solution for a free thrust magnitude, with $t_{go}$ clamped away from zero to guard the $1/t_{go}^2$ singularity. It is not the constrained, minimum-fuel optimum the convex solve targets, but it is exact for its own (unconstrained-thrust) problem, computed in closed form, and it is what the vehicle flies whenever the certified solve cannot be trusted this cycle.
:::

::: example What each branch actually costs, at the tightest point in the burn
Close to touchdown — $t_{go}\approx3.5\,\mathrm s$, altitude $60\,\mathrm m$, descent rate $18\,\mathrm{m/s}$ — compare flying the fresh convex solution, a *stale* solution held one cycle past when it should have been retired, and the ZEM/ZEV fallback, each for one $0.6\,\mathrm s$ cycle:

| Branch | Commanded $\lVert\mathbf a\rVert$ | Propellant used this cycle |
| --- | --- | --- |
| Fresh (convex) | $13.44\,\mathrm{m/s^2}$ | $77.7\,\mathrm{kg}$ |
| Held (stale) | $12.10\,\mathrm{m/s^2}$ | $70.0\,\mathrm{kg}$ |
| Fallback (ZEM/ZEV) | $2.43\,\mathrm{m/s^2}$ | $14.1\,\mathrm{kg}$ |

The fallback's minimum-energy law commands a far gentler acceleration here than the fuel-constrained convex solve, because the two are solving related but not identical problems over the same time-to-go — the fallback is not a free substitute for the certified solve, it is a different, always-available law with its own cost, and this is exactly the number this module's own guidance-fallback exercise asks a builder to measure rather than assume. Holding a one-cycle-stale solution costs noticeably less propellant than a fresh solve here, which is a fact about this specific instant, not a general license to prefer staleness — the deadline policy's *held* branch exists for the cycles where the alternative is worse, not because held is cheap.
:::

## The join: guidance assumes a rate the vehicle does not have

Every one of guidance's re-solves outputs a thrust *direction* — implicitly, an attitude the vehicle is supposed to be pointed along by the time that direction matters. The translational optimization that produces it contains no model of how fast the vehicle can actually rotate; it is a point-mass problem, and a point mass reorients instantly by definition. The vehicle behind it does not.

::: example How large the gap actually is
At landing-burn ignition, the vehicle holds a vertical attitude from the preceding coast; the first guidance solve, given the reference trajectory's ignition state, commands a thrust direction $15.12^\circ$ from vertical — the same reorientation this module's first lesson traced through all four modules. Guidance's own cadence implies this should be achieved within the $0.6\,\mathrm s$ before the next re-solve, an implied average rate of

$$
\frac{15.12^\circ}{0.6\,\mathrm s} = 25.2^\circ/\mathrm s.
$$

The vehicle's actual torque authority at this instant, from the control lesson later in this module's own gain-scheduling numbers, gives a maximum angular acceleration of about $13.6^\circ/\mathrm{s^2}$ at full gimbal deflection — enough for an *idealized*, perfectly-timed accelerate-then-decelerate maneuver to cover $15.12^\circ$ in about $1.49\,\mathrm s$, an average rate of only $10.1^\circ/\mathrm s$, already less than half of what guidance's cadence assumed. The vehicle's real, rate-and-position-limited actuator, running a realistic controller rather than an idealized bang-bang law, does worse still: even with the anti-windup scheme the control lesson finds best-behaved, the attitude does not settle to within $2\%$ of the commanded angle until $3.82\,\mathrm s$ have passed — more than six guidance cycles, not the one guidance's cadence implicitly asked for.
:::

By the time the vehicle has actually finished turning toward what the *first* solve commanded, guidance has re-solved six more times, each one computed from wherever the vehicle actually was — which was never where the previous solve's translational model assumed it would already be pointed. The trajectory guidance optimized was, in this precise sense, never flyable to begin with: it optimized over a state space that included "instantaneously correct attitude" as a free variable, and the vehicle does not have that variable to give it.

::: key The join, stated precisely
Guidance's translational optimization contains no model of achievable attitude rate. A commanded reorientation that looks feasible to a point-mass solver can take several guidance cycles to actually achieve, during which every subsequent re-solve is computed from a state that has not yet caught up to what the previous solve assumed — and nothing inside the guidance solve itself can detect this, because the mismatch lives entirely in a module guidance never models.
:::

::: warning A larger convex solve does not fix this
It is tempting to reach for a richer optimization — six-degree-of-freedom guidance with attitude dynamics folded directly into the convex or successively-convexified problem, exactly the territory the convex-guidance module's second half covers — as though the fix belongs entirely inside guidance. It can help, and where the reorientation is large enough to matter for the whole trajectory shape it is the right tool. But it does not remove the need for control to be honestly modeled and honestly rate-limited somewhere in the loop; a richer optimizer that is handed the wrong actuator limits is exactly as capable of commanding an infeasible reorientation as the point-mass law this lesson used, only with a more expensive way of doing it.
:::

::: warning The deadline policy's branches are not interchangeable emergency exits
Flying the held branch or the fallback branch is not a failure state to be avoided at all costs — this lesson's own cost table showed the fallback using far *less* propellant at one specific instant, not more. Treating every deadline miss as a crisis, rather than a characterized, budgeted branch with a measured cost, is exactly the "assurance that it will not happen" this module's own guidance exercise warns against; the discipline is to measure what each branch costs across the whole dispersed campaign and record it, not to assume the fresh branch is always best because it is the one the solver was asked for.
:::

## Check yourself

::: check
Explain why the ZEM/ZEV closed-form law is not simply a cheaper approximation to the same problem the convex solve solves.
:::

::: answer
ZEM/ZEV is the exact, closed-form minimum-energy solution to a *different* problem than the convex solve targets — one with an unconstrained thrust magnitude, rather than the convex solve's fuel-optimal problem subject to the vehicle's actual thrust bound. Both aim at the same boundary condition over the same time-to-go, but "exact for an easier problem" is not the same claim as "an approximation to the harder one," which is exactly why the two branches' commanded accelerations in this lesson's worked example differ by a factor of more than five rather than being close cousins.
:::

::: check
A guidance solve at ignition commands a $15.12^\circ$ reorientation, and this lesson computed an implied rate of $25.2^\circ/\mathrm s$ from the $0.6\,\mathrm s$ re-solve cadence alone. Why is comparing that implied rate against the vehicle's idealized bang-bang minimum, rather than stopping at the implied-rate number itself, the more informative check?
:::

::: answer
The implied rate is only a bookkeeping artifact of dividing an angle by a cycle time; it says nothing yet about whether the vehicle's actual torque authority could deliver it under any control law at all. Comparing against the idealized bang-bang minimum — the fastest any control law, however aggressive, could possibly reorient the vehicle given its true angular-acceleration limit — answers the physical question directly: here, even that best-case idealization needs $1.49\,\mathrm s$, already more than twice the cycle time guidance's cadence implicitly assumed, which is the number that actually demonstrates infeasibility rather than merely restating the cadence.
:::

::: check
The worked example found the realistic, anti-windup-controlled settling time ($3.82\,\mathrm s$) more than twice as long as the idealized bang-bang minimum ($1.49\,\mathrm s$). Name one physical reason a real controller cannot reach the idealized bound.
:::

::: answer
The idealized bang-bang bound assumes the actuator can apply maximum torque in one direction, then instantaneously switch to maximum torque in the other direction at exactly the right moment to arrive at the target with zero rate — a perfect, precomputed switching time. A real feedback controller does not know that switching time in advance; it reacts to the error it currently measures, its gimbal has its own rate limit on top of the torque limit, and a notch filter and an anti-windup scheme both add their own dynamics to the loop, all of which cost time the idealized, open-loop-optimal maneuver does not have to spend.
:::

::: check
A program considers "solving the deadline-miss problem entirely inside guidance" by upgrading to a 6-DoF convex formulation that includes attitude dynamics directly. This lesson's second warning says that upgrade does not, by itself, fix the join. Explain why not.
:::

::: answer
A 6-DoF optimization only produces a feasible commanded trajectory if the actuator limits it is given to respect are the *correct* ones — the real gimbal deflection and rate limits, the real torque-to-inertia ratio at the vehicle's current mass. If those limits are wrong, stale, or omitted, a larger, more expensive optimizer is exactly as capable of commanding something the real actuator cannot deliver as the point-mass law this lesson used; the size and sophistication of the optimization is a separate question from whether the model it optimizes against is honest about the vehicle's physical limits.
:::

::: check
Using the cost table in this lesson's second worked example, explain why "always prefer the fresh solution when it is available" is not, by itself, a complete deadline policy — even setting aside the case where the solver actually misses its deadline.
:::

::: answer
The cost table shows the fresh solution costing more propellant than the held (stale) solution at this specific instant, purely from Doppler-like changes in the state between cycles — so "prefer fresh whenever available" is a statement about which branch to fly *when the solver returns in time*, not evidence that the fresh branch is always the cheapest or best one. A complete policy still needs the staleness-age check this module's own exercise specifies, because even a solver that never misses a deadline is re-solving from a state that has moved since the previous cycle, and the fresh solution's own value depends on how much that state has actually changed, not merely on whether a fresh number was produced.
:::

## Summary

| Item | Statement |
| --- | --- |
| Re-solve rate | $1.667\,\mathrm{Hz}$ ($0.6\,\mathrm s$ cycle), inside the module's $1$–$2\,\mathrm{Hz}$ range |
| Solve cost, measured | $\approx34\,\mathrm{ms}$ cold, $\approx25\,\mathrm{ms}$ warm-started, against a $600\,\mathrm{ms}$ budget |
| Deadline policy | fresh $\to$ held (if young enough) $\to$ closed-form fallback; each branch's cost measured, not assumed |
| Closed-form fallback | $\mathbf a_{\mathrm{cmd}}=(6/t_{go}^2)\,\mathrm{ZEM}-(2/t_{go})\,\mathrm{ZEV}$, minimum-energy, exact, microseconds to evaluate |
| The join | Guidance's point-mass model assumes instantaneous reorientation; it has no attitude-rate model at all |
| Measured gap | Implied rate $25.2^\circ/\mathrm s$; idealized physical maximum $10.1^\circ/\mathrm s$ ($1.49\,\mathrm s$); realistic controlled settling $3.82\,\mathrm s$ — over six guidance cycles |
| What fixes it | Not a bigger optimizer alone — an honest, shared model of the vehicle's actual rate limits, which the next lesson's control loop provides |

Guidance's blind spot toward attitude rate is only half of this join; the other half is what the controller actually does when it is handed a command like this one to track. The next lesson follows that command the rest of the way, into the actuator that has to saturate against it and the integrator that has to survive the saturation.
