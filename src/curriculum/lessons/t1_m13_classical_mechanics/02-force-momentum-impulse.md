---
id: l02-force-momentum-impulse
title: Force, momentum and impulse
minutes: 20
covers:
  - force, momentum, impulse
---

Newton wrote his second law in terms of momentum, not acceleration, and rocketry is the branch of engineering where the difference stops being pedantic. Thrust *is* momentum leaving through a nozzle. The figure of merit for an engine, specific impulse, is a statement about how much momentum change you buy per unit of propellant. A separation event, a docking contact, a landing-leg touchdown and a reaction-control pulse are all analysed the same way: total up the momentum before, total it after, and let the messy details of the force-time history cancel.

This lesson builds that toolkit. It states the second law in the momentum form that survives everything this module throws at it, defines impulse and connects it to the propellant budget, and introduces the angular momentum of a particle — the quantity whose conservation makes an orbit planar and explains why a satellite crawls at apogee and sprints at perigee.

## Momentum and the second law for a system

The momentum of a particle is $\mathbf{p} = m\mathbf{v}$, in $\mathrm{kg\,m/s}$. For a collection of particles it is the vector sum, $\mathbf{P} = \sum_i m_i \mathbf{v}_i$. Newton's second law, applied to a fixed collection of matter in an inertial frame, says

$$
\mathbf{F}_{\mathrm{ext}} = \frac{d\mathbf{P}}{dt},
$$

where $\mathbf{F}_{\mathrm{ext}}$ is the sum of the *external* forces — forces exerted by things outside the collection. Internal forces do not appear: by the third law they come in equal and opposite pairs, both members of which act on matter inside the collection, so their sum is zero. (Lesson 5 goes through this cancellation in detail.)

Two consequences follow immediately. If the external force is zero, $\mathbf{P}$ is constant — **conservation of momentum**. And the law is only about the *total* momentum; it says nothing about how that momentum is shared among the parts. That is exactly what makes it useful for events whose internal details you neither know nor want to know: a spring-loaded separation, a bolt cutter, the crush of a landing leg.

The phrase "fixed collection of matter" has to be taken literally. The collection is chosen once, at the start of the analysis, and then followed; matter is not allowed to join or leave it. If you want the law to describe a rocket you must include in the collection every gram of propellant that will be expelled during the interval you study. This is the whole content of lesson 6, and it is worth stating now as a rule you never break.

::: key
Newton's second law in the form that survives variable mass: $\mathbf{F}_{\mathrm{ext}} = d\mathbf{p}/dt$, applied to a *fixed* system of matter. For a rocket you must include the momentum carried off by the exhaust; $\mathbf{F} = m\mathbf{a}$ applied to the shrinking vehicle alone is wrong.
:::

::: example Docking contact
A 20 t cargo vehicle closes on a 420 t space station at $0.10\,\mathrm{m/s}$ relative speed and latches on. Treat both as particles and the contact as internal to the pair. What is their common velocity afterward, in the frame where the station was initially at rest?

Nothing external acts during the fraction of a second the latches engage (gravity acts on both equally and cancels in relative motion over so short a time), so the total momentum of the pair is conserved:

$$
m_c v_c + m_s \cdot 0 = (m_c + m_s)\,v \quad \Rightarrow \quad v = \frac{2.0 \times 10^4 \times 0.10}{4.4 \times 10^5} \approx 4.5 \times 10^{-3}\,\mathrm{m/s}.
$$

The combined stack drifts at $4.5\,\mathrm{mm/s}$. Notice what we did *not* need: the stiffness of the latches, the duration of the contact, the peak load. Momentum conservation answers the "afterward" question without them. It does not answer everything, though. The kinetic energy before was $\tfrac{1}{2} \times 2.0 \times 10^4 \times 0.10^2 = 100\,\mathrm{J}$; afterward it is $\tfrac{1}{2} \times 4.4 \times 10^5 \times (4.5 \times 10^{-3})^2 \approx 4.5\,\mathrm{J}$. The missing $95\,\mathrm{J}$ went into deforming and heating the docking mechanism — a hint, taken up in lesson 3, that momentum and energy are conserved under different conditions.
:::

