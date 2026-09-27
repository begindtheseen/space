---
id: l05-curves-and-rotating-frames
title: Trajectories as vector functions of time
minutes: 24
covers:
  - vector-valued functions of time, arc length, curvature
---

Think about a car trip on a winding mountain road. Three gauges tell the story. The speedometer says how fast you are going. The odometer says how far you have driven along the road — which is more than the straight-line distance between start and finish. And the steering wheel says how sharply the road is bending right now. This lesson builds the mathematics behind all three.

A vehicle's path is a **trajectory**: its position $\mathbf{r}(t)$ at every instant $t$. Everything a guidance system talks about — velocity, acceleration, flight-path angle, turn rate, downrange distance — is a derivative or an integral of that one function. Lessons 1 to 4 handled functions of several variables. This one goes the other way: one input (time) and a vector output. The calculus is easier, because there is only one thing to differentiate by. The geometry is richer, because the derivative is an arrow with a direction as well as a size.

Two questions run through the lesson. How far along its path has the vehicle traveled? That is **arc length**, the odometer. How sharply is the path bending, and which part of the acceleration does the bending? That is **curvature**, the steering wheel. The answer to the second — only the part of the acceleration perpendicular to the velocity bends the path — is why a rocket pitches over in a gravity turn and why a circular orbit needs exactly $\mu/r^2$ of acceleration.

The last section meets the module's third objective: how to differentiate a vector whose components are written in a frame that is itself turning, like an Earth-fixed frame or a spacecraft's body frame. The answer, the transport theorem, is one line long and is used on every page of the rotating-frames and rigid-body modules.

## Vector functions of one variable

A **vector-valued function** $\mathbf{r}:\mathbb{R} \to \mathbb{R}^3$ gives a vector for every value of one number, which for us is almost always time. In a fixed (**inertial**) frame with basis vectors $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$ ("x hat" and so on — the hat marks a vector of length one) it has three ordinary component functions:

$$
\mathbf{r}(t) = x(t)\,\hat{\mathbf{x}} + y(t)\,\hat{\mathbf{y}} + z(t)\,\hat{\mathbf{z}} = \begin{bmatrix} x(t) \\ y(t) \\ z(t) \end{bmatrix}.
$$

Its derivative is defined exactly as for a single number:

$$
\dot{\mathbf{r}}(t) = \frac{d\mathbf{r}}{dt} = \lim_{\delta t \to 0}\frac{\mathbf{r}(t + \delta t) - \mathbf{r}(t)}{\delta t} .
$$

The **[[dot|newton-dot]]** over $\mathbf{r}$ means "rate of change with time"; read $\dot{\mathbf{r}}$ as "r dot". Because the basis vectors never change, you can take the limit one component at a time: $\dot{\mathbf{r}} = [\dot x, \dot y, \dot z]^\top$. This is Lesson 3's Jacobian in the case of one input: a $3 \times 1$ column.

Now the picture. $\mathbf{r}(t + \delta t) - \mathbf{r}(t)$ is a **[[chord|chord-to-tangent]]** — a straight arrow from one point of the path to a nearby one. As $\delta t$ shrinks, the chord swings round until it lies along the tangent line. So $\dot{\mathbf{r}}$ is tangent to the path, points the way the vehicle is going, and its length is how fast distance along the path piles up. It is the **velocity** $\mathbf{v}$. The second derivative $\ddot{\mathbf{r}} = \dot{\mathbf{v}}$ ("r double dot") is the **acceleration** $\mathbf{a}$, and the length $v = \lVert\mathbf{v}\rVert$ is the **speed**.

### Product rules

Differentiation works one component at a time, and each product below is a sum of products of components. So the one-variable product rule carries straight over. For a scalar $\alpha(t)$ and vectors $\mathbf{u}(t)$, $\mathbf{w}(t)$:

$$
\frac{d}{dt}(\alpha\mathbf{u}) = \dot\alpha\,\mathbf{u} + \alpha\,\dot{\mathbf{u}}, \qquad
\frac{d}{dt}(\mathbf{u}\cdot\mathbf{w}) = \dot{\mathbf{u}}\cdot\mathbf{w} + \mathbf{u}\cdot\dot{\mathbf{w}}, \qquad
\frac{d}{dt}(\mathbf{u}\times\mathbf{w}) = \dot{\mathbf{u}}\times\mathbf{w} + \mathbf{u}\times\dot{\mathbf{w}} .
$$

The cross product cares about order ($\mathbf{u}\times\mathbf{w} = -\mathbf{w}\times\mathbf{u}$), so keep the factors in their places in each term. Three consequences do a great deal of work.

**The rate of change of a length.** Apply the dot-product rule to $\lVert\mathbf{u}\rVert^2 = \mathbf{u}\cdot\mathbf{u}$. You get $\frac{d}{dt}\lVert\mathbf{u}\rVert^2 = 2\,\mathbf{u}\cdot\dot{\mathbf{u}}$. The ordinary chain rule also says $\frac{d}{dt}\lVert\mathbf{u}\rVert^2 = 2\lVert\mathbf{u}\rVert\frac{d}{dt}\lVert\mathbf{u}\rVert$. Set the two equal and divide by $2\lVert\mathbf{u}\rVert$:

$$
\frac{d}{dt}\lVert\mathbf{u}\rVert = \frac{\mathbf{u}\cdot\dot{\mathbf{u}}}{\lVert\mathbf{u}\rVert} = \hat{\mathbf{u}}\cdot\dot{\mathbf{u}} .
$$

With $\mathbf{u} = \mathbf{r} - \mathbf{r}_s$ this is the range-rate $\dot\rho = \hat{\mathbf{u}}\cdot\mathbf{v}$ of Lessons 3 and 4 — now with no partial derivatives at all. With $\mathbf{u} = \mathbf{v}$ it is $\dot v = \hat{\mathbf{v}}\cdot\mathbf{a}$.

**A unit vector can only turn.** Picture the hand of a clock. Its length never changes, so the tip can only move sideways — perpendicular to the hand. In symbols: if $\lVert\mathbf{e}\rVert = 1$ always, then $\mathbf{e}\cdot\mathbf{e} = 1$ is constant, and differentiating gives $2\,\mathbf{e}\cdot\dot{\mathbf{e}} = 0$. **[[The derivative of a unit vector is perpendicular to it|clock-hand]].** This one fact drives both the curvature formula and the rotating-frame result below.

**Angular momentum.** The **specific angular momentum** $\mathbf{h} = \mathbf{r}\times\mathbf{v}$ measures how much the vehicle is swinging around the origin, per kilogram. The cross-product rule gives $\dot{\mathbf{h}} = \mathbf{v}\times\mathbf{v} + \mathbf{r}\times\mathbf{a} = \mathbf{r}\times\mathbf{a}$, since any vector crossed with itself is zero. If the acceleration always points along $\mathbf{r}$ — a **central** force, like two-body gravity $\mathbf{a} = -\mu\mathbf{r}/r^3$ — then $\mathbf{r}\times\mathbf{a} = \mathbf{0}$ and $\mathbf{h}$ is **[[constant|equal-areas]]**. The orbit therefore stays in the fixed plane perpendicular to $\mathbf{h}$. This is a different law from the energy conservation of Lesson 4, and it comes from a different property of the force: being central, not being conservative.

## Arc length

Here is the odometer. Between $t$ and $t + \delta t$ the vehicle moves about $\lVert\mathbf{v}\rVert\,\delta t$ along its path. Add up those little pieces and take the limit. The **arc length** traveled from $t_0$ to $t$ is

$$
s(t) = \int_{t_0}^{t} \lVert\mathbf{v}(\tau)\rVert\,d\tau = \int_{t_0}^{t}\sqrt{\dot x^2 + \dot y^2 + \dot z^2}\,d\tau, \qquad \frac{ds}{dt} = \lVert\mathbf{v}\rVert = v .
$$

($\tau$, "tau", is a stand-in for time inside the integral, so it does not clash with the upper limit $t$.)

Arc length belongs to the path, not the clock. Drive the same road twice as fast and the odometer still reads the same between the same two towns. That lets you **reparametrize by arc length**: describe position as $\mathbf{r}(s)$, "where am I after $s$ meters of road", instead of $\mathbf{r}(t)$. Differentiating with respect to $s$ by the chain rule of Lesson 4,

$$
\frac{d\mathbf{r}}{ds} = \frac{d\mathbf{r}}{dt}\frac{dt}{ds} = \frac{\mathbf{v}}{v} = \hat{\mathbf{T}},
$$

the **unit tangent vector** ("T hat"). Position changes at exactly one meter per meter of path, in the direction of travel.

Arc length differs from the straight-line distance $\lVert\mathbf{r}(t) - \mathbf{r}(t_0)\rVert$ whenever the path bends. It differs from **[[downrange distance|downrange]]** — distance measured along the ground track — whenever the path climbs.

::: example Arc length of a ballistic arc
A projectile leaves the origin at $v_0 = 300\,\mathrm{m/s}$, aimed $45^\circ$ above the horizontal. Gravity is $g_0 = 9.80665\,\mathrm{m/s^2}$, and there is no air drag. Its path is

$$
\mathbf{r}(t) = \begin{bmatrix} v_0\cos 45^\circ\,t \\ v_0\sin 45^\circ\,t - \tfrac{1}{2}g_0 t^2 \end{bmatrix}.
$$

**Flight.** The starting velocity components are $v_x = v_{y0} = 300 \times 0.70711 = 212.13\,\mathrm{m/s}$. It lands when the height returns to zero, at $t_f = 2v_{y0}/g_0 = 43.263\,\mathrm{s}$. The range is $v_x t_f = 9177\,\mathrm{m}$, and the highest point (the apex) is $v_{y0}^2/2g_0 = 2294\,\mathrm{m}$.

**Speed along the way.** $\lVert\mathbf{v}\rVert = \sqrt{v_x^2 + (v_{y0} - g_0 t)^2}$. It starts at $300\,\mathrm{m/s}$, drops to $212\,\mathrm{m/s}$ at the apex, and climbs back to $300\,\mathrm{m/s}$ at landing.

