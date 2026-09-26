---
id: l04-dragon-rendezvous-and-human-rating
title: "Dragon: rendezvous, docking, and flying people"
minutes: 22
covers:
  - "GNC Engineer (Dragon): mission design, rendezvous and docking with the ISS, deorbit, reentry, abort"
---

Picture two people on bicycles on a huge circular track. One wants to pull up next to the other and hand over a sandwich. Both are moving fast. The one catching up has to match speed and position almost perfectly, and must not bump hard, or the sandwich ends up on the ground.

That is Dragon's job, with spacecraft instead of bicycles. The last two lessons were about vehicles flying their own flight: get off the pad, come back down, land on a chosen spot. Dragon is different. For a big part of its mission it is not flying toward a fixed point on the ground. It is flying toward another spacecraft — the **International Space Station**, or **ISS** (said "I-S-S") — which is itself moving at close to [[eight kilometers a second|iss-speed]]. Dragon has to arrive close enough, slowly enough and precisely enough to lock onto it.

On top of that sits a second fact that shapes almost everything in this family: **Dragon carries people**. A vehicle with no one aboard can treat losing the mission as a bad outcome whose chance you keep small. A vehicle with people aboard cannot think that way. Its **abort** logic — the rules for giving up on the mission safely — exists so the crew survive even when the mission is lost. That one requirement changes what "the analysis is done" has to mean.

This lesson covers what GNC Engineer postings on Dragon describe: **mission design**, **rendezvous and docking** with the ISS, **deorbit**, **reentry** and **abort**. It also covers the part hardest to copy through self-study: analysis that must satisfy expert reviewers *outside* your own company.

## Rendezvous: closing on a target that is also moving

**Rendezvous** (said "RON-day-voo", French for "meeting") means bringing two spacecraft together in orbit. It is not "point at the station and fire the engine".

On the ground, if you want to catch up with a friend ahead of you, you speed up. In orbit, that instinct [[leads you the wrong way|faster-is-slower]]. A burn that speeds a spacecraft up in its current orbit raises its altitude. A higher orbit is a bigger circle, and the spacecraft takes longer to go around it. So speeding up makes you fall *behind*, on average. Everyday intuition misleads you here, and orbital mechanics has to replace it.

The real approach happens in three stages:

1. **Phasing burns.** A **burn** is a firing of the engines. Phasing burns adjust Dragon's orbit, over many hours, until it and the station are on paths that come together. "Phase" here means where you are around the circle compared with the target.
2. **Proximity operations**, or **prox ops** — the close-in part. Dragon flies a slow, tightly controlled final approach through a defined **corridor** (an allowed lane in space). The corridor has built-in **[[hold points|hold-points]]**, places where the vehicle can pause, or back away, before continuing.
3. **Capture and docking.** Contact has to happen within a narrow tolerance — a small allowed error — on both **relative velocity** (how fast Dragon moves compared with the station) and **relative attitude** (how it is turned compared with the station).

### Watching from the station

The motion in this phase is usually worked out in a **[[frame centered on the target|target-frame]]** rather than on Earth. Picture standing on the station and watching Dragon drift around you. In that view, a set of simplified equations describes how a nearby vehicle drifts, and how it responds to a small burn. This course's relative-motion module builds that machinery in full.

For now, carry the shape of the answer, not the derivation. The **closing rate** — how fast the gap is shrinking — has to shrink steadily as the gap shrinks. Far from the station it might be meters per second. By contact it is down to [[centimeters per second|contact-speed]]. Any faster, and contact risks damaging either vehicle or the **docking mechanism**, the ring of latches that joins them.

::: key
GNC Engineer (Dragon) — core focus: mission design, rendezvous and docking with the ISS, deorbit, reentry and abort. Relative motion, proximity operations and human-rated fault management dominate.
:::

**Human-rated** means designed, tested and certified to carry people — see the note on [[what human rating asks for|human-rated]]. **Fault management** means the logic that notices when something has gone wrong and decides what to do about it.

