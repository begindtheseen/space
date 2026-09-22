---
id: l04-planar-powered-flight
title: "Planar powered flight in three degrees of freedom"
minutes: 18
covers:
  - planar 3-DOF powered flight: the velocity, flight-path-angle, position and mass equations
---

This is the derivation the module's first exercise puts a timer on: the planar three-degree-of-freedom powered-flight equations, at a whiteboard, in under ten minutes, aloud, with a dimensional check at the end. It is worth knowing why this particular set is the one chosen. It is short enough to finish inside an interview, it cannot be produced by recall alone because the sign conventions have to be reasoned through, and every term in it corresponds to something physical you can be asked about.

The previous lesson treated the trajectory as one-dimensional, which is why it could not represent gravity properly. Here the vehicle moves in a vertical plane and the force balance is resolved along and across the velocity vector. That single choice — velocity-aligned axes rather than ground-fixed axes — is what makes the result compact, and explaining why you made it is worth thirty seconds of the ten minutes.

The output is five scalar equations in five states: speed, flight path angle, downrange distance, altitude and mass. Two of them are dynamics, two are kinematics, and one is bookkeeping. Knowing which is which lets you narrate the derivation as a structure rather than as six lines of algebra.

## The model, stated first

Write these on the board before anything else.

- **Flat, non-rotating Earth.** Gravity is constant in magnitude and direction. Valid for the first few minutes of ascent; wrong for anything that circles the planet.
- **Point mass.** The vehicle has no attitude of its own; the angle of attack $\alpha$ is prescribed rather than being the result of rotational dynamics. Adding that back is the 6-DOF extension in lesson 6.
- **Motion confined to a vertical plane.** No yaw, no crossrange, no out-of-plane wind.
- **No wind.** Airspeed equals inertial speed, so the aerodynamic angles are measured against the inertial velocity.
- **Thrust along the body axis**, at angle $\alpha$ to the velocity vector.

The states, each with units:

| Symbol | Meaning | Units |
| --- | --- | --- |
| $v$ | Speed, magnitude of the velocity | $\mathrm{m/s}$ |
| $\gamma$ | Flight path angle, measured **from the local horizontal, positive up** | rad |
| $x$ | Downrange distance | m |
| $h$ | Altitude | m |
| $m$ | Vehicle mass | kg |

Say the definition of $\gamma$ out loud and write it down. Half the sign errors in this derivation come from measuring it from the vertical instead, and an interviewer cannot tell which convention you meant unless you say so.

## Why velocity-aligned axes

Put the velocity vector along a unit vector $\hat{\mathbf{t}}$, and let $\hat{\mathbf{n}}$ be perpendicular to it in the plane, rotated ninety degrees in the direction of increasing $\gamma$. In ground axes with $x$ horizontal and $h$ vertical,

$$
\hat{\mathbf{t}} = \begin{pmatrix}\cos\gamma\\ \sin\gamma\end{pmatrix},
\qquad
\hat{\mathbf{n}} = \begin{pmatrix}-\sin\gamma\\ \cos\gamma\end{pmatrix}.
$$

The velocity is $\mathbf{v} = v\hat{\mathbf{t}}$ by construction. Differentiating, and using $\dot{\hat{\mathbf{t}}} = \dot\gamma\,\hat{\mathbf{n}}$ — a unit vector can only rotate, so its derivative is perpendicular to it and proportional to the turn rate —

$$
\mathbf{a} = \dot v\,\hat{\mathbf{t}} + v\dot\gamma\,\hat{\mathbf{n}}.
$$

That is the whole reason for this choice of axes. The acceleration splits cleanly into a **speed change** along the path and a **turn** across it, and the aerodynamic forces are naturally defined in exactly those directions: drag opposes $\hat{\mathbf{t}}$, lift acts along $\hat{\mathbf{n}}$. In ground axes every force would carry a $\cos\gamma$ and a $\sin\gamma$ and the equations would be twice as long.

::: warning $v\dot\gamma$, not $\dot\gamma$
The normal acceleration of a body turning at rate $\dot\gamma$ while moving at speed $v$ is $v\dot\gamma$ — the same $v^2/R$ you know from circular motion, written with $\dot\gamma = v/R$. Writing $m\dot\gamma$ on the left of the second equation gives units of $\mathrm{kg/s}$ where newtons are required. It is the most common slip in this derivation, and a units check catches it instantly.
:::

## Resolving the forces

Four forces act: thrust $T$, drag $D$, lift $L$, weight $mg$.

