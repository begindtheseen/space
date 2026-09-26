---
id: l08-constraints-generalised-coordinates
title: Constraints and generalised coordinates
minutes: 24
covers:
  - constraints and generalised coordinates
---

Think of a train. The rails decide its route, pushing on the wheels with whatever force it takes to keep them on track — harder on a tight bend at speed. Nobody sets that force. It is "whatever the rails need".

Newton's second law wants *every* force on a body, including those. On a real vehicle most of the forces are ones you never wanted to know: the bearing load in an engine gimbal, the pull in a solar-array hinge, the tank wall pressing on the propellant, the push between a reaction wheel and its housing. These are **[[constraint forces|constraint-force]]** — forces that exist only to hold the geometry, taking whatever value that job needs. To write $\mathbf{F} = m\mathbf{a}$ for each part, you add them all as unknowns and then eliminate them again. For a pendulum that is a nuisance. For a launch vehicle with two gimballed engines, four slosh modes and a bendy interstage, it is pages of algebra where every sign is a chance to go wrong.

Lagrangian mechanics, the subject of the next lesson, avoids constraint forces altogether. It describes the system with exactly as many numbers as it has freedom to move — **generalised coordinates** — chosen so every configuration they describe already obeys the constraints. The constraint forces never appear, because the equations only ask about motions the constraints allow. This lesson builds that idea, ending with the principle — d'Alembert's — that makes the constraint forces vanish.

## Constraints

A **constraint** is a rule that limits where the parts of a system can be, or how they can move, enforced by something other than the forces you specify. A bead threaded on a wire must stay on the wire. The two ends of a rigid rod stay a fixed distance apart. A gimballed engine's pivot stays fixed to the thrust structure. Propellant modelled as a pendulum bob stays a fixed distance from its pivot. Each is enforced by a force nobody writes down.

The most useful kind is the **[[holonomic|holonomic-word]]** constraint: an equation among the positions, possibly with time in it,

$$
f(\mathbf{r}_1, \mathbf{r}_2, \ldots, \mathbf{r}_N, t) = 0 .
$$

Here $\mathbf{r}_1$ ("r one", bold because it is a vector) is the position of particle 1, and so on up to particle $N$. Some examples:

- A rigid rod between particles 1 and 2: $|\mathbf{r}_1 - \mathbf{r}_2|^2 - \ell^2 = 0$, with $\ell$ the rod length.
- A bead on a circular wire of radius $R$ in the $xy$-plane: two equations, $x^2 + y^2 - R^2 = 0$ and $z = 0$.
- A pendulum whose pivot is driven along a set path $\mathbf{r}_p(t)$: $|\mathbf{r} - \mathbf{r}_p(t)|^2 - \ell^2 = 0$. Still holonomic, but with time written into it.

A constraint with no time in it is **scleronomic** ("rigid law"); one with time in it is **rheonomic** ("flowing law").

Two kinds of constraint fall outside this class. They are called **non-holonomic**.

- **Inequalities.** A particle inside a spherical tank satisfies $|\mathbf{r}| \le R$. It is only restricted when it touches the wall.
- **Velocity rules that do not reduce to position rules.** A disc rolling without slipping on a plane is the classic case. Its configuration needs four numbers: the contact point $(x, y)$, the heading $\phi$ and the roll angle $\theta$ about its axle. Rolling imposes two velocity rules, $\dot{x} = R\dot{\theta}\cos\phi$ and $\dot{y} = R\dot{\theta}\sin\phi$. Yet the disc can be rolled to *any* $(x, y, \phi, \theta)$ at all — as anyone who has **[[parallel-parked|parallel-parking]]** a car knows. So no equation $f(x, y, \phi, \theta) = 0$ holds, and no coordinate can be eliminated.

Non-holonomic systems need extra machinery (Lagrange multipliers) beyond this module. Luckily, almost every constraint on a spacecraft — hinges, gimbals, rigid joints, slosh pendulums — is holonomic.

## Degrees of freedom

A free particle needs three numbers to say where it is. $N$ free particles need $3N$. Each independent holonomic constraint lets you compute one of those numbers from the others, so it removes one. What is left,

$$
n = 3N - k ,
$$

where $k$ is the number of constraints, is the number of **degrees of freedom**: the independent ways the system can move. It is also how many coordinates fix its configuration, and how many second-order equations of motion it has.

Counting by parts is often easier than counting particles.

- A rigid body has **6** degrees of freedom (three ways to slide, three ways to turn), however many atoms it has. Confined to a plane, it has **3** (two slides and one turn).
- A hinge between two bodies removes 5 and leaves 1 relative rotation. A ball joint leaves 3. A rigid connection leaves 0.

