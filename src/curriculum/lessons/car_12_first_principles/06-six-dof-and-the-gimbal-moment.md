---
id: l06-six-dof-and-the-gimbal-moment
title: "Six degrees of freedom and the gimbal moment"
minutes: 18
covers:
  - extending to 6-DOF: Euler’s rotational equation and the moment from a gimballed thrust offset
---

The planar equations of lesson 4 contain a quantity they cannot compute: the angle of attack. It appears in two of the five equations, and nothing in the set determines it. That is the signature of a point-mass model — the vehicle has a position and a velocity but no orientation of its own, so its attitude has to be handed in from outside.

Six degrees of freedom fixes that by giving the vehicle a rotational state as well as a translational one, and adding the equation that governs it. The angle of attack then stops being an input and becomes a consequence: it is the difference between where the vehicle is pointing and where it is going,

$$
\alpha = \theta - \gamma,
$$

with $\theta$ the pitch attitude measured from the same horizontal reference as the flight path angle $\gamma$. Closing that loop — attitude drives $\alpha$, $\alpha$ drives the translational equations, the translational equations change $\gamma$, which changes $\alpha$ again — is what makes a 6-DOF simulation a simulation rather than a trajectory playback.

The module's first exercise asks you to derive the planar equations in full and then *extend verbally* to 6-DOF. This lesson is that extension: Euler's rotational equation, and the moment a gimballed engine produces.

## Euler's rotational equation

Start from the rotational form of Newton's second law about the centre of mass. In an inertial frame, the applied moment equals the rate of change of angular momentum:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_{I} = \mathbf{M}.
$$

The difficulty is that $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ requires an inertia matrix, and the inertia matrix of a vehicle is constant only in axes fixed to the vehicle. So express everything in body axes and convert the derivative with the transport theorem, which relates a derivative taken in a rotating frame to one taken in an inertial frame:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_{I} = \left.\frac{d\mathbf{H}}{dt}\right|_{B} + \boldsymbol{\omega}\times\mathbf{H}.
$$

With $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ and $\mathbf{I}$ constant in the body frame, the body-frame derivative is $\mathbf{I}\dot{\boldsymbol{\omega}}$, and the result is Euler's equation.

::: key
The 6-DOF rotational equation: $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$, with $\mathbf{I}$ the inertia matrix in body axes, $\boldsymbol{\omega}$ the angular velocity of the body relative to inertial space, and $\mathbf{M}$ the total applied moment about the centre of mass. For a launch vehicle the dominant control moment is $\mathbf{M} = \mathbf{r}_{\text{gimbal}}\times\mathbf{T}$ — the cross product of the gimbal offset from the centre of mass with the thrust vector.
:::

Define the symbols out loud as you write them: $\mathbf{I}$ in $\mathrm{kg\,m^2}$, $\boldsymbol{\omega}$ in $\mathrm{rad/s}$, $\mathbf{M}$ in $\mathrm{N\,m}$. The units of each term are $\mathrm{kg\,m^2}\times\mathrm{s^{-2}} = \mathrm{N\,m}$, which is the check to say.

The term $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$ is the gyroscopic coupling. It is quadratic in the rates, so it is negligible when the rates are small — a launch vehicle's pitch rate is a fraction of a degree per second — and dominant when they are not, which is why a spin-stabilised stage behaves so differently from a booster.

::: warning A burning rocket is not a rigid body with constant inertia
The equation above assumes $\mathbf{I}$ is constant. A vehicle burning two tonnes of propellant a second has an inertia matrix that changes visibly over its burn, and the rigorous variable-mass treatment adds a $\dot{\mathbf{I}}\boldsymbol{\omega}$ term and a jet-damping moment produced by propellant being accelerated along a rotating vehicle before it leaves the nozzle. Both are usually small compared with the gimbal moment. Naming them and saying they are small is a much better answer than either ignoring them or pretending to carry them.
:::

## The moment from a gimballed thrust offset

A launch vehicle steers by pointing its engines. The engine sits at a position $\mathbf{r}_{\text{gimbal}}$ relative to the centre of mass — for a booster, roughly along the body axis, a large distance aft. When the engine is deflected by an angle $\delta$, the thrust vector is no longer parallel to $\mathbf{r}_{\text{gimbal}}$, and the cross product is non-zero:

