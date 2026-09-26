---
id: l04-the-preferred-list
title: "The GNC Engineer preferred list, item by item"
minutes: 20
covers:
  - the full preferred list for GNC Engineer and what each item signals
---

Imagine a friend who already plays in a band hands you a note before your audition: "We play a lot of blues, some jazz, and we need someone who can read sheet music." Nobody said you must know all three. But now you know what the band actually plays, and you know what to practice before you walk in.

The GNC Engineer posting hands you the same kind of note. The previous lesson took apart the Level I to II posting's **basic** qualifications — the lines that can end an application. It left the **preferred** qualifications alone. This lesson picks them up and reads them line by line. Not as a quick aside about filters and rankings, but as the main subject. This list is unusually specific, and a specific list is worth studying rather than skimming.

Here is the list, word for word:

> Flexible body control, filtering, trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing, fault management, software development, and inertial, optical, ranging and GPS sensor systems; demonstrated project or professional experience in launch vehicle and/or spacecraft systems.

That is ten named technical areas, then a closing clause about how you can show experience in them. As lesson one established, none of it is required. You do not need professional depth in all ten to be a strong applicant. But a list this specific was not written by someone reaching for generic virtues. It was written by people close to the work, and it names that work directly. That makes it the closest thing to a **syllabus** — the list of topics a course will cover — that a posting can hand you before you have spoken to anyone on the team.

## Why this list rewards reading closely

Compare two preferred lists. One says "strong technical background, excellent problem-solving skills." The other is the list above.

The first gives you almost nothing to prepare for. It names no subject. The second names ten real subjects, each with a body of theory and practice behind it. Several of them map directly onto vehicle programs that the earlier module on role families introduced.

Be careful not to overgeneralize. Plenty of postings across the industry are written with far less detail, and treating every preferred list as this information-rich would be a mistake. This one rewards close reading. Once you know how to read a list like it, you can spot a similarly specific list on another posting and treat it the same way.

The ten items fall into five groups. The rest of the lesson takes them one group at a time.

## Dynamics and control: flexible body control, filtering

**Flexible body control** means steering a vehicle whose structure is not perfectly stiff. Think of a long fishing rod. Wave the handle and the tip whips around a moment later. A tall rocket does something similar: its body can bend in slow waves, called **[[bending modes|bending-modes]]**, and the liquid in its tanks can **[[slosh|slosh]]** from side to side. A **control law** — the rule the flight computer uses to decide how to steer — designed as though the body were rigid can push on one of those motions and make it grow. The problem matters most on large, flexible launch vehicles and on spacecraft with big deployed parts such as solar arrays.

**Filtering** here means **state estimation**: taking noisy, incomplete sensor readings and producing a best estimate of where the vehicle is and how it is moving. The famous tool for this is the **[[Kalman filter|kalman]]** and its many variants.

The mathematics behind both lives in the more technical tracks of this course. What matters here is narrower. An interviewer who sees real coursework or project depth in either one is looking for evidence that you can reason about a system whose true state is never measured directly — only inferred.

## Trajectory and mission phase: five items

These five items map almost one to one onto specific phases of flight and specific programs from the role-families module.

- **Trajectory optimization** — finding the best path through all the possible paths a vehicle could fly, while obeying limits like fuel, heating and structural loads. This thread runs through ascent, entry and landing alike.
- **Aerodynamics** — how air pushes on a vehicle. It matters wherever the vehicle flies through a real atmosphere rather than vacuum: climbing through the lower atmosphere on ascent, and any entry phase.
- **[[Rendezvous and proximity operations|rpo]]** — closing the distance to another spacecraft and maneuvering safely near it. This is the signature problem of a capsule meeting a space station, the work the role-families module tied to the Dragon program.
- **Atmospheric entry** — surviving the heating and deceleration of coming back into the air from space.
- **[[Propulsive landing|propulsive-landing]]** — firing engines to fly down to a precise touchdown point.

Entry and landing together make up the return half of a reusable vehicle's flight. The same earlier module tied that work to booster recovery and to Starship.

