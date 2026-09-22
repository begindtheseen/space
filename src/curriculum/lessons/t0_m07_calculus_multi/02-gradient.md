---
id: l02-gradient
title: The gradient and the directional derivative
minutes: 21
covers:
  - gradient and directional derivative
---

Lesson 1 gave you the partial derivatives of a scalar field one at a time. This lesson packs them into a single vector, the gradient, and asks what that vector means geometrically. The answer is remarkably rich: the gradient points in the direction in which the field increases fastest, its length is that fastest rate of increase, and it stands perpendicular to the level sets of the field. Three facts, one vector.

A GNC engineer meets the gradient in two costumes. As a force: the gravitational acceleration is minus the gradient of the potential, which is why gravity points straight down through every equipotential surface and why the plumb line is perpendicular to the geoid. As a search direction: every trajectory optimiser, every least-squares orbit fit and every training loop for a learned controller moves downhill along a negative gradient. The rate at which a cost changes when you push a design variable is a directional derivative.

This lesson also derives the first half of the multivariable chain rule — how a scalar field changes along a moving point — because the proof that the gradient is normal to level sets needs it. Lesson 4 will generalise it to vector functions.

## From partials to a vector

Let $f:\mathbb{R}^n \to \mathbb{R}$ have partial derivatives at a point. The **gradient** of $f$ is the column vector of those partial derivatives:

$$
\nabla f = \begin{bmatrix} \dfrac{\partial f}{\partial x_1} \\ \vdots \\ \dfrac{\partial f}{\partial x_n} \end{bmatrix}
= \left[\frac{\partial f}{\partial x_1}, \dots, \frac{\partial f}{\partial x_n}\right]^\top .
$$

The symbol $\nabla$ is read "nabla" or "del", and $\nabla f$ is read "grad $f$". Its components have the units of $f$ divided by the units of position, so the gradient of a potential energy per unit mass in $\mathrm{J/kg} = \mathrm{m^2/s^2}$ has units $\mathrm{m/s^2}$: an acceleration. For a function of three spatial variables,

$$
\nabla f = \frac{\partial f}{\partial x}\,\hat{\mathbf{x}} + \frac{\partial f}{\partial y}\,\hat{\mathbf{y}} + \frac{\partial f}{\partial z}\,\hat{\mathbf{z}} .
$$

The gradient is a field in its own right: it assigns a vector to every point. Where $f$ is steep the arrows are long; where $f$ is flat they shrink; at a maximum, minimum or saddle of $f$ they vanish.

Take the dynamic pressure $q(\rho, v) = \tfrac{1}{2}\rho v^2$ from Lesson 1, regarded as a function of the two variables $(\rho, v)$. Its gradient is $\nabla q = [\tfrac{1}{2}v^2,\ \rho v]^\top$, which at $\rho = 1.225\,\mathrm{kg/m^3}$ and $v = 250\,\mathrm{m/s}$ is $[31{,}250,\ 306.25]^\top$. The vector of sensitivities you computed one entry at a time is the gradient.

## The directional derivative

A partial derivative measures the rate of change along a coordinate axis. Nothing forces you to move along an axis. Let $\mathbf{u}$ be a **unit** vector, $\lVert \mathbf{u} \rVert = 1$, and move from $\mathbf{x}$ a distance $h$ in the direction $\mathbf{u}$. The **directional derivative** of $f$ along $\mathbf{u}$ is

$$
D_{\mathbf{u}} f(\mathbf{x}) = \lim_{h \to 0} \frac{f(\mathbf{x} + h\mathbf{u}) - f(\mathbf{x})}{h} .
$$

It is the rate of change of $f$ per unit distance travelled in direction $\mathbf{u}$. Choosing $\mathbf{u} = \mathbf{e}_i$ recovers the partial derivative $\partial f/\partial x_i$.

To evaluate the limit, use the linear approximation from Lesson 1 with displacement $\delta\mathbf{x} = h\mathbf{u}$:

$$
f(\mathbf{x} + h\mathbf{u}) \approx f(\mathbf{x}) + \sum_{i=1}^{n} \frac{\partial f}{\partial x_i}\, h u_i = f(\mathbf{x}) + h\, \nabla f \cdot \mathbf{u},
$$

with an error of order $h^2$. Subtract $f(\mathbf{x})$, divide by $h$ and let $h \to 0$; the error term disappears and

