---
id: l06-classical-elements
title: The classical orbital elements and equinoctial alternatives
minutes: 19
covers:
  - classical orbital elements and equinoctial alternatives
---

A state vector – three components of position and three of velocity – tells you everything about a two-body orbit and shows you almost nothing. Six numbers that change every second give no feel for the orbit's size, shape or orientation, and comparing two orbits component by component is hopeless. The classical orbital elements are a different set of six numbers carrying the same information: five of them are constant along a two-body orbit and describe its geometry, and one of them says where on the orbit the spacecraft is. They are the language in which orbits are specified, reported, targeted and compared.

You will read elements off a mission requirements document, see them printed in a tracking report, feed them into a propagator, and watch a manoeuvre change them one at a time. You also need to know where they break. The classical set has singularities – orbits for which one or two of the angles are undefined – and those singularities are not exotic: the most common operational orbit, a near-circular one, is one of them. The equinoctial elements exist to fix this, and any orbit-determination or low-thrust-optimisation code you meet will use them or something like them.

This lesson defines the reference frame, the six classical elements and the geometry behind each, builds the perifocal frame and the rotation that connects it to the inertial frame, identifies the singular cases and their standard replacements, and introduces the equinoctial set. The next lesson turns all of this into two algorithms.

## The reference frame

Orbital elements are angles, and angles need a frame. The standard is an Earth-centred inertial (ECI) frame: origin at Earth's centre of mass, fundamental plane the equator, and axes

- $\hat{\mathbf{I}}$ in the equatorial plane toward the vernal equinox – the direction from Earth to the Sun at the moment the Sun crosses the equator northward in March,
- $\hat{\mathbf{K}}$ along Earth's rotation axis toward the north celestial pole,
- $\hat{\mathbf{J}} = \hat{\mathbf{K}} \times \hat{\mathbf{I}}$, completing a right-handed set in the equatorial plane.

Because the equator and equinox move slowly (precession and nutation), a real frame fixes them at an epoch; J2000 and the closely related GCRF are the standard choices, and for everything in this module the differences between them are ignored. In an inertial frame the two-body equation holds as written, which is the whole reason for choosing one: the rotating-frames module showed what extra terms appear otherwise.

## Six numbers for an orbit

The two-body state has six components, so six independent numbers are needed to specify an orbit and the position on it. The classical (Keplerian) elements make the choice below.

**Semi-major axis $a$** – the *size*. Fixes the energy $\varepsilon = -\mu/(2a)$ and the period $T = 2\pi\sqrt{a^3/\mu}$. Positive for an ellipse, negative for a hyperbola; for a parabola it is infinite and the semi-latus rectum $p$ is used instead.

**Eccentricity $e$** – the *shape*. $e = 0$ circular, $0 < e < 1$ elliptical, $e = 1$ parabolic, $e > 1$ hyperbolic. With $a$ it gives the apsides $r_p = a(1 - e)$ and $r_a = a(1 + e)$.

**Inclination $i$** – the *tilt* of the orbit plane relative to the equator, equal to the angle between $\mathbf{h}$ and $\hat{\mathbf{K}}$:

$$
\cos i = \frac{h_z}{h}, \qquad 0 \le i \le 180^\circ .
$$

An orbit with $i < 90^\circ$ is *prograde* – it moves eastward with Earth's rotation – and $h_z > 0$. An orbit with $i > 90^\circ$ is *retrograde*, $h_z < 0$. A polar orbit has $i = 90^\circ$. Inclination is never negative and never exceeds $180^\circ$, so the arccosine gives it without any quadrant check.

**Right ascension of the ascending node $\Omega$** – *where the plane crosses the equator going north*. The orbit plane and the equatorial plane intersect along the *line of nodes*. The point where the spacecraft crosses the equator from south to north is the ascending node, in the direction of the *node vector*

$$
\mathbf{n} = \hat{\mathbf{K}} \times \mathbf{h} = (-h_y,\; h_x,\; 0),
$$

which lies in the equatorial plane, perpendicular to $\mathbf{h}$, and – check with the right-hand rule – on the ascending side. $\Omega$ is the angle from $\hat{\mathbf{I}}$ to $\mathbf{n}$, measured eastward (counter-clockwise seen from the north), $0 \le \Omega < 360^\circ$.

