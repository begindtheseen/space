---
id: l04-anchor-a-6dof-simulation
title: "Anchor A: the 6-DOF launch vehicle simulation"
minutes: 21
covers:
  - "anchor project A — 6-DOF launch vehicle simulation with a real atmosphere model and dispersion campaign"
---

Think about a flight simulator game. You can fly a plane on a perfectly calm day with a full tank and a brand-new engine. That tells you the game works. It does not tell you whether you could land in a crosswind, with a heavy load and a slightly bent wing. A real pilot trains for the bad days, not the perfect one.

This lesson is about the first of the five **anchor projects** — the few deep, finished projects a portfolio is built around. Anchor A is a **6-DOF launch vehicle simulation**: a program that flies a rocket from the pad on a computer. **6-DOF** (said "six D-O-F") stands for **[[six degrees of freedom|six-dof]]** — the six independent ways a solid body can move. It can slide in three directions (up–down, left–right, forward–back) and turn about three axes (pitch, yaw and roll).

Of the five anchors, this one carries the most weight, for one direct reason. It is close to what an ascent or vehicle-performance GNC team's own internal tools actually are. A guidance engineer's everyday work runs on a simulation like this: moving and turning the vehicle together, pushed by an atmosphere model, an engine model, and a set of uncertain inputs. Almost no new graduate has built one end to end, with the "bad days" run and the proof that the code is right. This lesson covers what the project must contain to earn that weight, and what an interviewer on an ascent team will ask about it.

## What the project has to contain, beyond "it flies"

A 6-DOF simulation tracks two things at once. The **translational** state is where the vehicle is and how fast it moves — three numbers for position, three for velocity. The **rotational** state is which way it points and how fast it turns — its **attitude** and its **angular rate**. The two are linked. The air and the engine push on the vehicle (forces, which change its motion) and twist it (moments, or torques, which change its turning). Both depend on where it is and which way it points.

The equations of motion themselves — the reference frames, the force and moment models, the coupling between moving and turning — are built in depth elsewhere in this course. This lesson adds what a defensible *portfolio project* built on top of them needs, beyond correct code.

Correct dynamics are necessary, but not enough. Picture a perfectly written simulator that flies through a made-up atmosphere. It runs cleanly. It still teaches a reviewer nothing about whether you understand ascent flight, because the made-up air hides the vehicle's real structural and control problems.

Two things turn a working 6-DOF program into a credible anchor project, and both are named in this project's brief:

1. a **real atmosphere model**, and
2. a **[[dispersion campaign|monte-carlo]]** — the same simulation run many times, with key inputs drawn at random from stated ranges, to see how the vehicle does across the uncertainty it will really fly through.

## Why the atmosphere model is not a detail

The air gets thinner as you climb. The simplest description of that is the **exponential atmosphere**:

$$
\rho = \rho_0 e^{-h/H}
$$

Read it as "rho equals rho-nought times e to the minus h over H". Here $\rho$ ("rho") is the air's **density** — how many kilograms of air fill one cubic meter — at altitude $h$. $\rho_0$ ("rho-nought") is the density at sea level, about $1.225\,\mathrm{kg/m^3}$. $H$ is the **[[scale height|scale-height]]**: the climb over which the density drops by a factor of $e \approx 2.718$.

This formula is a fine tool for hand calculations and quick sizing. This course's own atmospheric-flight material uses exactly this model to find where the air pushes hardest on a climbing rocket and how that scales.

It is not a fine foundation for a simulation whose whole point is to show you can model ascent faithfully. The problem is the single number $H$. The real atmosphere does not fall off by one steady rule, because its temperature changes with height:

- it **cools** as you climb through the lowest layer, the **troposphere** (up to about $11\,\mathrm{km}$);
- it stays at a **constant** temperature through the lower **stratosphere** (about $11$ to $20\,\mathrm{km}$);
- it **warms** again above that.

Cold air is denser than warm air at the same pressure, so each layer thins at its own rate. A **[[layered atmosphere model|layered-atmosphere]]** follows these layers one at a time. The exponential fit cannot, so its error grows the higher you go.

::: example A layered atmosphere against a single-scale-height exponential
Build a density function layer by layer from two physical laws: **hydrostatic equilibrium** (each slab of air holds up the weight of the air above it) and the **ideal gas law** (pressure, density and temperature are tied together). Use the standard temperature profile of the troposphere and stratosphere. Then compare it with $\rho = \rho_0 e^{-h/H}$, using $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and $H = 8.435\,\mathrm{km}$, the scale height at sea level.