$$
D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u} .
$$

Now write the dot product in terms of the angle $\theta$ between $\nabla f$ and $\mathbf{u}$. Since $\lVert \mathbf{u} \rVert = 1$,

$$
D_{\mathbf{u}} f = \lVert \nabla f \rVert\, \lVert \mathbf{u} \rVert \cos\theta = \lVert \nabla f \rVert \cos\theta .
$$

This one line contains the geometry of the gradient. The cosine is largest, equal to one, when $\mathbf{u}$ points along $\nabla f$: the field increases fastest in the gradient direction, at the rate $\lVert \nabla f \rVert$. It is $-1$ when $\mathbf{u}$ points against the gradient: the steepest descent direction is $-\nabla f$. It is zero when $\mathbf{u}$ is perpendicular to $\nabla f$: moving that way changes $f$ not at all, to first order, so those directions are tangent to the level set through the point.

::: key
$\nabla f = [\partial f/\partial x_1, \dots, \partial f/\partial x_n]^\top$. It points in the direction of steepest ascent, its magnitude $\lVert \nabla f \rVert$ is that steepest slope, and it is normal to the level set of $f$ through the point.
:::

::: key
The directional derivative along a unit vector $\mathbf{u}$ is $D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u} = \lVert \nabla f \rVert \cos\theta$, where $\theta$ is the angle between $\mathbf{u}$ and $\nabla f$. It is maximal along $\nabla f$ and zero along the level set.
:::

::: example A directional derivative in the plane
Let $f(x, y) = x^2 + 3xy$ and ask how fast $f$ changes at the point $(1, 2)$ when you move towards the point $(4, 6)$. The partials are $f_x = 2x + 3y$ and $f_y = 3x$, so $\nabla f(1, 2) = [8, 3]^\top$. The displacement $(3, 4)$ has length $5$, so the unit direction is $\mathbf{u} = [0.6, 0.8]^\top$. Then

$$
D_{\mathbf{u}} f = 8 \times 0.6 + 3 \times 0.8 = 4.8 + 2.4 = 7.2 .
$$

The steepest possible rate at that point is $\lVert \nabla f \rVert = \sqrt{64 + 9} = \sqrt{73} = 8.54$, so this direction achieves $7.2/8.54 = 0.843$ of the maximum, corresponding to an angle of $\theta = \arccos 0.843 = 32.6^\circ$ from the gradient. The direction of no change is perpendicular to $[8, 3]^\top$, namely $[-3, 8]^\top/\sqrt{73} = [-0.351, 0.936]^\top$; that is the tangent to the level curve $x^2 + 3xy = 7$ through $(1, 2)$.
:::

::: warning
The formula $D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u}$ needs a unit vector. If you dot the gradient with a displacement of length $5$, you get five times the rate per unit distance. The rate at which $f$ changes along a *velocity* $\mathbf{v}$ — change per unit time rather than per unit length — is $\nabla f \cdot \mathbf{v}$ with no normalisation; that quantity is the chain rule, coming next.
:::

## Why the gradient is normal to level sets

The cosine argument shows that the directions of zero change are perpendicular to $\nabla f$. To be certain that those directions are exactly the tangent directions of the level set, argue directly.

Let $\mathbf{r}(t)$ be any smooth curve lying inside the level set $f = c$, so that $f(\mathbf{r}(t)) = c$ for every $t$. The velocity $\dot{\mathbf{r}}$ of this curve is a tangent vector to the level set. Compute the time derivative of $f$ along the curve using the linear approximation with $\delta\mathbf{x} = \mathbf{r}(t + \delta t) - \mathbf{r}(t) \approx \dot{\mathbf{r}}\,\delta t$:

$$
\frac{d}{dt} f(\mathbf{r}(t)) = \lim_{\delta t \to 0} \frac{f(\mathbf{r}(t + \delta t)) - f(\mathbf{r}(t))}{\delta t} = \nabla f \cdot \dot{\mathbf{r}} .
$$

This is the **chain rule for a scalar field along a curve**: $\frac{d}{dt} f(\mathbf{r}(t)) = \nabla f \cdot \dot{\mathbf{r}}$. But $f$ is constant along our curve, so the left side is zero:

$$
\nabla f \cdot \dot{\mathbf{r}} = 0 .
$$

The gradient is perpendicular to the velocity of every curve that stays in the level set — to every tangent vector of the level set. That is what "normal to the level set" means.

