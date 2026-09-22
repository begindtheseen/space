---
id: l02-constants-of-motion
title: Constants of motion – angular momentum, energy and the eccentricity vector
minutes: 16
covers:
  - constants of motion: specific angular momentum, eccentricity vector, specific energy
---

The two-body equation is a nonlinear system of six first-order equations, and nonlinear systems are usually solved by numerical integration and nothing else. Gravity is the great exception. Hidden inside $\ddot{\mathbf{r}} = -\mu \mathbf{r}/r^3$ are quantities that do not change as the spacecraft moves: a vector that fixes the orbit plane, a scalar that fixes the orbit's size, and a second vector that fixes its shape and orientation. Find them and the differential equation collapses into geometry.

For a GNC engineer these constants are working tools, not just theory. A navigation filter that is told the orbit's energy and angular momentum has been told most of the orbit. A manoeuvre is designed by asking how a velocity change alters energy and angular momentum. And the one constant that is peculiar to the inverse-square law – the eccentricity vector – is the reason real orbits precess: any perturbation that is not inverse-square makes that vector turn, and the turning rate is what you read off a satellite's tracking data.

This lesson derives the three constants directly from the equation of motion, works out the identities that connect them, and computes them for two real orbits. The next lesson uses them to write down the orbit itself.

## Why constants of motion matter

A constant of motion is a function of the state $(\mathbf{r}, \mathbf{v})$ whose time derivative is zero along every solution of the equations of motion. Each independent constant is one algebraic equation the state must satisfy for all time, and each one removes a dimension from the space the trajectory can wander in. The two-body state has six components. If you can find five independent constants, the trajectory is pinned to a one-dimensional curve – the orbit – and only the question of *where on the curve* the spacecraft is at a given time remains. That question is Kepler's equation, several lessons from now. The five constants come out of the next three sections.

Throughout, $\mathbf{r}$ is the position from the centre of the central body, $r = \lVert \mathbf{r} \rVert$, $\mathbf{v} = \dot{\mathbf{r}}$, $v = \lVert \mathbf{v} \rVert$, and $\hat{\mathbf{r}} = \mathbf{r}/r$. Two small derivative facts are used repeatedly. Since $r^2 = \mathbf{r} \cdot \mathbf{r}$, differentiating gives $2 r \dot{r} = 2\,\mathbf{r} \cdot \mathbf{v}$, so

$$
\dot{r} = \frac{\mathbf{r} \cdot \mathbf{v}}{r}, \qquad \frac{d}{dt}\!\left(\frac{1}{r}\right) = -\frac{\dot{r}}{r^2} = -\frac{\mathbf{r} \cdot \mathbf{v}}{r^3}.
$$

Note that $\dot{r}$ – the rate of change of the distance – is not the speed $v$. It is the radial component of velocity, and it is zero wherever the spacecraft is momentarily neither climbing nor descending.

## Specific angular momentum

Define the specific angular momentum (angular momentum per unit mass) as

$$
\mathbf{h} = \mathbf{r} \times \mathbf{v}.
$$

Differentiate it with the product rule for cross products:

$$
\dot{\mathbf{h}} = \dot{\mathbf{r}} \times \mathbf{v} + \mathbf{r} \times \dot{\mathbf{v}} = \mathbf{v} \times \mathbf{v} + \mathbf{r} \times \left(-\frac{\mu}{r^3}\mathbf{r}\right) = \mathbf{0} + \mathbf{0}.
$$

The first term vanishes because any vector crossed with itself is zero; the second because the acceleration is parallel to $\mathbf{r}$. Nothing about the $1/r^2$ law was used – only that the force is *central*, directed along the line to the centre. So $\mathbf{h}$ is constant for any central force.

Two consequences follow. First, $\mathbf{h}$ is perpendicular to both $\mathbf{r}$ and $\mathbf{v}$ at every instant, and $\mathbf{h}$ does not change, so $\mathbf{r}$ and $\mathbf{v}$ stay forever in the fixed plane through the centre perpendicular to $\mathbf{h}$. The three-dimensional problem is really a two-dimensional one in the *orbit plane*, and the direction $\hat{\mathbf{h}}$ is what later becomes the inclination and node of the orbital elements. Second, the magnitude of $\mathbf{h}$ measures how fast the position vector sweeps around. Resolve the velocity in the orbit plane into a radial component $v_r = \dot{r}$ along $\hat{\mathbf{r}}$ and a transverse component $v_\perp = r\dot{\nu}$ perpendicular to it, where $\nu$ is the polar angle of $\mathbf{r}$ in the plane (it will be the true anomaly). Then

