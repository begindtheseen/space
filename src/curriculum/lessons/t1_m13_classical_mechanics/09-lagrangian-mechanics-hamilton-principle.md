---
id: l09-lagrangian-mechanics-hamilton-principle
title: Lagrangian mechanics and Hamilton's principle
minutes: 23
covers:
  - Lagrangian mechanics and the Euler-Lagrange equation
  - Hamilton principle
---

Lesson 8 ended with Lagrange's equations, $\frac{d}{dt}(\partial T/\partial\dot{q}_j) - \partial T/\partial q_j = Q_j$: one equation per degree of freedom, no constraint forces, everything built from the kinetic energy $T$ and the generalised forces $Q_j$. This lesson finishes the job.

First, it folds the conservative forces into one function, the **Lagrangian** $L = T - V$. That turns Lagrange's equations into the **Euler-Lagrange equation** — the form every dynamics book and this module's flashcards use. Deriving the motion of a gimballed, sloshing, flexing vehicle then becomes a matter of differentiating. Second, it shows the same equation from a completely different starting point: **Hamilton's principle**. Think of all the routes a system *could* take between two positions, like all the routes on a map between home and school. The real one is special: it makes a certain total along the route "stationary".

Why does a GNC engineer need a second derivation? Three reasons.

- **Any coordinates work.** Hamilton's principle makes the equations take the same form in any generalised coordinates, which Newton's do not. That is what makes the method right for multibody dynamics.
- **Conservation laws come free.** A coordinate missing from $L$ has a conserved momentum. That is where an orbit's angular momentum and a system's energy come from, with no extra work.
- **It leads to optimal control.** The maths that finds the fuel-best path for a landing burn is Hamilton's principle with a cost in place of the Lagrangian.

## The Lagrangian and the Euler-Lagrange equation

Split lesson 8's generalised force into two parts. One comes from a potential energy $V(q, t)$ written in the generalised coordinates. The rest is non-conservative:

$$
Q_j^{\mathrm{total}} = -\frac{\partial V}{\partial q_j} + Q_j .
$$

From now on $Q_j$ means only the non-conservative part — thrust, drag, damping, motor torques — found as in lesson 8 from the virtual work $\sum_i \mathbf{F}_i^{\mathrm{nc}} \cdot \partial\mathbf{r}_i/\partial q_j$. Put this into Lagrange's equations and move the potential term to the left:

$$
\frac{d}{dt}\left(\frac{\partial T}{\partial\dot{q}_j}\right) - \frac{\partial T}{\partial q_j} + \frac{\partial V}{\partial q_j} = Q_j .
$$

$V$ depends on positions, not velocities, so $\partial V/\partial\dot{q}_j = 0$. That lets the whole left side be written with one function. Define the **[[Lagrangian|lagrange-name]]**

$$
L(q, \dot{q}, t) = T - V ,
$$

read "L equals T minus V": kinetic energy minus potential energy. Then $\partial L/\partial\dot{q}_j = \partial T/\partial\dot{q}_j$ and $\partial L/\partial q_j = \partial T/\partial q_j - \partial V/\partial q_j$. Substituting gives the **Euler-Lagrange equations**:

$$
\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}_j}\right) - \frac{\partial L}{\partial q_j} = Q_j, \qquad j = 1, \ldots, n .
$$

When every applied force is conservative, the right side is zero.

Notice the sign: $L$ is kinetic *minus* potential, not the total energy. Check it on the simplest case. A particle on a line with potential $V(x)$ has $L = \tfrac{1}{2} m\dot{x}^2 - V(x)$. So $\partial L/\partial\dot{x} = m\dot{x}$ and $\partial L/\partial x = -V'(x)$ (the prime means $dV/dx$). The Euler-Lagrange equation reads $m\ddot{x} + V'(x) = 0$ — Newton's second law with force $F = -dV/dx$. With a plus sign in $L$, the force would come out backward.

::: key Euler-Lagrange equation
The Euler-Lagrange equation: $\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}_i}\right) - \frac{\partial L}{\partial q_i} = Q_i$, with $L = T - V$ and $Q_i$ the generalised non-conservative force. One equation per generalised coordinate; constraint forces never appear.
:::

### The recipe

Deriving equations of motion is now a fixed procedure, like following a recipe card.

