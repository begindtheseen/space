---
id: l02-starship-ascent-entry-and-landing
title: "Starship: ascent, entry, and landing control"
minutes: 20
covers:
  - "GNC Engineer (Starship): ascent, entry and landing control, 6-DOF simulation, flight control of the largest vehicle ever flown"
---

Starship is, by stated design intent, the largest vehicle SpaceX has ever flown, and size is not a detail that stays out of the control problem. A bigger vehicle bends more under its own thrust and aerodynamic load, its structural modes sit closer to the frequencies a control loop cares about, its actuators move more mass and fluid to produce the same angular acceleration, and the margin between "the control law works" and "the control law excites a structural mode it was never told about" gets thinner rather than wider. GNC Engineer postings on this program describe a job built around three flight phases — ascent, entry, and landing — and single out entry and the landing flip specifically as the distinguishing control problems, which is worth taking at face value: those two phases are where this vehicle's control problem looks least like anything a smaller, more conventional rocket has to solve.

This lesson takes that posting language and grounds it: what each phase actually demands of a control law, what an engineer in this seat produces in an ordinary week, and what curriculum this curriculum's own modules exist to prepare you for it. It closes with an honest assessment of how hard this particular family is to break into from self-study alone, because it is one of the harder ones, and pretending otherwise would not help you.

## Three phases, three different control problems

**Ascent** is the most conventional of the three, in the sense that every orbital launch vehicle has to solve some version of it: get the vehicle off the pad, fly it through the region of highest dynamic pressure and worst structural loading without exceeding angle-of-attack and bending-moment limits, stage cleanly, and keep control authority through an engine-out case if one occurs. It is a real control problem, worth respecting, but it is the one with the deepest body of prior art behind it — the family of techniques that gets built in this curriculum's ascent and orbital-insertion guidance work applies here close to directly.

**Entry** is where Starship's job separates from most of what came before it. Instead of a ballistic or lightly-guided reentry, the vehicle flies a controlled, aerodynamically-lifting descent — often described publicly as a "belly-flop" — using body flaps as the primary control surfaces to manage angle of attack, bank, and the lift-to-drag ratio that trades range against deceleration and heating. This is genuinely nonlinear, genuinely coupled aerodynamic control, in a flight regime — hypersonic through transonic — where the vehicle's own aerodynamic characteristics change enormously over the phase, and where a model built purely in one flight regime does not extend safely into another.

**Landing** starts with the flip: rotating the vehicle from its high-drag, close-to-horizontal entry attitude to vertical, in the last tens of seconds before touchdown, then completing a powered landing burn on relit engines. The flip is a genuinely hard control-allocation problem, covered on its own below, and the landing burn itself demands the same kind of precision powered-descent guidance that this curriculum's convex-optimization guidance work is built around, adapted to a vehicle with a different mass, different plume interaction with the ground, and a different structural response than the boosters that pioneered the technique.

::: key
GNC Engineer (Starship): ascent, entry and landing control, 6-DOF simulation, and flight control of the largest vehicle ever flown. Entry and the landing flip are what SpaceX's own postings single out as the distinguishing control problems on this program.
:::

## The flip, as a control-allocation problem worth understanding in full

The flip deserves a closer look than "the vehicle rotates," because it is a clean example of a problem type — control allocation across actuators whose authority is changing in opposite directions at the same time — that shows up, in different clothes, across a good deal of atmospheric flight control.

During entry, the vehicle's body flaps are the dominant control effectors, and their authority depends on dynamic pressure, $q = \tfrac{1}{2}\rho v^{2}$, where $\rho$ is atmospheric density and $v$ is airspeed. As the vehicle decelerates through the lower atmosphere, $v$ drops sharply, and with it $q$ — which means the flaps are losing control authority at exactly the point in the trajectory where the vehicle needs to execute its most aggressive attitude change of the entire flight. The engines, by contrast, have essentially no useful control authority until they light for the landing burn, at which point they become the dominant — eventually the only — effector. A control law for this phase is not choosing between two actuators; it is managing a handoff between two actuators whose authority curves cross each other, timed against a rotation that has to complete, and a burn that has to start, inside a narrow altitude and velocity window with very little room to wait and see.

