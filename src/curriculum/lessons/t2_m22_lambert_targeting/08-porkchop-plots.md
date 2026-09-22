---
id: l08-porkchop-plots
title: Porkchop plots from repeated Lambert solutions
minutes: 20
covers:
  - porkchop plots from repeated Lambert solutions
---

Every Lambert solve up to this point has answered one question: for this one departure position, this one arrival position, and this one time of flight, what is the transfer? Choosing an interplanetary launch window asks a different question — across every plausible departure date and every plausible arrival date, which combination costs the least? The porkchop plot answers it by brute force, solving Lambert once per grid point over a two-dimensional grid of dates and contouring the results, and it is the single most-used chart in interplanetary mission design, named for the shape its closed contours draw.

This lesson builds one from scratch — real planetary motion (simplified honestly, and said plainly where the simplification is), a heliocentric Lambert solve at every grid point, and the departure and arrival energy quantities the mission actually cares about. It closes by locating, on the grid itself, the exact geometry the $180°$-singularity lesson earlier in this module already flagged as trouble: the minimum-energy transfer sits right on the $180°$ ridge, and the grid shows why that matters in practice, not only in the abstract.

## Setting up the grid: what $C_3$ and $v_\infty$ mean here

At departure, the spacecraft leaves Earth's neighbourhood with some velocity $\mathbf{v}_1$ relative to the Sun, computed by a Lambert solve using $\mu_\odot = 1.32712\times10^{11}\,\mathrm{km^3/s^2}$ in place of Earth's $\mu$. What actually costs propellant is not $\mathbf{v}_1$ itself but the *hyperbolic excess* velocity relative to Earth, $\mathbf{v}_\infty = \mathbf{v}_1 - \mathbf{v}_{\text{Earth}}$, since Earth is already moving at very nearly $\mathbf{v}_1$'s scale and the launch vehicle only has to supply the difference (plus whatever it costs to climb out of Earth's own gravity well, a separate, launch-vehicle-specific number this lesson does not need). The departure energy is reported as

$$
C_3 = \lVert\mathbf{v}_\infty\rVert^2 ,
$$

characteristic energy, in $\mathrm{km^2/s^2}$ — squared rather than the speed itself because $C_3$ is what a launch vehicle's performance curve is actually plotted against. At arrival, the analogous quantity is the excess speed itself, $v_\infty = \lVert\mathbf{v}_2-\mathbf{v}_{\text{Mars}}\rVert$, which sets the flyby or capture cost at the destination — and is exactly the $v_\infty$ the previous lesson's B-plane targeting takes as given.

