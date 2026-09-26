---
id: l01-perturbations-overview
title: The perturbed two-body problem
minutes: 23
covers:
  - perturbation sources ranked by magnitude in LEO and GEO
  - general vs special perturbations
---

Picture a long bike ride. Almost everything about where you end up is decided by your pedaling and the road. But a light headwind, a slight tilt in the road and the bumps all nudge you a little. On a short trip you can ignore them. Over a whole day, they decide whether you arrive at lunch or after dark.

An orbit works the same way. In the two-body module, one force did everything: the pull of Earth, treated as if all of its mass sat at a single point. That gave clean ellipses that repeat forever. Real spacecraft feel extra nudges too. Earth is not a perfect ball. The air does not stop at a clean edge. The Moon and Sun pull on the spacecraft. Even sunlight pushes. Each extra nudge is called a **[[perturbation|word-perturbation]]** — a small force added on top of the main one.

None of these appear in the two-body equation $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$. That does not make the two-body answer wrong to throw away. It is the biggest term in a sum. This module is about the rest of the sum: how big each extra term is, how it changes an orbit over time, and how you compute with it.

Where you fly decides which nudge matters. A satellite in low orbit loses height to air drag, and an uncontrolled one falls back in months to years. Its ground track also drifts within a single day, from a term you will meet in the next lesson. A geostationary satellite could circle for a lifetime without drag troubling it, yet it still burns propellant every few weeks against a nudge you would barely notice in low orbit. A GPS satellite has to be predicted so well that a **[[10 ns timing error becomes a 3 m position error|gps-timing]]** for a user on the ground, so even tinier effects count. Each of those facts is a statement about how big one extra acceleration is, at one altitude, next to Earth's main pull.

This lesson sets up the equation with the nudges in it, names the two families of methods for solving it, and sizes the six or so accelerations that matter at two altitudes. The rest of the module then has a map to work from.

## The main pull plus the nudges

Write the spacecraft's total acceleration as the two-body term plus everything else:

$$
\ddot{\mathbf{r}} = -\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p .
$$

Read it aloud as "r double-dot equals minus mu r over r cubed, plus a sub p". Here $\mathbf{r}$ is the position vector from Earth's center, $r$ is its length, and $\mu$ ("mu") is Earth's gravitational parameter, $3.986\times10^{14}\,\mathrm{m^3/s^2}$. The new piece is $\mathbf{a}_p$, the **perturbing acceleration**: the sum of every extra nudge.

What goes into $\mathbf{a}_p$? The list is short:

- **non-spherical gravity** — Earth's lumpy, squashed shape;
- **atmospheric drag** — air resistance, even at hundreds of kilometers up;
- **third-body attraction** — the pull of the Moon and the Sun;
- **solar radiation pressure** — the push of sunlight;
- **tides** and **relativistic corrections** — the smallest of all.

Each one has its own physics and its own formula, built lesson by lesson from here on. But they all enter the equation the same way: added next to the central pull.

::: key The perturbed equation of motion
$$
\ddot{\mathbf{r}} = -\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p
$$
$\mathbf{a}_p$ is the sum of all perturbing accelerations: non-spherical gravity, drag, third bodies, solar radiation pressure, tides and relativity.
:::

### How small is small?

The first question about any nudge is its size compared with the main pull. Divide one by the other:

$$
\varepsilon = \frac{\lVert \mathbf{a}_p \rVert}{\lVert \mathbf{a}_{\text{2-body}} \rVert} = \frac{\lVert \mathbf{a}_p \rVert\, r^2}{\mu} .
$$

The symbol $\varepsilon$ is the Greek letter "epsilon", and the double bars $\lVert\cdot\rVert$ mean "the length of this vector". The second form uses the fact that the two-body pull has size $\mu/r^2$. Acceleration divided by acceleration leaves a plain number with no units, so $\varepsilon$ tells you at a glance how many **[[orders of magnitude|orders-of-magnitude]]** the nudge sits below the force that holds the spacecraft up.

The biggest nudge by far comes from Earth's bulging waistline. Its strength is a single number called $J_2$ ("J two"), and its ratio to the main pull is

