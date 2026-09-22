---
id: l10-choosing-a-family-and-proving-it
title: "Choosing a family, and proving you belong in it"
minutes: 21
covers:
  - how family choice changes what you must be able to demonstrate
---

Nine lessons back, "I want to work in GNC" was shown to mean almost nothing on its own. Since then, this module has walked through vehicle families that fly a single machine through a single flight, constellation families that keep thousands of satellites correctly pointed for years, and infrastructure families that build the tools everything else runs on — each with its own artifacts, its own review process, and its own corner of this curriculum it leans on hardest. None of that is useful yet if it stays as nine separate stories in your head. This lesson's job is to turn it into two things you can actually use: an honest way to read your own projects against a specific family's real evidence bar, and a method for turning a vague statement of interest into one that names a program, a problem, and the proof you have already built.

This lesson introduces no tenth family. Its job is integration, not addition — pulling together, in one place, the honest answer to which families are harder to reach from self-study and which are more open, so that answer exists as one clear statement rather than something you would otherwise have to reconstruct from nine separate asides.

## The six categories, now as a map instead of a list

Lesson one introduced six kinds of work — analysis, flight software, simulation and V&V, hardware-in-the-loop and test, navigation and sensors, and mission design — as the vocabulary that recurs under any employer's naming. Every family since has been tagged against it, and laid side by side, a real pattern falls out: the families are not scattered randomly across "software skill" and "domain theory," they sit on something close to a genuine spectrum. Software Engineer, GNC, Operations Automation, and Site Reliability Engineer, GNC sit at the software-heaviest end, weighting engineering infrastructure far above control or estimation theory. Navigation and State Estimation sits at close to the opposite end, weighting estimation-theoretic depth heavily enough that postings for it, more than most other families, list an advanced degree as a basic requirement. The vehicle families — Starship, Falcon, Dragon, and the newer Starfall — sit somewhere in the middle but pull toward the domain-theory end, demanding real dynamics and control depth alongside real software skill rather than trading one for the other. ADCS, Embedded Controls, and Beam Pointing sit in their own middle ground, each asking for genuine but different domain grounding — three-dimensional attitude kinematics, classical control and firmware, or geometry and link budgets, respectively — without the same estimation-theory depth Navigation and State Estimation demands.

Knowing where a family sits on this spectrum is not trivia. It tells you, directly, what kind of evidence is going to move a reviewer for that specific family and what kind will not — which is exactly the next skill this lesson builds.

## Reading your own projects honestly

A project is not one undifferentiated "good evidence" or "bad evidence" in the abstract. It is evidence for a specific family, and the same project can be strong evidence for one and say nothing at all for another. Sorting a project into direct evidence, weak evidence, or no evidence for a given family means asking one question precisely: did building this project require solving substantially the same kind of problem, with substantially the same technical machinery, that this family's real artifacts require?

**Direct evidence** means yes — the project required the same machinery the job requires, even at smaller scale. A closed-loop, quaternion-based three-axis attitude simulator with real reaction-wheel momentum tracking is direct evidence for ADCS, because it required exactly the three-dimensional attitude kinematics and momentum-management reasoning that family's real work runs on. **Weak evidence** means the project touches the right neighborhood but skips the part that actually makes the real job hard — a single-axis PID demo on a simulated cart is a real control-systems exercise, but it skips three-dimensional attitude kinematics, coupled-axis dynamics, and momentum management entirely, so it supports a claim of general control-theory literacy without supporting a specific claim about ADCS readiness. **No evidence** means the project is a different kind of problem altogether relative to this family, however well it was executed — and this is the case worth taking most seriously, because a project can be no evidence for one family while being direct evidence for another, which is not a contradiction, it is the entire point of this module.

