---
id: l07-ascent-losses-gravity-turn
title: Gravity, drag and steering losses on ascent
minutes: 21
covers:
  - variable-mass systems and the rocket equation done properly
---

A Falcon 9 first and second stage together produce an ideal $\Delta v$ — the free-space value $v_e \ln(m_0/m_f)$ summed over both stages — of a little over $9\,\mathrm{km/s}$. A 200 km circular orbit needs $7.78\,\mathrm{km/s}$. The difference, about one and a half kilometres per second of propellant, buys nothing that shows up in the final state vector. It is spent holding the vehicle up against gravity while it is still moving slowly, pushing air out of the way, and pointing the engines somewhere other than straight along the velocity. Knowing where every metre per second of that difference goes is what lets you decide how hard to pitch over, whether a higher-thrust engine pays for its mass, and why the launch pad is where it is.

This lesson keeps the external force switched on for a whole ascent. Starting from the equation of motion derived in lesson 6, it resolves the forces along the flight path, integrates once, and reads off the accounting identity that every trajectory engineer uses: realised $\Delta v$ equals ideal $\Delta v$ minus gravity loss, minus drag loss, minus steering loss. Then it puts numbers on each term and explains the manoeuvre — the gravity turn — that makes two of the three nearly free.

## The equation of motion along the flight path

Take the rocket of lesson 6, $m\,d\mathbf{v}/dt = \mathbf{T} + \mathbf{F}_{\mathrm{ext}}$, in a vertical plane over a flat, non-rotating Earth with uniform gravity $g$ — the model the module's simulation exercise uses, and accurate enough to see all the effects. The external forces are gravity, $-mg\,\hat{\mathbf{z}}$, and aerodynamic drag $\mathbf{D}$, which opposes the velocity. Lift is zero when the vehicle flies at zero angle of attack, which it will.

Describe the velocity by its magnitude $v$ and its **flight-path angle** $\gamma$ above the local horizontal: $\gamma = 90°$ is straight up, $\gamma = 0$ is horizontal. The thrust vector makes an angle $\alpha$ with the velocity, positive when pitched above it. Rather than resolving into $x$ and $z$, resolve along the velocity (tangential) and perpendicular to it (normal), because the tangential equation governs speed and the normal one governs direction.

Tangential: the components of thrust, drag and gravity along $\hat{\mathbf{v}}$ are $T\cos\alpha$, $-D$ and $-mg\sin\gamma$, so

$$
m\frac{dv}{dt} = T\cos\alpha - D - m g \sin\gamma .
$$

Normal: the velocity vector rotates at rate $\dot{\gamma}$, so the normal acceleration is $v\dot{\gamma}$ (the usual centripetal $v^2/R$ with $R = v/\dot{\gamma}$). The normal components are $T\sin\alpha$ from thrust and $-mg\cos\gamma$ from gravity (drag has none), giving

$$
m\,v\,\frac{d\gamma}{dt} = T\sin\alpha - m g \cos\gamma .
$$

With the kinematics $\dot{h} = v\sin\gamma$, $\dot{x} = v\cos\gamma$ and the mass flow $\dot{m} = -T/(I_{sp} g_0)$ from lesson 2, this is a closed five-state system $[v, \gamma, h, x, m]$ — exactly the one the gravity-turn exercise asks you to integrate. Over a round Earth the normal equation acquires an extra $+ (v/r)\cos\gamma$ on the right-hand side of $\dot{\gamma}$, from the horizon tilting as the vehicle moves downrange; it matters for the last few hundred seconds of an ascent and is omitted in the flat-Earth model.

## Integrating: the Δv budget

Divide the tangential equation by $m$ and write $T\cos\alpha = T - T(1 - \cos\alpha)$:

$$
\frac{dv}{dt} = \frac{T}{m} - \frac{T}{m}(1 - \cos\alpha) - \frac{D}{m} - g\sin\gamma .
$$

Integrate from ignition to burnout, $0$ to $t_b$. The first term is the one lesson 6 integrated: with $T = v_e|\dot{m}|$,