## Impulse

Integrate the second law over a time interval $t_1$ to $t_2$:

$$
\mathbf{J} \equiv \int_{t_1}^{t_2} \mathbf{F}\,dt = \mathbf{p}(t_2) - \mathbf{p}(t_1) = \Delta\mathbf{p}.
$$

The integral of force over time is the **impulse** $\mathbf{J}$, with units $\mathrm{N\,s} = \mathrm{kg\,m/s}$ — the same units as momentum, as it must be. For a body of constant mass, $\mathbf{J} = m\,\Delta\mathbf{v}$.

Impulse is the natural currency of events that are short compared with everything else in the problem. A reaction-control pulse lasts tens of milliseconds; the orbit it adjusts lasts ninety minutes. Over the pulse, gravity changes the velocity by a negligible amount and the position barely moves, so the pulse can be modelled as an instantaneous jump $\Delta\mathbf{v} = \mathbf{J}/m$ at a fixed position. This **impulsive approximation** is how nearly all orbital manoeuvres are planned: a burn is a $\Delta\mathbf{v}$ vector applied at a point, and the coast between burns is pure two-body motion. The approximation is good whenever the burn is much shorter than the orbital period, which is true for chemical propulsion and false for electric propulsion.

The same identity, read the other way, gives the *average* force over an interval: $\bar{\mathbf{F}} = \mathbf{J}/\Delta t$. That is what you get from momentum bookkeeping — an average, not a peak. Peak loads depend on the stiffness of whatever is doing the stopping and need a model of the contact.

::: example A reaction-control pulse
A 500 kg satellite fires a $400\,\mathrm{N}$ thruster for $0.50\,\mathrm{s}$. What velocity change results?

The impulse is $J = F\,\Delta t = 400 \times 0.50 = 200\,\mathrm{N\,s}$ (the force is essentially constant over such a short pulse). Then $\Delta v = J/m = 200/500 = 0.40\,\mathrm{m/s}$. Over the half second, gravity at LEO altitude changed the velocity by about $8.7 \times 0.5 \approx 4.3\,\mathrm{m/s}$ — larger than the pulse — but that change is the same whether or not the thruster fires, and in the two-body coast that follows it is already accounted for. What the thruster added, on top of the orbit the satellite was already on, is $0.40\,\mathrm{m/s}$ in the thrust direction.

Now the landing case. A 30 t first stage touches down at $2.0\,\mathrm{m/s}$ and is brought to rest as its legs crush over $0.30\,\mathrm{s}$. The impulse the ground must deliver is $J = m\,\Delta v = 3.0 \times 10^4 \times 2.0 = 6.0 \times 10^4\,\mathrm{N\,s}$, so the *average* net upward force during the crush is $J/\Delta t = 2.0 \times 10^5\,\mathrm{N}$, about $0.68\,g_0$ of deceleration. The legs also carry the stage's weight, $3.0 \times 10^4 \times 9.81 \approx 2.9 \times 10^5\,\mathrm{N}$, so the mean leg load is about $4.9 \times 10^5\,\mathrm{N}$. The peak is higher and depends on how the crush cores are designed; impulse alone cannot tell you it.
:::

## Total impulse and specific impulse

For an engine, the quantity that matters is the **total impulse** delivered over a burn,

$$
I_t = \int_0^{t_b} T\,dt,
$$

with $T$ the thrust and $t_b$ the burn time. Total impulse is what a mission buys: it is the momentum change available to the vehicle. Propellant is what a mission pays. The ratio of the two is the efficiency of the engine, and it is defined by dividing total impulse by the *weight* of propellant consumed, measured with standard gravity $g_0 = 9.80665\,\mathrm{m/s^2}$:

$$
I_{sp} = \frac{I_t}{m_p\, g_0}.
$$

Newton-seconds divided by newtons leaves seconds, so **specific impulse** $I_{sp}$ has units of seconds. The definition through weight rather than mass is a historical accident — it makes the number the same in metric and US customary units, since a pound-second per pound is a second just as a newton-second per newton is — but it is universal and you must be fluent in it.