**The odometer.** Integrate the speed from $0$ to $t_f$. You can do it numerically — **[[Simpson's rule|simpsons-rule]]** with $2000$ intervals — or exactly, using the standard integral of $\sqrt{v_x^2 + u^2}$. Either way,

$$
s = \int_0^{t_f}\lVert\mathbf{v}\rVert\,dt = 10{,}534\,\mathrm{m}.
$$

**Sanity check.** The path is about $1356\,\mathrm{m}$ longer than the range, because it goes up and comes back down. Longer, as it must be — a straight line is the shortest route. A trajectory program that integrates $\dot s = v$ alongside the state gets this number for free; the range comes from the $x$ component alone.
:::

## Curvature

Now the steering wheel. The unit tangent $\hat{\mathbf{T}} = \mathbf{v}/v$ has fixed length, so — like the clock hand — it can only turn, and its derivative is perpendicular to it. How fast it turns *per meter of path* measures how sharp the bend is, no matter how fast the vehicle is going. That rate is the **curvature**, written $\kappa$ ("kappa"):

$$
\kappa = \left\lVert\frac{d\hat{\mathbf{T}}}{ds}\right\rVert, \qquad \frac{d\hat{\mathbf{T}}}{ds} = \kappa\,\hat{\mathbf{N}}.
$$

Here $\hat{\mathbf{N}}$, the **principal unit normal**, points the way the path is turning. Curvature has units of $\mathrm{m^{-1}}$: radians of turn per meter.

A circle of radius $R$ is the easy case. Going once around, the direction turns through $2\pi$ radians over a path of $2\pi R$, so its curvature is $2\pi/2\pi R = 1/R$ everywhere. For any curve, $R = 1/\kappa$ is the **radius of curvature**: the radius of the **[[circle that best fits|osculating-circle]]** the path at that point. A straight line has $\kappa = 0$ — an infinitely large circle.

### Curvature from velocity and acceleration

To get $\kappa$ from $\mathbf{r}(t)$, write the velocity as speed times direction, $\mathbf{v} = v\,\hat{\mathbf{T}}$, and differentiate with the product rule. For the second piece, the chain rule gives $\frac{d\hat{\mathbf{T}}}{dt} = \frac{d\hat{\mathbf{T}}}{ds}\frac{ds}{dt} = \kappa v\,\hat{\mathbf{N}}$. So

$$
\mathbf{a} = \dot v\,\hat{\mathbf{T}} + v\,\dot{\hat{\mathbf{T}}} = \dot v\,\hat{\mathbf{T}} + \kappa v^2\,\hat{\mathbf{N}} .
$$

This split is the physics of the whole lesson. The acceleration has a **tangential** part $\dot v$, along the path, which changes the speed — your foot on the gas. It has a **normal** part $\kappa v^2 = v^2/R$, across the path, which changes the direction — your hands on the wheel. Only the part of the acceleration perpendicular to the velocity bends the path. The sharper the bend, or the faster you go, the more of it you need.

To pull out $\kappa$, cross both sides with $\mathbf{v} = v\hat{\mathbf{T}}$. The tangential term drops out, because $\hat{\mathbf{T}}\times\hat{\mathbf{T}} = \mathbf{0}$. What is left has length $\kappa v^3$, because $\hat{\mathbf{T}}$ and $\hat{\mathbf{N}}$ are perpendicular unit vectors, so $\lVert\hat{\mathbf{T}}\times\hat{\mathbf{N}}\rVert = 1$:

$$
\mathbf{v}\times\mathbf{a} = \kappa v^3\,(\hat{\mathbf{T}}\times\hat{\mathbf{N}}) \quad\Longrightarrow\quad \kappa = \frac{\lVert\mathbf{v}\times\mathbf{a}\rVert}{\lVert\mathbf{v}\rVert^3} .
$$

The same idea gives both parts of the acceleration straight from the state: $a_T = \dot v = \mathbf{v}\cdot\mathbf{a}/v$ and $a_N = \kappa v^2 = \lVert\mathbf{v}\times\mathbf{a}\rVert/v$. The direction $\hat{\mathbf{T}}\times\hat{\mathbf{N}}$ is the **binormal**, perpendicular to the plane the path is turning in. For an orbit, which stays in one plane, it points along $\mathbf{h}$.

::: key
Curvature of a trajectory: $\kappa = \lVert\mathbf{v}\times\mathbf{a}\rVert/\lVert\mathbf{v}\rVert^3$, and the radius of curvature is $1/\kappa$. Only the component of $\mathbf{a}$ perpendicular to $\mathbf{v}$ bends the path: $\mathbf{a} = \dot v\,\hat{\mathbf{T}} + \kappa v^2\,\hat{\mathbf{N}}$, with $a_N = v^2/R$.
:::

**A circular orbit.** For a circle of radius $r$, the geometry says $\kappa = 1/r$, so the normal acceleration must be $v^2/r$. Gravity supplies $\mu/r^2$, all of it pointing at Earth's center and so all of it across the velocity. There is no tangential part, so the speed stays constant. Setting $v^2/r = \mu/r^2$ gives the circular speed $v = \sqrt{\mu/r}$. At $400\,\mathrm{km}$ altitude: $r = 6778.137\,\mathrm{km}$, $v = 7668.6\,\mathrm{m/s}$, $a_N = 8.676\,\mathrm{m/s^2}$, and $\kappa = 1.475 \times 10^{-7}\,\mathrm{m^{-1}}$. One lap is an arc length of $2\pi r$, so the period is $2\pi r/v = 5554\,\mathrm{s}$, about $92.6$ minutes.

::: example Pitching over in a gravity turn
A launch vehicle is flying at $v = 500\,\mathrm{m/s}$ with **flight-path angle** $\gamma = 60^\circ$ ("gamma", the climb angle above the local horizontal). Its thrust points along its velocity, and local gravity is $g = 9.7\,\mathrm{m/s^2}$.

**Which accelerations bend the path?** Thrust points along the path, so it only changes speed. Gravity points straight down; split it into a part along the path, $g\sin\gamma$ (the gravity loss of the single-variable module), and a part across it, $g\cos\gamma$. Only the second bends the path:

$$
a_N = g\cos\gamma = 9.7 \times 0.5 = 4.85\,\mathrm{m/s^2}.
$$

**Curvature and radius.**

$$
\kappa = \frac{a_N}{v^2} = \frac{4.85}{500^2} = 1.94 \times 10^{-5}\,\mathrm{m^{-1}}, \qquad R = \frac{1}{\kappa} = 51.5\,\mathrm{km}.
$$

**Turn rate.** The velocity direction turns at $\kappa v = a_N/v$ radians per second, and it turns downward, so the flight-path angle falls:

$$
\dot\gamma = -\frac{g\cos\gamma}{v} = -\frac{4.85}{500} = -0.0097\,\mathrm{rad/s} = -0.556^\circ/\mathrm{s}.
$$

**What it means.** This is the **[[gravity-turn|gravity-turn]]** equation. With no lift and no sideways thrust, gravity alone pitches the vehicle over — fast while it is slow and steep, more gently as it speeds up and flattens out. Guidance picks the small initial "kick" so that this natural pitch-over ends at the right angle at the right speed. (On a long flight you add a term $v\cos\gamma/r$ for the curve of Earth's surface. At $500\,\mathrm{m/s}$ it is about $0.002^\circ/\mathrm{s}$, small enough to ignore here.)
:::

::: example Radius of curvature at the ends of a transfer orbit
A geostationary transfer orbit has perigee (closest point) radius $r_p = 6678.137\,\mathrm{km}$ and apogee (farthest point) radius $r_a = 42{,}164\,\mathrm{km}$. Its semi-major axis is $a = (r_p + r_a)/2 = 24{,}421\,\mathrm{km}$. The vis-viva equation (Lesson 10) gives the speeds $v_p = 10{,}151\,\mathrm{m/s}$ and $v_a = 1608\,\mathrm{m/s}$.

**Why these points are easy.** At perigee and apogee the velocity is exactly perpendicular to the radius. So gravity, which points along the radius, is entirely normal: $a_N = \mu/r^2$.

**Radii of curvature.** From $R = v^2/a_N$:

$$
R_p = \frac{v_p^2}{\mu/r_p^2} = \frac{r_p^2 v_p^2}{\mu} = 11{,}530\,\mathrm{km}, \qquad R_a = \frac{r_a^2 v_a^2}{\mu} = 11{,}530\,\mathrm{km}.
$$

**Reading it.** Both differ from the orbital radius. At perigee the path bends more gently than a circle through that point ($R_p > r_p$), so the vehicle starts climbing away. At apogee it bends more sharply ($R_a < r_a$), so it falls back.

**Why they are equal.** $r_p v_p = r_a v_a = h$, the conserved angular momentum. So $R = h^2/\mu$ at both ends — which is the **[[semi-latus rectum|semi-latus-rectum]]** $p = 2r_pr_a/(r_p + r_a)$ of the ellipse. Check: $2 \times 6678 \times 42{,}164/48{,}842 = 11{,}530\,\mathrm{km}$.
:::

::: warning Total acceleration is not turning acceleration
$\lVert\mathbf{a}\rVert/v^2$ is the curvature only when all of the acceleration is perpendicular to the velocity. A vehicle speeding up in a straight line has $\kappa = 0$ however hard it pushes. Always remove the tangential part first — or use the cross-product formula, which does it for you.
:::

## Differentiating a vector in a rotating frame

So far the basis vectors stood still. Very often they do not. Positions are stored in an Earth-fixed frame that turns once a day. Sensor readings come in a body frame that tumbles with the spacecraft.

Picture a merry-go-round. A friend sits still on it, so to *you riding along*, their position never changes. But to someone standing on the ground, your friend is whirling in a circle. The components in the rotating frame are constant, yet the vector itself is turning. The derivative must include the motion of the frame.

Let a frame $B$ (for "body") have perpendicular unit basis vectors $\hat{\mathbf{b}}_1, \hat{\mathbf{b}}_2, \hat{\mathbf{b}}_3$, rotating relative to an inertial frame $I$ with **angular velocity** $\boldsymbol{\omega}$ ("omega"). That is a vector along the spin axis whose length is the spin rate in $\mathrm{rad/s}$.

A point fixed to a spinning body, at position $\mathbf{p}$ from a point on the axis, moves with velocity $\boldsymbol{\omega}\times\mathbf{p}$. Its speed is the spin rate times its distance from the axis, $\lVert\boldsymbol{\omega}\rVert\lVert\mathbf{p}\rVert\sin\theta$, and its direction is perpendicular to both the axis and $\mathbf{p}$. That is what angular velocity means. Each basis vector is such a fixed-on arrow, so

$$
\frac{d\hat{\mathbf{b}}_i}{dt}\bigg|_I = \boldsymbol{\omega}\times\hat{\mathbf{b}}_i .
$$

(The bar with $I$ means "as seen from the inertial frame".) Notice that this is perpendicular to $\hat{\mathbf{b}}_i$, as the derivative of a unit vector must be. Now write any vector through its body components, $\mathbf{u} = \sum_i u_i\,\hat{\mathbf{b}}_i$, and use the product rule on each term:

$$
\frac{d\mathbf{u}}{dt}\bigg|_I = \sum_i \dot u_i\,\hat{\mathbf{b}}_i + \sum_i u_i\,(\boldsymbol{\omega}\times\hat{\mathbf{b}}_i)
= \frac{d\mathbf{u}}{dt}\bigg|_B + \boldsymbol{\omega}\times\mathbf{u} .
$$

The first sum is what a rider in $B$ computes by differentiating the components they see. The second is the correction for the frame's own spin. Together they give the **transport theorem**:

$$
\left.\frac{d\mathbf{u}}{dt}\right|_I = \left.\frac{d\mathbf{u}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{u} .
$$

::: key
To differentiate a vector expressed in a frame rotating at $\boldsymbol{\omega}$: the inertial derivative equals the derivative of the components in the rotating frame plus $\boldsymbol{\omega}\times\mathbf{u}$. Applied twice to position, $\mathbf{a}_I = \mathbf{a}_B + 2\boldsymbol{\omega}\times\mathbf{v}_B + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\mathbf{r}) + \dot{\boldsymbol{\omega}}\times\mathbf{r}$.
:::

**Once, for velocity.** Apply the theorem to a position $\mathbf{r}$: $\mathbf{v}_I = \mathbf{v}_B + \boldsymbol{\omega}\times\mathbf{r}$, where $\mathbf{v}_B$ is the velocity relative to the rotating frame.

**Twice, for acceleration.** Apply it again, this time to $\mathbf{v}_I$. The "$B$" derivative of $\mathbf{v}_B + \boldsymbol{\omega}\times\mathbf{r}$ needs the product rule on the cross product, which gives $\dot{\boldsymbol{\omega}}\times\mathbf{r} + \boldsymbol{\omega}\times\mathbf{v}_B$:

$$
\mathbf{a}_I = \frac{d\mathbf{v}_I}{dt}\bigg|_B + \boldsymbol{\omega}\times\mathbf{v}_I
= \big(\mathbf{a}_B + \dot{\boldsymbol{\omega}}\times\mathbf{r} + \boldsymbol{\omega}\times\mathbf{v}_B\big) + \boldsymbol{\omega}\times\big(\mathbf{v}_B + \boldsymbol{\omega}\times\mathbf{r}\big).
$$

Collect the terms. The two $\boldsymbol{\omega}\times\mathbf{v}_B$ pieces add to make $2\boldsymbol{\omega}\times\mathbf{v}_B$, and you get the formula in the key block. It has four parts: the relative acceleration $\mathbf{a}_B$; the **[[Coriolis|coriolis]]** term $2\boldsymbol{\omega}\times\mathbf{v}_B$; the **centripetal** term $\boldsymbol{\omega}\times(\boldsymbol{\omega}\times\mathbf{r})$, which points in toward the axis; and the **Euler** term $\dot{\boldsymbol{\omega}}\times\mathbf{r}$, for a frame whose spin is changing.

Newton's laws hold in the inertial frame $I$. So an engineer working in $B$ must subtract these extra terms from the applied acceleration to get $\mathbf{a}_B$. That is the whole content of the rotating-frames module, and it all comes from the product rule applied to moving basis vectors.

::: example Earth-fixed and inertial velocities
Earth spins at $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ about its axis $\hat{\mathbf{z}}$ — once per **[[sidereal day|sidereal-day]]**.

**A ground station.** A station on the equator at $r = 6378.137\,\mathrm{km}$ sits still in the Earth-fixed frame, so $\mathbf{v}_B = \mathbf{0}$. Its inertial velocity is $\boldsymbol{\omega}\times\mathbf{r}$, pointing east, of size $\omega_E r = 7.2921 \times 10^{-5} \times 6{,}378{,}137 = 465.1\,\mathrm{m/s}$. At $45^\circ$ latitude its distance from the axis is $r\cos 45^\circ$, so its speed is $328.9\,\mathrm{m/s}$. The station in Lesson 3's exercise was treated as fixed in the inertial frame; a real one moves this fast, and its velocity belongs in $\Delta\mathbf{v}$ in the range-rate.

**A satellite.** A satellite in a circular orbit over the equator at $400\,\mathrm{km}$, going the same way Earth spins, has inertial speed $7668.6\,\mathrm{m/s}$. At that radius the frame itself moves at $\omega_E r = 494.3\,\mathrm{m/s}$. So its Earth-fixed speed is

$$
v_B = 7668.6 - 494.3 = 7174.3\,\mathrm{m/s}.
$$

**The extra terms.** Working in the Earth-fixed frame, you need the Coriolis term $2\omega_E v_B = 2 \times 7.2921 \times 10^{-5} \times 7174.3 = 1.046\,\mathrm{m/s^2}$ and the centripetal term $\omega_E^2 r = 0.0360\,\mathrm{m/s^2}$. Compared with the $8.68\,\mathrm{m/s^2}$ of gravity, neither is small. Leave them out and the predicted orbit goes wrong within seconds.
:::

::: note When the two derivatives agree
For any vector parallel to $\boldsymbol{\omega}$, the correction $\boldsymbol{\omega}\times\mathbf{u}$ is zero, so both frames see the same rate of change. In particular $\dot{\boldsymbol{\omega}}$ is the same in both frames. That is why the Euler term can be written without saying which frame the dot refers to.
:::

## Check yourself

::: check
For the helix $\mathbf{r}(t) = [2\cos t,\ 2\sin t,\ t]^\top$ — a spring shape — find the speed, the arc length of one turn, and the curvature.
:::

::: answer
**Speed.** $\mathbf{v} = [-2\sin t,\ 2\cos t,\ 1]^\top$, so $v = \sqrt{4\sin^2 t + 4\cos^2 t + 1} = \sqrt{5} = 2.236$, constant.

**Arc length.** One turn takes $t$ from $0$ to $2\pi$, so $s = 2\pi\sqrt{5} = 14.05$.

**Curvature.** $\mathbf{a} = [-2\cos t,\ -2\sin t,\ 0]^\top$, of length $2$. It is perpendicular to $\mathbf{v}$: $\mathbf{v}\cdot\mathbf{a} = 4\sin t\cos t - 4\sin t\cos t + 0 = 0$. For perpendicular vectors the cross product's length is the product of the lengths, so $\lVert\mathbf{v}\times\mathbf{a}\rVert = 2\sqrt{5}$, and $\kappa = 2\sqrt{5}/5^{3/2} = 2/5 = 0.4$.

**Sense check.** The helix bends more gently than the circle of radius $2$ it winds around ($\kappa = 0.5$), because some of its motion goes along the axis instead of around.
:::

::: check
Show that if a particle's speed is constant, its acceleration is perpendicular to its velocity — and that the reverse is true too.
:::

::: answer
By the dot-product rule, $\frac{d}{dt}(\mathbf{v}\cdot\mathbf{v}) = 2\,\mathbf{v}\cdot\mathbf{a}$. Constant speed means $\mathbf{v}\cdot\mathbf{v} = v^2$ is constant, so the left side is zero, so $\mathbf{v}\cdot\mathbf{a} = 0$. Reversing the steps: $\mathbf{v}\cdot\mathbf{a} = 0$ makes $v^2$ constant.

In $\mathbf{a} = \dot v\hat{\mathbf{T}} + \kappa v^2\hat{\mathbf{N}}$ this says $\dot v = 0$: all the acceleration is normal and goes into turning. A circular orbit is an example, and so is a coasting spacecraft pushed only by a thruster pointing sideways to its motion.
:::

::: check
At the apex of the ballistic arc in the arc-length example, what are the curvature and the radius of curvature? Compare with the launch point.
:::

::: answer
**Apex.** The velocity is horizontal, $\mathbf{v} = [212.13, 0]^\top\,\mathrm{m/s}$, and gravity $\mathbf{a} = [0, -9.80665]^\top\,\mathrm{m/s^2}$ is straight down — perpendicular. So $\kappa = g_0/v_x^2 = 9.80665/212.13^2 = 2.18 \times 10^{-4}\,\mathrm{m^{-1}}$ and $R = 1/\kappa = 4589\,\mathrm{m}$.

**Launch.** $v = 300\,\mathrm{m/s}$, and the part of gravity across the path is $g_0\cos 45^\circ$. So $\kappa = g_0\cos 45^\circ/300^2 = 7.70 \times 10^{-5}\,\mathrm{m^{-1}}$ and $R = 12{,}979\,\mathrm{m}$.

**Comparison.** The path bends almost three times as sharply at the apex, where the projectile is slowest and all of gravity pulls across the path.
:::

::: check
A spacecraft's body frame spins at $\boldsymbol{\omega} = [0, 0, 0.1]^\top\,\mathrm{rad/s}$ relative to inertial space. A star tracker's viewing direction (its boresight) is fixed in the body along $\hat{\mathbf{b}}_1$. What is the inertial rate of change of the boresight direction, and how fast does a star's image drift across the detector?
:::

::: answer
The boresight's body components never change, so $d\mathbf{u}/dt|_B = \mathbf{0}$. The transport theorem leaves only the spin term: $d\mathbf{u}/dt|_I = \boldsymbol{\omega}\times\hat{\mathbf{b}}_1 = 0.1\,(\hat{\mathbf{b}}_3\times\hat{\mathbf{b}}_1) = 0.1\,\hat{\mathbf{b}}_2\,\mathrm{rad/s}$. The boresight sweeps toward $\hat{\mathbf{b}}_2$ at $0.1\,\mathrm{rad/s} = 5.73^\circ/\mathrm{s}$.

A star stays put in inertial space, so its image drifts across the detector at that same angular rate, the opposite way. In a $10\,\mathrm{ms}$ exposure it smears by $0.1 \times 0.01 = 1\,\mathrm{mrad}$. That is why star trackers have a maximum spin rate they can work at.
:::

::: check
Why does $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}$ vanish for two-body gravity but not for air drag?
:::

::: answer
Two-body gravity is $\mathbf{a} = -\mu\mathbf{r}/r^3$, parallel to $\mathbf{r}$, so $\mathbf{r}\times\mathbf{a} = \mathbf{0}$. Then $\mathbf{h}$ is constant: the orbit plane and the size $h = r v_\perp$ are fixed ($v_\perp$ is the part of the velocity perpendicular to $\mathbf{r}$).

Drag pushes along $-\mathbf{v}$, which is not parallel to $\mathbf{r}$ except at perigee and apogee. So $\mathbf{r}\times\mathbf{a}_{\text{drag}} \neq \mathbf{0}$, and $h$ shrinks. The two forces also treat energy differently — gravity keeps it, drag removes it — but that is a separate property (Lesson 10): whether the force has a potential, not whether it is central.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{v} = \dot{\mathbf{r}}$, $\mathbf{a} = \dot{\mathbf{v}}$, $v = \lVert\mathbf{v}\rVert$ | velocity (tangent to the path), acceleration, speed; differentiate componentwise in a fixed frame |
| $\frac{d}{dt}(\mathbf{u}\cdot\mathbf{w}) = \dot{\mathbf{u}}\cdot\mathbf{w} + \mathbf{u}\cdot\dot{\mathbf{w}}$, $\frac{d}{dt}(\mathbf{u}\times\mathbf{w}) = \dot{\mathbf{u}}\times\mathbf{w} + \mathbf{u}\times\dot{\mathbf{w}}$ | product rules; keep the order in the cross product |
| $\frac{d}{dt}\lVert\mathbf{u}\rVert = \hat{\mathbf{u}}\cdot\dot{\mathbf{u}}$; $\lVert\mathbf{e}\rVert = 1 \Rightarrow \mathbf{e}\cdot\dot{\mathbf{e}} = 0$ | rate of change of a length; a unit vector's derivative is perpendicular to it |
| $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a} = \mathbf{0}$ for a central force | angular momentum conserved; orbit plane fixed |
| $s = \int\lVert\mathbf{v}\rVert\,dt$, $ds/dt = v$, $d\mathbf{r}/ds = \hat{\mathbf{T}}$ | arc length and unit tangent |
| $\kappa = \lVert d\hat{\mathbf{T}}/ds\rVert = \lVert\mathbf{v}\times\mathbf{a}\rVert/v^3$, $R = 1/\kappa$ | curvature and radius of curvature |
| $\mathbf{a} = \dot v\,\hat{\mathbf{T}} + \kappa v^2\,\hat{\mathbf{N}}$ | tangential and normal acceleration; only $a_N$ bends the path |
| $v^2/r = \mu/r^2 \Rightarrow v = \sqrt{\mu/r}$ | circular orbit: $7669\,\mathrm{m/s}$ at $400\,\mathrm{km}$ |
| $\dot\gamma = -g\cos\gamma/v$ | gravity-turn pitch rate |
| $d\mathbf{u}/dt\vert_I = d\mathbf{u}/dt\vert_B + \boldsymbol{\omega}\times\mathbf{u}$ | transport theorem |
| $\mathbf{a}_I = \mathbf{a}_B + 2\boldsymbol{\omega}\times\mathbf{v}_B + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\mathbf{r}) + \dot{\boldsymbol{\omega}}\times\mathbf{r}$ | acceleration seen from a rotating frame |