Nobody expects one candidate to show depth in all five. In a real sense these are different jobs, done by different teams on different vehicles, even inside one company's GNC organization. Real depth in one or two, tied to a specific project you can describe in detail, is a stronger signal than shallow familiarity with all five.

## Systems and reliability: fault management

**Fault management** is the discipline of noticing that a sensor or an **actuator** (a part that moves the vehicle, such as a thruster or a swiveling engine) has failed or is misbehaving, deciding what to do about it, and keeping the vehicle safe or recoverable anyway. Engineers often call it **[[FDIR|fdir]]**. It covers:

- **redundancy management** — carrying spare sensors or actuators and choosing which ones to trust;
- **failure detection and isolation** — spotting that something is wrong and working out which part;
- **graceful degradation** — losing some ability to steer, but in a controlled way, instead of letting one unhandled fault grow into the loss of the vehicle.

Unlike the mission-phase items, this one is not tied to a single program. Every flight vehicle on every program needs some version of it. That makes it one of the most broadly transferable items on the list.

## Software: software development

Notice that "software development" sits on this list as its own item, beside nine deeply specialized ones. That is a deliberate signal.

It says that strong software practice is its own axis of strength. Deriving a control law or a filter equation on a whiteboard is one skill. Writing software that is correct, tested and maintainable is another. The posting does not assume the second comes free with the first.

This matches the basic qualifications you met in the previous lesson, which name two languages outright: C++ and Python. Throughout this role family, the work is understood to be as much a software engineering job as a theory job.

## Sensors: inertial, optical, ranging and GPS

The last technical item names four families of sensor that a navigation or GNC system draws on. A good way to hold them is to ask what each one is good for and where it falls short.

- **Inertial** sensors — accelerometers and gyroscopes, usually packaged together as an **inertial measurement unit**, or IMU (said letter by letter, "I-M-U"). Gyroscopes measure rotation. Accelerometers measure the vehicle's acceleration from every force except gravity. Together they need no outside reference at all. The cost is error that **[[builds up over time|imu-drift]]**.
- **Optical** sensors — cameras and **[[star trackers|star-tracker]]**. They give an outside reference by looking at known things: stars for pointing, or a target vehicle or landing site for relative navigation.
- **Ranging** sensors — radar, lidar and similar devices that measure distance directly. They matter most in proximity operations and precision landing, where distance and closing speed are the whole problem.
- **GPS** — more generally satellite navigation — gives an absolute position and velocity from signals broadcast by a constellation of satellites, wherever the vehicle can see enough of them.

A GNC engineer rarely needs deep expertise in all four. Knowing **[[what each is good for|sensor-grid]]**, and where each alone falls short, is the more realistic and more valuable form of the same knowledge.

## The closing clause: where a project counts

Read the list's last clause as carefully as any technical item: "demonstrated project or professional experience in launch vehicle and/or spacecraft systems."

This is the clearest place in the whole module where a posting says outright that a strong **project** — not only paid work for an employer — counts as real evidence. Be precise about what that means and what it does not.

**What it does not do.** The clause sits under *preferred* qualifications. So it does not override the basic line's "2+ years of professional experience" from the previous lesson. A personal project is not a substitute for that basic line.

**What it does do.** It confirms, in the company's own words, that a serious project is legitimate evidence of exactly the kind this list asks for. Think of a university rocketry team's guidance software, a substantial simulation you built yourself, or a competition entry. Any of these can meaningfully strengthen an application, even when professional experience is thinner than ideal.

::: key
GNC Engineer preferred qualifications: flexible body control, filtering, trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing, fault management, software development, and inertial, optical, ranging and GPS sensor systems; demonstrated project or professional experience in launch vehicle and/or spacecraft systems.
:::

::: key
The closing clause explicitly accepts a demonstrated project as evidence — but under preferred qualifications, strengthening an application's ranking, not under the basic qualification's "2+ years of professional experience" line, which it does not substitute for.
:::

## Turning the list into a study plan

The most useful thing to do with this list is mechanical. Do it on paper, not only in your head.

1. For each item, write down one question an interviewer could plausibly ask to test it.
2. Rate, honestly, how well you could answer that question today, from one to five.

