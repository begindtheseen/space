---
id: l09-lagrangian-mechanics-hamilton-principle
title: Lagrangian mechanics and Hamilton's principle
minutes: 23
covers:
  - Lagrangian mechanics and the Euler-Lagrange equation
  - Hamilton principle
---

Lesson 8 ended with Lagrange's equations in the form $\frac{d}{dt}(\partial T/\partial\dot{q}_j) - \partial T/\partial q_j = Q_j$: one equation per degree of freedom, no constraint forces, everything computed from the kinetic energy and the generalised applied forces. This lesson finishes the construction. Absorbing the conservative forces into a single scalar function, the Lagrangian $L = T - V$, turns those equations into the Euler-Lagrange equation — the form every dynamics text and the module's flashcards use — and reduces the derivation of the equations of motion of a gimballed, sloshing, flexing vehicle to differentiation. Then it shows that the same equation follows from a completely different starting point: Hamilton's principle, which says that of all the paths a system might take between two configurations, the real one makes a certain integral stationary.

Why should a GNC engineer care about a second derivation of equations already in hand? Three reasons. Hamilton's principle is what makes Lagrangian mechanics coordinate-free — the equations have the same form in any generalised coordinates, which Newton's do not — and that is what makes it the right tool for multibody dynamics. It exposes the link between symmetries and conservation laws: a coordinate that does not appear in $L$ has a conserved momentum, which is where the angular momentum of an orbit and the energy of a system come from without any further calculation. And it is the direct ancestor of optimal control: the machinery that finds the fuel-optimal trajectory for a landing burn is Hamilton's principle with a cost function in place of the Lagrangian.

## The Lagrangian and the Euler-Lagrange equation

Split the generalised force of lesson 8 into a conservative part, derived from a potential energy $V(q, t)$ expressed in the generalised coordinates, and a non-conservative remainder:

$$
Q_j^{\mathrm{total}} = -\frac{\partial V}{\partial q_j} + Q_j .
$$

From here on $Q_j$ means only the non-conservative generalised force — thrust, drag, damping, motor torques — computed as in lesson 8 from the virtual work $\sum_i \mathbf{F}_i^{\mathrm{nc}} \cdot \partial\mathbf{r}_i/\partial q_j$. Substitute into Lagrange's equations and move the potential term to the left:

$$
\frac{d}{dt}\left(\frac{\partial T}{\partial\dot{q}_j}\right) - \frac{\partial T}{\partial q_j} + \frac{\partial V}{\partial q_j} = Q_j .
$$

Since $V$ does not depend on the generalised velocities, $\partial V/\partial\dot{q}_j = 0$, and the left-hand side can be written entirely in terms of one function. Define the **Lagrangian**

$$
L(q, \dot{q}, t) = T - V .
$$

Then $\partial L/\partial\dot{q}_j = \partial T/\partial\dot{q}_j$ and $\partial L/\partial q_j = \partial T/\partial q_j - \partial V/\partial q_j$, and the equations become the **Euler-Lagrange equations**:

$$
\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}_j}\right) - \frac{\partial L}{\partial q_j} = Q_j, \qquad j = 1, \ldots, n .
$$

For a system with only conservative applied forces the right-hand side is zero. Note the sign in $L$: it is kinetic *minus* potential, not the total energy. The reason will be clear from Hamilton's principle; for now, check it against the simplest case. A particle on a line under a potential $V(x)$ has $L = \tfrac{1}{2} m\dot{x}^2 - V(x)$, so $\partial L/\partial\dot{x} = m\dot{x}$, $\partial L/\partial x = -V'(x)$, and the Euler-Lagrange equation reads $m\ddot{x} + V'(x) = 0$, which is Newton's second law with $F = -dV/dx$. With a plus sign in $L$ the force would come out with the wrong sign.

::: key
The Euler-Lagrange equation: $\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}_i}\right) - \frac{\partial L}{\partial q_i} = Q_i$, with $L = T - V$ and $Q_i$ the generalised non-conservative force. One equation per generalised coordinate; constraint forces never appear.
:::

### The recipe

Deriving equations of motion is now a fixed procedure.

