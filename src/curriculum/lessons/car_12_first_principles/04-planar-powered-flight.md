---
id: l04-planar-powered-flight
title: "Planar powered flight in three degrees of freedom"
minutes: 21
covers:
  - planar 3-DOF powered flight: the velocity, flight-path-angle, position and mass equations
---

Throw a ball to a friend across a field. It does two things at once. It changes **speed** — fast off your hand, slower at the top, faster again on the way down. And it changes **direction** — climbing at first, level for an instant, then falling. Everything a rocket does on its way up can be described the same way: how fast it is going, which way it is heading, where it is, and (unlike the ball) how much it still weighs, because it is burning its own fuel.

This lesson writes those four ideas down as five short equations. Engineers call them the **planar three-degree-of-freedom powered-flight equations** — "planar" because the rocket stays in one flat, vertical slice of the sky, and "[[three degrees of freedom|degrees-of-freedom]]" (said "three-D-O-F") because the vehicle can move in two directions and change one angle. They are the equations the module's first exercise asks you to derive at a whiteboard, aloud, in under ten minutes, with a units check at the end.

Why this set? It is short enough to finish inside an interview. It cannot be recited from memory, because the plus and minus signs have to be reasoned out. And every term is something physical an interviewer can poke at. The last lesson treated the flight as a straight line, which is why it could not handle gravity properly. Here the rocket moves in a plane, and the one smart choice that keeps the answer short is to measure everything **along** and **across** the direction of travel instead of along the ground.

The result is five equations for five quantities: speed, heading angle, distance downrange, altitude and mass. Two equations are **dynamics** (forces make things change), two are **kinematics** (plain geometry of motion), and one is **bookkeeping** (fuel going out). Knowing which is which lets you narrate the derivation as a structure, not as a pile of algebra.

## Say the model out loud first

Before any equation, a good engineer tells the listener what world the equations live in. These are the **assumptions** — the simplifications you choose on purpose. Write them on the board first.

- **Flat, non-rotating Earth.** Gravity has the same strength and points the same way everywhere. That is fine for the first few minutes of a launch and wrong for anything that goes around the planet.
- **Point mass.** The rocket is treated as a dot with no orientation of its own. The **angle of attack**, $\alpha$ (the Greek letter alpha) — the angle between where the nose points and where the rocket is actually going — is handed in from outside rather than worked out. Putting the rocket's own turning back in is the 6-DOF extension in lesson 6.
- **Motion in one vertical plane.** No turning left or right, no sideways drift, no crosswind.
- **No wind.** The rocket's speed through the air equals its speed over the ground, so the air angles are measured against the true velocity.
- **Thrust along the body axis.** The engine pushes straight out the back, so the thrust makes the angle $\alpha$ with the velocity.

The five **states** — the numbers that describe the rocket at any instant — each with units:

| Symbol | Meaning | Units |
| --- | --- | --- |
| $v$ | Speed, the size of the velocity | $\mathrm{m/s}$ |
| $\gamma$ | Flight path angle, measured **from the local horizontal, positive up** | rad |
| $x$ | Downrange distance | m |
| $h$ | Altitude | m |
| $m$ | Vehicle mass | kg |

The **[[flight path angle|flight-path-angle]]**, $\gamma$ (read "gamma"), is the angle between the rocket's direction of travel and the flat ground. Straight up is $90^\circ$; flying level is $0$. Say this definition out loud and write it down. Half the sign errors in this derivation come from measuring $\gamma$ from the vertical instead, and an interviewer cannot tell which you meant unless you say so.

A dot over a letter means "how fast this is changing each second". Read $\dot v$ as "v dot": it is the rate of change of speed, in $\mathrm{m/s}$ per second. Read $\dot\gamma$ as "gamma dot", the turning rate.

## Why measure along and across the path

Picture yourself riding in the rocket with two arrows painted on it. One points exactly the way you are moving. The other points sideways from that, at a right angle, toward "more upward". Every push you feel is either along the first arrow (speeding you up or slowing you down) or along the second (bending your path). That split is the whole trick.

