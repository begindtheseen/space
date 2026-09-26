---
id: l03-orbit-equation-conics
title: The orbit equation and conic sections
minutes: 20
covers:
  - the orbit equation and conic sections
---

Swing a flashlight beam across a wall and the patch of light changes shape: a circle, then a stretched oval, then a curve that opens up and never closes. Those shapes are the **conic sections**, and you met them in the trigonometry module. This lesson shows that they are not only pretty geometry. They are the *only* paths a spacecraft can follow under the pull of one planet.

The last lesson ended with one line of algebra: $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$. Here you read that line as a picture. Solved for $r$, it is the equation of a conic section with the planet at one focus. That is **Kepler's first law** — not as a pattern someone noticed in planet data, but as a theorem that follows from the inverse-square law. Perigee and apogee, the size of a transfer orbit, the bend of a flyby past a planet: all of it comes from this one equation and the geometry of conics.

For a GNC engineer, the orbit equation is the fastest tool there is. Give it a perigee and an apogee, and in two lines it gives you the orbit's shape. Give it a position on an incoming hyperbola, and it tells you how far the path will bend. Give it the constants $h$ and $e$ from the last lesson, and it hands you the distance and both velocity components at any point on the orbit — no integration needed.

The lesson derives the orbit equation, shows it gives an ellipse, parabola or hyperbola depending on $e$, works through the geometry of each, and finishes with the velocity along the orbit.

## From the eccentricity vector to the orbit equation

Start from the identity $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$. Write the dot product as $e\,r\cos\nu$, where $\nu$ is the angle between the eccentricity vector and the position vector, measured in the orbit plane in the direction the spacecraft moves. This angle is the **[[true anomaly|anomaly-word]]** — the spacecraft's angle around the orbit, counted from the closest point.

Now solve for $r$. Move $e\,r\cos\nu$ to the left to get $r + e\,r\cos\nu = h^2/\mu$. Factor out $r$ and divide:

$$
r = \frac{h^2/\mu}{1 + e\cos\nu} = \frac{p}{1 + e\cos\nu}, \qquad p = \frac{h^2}{\mu}.
$$

This is the **orbit equation**. It gives the distance from the planet as a function of the angle around the orbit, using two constants:

- $p$, the semi-latus rectum, which sets the **size**;
- $e$, the eccentricity, which sets the **shape**.

Read off the special points.

- **Periapsis.** Since $\mathbf{e}$ points toward periapsis, periapsis is at $\nu = 0$. There $\cos\nu = 1$, the bottom is as big as it gets, and $r$ is smallest: $p/(1 + e)$.
- **Apoapsis.** If $e < 1$, the farthest point is at $\nu = 180^\circ$. There $\cos\nu = -1$ and $r$ is largest: $p/(1 - e)$.
- **Side points.** At $\nu = \pm 90^\circ$, $\cos\nu = 0$ and $r = p$ exactly. So the semi-latus rectum is the distance from the planet to the orbit, measured at right angles to the long axis. That is its meaning as a picture.

::: key The orbit equation
$$
r = \frac{h^2/\mu}{1 + e\cos\nu} = \frac{p}{1 + e\cos\nu}.
$$
Periapsis is at $\nu = 0$ and apoapsis at $\nu = 180^\circ$. The true anomaly $\nu$ is measured from the eccentricity vector, in the direction of motion.
:::

Notice what the equation does *not* contain: time. It is the shape of the road, not a timetable. Where the spacecraft is on the road at a given moment is a separate question, answered by Kepler's equation later in the module.

## Why the orbit is a conic section

A conic can be defined without a cone. Pick a point, the **focus**, and a straight line, the **directrix**. A conic is every point whose distance from the focus is $e$ times its distance from the line. The orbit equation says exactly this, as the note below shows. But it is more convincing to turn the equation into $x$ and $y$ and recognize curves you already know.

Put the planet (the focus) at the origin, and point the $x$-axis along $\mathbf{e}$, toward periapsis. Then $x = r\cos\nu$ and $y = r\sin\nu$.

**Step 1: rearrange.** Multiply out the orbit equation: $r + e\,r\cos\nu = p$. Since $r\cos\nu = x$, this is $r = p - e x$.

**Step 2: square both sides**, and use $r^2 = x^2 + y^2$ (Pythagoras):

$$
x^2 + y^2 = p^2 - 2pe\,x + e^2 x^2 \quad\Longrightarrow\quad (1 - e^2)\,x^2 + 2pe\,x + y^2 = p^2.
$$

The second form moved $e^2x^2$ and $-2pe\,x$ over to the left.

**Step 3: look at the number in front of $x^2$.** That one coefficient, $1 - e^2$, decides which member of the **[[family of curves|conic-family]]** you have:

- If $e < 1$, the coefficient is positive. Both $x^2$ and $y^2$ have plus signs, and the curve closes up: an **ellipse**.
- If $e = 1$, the $x^2$ term vanishes and $y^2 = p^2 - 2px$: a **parabola**.
- If $e > 1$, the coefficient is negative. The signs of $x^2$ and $y^2$ differ, and the curve opens out: a **hyperbola**.

### Completing the square

For $e \neq 1$ you can put the equation into the standard shape you met in the conics lesson, by **[[completing the square|completing-square]]** in $x$. Divide everything by $1 - e^2$, then add $\left(pe/(1 - e^2)\right)^2$ to both sides so that the $x$ terms become a perfect square:

$$
\left(x + \frac{pe}{1 - e^2}\right)^2 + \frac{y^2}{1 - e^2} = \frac{p^2}{1 - e^2} + \frac{p^2 e^2}{(1 - e^2)^2} = \frac{p^2}{(1 - e^2)^2}.
$$

(The right side combined over the common denominator $(1 - e^2)^2$: $p^2(1 - e^2) + p^2 e^2 = p^2$.)

Now give the recurring combination a name, the **semi-major axis**:

$$
a = \frac{p}{1 - e^2}.
$$

Then $pe/(1 - e^2) = ae$, and dividing both sides by $a^2$ gives

$$
\frac{(x + ae)^2}{a^2} + \frac{y^2}{a^2(1 - e^2)} = 1.
$$

**For $e < 1$** this is the standard ellipse:

- its center is at $x = -ae$;
- its semi-major axis (half the long width) is $a$, along $x$;
- its **semi-minor axis** (half the short width) is $b = a\sqrt{1 - e^2}$, along $y$.

The planet sits at the origin, a distance $c = ae$ from the center. That gives $e = c/a$ — the textbook geometric definition of eccentricity, now produced by the physics.

**For $e > 1$**, $1 - e^2$ is negative, so $a = p/(1 - e^2)$ is negative too. Then $a^2(1 - e^2)$ is negative, and the $y^2$ term flips sign. The curve is the hyperbola $(x + ae)^2/a^2 - y^2/b^2 = 1$, with $b^2 = a^2(e^2 - 1)$.

So the single formula $a = p/(1 - e^2)$ serves all three shapes. Its sign follows the sign of the energy: positive for the bound ellipse, negative for the escaping hyperbola, and infinite at the parabola in between.

::: note The focus–directrix reading
Take the orbit equation in the form $r = p - e\,r\cos\nu$ and pull out a factor of $e$:

$$
r = e\left(\frac{p}{e} - r\cos\nu\right).
$$

The quantity in brackets is the horizontal distance from the orbit point $(r\cos\nu,\ r\sin\nu)$ to the vertical line $x = p/e$. So that line is the **[[directrix|directrix-picture]]**, and every point of the orbit is $e$ times as far from the focus as from the line.

Where does the line sit? At $x = p/e$, on the same side as periapsis and a little beyond it. (Periapsis is at $x = p/(1 + e)$, which is less than $p/e$ because $e < 1 + e$.) For the GTO worked below, the directrix is $11\,455.5/0.7283 = 15\,729\,\mathrm{km}$ from Earth's center in the perigee direction — beyond perigee at $6628\,\mathrm{km}$. Nothing physical sits there.

The reading is useful because it makes the role of $e$ visible. When $e < 1$, the orbit must stay closer to the focus than to the line, which hems it in: it closes. When $e > 1$, a point can run far away from both while keeping the ratio, which is why the hyperbola is open.
:::

## The ellipse

For a closed orbit, the numbers you will use constantly are the two **apsidal radii** — the distances at periapsis and apoapsis. From the orbit equation,

$$
r_p = \frac{p}{1 + e} = a(1 - e), \qquad r_a = \frac{p}{1 - e} = a(1 + e).
$$

The second form of each comes from writing $p = a(1 - e^2)$ and factoring, $1 - e^2 = (1 - e)(1 + e)$. For $r_p$, the $(1 + e)$ cancels, leaving $a(1 - e)$. For $r_a$, the $(1 - e)$ cancels.

Now add the two and divide by 2, then subtract them and divide by their sum:

$$
a = \frac{r_p + r_a}{2}, \qquad e = \frac{r_a - r_p}{r_a + r_p}.
$$

The picture makes the first one natural. Periapsis and apoapsis sit at opposite ends of the long axis, whose full length is $2a$, with the planet in between. So $r_p + r_a = 2a$. The second says the eccentricity measures how lopsided the two radii are: equal radii give $e = 0$, a circle.

Know any two of $\{a, e, r_p, r_a, p\}$ and you can find the rest. Mission requirements are almost always stated as a perigee altitude and an apogee altitude.

In guidance software these formulas run in both directions many times a second. A launch vehicle's target is usually a perigee radius and an apogee radius. The guidance converts them to $a$ and $e$, then to the energy $-\mu/(2a)$ and angular momentum $\sqrt{\mu a(1 - e^2)}$ it must reach at engine cutoff. It **[[steers on those two numbers|cutoff-targets]]**, because they are what the engine can change. Going the other way, an onboard navigation solution delivers $a$ and $e$, and the operators want perigee and apogee altitudes — the same formulas inverted, with $R = 6378.137\,\mathrm{km}$ subtracted.

::: key Apsides from a and e
$$
r_p = a(1 - e), \qquad r_a = a(1 + e), \qquad a = \frac{r_p + r_a}{2}.
$$
Also $e = (r_a - r_p)/(r_a + r_p)$, $p = a(1 - e^2)$ and $b = a\sqrt{1 - e^2}$.
:::

An ellipse has two foci. The planet occupies one. The **[[empty focus|empty-focus]]** lies $2ae$ from it along the long axis, and nothing physical sits there. For any point on the ellipse, the distances to the two foci add up to $2a$. That is the string-and-two-pins drawing trick from the conics lesson. But for orbit work, the useful facts are the ones in the key block above.