1. Count the degrees of freedom and choose generalised coordinates $q_j$ that satisfy the constraints by construction (lesson 8).
2. Write the position of every mass element in terms of the $q$'s and $t$, differentiate to get velocities, and form $T$.
3. Write the potential energy $V$ of every conservative force in the $q$'s: gravity, springs, gravitational $-\mu m/r$.
4. Form $L = T - V$.
5. For each $j$, compute $\partial L/\partial\dot{q}_j$, differentiate it with respect to time (using the chain rule through every $q$ and $\dot{q}$ it contains), subtract $\partial L/\partial q_j$.
6. Compute $Q_j$ for each non-conservative force from its virtual work, and set the two sides equal.

Step 5 is mechanical and is where symbolic algebra earns its keep; steps 1 to 3 are where the physics lives. The two identities from lesson 8 guarantee that step 5 reproduces $\sum_i m_i\ddot{\mathbf{r}}_i \cdot \partial\mathbf{r}_i/\partial q_j$, so the result is Newton's second law projected onto each allowed direction of motion — nothing more and nothing less.

::: example Slosh on an accelerating stage
Take the bus-and-pendulum system of lesson 8: a body of mass $M$ moving along its thrust axis $x$ with a slosh pendulum of mass $m$ and length $\ell$ hanging backward from a pivot fixed to the body, at angle $\theta$ from the axis. The engine applies thrust $T$ along the axis; there is no gravity (or it acts along the axis and is absorbed into an effective $T$). Find the equations of motion and the slosh frequency.

From lesson 8, $T_{\mathrm{kin}} = \tfrac{1}{2}(M + m)\dot{x}^2 + m\ell\sin\theta\,\dot{x}\dot{\theta} + \tfrac{1}{2} m\ell^2\dot{\theta}^2$, and with no conservative forces $V = 0$, so $L = T_{\mathrm{kin}}$. Thrust is non-conservative, applied to the body at a point whose position depends on $x$ only: $Q_x = T$, $Q_\theta = 0$.

For $x$: $\partial L/\partial\dot{x} = (M + m)\dot{x} + m\ell\sin\theta\,\dot{\theta}$ and $\partial L/\partial x = 0$, so

$$
(M + m)\ddot{x} + m\ell\left(\sin\theta\,\ddot{\theta} + \cos\theta\,\dot{\theta}^2\right) = T .
$$

For $\theta$: $\partial L/\partial\dot{\theta} = m\ell\sin\theta\,\dot{x} + m\ell^2\dot{\theta}$, whose time derivative is $m\ell\cos\theta\,\dot{\theta}\dot{x} + m\ell\sin\theta\,\ddot{x} + m\ell^2\ddot{\theta}$; and $\partial L/\partial\theta = m\ell\cos\theta\,\dot{x}\dot{\theta}$. Subtracting, the $\cos\theta\,\dot{x}\dot{\theta}$ terms cancel and

$$
\ell\ddot{\theta} + \ddot{x}\sin\theta = 0 .
$$

Read the second equation first: it is a pendulum in an effective gravity equal to the body's acceleration $\ddot{x}$, pointing backward. That is the accelerometer lesson again — the propellant feels specific force, not gravity. For small $\theta$, $\ddot{x} \approx a_0 = T/(M + m)$ and $\ddot{\theta} + (a_0/\ell)\theta = 0$: oscillation at $\omega = \sqrt{a_0/\ell}$. With $M = 400\,\mathrm{t}$, $m = 20\,\mathrm{t}$, $\ell = 1.5\,\mathrm{m}$ and $T = 5.71\,\mathrm{MN}$ (so $a_0 = 13.6\,\mathrm{m/s^2}$), $\omega = \sqrt{13.6/1.5} \approx 3.01\,\mathrm{rad/s}$, about $0.48\,\mathrm{Hz}$.

The first equation shows what the slosh does to the body. The bus acceleration is $\ddot{x} = [T - m\ell(\sin\theta\,\ddot{\theta} + \cos\theta\,\dot{\theta}^2)]/(M + m)$: the steady $a_0$ plus a jitter at the slosh frequency. For a $5°$ slosh amplitude the oscillating force is about $m\ell\omega^2\theta_0 = 20{,}000 \times 1.5 \times 9.07 \times 0.0873 \approx 23.7\,\mathrm{kN}$, an acceleration ripple of $0.057\,\mathrm{m/s^2}$, 0.4 % of $a_0$ — small on the trajectory, but exactly the kind of signal that shows up in the IMU and that the attitude controller must not mistake for something to correct. Two lines of differentiation produced both equations; the pendulum tension never appeared.
:::