So a spacecraft bus with two hinged solar arrays has $6 + 1 + 1 = 8$ degrees of freedom. A launch vehicle modelled in a vertical plane as a rigid body with one gimballed engine and one slosh pendulum has $3 + 1 + 1 = 5$. The Newtonian description of that last one needs the position of every part — 3 numbers for the body, 3 for the engine, 2 for the bob — plus three constraint forces at the gimbal and pivot. That is eleven unknowns for five real freedoms.

::: example Counting the freedom in a stage model
A guidance engineer wants a planar model of a first stage during ascent. It has the body, one engine on a pitch gimbal, propellant slosh in each of two tanks (one pendulum per tank), and a rigid payload on top. How many degrees of freedom? How many constraint forces would a Newtonian model have to carry?

**Freedoms, part by part.**

- Body, a planar rigid body: 3.
- Engine on a planar hinge: the engine is itself a planar rigid body (3), minus the hinge's 2 constraints (the pivot point stays fixed to the body — one equation for each direction). That leaves 1: the gimbal angle.
- Each slosh pendulum: a particle in the plane (2) minus 1 length constraint, leaving 1: the swing angle. Two tanks give 2.
- Rigid payload: a rigid joint removes all 3 of its planar freedoms, adding 0.

Total: $n = 3 + 1 + 2 + 0 = 6$.

**Check by counting particles and constraints.** Coordinates: $3 + 3 + 2 + 2 + 3 = 13$. Constraints: $2 + 1 + 1 + 3 = 7$. And $13 - 7 = 6$. The two counts agree.

**Constraint forces.** Two reaction components at the gimbal pivot, one tension along each pendulum rod (two in all), and three at the payload joint (two forces and a moment): seven unknown constraint quantities. A Newtonian treatment must introduce and eliminate every one. The Lagrangian treatment of lesson 9 introduces none.
:::

## Generalised coordinates

A set of **generalised coordinates** $q_1, \ldots, q_n$ is any $n$ independent numbers that fix the configuration of a holonomic system with $n$ degrees of freedom. They can be angles, distances, arc lengths — whatever is convenient. The positions of all the particles must be known functions of them (and of time, for a rheonomic constraint):

$$
\mathbf{r}_i = \mathbf{r}_i(q_1, \ldots, q_n, t), \qquad i = 1, \ldots, N .
$$

The key property: *every* choice of the $q$'s obeys the constraints automatically.

Take a pendulum of length $\ell$ hanging from the origin. Choose $q = \theta$, the angle from straight down, so the bob is at $\mathbf{r} = (\ell\sin\theta, -\ell\cos\theta)$. Whatever $\theta$ you pick, $|\mathbf{r}| = \ell$: the constraint cannot be broken. In the $(x, y)$ description, by contrast, the rule $x^2 + y^2 = \ell^2$ must be imposed separately, with a tension to enforce it.

Generalised coordinates need not be lengths — an angle is in radians. So their rates, the **generalised velocities** $\dot{q}_j$ ("q-dot sub j"), need not be in $\mathrm{m/s}$. The chain rule turns them into true velocities:

$$
\mathbf{v}_i = \dot{\mathbf{r}}_i = \sum_{j=1}^{n}\frac{\partial \mathbf{r}_i}{\partial q_j}\,\dot{q}_j + \frac{\partial \mathbf{r}_i}{\partial t} .
$$

(The curly $\partial$, read "partial", means "rate of change with respect to this one variable, holding the others fixed".) The $\partial \mathbf{r}_i / \partial q_j$ depend only on the $q$'s and $t$. So $\mathbf{v}_i$ is *linear* in the generalised velocities — each $\dot{q}_j$ appears only to the first power. Two identities follow, and both are used at the end of the lesson:

$$
\frac{\partial \mathbf{v}_i}{\partial \dot{q}_j} = \frac{\partial \mathbf{r}_i}{\partial q_j}, \qquad
\frac{d}{dt}\left(\frac{\partial \mathbf{r}_i}{\partial q_j}\right) = \frac{\partial \mathbf{v}_i}{\partial q_j} .
$$

Both are "cancel the dots" rules, and both are exact.

::: note Why the two identities have to be true
**First.** In the velocity formula, $\dot{q}_j$ appears in exactly one term, multiplied by $\partial \mathbf{r}_i / \partial q_j$. Take the partial derivative with respect to $\dot{q}_j$ and that multiplier is all that is left.

**Second.** Differentiate $\partial \mathbf{r}_i / \partial q_j$ in time by the chain rule: $\sum_k (\partial^2 \mathbf{r}_i / \partial q_k \partial q_j)\dot{q}_k + \partial^2 \mathbf{r}_i / \partial t\,\partial q_j$. Now take $\partial/\partial q_j$ of the velocity formula: you get the same sum with the two derivatives taken in the other order. Mixed partial derivatives of a smooth function do not care about order, so the two are equal.
:::