An item rated five needs no more work before an interview. An item rated one or two is not a reason to panic — nobody is expected to be strong across all ten. But it tells you exactly where your account of your own experience is thin. That is far more useful than a vague feeling that you "should know more GNC."

Because preferred items rank candidates and name the subjects the team works on, this rated list is also your study plan for the technical rounds.

::: warning Ten items does not mean ten specialties are expected
No one arrives with deep professional experience in flexible body control, rendezvous, atmospheric entry and propulsive landing all at once. In practice these are different specializations that different engineers on different programs spend whole careers on. Reading the list as a checklist to finish before you apply sets a standard that nobody who applies actually meets.
:::

::: warning A strong project still gets probed in depth
The closing clause welcomes project experience, but it is not a shortcut around understanding the material. A project you raise in an interview will be questioned the way professional work would be: what choices you made, what the alternatives were, what you would do differently. Treat a project as evidence to be examined, not as a credential that ends the conversation once you mention it.
:::

::: example Partial coverage, read honestly
A candidate has two years of professional experience, heavy on fault management and software development. They built failure-detection logic and the test setup around it. They have no professional exposure to rendezvous, atmospheric entry or propulsive landing.

**Step 1 — count honestly.** Against the ten items, two are strong: fault management and software development. The other eight are largely absent. Two out of ten is 20 percent coverage.

**Step 2 — ask what the list is for.** It ranks candidates who already passed the basic line; it is not a second filter. The candidate's two years meet the "2+ years" floor, so this is a viable application.

**Step 3 — match strength to program.** A posting on a program where fault management and software rigor matter most — rather than one built around entry or landing — draws on exactly the strengths this candidate has.

**Step 4 — present it.** Lead with the fault-management and software depth. Do not apologize for mission-phase items that were never asked of one person.

**Sanity check:** the list names specializations spread across many teams, so partial coverage is the normal case, not a weak one.
:::

::: example Turning one item into a prepared answer
Take "filtering."

**Step 1 — write the question.** A plausible one: "Walk me through a time you had to estimate a system's state from noisy or incomplete sensor data. What filter or method did you use, and why that one instead of another?"

**Step 2 — rate candidate A.** A implemented an **extended Kalman filter** — the version adapted to mildly curved, nonlinear problems — for a university project fusing accelerometer and camera data. A has a concrete answer, including a real design choice: the extended filter over a heavier unscented or particle filter. A can defend it by the problem's mild nonlinearity and the limited computing budget. That is a four.

**Step 3 — rate candidate B.** B has only read about Kalman filtering in a textbook. B has real conceptual understanding but nothing to walk an interviewer through step by step. An honest rating is a two.

**Step 4 — find the action.** The gap between a two and a four is exactly the gap a small, concrete project would close before the real interview.

**Sanity check:** the rating measures what you can *explain from experience*, not what you have heard of. That is why A outscores B even if both know the equations.
:::

## Check yourself

::: check
Recite the GNC Engineer preferred qualifications list in full.
:::

::: answer
Flexible body control, filtering, trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing, fault management, software development, and inertial, optical, ranging and GPS sensor systems; demonstrated project or professional experience in launch vehicle and/or spacecraft systems.
:::

::: check
Lesson one said preferred qualifications rank candidates rather than filter them. Why is this particular preferred list worth more than its ranking job?
:::

::: answer
Its formal job is still ranking, not gating — nothing here changes that. What makes it more useful than a vague list is how specific it is. Because it names real technical subjects and real mission phases instead of generic virtues, it doubles as an honest, detailed description of what the team's work involves. That makes it usable as preparation material — a syllabus for the technical rounds — well beyond its formal role in ranking candidates.
:::

::: check
Explain the difference between what the closing clause ("demonstrated project or professional experience...") allows and what the basic qualification's "2+ years of professional experience" line from the previous lesson requires.
:::

::: answer
The closing clause sits under preferred qualifications. It explicitly lets a demonstrated project count as evidence, which strengthens how a candidate ranks among others who already passed the basic filter. The basic line's years requirement is a hard filter, and it asks for professional, employer-based experience specifically. Nothing in the closing clause changes that separate requirement or substitutes for it.
:::