## The review board this family answers to

Every family in this module has its analysis reviewed inside the company before anyone trusts it. Dragon's rendezvous, prox-ops and abort analysis is reviewed there too. Then it is reviewed a *second* time, by a [[safety review|safety-review]] process run by the space station program itself.

Why? Because Dragon is approaching a crewed, multinational, very valuable spacecraft that does not belong to the company flying Dragon. Think of borrowing your neighbor's car: your own family may trust your driving, but the neighbor gets a say too.

This is not a formality. The analysis has to be written and presented so that a skeptical, expert audience outside your organization can check it for themselves and approve it. It runs on a review schedule your company does not fully control. And it must be approved before the mission is allowed into the phases the analysis covers.

So an engineer on Dragon spends real time writing and defending technical arguments for an outside audience, on top of doing the technical work the argument is about. That is a real skill: clear, defensible technical writing under scrutiny you do not control. It is also real process overhead that most other families in this module carry much less of, because most of what SpaceX flies does not have to satisfy an outside program office before it may proceed.

::: warning "It works in simulation" is not the same claim as "it is safe to fly near a crewed station"
A control law that performs well across a **dispersion campaign** — thousands of simulated flights with slightly varied conditions — has cleared one bar. Prox-ops and abort logic near the ISS must clear a second, different bar: a **safety case**, a written argument that lists the ways the approach could go wrong, however unlikely, and shows that the vehicle's response to each one protects the station and, when crew are aboard, the crew. Treat these as separate questions. A design can be excellent in its dynamics and still fail a safety review that finds a scenario its fault logic mishandles.
:::

## Abort: designed to fail toward safety

Think of a smoke alarm. A false alarm while you make toast is annoying. A missing alarm during a real fire is a disaster. So smoke alarms are built to go off a little too easily, on purpose.

Dragon's abort logic follows the same idea. An uncrewed vehicle's fault response can, in the worst case, accept losing the vehicle or the mission as a bounded outcome — something whose probability you keep below a limit. A crewed vehicle's abort logic exists for the opposite reason. It gives the crew a survivable way out of a failure at essentially any point in the flight — from [[the launch pad upward|launch-escape]], and including the closest, most delicate part of prox ops, where a fault must trigger a safe retreat instead of a continued approach.

Designing this well means treating two mistakes as very different in cost:

- **Aborting when you did not need to.** Cost: a delay, and another try later.
- **Failing to abort when you should have.** Cost, in the phase this family works on most: the vehicle, the station, and everyone aboard either one.

So abort logic near the station is built, deliberately, to fail toward the cheaper mistake. When sensors disagree, when the path drifts outside its expected corridor, or when any of several defined **trigger conditions** is met, the default is to abort to a safe, pre-planned retreat. It does not press on and hope the problem sorts itself out. Engineers reason about these chains of possible failures with tools such as the [[fault tree|fault-tree]].

::: example A closing sequence, phase by phase
Follow one Dragon approach from far to near.

1. **The day before.** A series of phasing burns has brought Dragon's orbit into line with the station's.
2. **Several kilometers out.** Dragon begins its final approach. The closing rate is measured in meters per second.
3. **Entering the corridor.** Dragon slows in stages. At each pre-planned hold point it pauses. Ground controllers and the onboard logic both confirm that the path, the relative attitude and the health of the systems are within limits. Only then does it continue.
4. **The last tens of meters.** The closing rate is now a small fraction of a meter per second, tightly controlled.
5. **Contact.** Dragon touches the station at only centimeters per second. That is slow enough that the docking mechanism, not orbital dynamics, absorbs the last of the relative motion.

Each stage is a separate guidance and control problem, checked against its own tolerance.

Sanity check: why pause at all, if everything looks fine? Because a hold point means a problem spotted early costs only a delay. Without it, the decision would have to be made at the worst possible moment — close to the station, with little time to think.
:::