## Kinetic energy in generalised coordinates

Put the velocity formula into the kinetic energy, $T = \sum_i \tfrac{1}{2} m_i\,\mathbf{v}_i \cdot \mathbf{v}_i$. (In this lesson and the next, $T$ is kinetic energy; thrust will be written out in words or given its own letter.) Since $\mathbf{v}_i$ is linear in the $\dot{q}$'s, squaring it makes $T$ **quadratic** in them:

$$
T = \tfrac{1}{2}\sum_{j,k} M_{jk}(q, t)\,\dot{q}_j\dot{q}_k + \sum_j N_j(q, t)\,\dot{q}_j + T_0(q, t),
$$

with

$$
M_{jk} = \sum_i m_i\,\frac{\partial \mathbf{r}_i}{\partial q_j} \cdot \frac{\partial \mathbf{r}_i}{\partial q_k}
$$

the **[[generalised mass matrix|mass-matrix]]**. It is symmetric, positive definite, and usually changes with the configuration. For scleronomic constraints the $\partial \mathbf{r}_i / \partial t$ terms vanish, leaving $T = \tfrac{1}{2}\dot{\mathbf{q}}^{\mathsf{T}}\mathbf{M}(\mathbf{q})\dot{\mathbf{q}}$ — the form inside every multibody simulation code.

For the pendulum, $\mathbf{v} = \ell\dot{\theta}(\cos\theta, \sin\theta)$ and $T = \tfrac{1}{2} m \ell^2 \dot{\theta}^2$. There is one generalised mass, $M_{\theta\theta} = m\ell^2$: the moment of inertia about the pivot. Because $T$ is written in $\theta$ alone, it holds no trace of the tension, which acts at right angles to the only motion $\theta$ allows.

::: example Kinetic energy of a stage with a slosh pendulum
A stage body of mass $M$ moves along its thrust axis (coordinate $x$). A slosh pendulum of mass $m$ and length $\ell$ hangs from a pivot fixed to the body and swings in a plane containing the axis, at angle $\theta$ from the axis. Find $T$ in the generalised coordinates $(x, \theta)$.

**Positions.** Put the axis along $\hat{\mathbf{x}}$, with the pendulum at rest pointing backward, and let $\hat{\mathbf{y}}$ be sideways. The bob sits at

$$
\mathbf{r}_m = (x - \ell\cos\theta,\ \ell\sin\theta).
$$

**Velocities.** Differentiate each part in time: $\mathbf{v}_m = (\dot{x} + \ell\dot{\theta}\sin\theta,\ \ell\dot{\theta}\cos\theta)$. Square and add the two parts, using $\sin^2\theta + \cos^2\theta = 1$:

$$
|\mathbf{v}_m|^2 = \dot{x}^2 + 2\ell\dot{x}\dot{\theta}\sin\theta + \ell^2\dot{\theta}^2 .
$$

The body moves at $\dot{x}$.

**Kinetic energy.** Add $\tfrac{1}{2}M\dot{x}^2$ and $\tfrac{1}{2}m|\mathbf{v}_m|^2$:

$$
T = \tfrac{1}{2}(M + m)\dot{x}^2 + m\ell\sin\theta\,\dot{x}\dot{\theta} + \tfrac{1}{2} m\ell^2\dot{\theta}^2,
\qquad
\mathbf{M}(\theta) = \begin{pmatrix} M + m & m\ell\sin\theta \\ m\ell\sin\theta & m\ell^2 \end{pmatrix}.
$$

The off-diagonal term couples the coordinates: swinging the bob shakes the body, and speeding up the body swings the bob. It depends on $\theta$, so the mass matrix is not constant — which is typical.

**Numbers.** For $M = 400\,\mathrm{t}$, $m = 20\,\mathrm{t}$, $\ell = 1.5\,\mathrm{m}$ and $\theta = 10°$: $M + m = 4.2 \times 10^{5}\,\mathrm{kg}$; $m\ell\sin\theta = 20{,}000 \times 1.5 \times 0.174 \approx 5.2 \times 10^{3}\,\mathrm{kg\,m}$; $m\ell^2 = 20{,}000 \times 2.25 = 4.5 \times 10^{4}\,\mathrm{kg\,m^2}$. The units differ from entry to entry, which is normal when a length sits next to an angle. Lesson 9 turns this $T$ into equations of motion in two lines.
:::

## Virtual displacements and d'Alembert's principle

