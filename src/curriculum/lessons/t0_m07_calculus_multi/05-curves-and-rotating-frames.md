---
id: l05-curves-and-rotating-frames
title: Trajectories as vector functions of time
minutes: 26
covers:
  - vector-valued functions of time, arc length, curvature
---

A trajectory is a vector-valued function of one variable: the position $\mathbf{r}(t)$ of a vehicle at every instant. Everything a guidance system talks about — velocity, acceleration, flight-path angle, turn rate, load factor, downrange distance — is a derivative or an integral of that one function. Lessons 1 to 4 differentiated functions of several variables; this lesson goes the other way and studies functions of a single variable whose values are vectors. The calculus is easier, because there is only one thing to differentiate with respect to, but the geometry is richer, because the derivative is a vector with a direction as well as a size.

Two questions organise the lesson. First: how far along its path has the vehicle travelled, and how is that different from how far it has gone? That is arc length. Second: how sharply is the path bending, and which part of the acceleration is responsible? That is curvature, and its answer — only the component of acceleration perpendicular to the velocity bends the path — is the reason a rocket pitches over in a gravity turn, the reason a circular orbit needs exactly $\mu/r^2$ of acceleration and no more, and the reason a lift-limited entry vehicle has a minimum turn radius.

The last section takes up the module's third objective: how to differentiate a vector whose components are written in a frame that is itself rotating, such as an Earth-fixed frame or a spacecraft body frame. The answer, the transport theorem, is one line long and is used on every page of the rotating-frames and rigid-body modules.

## Vector functions of one variable

A **vector-valued function** $\mathbf{r}:\mathbb{R} \to \mathbb{R}^3$ assigns a vector to every value of a scalar parameter, which for us is almost always time. In a fixed (inertial) frame with basis $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$ it has three scalar component functions,

$$
\mathbf{r}(t) = x(t)\,\hat{\mathbf{x}} + y(t)\,\hat{\mathbf{y}} + z(t)\,\hat{\mathbf{z}} = \begin{bmatrix} x(t) \\ y(t) \\ z(t) \end{bmatrix},
$$

and its derivative is defined exactly as for a scalar,

$$
\dot{\mathbf{r}}(t) = \frac{d\mathbf{r}}{dt} = \lim_{\delta t \to 0}\frac{\mathbf{r}(t + \delta t) - \mathbf{r}(t)}{\delta t} .
$$

Because the basis vectors do not change with time, the limit can be taken component by component: $\dot{\mathbf{r}} = [\dot x, \dot y, \dot z]^\top$. This is the Jacobian of Lesson 3 in the case $n = 1$: a $3 \times 1$ column. Geometrically, $\mathbf{r}(t + \delta t) - \mathbf{r}(t)$ is a chord of the path, and as $\delta t \to 0$ the chord swings into the tangent line. So $\dot{\mathbf{r}}$ is tangent to the path, pointing in the direction of motion, and its length is the rate at which distance along the path accumulates. It is the **velocity** $\mathbf{v}$, the second derivative $\ddot{\mathbf{r}} = \dot{\mathbf{v}}$ is the **acceleration** $\mathbf{a}$, and the length $v = \lVert\mathbf{v}\rVert$ is the **speed**.

### Product rules

Since differentiation is componentwise and each product below is a sum of products of components, the single-variable product rule carries over. For scalar $\alpha(t)$ and vectors $\mathbf{u}(t)$, $\mathbf{w}(t)$:

$$
\frac{d}{dt}(\alpha\mathbf{u}) = \dot\alpha\,\mathbf{u} + \alpha\,\dot{\mathbf{u}}, \qquad
\frac{d}{dt}(\mathbf{u}\cdot\mathbf{w}) = \dot{\mathbf{u}}\cdot\mathbf{w} + \mathbf{u}\cdot\dot{\mathbf{w}}, \qquad
\frac{d}{dt}(\mathbf{u}\times\mathbf{w}) = \dot{\mathbf{u}}\times\mathbf{w} + \mathbf{u}\times\dot{\mathbf{w}} .
$$