::: check
A candidate has professional experience touching exactly two of the ten named preferred items. Should they expect to be screened out on that basis? Explain.
:::

::: answer
No. Preferred qualifications rank candidates who already meet the basic qualifications; they are not a second filter. No one is expected to be strong across all ten items, because they describe different specializations on different programs. Two items with real depth is a normal, honestly partial showing. The right move is to present that strength plainly, not to treat the other eight as a failure.
:::

::: check
Take the "fault management" item. In your own words, what kind of work does it signal, and why is it more broadly transferable than a mission-phase item like atmospheric entry?
:::

::: answer
It signals work on detecting sensor or actuator failures, deciding how to respond, and keeping the vehicle safe or recoverable despite the failure — redundancy management and graceful degradation instead of an unhandled fault causing the loss of the vehicle. It transfers more broadly because every flight vehicle on every program needs some version of it. Atmospheric entry is one specific phase that matters only for vehicles that come back through an atmosphere.
:::

## Summary

| Group | Items | What it signals |
| --- | --- | --- |
| Dynamics and control | Flexible body control, filtering | Reasoning about a system whose true state must be inferred, not measured directly |
| Trajectory and mission phase | Trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing | Depth tied to a specific vehicle program and flight phase — not all five at once |
| Systems and reliability | Fault management | Broadly transferable across every program |
| Software | Software development | Software engineering as its own axis of strength, not assumed |
| Sensors | Inertial, optical, ranging and GPS sensor systems | Knowing what each sensor type is good for and where each falls short |
| Evidence clause | Demonstrated project or professional experience | A project explicitly counts here — but under preferred, not as a substitute for the basic years line |

The next lesson leaves the Level I to II posting and climbs to Sr. GNC Engineer. There the basic qualification itself splits into three separate routes, including the first of two places in this module where professional experience formally stands in for a degree.

::: context bending-modes Why a tall rocket bends
A launch vehicle is long and thin, like a pencil made mostly of thin-walled tanks. Push on it and it flexes in a smooth curve — its first **bending mode**. The trouble is where the sensors sit. An IMU partway up a bent rocket feels the local tilt of the bend, not the tilt of the whole vehicle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="70" y="20" width="24" height="160" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="82" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">rigid picture</text>
  <path d="M250,20 Q290,100 250,180" fill="none" stroke="#1d6fd1" stroke-width="24" stroke-opacity="0.35"/>
  <path d="M250,20 Q290,100 250,180" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="250" y1="10" x2="250" y2="190" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <rect x="260" y="54" width="14" height="14" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="282" y="65" font-size="11" fill="#1f2a44">IMU</text>
  <line x1="257" y1="20" x2="277" y2="102" stroke="#b4232c" stroke-width="2"/>
  <text x="292" y="112" font-size="11" fill="#b4232c">sensed tilt</text>
  <text x="250" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">first bending mode</text>