1. Count the degrees of freedom. Choose generalised coordinates $q_j$ that obey the constraints by construction (lesson 8).
2. Write every mass's position in terms of the $q$'s and $t$. Differentiate to get velocities, and form $T$.
3. Write the potential energy $V$ of every conservative force in the $q$'s: gravity, springs, gravitational $-\mu m/r$.
4. Form $L = T - V$.
5. For each $j$: find $\partial L/\partial\dot{q}_j$, differentiate it in time (chain rule through every $q$ and $\dot{q}$ inside it), and subtract $\partial L/\partial q_j$.
6. Find $Q_j$ for each non-conservative force from its virtual work, and set the two sides equal.

Step 5 is mechanical; symbolic algebra software does it well. Steps 1 to 3 are where the physics lives. Lesson 8's two identities guarantee that step 5 reproduces $\sum_i m_i\ddot{\mathbf{r}}_i \cdot \partial\mathbf{r}_i/\partial q_j$. So the result is Newton's second law, projected onto each allowed direction of motion — nothing more, nothing less.

::: example Slosh on an accelerating stage
Take lesson 8's stage: a body of mass $M$ moving along its thrust axis $x$, with a slosh pendulum of mass $m$ and length $\ell$ hanging backward from a pivot fixed to the body, at angle $\theta$ from the axis. The engine pushes with thrust $F_T$ along the axis. Ignore gravity (or say it acts along the axis and is folded into an effective $F_T$). Find the equations of motion and the slosh frequency.

**The Lagrangian.** From lesson 8, $T = \tfrac{1}{2}(M + m)\dot{x}^2 + m\ell\sin\theta\,\dot{x}\dot{\theta} + \tfrac{1}{2} m\ell^2\dot{\theta}^2$. There are no conservative forces, so $V = 0$ and $L = T$.

**Generalised forces.** Thrust is non-conservative. It acts on the body at a point that moves only with $x$. So $Q_x = F_T$ and $Q_\theta = 0$.

**The $x$ equation.** $\partial L/\partial\dot{x} = (M + m)\dot{x} + m\ell\sin\theta\,\dot{\theta}$ and $\partial L/\partial x = 0$. Differentiating the first in time (product rule on $\sin\theta\,\dot{\theta}$):

$$
(M + m)\ddot{x} + m\ell\left(\sin\theta\,\ddot{\theta} + \cos\theta\,\dot{\theta}^2\right) = F_T .
$$

**The $\theta$ equation.** $\partial L/\partial\dot{\theta} = m\ell\sin\theta\,\dot{x} + m\ell^2\dot{\theta}$. Its time derivative is $m\ell\cos\theta\,\dot{\theta}\dot{x} + m\ell\sin\theta\,\ddot{x} + m\ell^2\ddot{\theta}$. Also $\partial L/\partial\theta = m\ell\cos\theta\,\dot{x}\dot{\theta}$. Subtract: the $\cos\theta\,\dot{x}\dot{\theta}$ terms cancel. Divide by $m\ell$:

$$
\ell\ddot{\theta} + \ddot{x}\sin\theta = 0 .
$$

**Reading it.** This is a pendulum in an "effective gravity" equal to the body's acceleration $\ddot{x}$, pointing backward — like coffee sloshing toward you when a car speeds up. It is the accelerometer lesson again: the propellant feels specific force, not gravity. For small $\theta$, $\ddot{x} \approx a_0 = F_T/(M + m)$ and $\ddot{\theta} + (a_0/\ell)\theta = 0$. That is oscillation at $\omega = \sqrt{a_0/\ell}$.

**Numbers.** $M = 400\,\mathrm{t}$, $m = 20\,\mathrm{t}$, $\ell = 1.5\,\mathrm{m}$, $F_T = 5.71\,\mathrm{MN}$. So $a_0 = 5.71 \times 10^6 / 420{,}000 \approx 13.6\,\mathrm{m/s^2}$, and $\omega = \sqrt{13.6/1.5} \approx 3.01\,\mathrm{rad/s}$, about $0.48\,\mathrm{Hz}$ — one slosh every two seconds or so.

**What the slosh does to the body.** The $x$ equation gives $\ddot{x} = [F_T - m\ell(\sin\theta\,\ddot{\theta} + \cos\theta\,\dot{\theta}^2)]/(M + m)$: the steady $a_0$ plus a wobble. Take a swing of amplitude $\theta_0 = 5° = 0.0873\,\mathrm{rad}$, $\theta = \theta_0\cos\omega t$. Both terms in the bracket are proportional to $\theta_0^2$. Together they make an axial force of size $m\ell\omega^2\theta_0^2 = 20{,}000 \times 1.5 \times 9.07 \times 0.0873^2 \approx 2.1\,\mathrm{kN}$, wobbling at *twice* the slosh frequency. Divided by $420{,}000\,\mathrm{kg}$, that is $0.0049\,\mathrm{m/s^2}$, about $0.04\%$ of $a_0$ — tiny. The bigger effect is sideways: the bob pulls on its pivot across the axis with about $m\ell\omega^2\theta_0 \approx 23.7\,\mathrm{kN}$ at the slosh frequency itself. This model lets the body move only along its axis, so that pull does not show here. A model that lets the body slide sideways and pitch picks it up, and it is exactly the kind of signal that shows up in the IMU and that the attitude controller must not chase. Two lines of differentiation produced both equations; the pendulum tension never appeared.
:::

