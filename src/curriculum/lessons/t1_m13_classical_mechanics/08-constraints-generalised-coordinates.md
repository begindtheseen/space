---
id: l08-constraints-generalised-coordinates
title: Constraints and generalised coordinates
minutes: 24
covers:
  - constraints and generalised coordinates
---

Newton's second law is a statement about every force on a body. On a real vehicle most of the forces are ones you never wanted to know: the bearing load in an engine gimbal, the tension in a solar-array hinge, the pressure of a tank wall on the propellant, the reaction between a reaction wheel and its housing. These are **constraint forces**. They exist only to hold the geometry — the engine on its gimbal, the array on its hinge — and they take whatever value that job requires. To write $\mathbf{F} = m\mathbf{a}$ for each part you must introduce all of them as unknowns, write one equation per part, and then eliminate the unknowns again. For a pendulum this is an annoyance; for a launch vehicle with two gimballed engines, four slosh modes and a flexible interstage it is pages of algebra in which every sign is an opportunity for error.

Lagrangian mechanics, the subject of the next lesson, avoids the constraint forces altogether. It does so by describing the system with exactly as many coordinates as it has freedom to move — **generalised coordinates** — chosen so that every configuration they describe already satisfies the constraints. The constraint forces then never appear, because the equations are only ever asked about motions the constraints allow. This lesson builds that idea from the ground up: what a constraint is, how to count the freedom that remains, how to choose coordinates, how kinetic energy and forces look in those coordinates, and the principle — d'Alembert's — that makes the constraint forces vanish.

## Constraints

A **constraint** is a restriction on the positions or velocities of the particles of a system, imposed by something other than the applied forces. A bead threaded on a wire must stay on the wire. The two ends of a rigid rod stay a fixed distance apart. A gimballed engine's pivot stays fixed to the thrust structure. Propellant modelled as a pendulum bob stays at fixed distance from its pivot. Each is a geometric fact about the system, true at all times and enforced by a force you do not specify.

The most useful class is the **holonomic** constraint: one that can be written as an equation among the coordinates, possibly involving time,

$$
f(\mathbf{r}_1, \mathbf{r}_2, \ldots, \mathbf{r}_N, t) = 0 .
$$

A rigid rod between particles 1 and 2 is $|\mathbf{r}_1 - \mathbf{r}_2|^2 - \ell^2 = 0$. A bead on a circular wire of radius $R$ in the $xy$-plane is two equations, $x^2 + y^2 - R^2 = 0$ and $z = 0$. A pendulum whose pivot is driven along a prescribed path $\mathbf{r}_p(t)$ has $|\mathbf{r} - \mathbf{r}_p(t)|^2 - \ell^2 = 0$: holonomic, with explicit time dependence. A constraint that does not depend on time is called **scleronomic**; one that does is **rheonomic**. The thrust acceleration of a stage acting on its slosh pendulum will be our standard rheonomic example.

Two kinds of constraint fall outside this class and are called **non-holonomic**. The first is an inequality: a particle inside a spherical tank satisfies $|\mathbf{r}| \le R$, which restricts it only when it touches the wall. The second, more important, is a constraint on *velocities* that cannot be integrated to a constraint on positions. A disc rolling without slipping on a plane is the classic case. Its configuration needs four numbers — the contact point $(x, y)$, the heading $\phi$ and the rotation angle $\theta$ about its axle — and rolling imposes two velocity conditions, $\dot{x} = R\dot{\theta}\cos\phi$ and $\dot{y} = R\dot{\theta}\sin\phi$. Yet the disc can be rolled to *any* $(x, y, \phi, \theta)$ whatever, as anyone who has parked a car knows, so no equation $f(x, y, \phi, \theta) = 0$ holds and no coordinate can be eliminated. Non-holonomic systems need extra machinery (Lagrange multipliers) beyond this module; fortunately almost every constraint on a spacecraft — hinges, gimbals, rigid connections, slosh pendulums — is holonomic.