::: example A sensor disagreement, and the logic that responds to it
During final approach, Dragon uses two independent **relative-navigation sensors** — say, a set of cameras and a separate ranging sensor that measures distance. They begin reporting ranges that disagree by more than their expected tolerance.

Nothing about the path has visibly gone wrong. The disagreement could be:

- a real fault in one sensor;
- lighting conditions confusing one sensor; or
- a brief glitch that will clear up in the next few samples.

The abort logic does not wait to find out which. A disagreement beyond the defined tolerance between independent sensors, during this phase, is exactly the kind of trigger condition designed in advance. It commands an automatic abort to a safe retreat path, moving Dragon away from the station. The team then investigates the disagreement from a safe distance, instead of settling it in real time at close range.

Result: the mission is delayed, not lost. Dragon can try the approach again once the fault is understood. Check that this is the right trade: if the glitch was harmless, the cost is a few hours; if it was real, the retreat may have saved the vehicle and the station. That is the whole point of designing it this way — it turns a truly uncertain situation at close range into a bounded, recoverable one.
:::

## Deorbit, reentry, and the third act

When a Dragon mission is ready to come home, **deorbit** — leaving orbit — starts with a [[retrograde burn|retrograde-burn]]: an engine firing that pushes against the direction of travel and slows the vehicle. That lowers the **perigee**, the lowest point of the orbit, down into the atmosphere.

The burn is small compared with orbital speed itself. Take a roughly 400-kilometer circular orbit, where orbital speed is close to $7.7\ \mathrm{km/s}$. Lowering the perigee to about 100 kilometers takes a burn of about $87\ \mathrm{m/s}$ — on the order of $90\ \mathrm{m/s}$, a little over one percent of orbital speed. Small, but precisely aimed, because it sets up the **entry corridor**: the narrow band of paths the vehicle must fly through the atmosphere afterward.

**Reentry** — plunging back through the air — is a different problem from the lifting, flap-steered descent of the last two lessons. A **capsule** (a blunt, cone-shaped vehicle) has far less ability to steer with air than a vehicle built to fly a controlled aerodynamic descent. So instead of large moving control surfaces, it steers mostly with a [[deliberate offset|cg-offset]] between its **center of mass** (the balance point of its weight) and the point where the air's push effectively acts. That offset makes it fly tilted at a steady **trim angle of attack**, which gives a small amount of **lift** — sideways push from the air — to steer with. Small **reaction control thrusters** then roll the capsule to point that lift where it is needed.

After that, the vehicle keeps slowing through parachute deployment and finally **splashdown** in the ocean. Splashdown has its own targeting problem: predicting where the vehicle will land well enough that the recovery ship is in the right place when it arrives.

## Artifacts, review, and what "done" includes

An **artifact** here means a finished piece of engineering work that others can read and review. This family's artifacts follow its three acts:

- **The approach:** rendezvous trajectory design documents and phasing-burn plans.
- **The close approach and docking:** relative-navigation filter performance reports and prox-ops control analysis.
- **The return:** abort-mode fault trees, deorbit targeting analysis and splashdown accuracy reports.

Every family in this module produces documents like these. What sets this one apart is that "done", for the rendezvous, prox-ops and abort work, includes formal approval from a review process *outside* the company as well as inside it. An analysis that is technically excellent but has not cleared that outside review is not yet finished, by this family's own standard.

## Curriculum links, and where the self-study gap is

Here is where each part of the job lives in this course:

- **Rendezvous and prox ops** draw on Relative Motion, Rendezvous & Proximity Operations, and on Lambert's Problem & Orbit Targeting for the phasing-burn sequence.
- **Relative navigation** draws on Orbit Determination, GNSS/GPS, and the nonlinear-filtering material built around the Kalman filter family. Knowing the relative state well enough to dock is itself a real estimation problem.
- **Prox-ops control** draws on Optimal Control: LQR and LQG for the close-in guidance logic.
- **Abort and fault-tree analysis** draws on Probability & Statistics, for reasoning carefully about how likely something is and how bad it would be, together.
- **Deorbit and reentry** draw on Entry, Descent & Landing, adapted to a capsule's limited steering instead of a lifting body's.

