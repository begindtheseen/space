---
id: l02-variable-mass-and-thrust
title: "Variable-mass mechanics and the thrust equation"
minutes: 18
covers:
  - variable-mass Newtonian mechanics and the thrust term as momentum flux plus a pressure term
---

*"Write down Newton's second law for a rocket."* It is the most common opening move in this round, and it is a trap, because the obvious answer is wrong in a way that takes thirty seconds to expose and cannot be argued out of. A rocket is a variable-mass system. The form of the second law you learned — force equals mass times acceleration — was derived for a fixed collection of matter, and a rocket is not one: it is throwing away part of itself several hundred kilograms at a time.

The question is worth its popularity. It has a definite right answer, it is derivable in four lines, the derivation forces you to be explicit about your system boundary, and the result — the thrust term as a momentum flux plus a pressure term — is the foundation of everything else in this module. If you can produce it cleanly at a board, the next four lessons are bookkeeping.

This lesson derives the variable-mass momentum balance, turns it into the thrust equation including the pressure term, and defines the effective exhaust velocity and specific impulse that the rest of the curriculum uses. Everything here is done the way you would do it standing up: assumptions first, one line at a time, units carried.

## The system boundary is the whole problem

Newton's second law in its correct general form applies to a **fixed set of particles**. Written as $\mathbf{F} = d\mathbf{p}/dt$, the $\mathbf{p}$ on the right is the momentum of that same set of particles at every instant.

If you point at the rocket and call it the system, the set of particles changes from one instant to the next, and $d\mathbf{p}/dt$ for that shrinking set is not the applied force. Write $\mathbf{F} = d(m\mathbf{v})/dt = m\dot{\mathbf{v}} + \dot m\mathbf{v}$ and you get an apparent extra force $\dot m \mathbf{v}$ — which depends on the velocity of the vehicle in whatever frame you happened to choose. A force that changes when you change inertial frames is not a force. That is the whole objection, and it is worth having the sentence ready, because interviewers ask why the naive form fails, not only what the right one is.

The fix is to choose a system that does not lose particles: **the vehicle plus the propellant it is about to expel.** Follow that fixed set across a short interval $dt$, then take the limit.

::: warning The exhaust velocity is relative to the vehicle
$v_e$ is the speed of the exhaust *with respect to the nozzle*, not with respect to the ground. It is a property of the engine — chamber conditions, propellant chemistry, expansion ratio — and it does not change when the vehicle speeds up. Mixing the two frames is the commonest error in this derivation and it produces an equation in which a rocket on the pad has no thrust.
:::

## The variable-mass momentum balance

Take one dimension, along the flight direction. Assumptions, on the board first:

- The vehicle has mass $m(t)$ and velocity $v(t)$ in an inertial frame.
- Propellant leaves at a constant speed $v_e$ relative to the vehicle, directed backwards, so in the inertial frame it moves at $v - v_e$.
- All external forces — gravity, drag, anything else — are collected into $F_{\text{ext}}$.
- Second-order products of differentials are dropped.

At time $t$ the system is the vehicle plus the parcel of propellant it is about to eject, mass $m$ in total, all moving at $v$:

$$
p(t) = m v.
$$

During $dt$ the vehicle ejects a parcel of mass $-dm$, where $dm < 0$ is the change in the vehicle's mass. The vehicle is left with $m + dm$ at velocity $v + dv$; the parcel leaves at $v - v_e$. The same particles, now in two pieces:

$$
p(t + dt) = (m + dm)(v + dv) + (-dm)(v - v_e).
$$

Expand and cancel. The $mv$ terms cancel, the $v\,dm$ terms cancel, and $dm\,dv$ is second order:

$$
dp = m\,dv + v_e\,dm.
$$

Impulse equals change of momentum for the fixed set, $dp = F_{\text{ext}}\,dt$, so dividing by $dt$:

$$
m\frac{dv}{dt} = -v_e\frac{dm}{dt} + F_{\text{ext}}.
$$

That is the result. Because $dm/dt < 0$ while the engine runs, the first term on the right is positive — it pushes the vehicle forwards, and it is present whether or not the vehicle is moving, which is the frame-independence the naive form lacked.

::: key
Variable-mass momentum balance for a rocket: $m\,dv/dt = -v_e\,\dot m + F_{\text{ext}}$, where $v_e$ is the exhaust velocity relative to the vehicle and $\dot m < 0$ during a burn. The first term is thrust; $F_{\text{ext}}$ carries gravity, drag and any other applied force. It follows from applying $F = dp/dt$ to the vehicle *plus* the mass it expels, never to the vehicle alone.
:::