$$
\mathbf{M} = \mathbf{r}_{\text{gimbal}}\times\mathbf{T}, \qquad |\mathbf{M}| = r\,T\sin\delta,
$$

where $r$ is the distance from the centre of mass to the gimbal point and $\delta$ the deflection from the body axis. Two consequences follow immediately, and both are worth saying:

- With $\delta = 0$ the thrust passes through the centre of mass and produces **no** moment. All control authority comes from deflecting it.
- The moment arm $r$ shrinks as the centre of mass moves aft during a burn, so the same gimbal angle produces less moment late in the stage. Control authority is a function of flight time.

::: example Angular acceleration from a two-degree gimbal
**Assumptions.** A booster of mass $3.00\times 10^5\,\mathrm{kg}$ and length 47 m, modelled as a uniform slender rod about its pitch axis. Thrust $T = 5.00\times 10^6\,\mathrm{N}$, gimbal point $r = 20\,\mathrm{m}$ aft of the centre of mass, deflection $\delta = 2^\circ$.

**Inertia.** For a uniform rod about a transverse axis through its centre, $I = mL^2/12$. With $47^2 = 2209$, this is $3.00\times 10^5 \times 2209/12 = 5.52\times 10^7\,\mathrm{kg\,m^2}$. The rod model is crude — a real booster has most of its mass in propellant that is not uniformly distributed, and the inertia changes through the burn — so treat this as good to perhaps thirty per cent, and say so.

**Moment.** $\sin 2^\circ = 0.034899$, so $|\mathbf{M}| = 20 \times 5.00\times 10^6 \times 0.034899 = 3.49\times 10^6\,\mathrm{N\,m}$.

**Angular acceleration.** $\dot\omega = M/I = 3.49\times 10^6/5.52\times 10^7 = 0.0632\,\mathrm{rad/s^2}$, which is $0.0632 \times 57.2958 = 3.62$ degrees per second squared.

**Sanity check.** Held for one second from rest, that gives a pitch displacement of $0.5 \times 0.0632 \times 1.0^2 = 0.0316\,\mathrm{rad}$, about 1.8 degrees. So a two-degree gimbal swings the vehicle through roughly two degrees in a second — fast enough to control a slow pitch programme and to reject wind, and slow enough that the vehicle is not going to be thrown about. That is the right order, which is the check.
:::

::: example When the gyroscopic term matters
**Case one: the booster.** Its angular rates are of order $0.01\,\mathrm{rad/s}$. The gyroscopic term is quadratic in $\omega$, so it scales as $I\omega^2 \approx 5.52\times 10^7 \times 10^{-4} = 5.5\times 10^3\,\mathrm{N\,m}$, against a gimbal moment of $3.49\times 10^6\,\mathrm{N\,m}$. That is about 0.16 per cent. Neglecting it during a launch-vehicle discussion is defensible, and saying *why* it is defensible is the point.

**Case two: a spin-stabilised stage.** Take $\mathbf{I} = \mathrm{diag}(2.0\times 10^4,\ 1.0\times 10^5,\ 1.0\times 10^5)\,\mathrm{kg\,m^2}$ — axisymmetric, spinning about the first axis — with $\boldsymbol{\omega} = (0.5,\ 0.02,\ 0.01)\,\mathrm{rad/s}$.

First $\mathbf{I}\boldsymbol{\omega} = (1.0\times 10^4,\ 2000,\ 1000)\,\mathrm{kg\,m^2/s}$. Then, component by component,

$$
\begin{aligned}
(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})_x &= 0.02 \times 1000 - 0.01 \times 2000 = 0,\\
(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})_y &= 0.01 \times 10^4 - 0.5 \times 1000 = -400,\\
(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})_z &= 0.5 \times 2000 - 0.02 \times 10^4 = 800,
\end{aligned}
$$

all in $\mathrm{N\,m}$, with magnitude $\sqrt{800000} = 894.4\,\mathrm{N\,m}$.

**What it means.** Nearly nine hundred newton metres of moment is required merely to hold those small transverse rates constant on a spinning body — no external torque needed, no control system involved. That is gyroscopic stiffness, and it is why a spinning stage resists pointing changes and why its transverse rates precess instead of decaying.
:::

