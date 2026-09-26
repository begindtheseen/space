---
id: l09-newer-programs-starfall-and-what-comes-next
title: "Starfall, Starmind, and what a new program changes"
minutes: 20
covers:
  - "GNC Engineer (Starfall): reentry and recovery of a returnable payload capsule, first flight June 2026"
  - "newer programs seen in 2026 postings: Starfall, Starmind (Embedded Controls, AI Satellites), Starshield"
---

Think about joining a school club that has run for twenty years. There is a president, a treasurer, a rulebook and a cupboard full of equipment that works. Now think about joining a club that started last month. There are six members, no rulebook yet, and everybody does a bit of everything — including building the equipment while they use it. Both are real clubs. Being a member of each feels completely different.

The last seven lessons visited the twenty-year clubs. Each family had a settled job title, a steady list of responsibilities and a clear place in the vehicle, constellation or infrastructure groups from lesson one. This lesson visits the edge of that map: programs young enough that their postings describe a program still taking shape, not a finished, specialized job.

Research on 2026 postings turned up three names worth knowing here.

- **Starfall** — a returnable **[[payload capsule|payload-capsule]]**, meaning a small spacecraft built to carry cargo to orbit and bring it back to the ground. Its GNC Engineer postings describe **reentry and recovery**, and they state the program's first flight as June 2026.
- **Starmind** — appearing under an **Embedded Controls** title tied to a newer "AI Satellites" line.
- **Starshield** — less a new technical family than a different, more restricted setting for families this module has already covered.

Treat everything here the way this career track has treated all posting language so far: as what current research and current postings describe, not as a fact checked independently beyond that. That caution matters more in this lesson than anywhere else in the module, because a program this new is, by definition, still changing.

## Starfall: a new vehicle with no flight history to lean on

Starfall's stated job is reentry and recovery of a returnable payload capsule. **[[Reentry|reentry]]** is the part of a flight where a spacecraft comes back down from orbit into the air, slowing from orbital speed while surviving the heat. **Recovery** is getting the capsule, and whatever it carries, back safely into human hands.

That sounds a lot like part of Dragon's job from lesson four, and it is worth using the likeness carefully rather than loosely.

**What Starfall shares with Dragon.** Both have deorbit and reentry work: leaving orbit on purpose, coming through the atmosphere, and ending up somewhere you can collect the vehicle.

**What Starfall does not carry, as postings describe it.** Dragon flies people, so it must be **human-rated** — built and reviewed to the stricter standard for carrying crew. Starfall carries cargo, not crew. So the abort system and the outside safety-board review that dominated the Dragon lesson do not apply in the same form.

**What Starfall does carry.** Every brand-new vehicle shares one condition that Dragon outgrew long ago: there is no real body of flight data yet to check a design against. Falcon's GNC engineers, from lesson three, can judge a proposed guidance change against a growing record of real landings. Their record is built from **[[telemetry|telemetry]]** — the measurements a vehicle radios back to the ground as it flies. A program whose first flight is still ahead of it has no such record. Its entry and recovery guidance has to be checked almost entirely through simulation, ground testing and hardware-in-the-loop work instead.

By the time you read this, the calendar has moved past the June 2026 date those postings name. This lesson was written in advance, so it cannot tell you what that **[[first flight|first-flight]]** showed. What it can tell you is what the job looks like in the run-up to any first flight, however that flight goes. That is the more useful thing to understand anyway, because it describes working on any new vehicle, not only this one.

::: key
GNC Engineer (Starfall): reentry and recovery of a returnable payload capsule, with postings stating the program's first flight as June 2026 — a newer program without an established flight history, leaning more heavily on simulation and ground testing than on a real-flight record to validate its designs.
:::

## What a new program changes, at any company

Four things change in a fairly predictable way whenever a GNC organization stands up a genuinely new vehicle. None of them are special to one company or one program.

### 1. Scope per engineer widens

**Scope** means how much of the work one person covers. A mature program like Falcon has had years to grow specialized roles — remember the split between GNC Engineer and Sr. GNC Software Engineer from lesson three. A new program has fewer people and fewer fixed boundaries between specialties. So one engineer more often touches several of lesson one's six kinds of work in the same week, instead of living almost entirely inside one of them. That is **[[wider scope per engineer|scope-picture]]**.

### 2. Supporting infrastructure is less mature

