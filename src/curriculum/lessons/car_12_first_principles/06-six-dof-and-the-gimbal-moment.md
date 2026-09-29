---
id: l06-six-dof-and-the-gimbal-moment
title: "Six degrees of freedom and the gimbal moment"
minutes: 20
covers:
  - extending to 6-DOF: Euler’s rotational equation and the moment from a gimballed thrust offset
---

Balance a broom upright on your palm. To keep it up you slide your hand under it, and the broom tilts back toward vertical. You are steering the top of the broom by moving the bottom. A rocket steers the same way: it swivels its engine at the bottom, and the whole vehicle rotates. To describe that, the rocket needs something the last two lessons never gave it — a direction it is *pointing*, separate from the direction it is *going*.

The planar equations of lesson 4 contain a quantity they cannot compute: the angle of attack, $\alpha$. It shows up in two of the five equations, and nothing in the set decides its value. That is the mark of a **point-mass model**. The vehicle has a position and a velocity but no orientation of its own, so its attitude has to be handed in from outside.

**Six degrees of freedom** — three ways to move plus three ways to turn — fixes that by giving the vehicle a rotational state and adding the equation that governs it. Then the angle of attack stops being an input and becomes a result. It is the difference between where the vehicle points and where it is going:

$$
\alpha = \theta - \gamma,
$$

where $\theta$ (read "theta") is the **pitch attitude** — the nose angle above the horizontal — measured from the same horizontal as the flight path angle $\gamma$. Now there is a loop: attitude sets $\alpha$; $\alpha$ sets the forces in the translational equations; those change $\gamma$; that changes $\alpha$ again. Closing that loop is what makes a 6-DOF simulation a real simulation rather than a replay of a planned path.

The module's first exercise asks you to derive the planar equations in full and then *extend verbally* to 6-DOF. This lesson is that extension: Euler's rotational equation, and the twist a swiveling engine produces.

## Euler's rotational equation

Start with the spinning version of Newton's second law. For moving in a straight line, force changes momentum. For turning, a **moment** — a twisting force, also called a **torque**, measured in newton meters — changes **[[angular momentum|angular-momentum]]**, the "amount of spin" an object carries. Written for the center of mass, as seen from a frame that is not itself rotating (an **inertial frame**):

$$
\left.\frac{d\mathbf{H}}{dt}\right|_{I} = \mathbf{M}.
$$

Here $\mathbf{H}$ is the angular momentum, $\mathbf{M}$ is the total applied moment, and the little "$I$" at the bottom of the bar means "rate of change as seen in the inertial frame".

The difficulty is that $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ needs the **[[inertia matrix|inertia-matrix]]** $\mathbf{I}$ — the table that says how the vehicle's mass is spread out, and so how hard it is to spin about each axis. That table is constant only in axes fixed to the vehicle, its **body axes**. Look at the rocket from the ground and, as it rotates, its mass distribution appears to swing around. So we work in body axes, and convert the rate of change with the **[[transport theorem|transport-theorem]]**. That theorem says: the rate of change of any vector as seen from inertial space equals its rate of change as seen from the rotating body, plus $\boldsymbol{\omega}\times$ the vector. Here $\boldsymbol{\omega}$ (read "omega") is the body's angular velocity:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_{I} = \left.\frac{d\mathbf{H}}{dt}\right|_{B} + \boldsymbol{\omega}\times\mathbf{H}.
$$

The symbol $\times$ between two vectors is the **[[cross product|cross-product]]**, which gives a new vector at right angles to both. With $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ and $\mathbf{I}$ constant in the body frame, the body-frame rate of change is $\mathbf{I}\dot{\boldsymbol{\omega}}$. Substitute, and you have Euler's equation.

::: key
The 6-DOF rotational equation: $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$, with $\mathbf{I}$ the inertia matrix in body axes, $\boldsymbol{\omega}$ the angular velocity of the body relative to inertial space, and $\mathbf{M}$ the total applied moment about the center of mass. For a launch vehicle the dominant control moment is $\mathbf{M} = \mathbf{r}_{\text{gimbal}}\times\mathbf{T}$ — the cross product of the gimbal offset from the center of mass with the thrust vector.
:::

