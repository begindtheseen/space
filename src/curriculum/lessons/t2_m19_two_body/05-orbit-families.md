---
id: l05-orbit-families
title: Circular, elliptical, parabolic and hyperbolic orbits
minutes: 18
covers:
  - circular, elliptical, parabolic and hyperbolic orbits
---

Every two-body trajectory is one of four things: a circle, an ellipse, a parabola or a hyperbola. The previous lessons produced the machinery – energy, angular momentum, the orbit equation, vis-viva – and this lesson applies it to each family in turn, so that when a mission document says "C3 of 12" or "a 0.74-eccentricity orbit" you know immediately what the trajectory looks like, how fast the vehicle moves along it, and how the numbers connect.

The four families are not four different problems. They are one problem seen at different energies, and the cleanest way to see this is to stand at a fixed point above Earth and vary only the speed. That is how this lesson begins. It then treats each family with the formulas that are natural to it, works a departure hyperbola and a planetary flyby with real numbers, and closes with the degenerate case that catches out careless code.

The reader should have the orbit equation, $\varepsilon = -\mu/(2a)$, vis-viva, and the apsidal relations $r_p = a(1 - e)$, $r_a = a(1 + e)$ fresh in mind.

## One family, sorted by speed

Stand at radius $r = 6678.137\,\mathrm{km}$ ($300\,\mathrm{km}$ altitude) with velocity horizontal. The circular speed is $v_c = \sqrt{\mu/r} = 7.726\,\mathrm{km/s}$ and the escape speed is $v_{\text{esc}} = \sqrt{2}\,v_c = 10.926\,\mathrm{km/s}$. Because the velocity is horizontal, the point is an apsis, $h = rv$, and the energy is $\varepsilon = v^2/2 - \mu/r$. From these, $a = -\mu/(2\varepsilon)$, $p = h^2/\mu$, and $e$ follows from $p = a(1 - e^2)$ or from $e^2 = 1 + 2\varepsilon h^2/\mu^2$.

::: example Sweeping the speed at 300 km altitude
| $v$ (km/s) | $\varepsilon$ ($\mathrm{km^2/s^2}$) | $a$ (km) | $e$ | Other apsis (km) | Orbit |
| --- | --- | --- | --- | --- | --- |
| $7.000$ | $-35.19$ | $5664$ | $0.179$ | $r_p = 4650$ | ellipse, hits Earth |
| $7.726$ | $-29.84$ | $6678$ | $0$ | – | circle |
| $9.000$ | $-19.19$ | $10\,387$ | $0.357$ | $r_a = 14\,096$ | ellipse |
| $10.000$ | $-9.69$ | $20\,573$ | $0.675$ | $r_a = 34\,468$ | ellipse |
| $10.926$ | $0$ | $\infty$ | $1$ | – | parabola |
| $12.000$ | $+12.31$ | $-16\,187$ | $1.413$ | – | hyperbola |

At $7.0\,\mathrm{km/s}$ the point is *apogee*: the orbit dips to $r_p = a(1 - e) = 4650\,\mathrm{km}$, inside Earth, and the vehicle re-enters within half an orbit. At $v_c$ the orbit is a circle. Above $v_c$ the point is perigee and apogee climbs rapidly – from $9$ to $10\,\mathrm{km/s}$ the apogee radius more than doubles. At $v_{\text{esc}}$ the apogee is at infinity. Above it the orbit is a hyperbola with negative $a$ and the vehicle leaves with excess speed $\sqrt{v^2 - v_{\text{esc}}^2} = \sqrt{144 - 119.4} = 4.96\,\mathrm{km/s}$.
:::

The lesson to draw: speed at a fixed radius is the only dial. Direction of the velocity changes *which* ellipse of a given $a$ you are on (its $e$ and where its perigee lies), but the size $a$ and the classification are set by $\lVert \mathbf{v} \rVert$ alone through vis-viva.

## Circular orbits

A circular orbit has $e = 0$, $r = a = p$ everywhere, and every point is simultaneously periapsis and apoapsis – which is why the argument of periapsis will turn out to be undefined for it. The velocity is everywhere horizontal and of constant magnitude:

$$
v_c = \sqrt{\frac{\mu}{r}}, \qquad T = 2\pi\sqrt{\frac{r^3}{\mu}}, \qquad \varepsilon = -\frac{\mu}{2r}, \qquad h = \sqrt{\mu r}.
$$

Speed falls as $r^{-1/2}$ and period grows as $r^{3/2}$: the ISS at $6791\,\mathrm{km}$ moves at $7.66\,\mathrm{km/s}$ with a $92.8\,\mathrm{min}$ period; GPS at $26\,560\,\mathrm{km}$ moves at $3.87\,\mathrm{km/s}$ in $11\,\mathrm{h}\,58\,\mathrm{min}$; GEO at $42\,164\,\mathrm{km}$ moves at $3.07\,\mathrm{km/s}$ in $23\,\mathrm{h}\,56\,\mathrm{min}$. A circular orbit is the configuration in which kinetic energy is exactly half the magnitude of potential energy, $v_c^2/2 = \mu/(2r)$, so $\varepsilon$ is minus the kinetic energy. No real orbit is exactly circular, and the ISS at $e = 0.0006$ is about as close as operational orbits come.

## Elliptical orbits

For $0 < e < 1$ the speed varies between the apsides in the ratio of the radii:

$$
\frac{v_p}{v_a} = \frac{r_a}{r_p} = \frac{1 + e}{1 - e},
$$

from $h = r_p v_p = r_a v_a$. For the ISS this ratio is $1.0012$; for a GTO with $e = 0.728$ it is $6.36$; for a Molniya orbit with $e = 0.74$ it is $6.7$. Vis-viva gives the apsidal speeds directly:

$$
v_p^2 = \mu\left(\frac{2}{r_p} - \frac{1}{a}\right) = \frac{\mu}{a}\,\frac{1 + e}{1 - e}, \qquad
v_a^2 = \frac{\mu}{a}\,\frac{1 - e}{1 + e},
$$

the second forms following from $r_p = a(1 - e)$ and a little algebra: $2/r_p - 1/a = (2 - (1 - e))/(a(1 - e)) = (1 + e)/(a(1 - e))$. Note that $\sqrt{\mu/a}$ is the circular speed at radius $a$, so an eccentric orbit is faster than that at perigee by $\sqrt{(1 + e)/(1 - e)}$ and slower at apogee by the same factor.

The elliptical family is where most spacecraft spend most of their lives, from near-circular LEO to transfer ellipses. Two shapes recur so often that you should know them by their eccentricity: the GTO at $e \approx 0.73$, with perigee in low orbit and apogee at GEO, and the Molniya orbit at $e \approx 0.74$, $a \approx 26\,562\,\mathrm{km}$, a half-sidereal-day orbit with perigee near $500\,\mathrm{km}$ and apogee near $39\,900\,\mathrm{km}$ that lingers for hours over the northern hemisphere. Their similar eccentricities and very different purposes make the point that $e$ alone is shape, not mission.

## Parabolic orbits

The parabola is the knife-edge case $\varepsilon = 0$, $e = 1$, $a = \infty$. At every radius the speed is exactly the local escape speed,

$$
v = \sqrt{\frac{2\mu}{r}},
$$

and the orbit equation becomes $r = p/(1 + \cos\nu) = \tfrac{p}{2}\sec^2(\nu/2)$ with periapsis $r_p = p/2$. The parabola with $r_p = 6678.137\,\mathrm{km}$ has $p = 13\,356.3\,\mathrm{km}$; on it the spacecraft passes $r = 10\,000\,\mathrm{km}$ at $\nu = 70.4^\circ$ moving at $8.93\,\mathrm{km/s}$, crosses geostationary radius at $\nu = 133.1^\circ$ moving at $4.35\,\mathrm{km/s}$ (the escape speed there), and reaches lunar distance at $\nu = 164.9^\circ$ moving at $1.44\,\mathrm{km/s}$. It never stops and never comes back, but it approaches $r \to \infty$ ever more slowly, arriving with zero speed after infinite time.

