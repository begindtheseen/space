---
id: l10-conservative-fields
title: Conservative fields, potentials and orbital energy
minutes: 22
covers:
  - conservative fields and potential functions
---

Drive to a trailhead and hike to the top of a hill. You could take the steep, direct trail or the long, winding one. Either way, you end up the same height above the parking lot. The height you climbed depends only on where you started and where you stopped, not on the trail. And if you hike a loop that brings you back to the car, your total climb is zero.

Some force fields behave exactly like that. Lesson 7 found that the work gravity does between two points came out the same along every path tried, while the work drag does depends on how long the path is. Lesson 8 found that gravity has zero curl. Lesson 9 showed that a curl-free field has zero circulation on a region with no holes. This lesson puts those facts together. A **conservative** field is one that comes from a **potential** — a "height" function — and for such a field the work along any path is the difference in potential between its ends. Three properties that look different — having a potential, having zero curl, and doing no net work around loops — turn out to be the same property.

For orbital mechanics this gives the most useful single number in the subject. Because gravity is conservative, the **specific mechanical energy** $\varepsilon = v^2/2 - \mu/r$ ("epsilon": energy per kilogram) stays constant along every two-body orbit. From that one constant come the vis-viva equation, the escape speed, the size of an orbit from one position and velocity, and a free test for any orbit simulation: if the energy it reports drifts, something is wrong.

One sign convention runs through the lesson. A conservative force per unit mass is written $\mathbf{F} = -\nabla U$, with a **[[minus sign|minus-sign]]**. Then the **potential energy** $U$ goes *up* in the direction the force resists, and a body let go from rest moves toward lower $U$ — the way water runs downhill. Math books often write $\mathbf{F} = \nabla\phi$ instead ($\phi$, "phi"); then $\phi = -U$ and nothing else changes.

## Height, not trail: the fundamental theorem for line integrals

Let $U$ be a smooth scalar field — one number at every point, like the height of the land. Let $C$ be a curve from point $A$ to point $B$, traced by $\mathbf{r}(t)$ as $t$ runs from $a$ to $b$. The chain rule of Lesson 4 says how fast $U$ changes as you move along the curve:

$$
\frac{d}{dt}U(\mathbf{r}(t)) = \nabla U\cdot\dot{\mathbf{r}} .
$$

So the line integral of the gradient is the integral of an ordinary derivative, and the ordinary fundamental theorem of calculus finishes the job:

$$
\int_C\nabla U\cdot d\mathbf{r} = \int_a^b\nabla U(\mathbf{r}(t))\cdot\dot{\mathbf{r}}(t)\,dt = \int_a^b\frac{d}{dt}U(\mathbf{r}(t))\,dt = U(B) - U(A) .
$$

This is the **fundamental theorem of calculus for line integrals**. The integral of a gradient along any curve depends only on where the curve starts and ends.

For a force $\mathbf{F} = -\nabla U$, flip the sign. The work done along $C$ is

$$
W_{A\to B} = \int_C\mathbf{F}\cdot d\mathbf{r} = -\big[U(B) - U(A)\big] = U(A) - U(B) .
$$

Read $W_{A\to B}$ as "the work from A to B". The force does positive work when the body moves to lower potential, and the work is **path-independent**: every trail gives the same answer.

Two consequences follow at once. Around any closed curve, $B = A$ and the work is zero. And the potential is only fixed up to an added constant, because $\nabla(U + c) = \nabla U$ — like measuring heights from sea level or from the parking lot.

::: example The three paths of Lesson 7, explained
Lesson 7 integrated gravity, $\mathbf{a} = -\mu\mathbf{r}/r^3$, from radius $r_1 = 6778.137\,\mathrm{km}$ to $r_2 = 7378.137\,\mathrm{km}$ (from $400$ to $1000\,\mathrm{km}$ altitude), along a straight radial line and along a slanted line through $90^\circ$ of longitude. Both gave $-4.78224 \times 10^6\,\mathrm{J/kg}$.

Lesson 2 showed $\mathbf{a} = -\nabla U$ with $U = -\mu/r$. So the theorem says *every* path from radius $r_1$ to radius $r_2$ gives

$$
W = U(r_1) - U(r_2) = -\frac{\mu}{r_1} + \frac{\mu}{r_2} = -58.8067 + 54.0245 = -4.7822\,\mathrm{MJ/kg}.
$$

(Here $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, and $1\,\mathrm{MJ/kg} = 10^6\,\mathrm{J/kg}$.) The work is negative because gravity pulls down while the body moves up. The two numerical integrals were checks of this formula, not lucky matches.

Now climb from the surface ($R_e = 6378.137\,\mathrm{km}$) to $400\,\mathrm{km}$. Gravity's work is $\mu(1/r_1 - 1/R_e) = -3.688\,\mathrm{MJ/kg}$. Compare the kinetic energy of the orbit itself: $\tfrac{1}{2}(7668.6)^2 = 29.40\,\mathrm{MJ/kg}$, about eight times larger. Reaching orbit is mostly about speed, not height.
:::

## Three ways to say "conservative"

