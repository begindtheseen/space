---
id: l05-adcs-attitude-control-by-the-thousand
title: "ADCS: attitude control across a fleet, not a flight"
minutes: 21
covers:
  - "GNC Engineer, ADCS (Starlink and Starshield): attitude determination and control, reaction wheels, torque rods, momentum management"
---

Think about the difference between a race car driver and the people who keep a city's traffic lights working. The driver has one car and one race. It ends, and it either went well or it did not. The traffic-light team has thousands of lights, running day and night, for years. Nobody checks each light every morning. Their work has to keep being right on its own.

Every family in the last three lessons was a race car driver. Each was built around one vehicle flying one mission, however many times that mission repeats. Starship flies, lands or does not, and the flight ends. A Falcon booster does the same, then flies again as a new, separately tracked mission. Dragon's rendezvous ends when it docks or aborts.

This lesson's family is the traffic-light team. It is **ADCS** — said letter by letter, "A-D-C-S" — which stands for **attitude determination and control system**. **[[Attitude|attitude-word]]** means which way a vehicle is pointing. ADCS postings on **Starlink** (SpaceX's internet satellites) and **[[Starshield|starshield]]** describe a job with no ending. A communications satellite has no single flight to succeed or fail at. It has years of continuous operation with nobody watching it moment to moment, repeated across a large fleet of satellites at different ages. The control law an ADCS engineer owns has to keep working correctly the whole time, on every one of them, without anyone rechecking it each morning.

That shift — from "does this control law work for this flight?" to "does it keep working, correctly, on thousands of satellites, indefinitely?" — is the big idea of this lesson. It is also why this family needs different evidence from the vehicle families. We will cover what attitude determination and control means, why reaction wheels and torque rods come as a pair, what a week looks like at fleet scale, and how hard this family is to reach through self-study.

## What ADCS owns, and where it overlaps with navigation

"Attitude determination and control" names two problems that sit side by side. Keep them apart in your head.

- **Determination** is knowing which way the satellite is pointing right now. It comes from sensor measurements that are noisy, late and incomplete. Think of guessing which way you face with your eyes half closed, from a few glimpses.
- **Control** is deciding what to tell the **actuators** — the parts that push or twist the satellite — to do about it, given the estimated attitude and a target attitude to reach or hold.

SpaceX's posting language for this family names both. The next lesson covers Navigation and State Estimation, a family whose postings *also* mention attitude determination — the deeper sensor and estimation-theory side of it.

