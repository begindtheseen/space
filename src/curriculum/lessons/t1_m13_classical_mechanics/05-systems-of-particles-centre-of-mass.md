---
id: l05-systems-of-particles-centre-of-mass
title: Systems of particles and the centre of mass
minutes: 23
covers:
  - systems of particles and the centre of mass
---

Nothing you will ever fly is a particle. A launch vehicle is a stack of tanks, engines, a payload and several hundred tonnes of liquid that moves around inside it. A spacecraft has solar arrays, a gimballed antenna, reaction wheels spinning at thousands of rpm and propellant sloshing in a tank. Yet the first four lessons treated vehicles as points, and orbit propagators do the same, and the results are right. This lesson explains why: every system of particles, however it tumbles, flexes or sloshes, has one point — the centre of mass — that moves exactly as a single particle carrying the whole mass would under the total external force.

That theorem does three jobs on a real vehicle. It licenses the particle model for trajectory work and tells you which point the trajectory belongs to. It separates translation from rotation, so that the attitude problem of the next module can be solved about the centre of mass without reference to where the vehicle is going. And it is the tool that will make the rocket equation come out right in lesson 6, because a rocket and its exhaust are a system of particles whose total momentum obeys a law that neither part obeys alone.

## Centre of mass

Take $N$ particles with masses $m_i$ at positions $\mathbf{r}_i$ in an inertial frame, and total mass $M = \sum_i m_i$. The **centre of mass** is the mass-weighted mean position,

$$
\mathbf{R} = \frac{1}{M}\sum_{i=1}^{N} m_i\,\mathbf{r}_i .
$$

For a continuous body with density $\rho(\mathbf{r})$ the sum becomes an integral over the mass elements $dm = \rho\,dV$:

$$
\mathbf{R} = \frac{1}{M}\int \mathbf{r}\,dm, \qquad M = \int dm .
$$

The centre of mass is a geometric point, not a piece of matter; for a hollow shell it sits in the empty middle. Two properties make it computable in practice. It is **additive**: if you know the masses and centres of mass of the parts of an assembly, the centre of mass of the whole is the mass-weighted mean of the parts' centres, because the inner sums for each part collapse to $m_{\mathrm{part}}\mathbf{R}_{\mathrm{part}}$. And for a body with a plane, axis or point of symmetry and symmetric density, the centre of mass lies on that plane, axis or point, since the contributions of mirror-image elements cancel. A uniform rod's centre of mass is at its midpoint; a uniform sphere's is at its centre; an axisymmetric launch vehicle's is on its axis, so only the station along the axis has to be computed.

Differentiating the definition gives the velocity of the centre of mass and the total momentum:

$$
M\dot{\mathbf{R}} = \sum_i m_i \dot{\mathbf{r}}_i = \sum_i \mathbf{p}_i = \mathbf{P}.
$$

The total momentum of a system equals its total mass times the velocity of its centre of mass. This is the fact that makes $\mathbf{P}$, which lesson 2 used freely, a quantity about a definite point.

::: example Centre of mass of a launch stack
A two-stage vehicle stands on the pad. Measured along the axis from the base of the first-stage engines: the fully fuelled first stage has mass $420\,\mathrm{t}$ with its centre of mass at $25.0\,\mathrm{m}$; the fuelled second stage, $110\,\mathrm{t}$ at $55.0\,\mathrm{m}$; the payload and fairing, $15\,\mathrm{t}$ at $65.0\,\mathrm{m}$. Where is the centre of mass of the stack?

By additivity,

$$
X = \frac{420 \times 25.0 + 110 \times 55.0 + 15 \times 65.0}{420 + 110 + 15}\,\mathrm{m} = \frac{10{,}500 + 6050 + 975}{545}\,\mathrm{m} \approx 32.2\,\mathrm{m}.
$$

Low on the vehicle, because the first stage holds most of the mass. Now let the first stage burn $300\,\mathrm{t}$ of its propellant. Model the stage as $25\,\mathrm{t}$ of structure at $30.0\,\mathrm{m}$ plus $395\,\mathrm{t}$ of propellant at $24.68\,\mathrm{m}$ (the value that reproduces the $25.0\,\mathrm{m}$ figure for the full stage), and assume the propellant surface drops symmetrically so that the remaining $95\,\mathrm{t}$ keeps the same centre. The stack is now $245\,\mathrm{t}$ and

$$
X' = \frac{25 \times 30.0 + 95 \times 24.68 + 110 \times 55.0 + 15 \times 65.0}{245}\,\mathrm{m} \approx 41.3\,\mathrm{m}.
$$

