---
id: l10-choosing-a-family-and-proving-it
title: "Choosing a family, and proving you belong in it"
minutes: 22
covers:
  - how family choice changes what you must be able to demonstrate
---

Imagine trying out for a sports team by saying, "I'm good at sports." The coach nods and learns nothing. Now imagine saying, "I want to play goalkeeper, I've kept goal in my club league for two seasons, and here is a video of my saves." The coach can watch the video, ask about a save, and decide. The second sentence is not bragging. It is a claim the coach can check.

Nine lessons ago, lesson one showed that "I want to work in GNC" means almost nothing on its own. Since then you have walked through vehicle families that fly one machine through one flight, constellation families that keep thousands of satellites pointed correctly for years, and infrastructure families that build the tools everything else runs on. Each has its own work products, its own reviews, and its own corner of this course it leans on hardest.

This lesson turns those nine stories into two tools you can use:

1. an honest way to read your own projects against one family's real standard of proof;
2. a method for turning a vague interest into a sentence that names a program, a problem, and the proof you have already built.

This lesson adds no tenth family. Its job is to pull things together — including, in one place, the honest answer to which families are harder to reach from self-study and which are more open.

## The six kinds of work, now as a map

Lesson one gave you six kinds of work that recur under any employer's job titles:

- analysis;
- flight software;
- simulation and V&V;
- hardware-in-the-loop and test;
- navigation and sensors;
- mission design.

Every family since has been described in those terms. Lay the families side by side and a pattern appears. They are not scattered at random between "software skill" and "domain theory". **Domain theory** means the deep subject knowledge of the field itself — control theory, dynamics, estimation. The families sit along something close to a real **[[spectrum|spectrum-picture]]**, a line running from one end to the other.

**The software-heaviest end.** Software Engineer, GNC, Operations Automation, and Site Reliability Engineer, GNC. These weight engineering infrastructure far above control or estimation theory. One exception is worth remembering from lesson eight: the specialist Operations Automation variant, which automates judgment calls, was found more likely than the general Software Engineer, GNC ladder to list a Master's or PhD.

