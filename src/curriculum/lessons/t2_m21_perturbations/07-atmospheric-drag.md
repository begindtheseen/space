---
id: l07-atmospheric-drag
title: Atmospheric drag, ballistic coefficient, and density uncertainty
minutes: 17
covers:
  - "atmospheric drag, ballistic coefficient and density model uncertainty"
---

$J_2$ wobbles a low orbit's shape every revolution but, averaged over a period, leaves its size and eccentricity untouched — the previous lesson made that precise. Atmospheric drag is the opposite kind of perturbation: it never averages away. It removes energy from the orbit every single revolution, with the same sign every time, and the cumulative effect over weeks to years is the reason most low Earth orbits are not permanent. An uncontrolled $400\,\mathrm{km}$ satellite deorbits within a few years; the International Space Station needs periodic reboosts to stay where it is; a mission planner sizing propellant for station-keeping, or a safety analyst predicting when a dead satellite will re-enter, is doing an atmospheric-drag calculation whether they call it that or not.

This lesson derives the drag acceleration and the ballistic coefficient that controls it, derives the secular decay rate for a near-circular orbit from first principles, explains why drag makes a satellite speed up even as it loses energy, and confirms numerically that drag preferentially circularises an eccentric orbit. It closes on the theme the task set for this whole module: the honest, large uncertainty in the atmospheric density that every one of these numbers depends on.

## The drag acceleration and the ballistic coefficient

A spacecraft moving through a rarefied atmosphere experiences a drag force opposing its velocity *relative to the air*, with magnitude proportional to dynamic pressure and frontal area:

$$
\mathbf{a}_D = -\frac{1}{2}\,\rho\,v_{\text{rel}}\,\frac{C_DA}{m}\,\mathbf{v}_{\text{rel}} = -\frac{1}{2}\frac{\rho\,v_{\text{rel}}}{B}\,\mathbf{v}_{\text{rel}}, \qquad B \equiv \frac{m}{C_DA} ,
$$

where $\rho$ is the local atmospheric density, $C_D$ is a drag coefficient (order unity, near $2.2$ for a typical satellite in free-molecular flow), $A$ is the cross-sectional area facing the flow, and $m$ is the spacecraft mass. $B$, the **ballistic coefficient**, has units of $\mathrm{kg/m^2}$ and is the single number that determines how strongly a given vehicle responds to a given atmosphere: a dense, compact vehicle (large $B$) is affected less than a light, draggy one (small $B$) for the same $\rho$ and $v$. The name is inherited from artillery, where a "ballistic" projectile is one that carries its momentum through the air with minimal deflection — exactly the large-$B$, low-drag-sensitivity regime.

The velocity that matters is $\mathbf{v}_{\text{rel}} = \mathbf{v} - \boldsymbol\omega_E\times\mathbf{r}$, the spacecraft's velocity relative to the atmosphere, which co-rotates with Earth at $\omega_E = 7.292\,115\times10^{-5}\,\mathrm{rad/s}$. For a low-inclination prograde orbit this subtracts a meaningful fraction of orbital speed (Earth's surface at the equator moves at $\omega_ER_E\approx0.465\,\mathrm{km/s}$, against a typical LEO speed of $7$–$8\,\mathrm{km/s}$); for a polar or retrograde orbit the correction is smaller or reverses sign. Skipping this term is a common shortcut that costs several percent of the drag acceleration's secular effect, quantified below.

## Why drag causes real secular decay, unlike J2

The previous two lessons' entire point about $J_2$ was that its radial and transverse components, though nonzero at every instant, integrate to zero over one orbit — equal pushes forward and back that cancel on average, leaving $a$ and $e$ with no secular drift. Drag cannot do this. $\mathbf{a}_D$ is, by construction, *always* anti-parallel to $\mathbf{v}_{\text{rel}}$: it always opposes motion, never assists it, at every point of every orbit. There is no cancellation to average away, because there is no sign change to cancel against — drag's dissipative character (it removes energy, full stop, never adds it) is exactly the property that makes it, along with third-body attraction and solar radiation pressure, capable of genuine secular change where $J_2$ alone is not.

