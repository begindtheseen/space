---
id: l01-system-decomposition-and-interfaces
title: System decomposition and interface contracts
minutes: 21
covers:
  - System decomposition and the interface contracts between navigation, guidance, control and the vehicle
---

Every module before this one taught you a piece of a GNC stack in isolation: a filter, a guidance law, a controller, a mode logic, each verified against its own, carefully-scoped test. This module builds the piece nobody gets to isolate — the place where a correct filter, a correct guidance law and a correct controller are wired together and have to fly as one system. That wiring is not a footnote. It is where a large fraction of real flight anomalies live, because a unit test can only ever check a module against the interface it was told to expect, and an integration failure is, almost by definition, a case where what one module actually sent differs from what the next module assumed it would receive.

This first lesson draws the boundaries before anything else happens. You will build one vehicle across the whole module — a reusable first-stage booster in its landing burn, the phase where navigation, guidance, control, mode management and fault response all run at once and all matter. Fix its numbers now, once, so every later lesson can cite them without re-deriving them. Then name the four software modules a landing GNC stack decomposes into, and state precisely what crosses each boundary between them: not just a data type, but the units, the rate, and — the part a diagram never shows — the assumption the receiving module is permitted to make about how fresh and how correct that data is. Every failure in the rest of this module is a violated assumption at one of these boundaries, and you cannot see the violation until you have written the assumption down.

## The reference vehicle

The vehicle this module flies is a reusable booster returning to a landing site after stage separation, boostback and an entry burn — phases the ascent-guidance and entry-descent-landing material already covered, and which this module does not re-teach. What this module owns is the propulsive landing burn: the last thirty seconds or so, where a navigation filter, a re-solved guidance law and a gain-scheduled attitude controller all have to work together to bring the vehicle to a soft, on-target touchdown on a single throttleable engine.

::: key The reference vehicle, fixed for the whole module
Landing-burn ignition: mass $m_0 = 31{,}600\,\mathrm{kg}$ ($25{,}600\,\mathrm{kg}$ dry, $6{,}000\,\mathrm{kg}$ landing propellant), altitude $h_0=2000\,\mathrm m$, vertical velocity $v_{z,0}=-220\,\mathrm{m/s}$, downrange velocity $v_{x,0}=70\,\mathrm{m/s}$ to be nulled. Single engine, thrust $T=900\,\mathrm{kN}$, specific impulse $I_{sp}=283\,\mathrm s$, throttleable over $40\%$ to $100\%$ of rated thrust — it cannot throttle to zero. Target: touchdown at the pad, vertical speed $-2.5\,\mathrm{m/s}$, zero lateral velocity.
:::

Every number in later lessons — filter covariances, control margins, Monte-Carlo miss distances — is computed for this vehicle, run as an actual simulation, not asserted. You can recompute any of them; nothing in this module quotes a number nobody produced.

## Four software modules, one job each

Inside the "GNC" box of the five-box simulation architecture — the box that never reads plant truth directly and is, wherever practical, the literal flight code — a landing stack decomposes into four cooperating pieces, each with one job and one kind of output.

**Navigation** owns the vehicle's best estimate of its own state: position, velocity, attitude, and the sensor biases distorting the raw measurements that produced that estimate — together with a covariance describing how much to trust it. It reads sensors and nothing else. It writes an estimate and nothing else; it does not decide what the vehicle should do about that estimate.

**Guidance** owns the reference the vehicle is trying to fly: a target position, velocity and thrust-pointing direction, re-solved periodically from the current estimated state toward the touchdown target. It reads the navigation estimate and the active mode. It writes a commanded trajectory or a commanded acceleration — not an actuator command, and not a claim about how fast the vehicle can actually turn to follow it.

**Control** owns the actuator commands: gimbal deflection, throttle setting. It reads guidance's commanded trajectory and navigation's attitude and rate estimate, and it is the only one of the four that has to reconcile a plan against a vehicle's actual, physically limited ability to track it.

**Mode management** owns which of these three is even allowed to act, and how. It reads status from all three — a filter consistency flag from navigation, a solved-or-missed flag from guidance, a saturation flag from control — and it writes the active mode and the transition logic that switches guidance laws and control gains at each boundary between prelaunch, ascent, coast, entry, landing and safe.

Nothing here is new physics; it is the same rule the five-box simulation architecture already enforced — GNC never reads plant truth, the plant never receives a command directly — applied one level further in, inside GNC's own box. Each of these four pieces is itself only allowed to read what a *different* piece of GNC actually wrote, never a value it happened to have lying around internally.