$$
h = \lVert \mathbf{h} \rVert = r\,v_\perp = r^2 \dot{\nu}.
$$

The radial component contributes nothing to the cross product. The angle $\gamma$ between the velocity and the local horizontal (perpendicular to $\mathbf{r}$) is the flight-path angle, and $v_\perp = v \cos\gamma$, so $h = r v \cos\gamma$. At any point where the velocity is horizontal – the closest and farthest points of a closed orbit – $h = r v$ exactly.

One combination of $h$ and $\mu$ has the units of length and turns out to be the natural size parameter of the orbit:

$$
p = \frac{h^2}{\mu}.
$$

It is called the semi-latus rectum (or parameter) of the orbit; the next lesson shows it is the distance from the centre to the orbit measured perpendicular to the line of apsides. For now it is a convenient abbreviation.

::: key Specific angular momentum
$\mathbf{h} = \mathbf{r} \times \mathbf{v}$ is constant for any central force. Its direction fixes the orbit plane, and its magnitude sets the semi-latus rectum $p = h^2/\mu$. In components, $h = r v_\perp = r^2\dot{\nu}$.
:::

## Specific energy

Take the dot product of the equation of motion with $\mathbf{v}$:

$$
\mathbf{v} \cdot \dot{\mathbf{v}} = -\frac{\mu}{r^3}\,\mathbf{r} \cdot \mathbf{v}.
$$

The left side is $\tfrac{1}{2}\,\frac{d}{dt}(\mathbf{v} \cdot \mathbf{v}) = \frac{d}{dt}\!\left(\tfrac{1}{2}v^2\right)$. The right side, by the derivative fact above, is $\mu \frac{d}{dt}(1/r)$. Moving everything to one side,

$$
\frac{d}{dt}\!\left(\frac{v^2}{2} - \frac{\mu}{r}\right) = 0,
$$

so the specific mechanical energy

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}
$$

is constant. The first term is kinetic energy per unit mass, the second the gravitational potential energy per unit mass with the zero of potential placed at infinite distance. That choice of zero is not arbitrary: it makes the sign of $\varepsilon$ meaningful. A spacecraft with $\varepsilon < 0$ cannot reach $r \to \infty$, because there its kinetic energy would have to be negative; it is bound, and its orbit is closed. With $\varepsilon = 0$ it reaches infinity with exactly zero speed, and with $\varepsilon > 0$ it arrives at infinity still moving. These are the elliptic, parabolic and hyperbolic cases, and the classification is made by the sign of a single number.

The units of $\varepsilon$ are $\mathrm{km^2/s^2}$ (or $\mathrm{J/kg}$). Typical magnitudes: about $-29\,\mathrm{km^2/s^2}$ for a low Earth orbit and $-4.7\,\mathrm{km^2/s^2}$ at geostationary radius. Two lessons from now $\varepsilon$ is identified with the orbit's semi-major axis through $\varepsilon = -\mu/(2a)$; that identification is the content of the vis-viva equation, and it is derived there rather than assumed here.

::: key Specific mechanical energy
$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}
$$
is constant along the orbit. Negative for an ellipse, zero for a parabola, positive for a hyperbola.
:::

## The eccentricity vector

Angular momentum used only the central nature of the force, and energy only its conservative nature. The third constant is special to the inverse-square law. Compute the time derivative of $\mathbf{v} \times \mathbf{h}$, remembering that $\mathbf{h}$ is constant:

$$
\frac{d}{dt}(\mathbf{v} \times \mathbf{h}) = \dot{\mathbf{v}} \times \mathbf{h} = -\frac{\mu}{r^3}\,\mathbf{r} \times (\mathbf{r} \times \mathbf{v}).
$$

Expand the triple product with the identity $\mathbf{a} \times (\mathbf{b} \times \mathbf{c}) = \mathbf{b}(\mathbf{a} \cdot \mathbf{c}) - \mathbf{c}(\mathbf{a} \cdot \mathbf{b})$:

$$
\mathbf{r} \times (\mathbf{r} \times \mathbf{v}) = \mathbf{r}\,(\mathbf{r} \cdot \mathbf{v}) - \mathbf{v}\,r^2,
$$

