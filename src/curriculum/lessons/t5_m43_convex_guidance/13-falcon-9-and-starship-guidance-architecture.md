---
id: l13-falcon9-starship-architecture
title: Where this flies — Falcon 9 and Starship
minutes: 19
covers:
  - How all of this maps onto a Falcon 9 entry burn / aero phase / landing burn architecture, and onto Starship landing
---

Twelve lessons have built one continuous argument: state the non-convex powered-descent problem honestly, remove every non-convexity that can be removed exactly, handle what is left with an iterative method that is honest about its own limits, and never claim a number this module could not compute. This closing lesson does the one thing left undone — lays the architecture over two real vehicles, a Falcon 9 booster and a Starship, and says plainly which parts are public record, which are this module's own reasonable inference, and which are not known outside the companies that fly them.

## A Falcon 9 booster's return, phase by phase

After stage separation, a returning Falcon 9 first stage flies through several distinct phases, each publicly documented in some form through SpaceX's own webcasts and technical presentations, even where the guidance algorithm behind each phase is not. An optional **boostback burn** — used when the booster returns to a landing site near the launch pad rather than a downrange drone ship — reverses much of the stage's downrange velocity. An **entry burn** follows, beginning at roughly $70\,\mathrm{km}$ altitude and ending near $40\,\mathrm{km}$, using a subset of the booster's engines (three, on the standard profile) to shed enough speed that the vehicle survives the dense lower atmosphere without aerodynamic or thermal damage it was never built to take unpowered at that speed. Through the **aerodynamic phase** that follows, the engines are off and grid fins — deployed after the boostback flip — continuously steer the vehicle, trimming the trajectory against wind and dispersion the way a glider's control surfaces would. Finally, at roughly $8\,\mathrm{km}$ altitude, the **landing burn** ignites, typically on the single center engine, and carries the vehicle to a soft touchdown.

Reading this module backward onto that sequence, one phase maps almost exactly onto what this module built in detail, and the others map onto adjacent modules by name rather than by content this module has any business claiming. The landing burn — powered, no significant aerodynamic force, a well-defined target, a genuine minimum-fuel or minimum-landing-error objective — is precisely the problem this module's first half solved: lossless convexification of the thrust bound, the mass-linearising change of variables, glideslope and pointing cones, all the way through G-FOLD's two-stage law. The entry burn shares the powered, thrust-bounded character but adds aerodynamic heating and loading constraints this module never modelled, putting it closer to the territory the trajectory optimization module's general transcription machinery covers. The unpowered aerodynamic phase is not a thrust-bounded optimal-control problem in this module's sense at all — no engine is burning — and belongs to the aerodynamic-flight and entry, descent and landing material by name, not to anything derived here.

::: example Why the landing burn, specifically, is this module's problem
Take the landing burn's own numbers at face value: ignition near $8\,\mathrm{km}$ altitude, touchdown at zero altitude, a vehicle with a mass-flow-limited engine that cannot throttle to zero, and a target pad. That is, without qualification, the minimum-fuel powered-descent problem this module opened with — position and velocity boundary conditions, a thrust magnitude with a nonzero floor, gravity, mass depletion — solved end to end starting with lossless convexification two lessons later. Contrast the aerodynamic phase immediately before it: the grid fins produce force from airspeed and attitude, not from propellant, so there is no thrust bound to relax, no mass to deplete, and nothing for this module's central theorem to say. The boundary between "this module's territory" and "somebody else's" is not a boundary of altitude or of vehicle; it is the boundary of whether an engine consuming propellant against a hard minimum-throttle floor is the thing being optimised.
:::

::: example The angle, not the altitude, is what changes the mathematics
Put a number on "large-angle" against this module's own worked case. The 6-DoF lesson's solved example corrected an initial tilt of $6°$ to $12°$ — small enough that the vehicle starts and ends close to upright the whole time. A belly-flop-to-vertical flip reorients through roughly a right angle, $90°$, the well-documented geometry of falling broadside then standing the vehicle up onto its engines. That is a factor of $90/12=7.5$ to $90/6=15$ times the angular travel this module's own worked run needed — and because the linearisation-error table two lessons earlier showed that error growing quadratically with angular deviation from the reference, a naive single linearisation over a $90°$ span would carry on the order of $7.5^2$ to $15^2$ — roughly $56$ to $225$ times — the linearisation error this module's own modest example already found large enough to reject two candidate steps over. The altitude at which the flip happens is a detail; the angle it spans is why the mathematics of the flip is successive convexification's problem and not lossless convexification's.
:::

