---
id: l03-falcon-reuse-and-the-software-split
title: "Falcon: reuse, and why one title became two"
minutes: 20
covers:
  - "GNC Engineer and Sr. GNC Software Engineer (Falcon): booster entry, descent and landing, and reuse"
---

Picture a small new restaurant. The same cook plans the menu, buys the food and washes the pans. Now picture a busy restaurant that has served the same dishes thousands of times. There, one person designs the recipes and another runs the kitchen that turns them out, fast and the same every time. Nothing magic happened. The place got big and practiced enough for the work to split.

**Falcon** is SpaceX's workhorse rocket family, and it is the busy restaurant. Starship, from the previous lesson, is a new vehicle; its GNC work still fits under one broad job title. Falcon is a mature program that flies often and recovers its first-stage **booster** — the big lower part of the rocket — to fly again. It has enough flight history and enough division of labor that its postings have split into two titles: **GNC Engineer** and **Sr. GNC Software Engineer**.

That split is worth taking seriously. The first lesson raised a question in the abstract: who derives a control law, and who turns it into flight code? Falcon answers it with two different jobs you can apply to.

**[[Reuse|reuse-history]]** changes something else too: the evidence a GNC engineer gets to work with. A booster that lands, gets inspected and flies again sends down real flight data every time. Every model, guidance setting and actuator description can be checked against that data and improved. A vehicle flown once, or a handful of times, cannot run that feedback loop nearly as often.

This lesson covers three things: what entry, descent and landing look like on a mature, repeated program; what actually separates the two titles; and what reuse adds to the job.

## Booster entry, descent and landing, sharpened by practice

### The sequence of burns

The problem has the same shape as Starship's entry and landing, with different tools. After the booster separates from the upper stage, it flies a sequence of engine **burns** — times when the engines fire — to come home. You can see the two main routes in the note on [[where the booster goes|booster-paths]].

1. **Boostback burn.** On flights that return to land, this burn reverses the booster's sideways speed and sends it back toward the coast. On many droneship flights the ship waits farther out, under the booster's natural falling path, so the boostback is small or skipped.
2. **Entry burn.** As the booster falls back into the thicker air, a burn slows it down, easing the heating and the forces on its structure.
3. **Aerodynamic steering.** Through the descent, the booster steers with **[[grid fins|grid-fins]]** — lattice-like panels near its top — rather than Starship's body flaps.
4. **Landing burn.** A final burn brings it down onto a landing zone on land or, more often, onto a **[[droneship|droneship]]**: an uncrewed floating landing platform at sea.

### Grid fins fade like flaps do

At the level that matters here, grid fins behave like the previous lesson's flaps. Their authority depends on dynamic pressure,

$$
q = \tfrac{1}{2}\rho v^{2},
$$

where $\rho$ is air density and $v$ is airspeed. As the booster slows, $v$ falls and $q$ falls faster. So the control law must keep asking how much authority the fins actually have right now. It cannot treat them as a fixed-strength actuator through the whole descent.

### A target that moves

The big difference from Starship is the target. A droneship is not a fixed point on the ground. It is a moving platform. It holds position using **GPS** — the satellite navigation system your phone uses — and its own thrusters, and it rises and rolls with the waves (the **sea state**).

So the guidance law must bring the booster onto a target whose own position carries uncertainty. It must do it in the last part of a burn where propellant margin is thin and there is no second try — a Falcon booster cannot hover and wait, as the note on the [[landing burn|hoverslam]] explains.

That makes droneship landing a genuinely distinct kind of precision landing from a fixed pad. It is one of the places where this family's guidance work earns its own attention.

::: key
GNC Engineer (Falcon) — core focus: booster entry, descent and landing, and everything that makes reuse work — boostback and entry burns, grid fin control, and landing accuracy on a moving droneship.
:::

## Why one title became two

The first lesson split "software and control algorithm development" into two jobs: deriving the law, and turning it into software that runs correctly and on time. Companies do not always make those two separate titles.

On Starship, both kinds of work sit inside versions of the same GNC Engineer title. Which way a given engineer leans is informal — it depends on how their week actually goes. On Falcon, the postings make the split official: a **GNC Engineer** role and a **Sr. GNC Software Engineer** role, named separately. Read them as genuinely different jobs, not two names for one.

### The GNC Engineer

A GNC Engineer on Falcon spends more of the week on the algorithm and analysis side:

- deriving or refining a guidance law;
- running it against **dispersion** campaigns — Monte Carlo runs where winds, engine performance and sensor errors are scattered around their expected values;
- reviewing landing performance.

### The Sr. GNC Software Engineer

A Sr. GNC Software Engineer spends more of the week owning the health of the flight software those algorithms live inside:

- **integrating** a derived change into the codebase that actually flies;
- keeping the code **[[deterministic|deterministic]]** (same inputs, same outputs, same timing, every time) and within its timing budget on the real flight computer;
- maintaining the automated test suite that catches a **regression** — something that used to work and now does not — before it reaches a vehicle;
- **reviewing** other engineers' code for correctness, and for the subtle real-time bug a working-but-slow version can hide.

Both roles sit in the same family and the same program. The **[["Sr."|senior-title]]** — short for "senior" — signals that the software role is usually reached with real production software experience behind it. It does not mean the algorithm role is junior by comparison.

::: warning A named split at one company is not a rule for the industry
Falcon's GNC Engineer / Sr. GNC Software Engineer split is a real fact about how this program organizes its work today, so read a Falcon posting's title carefully. It is not evidence that every GNC organization draws this line, or draws it the same way. Some programs — Starship's own postings among them — fold both kinds of work under one title. Others might split along a different line entirely, such as testing versus building instead of algorithm versus software. Read each employer's own titles and responsibilities rather than assuming this split travels.
:::

## What reuse adds to the job

Think about learning to shoot free throws. If you only ever get one shot, all you can do is practice in your head. If you shoot every day and write down every miss, you slowly learn exactly how your arm really behaves.

A vehicle that flies once gives, at most, one real data point to check a model against. Almost everything its GNC engineers know about how well a design will work comes from simulation and ground tests.

A booster that lands, is inspected and flies again — over and over, across a growing fleet — gives something a new program does not have. It builds a growing record of real flight **telemetry**, the measurements the vehicle radios down. Flight after flight, that record can be compared with the model's predictions, steadily shrinking the gap between what the simulation says and what the vehicle actually does.

### What "done" means here

This changes what "done" means for a guidance or control change.

- **On a program with little flight history**, a design is judged almost entirely against simulated dispersion, because that is the only evidence there is.
- **On a mature, reused vehicle**, a design is judged against simulated dispersion *and* against a real, growing record of landing performance. A proposed change must agree with that record — or explain convincingly why a departure from past performance is expected and acceptable.

### Every landing gets a review

Every landing, successful or not, triggers its own review:

1. inspect the recovered hardware;
2. compare the telemetry against prediction;
3. for anything that differed from expectation, however small, find out why — before the next flight.

That investigation is regular, recurring work in this family, not an occasional event. It is also one of the clearest places the org sentence's "supporting both launch and on-orbit operations" shows up. Engineers from this family are often on console watching a landing live, and they write the follow-up analysis afterward, however it went.

::: example Two Tuesdays inside one family
A GNC Engineer spends the morning updating a set of landing guidance parameters using telemetry from the last several flights. She checks two things: that the update improves predicted touchdown accuracy, and that it does not shrink the margin in any of the dispersion cases that matter most. In the afternoon she defends the update in a design review, to two engineers who did not help derive it.

A Sr. GNC Software Engineer on the same program spends the same day differently. After that same algorithm update was merged, a timing regression appeared in the guidance cycle. He works through it step by step:

1. **Profile** the guidance module to see where the time goes.
2. **Find** the cause: an inefficient matrix operation (arithmetic on grids of numbers) added by the new logic.
3. **Rewrite** it to meet the cycle-time budget without changing its numerical result.
4. **Add a regression test** to the **[[continuous-integration|continuous-integration]]** suite, so the same kind of slowdown cannot slip through silently again.

Both days are Falcon GNC work. Both came from the same algorithm change. Neither engineer's day looks like the other's — the picture of how one change flows through both seats is in the note on [[one change, two owners|one-change-two-owners]].
:::

::: example A small landing miss, investigated like the real record it is
Telemetry shows a booster touched down about 15 meters from the intended point on the droneship. That is inside the deck's safe margin, but larger than recent flights.

Step 1 — do not dismiss it. Because the program has real flight history, the miss is not written off as ordinary scatter without a check.

