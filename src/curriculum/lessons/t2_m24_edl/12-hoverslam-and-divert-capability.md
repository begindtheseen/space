---
id: l12-hoverslam-and-divert-capability
title: The hoverslam problem, divert capability, and propellant margin
minutes: 17
covers:
  - landing burn timing and the hoverslam problem
  - divert capability and the landing ellipse
---

A guidance law can always be written down. Give it a starting position and velocity, a target position and velocity, and a time to get there, and a closed-form control law exists that connects them smoothly — this lesson derives exactly such a law in the next section, and it will not be hard. The question a real landing burn actually has to answer is different: can the vehicle *produce* the acceleration that law calls for, at every instant along the way, given an engine that has a maximum thrust, a minimum thrust it cannot go below, and a nozzle that cannot point through the ground? This lesson works both sides of that question for a stated vehicle: the guidance law that reaches the ground at zero velocity when nothing is in its way, and the shrinking, then vanishing, set of trajectories that remain flyable once real thrust bounds are imposed.

## The vehicle

Every number in this lesson uses one stated landing stage: mass $m = 25{,}000\ \mathrm{kg}$ (held approximately constant over the short burn — propellant used is a modest fraction of this, and the module notes explicitly where a fuller mass-varying treatment would tighten the numbers), engine thrust adjustable between $T_{\min} = 360\ \mathrm{kN}$ and $T_{\max} = 900\ \mathrm{kN}$ (a $40$-to-$100$ percent throttle range), giving

$$
a_{T,\max} = \frac{T_{\max}}{m} = 36.0\ \mathrm{m/s^2} = 3.671\,g_0, \qquad
a_{T,\min} = \frac{T_{\min}}{m} = 14.4\ \mathrm{m/s^2} = 1.468\,g_0.
$$

Because $a_{T,\min} > g_0$, this vehicle **cannot hover**: even at minimum throttle, thrust exceeds weight, and the vehicle accelerates upward the instant the engine lights. There is no "descend slowly and reassess" option — once the landing burn begins, the vehicle is committed to an outcome decided entirely by when it began and how it is throttled from there. This is the **hoverslam** (or suicide-burn) constraint this lesson's first half is built around.

## The ZEM/ZEV guidance law, derived

Consider one axis — position $r$, velocity $v$ — governed by $\ddot r = a(t)$, where $a(t)$ is whatever net acceleration the guidance chooses to command (thrust acceleration combined with gravity is folded in below; for now, treat $a$ as the total). Starting from $r_0, v_0$ now, the goal is to reach $r_f, v_f$ exactly at a specified time-to-go $t_{go}$. Among the infinitely many acceleration histories that satisfy these four boundary conditions (two now, two at $t_{go}$), the one that minimises total control effort, $\int_0^{t_{go}} a(t)^2\,dt$, turns out to be **linear in time**: $a(t) = A + Bt$. Impose the boundary conditions on the resulting $v(t) = v_0 + At + \tfrac12 Bt^2$ and $r(t) = r_0 + v_0t + \tfrac12At^2 + \tfrac16Bt^3$ at $t = t_{go}$, and solve the resulting two linear equations for $A$ and $B$. Define

$$
\mathrm{ZEM} \equiv r_f - (r_0 + v_0\,t_{go}), \qquad \mathrm{ZEV} \equiv v_f - v_0,
$$

the **zero-effort miss** (where the vehicle would end up if it coasted at $v_0$ for the remaining time, applying no further correction) and **zero-effort velocity error** (how far current velocity is from the target). Solving gives

$$
A = \frac{6\,\mathrm{ZEM}}{t_{go}^2} - \frac{2\,\mathrm{ZEV}}{t_{go}}, \qquad
B = \frac{6\,\mathrm{ZEV}}{t_{go}^2} - \frac{12\,\mathrm{ZEM}}{t_{go}^3}.
$$

$A$ is the acceleration commanded *right now*; a real implementation recomputes $\mathrm{ZEM}$, $\mathrm{ZEV}$, and $t_{go}$ every guidance cycle from the current state, so the vehicle always flies the instantaneous command $A$ rather than a fixed pre-planned profile — a closed-loop law, not an open-loop one, exactly like Apollo's and the Shuttle's guidance in lesson 8.

::: key ZEM/ZEV terminal guidance
$$
a_{\mathrm{cmd}} = \frac{6\,\mathrm{ZEM}}{t_{go}^2} - \frac{2\,\mathrm{ZEV}}{t_{go}}, \qquad
\mathrm{ZEM} = r_f - (r + v\,t_{go}), \quad \mathrm{ZEV} = v_f - v.
$$
The minimum-effort acceleration profile connecting current position and velocity to a target position and velocity at a specified time-to-go. Recomputed every cycle from the current state — closed loop, not a fixed plan. The required *thrust* acceleration is this command minus gravity (vertically) or the command directly (horizontally, where gravity has no component).
:::