Two consequences follow at once. First, the **tangent plane** to a surface given implicitly by $F(x, y, z) = c$ at a point $\mathbf{x}_0$ is the set of points $\mathbf{x}$ with $\nabla F(\mathbf{x}_0) \cdot (\mathbf{x} - \mathbf{x}_0) = 0$, and the unit normal to the surface is $\nabla F/\lVert \nabla F \rVert$. Second, since gravity is $\mathbf{g} = -\nabla U$ for a potential $U$ (Lesson 10 develops this), gravity is perpendicular to every equipotential surface. The geoid is an equipotential, so a plumb line — which hangs along $\mathbf{g}$ — is normal to the geoid, and "level" means "perpendicular to gravity".

::: example The normal to the reference ellipsoid and geodetic latitude
Earth's reference ellipsoid (WGS84) is the level set

$$
F(x, y, z) = \frac{x^2 + y^2}{a^2} + \frac{z^2}{b^2} = 1, \qquad a = 6{,}378{,}137\,\mathrm{m}, \quad b = 6{,}356{,}752.3\,\mathrm{m}.
$$

Its outward normal is along $\nabla F = [2x/a^2,\ 2y/a^2,\ 2z/b^2]^\top$. Take the point in the $y = 0$ plane with $x = a\cos 45^\circ = 4{,}510{,}024\,\mathrm{m}$ and $z = b\sin 45^\circ = 4{,}494{,}903\,\mathrm{m}$, which lies on the surface because $\cos^2 + \sin^2 = 1$. The normal direction is proportional to $[\cos 45^\circ/a,\ 0,\ \sin 45^\circ/b]^\top$.

The angle the normal makes with the equatorial plane is the **geodetic latitude** $\varphi$, the latitude on every map and in every GPS receiver: $\tan\varphi = (\sin 45^\circ/b)/(\cos 45^\circ/a) = a/b = 1.003365$, so $\varphi = 45.096^\circ$. The angle of the position vector itself is the **geocentric latitude** $\psi$: $\tan\psi = z/x = b/a$, so $\psi = 44.904^\circ$. Because the surface is flattened, the normal does not pass through the centre; the two latitudes differ by $0.192^\circ = 11.5$ arcminutes, which on the ground is about $21\,\mathrm{km}$. A tracking-station position given in geodetic latitude and interpreted as geocentric would be misplaced by that much — a real and classic error.
:::

## Gradients of the distance function

Lesson 1 found the partial derivatives of $r = \lVert \mathbf{r} \rVert$: $\partial r/\partial x = x/r$ and likewise for $y$ and $z$. Stacking them,

$$
\nabla r = \frac{1}{r}\begin{bmatrix} x \\ y \\ z \end{bmatrix} = \frac{\mathbf{r}}{r} = \hat{\mathbf{r}} .
$$

The gradient of distance-from-the-origin is the unit radial vector. Read this through the three facts: distance increases fastest when you move straight outward, at the rate of one metre per metre, and does not change at all when you move tangentially. The same computation for the range to a station gives

$$
\nabla \lVert \mathbf{r} - \mathbf{r}_s \rVert = \frac{\mathbf{r} - \mathbf{r}_s}{\lVert \mathbf{r} - \mathbf{r}_s \rVert} = \hat{\mathbf{u}},
$$

the unit line-of-sight vector from station to satellite. A range measurement is blind to any motion perpendicular to the line of sight, because the directional derivative of range along those directions is zero. Lesson 3 turns this into the first row of a filter's $\mathbf{H}$ matrix.

For powers of the distance, Lesson 1 gave $\partial(r^n)/\partial x = n\,x\,r^{n-2}$, so

$$
\nabla (r^n) = n\,r^{n-2}\,\mathbf{r}, \qquad \text{in particular} \qquad \nabla\!\left(\frac{1}{r}\right) = -\frac{\mathbf{r}}{r^3}, \qquad \nabla\!\left(\frac{1}{r^3}\right) = -\frac{3\,\mathbf{r}}{r^5}.
$$

::: key
$\nabla \lVert \mathbf{r} \rVert = \hat{\mathbf{r}}$ and $\nabla \lVert \mathbf{r} - \mathbf{r}_s \rVert = (\mathbf{r} - \mathbf{r}_s)/\lVert \mathbf{r} - \mathbf{r}_s \rVert$, the unit line of sight. For powers, $\nabla (r^n) = n r^{n-2}\mathbf{r}$, so $\nabla(1/r) = -\mathbf{r}/r^3$.
:::