$$
\varepsilon_{J_2} = \frac{3}{2}J_2\left(\frac{R_E}{r}\right)^2 ,
$$

where $R_E = 6378.137\,\mathrm{km}$ is Earth's equatorial radius. The next lesson derives this. For now, treat it as the headline number that tells you whether $J_2$ is a footnote or the main story at a given height.

::: example The smallness parameter at two altitudes
Use $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, $J_2 = 1.082\,626\,68\times10^{-3}$ and $R_E = 6378.137\,\mathrm{km}$.

**Low orbit, 400 km up.** The distance from Earth's center is $r = 6378.137 + 400 = 6778.137\,\mathrm{km}$. The radius ratio is $6378.137/6778.137 = 0.94099$, and squaring it gives $0.88546$. So

$$
\varepsilon_{J_2} = \frac{3}{2}(1.082\,626\,68\times10^{-3})(0.88546) = 1.4379\times10^{-3} .
$$

That is about one part in $695$.

**Geostationary orbit.** Now $r = 42\,164.137\,\mathrm{km}$. The ratio is $0.151269$, and its square is $0.022882$. So

$$
\varepsilon_{J_2} = \frac{3}{2}(1.082\,626\,68\times10^{-3})(0.022882) = 3.716\times10^{-5} ,
$$

about one part in $26\,900$.

**Sanity check.** Divide the two answers: $1.4379\times10^{-3}/3.716\times10^{-5} \approx 38.7$. That should equal $(42\,164.137/6778.137)^2 = 6.2206^2 = 38.70$, and it does. The reason: $J_2$'s own acceleration falls off as $r^{-4}$, while the main pull falls as $r^{-2}$, so their ratio falls as $r^{-2}$. This one scaling fact is why $J_2$ rules low-orbit design but is only one player among several at geostationary height.
:::

## Two ways to predict a nudged orbit

Suppose you want to know where a nudged spacecraft will be next month. There are two old and very different ways to answer, and both are in daily use.

### Special perturbations: step it forward

The first way is the brute-force one. Start from a known position $\mathbf{r}_0$ and velocity $\mathbf{v}_0$. Work out the total acceleration right now, from every force model you trust. Take a small step forward in time. Repeat, millions of times. This is **numerical integration**, using a method like Runge–Kutta, or the orbit-specific **Cowell** and **Encke** methods a later lesson builds.

This is called **[[special perturbations|special-name]]**. "Special" here is the old meaning, *particular*: the answer is one trajectory, for one starting state and one set of force models — a table of numbers, not a formula.