so

$$
\frac{d}{dt}(\mathbf{v} \times \mathbf{h}) = -\frac{\mu}{r^3}\left[\mathbf{r}\,(\mathbf{r} \cdot \mathbf{v}) - r^2 \mathbf{v}\right] = \mu\left[\frac{\mathbf{v}}{r} - \frac{(\mathbf{r} \cdot \mathbf{v})\,\mathbf{r}}{r^3}\right].
$$

Now compare with the derivative of the unit vector $\hat{\mathbf{r}} = \mathbf{r}/r$:

$$
\frac{d}{dt}\!\left(\frac{\mathbf{r}}{r}\right) = \frac{\mathbf{v}}{r} - \frac{\dot{r}\,\mathbf{r}}{r^2} = \frac{\mathbf{v}}{r} - \frac{(\mathbf{r} \cdot \mathbf{v})\,\mathbf{r}}{r^3}.
$$

The two brackets are identical. Therefore

$$
\frac{d}{dt}\left[\frac{\mathbf{v} \times \mathbf{h}}{\mu} - \frac{\mathbf{r}}{r}\right] = \mathbf{0},
$$

and the eccentricity vector

$$
\mathbf{e} = \frac{\mathbf{v} \times \mathbf{h}}{\mu} - \hat{\mathbf{r}}
$$

is a constant of the motion. The $1/r^3$ from the force law was essential: with any other power of $r$ the two brackets would not match, and no such vector exists. This is why closed orbits under pure inverse-square gravity retrace themselves exactly, while orbits under almost any other central force slowly precess.

For computation, substitute $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ and expand $\mathbf{v} \times (\mathbf{r} \times \mathbf{v}) = \mathbf{r}\,v^2 - \mathbf{v}\,(\mathbf{r} \cdot \mathbf{v})$:

$$
\mathbf{e} = \frac{\left(v^2 - \dfrac{\mu}{r}\right)\mathbf{r} - (\mathbf{r} \cdot \mathbf{v})\,\mathbf{v}}{\mu}.
$$

This form needs only the state vector and $\mu$, with no cross products, and it is the one used in every state-to-elements conversion. Its magnitude $e = \lVert \mathbf{e} \rVert$ is the eccentricity of the orbit, dimensionless. In classical mechanics the same vector, multiplied by $m^2 \mu$, is the Laplace–Runge–Lenz vector; the eccentricity vector is the astrodynamicist's scaling of it.

### Where it points and how big it is

Three identities pin down the geometry. First, $\mathbf{e} \cdot \mathbf{h} = 0$: the term $\mathbf{v} \times \mathbf{h}$ is perpendicular to $\mathbf{h}$ by construction and $\hat{\mathbf{r}}$ is perpendicular to $\mathbf{h}$ because $\mathbf{r}$ is. So $\mathbf{e}$ lies *in the orbit plane*. Second, dot $\mathbf{e}$ with $\mathbf{r}$:

$$
\mathbf{e} \cdot \mathbf{r} = \frac{\mathbf{r} \cdot (\mathbf{v} \times \mathbf{h})}{\mu} - r = \frac{(\mathbf{r} \times \mathbf{v}) \cdot \mathbf{h}}{\mu} - r = \frac{h^2}{\mu} - r,
$$

using the cyclic property of the scalar triple product. Writing $\mathbf{e} \cdot \mathbf{r} = e\,r\cos\nu$ with $\nu$ the angle from $\mathbf{e}$ to $\mathbf{r}$, this says $r(1 + e\cos\nu) = h^2/\mu = p$. The distance $r$ is smallest where $\cos\nu = 1$, that is, where $\mathbf{r}$ is parallel to $\mathbf{e}$. So $\mathbf{e}$ points from the focus toward the closest point of the orbit – the periapsis – and the angle $\nu$ measured from it is the true anomaly. The next lesson turns this one identity into the full orbit equation.

Third, take the squared magnitude. Because $\mathbf{v} \perp \mathbf{h}$, $\lVert \mathbf{v} \times \mathbf{h} \rVert = v h$, and $(\mathbf{v} \times \mathbf{h}) \cdot \hat{\mathbf{r}} = \mathbf{h} \cdot (\hat{\mathbf{r}} \times \mathbf{v}) = h^2/r$:

$$
e^2 = \frac{v^2 h^2}{\mu^2} - \frac{2h^2}{\mu r} + 1 = 1 + \frac{h^2}{\mu^2}\left(v^2 - \frac{2\mu}{r}\right) = 1 + \frac{2\varepsilon h^2}{\mu^2}.
$$

This is the relation you should memorise alongside the definitions: eccentricity is fixed by energy and angular momentum together. It confirms the classification by the sign of $\varepsilon$: negative energy gives $e < 1$, zero energy gives $e = 1$, positive energy gives $e > 1$.

::: key The eccentricity vector
$$
\mathbf{e} = \frac{\left(v^2 - \mu/r\right)\mathbf{r} - (\mathbf{r} \cdot \mathbf{v})\,\mathbf{v}}{\mu} = \frac{\mathbf{v} \times \mathbf{h}}{\mu} - \hat{\mathbf{r}}.
$$
It is constant, lies in the orbit plane, points from the focus toward periapsis, and its magnitude is the eccentricity $e$. It is the Laplace–Runge–Lenz vector scaled by $1/(m^2\mu)$, and $e^2 = 1 + 2\varepsilon h^2/\mu^2$.
:::

### Counting the constants

You now have seven scalar constants: three components of $\mathbf{h}$, three of $\mathbf{e}$, and $\varepsilon$. They are not independent: $\mathbf{e} \cdot \mathbf{h} = 0$ and $e^2 = 1 + 2\varepsilon h^2/\mu^2$ are two relations among them, leaving five. Five constants pin the six-dimensional state to a curve, exactly as promised. The sixth quantity needed to locate the spacecraft on that curve is a time – the instant of periapsis passage – and it is the one piece of information that is not a function of $(\mathbf{r}, \mathbf{v})$ alone.

## Two orbits, numerically

::: example Constants of motion for an ISS-like state
A spacecraft in an ISS-like orbit has, in an Earth-centred inertial frame,
$$
\mathbf{r} = (-2267.240,\;-3989.573,\;5001.268)\,\mathrm{km}, \qquad
\mathbf{v} = (5.0098,\;-5.4258,\;-2.0540)\,\mathrm{km/s}.
$$
Magnitudes: $r = 6787.47\,\mathrm{km}$, $v = 7.6653\,\mathrm{km/s}$.

Angular momentum, component by component:
$$
\mathbf{h} = \mathbf{r} \times \mathbf{v} = (35\,330.5,\;20\,398.4,\;32\,288.6)\,\mathrm{km^2/s}, \qquad h = 52\,027.8\,\mathrm{km^2/s}.
$$
The semi-latus rectum is $p = h^2/\mu = (52\,027.8)^2 / 398\,600.4418 = 6790.98\,\mathrm{km}$. The orbit plane is tilted from the equator by the angle between $\mathbf{h}$ and the $z$-axis: $\cos^{-1}(32\,288.6/52\,027.8) = 51.64^\circ$, the ISS inclination.

Energy: $\varepsilon = 7.6653^2/2 - 398\,600.4418/6787.47 = 29.378 - 58.726 = -29.348\,\mathrm{km^2/s^2}$. Negative, so the orbit is closed.

Eccentricity vector: $\mathbf{r} \cdot \mathbf{v} = 15.60\,\mathrm{km^2/s}$ (slightly positive – the spacecraft is climbing very gently) and $v^2 - \mu/r = 58.757 - 58.726 = 0.0312\,\mathrm{km^2/s^2}$. Then
$$
\mathbf{e} = \frac{0.0312\,\mathbf{r} - 15.60\,\mathbf{v}}{398\,600.4} = (-3.69,\;-0.92,\;4.62) \times 10^{-4}, \qquad e = 5.98 \times 10^{-4}.
$$
The orbit is very nearly circular. Check the identity: $1 + 2\varepsilon h^2/\mu^2 = 1 + 2(-29.348)(52\,027.8)^2/(398\,600.4)^2 = 3.58 \times 10^{-7}$, and $e^2 = (5.98 \times 10^{-4})^2 = 3.58 \times 10^{-7}$. Note also that $\mathbf{e} \cdot \mathbf{h}$ evaluates to $10^{-15}$, zero to rounding.
:::