::: example Gravitational acceleration from the potential
The two-body gravitational potential per unit mass is $U = -\mu/r$, with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ for Earth. Using $\nabla(1/r) = -\mathbf{r}/r^3$,

$$
\nabla U = -\mu\,\nabla\!\left(\frac{1}{r}\right) = \frac{\mu\,\mathbf{r}}{r^3}, \qquad \mathbf{a} = -\nabla U = -\frac{\mu\,\mathbf{r}}{r^3} = -\frac{\mu}{r^2}\hat{\mathbf{r}} .
$$

The gradient of $U$ points outward — potential energy increases as you climb — and the acceleration, being minus the gradient, points inward with magnitude $\mu/r^2$. At $400\,\mathrm{km}$ altitude, $r = 6{,}778.137\,\mathrm{km}$ and $\mu/r^2 = 8.676\,\mathrm{m/s^2}$, while $U = -58.81\,\mathrm{MJ/kg}$.

The directional derivative gives the rate at which potential energy accumulates in any direction. Moving from the point $(r, 0, 0)$ along the unit vector $\mathbf{u} = [\cos 45^\circ, \sin 45^\circ, 0]^\top$, $D_{\mathbf{u}} U = \nabla U \cdot \mathbf{u} = (\mu/r^2)\cos 45^\circ = 6.135\,\mathrm{J/kg}$ per metre. Climbing straight up would cost the full $8.676\,\mathrm{J/kg}$ per metre; moving horizontally costs nothing, which is the statement that the sphere $r = \text{const}$ is an equipotential.
:::

## Descending a gradient

Because $-\nabla f$ is the direction of steepest decrease, the simplest way to minimise a function is to step along it repeatedly:

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - \alpha\, \nabla f(\mathbf{x}_k),
$$

with a step length $\alpha$ chosen small enough that the linear approximation still holds. The method is called **gradient descent** or steepest descent. For $f(x, y) = (x - 1)^2 + 4(y + 2)^2$, whose minimum is $0$ at $(1, -2)$, start at the origin where $f = 17$ and $\nabla f = [2(x-1),\ 8(y+2)]^\top = [-2, 16]^\top$. With $\alpha = 0.1$ the next point is $(0.2, -1.6)$ where $f = 0.64 + 0.64 = 1.28$ — a drop of over $90\%$ in one step. The best possible step along this direction, found by minimising $f$ along the line, is $\alpha = 0.1265$, which reaches $(0.253, -2.023)$ with $f = 0.560$. Notice that the gradient at the start was dominated by the steep $y$ direction, so the step overshoots in $y$ and barely moves in $x$; Lesson 4 explains this zigzagging with the Hessian and shows how Newton's method avoids it.

::: note
In spherical coordinates $(r, \theta, \varphi)$ with polar angle $\theta$ and azimuth $\varphi$, the gradient is not the plain list of partial derivatives; the angular components must be divided by the local arc-length factors:

$$
\nabla f = \frac{\partial f}{\partial r}\,\hat{\mathbf{r}} + \frac{1}{r}\frac{\partial f}{\partial \theta}\,\hat{\boldsymbol{\theta}} + \frac{1}{r\sin\theta}\frac{\partial f}{\partial \varphi}\,\hat{\boldsymbol{\varphi}} .
$$

The factors appear because a change $d\theta$ moves you a distance $r\,d\theta$, not $d\theta$. This is why the module's J2 exercise asks you to work in Cartesian coordinates, where no such factors arise.
:::

::: warning
The gradient is a column vector in this module, while the derivative of a scalar function with respect to a vector, $\partial f/\partial \mathbf{x}$, is often written as a row. They hold the same numbers; the row is $(\nabla f)^\top$. Keep track of which you have, because in Lesson 3 the rows of a Jacobian are transposed gradients and the distinction decides whether a matrix product is even defined.
:::

## Check yourself

::: check
For $f(x, y, z) = xyz$, find the gradient at $(1, 2, 3)$, the direction of steepest ascent as a unit vector, and the steepest rate of increase.
:::