::: example One project, two very different verdicts
A candidate built a Monte Carlo simulation for a statistics course, modeling a portfolio's risk under randomly sampled market scenarios, with clean, well-tested, vectorized code and a report presenting a clear distribution of outcomes. Evaluated against Navigation and State Estimation, this is close to no evidence: nothing in it touches sensor fusion, filtering, or orbit dynamics, and a reviewer for that family would learn nothing from it about the candidate's estimation-theory depth. Evaluated against Software Engineer, GNC or Site Reliability Engineer, GNC, the same project is a meaningfully different case — the statistical reasoning is a different domain, but the vectorized simulation code, the testing discipline, and the clear reporting of a large sampled campaign are close to the actual shape of that family's real work, making it reasonably strong, if not perfectly direct, evidence.

A second candidate built a tool that takes a satellite's quaternion attitude history and renders it as a smooth three-dimensional animation, with correct kinematics and no control loop at all — nothing decides what the satellite should do, it only visualizes what it is told to do. Evaluated against ADCS, this is weak evidence at best: it proves real fluency with quaternion kinematics, which matters, but it skips the control and momentum-management problem entirely, which is the part of the job the family is actually built around. The same project, evaluated against a role that specifically needs someone who can build clear analysis and visualization tooling — the software and infrastructure families from two lessons back — moves closer to direct evidence instead.
:::

::: warning "I have a portfolio" is not the same claim as "I have evidence for this family"
A portfolio is not one asset with one value. It is a set of separate claims, each of which is strong for some families and silent for others. Before an interview, or before choosing which family to target in the first place, sort your own projects the way the example above did — honestly, family by family — rather than treating "I have built things" as a single, undifferentiated credential.
:::

## From "I want to do GNC" to a sentence someone can evaluate

A recruiter, a hiring manager, or an interviewer cannot act on "I want to work in GNC" in any useful way — it does not tell them which team to route you to, and it does not give them anything specific to test. A useful statement of interest has four parts: a program or type of program, the flight phase or subsystem within it, the specific technical problem inside that phase, and the piece of evidence that backs up your claim to have already engaged with it seriously.

::: key
"I want to do GNC" is indistinguishable from what every other applicant says, and an interviewer cannot evaluate it. A sentence that names a program, a flight phase or subsystem, a specific technical problem, and a piece of evidence you actually built is a claim an interviewer can test — which is the entire reason family choice changes what you must be able to demonstrate.
:::

Consider how this transforms a real interest. "I want to work on satellites" becomes, worked through the four parts: the program is a constellation, not a single vehicle; the subsystem is attitude control specifically, not navigation or pointing; the technical problem is momentum management under a secular disturbance torque, the exact mechanism lesson five walked through; and the evidence is a three-axis attitude simulator you built yourself, with real wheel-saturation and magnetic-desaturation logic, not merely described in general terms. Put together: "I want to work on attitude control for a satellite constellation — specifically reaction-wheel momentum management and desaturation — and I built a three-axis simulator that tracks wheel saturation under a modeled disturbance torque and manages it with simulated magnetic torque rods." That sentence names a family precisely enough that whoever hears it can immediately judge fit, ask a pointed follow-up question, or route you to the right team — none of which "I want to work on satellites" allows them to do.

::: example Building the sentence for a different family, step by step
Start from "I'm interested in the ISS program." Step one, name the program type precisely: not "the ISS program" in general, but the vehicle that visits it — a crewed or cargo spacecraft performing rendezvous and docking. Step two, name the subsystem or phase: proximity operations specifically, not the whole mission. Step three, name the technical problem: closing on a moving target through a defined approach corridor, using relative-motion guidance rather than absolute-position guidance. Step four, name the evidence: a rendezvous simulator built around the relative equations of motion, with a real phasing-burn sequence and a closed-loop proximity approach.

Assembled: "I want to work on proximity-operations guidance for crewed or cargo vehicles rendezvousing with the space station — closing through a defined approach corridor using relative-motion guidance — and I built a simulator that flies a real phasing-burn sequence and a closed-loop final approach using the relative equations of motion." Every part of that sentence is checkable. A reviewer can ask about the phasing-burn design, about how the simulator handles the approach corridor, or about what happens in the simulation if a burn underperforms — because every clause names something real enough to have a follow-up question behind it.
:::

## Picking a primary and a secondary, honestly

