---
id: l03-falcon-reuse-and-the-software-split
title: "Falcon: reuse, and why one title became two"
minutes: 18
covers:
  - "GNC Engineer and Sr. GNC Software Engineer (Falcon): booster entry, descent and landing, and reuse"
---

Falcon sits at the opposite end of a spectrum from the family the previous lesson covered. Where Starship is a new vehicle whose GNC organization still fits a wide scope under one job title, Falcon is a mature, high-flight-rate booster-recovery program with enough flight history and enough division of labor behind it that the posting language itself has split into two distinct titles: GNC Engineer, and Sr. GNC Software Engineer. That split is worth taking seriously rather than reading past, because it is a real answer to a question the previous lesson raised in the abstract — who derives a control law, and who owns turning it into flight code — made concrete as two different jobs you can actually apply to.

The other thing reuse changes is less about the org chart and more about the evidence a GNC engineer gets to work with. A booster that lands, gets inspected, and flies again generates real flight telemetry against which every model, every guidance parameter, and every actuator characterization can be checked and refined — a feedback loop that a vehicle flown once, or a handful of times, does not get to run nearly as often. This lesson covers what the entry-descent-landing problem looks like on a mature, iterated program, what actually separates the two titles, and what reuse specifically adds to the job.

## Booster entry, descent, and landing, sharpened by iteration

The shape of the problem is close to the second and third phases the previous lesson covered on Starship: a boostback burn reverses the booster's horizontal velocity to bring it back toward a landing site, an entry burn slows the vehicle as it reenters the denser atmosphere, aerodynamic control through this phase is handled largely by grid fins rather than body flaps, and a final landing burn brings the vehicle down onto a landing zone or, more often, a droneship positioned at sea. Grid fins behave, at the level that matters here, the way the previous lesson's flaps did: their authority depends on dynamic pressure, so it falls as the vehicle decelerates, and the control law has to keep reasoning about how much authority is actually available rather than treating the actuator as a fixed-strength effector throughout the phase.

What is different from Starship is the target itself. A droneship is not a fixed point on the ground; it is a moving platform, positioned by GPS, subject to sea state, and the guidance problem has to converge the booster onto a target whose own position carries its own uncertainty, in the last phase of a burn where propellant margin is thin and there is no second attempt. This is a genuinely distinct flavor of precision landing from a fixed-pad problem, and it is one of the places where this family's guidance work earns its own attention rather than being read as "the same landing problem as anywhere else."

::: key
GNC Engineer (Falcon) — core focus: booster entry, descent and landing, and everything that makes reuse work — boostback and entry burns, grid fin control, and landing accuracy on a moving droneship.
:::

## Why one title became two

The distinction the previous lesson drew in the abstract — deriving a control or guidance law versus turning that derivation into software that runs correctly and on time — is not always split into two separate job titles. On Starship, both kinds of work sit inside variants of the same GNC Engineer title, differentiated informally by how a given engineer's week actually leans. On Falcon, the posting language makes the split explicit: a GNC Engineer role and a Sr. GNC Software Engineer role, named separately, and worth understanding as genuinely different jobs rather than two names for the same one.

A GNC Engineer on this program spends more of the week in the algorithm and analysis side of the work covered above: deriving or refining a guidance law, running it against dispersion campaigns, and reviewing landing performance. A Sr. GNC Software Engineer spends more of the week owning the health of the flight software that those algorithms have to live inside — integrating a derived change into the deployable codebase, keeping it deterministic and within its timing budget on the real flight computer, maintaining the automated test suite that catches a regression before it reaches a vehicle, and reviewing other engineers' code changes for correctness and for the kind of subtle real-time bug that a working-but-slow implementation can hide. Both roles sit inside the same family and the same program; the "Sr." in the second title signals that it is generally reached with real production software experience behind it, not that the algorithmic role is somehow junior by comparison.

::: warning A named split at one company is not a rule for the industry
Falcon's explicit GNC Engineer / Sr. GNC Software Engineer split is a real, structural fact about how this program currently organizes its work, and it is worth reading a Falcon posting's title carefully because of it. It is not evidence that every GNC organization draws this same boundary, or draws it the same way. Some programs — Starship's own postings among them — fold both kinds of work under one title; others might split the work along an entirely different line, such as verification versus implementation rather than algorithm versus software. Read each employer's own titles and responsibilities paragraph rather than assuming this specific split travels.
:::

## What reuse actually adds to the job

