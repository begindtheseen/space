---
id: l08-conic-sections
title: Conic sections and the shape of orbits
minutes: 17
covers:
  - conic sections in geometric and polar form
---

Drop a satellite into space with any position and any velocity, let only the Earth's gravity act on it, and the path it follows is one of four curves: a circle, an ellipse, a parabola or a hyperbola. There is no fifth possibility. The four are the **conic sections**, so called because each is the curve where a plane cuts a cone, and they were studied by Greek geometers two thousand years before Newton showed that the planets travel on them. Every closed orbit is an ellipse (the circle is the special case), every escape trajectory is a hyperbola (the parabola is the boundary case), and the single number that says which — the eccentricity $e$ — is the same number that measures how far the curve is from being a circle.

For a guidance engineer the conics matter in a specific form. With the centre of attraction at the origin of polar coordinates, every conic is the one-line equation $r = p/(1 + e\cos\nu)$, and that is the orbit equation of the two-body problem. Read it once as geometry, and the whole vocabulary of orbits — periapsis and apoapsis, semi-major axis, true anomaly, escape, the asymptote of a flyby — is already in your hands before any dynamics has been done.

This lesson gives the geometric definitions of the four curves and their Cartesian equations, derives the single polar equation that covers all of them, connects its parameters to the geometric ones, and states how the two-body problem produces it. The derivation of the orbit equation itself belongs to the orbital mechanics track; what you take from here is the ability to recognise and manipulate the shape.

## The four curves as loci

Each conic can be defined as a set of points with a distance property, without reference to a cone.

A **circle** of radius $R$ about a centre $C$ is the set of points at distance $R$ from $C$.

An **ellipse** with foci $F_1$ and $F_2$ is the set of points $P$ for which the sum of distances $|PF_1| + |PF_2|$ is a constant, call it $2a$. Pin two ends of a string of length $2a$ at the foci and trace with a pencil that keeps the string taut; the pencil draws the ellipse. When the foci coincide the ellipse is a circle of radius $a$.

A **parabola** with focus $F$ and directrix line $L$ is the set of points equidistant from $F$ and $L$.

A **hyperbola** with foci $F_1$ and $F_2$ is the set of points for which the *difference* $\big||PF_1| - |PF_2|\big|$ is a constant $2a$. It has two separate branches, one closer to each focus.

### Cartesian equations

Put the centre of an ellipse at the origin with the foci on the $x$ axis at $(\pm c, 0)$. For a point $(x, y)$ the sum-of-distances condition is $\sqrt{(x + c)^2 + y^2} + \sqrt{(x - c)^2 + y^2} = 2a$. Move the second root to the right and square:

$$
(x + c)^2 + y^2 = 4a^2 - 4a\sqrt{(x - c)^2 + y^2} + (x - c)^2 + y^2 .
$$

The $x^2$, $y^2$ and $c^2$ terms cancel, leaving $4cx - 4a^2 = -4a\sqrt{(x - c)^2 + y^2}$, or $a\sqrt{(x - c)^2 + y^2} = a^2 - cx$. Square again: $a^2(x^2 - 2cx + c^2 + y^2) = a^4 - 2a^2cx + c^2x^2$, and the $cx$ terms cancel to leave $(a^2 - c^2)x^2 + a^2y^2 = a^2(a^2 - c^2)$. With $b^2 = a^2 - c^2$ and division by $a^2b^2$,

$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 .
$$

Here $a$ is the **semi-major axis** (half the long diameter), $b$ the **semi-minor axis**, and $c = \sqrt{a^2 - b^2}$ the distance from centre to each focus. The **eccentricity** is $e = c/a$, between 0 (circle) and 1 (the foci at the ends of the major axis, and the ellipse collapsed to a line). The vertex nearest a focus is at distance $a - c = a(1 - e)$ from it; the far vertex is at $a + c = a(1 + e)$.

The same algebra with a difference of distances gives the hyperbola centred at the origin,