The first arrow is the **[[unit vector|unit-vector]]** $\hat{\mathbf{t}}$ ("t hat", t for tangent) — an arrow of length one that only carries a direction. The second is $\hat{\mathbf{n}}$ ("n hat", n for normal, which here means perpendicular), turned ninety degrees from $\hat{\mathbf{t}}$ in the direction of increasing $\gamma$. In ground axes, with $x$ across the ground and $h$ straight up,

$$
\hat{\mathbf{t}} = \begin{pmatrix}\cos\gamma\\ \sin\gamma\end{pmatrix},
\qquad
\hat{\mathbf{n}} = \begin{pmatrix}-\sin\gamma\\ \cos\gamma\end{pmatrix}.
$$

The velocity is $\mathbf{v} = v\hat{\mathbf{t}}$, because $\hat{\mathbf{t}}$ was chosen to point along it. Now take the rate of change of both parts. The speed $v$ changes at rate $\dot v$. The arrow $\hat{\mathbf{t}}$ always has length one, so it cannot grow or shrink — it can only swing round. When it swings, its tip moves sideways, along $\hat{\mathbf{n}}$, at the turning rate: $\dot{\hat{\mathbf{t}}} = \dot\gamma\,\hat{\mathbf{n}}$. Put the two together and the acceleration is

$$
\mathbf{a} = \dot v\,\hat{\mathbf{t}} + v\dot\gamma\,\hat{\mathbf{n}}.
$$

Say it in words: **speed change along the path, turn across it**. And the air forces are defined in exactly those two directions — drag pushes back along $\hat{\mathbf{t}}$, lift pushes along $\hat{\mathbf{n}}$. In ground axes every force would carry a $\cos\gamma$ and a $\sin\gamma$ and the equations would be twice as long.

::: note Why the turning arrow moves sideways
Differentiate $\hat{\mathbf{t}} = (\cos\gamma, \sin\gamma)$ with the chain rule: each component picks up a factor $\dot\gamma$, giving $\dot\gamma(-\sin\gamma, \cos\gamma)$. That second vector is exactly $\hat{\mathbf{n}}$. Then the product rule on $\mathbf{v} = v\hat{\mathbf{t}}$ gives $\dot v\,\hat{\mathbf{t}} + v\,\dot{\hat{\mathbf{t}}} = \dot v\,\hat{\mathbf{t}} + v\dot\gamma\,\hat{\mathbf{n}}$. Nothing more is hiding in it.
:::

::: warning $v\dot\gamma$, not $\dot\gamma$
The sideways acceleration of something turning at rate $\dot\gamma$ while moving at speed $v$ is $v\dot\gamma$. It is the same **[[centripetal acceleration|centripetal]]** $v^2/R$ you may know from circular motion, with the turn rate written as $\dot\gamma = v/R$. If you write $m\dot\gamma$ on the left of the second equation, its units come out as $\mathrm{kg/s}$ where newtons are needed. It is the most common slip in this derivation, and a units check catches it instantly.
:::

## Sorting the four forces

Four forces act on the rocket: thrust $T$, drag $D$, lift $L$ and weight $mg$. Take each one and ask how much of it points along the path and how much across.

- **Thrust** points along the body, at angle $\alpha$ to the velocity. So $T\cos\alpha$ of it is along $\hat{\mathbf{t}}$ and $T\sin\alpha$ is along $\hat{\mathbf{n}}$.
- **Drag** — the air's backward push — is defined as opposing the velocity: $-D\,\hat{\mathbf{t}}$.
- **Lift** — the air's sideways push — is defined as perpendicular to the velocity: $+L\,\hat{\mathbf{n}}$.
- **Weight** is $(0, -mg)$ in ground axes: straight down. To find how much of it lies along $\hat{\mathbf{t}}$, take the dot product with $(\cos\gamma, \sin\gamma)$: that is $0 \times \cos\gamma + (-mg)\sin\gamma = -mg\sin\gamma$. Along $\hat{\mathbf{n}}$ it is $-mg\cos\gamma$.

