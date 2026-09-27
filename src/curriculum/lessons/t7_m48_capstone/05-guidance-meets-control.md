---
id: l05-guidance-meets-control
title: 'Guidance in the loop: convex descent guidance meets control'
minutes: 23
covers:
  - 'Convex powered-descent guidance in the loop: re-solve cadence, warm starting, deadline policy and the closed-form fallback'
---

Think of a map app on a long drive. Every few seconds it recalculates the best route from wherever the car is now. Usually the new route arrives in time. Sometimes the phone is slow, and the app has to decide what to show you meanwhile. The sensible answer: keep following the route it already gave you, as long as that route is recent — and if it has gone stale, fall back on a simple rule, like "head toward the destination". Notice one more thing. The app draws a sharp left turn as if the car could turn instantly. The car cannot.

Powered-descent guidance lives exactly this life. The convex-guidance module proved that the minimum-fuel landing problem — a thrust that cannot drop below a floor, mass falling as propellant burns, a free flight time — can be rewritten as a **[[convex|convex]]** problem, one a solver can finish with a guaranteed bound on its work. Nothing about that proof changes here. What changes is the question. That module asked whether *one* solve can be trusted. This lesson asks what happens when the solve is one part of a *running* system: re-solved on a clock from a moving state, sometimes late, and always handed to a controller with physical limits guidance knows nothing about.

## Re-solving on a clock

Guidance re-solves at $1.667\,\mathrm{Hz}$ — once every $0.6\,\mathrm s$, the rate lesson 3 fixed. Each time, it recomputes a commanded thrust acceleration from the current navigation estimate. The thrust limit is written in its relaxed form, $\lVert\mathbf a\rVert\le a_{\max}$ (read "the size of $\mathbf a$ is at most a-max"). The convex-guidance module proved that relaxation is **lossless**: the relaxed problem's answer still obeys the true, stricter limit.

A solve that starts from nothing is called **cold**. One that starts from the previous cycle's answer is **[[warm-started|warm-start]]**. Between two cycles $0.6\,\mathrm s$ apart the answer barely changes, so starting from last time's answer should save work.

::: example Re-solve cost and warm starting, measured
The test used this module's small teaching solver: minimize control effort over a ten-point time grid, subject to the relaxed thrust bound and simple point-mass dynamics. It is not a flight-grade solver, the same distinction the convex-guidance module drew for its own examples.

- Average cost, cold: $34\,\mathrm{ms}$.
- Average cost, warm-started: $25\,\mathrm{ms}$.
- Budget per cycle: $600\,\mathrm{ms}$.

Both fit easily. The warm start saves $34 - 25 = 9\,\mathrm{ms}$, about a quarter. That saving is real but modest, because two different things are both called "warm start". Reusing the last cycle's *trajectory as the starting guess* for the algorithm is one. Handing the *solver's internal state* forward is another. A general-purpose solver like this one gets little from the first. A purpose-built interior-point or first-order method, tuned for it, gets much more.

Sanity check: $25\,\mathrm{ms}$ is about $4\%$ of the $600\,\mathrm{ms}$ cycle, so for this small problem the deadline is not tight. It gets tighter as the grid grows and the flight computer gets slower.
:::

## The deadline policy

Guidance runs under **[[hard real-time|hard-real-time]]** rules: each cycle has a deadline, and running late is not allowed. So what does the vehicle fly on a cycle when the solver has not returned in time? That rule must be written down *before* flight, not improvised when it happens.

This module uses three branches, tried in order:

1. **Fresh.** The solver returned in time: fly the new solution.
2. **Held.** It did not, but the previous cycle's solution is still young enough to trust: keep flying that.
3. **Fallback.** The previous solution is too old: switch to a closed-form law that costs microseconds and cannot miss its own deadline.

Each branch reports which one fired, so the choice appears in **[[telemetry|telemetry]]**.

