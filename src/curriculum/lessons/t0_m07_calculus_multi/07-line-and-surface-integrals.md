---
id: l07-line-and-surface-integrals
title: Line integrals and surface integrals
minutes: 25
covers:
  - line and surface integrals
---

Lesson 6 integrated over flat regions of the plane and solid regions of space. Many of the quantities a GNC engineer needs live instead on curved objects embedded in space: the work a force does along a trajectory, the energy drag removes over one orbit, the sunlight falling on a tilted solar array, the gravitational field passing through an imaginary sphere around a planet. Integrating along a curve is a **line integral**; integrating over a surface is a **surface integral**. Both reduce, through a parametrisation, to the ordinary and double integrals you already have, and both bring along one new factor — the arc-length element $ds$ or the area element $dS$ — that measures how much curve or surface a step in the parameter covers.

Two of the results here are the seeds of the rest of the module. The work done by gravity between two points turns out not to depend on the path taken, and Lesson 10 will explain why: gravity is a conservative field. The flux of the gravitational field through a sphere turns out not to depend on the sphere's radius, and Lesson 9 will explain that too: it is the divergence theorem. Here the aim is to define the integrals, compute them, and see the two facts appear as numbers.

## Line integrals of scalar fields

Let $C$ be a curve traced by $\mathbf{r}(t)$ for $a \le t \le b$, and let $f$ be a scalar field defined along it. Cut the curve into short pieces of arc length $\Delta s_k$, weight each by the value of $f$ there, and add:

$$
\int_C f\,ds = \lim\sum_k f(\mathbf{r}_k)\,\Delta s_k .
$$

Lesson 5 gave $ds = \lVert\dot{\mathbf{r}}\rVert\,dt$, so the line integral is the ordinary integral

$$
\int_C f\,ds = \int_a^b f(\mathbf{r}(t))\,\lVert\dot{\mathbf{r}}(t)\rVert\,dt .
$$

With $f = 1$ it is the arc length. With $f$ a linear density in $\mathrm{kg/m}$ it is the mass of a cable or tether. With $f$ an acceleration magnitude it has the units $\mathrm{m^2/s^2}$ of energy per unit mass. The value does not depend on how the curve is parametrised: if you trace the same curve at a different speed, $\lVert\dot{\mathbf{r}}\rVert\,dt$ changes to compensate and the sum of $f\,\Delta s$ is the same. Nor does it depend on the direction of travel, because $ds$ is a positive length either way.

## Line integrals of vector fields: work

For a vector field $\mathbf{F}$ along $C$ the natural quantity to add up is the component of $\mathbf{F}$ along the direction of travel, times the distance travelled. With the unit tangent $\hat{\mathbf{T}} = \dot{\mathbf{r}}/\lVert\dot{\mathbf{r}}\rVert$ from Lesson 5,

$$
\int_C \mathbf{F}\cdot d\mathbf{r} = \int_C \mathbf{F}\cdot\hat{\mathbf{T}}\,ds = \int_a^b \mathbf{F}(\mathbf{r}(t))\cdot\dot{\mathbf{r}}(t)\,dt .
$$

The middle form shows it is a scalar line integral of the tangential component; the right-hand form is how you compute it, and the factor $\lVert\dot{\mathbf{r}}\rVert$ has cancelled between $\hat{\mathbf{T}}$ and $ds$. Written in components with $d\mathbf{r} = [dx, dy, dz]^\top$, it is $\int_C F_1\,dx + F_2\,dy + F_3\,dz$.

If $\mathbf{F}$ is a force, this is the **work** done by the force along the path, in joules; if $\mathbf{F}$ is a force per unit mass — an acceleration field such as gravity — it is work per unit mass in $\mathrm{J/kg} = \mathrm{m^2/s^2}$. Unlike the scalar line integral, this one is **oriented**: traversing $C$ backwards reverses $\hat{\mathbf{T}}$ and changes the sign. Only the tangential component contributes; a force always perpendicular to the motion, like the normal force of a track or the magnetic force on a charge, does no work.

### The work–energy relation