The next lesson integrates instead of differentiating — over areas and volumes rather than along curves. Multiple integrals give a vehicle's mass, center of mass and inertia tensor, and Lesson 3's Jacobian determinant comes back as the factor that turns $dx\,dy\,dz$ into $r^2\sin\theta\,dr\,d\theta\,d\varphi$.

::: context newton-dot Newton's dot
Isaac Newton wrote the rate of change of a quantity $x$ with a dot over it, $\dot x$, which he called a "fluxion" — the speed at which $x$ "flows". Leibniz, working at the same time, wrote $dx/dt$. Engineers kept both: the dot for time derivatives, because it is compact, and $d/dt$ when the variable matters. Two dots, $\ddot x$, mean the second time derivative. In this course a dot always means *with respect to time*, never with respect to anything else.
:::

::: context chord-to-tangent From chord to tangent
The chord from $\mathbf{r}(t)$ to $\mathbf{r}(t + \delta t)$, divided by $\delta t$, is an average velocity. As $\delta t$ shrinks, the far point slides back along the curve, and the chord swings until it lies along the tangent.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M20,150 Q140,150 200,100 T340,20" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="106.4" y1="142" x2="265" y2="55" stroke="#8fb8f0" stroke-width="1.5"/>
  <circle cx="265" cy="55" r="3" fill="#8fb8f0"/>
  <line x1="106.4" y1="142" x2="173.6" y2="118" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="173.6" cy="118" r="3" fill="#1d6fd1"/>
  <text x="170" y="72" font-size="11" fill="#1d6fd1" text-anchor="middle">chords</text>
  <line x1="36.4" y1="156.6" x2="246.4" y2="112.8" stroke="#b4232c" stroke-width="2"/>
  <text x="252" y="120" font-size="12" fill="#b4232c">tangent: v</text>
  <circle cx="106.4" cy="142" r="4" fill="#1f2a44"/>
  <text x="100" y="166" font-size="12" fill="#1f2a44" text-anchor="middle">r(t)</text>
