---
id: l03-reading-someone-elses-simulation
title: "Reading a simulation someone else built"
minutes: 19
covers:
  - 6-DOF simulation stacks and what high fidelity actually means
---

Every simulation you have built for yourself so far, you built from nothing: you chose the equations of motion, wrote the integrator, and know exactly what every line does, because you wrote every line. That experience does not prepare you for the first thing most GNC work actually involves, which is the opposite situation — a simulation that already exists, that nobody currently on the team wrote entirely from scratch, spread across hundreds of files accumulated over years, that you are handed with a specific question to answer and no guided tour.

This is not a special case reserved for one kind of job. Any codebase old enough to be useful is old enough to have layers, dead ends, half-finished experiments, and two versions of something that look like they do the same thing but do not quite. Learning to read that kind of system — finding the one model you actually need, understanding what it does before you trust it, and making your first contribution to it something safe — is a skill coursework has no reason to teach, because coursework never hands you someone else's simulation. This lesson teaches it directly, using a six-degree-of-freedom simulation stack as the running example, because that is the artifact you are most likely to be handed early.

## What a 6-DOF stack actually is, and what "high fidelity" costs

Six degrees of freedom means three translational — position along each axis — and three rotational — orientation about each axis. A "6-DOF simulation" propagates all six together: the vehicle's translational motion depends on forces that depend on its orientation, and its rotational motion depends on torques that depend partly on how it is moving, so the two cannot be solved separately once you care about a real vehicle rather than a point mass.

A 6-DOF *stack* is that core propagation surrounded by everything needed to make it represent a real vehicle rather than an abstraction: an environment model providing gravity, atmospheric density and wind as functions of position and time; a vehicle model providing mass, center of mass and inertia tensor as functions of propellant remaining; an aerodynamics model providing forces and moments as functions of Mach number, angle of attack and vehicle configuration; a propulsion model providing thrust and mass flow, possibly as a finite burn rather than an instantaneous impulse; sensor models that corrupt the true state with noise, bias and latency before anything downstream sees it; actuator models that impose real limits and lags on commands; and, in many stacks, the actual flight software under test, running against this synthetic world instead of a real one. Each of these is typically its own file or module, and a mature stack accumulates variants of several of them — an old aerodynamics table kept for comparison, an experimental atmosphere model not yet the default, a simplified sensor model used only in fast regression runs. None of that is disorganization; it is what a simulation looks like after years of real use.

"Fidelity" is how much of the real physics each sub-model captures, and it is a dial, not a switch. A drag coefficient can be a single constant, or a table indexed by Mach number and angle of attack; an atmosphere can be a clean exponential decay, or a full standard-atmosphere model with seasonal and latitude variation and stochastic wind; propulsion can be an instantaneous velocity change, or a finite burn with mass depleting continuously and the resulting loss in delivered velocity that comes from spending time fighting gravity while still on the pad or ascending slowly. Higher fidelity is not free — it costs runtime, and a dispersion campaign discussed later in this module might need to run a given scenario thousands of times, which makes runtime a real design constraint, not an afterthought. The fidelity a specific run needs depends on the question being asked: a guidance algorithm's logic can often be exercised correctly against a coarse vehicle model, while a structural loads analysis needs exactly the sub-models a guidance-logic test can safely do without.

::: key
A 6-DOF stack is not one simulation but a set of interacting sub-models — environment, vehicle, aerodynamics, propulsion, sensors, actuators — each of which can exist at multiple fidelity levels, often as several files or variants within the same codebase. "High fidelity" means each sub-model captures more of the real, non-idealized physics, at the cost of runtime; the right fidelity is the one that answers the question being asked, not the highest one available.
:::

## Verification and validation: two separate questions a simulation has to answer

A 6-DOF simulation earns trust by answering two different questions, and it is worth being precise about which is which, because a simulation can pass one and fail the other silently.

**Verification** asks: did we solve the equations correctly? This is checked against the mathematics itself, independent of whether the mathematics describes anything real — an analytic case with a known closed-form answer, a conservation law that has to hold regardless of the details (total energy in a force-free case, angular momentum with no applied torque), or convergence toward a stable answer as the integration step size is refined. A simulation that is not verified might be integrating the wrong equations correctly, or the right equations wrong, and either failure produces a trajectory that still looks like a trajectory.

**Validation** asks a different question: do the equations describe reality? This is checked against something outside the simulation entirely — flight data, wind-tunnel results, a trusted independent tool. A simulation can be flawlessly verified — every conservation law holds, every analytic case matches to machine precision — and still validate against nothing, because the aerodynamics table it integrates so carefully happens to be wrong for the actual vehicle.

