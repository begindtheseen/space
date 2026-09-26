---
id: l02-constants-of-motion
title: Constants of motion – angular momentum, energy and the eccentricity vector
minutes: 22
covers:
  - constants of motion: specific angular momentum, eccentricity vector, specific energy
---

Picture a marble rolling around inside a big salad bowl. It speeds up as it drops toward the bottom and slows down as it climbs the side. Its speed changes all the time. But something stays the same: the total of its "speed energy" and its "height energy". If you know that total, you know how fast the marble will be going at any height, without watching it at all. A number that never changes while everything else moves is called a **[[constant of motion|constant-of-motion]]**.

The two-body equation from the last lesson, $\ddot{\mathbf{r}} = -\mu \mathbf{r}/r^3$, is nonlinear, and nonlinear equations can usually be solved only by a computer stepping forward in small time steps. Gravity is the great exception. Hidden inside the equation are three quantities that never change as the spacecraft moves:

- a vector that fixes the **plane** of the orbit,
- a single number that fixes the orbit's **size**,
- a second vector that fixes the orbit's **shape and which way it points**.

Find them, and the hard differential equation turns into geometry you can draw.

For a GNC engineer these constants are working tools. A navigation filter that knows an orbit's energy and angular momentum already knows most of the orbit. A maneuver is designed by asking how a burn changes the energy and the angular momentum. And the third constant — the **eccentricity vector** — exists only because gravity is exactly inverse-square. Any extra force that is not inverse-square makes that vector slowly turn, and the turning is something you can see in real tracking data.

This lesson derives the three constants from the equation of motion, works out how they connect, and computes them for two real orbits. The next lesson uses them to write down the orbit itself.

## Why constants of motion matter

A constant of motion is a formula in the position and velocity whose value stays fixed along every possible path the spacecraft can follow. Each one is an equation the state must obey forever, and each one shrinks the space the path can wander in.

Think of it like a guessing game. The two-body state has six numbers: three for position, three for velocity. Each independent constant is one clue. With five independent clues, the path is pinned to a single curve — the orbit. The only question left is *where on that curve* the spacecraft is at a given moment. That last question is answered by Kepler's equation, several lessons from now. The five clues come out of the next three sections.

First, some notation. $\mathbf{r}$ is the position from the center of the central body, and $r = \lVert \mathbf{r} \rVert$ is its length. $\mathbf{v} = \dot{\mathbf{r}}$ is the velocity and $v = \lVert \mathbf{v} \rVert$ is the speed. $\hat{\mathbf{r}} = \mathbf{r}/r$ is the unit vector pointing from the center out to the spacecraft.

Two small derivative facts get used again and again. Since $r^2 = \mathbf{r} \cdot \mathbf{r}$, taking the time derivative of both sides gives $2 r \dot{r} = 2\,\mathbf{r} \cdot \mathbf{v}$. Divide by $2r$:

$$
\dot{r} = \frac{\mathbf{r} \cdot \mathbf{v}}{r}, \qquad \frac{d}{dt}\!\left(\frac{1}{r}\right) = -\frac{\dot{r}}{r^2} = -\frac{\mathbf{r} \cdot \mathbf{v}}{r^3}.
$$

Careful: $\dot{r}$ (read "r dot") is **not** the speed $v$. It is how fast the *distance* is changing — the part of the velocity that points straight out from the center, called the **radial** part. It is zero whenever the spacecraft is, for that instant, neither climbing nor descending.

## Specific angular momentum

Tie a ball to a string and swing it around your head. Now pull the string shorter. The ball whirls faster. That is angular momentum being conserved: the pull on the string points straight at your hand, so it can speed the ball up or slow it down only by changing its distance, never by twisting it around. Gravity from a planet is the same kind of pull — it always points straight at the center.

The precise statement. Define the **specific angular momentum** — "specific" means *per kilogram* of spacecraft — as

$$
\mathbf{h} = \mathbf{r} \times \mathbf{v},
$$

the **[[cross product|cross-product]]** of position and velocity (read "r cross v"). It is a vector, measured in $\mathrm{km^2/s}$.

Now take its time derivative. The product rule works for cross products as long as you keep the order:

$$
\dot{\mathbf{h}} = \dot{\mathbf{r}} \times \mathbf{v} + \mathbf{r} \times \dot{\mathbf{v}} = \mathbf{v} \times \mathbf{v} + \mathbf{r} \times \left(-\frac{\mu}{r^3}\mathbf{r}\right) = \mathbf{0} + \mathbf{0}.
$$

Both terms vanish, and for the same reason: the cross product of two parallel vectors is zero. The first term is $\mathbf{v}$ crossed with itself. The second is $\mathbf{r}$ crossed with the acceleration, which points along $\mathbf{r}$.

Notice what was *not* used: the $1/r^2$ strength of gravity. Only its direction mattered — that it points along the line to the center. A force like that is called **central**. So $\mathbf{h}$ is constant for any central force, not only gravity.

### What a constant h tells you