Name the symbols and their units out loud as you write them: $\mathbf{I}$ in $\mathrm{kg\,m^2}$, $\boldsymbol{\omega}$ in $\mathrm{rad/s}$, $\mathbf{M}$ in $\mathrm{N\,m}$. Every term has units $\mathrm{kg\,m^2}\times\mathrm{s^{-2}} = \mathrm{N\,m}$. That is the check to say.

The term $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$ is the **[[gyroscopic|gyroscopic]]** coupling — the reason a spinning top behaves so strangely. It contains $\boldsymbol{\omega}$ twice, so it grows with the *square* of the turn rates. When rates are small it is tiny: a launch vehicle's pitch rate is a fraction of a degree per second. When rates are large it dominates. That is why a spin-stabilized stage behaves so differently from a booster.

::: warning A burning rocket is not a rigid body with constant inertia
The equation above assumes $\mathbf{I}$ never changes. A vehicle burning two metric tons of propellant a second has an inertia matrix that changes noticeably over its burn. The careful variable-mass treatment adds a $\dot{\mathbf{I}}\boldsymbol{\omega}$ term, plus a **jet-damping** moment: propellant flowing down a rotating vehicle gets swung sideways before it leaves the nozzle, and that slightly resists the rotation. Both are usually small compared with the gimbal moment. Naming them and saying they are small is a much better answer than ignoring them or pretending to carry them.
:::

## The moment from a swiveling engine

A launch vehicle steers by pointing its engines. Each engine hangs on a **[[gimbal|gimbal]]** — a pivot that lets it swivel. The pivot sits at a position $\mathbf{r}_{\text{gimbal}}$ (read "r gimbal") measured from the center of mass. For a booster that is roughly along the body axis, a long way aft.

When the engine points straight back, its thrust line runs right through the center of mass — like pushing a shopping cart dead center, it goes straight. When the engine swivels by an angle $\delta$, the thrust line misses the center of mass, and the rocket starts to turn — like pushing the cart at one corner. In symbols, the thrust vector is no longer parallel to $\mathbf{r}_{\text{gimbal}}$, and their cross product is no longer zero:

$$
\mathbf{M} = \mathbf{r}_{\text{gimbal}}\times\mathbf{T}, \qquad |\mathbf{M}| = r\,T\sin\delta,
$$

where $r$ is the distance from the center of mass to the gimbal point and $\delta$ is the swivel angle from the body axis. The bars $|\ |$ mean "size of". Two consequences follow at once, and both are worth saying:

- With $\delta = 0$ the thrust passes through the center of mass and makes **no** moment. All steering ability comes from swiveling it.
- The moment arm $r$ changes during the burn, because the center of mass moves as propellant drains. If it moves aft, toward the engines, the same swivel angle makes less moment late in the stage. Either way, control authority is a function of flight time.

::: example Angular acceleration from a two-degree gimbal
**Assumptions.** A booster of mass $3.00\times 10^5\,\mathrm{kg}$ and length 47 m, modeled as a uniform thin rod turning about its pitch axis. Thrust $T = 5.00\times 10^6\,\mathrm{N}$, gimbal point $r = 20\,\mathrm{m}$ aft of the center of mass, swivel $\delta = 2^\circ$.

**Inertia.** For a uniform rod spun about its middle, $I = mL^2/12$. First $47^2 = 2209$, so $I = 3.00\times 10^5 \times 2209/12 = 5.52\times 10^7\,\mathrm{kg\,m^2}$. The rod model is crude — a real booster's mass is mostly propellant that is not spread evenly, and it changes through the burn — so treat this as good to perhaps thirty percent, and say so.

**Moment.** $\sin 2^\circ = 0.034899$, so $|\mathbf{M}| = 20 \times 5.00\times 10^6 \times 0.034899 = 3.49\times 10^6\,\mathrm{N\,m}$.

**Angular acceleration.** With the rates small, the gyroscopic term drops out and $I\dot\omega = M$, so $\dot\omega = M/I = 3.49\times 10^6/5.52\times 10^7 = 0.0632\,\mathrm{rad/s^2}$. Multiply by $57.2958$ degrees per radian: $3.62$ degrees per second squared.

**Sanity check.** Held for one second from rest, the rocket turns through $\tfrac12\dot\omega t^2 = 0.5 \times 0.0632 \times 1.0^2 = 0.0316\,\mathrm{rad}$, about 1.8 degrees. So a two-degree swivel turns the vehicle about two degrees in a second. That is quick enough to follow a slow pitch plan and fight off wind, and slow enough that the vehicle is not thrown about. Right order — which is the check.
:::