Let a particle move under total acceleration $\mathbf{a}$, so $\dot{\mathbf{v}} = \mathbf{a}$ and $d\mathbf{r} = \mathbf{v}\,dt$. Then by the product rule of Lesson 5,

$$
\int_C \mathbf{a}\cdot d\mathbf{r} = \int_{t_1}^{t_2}\mathbf{a}\cdot\mathbf{v}\,dt = \int_{t_1}^{t_2}\frac{d}{dt}\left(\tfrac{1}{2}\mathbf{v}\cdot\mathbf{v}\right)dt = \tfrac{1}{2}v_2^2 - \tfrac{1}{2}v_1^2 .
$$

The work done by the total force per unit mass equals the change in kinetic energy per unit mass, whatever the path and whatever the forces. This is the fundamental theorem of calculus applied along a trajectory, and it is the bookkeeping behind every $\Delta v$ budget.

::: example Work done by a burn, and why $\Delta v$ is not energy
A spacecraft at $7700\,\mathrm{m/s}$ fires an engine giving $a_T = 3\,\mathrm{m/s^2}$ along the velocity for $60\,\mathrm{s}$; neglect gravity's tangential component. The speed rises to $7880\,\mathrm{m/s}$, a $\Delta v$ of $180\,\mathrm{m/s}$. The work done per unit mass is exactly $\tfrac{1}{2}(7880^2 - 7700^2) = 1.4022 \times 10^6\,\mathrm{J/kg}$.

Computing it as a line integral: the thrust is tangential, so $\int\mathbf{a}_T\cdot d\mathbf{r} = a_T\int ds = a_T\,s$, and the arc length covered is $s = \int v\,dt = 7700 \times 60 + \tfrac{1}{2}\times 3\times 60^2 = 467{,}400\,\mathrm{m}$, giving $3 \times 467{,}400 = 1.4022 \times 10^6\,\mathrm{J/kg}$, the same. The approximation $a_T \times v_1 \times 60 = 1.386 \times 10^6$ is low by $\tfrac{1}{2}\Delta v^2 = 16{,}200\,\mathrm{J/kg}$ because the vehicle covers more path as it speeds up.

The lesson for budgets: the same $180\,\mathrm{m/s}$ burn at $1000\,\mathrm{m/s}$ would add only $\tfrac{1}{2}(1180^2 - 1000^2) = 196{,}200\,\mathrm{J/kg}$, seven times less energy. Energy gained per unit $\Delta v$ is proportional to the speed at which the burn happens — the Oberth effect — and it is why departure burns are made at perigee.
:::

### Path dependence

Now integrate two-body gravity, $\mathbf{a} = -\mu\mathbf{r}/r^3$, between two fixed points along different paths. Along a purely radial path $\mathbf{r} = r\,\hat{\mathbf{r}}$ from $r_1$ to $r_2$, $d\mathbf{r} = \hat{\mathbf{r}}\,dr$ and

$$
\int_C \mathbf{a}\cdot d\mathbf{r} = \int_{r_1}^{r_2} -\frac{\mu}{r^2}\,dr = \mu\left(\frac{1}{r_2} - \frac{1}{r_1}\right).
$$

Along any arc at constant $r$, $d\mathbf{r}$ is tangential and $\mathbf{a}\cdot d\mathbf{r} = 0$. So a path that goes around an arc and then radially outward gives the same value as the direct radial path. That is suggestive but not a proof for arbitrary paths; the example checks one numerically.

::: example Gravity's work along three paths
Move from $r_1 = 6778.137\,\mathrm{km}$ to $r_2 = 7378.137\,\mathrm{km}$ ($400$ to $1000\,\mathrm{km}$ altitude). The radial formula gives

$$
\mu\left(\frac{1}{r_2} - \frac{1}{r_1}\right) = 3.986\times 10^{14}\left(\frac{1}{7.378137\times 10^6} - \frac{1}{6.778137\times 10^6}\right) = -4.7822\times 10^{6}\,\mathrm{J/kg},
$$