The cross product is not commutative, so the order of the factors in each term must be kept. Two consequences do a great deal of work.

**The derivative of a length.** Apply the dot-product rule to $\lVert\mathbf{u}\rVert^2 = \mathbf{u}\cdot\mathbf{u}$: $\frac{d}{dt}\lVert\mathbf{u}\rVert^2 = 2\,\mathbf{u}\cdot\dot{\mathbf{u}}$, and since $\frac{d}{dt}\lVert\mathbf{u}\rVert^2 = 2\lVert\mathbf{u}\rVert\frac{d}{dt}\lVert\mathbf{u}\rVert$,

$$
\frac{d}{dt}\lVert\mathbf{u}\rVert = \frac{\mathbf{u}\cdot\dot{\mathbf{u}}}{\lVert\mathbf{u}\rVert} = \hat{\mathbf{u}}\cdot\dot{\mathbf{u}} .
$$

With $\mathbf{u} = \mathbf{r} - \mathbf{r}_s$ this is the range-rate $\dot\rho = \hat{\mathbf{u}}\cdot\mathbf{v}$ of Lessons 3 and 4, now obtained without partial derivatives at all; with $\mathbf{u} = \mathbf{v}$ it is $\dot v = \hat{\mathbf{v}}\cdot\mathbf{a}$.

**The derivative of a unit vector is perpendicular to it.** If $\lVert\mathbf{e}\rVert = 1$ for all $t$ then $\mathbf{e}\cdot\mathbf{e} = 1$ is constant, and differentiating gives $2\,\mathbf{e}\cdot\dot{\mathbf{e}} = 0$. A vector of fixed length can only turn, and turning is a motion perpendicular to the vector itself. This fact drives both the curvature formula and the rotating-frame result below.

**Angular momentum.** For $\mathbf{h} = \mathbf{r}\times\mathbf{v}$ the cross-product rule gives $\dot{\mathbf{h}} = \mathbf{v}\times\mathbf{v} + \mathbf{r}\times\mathbf{a} = \mathbf{r}\times\mathbf{a}$. If the acceleration is always along $\mathbf{r}$ — a *central* force such as two-body gravity, $\mathbf{a} = -\mu\mathbf{r}/r^3$ — then $\mathbf{r}\times\mathbf{a} = \mathbf{0}$ and the specific angular momentum is constant. The orbit therefore stays in the fixed plane perpendicular to $\mathbf{h}$. This is a different conservation law from the energy conservation of Lesson 4, and it comes from a different property of the force: centrality rather than conservativeness.

## Arc length

Between $t$ and $t + \delta t$ the vehicle moves approximately $\lVert\mathbf{v}\rVert\,\delta t$ along its path. Summing and taking the limit, the **arc length** travelled from $t_0$ to $t$ is

$$
s(t) = \int_{t_0}^{t} \lVert\mathbf{v}(\tau)\rVert\,d\tau = \int_{t_0}^{t}\sqrt{\dot x^2 + \dot y^2 + \dot z^2}\,d\tau, \qquad \frac{ds}{dt} = \lVert\mathbf{v}\rVert = v .
$$

Arc length is a property of the path, not of the clock. If you traverse the same curve twice as fast, $s$ between the same two points is unchanged. This is what allows a curve to be **reparametrised by arc length**: describing position as $\mathbf{r}(s)$ instead of $\mathbf{r}(t)$. Differentiating with respect to $s$ by the chain rule of Lesson 4,

$$
\frac{d\mathbf{r}}{ds} = \frac{d\mathbf{r}}{dt}\frac{dt}{ds} = \frac{\mathbf{v}}{v} = \hat{\mathbf{T}},
$$