For an engine running at constant thrust and constant mass flow rate $\dot{m}$ (in $\mathrm{kg/s}$, taken positive here), $I_t = T t_b$ and $m_p = \dot{m} t_b$, so

$$
I_{sp} = \frac{T}{\dot{m}\, g_0}, \qquad T = \dot{m}\, I_{sp}\, g_0 = \dot{m}\, v_e, \qquad v_e \equiv I_{sp}\, g_0.
$$

The quantity $v_e = I_{sp} g_0$ is the **effective exhaust velocity**, in $\mathrm{m/s}$. It is the speed at which the exhaust *would* have to leave to produce the measured thrust from the measured mass flow, and in lesson 6 you will see that it is the exhaust speed plus a correction for nozzle pressure. Thrust is mass flow times effective exhaust velocity: momentum per unit time leaving the nozzle, which is the second law read backwards. Whenever you need a physical picture, use $v_e$; whenever you read a datasheet, expect $I_{sp}$ in seconds; the conversion factor between them is $g_0$ and nothing else.

Typical magnitudes: a cold-gas thruster, $60$–$70\,\mathrm{s}$; a monopropellant hydrazine thruster, about $220\,\mathrm{s}$; a kerosene–oxygen engine such as Merlin 1D, about $282\,\mathrm{s}$ at sea level and $311\,\mathrm{s}$ in vacuum; hydrogen–oxygen, about $450\,\mathrm{s}$; an ion thruster, $2000$–$4000\,\mathrm{s}$ at tiny thrust. The corresponding $v_e$ runs from about $0.65\,\mathrm{km/s}$ to $40\,\mathrm{km/s}$.

::: key
Impulse: $J = \int F\,dt = \Delta p = m\,\Delta v$. Total impulse divided by propellant weight is specific impulse, $I_{sp} = I_t/(m_p g_0)$, in seconds; the effective exhaust velocity is $v_e = I_{sp} g_0$ and thrust is $T = \dot{m} v_e$.
:::

::: example Merlin 1D by the numbers
One Merlin 1D produces about $845\,\mathrm{kN}$ at sea level at a specific impulse of about $282\,\mathrm{s}$. Find the mass flow rate, the effective exhaust velocity, and the total impulse and propellant consumed in a 150 s burn at constant sea-level conditions.

Effective exhaust velocity: $v_e = I_{sp} g_0 = 282 \times 9.80665 \approx 2766\,\mathrm{m/s}$.

Mass flow: $\dot{m} = T / v_e = 8.45 \times 10^5 / 2766 \approx 306\,\mathrm{kg/s}$. Nine engines therefore consume about $2750\,\mathrm{kg/s}$, which is how a stage carrying about 410 t of propellant empties in roughly $150\,\mathrm{s}$.

Total impulse over 150 s: $I_t = T t_b = 8.45 \times 10^5 \times 150 \approx 1.27 \times 10^8\,\mathrm{N\,s}$. Propellant consumed: $m_p = \dot{m} t_b \approx 306 \times 150 \approx 4.58 \times 10^4\,\mathrm{kg}$, weighing $4.58 \times 10^4 \times 9.80665 \approx 4.50 \times 10^5\,\mathrm{N}$. Dividing, $I_{sp} = 1.27 \times 10^8 / 4.50 \times 10^5 \approx 282\,\mathrm{s}$, closing the loop on the definition.

In vacuum the same engine gives about $914\,\mathrm{kN}$ at $311\,\mathrm{s}$, so $v_e \approx 3050\,\mathrm{m/s}$ while $\dot{m}$ stays at about $300\,\mathrm{kg/s}$: the propellant flow is set upstream by the pumps and injector, and the extra thrust in vacuum comes from the nozzle. Lesson 6 explains exactly how.
:::

::: warning
Specific impulse in seconds is not a time. It does not tell you how long anything burns. Multiply by $g_0$ — always $9.80665\,\mathrm{m/s^2}$, never the local gravity, never the Moon's — to get the velocity $v_e$ that actually enters the equations of motion. Conversely, a "specific impulse" quoted in $\mathrm{m/s}$ or $\mathrm{N\,s/kg}$ is already $v_e$; do not multiply it by $g_0$ again.
:::