## Generalised momenta and conservation laws

The quantity $p_j = \partial L/\partial\dot{q}_j$ is the **generalised momentum** that goes with $q_j$. For an ordinary position coordinate it is the ordinary momentum $m\dot{x}$. For an angle it is an angular momentum. In these terms the Euler-Lagrange equation reads

$$
\dot{p}_j = \frac{\partial L}{\partial q_j} + Q_j .
$$

A conservation law drops straight out. Suppose $L$ does not contain some coordinate $q_k$ at all — such a coordinate is called **[[cyclic|cyclic-coordinate]]** or **ignorable** — and no non-conservative force acts on it. Then $\dot{p}_k = 0$, and $p_k$ is constant.

This is a machine for making conservation laws. Every symmetry of the system that shows up as a coordinate missing from $L$ hands you a conserved quantity for free. The module's earlier conservation laws are all special cases of this idea, which is known as **[[Noether's theorem|noether]]**.

Time gets one too. Define the **energy function**

$$
h = \sum_j \dot{q}_j\,\frac{\partial L}{\partial\dot{q}_j} - L .
$$

If $L$ has no explicit time in it and there are no non-conservative forces, $h$ is constant. If also $T$ is purely quadratic in the generalised velocities (scleronomic constraints), $h$ works out to $T + V$: conservation of mechanical energy, lesson 4's result, now read off from the form of $L$. With $Q_j \neq 0$, $h$ changes at the rate $\sum_j Q_j\dot{q}_j$ — the power of the non-conservative forces.

::: example A satellite's orbit from a Lagrangian
A satellite of mass $m$ moves in a plane under Earth's gravity. Use polar coordinates $(r, \theta)$ — distance from Earth's centre and angle around it. Derive the equations of motion and the conserved quantities.

**Kinetic energy.** Position is $\mathbf{r} = r(\cos\theta, \sin\theta)$. The velocity has a part $\dot{r}$ outward and a part $r\dot{\theta}$ sideways, at right angles. So $T = \tfrac{1}{2} m(\dot{r}^2 + r^2\dot{\theta}^2)$.

**Potential and Lagrangian.** $V = -\mu m/r$ (lesson 4). So

$$
L = \tfrac{1}{2} m\left(\dot{r}^2 + r^2\dot{\theta}^2\right) + \frac{\mu m}{r} .
$$

**The angle.** $\theta$ does not appear in $L$. Gravity pulls toward the centre, so the problem looks the same from every direction. So $\theta$ is cyclic and its momentum is conserved:

$$
p_\theta = \frac{\partial L}{\partial\dot{\theta}} = m r^2\dot{\theta} = \text{const}.
$$

That is the particle's angular momentum about Earth's centre, $m r v_\perp$ — obtained without computing a single torque.

**The radius.** $\partial L/\partial\dot{r} = m\dot{r}$ and $\partial L/\partial r = m r\dot{\theta}^2 - \mu m/r^2$. So

$$
m\ddot{r} = m r\dot{\theta}^2 - \frac{\mu m}{r^2} .
$$

**A circular orbit.** Set $\ddot{r} = 0$: $r\dot{\theta}^2 = \mu/r^2$, so $v = r\dot{\theta} = \sqrt{\mu/r}$. At $r = 6778\,\mathrm{km}$ (400 km up): $v = \sqrt{3.986 \times 10^{14}/6.778 \times 10^6} \approx 7669\,\mathrm{m/s}$. Then $\dot{\theta} = v/r \approx 1.13 \times 10^{-3}\,\mathrm{rad/s}$ and the period is $2\pi/\dot{\theta} \approx 5550\,\mathrm{s}$ — about 92 minutes, the familiar space-station period.

**Energy.** $L$ has no explicit $t$ and $T$ is quadratic, so $h = T + V = \tfrac{1}{2} m(\dot{r}^2 + r^2\dot{\theta}^2) - \mu m/r$ is also conserved — lesson 4's orbital energy. Substituting $\dot{\theta} = p_\theta/(m r^2)$ into it leaves one equation in $r$ alone, which is how the orbit's shape is found in the two-body module.
:::

