---
id: l07-line-and-surface-integrals
title: Line integrals and surface integrals
minutes: 30
covers:
  - line and surface integrals
---

Push a shopping cart around a curved aisle. Add up "push along the way I am going, times how far I went" over the whole aisle, and you have the total effort you spent. That sum along a curve is a **line integral**. Now hold a butterfly net in a stream. How much water goes through it each second depends on how big the net is and how squarely it faces the current. Adding that up is a **surface integral**.

Lesson 6 integrated over flat regions and solid blocks. But much of what a GNC engineer needs lives on curved things: the work a force does along a trajectory, the energy drag steals over one orbit, the sunlight on a tilted solar array, the gravity "flowing" through an imaginary sphere around a planet.

Both kinds turn into integrals you already know. You describe the curve or surface with a **[[parametrization|parametrization-word]]** — a formula that walks you along it as one number (or two) changes. Each brings one new factor, $ds$ or $dS$, measuring how much curve or surface one small step covers.

Two results here plant seeds. The work gravity does between two points will not depend on the path (Lesson 10 explains why). The flow of gravity through a sphere will not depend on its size (Lesson 9 explains that). Here you watch both facts show up as numbers.

## Adding up along a curve

Picture a necklace lying in a loose curve, heavier in some places than others. To find its mass, cut it into short pieces, weigh each ("mass per meter there, times the piece's length"), and add. Let $C$ be a curve traced by the position $\mathbf{r}(t)$ as $t$ runs from $a$ to $b$. Let $f$ be a **scalar field** — one number attached to every point — defined along it. Cut the curve into short pieces of length $\Delta s_k$ ("delta s sub k"), weight each by the value of $f$ there, and add:

$$
\int_C f\,ds = \lim\sum_k f(\mathbf{r}_k)\,\Delta s_k .
$$

Read it as "the integral over C of f, d s". The $ds$ is a tiny piece of **arc length**, length measured along the curve.