::: example A geostationary transfer orbit at perigee
A GTO has perigee altitude $250\,\mathrm{km}$ and apogee at geostationary altitude $35\,786\,\mathrm{km}$, so $r_p = 6628.137\,\mathrm{km}$ and $r_a = 42\,164.137\,\mathrm{km}$. At perigee the speed is $v_p = 10.1949\,\mathrm{km/s}$ and the velocity is horizontal, so $\mathbf{r} \cdot \mathbf{v} = 0$. Take the perigee direction as the $x$-axis and the velocity along $y$.

Angular momentum: $h = r_p v_p = 6628.137 \times 10.1949 = 67\,573.4\,\mathrm{km^2/s}$, along $+z$. Semi-latus rectum: $p = h^2/\mu = 11\,455.5\,\mathrm{km}$.

Energy: $\varepsilon = 10.1949^2/2 - 398\,600.4418/6628.137 = 51.968 - 60.138 = -8.169\,\mathrm{km^2/s^2}$.

Eccentricity vector: with $\mathbf{r} \cdot \mathbf{v} = 0$ the second term drops and
$$
\mathbf{e} = \frac{(v_p^2 - \mu/r_p)\,\mathbf{r}}{\mu} = \left(\frac{v_p^2 r_p}{\mu} - 1\right)\hat{\mathbf{x}} = \left(\frac{10.1949^2 \times 6628.137}{398\,600.4} - 1\right)\hat{\mathbf{x}} = 0.7283\,\hat{\mathbf{x}}.
$$
The vector points along $\mathbf{r}$ at perigee, as it must, and the eccentricity is $e = 0.7283$, a highly elongated ellipse. At apogee the same construction gives $\mathbf{e} = (v_a^2 r_a/\mu - 1)\hat{\mathbf{r}}_a$ with $v_a = 1.6026\,\mathrm{km/s}$: the bracket is $1.6026^2 \times 42\,164.137/398\,600.4 - 1 = -0.7283$, and since $\hat{\mathbf{r}}_a = -\hat{\mathbf{x}}$, $\mathbf{e} = +0.7283\,\hat{\mathbf{x}}$ again. The same constant, from opposite ends of the orbit.
:::

## Perturbations and the turning eccentricity vector

Because $\mathbf{e}$ is constant only for an exact inverse-square force, its behaviour under a perturbation is a sensitive diagnostic. Earth's oblateness adds a small force that is not inverse-square, and under it $\mathbf{e}$ rotates slowly within the orbit plane – a few degrees per day in low orbit – while its magnitude stays nearly fixed. Observers call this apsidal precession: the perigee marches around the orbit. It is not a new phenomenon to be memorised; it is the statement that $\dot{\mathbf{e}} \neq \mathbf{0}$ once the force law departs from $1/r^2$. Likewise, the direction of $\mathbf{h}$ drifts under oblateness (the orbit plane precesses about the pole) while $\varepsilon$ is conserved by any static conservative perturbation. Which constant a perturbation breaks tells you what it does to the orbit.

::: warning e is not a unit vector, and h is per unit mass
The eccentricity vector has magnitude $e$, which is $0.0006$ for the ISS and $0.73$ for a GTO; only a parabolic orbit has $\lVert \mathbf{e} \rVert = 1$. Do not normalise it when you need its direction and then forget that its length carried information. Similarly, $\mathbf{h}$ and $\varepsilon$ are *specific* quantities, per unit mass, with units $\mathrm{km^2/s}$ and $\mathrm{km^2/s^2}$; the spacecraft mass never appears, because it cancelled out of the equation of motion in the first place.
:::

::: warning Sign of r·v
The sign of $\mathbf{r} \cdot \mathbf{v} = r\dot{r}$ tells you whether the spacecraft is moving away from the centre (positive, between periapsis and apoapsis) or toward it (negative, between apoapsis and periapsis). This sign is what resolves the quadrant of the true anomaly in the state-to-elements conversion. In the ISS example it was $+15.6\,\mathrm{km^2/s}$, so the spacecraft had passed perigee less than half an orbit earlier.
:::

## Check yourself

::: check
Which property of the gravitational force makes $\mathbf{h}$ constant, which makes $\varepsilon$ constant, and which makes $\mathbf{e}$ constant?
:::

::: answer
$\mathbf{h}$ is constant because the force is central – parallel to $\mathbf{r}$ – so $\mathbf{r} \times \ddot{\mathbf{r}} = \mathbf{0}$; any central force will do. $\varepsilon$ is constant because the force is conservative, the gradient of a potential $-\mu/r$; any conservative force will do. $\mathbf{e}$ is constant only because the force is exactly inverse-square: the derivation matched $\frac{d}{dt}(\mathbf{v} \times \mathbf{h})$ to $\mu\,\frac{d}{dt}\hat{\mathbf{r}}$, and that match requires the $1/r^3$ in $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$.
:::

