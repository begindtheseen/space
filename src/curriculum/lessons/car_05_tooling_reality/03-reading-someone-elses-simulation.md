---
id: l03-reading-someone-elses-simulation
title: "Reading a simulation someone else built"
minutes: 21
covers:
  - 6-DOF simulation stacks and what high fidelity actually means
---

Picture moving into an old house. The wiring was added to over forty years by different electricians. Some switches do nothing. Two switches in the hall look identical, but only one turns on the porch light. Before you rewire anything, you had better find out which switch does what.

Every simulation you have built so far, you built from nothing. You chose the equations of motion, wrote the **integrator** (the code that steps the motion forward in time), and you know what every line does because you wrote every line. That does not prepare you for the first thing most GNC work actually involves, which is the opposite. You are handed a simulation that already exists. Nobody now on the team wrote all of it. It is spread across hundreds of files built up over years. You get a specific question to answer and no guided tour.

This is not a special case for one kind of job. Any codebase old enough to be useful is old enough to have layers, dead ends, half-finished experiments, and two versions of something that look alike but are not quite. Reading that kind of system is a skill: finding the one model you need, understanding what it does before you trust it, and making your first contribution a safe one. Coursework has no reason to teach it, because coursework never hands you someone else's simulation. This lesson teaches it, using a six-degree-of-freedom simulation stack as the running example, because that is the thing you are most likely to be handed early.

## What a 6-DOF stack is

### Six ways to move

A **degree of freedom** is one independent way something can move. A bead on a wire has one: along the wire. A rocket in flight has six — **[[6-DOF|six-dof]]**, said "six D-O-F" or "six dof":

- three **translational**: sliding along each of three axes (forward–back, left–right, up–down);
- three **rotational**: turning about each of those axes (roll, pitch and yaw).

A **6-DOF simulation** moves all six forward in time *together*. They cannot be solved separately for a real vehicle. The forces that push it depend on which way it is pointing — thrust and drag point along the body. And the twisting forces, called **torques**, depend partly on how it is moving. A simulation that treats the vehicle as a single dot, ignoring which way it points, is called a **point-mass** model; it has only the three translational degrees of freedom.

### The stack around the core

A 6-DOF **stack** is that core surrounded by everything needed to make it act like a real vehicle rather than an idea. Each layer is usually its own file or module:

- an **environment model**: gravity, air density and wind, as functions of position and time;
- a **vehicle model**: mass, **center of mass** (the balance point) and **[[inertia tensor|inertia-tensor]]** (how hard it is to spin about each axis), all changing as propellant is used up;
- an **aerodynamics model**: the air's forces and torques, as functions of **[[Mach number and angle of attack|mach-aoa]]** and the vehicle's shape;
- a **propulsion model**: thrust and how fast propellant is used, possibly as a burn that takes time rather than an instant kick;
- **sensor models**: they take the true state and spoil it with noise, bias and delay before anything downstream sees it, as real sensors do;
- **actuator models**: they give commands real limits and lags, the way real engines and fins cannot move instantly or without limit;
- in many stacks, the actual **flight software under test**, running against this made-up world instead of the real one.

A mature stack also collects variants of several of these: an old aerodynamics table kept for comparison, an experimental atmosphere model that is not yet the default, a simplified sensor model used only in fast test runs. That is not mess. It is what a simulation looks like after years of real use.

### Fidelity is a dial

**Fidelity** means how much of the real physics each sub-model captures. It is a [[dial, not a switch|fidelity-dial]]. For example:

- Drag can use one constant number, or a table that changes with Mach number and angle of attack.
- The atmosphere can be a smooth exponential fade with height, or a full **standard atmosphere** with changes by season and latitude and random wind.
- An engine burn can be an instant change of speed, called **impulsive**, or a **finite burn** where mass drops steadily and gravity pulls the whole time. The finite burn delivers less speed than the instant one — the example later in this lesson measures how much.

Higher fidelity is not free. It costs **runtime** — how long the computer takes. A dispersion campaign, covered later in this module, may run the same scenario thousands of times, so runtime is a real design limit, not an afterthought.

The fidelity a run needs depends on the question. The logic of a guidance algorithm can often be tested correctly against a rough vehicle model. A structural loads study, which asks how hard the air and engines squeeze and bend the vehicle, needs exactly the detailed sub-models the guidance test could skip.