## Degrees of freedom

Each of $N$ free particles needs three coordinates, $3N$ in all. Each independent holonomic constraint removes one, because it lets one coordinate be computed from the others. The number that remain,

$$
n = 3N - k,
$$

is the number of **degrees of freedom**: the number of independent ways the system can move, and therefore the number of coordinates needed to specify its configuration and the number of second-order equations of motion it has.

Counting is often easier by parts than by particles. A rigid body has six degrees of freedom (three of translation, three of rotation) whatever the number of atoms in it. A rigid body confined to a plane has three (two translations and one rotation). A hinge between two bodies removes five and leaves one relative rotation; a spherical joint leaves three; a rigid connection leaves none. So a spacecraft bus with two solar arrays, each on a single-axis hinge, has $6 + 1 + 1 = 8$ degrees of freedom. A launch vehicle modelled in a vertical plane as a rigid body with one gimballed engine (planar hinge) and one slosh pendulum (planar pendulum) has $3 + 1 + 1 = 5$. The Newtonian description of that last system would need the position of every part — $3$ for the body, $3$ for the engine, $2$ for the bob — plus three constraint forces at the gimbal and pivot, eleven unknowns for five real freedoms.

::: example Counting the freedom in a stage model
A guidance engineer wants a planar model of a first stage during ascent: the body, a single engine on a pitch gimbal, propellant slosh in each of two tanks (one pendulum each), and a rigid payload on top. How many degrees of freedom, and how many constraint forces would a Newtonian model have to carry?

Planar rigid body: 3 (two translations, one rotation). Engine on a planar hinge: the engine is itself a planar rigid body (3) minus the hinge's two constraints (the pivot point stays fixed to the body, two equations), leaving 1: the gimbal angle. Each slosh pendulum: a planar particle (2) minus one length constraint, leaving 1: the pendulum angle. The rigid payload adds nothing — a rigid connection removes all three of its planar freedoms. Total $n = 3 + 1 + 2 \times 1 = 5$.

Constraint forces: two components of reaction at the gimbal pivot, plus one tension along each pendulum rod, plus three components of reaction at the payload joint (two forces and a moment): eight unknown constraint quantities, not one of which the engineer cares about, to be introduced and eliminated in a Newtonian treatment. The Lagrangian treatment of lesson 9 introduces none of them.
:::

## Generalised coordinates

A set of **generalised coordinates** $q_1, \ldots, q_n$ is any set of $n$ independent quantities that fixes the configuration of a holonomic system with $n$ degrees of freedom — angles, distances, arc lengths, anything convenient — such that the positions of all the particles are known functions of them and, for rheonomic constraints, of time:

$$
\mathbf{r}_i = \mathbf{r}_i(q_1, \ldots, q_n, t), \qquad i = 1, \ldots, N .
$$

The essential property is that *every* choice of the $q$'s satisfies the constraints automatically. For a planar pendulum of length $\ell$ hanging from the origin, take $q = \theta$, the angle from the downward vertical: $\mathbf{r} = (\ell\sin\theta, -\ell\cos\theta)$. Whatever $\theta$ you pick, $|\mathbf{r}| = \ell$; the constraint is built into the description and cannot be violated. Contrast the Cartesian description $(x, y)$, in which the constraint $x^2 + y^2 = \ell^2$ has to be imposed separately and a force (the tension) has to be present to enforce it.

Generalised coordinates need not be lengths — an angle has units of radians — and their time derivatives, the **generalised velocities** $\dot{q}_j$, need not be velocities in $\mathrm{m/s}$. Differentiating the position map by the chain rule gives the true velocities in terms of them:

$$
\mathbf{v}_i = \dot{\mathbf{r}}_i = \sum_{j=1}^{n}\frac{\partial \mathbf{r}_i}{\partial q_j}\,\dot{q}_j + \frac{\partial \mathbf{r}_i}{\partial t} .
$$