A vector field $\mathbf{F}$ on a region $D$ is called **conservative** when any one of these holds — because on a simply connected region (Lesson 9: every loop can shrink to a point) they all hold together:

1. $\mathbf{F} = -\nabla U$ for some scalar potential $U$ on $D$.
2. $\nabla\times\mathbf{F} = \mathbf{0}$ throughout $D$, with $D$ simply connected.
3. $\oint_C\mathbf{F}\cdot d\mathbf{r} = 0$ for every closed curve $C$ in $D$. Said another way: $\int_C\mathbf{F}\cdot d\mathbf{r}$ depends only on the ends of $C$.

::: key
Three equivalent statements that a force field is conservative: $\mathbf{F} = -\nabla U$ for some potential $U$; $\nabla\times\mathbf{F} = \mathbf{0}$ on a simply connected domain; the work $\oint\mathbf{F}\cdot d\mathbf{r}$ around any closed path is zero.
:::

In hiking terms: there is a height map (1); the ground has no twist in it (2); every loop hike climbs zero in total (3).

::: note Why it has to be true
The proof goes around a ring of four steps.

**(1) gives (3).** This is the theorem above: around a closed loop, the work is $U(A) - U(A) = 0$.

**(3) gives (1).** If the work ignores the path, you can *build* a potential. Pick a base point $\mathbf{r}_0$ and define $U(\mathbf{r}) = -\int_{\mathbf{r}_0}^{\mathbf{r}}\mathbf{F}\cdot d\mathbf{r}$ along any path; by (3), every path gives the same value. To find $\partial U/\partial x$ at $\mathbf{r}$, compare $U$ at $\mathbf{r}$ and at $\mathbf{r} + h\hat{\mathbf{x}}$, using a path that goes to $\mathbf{r}$ first and then along a short straight step of length $h$. The difference is $-\int_0^h F_1(\mathbf{r} + s\hat{\mathbf{x}})\,ds \approx -F_1(\mathbf{r})\,h$. Divide by $h$: $\partial U/\partial x = -F_1$. The same works for $y$ and $z$, so $\nabla U = -\mathbf{F}$.

**(1) gives (2).** The curl of a gradient is zero (Lesson 8), so $\nabla\times(-\nabla U) = \mathbf{0}$.

**(2) gives (3).** On a simply connected $D$, every closed curve $C$ is the edge of a surface $S$ inside $D$. Stokes' theorem (Lesson 9) gives $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS = 0$.
:::

### A curl-free field that is not conservative

The words "simply connected" in statement 2 are not fine print. Here is the field that shows why. On the plane with the origin removed, take

$$
\mathbf{F} = \frac{[-y,\ x,\ 0]^\top}{x^2 + y^2} .
$$

It swirls around the origin, weaker farther out. Its curl has only a $z$ part:

$$
(\nabla\times\mathbf{F})_z = \frac{\partial}{\partial x}\frac{x}{x^2 + y^2} - \frac{\partial}{\partial y}\frac{-y}{x^2 + y^2} = \frac{y^2 - x^2}{(x^2 + y^2)^2} + \frac{x^2 - y^2}{(x^2 + y^2)^2} = 0 .
$$

(Each derivative is the quotient rule. For the first: $\frac{(x^2 + y^2) - x\cdot 2x}{(x^2 + y^2)^2} = \frac{y^2 - x^2}{(x^2 + y^2)^2}$.) So the curl is zero everywhere the field is defined.

Now walk around the unit circle, $\mathbf{r} = [\cos t, \sin t, 0]^\top$. On it, $x^2 + y^2 = 1$ and $\dot{\mathbf{r}} = [-\sin t, \cos t, 0]^\top$, so

$$
\mathbf{F}\cdot\dot{\mathbf{r}} = \sin^2 t + \cos^2 t = 1, \qquad \oint_C\mathbf{F}\cdot d\mathbf{r} = \int_0^{2\pi}1\,dt = 2\pi .
$$

Not zero. What went wrong? This field is the gradient of the polar angle $\theta = \operatorname{atan2}(y, x)$. But the angle cannot be defined smoothly all the way around the origin: going once around, it has to **[[jump by 2π|angle-seam]]** somewhere. The loop surrounds the hole where the field is undefined, so Stokes' theorem cannot be used across it, and the field is not conservative on this region. Cut the plane along any half-line from the origin, and on what is left — which is simply connected — it is.

## Finding a potential from a field

Given a field $\mathbf{F}$ on a simply connected region, how do you find its potential?

**Step 0: check the curl.** If $\nabla\times\mathbf{F} \ne \mathbf{0}$, there is no potential and no point looking.

**Then integrate one component at a time.** Take $\mathbf{F} = [2xy + z,\ x^2,\ x]^\top$. The curl is

$$
\nabla\times\mathbf{F} = \begin{bmatrix} \partial_y x - \partial_z x^2 \\ \partial_z(2xy + z) - \partial_x x \\ \partial_x x^2 - \partial_y(2xy + z) \end{bmatrix} = \begin{bmatrix} 0 - 0 \\ 1 - 1 \\ 2x - 2x \end{bmatrix} = \mathbf{0} .
$$