The held branch holds the previous **plan**, not the previous thrust command. A convex solution is a whole trajectory: it says how the thrust should change over the coming seconds. Flying it one more cycle means following that planned change. Freezing the last thrust vector would throw that knowledge away — like holding the steering wheel where it was, instead of following the turn the map already showed you.

Why not the other obvious answers?

- **Stop the burn and go to a safe mode.** A landing burn has no passive safe state. Stopping the engine at $60\,\mathrm m$ is not safe; it is a crash.
- **Retry the solve inside the same cycle.** That eats the time the next cycle needs, and risks missing that deadline too. Hard real-time design forbids it.

::: key Guidance deadline policy
Fresh solve, else hold the previous plan while it is young enough, else the closed-form law — and report which branch fired in telemetry. The cost of each branch is measured in the campaign, not assumed.
:::

## The closed-form fallback: ZEM/ZEV

Picture throwing a ball at a target with no more effort from you. Where it would land is where the vehicle would end up if the engine did nothing from now on. The **[[zero-effort miss|zem-picture]]**, ZEM, is how far that no-effort landing spot is from the target. The **zero-effort velocity error**, ZEV, is how far the no-effort final velocity is from the target velocity. The fallback law pushes against both.

Here $\mathbf r$ and $\mathbf v$ are the current position and velocity, $\mathbf r_f$ and $\mathbf v_f$ the target position and velocity, $\mathbf g$ gravity, and $t_{go}$ ("t go") the time left until touchdown.

::: key The closed-form fallback: ZEM/ZEV guidance law
$$
\mathrm{ZEM} = \mathbf r_f - \left(\mathbf r + \mathbf v\,t_{go} + \tfrac12\mathbf g\,t_{go}^2\right), \qquad
\mathrm{ZEV} = \mathbf v_f - \left(\mathbf v + \mathbf g\,t_{go}\right),
$$
$$
\mathbf a = \frac{6}{t_{go}^2}\,\mathrm{ZEM} - \frac{2}{t_{go}}\,\mathrm{ZEV}.
$$
Minimum-energy, closed form, microseconds to evaluate — the natural fallback when the convex solver misses a deadline. Clamp $t_{go}$ away from zero.
:::

The bracket in ZEM is the ordinary "where will I be" formula for motion under gravity alone. The bracket in ZEV is "how fast will I be going" under gravity alone. The command $\mathbf a$ is the thrust acceleration only — gravity is already accounted for inside ZEM and ZEV.

The law is **[[minimum-energy|minimum-energy]]**: of all thrust histories that hit the target position and velocity at exactly $t_{go}$, it is the one with the smallest total of acceleration squared. It puts no limit on thrust size. That makes it *exact* for a different, easier problem than the convex solve's — not an approximation to the same problem.

::: example Working the fallback by hand
Take a purely vertical case. Up is positive. The vehicle is at $r = 300\,\mathrm m$, falling at $v = -40\,\mathrm{m/s}$, with $t_{go} = 10\,\mathrm s$. The target is the pad: $r_f = 0$, $v_f = 0$. Gravity is $g = -9.80665\,\mathrm{m/s^2}$.

**ZEM.** With no thrust, in $10\,\mathrm s$ the vehicle would reach

$$
300 + (-40)(10) + \tfrac12(-9.80665)(100) = 300 - 400 - 490.33 = -590.33\,\mathrm m,
$$

so ZEM $= 0 - (-590.33) = 590.33\,\mathrm m$. It would end up $590\,\mathrm m$ below the pad (underground), so the miss points up.

**ZEV.** With no thrust it would be moving at $-40 + (-9.80665)(10) = -138.07\,\mathrm{m/s}$, so ZEV $= 0 - (-138.07) = 138.07\,\mathrm{m/s}$.

**Command.**

$$
a = \frac{6}{100}(590.33) - \frac{2}{10}(138.07) = 35.42 - 27.61 = 7.81\,\mathrm{m/s^2}.
$$