## Hamilton's principle

So far the Euler-Lagrange equation came from Newton's laws, through d'Alembert's principle. It can also come from a single statement about whole journeys, with no forces mentioned at all.

Fix two configurations: the system starts at $q(t_1) = q_A$ and ends at $q(t_2) = q_B$. Many paths $q(t)$ connect them. For each path, add up the Lagrangian along the way to get the **[[action|action-units]]**:

$$
S[q] = \int_{t_1}^{t_2} L\big(q(t), \dot{q}(t), t\big)\,dt .
$$

The square brackets in $S[q]$ are a reminder that $S$ depends on the *whole path*, not on one number. It is measured in joule-seconds, $\mathrm{J\,s}$.

**Hamilton's principle** says: the path the system actually follows makes $S$ **[[stationary|stationary-picture]]**. That means a small change to the path, with both ends kept fixed, changes $S$ only by a second-order amount. In symbols, $\delta S = 0$.

To see what this implies, let $q(t)$ be the true path. Build a neighbouring path $q(t) + \epsilon\,\eta(t)$. Here $\eta(t)$ ("eta") is any smooth wiggle with $\eta(t_1) = \eta(t_2) = 0$, so the ends stay put, and $\epsilon$ ("epsilon") is a small number setting how big the wiggle is. Now the action is a function of $\epsilon$, and stationary means $dS/d\epsilon = 0$ at $\epsilon = 0$.

::: note Why stationary action gives the Euler-Lagrange equation
Use one coordinate for clarity; several work the same way, term by term. Differentiate under the integral with the chain rule — changing $\epsilon$ changes $q$ by $\eta$ and $\dot{q}$ by $\dot{\eta}$:

$$
\frac{dS}{d\epsilon}\bigg|_{\epsilon = 0} = \int_{t_1}^{t_2}\left(\frac{\partial L}{\partial q}\,\eta + \frac{\partial L}{\partial\dot{q}}\,\dot{\eta}\right)dt .
$$

The second term has $\dot{\eta}$, which is tied to $\eta$. Integrate it by parts to trade $\dot{\eta}$ for $\eta$:

$$
\int_{t_1}^{t_2}\frac{\partial L}{\partial\dot{q}}\,\dot{\eta}\,dt = \left[\frac{\partial L}{\partial\dot{q}}\,\eta\right]_{t_1}^{t_2} - \int_{t_1}^{t_2}\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}}\right)\eta\,dt .
$$

The boundary term is zero because $\eta$ is zero at both ends — this is exactly why the ends must be fixed. What is left is

$$
\frac{dS}{d\epsilon}\bigg|_{\epsilon = 0} = \int_{t_1}^{t_2}\left[\frac{\partial L}{\partial q} - \frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}}\right)\right]\eta\,dt = 0 .
$$

This must hold for *every* allowed wiggle $\eta(t)$. Suppose the bracket were positive on some small stretch of time. Choose $\eta$ as a positive **[[bump|bump-argument]]** on that stretch and zero elsewhere. The integral would be positive — a contradiction. So the bracket is zero at every instant:

$$
\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}}\right) - \frac{\partial L}{\partial q} = 0 .
$$
:::

So the Euler-Lagrange equation (for conservative systems) *is* the condition for stationary action. With $n$ coordinates the same argument gives $n$ equations. Non-conservative forces are added by including their virtual work: the **extended Hamilton's principle** is $\delta S + \int_{t_1}^{t_2}\sum_j Q_j\,\delta q_j\,dt = 0$, which gives the Euler-Lagrange equation with $Q_j$ on the right.

::: key Hamilton's principle
Hamilton's principle: among all paths $q(t)$ between fixed configurations at fixed times $t_1$ and $t_2$, the actual motion makes the action $S = \int_{t_1}^{t_2} L\,dt$ stationary, $\delta S = 0$. The Euler-Lagrange equations are the necessary conditions for stationarity, obtained by varying the path and integrating by parts.
:::

Three remarks on what the principle does and does not say.

- **Stationary, not minimum.** For short enough time spans the true path does minimise the action. Over longer ones it can be a **saddle** — lowest in some directions of wiggle, highest in others. "Least action" is an old misnomer.
- **Whole path versus instant.** The principle talks about a whole path, given both ends. Newton's law talks about each instant, given the start position and velocity. That the two agree is remarkable; the derivation above is the proof.
- **Why $T - V$.** A path that rushes piles up kinetic energy. One that loiters where the potential is high piles up potential energy. The real path balances the two, to first order.

