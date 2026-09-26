---
id: l07-embedded-controls-and-beam-pointing
title: "Embedded Controls and Beam Pointing: actuators and aim"
minutes: 21
covers:
  - "Starlink Controls and Embedded Controls: solar array actuators, antenna gimbals, active optics, Hall thruster fluid and power control"
  - "Device Navigation and Beam Pointing, Beam Planning: user terminal pointing, RF and optical link pointing"
---

Think about a house. One person decides how the whole house should be heated. Another makes sure each radiator valve opens exactly as far as it is told. A third keeps the TV antenna on the roof aimed at the right tower. Three very different jobs.

This lesson covers two Starlink role families that work like the second and third people. They get less attention than the vehicle and attitude families, so they are easy to underrate as a target.

- **Starlink Controls and Embedded Controls** owns the **actuators** (the moving parts that do physical work) inside one satellite: the solar arrays, the antenna gimbals, the active optics, and the fluid and power systems that run its electric thruster.
- **Device Navigation and Beam Pointing**, together with **Beam Planning**, owns a different problem: keeping a communication link aimed at a target that is also moving. At the scale of the whole constellation, it also decides which satellite points at which ground terminal in the first place.

Neither family asks for the deep orbital mechanics or attitude theory of the last two lessons. Embedded Controls asks for real closed-loop control of physical hardware. Beam Pointing asks for careful geometry and scheduling, built on someone else's navigation answer. A strong embedded-systems or applied-software background can show both directly — good news for a certain kind of self-taught candidate.

## Embedded Controls: one actuator, done correctly

Go back to the house. The heating plan says "make the living room 21 °C." That plan is worthless unless each radiator valve actually opens to the right position and stays there. Someone has to make the valve obey.

On a satellite, the ADCS family (two lessons back) makes the whole-house decision: how the satellite body as a whole should point. **Embedded Controls** owns the small, local **control loop** — a measure-compare-correct cycle that runs over and over — that makes one specific actuator deliver what a higher-level command asks for. **[[Embedded|embedded]]** means the loop runs on a small computer built into the hardware.

The family's postings name four kinds of hardware.

