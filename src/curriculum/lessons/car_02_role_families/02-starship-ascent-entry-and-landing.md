---
id: l02-starship-ascent-entry-and-landing
title: "Starship: ascent, entry, and landing control"
minutes: 22
covers:
  - "GNC Engineer (Starship): ascent, entry and landing control, 6-DOF simulation, flight control of the largest vehicle ever flown"
---

Think about the difference between steering a bicycle and steering a long bus. The rules are the same — turn the wheel, the vehicle turns. But the bus is heavier, slower to respond, and it flexes and sways in ways a bike never does. Everything that was easy on the bike needs care on the bus.

**Starship** is SpaceX's giant rocket, and it is **[[the largest vehicle ever flown|largest-vehicle]]**. Size does not stay out of the steering problem. A bigger vehicle bends more under its own engine thrust and the push of the air. Its natural wobbles — its **[[structural modes|structural-modes]]** — sit closer to the speeds at which the control software works. Its actuators must move more mass to turn it by the same amount. And the gap between "the control law works" and "the control law shakes the vehicle at a wobble it was never told about" gets thinner, not wider.

GNC Engineer postings on this program describe a job built around three flight phases: **ascent** (going up), **entry** (coming back through the atmosphere) and **landing**. They single out two things as the distinguishing control problems: entry and the **landing flip**. Take that at face value. Those are the moments where Starship's control problem looks least like anything a smaller, ordinary rocket has to solve.

This lesson grounds that posting language. What does each phase demand? What does an engineer in this seat produce in a normal week? Which parts of this course prepare you for it? It ends with an honest word on how hard this family is to break into from self-study — because it is one of the harder ones, and pretending otherwise would not help you.

## Three phases, three different control problems

### Ascent: the most familiar

**Ascent** is the one every orbital rocket must solve in some form. Get off the pad. Fly through the part of the climb where the air pushes hardest — called **max-q**, "max Q", the moment of maximum **dynamic pressure** — without bending the vehicle too much or letting its nose swing too far from the direction of travel. Separate the stages cleanly. Keep control if an engine fails, the **[[engine-out|engine-out]]** case.

It is a real control problem, but it has the deepest pile of past experience behind it. The techniques from this course's ascent and orbital-insertion guidance work apply here almost directly.

### Entry: where Starship is different

Most capsules come home like a thrown stone, with only a little steering. Starship does not. It flies a controlled, lifting descent, falling mostly on its side. People often call this the **[[belly-flop|belly-flop]]**.

To steer, it uses **body flaps** — large hinged panels near the nose and tail — as its main control surfaces. The flaps manage three things:

- the **angle of attack**: how steeply the vehicle is tilted into the oncoming air;
- the **bank**: how far it is rolled to one side, which tilts its lift sideways;
- the **lift-to-drag ratio**: how much sideways lift the vehicle makes compared with how much drag slows it. More lift stretches the range; more drag slows it faster but heats it more.

This is genuinely **nonlinear** control: doubling a flap angle does not double its effect, and the effects are **coupled** — one flap move changes several things at once. It also crosses very different speed ranges, from **[[hypersonic through transonic|mach-regimes]]**. Over that journey, the vehicle's own aerodynamic behavior changes enormously. A model built for one speed range does not safely carry over to another.

### Landing: the flip and the burn

**Landing** starts with the **flip**. In the last tens of seconds before touchdown, the vehicle rotates from its nearly horizontal, high-drag belly-flop attitude to standing upright. It relights its engines and completes a **landing burn** — a final push of rocket thrust that slows it to a gentle touchdown.

The flip is a hard control-allocation problem, which the next section unpacks. The landing burn needs the same precise **powered-descent guidance** that this course's convex-optimization guidance work is built around. But it must be adapted to a vehicle with a different mass, a different way its exhaust interacts with the ground, and a different structural response than the boosters that pioneered the technique.

::: key
GNC Engineer (Starship): ascent, entry and landing control, 6-DOF simulation, and flight control of the largest vehicle ever flown. Entry and the landing flip are what SpaceX's own postings single out as the distinguishing control problems on this program.
:::

## The flip, as a control-allocation problem