## Generalised momenta and conservation laws

The quantity $p_j = \partial L/\partial\dot{q}_j$ is the **generalised momentum** conjugate to $q_j$. For a Cartesian coordinate it is the ordinary momentum $m\dot{x}$; for an angle it is an angular momentum. In these terms the Euler-Lagrange equation reads $\dot{p}_j = \partial L/\partial q_j + Q_j$, and a conservation law follows at once: if $L$ does not depend on some coordinate $q_k$ — such a coordinate is called **cyclic** or **ignorable** — and no non-conservative force acts on it, then $\dot{p}_k = 0$ and $p_k$ is constant.

This is a machine for producing conservation laws. Every symmetry of the system that can be expressed as a coordinate not appearing in $L$ hands you a conserved quantity with no further work, and the module's earlier conservation laws are all special cases. There is also a conserved quantity for time. If $L$ has no explicit time dependence and $T$ is purely quadratic in the generalised velocities (scleronomic constraints), then the **energy function** $h = \sum_j \dot{q}_j\,\partial L/\partial\dot{q}_j - L$ is constant in the absence of non-conservative forces, and it evaluates to $T + V$: conservation of mechanical energy, lesson 4's result, now derived from the form of $L$. With $Q_j \neq 0$ it changes at the rate $\sum_j Q_j\dot{q}_j$, the power of the non-conservative forces.

::: example A satellite's orbit from a Lagrangian
A satellite of mass $m$ moves in the plane under Earth's gravity. Use polar coordinates $(r, \theta)$ about the Earth's centre and derive the equations of motion and the conserved quantities.

Position $\mathbf{r} = r(\cos\theta, \sin\theta)$, velocity components $\dot{r}$ radially and $r\dot{\theta}$ tangentially, so $T = \tfrac{1}{2} m(\dot{r}^2 + r^2\dot{\theta}^2)$. The potential is $V = -\mu m/r$ (lesson 4). Hence

$$
L = \tfrac{1}{2} m\left(\dot{r}^2 + r^2\dot{\theta}^2\right) + \frac{\mu m}{r} .
$$

The coordinate $\theta$ does not appear in $L$ — gravity is central, so the problem looks the same from every direction — so $\theta$ is cyclic and its momentum is conserved:

$$
p_\theta = \frac{\partial L}{\partial\dot{\theta}} = m r^2\dot{\theta} = \text{const}.
$$

This is the angular momentum $L = m r v_\perp$ of lesson 2, obtained here without computing a single torque. The radial equation: $\partial L/\partial\dot{r} = m\dot{r}$, $\partial L/\partial r = m r\dot{\theta}^2 - \mu m/r^2$, so

$$
m\ddot{r} = m r\dot{\theta}^2 - \frac{\mu m}{r^2} .
$$

For a circular orbit $\ddot{r} = 0$ and $r\dot{\theta}^2 = \mu/r^2$, giving $v = r\dot{\theta} = \sqrt{\mu/r}$: at $r = 6778\,\mathrm{km}$, $7669\,\mathrm{m/s}$, with $\dot{\theta} = 1.13 \times 10^{-3}\,\mathrm{rad/s}$ and a period of $5550\,\mathrm{s}$. Since $L$ has no explicit $t$ and $T$ is quadratic, the energy $h = T + V = \tfrac{1}{2} m(\dot{r}^2 + r^2\dot{\theta}^2) - \mu m/r$ is also conserved — the specific orbital energy of lesson 4. Substituting $\dot{\theta} = p_\theta/(m r^2)$ into it reduces the whole two-body problem to a single one-dimensional equation in $r$, which is how the orbit's shape is found in the two-body module.
:::

## Hamilton's principle

The Euler-Lagrange equation was derived above from Newton's laws through d'Alembert's principle. It can also be derived from a single statement about whole trajectories, with no reference to forces at all.