**Infrastructure** here means the shared tools everyone works with: the six-degree-of-freedom simulation, the Monte Carlo pipeline, even the review process itself. On Falcon those have had years of polish. On a new program they are often still being built while they are being used to answer real engineering questions.

So an engineer may spend part of a week improving the very tool they are also trying to get an answer out of. That is a different daily experience from working inside tools that already run reliably.

### 3. Hardware-in-the-loop and ground testing carry more of the weight

Without a flight history, confidence before a first flight has to come from somewhere else. It comes from component tests, integrated systems tests, and **[[hardware-in-the-loop|hil]]** benches — test setups where the real flight computer runs against a simulated vehicle, as if it were flying.

This is lesson one's hardware-in-the-loop-and-test category at its most concentrated. The reason is simple to state: the other source of confidence, real flight telemetry, does not exist yet.

### 4. Titles and scope are less stable

An early posting on a new program often bundles responsibilities that a mature program would already split across two or three specialist titles, the way Falcon splits GNC Engineer from Sr. GNC Software Engineer.

This pattern reaches far beyond SpaceX. Any organization, in any industry, standing up a new technical effort does the same. Early postings describe the program's current shape, and that shape keeps changing as the program and its hiring both grow up.

::: warning A snapshot of a new program is a snapshot, not a promise
Everything this lesson says about Starfall, Starmind or Starshield describes what research found in 2026 postings at one point in time. A program this young can rename a role, split one posting into several, or change its stated scope faster than any fixed piece of writing can track. Read the live posting as the authoritative source for a program at this stage. Treat this lesson as the method for reading it, not as a permanent description of the job.
:::

::: example Two engineers, two programs, the same week
**Engineer A works on Falcon.** She spends the whole week inside guidance-law analysis. Her task: update a landing parameter set against recent flight telemetry. That is exactly the kind of specialized work lesson three described. One kind of work, all week.

**Engineer B works on a newer, unflown program.** Her week has three different pieces:

1. Refining an entry guidance parameter — **analysis**.
2. Helping debug a hardware-in-the-loop bench that gives an inconsistent sensor reading — **hardware-in-the-loop and test**.
3. Writing part of the dispersion-campaign tooling herself, because no dedicated Software Engineer, GNC role has been staffed for the program yet — **simulation and V&V** tooling.

Count them: Engineer A touches one of the six kinds of work; Engineer B touches three.

Neither week is more or less real GNC work. Engineer B's week is what "wider scope per engineer" means in practice. It is not a vague phrase. It is three concrete tasks, spanning guidance analysis, hardware-in-the-loop test and tooling, done by one person, because the specialization a mature program can afford does not exist here yet.

Sanity check: this matches all four changes above. Scope is wider (three categories), the infrastructure is immature (she is building tooling), testing carries weight (the bench), and the role has no specialist split yet.
:::

::: example Reading an early posting the way lesson one taught you
An early posting for a new program's GNC role lists three responsibilities:

- derive guidance algorithms;
- implement them in flight software;
- run hardware-in-the-loop test campaigns.

On a mature program like Falcon, this combination would most likely appear as two separate titles, not one.

Now read it with lesson one's method: responsibilities and verbs over title, with the six kinds of work as the vocabulary.

1. "Derive guidance algorithms" — analysis and mission design.
2. "Implement them in flight software" — flight software.
3. "Run hardware-in-the-loop test campaigns" — hardware-in-the-loop and test.

Three categories, one title. Read this way, the posting is not confusing or badly written. It is exactly what an early-program posting looks like: real evidence that the scope has not yet been split into specialties. It does not mean the role is less serious than a narrower one.

A candidate who expects every posting to follow an established program's pattern will find this one strange. A candidate reading for function recognizes it at once.
:::

## Starmind and Starshield, treated with the same honesty

### Starmind

Starmind appears in 2026 postings under an Embedded Controls title tied to a newer "AI Satellites" line. That extends the actuator-level and subsystem-level control work from lesson seven to a new satellite design.

Here is a reasonable guess, and it is only a guess. A satellite carrying much more **onboard compute** — computing power on the satellite itself — probably changes the thermal and power picture an Embedded Controls engineer must manage. More compute generally means more **[[heat to reject|heat-in-space]]** and more power to route and regulate. That is an inference from what the role's name suggests, not a fact this lesson can verify.

Public detail on a program this new is sparse. So the posting itself, read carefully, is the best and most current source for what the role asks — more current than this lesson can promise to stay.