Lesson 5 gave $ds$ in terms of $t$: in a short time $dt$ you move at speed $\lVert\dot{\mathbf{r}}\rVert$, so you cover $ds = \lVert\dot{\mathbf{r}}\rVert\,dt$. (The dot means "rate of change with $t$", and $\lVert\cdot\rVert$, read "the norm of", is a vector's length.) So the line integral becomes an ordinary integral:

$$
\int_C f\,ds = \int_a^b f(\mathbf{r}(t))\,\lVert\dot{\mathbf{r}}(t)\rVert\,dt .
$$

What you get depends on what $f$ is:

- With $f = 1$ the answer is the curve's arc length.
- With $f$ a **linear density** in $\mathrm{kg/m}$ (mass per meter), it is the mass of a cable or a space tether.
- With $f$ an acceleration size in $\mathrm{m/s^2}$, the units are $\mathrm{m^2/s^2}$, which is energy per unit mass.

Two things do *not* change the answer. How fast you trace the curve: go faster and $\lVert\dot{\mathbf{r}}\rVert$ grows but $dt$ shrinks, so the pieces $f\,\Delta s$ add to the same total. And which way you walk: a length $ds$ is positive either way.

## Work: pushing along a path

Back to the shopping cart. Push straight ahead and all your effort moves it. Push sideways and none does. Only the part of the push *along the motion* counts.

For a **vector field** $\mathbf{F}$ — an arrow attached to every point — we add up the component of $\mathbf{F}$ along the direction of travel, times the distance traveled. Lesson 5 gave the **unit tangent** $\hat{\mathbf{T}} = \dot{\mathbf{r}}/\lVert\dot{\mathbf{r}}\rVert$, a length-one arrow pointing along the curve. The **[[tangential component|tangential-part]]** of $\mathbf{F}$ is $\mathbf{F}\cdot\hat{\mathbf{T}}$. So

$$
\int_C \mathbf{F}\cdot d\mathbf{r} = \int_C \mathbf{F}\cdot\hat{\mathbf{T}}\,ds = \int_a^b \mathbf{F}(\mathbf{r}(t))\cdot\dot{\mathbf{r}}(t)\,dt .
$$

Read the left side as "the integral over C of F dot d r". The middle form shows the meaning. The right form is how you compute it: put $\hat{\mathbf{T}} = \dot{\mathbf{r}}/\lVert\dot{\mathbf{r}}\rVert$ and $ds = \lVert\dot{\mathbf{r}}\rVert\,dt$ into the middle form. The two copies of $\lVert\dot{\mathbf{r}}\rVert$ cancel, leaving $\mathbf{F}\cdot\dot{\mathbf{r}}\,dt$.

Written in components, with $d\mathbf{r} = [dx, dy, dz]^\top$, it is $\int_C F_1\,dx + F_2\,dy + F_3\,dz$.

If $\mathbf{F}$ is a force, this is the **work** the force does along the path, in **[[joules|joule]]**. If $\mathbf{F}$ is a force per unit mass — an acceleration field such as gravity — it is work per kilogram, in $\mathrm{J/kg} = \mathrm{m^2/s^2}$.

Unlike the scalar kind, this integral is **oriented**: walk $C$ backwards and $\hat{\mathbf{T}}$ flips, so the answer's sign flips. A force always perpendicular to the motion does no work at all: the push of a roller-coaster track on its car, or the magnetic force on a moving charge.

### The work–energy relation

Let a particle move with total acceleration $\mathbf{a}$ (every force added up, divided by mass). Then $\dot{\mathbf{v}} = \mathbf{a}$, and in a time $dt$ it moves $d\mathbf{r} = \mathbf{v}\,dt$. Put that into the work integral:

$$
\int_C \mathbf{a}\cdot d\mathbf{r} = \int_{t_1}^{t_2}\mathbf{a}\cdot\mathbf{v}\,dt .
$$

Now use the product rule of Lesson 5: $\frac{d}{dt}(\mathbf{v}\cdot\mathbf{v}) = 2\,\mathbf{v}\cdot\dot{\mathbf{v}} = 2\,\mathbf{a}\cdot\mathbf{v}$. So $\mathbf{a}\cdot\mathbf{v}$ is the rate of change of $\tfrac{1}{2}\mathbf{v}\cdot\mathbf{v}$, and the integral of a rate of change is the total change:

$$
\int_{t_1}^{t_2}\mathbf{a}\cdot\mathbf{v}\,dt = \int_{t_1}^{t_2}\frac{d}{dt}\left(\tfrac{1}{2}\mathbf{v}\cdot\mathbf{v}\right)dt = \tfrac{1}{2}v_2^2 - \tfrac{1}{2}v_1^2 .
$$

In words: **the work done by the total force per unit mass equals the change in kinetic energy per unit mass**, whatever the path and whatever the forces. This is the fundamental theorem of calculus used along a trajectory, and it is the bookkeeping behind every $\Delta v$ budget.

::: example Work done by a burn, and why $\Delta v$ is not energy
A spacecraft moving at $7700\,\mathrm{m/s}$ fires an engine that gives $a_T = 3\,\mathrm{m/s^2}$ along its velocity for $60\,\mathrm{s}$. Ignore gravity's pull along the path.

**The speed change.** $3 \times 60 = 180\,\mathrm{m/s}$, so the speed rises to $7880\,\mathrm{m/s}$. That is a $\Delta v$ of $180\,\mathrm{m/s}$.

**Work from the work–energy relation.**

$$
\tfrac{1}{2}\left(7880^2 - 7700^2\right) = \tfrac{1}{2}(62{,}094{,}400 - 59{,}290{,}000) = 1.4022 \times 10^6\,\mathrm{J/kg}.
$$

**Work as a line integral.** The thrust points along the path, so $\mathbf{a}_T\cdot d\mathbf{r} = a_T\,ds$, and the integral is $a_T$ times the path length $s$. The path length is the integral of speed, $v = 7700 + 3t$:

$$
s = \int_0^{60} (7700 + 3t)\,dt = 7700 \times 60 + \tfrac{1}{2}\times 3\times 60^2 = 462{,}000 + 5400 = 467{,}400\,\mathrm{m}.
$$

Then $3 \times 467{,}400 = 1.4022 \times 10^6\,\mathrm{J/kg}$ — the same, as it must be.

**A tempting shortcut, and why it is low.** Thrust times starting speed times time gives $3 \times 7700 \times 60 = 1.386 \times 10^6$. That is short by $16{,}200\,\mathrm{J/kg}$, which is exactly $\tfrac{1}{2}\Delta v^2 = \tfrac{1}{2}(180)^2$. The vehicle covers more path as it speeds up, so the thrust does more work late in the burn.

**The lesson for budgets.** The same $180\,\mathrm{m/s}$ burn at $1000\,\mathrm{m/s}$ adds only $\tfrac{1}{2}(1180^2 - 1000^2) = 196{,}200\,\mathrm{J/kg}$ — about seven times less. The energy gained is $\Delta v$ times the average speed during the burn, so burns add the most energy where the vehicle is fastest. That is the **[[Oberth effect|oberth]]**, and it is why departure burns are made at perigee, the lowest and fastest point of the orbit.
:::

### Does the path matter?

Now let two-body gravity do the work: $\mathbf{a} = -\mu\mathbf{r}/r^3$, where $\mu$ ("mu") is Earth's gravitational parameter, $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.

**A radial path.** Go straight away from Earth's center, from radius $r_1$ to $r_2$. Along it, $\mathbf{r} = r\,\hat{\mathbf{r}}$ ($\hat{\mathbf{r}}$ is the unit vector pointing away from the center), so a small step is $d\mathbf{r} = \hat{\mathbf{r}}\,dr$. The dot product is $\mathbf{a}\cdot\hat{\mathbf{r}}\,dr = -(\mu/r^2)\,dr$, and

$$
\int_C \mathbf{a}\cdot d\mathbf{r} = \int_{r_1}^{r_2} -\frac{\mu}{r^2}\,dr = \left[\frac{\mu}{r}\right]_{r_1}^{r_2} = \mu\left(\frac{1}{r_2} - \frac{1}{r_1}\right).
$$

**A sideways arc.** Along any arc at constant $r$, the step $d\mathbf{r}$ is sideways and gravity points straight down, so $\mathbf{a}\cdot d\mathbf{r} = 0$. Gravity does no work on a sideways move.

So sliding around an arc and then climbing gives the same work as climbing at once. That hints the path does not matter, but proves nothing for *every* path. The next example tests a very different one.

::: example Gravity's work along three paths
Climb from $r_1 = 6778.137\,\mathrm{km}$ to $r_2 = 7378.137\,\mathrm{km}$: from $400$ to $1000\,\mathrm{km}$ altitude, using Earth's equatorial radius $6378.137\,\mathrm{km}$.

**Path 1, the formula.**

$$
\mu\left(\frac{1}{r_2} - \frac{1}{r_1}\right) = 3.986\times 10^{14}\left(\frac{1}{7.378137\times 10^6} - \frac{1}{6.778137\times 10^6}\right) = -4.7822\times 10^{6}\,\mathrm{J/kg}.
$$

It is negative because gravity pulls against the climb: that much kinetic energy per kilogram is lost.

**Path 2, the same line added up by computer.** Cut the radial path into $10^5$ steps and add $-\mu/r^2 \times \Delta r$ at each step's midpoint. The sum is $-4.78224 \times 10^6\,\mathrm{J/kg}$.

**Path 3, a slanted straight line.** Go from $(r_1, 0, 0)$ to $(0, r_2, 0)$ in a straight line. This path swings through $90^\circ$ of longitude while it climbs. Partway along it even passes $4990\,\mathrm{km}$ from the center, below Earth's surface. That is fine here: we are testing the mathematical field $-\mu\mathbf{r}/r^3$, not flying the route. Parametrize it as $\mathbf{r}(t) = [r_1(1 - t),\ r_2 t,\ 0]^\top$ for $t$ from $0$ to $1$. Then $\dot{\mathbf{r}} = [-r_1, r_2, 0]^\top$, and the work is $\int_0^1 \mathbf{a}(\mathbf{r}(t))\cdot\dot{\mathbf{r}}\,dt$. Adding it up with $2 \times 10^5$ steps:

```python
import numpy as np

mu = 3.986e14                      # Earth's gravitational parameter, m^3/s^2
r1, r2 = 6778.137e3, 7378.137e3    # 400 km and 1000 km altitude, m

def accel(r):
    """Two-body gravity a = -mu r / |r|^3 at each row of r."""
    return -mu * r / np.linalg.norm(r, axis=-1, keepdims=True)**3

N = 200_000
t = (np.arange(N) + 0.5) / N                      # midpoints of N equal steps
r = np.stack([r1*(1 - t), r2*t, 0*t], axis=-1)    # points on the slanted line
rdot = np.array([-r1, r2, 0.0])                   # dr/dt, the same at every t
print(f"{np.sum(accel(r) @ rdot) / N:.6e}")       # -4.782241e+06
print(f"{mu*(1/r2 - 1/r1):.6e}")                  # -4.782241e+06
```

The same $-4.78224 \times 10^6\,\mathrm{J/kg}$, agreeing to seven digits. The work depends only on where you start and where you end. Lesson 10 proves this holds for every path: $\mathbf{a} = -\nabla U$ with the potential $U = -\mu/r$, and the work is $-(U_2 - U_1)$.

**Sanity check.** Against a constant $g_0 = 9.80665\,\mathrm{m/s^2}$ the climb would cost $g_0 \times 600\,\mathrm{km} = 5.884 \times 10^6\,\mathrm{J/kg}$. Real gravity weakens with height, so the true cost is lower — about $19\%$ less.
:::

Not every field behaves this way. **Drag**, the air's resistance, points along $-\mathbf{v}$. So on every piece of every path $\mathbf{a}_D\cdot d\mathbf{r} = -a_D\,ds$ is negative. Nothing cancels, and a longer path means more work lost.

::: example Energy removed by drag in one orbit
A small satellite circles at $400\,\mathrm{km}$ with speed $v = 7668.6\,\mathrm{m/s}$. Take the air density there as $\rho = 3 \times 10^{-12}\,\mathrm{kg/m^3}$ and the **[[ballistic coefficient|ballistic-coefficient]]** as $C_D A/m = 0.01\,\mathrm{m^2/kg}$. Both are typical order-of-magnitude values at moderate solar activity.

**The drag acceleration.**

$$
a_D = \tfrac{1}{2}\rho v^2\,\frac{C_D A}{m} = \tfrac{1}{2}\times 3\times 10^{-12}\times 7668.6^2\times 0.01 = 8.82 \times 10^{-7}\,\mathrm{m/s^2}.
$$

On a circular orbit speed and density stay the same, so $a_D$ is constant.

**The work around one orbit.** The circle on $\oint$ means the path closes on itself. A constant tangential size times the total length gives

$$
\oint \mathbf{a}_D\cdot d\mathbf{r} = -a_D\oint ds = -a_D\cdot 2\pi r = -8.82\times 10^{-7}\times 2\pi\times 6.778\times 10^6 = -37.6\,\mathrm{J/kg} .
$$

**Is that a lot?** The orbit's **specific energy** (energy per kilogram) is $\varepsilon = -\mu/2r = -29.40\,\mathrm{MJ/kg}$, so one orbit's loss is tiny. But it adds up. For any orbit $\varepsilon = -\mu/2a$, where $a$ is the **[[semi-major axis|semi-major-axis]]**. Differentiating, $d\varepsilon = (\mu/2a^2)\,da$, so

$$
da = \frac{2a^2\,d\varepsilon}{\mu} = \frac{2\times(6.778\times 10^6)^2\times(-37.6)}{3.986\times 10^{14}} = -8.66\,\mathrm{m}\ \text{per orbit}.
$$

At $15.6$ orbits a day that is about $135\,\mathrm{m}$ of lost height each day. The work around the closed loop is not zero — that is what **non-conservative** means — and Lesson 10 makes the contrast with gravity exact.
:::

### Circulation

The line integral of a vector field around a closed curve is its **circulation**, written $\oint_C \mathbf{F}\cdot d\mathbf{r}$. Think of a whirlpool: walk around it with the current, and the water pushes you along the whole way. Circulation measures how much the field goes around with you.

**A swirling field.** Take $\mathbf{F} = [-y, x, 0]^\top$. This is the velocity field of a **[[rigid rotation|rigid-rotation-field]]** at one radian per second about the $z$ axis, like a turntable. Go around the circle $\mathbf{r}(t) = [2\cos t, 2\sin t, 0]^\top$, so $\dot{\mathbf{r}} = [-2\sin t, 2\cos t, 0]^\top$. On the circle $x = 2\cos t$ and $y = 2\sin t$, so $\mathbf{F} = [-2\sin t, 2\cos t, 0]^\top$ and

$$
\mathbf{F}\cdot\dot{\mathbf{r}} = 4\sin^2 t + 4\cos^2 t = 4, \qquad \oint_C \mathbf{F}\cdot d\mathbf{r} = \int_0^{2\pi} 4\,dt = 8\pi \approx 25.1 .
$$

**A spreading field.** Take $\mathbf{F} = [x, y, 0]^\top$ on the same circle. Now $\mathbf{F} = [2\cos t, 2\sin t, 0]^\top$ and $\mathbf{F}\cdot\dot{\mathbf{r}} = -4\cos t\sin t + 4\sin t\cos t = 0$. The arrows point straight out, across the path, never along it: a radial field has no circulation.

Lesson 9 ties circulation to the curl of Lesson 8; Lesson 10 uses zero circulation as a test for a conservative field.

::: key
The line integral of a vector field along a curve $\mathbf{r}(t)$, $a \le t \le b$, is $\int_C \mathbf{F}\cdot d\mathbf{r} = \int_a^b \mathbf{F}(\mathbf{r}(t))\cdot\dot{\mathbf{r}}\,dt$; for a force it is the work. The total acceleration's work equals the change in $\tfrac{1}{2}v^2$. Around a closed curve it is the circulation $\oint_C\mathbf{F}\cdot d\mathbf{r}$.
:::

## Surface integrals

Draw a grid on a flat balloon, then blow it up. The squares stretch into curved patches. A **parametrization** of a surface $S$ is that grid: a formula $\mathbf{r}(u, v)$ that takes two numbers from a flat region $D^\ast$ ("D star") and gives a point on $S$ — like latitude and longitude on a globe.

Hold $v$ fixed and let $u$ change: you trace a curve on the surface, with tangent vector $\mathbf{r}_u = \partial\mathbf{r}/\partial u$ ("r sub u"). Hold $u$ fixed instead and you get the tangent $\mathbf{r}_v$. A tiny rectangle $\Delta u$ by $\Delta v$ on the flat grid lands on the surface as a tiny patch. Up close, that patch is almost a **[[parallelogram|patch-parallelogram]]** with sides $\mathbf{r}_u\,\Delta u$ and $\mathbf{r}_v\,\Delta v$.

The area of a parallelogram is the length of the cross product of its two sides. So the patch has area $\lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,\Delta u\,\Delta v$, and

$$
dS = \lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv, \qquad \iint_S f\,dS = \iint_{D^\ast} f(\mathbf{r}(u, v))\,\lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv .
$$

This is Lesson 6's change of variables with one dimension missing: there a $2 \times 2$ determinant measured the stretch; here the cross product does.

A bonus: $\mathbf{r}_u\times\mathbf{r}_v$ is perpendicular to both tangents, so it sticks straight out of the surface. Dividing by its length gives the **unit normal** — the length-one arrow perpendicular to the surface — for free: $\hat{\mathbf{n}} = (\mathbf{r}_u\times\mathbf{r}_v)/\lVert\mathbf{r}_u\times\mathbf{r}_v\rVert$.

Two parametrizations cover most needs.

**A sphere** of radius $R$: $\mathbf{r}(\theta, \varphi) = R[\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta]^\top$. Here $\theta$ ("theta") is the angle down from the north pole and $\varphi$ ("phi") is the longitude. The tangent $\mathbf{r}_\theta$ has length $R$ and the tangent $\mathbf{r}_\varphi$ has length $R\sin\theta$ (a circle of latitude shrinks toward the poles). They are perpendicular, so the parallelogram is a rectangle and

$$
dS = R^2\sin\theta\,d\theta\,d\varphi ,
$$

which is Lesson 6's spherical volume element with the $dr$ removed. The normal is $\hat{\mathbf{n}} = \hat{\mathbf{r}}$, straight out. Integrating $dS$ over $\theta$ from $0$ to $\pi$ and $\varphi$ from $0$ to $2\pi$: the $\theta$ integral of $\sin\theta$ is $2$, the $\varphi$ integral is $2\pi$, so the area is $R^2 \cdot 2 \cdot 2\pi = 4\pi R^2$. For Earth, with $R = 6378\,\mathrm{km}$, that is $5.11 \times 10^{14}\,\mathrm{m^2}$.

**A graph** $z = g(x, y)$, a height above the floor: $\mathbf{r}(x, y) = [x, y, g]^\top$. Then $\mathbf{r}_x = [1, 0, g_x]^\top$ and $\mathbf{r}_y = [0, 1, g_y]^\top$, where $g_x$ is the partial derivative $\partial g/\partial x$. Their cross product is

$$
\mathbf{r}_x\times\mathbf{r}_y = [-g_x,\ -g_y,\ 1]^\top, \qquad dS = \sqrt{1 + g_x^2 + g_y^2}\,dx\,dy .
$$

The square-root factor is $1/\cos\alpha$, where $\alpha$ ("alpha") is how far the surface tilts from horizontal. A tilted roof has more area than its shadow on the ground.

::: example Area of a paraboloidal dish
An antenna reflector has the shape $z = x^2 + y^2$ over the unit disc (all points with $x^2 + y^2 \le 1$). How much surface does it have?

**The area factor.** $g_x = 2x$ and $g_y = 2y$, so $dS = \sqrt{1 + 4x^2 + 4y^2}\,dA = \sqrt{1 + 4r^2}\,dA$, where $r$ is the distance from the axis and $dA$ is a piece of floor area.

**Switch to polar coordinates**, where $dA = r\,dr\,d\theta$:

$$
A = \int_0^{2\pi}\!\int_0^1\sqrt{1 + 4r^2}\,r\,dr\,d\theta .
$$

The inner integral: the derivative of $(1 + 4r^2)^{3/2}$ is $\tfrac{3}{2}(1 + 4r^2)^{1/2}\cdot 8r = 12r\sqrt{1 + 4r^2}$, so the inner integral is $\left[(1 + 4r^2)^{3/2}/12\right]_0^1$. The outer integral multiplies by $2\pi$:

$$
A = 2\pi\left[\frac{(1 + 4r^2)^{3/2}}{12}\right]_0^1 = \frac{\pi}{6}\left(5^{3/2} - 1\right) = 5.330 .
$$

**Sanity check.** The flat opening has area $\pi = 3.142$; the dish is $1.70$ times that — bigger, as a curved bowl must be. Note the two separate stretching factors: $\sqrt{1 + 4r^2}$ turns floor area into surface area, and $r$ turns $dr\,d\theta$ into floor area.
:::

### Flux

Back to the butterfly net. Face it into the current and a lot of water goes through. Tilt it and less does; edge-on, none. What counts is the part of the flow *across* the net.

For a vector field that part is the normal component $\mathbf{F}\cdot\hat{\mathbf{n}}$. Adding it up over the area gives the **[[flux|flux-word]]**:

$$
\Phi = \iint_S \mathbf{F}\cdot\hat{\mathbf{n}}\,dS = \iint_{D^\ast}\mathbf{F}(\mathbf{r}(u, v))\cdot(\mathbf{r}_u\times\mathbf{r}_v)\,du\,dv .
$$

$\Phi$ is the Greek capital "phi". The second form uses $\hat{\mathbf{n}}\,dS = \mathbf{r}_u\times\mathbf{r}_v\,du\,dv$: the length of the cross product and its direction come together, so no square root is needed.

What flux means depends on the field:

- $\mathbf{F}$ a fluid velocity: $\Phi$ is the volume crossing $S$ each second.
- $\mathbf{F}$ a mass flux $\rho\mathbf{v}$: the mass flow rate, in $\mathrm{kg/s}$.
- $\mathbf{F}$ a power per unit area: the power collected, in watts.

Flux is **oriented** too: choosing $-\hat{\mathbf{n}}$ flips its sign, so a flux always comes with a stated direction. For a **closed surface** — one with an inside and an outside, like a ball — the rule is the outward normal. Parts of $\mathbf{F}$ that lie along the surface contribute nothing.

::: key
The surface element of a parametrized surface is $dS = \lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv$ and its normal is along $\mathbf{r}_u\times\mathbf{r}_v$; for a sphere $dS = R^2\sin\theta\,d\theta\,d\varphi$. The flux of $\mathbf{F}$ through $S$ is $\iint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$, the integral of the normal component, and the flux through a closed surface is written $\oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$ with $\hat{\mathbf{n}}$ outward.
:::

::: example The flux of gravity through a sphere
Take the gravity field $\mathbf{a} = -\mu\mathbf{r}/r^3$ and a sphere of radius $R$ centered on the planet, with outward normal $\hat{\mathbf{n}} = \hat{\mathbf{r}}$.

**The normal component.** On the sphere, $\mathbf{a}$ points straight in with size $\mu/R^2$, so $\mathbf{a}\cdot\hat{\mathbf{n}} = -\mu/R^2$. It is the same at every point of the sphere.

**The flux.** A constant times the total area:

$$
\oiint_S \mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -\frac{\mu}{R^2}\cdot 4\pi R^2 = -4\pi\mu = -5.009\times 10^{15}\,\mathrm{m^3/s^2}.
$$

**The surprise.** $R$ has vanished: every sphere around the planet gets the same flux. The field weakens as $1/R^2$ while the area grows as $R^2$, and the two cancel exactly. The minus sign means the field points inward through the surface: gravity "flows in". Lesson 9 shows this is no accident of spheres. The flux through *any* closed surface around the mass is $-4\pi\mu$, and through any closed surface that leaves the mass outside it is zero. Lesson 9 uses that to prove a round planet pulls as if all its mass sat at its center.
:::

::: example Power on a tilted solar array
Sunlight near Earth delivers $S = 1361\,\mathrm{W/m^2}$, the **[[solar irradiance|solar-constant]]**. Treat it as a uniform field $\mathbf{S} = S\,\hat{\mathbf{s}}$ pointing along the Sun direction $\hat{\mathbf{s}}$.

**A flat panel.** An array of area $A = 10\,\mathrm{m^2}$ has its normal $30^\circ$ away from $\hat{\mathbf{s}}$. The normal component is $S\cos 30^\circ$ everywhere on it, so the flux is

$$
\iint\mathbf{S}\cdot\hat{\mathbf{n}}\,dS = S\cos 30^\circ\,A = 1361 \times 0.8660 \times 10 = 11.79\,\mathrm{kW}.
$$

That is the incident power. Only the normal part counts, which is why arrays turn to track the Sun.

**The whole Earth.** For a uniform field, flux depends only on the surface's shadow — its area projected perpendicular to the field. The sunlit half of Earth has area $2\pi R_e^2$ but a shadow disc of $\pi R_e^2$, so it catches

$$
S\pi R_e^2 = 1361 \times \pi \times (6.378\times 10^6)^2 = 1.74\times 10^{17}\,\mathrm{W}.
$$

The surface integral does the projecting for you. Put the Sun over the pole of the sphere parametrization. Then $\mathbf{S}\cdot\hat{\mathbf{n}} = S\cos\theta$, which fades to zero at the **[[terminator|terminator]]**, and a thin band at angle $\theta$ has area $2\pi R_e^2\sin\theta\,d\theta$. So

$$
\int_0^{\pi/2} S\cos\theta\cdot 2\pi R_e^2\sin\theta\,d\theta = S\pi R_e^2 ,
$$

because $\int_0^{\pi/2}\cos\theta\sin\theta\,d\theta = \tfrac{1}{2}$.
:::

::: warning Speed or no speed?
A vector line integral $\int\mathbf{F}\cdot d\mathbf{r}$ is computed with $\dot{\mathbf{r}}\,dt$, not $\lVert\dot{\mathbf{r}}\rVert\,dt$. A scalar line integral $\int f\,ds$ uses $\lVert\dot{\mathbf{r}}\rVert\,dt$. Mix them up and you either lose the direction or count the speed twice. The same split separates $\iint f\,dS$, which uses the length $\lVert\mathbf{r}_u\times\mathbf{r}_v\rVert$, from a flux, which uses the arrow $\mathbf{r}_u\times\mathbf{r}_v$ itself.
:::

::: warning Orientation is part of the question
Reversing the direction of a curve, or flipping the normal of a surface, changes the sign of a vector line or surface integral. For closed surfaces the rule is always the outward normal. For a closed curve that bounds a surface, Lesson 9 fixes the direction with the right-hand rule.
:::

## Check yourself

::: check
Compute $\int_C \mathbf{F}\cdot d\mathbf{r}$ for $\mathbf{F} = [y, x, 0]^\top$ along (a) the straight line from $(0, 0, 0)$ to $(1, 1, 0)$ and (b) the parabola $y = x^2$ between the same points. What do you notice?
:::

::: answer
(a) Parametrize the line as $\mathbf{r}(t) = [t, t, 0]^\top$ for $t$ from $0$ to $1$. Then $\dot{\mathbf{r}} = [1, 1, 0]^\top$ and $\mathbf{F} = [t, t, 0]^\top$, so $\mathbf{F}\cdot\dot{\mathbf{r}} = t + t = 2t$ and the integral is $\int_0^1 2t\,dt = 1$.

(b) Parametrize the parabola as $\mathbf{r}(t) = [t, t^2, 0]^\top$. Then $\dot{\mathbf{r}} = [1, 2t, 0]^\top$ and $\mathbf{F} = [t^2, t, 0]^\top$, so $\mathbf{F}\cdot\dot{\mathbf{r}} = t^2 + t\cdot 2t = 3t^2$ and the integral is $\int_0^1 3t^2\,dt = 1$.

They agree because $\mathbf{F} = \nabla(xy)$; Lesson 10 shows the integral is then $xy$ at the end minus $xy$ at the start, $1 - 0$, on every path.
:::

::: check
A satellite's drag acceleration has size $a_D$ and its speed is $v$. Write the rate of change of its specific energy using the line-integral idea, and show it equals $-a_D v$.
:::

::: answer
Drag points against the direction of travel, so the work it does per kilogram on a short piece of path is $\mathbf{a}_D\cdot d\mathbf{r} = -a_D\,ds$. Divide by the time $dt$ that piece took. Since $ds/dt = v$, the rate is $\dot\varepsilon_{\text{drag}} = -a_D v$.

With the orbit example's numbers: $-8.82\times 10^{-7}\times 7668.6 = -6.764\times 10^{-3}\,\mathrm{W/kg}$. One orbit takes $5554\,\mathrm{s}$, so the loss per orbit is $-6.764\times 10^{-3}\times 5554 = -37.6\,\mathrm{J/kg}$ — matching the line integral.
:::

::: check
Find the flux of $\mathbf{F} = \mathbf{r} = [x, y, z]^\top$ outward through the sphere of radius $2$ centered at the origin. Compare it with three times the volume inside.
:::

::: answer
On the sphere the outward unit normal is $\hat{\mathbf{n}} = \mathbf{r}/2$. So $\mathbf{F}\cdot\hat{\mathbf{n}} = \mathbf{r}\cdot\mathbf{r}/2 = \lVert\mathbf{r}\rVert^2/2 = 4/2 = 2$, the same everywhere on the sphere.

The flux is that constant times the area $4\pi\cdot 2^2 = 16\pi$: $2 \times 16\pi = 32\pi \approx 100.5$.

The volume is $\tfrac{4}{3}\pi\cdot 2^3 = 32\pi/3$, so three times the volume is $32\pi$. They are equal. Lesson 8 shows the divergence $\nabla\cdot\mathbf{r} = 3$, and Lesson 9 shows the flux out of any closed surface equals the integral of the divergence over the inside — here $3 \times$ volume.
:::

::: check
Why is the flux of two-body gravity through a sphere around the planet the same for every radius? What would you expect for a sphere that does *not* contain the planet?
:::

::: answer
The normal component is $-\mu/R^2$ and the area is $4\pi R^2$. Their product is $-4\pi\mu$ for every $R$: the $1/R^2$ weakening of the field exactly makes up for the $R^2$ growth of the area.

For a sphere with the planet outside, field lines that enter on one side leave on the other; inward and outward flux cancel, and the total is zero. Both facts come from the divergence theorem of Lesson 9, together with $\nabla\cdot\mathbf{a} = 0$ away from the mass (Lesson 8).
:::

::: check
Set up the surface integral for the drag force on a spherical satellite of radius $R$ in a uniform flow, then evaluate it. Assume the pressure on a surface element at angle $\theta$ from the **stagnation point** (the point facing straight into the flow) is $p(\theta) = q\cos^2\theta$ on the windward half and zero on the leeward half.
:::

::: answer
The pressure force on an element is $-p\,\hat{\mathbf{n}}\,dS$ (pressure pushes inward). Let the flow come down along $-\hat{\mathbf{z}}$, so the stagnation point is the north pole, $\theta = 0$, and $\hat{\mathbf{n}} = \hat{\mathbf{r}}$.

The force along the flow direction ($-\hat{\mathbf{z}}$) is the $-\hat{\mathbf{z}}$ component of $-p\,\hat{\mathbf{n}}\,dS$, which is $p\,(\hat{\mathbf{n}}\cdot\hat{\mathbf{z}})\,dS$. Use $\hat{\mathbf{r}}\cdot\hat{\mathbf{z}} = \cos\theta$ and $dS = R^2\sin\theta\,d\theta\,d\varphi$, over the windward half only:

$$
F = \int_0^{2\pi}\!\int_0^{\pi/2} q\cos^2\theta\cdot\cos\theta\cdot R^2\sin\theta\,d\theta\,d\varphi .
$$

The $\theta$ integral is $\int_0^{\pi/2}\cos^3\theta\sin\theta\,d\theta = \left[-\tfrac{1}{4}\cos^4\theta\right]_0^{\pi/2} = \tfrac{1}{4}$. The $\varphi$ integral gives $2\pi$. So $F = 2\pi q R^2/4 = \tfrac{1}{2}q\pi R^2$.

That is a drag coefficient of $0.5$ on the frontal area $\pi R^2$ under this simple model. Sideways parts cancel by symmetry.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\int_C f\,ds = \int_a^b f(\mathbf{r}(t))\,\lVert\dot{\mathbf{r}}\rVert\,dt$ | scalar line integral; the same for any parametrization and either direction |
| $\int_C\mathbf{F}\cdot d\mathbf{r} = \int_a^b\mathbf{F}\cdot\dot{\mathbf{r}}\,dt = \int_C\mathbf{F}\cdot\hat{\mathbf{T}}\,ds$ | vector line integral (work); flips sign with direction |
| $\int\mathbf{a}\cdot d\mathbf{r} = \tfrac{1}{2}v_2^2 - \tfrac{1}{2}v_1^2$ | work–energy relation for the total acceleration |
| $\int_{r_1}^{r_2}(-\mu/r^2)\,dr = \mu(1/r_2 - 1/r_1)$ | gravity's work: $-4.78\,\mathrm{MJ/kg}$ from $400$ to $1000\,\mathrm{km}$, the same on every path tried |
| $\oint\mathbf{a}_D\cdot d\mathbf{r} = -a_D\,2\pi r$ | drag's work per orbit: $-37.6\,\mathrm{J/kg}$, $-8.7\,\mathrm{m}$ of semi-major axis in the example |
| $\oint_C\mathbf{F}\cdot d\mathbf{r}$ | circulation; $8\pi$ for $[-y, x, 0]^\top$ around a circle of radius $2$ |
| $dS = \lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv$, $\hat{\mathbf{n}} \parallel \mathbf{r}_u\times\mathbf{r}_v$ | surface element and normal of a parametrized surface |
| sphere $dS = R^2\sin\theta\,d\theta\,d\varphi$; graph $dS = \sqrt{1 + g_x^2 + g_y^2}\,dA$ | the two standard cases |
| $\Phi = \iint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS = \iint\mathbf{F}\cdot(\mathbf{r}_u\times\mathbf{r}_v)\,du\,dv$ | flux; oriented, outward for closed surfaces |
| $\oiint\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -4\pi\mu$ | flux of gravity through any sphere around the mass, whatever its radius |

Next lesson shrinks flux and circulation down to a single point. Flux out of a tiny box, per unit volume, becomes the **divergence**; circulation around a tiny loop, per unit area, becomes the **curl**. Lesson 9 then ties them back to the integrals here through the divergence and Stokes theorems.

::: context parametrization-word A curve you can walk
A parametrization is a set of walking directions. Instead of describing a curve as "all points where some equation holds", you give a clock: at time $t$, be at the point $\mathbf{r}(t)$. As $t$ runs from start to finish, you trace the whole curve.

A satellite's trajectory comes with one built in — time itself. For a surface you need two numbers instead of one, the way latitude and longitude locate you on a globe. The same curve or surface has many parametrizations; the integrals in this lesson are built so the answer does not care which you pick (apart from direction, for the oriented ones).
:::

::: context tangential-part Only the part along the path counts
Split the force arrow into two pieces: one along the path and one across it. The piece along the path, $\mathbf{F}\cdot\hat{\mathbf{T}}$, speeds you up or slows you down. The piece across it only bends your path, and does no work.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M20,140 Q150,120 340,40" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <line x1="149.2" y1="109.9" x2="233" y2="45" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="239.2,39.9 232.7,51.2 226.6,43.3" fill="#1f2a44"/>
  <text x="246" y="38" font-size="13" font-weight="700" fill="#1f2a44">F</text>
  <line x1="149.2" y1="109.9" x2="240" y2="82.6" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="251.0,79.4 240.9,87.6 238.0,78.0" fill="#1d6fd1"/>
  <text x="180" y="135" font-size="12" fill="#1d6fd1">along the path: does work</text>
  <line x1="149.2" y1="109.9" x2="139.6" y2="78" stroke="#b4232c" stroke-width="3" stroke-dasharray="5 3"/>
  <polygon points="137.3,70.3 145.6,80.4 136.0,83.3" fill="#b4232c"/>
  <text x="30" y="62" font-size="12" fill="#b4232c">across: no work</text>
  <circle cx="149.2" cy="109.9" r="4" fill="#1f2a44"/>
  <text x="24" y="160" font-size="12" fill="#6c7a93">path C</text>
</svg>
```

Add up the blue piece times each small step of length $ds$, and you have $\int_C\mathbf{F}\cdot\hat{\mathbf{T}}\,ds$.
:::

::: context joule The joule
A **joule** is the work done by a force of one newton pushing through one meter. Lifting a small apple (about $100\,\mathrm{g}$) one meter takes about one joule. Since a newton is a $\mathrm{kg\,m/s^2}$, a joule is a $\mathrm{kg\,m^2/s^2}$. Divide by kilograms and you get $\mathrm{m^2/s^2}$ — which is why "work per kilogram" and "speed squared" share units, and why orbital energy is quoted in $\mathrm{J/kg}$ or $\mathrm{MJ/kg}$.
:::

::: context oberth The Oberth effect
The effect is named after Hermann Oberth, one of the early rocket pioneers. The idea: a kilogram of propellant buys the same $\Delta v$ wherever you burn it, but the kinetic energy it adds is $\Delta v$ times the average speed during the burn. So burning where you are already fast gives the most energy.

A spacecraft leaving Earth for Mars therefore burns near perigee, the low point of its orbit, where it moves fastest. Swinging close past a planet and burning at closest approach — a "powered flyby" — uses the same trick.
:::

::: context ballistic-coefficient How easily a satellite is slowed
$C_D A/m$ bundles the three things that decide how hard drag decelerates a body: its **drag coefficient** $C_D$ (how "draggy" its shape is — about $2$ to $2.2$ for satellites in very thin air), its frontal area $A$, and its mass $m$. A big light object, like an empty balloon, has a large value and slows quickly. A small dense one, like a ball bearing, barely notices the air. Engineers often call the upside-down version, $m/(C_D A)$, the ballistic coefficient; always check which one a source means.
:::

::: context semi-major-axis The semi-major axis
Every orbit around Earth is an ellipse, an oval, with Earth's center at one focus. The **semi-major axis** $a$ is half the ellipse's longest width. For a circle it is the radius. It sets the orbit's energy, $\varepsilon = -\mu/2a$, and its period. When drag steals energy, $\varepsilon$ becomes more negative, so $a$ shrinks — the satellite slowly spirals down. You will meet $a$ again in the orbital mechanics modules.
:::

::: context rigid-rotation-field A turntable's velocity
On a turntable spinning at $\omega$ radians per second, a point at distance $r$ from the center moves at speed $\omega r$, always at right angles to the line from the center. At the point $(x, y)$ that velocity is $\omega[-y, x]$. With $\omega = 1$ it is the field $[-y, x, 0]^\top$ of the circulation example.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="90" r="70" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="180" cy="90" r="35" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="180" cy="90" r="3" fill="#1f2a44"/>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="250" y1="90" x2="250" y2="55"/><line x1="180" y1="20" x2="145" y2="20"/>
    <line x1="110" y1="90" x2="110" y2="125"/><line x1="180" y1="160" x2="215" y2="160"/>
    <line x1="215" y1="90" x2="215" y2="72.5"/><line x1="180" y1="55" x2="162.5" y2="55"/>
    <line x1="145" y1="90" x2="145" y2="107.5"/><line x1="180" y1="125" x2="197.5" y2="125"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="250,55 245,65 255,65"/><polygon points="145,20 155,15 155,25"/>
    <polygon points="110,125 105,115 115,115"/><polygon points="215,160 205,155 205,165"/>
    <polygon points="215,72.5 211,80.5 219,80.5"/><polygon points="162.5,55 170.5,51 170.5,59"/>
    <polygon points="145,107.5 141,99.5 149,99.5"/><polygon points="197.5,125 189.5,121 189.5,129"/>
  </g>
  <text x="262" y="95" font-size="12" fill="#1f2a44">outer ring:</text>
  <text x="262" y="110" font-size="12" fill="#1f2a44">twice as fast</text>
</svg>
```

The arrows on the outer ring are twice as long as on the inner one, because that ring is twice as far out.
:::

::: context patch-parallelogram A tiny patch is almost flat
Zoom in far enough on any smooth surface and it looks flat, the way a field looks flat even though Earth is round. A tiny grid square $\Delta u$ by $\Delta v$ lands on the surface as a slanted four-sided patch with sides $\mathbf{r}_u\Delta u$ and $\mathbf{r}_v\Delta v$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="60" width="60" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">Δu</text>
  <text x="18" y="94" font-size="12" text-anchor="middle" fill="#1f2a44">Δv</text>
  <text x="60" y="45" font-size="12" text-anchor="middle" fill="#1f2a44">(u, v) grid</text>
  <line x1="110" y1="90" x2="150" y2="90" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="158,90 148,85 148,95" fill="#6c7a93"/>
  <polygon points="190,130 290,120 320,70 220,80" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="190" y1="130" x2="290" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="190" y1="130" x2="220" y2="80" stroke="#b4232c" stroke-width="3"/>
  <text x="240" y="145" font-size="12" fill="#1d6fd1">r_u Δu</text>
  <text x="200" y="100" font-size="12" text-anchor="end" fill="#b4232c">r_v Δv</text>
  <line x1="255" y1="100" x2="255" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="255,22 250,32 260,32" fill="#1f2a44"/>
  <text x="262" y="32" font-size="12" fill="#1f2a44">r_u × r_v</text>
</svg>
```

Its area is the length of $\mathbf{r}_u\Delta u \times \mathbf{r}_v\Delta v$, and the cross product also points straight out of the patch — the normal.
:::

::: context flux-word Where "flux" comes from
"Flux" comes from the Latin word for "flow". It was first used for real flows — water through a pipe, heat through a wall — and then borrowed for any vector field, even ones where nothing moves. Nothing physically streams out of a planet, yet "the flux of gravity" is a useful way to count how strongly the field pierces a surface. The word will come back in Lesson 9, where the flux through a closed surface is tied to what is inside it.
:::

::: context solar-constant How strong sunlight is in space
At Earth's average distance from the Sun, each square meter facing the Sun receives about $1361\,\mathrm{W}$. It is often called the "solar constant", though it wobbles by a few percent as Earth's distance from the Sun changes over the year, and by a tiny fraction with solar activity. Solar cells turn roughly $30\%$ of it into electricity, so the $11.79\,\mathrm{kW}$ falling on the example's panel would give a few kilowatts of electrical power.
:::

::: context terminator The line between day and night
The **terminator** is the line on a planet or moon that separates day from night. On the Moon you can see it as the edge of the lit part. Along it, sunlight skims the ground edge-on, so $\mathbf{S}\cdot\hat{\mathbf{n}} = 0$ and a flat patch there catches no power. For satellites the word also matters in orbit: crossing the terminator is when a spacecraft enters or leaves Earth's shadow and its solar arrays switch on or off.
:::