::: example The law reaches the ground exactly, when nothing constrains it
Take $y_0 = 2000\ \mathrm{m}$, $v_{y0} = -225\ \mathrm{m/s}$, target $y_f = 0$, $v_{yf} = 0$, burn duration $t_{go}$ starting at $T = 18\ \mathrm{s}$. Propagating $a(t) = A + Bt$ forward gives $y(T) = 0$ and $v_y(T) = 0$ to floating-point precision — the boundary conditions are satisfied exactly, by construction, because $A$ and $B$ were solved to guarantee it. The required *thrust* acceleration, $a_{\mathrm{thrust}}(t) = a(t) + g_0$, ranges from $21.84$ to $22.77\ \mathrm{m/s^2}$ over the burn — comfortably inside $[a_{T,\min}, a_{T,\max}] = [14.4, 36.0]\ \mathrm{m/s^2}$. Mathematically, the guidance law has no trouble at all; the entire question this lesson asks is whether that stays true across the range of burns a real vehicle actually has to fly.
:::

## What the throttle floor and ceiling do to the feasible set

Because $a(t) = A + Bt$ is linear, its extreme values over $[0, T]$ occur only at the two endpoints — so checking feasibility of an entire burn reduces to checking $a_{\mathrm{thrust}}(0)$ and $a_{\mathrm{thrust}}(T)$ against $[a_{T,\min}, a_{T,\max}]$. Scan burn duration $T$ at the baseline state ($y_0 = 2000\ \mathrm{m}$, $v_{y0} = -225\ \mathrm{m/s}$): too short a $T$ demands more than $a_{T,\max}$ at ignition (not enough time to kill this much velocity at moderate thrust); too long a $T$ eventually demands *less* than $a_{T,\min}$ near touchdown (the smooth law wants to ease off toward a gentle finish, exactly what a throttle floor above $g_0$ forbids). Between those failures sits a **feasible window** of burn durations for which the entire linear profile — both endpoints, and therefore everything between them — stays within bounds:

$$
T \in [14.47,\ 21.81]\ \mathrm{s}, \qquad \text{width } 7.34\ \mathrm{s}.
$$

Now repeat this at the same starting altitude but a range of descent speeds, and watch the window respond:

| $v_{y0}$ (m/s) | feasible $T$ window (s) | window width (s) |
| --- | --- | --- |
| $-150$ | $[24.66,\ 27.98]$ | $3.32$ |
| $-200$ | $[16.58,\ 23.60]$ | $7.02$ |
| $-225$ | $[14.47,\ 21.81]$ | $7.34$ |
| $-250$ | $[13.89,\ 20.22]$ | $6.33$ |
| $-300$ | $[12.83,\ 14.74]$ | $1.90$ |
| $-324$ | — | $0$ (closing) |

The window widens, peaks near $-225\ \mathrm{m/s}$, then narrows sharply and closes entirely by about $v_{y0} \approx -324\ \mathrm{m/s}$ — found by bisecting on window existence, holding $y_0 = 2000\ \mathrm{m}$ fixed. Past that descent speed, **no burn duration exists for which the smooth, minimum-effort guidance law respects both the throttle ceiling and the throttle floor at once.** This is not a small numerical inconvenience; it is a hard boundary. A vehicle arriving at the landing-burn ignition point faster than this threshold cannot fly the ZEM/ZEV law as derived above at all — it must either arrive slower (meaning the aerodynamic phase upstream, lesson 10, has to deliver it below this speed) or fly a different strategy entirely, such as burning at fixed maximum throttle for part of the descent before switching to a terminal-guidance law only once the remaining problem is feasible.

::: key A minimum-throttle constraint does not just shrink margin, it can eliminate the solution
Because the throttle floor exceeds $g_0$, the guidance problem is not "fly the smooth law, accepting a rougher ride near the limits" — outside the feasible window, the smooth law's required thrust literally leaves $[a_{T,\min}, a_{T,\max}]$, and there is no way to fly it at all. This is precisely why the hoverslam problem is a single-shot problem: the feasible set of burns is a bounded, sometimes narrow, sometimes empty window, not a continuum with graceful degradation at its edges.
:::

::: warning The pointing constraint has not yet been the binding one — check it anyway
This lesson's vertical-only examples never call for a thrust vector below the horizontal, because $a_{\mathrm{thrust}}$ never needs to point anywhere but up here. The combined vertical-plus-horizontal case in the next section checks this explicitly, because it is not automatically satisfied once a horizontal divert component is added on top of the vertical requirement.
:::

## Divert capability and propellant margin