::: example The geometry of a GTO
A geostationary transfer orbit has perigee altitude $250\,\mathrm{km}$ and apogee altitude $35\,786\,\mathrm{km}$.

**Radii.** Add Earth's radius, $R = 6378.137\,\mathrm{km}$: $r_p = 6628.137\,\mathrm{km}$ and $r_a = 42\,164.137\,\mathrm{km}$.

**Semi-major axis and eccentricity.**

$$
a = \frac{6628.137 + 42\,164.137}{2} = 24\,396.14\,\mathrm{km}, \qquad
e = \frac{42\,164.137 - 6628.137}{42\,164.137 + 6628.137} = \frac{35\,536.0}{48\,792.27} = 0.7283.
$$

**Semi-latus rectum.** $e^2 = 0.53044$, so

$$
p = a(1 - e^2) = 24\,396.14 \times (1 - 0.53044) = 11\,455.5\,\mathrm{km}.
$$

At $\nu = 90^\circ$ the spacecraft is $11\,455.5\,\mathrm{km}$ from Earth's center — subtract $R$ to get about $5077\,\mathrm{km}$ of altitude.

**Semi-minor axis and focus offset.** $\sqrt{1 - e^2} = 0.68523$, so $b = 24\,396.14 \times 0.68523 = 16\,717.3\,\mathrm{km}$. The planet sits $c = ae = 17\,768.0\,\mathrm{km}$ from the center of the ellipse. **Sanity check:** $c$ should also be $a - r_p = 24\,396.14 - 6628.14 = 17\,768.0\,\mathrm{km}$. It is.

**Radii around the orbit**, from $r = p/(1 + e\cos\nu)$:

| $\nu$ | $0^\circ$ | $60^\circ$ | $90^\circ$ | $120^\circ$ | $180^\circ$ |
| --- | --- | --- | --- | --- | --- |
| $r$ (km) | $6628.1$ | $8397.5$ | $11\,455.5$ | $18\,016.2$ | $42\,164.1$ |

The first and last entries match $r_p$ and $r_a$, as they must. The radius grows slowly near perigee and fast near apogee. The spacecraft spends most of its time far out, as the time-of-flight lesson measures.
:::

## The parabola

At $e = 1$ the orbit equation reads $r = p/(1 + \cos\nu)$. A half-angle identity from trigonometry, $1 + \cos\nu = 2\cos^2(\nu/2)$, tidies it up:

$$
r = \frac{p}{2\cos^2(\nu/2)} = \frac{p}{2}\sec^2\frac{\nu}{2}.
$$

(Here $\sec$ means $1/\cos$.)

- Periapsis, at $\nu = 0$, is $r_p = p/2$.
- As $\nu$ approaches $\pm 180^\circ$, $\cos(\nu/2)$ goes to zero and $r$ goes to infinity. The two arms of the parabola become parallel to the axis, and the spacecraft never comes back.

There is no apoapsis, and $a$ is infinite, so every ellipse formula with $a$ in it is useless here. A parabola is described by $p$ alone.

The parabola is the knife-edge between bound and unbound motion, with $\varepsilon = 0$ exactly. No real orbit is ever *exactly* parabolic. But a path that barely escapes — like [[many comets|near-parabolic]] — is very close to one. And the parabolic formulas are the limit that both the elliptic and hyperbolic formulas must approach as $e \to 1$, which makes them a useful check on code.

## The hyperbola

For $e > 1$, the bottom of the orbit equation, $1 + e\cos\nu$, can reach zero. That happens at

$$
\cos\nu_\infty = -\frac{1}{e},
$$

where $\nu_\infty$ (read "nu infinity") is the true anomaly of the **asymptote**, the straight line the path approaches far away. Because $-1/e$ is between $-1$ and $0$, $\nu_\infty$ is between $90^\circ$ and $180^\circ$. The true anomaly can only range over $-\nu_\infty < \nu < \nu_\infty$. As $\nu$ approaches either end, the radius goes to infinity along one of the two asymptotes.

### The turning angle

A flyby bends the spacecraft's path. The angle between the incoming and outgoing directions is the **[[turning angle|turning-angle]]** $\delta$ (delta).

Each asymptote makes angle $\nu_\infty$ with the long axis, one on each side. Going in along one and out along the other, the direction of travel turns by $\delta = 2\nu_\infty - 180^\circ$. Take the sine of half of that:

$$
\sin\frac{\delta}{2} = \sin(\nu_\infty - 90^\circ) = -\cos\nu_\infty = \frac{1}{e}.
$$

The middle step uses $\sin(\theta - 90^\circ) = -\cos\theta$. So

$$
\sin\frac{\delta}{2} = \frac{1}{e}.
$$

Check the extremes. A slow, grazing flyby with $e$ barely above 1 has $\sin(\delta/2)$ near 1, so $\delta$ is near $180^\circ$ — the spacecraft is flung almost straight back. A very fast flyby with large $e$ has $\sin(\delta/2)$ near 0 — it is barely bent.

### Negative a, and the aiming radius

For a hyperbola, $a = p/(1 - e^2)$ is negative. Many books prefer the positive length $\lvert a \rvert = p/(e^2 - 1)$. This module keeps $a$ negative so that one formula — $\varepsilon = -\mu/(2a)$, derived in the next lesson — covers ellipses and hyperbolas alike. With that choice, the periapsis radius is still $r_p = a(1 - e)$. It comes out positive because both factors are negative, and it equals $\lvert a \rvert(e - 1)$.