the **unit tangent vector**. Position changes at exactly one metre per metre of path, in the direction of travel. Arc length differs from the straight-line displacement $\lVert\mathbf{r}(t) - \mathbf{r}(t_0)\rVert$ whenever the path bends, and it differs from *downrange distance* — the ground track's length — whenever the path climbs.

::: example Arc length of a ballistic arc
A projectile leaves the origin at $v_0 = 300\,\mathrm{m/s}$ and $45^\circ$ above the horizontal, under $g_0 = 9.80665\,\mathrm{m/s^2}$ with no drag: $\mathbf{r}(t) = [v_0\cos 45^\circ\,t,\ v_0\sin 45^\circ\,t - \tfrac{1}{2}g_0 t^2]^\top$. It lands at $t_f = 2v_0\sin 45^\circ/g_0 = 43.263\,\mathrm{s}$ after a range of $v_0\cos 45^\circ\,t_f = 9177\,\mathrm{m}$, having reached an apex of $(v_0\sin 45^\circ)^2/2g_0 = 2294\,\mathrm{m}$.

The speed along the way is $\lVert\mathbf{v}\rVert = \sqrt{v_x^2 + (v_{y0} - g_0 t)^2}$ with $v_x = v_{y0} = 212.13\,\mathrm{m/s}$. Integrating from $0$ to $t_f$ — by Simpson's rule with $2000$ intervals, or in closed form using $\int\sqrt{v_x^2 + u^2}\,du$ — gives

$$
s = \int_0^{t_f}\lVert\mathbf{v}\rVert\,dt = 10{,}534\,\mathrm{m}.
$$

The path is $1357\,\mathrm{m}$ longer than the range because it goes up and comes down. A propagator that integrates $\dot s = v$ alongside the state gets this for free; the range comes from the $x$ component alone.
:::

## Curvature

The unit tangent $\hat{\mathbf{T}} = \mathbf{v}/v$ has fixed length, so its derivative is perpendicular to it. Its rate of change *per unit of path* measures how fast the direction of travel turns per metre travelled, independently of how fast the vehicle is going. That rate is the **curvature**

$$
\kappa = \left\lVert\frac{d\hat{\mathbf{T}}}{ds}\right\rVert, \qquad \frac{d\hat{\mathbf{T}}}{ds} = \kappa\,\hat{\mathbf{N}},
$$

where $\hat{\mathbf{N}}$, the **principal unit normal**, is the direction in which the path is turning. The units of $\kappa$ are $\mathrm{m^{-1}}$. A circle of radius $R$ turns through $2\pi$ radians over a path of $2\pi R$, so its curvature is $1/R$ everywhere; for any curve, $R = 1/\kappa$ is called the **radius of curvature**, the radius of the circle that best fits the path at that point. A straight line has $\kappa = 0$.

### Curvature from velocity and acceleration

To compute $\kappa$ from $\mathbf{r}(t)$, write $\mathbf{v} = v\,\hat{\mathbf{T}}$ and differentiate with the scalar–vector product rule and the chain rule $\frac{d\hat{\mathbf{T}}}{dt} = \frac{d\hat{\mathbf{T}}}{ds}\frac{ds}{dt} = \kappa v\,\hat{\mathbf{N}}$:

$$
\mathbf{a} = \dot v\,\hat{\mathbf{T}} + v\,\dot{\hat{\mathbf{T}}} = \dot v\,\hat{\mathbf{T}} + \kappa v^2\,\hat{\mathbf{N}} .
$$

This decomposition is the physical content of the lesson. The acceleration splits into a **tangential** part $\dot v$, which changes the speed, and a **normal** part $\kappa v^2 = v^2/R$, which changes the direction. Only the component of acceleration perpendicular to the velocity bends the path, and the sharper the bend or the faster the vehicle, the more of it is needed. Now take the cross product with $\mathbf{v} = v\hat{\mathbf{T}}$; the tangential term drops out because $\hat{\mathbf{T}}\times\hat{\mathbf{T}} = \mathbf{0}$, and $\lVert\hat{\mathbf{T}}\times\hat{\mathbf{N}}\rVert = 1$ because they are perpendicular unit vectors:

$$
\mathbf{v}\times\mathbf{a} = \kappa v^3\,(\hat{\mathbf{T}}\times\hat{\mathbf{N}}) \quad\Longrightarrow\quad \kappa = \frac{\lVert\mathbf{v}\times\mathbf{a}\rVert}{\lVert\mathbf{v}\rVert^3} .
$$

The same computation gives the tangential and normal accelerations directly from the state: $a_T = \dot v = \mathbf{v}\cdot\mathbf{a}/v$ and $a_N = \kappa v^2 = \lVert\mathbf{v}\times\mathbf{a}\rVert/v$. The direction $\hat{\mathbf{T}}\times\hat{\mathbf{N}}$ is the **binormal**, normal to the plane in which the path is instantaneously turning; for a planar orbit it is the direction of $\mathbf{h}$.

::: key
Curvature of a trajectory: $\kappa = \lVert\mathbf{v}\times\mathbf{a}\rVert/\lVert\mathbf{v}\rVert^3$, and the radius of curvature is $1/\kappa$. Only the component of $\mathbf{a}$ perpendicular to $\mathbf{v}$ bends the path: $\mathbf{a} = \dot v\,\hat{\mathbf{T}} + \kappa v^2\,\hat{\mathbf{N}}$, with $a_N = v^2/R$.
:::

For a **circular orbit** of radius $r$ the geometry says $\kappa = 1/r$, so the normal acceleration must be $v^2/r$. Gravity supplies $\mu/r^2$, all of it normal to the velocity, and there is no tangential component. Equating $v^2/r = \mu/r^2$ gives the circular speed $v = \sqrt{\mu/r}$: at $400\,\mathrm{km}$ altitude, $r = 6778.137\,\mathrm{km}$, $v = 7668.6\,\mathrm{m/s}$, $a_N = 8.676\,\mathrm{m/s^2}$, and $\kappa = 1.475 \times 10^{-7}\,\mathrm{m^{-1}}$. The period $2\pi r/v = 5554\,\mathrm{s}$ follows from the arc length of one revolution divided by the speed.

::: example Pitching over in a gravity turn
A launch vehicle is at $v = 500\,\mathrm{m/s}$ with flight-path angle $\gamma = 60^\circ$ above the local horizontal, thrust aligned with the velocity, and local gravity $g = 9.7\,\mathrm{m/s^2}$. Thrust is tangential, so the only acceleration perpendicular to the velocity is the component of gravity across the path, $g\cos\gamma = 4.85\,\mathrm{m/s^2}$ (the component $g\sin\gamma$ along the path is the gravity loss of the single-variable module). The curvature and radius of curvature are

$$
\kappa = \frac{a_N}{v^2} = \frac{4.85}{500^2} = 1.94 \times 10^{-5}\,\mathrm{m^{-1}}, \qquad R = \frac{1}{\kappa} = 51.5\,\mathrm{km}.
$$

The rate at which the velocity direction turns is $\kappa v = a_N/v$, so the flight-path angle falls at

$$
\dot\gamma = -\frac{g\cos\gamma}{v} = -\frac{4.85}{500} = -0.0097\,\mathrm{rad/s} = -0.556^\circ/\mathrm{s}.
$$