negative because gravity opposes the outward motion: that much kinetic energy per kilogram is lost climbing. A midpoint sum along the straight radial path with $10^5$ steps gives $-4.78224 \times 10^6$. Now take a completely different path — the straight line from $(r_1, 0, 0)$ to $(0, r_2, 0)$, which sweeps through $90^\circ$ of longitude while climbing — parametrised as $\mathbf{r}(t) = [r_1(1 - t),\ r_2 t,\ 0]^\top$, so $\dot{\mathbf{r}} = [-r_1, r_2, 0]^\top$, and integrate $\mathbf{a}(\mathbf{r}(t))\cdot\dot{\mathbf{r}}$ over $t \in [0, 1]$ with $2 \times 10^5$ steps: $-4.78224 \times 10^6\,\mathrm{J/kg}$ again, agreeing to seven digits. The work depends only on the endpoints. Lesson 10 shows this holds for every path, because $\mathbf{a} = -\nabla U$ with $U = -\mu/r$ and the work is $-(U_2 - U_1)$.

For comparison, the same climb against a uniform $g_0$ would cost $g_0 \times 600\,\mathrm{km} = 5.884 \times 10^6\,\mathrm{J/kg}$; the inverse-square field weakens with altitude and costs $19\%$ less.
:::

Not every field behaves this way. Drag acts along $-\mathbf{v}$, so $\mathbf{a}_D\cdot d\mathbf{r} = -a_D\,ds$ is negative on every piece of every path and the work depends on how long the path is.

::: example Energy removed by drag in one orbit
On a circular orbit at $400\,\mathrm{km}$, $v = 7668.6\,\mathrm{m/s}$. Take an atmospheric density of $\rho = 3 \times 10^{-12}\,\mathrm{kg/m^3}$ and a ballistic coefficient $C_D A/m = 0.01\,\mathrm{m^2/kg}$, both typical order-of-magnitude values for a small satellite at moderate solar activity. The drag acceleration is $a_D = \tfrac{1}{2}\rho v^2 C_D A/m = 8.82 \times 10^{-7}\,\mathrm{m/s^2}$, constant around a circular orbit. The work per unit mass over one revolution is a line integral of a constant tangential magnitude over a circumference:

$$
\oint \mathbf{a}_D\cdot d\mathbf{r} = -a_D\oint ds = -a_D\cdot 2\pi r = -8.82\times 10^{-7}\times 2\pi\times 6.778\times 10^6 = -37.6\,\mathrm{J/kg} .
$$

Small against the orbital energy $\varepsilon = -\mu/2r = -29.40\,\mathrm{MJ/kg}$, but it accumulates. Since $\varepsilon = -\mu/2a$, $d\varepsilon = (\mu/2a^2)\,da$, so the semi-major axis drops by $da = 2a^2\,d\varepsilon/\mu = -8.66\,\mathrm{m}$ per orbit, about $135\,\mathrm{m}$ per day at $15.6$ orbits per day. The closed-loop work is not zero — that is what non-conservative means — and Lesson 10 makes the contrast with gravity precise.
:::

### Circulation

The line integral of a vector field around a closed curve is its **circulation**, written $\oint_C \mathbf{F}\cdot d\mathbf{r}$. For $\mathbf{F} = [-y, x, 0]^\top$ — the velocity field of a rigid rotation at one radian per second about $\hat{\mathbf{z}}$ — around the circle $\mathbf{r}(t) = [2\cos t, 2\sin t, 0]^\top$, $\dot{\mathbf{r}} = [-2\sin t, 2\cos t, 0]^\top$ and $\mathbf{F}\cdot\dot{\mathbf{r}} = 4\sin^2 t + 4\cos^2 t = 4$, so the circulation is $\int_0^{2\pi} 4\,dt = 8\pi = 25.1$. The field runs with the curve the whole way round. For $\mathbf{F} = [x, y, 0]^\top$ on the same circle, $\mathbf{F}\cdot\dot{\mathbf{r}} = -4\cos t\sin t + 4\sin t\cos t = 0$: a radial field has no circulation. Lesson 9 relates circulation to the curl of Lesson 8, and Lesson 10 uses zero circulation as one of the three characterisations of a conservative field.