The semi-minor axis $b = \lvert a \rvert\sqrt{e^2 - 1}$ has a physical job for a flyby. It is the **[[aiming radius|aiming-radius]]**, also called the impact parameter: the perpendicular distance between the incoming asymptote and the center of the planet. In plain words, it is how far the spacecraft would have missed the planet's center if gravity were switched off.

::: example A hyperbolic Earth departure
A spacecraft leaves Earth on a hyperbola with periapsis radius $r_p = 6678\,\mathrm{km}$ ($300\,\mathrm{km}$ altitude) and eccentricity $e = 1.4$.

**Size.** From $r_p = p/(1 + e)$, the semi-latus rectum is

$$
p = r_p(1 + e) = 6678 \times 2.4 = 16\,027.2\,\mathrm{km}.
$$

Then

$$
a = \frac{p}{1 - e^2} = \frac{16\,027.2}{1 - 1.96} = -16\,695\,\mathrm{km}.
$$

Negative, as a hyperbola's $a$ should be. **Check:** $r_p = a(1 - e) = (-16\,695)(-0.4) = 6678\,\mathrm{km}$. Correct.

**Asymptote and turning angle.** $\cos\nu_\infty = -1/1.4$, so $\nu_\infty = 135.6^\circ$. The turning angle is $\delta = 2\sin^{-1}(1/1.4) = 91.2^\circ$. **Check:** $2 \times 135.6^\circ - 180^\circ = 91.2^\circ$.

**Aiming radius.** $b = \lvert a \rvert\sqrt{e^2 - 1} = 16\,695 \times \sqrt{1.96 - 1} = 16\,358\,\mathrm{km}$.

**Speed at periapsis.** $h = \sqrt{\mu p} = \sqrt{398\,600.4418 \times 16\,027.2} = 79\,928\,\mathrm{km^2/s}$. At periapsis the velocity is horizontal, so $v = h/r_p = 79\,928/6678 = 11.969\,\mathrm{km/s}$.

**How fast it leaves.** At $\nu = 90^\circ$ the spacecraft is at $r = p = 16\,027\,\mathrm{km}$. At $\nu = 120^\circ$ it is already at

$$
r = \frac{16\,027.2}{1 + 1.4\cos 120^\circ} = \frac{16\,027.2}{1 - 0.7} = 53\,424\,\mathrm{km},
$$

well past geostationary radius.
:::

## Velocity along the orbit

The orbit equation, together with $h = r^2\dot{\nu}$ from the last lesson, gives the velocity at every point without any integration.

**Radial part.** Take the time derivative of $r = p/(1 + e\cos\nu)$. The chain rule gives

$$
\dot{r} = \frac{p\,e\sin\nu\,\dot{\nu}}{(1 + e\cos\nu)^2} = \frac{r^2}{p}\,e\sin\nu\,\dot{\nu} = \frac{h}{p}\,e\sin\nu.
$$

The middle step used $(1 + e\cos\nu)^2 = p^2/r^2$. The last step replaced $r^2\dot{\nu}$ by $h$.

**Tidy the constant.** Since $p = h^2/\mu$, the ratio $h/p = h\mu/h^2 = \mu/h$.

**Transverse part.** $v_\perp = r\dot{\nu} = h/r$, and $1/r = (1 + e\cos\nu)/p$, so $v_\perp = (h/p)(1 + e\cos\nu) = (\mu/h)(1 + e\cos\nu)$.

Together:

$$
v_r = \dot{r} = \frac{\mu}{h}\,e\sin\nu, \qquad v_\perp = r\dot{\nu} = \frac{h}{r} = \frac{\mu}{h}\left(1 + e\cos\nu\right).
$$

Both are the single speed scale $\mu/h$ times a simple factor. Read them:

- $v_r$ is zero at both apsides. It is positive (climbing) for $0 < \nu < 180^\circ$ and negative (descending) on the way back. It peaks at $\nu = 90^\circ$.
- $v_\perp$ is largest at periapsis, $(\mu/h)(1 + e)$, and smallest at apoapsis, $(\mu/h)(1 - e)$.

Square and add to get the speed:

$$
v^2 = v_r^2 + v_\perp^2 = \frac{\mu^2}{h^2}\left(1 + 2e\cos\nu + e^2\right),
$$

(using $\sin^2\nu + \cos^2\nu = 1$). The flight-path angle $\gamma$ — the tilt of the velocity above the local horizontal — comes from the ratio of the two parts:

$$
\tan\gamma = \frac{v_r}{v_\perp} = \frac{e\sin\nu}{1 + e\cos\nu}.
$$

These four formulas are what onboard guidance uses to turn a true anomaly into a velocity vector in the orbit plane.

::: example Speed and flight-path angle around the GTO
For the GTO above, $h = \sqrt{\mu p} = \sqrt{398\,600.4418 \times 11\,455.5} = 67\,573.4\,\mathrm{km^2/s}$, and the speed scale is $\mu/h = 398\,600.4418/67\,573.4 = 5.8988\,\mathrm{km/s}$. With $e = 0.7283$, work down the table. For example, at $\nu = 60^\circ$: $v_r = 5.8988 \times 0.7283 \times \sin 60^\circ = 3.721\,\mathrm{km/s}$ and $v_\perp = 5.8988 \times (1 + 0.7283 \times 0.5) = 8.047\,\mathrm{km/s}$.