- **Thrust** acts along the body axis, which is at angle $\alpha$ to the velocity, so it contributes $T\cos\alpha$ along $\hat{\mathbf{t}}$ and $T\sin\alpha$ along $\hat{\mathbf{n}}$.
- **Drag** is defined as opposing the velocity: $-D\,\hat{\mathbf{t}}$.
- **Lift** is defined perpendicular to the velocity: $+L\,\hat{\mathbf{n}}$.
- **Weight** is $(0, -mg)$ in ground axes. Its component along $\hat{\mathbf{t}}$ is the dot product with $(\cos\gamma, \sin\gamma)$, which is $-mg\sin\gamma$; along $\hat{\mathbf{n}}$ it is $-mg\cos\gamma$.

Equating $m\mathbf{a}$ to the sum, component by component, gives the two dynamic equations directly.

::: key
Planar 3-DOF powered flight over a flat, non-rotating Earth:

$$
\begin{aligned}
m\dot v &= T\cos\alpha - D - mg\sin\gamma,\\
m v\dot\gamma &= T\sin\alpha + L - mg\cos\gamma,\\
\dot x &= v\cos\gamma,\\
\dot h &= v\sin\gamma,\\
\dot m &= -\frac{T}{I_{sp}g_0}.
\end{aligned}
$$
:::

The last three need almost no derivation and should be said quickly. The two kinematic equations are the components of $\mathbf{v} = v\hat{\mathbf{t}}$ written out. The mass equation is the definition of specific impulse rearranged: $T = \dot m_e c = \dot m_e I_{sp}g_0$, and $\dot m = -\dot m_e$.

## The dimensional check, done out loud

Fifteen seconds, and it is part of the deliverable.

- $m\dot v$: $\mathrm{kg} \times \mathrm{m/s^2}$ gives newtons, and every term on the right is a force. ✓
- $mv\dot\gamma$: $\mathrm{kg} \times \mathrm{m/s} \times \mathrm{s^{-1}}$ gives newtons, since radians are dimensionless. ✓
- $\dot x$, $\dot h$: metres per second on both sides. ✓
- $\dot m$: newtons divided by $\mathrm{s} \times \mathrm{m/s^2}$, which is $\mathrm{N\,s/m} = \mathrm{kg/s}$. ✓

The fourth is the one worth saying slowly, because $I_{sp}g_0$ looks as though it should be an acceleration and is in fact a velocity. Getting that right in front of someone is a small, specific demonstration that you are carrying units rather than symbols.

::: example Evaluating the five derivatives at one instant
**State.** A vehicle at $m = 3.00 \times 10^5\,\mathrm{kg}$, $v = 500\,\mathrm{m/s}$, $\gamma = 45^\circ$, altitude 20 km. **Inputs.** $T = 5.00 \times 10^6\,\mathrm{N}$, $\alpha = 0$, $D = 2.00 \times 10^5\,\mathrm{N}$, $L = 0$, $I_{sp} = 300\,\mathrm{s}$.

**Speed.** $\dot v = (T - D)/m - g\sin\gamma$. The thrust-minus-drag term is $(5.0\times 10^6 - 2.0\times 10^5)/3.0\times 10^5 = 16.0\,\mathrm{m/s^2}$ and the gravity term is $9.80665 \times 0.70711 = 6.934\,\mathrm{m/s^2}$, so $16.0 - 6.934 = 9.066\,\mathrm{m/s^2}$.

**Flight path angle.** With $\alpha = 0$ and $L = 0$ the second equation reduces to $\dot\gamma = -(g/v)\cos\gamma$, giving $-(9.80665/500) \times 0.70711 = -0.01387\,\mathrm{rad/s}$, which is $-0.795$ degrees per second. Negative: the vehicle is pitching over, as it must be with nothing but gravity acting across the path.

**Position.** $\dot h = 500 \times 0.70711 = 353.6\,\mathrm{m/s}$, and $\dot x$ is the same, because the path is at forty-five degrees.

**Mass.** $\dot m = -T/(I_{sp}g_0)$, and $5.00\times 10^6/(300 \times 9.80665) = 1699.5$, so $\dot m = -1699.5\,\mathrm{kg/s}$ — about 1.7 tonnes per second.

**Sanity checks.** Thrust-to-weight is $5.00\times 10^6/(3.00\times 10^5 \times 9.80665) = 1.70$, plausible mid-first-stage. A pitch-over rate of 0.8 degrees per second means about ninety seconds to swing from forty-five degrees to horizontal, the right order for the back half of a first stage. And 1.7 t/s of propellant for 5 MN of thrust is consistent with $I_{sp} = 300\,\mathrm{s}$, because those two numbers are the same statement.
:::

::: example How much of the turning does gravity do?
The second equation has two competing terms once lift is neglected: $T\sin\alpha$ turns the vehicle by pointing the engine, and $-mg\cos\gamma$ turns it by falling.

Using the same state, and now allowing a two-degree angle of attack,

