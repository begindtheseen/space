---
id: l06-classical-elements
title: The classical orbital elements and equinoctial alternatives
minutes: 19
covers:
  - classical orbital elements and equinoctial alternatives
---

Imagine describing a racetrack to a friend. You could read out the GPS coordinates of one car and its speed in three directions. That is complete — from it you could work out everything — but it tells your friend nothing she can picture. Or you could say: "It's an oval about two kilometers long, tilted up on a hillside, with the tight curve at the north end, and the car is a little past that curve." Same information, but now she can *see* it.

A **state vector** is the first kind of description: three numbers for position and three for velocity. It tells you everything about a two-body orbit and shows you almost nothing. Six numbers that change every second give no feel for the orbit's size, shape or tilt. Comparing two orbits number by number is hopeless.

The **classical orbital elements** are the second kind. They are a different set of six numbers carrying the same information. Five of them stay constant along a two-body orbit and describe its geometry. The sixth says where on the orbit the spacecraft is.

They are the language of orbits. You will read elements in a mission requirements document, see them printed in a tracking report, feed them to a propagator, and watch a maneuver change them one at a time.

You also need to know where they break. The classical set has **singularities** — orbits for which one or two of the angles have no value at all. These are not rare, exotic cases. The most common working orbit there is, a nearly circular one, is one of them. The **equinoctial elements** exist to fix this, and orbit-determination or low-thrust software you meet will use them or something like them.

This lesson sets up the reference frame, defines the six elements and the geometry behind each, builds the orbit's own frame and the rotation that links it to the inertial frame, names the weak spots and their standard fixes, and introduces the equinoctial set. The next lesson turns all of this into two algorithms.

## The reference frame

Orbital elements are mostly angles, and an angle needs something to be measured from. The standard choice is an **Earth-centered inertial (ECI)** frame. "Inertial" means it does not spin with the Earth. Its origin is Earth's center of mass, its base plane is the equator, and its three axes are:

- $\hat{\mathbf{I}}$ ("I hat"; the hat marks a unit vector, length 1), in the equatorial plane, pointing toward the **[[vernal equinox|vernal-equinox]]** — the direction from Earth to the Sun at the moment in March when the Sun crosses the equator heading north;
- $\hat{\mathbf{K}}$, along Earth's spin axis, toward the north celestial pole;
- $\hat{\mathbf{J}} = \hat{\mathbf{K}} \times \hat{\mathbf{I}}$, in the equatorial plane, completing a right-handed set.