::: key
The line integral of a vector field along a curve $\mathbf{r}(t)$, $a \le t \le b$, is $\int_C \mathbf{F}\cdot d\mathbf{r} = \int_a^b \mathbf{F}(\mathbf{r}(t))\cdot\dot{\mathbf{r}}\,dt$; for a force it is the work. The total acceleration's work equals the change in $\tfrac{1}{2}v^2$. Around a closed curve it is the circulation $\oint_C\mathbf{F}\cdot d\mathbf{r}$.
:::

## Surface integrals

A surface $S$ in space is described by a **parametrisation** $\mathbf{r}(u, v)$ over a region $D^\ast$ of the $(u, v)$ plane. Holding $v$ fixed and varying $u$ traces a curve on the surface with tangent $\mathbf{r}_u = \partial\mathbf{r}/\partial u$; holding $u$ fixed gives tangent $\mathbf{r}_v$. A small rectangle $\Delta u\,\Delta v$ in the parameter plane maps to a small patch of surface which is, to first order, the parallelogram spanned by $\mathbf{r}_u\,\Delta u$ and $\mathbf{r}_v\,\Delta v$. The area of a parallelogram is the magnitude of the cross product of its sides, so

$$
dS = \lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv, \qquad \iint_S f\,dS = \iint_{D^\ast} f(\mathbf{r}(u, v))\,\lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv .
$$

This is Lesson 6's change of variables with one dimension missing: two tangent vectors in three-dimensional space span an area, and the cross product measures it where a $2 \times 2$ determinant would have in the plane. The vector $\mathbf{r}_u\times\mathbf{r}_v$ is also perpendicular to both tangents, hence normal to the surface, so it supplies the unit normal $\hat{\mathbf{n}} = (\mathbf{r}_u\times\mathbf{r}_v)/\lVert\mathbf{r}_u\times\mathbf{r}_v\rVert$ for free.

Two parametrisations cover most needs:

- **A sphere** of radius $R$: $\mathbf{r}(\theta, \varphi) = R[\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta]^\top$. The tangents $\mathbf{r}_\theta$ and $\mathbf{r}_\varphi$ have lengths $R$ and $R\sin\theta$ and are perpendicular, so $dS = R^2\sin\theta\,d\theta\,d\varphi$ — the spherical volume element of Lesson 6 with the $dr$ removed — and $\hat{\mathbf{n}} = \hat{\mathbf{r}}$. Integrating $dS$ over $\theta \in [0, \pi]$, $\varphi \in [0, 2\pi)$ gives $R^2 \cdot 2 \cdot 2\pi = 4\pi R^2$; for Earth, $5.11 \times 10^{14}\,\mathrm{m^2}$.
- **A graph** $z = g(x, y)$: $\mathbf{r}(x, y) = [x, y, g]^\top$, $\mathbf{r}_x = [1, 0, g_x]^\top$, $\mathbf{r}_y = [0, 1, g_y]^\top$, $\mathbf{r}_x\times\mathbf{r}_y = [-g_x, -g_y, 1]^\top$, and $dS = \sqrt{1 + g_x^2 + g_y^2}\,dx\,dy$. The factor is $1/\cos\alpha$ where $\alpha$ is the tilt of the surface from horizontal: a tilted patch has more area than its shadow.

::: example Area of a paraboloidal dish
The reflector $z = x^2 + y^2$ over the unit disc has $g_x = 2x$, $g_y = 2y$, so $dS = \sqrt{1 + 4(x^2 + y^2)}\,dA$. In polar coordinates,

$$
A = \int_0^{2\pi}\!\int_0^1\sqrt{1 + 4r^2}\,r\,dr\,d\theta = 2\pi\left[\frac{(1 + 4r^2)^{3/2}}{12}\right]_0^1 = \frac{\pi}{6}\left(5^{3/2} - 1\right) = 5.330 .
$$