No mission flies an exact parabola, because the slightest perturbation tips it into an ellipse or a hyperbola. Its importance is as a limit and a reference: "escape" means reaching parabolic speed, and the $\Delta v$ from a circular orbit to escape is $(\sqrt{2} - 1)v_c$. Numerically, code that handles ellipses with $a$ and hyperbolas with $\lvert a \rvert$ must be checked against the parabola, where $a$ is useless and $p$ must carry the description. The universal-variable formulation later in the module exists partly to make this seam disappear.

## Hyperbolic orbits

For $e > 1$ the energy is positive and the spacecraft arrives at infinity with a nonzero *hyperbolic excess speed* $v_\infty$. Set $r \to \infty$ in the energy: $\varepsilon = v_\infty^2/2$. Combined with $\varepsilon = -\mu/(2a)$ (with $a < 0$),

$$
v_\infty = \sqrt{2\varepsilon} = \sqrt{-\frac{\mu}{a}} = \sqrt{\frac{\mu}{\lvert a \rvert}}.
$$

Interplanetary mission design quotes the *characteristic energy* $C_3 = v_\infty^2$ (units $\mathrm{km^2/s^2}$), which is twice the specific energy; a launch vehicle's performance to a given $C_3$ is the payload it can put on that hyperbola. At any radius the speed follows from energy conservation between $r$ and infinity:

$$
v^2 = v_\infty^2 + \frac{2\mu}{r} = v_\infty^2 + v_{\text{esc}}^2(r).
$$

The speed on a hyperbola is the escape speed and the excess speed added in quadrature – never as a plain sum. Two more relations tie the shape to the periapsis. From $r_p = a(1 - e)$ with $a = -\mu/v_\infty^2$,

$$
e = 1 + \frac{r_p v_\infty^2}{\mu},
$$

and the turning angle and aiming radius follow from the geometry of the last lesson: $\sin(\delta/2) = 1/e$ and $b = \lvert a \rvert\sqrt{e^2 - 1}$. A useful rewriting of the aiming radius uses $h = r_p v_p = b\,v_\infty$ (angular momentum evaluated at periapsis and at infinity, where the velocity is $v_\infty$ along the asymptote at perpendicular distance $b$):

$$
b = \frac{r_p v_p}{v_\infty} = r_p\sqrt{1 + \frac{2\mu}{r_p v_\infty^2}}.
$$

The aiming radius is always larger than the periapsis radius: gravity pulls the trajectory inward, so a spacecraft aimed to miss the centre by $b$ passes closer, at $r_p$. This is the *gravitational focusing* that makes planets bigger targets than their physical size.

::: example A departure hyperbola for Mars
A Mars-bound spacecraft leaves from a $300\,\mathrm{km}$ circular parking orbit ($r = 6678.137\,\mathrm{km}$, $v_c = 7.726\,\mathrm{km/s}$) on a hyperbola with $C_3 = 12.0\,\mathrm{km^2/s^2}$, so $v_\infty = 3.464\,\mathrm{km/s}$. The perigee speed is
$$
v_p = \sqrt{v_\infty^2 + \frac{2\mu}{r_p}} = \sqrt{12.0 + 119.37} = 11.462\,\mathrm{km/s},
$$
so the departure burn from the parking orbit is $\Delta v = 11.462 - 7.726 = 3.736\,\mathrm{km/s}$ – far more than the $3.20\,\mathrm{km/s}$ needed merely to escape ($v_{\text{esc}} = 10.926\,\mathrm{km/s}$), even though $v_\infty$ is only $3.46\,\mathrm{km/s}$. Adding in quadrature is kind to you: the last $3.46\,\mathrm{km/s}$ of excess speed cost only $0.54\,\mathrm{km/s}$ of burn. This is the Oberth effect, and it is why departure burns are made deep in the gravity well.

The hyperbola has $a = -\mu/v_\infty^2 = -398\,600.4418/12.0 = -33\,217\,\mathrm{km}$, eccentricity $e = 1 + r_p v_\infty^2/\mu = 1 + 6678.137 \times 12.0/398\,600.4418 = 1.2010$, and turning angle $\delta = 2\sin^{-1}(1/1.2010) = 112.7^\circ$. Because $e$ is close to 1, the direction of the asymptote is very sensitive to the burn: this is where the departure geometry is set.
:::

