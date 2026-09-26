---
id: l02-force-momentum-impulse
title: Force, momentum and impulse
minutes: 24
covers:
  - force, momentum, impulse
---

Catch a raw egg. If you hold your hands stiff, it breaks. If you let your hands sink back as it lands, it survives. Either way the egg goes from moving to stopped, so the same total "stopping" happens. What changes is how long it takes — and so how hard the push is. That trade between force and time is this lesson.

Newton wrote his second law in terms of momentum, not acceleration, and rocketry is where the difference really matters. Thrust *is* momentum leaving through a nozzle. The number engines are graded by, specific impulse, says how much change of momentum you buy with each kilogram of propellant. Stage separation, docking, a landing-leg touchdown and a steering-jet pulse are all worked the same way: add up the momentum before, add it up after, and let the messy details in between cancel.

This lesson builds that toolkit. It states the second law in the momentum form, defines impulse and connects it to the propellant budget, and introduces the angular momentum of a particle — the quantity that keeps an orbit flat and explains why a satellite crawls when far from Earth and races when close.

## Momentum and the second law for a system

A bowling ball and a tennis ball roll toward you at the same speed. You know which one is harder to stop. **Momentum** measures that: mass times velocity, $\mathbf{p} = m\mathbf{v}$, in $\mathrm{kg\,m/s}$. For a collection of particles, the total momentum is the vector sum, $\mathbf{P} = \sum_i m_i \mathbf{v}_i$. (The $\sum_i$, read "sum over i", means add up the term for every particle $i$.)

Newton's second law, applied to a fixed collection of matter in an inertial frame, says

$$
\mathbf{F}_{\mathrm{ext}} = \frac{d\mathbf{P}}{dt}.
$$

Here $\mathbf{F}_{\mathrm{ext}}$ is the sum of the **external** forces — pushes and pulls from things outside the collection. **Internal** forces, between parts of the collection, do not appear. By the third law they come in equal and opposite pairs, and both members of each pair act inside the collection, so they [[add to zero|internal-pairs]]. (Lesson 5 works through this in detail.)

Two things follow. If the external force is zero, $\mathbf{P}$ stays constant — **conservation of momentum**. And the law is only about the *total*. It says nothing about how momentum is shared among the parts. That is exactly what makes it useful for events whose inner details you neither know nor want: a spring-loaded separation, a bolt cutter, the crush of a landing leg.

Take "fixed collection of matter" literally. You pick the collection once, at the start, and follow it. Matter may not join or leave. To describe a rocket, the collection must include every gram of propellant that will leave during the time you study. This is the whole content of lesson 6, and it is a rule you never break.

::: key
Newton's second law in the form that survives variable mass: $\mathbf{F}_{\mathrm{ext}} = d\mathbf{p}/dt$, applied to a *fixed* system of matter. For a rocket you must include the momentum carried off by the exhaust; $\mathbf{F} = m\mathbf{a}$ applied to the shrinking vehicle alone is wrong.
:::

::: example Docking contact
A 20 t cargo vehicle closes on a 420 t space station at $0.10\,\mathrm{m/s}$ and latches on. Treat both as particles. How fast does the joined pair move afterward, in the frame where the station started at rest?

**What acts.** During the split second the latches close, nothing external matters. (Gravity pulls on both equally, so it does not change their motion relative to each other over so short a time.) So the pair's total momentum is conserved.

**Before equals after.** Cargo momentum plus station momentum (zero) equals the joined mass times the new speed:

$$
m_c v_c + m_s \cdot 0 = (m_c + m_s)\,v \quad \Rightarrow \quad v = \frac{2.0 \times 10^4 \times 0.10}{4.4 \times 10^5} \approx 4.5 \times 10^{-3}\,\mathrm{m/s}.
$$

We divided both sides by the total mass, $20 + 420 = 440\,\mathrm{t}$.

**Sanity check.** The stack drifts at $4.5\,\mathrm{mm/s}$, much slower than $0.10\,\mathrm{m/s}$, as it should be: the same momentum is now spread over 22 times the mass.