::: key
A 6-DOF stack is not one simulation but a set of interacting sub-models — environment, vehicle, aerodynamics, propulsion, sensors, actuators — each of which can exist at several fidelity levels, often as several files or variants in the same codebase. "High fidelity" means each sub-model captures more of the real, non-idealized physics, at the cost of runtime; the right fidelity is the one that answers the question being asked, not the highest one available.
:::

## Verification and validation: two separate questions

Think of a student solving a physics problem. One question is: did they do the algebra correctly? A separate question is: did they pick the right formula for the situation in the first place? You can get full marks on the algebra and still answer the wrong problem. A simulation faces the same two questions, and it can pass one while silently failing the other.

**Verification** asks: *did we solve the equations correctly?* It is checked against the mathematics itself, whether or not that math describes anything real:

- an **analytic case** — a situation simple enough to have an exact pen-and-paper answer;
- a **conservation law** that must hold whatever the details — total energy when no forces act, or **angular momentum** (the amount of spin) when no torque acts;
- **convergence**: as you make the time step smaller, the answer should settle toward one value.

An unverified simulation might be solving the wrong equations correctly, or the right equations wrongly. Either failure still produces a trajectory that looks like a trajectory.

**Validation** asks: *do the equations describe reality?* It is checked against something outside the simulation: flight data, [[wind-tunnel|wind-tunnel]] results, a trusted independent tool. A simulation can be perfectly verified — every conservation law holds, every analytic case matches to the last digit — and still fail validation, because the aerodynamics table it integrates so carefully is wrong for the actual vehicle.

Both questions need answers, separately, because passing one says nothing about the other. A simulation checked only by watching its trajectory "look reasonable" has done neither. A sign error in a cross-product term, or an aerodynamics table read with its axes in the wrong order, routinely produces a trajectory that is completely wrong and completely believable to someone who has not checked it independently.

::: key
Verification asks whether you solved the equations correctly — analytic cases, energy checks, convergence under step refinement. Validation asks whether the equations describe reality — comparison against flight or test data. A simulation with neither proves nothing.
:::

::: warning A plausible plot is not verification, and it is not validation
The most common mistake when judging a simulation — yours or someone else's — is treating "the trajectory looks physically reasonable" as evidence that it is correct. It is only evidence that nothing went catastrophically wrong, which is a much weaker claim. A specific analytic case, a specific conservation check, or a specific comparison against trusted data earns trust. A good-looking plot earns none.
:::

## Finding the model you actually need

A stack with years of history often has more than one function that seems to compute the thing you want. There may be an old version kept for comparison, a simplified version for fast tests, and a version still being developed on a separate branch. Searching for an obvious name is not enough. You also have to work out which version is actually wired into the run you care about. That means tracing from a known starting point, not guessing from a filename.

::: example Two functions named `density`, one wired in
You need the air-density model the simulation uses. A search with **[[grep|grep]]**, a tool that finds text in files, turns up two hits:

```text
$ grep -rn "def density" .
./sim_pkg/atmosphere_legacy.py:4:def density(alt_m):
./sim_pkg/atmosphere_1976.py:7:def density(alt_m):
```

Read each line as *file : line number : matching text*. Both functions are real, both run without error, and neither filename tells you which one the vehicle's drag calculation uses.

The answer is not inside either `density` function. It is in whichever file *imports* one of them. The drag model needs density, so look at the top of `drag.py`:

```text
$ grep -n "^from\|^import" sim_pkg/drag.py
1:from atmosphere_1976 import density
```

`drag.py` imports from `atmosphere_1976`. So that is the model driving every run through this code path. `atmosphere_legacy` is not exactly dead code, but it is not what this stack currently uses. Using it for a new analysis without checking would quietly use the wrong physics.

Are the two interchangeable? Suppose `atmosphere_1976` implements the [[1976 U.S. Standard Atmosphere|standard-atmosphere]], and `atmosphere_legacy` is an older single exponential, $\rho = 1.225\,e^{-h/8500}\ \mathrm{kg/m^3}$, where $\rho$ ("rho") is density and $h$ is altitude in meters. Evaluating both:

| Altitude | `atmosphere_1976` | `atmosphere_legacy` | Legacy minus 1976, as % of 1976 |
| --- | --- | --- | --- |
| $0\ \mathrm{m}$ | $1.2250\ \mathrm{kg/m^3}$ | $1.2250\ \mathrm{kg/m^3}$ | $+0.0\%$ |
| $5000\ \mathrm{m}$ | $0.7364\ \mathrm{kg/m^3}$ | $0.6803\ \mathrm{kg/m^3}$ | $-7.6\%$ |
| $15\,000\ \mathrm{m}$ | $0.1948\ \mathrm{kg/m^3}$ | $0.2098\ \mathrm{kg/m^3}$ | $+7.7\%$ |

Work one row through. At $5000\ \mathrm{m}$ the legacy model gives $1.225 \times e^{-5000/8500} = 1.225 \times e^{-0.588} \approx 1.225 \times 0.5553 \approx 0.6803$. The difference is $0.6803 - 0.7364 = -0.0561$, and $-0.0561 / 0.7364 \approx -7.6\%$.

At sea level the two agree exactly, because both start from $1.225$. Higher up they disagree by about $8\%$ — and in *opposite directions* at the two altitudes, so the error does not even have a consistent sign you could correct for. Drag is proportional to density, so the drag force would be off by the same percentages. Reading one import line before touching either function turns "there are two of these, I'll guess" into an actual answer.
:::

The method behind that example scales to a far bigger codebase. Start from an **entry point** you trust — usually the top-level program that actually gets run. Follow the calls downward, file by file, until you reach the function that computes the quantity you care about. This map of who calls whom is the **[[call graph|call-graph]]**. A name match tells you a candidate exists. Only the call graph tells you which candidate is real for the run you are looking at.

## Why the first useful contribution is usually a test

When you join a stack like this, the temptation is to start by changing something: fixing what looks like an obvious bug, or adding the feature you were asked for. For your first contribution, resist — for a concrete reason, not as a rule of thumb. You do not yet know what depends on the current behavior. A change to unfamiliar code is exactly the kind most likely to break something you cannot see.

A test does not have that problem. A test that reproduces a known result can be:

- an analytic case, for verification;
- a comparison against a trusted output, for validation;
- a **[[characterization test|characterization-test]]**, which records what a function does today.

It is low-risk in the way that matters here. If the test is wrong, it fails loudly and harms nothing. A wrong change to model behavior can ship silently.

Writing that first test also forces the reading you need to do anyway. To write a test that pins down what `atmosphere_1976.density` should return at a given altitude, you have to trace how it is called, what units its caller expects, and what a correct answer looks like. That is exactly the understanding you would need before making any real change. The test is not a detour from understanding the code. Writing it is *how* the understanding gets built — and it leaves something behind for the next person, who may well be you, months later.

::: example Impulsive versus finite burn: the same stack, two fidelities, different answers
A stack might offer both an idealized impulsive burn and a finite-burn model for the same vehicle. Picking the wrong one for the question produces a specific, measurable error.

Take a straight-up (vertical) burn with specific impulse $I_{sp} = 300\ \mathrm{s}$, starting mass $m_0 = 10\,000\ \mathrm{kg}$ and final mass $m_f = 4000\ \mathrm{kg}$.

**Step 1: the ideal answer.** The rocket equation, which ignores gravity and pretends the burn is instant, gives

$$
\Delta v_{\text{ideal}} = I_{sp}\, g_0 \ln\!\left(\frac{m_0}{m_f}\right) = 300 \times 9.80665 \times \ln 2.5 \approx 2695.7\ \mathrm{m/s}.
$$

Here $\ln 2.5 \approx 0.91629$, and $300 \times 9.80665 = 2942.0$, so $2942.0 \times 0.91629 \approx 2695.7$.

**Step 2: the finite burn.** Now let the burn last $120\ \mathrm{s}$, with mass dropping steadily and gravity pulling the whole time. The propellant used is $10\,000 - 4000 = 6000\ \mathrm{kg}$, so the flow rate is $\dot{m} = 6000 / 120 = 50\ \mathrm{kg/s}$ ($\dot{m}$ is read "m dot"). Thrust is $I_{sp}\, g_0\, \dot{m} = 2942.0 \times 50 \approx 147\,100\ \mathrm{N}$. At the start the weight is $10\,000 \times 9.80665 \approx 98\,070\ \mathrm{N}$, so thrust beats weight by a factor of $1.5$ and the rocket does climb. Stepping forward in time, $0.01\ \mathrm{s}$ at a time:

```python
g0, Isp = 9.80665, 300.0
m0, mf, burn_time = 10_000.0, 4_000.0, 120.0
mdot = (m0 - mf) / burn_time     # 50.0 kg/s
dt = 0.01
v, m = 0.0, m0
for _ in range(int(burn_time/dt)):
    v += (Isp*g0*mdot/m - g0) * dt   # acceleration = thrust/mass - gravity
    m -= mdot*dt
print(round(v, 1))   # 1518.8 m/s actually gained
```

**Step 3: compare.** The difference is $2695.7 - 1518.8 \approx 1176.9\ \mathrm{m/s}$. This is **[[gravity loss|gravity-loss]]**: speed spent holding the rocket up against gravity during the burn instead of speeding it up.

**Sanity check.** Gravity takes away $g_0$ of speed every second it acts, so over $120\ \mathrm{s}$ the loss should be $g_0 \times t_{\text{burn}} = 9.80665 \times 120 \approx 1176.8\ \mathrm{m/s}$. That matches the simulation to within its own small step-size error.

So $1176.9 / 2695.7 \approx 44\%$ of the idealized delta-v disappears into gravity loss for this burn. A guidance study run against the impulsive model, when the question actually depends on gravity loss, is not a little less accurate. Its answer is off by nearly half — and nothing about a quick look at either trajectory would tell you which model you were looking at.
:::

## Check yourself

::: check
Define 6-DOF, and name at least four kinds of sub-model a high-fidelity stack typically includes besides the core integrator.
:::

::: answer
6-DOF means three translational and three rotational degrees of freedom, propagated together because forces depend on orientation and torques depend on motion. Besides the integrator, a high-fidelity stack typically includes an environment model (gravity, atmosphere, wind), a vehicle mass-properties model, an aerodynamics model, a propulsion model, sensor models and actuator models. Any of these may exist at more than one fidelity level in the same codebase.
:::

::: check
Explain the difference between verification and validation for a simulation, and give an example of a simulation that could pass one while failing the other.
:::

::: answer
Verification asks whether the equations were solved correctly, checked against the mathematics itself — analytic cases, conservation laws, convergence as the step size shrinks. Validation asks whether the equations describe reality, checked against something outside, such as flight or test data.

A simulation with a perfectly correct integrator fed a wrong aerodynamics table would be fully verified — every conservation law and analytic case would check out — yet fail validation, because it accurately solves equations that do not describe the real vehicle.
:::

::: check
Using the two `density` functions example, describe the concrete steps you would take to find which one a specific simulation run actually uses, rather than guessing from the filenames.
:::

::: answer
First search to find every candidate function by name. That only tells you the candidates exist, not which one is active. Then start from the entry point that is actually run and follow its imports and calls downward. In the example, reading `drag.py`'s import line shows it takes `density` from `atmosphere_1976`, which settles what the filenames could not. Only after identifying the active model should you judge whether its behavior is right for your analysis.
:::

::: check
Explain why writing a test is a good first contribution to an unfamiliar simulation codebase, beyond being a safe habit.
:::

::: answer
A test that reproduces a known result is low-risk in a specific sense: if the test itself is wrong, it fails visibly and changes nothing else. A change to model behavior in code you do not yet understand can silently break something you cannot see.

Writing the test also forces exactly the reading and tracing needed to understand the code — how the function is called, what units its caller expects, what a correct answer looks like. So it is not a detour before understanding; it is how understanding gets built, and it leaves a checkable artifact for whoever reads the code next.
:::

::: check
A submitted 6-DOF simulation produces a trajectory plot that looks physically reasonable, but has no unit tests, no comparison against an analytic case, and only a single nominal run. Evaluate it using the ideas in this lesson, and say exactly what is missing.
:::

::: answer
A believable plot shows only that nothing went catastrophically wrong, not that the simulation is correct — a sign error or a mis-indexed table routinely produces a trajectory that still looks like a trajectory.