The trick that removes the constraint forces is the **[[virtual displacement|virtual-displacement]]** $\delta\mathbf{r}_i$ ("delta r sub i"). It is an imagined, tiny shift of the configuration, made with the clock *frozen*, that obeys the constraints as they stand at that instant. A real displacement $d\mathbf{r}_i$ happens over a time $dt$ and must follow a moving constraint as it moves. A virtual one ignores time and slides along the constraint as it is now. In generalised coordinates,

$$
\delta\mathbf{r}_i = \sum_j \frac{\partial \mathbf{r}_i}{\partial q_j}\,\delta q_j .
$$

There is no $\partial \mathbf{r}_i / \partial t$ term — that is the frozen clock. And the $\delta q_j$ can be chosen freely and independently, because the $q$'s carry no constraints.

Now the key physical assumption. Split the total force on each particle into the **applied force** $\mathbf{F}_i$ (gravity, thrust, springs, drag — everything you specify) and the constraint force $\mathbf{C}_i$. Constraints are **ideal** when the constraint forces do no total work in any virtual displacement:

$$
\sum_i \mathbf{C}_i \cdot \delta\mathbf{r}_i = 0 .
$$

Every smooth constraint in this module is ideal:

- A frictionless surface pushes straight out of the surface, at right angles to any slide along it.
- A rigid rod pulls along its length. The two ends' allowed shifts have equal parts along the rod, so the equal and opposite pulls do cancelling work.
- A frictionless hinge or gimbal pushes at a point that does not move relative to either body.

In each case the constraint force is at right angles to the freedom left — exactly what "the force only holds the geometry" means. Bearing friction is *not* ideal: it does work in a virtual rotation, so it is treated as an applied force.

With this assumption, take Newton's law for each particle, $\mathbf{F}_i + \mathbf{C}_i = m_i\ddot{\mathbf{r}}_i$, and rearrange it as $\mathbf{F}_i - m_i\ddot{\mathbf{r}}_i = -\mathbf{C}_i$. Dot both sides with $\delta\mathbf{r}_i$ and add over all particles. The right side sums to zero, leaving

$$
\sum_i \left(\mathbf{F}_i - m_i\ddot{\mathbf{r}}_i\right) \cdot \delta\mathbf{r}_i = 0 .
$$

This is **[[d'Alembert's principle|dalembert]]**. It contains all of Newton's laws for the system and *no constraint forces*. It is one scalar statement about all virtual displacements at once, but written in generalised coordinates it gives exactly $n$ equations — one per degree of freedom — with the constraint forces gone for good.

## Generalised forces

Expand the applied-force term using the virtual displacement formula:

$$
\sum_i \mathbf{F}_i \cdot \delta\mathbf{r}_i = \sum_j \left(\sum_i \mathbf{F}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}\right)\delta q_j \equiv \sum_j Q_j\,\delta q_j .
$$

The quantity

$$
Q_j = \sum_i \mathbf{F}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}
$$

is the **generalised force** that goes with $q_j$. It is built so that $Q_j\,\delta q_j$ is the work the applied forces do when $q_j$ alone changes. If $q_j$ is a length, $Q_j$ is a force in newtons. If $q_j$ is an angle, $Q_j$ is a **[[torque|generalised-force-units]]** in newton-metres.

The definition is also a recipe: nudge $q_j$ by $\delta q_j$ with everything else held, find the work the applied forces do, and divide by $\delta q_j$.

Conservative forces are even easier. If they come from a potential energy $V(q, t)$ written in the generalised coordinates, their share is exactly $-\partial V / \partial q_j$. (The chain rule gives $\sum_i (-\nabla_i V) \cdot (\partial \mathbf{r}_i / \partial q_j) = -\partial V / \partial q_j$.) Only the *non-conservative* forces — thrust, drag, damping, motor torques — need the work calculation. They are what lesson 9's $Q_j$ will mean.

::: example Generalised force from a gimballed engine
A planar stage has generalised coordinates $(x, z, \psi)$: the centre of mass position and the pitch attitude $\psi$ ("psi"). The gimbal angle $\delta$ is commanded — a known function of time, not a coordinate. Thrust of size $F_T$ acts at the gimbal pivot, a distance $l$ behind the centre of mass along the body axis, at angle $\delta$ to that axis. Find the generalised forces.

**Set up directions.** The body axis is the unit vector $\hat{\mathbf{b}} = (\cos\psi, \sin\psi)$ in the $(x, z)$ plane, and the body normal is $\hat{\mathbf{n}} = (-\sin\psi, \cos\psi)$. The thrust vector is $\mathbf{F}_T = F_T(\cos\delta\,\hat{\mathbf{b}} + \sin\delta\,\hat{\mathbf{n}})$. It acts at $\mathbf{r}_T = (x, z) - l\,\hat{\mathbf{b}}$.

