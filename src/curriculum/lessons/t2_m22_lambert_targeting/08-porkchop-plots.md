---
id: l08-porkchop-plots
title: Porkchop plots from repeated Lambert solutions
minutes: 20
covers:
  - porkchop plots from repeated Lambert solutions
---

Suppose you want to meet a friend in another city, and ticket prices depend on both the day you leave and the day you arrive. You could make a big table: leaving days down the side, arriving days across the top, a price in every box. Then you would look for the cheap corner of the table. You would also notice that the cheap boxes clump together into an island, with prices rising in every direction away from it.

Planning a trip to Mars works the same way. Every Lambert solve so far has answered one question: for this departure point, this arrival point and this time of flight, what is the transfer? Choosing a launch date asks a bigger question: across every sensible departure date and every sensible arrival date, which pair costs least? The **porkchop plot** answers it by brute force. Solve Lambert once for every box in a grid of dates, write down the cost, and draw contour lines — lines joining boxes of equal cost, like the height lines on a hiking map. The closed loops those lines make look like a pork chop, which is how the chart got its **[[name|porkchop-name]]**. It is the most-used chart in interplanetary mission design.

This lesson builds one from scratch for Earth to Mars. It uses a simplified solar system, stated honestly. And at the end it finds, on the grid itself, the $180°$ trouble spot from earlier in the module — and shows why it matters in practice.

## What each box costs: $C_3$ and $v_\infty$

A Lambert solve around the Sun uses the Sun's gravitational parameter, $\mu_\odot = 1.32712\times10^{11}\,\mathrm{km^3/s^2}$ ($\odot$ is the symbol for the Sun), in place of Earth's. It gives the spacecraft's velocity around the Sun at departure, $\mathbf{v}_1$, and at arrival, $\mathbf{v}_2$.

But Earth is already moving around the Sun at about $30\,\mathrm{km/s}$, and the spacecraft starts out riding along with it. The rocket only has to supply the *difference*. That difference is the **hyperbolic excess velocity** at departure,

$$
\mathbf{v}_\infty = \mathbf{v}_1 - \mathbf{v}_{\text{Earth}} ,
$$

the velocity the spacecraft must still have, relative to Earth, after it has climbed out of Earth's gravity. (The cost of the climb itself is a separate number that depends on the launch vehicle, and this lesson does not need it.)

Launch teams report the departure cost as the square of that speed, the **[[characteristic energy|c3-meaning]]**:

$$
C_3 = \lVert\mathbf{v}_\infty\rVert^2 ,
$$

in $\mathrm{km^2/s^2}$. It is squared because a launch vehicle's performance chart — how much mass it can send away — is plotted against $C_3$.

At arrival the matching number is the excess speed relative to Mars, $v_\infty = \lVert\mathbf{v}_2-\mathbf{v}_{\text{Mars}}\rVert$. It sets the cost of braking into orbit or the entry speed at the atmosphere. It is also exactly the $v_\infty$ that the B-plane targeting of the last lesson takes as given.

::: warning This lesson's planets are simplified, and it says so
Real planetary orbits are slightly oval and slightly tilted against each other. A real porkchop plot uses precise **[[ephemerides|ephemeris-word]]** — tables of where the planets are — such as JPL's SPICE files, or at least the Meeus/Standish formulas this module's exercise points to. This lesson instead puts Earth and Mars on circular orbits in the same flat plane. That is a fair first approximation for the grid's shape and rough timing, and it is checked below against well-known numbers. But every number from this model is a number from a model, not a claim about a real launch opportunity.
:::

::: example Checking the simple solar system against known numbers
Put Earth at $a_\oplus = 1\,\mathrm{AU}$ and Mars at $a_{\text{Mars}} = 1.523679\,\mathrm{AU}$, where one **astronomical unit** is $1\,\mathrm{AU} = 1.495979\times10^8\,\mathrm{km}$, about the Earth–Sun distance.