A quick check on the weight: flying straight up ($\gamma = 90^\circ$), all of the weight pulls back along the path ($-mg\sin 90^\circ = -mg$) and none of it bends the path. Flying level ($\gamma = 0$), none of it slows you and all of it pulls the path downward. That matches what a thrown ball does.

Now set mass times acceleration equal to the sum of the forces, one direction at a time. The along-path parts give the first equation and the across-path parts give the second.

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

The last three need almost no derivation, so say them quickly. The two **kinematic** equations are the two pieces of $\mathbf{v} = v\hat{\mathbf{t}}$ written out: how fast you move across the ground and how fast you climb. The **mass** equation is the definition of **[[specific impulse|specific-impulse]]**, $I_{sp}$ (said "I-S-P"), rearranged. Thrust equals propellant flow times effective exhaust speed, $T = \dot m_e c = \dot m_e I_{sp}g_0$, where $\dot m_e$ is the mass leaving through the nozzle each second and $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity. The rocket loses exactly what the nozzle throws out, so $\dot m = -\dot m_e$.

## The units check, done out loud

This takes fifteen seconds and it is part of the answer, not an extra.

- $m\dot v$: $\mathrm{kg} \times \mathrm{m/s^2}$ is a newton, and every term on the right is a force. Good.
- $mv\dot\gamma$: $\mathrm{kg} \times \mathrm{m/s} \times \mathrm{s^{-1}}$ is a newton, because [[radians have no unit|radians]]. Good.
- $\dot x$, $\dot h$: meters per second on both sides. Good.
- $\dot m$: newtons divided by $\mathrm{s} \times \mathrm{m/s^2}$, which is $\mathrm{N\,s/m} = \mathrm{kg/s}$. Good.

Say the fourth one slowly. $I_{sp}g_0$ looks as if it should be an acceleration, because $g_0$ is one — but $I_{sp}$ is in seconds, so the product is a velocity. Getting that right in front of someone shows you are carrying units, not only symbols.

::: example Evaluating the five derivatives at one instant
**State.** A vehicle at $m = 3.00 \times 10^5\,\mathrm{kg}$, $v = 500\,\mathrm{m/s}$, $\gamma = 45^\circ$, altitude 20 km. **Inputs.** $T = 5.00 \times 10^6\,\mathrm{N}$, $\alpha = 0$, $D = 2.00 \times 10^5\,\mathrm{N}$, $L = 0$, $I_{sp} = 300\,\mathrm{s}$.

**Speed.** Divide the first equation by $m$: $\dot v = (T - D)/m - g\sin\gamma$. The thrust-minus-drag part is $(5.0\times 10^6 - 2.0\times 10^5)/3.0\times 10^5 = 16.0\,\mathrm{m/s^2}$. The gravity part is $9.80665 \times 0.70711 = 6.934\,\mathrm{m/s^2}$. Subtract: $16.0 - 6.934 = 9.066\,\mathrm{m/s^2}$.

**Flight path angle.** With $\alpha = 0$ and $L = 0$, the second equation loses its first two terms. Divide by $mv$ and it becomes $\dot\gamma = -(g/v)\cos\gamma = -(9.80665/500) \times 0.70711 = -0.01387\,\mathrm{rad/s}$. Multiply by $180/\pi$: $-0.795$ degrees per second. It is negative — the vehicle is pitching over, as it must with nothing but gravity acting across the path.

**Position.** $\dot h = 500 \times 0.70711 = 353.6\,\mathrm{m/s}$, and $\dot x$ is the same, because the path is at forty-five degrees.

**Mass.** $\dot m = -T/(I_{sp}g_0)$, and $5.00\times 10^6/(300 \times 9.80665) = 1699.5$, so $\dot m = -1699.5\,\mathrm{kg/s}$ — about 1.7 metric tons every second.