Sanity check: $7.81\,\mathrm{m/s^2}$ upward is less than gravity's $9.81$, so the vehicle is still speeding up downward, just more gently. Is that sensible, falling at $40\,\mathrm{m/s}$ from only $300\,\mathrm m$? It is, because the law re-evaluates every cycle, and as $t_{go}$ shrinks its command grows. Flying this law continuously to touchdown, the thrust acceleration rises in a straight line from $7.81$ to about $19.8\,\mathrm{m/s^2}$ at the end, and the vehicle arrives at the pad at essentially zero speed. The minimum-energy law brakes gently early and hard late.

**A sign check that matters.** Move the start to $800\,\mathrm m$, at rest, with $t_{go} = 20\,\mathrm s$. Then ZEM $= -(800 - 1961.33) = 1161.33\,\mathrm m$ and ZEV $= 196.13\,\mathrm{m/s}$, giving $a = 0.015(1161.33) - 0.1(196.13) = 17.42 - 19.61 = -2.19\,\mathrm{m/s^2}$. That is thrust pointing *down*. The law wants to fall faster than gravity at first, because $20\,\mathrm s$ is longer than a free fall from $800\,\mathrm m$ would take. A rocket engine cannot push downward in this configuration. Because the law knows no thrust limits, a flight implementation must clip its output to what the engine can deliver — and a $t_{go}$ that is far too long is itself a sign something upstream is wrong.
:::

The $t_{go}$ clamp matters at the other end. Both terms divide by $t_{go}$, and the first by $t_{go}^2$. In the last second of a landing the command would explode just when you can least afford it. From $5\,\mathrm m$ up at $-1\,\mathrm{m/s}$ with $t_{go}=0.1\,\mathrm s$, the raw law asks for about $-2950\,\mathrm{m/s^2}$. Clamping $t_{go}$ at a floor of $0.5\,\mathrm s$ holds it to about $-102\,\mathrm{m/s^2}$ — still clipped by the engine, but finite, and below the floor the command no longer grows as $t_{go}$ shrinks. (Both numbers point down because, with only $0.1\,\mathrm s$ left, the vehicle would have to dive to reach the pad in time: a $t_{go}$ that no longer matches the state.)

::: warning Per-cycle propellant is not the cost of a branch
The minimum-energy law brakes gently early and hard late. So in any one cycle it can burn *less* propellant than the fuel-optimal convex solution — which, near the end, tends to brake at full effort. That does not make it cheaper. It has only postponed the braking. The real cost of a branch is the total propellant and touchdown miss from that cycle to the ground, measured across the dispersed campaign.
:::

::: example What each branch commands at a tight moment
Close to touchdown in the reference simulation — about $3.5\,\mathrm s$ to go, $60\,\mathrm m$ up, descending at $18\,\mathrm{m/s}$ — compare one $0.6\,\mathrm s$ cycle of each branch. The "held" row is a solution kept one cycle *past* when it should have been retired.

| Branch | Commanded $\lVert\mathbf a\rVert$ | Propellant used this cycle |
| --- | --- | --- |
| Fresh (convex) | $13.44\,\mathrm{m/s^2}$ | $77.7\,\mathrm{kg}$ |
| Held (stale) | $12.10\,\mathrm{m/s^2}$ | $70.0\,\mathrm{kg}$ |
| Fallback (ZEM/ZEV) | $2.43\,\mathrm{m/s^2}$ | $14.1\,\mathrm{kg}$ |

Sanity check on the propellant column: propellant per cycle should be proportional to thrust, so each row's propellant divided by its acceleration should be the same number. It is: $77.7/13.44 = 5.78$, $70.0/12.10 = 5.79$, $14.1/2.43 = 5.80$.

Now read the table with the warning above in mind. The fresh convex command is more than five times the fallback's ($13.44 / 2.43 \approx 5.5$), because the two laws solve different problems over the same time-to-go. The fallback is not a free copy of the convex solve; it is a different, always-available law with its own cost. Its small number here is postponed braking, not a saving. The held row burns a little less than fresh at this instant too — a fact about this moment, not a reason to prefer stale plans. The only fair comparison runs each branch to touchdown, which is exactly what this module's guidance-fallback exercise asks you to measure.
:::