::: answer
$\nabla f = [yz,\ xz,\ xy]^\top = [6, 3, 2]^\top$ at $(1, 2, 3)$. Its length is $\sqrt{36 + 9 + 4} = 7$, so the steepest rate is $7$ and the direction is $[6, 3, 2]^\top/7 = [0.857, 0.429, 0.286]^\top$.
:::

::: check
At some point $\nabla f = [3, 4]^\top$. Find all unit directions along which $f$ is not changing, and the directional derivative along $\mathbf{u} = [1, 0]^\top$.
:::

::: answer
Directions of no change are perpendicular to the gradient: $\pm[-4, 3]^\top/5 = \pm[-0.8, 0.6]^\top$. Along $[1, 0]^\top$ the directional derivative is $\nabla f \cdot \mathbf{u} = 3$, which is also $\partial f/\partial x$, as it must be for an axis direction. The maximum rate is $\lVert \nabla f \rVert = 5$, so the $x$ axis achieves $60\%$ of it.
:::

::: check
Find the tangent plane to the sphere $x^2 + y^2 + z^2 = 9$ at the point $(1, 2, 2)$.
:::

::: answer
With $F = x^2 + y^2 + z^2$, $\nabla F = [2x, 2y, 2z]^\top = [2, 4, 4]^\top$ at the point, which is parallel to the position vector, as it should be for a sphere. The plane is $2(x - 1) + 4(y - 2) + 4(z - 2) = 0$, or $x + 2y + 2z = 9$.
:::

::: check
A Doppler-free range-only tracking pass sees a satellite move exactly across the line of sight for a moment. What does the range measurement say about the satellite's velocity at that instant, and why?
:::

::: answer
Nothing. The rate of change of range along a direction $\mathbf{u}$ is $D_{\mathbf{u}}\rho = \hat{\mathbf{u}}_{\text{los}} \cdot \mathbf{u}$, where $\hat{\mathbf{u}}_{\text{los}} = \nabla\rho$ is the unit line of sight. Motion perpendicular to the line of sight is a motion along the level set of $\rho$ (a sphere centred on the station), for which the directional derivative is zero. Range is instantaneously blind to it; only the line-of-sight component of velocity changes the range.
:::

::: check
The potential $U = -\mu/r$ has the same value everywhere on a sphere of radius $r$. Use the gradient to explain why a satellite in a perfectly circular two-body orbit experiences no tangential acceleration.
:::

::: answer
The acceleration is $\mathbf{a} = -\nabla U = -\mu\,\mathbf{r}/r^3$, which is proportional to $\nabla r = \hat{\mathbf{r}}$ and therefore normal to the sphere $r = \text{const}$. The sphere is a level set of $U$, and the gradient is normal to level sets. Velocity on a circular orbit is tangent to that sphere, so $\mathbf{a} \cdot \mathbf{v} = 0$: no component of acceleration along the velocity, hence constant speed.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\nabla f = [\partial f/\partial x_1, \dots, \partial f/\partial x_n]^\top$ | gradient: column of partial derivatives, a vector field |
| $D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u} = \lVert \nabla f \rVert\cos\theta$ | directional derivative along unit $\mathbf{u}$ |
| $\nabla f \perp$ level set | zero directional derivative along tangents; unit normal $\nabla F/\lVert\nabla F\rVert$ |
| $\frac{d}{dt} f(\mathbf{r}(t)) = \nabla f \cdot \dot{\mathbf{r}}$ | chain rule along a curve (scalar case) |
| $\nabla \lVert \mathbf{r} \rVert = \hat{\mathbf{r}}$, $\nabla \lVert \mathbf{r} - \mathbf{r}_s \rVert = \hat{\mathbf{u}}$ | distance gradients are unit vectors along the line of sight |
| $\nabla (r^n) = n r^{n-2}\mathbf{r}$, $\nabla(1/r) = -\mathbf{r}/r^3$ | gradients of powers of distance |
| $\mathbf{a} = -\nabla(-\mu/r) = -\mu\mathbf{r}/r^3$ | gravitational acceleration, $8.68\,\mathrm{m/s^2}$ at $400\,\mathrm{km}$ |
| $\mathbf{x}_{k+1} = \mathbf{x}_k - \alpha\nabla f$ | gradient descent step |

The next lesson moves from scalar fields to vector-valued functions and stacks the transposed gradients of the components into a matrix: the Jacobian, which is the $\mathbf{H}$ matrix of an orbit-determination filter.
