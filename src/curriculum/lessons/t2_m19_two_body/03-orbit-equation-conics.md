---
id: l03-orbit-equation-conics
title: The orbit equation and conic sections
minutes: 17
covers:
  - the orbit equation and conic sections
---

The previous lesson ended with one line of algebra: $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$. This lesson reads that line as geometry. Solved for $r$, it is the polar equation of a conic section with the central body at one focus – Kepler's first law, not as an empirical rule about planets but as a theorem about the inverse-square law. Everything you know about the shape of an orbit – perigee and apogee, the size of a transfer ellipse, the bend of a flyby hyperbola – comes from this one equation and the classical geometry of conics.

For the GNC engineer the orbit equation is the fastest tool there is. Given a perigee and an apogee, it tells you the shape of the orbit in two lines. Given a position on a hyperbolic approach, it tells you how far the trajectory will bend. Given the constants $h$ and $e$ from the last lesson, it tells you the radius and the two velocity components at any true anomaly, without integrating anything.

The lesson derives the orbit equation, shows that it describes an ellipse, parabola or hyperbola according to the value of $e$, works through the geometry of each, and finishes with the velocity components along the orbit.

## From the eccentricity vector to the orbit equation

Take the identity $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$ and write the dot product as $e\,r\cos\nu$, where $\nu$ is the angle between the eccentricity vector and the position vector, measured in the orbit plane in the direction of motion. This angle is the *true anomaly*. Rearranging,

$$
r = \frac{h^2/\mu}{1 + e\cos\nu} = \frac{p}{1 + e\cos\nu}, \qquad p = \frac{h^2}{\mu}.
$$

This is the orbit equation. It gives the distance from the focus as a function of the angular position, with two constants: $p$, which sets the size, and $e$, which sets the shape. Since $\mathbf{e}$ points toward periapsis, $\nu = 0$ is periapsis and $r$ takes its minimum $p/(1 + e)$ there; if $e < 1$, $\nu = 180^\circ$ is apoapsis with the maximum $p/(1 - e)$. At $\nu = \pm 90^\circ$, $r = p$ exactly: the semi-latus rectum is the distance from the focus to the orbit measured perpendicular to the line of apsides. That is its geometric meaning.

::: key The orbit equation
$$
r = \frac{h^2/\mu}{1 + e\cos\nu} = \frac{p}{1 + e\cos\nu}.
$$
Periapsis is at $\nu = 0$ and apoapsis at $\nu = 180^\circ$. The true anomaly $\nu$ is measured from the eccentricity vector, in the direction of motion.
:::

Notice what the equation does *not* contain: time. It is the shape of the path, not a schedule. Where the spacecraft is on the path at a given instant is a separate question, answered by Kepler's equation later in the module.

## Why the orbit is a conic section

A conic section is the set of points whose distance from a fixed point (the focus) is $e$ times their distance from a fixed line (the directrix). The orbit equation has exactly this form – but it is more convincing to convert it to Cartesian coordinates and recognise the curves you already know. Put the focus at the origin, the $x$-axis along $\mathbf{e}$, so that $x = r\cos\nu$ and $y = r\sin\nu$. The orbit equation rearranges to $r = p - e\,r\cos\nu = p - e x$. Square both sides, using $r^2 = x^2 + y^2$:

$$
x^2 + y^2 = p^2 - 2pe\,x + e^2 x^2 \quad\Longrightarrow\quad (1 - e^2)\,x^2 + 2pe\,x + y^2 = p^2.
$$

The coefficient of $x^2$ decides everything.

- If $e < 1$, the coefficient is positive: the curve is an ellipse.
- If $e = 1$, the $x^2$ term vanishes and $y^2 = p^2 - 2px$: a parabola.
- If $e > 1$, the coefficient is negative: a hyperbola.

For $e \neq 1$, complete the square in $x$. Divide by $1 - e^2$ and add $\left(pe/(1 - e^2)\right)^2$ to both sides:

$$
\left(x + \frac{pe}{1 - e^2}\right)^2 + \frac{y^2}{1 - e^2} = \frac{p^2}{1 - e^2} + \frac{p^2 e^2}{(1 - e^2)^2} = \frac{p^2}{(1 - e^2)^2}.
$$

Define the semi-major axis

$$
a = \frac{p}{1 - e^2},
$$

and the equation becomes

$$
\frac{(x + ae)^2}{a^2} + \frac{y^2}{a^2(1 - e^2)} = 1.
$$

For $e < 1$ this is the standard ellipse with centre at $x = -ae$, semi-major axis $a$ along $x$, and semi-minor axis $b = a\sqrt{1 - e^2}$ along $y$. The focus (the central body) sits a distance $c = ae$ from the centre – which is the geometric definition of eccentricity, $e = c/a$, recovered from the dynamics. For $e > 1$, $a$ is negative and $a^2(1 - e^2)$ is negative too, so the $y^2$ term changes sign and the curve is the hyperbola $(x + ae)^2/a^2 - y^2/b^2 = 1$ with $b^2 = a^2(e^2 - 1)$. The single formula $a = p/(1 - e^2)$ therefore serves all three shapes, with the sign of $a$ tracking the sign of the energy.

::: note The focus–directrix reading
The classical definition of a conic is the set of points whose distance from a focus is $e$ times their distance from a fixed line, the directrix. The orbit equation says exactly this. Rearranged, $r = e\,(p/e - r\cos\nu)$, and $p/e - r\cos\nu$ is the horizontal distance from the point $(r\cos\nu,\ r\sin\nu)$ to the vertical line $x = p/e$. So the directrix stands a distance $p/e$ from the focus on the far side from periapsis, and every point of the orbit is $e$ times as far from the focus as from that line. For the GTO worked below, the directrix is $11\,455.5/0.7283 = 15\,729\,\mathrm{km}$ from Earth's centre in the anti-perigee direction. Nothing physical sits there; the reading is useful because it makes the role of $e$ visible. When $e < 1$ the orbit must stay closer to the focus than to the line, which bounds it; when $e > 1$ it can run away from both, which is why the hyperbola is open.
:::

## The ellipse

For a closed orbit the quantities you will use constantly are the apsidal radii. From the orbit equation,

$$
r_p = \frac{p}{1 + e} = a(1 - e), \qquad r_a = \frac{p}{1 - e} = a(1 + e),
$$

where the second forms use $p = a(1 - e^2) = a(1 - e)(1 + e)$. Adding and subtracting,

$$
a = \frac{r_p + r_a}{2}, \qquad e = \frac{r_a - r_p}{r_a + r_p}.
$$

The semi-major axis is the mean of the extreme radii, which is also obvious from the picture: perigee and apogee lie at opposite ends of the major axis of length $2a$, with the focus between them. The eccentricity is the asymmetry of the two radii. Given any two of $\{a, e, r_p, r_a, p\}$ you can find the rest, and mission requirements are almost always stated as a perigee and an apogee altitude.

In guidance code these relations run in both directions many times a second. A launch vehicle's insertion target is typically a perigee radius and an apogee radius; the guidance converts them to $a$ and $e$, then to the energy $-\mu/(2a)$ and angular momentum $\sqrt{\mu a(1 - e^2)}$ it must achieve at cutoff, and steers on those two scalars because they are what the engine can change. Conversely, an onboard navigation solution delivers $a$ and $e$, and the operators want to know the apogee and perigee altitudes – the same formulas, inverted, with $R = 6378.137\,\mathrm{km}$ subtracted.

::: key Apsides from a and e
$$
r_p = a(1 - e), \qquad r_a = a(1 + e), \qquad a = \frac{r_p + r_a}{2}.
$$
Also $e = (r_a - r_p)/(r_a + r_p)$, $p = a(1 - e^2)$ and $b = a\sqrt{1 - e^2}$.
:::

