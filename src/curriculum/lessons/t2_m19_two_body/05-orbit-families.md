---
id: l05-orbit-families
title: Circular, elliptical, parabolic and hyperbolic orbits
minutes: 20
covers:
  - circular, elliptical, parabolic and hyperbolic orbits
---

Throw a ball sideways off a very tall tower. Throw it gently and it curves down and lands close by. Throw it harder and it lands farther away. Throw it hard enough and the ground curves away beneath it as fast as it falls — it never lands. That is an orbit. Throw it harder still and it swings out on a long loop. Harder again, and it leaves for good.

Every two-body path is one of four shapes: a **circle**, an **ellipse**, a **parabola** or a **hyperbola**. The earlier lessons built the tools — energy, angular momentum, the orbit equation, vis-viva. This lesson uses them on each shape in turn. Afterward, when a mission document says "C3 of 12" or "a 0.74-eccentricity orbit", you will know what the path looks like, how fast the vehicle moves along it, and how the numbers connect.

The four shapes are not four different problems. They are one problem at different energies. The cleanest way to see that is to stand at one fixed point above Earth and change only the speed. That is where we start. Then each shape gets its own section, with a Mars departure and a planetary flyby worked in real numbers. The lesson ends with the odd case that trips up careless code.

Keep these fresh from the last few lessons: the orbit equation $r = p/(1 + e\cos\nu)$, the energy $\varepsilon = -\mu/(2a)$, vis-viva $v^2 = \mu(2/r - 1/a)$, and the closest and farthest distances $r_p = a(1 - e)$ and $r_a = a(1 + e)$.

## One family, sorted by speed

Stand at radius $r = 6678.137\,\mathrm{km}$, which is $300\,\mathrm{km}$ above the surface. Point your velocity exactly sideways — horizontal, at right angles to the line to Earth's center.

Two speeds matter here. The circular speed is $v_c = \sqrt{\mu/r} = 7.726\,\mathrm{km/s}$. The escape speed is $v_{\text{esc}} = \sqrt{2}\,v_c = 10.926\,\mathrm{km/s}$.

Because the velocity is sideways, this point is an **apsis** — a closest or farthest point of the orbit. So the angular momentum is $h = rv$, with no angle to worry about. The energy is $\varepsilon = v^2/2 - \mu/r$. From those two numbers you get everything else:

- the semi-major axis from $a = -\mu/(2\varepsilon)$;
- the semi-latus rectum from $p = h^2/\mu$;
- the eccentricity from $p = a(1 - e^2)$, or from $e^2 = 1 + 2\varepsilon h^2/\mu^2$.

::: example Sweeping the speed at 300 km altitude
For each speed, compute $\varepsilon$, then $a$, then $e$, then the other apsis from $r_p + r_a = 2a$.

| $v$ (km/s) | $\varepsilon$ ($\mathrm{km^2/s^2}$) | $a$ (km) | $e$ | Other apsis (km) | Orbit |
| --- | --- | --- | --- | --- | --- |
| $7.000$ | $-35.19$ | $5664$ | $0.179$ | $r_p = 4650$ | ellipse, hits Earth |
| $7.726$ | $-29.84$ | $6678$ | $0$ | – | circle |
| $9.000$ | $-19.19$ | $10\,387$ | $0.357$ | $r_a = 14\,096$ | ellipse |
| $10.000$ | $-9.69$ | $20\,573$ | $0.675$ | $r_a = 34\,468$ | ellipse |
| $10.926$ | $0$ | $\infty$ | $1$ | – | parabola |
| $12.000$ | $+12.31$ | $-16\,187$ | $1.413$ | – | hyperbola |

Read the table from the top.

**At $7.0\,\mathrm{km/s}$** you are slower than circular, so your point is the *apogee*. The orbit dips to $r_p = a(1 - e) = 4650\,\mathrm{km}$. That is inside Earth, whose radius is $6378\,\mathrm{km}$, so the vehicle re-enters within half an orbit.

**At $v_c$** the orbit is a circle.

**Above $v_c$** your point becomes the perigee, and the apogee climbs fast. Going from $9$ to $10\,\mathrm{km/s}$ more than doubles the apogee radius.

**At $v_{\text{esc}}$** the apogee is at infinity.

**Above $v_{\text{esc}}$** the orbit is a hyperbola, with negative $a$. The vehicle leaves with a leftover speed of $\sqrt{v^2 - v_{\text{esc}}^2} = \sqrt{144 - 119.4} = 4.96\,\mathrm{km/s}$.

**Sanity check.** Energy climbs steadily down the table and crosses zero exactly at the escape speed, as it must.
:::

All six paths start from the same point; the [[picture of the whole family|speed-dial]] makes the pattern plain. The lesson to take away: at a fixed radius, **speed is the only dial** that sets the size. Vis-viva gives $a$ from $\lVert \mathbf{v} \rVert$ (read "the length of v" — the speed) alone. The *direction* of the velocity changes which ellipse of that size you are on — its $e$ and where its perigee sits — but not $a$, and not whether the orbit is bound.

### When the velocity is not horizontal

Now tilt the velocity upward by an angle $\gamma$ (Greek "gamma"), keeping the same $r$ and speed $v$. This tilt above the local horizontal is the **[[flight-path angle|flight-path-angle]]**.

Vis-viva does not care about direction. So $a$ and $\varepsilon$ stay exactly the same. But only the sideways part of the velocity counts toward angular momentum, so $h = rv\cos\gamma$ shrinks. With it, $p$ shrinks. From $e^2 = 1 + 2\varepsilon h^2/\mu^2$ the eccentricity grows. And the burn point is no longer an apsis.

Take $v = 9.0\,\mathrm{km/s}$ at $300\,\mathrm{km}$, tilted up by $\gamma = 20^\circ$.