The $\partial \mathbf{r}_i / \partial q_j$ are functions of the $q$'s (and $t$) only, so $\mathbf{v}_i$ is *linear* in the generalised velocities. Two identities follow from this formula, and both are used in the derivation at the end of the lesson:

$$
\frac{\partial \mathbf{v}_i}{\partial \dot{q}_j} = \frac{\partial \mathbf{r}_i}{\partial q_j}, \qquad
\frac{d}{dt}\left(\frac{\partial \mathbf{r}_i}{\partial q_j}\right) = \frac{\partial \mathbf{v}_i}{\partial q_j} .
$$

The first is read off directly, since $\dot{q}_j$ appears only in the one term. The second says that the time derivative of $\partial \mathbf{r}_i / \partial q_j$ — obtained by the chain rule as $\sum_k (\partial^2 \mathbf{r}_i / \partial q_k \partial q_j)\dot{q}_k + \partial^2 \mathbf{r}_i / \partial t\,\partial q_j$ — is the same as the partial derivative of $\mathbf{v}_i$ with respect to $q_j$, because mixed partial derivatives commute. Both are "cancel the dots" rules and both are exact.

## Kinetic energy in generalised coordinates

Substitute the velocity formula into $T = \sum_i \tfrac{1}{2} m_i\,\mathbf{v}_i \cdot \mathbf{v}_i$. Because $\mathbf{v}_i$ is linear in the $\dot{q}$'s, $T$ is quadratic in them:

$$
T = \tfrac{1}{2}\sum_{j,k} M_{jk}(q, t)\,\dot{q}_j\dot{q}_k + \sum_j N_j(q, t)\,\dot{q}_j + T_0(q, t),
$$

with $M_{jk} = \sum_i m_i\,(\partial \mathbf{r}_i / \partial q_j) \cdot (\partial \mathbf{r}_i / \partial q_k)$ the **generalised mass matrix** — symmetric, positive definite, and in general a function of the configuration. For scleronomic constraints the $\partial \mathbf{r}_i / \partial t$ terms vanish and only the quadratic part survives, $T = \tfrac{1}{2}\dot{\mathbf{q}}^{\mathsf{T}}\mathbf{M}(\mathbf{q})\dot{\mathbf{q}}$; this is the form that appears in every multibody simulation code, and computing $\mathbf{M}$ is most of what such a code does.

For the planar pendulum, $\mathbf{v} = \ell\dot{\theta}(\cos\theta, \sin\theta)$ and $T = \tfrac{1}{2} m \ell^2 \dot{\theta}^2$: a single generalised mass $M_{\theta\theta} = m\ell^2$, the moment of inertia about the pivot. Because $T$ is expressed in $\theta$ alone, it cannot contain any information about the tension, which is perpendicular to the motion the coordinate allows.

::: example Kinetic energy of a bus with a slosh pendulum
A stage of body mass $M$ moves along a line (coordinate $x$, along the thrust axis) while a slosh pendulum of mass $m$ and length $\ell$ hangs from a pivot fixed to the body; the pendulum swings in a plane containing the axis, at angle $\theta$ from the axis. Find $T$ in the generalised coordinates $(x, \theta)$.

Put the axis along $\hat{\mathbf{x}}$ with the pendulum's rest position pointing backward, and let the sideways direction be $\hat{\mathbf{y}}$. The bob's position is $\mathbf{r}_m = (x - \ell\cos\theta,\ \ell\sin\theta)$, so its velocity is $\mathbf{v}_m = (\dot{x} + \ell\dot{\theta}\sin\theta,\ \ell\dot{\theta}\cos\theta)$ and

$$
|\mathbf{v}_m|^2 = \dot{x}^2 + 2\ell\dot{x}\dot{\theta}\sin\theta + \ell^2\dot{\theta}^2 .
$$