::: example A flyby of Earth
A spacecraft returning from deep space approaches Earth with $v_\infty = 6.0\,\mathrm{km/s}$ on a trajectory that would miss the centre by $b = 15\,529\,\mathrm{km}$ if gravity were switched off. Its periapsis radius solves $b = r_p\sqrt{1 + 2\mu/(r_p v_\infty^2)}$; try $r_p = 8000\,\mathrm{km}$: $\sqrt{1 + 2 \times 398\,600.4418/(8000 \times 36)} = \sqrt{1 + 2.768} = 1.941$, and $8000 \times 1.941 = 15\,529\,\mathrm{km}$. So the flyby passes $1622\,\mathrm{km}$ above the surface at
$$
v_p = \sqrt{36 + 2 \times 398\,600.4418/8000} = \sqrt{36 + 99.65} = 11.647\,\mathrm{km/s}.
$$
The eccentricity is $e = 1 + 8000 \times 36/398\,600.4418 = 1.7225$ and the turning angle $\delta = 2\sin^{-1}(1/1.7225) = 71.0^\circ$. Earth bends the $6\,\mathrm{km/s}$ approach through $71^\circ$ without any propellant – the change in the *direction* of $\mathbf{v}_\infty$ is what a gravity assist buys, since its magnitude is the same on the way out as on the way in.
:::

::: key Classifying a conic
| | Ellipse | Parabola | Hyperbola |
| --- | --- | --- | --- |
| $e$ | $0 \le e < 1$ | $1$ | $e > 1$ |
| $\varepsilon = -\mu/(2a)$ | $< 0$ | $0$ | $> 0$ |
| $a$ | $> 0$ | $\infty$ | $< 0$ |
| Speed at $r$ | $\sqrt{\mu(2/r - 1/a)}$ | $\sqrt{2\mu/r}$ | $\sqrt{v_\infty^2 + 2\mu/r}$ |

For the hyperbola, $v_\infty = \sqrt{-\mu/a}$, $C_3 = v_\infty^2$, $e = 1 + r_p v_\infty^2/\mu$ and $\sin(\delta/2) = 1/e$.
:::

## The degenerate case

All of the above assumes $\mathbf{h} \neq \mathbf{0}$. If the velocity is exactly radial – straight up or straight down – then $h = 0$, $p = 0$, the orbit equation collapses to $r = 0$, and the "conic" is a straight line through the centre. The energy classification still works (radial ellipse, radial parabola, radial hyperbola), but $e = 1$ for all of them, there is no orbit plane, and every angular element is undefined. Real trajectories never have $h$ exactly zero, but a sounding rocket or a vertical-descent lander comes close, and conversion routines that divide by $h$ or $p$ will produce infinities there. Test for it.

::: warning Escape speed is a magnitude, not a direction
$v_{\text{esc}} = \sqrt{2\mu/r}$ is the speed at which $\varepsilon = 0$ regardless of direction. A spacecraft moving at escape speed straight up escapes; moving at escape speed horizontally escapes on a parabola; moving at escape speed downward escapes too, after passing periapsis – unless the periapsis is below the surface. Direction determines the shape and where the periapsis lies; only speed determines whether the orbit is bound.
:::

::: warning Adding speeds on a hyperbola
$v_p \neq v_{\text{esc}} + v_\infty$. The speeds combine as $v_p^2 = v_{\text{esc}}^2 + v_\infty^2$. For the Mars departure, the plain sum would give $10.93 + 3.46 = 14.39\,\mathrm{km/s}$ against the correct $11.46\,\mathrm{km/s}$ – a $3\,\mathrm{km/s}$ error in a propellant budget.
:::

## Check yourself

::: check
A spacecraft at $r = 7000\,\mathrm{km}$ moves at $9.5\,\mathrm{km/s}$. Classify its orbit and find $a$. If the velocity is horizontal, what is the apogee radius?
:::

::: answer
$\varepsilon = 9.5^2/2 - 398\,600.4418/7000 = 45.125 - 56.943 = -11.818\,\mathrm{km^2/s^2} < 0$: an ellipse. $a = -\mu/(2\varepsilon) = 398\,600.4418/23.636 = 16\,864\,\mathrm{km}$. With horizontal velocity the point is an apsis; since $v = 9.5 > v_c = 7.546\,\mathrm{km/s}$ it is perigee, so $r_a = 2a - r_p = 33\,728 - 7000 = 26\,728\,\mathrm{km}$.
:::