$$
\int_0^{t_b} \frac{T}{m}\,dt = \int_0^{t_b} \frac{v_e |\dot{m}|}{m}\,dt = v_e \ln\frac{m_0}{m_f} = \Delta v_{\mathrm{ideal}},
$$

the ideal $\Delta v$ of the burn, independent of how the vehicle flew. The other three terms are integrals along the actual trajectory, and each has a name:

$$
\Delta v_{\mathrm{realised}} = v(t_b) - v(0) = \underbrace{v_e \ln\frac{m_0}{m_f}}_{\text{ideal}} - \underbrace{\int_0^{t_b} g\sin\gamma\,dt}_{\text{gravity loss}} - \underbrace{\int_0^{t_b} \frac{D}{m}\,dt}_{\text{drag loss}} - \underbrace{\int_0^{t_b} \frac{T}{m}(1 - \cos\alpha)\,dt}_{\text{steering loss}} .
$$

This is an identity, not an approximation: it holds for every trajectory the equations of motion generate, and a simulation that logs the three integrals must find that they and the realised $\Delta v$ sum to $v_e \ln(m_0/m_f)$ to integrator accuracy. That is the sanity check to build first. The identity also explains why "ideal $\Delta v$" is the currency of mission design: the rocket equation tells you what the propellant is *worth*, and the losses tell you how much of that value the trajectory *spends* without adding speed.

One more term belongs on the list when the ideal $\Delta v$ is computed with the vacuum $I_{sp}$: the **back-pressure loss**, $\int (T_{\mathrm{vac}} - T)/m\,dt$, the thrust the atmosphere takes away at the nozzle exit (lesson 6) during the first minute or so. It is a few tens of metres per second for a sea-level-optimised engine and is often folded into a sea-level $I_{sp}$ instead.

::: key
Ideal $\Delta v$ decomposes as $\Delta v_{\mathrm{ideal}} = \Delta v_{\mathrm{realised}} + \text{gravity loss} + \text{drag loss} + \text{steering loss}$ (plus a back-pressure loss if the ideal figure uses vacuum $I_{sp}$). For a LEO ascent the ideal is about $9.3$–$9.5\,\mathrm{km/s}$ against an orbital speed of about $7.8\,\mathrm{km/s}$.
:::

## Gravity loss

The gravity-loss integral is $\int g\sin\gamma\,dt$. Its meaning is direct: at every instant the vehicle's weight has a component $mg\sin\gamma$ opposing the motion, and the thrust must cancel that component before any of it accelerates anything. Vertical flight ($\gamma = 90°$) loses at the full $g$, about $9.8\,\mathrm{m/s}$ for every second spent climbing straight up. Horizontal flight ($\gamma = 0$) loses nothing: gravity is then perpendicular to the velocity and, as in lesson 3, does no work on it — the vehicle is still being pulled down, but it is the normal equation, not the tangential one, that pays.

Two things follow. Gravity loss is proportional to *time* spent at steep flight-path angles, so a high thrust-to-weight ratio, which shortens that time, reduces it; this is the chief argument for making a first stage's engines bigger than the rocket equation alone would suggest. And it rewards turning toward the horizontal as early as possible — but the atmosphere punishes flying low and fast, so the turn is a compromise, discussed under the gravity turn below.

::: key
The gravity-loss integral is $\int g\sin\gamma\,dt$, with $\gamma$ the flight-path angle above the local horizon. Vertical flight loses at the full $g$; horizontal flight loses nothing.
:::

::: example Gravity loss for a representative pitch profile
Model a LEO ascent's flight-path angle as: vertical for the first $10\,\mathrm{s}$; falling linearly from $90°$ to $20°$ between $10$ and $150\,\mathrm{s}$ (the first-stage burn); falling linearly from $20°$ to $0°$ between $150$ and $330\,\mathrm{s}$; horizontal thereafter until orbit insertion at $540\,\mathrm{s}$. Take $g = 9.7\,\mathrm{m/s^2}$, a fair average over the first 200 km. What is the gravity loss?

For a segment in which $\gamma$ falls linearly from $\gamma_1$ to $\gamma_2$ over a duration $\Delta t$, substitute $\gamma = \gamma_1 + (\gamma_2 - \gamma_1)\,t/\Delta t$:

$$
\int_0^{\Delta t} g\sin\gamma\,dt = \frac{g\,\Delta t}{\gamma_2 - \gamma_1}\Big[-\cos\gamma\Big]_{\gamma_1}^{\gamma_2} = g\,\Delta t\,\frac{\cos\gamma_1 - \cos\gamma_2}{\gamma_2 - \gamma_1},
$$

with the angles in radians. Segment by segment:

- Vertical, $10\,\mathrm{s}$: $9.7 \times 10 = 97\,\mathrm{m/s}$.
- $90° \to 20°$ over $140\,\mathrm{s}$: $\gamma_2 - \gamma_1 = -1.2217\,\mathrm{rad}$, $\cos 90° - \cos 20° = -0.9397$, so $9.7 \times 140 \times 0.9397 / 1.2217 \approx 1045\,\mathrm{m/s}$.
- $20° \to 0°$ over $180\,\mathrm{s}$: $9.7 \times 180 \times (0.9397 - 1)/(-0.3491) \approx 302\,\mathrm{m/s}$.
- Horizontal, $210\,\mathrm{s}$: $0$.

Total gravity loss about $1.44\,\mathrm{km/s}$. Three-quarters of it is incurred in the first $150\,\mathrm{s}$, while the vehicle is steep and slow; the long second-stage burn, flown nearly flat, costs only $300\,\mathrm{m/s}$. Pitching over faster — reaching $20°$ at $120\,\mathrm{s}$ rather than $150\,\mathrm{s}$ — would save roughly $200\,\mathrm{m/s}$, at the price of a lower, hotter trajectory through the atmosphere.
:::

## Drag loss

The drag-loss integral is $\int D/m\,dt$ with $D = \tfrac{1}{2}\rho v^2 C_D A = \bar{q}\,C_D A$, where $\bar{q} = \tfrac{1}{2}\rho v^2$ is the **dynamic pressure**, $C_D$ the drag coefficient and $A$ the reference (cross-sectional) area. Density falls roughly exponentially with altitude, $\rho \approx \rho_0 e^{-h/H}$ with $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and scale height $H \approx 8.5\,\mathrm{km}$, while $v^2$ grows, so $\bar{q}$ rises, peaks and collapses. The peak — **max-Q** — comes at roughly $10$–$15\,\mathrm{km}$ and $400$–$500\,\mathrm{m/s}$, about a minute into a typical ascent, and is of order $30\,\mathrm{kPa}$. Only the $60$–$100\,\mathrm{s}$ around it contribute appreciably to the integral.

Drag loss is the one term that favours *large* vehicles: drag scales with area, mass with volume, so $D/m$ falls as the vehicle grows. For a medium launcher the integral is typically $0.1$–$0.2\,\mathrm{km/s}$; for a large, dense vehicle it can be well under $0.1\,\mathrm{km/s}$; for a small sounding rocket it can exceed the gravity loss. It is also the reason the ascent is not flown as flat as gravity loss alone would recommend: stay low and fast and the atmosphere takes back everything the steeper trajectory would have lost to gravity.

::: example An order-of-magnitude drag loss
Model a Falcon-class ascent's dynamic pressure as a Gaussian pulse, $\bar{q}(t) = 30\,\mathrm{kPa} \times \exp[-((t - 70)/35)^2]$, with $C_D A = 4.2\,\mathrm{m^2}$ ($C_D \approx 0.4$ over a $3.66\,\mathrm{m}$ diameter) and mass $m(t) = 549{,}000 - 2750\,t$ kg. Estimate the drag loss.

At max-Q the drag is $D = 30{,}000 \times 4.2 = 1.26 \times 10^{5}\,\mathrm{N}$ on a vehicle of $549{,}000 - 2750 \times 70 \approx 356{,}500\,\mathrm{kg}$, so $D/m \approx 0.35\,\mathrm{m/s^2}$ — a few percent of $g$. A Gaussian of peak $0.35\,\mathrm{m/s^2}$ and width parameter $35\,\mathrm{s}$ has area $0.35 \times 35\sqrt{\pi} \approx 22\,\mathrm{m/s}$; numerical integration of the model with the mass varying gives $23\,\mathrm{m/s}$. Even allowing for a broader real pulse and transonic $C_D$ rises, this vehicle's drag loss is a few tens of metres per second, an order of magnitude below its gravity loss. Halve the diameter and keep the density and you quadruple the ratio of area to mass: a $1.8\,\mathrm{m}$ vehicle on the same trajectory would lose several times as much.
:::

