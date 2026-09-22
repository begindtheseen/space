---
id: l01-perturbations-overview
title: The perturbed two-body problem
minutes: 24
covers:
  - perturbation sources ranked by magnitude in LEO and GEO
  - general vs special perturbations
---

Every orbit you propagated in the two-body module was wrong the moment you computed it. Earth is not a point mass, the atmosphere does not stop at some clean boundary, the Moon and Sun pull on every spacecraft as hard as they pull on Earth itself, and sunlight carries momentum. None of that appears in $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$. The two-body solution is not a deficient model to be abandoned; it is the dominant term of a sum, and everything in this module is about the rest of that sum: how large each remaining term is, how it changes an orbit over time, and how you compute with it.

This matters differently depending on where you fly. A low Earth orbit loses so much altitude to atmospheric drag that an uncontrolled satellite deorbits in months to years, and its ground track drifts measurably within a single day from a term you have not met yet. A geostationary satellite is stable against drag for a human lifetime, yet still needs propellant every few weeks to fight a perturbation that barely registers in low orbit. A GPS satellite must be propagated well enough that a $10\,\mathrm{ns}$ timing error does not become a $3\,\mathrm{m}$ position error for a user on the ground, which forces you to account for effects an order of magnitude smaller still. Every one of these engineering facts is a statement about the relative size of a perturbing acceleration, at a particular altitude, next to the pull of a point-mass Earth.

This lesson sets up the perturbed equation of motion, defines the two families of methods used to solve it — general perturbations and special perturbations — and sizes the six or so accelerations that matter, at two altitudes, so that the rest of the module has a map to work from. Every number here is computed the same way you will compute it yourself in the lessons that derive it; this lesson previews the answers so you know what you are building toward.

## The perturbed equation of motion

Write the total acceleration of a spacecraft as the two-body term plus everything else:

$$
\ddot{\mathbf{r}} = -\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p ,
$$

where $\mathbf{a}_p$ is the sum of every perturbing acceleration: non-spherical gravity, atmospheric drag, third-body attraction from the Moon and Sun, solar radiation pressure, tides, and relativistic corrections. Each of these has its own physical origin and its own formula, developed lesson by lesson from here on, but they enter the equation of motion the same way — as an additive term next to the central force.

A useful way to talk about the size of a perturbation is the dimensionless ratio

$$
\varepsilon = \frac{\lVert \mathbf{a}_p \rVert}{\lVert \mathbf{a}_{\text{2-body}} \rVert} = \frac{\lVert \mathbf{a}_p \rVert\, r^2}{\mu} ,
$$

which tells you, at a glance, how many orders of magnitude smaller the perturbation is than the force that actually holds the spacecraft in orbit. For Earth's oblateness term $J_2$, this ratio is

$$
\varepsilon_{J_2} = \frac{3}{2}J_2\left(\frac{R_E}{r}\right)^2 ,
$$

derived in full in the next lesson; for now, treat it as the headline number that tells you whether $J_2$ is a footnote or the main story at a given altitude.

::: example The smallness parameter at two altitudes
Take $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, $J_2 = 1.082\,626\,68\times10^{-3}$, $R_E = 6378.137\,\mathrm{km}$. At $400\,\mathrm{km}$ altitude, $r = 6778.137\,\mathrm{km}$:
$$
\varepsilon_{J_2} = \frac{3}{2}(1.082\,626\,68\times10^{-3})\left(\frac{6378.137}{6778.137}\right)^2 = 1.4379\times10^{-3} ,
$$
about one part in $695$. At geostationary altitude, $r = 42\,164.137\,\mathrm{km}$:
$$
\varepsilon_{J_2} = \frac{3}{2}(1.082\,626\,68\times10^{-3})\left(\frac{6378.137}{42\,164.137}\right)^2 = 3.716\times10^{-5} ,
$$
about one part in $26\,900$. The ratio of the two, $38.70$, equals $(r_{\text{GEO}}/r_{\text{LEO}})^2$ exactly, because $\varepsilon_{J_2} \propto 1/r^2$: $J_2$'s own acceleration falls off as $r^{-4}$ against the two-body term's $r^{-2}$, so its *relative* size falls as $r^{-2}$. This single scaling fact is why $J_2$ dominates low orbit design and is a much smaller player at geostationary altitude — not zero, as the table below shows, but no longer alone at the top.
:::

## General perturbations and special perturbations

There have historically been two ways to answer "where will this perturbed orbit be at some later time", and both remain in daily use.