**The orbit stays in one plane.** A cross product is always perpendicular to both of the vectors in it. So $\mathbf{h}$ is perpendicular to $\mathbf{r}$ and to $\mathbf{v}$ at every instant. Since $\mathbf{h}$ never changes, $\mathbf{r}$ and $\mathbf{v}$ are stuck forever in the fixed flat plane through the center that is perpendicular to $\mathbf{h}$. That plane is the **orbit plane**. The three-dimensional problem is really a two-dimensional one. The direction $\hat{\mathbf{h}}$ later becomes two of the orbital elements, the inclination and the node.

**The size of h measures how fast the spacecraft sweeps around.** Split the velocity into two parts inside the orbit plane:

- a **radial** part $v_r = \dot{r}$, pointing straight out from the center;
- a **transverse** part $v_\perp$ (read "v perp", for perpendicular), pointing sideways, at right angles to $\mathbf{r}$.

Let $\nu$ (the Greek letter "nu", read "new") be the angle of $\mathbf{r}$ measured around the orbit plane; it will turn out to be the **true anomaly**. The transverse speed is the distance times how fast that angle turns, $v_\perp = r\dot{\nu}$. The radial part is parallel to $\mathbf{r}$, so it adds nothing to the cross product. That leaves

$$
h = \lVert \mathbf{h} \rVert = r\,v_\perp = r^2 \dot{\nu}.
$$

The angle between the velocity and the **local horizontal** (the direction at right angles to $\mathbf{r}$) is called the **[[flight-path angle|flight-path-angle]]**, $\gamma$ (gamma). Then $v_\perp = v \cos\gamma$, and so $h = r v \cos\gamma$. At the closest and farthest points of a closed orbit the velocity is exactly horizontal, $\gamma = 0$, and there $h = r v$ exactly.

One combination of $h$ and $\mu$ has units of length, and it turns out to be the natural size of the orbit:

$$
p = \frac{h^2}{\mu}.
$$

It is called the **[[semi-latus rectum|semi-latus-rectum]]**, or the **parameter** of the orbit. The next lesson shows it is the distance from the center to the orbit, measured at right angles to the long axis. For now, treat it as a handy abbreviation.

::: key Specific angular momentum
$\mathbf{h} = \mathbf{r} \times \mathbf{v}$ is constant for any central force. Its direction fixes the orbit plane, and its magnitude sets the semi-latus rectum $p = h^2/\mu$. In components, $h = r v_\perp = r^2\dot{\nu}$.
:::

## Specific energy

Back to the marble in the bowl. Low in the bowl it is fast; high up it is slow. Speed energy and height energy trade back and forth, but their sum stays fixed. A spacecraft does the same thing: fast near the planet, slow far away.

Here is the derivation. Take the dot product of the equation of motion with $\mathbf{v}$:

$$
\mathbf{v} \cdot \dot{\mathbf{v}} = -\frac{\mu}{r^3}\,\mathbf{r} \cdot \mathbf{v}.
$$

Look at each side separately.

- **Left side.** $\mathbf{v} \cdot \dot{\mathbf{v}}$ is half the derivative of $\mathbf{v} \cdot \mathbf{v} = v^2$. So it equals $\frac{d}{dt}\!\left(\tfrac{1}{2}v^2\right)$.
- **Right side.** By the derivative fact from earlier, $-\mathbf{r} \cdot \mathbf{v}/r^3 = \frac{d}{dt}(1/r)$. So the right side is $\mu \frac{d}{dt}(1/r)$.

Move everything to one side:

$$
\frac{d}{dt}\!\left(\frac{v^2}{2} - \frac{\mu}{r}\right) = 0.
$$

Something whose derivative is always zero never changes. So the **specific mechanical energy**

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}
$$

(the Greek letter epsilon, read "EP-sih-lon") is constant.

The first term, $v^2/2$, is **kinetic energy** — speed energy — per kilogram. The second term, $-\mu/r$, is **potential energy** — height energy — per kilogram. It is negative because the zero of potential energy is placed **[[infinitely far away|zero-at-infinity]]**. As you climb away from the planet, $-\mu/r$ rises toward zero but never gets above it.

That choice of zero makes the *sign* of $\varepsilon$ meaningful:

- **$\varepsilon < 0$.** The spacecraft can never reach infinity, because there its potential energy would be zero and its kinetic energy would have to be negative — impossible. It is **bound**. Its orbit closes on itself: an **ellipse**.
- **$\varepsilon = 0$.** It barely reaches infinity, arriving with zero speed: a **parabola**.
- **$\varepsilon > 0$.** It reaches infinity still moving: a **hyperbola**.

One number's sign tells you which kind of orbit you have.

The units of $\varepsilon$ are $\mathrm{km^2/s^2}$. One $\mathrm{m^2/s^2}$ is one joule per kilogram, so $1\,\mathrm{km^2/s^2} = 10^6\,\mathrm{J/kg}$, a megajoule per kilogram. Typical sizes: about $-29\,\mathrm{km^2/s^2}$ for a low Earth orbit, and $-4.7\,\mathrm{km^2/s^2}$ at geostationary radius. In two lessons you will show that $\varepsilon = -\mu/(2a)$, where $a$ is the orbit's semi-major axis. That result is the heart of the vis-viva equation, and it is derived there rather than assumed here.