## Steering loss

The steering-loss integral is $\int (T/m)(1 - \cos\alpha)\,dt$. When the thrust is pitched at angle $\alpha$ from the velocity, only $T\cos\alpha$ increases the speed; the missing $T(1 - \cos\alpha)$ is the price of using thrust to *turn* rather than to accelerate. For small angles $1 - \cos\alpha \approx \alpha^2/2$, so a few degrees of steering is almost free: at $\alpha = 3°$, $1 - \cos\alpha \approx 0.00137$, one part in 730 of the thrust. At $30°$ it is 13 %; at $90°$ all of it.

::: key
The steering-loss integral is $\int (T/m)(1 - \cos\alpha)\,dt$, where $\alpha$ is the angle between the thrust vector and the velocity vector. Small $\alpha$ is cheap because $1 - \cos\alpha \approx \alpha^2/2$.
:::

Steering loss is small on a well-flown ascent — a few tens of metres per second — and it is the *choice* of how to turn the vehicle that decides whether it stays small. Holding $\alpha = 3°$ for the whole $300\,\mathrm{s}$ of a second-stage burn at a mean $T/m = 20\,\mathrm{m/s^2}$ costs $20 \times 0.00137 \times 300 \approx 8\,\mathrm{m/s}$. Holding $15°$ for $20\,\mathrm{s}$ at liftoff-class $T/m = 13.6\,\mathrm{m/s^2}$ costs $13.6 \times 0.0341 \times 20 \approx 9\,\mathrm{m/s}$. Neither is expensive. What *is* expensive is the aerodynamic consequence of a large $\alpha$ in dense air: with the thrust pitched away from the velocity the airflow no longer comes straight down the vehicle's axis, and the side load, proportional to $\bar{q}\,\alpha$, is what breaks launch vehicles.

## The gravity turn

There is a way to turn the velocity vector from vertical to horizontal that costs no steering loss at all: let gravity do it. Set $\alpha = 0$ — thrust exactly along the velocity — and the normal equation of motion becomes

$$
\frac{d\gamma}{dt} = -\frac{g}{v}\cos\gamma .
$$

Gravity's component normal to the velocity, $g\cos\gamma$, bends the path downward at a rate that is large when the vehicle is slow and vanishes when it is either vertical ($\cos\gamma = 0$) or horizontal. This is the **gravity turn**. A vehicle exactly vertical never turns, so the manoeuvre is started with a small, brief **pitch-over** — a few degrees of $\alpha$ for a few seconds shortly after liftoff, at perhaps $50\,\mathrm{m/s}$ — after which the thrust is returned to the velocity direction and gravity does the rest. From $\gamma = 85°$ at $v = 100\,\mathrm{m/s}$ the turn rate is $(9.8/100)\cos 85° \approx 0.0085\,\mathrm{rad/s}$, half a degree per second; at $\gamma = 45°$ and $v = 1000\,\mathrm{m/s}$ it is $0.4°/\mathrm{s}$; by orbital speed it is negligible, and the last bending toward horizontal is done by the guidance with a small $\alpha$ once the air is gone.

Why every orbital launcher flies one is now clear. The turn costs no steering loss, because $\alpha = 0$. It keeps the angle of attack, and hence the aerodynamic side load $\bar{q}\alpha$, near zero through max-Q, which is the structural constraint that dominates first-stage design. And it produces a trajectory that is steep while the air is dense and flat once it is thin, which is the compromise between gravity and drag loss that the two integrals demand. The price is a loss of freedom: after the pitch-over the trajectory is fixed by the initial kick, the thrust programme and the atmosphere. The whole of first-stage guidance reduces to choosing the size and timing of that kick, which is exactly the sweep the module's simulation exercise asks you to run — too small and the vehicle stays steep and pays gravity loss; too large and it flattens early, pays drag loss, and may not reach a safe altitude before staging.

