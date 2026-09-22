---
id: l10-conservative-fields
title: Conservative fields, potentials and orbital energy
minutes: 27
covers:
  - conservative fields and potential functions
---

Lesson 7 found that the work gravity does between two points came out the same along every path tried, while the work drag does depends on the path's length. Lesson 8 found that gravity has zero curl. Lesson 9 showed that a curl-free field has zero circulation on a simply connected region. This lesson assembles those facts into a single idea: a **conservative** field is one that is the gradient of a scalar **potential**, and for such a field the work along any path is the difference of the potential between its endpoints. Three apparently different properties — having a potential, being curl-free, and doing no net work around closed loops — turn out to be the same property, and this lesson proves it.

For orbital mechanics this is the origin of the most useful scalar in the subject. Because gravity is conservative, the **specific mechanical energy** $\varepsilon = v^2/2 - \mu/r$ is constant along every two-body orbit. From that one constant follow the vis-viva equation, the escape speed, the size of an orbit from a single state vector, and a free diagnostic for any numerical propagator: if the energy it reports drifts, something is wrong. The last section runs that diagnostic on a fourth-order integrator and on a first-order one, with numbers.

The sign convention used throughout is the physicist's: a conservative force per unit mass is $\mathbf{F} = -\nabla U$, so that the potential energy $U$ *increases* in the direction the force opposes, and a body released from rest falls toward lower $U$. Mathematics texts often write $\mathbf{F} = \nabla\phi$ instead; $\phi = -U$ and nothing else changes.

## The fundamental theorem for line integrals

Let $U$ be a smooth scalar field and $C$ a curve from $A$ to $B$ parametrised by $\mathbf{r}(t)$, $a \le t \le b$. By the chain rule of Lesson 4, $\frac{d}{dt}U(\mathbf{r}(t)) = \nabla U\cdot\dot{\mathbf{r}}$, so the line integral of the gradient is the integral of a derivative:

$$
\int_C\nabla U\cdot d\mathbf{r} = \int_a^b\nabla U(\mathbf{r}(t))\cdot\dot{\mathbf{r}}(t)\,dt = \int_a^b\frac{d}{dt}U(\mathbf{r}(t))\,dt = U(B) - U(A) .
$$

This is the **fundamental theorem of calculus for line integrals**. The integral of a gradient field along any curve depends only on where the curve starts and ends, not on how it gets there. For a force $\mathbf{F} = -\nabla U$ the work done along $C$ is

$$
W_{A\to B} = \int_C\mathbf{F}\cdot d\mathbf{r} = -\big[U(B) - U(A)\big] = U(A) - U(B) :
$$

the force does positive work when the body moves to lower potential, and the work is **path-independent**. Two immediate consequences: around any closed curve, $A = B$ and the work is zero; and the potential is determined only up to an additive constant, since $\nabla(U + c) = \nabla U$.

::: example The three paths of Lesson 7, explained
Lesson 7 integrated $\mathbf{a} = -\mu\mathbf{r}/r^3$ from $r_1 = 6778.137\,\mathrm{km}$ to $r_2 = 7378.137\,\mathrm{km}$ along a radial line and along a diagonal straight line through $90^\circ$ of longitude, and got $-4.78224 \times 10^6\,\mathrm{J/kg}$ both times. With $U = -\mu/r$ and $\mathbf{a} = -\nabla U$ (Lesson 2), the theorem says every path from any point at radius $r_1$ to any point at radius $r_2$ gives

$$
W = U(r_1) - U(r_2) = -\frac{\mu}{r_1} + \frac{\mu}{r_2} = -58.8067 + 54.0245 = -4.7822\,\mathrm{MJ/kg},
$$