"The vehicle rotates" undersells the flip. It is a clean example of a problem type that shows up across atmospheric flight: **control allocation** — deciding how to share a job among several actuators — when those actuators' strength is changing in opposite directions at the same time.

Picture two friends carrying a heavy couch down the stairs. One is getting tired and weaker with every step. The other has not picked up their end yet. The couch has to keep turning around a corner the whole time. Handing the weight from one friend to the other at exactly the right moment is the whole trick.

### Why the flaps fade

A flap's strength — its **control authority**, meaning how much force or twist it can produce — depends on how hard the air is pushing on it. That push is measured by the **dynamic pressure**, written $q$:

$$
q = \tfrac{1}{2}\rho v^{2}
$$

Here $\rho$ (the Greek letter "rho") is the air **density** in kilograms per cubic meter, and $v$ is the airspeed in meters per second. The result is in pascals (Pa), a unit of pressure.

Notice the square on $v$. Speed counts twice. Take air with $\rho = 1.0\,\mathrm{kg/m^3}$, a little thinner than at sea level:

- at $v = 300\,\mathrm{m/s}$: $q = \tfrac{1}{2} \times 1.0 \times 300^2 = 45{,}000\,\mathrm{Pa}$;
- at $v = 100\,\mathrm{m/s}$: $q = \tfrac{1}{2} \times 1.0 \times 100^2 = 5{,}000\,\mathrm{Pa}$.

Slowing to a third of the speed leaves one ninth of the dynamic pressure, since $45{,}000 / 5{,}000 = 9 = 3^2$. That is the square doing its work.

So as the vehicle slows in the lower atmosphere, $v$ drops sharply and $q$ drops faster. The flaps lose authority exactly when the vehicle needs its most aggressive attitude change of the whole flight.

### Why the engines take over

The engines are the opposite. They have essentially no useful authority until they light for the landing. Then they become the main — and eventually the only — way to steer, by swiveling (**gimbaling**) and changing thrust.

So the control law is not choosing between two actuators. It is managing a **handoff** between two actuators whose authority curves cross each other. The rotation must finish, and the burn must start, inside a narrow window of altitude and speed, with very little room to wait and see.

### Getting the timing wrong

- **Flip too early**, while the flaps still have authority and the burn is not yet needed: the vehicle burns through altitude, and propellant, it cannot get back.
- **Flip too late**: the vehicle runs out of flap authority and altitude at the same time, with no actuator yet strong enough to save it.

The control law must reason about each actuator's authority as a function of the trajectory itself, not as a fixed property of the vehicle. That is exactly the kind of nonlinear, trajectory-coupled problem this course's Nonlinear Control and powered-descent guidance modules train you to reason about with mathematics rather than gut feeling. The picture of the whole sequence is in the note on [[the flip handoff|flip-handoff]].

::: warning Entry aerodynamics do not transfer from a subsonic control course
A control law tuned on a simplified, straight-line (linearized), **subsonic** aerodynamic model — one built for speeds below the speed of sound — tells you nothing trustworthy about hypersonic or transonic entry. There, the aerodynamic coefficients themselves are strong, nonlinear functions of Mach number and angle of attack. Treat entry as its own regime with its own aerodynamic database, not as "the same control problem, only faster."
:::

## A week in this seat, and what it produces

An engineer in this family spends real time on several recurring activities, not one uniform task.

- **Fixing a tail case.** A Monte Carlo campaign — thousands of simulated flights, each with slightly different random conditions — turns up a **[[tail-case failure|tail-case]]**: a small share of runs, with some unlucky mix of air density, sensor noise and actuator response, that missed a landing-accuracy or structural-margin requirement. The fix must be re-derived, re-coded and re-run against the whole campaign before anyone trusts it.
- **Chasing a divergence.** A 6-DOF simulation **regression run** (re-running old tests to see if anything broke) goes wrong after an unrelated model update. The job is to tell "the vehicle model changed underneath the control law" apart from "the control law has a real bug". That is its own debugging discipline.
- **Writing a design memo.** A change to a flap's deflection limit must be justified in a **[[design memo|design-memo]]**, precisely enough that a reviewer who was not in the room can judge the argument on its own.
- **Preparing a flight readiness review.** A chart must say honestly what has and has not been checked, and with what confidence.
- **Sitting on console.** During a test flight, someone from this family is very often watching live telemetry against prediction, ready to say something useful if the two start to disagree.