::: key
A gravity turn: after a small initial pitch-over, the vehicle flies at zero angle of attack and lets gravity rotate the velocity vector, $\dot{\gamma} = -(g/v)\cos\gamma$. It costs no steering loss and keeps $\bar{q}\alpha$ near zero through max-Q, which is why every orbital launcher flies one.
:::

## What the Earth gives back

One more entry belongs in the budget, with the opposite sign. The launch pad is moving. A point on the equator is carried eastward at $\omega_E R_E = 7.2921 \times 10^{-5} \times 6.378 \times 10^{6} \approx 465\,\mathrm{m/s}$, and at latitude $\phi$ the speed is $465\cos\phi$: about $409\,\mathrm{m/s}$ at Cape Canaveral ($28.5°$), $463\,\mathrm{m/s}$ at Kourou ($5.2°$). A vehicle launched due east starts with that inertial velocity for free, and the orbital speed it must reach is measured in the inertial frame. So the eastward rotation credit reduces the $\Delta v$ the vehicle must supply by up to $0.46\,\mathrm{km/s}$; a polar launch gets nothing, and a retrograde launch pays it twice over. Launch sites are near the equator and launch eastward over water for this reason.

## The budget, assembled

For a 200 km circular orbit, $v_{\mathrm{circ}} = \sqrt{\mu / r} = \sqrt{3.986 \times 10^{14} / 6.578 \times 10^{6}} \approx 7.78\,\mathrm{km/s}$. Adding representative losses:

| Term | Typical value |
| --- | --- |
| orbital speed, 200 km circular | $7.78\,\mathrm{km/s}$ |
| gravity loss $\int g\sin\gamma\,dt$ | $1.2$–$1.5\,\mathrm{km/s}$ |
| drag loss $\int D/m\,dt$ | $0.05$–$0.2\,\mathrm{km/s}$ |
| steering loss $\int (T/m)(1 - \cos\alpha)\,dt$ | $0.02$–$0.1\,\mathrm{km/s}$ |
| back-pressure loss (if using vacuum $I_{sp}$) | $0.03$–$0.1\,\mathrm{km/s}$ |
| **sum: ideal $\Delta v$ required** | **about $9.1$–$9.7\,\mathrm{km/s}$**, typically quoted as $9.3$–$9.5$ |
| Earth-rotation credit, eastward launch | $-0.4$ to $-0.46\,\mathrm{km/s}$ |

Gravity loss dominates, because the vehicle spends its first minute or two nearly vertical at a thrust-to-weight ratio of only $1.2$–$1.5$. Drag is a minor item because $\bar{q}$ is significant only for the minute or so around max-Q. Steering loss is nearly zero on a gravity turn. Engine inefficiency does not appear at all: it is already inside $v_e$, and so inside the ideal $\Delta v$. When you build the budget for a real vehicle, integrate the three loss integrals along the simulated trajectory rather than quoting these ranges, and check that ideal minus losses reproduces the realised $\Delta v$ before you believe any of them.

::: warning
Do not compute "$\Delta v$ to orbit" as $7.8\,\mathrm{km/s}$ and size the propellant from that; the rocket equation must be fed the *ideal* $\Delta v$, losses included, and the difference is about a fifth of the total — for a kerosene–oxygen vehicle, a factor of about $e^{1.5/3.05} \approx 1.6$ in mass ratio. Equally, do not add the Earth-rotation credit as a "loss" with the wrong sign: it reduces what the vehicle must supply. And do not confuse gravity *loss* with the *work done against gravity*: a vehicle flying horizontally at constant altitude has zero gravity loss while its potential energy stays constant, and a vehicle coasting upward gains potential energy with zero gravity loss because it is not thrusting at all. Gravity loss is specifically thrust spent cancelling the along-track component of weight.
:::

## Conservation laws as a check on the simulation

The module's objectives ask you to use conservation laws to check a simulation, and an ascent model is the place to practise. Three checks fall straight out of this module.