It passes. Look for $\phi$ with $\nabla\phi = \mathbf{F}$ (then $U = -\phi$):

- $\partial\phi/\partial x = 2xy + z$. Integrate in $x$: $\phi = x^2y + xz + g(y, z)$. The "constant" of integration can be any function $g$ of the variables we did not integrate over.
- $\partial\phi/\partial y = x^2 + \partial g/\partial y$ must equal $F_2 = x^2$. So $\partial g/\partial y = 0$, and $g$ depends on $z$ only.
- $\partial\phi/\partial z = x + g'(z)$ must equal $F_3 = x$. So $g' = 0$, and $g$ is a plain constant.

So $\phi = x^2y + xz$ (plus any constant), and $U = -(x^2y + xz)$.

Sanity check: the work from the origin to $(1, 2, 3)$ is $\phi(1, 2, 3) - \phi(0, 0, 0) = 1\cdot 2 + 1\cdot 3 - 0 = 5$. A numerical line integral along the straight line between them also gives $5.0000$.

Now try it on a field that fails. $\mathbf{F} = [-y, x, 0]^\top$ has curl $[0, 0, 2]^\top$ (Lesson 8). The first step gives $\phi = -xy + g(y, z)$. The second demands $-x + \partial g/\partial y = x$, so $\partial g/\partial y = 2x$ — impossible for a $g$ that does not depend on $x$. The method breaks exactly when the curl is not zero.

::: warning Check the curl first
Checking $\nabla\times\mathbf{F} = \mathbf{0}$ is the first step, not an optional extra. Integrate the $x$ part of a non-conservative field and you still get a candidate $\phi$. Its other partial derivatives quietly disagree with $F_2$ and $F_3$, and if you never check them you walk away with a "potential" that is wrong.
:::

## The gravitational potential and orbital energy

Two-body gravity is conservative on the region outside the attracting body, which is simply connected. Its potential is $U = -\mu/r$. Take the gradient with $\nabla(1/r) = -\mathbf{r}/r^3$ from Lesson 2:

$$
\mathbf{a} = -\nabla U = -\nabla\!\left(-\frac{\mu}{r}\right) = \mu\,\nabla\!\left(\frac{1}{r}\right) = -\frac{\mu\,\mathbf{r}}{r^3} = -\frac{\mu}{r^2}\,\hat{\mathbf{r}} .
$$

The two minus signs cancel in the third step, the fourth uses $\nabla(1/r)$, and the last writes $\mathbf{r} = r\hat{\mathbf{r}}$.

::: key
Two-body gravitational potential and the acceleration derived from it: $U = -\mu/r$, so $\mathbf{a} = -\nabla U = -\mu\,\hat{\mathbf{r}}/r^2 = -\mu\,\mathbf{r}/r^3$.
:::

The potential is negative everywhere and **[[rises toward zero|zero-at-infinity]]** far away. That is the natural choice of the added constant: a body at rest infinitely far away has zero energy.

The $J_2$ term of the module's exercise is also a potential, so the gravity of a flattened Earth is conservative too — the exercise's $\mathbf{a} = -\nabla U_{J_2}$ is exactly statement 1. Drag is not conservative, because it depends on velocity. Neither is thrust, which is whatever the engine is commanded to do.

### Energy stays constant

Lesson 4 differentiated $\varepsilon = \tfrac{1}{2}\mathbf{v}\cdot\mathbf{v} - \mu/r$ along a trajectory and found $\dot\varepsilon = \mathbf{v}\cdot(\mathbf{a} + \mu\mathbf{r}/r^3)$. Here is the general version. For any conservative acceleration $\mathbf{a} = -\nabla U$, use $\frac{d}{dt}\tfrac{1}{2}v^2 = \mathbf{v}\cdot\dot{\mathbf{v}} = \mathbf{v}\cdot\mathbf{a}$ and the chain rule for $U$:

$$
\frac{d}{dt}\left(\tfrac{1}{2}v^2 + U\right) = \mathbf{v}\cdot\mathbf{a} + \nabla U\cdot\mathbf{v} = \mathbf{v}\cdot(\mathbf{a} + \nabla U) = 0 .
$$

The bracket is zero because $\mathbf{a} = -\nabla U$. Kinetic plus potential energy per kilogram never changes. Another way to see it: by Lesson 7's work–energy relation and the theorem above, $\tfrac{1}{2}v_B^2 - \tfrac{1}{2}v_A^2 = W_{A\to B} = U(A) - U(B)$ — speed gained equals potential lost.

For two-body motion this constant is the **specific mechanical energy**:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} .
$$

Its sign tells you the kind of orbit:

- $\varepsilon < 0$: the orbit is **bound**. Reaching $r \to \infty$ would need negative kinetic energy, which is impossible.
- $\varepsilon = 0$: the borderline case, a parabola.
- $\varepsilon > 0$: a hyperbola that escapes, keeping a leftover speed of $\sqrt{2\varepsilon}$ far away.