Now hold this family against the six kinds of work from the first lesson. It stands out for how heavily it leans on **navigation and sensors** as something it *owns*, not only uses. Relative navigation sits near the center of the rendezvous and docking problem. The vehicle families in the last two lessons more often use a navigation answer built by someone else. **Mission design** is heavy throughout, from phasing to deorbit targeting. **Analysis** is heavy too, and it tilts toward fault-tree and safety-case reasoning, not only performance margins.

The honest gap is the outside-review experience itself. The mathematics — relative motion, rendezvous guidance, prox-ops control, fault-tree construction — can be fully learned and shown through self-study. A real rendezvous simulator, built on the relative equations of motion, with a genuine phasing-burn sequence and a closed-loop proximity approach, is strong, easy-to-judge evidence for this family. What a self-study project cannot fully copy is defending that kind of analysis to a skeptical outside reviewer, on a schedule you do not control. That skill is built on the job, not before it. Know that going in.

## Check yourself

::: check
Name the four problems this lesson organizes Dragon GNC work around, and state what "done" includes for the rendezvous and proximity-operations analysis specifically, beyond internal engineering review.
:::

::: answer
The four problems are mission design, rendezvous and docking with the ISS, deorbit and reentry, and abort. For the rendezvous and proximity-operations analysis, "done" also requires approval from a safety review process run by the space station program itself — outside the company flying Dragon. That is a second bar, beyond internal review, which most other GNC families in this module do not have to clear.
:::

::: check
Explain why this family owns its navigation solution more directly than the vehicle families covered in the previous two lessons do.
:::

::: answer
Rendezvous and docking require knowing Dragon's position and velocity *relative to the station* precisely enough to close safely and make contact within a tight tolerance. That makes relative navigation a central part of the guidance and control problem itself, not an input handed over from elsewhere. The vehicle families in the previous two lessons more often use a navigation solution produced elsewhere to fly their guidance laws. This family's prox-ops work is built directly around producing, and trusting, that relative-navigation estimate.
:::

::: check
During final approach, two independent sensors disagree on relative range by more than their expected tolerance. What should the abort logic do by design, and what principle does that design choice reflect?
:::

::: answer
It should command an automatic abort to a safe, pre-planned retreat path, instead of continuing the approach while the disagreement is investigated. The principle: an abort that turns out to be unnecessary costs a mission delay, while a missed abort during close prox ops risks the vehicle, the station and any crew aboard either one. So the logic is built to fail toward the cheaper mistake whenever a defined trigger condition is met.
:::

::: check
Why can an uncrewed vehicle's fault response accept "the mission is lost" as a bounded, acceptable outcome in a way a crewed vehicle's abort logic cannot?
:::

::: answer
An uncrewed vehicle's worst case is losing hardware and the mission it carried. Analysis can treat that as a probability to keep below some threshold and accept. A crewed vehicle's abort logic exists to give the crew a survivable path out of a failure. So the standard is not "how likely is mission loss" but "does the crew survive even when the mission is lost". That is a different kind of requirement, and it must hold at essentially every phase of flight — not merely be kept unlikely.
:::

::: check
A self-taught candidate builds a rendezvous simulator with real phasing burns and a closed-loop proximity approach. Which part of this family's actual job does that project provide strong evidence for, and which part does it not reach, according to this lesson?
:::

::: answer
It is strong, easy-to-judge evidence for the mathematics and engineering of the job: relative motion, rendezvous guidance and proximity-operations control. It does not reach the experience of writing and defending that analysis to a skeptical outside safety reviewer, on a schedule you do not control. This lesson names that as a skill built on the job itself, which no self-study project can fully provide in advance.
:::