It is convenient to have a positive symbol for the propellant flow. Define $\dot m_e \equiv -\dot m > 0$, the mass flow rate out of the nozzle, in kilograms per second. The thrust from momentum flux is then

$$
T_{\text{mom}} = \dot m_e v_e,
$$

with units $\mathrm{kg/s} \times \mathrm{m/s} = \mathrm{kg\,m/s^2} = \mathrm{N}$. That units check takes two seconds and is worth saying out loud.

## The pressure term

The derivation above assumed the exhaust simply leaves. Real nozzles have a finite exit plane, and the gas crossing it is at some static pressure $p_e$ that is not generally equal to the ambient pressure $p_a$ outside the vehicle.

Think about the pressure forces on the vehicle's outer surface. If the whole closed surface sat at uniform ambient pressure, the net force would be zero — that is what "uniform pressure exerts no net force on a closed body" means. The nozzle exit plane is the one part of that surface that is not at $p_a$: it is at $p_e$. So the net pressure force is the difference acting over the exit area $A_e$:

$$
T_{\text{pres}} = (p_e - p_a)A_e.
$$

Adding the two contributions gives the thrust equation.

::: key
The full thrust equation: $T = \dot m_e v_e + (p_e - p_a)A_e$. The momentum flux term dominates. The pressure term is why sea-level and vacuum thrust differ, and why the nozzle expansion ratio is a design choice rather than "as large as possible".
:::

A nozzle is **under-expanded** when $p_e > p_a$ (the gas is still pushing outwards at the exit; the pressure term helps), **over-expanded** when $p_e < p_a$ (the term is negative and subtracts from thrust), and **perfectly expanded** at the one ambient pressure where $p_e = p_a$. A first-stage engine is designed over-expanded at sea level so that it is closer to ideal through most of the ascent; a vacuum engine has a large exit area because there is no ambient pressure to penalise it.

## Effective exhaust velocity and specific impulse

Two thrust terms are inconvenient for trajectory work, so they are collapsed into one number. Define the **effective exhaust velocity**

$$
c \equiv \frac{T}{\dot m_e} = v_e + \frac{(p_e - p_a)A_e}{\dot m_e},
$$

which has units of metres per second and, by construction, satisfies $T = \dot m_e c$ exactly. The **specific impulse** is the same quantity divided by standard gravity:

$$
I_{sp} = \frac{c}{g_0}, \qquad g_0 = 9.80665\,\mathrm{m/s^2},
$$

measured in seconds. Its only virtue is that it has the same numerical value in any unit system; its meaning is "effective exhaust velocity in disguise", and for every calculation in this module you should convert it back with $c = I_{sp}g_0$ immediately.

Both $c$ and $I_{sp}$ are functions of ambient pressure, so an engine has a sea-level value and a vacuum value, and quoting one without saying which is a mistake an interviewer will pick up.

::: example Sea-level and vacuum thrust of a representative engine
No real engine's numbers are asserted here — these are round figures chosen to be typical of a kerosene–oxygen first-stage engine, and the point is the structure of the calculation.

**Assumptions.** Propellant flow $\dot m_e = 300\,\mathrm{kg/s}$; nozzle exit velocity $v_e = 2900\,\mathrm{m/s}$; exit area $A_e = 0.90\,\mathrm{m^2}$; exit pressure $p_e = 60\,\mathrm{kPa}$; sea-level ambient $p_a = 101.3\,\mathrm{kPa}$.

**Momentum flux term.** $300 \times 2900 = 8.70 \times 10^5\,\mathrm{N}$, or 870 kN.

**Pressure term at sea level.** $(60 - 101.3) \times 0.90 = -37.2\,\mathrm{kN}$. Negative: the nozzle is over-expanded on the pad.

**Sea-level thrust.** $870 - 37.2 = 833\,\mathrm{kN}$. The pressure term costs $-37.2/833 = -0.045$, about 4.5 per cent.

**Vacuum.** Set $p_a = 0$: the pressure term becomes $60 \times 0.90 = 54.0\,\mathrm{kN}$, and $870 + 54.0 = 924\,\mathrm{kN}$.

**The ratio.** $924/833 = 1.11$ — eleven per cent more thrust in vacuum from the same engine at the same flow rate, with nothing changed but the air outside.