**Sanity checks.** Thrust-to-weight is $5.00\times 10^6/(3.00\times 10^5 \times 9.80665) = 1.70$, plausible partway through a first stage. At $0.8$ degrees per second, swinging from forty-five degrees to level would take about $45/0.795 \approx 57$ seconds if the rate held steady — around a minute, the right order for the back half of a first stage. And 1.7 metric tons per second of propellant for 5 MN of thrust is consistent with $I_{sp} = 300\,\mathrm{s}$, because those two numbers are the same statement.
:::

::: example How much of the turning does gravity do?
Once lift is neglected, the second equation has two terms that can turn the rocket. $T\sin\alpha$ turns it by pointing the engine. $-mg\cos\gamma$ turns it by falling.

Use the same state, but now allow a two-degree angle of attack. The engine's turning force is

$$
T\sin\alpha = 5.00\times 10^6 \times 0.034899 = 1.745\times 10^5\,\mathrm{N},
$$

and gravity's is

$$
mg\cos\gamma = 3.00\times 10^5 \times 9.80665 \times 0.70711 = 2.080\times 10^6\,\mathrm{N}.
$$

Divide one by the other: $174.5/2080 = 0.0839$. A two-degree angle of attack adds about eight percent of what gravity is already doing.

**What to do with that.** It puts a number on the statement that a launch vehicle steers mostly by letting gravity turn it. It also shows why angle of attack can be used freely above the atmosphere. In vacuum $L$ and $D$ are both zero, so $T\sin\alpha$ is the only steering term left in that equation.

**A caution.** Two degrees of angle of attack in thick, fast-moving air puts a large sideways load on the vehicle. That is a structural problem, not a guidance one. The next lesson is about flying with $\alpha = 0$ precisely to avoid it.
:::

::: example Integrating the set for ten seconds
The five equations are **coupled first-order ordinary differential equations** — rules that say how fast each state changes, where each rule uses the other states. To follow the rocket forward in time, you can take tiny steps: work out every rate, nudge every state by rate × step, and repeat. That is **[[explicit Euler|euler-step]]** integration, and at a millisecond step it is more than accurate enough here.

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

**Reading the result.** Speed rose by 100.3 m/s in ten seconds, an average of $10.0\,\mathrm{m/s^2}$. That is a bit more than the $9.066\,\mathrm{m/s^2}$ from the first example, because the vehicle got lighter and its path flattened, which weakens gravity's pull along the path. The flight path angle fell by 7.72 degrees. The mass fell by 17.0 metric tons, which is $1699.5 \times 10 = 16\,995\,\mathrm{kg}$, as the mass equation requires.

**The check that matters.** Altitude rose 3594 m in ten seconds, an average climb rate of $359\,\mathrm{m/s}$. That is above the starting $353.6\,\mathrm{m/s}$, because the speed grew faster than the path flattened. Nothing is inconsistent, which is what a check is for.
:::

## The ten-minute board plan

The exercise puts this under a timer. A plan that works:

1. **0:00–1:30** — Assumptions and the state list, with $\gamma$ defined in words.
2. **1:30–3:00** — The sketch: velocity arrow, $\hat{\mathbf{t}}$ and $\hat{\mathbf{n}}$, the four forces, the angles $\alpha$ and $\gamma$ marked.
3. **3:00–4:30** — $\mathbf{a} = \dot v\hat{\mathbf{t}} + v\dot\gamma\hat{\mathbf{n}}$, said as "speed change along, turn across".
4. **4:30–7:00** — Split the four forces into the two directions and write the two dynamic equations.
5. **7:00–8:30** — Kinematics and the mass equation.
6. **8:30–9:30** — Units check on all five.
7. **9:30–10:00** — Name what was left out: Earth's rotation and curvature, wind, sideways motion, and the vehicle's own rotation.

The last thirty seconds is not padding. Listing what the model leaves out is the natural bridge to the two follow-up questions this derivation invites — "what changes over a round, spinning Earth?" and "where does attitude come in?" — and the second of those is lesson 6.

## Check yourself