**For $x$ and $z$.** $\partial \mathbf{r}_T / \partial x = (1, 0)$, so $Q_x = \mathbf{F}_T \cdot (1, 0) = F_T(\cos\delta\cos\psi - \sin\delta\sin\psi) = F_T\cos(\psi + \delta)$. In the same way $Q_z = F_T\sin(\psi + \delta)$. These are just the thrust resolved into the fixed axes, as they must be.

**For $\psi$.** Turning the body moves the pivot: $\partial \mathbf{r}_T / \partial\psi = -l\,\partial\hat{\mathbf{b}} / \partial\psi = -l\,\hat{\mathbf{n}}$. So $Q_\psi = \mathbf{F}_T \cdot (-l\,\hat{\mathbf{n}}) = -F_T l\sin\delta$ (the $\hat{\mathbf{b}}$ part drops out because $\hat{\mathbf{b}} \cdot \hat{\mathbf{n}} = 0$). This is the thrust torque about the centre of mass. The sign says that tilting the thrust toward $+\hat{\mathbf{n}}$ pitches the vehicle toward $-\psi$.

**Numbers.** With $F_T = 845\,\mathrm{kN}$, $l = 20\,\mathrm{m}$, $\delta = 2°$: the side component is $845{,}000 \times \sin 2° \approx 29.5\,\mathrm{kN}$, and the control torque is $845{,}000 \times 20 \times 0.0349 \approx 5.9 \times 10^{5}\,\mathrm{N\,m}$. The push along the axis drops by only $F_T(1 - \cos 2°) \approx 515\,\mathrm{N}$ — lesson 7's steering loss in a new outfit. No gimbal bearing force appeared anywhere.
:::

## From d'Alembert to Lagrange's equations

The last step turns the $m\ddot{\mathbf{r}}$ term of d'Alembert's principle into derivatives of the kinetic energy. Expand it in generalised coordinates:

$$
\sum_i m_i\ddot{\mathbf{r}}_i \cdot \delta\mathbf{r}_i = \sum_j\left(\sum_i m_i\ddot{\mathbf{r}}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}\right)\delta q_j .
$$

Work on the bracket. The product rule, read backward, gives

$$
m_i\ddot{\mathbf{r}}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}
= \frac{d}{dt}\left(m_i\mathbf{v}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j}\right) - m_i\mathbf{v}_i \cdot \frac{d}{dt}\left(\frac{\partial \mathbf{r}_i}{\partial q_j}\right).
$$

Now use the two identities. In the first term, swap $\partial \mathbf{r}_i / \partial q_j$ for $\partial \mathbf{v}_i / \partial \dot{q}_j$. In the second, swap $\frac{d}{dt}(\partial \mathbf{r}_i / \partial q_j)$ for $\partial \mathbf{v}_i / \partial q_j$. Next notice that $m_i\mathbf{v}_i \cdot \partial\mathbf{v}_i / \partial\dot{q}_j = \partial(\tfrac{1}{2} m_i v_i^2) / \partial\dot{q}_j$, and the same with $q_j$. Adding over all particles turns each $\tfrac{1}{2} m_i v_i^2$ into $T$:

$$
\sum_i m_i\ddot{\mathbf{r}}_i \cdot \frac{\partial \mathbf{r}_i}{\partial q_j} = \frac{d}{dt}\left(\frac{\partial T}{\partial \dot{q}_j}\right) - \frac{\partial T}{\partial q_j}.
$$

Put this and $Q_j$ back into d'Alembert's principle:

$$
\sum_j \left[\frac{d}{dt}\left(\frac{\partial T}{\partial \dot{q}_j}\right) - \frac{\partial T}{\partial q_j} - Q_j\right]\delta q_j = 0 .
$$

The $\delta q_j$ are independent and free — that is what choosing generalised coordinates for a holonomic system bought us. Pick all but one of them to be zero, and that one bracket must vanish. So each bracket vanishes separately:

$$
\frac{d}{dt}\left(\frac{\partial T}{\partial \dot{q}_j}\right) - \frac{\partial T}{\partial q_j} = Q_j, \qquad j = 1, \ldots, n .
$$

These are **Lagrange's equations** in their most general form: $n$ second-order equations, one per degree of freedom, containing only the kinetic energy and the generalised applied forces. The constraint forces left with the ideal-constraint assumption and never came back. Next lesson folds the conservative part of $Q_j$ into a Lagrangian $L = T - V$.

::: key Lagrange's equations from generalised coordinates
For a holonomic system with ideal constraints, choose $n = 3N - k$ generalised coordinates $q_j$ that satisfy the constraints by construction. Then the constraint forces vanish from the dynamics and the equations of motion are $\frac{d}{dt}(\partial T/\partial\dot{q}_j) - \partial T/\partial q_j = Q_j$, with $Q_j = \sum_i \mathbf{F}_i \cdot \partial\mathbf{r}_i/\partial q_j$ the generalised applied force.
:::