Step 2 — compare against two references. The telemetry is compared with the guidance law's prediction for *this* flight's actual wind and sea conditions, and with the pattern of recent landings. The question: is this normal variation, or the first sign of something worth catching early?

Step 3 — trace the cause. Suppose the investigation finds a slightly under-modeled **[[wind shear|wind-shear]]** effect during the final approach. It was present in this flight's conditions but poorly represented in the existing dispersion cases.

Step 4 — fix the right thing. The fix is not a one-line parameter tweak. It is an update to the wind model *inside the dispersion campaign itself*, so that every future guidance change is tested against conditions closer to what real flights meet.

Sanity check: which evidence exposed the gap? The real flight record — not the simulation, which did not contain the effect. That is exactly the evidence a program without reuse does not get to build up.
:::

## Curriculum links, and an honest note on getting in

Both Falcon titles draw on the same physical base as Starship:

- Rigid Body Dynamics, and Atmospheric Flight & Vehicle Aerodynamics, for the vehicle;
- Entry, Descent & Landing for the phase itself;
- Trajectory Optimization, with Convex Optimization for Guidance (Powered Descent), for the guidance derivation — especially aiming the landing burn at a droneship.

From there, the two titles lean different ways.

- **GNC Engineer** leans further into Verification, Validation & Monte Carlo Analysis, Classical Feedback Control Design, and Nonlinear Control. Deriving and defending a control law is the center of the job.
- **Sr. GNC Software Engineer** leans further into Real-Time & Embedded Systems, Flight Software Architecture & Fault Tolerance, Modern C++ for Flight and Simulation, and the testing and build-system material in this course's coding track. Owning flight software correctness and timing is the center of that job.

Against the six generic categories, this family sits close to Starship: **mission design**, **flight software**, and **simulation and V&V** dominate. **Hardware-in-the-loop and test** demand is steady rather than spiking, because the program is not racing toward a first flight. **Analysis** is heavy in both titles but looks different in each — dispersion-campaign analysis on the GNC side, performance and timing analysis on the software side. **Navigation and sensors** is present, but, as with Starship, this family more often uses a navigation solution than owns the estimator that produces it.

Now the honest note: which door is easier to reach from self-study?

The **GNC Engineer** side carries the same difficulty as Starship. It needs real atmospheric-flight and control-theory depth, on a program mature enough that the hiring bar reflects real production experience, not only promise.

The **Sr. GNC Software Engineer** side is a somewhat different case. It weights real-time software engineering, testing discipline and flight-code architecture more heavily than control theory. So it is a more reachable target for a candidate whose strongest evidence is production-quality C++ with a real test-and-build discipline, rather than deep aerodynamics — provided that evidence is genuinely production-grade, not a script that merely runs.

## Check yourself

::: check
Why do Falcon's postings split into two titles — GNC Engineer and Sr. GNC Software Engineer — when Starship's postings fold comparable work under one title?
:::

::: answer
A mature, high-flight-rate program has had the time and the flight history to separate the algorithm-and-analysis side of the work from the flight-software-ownership side, turning one broad role into two specialized jobs. It is a choice about how this specific program is organized. It is not evidence that deriving control laws and shipping flight code are fundamentally different work everywhere — Starship's own postings show the same two kinds of work inside one title.
:::

::: check
This lesson calls landing a booster on a droneship a genuinely different guidance problem from landing on a fixed pad. Explain why, in terms of what the guidance law has to bring the booster onto.
:::

::: answer
A droneship is a moving platform that holds position by GPS and moves with the sea state, so its own position carries uncertainty that a fixed pad does not. The guidance law must bring the booster onto a target whose location is itself imperfectly known, in the final part of a burn where propellant margin is thin and there is no chance to try again. That is a harder targeting problem than landing on a fixed, precisely surveyed point.
:::

::: check
A candidate has strong evidence of production-quality real-time C++ — a tested, documented flight-software-style codebase with a real CI pipeline — but little atmospheric-flight or control-theory background. Which Falcon title is the stronger target, and why?
:::

::: answer
Sr. GNC Software Engineer. That role weights real-time software engineering, testing discipline and flight-code architecture more heavily than control-theory depth, which matches this candidate's strongest evidence directly. The GNC Engineer title leans harder on deriving and defending control and guidance laws against dispersion campaigns — exactly the area this candidate's evidence does not yet cover.
:::