::: example When the gyroscopic term matters
**Case one: the booster.** Its turn rates are around $0.01\,\mathrm{rad/s}$. The gyroscopic term goes as $\omega^2$, so its size is about $I\omega^2 \approx 5.52\times 10^7 \times 10^{-4} = 5.5\times 10^3\,\mathrm{N\,m}$. Compare the gimbal moment, $3.49\times 10^6\,\mathrm{N\,m}$: the ratio is about 0.16 percent. Leaving it out of a launch-vehicle discussion is defensible — and saying *why* it is defensible is the point.

**Case two: a spin-stabilized stage.** Take $\mathbf{I} = \mathrm{diag}(2.0\times 10^4,\ 1.0\times 10^5,\ 1.0\times 10^5)\,\mathrm{kg\,m^2}$ — "diag" means the three numbers sit on the diagonal of the matrix and the rest are zero. The stage is symmetric about its first axis and spinning about it, with $\boldsymbol{\omega} = (0.5,\ 0.02,\ 0.01)\,\mathrm{rad/s}$.

First multiply each rate by its inertia: $\mathbf{I}\boldsymbol{\omega} = (1.0\times 10^4,\ 2000,\ 1000)\,\mathrm{kg\,m^2/s}$. Then take the cross product component by component:

$$
\begin{aligned}
(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})_x &= 0.02 \times 1000 - 0.01 \times 2000 = 0,\\
(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})_y &= 0.01 \times 10^4 - 0.5 \times 1000 = -400,\\
(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})_z &= 0.5 \times 2000 - 0.02 \times 10^4 = 800,
\end{aligned}
$$

all in $\mathrm{N\,m}$. Its size is $\sqrt{0^2 + 400^2 + 800^2} = \sqrt{800\,000} = 894.4\,\mathrm{N\,m}$.

**What it means.** Holding those small sideways rates *fixed* on this spinning body would take about 894 N m of applied moment. Apply nothing, and Euler's equation says $\mathbf{I}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$: the sideways rates keep changing, swinging round and round, with no control system involved. That is gyroscopic stiffness. It is why a spinning stage resists being re-pointed, and why its sideways rates **precess** — circle around — instead of dying away.
:::

::: example How hard does the gimbal have to work against the air?
**The follow-up an interviewer asks:** if the vehicle has a two-degree angle of attack at max-Q, how much swivel does it take to hold it steady (to **trim** it)?

**Assumptions.** Dynamic pressure $\bar q = 35\,\mathrm{kPa}$, reference area $S = 10.5\,\mathrm{m^2}$, normal-force slope $C_{N\alpha} = 2.0$ per radian — the [[slender-body value|slender-body]], representative rather than measured — and a center of pressure 3.0 m ahead of the center of mass.