::: example Testing stationarity on a thrown mass
A $1\,\mathrm{kg}$ mass is thrown straight up at $t = 0$ and comes back to the same height at $t_2 = 2.0\,\mathrm{s}$, under $g = 9.80665\,\mathrm{m/s^2}$. Work out the action of the true path and of nearby paths with the same ends. Check the true one is stationary.

**The true path.** To come back at $t_2$ the launch speed is $v_0 = g t_2/2 = 9.807\,\mathrm{m/s}$. It peaks at $v_0^2/2g = 4.90\,\mathrm{m}$. Height is $z(t) = v_0 t - \tfrac{1}{2} g t^2$.

**Its action.** Per kilogram, $L = \tfrac{1}{2}\dot{z}^2 - g z$. Put in $\dot{z} = v_0 - g t$ and integrate term by term from $0$ to $t_2$:

$$
S_{\mathrm{true}} = \int_0^{t_2}\left[\tfrac{1}{2}(v_0 - g t)^2 - g\left(v_0 t - \tfrac{1}{2} g t^2\right)\right]dt = \tfrac{1}{2} v_0^2 t_2 - v_0 g t_2^2 + \tfrac{1}{3} g^2 t_2^3 \approx -32.06\,\mathrm{J\,s}.
$$

(Numbers: $96.17 - 384.68 + 256.45 \approx -32.06$.)

**A wiggled path.** Try $z_\epsilon(t) = z(t) + \epsilon\sin(\pi t/t_2)$. The sine is zero at $t = 0$ and $t = t_2$, so the ends stay put. With $\eta = \sin(\pi t/t_2)$, the extra terms in $L$ are $\dot{z}\,\epsilon\dot{\eta} + \tfrac{1}{2}\epsilon^2\dot{\eta}^2 - g\epsilon\eta$. The terms with a single $\epsilon$ integrate to zero — that is the Euler-Lagrange equation being satisfied by $z(t)$ (you can check it by parts). What is left is

$$
S_\epsilon - S_{\mathrm{true}} = \tfrac{1}{2}\epsilon^2\int_0^{t_2}\dot{\eta}^2\,dt = \tfrac{1}{2}\epsilon^2\,\frac{\pi^2}{t_2^2}\cdot\frac{t_2}{2} = \frac{\pi^2\epsilon^2}{4 t_2}.
$$

**Numbers.** For $\epsilon = 0.5\,\mathrm{m}$: $\pi^2 \times 0.25 / 8 \approx +0.308\,\mathrm{J\,s}$. For $\epsilon = 1.0\,\mathrm{m}$: $+1.234\,\mathrm{J\,s}$. For $\epsilon = -0.5\,\mathrm{m}$: again $+0.308$. Integrating the wiggled paths on a computer gives the same values.

**Does it make sense?** The change grows like $\epsilon^2$ with no $\epsilon$ term — the mark of a stationary point. And since the leftover is $\tfrac{1}{2}\epsilon^2\int\dot{\eta}^2\,dt$, it is positive for *any* wiggle. So here the true path is a genuine minimum of the action.
:::

## Choosing between Newton-Euler and Lagrange

Both methods describe the same physics and, done right, give the same equations. The choice is about effort, error rate, and what you need from the answer.

Use **Newton-Euler** — force and moment balances on each body — when:

- the system is one rigid body, or a few bodies with simple joints;
- the main forces are non-conservative and depend on velocity (drag, thrust, control torques). These are easy to draw on a free-body diagram and gain nothing from a potential;
- you *need* the constraint forces, because a gimbal bearing, a hinge or a landing-leg strut must be sized for them;
- you are writing a real-time simulation of a chain of bodies, where recursive Newton-Euler algorithms are the fastest known.

Attitude dynamics of a rigid spacecraft, in the next module, is Newton-Euler territory: one body, outside torques, and Euler's equations follow directly.

Use **Lagrange** when holonomic constraints dominate — multibody chains, gimballed engines and antennas, hinged or flexible appendages, slosh pendulums, robot arms. Generalised coordinates remove the constraint forces you never wanted. The equations come out in a form that works in any coordinates, has a tidy structure ($\mathbf{M}(\mathbf{q})\ddot{\mathbf{q}} + \ldots$), and is easy to check for energy conservation. Use it too when you want conservation laws for free, or when you are heading toward optimal control.

The quickest test: count the constraint forces you would have to introduce and then eliminate. Zero or one? Newton-Euler is quicker. A handful or more? Lagrange is quicker *and* far less likely to hide a sign error. The slosh example — two lines of differentiation against a page of free-body diagrams with an unknown tension in each — is the typical ratio.