**The domain-theory end.** Navigation and State Estimation. It weights estimation-theory depth so heavily that its postings, more than most others, list an **advanced degree** (a Master's or PhD) as a basic requirement.

**Middle, pulling toward domain theory.** The vehicle families — Starship, Falcon, Dragon, and the newer Starfall. They demand real dynamics and control depth *alongside* real software skill, rather than trading one for the other.

**Their own middle ground.** ADCS, Embedded Controls and Beam Pointing. Each asks for real but different subject grounding:

- ADCS — three-dimensional attitude kinematics (how a body's orientation changes);
- Embedded Controls — classical control and firmware (the low-level code that runs directly on hardware);
- Beam Pointing — geometry and link budgets (the accounting of how much signal survives the trip).

None of the three needs the estimation-theory depth Navigation and State Estimation demands.

Where a family sits on this spectrum tells you what kind of evidence will move its reviewers, and what kind will not. That is the next skill.

## Reading your own projects honestly

A project is not "good evidence" or "bad evidence" in general. It is evidence *for a specific family*. The same project can be strong evidence for one family and say nothing at all for another.

To sort a project for a given family, ask one precise question:

> Did building this project require solving substantially the same kind of problem, with substantially the same technical machinery, that this family's real work requires?

The answer puts the project into one of three bins.

**Direct evidence** — yes. The project needed the same machinery the job needs, even at smaller scale. A closed-loop, **[[quaternion|quaternion]]**-based, three-axis attitude simulator with real reaction-wheel momentum tracking is direct evidence for ADCS. Building it required exactly the three-dimensional attitude kinematics and **[[momentum-management|momentum-management]]** reasoning that family's real work runs on.

**Weak evidence** — the project is in the right neighborhood but skips the part that makes the real job hard. A single-axis PID demo (a basic feedback controller) on a simulated cart is a real control exercise. But it skips three-dimensional attitude kinematics, coupled axes (where turning one way disturbs the others) and momentum management. So it supports a claim of general control literacy, not a specific claim of ADCS readiness.

**No evidence** — the project is a different kind of problem altogether for this family, however well it was done. Take this case most seriously. A project can be no evidence for one family and direct evidence for another. That is not a contradiction. It is the whole point of this module.

::: example One project, two very different verdicts
**Project 1: a portfolio Monte Carlo.** For a statistics course, a candidate built a Monte Carlo simulation of a stock portfolio's risk under randomly sampled market scenarios. The code is clean, well tested and vectorized (it works on whole arrays at once instead of looping), and the report shows a clear distribution of outcomes.

- **Against Navigation and State Estimation:** close to *no evidence*. Nothing touches sensor fusion, filtering or orbit dynamics. A reviewer for that family learns nothing about the candidate's estimation depth.
- **Against Software Engineer, GNC or Site Reliability Engineer, GNC:** a very different case. The finance is a different domain. But vectorized simulation code, testing discipline, and clear reporting of a large sampled campaign are close to the real shape of that family's work. Reasonably *strong* evidence, if not perfectly direct.

**Project 2: a quaternion animator.** A second candidate built a tool that takes a satellite's quaternion attitude history and renders it as a smooth 3-D animation. The kinematics are correct. There is no control loop — nothing decides what the satellite *should* do; the tool only shows what it is told.

- **Against ADCS:** *weak evidence* at best. It proves real fluency with quaternion kinematics, which matters. But it skips the control and momentum-management problem, which is the heart of that family.
- **Against a role that needs clear analysis and visualization tooling** — the software and infrastructure families from lesson eight: much closer to *direct evidence*.

Sanity check: in both cases the project did not change. Only the family it was measured against changed, and the verdict moved with it.
:::

::: warning "I have a portfolio" is not the same claim as "I have evidence for this family"
A **portfolio** — the collection of projects you show employers — is not one asset with one value. It is a set of separate claims. Each is strong for some families and silent for others. Before an interview, or before choosing a family at all, sort your projects the way the example above did: honestly, family by family. Do not treat "I have built things" as a single, all-purpose credential.
:::

## From "I want to do GNC" to a sentence someone can check

A **[[recruiter, a hiring manager or an interviewer|who-reads]]** cannot act on "I want to work in GNC". It does not tell them which team to send you to. It gives them nothing to test.

A useful statement of interest has **four parts**:

1. a **program**, or type of program;
2. the **flight phase or subsystem** within it;
3. the **specific technical problem** inside that phase;
4. the **evidence** that shows you have already engaged with it seriously.

::: key
"I want to do GNC" is indistinguishable from what every other applicant says, and an interviewer cannot evaluate it. A sentence that names a program, a flight phase or subsystem, a specific technical problem, and a piece of evidence you actually built is a claim an interviewer can test — which is the entire reason family choice changes what you must be able to demonstrate.
:::

A claim someone can test is sometimes called **[[falsifiable|falsifiable]]**: if it were untrue, a few questions would show it. That is a strength, not a risk. It is what makes the claim worth listening to.

Watch the four parts transform a real interest. Start with "I want to work on satellites."

1. **Program:** a constellation, not a single vehicle.
2. **Subsystem:** attitude control specifically — not navigation, not pointing.
3. **Problem:** momentum management under a **secular disturbance torque** — a small, steady twist that keeps pushing the same way, so its effect builds up. That is the mechanism lesson five walked through.
4. **Evidence:** a three-axis attitude simulator you built yourself, with real wheel-saturation and magnetic-desaturation logic — not only described in general terms.

Put together:

> "I want to work on attitude control for a satellite constellation — specifically reaction-wheel momentum management and desaturation — and I built a three-axis simulator that tracks wheel saturation under a modeled disturbance torque and manages it with simulated magnetic torque rods."

Whoever hears that can judge fit, ask a pointed follow-up, or send you to the right team. "I want to work on satellites" allows none of those.

::: example Building the sentence for a different family, step by step
Start from: "I'm interested in the ISS program."

**Step 1 — name the program type precisely.** Not "the ISS program" in general, but the vehicle that visits it: a crewed or cargo spacecraft doing rendezvous and docking. (This is the Dragon family from lesson four.)

**Step 2 — name the phase.** **Proximity operations** specifically — the close-in part, where the two spacecraft are near each other — not the whole mission.

**Step 3 — name the technical problem.** Closing on a moving target through a defined **approach corridor** (the allowed path in toward the station), using relative-motion guidance rather than absolute-position guidance. **Relative-motion guidance** steers by where you are compared with the target, not by where you are compared with Earth.

**Step 4 — name the evidence.** A rendezvous simulator built on the **[[relative equations of motion|relative-motion]]**, with a real **[[phasing-burn|phasing]]** sequence and a closed-loop final approach.

Assembled:

> "I want to work on proximity-operations guidance for crewed or cargo vehicles rendezvousing with the space station — closing through a defined approach corridor using relative-motion guidance — and I built a simulator that flies a real phasing-burn sequence and a closed-loop final approach using the relative equations of motion."

Check it against the four parts: program (station-visiting vehicle), phase (proximity operations), problem (corridor approach with relative-motion guidance), evidence (the simulator). All four present.

Every clause is checkable. A reviewer can ask about the phasing-burn design, how the simulator handles the approach corridor, or what happens if a burn underperforms.
:::

## Picking a primary and a secondary, honestly

Your **primary target** should be the family where your real interest and your strongest existing evidence overlap. Not the family that sounds most impressive to name. Not the one you have the least evidence for, chosen because it feels like the hardest one to prove yourself in.

Choose a **secondary target** on purpose, too. The best secondary usually shares real course backbone with your primary. Someone targeting Starship first and Falcon second builds on the same entry-and-landing dynamics and the same simulation and flight-software skills either way. Study time for one keeps paying off for the other, instead of splitting into two unrelated efforts.

## Harder to enter, and more open — in one place

Across the last eight lessons, this module judged how reachable each family is from self-study alone. Here is that judgment in one place.

### Harder to enter

- **Starship, and the algorithm-focused side of Falcon**, ask for two depths at once: real nonlinear and atmospheric-flight dynamics, and production-quality real-time software. They also ask for some **[[tacit judgment|tacit]]** about real flight anomalies, which is hard to build outside a job with actual flights behind it.
- **Navigation and State Estimation** asks for estimation-theory depth that postings often gate with an advanced degree.
- **Dragon's** rendezvous and proximity-operations work is fully learnable mathematically. But the specific skill of defending that work to an outside safety review board is honestly built on the job, not before it.

None of this means these families are closed to you. It means the last mile of evidence for them is the hardest kind to manufacture in advance. Knowing that going in beats discovering it halfway through an interview loop.

### More open

The more open doors are open for reasons you can name.

- **Software Engineer, GNC, Operations Automation, and Site Reliability Engineer, GNC** weight real software and infrastructure skill far above domain theory. Strong evidence for them is exactly what a rigorous self-taught engineer can build directly. (The specialist Operations Automation variant is the exception to watch for, since it more often lists an advanced degree.)
- **Embedded Controls** rewards hands-on control-and-firmware work, which transfers almost unchanged from any serious embedded-systems background.
- **Beam Pointing** *uses* a navigation solution rather than working one out. That spares it the estimation-theory depth Navigation and State Estimation demands.
- **ADCS** sits in an honest middle. Its physics is thoroughly documented in accessible textbooks, and its evidence is buildable. But it still asks for real three-dimensional attitude fluency — there is no shortcut around that.
- **Newer programs** add a different kind of opening. Wider scope per engineer can favor broad, solid fundamentals over narrow specialization — at the real cost of less institutional support and less public information to prepare against.

## Check yourself

::: check
Name the six kinds of work from lesson one. Then name one family from this module near the software-heaviest end of the spectrum, and one near the domain-theory-heaviest end.
:::

::: answer
The six: analysis, flight software, simulation and V&V, hardware-in-the-loop and test, navigation and sensors, and mission design.

Software-heaviest end: Software Engineer, GNC, Operations Automation, and Site Reliability Engineer, GNC.

Domain-theory-heaviest end: Navigation and State Estimation. Its postings are more likely than most other families' to require an advanced degree, precisely because of that depth.
:::

::: check
Explain the difference between weak evidence and no evidence for a given family, using an example different from the ones in this lesson.
:::

::: answer
**Weak evidence** touches the right general area but skips the specific part of the problem that makes the real job hard. For example, a two-dimensional trajectory-plotting tool for a single planar orbit is weak evidence for Orbit Determination. It uses some of the right vocabulary, but it skips the actual estimation problem: fusing noisy measurements into a state with an honest uncertainty.

**No evidence** means the project sits in a different problem domain from the family. The same trajectory-plotting tool says essentially nothing about, say, embedded firmware control of a physical actuator, however well it was built.
:::

::: check
A candidate built a real-time scheduler that assigns tasks to a multi-core embedded processor under strict timing deadlines, with a tested, documented codebase. Classify this as direct, weak or no evidence for Site Reliability Engineer, GNC, and for Navigation and State Estimation. Justify each separately.
:::

::: answer
**Site Reliability Engineer, GNC:** reasonably strong, close to direct evidence. Scheduling work onto limited computing resources under strict constraints, disciplined testing and documentation are close in kind to the infrastructure-reliability work that family does — even though the specific setting (one embedded chip) differs from managing a high-performance computing (HPC) cluster.

**Navigation and State Estimation:** close to no evidence. Scheduling tasks under timing deadlines touches nothing of sensor fusion, filtering or orbit dynamics. It says nothing directly about the estimation depth that family's technical interviews probe.
:::

::: check
Using the four-part method from this lesson, turn the vague interest "I like working with sensors" into a specific, checkable statement of interest for the Navigation and State Estimation family.
:::

::: answer
A strong answer names all four parts:

1. **Program type:** a satellite constellation.
2. **Specific problem:** fusing star-tracker and inertial measurements into a consistent attitude estimate, or fusing GNSS (satellite navigation, like GPS) measurements into an orbit solution.
3. **Technical machinery:** a Kalman-filter-family estimator with an honestly reported, checked covariance (its own estimate of how uncertain it is).
4. **Evidence:** a real filter the candidate built and validated against real or realistic data, including an actual consistency check.

For example: "I want to work on attitude or orbit state estimation for a satellite constellation, specifically fusing noisy sensor measurements into a consistent state with an honestly quantified uncertainty, and I built an estimator that I validated with a real consistency check against independent data." Every clause is checkable, unlike the original sentence.
:::

::: check
According to this lesson, why are Software Engineer, GNC, Site Reliability Engineer, GNC, and Embedded Controls more open doors than Starship or Navigation and State Estimation? State the mechanism, not only the conclusion.
:::

::: answer
The more open families weight demonstrable software skill, or hands-on hardware-and-firmware skill, far more heavily than deep domain theory. That kind of evidence — a tested pipeline, a reliable piece of infrastructure, a closed-loop controller validated on real hardware — is exactly what a rigorous self-taught engineer can build directly and completely. It does not need years of specialized theory or job-only experience first.

Starship and Navigation and State Estimation ask for deep domain theory *combined with* either tacit real-flight judgment (Starship) or credentialed research depth (Navigation and State Estimation). That combination is much harder to manufacture in advance. That is the mechanism — not a claim that one set of families is easier in general.
:::

## Summary

| Family | Group | Leans hardest on | Weighting | Self-study accessibility |
| --- | --- | --- | --- | --- |
| Starship | Vehicle | Entry, Descent & Landing; Nonlinear Control; 6-DOF Simulation Architecture | Domain theory + flight software | Hard — needs both depths plus tacit flight judgment |
| Falcon | Vehicle | Entry, Descent & Landing; Real-Time & Embedded Systems (Sr. SWE side) | Splits by title | GNC Engineer side hard; Sr. SWE side more open |
| Dragon | Vehicle | Relative Motion, Rendezvous & Proximity Operations; Probability & Statistics | Domain theory + process | Math is learnable; external-review skill is not |
| ADCS | Constellation | Attitude Kinematics & Rotational Dynamics; State-Space Control | Domain theory, well documented | Middle — buildable evidence, real 3-D fluency required |
| Navigation and State Estimation | Constellation | The Kalman Filter; Orbit Determination | Domain theory, credential-gated | Hardest to clear on paper; math fully learnable |
| Embedded Controls | Constellation | Real-Time & Embedded Systems; Digital & Sampled-Data Control | Hands-on hardware/firmware | Open — transfers directly from embedded-systems work |
| Beam Pointing / Planning | Constellation | Probability & Statistics; Optimization | Consumes navigation, not domain-theory-gated | Open — geometry and software over estimation depth |
| SWE, GNC / Ops Automation | Infrastructure | Testing, CI, pipeline tooling (coding track) | Software-heaviest | Open — direct transfer from software engineering; Ops Automation specialist roles more often degree-gated |
| SRE, GNC | Infrastructure | Docker, CI for Simulation Code, Python Performance | Software-heaviest | Open — direct transfer from infrastructure engineering |
| Starfall / newer programs | Vehicle (new) | Same as vehicle families, plus heavier ground test | Widens per engineer | Breadth-friendly; less information to prepare against |

| Tool | In one line |
| --- | --- |
| Evidence bins | Direct (same machinery), weak (right area, skips the hard part), none (different problem) — always *for a named family* |
| Four-part sentence | Program, phase or subsystem, specific problem, evidence you built |
| Primary and secondary | Primary where interest and evidence overlap; secondary sharing the same course backbone |

This module set out to replace one vague sentence with nine specific, checkable ones. The next module in this track picks up where this one leaves off: the exact levels and basic-qualification lines each family screens against, so the family you chose here becomes a target you can measure yourself against line by line.

::: context spectrum-picture The families on one line
Put "mostly software" at the left and "mostly domain theory" at the right. The families fall into four rough groups along it. The positions are groupings, not measurements.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="16" y1="40" x2="344" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="16,40 26,35 26,45" fill="#1f2a44"/>
  <polygon points="344,40 334,35 334,45" fill="#1f2a44"/>
  <text x="16" y="22" font-size="11" fill="#1d6fd1">software-heaviest</text>
  <text x="344" y="22" font-size="11" fill="#b4232c" text-anchor="end">domain-theory-heaviest</text>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="50" y1="40" x2="50" y2="62"/><line x1="140" y1="40" x2="140" y2="62"/><line x1="230" y1="40" x2="230" y2="62"/><line x1="315" y1="40" x2="315" y2="62"/>
  </g>
  <circle cx="50" cy="40" r="6" fill="#1d6fd1"/><circle cx="140" cy="40" r="6" fill="#8fb8f0" stroke="#1d6fd1"/>
  <circle cx="230" cy="40" r="6" fill="#f2b880" stroke="#1f2a44"/><circle cx="315" cy="40" r="6" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="78">SWE, GNC</text><text x="50" y="93">Ops Automation</text><text x="50" y="108">SRE, GNC</text>
    <text x="140" y="78">Embedded</text><text x="140" y="93">Beam Pointing</text><text x="140" y="108">ADCS</text>
    <text x="230" y="78">Starship</text><text x="230" y="93">Falcon</text><text x="230" y="108">Dragon</text><text x="230" y="123">Starfall</text>
    <text x="315" y="78">Navigation</text><text x="315" y="93">and State</text><text x="315" y="108">Estimation</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="50" y="148">infrastructure</text>
    <text x="140" y="148">own middle</text>
    <text x="230" y="148">vehicle: both</text>
    <text x="315" y="148">often</text><text x="315" y="162">degree-</text><text x="315" y="176">gated</text>
  </g>
</svg>
```

Within each group the order means nothing; a single posting can also sit left or right of its group's spot.
:::

::: context quaternion Four numbers for a direction
A **quaternion** is a set of four numbers that describes how an object is turned in space. Three numbers are enough to name an orientation, but every three-number scheme has bad spots where the math breaks down, like trying to say which way is "east" while standing on the North Pole. The fourth number removes those bad spots, which is why spacecraft software uses quaternions almost everywhere.

The Irish mathematician William Rowan Hamilton discovered them in 1843 and famously scratched the key formula into a stone bridge in Dublin. Later modules on attitude kinematics teach them properly.
:::

::: context momentum-management Emptying the spinning wheels
A satellite turns itself by speeding up or slowing down **reaction wheels** inside it: spin a wheel one way and the satellite turns the other way. Small, steady twists from outside — sunlight pressure, thin air, Earth's magnetic field — keep nudging the satellite, and the wheels must keep speeding up to cancel them.

Eventually a wheel nears its top speed and can do no more: it is **saturated**. **Momentum management** is the job of emptying it before then. **Magnetic torque rods** push against Earth's magnetic field to twist the satellite gently, so the wheels can slow down without the satellite turning. Lesson five walked through this; it is the heart of the ADCS family.
:::

::: context who-reads Three different readers
A **recruiter** screens candidates and routes them to the right team; she needs to know *which* team. A **hiring manager** leads the team with the opening and decides whom to hire; she needs to judge *fit*. An **interviewer** is an engineer on or near that team who tests one skill in depth; she needs something *to probe*.

The four-part sentence serves all three at once. The program and phase tell the recruiter where to send you. The problem tells the hiring manager whether it matches her team. The evidence gives the interviewer a place to start digging.
:::

::: context falsifiable A claim that could be shown wrong
**Falsifiable** means "able to be shown false". The philosopher Karl Popper made the word famous in the twentieth century: he argued that a scientific claim is worth something because it risks being wrong — some test could, in principle, knock it down.

The same logic works in an interview. "I am passionate about space" cannot be tested, so it tells the interviewer nothing. "I built a three-axis simulator that manages wheel saturation" can be tested with three questions. If it survives them, it is now believed — which is the whole point of saying it.
:::

::: context relative-motion Chasing from the target's point of view
When one spacecraft closes on another, the useful question is not "where am I above Earth?" but "where am I compared with the target?". The **relative equations of motion** describe exactly that: the chaser's position and speed measured from the target, as both orbit.

A well-known simple version, the **Clohessy–Wiltshire equations** (also called Hill's equations), assumes the target is in a circular orbit and the two craft are close together. They produce some surprising results — thrust forward toward a target ahead of you and you rise into a slower, higher path and end up falling behind it. The Relative Motion, Rendezvous & Proximity Operations module derives them.
:::

::: context phasing Catching up by going lower
To catch a target in the same orbit, a chaser does something that sounds backwards: it drops a little **lower**. A lower orbit is shorter and faster, so each lap takes less time and the chaser gains ground.

Numbers, with Earth's radius 6,371 km: a circular orbit at 400 km takes about 92.4 minutes; one at 350 km takes about 91.4 minutes. So a chaser 50 km below gains about 4° of the circle per lap — roughly 480 km along the target's path. A **phasing burn** sequence sets up this catch-up, then raises the chaser back to the target's height at the right moment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="100" r="18" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="120" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <circle cx="120" cy="100" r="84" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="120" cy="100" r="66" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="120" cy="16" r="6" fill="#1f2a44"/>
  <circle cx="54" cy="100" r="6" fill="#1d6fd1"/>
  <path d="M 58 78 A 66 66 0 0 1 80 48" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="80,48 72,51 78,58" fill="#1d6fd1"/>
  <text x="226" y="40" font-size="11" fill="#1f2a44">target: higher,</text>
  <text x="226" y="54" font-size="11" fill="#1f2a44">slower lap</text>
  <text x="226" y="120" font-size="11" fill="#1d6fd1">chaser: lower,</text>
  <text x="226" y="134" font-size="11" fill="#1d6fd1">faster lap,</text>
  <text x="226" y="148" font-size="11" fill="#1d6fd1">gains each orbit</text>
  <text x="120" y="196" font-size="11" fill="#6c7a93" text-anchor="middle">both move clockwise; gap not to scale</text>
</svg>
```
:::

::: context tacit Knowing more than you can say
**Tacit** comes from the Latin *tacitus*, "silent". **Tacit knowledge** is skill you have but cannot fully write down — the way a cyclist balances, or a veteran engineer looks at a telemetry plot and senses that something is off before she can say why. The chemist-turned-philosopher Michael Polanyi summed it up as "we can know more than we can tell".

Judging real flight anomalies is largely tacit. It grows from seeing many real flights, which is why it is hard to build before the job. Careful study of public flight reports and your own simulations can start it, but not finish it.
:::