**Argument of periapsis $\omega$** – the *orientation of the ellipse within its plane*: the angle from the node vector $\mathbf{n}$ to the eccentricity vector $\mathbf{e}$, measured in the orbit plane in the direction of motion, $0 \le \omega < 360^\circ$. If $e_z > 0$ the periapsis is north of the equator and $\omega < 180^\circ$; if $e_z < 0$ it is south and $\omega > 180^\circ$.

**True anomaly $\nu$** – the *position along the orbit at the epoch*: the angle from $\mathbf{e}$ to $\mathbf{r}$ in the direction of motion. It is the only element that changes with time on an unperturbed orbit. Many element sets replace it with the mean anomaly $M$ (introduced with Kepler's equation) or with the time of periapsis passage $t_p$; all three carry the same information.

::: key The six classical orbital elements
$a$ size · $e$ shape · $i$ tilt of the plane · $\Omega$ where the plane crosses the equator going north · $\omega$ orientation of the ellipse within the plane · $\nu$ position along the orbit at the epoch.
:::

The three angles $\Omega$, $i$, $\omega$ are a set of Euler angles – a 3-1-3 sequence – that orient the orbit in space; $a$ and $e$ describe the orbit in its own plane; $\nu$ locates the spacecraft. The constants of motion of the earlier lesson map onto them directly: $\mathbf{h}$ gives $i$, $\Omega$ and (through $p = h^2/\mu$) the size; $\mathbf{e}$ gives $e$ and $\omega$; $\varepsilon$ gives $a$.

## The perifocal frame

Within the orbit plane the natural axes are

$$
\hat{\mathbf{P}} = \frac{\mathbf{e}}{e}, \qquad \hat{\mathbf{W}} = \frac{\mathbf{h}}{h}, \qquad \hat{\mathbf{Q}} = \hat{\mathbf{W}} \times \hat{\mathbf{P}} ,
$$

pointing to periapsis, along the orbit normal, and $90^\circ$ ahead of periapsis in the direction of motion. This is the perifocal frame, and in it the orbit is a plane curve with the simplest possible description. Position follows from the orbit equation:

$$
\mathbf{r}_{PQW} = r\cos\nu\,\hat{\mathbf{P}} + r\sin\nu\,\hat{\mathbf{Q}}, \qquad r = \frac{p}{1 + e\cos\nu}.
$$

Velocity follows by differentiation. Using $\dot{r} = (\mu/h)e\sin\nu$ and $r\dot{\nu} = h/r = (\mu/h)(1 + e\cos\nu)$ from the orbit-equation lesson, the $\hat{\mathbf{P}}$ component is

$$
\frac{d}{dt}(r\cos\nu) = \dot{r}\cos\nu - r\dot{\nu}\sin\nu = \frac{\mu}{h}\left[e\sin\nu\cos\nu - (1 + e\cos\nu)\sin\nu\right] = -\frac{\mu}{h}\sin\nu,
$$

and the $\hat{\mathbf{Q}}$ component is

$$
\frac{d}{dt}(r\sin\nu) = \dot{r}\sin\nu + r\dot{\nu}\cos\nu = \frac{\mu}{h}\left[e\sin^2\nu + (1 + e\cos\nu)\cos\nu\right] = \frac{\mu}{h}\left(e + \cos\nu\right).
$$

So

$$
\mathbf{v}_{PQW} = \frac{\mu}{h}\left[-\sin\nu\,\hat{\mathbf{P}} + (e + \cos\nu)\,\hat{\mathbf{Q}}\right], \qquad \frac{\mu}{h} = \sqrt{\frac{\mu}{p}} .
$$

Two features are worth noticing. The velocity's $\hat{\mathbf{Q}}$ component never vanishes on an ellipse ($e + \cos\nu > 0$ when $e < 1$): the spacecraft always moves "forward". And the velocity vector traces a *circle* of radius $\mu/h$ centred at $(0, \mu e/h)$ in the velocity plane – the hodograph of Keplerian motion is a circle, which is a useful check on any propagator.

## From perifocal to inertial

The perifocal frame is reached from the inertial frame by three successive rotations: about $\hat{\mathbf{K}}$ by $\Omega$ (bringing $\hat{\mathbf{I}}$ onto the node line), about the new $x$-axis (the node line) by $i$ (tilting the equator onto the orbit plane), and about the new $z$-axis (now $\hat{\mathbf{W}}$) by $\omega$ (bringing the node line onto $\hat{\mathbf{P}}$). Using the frame-rotation matrices of the rotating-frames module,

$$
\mathbf{R}_1(\theta) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & \sin\theta \\ 0 & -\sin\theta & \cos\theta \end{bmatrix}, \qquad
\mathbf{R}_3(\theta) = \begin{bmatrix} \cos\theta & \sin\theta & 0 \\ -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix},
$$