The empty focus lies $2ae$ from the occupied one, along the major axis; nothing physical sits there. The distance from any point of the ellipse to the two foci sums to $2a$, which is the string-and-two-pins construction, but the astrodynamically useful facts are the ones above.

::: example The geometry of a GTO
A geostationary transfer orbit has perigee altitude $250\,\mathrm{km}$ and apogee altitude $35\,786\,\mathrm{km}$. With $R = 6378.137\,\mathrm{km}$, $r_p = 6628.137\,\mathrm{km}$ and $r_a = 42\,164.137\,\mathrm{km}$. Then
$$
a = \frac{6628.137 + 42\,164.137}{2} = 24\,396.14\,\mathrm{km}, \qquad
e = \frac{42\,164.137 - 6628.137}{42\,164.137 + 6628.137} = \frac{35\,536.0}{48\,792.27} = 0.7283.
$$
The semi-latus rectum is $p = a(1 - e^2) = 24\,396.14 \times (1 - 0.53044) = 11\,455.5\,\mathrm{km}$: at $\nu = 90^\circ$ the spacecraft is $11\,455.5\,\mathrm{km}$ from Earth's centre, about $5077\,\mathrm{km}$ up. The semi-minor axis is $b = a\sqrt{1 - e^2} = 24\,396.14 \times 0.68523 = 16\,717.3\,\mathrm{km}$ and the focus sits $c = ae = 17\,768.0\,\mathrm{km}$ from the centre of the ellipse. Radii at a few true anomalies from $r = p/(1 + e\cos\nu)$:

| $\nu$ | $0^\circ$ | $60^\circ$ | $90^\circ$ | $120^\circ$ | $180^\circ$ |
| --- | --- | --- | --- | --- | --- |
| $r$ (km) | $6628.1$ | $8397.5$ | $11\,455.5$ | $18\,016.2$ | $42\,164.1$ |

The radius grows slowly near perigee and fast near apogee – the spacecraft spends most of its time far out, as the time-of-flight lesson quantifies.
:::

## The parabola

At $e = 1$ the orbit equation reads $r = p/(1 + \cos\nu)$. Using $1 + \cos\nu = 2\cos^2(\nu/2)$,

$$
r = \frac{p}{2\cos^2(\nu/2)} = \frac{p}{2}\sec^2\frac{\nu}{2}.
$$

Periapsis is at $r_p = p/2$, and $r \to \infty$ as $\nu \to \pm 180^\circ$: the two arms of the parabola become parallel to the axis, and the spacecraft never returns. There is no apoapsis and $a$ is infinite, so the ellipse formulas involving $a$ are useless here – the parabola is described by $p$ alone. It is the boundary between bound and unbound motion, with $\varepsilon = 0$ exactly, and no real orbit is exactly parabolic; but a trajectory that barely escapes is close to one, and the parabolic formulas are the limit that elliptic and hyperbolic formulas must both approach as $e \to 1$.

## The hyperbola

For $e > 1$ the denominator $1 + e\cos\nu$ reaches zero at

$$
\cos\nu_\infty = -\frac{1}{e},
$$

so the true anomaly is confined to $-\nu_\infty < \nu < \nu_\infty$ with $\nu_\infty$ between $90^\circ$ and $180^\circ$. As $\nu \to \pm\nu_\infty$ the radius goes to infinity along the two asymptotes. The angle between the incoming and outgoing asymptotes is the *turning angle* $\delta$: the asymptotes make angle $\nu_\infty$ with the apse line on either side, and the direction of travel is reversed by $\delta = 2\nu_\infty - 180^\circ$. Taking the sine, $\sin(\delta/2) = \sin(\nu_\infty - 90^\circ) = -\cos\nu_\infty$, so

$$
\sin\frac{\delta}{2} = \frac{1}{e}.
$$