::: check
A spacecraft at $r = 7000\,\mathrm{km}$ has speed $8.0\,\mathrm{km/s}$ with a flight-path angle of $10^\circ$ above the local horizontal. Compute $h$, $\varepsilon$ and $e$.
:::

::: answer
$h = r v \cos\gamma = 7000 \times 8.0 \times \cos 10^\circ = 55\,149\,\mathrm{km^2/s}$. $\varepsilon = 8.0^2/2 - 398\,600.4418/7000 = 32.000 - 56.943 = -24.943\,\mathrm{km^2/s^2}$, a bound orbit. Then $e^2 = 1 + 2\varepsilon h^2/\mu^2 = 1 + 2(-24.943)(55\,149)^2/(398\,600.4418)^2 = 1 - 0.9549 = 0.0451$, so $e = 0.212$.
:::

::: check
Explain, using only the identity $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$, why the eccentricity vector must point toward periapsis.
:::

::: answer
Rearranged, $r = h^2/\mu - \mathbf{e} \cdot \mathbf{r} = h^2/\mu - e\,r\cos\nu$, where $\nu$ is the angle between $\mathbf{e}$ and $\mathbf{r}$. Since $h^2/\mu$ is constant, $r$ is smallest when $e\,r\cos\nu$ is largest, which happens when $\cos\nu = 1$: the position vector is parallel to $\mathbf{e}$. The point of closest approach – periapsis – therefore lies in the direction of $\mathbf{e}$ from the focus.
:::

::: check
Why does a spacecraft under pure two-body gravity return to exactly the same perigee point each orbit, and what happens to this statement when Earth's oblateness is included?
:::

::: answer
The perigee direction is the direction of $\mathbf{e}$, and $\mathbf{e}$ is a constant of the two-body motion, so the perigee cannot move. Oblateness adds a force that is not inverse-square, the derivation of $\dot{\mathbf{e}} = \mathbf{0}$ fails, and $\mathbf{e}$ rotates slowly in the orbit plane. The perigee then precesses around the orbit at a rate set by the perturbation – for the ISS a few degrees per day.
:::

::: check
How many independent scalar constants of motion does the two-body problem have among $\mathbf{h}$, $\mathbf{e}$ and $\varepsilon$, and what is still missing to locate the spacecraft?
:::

::: answer
Seven quantities, minus two relations ($\mathbf{e} \cdot \mathbf{h} = 0$ and $e^2 = 1 + 2\varepsilon h^2/\mu^2$), leave five independent constants. They confine the state to a one-dimensional curve, the orbit. Missing is the sixth piece of information – a time, such as the epoch of periapsis passage – which places the spacecraft on the curve at a given instant; it is not a function of the state alone.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ | Specific angular momentum, constant for any central force; fixes the orbit plane |
| $h = r v_\perp = r^2\dot{\nu} = r v\cos\gamma$ | Magnitude in terms of transverse speed, angular rate, or flight-path angle $\gamma$ |
| $p = h^2/\mu$ | Semi-latus rectum, the orbit's natural size parameter |
| $\varepsilon = v^2/2 - \mu/r$ | Specific mechanical energy, constant for any conservative force; sign classifies the conic |
| $\mathbf{e} = \dfrac{(v^2 - \mu/r)\mathbf{r} - (\mathbf{r}\cdot\mathbf{v})\mathbf{v}}{\mu} = \dfrac{\mathbf{v}\times\mathbf{h}}{\mu} - \hat{\mathbf{r}}$ | Eccentricity vector, constant only for inverse-square gravity; in the orbit plane, toward periapsis |
| $\mathbf{e} \cdot \mathbf{r} = h^2/\mu - r$ | The identity that becomes the orbit equation |
| $e^2 = 1 + 2\varepsilon h^2/\mu^2$ | Eccentricity from energy and angular momentum |
| Five independent constants | Pin the orbit; the sixth datum is the time of periapsis passage |

The next lesson takes the identity $r(1 + e\cos\nu) = p$ and reads it as the polar equation of a conic section: the first of Kepler's laws, derived rather than quoted.