components transform from inertial to perifocal as $\mathbf{r}_{PQW} = \mathbf{R}_3(\omega)\,\mathbf{R}_1(i)\,\mathbf{R}_3(\Omega)\,\mathbf{r}_{IJK}$. What you usually want is the reverse, and since each matrix is orthogonal its inverse is its transpose, which for these matrices is the same rotation with the negative angle:

$$
\mathbf{r}_{IJK} = \mathbf{Q}\,\mathbf{r}_{PQW}, \qquad \mathbf{Q} = \mathbf{R}_3(-\Omega)\,\mathbf{R}_1(-i)\,\mathbf{R}_3(-\omega) .
$$

Multiplied out, with $c$ and $s$ for cosine and sine,

$$
\mathbf{Q} =
\begin{bmatrix}
c_\Omega c_\omega - s_\Omega s_\omega c_i & -c_\Omega s_\omega - s_\Omega c_\omega c_i & s_\Omega s_i \\
s_\Omega c_\omega + c_\Omega s_\omega c_i & -s_\Omega s_\omega + c_\Omega c_\omega c_i & -c_\Omega s_i \\
s_\omega s_i & c_\omega s_i & c_i
\end{bmatrix}.
$$

The columns of $\mathbf{Q}$ are $\hat{\mathbf{P}}$, $\hat{\mathbf{Q}}$ and $\hat{\mathbf{W}}$ expressed in inertial components – a useful check: the third column is $\hat{\mathbf{h}}$, and its $z$-component is $\cos i$, as it must be. The same matrix rotates velocities, because it is a pure rotation.

::: example A GTO at its southernmost point
A GTO launched from Cape Canaveral has $i = 27^\circ$, $\Omega = 100^\circ$, $\omega = 180^\circ$ (perigee at the descending node, the usual arrangement so that apogee lies on the equator), $a = 24\,396.14\,\mathrm{km}$, $e = 0.7283$. At $\nu = 90^\circ$, $r = p = 11\,455.49\,\mathrm{km}$ and $\mu/h = \sqrt{\mu/p} = 5.8988\,\mathrm{km/s}$, so
$$
\mathbf{r}_{PQW} = (0,\; 11\,455.49,\; 0)\,\mathrm{km}, \qquad
\mathbf{v}_{PQW} = 5.8988\,(-1,\; 0.7283,\; 0) = (-5.8988,\; 4.2962,\; 0)\,\mathrm{km/s}.
$$
With $c_\Omega = -0.17365$, $s_\Omega = 0.98481$, $c_i = 0.89101$, $s_i = 0.45399$, $c_\omega = -1$, $s_\omega = 0$:
$$
\mathbf{Q} =
\begin{bmatrix} 0.17365 & 0.87747 & 0.44709 \\ -0.98481 & 0.15472 & 0.07883 \\ 0 & -0.45399 & 0.89101 \end{bmatrix}.
$$
Position is $11\,455.49$ times the second column: $\mathbf{r}_{IJK} = (10\,051.85,\; 1772.41,\; -5200.68)\,\mathrm{km}$, and $\mathbf{v}_{IJK} = \mathbf{Q}\mathbf{v}_{PQW} = (2.7454,\; 6.4739,\; -1.9504)\,\mathrm{km/s}$. Checks: $\lVert \mathbf{r} \rVert = 11\,455.49\,\mathrm{km}$ and $\lVert \mathbf{v} \rVert = 7.2974\,\mathrm{km/s}$, the perifocal magnitudes; and $z = -r\sin i = -11\,455.49 \times 0.45399 = -5200.7\,\mathrm{km}$, because $90^\circ$ past a perigee at the descending node is the southernmost point of the orbit.
:::