## Deriving the decay rate for a circular orbit

Use the energy route from the Gauss variational equations lesson: $\dot\varepsilon = \mathbf{v}\cdot\mathbf{a}_D$. Since $\mathbf{a}_D$ is anti-parallel to $\mathbf{v}$ (ignoring the co-rotation correction for a moment) with magnitude $\tfrac12\rho v^2/B$, this dot product reduces to $-\tfrac12\rho v^3/B$. For a circular orbit, $v=na$ (mean motion times radius), and $\varepsilon=-\mu/(2a)$ gives $\dot\varepsilon = \mu\dot a/(2a^2)$ as before. Equating:

$$
\frac{\mu\dot a}{2a^2} = -\frac{1}{2}\frac{\rho(na)^3}{B} \quad\Longrightarrow\quad \frac{da}{dt} = -\frac{\rho\,n\,a^2}{B} ,
$$

using $\mu = n^2a^3$ to eliminate $\mu$. This clean result — decay rate proportional to density, mean motion, the square of the radius, and inversely to ballistic coefficient — was checked against a direct numerical integration of the full Cartesian drag-only equation of motion (no $J_2$, no Earth rotation, so the idealisation matches the derivation's assumptions exactly): over $20$ orbits at $400\,\mathrm{km}$ with $B=100\,\mathrm{kg/m^2}$ and a fixed reference density, the numerically measured $da/dt$ agreed with this formula to $0.009\%$.

::: warning Earth's rotation is not a rounding error
Repeating that same check with the co-rotation term included ($\mathbf{v}_{\text{rel}}=\mathbf{v}-\boldsymbol\omega_E\times\mathbf{r}$ rather than $\mathbf{v}$ alone) at $i=51.6^\circ$ reduces the measured decay rate to about $92\%$ of the formula's prediction — an $8\%$ correction, matching the approximate analytic factor $1-2(\omega_E/n)\cos i$ to within a percent. The correction grows at lower inclination (largest at the equator, where the co-rotating atmosphere moves most directly with a prograde orbit) and vanishes for a polar orbit; a retrograde orbit sees the correction flip sign and *increase* the decay rate, because it is flying into the co-rotating atmosphere head-on rather than with it.
:::

## The drag paradox

Vis-viva gives $v=\sqrt{\mu/a}$ for a circular orbit: as drag removes energy and $a$ shrinks, $v$ *increases*. A satellite loses energy to drag and ends up moving faster, in a lower, denser part of the atmosphere, where it experiences yet more drag — a runaway that ends in re-entry rather than a stable equilibrium. This is not a contradiction of energy conservation; the spacecraft's kinetic energy rises, but its potential energy ($-\mu/r$, more negative at smaller $r$) falls by more, so the total $\varepsilon=-\mu/(2a)$ still decreases as required. The everyday version of this fact is why a decaying satellite's orbital period keeps shrinking right up until re-entry, rather than lengthening as it "slows down" — it does not slow down, in the inertial sense, until the very last, steep part of the descent through the thick lower atmosphere.

::: example Drag circularises an eccentric orbit
Start at $300\,\mathrm{km}\times900\,\mathrm{km}$ altitude ($a_0=6978.137\,\mathrm{km}$, $e_0=0.04299$), $i=51.6^\circ$, $B=100\,\mathrm{kg/m^2}$, with an illustrative density referenced to $4\times10^{-11}\,\mathrm{kg/m^3}$ at $400\,\mathrm{km}$ and an $80\,\mathrm{km}$ scale height. Integrating the full Cartesian equations of motion (drag plus Earth rotation, no $J_2$) for $300$ orbits — a result that does not move under a tighter integrator tolerance — the eccentricity falls steadily from $0.042\,99$ to $0.039\,64$, and the *perigee* altitude barely moves, from $300.0\,\mathrm{km}$ to $296.0\,\mathrm{km}$, while the *apogee* altitude drops from $900.0\,\mathrm{km}$ to $847.0\,\mathrm{km}$ — eighteen times more altitude lost at apogee than at perigee. Density is an exponential function of altitude, so drag is overwhelmingly concentrated near perigee, the one point of the orbit where the spacecraft is deep enough in the atmosphere to feel it strongly; a retrograde-direction deceleration concentrated at one point of an orbit is exactly the perigee burn of the maneuvers module, run in reverse and continuously — it lowers the *opposite* side of the orbit, apogee, which is precisely the circularising behaviour observed here.
:::

## Density model uncertainty

Every number above depends on $\rho$, and $\rho$ is the least certain input in this entire module. The real thermosphere responds to solar EUV heating (which swells and contracts the atmosphere on the 11-year solar cycle, and can double or halve density at a fixed altitude within days during a solar storm), to geomagnetic activity, to time of day, and to season, through models (NRLMSISE-00 and its successors) with a dozen or more input drivers. For order-of-magnitude design work, an illustrative exponential fit, $\rho(h) = \rho_{400}\exp[-(h-400)/H]$, referenced at two extremes — $\rho_{400}=1\times10^{-12}\,\mathrm{kg/m^3}$, $H=50\,\mathrm{km}$ for a quiet Sun, against $\rho_{400}=4\times10^{-11}\,\mathrm{kg/m^3}$, $H=80\,\mathrm{km}$ for an active one — brackets the real spread reasonably honestly, and the bracket *widens* with altitude: at $400\,\mathrm{km}$ the two curves differ by a factor of about $40$; by $800\,\mathrm{km}$, a factor of about $200$, because the thinner, more variable upper thermosphere is proportionally more sensitive to solar heating than the denser air just above the sensible atmosphere.

::: example Lifetime from 400 km, and what dominates the uncertainty
Integrating $da/dt=-\rho(a)na^2/B$ (the circular-orbit decay formula above, applied to a slowly-shrinking orbit) from $400\,\mathrm{km}$ down to a $120\,\mathrm{km}$ re-entry altitude, using the two density curves above:

| $B\ (\mathrm{kg/m^2})$ | Lifetime, active Sun | Lifetime, quiet Sun | Ratio |
| --- | --- | --- | --- |
| $50$ | $21.7$ days | $556.6$ days | $25.6\times$ |
| $100$ | $43.4$ days | $1113.3$ days | $25.6\times$ |
| $200$ | $86.8$ days | $2226.6$ days | $25.6\times$ |

Lifetime scales exactly linearly with $B$ — doubling the ballistic coefficient exactly doubles the predicted lifetime, a direct consequence of $B$ appearing only in the denominator of $da/dt$ — but the *density* assumption alone swings the answer by a factor of about $25$, entirely independent of how well $B$ itself is known. A re-entry prediction quoted to the day, from a satellite whose ballistic coefficient is known to $10\%$, is not meaningfully more precise than one quoted to the month, because the atmosphere, not the spacecraft, is the dominant source of uncertainty — which is exactly why real re-entry predictions widen their error bars sharply as a solar storm approaches and narrow only in the final days, once the actual density the spacecraft is flying through can be inferred from its observed decay rate rather than forecast in advance.
:::

::: key Drag acceleration and decay rate
$$
\mathbf{a}_D = -\frac{1}{2}\frac{\rho v_{\text{rel}}}{B}\mathbf{v}_{\text{rel}}, \quad B=\frac{m}{C_DA}, \quad \mathbf{v}_{\text{rel}}=\mathbf{v}-\boldsymbol\omega_E\times\mathbf{r}, \qquad \frac{da}{dt}\Big|_{\text{circular}} = -\frac{\rho na^2}{B}.
$$
Drag causes genuine secular decay (unlike $J_2$'s periodic wobble), speeds the spacecraft up as $a$ shrinks (vis-viva), and circularises an eccentric orbit by acting almost entirely near perigee.
:::

## Check yourself

::: check
Two spacecraft share the same orbit and drag coefficient $C_D$, but one has twice the mass and the same cross-sectional area as the other. Which one decays faster, and by roughly what factor?
:::

::: answer
The lighter spacecraft (half the mass) decays faster. Its ballistic coefficient $B=m/(C_DA)$ is half that of the heavier one, and $da/dt\propto1/B$, so its decay rate is roughly twice as large — it loses altitude about twice as fast, all else equal.
:::

::: check
A satellite is observed to speed up (its orbital velocity increases) over several months with no propulsive maneuvers. Is this evidence against drag, or exactly what drag predicts?
:::

::: answer
It is exactly what drag predicts — the drag paradox. Drag removes orbital energy, which lowers $a$; vis-viva, $v=\sqrt{\mu/a}$, then requires $v$ to *increase* as $a$ shrinks. A speeding-up satellite with no maneuvers and a decaying altitude is the textbook signature of drag, not evidence against it.
:::

::: check
Explain physically why drag reduces eccentricity rather than increasing it or leaving it unchanged, using the exponential dependence of density on altitude.
:::

::: answer
Density falls off exponentially with altitude, so for an eccentric orbit almost all of the drag deceleration happens in the short arc near perigee, where the spacecraft is lowest and the air thickest; at apogee, density (and hence drag) is negligible by comparison. A deceleration concentrated at perigee acts like a retrograde burn at that one point, which — by the same orbit-shape relationship used to lower apogee with a perigee burn in the maneuvers module — preferentially lowers the *opposite* side of the orbit, apogee, while leaving perigee itself comparatively unaffected. Apogee drops faster than perigee, so the orbit becomes rounder over time.
:::

::: check
Why does skipping the atmospheric co-rotation term in $\mathbf{v}_{\text{rel}}$ matter more for a low-inclination orbit than for a polar one?
:::

::: answer
The approximate correction to the decay rate scales as $\cos i$: it is largest at the equator, where a prograde orbit's velocity and the co-rotating atmosphere's velocity point in nearly the same direction, so subtracting the atmosphere's motion meaningfully reduces the relative speed the drag formula uses. At $90^\circ$ inclination the correction vanishes, because the atmosphere's rotational velocity (which is purely eastward, in the equatorial plane) has no component along a polar orbit's mostly north–south velocity at most points of the orbit.
:::

::: check
A mission wants to guarantee a satellite re-enters within 90 days of end of life, using drag alone (no propulsion). Based on this lesson's lifetime table, is specifying a small ballistic coefficient alone a reliable way to guarantee this, regardless of solar activity?
:::

::: answer
No. Even the smallest ballistic coefficient in the table ($B=50\,\mathrm{kg/m^2}$) gives a lifetime anywhere from about $22$ days (active Sun) to nearly $19$ months (quiet Sun) from the same $400\,\mathrm{km}$ starting altitude — a factor of about $25$ swing driven entirely by atmospheric density, which the mission cannot control or reliably predict years in advance. Guaranteeing a 90-day re-entry regardless of solar conditions requires either a substantially lower starting altitude, an active deorbit maneuver, or accepting that the guarantee is conditional on the solar cycle phase at end of life.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}_D = -\tfrac12(\rho v_{\text{rel}}/B)\mathbf{v}_{\text{rel}}$ | Drag acceleration; $B=m/(C_DA)$, ballistic coefficient, $\mathrm{kg/m^2}$ |
| $\mathbf{v}_{\text{rel}} = \mathbf{v}-\boldsymbol\omega_E\times\mathbf{r}$ | Velocity relative to the co-rotating atmosphere; omitting it costs several percent |
| $da/dt = -\rho na^2/B$ | Secular decay rate, circular orbit, verified to $0.009\%$ against direct integration |
| Drag causes real secular decay | Unlike $J_2$: always opposes velocity, never cancels over an orbit |
| Drag paradox | $a\downarrow \Rightarrow v=\sqrt{\mu/a}\uparrow$; speed increases as the orbit decays |
| Circularisation | Density peaks at perigee; drag concentrated there lowers apogee far more than perigee |
| Density uncertainty | Illustrative solar-min/max bracket spans a factor of $\sim40$ at $400\,\mathrm{km}$, widening to $\sim200$ by $800\,\mathrm{km}$; dominates lifetime uncertainty over $B$ |

The next lesson leaves the atmosphere behind for perturbations that act everywhere, at every altitude, with no exponential cutoff: the gravitational pull of the Moon and Sun, and the small additional effects of tides and relativity.