### Starshield

Starshield is a different kind of "newer". It is not a new technical family. It is a different, more restricted program setting for families this module has already covered — most directly ADCS, which lesson five named as spanning both Starlink and Starshield.

What changes is less the technical content and more its visibility. Public information about Starshield is limited by design. And, as the ITAR module earlier in this track explained, a Starshield role can carry an extra **[[security clearance|security-clearance]]** requirement stacked on top of ordinary export-control eligibility.

The honest posture is the same as for Starmind. Treat a specific Starshield posting's own stated requirements as the authority. Do not assume this lesson's general description covers every detail a real application must meet.

## What targeting a newer program means for you

There is a real case for a newer program being a more open target for someone with **broad, solid fundamentals** rather than deep specialization in one narrow area. Wider scope per engineer can favor a person comfortable moving between guidance analysis, testing and tooling over a person who trained narrowly for one specialist track.

There is an equally real cost.

- Less institutional process to lean on once you are in the role.
- Less public information to prepare against while you are still preparing — and that is the part that matters most right now. Even the posting language may still be settling.

This is a different kind of difficulty from Starship's depth in dynamics or Dragon's burden of outside review. It is the difficulty of preparing for a target that has not finished describing itself.

The practical response is the one lesson one already taught. Read the live posting closely, for function rather than title. Treat any fixed description — including this one — as a starting map, not a finished one.

## Curriculum links

Starfall's entry and recovery work draws on the same base as Dragon's:

- **Entry, Descent & Landing** and **Rigid Body Dynamics** for the vehicle physics;
- **[[6-DOF Simulation Architecture|course-bridge]]** for the standing simulation a new program still has to build out;
- **Verification, Validation & Monte Carlo Analysis** and **Flight Software Architecture & Fault Tolerance** for the ground-testing and hardware-in-the-loop emphasis this lesson stressed;
- **Real-Time & Embedded Systems** for the avionics side of that testing.

Starmind's Embedded Controls work draws on the modules lesson seven named — Real-Time & Embedded Systems, Digital & Sampled-Data Control, Classical Feedback Control Design. It plausibly extends into a thermal and power picture that this curriculum does not currently have a dedicated module for. That is worth knowing honestly rather than papering over.

Starshield's technical content draws on whichever established family a specific posting sits in — most often the Rigid Body Dynamics and attitude-control modules behind ADCS.

## Check yourself

::: check
State what Starfall's postings describe the role as covering, and the stated timing for the program's first flight, with the right care about what that timing claim actually is.
:::

::: answer
Starfall postings describe GNC Engineer work centered on reentry and recovery of a returnable payload capsule, and the postings themselves state the program's first flight as June 2026.

That is what the postings say, current as of the research behind this module. It is not an independently verified report of whether or how that flight happened — this lesson has no way to confirm that and does not claim to.
:::

::: check
Name three of the four changes this lesson says apply to a GNC job on any new program, regardless of company. Then explain why hardware-in-the-loop and ground testing carry more weight on such a program.
:::

::: answer
Any three of:

1. scope per engineer widens;
2. supporting infrastructure is less mature;
3. hardware-in-the-loop and ground testing carry more weight;
4. titles and scope are less stable.

Hardware-in-the-loop and ground testing carry more weight because a new, unflown vehicle has no real flight history to check its designs against. A mature program like Falcon draws confidence from a growing record of actual landings. On a new program that record does not exist yet, so the confidence has to come from simulation and ground testing instead.
:::

::: check
A posting for a new, unflown program bundles responsibilities that would likely be split across two separate titles on a mature program. Using the method from lesson one, what should a candidate conclude?
:::

::: answer
Read for function and responsibilities, not title. The candidate should conclude that this is ordinary evidence of an early-stage program that has not yet split its roles into specialties the way a mature program has. It is not a badly written posting, and it is not a less serious role.

The right response is to treat the wider scope as real information about what the job will involve, instead of being confused that it does not match an established program's narrower pattern.
:::

::: check
Why does this lesson describe Starmind and Starshield in more hedged, cautious language than it used for the established families in earlier lessons?
:::

::: answer
Both are new enough, or restricted enough, that public detail is sparse. Starmind, because the program itself is young. Starshield, because its information is limited by design, as a national-security-adjacent program.