The body's velocity is $\dot{x}$. Hence

$$
T = \tfrac{1}{2}(M + m)\dot{x}^2 + m\ell\sin\theta\,\dot{x}\dot{\theta} + \tfrac{1}{2} m\ell^2\dot{\theta}^2,
\qquad
\mathbf{M}(\theta) = \begin{pmatrix} M + m & m\ell\sin\theta \\ m\ell\sin\theta & m\ell^2 \end{pmatrix}.
$$

The off-diagonal term couples the two coordinates: swinging the bob shakes the body and accelerating the body swings the bob. It depends on $\theta$, so the mass matrix is not constant, which is typical. For $M = 400\,\mathrm{t}$, $m = 20\,\mathrm{t}$ and $\ell = 1.5\,\mathrm{m}$ at $\theta = 10°$, the entries are $4.2 \times 10^{5}\,\mathrm{kg}$, $20{,}000 \times 1.5 \times 0.174 \approx 5.2 \times 10^{3}\,\mathrm{kg\,m}$ and $20{,}000 \times 2.25 = 4.5 \times 10^{4}\,\mathrm{kg\,m^2}$ — note the mixed units, a normal consequence of mixing a length coordinate with an angle. Lesson 9 turns this $T$ into equations of motion in two lines.
:::

## Virtual displacements and d'Alembert's principle

The device that removes the constraint forces is the **virtual displacement** $\delta\mathbf{r}_i$: an imagined infinitesimal change of configuration, at a *frozen* instant of time, that is consistent with the constraints as they stand at that instant. Real displacements $d\mathbf{r}_i$ happen over $dt$ and, for a rheonomic constraint, must follow the constraint as it moves; a virtual displacement ignores the passage of time and slides along the constraint surface as it is now. In generalised coordinates,

$$
\delta\mathbf{r}_i = \sum_j \frac{\partial \mathbf{r}_i}{\partial q_j}\,\delta q_j ,
$$

with no $\partial \mathbf{r}_i / \partial t$ term — that is the frozen-time condition — and with the $\delta q_j$ arbitrary and independent, since the $q$'s are unconstrained.

Now the key physical assumption. Split the total force on each particle into the applied force $\mathbf{F}_i$ (gravity, thrust, springs, drag — everything you specify) and the constraint force $\mathbf{C}_i$. Constraints are called **ideal** when the constraint forces do no total work in any virtual displacement:

$$
\sum_i \mathbf{C}_i \cdot \delta\mathbf{r}_i = 0 .
$$

Every smooth constraint in this module is ideal. The normal force from a frictionless surface is perpendicular to any displacement along it. The tension in a rigid rod acts along the rod, while the two ends' virtual displacements have equal components along it, so the two tension forces (equal and opposite) do cancelling work. A frictionless hinge or gimbal bearing exerts a force at a point that does not move relative to either body. In each case the constraint force is perpendicular to the freedom the constraint leaves, which is exactly what "the force exists only to enforce the geometry" means. Friction in a bearing is *not* ideal — it does work in a virtual rotation — and is handled as an applied force.

With this assumption, Newton's second law for each particle, $\mathbf{F}_i + \mathbf{C}_i = m_i\ddot{\mathbf{r}}_i$, can be rearranged as $\mathbf{F}_i - m_i\ddot{\mathbf{r}}_i = -\mathbf{C}_i$, dotted with $\delta\mathbf{r}_i$ and summed:

$$
\sum_i \left(\mathbf{F}_i - m_i\ddot{\mathbf{r}}_i\right) \cdot \delta\mathbf{r}_i = 0 .
$$

This is **d'Alembert's principle**. It contains all of Newton's laws for the system and *no constraint forces*. The price is that it is a single scalar statement about all virtual displacements at once rather than $3N$ vector equations; the payoff is that when it is expanded in generalised coordinates it yields exactly $n$ equations — one per degree of freedom — with the constraint forces gone for good.