## Starship: where the second half of this module earns its keep

A Falcon 9 booster's landing burn is close to upright the whole time, which is why this module's first half — the exactly-convex 3-DoF formulation — maps onto it so directly. Starship's return does not offer that convenience. The vehicle descends through most of its flight in a **belly-flop**: engines off, oriented broadside to the airflow, using a windward surface area many times its base area to hold terminal velocity down the way a skydiver falling flat holds terminal velocity down compared to falling head-first — deliberately trading a controlled, high-drag attitude for propellant saved on the powered phase that follows. At roughly $500\,\mathrm{m}$ altitude, a small number of engines relight and the vehicle executes the **flip**: reorienting through a large attitude change, from belly-first to vertical, while the aerodynamic surfaces that steered the belly-flop retract or fold, handing control over to engine gimbal and, later, canards and flaps for the final approach.

That flip is not a small-angle correction of the kind a single lossless-convexification solve, or even one forgiving SCvx trust region, was built around — it is a reorientation of a large fraction of a full turn, executed with the ground closing fast beneath it. It is, in the vocabulary this module's second half built, exactly the regime successive convexification exists for: a rotation matrix genuinely coupling thrust direction to attitude over a wide angular range, a quaternion kinematics equation that is bilinear everywhere rather than only near some reference, and no exact reformulation on offer the way the thrust bound had one. The 6-DoF lesson's own solve — a vehicle correcting a modest tilt and rate, needing a trust region that had to shrink twice before trusting a step — was a small, honestly-scaled version of the same category of problem a full-attitude flip poses at much larger angles and with far less margin for the loop to fail slowly.

::: key Which half of this module answers which phase
A near-vertical, powered, thrust-bounded descent to a target — a Falcon 9 landing burn, or the final approach of a Starship after its flip — is 3-DoF-convex territory: lossless convexification, exact and checkable, no iteration required. A large-angle reorientation with thrust direction genuinely coupled to attitude — a Starship flip, or any powered phase where the vehicle cannot be treated as always pointing roughly where it is going — is successive-convexification territory: iterative, not globally certified, and only as trustworthy as the virtual-control and trust-region checks this module built lesson by lesson.
:::

::: warning What is documented, and what is this module's own inference
Every specific number in this lesson — entry-burn altitudes, landing-burn ignition height, engine counts, the flip's approximate altitude — comes from public sources: SpaceX's own launch webcasts, technical presentations and reporting on them. None of it is this module's invention, and none of it should be repeated as more precise than the public record actually supports. What *is* this module's own inference, clearly labelled as such, is the mapping from those public phases onto the mathematics: that a near-vertical powered descent is the kind of problem lossless convexification solves exactly, and a large-angle attitude reorientation is the kind successive convexification was built for, is a claim about the *mathematics* of the phases, defensible from the physics of each phase regardless of what any specific company's flight software does. Neither SpaceX nor any other operator of a landing rocket has published the guidance algorithm actually flying today, on either vehicle, and this module has said so before and repeats it here rather than let a closing lesson soften it: the published lineage — Açıkmeşe and Ploen's lossless convexification, G-FOLD's flight demonstration on Xombie, the successive-convexification papers with free final time and state-triggered constraints — is a documented, citable body of work that the field converged on and that this module has derived from scratch. That the people who wrote it went on to work on landing rockets, and that the phase-by-phase mathematics above lines up as cleanly as it does, is the strongest honest statement available, and it stops exactly there.
:::

## The module, looked back on

Four separate honesty checks ran through every lesson of this module, and it is worth naming them once, together, now that all of them have been used repeatedly rather than stated once and assumed. Every relaxation carried a proof of when it loses nothing, not an assertion — the thrust bound's tightness theorem, checked to solver precision on a real trajectory, and the pointing constraint's extension of the same argument, checked the same way with a genuinely binding cone. Every approximation carried a measured error, not a shrug — the mass-bound Taylor expansions, checked node by node against the exact exponential on an actual solved burn. Every iterative method carried an explicit account of what it does not guarantee — successive convexification's total absence of a global-optimality certificate, GuSTO's narrower but real convergence proof, and a real 6-DoF run that rejected two bad steps and caught a small-but-nonzero true-dynamics error behind an accepted one. And every timing or hardware claim was computed, not assumed — flop counts, KKT dimensions, and this module's own teaching solver's very real, very uneven wall-clock times, reported honestly rather than replaced with a flight number nobody in this module measured.