$$
\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1, \qquad c^2 = a^2 + b^2, \qquad e = \frac{c}{a} > 1 ,
$$

with vertices at $(\pm a, 0)$ and foci at $(\pm c, 0)$, now outside the vertices. For large $|x|$ the 1 on the right is negligible and $y \approx \pm(b/a)x$: the branches approach the two **asymptotes** through the centre with slopes $\pm b/a$. The parabola with focus at $(q, 0)$ and directrix $x = -q$ is $y^2 = 4qx$, from squaring $\sqrt{(x - q)^2 + y^2} = x + q$.

These centred forms are what you meet in analytic geometry. Orbits are not described this way, because the body being orbited sits at a *focus*, not at the centre, and a satellite's position is naturally measured from there.

## One equation for all four: the polar form

Every conic can be defined by a single rule that contains the eccentricity explicitly. Fix a point $F$ (the focus) and a line $L$ (the directrix) not through it, and a positive constant $e$. The conic is the set of points $P$ whose distance to $F$ is $e$ times their distance to $L$:

$$
|PF| = e \cdot \operatorname{dist}(P, L) .
$$

For $e = 1$ this is the parabola's definition. For $e < 1$ it produces an ellipse and for $e > 1$ a hyperbola, as the derivation below makes plain; the circle is the limit $e \to 0$ with the directrix receding to infinity.

Put the focus at the origin of polar coordinates $(r, \nu)$ and the directrix as the vertical line $x = D$ to its right, at distance $D > 0$. A point at $(r, \nu)$ has $x = r\cos\nu$, so its distance to the directrix is $D - r\cos\nu$ (for points on the focus side of the line). The rule reads $r = e(D - r\cos\nu)$; collect the $r$ terms:

$$
r(1 + e\cos\nu) = eD \quad\Longrightarrow\quad r = \frac{p}{1 + e\cos\nu}, \qquad p = eD .
$$

The constant $p$ is the **semi-latus rectum**: it is the value of $r$ at $\nu = \pm 90^\circ$, the half-width of the conic measured through the focus perpendicular to the axis. The angle $\nu$ is measured from the direction of closest approach — at $\nu = 0$ the denominator is largest and $r$ smallest.

::: key Polar form of a conic and of the two-body orbit
$r = \dfrac{p}{1 + e\cos\nu}$, with $p$ the semi-latus rectum and $\nu$ the angle from periapsis. For a two-body orbit $p = h^2/\mu$, where $h$ is the specific angular momentum, and $\nu$ is the true anomaly.
:::

Now read the equation for each $e$:

- $e = 0$: $r = p$ for every $\nu$. A circle of radius $p$.
- $0 < e < 1$: the denominator stays between $1 - e$ and $1 + e$, both positive, so $r$ is finite for every $\nu$ and the curve closes. An ellipse, with $r$ ranging from $p/(1 + e)$ at $\nu = 0$ to $p/(1 - e)$ at $\nu = 180^\circ$.
- $e = 1$: the denominator $1 + \cos\nu$ is positive except at $\nu = 180^\circ$, where it is zero and $r \to \infty$. A parabola: open, but only barely — the curve reaches infinity in the direction exactly opposite periapsis.
- $e > 1$: the denominator reaches zero at the finite angle $\nu_\infty = \arccos(-1/e)$, less than $180^\circ$, and would be negative beyond it. Only $|\nu| < \nu_\infty$ describes the curve; $r \to \infty$ as $\nu \to \pm\nu_\infty$, along the two asymptotes. A hyperbola.

::: key Classifying a conic by eccentricity
$e = 0$ circle; $0 < e < 1$ ellipse; $e = 1$ parabola, the escape case with zero energy; $e > 1$ hyperbola, with positive energy. For $e \ge 1$ the radius is finite only where $1 + e\cos\nu > 0$.
:::