## Where the classical elements fail

Each angle is defined as the angle between two vectors, and an angle between vectors is undefined when one of them vanishes.

- **Circular orbit, $e = 0$.** The eccentricity vector is zero; there is no periapsis, so $\omega$ is undefined and $\nu$, measured from periapsis, is undefined too. Their sum is not: the *argument of latitude* $u = \omega + \nu$, the angle from the ascending node to the spacecraft, is well defined for any inclined orbit. Report $u$.
- **Equatorial orbit, $i = 0$ (or $180^\circ$).** The orbit plane is the equator, there is no line of nodes, $\mathbf{n} = \mathbf{0}$, and $\Omega$ is undefined – and so is $\omega$, measured from the node. Their sum, the *longitude of periapsis* $\varpi = \Omega + \omega$, measured from $\hat{\mathbf{I}}$ to $\mathbf{e}$ directly, is well defined. Report $\varpi$.
- **Circular equatorial orbit.** Both failures at once. Only the *true longitude* $l = \Omega + \omega + \nu$, the angle from $\hat{\mathbf{I}}$ to $\mathbf{r}$, survives. Report $l$.

Near these cases the elements are defined but ill-conditioned. The ISS at $e = 0.0006$ has a perigee, but its direction is set by an $8\,\mathrm{km}$ difference in radius across an orbit of $6800\,\mathrm{km}$; a $100\,\mathrm{m}$ error in the tracked position swings $\omega$ by degrees, while $u = \omega + \nu$ is stable to arc-seconds. Any code that consumes elements must be written for the sums, not the parts, whenever $e$ or $i$ is small.

::: key Singularities of the classical elements
$\omega$ is undefined for $e = 0$ (use the argument of latitude $u = \omega + \nu$); $\Omega$ is undefined for $i = 0$ (use the longitude of periapsis $\varpi = \Omega + \omega$); both fail for a circular equatorial orbit (use the true longitude $l = \Omega + \omega + \nu$). Equinoctial elements remove all of these.
:::

## Equinoctial elements

The cure is to stop using $e$, $\omega$, $i$, $\Omega$ as separate polar-style coordinates (a magnitude and an angle each) and use Cartesian-style pairs instead, which behave smoothly when the magnitude goes to zero. The equinoctial elements are

$$
\begin{aligned}
a, \qquad
P_1 &= e\sin(\omega + \Omega), & P_2 &= e\cos(\omega + \Omega), \\
Q_1 &= \tan\tfrac{i}{2}\,\sin\Omega, & Q_2 &= \tan\tfrac{i}{2}\,\cos\Omega, \qquad
\lambda = M + \omega + \Omega .
\end{aligned}
$$

$(P_2, P_1)$ are the components of the eccentricity vector measured from $\hat{\mathbf{I}}$ in an equinoctial frame: when $e \to 0$ both go smoothly to zero and nothing is undefined. $(Q_2, Q_1)$ encode the orbit plane through $\tan(i/2)$ and $\Omega$: when $i \to 0$ both go to zero. The sixth element is the *mean longitude* $\lambda$, the sum of the three angles with the mean anomaly $M$ in place of $\nu$, which is defined for every orbit. The set is singular only at $i = 180^\circ$, where $\tan(i/2)$ blows up; a "retrograde" variant with $\cot(i/2)$ handles that case. Other authors write the same elements as $(a, h, k, p, q, \lambda)$ – confusingly reusing $h$ and $p$ – or as $(a, a_f, a_g, \chi, \psi, \lambda_M)$; the definitions are identical.

The inverse map is direct:

$$
e = \sqrt{P_1^2 + P_2^2}, \quad \varpi = \omega + \Omega = \operatorname{atan2}(P_1, P_2), \quad
\tan\tfrac{i}{2} = \sqrt{Q_1^2 + Q_2^2}, \quad \Omega = \operatorname{atan2}(Q_1, Q_2),
$$

then $\omega = \varpi - \Omega$ and $M = \lambda - \varpi$. Every operation is smooth except the recovery of the classical angles themselves, which is exactly the step that should fail when they are undefined.