## Generalised forces

Expand the applied-force term using the virtual displacement formula:

$$
\sum_i \mathbf{F}_i \cdot \delta\mathbf{r}_i = \sum_j \left(\sum_i \mathbf{F}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}\right)\delta q_j \equiv \sum_j Q_j\,\delta q_j .
$$

The quantity

$$
Q_j = \sum_i \mathbf{F}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}
$$

is the **generalised force** conjugate to $q_j$. It is defined so that $Q_j\,\delta q_j$ is the work the applied forces do when $q_j$ alone is varied. If $q_j$ is a length, $Q_j$ is a force in newtons; if $q_j$ is an angle, $Q_j$ is a torque in newton-metres. The definition also gives you a method: to find $Q_j$, imagine changing $q_j$ by $\delta q_j$ with everything else held, compute the work done by the applied forces, and divide by $\delta q_j$.

When some of the applied forces are conservative, with potential $V(q, t)$ expressed in the generalised coordinates, their contribution is simply $-\partial V / \partial q_j$: the chain rule gives $\sum_i (-\nabla_i V) \cdot (\partial \mathbf{r}_i / \partial q_j) = -\partial V / \partial q_j$. Only the *non-conservative* applied forces — thrust, drag, damping, motor torques — need the work computation, and they are what lesson 9's $Q_j$ will denote.

::: example Generalised force from a gimballed engine
A planar stage has generalised coordinates $(x, z, \psi)$ for the centre of mass and pitch attitude, and the engine gimbal angle $\delta$ is commanded (so it is a known function of time, not a coordinate). Thrust $T$ acts at the gimbal pivot, a distance $l$ behind the centre of mass along the body axis, at angle $\delta$ to that axis. Find the generalised forces.

Let the body axis point along the unit vector $\hat{\mathbf{b}} = (\cos\psi, \sin\psi)$ in the $(x, z)$ plane, and let $\hat{\mathbf{n}} = (-\sin\psi, \cos\psi)$ be the body normal. The thrust vector is $\mathbf{T} = T(\cos\delta\,\hat{\mathbf{b}} + \sin\delta\,\hat{\mathbf{n}})$, applied at $\mathbf{r}_T = (x, z) - l\,\hat{\mathbf{b}}$.

For $x$: $\partial \mathbf{r}_T / \partial x = (1, 0)$, so $Q_x = \mathbf{T} \cdot (1, 0) = T(\cos\delta\cos\psi - \sin\delta\sin\psi) = T\cos(\psi + \delta)$. Similarly $Q_z = T\sin(\psi + \delta)$: the thrust force resolved into inertial axes, as it must be.

For $\psi$: $\partial \mathbf{r}_T / \partial\psi = -l\,\partial\hat{\mathbf{b}} / \partial\psi = -l\,\hat{\mathbf{n}}$, so $Q_\psi = \mathbf{T} \cdot (-l\,\hat{\mathbf{n}}) = -T l\sin\delta$: the thrust torque about the centre of mass, with the sign saying that a positive gimbal deflection (nozzle swung toward $+\hat{\mathbf{n}}$) pitches the vehicle toward $-\psi$. With $T = 845\,\mathrm{kN}$, $l = 20\,\mathrm{m}$ and $\delta = 2°$, the control torque is $845{,}000 \times 20 \times 0.0349 \approx 5.9 \times 10^{5}\,\mathrm{N\,m}$, from a lateral thrust component of $845{,}000 \times \sin 2° \approx 29.5\,\mathrm{kN}$; the axial component drops by only $T(1 - \cos 2°) \approx 515\,\mathrm{N}$ — the steering-loss term of lesson 7 in a new guise. No gimbal bearing force appeared anywhere.
:::

## From d'Alembert to Lagrange's equations

The last step converts the inertial term of d'Alembert's principle into derivatives of the kinetic energy. Expand it in generalised coordinates,