That is what "this is the module a SpaceX landing-guidance interview is actually about" means in practice: not a collection of impressive facts about rockets, but a demonstrated ability to say, of any guidance claim, exactly how much of it is proven, how much is measured, and how much is still an open question — and to never let the three get quietly swapped for each other.

## Check yourself

::: check
A colleague argues that because Starship's flip maneuver is dramatic and Falcon 9's landing burn is comparatively gentle, the flip must require "more advanced" mathematics in some general sense. Restate their claim in terms this module actually supports.
:::

::: answer
The precise, defensible version is narrower than "more advanced": the flip requires successive convexification specifically because it involves a large-angle attitude reorientation with thrust direction genuinely coupled to attitude through a nonlinear rotation, which this module showed has no exact convex reformulation the way the thrust-bound annulus did. A Falcon 9 landing burn is not mathematically simpler in some vague sense — it is exactly convex, solvable with a global-optimality certificate no iterative method provides — which by this module's own certification argument makes it the *more* trustworthy of the two to fly, not the less sophisticated one. "More advanced" is the wrong axis; "does or does not admit an exact convex reformulation" is the one this module actually established.
:::

::: check
Why does this lesson insist that the phase-by-phase mapping is "this module's own inference," rather than presenting it as simply true?
:::

::: answer
Because the mapping is a claim about which category of mathematics *fits* each publicly observed phase, argued from the physics of each phase — powered versus unpowered, small-angle versus large-angle — not a claim about what any vehicle's actual flight software computes. Those are different statements with different evidence behind them, and this module's certification argument throughout has depended on keeping exactly that distinction visible rather than letting a plausible-sounding inference harden into an assertion of fact nobody has verified. The distinction costs nothing to maintain and prevents the lesson from claiming knowledge it does not have.
:::

::: check
Someone reads only this closing lesson and concludes that this module has shown Falcon 9 and Starship "use lossless convexification and SCvx." Point to the specific overreach in that sentence.
:::

::: answer
Two overreaches, stacked. First, it reports a claim about specific flight software as settled fact, when this lesson explicitly said no such software has been published by any operator — the accurate claim is that the published, derivable mathematics this module built maps cleanly onto the phases these vehicles are observed to fly, not that a particular company's code implements it. Second, it treats "Falcon 9 and Starship" as one undifferentiated claim, when the entire point of this lesson's mapping is that the two vehicles' dominant regimes are different — Falcon 9's landing burn sits mostly in exactly-convex territory, Starship's flip sits in genuinely-iterative territory — so even the qualified, honest version of the claim is not the same sentence for both vehicles.
:::

## Summary

| Object | Statement |
| --- | --- |
| Falcon 9 phases | Boostback (optional) $\to$ entry burn ($\sim70$ to $\sim40\,\mathrm{km}$, subset of engines) $\to$ aerodynamic phase (grid fins, unpowered) $\to$ landing burn ($\sim8\,\mathrm{km}$, typically center engine) |
| This module's territory | The landing burn: powered, thrust-bounded, near-vertical — lossless convexification's exact regime |
| Not this module's territory | Entry-burn aeroheating/loading (trajectory optimization's territory); the unpowered aero phase (no thrust bound at all) |
| Starship's descent | Belly-flop (unpowered, high-drag, broadside) $\to$ flip at $\sim500\,\mathrm{m}$ (large-angle reorientation, engines relight) $\to$ powered vertical approach |
| Why the flip needs SCvx | Large-angle attitude change, thrust-direction-to-attitude coupling with no exact convex reformulation — this module's second-half territory |
| What is public | Phase altitudes and engine counts, from company webcasts and reporting; the academic lineage (Açıkmeşe, Ploen, Blackmore, Szmuk and others) and its flight demonstration on Xombie |
| What is not public | Any specific company's actual onboard guidance algorithm, on either vehicle |
| The module's four honesty checks | Relaxations proved tight, not assumed; approximations measured, not shrugged off; iterative methods' limits stated explicitly; every timing claim computed, never assumed |

This module began by asking why a convex reformulation of powered descent is worth the trouble a general nonlinear solver would spare. Twelve lessons of exact theorems, measured approximations, a real 6-DoF solve and its honest failures later, the answer is the one the first lesson promised and every lesson after it paid for in actual numbers: not that convex optimization is elegant, but that it is the one formulation of this problem a flight computer can be certified against before it ever sees the sky it has to land in.