- **Solar array actuators.** A motor drives each solar panel to a commanded angle, usually tracking the Sun to make the most power. It must hold that angle against friction, **[[backlash|backlash]]** (a little play in the gears), and other disturbances in the drive train.
- **Antenna gimbals.** A **gimbal**, a pivoting mount like the joint on a camera stabilizer, moves a mechanically steered antenna to a commanded direction and holds it there, feeding straight into the beam-pointing problem below.
- **Active optics.** These are steerable optical parts, such as small fine-pointing mirrors, used on the laser terminals that let satellites talk to each other. Laser links need far tighter pointing than a gimbal can hold on its own.
- **Hall thruster fluid and power control.** A **[[Hall-effect thruster|hall-thruster]]** is an electric engine that pushes a satellite with a stream of charged gas. Changing its thrust changes two things at once: how fast propellant flows in, and how much electrical power the **power processing unit** (the thruster's power supply) delivers to the discharge. So this is a *coupled* control problem — one command moves two quantities together — not two separate single-axis loops side by side.

### What the work actually is

Each is, at heart, a classical or digital control-loop design problem — closer to a **[[lead-lag compensator or a discrete PID|pid-lead-lag]]** loop running on a small processor than to the three-axis quaternion control of ADCS. Alongside it comes the **firmware** — low-level software on the hardware's own chip — which must run the loop correctly, **deterministically** (the same way every time), and within whatever timing the hardware demands.

This is the place in the module where **[[hardware-in-the-loop testing|hil-bench]]** is close to the daily rhythm of the job. A loop for a physical actuator is proven against that actuator, or a faithful bench copy of it, because a simulated motor, gear train or valve is only ever an approximation of the real one.

::: key
Starlink Controls and Embedded Controls: actuator-level control of solar array drives, antenna gimbals, active optics, and Hall thruster fluid and power control — local control loops and the firmware that runs them, validated against real or representative hardware rather than simulation alone. Closer to embedded firmware and [[mechatronics|mechatronics]] than to trajectory work.
:::

::: example A solar array drive that will not settle
**What happens.** A solar array actuator is commanded to a new angle. Instead of settling smoothly, it wobbles around the target for several seconds before holding still. Simulation-only testing never showed this.

**Step 1: reproduce it on the bench.** The same command on the real drive hardware gives the wobble every time. That already says something a simulation could not: this is a real hardware effect, not a side effect of an unrelated software change.

**Step 2: find what the model is missing.** Suppose the gear train has a little backlash that the original model did not include. Near the target, the controller's corrections are tiny, and part of each one is used up crossing the play. The output moves late, then overshoots — exactly the small wobble seen on the bench.

**Step 3: fix it, then prove the fix on hardware.** The engineer retunes or restructures the controller near the target to account for the known backlash, then tests again on the same bench.

**Sanity check.** Would rerunning the old simulation prove the fix? No — that simulation missed the problem in the first place. A hardware-driven problem is proven fixed on hardware.
:::

## Beam Pointing and Beam Planning: aiming at something that also moves

Picture a lighthouse keeper keeping a beam on one boat — while the boat moves and the lighthouse, in this story, slides along the coast. The keeper needs to know where both are and how both are moving.

That is **beam pointing**. The satellite's position and orientation come from the navigation family (the previous lesson). A ground **[[user terminal|user-terminal]]** — the dish on a customer's roof — has a known location. Pointing means working out the direction between the two and keeping an antenna, or a laser terminal, aimed along it continuously while the satellite races along its orbit.

Notice what this family does *not* do: work out where the satellite is. It **consumes** the navigation solution — takes it as an input — rather than producing it.

**Beam Planning** is the constellation-sized version. With many satellites overhead and many terminals below, which satellite should serve which terminal? When a satellite drifts out of view, which one takes over, and how is the switch made smoothly? This is a **scheduling and resource-allocation** problem — sharing out limited things fairly and well — stacked on top of the geometry.

### Two kinds of link, two very different targets

- An **RF link** uses radio waves ("RF", said "R-F", stands for radio frequency). Its **beamwidth** — how wide the cone of the beam is — tolerates a pointing error that is a real fraction of a degree.
- An **optical link** uses a laser, for example between two satellites. Its **beam divergence** — how fast the beam spreads — is tiny, and its pointing tolerance is routinely measured in **[[microradians|microradian]]**, millionths of a radian, rather than degrees.

That gap is why active optics has its own line in the posting instead of being folded into "gimbal pointing": a coarse gimbal aims a laser terminal roughly, and a separate, finer, faster stage closes the last small gap.

::: key
Device Navigation and Beam Pointing, Beam Planning: pointing user terminals and RF or optical links — where the satellite is, where the terminal is, and how to keep a beam on target through motion and geometry changes. Beam Planning is the constellation-level scheduling version, deciding which satellite serves which terminal as both move.
:::

### How separate errors combine

A pointing error rarely has one cause. The attitude estimate is a little off, the gimbal is mounted a hair crooked, the motor moves in small steps. How big is the total?

Adding them is the first guess. But **independent** errors — with unrelated causes — rarely all push the same way at once; some partly cancel. The honest way to combine them is the **root-sum-square**, or **RSS** (said "R-S-S"): square each error, add the squares, and take the square root.

$$
\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2 + \sigma_3^2}
$$

Here $\sigma$ (the Greek letter sigma) is the **standard deviation** — the typical size of an error. For independent errors the **variances** $\sigma^2$ add, so the total is smaller than the plain sum but bigger than the largest single error.

::: note Why it has to be true
Take two independent errors $a$ and $b$, each averaging zero. The total is $a + b$, so its square is $(a+b)^2 = a^2 + 2ab + b^2$. Average that over many trials. The averages of $a^2$ and $b^2$ are the variances $\sigma_a^2$ and $\sigma_b^2$. The middle term $2ab$ averages to zero: because the errors are unrelated, the average of $ab$ is the average of $a$ times the average of $b$, which is $0 \times 0$. So the variance of the total is $\sigma_a^2 + \sigma_b^2$, and its standard deviation is the square root. It is [[Pythagoras in disguise|rss-pythagoras]]. Add a third independent error and the same argument adds a third square.
:::

::: example A pointing budget, combined honestly
A **pointing budget** lists every source of pointing error and their total. Take three independent sources for a satellite antenna:

- attitude knowledge error from the navigation solution: $0.05^{\circ}$
- mechanical gimbal alignment error: $0.03^{\circ}$
- actuator pointing resolution: $0.02^{\circ}$

**Step 1: square each one.** $0.05^2 = 0.0025$, $0.03^2 = 0.0009$, $0.02^2 = 0.0004$ (all in square degrees).

**Step 2: add the squares.** $0.0025 + 0.0009 + 0.0004 = 0.0038$.

**Step 3: take the square root.**

$$
\sigma_{\text{total}} = \sqrt{0.05^2 + 0.03^2 + 0.02^2}\ {}^{\circ} = \sqrt{0.0038}\ {}^{\circ} \approx 0.062^{\circ}
$$

**Step 4: convert to microradians.** One degree is $\pi/180$ radians, which is about $17{,}453\ \mu\mathrm{rad}$. So $0.0616^{\circ} \times 17{,}453 \approx 1080\ \mu\mathrm{rad}$.

**Sanity check.** The total, $0.062^{\circ}$, is bigger than the largest single error ($0.05^{\circ}$) and smaller than the plain sum ($0.10^{\circ}$), as an RSS total must be.

**What it means for each link.** An RF beam is commonly a degree or more wide, so about $0.062^{\circ}$ sits comfortably inside it and the link stays closed with real margin. A laser beam's divergence is commonly tens of microradians. Divide: $1080 / 100 \approx 11$ and $1080 / 10 \approx 108$. The same budget is one to two orders of magnitude — ten to a hundred times — too loose. That is why a laser terminal needs the active-optics fine-steering stage, not its gimbal alone.
:::

::: warning Root-sum-square only applies to genuinely independent errors
RSS assumes the errors are statistically independent. Two errors with a shared cause are **correlated** — they tend to push the same way, as when one reference-frame error biases both the attitude knowledge and the gimbal alignment measurement. Treating those as independent understates the true total. Check the assumption before reaching for the formula, not after.
:::

## What a week looks like, and what counts as done

An Embedded Controls engineer spends real time on a bench: debugging wobbles like the one above, comparing an actuator's real response with its **data sheet** (the maker's specification), and validating firmware changes on physical hardware before they go near a flight unit.

A Beam Pointing or Beam Planning engineer investigates links that got weak or dropped, separating the possible causes:

- a genuine pointing error;
- the weather — **[[rain fade|rain-fade]]** on an RF link, or cloud blocking an optical one;
- a scheduling clash, where two terminals briefly needed the same satellite at once.

She also refines the logic that assigns satellites to terminals.

**"Done" for Embedded Controls** means the loop meets its settling and accuracy requirements in closed-loop tests on real or representative hardware, not only in simulation, and passes any **qualification** (the formal tests a part must pass before it may fly) that a flight-bound change requires.

**"Done" for pointing or planning** means the link meets its required availability and accuracy across a representative range of geometries and conditions, with an honestly computed error budget behind it — the same honesty the previous lesson asked of a filter's uncertainty.

## Curriculum links

Embedded Controls draws on Real-Time & Embedded Systems and Digital & Sampled-Data Control for the loop and its implementation; Classical Feedback Control Design and Signals, Systems & Transfer Functions for the basics under a lead-lag or PID loop; and Modern C++ for Flight and Simulation with Real-Time Constraints and Allocation-Free Flight Code for deterministic firmware.

Much industry control design happens first in Simulink, a block-diagram tool; Simulink: Block Diagrams and First Models and Verification and Embedded Coder: Models to Flight Code build toward that.

Beam Pointing and Beam Planning draw on the previous lesson's Orbit Determination and GNSS/GPS output, on Probability & Statistics for error budgets, and on Real-Time & Embedded Systems for the pointing loop. Beam Planning's scheduling side connects to the Optimization module: deciding which satellite serves which terminal under changing geometry is a genuine **[[constrained-assignment problem|assignment-problem]]**.

Against the six kinds of work from lesson one:

- **Embedded Controls** sits heavily in flight software and in hardware-in-the-loop and test, with moderate analysis and little navigation or mission design of its own.
- **Beam Pointing** leans on navigation and sensors — consumed, not owned, as the previous lesson's boundary discussion predicted — and on analysis for its error budgets.
- **Beam Planning** adds a real scheduling and resource-allocation layer that borders on operations rather than classical guidance work.

## An honest note on how open these doors are

Both families are more reachable from self-study than the theory-heavy families earlier in this module, and it is worth saying so plainly.

Embedded Controls rewards evidence an embedded-systems or mechatronics background can produce directly: a real closed-loop controller driving real hardware — a motor, a gimbal, a valve — through a **microcontroller** (a small computer on one chip), tuned and validated on a bench like the solar-array example. None of that needs orbital mechanics.

Beam Pointing and Beam Planning reward geometric reasoning, comfortable use of someone else's navigation output, and a working sense of scheduling — reachable without the previous lesson's estimation theory, because this family consumes a navigation solution rather than deriving one.

Neither is a zero-prerequisite entry point. Both expect real comfort with **reference frames** and **coordinate transforms** — describing one direction from different points of view, and converting between them. Beam Pointing also expects a working grasp of **link budgets**: how much signal survives the trip from transmitter to receiver. Still, these two ask more for engineering breadth and hands-on rigor than for years of specialized theory — a distinction this module wants you able to draw.

## Check yourself

::: check
Explain, in terms of scope rather than difficulty, why Embedded Controls is a genuinely different kind of problem from the ADCS family covered two lessons ago.
:::

::: answer
ADCS decides how the whole satellite body should be oriented and manages momentum across the vehicle as a system. Embedded Controls owns the local control loop for one specific actuator or subsystem — a solar array drive, a gimbal, a thruster's fluid and power system — and makes sure that actuator delivers what a higher-level command asks of it. One is a whole-body, three-axis dynamics and estimation problem. The other is a set of local, often single- or few-axis control loops, plus the firmware and hardware validation that make each one behave correctly on real hardware.
:::

::: check
A control loop for a physical actuator performs correctly in simulation but oscillates on the hardware bench. What does this by itself already tell the engineer, and what should happen next?
:::

::: answer
It says the problem is a real hardware effect the simulation did not capture, not a bug from an unrelated software change: the same control logic behaves differently against real hardware than against the model. Next, the engineer investigates what the model is missing — such as mechanical backlash or an unmodeled dynamic — fixes the control logic to account for it, and validates the fix again on the same bench hardware, rather than trusting a rerun of the original simulation.
:::

::: check
Using the pointing-budget example in this lesson, explain why an optical inter-satellite link needs active optics as a separate fine-steering stage, even when the satellite already has a gimbal pointing system.
:::

::: answer
The combined gimbal-based budget in the example is about $1080\ \mu\mathrm{rad}$ ($0.062^{\circ}$). That fits comfortably inside an RF beamwidth of a degree or more, but an optical link's divergence is commonly tens of microradians, so the same budget is one to two orders of magnitude too loose. A coarse gimbal points the laser terminal roughly; closing the remaining, much smaller gap needs a separate, finer, typically faster steering mechanism — the job active optics does.
:::

::: check
Why does combining independent pointing-error contributors by root-sum-square, rather than by simple addition, give a more honest total error estimate — and when does that method stop being valid?
:::

::: answer
Independent random errors combine in variance, not directly in size: the variances add, so the combined standard deviation is the square root of the sum of the squares. Unrelated errors rarely all push the same way at once, so the plain sum overstates the typical total, and RSS gives the statistically honest, smaller figure. The method stops being valid when the errors are not independent — for example, when two share a common cause, such as one reference-frame error biasing more than one contributor in the same direction. Then treating them as independent understates the true combined error.
:::

::: check
A candidate has strong evidence of hands-on embedded control work — a tuned, hardware-validated actuator control loop — but little orbital mechanics or estimation background. According to this lesson, is that candidate well positioned for either family covered here, and why?
:::

::: answer
Yes, especially for Embedded Controls. Its core demands — real closed-loop control design, firmware implementation, and hardware-in-the-loop validation — are exactly what that evidence shows, and none of them needs orbital mechanics or attitude-estimation depth. The candidate is also reasonably placed for Beam Pointing, which consumes a navigation solution rather than deriving one and rewards geometric and scheduling reasoning more than estimation theory — provided they also build real comfort with reference frames and coordinate transforms, which both families still expect.
:::