::: check
Why is the across-path equation $mv\dot\gamma = \dots$ rather than $m\dot\gamma = \dots$, and what check would catch the error in three seconds?
:::

::: answer
Because $\dot\gamma$ is a turning rate and the equation is a balance of forces. The acceleration across a curved path is $v\dot\gamma$ — the usual centripetal acceleration $v^2/R$ with the turn rate written as $\dot\gamma = v/R$ — so the mass-times-acceleration term is $mv\dot\gamma$.

The check is units. $m\dot\gamma$ is in kilograms per second, a mass flow rate, while every term on the right is a force in newtons. $mv\dot\gamma$ gives $\mathrm{kg}\times\mathrm{m/s}\times\mathrm{s^{-1}}$, which is a newton. Say it out loud as you write the line and the error cannot survive.
:::

::: check
A vehicle is flying at $\gamma = 0$ — level — with zero angle of attack and no lift. What is $\dot\gamma$, and what does that mean physically?
:::

::: answer
With $\alpha = 0$ and $L = 0$ the second equation gives $\dot\gamma = -(g/v)\cos\gamma$. At $\gamma = 0$, $\cos\gamma = 1$, so $\dot\gamma = -g/v$ — the most negative it can be at that speed.

Physically: flying level over a flat Earth, the vehicle immediately starts to fall, because nothing is holding it up. At $v = 2000\,\mathrm{m/s}$ the rate is $-9.80665/2000 = -0.004903\,\mathrm{rad/s}$, about $-0.281$ degrees per second.

The follow-up worth expecting: on a round Earth that term becomes $-(g/v - v/r)\cos\gamma$, where $r$ is the distance from Earth's center, and it vanishes when $v^2 = gr$ — which is **[[orbital speed|orbit-bridge]]**. The flat-Earth model cannot represent an orbit at all, and saying so without being asked is a strong close.
:::

::: check
Give the five equations, then say which of them would change if the vehicle were flying in vacuum and which would not.
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

In vacuum, $D$ and $L$ both go to zero, so the two dynamic equations each lose one term. Nothing else changes form — but two numbers do. $T$ rises, by about eleven percent for the engine of lesson 2, because the pressure term $(p_e-p_a)A_e$ grows as the outside pressure $p_a$ falls. $I_{sp}$ rises for the same reason, so the bottom of the mass equation grows too.

The kinematic equations are unaffected. They are geometry and know nothing about air.
:::

::: check
An interviewer asks what you would add to use these equations for a whole launch to orbit, not only the first two minutes. Name three things.
:::

::: answer
**Earth's curvature.** Replace $\dot h = v\sin\gamma$ with an equation for distance from Earth's center, and add the $v^2/r$ term to the across-path equation, so that $\dot\gamma \to 0$ at orbital speed instead of the vehicle pitching down forever.

**Gravity that weakens with height.** Use $g = \mu/r^2$ instead of a constant, where $\mu$ (read "mew") is Earth's gravitational parameter. At 400 km altitude $g$ is about twelve percent lower than at the surface, which is not negligible over a whole ascent.

**Earth's rotation.** The launch pad is already moving east — about $465\,\mathrm{m/s}$ at the equator, less at higher latitudes in proportion to the cosine of latitude. So the speed relative to the stars and the speed relative to the ground differ. The air forces depend on the ground-relative one, while Newton's law uses the star-fixed one.

A fourth, if pressed: sideways (out-of-plane) motion, needed for any launch whose heading changes or that must reach a particular orbital plane.
:::

::: check
In the first worked example, $\dot m = -1699.5\,\mathrm{kg/s}$ while $T = 5.00\times 10^6\,\mathrm{N}$. Show that these two numbers carry no independent information.
:::

::: answer
They are the same statement written twice. The mass equation is $\dot m = -T/(I_{sp}g_0)$, so once you fix any two of $\dot m$, $T$ and $I_{sp}$, the third is decided: $5.00\times 10^6/(300 \times 9.80665) = 1699.5$.