The "Difference" column is how far the exponential value is from the layered one, as a percentage of the layered one.

| Altitude | Layered $\rho$ (kg/m³) | Exponential $\rho$ (kg/m³) | Difference |
| --- | --- | --- | --- |
| 11 km | $0.3639$ | $0.3325$ | $-8.6\%$ |
| 20 km | $0.0880$ | $0.1144$ | $+29.9\%$ |
| 30 km | $0.0180$ | $0.0350$ | $+94.1\%$ |
| 50 km | $0.000978$ | $0.003264$ | $+233.9\%$ |

Read the pattern. At $11\,\mathrm{km}$ the exponential is a little low. By $20\,\mathrm{km}$ it is about $30\%$ high. By $30\,\mathrm{km}$ it is almost twice the real value, and by $50\,\mathrm{km}$ more than three times.

Now check a force the vehicle feels. **Dynamic pressure**, $q = \tfrac12 \rho v^2$ (read "q equals one half rho v squared"), is how hard the oncoming air presses on the vehicle. It peaks at a moment called **[[max-Q|max-q]]**. Take a representative max-Q condition: $h = 12\,\mathrm{km}$, speed $v = 450\,\mathrm{m/s}$.

- Layered: $\rho = 0.3108\,\mathrm{kg/m^3}$, so $q = 0.5 \times 0.3108 \times 450^2 = 31.47\,\mathrm{kPa}$.
- Exponential: $\rho = 0.2953\,\mathrm{kg/m^3}$, so $q = 0.5 \times 0.2953 \times 450^2 = 29.90\,\mathrm{kPa}$.

The difference is $31.47 - 29.90 = 1.57\,\mathrm{kPa}$, which is $5.0\%$ of the layered value. That is the gap right where the fit is at its best. Above this region it only grows. Dynamic pressure sets the structural loads and the control loads on the vehicle, and those are exactly what the exponential model gets most wrong as the vehicle climbs.

Sanity check: the troposphere cools with height, so real air there is denser than one steady decay predicts — the exponential should read low at $11$ and $12\,\mathrm{km}$, and it does.
:::

A reviewer on an ascent team has almost certainly built or maintained a real atmosphere model. Expect to be asked why yours does or does not use one. "An exponential model was accurate enough for the numbers I needed" is a defensible answer — if the project's stated requirement truly does not depend on dynamic pressure above about $20\,\mathrm{km}$. "I did not know the difference mattered" is not defensible. A comparison table like the one above answers the question before it is asked.

::: key
An exponential atmosphere is wrong by a growing margin above the altitude it is fit around — roughly 30% high by 20 km and close to a factor of two by 30 km for a typical fit — in exchange for one line of code. A 6-DOF anchor project should use a layered, real atmosphere model and say so in its assumptions section. If it does not, it should say specifically why the requirement does not need one.
:::

::: warning
Do not judge an atmosphere model only near the ground. The exponential fit looks fine at a few kilometers, and a quick check there will convince you it is good enough. Always compare at the altitudes your vehicle actually flies through, especially max-Q and above.
:::

## The dispersion campaign: what belongs in it

A single run on the expected, "everything as planned" path is called the **nominal** trajectory. It shows the simulation runs. A dispersion campaign shows something an interviewer truly cares about: how the vehicle behaves across all the uncertainty it will really fly through, not only in the one case that was easiest to get working.

Think of testing a bridge design. You would not only check it with one car at noon on a still day. You would try heavy trucks, strong wind, and hot and cold days — each because it is a real way the bridge could fail. The same rule applies here: each **dispersed parameter** (each input you vary) should earn its place by tracing to a real way things go wrong, not because it is easy to randomize.

### Thrust misalignment

The engine never pushes exactly through the vehicle's **center of mass** — its balance point. A real engine nozzle, even when centered, is off by a small fraction of a degree. Push a shopping cart slightly off-center and it starts to turn. A rocket does the same. That off-center push makes a **disturbance torque** — a twist nobody asked for — and the attitude control system must correct it the whole way through the burn. It does this with **[[thrust vector control|tvc]]** (TVC): swiveling the engine to aim its push.

::: example A thrust-misalignment torque, and what happens if nothing corrects it
Model a first-stage-sized vehicle as a solid uniform cylinder: mass $m = 400{,}000\,\mathrm{kg}$, length $L = 40\,\mathrm{m}$, radius $r = 1.83\,\mathrm{m}$.