Consider a system described by generalised coordinates $q(t)$, and fix two configurations: $q(t_1) = q_A$ and $q(t_2) = q_B$. Many paths $q(t)$ connect them. For each path define the **action**

$$
S[q] = \int_{t_1}^{t_2} L\big(q(t), \dot{q}(t), t\big)\,dt ,
$$

a number that depends on the entire path, in $\mathrm{J\,s}$. **Hamilton's principle** states: the path the system actually follows is the one for which $S$ is *stationary* — unchanged to first order under any small variation of the path that keeps the endpoints fixed. Symbolically, $\delta S = 0$.

To see what this implies, let $q(t)$ be the true path and consider a neighbouring path $q(t) + \epsilon\,\eta(t)$, where $\eta(t)$ is any smooth function with $\eta(t_1) = \eta(t_2) = 0$ so that the endpoints are held, and $\epsilon$ is a small number. The action becomes a function of $\epsilon$, and stationarity means $dS/d\epsilon = 0$ at $\epsilon = 0$. Differentiate under the integral (one coordinate for clarity; several go the same way term by term):

$$
\frac{dS}{d\epsilon}\bigg|_{\epsilon = 0} = \int_{t_1}^{t_2}\left(\frac{\partial L}{\partial q}\,\eta + \frac{\partial L}{\partial\dot{q}}\,\dot{\eta}\right)dt .
$$

The second term contains $\dot{\eta}$, which is not independent of $\eta$. Integrate it by parts:

$$
\int_{t_1}^{t_2}\frac{\partial L}{\partial\dot{q}}\,\dot{\eta}\,dt = \left[\frac{\partial L}{\partial\dot{q}}\,\eta\right]_{t_1}^{t_2} - \int_{t_1}^{t_2}\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}}\right)\eta\,dt .
$$

The boundary term vanishes because $\eta$ is zero at both ends — this is exactly why the endpoints must be fixed. What remains is

$$
\frac{dS}{d\epsilon}\bigg|_{\epsilon = 0} = \int_{t_1}^{t_2}\left[\frac{\partial L}{\partial q} - \frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}}\right)\right]\eta\,dt = 0 .
$$

This must hold for *every* admissible $\eta(t)$. If the bracket were nonzero anywhere — say positive on some small interval — choose an $\eta$ that is a positive bump on that interval and zero elsewhere; the integral would then be positive, a contradiction. So the bracket must vanish at every instant:

$$
\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}}\right) - \frac{\partial L}{\partial q} = 0 .
$$

The Euler-Lagrange equation, for conservative systems, is the condition that the action be stationary. The same argument with $n$ coordinates gives $n$ equations. Non-conservative forces are included by adding their virtual work to the variation: the **extended Hamilton's principle** is $\delta S + \int_{t_1}^{t_2}\sum_j Q_j\,\delta q_j\,dt = 0$, which reproduces the Euler-Lagrange equation with $Q_j$ on the right.

::: key
Hamilton's principle: among all paths $q(t)$ between fixed configurations at fixed times $t_1$ and $t_2$, the actual motion makes the action $S = \int_{t_1}^{t_2} L\,dt$ stationary, $\delta S = 0$. The Euler-Lagrange equations are the necessary conditions for stationarity, obtained by varying the path and integrating by parts.
:::

Three remarks on what the principle does and does not say. It says *stationary*, not minimum: for short enough intervals the true path does minimise the action, but over longer ones it can be a saddle, and "least action" is a historical misnomer. It is a statement about a path as a whole, given both endpoints, whereas Newton's law is a statement about each instant, given the initial position and velocity; that the two are equivalent is remarkable and is the content of the derivation. And it explains the sign in $L = T - V$: a path that moves too fast piles up kinetic energy, one that lingers where the potential is high piles up potential energy, and the actual path is the compromise that balances the two to first order.

::: example Testing stationarity on a thrown mass
A $1\,\mathrm{kg}$ mass is thrown straight up at $t = 0$ and returns to the launch height at $t_2 = 2.0\,\mathrm{s}$, under $g = 9.80665\,\mathrm{m/s^2}$. Compute the action of the true path and of a nearby path with the same endpoints, and check that the true path is stationary.