The useful consequence in an interview: you can be handed any two and produce the third, and you should say which two you were given. A common trap is to be handed a thrust and a propellant flow that do not match the quoted $I_{sp}$ — usually because one is a sea-level figure and the other a vacuum figure. Noticing that mismatch is worth more than carrying the arithmetic through.
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
| Left out | Earth's rotation and curvature, wind, out-of-plane motion, attitude dynamics | — |

The next lesson takes the special case $\alpha = 0$ — the gravity turn — which shrinks the second equation to a single line and explains why real launch vehicles fly it.

::: context degrees-of-freedom Counting the ways something can move
A **degree of freedom** is one independent way an object can move. A bead on a wire has one: along the wire. A hockey puck on ice has three: slide left–right, slide forward–back, and spin. A rocket confined to one vertical slice of sky is like the puck stood on its edge — downrange, up–down, and one angle. A rocket free in space has six: three directions to move and three axes to rotate about. That is where "3-DOF" and "6-DOF" come from, and why lesson 6 is called the 6-DOF extension.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">3-DOF (planar)</text>
  <line x1="30" y1="120" x2="150" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="158,120 148,115 148,125" fill="#1d6fd1"/>
  <text x="95" y="140" font-size="11" text-anchor="middle" fill="#1d6fd1">1: downrange x</text>
  <line x1="30" y1="120" x2="30" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="30,32 25,42 35,42" fill="#1d6fd1"/>
  <text x="36" y="48" font-size="11" fill="#1d6fd1">2: altitude h</text>
  <path d="M 95 90 A 22 22 0 1 1 117 68" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="117,60 112,70 122,70" fill="#b4232c"/>
  <text x="95" y="72" font-size="11" text-anchor="middle" fill="#b4232c">3: γ</text>
  <line x1="190" y1="10" x2="190" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <text x="275" y="18" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">6-DOF (free)</text>
  <text x="275" y="55" font-size="12" text-anchor="middle" fill="#1d6fd1">3 ways to move:</text>
  <text x="275" y="72" font-size="12" text-anchor="middle" fill="#1d6fd1">x, y, z</text>
  <text x="275" y="102" font-size="12" text-anchor="middle" fill="#b4232c">3 ways to turn:</text>
  <text x="275" y="119" font-size="12" text-anchor="middle" fill="#b4232c">roll, pitch, yaw</text>
</svg>
```
:::

::: context flight-path-angle Three angles that are easy to mix up
Three angles live on a climbing rocket. The **pitch attitude** $\theta$ is where the nose points, measured up from the horizontal. The **flight path angle** $\gamma$ is where the rocket is actually going. The **angle of attack** $\alpha$ is the gap between them: $\alpha = \theta - \gamma$. A car skidding on ice shows the same thing: the car points one way, travels another.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="330" y2="140" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="300" y="158" font-size="11" fill="#6c7a93">horizontal</text>
  <line x1="60" y1="140" x2="237" y2="37" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="245,32 232,33 238,43" fill="#1d6fd1"/>
  <text x="250" y="58" font-size="12" fill="#1d6fd1">velocity</text>
  <line x1="60" y1="140" x2="203" y2="12" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 3"/>
  <text x="150" y="22" font-size="12" fill="#1f2a44">nose (body axis)</text>
  <path d="M 140 140 A 80 80 0 0 0 129 100" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="148" y="126" font-size="13" fill="#1d6fd1">γ = 30°</text>
  <path d="M 129 100 A 80 80 0 0 0 120 87" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="134" y="88" font-size="13" fill="#b4232c">α</text>
  <text x="200" y="110" font-size="12" fill="#1f2a44">θ = γ + α</text>
</svg>
```

In the picture the velocity is at $30^\circ$ and the nose at $42^\circ$, so $\alpha = 12^\circ$ — exaggerated so you can see it; real values are a few degrees.
:::

