---
id: l01-rigid-body-kinematics
title: Rigid body kinematics and the angular velocity vector
minutes: 18
covers:
  - rigid body kinematics and the angular velocity vector
---

A rigid body is a collection of mass elements whose mutual distances never change. That one constraint collapses a continuum of degrees of freedom into six: three numbers place the centre of mass, and three more orient the body. A launch vehicle stage, a satellite bus, a reaction wheel rotor, an engine hanging on its gimbal — each is treated as rigid at the first level of any GNC analysis. Bending and sloshing propellant are corrections layered on top, and you will meet them in the last lesson of this module.

Everything that follows in this module — inertia tensors, Euler's equations, spin stability, momentum wheels — rests on two kinematic facts. The first is that a rotating body has a single, well-defined angular velocity vector $\boldsymbol{\omega}$, the same for every point in it. The second is a rule for differentiating a vector that is carried along by the body. Rate gyros measure $\boldsymbol{\omega}$ directly, attitude estimators integrate it, and controllers command torques that change it, so it pays to be precise about what it is.

Where it shows up: a Falcon 9 first stage performing its flip manoeuvre after separation rotates at a few degrees per second, and its strapdown gyros report the three body-axis components of $\boldsymbol{\omega}$ hundreds of times per second. The same relations describe a reaction wheel spinning at 6,000 rpm, a spin-stabilised upper stage at 60 rpm, and the International Space Station turning once per orbit so that one face always looks at Earth.

## Rigid bodies, frames and degrees of freedom

Two frames appear throughout this module. The **inertial frame** $N$ is one in which Newton's laws hold; for a spacecraft, an Earth-centred frame whose axes point at fixed stars is close enough. The **body frame** $B$ is fixed in the vehicle, with its origin normally at the centre of mass $C$ and its axes along convenient structural directions — the roll axis down the length of a rocket, for instance. A vector fixed in the body, such as the line from the centre of mass to a nozzle, has constant components in $B$ and changing components in $N$.

The attitude of the body is the relation between the two frames. If a vector has body components $\mathbf{r}_B$ and inertial components $\mathbf{r}_N$, then

$$
\mathbf{r}_N = \mathbf{R}\,\mathbf{r}_B ,
$$

where $\mathbf{R}$ is a $3\times 3$ rotation matrix: its columns are the body axes expressed in $N$, so $\mathbf{R}^\top\mathbf{R} = \mathbf{I}_3$ (the identity matrix) and $\det\mathbf{R} = +1$. Attitude representations — Euler angles, quaternions and the rest — are the subject of a later module. Here you need only that $\mathbf{R}$ exists, is orthonormal, and changes with time as the body turns.

The general displacement of a rigid body is a translation of any chosen reference point plus a rotation about an axis through that point (Chasles' theorem). The translation part is particle mechanics, which you already have. This module is about the rotation part.

## The angular velocity vector

Take a body-fixed vector $\mathbf{r}$. Its body components are constant, so in the inertial frame

$$
\dot{\mathbf{r}}_N = \dot{\mathbf{R}}\,\mathbf{r}_B = \dot{\mathbf{R}}\mathbf{R}^\top\,\mathbf{r}_N .
$$

Call the matrix $\mathbf{W} = \dot{\mathbf{R}}\mathbf{R}^\top$. Differentiating $\mathbf{R}\mathbf{R}^\top = \mathbf{I}_3$ gives $\dot{\mathbf{R}}\mathbf{R}^\top + \mathbf{R}\dot{\mathbf{R}}^\top = 0$, that is $\mathbf{W} + \mathbf{W}^\top = 0$. So $\mathbf{W}$ is skew-symmetric, and a $3\times 3$ skew-symmetric matrix has only three independent entries. Name them $\omega_1, \omega_2, \omega_3$ and arrange them as

$$
[\boldsymbol{\omega}\times] =
\begin{bmatrix}
0 & -\omega_3 & \omega_2 \\
\omega_3 & 0 & -\omega_1 \\
-\omega_2 & \omega_1 & 0
\end{bmatrix},
\qquad
[\boldsymbol{\omega}\times]\,\mathbf{v} = \boldsymbol{\omega}\times\mathbf{v}
\ \text{ for every } \mathbf{v}.
$$

You can verify the last identity by multiplying out one row. With $\mathbf{W} = [\boldsymbol{\omega}\times]$ the derivative of any body-fixed vector becomes

$$
\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}.
$$

This is the definition of the **angular velocity** of $B$ relative to $N$, written $\boldsymbol{\omega}_{B/N}$ when the frames need naming. The point to absorb is that the same $\boldsymbol{\omega}$ works for every body-fixed vector: the rigidity constraint is exactly what makes a single angular velocity exist. Its direction is the instantaneous axis of rotation and its magnitude is the rate, in radians per second.

