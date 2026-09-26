---
id: l05-systems-of-particles-centre-of-mass
title: Systems of particles and the center of mass
minutes: 24
covers:
  - systems of particles and the centre of mass
---

Toss a hammer end over end to a friend. The hammer spins and wobbles in the air, and its handle and head trace loops. But one point inside it — close to the heavy head — follows a smooth, simple arc, exactly the arc a thrown pebble would follow. That point is the **[[center of mass|hammer-toss]]**, and this lesson is about why it behaves so well.

Nothing you will ever fly is a single particle. A launch vehicle is tanks, engines, a payload and hundreds of tonnes of sloshing liquid. A spacecraft has solar panels, a swiveling antenna and spinning reaction wheels. Yet lessons 1 to 4 treated vehicles as points, orbit programs do the same, and the answers come out right. The reason: every system of particles, however it tumbles, flexes or sloshes, has one point that moves exactly like a single particle carrying all the mass, pushed by the total outside force.

That fact does three jobs. It justifies the point-particle model for trajectories and says which point the trajectory belongs to. It separates moving from turning, so the next module can solve the attitude problem about the center of mass without caring where the vehicle is going. And it makes the rocket equation come out right in lesson 6, because a rocket and its exhaust form a system whose total momentum obeys a law that neither part obeys alone.

## Center of mass

Put two friends on a seesaw. If they weigh the same, the balance point is in the middle. If one is twice as heavy, the balance point slides toward the heavy one, until it is twice as far from the light friend as from the heavy one. The center of mass is that balance point, worked out for any number of pieces.

Take $N$ particles. Particle number $i$ has mass $m_i$ and sits at position $\mathbf{r}_i$ in an inertial frame. The total mass is $M = \sum_i m_i$, where $\sum$ ("sigma") means "add up over all the particles". The **center of mass** is the **mass-weighted average position** — each position counted in proportion to how much mass sits there:

$$
\mathbf{R} = \frac{1}{M}\sum_{i=1}^{N} m_i\,\mathbf{r}_i .
$$

For a solid body, chop it into tiny pieces of mass $dm$ and let the sum become an integral:

$$
\mathbf{R} = \frac{1}{M}\int \mathbf{r}\,dm, \qquad M = \int dm .
$$

The center of mass is a point, not a piece of matter; for a hollow ball it sits in the empty middle. Two properties make it easy to find.

- It is **additive**. If you know each part's mass and center of mass, the whole assembly's center is the mass-weighted average of the parts' centers. (Inside each part, the sum collapses to $m_{\mathrm{part}}\mathbf{R}_{\mathrm{part}}$.)
- It respects **symmetry**. If a body with even density has a mirror plane, an axis or a center of symmetry, the center of mass lies on it, because mirror-image pieces balance each other. A uniform rod's is at its midpoint; a uniform ball's is at its center; a round launch vehicle's is on its long axis, so only the distance along the axis — engineers call it the **[[station|station-word]]** — has to be found.

Take the rate of change of the definition, and you get the velocity of the center of mass and the total momentum:

$$
M\dot{\mathbf{R}} = \sum_i m_i \dot{\mathbf{r}}_i = \sum_i \mathbf{p}_i = \mathbf{P}.
$$

The dot in $\dot{\mathbf{R}}$ ("R dot") means [[rate of change in time|newton-dots]]. So the total momentum of a system is its total mass times the velocity of its center of mass. That ties $\mathbf{P}$, which lesson 2 used freely, to one definite point.