| $\nu$ | $v_r$ (km/s) | $v_\perp$ (km/s) | $v$ (km/s) | $\gamma$ |
| --- | --- | --- | --- | --- |
| $0^\circ$ | $0$ | $10.195$ | $10.195$ | $0^\circ$ |
| $60^\circ$ | $3.721$ | $8.047$ | $8.865$ | $24.8^\circ$ |
| $90^\circ$ | $4.296$ | $5.899$ | $7.297$ | $36.1^\circ$ |
| $120^\circ$ | $3.721$ | $3.751$ | $5.283$ | $44.8^\circ$ |
| $180^\circ$ | $0$ | $1.603$ | $1.603$ | $0^\circ$ |

**Checks.** At $\nu = 90^\circ$ the transverse speed equals $\mu/h$ exactly, as the formula says. The speed falls from $10.2\,\mathrm{km/s}$ at perigee to $1.6\,\mathrm{km/s}$ at apogee. The ratio is $v_p/v_a = r_a/r_p = (1 + e)/(1 - e) = 6.36$, which also follows from $h = r_p v_p = r_a v_a$.

The flight-path angle keeps growing past $\nu = 90^\circ$ — in fact it peaks near $137^\circ$ (where $\cos\nu = -e$) — because $v_\perp$ keeps falling while $v_r$ has only begun to shrink.
:::

::: warning The sign convention for a
This module uses the convention in which $a = p/(1 - e^2)$ is negative for a hyperbola, so that $\varepsilon = -\mu/(2a)$ and $r_p = a(1 - e)$ hold for every conic. Some books define $a$ as positive for hyperbolas and write the same results with the signs changed by hand: $\varepsilon = +\mu/(2a)$ and $r_p = a(e - 1)$. Neither is wrong, but mixing them causes sign errors. When you read a hyperbola formula, check the author's convention first.
:::

::: warning ν is measured from periapsis, in the direction of motion
The true anomaly is the angle from the eccentricity vector to the position vector, growing in the direction the spacecraft moves. It is not measured from the ascending node (that angle is the argument of latitude), nor from any fixed axis in space. On a hyperbola it never reaches $180^\circ$. Ask for the radius at $\nu = 180^\circ$ with $e > 1$ and you get a negative number — the equation's way of saying that point does not exist.
:::

## Check yourself

::: check
An orbit around Earth has $h = 60\,000\,\mathrm{km^2/s}$ and $e = 0.3$. Find $p$, $a$, $r_p$ and $r_a$.
:::

::: answer
**Semi-latus rectum:** $p = h^2/\mu = (60\,000)^2/398\,600.4418 = 9031.6\,\mathrm{km}$.

**Semi-major axis:** $1 - e^2 = 1 - 0.09 = 0.91$, so $a = p/(1 - e^2) = 9031.6/0.91 = 9924.8\,\mathrm{km}$.

**Apsides:** $r_p = a(1 - e) = 9924.8 \times 0.7 = 6947.4\,\mathrm{km}$ (an altitude of $569\,\mathrm{km}$), and $r_a = a(1 + e) = 9924.8 \times 1.3 = 12\,902.3\,\mathrm{km}$.

**Check:** $(r_p + r_a)/2 = 9924.8\,\mathrm{km} = a$.
:::

::: check
Why does the coefficient of $x^2$ in $(1 - e^2)x^2 + 2pe\,x + y^2 = p^2$ decide whether the orbit is an ellipse, parabola or hyperbola?
:::

::: answer
The kind of curve is set by the signs of the squared terms. When $x^2$ and $y^2$ both have positive coefficients ($e < 1$), neither $x$ nor $y$ can grow without bound, so the curve is closed — an ellipse. When the $x^2$ term vanishes ($e = 1$), $x$ is a quadratic function of $y$, open in one direction — a parabola. When the coefficients have opposite signs ($e > 1$), $x$ and $y$ can both grow together along two directions, the asymptotes — a hyperbola. Completing the square then identifies $a = p/(1 - e^2)$ and $b^2 = a^2 \lvert 1 - e^2 \rvert$.
:::

::: check
A flyby hyperbola has $e = 2.5$. Through what angle does the planet turn the spacecraft's velocity, and what is the true anomaly of the outgoing asymptote?
:::

::: answer
**Turning angle:** $\sin(\delta/2) = 1/e = 0.4$, so $\delta/2 = 23.58^\circ$ and $\delta = 47.2^\circ$.

**Asymptote:** $\cos\nu_\infty = -1/e = -0.4$, so $\nu_\infty = 113.6^\circ$.

**Check:** $2\nu_\infty - 180^\circ = 227.2^\circ - 180^\circ = 47.2^\circ = \delta$.
:::

::: check
A satellite in an orbit with $e = 0.2$ is at $\nu = 90^\circ$. What is its flight-path angle, and is its distance from Earth growing or shrinking?
:::