::: warning This lesson's ephemerides are a simplification, stated plainly
Real planetary orbits are eccentric and mutually inclined, and a real porkchop plot uses precise ephemerides (JPL SPICE kernels, or at minimum the Meeus/Standish series this module's exercises point to). Neither is available in this environment, so this lesson uses circular, coplanar orbits for Earth and Mars — a legitimate first approximation for the grid's qualitative shape and rough timing, verified below against well-known reference numbers, but not a substitute for a real mission's ephemeris-driven analysis. Every number quoted from this simplified model is exactly that: a number from a simplified model, not a claim about any real launch opportunity.
:::

::: example Checking the simplified ephemeris against known numbers
With $a_\oplus=1\,\mathrm{AU}$ and $a_{\text{Mars}}=1.523679\,\mathrm{AU}$ ($1\,\mathrm{AU}=1.495979\times10^8\,\mathrm{km}$), Kepler's third law gives orbital periods $T_\oplus = 365.257\,\mathrm{d}$ and $T_{\text{Mars}}=686.971\,\mathrm{d}$ — matching the well-known values for Earth and Mars to four significant figures, a sanity check that the constants are entered correctly before anything else is trusted. The Hohmann transfer time between the two circular orbits, $T_{\text{Hohmann}} = \pi\sqrt{a_t^3/\mu_\odot}$ with $a_t=(a_\oplus+a_{\text{Mars}})/2$, comes out to $258.87\,\mathrm{d}$, and the phase angle Mars must lead Earth by at launch for a Hohmann transfer to meet it exactly, back-solved from Mars's own mean motion, is $44.34°$ — both standard textbook figures for the Earth–Mars case, confirming the simplified model reproduces the well-known Hohmann geometry before it is used to grid anything more elaborate.
:::

## The grid

Fix Mars at that $44.34°$ lead angle at the reference epoch, and sweep departure date and time of flight:

| Departure | $150\,\mathrm{d}$ | $180\,\mathrm{d}$ | $210\,\mathrm{d}$ | $240\,\mathrm{d}$ | $270\,\mathrm{d}$ | $300\,\mathrm{d}$ | $330\,\mathrm{d}$ | $360\,\mathrm{d}$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $-40\,\mathrm{d}$ | 59.3 (141°) | 33.0 (157°) | 21.8 (173°) | 17.3 (189°) | 16.4 (204°) | 18.0 (220°) | 22.1 (236°) | 29.8 (252°) |
| $-20\,\mathrm{d}$ | 34.4 (132°) | 19.0 (148°) | 13.1 (164°) | 11.0 (179°) | 10.9 (195°) | 12.2 (211°) | 15.3 (227°) | 20.9 (242°) |
| $0\,\mathrm{d}$ | 19.5 (123°) | 12.2 (139°) | 9.6 (154°) | 8.8 (170°) | 8.7 (186°) | 9.4 (202°) | 11.1 (217°) | 14.8 (233°) |
| $20\,\mathrm{d}$ | 17.2 (114°) | 14.2 (129°) | 12.8 (145°) | 11.7 (161°) | 10.6 (177°) | 9.9 (192°) | 10.0 (208°) | 11.6 (224°) |
| $40\,\mathrm{d}$ | 29.9 (105°) | 26.9 (120°) | 24.0 (136°) | 20.8 (152°) | 17.5 (167°) | 14.5 (183°) | 12.3 (199°) | 11.5 (215°) |
| $60\,\mathrm{d}$ | 60.0 (95°) | 52.3 (111°) | 44.7 (127°) | 37.2 (142°) | 30.1 (158°) | 23.7 (174°) | 18.4 (190°) | 14.8 (205°) |

Each cell is $C_3$ in $\mathrm{km^2/s^2}$, with the heliocentric transfer angle $\Delta\nu$ in parentheses (rows: days from the reference departure epoch; columns: time of flight in days). Reading down any column, $C_3$ first falls, bottoms out, and rises again as departure date moves through the row that keeps $\Delta\nu$ closest to whatever value minimises cost for that flight duration; reading across a row, the same shape appears as flight time varies. The closed, roughly oval contours this produces when actually plotted are what give the chart its name.

## Type I, Type II, and the ridge between them

The parenthetical angles show the two lobes directly. For flight times up to about $240$–$250$ days at zero departure offset, $\Delta\nu$ stays below $180°$ — a **Type I** transfer, the direct, short-way arc. Past about $260$–$270$ days, $\Delta\nu$ has crossed $180°$ into the long way around — a **Type II** transfer. The boundary between them, where $\Delta\nu$ passes through exactly $180°$, is the same singular geometry the earlier lesson swept through in detail, and this grid shows precisely where it falls: for zero departure offset, that boundary sits between the $240$-day and $270$-day columns, right where the $258.87$-day Hohmann transfer time computed above lands.

::: example The Hohmann point *is* the singularity, and the grid shows what that costs
Evaluate the transfer at departure offset $0$ and flight time exactly $258.8657589178094\,\mathrm{d}$ — the Hohmann time computed above, to the day the analytic formula gives it. The heliocentric transfer angle comes out to $\Delta\nu = 180.000000°$ exactly, and the departure $C_3$ the solver returns is $4892.7\,\mathrm{km^2/s^2}$ — wildly, unphysically large, the near-$180°$ ill-conditioning from earlier in this module caught in the act, evaluated at the one point where it is not merely bad but exactly singular.

Move the departure date by a single millidegree of orbital motion — $0.001$ days, about $86\,\mathrm{s}$ — and the transfer angle shifts to $179.9995°$, comfortably off the exact singularity, and $C_3$ collapses back to $8.671\,\mathrm{km^2/s^2}$: consistent with every neighbouring grid point, and stable to the fourth significant figure for departure or arrival-date shifts of a day or more in either direction (for instance $\Delta t=259\,\mathrm{d}$ at zero departure offset gives $C_3=8.671\,\mathrm{km^2/s^2}$, $v_\infty=2.649\,\mathrm{km/s}$ at arrival, $\Delta\nu=180.07°$, essentially the grid's minimum). The theoretical minimum-energy Hohmann point and the numerically singular Lambert geometry are, for a coplanar transfer, the same point — which is exactly why a real minimum-$C_3$ contour is read from the smooth region approaching the ridge rather than computed by naively minimising straight through it, and exactly why the $180°$-singularity lesson's warning is not a footnote: an optimiser with no awareness of the conditioning, turned loose on this same grid, will walk toward the ridge and can report an arbitrarily small, numerically meaningless $C_3$ near the exact crossing, rather than the genuine, stable minimum a few tenths of a day away from it.
:::

## Reading the map

A mission designer reading a real porkchop plot is doing three things at once: finding the minimum-$C_3$ region (bounded by the launch vehicle's performance, since every vehicle has a maximum $C_3$ it can deliver a given mass to), finding the minimum-$v_\infty$ region at arrival (bounded by what the arrival propulsion or aerocapture system can absorb), and checking that both minima are reachable on the same date pair, or trading one against the other when they are not exactly co-located — which they generally are not, since $C_3$ and arrival $v_\infty$ are different functions over the same grid and their minima need not coincide. The grid above, simplified as it is, already shows the qualitative version of that trade: the very lowest $C_3$ column sits close to, but not exactly on, the Hohmann ridge, and a mission willing to accept a slightly higher $C_3$ has a wide plateau of departure dates to choose from instead of one knife-edge optimum — exactly the kind of margin a real launch window needs, since no real launch happens on the single day a grid computation calls optimal.

::: warning A porkchop grid this coarse is for orientation, not for a final answer
The $30$-day departure and time-of-flight spacing used above is coarse enough to miss the true minimum by a day or more and to step past the exact ridge without ever landing on it (which is a mild blessing here, given the previous example, but is not a design choice — it is luck of the grid spacing). A real mission-design porkchop plot uses a grid fine enough — typically a day or finer in both dimensions — to resolve the minimum properly, refines around it with a local optimiser that is aware of the ridge, and always double-checks any point that neighbours a sharp change in $C_3$ or $\Delta\nu$ against the ill-conditioning lesson's warnings before trusting it.
:::

## Check yourself

::: check
Why is departure cost reported as $C_3$ (squared speed) rather than $v_\infty$ (speed) directly, while arrival cost is usually reported as $v_\infty$ itself?
:::

::: answer
Launch vehicle performance is conventionally characterised by how much mass it can deliver to a given $C_3$, since $C_3$ is proportional to the extra kinetic energy the vehicle's upper stage must supply beyond Earth escape — it is the natural currency for a launch provider's performance curve. Arrival conditions, by contrast, are usually more directly tied to a speed (for a flyby's geometry, an orbit-insertion burn's size, or an aerocapture corridor), so $v_\infty$ itself, not its square, is the more directly useful number there.
:::

::: check
In the grid, why does $C_3$ generally decrease and then increase again as time of flight increases, for a fixed departure date, rather than monotonically decreasing?
:::

::: answer
A very short flight time forces a fast, high-energy transfer (large $C_3$) regardless of geometry, the same effect the branches lesson demonstrated directly. A very long flight time, on the other hand, eventually forces the transfer angle far from whatever value is locally cheapest for that duration (pushing well past $180°$ into an increasingly indirect Type II geometry, or short of the minimum-energy point on the Type I side), which again raises the required energy. Between those two extremes there is a flight time — near the Hohmann time, for a coplanar case — where the transfer is close to the minimum-energy ellipse from the earlier lesson, and $C_3$ is near its lowest.
:::

::: check
The worked example shows $C_3$ blowing up to $4892.7\,\mathrm{km^2/s^2}$ exactly at the Hohmann point, then dropping to $8.671\,\mathrm{km^2/s^2}$ after a shift of only $86\,\mathrm{s}$ in departure time. Does this mean the true minimum-energy transfer is actually extremely expensive?
:::

::: answer
No — the $4892.7\,\mathrm{km^2/s^2}$ value is a numerical artefact of evaluating the solver exactly on the $180°$ singularity, not a physical property of the minimum-energy transfer itself, whose true cost is well approximated by the smooth, stable value a short distance off the ridge ($8.671\,\mathrm{km^2/s^2}$ here). This is precisely the distinction the $180°$-singularity lesson drew between a problem being singular (undefined) versus merely ill-conditioned (defined, but sensitive) — landing an evaluation exactly on the singular point rather than arbitrarily close to it is what produced the blown-up number.
:::

::: check
Explain why a mission-design team would deliberately choose a departure date slightly off the minimum-$C_3$ point shown on a porkchop plot, rather than the exact minimum.
:::

::: answer
The exact minimum can sit arbitrarily close to (or, as in the coplanar Hohmann case, exactly on) the $180°$ ridge, where the transfer is highly sensitive to small timing and ephemeris errors and where a solver can behave numerically badly. Real launch dates also cannot be chosen to infinite precision — schedules slip, launch windows have their own operational constraints — so a team picks a point with margin inside a smooth, well-behaved region of the plot, accepting a slightly higher $C_3$ in exchange for a launch date that is not balanced on a numerical knife-edge.
:::

::: check
Two different Lambert solutions on the same porkchop grid have $\Delta\nu = 170°$ and $\Delta\nu=190°$ respectively, for departure and arrival dates that are otherwise close together. Which lobe is each in, and what geometric feature separates them?
:::

::: answer
$\Delta\nu=170°$ is a Type I transfer (below $180°$, the direct short-way lobe); $\Delta\nu=190°$ is a Type II transfer (above $180°$, the long-way lobe). They are separated by the $180°$ ridge — the locus of departure/arrival date pairs for which the heliocentric transfer angle passes through exactly $180°$, where the orbital plane becomes ill-defined and the two lobes of the porkchop plot meet.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $C_3 = \lVert\mathbf{v}_\infty\rVert^2$ | Departure characteristic energy; $\mathbf{v}_\infty=\mathbf{v}_1-\mathbf{v}_{\text{planet}}$ |
| $v_\infty$ (arrival) | Excess speed relative to the target at arrival |
| Grid | One Lambert solve per (departure date, time of flight) pair; contoured for the "porkchop" shape |
| $T_{\text{Hohmann}} = \pi\sqrt{a_t^3/\mu_\odot}$ | Minimum-energy coplanar transfer time; $258.87\,\mathrm{d}$ Earth–Mars in this model |
| Type I / Type II | $\Delta\nu<180°$ / $\Delta\nu>180°$; the two lobes of the plot |
| The $180°$ ridge | Separates the lobes; for a coplanar Hohmann case, coincides with the true cost minimum |
| Coarse grids | Good for orientation; refine near any minimum before trusting it, and treat points near the ridge with the same care as the $180°$-singularity lesson |

The next lesson turns from choosing a launch date to protecting the trajectory once it is flying: trajectory correction manoeuvres, and the linear covariance analysis that tells a mission how big a dispersion they are actually correcting.