A landing burn rarely aims at a target directly below the ignition point — navigation error, a retargeted hazard, or simple trajectory dispersion typically leaves some lateral offset to correct during the same burn. Apply the identical ZEM/ZEV law to the horizontal axis, with target $x_f = 0$, $v_{xf} = 0$, over the *same* burn duration $T = 18\ \mathrm{s}$ used above, and ask how large a starting offset $x_0$ the vehicle can correct.

The horizontal command has no gravity term, so $a_{\mathrm{thrust},x}(t) = a_x(t)$ directly. Combined with the mandatory vertical command, the *total* thrust-acceleration vector must satisfy $a_{T,\min} \le \sqrt{a_{\mathrm{thrust},x}^2 + a_{\mathrm{thrust},y}^2} \le a_{T,\max}$ and — the pointing constraint — $a_{\mathrm{thrust},y} \ge 0$ throughout, since the engine cannot direct thrust below the local horizontal. Checking the combined magnitude up to $x_0 = 10{,}000\ \mathrm{m}$ shows the magnitude ceiling $a_{T,\max}$ is first exceeded at

$$
x_{0,\text{thrust-limited}} \approx 1506\ \mathrm{m},
$$

with the pointing constraint never binding in this range (the required thrust vector never tips past $16^\circ$ or so from vertical here, well short of horizontal). But the vehicle does not have unlimited propellant, and that is very often the tighter limit.

::: example Propellant budget for the combined burn
Take a representative kerosene/LOX landing engine, $I_{sp} = 283\ \mathrm{s}$, giving effective exhaust velocity $v_e = I_{sp}\,g_0 = 2775.3\ \mathrm{m/s}$. With $5500\ \mathrm{kg}$ of usable propellant available for the terminal phase (wet mass at ignition $m_0 = 30{,}500\ \mathrm{kg}$, dry-plus-reserve mass $m_f = 25{,}000\ \mathrm{kg}$), the total $\Delta v$ budget is

$$
\Delta v_{\mathrm{budget}} = v_e\ln\frac{m_0}{m_f} = 2775.3\,\ln\frac{30{,}500}{25{,}000} = 551.9\ \mathrm{m/s}.
$$

The mandatory vertical burn from the worked example above costs $\Delta v_{\mathrm{vertical}} = \int_0^T a_{\mathrm{thrust},y}\,dt = 401.5\ \mathrm{m/s}$ — most of it fighting gravity for the full $18\ \mathrm{s}$ duration, not just killing the initial $225\ \mathrm{m/s}$ of descent rate. That leaves

$$
\Delta v_{\mathrm{remaining}} = 551.9 - 401.5 = 150.3\ \mathrm{m/s}
$$

for horizontal divert. Solving for the largest $x_0$ whose horizontal ZEM/ZEV profile costs exactly this much $\Delta v$ gives

$$
x_{0,\text{propellant-limited}} \approx 902\ \mathrm{m}.
$$

At that divert distance, the *combined* thrust-magnitude requirement peaks at $28.2\ \mathrm{m/s^2}$ — still comfortably inside $a_{T,\max} = 36.0\ \mathrm{m/s^2}$, and the thrust vector never points below the horizontal. **Propellant, not instantaneous thrust authority, is what actually limits this vehicle's divert footprint**: the thrust-bound-only estimate above allowed diverting out to about $1506\ \mathrm{m}$, but the vehicle runs out of usable $\Delta v$ at $902\ \mathrm{m}$, well short of that.
:::

::: key Divert capability is usually a propellant question, not a thrust question
A vehicle with ample throttle margin can still have a tightly limited landing footprint, because the terminal guidance law's horizontal correction draws on the same finite $\Delta v$ budget the vertical (mandatory) part of the burn is already spending most of. Sizing a landing ellipse means checking both constraints — does the *instantaneous* thrust vector stay in bounds, and does the *cumulative* propellant spend stay in budget — separately, because either one can be the actual limiter depending on the vehicle.
:::

## Check yourself

::: check
Explain, in one sentence, why this lesson's vehicle cannot hover, and state the consequence for how its landing burn must be flown.
:::

::: answer
Its minimum-throttle thrust acceleration, $14.4\ \mathrm{m/s^2}$, exceeds standard gravity, $9.807\ \mathrm{m/s^2}$, so even at the lowest thrust setting the vehicle necessarily accelerates upward once the engine ignites — it cannot hold a constant altitude. The consequence is that the burn must be timed so that velocity and altitude reach zero together at one specific ignition point; igniting earlier or later leaves either residual downward velocity at the ground or the vehicle stopping and climbing above the pad, with no option to pause mid-burn and reassess.
:::

::: check
Derive, from the boundary conditions $v(t_{go}) = v_f$ and $r(t_{go}) = r_f$ on $a(t) = A + Bt$, why the commanded acceleration $A$ depends on zero-effort miss as $1/t_{go}^2$ but on zero-effort velocity error as only $1/t_{go}$.
:::