The equator and the equinox drift very slowly (precession and nutation — slow wobbles of Earth's axis). So a real frame freezes them at one moment, called an **epoch**. [[J2000|j2000]] and the nearly identical GCRF are the standard choices. For everything in this module the differences between them are ignored.

Why inertial? Because the two-body equation holds exactly as written only in an inertial frame. The rotating-frames module showed what extra terms appear otherwise.

## Six numbers for an orbit

The state has six components, so it takes six independent numbers to pin down an orbit and the spacecraft's place on it. The classical (Keplerian) elements are these six.

### Size and shape

**Semi-major axis $a$** — the *size*. It fixes the energy, $\varepsilon = -\mu/(2a)$, and the period, $T = 2\pi\sqrt{a^3/\mu}$. It is positive for an ellipse and negative for a hyperbola. For a parabola it is infinite, so the semi-latus rectum $p$ is used instead.

**Eccentricity $e$** — the *shape*. $e = 0$ is a circle, $0 < e < 1$ an ellipse, $e = 1$ a parabola, $e > 1$ a hyperbola. Together with $a$ it gives the closest and farthest distances, $r_p = a(1 - e)$ and $r_a = a(1 + e)$.

### The tilt of the plane

**Inclination $i$** — the *tilt* of the orbit plane relative to the equator. Picture a hula hoop around a ball, tipped at an angle. The tilt of the hoop against the ball's equator is $i$.

The cleanest way to measure it uses the angular momentum vector $\mathbf{h}$, which sticks straight out of the orbit plane. The **[[inclination|tilt-picture]]** is the angle between $\mathbf{h}$ and $\hat{\mathbf{K}}$:

$$
\cos i = \frac{h_z}{h}, \qquad 0 \le i \le 180^\circ .
$$

Here $h_z$ is the north component of $\mathbf{h}$ and $h$ is its length.

- If $i < 90^\circ$, the orbit is **prograde**: it moves eastward, the same way Earth spins, and $h_z > 0$.
- If $i > 90^\circ$, it is **[[retrograde|retrograde]]**: it moves westward, and $h_z < 0$.
- If $i = 90^\circ$, it is a **polar** orbit.

Inclination is never negative and never more than $180^\circ$. The arccosine returns exactly that range, so no quadrant check is needed.

### Where the plane crosses the equator

**Right ascension of the ascending node $\Omega$** (capital "omega") — *where the plane crosses the equator going north*.

The tilted orbit plane cuts the equatorial plane along a straight line, the **line of nodes**. The spacecraft crosses the equator twice per orbit. The crossing from south to north is the **ascending node**. It lies in the direction of the **node vector**

$$
\mathbf{n} = \hat{\mathbf{K}} \times \mathbf{h} = (-h_y,\; h_x,\; 0).
$$

This vector lies in the equatorial plane (its $z$-part is zero), at right angles to $\mathbf{h}$. Check with the right-hand rule and you will find it points to the ascending side.

$\Omega$ is the angle from $\hat{\mathbf{I}}$ to $\mathbf{n}$, measured eastward (counterclockwise seen from the north), with $0 \le \Omega < 360^\circ$.

### Where the ellipse points within its plane

**Argument of periapsis $\omega$** (small "omega") — the *orientation of the ellipse within its plane*. It is the angle from the node vector $\mathbf{n}$ to the eccentricity vector $\mathbf{e}$, which points at periapsis. It is measured in the orbit plane, in the direction of motion, with $0 \le \omega < 360^\circ$.

The quadrant comes from the sign of $e_z$. If $e_z > 0$, periapsis is north of the equator and $\omega < 180^\circ$. If $e_z < 0$, it is south and $\omega > 180^\circ$.

### Where the spacecraft is

**True anomaly $\nu$** — the *position along the orbit at the epoch*. It is the angle from $\mathbf{e}$ to $\mathbf{r}$, in the direction of motion. The [[three in-plane angles|in-plane-angles]] $\omega$, $\nu$ and their sum all start from a different line, so it is worth keeping a picture in mind.

$\nu$ is the only element that changes with time on an undisturbed orbit. Many element sets swap it for the mean anomaly $M$ (coming with Kepler's equation) or for the time of periapsis passage $t_p$. All three carry the same information.

::: key The six classical orbital elements
$a$ size · $e$ shape · $i$ tilt of the plane · $\Omega$ where the plane crosses the equator going north · $\omega$ orientation of the ellipse within the plane · $\nu$ position along the orbit at the epoch.
:::

The three angles $\Omega$, $i$, $\omega$ form a set of **[[Euler angles — a 3-1-3 sequence|euler-313]]** that turns the orbit into place in space. $a$ and $e$ describe the orbit inside its own plane. $\nu$ locates the spacecraft.

The constants of motion from the earlier lesson line up with them directly:

- $\mathbf{h}$ gives $i$, $\Omega$ and (through $p = h^2/\mu$) the size;
- $\mathbf{e}$ gives $e$ and $\omega$;
- $\varepsilon$ gives $a$.

## The perifocal frame

Inside the orbit plane, the most natural axes are:

$$
\hat{\mathbf{P}} = \frac{\mathbf{e}}{e}, \qquad \hat{\mathbf{W}} = \frac{\mathbf{h}}{h}, \qquad \hat{\mathbf{Q}} = \hat{\mathbf{W}} \times \hat{\mathbf{P}} .
$$

$\hat{\mathbf{P}}$ points to periapsis. $\hat{\mathbf{W}}$ points along the orbit's normal (straight out of the plane). $\hat{\mathbf{Q}}$ points $90^\circ$ ahead of periapsis, in the direction of motion. This is the **perifocal frame** ("peri" for periapsis, "focal" because its origin is the focus). In it, the orbit is a flat curve with the simplest possible description.

Position comes straight from the orbit equation:

$$
\mathbf{r}_{PQW} = r\cos\nu\,\hat{\mathbf{P}} + r\sin\nu\,\hat{\mathbf{Q}}, \qquad r = \frac{p}{1 + e\cos\nu}.
$$

Velocity comes from differentiating. The orbit-equation lesson gave two rates: $\dot{r} = (\mu/h)e\sin\nu$ (how fast the distance changes) and $r\dot{\nu} = h/r = (\mu/h)(1 + e\cos\nu)$ (the sideways speed). Using the product rule on each component:

The $\hat{\mathbf{P}}$ component is

$$
\frac{d}{dt}(r\cos\nu) = \dot{r}\cos\nu - r\dot{\nu}\sin\nu = \frac{\mu}{h}\left[e\sin\nu\cos\nu - (1 + e\cos\nu)\sin\nu\right] = -\frac{\mu}{h}\sin\nu.
$$

(The two $e\sin\nu\cos\nu$ terms cancel.)

The $\hat{\mathbf{Q}}$ component is

$$
\frac{d}{dt}(r\sin\nu) = \dot{r}\sin\nu + r\dot{\nu}\cos\nu = \frac{\mu}{h}\left[e\sin^2\nu + (1 + e\cos\nu)\cos\nu\right] = \frac{\mu}{h}\left(e + \cos\nu\right).
$$

(Here $e\sin^2\nu + e\cos^2\nu = e$.) So

$$
\mathbf{v}_{PQW} = \frac{\mu}{h}\left[-\sin\nu\,\hat{\mathbf{P}} + (e + \cos\nu)\,\hat{\mathbf{Q}}\right], \qquad \frac{\mu}{h} = \sqrt{\frac{\mu}{p}} .
$$

Two things are worth noticing.

First, on an ellipse the $\hat{\mathbf{Q}}$ component never reaches zero, because $e + \cos\nu$ never does. So the spacecraft always keeps moving "forward" around the orbit.

Second, as $\nu$ runs around, the tip of the velocity vector traces a *circle* of radius $\mu/h$, centered at $(0, \mu e/h)$. This circle is called the **[[hodograph|hodograph]]**. It is a handy check on any propagator.

## From perifocal to inertial

To get from the inertial frame to the perifocal frame, turn it three times:

1. about $\hat{\mathbf{K}}$ by $\Omega$, bringing $\hat{\mathbf{I}}$ onto the line of nodes;
2. about the new $x$-axis (the line of nodes) by $i$, tipping the equator onto the orbit plane;
3. about the new $z$-axis (now $\hat{\mathbf{W}}$) by $\omega$, bringing the line of nodes onto $\hat{\mathbf{P}}$.

The rotating-frames module gave the frame-rotation matrices for turning about the $x$ axis ($\mathbf{R}_1$) and the $z$ axis ($\mathbf{R}_3$):

$$
\mathbf{R}_1(\theta) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & \sin\theta \\ 0 & -\sin\theta & \cos\theta \end{bmatrix}, \qquad
\mathbf{R}_3(\theta) = \begin{bmatrix} \cos\theta & \sin\theta & 0 \\ -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}.
$$

Components change from inertial to perifocal as $\mathbf{r}_{PQW} = \mathbf{R}_3(\omega)\,\mathbf{R}_1(i)\,\mathbf{R}_3(\Omega)\,\mathbf{r}_{IJK}$. The rightmost matrix acts first.

Usually you want the reverse: perifocal to inertial. Each matrix is **[[orthogonal|orthogonal]]**, so its inverse is its transpose. For these matrices, the transpose is the same rotation with the angle made negative. Reversing the order as well:

$$
\mathbf{r}_{IJK} = \mathbf{Q}\,\mathbf{r}_{PQW}, \qquad \mathbf{Q} = \mathbf{R}_3(-\Omega)\,\mathbf{R}_1(-i)\,\mathbf{R}_3(-\omega) .
$$

Multiplied out, writing $c$ for cosine and $s$ for sine (so $c_\Omega$ means $\cos\Omega$):

$$
\mathbf{Q} =
\begin{bmatrix}
c_\Omega c_\omega - s_\Omega s_\omega c_i & -c_\Omega s_\omega - s_\Omega c_\omega c_i & s_\Omega s_i \\
s_\Omega c_\omega + c_\Omega s_\omega c_i & -s_\Omega s_\omega + c_\Omega c_\omega c_i & -c_\Omega s_i \\
s_\omega s_i & c_\omega s_i & c_i
\end{bmatrix}.
$$

The three columns of $\mathbf{Q}$ are $\hat{\mathbf{P}}$, $\hat{\mathbf{Q}}$ and $\hat{\mathbf{W}}$ written in inertial components. That gives a quick check: the third column is $\hat{\mathbf{h}}$, and its $z$-part is $\cos i$, as it must be. The same matrix turns velocities too, because it is a pure rotation.

::: example A GTO at its southernmost point
A GTO launched from Cape Canaveral has $i = 27^\circ$, $\Omega = 100^\circ$ and $\omega = 180^\circ$. That value of $\omega$ puts perigee at the **[[descending node|perigee-at-node]]**, the usual layout, so that apogee lies on the equator. The size and shape are $a = 24\,396.14\,\mathrm{km}$ and $e = 0.72831$. Find the inertial state at $\nu = 90^\circ$.

**Step 1 — perifocal position.** At $\nu = 90^\circ$, $\cos\nu = 0$, so $r = p = a(1 - e^2) = 11\,455.49\,\mathrm{km}$, straight along $\hat{\mathbf{Q}}$:
$$
\mathbf{r}_{PQW} = (0,\; 11\,455.49,\; 0)\,\mathrm{km}.
$$

**Step 2 — perifocal velocity.** $\mu/h = \sqrt{\mu/p} = 5.8988\,\mathrm{km/s}$, and $(-\sin\nu, e + \cos\nu) = (-1, 0.72831)$:
$$
\mathbf{v}_{PQW} = 5.8988\,(-1,\; 0.72831,\; 0) = (-5.8988,\; 4.2961,\; 0)\,\mathrm{km/s}.
$$

**Step 3 — the rotation matrix.** With $c_\Omega = -0.17365$, $s_\Omega = 0.98481$, $c_i = 0.89101$, $s_i = 0.45399$, $c_\omega = -1$, $s_\omega = 0$:
$$
\mathbf{Q} =
\begin{bmatrix} 0.17365 & 0.87747 & 0.44709 \\ -0.98481 & 0.15472 & 0.07883 \\ 0 & -0.45399 & 0.89101 \end{bmatrix}.
$$

**Step 4 — rotate.** Position is $11\,455.49$ times the second column:
$$
\mathbf{r}_{IJK} = (10\,051.85,\; 1772.41,\; -5200.68)\,\mathrm{km}.
$$
Velocity is $\mathbf{Q}\mathbf{v}_{PQW}$:
$$
\mathbf{v}_{IJK} = (2.7454,\; 6.4739,\; -1.9504)\,\mathrm{km/s}.
$$

**Sanity checks.** A rotation cannot change lengths. $\lVert \mathbf{r} \rVert = 11\,455.49\,\mathrm{km}$ and $\lVert \mathbf{v} \rVert = 7.2974\,\mathrm{km/s}$, the same as the perifocal lengths. And $z = -r\sin i = -11\,455.49 \times 0.45399 = -5200.7\,\mathrm{km}$: a quarter-orbit past a perigee at the descending node is the southernmost point of the orbit, as far south as a $27^\circ$ tilt allows.
:::

## Where the classical elements fail

Each angle is defined as the angle between two vectors. An angle between vectors has no value when one of the vectors has zero length. Think of asking which way a clock hand points when the hand has been removed.

- **Circular orbit, $e = 0$.** The eccentricity vector is zero. There is no periapsis, so $\omega$ is undefined, and $\nu$ (measured from periapsis) is undefined too. But their sum is fine. The **argument of latitude** $u = \omega + \nu$ is the angle from the ascending node to the spacecraft, and it is well defined for any inclined orbit. Report $u$.
- **Equatorial orbit, $i = 0$ (or $180^\circ$).** The orbit plane *is* the equator. There is no line of nodes, $\mathbf{n} = \mathbf{0}$, and $\Omega$ is undefined — and so is $\omega$, which is measured from the node. Their sum, the **longitude of periapsis** $\varpi = \Omega + \omega$ (read "pomega" or "curly pi"), is measured straight from $\hat{\mathbf{I}}$ to $\mathbf{e}$, and it is well defined. Report $\varpi$.
- **Circular equatorial orbit.** Both failures at once. Only the **true longitude** $l = \Omega + \omega + \nu$, the angle from $\hat{\mathbf{I}}$ to $\mathbf{r}$, survives. Report $l$.

*Near* these cases, the elements have values, but they are **[[ill-conditioned|ill-conditioned]]**: tiny errors in the input make huge errors in the output. The ISS, at $e = 0.0006$, does have a perigee. But the difference between its closest and farthest distances is only about $8\,\mathrm{km}$ on an orbit $6800\,\mathrm{km}$ across. A $100\,\mathrm{m}$ error in its tracked position swings $\omega$ by degrees, while $u = \omega + \nu$ stays steady to arc-seconds. Any code that uses elements must work with the sums, not the parts, whenever $e$ or $i$ is small.

::: key Singularities of the classical elements
$\omega$ is undefined for $e = 0$ (use the argument of latitude $u = \omega + \nu$); $\Omega$ is undefined for $i = 0$ (use the longitude of periapsis $\varpi = \Omega + \omega$); both fail for a circular equatorial orbit (use the true longitude $l = \Omega + \omega + \nu$). Equinoctial elements remove all of these.
:::

## Equinoctial elements

Here is the idea behind the fix. Describing a point by "distance and direction" breaks down at the center: at distance zero, the direction means nothing. Describing it by $x$ and $y$ never breaks down: the center is $(0, 0)$, like any other point.

The classical pairs $(e, \omega)$ and $(i, \Omega)$ are "distance and direction" pairs. The [[equinoctial elements|equinoctial-history]] replace each with an "$x$ and $y$" pair, which behaves smoothly when the size goes to zero:

$$
\begin{aligned}
a, \qquad
P_1 &= e\sin(\omega + \Omega), & P_2 &= e\cos(\omega + \Omega), \\
Q_1 &= \tan\tfrac{i}{2}\,\sin\Omega, & Q_2 &= \tan\tfrac{i}{2}\,\cos\Omega, \qquad
\lambda = M + \omega + \Omega .
\end{aligned}
$$

- $(P_2, P_1)$ are the components of the eccentricity vector, measured from $\hat{\mathbf{I}}$ in an equinoctial frame. When $e \to 0$ both go smoothly to zero, and nothing is undefined.
- $(Q_2, Q_1)$ describe the orbit plane through $\tan(i/2)$ and $\Omega$. When $i \to 0$ both go to zero.
- The sixth element is the **mean longitude** $\lambda$ (Greek "lambda"): the sum of the three angles, using the mean anomaly $M$ in place of $\nu$. It is defined for every orbit.

The set is singular only at $i = 180^\circ$, where $\tan(i/2)$ blows up. A "retrograde" version using $\cot(i/2)$ handles that case.

Watch out for names. Some authors write the same elements as $(a, h, k, p, q, \lambda)$ — confusingly reusing $h$ and $p$ — or as $(a, a_f, a_g, \chi, \psi, \lambda_M)$. The definitions are identical.

Going back is direct:

$$
e = \sqrt{P_1^2 + P_2^2}, \quad \varpi = \omega + \Omega = \operatorname{atan2}(P_1, P_2), \quad
\tan\tfrac{i}{2} = \sqrt{Q_1^2 + Q_2^2}, \quad \Omega = \operatorname{atan2}(Q_1, Q_2),
$$

then $\omega = \varpi - \Omega$ and $M = \lambda - \varpi$. Here $\operatorname{atan2}(y, x)$ is the two-argument arctangent from the trigonometry module, which returns the angle in the correct quadrant.

Every step is smooth, except recovering the classical angles themselves — which is exactly the step that *should* fail when they have no value.

A close cousin, the **modified equinoctial elements** $(p, f, g, h, k, L)$, uses:

- $p$, the semi-latus rectum;
- $f, g$, the eccentricity-vector components;
- $h, k$, the $\tan(i/2)$ components;
- $L$, the true longitude.

Because it uses $p$ instead of $a$, it also handles $e \ge 1$. That makes it standard in low-thrust trajectory optimization. When you see six-element vectors in an orbit-determination filter or a continuous-thrust optimizer, expect one of these sets rather than the classical one.

::: example Equinoctial elements of the GTO
Take the GTO above, with mean anomaly $M = 45^\circ$ at the epoch.

**Step 1 — the combined angles.** $\varpi = \Omega + \omega = 100^\circ + 180^\circ = 280^\circ$, and $\tan(i/2) = \tan 13.5^\circ = 0.24008$.

**Step 2 — the four pairs.**
$$
P_1 = 0.72831\sin 280^\circ = -0.7172, \quad P_2 = 0.72831\cos 280^\circ = 0.1265,
$$
$$
Q_1 = 0.24008\sin 100^\circ = 0.2364, \quad Q_2 = 0.24008\cos 100^\circ = -0.0417.
$$

**Step 3 — mean longitude.** $\lambda = M + \varpi = 45^\circ + 280^\circ = 325^\circ$.

**Going back, as a check.**

- $e = \sqrt{0.7172^2 + 0.1265^2} = 0.7283$.
- $\varpi = \operatorname{atan2}(-0.7172, 0.1265) = -80^\circ$, which is the same direction as $280^\circ$.
- $\tan(i/2) = \sqrt{0.2364^2 + 0.0417^2} = 0.2401$, so $i = 27.0^\circ$.
- $\Omega = \operatorname{atan2}(0.2364, -0.0417) = 100.0^\circ$.
- $\omega = 280^\circ - 100^\circ = 180^\circ$, and $M = 325^\circ - 280^\circ = 45^\circ$.

Everything comes back. Now imagine the same orbit made circular at apogee. Then $e \to 0$, so $P_1, P_2 \to 0$, and $\lambda$ carries on as the spacecraft's mean longitude. Meanwhile $\omega$ and $M$, taken separately, stop meaning anything.
:::

::: warning Angle ranges and atan2
$\Omega$, $\omega$ and $\nu$ live in $[0, 360^\circ)$, and each needs a quadrant decision. $i$ lives in $[0, 180^\circ]$ and does not. Whenever an angle can be more than $180^\circ$, compute it with a two-argument arctangent (a sine-like quantity on top, a cosine-like one below) rather than an arccosine plus an if-statement. The arccosine also fails when round-off pushes its input a hair past $\pm 1$. A negative inclination, or one above $180^\circ$, is always a bug.
:::

::: warning Three different longitudes
$u = \omega + \nu$ is the argument of latitude (from the node to the spacecraft). $\varpi = \Omega + \omega$ is the longitude of periapsis (from $\hat{\mathbf{I}}$ to periapsis — a "broken" angle, added across two different planes). $l = \Omega + \omega + \nu$ is the true longitude (from $\hat{\mathbf{I}}$ to the spacecraft). None of them is a longitude on a map, and none of them is the mean longitude $\lambda$, which uses $M$ instead of $\nu$.
:::

## Check yourself

::: check
An orbit has $\mathbf{h} = (0,\; -30\,000,\; 51\,962)\,\mathrm{km^2/s}$. Find its inclination and right ascension of the ascending node.
:::

::: answer
**Length of h.** $h = \sqrt{30\,000^2 + 51\,962^2} = 60\,000\,\mathrm{km^2/s}$.

**Inclination.** $\cos i = 51\,962/60\,000 = 0.8660$, so $i = 30^\circ$. Below $90^\circ$, so prograde.

**Node.** $\mathbf{n} = (-h_y, h_x, 0) = (30\,000, 0, 0)$, pointing along $+\hat{\mathbf{I}}$. So $\Omega = \operatorname{atan2}(0, 30\,000) = 0^\circ$: the ascending node is in the vernal-equinox direction.
:::

::: check
Why is $\omega$ undefined for a circular orbit, what replaces it, and why is the replacement well defined?
:::

::: answer
$\omega$ is the angle from the node vector to the eccentricity vector. For $e = 0$ the eccentricity vector is the zero vector, which has no direction, so the angle does not exist. In code, the formula divides by $e \approx 0$.

The replacement is the argument of latitude, $u = \omega + \nu$: the angle from the node vector to the *position* vector. Both of those are nonzero for any inclined orbit, so $u$ is well defined even though neither $\omega$ nor $\nu$ is.
:::

::: check
Which sign of $e_z$ puts $\omega$ between $180^\circ$ and $360^\circ$, and why?
:::

::: answer
$e_z < 0$. Periapsis lies in the direction of $\mathbf{e}$, so if $e_z < 0$, periapsis is south of the equator.

Start at the ascending node and follow the motion. For the first half-orbit ($0$ to $180^\circ$ of argument of latitude) the spacecraft is north of the equator. For the second half it is south. So a southern periapsis must be more than $180^\circ$ past the ascending node.
:::

::: check
Compute the third column of $\mathbf{Q}$ for $i = 63.4^\circ$, $\Omega = 200^\circ$ and any $\omega$. What is it?
:::

::: answer
The third column is $(s_\Omega s_i,\; -c_\Omega s_i,\; c_i)$:
$$
(\sin 200^\circ \sin 63.4^\circ,\; -\cos 200^\circ \sin 63.4^\circ,\; \cos 63.4^\circ) = (-0.3058,\; 0.8402,\; 0.4478).
$$
It does not depend on $\omega$, because turning about $\hat{\mathbf{W}}$ does not move $\hat{\mathbf{W}}$. It is the unit orbit normal $\hat{\mathbf{h}}$ in inertial components, and its $z$-part is $\cos i$.
:::

::: check
A nearly circular, nearly equatorial orbit has $e = 10^{-5}$ and $i = 0.01^\circ$. Which classical elements are numerically meaningless? Which equinoctial elements are small? Which single angle still locates the spacecraft?
:::

::: answer
**Meaningless:** $\Omega$, $\omega$ and $\nu$. The node vector and the eccentricity vector are both nearly zero, so their directions are noise.

**Small but fine:** in the equinoctial set, $P_1, P_2 \approx 10^{-5}$ and $Q_1, Q_2 \approx \tan(0.005^\circ) \approx 8.7 \times 10^{-5}$. Small, but perfectly well defined.

**Still works:** the true longitude $l = \Omega + \omega + \nu$, the angle from $\hat{\mathbf{I}}$ to $\mathbf{r}$. Its mean-anomaly partner is the mean longitude $\lambda$.
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

The next lesson assembles these definitions into the two conversion algorithms — state vector to elements and back — with every quadrant check and every degenerate case handled explicitly.

::: context vernal-equinox The first point of Aries
Twice a year the Sun crosses Earth's equator in the sky. The March crossing is the vernal (spring) equinox, and the direction to the Sun at that moment is the $\hat{\mathbf{I}}$ axis. Astronomers call it the "first point of Aries", because it lay in the constellation Aries about two thousand years ago. Earth's axis wobbles slowly, once every $26\,000$ years or so, and the point has since drifted into Pisces. The old name stuck.
:::

::: context j2000 Freezing the frame at a moment
Because the equator and equinox drift, "the equator" must mean the equator *at some date*. J2000 uses their positions at noon on 1 January 2000 (in a time scale called Terrestrial Time). Every inertial position you meet in a modern tracking file is measured in J2000 or its close successor, GCRF. If two programs disagree by kilometers, a frame mix-up is one of the first things to check.
:::

::: context tilt-picture Inclination, seen edge-on
Look at the equator and the orbit plane from the side, so both appear as lines. The angle between the lines is $i$. The angle between their "straight-up" arrows — $\hat{\mathbf{K}}$ for the equator, $\mathbf{h}$ for the orbit — is the same $i$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="30" y1="110" x2="330" y2="110" stroke="#6c7a93" stroke-width="2"/>
<line x1="50.1" y1="185.0" x2="309.9" y2="35.0" stroke="#1d6fd1" stroke-width="2.5"/>
<circle cx="180" cy="110" r="22" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="180.0" y1="88.0" x2="180.0" y2="25.0" stroke="#1f2a44" stroke-width="2"/><polygon points="180.0,15.0 184.5,25.0 175.5,25.0" fill="#1f2a44"/>
<line x1="169.0" y1="90.9" x2="137.5" y2="36.4" stroke="#b4232c" stroke-width="2"/><polygon points="132.5,27.7 141.4,34.1 133.6,38.6" fill="#b4232c"/>
<path d="M180.0,50.0 A60,60 0 0,0 150.0,58.0" fill="none" stroke="#b4232c" stroke-width="1.5"/>
<text x="159.9" y="42.4" font-size="12" fill="#b4232c" text-anchor="middle">i</text>
<path d="M275.0,110.0 A95,95 0 0,0 262.3,62.5" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
<text x="281.4" y="86.8" font-size="12" fill="#1f2a44">i</text>
<text x="186" y="22" font-size="12" fill="#1f2a44">K (north)</text>
<text x="126.5" y="31.7" font-size="12" fill="#b4232c" text-anchor="end">h</text>
<text x="330" y="128" font-size="11" fill="#6c7a93" text-anchor="end">equator (edge on)</text>
<text x="70" y="196" font-size="11" fill="#1d6fd1">orbit plane (edge on)</text>
</svg>
```

That is why $\cos i = h_z/h$: $h_z/h$ is the cosine of the angle between $\mathbf{h}$ and the north axis.
:::

::: context retrograde Going against the spin
Earth's surface at the equator moves east at about $0.46\,\mathrm{km/s}$, and a rocket launched eastward gets that speed for free. A retrograde orbit throws it away and must make it up, so retrograde launches are rare. Israel does it anyway: it launches its Ofeq satellites westward over the Mediterranean, so that rocket stages never fall on neighboring countries, and accepts the cost. Sun-synchronous orbits, near $98^\circ$, are slightly retrograde for a different reason, covered later in the course.
:::

::: context in-plane-angles Three angles in the orbit plane
Seen face-on, with the orbit going counterclockwise: $\omega$ runs from the ascending node to periapsis, $\nu$ from periapsis to the spacecraft, and $u$ from the node straight to the spacecraft.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<polyline points="205.0,48.0 202.2,46.5 199.4,45.1 196.5,43.9 193.6,42.7 190.6,41.7 187.6,40.8 184.5,40.1 181.4,39.5 178.2,39.0 175.0,38.6 171.8,38.4 168.5,38.4 165.3,38.5 162.0,38.7 158.7,39.1 155.4,39.6 152.1,40.3 148.8,41.1 145.5,42.1 142.3,43.3 139.1,44.6 135.9,46.1 132.7,47.8 129.6,49.6 126.6,51.6 123.6,53.7 120.7,56.1 117.9,58.5 115.2,61.2 112.6,64.0 110.2,67.0 107.8,70.1 105.6,73.4 103.6,76.8 101.7,80.3 99.9,84.0 98.4,87.9 97.1,91.8 95.9,95.9 95.0,100.0 94.3,104.2 93.9,108.5 93.6,112.9 93.7,117.3 94.0,121.7 94.6,126.1 95.4,130.6 96.5,134.9 97.9,139.3 99.6,143.5 101.5,147.7 103.7,151.8 106.2,155.7 108.9,159.5 111.9,163.1 115.1,166.5 118.5,169.7 122.2,172.7 126.0,175.5 130.0,177.9 134.2,180.2 138.4,182.1 142.8,183.8 147.3,185.1 151.9,186.2 156.5,187.0 161.2,187.4 165.8,187.6 170.4,187.5 175.0,187.1 179.5,186.4 184.0,185.4 188.3,184.2 192.6,182.7 196.7,181.0 200.7,179.1 204.5,176.9 208.2,174.5 211.7,172.0 215.0,169.3 218.1,166.4 221.1,163.4 223.8,160.3 226.4,157.0 228.7,153.7 230.8,150.3 232.8,146.8 234.5,143.2 236.0,139.6 237.4,136.0 238.5,132.3 239.4,128.7 240.2,125.0 240.7,121.4 241.1,117.7 241.3,114.1 241.4,110.5 241.2,107.0 240.9,103.5 240.5,100.0 239.8,96.6 239.1,93.3 238.2,90.0 237.1,86.8 235.9,83.7 234.6,80.6 233.2,77.7 231.6,74.8 229.9,72.0 228.1,69.3 226.3,66.7 224.3,64.2 222.2,61.8 220.0,59.5 217.7,57.3 215.3,55.2 212.8,53.3 210.3,51.4 207.7,49.7 205.0,48.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
<line x1="30" y1="100" x2="175" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
<line x1="175.0" y1="100.0" x2="305.0" y2="100.0" stroke="#6c7a93" stroke-width="2"/><polygon points="315.0,100.0 305.0,104.5 305.0,95.5" fill="#6c7a93"/>
<line x1="175.0" y1="100.0" x2="200.0" y2="56.7" stroke="#b4232c" stroke-width="2"/><polygon points="205.0,48.0 203.9,58.9 196.1,54.4" fill="#b4232c"/>
<line x1="175.0" y1="100.0" x2="138.1" y2="56.0" stroke="#1d6fd1" stroke-width="2"/><polygon points="131.7,48.4 141.6,53.1 134.7,58.9" fill="#1d6fd1"/>
<circle cx="131.7" cy="48.4" r="5" fill="#1d6fd1"/>
<circle cx="175" cy="100" r="5" fill="#1f2a44"/>
<path d="M199.0,100.0 A24,24 0 0,0 187.0,79.2" fill="none" stroke="#b4232c" stroke-width="1.5"/>
<path d="M187.0,79.2 A24,24 0 0,0 159.6,81.6" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
<path d="M217.0,100.0 A42,42 0 0,0 148.0,67.8" fill="none" stroke="#f2b880" stroke-width="1.5"/>
<text x="203.6" y="87.5" font-size="12" fill="#b4232c" text-anchor="middle">ω</text>
<text x="172.1" y="71.1" font-size="12" fill="#1d6fd1" text-anchor="middle">ν</text>
<text x="166.3" y="54.8" font-size="12" fill="#f2b880" text-anchor="middle">u</text>
<text x="315" y="118" font-size="11" fill="#6c7a93" text-anchor="end">to ascending node (n)</text>
<text x="211.0" y="44.0" font-size="11" fill="#b4232c">periapsis (e)</text>
<text x="123.7" y="40.4" font-size="11" fill="#1d6fd1" text-anchor="end">spacecraft (r)</text>
<text x="6" y="204" font-size="11" fill="#1f2a44">u = ω + ν, measured in the direction of motion</text>
</svg>
```

When the orbit is circular, the red periapsis arrow has no place to point — but the orange $u$ still does.
:::

::: context euler-313 What "3-1-3" means
Any orientation in 3D can be reached by three turns about axes, one after another; the three turn angles are called Euler angles, after Leonhard Euler. "3-1-3" names the axes: first about axis 3 (the $z$ axis) by $\Omega$, then about the new axis 1 (the $x$ axis, now the node line) by $i$, then about the new axis 3 by $\omega$. The attitude modules use other sequences, such as 3-2-1 for yaw, pitch and roll.
:::

::: context hodograph The velocity circle
Draw every velocity vector of an orbit from one common starting point. Their tips land on a circle — for every ellipse, and on part of a circle for a parabola or hyperbola. William Rowan Hamilton studied this in the 1840s and named it the hodograph ("path drawing").

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<line x1="170" y1="120" x2="330" y2="120" stroke="#6c7a93" stroke-width="1"/>
<line x1="250" y1="150" x2="250" y2="15" stroke="#6c7a93" stroke-width="1"/>
<circle cx="250" cy="92.5" r="55" fill="none" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="250" cy="92.5" r="3" fill="#1d6fd1"/>
<line x1="250.0" y1="120.0" x2="250.0" y2="47.5" stroke="#b4232c" stroke-width="1.5"/><polygon points="250.0,37.5 254.5,47.5 245.5,47.5" fill="#b4232c"/>
<line x1="250.0" y1="120.0" x2="208.9" y2="72.6" stroke="#b4232c" stroke-width="1.5"/><polygon points="202.4,65.0 212.3,69.6 205.5,75.5" fill="#b4232c"/>
<line x1="250.0" y1="120.0" x2="212.4" y2="120.0" stroke="#b4232c" stroke-width="1.5"/><polygon points="202.4,120.0 212.4,115.5 212.4,124.5" fill="#b4232c"/>
<line x1="250.0" y1="120.0" x2="250.0" y2="137.5" stroke="#b4232c" stroke-width="1.5"/><polygon points="250.0,147.5 245.5,137.5 254.5,137.5" fill="#b4232c"/>
<line x1="250.0" y1="120.0" x2="287.6" y2="120.0" stroke="#b4232c" stroke-width="1.5"/><polygon points="297.6,120.0 287.6,124.5 287.6,115.5" fill="#b4232c"/>
<line x1="250.0" y1="120.0" x2="291.1" y2="72.6" stroke="#b4232c" stroke-width="1.5"/><polygon points="297.6,65.0 294.5,75.5 287.7,69.6" fill="#b4232c"/>
<text x="334" y="124" font-size="11" fill="#6c7a93">P</text>
<text x="254" y="12" font-size="11" fill="#6c7a93">Q</text>
<polyline points="124.0,105.0 124.0,103.7 123.9,102.5 123.8,101.2 123.6,100.0 123.4,98.7 123.2,97.5 122.9,96.2 122.6,94.9 122.2,93.7 121.8,92.4 121.3,91.2 120.7,89.9 120.1,88.7 119.5,87.4 118.8,86.2 118.0,85.0 117.2,83.7 116.4,82.5 115.4,81.3 114.4,80.1 113.3,78.9 112.2,77.7 110.9,76.5 109.6,75.3 108.2,74.2 106.8,73.1 105.2,72.0 103.6,71.0 101.8,70.0 100.0,69.0 98.1,68.1 96.0,67.2 93.9,66.4 91.6,65.7 89.3,65.1 86.8,64.5 84.3,64.1 81.6,63.7 78.9,63.5 76.0,63.4 73.1,63.5 70.0,63.8 66.9,64.2 63.8,64.8 60.6,65.6 57.4,66.7 54.2,67.9 51.1,69.5 48.0,71.2 45.0,73.3 42.2,75.5 39.5,78.0 37.0,80.8 34.7,83.8 32.7,87.0 31.1,90.4 29.8,93.9 28.8,97.5 28.2,101.2 28.0,105.0 28.2,108.8 28.8,112.5 29.8,116.1 31.1,119.6 32.7,123.0 34.7,126.2 37.0,129.2 39.5,132.0 42.2,134.5 45.0,136.7 48.0,138.8 51.1,140.5 54.2,142.1 57.4,143.3 60.6,144.4 63.8,145.2 66.9,145.8 70.0,146.2 73.1,146.5 76.0,146.6 78.9,146.5 81.6,146.3 84.3,145.9 86.8,145.5 89.3,144.9 91.6,144.3 93.9,143.6 96.0,142.8 98.1,141.9 100.0,141.0 101.8,140.0 103.6,139.0 105.2,138.0 106.8,136.9 108.2,135.8 109.6,134.7 110.9,133.5 112.2,132.3 113.3,131.1 114.4,129.9 115.4,128.7 116.4,127.5 117.2,126.3 118.0,125.0 118.8,123.8 119.5,122.6 120.1,121.3 120.7,120.1 121.3,118.8 121.8,117.6 122.2,116.3 122.6,115.1 122.9,113.8 123.2,112.5 123.4,111.3 123.6,110.0 123.8,108.8 123.9,107.5 124.0,106.3 124.0,105.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
<circle cx="100" cy="105" r="3.5" fill="#1f2a44"/>
<text x="88" y="195" font-size="11" fill="#1f2a44" text-anchor="middle">orbit, e = 0.5</text>
<text x="250" y="195" font-size="11" fill="#1f2a44" text-anchor="middle">velocity arrows, every 60°</text>
</svg>
```

The arrows above are taken every $60^\circ$ of true anomaly on an $e = 0.5$ orbit. Their tips all sit on the blue circle, whose center is shifted up from the origin by $\mu e/h$. If a propagator's velocities drift off a circle for pure two-body motion, it has a bug.
:::

::: context orthogonal Why the inverse is the transpose
A rotation matrix is **orthogonal**: its columns are unit vectors at right angles to each other. Multiply it by its transpose and every column meets every other column in a dot product — $1$ with itself, $0$ with the others. The result is the identity matrix. So the transpose undoes the rotation, and it is far cheaper to compute than a general inverse.
:::

::: context perigee-at-node Why GTO perigee sits on the equator
A satellite headed for geostationary orbit must end up over the equator with zero inclination. The biggest burn, at apogee, is also the cheapest place to remove the leftover tilt, because the spacecraft is slow there. A plane change can only happen where the two planes meet — on the equator. So the orbit is laid out with apogee at a node, which puts perigee at the opposite node. In the usual layout from Cape Canaveral, the perigee burn happens over the equator heading south, at the descending node.
:::

::: context ill-conditioned Tiny errors in, huge errors out
A calculation is ill-conditioned when small changes in the input cause very large changes in the output. Try finding which way a nearly round ellipse points. Its long axis is barely longer than its short one, so a small measurement error can swing the answer through a large angle. The answer exists; it cannot be trusted. Good software avoids asking ill-conditioned questions.
:::

::: context equinoctial-history Where equinoctial elements came from
Roger Broucke and Paul Cefola set out the equinoctial elements in a 1972 paper, building on older ideas from celestial mechanics. The name comes from measuring the angles from the equinox direction rather than from the node. In 1985 Walker, Ireland and Owens published the "modified" set with $p$ and the true longitude, which is now common in low-thrust software.
:::