The dish has $1.70$ times the area of its circular aperture $\pi = 3.142$. Note the two separate Jacobian-type factors: $\sqrt{1 + 4r^2}$ converts plane area to surface area, and $r$ converts $dr\,d\theta$ to plane area.
:::

### Flux

For a vector field the natural surface quantity is how much of it passes *through* the surface: the normal component $\mathbf{F}\cdot\hat{\mathbf{n}}$, integrated over the area. This is the **flux**

$$
\Phi = \iint_S \mathbf{F}\cdot\hat{\mathbf{n}}\,dS = \iint_{D^\ast}\mathbf{F}(\mathbf{r}(u, v))\cdot(\mathbf{r}_u\times\mathbf{r}_v)\,du\,dv,
$$

where the second form uses $\hat{\mathbf{n}}\,dS = \mathbf{r}_u\times\mathbf{r}_v\,du\,dv$ and needs no square root. If $\mathbf{F}$ is a fluid velocity, $\Phi$ is the volume crossing $S$ per second; if it is a mass flux $\rho\mathbf{v}$, the mass flow rate; if it is a power per unit area, the power collected. Flux is **oriented**: choosing $-\hat{\mathbf{n}}$ reverses its sign, so a surface integral of a vector field comes with a stated direction — outward, for a closed surface. Components of $\mathbf{F}$ tangent to the surface contribute nothing.

::: key
The surface element of a parametrised surface is $dS = \lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv$ and its normal is along $\mathbf{r}_u\times\mathbf{r}_v$; for a sphere $dS = R^2\sin\theta\,d\theta\,d\varphi$. The flux of $\mathbf{F}$ through $S$ is $\iint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$, the integral of the normal component, and the flux through a closed surface is written $\oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$ with $\hat{\mathbf{n}}$ outward.
:::

::: example The flux of gravity through a sphere
Take $\mathbf{F} = \mathbf{a} = -\mu\mathbf{r}/r^3$ and the sphere of radius $R$ centred on the attracting mass, outward normal $\hat{\mathbf{n}} = \hat{\mathbf{r}}$. On the sphere $\mathbf{a}\cdot\hat{\mathbf{n}} = -\mu/R^2$, a constant, so

$$
\oiint_S \mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -\frac{\mu}{R^2}\cdot 4\pi R^2 = -4\pi\mu = -5.009\times 10^{15}\,\mathrm{m^3/s^2},
$$

the same for every $R$. The field weakens as $1/R^2$ and the area grows as $R^2$, and they cancel exactly. Negative flux means the field points inward through the surface: gravity flows *in*. Lesson 9 shows this is no accident of the sphere — the flux through *any* closed surface enclosing the mass is $-4\pi\mu$, and through any surface not enclosing it is zero — and uses it to prove that a spherically symmetric planet attracts as if it were a point.
:::

::: example Power on a tilted solar array
The solar irradiance near Earth is $S = 1361\,\mathrm{W/m^2}$, a uniform field $\mathbf{S} = S\,\hat{\mathbf{s}}$ along the Sun direction. For a flat array of area $A = 10\,\mathrm{m^2}$ whose normal makes an angle of $30^\circ$ with $\hat{\mathbf{s}}$, the flux is $\iint\mathbf{S}\cdot\hat{\mathbf{n}}\,dS = S\cos 30^\circ\,A = 1361 \times 0.8660 \times 10 = 11.79\,\mathrm{kW}$ of incident power. Only the normal component counts; that is why arrays track the Sun.

For a uniform field the flux through any surface depends only on the surface's projected area perpendicular to the field. The sunlit hemisphere of Earth, area $2\pi R_e^2$, intercepts the same power as its shadow disc, $\pi R_e^2$: $S\pi R_e^2 = 1361 \times \pi \times (6.378\times 10^6)^2 = 1.74\times 10^{17}\,\mathrm{W}$. On the sphere the integrand $S\cos\theta$ falls off toward the terminator, and $\int_0^{\pi/2}\cos\theta\cdot 2\pi R_e^2\sin\theta\,d\theta = \pi R_e^2$ does the projection for you.
:::