## Summary

| Family | Owns | Consumes | Primary curriculum module |
| --- | --- | --- | --- |
| Embedded Controls | Local actuator control loops: arrays, gimbals, active optics, thruster fluid/power | Commanded setpoints from higher-level systems | Real-Time & Embedded Systems; Digital & Sampled-Data Control |
| Beam Pointing | Aiming one link at a moving target from a known state | The navigation solution (previous lesson) | Probability & Statistics (error budgets) |
| Beam Planning | Constellation-scale scheduling of which satellite serves which terminal | Pointing and navigation outputs across the fleet | Optimization |

| Idea | In one line |
| --- | --- |
| Root-sum-square | $\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2 + \sigma_3^2}$, for independent errors only |
| Degrees to microradians | $1^{\circ} = \pi/180\ \mathrm{rad} \approx 17{,}453\ \mu\mathrm{rad}$ |
| RF vs optical | RF beams: a degree or more wide; laser divergence: tens of microradians |

The next lesson steps away from any single satellite's hardware or geometry. It covers the two families that build the tools every other family runs on: Software Engineer, GNC and Operations Automation, and Site Reliability Engineer, GNC.

::: context embedded What "embedded" means
An **embedded** computer is one built inside a machine to run that machine, instead of sitting on a desk for you to use. Your microwave, a washing machine and a car's brakes all have one. It usually has little memory, no screen, and one job it must do on time, every time. On a satellite, each solar array drive or thruster can have its own small processor running its own loop, taking orders from the main flight computer. The code on it is called **firmware** because it sits "firmly" between hardware and ordinary software.
:::

::: context backlash Backlash, drawn
Two gears never mesh perfectly tightly. There is a small gap between a tooth on the driving gear and the teeth on the driven gear. When the motor reverses, it turns through that gap before it touches the other side and moves the load.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="90" width="280" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="60" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="210" y="60" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="178" y="40" width="24" height="50" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="170" y1="30" x2="178" y2="30" stroke="#b4232c" stroke-width="2"/>
  <line x1="202" y1="30" x2="210" y2="30" stroke="#b4232c" stroke-width="2"/>
  <line x1="170" y1="24" x2="170" y2="58" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 2"/>
  <line x1="210" y1="24" x2="210" y2="58" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 2"/>
  <text x="190" y="18" font-size="12" fill="#b4232c" text-anchor="middle">play on each side</text>
  <text x="290" y="54" font-size="12" fill="#1f2a44" text-anchor="middle">driving tooth</text>
  <line x1="254" y1="50" x2="202" y2="50" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">driven gear (to the solar array)</text>