The centre of mass has climbed $9\,\mathrm{m}$ up the vehicle. In a real stage the tanks drain from the top, so the propellant's own centre of mass also moves down, and the shift is different again. Guidance and control need this station as a function of time: the thrust vector must pass near it, and the moment arm of any thrust misalignment is measured from it.
:::

## Newton's second law for a system

Now let the particles interact. On particle $i$ act an external force $\mathbf{F}_i^{\mathrm{ext}}$, from outside the system, and internal forces $\mathbf{f}_{ij}$ from each other particle $j$. The second law for particle $i$ is

$$
m_i \ddot{\mathbf{r}}_i = \mathbf{F}_i^{\mathrm{ext}} + \sum_{j \neq i} \mathbf{f}_{ij}.
$$

Sum over all $i$. The left side is $\sum_i m_i \ddot{\mathbf{r}}_i = M\ddot{\mathbf{R}}$ by differentiating the definition of $\mathbf{R}$ twice. The internal forces on the right form a double sum over ordered pairs, and every pair $(i, j)$ appears twice — once as $\mathbf{f}_{ij}$ and once as $\mathbf{f}_{ji}$. By Newton's third law $\mathbf{f}_{ji} = -\mathbf{f}_{ij}$, so the pairs cancel and the whole double sum is zero. What remains is

$$
M\ddot{\mathbf{R}} = \sum_i \mathbf{F}_i^{\mathrm{ext}} = \mathbf{F}_{\mathrm{ext}}, \qquad \text{equivalently} \qquad \frac{d\mathbf{P}}{dt} = \mathbf{F}_{\mathrm{ext}}.
$$

This is the **centre-of-mass theorem**. The centre of mass moves as a particle of mass $M$ acted on by the vector sum of the external forces alone. Internal forces — tank pressure on a bulkhead, a slosh wave hitting a wall, a reaction wheel bearing, a separation spring, the thrust structure pushing on the engine — cannot move the centre of mass by a millimetre. Only forces from outside the system count: gravity, aerodynamic forces, contact with the pad, and (as lesson 6 makes precise) the momentum carried away by matter that leaves.

Two corollaries. If $\mathbf{F}_{\mathrm{ext}} = 0$, the centre of mass moves in a straight line at constant velocity whatever the parts do: a stage that separates, tumbles and vents keeps its centre of mass on the same coasting trajectory, and the centre of mass of a vehicle that breaks up in flight continues along the ballistic arc the intact vehicle was on. And when a body of finite size is in a gravity field that is uniform across it, $\mathbf{F}_{\mathrm{ext}} = \sum_i m_i \mathbf{g} = M\mathbf{g}$, so gravity acts on the centre of mass as if all the mass were there — the reason the particle model of an orbit is exact for the centre of mass under uniform gravity, and very nearly exact under Earth's real field (the gradient across a 100 m vehicle in LEO is about $2.6 \times 10^{-4}\,\mathrm{m/s^2}$ end to end, a tidal effect for the rigid-body module).

::: key
The centre of mass of a system moves according to $M\ddot{\mathbf{R}}_{\mathrm{cm}} = \sum \mathbf{F}_{\mathrm{ext}}$ — internal forces cancel in pairs by the third law. This is why a tumbling vehicle still has a clean translational trajectory: attitude motion and internal motion cannot change where the centre of mass goes.
:::

::: example Stage separation seen from the centre of mass
Lesson 2 separated two coasting stages of $30\,\mathrm{t}$ and $124\,\mathrm{t}$ with a spring impulse of $48\,\mathrm{kN\,s}$, giving velocity changes of $-1.60\,\mathrm{m/s}$ and $+0.387\,\mathrm{m/s}$. Suppose both were moving at $7000\,\mathrm{m/s}$ before separation. Where is the centre of mass afterwards, and how much kinetic energy did the springs release?

Velocity of the centre of mass after separation:

$$
V = \frac{30 \times (7000 - 1.60) + 124 \times (7000 + 0.387)}{154}\,\mathrm{m/s} = \frac{209{,}952 + 868{,}048}{154}\,\mathrm{m/s} = 7000.0\,\mathrm{m/s}.
$$

Unchanged, to the last digit, because the spring force was internal. The centre of mass of the pair — which now lies in empty space between two objects that drift apart at $1.99\,\mathrm{m/s}$ — continues on exactly the trajectory the joined vehicle was on. A tracking system that fits an orbit to the two separated bodies together will recover the pre-separation orbit.