::: check
Both Starship's body flaps and Falcon's grid fins lose control authority during a flight phase. State the shared reason, using the physical quantity both explanations depend on.
:::

::: answer
Both are aerodynamic control surfaces, and aerodynamic control authority scales with dynamic pressure, $q = \tfrac{1}{2}\rho v^{2}$. As either vehicle slows during its descent, airspeed falls and dynamic pressure falls with it — faster, because of the square. So the force and twist a surface can produce for a given deflection shrinks, even though the surface itself has not changed. It is the same physics showing up in two vehicles' control problems.
:::

::: check
Explain what reuse adds to how a proposed guidance-law change is judged on Falcon, beyond what a program with little flight history has to work with.
:::

::: answer
On a program with little flight history, a change is judged mostly against simulated dispersion, because that is the evidence available. On Falcon, a change must also agree with — or give a well-justified reason for departing from — a real, growing record of landing performance across many flights. Every landing also triggers its own review of recovered hardware and of telemetry against prediction. So the feedback loop this family works inside has real flight evidence layered on top of simulation, not simulation alone.
:::

## Summary

| Dimension | GNC Engineer (Falcon) | Sr. GNC Software Engineer (Falcon) |
| --- | --- | --- |
| Main product | Guidance and control law derivation; dispersion-campaign results | Flight software implementation; timing and test coverage |
| Judged against | Simulated dispersion and the real landing record | Code review, timing budget, regression-test suite |
| Course modules weighted most | Entry, Descent & Landing; Convex Optimization for Guidance; Nonlinear Control | Real-Time & Embedded Systems; Flight Software Architecture & Fault Tolerance; Modern C++ |
| Most reachable evidence | A dispersion-tested guidance derivation with a written analysis | A tested, documented real-time codebase with a real CI pipeline |

| Idea | In one line |
| --- | --- |
| Falcon descent | Boostback (when returning toward land), entry burn, grid-fin steering, landing burn |
| Droneship | A moving, GPS-held target with its own uncertainty and no second try |
| Fin and flap authority | Both scale with $q = \tfrac{1}{2}\rho v^2$, so both fade as the vehicle slows |
| What reuse adds | A growing real flight record that every change must agree with |

The next lesson moves from a reusable booster to a spacecraft that carries people: Dragon, where the defining problems are rendezvous, docking, and the abort logic a crewed vehicle cannot fly without.

::: context reuse-history From first landing to routine
Landing an orbital booster was once treated as nearly impossible. A Falcon 9 booster first landed back on land in December 2015. The first landing on a droneship followed in April 2016, and the first reflight of a landed booster in March 2017. Since then, landings have become routine, and some individual boosters have flown more than twenty times.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="345" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="345,60 336,55 336,65" fill="#1f2a44"/>
  <g fill="#1d6fd1">
    <circle cx="50" cy="60" r="6"/><circle cx="130" cy="60" r="6"/><circle cx="215" cy="60" r="6"/>
  </g>
  <circle cx="305" cy="60" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="40">Dec 2015</text><text x="130" y="40">Apr 2016</text><text x="215" y="40">Mar 2017</text><text x="305" y="40">later</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="84">first landing</text><text x="50" y="99">on land</text>
    <text x="130" y="84">first landing</text><text x="130" y="99">on a droneship</text>
    <text x="215" y="84">first reflight</text><text x="215" y="99">of a booster</text>
    <text x="305" y="84">some boosters</text><text x="305" y="99">20+ flights</text>
  </g>
</svg>
```
:::

::: context booster-paths Two ways home
After separation, the upper stage keeps going to orbit. The booster either turns around and flies back to a landing zone near the launch site, using a boostback burn, or keeps falling along its path to a droneship waiting downrange at sea. Going back costs propellant, so heavier missions usually use the droneship.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="150" x2="190" y2="150" stroke="#6c7a93" stroke-width="3"/>
  <line x1="190" y1="150" x2="350" y2="150" stroke="#8fb8f0" stroke-width="3"/>
  <path d="M 40 150 Q 60 70 150 42" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 150 42 Q 250 16 345 14" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <path d="M 150 42 Q 110 20 50 146" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M 150 42 Q 250 40 290 144" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="150" cy="42" r="4" fill="#1f2a44"/>
  <rect x="275" y="144" width="30" height="6" fill="#1f2a44"/>
  <g font-size="11" fill="#1f2a44">
    <text x="156" y="58">separation</text>
    <text x="228" y="10">upper stage to orbit</text>
    <text x="14" y="166">launch site</text>
    <text x="262" y="166">droneship</text>
  </g>
  <text x="62" y="92" font-size="11" fill="#b4232c">boostback</text>
  <text x="238" y="96" font-size="11" fill="#1d6fd1">downrange</text>
</svg>
```
:::