## Summary

| Mission phase | Core problem | Main course module |
| --- | --- | --- |
| Phasing and rendezvous | Closing on a moving target in orbit through a sequence of burns | Relative Motion, Rendezvous & Proximity Operations; Lambert's Problem & Orbit Targeting |
| Proximity operations and docking | Precise relative navigation and closed-loop control to a tight contact tolerance | Orbit Determination; Optimal Control: LQR and LQG |
| Abort | Detecting faults and failing toward safety at every phase | Probability & Statistics (fault-tree and risk reasoning) |
| Deorbit, reentry, splashdown | A small, precisely aimed burn (about $90\ \mathrm{m/s}$ from 400 km) and a capsule's limited-steering descent | Entry, Descent & Landing |
| "Done" for this family | Internal review plus approval by the station program's own safety review | — |

The next lesson leaves single-vehicle flight behind and moves to the constellation side of the map: ADCS on Starlink and Starshield, where the problem is not flying one vehicle well but keeping thousands of satellites pointed correctly, all the time, for years.

::: context iss-speed How fast the station really moves
The ISS orbits roughly 400 kilometers up, at about $7.66\ \mathrm{km/s}$ — around 27,600 kilometers an hour. At that speed it goes all the way around Earth in about 93 minutes, so the crew see roughly 15 or 16 sunrises every day. Dragon has to be moving at almost exactly the same speed, in almost exactly the same direction, before it can creep up and touch the station.
:::

::: context faster-is-slower Why speeding up makes you fall behind
A higher orbit is a bigger circle, and the speed needed to stay on it is actually *lower*. So a forward burn lifts you onto a longer, slower path, and a target on the lower orbit gets ahead of you. To catch up with something ahead of you in orbit, you first drop *lower*, into a faster, shorter lap, and rise again once you have gained enough.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="100" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="120" cy="100" r="55" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="120" cy="100" r="85" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="250" y="60" font-size="12" fill="#1d6fd1">lower orbit:</text>
  <text x="250" y="76" font-size="12" fill="#1d6fd1">shorter, faster lap</text>
  <text x="250" y="120" font-size="12" fill="#b4232c">higher orbit:</text>
  <text x="250" y="136" font-size="12" fill="#b4232c">longer, slower lap</text>
</svg>
```
:::

::: context hold-points Zones around the station
The station is surrounded by imaginary zones, like rings of a fence. NASA uses an **approach ellipsoid** — an egg shape 4 km long and 2 km wide, centered on the ISS — and inside it a **keep-out sphere** 200 m in radius. A visiting vehicle crosses into each zone only after a "go" decision, and pausing at hold points along the way gives time for those decisions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="100" rx="160" ry="80" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="100" r="16" fill="#8fb8f0" stroke="#b4232c" stroke-width="2"/>
  <rect x="174" y="96" width="12" height="8" fill="#1f2a44"/>
  <text x="180" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">approach ellipsoid: 4 km long, 2 km wide</text>
  <text x="180" y="72" font-size="11" text-anchor="middle" fill="#b4232c">keep-out sphere, radius 200 m</text>
  <text x="180" y="132" font-size="11" text-anchor="middle" fill="#1f2a44">ISS</text>
  <text x="70" y="124" font-size="11" text-anchor="middle" fill="#1d6fd1">hold points</text>
  <circle cx="30" cy="100" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="110" cy="100" r="4" fill="#f2b880" stroke="#1f2a44"/>
</svg>
```

The drawing keeps the true proportions: the egg is twice as long as it is wide, and the 200 m sphere is drawn to the same scale as the 4 km egg. The hold-point dots only mark the idea, not real positions.
:::