::: key Specific mechanical energy
$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}
$$
is constant along the orbit. Negative for an ellipse, zero for a parabola, positive for a hyperbola.
:::

::: note Why angular momentum and energy use different facts
Angular momentum only needed gravity's *direction* (central). Energy only needed that gravity comes from a potential — that the work it does depends only on where you start and end, not the path between. Such a force is called **conservative**. The eccentricity vector, next, needs something stronger: the exact $1/r^2$ strength.
:::

## The eccentricity vector

Angular momentum pins the plane, and energy pins the size. But an orbit also has a *direction*: a closest point, and the long axis pointing some particular way in space. Under exact inverse-square gravity that direction never moves. The orbit retraces itself, lap after lap, like a train on a fixed track. The constant that records this is an arrow, the **eccentricity vector** $\mathbf{e}$. It points from the center of the planet toward the orbit's closest point, and its length says how stretched the orbit is.

Here is the formula:

$$
\mathbf{e} = \frac{\mathbf{v} \times \mathbf{h}}{\mu} - \hat{\mathbf{r}}.
$$

The proof that it never changes is a page of vector algebra, so it sits in the note below. The key fact to take from it: the proof works *only* because gravity is exactly $1/r^2$. With any other power of $r$, no such constant vector exists. This is why orbits under pure inverse-square gravity close on themselves, while orbits under almost any other central force slowly **[[precess|apsidal-precession]]** — their long axis creeps around.

::: note Why it has to be true
Take the time derivative of $\mathbf{v} \times \mathbf{h}$. Since $\mathbf{h}$ is constant, only $\mathbf{v}$ changes, and $\dot{\mathbf{v}}$ is gravity:

$$
\frac{d}{dt}(\mathbf{v} \times \mathbf{h}) = \dot{\mathbf{v}} \times \mathbf{h} = -\frac{\mu}{r^3}\,\mathbf{r} \times (\mathbf{r} \times \mathbf{v}).
$$

Expand the double cross product with the **[[vector triple product|triple-product]]** identity $\mathbf{a} \times (\mathbf{b} \times \mathbf{c}) = \mathbf{b}(\mathbf{a} \cdot \mathbf{c}) - \mathbf{c}(\mathbf{a} \cdot \mathbf{b})$. With $\mathbf{a} = \mathbf{b} = \mathbf{r}$ and $\mathbf{c} = \mathbf{v}$:

$$
\mathbf{r} \times (\mathbf{r} \times \mathbf{v}) = \mathbf{r}\,(\mathbf{r} \cdot \mathbf{v}) - \mathbf{v}\,r^2.
$$

Put that back and share out the $-\mu/r^3$:

$$
\frac{d}{dt}(\mathbf{v} \times \mathbf{h}) = -\frac{\mu}{r^3}\left[\mathbf{r}\,(\mathbf{r} \cdot \mathbf{v}) - r^2 \mathbf{v}\right] = \mu\left[\frac{\mathbf{v}}{r} - \frac{(\mathbf{r} \cdot \mathbf{v})\,\mathbf{r}}{r^3}\right].
$$

Now, separately, take the derivative of the unit vector $\hat{\mathbf{r}} = \mathbf{r}/r$ with the quotient rule, using $\dot{r} = \mathbf{r} \cdot \mathbf{v}/r$:

$$
\frac{d}{dt}\!\left(\frac{\mathbf{r}}{r}\right) = \frac{\mathbf{v}}{r} - \frac{\dot{r}\,\mathbf{r}}{r^2} = \frac{\mathbf{v}}{r} - \frac{(\mathbf{r} \cdot \mathbf{v})\,\mathbf{r}}{r^3}.
$$

The two brackets are identical. So the first derivative is exactly $\mu$ times the second, and

$$
\frac{d}{dt}\left[\frac{\mathbf{v} \times \mathbf{h}}{\mu} - \frac{\mathbf{r}}{r}\right] = \mathbf{0}.
$$

The match needed the $1/r^3$ in $-\mu\mathbf{r}/r^3$. With a force like $1/r^{2.1}$ the first bracket would carry a different power of $r$ and the two would not cancel.
:::

### A form for computing

The cross-product form is neat, but code usually wants something with only $\mathbf{r}$, $\mathbf{v}$ and $\mu$. Substitute $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ and expand with the same triple-product identity, $\mathbf{v} \times (\mathbf{r} \times \mathbf{v}) = \mathbf{r}\,v^2 - \mathbf{v}\,(\mathbf{r} \cdot \mathbf{v})$. Then collect the $\mathbf{r}$ terms, remembering $\hat{\mathbf{r}} = \mathbf{r}/r = (\mu/r)\,\mathbf{r}/\mu$:

$$
\mathbf{e} = \frac{\left(v^2 - \dfrac{\mu}{r}\right)\mathbf{r} - (\mathbf{r} \cdot \mathbf{v})\,\mathbf{v}}{\mu}.
$$

This form needs only the state vector and $\mu$, with no cross products. It is the one used in every conversion from a state vector to orbital elements. Its length $e = \lVert \mathbf{e} \rVert$ is the **eccentricity** of the orbit, a pure number with no units.