</svg>
```

The velocity is the limit of that chord: tangent to the path, pointing the way you go.
:::

::: context clock-hand Why a turning unit vector moves sideways
A clock hand keeps its length, so its tip moves along a circle. Moving along a circle always means moving at right angles to the radius. That is the whole reason $\mathbf{e}\cdot\dot{\mathbf{e}} = 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="80" r="60" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <line x1="150" y1="80" x2="192.4" y2="37.6" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="192.4,37.6 180.4,42.9 187.1,49.6" fill="#1d6fd1"/>
  <text x="160" y="50" font-size="13" fill="#1d6fd1">e</text>
  <line x1="192.4" y1="37.6" x2="227.8" y2="73.0" stroke="#b4232c" stroke-width="3"/>
  <polygon points="227.8,73.0 222.5,61.0 215.8,67.7" fill="#b4232c"/>
  <text x="236" y="80" font-size="13" fill="#b4232c">ė</text>
  <circle cx="150" cy="80" r="3" fill="#1f2a44"/>
  <path d="M184.6,44.7 L191.7,51.8 L198.8,44.7" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="290" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">length fixed,</text>
  <text x="290" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">so ė ⟂ e</text>
</svg>
```
:::

::: context equal-areas Kepler's equal areas
Johannes Kepler noticed from observations of Mars, early in the 1600s, that a line from the Sun to a planet sweeps out equal areas in equal times. Constant angular momentum is the same fact. In a short time $dt$ the line sweeps a thin triangle of area $\tfrac{1}{2}\lVert\mathbf{r}\times\mathbf{v}\rVert\,dt = \tfrac{1}{2}h\,dt$. If $h$ never changes, neither does the rate of sweeping. So a satellite races through perigee and dawdles at apogee.
:::