A primary target should be the family where your genuine interest and your strongest existing evidence actually overlap — not the family that sounds most impressive to name, and not the one you have the least evidence for out of a sense that it should be the hardest one to prove yourself worthy of. A secondary target is worth choosing deliberately rather than leaving to chance, and the strongest secondary is usually one that shares real curriculum backbone with your primary rather than one chosen at random: someone targeting Starship primarily and Falcon secondarily is still building on the same entry-and-landing dynamics and the same simulation and flight-software skills either way, so study time keeps compounding across both rather than splitting into two unrelated efforts.

## Harder to enter, and more open — pulled into one place

Across the last eight lessons, this module has made an honest assessment family by family of how reachable each one is from self-study alone, and it is worth stating together, once, rather than leaving you to reconstruct it. Starship, and the algorithm-focused side of Falcon, ask for two kinds of depth at once — genuine nonlinear and atmospheric-flight dynamics, and production-quality real-time software — plus a degree of tacit judgment about real flight anomalies that is genuinely hard to build outside a job with actual flights behind it. Navigation and State Estimation asks for estimation-theoretic depth that postings often gate with an advanced degree specifically. Dragon's rendezvous and proximity-operations work is fully learnable mathematically, but the specific skill of defending that work to an external safety review board is, honestly, built on the job rather than before it. None of this means these families are closed to you — it means the last mile of evidence for them is the hardest kind to manufacture in advance, and knowing that going in is more useful than discovering it partway through an interview loop.

The more open doors, by contrast, are open for identifiable reasons rather than by accident. Software Engineer, GNC, Operations Automation, and Site Reliability Engineer, GNC weight real software and infrastructure skill far above domain theory, and strong evidence for them is exactly the kind of thing a rigorous self-taught engineer can build directly. Embedded Controls rewards hands-on control-and-firmware work that transfers almost unchanged from any serious embedded-systems background. Beam Pointing consumes a navigation solution rather than deriving one, which spares it the estimation-theory depth Navigation and State Estimation demands. ADCS sits in an honest middle: its physics is thoroughly documented in accessible textbooks and its evidence is genuinely buildable, but it still asks for real three-dimensional attitude fluency, not a shortcut around it. Newer programs add a different kind of opening — wider scope per engineer can favor broad, solid fundamentals over narrow specialization — at the real cost of less institutional support and less public information to prepare against.

## Check yourself

::: check
Name the six generic categories from lesson one, and identify one family from this module that sits near the software-heaviest end of the spectrum and one that sits near the domain-theory-heaviest end.
:::

::: answer
Analysis, flight software, simulation and V&V, hardware-in-the-loop and test, navigation and sensors, and mission design. Software Engineer, GNC, Operations Automation, and Site Reliability Engineer, GNC sit at the software-heaviest end. Navigation and State Estimation sits at the domain-theory-heaviest end, with postings more likely than most other families to require an advanced degree specifically because of that depth.
:::

::: check
Explain the difference between weak evidence and no evidence for a given family, using an example different from the ones worked through in this lesson.
:::

::: answer
Weak evidence means the project touches the right general area but skips the specific part of the problem that makes the real job hard — for instance, a two-dimensional trajectory-plotting tool for a single planar orbit is weak evidence for Orbit Determination, since it uses some of the right vocabulary but skips the actual estimation problem of fusing noisy measurements into a state with an honest uncertainty. No evidence means the project sits in a genuinely different problem domain relative to the family in question — the same trajectory-plotting tool says essentially nothing about, say, embedded firmware control of a physical actuator, regardless of how well it was built.
:::

::: check
A candidate built a real-time scheduler that assigns tasks to a multi-core embedded processor under strict timing deadlines, with a tested, documented codebase. Classify this as direct, weak, or no evidence for both Site Reliability Engineer, GNC and for Navigation and State Estimation, and justify each answer separately.
:::