**Special perturbations** means numerically integrating the perturbed equation of motion directly: pick a state $\mathbf{r}_0, \mathbf{v}_0$, evaluate $\mathbf{a}_p$ at each instant from whatever physical models you trust, and step forward with a numerical integrator — Runge–Kutta, an adaptive method, or the specialised methods (Cowell's and Encke's) that a later lesson builds. "Special" here is used in the old sense of *particular*: the answer is a numerical trajectory tied to one specific initial condition and one specific set of force models, not a formula. This is the general-purpose tool: it handles any force model you can write an acceleration for, to any accuracy your step size and floating-point precision allow, without caring whether the eccentricity is $0.001$ or $0.9$. Its cost is computational — a year of a GEO satellite's life is millions of force evaluations — and it gives you a trajectory, not insight into *why* the orbit evolves the way it does.

**General perturbations** means deriving analytic or semi-analytic expressions for how the orbital elements change over time, by averaging the disturbing forces over one orbit (or longer) and solving the resulting simplified equations in closed form or as a compact series. The nodal regression rate you will derive two lessons from now, $\dot{\Omega} = -\tfrac{3}{2}nJ_2(R_E/a)^2\cos i /(1-e^2)^2$, is a general-perturbations result: a formula, not a trajectory, valid for any epoch and any nearby set of elements, and it tells you immediately *why* the node drifts (oblateness, via the $J_2$ and $\cos i$ factors) in a way that a column of numbers from an integrator does not. Its cost is analytic labour and restricted validity — the averaging step usually assumes the perturbation is small and slowly varying, and higher precision requires more terms, more algebra, and more restrictive assumptions. The world's satellite catalogue is propagated with a general-perturbations theory called SGP4, covered in this module's second-to-last lesson, precisely because it can produce a state from a compact element set in microseconds without integrating anything.

Neither approach is obsolete. A mission designer sizing a station-keeping budget wants the general-perturbations formula, because it shows the design levers directly — change the inclination, change the drift rate. A navigation filter propagating between two GPS measurements wants special perturbations, because it needs the true, un-averaged trajectory including every short-period wiggle. Most real flight software uses both: a numerical propagator for truth, checked against, and occasionally re-tuned against, analytic rates that catch modelling bugs a pure number cannot.

::: key General vs special perturbations
**Special perturbations**: numerically integrate the full perturbed equation of motion; a trajectory, valid for one initial condition, as accurate as the force model and integrator allow, computationally expensive over long spans.
**General perturbations**: analytically average the perturbing forces over an orbit and solve for the secular and periodic drift of the elements; a formula, valid near a family of orbits, computationally cheap, but approximate by construction.
:::

## Sizing the perturbations: low orbit and geostationary orbit

The table below states, without derivation, the magnitude of every perturbing acceleration this module covers, at $400\,\mathrm{km}$ altitude (a typical low Earth orbit) and at geostationary altitude. Every number is computed the same way the later lessons compute it — from the closed-form $J_2$ acceleration, from an explicit atmospheric density assumption, from the exact third-body differential-acceleration formula, from the solar radiation pressure constant — and every one of them reproduces to the figures shown when you run the formula yourself. Treat this as the map; the legend for each entry is a lesson still ahead of you.

| Acceleration | LEO, $400\,\mathrm{km}$ ($\mathrm{m/s^2}$) | GEO ($\mathrm{m/s^2}$) |
| --- | --- | --- |
| Two-body ($\mu/r^2$) | $8.68$ | $0.224$ |
| $J_2$ | $1.25\times10^{-2}$ | $8.33\times10^{-6}$ |
| Higher zonals ($J_3$, $J_4$) | $\sim2$–$3\times10^{-5}$ | $\sim10^{-9}$ |
| Atmospheric drag | $10^{-7}$ to $10^{-5}$ | negligible |
| Lunar third body | $1.20\times10^{-6}$ | $8.68\times10^{-6}$ |
| Solar third body | $5.37\times10^{-7}$ | $3.34\times10^{-6}$ |
| Solar radiation pressure | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ |

Two features of this table carry the whole module. First, at $400\,\mathrm{km}$, $J_2$ outweighs every other perturbation by two to five orders of magnitude — it is not "a correction", it is the second most important force in the problem, full stop, and the next several lessons treat it accordingly. Second, the ranking is not the same in the two columns. Drag has vanished entirely (there is essentially no atmosphere to speak of at geostationary altitude). The lunar and solar terms have grown by roughly an order of magnitude even though nothing about the Moon or Sun changed — what changed is the spacecraft's own distance from Earth, and third-body acceleration grows with that distance while $J_2$ shrinks with it. By geostationary altitude $J_2$ and lunar attraction are within a factor of two of each other, which is exactly why geostationary station-keeping budgets split their propellant between inclination control (fighting lunisolar perturbation) and longitude control (fighting the geopotential's longitudinal asymmetry), rather than spending it all on one term the way a low-orbit mission effectively does on $J_2$ and drag.