## What actually crosses each boundary

A block diagram with an arrow labeled "state estimate" from navigation to guidance has told you almost nothing. An interface contract has to specify four things about that arrow, not one:

::: key An interface contract, in full
**What**: the exact quantity and its representation (a quaternion, not "attitude"; a $3\times3$ covariance block, not "uncertainty"). **Units**: SI, stated, never inferred from context. **Rate**: how often a fresh value appears, and what the receiver sees between fresh values. **Assumption**: what the receiving module is entitled to believe about the data's age and correlation structure — and this is the piece a diagram never draws, and the piece every later lesson in this module finds violated somewhere.
:::

::: example The four interfaces of the landing burn, written out in full
| Interface | What crosses it | Units | Rate | Assumption the receiver makes |
| --- | --- | --- | --- | --- |
| Navigation $\to$ Guidance | position $\mathbf r$, velocity $\mathbf v$, and a scalar time-to-go estimate | m, m/s, s | fresh value every guidance cycle, $0.6\,\mathrm s$ | the estimate is the vehicle's *current* state, with no lag and no correlation to the previous cycle's estimate |
| Guidance $\to$ Control | commanded thrust-pointing angle $\theta_{\mathrm{cmd}}$ and throttle fraction | rad, dimensionless | held fixed for $0.6\,\mathrm s$ between re-solves | the commanded angle is one the vehicle can reach well within one guidance cycle |
| Control $\to$ Vehicle (actuators) | gimbal deflection command $\delta_{\mathrm{cmd}}$, throttle command | rad, dimensionless | every control tick, $10\,\mathrm{ms}$ | the actuator will deliver close to what was asked, subject only to its own documented limits |
| Navigation, Guidance, Control $\to$ Mode manager | a filter-consistency flag, a solved/missed flag, a saturation flag | boolean each | every control tick | each flag reflects the *current* cycle, not a stale one |

Four rows, four assumptions — and four of this module's later lessons are built entirely around one of these four assumptions turning out to be false in a specific, measurable way.
:::

Notice what the table does not say. It does not say guidance's position input is *exact* — only that guidance is entitled to treat it as the vehicle's current state, with no further qualification, because that is the only thing an interface contract of this shape can promise. Whether that promise is a safe one to build a guidance law on is a question about the *navigation filter's own error characteristics*, which is the very question the next lesson in this module — the error budget — exists to answer with a number rather than a hope.

::: example One cycle, traced through all four modules
At landing-burn ignition, navigation reports $\mathbf r \approx (-450, 2000)\,\mathrm m$, $\mathbf v \approx (70, -220)\,\mathrm{m/s}$ (downrange, altitude). Guidance, solving from that estimate toward the pad with $24\,\mathrm s$ of time-to-go, returns a commanded thrust acceleration of magnitude $26.75\,\mathrm{m/s^2}$ pointed $15.12^\circ$ from vertical. Control converts that pointing angle into a torque demand and commands a gimbal deflection, saturating hard against the actuator's $5^\circ$ limit for the first fraction of a second because the vehicle starts vertical and the commanded angle is a large reorientation — exactly the join that later lessons in this module build out in full, with real numbers for what that saturation costs. The vehicle's actuators deliver whatever the gimbal and throttle dynamics allow, not the raw command; the plant responds; navigation senses the response through IMU, GNSS and radar-altimeter measurements and produces the *next* cycle's estimate. One lap around all four modules, thirty more of them before touchdown.
:::

::: warning A module that reads another's internals has created an interface nobody documented
It is tempting, mid-debugging, to have the controller peek at a variable inside the navigation filter that is not part of its declared output — an intermediate covariance term, a raw sensor residual — because it is *right there* and would save a recomputation. Doing this creates a real dependency between two modules that the interface table above does not, and cannot, record. The next person who changes navigation's internals has no way to know control now depends on one of them, and the failure that results is invisible in every test that exercises the documented interface, because the documented interface never changed.
:::

::: warning An unstated assumption is not a safe default; it is a coin flip
When an interface's *assumption* column is left blank rather than filled in, both sides tend to fill it in independently, and there is no reason to expect they fill it in the same way. A guidance engineer building the re-solve loop reasonably assumes the navigation estimate it reads is this cycle's; a navigation engineer, under compute pressure, reasonably ships an estimate that is one cycle stale on the input it is busiest processing. Both engineers made a defensible assumption. Neither wrote it down, and the two defensible assumptions do not agree.
:::