We never needed the latch stiffness, the contact time or the peak load. Momentum answers the "afterward" question without them. It does not answer everything, though. The kinetic energy before was $\tfrac{1}{2} \times 2.0 \times 10^4 \times 0.10^2 = 100\,\mathrm{J}$. Afterward it is $\tfrac{1}{2} \times 4.4 \times 10^5 \times (4.5 \times 10^{-3})^2 \approx 4.5\,\mathrm{J}$. The missing $95\,\mathrm{J}$ went into bending and heating the docking mechanism — a hint, taken up in lesson 3, that momentum and energy are conserved under different conditions.
:::

## Impulse

Back to the egg. The total push needed to stop it is fixed by its momentum. Spread that push over a longer time and the force is smaller. The total push is called impulse.

Add up (integrate) the second law over a time interval from $t_1$ to $t_2$:

$$
\mathbf{J} \equiv \int_{t_1}^{t_2} \mathbf{F}\,dt = \mathbf{p}(t_2) - \mathbf{p}(t_1) = \Delta\mathbf{p}.
$$

The integral of force over time is the **impulse** $\mathbf{J}$. On a graph of force against time, it is the [[area under the curve|area-under-curve]]. Its unit is $\mathrm{N\,s}$ (newton-seconds), the same as $\mathrm{kg\,m/s}$ — the same unit as momentum, as it must be. $\Delta$ (read "delta") means "change in". For a body of constant mass, $\mathbf{J} = m\,\Delta\mathbf{v}$.

Impulse is the natural currency of events that are short compared with everything else. A steering-jet pulse lasts tens of milliseconds; the orbit it adjusts lasts ninety minutes. During the pulse, gravity barely changes the velocity and the position barely moves. So the pulse can be modeled as an instant jump, $\Delta\mathbf{v} = \mathbf{J}/m$, at one fixed spot. This **[[impulsive approximation|impulsive-burn]]** is how nearly all orbital maneuvers are planned: a burn is a $\Delta\mathbf{v}$ (read "delta-v") applied at a point, and the coast between burns is pure orbit. It works when the burn is much shorter than the orbit — true for chemical rockets, false for electric propulsion.

Read the other way, the same identity gives the *average* force over an interval: $\bar{\mathbf{F}} = \mathbf{J}/\Delta t$ (the bar means "average"). Momentum bookkeeping gives an average, never a peak. The peak depends on how stiff the thing doing the stopping is, and needs a model of the contact.

::: example A steering pulse and a landing
**The pulse.** A 500 kg satellite fires a $400\,\mathrm{N}$ thruster for $0.50\,\mathrm{s}$. The force is steady over such a short pulse, so the impulse is force times time: $J = F\,\Delta t = 400 \times 0.50 = 200\,\mathrm{N\,s}$. The velocity change is $\Delta v = J/m = 200/500 = 0.40\,\mathrm{m/s}$.

Over that half second, gravity in low orbit changed the velocity by about $8.7 \times 0.5 \approx 4.3\,\mathrm{m/s}$ — more than the pulse! But that change happens whether or not the thruster fires, and the orbit coast already accounts for it. What the thruster *added* is $0.40\,\mathrm{m/s}$ in the thrust direction.

**The landing.** A 30 t first stage touches down at $2.0\,\mathrm{m/s}$, and its legs crush over $0.30\,\mathrm{s}$ to bring it to rest. The ground must deliver $J = m\,\Delta v = 3.0 \times 10^4 \times 2.0 = 6.0 \times 10^4\,\mathrm{N\,s}$. Dividing by the time, the *average* net upward force during the crush is $J/\Delta t = 6.0 \times 10^4 / 0.30 = 2.0 \times 10^5\,\mathrm{N}$. That is a deceleration of $2.0 \times 10^5 / 3.0 \times 10^4 \approx 6.7\,\mathrm{m/s^2}$, about $0.68\,g_0$.

The legs also hold up the stage's weight, $3.0 \times 10^4 \times 9.81 \approx 2.9 \times 10^5\,\mathrm{N}$. So the average leg load is $2.0 \times 10^5 + 2.9 \times 10^5 \approx 4.9 \times 10^5\,\mathrm{N}$.

**Sanity check.** The load is more than the stage's weight, as it must be to slow it down. The peak is higher still and depends on how the [[crush cores|crush-core]] are built — impulse alone cannot tell you.
:::

## Total impulse and specific impulse