</svg>
```

Near the target, each correction is small, so part of it is spent crossing the gap. The array moves late, overshoots, and the wobble begins.
:::

::: context hall-thruster How a Hall thruster pushes
A Hall thruster turns electricity into thrust. A gas is fed in, electrons strip some of its atoms into charged **ions**, and an electric field flings the ions out the back at roughly 15 to 30 kilometers per second. The push is tiny — a small fraction of a newton, about the weight of a few coins in your hand — but it can run for months on very little propellant. That is why satellites use it to raise and hold their orbits. Early Starlink satellites used krypton as the propellant, and the V2 Mini generation moved to argon, both cheaper than the traditional xenon. More gas flow and more discharge power both mean more thrust, which is why the two must be controlled together.
:::

::: context pid-lead-lag Two classic loop recipes
A **PID** loop — said "P-I-D" — adds three reactions to the error between where you are and where you want to be. **P**roportional pushes harder the bigger the error is now. **I**ntegral pushes against error that has lingered in the past. **D**erivative eases off when the error is shrinking fast, a guess at the future. A **lead-lag compensator** is a filter that reshapes the loop's reaction at fast and slow timescales. "Discrete" means the loop runs in steps, many times a second, on a computer. The Classical Feedback Control Design module teaches both from scratch.
:::

::: context hil-bench The bench
**Hardware-in-the-loop**, or **HIL** (said "H-I-L"), means wiring real hardware into a test in place of its simulated copy. On an embedded bench, the real motor and gearbox sit on a table, wired to the real controller board. A computer plays the part of the rest of the satellite: it sends commands and pretends to be the Sun, the sensors, the orbit. The loop then has to work against real friction, real electrical noise and real timing. Problems that never show up in pure simulation, like the backlash in this lesson's example, show up here first.
:::

::: context mechatronics Machines that think a little
**Mechatronics** means mechanical parts, electronics and software designed together as one system. A robot arm, a camera stabilizer and a car's anti-lock brakes are all mechatronic: a motor or valve, sensors that measure what it did, and a small computer closing the loop between them. A solar array drive on a satellite is the same kind of machine. That is why a hobby robot or drone project, built and tuned for real, is direct evidence for this family.
:::

::: context user-terminal The dish on the roof
A **user terminal** is the customer's end of the link: a flat antenna on a roof, a boat or an airplane. Starlink's dish is a **phased array** — many small antenna elements whose signals are timed so the combined beam points where the software chooses, with no moving parts needed for fine steering. "Device Navigation" in the family's name refers to this side: the terminal has to know where it is and which way it faces before it can aim at a satellite racing overhead.
:::

::: context microradian How small is a microradian?
A radian is an angle of about $57.3^{\circ}$. A microradian is a millionth of that. Here is a way to feel it: an angle of $1\ \mu\mathrm{rad}$ opens up a sideways gap of $1\ \mathrm{m}$ at a distance of $1000\ \mathrm{km}$. A laser beam that spreads $20\ \mu\mathrm{rad}$ is about $20\ \mathrm{m}$ wide after $1000\ \mathrm{km}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <circle cx="24" cy="60" r="5" fill="#1f2a44"/>
  <line x1="24" y1="60" x2="330" y2="40" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="24" y1="60" x2="330" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="330" y1="36" x2="330" y2="84" stroke="#b4232c" stroke-width="2"/>
  <text x="340" y="64" font-size="12" fill="#b4232c">1 m</text>
  <text x="180" y="102" font-size="12" fill="#1f2a44" text-anchor="middle">1000 km away</text>
  <text x="70" y="30" font-size="12" fill="#1f2a44">angle 1 µrad (not to scale)</text>
</svg>
```

So "tens of microradians" means the laser has to hit a spot tens of meters wide from a thousand kilometers away.
:::

::: context rss-pythagoras Errors at right angles
Independent errors behave like steps taken at right angles. Walk $3$ steps east and $4$ steps north, and you end up $5$ steps from the start, not $7$. Squaring, adding and taking the root is the Pythagorean theorem.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="130" x2="180" y2="130" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="180" y1="130" x2="180" y2="30" stroke="#f2b880" stroke-width="3"/>
  <line x1="60" y1="130" x2="180" y2="30" stroke="#b4232c" stroke-width="3"/>
  <rect x="170" y="120" width="10" height="10" fill="none" stroke="#1f2a44"/>
  <text x="120" y="146" font-size="12" fill="#1d6fd1" text-anchor="middle">error a = 3</text>
  <text x="188" y="84" font-size="12" fill="#1f2a44">error b = 4</text>
  <text x="80" y="72" font-size="12" fill="#b4232c">total 5, not 7</text>
  <text x="230" y="130" font-size="12" fill="#1f2a44">5² = 3² + 4²</text>
</svg>
```

Correlated errors are like steps in the same direction: then they do add straight up.
:::

::: context rain-fade Rain fade
**Rain fade** is the weakening of a radio signal as it passes through rain. At the high frequencies satellite internet uses, the water in raindrops absorbs and scatters part of the signal, and the higher the frequency, the worse the effect. A heavy storm can cut a link's strength sharply for a few minutes. A laser link through the air has the same kind of trouble with cloud. That is why an engineer chasing a dropped link checks the weather before blaming the pointing.
:::

::: context assignment-problem Who serves whom
Matching satellites to terminals is a close cousin of a classic puzzle: give each worker one job so that the total cost is as low as possible. With a handful of workers you can try every match. With thousands of terminals, hundreds of satellites in view and a picture that changes every few minutes, trying everything is impossible, so planners use optimization methods that find a very good answer fast. The Optimization module later in the course teaches the tools.
:::