::: example How hard does the gimbal have to work against the air?
**The question an interviewer follows up with:** if the vehicle has a two-degree angle of attack at max-Q, how much gimbal is needed to trim it?

**Assumptions.** Dynamic pressure $\bar q = 35\,\mathrm{kPa}$, reference area $S = 10.5\,\mathrm{m^2}$, normal force coefficient slope $C_{N\alpha} = 2.0$ per radian — the slender-body value, representative rather than measured — and a centre of pressure 3.0 m ahead of the centre of mass.

**Normal force.** $\alpha = 2^\circ = 0.034907\,\mathrm{rad}$, so $N = \bar q S C_{N\alpha}\alpha = 35000 \times 10.5 \times 2.0 \times 0.034907 = 2.566\times 10^4\,\mathrm{N}$.

**Aerodynamic moment.** $2.566\times 10^4 \times 3.0 = 7.70\times 10^4\,\mathrm{N\,m}$, destabilising, because the centre of pressure is ahead of the centre of mass.

**Required gimbal.** Set $rT\sin\delta$ equal to that: $\sin\delta = 7.70\times 10^4/(20 \times 5.00\times 10^6) = 7.70\times 10^{-4}$, so $\delta = 0.044^\circ$.

**Read the result.** The aerodynamic moment is $7.70\times 10^4/3.49\times 10^6 = 0.0221$ of what a two-degree gimbal produces — about two per cent. Trimming two degrees of angle of attack needs a gimbal deflection of a twentieth of a degree.

**The conclusion to state.** Thrust vector control authority is not sized by static aerodynamic trim. It is sized by wind shear, thrust misalignment, slosh, engine-out and the need to track a pitch programme, all of which are dynamic. That is a genuinely useful thing to know, and it comes out of a calculation that takes ninety seconds.
:::

## What the full 6-DOF set looks like

Verbally, which is how the exercise asks for it:

- **Three translational equations** — the same force balance as before, now in three dimensions, with the aerodynamic forces evaluated using angles derived from the attitude rather than prescribed.
- **Three rotational equations** — Euler's equation, one component per body axis.
- **Attitude kinematics** — a relation between $\boldsymbol{\omega}$ and whatever attitude representation you are carrying: Euler angles, a quaternion or a direction cosine matrix. Say which and say why. Quaternions avoid the singularity that Euler angles have at $\pm 90^\circ$ of pitch, which is exactly where a launch vehicle starts.
- **Position kinematics** — three more, integrating velocity.
- **Mass** — one, as before.

Thirteen states with a quaternion, twelve with Euler angles. The coupling is what matters: attitude sets $\alpha$, $\alpha$ sets the aerodynamic forces and moments, the moments change $\boldsymbol{\omega}$, $\boldsymbol{\omega}$ changes the attitude.

## Check yourself

::: check
Derive Euler's rotational equation, naming the theorem that converts between frames.
:::

::: answer
In an inertial frame, moment equals the rate of change of angular momentum about the centre of mass: $d\mathbf{H}/dt|_I = \mathbf{M}$.

The inertia matrix is constant only in body axes, so write $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ there and convert the derivative using the **transport theorem**, which says that for any vector, the inertial derivative equals the body-frame derivative plus $\boldsymbol{\omega}\times$ the vector:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_I = \left.\frac{d\mathbf{H}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{H} = \mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}).
$$

Setting that equal to $\mathbf{M}$ gives the result. The assumption used is that $\mathbf{I}$ is constant in body axes — true for a rigid body, approximate for a burning rocket.
:::

::: check
Why does a gimballed engine at zero deflection produce no control moment, and what does that imply about where control authority comes from?
:::

::: answer
Because $\mathbf{M} = \mathbf{r}\times\mathbf{T}$ and the cross product of two parallel vectors is zero. At zero deflection the thrust acts along the body axis, which is the same direction as the offset from the centre of mass to the gimbal point, so there is no moment arm.

All of the control moment therefore comes from the *deflection*, through the $\sin\delta$ factor. Two implications follow. Control authority is proportional to thrust, so an engine throttled down has proportionally less of it — which matters during a throttle-down through max-Q. And it is proportional to the moment arm $r$, which shrinks as propellant burns off and the centre of mass moves aft, so authority is weakest late in the stage when the vehicle is also lightest and therefore most responsive. Those two effects partly offset, and an interviewer may ask which wins.
:::