## The join: guidance assumes a turn rate the vehicle does not have

Every re-solve outputs a thrust *direction*. Implicitly, that is an attitude the vehicle should be pointing along by the time it matters. But guidance's optimization is a **[[point-mass|point-mass]]** problem: it treats the vehicle as a dot with a push attached, and a dot can point anywhere instantly. The vehicle behind it cannot.

::: example How large the gap really is
At landing-burn ignition the vehicle is pointing straight up, as it was during the coast. The first solve commands a thrust direction $15.12^\circ$ from vertical — the same turn lesson 1 traced through all four modules. Guidance's clock implies this should happen before the next re-solve, $0.6\,\mathrm s$ later. That is an average turn rate of

$$
\frac{15.12^\circ}{0.6\,\mathrm s} = 25.2^\circ/\mathrm s.
$$

What can the vehicle actually do? At full gimbal deflection, lesson 6's numbers give a largest angular acceleration of about $\alpha = 13.6^\circ/\mathrm{s^2}$ (read "alpha"). The fastest possible turn from rest to rest is **[[bang-bang|bang-bang]]**: full push one way for the first half, full push the other way for the second half, arriving with zero turn rate. In each half the vehicle turns $\tfrac12\alpha(T/2)^2$, so the whole turn is $\theta = \alpha T^2/4$, and the time is

$$
T = 2\sqrt{\frac{\theta}{\alpha}} = 2\sqrt{\frac{15.12}{13.6}} = 2 \times 1.054 = 2.11\,\mathrm s.
$$

That is an average of $15.12 / 2.11 = 7.17^\circ/\mathrm s$ — less than a third of what guidance's clock assumed. Even this perfect, idealized maneuver spans about three and a half guidance cycles.

The real vehicle does worse. Its gimbal is limited in rate as well as angle, and it runs a feedback controller, not a perfectly timed open-loop maneuver. Even with the **[[anti-windup|anti-windup-bridge]]** scheme lesson 6 finds best, the attitude does not settle within $2\%$ of the command until $3.82\,\mathrm s$ — more than six guidance cycles ($3.82 / 0.6 \approx 6.4$), not the one guidance's clock asked for.
:::

By the time the vehicle has finished turning toward what the *first* solve asked, guidance has re-solved six more times. Each re-solve started from wherever the vehicle really was — never where the previous solve assumed it would already be pointing. The trajectory guidance optimized was, in this exact sense, never flyable. It treated "instantly correct attitude" as free, and the vehicle does not have that to give.

::: key The join between guidance and control
Guidance's translational optimization contains no model of achievable attitude rate. A reorientation that looks feasible to a point-mass solver can take several guidance cycles to achieve. During that time every re-solve starts from a state that has not caught up with what the previous solve assumed — and nothing inside guidance can detect it, because the mismatch lives in a module guidance never models.
:::

::: warning A bigger convex solve does not fix this by itself
It is tempting to fold attitude dynamics directly into the optimization — **[[six-degree-of-freedom guidance|six-dof-guidance]]**, the territory the convex-guidance module's second half covers. It can help, and where the turn is large enough to shape the whole trajectory, it is the right tool. But an optimizer given the wrong actuator limits can command an impossible turn just as easily as the point-mass law, only at greater expense. Control must be honestly modeled and honestly rate-limited somewhere in the loop.
:::

::: warning The deadline branches are not emergency exits
Flying the held branch or the fallback is not a failure to avoid at all costs. Treating every missed deadline as a crisis, instead of a branch with a measured cost, is the "assurance that it will not happen" this module's guidance exercise warns against. Measure what each branch costs across the whole dispersed campaign, and write it down.
:::

## Check yourself

::: check
Explain why the ZEM/ZEV law is not a cheaper approximation to the problem the convex solve solves.
:::