$$
\sum_i m_i\ddot{\mathbf{r}}_i \cdot \delta\mathbf{r}_i = \sum_j\left(\sum_i m_i\ddot{\mathbf{r}}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}\right)\delta q_j ,
$$

and work on the bracket. By the product rule,

$$
m_i\ddot{\mathbf{r}}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}
= \frac{d}{dt}\left(m_i\mathbf{v}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}\right) - m_i\mathbf{v}_i \cdot \frac{d}{dt}\left(\frac{\partial \mathbf{r}_i}{\partial q_j}\right).
$$

Now use the two identities. In the first term replace $\partial \mathbf{r}_i / \partial q_j$ by $\partial \mathbf{v}_i / \partial \dot{q}_j$; in the second replace $\frac{d}{dt}(\partial \mathbf{r}_i / \partial q_j)$ by $\partial \mathbf{v}_i / \partial q_j$. Since $m_i\mathbf{v}_i \cdot \partial\mathbf{v}_i / \partial\dot{q}_j = \partial(\tfrac{1}{2} m_i v_i^2) / \partial\dot{q}_j$, and likewise for $q_j$, summing over $i$ gives

$$
\sum_i m_i\ddot{\mathbf{r}}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j} = \frac{d}{dt}\left(\frac{\partial T}{\partial \dot{q}_j}\right) - \frac{\partial T}{\partial q_j}.
$$

Put this and the generalised forces back into d'Alembert's principle:

$$
\sum_j \left[\frac{d}{dt}\left(\frac{\partial T}{\partial \dot{q}_j}\right) - \frac{\partial T}{\partial q_j} - Q_j\right]\delta q_j = 0 .
$$

The $\delta q_j$ are independent and arbitrary — that is what it meant to choose generalised coordinates for a holonomic system — so each bracket must vanish separately:

$$
\frac{d}{dt}\left(\frac{\partial T}{\partial \dot{q}_j}\right) - \frac{\partial T}{\partial q_j} = Q_j, \qquad j = 1, \ldots, n .
$$

These are **Lagrange's equations** in their most general form: $n$ second-order equations, one per degree of freedom, containing only the kinetic energy expressed in the generalised coordinates and the generalised applied forces. The constraint forces were eliminated by the ideal-constraint assumption and never came back. The next lesson splits $Q_j$ into a conservative part, absorbed into a Lagrangian $L = T - V$, and a remainder, and shows that the result can also be reached from a single variational principle.

::: key
For a holonomic system with ideal constraints, choose $n = 3N - k$ generalised coordinates $q_j$ that satisfy the constraints by construction. Then the constraint forces vanish from the dynamics and the equations of motion are $\frac{d}{dt}(\partial T/\partial\dot{q}_j) - \partial T/\partial q_j = Q_j$, with $Q_j = \sum_i \mathbf{F}_i \cdot \partial\mathbf{r}_i/\partial q_j$ the generalised applied force.
:::

::: warning
Three ways to misuse generalised coordinates. Choosing coordinates that are not independent — say $x$, $y$ *and* $\theta$ for a pendulum — reintroduces the constraint and invalidates the step where the $\delta q_j$ were taken arbitrary. Forgetting that a rheonomic constraint puts explicit $t$ into $\mathbf{r}_i(q, t)$, and hence linear and constant terms into $T$. And treating a non-ideal constraint force — bearing friction, a damper — as if it vanished: it does virtual work and belongs in $Q_j$. If you need a constraint force's value after all (a gimbal bearing load for structural sizing), recover it afterwards from Newton's law for one part, using the motion the Lagrangian equations gave you.
:::

## Check yourself

::: check
Classify each constraint as holonomic or not, and as scleronomic or rheonomic where it applies: (a) a bead on a rigid circular hoop that rotates at fixed angular rate about a vertical diameter; (b) a satellite tethered to a station by a slack-capable cable of length $L$; (c) a spacecraft's two solar arrays hinged to the bus; (d) a sphere rolling without slipping on a flat plane.
:::