**Normal force** (the air's sideways push). $\alpha = 2^\circ = 0.034907\,\mathrm{rad}$, so $N = \bar q S C_{N\alpha}\alpha = 35\,000 \times 10.5 \times 2.0 \times 0.034907 = 2.566\times 10^4\,\mathrm{N}$.

**Aerodynamic moment.** Force times lever arm: $2.566\times 10^4 \times 3.0 = 7.70\times 10^4\,\mathrm{N\,m}$. It is destabilizing, because the center of pressure is ahead of the center of mass.

**Required gimbal.** Set $rT\sin\delta$ equal to it: $\sin\delta = 7.70\times 10^4/(20 \times 5.00\times 10^6) = 7.70\times 10^{-4}$, so $\delta = 0.044^\circ$.

**Read the result.** The air's moment is $7.70\times 10^4/3.49\times 10^6 = 0.0221$ of what a two-degree swivel produces — about two percent. Trimming two degrees of angle of attack needs about a twentieth of a degree of gimbal.

**The conclusion to state.** Steering authority is not sized by steady trim against the air. It is sized by wind shear, engine misalignment, propellant slosh, losing an engine, and following a pitch plan — all things that change with time. That is genuinely useful to know, and it comes out of a ninety-second calculation.
:::

## What the full 6-DOF set looks like

Said aloud, which is how the exercise asks for it:

- **Three translational equations** — the same force balance as before, now in three dimensions, with the air forces worked out from angles that come from the attitude instead of being handed in.
- **Three rotational equations** — Euler's equation, one line per body axis.
- **Attitude kinematics** — how $\boldsymbol{\omega}$ changes whatever you use to store attitude: Euler angles, a **[[quaternion|quaternion]]** or a direction cosine matrix. Say which, and why. Quaternions avoid the breakdown that Euler angles suffer at $\pm 90^\circ$ of pitch — which is exactly where a launch vehicle starts, pointing straight up.
- **Position kinematics** — three more, turning velocity into position.
- **Mass** — one, as before.

Count the states: three velocity components, three turn rates, three positions and one mass make ten, plus the attitude. That is fourteen with a quaternion (four numbers) and thirteen with Euler angles (three) — or thirteen and twelve if mass is left out, which is the "13-state" rigid-body model you will often hear quoted. The coupling is what matters: attitude sets $\alpha$, $\alpha$ sets the air forces and moments, the moments change $\boldsymbol{\omega}$, and $\boldsymbol{\omega}$ changes the attitude.

## Check yourself

::: check
Derive Euler's rotational equation, naming the theorem that converts between frames.
:::

::: answer
In an inertial frame, the moment about the center of mass equals the rate of change of angular momentum: $d\mathbf{H}/dt|_I = \mathbf{M}$.

The inertia matrix is constant only in body axes, so write $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ there. Convert the rate of change using the **transport theorem**: for any vector, the inertial rate of change equals the body-frame rate of change plus $\boldsymbol{\omega}\times$ the vector. So

$$
\left.\frac{d\mathbf{H}}{dt}\right|_I = \left.\frac{d\mathbf{H}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{H} = \mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}).
$$

Set that equal to $\mathbf{M}$ and you have the result. The assumption used is that $\mathbf{I}$ is constant in body axes — true for a rigid body, only approximately true for a burning rocket.
:::

::: check
Why does a gimballed engine at zero swivel produce no control moment, and what does that tell you about where control authority comes from?
:::

::: answer
Because $\mathbf{M} = \mathbf{r}\times\mathbf{T}$, and the cross product of two parallel vectors is zero. At zero swivel the thrust acts along the body axis — the same direction as the offset from the center of mass to the gimbal point — so there is no lever arm.

So all of the control moment comes from the *swivel*, through the $\sin\delta$ factor. Two things follow. Control authority is proportional to thrust, so a throttled-down engine has less of it — which matters when engines throttle down through max-Q. And it is proportional to the moment arm $r$, which changes as propellant burns and the center of mass moves. If $r$ shrinks late in the stage, authority is weakest exactly when the vehicle is lightest — and a lighter vehicle has less inertia, so it is easier to turn. Those two effects partly cancel, and an interviewer may ask which wins.
:::

::: check
A vehicle has $I = 4.0\times 10^6\,\mathrm{kg\,m^2}$ about its pitch axis, thrust $1.2\times 10^6\,\mathrm{N}$ and a gimbal point 8.0 m from the center of mass. What swivel angle gives an angular acceleration of 5 degrees per second squared?
:::

::: answer
Convert the target to radians: $5^\circ/\mathrm{s^2}$ is $5/57.2958 = 0.08727\,\mathrm{rad/s^2}$.

Moment needed: $M = I\dot\omega = 4.0\times 10^6 \times 0.08727 = 3.49\times 10^5\,\mathrm{N\,m}$.

Swivel needed: $\sin\delta = M/(rT) = 3.49\times 10^5/(8.0 \times 1.2\times 10^6) = 0.03635$, so $\delta = 2.08^\circ$.

A sanity check worth making: the answer is a couple of degrees, inside the few-degree range gimbal actuators typically provide. If it had come out at forty degrees, either the vehicle or the requirement would be wrong.
:::

::: check
In the planar model the angle of attack was an input. In 6-DOF it is not. Explain where it comes from and why that changes the character of the simulation.
:::

::: answer
It comes from the difference between attitude and flight path: $\alpha = \theta - \gamma$ in the planar case. The pitch attitude $\theta$ comes from integrating the rotational equations; the flight path angle $\gamma$ comes from integrating the translational ones.