Get the timing wrong in one direction — flip too early, while the flaps still have authority to lose and the burn is not yet needed — and the vehicle bleeds altitude it cannot recover. Get it wrong in the other direction — flip too late — and the vehicle runs out of authority and altitude at the same time, with no effector strong enough yet to arrest the situation. The control law has to reason about both actuators' authority as a function of the trajectory itself, not as a fixed property of the vehicle, which is exactly the kind of nonlinear, trajectory-coupled control problem this curriculum's nonlinear-control and powered-descent-guidance modules are built to prepare you to reason about correctly rather than by intuition alone.

::: warning Entry aerodynamics do not transfer from a subsonic control course
A control law tuned against a linearized, subsonic aerodynamic model will not tell you anything trustworthy about hypersonic or transonic entry behavior, where the aerodynamic coefficients themselves are strong, nonlinear functions of Mach number and angle of attack. Treat entry as its own regime with its own aerodynamic database, not as "the same control problem, only faster."
:::

## A week in this seat, and what it produces

An engineer in this family spends real time in a handful of recurring activities, not one uniform task. A guidance-law parameter gets adjusted in response to a Monte Carlo campaign that turned up a tail-case failure — a small fraction of dispersed cases, varying atmospheric density, sensor noise, and actuator response together, that missed a landing accuracy or structural-margin criterion — and the fix has to be re-derived, re-implemented, and re-run against the full campaign before anyone trusts it. A divergence shows up in a six-degree-of-freedom simulation regression run after an unrelated model update, and tracking it down means separating "the vehicle model changed underneath the control law" from "the control law has an actual bug," which is its own kind of debugging discipline. A design memo has to justify, in writing, why a flap deflection limit is being changed, in language precise enough that a reviewer who was not in the room can evaluate the argument on its own terms. A flight readiness review needs a chart that states, honestly, what has and has not been verified, and at what confidence. And during an actual test flight, someone from this family is very often on console, watching telemetry against prediction in real time, prepared to say something useful if the two start to disagree.

What gets reviewed, and what "done" looks like, follows a consistent shape across all of this: a design is not done because it flies in one simulation run, it is done when it survives a dispersion campaign at a stated success threshold, passes review by engineers who did not write it, and — after an actual flight — its prediction is checked against real telemetry in a post-flight reconstruction. A mismatch there is not a failure to hide; it is the next analysis task, and closing that gap is exactly how the simulation and the real vehicle converge over successive flights.

::: example A tail-case failure, followed end to end
A Monte Carlo campaign of several thousand dispersed entry cases — varying atmospheric density profile, initial attitude error, and flap actuator response together — comes back with a 98 percent success rate against the stated landing-accuracy criterion. The remaining 2 percent cluster around cases with unusually low atmospheric density combined with a slow flap actuator response near the start of the flip.

The engineer who owns this control law does not treat 98 percent as good enough on its own; the campaign's job is to find exactly this kind of clustering, because a clustered failure mode is a real, findable cause, unlike failures scattered uniformly across the dispersion space. Tracing the cluster back points to the flip's timing logic being tuned around a nominal actuator response that does not hold in the slow-actuator tail. A revised timing law — one that reasons about flap authority directly rather than assuming a fixed schedule — gets derived, implemented in the simulation, and run against the same campaign. The fix is reviewed by another engineer on the team, who checks the derivation and the code independently, and only once the full campaign clears the threshold with the clustering gone does the change move toward flight software integration and, eventually, a flight readiness review. Nothing here was fixed by re-running the same case that failed; it was fixed by understanding why a whole cluster failed and changing the logic that caused it.
:::