::: key When Lagrange wins
A Lagrangian formulation is decisively better than Newton-Euler when holonomic constraints dominate — multibody chains, gimbals, flexible appendages, slosh pendulums — because generalised coordinates eliminate the constraint forces you never wanted to compute. Newton-Euler is the natural choice for a single rigid body under external forces and torques, or when the constraint forces themselves are needed.
:::

::: warning Four Lagrangian slips
**Writing $L = T + V$.** The sign error reverses every conservative force.

**Forgetting the chain rule in step 5.** $\partial L/\partial\dot{q}_j$ depends on the $q$'s as well as the $\dot{q}$'s. Its time derivative produces the Coriolis-like terms, such as $m\ell\cos\theta\,\dot{x}\dot{\theta}$ in the slosh example. Drop them and energy is no longer conserved.

**Putting a non-conservative force into $V$.** Thrust and drag have no potential. They belong in $Q_j$.

**Taking $Q_j$ to be the force itself.** It is the virtual work per unit $\delta q_j$. For an angle, $Q_j$ is a torque, and a force applied away from the pivot needs its lever arm.
:::

## Check yourself

::: check
Two masses, $m_1 = 3.0\,\mathrm{kg}$ and $m_2 = 2.0\,\mathrm{kg}$, hang from a light string over a frictionless, massless pulley. Using one generalised coordinate $x$ (how far $m_1$ has moved down), write $L$ and find the acceleration. What did you not have to compute?
:::

::: answer
**Kinetic energy.** The string makes $m_2$ rise by $x$ when $m_1$ falls by $x$, so both move at speed $\dot{x}$: $T = \tfrac{1}{2}(m_1 + m_2)\dot{x}^2$.

**Potential.** With height measured upward, $m_1$ is at $-x$ and $m_2$ at $+x$: $V = -m_1 g x + m_2 g x = -(m_1 - m_2) g x$.

**Lagrangian and equation.** $L = \tfrac{1}{2}(m_1 + m_2)\dot{x}^2 + (m_1 - m_2) g x$. The Euler-Lagrange equation is $(m_1 + m_2)\ddot{x} - (m_1 - m_2) g = 0$, so

$$
\ddot{x} = \frac{(m_1 - m_2)\,g}{m_1 + m_2} = \frac{1.0}{5.0} \times 9.807 \approx 1.96\,\mathrm{m/s^2}.
$$

It is positive, so the heavier mass goes down, as it should. The string tension — the constraint force — never appeared. If you want it afterward, Newton's law for $m_2$ gives $2.0 \times (9.807 + 1.96) \approx 23.5\,\mathrm{N}$.
:::

::: check
A particle moves under uniform gravity with $L = \tfrac{1}{2} m(\dot{x}^2 + \dot{y}^2 + \dot{z}^2) - m g z$. Which coordinates are cyclic, and what is conserved? Is the energy conserved, and why?
:::

::: answer
$x$ and $y$ do not appear in $L$, so they are cyclic. Their momenta $p_x = m\dot{x}$ and $p_y = m\dot{y}$ are conserved: the horizontal momentum, because gravity has no sideways part.

$z$ does appear, so $p_z = m\dot{z}$ is not conserved: $\dot{p}_z = \partial L/\partial z = -mg$.

$L$ has no explicit time dependence and $T$ is quadratic in the velocities, so the energy function $h = T + V = \tfrac{1}{2} m v^2 + m g z$ is conserved too — the projectile's mechanical energy.
:::

::: check
Add a damper to the slosh pendulum of the worked example, exerting a torque $-c\dot{\theta}$ about the pivot. How does the $\theta$ equation change, and at what rate does the system's energy fall?
:::

::: answer
The damper is non-conservative, so it enters as a generalised force. In a rotation $\delta\theta$ it does virtual work $-c\dot{\theta}\,\delta\theta$, so $Q_\theta = -c\dot{\theta}$.

The $\theta$ equation (the earlier form multiplied back by $m\ell$) becomes $m\ell^2\ddot{\theta} + m\ell\sin\theta\,\ddot{x} = -c\dot{\theta}$.

The energy function changes at the rate $\sum_j Q_j\dot{q}_j = F_T\dot{x} - c\dot{\theta}^2$. Thrust adds energy at $F_T\dot{x}$. The damper removes it at $c\dot{\theta}^2$, which is never negative, so the slosh dies away. **[[Baffles|baffles]]** inside a tank are designed to make $c$ large.
:::

::: check
In deriving the Euler-Lagrange equation from Hamilton's principle, why must the wiggle $\eta(t)$ vanish at $t_1$ and $t_2$? What would go wrong without that? And why does $\int [\ldots]\eta\,dt = 0$ for every $\eta$ force the bracket itself to be zero?
:::