::: warning Three ways to misuse generalised coordinates
**Coordinates that are not independent.** Using $x$, $y$ *and* $\theta$ for a pendulum brings the constraint back and breaks the step where each $\delta q_j$ was free.

**Forgetting the clock.** A rheonomic constraint puts explicit $t$ into $\mathbf{r}_i(q, t)$, and so puts linear and constant terms into $T$.

**Dropping a non-ideal force.** Bearing friction or a damper does virtual work, so it belongs in $Q_j$.

And if you need a constraint force after all — a gimbal bearing load for sizing the structure — recover it afterward from Newton's law for one part, using the motion Lagrange's equations gave you.
:::

## Check yourself

::: check
Classify each constraint as holonomic or not, and as scleronomic or rheonomic where that applies: (a) a bead on a rigid circular hoop that spins at a fixed rate about a vertical diameter; (b) a satellite tied to a station by a cable of length $L$ that can go slack; (c) a spacecraft's two solar arrays hinged to the bus; (d) a ball rolling without slipping on a flat plane.
:::

::: answer
(a) Holonomic and rheonomic: $|\mathbf{r}| = R$, in a plane whose direction is a set function of time.

(b) Non-holonomic. The constraint is the inequality $|\mathbf{r}_{\mathrm{sat}} - \mathbf{r}_{\mathrm{stn}}| \le L$, which only acts when the cable is taut.

(c) Holonomic and scleronomic. Each hinge pins the array's pivot to the bus and fixes its rotation axis — five equations per array — leaving one angle each.

(d) Non-holonomic. Rolling imposes velocity rules that do not reduce to any relation among the positions. The ball can reach any configuration, so none of its five coordinates (two for position, three for orientation) can be eliminated.
:::

::: check
A double pendulum — two rods of lengths $\ell_1, \ell_2$ with bobs $m_1, m_2$, hinged in a vertical plane — is a common model for a two-segment flexible boom. How many degrees of freedom does it have? Choose generalised coordinates, write the bobs' positions in them, and count the constraint forces a Newtonian description would need.
:::

::: answer
Two particles in a plane need $4$ coordinates. Two length constraints leave $n = 4 - 2 = 2$.

Take $\theta_1, \theta_2$, each rod's angle from straight down. Then $\mathbf{r}_1 = \ell_1(\sin\theta_1, -\cos\theta_1)$ and $\mathbf{r}_2 = \mathbf{r}_1 + \ell_2(\sin\theta_2, -\cos\theta_2)$. Every pair of angles obeys both length rules automatically.

Newton would need two tension unknowns and four scalar equations, then eliminate the tensions. The second tension appears in both bobs' equations with opposite signs — exactly where errors creep in.
:::

::: check
A particle of mass $m$ slides on a frictionless wire bent into the parabola $z = a x^2$ in a vertical plane, under gravity $g$. Using $x$ as the generalised coordinate, find $T$, the generalised force $Q_x$ from gravity, and the equation of motion.
:::

::: answer
**Position and velocity.** $\mathbf{r} = (x, a x^2)$, so $\mathbf{v} = (\dot{x}, 2 a x\dot{x})$ and $T = \tfrac{1}{2} m (1 + 4a^2x^2)\dot{x}^2$. The generalised mass changes with position.

**Generalised force.** Gravity is $\mathbf{F} = (0, -mg)$, and $\partial\mathbf{r}/\partial x = (1, 2ax)$, so $Q_x = (0, -mg) \cdot (1, 2ax) = -2 m g a x$. Check with the potential: $V = m g a x^2$ gives $-\partial V/\partial x = -2mgax$, the same.

**Equation.** $\frac{d}{dt}[m(1 + 4a^2x^2)\dot{x}] - 4 m a^2 x\dot{x}^2 = -2 m g a x$. Differentiating the first term gives $m(1 + 4a^2x^2)\ddot{x} + 8ma^2x\dot{x}^2$, so it becomes $m(1 + 4a^2x^2)\ddot{x} + 4 m a^2 x\dot{x}^2 = -2 m g a x$.

The wire's push never appeared. For small $x$, $\ddot{x} \approx -2 g a x$: oscillation at $\omega = \sqrt{2 g a}$.
:::

::: check
Explain in your own words why the tension in a pendulum rod does no virtual work, but friction at the pivot does. What does that mean for how each is handled in Lagrange's equations?
:::

::: answer
The tension acts along the rod. Any virtual displacement that keeps the rod's length moves the bob at right angles to the rod. So $\mathbf{C} \cdot \delta\mathbf{r} = 0$: the constraint is ideal, and the tension drops out of d'Alembert's principle.