In physics books the same vector, multiplied by $m^2 \mu$ (with $m$ the spacecraft mass), is called the **[[Laplace–Runge–Lenz vector|lrl-vector]]**. The eccentricity vector is the astrodynamicist's rescaled version of it.

### Where it points and how long it is

Three facts pin down the geometry.

**It lies in the orbit plane.** $\mathbf{v} \times \mathbf{h}$ is perpendicular to $\mathbf{h}$, because a cross product is perpendicular to both its factors. $\hat{\mathbf{r}}$ is perpendicular to $\mathbf{h}$ because $\mathbf{r}$ is. So $\mathbf{e} \cdot \mathbf{h} = 0$: the eccentricity vector lies flat in the orbit plane.

**It points at the closest point.** Dot $\mathbf{e}$ with $\mathbf{r}$:

$$
\mathbf{e} \cdot \mathbf{r} = \frac{\mathbf{r} \cdot (\mathbf{v} \times \mathbf{h})}{\mu} - r = \frac{(\mathbf{r} \times \mathbf{v}) \cdot \mathbf{h}}{\mu} - r = \frac{h^2}{\mu} - r.
$$

The middle step uses the fact that in a scalar triple product you can cycle the three vectors around without changing the answer: $\mathbf{r} \cdot (\mathbf{v} \times \mathbf{h}) = \mathbf{h} \cdot (\mathbf{r} \times \mathbf{v}) = \mathbf{h} \cdot \mathbf{h} = h^2$.

Now write the dot product as $\mathbf{e} \cdot \mathbf{r} = e\,r\cos\nu$, where $\nu$ is the angle from $\mathbf{e}$ to $\mathbf{r}$. Rearranged, the identity says

$$
r(1 + e\cos\nu) = \frac{h^2}{\mu} = p.
$$

The right side is fixed. So $r$ is smallest where $1 + e\cos\nu$ is largest — where $\cos\nu = 1$, meaning $\mathbf{r}$ points the same way as $\mathbf{e}$. The closest point of the orbit is called **[[periapsis|peri-apo]]**. So $\mathbf{e}$ points from the central body toward periapsis, and the angle $\nu$ measured from it is the **true anomaly**. The next lesson turns this one line into the full orbit equation.

**Its length comes from energy and angular momentum.** Take $\mathbf{e} \cdot \mathbf{e}$ and multiply out the square of $(\mathbf{v} \times \mathbf{h})/\mu - \hat{\mathbf{r}}$. You need two pieces. Because $\mathbf{v}$ is perpendicular to $\mathbf{h}$, the length of $\mathbf{v} \times \mathbf{h}$ is $v h$. And by the triple-product cycle again, $(\mathbf{v} \times \mathbf{h}) \cdot \hat{\mathbf{r}} = \mathbf{h} \cdot (\hat{\mathbf{r}} \times \mathbf{v}) = h^2/r$. So

$$
e^2 = \frac{v^2 h^2}{\mu^2} - \frac{2h^2}{\mu r} + 1 = 1 + \frac{h^2}{\mu^2}\left(v^2 - \frac{2\mu}{r}\right) = 1 + \frac{2\varepsilon h^2}{\mu^2}.
$$

The last step used $v^2 - 2\mu/r = 2\varepsilon$. Memorize this result alongside the definitions: **eccentricity is fixed by energy and angular momentum together.**

It also confirms the energy classification. If $\varepsilon < 0$, the fraction is negative and $e < 1$. If $\varepsilon = 0$, then $e = 1$. If $\varepsilon > 0$, then $e > 1$.

::: key The eccentricity vector
$$
\mathbf{e} = \frac{\left(v^2 - \mu/r\right)\mathbf{r} - (\mathbf{r} \cdot \mathbf{v})\,\mathbf{v}}{\mu} = \frac{\mathbf{v} \times \mathbf{h}}{\mu} - \hat{\mathbf{r}}.
$$
It is constant, lies in the orbit plane, points from the focus toward periapsis, and its magnitude is the eccentricity $e$. It is the Laplace–Runge–Lenz vector scaled by $1/(m^2\mu)$, and $e^2 = 1 + 2\varepsilon h^2/\mu^2$.
:::

### Counting the constants

You now have seven numbers that never change: three components of $\mathbf{h}$, three of $\mathbf{e}$, and $\varepsilon$. But they are not all independent. Two relations tie them together: $\mathbf{e} \cdot \mathbf{h} = 0$ and $e^2 = 1 + 2\varepsilon h^2/\mu^2$. Seven minus two leaves **five independent constants**. Five clues pin the six-number state to a single curve, exactly as promised.

The sixth piece of information is a *time* — for example, the moment the spacecraft passes periapsis. It tells you where on the curve the spacecraft is at a given instant. It is the one piece that cannot be computed from $(\mathbf{r}, \mathbf{v})$ alone, because the same position and velocity could be reached at any clock time.

## Two orbits, numerically

::: example Constants of motion for an ISS-like state
A spacecraft in an ISS-like orbit has, in an Earth-centered inertial frame,

$$
\mathbf{r} = (-2267.240,\;-3989.573,\;5001.268)\,\mathrm{km}, \qquad
\mathbf{v} = (5.0098,\;-5.4258,\;-2.0540)\,\mathrm{km/s}.
$$

