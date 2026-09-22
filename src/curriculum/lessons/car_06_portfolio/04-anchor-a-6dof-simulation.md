---
id: l04-anchor-a-6dof-simulation
title: "Anchor A: the 6-DOF launch vehicle simulation"
minutes: 20
covers:
  - "anchor project A — 6-DOF launch vehicle simulation with a real atmosphere model and dispersion campaign"
---

Of the five anchor projects this module specifies, a 6-DOF launch vehicle simulation carries the most weight for one direct reason: it is close to what a vehicle-performance or ascent GNC team's own internal tooling actually is. A guidance engineer's day-to-day work runs on a simulation like this one — propagating translational and rotational states together, forced by an atmosphere model, a propulsion model, and a set of dispersed uncertainties — and almost no new graduate has built one end to end, with the dispersion campaign and the verification evidence to back it. This lesson covers what the project has to contain to earn that weight, using the verification toolkit from the previous lesson and the dynamics and atmosphere models this curriculum develops elsewhere, and what an interviewer on an ascent or vehicle-performance team will actually ask about it.

## What the project has to contain, beyond "it flies"

A 6-DOF simulation propagates translational and rotational states together: three degrees of freedom for the vehicle's position and velocity, three more for its attitude and angular rate, coupled through aerodynamic and propulsive forces and moments that depend on both. The equations of motion themselves — the coupling between translation and rotation, the reference frames, the force and moment models — are developed in depth elsewhere in this curriculum; what this lesson adds is what a defensible *portfolio project* built on top of them needs, beyond correct code.

Getting the dynamics right is necessary and not sufficient. A verified integrator propagating a fictional atmosphere, or one so simplified it hides the vehicle's real structural and control challenges, produces a simulation that runs cleanly and still teaches a reviewer nothing about whether you understand ascent flight. Two things turn a working 6-DOF propagator into a credible anchor project, and they are exactly the two named in this project's brief: a real atmosphere model, and a dispersion campaign built on top of the resulting simulation.

## Why the atmosphere model is not a detail

An exponential atmosphere, $\rho = \rho_0 e^{-h/H}$, is a defensible tool for hand analysis and quick sizing — this curriculum's own atmospheric-flight material uses exactly that model to derive where max dynamic pressure occurs and how it scales. It is not a defensible foundation for a simulation whose whole purpose is to demonstrate you can model ascent flight faithfully, because the single scale height that makes it convenient is also what makes it wrong by a growing margin as altitude increases: within about 10% of a layered model through the max-Q region, roughly a factor of two high by 30 km, further off above that, since the atmosphere's real temperature structure — cooling through the troposphere, isothermal through the lower stratosphere, warming again above it — is not a single exponential decay.

::: example A layered hydrostatic atmosphere against a single-scale-height exponential model
Building a atmosphere density function directly from hydrostatic equilibrium and the ideal gas law, layer by layer through the standard troposphere and stratosphere lapse rates, and comparing it against $\rho=\rho_0 e^{-h/H}$ with $\rho_0=1.225\,\mathrm{kg/m^3}$ and $H=8.435\,\mathrm{km}$ (the sea-level scale height) gives:

| Altitude | Layered $\rho$ (kg/m³) | Exponential $\rho$ (kg/m³) | Difference |
| --- | --- | --- | --- |
| 11 km | $0.3639$ | $0.3325$ | $-8.6\%$ |
| 20 km | $0.0880$ | $0.1144$ | $+29.9\%$ |
| 30 km | $0.0180$ | $0.0350$ | $+94.0\%$ |
| 50 km | $0.000978$ | $0.003263$ | $+233.8\%$ |

At a representative max-Q condition — $12\,\mathrm{km}$, $v=450\,\mathrm{m/s}$ — the layered model gives dynamic pressure $q=\tfrac12\rho v^2=31.47\,\mathrm{kPa}$ against $29.90\,\mathrm{kPa}$ from the exponential fit, a 5.0% difference right at the altitude the fit is tuned to be most accurate for. The gap only grows from there: dynamic pressure, and the structural and control loads that follow directly from it, are exactly what an exponential atmosphere is least trustworthy for once the vehicle climbs past the region the fit was chosen around.
:::

A reviewer on an ascent team has almost certainly built or maintained a real atmosphere model themselves and will ask directly why yours does or does not use one. "An exponential model was accurate enough for the numbers I needed" is a defensible answer if the project's stated requirement genuinely does not depend on dynamic pressure past 20 km; "I did not know the difference mattered" is not, and the comparison above is exactly the kind of number that closes that gap before the question is asked.