::: warning The denominator is a physical boundary
For $e \ge 1$, code that evaluates $p/(1 + e\cos\nu)$ for every $\nu$ from $0$ to $2\pi$ produces negative radii and a spurious second curve on the far side of the focus. Those points are not on the trajectory. Sweep only $|\nu| < \arccos(-1/e)$, and treat a non-positive denominator as an error rather than a number.
:::

### Connecting the polar and geometric parameters

For an ellipse the closest and farthest points, **periapsis** and **apoapsis** (perigee and apogee about the Earth), lie on the axis at $\nu = 0$ and $\nu = 180^\circ$:

$$
r_p = \frac{p}{1 + e}, \qquad r_a = \frac{p}{1 - e} .
$$

Their sum is the major axis, $2a = r_p + r_a = \dfrac{p(1 - e) + p(1 + e)}{1 - e^2} = \dfrac{2p}{1 - e^2}$, so

$$
p = a(1 - e^2), \qquad r_p = a(1 - e), \qquad r_a = a(1 + e), \qquad e = \frac{r_a - r_p}{r_a + r_p} .
$$

The last is the working formula: measure the two extreme radii of an orbit and you have its eccentricity. The semi-minor axis is $b = a\sqrt{1 - e^2} = \sqrt{ap}$, the centre is a distance $c = ae$ from the focus along the axis, and the directrix lies at $D = p/e$ from the focus. For the hyperbola with the analytic-geometry convention $a > 0$, the same steps give $p = a(e^2 - 1)$, $r_p = a(e - 1)$ and no apoapsis; astrodynamics texts often keep $p = a(1 - e^2)$ for all conics by making $a$ negative for hyperbolas, which is a convention to be aware of when you read one.

::: example A geostationary transfer orbit
A launcher releases a satellite into a transfer orbit with perigee altitude 185 km and apogee altitude 35 786 km. With $R_E = 6378.1$ km, $r_p = 6563.1$ km and $r_a = 42\,164.1$ km. Then

$$
a = \frac{r_p + r_a}{2} = 24\,363.6\ \mathrm{km}, \qquad e = \frac{42\,164.1 - 6563.1}{42\,164.1 + 6563.1} = 0.7306, \qquad p = a(1 - e^2) = 11\,358\ \mathrm{km} .
$$

Check the polar equation at the ends: $p/(1 + e) = 11\,358/1.7306 = 6563$ km and $p/(1 - e) = 11\,358/0.2694 = 42\,164$ km. Elsewhere, $r(60^\circ) = 11\,358/(1 + 0.7306 \times 0.5) = 8319$ km, $r(90^\circ) = p = 11\,358$ km and $r(120^\circ) = 11\,358/(1 - 0.3653) = 17\,896$ km. The satellite spends most of its 10.5-hour period far from perigee: between $\nu = 60^\circ$ and $\nu = 120^\circ$ the radius more than doubles, while in the same span of true anomaly on the other side of perigee it barely moves in distance. The semi-minor axis is $b = a\sqrt{1 - e^2} = 16\,635$ km and the Earth's centre sits $c = ae = 17\,800$ km from the centre of the ellipse — off-centre by most of a semi-minor axis, which is what a $0.73$ eccentricity looks like.
:::

## Why orbits are conics

Newton's law of gravitation, applied to a small body moving about a large one, leads to the conclusion that the body's distance from the attracting centre obeys

$$
r = \frac{h^2/\mu}{1 + e\cos\nu} ,
$$

where $\mu$ is the gravitational parameter of the central body ($3.986 \times 10^{14}\ \mathrm{m^3/s^2}$ for the Earth) and $h$ is the **specific angular momentum**, the magnitude of the cross product of position and velocity, $|\mathbf{r} \times \mathbf{v}|$, which is constant along the orbit. Comparing with the polar form, the orbit is a conic with the attracting centre at a focus, semi-latus rectum $p = h^2/\mu$, and the angle $\nu$ — now called the **true anomaly** — measured from periapsis. The two-body module derives this; here are two checks that it hangs together.