A grazing hyperbola with $e$ just above 1 turns the velocity through nearly $180^\circ$; a very fast flyby with large $e$ is barely deflected.

The semi-major axis $a = p/(1 - e^2)$ is negative. Many results are cleaner in terms of $\lvert a \rvert = p/(e^2 - 1)$, but this module keeps $a$ negative so that one formula – $\varepsilon = -\mu/(2a)$, derived in the next lesson – covers both ellipses and hyperbolas. With that convention the periapsis radius is still $r_p = a(1 - e)$, which is positive because both factors are negative, and equals $\lvert a \rvert(e - 1)$. The semi-minor axis $b = \lvert a \rvert\sqrt{e^2 - 1}$ has a physical role for a flyby: it is the *aiming radius* or impact parameter, the perpendicular distance between the incoming asymptote and the centre of the planet – the miss distance the spacecraft would have had without gravity.

::: example A hyperbolic Earth departure
A spacecraft leaves Earth on a hyperbola with periapsis radius $r_p = 6678\,\mathrm{km}$ ($300\,\mathrm{km}$ altitude) and eccentricity $e = 1.4$. Then
$$
p = r_p(1 + e) = 6678 \times 2.4 = 16\,027.2\,\mathrm{km}, \qquad
a = \frac{p}{1 - e^2} = \frac{16\,027.2}{1 - 1.96} = -16\,695\,\mathrm{km}.
$$
Check: $r_p = a(1 - e) = (-16\,695)(-0.4) = 6678\,\mathrm{km}$. The asymptote lies at $\cos\nu_\infty = -1/1.4$, $\nu_\infty = 135.6^\circ$, and the turning angle is $\delta = 2\sin^{-1}(1/1.4) = 91.2^\circ$. The aiming radius is $b = 16\,695 \times \sqrt{1.96 - 1} = 16\,358\,\mathrm{km}$. Along the way, $h = \sqrt{\mu p} = \sqrt{398\,600.4418 \times 16\,027.2} = 79\,928\,\mathrm{km^2/s}$, so the periapsis speed is $h/r_p = 11.969\,\mathrm{km/s}$. At $\nu = 90^\circ$ the spacecraft is at $r = p = 16\,027\,\mathrm{km}$, and at $\nu = 120^\circ$ it has already reached $r = 16\,027.2/(1 + 1.4\cos 120^\circ) = 53\,424\,\mathrm{km}$, well past geostationary radius.
:::

## Velocity along the orbit

The orbit equation, combined with $h = r^2\dot{\nu}$, gives the velocity at every point without any further integration. Differentiate $r = p/(1 + e\cos\nu)$ with respect to time:

$$
\dot{r} = \frac{p\,e\sin\nu\,\dot{\nu}}{(1 + e\cos\nu)^2} = \frac{r^2}{p}\,e\sin\nu\,\dot{\nu} = \frac{h}{p}\,e\sin\nu,
$$

where $r^2\dot{\nu}$ was replaced by $h$. Since $p = h^2/\mu$, $h/p = \mu/h$, and the radial and transverse velocity components are

$$
v_r = \dot{r} = \frac{\mu}{h}\,e\sin\nu, \qquad v_\perp = r\dot{\nu} = \frac{h}{r} = \frac{\mu}{h}\left(1 + e\cos\nu\right).
$$

Both are proportional to the single speed scale $\mu/h$. The radial component vanishes at both apsides, is positive (climbing) for $0 < \nu < 180^\circ$ and negative (descending) on the return half, and peaks at $\nu = 90^\circ$. The transverse component is largest at periapsis, $(\mu/h)(1 + e)$, and smallest at apoapsis, $(\mu/h)(1 - e)$. Adding the squares,

$$
v^2 = v_r^2 + v_\perp^2 = \frac{\mu^2}{h^2}\left(1 + 2e\cos\nu + e^2\right),
$$

and the flight-path angle $\gamma$ – the angle of the velocity above the local horizontal – satisfies