The submission is missing verification (no analytic case or conservation check shows the equations were solved correctly), validation (no comparison against trusted outside data shows the equations describe reality), and any test that would catch a future change breaking current behavior. A single nominal run also says nothing about how the simulation behaves away from that one case.
:::

## Summary

| Term | Meaning |
| --- | --- |
| 6-DOF | Three translational plus three rotational degrees of freedom, propagated together |
| Stack | The core integrator plus environment, vehicle, aerodynamics, propulsion, sensor and actuator sub-models |
| Fidelity | How much real, non-idealized physics a sub-model captures; a dial traded against runtime |
| Verification | Were the equations solved correctly? Checked against the mathematics itself |
| Validation | Do the equations describe reality? Checked against flight or test data |
| Call graph | Who calls whom, traced from the entry point; tells you which of several look-alike models is live |
| Gravity loss | $\Delta v$ lost to thrusting against gravity over a finite burn, about $g_0\, t_{\text{burn}}$ for a vertical burn |

The next lesson stays inside this kind of codebase and asks a narrower question: what the flight computer itself demands of code running in its control loop, and why a long list of otherwise ordinary techniques is off limits there.

::: context six-dof Three ways to slide, three ways to turn
Hold a toy rocket in front of you. You can slide it forward and back, left and right, up and down — three **translations**. You can also twist it three ways: roll it about its long axis, pitch its nose up and down, and yaw its nose left and right — three **rotations**. That is all the ways a rigid object can move, so six numbers of position and six of speed describe its motion completely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">3 translations (slide)</text>
  <text x="270" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">3 rotations (turn)</text>
  <line x1="180" y1="28" x2="180" y2="142" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="90" y1="90" x2="150" y2="90"/><line x1="90" y1="90" x2="90" y2="35"/><line x1="90" y1="90" x2="50" y2="125"/>
  </g>
  <polygon points="156,90 146,85 146,95" fill="#1d6fd1"/>
  <polygon points="90,29 85,39 95,39" fill="#1d6fd1"/>
  <polygon points="46,129 50,118 57,125" fill="#1d6fd1"/>
  <g font-size="12" fill="#1f2a44">
    <text x="140" y="108">x</text><text x="98" y="42">z</text><text x="62" y="138">y</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="270" y1="90" x2="330" y2="90"/><line x1="270" y1="90" x2="270" y2="35"/><line x1="270" y1="90" x2="230" y2="125"/>
  </g>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <ellipse cx="312" cy="90" rx="6" ry="14"/>
    <ellipse cx="270" cy="52" rx="14" ry="6"/>
    <ellipse cx="243" cy="113" rx="10" ry="8"/>
  </g>
  <g font-size="11" fill="#b4232c">
    <text x="322" y="116">roll</text><text x="290" y="48">yaw</text><text x="200" y="104">pitch</text>
  </g>