::: example Why third-body attraction grows with altitude
The leading-order (tidal) approximation for a third body of parameter $\mu_3$ at distance $d$ is $a_{3\text{rd}} \approx 2\mu_3 r/d^3$ for a spacecraft aligned with the third body, where $r$ is the spacecraft's own geocentric distance. For the Moon, $\mu_{\text{Moon}} = 4902.800\,\mathrm{km^3/s^2}$, $d = 384\,400\,\mathrm{km}$:
$$
a_{3\text{rd}}(\text{LEO}) \approx \frac{2(4902.800)(6778.137)}{384\,400^3} = 1.170\times10^{-9}\,\mathrm{km/s^2} = 1.17\times10^{-6}\,\mathrm{m/s^2},
$$
$$
a_{3\text{rd}}(\text{GEO}) \approx \frac{2(4902.800)(42\,164.137)}{384\,400^3} = 7.28\times10^{-9}\,\mathrm{km/s^2} = 7.28\times10^{-6}\,\mathrm{m/s^2}.
$$
The ratio is $6.23$, close to the $r$ ratio itself ($42\,164.137/6778.137 = 6.22$), confirming that this term grows *linearly* with the spacecraft's distance from Earth, in the opposite direction to $J_2$'s $r^{-4}$ fall-off. Two perturbations moving in opposite directions as $r$ grows are guaranteed to cross somewhere, and that crossing is why the ranking in the table above is not the same in its two columns.
:::

::: warning "Small" is relative to what, exactly
A perturbing acceleration of $10^{-5}\,\mathrm{m/s^2}$ sounds negligible next to $8.68\,\mathrm{m/s^2}$ of two-body gravity — a ratio of about one part in a million. But an orbit designer does not care about one instant; a constant acceleration of $10^{-5}\,\mathrm{m/s^2}$ applied for an entire day changes velocity by nearly $1\,\mathrm{m/s}$, and applied for a month changes it by tens of metres per second — comparable to an entire orbit-raising manoeuvre. "Small" perturbations are small per unit time; integrated over the lifetime of a mission, they are frequently the largest design driver in the vehicle.
:::

## Which perturbations this module builds

The rest of this module works through each row of the table in enough depth to derive it, not just quote it: the geopotential and $J_2$'s secular effects on the node and perigee (with sun-synchronous and frozen orbits as design applications), atmospheric drag and its ballistic coefficient, third-body attraction, solar radiation pressure and eclipses, and the smaller effects of tides and relativity. Alongside the physics, it builds the machinery to *compute* with a perturbed orbit: the Gauss variational and Lagrange planetary equations that connect a perturbing acceleration to the drift of each orbital element, the distinction between mean and osculating elements that explains why an element you compute from a single state vector is not the number you should trend, the Cowell and Encke special-perturbation integration methods, and SGP4 — the general-perturbations theory behind every publicly available satellite ephemeris.

::: example A first look at the drag term's uncertainty
The drag row in the table above spans two orders of magnitude, from $10^{-7}$ to $10^{-5}\,\mathrm{m/s^2}$, for the *same* $400\,\mathrm{km}$ orbit. That is not sloppy bookkeeping; it reflects that thermospheric density at a fixed altitude varies by more than an order of magnitude between solar minimum and solar maximum, and can jump by a further factor of several within hours during a geomagnetic storm. Using an illustrative exponential density model with reference values $\rho_{400} = 1\times10^{-12}\,\mathrm{kg/m^3}$ (quiet Sun) and $\rho_{400} = 4\times10^{-11}\,\mathrm{kg/m^3}$ (active Sun) at $400\,\mathrm{km}$, and a representative ballistic coefficient $B = m/(C_DA) = 100\,\mathrm{kg/m^2}$, the drag lesson later in the module computes exactly this spread from the acceleration formula $a_D = \tfrac{1}{2}\rho v_{\text{rel}}^2/B$. No amount of care in the rest of the force model removes this factor-of-forty uncertainty; it has to be carried through to any lifetime prediction honestly, which is the drag lesson's central point.
:::

## Check yourself

::: check
Two spacecraft are at $400\,\mathrm{km}$ and at geostationary altitude. Without computing anything, say which perturbation you expect to matter most for each, and why.
:::

::: answer
At $400\,\mathrm{km}$, $J_2$ dominates every other perturbation by two to five orders of magnitude, because $\varepsilon_{J_2} = \tfrac32 J_2(R_E/r)^2$ is largest close to Earth (it falls off as $r^{-2}$ relative to the two-body term). At geostationary altitude, $J_2$ has fallen to about $3.7\times10^{-5}$ of the two-body term and lunisolar third-body attraction — which *grows* with $r$ rather than shrinking — has caught up to roughly the same size, so the two compete rather than one dominating. Drag is significant only at $400\,\mathrm{km}$; at geostationary altitude there is no meaningful atmosphere.
:::