Pivot friction is a torque about the very axis $\theta$ turns around. A virtual rotation $\delta\theta$ is exactly the motion it resists, so its virtual work, $-\tau_f\,\delta\theta$, is not zero. It goes in as an applied generalised force, $Q_\theta = -\tau_f$, on the right-hand side.
:::

::: check
A stage's thrust acceleration makes the propellant in its tank act like a pendulum of effective length $1.5\,\mathrm{m}$ in an effective gravity equal to the thrust acceleration, $13.6\,\mathrm{m/s^2}$, with the pivot fixed to the body. Write the generalised force on the pendulum angle and find the small-swing frequency. How does it compare with the same tank sitting on the pad?
:::

::: answer
Treat the body frame as having an effective gravity $a$ along the axis. The bob at angle $\theta$ has $V = -m a \ell\cos\theta$, so $Q_\theta = -\partial V/\partial\theta = -m a\ell\sin\theta$. With $T = \tfrac{1}{2} m\ell^2\dot{\theta}^2$, Lagrange's equation gives $m\ell^2\ddot{\theta} = -m a\ell\sin\theta$, which is $\ddot{\theta} + (a/\ell)\sin\theta = 0$.

For small swings, $\omega = \sqrt{a/\ell} = \sqrt{13.6/1.5} \approx 3.01\,\mathrm{rad/s}$. Dividing by $2\pi$ gives about $0.48\,\mathrm{Hz}$.

On the pad, $a = g_0$ and $\omega = \sqrt{9.81/1.5} \approx 2.56\,\mathrm{rad/s}$, about $0.41\,\mathrm{Hz}$. The slosh frequency rises with thrust acceleration, so the attitude controller's filters must track it through the burn.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| holonomic constraint $f(\mathbf{r}_1, \ldots, \mathbf{r}_N, t) = 0$ | an equation among positions; scleronomic without $t$, rheonomic with |
| non-holonomic | inequalities, or velocity rules that do not reduce to positions (rolling); no coordinate can be eliminated |
| $n = 3N - k$ | degrees of freedom; by parts: rigid body 6 (planar 3), hinge leaves 1, ball joint 3 |
| $\mathbf{r}_i = \mathbf{r}_i(q_1, \ldots, q_n, t)$ | generalised coordinates obey the constraints by construction |
| $\mathbf{v}_i = \sum_j (\partial\mathbf{r}_i/\partial q_j)\dot{q}_j + \partial\mathbf{r}_i/\partial t$ | velocities linear in generalised velocities |
| $\partial\mathbf{v}_i/\partial\dot{q}_j = \partial\mathbf{r}_i/\partial q_j$, $\frac{d}{dt}(\partial\mathbf{r}_i/\partial q_j) = \partial\mathbf{v}_i/\partial q_j$ | the "cancel the dots" identities |
| $T = \tfrac{1}{2}\dot{\mathbf{q}}^{\mathsf{T}}\mathbf{M}(\mathbf{q})\dot{\mathbf{q}} + \ldots$ | kinetic energy quadratic in $\dot{q}$; $\mathbf{M}$ the generalised mass matrix |
| ideal constraint: $\sum_i \mathbf{C}_i \cdot \delta\mathbf{r}_i = 0$ | constraint forces do no virtual work (smooth surfaces, rods, frictionless hinges) |
| d'Alembert: $\sum_i (\mathbf{F}_i - m_i\ddot{\mathbf{r}}_i) \cdot \delta\mathbf{r}_i = 0$ | Newton's laws without constraint forces |
| $Q_j = \sum_i \mathbf{F}_i \cdot \partial\mathbf{r}_i/\partial q_j$ | generalised force; $-\partial V/\partial q_j$ for the conservative part |
| $\frac{d}{dt}(\partial T/\partial\dot{q}_j) - \partial T/\partial q_j = Q_j$ | Lagrange's equations, general form |

The next lesson folds the conservative forces into a Lagrangian $L = T - V$, states the Euler-Lagrange equation in the form the module's flashcards use, shows the same equations follow from Hamilton's principle, and works the slosh and orbit examples through to equations of motion and conservation laws.

::: context constraint-force Forces that are "whatever it takes"
A book on a table feels the table push up. How hard? Exactly as hard as needed to stop the book sinking in: its weight, or more if you press down on it. The table does not have a fixed force — it has a job. That is a constraint force. Its size comes out of the motion, not the other way round, which is why Newton's method must treat it as an unknown and solve for it.
:::

::: context holonomic-word Where "holonomic" comes from
The word was coined by the German physicist Heinrich Hertz in the 1890s, from Greek *holos*, "whole", and *nomos*, "law". A holonomic constraint is a law about the *whole* configuration — a rule on positions that holds for good. A non-holonomic one only restricts how you may move from moment to moment, not where you can end up.
:::