For a circular orbit the velocity is perpendicular to the radius, so $h = rv$, and the speed satisfies $v^2 = \mu/r$ (gravity supplies exactly the centripetal acceleration). Then $p = h^2/\mu = r^2v^2/\mu = r^2(\mu/r)/\mu = r$, and the polar form with $e = 0$ says $r = p = r$. Consistent. At 7000 km radius the circular speed is $\sqrt{3.986 \times 10^{14}/7 \times 10^6} = 7546$ m/s.

For the GTO of the example, $h = \sqrt{\mu p} = \sqrt{3.986 \times 10^{14} \times 1.1358 \times 10^7} = 6.729 \times 10^{10}\ \mathrm{m^2/s}$. At perigee, where velocity is again perpendicular to radius, $v_p = h/r_p = 6.729 \times 10^{10}/6.5631 \times 10^6 = 10\,252$ m/s; at apogee $v_a = h/r_a = 1596$ m/s. The satellite is six times faster at perigee than at apogee, a direct consequence of $h$ being constant while $r$ changes by a factor of six.

### Eccentricity and energy

The specific mechanical energy of the orbit, $\varepsilon = v^2/2 - \mu/r$, is also constant, and the two-body analysis relates it to the geometry by

$$
\varepsilon = -\frac{\mu}{2a}, \qquad e^2 = 1 + \frac{2\varepsilon h^2}{\mu^2} .
$$

Test on the circle: $\varepsilon = \mu/2r - \mu/r = -\mu/2r$ and $h^2 = \mu r$, so $e^2 = 1 + 2(-\mu/2r)(\mu r)/\mu^2 = 1 - 1 = 0$. Consistent again. For the GTO, $\varepsilon = -3.986 \times 10^{14}/(2 \times 2.43636 \times 10^7) = -8.18 \times 10^6\ \mathrm{J/kg}$, and $1 + 2\varepsilon h^2/\mu^2 = 0.5338 = 0.7306^2$.

The energy relation is what gives the classification by $e$ its physical meaning. Bound orbits have negative energy: the body cannot reach infinity, where the potential is zero, because its kinetic energy would have to be negative. Negative $\varepsilon$ means positive $a$ and $e < 1$: an ellipse. As $\varepsilon$ rises toward zero, $a \to \infty$ and $e \to 1$: the ellipse stretches without bound and becomes a parabola, on which the body reaches infinity with exactly zero speed. That is the **escape** condition, and the speed that achieves it from radius $r$ is $\sqrt{2\mu/r}$ — $\sqrt 2$ times circular speed, 10 672 m/s at 7000 km. Any more energy and $\varepsilon > 0$, $e > 1$: a hyperbola, along which the body arrives at infinity still moving, with $v_\infty = \sqrt{2\varepsilon}$, on the asymptote at angle $\nu_\infty = \arccos(-1/e)$ from periapsis.

::: example A hyperbolic flyby
A probe passes a planet on a hyperbola with $e = 1.5$ and $p = 7000$ km. Its closest approach is $r_p = p/(1 + e) = 2800$ km, and the asymptote lies at $\nu_\infty = \arccos(-1/1.5) = \arccos(-0.6667) = 131.8^\circ$. Tabulating the polar equation:

| $\nu$ | $1 + e\cos\nu$ | $r$ (km) |
| --- | --- | --- |
| $0^\circ$ | 2.500 | 2 800 |
| $90^\circ$ | 1.000 | 7 000 |
| $120^\circ$ | 0.250 | 28 000 |
| $130^\circ$ | 0.0358 | 195 400 |
| $131^\circ$ | 0.0159 | 439 900 |
| $131.8^\circ$ | 0 | $\infty$ |