::: answer
$\tan\gamma = e\sin\nu/(1 + e\cos\nu) = 0.2 \times 1/(1 + 0) = 0.2$, so $\gamma = \tan^{-1}0.2 = 11.3^\circ$ above the local horizontal. Since $v_r = (\mu/h)e\sin\nu > 0$ for $0 < \nu < 180^\circ$, the radius is growing: the satellite is climbing from periapsis toward apoapsis.
:::

::: check
For the ISS, $a = 6791\,\mathrm{km}$ and $e = 0.0006$. How far apart are perigee and apogee in altitude, and what does that say about using circular-orbit formulas for it?
:::

::: answer
$r_a - r_p = a(1 + e) - a(1 - e) = 2ae = 2 \times 6791 \times 0.0006 = 8.1\,\mathrm{km}$. Perigee and apogee altitudes differ by about 8 km on an orbit about 6800 km in radius, so $r$ varies by about one part in a thousand. The speed varies by about the same fraction: $v_p/v_a = (1 + e)/(1 - e) = 1.0012$, a spread of about $9\,\mathrm{m/s}$. Circular formulas are accurate to about 0.1 % for the ISS — good enough for rough planning, not good enough for rendezvous.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $r = \dfrac{p}{1 + e\cos\nu}$, $p = h^2/\mu$ | Orbit equation; $\nu$ is the true anomaly, from periapsis |
| $(1 - e^2)x^2 + 2pe\,x + y^2 = p^2$ | Cartesian form; the sign of $1 - e^2$ selects ellipse, parabola or hyperbola |
| $a = \dfrac{p}{1 - e^2}$ | Semi-major axis; negative for a hyperbola, infinite for a parabola |
| $r_p = a(1 - e)$, $r_a = a(1 + e)$ | Apsidal radii; $a = (r_p + r_a)/2$, $e = (r_a - r_p)/(r_a + r_p)$ |
| $b = a\sqrt{1 - e^2}$, $c = ae$ | Semi-minor axis and center-to-focus distance of the ellipse |
| $r = \tfrac{p}{2}\sec^2(\nu/2)$ | Parabola, $r_p = p/2$ |
| $\cos\nu_\infty = -1/e$, $\sin(\delta/2) = 1/e$ | Hyperbola asymptote and turning angle; aiming radius $b = \lvert a \rvert\sqrt{e^2 - 1}$ |
| $v_r = \dfrac{\mu}{h}e\sin\nu$, $v_\perp = \dfrac{\mu}{h}(1 + e\cos\nu)$ | Velocity components; $\tan\gamma = e\sin\nu/(1 + e\cos\nu)$ |

The next lesson adds time to the geometry. Kepler's second and third laws follow from $h = r^2\dot{\nu}$ and the area of the ellipse, and the vis-viva equation ties speed to radius and semi-major axis.

::: context anomaly-word Why "anomaly"?
In everyday English an anomaly is something odd. The astronomers who named these angles, working in Latin and before them in Greek, used it for the planets' *unevenness*: a planet does not move around the sky at a steady rate, and the angle that tracked this irregular motion got the name. The word stuck. This module meets three anomalies — true, eccentric and mean — and only the true anomaly is the actual angle you would see.
:::