A close cousin, the *modified equinoctial elements* $(p, f, g, h, k, L)$ with $p$ the semi-latus rectum, $f, g$ the eccentricity-vector components, $h, k$ the $\tan(i/2)$ components and $L$ the true longitude, is standard in low-thrust trajectory optimisation because it also handles $e \ge 1$ (through $p$ rather than $a$). When you see six-element vectors in an orbit-determination filter or a continuous-thrust optimiser, expect one of these sets rather than the classical one.

::: example Equinoctial elements of the GTO
For the GTO above take $M = 45^\circ$ at the epoch. Then $\varpi = \Omega + \omega = 100^\circ + 180^\circ = 280^\circ$ and $\tan(i/2) = \tan 13.5^\circ = 0.24008$:
$$
P_1 = 0.7283\sin 280^\circ = -0.7172, \quad P_2 = 0.7283\cos 280^\circ = 0.1265, \quad
Q_1 = 0.24008\sin 100^\circ = 0.2364, \quad Q_2 = 0.24008\cos 100^\circ = -0.0417,
$$
and $\lambda = 45^\circ + 280^\circ = 325^\circ$. Going back: $e = \sqrt{0.7172^2 + 0.1265^2} = 0.7283$; $\varpi = \operatorname{atan2}(-0.7172, 0.1265) = -80^\circ \equiv 280^\circ$; $\tan(i/2) = \sqrt{0.2364^2 + 0.0417^2} = 0.2401$ so $i = 27.0^\circ$; $\Omega = \operatorname{atan2}(0.2364, -0.0417) = 100.0^\circ$; $\omega = 280^\circ - 100^\circ = 180^\circ$; $M = 325^\circ - 280^\circ = 45^\circ$. Now imagine the same orbit circularised at apogee: $e \to 0$, $P_1, P_2 \to 0$, and $\lambda$ carries on as the mean longitude of the spacecraft, while $\omega$ and $M$ separately cease to mean anything.
:::

::: warning Angle ranges and atan2
$\Omega$, $\omega$ and $\nu$ live in $[0, 360^\circ)$ and each requires a quadrant decision; $i$ lives in $[0, 180^\circ]$ and does not. Whenever an angle can exceed $180^\circ$, compute it with a two-argument arctangent (sine-like numerator, cosine-like denominator) rather than an arccosine plus an if-statement; the arccosine also fails when round-off pushes its argument a hair past $\pm 1$. A negative inclination, or one above $180^\circ$, is always a bug.
:::

::: warning Three different longitudes
$u = \omega + \nu$ is the argument of latitude (from the node to the spacecraft). $\varpi = \Omega + \omega$ is the longitude of periapsis (from $\hat{\mathbf{I}}$ to periapsis, a "broken" angle summed across two planes). $l = \Omega + \omega + \nu$ is the true longitude (from $\hat{\mathbf{I}}$ to the spacecraft). None of them is a geographic longitude, and none of them is the mean longitude $\lambda$, which uses $M$ instead of $\nu$.
:::

## Check yourself

::: check
An orbit has $\mathbf{h} = (0,\; -30\,000,\; 51\,962)\,\mathrm{km^2/s}$. Find its inclination and right ascension of the ascending node.
:::

::: answer
$h = \sqrt{30\,000^2 + 51\,962^2} = 60\,000\,\mathrm{km^2/s}$ and $\cos i = 51\,962/60\,000 = 0.8660$, so $i = 30^\circ$, prograde. The node vector is $\mathbf{n} = (-h_y, h_x, 0) = (30\,000, 0, 0)$, along $+\hat{\mathbf{I}}$, so $\Omega = \operatorname{atan2}(0, 30\,000) = 0^\circ$. The ascending node is at the vernal equinox direction.
:::

::: check
Why is $\omega$ undefined for a circular orbit, and what quantity replaces it? Why is that replacement well defined?
:::

::: answer
$\omega$ is the angle from the node vector to the eccentricity vector. For $e = 0$ the eccentricity vector is the zero vector, which has no direction, so the angle does not exist; numerically the formula divides by $e \approx 0$. The argument of latitude $u = \omega + \nu$ is the angle from the node vector to the *position* vector, both of which are nonzero for any inclined orbit, so it is well defined even though neither summand is.
:::

::: check
Which sign of $e_z$ puts $\omega$ in the range $180^\circ$ to $360^\circ$, and why?
:::