**Step 1 — how hard it is to turn.** The **[[moment of inertia|moment-of-inertia]]** $I$ measures how hard a body is to start spinning. For a cylinder turning end over end:

$$
I = \tfrac{1}{12} m (3r^2 + L^2) = \tfrac{1}{12} \times 400{,}000 \times (3 \times 1.83^2 + 40^2) = 5.37 \times 10^{7}\,\mathrm{kg\,m^2}.
$$

**Step 2 — the twist.** A $1\,\mathrm{MN}$ engine (one million newtons) is misaligned by $0.5^\circ$. The engine's swivel point sits $15\,\mathrm{m}$ from the center of mass. Only the sideways part of the thrust, $F \sin(0.5^\circ)$, twists the vehicle, and it acts at that $15\,\mathrm{m}$ lever arm:

$$
\tau = F \sin(0.5^\circ) \times 15\,\mathrm{m} = 10^6 \times 0.008727 \times 15 = 1.31 \times 10^{5}\,\mathrm{N\,m}.
$$

**Step 3 — the turning it causes.** Angular acceleration is torque divided by inertia, $\alpha = \tau / I$ ("alpha equals tau over I"):

$$
\alpha = \frac{1.31 \times 10^5}{5.37 \times 10^7} = 2.44 \times 10^{-3}\,\mathrm{rad/s^2} = 0.140^\circ/\mathrm{s^2}.
$$

**Step 4 — left alone.** Suppose there were no attitude control at all. After one second the vehicle turns at $0.140^\circ/\mathrm{s}$, and it has rotated $\tfrac12 \alpha t^2 = 0.5 \times 0.140 \times 1^2 = 0.07^\circ$. After five seconds the error is $0.5 \times 0.140 \times 5^2 = 1.75^\circ$, and it keeps growing with the square of time.

Sanity check: half a degree of misalignment is tiny, and so is the first second's effect — but it grows without limit. The numbers stay small in real flight because a TVC loop corrects them continuously. So the point of dispersing this parameter is not to watch the vehicle tumble. It is to confirm that the control loop's **authority** (how much it can push back) and **bandwidth** (how fast it can react) are enough against the misalignment the hardware specification allows.
:::

### Wind, mass properties and sensors

**Wind.** A steady wind profile plus sudden gusts. It matters most near max-Q. There, a small tilt between the vehicle's nose and the oncoming air — its **angle of attack** — makes the biggest possible sideways load.

**Mass properties.** Dry mass, propellant mass and the location of the center of mass all carry manufacturing and loading tolerances. Shift them and the vehicle's inertia shifts, and so do its control margins.

**IMU bias and noise.** The **[[IMU|imu]]** (inertial measurement unit, said "I-M-U") is the box of gyroscopes and accelerometers that tells the flight computer how the vehicle is moving. The guidance and control loop only ever sees the sensor's *estimate* of the state, never the true state. So a campaign that shakes the trajectory but feeds the controller perfect knowledge is not testing the real closed loop.

### What the campaign must report

"Ran 500 dispersed cases" is a count, not a result. A defensible campaign reports three things:

1. the **pass criterion**, fixed *before* the run — the line a case must meet to count as a success;
2. the **fraction of cases** that met it;
3. the **[[worst case|worst-case]]** specifically, not only the average.

The average over a dispersion set can look comfortable while a small group of cases misses the requirement badly. Those rare bad cases are the ones the real vehicle will one day meet.

::: warning
Watch for a controller or guidance law that was tuned and checked only on the nominal trajectory. Running a dispersion campaign against it tests whether the tuning *happened* to work more widely, not whether it was *designed* to. If the attitude control gains were chosen by eye against one nominal run, the honest question is whether they were re-checked against the same dispersion set the Monte Carlo uses. If not, that gap belongs in the project's limitations section — not left for a reviewer to find by asking.
:::

## What the interviewer asks, and what the project needs ready

A panel reviewing this project usually presses on four things. Each maps to a section of the write-up structure from two lessons ago.

1. **Why a real atmosphere model and not an exponential one?** Closed by a comparison like the table above.
2. **How do you know the rotational dynamics are correct?** Closed by the analytic case and conservation checks from the previous lesson — run against *this* vehicle's inertia and force models, not a toy case.
3. **What exactly is in the dispersion set, and why each parameter?** Closed by tracing each one to a real failure mechanism, as above.
4. **What was the pass criterion?** Closed by stating it in the results section, fixed before the campaign ran — never chosen after seeing the numbers.