::: answer
ZEM/ZEV is the exact, closed-form minimum-energy solution to a *different* problem: one where thrust can be any size (even pointing down). The convex solve minimizes fuel subject to the engine's real thrust limits. Both aim for the same target over the same time-to-go, but "exact for an easier problem" is a different claim from "approximate for the harder one". That is why, at the tight moment in this lesson's table, their commands differ by more than a factor of five instead of being close.
:::

::: check
A vehicle is $100\,\mathrm m$ above the pad, descending at $20\,\mathrm{m/s}$, with $t_{go} = 8\,\mathrm s$ and target $r_f = 0$, $v_f = 0$. Using $g = -9.80665\,\mathrm{m/s^2}$ and up as positive, compute the ZEM/ZEV thrust acceleration.
:::

::: answer
No-thrust position after $8\,\mathrm s$: $100 + (-20)(8) + \tfrac12(-9.80665)(64) = 100 - 160 - 313.81 = -373.81\,\mathrm m$, so ZEM $= 373.81\,\mathrm m$.

No-thrust velocity: $-20 + (-9.80665)(8) = -98.45\,\mathrm{m/s}$, so ZEV $= 98.45\,\mathrm{m/s}$.

Command: $a = \frac{6}{64}(373.81) - \frac{2}{8}(98.45) = 35.04 - 24.61 = 10.43\,\mathrm{m/s^2}$, upward. That is slightly more than gravity, so the vehicle has just started to slow its descent — reasonable with $8\,\mathrm s$ left, since the law brakes harder as $t_{go}$ shrinks.
:::

::: check
The implied turn rate from guidance's clock was $25.2^\circ/\mathrm s$. Why is it more informative to compare against the bang-bang minimum time than to stop at that number?
:::

::: answer
The implied rate is only an angle divided by a cycle time. It says nothing about whether the vehicle's torque could deliver it under any control law. The bang-bang time is the fastest *any* controller could possibly turn the vehicle, given its true angular-acceleration limit. Here even that best case needs $2.11\,\mathrm s$ — about three and a half guidance cycles — which proves the command is infeasible, instead of restating the cycle time.
:::

::: check
The realistic settling time ($3.82\,\mathrm s$) is much longer than the bang-bang minimum ($2.11\,\mathrm s$). Name one physical reason a real controller cannot reach the ideal.
:::

::: answer
The bang-bang ideal applies full torque one way, then switches instantly to full torque the other way at exactly the right moment — a switching time computed in advance. A feedback controller does not know that moment; it reacts to the error it measures now. Its gimbal also has a rate limit on top of its angle limit, so it cannot swap from full one way to full the other instantly. And the notch filter and anti-windup scheme add their own dynamics. All of that costs time the ideal maneuver never spends.
:::

::: check
A teammate suggests a simpler deadline policy with only two branches: fly the fresh solution, or else switch straight to ZEM/ZEV. What does dropping the held branch cost, and what does the held branch's age limit protect against?
:::

::: answer
Without the held branch, every late solve — even one a few milliseconds over — switches the vehicle to a law that solves a different problem, and back again next cycle. In this lesson's table the two commands differed by a factor of more than five, so each switch is a jump in the command the controller must chase, and the fallback's postponed braking has to be paid for later. The held branch avoids that for short misses by following the previous plan, which already says how the thrust should change over the next seconds.