The true path returns at $t_2$ if $v_0 = g t_2/2 = 9.807\,\mathrm{m/s}$, peaking at $v_0^2/2g = 4.90\,\mathrm{m}$: $z(t) = v_0 t - \tfrac{1}{2} g t^2$. With $L = \tfrac{1}{2}\dot{z}^2 - g z$ (per kilogram),

$$
S_{\mathrm{true}} = \int_0^{t_2}\left[\tfrac{1}{2}(v_0 - g t)^2 - g\left(v_0 t - \tfrac{1}{2} g t^2\right)\right]dt = \tfrac{1}{2} v_0^2 t_2 - v_0 g t_2^2 + \tfrac{1}{3} g^2 t_2^3 \approx -32.06\,\mathrm{J\,s}.
$$

Now perturb: $z_\epsilon(t) = z(t) + \epsilon\sin(\pi t/t_2)$, which vanishes at both endpoints as required. The extra terms in $L$ are $\dot{z}\,\epsilon\dot{\eta} + \tfrac{1}{2}\epsilon^2\dot{\eta}^2 - g\epsilon\eta$ with $\eta = \sin(\pi t/t_2)$. The terms linear in $\epsilon$ integrate to zero — that is the content of the Euler-Lagrange equation being satisfied by $z(t)$, and you can verify it by parts — leaving

$$
S_\epsilon - S_{\mathrm{true}} = \tfrac{1}{2}\epsilon^2\int_0^{t_2}\dot{\eta}^2\,dt = \tfrac{1}{2}\epsilon^2\,\frac{\pi^2}{t_2^2}\cdot\frac{t_2}{2} = \frac{\pi^2\epsilon^2}{4 t_2}.
$$

For $\epsilon = 0.5\,\mathrm{m}$ this is $+0.308\,\mathrm{J\,s}$; for $\epsilon = 1.0\,\mathrm{m}$, $+1.234\,\mathrm{J\,s}$; for $\epsilon = -0.5\,\mathrm{m}$, again $+0.308$. Numerical integration of the perturbed paths gives the same numbers to six figures. The change is quadratic in $\epsilon$ with no linear term — the signature of a stationary point — and positive in every direction, so over this two-second interval the true path is a genuine minimum of the action.
:::

## Choosing between Newton-Euler and Lagrange

Both formulations describe the same physics and, applied correctly, produce the same equations. The choice is about labour, error rate and what you need out of the answer.

Use **Newton-Euler** — force and moment balances on each body — when the system is a single rigid body or a few bodies with simple connections; when the dominant forces are non-conservative and velocity-dependent (drag, thrust, control torques), which are easy to place on a free-body diagram and gain nothing from a potential; when you *need* the constraint forces, because a gimbal bearing, a hinge or a landing-leg strut has to be sized for them; and when you are writing a real-time simulation of a chain of bodies, where recursive Newton-Euler algorithms are the fastest known. Attitude dynamics of a rigid spacecraft, in the next module, is Newton-Euler territory: one body, external torques, and Euler's equations follow directly.

Use **Lagrange** when holonomic constraints dominate the problem — multibody chains, gimballed engines and antennas, deployable and flexible appendages modelled as hinged links, slosh pendulums, robot arms — because generalised coordinates eliminate the constraint forces you never wanted to compute, and because the equations come out in a form that is coordinate-independent, symmetric in structure ($\mathbf{M}(\mathbf{q})\ddot{\mathbf{q}} + \ldots$) and easy to check for energy conservation. Use it also when you want conservation laws for free, or when you are heading toward optimal control, where the Lagrangian machinery is the starting point.

The clearest test: count the constraint forces you would have to introduce and then eliminate. If the answer is zero or one, Newton-Euler is quicker. If it is a handful or more, Lagrange is not only quicker but far less likely to contain a sign error — and the module's slosh example, two lines of differentiation against a page of free-body diagrams with an unknown tension in each, is the typical ratio.

::: key
A Lagrangian formulation is decisively better than Newton-Euler when holonomic constraints dominate — multibody chains, gimbals, flexible appendages, slosh pendulums — because generalised coordinates eliminate the constraint forces you never wanted to compute. Newton-Euler is the natural choice for a single rigid body under external forces and torques, or when the constraint forces themselves are needed.
:::