**Periods.** [[Kepler's third law|kepler-check]] gives the time for one orbit, $T = 2\pi\sqrt{a^3/\mu_\odot}$. That comes out to $T_\oplus = 365.257\,\mathrm{d}$ and $T_{\text{Mars}} = 686.971\,\mathrm{d}$. Both match the known values to four significant figures, so the constants are entered correctly.

**Hohmann time.** The minimum-energy Hohmann transfer is half an ellipse that touches both orbits. Its semi-major axis is the average of the two radii, $a_t = (a_\oplus + a_{\text{Mars}})/2$, and it takes half an orbit:

$$
T_{\text{Hohmann}} = \pi\sqrt{\frac{a_t^3}{\mu_\odot}} = 258.87\,\mathrm{d} .
$$

**Launch angle.** During those $258.87$ days Mars moves $360° \times 258.87/686.97 = 135.66°$ around the Sun. The spacecraft travels $180°$. For them to meet, Mars must start $180° - 135.66° = 44.34°$ ahead of Earth. This **[[phase angle|phase-picture]]** is the standard textbook figure for Earth to Mars.

Both numbers match the known Hohmann geometry, so the simple model is trustworthy enough to build a grid on.
:::

## The grid

Put Mars $44.34°$ ahead of Earth at a reference date. Then step the departure date (rows, in days from that reference) and the time of flight (columns, in days). Each box is one Lambert solve:

| Departure | $150\,\mathrm{d}$ | $180\,\mathrm{d}$ | $210\,\mathrm{d}$ | $240\,\mathrm{d}$ | $270\,\mathrm{d}$ | $300\,\mathrm{d}$ | $330\,\mathrm{d}$ | $360\,\mathrm{d}$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $-40\,\mathrm{d}$ | 59.3 (141°) | 33.0 (157°) | 21.8 (173°) | 17.3 (189°) | 16.4 (204°) | 18.0 (220°) | 22.1 (236°) | 29.8 (251°) |
| $-20\,\mathrm{d}$ | 34.4 (132°) | 19.0 (148°) | 13.1 (164°) | 11.0 (179°) | 10.9 (195°) | 12.2 (211°) | 15.3 (227°) | 20.9 (242°) |
| $0\,\mathrm{d}$ | 19.5 (123°) | 12.2 (139°) | 9.6 (154°) | 8.8 (170°) | 8.7 (186°) | 9.4 (202°) | 11.1 (217°) | 14.8 (233°) |
| $20\,\mathrm{d}$ | 17.2 (114°) | 14.2 (129°) | 12.8 (145°) | 11.7 (161°) | 10.6 (177°) | 9.9 (192°) | 10.0 (208°) | 11.6 (224°) |
| $40\,\mathrm{d}$ | 29.9 (104°) | 26.9 (120°) | 24.0 (136°) | 20.8 (152°) | 17.5 (167°) | 14.5 (183°) | 12.3 (199°) | 11.5 (215°) |
| $60\,\mathrm{d}$ | 60.0 (95°) | 52.3 (111°) | 44.7 (127°) | 37.2 (142°) | 30.1 (158°) | 23.7 (174°) | 18.4 (190°) | 14.8 (205°) |

The first number in each box is $C_3$ in $\mathrm{km^2/s^2}$. The number in brackets is the heliocentric **transfer angle** $\Delta\nu$ ("delta nu") — how far around the Sun the spacecraft travels.

Read down any column: $C_3$ falls, bottoms out, then rises again. Read across a row: the same valley shape. The cheapest box is near departure $0$ and $270\,\mathrm{d}$ of flight, at $8.7\,\mathrm{km^2/s^2}$, close to the Hohmann cost. Plotted as contour lines, this valley becomes a set of closed, roughly oval loops. That is the porkchop.

::: key The porkchop plot
A porkchop plot shows contours of departure $C_3$ and arrival $v_\infty$ (or total $\Delta v$) over a grid of departure and arrival dates, each point being one Lambert solution. The closed contours give the launch window its name and shape.
:::

The grid is also a gentle reminder of a hard constraint. Earth and Mars line up like this only once every **[[26 months or so|synodic-period]]**. Miss the valley and the next one is more than two years away.

## Type I, Type II, and the $180°$ line

Look at the angles in brackets. Along the departure-$0$ row, flights up to $240$ days have $\Delta\nu$ below $180°$. The spacecraft goes less than halfway around the Sun. That is a **Type I** transfer, the short way. From $270$ days on, $\Delta\nu$ is above $180°$, the long way around: a **Type II** transfer. The **[[two kinds of arc|type-arcs]]** sit side by side on the grid.

::: key Type I and Type II transfers
Type I sweeps a heliocentric transfer angle below $180°$, Type II above it. They appear as the two lobes of a porkchop plot, separated by the $180°$ ridge where the solution degenerates.
:::

Somewhere between the $240$-day and $270$-day columns, $\Delta\nu$ passes through exactly $180°$ — the singular geometry of the $180°$ lesson. And in this flat model it lands exactly where the Hohmann transfer is, at $258.87$ days. That is no accident: the Hohmann transfer *is* a $180°$ transfer, from one side of the Sun to the other.

::: example The Hohmann point is the singular point
Solve Lambert at departure $0$ with time of flight exactly $258.8657589178094\,\mathrm{d}$, the Hohmann time from the analytic formula.

**Transfer angle.** Mars arrives exactly opposite Earth's starting point, so $\Delta\nu = 180.000000°$.

**Departure cost.** The solver returns $C_3 = 4892.7\,\mathrm{km^2/s^2}$. That is absurd — more than five hundred times the neighboring boxes. The solver divides by $\sin\Delta\nu$, which is zero here up to rounding, so it is dividing by almost nothing and the answer is garbage. This is the $180°$ singularity caught in the act.

**Step off by $86$ seconds.** Move the departure by $0.001$ days. Earth moves about $0.001°$ in that time, so the transfer angle becomes $179.9995°$ — no longer exactly $180°$. Now $C_3 = 8.671\,\mathrm{km^2/s^2}$, in line with every neighboring box.

**Is that the true cost?** Check against the Hohmann formula. The Hohmann departure speed minus Earth's speed is $2.945\,\mathrm{km/s}$, and $2.945^2 = 8.67\,\mathrm{km^2/s^2}$. Yes. And it is stable: at $259$ days of flight, $C_3 = 8.671\,\mathrm{km^2/s^2}$, arrival $v_\infty = 2.649\,\mathrm{km/s}$, $\Delta\nu = 180.07°$.

So the minimum-energy point and the numerically singular point are the same point in this flat model. The real cost there is about $8.67\,\mathrm{km^2/s^2}$. An evaluation landing exactly on $180°$ returns nonsense, and an optimizer that does not know about the singularity can walk straight onto it.
:::

### In the real, tilted solar system the line becomes a ridge

In the flat model, both planets lie in one plane, so the plane of the transfer is never in doubt. The only trouble at $180°$ is numerical, and one step off it everything is fine. The grid shows no bump in cost at all.

Real Mars is not in Earth's plane. Its orbit is tilted by about $1.85°$, so Mars is usually a little above or below Earth's orbital plane. Near $180°$ that tiny offset takes over. Earth, the Sun and Mars are almost in a straight line, and the transfer plane must pass through all three. When they are almost lined up, the only plane that reaches a point slightly above the line is steeply tilted. Tilting a plane costs a lot of velocity. So in the real solar system there is a genuine, physical **[[ridge|tilted-ridge]]** of high cost along the $180°$ line, and it splits the valley into two separate lobes: Type I on one side, Type II on the other.

::: example Lifting Mars one degree out of the plane
Keep everything the same, but place Mars at arrival $1°$ above Earth's orbital plane. Departure $0$:

| Time of flight | $C_3$, flat ($\mathrm{km^2/s^2}$) | $C_3$, Mars $1°$ up ($\mathrm{km^2/s^2}$) | Tilt of transfer plane |
| --- | --- | --- | --- |
| $220\,\mathrm{d}$ | $9.25$ | $11.70$ | $2.9°$ |
| $250\,\mathrm{d}$ | $8.70$ | $52.45$ | $12.2°$ |
| $259\,\mathrm{d}$ | $8.67$ | $1822$ | $86.0°$ |
| $270\,\mathrm{d}$ | $8.72$ | $36.84$ | $9.7°$ |
| $300\,\mathrm{d}$ | $9.36$ | $11.57$ | $2.7°$ |

Far from $259$ days, lifting Mars costs only a few $\mathrm{km^2/s^2}$. Near $259$ days the transfer plane has to tip nearly on its side ($86°$) to reach a point only $1°$ above the line, and $C_3$ soars to about $1800\,\mathrm{km^2/s^2}$ — far beyond any launch vehicle.

This time the huge number is real, not a rounding error. It is the price of the plane change. That is why real porkchop plots have two lobes with a wall between them.
:::

## Reading the map

A mission designer reading a porkchop plot is doing several things at once.

- **Departure side.** Find the low-$C_3$ region. Every launch vehicle has a maximum $C_3$ at which it can still send the spacecraft's mass, and that sets an outer contour you must stay inside.
- **Arrival side.** Find the low arrival-$v_\infty$ region. The spacecraft's engine, heat shield or aerobraking plan can only absorb so much speed.
- **Both together.** Check that one date pair satisfies both. In the flat model the two minimums sit together near the Hohmann point (the lowest arrival $v_\infty$ on the grid is $2.68\,\mathrm{km/s}$, in the same box as the lowest $C_3$). In the real solar system they usually do not, and the team trades one against the other.
- **Margin.** Pick a region, not a point. No real launch happens on the one day a computer calls optimal. Weather, a technical hold or a schedule slip moves it. A good plan has a wide plateau of acceptable days — a **launch period** — and stays away from the $180°$ wall.

::: warning A grid this coarse is for orientation, not a final answer
The grid above steps $20$ days in departure and $30$ days in flight time. That is coarse enough to miss the true minimum by days, and to step right over the $180°$ line without landing on it — which was luck, not design. A real mission-design porkchop plot uses steps of a day or finer, refines the minimum with a local optimizer that knows where the $180°$ ridge is, and double-checks any point next to a sudden jump in $C_3$ or $\Delta\nu$ before trusting it.
:::

## Check yourself

::: check
Why is departure cost reported as $C_3$, a squared speed, while arrival cost is usually reported as $v_\infty$ itself?
:::

::: answer
A launch vehicle's performance is described by how much mass it can deliver to a given $C_3$. $C_3$ is twice the energy per kilogram the spacecraft has left after escaping Earth, and energy is what the upper stage has to supply. So $C_3$ is the natural unit for a launch provider's chart.

At arrival, the things that matter — the size of an orbit-insertion burn, the geometry of a flyby, the entry speed for an aerocapture — depend on a speed. So $v_\infty$ itself, not its square, is the more directly useful number there.
:::

::: check
For a fixed departure date, why does $C_3$ fall and then rise again as time of flight increases, instead of falling all the way?
:::

::: answer
A very short flight forces a fast, high-energy transfer, so $C_3$ is large. The branches lesson showed the same effect directly.

A very long flight is also expensive. With a fixed departure date, a longer flight means Mars has moved farther by arrival, so the transfer angle is pushed well past the cheap value, into an increasingly roundabout Type II path that needs more energy.

In between, near the Hohmann time in the flat model, the transfer is close to the minimum-energy ellipse, and $C_3$ is at its lowest.
:::

::: check
The worked example found $C_3 = 4892.7\,\mathrm{km^2/s^2}$ exactly at the Hohmann point and $8.671\,\mathrm{km^2/s^2}$ only $86$ seconds of departure time away. Does that mean the true minimum-energy transfer is extremely expensive?
:::

::: answer
No. The $4892.7$ is a numerical artifact of evaluating the solver exactly on the $180°$ singularity, where it divides by a number that is zero up to rounding. It is not a property of the transfer. The true cost of the minimum-energy transfer is the smooth, stable value a hair away, $8.671\,\mathrm{km^2/s^2}$, which matches the Hohmann formula.

This is the difference the $180°$ lesson drew between a problem that is singular (undefined at the point) and one that is ill-conditioned (defined, but sensitive). Landing exactly on the singular point, not merely close to it, is what produced the blown-up number. (In the flat model there is no physical penalty at $180°$; in the real, tilted solar system there is, as the second example showed.)
:::

::: check
Why would a mission team deliberately choose a departure date a little away from the minimum-$C_3$ point on a porkchop plot?
:::

::: answer
The exact minimum can sit right next to the $180°$ ridge (in the flat Hohmann case, exactly on it). There, the transfer is very sensitive to small timing and ephemeris errors, and a solver can behave badly.

Also, launch dates cannot be picked to the second. Schedules slip and launch windows have their own practical limits. So a team picks a point with margin, inside a smooth, well-behaved part of the plot, accepting a slightly higher $C_3$ in exchange for a launch date that is not balanced on a knife-edge.
:::

::: check
Two Lambert solutions on the same porkchop grid have $\Delta\nu = 170°$ and $\Delta\nu = 190°$, for date pairs that are otherwise close together. Which lobe is each in, and what separates them?
:::

::: answer
$\Delta\nu = 170°$ is below $180°$, so it is Type I, the short-way lobe. $\Delta\nu = 190°$ is above $180°$, so it is Type II, the long-way lobe.

They are separated by the $180°$ ridge: the line of date pairs where the transfer angle is exactly $180°$, the orbit plane is not fixed by the two positions, and (in the real, tilted solar system) the cost shoots up. That ridge is where the two lobes of the porkchop plot meet.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{v}_\infty = \mathbf{v}_1 - \mathbf{v}_{\text{planet}}$ | Excess velocity: Lambert velocity minus the planet's own velocity |
| $C_3 = \lVert\mathbf{v}_\infty\rVert^2$ | Departure characteristic energy, $\mathrm{km^2/s^2}$ |
| $v_\infty$ (arrival) | Excess speed relative to the target at arrival |
| Porkchop plot | Contours of departure $C_3$ and arrival $v_\infty$ over a grid of departure and arrival dates, one Lambert solve per point |
| $T_{\text{Hohmann}} = \pi\sqrt{a_t^3/\mu_\odot}$ | Minimum-energy flat transfer time; $258.87\,\mathrm{d}$ Earth–Mars; Mars leads by $44.34°$ at launch |
| Type I / Type II | $\Delta\nu < 180°$ / $\Delta\nu > 180°$; the two lobes of the plot |
| The $180°$ ridge | Separates the lobes; numerical trouble in a flat model, a real plane-change cost wall in the tilted solar system |
| Coarse grids | For orientation only; refine near the minimum and treat points near the ridge with care |

The next lesson turns from choosing a launch date to protecting the trajectory once it is flying: trajectory correction maneuvers, and the linear covariance analysis that predicts how big a correction the mission must be ready to make. Its example flies the $270$-day transfer from this grid.

::: context porkchop-name Why a pork chop?
Draw the contour lines for a Mars window and the closed loops of equal $C_3$ come out lopsided and rounded, fat at one end with a notch where the $180°$ ridge cuts in — rather like the outline of a pork chop on a plate. Mission designers have used the nickname for decades, and it is now the standard name, even in formal reports.
:::

::: context c3-meaning What C3 measures
The energy per kilogram of an orbit is $\varepsilon = v^2/2 - \mu/r$. Far from Earth the $\mu/r$ part fades to zero and only $v_\infty^2/2$ is left. So $C_3 = v_\infty^2 = 2\varepsilon$: twice the energy per kilogram. $C_3 > 0$ means the spacecraft escapes Earth for good. $C_3 = 0$ means it barely escapes, and $C_3 < 0$ means it stays in a closed orbit around Earth. Real Mars windows have needed roughly $8$ to $16\,\mathrm{km^2/s^2}$, depending on the year.
:::

::: context ephemeris-word Tables of where the planets are
An **ephemeris** (plural **ephemerides**) is a table giving where a planet or moon is at each moment. The word comes from Greek for "daily", because early ones listed positions day by day. Today JPL computes them by fitting decades of radar, spacecraft and telescope measurements, and publishes them as files that the free SPICE software reads. A porkchop plot built on them captures the real shapes and tilts of the orbits.
:::

::: context kepler-check Why check the periods first
Kepler's third law says the square of an orbit's period is proportional to the cube of its size. It is a quick test that $\mu_\odot$, the AU and the unit conversions are all right, because an error in any of them shows up as a year that is not $365$ days. Engineers call this kind of test a **sanity check**: compute something you already know before trusting the program with something you do not.
:::

::: context phase-picture Where Mars must be at launch
The Hohmann transfer (orange) leaves Earth and reaches Mars's orbit exactly halfway around the Sun. It takes $258.87$ days, and in that time Mars moves $135.66°$. So Mars must start $44.34°$ ahead of Earth. Drawn to scale, with the orbits as circles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="94.9" fill="none" stroke="#b4232c" stroke-width="1.2"/>
  <circle cx="180" cy="110" r="62.3" fill="none" stroke="#1d6fd1" stroke-width="1.2"/>
  <path d="M242.3,110 A78.61 76.90 0 0 0 85.1,110" fill="none" stroke="#f2b880" stroke-width="3"/>
  <circle cx="180" cy="110" r="7" fill="#f2b880" stroke="#1f2a44"/>
  <line x1="180" y1="110" x2="242.3" y2="110" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="180" y1="110" x2="247.9" y2="43.7" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <path d="M210,110 A30,30 0 0 0 201.5,89.0" fill="none" stroke="#1f2a44"/>
  <circle cx="242.3" cy="110" r="5" fill="#1d6fd1"/>
  <circle cx="247.9" cy="43.7" r="5" fill="#b4232c"/>
  <circle cx="85.1" cy="110" r="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="214" y="104" font-size="11" fill="#1f2a44">44.3°</text>
  <text x="250" y="124" font-size="11" fill="#1d6fd1">Earth at launch</text>
  <text x="254" y="40" font-size="11" fill="#b4232c">Mars at launch</text>
  <text x="12" y="132" font-size="11" fill="#b4232c">Mars at arrival</text>
  <text x="180" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">Sun</text>
</svg>
```
:::

::: context synodic-period Why Mars windows come every 26 months
Earth laps Mars like a faster runner on an inner track. The time between one lap and the next is the **synodic period**, $1/(1/T_\oplus - 1/T_{\text{Mars}})$. With the periods from the example that is $780$ days, about $26$ months. The $44°$ lead angle comes round once per lap, so every Mars mission — from Mariner 4 in 1964 to today's rovers — has launched in one of these windows.
:::

::: context type-arcs The short way and the long way
Two real transfers from this lesson's grid, both leaving Earth on the same day. The Type I arc ($210$ days, $\Delta\nu = 154°$) meets Mars before going halfway round the Sun. The Type II arc ($300$ days, $\Delta\nu = 202°$) goes past the far side first. Computed by propagating each Lambert solution.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="94.9" fill="none" stroke="#b4232c" stroke-width="1.2"/>
  <circle cx="180" cy="110" r="62.3" fill="none" stroke="#1d6fd1" stroke-width="1.2"/>
  <circle cx="180" cy="110" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <path d="M242.3,110.0 L241.9,101.5 L240.5,93.0 L238.1,84.9 L235.0,77.1 L231.0,69.8 L226.4,63.0 L221.1,56.8 L215.4,51.3 L209.2,46.5 L202.7,42.4 L196.0,38.9 L189.1,36.2 L182.1,34.1 L175.1,32.7 L168.2,31.9 L161.3,31.7 L154.6,32.1 L148.0,33.0 L141.7,34.4 L135.6,36.3 L129.7,38.6 L124.2,41.3 L118.9,44.4 L114.0,47.8 L109.3,51.5 L105.1,55.5 L101.1,59.8 L97.6,64.3 L94.4,69.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M242.3,110.0 L241.1,97.9 L237.9,86.1 L233.0,75.1 L226.5,65.1 L218.6,56.4 L209.8,49.1 L200.2,43.3 L190.1,39.0 L179.9,36.2 L169.6,34.8 L159.5,34.7 L149.7,35.8 L140.4,38.0 L131.6,41.2 L123.5,45.3 L116.0,50.1 L109.3,55.7 L103.3,61.8 L98.1,68.5 L93.7,75.5 L90.2,82.9 L87.4,90.5 L85.6,98.3 L84.5,106.2 L84.3,114.2 L84.9,122.1 L86.4,129.9 L88.6,137.5 L91.7,144.9" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 3"/>
  <circle cx="242.3" cy="110" r="4.5" fill="#1d6fd1"/>
  <circle cx="94.4" cy="69.0" r="4.5" fill="#1d6fd1"/>
  <circle cx="91.7" cy="144.9" r="4.5" fill="#b4232c"/>
  <line x1="170" y1="110" x2="330" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"/>
  <line x1="170" y1="110" x2="20" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"/>
  <text x="250" y="125" font-size="11" fill="#1f2a44">Earth, launch</text>
  <text x="10" y="58" font-size="11" fill="#1d6fd1">Type I, 154°</text>
  <text x="10" y="170" font-size="11" fill="#b4232c">Type II, 202°</text>
  <text x="220" y="205" font-size="11" fill="#6c7a93">dotted line: 0° and 180°</text>
</svg>
```
:::

::: context tilted-ridge The wall between the lobes
$C_3$ against time of flight on a logarithmic scale, departure day $0$. Blue: the flat model, a gentle valley with its floor right at $180°$. Red: the same with Mars $1°$ above Earth's plane at arrival. Near $259$ days the transfer plane must tip almost on its side and $C_3$ climbs past $1000\,\mathrm{km^2/s^2}$. That spike, repeated along every row of a real plot, is the ridge between the Type I and Type II lobes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="190" x2="345" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="190" x2="45" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3">
    <line x1="45" y1="171.6" x2="345" y2="171.6"/><line x1="45" y1="110.4" x2="345" y2="110.4"/><line x1="45" y1="49.2" x2="345" y2="49.2"/>
  </g>
  <line x1="221.6" y1="190" x2="221.6" y2="15" stroke="#1f2a44" stroke-width="0.8" stroke-dasharray="4 3"/>
  <path d="M45.0,171.0 L60.0,171.8 L75.0,172.5 L90.0,173.1 L105.0,173.7 L120.0,174.1 L135.0,174.5 L150.0,174.7 L165.0,175.0 L180.0,175.2 L195.0,175.3 L210.0,175.4 L225.0,175.4 L240.0,175.3 L255.0,175.2 L270.0,175.1 L285.0,174.9 L300.0,174.6 L315.0,174.2 L330.0,173.8 L345.0,173.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M45.0,168.2 L60.0,168.5 L75.0,168.5 L90.0,168.1 L105.0,167.4 L120.0,166.1 L135.0,163.9 L150.0,160.5 L165.0,154.8 L180.0,145.1 L195.0,127.5 L198.0,122.3 L201.0,116.3 L204.0,109.2 L207.0,100.8 L210.0,90.7 L213.0,78.2 L216.0,63.0 L219.0,45.4 L220.5,36.9 L222.0,33.3 L223.5,41.3 L225.0,50.2 L228.0,67.3 L231.0,81.8 L234.0,93.6 L237.0,103.2 L240.0,111.3 L243.0,118.0 L246.0,123.8 L255.0,136.9 L270.0,150.2 L285.0,157.7 L300.0,162.2 L315.0,165.0 L330.0,166.7 L345.0,167.7" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="41" y="175">10</text><text x="41" y="114">100</text><text x="41" y="53">1000</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="204">200</text><text x="120" y="204">225</text><text x="195" y="204">250</text><text x="270" y="204">275</text><text x="345" y="204">300 d</text>
  </g>
  <text x="228" y="28" font-size="11" fill="#1f2a44">Hohmann, 180°</text>
  <text x="252" y="128" font-size="11" fill="#b4232c">Mars 1° up</text>
  <text x="252" y="186" font-size="11" fill="#1d6fd1">flat model</text>
  <text x="50" y="26" font-size="11" fill="#1f2a44">C3 (km²/s²)</text>
</svg>
```
:::