**Lengths.** $r = 6787.47\,\mathrm{km}$ and $v = 7.6653\,\mathrm{km/s}$.

**Angular momentum.** Work out the cross product component by component:

$$
\mathbf{h} = \mathbf{r} \times \mathbf{v} = (35\,330.5,\;20\,398.4,\;32\,288.6)\,\mathrm{km^2/s}, \qquad h = 52\,027.8\,\mathrm{km^2/s}.
$$

The semi-latus rectum is

$$
p = \frac{h^2}{\mu} = \frac{(52\,027.8)^2}{398\,600.4418} = 6790.98\,\mathrm{km}.
$$

The tilt of the orbit plane from the equator is the angle between $\mathbf{h}$ and the $z$-axis (the north pole). Its cosine is the $z$-component over the length: $\cos^{-1}(32\,288.6/52\,027.8) = 51.64^\circ$. That is the ISS inclination.

**Energy.**

$$
\varepsilon = \frac{7.6653^2}{2} - \frac{398\,600.4418}{6787.47} = 29.378 - 58.726 = -29.348\,\mathrm{km^2/s^2}.
$$

Negative, so the orbit is closed.

**Eccentricity vector.** First the two scalars in the formula. The dot product is $\mathbf{r} \cdot \mathbf{v} = 15.60\,\mathrm{km^2/s}$ — slightly positive, so the spacecraft is climbing very gently. And $v^2 - \mu/r = 58.756 - 58.726 = 0.0304\,\mathrm{km^2/s^2}$. Then

$$
\mathbf{e} = \frac{0.0304\,\mathbf{r} - 15.60\,\mathbf{v}}{398\,600.4} = (-3.69,\;-0.92,\;4.62) \times 10^{-4}, \qquad e = 5.98 \times 10^{-4}.
$$

The orbit is very nearly a circle.

**Checks.** The identity predicts $e^2 = 1 + 2\varepsilon h^2/\mu^2 = 1 + 2(-29.348)(52\,027.8)^2/(398\,600.4)^2 = 3.58 \times 10^{-7}$. Directly, $e^2 = (5.98 \times 10^{-4})^2 = 3.58 \times 10^{-7}$. They agree. And $\mathbf{e} \cdot \mathbf{h}$ comes out around $10^{-15}$ — zero, apart from computer rounding — so $\mathbf{e}$ is in the orbit plane as it must be.
:::

::: example A geostationary transfer orbit at perigee
A **[[geostationary transfer orbit|gto]]** (GTO) has perigee altitude $250\,\mathrm{km}$ and apogee at geostationary altitude, $35\,786\,\mathrm{km}$. Add Earth's radius to get distances from the center: $r_p = 6628.137\,\mathrm{km}$ and $r_a = 42\,164.137\,\mathrm{km}$. At perigee the speed is $v_p = 10.1949\,\mathrm{km/s}$ and the velocity is horizontal, so $\mathbf{r} \cdot \mathbf{v} = 0$. Point the $x$-axis at perigee and the velocity along $y$.

**Angular momentum.** Velocity is horizontal, so $h = r_p v_p = 6628.137 \times 10.1949 = 67\,573.4\,\mathrm{km^2/s}$, pointing along $+z$. The semi-latus rectum is $p = h^2/\mu = 11\,455.5\,\mathrm{km}$.

**Energy.**

$$
\varepsilon = \frac{10.1949^2}{2} - \frac{398\,600.4418}{6628.137} = 51.968 - 60.138 = -8.169\,\mathrm{km^2/s^2}.
$$

Negative, so closed — but much less negative than the ISS, because this orbit reaches much farther out.

**Eccentricity vector.** With $\mathbf{r} \cdot \mathbf{v} = 0$ the second term drops out. What is left points along $\mathbf{r}$, which is $r_p\hat{\mathbf{x}}$:

$$
\mathbf{e} = \frac{(v_p^2 - \mu/r_p)\,\mathbf{r}}{\mu} = \left(\frac{v_p^2 r_p}{\mu} - 1\right)\hat{\mathbf{x}} = \left(\frac{10.1949^2 \times 6628.137}{398\,600.4} - 1\right)\hat{\mathbf{x}} = 0.7283\,\hat{\mathbf{x}}.
$$

The vector points along $\mathbf{r}$ at perigee, as it must, and $e = 0.7283$: a long, stretched ellipse.

**Checking from the other end.** At apogee, the speed is $v_a = 1.6026\,\mathrm{km/s}$, the velocity is again horizontal, and the same construction gives $\mathbf{e} = (v_a^2 r_a/\mu - 1)\hat{\mathbf{r}}_a$. The bracket is

$$
\frac{1.6026^2 \times 42\,164.137}{398\,600.4} - 1 = -0.7283.
$$

At apogee the spacecraft is on the opposite side, so $\hat{\mathbf{r}}_a = -\hat{\mathbf{x}}$. A negative number times $-\hat{\mathbf{x}}$ gives $\mathbf{e} = +0.7283\,\hat{\mathbf{x}}$ again. The same constant, from opposite ends of the orbit.
:::