**Step 1 — angular momentum.** $h = 6678.137 \times 9.0 \times \cos 20^\circ = 56\,479\,\mathrm{km^2/s}$.

**Step 2 — energy and size.** Unchanged from the table: $\varepsilon = -19.19\,\mathrm{km^2/s^2}$ and $a = 10\,387\,\mathrm{km}$.

**Step 3 — eccentricity.**
$$
e^2 = 1 + \frac{2(-19.187)(56\,479)^2}{(398\,600.4418)^2} = 0.2296, \qquad e = 0.479,
$$
up from $0.357$.

**Step 4 — perigee.** $r_p = a(1 - e) = 5410\,\mathrm{km}$. That is $968\,\mathrm{km}$ *below* the surface.

The same speed that gave a healthy orbit with a $14\,096\,\mathrm{km}$ apogee now gives one that re-enters within a revolution. Where on this orbit is the burn point? Use $p = h^2/\mu = 8003\,\mathrm{km}$ in $r = p/(1 + e\cos\nu)$ and solve: $\nu = 65.5^\circ$, on the climbing side. The spacecraft rises to an apogee of $15\,364\,\mathrm{km}$ and then comes back down through the atmosphere.

This is why launch guidance works so hard to bring $\gamma$ to zero at **[[orbit insertion|insertion]]** — the moment the engine shuts down and the vehicle starts coasting in orbit. At a given speed, pointing sideways is what keeps the perigee highest.

## Circular orbits

A circular orbit has $e = 0$, and $r = a = p$ everywhere. Every point is at once the closest and the farthest point. That is why the angle that locates the closest point, the argument of periapsis, will turn out to be undefined for a circle.

The velocity is always sideways and always the same size:

$$
v_c = \sqrt{\frac{\mu}{r}}, \qquad T = 2\pi\sqrt{\frac{r^3}{\mu}}, \qquad \varepsilon = -\frac{\mu}{2r}, \qquad h = \sqrt{\mu r}.
$$

Speed falls like $r^{-1/2}$ and period grows like $r^{3/2}$. Some real orbits:

- the ISS at $6791\,\mathrm{km}$: $7.66\,\mathrm{km/s}$, period $92.8\,\mathrm{min}$;
- [[GPS satellites|gps-orbit]] at $26\,560\,\mathrm{km}$: $3.87\,\mathrm{km/s}$, period $11\,\mathrm{h}\,58\,\mathrm{min}$;
- GEO at $42\,164\,\mathrm{km}$: $3.07\,\mathrm{km/s}$, period $23\,\mathrm{h}\,56\,\mathrm{min}$.

On a circle, the kinetic energy is exactly half the size of the potential energy: $v_c^2/2 = \mu/(2r)$, against $\mu/r$. So the total energy $\varepsilon$ is minus the kinetic energy.

No real orbit is exactly circular. The ISS, at $e = 0.0006$, is about as close as working orbits get.

## Elliptical orbits

For $0 < e < 1$ the speed swings between a maximum at periapsis and a minimum at apoapsis. Angular momentum is the same at both ends, $h = r_p v_p = r_a v_a$, so the speeds are in the *inverse* ratio of the radii:

$$
\frac{v_p}{v_a} = \frac{r_a}{r_p} = \frac{1 + e}{1 - e}.
$$

The last step used $r_a/r_p = a(1 + e)/\big(a(1 - e)\big)$. For the ISS this ratio is $1.0012$. For a GTO with $e = 0.7283$ it is $6.36$. For a Molniya orbit with $e = 0.74$ it is $6.7$.

Vis-viva gives the two speeds directly:

$$
v_p^2 = \mu\left(\frac{2}{r_p} - \frac{1}{a}\right) = \frac{\mu}{a}\,\frac{1 + e}{1 - e}, \qquad
v_a^2 = \frac{\mu}{a}\,\frac{1 - e}{1 + e}.
$$

To get the second form, put $r_p = a(1 - e)$ into the bracket: $2/r_p - 1/a = \big(2 - (1 - e)\big)/\big(a(1 - e)\big) = (1 + e)/\big(a(1 - e)\big)$. The apoapsis version works the same way with $r_a = a(1 + e)$.

Notice that $\sqrt{\mu/a}$ is the circular speed at radius $a$. So an eccentric orbit is faster than that at perigee by a factor $\sqrt{(1 + e)/(1 - e)}$, and slower at apogee by the same factor.

Most spacecraft spend most of their lives on ellipses, from nearly circular low orbits to long transfer orbits. Two shapes come up so often that you should know them by their eccentricity:

- the **GTO**, $e \approx 0.73$, with perigee in low orbit and apogee at geostationary height;
- the **[[Molniya orbit|molniya]]**, $e \approx 0.74$ and $a \approx 26\,562\,\mathrm{km}$: a half-sidereal-day orbit with perigee about $530\,\mathrm{km}$ up and apogee about $39\,800\,\mathrm{km}$ up, which hangs for hours over the northern hemisphere.

Nearly the same eccentricity, completely different jobs. The number $e$ is shape, not mission.

## Parabolic orbits

The parabola is the knife-edge between bound and free: $\varepsilon = 0$, $e = 1$, $a = \infty$. At every radius the speed is exactly the local escape speed:

$$
v = \sqrt{\frac{2\mu}{r}}.
$$

With $e = 1$ the orbit equation becomes

$$
r = \frac{p}{1 + \cos\nu} = \frac{p}{2}\sec^2\frac{\nu}{2},
$$

using the half-angle identity $1 + \cos\nu = 2\cos^2(\nu/2)$. ($\sec$ is $1/\cos$.) The closest point is at $\nu = 0$, so $r_p = p/2$.

Follow a parabola with $r_p = 6678.137\,\mathrm{km}$, so $p = 13\,356.3\,\mathrm{km}$. Solve $\cos\nu = p/r - 1$ at each radius, and take the speed from $\sqrt{2\mu/r}$:

- at $r = 10\,000\,\mathrm{km}$: $\nu = 70.4^\circ$, speed $8.93\,\mathrm{km/s}$;
- at geostationary radius: $\nu = 133.1^\circ$, speed $4.35\,\mathrm{km/s}$ (the escape speed there);
- at the Moon's distance: $\nu = 164.9^\circ$, speed $1.44\,\mathrm{km/s}$.

It never stops and never comes back. But it slows forever, creeping toward zero speed as it creeps toward infinity.

No mission flies an exact parabola: the tiniest nudge tips it into an ellipse or a hyperbola. Its value is as a limit and a reference point, and [[some comets come close|near-parabolic]]. "Escape" means reaching parabolic speed. The extra speed to escape from a circular orbit is $(\sqrt{2} - 1)v_c$.

It also matters for code. Software that describes ellipses with $a$ and hyperbolas with $\lvert a \rvert$ must be tested on the parabola, where $a$ is useless and $p$ must carry the description. The [[universal-variable method|universal-seam]] later in this module exists partly to make that seam disappear.

## Hyperbolic orbits

For $e > 1$ the energy is positive. The spacecraft reaches "infinity" — far enough that Earth's pull no longer matters — still moving, with a leftover speed called the **hyperbolic excess speed**, $v_\infty$ (read "v infinity").

Let $r \to \infty$ in the energy. The $\mu/r$ term vanishes, leaving $\varepsilon = v_\infty^2/2$. Set this equal to $\varepsilon = -\mu/(2a)$ (with $a < 0$):

$$
v_\infty = \sqrt{2\varepsilon} = \sqrt{-\frac{\mu}{a}} = \sqrt{\frac{\mu}{\lvert a \rvert}}.
$$

Interplanetary mission design quotes the **characteristic energy** $C_3 = v_\infty^2$, in $\mathrm{km^2/s^2}$. It is twice the specific energy. A launch vehicle's performance "to a given $C_3$" is the payload mass it can put on that hyperbola.

At any radius, energy conservation between $r$ and infinity gives the speed:

$$
v^2 = v_\infty^2 + \frac{2\mu}{r} = v_\infty^2 + v_{\text{esc}}^2(r).
$$

So the speed on a hyperbola is the escape speed and the excess speed added **in quadrature** — like the two short sides of a right triangle, $\sqrt{a^2 + b^2}$ — never as a plain sum.

Two more relations tie the shape to the closest approach. From $r_p = a(1 - e)$ with $a = -\mu/v_\infty^2$:

$$
e = 1 + \frac{r_p v_\infty^2}{\mu}.
$$

The orbit-equation lesson gave the **turning angle** $\delta$ (Greek "delta"), how far the path is bent, and the **aiming radius** $b$, how far off-center the spacecraft was aimed:

$$
\sin\frac{\delta}{2} = \frac{1}{e}, \qquad b = \lvert a \rvert\sqrt{e^2 - 1}.
$$

A handier form for $b$ comes from angular momentum. At periapsis, $h = r_p v_p$. Far away, the spacecraft moves at $v_\infty$ along a straight line that misses the center by $b$, so $h = b\,v_\infty$. Setting these equal:

$$
b = \frac{r_p v_p}{v_\infty} = r_p\sqrt{1 + \frac{2\mu}{r_p v_\infty^2}}.
$$

The aiming radius is always larger than the closest approach. Gravity pulls the path inward, so a spacecraft aimed to miss by $b$ actually passes closer, at $r_p$. This **[[gravitational focusing|focusing]]** makes planets bigger targets than their physical size.

::: note Why mission designers quote C3 rather than speed
A launch vehicle's escape performance is published as payload mass against $C_3$, not against speed. $C_3$ is twice the energy per kilogram the vehicle must supply beyond escape, and that does not depend on which parking orbit you leave from. A trajectory analyst hands the launch provider a required $C_3$ and a direction for $\mathbf{v}_\infty$. The provider chooses the parking orbit and the burn. Typical values: $C_3 \approx 0$ for a lunar transfer, $10$ to $16\,\mathrm{km^2/s^2}$ for Mars, $80$ and above for Jupiter without gravity assists.
:::

::: example A departure hyperbola for Mars
A Mars-bound spacecraft leaves a $300\,\mathrm{km}$ circular parking orbit ($r = 6678.137\,\mathrm{km}$, $v_c = 7.726\,\mathrm{km/s}$) on a hyperbola with $C_3 = 12.0\,\mathrm{km^2/s^2}$.

**Step 1 — excess speed.** $v_\infty = \sqrt{C_3} = \sqrt{12.0} = 3.464\,\mathrm{km/s}$.

**Step 2 — speed needed at perigee.** Add in quadrature. Here $2\mu/r_p = 119.37\,\mathrm{km^2/s^2}$:
$$
v_p = \sqrt{v_\infty^2 + \frac{2\mu}{r_p}} = \sqrt{12.0 + 119.37} = 11.462\,\mathrm{km/s}.
$$

**Step 3 — the burn.** The spacecraft already has $7.726\,\mathrm{km/s}$, so $\Delta v = 11.462 - 7.726 = 3.736\,\mathrm{km/s}$.

**Sanity check.** Merely escaping would need $v_{\text{esc}} - v_c = 10.926 - 7.726 = 3.20\,\mathrm{km/s}$. So the last $3.46\,\mathrm{km/s}$ of excess speed cost only $0.54\,\mathrm{km/s}$ of extra burn. Adding in quadrature is kind to you. This is the **[[Oberth effect|oberth]]**, and it is why departure burns are made deep in the gravity well.