::: context downrange What downrange means
**Downrange** distance is how far the vehicle is from the launch site measured along Earth's surface, as if you followed its shadow on the ground. For a rocket going nearly straight up, the arc length grows fast while the downrange distance barely moves. Range-safety officers and recovery ships care about downrange — that is where falling stages land.
:::

::: context simpsons-rule How Simpson's rule adds up
To integrate numerically, cut the interval into many short pieces and estimate the area of each. The trapezoid rule joins the ends of each piece with a straight line. Simpson's rule, named after the 18th-century English mathematician Thomas Simpson, fits a parabola through each pair of pieces instead. With weights $1, 4, 2, 4, \dots, 4, 1$ on the sampled values (times the step size over $3$), its error falls like the fourth power of the step — so $2000$ pieces are far more than enough for this smooth speed curve.
:::

::: context osculating-circle The kissing circle
The best-fitting circle at a point is called the **osculating circle**, from the Latin for "to kiss": it touches the curve and bends exactly as much as the curve does there. Its radius is $R = 1/\kappa$, and its center lies along $\hat{\mathbf{N}}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M100,40 Q180,200 260,40" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="180" cy="80" r="40" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="180" cy="120" r="4" fill="#b4232c"/>
  <line x1="180" y1="120" x2="180" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="180" cy="80" r="2.5" fill="#1f2a44"/>
  <text x="190" y="104" font-size="12" fill="#b4232c">R = 1/κ</text>
  <text x="180" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">curve and circle touch and bend alike</text>