::: context target-frame Riding along with the station
Engineers often describe the approach from the station's point of view, in a frame that moves with it: one axis points up, away from Earth, and one points along the station's direction of travel. The approaches along those lines have names — **R-bar** (along the radius, from below) and **V-bar** (along the velocity, from ahead or behind). The simplified equations for motion in this frame are the **Clohessy–Wiltshire** equations (said "clo-HESS-ee WILT-shire"), which you will derive in the relative-motion module.
:::

::: context contact-speed How slow is "centimeters per second"?
A slow walk is about $1.4\ \mathrm{m/s}$. The final touch of a docking is roughly ten or more times slower than that — on the order of a few centimeters to about a tenth of a meter per second, depending on the vehicle and docking system. Even so, Dragon and the station each weigh many tonnes, so the latches and springs of the docking ring are built to soak up that last gentle bump.
:::

::: context human-rated What human rating asks for
**Human rating** means a vehicle has been designed, tested and certified as safe enough to carry people. For Dragon, the certifying customer is NASA, through its Commercial Crew Program. Crew Dragon first carried astronauts to the ISS in 2020, on the Demo-2 mission. Human rating asks for more than reliability: it asks for ways for the crew to survive failures, including abort paths, and for evidence that the designers have thought through what could go wrong.
:::

::: context safety-review Why an outside program gets a vote
The ISS is run by NASA together with partner space agencies, and it has people living aboard. Any vehicle that comes close must show the station program that it cannot hurt them, even if something breaks. So the program runs its own safety reviews of visiting vehicles, separate from the builder's reviews. For an engineer, that means your argument has to convince readers who did not work on the design and are paid to be skeptical.
:::

::: context launch-escape Abort starts on the pad
Dragon's abort thinking does not begin at the station. Crew Dragon carries powerful **SuperDraco** engines built into its sides that can push the capsule away from a failing rocket, from the launch pad onward. SpaceX demonstrated this in an in-flight abort test in January 2020, deliberately pulling the capsule away from a Falcon 9 during ascent before any crew flew.
:::

::: context fault-tree Drawing how things go wrong
A **fault tree** starts with one bad outcome at the top, then asks "what could cause this?" and draws the causes below it. **OR** gates mean any one cause is enough; **AND** gates mean all of them must happen together. Adding independent backups turns ORs into ANDs, which makes the top event far less likely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="105" y="10" width="150" height="30" rx="4" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">wrong range used</text>
  <line x1="180" y1="40" x2="180" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="155" y="70" width="50" height="24" rx="12" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">AND</text>
  <line x1="180" y1="94" x2="90" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="94" x2="270" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="130" width="140" height="30" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="90" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">sensor gives bad data</text>
  <rect x="200" y="130" width="140" height="30" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="270" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">cross-check misses it</text>
  <text x="180" y="188" font-size="11" text-anchor="middle" fill="#6c7a93">both must happen for the top event</text>
</svg>
```
:::

::: context retrograde-burn Why about 90 m/s is enough
Prograde means "with the direction of travel"; retrograde means "against it". Slowing down at one point of a circular orbit leaves that point as the new highest point and lowers the opposite side. The **vis-viva** equation, $v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right)$ with Earth's $\mu = 3.986\times10^{14}\ \mathrm{m^3/s^2}$, gives the speeds: with Earth radius $6378\ \mathrm{km}$, $r = 6778\ \mathrm{km}$ and a new orbit whose average radius is $a = 6628\ \mathrm{km}$, the speed drops from $7669$ to $7581\ \mathrm{m/s}$ — a change of about $87\ \mathrm{m/s}$. Air near the new low point then does the rest of the braking.
:::

::: context cg-offset Steering a capsule by being slightly lopsided
Put the heavy things in a capsule a little off-center, and it settles into riding through the air at a steady tilt. Tilted, it gets a little lift — like your flat hand held slightly tilted out of a car window, which the rushing air pushes up. Roll the capsule, and that lift swings to point up, down, left or right, so the thrusters can steer the landing spot without any fins. Apollo capsules used the same trick more than fifty years ago.
:::