::: example Two engineers, two different Tuesdays, same family
One engineer on this team spends the morning in a derivation — reworking the entry guidance law's angle-of-attack command as a function of dynamic pressure and range-to-go — and the afternoon defending that derivation in a design review, on a whiteboard, to two engineers who were not involved in writing it. Another engineer on the same team spends the same day almost entirely in flight software: profiling why a guidance update is taking longer than its allotted cycle time on the flight computer, and rewriting the offending function to meet its real-time budget without changing its numerical output. Both are doing Starship GNC work. Neither would describe their day the same way, which is exactly why a single phrase like "I want to do GNC" undersells what is actually being asked of you inside even one family.
:::

## Where this pulls from the curriculum

Ascent and entry dynamics draw on Rigid Body Dynamics and Atmospheric Flight & Vehicle Aerodynamics for the vehicle model itself, and on Entry, Descent & Landing directly for the phase this lesson has spent the most time on. Guidance derivation draws on Trajectory Optimization and, for the powered-descent segment of the landing burn, Convex Optimization for Guidance (Powered Descent). The flip's changing-authority control-allocation problem is squarely inside Nonlinear Control. The standing simulation infrastructure this whole family depends on is 6-DOF Simulation Architecture, and the campaigns run against it are Verification, Validation & Monte Carlo Analysis. Turning a derived law into code that meets a real-time budget draws on Real-Time & Embedded Systems, Flight Software Architecture & Fault Tolerance, and Modern C++ for Flight and Simulation.

Against the six generic categories from the previous lesson, this family sits heavily in mission design, flight software, and simulation and V&V, with hardware-in-the-loop and test weight rising sharply as an actual flight approaches. Analysis runs through nearly everything it does. Navigation and sensors is present but usually not owned here outright — this family consumes a navigation solution to fly its guidance law more often than it derives that solution itself, and exactly where that boundary is drawn is one of the places practice varies by team and by employer rather than following one fixed rule.

## An honest word on how hard this family is to break into

This is one of the two or three hardest families in this module to reach real interview readiness for through self-study alone, and it is worth saying why rather than leaving you to find out the hard way. It asks for two different kinds of depth at once — genuine nonlinear and atmospheric-flight-dynamics theory, and genuine production-quality real-time software skill — where most self-taught paths develop one and neglect the other. A good deal of what separates a strong candidate from a merely enthusiastic one is also tacit: a feel for which failure modes are boring and which are dangerous, built from watching real dispersion campaigns and real flight anomalies, which is hard to replicate outside a job that has actual flights to learn from.

None of that makes the family closed to you. It changes what counts as convincing evidence. A toy PID controller on a simulated pendulum does not reach this bar. A real six-degree-of-freedom entry-and-landing simulation, built by you, with an honest dispersion campaign and a design memo that reads like the ones described above, does — not because it is the same scale as the real vehicle, but because it demonstrates the same discipline: derive, implement, test against dispersion, write down what you found. That is a project measured in months, not a weekend, and this curriculum's later modules are built to get you there.

## Check yourself

::: check
Name the three flight phases this lesson organizes Starship GNC work around, and state in one sentence what makes entry different in kind, not only in difficulty, from ascent.
:::

::: answer
Ascent, entry, and landing. Ascent is the most conventional of the three — ordinary powered flight through a well-understood load environment, with deep prior art from other launch vehicles. Entry is different in kind because the vehicle flies a controlled, aerodynamically-lifting descent through a hypersonic-to-transonic regime where its own aerodynamic behavior changes enormously across the phase, using body flaps rather than propulsion as the primary control effector — a fundamentally different actuation and dynamics problem, not merely a faster version of ascent.
:::

::: check
Explain why the landing flip is specifically a control-allocation problem, and not merely "a rotation the vehicle has to perform."
:::

