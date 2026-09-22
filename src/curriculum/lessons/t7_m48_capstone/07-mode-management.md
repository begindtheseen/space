---
id: l07-mode-management
title: Mode management and the transition boundary
minutes: 22
covers:
  - Mode management across prelaunch, ascent, staging, coast, entry, landing and safe
---

Every lesson so far in this module has lived inside one mode: the landing burn, with one guidance law, one control schedule, one navigation configuration, running continuously. A real mission is not one mode. It is a sequence of them, each with its own active guidance law, its own control gains, sometimes its own navigation configuration, and the vehicle has to survive not only each mode on its own but every *boundary* between two of them — the instant one guidance law stops being the one in charge and a completely different one starts. This lesson builds the mode manager the first lesson in this module named but did not yet specify, and then does what every lesson in this module does at a boundary: shows, with real numbers, what a mode manager that does not actively manage the transition costs, and what actively managing it buys back.

## Seven modes, one manager

A reusable booster's mission decomposes into seven modes, and the mode manager's entire job is deciding which one is active and what happens at the instant it changes.

::: example The mode set, and what is active in each
| Mode | Active guidance | Active control | Exit condition |
| --- | --- | --- | --- |
| Prelaunch | none | ground-commanded checks | liftoff command |
| Ascent | closed-loop ascent steering (iterative guidance) | gain-scheduled against dynamic pressure and mass | main engine cutoff |
| Staging | none (ballistic) | attitude-hold through separation transients | separation confirmed |
| Coast | attitude-hold or a boostback-burn law | attitude-hold or boostback control | entry-interface altitude |
| Entry | an entry-phase steering law | gain-scheduled against dynamic pressure | entry-burn complete / below entry-relevant dynamic pressure |
| Landing | convex powered-descent guidance, re-solved at $1.667\,\mathrm{Hz}$ | gain-scheduled against mass (this module's own lessons) | touchdown |
| Safe | none, or a minimum-risk law | whatever the fault response specifies | ground command, or never, depending on the fault |

Every mode but the last two is built by prerequisite modules this module does not repeat: ascent guidance by the ascent-guidance module, the entry-phase law by the entry-descent-landing material. What is new here is not any one mode's own internal law — it is the manager that decides when to switch, and what crosses the boundary when it does.
:::

::: key What the mode manager owns
The active mode, the logic that decides when to leave it, and — the part every other module in this stack depends on being handled correctly — what state, if any, carries across a transition. Guidance's reference, control's integrator, and navigation's own configuration (which sensors are active, which states are estimated) can all change at a mode boundary, and the mode manager is the only piece of the stack positioned to make that change deliberate rather than accidental.
:::

## Safe mode's exit is unconditional; every other mode's is not

Six of this module's seven modes are entered and left by a specific, expected condition — a cutoff signal, a confirmed separation, an altitude threshold. Safe mode is different by design: the transition *into* it must be reachable from every other mode, at any point in the mission, triggered by FDIR regardless of what the active mode was doing at the instant the fault occurred. This is not a detail to leave implicit; a mode manager whose transition-to-safe logic was only ever tested from, say, the landing mode has not verified the transition at all from ascent, coast or entry, and a fault occurring in one of the untested modes is exactly the case a program discovers the hard way. The FDIR lesson later in this module builds the monitors that trigger this transition; this lesson's job is only to confirm the manager can actually reach safe cleanly from anywhere it might be asked to.

## The boundary this module builds: coast or entry into landing

The most consequential ordinary transition in this module's own mission is the one from coast or entry into landing mode, because it is the one place where the *guidance law itself* changes completely, not merely its gains. Coast or entry mode holds the vehicle at some attitude — a fixed inertial hold, or whatever an entry-phase law was commanding — using a formulation with no relationship at all to the convex powered-descent problem landing mode is about to start solving. Nothing forces the two to agree at the handover instant, because they are not the same optimization with different gains; they are two different problems, and the vehicle's attitude at the end of one has no reason to already be a sensible starting point for the other.

::: example The discontinuity, in this module's own numbers
Coast mode holds the vehicle at $0^\circ$ from vertical. The instant landing mode activates, its first convex re-solve — computed from the ignition-time navigation estimate, exactly as the guidance lesson earlier in this module described — commands $15.12^\circ$. That is not a small correction landing guidance is refining; it is a fresh optimization with no memory of what coast mode was doing, arriving as a step the control lesson in this module already showed saturating the actuator hard and, without back-calculation anti-windup running, not settling within six seconds. The discontinuity is not a bug in either guidance law — each is correct for its own mode — it is a structural consequence of switching between two formulations that share no state.
:::

## Shaping the reference at the boundary

The control lesson in this module showed one defense against this step: a well-chosen anti-windup scheme that *recovers* cleanly once the actuator saturates. The mode manager can do better than recover — it can reduce how often the actuator saturates at all, by not handing control the full step in one instant. Rate-limiting the *reference* itself at the mode boundary — ramping the commanded attitude from coast mode's held value toward landing guidance's first solution at a bounded rate, rather than jumping straight to it — is a mode-manager responsibility, sitting upstream of the control loop entirely, and it changes the outcome sharply.

::: example How much shaping the transition buys, at different rates
Ramping the commanded reference toward the $15.12^\circ$ target at a bounded rate, then handing off to landing mode's ordinary tracking once the ramp completes:

| Shaping rate | Peak gimbal deflection | Naive integrator | Back-calculation |
| --- | --- | --- | --- |
| $4^\circ/\mathrm s$ | $2.7^\circ$ | converges cleanly | converges cleanly |
| $6^\circ/\mathrm s$ | $4.3^\circ$ | converges cleanly | converges cleanly |
| $8^\circ/\mathrm s$ | $5.0^\circ$ (right at the limit) | converges, slowly | converges, slowly |
| $10^\circ/\mathrm s$ | $5.0^\circ$ (saturated) | ends at $+13.8^\circ$ — the wrong side of vertical entirely | recovers, settling in $5.56\,\mathrm s$ |

At $4$ and $6^\circ/\mathrm s$ the actuator never reaches its $5^\circ$ limit at all, and the choice of anti-windup scheme stops mattering, because there is no saturation left for it to manage. At $10^\circ/\mathrm s$ — still well inside the gimbal's own $12^\circ/\mathrm s$ *rate* limit, so this is not an actuator specification failure — the naive integrator fails outright, ending up pointed to the far side of vertical from where it started, while back-calculation still recovers. Shaping the reference and choosing a good anti-windup scheme are not competing fixes for the same problem; they are two layers of the same defense, and the table shows exactly where the first layer alone is enough and where the second layer is the only thing standing between a clean transition and a genuine failure.
:::

::: warning A shaped reference is a mode-manager decision, not a control-loop afterthought
It is tempting to treat reference shaping as one more control-loop tuning knob, added wherever a control engineer happens to notice the saturation. It belongs in the mode manager specifically, because *only* the mode manager knows a transition is about to happen — the control loop, receiving whatever reference it is handed each cycle, has no way to distinguish "guidance's ordinary re-solve moved the target a little" from "the mode just changed and the reference just jumped." Putting the shaping logic at the boundary, where the transition is actually detected, is what makes it apply exactly when it is needed and nowhere else.
:::

::: warning Bumpless transfer for a gain change is not the same problem as bumpless transfer for a guidance-law change
The classical-control module's bumpless-transfer machinery — initializing an incoming controller's integrator so its output matches the outgoing controller's, $I(t_0)=u_{\text{current}}-K_pe(t_0)+K_d\dot y_f(t_0)$ — solves a real and related problem, continuity of the *controller's* command across a gain change. It does not, by itself, solve this lesson's problem, because the discontinuity here starts one level upstream, in the *reference* two entirely different guidance laws hand the controller, before either controller's own integrator logic ever runs. Both mechanisms are worth having; neither substitutes for the other.
:::

## Check yourself

::: check
Explain why the transition into safe mode is described as "unconditional" while every other mode's exit condition in this lesson's table is a specific, expected trigger.
:::

::: answer
Every other transition fires from a known cause at a roughly known point in the mission — a cutoff signal, a confirmed separation — and needs to be reachable only from the one or two modes that actually precede it. Safe mode has to be reachable from *any* mode, at any point, because a fault can occur at any point in the mission and the response cannot depend on which mode happened to be active when it did; a mode manager whose transition-to-safe logic silently assumed it would only ever be entered from one particular mode has left every other mode's fault response untested.
:::

::: check
The coast-to-landing transition in this lesson's example is described as "not a bug in either guidance law." Explain what makes the discontinuity a structural consequence of the mode change rather than an error in coast mode's or landing mode's own logic.
:::

::: answer
Coast mode's attitude hold and landing mode's convex re-solve are each correct, verified solutions to their own separate problems — one holds a fixed attitude, the other optimizes a trajectory from the current state to the touchdown target — and neither was ever designed with any obligation to agree with the other at a boundary neither of them models. The discontinuity exists because nothing in either law's own formulation constrains it to hand off smoothly to a different law solving a different problem; fixing it requires something *outside* both laws, at the boundary between them, which is exactly the mode manager's job and not a defect in either law being replaced.
:::

::: check
At a shaping rate of $8^\circ/\mathrm s$, this lesson's table shows the peak gimbal deflection reaching exactly the $5^\circ$ limit. Why is this rate a more informative test case than either $4^\circ/\mathrm s$ (comfortably under) or $10^\circ/\mathrm s$ (clearly over)?
:::

::: answer
A rate that lands the peak deflection almost exactly at the actuator's limit is the boundary case that tells a designer how much margin the chosen shaping rate actually has — $4^\circ/\mathrm s$ demonstrates the fix works but not how close to failing a faster, still-plausible rate would come, and $10^\circ/\mathrm s$ demonstrates failure but not how close to the edge of success it sits. The $8^\circ/\mathrm s$ case shows the transition still recovering while offering the least room for a dispersion — a slightly heavier vehicle, a slightly larger reorientation — to push it over into the failure the $10^\circ/\mathrm s$ case shows outright, which is exactly the case a verification campaign should treat as the one worth the most scrutiny.
:::

::: check
A colleague argues the $10^\circ/\mathrm s$ failure case does not matter, because $10^\circ/\mathrm s$ is well inside the actuator's own $12^\circ/\mathrm s$ rate limit and therefore represents a command the hardware can technically execute. What is wrong with using actuator rate-limit compliance alone as the safety criterion?
:::

::: answer
The actuator successfully tracking its own commanded rate says nothing about whether the *closed loop* built around that actuator converges to the intended attitude — the naive-integrator failure at $10^\circ/\mathrm s$ is not a case where the gimbal failed to keep up with its own rate limit, it is a case where the gimbal *did* saturate at its position limit for long enough that the integrator wound up and drove the vehicle past the target entirely. A criterion checked only against the actuator's own rate specification would have called this case safe, exactly because it is answering a question about the actuator in isolation rather than about the behavior of the whole loop the actuator sits inside.
:::

::: check
Propose why the mode manager, rather than guidance itself, is the right place to decide how fast to ramp the reference during a mode transition, given that guidance is the module that computed the $15.12^\circ$ target in the first place.
:::

::: answer
Guidance's convex re-solve has no model of the actuator's rate or position limits at all — its output is a target the translational optimization considers achievable instantly, by construction — so guidance has no basis on which to choose a shaping rate that respects the vehicle's actual physical limits. The mode manager, by contrast, is the module that already has to know when a mode transition is occurring and can be given the actuator's real limits directly, making it the natural place to insert a rate-limited path from the old reference to the new one without requiring guidance's own optimization to be rebuilt around a constraint it was never designed to carry.
:::

## Summary

| Item | Statement |
| --- | --- |
| Seven modes | prelaunch, ascent, staging, coast, entry, landing, safe — each with its own active guidance and control law |
| Safe mode | Reachable unconditionally, from any other mode, at any time — the one transition every mode must support |
| The coast/entry $\to$ landing boundary | Two guidance laws solving unrelated problems; nothing forces continuity of the commanded reference between them |
| Measured discontinuity | $0^\circ$ (coast hold) to $15.12^\circ$ (landing guidance's first solve) — a step, not a refinement |
| Reference shaping | Ramping the commanded reference at the boundary; at $\le6^\circ/\mathrm s$ here the actuator never saturates at all |
| Layered defense | Shaping (mode manager) reduces saturation frequency; anti-windup (control) recovers from what remains; at $10^\circ/\mathrm s$ only the second layer prevents outright failure |
| Bumpless transfer's limit | Solves controller-integrator continuity across a gain change; does not by itself solve reference continuity across a guidance-law change |

Mode management decides when the vehicle is exposed to a discontinuity like this one; the next lesson takes up the module that has to notice when something has actually gone wrong — the residual monitors, sensor cross-checks and actuator-health logic that decide whether the active mode is still the right one to be in.