**Step 4 — the shape.** The semi-major axis is $a = -\mu/v_\infty^2 = -398\,600.4418/12.0 = -33\,217\,\mathrm{km}$. The eccentricity is
$$
e = 1 + \frac{r_p v_\infty^2}{\mu} = 1 + \frac{6678.137 \times 12.0}{398\,600.4418} = 1.2010,
$$
and the turning angle is $\delta = 2\sin^{-1}(1/1.2010) = 112.7^\circ$.

Because $e$ is close to 1, the direction of the outgoing asymptote is very sensitive to the burn. This is where the departure direction is set.
:::

::: example A flyby of Earth
A spacecraft returning from deep space approaches Earth with $v_\infty = 6.0\,\mathrm{km/s}$. With gravity switched off it would miss the center by $b = 15\,529\,\mathrm{km}$. How close does it really come?

**Step 1 — find the closest approach.** We need the $r_p$ that solves $b = r_p\sqrt{1 + 2\mu/(r_p v_\infty^2)}$. Try $r_p = 8000\,\mathrm{km}$:
$$
\sqrt{1 + \frac{2 \times 398\,600.4418}{8000 \times 36}} = \sqrt{1 + 2.768} = 1.941,
$$
and $8000 \times 1.941 = 15\,529\,\mathrm{km}$. That matches, so $r_p = 8000\,\mathrm{km}$: the flyby passes $8000 - 6378 = 1622\,\mathrm{km}$ above the surface.

**Step 2 — speed at closest approach.**
$$
v_p = \sqrt{36 + \frac{2 \times 398\,600.4418}{8000}} = \sqrt{36 + 99.65} = 11.647\,\mathrm{km/s}.
$$

**Step 3 — shape and bend.** $e = 1 + 8000 \times 36/398\,600.4418 = 1.7225$, and $\delta = 2\sin^{-1}(1/1.7225) = 71.0^\circ$.

Earth bends the $6\,\mathrm{km/s}$ approach through $71^\circ$ without any propellant. The speed far away is the same on the way out as on the way in; only its *direction* changed. That change of direction is what a **[[gravity assist|gravity-assist]]** buys.
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

Everything above assumes $\mathbf{h} \neq \mathbf{0}$. Now point the velocity exactly **radially** — straight up or straight down. Then $h = 0$ and $p = 0$. The orbit equation collapses to $r = 0$, and the "conic" squashes into a straight line through the center.

The energy sorting still works: there are radial ellipses (up and back down), radial parabolas and radial hyperbolas. But $e = 1$ for all of them. There is no orbit plane, and every angle that describes the orbit is undefined.

Real trajectories never have $h$ exactly zero. But a [[sounding rocket|radial-trajectory]] or a lander descending vertically comes close. Conversion routines that divide by $h$ or $p$ will produce infinities there. Test for it.

::: warning Escape speed is a magnitude, not a direction
$v_{\text{esc}} = \sqrt{2\mu/r}$ is the speed at which $\varepsilon = 0$, whichever way you point. At escape speed straight up, you escape. Horizontally, you escape on a parabola. Even pointed downward, you escape after passing periapsis — unless that periapsis is below the surface. Direction sets the shape and where periapsis lies. Only speed decides whether the orbit is bound.
:::

::: warning Adding speeds on a hyperbola
$v_p \neq v_{\text{esc}} + v_\infty$. The speeds combine as $v_p^2 = v_{\text{esc}}^2 + v_\infty^2$. For the Mars departure, a plain sum would give $10.93 + 3.46 = 14.39\,\mathrm{km/s}$ instead of the correct $11.46\,\mathrm{km/s}$ — a $3\,\mathrm{km/s}$ error in a propellant budget.
:::

## Check yourself

::: check
A spacecraft at $r = 7000\,\mathrm{km}$ moves at $9.5\,\mathrm{km/s}$. What kind of orbit is it on, and what is $a$? If the velocity is horizontal, what is the apogee radius?
:::

::: answer
**Energy.** $\varepsilon = 9.5^2/2 - 398\,600.4418/7000 = 45.125 - 56.943 = -11.818\,\mathrm{km^2/s^2}$. Negative, so it is an ellipse.

**Size.** $a = -\mu/(2\varepsilon) = 398\,600.4418/23.636 = 16\,864\,\mathrm{km}$.

**Apogee.** With horizontal velocity the point is an apsis. The circular speed there is $v_c = 7.546\,\mathrm{km/s}$, and $9.5$ is faster, so this is perigee. Then $r_a = 2a - r_p = 33\,728 - 7000 = 26\,728\,\mathrm{km}$.
:::

::: check
Why does an eccentric orbit spend most of its time near apoapsis? Give the reason in numbers.
:::

::: answer
Kepler's second law: area is swept at the constant rate $dA/dt = h/2$. The area swept per bit of angle is $\tfrac{1}{2}r^2\,d\nu$. So the turning rate is $d\nu/dt = h/r^2$ — small where $r$ is large.

The ratio of turning rates at apogee and perigee is $(r_p/r_a)^2$. On a GTO that is $(1/6.36)^2 = 1/40$. So the spacecraft lingers near apogee about forty times longer per degree of true anomaly than near perigee.
:::

::: check
A probe needs $v_\infty = 5.0\,\mathrm{km/s}$ leaving Earth from a $200\,\mathrm{km}$ circular orbit. Find $C_3$, the perigee speed and the departure $\Delta v$.
:::

::: answer
**$C_3$.** $C_3 = v_\infty^2 = 25.0\,\mathrm{km^2/s^2}$.

**Perigee speed.** At $r = 6578.137\,\mathrm{km}$, $v_{\text{esc}}^2 = 2\mu/r = 121.19\,\mathrm{km^2/s^2}$. Adding in quadrature, $v_p = \sqrt{25.0 + 121.19} = 12.091\,\mathrm{km/s}$.

**Burn.** The circular speed is $7.784\,\mathrm{km/s}$, so $\Delta v = 12.091 - 7.784 = 4.307\,\mathrm{km/s}$.
:::