and the two numerical integrals were checks of this formula, not coincidences. From the surface ($R_e = 6378.137\,\mathrm{km}$) to $400\,\mathrm{km}$ altitude the work is $\mu(1/r_1 - 1/R_e) = -3.688\,\mathrm{MJ/kg}$; the kinetic energy of the orbit itself, $\tfrac{1}{2}(7668.6)^2 = 29.40\,\mathrm{MJ/kg}$, is eight times larger, which is why reaching orbit is mostly about speed, not height.
:::

## Three equivalent statements

A vector field $\mathbf{F}$ on a region $D$ is called **conservative** when any one of the following holds, because on a simply connected region they all hold together:

1. $\mathbf{F} = -\nabla U$ for some scalar potential $U$ on $D$.
2. $\nabla\times\mathbf{F} = \mathbf{0}$ throughout $D$, with $D$ simply connected.
3. $\oint_C\mathbf{F}\cdot d\mathbf{r} = 0$ for every closed curve $C$ in $D$ — equivalently, $\int_C\mathbf{F}\cdot d\mathbf{r}$ depends only on the endpoints of $C$.

::: key
Three equivalent statements that a force field is conservative: $\mathbf{F} = -\nabla U$ for some potential $U$; $\nabla\times\mathbf{F} = \mathbf{0}$ on a simply connected domain; the work $\oint\mathbf{F}\cdot d\mathbf{r}$ around any closed path is zero.
:::

The proof goes around the ring.

**(1) implies (3).** This is the fundamental theorem above: the closed-loop integral of a gradient is $U(A) - U(A) = 0$.

**(3) implies (1).** Path independence lets you *define* a potential. Fix a base point $\mathbf{r}_0$ and set $U(\mathbf{r}) = -\int_{\mathbf{r}_0}^{\mathbf{r}}\mathbf{F}\cdot d\mathbf{r}$ along any path — by (3) the value does not depend on which. To find $\partial U/\partial x$ at $\mathbf{r}$, compare $U$ at $\mathbf{r}$ and at $\mathbf{r} + h\hat{\mathbf{x}}$ using a path that goes to $\mathbf{r}$ first and then along the short straight segment: the difference is $-\int_0^h F_1(\mathbf{r} + s\hat{\mathbf{x}})\,ds \approx -F_1(\mathbf{r})\,h$, so $\partial U/\partial x = -F_1$. Likewise for $y$ and $z$, so $\nabla U = -\mathbf{F}$.

**(1) implies (2).** The curl of a gradient is zero (Lesson 8): $\nabla\times(-\nabla U) = \mathbf{0}$.

**(2) implies (3).** If $D$ is simply connected, every closed curve $C$ in $D$ bounds a surface $S$ inside $D$, and Stokes' theorem (Lesson 9) gives $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS = 0$.

The simple-connectedness in (2) is not a technicality. Consider, on the plane with the origin removed,

$$
\mathbf{F} = \frac{[-y,\ x,\ 0]^\top}{x^2 + y^2}, \qquad
(\nabla\times\mathbf{F})_z = \frac{\partial}{\partial x}\frac{x}{x^2 + y^2} - \frac{\partial}{\partial y}\frac{-y}{x^2 + y^2} = \frac{y^2 - x^2}{(x^2 + y^2)^2} + \frac{x^2 - y^2}{(x^2 + y^2)^2} = 0 .
$$

The curl vanishes everywhere the field is defined. Yet around the unit circle $\mathbf{r} = [\cos t, \sin t, 0]^\top$, $\mathbf{F}\cdot\dot{\mathbf{r}} = \sin^2 t + \cos^2 t = 1$ and the circulation is $2\pi$, not zero. The field is the gradient of the polar angle $\theta = \operatorname{atan2}(y, x)$, which cannot be defined continuously all the way around the origin — it jumps by $2\pi$. The loop encircles the hole where the curl is undefined, Stokes' theorem cannot be applied across it, and the field is not conservative on this domain. On any region that excludes a half-line from the origin, it is.

## Finding a potential from a field