So the lesson treats claims about both as inferences or as what postings currently state, not as settled fact. It sends the reader to the live posting as the more current and authoritative source. That matches the caution this whole career track applies to any claim it cannot verify directly.
:::

::: check
A candidate is choosing between a specialized role on a mature program and a broad-scope role on a new one. According to this lesson, what kind of background favors the newer program, and what real cost comes with choosing it?
:::

::: answer
Broad, solid fundamentals spanning several of the six kinds of work favor the newer program — being comfortable moving between guidance analysis, testing and tooling, rather than deep specialization in exactly one. The newer program's wider scope per engineer rewards exactly that breadth.

The real cost: less institutional process to rely on once hired, and — more relevant while you are preparing — less public information to prepare against, since even the posting language on a program this new may still be settling.
:::

## Summary

| Program | What postings describe | What is distinctly newer about it |
| --- | --- | --- |
| Starfall | GNC Engineer: reentry and recovery of a returnable payload capsule; stated first flight June 2026 | No established flight-history record yet; leans on simulation and ground test |
| Starmind | Embedded Controls for an "AI Satellites" line | Newer satellite design; thermal and power picture likely shifted by more onboard compute |
| Starshield | Same established families (most directly ADCS) in a more restricted program | Limited public information; may add a clearance requirement on top of ITAR eligibility |
| Any new program | Bundled responsibilities under one title | Wider scope per engineer, immature tools, heavier ground test, unstable titles |

The final lesson in this module pulls every family together. It shows how to turn everything you now know into a specific, checkable statement of what you want to work on, and how to map your own projects honestly onto the evidence each family actually asks for.

::: context payload-capsule Why bring cargo back at all
The **payload** is whatever a vehicle carries for its customer — the reason for the trip. Most payloads go up and stay up: a satellite is useful in orbit. A *returnable* payload is different. The point is to get something back — an experiment that ran in weightlessness, a sample, or a product made in orbit — and hand it to someone on the ground.

Bringing something back is much harder than sending it up. The capsule has to leave orbit on purpose, survive the heat of the air, slow down enough to land gently, and come down where a team can find it. That whole chain is the reentry-and-recovery job the Starfall postings describe.
:::

::: context reentry Coming home is the hard part
In low orbit a spacecraft moves at about 7.7 km/s — roughly 23 times the speed of sound at sea level. To land, it must lose nearly all of that speed. Almost all of it is shed by pushing against the air, which turns the motion into heat. That is why capsules carry heat shields.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 158" font-family="Inter, Arial, sans-serif">
  <path d="M 10 30 Q 120 20 200 60 Q 270 95 300 128" fill="none" stroke="#1d6fd1" stroke-width="2.5" stroke-dasharray="6 4"/>
  <line x1="10" y1="70" x2="350" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <text x="346" y="64" font-size="11" fill="#6c7a93" text-anchor="end">top of the air</text>
  <line x1="10" y1="138" x2="350" y2="138" stroke="#1f2a44" stroke-width="2"/>
  <text x="14" y="132" font-size="11" fill="#1f2a44">ground</text>
  <circle cx="32" cy="28.5" r="5" fill="#1f2a44"/>
  <text x="40" y="14" font-size="11" fill="#1f2a44" text-anchor="middle">1 deorbit burn</text>
  <circle cx="149" cy="40.5" r="5" fill="#1f2a44"/>
  <text x="149" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">2 coast down</text>
  <circle cx="260" cy="94.5" r="7" fill="#b4232c"/>
  <text x="200" y="112" font-size="11" fill="#b4232c" text-anchor="middle">3 entry: heating</text>
  <circle cx="300" cy="128" r="5" fill="#1f2a44"/>
  <text x="300" y="154" font-size="11" fill="#1f2a44" text-anchor="middle">4 recovery</text>