::: answer
$e_z < 0$. The periapsis is in the direction of $\mathbf{e}$; if $e_z < 0$ it lies south of the equator. Starting from the ascending node and moving in the direction of motion, the spacecraft spends the first half-orbit ($0$ to $180^\circ$ of argument of latitude) in the northern hemisphere and the second half in the southern. A southern periapsis is therefore more than $180^\circ$ past the ascending node.
:::

::: check
Compute the third column of $\mathbf{Q}$ for $i = 63.4^\circ$, $\Omega = 200^\circ$ and any $\omega$, and interpret it.
:::

::: answer
The third column is $(s_\Omega s_i,\; -c_\Omega s_i,\; c_i) = (\sin 200^\circ \sin 63.4^\circ,\; -\cos 200^\circ \sin 63.4^\circ,\; \cos 63.4^\circ) = (-0.3058,\; 0.8402,\; 0.4478)$. It does not depend on $\omega$, because rotating about $\hat{\mathbf{W}}$ does not move $\hat{\mathbf{W}}$. It is the unit orbit normal $\hat{\mathbf{h}}$ in inertial components; its $z$-component is $\cos i$.
:::

::: check
A near-circular equatorial orbit has $e = 10^{-5}$ and $i = 0.01^\circ$. Which classical elements are numerically meaningless, which equinoctial elements are small, and which single angle still locates the spacecraft?
:::

::: answer
$\Omega$, $\omega$ and $\nu$ are all meaningless: the node vector and eccentricity vector are both nearly zero, so their directions are noise. In the equinoctial set $P_1, P_2 \approx 10^{-5}$ and $Q_1, Q_2 \approx \tan(0.005^\circ) \approx 8.7 \times 10^{-5}$ are small but perfectly well defined. The true longitude $l = \Omega + \omega + \nu$ – the angle from $\hat{\mathbf{I}}$ to $\mathbf{r}$ – locates the spacecraft; its mean-anomaly counterpart is the mean longitude $\lambda$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\hat{\mathbf{I}}, \hat{\mathbf{J}}, \hat{\mathbf{K}}$ | ECI axes: vernal equinox, completing axis, north pole |
| $a, e$ | Size and shape; $\varepsilon = -\mu/(2a)$, $r_p = a(1 - e)$, $r_a = a(1 + e)$ |
| $\cos i = h_z/h$ | Inclination, $0$ to $180^\circ$; prograde below $90^\circ$ |
| $\mathbf{n} = \hat{\mathbf{K}} \times \mathbf{h} = (-h_y, h_x, 0)$ | Node vector, toward the ascending node |
| $\Omega$ | Angle from $\hat{\mathbf{I}}$ to $\mathbf{n}$ in the equatorial plane |
| $\omega$ | Angle from $\mathbf{n}$ to $\mathbf{e}$ in the orbit plane; $e_z < 0$ means $\omega > 180^\circ$ |
| $\nu$ | Angle from $\mathbf{e}$ to $\mathbf{r}$; the time-varying element |
| $\mathbf{r}_{PQW} = (r\cos\nu, r\sin\nu, 0)$, $\mathbf{v}_{PQW} = \sqrt{\mu/p}\,(-\sin\nu, e + \cos\nu, 0)$ | State in the perifocal frame |
| $\mathbf{Q} = \mathbf{R}_3(-\Omega)\mathbf{R}_1(-i)\mathbf{R}_3(-\omega)$ | Perifocal-to-inertial rotation; columns are $\hat{\mathbf{P}}, \hat{\mathbf{Q}}, \hat{\mathbf{W}}$ |
| $u = \omega + \nu$, $\varpi = \Omega + \omega$, $l = \Omega + \omega + \nu$ | Replacements for circular, equatorial, and circular-equatorial orbits |
| $P_1, P_2 = e\sin\varpi, e\cos\varpi$; $Q_1, Q_2 = \tan\frac{i}{2}\sin\Omega, \tan\frac{i}{2}\cos\Omega$; $\lambda = M + \varpi$ | Equinoctial elements, singular only at $i = 180^\circ$ |

The next lesson assembles these definitions into the two conversion algorithms – state vector to elements and back – with every quadrant check and every degenerate case handled explicitly.