::: answer
(a) Holonomic and rheonomic: the bead satisfies $|\mathbf{r}| = R$ and lies in a plane whose orientation is a prescribed function of time. (b) Non-holonomic: the constraint is the inequality $|\mathbf{r}_{\mathrm{sat}} - \mathbf{r}_{\mathrm{stn}}| \le L$, active only when the tether is taut. (c) Holonomic and scleronomic: each hinge fixes the array's pivot to the bus and its rotation axis, five equations per array, leaving one angle each. (d) Non-holonomic: rolling imposes velocity conditions that cannot be integrated to a relation among the position coordinates, so the sphere can reach any configuration and none of its five coordinates can be eliminated.
:::

::: check
A double pendulum — two rods of lengths $\ell_1, \ell_2$ with bobs $m_1, m_2$, hinged in a vertical plane — is a common model for a two-segment flexible boom. How many degrees of freedom does it have? Choose generalised coordinates, write the bobs' positions in them, and count the constraint forces the Newtonian description would need.
:::

::: answer
Two particles in a plane give $4$ coordinates; two length constraints leave $n = 2$. Take $\theta_1, \theta_2$ as the rod angles from the downward vertical. Then $\mathbf{r}_1 = \ell_1(\sin\theta_1, -\cos\theta_1)$ and $\mathbf{r}_2 = \mathbf{r}_1 + \ell_2(\sin\theta_2, -\cos\theta_2)$; every pair of angles satisfies both constraints automatically. Newton would need two rod tensions as unknowns and four scalar equations, then eliminate the tensions — and the second tension appears in both bobs' equations with opposite signs, which is where errors creep in.
:::

::: check
A particle of mass $m$ slides on a frictionless wire bent into the parabola $z = a x^2$ in a vertical plane, under gravity $g$. Using $x$ as the generalised coordinate, find $T$, the generalised force $Q_x$ due to gravity, and the equation of motion.
:::

::: answer
Position $\mathbf{r} = (x, a x^2)$, velocity $\mathbf{v} = (\dot{x}, 2 a x\dot{x})$, so $T = \tfrac{1}{2} m (1 + 4a^2x^2)\dot{x}^2$ — a configuration-dependent generalised mass. Gravity $\mathbf{F} = (0, -mg)$ gives $Q_x = \mathbf{F} \cdot \partial\mathbf{r}/\partial x = (0, -mg) \cdot (1, 2ax) = -2 m g a x$; equivalently $V = m g a x^2$ and $Q_x = -\partial V/\partial x$. Lagrange's equation: $\frac{d}{dt}[m(1 + 4a^2x^2)\dot{x}] - 4 m a^2 x\dot{x}^2 = -2 m g a x$, which expands to $m(1 + 4a^2x^2)\ddot{x} + 4 m a^2 x\dot{x}^2 = -2 m g a x$. The normal force from the wire never appeared. For small $x$ this is $\ddot{x} \approx -2 g a x$: oscillation at $\omega = \sqrt{2 g a}$.
:::

::: check
Explain in your own words why the tension in a pendulum rod does no virtual work, and why friction at the pivot does. What does this imply for how each is handled in Lagrange's equations?
:::

::: answer
The tension acts along the rod, and any virtual displacement consistent with the constraint moves the bob perpendicular to the rod (the length is fixed), so $\mathbf{C} \cdot \delta\mathbf{r} = 0$: the constraint is ideal and the tension drops out of d'Alembert's principle. Pivot friction is a torque that acts about the very axis the coordinate $\theta$ rotates around; a virtual rotation $\delta\theta$ is precisely the motion it resists, so its virtual work $-\tau_f\,\delta\theta$ is nonzero. It is therefore not a constraint force in the ideal sense and must be included as an applied generalised force, $Q_\theta = -\tau_f$, on the right-hand side.
:::