Given $\mathbf{F}$ on a simply connected region, first check $\nabla\times\mathbf{F} = \mathbf{0}$; if it fails there is no potential and no point looking. If it passes, integrate one component at a time. Take $\mathbf{F} = [2xy + z,\ x^2,\ x]^\top$. The curl is $[\partial_y x - \partial_z x^2,\ \partial_z(2xy + z) - \partial_x x,\ \partial_x x^2 - \partial_y(2xy + z)]^\top = [0,\ 1 - 1,\ 2x - 2x]^\top = \mathbf{0}$. Seek $\phi$ with $\nabla\phi = \mathbf{F}$ (then $U = -\phi$):

- $\partial\phi/\partial x = 2xy + z$ gives $\phi = x^2y + xz + g(y, z)$, with $g$ an unknown function of the variables not integrated over;
- $\partial\phi/\partial y = x^2 + \partial g/\partial y$ must equal $x^2$, so $\partial g/\partial y = 0$ and $g = g(z)$;
- $\partial\phi/\partial z = x + g'(z)$ must equal $x$, so $g' = 0$ and $g$ is a constant.

Hence $\phi = x^2y + xz$ (plus a constant) and $U = -(x^2y + xz)$. As a check, the work from the origin to $(1, 2, 3)$ is $\phi(1, 2, 3) - \phi(0, 0, 0) = 2 + 3 = 5$; a numerical line integral along the straight line between them gives $5.0000$. Contrast $\mathbf{F} = [-y, x, 0]^\top$, whose curl is $[0, 0, 2]^\top$ (Lesson 8): the first step gives $\phi = -xy + g(y, z)$, and the second demands $-x + \partial g/\partial y = x$, impossible for a $g$ that does not depend on $x$. The procedure fails exactly when the curl is non-zero.

::: warning
Checking $\nabla\times\mathbf{F} = \mathbf{0}$ is the first step, not an optional one. Integrating the $x$ component of a non-conservative field produces a candidate $\phi$ whose other partial derivatives quietly disagree with $F_2$ and $F_3$, and a reader who never checks them walks away with a "potential" that is wrong.
:::

## The gravitational potential and orbital energy

Two-body gravity is conservative on the simply connected region outside the attracting body, with

$$
U = -\frac{\mu}{r}, \qquad \mathbf{a} = -\nabla U = -\mu\,\nabla\!\left(-\frac{1}{r}\right)\cdot(-1) = \mu\,\nabla\!\left(\frac{1}{r}\right) = -\frac{\mu\,\mathbf{r}}{r^3} = -\frac{\mu}{r^2}\,\hat{\mathbf{r}},
$$

using $\nabla(1/r) = -\mathbf{r}/r^3$ from Lesson 2. The potential is negative everywhere and rises toward zero at infinity, which is the natural choice of the additive constant: a body at rest infinitely far away has zero energy. The $J_2$ term of the module's exercise is also a potential, so oblate-Earth gravity is conservative too (the exercise's $\mathbf{a} = -\nabla U_{J_2}$ is exactly statement (1)); drag, which depends on velocity, and thrust, which is commanded, are not.

::: key
Two-body gravitational potential and the acceleration derived from it: $U = -\mu/r$, so $\mathbf{a} = -\nabla U = -\mu\,\hat{\mathbf{r}}/r^2 = -\mu\,\mathbf{r}/r^3$.
:::

### Conservation of specific energy

Lesson 4 differentiated $\varepsilon = \tfrac{1}{2}\mathbf{v}\cdot\mathbf{v} - \mu/r$ along a trajectory and found $\dot\varepsilon = \mathbf{v}\cdot(\mathbf{a} + \mu\mathbf{r}/r^3)$. The general statement is: for any conservative acceleration $\mathbf{a} = -\nabla U$,

$$
\frac{d}{dt}\left(\tfrac{1}{2}v^2 + U\right) = \mathbf{v}\cdot\mathbf{a} + \nabla U\cdot\mathbf{v} = \mathbf{v}\cdot(\mathbf{a} + \nabla U) = 0 .
$$