$$
T\sin\alpha = 5.00\times 10^6 \times 0.034899 = 1.745\times 10^5\,\mathrm{N},
$$

against the gravity term

$$
mg\cos\gamma = 3.00\times 10^5 \times 9.80665 \times 0.70711 = 2.080\times 10^6\,\mathrm{N}.
$$

The ratio is $174.5/2080 = 0.0839$: a two-degree angle of attack contributes about eight per cent of what gravity is contributing.

**What to do with that.** It is the quantitative version of the statement that a launch vehicle steers mostly by letting gravity turn it. It also shows why angle of attack can be used freely outside the atmosphere — in vacuum $T\sin\alpha$ is the only steering term left on that line, because $L$ and $D$ have both gone to zero.

**And a caution.** Two degrees of angle of attack at high dynamic pressure produces a large aerodynamic side load, which is a structural problem rather than a guidance one. The next lesson is about flying with $\alpha = 0$ precisely to avoid it.
:::

::: example Integrating the set for ten seconds
The equations are five coupled first-order ODEs, so integrating them is mechanical. Explicit Euler at a millisecond step is more than accurate enough to show the behaviour.

```python
import numpy as np

g0, Isp, T, D = 9.80665, 300.0, 5.0e6, 2.0e5
m, v, gam, h, x = 3.0e5, 500.0, np.radians(45.0), 20_000.0, 0.0
dt = 1e-3

for _ in range(10_000):                       # 10 seconds
    vdot = (T - D) / m - g0 * np.sin(gam)
    gdot = -(g0 / v) * np.cos(gam)            # alpha = 0, L = 0
    v   += vdot * dt
    gam += gdot * dt
    h   += v * np.sin(gam) * dt
    x   += v * np.cos(gam) * dt
    m   -= T / (Isp * g0) * dt

# v = 600.3 m/s, gamma = 37.28 deg, h = 23594 m, x = 4138 m, m = 283005 kg
```

**Reading the result.** Speed rose by 100.3 m/s in ten seconds, an average of $10.0\,\mathrm{m/s^2}$ — slightly more than the instantaneous $9.066\,\mathrm{m/s^2}$ computed above, because the vehicle got lighter and its flight path angle flattened, weakening the gravity term. The flight path angle fell by 7.72 degrees, and the mass fell by 17.0 tonnes, which is $1699.5 \times 10 = 16995\,\mathrm{kg}$ as the mass equation requires.

**The check that matters.** The altitude gain was 3594 m in ten seconds, an average vertical speed of $359\,\mathrm{m/s}$, which sits above the initial $353.6\,\mathrm{m/s}$ because the speed grew faster than the path flattened. Nothing is inconsistent, which is what a check is for.
:::

## The ten-minute board plan

The exercise asks for this under a timer. A workable allocation:

1. **0:00–1:30** — Assumptions and the state list, with $\gamma$ defined in words.
2. **1:30–3:00** — The sketch: velocity vector, $\hat{\mathbf{t}}$ and $\hat{\mathbf{n}}$, the four forces, the angles $\alpha$ and $\gamma$ marked.
3. **3:00–4:30** — $\mathbf{a} = \dot v\hat{\mathbf{t}} + v\dot\gamma\hat{\mathbf{n}}$, said as "speed change along, turn across".
4. **4:30–7:00** — Resolve the four forces onto the two axes and write the two dynamic equations.
5. **7:00–8:30** — Kinematics and the mass equation.
6. **8:30–9:30** — Dimensional check on all five.
7. **9:30–10:00** — Name what was neglected: Earth rotation and curvature, wind, out-of-plane motion, and the vehicle's own rotational dynamics.

The last thirty seconds is not padding. Listing what the model excludes is the natural bridge to the two follow-up questions this derivation invites — "what changes over a round rotating Earth" and "where does attitude come in" — and the second of those is lesson 6.

## Check yourself

::: check
Why is the normal-direction equation $mv\dot\gamma = \dots$ rather than $m\dot\gamma = \dots$, and what check would catch the error in three seconds?
:::

::: answer
Because $\dot\gamma$ is an angular rate and the equation is a force balance. The acceleration perpendicular to a curved path is $v\dot\gamma$ — the standard centripetal acceleration $v^2/R$ with the turn rate written as $\dot\gamma = v/R$ — so the inertia term is $mv\dot\gamma$.

The check is dimensional. $m\dot\gamma$ has units of kilograms per second, a mass flow rate, while every term on the right-hand side is a force in newtons. $mv\dot\gamma$ gives $\mathrm{kg}\times\mathrm{m/s}\times\mathrm{s^{-1}}$, which is a newton. Say it out loud as you write the line and the error cannot survive.
:::

::: check
A vehicle is flying at $\gamma = 0$ — horizontal — with zero angle of attack and no lift. What is $\dot\gamma$, and what does that mean physically?
:::