::: check
A stage's thrust acceleration makes the propellant in its tank behave like a pendulum of effective length $1.5\,\mathrm{m}$ in an effective gravity equal to the thrust acceleration, $13.6\,\mathrm{m/s^2}$, with the pivot fixed to the body. Write the generalised force on the pendulum angle and find the small-amplitude oscillation frequency. How does it compare with the same tank on the pad?
:::

::: answer
With the pivot fixed to the body and the body frame treated as having effective gravity $a$ along the axis, the bob at angle $\theta$ has $V = -m a \ell\cos\theta$ and $Q_\theta = -\partial V/\partial\theta = -m a\ell\sin\theta$; with $T = \tfrac{1}{2} m\ell^2\dot{\theta}^2$, Lagrange's equation gives $m\ell^2\ddot{\theta} = -m a\ell\sin\theta$, or $\ddot{\theta} + (a/\ell)\sin\theta = 0$. For small angles $\omega = \sqrt{a/\ell} = \sqrt{13.6/1.5} \approx 3.01\,\mathrm{rad/s}$, about $0.48\,\mathrm{Hz}$. On the pad $a = g_0$ and $\omega = \sqrt{9.81/1.5} \approx 2.56\,\mathrm{rad/s}$, $0.41\,\mathrm{Hz}$. The slosh frequency rises with thrust acceleration, which is why it must be tracked through the burn — the attitude controller's filters have to stay clear of it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| holonomic constraint $f(\mathbf{r}_1, \ldots, \mathbf{r}_N, t) = 0$ | an equation among coordinates; scleronomic without $t$, rheonomic with |
| non-holonomic | inequalities, or velocity constraints that do not integrate (rolling); no coordinate can be eliminated |
| $n = 3N - k$ | degrees of freedom; count by parts: rigid body 6 (planar 3), hinge leaves 1, spherical joint 3 |
| $\mathbf{r}_i = \mathbf{r}_i(q_1, \ldots, q_n, t)$ | generalised coordinates satisfy the constraints by construction |
| $\mathbf{v}_i = \sum_j (\partial\mathbf{r}_i/\partial q_j)\dot{q}_j + \partial\mathbf{r}_i/\partial t$ | velocities linear in generalised velocities |
| $\partial\mathbf{v}_i/\partial\dot{q}_j = \partial\mathbf{r}_i/\partial q_j$, $\frac{d}{dt}(\partial\mathbf{r}_i/\partial q_j) = \partial\mathbf{v}_i/\partial q_j$ | the "cancel the dots" identities |
| $T = \tfrac{1}{2}\dot{\mathbf{q}}^{\mathsf{T}}\mathbf{M}(\mathbf{q})\dot{\mathbf{q}} + \ldots$ | kinetic energy quadratic in $\dot{q}$; $\mathbf{M}$ the generalised mass matrix |
| ideal constraint: $\sum_i \mathbf{C}_i \cdot \delta\mathbf{r}_i = 0$ | constraint forces do no virtual work (smooth surfaces, rods, frictionless hinges) |
| d'Alembert: $\sum_i (\mathbf{F}_i - m_i\ddot{\mathbf{r}}_i) \cdot \delta\mathbf{r}_i = 0$ | Newton's laws without constraint forces |
| $Q_j = \sum_i \mathbf{F}_i \cdot \partial\mathbf{r}_i/\partial q_j$ | generalised force; $-\partial V/\partial q_j$ for the conservative part |
| $\frac{d}{dt}(\partial T/\partial\dot{q}_j) - \partial T/\partial q_j = Q_j$ | Lagrange's equations, general form |

The next lesson absorbs the conservative forces into a Lagrangian $L = T - V$, states the Euler-Lagrange equation in the form the module's flashcards use, shows that the same equations follow from Hamilton's principle of stationary action, and works the slosh and orbit examples through to equations of motion and conservation laws.
