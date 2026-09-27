---
id: l07-mode-management
title: Mode management and the transition boundary
minutes: 21
covers:
  - Mode management across prelaunch, ascent, staging, coast, entry, landing and safe
---

Think about a relay race. Each runner can be fast on their own, but races are lost at the handoff. The baton gets dropped. The next runner starts too early, or too late. Nobody trains for "running" alone and assumes the handoff will take care of itself.

A rocket flight is a relay race too. Every lesson so far in this module lived inside one leg of it: the landing burn, with one guidance law, one set of control gains and one navigation setup, running the whole time. A real mission is a chain of legs. Each leg is called a **mode** — a stretch of the flight with its own guidance law, its own control gains, and sometimes its own navigation setup. The vehicle has to survive each mode, and it also has to survive every *boundary* between two modes: the instant one guidance law stops being in charge and a completely different one takes over.

The piece of flight software that runs the handoffs is the **mode manager**. The first lesson of this module named it but did not build it. This lesson builds it. Then it does what every lesson in this module does at a boundary: it shows, with real numbers, what a handoff costs when nobody manages it, and what careful management buys back.

## Seven modes, one manager

A reusable booster's mission splits into seven modes. The mode manager has one job: decide which mode is active, and decide what happens at the instant that changes. Engineers draw this as a **[[state machine|state-machine]]** — a set of boxes (the modes) joined by arrows (the allowed changes), where each arrow has a rule saying when it fires.

::: example The mode set, and what is active in each
Here is the whole mission, one row per mode. "Exit condition" is the event that ends the mode.