What does "done" mean? The same shape runs through all of it. A design is not done because it flew once in simulation. It is done when:

1. it survives a Monte Carlo campaign at a stated success rate;
2. it passes review by engineers who did not write it;
3. after a real flight, its prediction is checked against real telemetry in a **post-flight reconstruction**.

A mismatch in step 3 is not a failure to hide. It is the next analysis task. Closing that gap is how the simulation and the real vehicle grow closer over successive flights.

::: example A tail-case failure, followed end to end
A Monte Carlo campaign flies 5,000 simulated entries. Each run varies the atmospheric density profile, the starting attitude error and the flap actuator response. The result: 98 percent meet the landing-accuracy requirement.

Step 1 — count the failures. $2\%$ of $5{,}000$ is $0.02 \times 5{,}000 = 100$ runs.

Step 2 — look for a pattern. The 100 failures are not spread evenly. They **cluster** around runs with unusually thin air combined with a slow flap actuator near the start of the flip.

Step 3 — decide whether 98 percent is good enough. The engineer does not accept it on its own. Finding a cluster like this is the campaign's whole job, because a cluster points to a real, findable cause. Failures scattered evenly would not.

Step 4 — trace the cause. The flip's timing logic was tuned around a normal-speed actuator. In the slow-actuator tail, that assumption fails.

Step 5 — fix the logic, not the case. A new timing law reasons about flap authority directly instead of following a fixed schedule. It is derived, coded into the simulation, and flown against the same 5,000-run campaign.

Step 6 — independent review. Another engineer checks the derivation and the code separately.

Step 7 — clear the bar. Only when the full campaign passes its threshold, with the cluster gone, does the change move toward flight software and, later, a flight readiness review.

Sanity check: nothing was fixed by re-running the one case that failed. It was fixed by understanding why a whole group failed and changing the logic that caused it.
:::

::: example Two engineers, two different Tuesdays, same family
Engineer A spends the morning in a derivation. She reworks the entry guidance law's angle-of-attack command as a function of dynamic pressure and range-to-go (the distance still left to fly). She spends the afternoon defending it on a whiteboard in a design review, to two engineers who did not help write it.

Engineer B spends the same day almost entirely in flight software. A guidance update is taking longer than its allowed **[[cycle time|cycle-time]]** on the flight computer. He **profiles** the code (measures where the time goes), finds the slow function, and rewrites it to fit its real-time budget without changing its numerical output.

Both are doing Starship GNC work. Neither would describe the day the same way, which is why "I want to do GNC" undersells what is being asked of you, even inside one family.
:::

## Where this pulls from the curriculum

- **The vehicle model:** Rigid Body Dynamics, and Atmospheric Flight & Vehicle Aerodynamics.
- **The entry phase itself:** Entry, Descent & Landing.
- **Guidance derivation:** Trajectory Optimization, plus Convex Optimization for Guidance (Powered Descent) for the landing burn.
- **The flip's changing-authority allocation problem:** Nonlinear Control.
- **The simulation the whole family depends on:** 6-DOF Simulation Architecture, with the campaigns run against it in Verification, Validation & Monte Carlo Analysis.
- **Turning a derived law into code that meets a real-time budget:** Real-Time & Embedded Systems, Flight Software Architecture & Fault Tolerance, and Modern C++ for Flight and Simulation.

Against the six generic categories from the previous lesson, this family sits heavily in **mission design**, **flight software**, and **simulation and V&V**. **Hardware-in-the-loop and test** rises sharply as a real flight approaches. **Analysis** runs through nearly everything.

**Navigation and sensors** is present but usually not owned here. This family more often *uses* a navigation solution to fly its guidance law than *derives* that solution. Exactly where that line sits varies by team and by employer; it is not one fixed rule.

## An honest word on how hard this family is to break into

This is one of the two or three hardest families in this module to become interview-ready for through self-study alone. Here is why.