Kinetic plus potential energy per unit mass is constant. Equivalently, by the work–energy relation of Lesson 7 and the fundamental theorem, $\tfrac{1}{2}v_B^2 - \tfrac{1}{2}v_A^2 = W_{A\to B} = U(A) - U(B)$. For two-body motion the constant is the **specific mechanical energy**

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} .
$$

If $\varepsilon < 0$ the body cannot reach $r \to \infty$ (its kinetic energy would have to be negative) and the orbit is bound; $\varepsilon = 0$ is the boundary case, a parabola; $\varepsilon > 0$ is a hyperbola that escapes with residual speed $\sqrt{2\varepsilon}$. Setting $\varepsilon = 0$ gives the **escape speed** $v_{\text{esc}} = \sqrt{2\mu/r}$, which is $\sqrt{2}$ times the circular speed $\sqrt{\mu/r}$: at $400\,\mathrm{km}$, $10{,}845\,\mathrm{m/s}$ against $7669\,\mathrm{m/s}$.

### Vis-viva

For a bound orbit, energy conservation alone fixes the orbit's size. Let the periapsis and apoapsis radii be $r_p$ and $r_a$, with speeds $v_p$ and $v_a$. At both apses the velocity is perpendicular to the radius, so the conserved angular momentum of Lesson 5 gives $h = r_p v_p = r_a v_a$; energy conservation gives $\tfrac{1}{2}v_p^2 - \mu/r_p = \tfrac{1}{2}v_a^2 - \mu/r_a$. Substitute $v_a = v_p r_p/r_a$:

$$
\tfrac{1}{2}v_p^2\left(1 - \frac{r_p^2}{r_a^2}\right) = \mu\left(\frac{1}{r_p} - \frac{1}{r_a}\right) = \mu\,\frac{r_a - r_p}{r_p r_a}
\quad\Longrightarrow\quad v_p^2 = \frac{2\mu\,r_a}{r_p(r_p + r_a)},
$$

after cancelling the common factor $(r_a - r_p)$ and using $1 - r_p^2/r_a^2 = (r_a - r_p)(r_a + r_p)/r_a^2$. Then

$$
\varepsilon = \frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{\mu\,r_a}{r_p(r_p + r_a)} - \frac{\mu}{r_p} = \frac{\mu}{r_p}\cdot\frac{r_a - r_p - r_a}{r_p + r_a} = -\frac{\mu}{r_p + r_a} = -\frac{\mu}{2a},
$$

where $a = (r_p + r_a)/2$ is the semi-major axis of the ellipse. The energy depends on the size of the orbit and on nothing else — not on its eccentricity or orientation. Equating the two expressions for $\varepsilon$ at any point of the orbit gives the **vis-viva equation**

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right),
$$

which returns the speed at any radius from the semi-major axis alone, and conversely the semi-major axis — hence the period — from one measured position and speed. A circular orbit has $r = a$ and $v^2 = \mu/r$; a parabola has $a \to \infty$ and $v^2 = 2\mu/r$.

::: key
Gravity being conservative buys you a scalar potential, so the specific mechanical energy $\varepsilon = v^2/2 - \mu/r$ is conserved on a two-body orbit. That immediately yields vis-viva, $v^2 = \mu(2/r - 1/a)$ with $\varepsilon = -\mu/2a$, and gives a free numerical check on any propagator.
:::

::: example Energies of a low orbit and a transfer orbit
A circular orbit at $400\,\mathrm{km}$ ($r = a = 6778.137\,\mathrm{km}$) has $v = \sqrt{\mu/r} = 7668.6\,\mathrm{m/s}$ and

$$
\varepsilon = \frac{7668.6^2}{2} - \frac{3.986\times 10^{14}}{6.778137\times 10^6} = 29.403 - 58.807 = -29.40\,\mathrm{MJ/kg} = -\frac{\mu}{2r} .
$$