The energy the springs released is the kinetic energy of the *relative* motion. Writing the two velocities relative to the centre of mass, $u_1 = -1.60$ and $u_2 = +0.387\,\mathrm{m/s}$, the relative kinetic energy is $\tfrac{1}{2}(30{,}000)(1.60)^2 + \tfrac{1}{2}(124{,}000)(0.387)^2 \approx 38{,}400 + 9290 \approx 4.77 \times 10^{4}\,\mathrm{J}$. The shortcut for a two-body system is $\tfrac{1}{2}\mu_{\mathrm{red}} v_{\mathrm{rel}}^2$ with the **reduced mass** $\mu_{\mathrm{red}} = m_1 m_2 / (m_1 + m_2) = 30 \times 124 / 154 \approx 24.2\,\mathrm{t}$ and $v_{\mathrm{rel}} = 1.99\,\mathrm{m/s}$: $\tfrac{1}{2} \times 24{,}160 \times 1.99^2 \approx 4.77 \times 10^{4}\,\mathrm{J}$. About 48 kJ, the energy of a few kilograms of compressed spring, moving two vehicles worth $154\,\mathrm{t}$ apart.
:::

## Kinetic energy of a system

Write each particle's position relative to the centre of mass, $\mathbf{r}_i = \mathbf{R} + \mathbf{r}_i'$, so that $\mathbf{v}_i = \mathbf{V} + \mathbf{v}_i'$ with $\mathbf{V} = \dot{\mathbf{R}}$. By the definition of the centre of mass, $\sum_i m_i \mathbf{r}_i' = 0$ and hence $\sum_i m_i \mathbf{v}_i' = 0$. The total kinetic energy is

$$
K = \sum_i \tfrac{1}{2} m_i\,(\mathbf{V} + \mathbf{v}_i') \cdot (\mathbf{V} + \mathbf{v}_i')
  = \tfrac{1}{2} M V^2 + \mathbf{V} \cdot \sum_i m_i \mathbf{v}_i' + \sum_i \tfrac{1}{2} m_i v_i'^2 .
$$

The middle term vanishes, leaving

$$
K = \tfrac{1}{2} M V^2 + K',
$$

where $K' = \sum_i \tfrac{1}{2} m_i v_i'^2$ is the kinetic energy of motion *relative to the centre of mass* — spin, vibration, slosh, relative drift of separated parts. Kinetic energy splits cleanly into a translational part that belongs to the centre of mass and an internal part that does not know how fast the centre of mass is moving. The split is exact and is the reason the docking example of lesson 2 lost precisely the internal energy: before contact the two vehicles had $K' = \tfrac{1}{2}\mu_{\mathrm{red}} v_{\mathrm{rel}}^2 = \tfrac{1}{2} \times 19{,}090 \times 0.10^2 \approx 95.5\,\mathrm{J}$ of relative kinetic energy (reduced mass of $20\,\mathrm{t}$ and $420\,\mathrm{t}$), the latches destroyed all of it, and the centre-of-mass part $\tfrac{1}{2} M V^2 \approx 4.5\,\mathrm{J}$ survived untouched — the same $4.5\,\mathrm{J}$ that lesson 2 found by direct calculation.

::: note
The relative kinetic energy $K'$ is the only part that internal forces can change. Internal forces can convert $K'$ to heat (docking latches, crush cores), release stored energy into $K'$ (separation springs, a spinning-up reaction wheel), or shuffle it between spin and slosh. They cannot touch $\tfrac{1}{2} M V^2$. This is the energy counterpart of the centre-of-mass theorem and a second sanity check on any multibody simulation: the translational kinetic energy of the centre of mass changes only by the work of external forces.
:::

## Angular momentum of a system

The angular momentum of the system about a fixed point $O$ is the sum of the particles' angular momenta, $\mathbf{L} = \sum_i \mathbf{r}_i \times \mathbf{p}_i$. Differentiate, as in lesson 2:

$$
\frac{d\mathbf{L}}{dt} = \sum_i \mathbf{r}_i \times \left(\mathbf{F}_i^{\mathrm{ext}} + \sum_{j \neq i}\mathbf{f}_{ij}\right).
$$

The internal terms pair up as $\mathbf{r}_i \times \mathbf{f}_{ij} + \mathbf{r}_j \times \mathbf{f}_{ji} = (\mathbf{r}_i - \mathbf{r}_j) \times \mathbf{f}_{ij}$. This vanishes if $\mathbf{f}_{ij}$ is directed along the line joining the two particles — the *strong* form of the third law, obeyed by gravity, contact forces and every interaction in this module. Then