::: context conic-family One focus, four shapes
Here are four orbits that share the same planet (focus) and the same periapsis, differing only in $e$. The bigger $e$, the more the far side flies open.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="210" cy="110" r="38" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <ellipse cx="172" cy="110" rx="76" ry="65.8" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M173.3,216.5 L178.6,212.7 L183.5,209.0 L187.9,205.5 L192.1,202.2 L195.9,199.0 L199.5,195.9 L202.7,192.9 L205.8,190.1 L208.7,187.3 L211.3,184.7 L213.8,182.1 L216.1,179.6 L218.3,177.2 L220.3,174.9 L222.2,172.6 L224.0,170.5 L225.6,168.3 L227.2,166.2 L228.7,164.2 L230.1,162.2 L231.4,160.3 L232.6,158.4 L233.7,156.6 L234.8,154.8 L235.8,153.0 L236.8,151.3 L237.7,149.6 L238.6,147.9 L239.4,146.3 L240.1,144.6 L240.8,143.0 L241.5,141.5 L242.1,139.9 L242.7,138.4 L243.2,136.9 L243.7,135.4 L244.2,134.0 L244.7,132.5 L245.1,131.1 L245.5,129.7 L245.8,128.2 L246.1,126.8 L246.4,125.5 L246.7,124.1 L246.9,122.7 L247.2,121.4 L247.3,120.0 L247.5,118.7 L247.6,117.3 L247.8,116.0 L247.9,114.6 L247.9,113.3 L248.0,112.0 L248.0,110.7 L248.0,109.3 L248.0,108.0 L247.9,106.7 L247.9,105.4 L247.8,104.0 L247.6,102.7 L247.5,101.3 L247.3,100.0 L247.2,98.6 L246.9,97.3 L246.7,95.9 L246.4,94.5 L246.1,93.2 L245.8,91.8 L245.5,90.3 L245.1,88.9 L244.7,87.5 L244.2,86.0 L243.7,84.6 L243.2,83.1 L242.7,81.6 L242.1,80.1 L241.5,78.5 L240.8,77.0 L240.1,75.4 L239.4,73.7 L238.6,72.1 L237.7,70.4 L236.8,68.7 L235.8,67.0 L234.8,65.2 L233.7,63.4 L232.6,61.6 L231.4,59.7 L230.1,57.8 L228.7,55.8 L227.2,53.8 L225.6,51.7 L224.0,49.5 L222.2,47.4 L220.3,45.1 L218.3,42.8 L216.1,40.4 L213.8,37.9 L211.3,35.3 L208.7,32.7 L205.8,29.9 L202.7,27.1 L199.5,24.1 L195.9,21.0 L192.1,17.8 L187.9,14.5 L183.5,11.0 L178.6,7.3 L173.3,3.5" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <path d="M204.6,213.0 L208.3,207.5 L211.6,202.6 L214.6,198.0 L217.3,193.7 L219.8,189.7 L222.0,186.0 L224.1,182.5 L226.0,179.2 L227.7,176.1 L229.3,173.2 L230.8,170.4 L232.1,167.7 L233.4,165.1 L234.6,162.7 L235.7,160.4 L236.7,158.1 L237.6,155.9 L238.5,153.9 L239.3,151.8 L240.0,149.9 L240.8,148.0 L241.4,146.1 L242.0,144.3 L242.6,142.6 L243.1,140.9 L243.6,139.2 L244.1,137.6 L244.5,136.0 L244.9,134.4 L245.3,132.9 L245.6,131.4 L245.9,129.9 L246.2,128.5 L246.5,127.0 L246.7,125.6 L246.9,124.2 L247.1,122.8 L247.3,121.4 L247.5,120.0 L247.6,118.7 L247.7,117.3 L247.8,116.0 L247.9,114.7 L247.9,113.3 L248.0,112.0 L248.0,110.7 L248.0,109.3 L248.0,108.0 L247.9,106.7 L247.9,105.3 L247.8,104.0 L247.7,102.7 L247.6,101.3 L247.5,100.0 L247.3,98.6 L247.1,97.2 L246.9,95.8 L246.7,94.4 L246.5,93.0 L246.2,91.5 L245.9,90.1 L245.6,88.6 L245.3,87.1 L244.9,85.6 L244.5,84.0 L244.1,82.4 L243.6,80.8 L243.1,79.1 L242.6,77.4 L242.0,75.7 L241.4,73.9 L240.8,72.0 L240.0,70.1 L239.3,68.2 L238.5,66.1 L237.6,64.1 L236.7,61.9 L235.7,59.6 L234.6,57.3 L233.4,54.9 L232.1,52.3 L230.8,49.6 L229.3,46.8 L227.7,43.9 L226.0,40.8 L224.1,37.5 L222.0,34.0 L219.8,30.3 L217.3,26.3 L214.6,22.0 L211.6,17.4 L208.3,12.5 L204.6,7.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="210" cy="110" r="5" fill="#1f2a44"/>
  <circle cx="248" cy="110" r="3" fill="#1f2a44"/>
  <text x="256" y="106" font-size="11" fill="#1f2a44">periapsis</text>
  <text x="8" y="22" font-size="11" fill="#1f2a44">e = 0 circle</text>
  <text x="8" y="37" font-size="11" fill="#1d6fd1">e = 0.5 ellipse</text>
  <text x="8" y="52" font-size="11" fill="#1f2a44">e = 1 parabola (orange)</text>
  <text x="8" y="67" font-size="11" fill="#b4232c">e = 1.5 hyperbola</text>
</svg>
```

The parabola and hyperbola run off the edge and never come back.
:::

::: context completing-square Completing the square, in one line
The trick turns $x^2 + 2kx$ into a perfect square by adding $k^2$: $x^2 + 2kx + k^2 = (x + k)^2$. Whatever you add to one side you add to the other, so the equation stays true. Here the role of $k$ is played by $pe/(1 - e^2)$. The payoff is that the new equation shows the center of the curve at a glance: the square is zero at $x = -k$, so that is where the middle sits.
:::

::: context directrix-picture The focus and the directrix
For every point $P$ on the orbit, the distance to the focus ($PF$) is $e$ times the distance to the directrix ($PD$). Here $e = 0.5$, so $PF$ is exactly half of $PD$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="110" cy="105" rx="80" ry="69.28" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="270" y1="15" x2="270" y2="185" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="150" cy="105" r="5" fill="#1d6fd1"/>
  <circle cx="190" cy="105" r="3" fill="#1f2a44"/>
  <circle cx="138.6" cy="40.3" r="4" fill="#b4232c"/>
  <line x1="138.6" y1="40.3" x2="150" y2="105" stroke="#b4232c" stroke-width="2"/>
  <line x1="138.6" y1="40.3" x2="270" y2="40.3" stroke="#1d6fd1" stroke-width="2"/>
  <text x="128" y="30" font-size="12" fill="#b4232c">P</text>
  <text x="152" y="78" font-size="12" fill="#b4232c">PF</text>
  <text x="200" y="34" font-size="12" fill="#1d6fd1">PD</text>
  <text x="130" y="124" font-size="11" fill="#1d6fd1">focus</text>
  <text x="195" y="120" font-size="11" fill="#1f2a44">periapsis</text>
  <text x="276" y="100" font-size="11" fill="#6c7a93">directrix</text>
  <text x="200" y="175" font-size="12" text-anchor="middle" fill="#1f2a44">PF = e × PD</text>
</svg>
```

Notice that the directrix is on the periapsis side, a little beyond the closest point.
:::