</svg>
```

If the control law treats that local tilt as a turn of the whole vehicle, it may push back at exactly the wrong moment and feed the bending. Flexible body control is the craft of steering without doing that.
:::

::: context slosh Sloshing propellant
Carry a full bucket of water while walking fast and you feel the water swing side to side, tugging the bucket one way and then the other. Rocket tanks hold many tons of liquid propellant, and it does the same. That swinging mass pushes on the vehicle at its own natural rhythm. Engineers fit **baffles** — internal rings or plates — to calm it, and control designers model it so their steering does not pump it up.
:::

::: context kalman A filter named after a person
The **Kalman filter** is named after Rudolf Kálmán, who published the method in 1960. Engineers at NASA's Ames Research Center, led by Stanley Schmidt, adapted it soon after for navigation on the Apollo program, and versions of it have flown on spacecraft ever since.

The idea in one sentence: keep a best guess of the state and how unsure you are of it, predict forward with physics, then nudge the guess toward each new measurement — more if the sensor is trustworthy, less if it is noisy. The course's state-estimation modules build it from scratch.
:::

::: context rpo Rendezvous and proximity operations
**Rendezvous** is French for "present yourselves" — a meeting. In spaceflight it means bringing two spacecraft into the same orbit, close together. **Proximity operations** are the careful last stretch: holding position, circling, approaching at centimeters per second. Engineers shorten the pair to **RPO**, said letter by letter, "R-P-O."

Crew and cargo Dragon capsules fly their approach and docking to the International Space Station on their own, using their own sensors and guidance software, with the crew and ground able to step in.
:::

::: context propulsive-landing Landing on engines
Parachutes and wings are the old ways to come home. A **propulsive landing** uses engine thrust instead, slowing the vehicle to nearly zero speed right at the ground. SpaceX first landed a Falcon 9 first stage this way in December 2015, and booster landings have since become routine.

The hard part is guidance: the vehicle must reach zero speed and zero height at the same instant, at a chosen point, with limited fuel and an engine that cannot throttle down very far. That is a trajectory optimization problem solved in flight, which is why these two items sit side by side on the list.
:::

::: context fdir What FDIR stands for
**FDIR** is said letter by letter, "F-D-I-R," and stands for **fault detection, isolation and recovery**:

- *detection* — noticing something is wrong, such as two gyroscopes that disagree;
- *isolation* — working out which part is at fault, often by voting among three or more;
- *recovery* — switching to a backup, changing mode, or moving to a safe state.

Many spacecraft have a **safe mode**: when something unexpected happens, they point their solar arrays at the Sun, keep warm and wait for instructions from the ground. That simple fallback has saved many missions.
:::

::: context imu-drift Why inertial errors grow
An IMU works out position by adding up tiny measured changes, again and again. A tiny error in each reading gets added up too, so the position error keeps growing — the IMU **drifts**. A GPS fix is an outside check that pulls the estimate back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="34" y="30" font-size="11" text-anchor="end" fill="#1f2a44">error</text>
  <path d="M40,140 Q200,130 330,30" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="300" y="26" font-size="11" text-anchor="end" fill="#b4232c">IMU alone</text>
  <path d="M40,140 Q80,136 110,120 L110,138 Q150,134 180,118 L180,138 Q220,134 250,118 L250,138 Q290,134 320,118 L320,138" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="110" y="112" font-size="11" text-anchor="middle" fill="#1d6fd1">GPS fix</text>
  <text x="250" y="112" font-size="11" text-anchor="middle" fill="#1d6fd1">GPS fix</text>
</svg>
```

The shapes are schematic, not real numbers. The point is the pattern: inertial alone wanders off; inertial plus an outside reference stays close. Fusing the two is exactly what the filtering item is about.
:::

::: context star-tracker How a star tracker knows where it points
A **star tracker** is a small camera that photographs the sky and matches the pattern of bright stars against a catalog stored on board — the way you might recognize the Big Dipper. Once it knows which stars it sees, it knows which way the spacecraft is pointing, often to within a few thousandths of a degree or better. It cannot work while blinded by the Sun, Moon or Earth, which is one reason spacecraft carry more than one kind of attitude sensor.
:::

::: context sensor-grid The four sensor families at a glance
Each family answers a different question, and each has a blind spot another one covers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="29" font-size="12" font-weight="700" fill="#1f2a44">sensor</text>
  <text x="85" y="29" font-size="12" font-weight="700" fill="#1f2a44">gives you</text>
  <text x="245" y="29" font-size="12" font-weight="700" fill="#1f2a44">weak spot</text>
  <rect x="10" y="38" width="340" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="10" y="72" width="340" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="10" y="106" width="340" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="10" y="140" width="340" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44">
    <text x="20" y="59">inertial</text><text x="85" y="59">motion, no outside help</text><text x="245" y="59" fill="#b4232c">drifts over time</text>
    <text x="20" y="93">optical</text><text x="85" y="93">pointing, relative view</text><text x="245" y="93" fill="#b4232c">needs a clear view</text>
    <text x="20" y="127">ranging</text><text x="85" y="127">distance, closing speed</text><text x="245" y="127" fill="#b4232c">short reach</text>
    <text x="20" y="161">GPS</text><text x="85" y="161">absolute position</text><text x="245" y="161" fill="#b4232c">needs satellites</text>
  </g>
</svg>
```

That is why real vehicles blend several at once: each covers another's weak spot.
:::