::: check
A vehicle has $I = 4.0\times 10^6\,\mathrm{kg\,m^2}$ about its pitch axis, thrust $1.2\times 10^6\,\mathrm{N}$ and a gimbal point 8.0 m from the centre of mass. What deflection gives an angular acceleration of 5 degrees per second squared?
:::

::: answer
Convert the target: $5^\circ/\mathrm{s^2}$ is $5/57.2958 = 0.08727\,\mathrm{rad/s^2}$.

Required moment: $M = I\dot\omega = 4.0\times 10^6 \times 0.08727 = 3.49\times 10^5\,\mathrm{N\,m}$.

Required deflection: $\sin\delta = M/(rT) = 3.49\times 10^5/(8.0 \times 1.2\times 10^6) = 0.03635$, so $\delta = 2.08^\circ$.

A sanity check worth making: the answer is a couple of degrees, which is inside the few-degree range gimbal actuators typically provide. If it had come out at forty degrees, either the vehicle or the requirement would be wrong.
:::

::: check
In the planar model the angle of attack was an input. In 6-DOF it is not. Explain where it comes from and why that changes the character of the simulation.
:::

::: answer
It comes from the difference between attitude and flight path: $\alpha = \theta - \gamma$ in the planar case, where $\theta$ is the pitch attitude obtained by integrating the rotational equations and $\gamma$ is the flight path angle obtained by integrating the translational ones.

The change in character is that the model becomes closed-loop in the physical sense. In 3-DOF you specify $\alpha(t)$ and the trajectory follows; nothing can go wrong with the attitude because there is no attitude. In 6-DOF the control system has to *produce* the angle of attack you want by gimballing, against an aerodynamic moment that amplifies any error, and the trajectory and the attitude are coupled through $\alpha$ in both directions.

That is why aerodynamic instability matters at all: in 3-DOF it does not appear, and in 6-DOF it is the reason the vehicle needs a control system with adequate bandwidth rather than an open-loop pitch schedule.
:::

::: check
For the spinning stage in the worked example, the gyroscopic term was about 894 N m with no external torque applied. What is physically happening?
:::

::: answer
The angular momentum vector is not aligned with the angular velocity vector, because the body is not spherically symmetric — $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ with unequal principal inertias tilts $\mathbf{H}$ away from $\boldsymbol{\omega}$.

With no external moment, $\mathbf{H}$ is fixed in inertial space. The body must therefore rotate in such a way that $\boldsymbol{\omega}$ traces a cone around $\mathbf{H}$, and that motion is a genuine acceleration, which requires the internal term $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$ to be balanced by $\mathbf{I}\dot{\boldsymbol{\omega}}$. The 894 N m is the size of that internal exchange, not an applied torque.

The practical consequence for a spin-stabilised stage is that a transverse rate does not damp out on its own; it precesses. Removing it takes either active control or a passive nutation damper.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$ | Euler's rotational equation in body axes |
| Transport theorem | The inertial derivative of $\mathbf{H}$ equals its body-frame derivative plus $\boldsymbol{\omega}\times\mathbf{H}$ |
| $\mathbf{M} = \mathbf{r}_{\text{gimbal}}\times\mathbf{T}$ | Dominant control moment; magnitude $rT\sin\delta$ |
| $\alpha = \theta - \gamma$ | Angle of attack as attitude minus flight path angle |
| $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$ | Gyroscopic term; negligible for a booster, dominant for a spinner |
| Worked booster | $I = 5.52\times 10^7\,\mathrm{kg\,m^2}$; $2^\circ$ gimbal gives $3.49\times 10^6\,\mathrm{N\,m}$ and $3.62^\circ/\mathrm{s^2}$ |
| Worked trim | Two degrees of angle of attack at 35 kPa needs $0.044^\circ$ of gimbal |
| Neglected | $\dot{\mathbf{I}}\boldsymbol{\omega}$ and jet damping from the variable mass |

The next lesson steps back from the physics to the technique that has been running underneath all five derivations: dimensional analysis, used as a live error check and as a way to guess the form of a result you cannot derive in the time available.