Between $130^\circ$ and $131^\circ$ the radius more than doubles; the probe is departing along the asymptote. The incoming and outgoing asymptotes are symmetric about the periapsis direction, so the probe's direction of travel turns through $\delta = 2\nu_\infty - 180^\circ = 83.6^\circ$; equivalently $\sin(\delta/2) = -\cos\nu_\infty = 1/e$, so a flyby's turning angle is fixed by its eccentricity alone. The analytic-geometry parameters are $a = p/(e^2 - 1) = 5600$ km and $c = ae = 8400$ km: the planet sits 8400 km from the hyperbola's centre and 2800 km inside its vertex.
:::

## Sweeping the eccentricity

Hold $p$ fixed and increase $e$ from 0. The circle of radius $p$ develops a near side and a far side; the periapsis $p/(1 + e)$ creeps in toward the focus while the apoapsis $p/(1 - e)$ runs away. At $e = 1$ the far side has reached infinity and the curve is a parabola through the same periapsis $p/2$ and the same points $(\nu = \pm 90^\circ, r = p)$. Beyond $e = 1$ the far side is gone; the curve is a hyperbola whose asymptotes close in from $180^\circ$ toward $90^\circ$ as $e$ grows, so that a very eccentric hyperbola is nearly a straight line past the focus, deflected only slightly. Because $p$ is the same for all of them, every curve in the family passes through the two points at $\nu = \pm 90^\circ$ — a useful fact for checking a plot.

Physically, holding $p = h^2/\mu$ fixed means holding the angular momentum fixed and adding energy. Adding energy to a circular orbit at its current position raises the far side of the orbit; keep adding and the far side opens to infinity; beyond that the body escapes and the excess appears as $v_\infty$. That is the whole story of the quiz question about what happens as $e$ passes through 1, and of the module's second coding exercise, which asks you to draw the family.

::: note Real orbits and the two-body idealisation
Real satellites feel the Earth's oblateness, atmospheric drag, the Moon and the Sun, so their paths are not exactly conics. But over a fraction of an orbit the conic is an excellent description, and the standard way to describe any orbit at an instant is by the conic it would follow if the perturbations stopped: the **osculating** ellipse. The elements you will meet later — $a$, $e$, inclination and the rest — are this lesson's geometry plus three angles that orient the plane in space.
:::

## Check yourself

::: check
An ellipse has semi-major axis 5 and semi-minor axis 3. Find its eccentricity, its semi-latus rectum, and the nearest and farthest distances from a focus.
:::

::: answer
$c = \sqrt{25 - 9} = 4$, so $e = c/a = 0.8$. $p = a(1 - e^2) = 5 \times 0.36 = 1.8$, which is also $b^2/a = 9/5$. Nearest distance $a(1 - e) = 1$; farthest $a(1 + e) = 9$. Check with the polar form: $p/(1 + e) = 1.8/1.8 = 1$ and $p/(1 - e) = 1.8/0.2 = 9$.
:::

::: check
A tracking station measures a satellite's radius as 6600 km at periapsis and 8000 km when its true anomaly is $90^\circ$. Find $e$, the apoapsis radius and the semi-major axis.
:::

::: answer
At $\nu = 90^\circ$ the radius is $p$, so $p = 8000$ km. At periapsis $r_p = p/(1 + e)$, so $1 + e = 8000/6600 = 1.2121$ and $e = 0.2121$. Apoapsis $r_a = p/(1 - e) = 8000/0.7879 = 10\,154$ km. Semi-major axis $a = (r_p + r_a)/2 = 8377$ km; check $p = a(1 - e^2) = 8377 \times 0.9550 = 8000$ km.
:::

::: check
For the hyperbola $x^2/9 - y^2/16 = 1$, find the eccentricity, the angle of the asymptotes to the $x$ axis, the semi-latus rectum, and the true anomaly of the asymptote in the focus-centred polar form.
:::

::: answer
$a = 3$, $b = 4$, $c = \sqrt{9 + 16} = 5$, so $e = 5/3 = 1.667$. The asymptotes have slopes $\pm b/a = \pm 4/3$, at $\arctan(4/3) = 53.13^\circ$ to the axis. $p = a(e^2 - 1) = 3 \times 16/9 = 16/3 = 5.333$ (also $b^2/a$). $\nu_\infty = \arccos(-1/e) = \arccos(-0.6) = 126.87^\circ$. The two angles are supplementary, as they must be: the asymptote makes $53.13^\circ$ with the axis at the centre, and the direction from the focus to a point far along it is $180^\circ - 53.13^\circ$.
:::