::: answer
Solving the two linear boundary-condition equations for $A$ and $B$ gives $A = 6\,\mathrm{ZEM}/t_{go}^2 - 2\,\mathrm{ZEV}/t_{go}$. The $\mathrm{ZEM}$ term enters through $r(t_{go})$, which depends on $A$ through a $t_{go}^2$ term (position from constant acceleration goes as time squared), so recovering a given position error in a given time-to-go requires an acceleration that scales as $1/t_{go}^2$. The $\mathrm{ZEV}$ term enters through $v(t_{go})$, which depends on $A$ only linearly in time, so it need only scale as $1/t_{go}$ to close a given velocity gap in that time.
:::

::: check
At $v_{y0} = -225\ \mathrm{m/s}$, the feasible burn-duration window is $7.34\ \mathrm{s}$ wide; at $v_{y0} = -300\ \mathrm{m/s}$ it has shrunk to $1.90\ \mathrm{s}$, and by about $-324\ \mathrm{m/s}$ it has closed entirely. What does "the window has closed" mean physically, and what must change for the vehicle to still land safely at that descent speed?
:::

::: answer
It means there is no burn duration $T$ for which the smooth, minimum-effort ZEM/ZEV acceleration profile stays within $[a_{T,\min}, a_{T,\max}]$ at both the start and end of the burn — every choice of $T$ demands either more thrust than the engine can produce early on or less thrust than the throttle floor allows late on. For the vehicle to land safely at this descent speed, either the upstream aerodynamic phase must deliver it to ignition altitude at a slower speed (widening the window back open), or the terminal guidance must abandon the smooth minimum-effort law in favour of a different strategy — such as an initial maximum-throttle segment — that the linear-in-time profile derived in this lesson cannot represent.
:::

::: check
In the combined vertical-plus-horizontal divert example, the thrust-magnitude bound alone would have permitted diverting out to about $1506\ \mathrm{m}$, but the vehicle's actual divert capability is limited to about $902\ \mathrm{m}$. Explain the discrepancy and say which number a mission should use to size its landing ellipse.
:::

::: answer
The $1506\ \mathrm{m}$ figure only checks that the instantaneous thrust vector's *magnitude and direction* stay inside the engine's throttle and gimbal limits at every point along the trajectory; it says nothing about how much total propellant that trajectory consumes. The $902\ \mathrm{m}$ figure comes from a separate, independent check — integrating thrust acceleration over the whole burn and comparing that cumulative $\Delta v$ against the $150.3\ \mathrm{m/s}$ actually left in the propellant budget after the mandatory vertical burn — and it is the smaller, binding number here. A mission must size its landing ellipse to whichever of the two checks is more restrictive for its specific vehicle, which in this case is the propellant constraint, not the thrust-magnitude one; reporting $1506\ \mathrm{m}$ as the divert capability would overstate what the vehicle can actually reach by two-thirds.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $a_{T,\min} = T_{\min}/m = 14.4\ \mathrm{m/s^2} = 1.468\,g_0$ | Minimum throttle acceleration; exceeds $g_0$, so this vehicle cannot hover |
| $a_{T,\max} = T_{\max}/m = 36.0\ \mathrm{m/s^2} = 3.671\,g_0$ | Maximum throttle acceleration |
| $a_{\mathrm{cmd}} = 6\,\mathrm{ZEM}/t_{go}^2 - 2\,\mathrm{ZEV}/t_{go}$ | ZEM/ZEV terminal guidance law; minimum-effort, closed-loop, recomputed every cycle |
| Feasible burn-duration window (baseline, $v_{y0}=-225\ \mathrm{m/s}$) | $T \in [14.47,\ 21.81]\ \mathrm{s}$, width $7.34\ \mathrm{s}$ |
| Window vanishes at | $v_{y0} \approx -324\ \mathrm{m/s}$ (fixed $y_0 = 2000\ \mathrm{m}$) — no feasible smooth burn beyond this |
| $\Delta v_{\mathrm{budget}} = v_e\ln(m_0/m_f)$ | $551.9\ \mathrm{m/s}$ for the stated propellant load; $401.5\ \mathrm{m/s}$ spent on the mandatory vertical burn |
| Divert capability | $902\ \mathrm{m}$, propellant-limited (thrust-magnitude bound alone would allow $1506\ \mathrm{m}$) |
| Binding constraint on divert | Cumulative propellant ($\Delta v$ budget), not instantaneous thrust magnitude or pointing, for this vehicle |

The next lesson closes the loop on this three-phase, thrust-constrained descent by looking at two real missions that push every result in this module to its extreme: Mars entry, where the atmosphere is too thin for aerodynamics alone to finish the job, and a reusable booster choosing between flying home and landing downrange.