This is the gravity-turn equation: with no lift and no thrust-vector offset, gravity alone pitches the vehicle over, quickly while it is slow and steep, more slowly as it accelerates and flattens. Guidance chooses the initial kick angle so that this natural pitch-over ends at the right $\gamma$ at the right speed. (For a long powered flight the term $v\cos\gamma/r$ from the curvature of the Earth's surface is added; at $500\,\mathrm{m/s}$ it is about $0.002^\circ/\mathrm{s}$ and negligible.)
:::

::: example Radius of curvature at the apses of a transfer orbit
A geostationary transfer orbit has perigee radius $r_p = 6678.137\,\mathrm{km}$ and apogee radius $r_a = 42{,}164\,\mathrm{km}$, so $a = (r_p + r_a)/2 = 24{,}421\,\mathrm{km}$. The vis-viva equation (Lesson 10) gives $v_p = 10{,}151\,\mathrm{m/s}$ and $v_a = 1608\,\mathrm{m/s}$. At either apse the velocity is perpendicular to the radius, so gravity is entirely normal: $a_N = \mu/r^2$ and

$$
R_p = \frac{v_p^2}{\mu/r_p^2} = \frac{r_p^2 v_p^2}{\mu} = 11{,}530\,\mathrm{km}, \qquad R_a = \frac{r_a^2 v_a^2}{\mu} = 11{,}530\,\mathrm{km}.
$$

The two radii of curvature are equal, and both differ from the orbital radius: at perigee the path curves more gently than a circle through that point ($R_p > r_p$, the vehicle is climbing away), at apogee more sharply ($R_a < r_a$, it is falling back). They are equal because $r_p v_p = r_a v_a = h$ is the conserved angular momentum, so $R = h^2/\mu$ at both apses — which is the semi-latus rectum $p = 2r_pr_a/(r_p + r_a)$ of the ellipse.
:::

::: warning
$\lVert\mathbf{a}\rVert/v^2$ is not the curvature unless the acceleration is entirely perpendicular to the velocity. A vehicle accelerating in a straight line has $\kappa = 0$ however hard it pushes. Always project out the tangential component, or use the cross-product form, which does it for you.
:::

## Differentiating a vector in a rotating frame

Everything so far assumed the basis vectors were fixed. Very often they are not. Positions are stored in an Earth-fixed frame that turns once a day; sensor outputs are in a body frame that tumbles with the spacecraft. The components of a vector in such a frame can be constant while the vector itself is turning, and the derivative must account for the motion of the basis.

Let a frame $B$ have orthonormal basis $\hat{\mathbf{b}}_1, \hat{\mathbf{b}}_2, \hat{\mathbf{b}}_3$ rotating relative to an inertial frame $I$ with angular velocity $\boldsymbol{\omega}$ — a vector along the instantaneous axis of rotation whose length is the rotation rate in $\mathrm{rad/s}$. A point rigidly attached to a rotating body at position $\mathbf{p}$ from a point on the axis moves with velocity $\boldsymbol{\omega}\times\mathbf{p}$: its speed is $\omega$ times its distance from the axis, $\lVert\boldsymbol{\omega}\rVert\lVert\mathbf{p}\rVert\sin\theta$, and its direction is perpendicular to both the axis and $\mathbf{p}$. This is the definition of angular velocity. Each basis vector is such a rigidly attached unit vector, so

$$
\frac{d\hat{\mathbf{b}}_i}{dt}\bigg|_I = \boldsymbol{\omega}\times\hat{\mathbf{b}}_i .
$$

Notice that this is perpendicular to $\hat{\mathbf{b}}_i$, as the derivative of a unit vector must be. Now write any vector as $\mathbf{u} = \sum_i u_i\,\hat{\mathbf{b}}_i$ and differentiate with the product rule:

$$
\frac{d\mathbf{u}}{dt}\bigg|_I = \sum_i \dot u_i\,\hat{\mathbf{b}}_i + \sum_i u_i\,(\boldsymbol{\omega}\times\hat{\mathbf{b}}_i)
= \frac{d\mathbf{u}}{dt}\bigg|_B + \boldsymbol{\omega}\times\mathbf{u} .
$$

The first sum is what an observer riding in $B$ computes by differentiating the components he sees; the second is the correction for the frame's own rotation. This is the **transport theorem**:

$$
\left.\frac{d\mathbf{u}}{dt}\right|_I = \left.\frac{d\mathbf{u}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{u} .
$$

::: key
To differentiate a vector expressed in a frame rotating at $\boldsymbol{\omega}$: the inertial derivative equals the derivative of the components in the rotating frame plus $\boldsymbol{\omega}\times\mathbf{u}$. Applied twice to position, $\mathbf{a}_I = \mathbf{a}_B + 2\boldsymbol{\omega}\times\mathbf{v}_B + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\mathbf{r}) + \dot{\boldsymbol{\omega}}\times\mathbf{r}$.
:::

Apply it to a position vector $\mathbf{r}$: $\mathbf{v}_I = \mathbf{v}_B + \boldsymbol{\omega}\times\mathbf{r}$, where $\mathbf{v}_B$ is the velocity relative to the rotating frame. Apply it again to $\mathbf{v}_I$, using the product rule on the cross product,

$$
\mathbf{a}_I = \frac{d\mathbf{v}_I}{dt}\bigg|_B + \boldsymbol{\omega}\times\mathbf{v}_I
= \big(\mathbf{a}_B + \dot{\boldsymbol{\omega}}\times\mathbf{r} + \boldsymbol{\omega}\times\mathbf{v}_B\big) + \boldsymbol{\omega}\times\big(\mathbf{v}_B + \boldsymbol{\omega}\times\mathbf{r}\big),
$$

which collects to the acceleration formula in the key block: relative acceleration, the **Coriolis** term $2\boldsymbol{\omega}\times\mathbf{v}_B$, the **centripetal** term $\boldsymbol{\omega}\times(\boldsymbol{\omega}\times\mathbf{r})$, and the Euler term for a frame whose spin is changing. Newton's law holds in $I$, so an engineer working in $B$ must subtract these terms from the applied acceleration to get $\mathbf{a}_B$; that is the whole content of the rotating-frames module, and it is a consequence of the product rule applied to moving basis vectors.

::: example Earth-fixed and inertial velocities
Earth rotates at $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ about $\hat{\mathbf{z}}$. A tracking station on the equator, at rest in the Earth-fixed frame ($\mathbf{v}_B = \mathbf{0}$) at $r = 6378.137\,\mathrm{km}$, has inertial velocity $\boldsymbol{\omega}\times\mathbf{r}$ of magnitude $\omega_E r = 465.1\,\mathrm{m/s}$, pointing east; at $45^\circ$ latitude the distance from the axis is $r\cos 45^\circ$ and the speed is $328.9\,\mathrm{m/s}$. The station in Lesson 3's exercise was treated as fixed in the inertial frame; a real one moves at this speed, and its velocity enters $\Delta\mathbf{v}$ in the range-rate.

A satellite in a prograde circular equatorial orbit at $400\,\mathrm{km}$ has inertial speed $7668.6\,\mathrm{m/s}$. The frame's contribution at that radius is $\omega_E r = 494.3\,\mathrm{m/s}$, so its Earth-fixed speed is $7668.6 - 494.3 = 7174.3\,\mathrm{m/s}$. Propagating in the Earth-fixed frame with $\mathbf{v}_B = 7174.3\,\mathrm{m/s}$ requires the Coriolis term $2\omega_E v_B = 1.046\,\mathrm{m/s^2}$ and the centripetal term $\omega_E^2 r = 0.0360\,\mathrm{m/s^2}$ — both far from negligible against the $8.68\,\mathrm{m/s^2}$ of gravity. Leave them out and the propagated orbit is wrong within seconds.
:::

::: note
The two derivatives agree for any vector parallel to $\boldsymbol{\omega}$, since $\boldsymbol{\omega}\times\mathbf{u} = \mathbf{0}$ then. In particular $\dot{\boldsymbol{\omega}}$ is the same in both frames, which is why the Euler term above can be written without specifying which frame the dot refers to.
:::

## Check yourself

::: check
For $\mathbf{r}(t) = [2\cos t,\ 2\sin t,\ t]^\top$ (a helix), find the speed, the arc length of one turn, and the curvature.
:::

::: answer
$\mathbf{v} = [-2\sin t,\ 2\cos t,\ 1]^\top$, so $v = \sqrt{4 + 1} = \sqrt{5} = 2.236$, constant. One turn takes $2\pi$ in $t$, so its arc length is $2\pi\sqrt{5} = 14.05$. The acceleration is $\mathbf{a} = [-2\cos t,\ -2\sin t,\ 0]^\top$, perpendicular to $\mathbf{v}$ (check: $\mathbf{v}\cdot\mathbf{a} = 4\sin t\cos t - 4\sin t\cos t = 0$), with $\lVert\mathbf{a}\rVert = 2$. Then $\lVert\mathbf{v}\times\mathbf{a}\rVert = v\,a = 2\sqrt{5}$ and $\kappa = 2\sqrt{5}/5^{3/2} = 2/5 = 0.4$. The helix curves more gently than the circle of radius $2$ it winds around ($\kappa = 0.5$) because some of its motion is along the axis.
:::

::: check
Show that if a particle's speed is constant, its acceleration is perpendicular to its velocity, and conversely.
:::

::: answer
$\frac{d}{dt}(\mathbf{v}\cdot\mathbf{v}) = 2\,\mathbf{v}\cdot\mathbf{a}$. Constant speed means the left side is zero, so $\mathbf{v}\cdot\mathbf{a} = 0$. Conversely $\mathbf{v}\cdot\mathbf{a} = 0$ makes $v^2$ constant. In the decomposition $\mathbf{a} = \dot v\hat{\mathbf{T}} + \kappa v^2\hat{\mathbf{N}}$ this says $\dot v = 0$: all the acceleration is normal and goes into turning. A circular orbit and a coasting spacecraft under a purely lateral thruster are both examples.
:::

::: check
At the apex of the ballistic arc in the arc-length example, what are the curvature and the radius of curvature? Compare with the launch point.
:::

::: answer
At the apex $\mathbf{v} = [212.13, 0]^\top\,\mathrm{m/s}$ and $\mathbf{a} = [0, -9.80665]^\top\,\mathrm{m/s^2}$, perpendicular, so $\kappa = g_0/v_x^2 = 9.80665/212.13^2 = 2.18 \times 10^{-4}\,\mathrm{m^{-1}}$ and $R = 4589\,\mathrm{m}$. At launch $v = 300\,\mathrm{m/s}$ and the normal component of gravity is $g_0\cos 45^\circ$, so $\kappa = g_0\cos 45^\circ/300^2 = 7.70 \times 10^{-5}\,\mathrm{m^{-1}}$ and $R = 12{,}979\,\mathrm{m}$. The path bends almost three times more sharply at the apex, where the vehicle is slowest and gravity is entirely across the path.
:::

::: check
A spacecraft's body frame rotates at $\boldsymbol{\omega} = [0, 0, 0.1]^\top\,\mathrm{rad/s}$ relative to inertial space. A star-tracker boresight is fixed in the body at $\hat{\mathbf{b}}_1$. What is the inertial rate of change of the boresight direction, and at what rate does the star image drift across the detector?
:::

::: answer
The body components of the boresight are constant, so $d\mathbf{u}/dt|_B = \mathbf{0}$ and $d\mathbf{u}/dt|_I = \boldsymbol{\omega}\times\hat{\mathbf{b}}_1 = 0.1\,\hat{\mathbf{b}}_2\,\mathrm{rad/s}$: the boresight sweeps toward $\hat{\mathbf{b}}_2$ at $0.1\,\mathrm{rad/s} = 5.73^\circ/\mathrm{s}$. A star fixed in inertial space therefore drifts across the detector at that angular rate in the opposite direction; with a $10\,\mathrm{ms}$ exposure it smears by $1\,\mathrm{mrad}$, which is the reason star trackers have rate limits.
:::

::: check
Why does $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}$ vanish for two-body gravity but not for atmospheric drag?
:::