## Perturbations and the turning eccentricity vector

Because $\mathbf{e}$ stays fixed only under an exact inverse-square force, watching it is a sensitive test for any extra force.

Earth's equatorial bulge adds a small force that is not inverse-square. Under it, $\mathbf{e}$ slowly rotates within the orbit plane — a few degrees per day in low orbit — while its length stays nearly the same. Observers call this **apsidal precession**: the perigee marches around the orbit. It is not a new thing to memorize. It is exactly what $\dot{\mathbf{e}} \neq \mathbf{0}$ looks like once the force law is no longer exactly $1/r^2$.

The bulge does something similar to $\mathbf{h}$: its direction drifts, so the orbit plane slowly swings around Earth's pole. The energy $\varepsilon$, on the other hand, stays conserved under any extra force that is steady and conservative, like the bulge. So: **which constant an extra force breaks tells you what it does to the orbit.**

::: warning e is not a unit vector, and h is per unit mass
The eccentricity vector has length $e$, which is $0.0006$ for the ISS and $0.73$ for a GTO. Only a parabola has $\lVert \mathbf{e} \rVert = 1$. If you normalize it to get its direction, do not forget that its length carried information. Likewise, $\mathbf{h}$ and $\varepsilon$ are *specific* quantities — per kilogram — with units $\mathrm{km^2/s}$ and $\mathrm{km^2/s^2}$. The spacecraft mass never appears, because it cancelled out of the equation of motion in the first place.
:::

::: warning Sign of r·v
The sign of $\mathbf{r} \cdot \mathbf{v} = r\dot{r}$ tells you whether the spacecraft is moving away from the center (positive: between periapsis and apoapsis) or toward it (negative: between apoapsis and periapsis). This sign is what picks the correct half of the orbit for the true anomaly when you convert a state vector to orbital elements. In the ISS example it was $+15.6\,\mathrm{km^2/s}$, so the spacecraft had passed perigee less than half an orbit earlier.
:::

## Check yourself

::: check
Which property of the gravitational force makes $\mathbf{h}$ constant, which makes $\varepsilon$ constant, and which makes $\mathbf{e}$ constant?
:::

::: answer
$\mathbf{h}$ is constant because the force is **central** — parallel to $\mathbf{r}$ — so $\mathbf{r} \times \ddot{\mathbf{r}} = \mathbf{0}$. Any central force will do. $\varepsilon$ is constant because the force is **conservative** — it comes from the potential $-\mu/r$. Any conservative force will do. $\mathbf{e}$ is constant only because the force is **exactly inverse-square**: the derivation matched $\frac{d}{dt}(\mathbf{v} \times \mathbf{h})$ to $\mu\,\frac{d}{dt}\hat{\mathbf{r}}$, and that match needs the $1/r^3$ in $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$.
:::

::: check
A spacecraft at $r = 7000\,\mathrm{km}$ has speed $8.0\,\mathrm{km/s}$ with a flight-path angle of $10^\circ$ above the local horizontal. Compute $h$, $\varepsilon$ and $e$.
:::

::: answer
**Angular momentum:** $h = r v \cos\gamma = 7000 \times 8.0 \times \cos 10^\circ = 55\,149\,\mathrm{km^2/s}$.

**Energy:** $\varepsilon = 8.0^2/2 - 398\,600.4418/7000 = 32.000 - 56.943 = -24.943\,\mathrm{km^2/s^2}$. Negative, so the orbit is bound.

**Eccentricity:** $e^2 = 1 + 2\varepsilon h^2/\mu^2 = 1 + 2(-24.943)(55\,149)^2/(398\,600.4418)^2 = 1 - 0.9549 = 0.0451$, so $e = 0.212$. Less than 1, which agrees with the negative energy.
:::

::: check
Using only the identity $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$, explain why the eccentricity vector must point toward periapsis.
:::

::: answer
Rearranged, $r = h^2/\mu - \mathbf{e} \cdot \mathbf{r} = h^2/\mu - e\,r\cos\nu$, where $\nu$ is the angle between $\mathbf{e}$ and $\mathbf{r}$. Equivalently $r = (h^2/\mu)/(1 + e\cos\nu)$. Since $h^2/\mu$ is fixed, $r$ is smallest when $1 + e\cos\nu$ is largest, which happens when $\cos\nu = 1$ — the position vector points the same way as $\mathbf{e}$. So the point of closest approach, periapsis, lies in the direction of $\mathbf{e}$ from the focus.
:::

::: check
Why does a spacecraft under pure two-body gravity pass through exactly the same perigee point every orbit? What changes when Earth's bulge is included?
:::

::: answer
The perigee direction is the direction of $\mathbf{e}$, and $\mathbf{e}$ is a constant of two-body motion, so the perigee cannot move. The bulge adds a force that is not inverse-square. The proof that $\dot{\mathbf{e}} = \mathbf{0}$ then fails, and $\mathbf{e}$ rotates slowly within the orbit plane. The perigee precesses around the orbit at a rate set by the extra force — for the ISS, a few degrees per day.
:::

::: check
How many independent scalar constants of motion do $\mathbf{h}$, $\mathbf{e}$ and $\varepsilon$ give, and what is still missing to locate the spacecraft?
:::