1. **The $\Delta v$ identity.** Log the three loss integrals; realised $\Delta v$ plus losses must equal $v_e \ln(m_0/m_f)$ at every instant, not only at burnout. A discrepancy that grows with time is an integration error; a constant offset is a bookkeeping error, usually a factor of $m$.
2. **Free-space limit.** Set $g = 0$ and $\rho = 0$; the realised $\Delta v$ must be the rocket equation exactly, independent of thrust level. If it depends on thrust, the mass is being differentiated somewhere it should not be (lesson 6).
3. **Energy rate.** The mechanical energy per unit mass $\varepsilon = v^2/2 + g h$ must change at the rate $(T\cos\alpha - D)\,v/m$ — the power of the non-conservative forces from lesson 4 — since gravity is inside $\varepsilon$. Any other rate means a force has the wrong sign or is missing.

None of these tells you the trajectory is *good*; they tell you the equations are being solved correctly, which must come first.

## Check yourself

::: check
A vehicle with an initial thrust-to-weight ratio of $1.3$ climbs vertically for $40\,\mathrm{s}$ before pitching over. A redesign raises the ratio to $1.6$, shortening the vertical segment to $30\,\mathrm{s}$ for the same altitude. How much gravity loss does the redesign save during that segment, and why does the answer not depend on the vehicle's mass?
:::

::: answer
During vertical flight $\gamma = 90°$ and the gravity loss is $\int g\,dt = g\,\Delta t$. The saving is $9.8 \times (40 - 30) \approx 98\,\mathrm{m/s}$. The integrand is $g\sin\gamma$ — an acceleration, not a force — so the vehicle's mass never enters; only the time spent at each flight-path angle does. Higher thrust-to-weight reduces gravity loss purely by shortening that time.
:::

::: check
A guidance error holds the thrust $6°$ off the velocity vector for $120\,\mathrm{s}$ during a second-stage burn with $T/m = 18\,\mathrm{m/s^2}$. Estimate the steering loss, and compare it with the loss had the error been $12°$.
:::

::: answer
$1 - \cos 6° \approx 0.00548$, so the loss is $18 \times 0.00548 \times 120 \approx 11.8\,\mathrm{m/s}$. At $12°$, $1 - \cos 12° \approx 0.0219$, four times larger, giving about $47\,\mathrm{m/s}$. Steering loss goes as $\alpha^2$ for small angles, so doubling the error quadruples the cost. Both are small next to the gravity loss, which is why moderate pointing errors are tolerable in vacuum; in the atmosphere the same $12°$ would be an unacceptable angle of attack for structural reasons, not for $\Delta v$ reasons.
:::

::: check
Write the flat-Earth gravity-turn equations for $\dot{v}$ and $\dot{\gamma}$, and explain physically why the turn rate is largest when the vehicle is slow and at $45°$, and zero when it is exactly vertical.
:::

::: answer
With zero angle of attack, $\dot{v} = T/m - D/m - g\sin\gamma$ and $\dot{\gamma} = -(g/v)\cos\gamma$. The turn is driven by gravity's component normal to the velocity, $g\cos\gamma$, acting on a vehicle whose direction is easy to change when it is slow (normal acceleration $v\dot{\gamma}$ for a given force gives $\dot{\gamma} \propto 1/v$). At $\gamma = 90°$ gravity is entirely along the velocity, has no normal component, and cannot turn it — which is why a small pitch-over is needed to start the turn. At $\gamma = 0$ gravity is entirely normal but $\cos\gamma$ is maximal, so the turn rate there is $g/v$, small because $v$ is by then large; in the flat-Earth model the trajectory would keep bending below the horizon, and on a round Earth the $v\cos\gamma / r$ term counteracts it.
:::

::: check
A launch provider quotes an ideal $\Delta v$ capability of $9.6\,\mathrm{km/s}$ from Kourou and asks whether the vehicle can reach a 200 km eastward circular orbit with a gravity loss of $1.35\,\mathrm{km/s}$, drag loss of $0.12\,\mathrm{km/s}$ and steering loss of $0.05\,\mathrm{km/s}$. Can it, and by what margin?
:::

