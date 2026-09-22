---
id: l06-rocket-equation-done-properly
title: Variable mass and the rocket equation, done properly
minutes: 23
covers:
  - variable-mass systems and the rocket equation done properly
---

"Derive the rocket equation" is one of the most common whiteboard questions asked of a GNC candidate, and most people who have seen the result get the derivation wrong. The usual wrong answer writes Newton's second law as $F = d(mv)/dt$, expands the product, and reads $v\,dm/dt$ as a thrust term. It gives the right-looking formula by accident and collapses the moment anyone asks which frame $v$ is measured in. The interviewer is not testing whether you remember $\Delta v = v_e \ln(m_0/m_f)$; they are testing whether you know what Newton's second law is a statement *about*.

Lessons 1, 2 and 5 have been preparing the answer. The second law, $\mathbf{F}_{\mathrm{ext}} = d\mathbf{P}/dt$, holds for a *fixed collection of matter* in an inertial frame, and the centre-of-mass theorem says that internal forces cannot change the total momentum of such a collection. A rocket by itself is not a fixed collection of matter. A rocket together with the propellant it is about to expel is. Apply the law to that system, over one small interval $dt$, and the equation of motion falls out in five lines with no ambiguity about frames — and the thrust appears not as an assumption but as the momentum the exhaust carries away.

This lesson does that derivation, explains exactly where the naive version fails, adds the pressure term that makes an engine's vacuum and sea-level thrust differ, integrates to the rocket equation, and shows what the exponential in it means for vehicle design. Lesson 7 adds gravity, drag and steering and accounts for where a launch vehicle's $\Delta v$ actually goes.

## The trap

Take a rocket of mass $m(t)$ moving at velocity $v(t)$ along a line in an inertial frame, with external force $F_{\mathrm{ext}}$ (gravity, drag) and no other forces on the free-body diagram. Its mass decreases because propellant leaves at rate $|\dot{m}|$; write $\dot{m} = dm/dt < 0$. The tempting move is

$$
F_{\mathrm{ext}} = \frac{d(mv)}{dt} = m\frac{dv}{dt} + v\frac{dm}{dt} \qquad \text{(wrong)},
$$

and then to rearrange it as $m\,dv/dt = F_{\mathrm{ext}} - v\,\dot{m}$, calling $-v\dot{m}$ the thrust. Two observations show that this cannot be physics.

First, it is frame-dependent. Move to another inertial frame travelling at constant $u$ along the line. The acceleration $dv/dt$, the mass, its rate of change and the external force are all unchanged, but $v$ becomes $v - u$, so the "thrust" changes by $u\dot{m}$. With $|\dot{m}| \approx 2750\,\mathrm{kg/s}$ for a Falcon 9 first stage and $u = 1000\,\mathrm{m/s}$, two observers would disagree about the thrust by $2.75\,\mathrm{MN}$ — more than a third of the engines' output. Since the vehicle's acceleration is the same for both observers, at least one of them has the wrong equation, and by symmetry so do both.

Second, it predicts nonsense in the simplest case. In the frame where the rocket is momentarily at rest, $v = 0$, and the equation reduces to $m\,dv/dt = F_{\mathrm{ext}}$: no thrust at all. A rocket on the pad would never lift off. Conversely, a cart leaking sand out of the bottom — mass leaving with *zero* velocity relative to the cart — would, according to the formula, accelerate as it drained, which no cart has ever done.

The error is not algebraic; the product rule is fine. The error is applying $F = dp/dt$ to "the rocket", a system whose membership changes every instant. Newton's law says nothing about such a system. The momentum of the vehicle at time $t + dt$ minus the momentum of the vehicle at time $t$ is not the change of momentum of any fixed collection of matter, so there is no reason it should equal $F_{\mathrm{ext}}\,dt$, and it does not.

::: key
Newton's second law in the form that survives variable mass is $\mathbf{F}_{\mathrm{ext}} = d\mathbf{p}/dt$ applied to a *fixed* system of matter. For a rocket you must include the momentum carried off by the exhaust; $\mathbf{F} = m\mathbf{a}$ — or $d(m\mathbf{v})/dt$ — applied to the shrinking vehicle alone is wrong, and the $\mathbf{v}\,dm/dt$ term it produces is frame-dependent nonsense.
:::