::: check
Why does an eccentric orbit spend most of its time near apoapsis? Give the quantitative reason.
:::

::: answer
Kepler's second law: $dA/dt = h/2$ is constant, and the area swept per unit angle is $\tfrac{1}{2}r^2\,d\nu$. Where $r$ is large, sweeping the same area per second requires a small $d\nu/dt = h/r^2$. On a GTO the angular rate at apogee is $(r_p/r_a)^2 = (1/6.36)^2 = 1/40$ of the rate at perigee, so the spacecraft lingers near apogee about forty times longer per degree of true anomaly than near perigee.
:::

::: check
A probe needs $v_\infty = 5.0\,\mathrm{km/s}$ leaving Earth from a $200\,\mathrm{km}$ circular orbit. Find $C_3$, the perigee speed and the departure $\Delta v$.
:::

::: answer
$C_3 = v_\infty^2 = 25.0\,\mathrm{km^2/s^2}$. At $r = 6578.137\,\mathrm{km}$, $v_{\text{esc}}^2 = 2\mu/r = 121.19\,\mathrm{km^2/s^2}$, so $v_p = \sqrt{25.0 + 121.19} = 12.091\,\mathrm{km/s}$. The circular speed is $7.784\,\mathrm{km/s}$, so $\Delta v = 12.091 - 7.784 = 4.307\,\mathrm{km/s}$.
:::

::: check
On a parabolic orbit about Earth with $r_p = 7000\,\mathrm{km}$, at what true anomaly is the spacecraft at $r = 28\,000\,\mathrm{km}$, and how fast is it moving there?
:::

::: answer
$p = 2r_p = 14\,000\,\mathrm{km}$. From $r = p/(1 + \cos\nu)$, $\cos\nu = p/r - 1 = 0.5 - 1 = -0.5$, so $\nu = 120^\circ$. The speed is the local escape speed, $\sqrt{2\mu/r} = \sqrt{2 \times 398\,600.4418/28\,000} = 5.336\,\mathrm{km/s}$.
:::

::: check
A hyperbolic flyby has $e = 1.05$. What is its turning angle, and what does that tell you about slow flybys?
:::

::: answer
$\sin(\delta/2) = 1/1.05 = 0.952$, so $\delta/2 = 72.2^\circ$ and $\delta = 144.5^\circ$. An eccentricity barely above 1 – a slow approach, or a very close periapsis – bends the trajectory almost back on itself. Slow flybys give large deflections; fast ones ($e \gg 1$) are barely deflected. Since $e = 1 + r_p v_\infty^2/\mu$, a mission wanting a big turn must arrive slowly or pass close.
:::

## Summary

| Family | Defining values | Key formulas |
| --- | --- | --- |
| Circle | $e = 0$, $r = a$ | $v_c = \sqrt{\mu/r}$, $T = 2\pi\sqrt{r^3/\mu}$, $\varepsilon = -\mu/(2r)$ |
| Ellipse | $0 < e < 1$, $a > 0$ | $v_p/v_a = (1 + e)/(1 - e)$; $v_p^2 = \dfrac{\mu}{a}\dfrac{1 + e}{1 - e}$ |
| Parabola | $e = 1$, $\varepsilon = 0$ | $v = \sqrt{2\mu/r}$ everywhere; $r = \tfrac{p}{2}\sec^2(\nu/2)$, $r_p = p/2$ |
| Hyperbola | $e > 1$, $a < 0$ | $v_\infty = \sqrt{-\mu/a}$, $C_3 = v_\infty^2$, $v^2 = v_\infty^2 + 2\mu/r$, $e = 1 + r_p v_\infty^2/\mu$, $\sin(\delta/2) = 1/e$, $b = r_p v_p/v_\infty$ |
| Degenerate | $h = 0$ | Radial motion, no orbit plane, angular elements undefined |

The next lesson turns from the shape of the orbit to its orientation in space: the six classical orbital elements, the frames they are measured in, and the equinoctial alternatives that avoid their singularities.