::: check
Explain, using only the scaling of each acceleration with $r$, why atmospheric drag and $J_2$ are both large in low orbit but only $J_2$'s *relative* importance survives at higher altitude while third-body attraction's does not shrink.
:::

::: answer
Drag depends on atmospheric density, which falls off exponentially with altitude (a scale height of tens of kilometres), so it is enormous just above the atmosphere and effectively zero within a few hundred kilometres of vanishing entirely — a much faster decay than any power law. $J_2$'s absolute acceleration falls off as $r^{-4}$, faster than the two-body term's $r^{-2}$, so its *relative* size $\varepsilon_{J_2} \propto r^{-2}$ shrinks steadily but never vanishes — it is still the largest single perturbation at geostationary altitude, no longer overwhelming. Third-body attraction is a tidal effect that *grows* linearly with the spacecraft's own distance from Earth (for fixed Moon or Sun distance), so unlike $J_2$ and drag it becomes more important, not less, as altitude increases.
:::

::: check
A mission designer says "the perturbation is only one part in a million of gravity, so I am ignoring it in the lifetime budget." What is wrong with that reasoning, in general?
:::

::: answer
A ratio to the instantaneous gravitational acceleration says nothing about the accumulated effect over time. A constant $10^{-5}\,\mathrm{m/s^2}$ perturbation — about one part in $10^6$ of low-orbit gravity — changes velocity by nearly $1\,\mathrm{m/s}$ per day and tens of metres per second over a month, which is not negligible next to typical station-keeping or orbit-raising budgets. Whether a perturbation can be ignored depends on the mission's tolerance and time horizon, not on its instantaneous size relative to the dominant force.
:::

::: check
State one advantage and one disadvantage each of general perturbations and special perturbations.
:::

::: answer
General perturbations (analytic/semi-analytic element rates): advantage is speed and insight — a closed-form rate like $\dot\Omega$ shows directly which design parameters control the drift, and evaluating it costs almost nothing; disadvantage is that it is approximate, built on averaging and small-perturbation assumptions that break down for large perturbations or long propagation without re-derivation. Special perturbations (numerical integration of the full equation of motion): advantage is generality and accuracy — any force model can be added, to any precision the step size allows, with no restriction on eccentricity or perturbation size; disadvantage is computational cost and a loss of direct insight, since the output is a trajectory rather than a formula that explains *why*.
:::

::: check
A satellite in a highly eccentric orbit spends most of its time near apogee, at $40\,000\,\mathrm{km}$, and a small fraction of its time near a $500\,\mathrm{km}$ perigee. Which of the perturbations in this lesson's table would you expect to act almost entirely near perigee rather than being spread evenly around the orbit?
:::

::: answer
Atmospheric drag and, to a lesser extent, the higher zonal harmonics ($J_3$, $J_4$, all falling off faster than $J_2$) act almost entirely near perigee, because both depend on a high power of $1/r$ and the atmosphere itself only exists within a few hundred kilometres of Earth's surface — at $40\,000\,\mathrm{km}$ there is no atmosphere at all. $J_2$ itself, third-body attraction, and solar radiation pressure act throughout the orbit, though their absolute size still varies with $r$ (or is roughly constant, for SRP) across the large range of altitude an eccentric orbit sweeps through.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_p$ | Perturbed two-body equation of motion; $\mathbf{a}_p$ is the sum of all disturbing accelerations |
| $\varepsilon = \lVert\mathbf{a}_p\rVert r^2/\mu$ | Dimensionless smallness parameter for a perturbation |
| $\varepsilon_{J_2} = \tfrac32 J_2(R_E/r)^2$ | $J_2$'s relative size; falls as $r^{-2}$ |
| General perturbations | Analytic/semi-analytic element-rate theory (e.g. SGP4); fast, approximate, explanatory |
| Special perturbations | Direct numerical integration of the full equation of motion (e.g. Cowell, Encke); slow, general, exact to numerical precision |
| At $400\,\mathrm{km}$ | $J_2 \gg$ higher harmonics $\gtrsim$ drag $\gtrsim$ lunisolar $\gg$ SRP |
| At GEO | $J_2 \approx$ lunisolar $\gg$ SRP; drag negligible |
| $a_{3\text{rd}} \propto r$, $a_{J_2} \propto r^{-4}$ | Opposite scalings guarantee the ranking changes with altitude |

The next lesson derives $\varepsilon_{J_2}$'s formula from first principles: the geopotential as a sum of spherical harmonics, and the $J_2$ oblateness term that dominates every other coefficient in it.