The same vector can be written in either frame. Its inertial components are $\boldsymbol{\omega}_N$ and its body components $\boldsymbol{\omega}_B = \mathbf{R}^\top\boldsymbol{\omega}_N$. A useful identity for any rotation matrix, $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^\top = [(\mathbf{R}\mathbf{a})\times]$, turns $\dot{\mathbf{R}}\mathbf{R}^\top = [\boldsymbol{\omega}_N\times]$ into

$$
\dot{\mathbf{R}} = \mathbf{R}\,[\boldsymbol{\omega}_B\times],
$$

the **kinematic differential equation** of the attitude. Feed it the body rates a gyro measures and it propagates the attitude matrix forward in time. Integrating it well is a topic of its own; for now, know that it exists and that it is linear in $\mathbf{R}$.

::: key The angular velocity vector
For a rigid body there is one vector $\boldsymbol{\omega}$ such that every body-fixed vector obeys $\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}$. Its matrix form is the skew-symmetric $[\boldsymbol{\omega}\times] = \dot{\mathbf{R}}\mathbf{R}^\top$, and the attitude matrix evolves as $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ with $\boldsymbol{\omega}_B$ the body-axis components — the three numbers a rate gyro triad reports.
:::

### Body rates and what a gyro measures

A strapdown gyro triad is bolted to the structure, so it measures the body components $(\omega_1, \omega_2, \omega_3)$ of $\boldsymbol{\omega}_{B/N}$. In launch vehicle and aircraft practice these are the roll, pitch and yaw rates, often written $p$, $q$, $r$, about the body $x$, $y$, $z$ axes. They are the natural state variables for rotational dynamics, which is why Euler's equations in lesson 5 are written in body components.

Typical magnitudes, all in radians per second: Earth's rotation, $7.29\times 10^{-5}$; the ISS turning once per orbit, $1.13\times 10^{-3}$; an agile imaging satellite slewing, $0.01$ to $0.05$ (about $0.5$ to $3^\circ/\mathrm{s}$); a spin-stabilised upper stage at 60 rpm, $6.28$; a reaction wheel at 6,000 rpm, $628$. Convert rpm to rad/s by multiplying by $2\pi/60 \approx 0.1047$.

### Angular velocities add

Suppose a wheel frame $W$ rotates relative to the body $B$, which rotates relative to $N$. With $\mathbf{R}_{NW} = \mathbf{R}_{NB}\mathbf{R}_{BW}$, differentiate and use the identity above:

$$
\dot{\mathbf{R}}_{NW}\mathbf{R}_{NW}^\top
= \dot{\mathbf{R}}_{NB}\mathbf{R}_{NB}^\top + \mathbf{R}_{NB}\bigl(\dot{\mathbf{R}}_{BW}\mathbf{R}_{BW}^\top\bigr)\mathbf{R}_{NB}^\top
\quad\Longrightarrow\quad
\boldsymbol{\omega}_{W/N} = \boldsymbol{\omega}_{B/N} + \boldsymbol{\omega}_{W/B},
$$

once both terms are expressed in the same frame. Angular velocities compose by ordinary vector addition. Finite rotations do not — rotate a book 90° about two different axes in the two possible orders and you get two different attitudes — but rates are infinitesimal rotations per unit time, and those commute. This addition rule is what lets you write the inertial angular velocity of a spinning reaction wheel as the body rate plus the wheel's spin relative to the body, which lesson 11 needs.

::: warning Rates add, angles do not
Because $\boldsymbol{\omega}$ is a vector, you can add body rates from different sources. You cannot integrate the three components of $\boldsymbol{\omega}$ separately and call the results three angles: after a finite time the order of rotations matters, and component-wise integrated angles have no consistent meaning. The attitude must be propagated through $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ or an equivalent.
:::

## Velocity and acceleration of a point of the body

Let $P$ be a material point of the body, $\mathbf{r}_P = \mathbf{r}_C + \boldsymbol{\rho}$, where $\boldsymbol{\rho}$ runs from the centre of mass to $P$ and is body-fixed. Differentiating in $N$ and using $\dot{\boldsymbol{\rho}} = \boldsymbol{\omega}\times\boldsymbol{\rho}$:

$$
\mathbf{v}_P = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}.
$$

Differentiate once more. The derivative of $\boldsymbol{\omega}\times\boldsymbol{\rho}$ is $\dot{\boldsymbol{\omega}}\times\boldsymbol{\rho} + \boldsymbol{\omega}\times\dot{\boldsymbol{\rho}}$, so