The change in character is that the model now has feedback built into its physics. In 3-DOF you specify $\alpha(t)$ and the trajectory follows; nothing can go wrong with the attitude, because there is no attitude. In 6-DOF the control system has to *produce* the angle of attack you want by swiveling the engine, against an air moment that makes any error grow. Trajectory and attitude are linked through $\alpha$ in both directions.

That is why aerodynamic instability matters at all. In 3-DOF it does not appear. In 6-DOF it is the reason the vehicle needs a control system that reacts fast enough, not a fixed pre-planned pitch schedule.
:::

::: check
For the spinning stage in the worked example, the gyroscopic term was about 894 N m with no external torque applied. What is physically happening?
:::

::: answer
The angular momentum vector does not line up with the angular velocity vector, because the body is not equally hard to spin about every axis. With unequal inertias, $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ tilts $\mathbf{H}$ away from $\boldsymbol{\omega}$.

With no external moment, $\mathbf{H}$ stays fixed in inertial space. So the body has to move in a way that makes $\boldsymbol{\omega}$ trace a cone around $\mathbf{H}$. That motion means $\boldsymbol{\omega}$ is changing, and Euler's equation with $\mathbf{M} = 0$ says $\mathbf{I}\dot{\boldsymbol{\omega}}$ exactly balances $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$. The 894 N m is the size of that internal exchange, not a torque anyone applied.

The practical consequence for a spin-stabilized stage: a sideways rate does not die away on its own; it precesses. Removing it takes either active control or a passive **nutation damper** — a device that soaks up the wobble's energy.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$ | Euler's rotational equation in body axes |
| Transport theorem | The inertial rate of change of $\mathbf{H}$ equals its body-frame rate of change plus $\boldsymbol{\omega}\times\mathbf{H}$ |
| $\mathbf{M} = \mathbf{r}_{\text{gimbal}}\times\mathbf{T}$ | Dominant control moment; size $rT\sin\delta$ |
| $\alpha = \theta - \gamma$ | Angle of attack as attitude minus flight path angle |
| $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$ | Gyroscopic term; negligible for a booster, dominant for a spinner |
| Worked booster | $I = 5.52\times 10^7\,\mathrm{kg\,m^2}$; $2^\circ$ gimbal gives $3.49\times 10^6\,\mathrm{N\,m}$ and $3.62^\circ/\mathrm{s^2}$ |
| Worked trim | Two degrees of angle of attack at 35 kPa needs $0.044^\circ$ of gimbal |
| Full state count | 14 with a quaternion and mass (13 without mass); one fewer with Euler angles |
| Left out | $\dot{\mathbf{I}}\boldsymbol{\omega}$ and jet damping from the variable mass |

The next lesson steps back from the physics to the technique that has been running underneath all of these derivations: dimensional analysis, used as a live error check and as a way to guess the form of a result you cannot derive in the time available.

::: context angular-momentum The spinning skater
A figure skater spinning with arms out turns slowly. Pull the arms in and she spins much faster — with no push from anyone. What stayed the same is her **angular momentum**: how hard it is to spin her (her inertia) times how fast she spins. Pull mass closer to the axis and the inertia drops, so the spin rate must rise to keep the product fixed. Only an outside twist, a moment, can change angular momentum. That is exactly what $d\mathbf{H}/dt = \mathbf{M}$ says.
:::

::: context inertia-matrix Where the mass sits matters
Two sticks of equal weight: one with the weight spread evenly, one with lumps at both ends. The lumpy one is much harder to twist back and forth, because mass far from the pivot counts more — by the square of its distance. That is the **moment of inertia**. A 3D body has one about each axis, plus cross terms if it is lopsided; together they form the inertia matrix. A rocket is long and thin, so it is easy to roll about its long axis and hard to pitch or yaw.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="40" x2="320" y2="40" stroke="#1f2a44" stroke-width="10"/>
  <circle cx="180" cy="40" r="4" fill="#b4232c"/>
  <text x="180" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">even rod: I = mL²/12</text>
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="3"/>
  <circle cx="44" cy="100" r="11" fill="#1f2a44"/>
  <circle cx="316" cy="100" r="11" fill="#1f2a44"/>
  <circle cx="180" cy="100" r="4" fill="#b4232c"/>
  <text x="180" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">same mass at the ends: about 3 times harder to turn</text>