::: context grid-fins Fins that look like waffles
A grid fin is a frame filled with a lattice of small cells, like a waffle or an ice-cube tray, instead of a single flat panel. Air flows through the cells. At high speed it gives strong steering force for its size, and it folds flat against the rocket on the way up. A Falcon 9 booster carries four of them near its top; newer boosters use sturdier titanium fins that survive reentry heating flight after flight. Tilting them steers the falling booster like the tail feathers of a dart.
:::

::: context droneship Ships with strange names
SpaceX's droneships are barges fitted with thrusters, which hold them in place without an anchor. They carry no crew during a landing. They have playful names taken from spaceships in Iain M. Banks's *Culture* science-fiction novels: *Of Course I Still Love You*, *Just Read the Instructions* and *A Shortfall of Gravitas*. Landing at sea lets a booster save the propellant it would need to fly all the way back to land.
:::

::: context hoverslam Why a booster cannot hover
Even throttled as low as it goes, one Falcon 9 engine pushes harder than the nearly empty booster weighs. So the booster cannot hang in the air and wait. If it slowed to zero speed too high, it would start climbing again. The landing burn must be timed so speed reaches zero at the same instant height reaches zero. Engineers nickname this a **hoverslam** or suicide burn. It is the reason there is no second attempt, and why guidance must be so precise.
:::

::: context deterministic Same every time
**Deterministic** code gives the same outputs, in the same amount of time, every time it gets the same inputs. That sounds automatic, but many ordinary programming habits break it: asking the computer for new memory mid-flight, waiting on a network, or doing work in an order that depends on timing. Flight software avoids these because a guidance answer that arrives late, or occasionally differently, cannot be trusted. Determinism also makes testing meaningful: a test that passed once will pass again.
:::

::: context senior-title What "Sr." signals
Engineering jobs sit on a **ladder** of levels, often something like engineer, then senior, then staff or principal. "Sr." marks a level that usually expects several years of real experience and the judgment to own something without close supervision. For a software role, that means having shipped and maintained production code others relied on. The next module in this track looks at these levels and their qualification lines in detail.
:::

::: context continuous-integration Continuous integration
**Continuous integration**, or **CI**, means every code change is automatically built and tested as soon as someone submits it, many times a day. A server runs the whole test suite and blocks the change if anything fails. A **regression test** is a test written after a bug was found, so that the same bug can never come back unnoticed. For flight software, the suite checks timing as well as numbers.
:::

::: context one-change-two-owners One change, two owners
A single guidance update passes through both seats. The GNC Engineer derives it and proves it in simulation. The Sr. GNC Software Engineer makes it fit, fast and safe inside the flying code.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="30" width="100" height="70" rx="6" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="130" y="30" width="100" height="70" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="254" y="30" width="100" height="70" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2"><line x1="106" y1="65" x2="124" y2="65"/><line x1="230" y1="65" x2="248" y2="65"/></g>
  <g fill="#1f2a44"><polygon points="130,65 122,60 122,70"/><polygon points="254,65 246,60 246,70"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="56" y="22" font-weight="700">GNC Engineer</text>
    <text x="56" y="54">derive law</text><text x="56" y="70">run dispersion</text><text x="56" y="86">design review</text>
    <text x="180" y="22" font-weight="700">Sr. GNC SW Eng.</text>
    <text x="180" y="54">integrate</text><text x="180" y="70">meet timing</text><text x="180" y="86">tests and CI</text>
    <text x="304" y="22" font-weight="700">Flight</text>
    <text x="304" y="62">flying code</text><text x="304" y="78">on the booster</text>
  </g>
</svg>
```
:::

::: context wind-shear When the wind changes suddenly
**Wind shear** is a sudden change in wind speed or direction over a short distance — for example, calm air at one height and a strong gust a little lower. A falling booster passes through these layers in seconds, and each change shoves it sideways. Near the ground, where the booster is slow and its fins have little authority left, even a modest shove can move the touchdown point by meters.
:::