First, it asks for two different kinds of depth at once: real nonlinear and atmospheric flight-dynamics theory, *and* real production-quality, real-time software skill. Most self-taught paths build one and neglect the other.

Second, much of what separates a strong candidate from an enthusiastic one is **[[tacit judgment|tacit-knowledge]]**: a feel for which failure modes are boring and which are dangerous. That feel is built from watching real Monte Carlo campaigns and real flight anomalies, which is hard to copy outside a job with real flights to learn from.

None of that closes the door. It changes what counts as convincing evidence. A toy PID controller — the simplest standard feedback controller — balancing a simulated pendulum does not reach this bar. A real 6-DOF entry-and-landing simulation that you built yourself — with an honest Monte Carlo campaign and a design memo like the ones above — does. It does not match the real vehicle's scale. It matches its discipline: derive, implement, test against dispersion, write down what you found. That is a project measured in months, not a weekend, and this course's later modules are built to get you there.

## Check yourself

::: check
Name the three flight phases this lesson organizes Starship GNC work around, and say in one sentence what makes entry different in kind, not only in difficulty, from ascent.
:::

::: answer
Ascent, entry and landing. Ascent is the most conventional: ordinary powered flight through a well-understood load environment, with deep past experience from other rockets. Entry is different in kind because the vehicle flies a controlled, lifting descent through a hypersonic-to-transonic range where its own aerodynamic behavior changes enormously, steering with body flaps rather than engines — a fundamentally different actuation and dynamics problem, not a faster version of ascent.
:::

::: check
Explain why the landing flip is a control-allocation problem, and not merely "a rotation the vehicle has to perform".
:::

::: answer
The flip must hand authority between two sets of actuators whose strength moves in opposite directions across the same window. The body flaps depend on dynamic pressure, $q = \tfrac{1}{2}\rho v^2$, so they weaken as the vehicle slows. The engines have almost no authority until they light for the landing burn, and then they dominate. The control law has to share the rotation across actuators whose authority depends on the trajectory itself, not on a fixed property of the vehicle. It must also get the timing right against both a shrinking window of flap authority and an altitude budget that does not forgive waiting too long to commit to the burn. That coupling between changing authority and trajectory timing is what makes it a control-allocation problem rather than a plain rotation.
:::

::: check
A Monte Carlo campaign for an entry guidance law returns a 97 percent success rate, with the 3 percent of failures scattered with no visible pattern rather than clustered. Should the engineer treat it the same way as a clustered failure? Why or why not?
:::

::: answer
Not the same way. A clustered failure, tied to a specific combination of conditions, usually points to a findable cause — a piece of logic that misbehaves under a specific condition — that can be diagnosed and fixed, as the slow-flap-actuator example in this lesson was. Failures scattered with no pattern are more likely the genuine statistical tail of an otherwise sound design, or possibly a modeling problem in the campaign itself. Chasing them as though they shared one root cause can waste real effort. Either way, the first step is to establish whether a pattern actually exists, not to assume one and go looking for it.
:::

::: check
Name at least four of this course's modules that a Starship GNC engineer's work draws on directly, and say which flight phase or activity each supports.
:::

::: answer
Entry, Descent & Landing supports the entry phase's aerodynamic control. Convex Optimization for Guidance (Powered Descent) supports the landing burn's guidance derivation. Nonlinear Control supports the flip's changing-authority control-allocation problem. 6-DOF Simulation Architecture supports the simulation every phase is tested against. Real-Time & Embedded Systems and Flight Software Architecture & Fault Tolerance support turning any of these laws into flight code that meets its timing budget. Any four, correctly matched to what they support, answers the question.
:::

::: check
This lesson calls Starship GNC one of the harder families to become interview-ready for through self-study. Give the two reasons it names, and describe what a self-study project must look like to address them.
:::