::: context unit-vector An arrow that only says which way
A **unit vector** is an arrow exactly one unit long. Because its length is fixed at one, it carries only a direction — like a compass needle, which tells you "north" but not how far. The little hat on top, as in $\hat{\mathbf{t}}$, is the standard sign for it. Multiply a unit vector by a number and you get an arrow of that length pointing that way: $v\hat{\mathbf{t}}$ is "speed $v$, in direction $\hat{\mathbf{t}}$". Unit vectors come back constantly in GNC, from body axes to the line of sight to a star.
:::

::: context centripetal Why a turn needs a sideways push
Swing a bucket of water in a circle. To keep it on the circle you must pull inward all the time; let go and it flies off in a straight line. That inward acceleration is **centripetal** ("center-seeking") acceleration, and its size is $v^2/R$ for speed $v$ on a circle of radius $R$. A turning rocket is the same. Moving along its curved path at speed $v$, its direction swings at $\dot\gamma = v/R$ radians per second, so $v^2/R = v\dot\gamma$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M 40 150 A 140 140 0 0 1 180 10" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="180" cy="150" r="3" fill="#1f2a44"/>
  <text x="188" y="156" font-size="11" fill="#1f2a44">center</text>
  <line x1="180" y1="150" x2="81" y2="51" stroke="#6c7a93" stroke-width="1"/>
  <text x="150" y="130" font-size="12" fill="#6c7a93">R</text>
  <circle cx="81" cy="51" r="5" fill="#1f2a44"/>
  <line x1="81" y1="51" x2="116" y2="16" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="122,10 109.8,13.8 118.2,22.2" fill="#1d6fd1"/>
  <text x="128" y="22" font-size="12" fill="#1d6fd1">v, along the path</text>
  <line x1="81" y1="51" x2="117" y2="87" stroke="#b4232c" stroke-width="3"/>
  <polygon points="123,93 110.8,89.2 119.2,80.8" fill="#b4232c"/>
  <text x="200" y="80" font-size="12" fill="#b4232c">inward: v²/R</text>
</svg>
```
:::

::: context specific-impulse Seconds as a measure of engine quality
**Specific impulse** is how much push you get from each bit of propellant — the "miles per gallon" of a rocket engine. It is quoted in seconds for an old, practical reason: if you measure propellant by its *weight* on Earth rather than its mass, thrust divided by weight-flow comes out in seconds, and the number is the same whether you work in metric or US units. Multiply by $g_0$ and you get the effective exhaust speed $c$ in m/s. Kerosene engines run around 300 s; hydrogen engines around 450 s in vacuum.
:::

::: context radians Why radians vanish from the units
A radian measures an angle as a ratio: the length of arc divided by the radius. Meters over meters cancel, so a radian has no unit — it is a pure number. That is why a turn rate in rad/s counts as plain $\mathrm{s^{-1}}$ in a units check, and why $mv\dot\gamma$ comes out in newtons. Degrees have no such luck: they are an arbitrary slicing of the circle into 360, so you must convert to radians (multiply by $\pi/180$) before a degree ever meets a formula like $v\dot\gamma$.
:::

::: context euler-step Following a rocket one tiny step at a time
The idea is the one you use to track a road trip: if you are doing 100 km/h, in six minutes you will be 10 km further on. Explicit Euler integration does exactly that for every state at once, then recomputes the rates at the new state and steps again. It is named after Leonhard Euler, the same mathematician whose rotational equation arrives in lesson 6. Its error shrinks as the step shrinks, so a millisecond step over ten seconds is plenty here. Flight software and serious simulators use cleverer steppers, such as Runge–Kutta, that are far more accurate for the same effort.
:::

::: context orbit-bridge Where flat Earth breaks
Set $g/v = v/r$ and solve: $v = \sqrt{gr}$. With $g = 9.80665\,\mathrm{m/s^2}$ and Earth's radius $r = 6.371\times 10^6\,\mathrm{m}$, that is about $7.9\,\mathrm{km/s}$ — the speed at which the ground curves away beneath you exactly as fast as you fall toward it. That is what an orbit is. On a flat Earth the ground never curves away, so the model has no way to produce one. The lessons on orbital mechanics start from exactly this balance.
:::