::: answer
For Site Reliability Engineer, GNC, this is reasonably strong, close to direct evidence: real-time scheduling under strict constraints, disciplined testing, and documentation are close in kind to the infrastructure-reliability engineering that family actually does, even though the specific domain differs from HPC cluster management. For Navigation and State Estimation, this is close to no evidence: nothing about scheduling tasks under timing deadlines touches sensor fusion, filtering, or orbit dynamics, so it says nothing directly about the estimation-theoretic depth that family's technical interviews would actually probe.
:::

::: check
Using the four-part method from this lesson, turn the vague interest "I like working with sensors" into a specific, falsifiable statement of interest for the Navigation and State Estimation family.
:::

::: answer
A strong answer names all four parts: the program type (a satellite constellation), the specific problem (fusing star-tracker and inertial measurements into a consistent attitude estimate, or fusing GNSS measurements into an orbit solution), the technical machinery (a Kalman-filter-family estimator with an honestly reported, checked covariance), and the evidence (a real filter the candidate built and validated against real or realistic data, including an actual consistency check). For example: "I want to work on attitude or orbit state estimation for a satellite constellation, specifically fusing noisy sensor measurements into a consistent state with an honestly quantified uncertainty, and I built an estimator that I validated with a real consistency check against independent data" — checkable in every clause, unlike the original sentence.
:::

::: check
According to this lesson's synthesis, why are Software Engineer, GNC, Site Reliability Engineer, GNC, and Embedded Controls considered more open doors than Starship or Navigation and State Estimation — state the actual mechanism, not only the conclusion.
:::

::: answer
The more open families weight real, demonstrable software or hands-on hardware-and-firmware skill far more heavily relative to deep domain theory, and that kind of evidence — a tested pipeline, a reliable piece of infrastructure, a closed-loop controller validated on real hardware — is exactly what a rigorous self-taught engineer can build directly and completely, without needing years of specialized theoretical depth or tacit, job-only experience first. Starship and Navigation and State Estimation, by contrast, ask for a combination of deep domain theory and either tacit real-flight judgment or credentialed research depth that is genuinely harder to manufacture in advance, which is the actual mechanism behind the difference, not merely a claim that one set of families is easier in general.
:::

## Summary

| Family | Group | Leans hardest on | Weighting | Self-study accessibility |
| --- | --- | --- | --- | --- |
| Starship | Vehicle | Entry, Descent & Landing; Nonlinear Control; 6-DOF Simulation Architecture | Domain theory + flight software | Hard — needs both depths plus tacit flight judgment |
| Falcon | Vehicle | Entry, Descent & Landing; Real-Time & Embedded Systems (Sr. SWE side) | Splits by title | GNC Engineer side hard; Sr. SWE side more open |
| Dragon | Vehicle | Relative Motion, Rendezvous & Proximity Operations; Probability & Statistics | Domain theory + process | Math is learnable; external-review skill is not |
| ADCS | Constellation | Attitude Kinematics & Rotational Dynamics; State-Space Control | Domain theory, well-documented | Middle — buildable evidence, real 3-D fluency required |
| Navigation and State Estimation | Constellation | The Kalman Filter; Orbit Determination | Domain theory, credential-gated | Hardest to clear on paper; math fully learnable |
| Embedded Controls | Constellation | Real-Time & Embedded Systems; Digital & Sampled-Data Control | Hands-on hardware/firmware | Open — transfers directly from embedded-systems work |
| Beam Pointing / Planning | Constellation | Probability & Statistics; Optimization | Consumes navigation, not domain-theory-gated | Open — geometry and software over estimation depth |
| SWE, GNC / Ops Automation | Infrastructure | Testing, CI, pipeline tooling (coding track) | Software-heaviest | Open — direct transfer from software engineering |
| SRE, GNC | Infrastructure | Docker, CI for Simulation Code, Python Performance | Software-heaviest | Open — direct transfer from infrastructure engineering |
| Starfall / newer programs | Vehicle (new) | Same as vehicle families, plus heavier ground test | Widens per engineer | Breadth-friendly; less information to prepare against |

This module set out to replace one vague sentence with nine specific, checkable ones. The next module in this track picks up exactly where this one leaves off: the precise levels and basic-qualification lines each family actually screens against, so the family you have chosen here becomes a target you can measure yourself against line by line.