Its strengths: it handles any force you can write an acceleration for, to any accuracy your step size and computer arithmetic allow, and it does not care whether the orbit is nearly round or wildly stretched. Its costs: computing time (a year of a geostationary satellite's life is millions of force evaluations), and no insight. A column of numbers does not tell you *why* the orbit changed.

### General perturbations: find the formula

The second way is pencil and paper. Average each nudge over a whole orbit, or longer, and solve the simplified equations for how the orbit's shape and tilt drift over time. The answer is a **formula**. This is **general perturbations**.

Here is one you will derive in lesson 4 — the rate at which $J_2$ swings an orbit's plane around:

$$
\dot{\Omega} = -\tfrac{3}{2}nJ_2(R_E/a)^2\cos i /(1-e^2)^2 .
$$

(Read $\dot\Omega$ as "omega-dot", the rate of change of the node angle $\Omega$; $n$ is the mean motion, $a$ the semi-major axis, $e$ the eccentricity, $i$ the inclination.) It is valid for any date and any nearby orbit. And it shows the *why* at once: the drift comes from oblateness, through the $J_2$ factor, and depends on tilt, through the $\cos i$ factor.

Its costs: a lot of algebra, and limited validity. The averaging step usually assumes the nudge is small and changes slowly. More precision means more terms, more algebra and narrower assumptions.

The world's catalog of satellites is predicted with a general-perturbations theory called **SGP4**, covered near the end of this module. It turns a short list of numbers into a position in microseconds, without integrating anything.

### Engineers use both

A mission designer sizing a propellant budget wants the general-perturbations formula, because it shows which knobs to turn: change the inclination, change the drift. A navigation filter predicting between two GPS fixes wants special perturbations, because it needs the true path with every small wiggle. Most real flight software uses both: a numerical propagator for the truth, checked against analytic rates that catch modeling bugs a pile of numbers would hide.

::: key General vs special perturbations
**Special perturbations**: numerically integrate the full perturbed equation of motion. You get a trajectory, valid for one initial condition, as accurate as the force model and integrator allow, and computationally expensive over long spans.

**General perturbations**: analytically average the perturbing forces over an orbit and solve for the secular (steady) and periodic drift of the elements. You get a formula, valid near a family of orbits, computationally cheap, but approximate by construction.
:::

## Sizing the nudges in low orbit and at geostationary height

The table below gives the size of every perturbing acceleration this module covers, at $400\,\mathrm{km}$ (a typical low Earth orbit, **LEO**) and at geostationary orbit (**GEO**, $r = 42\,164\,\mathrm{km}$). Each number comes from the formula a later lesson derives. The drag row assumes a ballistic coefficient of $100\,\mathrm{kg/m^2}$, and the sunlight row assumes $0.02\,\mathrm{m^2}$ of sunlit area per kilogram and a reflectivity factor of $1.3$. Treat the table as the map. The legend for each row is a lesson still ahead.

| Acceleration | LEO, $400\,\mathrm{km}$ ($\mathrm{m/s^2}$) | GEO ($\mathrm{m/s^2}$) |
| --- | --- | --- |
| Two-body ($\mu/r^2$) | $8.68$ | $0.224$ |
| $J_2$ | $1.25\times10^{-2}$ | $8.33\times10^{-6}$ |
| Higher zonals ($J_3$, $J_4$) | $\sim3$–$7\times10^{-5}$ | $\sim10^{-9}$–$10^{-8}$ |
| Atmospheric drag | $10^{-7}$ to $10^{-5}$ | negligible |
| Lunar third body | $1.20\times10^{-6}$ | $8.68\times10^{-6}$ |
| Solar third body | $5.37\times10^{-7}$ | $3.34\times10^{-6}$ |
| Solar radiation pressure | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ |

(The third-body numbers are the worst case, with the spacecraft on the line between Earth and the Moon or Sun.)

Two features of this table carry the whole module.

First, at $400\,\mathrm{km}$, $J_2$ beats every other nudge by two to five orders of magnitude. It is not "a small correction". It is the second most important force in the problem, and the next several lessons treat it that way.

Second, the ranking changes between the columns. Drag has vanished, because there is essentially no air at geostationary height. The Moon and Sun terms have *grown* six to seven times, even though nothing about the Moon or Sun changed. What changed is the spacecraft's own distance from Earth. Third-body pull grows with that distance while $J_2$ shrinks with it. By GEO, $J_2$ and the Moon are about equal.

That is why a geostationary satellite splits its propellant two ways. Most goes to **north–south station-keeping**, fighting the Moon and Sun, which tip the orbit's plane. A little goes to **east–west station-keeping**, fighting the lumps in Earth's gravity around the equator. A low-orbit mission instead spends its effort on $J_2$ and drag.

::: key Perturbation ranking at 400 km (LEO)
Two-body ≈ 8.7 m/s² · $J_2$ ≈ 1.2 × 10⁻² · higher geopotential harmonics ≈ 10⁻⁵ · drag ≈ 10⁻⁶ to 10⁻⁵ (solar-cycle dependent; a quiet Sun can drop it toward 10⁻⁷) · lunar third body ≈ 10⁻⁶ · solar third body ≈ 5 × 10⁻⁷ · SRP ≈ 10⁻⁷.

In words: $J_2 \gg$ higher harmonics $\gtrsim$ drag $\gtrsim$ lunisolar $\gtrsim$ SRP. $J_2$ falls off as $1/r^4$ against the two-body term's $1/r^2$.
:::

::: key Perturbation ranking at GEO
Two-body ≈ 0.22 m/s² · $J_2$ ≈ 10⁻⁵ · lunar third body ≈ 7 × 10⁻⁶ · solar third body ≈ 3 × 10⁻⁶ · SRP ≈ 10⁻⁷ to 10⁻⁶ · drag negligible.

$J_2 \approx$ lunisolar $\gg$ SRP. Lunisolar perturbation is what drives the expensive **[[north–south station-keeping|station-keeping]]**. Drag matters only in LEO and is gone above roughly $1000\,\mathrm{km}$.
:::

### Why the Moon matters more the farther out you go

This surprises almost everyone the first time. Why should the Moon's pull on a spacecraft matter *more* when the spacecraft is farther from Earth, but still nowhere near the Moon?

Because the Moon pulls on Earth too. What changes the spacecraft's orbit *around Earth* is only the **[[difference between the two pulls|differential-pull]]**: how much harder the Moon tugs on the spacecraft than on Earth. The farther the spacecraft is from Earth's center, the bigger that difference.

::: example Why third-body attraction grows with altitude
For a third body with gravitational parameter $\mu_3$ at distance $d$ from Earth, and a spacecraft at distance $r$ from Earth's center on the line toward it, the leading (tidal) approximation is

$$
a_{3\text{rd}} \approx \frac{2\mu_3 r}{d^3} .
$$

For the Moon, $\mu_{\text{Moon}} = 4902.800\,\mathrm{km^3/s^2}$ and $d = 384\,400\,\mathrm{km}$, so $d^3 = 5.680\times10^{16}\,\mathrm{km^3}$.

**LEO.** The top is $2 \times 4902.800 \times 6778.137 = 6.646\times10^{7}$. Divide by $d^3$:

$$
a_{3\text{rd}}(\text{LEO}) \approx \frac{2(4902.800)(6778.137)}{384\,400^3} = 1.170\times10^{-9}\,\mathrm{km/s^2} = 1.17\times10^{-6}\,\mathrm{m/s^2}.
$$

**GEO.** Only $r$ changes:

$$
a_{3\text{rd}}(\text{GEO}) \approx \frac{2(4902.800)(42\,164.137)}{384\,400^3} = 7.28\times10^{-9}\,\mathrm{km/s^2} = 7.28\times10^{-6}\,\mathrm{m/s^2}.
$$

**Check.** The ratio is $7.28/1.17 = 6.22$, exactly the ratio of the distances, $42\,164.137/6778.137 = 6.22$. The approximation is *linear* in $r$, so it grows in step with distance — the opposite way to $J_2$'s $r^{-4}$ fall. These tidal values are a little below the table's worst-case numbers ($1.20$ and $8.68\times10^{-6}$), which use the exact difference of the two pulls; the gap is largest at GEO, where $r/d$ is biggest.

Two nudges heading in opposite directions as $r$ grows are **[[bound to cross somewhere|crossing-curves]]**. That crossing is why the two columns of the table rank differently.
:::

::: warning "Small" compared with what?
A nudge of $10^{-5}\,\mathrm{m/s^2}$ sounds like nothing next to $8.68\,\mathrm{m/s^2}$ of gravity — about one part in a million. But a mission lives for years, not an instant. Apply $10^{-5}\,\mathrm{m/s^2}$ for one day, $86\,400\,\mathrm{s}$, and the velocity changes by $0.864\,\mathrm{m/s}$ — nearly $1\,\mathrm{m/s}$. Keep it up for a month and that becomes about $26\,\mathrm{m/s}$, as big as a whole orbit-raising burn. Small nudges are small *per second*. Added up over a mission, they are often the biggest design driver on the vehicle.
:::

## Drag: the row nobody can pin down

Look at the drag row again. For the *same* $400\,\mathrm{km}$ orbit it spans two orders of magnitude, $10^{-7}$ to $10^{-5}\,\mathrm{m/s^2}$. That is not sloppy bookkeeping.

The air at that height is the **[[thermosphere|thermosphere]]**, and its density swings with the Sun. Between a quiet Sun and an active one, density at a fixed height changes by more than ten times. A geomagnetic storm can multiply it several times more within hours.

::: example A first look at the drag spread
The drag acceleration has size $a_D = \tfrac{1}{2}\rho v_{\text{rel}}^2/B$. Here $\rho$ ("rho") is the air density, $v_{\text{rel}}$ the speed through the air, and $B = m/(C_DA)$ the ballistic coefficient — mass divided by drag coefficient times area. Take $B = 100\,\mathrm{kg/m^2}$ and the circular speed at $400\,\mathrm{km}$, $v = \sqrt{\mu/r} = 7669\,\mathrm{m/s}$, so $v^2 = 5.881\times10^{7}\,\mathrm{m^2/s^2}$.

**Quiet Sun**, $\rho_{400} = 1\times10^{-12}\,\mathrm{kg/m^3}$:

$$
a_D = \frac{0.5 \times (1\times10^{-12}) \times (5.881\times10^{7})}{100} = 2.9\times10^{-7}\,\mathrm{m/s^2}.
$$

**Active Sun**, $\rho_{400} = 4\times10^{-11}\,\mathrm{kg/m^3}$: forty times the density, so forty times the drag, $1.2\times10^{-5}\,\mathrm{m/s^2}$.

Both ends land inside the table's range. (Measuring speed against the rotating air instead of against the stars lowers both by about $12\%$ for an equatorial orbit; the drag lesson treats that properly.) No care in the rest of the force model removes this factor of forty. It has to be carried honestly into any lifetime prediction, which is the drag lesson's central point.
:::

## What the rest of this module builds

The module works through each row of the table deeply enough to derive it, not only to quote it:

- the geopotential and $J_2$, and how $J_2$ turns the orbit's node and perigee — with sun-synchronous and frozen orbits as design uses;
- atmospheric drag and the ballistic coefficient;
- third-body attraction, solar radiation pressure and eclipses;
- the small effects of tides and relativity.

Alongside the physics, it builds the tools to *compute* with a nudged orbit: the Gauss variational and Lagrange planetary equations that turn a force into the drift of each orbital element; mean versus osculating elements, which explains why an element computed from one snapshot is not the number to trend; the Cowell and Encke methods; and SGP4, the theory behind every public satellite ephemeris.

## Check yourself

::: check
One spacecraft is at $400\,\mathrm{km}$ and another at geostationary altitude. Without computing anything, which perturbation do you expect to matter most for each, and why?
:::

::: answer
At $400\,\mathrm{km}$, $J_2$ beats every other perturbation by two to five orders of magnitude. Its relative size, $\varepsilon_{J_2} = \tfrac32 J_2(R_E/r)^2$, is largest close to Earth and falls as $r^{-2}$.

At geostationary altitude, $J_2$ has fallen to about $3.7\times10^{-5}$ of the two-body pull. Meanwhile lunisolar third-body attraction, which *grows* with $r$, has caught up to about the same size. So the two compete and neither dominates.

Drag matters only at $400\,\mathrm{km}$. At geostationary altitude there is no meaningful atmosphere.
:::

::: check
Using only how each acceleration scales with $r$, explain why drag and $J_2$ are both large in low orbit, why $J_2$'s *relative* importance shrinks steadily with height, and why third-body attraction does not shrink at all.
:::

::: answer
**Drag** depends on air density, which falls *exponentially* with height, with a scale height of tens of kilometers. That is far faster than any power law, so drag is large right above the atmosphere and effectively zero a few hundred kilometers higher.

**$J_2$**'s own acceleration falls as $r^{-4}$, faster than the two-body $r^{-2}$, so its relative size $\varepsilon_{J_2} \propto r^{-2}$ shrinks steadily but never vanishes. It is still among the largest perturbations at geostationary altitude, but no longer overwhelming.

**Third-body attraction** is a tidal effect that *grows* linearly with the spacecraft's distance from Earth (for a fixed Moon or Sun distance). So unlike drag and $J_2$, it becomes more important with altitude, not less.
:::

::: check
A mission designer says: "This perturbation is only one part in a million of gravity, so I will ignore it in the lifetime budget." What is wrong with that reasoning?
:::

::: answer
A ratio to the gravity *at one instant* says nothing about the effect *added up over time*. A steady $10^{-5}\,\mathrm{m/s^2}$ — about one part in a million of low-orbit gravity — changes velocity by nearly $1\,\mathrm{m/s}$ per day and about $26\,\mathrm{m/s}$ per month. That is not negligible next to typical station-keeping or orbit-raising budgets. Whether a perturbation can be ignored depends on the mission's tolerance and time span, not on its instantaneous size next to the main force.
:::

::: check
Give one advantage and one disadvantage each of general perturbations and special perturbations.
:::

::: answer
**General perturbations** (analytic element rates). Advantage: speed and insight. A formula like $\dot\Omega$ shows directly which design choices control the drift, and costs almost nothing to evaluate. Disadvantage: it is approximate, built on averaging and small-perturbation assumptions that break down for large perturbations or very long spans.

**Special perturbations** (numerical integration of the full equation). Advantage: generality and accuracy. Any force model can be added, to any precision the step size allows, for any eccentricity. Disadvantage: computing cost, and the output is a trajectory, not a formula that explains *why*.
:::

::: check
A satellite on a very stretched orbit spends most of its time near a $40\,000\,\mathrm{km}$ apogee and a short time near a $500\,\mathrm{km}$ perigee. Which perturbations act almost entirely near perigee, which are stronger near apogee, and which are about the same all the way round?
:::

::: answer
**Near perigee only: drag.** The atmosphere exists only within a few hundred kilometers of the surface, so at $40\,000\,\mathrm{km}$ there is none.

**Mostly near perigee: $J_2$ and the higher zonals.** They fall off as $r^{-4}$ and faster. At perigee ($r \approx 6878\,\mathrm{km}$) versus apogee ($r \approx 40\,000\,\mathrm{km}$), $J_2$'s acceleration is about $(40\,000/6878)^4 \approx 1100$ times stronger. $J_3$ and $J_4$ are even more concentrated.

**Stronger near apogee: third-body attraction**, which grows with $r$ — nearly six times stronger at apogee than at perigee.

**About the same everywhere: solar radiation pressure**, which depends on distance from the Sun, not from Earth — except that it switches off whenever the satellite is in Earth's shadow.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_p$ | Perturbed equation of motion; $\mathbf{a}_p$ is the sum of all perturbing accelerations |
| $\varepsilon = \lVert\mathbf{a}_p\rVert r^2/\mu$ | Dimensionless size of a perturbation next to the main pull |
| $\varepsilon_{J_2} = \tfrac32 J_2(R_E/r)^2$ | $J_2$'s relative size; falls as $r^{-2}$ |
| General perturbations | Analytic element-rate theory (for example SGP4): fast, approximate, explanatory |
| Special perturbations | Numerical integration of the full equation (for example Cowell, Encke): slow, general, as exact as the models |
| At $400\,\mathrm{km}$ | $J_2 \gg$ higher harmonics $\gtrsim$ drag $\gtrsim$ lunisolar $\gtrsim$ SRP |
| At GEO | $J_2 \approx$ lunisolar $\gg$ SRP; drag negligible |
| $a_{3\text{rd}} \propto r$, $a_{J_2} \propto r^{-4}$ | Opposite scalings, so the ranking changes with altitude |

Next lesson: where $\varepsilon_{J_2}$ comes from. You will write Earth's gravity as a sum of simple shapes called spherical harmonics, and derive the $J_2$ oblateness term that outweighs every other one.

::: context word-perturbation Where the word comes from
"Perturb" comes from the Latin *perturbare*, "to throw into disorder". Astronomers borrowed it centuries ago for the small tugs the planets give one another, which make each planet's path wander slightly from a perfect ellipse around the Sun.

The spacecraft version is the same idea. The ideal ellipse is the undisturbed path, and a perturbation is anything that pulls the real path away from it. The word does not mean the effect is small in its *results* — only that it is small next to the main force.
:::

::: context gps-timing Why nanoseconds turn into meters
A GPS receiver finds its distance to each satellite by timing how long the radio signal took to arrive. Radio travels at the speed of light, about $3\times10^8\,\mathrm{m/s}$, which is about $30\,\mathrm{cm}$ every nanosecond.

So a timing error of $10\,\mathrm{ns}$ is a distance error of $3\,\mathrm{m}$. The same logic works in reverse: if the ground system's prediction of where a GPS satellite *is* drifts by a few meters, every user's answer inherits that error. That is why GPS orbit prediction has to include nudges far smaller than $J_2$.
:::

::: context orders-of-magnitude Counting powers of ten
An **order of magnitude** is a factor of ten. Two numbers are "three orders of magnitude apart" when one is about a thousand times the other. This is the natural way to compare perturbations, because they span more than eight powers of ten. On an ordinary ruler the small ones would be invisible; on a scale where each step is ×10, they line up neatly. Here is the low-orbit column of this lesson's table, drawn that way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="104" y="24">two-body</text>
    <text x="104" y="46">J2</text>
    <text x="104" y="68">higher zonals</text>
    <text x="104" y="90">drag (range)</text>
    <text x="104" y="112">Moon</text>
    <text x="104" y="134">Sun</text>
    <text x="104" y="156">sunlight push</text>
  </g>
  <g fill="#1d6fd1">
    <rect x="110" y="14" width="228.4" height="13"/>
    <rect x="110" y="36" width="155.8" height="13"/>
    <rect x="110" y="58" width="94.5" height="13"/>
    <rect x="110" y="102" width="53.1" height="13"/>
    <rect x="110" y="124" width="44.2" height="13"/>
    <rect x="110" y="146" width="27.5" height="13"/>
  </g>
  <rect x="110" y="80" width="25.6" height="13" fill="#8fb8f0"/>
  <rect x="135.6" y="80" width="51.1" height="13" fill="#f2b880"/>
  <line x1="110" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="110" y1="170" x2="110" y2="175"/><line x1="161.1" y1="170" x2="161.1" y2="175"/>
    <line x1="212.2" y1="170" x2="212.2" y2="175"/><line x1="263.3" y1="170" x2="263.3" y2="175"/>
    <line x1="314.4" y1="170" x2="314.4" y2="175"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="188">10⁻⁸</text><text x="161.1" y="188">10⁻⁶</text><text x="212.2" y="188">10⁻⁴</text>
    <text x="263.3" y="188">10⁻²</text><text x="314.4" y="188">1</text>
  </g>
  <text x="225" y="207" font-size="11" fill="#6c7a93" text-anchor="middle">acceleration at 400 km, m/s², each tick ×100</text>
</svg>
```

The orange part of the drag bar is the stretch that depends on the Sun's mood.
:::

::: context special-name The first big special-perturbations job
Before computers, "step it forward" meant pages of hand arithmetic. Shortly before the comet's 1910 return, the British astronomers Philip Cowell and Andrew Crommelin did exactly that to predict the return of Halley's Comet, stepping its path forward under the pulls of the planets. Their predicted date of closest approach to the Sun was off by only about three days.

The method you will build later in this module still carries Cowell's name. Today a laptop does in a second what took them years.
:::

::: context station-keeping Station-keeping at geostationary height
A geostationary satellite has to stay inside a small box in the sky, often about $0.1^\circ$ on a side, so that dishes on the ground can stay pointed at it without moving.

The Moon and Sun keep tipping its orbit's plane, by roughly $0.75^\circ$ to $0.95^\circ$ a year depending on the year. Left alone, the satellite would trace a growing figure-eight north and south of the equator. Undoing that costs about $40$ to $50\,\mathrm{m/s}$ of velocity change every year. Holding its east–west position against the lumps in Earth's gravity costs only a few meters per second a year. That is why lunisolar perturbation, not $J_2$, sets a geostationary satellite's propellant budget.
:::

::: context differential-pull Only the difference counts
Earth and the spacecraft both fall toward the Moon. If they fell by exactly the same amount, the spacecraft's orbit around Earth would not notice at all. What changes the orbit is the *difference*: the spacecraft, being a little closer to the Moon, is pulled a little harder than Earth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="70" r="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="115" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
  <circle cx="160" cy="70" r="5" fill="#1f2a44"/>
  <text x="160" y="115" font-size="12" fill="#1f2a44" text-anchor="middle">spacecraft</text>
  <circle cx="320" cy="70" r="14" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="320" y="115" font-size="12" fill="#1f2a44" text-anchor="middle">Moon</text>
  <line x1="60" y1="36" x2="102" y2="36" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="110,36 100,31 100,41" fill="#1d6fd1"/>
  <line x1="160" y1="36" x2="215" y2="36" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="223,36 213,31 213,41" fill="#1d6fd1"/>
  <line x1="210" y1="52" x2="215" y2="52" stroke="#b4232c" stroke-width="3"/>
  <polygon points="223,52 213,47 213,57" fill="#b4232c"/>
  <text x="60" y="24" font-size="11" fill="#1f2a44">pull on Earth</text>
  <text x="160" y="24" font-size="11" fill="#1f2a44">pull on spacecraft</text>
  <text x="230" y="56" font-size="11" fill="#b4232c">difference</text>
  <text x="180" y="140" font-size="11" fill="#6c7a93" text-anchor="middle">not to scale; arrows drawn in the ratio 1 : 1.26 found at GEO</text>
</svg>
```

Move the spacecraft farther from Earth, toward the Moon, and the gap between the two arrows grows. That is the whole reason third-body effects climb with altitude.
:::

::: context crossing-curves Where the two curves cross
Plot $J_2$'s acceleration and the Moon's worst-case tidal acceleration against distance from Earth's center, on a scale where each step is ×10. $J_2$ plunges steeply, as $r^{-4}$. The Moon's term climbs slowly. They cross at about $35\,500\,\mathrm{km}$ altitude — almost exactly geostationary height, which is why the two are neck and neck in the table's GEO column.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="12" x2="60" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="24">10⁻²</text><text x="55" y="57">10⁻³</text><text x="55" y="90">10⁻⁴</text>
    <text x="55" y="124">10⁻⁵</text><text x="55" y="157">10⁻⁶</text>
  </g>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="60" y1="20" x2="340" y2="20"/><line x1="60" y1="53.3" x2="340" y2="53.3"/>
    <line x1="60" y1="86.7" x2="340" y2="86.7"/><line x1="60" y1="120" x2="340" y2="120"/>
    <line x1="60" y1="153.3" x2="340" y2="153.3"/>
  </g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="60.0,16.8 85.5,28.3 110.9,39.8 136.4,51.2 161.8,62.7 187.3,74.2 212.7,85.7 238.2,97.2 263.6,108.6 289.1,120.1 314.5,131.6 340.0,143.1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="60.0,150.7 85.5,147.7 110.9,144.7 136.4,141.7 161.8,138.7 187.3,135.6 212.7,132.5 238.2,129.4 263.6,126.1 289.1,122.8 314.5,119.4 340.0,115.8"/>
  <line x1="294.7" y1="100" x2="294.7" y2="170" stroke="#1f2a44" stroke-width="1" stroke-dasharray="2 2"/>
  <text x="294.7" y="96" font-size="11" fill="#1f2a44" text-anchor="middle">GEO</text>
  <text x="120" y="32" font-size="12" fill="#1d6fd1">J2</text>
  <text x="110" y="137" font-size="12" fill="#b4232c">Moon</text>
  <text x="62" y="185" font-size="11" fill="#1f2a44">6 778 km</text>
  <text x="340" y="185" font-size="11" fill="#1f2a44" text-anchor="end">60 000 km</text>
  <text x="200" y="197" font-size="11" fill="#6c7a93" text-anchor="middle">distance from Earth's center (log scale); m/s²</text>
</svg>
```
:::

::: context thermosphere The air that breathes with the Sun
The **thermosphere** is the thin top layer of the atmosphere, from about $90\,\mathrm{km}$ up to several hundred kilometers. Ultraviolet light from the Sun heats it. When the Sun is active, the gas warms and swells upward, so a satellite at a fixed height suddenly sits in thicker air.

The Sun's activity rises and falls over a cycle of about eleven years, and bursts from the Sun can trigger geomagnetic storms that heat the thermosphere within hours. In February 2022 a storm raised the drag on a batch of freshly launched Starlink satellites in a very low orbit so much that about 40 of the 49 fell back and burned up before they could climb away.
:::