::: key
An exponential atmosphere is wrong by a growing, non-trivial margin above the altitude it is fit around — roughly 30% high by 20 km and closing on a factor of two by 30 km for a typical fit, in exchange for a single line of code. A 6-DOF anchor project should use a layered, real atmosphere model and say so in its assumptions section; if it does not, it should say specifically why the requirement does not need one.
:::

## The dispersion campaign: what belongs in it, and why each parameter earns its place

A single nominal trajectory demonstrates the simulation runs. A dispersion campaign — the same simulation run many times with key parameters drawn from stated distributions — demonstrates something an interviewer actually cares about: how the vehicle behaves across the uncertainty it will really fly through, not only in the one case that was easiest to get working. Each dispersed parameter should earn its place by tracing to a real failure mechanism, not by being included because it is easy to randomize.

**Thrust misalignment** — a real gimbal or nozzle is never perfectly aligned with the vehicle's center of mass, and even a fraction of a degree produces a disturbance torque the attitude control system has to correct continuously through the burn.

::: example A representative thrust-misalignment torque, and what happens if it goes uncorrected
A representative first-stage-scale vehicle (uniform-cylinder approximation, $400{,}000\,\mathrm{kg}$, $40\,\mathrm{m}$ long, $1.83\,\mathrm{m}$ radius) has transverse moment of inertia $I \approx \tfrac1{12}m(3r^2+L^2) = 5.37\times10^{7}\,\mathrm{kg\,m^2}$. A $1\,\mathrm{MN}$ engine misaligned by $0.5^\circ$ at a $15\,\mathrm{m}$ gimbal-to-CG arm produces a disturbance torque $\tau = F\sin(0.5^\circ)\times 15\,\mathrm{m} = 1.31\times10^{5}\,\mathrm{N\,m}$, giving an angular acceleration $\alpha=\tau/I=2.44\times10^{-3}\,\mathrm{rad/s^2}\,(0.140^\circ/\mathrm{s^2})$. Left entirely uncorrected — no attitude control loop at all — this would build to $0.14^\circ/\mathrm{s}$ of rate and $0.07^\circ$ of attitude error after one second, growing to $1.75^\circ$ of attitude error by five seconds. The numbers are small over short spans specifically because a real TVC loop corrects continuously; the point of including this parameter in the dispersion set is to confirm the control loop's authority and bandwidth are actually sufficient against the misalignment the hardware specification allows, not to watch the vehicle tumble.
:::

**Wind** — a mean profile plus a discrete or stochastic gust, worst near max dynamic pressure, exactly where a small angle-of-attack perturbation produces the largest possible side load. **Mass properties** — dry mass, propellant mass, and center-of-mass location all carry manufacturing and loading tolerances that shift the vehicle's inertia and, with it, its control authority margins. **IMU bias and noise** — the guidance and control loop only ever sees the sensor's estimate of the vehicle's state, not the true state, so a dispersion campaign that perturbs the trajectory but feeds the controller perfect knowledge is not testing the actual closed loop.

A dispersion campaign is judged on what it reports, not only on how many cases it ran. "Ran 500 dispersed cases" is a count, not a result; a defensible campaign states the pass criterion fixed before the run, the fraction of cases meeting it, and the worst case specifically — not only the mean — because the mean over a dispersion set can look comfortable while a real tail of cases misses the requirement badly.

::: warning
A dispersion campaign run against a controller or guidance law that was tuned and validated only on the nominal, undispersed trajectory tests whether the tuning happened to generalize, not whether it was designed to. If the attitude control gains were chosen by eye against a single nominal run, the honest verification question is whether they were re-checked against the same dispersion set the Monte Carlo uses — and if the answer is no, that gap belongs in the project's limitations section, not left for a reviewer to find by asking.
:::

## What the interviewer asks, and what the project needs ready

A panel reviewing this project will typically press on four things, each traceable to a section of the write-up structure from two lessons ago: why a real atmosphere model rather than an exponential one, closed by the comparison above; how you know the rotational dynamics are correct, closed by the analytic case and conservation checks from the previous lesson, run specifically against this vehicle's inertia and force models rather than a toy case; what exactly is in the dispersion set and why each parameter is there, closed by tracing each one to a real failure mechanism as above; and what the pass criterion was, fixed before the campaign ran, closed by stating it explicitly in the results section rather than choosing one after seeing the numbers.