::: answer
With $\alpha = 0$ and $L = 0$ the second equation gives $\dot\gamma = -(g/v)\cos\gamma$, and at $\gamma = 0$ that is $-g/v$, the most negative it can be at that speed.

Physically: flying horizontally at modest speed over a flat Earth, the vehicle immediately starts to fall, because nothing is holding it up. At $v = 2000\,\mathrm{m/s}$ the rate is $-9.80665/2000 = -0.004903\,\mathrm{rad/s}$, about $-0.281$ degrees per second.

The follow-up worth anticipating: on a round Earth that term becomes $-(g/v - v/r)\cos\gamma$, and it vanishes when $v^2 = gr$ — which is orbital velocity. The flat-Earth model cannot represent orbit at all, and saying so unprompted is a strong close.
:::

::: check
Give the five equations, then state which of them would change if the vehicle were flying in vacuum and which would not.
:::

::: answer
The set is

$$
\begin{aligned}
m\dot v &= T\cos\alpha - D - mg\sin\gamma,\\
m v\dot\gamma &= T\sin\alpha + L - mg\cos\gamma,\\
\dot x &= v\cos\gamma, \qquad \dot h = v\sin\gamma, \qquad \dot m = -T/(I_{sp}g_0).
\end{aligned}
$$

In vacuum, $D$ and $L$ both go to zero, so the two dynamic equations lose one term each. Nothing else changes form — but two numbers do. $T$ rises, by about eleven per cent for the engine of lesson 2, because the pressure term $(p_e-p_a)A_e$ grows as $p_a$ falls; and $I_{sp}$ rises for the same reason, so the mass equation's denominator grows too.

The kinematic equations are unaffected: they are geometry and know nothing about air.
:::

::: check
An interviewer asks what you would have to add to use these equations for a launch to orbit rather than for the first two minutes of ascent. Name three things.
:::

::: answer
**Earth curvature.** Replace $\dot h = v\sin\gamma$ with a radial equation and add the $v^2/r$ term to the normal-direction equation, so that $\dot\gamma \to 0$ at orbital speed rather than the vehicle continuing to pitch down.

**Varying gravity.** $g = \mu/r^2$ rather than a constant. At 400 km altitude $g$ is down about twelve per cent from its surface value, which is not negligible over a whole ascent.

**Earth rotation.** The launch site is already moving eastwards — about $465\,\mathrm{m/s}$ at the equator, falling with the cosine of latitude — so the inertial and Earth-relative velocities differ, and the aerodynamic forces depend on the Earth-relative one while the dynamics are inertial.

A fourth, if pressed: out-of-plane motion, needed for any launch whose azimuth changes or that has a plane-targeting requirement.
:::

::: check
In the worked example, $\dot m = -1699.5\,\mathrm{kg/s}$ while $T = 5.00\times 10^6\,\mathrm{N}$. Show that these two numbers carry no independent information.
:::

::: answer
They are the same statement written twice. The mass equation is $\dot m = -T/(I_{sp}g_0)$, so fixing any two of $\dot m$, $T$ and $I_{sp}$ fixes the third: $5.00\times 10^6/(300 \times 9.80665) = 1699.5$.

The useful consequence in an interview is that you can be handed any two and produce the third, and you should say which two you were given. A common trap is to be handed a thrust and a propellant flow rate that are inconsistent with the quoted $I_{sp}$ — usually because one is a sea-level figure and the other a vacuum figure — and noticing that inconsistency is worth more than carrying the arithmetic through.
:::

## Summary

| Equation | What it says | Units |
| --- | --- | --- |
| $m\dot v = T\cos\alpha - D - mg\sin\gamma$ | Speed change along the path | N |
| $mv\dot\gamma = T\sin\alpha + L - mg\cos\gamma$ | Turning across the path | N |
| $\dot x = v\cos\gamma$ | Downrange kinematics | m/s |
| $\dot h = v\sin\gamma$ | Altitude kinematics | m/s |
| $\dot m = -T/(I_{sp}g_0)$ | Propellant bookkeeping | kg/s |
| $\hat{\mathbf{t}}, \hat{\mathbf{n}}$ | Along- and across-velocity unit vectors | — |
| $\mathbf{a} = \dot v\hat{\mathbf{t}} + v\dot\gamma\hat{\mathbf{n}}$ | Acceleration in velocity-aligned axes | $\mathrm{m/s^2}$ |
| $\gamma$ | Flight path angle from the local horizontal, positive up | rad |
| Neglected | Earth rotation and curvature, wind, out-of-plane motion, attitude dynamics | — |

The next lesson takes the special case $\alpha = 0$ — the gravity turn — which collapses the second equation to a single line and explains why real launch vehicles fly it.