::: context cutoff-targets Why guidance aims at energy and angular momentum
A rocket's upper stage cannot aim directly at "perigee 250 km, apogee 35 786 km" — those points lie far ahead, in the future. What it can control is its speed and direction at the instant the engine shuts off. Energy and angular momentum at that instant fix $a$ and $e$ completely, so they make a tidy target. The Space Shuttle's ascent guidance, called Powered Explicit Guidance, worked in this spirit: it repeatedly re-solved for the steering that would reach the required cutoff conditions.
:::

::: context empty-focus The focus with nothing in it
An ellipse has two foci, placed symmetrically about its center. Gravity only cares about the one with the planet in it. The other one is a real geometric point — you would use it to draw the orbit with two pins and a loop of string — but no force comes from there. For a circle, the two foci merge at the center. For the GTO in this lesson, the empty focus is $2ae = 35\,536\,\mathrm{km}$ from Earth's center, out toward apogee.
:::

::: context near-parabolic Comets and interstellar visitors
Long-period comets fall in from the far edges of the solar system, and their orbits have eccentricities extremely close to 1 — nearly parabolic, because they started almost at rest very far away. A few objects arrive on plainly hyperbolic paths: the interstellar object 'Oumuamua, discovered in 2017, had $e \approx 1.2$, which is how astronomers knew it came from outside the solar system and would never return.
:::

::: context turning-angle How much a flyby bends the path
The hyperbola hugs the planet and leaves along a new direction. The two dashed lines are the asymptotes. The angle between the incoming and outgoing directions is $\delta$. Here $e = 2$, so $\sin(\delta/2) = 1/2$ and $\delta = 60^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="125" y1="215.3" x2="220" y2="50.7" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="125" y1="24.7" x2="202.5" y2="159" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <path d="M118.4,213.2 L121.5,207.0 L124.3,201.4 L126.7,196.3 L128.8,191.8 L130.7,187.7 L132.4,183.9 L134.0,180.5 L135.3,177.3 L136.6,174.3 L137.7,171.5 L138.8,168.9 L139.7,166.5 L140.6,164.2 L141.4,162.0 L142.2,160.0 L142.8,158.0 L143.5,156.1 L144.0,154.3 L144.6,152.6 L145.1,151.0 L145.5,149.4 L146.0,147.8 L146.4,146.4 L146.7,144.9 L147.1,143.5 L147.4,142.2 L147.7,140.9 L147.9,139.6 L148.2,138.3 L148.4,137.1 L148.6,135.9 L148.8,134.7 L149.0,133.5 L149.2,132.4 L149.3,131.2 L149.4,130.1 L149.5,129.0 L149.7,127.9 L149.7,126.9 L149.8,125.8 L149.9,124.7 L149.9,123.7 L150.0,122.6 L150.0,121.6 L150.0,120.5 L150.0,119.5 L150.0,118.4 L150.0,117.4 L149.9,116.3 L149.9,115.3 L149.8,114.2 L149.7,113.1 L149.7,112.1 L149.5,111.0 L149.4,109.9 L149.3,108.8 L149.2,107.6 L149.0,106.5 L148.8,105.3 L148.6,104.1 L148.4,102.9 L148.2,101.7 L147.9,100.4 L147.7,99.1 L147.4,97.8 L147.1,96.5 L146.7,95.1 L146.4,93.6 L146.0,92.2 L145.5,90.6 L145.1,89.0 L144.6,87.4 L144.0,85.7 L143.5,83.9 L142.8,82.0 L142.2,80.0 L141.4,78.0 L140.6,75.8 L139.7,73.5 L138.8,71.1 L137.7,68.5 L136.6,65.7 L135.3,62.7 L134.0,59.5 L132.4,56.1 L130.7,52.3 L128.8,48.2 L126.7,43.7 L124.3,38.6 L121.5,33.0 L118.4,26.8 L114.7,19.6 L110.5,11.4" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="136.0,175.8 136.7,185.8 128.4,182.4" fill="#1f2a44"/>
  <polygon points="134.7,61.1 142.3,67.7 134.0,71.1" fill="#1f2a44"/>
  <circle cx="120" cy="120" r="9" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M200,85.36 A40,40 0 0,0 160,85.36" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="72" font-size="13" text-anchor="middle" fill="#b4232c">δ</text>
  <text x="85" y="140" font-size="11" fill="#1f2a44">planet</text>
  <text x="100" y="208" font-size="11" fill="#1f2a44">in</text>
  <text x="96" y="40" font-size="11" fill="#1f2a44">out</text>
  <text x="240" y="110" font-size="12" fill="#1f2a44">e = 2</text>
  <text x="240" y="128" font-size="12" fill="#1f2a44">sin(δ/2) = 1/e</text>
  <text x="240" y="146" font-size="12" fill="#b4232c">δ = 60°</text>
</svg>
```

Mission designers use this bend on purpose: a gravity assist trades the direction of the spacecraft's motion, and with it speed relative to the Sun, for no propellant at all.
:::

::: context aiming-radius Aiming at a planet you mean to miss
When navigators steer a spacecraft to a planetary flyby, they do not aim at the planet. They aim at a point beside it, on an imaginary plane through the planet's center that stands at right angles to the incoming asymptote — the **B-plane**. The distance of the aim point from the planet's center is the aiming radius $b$. Choose $b$ and the incoming speed, and you have chosen $e$, the periapsis height and the turning angle all at once.
:::
