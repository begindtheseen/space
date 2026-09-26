---
id: l08-conic-sections
title: Conic sections and the shape of orbits
minutes: 20
covers:
  - conic sections in geometric and polar form
---

Shine a flashlight straight at a wall and the patch of light is a circle. Tilt the flashlight a little and the circle stretches into an oval — an **ellipse**. Tilt it further, until the top edge of the beam runs parallel to the wall, and the oval never closes: one end runs off forever. That open curve is a **parabola**. Tilt further still and the edge opens even wider, into a **hyperbola**. The beam of light is a cone, and the wall slices it. The four curves are the **conic sections** — the shapes you get by [[slicing a cone|four-slices]].

Here is why a rocket engineer cares. Put a satellite anywhere in space, give it any speed in any direction, and let only the Earth's gravity act on it. The path it follows is always one of those four curves. There is no fifth possibility. Every closed orbit is an ellipse (a circle is the special, perfectly round ellipse). Every escape path is a hyperbola (the parabola is the knife-edge in between). And one number, the **eccentricity** $e$, says which — it measures how far the curve is from being a circle. Greek geometers studied these curves [[two thousand years before anyone knew planets moved on them|conic-history]].

For guidance work the conics matter in one particular form. Put the planet at the origin of polar coordinates, and every conic is the one line $r = p/(1 + e\cos\nu)$. That is the orbit equation. Read it as geometry and you already have the whole vocabulary of orbits — closest and farthest points, semi-major axis, true anomaly, escape, the path of a flyby — before doing any physics. This lesson gives the four curves, derives that equation, links its numbers to the shape, and shows how gravity produces it. The full physics derivation belongs to the orbital mechanics track; what you take from here is the ability to recognize the shape and work with it.

## The four curves, drawn by a rule

You do not need a cone to draw a conic. Each one is a **locus** (plural *loci*) — the set of all points that obey some distance rule, the way "every point $5$ m from the flagpole" draws a circle.

A **circle** of radius $R$ about a center $C$ is every point at distance $R$ from $C$.

An **ellipse** has two special points inside it, the **foci** (one **[[focus|focus-word]]**, two foci). It is every point $P$ whose distances to the two foci add up to the same total, called $2a$:

$$
|PF_1| + |PF_2| = 2a .
$$

($|PF_1|$ is read "the distance from P to F-one".) You can draw one with two pins and a piece of string: pin the ends of a string of length $2a$ at the foci, pull it tight with a pencil, and trace around. If the two pins are in the same place, you get a circle of radius $a$.

A **parabola** has one focus $F$ and a straight line $L$ called the **directrix** ("director line"). It is every point exactly as far from $F$ as from $L$.

A **hyperbola** has two foci, like an ellipse, but uses the *difference* of the distances instead of the sum: every point where $\big||PF_1| - |PF_2|\big| = 2a$. It comes in two separate pieces, called **branches**, one wrapped around each focus.

### The same curves in $x$ and $y$

Put the center of an ellipse at the origin, with the foci on the $x$ axis at $(\pm c, 0)$. The string rule then becomes the tidy equation

$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1, \qquad b^2 = a^2 - c^2 .
$$

The [[three lengths|ellipse-parts]] each have a name:

- $a$ is the **semi-major axis** — half the long width ("semi" means half).
- $b$ is the **semi-minor axis** — half the short width.
- $c = \sqrt{a^2 - b^2}$ is the distance from the center to each focus.

The **eccentricity** is $e = c/a$. It runs from $0$ (foci at the center: a circle) up toward $1$ (foci at the very ends: the ellipse squashed flat into a line). The end of the long axis nearest a focus is $a - c = a(1 - e)$ from it; the far end is $a + c = a(1 + e)$ from it.

::: note Why it has to be true
Write the string rule with coordinates: $\sqrt{(x + c)^2 + y^2} + \sqrt{(x - c)^2 + y^2} = 2a$. Move the second square root to the right side and square both sides:

$$
(x + c)^2 + y^2 = 4a^2 - 4a\sqrt{(x - c)^2 + y^2} + (x - c)^2 + y^2 .
$$

The $x^2$, $y^2$ and $c^2$ terms cancel, leaving $4cx - 4a^2 = -4a\sqrt{(x - c)^2 + y^2}$, or $a\sqrt{(x - c)^2 + y^2} = a^2 - cx$. Square again: $a^2(x^2 - 2cx + c^2 + y^2) = a^4 - 2a^2cx + c^2x^2$. The $cx$ terms cancel, leaving $(a^2 - c^2)x^2 + a^2y^2 = a^2(a^2 - c^2)$. Call $a^2 - c^2 = b^2$ and divide by $a^2b^2$ to get $x^2/a^2 + y^2/b^2 = 1$.
:::