::: answer
Integrating by parts leaves a boundary term, $[(\partial L/\partial\dot{q})\,\eta]_{t_1}^{t_2}$. Only if $\eta$ is zero at both ends does it drop out, leaving an integral that multiplies $\eta$ alone. Otherwise the condition would also involve the generalised momentum at the ends, and it would not reduce to an equation holding at each instant. Fixing the ends is what makes the comparison "same start, same finish, different route".

For the second part: if the bracket were nonzero at some instant, then (since it is continuous) it would keep one sign over a small interval around it. Choose $\eta$ as a bump of that sign inside that interval and zero elsewhere. The integral would be strictly nonzero, contradicting $\delta S = 0$. So the bracket is zero everywhere. This is called the fundamental lemma of the calculus of variations.
:::

::: check
For each system, choose Newton-Euler or Lagrange and say why in a sentence or two: (a) a rigid satellite under gravity-gradient, magnetic and reaction-wheel torques; (b) a lander whose four legs are each a hinged two-link mechanism with a damper, touching down on a slope; (c) a launch vehicle during ascent with one gimballed engine and three slosh pendulums.
:::

::: answer
(a) **Newton-Euler.** One rigid body with outside torques, and no constraint forces to eliminate. Euler's equations follow directly.

(b) **Lagrange for the motion**, with the leg angles as generalised coordinates. Otherwise eight hinges' worth of constraint forces must be introduced and eliminated. The dampers enter as $Q_j$. But the strut loads are needed to size the legs, so after solving, recover them from Newton's law on individual links.

(c) **Lagrange.** In a planar model: body coordinates (3) plus one gimbal angle plus three pendulum angles make six degrees of freedom. The four joints — the gimbal and three pendulum pivots — carry five constraint-force components that generalised coordinates absorb. Thrust enters as $Q_j$ through its virtual work, as in lesson 8.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $L = T - V$ | the Lagrangian, kinetic minus potential energy, in generalised coordinates |
| $\frac{d}{dt}\left(\frac{\partial L}{\partial\dot{q}_i}\right) - \frac{\partial L}{\partial q_i} = Q_i$ | the Euler-Lagrange equation; $Q_i$ the generalised non-conservative force; right side zero for conservative systems |
| $p_j = \partial L/\partial\dot{q}_j$ | generalised momentum; conserved when $q_j$ is cyclic (absent from $L$) and $Q_j = 0$ |
| $h = \sum_j \dot{q}_j\,\partial L/\partial\dot{q}_j - L$ | energy function; equals $T + V$ for scleronomic systems; conserved when $\partial L/\partial t = 0$ and $Q_j = 0$, else $\dot{h} = \sum_j Q_j\dot{q}_j$ |
| $S = \int_{t_1}^{t_2} L\,dt$, $\delta S = 0$ | the action and Hamilton's principle: the true path makes $S$ stationary with the ends fixed |
| $q + \epsilon\eta$, $\eta(t_1) = \eta(t_2) = 0$, integrate by parts | the variational derivation of the Euler-Lagrange equation |
| $\delta S + \int\sum_j Q_j\,\delta q_j\,dt = 0$ | extended Hamilton's principle with non-conservative forces |
| polar two-body: $L = \tfrac{1}{2} m(\dot{r}^2 + r^2\dot{\theta}^2) + \mu m/r$ | $\theta$ cyclic gives $m r^2\dot{\theta}$ conserved; $m\ddot{r} = m r\dot{\theta}^2 - \mu m/r^2$ |
| slosh on a stage: $\ell\ddot{\theta} + \ddot{x}\sin\theta = 0$ | a pendulum in the effective gravity of the body's acceleration; $\omega = \sqrt{a_0/\ell}$ |
| Newton-Euler vs Lagrange | single rigid body, or constraint forces needed: Newton-Euler; holonomic constraints dominate (chains, gimbals, appendages, slosh): Lagrange |

This closes the module. You can now write the equation of motion of a variable-mass vehicle from a momentum balance on a fixed system, account for every metre per second between ideal and realised $\Delta v$, check a simulation against the momentum, angular momentum and energy it must conserve, and choose — with reasons — between force balances and a Lagrangian for the next system you are handed. The rigid-body module takes the Newton-Euler branch for attitude; the flexible-modes and slosh material later in the course takes the Lagrangian one.