$$
\frac{d\mathbf{L}}{dt} = \sum_i \mathbf{r}_i \times \mathbf{F}_i^{\mathrm{ext}} = \boldsymbol{\tau}_{\mathrm{ext}} .
$$

The angular momentum of a system about a fixed point changes only through the torque of *external* forces about that point. Internal torques cancel just as internal forces did. A spacecraft cannot change its total angular momentum by spinning up a reaction wheel: the wheel gains $\mathbf{L}$ and the body loses exactly as much, which is how wheels steer a spacecraft and why they eventually saturate and need an external torque — a thruster or a magnetic torquer — to unload.

The same decomposition as for kinetic energy applies. Substituting $\mathbf{r}_i = \mathbf{R} + \mathbf{r}_i'$ and $\mathbf{v}_i = \mathbf{V} + \mathbf{v}_i'$, the cross terms again vanish by $\sum m_i \mathbf{r}_i' = 0$, and

$$
\mathbf{L} = \mathbf{R} \times M\mathbf{V} + \sum_i \mathbf{r}_i' \times m_i \mathbf{v}_i' = \mathbf{L}_{\mathrm{orbital}} + \mathbf{L}_{\mathrm{cm}} .
$$

The first term is the angular momentum of the centre of mass treated as a particle; the second, $\mathbf{L}_{\mathrm{cm}}$, is the angular momentum about the centre of mass — the spin. And $\mathbf{L}_{\mathrm{cm}}$ has a law of its own. Differentiating, and using the centre-of-mass theorem to eliminate $M\dot{\mathbf{V}}$,

$$
\frac{d\mathbf{L}_{\mathrm{cm}}}{dt} = \sum_i \mathbf{r}_i' \times \mathbf{F}_i^{\mathrm{ext}} = \boldsymbol{\tau}_{\mathrm{cm}},
$$

the torque of the external forces *about the centre of mass*. Remarkably, this holds even though the centre of mass is accelerating and is therefore not a fixed point of an inertial frame; the acceleration term drops out precisely because the moment arms $\mathbf{r}_i'$ are measured from the centre of mass. It is the one moving point about which the angular momentum law keeps its simple form, which is why every attitude equation in the next module is written about the centre of mass and nowhere else.

For a body in a uniform gravity field, the gravitational torque about the centre of mass is $\sum_i \mathbf{r}_i' \times m_i \mathbf{g} = (\sum_i m_i \mathbf{r}_i') \times \mathbf{g} = 0$. Uniform gravity produces no torque about the centre of mass: a stage in free fall does not start to tumble because of gravity. Thrust does produce a torque whenever its line of action misses the centre of mass, and the size of that torque is the lever arm from the point of the first example.

::: key
For a system of particles: $\mathbf{P} = M\mathbf{V}$, $d\mathbf{P}/dt = \mathbf{F}_{\mathrm{ext}}$, $d\mathbf{L}/dt = \boldsymbol{\tau}_{\mathrm{ext}}$ about a fixed point, and $d\mathbf{L}_{\mathrm{cm}}/dt = \boldsymbol{\tau}_{\mathrm{cm}}$ about the (accelerating) centre of mass. Kinetic energy and angular momentum each split exactly into a centre-of-mass part and a part relative to the centre of mass.
:::

::: example Where the debris goes
A vehicle at $30\,\mathrm{km}$ altitude, moving at $2000\,\mathrm{m/s}$ at $45°$ above the horizontal, suffers a structural failure and breaks into many pieces with no net external impulse. Ignoring drag and using a flat Earth with $g = 9.70\,\mathrm{m/s^2}$, where is the centre of mass of the debris when it reaches the ground?

Breakup forces are internal, so the centre of mass continues on the ballistic trajectory of the intact vehicle. Its velocity components are $v_x = v_z = 2000\cos 45° \approx 1414\,\mathrm{m/s}$. The time to fall from $30\,\mathrm{km}$ satisfies $30{,}000 + 1414\,t - \tfrac{1}{2}(9.70)\,t^2 = 0$, giving

$$
t = \frac{1414 + \sqrt{1414^2 + 2 \times 9.70 \times 30{,}000}}{9.70} \approx 311\,\mathrm{s},
$$