A car is graded by how far it goes on a gallon of gas. A rocket engine is graded by how much push it gets out of its propellant.

The **total impulse** of a burn is the thrust added up over the burn time:

$$
I_t = \int_0^{t_b} T\,dt,
$$

with $T$ the thrust and $t_b$ the burn time. Total impulse is what a mission buys: the momentum change available to the vehicle. Propellant is what it pays. The ratio grades the engine. By tradition it divides total impulse by the *weight* of propellant used, measured with standard gravity $g_0 = 9.80665\,\mathrm{m/s^2}$:

$$
I_{sp} = \frac{I_t}{m_p\, g_0}.
$$

Here $m_p$ is the propellant mass. Newton-seconds divided by newtons leaves seconds, so **specific impulse** $I_{sp}$ (read "I s p") is measured in seconds. Dividing by weight rather than mass is [[a historical accident|why-seconds]], but it is universal and you must be fluent in it.

Now suppose the engine runs at steady thrust and steady **mass flow rate** $\dot{m}$ (read "m dot": kilograms of propellant per second, counted positive here). Then $I_t = T t_b$ and $m_p = \dot{m} t_b$. The $t_b$ cancels, and rearranging gives three linked forms:

$$
I_{sp} = \frac{T}{\dot{m}\, g_0}, \qquad T = \dot{m}\, I_{sp}\, g_0 = \dot{m}\, v_e, \qquad v_e \equiv I_{sp}\, g_0.
$$

The speed $v_e = I_{sp} g_0$ is the **effective exhaust velocity**, in $\mathrm{m/s}$. It is how fast the exhaust *would* have to leave to give the measured thrust from the measured mass flow. Lesson 6 shows it is the real exhaust speed plus a correction for pressure at the nozzle. Thrust is mass flow times effective exhaust velocity: the momentum leaving the nozzle each second — the second law read backward. For a physical picture, use $v_e$. On a datasheet, expect $I_{sp}$ in seconds. The only conversion factor between them is $g_0$.

Typical values:

- a cold-gas thruster (squirting stored gas): $60$–$70\,\mathrm{s}$;
- a hydrazine monopropellant thruster: about $220\,\mathrm{s}$;
- a kerosene–oxygen engine such as Merlin 1D: about $282\,\mathrm{s}$ at sea level, $311\,\mathrm{s}$ in vacuum;
- hydrogen–oxygen: about $450\,\mathrm{s}$;
- an [[ion thruster|ion-thruster]]: $2000$–$4000\,\mathrm{s}$, at tiny thrust.

The matching $v_e$ runs from about $0.65\,\mathrm{km/s}$ to $40\,\mathrm{km/s}$.

::: key
Impulse: $J = \int F\,dt = \Delta p = m\,\Delta v$. Total impulse divided by propellant weight is specific impulse, $I_{sp} = I_t/(m_p g_0)$, in seconds; the effective exhaust velocity is $v_e = I_{sp} g_0$ and thrust is $T = \dot{m} v_e$.
:::

::: example Merlin 1D by the numbers
One Merlin 1D makes about $845\,\mathrm{kN}$ at sea level with a specific impulse of about $282\,\mathrm{s}$. Find its effective exhaust velocity, its mass flow rate, and the total impulse and propellant used in a 150 s burn at sea-level conditions.

**Exhaust velocity.** $v_e = I_{sp} g_0 = 282 \times 9.80665 \approx 2766\,\mathrm{m/s}$.

**Mass flow.** From $T = \dot{m} v_e$, $\dot{m} = T / v_e = 8.45 \times 10^5 / 2766 \approx 306\,\mathrm{kg/s}$. Nine engines use about $9 \times 306 \approx 2750\,\mathrm{kg/s}$. That is how a stage holding about 410 t of propellant empties in roughly $410{,}000 / 2750 \approx 150\,\mathrm{s}$.

**Total impulse.** $I_t = T t_b = 8.45 \times 10^5 \times 150 \approx 1.27 \times 10^8\,\mathrm{N\,s}$.

**Propellant.** $m_p = \dot{m} t_b \approx 306 \times 150 \approx 4.58 \times 10^4\,\mathrm{kg}$, which weighs $4.58 \times 10^4 \times 9.80665 \approx 4.49 \times 10^5\,\mathrm{N}$.