::: answer
First, the family needs real depth in two areas at once — nonlinear, atmospheric flight-dynamics theory and production-quality real-time software — which most self-taught paths develop unevenly. Second, part of what marks a strong candidate is tacit judgment about failure modes, built from real Monte Carlo campaigns and real flight anomalies that are hard to reproduce outside a flight program. A project that addresses this is not a toy single-axis controller. It is a real 6-DOF entry-and-landing simulation, built end to end, run through an honest Monte Carlo dispersion campaign, and written up like a design memo — because that sequence, more than the size of the vehicle modeled, is what the evidence has to show.
:::

## Summary

| Phase | Core control problem | Main actuator | Course module most directly tested |
| --- | --- | --- | --- |
| Ascent | Stay within structural and angle-of-attack limits through max-q; handle staging and engine-out | Engine gimbal and throttle | Ascent & Orbital Insertion Guidance |
| Entry | Manage angle of attack, bank and lift-to-drag through a hypersonic-to-transonic regime | Body flaps | Entry, Descent & Landing |
| Flip and landing | Hand authority from fading flaps to rising engines; fly a precise powered-descent burn | Flaps, then engine gimbal and throttle | Nonlinear Control; Convex Optimization for Guidance (Powered Descent) |

| Idea | In one line |
| --- | --- |
| Dynamic pressure | $q = \tfrac{1}{2}\rho v^2$; a third of the speed leaves a ninth of the $q$ |
| Flap authority | Scales with $q$, so it fades as the vehicle slows |
| "Done" | Survives a Monte Carlo campaign, passes independent review, matches post-flight telemetry |

The next lesson stays with vehicle families but moves to a very different program: Falcon, a mature, high-flight-rate version of entry and landing, where the job splits openly into an algorithm-focused role and a flight-software-focused one.

::: context largest-vehicle How big is "largest"?
Stacked on its Super Heavy booster, Starship stands roughly 120 meters tall — the exact figure grows a little with each new version. The Saturn V that carried astronauts to the Moon was about 111 meters. A Falcon 9 is about 70 meters. Starship is also the most powerful rocket ever flown, with dozens of engines firing together on the booster.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="175" x2="340" y2="175" stroke="#1f2a44" stroke-width="2"/>
  <rect x="60" y="91" width="50" height="84" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="155" y="42" width="50" height="133" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="250" y="30" width="50" height="145" fill="#1d6fd1" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="84">about 70 m</text><text x="180" y="35">about 111 m</text><text x="275" y="23">roughly 120 m</text>
    <text x="85" y="191">Falcon 9</text><text x="180" y="191">Saturn V</text><text x="275" y="191">Starship stack</text>
  </g>
</svg>
```
:::

::: context structural-modes Rockets that wobble
Twang a ruler held over the edge of a desk and it vibrates at its own favorite speed. Every structure does this. Those natural patterns of bending and vibrating are its **structural modes**. A tall, thin rocket has modes too, and the bigger it is, the slower they wobble. If the control system pushes back and forth at close to one of those speeds, it can pump the wobble up, like pushing a swing at the right moment. Engineers filter the sensor signals and shape the control law so the controller does not feed a mode it was never told about.
:::

::: context engine-out When an engine quits
**Engine-out** means one engine shuts down or fails during flight. A rocket with many engines can often still reach its goal on the rest, but the thrust is now uneven. The dead engine leaves a gap, so the vehicle wants to twist toward it. The control system must notice, rebalance the remaining engines' gimbal angles and throttle, and replan the trajectory for less thrust. Designing for this case is part of the ascent job.
:::

::: context belly-flop Falling like a skydiver
A skydiver who spreads out flat falls much slower than one diving head first, because a big flat body makes a lot of drag. Starship uses the same trick. It falls mostly horizontal, belly toward the ground, so its broad side slows it down. Four flaps, two near the nose and two near the tail, act like a skydiver's arms and legs: moving them tilts and rolls the body. That lets the vehicle steer while it falls, and it is why the belly-flop needs real control, not only a heat shield.
:::

::: context mach-regimes Hypersonic, transonic and the rest
The **Mach number** is your speed divided by the local speed of sound; Mach 1 means you are at the speed of sound. Engineers name the ranges. **Subsonic** is below about Mach 0.8. **Transonic** is roughly Mach 0.8 to 1.2, where shock waves form and vanish and the air behaves badly. **Supersonic** is above that. **Hypersonic** usually means above about Mach 5, where the air is heated so much it glows. An entering vehicle crosses all of these in minutes, and the forces on it change character at each step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="40" height="24" fill="#8fb8f0"/>
  <rect x="60" y="30" width="20" height="24" fill="#b4232c"/>
  <rect x="80" y="30" width="190" height="24" fill="#1d6fd1"/>
  <rect x="270" y="30" width="70" height="24" fill="#f2b880"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="54" x2="20" y2="62"/><line x1="70" y1="54" x2="70" y2="62"/><line x1="270" y1="54" x2="270" y2="62"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="76">0</text><text x="70" y="76">1</text><text x="270" y="76">5</text>
    <text x="180" y="96">Mach number</text>
    <text x="40" y="22">sub</text><text x="72" y="22">trans</text><text x="175" y="22">supersonic</text><text x="305" y="22">hypersonic</text>
  </g>
</svg>
```
:::