## Angular momentum of a particle

Take a particle with momentum $\mathbf{p}$ at position $\mathbf{r}$ relative to some fixed point $O$ in an inertial frame. Its **angular momentum about $O$** is the vector

$$
\mathbf{L} = \mathbf{r} \times \mathbf{p} = m\,\mathbf{r} \times \mathbf{v},
$$

with units $\mathrm{kg\,m^2/s}$. It is perpendicular to the plane containing $\mathbf{r}$ and $\mathbf{v}$, and its magnitude is $L = m\,r\,v \sin\phi$, where $\phi$ is the angle between $\mathbf{r}$ and $\mathbf{v}$. Only the component of velocity perpendicular to the radius contributes; purely radial motion has no angular momentum.

Differentiate, using the product rule for cross products:

$$
\frac{d\mathbf{L}}{dt} = \dot{\mathbf{r}} \times \mathbf{p} + \mathbf{r} \times \dot{\mathbf{p}} = \mathbf{v} \times m\mathbf{v} + \mathbf{r} \times \mathbf{F} = \mathbf{r} \times \mathbf{F}.
$$

The first term vanishes because a vector crossed with itself is zero; the second uses $\dot{\mathbf{p}} = \mathbf{F}$. The quantity $\boldsymbol{\tau} = \mathbf{r} \times \mathbf{F}$ is the **torque** (or moment) of the force about $O$. So the rate of change of angular momentum about a point equals the torque about that point — the rotational twin of $\mathbf{F} = d\mathbf{p}/dt$.

The payoff is conservation. If the torque about $O$ is zero, $\mathbf{L}$ about $O$ is constant. The most important case is a **central force**: one that always points along the line to $O$, so $\mathbf{F} = F(r)\,\hat{\mathbf{r}}$ and $\mathbf{r} \times \mathbf{F} = 0$ identically. Newtonian gravity from a spherical body is central about that body's centre. Therefore a satellite's angular momentum about the Earth's centre is conserved, from which two things follow. Because $\mathbf{L}$ is a fixed vector and $\mathbf{r}$ is always perpendicular to it, the orbit lies in a fixed plane. And because $L = m\,r\,v \sin\phi$ is constant, the satellite must move slower where it is farther away. At the two apsides, where the velocity is perpendicular to the radius ($\phi = 90°$), this reads $r_p v_p = r_a v_a$.

It is convenient to divide out the mass and speak of the **specific angular momentum** $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, in $\mathrm{m^2/s}$. Geometrically, $h/2$ is the rate at which the radius vector sweeps out area, so constant $h$ is Kepler's second law: equal areas in equal times.

::: key
Angular momentum of a particle about a point: $\mathbf{L} = \mathbf{r} \times \mathbf{p}$, and $d\mathbf{L}/dt = \mathbf{r} \times \mathbf{F} = \boldsymbol{\tau}$. Zero torque about a point means $\mathbf{L}$ about that point is conserved; a central force exerts zero torque about its centre.
:::

::: example Perigee to apogee
A geostationary transfer orbit has perigee altitude $300\,\mathrm{km}$ and apogee altitude $35{,}786\,\mathrm{km}$, so $r_p = 6678\,\mathrm{km}$ and $r_a = 42{,}164\,\mathrm{km}$. The perigee speed is $v_p \approx 10.15\,\mathrm{km/s}$. What is the apogee speed?

Gravity is central about the Earth's centre, so specific angular momentum is conserved. At both apsides $\phi = 90°$, hence

$$
v_a = \frac{r_p}{r_a}\,v_p = \frac{6678}{42{,}164} \times 10{,}151 \approx 1608\,\mathrm{m/s}.
$$

The spacecraft is more than six times slower at apogee than at perigee. The specific angular momentum itself is $h = r_p v_p = 6.678 \times 10^6 \times 10{,}151 \approx 6.78 \times 10^{10}\,\mathrm{m^2/s}$.