::: answer
Seven numbers ($3 + 3 + 1$), minus two relations ($\mathbf{e} \cdot \mathbf{h} = 0$ and $e^2 = 1 + 2\varepsilon h^2/\mu^2$), leave five independent constants. They confine the state to a single curve, the orbit. Still missing is a sixth piece of information — a time, such as the moment of periapsis passage — which places the spacecraft on the curve at a given instant. It is not a function of the state alone.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ | Specific angular momentum, constant for any central force; fixes the orbit plane |
| $h = r v_\perp = r^2\dot{\nu} = r v\cos\gamma$ | Magnitude in terms of transverse speed, angular rate, or flight-path angle $\gamma$ |
| $p = h^2/\mu$ | Semi-latus rectum, the orbit's natural size parameter |
| $\varepsilon = v^2/2 - \mu/r$ | Specific mechanical energy, constant for any conservative force; its sign classifies the conic |
| $\mathbf{e} = \dfrac{(v^2 - \mu/r)\mathbf{r} - (\mathbf{r}\cdot\mathbf{v})\mathbf{v}}{\mu} = \dfrac{\mathbf{v}\times\mathbf{h}}{\mu} - \hat{\mathbf{r}}$ | Eccentricity vector, constant only for inverse-square gravity; in the orbit plane, toward periapsis |
| $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$ | The identity that becomes the orbit equation |
| $e^2 = 1 + 2\varepsilon h^2/\mu^2$ | Eccentricity from energy and angular momentum |
| Five independent constants | Pin the orbit; the sixth piece is the time of periapsis passage |

The next lesson takes the line $r(1 + e\cos\nu) = p$ and reads it as the equation of a conic section — Kepler's first law, derived rather than quoted.

::: context constant-of-motion Things that stay put
You already use constants of motion. A bank account with no deposits or withdrawals keeps the same total, however you shuffle money between checking and savings. Physicists hunt for such totals because each one is a shortcut: instead of following every step of the motion, you can jump straight to "whatever happens, this number stays the same". For the two-body problem there are enough of them to skip the step-by-step work entirely.
:::

::: context cross-product The cross product and the right-hand rule
The cross product $\mathbf{r} \times \mathbf{v}$ makes a new arrow at right angles to both $\mathbf{r}$ and $\mathbf{v}$. To find which way it points, curl the fingers of your right hand from $\mathbf{r}$ toward $\mathbf{v}$; your thumb points along $\mathbf{h}$. For an orbit going counterclockwise seen from above, $\mathbf{h}$ points up, out of the orbit plane.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="40,160 250,160 320,95 110,95" fill="#8fb8f0" fill-opacity="0.35" stroke="#6c7a93" stroke-width="1.5"/>
  <ellipse cx="185" cy="125" rx="95" ry="18" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="185" cy="125" r="6" fill="#1d6fd1"/>
  <line x1="185" y1="125" x2="268" y2="129.5" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="274.3,131.2 265.0,135.1 265.6,126.1" fill="#b4232c"/>
  <line x1="274.3" y1="131.2" x2="306" y2="114.6" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="314.2,110.4 308.3,118.6 304.2,110.6" fill="#1f2a44"/>
  <line x1="185" y1="125" x2="185" y2="30" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="185,20 180,31 190,31" fill="#1d6fd1"/>
  <text x="195" y="36" font-size="13" fill="#1d6fd1">h = r × v</text>
  <text x="222" y="123" font-size="13" fill="#b4232c">r</text>
  <text x="318" y="108" font-size="13" fill="#1f2a44">v</text>
  <text x="64" y="154" font-size="11" fill="#1f2a44">orbit plane</text>
</svg>
```

Because $\mathbf{h}$ never changes, the plane it stands on never tilts.
:::

::: context flight-path-angle The flight-path angle
Stand on the spacecraft and look at two directions: straight up (away from the planet's center) and level (the local horizontal, at right angles to "up"). The flight-path angle $\gamma$ is how far the velocity tips above level. Splitting the velocity into its up part and its level part gives the two components used all through this module.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="100" cy="200" r="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="170" x2="100" y2="20" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="30" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="100" y1="100" x2="227" y2="40.5" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="235.9,36.6 229.6,44.5 225.8,36.3" fill="#1f2a44"/>
  <line x1="100" y1="100" x2="227" y2="100" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="235.9,100 226.9,95.5 226.9,104.5" fill="#1d6fd1"/>
  <line x1="100" y1="100" x2="100" y2="46" stroke="#b4232c" stroke-width="2"/>
  <polygon points="100,36.6 95.5,45.6 104.5,45.6" fill="#b4232c"/>
  <path d="M145,100 A45,45 0 0,0 140.8,81.0" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="100" cy="100" r="4" fill="#1f2a44"/>
  <text x="160" y="92" font-size="13" fill="#1f2a44">γ</text>
  <text x="243" y="38" font-size="13" fill="#1f2a44">v</text>
  <text x="170" y="118" font-size="12" fill="#1d6fd1">v⊥ = v cos γ</text>
  <text x="108" y="34" font-size="12" fill="#b4232c">v_r = v sin γ</text>
  <text x="248" y="92" font-size="11" fill="#6c7a93">local horizontal</text>
  <text x="140" y="185" font-size="11" fill="#6c7a93">toward the center</text>
</svg>
```