A vehicle that only ever flies once produces, at most, one real data point against which a model can be checked; nearly everything a GNC engineer on such a program knows about how well a design will perform comes from simulation and ground testing. A vehicle that lands, is inspected, and flies again — repeatedly, across a growing fleet of boosters — produces something a new program does not have: an accumulating record of real flight telemetry that can be checked against the model's predictions, flight after flight, in a way that steadily tightens the gap between what the simulation says and what the vehicle actually does.

This changes what "done" means for a guidance or control change on this family. On a program with limited flight history, a design is judged almost entirely against simulated dispersion, because that is the evidence that exists. On a mature, reused vehicle, a design is judged against simulated dispersion and against a real, growing record of landing performance — and a proposed change has to be consistent with that record, or explain convincingly why a departure from past performance is expected and acceptable. Every landing, successful or not, also triggers its own review: inspection of the recovered hardware, comparison of telemetry against prediction, and — for anything that deviated from expectation, however small — an investigation into why, before the next flight. That investigation is a real, recurring piece of this family's work, not an occasional event, and it is one of the clearest places the "supporting launch and on-orbit operations" clause from the org description shows up concretely: engineers from this family are often the ones on console watching a landing happen live, and the ones writing the follow-up analysis afterward regardless of how it went.

::: example Two Tuesdays inside one family
A GNC Engineer spends the morning updating a landing guidance parameter set against a batch of telemetry from the last several flights, checking whether the update improves predicted touchdown accuracy without degrading margin in any of the dispersion cases that matter most, and spends the afternoon in a design review defending the update to two engineers who were not involved in deriving it.

A Sr. GNC Software Engineer on the same program spends the same day differently: a timing regression appeared in the flight software's guidance cycle after that same algorithm update was merged, and tracking it down means profiling the guidance module, finding an inefficient matrix operation introduced by the new logic, rewriting it to meet the cycle-time budget without changing its numerical result, and adding a regression test to the continuous-integration suite so the same class of regression cannot slip through silently again. Both days are Falcon GNC work, produced by the same underlying algorithm change, and neither engineer's day looks like the other's.
:::

::: example A small landing deviation, investigated like the real record it is
Consider a landing where telemetry shows touchdown roughly fifteen meters from the intended point on the droneship — inside the pad's safe margin, but larger than recent flights have shown. Because this program has a real flight history to compare against, the deviation is not dismissed as ordinary dispersion without being checked: the telemetry is compared against the guidance law's prediction for that specific flight's actual wind and sea-state conditions, and against the pattern of recent landings, to see whether this is consistent with expected variation or is the leading edge of something worth catching early.

Suppose the investigation traces the deviation to a slightly under-modeled wind-shear effect during the final approach, present in this flight's conditions but not strongly represented in the existing dispersion cases. The fix is not a one-line parameter tweak; it is an update to the wind model used in the dispersion campaign itself, so that future guidance-law changes are tested against a campaign that better reflects what real flights actually encounter. The record from real flights, not only the simulation, is what made this gap visible in the first place — exactly the kind of evidence a program without reuse does not get to accumulate.
:::

## Curriculum links, and an honest note on entry

Both Falcon titles draw on the same physical-modeling base as the previous lesson: Rigid Body Dynamics and Atmospheric Flight & Vehicle Aerodynamics for the vehicle, Entry, Descent & Landing for the phase itself, and Trajectory Optimization together with Convex Optimization for Guidance (Powered Descent) for the guidance derivation, particularly the droneship-targeting problem in the landing burn. From there, the two titles diverge in what they lean on hardest. A GNC Engineer role leans further into Verification, Validation & Monte Carlo Analysis and Classical Feedback Control Design and Nonlinear Control, because deriving and defending a control law is the center of the job. A Sr. GNC Software Engineer role leans further into Real-Time & Embedded Systems, Flight Software Architecture & Fault Tolerance, Modern C++ for Flight and Simulation, and the testing and build-system material in this curriculum's coding track, because owning flight software correctness and timing is the center of that job instead.

Against the six generic categories, this family sits close to where Starship sits — mission design, flight software, and simulation and V&V dominate, with steady rather than spiking hardware-in-the-loop and test demand, since the program is not racing toward a first flight the way a newer one is. Analysis is heavy on both titles, though it looks different in each: dispersion-campaign analysis for the GNC Engineer side, performance and timing analysis for the software side. Navigation and sensors is present but, as with Starship, this family more often consumes a navigation solution than owns the estimator that produces it.