</svg>
```

The picture shows the usual order for any returning capsule, not details of Starfall's own design. GNC owns the aim: a burn a little too weak or strong moves the landing spot by a long way.
:::

::: context telemetry Measuring from far away
**Telemetry** comes from two Greek pieces: *tele*, "far", and *metron*, "measure". It is the stream of measurements a vehicle sends home while it flies — speeds, angles, temperatures, what each actuator was commanded to do and what it actually did.

After a flight, GNC engineers compare the telemetry with what their simulation predicted. Where the two agree, confidence grows. Where they disagree, someone has found something the model was missing. A program with many flights has piles of this comparison to lean on. A program before its first flight has none.
:::

::: context first-flight Why first flights are special
A first flight is the first time every part of a system works together in the real environment, with nothing simulated. Testing on the ground can check a great deal, but not everything: real air, real heat and real vibration all at once can only be met by flying.

That is why first flights of new vehicles are often treated partly as tests, where learning what happened is itself a goal. For GNC engineers, the weeks after a first flight are usually spent comparing telemetry with predictions and updating the models, so the next flight rests on real data instead of only on simulation.
:::

::: context scope-picture What wider scope looks like
On a mature program, three people might each own one kind of work. On a new program, one person may stretch across all three.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">Mature program</text>
  <text x="270" y="16" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">New program</text>
  <g fill="#8fb8f0" stroke="#1d6fd1">
    <rect x="20" y="30" width="140" height="28" rx="4"/><rect x="20" y="70" width="140" height="28" rx="4"/><rect x="20" y="110" width="140" height="28" rx="4"/>
    <rect x="200" y="30" width="140" height="28" rx="4"/><rect x="200" y="70" width="140" height="28" rx="4"/><rect x="200" y="110" width="140" height="28" rx="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="49">Analysis: person 1</text><text x="90" y="89">Software: person 2</text><text x="90" y="129">HIL test: person 3</text>
    <text x="270" y="49">Analysis</text><text x="270" y="89">Software</text><text x="270" y="129">HIL test</text>
  </g>
  <rect x="192" y="24" width="156" height="120" rx="8" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="270" y="156" font-size="11" fill="#b4232c" text-anchor="middle">one person covers all three</text>
</svg>
```

The total work is similar. What differs is how it is shared out — and so what one engineer needs to be able to do.
:::

::: context hil Fooling a real computer
In a **hardware-in-the-loop** test (often "HIL", said "hill"), the real flight computer runs its real software. But instead of being wired to a real vehicle, it is wired to a fast simulator pretending to be one. The simulator sends in fake sensor readings; the computer sends out actuator commands; the simulator works out how the pretend vehicle would respond and sends the next readings.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="34" width="130" height="56" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="79" y="58" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">Real flight</text>
  <text x="79" y="74" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">computer</text>
  <rect x="216" y="34" width="130" height="56" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="281" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">Simulated</text>
  <text x="281" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">vehicle</text>
  <line x1="148" y1="46" x2="206" y2="46" stroke="#b4232c" stroke-width="2"/>
  <polygon points="212,46 202,41 202,51" fill="#b4232c"/>
  <text x="180" y="24" font-size="11" fill="#b4232c" text-anchor="middle">actuator commands</text>
  <line x1="212" y1="78" x2="154" y2="78" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="148,78 158,73 158,83" fill="#1d6fd1"/>
  <text x="180" y="112" font-size="11" fill="#1d6fd1" text-anchor="middle">fake sensor readings</text>
</svg>
```

The computer cannot tell it is not flying. So the test catches problems a pure software simulation misses: a calculation that runs a few milliseconds too slow, a wire with the wrong sign, a message that arrives out of order. On a vehicle that has never flown, these benches are one of the main places trust is earned.
:::

::: context heat-in-space Why more computing means more heat
Nearly all the electrical power a computer uses ends up as heat. A chip drawing 100 W is a 100 W heater. On Earth, fans blow that heat into the air. In space there is no air to blow into.

A satellite can only get rid of heat by glowing it away as infrared light from **radiators** — panels that face cold space. A perfect radiator at room temperature (about 300 K) sheds only about 460 W per square meter. So each extra chunk of computing power needs extra radiator area and extra power supply, which is exactly the kind of balance an Embedded Controls engineer may end up helping to manage.
:::

::: context security-clearance What a clearance is
A **security clearance** is a government's official decision that a particular person may be trusted with classified information. Getting one involves a background investigation: forms about your history, checks of your records, and interviews with people who know you. It can take months.

It is a separate gate from ITAR eligibility. ITAR is about who may see controlled defense technology at all; a clearance is about access to classified government work. A Starshield posting may ask for both, and only the posting says which.
:::

::: context course-bridge Where this comes back in the course
The 6-DOF Simulation Architecture module is where you build the kind of standing simulation this lesson keeps mentioning — the model every guidance change is tested against, thousands of times. The Verification, Validation & Monte Carlo module then shows how to run campaigns on it and read the results honestly. Build those two well and you have direct evidence for exactly the work a new program is short of people to do.
:::