::: key
A single nominal run shows the simulation works. A dispersion campaign shows how the vehicle behaves across real uncertainty. Its report states the pass criterion fixed in advance, the fraction of cases that met it, and the worst case — not a count of runs.
:::

## Check yourself

::: check
A reviewer asks why your 6-DOF simulation uses a layered atmosphere model instead of the simpler exponential form. Using the numbers from this lesson, give a specific, quantified answer rather than a general one.
:::

::: answer
The exponential model, fit to the sea-level scale height, is within about 9% of a layered model through 11 km. But it is already about 30% high by 20 km and 94% high by 30 km. Those errors turn directly into wrong dynamic pressure, and so wrong structural and aerodynamic loads, once the vehicle climbs past the altitude the fit is centered on. Even near max-Q, where the fit is at its best, a representative case showed a 5% difference in dynamic pressure. A simulation meant to show ascent-flight fidelity should use the layered model. The exponential form is for back-of-the-envelope estimates, which is exactly how this course's atmospheric-flight material uses it.
:::

::: check
Explain why thrust misalignment belongs in a dispersion set even though a real vehicle's attitude control loop corrects it continuously, so its effect on the nominal trajectory is small.
:::

::: answer
The campaign is not testing whether the vehicle tumbles under misalignment — a working control loop prevents that by design. It tests whether the loop's authority and bandwidth are enough across the full range of misalignment the hardware tolerance allows, and whether the correction costs an acceptable amount of control effort or propellant. A small nominal effect does not make a parameter unimportant to disperse. The question a dispersion campaign answers is how the closed-loop system behaves at the edges of the real uncertainty, not how large the uncorrected disturbance looks alone.
:::

::: check
A project's dispersion campaign report states: "Monte Carlo of 500 cases completed successfully." What is missing, and why does a panel read this sentence as a sign of a shallow campaign rather than a thorough one?
:::

::: answer
Missing: the pass criterion fixed before the campaign ran, the fraction of the 500 cases that met it, and the worst case. "Completed successfully" describes the software — it ran without crashing. It says nothing about whether the vehicle performed acceptably across the dispersion set, which is the whole engineering question the campaign exists to answer. A panel reads it as a red flag, because it is exactly the claim a campaign that was run but never judged against a requirement would produce.
:::

::: check
Why does a dispersion campaign that perturbs the true trajectory but feeds the attitude controller perfect, noise-free state knowledge fail to test the actual closed loop, even if every other parameter is realistically dispersed?
:::

::: answer
A real flight control system never sees the true state. It sees only what its sensors and estimator report, which carries bias, noise and delay — all hidden by true-state feedback. A controller tuned and tested against perfect knowledge can look robust across a wide dispersion set and still fail once sensor imperfection is added back. Sensor error interacts with control bandwidth and gain margins in ways a perfect-knowledge simulation cannot show. IMU bias and noise belong in the set so the campaign exercises the loop the vehicle will really fly with.
:::

::: check
A $1\,\mathrm{MN}$ engine on the lesson's cylinder ($I = 5.37 \times 10^7\,\mathrm{kg\,m^2}$, $15\,\mathrm{m}$ arm) is misaligned by $0.25^\circ$ instead of $0.5^\circ$. With no control at all, what is the attitude error after $5\,\mathrm{s}$? Then state the role family this anchor project maps to most directly, and a one-sentence README opening that connects them.
:::

::: answer
Halving the angle halves $\sin$ of it (small angles), so the torque and the angular acceleration halve: $\tau = 10^6 \times \sin(0.25^\circ) \times 15 = 6.54 \times 10^4\,\mathrm{N\,m}$, and $\alpha = 6.54 \times 10^4 / 5.37 \times 10^7 = 1.22 \times 10^{-3}\,\mathrm{rad/s^2} = 0.0699^\circ/\mathrm{s^2}$. After $5\,\mathrm{s}$: $\tfrac12 \times 0.0699 \times 25 = 0.87^\circ$, half of the lesson's $1.75^\circ$, as it should be.

The role family is ascent and vehicle-performance GNC — the team responsible for the vehicle's flight from liftoff through the phase this simulation models. A good opening line names the link directly: "6-DOF ascent simulation with a layered atmosphere model and a 500-case dispersion campaign, built to evidence the same high-fidelity vehicle-performance modeling an ascent GNC team's own internal tooling does."
:::

## Summary