::: answer
Required inertial speed is $7.78\,\mathrm{km/s}$; the pad supplies $0.46\,\mathrm{km/s}$ eastward at Kourou's latitude, so the vehicle must add $7.78 - 0.46 = 7.32\,\mathrm{km/s}$ of realised $\Delta v$. Adding losses, the ideal $\Delta v$ needed is $7.32 + 1.35 + 0.12 + 0.05 = 8.84\,\mathrm{km/s}$. Against $9.6\,\mathrm{km/s}$ the margin is about $0.76\,\mathrm{km/s}$, which could be spent on a higher orbit, a heavier payload (via the rocket equation), or a polar launch that forfeits the rotation credit.
:::

::: check
An ascent simulation reports realised $\Delta v = 8.05\,\mathrm{km/s}$, gravity loss $1.30\,\mathrm{km/s}$, drag loss $0.10\,\mathrm{km/s}$ and steering loss $0.04\,\mathrm{km/s}$ for a two-stage vehicle whose stages have mass ratios $3.98$ and $6.84$ at $v_e = 3050$ and $3413\,\mathrm{m/s}$ respectively. Is the simulation consistent?
:::

::: answer
The ideal $\Delta v$ is $3050 \ln 3.98 + 3413 \ln 6.84 \approx 3050 \times 1.381 + 3413 \times 1.923 \approx 4212 + 6563 \approx 10.78\,\mathrm{km/s}$. The reported realised value plus losses is $8.05 + 1.30 + 0.10 + 0.04 = 9.49\,\mathrm{km/s}$. The two differ by about $1.3\,\mathrm{km/s}$, far beyond integration error, so the simulation is *not* consistent: either a loss is being under-logged, the thrust or mass flow in the dynamics does not match the stated $v_e$, or the mass is being handled incorrectly. The identity must close before any number from the run is trusted.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\gamma$, $\alpha$ | flight-path angle above the local horizon; angle between thrust and velocity |
| $m\dot{v} = T\cos\alpha - D - mg\sin\gamma$ | tangential equation of motion, flat Earth |
| $m v\dot{\gamma} = T\sin\alpha - mg\cos\gamma$ | normal equation; $\dot{\gamma} = -(g/v)\cos\gamma$ for a gravity turn ($\alpha = 0$) |
| $\Delta v_{\mathrm{realised}} = v_e\ln(m_0/m_f) - \int g\sin\gamma\,dt - \int D/m\,dt - \int (T/m)(1-\cos\alpha)\,dt$ | the $\Delta v$ identity; exact for every trajectory |
| gravity loss $\int g\sin\gamma\,dt$ | full $g$ vertical, zero horizontal; $1.2$–$1.5\,\mathrm{km/s}$ for LEO; shrinks with thrust-to-weight |
| drag loss $\int D/m\,dt$, $D = \bar{q}C_D A$ | concentrated around max-Q ($\sim 30\,\mathrm{kPa}$, $10$–$15\,\mathrm{km}$); $0.05$–$0.2\,\mathrm{km/s}$; smaller for larger vehicles |
| steering loss $\int (T/m)(1-\cos\alpha)\,dt$ | $1 - \cos\alpha \approx \alpha^2/2$; nearly zero on a gravity turn |
| gravity turn | small pitch-over, then $\alpha = 0$ and gravity rotates $\mathbf{v}$; no steering loss, $\bar{q}\alpha \approx 0$ through max-Q |
| Earth rotation | $\omega_E R_E\cos\phi$: $465\,\mathrm{m/s}$ at the equator, $409\,\mathrm{m/s}$ at $28.5°$; a credit for eastward launch |
| LEO budget | $7.8\,\mathrm{km/s}$ orbital $+$ losses $\approx 9.3$–$9.5\,\mathrm{km/s}$ ideal |

The remaining two lessons change method rather than subject. For a particle under gravity, thrust and drag, Newton's second law is the natural tool; for a gimballed engine on a flexing stage with sloshing tanks, writing out every constraint force is not. Lesson 8 introduces constraints and generalised coordinates, and lesson 9 the Lagrangian machinery that turns them into equations of motion without a single free-body diagram.