::: context parallel-parking Why a car can park sideways
A car's wheels cannot slide sideways, so at any instant it can only roll forward or back along its heading. That is a rule on velocities. Yet by rolling forward and back while turning, you can shift the car sideways into a space. The velocity rule never became a rule on position, so it is non-holonomic.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="2"/>
  <rect x="30" y="92" width="70" height="26" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="92" width="70" height="26" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="145" y="30" width="70" height="26" fill="#fff" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="180" y="22" font-size="12" text-anchor="middle" fill="#6c7a93">start</text>
  <rect x="145" y="92" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="140" font-size="12" text-anchor="middle" fill="#1d6fd1">end: moved sideways</text>
  <path d="M240,48 C200,60 170,75 130,90" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="122,94 131,84 134,95" fill="#b4232c"/>
  <path d="M136,102 C150,106 170,106 190,104" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="200,104 188,99 189,109" fill="#b4232c"/>
  <text x="250" y="62" font-size="11" fill="#b4232c">reverse, turning</text>
  <text x="222" y="86" font-size="11" fill="#b4232c">then forward</text>
</svg>
```
:::

::: context mass-matrix The matrix that multibody codes compute
Simulation tools used for spacecraft with arms, arrays and sloshing tanks all build $\mathbf{M}(\mathbf{q})$ at every time step, then solve $\mathbf{M}\ddot{\mathbf{q}} = \text{(everything else)}$ for the accelerations. "Positive definite" guarantees that solve always works: any motion at all, $\dot{\mathbf{q}} \neq 0$, has positive kinetic energy. You will meet $\mathbf{M}$ again as the inertia tensor of a rigid body in the next module.
:::

::: context virtual-displacement Freezing the clock
Picture a bead on a wire that is itself being carried sideways. In a real time step $dt$ the bead moves along the wire *and* with it. A virtual displacement freezes the wire where it is and slides the bead only along it. The wire's push is at right angles to that slide, so it does no virtual work — even though, in the real motion, a moving wire can do work on the bead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="240" y2="30" stroke="#1f2a44" stroke-width="3"/>
  <line x1="120" y1="130" x2="320" y2="30" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="300" y="56" font-size="11" fill="#6c7a93">wire a moment later</text>
  <circle cx="140" cy="80" r="7" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="148" y1="76" x2="186" y2="57" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="195,52.5 182.7,52.4 187.8,62.4" fill="#1d6fd1"/>
  <text x="150" y="44" font-size="12" fill="#1d6fd1">virtual δr</text>
  <line x1="148" y1="79.6" x2="218" y2="75.7" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="230,75 218.3,81.2 217.7,70.2" fill="#b4232c"/>
  <text x="196" y="100" font-size="12" fill="#b4232c">real dr</text>
  <text x="30" y="150" font-size="11" fill="#1f2a44">δr slides along the frozen wire; dr also rides with it</text>
</svg>
```
:::

::: context dalembert Who d'Alembert was
Jean le Rond d'Alembert was a French mathematician who published the idea in his *Treatise on Dynamics* in 1743. His move was to treat $-m\ddot{\mathbf{r}}$ as one more "force", so that a moving system could be handled with the rules of a system at rest. Lagrange later built his whole *Analytical Mechanics* on it — a book famous for containing no diagrams.
:::

::: context generalised-force-units Why an angle's force is a torque
Work is force times distance. If the coordinate is an angle, a nudge $\delta\theta$ moves a point at distance $l$ from the pivot by $l\,\delta\theta$. A force $F$ pushing along that little arc does work $F\,l\,\delta\theta$, so the generalised force is $F l$ — force times lever arm, a torque. The recipe "work divided by nudge" hands you the right kind of quantity automatically.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="120" r="6" fill="#1f2a44"/>
  <text x="46" y="142" font-size="12" fill="#1f2a44">pivot</text>
  <line x1="60" y1="120" x2="260" y2="120" stroke="#1f2a44" stroke-width="3"/>
  <text x="150" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">lever arm l</text>
  <line x1="60" y1="120" x2="256.9" y2="85.3" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M260,120 A200,200 0 0,0 256.9,85.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="268" y="106" font-size="12" fill="#1d6fd1">arc l·δθ</text>
  <path d="M110,120 A50,50 0 0,0 109.2,111.3" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="116" y="112" font-size="12" fill="#1f2a44">δθ</text>
  <line x1="260" y1="120" x2="260" y2="44" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="260,32 254,46 266,46" fill="#b4232c"/>
  <text x="268" y="44" font-size="12" fill="#b4232c">F</text>
</svg>
```
:::