| Item | What it needs |
| --- | --- |
| 6-DOF | Three ways to move plus three ways to turn, propagated together |
| Dynamics | Verified by an analytic case and a conservation check against this vehicle's own models |
| Atmosphere | A layered, real model — exponential $\rho = \rho_0 e^{-h/H}$ is roughly 30% off by 20 km and a factor of two by 30 km |
| Dynamic pressure | $q = \tfrac12 \rho v^2$; a 5% gap even at max-Q (12 km, 450 m/s) |
| Misalignment torque | $\tau = F \sin\theta \times \text{arm}$, $\alpha = \tau / I$; small, but grows as $\tfrac12 \alpha t^2$ if uncorrected |
| Dispersion parameters | Thrust misalignment, wind, mass properties, IMU bias and noise — each traced to a real failure mechanism |
| Dispersion report | Pass criterion fixed in advance, pass fraction, and worst case — not a run count |
| Common trap | Control gains tuned only on the nominal trajectory, never re-checked against the dispersion set |
| Role family | Ascent / vehicle-performance GNC |

The next lesson moves from the climb to the landing: anchor project B, powered-descent guidance, and the numerical trap a fixed-final-time formulation can spring on a Monte Carlo campaign that never checks for it.

::: context six-dof Six ways to move
Hold a book in the air. You can slide it up or down, left or right, forward or back — three **translations**. You can also tip it forward (pitch), turn it left or right (yaw), or roll it like a steering wheel (roll) — three **rotations**. Any motion of a solid object is a mix of these six. A **3-DOF** simulation tracks only the sliding, treating the rocket as a dot. A 6-DOF simulation also tracks the turning, which is where control problems live.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="50" width="60" height="70" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="2.5" fill="none">
    <line x1="180" y1="48" x2="180" y2="14"/><line x1="212" y1="85" x2="262" y2="85"/><line x1="160" y1="118" x2="130" y2="148"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="180,8 174,20 186,20"/><polygon points="268,85 256,79 256,91"/><polygon points="126,152 128,139 139,146"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="190" y="20">up–down</text><text x="236" y="104">left–right</text><text x="64" y="160">forward–back</text>
  </g>
  <g stroke="#b4232c" stroke-width="2" fill="none">
    <path d="M 290 40 A 22 12 0 1 1 290 41"/><path d="M 300 90 A 12 22 0 1 1 301 90"/><path d="M 60 70 A 18 18 0 1 1 61 71"/>
  </g>
  <g font-size="12" fill="#b4232c">
    <text x="276" y="20">yaw</text><text x="318" y="128">pitch</text><text x="46" y="110">roll</text>
  </g>
  <text x="180" y="90" font-size="12" fill="#1f2a44" text-anchor="middle">body</text>
</svg>
```

Blue arrows are the three slides; red loops are the three turns.
:::

::: context monte-carlo Rolling the dice on purpose
A **Monte Carlo** run is a simulation repeated many times with random inputs, so the spread of outcomes shows up. The name comes from the Monte Carlo casino in Monaco; scientists working on early computers at Los Alamos in the 1940s used it as a code name for methods built on chance. In GNC the words "Monte Carlo" and "dispersion campaign" are used almost interchangeably. Every flight vehicle is analyzed this way before it flies, often with thousands of cases, because a single perfect run hides every unlucky combination the real flight might meet.
:::

::: context scale-height What the H means
The scale height $H$ is the climb over which the air thins by a factor of $e \approx 2.718$. With $H = 8.435\,\mathrm{km}$, the density at $8.4\,\mathrm{km}$ is about $1.225 / 2.718 \approx 0.45\,\mathrm{kg/m^3}$ in this model, and at $16.9\,\mathrm{km}$ about $0.17$. It comes from temperature: $H = R T / g$, where $R$ is the gas constant for air ($287\,\mathrm{J/(kg\,K)}$), $T$ the temperature and $g$ gravity. With sea-level $T = 288.15\,\mathrm{K}$ this gives $287.053 \times 288.15 / 9.80665 \approx 8435\,\mathrm{m}$. Because $H$ depends on $T$, and real temperature changes with height, one fixed $H$ cannot be right everywhere.
:::

::: context layered-atmosphere The temperature staircase
The standard atmosphere is built from straight-line temperature layers: $288.15\,\mathrm{K}$ ($15^\circ\mathrm{C}$) at sea level, cooling $6.5\,\mathrm{K}$ per kilometer to $216.65\,\mathrm{K}$ at $11\,\mathrm{km}$, constant to $20\,\mathrm{km}$, then warming — slowly to $32\,\mathrm{km}$, faster to $47\,\mathrm{km}$. The **U.S. Standard Atmosphere 1976** publishes this. The lesson's table uses these layers, with a simplified altitude; the published tables, which correct for gravity weakening with height, differ by about 2% at $30\,\mathrm{km}$ — far too little to change the point. Upper-atmosphere models such as NRLMSISE-00 go further, adding the effect of the Sun's activity.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="60" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="310,170 140,137 140,110 169,74 268,29" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <g stroke="#6c7a93" stroke-dasharray="3 3">
    <line x1="60" y1="137" x2="340" y2="137"/><line x1="60" y1="110" x2="340" y2="110"/><line x1="60" y1="74" x2="340" y2="74"/><line x1="60" y1="29" x2="340" y2="29"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="174">0 km</text><text x="55" y="141">11</text><text x="55" y="114">20</text><text x="55" y="78">32</text><text x="55" y="33">47</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="188">217 K</text><text x="310" y="188">288 K</text>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="200" y="158">cools</text><text x="146" y="127">constant</text><text x="176" y="98">warms slowly</text><text x="240" y="60">warms faster</text>
  </g>
</svg>
```
:::