::: example Center of mass of a launch stack
A two-stage rocket stands on the pad. Distances are measured along its axis from the bottom of the first-stage engines. The fueled first stage is $420\,\mathrm{t}$ with its center of mass at $25.0\,\mathrm{m}$. The fueled second stage is $110\,\mathrm{t}$ at $55.0\,\mathrm{m}$. The payload and its nose cover are $15\,\mathrm{t}$ at $65.0\,\mathrm{m}$. Where is the [[stack's center of mass|stack-picture]]?

**Weighted average.** Multiply each mass by its distance, add, and divide by the total mass:

$$
X = \frac{420 \times 25.0 + 110 \times 55.0 + 15 \times 65.0}{420 + 110 + 15}\,\mathrm{m} = \frac{10{,}500 + 6050 + 975}{545}\,\mathrm{m} \approx 32.2\,\mathrm{m}.
$$

**Sense check.** It is low on the vehicle, close to the first stage's $25\,\mathrm{m}$, because the first stage holds most of the mass.

**After burning.** Now let the first stage burn $300\,\mathrm{t}$ of propellant. Model the stage as $25\,\mathrm{t}$ of structure at $30.0\,\mathrm{m}$ plus $395\,\mathrm{t}$ of propellant at $24.68\,\mathrm{m}$ (the value that gives $25.0\,\mathrm{m}$ for the full stage). Assume the remaining $95\,\mathrm{t}$ of propellant keeps the same center. The stack is now $545 - 300 = 245\,\mathrm{t}$, and

$$
X' = \frac{25 \times 30.0 + 95 \times 24.68 + 110 \times 55.0 + 15 \times 65.0}{245}\,\mathrm{m} \approx 41.3\,\mathrm{m}.
$$

The center of mass has climbed about $9\,\mathrm{m}$, because heavy stuff low down was burned away. (Real tanks drain from the top, so the propellant's own center also moves down, and the shift differs again.) Guidance and control need this station over time: the thrust must point close to it, and the lever arm of any thrust misalignment is measured from it.
:::

## Newton's second law for a system

Sit in a car and push hard on the dashboard. The car does not move: your push and the dashboard's push back are a pair inside the car, and they cancel. To move it, someone outside has to push. That is the whole idea of this section.

Now the precise version. Let the particles push and pull on each other. On particle $i$ acts an **external force** $\mathbf{F}_i^{\mathrm{ext}}$, from outside the system, and an **internal force** $\mathbf{f}_{ij}$ from each other particle $j$. The second law for particle $i$ is

$$
m_i \ddot{\mathbf{r}}_i = \mathbf{F}_i^{\mathrm{ext}} + \sum_{j \neq i} \mathbf{f}_{ij}.
$$

Here $\ddot{\mathbf{r}}_i$ ("r double dot") is the acceleration, and $j \neq i$ means "every other particle".

Add this equation up over all $i$. Three things happen:

1. The left side becomes $\sum_i m_i \ddot{\mathbf{r}}_i = M\ddot{\mathbf{R}}$, by taking the rate of change of the center-of-mass definition twice.
2. The [[internal forces|internal-pairs]] form a double sum in which every pair shows up twice — once as $\mathbf{f}_{ij}$ and once as $\mathbf{f}_{ji}$. Newton's third law says $\mathbf{f}_{ji} = -\mathbf{f}_{ij}$, so each pair cancels, and the whole double sum is zero.
3. What is left on the right is the sum of the external forces.

$$
M\ddot{\mathbf{R}} = \sum_i \mathbf{F}_i^{\mathrm{ext}} = \mathbf{F}_{\mathrm{ext}}, \qquad \text{or equally} \qquad \frac{d\mathbf{P}}{dt} = \mathbf{F}_{\mathrm{ext}}.
$$

This is the **center-of-mass theorem**. The center of mass moves like a particle of mass $M$ pushed by the sum of the external forces alone. Internal forces — tank pressure on a bulkhead, a slosh wave hitting a wall, a reaction wheel's bearing, a separation spring, the thrust structure pushing on an engine — cannot move the center of mass by a millimeter. Only outside forces count: gravity, air forces, the launch pad, and (as lesson 6 shows) momentum carried away by matter that leaves.

::: key How the center of mass moves
The center of mass of a system moves according to $M\ddot{\mathbf{R}}_{\mathrm{cm}} = \sum \mathbf{F}_{\mathrm{ext}}$ — internal forces cancel in pairs by the third law. This is why a tumbling vehicle still has a clean translational trajectory: attitude motion and internal motion cannot change where the center of mass goes.
:::

Two consequences follow.

**No outside force, straight line.** If $\mathbf{F}_{\mathrm{ext}} = 0$, the center of mass moves in a straight line at steady speed, whatever the parts do. A stage that separates, tumbles and vents keeps its center of mass on the same coasting path. The center of mass of a vehicle that breaks up in flight carries on along the arc the intact vehicle was on.

**Uniform gravity acts at the center of mass.** If gravity is the same across the body, the total is $\sum_i m_i \mathbf{g} = M\mathbf{g}$, as if all the mass sat at the center of mass. So the particle model of an orbit is exact for the center of mass in uniform gravity, and nearly exact in Earth's real field: the difference in pull across a $100\,\mathrm{m}$ vehicle in low orbit is only about $2.6 \times 10^{-4}\,\mathrm{m/s^2}$ — a **[[tidal|gravity-gradient]]** effect saved for the rigid-body module.

::: example Stage separation seen from the center of mass
Lesson 2 pushed apart two coasting stages of $30\,\mathrm{t}$ and $124\,\mathrm{t}$ with a spring impulse of $48\,\mathrm{kN\,s}$. The velocity changes were $-1.60\,\mathrm{m/s}$ and $+0.387\,\mathrm{m/s}$. Suppose both were moving at $7000\,\mathrm{m/s}$ before. Where does the center of mass go, and how much energy did the springs release?

**Center-of-mass velocity afterward.** Mass-weighted average of the two new velocities:

$$
V = \frac{30 \times (7000 - 1.60) + 124 \times (7000 + 0.387)}{154}\,\mathrm{m/s} = \frac{209{,}952 + 868{,}048}{154}\,\mathrm{m/s} = 7000.0\,\mathrm{m/s}.
$$

Unchanged, to the last digit, because the spring force was internal. The center of mass now sits in empty space between two objects drifting apart at $1.987\,\mathrm{m/s}$, still on exactly the path the joined vehicle was on.

**Energy released.** The springs' energy went into the *relative* motion. Relative to the center of mass, the velocities are $u_1 = -1.60$ and $u_2 = +0.387\,\mathrm{m/s}$. So the relative kinetic energy is $\tfrac{1}{2}(30{,}000)(1.60)^2 + \tfrac{1}{2}(124{,}000)(0.387)^2 \approx 38{,}400 + 9290 \approx 4.77 \times 10^{4}\,\mathrm{J}$.

**Shortcut.** For two bodies, the relative energy is $\tfrac{1}{2}\mu_{\mathrm{red}} v_{\mathrm{rel}}^2$, using the **[[reduced mass|reduced-mass]]** $\mu_{\mathrm{red}} = m_1 m_2 / (m_1 + m_2)$. Here $\mu_{\mathrm{red}} = 30 \times 124 / 154 \approx 24.2\,\mathrm{t}$ and $v_{\mathrm{rel}} = 1.987\,\mathrm{m/s}$, so $\tfrac{1}{2} \times 24{,}160 \times 1.987^2 \approx 4.77 \times 10^{4}\,\mathrm{J}$. Same answer: about $48\,\mathrm{kJ}$, a few kilograms of compressed spring, moves $154\,\mathrm{t}$ of hardware apart.
:::

## Kinetic energy of a system

A thrown, spinning ball has two kinds of motion energy: flying across the room, and spinning. This section shows that split is exact.

Write each particle's position as the center of mass plus an offset: $\mathbf{r}_i = \mathbf{R} + \mathbf{r}_i'$ (the prime marks "measured from the center of mass"). Then each velocity is $\mathbf{v}_i = \mathbf{V} + \mathbf{v}_i'$, with $\mathbf{V} = \dot{\mathbf{R}}$. Because $\mathbf{R}$ is the weighted average, the weighted offsets add to zero: $\sum_i m_i \mathbf{r}_i' = 0$, and so $\sum_i m_i \mathbf{v}_i' = 0$. Now multiply out the total kinetic energy:

$$
K = \sum_i \tfrac{1}{2} m_i\,(\mathbf{V} + \mathbf{v}_i') \cdot (\mathbf{V} + \mathbf{v}_i')
  = \tfrac{1}{2} M V^2 + \mathbf{V} \cdot \sum_i m_i \mathbf{v}_i' + \sum_i \tfrac{1}{2} m_i v_i'^2 .
$$

The middle term contains $\sum_i m_i \mathbf{v}_i' = 0$, so it vanishes, leaving

$$
K = \tfrac{1}{2} M V^2 + K'.
$$

Here $K' = \sum_i \tfrac{1}{2} m_i v_i'^2$ is the kinetic energy of motion *relative to the center of mass*: spin, vibration, slosh, separated parts drifting apart. The first part belongs to the center of mass. The second does not care how fast the center of mass is going.

This explains lesson 2's docking exactly. Before contact, the $20\,\mathrm{t}$ cargo ship and $420\,\mathrm{t}$ station had relative energy $K' = \tfrac{1}{2}\mu_{\mathrm{red}} v_{\mathrm{rel}}^2 = \tfrac{1}{2} \times 19{,}090 \times 0.10^2 \approx 95.5\,\mathrm{J}$. The latches destroyed all of it. The center-of-mass part, $\tfrac{1}{2} M V^2 \approx 4.5\,\mathrm{J}$, survived untouched — the same $4.5\,\mathrm{J}$ lesson 2 found directly.

::: note What internal forces can and cannot touch
Internal forces can change only $K'$. They can turn it into heat (docking latches, crushable shock absorbers), feed stored energy into it (separation springs, a wheel spinning up), or shuffle it between spin and slosh. They cannot touch $\tfrac{1}{2} M V^2$. That gives a second sanity check on any multi-body simulation: the center of mass's kinetic energy changes only by the work of external forces.
:::

## Angular momentum of a system

Sit on an office chair holding a bicycle wheel. Spin the wheel one way and the chair turns the other way. From the inside you cannot change the *total* spin, only share it out — the dashboard push again, for turning.

The angular momentum of the system about a fixed point $O$ is the sum over particles, $\mathbf{L} = \sum_i \mathbf{r}_i \times \mathbf{p}_i$, where $\times$ is the cross product. Take its rate of change as in lesson 2:

$$
\frac{d\mathbf{L}}{dt} = \sum_i \mathbf{r}_i \times \left(\mathbf{F}_i^{\mathrm{ext}} + \sum_{j \neq i}\mathbf{f}_{ij}\right).
$$

The internal terms pair up as $\mathbf{r}_i \times \mathbf{f}_{ij} + \mathbf{r}_j \times \mathbf{f}_{ji} = (\mathbf{r}_i - \mathbf{r}_j) \times \mathbf{f}_{ij}$. That is zero when $\mathbf{f}_{ij}$ points along the line joining the two particles, because the cross product of two parallel arrows is zero. This *strong* form of the third law holds for gravity, contact forces and every interaction in this module. So

$$
\frac{d\mathbf{L}}{dt} = \sum_i \mathbf{r}_i \times \mathbf{F}_i^{\mathrm{ext}} = \boldsymbol{\tau}_{\mathrm{ext}} .
$$

About a fixed point, the system's angular momentum changes only through the **torque** ($\boldsymbol{\tau}$, "tau", the turning effect of a force) of *external* forces. A spacecraft cannot change its total angular momentum by spinning up a reaction wheel: the wheel gains some and the body loses exactly as much. That is how wheels steer a spacecraft, and why they eventually **[[saturate|wheel-saturation]]** and need an external torque — a thruster or a magnetic torquer — to unload.

The same split as for kinetic energy works here. Put in $\mathbf{r}_i = \mathbf{R} + \mathbf{r}_i'$ and $\mathbf{v}_i = \mathbf{V} + \mathbf{v}_i'$. The mixed terms vanish again because $\sum m_i \mathbf{r}_i' = 0$, and

$$
\mathbf{L} = \mathbf{R} \times M\mathbf{V} + \sum_i \mathbf{r}_i' \times m_i \mathbf{v}_i' = \mathbf{L}_{\mathrm{orbital}} + \mathbf{L}_{\mathrm{cm}} .
$$

The first term is the angular momentum of the center of mass treated as a particle. The second, $\mathbf{L}_{\mathrm{cm}}$, is the angular momentum about the center of mass — the spin. And the spin has a law of its own. Taking its rate of change, and using the center-of-mass theorem to cancel the $M\dot{\mathbf{V}}$ term,

$$
\frac{d\mathbf{L}_{\mathrm{cm}}}{dt} = \sum_i \mathbf{r}_i' \times \mathbf{F}_i^{\mathrm{ext}} = \boldsymbol{\tau}_{\mathrm{cm}},
$$

the torque of the external forces *about the center of mass*. This is remarkable: it holds even though the center of mass is accelerating. The acceleration term drops out because the lever arms $\mathbf{r}_i'$ are measured from the center of mass. It is the one moving point where the angular momentum law keeps its simple form, which is why every attitude equation in the next module is written about it.

In uniform gravity, the gravity torque about the center of mass is $\sum_i \mathbf{r}_i' \times m_i \mathbf{g} = (\sum_i m_i \mathbf{r}_i') \times \mathbf{g} = 0$, so a stage in free fall does not start tumbling because of gravity. Thrust does make a torque whenever its line misses the center of mass, with the lever arm measured from the point found in the first example.

::: key Momentum laws for a system
For a system of particles: $\mathbf{P} = M\mathbf{V}$, $d\mathbf{P}/dt = \mathbf{F}_{\mathrm{ext}}$, $d\mathbf{L}/dt = \boldsymbol{\tau}_{\mathrm{ext}}$ about a fixed point, and $d\mathbf{L}_{\mathrm{cm}}/dt = \boldsymbol{\tau}_{\mathrm{cm}}$ about the (accelerating) center of mass. Kinetic energy and angular momentum each split exactly into a center-of-mass part and a part relative to the center of mass.
:::

::: example Where the debris goes
A vehicle at $30\,\mathrm{km}$ altitude, moving at $2000\,\mathrm{m/s}$ at $45°$ above horizontal, breaks apart with no net outside impulse. Ignore drag and use a flat Earth with $g = 9.70\,\mathrm{m/s^2}$. Where does the center of mass of the debris hit the ground?

**Idea.** Breakup forces are internal, so the center of mass keeps following the intact vehicle's ballistic arc.

**Velocity parts.** Across and up: $v_x = v_z = 2000\cos 45° \approx 1414\,\mathrm{m/s}$.

**Time to fall.** Height is zero when $30{,}000 + 1414\,t - \tfrac{1}{2}(9.70)\,t^2 = 0$. The quadratic formula, taking the positive root, gives

$$
t = \frac{1414 + \sqrt{1414^2 + 2 \times 9.70 \times 30{,}000}}{9.70} \approx 311\,\mathrm{s}.
$$

**Distance.** $1414 \times 311 \approx 4.4 \times 10^{5}\,\mathrm{m}$, about $440\,\mathrm{km}$ downrange of the breakup.

Fragments land scattered around that point — light ones much shorter once drag, an external force acting differently on each piece, is included. Without drag, their mass-weighted center lands exactly where the intact vehicle would have. **[[Range safety|range-safety]]** analysis starts from this point and adds the scatter.
:::

## Why this matters for a rocket

Everything in this lesson has been about a system with *fixed membership*: the same particles from start to finish. That is the condition for $d\mathbf{P}/dt = \mathbf{F}_{\mathrm{ext}}$. "The vehicle" changes membership every instant as propellant leaves, so the theorem does not apply to it, and trying anyway is exactly the error lesson 6 is built around.

What does apply is the theorem for the fixed system made of the vehicle *plus all the propellant it will throw out*. No thrust acts on that system — thrust is an internal force between the vehicle and its exhaust — so its center of mass moves under gravity and air forces alone. The vehicle goes forward because the exhaust goes backward, and the two motions are tied together by what the external forces require of their shared center of mass. Lesson 6 turns this into the equation of motion.

::: warning Same matter, and only the center
The center-of-mass theorem needs the *same* collection of matter throughout. It does not say that the vehicle's center of mass, computed from whatever is on board at each instant, obeys $M\ddot{\mathbf{R}} = \mathbf{F}_{\mathrm{ext}}$ — for a rocket it does not, and the difference is the thrust. Nor does it say the parts move that way; only the center of mass does. Reading a clean center-of-mass trajectory as proof that the vehicle is not tumbling is a mistake with a long history.
:::

## Check yourself

::: check
A satellite is a $600\,\mathrm{kg}$ main body (the **bus**) with its center of mass at the origin of the body frame, plus a $40\,\mathrm{kg}$ antenna with its center of mass at $(3.0, 0, 0.5)\,\mathrm{m}$. Where is the satellite's center of mass? If the antenna swivels to $(2.5, 1.5, 0.5)\,\mathrm{m}$, how far does the center of mass move relative to the bus, and does the satellite's trajectory change?
:::

::: answer
By additivity, $\mathbf{R} = (40 \times (3.0, 0, 0.5) + 600 \times \mathbf{0}) / 640 = (0.1875, 0, 0.03125)\,\mathrm{m}$.

After the swivel, $\mathbf{R}' = 40 \times (2.5, 1.5, 0.5) / 640 = (0.15625, 0.09375, 0.03125)\,\mathrm{m}$. Subtracting, the center of mass shifts by about $(-3.1, +9.4, 0)\,\mathrm{cm}$ relative to the bus.

The swivel force is internal, so the whole satellite's center of mass stays on the same orbit. The bus itself shifts the opposite way to keep it there. Only an external force could change the trajectory.
:::

::: check
Show in three lines that the total gravity torque about the center of mass is zero for a body in a uniform gravity field. Then say why this fails for a very long body in orbit.
:::

::: answer
The torque about the center of mass is $\sum_i \mathbf{r}_i' \times m_i \mathbf{g}$.

Since $\mathbf{g}$ is the same for every particle, it comes out of the sum: $\left(\sum_i m_i \mathbf{r}_i'\right) \times \mathbf{g}$.

The sum in brackets is zero by the definition of the center of mass, so the torque is zero.

In orbit the field is not uniform: it is stronger at the end nearer Earth and points slightly differently, so $\mathbf{g}_i$ cannot come out of the sum and a gravity-gradient torque remains. For a long body it is big enough to hold the spacecraft's attitude with no power at all.
:::

::: check
Two bodies of $8\,\mathrm{t}$ and $2\,\mathrm{t}$ approach each other and dock, viewed in a frame where their center of mass is at rest. The $2\,\mathrm{t}$ body was moving at $0.20\,\mathrm{m/s}$. What was the $8\,\mathrm{t}$ body's velocity? How much kinetic energy is lost in the docking, and what fraction of the starting kinetic energy is that?
:::

::: answer
In the center-of-mass frame $\mathbf{P} = 0$, so $8000\,v_1 + 2000 \times 0.20 = 0$, giving $v_1 = -0.05\,\mathrm{m/s}$. The relative speed is $0.20 + 0.05 = 0.25\,\mathrm{m/s}$.

After docking, the joined body is at rest in this frame, so *all* the starting kinetic energy is lost. Using the reduced mass $\mu_{\mathrm{red}} = 8 \times 2 / 10 = 1.6\,\mathrm{t}$: $\tfrac{1}{2} \times 1600 \times 0.25^2 = 50\,\mathrm{J}$. Check directly: $\tfrac{1}{2} \times 8000 \times 0.05^2 + \tfrac{1}{2} \times 2000 \times 0.20^2 = 10 + 40 = 50\,\mathrm{J}$.

The fraction is 100% in this frame. The center-of-mass frame is the one where all the kinetic energy is relative motion, and so all of it is available to be lost.
:::

::: check
A spacecraft with its reaction wheels at rest drifts with zero angular momentum. It spins up a wheel to store $+2.0\,\mathrm{N\,m\,s}$ about the body $z$ axis. What is the body's angular momentum afterward? Why can the spacecraft not use its wheels to fight a steady external torque forever?
:::

::: answer
The wheel motor's torque is internal, so the total angular momentum about the center of mass stays zero. The body picks up $-2.0\,\mathrm{N\,m\,s}$ about $z$, equal and opposite to the wheel.

Under a steady external torque, $d\mathbf{L}_{\mathrm{cm}}/dt = \boldsymbol{\tau}_{\mathrm{ext}}$ says the *total* angular momentum keeps growing. The wheels can hold the body still only by soaking up that growth themselves, and every wheel has a top speed. When it is reached, the stored momentum must be dumped by an external torque — thrusters or magnetic torquers — because nothing internal can change the total.
:::

::: check
A simulation models a rocket as a point mass at the vehicle's current center of mass, with mass going down as propellant flows out. It still needs a thrust term in the force. Why, if internal forces cannot move a center of mass?
:::

::: answer
The center-of-mass theorem applies to a fixed collection of matter. "The vehicle" is not one: its membership changes as propellant leaves. So its center of mass is not the center of mass of any fixed system, and it does not obey $M\ddot{\mathbf{R}} = \mathbf{F}_{\mathrm{ext}}$.

The fixed system is vehicle plus exhaust, and *its* center of mass does move under external forces alone. The vehicle part goes forward because the exhaust part goes backward. When you choose to follow only the vehicle, the momentum handed to the exhaust each second shows up as an extra force on it — the thrust. Lesson 6 derives it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{R} = \frac{1}{M}\sum m_i \mathbf{r}_i = \frac{1}{M}\int \mathbf{r}\,dm$ | center of mass; additive over sub-assemblies; on any axis or plane of symmetry |
| $\mathbf{P} = M\mathbf{V}$, $\mathbf{V} = \dot{\mathbf{R}}$ | total momentum is total mass times center-of-mass velocity |
| $M\ddot{\mathbf{R}}_{\mathrm{cm}} = \sum\mathbf{F}_{\mathrm{ext}}$ | center-of-mass theorem; internal forces cancel in pairs by the third law |
| uniform gravity | acts as $M\mathbf{g}$ at the center of mass and makes no torque about it |
| $K = \tfrac{1}{2} M V^2 + K'$ | kinetic energy splits into center-of-mass motion plus motion relative to it; internal forces change only $K'$ |
| $\mu_{\mathrm{red}} = m_1 m_2/(m_1 + m_2)$ | reduced mass; $K' = \tfrac{1}{2}\mu_{\mathrm{red}} v_{\mathrm{rel}}^2$ for two bodies |
| $d\mathbf{L}/dt = \boldsymbol{\tau}_{\mathrm{ext}}$ | about a fixed point; internal torques cancel (strong third law) |
| $\mathbf{L} = \mathbf{R} \times M\mathbf{V} + \mathbf{L}_{\mathrm{cm}}$, $d\mathbf{L}_{\mathrm{cm}}/dt = \boldsymbol{\tau}_{\mathrm{cm}}$ | orbital plus spin angular momentum; the spin law holds about the center of mass even while it accelerates |
| fixed collection of matter | the condition every law here needs; a rocket alone is not one, vehicle plus exhaust is |

The next lesson applies the center-of-mass theorem to the system a rocket and its exhaust form, and derives the rocket equation properly — with the system named out loud, the trap of differentiating $m\mathbf{v}$ exposed, and the thrust and back-pressure terms coming out of the momentum the exhaust carries away.

::: context hammer-toss One point follows the simple arc
A thrown body with a heavy end (gray circles) tumbles, but its center of mass (red dot) traces the same smooth arc a pebble would.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4" points="30,170.0 40,153.2 50,137.6 60,123.2 70,109.9 80,97.8 90,86.8 100,77.0 110,68.3 120,60.8 130,54.4 140,49.2 150,45.2 160,42.3 170,40.6 180,40.0 190,40.6 200,42.3 210,45.2 220,49.2 230,54.4 240,60.8 250,68.3 260,77.0 270,86.8 280,97.8 290,109.9 300,123.2 310,137.6 320,153.2 330,170.0"/>
  <line x1="55.1" y1="126.6" x2="69.8" y2="116.3" stroke="#1f2a44" stroke-width="3"/><circle cx="55.1" cy="126.6" r="7" fill="#6c7a93"/><circle cx="69.8" cy="116.3" r="4" fill="#6c7a93"/><circle cx="60.0" cy="123.2" r="3" fill="#b4232c"/>
  <line x1="141.6" y1="55.0" x2="136.9" y2="37.7" stroke="#1f2a44" stroke-width="3"/><circle cx="141.6" cy="55.0" r="7" fill="#6c7a93"/><circle cx="136.9" cy="37.7" r="4" fill="#6c7a93"/><circle cx="140.0" cy="49.2" r="3" fill="#b4232c"/>
  <line x1="226.0" y1="49.8" x2="208.0" y2="48.2" stroke="#1f2a44" stroke-width="3"/><circle cx="226.0" cy="49.8" r="7" fill="#6c7a93"/><circle cx="208.0" cy="48.2" r="4" fill="#6c7a93"/><circle cx="220.0" cy="49.2" r="3" fill="#b4232c"/>
  <line x1="302.5" y1="117.8" x2="294.9" y2="134.1" stroke="#1f2a44" stroke-width="3"/><circle cx="302.5" cy="117.8" r="7" fill="#6c7a93"/><circle cx="294.9" cy="134.1" r="4" fill="#6c7a93"/><circle cx="300.0" cy="123.2" r="3" fill="#b4232c"/>
  <line x1="20" y1="176" x2="340" y2="176" stroke="#6c7a93" stroke-width="1"/>
</svg>
```

The heavy end has twice the mass of the light end, so the red dot sits a third of the way along the handle from the heavy end. Freeze the picture at any instant and that dot is on the arc.
:::

::: context station-word Stations along a rocket
Engineers borrowed the word **station** from shipbuilding and aircraft design, where every point along the body is named by its distance from a fixed starting line. "Station 25" means $25$ units along the axis. It lets a whole team point at the same spot on a 70-meter rocket without drawings: the center of mass "at station 32.2", a sensor "at station 40". Which end the stations start from is written down once, in the vehicle's reference documents, and everyone uses it.
:::

::: context newton-dots Newton's dots
Isaac Newton wrote rates of change with a dot over the letter, and physicists still do when the rate is with respect to time. One dot, $\dot{\mathbf{R}}$, is velocity: how fast position changes. Two dots, $\ddot{\mathbf{R}}$, is acceleration: how fast velocity changes. It is shorthand for $d\mathbf{R}/dt$ and $d^2\mathbf{R}/dt^2$. Leibniz's $d/dt$ notation won most other contests, but for time derivatives in mechanics the dots are quicker to write and stayed.
:::

::: context stack-picture The stack's balance point
Each circle's area is in proportion to the mass it stands for, placed at that part's own center of mass.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="132.5" cy="80" r="27.5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="267.5" cy="80" r="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="312.5" cy="80" r="5.2" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="132.5" y="126">stage 1, 420 t</text>
    <text x="250" y="112">stage 2, 110 t</text>
    <text x="318" y="62">15 t</text>
    <text x="20" y="100">0 m</text>
  </g>
  <polygon points="164.9,80 158.9,94 170.9,94" fill="#b4232c"/>
  <text x="164.9" y="40" font-size="11" fill="#b4232c" text-anchor="middle">full: 32.2 m</text>
  <line x1="164.9" y1="44" x2="164.9" y2="76" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="205.9,80 199.9,94 211.9,94" fill="#1d6fd1"/>
  <text x="222" y="22" font-size="11" fill="#1d6fd1" text-anchor="middle">after burn: 41.3 m</text>
  <line x1="205.9" y1="26" x2="205.9" y2="76" stroke="#1d6fd1" stroke-width="1.5"/>
</svg>
```

The heavy first stage drags the balance point low. Burn away most of its propellant and the balance point slides up toward the second stage.
:::

::: context internal-pairs Why inside forces cancel
Every internal force comes with a partner: equal size, opposite direction, acting on the other body.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="100" r="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="220" cy="100" r="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="96" y1="100" x2="136" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="146,100 134,94 134,106" fill="#1d6fd1"/>
  <line x1="204" y1="100" x2="164" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="154,100 166,94 166,106" fill="#1d6fd1"/>
  <text x="120" y="88" font-size="12" fill="#1d6fd1" text-anchor="middle">f₁₂</text>
  <text x="182" y="88" font-size="12" fill="#1d6fd1" text-anchor="middle">f₂₁ = −f₁₂</text>
  <line x1="220" y1="84" x2="220" y2="40" stroke="#b4232c" stroke-width="3"/>
  <polygon points="220,30 214,42 226,42" fill="#b4232c"/>
  <text x="232" y="46" font-size="12" fill="#b4232c">outside force</text>
  <text x="80" y="136" font-size="12" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="220" y="136" font-size="12" fill="#1f2a44" text-anchor="middle">2</text>
</svg>
```

Add up all the forces on the pair and the two blue arrows cancel. Only the red one is left to move the center of mass.
:::

::: context gravity-gradient Tides on a spacecraft
Gravity weakens with distance, so the end of a spacecraft nearer Earth is pulled a little harder than the far end. The difference is tiny — about $2.6 \times 10^{-4}\,\mathrm{m/s^2}$ across $100\,\mathrm{m}$ in low orbit — but it acts all the time, and it gently stretches the body along the line to Earth. It is the same effect that raises ocean tides, with the Moon's pull differing across Earth. Some satellites use it on purpose: a long boom sticking out tends to settle pointing straight down at Earth.
:::

::: context reduced-mass Where the reduced mass comes back
The reduced mass $\mu_{\mathrm{red}} = m_1 m_2/(m_1 + m_2)$ turns a two-body problem into a one-body problem: the relative motion behaves like a single particle of mass $\mu_{\mathrm{red}}$. If one body is much heavier, $\mu_{\mathrm{red}}$ is almost the lighter mass — for the $20\,\mathrm{t}$ ship and $420\,\mathrm{t}$ station it is $19.1\,\mathrm{t}$. You will meet the same trick in the two-body orbit module, where a satellite and Earth orbit their shared center of mass.
:::

::: context wheel-saturation When the wheels fill up
A reaction wheel is a heavy flywheel on a motor. Speeding it up one way turns the spacecraft the other way. But a steady outside torque, such as sunlight pressing unevenly on a solar panel, makes the wheels spin faster and faster to hold the spacecraft still. At top speed they are **saturated** and can absorb no more. Then thrusters or magnetic torquers push against the outside world to slow them down again — "momentum dumping". NASA's Kepler space telescope lost two of its four wheels by 2013, and the mission had to be redesigned around the ones left.
:::

::: context range-safety Range safety
Before every launch, a **range safety** team works out where pieces could fall if the rocket failed at each moment of its flight, and keeps people and ships out of those zones. The center-of-mass path of this lesson is the starting point. Then they add the spread from drag, from the explosion's push on each fragment, and from winds, to draw a footprint on the map. Rockets also carry a flight termination system so a vehicle that strays can be destroyed while its debris would still fall in a safe area.
:::