The same algebra with a difference of distances gives the hyperbola, centered at the origin:

$$
\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1, \qquad c^2 = a^2 + b^2, \qquad e = \frac{c}{a} > 1 .
$$

Its **vertices** (the tips of the two branches) are at $(\pm a, 0)$ and its foci at $(\pm c, 0)$, now *outside* the vertices. Far from the center, the $1$ on the right hardly matters, so $y \approx \pm(b/a)x$. The branches straighten out along two lines through the center with slopes $\pm b/a$, called the **asymptotes** — lines the curve gets closer and closer to but never touches.

The parabola with focus $(q, 0)$ and directrix $x = -q$ is $y^2 = 4qx$. You get it by squaring the rule $\sqrt{(x - q)^2 + y^2} = x + q$.

These centered equations are what you meet in a geometry class. Orbits are not written this way, because the planet sits at a *focus*, not at the center. A satellite's position is naturally measured from the planet.

## One equation for all four: the polar form

There is one rule that draws every conic and has the eccentricity built right in. Pick a focus $F$, a directrix line $L$ that misses it, and a positive number $e$. The conic is every point $P$ whose distance to $F$ is $e$ times its distance to $L$:

$$
|PF| = e \cdot \operatorname{dist}(P, L) .
$$

Think of $e$ as a "pull" setting. With $e = 1$ the point stays equally far from both — that is the parabola's rule. With $e$ less than $1$ it hugs the focus and closes up into an ellipse. With $e$ greater than $1$ it can stray far from the focus, and you get a hyperbola. A circle is the limit where $e$ shrinks to $0$ and the directrix moves off to infinity.

Now turn the rule into polar coordinates. Put the focus at the origin, and the directrix as the vertical line $x = D$, a distance $D > 0$ to the right. Use $(r, \nu)$ for the polar coordinates — $\nu$ is the Greek letter "nu". A point at $(r, \nu)$ has $x = r\cos\nu$, so its distance to the directrix is $D - r\cos\nu$. The rule says

$$
r = e(D - r\cos\nu).
$$

Gather the $r$ terms on the left: $r + er\cos\nu = eD$, so $r(1 + e\cos\nu) = eD$. Divide:

$$
r = \frac{p}{1 + e\cos\nu}, \qquad p = eD .
$$

The constant $p$ is the **semi-latus rectum** (*latus rectum* is Latin for "straight side"). It is the value of $r$ at $\nu = \pm 90^\circ$: how far the curve is from the focus, measured straight across, perpendicular to the long axis. The angle $\nu$ is measured from the direction of closest approach. At $\nu = 0$ the bottom of the fraction is biggest, so $r$ is smallest.

::: key Polar form of a conic and of the two-body orbit
$r = \dfrac{p}{1 + e\cos\nu}$, with $p$ the semi-latus rectum and $\nu$ the angle from periapsis. For a two-body orbit $p = h^2/\mu$, where $h$ is the specific angular momentum, and $\nu$ is the true anomaly.
:::

(The words in that box — periapsis, true anomaly, $h$ and $\mu$ — are all explained below.)

### Reading the equation for each $e$

Watch the bottom of the fraction, $1 + e\cos\nu$, as $\nu$ goes around. Since $\cos\nu$ swings between $-1$ and $+1$, the bottom swings between $1 - e$ and $1 + e$.

- **$e = 0$.** The bottom is always $1$, so $r = p$ at every angle. A circle of radius $p$.
- **$0 < e < 1$.** The bottom stays between $1 - e$ and $1 + e$, both positive. So $r$ is finite at every angle and the curve closes. An ellipse, with $r$ running from $p/(1 + e)$ at $\nu = 0$ to $p/(1 - e)$ at $\nu = 180^\circ$.
- **$e = 1$.** The bottom is $1 + \cos\nu$, positive everywhere except $\nu = 180^\circ$, where it is zero and $r$ shoots off to infinity. A parabola — open, but only barely: it reaches infinity only in the direction exactly opposite the closest point.
- **$e > 1$.** The bottom hits zero at an angle short of $180^\circ$, called $\nu_\infty$ ("nu infinity"), where $\cos\nu_\infty = -1/e$, so $\nu_\infty = \arccos(-1/e)$. Past that angle the bottom would be negative. Only $|\nu| < \nu_\infty$ is part of the curve, and $r \to \infty$ as $\nu$ approaches $\pm\nu_\infty$, along the two asymptotes. A hyperbola.