The age limit exists because that plan was computed from an old state. The older it gets, the less it matches where the vehicle really is. Past the limit it is dropped for ZEM/ZEV, which is computed from the current state and is available instantly.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Re-solve rate | $1.667\,\mathrm{Hz}$ ($0.6\,\mathrm s$ cycle), inside the $1$–$2\,\mathrm{Hz}$ range |
| Solve cost | $\approx34\,\mathrm{ms}$ cold, $\approx25\,\mathrm{ms}$ warm-started, against $600\,\mathrm{ms}$ |
| Deadline policy | fresh $\to$ held plan (if young enough) $\to$ closed-form fallback; branch in telemetry; costs measured |
| ZEM, ZEV | Miss in position and velocity if the engine did nothing from now on |
| Fallback | $\mathbf a=(6/t_{go}^2)\,\mathrm{ZEM}-(2/t_{go})\,\mathrm{ZEV}$: minimum-energy, no thrust limits, clamp $t_{go}$, clip the output |
| Branch cost | Total to touchdown, not propellant in one cycle |
| The join | Guidance's point-mass model assumes instant turning |
| Measured gap | Implied $25.2^\circ/\mathrm s$; bang-bang best $2.11\,\mathrm s$ ($7.17^\circ/\mathrm s$ average); realistic settling $3.82\,\mathrm s$, over six cycles |

Guidance's blindness to turn rate is half of this handoff. The next lesson follows the command the rest of the way, into the actuator that saturates against it and the integrator that has to survive the saturation.

::: context convex Why "convex" is the magic word
A **convex** problem has a bowl-shaped cost and a region of allowed answers with no dents or holes. In a bowl, going downhill always leads to the one bottom — there are no false valleys to get stuck in. That is why a solver for a convex problem can promise to finish, with the true best answer, within a known number of steps. For flight software that promise is everything: a solver that *usually* finishes quickly is not good enough when the engine is burning.
:::

::: context warm-start Warm starts, in everyday terms
Doing a crossword you solved yesterday, with a few clues changed, is much faster than a fresh one: most answers still fit. A warm start gives the solver yesterday's answer. How much it helps depends on the method. Some methods, like interior-point solvers, deliberately start far from the edges of the allowed region and gain less from a starting point near the old answer; others, like first-order methods, can pick up almost exactly where they left off.
:::

::: context hard-real-time Hard and soft deadlines
In a **soft** real-time system, like video streaming, a late frame is annoying but harmless. In a **hard** real-time system, a late answer counts as a wrong answer. Flight software schedules every task in fixed time slots. If guidance could run as long as it liked, it would push control and navigation out of their slots, and those loops cannot wait. So guidance gets its slot, and whatever it has not finished by the end is handled by the deadline policy.
:::

::: context telemetry Why the branch goes in telemetry
**Telemetry** is the stream of data a vehicle sends to the ground and records onboard. If the fallback fired twice on a real landing, engineers must be able to see exactly when and why, and then reproduce it in simulation. A branch that is chosen silently cannot be tested or explained afterwards. That is why the exercise requires each branch to report its source.
:::

::: context zem-picture The zero-effort miss, drawn
Here is the first worked example with the engine off. From $300\,\mathrm m$ at $-40\,\mathrm{m/s}$, gravity alone would carry the vehicle along the curve below, through the ground and to $-590\,\mathrm m$ at the planned touchdown time. The arrow from there back up to the pad is ZEM.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 195" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="85" width="300" height="95" fill="#f2b880" opacity="0.35"/>
  <line x1="40" y1="85" x2="340" y2="85" stroke="#1f2a44" stroke-width="2"/>
  <text x="44" y="100" font-size="11" fill="#1f2a44">ground (0 m)</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,40.0 68.0,46.7 96.0,54.9 124.0,64.6 152.0,75.8 180.0,88.4 208.0,102.5 236.0,118.0 264.0,135.1 292.0,153.6 320.0,173.5"/>
  <circle cx="40" cy="40" r="4" fill="#1d6fd1"/>
  <text x="48" y="34" font-size="12" fill="#1d6fd1">start: 300 m, −40 m/s</text>
  <rect x="312" y="81" width="16" height="8" fill="#1f2a44"/>
  <text x="320" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">pad</text>
  <circle cx="320" cy="173.5" r="4" fill="#1d6fd1"/>
  <line x1="320" y1="169" x2="320" y2="97" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="320,90 314,101 326,101" fill="#b4232c"/>
  <text x="312" y="112" font-size="12" text-anchor="end" fill="#b4232c">ZEM = 590 m</text>
  <text x="200" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">no-thrust path over t_go = 10 s</text>