## Check yourself

::: check
A reviewer asks why your 6-DOF simulation uses a layered atmosphere model instead of the simpler exponential form. Using the numbers from this lesson, give a specific, quantified answer rather than a general one.
:::

::: answer
The exponential model, fit to the sea-level scale height, is within about 9% of a layered model through 11 km but already 30% high by 20 km and 94% high by 30 km — errors that translate directly into wrong dynamic pressure and therefore wrong structural and aerodynamic loads once the vehicle climbs past the altitude the fit is centered on. Even near max-Q, where the exponential fit is at its best, a representative case showed a 5% difference in dynamic pressure. A simulation meant to demonstrate ascent-flight fidelity should use the layered model and reserve the exponential form for back-of-envelope estimates, exactly as this curriculum's own atmospheric-flight material does.
:::

::: check
Explain why thrust misalignment belongs in a dispersion set even though a real vehicle's attitude control loop corrects it continuously, so its effect on the nominal trajectory is small.
:::

::: answer
The dispersion campaign is not testing whether the vehicle tumbles under misalignment — a working control loop prevents that by design. It is testing whether the control loop's authority and bandwidth are sufficient across the full range of misalignment the hardware tolerance actually allows, and whether the correction itself costs an acceptable amount of control effort or propellant. A parameter whose nominal effect is small is not thereby unimportant to disperse; the question a dispersion campaign answers is how the closed-loop system behaves at the edges of the real uncertainty, not how large the open-loop disturbance looks in isolation.
:::

::: check
A project's dispersion campaign report states: "Monte Carlo of 500 cases completed successfully." What is missing, and why does a panel treat this sentence as evidence of a shallow campaign rather than a thorough one?
:::

::: answer
Missing are the pass criterion fixed before the campaign ran, the fraction of the 500 cases that actually met it, and the worst case rather than only a completion count. "Completed successfully" describes the simulation's software behavior — it ran without crashing — and says nothing about whether the vehicle's performance was acceptable across the dispersion set, which is the entire engineering question a dispersion campaign exists to answer. A panel reads this sentence as a red flag rather than a strength, because it is exactly the shape of claim a campaign that was run but never actually evaluated against a requirement would produce.
:::

::: check
Why does a dispersion campaign that perturbs the true trajectory but feeds the attitude controller perfect, noise-free state knowledge fail to test the actual closed loop, even if every other parameter is realistically dispersed?
:::

::: answer
A real flight control system never has access to the true state — only to what its sensors and estimator report, which carries bias, noise, and latency the true-state feedback in this campaign would hide entirely. A controller tuned and evaluated against perfect state knowledge can look robust across a wide dispersion set and still fail once real sensor imperfection is added back in, because sensor error interacts with control bandwidth and gain margins in ways a perfect-knowledge simulation cannot reveal. IMU bias and noise belong in the dispersion set specifically so the campaign exercises the loop the vehicle will actually fly with, not an idealized one.
:::

::: check
State the role family this anchor project maps to most directly, and the single sentence you would use to connect it to that role family in a portfolio README's opening line.
:::

::: answer
Ascent and vehicle-performance GNC — the team responsible for the vehicle's flight from liftoff through the phase this simulation models. A defensible opening line names the connection directly rather than leaving it implied: "6-DOF ascent simulation with a layered atmosphere model and a 500-case dispersion campaign, built to evidence the same high-fidelity vehicle-performance modeling an ascent GNC team's own internal tooling does."
:::

## Summary

| Item | What it needs |
| --- | --- |
| Dynamics | Coupled 6-DOF equations, verified by an analytic case and a conservation check against this vehicle's own models |
| Atmosphere | A layered, real model — exponential is roughly 30% off by 20 km and a factor of two by 30 km |
| Dispersion parameters | Thrust misalignment, wind, mass properties, IMU bias and noise — each traced to a real failure mechanism |
| Dispersion report | Pass criterion fixed in advance, pass fraction, and worst case — not a run count |
| Common trap | Control gains tuned only on the nominal trajectory, never re-checked against the dispersion set itself |
| Role family | Ascent / vehicle-performance GNC |

The next lesson moves from the vehicle's ascent to the phase after it: anchor project B, powered-descent guidance, and the specific numerical trap a fixed-final-time formulation can spring on a Monte Carlo campaign that never checks for it.