$$
\tan\gamma = \frac{v_r}{v_\perp} = \frac{e\sin\nu}{1 + e\cos\nu}.
$$

These four formulas are what an onboard guidance routine uses to turn a true anomaly into a velocity vector in the orbit plane.

::: example Speed and flight-path angle around the GTO
For the GTO above, $h = \sqrt{\mu p} = \sqrt{398\,600.4418 \times 11\,455.5} = 67\,573.4\,\mathrm{km^2/s}$ and the speed scale is $\mu/h = 5.8988\,\mathrm{km/s}$. Then, with $e = 0.7283$:

| $\nu$ | $v_r$ (km/s) | $v_\perp$ (km/s) | $v$ (km/s) | $\gamma$ |
| --- | --- | --- | --- | --- |
| $0^\circ$ | $0$ | $10.195$ | $10.195$ | $0^\circ$ |
| $60^\circ$ | $3.721$ | $8.047$ | $8.865$ | $24.8^\circ$ |
| $90^\circ$ | $4.296$ | $5.899$ | $7.297$ | $36.1^\circ$ |
| $120^\circ$ | $3.721$ | $3.751$ | $5.283$ | $44.8^\circ$ |
| $180^\circ$ | $0$ | $1.603$ | $1.603$ | $0^\circ$ |

At $\nu = 90^\circ$ the transverse speed equals $\mu/h$ exactly, as the formula says. The speed falls from $10.2\,\mathrm{km/s}$ at perigee to $1.6\,\mathrm{km/s}$ at apogee – the ratio $v_p/v_a = r_a/r_p = (1 + e)/(1 - e) = 6.36$, which also follows from $h = r_p v_p = r_a v_a$. The flight-path angle peaks past $90^\circ$ of true anomaly, not at it, because $v_\perp$ keeps falling while $v_r$ has only begun to decline.
:::

::: warning The sign convention for a
This module follows the convention in which $a = p/(1 - e^2)$ is negative for a hyperbola, so that $\varepsilon = -\mu/(2a)$ and $r_p = a(1 - e)$ hold for every conic. Some references define $a$ as positive for hyperbolas and write the same results with explicit sign changes: $\varepsilon = +\mu/(2a)$ and $r_p = a(e - 1)$. Neither is wrong, but mixing them produces sign errors. When reading a formula for hyperbolic motion, check the author's convention first.
:::

::: warning ν is measured from periapsis, in the direction of motion
The true anomaly is the angle from the eccentricity vector to the position vector, increasing in the direction the spacecraft moves. It is not measured from the ascending node (that angle is the argument of latitude), nor from any inertial axis. On a hyperbola it never reaches $180^\circ$; asking for the radius at $\nu = 180^\circ$ with $e > 1$ produces a negative number, which is the equation's way of saying the point does not exist.
:::

## Check yourself

::: check
An orbit has $h = 60\,000\,\mathrm{km^2/s}$ and $e = 0.3$ about Earth. Find $p$, $a$, $r_p$ and $r_a$.
:::

::: answer
$p = h^2/\mu = (60\,000)^2/398\,600.4418 = 9031.6\,\mathrm{km}$. $a = p/(1 - e^2) = 9031.6/0.91 = 9924.8\,\mathrm{km}$. $r_p = a(1 - e) = 6947.4\,\mathrm{km}$ (altitude $569\,\mathrm{km}$) and $r_a = a(1 + e) = 12\,902.2\,\mathrm{km}$. Check: $(r_p + r_a)/2 = 9924.8\,\mathrm{km} = a$.
:::

::: check
Why does the coefficient of $x^2$ in $(1 - e^2)x^2 + 2pe\,x + y^2 = p^2$ decide whether the orbit is an ellipse, parabola or hyperbola?
:::