**Sanity check.** Divide: $I_{sp} = 1.27 \times 10^8 / 4.49 \times 10^5 \approx 282\,\mathrm{s}$. We got back the number we started with, closing the loop on the definition.

**In vacuum** the same engine gives about $914\,\mathrm{kN}$ at $311\,\mathrm{s}$. So $v_e \approx 3050\,\mathrm{m/s}$, while $\dot{m} = 914{,}000 / 3050 \approx 300\,\mathrm{kg/s}$ — nearly unchanged. The pumps and injector set the propellant flow; the extra thrust in vacuum comes from the nozzle. Lesson 6 explains exactly how.
:::

::: warning
Specific impulse in seconds is not a time. It does not tell you how long anything burns. Multiply by $g_0$ — always $9.80665\,\mathrm{m/s^2}$, never the local gravity, never the Moon's — to get the $v_e$ that goes into the equations of motion. And if a "specific impulse" is quoted in $\mathrm{m/s}$ or $\mathrm{N\,s/kg}$, it is already $v_e$. Do not multiply by $g_0$ again.
:::

## Angular momentum of a particle

Swing a ball on a string around a pole. As the string wraps around the pole and gets shorter, the ball whips around faster. A spinning ice skater pulling in her arms does the same. The quantity that stays fixed is angular momentum.

Take a particle with momentum $\mathbf{p}$ at position $\mathbf{r}$, measured from a fixed point $O$ in an inertial frame. Its **angular momentum about $O$** is

$$
\mathbf{L} = \mathbf{r} \times \mathbf{p} = m\,\mathbf{r} \times \mathbf{v},
$$

in $\mathrm{kg\,m^2/s}$. The $\times$ is the **[[cross product|cross-product]]**: it makes a new vector perpendicular to both $\mathbf{r}$ and $\mathbf{v}$. Its size is $L = m\,r\,v \sin\phi$, where $\phi$ (read "phi") is the angle between $\mathbf{r}$ and $\mathbf{v}$. Only the part of the velocity across the radius counts. Motion straight toward or away from $O$ has no angular momentum.

How does $\mathbf{L}$ change? Use the product rule, which works for cross products as long as you keep the order:

$$
\frac{d\mathbf{L}}{dt} = \dot{\mathbf{r}} \times \mathbf{p} + \mathbf{r} \times \dot{\mathbf{p}} = \mathbf{v} \times m\mathbf{v} + \mathbf{r} \times \mathbf{F} = \mathbf{r} \times \mathbf{F}.
$$

Step one is the product rule. Step two swaps $\dot{\mathbf{r}}$ for $\mathbf{v}$ and $\dot{\mathbf{p}}$ for $\mathbf{F}$ (the second law). Step three drops $\mathbf{v} \times m\mathbf{v}$, because a vector crossed with itself (or anything parallel to it) is zero. The quantity $\boldsymbol{\tau} = \mathbf{r} \times \mathbf{F}$ (read "tau") is the **torque** of the force about $O$ — how hard it twists. So the rate of change of angular momentum about a point equals the torque about that point. It is the turning twin of $\mathbf{F} = d\mathbf{p}/dt$.

The payoff is conservation. If the torque about $O$ is zero, $\mathbf{L}$ about $O$ stays constant. The key case is a **central force**, one that always points along the line to $O$. Then $\mathbf{F} = F(r)\,\hat{\mathbf{r}}$ is parallel to $\mathbf{r}$, and $\mathbf{r} \times \mathbf{F} = 0$ every time. Gravity from a round body is central about its center. So a satellite's angular momentum about the Earth's center is conserved, and two things follow.

- **The orbit is flat.** $\mathbf{L}$ is a fixed arrow, and $\mathbf{r}$ is always perpendicular to it. So $\mathbf{r}$ stays in one fixed plane.
- **Far means slow.** $L = m\,r\,v \sin\phi$ is constant, so the satellite must move slower where $r$ is bigger. At the closest point (**perigee**) and farthest point (**apogee**) — the two **apsides** — the velocity is square to the radius ($\phi = 90^\circ$, $\sin\phi = 1$), so $r_p v_p = r_a v_a$.