Setting $\varepsilon = 0$ gives the **[[escape speed|escape-speed]]** $v_{\text{esc}} = \sqrt{2\mu/r}$. That is $\sqrt{2}$ times the circular speed $\sqrt{\mu/r}$. At $400\,\mathrm{km}$ altitude: $10{,}845\,\mathrm{m/s}$ against $7669\,\mathrm{m/s}$.

### Vis-viva

For a bound orbit, energy alone fixes the orbit's size. Here is the derivation.

Let the closest and farthest points (periapsis and apoapsis) have radii $r_p$ and $r_a$ and speeds $v_p$ and $v_a$. At both points the velocity is at right angles to the radius, so the conserved angular momentum of Lesson 5 gives

$$
h = r_p v_p = r_a v_a, \qquad\text{so}\qquad v_a = v_p\,\frac{r_p}{r_a} .
$$

Energy conservation gives $\tfrac{1}{2}v_p^2 - \mu/r_p = \tfrac{1}{2}v_a^2 - \mu/r_a$. Move the speeds to the left, the $\mu$ terms to the right, and put in $v_a$:

$$
\tfrac{1}{2}v_p^2\left(1 - \frac{r_p^2}{r_a^2}\right) = \mu\left(\frac{1}{r_p} - \frac{1}{r_a}\right) = \mu\,\frac{r_a - r_p}{r_p r_a} .
$$

The bracket on the left factors as $1 - r_p^2/r_a^2 = (r_a - r_p)(r_a + r_p)/r_a^2$. Both sides now contain $(r_a - r_p)$; cancel it and solve for $v_p^2$:

$$
v_p^2 = \frac{2\mu\,r_a}{r_p(r_p + r_a)} .
$$

Put this back into the energy at periapsis:

$$
\varepsilon = \frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{\mu\,r_a}{r_p(r_p + r_a)} - \frac{\mu}{r_p} = \frac{\mu}{r_p}\cdot\frac{r_a - (r_p + r_a)}{r_p + r_a} = -\frac{\mu}{r_p + r_a} = -\frac{\mu}{2a},
$$

where $a = (r_p + r_a)/2$ is the **semi-major axis**, half the long width of the ellipse. The energy depends on the orbit's size and nothing else — not on how stretched it is or which way it points.

Now set the two expressions for $\varepsilon$ equal at any point of the orbit: $v^2/2 - \mu/r = -\mu/2a$. Multiply by $2$ and rearrange to get the **[[vis-viva equation|vis-viva-name]]**:

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right) .
$$

It gives the speed at any radius from the semi-major axis alone. Run backward, it gives the semi-major axis — and so the orbital period — from one measured position and speed. Checks: a circular orbit has $r = a$, so $v^2 = \mu/r$; a parabola has $a \to \infty$, so $v^2 = 2\mu/r$, the escape speed.

::: key
Gravity being conservative buys you a scalar potential, so the specific mechanical energy $\varepsilon = v^2/2 - \mu/r$ is conserved on a two-body orbit. That immediately yields vis-viva, $v^2 = \mu(2/r - 1/a)$ with $\varepsilon = -\mu/2a$, and gives a free numerical check on any propagator.
:::

::: example Energies of a low orbit and a transfer orbit
**A circular orbit at 400 km.** Here $r = a = 6778.137\,\mathrm{km}$ and $v = \sqrt{\mu/r} = 7668.6\,\mathrm{m/s}$. Then

$$
\varepsilon = \frac{7668.6^2}{2} - \frac{3.986\times 10^{14}}{6.778137\times 10^6} = 29.403 - 58.807 = -29.40\,\mathrm{MJ/kg} = -\frac{\mu}{2r} .
$$

The **[[kinetic energy is exactly half|energy-bars]]** the size of the potential energy. That is true of every circular orbit.

**A geostationary transfer orbit.** A **[[GTO|gto]]** has $r_p = 6678.137\,\mathrm{km}$ and $r_a = 42{,}164\,\mathrm{km}$. So

$$
a = \frac{6678.137 + 42{,}164}{2} = 24{,}421\,\mathrm{km}, \qquad \varepsilon = -\frac{\mu}{2a} = -\frac{3.986\times 10^{14}}{2 \times 2.4421\times 10^7} = -8.161\,\mathrm{MJ/kg}.
$$

That is less negative than the low orbit, because it reaches much higher. Vis-viva gives the speeds:

$$
v_p = \sqrt{\mu\left(\frac{2}{r_p} - \frac{1}{a}\right)} = 10{,}151\,\mathrm{m/s}, \qquad v_a = \sqrt{\mu\left(\frac{2}{r_a} - \frac{1}{a}\right)} = 1608\,\mathrm{m/s}.
$$

Two checks. Energy: $\tfrac{1}{2}v_p^2 - \mu/r_p = -8.161\,\mathrm{MJ/kg}$, the same. Angular momentum: $r_p v_p = r_a v_a = 6.779 \times 10^{10}\,\mathrm{m^2/s}$. Both conservation laws agree. These are the numbers Lesson 5 used for the radius of curvature at the two ends of the orbit.
:::

## A free check on any propagator

A **propagator** is the program that steps a spacecraft's position and velocity forward in time. It does not know that energy is conserved. It approximates the equations of motion step by step, and every step makes a small error.