**Effective exhaust velocity and $I_{sp}$.** At sea level $c = 833\,000/300 = 2780\,\mathrm{m/s}$, so $I_{sp} = 2780/9.80665 = 283\,\mathrm{s}$. In vacuum $c = 924\,000/300 = 3080\,\mathrm{m/s}$ and $I_{sp} = 3080/9.80665 = 314\,\mathrm{s}$. A spread of about 31 seconds, which is entirely the pressure term.

**Sanity check.** Kerosene–oxygen engines sit in the 260–300 s range at sea level and 310–350 s in vacuum, so both numbers land where they should.
:::

::: example What the naive form predicts, and why it is absurd
Suppose you had written $F = d(mv)/dt$ for the vehicle alone and identified the extra term $\dot m v$ as the thrust.

Take the same engine, $\dot m = -300\,\mathrm{kg/s}$, and evaluate at two moments in the same flight.

On the pad, $v = 0$, so the predicted thrust is $-300 \times 0 = 0\,\mathrm{N}$. The vehicle would never leave the ground.

Later, at $v = 1000\,\mathrm{m/s}$, the prediction is $-300 \times 1000 = -3.00 \times 10^5\,\mathrm{N}$ — a 300 kN force pointing *backwards*, while the correct momentum-flux term is $+8.70 \times 10^5\,\mathrm{N}$ forwards at both moments.

The diagnosis to say out loud: the naive term is proportional to $v$, which is frame-dependent, so it cannot be a physical force. Changing to a frame moving with the vehicle would change the predicted thrust, and no real engine cares what frame you are watching it from. This is the cleanest available demonstration that the system boundary, not the algebra, was the error.
:::

::: example Where this nozzle is perfectly expanded
Continuing with $p_e = 60\,\mathrm{kPa}$: perfect expansion happens where the ambient pressure equals the exit pressure.

**Model.** An exponential atmosphere, $p = p_0 e^{-h/H}$, with $p_0 = 101.3\,\mathrm{kPa}$ and scale height $H = 7.6\,\mathrm{km}$ — a reasonable fit over the lowest ten kilometres and not a precise standard-atmosphere value.

**Solve.** $h = H\ln(p_0/p_e)$, and $\ln(101.3/60) = 0.524$, so $h = 7.6 \times 0.524 = 3.98\,\mathrm{km}$, about 4 km.

**Interpretation.** The engine is over-expanded from the pad to roughly 4 km, perfectly expanded there, and under-expanded above. The thrust rises monotonically with altitude from 833 kN to 924 kN, most of the rise happening in the first fifteen kilometres where the ambient pressure falls fastest.

**Sanity check.** At 4 km the model gives $101.3 \times e^{-0.526} = 59.9\,\mathrm{kPa}$, against about 62 kPa in the standard atmosphere — a three per cent error from a two-parameter model, which is the accuracy this kind of estimate is for.
:::

::: warning Do not write $\dot m$ where you mean $\dot m_e$
The vehicle's mass rate $\dot m$ is negative during a burn; the propellant flow $\dot m_e = -\dot m$ is positive. Both appear in the literature written as "$\dot m$", and a sign error here flips the direction of the thrust. At a board, define which one you are using in words the first time you write it, and never switch.
:::

## Check yourself

::: check
State the variable-mass momentum balance, then say in one sentence why $F = m\,dv/dt$ with a time-varying $m$ is not merely an approximation but wrong.
:::

::: answer
$m\,dv/dt = -v_e\dot m + F_{\text{ext}}$, with $v_e$ the exhaust velocity relative to the vehicle and $\dot m < 0$ during the burn.

It is wrong rather than approximate because $F = dp/dt$ holds for a fixed set of particles, and the vehicle alone is not one. Applying it to the vehicle alone throws away the momentum carried off by the exhaust, and the spurious term it produces, $\dot m v$, depends on the observer's frame — so it cannot be a force at all. Taking $dt$ smaller does not reduce the error, which is what distinguishes a wrong model from a coarse one.
:::

::: check
An engine flows $250\,\mathrm{kg/s}$ with an exit velocity of $3100\,\mathrm{m/s}$, an exit area of $1.2\,\mathrm{m^2}$ and an exit pressure of $25\,\mathrm{kPa}$. Find its sea-level and vacuum thrust, and its vacuum specific impulse.
:::

::: answer
Momentum flux: $250 \times 3100 = 7.75 \times 10^5\,\mathrm{N}$, or 775 kN.

Pressure term at sea level: $(25 - 101.3) \times 1.2 = -91.6\,\mathrm{kN}$. Sea-level thrust $775 - 91.6 = 683\,\mathrm{kN}$.