</svg>
```

Mass $m$ split into two lumps at the ends of length $L$ gives $2 \times \tfrac{m}{2}(\tfrac{L}{2})^2 = mL^2/4$ — three times the even rod's $mL^2/12$.
:::

::: context transport-theorem Watching from the merry-go-round
Sit on a spinning merry-go-round and hold a ball still in your lap. To you, the ball is not moving. To a friend standing on the ground, it is sweeping round in a circle. Both are right; they are watching from different frames. The transport theorem is the exchange rate between the two views: what the ground sees equals what you see, plus the part caused purely by your own spinning, $\boldsymbol{\omega}\times$ (the vector). Engineers use it every time a quantity is measured on a rotating vehicle but the physics is written for inertial space.
:::

::: context cross-product A multiplication that points sideways
The cross product $\mathbf{a}\times\mathbf{b}$ of two arrows is a third arrow standing at right angles to both. Its length is $|\mathbf{a}||\mathbf{b}|\sin\theta$, where $\theta$ is the angle between them — biggest when they are at right angles, zero when they are parallel. That is why pushing a door straight at its hinge does nothing: your push and the lever arm line up, so the cross product, the twist, is zero. For which way the result points, curl the fingers of your right hand from $\mathbf{a}$ toward $\mathbf{b}$; your thumb points along $\mathbf{a}\times\mathbf{b}$.
:::

::: context gyroscopic Why a spinning top does not fall over
A spinning top leans but does not fall. Instead, its tilted axis sweeps slowly around in a circle — that is **precession**. Gravity is trying to tip it, but because it is carrying a lot of angular momentum, the push changes the *direction* of the spin axis sideways instead of toppling it. The same effect keeps a rolling bicycle wheel upright. In Euler's equation this whole family of surprises lives in one term, $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$.
:::

::: context gimbal From ships' compasses to rocket engines
A **gimbal** is a pivoted mount. Sailors long used gimbals to hold a ship's compass level while the ship rolled — two rings pivoted at right angles, so the ship could tilt any way around a compass that stayed flat. A rocket engine's gimbal works the same way: two pivot axes let the nozzle swivel in pitch and yaw, pushed by two actuators. Typical swivel ranges are a few degrees each way, which is plenty, as the worked examples show.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="70" width="250" height="30" rx="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">nose</text>
  <circle cx="110" cy="85" r="6" fill="#1f2a44"/>
  <text x="110" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">CM</text>
  <circle cx="270" cy="85" r="4" fill="#b4232c"/>
  <text x="270" y="62" font-size="12" text-anchor="middle" fill="#b4232c">gimbal</text>
  <line x1="110" y1="85" x2="270" y2="85" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="190" y="120" font-size="12" text-anchor="middle" fill="#6c7a93">r</text>
  <line x1="340" y1="60" x2="283" y2="82" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="276,84.7 287.2,86.7 283.6,77.4" fill="#1d6fd1"/>
  <text x="330" y="52" font-size="12" text-anchor="middle" fill="#1d6fd1">thrust T</text>
  <path d="M 330 85 A 60 60 0 0 0 326.1 64.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="270" y1="85" x2="348" y2="85" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="334" y="76" font-size="12" fill="#b4232c">δ</text>
  <text x="180" y="155" font-size="12" text-anchor="middle" fill="#1f2a44">size of moment = r T sin δ, turning the vehicle</text>
</svg>
```

The swivel is exaggerated to about $20^\circ$ so you can see it.
:::

::: context slender-body Theory for long thin shapes
**Slender-body theory** is an approximation for shapes much longer than they are wide, like rockets and missiles. It predicts that the sideways force coefficient grows by about 2 per radian of angle of attack, based on the body's cross-section area. Real vehicles differ — the nose shape, any fins and the flow along the body all change it — so wind-tunnel tests and computer flow simulations give the numbers actually flown. For an interview estimate, the slender-body value is a sound, honest starting point, as long as you call it that.
:::

::: context quaternion Four numbers for one orientation
Describe a rocket's attitude with three angles — yaw, pitch, roll — and at pitch $\pm 90^\circ$ two of the three rotations line up and one degree of freedom goes missing. That breakdown is called **gimbal lock**, and the equations divide by zero there. A **quaternion** stores orientation as four numbers with no such hole. William Rowan Hamilton invented quaternions in 1843 and carved the formula into a Dublin bridge. Much modern spacecraft flight software carries attitude as a quaternion; later GNC lessons use them in earnest.
:::