::: answer
The flip has to hand off authority between two actuator sets whose effectiveness moves in opposite directions across the same window: body flaps, whose authority depends on dynamic pressure and falls as the vehicle decelerates, and engines, which have essentially no authority until they light for the landing burn and then become dominant. The control law has to allocate the rotation across actuators whose authority is a function of the trajectory itself rather than a fixed property of the vehicle, and get the timing right against both a shrinking window of flap authority and an altitude budget that does not forgive waiting too long to commit to the burn. That coupling between changing actuator authority and trajectory timing is what makes it a control-allocation problem rather than a plain kinematic rotation.
:::

::: check
A Monte Carlo dispersion campaign for an entry guidance law returns a 97 percent success rate, with the 3 percent of failures scattered with no evident pattern across the dispersion space, rather than clustered. Is this a case the engineer should treat the same way as a clustered failure, and why or why not?
:::

::: answer
Not the same way. A clustered failure, tied to a specific combination of dispersed parameters, usually points to a findable cause — a piece of logic that behaves badly under a specific condition — that can be diagnosed and fixed, the way the tail-case example in this lesson was traced to slow flap actuator response. Failures scattered with no pattern are more likely to reflect the genuine statistical tail of an otherwise sound design, or possibly a modeling issue in the campaign itself, and chasing them as though they shared one root cause can waste real effort. The first step either way is establishing whether a pattern actually exists, not assuming one and going looking for it.
:::

::: check
Name at least four of this curriculum's modules that a Starship GNC engineer's work draws on directly, and state which flight phase or activity each one supports.
:::

::: answer
Entry, Descent & Landing supports the entry phase's aerodynamic control directly. Convex Optimization for Guidance (Powered Descent) supports the landing burn's guidance derivation. Nonlinear Control supports the flip's changing-authority control-allocation problem. 6-DOF Simulation Architecture supports the standing simulation infrastructure every phase is tested against. Real-Time & Embedded Systems and Flight Software Architecture & Fault Tolerance support turning any of these derived laws into flight code that meets its timing budget. Any four of these, correctly matched to the activity they support, answers the question.
:::

::: check
This lesson calls Starship GNC one of the harder families to reach interview readiness for through self-study. Give the two specific reasons it names, and describe what a self-study project needs to look like to actually address them.
:::

::: answer
The two reasons are that the family demands genuine depth in two different areas at once — nonlinear, atmospheric-flight-dynamics theory and production-quality real-time software — which most self-taught paths develop unevenly, and that some of what distinguishes a strong candidate is tacit judgment about failure modes, built from real dispersion campaigns and real flight anomalies that are hard to reproduce outside an actual flight program. A project that addresses this is not a toy single-axis controller; it is a real six-degree-of-freedom entry-and-landing simulation, built end to end, run through an honest Monte Carlo dispersion campaign, and written up the way a design memo would be — because that sequence, more than the scale of the vehicle modeled, is what the evidence is actually supposed to demonstrate.
:::

## Summary

| Phase | Core control problem | Dominant actuator | Curriculum module most directly tested |
| --- | --- | --- | --- |
| Ascent | Stay within structural and angle-of-attack limits through max dynamic pressure; handle staging and engine-out | Engine gimbal / throttle | Ascent & Orbital Insertion Guidance |
| Entry | Manage angle of attack, bank, and lift-to-drag through a hypersonic-to-transonic aerodynamic regime | Body flaps | Entry, Descent & Landing |
| Flip and landing | Hand off control authority between falling-authority flaps and rising-authority engines; fly a precision powered-descent burn | Flaps, then engine gimbal / throttle | Nonlinear Control; Convex Optimization for Guidance (Powered Descent) |

The next lesson stays inside the vehicle-family group but moves to a program with a very different character: Falcon, where the control problem is a mature, high-flight-rate version of entry and landing, and where the job itself splits explicitly into an algorithm-focused role and a flight-software-focused one.