In vacuum: $25 \times 1.2 = 30.0\,\mathrm{kN}$, so $775 + 30.0 = 805\,\mathrm{kN}$.

Vacuum effective exhaust velocity $c = 805\,000/250 = 3220\,\mathrm{m/s}$, so $I_{sp} = 3220/9.80665 = 328\,\mathrm{s}$.

Worth noticing: the low exit pressure and large exit area mean this nozzle is heavily over-expanded at sea level, losing $91.6/775 = 0.118$ — nearly twelve per cent of its momentum thrust on the pad. That is the signature of a vacuum-optimised nozzle, and flying one at sea level is why upper-stage engines are not used as boosters.
:::

::: check
Why does a launch vehicle's thrust increase as it climbs, even at constant propellant flow and constant chamber conditions?
:::

::: answer
Only the pressure term changes. $T = \dot m_e v_e + (p_e - p_a)A_e$, and of the four quantities on the right only $p_a$ is a function of altitude. As the vehicle climbs, $p_a$ falls towards zero, so $(p_e - p_a)A_e$ rises by exactly $p_{a,\text{sea level}}A_e$ between the pad and vacuum.

For the example engine that is $101.3 \times 0.90 = 91.2\,\mathrm{kN}$ of extra thrust, which is the $924 - 833 = 91\,\mathrm{kN}$ difference computed above. The momentum flux term is untouched, because $\dot m_e$ and $v_e$ are set by chamber pressure, throat area and nozzle geometry, none of which knows about the atmosphere.
:::

::: check
An interviewer says: "Your thrust equation has a pressure term. Why can I ignore the pressure everywhere else on the vehicle?"
:::

::: answer
Because a uniform pressure over a closed surface produces no net force, so the ambient pressure integrates to zero over the whole vehicle — and the nozzle exit plane is the single place where the surface pressure is not ambient.

The cleanest way to say it at a board: imagine sealing the nozzle exit with a massless cap at ambient pressure. Then the vehicle is a closed body in a uniform pressure field and feels no net pressure force. Removing the cap replaces $p_a$ over that area with $p_e$, and the difference $(p_e - p_a)A_e$ is the entire pressure contribution to thrust.

This also answers the follow-up "what about drag?" — drag is not a uniform-pressure effect. It comes from the flow field around a moving vehicle and belongs in $F_{\text{ext}}$, not in $T$.
:::

::: check
An engine is quoted at $I_{sp} = 340\,\mathrm{s}$ with a thrust of $800\,\mathrm{kN}$. What is its propellant flow rate, and what must you ask before using either number?
:::

::: answer
$c = I_{sp}g_0 = 340 \times 9.80665 = 3334\,\mathrm{m/s}$, and $\dot m_e = T/c = 800\,000/3334 = 240\,\mathrm{kg/s}$.

The question to ask is **sea level or vacuum**. Both $T$ and $I_{sp}$ are functions of ambient pressure, and the pair must come from the same condition — a vacuum $I_{sp}$ with a sea-level thrust gives a flow rate that is wrong by the ratio of the two, ten per cent or more. If the figures are a matched pair, the flow rate is the same either way, because $\dot m_e = T/(I_{sp}g_0)$ and both numerator and denominator shift together; mixing conditions is what breaks it.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $m\,dv/dt = -v_e\dot m + F_{\text{ext}}$ | Variable-mass momentum balance; $\dot m < 0$ during a burn |
| $\dot m_e = -\dot m$ | Propellant mass flow rate, positive, $\mathrm{kg/s}$ |
| $v_e$ | Exhaust velocity relative to the vehicle, $\mathrm{m/s}$ |
| $T = \dot m_e v_e + (p_e - p_a)A_e$ | Thrust: momentum flux plus pressure term |
| $p_e, p_a, A_e$ | Nozzle exit pressure, ambient pressure, nozzle exit area |
| $c = T/\dot m_e$ | Effective exhaust velocity, $\mathrm{m/s}$ |
| $I_{sp} = c/g_0$, $g_0 = 9.80665\,\mathrm{m/s^2}$ | Specific impulse, seconds |
| Over- / under-expanded | $p_e < p_a$ / $p_e > p_a$; perfectly expanded where they are equal |
| Representative engine | 870 kN momentum flux; 833 kN at sea level, 924 kN in vacuum |

The next lesson integrates the momentum balance with $F_{\text{ext}} = 0$ and gets the rocket equation, which is the single most-asked derivation in the whole round — and then lists, one by one, everything that the integration quietly assumed.