::: check
On a parabolic orbit about Earth with $r_p = 7000\,\mathrm{km}$, at what true anomaly is the spacecraft at $r = 28\,000\,\mathrm{km}$, and how fast is it moving there?
:::

::: answer
**Semi-latus rectum.** $p = 2r_p = 14\,000\,\mathrm{km}$.

**Angle.** From $r = p/(1 + \cos\nu)$: $\cos\nu = p/r - 1 = 0.5 - 1 = -0.5$, so $\nu = 120^\circ$.

**Speed.** On a parabola the speed is the local escape speed: $\sqrt{2\mu/r} = \sqrt{2 \times 398\,600.4418/28\,000} = 5.336\,\mathrm{km/s}$.
:::

::: check
A hyperbolic flyby has $e = 1.05$. What is its turning angle, and what does that tell you about slow flybys?
:::

::: answer
$\sin(\delta/2) = 1/1.05 = 0.952$, so $\delta/2 = 72.2^\circ$ and $\delta = 144.5^\circ$.

An eccentricity barely above 1 — a slow approach, or a very close pass — bends the path almost back on itself. Slow flybys give large bends. Fast ones ($e \gg 1$, "e much greater than 1") are barely bent. Since $e = 1 + r_p v_\infty^2/\mu$, a mission that wants a big turn must arrive slowly or pass close.
:::

## Summary

| Family | Defining values | Key formulas |
| --- | --- | --- |
| Circle | $e = 0$, $r = a$ | $v_c = \sqrt{\mu/r}$, $T = 2\pi\sqrt{r^3/\mu}$, $\varepsilon = -\mu/(2r)$ |
| Ellipse | $0 < e < 1$, $a > 0$ | $v_p/v_a = (1 + e)/(1 - e)$; $v_p^2 = \dfrac{\mu}{a}\dfrac{1 + e}{1 - e}$ |
| Parabola | $e = 1$, $\varepsilon = 0$ | $v = \sqrt{2\mu/r}$ everywhere; $r = \tfrac{p}{2}\sec^2(\nu/2)$, $r_p = p/2$ |
| Hyperbola | $e > 1$, $a < 0$ | $v_\infty = \sqrt{-\mu/a}$, $C_3 = v_\infty^2$, $v^2 = v_\infty^2 + 2\mu/r$, $e = 1 + r_p v_\infty^2/\mu$, $\sin(\delta/2) = 1/e$, $b = r_p v_p/v_\infty$ |
| Degenerate | $h = 0$ | Radial motion, no orbit plane, angular elements undefined |

The next lesson turns from the shape of the orbit to how it sits in space: the six classical orbital elements, the frame they are measured in, and the equinoctial elements that avoid their weak spots.