So which family owns attitude determination? Honestly, both do, in different amounts. Where the line falls varies by team and by employer; there is no universal rule. In practice, an ADCS engineer typically works with an attitude estimate good enough to close the control loop reliably. That means running and tuning the onboard **filter** — the software that turns raw sensor data into a usable attitude answer. A deeper dig into sensor **calibration** (correcting a sensor's built-in errors), alignment errors or a brand-new estimation method more often goes to the navigation family.

Do not treat this as a hard boundary. It is a center of gravity for each family, not a wall between them. A real posting can sit closer to one side or the other, depending on how that team is organized.

::: key
GNC Engineer, ADCS (Starlink / Starshield): attitude determination and control for satellites — reaction wheels, magnetic torque rods, momentum management and desaturation, and pointing budgets held across thousands of vehicles rather than one.
:::

A **pointing budget** is the list of every small error that adds up to how far off-target the satellite may point, with a share of the allowed total given to each — like splitting a spending budget between rent and food.

## Reaction wheels, torque rods, and why one exists because of the other

### Reaction wheels

Sit on a spinning office chair holding a spinning bicycle wheel. Tilt or brake the wheel, and your chair starts to turn the other way. That is a **[[reaction wheel|reaction-wheel]]** in a nutshell.

A reaction wheel is a heavy spinning disk inside the satellite. Spinning it faster or slower trades **angular momentum** — the "amount of spin" — with the satellite body. That makes a **reaction torque**, a twist that turns the satellite the opposite way, without using any propellant.

A wheel's stored momentum is

$$
H = I\omega
$$

Read it as "H equals I omega". Here $H$ is the stored angular momentum, in newton-meter-seconds ($\mathrm{N\,m\,s}$). $I$ is the wheel's **[[moment of inertia|moment-of-inertia]]** — how hard it is to spin up — in $\mathrm{kg\,m^2}$. And $\omega$ (the Greek letter omega) is its spin rate, in radians per second.

A satellite typically carries [[three or four wheels|three-or-four-wheels]], arranged so their combined momentum can be pointed along any body axis. Wheels are precise, quick to respond and need no propellant. That is why they are the main actuator for fine attitude control. It is also why they have one weakness that makes them not enough on their own.

### The weakness: saturation

A satellite in orbit feels small, steady outside twists, called **[[disturbance torques|disturbance-torques]]**:

- **solar radiation pressure** — sunlight itself pushes very gently, and unevenly on a lopsided spacecraft;
- leftover **aerodynamic drag** from the thin air still present in low Earth orbit;
- **gravity gradient** — Earth pulls slightly harder on the nearer end of the satellite.

Random noise is something a filter can average away. Much of this disturbance is different: it is **secular**, meaning it pushes the same way, orbit after orbit, instead of canceling out.

To hold the satellite steady against a secular twist, a wheel has to keep spinning faster and faster. But a wheel's momentum capacity is finite. Left alone, the wheel eventually **saturates** — reaches its top spin rate. It then cannot produce any more useful torque in that direction, and the satellite starts to lose attitude control on that axis. Picture a bucket catching a steady drip: sooner or later it is full.

### Torque rods: the way to empty the bucket

**Magnetic torque rods** solve exactly this problem, and no other. A torque rod is a coil of wire. Drive a controlled current through it and it becomes an electromagnet with a **magnetic dipole moment** $\mathbf{m}$ — how strong a magnet it is, and which way it points. Against [[Earth's magnetic field|earth-field]] $\mathbf{B}$ at that spot, it feels a torque

$$
\boldsymbol{\tau} = \mathbf{m} \times \mathbf{B}
$$

Read it as "tau equals m cross B". The $\times$ is a **[[cross product|cross-product]]**, and it has one important consequence: the torque is always perpendicular to the local field. At any single instant, you cannot point it in any direction you like.

But as the satellite moves around its orbit, the field's direction, seen from the satellite, swings through a wide range of angles. Averaged over enough of an orbit, the torque rod can steadily bleed stored momentum back out of the wheels. This is **desaturation**, also called **momentum dumping**.

For this family it is a continuous, never-finished task, with no real match in the vehicle families. It never ends because the disturbance torques causing it never stop.

::: warning A torque rod is not a substitute for a reaction wheel
At any instant, a torque rod's usable torque direction is limited by the local magnetic field. So it cannot give precise control about any axis you choose, the way a wheel can. Torque rods manage the wheels' momentum over time; they do not replace fine pointing control. A design that tries to fly precision attitude control on torque rods alone is solving the wrong problem with the wrong actuator.
:::

::: example A wheel saturating, worked through with real numbers
Take a reaction wheel that can store at most $H_{\max} = 0.5\ \mathrm{N\,m\,s}$. It is absorbing a roughly constant secular disturbance torque of $\tau_d = 200\ \mu\mathrm{N\,m}$ (micro-newton-meters, millionths of a newton-meter) along its axis. That is a reasonable size for a satellite with large flat solar arrays catching solar radiation pressure and leftover drag.

**Step 1 — the idea.** Torque is how fast momentum builds up. A steady torque adds the same momentum every second. So the time to fill the wheel is its capacity divided by the torque:

$$
t_{\text{sat}} = \frac{H_{\max}}{\tau_d}
$$

**Step 2 — convert micro to plain units.** $200\ \mu\mathrm{N\,m} = 200 \times 10^{-6}\ \mathrm{N\,m}$.

**Step 3 — divide.**

$$
t_{\text{sat}} = \frac{0.5}{200 \times 10^{-6}} = 2500\ \mathrm{s}
$$

**Step 4 — into minutes.** $2500 / 60 \approx 42$ minutes.

**Step 5 — compare with an orbit.** A satellite in a roughly 550-kilometer circular orbit goes around once in about 96 minutes. So this wheel, left alone, would saturate in under half an orbit.

Sanity check on units: $\mathrm{N\,m\,s}$ divided by $\mathrm{N\,m}$ leaves seconds, as a time should.

What it means: momentum management here is not an occasional chore. It is a standing requirement the control system must meet essentially all the time, every orbit, for as long as the satellite works. That arithmetic is why "momentum management and desaturation" is named explicitly, and separately, in this family's postings.
:::

## A week at fleet scale

The unit of work in this family is rarely "this one satellite".

An ADCS engineer spends real time watching **fleet-wide dashboards** — screens that summarize every satellite — of momentum buildup, how often each satellite desaturates, and pointing performance. The engineer is looking for a satellite, or more tellingly a **cluster** of satellites, whose numbers have drifted from the fleet's normal pattern.

When a **control mode** (one set of rules for how the satellite points and moves) is changed, the change is developed and checked not against one unit but against a **representative sample**: a group spanning different ages and orbital conditions across the fleet. A mode that works on a brand-new satellite is not automatically proven on one whose wheels have years of wear.

Once checked, the change is [[rolled out as a software update|fleet-rollout]] across the fleet, with monitoring afterward to catch anything the sample missed.

Some postings in this family sit under Starshield instead of Starlink. It is the same attitude-control problem, serving a different, more restricted program. Less is publicly documented about it, and, as the previous module in this track explained, a role may carry its own security-clearance requirement on top of ordinary eligibility.

::: example A cluster, not a single anomaly
A fleet-health dashboard flags a group of satellites. Over the past several weeks, their desaturation events have become noticeably more frequent than the fleet average.

**Step 1 — one or many?** One satellite behaving this way might be an isolated hardware problem: a wheel wearing out, or a sensor drifting out of calibration. A *cluster* behaving the same way points somewhere more systemic, especially if the members share something. Same launch batch? Same orbital plane? The same attitude mode recently rolled out to them?

**Step 2 — find what they share.** Suppose the affected satellites share a recently updated pointing mode, rolled out to part of the fleet before the rest.

**Step 3 — ask the right question.** Is the new mode commanding a slightly less momentum-efficient attitude than the old one? There are two possible answers:

- a **deliberate trade** — the mode accepts a small, known cost in desaturation frequency in return for some other benefit it was designed to deliver; or
- an **unintended inefficiency** that nobody accounted for.

**Step 4 — act on the answer.** A deliberate, understood trade gets documented and monitored. An unintended inefficiency gets fixed before the mode reaches the rest of the fleet.

Sanity check on the method: could you have asked this from one satellite's data? No. The fleet-wide pattern is what made the question askable in the first place.
:::

## Course links, and where this family sits

The physics this family runs on lives in several modules of this course:

- **Rigid Body Dynamics**, for the satellite as a spinning, tumbling solid body.
- **Attitude Representations** and **Attitude Kinematics & Rotational Dynamics**, for describing and moving orientation in three dimensions. That means [[quaternions|quaternions]] and their kinematics — not a simplified one-axis version.
- **Classical Feedback Control Design** and **State-Space Control**, for the core wheel and torque-rod control loops.
- **Optimal Control: LQR and LQG**, where a mode is designed against a stated performance goal.
- **Digital & Sampled-Data Control**, because every one of these loops runs as software on an onboard computer, taking readings at fixed ticks, not as a continuous analog circuit.

Bong Wie's *Space Vehicle Dynamics and Control*, listed in this module's resources, is close to a direct reference for the wheel and torque-rod mechanics in this lesson.

Now hold this family against the six kinds of work from the first lesson:

- **Analysis** is heavy: fleet statistics, momentum budgets, choosing validation samples.
- **Flight software** carries real, constant weight, since a control mode is software running on real hardware all the time, not a one-time derivation.
- **Simulation and V&V** has a different flavor from the vehicle families. It is about showing a mode holds up across a representative population, not mainly one dispersion campaign for one mission.
- **Navigation and sensors** is present through the attitude-determination side, though the deeper estimation theory more often belongs to the next lesson's family.
- **Mission design** is essentially absent. This family is not choosing a path; it is holding an attitude.

### How reachable it is from self-study

Among the families heavy in domain theory, ADCS is one of the more approachable for a self-taught candidate to build real evidence for. There are two reasons.

1. **The physics is in ordinary textbooks.** It is thoroughly documented in accessible books — Wie, and Markley and Crassidis for the estimation side — instead of depending on private aerodynamic data the way entry work does.
2. **It rests less on hard-won flight judgment.** The vehicle families lean on tacit judgment about rare real-flight anomalies, which is hard to reproduce outside the job. In ADCS, fleet operation itself produces a large amount of real telemetry to learn from once you are in the job.

And the matching project is buildable: a genuine **three-axis** attitude control simulator, built on quaternion kinematics, with real reaction-wheel momentum tracking and simulated magnetic desaturation. That is legible, directly relevant evidence.

What it demands in return is real fluency in three-dimensional attitude kinematics — quaternions, not a flat simplification that happens to skip the hard part. That fluency is exactly what a technical interview for this family will probe first.

## Check yourself

::: check
Explain, in terms of what each problem is actually solving, the difference between attitude determination and attitude control, and why this lesson says both families in this pair of lessons touch determination without either one owning it exclusively.
:::

::: answer
Determination is estimating which way the satellite is actually pointing from noisy sensor data. Control is deciding what to command the actuators to do, given that estimate and a target attitude. Both this lesson's ADCS family and the next lesson's Navigation and State Estimation family list attitude determination in their postings. ADCS typically needs, and runs, an attitude estimate good enough to close its control loop. Deeper sensor calibration and estimation-theory work more often belongs to the navigation family. It is a center of gravity for each side, not a hard boundary, and it varies by team.
:::

::: check
A reaction wheel absorbs a secular external disturbance torque rather than a random one. Explain why this matters for whether the wheel eventually saturates.
:::

::: answer
A random disturbance tends to average toward zero over time. A wheel absorbing it wobbles up and down but does not necessarily pile up momentum in one direction forever. A secular disturbance pushes the same way, orbit after orbit. A wheel countering it has to keep adding momentum in the same direction, with nothing canceling it out. That steady pile-up is what drives the wheel toward its capacity and, eventually, saturation — unless something outside the satellite, such as a torque rod pushing against Earth's field, removes the momentum.
:::

::: check
Why can a magnetic torque rod desaturate a reaction wheel over the course of an orbit even though, at any single instant, its torque is constrained to be perpendicular to the local magnetic field direction?
:::

::: answer
The relation $\boldsymbol{\tau} = \mathbf{m}\times\mathbf{B}$ limits the torque's direction at each instant: it must be perpendicular to the field. But the field's direction, as seen from the satellite, keeps changing as the satellite moves around its orbit. Averaged over enough of an orbit, the rod can produce torque in a wide enough range of directions to steadily remove stored momentum from the wheels — even though it could never produce an arbitrary torque in a single instant the way a wheel can.
:::

::: check
A fleet-health dashboard flags several satellites with unusually frequent desaturation events, and all of them share a recently updated attitude mode not yet rolled out fleet-wide. What two explanations should the investigation distinguish between, and why does the answer change what happens next?
:::

::: answer
It should tell apart (1) a deliberate, understood trade — the new mode knowingly costs a bit more momentum management in return for some other benefit it was designed to deliver — from (2) an unintended inefficiency nobody accounted for. If it is a deliberate trade, the behavior is documented and monitored as expected. If it is unintended, the mode is fixed before it reaches the rest of the fleet. Mixing the two up risks either alarming the team over expected behavior or, worse, shipping a real inefficiency to every remaining satellite.
:::

::: check
This lesson calls ADCS one of the more approachable domain-theory-heavy families for a self-taught candidate. State the two reasons it gives, and the one piece of evidence it names as strong enough to demonstrate readiness.
:::

::: answer
The two reasons: first, the physics is thoroughly covered in accessible, standard textbooks, instead of needing private data; second, the family relies less on the tacit, hard-to-reproduce judgment about real flight anomalies that the vehicle families need, since fleet operation produces a large amount of real telemetry to learn from once you are in the job. The evidence it names is a genuine three-axis attitude control simulator built on quaternion kinematics, with real reaction-wheel momentum tracking and simulated magnetic desaturation — not a simplified one-axis version that dodges the three-dimensional kinematics a real interview would test.
:::

## Summary

| Concept | Symbol / relation | What it means here |
| --- | --- | --- |
| Wheel angular momentum | $H = I\omega$ | Stored momentum a reaction wheel can trade with the satellite body |
| Torque-rod torque | $\boldsymbol{\tau} = \mathbf{m}\times\mathbf{B}$ | Torque from a commanded magnetic dipole against the local field; always perpendicular to $\mathbf{B}$ |
| Saturation | $t_{\text{sat}} = H_{\max}/\tau_d$ | Time for a secular disturbance torque to fill a wheel's capacity ($0.5 / 200\times10^{-6} = 2500\ \mathrm{s} \approx 42$ min) |
| Desaturation | — | Using torque rods, averaged over an orbit, to bleed stored wheel momentum back out |
| "Done", this family | — | Checked across a representative sample of the fleet, then rolled out with monitoring — not proven on one unit |

The next lesson stays on the constellation side of the map and goes deeper into the sensing half of this pair: Navigation and State Estimation, where star trackers, GNSS and orbit determination turn noisy measurements into a trusted state — and where the degree requirements start to look noticeably different.

::: context attitude-word Why "attitude" means pointing
The word comes from pilots. An aircraft's attitude is how it sits in the air: nose up or down, wings level or tilted. Spacecraft engineers borrowed it for which way a vehicle faces in space. It has nothing to do with mood — although a satellite with bad attitude really is in trouble, because its antennas and solar panels point the wrong way.
:::

::: context starshield What Starshield is
**Starshield** is SpaceX's satellite business for government customers, including national-security work. It builds on Starlink technology, but much of what it does is not public. For a job seeker, that has two effects: fewer details in the postings, and a chance that the role needs a **security clearance** — official permission, after a background check, to work with classified information.
:::

::: context reaction-wheel The office-chair experiment
Spin is conserved: if nothing outside pushes, the total stays the same. Speed the wheel up one way, and the body must turn the other way to keep the total fixed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="30" width="160" height="110" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="85" r="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M 160 63 A 30 30 0 0 1 208 72" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="212,78 200,70 211,66" fill="#1d6fd1"/>
  <text x="180" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">wheel</text>
  <path d="M 270 120 A 90 90 0 0 0 270 50" fill="none" stroke="#b4232c" stroke-width="3"/>
  <polygon points="264,48 276,46 272,58" fill="#b4232c"/>
  <text x="300" y="90" font-size="11" text-anchor="middle" fill="#b4232c">body</text>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">wheel spins clockwise, body turns counterclockwise</text>
</svg>
```
:::

::: context moment-of-inertia How hard something is to spin
Moment of inertia is to spinning what mass is to pushing. A bicycle wheel with its weight out at the rim is harder to spin up than a solid disk of the same mass, because mass far from the axis counts for more. That is why reaction wheels put most of their mass in a heavy rim: they store more momentum for the same weight and spin rate.
:::

::: context three-or-four-wheels Why a fourth wheel
Three wheels at right angles can make torque about any axis. So why carry four? Because wheels are moving parts that wear, and a satellite must keep working for years. Four wheels, tilted so that any three of them still span all directions, let the satellite lose one wheel and carry on. The spare also lets the controller spread momentum between wheels to keep each one away from its limits.
:::

::: context disturbance-torques What saturation looks like on a chart
A steady twist makes the wheel's stored momentum climb in a straight line. Each momentum dump pulls it back down, well before it hits the limit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="340" y2="40" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="336" y="34" font-size="11" text-anchor="end" fill="#b4232c">H max (saturated)</text>
  <line x1="40" y1="140" x2="240" y2="40" stroke="#6c7a93" stroke-width="2"/>
  <text x="100" y="70" font-size="11" fill="#6c7a93">no dumping</text>
  <polyline points="40,140 120,100 140,130 220,90 240,120 320,80 340,110" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="262" y="132" font-size="11" fill="#1d6fd1">with dumping</text>
  <text x="190" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="28" y="90" font-size="11" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 28 90)">wheel H</text>
</svg>
```

The grey line reaches the limit at $t_{\text{sat}} = H_{\max}/\tau_d$. The blue line's climbs have the same slope — the disturbance does not stop — but the dumps keep it in range.
:::

::: context earth-field Earth is a weak magnet
Earth behaves roughly like a giant bar magnet, which is why a compass works. In low Earth orbit the field is a few tens of microtesla — hundreds of times weaker than a fridge magnet at its surface. A torque rod of, say, $10\ \mathrm{A\,m^2}$ (ampere square meters, the unit of magnetic moment) in a $30\ \mu\mathrm{T}$ field makes at most $10 \times 30\times10^{-6} = 300\ \mu\mathrm{N\,m}$ — tiny, but the same size as the disturbances it has to cancel.
:::

::: context cross-product What the cross product does
The cross product of two arrows gives a third arrow at right angles to both. Its size is largest when the two input arrows are at right angles and zero when they are parallel. So a torque rod lined up with the field produces no torque at all, and no rod can ever twist the satellite *about* the field line itself — that direction is always missing at that instant.
:::

::: context fleet-rollout Staged rollouts
Phone makers rarely send a new update to every phone at once. They send it to a small group, watch for trouble, then widen it. Satellite fleets work the same way, for the same reason: a bug found on 50 satellites is a problem; a bug found on thousands is a crisis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="35" width="72" height="36" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="44" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">sample test</text>
  <rect x="98" y="35" width="72" height="36" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="134" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">part of fleet</text>
  <rect x="188" y="35" width="72" height="36" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="224" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">monitor</text>
  <rect x="278" y="35" width="72" height="36" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="314" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">whole fleet</text>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="80" y1="53" x2="96" y2="53"/><line x1="170" y1="53" x2="186" y2="53"/><line x1="260" y1="53" x2="276" y2="53"/></g>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#b4232c">trouble at any step: stop and fix first</text>
</svg>
```
:::

::: context quaternions Four numbers for one orientation
Three angles — like roll, pitch and yaw — seem enough to describe which way something faces. But every three-number scheme has a pose where it breaks down, called **gimbal lock**, where two of the angles start doing the same job. A **quaternion** uses four numbers instead and never breaks down that way, which is why flight software uses them. You will build them from scratch in the attitude representations module.
:::