| Mode | Active guidance | Active control | Exit condition |
| --- | --- | --- | --- |
| Prelaunch | none | ground-commanded checks | liftoff command |
| Ascent | closed-loop ascent steering (iterative guidance) | gain-scheduled against dynamic pressure and mass | main engine cutoff |
| Staging | none (ballistic) | attitude-hold through separation transients | separation confirmed |
| Coast | attitude-hold or a boostback-burn law | attitude-hold or boostback control | entry-interface altitude |
| Entry | an entry-phase steering law | gain-scheduled against dynamic pressure | entry-burn complete / below entry-relevant dynamic pressure |
| Landing | convex powered-descent guidance, re-solved at $1.667\,\mathrm{Hz}$ | gain-scheduled against mass (this module's own lessons) | touchdown |
| Safe | none, or a minimum-risk law | whatever the fault response specifies | ground command, or never, depending on the fault |

Read a few rows aloud to feel how it works. Ascent ends at **[[main engine cutoff|meco]]**. Staging ends when separation of the stages is confirmed. Coast may include a **[[boostback burn|boostback]]** and ends when the booster falls to the **[[entry-interface altitude|entry-interface]]**.

Most of these laws were built in earlier modules and are not rebuilt here: ascent steering in the ascent-guidance module, the entry law in the entry-descent-landing material. What is new is the manager above them all — the part that decides *when* to switch, and *what crosses the boundary* when it does.
:::

::: key What the mode manager owns
The active mode, the logic that decides when to leave it, and — the part every other piece of the stack depends on — what state, if any, carries across a transition. Guidance's reference, control's integrator, and navigation's own configuration (which sensors are active, which states are estimated) can all change at a mode boundary. The mode manager is the only piece of the stack placed to make that change deliberate rather than accidental.
:::

The mode manager does not need to run fast. Modes change a handful of times per flight, so checking the exit conditions a few times per second is plenty. It sits at the bottom of the rate stack from the rate-architecture lesson.

::: key Typical GNC rate stack on a booster
Navigation at IMU rate (hundreds of Hz), control at 100 Hz or more, guidance re-solved at 1 to 2 Hz, mode management at a few Hz. Each rate is set by the bandwidth of what that loop must track, not by available CPU.
:::

## Safe mode's entry is unconditional; every other transition is not

Look at the exit column again. Six of the seven modes are entered and left by a specific, expected event: a cutoff signal, a confirmed separation, an altitude crossing. Each of those arrows starts from only one or two modes, at a roughly known time.

**[[Safe mode|safe-mode]]** is different on purpose. It is the mode the vehicle falls back to when something has gone wrong. A fault can happen at any moment in any mode, so the arrow *into* safe must start from every other mode. FDIR — the fault-monitoring software of the next lesson — can pull that trigger no matter what the active mode was doing at the instant of the fault. That is what **unconditional** means here: the transition does not wait for any mode-specific condition to be true.

This must not be left implicit. Suppose the transition to safe was only ever tested from landing mode. Then it has not been verified at all from ascent, coast or entry. A fault in one of those untested modes is exactly the case a program discovers the hard way. The next lesson builds the monitors that fire this transition. This lesson's job is to make sure the manager can reach safe cleanly from anywhere it might be asked to.

::: warning Test the arrow into safe from every mode
One test of "fault → safe" proves one arrow. There are six arrows into safe, one from each of the other modes, and each needs its own test, with the fault injected while that mode is active.
:::

## The boundary this module builds: coast or entry into landing

The most important ordinary handoff in this mission is the one from coast (or entry) into landing. It is the one place where the *guidance law itself* changes completely, not only its gains.

Coast or entry mode holds the vehicle at some attitude — the direction the booster points. It might be a fixed hold, or whatever the entry law was commanding. That law has nothing to do with the convex powered-descent problem that landing mode is about to start solving. So nothing forces the two to agree at the handover instant. They are not the same optimization with different settings. They are two different problems, and where the first one leaves the vehicle is not, in general, a sensible starting point for the second.

::: example The discontinuity, in this module's own numbers
Coast mode holds the vehicle at $0^\circ$ from vertical.

**The handoff.** The instant landing mode switches on, its first convex re-solve runs. It starts from the navigation estimate at ignition, as the guidance-meets-control lesson described. It commands $15.12^\circ$ from vertical.

**What that is.** This is not a small correction. It is a brand-new optimization with no memory of what coast mode was doing. To the control loop it arrives as a **step** — a jump from one value to another in a single instant.

**What the control lesson found.** That lesson fed this same $15.12^\circ$ step to the controller. The gimbal slammed into its $5^\circ$ limit. Without the back-calculation form of **[[anti-windup|windup]]**, the attitude had not settled six seconds later.

**Whose fault?** Neither law's. Coast's hold is right for coast. Landing's solve is right for landing. The jump is a structural result of switching between two formulations that share no state.
:::

## Shaping the reference at the boundary

The control lesson showed one defense: a good anti-windup scheme that *recovers* cleanly after the actuator saturates. The mode manager can do better than recover. It can make the actuator saturate less often in the first place, by not handing control the whole step in one instant.

Here is the everyday version. When you merge onto a highway, you do not stamp the gas pedal to the floor. You press it down steadily. You reach the same speed, but nothing lurches.

The mode manager does the same with the **reference** — the attitude it tells the control loop to hold. Instead of jumping from $0^\circ$ to $15.12^\circ$, it moves the reference toward the new target at a fixed, limited speed. That speed is the **shaping rate**, measured in degrees per second ($^\circ/\mathrm s$, read "degrees per second"). When the ramp reaches the target, control goes back to tracking landing guidance normally. This is called **[[rate-limiting the reference|step-vs-ramp]]**, and it sits upstream of the control loop entirely.

How long does the ramp take? Divide the angle by the rate. At $6^\circ/\mathrm s$, the ramp covers $15.12^\circ$ in $15.12 / 6 = 2.52\,\mathrm s$. At $4^\circ/\mathrm s$ it takes $3.78\,\mathrm s$; at $8^\circ/\mathrm s$, $1.89\,\mathrm s$; at $10^\circ/\mathrm s$, $1.51\,\mathrm s$.

```python
def ramp_ref(held_deg, target_deg, rate_deg_s, t):
    """Reference t seconds after the mode switch, moving at a limited rate."""
    step = rate_deg_s * t
    if target_deg > held_deg:
        return min(target_deg, held_deg + step)
    return max(target_deg, held_deg - step)

for rate in (4, 6, 8, 10):
    print(rate, round(15.12 / rate, 2), ramp_ref(0.0, 15.12, rate, 1.0))
# 4 3.78 4.0
# 6 2.52 6.0
# 8 1.89 8.0
# 10 1.51 10.0
```

::: example How much shaping the transition buys, at different rates
The reference is ramped from $0^\circ$ toward the $15.12^\circ$ target at four different shaping rates. The gimbal's position limit is $5^\circ$. Its own **[[rate limit|gimbal-limits]]** — how fast it can swing — is $12^\circ/\mathrm s$.

| Shaping rate | Peak gimbal deflection | Naive integrator | Back-calculation |
| --- | --- | --- | --- |
| $4^\circ/\mathrm s$ | $2.7^\circ$ | converges cleanly | converges cleanly |
| $6^\circ/\mathrm s$ | $4.3^\circ$ | converges cleanly | converges cleanly |
| $8^\circ/\mathrm s$ | $5.0^\circ$ (right at the limit) | converges, slowly | converges, slowly |
| $10^\circ/\mathrm s$ | $5.0^\circ$ (saturated) | fails: still $13.8^\circ$ off target after $6\,\mathrm s$ | recovers, settling in $5.56\,\mathrm s$ |

**Rows one and two.** At $4$ and $6^\circ/\mathrm s$ the gimbal never reaches its $5^\circ$ limit. With no saturation, the choice of anti-windup scheme stops mattering: there is nothing for it to manage.

**Row three.** At $8^\circ/\mathrm s$ the gimbal touches its limit. Both schemes still converge, but slowly. This is the edge.

**Row four.** At $10^\circ/\mathrm s$ the gimbal sits pinned at $5^\circ$. The naive integrator fails outright: six seconds after the switch the vehicle is still swinging, far from the target. Back-calculation still recovers. Note that $10^\circ/\mathrm s$ is well inside the gimbal's own $12^\circ/\mathrm s$ rate limit. The hardware can follow this command; the loop around it is what fails.

**Sanity check.** Faster ramps demand bigger gimbal angles, and the peak column grows with the rate until it hits the $5^\circ$ ceiling. That is the pattern you would expect.
:::

So shaping and anti-windup are not rival fixes for the same problem. They are two layers of one defense. The table shows exactly where the first layer alone is enough (slow ramps) and where the second layer is the only thing between a clean handoff and a real failure (the fast ramp).

::: warning A shaped reference is a mode-manager decision, not a control-loop afterthought
It is tempting to treat reference shaping as one more tuning knob, added wherever a control engineer happens to notice saturation. It belongs in the mode manager, because *only* the mode manager knows a transition is happening. The control loop receives a reference each cycle and cannot tell "guidance's ordinary re-solve moved the target a little" from "the mode changed this cycle and the reference jumped with it." Putting the shaping at the boundary, where the transition is detected, makes it apply exactly when it is needed and nowhere else.
:::

::: warning Bumpless transfer for a gain change is not the same problem as bumpless transfer for a guidance-law change
The classical-control module built **[[bumpless transfer|bumpless]]**: when one controller hands over to another, set the incoming controller's integrator $I$ so its output matches the outgoing controller's command,

$$
I(t_0)=u_{\text{current}}-K_pe(t_0)+K_d\dot y_f(t_0).
$$

Here $t_0$ is the switch instant, $u_{\text{current}}$ is the command being sent right now, $e$ is the tracking error, and $\dot y_f$ (read "y-f dot") is the filtered rate of the measured output. This keeps the *controller's* command continuous across a gain change. It does not solve this lesson's problem. Here the jump starts one level upstream, in the *reference* that two different guidance laws hand the controller, before either controller's integrator logic runs. Both mechanisms are worth having. Neither replaces the other.
:::

## Check yourself

::: check
Explain why the transition into safe mode is called "unconditional," while every other mode's exit in this lesson's table is a specific, expected trigger.
:::

::: answer
Every other transition fires from a known cause at a roughly known point in the mission — a cutoff signal, a confirmed separation. It only needs to be reachable from the one or two modes that come right before it. Safe mode has to be reachable from *any* mode, at any time, because a fault can happen at any point and the response cannot depend on which mode happened to be active. A mode manager whose transition-to-safe logic quietly assumed it would only ever be entered from one particular mode has left every other mode's fault response untested.
:::

::: check
The coast-to-landing jump in this lesson is described as "not a bug in either guidance law." What makes it a structural result of the mode change rather than an error in either law?
:::

::: answer
Coast's attitude hold and landing's convex re-solve are each correct, verified solutions to their own separate problems. One holds a fixed attitude. The other optimizes a trajectory from the current state to the touchdown target. Neither was ever designed with any duty to agree with the other at a boundary neither of them models. The jump exists because nothing inside either law makes it hand off smoothly to a different law solving a different problem. Fixing it needs something *outside* both laws, at the boundary between them — which is the mode manager's job, not a defect in either law.
:::

::: check
At a shaping rate of $8^\circ/\mathrm s$, the peak gimbal deflection reaches exactly the $5^\circ$ limit. Why is this rate a more informative test case than $4^\circ/\mathrm s$ (comfortably under) or $10^\circ/\mathrm s$ (clearly over)?
:::

::: answer
A rate that puts the peak right at the limit is the boundary case. It tells the designer how much margin the chosen shaping rate really has. The $4^\circ/\mathrm s$ case shows the fix works, but not how close a faster, still plausible rate would come to failing. The $10^\circ/\mathrm s$ case shows failure, but not how near the edge of success it sits. At $8^\circ/\mathrm s$ the handoff still recovers, but with the least room to spare: a slightly heavier vehicle or a slightly larger reorientation could push it into the failure the $10^\circ/\mathrm s$ row shows. That is the case a verification campaign should look at hardest.
:::

::: check
A colleague says the $10^\circ/\mathrm s$ failure does not matter, because $10^\circ/\mathrm s$ is inside the gimbal's $12^\circ/\mathrm s$ rate limit, so the hardware can execute the command. What is wrong with using the actuator's rate limit alone as the safety test?
:::

::: answer
The actuator following its own commanded rate says nothing about whether the *closed loop* around it reaches the intended attitude. In the naive-integrator failure, the gimbal did not fall behind its rate limit. It sat pinned at its *position* limit long enough for the integrator to wind up, and the stored-up command then drove the vehicle past the target and kept it swinging. A test checked only against the actuator's rate specification would call this case safe, because it answers a question about the actuator on its own rather than about the whole loop the actuator sits inside.
:::

::: check
Guidance computed the $15.12^\circ$ target. Why is the mode manager, not guidance, the right place to decide how fast to ramp the reference during the transition?
:::

::: answer
Guidance's convex re-solve has no model of the actuator's rate or position limits. Its output is a target the translational optimization treats as reachable instantly, by construction. So guidance has no basis for choosing a shaping rate that respects the vehicle's real physical limits. The mode manager already has to know when a transition is happening, and it can be given the actuator's real limits directly. That makes it the natural place to insert a rate-limited path from the old reference to the new one, without rebuilding guidance's optimization around a constraint it was never designed to carry.
:::

## Summary

| Item | Statement |
| --- | --- |
| Seven modes | prelaunch, ascent, staging, coast, entry, landing, safe — each with its own active guidance and control law |
| Mode manager | Owns the active mode, the exit logic, and what state crosses a boundary; runs at a few Hz |
| Safe mode | Reachable unconditionally, from any other mode, at any time — the one transition every mode must support and test |
| The coast/entry $\to$ landing boundary | Two guidance laws solving unrelated problems; nothing forces the commanded reference to be continuous between them |
| Measured jump | $0^\circ$ (coast hold) to $15.12^\circ$ (landing guidance's first solve) — a step, not a refinement |
| Reference shaping | Ramp the commanded reference at a limited rate; ramp time = angle ÷ rate; at $\le6^\circ/\mathrm s$ here the gimbal never saturates |
| Layered defense | Shaping (mode manager) reduces how often saturation happens; anti-windup (control) recovers from what remains; at $10^\circ/\mathrm s$ only the second layer prevents failure |
| Bumpless transfer's limit | Keeps the controller's command continuous across a gain change; does not by itself keep the reference continuous across a guidance-law change |

The mode manager decides when the vehicle meets a jump like this one. The next lesson builds the software that notices when something has actually gone wrong — the residual monitors, sensor cross-checks and actuator-health checks that decide whether the active mode is still the right one to be in.

::: context state-machine Boxes and arrows
A **state machine** is a drawing and a program at the same time. Each box is a state (here, a mode); each arrow is an allowed change, labeled with the event that fires it. The vehicle is in exactly one box at a time. The blue arrows below are the ordinary mission order. The red arrows are the ones this lesson insists on: every mode has its own path into safe.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="24">Prelaunch</text><text x="90" y="24">Ascent</text><text x="150" y="24">Staging</text>
    <text x="210" y="24">Coast</text><text x="270" y="24">Entry</text><text x="330" y="24">Landing</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="39" y1="44" x2="78" y2="44"/><line x1="99" y1="44" x2="138" y2="44"/><line x1="159" y1="44" x2="198" y2="44"/>
    <line x1="219" y1="44" x2="258" y2="44"/><line x1="279" y1="44" x2="318" y2="44"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="81,44 74,40 74,48"/><polygon points="141,44 134,40 134,48"/><polygon points="201,44 194,40 194,48"/>
    <polygon points="261,44 254,40 254,48"/><polygon points="321,44 314,40 314,48"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5">
    <circle cx="30" cy="44" r="8"/><circle cx="90" cy="44" r="8"/><circle cx="150" cy="44" r="8"/>
    <circle cx="210" cy="44" r="8"/><circle cx="270" cy="44" r="8"/><circle cx="330" cy="44" r="8"/>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3">
    <line x1="30" y1="52" x2="140" y2="146"/><line x1="90" y1="52" x2="158" y2="146"/><line x1="150" y1="52" x2="172" y2="146"/>
    <line x1="210" y1="52" x2="188" y2="146"/><line x1="270" y1="52" x2="202" y2="146"/><line x1="330" y1="52" x2="220" y2="146"/>
  </g>
  <rect x="130" y="146" width="100" height="28" rx="6" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="165" font-size="13" font-weight="700" fill="#b4232c" text-anchor="middle">Safe</text>
  <text x="180" y="192" font-size="11" fill="#6c7a93" text-anchor="middle">any mode can fall into safe, at any time</text>
</svg>
```
:::

::: context meco Engine cutoff
"Main engine cutoff," often shortened to MECO (said "MEE-koh"), is the moment the first stage's engines shut down on the way up. It is a clean, easy-to-detect event: the flight computer commanded it and the engine sensors confirm it. That makes it a good trigger for a mode change. On a Falcon 9 it comes about two and a half minutes after liftoff, and stage separation follows a few seconds later.
:::

::: context boostback Turning around in the sky
A booster that wants to land back near its launch site is moving *away* from it, fast, when the stages separate. A **boostback burn** flips the booster around and fires some engines to cancel that downrange speed and send it back toward the landing site. A booster landing on a ship far downrange can skip the boostback, which saves propellant. Either way, coast is not "doing nothing" — it can hold its own burn with its own guidance and control.
:::

::: context entry-interface Where the air starts to matter
"Entry interface" is an agreed altitude where engineers say the atmosphere starts to matter for a vehicle coming down. Above it, drag is so small that the vehicle is treated as falling through vacuum. Below it, air pressure on the vehicle grows fast. The exact number depends on the vehicle and mission. The point is that the mode manager needs a clean, measurable threshold to switch on, and altitude from the navigation filter gives it one.
:::

::: context safe-mode What "safe" means depends on the vehicle
On a satellite, safe mode usually means: stop the mission, point the solar panels at the Sun so the batteries stay charged, and wait for engineers on the ground. That works because a satellite in orbit has time — it will not fall out of the sky in the next minute.

A booster in its landing burn has no such calm state to rest in. That is why this lesson's table says safe mode's law is "none, or a minimum-risk law": for a booster, safe often means steering somewhere harmless, such as away from people and toward open water, rather than waiting.
:::

::: context windup Why a stuck actuator winds the integrator up
The integrator in a controller adds up error over time, like water filling a bathtub. That is how it removes small, steady errors. But when the gimbal is pinned at its limit, extra command does nothing — yet the error is still there, so the tub keeps filling. When the vehicle finally reaches the target, the tub is overflowing, and that stored-up command pushes the vehicle far past the target. **Anti-windup** is any rule that stops the tub overfilling. Back-calculation drains it by the amount of command the actuator could not deliver.
:::

::: context step-vs-ramp Step versus ramp
The same $15.12^\circ$ change, delivered two ways. The red step asks for all of it at once, and the gimbal saturates. The blue ramp at $6^\circ/\mathrm s$ asks for it over $2.52\,\mathrm s$, and the gimbal never reaches its limit. Both end at the same attitude; only the path is different.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="50" x2="345" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="34" y="54" font-size="11" fill="#1f2a44" text-anchor="end">15.12°</text>
  <text x="34" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0°</text>
  <polyline points="40,150 40,50 340,50" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="40,150 160,50 340,50" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="160" y1="146" x2="160" y2="154" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">2.52 s</text>
  <text x="40" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="300" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">time →</text>
  <text x="54" y="40" font-size="11" fill="#b4232c">step: all at once</text>
  <text x="112" y="120" font-size="11" fill="#1d6fd1">ramp at 6°/s</text>
</svg>
```
:::

::: context gimbal-limits Two different limits on one gimbal
A gimbal is the pivot that lets the engine swing to steer the rocket. It has two separate limits. The **position limit** is how far it can tilt: here, $5^\circ$ either side of straight. The **rate limit** is how fast it can swing: here, $12^\circ$ per second. A command can respect one limit and break the other. In this lesson's failure, the swing speed was fine; the tilt hit its stop and stayed there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="20" r="5" fill="#1f2a44"/>
  <line x1="180" y1="20" x2="180" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="180" y1="20" x2="171.3" y2="119.6" stroke="#b4232c" stroke-width="2"/>
  <line x1="180" y1="20" x2="188.7" y2="119.6" stroke="#b4232c" stroke-width="2"/>
  <path d="M168,40 L192,40 L204,90 L156,90 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="134" font-size="11" fill="#b4232c">5° stop</text>
  <text x="132" y="134" font-size="11" fill="#b4232c">5° stop</text>
  <text x="228" y="60" font-size="11" fill="#1f2a44">engine bell</text>
  <text x="195" y="24" font-size="11" fill="#1f2a44">pivot</text>
</svg>
```
:::

::: context bumpless Where "bumpless" comes from
The word comes from factory process control. An operator running a valve by hand switches it over to automatic control. If the automatic controller starts from its own idea of the right output, the valve jumps — a "bump" that can slosh a tank or spike a pressure. A bumpless transfer starts the new controller from exactly the output the old one was sending. The same idea protects a rocket's gimbal when control gains change mid-flight.
:::