::: context speed-dial Six throws from one point
Every orbit below starts at the black dot, $300\,\mathrm{km}$ up, with its velocity pointing up or down the page — sideways to Earth. Only the speed changes. Drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="262" cy="112" r="67.0" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="332.1,112.0 332.0,115.7 331.7,119.3 331.1,122.9 330.3,126.5 329.2,130.0 328.0,133.4 326.5,136.8 324.9,140.0 323.0,143.1 321.0,146.1 318.8,148.9 316.5,151.6 314.0,154.1 311.3,156.4 308.6,158.6 305.8,160.6 302.8,162.4 299.8,164.0 296.7,165.5 293.6,166.8 290.4,167.8 287.3,168.7 284.0,169.4 280.8,170.0 277.6,170.3 274.4,170.5 271.3,170.5 268.1,170.3 265.0,170.0 262.0,169.6 259.0,169.0 256.1,168.2 253.2,167.3 250.5,166.3 247.8,165.1 245.1,163.9 242.6,162.5 240.2,161.0 237.8,159.4 235.6,157.8 233.4,156.0 231.4,154.1 229.4,152.2 227.6,150.2 225.9,148.1 224.2,146.0 222.7,143.8 221.3,141.6 220.0,139.3 218.8,136.9 217.8,134.5 216.8,132.1 216.0,129.7 215.2,127.2 214.6,124.7 214.1,122.2 213.7,119.7 213.4,117.1 213.2,114.6 213.2,112.0 213.2,109.4 213.4,106.9 213.7,104.3 214.1,101.8 214.6,99.3 215.2,96.8 216.0,94.3 216.8,91.9 217.8,89.5 218.8,87.1 220.0,84.7 221.3,82.4 222.7,80.2 224.2,78.0 225.9,75.9 227.6,73.8 229.4,71.8 231.4,69.9 233.4,68.0 235.6,66.2 237.8,64.6 240.2,63.0 242.6,61.5 245.1,60.1 247.8,58.9 250.5,57.7 253.2,56.7 256.1,55.8 259.0,55.0 262.0,54.4 265.0,54.0 268.1,53.7 271.3,53.5 274.4,53.5 277.6,53.7 280.8,54.0 284.0,54.6 287.3,55.3 290.4,56.2 293.6,57.2 296.7,58.5 299.8,60.0 302.8,61.6 305.8,63.4 308.6,65.4 311.3,67.6 314.0,69.9 316.5,72.4 318.8,75.1 321.0,77.9 323.0,80.9 324.9,84.0 326.5,87.2 328.0,90.6 329.2,94.0 330.3,97.5 331.1,101.1 331.7,104.7 332.0,108.3 332.1,112.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="191.9,112.0 192.0,115.7 192.3,119.3 192.7,123.0 193.4,126.6 194.3,130.1 195.3,133.7 196.5,137.1 197.9,140.5 199.5,143.8 201.3,147.1 203.2,150.2 205.3,153.2 207.5,156.1 209.9,158.9 212.4,161.6 215.1,164.1 217.9,166.5 220.8,168.7 223.8,170.8 226.9,172.7 230.2,174.5 233.5,176.1 236.9,177.5 240.3,178.7 243.9,179.7 247.4,180.6 251.0,181.3 254.7,181.7 258.3,182.0 262.0,182.1 265.7,182.0 269.3,181.7 273.0,181.3 276.6,180.6 280.1,179.7 283.7,178.7 287.1,177.5 290.5,176.1 293.8,174.5 297.1,172.7 300.2,170.8 303.2,168.7 306.1,166.5 308.9,164.1 311.6,161.6 314.1,158.9 316.5,156.1 318.7,153.2 320.8,150.2 322.7,147.1 324.5,143.8 326.1,140.5 327.5,137.1 328.7,133.7 329.7,130.1 330.6,126.6 331.3,123.0 331.7,119.3 332.0,115.7 332.1,112.0 332.0,108.3 331.7,104.7 331.3,101.0 330.6,97.4 329.7,93.9 328.7,90.3 327.5,86.9 326.1,83.5 324.5,80.2 322.7,76.9 320.8,73.8 318.7,70.8 316.5,67.9 314.1,65.1 311.6,62.4 308.9,59.9 306.1,57.5 303.2,55.3 300.2,53.2 297.1,51.3 293.8,49.5 290.5,47.9 287.1,46.5 283.7,45.3 280.1,44.3 276.6,43.4 273.0,42.7 269.3,42.3 265.7,42.0 262.0,41.9 258.3,42.0 254.7,42.3 251.0,42.7 247.4,43.4 243.9,44.3 240.3,45.3 236.9,46.5 233.5,47.9 230.2,49.5 226.9,51.3 223.8,53.2 220.8,55.3 217.9,57.5 215.1,59.9 212.4,62.4 209.9,65.1 207.5,67.9 205.3,70.8 203.2,73.8 201.3,76.9 199.5,80.2 197.9,83.5 196.5,86.9 195.3,90.3 194.3,93.9 193.4,97.4 192.7,101.0 192.3,104.7 192.0,108.3 191.9,112.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="114.0,112.0 114.3,119.7 115.2,127.4 116.8,135.0 119.0,142.4 121.7,149.6 125.0,156.5 128.7,163.2 133.0,169.4 137.7,175.4 142.7,180.9 148.1,186.0 153.7,190.7 159.6,194.9 165.7,198.7 172.0,202.0 178.3,204.9 184.8,207.4 191.2,209.4 197.7,211.1 204.1,212.3 210.4,213.2 216.7,213.7 222.9,213.9 228.9,213.7 234.9,213.3 240.6,212.5 246.2,211.5 251.7,210.3 256.9,208.8 262.0,207.2 266.9,205.3 271.6,203.2 276.1,201.0 280.4,198.6 284.5,196.1 288.5,193.5 292.2,190.8 295.8,187.9 299.2,185.0 302.4,181.9 305.4,178.8 308.2,175.6 310.9,172.4 313.4,169.1 315.7,165.7 317.9,162.3 319.9,158.9 321.7,155.4 323.4,151.9 324.9,148.3 326.3,144.8 327.5,141.2 328.6,137.6 329.6,134.0 330.3,130.3 331.0,126.7 331.5,123.0 331.8,119.3 332.0,115.7 332.1,112.0 332.0,108.3 331.8,104.7 331.5,101.0 331.0,97.3 330.3,93.7 329.6,90.0 328.6,86.4 327.5,82.8 326.3,79.2 324.9,75.7 323.4,72.1 321.7,68.6 319.9,65.1 317.9,61.7 315.7,58.3 313.4,54.9 310.9,51.6 308.2,48.4 305.4,45.2 302.4,42.1 299.2,39.0 295.8,36.1 292.2,33.2 288.5,30.5 284.5,27.9 280.4,25.4 276.1,23.0 271.6,20.8 266.9,18.7 262.0,16.8 256.9,15.2 251.7,13.7 246.2,12.5 240.6,11.5 234.9,10.7 228.9,10.3 222.9,10.1 216.7,10.3 210.4,10.8 204.1,11.7 197.7,12.9 191.2,14.6 184.8,16.6 178.3,19.1 172.0,22.0 165.7,25.3 159.6,29.1 153.7,33.3 148.1,38.0 142.7,43.1 137.7,48.6 133.0,54.6 128.7,60.8 125.0,67.5 121.7,74.4 119.0,81.6 116.8,89.0 115.2,96.6 114.3,104.3 114.0,112.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="-18.2,236.8 241.5,241.7 248.8,237.7 255.6,233.6 262.0,229.5 267.9,225.3 273.5,221.1 278.6,216.9 283.4,212.8 287.9,208.6 292.0,204.4 295.9,200.3 299.5,196.2 302.8,192.1 305.9,188.1 308.8,184.0 311.4,180.0 313.9,176.1 316.1,172.1 318.2,168.2 320.1,164.3 321.9,160.5 323.5,156.7 324.9,152.8 326.2,149.1 327.3,145.3 328.4,141.6 329.3,137.8 330.0,134.1 330.7,130.4 331.2,126.7 331.6,123.0 331.9,119.3 332.1,115.7 332.1,112.0 332.1,108.3 331.9,104.7 331.6,101.0 331.2,97.3 330.7,93.6 330.0,89.9 329.3,86.2 328.4,82.4 327.3,78.7 326.2,74.9 324.9,71.2 323.5,67.3 321.9,63.5 320.1,59.7 318.2,55.8 316.1,51.9 313.9,47.9 311.4,44.0 308.8,40.0 305.9,35.9 302.8,31.9 299.5,27.8 295.9,23.7 292.0,19.6 287.9,15.4 283.4,11.2 278.6,7.1 273.5,2.9 267.9,-1.3 262.0,-5.5 255.6,-9.6 248.8,-13.7 241.5,-17.7 233.6,-21.7 -0.9,-21.9 -18.2,-12.8" fill="none" stroke="#8fb8f0" stroke-width="2.5"/>
  <polyline points="270.2,243.8 276.3,237.1 281.9,230.7 286.9,224.6 291.5,218.7 295.7,213.0 299.5,207.6 303.0,202.3 306.2,197.3 309.1,192.3 311.8,187.6 314.2,182.9 316.4,178.4 318.4,174.0 320.3,169.7 321.9,165.5 323.4,161.3 324.8,157.3 326.1,153.3 327.2,149.3 328.1,145.4 329.0,141.6 329.7,137.8 330.4,134.1 330.9,130.3 331.4,126.6 331.7,123.0 331.9,119.3 332.1,115.6 332.1,112.0 332.1,108.4 331.9,104.7 331.7,101.0 331.4,97.4 330.9,93.7 330.4,89.9 329.7,86.2 329.0,82.4 328.1,78.6 327.2,74.7 326.1,70.7 324.8,66.7 323.4,62.7 321.9,58.5 320.3,54.3 318.4,50.0 316.4,45.6 314.2,41.1 311.8,36.4 309.1,31.7 306.2,26.7 303.0,21.7 299.5,16.4 295.7,11.0 291.5,5.3 286.9,-0.6 281.9,-6.7 276.3,-13.1 270.2,-19.8" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <polyline points="289.0,240.3 292.7,234.0 296.1,228.2 299.2,222.6 302.0,217.3 304.6,212.3 307.1,207.4 309.3,202.8 311.3,198.4 313.2,194.1 315.0,190.0 316.6,186.0 318.1,182.2 319.5,178.4 320.8,174.8 322.0,171.3 323.1,167.8 324.2,164.5 325.1,161.2 326.0,158.0 326.8,154.8 327.5,151.8 328.2,148.7 328.8,145.7 329.3,142.8 329.8,139.9 330.3,137.0 330.7,134.1 331.0,131.3 331.3,128.5 331.6,125.7 331.8,123.0 331.9,120.2 332.0,117.5 332.1,114.7 332.1,112.0 332.1,109.3 332.0,106.5 331.9,103.8 331.8,101.0 331.6,98.3 331.3,95.5 331.0,92.7 330.7,89.9 330.3,87.0 329.8,84.1 329.3,81.2 328.8,78.3 328.2,75.3 327.5,72.2 326.8,69.2 326.0,66.0 325.1,62.8 324.2,59.5 323.1,56.2 322.0,52.7 320.8,49.2 319.5,45.6 318.1,41.8 316.6,38.0 315.0,34.0 313.2,29.9 311.3,25.6 309.3,21.2 307.1,16.6 304.6,11.7 302.0,6.7 299.2,1.4 296.1,-4.2 292.7,-10.0 289.0,-16.3 284.9,-22.9" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="332.1" cy="112" r="4" fill="#1f2a44"/>
  <text x="262" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="6" y="20" font-size="11" fill="#1f2a44">speed (km/s) at the dot</text>
  <line x1="6" y1="36" x2="18" y2="36" stroke="#b4232c" stroke-width="3"/><text x="22" y="40" font-size="11" fill="#1f2a44">7.0 hits Earth</text>
  <line x1="6" y1="54" x2="18" y2="54" stroke="#1f2a44" stroke-width="3"/><text x="22" y="58" font-size="11" fill="#1f2a44">7.73 circle</text>
  <line x1="6" y1="72" x2="18" y2="72" stroke="#1d6fd1" stroke-width="3"/><text x="22" y="76" font-size="11" fill="#1f2a44">9.0 ellipse</text>
  <line x1="6" y1="90" x2="18" y2="90" stroke="#8fb8f0" stroke-width="3"/><text x="22" y="94" font-size="11" fill="#1f2a44">10.0 ellipse</text>
  <line x1="6" y1="108" x2="18" y2="108" stroke="#f2b880" stroke-width="3"/><text x="22" y="112" font-size="11" fill="#1f2a44">10.93 parabola</text>
  <line x1="6" y1="126" x2="18" y2="126" stroke="#6c7a93" stroke-width="3"/><text x="22" y="130" font-size="11" fill="#1f2a44">12.0 hyperbola</text>