::: warning
A line integral $\int\mathbf{F}\cdot d\mathbf{r}$ is computed with $\dot{\mathbf{r}}\,dt$, not $\lVert\dot{\mathbf{r}}\rVert\,dt$; a scalar line integral $\int f\,ds$ uses $\lVert\dot{\mathbf{r}}\rVert\,dt$. Mixing them up either loses the direction information or double-counts the speed. The same distinction separates $\iint f\,dS$, with $\lVert\mathbf{r}_u\times\mathbf{r}_v\rVert$, from a flux, with the unnormalised $\mathbf{r}_u\times\mathbf{r}_v$.
:::

::: warning
Orientation is part of the definition. Reversing the direction of a curve or flipping the normal of a surface changes the sign of a vector line or surface integral. For closed surfaces the convention is always the outward normal; for a closed curve bounding a surface, Lesson 9 fixes the convention by the right-hand rule.
:::

## Check yourself

::: check
Compute $\int_C \mathbf{F}\cdot d\mathbf{r}$ for $\mathbf{F} = [y, x, 0]^\top$ along (a) the straight line from $(0, 0, 0)$ to $(1, 1, 0)$ and (b) the parabola $y = x^2$ between the same points. What do you notice?
:::

::: answer
(a) $\mathbf{r}(t) = [t, t, 0]^\top$, $\dot{\mathbf{r}} = [1, 1, 0]^\top$, $\mathbf{F}\cdot\dot{\mathbf{r}} = t + t = 2t$, integral $\int_0^1 2t\,dt = 1$. (b) $\mathbf{r}(t) = [t, t^2, 0]^\top$, $\dot{\mathbf{r}} = [1, 2t, 0]^\top$, $\mathbf{F}\cdot\dot{\mathbf{r}} = t^2 + t\cdot 2t = 3t^2$, integral $\int_0^1 3t^2\,dt = 1$. The two agree. Indeed $\mathbf{F} = \nabla(xy)$, and Lesson 10 will show the integral is $xy$ at the end minus $xy$ at the start, $1 - 0$, for every path.
:::

::: check
A satellite's drag acceleration is $a_D$ and its speed is $v$. Express the rate of change of specific energy as a line-integral density, and show it equals $-a_D v$.
:::

::: answer
The work done by drag per unit mass along a piece of path is $\mathbf{a}_D\cdot d\mathbf{r} = -a_D\,ds$, since drag opposes the tangent. Dividing by $dt$ and using $ds/dt = v$, $\dot\varepsilon_{\text{drag}} = -a_D v$. With the orbit example's numbers, $-8.82\times 10^{-7}\times 7668.6 = -6.76\times 10^{-3}\,\mathrm{W/kg}$; over a period of $5554\,\mathrm{s}$ that is $-37.6\,\mathrm{J/kg}$, matching the line integral around the orbit.
:::

::: check
Find the flux of $\mathbf{F} = \mathbf{r} = [x, y, z]^\top$ outward through the sphere of radius $2$ centred at the origin, and compare it with three times the enclosed volume.
:::

::: answer
On the sphere $\hat{\mathbf{n}} = \mathbf{r}/2$, so $\mathbf{F}\cdot\hat{\mathbf{n}} = \lVert\mathbf{r}\rVert^2/2 = 4/2 = 2$, constant. The flux is $2 \times 4\pi \times 4 = 32\pi = 100.5$. The volume is $\tfrac{4}{3}\pi\cdot 8 = 32\pi/3$, so three times the volume is $32\pi$: they are equal. Lesson 8 will show that $\nabla\cdot\mathbf{r} = 3$, and Lesson 9 that the flux of any field through a closed surface equals the integral of its divergence over the interior — here $3 \times$ volume.
:::

::: check
Why is the flux of the two-body gravitational field through a sphere independent of the sphere's radius, and what would you expect for a sphere that does *not* contain the attracting mass?
:::