</svg>
```
:::

::: context minimum-energy Minimum energy versus minimum fuel
Both laws land at the same spot, but they spend effort differently. Minimum-energy (ZEM/ZEV) keeps acceleration smooth: in this lesson's first example, it ramps in a straight line from $7.81$ to about $19.8\,\mathrm{m/s^2}$ over the ten seconds. Minimum-fuel prefers the limits: typically full thrust, then the throttle floor, then full thrust again to brake.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="102.9" x2="330" y2="102.9" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="334" y="99" font-size="11" text-anchor="end" fill="#6c7a93">g = 9.81</text>
  <line x1="50" y1="112.5" x2="330" y2="55.1" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="50" cy="112.5" r="3.5" fill="#1d6fd1"/>
  <circle cx="330" cy="55.1" r="3.5" fill="#1d6fd1"/>
  <text x="56" y="128" font-size="12" fill="#1d6fd1">7.81</text>
  <text x="300" y="48" font-size="12" fill="#1d6fd1">19.8</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="166">0 s</text><text x="190" y="166">5 s</text><text x="330" y="166">10 s</text>
  </g>
  <text x="56" y="22" font-size="12" fill="#1f2a44">thrust acceleration, m/s²</text>
</svg>
```

The blue line is the ZEM/ZEV thrust over the whole descent from $300\,\mathrm m$. It crosses gravity partway through: before that the vehicle still speeds up downward; after it, the vehicle slows.
:::

::: context point-mass What a point-mass model leaves out
A **point mass** is an object treated as a single dot: it has mass and position, but no size, shape or orientation. It is a great model for the *path* of a vehicle, and it makes guidance's problem small enough to solve twice a second. What it throws away is exactly what this lesson needs — that a real booster is a long tube that must rotate, against its own inertia, to point its engine somewhere new.
:::

::: context bang-bang The fastest turn from rest to rest
Floor the pedal, then slam the brakes at exactly the halfway point, and you cover a distance in the least possible time while ending at rest. The same idea turns the vehicle: full torque one way, then full torque back. The turn rate rises in a straight line, peaks, and falls back to zero; the angle turned is the area under that triangle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <polygon points="40,150 174.2,51.4 308.4,150" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3">
    <line x1="116.4" y1="150" x2="116.4" y2="60"/><line x1="192.8" y1="150" x2="192.8" y2="60"/><line x1="269.1" y1="150" x2="269.1" y2="60"/>
  </g>
  <text x="330" y="24" font-size="11" text-anchor="end" fill="#b4232c">dashed: re-solves at 0.6, 1.2, 1.8 s</text>
  <text x="174.2" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">area = 15.12°</text>
  <text x="174.2" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">peak 14.3°/s</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="166">0</text><text x="174.2" y="166">1.05 s</text><text x="308.4" y="166">2.11 s</text>
  </g>
  <text x="46" y="24" font-size="12" fill="#1f2a44">turn rate</text>
</svg>
```

Guidance re-solves three times before even this ideal turn is finished.
:::

::: context anti-windup-bridge What comes next
The $3.82\,\mathrm s$ settling time assumed the best of three ways to handle the controller's integrator while the gimbal sits on its stop. Lesson 6 shows the other two, and one of them does not settle at all within six seconds. Lesson 7 then fixes the problem upstream, by shaping the command before it reaches the controller.
:::

::: context six-dof-guidance Where six-degree-of-freedom guidance fits
**Six degrees of freedom** means three for position and three for attitude. Six-DoF guidance plans both at once, so the plan already respects how fast the vehicle can turn. It is commonly solved by **successive convexification**: approximate the hard problem by a convex one near the current guess, solve, repeat. It costs far more computing time. This module keeps the point-mass planner and relies on the controller and the mode manager — lesson 7 — to handle large turns.
:::