## The control volume, and the derivation

Choose the system carefully. At time $t$ the system is the vehicle — structure, payload, engines and *all* the propellant on board — of total mass $m$ and velocity $\mathbf{v}$ in an inertial frame. This is a fixed collection of matter; we follow exactly these atoms for the next $dt$. Its momentum is

$$
\mathbf{P}(t) = m\,\mathbf{v}.
$$

During $dt$ a small parcel of propellant, of mass $dm_e > 0$, passes out through the nozzle. (In terms of the vehicle's mass, $dm = -dm_e$.) It leaves at velocity $\mathbf{v}_e$ *relative to the vehicle*, directed backward. By the end of the interval the same collection of matter consists of two parts: the vehicle, now of mass $m - dm_e$ and velocity $\mathbf{v} + d\mathbf{v}$; and the parcel, whose inertial velocity is the vehicle's velocity plus its relative velocity, $\mathbf{v} - \mathbf{v}_e$ (to first order — whether we use $\mathbf{v}$ or $\mathbf{v} + d\mathbf{v}$ for the vehicle here changes the result by $dm_e\,d\mathbf{v}$, which is second order). So

$$
\mathbf{P}(t + dt) = (m - dm_e)(\mathbf{v} + d\mathbf{v}) + dm_e\,(\mathbf{v} - \mathbf{v}_e).
$$

Expand and drop the second-order product $dm_e\,d\mathbf{v}$:

$$
\mathbf{P}(t + dt) = m\mathbf{v} + m\,d\mathbf{v} - dm_e\,\mathbf{v} + dm_e\,\mathbf{v} - dm_e\,\mathbf{v}_e = m\mathbf{v} + m\,d\mathbf{v} - dm_e\,\mathbf{v}_e .
$$

Watch the two terms $-dm_e\,\mathbf{v}$ and $+dm_e\,\mathbf{v}$ cancel. The first is the momentum the vehicle *loses by losing mass*; the second is the momentum the parcel *has because it was moving with the vehicle*. They are the same momentum, counted on two sides of the ledger, and the observer's velocity drops out with them. What survives is the momentum the parcel carries relative to the vehicle — the only quantity every inertial observer agrees on.

Now the second law for the fixed system: $\mathbf{F}_{\mathrm{ext}}\,dt = \mathbf{P}(t + dt) - \mathbf{P}(t) = m\,d\mathbf{v} - dm_e\,\mathbf{v}_e$. Divide by $dt$, and write $dm_e/dt = |\dot{m}|$:

$$
m\frac{d\mathbf{v}}{dt} = \mathbf{F}_{\mathrm{ext}} + |\dot{m}|\,\mathbf{v}_e .
$$

This is the equation of motion of a rocket. The vehicle's mass times its acceleration equals the external force plus a term $|\dot{m}|\,\mathbf{v}_e$ pointing opposite to the exhaust — forward. That term is the **thrust**, $\mathbf{T} = |\dot{m}|\,\mathbf{v}_e$, of magnitude $T = |\dot{m}|\,v_e$, exactly the $T = \dot{m} v_e$ that lesson 2 obtained from the definition of specific impulse. It is a force on the vehicle in the ordinary sense — the pressure of the combustion gases on the chamber walls and the nozzle — and the derivation shows why it has the value it does: it is the rate at which momentum is being handed to the exhaust, relative to the vehicle.

Notice that no external force appears in the thrust. The rocket does not push against the air, or the pad, or anything; it pushes against its own exhaust, and works better in vacuum than in air. Notice also that the external forces still act on the mass $m$ actually on board at the instant in question. That is the correct sense in which the mass "varies": $m$ is a known function of time on the left-hand side, not a quantity to be differentiated on the right.

::: key
The correct equation of motion for a rocket under external forces is $m\,d\mathbf{v}/dt = \mathbf{F}_{\mathrm{ext}} + |\dot{m}|\,\mathbf{v}_e = \mathbf{F}_{\mathrm{ext}} + \mathbf{T}$, with $\mathbf{T}$ the thrust. The propellant term appears as a force because of the momentum it carries away, not because mass is changing inside $F = ma$.
:::

### Variable-mass systems in general

The same derivation covers any body that gains or loses mass. If matter joins or leaves the body at velocity $\mathbf{u}$ *relative to the body*, at rate $dm/dt$ (positive for gain, negative for loss), the equation of motion is

$$
m\frac{d\mathbf{v}}{dt} = \mathbf{F}_{\mathrm{ext}} + \mathbf{u}\,\frac{dm}{dt},
$$

sometimes called the Meshchersky equation. For the rocket, $\mathbf{u} = -\mathbf{v}_e$ and $dm/dt = -|\dot{m}|$, so the product is $+|\dot{m}|\,\mathbf{v}_e$. For the leaking sand cart, $\mathbf{u} = 0$ and there is no thrust: the cart's velocity is unaffected by draining, which is what happens. For a scoop collecting stationary air at speed $v$, $\mathbf{u} = -\mathbf{v}$ and $dm/dt > 0$, giving a drag-like retarding force $-v\,dm/dt$ — the momentum cost of accelerating the collected air up to the vehicle's speed. In every case the relative velocity is what appears, never the inertial velocity of the body, and that is the signature of a correct variable-mass equation.

::: warning
The two most common errors in this derivation are both bookkeeping slips. One is to give the parcel an inertial velocity of $-\mathbf{v}_e$ instead of $\mathbf{v} - \mathbf{v}_e$ — forgetting that the propellant was moving with the vehicle before it left. That reintroduces the spurious $\mathbf{v}\,dm/dt$ term through the back door. The other is to define the system as "the vehicle at time $t$" and then compare it with "the vehicle at time $t + dt$", which are different collections of matter. Always name the fixed system — vehicle plus the parcel about to leave — and follow it.
:::

## The thrust equation with back pressure

The derivation above treated $\mathbf{v}_e$ as the velocity of the expelled parcel relative to the vehicle, and $|\dot{m}|\,v_e$ came out equal to the thrust. That is exactly right if $v_e$ is defined as the *effective* exhaust velocity, $T/|\dot{m}|$. But the gas at the nozzle exit plane does not leave at the effective exhaust velocity, and the difference is a pressure term worth understanding because it explains why one engine has two different specific impulses.

Look at the vehicle as an open control volume bounded by its outer skin and by the plane of the nozzle exit, area $A_e$. Through the exit plane the gas leaves at the actual exit velocity $v_{e,\mathrm{exit}}$ and at pressure $p_e$, which is generally not the ambient pressure $p_a$. The ambient atmosphere presses on every part of the outer skin with $p_a$. If it also pressed on the exit plane with $p_a$ the pressure forces would integrate to zero over the closed surface (a uniform pressure over a closed surface has no net force). But on the exit plane the pressure is $p_e$, not $p_a$; the difference, $(p_e - p_a)$ acting over $A_e$ and directed forward when $p_e > p_a$, is the net pressure force. Adding it to the momentum flux from the derivation gives the **thrust equation**

$$
T = |\dot{m}|\,v_{e,\mathrm{exit}} + (p_e - p_a)\,A_e .
$$

The **effective exhaust velocity** is then defined so that $T = |\dot{m}|\,v_e$:

$$
v_e = v_{e,\mathrm{exit}} + \frac{(p_e - p_a)\,A_e}{|\dot{m}|}, \qquad I_{sp} = \frac{v_e}{g_0}.
$$

Everything in the equation of motion continues to use $v_e$ and $T$; the split into momentum and pressure terms matters when you ask how $T$ depends on altitude. The mass flow is set upstream, by the turbopumps, injector and chamber pressure, and does not know what the ambient pressure is; $v_{e,\mathrm{exit}}$ and $p_e$ are set by the chamber conditions and the nozzle's area ratio. Only $p_a$ changes as the vehicle climbs, from about $101\,\mathrm{kPa}$ at sea level to zero in vacuum. So $T$ rises with altitude by exactly $p_a A_e$, and the vacuum $I_{sp}$ exceeds the sea-level $I_{sp}$ by $p_{a,0} A_e / (|\dot{m}| g_0)$. A vacuum-optimised engine carries a much larger nozzle — a bigger $A_e$ and a lower $p_e$ — because with $p_a = 0$ there is no penalty for expanding the gas further; the same nozzle at sea level would have $p_e \ll p_a$, a negative pressure term, and a flow that separates from the wall.

::: key
The rocket thrust equation including back pressure is $F = \dot{m}\,v_{e,\mathrm{exit}} + (p_e - p_a)A_e$. The pressure term is why sea-level and vacuum $I_{sp}$ differ for the same engine: $\dot{m}$ and the exit conditions are fixed upstream, and only $p_a$ changes with altitude.
:::

::: example One engine, two thrusts
A kerosene–oxygen engine passes $|\dot{m}| = 300\,\mathrm{kg/s}$ through a nozzle with exit area $A_e = 0.68\,\mathrm{m^2}$ (exit diameter about $0.93\,\mathrm{m}$). The gas leaves at $v_{e,\mathrm{exit}} = 2911\,\mathrm{m/s}$ and exit pressure $p_e = 60\,\mathrm{kPa}$ — representative figures chosen to reproduce Merlin 1D's published thrusts. Find the thrust, effective exhaust velocity and specific impulse at sea level ($p_a = 101.3\,\mathrm{kPa}$), at 10 km ($p_a = 26.5\,\mathrm{kPa}$) and in vacuum.

Momentum term, the same everywhere: $|\dot{m}|\,v_{e,\mathrm{exit}} = 300 \times 2911 = 8.733 \times 10^{5}\,\mathrm{N}$.

Sea level: pressure term $(60{,}000 - 101{,}325) \times 0.68 \approx -2.81 \times 10^{4}\,\mathrm{N}$, so $T \approx 845\,\mathrm{kN}$. Then $v_e = 845{,}200 / 300 \approx 2817\,\mathrm{m/s}$ and $I_{sp} = 2817 / 9.80665 \approx 287\,\mathrm{s}$.

10 km: pressure term $(60{,}000 - 26{,}500) \times 0.68 \approx +2.28 \times 10^{4}\,\mathrm{N}$, so $T \approx 896\,\mathrm{kN}$. Already 6 % more thrust than at liftoff, with identical propellant consumption.

Vacuum: pressure term $60{,}000 \times 0.68 = 4.08 \times 10^{4}\,\mathrm{N}$, so $T \approx 914\,\mathrm{kN}$, $v_e \approx 3047\,\mathrm{m/s}$ and $I_{sp} \approx 311\,\mathrm{s}$.

The whole $69\,\mathrm{kN}$ difference between sea level and vacuum is $p_{a,0} A_e = 101{,}325 \times 0.68$. The mass flow did not change; neither did the gas velocity at the exit plane. What changed is how hard the atmosphere pushes back on the exit plane. (Public figures for the engine round to $282\,\mathrm{s}$ at sea level; the small discrepancy is in the rounding of the published thrust and flow rates, not in the physics.)
:::

## Integrating: the rocket equation

Return to the equation of motion and switch off the external force — free space, or a burn short enough that gravity and drag do little during it. Along the thrust direction,

$$
m\,\frac{dv}{dt} = |\dot{m}|\,v_e = -v_e\,\frac{dm}{dt}
\quad \Rightarrow \quad
dv = -v_e\,\frac{dm}{m}.
$$

This separates: the velocity gained depends only on the *fraction* of mass expelled, not on how fast it is expelled or how long the burn takes. With $v_e$ constant, integrate from initial mass $m_0$ to final mass $m_f$:

$$
\Delta v = v_e \ln\frac{m_0}{m_f} = I_{sp}\,g_0\,\ln\frac{m_0}{m_f}.
$$

This is the **rocket equation** (Tsiolkovsky's equation). Inverted, it gives the **mass ratio** needed for a given $\Delta v$, $m_0 / m_f = e^{\Delta v / v_e}$, and the **propellant mass fraction** $m_p / m_0 = 1 - e^{-\Delta v / v_e}$. The exponential is the whole problem of launch-vehicle design. To reach a $\Delta v$ equal to $v_e$ you must throw away 63 % of the vehicle; for $2 v_e$, 86 %; for $3 v_e$, 95 %. A LEO ascent needs about $9.4\,\mathrm{km/s}$ of ideal $\Delta v$ (lesson 7 explains why it is more than the $7.8\,\mathrm{km/s}$ of orbital speed). With kerosene–oxygen at $311\,\mathrm{s}$, $v_e \approx 3050\,\mathrm{m/s}$, that is $3.08\,v_e$ and a mass ratio of $e^{3.08} \approx 21.8$: the vehicle on the pad must be 21.8 times heavier than everything that reaches orbit, tanks and engines included. No single-stage structure has ever been built light enough; staging, which discards empty tanks part way, is how the exponential is beaten.

::: example The Falcon 9 first stage, ideal
A Falcon 9 lifts off at about $549\,\mathrm{t}$ and the first stage burns about $411\,\mathrm{t}$ of propellant. What is the stage's ideal $\Delta v$ — the velocity it would gain in free space — at sea-level and at vacuum $I_{sp}$?

The mass ratio is $m_0 / m_f = 549 / (549 - 411) = 549 / 138 \approx 3.98$, and $\ln 3.98 \approx 1.381$. At $I_{sp} = 282\,\mathrm{s}$, $v_e = 2765\,\mathrm{m/s}$ and $\Delta v = 2765 \times 1.381 \approx 3.82\,\mathrm{km/s}$. At $311\,\mathrm{s}$, $v_e = 3050\,\mathrm{m/s}$ and $\Delta v \approx 4.21\,\mathrm{km/s}$. The real burn starts at sea-level performance and ends near vacuum performance, so the ideal $\Delta v$ is about $4.0\,\mathrm{km/s}$.

Now include gravity, for a vertical burn, to see what the external force does. With $F_{\mathrm{ext}} = -mg$, the equation of motion is $m\,dv/dt = T - mg$, so $dv = -v_e\,dm/m - g\,dt$ and

$$
\Delta v = v_e \ln\frac{m_0}{m_f} - g\,t_b .
$$

At $|\dot{m}| \approx 2750\,\mathrm{kg/s}$ the burn lasts $t_b = 411{,}000 / 2750 \approx 149\,\mathrm{s}$, and $g t_b \approx 9.8 \times 149 \approx 1.46\,\mathrm{km/s}$ would be lost — more than a third of the ideal $\Delta v$ — if the stage flew straight up for the whole burn. This term depends on $t_b$, so a higher thrust-to-weight ratio (a shorter burn) loses less, and flying horizontally loses nothing. Lesson 7 makes the $g$ into $g\sin\gamma$ and shows how a gravity turn keeps the loss nearer $1.2\,\mathrm{km/s}$ for the whole ascent.
:::

::: example Propellant for a station-keeping budget
A $2000\,\mathrm{kg}$ satellite needs $100\,\mathrm{m/s}$ of $\Delta v$ over its life. How much propellant does that take with a hydrazine thruster at $I_{sp} = 220\,\mathrm{s}$, and with an ion thruster at $3000\,\mathrm{s}$?

Propellant is $m_p = m_0\left(1 - e^{-\Delta v / v_e}\right)$. Hydrazine: $v_e = 220 \times 9.80665 \approx 2157\,\mathrm{m/s}$, $\Delta v / v_e = 0.0464$, $m_p = 2000 \times (1 - e^{-0.0464}) \approx 90.6\,\mathrm{kg}$. Ion: $v_e \approx 29{,}420\,\mathrm{m/s}$, $\Delta v / v_e = 0.0034$, $m_p \approx 6.8\,\mathrm{kg}$. For small $\Delta v / v_e$ the exponential is nearly linear and $m_p \approx m_0 \Delta v / v_e$, which is the impulse relation $J = m\,\Delta v = m_p v_e$ of lesson 2 — the rocket equation reduces to impulse bookkeeping when the mass barely changes. The ion thruster saves $84\,\mathrm{kg}$; the price is thrust measured in tens of millinewtons and burns that last for weeks, for which the impulsive approximation fails and the full equation of motion must be integrated.
:::

## Checking it numerically

The equation of motion is a two-state ODE, $\dot{v} = T/m + F_{\mathrm{ext}}/m$ and $\dot{m} = -T/v_e$, and integrating it in free space must reproduce $v_e \ln(m_0/m_f)$ to integrator accuracy. This is the first test to write for any rocket simulation: switch off gravity and drag and check the logarithm.

```python
import math

def burn(m0, mp, thrust, v_e, dt=0.01):
    """Integrate m dv/dt = T, dm/dt = -T/v_e in free space (Euler)."""
    m, v = m0, 0.0
    while m > m0 - mp:
        v += thrust / m * dt
        m -= thrust / v_e * dt
    return v

v_e = 311 * 9.80665
print(burn(549e3, 411e3, 7.6e6, v_e), v_e * math.log(549 / 138))
# 4211.5...  4211.39...   -> agree to the step-size error of Euler
```

The mass flow, thrust and burn time all cancel out of the final speed, as the derivation said they must; only $v_e$ and the mass ratio survive. If your simulation's free-space $\Delta v$ depends on the thrust level, the mass is being differentiated somewhere it should not be.

## Check yourself

::: check
A cart of mass $500\,\mathrm{kg}$ rolls without friction at $3.0\,\mathrm{m/s}$ and leaks $2\,\mathrm{kg/s}$ of sand through a hole in its floor. What is its velocity after 60 s, and what does the naive $F = d(mv)/dt$ predict?
:::

::: answer
The sand leaves with zero velocity relative to the cart, so in the variable-mass equation $m\,dv/dt = F_{\mathrm{ext}} + \mathbf{u}\,dm/dt$ the relative velocity $\mathbf{u} = 0$ and $dv/dt = 0$: the cart is still at $3.0\,\mathrm{m/s}$ with $380\,\mathrm{kg}$ on board. Its momentum has fallen from $1500$ to $1140\,\mathrm{kg\,m/s}$, but the missing $360\,\mathrm{kg\,m/s}$ is carried by the sand on the road, still moving forward at $3.0\,\mathrm{m/s}$ in the instant it lands. The naive formula, $0 = m\,dv/dt + v\,dm/dt$, predicts $dv/dt = -v\dot{m}/m = 3.0 \times 2 / m > 0$: the cart would speed up as it emptied, with no force acting. That is the frame-dependent term doing damage in the simplest possible case.
:::

::: check
A stage with $v_e = 3050\,\mathrm{m/s}$ is travelling at $4000\,\mathrm{m/s}$ in ECI. In which direction is its exhaust moving in ECI, and does the engine still produce its full thrust?
:::

::: answer
The exhaust's inertial velocity is $v - v_e = 4000 - 3050 = +950\,\mathrm{m/s}$: it is moving *forward*, in the same direction as the vehicle, at nearly a kilometre per second. The thrust is unchanged at $|\dot{m}|\,v_e$, because the equation of motion depends only on the exhaust velocity relative to the vehicle. Every parcel of propellant leaves with $950\,\mathrm{m/s}$ of forward inertial velocity but $4000\,\mathrm{m/s}$ less than it had a moment earlier on board; that loss is what the vehicle gains. It is the Oberth effect of lesson 3 in momentum form.
:::

::: check
A second stage has $4\,\mathrm{t}$ of dry mass, carries $111\,\mathrm{t}$ of propellant, and delivers a $15\,\mathrm{t}$ payload with a vacuum $I_{sp}$ of $348\,\mathrm{s}$. What ideal $\Delta v$ can it deliver? How would the answer change if the payload were $30\,\mathrm{t}$?
:::

::: answer
$v_e = 348 \times 9.80665 \approx 3413\,\mathrm{m/s}$. Initial mass $130\,\mathrm{t}$, final mass $19\,\mathrm{t}$, so $\Delta v = 3413 \ln(130 / 19) \approx 3413 \times 1.923 \approx 6.56\,\mathrm{km/s}$. With a $30\,\mathrm{t}$ payload: $3413 \ln(145 / 34) \approx 3413 \times 1.450 \approx 4.95\,\mathrm{km/s}$. Doubling the payload costs $1.6\,\mathrm{km/s}$, because the mass ratio falls from $6.84$ to $4.26$ and the logarithm punishes that heavily.
:::

::: check
An engine's data sheet lists $845\,\mathrm{kN}$ at sea level and $914\,\mathrm{kN}$ in vacuum. A colleague concludes that the turbopump delivers 8 % more propellant in vacuum. Correct them, and estimate the nozzle exit area.
:::

::: answer
The mass flow is set by the pumps and injector upstream of the nozzle and does not depend on the ambient pressure; the exit velocity and exit pressure are set by the chamber and the nozzle geometry and do not depend on it either. Only the $-p_a A_e$ part of the pressure term $(p_e - p_a)A_e$ changes, so $T_{\mathrm{vac}} - T_{\mathrm{sl}} = p_{a,0} A_e$. Hence $A_e \approx 69{,}000 / 101{,}325 \approx 0.68\,\mathrm{m^2}$, an exit diameter of about $0.93\,\mathrm{m}$ — a plausible size for an engine of this class.
:::

::: check
A $2000\,\mathrm{kg}$ spacecraft in a 400 km circular orbit performs the $3.18\,\mathrm{km/s}$ escape burn of lesson 4 with an engine of $I_{sp} = 311\,\mathrm{s}$. How much of the spacecraft is propellant? Why may the rocket equation be applied directly, even though gravity acts throughout the burn?
:::

::: answer
$v_e = 3050\,\mathrm{m/s}$, so $m_p = 2000\,(1 - e^{-3180/3050}) = 2000\,(1 - e^{-1.043}) \approx 2000 \times 0.647 \approx 1294\,\mathrm{kg}$ — almost two-thirds of the spacecraft. The rocket equation ignores $F_{\mathrm{ext}}$, which is legitimate when the burn is short compared with the orbit so that gravity, which acts perpendicular to a tangential burn, does not change the speed appreciably during it. The correction is the gravity-loss integral of lesson 7, small for a chemical burn of a few minutes and large for an electric-propulsion spiral lasting months.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{F}_{\mathrm{ext}} = d\mathbf{P}/dt$ | applies to a fixed collection of matter; for a rocket, the vehicle plus the parcel about to leave |
| $d(m\mathbf{v})/dt = m\dot{\mathbf{v}} + \mathbf{v}\dot{m}$ applied to the vehicle alone | wrong: $\mathbf{v}\dot{m}$ is frame-dependent, predicts no liftoff in the rest frame and a self-accelerating leaking cart |
| $\mathbf{P}(t+dt) = (m - dm_e)(\mathbf{v} + d\mathbf{v}) + dm_e(\mathbf{v} - \mathbf{v}_e)$ | momentum of the fixed system after $dt$; the $\pm dm_e\mathbf{v}$ terms cancel |
| $m\,d\mathbf{v}/dt = \mathbf{F}_{\mathrm{ext}} + \lvert\dot{m}\rvert\,\mathbf{v}_e = \mathbf{F}_{\mathrm{ext}} + \mathbf{T}$ | equation of motion of a rocket; thrust is the momentum flux of the exhaust relative to the vehicle |
| $m\,d\mathbf{v}/dt = \mathbf{F}_{\mathrm{ext}} + \mathbf{u}\,dm/dt$ | general variable-mass body; $\mathbf{u}$ is the velocity of the gained or lost matter relative to the body |
| $F = \dot{m}\,v_{e,\mathrm{exit}} + (p_e - p_a)A_e$ | thrust equation with back pressure; $\dot{m}$, $v_{e,\mathrm{exit}}$ and $p_e$ are fixed upstream, only $p_a$ varies with altitude |
| $v_e = v_{e,\mathrm{exit}} + (p_e - p_a)A_e/\lvert\dot{m}\rvert$, $I_{sp} = v_e/g_0$ | effective exhaust velocity; $T_{\mathrm{vac}} - T_{\mathrm{sl}} = p_{a,0}A_e$ |
| $\Delta v = v_e \ln(m_0/m_f)$ | rocket equation, free space, constant $v_e$; independent of thrust level and burn time |
| $m_0/m_f = e^{\Delta v/v_e}$, $m_p/m_0 = 1 - e^{-\Delta v/v_e}$ | mass ratio and propellant fraction; about $21.8$ and 95 % for $9.4\,\mathrm{km/s}$ at $311\,\mathrm{s}$ |
| $\Delta v = v_e \ln(m_0/m_f) - g\,t_b$ | vertical burn under gravity: the first appearance of a gravity loss |

The next lesson keeps the external force switched on for a whole ascent. It writes the equation of motion along the flight path, integrates it into ideal $\Delta v$ minus gravity, drag and steering losses, puts numbers on each for a LEO launch, and explains why every orbital launcher flies a gravity turn.