The kinetic energy is exactly half the magnitude of the potential energy, which is true of every circular orbit.

A geostationary transfer orbit with $r_p = 6678.137\,\mathrm{km}$ and $r_a = 42{,}164\,\mathrm{km}$ has $a = 24{,}421\,\mathrm{km}$ and $\varepsilon = -\mu/2a = -8.161\,\mathrm{MJ/kg}$, less negative than the low orbit because it reaches higher. Vis-viva gives $v_p = \sqrt{\mu(2/r_p - 1/a)} = 10{,}151\,\mathrm{m/s}$ and $v_a = 1608\,\mathrm{m/s}$. As checks: $\tfrac{1}{2}v_p^2 - \mu/r_p = -8.161\,\mathrm{MJ/kg}$, and $r_p v_p = r_a v_a = 6.779 \times 10^{10}\,\mathrm{m^2/s}$, so both conservation laws close. These are the numbers Lesson 5 used for the radius of curvature at the apses.
:::

## A free check on any propagator

A numerical integrator does not know that energy is conserved; it approximates $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ step by step, and every step makes a small error. Evaluating $\varepsilon$ from the propagated state at each step costs one line of code and turns those errors into a single number you can watch. If the dynamics contain only conservative accelerations, $\varepsilon$ should stay constant; the amount by which it drifts is a direct measure of integration error, and a sudden change is a direct sign of a bug.

::: example Energy drift of two integrators over one orbit
Propagate the $400\,\mathrm{km}$ circular orbit for one period, $T = 5553.6\,\mathrm{s}$, from $\mathbf{r}_0 = [6778.137, 0, 0]^\top\,\mathrm{km}$, $\mathbf{v}_0 = [0, 7.6686, 0]^\top\,\mathrm{km/s}$, with $\varepsilon_0 = -29.4034\,\mathrm{MJ/kg}$, using only $\mathbf{a} = -\mu\mathbf{r}/r^3$.

With the classical fourth-order Runge–Kutta method and a $60\,\mathrm{s}$ step ($93$ steps), the final energy differs from $\varepsilon_0$ by $-7.44\,\mathrm{J/kg}$, a relative drift of $-2.5 \times 10^{-7}$. With a $10\,\mathrm{s}$ step ($555$ steps) the drift is $-9.5 \times 10^{-4}\,\mathrm{J/kg}$, relative $-3.2 \times 10^{-11}$ — nearly $8000$ times smaller for a sixfold smaller step, the signature of a high-order method. On an eccentric orbit ($r_p = 6678\,\mathrm{km}$, $e = 0.7$, $T = 33{,}053\,\mathrm{s}$) the same two step sizes give relative drifts of $-5.3 \times 10^{-7}$ and $-6.7 \times 10^{-11}$; most of the error is made in the fast passage through periapsis.

With the forward Euler method and the same $60\,\mathrm{s}$ step, the energy after one revolution is off by $+1.07 \times 10^{7}\,\mathrm{J/kg}$, a relative error of $+36\%$, and the radius has grown to $12{,}010\,\mathrm{km}$: the "orbit" has spiralled outward by more than $5000\,\mathrm{km}$. Nothing in the Euler code is wrong; it is doing what a first-order method does. The energy check makes the difference between an acceptable and an unacceptable integrator visible in one number before you look at a single plot of the trajectory.
:::