The honest note worth adding is about which door is more reachable from self-study. The GNC Engineer side of this family carries the same difficulty this module already named for Starship — genuine atmospheric-flight and control-theory depth, on a program mature enough that the hiring bar reflects real production experience rather than only promise. The Sr. GNC Software Engineer side is a somewhat different case: it weights real-time software engineering, testing discipline, and flight-code architecture more heavily relative to control theory, which makes it a more reachable target for a candidate whose strongest evidence is production-quality C++ and a real test-and-build discipline rather than a deep aerodynamics background — provided that evidence is genuinely production-grade, not a script that merely runs.

## Check yourself

::: check
Why does Falcon's posting language split into two separate titles — GNC Engineer and Sr. GNC Software Engineer — where Starship's postings fold comparable work under one title?
:::

::: answer
The split reflects how a mature, high-flight-rate program has had the time and the flight history to differentiate the algorithm-and-analysis side of the work from the flight-software-ownership side into two distinct, specialized jobs, rather than one broader role covering both. It is a structural choice about this specific program's organization, not evidence that deriving control laws and shipping flight code are fundamentally different work everywhere — Starship's own postings show the same two kinds of work sitting inside one title instead.
:::

::: check
A booster landing on a droneship is described in this lesson as a genuinely different guidance problem from landing on a fixed pad. Explain why, in terms of what the guidance law actually has to converge onto.
:::

::: answer
A droneship is a moving, GPS-positioned platform subject to sea state, so its own position carries uncertainty that a fixed pad does not have. The guidance law has to converge the booster onto a target whose location is itself imperfectly known, during the final phase of a burn where propellant margin is thin and there is no opportunity to try again — a materially harder targeting problem than converging onto a fixed, precisely surveyed point.
:::

::: check
A candidate has strong evidence of production-quality real-time C++ work — a tested, documented flight-software-style codebase with a real CI pipeline — but comparatively little atmospheric-flight or control-theory background. Which of the two Falcon titles is the stronger target, and why?
:::

::: answer
Sr. GNC Software Engineer is the stronger target. That role weights real-time software engineering, testing discipline, and flight-code architecture more heavily relative to control-theory depth, which matches this candidate's strongest evidence directly. The GNC Engineer title leans harder on deriving and defending control and guidance laws against dispersion campaigns, which is exactly the area this candidate's evidence does not yet cover.
:::

::: check
Both Starship's body flaps and Falcon's grid fins are described as losing control authority over the course of a flight phase. State the shared underlying reason, using the physical quantity both explanations depend on.
:::

::: answer
Both are aerodynamic control surfaces, and aerodynamic control authority scales with dynamic pressure, $q = \tfrac{1}{2}\rho v^{2}$. As either vehicle decelerates through its descent, airspeed falls and dynamic pressure falls with it, so the force and moment either surface can produce for a given deflection shrinks even though the surface itself has not changed — the same physical dependency showing up in two different vehicles' control problems.
:::

::: check
Explain what reuse specifically adds to how a proposed guidance-law change gets evaluated on Falcon, beyond what a program with little flight history would have to work with.
:::

::: answer
On a program with little flight history, a design change is judged mostly against simulated dispersion, because that is the evidence available. On Falcon, a change also has to be consistent with — or explain a well-justified departure from — a real, accumulating record of actual landing performance across many flights. Every landing additionally triggers its own review of recovered hardware and telemetry against prediction, which means the feedback loop this family works inside includes real flight evidence layered on top of simulation, not simulation alone.
:::

## Summary

| Dimension | GNC Engineer (Falcon) | Sr. GNC Software Engineer (Falcon) |
| --- | --- | --- |
| Primary artifact | Guidance/control law derivation, dispersion-campaign results | Flight software implementation, timing and test coverage |
| Reviewed against | Simulated dispersion and real landing-performance record | Code review, timing budget, regression-test suite |
| Curriculum weighted most | Entry Descent & Landing; Convex Optimization for Guidance; Nonlinear Control | Real-Time & Embedded Systems; Flight Software Architecture & Fault Tolerance; Modern C++ |
| Most reachable evidence | A dispersion-tested guidance derivation with a written analysis | A tested, documented real-time codebase with a real CI pipeline |

The next lesson moves from a reusable booster to a human-rated spacecraft: Dragon, where the defining problems are rendezvous, docking, and the abort logic a crewed vehicle cannot fly without.