::: context flip-handoff The flip, drawn out
From left to right: the vehicle falls belly-first and the flaps steer; as it slows, the flaps fade; the engines relight and swing it upright; the landing burn brings it down. The nose is on the left of each drawing, so the engine end swings down during the flip.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="142" x2="350" y2="142" stroke="#6c7a93" stroke-width="2"/>
  <path d="M 20 24 Q 200 40 300 96" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <rect x="28" y="25" width="44" height="10" rx="4" fill="#8fb8f0" stroke="#1f2a44" transform="rotate(0 50 30)"/>
  <rect x="108" y="43" width="44" height="10" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="198" y="65" width="44" height="10" rx="4" fill="#8fb8f0" stroke="#1f2a44" transform="rotate(45 220 70)"/>
  <polygon points="232.1,89.1 239.1,82.1 244.1,94.1" fill="#f2b880"/>
  <rect x="278" y="95" width="44" height="10" rx="4" fill="#8fb8f0" stroke="#1f2a44" transform="rotate(90 300 100)"/>
  <polygon points="295,122 305,122 300,136" fill="#f2b880"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="160">belly-flop</text><text x="220" y="160">flip</text><text x="300" y="160">landing burn</text>
  </g>
  <g font-size="11" text-anchor="middle">
    <text x="90" y="178" fill="#1d6fd1">flaps strong</text><text x="220" y="178" fill="#b4232c">handoff</text><text x="300" y="178" fill="#1d6fd1">engines only</text>
  </g>
</svg>
```
:::

::: context tail-case Living in the tail
Line up all the Monte Carlo runs from best to worst. Most crowd in the middle and pass easily. The few at the far worst end are the **tail**. A tail case is a rare run, where several unlucky things happened at once, that fails a requirement. The real vehicle will one day meet an unlucky combination too, so engineers study the tail more than the middle. A requirement usually states the success rate to reach and how confident the team must be in it, which drives how many runs a campaign needs.
:::

::: context design-memo The design memo
A **design memo** is a short written argument for one engineering decision: what is being changed, why, what evidence supports it, what was considered and rejected, and what risks remain. It is written so a reader who was not in the room can check the reasoning alone. Memos become the organization's memory: years later, someone can find out why a limit is set where it is. Writing a clear one is a skill interviewers look for, and a self-study project written up this way stands out.
:::

::: context cycle-time A deadline many times a second
Flight software runs in repeating **cycles**. In each cycle, the computer reads the sensors, runs navigation, guidance and control, and sends commands to the actuators — then starts again. The time allowed for one cycle is fixed, and many cycles happen every second. If the guidance code takes too long, it misses its deadline, and a late answer can be as bad as a wrong one. That is why "real-time" software is judged on timing as well as on numbers.
:::

::: context tacit-knowledge Knowledge you cannot write down
**Tacit** knowledge is know-how that is hard to put into words: the way a mechanic hears a bad bearing, or a doctor senses a patient is sicker than the numbers say. In GNC it is the feel for which odd plot is harmless and which is the first sign of trouble. It comes from exposure, not reading. Self-study can partly stand in for it by studying published flight anomalies and reports on real flights, and by running your own dispersion campaigns until you know their patterns.
:::