</svg>
```

Slower than circular and the dot is the high point; the red path dives into Earth. Faster, and the dot becomes the low point while the far side swings out, until at escape speed the path never closes.
:::

::: context flight-path-angle Tilting the velocity
The flight-path angle $\gamma$ is measured from the local horizontal — the direction at right angles to the line from Earth's center. Only the sideways part, $v\cos\gamma$, carries angular momentum.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="345" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="345" y="140" font-size="11" text-anchor="end" fill="#6c7a93">local horizontal</text>
  <line x1="150" y1="120" x2="150" y2="34" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="150,24 145,35 155,35" fill="#6c7a93"/>
  <text x="158" y="34" font-size="11" fill="#6c7a93">straight up, along r</text>
  <line x1="150" y1="120" x2="272.2" y2="120" stroke="#8fb8f0" stroke-width="5"/>
  <line x1="272.2" y1="75.5" x2="272.2" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="150" y1="120" x2="263" y2="78.9" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="272.2,75.5 264.3,83.2 261.2,74.7" fill="#1d6fd1"/>
  <text x="280" y="72" font-size="12" fill="#1d6fd1">v</text>
  <path d="M198,120 A48,48 0 0,0 195.1,103.6" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="204" y="113" font-size="12" fill="#b4232c">γ</text>
  <text x="211" y="140" font-size="11" text-anchor="middle" fill="#1d6fd1">v cos γ</text>
  <circle cx="150" cy="120" r="4" fill="#1f2a44"/>
  <text x="142" y="140" font-size="11" text-anchor="end" fill="#1f2a44">spacecraft</text>
</svg>
```

Positive $\gamma$ means climbing, negative means descending. At an apsis, $\gamma = 0$.
:::