::: warning
Four Lagrangian slips worth naming. Writing $L = T + V$: the sign error reverses every conservative force. Differentiating $\partial L/\partial\dot{q}_j$ with respect to time while forgetting that it depends on the $q$'s as well as the $\dot{q}$'s — the chain rule produces the Coriolis-like terms, such as $m\ell\cos\theta\,\dot{x}\dot{\theta}$ in the slosh example, and dropping them breaks energy conservation. Putting a non-conservative force into $V$: thrust and drag have no potential and belong in $Q_j$. And computing $Q_j$ as the force itself rather than its virtual work per unit $\delta q_j$: for an angular coordinate $Q_j$ is a torque, and a force applied off the pivot needs its moment arm.
:::

## Check yourself

::: check
Two masses $m_1 = 3.0\,\mathrm{kg}$ and $m_2 = 2.0\,\mathrm{kg}$ hang from a light string over a frictionless, massless pulley. Using the single generalised coordinate $x$ (the downward displacement of $m_1$), write $L$ and find the acceleration. What did you not have to compute?
:::

::: answer
The string constrains $m_2$ to rise by $x$ when $m_1$ falls by $x$, so both move at speed $\dot{x}$: $T = \tfrac{1}{2}(m_1 + m_2)\dot{x}^2$. Taking $z$ up, $V = -m_1 g x + m_2 g x = -(m_1 - m_2) g x$. So $L = \tfrac{1}{2}(m_1 + m_2)\dot{x}^2 + (m_1 - m_2) g x$. Euler-Lagrange: $(m_1 + m_2)\ddot{x} - (m_1 - m_2) g = 0$, giving $\ddot{x} = (m_1 - m_2) g/(m_1 + m_2) = (1.0/5.0) \times 9.807 \approx 1.96\,\mathrm{m/s^2}$. The string tension — the constraint force, $23.5\,\mathrm{N}$ if you want it afterwards from Newton's law for $m_2$ — never appeared.
:::

::: check
A particle moves under uniform gravity with $L = \tfrac{1}{2} m(\dot{x}^2 + \dot{y}^2 + \dot{z}^2) - m g z$. Identify the cyclic coordinates and the conserved quantities. Is the energy conserved, and why?
:::

::: answer
$x$ and $y$ do not appear in $L$, so they are cyclic and $p_x = m\dot{x}$ and $p_y = m\dot{y}$ are conserved: the horizontal momentum components, because gravity has no horizontal component. $z$ appears, so $p_z = m\dot{z}$ is not conserved; $\dot{p}_z = \partial L/\partial z = -mg$. The Lagrangian has no explicit time dependence and $T$ is quadratic in the velocities, so the energy function $h = T + V = \tfrac{1}{2} m v^2 + m g z$ is conserved too — the projectile's mechanical energy.
:::

::: check
Add a viscous damper to the slosh pendulum of the worked example, exerting a torque $-c\dot{\theta}$ about the pivot. How does the Euler-Lagrange equation for $\theta$ change, and at what rate does the system's energy fall?
:::

::: answer
The damper is non-conservative, so it enters as a generalised force. Its virtual work in a rotation $\delta\theta$ is $-c\dot{\theta}\,\delta\theta$, so $Q_\theta = -c\dot{\theta}$ and the $\theta$ equation becomes $m\ell^2\ddot{\theta} + m\ell\sin\theta\,\ddot{x} = -c\dot{\theta}$ (multiplying the earlier form by $m\ell$). The energy function changes at the rate of the non-conservative power, $\sum_j Q_j\dot{q}_j = T\dot{x} - c\dot{\theta}^2$: thrust adds energy at $T\dot{x}$ and the damper removes it at $c\dot{\theta}^2$, always positive, so the slosh decays. Baffles in a tank are engineered to make $c$ large.
:::

::: check
In the derivation of the Euler-Lagrange equation from Hamilton's principle, explain why the variation $\eta(t)$ must vanish at $t_1$ and $t_2$, and what would go wrong without that condition. Then explain why the vanishing of $\int [\ldots]\eta\,dt$ for all $\eta$ forces the bracket itself to vanish.
:::