</svg>
```

A curve that straightens out has a bigger kissing circle; a straight line's would be infinitely large.
:::

::: context gravity-turn Why rockets fly a gravity turn
In the thick lower air, a rocket that flew sideways to its motion would feel large sideways air loads that could bend or break it. So after a small pitch "kick" soon after liftoff, most launch vehicles keep their nose pointed along the velocity and let gravity do the turning. The angle of attack stays near zero, the structure stays safe, and the rocket arcs over toward the horizontal. Guidance only steers actively once the air has thinned.
:::

::: context semi-latus-rectum What the semi-latus rectum is
A strange name for a simple length. The **latus rectum** (Latin for "straight side") of an ellipse is the chord through a focus drawn perpendicular to the long axis. Half of it is the semi-latus rectum, $p$. For an orbit, $p = h^2/\mu$, and the orbit equation is $r = p/(1 + e\cos\nu)$, where $e$ is the eccentricity and $\nu$ the angle from perigee. At $\nu = 90^\circ$ the distance from Earth's center is exactly $p$. The example shows a second meaning: $p$ is the radius of curvature at both perigee and apogee.
:::

::: context coriolis Coriolis on Earth
The term is named after the French engineer Gaspard-Gustave de Coriolis, who worked it out in the 1830s while studying machines with rotating parts. On Earth it deflects moving air to the right in the northern hemisphere and to the left in the southern, which is why hurricanes spin opposite ways in the two hemispheres. For a satellite tracked in Earth-fixed coordinates it is over a meter per second squared — not a correction you can skip.
:::

::: context sidereal-day Why not 24 hours?
A 24-hour **solar day** is the time from noon to noon. But while Earth spins, it also moves along its orbit, so it must turn a little extra — about one degree — to bring the Sun back overhead. Measured against the distant stars, one full turn takes a **sidereal day**, about $86{,}164\,\mathrm{s}$ (23 hours 56 minutes 4 seconds). That is the true spin, and $2\pi/86{,}164\,\mathrm{s} = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$.
:::