As a check of Kepler's second law, the areal rate is $h/2 \approx 3.39 \times 10^{10}\,\mathrm{m^2/s}$. The ellipse has semi-major axis $a = (r_p + r_a)/2 = 24{,}421\,\mathrm{km}$ and semi-minor axis $b = \sqrt{r_p r_a} \approx 16{,}780\,\mathrm{km}$, so its area is $\pi a b \approx 1.287 \times 10^{15}\,\mathrm{m^2}$. Dividing area by areal rate gives the period, $1.287 \times 10^{15} / 3.39 \times 10^{10} \approx 3.80 \times 10^4\,\mathrm{s}$, about $10.6\,\mathrm{h}$ — the familiar GTO period, obtained from angular momentum alone.
:::

### Which point, which frame

Angular momentum is always *about* a point, and torque is always about the same point. Change the point and both change. About the Earth's centre a satellite in a circular orbit has constant $\mathbf{L}$; about a ground station it does not, because gravity has a moment arm about the station. When you write $d\mathbf{L}/dt = \boldsymbol{\tau}$, say the point out loud. The natural choice is the centre of a central force, or — for systems of particles, in lesson 5 — the centre of mass.

Both $\mathbf{p}$ and $\mathbf{L}$ are frame-dependent: change to another inertial frame moving at constant velocity and both change, although the *laws* $\mathbf{F} = d\mathbf{p}/dt$ and $\boldsymbol{\tau} = d\mathbf{L}/dt$ hold in every inertial frame. Conservation statements, therefore, are statements about a chosen frame and point. An orbit simulation that checks angular momentum conservation must compute $\mathbf{r} \times \mathbf{v}$ with both vectors in the same inertial frame and $\mathbf{r}$ measured from the attracting centre; do it in a rotating frame and $\mathbf{h}$ will appear to drift when nothing is wrong.

::: warning
Momentum conservation requires *zero external force*, not zero external work or zero external torque. A satellite coasting in orbit does not conserve momentum — gravity keeps changing it — but it does conserve angular momentum about the Earth's centre, because gravity's torque about that point is zero. Learn which quantity each law protects and under what condition, and use the right one as a sanity check on a simulation.
:::

## Check yourself

::: check
A 2000 kg spacecraft needs a $0.10\,\mathrm{m/s}$ velocity correction using a $20\,\mathrm{N}$ thruster. What impulse is required, and how long must the thruster fire? Is the impulsive approximation reasonable for planning this burn?
:::

::: answer
$J = m\,\Delta v = 2000 \times 0.10 = 200\,\mathrm{N\,s}$. At constant $20\,\mathrm{N}$, $\Delta t = J/F = 200/20 = 10\,\mathrm{s}$. Ten seconds is a tiny fraction of any orbital period (about $5500\,\mathrm{s}$ in LEO), so the spacecraft moves a negligible fraction of its orbit during the burn and treating the correction as an instantaneous $\Delta v$ at a point is entirely reasonable.
:::

::: check
A solid rocket motor has a thrust profile that rises linearly from zero to $1.0\,\mathrm{MN}$ and falls linearly back to zero over a total burn of $20\,\mathrm{s}$. Its specific impulse is $250\,\mathrm{s}$. What total impulse does it deliver, and how much propellant does it carry?
:::

::: answer
Total impulse is the area under the thrust–time curve. A triangle of base $20\,\mathrm{s}$ and height $1.0 \times 10^6\,\mathrm{N}$ has area $I_t = \tfrac{1}{2} \times 20 \times 10^6 = 1.0 \times 10^7\,\mathrm{N\,s}$. From $I_{sp} = I_t/(m_p g_0)$, the propellant mass is $m_p = I_t/(I_{sp} g_0) = 10^7 / (250 \times 9.80665) \approx 4080\,\mathrm{kg}$. The shape of the profile did not matter for either answer; only its integral did.
:::

::: check
An engine's specific impulse is listed as $311\,\mathrm{s}$. Explain in one sentence what that number means physically, then convert it to an effective exhaust velocity.
:::