Both questions have to be answered, separately, because passing one says nothing about the other. A simulation that has only ever been checked by watching its output trajectory "look reasonable" has done neither: a sign error in a cross-product term, or an aerodynamics table read with the wrong axis order, routinely produces a trajectory that is completely wrong and completely plausible-looking to someone who has not independently checked it.

::: warning A plausible plot is not verification, and it is not validation
The single most common thing to get wrong when evaluating a simulation — your own or someone else's — is treating "the trajectory looks physically reasonable" as evidence that the simulation is correct. It is evidence that nothing has gone catastrophically wrong, which is a much weaker claim. A specific analytic case, a specific conservation check, or a specific comparison against trusted data is what actually earns trust; a good-looking plot earns none.
:::

## Finding the model you actually need

A stack with years of history routinely contains more than one function that looks like it computes the thing you are looking for — an old version kept for comparison, a simplified version used in fast tests, a version under active development on a branch not yet merged. Searching by an obvious name is often not enough by itself; you have to also determine which version is the one actually wired into the run you care about, and that means tracing from a known entry point rather than guessing from a filename.

::: example Two functions named `density`, one wired in
A search across a simulation package for the atmospheric density model turns up two hits:

```text
$ grep -rn "def density" .
./sim_pkg/atmosphere_legacy.py:4:def density(alt_m):
./sim_pkg/atmosphere_1976.py:7:def density(alt_m):
```

Both are real, both run without error, and neither filename by itself tells you which one the vehicle's drag calculation actually uses. The answer is not in either `density` function — it is in whichever file imports one of them:

```text
$ grep -n "^from\|^import" sim_pkg/drag.py
1:from atmosphere_1976 import density
```

`drag.py` imports from `atmosphere_1976`, so that is the model actually driving every simulation run through this code path; `atmosphere_legacy` is not dead code exactly, but it is not what is currently flying in this stack, and using it for a new analysis without checking that would silently use the wrong physics. The two are not interchangeable:

```python
for alt in (0, 5000, 15000):
    a = atmosphere_1976.density(alt)      # 1.22500, 0.68025, 0.20977 kg/m^3
    b = atmosphere_legacy.density(alt)    # 1.22500, 0.62894, 0.16579 kg/m^3
    print(alt, a, b, f"{100*(b-a)/a:+.1f}%")
# 0      1.22500  1.22500   +0.0%
# 5000   0.68025  0.62894   -7.5%
# 15000  0.20977  0.16579  -21.0%
```

At sea level the two models agree exactly; by 15 km they disagree by 21 percent. Reading the import line before touching either function is what turns "there are two of these, I'll guess" into an actual answer.
:::

The general method behind that example scales to a much bigger codebase: start from an entry point you trust — usually the top-level driver that actually gets run — and follow the calls downward until you reach the function that computes the specific quantity you care about, rather than searching for a plausible-sounding name and assuming it is the one in use. A name match tells you a candidate exists. Only the call graph tells you which candidate is real for the run you are looking at.

## Why the first useful contribution is usually a test

Joining a stack like this, the temptation is to start by changing something — fixing what looks like an obvious bug, adding the feature you were actually asked for. Resist that temptation for the first contribution, for a concrete reason rather than a rule of thumb: you do not yet have enough context to know what depends on the current behavior, and a change to unfamiliar code is exactly the kind of change most likely to break something you cannot see. A test does not have that problem. A test that reproduces a known result — an analytic case for verification, a comparison against a trusted output for validation, or simply a characterization of what a specific function currently does — is low-risk in the specific sense that matters here: if it is wrong, it fails loudly and harms nothing, whereas a wrong change to model behavior can ship silently.

Writing that first test also forces the exact reading you need to do anyway. To write a test that pins down what `atmosphere_1976.density` should return at a given altitude, you have to actually trace how it is called, what units its caller expects, and what a correct answer looks like — which is precisely the understanding you would need before making any real change to it. The test is not a detour from understanding the code; writing it is how the understanding gets built, and it leaves something behind that the next person — quite possibly you, months later — benefits from directly.

::: example Point-mass versus finite-burn: the same stack, two fidelities, different answers
A stack might offer both an idealized impulsive burn and a finite-burn model for the same vehicle, and picking the wrong one for the question at hand produces a specific, quantifiable error. For a vertical ascent burn with specific impulse $I_{sp} = 300\ \mathrm{s}$, initial mass $m_0 = 10{,}000\ \mathrm{kg}$ and final mass $m_f = 4{,}000\ \mathrm{kg}$, the idealized rocket equation gives

$$
\Delta v_{\text{ideal}} = I_{sp}\, g_0 \ln\!\left(\frac{m_0}{m_f}\right) \approx 2695.7\ \mathrm{m/s}
$$

Integrating the same burn as a finite-duration event — mass depleting continuously over 120 seconds while gravity acts the whole time — gives a smaller velocity actually gained:

```python
g0, Isp = 9.80665, 300.0
m0, mf, burn_time = 10_000.0, 4_000.0, 120.0
mdot = (m0 - mf) / burn_time     # 50.0 kg/s
dt = 0.01
v, m = 0.0, m0
for _ in range(int(burn_time/dt)):
    v += (Isp*g0*mdot/m - g0) * dt
    m -= mdot*dt
print(round(v, 1))   # 1518.8 m/s actually gained
```

The difference, $2695.7 - 1518.8 \approx 1176.9\ \mathrm{m/s}$, is gravity loss — time spent thrusting against gravity rather than instantaneously changing velocity — and it matches the closed-form estimate $g_0 \cdot t_{\text{burn}} = 9.80665 \times 120 \approx 1176.8\ \mathrm{m/s}$ to well within the numerical integration's own error. Forty-four percent of the idealized delta-v disappears into gravity loss for this burn. A guidance study run against the idealized, impulsive model when the question actually depends on gravity loss is not merely less accurate — its answer is off by nearly half, and nothing about a quick look at either trajectory would announce which one you were looking at.
:::

## Check yourself

::: check
Define 6-DOF, and name at least four categories of sub-model a high-fidelity stack typically includes besides the core integrator.
:::

::: answer
6-DOF means three translational and three rotational degrees of freedom, propagated together because forces depend on orientation and torques depend on motion. A high-fidelity stack typically includes, in addition to the integrator itself: an environment model (gravity, atmosphere, wind), a vehicle mass-properties model, an aerodynamics model, a propulsion model, sensor models, and actuator models — any of which may exist in more than one fidelity level within the same codebase.
:::

::: check
Explain the difference between verification and validation for a simulation, and give an example of a simulation that could pass one while failing the other.
:::

::: answer
Verification asks whether the equations were solved correctly, checked against the mathematics itself — analytic cases, conservation laws, convergence under step refinement. Validation asks whether the equations describe reality, checked against something external such as flight or test data. A simulation with a perfectly correct integrator applied to a wrong aerodynamics table would be fully verified — every conservation law and analytic case would check out — while failing validation, because it accurately solves equations that do not describe the real vehicle.
:::

::: check
Given the two `density` functions example, describe the concrete steps you would take to determine which one is actually used by a specific simulation run, rather than guessing from the filenames.
:::

::: answer
Search first to find every candidate function by name, which only tells you the candidates exist, not which is active. Then start from the entry point actually being run and follow its imports and calls downward — in the example, reading `drag.py`'s import line shows it pulls `density` from `atmosphere_1976` specifically, which settles the question the filenames alone could not. Only after identifying the active model should you evaluate whether its behavior is correct for the analysis at hand.
:::

::: check
Explain why writing a test is a good first contribution to an unfamiliar simulation codebase, beyond simply being a safe convention to follow.
:::

::: answer
A test that reproduces a known result is low-risk in a specific sense — if the test itself is wrong, it fails visibly and changes nothing else, whereas a change to model behavior in code you do not yet understand can break something silently that you have no way to see. Writing the test also forces exactly the reading and tracing needed to understand the code correctly, so it is not a detour before real understanding — it is how that understanding gets built, and it leaves a durable, checkable artifact behind for whoever reads the code next.
:::

::: check
A submitted 6-DOF simulation produces a trajectory plot that looks physically reasonable, but includes no unit tests, no comparison against an analytic case, and only a single nominal run. Evaluate this submission using the ideas in this lesson, and state specifically what is missing.
:::

::: answer
A plausible-looking plot demonstrates only that nothing has gone catastrophically wrong, not that the simulation is correct — a sign error or a mis-indexed table routinely produces a trajectory that still looks like a trajectory. The submission is missing verification (no analytic case or conservation check shows the equations were solved correctly), validation (no comparison against trusted external data shows the equations describe reality), and any test that would catch a future change breaking current behavior. A single nominal run additionally says nothing about how the simulation behaves away from that one specific case.
:::

## Summary

| Term | Meaning |
| --- | --- |
| 6-DOF | Three translational plus three rotational degrees of freedom, propagated together |
| Stack | The core integrator plus environment, vehicle, aerodynamics, propulsion, sensor and actuator sub-models |
| Fidelity | How much real, non-idealized physics a sub-model captures; a dial traded against runtime |
| Verification | Were the equations solved correctly? Checked against the mathematics itself |
| Validation | Do the equations describe reality? Checked against external data |
| Gravity loss | Delivered $\Delta v$ lost to thrusting against gravity over a finite burn, versus the idealized impulsive value |

The next lesson stays inside this same kind of codebase and asks a narrower question: what the flight computer itself demands of code running in its control loop, and why a long list of otherwise ordinary techniques is off limits there.