::: answer
The curve's type is fixed by the signs of the quadratic terms. When both $x^2$ and $y^2$ have positive coefficients ($e < 1$), the curve is bounded in every direction – an ellipse. When the $x^2$ term vanishes ($e = 1$), $x$ is a quadratic function of $y$ with no bound on $x$ in one direction – a parabola. When the coefficients have opposite signs ($e > 1$), the curve is unbounded along two asymptotic directions – a hyperbola. Completing the square then identifies $a = p/(1 - e^2)$ and $b^2 = a^2 \lvert 1 - e^2 \rvert$ explicitly.
:::

::: check
A flyby hyperbola has $e = 2.5$. Through what angle does the planet turn the spacecraft's velocity, and what is the true anomaly of the outgoing asymptote?
:::

::: answer
$\sin(\delta/2) = 1/e = 0.4$, so $\delta/2 = 23.58^\circ$ and the turning angle is $\delta = 47.2^\circ$. The asymptote is at $\cos\nu_\infty = -1/e = -0.4$, giving $\nu_\infty = 113.6^\circ$. Check: $2\nu_\infty - 180^\circ = 47.2^\circ = \delta$.
:::

::: check
A satellite in an orbit with $e = 0.2$ is at $\nu = 90^\circ$. What is its flight-path angle, and in which direction is $r$ changing?
:::

::: answer
$\tan\gamma = e\sin\nu/(1 + e\cos\nu) = 0.2 \times 1/(1 + 0) = 0.2$, so $\gamma = 11.3^\circ$ above the local horizontal. Since $v_r = (\mu/h)e\sin\nu > 0$ for $0 < \nu < 180^\circ$, the radius is increasing: the satellite is climbing from periapsis toward apoapsis.
:::

::: check
For the ISS, $a = 6791\,\mathrm{km}$ and $e = 0.0006$. How far apart are perigee and apogee in altitude, and what does that say about using circular-orbit formulas for it?
:::

::: answer
$r_a - r_p = 2ae = 2 \times 6791 \times 0.0006 = 8.1\,\mathrm{km}$. Perigee and apogee altitudes differ by about 8 km on an orbit 6800 km in radius, so $r$ varies by about one part in a thousand and speed by about the same fraction ($v_p/v_a = (1 + e)/(1 - e) = 1.0012$, a spread of about $9\,\mathrm{m/s}$). Circular formulas are accurate to about 0.1 % for the ISS, which is good enough for rough planning and not good enough for rendezvous.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $r = \dfrac{p}{1 + e\cos\nu}$, $p = h^2/\mu$ | Orbit equation; $\nu$ true anomaly from periapsis |
| $(1 - e^2)x^2 + 2pe\,x + y^2 = p^2$ | Cartesian form; the sign of $1 - e^2$ selects ellipse, parabola or hyperbola |
| $a = \dfrac{p}{1 - e^2}$ | Semi-major axis, negative for a hyperbola, infinite for a parabola |
| $r_p = a(1 - e)$, $r_a = a(1 + e)$ | Apsidal radii; $a = (r_p + r_a)/2$, $e = (r_a - r_p)/(r_a + r_p)$ |
| $b = a\sqrt{1 - e^2}$, $c = ae$ | Semi-minor axis and centre-to-focus distance of the ellipse |
| $r = \tfrac{p}{2}\sec^2(\nu/2)$ | Parabola, $r_p = p/2$ |
| $\cos\nu_\infty = -1/e$, $\sin(\delta/2) = 1/e$ | Hyperbola asymptote and turning angle; aiming radius $b = \lvert a \rvert\sqrt{e^2 - 1}$ |
| $v_r = \dfrac{\mu}{h}e\sin\nu$, $v_\perp = \dfrac{\mu}{h}(1 + e\cos\nu)$ | Velocity components; $\tan\gamma = e\sin\nu/(1 + e\cos\nu)$ |

The next lesson adds time to the geometry: Kepler's second and third laws follow from $h = r^2\dot{\nu}$ and the area of the ellipse, and the vis-viva equation ties speed to radius and semi-major axis.