::: answer
Two-body gravity is $\mathbf{a} = -\mu\mathbf{r}/r^3$, parallel to $\mathbf{r}$, so $\mathbf{r}\times\mathbf{a} = \mathbf{0}$ and $\mathbf{h}$ is constant: the orbit plane and the magnitude $h = r v_\perp$ are fixed. Drag acts along $-\mathbf{v}$, which is not parallel to $\mathbf{r}$ except at the apses, so $\mathbf{r}\times\mathbf{a}_{\text{drag}} \neq \mathbf{0}$ and $h$ decays. Both accelerations also change energy differently — gravity conserves it, drag removes it — but that is a separate property (Lesson 10), governed by whether the force has a potential rather than by whether it is central.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{v} = \dot{\mathbf{r}}$, $\mathbf{a} = \dot{\mathbf{v}}$, $v = \lVert\mathbf{v}\rVert$ | velocity (tangent to the path), acceleration, speed; differentiate componentwise in a fixed frame |
| $\frac{d}{dt}(\mathbf{u}\cdot\mathbf{w}) = \dot{\mathbf{u}}\cdot\mathbf{w} + \mathbf{u}\cdot\dot{\mathbf{w}}$, $\frac{d}{dt}(\mathbf{u}\times\mathbf{w}) = \dot{\mathbf{u}}\times\mathbf{w} + \mathbf{u}\times\dot{\mathbf{w}}$ | product rules; keep the order in the cross product |
| $\frac{d}{dt}\lVert\mathbf{u}\rVert = \hat{\mathbf{u}}\cdot\dot{\mathbf{u}}$; $\lVert\mathbf{e}\rVert = 1 \Rightarrow \mathbf{e}\cdot\dot{\mathbf{e}} = 0$ | derivative of a length; a unit vector's derivative is perpendicular to it |
| $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a} = \mathbf{0}$ for central force | angular momentum conserved; orbit plane fixed |
| $s = \int\lVert\mathbf{v}\rVert\,dt$, $ds/dt = v$, $d\mathbf{r}/ds = \hat{\mathbf{T}}$ | arc length and unit tangent |
| $\kappa = \lVert d\hat{\mathbf{T}}/ds\rVert = \lVert\mathbf{v}\times\mathbf{a}\rVert/v^3$, $R = 1/\kappa$ | curvature and radius of curvature |
| $\mathbf{a} = \dot v\,\hat{\mathbf{T}} + \kappa v^2\,\hat{\mathbf{N}}$ | tangential and normal acceleration; only $a_N$ bends the path |
| $v^2/r = \mu/r^2 \Rightarrow v = \sqrt{\mu/r}$ | circular orbit: $7669\,\mathrm{m/s}$ at $400\,\mathrm{km}$ |
| $\dot\gamma = -g\cos\gamma/v$ | gravity-turn pitch rate |
| $d\mathbf{u}/dt\vert_I = d\mathbf{u}/dt\vert_B + \boldsymbol{\omega}\times\mathbf{u}$ | transport theorem |
| $\mathbf{a}_I = \mathbf{a}_B + 2\boldsymbol{\omega}\times\mathbf{v}_B + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\mathbf{r}) + \dot{\boldsymbol{\omega}}\times\mathbf{r}$ | acceleration seen from a rotating frame |

The next lesson integrates instead of differentiating: over areas and volumes rather than along curves. Multiple integrals give the mass, centre of mass and inertia tensor of a vehicle, and the Jacobian determinant of Lesson 3 reappears as the factor that converts $dx\,dy\,dz$ into $r^2\sin\theta\,dr\,d\theta\,d\varphi$.