::: context max-q Why the push peaks
Near the pad the air is thick but the rocket is slow, so $q = \tfrac12 \rho v^2$ is small. High up the rocket is fast but the air is nearly gone, so $q$ is small again. In between, speed is climbing fast while density is falling, and the product reaches a maximum: **max-Q**. For many orbital rockets it comes roughly one to one and a half minutes after liftoff, at around 10 to 15 kilometers. Launch commentators call it out because it is the moment of greatest aerodynamic stress, and many rockets throttle their engines down briefly to get through it.
:::

::: context tvc Steering with the engine
A rocket climbing through thin air cannot steer with fins the way a plane does for most of its flight. Instead it swivels its engines on a joint called a **gimbal**, tilting the exhaust so the thrust pushes slightly sideways. That sideways push twists the vehicle about its center of mass. This is **thrust vector control**. The same actuator that fixes misalignment also flies the pitch program and rejects wind gusts, so its authority is shared among all of them — one reason a dispersion campaign must stress them together.
:::

::: context moment-of-inertia Hard to turn
Mass says how hard something is to push; the **moment of inertia** says how hard it is to spin. It depends on where the mass sits: mass far from the turning axis counts much more, by the square of its distance. That is why a figure skater spins faster when she pulls her arms in. A long rocket turning end over end has huge inertia because so much of it is far from the middle. The cylinder formula $\tfrac{1}{12} m (3r^2 + L^2)$ shows it: the $L^2$ term dominates for a long, thin body.
:::

::: context imu The box that feels motion
An **inertial measurement unit** holds three gyroscopes, which sense turning rate, and three accelerometers, which sense acceleration, one per axis. Every real one has **bias** (a small constant error — it reads slightly nonzero at rest) and **noise** (random jitter). Integrate a biased rate for a minute and the error in angle grows steadily. Navigation software estimates and removes as much as it can, but a dispersion campaign must feed it realistic sensor errors so the controller is tested on what it will really see.
:::

::: context worst-case Why the tail matters
Sort the Monte Carlo runs from best to worst. Most crowd near the middle; a few sit at the bad end, called the **tail**. A tail case is usually several unlucky things happening at once — a strong gust at max-Q on a heavy vehicle with a misaligned engine. An average can hide it completely. A requirement is usually written as a success rate the vehicle must meet with stated confidence, which is why engineers read the worst cases one by one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1d6fd1">
    <rect x="40" y="108" width="24" height="12"/><rect x="64" y="84" width="24" height="36"/><rect x="88" y="52" width="24" height="68"/>
    <rect x="112" y="36" width="24" height="84"/><rect x="136" y="52" width="24" height="68"/><rect x="160" y="80" width="24" height="40"/>
    <rect x="184" y="100" width="24" height="20"/><rect x="208" y="110" width="24" height="10"/>
  </g>
  <g fill="#b4232c"><rect x="256" y="114" width="24" height="6"/><rect x="280" y="116" width="24" height="4"/></g>
  <line x1="246" y1="24" x2="246" y2="120" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="250" y="36" font-size="11" fill="#b4232c">requirement</text>
  <text x="124" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">average: fine</text>
  <text x="280" y="108" font-size="11" fill="#b4232c" text-anchor="middle">tail</text>
  <text x="180" y="140" font-size="11" fill="#6c7a93" text-anchor="middle">miss distance, small to large</text>
</svg>
```
:::