::: key Classifying a conic by eccentricity
$e = 0$ circle; $0 < e < 1$ ellipse; $e = 1$ parabola, the escape case with zero energy; $e > 1$ hyperbola, with positive energy. For $e \ge 1$ the radius is finite only where $1 + e\cos\nu > 0$.
:::

::: warning The denominator is a physical boundary
For $e \ge 1$, code that evaluates $p/(1 + e\cos\nu)$ for every $\nu$ from $0$ to $2\pi$ produces negative radii and draws a fake second curve on the far side of the focus. Those points are not on the path. Sweep only $|\nu| < \arccos(-1/e)$, and treat a zero or negative denominator as an error, not a number.
:::

### Linking the polar numbers to the shape

For an ellipse, the closest point to the focus is the **periapsis** and the farthest is the **apoapsis** — around the Earth, **[[perigee and apogee|peri-apo]]**. They sit on the long axis, at $\nu = 0$ and $\nu = 180^\circ$:

$$
r_p = \frac{p}{1 + e}, \qquad r_a = \frac{p}{1 - e} .
$$

Together they span the whole long axis, so $r_p + r_a = 2a$. Add the two fractions over the common denominator $(1 + e)(1 - e) = 1 - e^2$:

$$
2a = \frac{p(1 - e) + p(1 + e)}{1 - e^2} = \frac{2p}{1 - e^2} .
$$

Solve for $p$, and the rest follows:

$$
p = a(1 - e^2), \qquad r_p = a(1 - e), \qquad r_a = a(1 + e), \qquad e = \frac{r_a - r_p}{r_a + r_p} .
$$

That last formula is the working one: measure an orbit's two extreme distances and you have its eccentricity. A few more links: the semi-minor axis is $b = a\sqrt{1 - e^2} = \sqrt{ap}$, the center is $c = ae$ from the focus, and the directrix is $D = p/e$ from the focus.

For the hyperbola, with $a$ taken as positive the way geometry books do, the same steps give $p = a(e^2 - 1)$ and $r_p = a(e - 1)$, and there is no apoapsis. Many orbital mechanics books instead keep $p = a(1 - e^2)$ for every conic by making $a$ *negative* for a hyperbola. Watch for which convention a book uses.

::: example A geostationary transfer orbit
A rocket drops a satellite into a **[[geostationary transfer orbit|gto]]**, with its lowest point $185$ km above the ground and its highest point $35\,786$ km up. Distances in orbit are measured from the Earth's center, so add the Earth's radius $R_E = 6378.1$ km:

$$
r_p = 6378.1 + 185 = 6563.1\ \mathrm{km}, \qquad r_a = 6378.1 + 35\,786 = 42\,164.1\ \mathrm{km}.
$$

**The shape.** The semi-major axis is the average of the two, and the eccentricity comes from the working formula:

$$
a = \frac{6563.1 + 42\,164.1}{2} = 24\,363.6\ \mathrm{km}, \qquad e = \frac{42\,164.1 - 6563.1}{42\,164.1 + 6563.1} = 0.7306 .
$$

Then $p = a(1 - e^2) = 11\,358$ km.

**Check the polar equation at the ends.** $p/(1 + e) = 11\,358/1.7306 = 6563$ km and $p/(1 - e) = 11\,358/0.2694 = 42\,164$ km. Both match.

**Some points in between.** At $\nu = 60^\circ$, $\cos\nu = 0.5$, so $r = 11\,358/(1 + 0.7306 \times 0.5) = 8319$ km. At $\nu = 90^\circ$, $r = p = 11\,358$ km. At $\nu = 120^\circ$, $r = 11\,358/(1 - 0.3653) = 17\,896$ km. So between $60^\circ$ and $120^\circ$ the distance more than doubles. Compare the $60^\circ$ stretch centered on perigee, from $-30^\circ$ to $+30^\circ$: there the distance only goes from $6563$ km to $6957$ km, about $6\%$.

**The ellipse itself.** $b = a\sqrt{1 - e^2} = 16\,635$ km, and the Earth's center sits $c = ae = 17\,800$ km from the middle of the ellipse. That offset is longer than the whole semi-minor axis — this is what an eccentricity of $0.73$ looks like. One trip around takes about $10.5$ hours, and the satellite spends most of that time far out, where (as you will see below) it moves slowly.
:::

## Why orbits are conics

Newton's law of gravity, applied to a small body moving around a big one, leads to this result for the distance between them:

$$
r = \frac{h^2/\mu}{1 + e\cos\nu} .
$$

Two new symbols:

- $\mu$ ("mew") is the **[[gravitational parameter|mu]]** of the central body, how strongly it pulls: $3.986 \times 10^{14}\ \mathrm{m^3/s^2}$ for the Earth.
- $h$ is the **specific angular momentum** — "specific" means per kilogram of satellite. It is the size of the cross product of position and velocity, $|\mathbf{r} \times \mathbf{v}|$. When the velocity is at right angles to the radius, it is $rv$. It stays constant all the way around the orbit.

Compare with the polar form: the orbit is a conic with the planet at a focus, and its semi-latus rectum is $p = h^2/\mu$. The angle $\nu$, measured from periapsis, is called the **true anomaly**. The two-body module derives all this. Here are two checks that it hangs together.

**Check 1: a circular orbit.** In a circle the velocity is always at right angles to the radius, so $h = rv$. Gravity supplies exactly the pull needed to keep curving, which makes $v^2 = \mu/r$. Then

$$
p = \frac{h^2}{\mu} = \frac{r^2v^2}{\mu} = \frac{r^2(\mu/r)}{\mu} = r ,
$$

and the polar form with $e = 0$ says $r = p = r$. Consistent. At $7000$ km radius the circular speed is $\sqrt{3.986 \times 10^{14}/7 \times 10^6} = 7546$ m/s.

**Check 2: speeds on the transfer orbit.** From $p = h^2/\mu$, $h = \sqrt{\mu p} = \sqrt{3.986 \times 10^{14} \times 1.1358 \times 10^7} = 6.729 \times 10^{10}\ \mathrm{m^2/s}$. At perigee the velocity is again at right angles to the radius, so

$$
v_p = \frac{h}{r_p} = \frac{6.729 \times 10^{10}}{6.5631 \times 10^6} = 10\,252\ \mathrm{m/s}, \qquad v_a = \frac{h}{r_a} = 1596\ \mathrm{m/s}.
$$

The satellite is six times faster at perigee than at apogee. That is because $h = rv$ stays fixed while $r$ grows six times: like a figure skater, who spins faster with arms pulled in.

### Eccentricity and energy

Throw a ball up. If you throw it gently, it comes back down. Throw it hard enough and — if there were no air — it would never come back. Orbits have the same split, and the eccentricity is how you read it.

The **specific mechanical energy** of an orbit, $\varepsilon$ ("epsilon"), is the energy per kilogram:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} .
$$

The first part is motion energy. The second is height energy, counted so that it is zero infinitely far away and [[negative everywhere closer|negative-energy]]. Like $h$, $\varepsilon$ stays constant all the way around. The two-body analysis links it to the shape:

$$
\varepsilon = -\frac{\mu}{2a}, \qquad e^2 = 1 + \frac{2\varepsilon h^2}{\mu^2} .
$$

Test on the circle: $\varepsilon = \mu/2r - \mu/r = -\mu/2r$, and $h^2 = \mu r$, so $e^2 = 1 + 2(-\mu/2r)(\mu r)/\mu^2 = 1 - 1 = 0$. Consistent again. For the transfer orbit, $\varepsilon = -3.986 \times 10^{14}/(2 \times 2.43636 \times 10^7) = -8.18 \times 10^6\ \mathrm{J/kg}$, and $1 + 2\varepsilon h^2/\mu^2 = 0.5338$, which is $0.7306^2$.

This is what gives the eccentricity classes their physical meaning:

- **Negative energy: trapped.** To reach infinity, where height energy is zero, the motion energy would have to be negative — impossible. Negative $\varepsilon$ means positive $a$ and $e < 1$: an ellipse.
- **Zero energy: barely escaping.** As $\varepsilon$ rises toward zero, $a \to \infty$ and $e \to 1$. The ellipse stretches without limit and becomes a parabola. The body reaches infinity with exactly zero speed left. That is **escape**, and the speed that does it from radius $r$ is $\sqrt{2\mu/r}$ — $\sqrt 2$ times the circular speed, $10\,672$ m/s at $7000$ km.
- **Positive energy: escaping with speed to spare.** $\varepsilon > 0$ means $e > 1$: a hyperbola. The body arrives at infinity still moving, at $v_\infty = \sqrt{2\varepsilon}$, heading along the asymptote at angle $\nu_\infty = \arccos(-1/e)$ from periapsis.

::: example A hyperbolic flyby
A space probe swings past a planet on a hyperbola with $e = 1.5$ and $p = 7000$ km.

**Closest approach.** $r_p = p/(1 + e) = 7000/2.5 = 2800$ km.

**The asymptote.** $\nu_\infty = \arccos(-1/1.5) = \arccos(-0.6667) = 131.8^\circ$. The probe can never be at a larger true anomaly than that.

**The path.** Work out $r$ at a few angles:

| $\nu$ | $1 + e\cos\nu$ | $r$ (km) |
| --- | --- | --- |
| $0^\circ$ | 2.500 | 2 800 |
| $90^\circ$ | 1.000 | 7 000 |
| $120^\circ$ | 0.250 | 28 000 |
| $130^\circ$ | 0.0358 | 195 400 |
| $131^\circ$ | 0.0159 | 439 900 |
| $131.8^\circ$ | 0 | $\infty$ |

Between $130^\circ$ and $131^\circ$ the distance more than doubles. The probe is racing out along the asymptote.

**How much the planet bends the path.** The incoming and outgoing asymptotes are mirror images across the periapsis line, so the probe's direction of travel turns through

$$
\delta = 2\nu_\infty - 180^\circ = 83.6^\circ .
$$

Another way to write it: $\sin(\delta/2) = -\cos\nu_\infty = 1/e$. So a [[flyby's turning angle|gravity-assist]] depends on its eccentricity alone.

**The geometry-book numbers.** $a = p/(e^2 - 1) = 5600$ km and $c = ae = 8400$ km. The planet sits $8400$ km from the hyperbola's center and $2800$ km inside its tip.
:::

## Sweeping the eccentricity

Picture a [[family of curves sharing one $p$|conic-family]]. Hold $p$ fixed and turn $e$ up from $0$:

1. The circle of radius $p$ grows a near side and a far side. The periapsis $p/(1 + e)$ creeps in toward the focus while the apoapsis $p/(1 - e)$ runs away.
2. At $e = 1$ the far side has reached infinity: a parabola, with periapsis $p/2$.
3. Beyond $e = 1$ the far side is gone. The curve is a hyperbola, and its asymptotes close in from $180^\circ$ toward $90^\circ$ as $e$ grows. A hyperbola with a huge $e$ is nearly a straight line past the focus, barely bent.

Because $p$ is the same for all of them, every curve in the family passes through the same two points, $r = p$ at $\nu = \pm 90^\circ$. That is a handy check on a plot.

Physically, holding $p = h^2/\mu$ fixed means holding the angular momentum fixed while adding energy. Add energy to a circular orbit and its far side rises. Keep adding and the far side opens out to infinity. Add more and the body escapes, with the extra energy showing up as speed at infinity, $v_\infty$.

::: note Real orbits and the two-body idealization
Real satellites also feel the Earth's equatorial bulge, air drag, the Moon and the Sun, so their paths are not exactly conics. But over a fraction of an orbit the conic is an excellent description. The standard way to describe any orbit at a given moment is by the conic it *would* follow if those extra pushes stopped: the **[[osculating|osculating]]** ellipse. The orbital elements you will meet later — $a$, $e$, inclination and the rest — are this lesson's geometry plus three angles that tilt the orbit's plane in space.
:::

## Check yourself

::: check
An ellipse has semi-major axis $5$ and semi-minor axis $3$. Find its eccentricity, its semi-latus rectum, and its nearest and farthest distances from a focus.
:::

::: answer
First the focus distance: $c = \sqrt{a^2 - b^2} = \sqrt{25 - 9} = 4$. So $e = c/a = 4/5 = 0.8$.

Semi-latus rectum: $p = a(1 - e^2) = 5 \times (1 - 0.64) = 5 \times 0.36 = 1.8$. (It is also $b^2/a = 9/5$.)

Nearest distance $a(1 - e) = 5 \times 0.2 = 1$; farthest $a(1 + e) = 5 \times 1.8 = 9$.

Check with the polar form: $p/(1 + e) = 1.8/1.8 = 1$ and $p/(1 - e) = 1.8/0.2 = 9$. They match.
:::

::: check
A tracking station measures a satellite's distance as $6600$ km at periapsis and $8000$ km when its true anomaly is $90^\circ$. Find $e$, the apoapsis distance and the semi-major axis.
:::

::: answer
At $\nu = 90^\circ$ the distance *is* $p$, so $p = 8000$ km.

At periapsis $r_p = p/(1 + e)$, so $1 + e = 8000/6600 = 1.2121$ and $e = 0.2121$.

Apoapsis: $r_a = p/(1 - e) = 8000/0.7879 = 10\,154$ km.

Semi-major axis: $a = (r_p + r_a)/2 = (6600 + 10\,154)/2 = 8377$ km. Check: $p = a(1 - e^2) = 8377 \times 0.9550 = 8000$ km.
:::

::: check
For the hyperbola $x^2/9 - y^2/16 = 1$, find the eccentricity, the angle the asymptotes make with the $x$ axis, the semi-latus rectum, and the true anomaly of the asymptote in the focus-centered polar form.
:::

::: answer
Read off $a = 3$ and $b = 4$. For a hyperbola $c = \sqrt{a^2 + b^2} = \sqrt{9 + 16} = 5$, so $e = 5/3 = 1.667$.

The asymptotes have slopes $\pm b/a = \pm 4/3$, which is $\arctan(4/3) = 53.13^\circ$ to the axis.

$p = a(e^2 - 1) = 3 \times 16/9 = 16/3 = 5.333$. (Also $b^2/a$.)

$\nu_\infty = \arccos(-1/e) = \arccos(-0.6) = 126.87^\circ$.

The two angles add to $180^\circ$, as they must. Use the right-hand branch and its focus $(5, 0)$. From that focus, periapsis (the tip at $(3, 0)$) lies back toward the center, in the $-x$ direction. A point far out along the upper asymptote lies $53.13^\circ$ up from the $+x$ direction — so $180^\circ - 53.13^\circ$ from periapsis.
:::

::: check
The Earth's orbit around the Sun has $e = 0.0167$ and $a = 1.496 \times 10^8$ km. How much closer to the Sun is the Earth at its closest point (perihelion) than at its farthest (aphelion), in kilometers and as a ratio?
:::

::: answer
Perihelion: $a(1 - e) = 1.471 \times 10^8$ km. Aphelion: $a(1 + e) = 1.521 \times 10^8$ km.

The difference is $2ae = 5.00 \times 10^6$ km, and the ratio is $(1 + e)/(1 - e) = 1.034$.

A $3.4\%$ change in distance changes the sunlight received by about $7\%$, because sunlight weakens as $1/r^2$. That is not what causes the seasons (the tilt of the Earth's axis does), but it is a real term in a spacecraft's heat and power budget.
:::

::: check
A spacecraft on an escape path has $e = 2$. Over what range of true anomaly is the polar equation valid, and through what angle does the flyby turn its velocity?
:::

::: answer
$\nu_\infty = \arccos(-1/2) = 120^\circ$. So the equation is valid for $-120^\circ < \nu < 120^\circ$. Outside that range the denominator is zero or negative, and no point of the path exists there.

The turning angle is $\delta = 2\nu_\infty - 180^\circ = 240^\circ - 180^\circ = 60^\circ$. Or from $\sin(\delta/2) = 1/e = 0.5$: $\delta/2 = 30^\circ$, so $\delta = 60^\circ$.

A bigger $e$ means a straighter path and a smaller turn: at $e = 1.2$ the turn is $112.9^\circ$, at $e = 2$ it is $60^\circ$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Ellipse: $\lvert PF_1\rvert + \lvert PF_2\rvert = 2a$ | Locus rule; $x^2/a^2 + y^2/b^2 = 1$ centered, $c^2 = a^2 - b^2$ |
| Hyperbola: $\big\lvert\,\lvert PF_1\rvert - \lvert PF_2\rvert\,\big\rvert = 2a$ | $x^2/a^2 - y^2/b^2 = 1$, $c^2 = a^2 + b^2$, asymptotes $y = \pm(b/a)x$ |
| Parabola | Equally far from focus and directrix; $y^2 = 4qx$ |
| $e = c/a$ | Eccentricity; $\lvert PF\rvert = e\cdot\operatorname{dist}(P, L)$ defines every conic |
| $r = p/(1 + e\cos\nu)$ | Polar form, focus at origin, $\nu$ from periapsis; $p = eD$ |
| $e = 0$ / $0 < e < 1$ / $e = 1$ / $e > 1$ | Circle / ellipse / parabola (escape, $\varepsilon = 0$) / hyperbola ($\varepsilon > 0$) |
| $r_p = p/(1+e) = a(1-e)$, $r_a = p/(1-e) = a(1+e)$ | Periapsis and apoapsis |
| $p = a(1 - e^2)$, $e = (r_a - r_p)/(r_a + r_p)$ | Ellipse numbers from the two extreme distances |
| $\nu_\infty = \arccos(-1/e)$, $\sin(\delta/2) = 1/e$ | Hyperbola asymptote and turning angle |
| $p = h^2/\mu$ | Two-body orbit; $h = \lvert\mathbf{r}\times\mathbf{v}\rvert$ constant |
| $\varepsilon = -\mu/2a$, $e^2 = 1 + 2\varepsilon h^2/\mu^2$ | Energy fixes $a$; with $h$ it fixes $e$ |
| $v_{\mathrm{esc}} = \sqrt{2\mu/r}$ | Parabolic (escape) speed, $\sqrt 2$ times circular |

The last lesson of the module turns to **complex numbers**. The rotation matrix, polar coordinates and the identities that made both work all collapse into a single multiplication once a direction is written as $e^{i\theta}$.

::: context four-slices Four ways to slice a cone
Each little drawing is a double cone seen from the side, with the slicing plane seen edge-on as a red line. Flat across gives a circle. A gentle tilt gives an ellipse. A plane exactly parallel to the cone's side gives a parabola, which never closes. A steep plane cuts both halves of the double cone and gives the two branches of a hyperbola.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="12.4" y1="30" x2="77.6" y2="170"/><line x1="77.6" y1="30" x2="12.4" y2="170"/>
    <line x1="102.4" y1="30" x2="167.6" y2="170"/><line x1="167.6" y1="30" x2="102.4" y2="170"/>
    <line x1="192.4" y1="30" x2="257.6" y2="170"/><line x1="257.6" y1="30" x2="192.4" y2="170"/>
    <line x1="282.4" y1="30" x2="347.6" y2="170"/><line x1="347.6" y1="30" x2="282.4" y2="170"/>
  </g>
  <g stroke="#b4232c" stroke-width="3">
    <line x1="13" y1="150" x2="77" y2="150"/>
    <line x1="114.27" y1="125.73" x2="167.37" y2="159.27"/>
    <line x1="207.3" y1="112" x2="239.9" y2="182"/>
    <line x1="327" y1="22" x2="327" y2="178"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="200">circle</text><text x="135" y="200">ellipse</text>
    <text x="225" y="200">parabola</text><text x="315" y="200">hyperbola</text>
  </g>
</svg>
```
:::

::: context conic-history From Greek geometry to planets
Around 200 BC, Apollonius of Perga wrote a book called *Conics* and gave the curves the names we still use: ellipse, parabola and hyperbola. For eighteen centuries they were pure geometry. Then in 1609 Johannes Kepler showed that Mars moves on an ellipse with the Sun at one focus. In 1687 Isaac Newton proved why: an inverse-square pull like gravity always produces a conic. Every mission trajectory since has been designed on top of that result.
:::

::: context focus-word Why it is called a focus
"Focus" is Latin for a fireplace or hearth, and Kepler used it for these points in the early 1600s. The name fits a parabola perfectly: a parabola-shaped mirror sends every ray of light that comes in parallel to its axis through the focus. That is how a satellite dish gathers a weak radio signal onto its receiver, and how a solar cooker gathers sunlight hot enough to boil water. An ellipse does something similar — light from one focus bounces off the curve to the other focus.
:::

::: context ellipse-parts The parts of an ellipse
The string from the pencil at $P$ to the two pins always has the same total length, $2a$. Half the long width is $a$; half the short width is $b$; each focus is $c$ from the center. This one is drawn with $e = c/a = 0.6$, so $b = a\sqrt{1 - 0.36} = 0.8a$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="112" rx="110" ry="88" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="112" x2="300" y2="112" stroke="#6c7a93" stroke-width="1"/>
  <line x1="114" y1="112" x2="235" y2="35.79" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="246" y1="112" x2="235" y2="35.79" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="235" cy="35.79" r="4" fill="#1f2a44"/>
  <text x="243" y="30" font-size="12" fill="#1f2a44">P</text>
  <circle cx="114" cy="112" r="4" fill="#b4232c"/>
  <circle cx="246" cy="112" r="4" fill="#b4232c"/>
  <text x="110" y="104" font-size="12" fill="#b4232c" text-anchor="end">F₁</text>
  <text x="256" y="104" font-size="12" fill="#b4232c">F₂</text>
  <line x1="180" y1="112" x2="180" y2="24" stroke="#f2b880" stroke-width="3"/>
  <text x="172" y="62" font-size="12" text-anchor="end" fill="#1f2a44">b</text>
  <line x1="180" y1="128" x2="290" y2="128" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="235" y="144" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <line x1="180" y1="176" x2="246" y2="176" stroke="#b4232c" stroke-width="1.5"/>
  <text x="213" y="192" font-size="12" fill="#b4232c" text-anchor="middle">c</text>
  <circle cx="180" cy="112" r="2.5" fill="#1f2a44"/>
  <text x="20" y="214" font-size="11" fill="#1f2a44">PF₁ + PF₂ = 2a for every point on the curve</text>
</svg>
```
:::

::: context peri-apo Near and far
The words come from Greek: *peri* means "near" or "around", *apo* means "away from". The ending names what is being orbited: perigee and apogee for the Earth (*gē*, earth), perihelion and aphelion for the Sun (*hēlios*), perilune and apolune for the Moon. Periapsis and apoapsis are the general words that work for any body. The line through both points is the **line of apsides** — the long axis of the orbit.
:::

::: context gto The usual road to a geostationary orbit
A geostationary satellite circles $35\,786$ km above the equator, once per day, so it seems to hang still over one spot — ideal for TV and weather satellites. Rockets rarely fly straight there. They drop the satellite on a long ellipse that touches a low orbit at perigee and reaches geostationary height at apogee. At apogee the satellite fires its own engine to round the orbit out into a circle. The ellipse in between is the geostationary transfer orbit.
:::

::: context mu Why μ instead of G and M
Newton's gravity uses $G$, the universal gravitational constant, times $M$, the planet's mass. The trouble is that $G$ is hard to measure in a lab, and we only know it to about five figures. But the product $GM$ can be measured very precisely by tracking satellites, because it is what sets their orbits. So engineers use $\mu = GM$ directly, and never need $G$ or $M$ separately. For the Earth, $\mu$ is known to about nine or ten figures.
:::

::: context negative-energy Why height energy is negative
Pick where height energy counts as zero: infinitely far away, where gravity no longer pulls. Anything closer has to be given energy to climb out to there, so it has *less* than zero — its height energy is negative. The closer to the planet, the more negative: $-\mu/r$. An orbit whose total energy is negative is like a marble rolling inside a bowl. It can roll high up the sides, but it can never get out.
:::

::: context gravity-assist Borrowing a planet's speed
Seen from the planet, a flyby only turns the probe's velocity — it leaves at the same speed it arrived. But the planet itself is moving around the Sun. Turn the probe's velocity the right way and, seen from the Sun, the probe gains a great deal of speed. That is a **gravity assist**. Voyager 2 used flybys of Jupiter, Saturn and Uranus to reach Neptune in 12 years; a lower-eccentricity flyby, passing closer, turns the path more and gives a bigger kick.
:::

::: context conic-family One family, four shapes
All four curves share the same $p$ and the same focus (the dot). The circle has $e = 0$, the ellipse $e = 0.5$, the parabola $e = 1$ and the hyperbola $e = 1.5$. Every one passes through the same two points straight above and below the focus, where $r = p$. Periapsis is to the right; as $e$ grows, it moves closer to the focus and the far side opens up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="4" y1="110" x2="356" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="150" cy="110" r="40" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <ellipse cx="123.33" cy="110" rx="53.33" ry="46.19" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M45,10 Q295,110 45,210" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="107.3,204.9 122.4,186.6 132.3,174.2 139.2,165.1 144.4,158.1 148.3,152.5 151.4,147.9 153.9,144.0 155.9,140.6 157.6,137.6 159.0,135.0 160.1,132.6 161.1,130.5 162.0,128.5 162.7,126.7 163.3,125.0 163.8,123.3 164.3,121.8 164.7,120.3 165.0,118.9 165.3,117.6 165.5,116.3 165.7,115.0 165.8,113.7 165.9,112.5 166.0,111.2 166.0,110.0 166.0,108.8 165.9,107.5 165.8,106.3 165.7,105.0 165.5,103.7 165.3,102.4 165.0,101.1 164.7,99.7 164.3,98.2 163.8,96.7 163.3,95.0 162.7,93.3 162.0,91.5 161.1,89.5 160.1,87.4 159.0,85.0 157.6,82.4 155.9,79.4 153.9,76.0 151.4,72.1 148.3,67.5 144.4,61.9 139.2,54.9 132.3,45.8 122.4,33.4 107.3,15.1"/>
  <circle cx="150" cy="110" r="4" fill="#1f2a44"/>
  <circle cx="150" cy="70" r="3" fill="#1f2a44"/>
  <circle cx="150" cy="150" r="3" fill="#1f2a44"/>
  <line x1="190" y1="26" x2="206" y2="26" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="190" y1="46" x2="206" y2="46" stroke="#f2b880" stroke-width="2.5"/>
  <line x1="190" y1="66" x2="206" y2="66" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="190" y1="86" x2="206" y2="86" stroke="#1f2a44" stroke-width="2.5"/>
  <g font-size="12" fill="#1f2a44">
    <text x="212" y="30">hyperbola, e = 1.5</text><text x="212" y="50">parabola, e = 1</text>
    <text x="212" y="70">ellipse, e = 0.5</text><text x="212" y="90">circle, e = 0</text>
  </g>
  <text x="146" y="130" font-size="11" fill="#1f2a44" text-anchor="end">focus</text>
</svg>
```
:::

::: context osculating Kissing orbits
"Osculating" comes from the Latin for "kissing". The osculating ellipse touches the real, slightly wobbly path at one instant, with the same position and the same velocity, the way two curves kiss. A moment later the real path has drifted a little, and a slightly different ellipse kisses it. Tracking how that ellipse slowly changes is how engineers describe the effect of drag or the Earth's bulge on an orbit.
:::