Dividing out the mass gives the **specific angular momentum** $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, in $\mathrm{m^2/s}$. Its half, $h/2$, is the rate at which the line from Earth to satellite sweeps out area. So constant $h$ is [[Kepler's second law|kepler-areas]]: equal areas in equal times.

::: note Why h/2 is the area rate
In a short time $dt$ the satellite moves $\mathbf{v}\,dt$. The line from the center sweeps a thin triangle with sides $\mathbf{r}$ and $\mathbf{v}\,dt$. A triangle's area is half the size of the cross product of two of its sides: $dA = \tfrac{1}{2}|\mathbf{r} \times \mathbf{v}\,dt| = \tfrac{1}{2} h\,dt$. Divide by $dt$: $dA/dt = h/2$.
:::

::: key
Angular momentum of a particle about a point: $\mathbf{L} = \mathbf{r} \times \mathbf{p}$, and $d\mathbf{L}/dt = \mathbf{r} \times \mathbf{F} = \boldsymbol{\tau}$. Zero torque about a point means $\mathbf{L}$ about that point is conserved; a central force exerts zero torque about its center.
:::

::: example Perigee to apogee
A geostationary transfer orbit (GTO) — the stretched orbit that carries satellites up toward the 36,000 km ring — has perigee altitude $300\,\mathrm{km}$ and apogee altitude $35{,}786\,\mathrm{km}$. Adding Earth's radius, $r_p = 6678\,\mathrm{km}$ and $r_a = 42{,}164\,\mathrm{km}$. The perigee speed is $v_p \approx 10.15\,\mathrm{km/s}$. What is the apogee speed?

**Conservation.** Gravity is central, so $h$ is conserved. At both apsides $\phi = 90^\circ$, so $r_p v_p = r_a v_a$. Divide by $r_a$:

$$
v_a = \frac{r_p}{r_a}\,v_p = \frac{6678}{42{,}164} \times 10{,}151 \approx 1608\,\mathrm{m/s}.
$$

The spacecraft is more than six times slower at apogee — as it must be, being more than six times farther out. The specific angular momentum is $h = r_p v_p = 6.678 \times 10^6 \times 10{,}151 \approx 6.78 \times 10^{10}\,\mathrm{m^2/s}$.

**Check with Kepler.** The area rate is $h/2 \approx 3.39 \times 10^{10}\,\mathrm{m^2/s}$. The ellipse has semi-major axis (half its long width) $a = (r_p + r_a)/2 = 24{,}421\,\mathrm{km}$ and semi-minor axis $b = \sqrt{r_p r_a} \approx 16{,}780\,\mathrm{km}$, so its area is $\pi a b \approx 1.287 \times 10^{15}\,\mathrm{m^2}$. Area divided by area rate is the time for one lap: $1.287 \times 10^{15} / 3.39 \times 10^{10} \approx 3.80 \times 10^4\,\mathrm{s}$, about $10.6\,\mathrm{h}$ — the familiar GTO period, from angular momentum alone.
:::

### Which point, which frame

Angular momentum is always *about* a point, and torque about the same point. Change the point and both change. About the Earth's center, a satellite in circular orbit has constant $\mathbf{L}$. About a ground station it does not, because gravity has a lever arm about the station. When you write $d\mathbf{L}/dt = \boldsymbol{\tau}$, say the point out loud. The natural choice is the center of a central force, or — for systems of particles in lesson 5 — the center of mass.

Both $\mathbf{p}$ and $\mathbf{L}$ depend on the frame. Switch to another inertial frame and both change, although the *laws* $\mathbf{F} = d\mathbf{p}/dt$ and $\boldsymbol{\tau} = d\mathbf{L}/dt$ hold in every inertial frame. So a conservation check needs a chosen frame and point. An orbit simulation that checks angular momentum must compute $\mathbf{r} \times \mathbf{v}$ with both vectors in the same inertial frame and $\mathbf{r}$ measured from the attracting center. Do it in a rotating frame and $\mathbf{h}$ will seem to drift when nothing is wrong.

::: warning
Momentum conservation needs *zero external force* — not zero external work, not zero torque. A satellite coasting in orbit does not conserve momentum: gravity keeps changing it. It does conserve angular momentum about the Earth's center, because gravity's torque about that point is zero. Learn which quantity each law protects, and when, and use the right one to check a simulation.
:::

## Check yourself

::: check
A 2000 kg spacecraft needs a $0.10\,\mathrm{m/s}$ velocity correction from a $20\,\mathrm{N}$ thruster. What impulse is needed, and how long must the thruster fire? Is the impulsive approximation reasonable here?
:::

::: answer
Impulse: $J = m\,\Delta v = 2000 \times 0.10 = 200\,\mathrm{N\,s}$. At a steady $20\,\mathrm{N}$, the firing time is $\Delta t = J/F = 200/20 = 10\,\mathrm{s}$.

Ten seconds is a tiny slice of an orbit (about $5500\,\mathrm{s}$ in low Earth orbit), so the spacecraft barely moves along its path during the burn. Treating it as an instant $\Delta v$ at one point is entirely reasonable.
:::

::: check
A solid rocket motor's thrust rises in a straight line from zero to $1.0\,\mathrm{MN}$, then falls in a straight line back to zero, over a total burn of $20\,\mathrm{s}$. Its specific impulse is $250\,\mathrm{s}$. What total impulse does it deliver, and how much propellant does it carry?
:::

::: answer
Total impulse is the area under the thrust–time graph. That graph is a triangle with base $20\,\mathrm{s}$ and height $1.0 \times 10^6\,\mathrm{N}$, so $I_t = \tfrac{1}{2} \times 20 \times 10^6 = 1.0 \times 10^7\,\mathrm{N\,s}$.

Rearranging $I_{sp} = I_t/(m_p g_0)$ for the propellant mass: $m_p = I_t/(I_{sp} g_0) = 10^7 / (250 \times 9.80665) \approx 4080\,\mathrm{kg}$.

The shape of the thrust curve mattered for neither answer — only its area did.
:::

::: check
An engine's specific impulse is listed as $311\,\mathrm{s}$. Say in one sentence what that means physically, then convert it to an effective exhaust velocity.
:::

::: answer
The engine delivers $311$ newton-seconds of total impulse for every newton of propellant weight it burns (weight measured at standard gravity) — or, the same thing, one newton of propellant could keep up one newton of thrust for $311\,\mathrm{s}$.

The effective exhaust velocity is $v_e = I_{sp} g_0 = 311 \times 9.80665 \approx 3050\,\mathrm{m/s}$. This, not the number in seconds, goes into the rocket equation.
:::

::: check
A satellite is $r = 7000\,\mathrm{km}$ from the Earth's center, moving at $7.5\,\mathrm{km/s}$, with its velocity at $80^\circ$ to the radius. What is its specific angular momentum? Will it change over the next orbit if the only force is spherical Earth gravity? What if the Earth's flattening is added?
:::

::: answer
$h = r v \sin\phi = 7.0 \times 10^6 \times 7500 \times \sin 80^\circ \approx 5.17 \times 10^{10}\,\mathrm{m^2/s}$.

With spherical gravity the force is central about the Earth's center, so the torque there is zero and $\mathbf{h}$ — size and direction — is exactly conserved.

The Earth's flattening adds a part of the force that does not point at the center. The torque is then not zero, and $\mathbf{h}$ slowly changes: the orbit plane swivels. So a simulation that includes flattening should *not* be checked against constant $\mathbf{h}$. The conservation check must match the force model.
:::

::: check
Two stages, $30\,\mathrm{t}$ and $124\,\mathrm{t}$, are joined and coasting when springs push them apart with an impulse of $48\,\mathrm{kN\,s}$ on each. What are the two velocity changes, and what happens to the pair's total momentum?
:::

::: answer
The spring force is internal. By the third law the two impulses are equal and opposite, so the pair's total momentum does not change.

The lighter stage gets $\Delta v_1 = 48{,}000 / 30{,}000 = 1.6\,\mathrm{m/s}$ backward. The heavier gets $\Delta v_2 = 48{,}000 / 124{,}000 \approx 0.39\,\mathrm{m/s}$ forward. They separate at about $1.6 + 0.39 \approx 2.0\,\mathrm{m/s}$.

Check: $30{,}000 \times (-1.6) + 124{,}000 \times 0.39 \approx -48{,}000 + 48{,}000 \approx 0$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{p} = m\mathbf{v}$, $\mathbf{P} = \sum m_i \mathbf{v}_i$ | momentum of a particle, of a system |
| $\mathbf{F}_{\mathrm{ext}} = d\mathbf{P}/dt$ | second law for a fixed collection of matter; internal forces cancel in pairs; $\mathbf{P}$ conserved when $\mathbf{F}_{\mathrm{ext}} = 0$ |
| $\mathbf{J} = \int \mathbf{F}\,dt = \Delta\mathbf{p} = m\,\Delta\mathbf{v}$ | impulse, in $\mathrm{N\,s}$; a short burn is an instant $\Delta\mathbf{v}$ |
| $\bar{\mathbf{F}} = \mathbf{J}/\Delta t$ | momentum bookkeeping gives average force, never peak |
| $I_t = \int T\,dt$ | total impulse of a burn |
| $I_{sp} = I_t/(m_p g_0) = T/(\dot{m} g_0)$ | specific impulse, in seconds |
| $v_e = I_{sp} g_0$, $T = \dot{m} v_e$ | effective exhaust velocity; thrust is momentum flow |
| Merlin 1D | about $845\,\mathrm{kN}$ and $282\,\mathrm{s}$ at sea level, $914\,\mathrm{kN}$ and $311\,\mathrm{s}$ in vacuum, $\dot{m} \approx 300\,\mathrm{kg/s}$ |
| $\mathbf{L} = \mathbf{r} \times \mathbf{p}$, $d\mathbf{L}/dt = \mathbf{r} \times \mathbf{F} = \boldsymbol{\tau}$ | angular momentum of a particle about a point, and its rate of change |
| central force | zero torque about its center, so $\mathbf{L}$ is conserved; flat orbit, $r_p v_p = r_a v_a$ |
| $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ | specific angular momentum; $h/2$ is the area rate (Kepler's second law) |

The next lesson adds up the second law over *distance* instead of time. That gives work and kinetic energy, the second great bookkeeping tool — and shows why the energy a rocket adds depends on how fast it is already going.

::: context internal-pairs Two skaters, one total
Two skaters stand still on ice and push each other apart. She pushes him; he pushes her just as hard the other way. Each gets the same size of impulse in opposite directions, so their momenta are equal and opposite. Add them and you get zero — exactly what the pair had before. Pairs of internal forces can shuffle momentum between parts, but they can never change the total.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="45" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="210" cy="45" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="134" y1="45" x2="74" y2="45" stroke="#1d6fd1" stroke-width="4"/>
  <polygon points="66,45 78,39 78,51" fill="#1d6fd1"/>
  <line x1="226" y1="45" x2="286" y2="45" stroke="#b4232c" stroke-width="4"/>
  <polygon points="294,45 282,39 282,51" fill="#b4232c"/>
  <text x="100" y="32" font-size="12" fill="#1d6fd1" text-anchor="middle">−J</text>
  <text x="260" y="32" font-size="12" fill="#b4232c" text-anchor="middle">+J</text>
  <line x1="20" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <text x="180" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">total change: −J + J = 0</text>
</svg>
```
:::

::: context area-under-curve Same area, same impulse
Impulse is the area under a force–time graph. A gentle push held for a long time and a sharp jolt over a split second can have exactly the same area — and then they change the momentum by exactly the same amount. Below, a 1 N push for 4 s and a 4 N push for 1 s both give 4 N·s. The egg only cares about the height of the graph; the momentum only cares about the area.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="130" x2="30" y2="15" stroke="#1f2a44" stroke-width="2"/>
  <text x="335" y="148" font-size="11" fill="#1f2a44" text-anchor="end">time (s)</text>
  <text x="36" y="18" font-size="11" fill="#1f2a44">force (N)</text>
  <rect x="30" y="105" width="240" height="25" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="280" y="30" width="60" height="100" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="150" y="98" font-size="12" fill="#1d6fd1" text-anchor="middle">1 N × 4 s = 4 N·s</text>
  <text x="310" y="84" font-size="12" fill="#b4232c" text-anchor="middle">4 N × 1 s</text>
  <text x="310" y="100" font-size="12" fill="#b4232c" text-anchor="middle">= 4 N·s</text>
</svg>
```

(Each second is 60 px wide and each newton 25 px tall, so the two areas really are equal.)
:::

::: context impulsive-burn Planning burns as instant kicks
Mission planners draw a transfer between two orbits as a few instant "kicks" joined by coasts. The textbook example is the Hohmann transfer: one kick to stretch the orbit, another at the far end to round it off. Real burns last seconds to minutes, so flight software later corrects for the finite burn — but the instant-kick picture sets the budget. The orbital-mechanics module uses it constantly.
:::

::: context crush-core Legs that are meant to crumple
One way to soak up a landing is a crush core: a block of aluminum honeycomb inside the leg that folds up like a paper cup under load. It stops the vehicle over a longer distance and time, so the peak force is lower — the egg-catch trick again. The Apollo lunar module's legs used honeycomb cores like this. A core crushes only once, so it is sized with margin: the average force comes from impulse, the peak from testing.
:::

::: context why-seconds Why specific impulse is in seconds
In US engineering units, force is measured in pounds-force and mass in pounds-mass, and one pound of mass weighs one pound-force at standard gravity. Dividing impulse (pound-force-seconds) by propellant *weight* (pound-force) leaves seconds. Dividing newton-seconds by newtons leaves seconds too. So the same engine has the same $I_{sp}$ in both systems — handy for engineers trading datasheets across the Atlantic, and the reason the habit stuck.
:::

::: context ion-thruster Tiny push, huge exhaust speed
An ion thruster uses electricity (usually from solar panels) to fling charged xenon atoms out at tens of kilometers per second. NASA's Dawn probe, which orbited the asteroid Vesta and the dwarf planet Ceres, had ion engines with $I_{sp}$ around $3100\,\mathrm{s}$ but a thrust of under a tenth of a newton — about the weight of a couple of sheets of paper. Patience turns that into huge $\Delta v$: the engines ran for years.
:::

::: context cross-product The cross product and the right hand
$\mathbf{r} \times \mathbf{v}$ is an arrow standing straight out of the plane that holds $\mathbf{r}$ and $\mathbf{v}$. Point the fingers of your right hand along $\mathbf{r}$, curl them toward $\mathbf{v}$, and your thumb points along the result. Its length is $r v \sin\phi$: largest when the two are at right angles, zero when they are parallel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="60,140 300,140 340,90 100,90" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="160" cy="120" r="4" fill="#1f2a44"/>
  <text x="146" y="136" font-size="12" fill="#1f2a44">O</text>
  <line x1="160" y1="120" x2="270" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="278,120 266,114 266,126" fill="#1d6fd1"/>
  <text x="272" y="136" font-size="12" fill="#1d6fd1">r</text>
  <line x1="160" y1="120" x2="210" y2="98" stroke="#f2b880" stroke-width="3"/>
  <polygon points="217,95 204,94 209,105" fill="#f2b880"/>
  <text x="218" y="92" font-size="12" fill="#1f2a44">v</text>
  <line x1="160" y1="120" x2="160" y2="28" stroke="#b4232c" stroke-width="3"/>
  <polygon points="160,20 154,32 166,32" fill="#b4232c"/>
  <text x="170" y="30" font-size="12" fill="#b4232c">L = r × p (out of the plane)</text>
</svg>
```
:::

::: context kepler-areas Equal areas in equal times
Johannes Kepler found this pattern in 1609 from years of careful planet-watching, long before Newton explained it. Over any two stretches of equal time, the line from the Sun to a planet sweeps equal areas. Near the Sun the slice is short and fat; far away it is long and thin. Same area, so the planet must move faster when close.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M70.5,90 L110.4,30.9 A130,70 0 0,0 110.4,149.1 Z" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <path d="M70.5,90 L308.3,78.8 A130,70 0 0,1 308.3,101.2 Z" fill="#f2b880" stroke="#b4232c" stroke-width="1"/>
  <ellipse cx="180" cy="90" rx="130" ry="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="70.5" cy="90" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="70" y="178" font-size="11" fill="#1d6fd1" text-anchor="middle">near: short, fat</text>
  <text x="290" y="178" font-size="11" fill="#b4232c" text-anchor="middle">far: long, thin</text>
  <text x="180" y="14" font-size="11" fill="#1f2a44" text-anchor="middle">the two shaded slices have equal area</text>
</svg>
```
:::