Here $\gamma = 25^\circ$. At periapsis and apoapsis $\gamma = 0$ and all the speed is level.
:::

::: context semi-latus-rectum An odd old name
*Latus rectum* is Latin for "straight side" — the name early geometers gave to the chord through a conic's focus drawn at right angles to its long axis. *Semi* means half, so the semi-latus rectum is half that chord: the distance from the focus straight "sideways" to the curve. Engineers often call it $p$, the parameter, and pronounce it that way.
:::

::: context zero-at-infinity Why the height energy is negative
You may choose where potential energy is zero, the way you may choose which floor of a building is "floor zero". Orbit engineers put zero infinitely far away, where the planet's pull has faded to nothing. Everywhere closer is *below* that zero, down in a well, so its potential energy is negative. A spacecraft with negative total energy does not have enough speed to climb out of the well. That is all "bound" means.
:::

::: context apsidal-precession When the long axis creeps around
If the force is not exactly $1/r^2$, the closest point shifts a little each lap, and the orbit traces a rosette.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke-width="1.5">
    <ellipse cx="140" cy="110" rx="60" ry="51.96" stroke="#1f2a44" stroke-width="2"/>
    <ellipse cx="140" cy="110" rx="60" ry="51.96" stroke="#8fb8f0" transform="rotate(-30 170 110)"/>
    <ellipse cx="140" cy="110" rx="60" ry="51.96" stroke="#8fb8f0" transform="rotate(-60 170 110)"/>
    <ellipse cx="140" cy="110" rx="60" ry="51.96" stroke="#8fb8f0" transform="rotate(-90 170 110)"/>
  </g>
  <circle cx="170" cy="110" r="5" fill="#1d6fd1"/>
  <circle cx="200" cy="110" r="3.5" fill="#b4232c"/>
  <circle cx="196" cy="95" r="3.5" fill="#b4232c"/>
  <circle cx="185" cy="84" r="3.5" fill="#b4232c"/>
  <circle cx="170" cy="80" r="3.5" fill="#b4232c"/>
  <path d="M215,110 A45,45 0 0,0 170,65" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="170,65 179,60.5 179,69.5" fill="#b4232c"/>
  <text x="270" y="90" font-size="12" fill="#b4232c">periapsis</text>
  <text x="270" y="105" font-size="12" fill="#b4232c">creeps around</text>
  <text x="270" y="130" font-size="12" fill="#1f2a44">(four laps,</text>
  <text x="270" y="145" font-size="12" fill="#1f2a44">30° apart)</text>
</svg>
```

The effect is exaggerated here. Real example: Mercury's closest point to the Sun shifts slightly more than Newton's gravity predicts — about 43 arcseconds per century. Einstein's general relativity explained that leftover, because relativity changes gravity from pure $1/r^2$ by a tiny amount.
:::

::: context triple-product BAC minus CAB
Students remember $\mathbf{a} \times (\mathbf{b} \times \mathbf{c}) = \mathbf{b}(\mathbf{a} \cdot \mathbf{c}) - \mathbf{c}(\mathbf{a} \cdot \mathbf{b})$ as "BAC minus CAB": read the right side as b-a-c, then c-a-b. You can check it with the unit arrows along the axes: $\hat{\mathbf{x}} \times (\hat{\mathbf{x}} \times \hat{\mathbf{y}}) = \hat{\mathbf{x}} \times \hat{\mathbf{z}} = -\hat{\mathbf{y}}$, and the formula gives $\hat{\mathbf{x}}(0) - \hat{\mathbf{y}}(1) = -\hat{\mathbf{y}}$.
:::

::: context lrl-vector A vector with many discoverers
The vector is named for Pierre-Simon Laplace, Carl Runge and Wilhelm Lenz, but none of them found it first; it was known to Jakob Hermann and Johann Bernoulli around 1710. Lenz used it in early atomic physics, and in 1926 Wolfgang Pauli used it to work out the energy levels of the hydrogen atom — because the electric pull between electron and proton is also inverse-square. The same conserved arrow runs planets and atoms.
:::

::: context peri-apo Near and far
*Peri-* is Greek for "near" and *apo-* for "away from". So periapsis is the nearest point of an orbit and apoapsis the farthest. Around Earth they are often called **perigee** and **apogee** (*gee* from the Greek for Earth); around the Sun, **perihelion** and **aphelion**. The line joining them is the **line of apsides**, the orbit's long axis.
:::

::: context gto The usual road to geostationary orbit
Most communications satellites do not launch straight to their final orbit, $35\,786\,\mathrm{km}$ up. The rocket drops them on a GTO: low perigee where the rocket let go, apogee at geostationary height. Then the satellite fires its own engine at apogee to round the orbit into a circle. Its apogee speed of about $1.6\,\mathrm{km/s}$ must be raised to the circular speed there, about $3.07\,\mathrm{km/s}$ — which is why the next module is all about such burns.
:::