::: answer
It means the engine delivers $311$ newton-seconds of total impulse for every newton of propellant weight it consumes (weight measured at standard gravity) — equivalently, $311\,\mathrm{s}$ is how long one newton of propellant could sustain one newton of thrust. The effective exhaust velocity is $v_e = I_{sp} g_0 = 311 \times 9.80665 \approx 3050\,\mathrm{m/s}$; this, not the number in seconds, is what enters the rocket equation.
:::

::: check
A satellite is at $r = 7000\,\mathrm{km}$ from the Earth's centre moving at $7.5\,\mathrm{km/s}$, with its velocity making an angle of $80°$ with the radius vector. What is its specific angular momentum? Will this value change over the next orbit if the only force is Earth's (spherical) gravity? If the Earth's oblateness is added?
:::

::: answer
$h = r v \sin\phi = 7.0 \times 10^6 \times 7500 \times \sin 80° \approx 5.17 \times 10^{10}\,\mathrm{m^2/s}$. Under spherical gravity the force is central about the Earth's centre, the torque about that point is zero, and $\mathbf{h}$ — magnitude and direction — is exactly conserved. Oblateness adds a component of force that does not point at the centre, so the torque is no longer zero and $\mathbf{h}$ changes slowly: the orbit plane precesses. A simulation that includes oblateness should therefore *not* be checked against constant $\mathbf{h}$; the conservation check must match the force model.
:::

::: check
Two stages, of masses $30\,\mathrm{t}$ and $124\,\mathrm{t}$, are joined and coasting when a set of springs pushes them apart with a total impulse of $48\,\mathrm{kN\,s}$ on each. What are the two velocity changes, and what happens to the momentum of the pair?
:::

::: answer
The spring force is internal, so by the third law the two impulses are equal and opposite, and the total momentum of the pair is unchanged. The lighter stage receives $\Delta v_1 = 48{,}000 / 30{,}000 = 1.6\,\mathrm{m/s}$ backward and the heavier receives $\Delta v_2 = 48{,}000 / 124{,}000 \approx 0.39\,\mathrm{m/s}$ forward, for a relative separation speed of about $2.0\,\mathrm{m/s}$. Check: $30{,}000 \times (-1.6) + 124{,}000 \times 0.39 \approx 0$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{p} = m\mathbf{v}$, $\mathbf{P} = \sum m_i \mathbf{v}_i$ | momentum of a particle, of a system |
| $\mathbf{F}_{\mathrm{ext}} = d\mathbf{P}/dt$ | second law for a fixed collection of matter; internal forces cancel in pairs; $\mathbf{P}$ conserved when $\mathbf{F}_{\mathrm{ext}} = 0$ |
| $\mathbf{J} = \int \mathbf{F}\,dt = \Delta\mathbf{p} = m\,\Delta\mathbf{v}$ | impulse, in $\mathrm{N\,s}$; a short burn is an instantaneous $\Delta\mathbf{v}$ |
| $\bar{\mathbf{F}} = \mathbf{J}/\Delta t$ | momentum bookkeeping gives average force, never peak |
| $I_t = \int T\,dt$ | total impulse of a burn |
| $I_{sp} = I_t/(m_p g_0) = T/(\dot{m} g_0)$ | specific impulse, in seconds |
| $v_e = I_{sp} g_0$, $T = \dot{m} v_e$ | effective exhaust velocity; thrust is momentum flow |
| Merlin 1D | about $845\,\mathrm{kN}$ and $282\,\mathrm{s}$ at sea level, $914\,\mathrm{kN}$ and $311\,\mathrm{s}$ in vacuum, $\dot{m} \approx 300\,\mathrm{kg/s}$ |
| $\mathbf{L} = \mathbf{r} \times \mathbf{p}$, $d\mathbf{L}/dt = \mathbf{r} \times \mathbf{F} = \boldsymbol{\tau}$ | angular momentum of a particle about a point and its rate of change |
| central force | zero torque about its centre, so $\mathbf{L}$ is conserved; planar orbit, $r_p v_p = r_a v_a$ |
| $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ | specific angular momentum; $h/2$ is the areal rate (Kepler's second law) |

The next lesson integrates the second law over *distance* instead of time. That gives work and kinetic energy, the second great bookkeeping tool, and shows why the energy a rocket adds to its payload depends on how fast the payload is already moving.