and the centre of mass lands $1414 \times 311 \approx 4.4 \times 10^{5}\,\mathrm{m}$ downrange, about $440\,\mathrm{km}$ from the point of breakup. Individual fragments land scattered around that point, light ones much shorter once drag is included, but their mass-weighted centre — until drag, an external force that acts differently on each fragment, breaks the symmetry — is exactly where the intact vehicle would have come down. Range-safety analysis starts from this point and adds the scatter.
:::

## Why this matters for a rocket

Everything in this lesson has been about a system of *fixed* membership: the same particles from start to finish. That is the condition under which $d\mathbf{P}/dt = \mathbf{F}_{\mathrm{ext}}$ holds. A rocket is tempting to treat as "the vehicle", a system whose membership changes every instant as propellant leaves. The centre-of-mass theorem does not apply to such a shifting system, and trying to use it there is the error lesson 6 is built around.

What does apply is the theorem for the fixed system consisting of the vehicle *plus all the propellant it will expel*. That system has no thrust acting on it — thrust is an internal force between the vehicle and its exhaust — and its centre of mass moves under gravity and aerodynamics alone. The vehicle accelerates forward because the exhaust goes backward, and the two motions are related by the requirement that the centre of mass of the pair does what the external forces say. Lesson 6 turns this observation into the equation of motion.

::: warning
The centre-of-mass theorem needs the *same* collection of matter throughout. It does not say that the vehicle's centre of mass, computed from whatever is on board at each instant, obeys $M\ddot{\mathbf{R}} = \mathbf{F}_{\mathrm{ext}}$ — for a rocket it does not, and the discrepancy is the thrust. Nor does it say the parts move simply: only the centre of mass does. Reading a clean centre-of-mass trajectory as evidence that the vehicle is not tumbling is a mistake with a long history.
:::

## Check yourself

::: check
A satellite consists of a $600\,\mathrm{kg}$ bus whose centre of mass is at the origin of the body frame and a $40\,\mathrm{kg}$ antenna whose centre of mass is at $(3.0, 0, 0.5)\,\mathrm{m}$. Where is the centre of mass of the satellite? If the antenna is then gimballed to $(2.5, 1.5, 0.5)\,\mathrm{m}$, by how much does the centre of mass move relative to the bus, and does the satellite's trajectory change?
:::

::: answer
By additivity, $\mathbf{R} = (40 \times (3.0, 0, 0.5) + 600 \times \mathbf{0}) / 640 = (0.1875, 0, 0.03125)\,\mathrm{m}$. After gimballing, $\mathbf{R}' = 40 \times (2.5, 1.5, 0.5) / 640 = (0.15625, 0.09375, 0.03125)\,\mathrm{m}$, a shift of about $(-3.1, +9.4, 0)\,\mathrm{cm}$ relative to the bus. The gimbal force is internal, so the centre of mass of the whole satellite continues on exactly the same orbit; what moves is the bus, by an equal and opposite mass-weighted amount, so that the combined centre of mass stays put. Only an external force could change the trajectory.
:::

::: check
Prove in three lines that the total gravitational torque about the centre of mass vanishes for a body in a uniform gravitational field, and say why the result fails for a very long body in orbit.
:::

::: answer
The torque about the centre of mass is $\sum_i \mathbf{r}_i' \times m_i \mathbf{g}$. Since $\mathbf{g}$ is the same for every particle it factors out: $\left(\sum_i m_i \mathbf{r}_i'\right) \times \mathbf{g}$. The sum is zero by the definition of the centre of mass, so the torque is zero. In orbit the field is not uniform — it is stronger at the end nearer the Earth and points in a slightly different direction — so $\mathbf{g}_i$ cannot be factored out and a residual gravity-gradient torque remains. For a long body it is large enough to be used as a passive attitude stabiliser.
:::

::: check
Two bodies of $8\,\mathrm{t}$ and $2\,\mathrm{t}$ approach each other, in a frame where their centre of mass is at rest, and dock. The $2\,\mathrm{t}$ body was moving at $0.20\,\mathrm{m/s}$. What was the $8\,\mathrm{t}$ body's velocity, how much kinetic energy is dissipated in the docking, and what fraction of the initial kinetic energy is that?
:::