::: answer
The normal component is $-\mu/R^2$ and the area is $4\pi R^2$; the product is $-4\pi\mu$ for every $R$ because the inverse-square weakening of the field exactly compensates the growth of the area. For a sphere not containing the mass, the field lines that enter it on one side leave it on the other; the inward flux where $\mathbf{a}$ points in and the outward flux where it points out cancel and the total is zero. Both facts are the divergence theorem of Lesson 9 combined with $\nabla\cdot\mathbf{a} = 0$ away from the mass.
:::

::: check
Set up, but do not evaluate, the surface integral for the drag force on a spherical satellite of radius $R$ in a uniform flow, given that the pressure on a surface element facing the flow at angle $\theta$ from the stagnation point is $p(\theta) = q\cos^2\theta$ on the windward hemisphere and zero on the leeward one.
:::

::: answer
The pressure force on an element is $-p\,\hat{\mathbf{n}}\,dS$ (pressure pushes inward). Put the flow along $-\hat{\mathbf{z}}$ so the stagnation point is at $\theta = 0$ and $\hat{\mathbf{n}} = \hat{\mathbf{r}}$. The force along the flow direction is $F = \iint_S p\,(\hat{\mathbf{n}}\cdot\hat{\mathbf{z}})\,dS = \int_0^{2\pi}\!\int_0^{\pi/2} q\cos^2\theta\cdot\cos\theta\cdot R^2\sin\theta\,d\theta\,d\varphi$, since $\hat{\mathbf{r}}\cdot\hat{\mathbf{z}} = \cos\theta$ and $dS = R^2\sin\theta\,d\theta\,d\varphi$. The $\theta$ integral is $\int_0^{\pi/2}\cos^3\theta\sin\theta\,d\theta = 1/4$, so $F = 2\pi q R^2/4 = \tfrac{1}{2}q\pi R^2$: a drag coefficient of $0.5$ referred to the frontal area under this simple pressure model. The lateral components cancel by symmetry.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\int_C f\,ds = \int_a^b f(\mathbf{r}(t))\,\lVert\dot{\mathbf{r}}\rVert\,dt$ | scalar line integral; independent of parametrisation and direction |
| $\int_C\mathbf{F}\cdot d\mathbf{r} = \int_a^b\mathbf{F}\cdot\dot{\mathbf{r}}\,dt = \int_C\mathbf{F}\cdot\hat{\mathbf{T}}\,ds$ | vector line integral (work); reverses sign with direction |
| $\int\mathbf{a}\cdot d\mathbf{r} = \tfrac{1}{2}v_2^2 - \tfrac{1}{2}v_1^2$ | work–energy relation for the total acceleration |
| $\int_{r_1}^{r_2}(-\mu/r^2)\,dr = \mu(1/r_2 - 1/r_1)$ | gravity's work: $-4.78\,\mathrm{MJ/kg}$ from $400$ to $1000\,\mathrm{km}$, same on every path tried |
| $\oint\mathbf{a}_D\cdot d\mathbf{r} = -a_D\,2\pi r$ | drag's work per orbit: $-37.6\,\mathrm{J/kg}$, $-8.7\,\mathrm{m}$ of semi-major axis in the example |
| $\oint_C\mathbf{F}\cdot d\mathbf{r}$ | circulation; $8\pi$ for $[-y, x, 0]^\top$ around a circle of radius $2$ |
| $dS = \lVert\mathbf{r}_u\times\mathbf{r}_v\rVert\,du\,dv$, $\hat{\mathbf{n}} \parallel \mathbf{r}_u\times\mathbf{r}_v$ | surface element and normal of a parametrised surface |
| sphere $dS = R^2\sin\theta\,d\theta\,d\varphi$; graph $dS = \sqrt{1 + g_x^2 + g_y^2}\,dA$ | the two standard cases |
| $\Phi = \iint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS = \iint\mathbf{F}\cdot(\mathbf{r}_u\times\mathbf{r}_v)\,du\,dv$ | flux; oriented, outward for closed surfaces |
| $\oiint\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -4\pi\mu$ | flux of gravity through any sphere about the mass, independent of radius |

The next lesson defines the divergence, curl and Laplacian — the local, pointwise versions of flux and circulation — and Lesson 9 connects them to the integrals here through the divergence and Stokes theorems.