::: context lagrange-name Who Lagrange was
Joseph-Louis Lagrange, born in Turin in 1736, worked in Berlin and Paris. His *Analytical Mechanics* (1788) rebuilt all of mechanics from energy functions and calculus, without a single diagram. Leonhard Euler had earlier worked out the calculus of variations that the equation's other name honours. He also studied the balance points of the three-body problem that now carry his name; the JWST telescope orbits near one of them.
:::

::: context cyclic-coordinate A coordinate the physics cannot see
If you rotate a whole orbit around Earth's centre, nothing about the physics changes: the pull of gravity only cares about distance, not direction. So the Lagrangian cannot contain $\theta$ — only $\dot{\theta}$. Whatever $\theta$ is doing, its momentum is left alone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="180" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="250" cy="100" r="6" fill="#b4232c"/>
  <circle cx="229.5" cy="50.5" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="100" x2="250" y2="100" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="180" y1="100" x2="229.5" y2="50.5" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="262" y="104" font-size="12" fill="#b4232c">θ</text>
  <text x="250" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">θ + 45°: same r, same pull</text>
  <text x="180" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">L depends on r, ṙ, θ̇ — never on θ itself</text>
</svg>
```
:::

::: context noether Symmetry means something is conserved
In 1918 the German mathematician Emmy Noether proved a sweeping version of this: every continuous symmetry of a system's action comes with a conserved quantity. Physics that is the same from place to place conserves momentum. Physics that is the same in every direction conserves angular momentum. Physics that is the same today as tomorrow conserves energy. Many physicists count it among the most beautiful results in their subject.
:::

::: context action-units The action and the quantum world
Action has units of energy times time, joule-seconds — the same units as Planck's constant, $6.626 \times 10^{-34}\,\mathrm{J\,s}$. That is no accident. In quantum mechanics, Richard Feynman showed that a particle in a sense "tries" every path, each weighted by its action, and for everyday objects the paths near the stationary one reinforce each other while the rest cancel. Hamilton's principle is what is left when that averaging is done.
:::

::: context stationary-picture What "stationary" looks like
Plot the action against the size $\epsilon$ of a wiggle, using the thrown-mass example later in this lesson. The curve is a bowl with its bottom exactly at $\epsilon = 0$, the true path. Near the bottom it is flat: a small wiggle changes $S$ only by an amount proportional to $\epsilon^2$. "Stationary" means that flatness, whether the point is a bottom, a top or a saddle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="165" x2="345" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="30" x2="180" y2="175" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M40,50 Q180,250 320,50" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="180" cy="150" r="5" fill="#b4232c"/>
  <circle cx="110" cy="125" r="4" fill="#1f2a44"/><circle cx="250" cy="125" r="4" fill="#1f2a44"/>
  <circle cx="40" cy="50" r="4" fill="#1f2a44"/><circle cx="320" cy="50" r="4" fill="#1f2a44"/>
  <text x="186" y="144" font-size="12" fill="#b4232c">true path</text>
  <text x="258" y="130" font-size="11" fill="#1f2a44">+0.308</text>
  <text x="300" y="40" font-size="11" fill="#1f2a44">+1.234 J·s</text>
  <text x="40" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">ε = −1</text>
  <text x="110" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">−0.5</text>
  <text x="180" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="250" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">0.5</text>
  <text x="320" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">1 m</text>
  <text x="26" y="24" font-size="12" fill="#1f2a44">S − S_true</text>
</svg>
```
:::

::: context bump-argument The bump trick
If the bracket were positive somewhere, pick a wiggle that is a smooth hump right there and flat zero everywhere else. Then the integral only "sees" the positive part and cannot be zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="345" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="128" font-size="12" text-anchor="end" fill="#1f2a44">time</text>
  <path d="M20,120 C80,130 120,60 170,55 C220,50 250,140 345,125" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="60" y="145" font-size="12" fill="#1d6fd1">bracket [ … ]</text>
  <path d="M130,110 L140,110 C150,110 155,70 170,70 C185,70 190,110 200,110 L210,110" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="170" y="40" font-size="12" text-anchor="middle" fill="#b4232c">bump η, zero outside</text>
  <line x1="140" y1="112" x2="140" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="200" y1="112" x2="200" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="170" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">bracket &gt; 0 here</text>
</svg>
```
:::

::: context baffles Taming slosh in real tanks
Launch vehicle tanks carry baffles — rings and plates that break up the swirl of the liquid and turn its motion into heat, which is the damping constant $c$ in engineering form. Getting slosh wrong is costly. On SpaceX's second Falcon 1 flight in 2007, propellant slosh in the upper stage grew into an oscillation the control system could not hold, and the engine shut down early, short of orbit. SpaceX added baffles to the tanks for later flights.
:::