::: context insertion What "insertion" means
Orbit insertion is the moment a rocket's last engine burn ends and the payload is left coasting on its orbit. The guidance targets a speed, an altitude and a flight-path angle for that instant. For a circular orbit the target angle is zero. A small error in the angle at insertion shows up half an orbit later as a lower perigee, which is why insertion accuracy is quoted in fractions of a degree.
:::

::: context gps-orbit Why GPS sits where it does
GPS satellites go around exactly twice per sidereal day, a period of about $11\,\mathrm{h}\,58\,\mathrm{min}$. So each one passes over the same spots on the ground at the same sidereal time every day. The third law then fixes their radius near $26\,560\,\mathrm{km}$, about $20\,200\,\mathrm{km}$ up. At that height each satellite sees a large part of the globe, so a couple of dozen of them cover the whole Earth.
:::

::: context molniya The "lightning" orbit
*Molniya* is Russian for "lightning", the name of Soviet communication satellites first launched in the 1960s. Much of Russia is too far north to see geostationary satellites well. So these satellites fly a long ellipse with apogee high over the northern hemisphere. By Kepler's second law they spend most of each $12$-hour orbit up there, slow and nearly still in the sky. The orbits use an inclination of about $63.4^\circ$, a special value explained later in the course.
:::

::: context near-parabolic Comets from the edge of the solar system
Many comets fall in from very far away, well beyond the planets, where they moved slowly. When they swing past the Sun their eccentricity is often $0.999$ or more. Near the Sun, such an orbit is almost indistinguishable from a parabola, and astronomers often fit a parabola first when a new comet is found. A tiny tug from a planet can then push it slightly above $e = 1$, and it leaves the solar system for good.
:::

::: context universal-seam One formula for every shape
Ellipses use angles like $\cos$ and $\sin$. Hyperbolas use their cousins $\cosh$ and $\sinh$. The parabola sits on the seam between them, and formulas written for one side divide by zero or lose accuracy near $e = 1$. The universal-variable lesson uses special functions, the Stumpff functions, that slide smoothly from one side to the other. One routine then handles all four shapes, which is what flight software wants.
:::

::: context focusing A planet is a bigger target than it looks
The spacecraft below was aimed to miss Earth's center by $b = 15\,529\,\mathrm{km}$. Gravity bent it in to $r_p = 8000\,\mathrm{km}$ and turned it $71^\circ$. Drawn to scale, for the flyby example.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="0" y1="196.2" x2="356" y2="196.2" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="190" cy="100" r="39.5" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="190" cy="100" r="2.5" fill="#1f2a44"/>
  <polyline points="0.7,183.7 28.1,182.2 50.1,180.8 68.1,179.5 83.2,178.1 96.0,176.8 107.2,175.5 116.9,174.2 125.5,172.9 133.2,171.6 140.1,170.4 146.4,169.1 152.1,167.9 157.3,166.6 162.2,165.4 166.7,164.2 170.9,163.0 174.8,161.8 178.6,160.5 182.1,159.3 185.4,158.1 188.5,156.8 191.6,155.5 194.5,154.3 197.2,153.0 199.9,151.7 202.5,150.4 205.0,149.0 207.4,147.7 209.8,146.3 212.1,144.9 214.4,143.4 216.6,141.9 218.8,140.4 221.0,138.8 223.1,137.2 225.2,135.5 227.3,133.8 229.4,132.0 231.5,130.2 233.5,128.2 235.6,126.2 237.7,124.1 239.9,121.9 242.0,119.6 244.2,117.1 246.4,114.6 248.6,111.8 251.0,108.9 253.3,105.8 255.8,102.5 258.3,98.9 260.9,95.0 263.7,90.8 266.5,86.3 269.6,81.3 272.8,75.7 276.2,69.6 279.9,62.8 283.9,55.1 288.3,46.3 293.2,36.2 298.6,24.5 304.9,10.6 312.0,-6.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="190" y1="100" x2="190" y2="196.2" stroke="#b4232c" stroke-width="1.5"/>
  <text x="196" y="188" font-size="12" fill="#b4232c">b = 15 529 km</text>
  <line x1="190" y1="100" x2="218.8" y2="140.4" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="226" y="146" font-size="12" fill="#1f2a44">r_p = 8000 km</text>
  <text x="190" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="354" y="212" font-size="11" text-anchor="end" fill="#6c7a93">aim line (no gravity)</text>
  <text x="6" y="160" font-size="11" fill="#1d6fd1">actual path, v∞ = 6 km/s</text>
  <text x="300" y="60" font-size="11" fill="#1d6fd1">leaves 71°</text>
  <text x="300" y="74" font-size="11" fill="#1d6fd1">off course</text>
</svg>
```

The slower the approach, the stronger this effect. That is why a slow spacecraft can hit a planet even when aimed well to one side.
:::

::: context oberth Why burning fast pays more
Hermann Oberth, one of the founders of rocketry, pointed this out. The energy a burn adds is force times distance traveled during the burn. A fast-moving rocket covers more distance while it burns, so the same propellant adds more energy. The fastest point of an orbit is periapsis, deep in the gravity well. So that is where departure burns go.
:::

::: context gravity-assist Stealing a little of a planet's speed
Seen from the planet, the spacecraft leaves as fast as it came, only turned. But the planet itself is moving around the Sun. Seen from the Sun, the turned velocity adds to the planet's velocity differently, so the spacecraft can leave faster or slower than it arrived. Voyager 2 used Jupiter, Saturn and Uranus this way on its way to Neptune. The maneuvers module works out the numbers.
:::

::: context radial-trajectory Straight up and back down
A sounding rocket is a research rocket fired nearly straight up to take measurements, then falling back — often within a few minutes. Its path is close to the radial "orbit" with $h \approx 0$. Code that computes orbital elements for such a flight must not divide by $h$, or it will return infinities instead of a trajectory.
:::