::: answer
In the centre-of-mass frame $\mathbf{P} = 0$, so $8000\,v_1 + 2000 \times 0.20 = 0$ and $v_1 = -0.05\,\mathrm{m/s}$; the relative speed is $0.25\,\mathrm{m/s}$. After docking the joined body is at rest in this frame, so *all* the initial kinetic energy is dissipated: $\tfrac{1}{2}\mu_{\mathrm{red}} v_{\mathrm{rel}}^2$ with $\mu_{\mathrm{red}} = 8 \times 2 / 10 = 1.6\,\mathrm{t}$, giving $\tfrac{1}{2} \times 1600 \times 0.25^2 = 50\,\mathrm{J}$. Check directly: $\tfrac{1}{2} \times 8000 \times 0.05^2 + \tfrac{1}{2} \times 2000 \times 0.20^2 = 10 + 40 = 50\,\mathrm{J}$. The fraction is 100 % in this frame — the centre-of-mass frame is the one in which the kinetic energy is entirely relative, and so entirely available for dissipation.
:::

::: check
A spacecraft with its reaction wheels at rest is drifting with zero angular momentum. It spins up a wheel to store $+2.0\,\mathrm{N\,m\,s}$ about the body $z$ axis. What is the body's angular momentum afterwards, and why can the spacecraft not use its wheels to remove a persistent external torque indefinitely?
:::

::: answer
The wheel motor torque is internal, so the total angular momentum about the centre of mass stays zero: the body acquires $-2.0\,\mathrm{N\,m\,s}$ about $z$, equal and opposite to the wheel. Under a persistent external torque, $d\mathbf{L}_{\mathrm{cm}}/dt = \boldsymbol{\tau}_{\mathrm{ext}}$ says the *total* angular momentum grows without bound; the wheels can hold the body still only by absorbing that growth themselves, and every wheel has a maximum speed. When it is reached the accumulated momentum must be dumped by an external torque — thrusters or magnetic torquers — because no internal action can change the total.
:::

::: check
Explain why a propagator that models a rocket as a point mass at the vehicle's current centre of mass, with mass decreasing according to the mass flow, nevertheless needs a thrust term in the force, if internal forces cannot move a centre of mass.
:::

::: answer
The centre-of-mass theorem applies to a fixed collection of matter. "The vehicle" is not one: its membership changes as propellant leaves, so its centre of mass is not the centre of mass of any fixed system and does not obey $M\ddot{\mathbf{R}} = \mathbf{F}_{\mathrm{ext}}$. The fixed system is vehicle plus exhaust, whose centre of mass does move under external forces alone; the vehicle part accelerates forward because the exhaust part goes backward. When you choose to track only the vehicle, the momentum handed to the exhaust each second shows up as an extra force — the thrust. Lesson 6 derives it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{R} = \frac{1}{M}\sum m_i \mathbf{r}_i = \frac{1}{M}\int \mathbf{r}\,dm$ | centre of mass; additive over sub-assemblies; on any axis or plane of symmetry |
| $\mathbf{P} = M\mathbf{V}$, $\mathbf{V} = \dot{\mathbf{R}}$ | total momentum is total mass times centre-of-mass velocity |
| $M\ddot{\mathbf{R}}_{\mathrm{cm}} = \sum\mathbf{F}_{\mathrm{ext}}$ | centre-of-mass theorem; internal forces cancel in pairs by the third law |
| uniform gravity | acts as $M\mathbf{g}$ at the centre of mass and exerts no torque about it |
| $K = \tfrac{1}{2} M V^2 + K'$ | kinetic energy splits into centre-of-mass motion plus motion relative to the centre of mass; internal forces change only $K'$ |
| $\mu_{\mathrm{red}} = m_1 m_2/(m_1 + m_2)$ | reduced mass; $K' = \tfrac{1}{2}\mu_{\mathrm{red}} v_{\mathrm{rel}}^2$ for two bodies |
| $d\mathbf{L}/dt = \boldsymbol{\tau}_{\mathrm{ext}}$ | about a fixed point; internal torques cancel (strong third law) |
| $\mathbf{L} = \mathbf{R} \times M\mathbf{V} + \mathbf{L}_{\mathrm{cm}}$, $d\mathbf{L}_{\mathrm{cm}}/dt = \boldsymbol{\tau}_{\mathrm{cm}}$ | orbital plus spin angular momentum; the spin law holds about the centre of mass even while it accelerates |
| fixed collection of matter | the condition every law here requires; a rocket alone is not one, vehicle plus exhaust is |

The next lesson applies the centre-of-mass theorem to the system that a rocket and its exhaust form, and derives the rocket equation properly — with the control volume stated, the trap of differentiating $m\mathbf{v}$ exposed, and the thrust and back-pressure terms emerging from the momentum the exhaust carries away.