Computing $\varepsilon$ from the state at each step costs one line of code and turns all those errors into one number you can watch. If the model contains only conservative accelerations, $\varepsilon$ should stay constant. How much it drifts measures the integration error. A sudden jump points to a bug.

::: example Energy drift of two integrators over one orbit
Propagate the $400\,\mathrm{km}$ circular orbit for one period, $T = 5553.6\,\mathrm{s}$, from $\mathbf{r}_0 = [6778.137, 0, 0]^\top\,\mathrm{km}$ and $\mathbf{v}_0 = [0, 7.6686, 0]^\top\,\mathrm{km/s}$, with $\varepsilon_0 = -29.4034\,\mathrm{MJ/kg}$. The only force is $\mathbf{a} = -\mu\mathbf{r}/r^3$. Use a whole number of fixed steps, the nearest to one period.

```python
import numpy as np

mu = 3.986e14                                   # Earth, m^3/s^2

def f(x):                                       # state x = [r, v]
    r = x[:3]
    return np.concatenate([x[3:], -mu * r / np.linalg.norm(r)**3])

def energy(x):                                  # specific energy, J/kg
    return 0.5 * x[3:] @ x[3:] - mu / np.linalg.norm(x[:3])

def rk4(x, h):
    k1 = f(x); k2 = f(x + h/2*k1); k3 = f(x + h/2*k2); k4 = f(x + h*k3)
    return x + h/6 * (k1 + 2*k2 + 2*k3 + k4)

def euler(x, h):
    return x + h * f(x)

r0 = 6778.137e3
x0 = np.array([r0, 0, 0, 0, np.sqrt(mu / r0), 0])
T = 2 * np.pi * np.sqrt(r0**3 / mu)             # 5553.6 s
for step, h in [(rk4, 60.0), (rk4, 10.0), (euler, 60.0)]:
    x = x0.copy()
    for _ in range(round(T / h)):
        x = step(x, h)
    d = energy(x) - energy(x0)
    print(f"{step.__name__:5s} h={h:4.0f} s  d_eps={d:10.3e} J/kg  "
          f"rel={d / abs(energy(x0)):+.2e}  r={np.linalg.norm(x[:3])/1e3:7.0f} km")
# rk4   h=  60 s  d_eps=-7.439e+00 J/kg  rel=-2.53e-07  r=   6778 km
# rk4   h=  10 s  d_eps=-9.507e-04 J/kg  rel=-3.23e-11  r=   6778 km
# euler h=  60 s  d_eps= 1.072e+07 J/kg  rel=+3.64e-01  r=  12010 km
```

**The good integrator.** With the classical fourth-order **[[Runge–Kutta|runge-kutta]]** method (RK4) and $60\,\mathrm{s}$ steps ($93$ of them), the energy ends $7.44\,\mathrm{J/kg}$ low: a relative drift of $-2.5 \times 10^{-7}$. With $10\,\mathrm{s}$ steps ($555$ of them) the drift is $-9.5 \times 10^{-4}\,\mathrm{J/kg}$, relative $-3.2 \times 10^{-11}$. The step got $6$ times smaller and the error nearly $8000$ times smaller — the mark of a high-order method. On a stretched orbit ($r_p = 6678\,\mathrm{km}$, $e = 0.7$, $T = 33{,}053\,\mathrm{s}$) the same two step sizes give relative drifts of $-5.3 \times 10^{-7}$ and $-6.7 \times 10^{-11}$. Most of that error is made in the fast swing past periapsis.

**The poor integrator.** With the forward Euler method and the same $60\,\mathrm{s}$ step, the energy after one revolution is off by $+1.07 \times 10^{7}\,\mathrm{J/kg}$ — a relative error of $+36\%$. The radius has grown to $12{,}010\,\mathrm{km}$: the "orbit" has **[[spiraled outward|euler-spiral]]** by more than $5000\,\mathrm{km}$. Nothing in the Euler code is wrong. It is doing what a first-order method does. The energy check shows the difference between a good and a bad integrator in one number, before you look at a single plot.
:::

The check has limits worth knowing:

- It is blind to errors that keep the energy constant. A propagator using the wrong $\mu$ conserves the energy computed with that wrong $\mu$.
- It says nothing about which way the orbit points, since $\varepsilon$ depends only on $a$. Watch the angular momentum $\mathbf{h} = \mathbf{r}\times\mathbf{v}$ too — Lesson 5 showed it is conserved for any central force — and you cover the orbit's plane and shape. Together the two constants catch nearly every mistake a two-body propagator can have.
- Once non-conservative forces are added, energy is no longer constant, but its rate of change is known: $\dot\varepsilon = \mathbf{a}_{\text{nc}}\cdot\mathbf{v}$, where $\mathbf{a}_{\text{nc}}$ is the non-conservative acceleration. Drag must make $\varepsilon$ fall at the rate $-a_D v$ (the $-6.76 \times 10^{-3}\,\mathrm{W/kg}$ of Lesson 7's check question). A propagator whose energy falls at any other rate is still wrong.

::: note Three properties, three different payoffs
Keep these separate. A force with a *potential* conserves energy. A *central* force (pointing along the line to a center) conserves angular momentum. An *inverse-square* force gives orbits that **[[close on themselves|closed-orbits]]**. Two-body gravity has all three. Flattened-Earth gravity keeps the first (it has the potential $U_{J_2}$), loses the second (the force is no longer exactly radial, so the orbit plane slowly turns) and loses the third (the orbit does not close; the periapsis drifts). Drag loses all three.
:::

## Check yourself

::: check
Is $\mathbf{F} = [y\cos(xy) + 1,\ x\cos(xy),\ 2z]^\top$ conservative? If so, find a potential $U$ with $\mathbf{F} = -\nabla U$ and compute the work from $(0, 0, 0)$ to $(1, \pi/2, 2)$.
:::

::: answer
Check the curl. The $z$ part is

$$
\partial_x[x\cos(xy)] - \partial_y[y\cos(xy) + 1] = [\cos(xy) - xy\sin(xy)] - [\cos(xy) - xy\sin(xy)] = 0 .
$$

(Both are product rules.) The $x$ and $y$ parts are zero because $F_3 = 2z$ depends only on $z$, and $F_1$, $F_2$ do not depend on $z$. So the field is conservative on all of space.

Integrate $F_1$ in $x$: $\phi = \sin(xy) + x + g(y, z)$. Then $\partial_y\phi = x\cos(xy) + \partial_y g$ must equal $F_2$, so $g = g(z)$, and $\partial_z\phi = g'(z) = 2z$ gives $g = z^2$. So $\phi = \sin(xy) + x + z^2$ and $U = -\sin(xy) - x - z^2$.

The work, along any path, is $\phi(1, \pi/2, 2) - \phi(0, 0, 0) = \sin(\pi/2) + 1 + 4 - 0 = 6$.
:::

::: check
A propagator that models two-body gravity plus $J_2$ reports that $\varepsilon = v^2/2 - \mu/r$ wobbles by about one part in $10^{4}$ over each orbit. Is this a bug?
:::

::: answer
Not necessarily. With $J_2$ included, the acceleration is $-\nabla(U_{2\text{-body}} + U_{J_2})$, so the conserved quantity is $v^2/2 + U_{2\text{-body}} + U_{J_2}$ — not $v^2/2 - \mu/r$ alone.

The missing term $U_{J_2}$ is of order $\tfrac{1}{2}J_2(R_e/r)^2 \approx 5 \times 10^{-4}$ of $\mu/r$ (Lesson 8), and it changes around the orbit with latitude. A wobble of that order in the two-body energy is exactly what the physics predicts.

The test: add $U_{J_2}$ to the monitored energy. The total should then stay constant to the integrator's precision. If it still wobbles, *that* is the bug.
:::

::: check
Show that for a circular orbit the kinetic energy is $-\varepsilon$ and the potential energy is $2\varepsilon$.
:::

::: answer
For a circular orbit $v^2 = \mu/r$ (Lesson 5). So the kinetic energy is $v^2/2 = \mu/2r$, and the potential energy is $U = -\mu/r$. Add them: $\varepsilon = \mu/2r - \mu/r = -\mu/2r$.

So kinetic $= \mu/2r = -\varepsilon$, and potential $= -\mu/r = 2\varepsilon$.

This is the **virial relation** for an inverse-square force: averaged over any bound orbit, twice the kinetic energy equals minus the potential energy. A surprising consequence: a satellite that loses energy to drag *speeds up*. $\varepsilon$ falls, so $-\varepsilon$ — the kinetic energy — rises, as the satellite sinks to a lower, faster orbit.
:::

::: check
A satellite at $r = 8000\,\mathrm{km}$ is seen moving at $8.5\,\mathrm{km/s}$. Find its specific energy and semi-major axis, and say whether it is bound.
:::

::: answer
Energy:

$$
\varepsilon = \tfrac{1}{2}(8500)^2 - \frac{3.986\times 10^{14}}{8\times 10^6} = 36.125 - 49.825 = -13.70\,\mathrm{MJ/kg}.
$$

Negative, so it is bound.

Semi-major axis, from $\varepsilon = -\mu/2a$:

$$
a = -\frac{\mu}{2\varepsilon} = \frac{3.986\times 10^{14}}{2\times 1.370\times 10^7} = 14{,}547\,\mathrm{km}.
$$

More is possible. The apoapsis radius is $r_a = 2a - r_p$, and the periapsis can be no farther out than the satellite is now, $r_p \le 8000\,\mathrm{km}$. So the satellite reaches at least $2 \times 14{,}547 - 8000 = 21{,}095\,\mathrm{km}$. Pinning down $r_p$ and $r_a$ exactly would need the direction of the velocity, which the energy does not use, through the angular momentum.
:::

::: check
Both the work of a conservative force and the work of drag around a closed path are line integrals $\oint\mathbf{F}\cdot d\mathbf{r}$. Why is the first zero and the second not?
:::

::: answer
A conservative force is $-\nabla U$, and the line integral of a gradient is $U(\text{start}) - U(\text{end})$, which is zero when the path closes.

Drag is $-a_D\hat{\mathbf{v}}$: it points against whichever way the body happens to be moving. It depends on the motion, not on position alone, so it is not a field on space at all, and no function of position can have it as a gradient. Its curl test cannot even be set up. And its work on each small piece of path is $-a_D\,ds$, negative on every piece of every path, so the loop total is $-\oint a_D\,ds < 0$.

Path-independence, and with it conserved energy, belongs to position-dependent fields with zero curl. Drag is not one.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\int_C\nabla U\cdot d\mathbf{r} = U(B) - U(A)$ | fundamental theorem for line integrals: a gradient integrates to an end-to-end difference |
| $\mathbf{F} = -\nabla U \Rightarrow W_{A\to B} = U(A) - U(B)$ | work of a conservative force ignores the path |
| $\mathbf{F} = -\nabla U$ $\Leftrightarrow$ $\nabla\times\mathbf{F} = \mathbf{0}$ (simply connected) $\Leftrightarrow$ $\oint\mathbf{F}\cdot d\mathbf{r} = 0$ | three equivalent statements of "conservative" |
| $[-y, x, 0]^\top/(x^2 + y^2)$ | curl-free but circulation $2\pi$: the region has a hole |
| integrate $F_1$ in $x$, then match $F_2$, $F_3$ | finding a potential; check the curl first |
| $U = -\mu/r$, $\mathbf{a} = -\nabla U = -\mu\mathbf{r}/r^3$ | two-body potential and acceleration |
| $\varepsilon = v^2/2 - \mu/r = -\mu/2a$ | specific energy: $-29.40\,\mathrm{MJ/kg}$ at $400\,\mathrm{km}$ circular, $-8.16\,\mathrm{MJ/kg}$ for GTO |
| $v^2 = \mu(2/r - 1/a)$ | vis-viva; $v_{\text{esc}} = \sqrt{2\mu/r} = 10{,}845\,\mathrm{m/s}$ at $400\,\mathrm{km}$ |
| $\dot\varepsilon = \mathbf{a}_{\text{nc}}\cdot\mathbf{v}$ | energy changes only through non-conservative accelerations |
| RK4, $60\,\mathrm{s}$: $\Delta\varepsilon/\lvert\varepsilon\rvert = -2.5\times 10^{-7}$ per orbit; Euler: $+36\%$ | the propagator check in numbers |

This closes the module. The Jacobians of Lessons 3 and 4 become the $\mathbf{F}$ and $\mathbf{H}$ matrices of the estimation modules. The transport theorem of Lesson 5 starts the rotating-frames and rigid-body modules. And the potential, the energy integral and vis-viva from this lesson are the first three equations of the two-body module.

::: context minus-sign Why the minus sign
With $\mathbf{F} = -\nabla U$, the force points *down* the potential slope, the way a ball on a hillside rolls toward lower ground. The gradient points uphill (Lesson 2: steepest ascent), so the minus sign turns it around. That makes $U$ behave like height times gravity: the higher up, the more potential energy, and letting go turns potential energy into speed.
:::

::: context angle-seam Where the angle has to jump
Walk once around the origin, reading off the polar angle $\theta = \operatorname{atan2}(y, x)$. It climbs smoothly from $-\pi$ to $\pi$, then must jump back by $2\pi$ as you cross the negative $x$ axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="100" x2="40" y2="100" stroke="#b4232c" stroke-width="3"/>
  <circle cx="180" cy="100" r="65" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="245,88 239,100 251,100" fill="#1d6fd1"/>
  <circle cx="180" cy="100" r="5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="188" y="118" font-size="11" fill="#1f2a44">hole</text>
  <text x="70" y="88" font-size="12" fill="#b4232c">θ = π above the cut</text>
  <text x="70" y="120" font-size="12" fill="#b4232c">θ = −π below the cut</text>
  <text x="252" y="80" font-size="12" fill="#1d6fd1">θ = 0</text>
  <text x="180" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">one lap adds 2π — the circulation</text>
</svg>
```

The field $[-y, x, 0]^\top/(x^2 + y^2)$ is the slope of this angle. One lap around the hole piles up the full $2\pi$, so no single-valued "height" can exist for it — which is why the circulation is not zero.
:::

::: context zero-at-infinity Why gravity's potential is negative
Any constant can be added to a potential, so we choose one. For gravity the tidy choice is zero far away, where the planet's pull has faded out. Coming closer, a body falls and gains speed, so its potential energy must drop — below zero. Being in orbit means being down in a "well" whose rim is at infinity. A negative total energy says the satellite does not have enough to climb out.
:::

::: context escape-speed Escape from the ground and from orbit
From Earth's surface, the escape speed is $\sqrt{2\mu/R_e} = 11.2\,\mathrm{km/s}$, ignoring air. From a $400\,\mathrm{km}$ orbit it is $10.8\,\mathrm{km/s}$, and the spacecraft already has $7.7\,\mathrm{km/s}$ of it, so it needs about $3.2\,\mathrm{km/s}$ more. Escape speed does not depend on direction: any direction that does not hit the planet works, because energy is a single number with no direction.
:::

::: context vis-viva-name "Living force"
*Vis viva* is Latin for "living force". The phrase was used by Gottfried Leibniz in the late 1600s for the quantity $mv^2$, an early form of what we now call kinetic energy (which is half of it). The orbit equation keeps the old name because it is, at heart, an energy statement: it trades speed against distance from the planet.
:::

::: context energy-bars The energy budget of a circular orbit
For the $400\,\mathrm{km}$ circular orbit, per kilogram:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="340" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="46" width="60" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="150" y="90" width="60" height="88" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="240" y="90" width="60" height="44" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">kinetic +29.40</text>
  <text x="180" y="194" font-size="12" text-anchor="middle" fill="#1f2a44">potential −58.81</text>
  <text x="270" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">total −29.40</text>
  <text x="30" y="84" font-size="11" fill="#6c7a93">0</text>
  <text x="340" y="84" font-size="11" text-anchor="end" fill="#6c7a93">MJ/kg</text>
</svg>
```

The kinetic bar is exactly half the potential bar, so the total is the kinetic energy with its sign flipped.
:::

::: context gto The road to geostationary orbit
A **geostationary transfer orbit** is the long ellipse a rocket usually leaves a communications satellite in. Its low point is near the rocket's parking orbit, and its high point is at $42{,}164\,\mathrm{km}$ from Earth's center — the radius where one orbit takes one sidereal day, about $23.93$ hours. The satellite then fires its own engine at the high point to round the orbit into a circle and stay over one spot on the equator.
:::

::: context runge-kutta Four looks per step
Carl Runge (1895) and Wilhelm Kutta (1901) worked out ways to take one step of a differential equation by sampling the slope several times inside the step and blending the samples. The classical RK4 samples four times: at the start, twice at the midpoint, and at the end. Its accumulated error shrinks at least like the step size to the fourth power: a step six times smaller cuts it by at least $6^4 \approx 1300$. In the example the energy error fell even faster, by nearly $8000$.
:::

::: context euler-spiral What Euler did to the orbit
Forward Euler moves along the current velocity for the whole step, a straight line tangent to a curving orbit. Each step lands slightly too far out and too fast, and the errors pile up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="51" fill="#e3e8f0" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="110" r="54.2" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <polyline points="234.2,110.0 234.2,106.3 234.0,102.6 233.5,99.0 232.7,95.3 231.7,91.8 230.5,88.2 229.1,84.8 227.4,81.5 225.5,78.2 223.4,75.1 221.1,72.2 218.7,69.4 216.0,66.7 213.2,64.2 210.2,61.9 207.1,59.8 203.9,57.8 200.6,56.1 197.2,54.6 193.7,53.2 190.2,52.1 186.5,51.2 182.9,50.5 179.2,50.0 175.6,49.7 171.9,49.7 168.2,49.8 164.6,50.1 161.0,50.6 157.4,51.3 154.0,52.2 150.5,53.2 147.2,54.4 143.9,55.8 140.7,57.3 137.7,59.0 134.7,60.8 131.8,62.7 129.0,64.8 126.4,67.0 123.9,69.2 121.5,71.6 119.2,74.1 117.0,76.6 115.0,79.2 113.1,81.9 111.3,84.7 109.7,87.5 108.2,90.3 106.8,93.2 105.5,96.1 104.4,99.1 103.4,102.1 102.5,105.0 101.7,108.1 101.1,111.1 100.6,114.1 100.2,117.1 99.9,120.1 99.7,123.1 99.6,126.1 99.7,129.1 99.9,132.0 100.1,134.9 100.5,137.8 100.9,140.7 101.5,143.5 102.2,146.3 102.9,149.1 103.8,151.8 104.7,154.4 105.7,157.1 106.8,159.6 108.0,162.1 109.2,164.6 110.6,167.0 112.0,169.4 113.4,171.7 115.0,173.9 116.6,176.1 118.2,178.2 120.0,180.3 121.8,182.2 123.6,184.2 125.5,186.0 127.4,187.8 129.4,189.5 131.5,191.2 133.6,192.8 135.7,194.3 137.9,195.7 140.1,197.1 142.3,198.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="142.3" cy="198.4" r="4" fill="#b4232c"/>
  <text x="180" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="250" y="130" font-size="11" fill="#1d6fd1">true orbit</text>
  <text x="152" y="214" font-size="11" fill="#b4232c">Euler after 93 steps: 12,010 km</text>
</svg>
```

Drawn to scale: the dashed circle is the real $400\,\mathrm{km}$ orbit, the red path is Euler's with $60\,\mathrm{s}$ steps. RK4 with the same step ends only about $2\,\mathrm{m}$ off the circle's radius.
:::

::: context closed-orbits Only two force laws close every orbit
In 1873 the French mathematician Joseph Bertrand proved that among central forces, only two make every bound orbit close into a repeating loop: the inverse-square force and the linear spring force, which pulls in proportion to distance. For any other law, the orbit's long axis slowly turns. That is why $J_2$, which adds a small non-inverse-square piece, makes the periapsis of a low orbit drift.
:::