</svg>
```
:::

::: context inertia-tensor Why spinning depends on shape
Mass says how hard something is to push. **Moment of inertia** says how hard it is to spin — and it depends on where the mass sits, not only how much there is. A figure skater spins faster by pulling her arms in. A long rocket is easy to roll about its long axis but hard to tumble end over end. The **inertia tensor** is a 3-by-3 table of numbers holding this for every axis at once. As propellant drains from the tanks, it changes, which is why the vehicle model recomputes it during flight.
:::

::: context mach-aoa Two numbers the air cares about
**Mach number** is speed divided by the speed of sound in the surrounding air: Mach 1 is the speed of sound, about $340\ \mathrm{m/s}$ near sea level. Air behaves very differently below, near and above Mach 1, so drag can change sharply there. **Angle of attack** is the angle between where the vehicle points and the direction the air is coming from. At zero, a rocket slices cleanly; at a larger angle, the air pushes sideways and tries to turn it. Aerodynamics tables are usually indexed by these two numbers.
:::

::: context fidelity-dial Choosing where to set the dial
Fidelity comes from the Latin *fidelis*, "faithful": how faithful the model is to reality. Engineers deliberately keep several settings of the dial. A fast, rough model lets a guidance engineer run thousands of cases over lunch; a slow, detailed one is saved for the questions that need it. Using the detailed model for everything wastes computer time; using the rough one for everything misses real effects, as the burn example in this lesson shows.
:::

::: context wind-tunnel Testing in a tunnel of air
A **wind tunnel** blows air at a fixed model of the vehicle, often a small scale copy, while instruments measure the forces and twisting on it. It is one of the main ways to build and check an aerodynamics table before anything flies. Flight data then checks the table again under real conditions. Both are validation: evidence from outside the simulation.
:::

::: context grep Where the word "grep" comes from
**grep** is a command-line tool from the early days of Unix that prints every line in a set of files matching a pattern. Its name comes from an editor command, `g/re/p`: *globally* search for a *regular expression* and *print* the matching lines. The flags in the example mean: `-r` search every file in every folder, `-n` show line numbers. Engineers use it, or faster relatives such as ripgrep, dozens of times a day when reading unfamiliar code.
:::

::: context standard-atmosphere An agreed-on sky
The real atmosphere changes with weather, season and place. For engineering, people agreed on one average version: the **U.S. Standard Atmosphere, 1976**, published by U.S. government agencies including NASA. It gives temperature, pressure and density at each height from set formulas: temperature falls steadily for the first $11\ \mathrm{km}$, then holds at about $-56.5\ ^\circ\mathrm{C}$ for a while. A single exponential is a rougher approximation of it, which is why the two models in the example disagree by several percent.
:::

::: context call-graph A map of who calls whom
A **call graph** is a map of which functions call which. Tracing it from the entry point shows which of two look-alike functions is actually live.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">run_sim.py (entry)</text>
  <rect x="120" y="62" width="120" height="30" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="82" font-size="12" fill="#1f2a44" text-anchor="middle">vehicle.py</text>
  <rect x="120" y="114" width="120" height="30" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="134" font-size="12" fill="#1f2a44" text-anchor="middle">drag.py</text>
  <rect x="20" y="162" width="150" height="30" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="95" y="182" font-size="12" fill="#1f2a44" text-anchor="middle">atmosphere_1976</text>
  <rect x="190" y="162" width="150" height="30" rx="5" fill="#ffffff" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="265" y="182" font-size="12" fill="#6c7a93" text-anchor="middle">atmosphere_legacy</text>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="180" y1="40" x2="180" y2="56"/><line x1="180" y1="92" x2="180" y2="108"/>
    <line x1="160" y1="144" x2="110" y2="157"/>
  </g>
  <polygon points="180,62 175,54 185,54" fill="#1f2a44"/>
  <polygon points="180,114 175,106 185,106" fill="#1f2a44"/>
  <polygon points="104,159 111,152 114,161" fill="#1f2a44"/>
  <text x="300" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">nothing calls it</text>
</svg>
```
:::

::: context characterization-test Recording what the code does today
A **characterization test** does not claim the code is right. It records what the code does now — "at 5000 m this function returns 0.7364" — so that any later change to that behavior is noticed. The idea was popularized by Michael Feathers in his book *Working Effectively with Legacy Code*. It is the safest way to put a fence around old code before you start changing it.
:::

::: context gravity-loss Where the missing speed went
While a rocket burns straight up, part of its thrust only holds it up against gravity. That part adds no speed. Over the $120\ \mathrm{s}$ burn in the example, gravity removes about $9.8\ \mathrm{m/s}$ every second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="11" fill="#1f2a44">ideal</text>
  <rect x="50" y="18" width="300" height="18" fill="#8fb8f0"/>
  <text x="200" y="31" font-size="11" fill="#1f2a44" text-anchor="middle">2695.7 m/s</text>
  <text x="10" y="70" font-size="11" fill="#1f2a44">actual</text>
  <rect x="50" y="58" width="169" height="18" fill="#1d6fd1"/>
  <rect x="219" y="58" width="131" height="18" fill="#f2b880"/>
  <text x="134" y="71" font-size="11" fill="#ffffff" text-anchor="middle">gained 1518.8</text>
  <text x="284" y="71" font-size="11" fill="#1f2a44" text-anchor="middle">lost 1176.9</text>
  <text x="180" y="108" font-size="11" fill="#6c7a93" text-anchor="middle">gravity loss ≈ g₀ × 120 s ≈ 1177 m/s, about 44%</text>
</svg>
```

Real launchers reduce gravity loss by having plenty of thrust and by tipping over toward horizontal soon after launch, so less of the burn is spent straight up.
:::