::: answer
The boundary term from integrating by parts is $[(\partial L/\partial\dot{q})\,\eta]_{t_1}^{t_2}$. Only if $\eta$ vanishes at both ends does it drop out, leaving an integral proportional to $\eta$ alone; otherwise the stationarity condition would also involve the endpoint values of the generalised momentum and would not reduce to a differential equation holding at each instant. Fixing the endpoints is what makes the comparison "same start, same finish, different route". If the bracket were nonzero at some instant, by continuity it would keep one sign over a small interval; choosing $\eta$ as a bump of that sign supported inside the interval would make the integral strictly nonzero, contradicting $\delta S = 0$. Hence the bracket is zero everywhere — the fundamental lemma of the calculus of variations.
:::

::: check
For each system, choose Newton-Euler or Lagrange and justify the choice in one or two sentences: (a) a rigid satellite under gravity-gradient torque, magnetic torque and reaction-wheel torques; (b) a lander whose four legs are each a hinged two-link mechanism with a damper, touching down on a slope; (c) a launch vehicle in ascent with one gimballed engine and three slosh pendulums.
:::

::: answer
(a) Newton-Euler: a single rigid body with external torques, all non-conservative or easily expressed as torques, and no constraint forces to eliminate; Euler's equations follow directly. (b) Lagrange for the dynamics, with the leg angles as generalised coordinates: eight hinges' worth of constraint forces would otherwise have to be introduced and eliminated; the dampers enter as $Q_j$. But the strut loads are needed to size the legs, so after solving, recover them from Newton's law on individual links. (c) Lagrange: body coordinates plus one gimbal angle plus three pendulum angles, seven degrees of freedom with four holonomic constraints that generalised coordinates absorb; thrust enters as $Q_j$ via its virtual work, as in lesson 8.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $L = T - V$ | the Lagrangian, kinetic minus potential energy, in generalised coordinates |
| $\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}_i}\right) - \frac{\partial L}{\partial q_i} = Q_i$ | the Euler-Lagrange equation; $Q_i$ the generalised non-conservative force; zero right-hand side for conservative systems |
| $p_j = \partial L/\partial\dot{q}_j$ | generalised momentum; conserved when $q_j$ is cyclic (absent from $L$) and $Q_j = 0$ |
| $h = \sum_j \dot{q}_j\,\partial L/\partial\dot{q}_j - L$ | energy function; equals $T + V$ for scleronomic systems; conserved when $\partial L/\partial t = 0$ and $Q_j = 0$, else $\dot{h} = \sum_j Q_j\dot{q}_j$ |
| $S = \int_{t_1}^{t_2} L\,dt$, $\delta S = 0$ | the action and Hamilton's principle: the true path makes $S$ stationary with endpoints fixed |
| $q + \epsilon\eta$, $\eta(t_1) = \eta(t_2) = 0$, integrate by parts | the variational derivation of the Euler-Lagrange equation |
| $\delta S + \int\sum_j Q_j\,\delta q_j\,dt = 0$ | extended Hamilton's principle with non-conservative forces |
| polar two-body: $L = \tfrac{1}{2} m(\dot{r}^2 + r^2\dot{\theta}^2) + \mu m/r$ | $\theta$ cyclic gives $m r^2\dot{\theta}$ conserved; $m\ddot{r} = m r\dot{\theta}^2 - \mu m/r^2$ |
| slosh on a stage: $\ell\ddot{\theta} + \ddot{x}\sin\theta = 0$ | a pendulum in the effective gravity of the body's acceleration; $\omega = \sqrt{a_0/\ell}$ |
| Newton-Euler vs Lagrange | single rigid body or constraint forces needed: Newton-Euler; holonomic constraints dominate (chains, gimbals, appendages, slosh): Lagrange |

This closes the module. You can now write the equation of motion of a variable-mass vehicle from a fixed-system momentum balance, account for every metre per second between ideal and realised $\Delta v$, check a simulation against the momentum, angular momentum and energy it must conserve, and choose — with reasons — between force balances and a Lagrangian for the next system you are handed. The rigid-body module takes the Newton-Euler branch for attitude; the flexible-modes and slosh material later in the curriculum takes the Lagrangian one.