::: check
The Earth's orbit has $e = 0.0167$ and $a = 1.496 \times 10^8$ km. How much closer to the Sun is the Earth at perihelion than at aphelion, in kilometres and as a ratio?
:::

::: answer
Perihelion $a(1 - e) = 1.471 \times 10^8$ km, aphelion $a(1 + e) = 1.521 \times 10^8$ km; the difference is $2ae = 5.00 \times 10^6$ km and the ratio is $(1 + e)/(1 - e) = 1.034$. A 3.4% change in distance changes the sunlight received by about 7%, since it goes as $1/r^2$ — not the cause of the seasons, but a real term in a spacecraft's thermal and power budget.
:::

::: check
A spacecraft on an escape trajectory has $e = 2$. Through what angle does a flyby turn its velocity, and over what range of true anomaly is the polar equation valid?
:::

::: answer
$\nu_\infty = \arccos(-1/2) = 120^\circ$, so the equation is valid for $-120^\circ < \nu < 120^\circ$; outside that range the denominator is zero or negative and no point of the trajectory exists. The turning angle is $\delta = 2\nu_\infty - 180^\circ = 60^\circ$, or from $\sin(\delta/2) = 1/e = 0.5$, $\delta/2 = 30^\circ$. A larger $e$ means a straighter path and a smaller turn: at $e = 1.2$ the turn is $112.9^\circ$, at $e = 2$ it is $60^\circ$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Ellipse: $\lvert PF_1\rvert + \lvert PF_2\rvert = 2a$ | Locus definition; $x^2/a^2 + y^2/b^2 = 1$ centred, $c^2 = a^2 - b^2$ |
| Hyperbola: $\big\lvert\,\lvert PF_1\rvert - \lvert PF_2\rvert\,\big\rvert = 2a$ | $x^2/a^2 - y^2/b^2 = 1$, $c^2 = a^2 + b^2$, asymptotes $y = \pm(b/a)x$ |
| Parabola | Equidistant from focus and directrix; $y^2 = 4qx$ |
| $e = c/a$ | Eccentricity; $\lvert PF\rvert = e\cdot\operatorname{dist}(P, L)$ defines every conic |
| $r = p/(1 + e\cos\nu)$ | Polar form, focus at origin, $\nu$ from periapsis; $p = eD$ |
| $e = 0$ / $0 < e < 1$ / $e = 1$ / $e > 1$ | Circle / ellipse / parabola (escape, $\varepsilon = 0$) / hyperbola ($\varepsilon > 0$) |
| $r_p = p/(1+e) = a(1-e)$, $r_a = p/(1-e) = a(1+e)$ | Periapsis and apoapsis |
| $p = a(1 - e^2)$, $e = (r_a - r_p)/(r_a + r_p)$ | Ellipse parameters from radii |
| $\nu_\infty = \arccos(-1/e)$, $\sin(\delta/2) = 1/e$ | Hyperbola asymptote and turning angle |
| $p = h^2/\mu$ | Two-body orbit; $h = \lvert\mathbf{r}\times\mathbf{v}\rvert$ constant |
| $\varepsilon = -\mu/2a$, $e^2 = 1 + 2\varepsilon h^2/\mu^2$ | Energy fixes $a$; with $h$ it fixes $e$ |
| $v_{\mathrm{esc}} = \sqrt{2\mu/r}$ | Parabolic (escape) speed, $\sqrt 2$ times circular |

The final lesson of the module turns to complex numbers. The rotation matrix of lesson 4, the polar coordinates of lesson 7 and the identities that made both work all collapse into a single multiplication once a direction is written as $e^{i\theta}$.