$$
\mathbf{a}_P = \mathbf{a}_C + \dot{\boldsymbol{\omega}}\times\boldsymbol{\rho} + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho}).
$$

The middle term is the tangential acceleration from a changing rate. The last term is centripetal: expanding the triple product, $\boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho}) = \boldsymbol{\omega}(\boldsymbol{\omega}\cdot\boldsymbol{\rho}) - \omega^2\boldsymbol{\rho} = -\omega^2\boldsymbol{\rho}_\perp$, where $\boldsymbol{\rho}_\perp$ is the part of $\boldsymbol{\rho}$ perpendicular to the spin axis. It always points toward the axis and grows with the square of the rate.

::: example Skin speed and load on a spinning upper stage
A spin-stabilised upper stage rotates at 60 rpm about its long axis. A component is mounted on the skin at radius $R = 1.2\,\mathrm{m}$. The rate is $\omega = 60\times 2\pi/60 = 6.28\,\mathrm{rad/s}$. The skin speed relative to the centre of mass is $v = \omega R = 6.28\times 1.2 = 7.54\,\mathrm{m/s}$, and the centripetal acceleration is

$$
a = \omega^2 R = 6.28^2\times 1.2 = 47.4\,\mathrm{m/s^2},
$$

which is $47.4/9.80665 = 4.83$ g. Every bracket on that skin carries almost five times its weight outward for the whole coast, and any liquid propellant is flung against the outer tank wall — both facts a spinner's designers live with.
:::

::: example Nozzle velocity during a pitch manoeuvre
A first stage flies with its centre of mass moving at $\mathbf{v}_C = (2000, 0, 0)\,\mathrm{m/s}$ along the body $x$ axis while pitching at $2^\circ/\mathrm{s}$ about body $y$, so $\boldsymbol{\omega} = (0, 0.0349, 0)\,\mathrm{rad/s}$. The nozzle exit sits $20\,\mathrm{m}$ aft of the centre of mass, $\boldsymbol{\rho} = (-20, 0, 0)\,\mathrm{m}$. The cross product is

$$
\boldsymbol{\omega}\times\boldsymbol{\rho} = (\omega_2\rho_3 - \omega_3\rho_2,\ \omega_3\rho_1 - \omega_1\rho_3,\ \omega_1\rho_2 - \omega_2\rho_1) = (0,\ 0,\ 0.698)\,\mathrm{m/s},
$$

so $\mathbf{v}_P = (2000, 0, 0.698)\,\mathrm{m/s}$: the nozzle drifts sideways at $0.70\,\mathrm{m/s}$ relative to the flight path. If the pitch rate is also building at $\dot{\omega}_2 = 0.5^\circ/\mathrm{s^2} = 0.00873\,\mathrm{rad/s^2}$, the tangential term $\dot{\boldsymbol{\omega}}\times\boldsymbol{\rho}$ contributes $0.175\,\mathrm{m/s^2}$ along $z$, while the centripetal term $\omega^2\times 20 = 0.0244\,\mathrm{m/s^2}$ points from the nozzle toward the centre of mass. An accelerometer at the nozzle would read these on top of the vehicle's own acceleration — one reason inertial sensors are placed close to the centre of mass whenever they can be.
:::

## Differentiating a vector carried by a rotating frame

The rule $\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}$ covers vectors that are constant in the body. Angular momentum, the subject of lesson 4, is not constant in the body, so you need the general rule. Write any vector in terms of the body unit vectors $\hat{\mathbf{b}}_i$ and its body components $A_i$:

$$
\mathbf{A} = \sum_{i=1}^{3} A_i\,\hat{\mathbf{b}}_i,
\qquad
\left.\frac{d\mathbf{A}}{dt}\right|_N = \sum_i \dot{A}_i\,\hat{\mathbf{b}}_i + \sum_i A_i\,\boldsymbol{\omega}\times\hat{\mathbf{b}}_i
= \left.\frac{d\mathbf{A}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{A}.
$$

The first sum is what an observer riding the body sees change — the derivative of the components. The second is the contribution of the frame's own rotation. This is the transport theorem in its simplest form; the module on rotating frames builds the Coriolis and centrifugal accelerations from it. Here it does two jobs. Applied to $\boldsymbol{\omega}$ itself, it shows that $\dot{\boldsymbol{\omega}}$ is the same in both frames, because $\boldsymbol{\omega}\times\boldsymbol{\omega} = 0$. Applied to angular momentum in lesson 5, it produces Euler's equations.

::: key Derivative of a vector seen from the body
For any vector $\mathbf{A}$, its inertial rate of change equals its rate of change as seen in the body plus $\boldsymbol{\omega}\times\mathbf{A}$. A body-fixed vector has zero body-frame derivative, so it simply obeys $\dot{\mathbf{A}} = \boldsymbol{\omega}\times\mathbf{A}$; its length is constant because $\mathbf{A}\cdot(\boldsymbol{\omega}\times\mathbf{A}) = 0$.
:::

::: example The Space Station's angular velocity
The ISS holds a local-vertical attitude: one axis always points at Earth's centre, so the whole station rotates once per orbit relative to the stars. With an orbital period of about 92.9 minutes, or $5{,}574\,\mathrm{s}$,

$$
\omega = \frac{2\pi}{5574} = 1.13\times 10^{-3}\,\mathrm{rad/s} = 0.0646^\circ/\mathrm{s}.
$$

A module $50\,\mathrm{m}$ from the centre of mass therefore moves at $\omega\rho = 1.13\times 10^{-3}\times 50 = 0.056\,\mathrm{m/s}$ relative to the centre of mass — a few centimetres per second, small but not negligible when a visiting vehicle docks at the end of a long truss. The rate is tiny, yet the station's inertia is so large (of order $10^{8}\,\mathrm{kg\,m^2}$) that the angular momentum involved is enormous, which is why lesson 11 makes so much of it.
:::

::: warning Angular velocity belongs to the body, not to a point
Students often ask for "the angular velocity of the nozzle" or "of the tip of the boom". A point has a velocity; only a body or a frame has an angular velocity. Every point of a rigid body shares the one $\boldsymbol{\omega}$, and their different velocities come entirely from their different positions $\boldsymbol{\rho}$ in $\mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$.
:::

::: note Signs and conventions
The cross-product matrix $[\boldsymbol{\omega}\times]$ is sometimes written $\boldsymbol{\omega}^\times$, $\tilde{\boldsymbol{\omega}}$ or $\mathbf{S}(\boldsymbol{\omega})$, and some flight-software conventions store the transpose of $\mathbf{R}$ as "the attitude". The physics does not care, but a sign error in $[\boldsymbol{\omega}\times]$ propagates into every downstream equation. Whenever you meet a new codebase, check its convention on a single-axis rotation before trusting anything else.
:::

## Check yourself

::: check
Starting from $\mathbf{R}\mathbf{R}^\top = \mathbf{I}_3$, show that $\dot{\mathbf{R}}\mathbf{R}^\top$ is skew-symmetric, and explain why that guarantees a body-fixed vector never changes length.
:::

::: answer
Differentiate the constraint: $\dot{\mathbf{R}}\mathbf{R}^\top + \mathbf{R}\dot{\mathbf{R}}^\top = 0$. The second term is the transpose of the first, so with $\mathbf{W} = \dot{\mathbf{R}}\mathbf{R}^\top$ this reads $\mathbf{W} = -\mathbf{W}^\top$: skew-symmetric. For a body-fixed $\mathbf{r}$, $\dot{\mathbf{r}} = \mathbf{W}\mathbf{r}$, and $\frac{d}{dt}(\mathbf{r}\cdot\mathbf{r}) = 2\,\mathbf{r}^\top\mathbf{W}\mathbf{r}$. A quadratic form of a skew-symmetric matrix is zero (transpose it: $\mathbf{r}^\top\mathbf{W}\mathbf{r} = \mathbf{r}^\top\mathbf{W}^\top\mathbf{r} = -\mathbf{r}^\top\mathbf{W}\mathbf{r}$), so the length is constant. In vector language, $\mathbf{r}\cdot(\boldsymbol{\omega}\times\mathbf{r}) = 0$.
:::

::: check
A gyro triad reports body rates $(0.5, -0.2, 0.1)^\circ/\mathrm{s}$. What is the magnitude of the angular velocity in rad/s, and about which body-frame direction is the vehicle turning at this instant?
:::

::: answer
Convert each component with $\pi/180 = 0.01745$: $(0.00873, -0.00349, 0.00175)\,\mathrm{rad/s}$. The magnitude is $\sqrt{0.00873^2 + 0.00349^2 + 0.00175^2} = 0.00956\,\mathrm{rad/s}$, which is $0.548^\circ/\mathrm{s}$. The instantaneous axis is the unit vector along $\boldsymbol{\omega}$: $(0.913, -0.365, 0.183)$ in body coordinates. There is one axis and one rate, not three separate rotations happening at once.
:::

::: check
A reaction wheel spins at $300\,\mathrm{rad/s}$ about the body $x$ axis while the spacecraft itself rotates at $\boldsymbol{\omega}_{B/N} = (0.01, 0.02, 0)\,\mathrm{rad/s}$. What is the wheel's angular velocity relative to inertial space, in body components?
:::

::: answer
Angular velocities add: $\boldsymbol{\omega}_{W/N} = \boldsymbol{\omega}_{W/B} + \boldsymbol{\omega}_{B/N} = (300, 0, 0) + (0.01, 0.02, 0) = (300.01, 0.02, 0)\,\mathrm{rad/s}$. The wheel's inertial spin axis is tilted from the body $x$ axis by $0.02/300 \approx 6.7\times 10^{-5}\,\mathrm{rad}$ — negligible for the wheel's own dynamics, but the small body rate is exactly what produces the gyroscopic coupling torque you will meet in lesson 9.
:::

::: check
A stage rotates at $\boldsymbol{\omega} = (0, 0, 0.5)\,\mathrm{rad/s}$ with its centre of mass at rest. Find the velocity of the point $\boldsymbol{\rho} = (1, 2, 0)\,\mathrm{m}$ and check that it is perpendicular both to $\boldsymbol{\omega}$ and to $\boldsymbol{\rho}$.
:::

::: answer
$\mathbf{v} = \boldsymbol{\omega}\times\boldsymbol{\rho} = (\omega_2\rho_3 - \omega_3\rho_2,\ \omega_3\rho_1 - \omega_1\rho_3,\ \omega_1\rho_2 - \omega_2\rho_1) = (0 - 1.0,\ 0.5 - 0,\ 0) = (-1, 0.5, 0)\,\mathrm{m/s}$. Its dot product with $\boldsymbol{\omega}$ is $0$ and with $\boldsymbol{\rho}$ is $-1 + 1 = 0$. The speed is $\sqrt{1.25} = 1.12\,\mathrm{m/s}$, which equals $\omega\,\lVert\boldsymbol{\rho}_\perp\rVert = 0.5\times\sqrt{5}$ since the whole of $\boldsymbol{\rho}$ is perpendicular to the $z$ spin axis.
:::

::: check
A body-fixed unit vector $\hat{\mathbf{e}}_1 = (1, 0, 0)$ is carried by a body with $\boldsymbol{\omega} = (0.1, -0.2, 0.3)\,\mathrm{rad/s}$. What is its inertial rate of change, and why is the rate of change of $\boldsymbol{\omega}$ itself the same whether measured in $N$ or in $B$?
:::

::: answer
$d\hat{\mathbf{e}}_1/dt = \boldsymbol{\omega}\times\hat{\mathbf{e}}_1 = (0,\ \omega_3,\ -\omega_2) = (0, 0.3, 0.2)\,\mathrm{rad/s}$ — perpendicular to $\hat{\mathbf{e}}_1$, as it must be for a unit vector. For $\boldsymbol{\omega}$, the transport rule gives $\dot{\boldsymbol{\omega}}|_N = \dot{\boldsymbol{\omega}}|_B + \boldsymbol{\omega}\times\boldsymbol{\omega}$, and the cross product of a vector with itself vanishes. So the angular acceleration is frame-independent, and differentiating gyro-measured body rates gives the true angular acceleration directly.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $N$, $B$ | Inertial frame; body-fixed frame with origin at the centre of mass $C$ |
| $\mathbf{R}$ | Attitude matrix, $\mathbf{r}_N = \mathbf{R}\mathbf{r}_B$, with $\mathbf{R}^\top\mathbf{R} = \mathbf{I}_3$ |
| $\boldsymbol{\omega}$ | Angular velocity of $B$ relative to $N$; $\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}$ for body-fixed $\mathbf{r}$ |
| $[\boldsymbol{\omega}\times]$ | Skew-symmetric matrix of $\boldsymbol{\omega}$, equal to $\dot{\mathbf{R}}\mathbf{R}^\top$ in inertial components |
| $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ | Kinematic differential equation driven by gyro body rates |
| $\mathbf{v}_P = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$ | Velocity of a body point; acceleration adds $\dot{\boldsymbol{\omega}}\times\boldsymbol{\rho} + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})$ |
| Transport rule | Inertial derivative equals body derivative plus $\boldsymbol{\omega}\times\mathbf{A}$ |
| Composition | $\boldsymbol{\omega}_{W/N} = \boldsymbol{\omega}_{W/B} + \boldsymbol{\omega}_{B/N}$; rates add, finite angles do not |

The next lesson asks how much angular momentum a given $\boldsymbol{\omega}$ carries. Summing $\boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})$ over every mass element produces the inertia tensor, and the parallel axis theorem tells you how to assemble it for a whole vehicle.