The check has limits worth knowing. It is blind to errors that preserve the energy — a propagator using the wrong value of $\mu$ conserves the energy computed with that wrong $\mu$ — and it says nothing about the orientation of the orbit, since $\varepsilon$ depends only on $a$. Monitoring the angular momentum $\mathbf{h} = \mathbf{r}\times\mathbf{v}$ alongside it, which Lesson 5 showed is conserved for any central force, covers the orbit plane and shape; together the two constants of the motion catch nearly every implementation error a two-body propagator can have. Once non-conservative accelerations are added, energy is no longer constant, but its rate of change is known: $\dot\varepsilon = \mathbf{a}_{\text{nc}}\cdot\mathbf{v}$, so drag must make $\varepsilon$ fall at the rate $-a_D v$ (the $-6.76 \times 10^{-3}\,\mathrm{W/kg}$ of Lesson 7's check question), and a propagator whose energy falls at any other rate is still wrong.

::: note
Three properties of a force, three consequences, and it pays to keep them separate. A force with a *potential* conserves energy. A *central* force conserves angular momentum. An *inverse-square* force — and, among all power laws, only that one and the linear spring — gives orbits that close on themselves. Two-body gravity has all three properties. Oblate-Earth gravity keeps the first (it has the potential $U_{J_2}$), loses the second (the force is no longer exactly radial, so the orbit plane precesses) and loses the third (the orbit does not close; periapsis drifts). Drag loses all three.
:::

## Check yourself

::: check
Is $\mathbf{F} = [y\cos(xy) + 1,\ x\cos(xy),\ 2z]^\top$ conservative? If so, find a potential $U$ with $\mathbf{F} = -\nabla U$ and compute the work from $(0, 0, 0)$ to $(1, \pi/2, 2)$.
:::

::: answer
The curl: $z$ component $\partial_x[x\cos(xy)] - \partial_y[y\cos(xy) + 1] = [\cos(xy) - xy\sin(xy)] - [\cos(xy) - xy\sin(xy)] = 0$; the $x$ and $y$ components vanish because $F_3$ depends only on $z$ and $F_1$, $F_2$ do not depend on $z$. So it is conservative on all of space. Integrating, $\phi = \sin(xy) + x + z^2$ satisfies $\nabla\phi = \mathbf{F}$, so $U = -\sin(xy) - x - z^2$. The work is $\phi(1, \pi/2, 2) - \phi(0, 0, 0) = \sin(\pi/2) + 1 + 4 = 6$, along any path.
:::

::: check
A propagator that models two-body gravity plus $J_2$ reports that $\varepsilon = v^2/2 - \mu/r$ oscillates by about one part in $10^{4}$ over each orbit. Is this a bug?
:::

::: answer
Not necessarily. With $J_2$ included the acceleration is $-\nabla(U_{2\text{-body}} + U_{J_2})$, and the conserved quantity is $v^2/2 + U_{2\text{-body}} + U_{J_2}$, not $v^2/2 - \mu/r$ alone. The omitted term $U_{J_2}$ is of order $\tfrac{1}{2}J_2(R_e/r)^2 \approx 5 \times 10^{-4}$ of $\mu/r$ (Lesson 8) and varies around the orbit with latitude, so an oscillation of that order in the two-body energy is exactly what the physics predicts. The test is to add $U_{J_2}$ to the monitored energy: the total should then be constant to integrator precision. If it still oscillates, that is the bug.
:::

::: check
Show that for a circular orbit the kinetic energy is $-\varepsilon$ and the potential energy is $2\varepsilon$.
:::

::: answer
For a circular orbit $v^2 = \mu/r$ (Lesson 5), so the kinetic energy is $v^2/2 = \mu/2r$ and the potential is $U = -\mu/r$. Then $\varepsilon = \mu/2r - \mu/r = -\mu/2r$, so kinetic $= \mu/2r = -\varepsilon$ and potential $= -\mu/r = 2\varepsilon$. This is the virial relation for an inverse-square force: on average over any bound orbit, twice the kinetic energy equals minus the potential energy. A consequence worth remembering is that a satellite which loses energy to drag speeds up — $\varepsilon$ falls, so $-\varepsilon$, the kinetic energy, rises.
:::

::: check
A satellite at $r = 8000\,\mathrm{km}$ is observed with speed $8.5\,\mathrm{km/s}$. Find its specific energy, its semi-major axis, and whether it is bound.
:::

::: answer
$\varepsilon = \tfrac{1}{2}(8500)^2 - 3.986\times 10^{14}/(8\times 10^6) = 36.125 - 49.825 = -13.70\,\mathrm{MJ/kg}$. Negative, so bound. From $\varepsilon = -\mu/2a$, $a = -\mu/2\varepsilon = 3.986\times 10^{14}/(2\times 1.370\times 10^7) = 14{,}547\,\mathrm{km}$. The apoapsis radius is at most $2a - r_p$, and since $r_p \le 8000\,\mathrm{km}$ the satellite reaches at least $21{,}094\,\mathrm{km}$; the direction of the velocity, which the energy does not use, would pin down $r_p$ and $r_a$ individually through the angular momentum.
:::

::: check
Why does the work done by a conservative force around a closed path vanish, while the work done by drag around a closed orbit does not, even though both are line integrals of the form $\oint\mathbf{F}\cdot d\mathbf{r}$?
:::

::: answer
A conservative force is $-\nabla U$, and the line integral of a gradient is $U(\text{start}) - U(\text{end})$, which is zero when the path closes. Drag is $-a_D\hat{\mathbf{v}}$, which depends on the direction of motion, not on position alone: at each point it points against whichever way the body happens to be moving. No function of position has that as its gradient — its curl-free check cannot even be posed, because the field is not a field on space — and its integrand $-a_D\,ds$ is negative on every element of every path, so the closed-loop work is $-\oint a_D\,ds < 0$. Path-independence, and with it an energy that is conserved, is a property of position-dependent fields with zero curl, and drag is not one.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\int_C\nabla U\cdot d\mathbf{r} = U(B) - U(A)$ | fundamental theorem for line integrals: gradients integrate to endpoint differences |
| $\mathbf{F} = -\nabla U \Rightarrow W_{A\to B} = U(A) - U(B)$ | work of a conservative force is path-independent |
| $\mathbf{F} = -\nabla U$ $\Leftrightarrow$ $\nabla\times\mathbf{F} = \mathbf{0}$ (simply connected) $\Leftrightarrow$ $\oint\mathbf{F}\cdot d\mathbf{r} = 0$ | three equivalent statements of "conservative" |
| $[-y, x, 0]^\top/(x^2 + y^2)$ | curl-free but circulation $2\pi$: the domain has a hole |
| integrate $F_1$ in $x$, then match $F_2$, $F_3$ | finding a potential; check the curl first |
| $U = -\mu/r$, $\mathbf{a} = -\nabla U = -\mu\mathbf{r}/r^3$ | two-body potential and acceleration |
| $\varepsilon = v^2/2 - \mu/r = -\mu/2a$ | specific mechanical energy: $-29.40\,\mathrm{MJ/kg}$ at $400\,\mathrm{km}$ circular, $-8.16\,\mathrm{MJ/kg}$ for GTO |
| $v^2 = \mu(2/r - 1/a)$ | vis-viva; $v_{\text{esc}} = \sqrt{2\mu/r} = 10{,}845\,\mathrm{m/s}$ at $400\,\mathrm{km}$ |
| $\dot\varepsilon = \mathbf{a}_{\text{nc}}\cdot\mathbf{v}$ | energy changes only through non-conservative accelerations |
| RK4, $60\,\mathrm{s}$: $\Delta\varepsilon/\varepsilon = -2.5\times 10^{-7}$ per orbit; Euler: $+36\%$ | the propagator check in numbers |

This closes the module. The Jacobians of Lessons 3 and 4 become the $\mathbf{F}$ and $\mathbf{H}$ matrices of the estimation modules; the transport theorem of Lesson 5 is the starting point of the rotating-frames and rigid-body modules; and the potential, the energy integral and vis-viva from this lesson are the first three equations of the two-body module.