## Check yourself

::: check
Name the four software modules this lesson decomposes a landing GNC stack into, and state in one phrase what each one is not allowed to do.
:::

::: answer
Navigation: estimates state, does not decide what to do about it. Guidance: computes a reference trajectory or commanded acceleration, does not command an actuator directly. Control: commands actuators to track guidance's reference, does not choose the reference itself. Mode management: chooses which mode and which law is active, does not compute a trajectory or a state estimate itself — it only reads status flags from the other three and switches between them.
:::

::: check
The interface table lists "rate" and "assumption" as two separate columns. Give a concrete case where two interfaces could have the identical rate but different assumptions, and explain why that difference matters.
:::

::: answer
Guidance-to-control and control-to-vehicle could both update at the same $10\,\mathrm{ms}$ tick, yet guidance's commanded angle carries the assumption "reachable within one cycle" while a raw actuator command carries no such assumption at all — the actuator is expected to do its physical best with whatever it is given, reachable or not. Two interfaces with the same rate can therefore license completely different behavior from the receiver: one assumes feasibility and would be wrong to receive an infeasible command, the other assumes nothing about feasibility and is specifically built to absorb one.
:::

::: check
A vehicle's guidance module is changed to re-solve twice as often, from $0.6\,\mathrm s$ to $0.3\,\mathrm s$ per cycle, with no other change anywhere in the stack. Using only the interface table, say which other module's documented assumption is now most directly at risk, and why.
:::

::: answer
Control's assumption is at risk: it depends on the commanded angle guidance sends being "one the vehicle can reach well within one guidance cycle." Halving the cycle time halves the time control has to reach a given commanded reorientation before the *next* command arrives, without changing the vehicle's physical ability to reorient at all. The interface's data type, units and even its rate column are all still technically satisfied; only the feasibility assumption underneath the rate has silently gotten harder to keep, which is exactly the kind of change an interface table catches and a data-type check does not.
:::

::: check
Why does this lesson insist that navigation reads sensors "and nothing else," when in a real flight computer the navigation code and the guidance code often run in the same process, with every variable in the same address space?
:::

::: answer
Sharing an address space is an implementation fact about the flight computer, not a license to ignore the module boundary; the discipline "navigation reads sensors and nothing else" is about which *data dependencies the design is allowed to have*, independent of whether the hardware happens to make an illegal dependency easy to write by accident. The five-box simulation architecture's rule that GNC never reads plant truth is enforced for exactly the same reason even though, in a simulation, the plant's true state sits in ordinary, directly readable memory the whole time. The boundary is a statement about what a module is entitled to depend on, not about what the hardware or the language makes technically reachable.
:::

::: check
The worked example shows the commanded gimbal deflection saturating hard in the first fraction of a second after ignition. Using only this lesson's interface table — not yet the numbers a later lesson computes — identify which single assumption in the table that saturation is evidence against.
:::

::: answer
It is evidence against the guidance-to-control assumption: "the commanded angle is one the vehicle can reach well within one guidance cycle." A command that saturates the actuator immediately is, by construction, one the vehicle cannot instantly comply with, so whatever guidance's translational model assumed about how fast the vehicle can reorient was optimistic relative to what the actuator can actually deliver — the exact mismatch a later lesson in this module measures directly, in degrees per second and in the resulting trajectory error.
:::

## Summary

| Module | Reads | Writes | Never does |
| --- | --- | --- | --- |
| Navigation | sensors (IMU, GNSS, radar altimeter) | state estimate + covariance | decide vehicle action |
| Guidance | nav estimate, active mode | reference trajectory / commanded acceleration | command an actuator directly |
| Control | guidance reference, nav attitude/rate | actuator commands (gimbal, throttle) | choose the reference itself |
| Mode manager | status flags from all three | active mode, transition logic | compute a trajectory or estimate |
| Interface contract, four parts | — | what, units, rate, assumption | leave the assumption unstated |

This lesson fixed the vehicle and the four boundaries every later lesson in this module lives on. The next lesson takes the landing-accuracy requirement those boundaries exist to satisfy and turns it into a number for each one — an error budget, allocated before a single line of the stack is verified, so that "how good does each piece have to be" has an answer before the campaign that checks it ever runs.
