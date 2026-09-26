---
id: l08-stability-from-poles-and-phase-plane
title: Stability from pole locations, and the phase plane
minutes: 24
covers:
  - stability from pole locations
  - phase-plane basics
---

Balance a marble in a bowl and nudge it. It rolls back and forth and settles at the bottom. Balance it on an upside-down bowl and nudge it, and it rolls off and keeps going. Put it on a flat table and it rolls a little way and stops wherever it ends up. Those three are **stable**, **unstable** and **marginally stable**, and this lesson shows you how to tell which one a system is without ever building it.

Every response in this module has been a sum of modes $e^{pt}$, one per pole $p$. Whether a mode grows or dies is decided by one number: the real part of $p$. So a *system's* stability is decided by where its poles sit in the complex plane. That one test — every pole strictly left of the imaginary axis — is the most important fact in this module, and the control track uses it in every lesson.

The test has edges, and on a vehicle they matter. An undamped bending mode has poles on the axis and rings forever. A launch vehicle with its **[[center of pressure ahead of its center of mass|cp-ahead]]** has a pole on the right before any control is applied, and its attitude error doubles about every half second. A slow actuator can push a loop's poles from left to right with no change to the vehicle. The second half draws the same systems as curves in the **phase plane**, a picture of stability that works even for nonlinear systems with no poles at all.

## What stability means

Release a system from some starting state, with all inputs held at zero, and watch.

- It is **asymptotically stable** if the state returns to zero from every starting point — the marble in the bowl.
- It is **marginally stable** (or neutrally stable) if the state stays bounded but, from some starting points, does not return to zero — the marble on the table.
- It is **unstable** if, from some starting point, the state grows without bound — the marble on the upturned bowl.

A second way asks from input to output. A system is **[[BIBO stable|bibo]]** — "bounded input, bounded output" — if every input that stays within limits produces an output that stays within limits. Asymptotic stability guarantees BIBO stability, and the marginal case fails it, as you will see below.

### Each pole's real part decides its mode

The free response is $\sum_i c_i e^{p_it}$ for distinct poles ($\sum$ is "sum of"), with extra $t^ke^{pt}$ terms for a pole repeated $k + 1$ times. Write a pole as $p = \sigma + j\omega$ ("sigma plus j omega"). Then $e^{pt} = e^{\sigma t}e^{j\omega t}$, and the second factor only spins around without changing size, so $|e^{pt}| = e^{\sigma t}$. The real part alone sets each mode's size:

- $\sigma < 0$: the mode decays to zero with time constant $1/|\sigma|$, whether it oscillates or not.
- $\sigma > 0$: the mode grows without bound, doubling every $\ln 2/\sigma$ seconds.
- $\sigma = 0$: the mode neither grows nor decays — a constant ($\omega = 0$) or a steady oscillation ($\omega \ne 0$) — *if the pole is simple* (not repeated). A repeated pole on the axis brings a factor $t$, and $t$ or $t\sin\omega t$ grows.

A suitable starting state can switch on any mode, so the system is only as stable as its worst pole. That gives the test, as the **[[s-plane map|s-plane-map]]** shows at a glance.

::: key Stability from pole locations
Asymptotically stable iff every pole (eigenvalue of $\mathbf{A}$) has $\operatorname{Re}(s) < 0$ — all poles strictly inside the open left half plane. Poles exactly on the imaginary axis are marginally stable (when simple; a repeated axis pole is unstable); anything to the right is unstable. Zeros have no effect on stability.
:::

("Iff" means "if and only if": the test works in both directions.) The words "strictly" and "open" matter. The axis itself is not stable. A pole at $-10^{-6}$ is stable with a time constant of about twelve days; a pole at $0$ is marginal; a pole at $+10^{-6}$ is unstable. On any plot the three look the same. So designers demand a margin — every pole left of some line $\operatorname{Re}s = -\sigma_{\min}$, or inside some damping-ratio wedge — and the control track puts numbers on it.

### Three systems on the axis

The **integrator** $1/s$ has a simple pole at the origin. Released from some value, it holds that value forever: bounded, but not returning to zero. Marginally stable.

The **undamped oscillator** $\omega_n^2/(s^2 + \omega_n^2)$ has poles $\pm j\omega_n$. It rings at constant size forever. Marginally stable.

The **rigid body** $1/(Is^2)$ has a *double* pole at the origin, with modes $1$ and $t$. Give it a turn rate and its attitude grows in a straight line forever. That is unstable in the strict sense, even though nothing grows exponentially. Every spacecraft is unstable this way until its attitude loop closes.

### The marginal case fails BIBO

Drive the undamped oscillator with $\cos\omega_n t$ — a perfectly bounded input — and lesson 5 showed the output $(A\omega_n t/2)\sin\omega_n t$ grows without limit. Drive the integrator with a unit step and out comes a ramp. Both have axis poles; neither is BIBO stable.

::: note Why asymptotic stability gives bounded outputs
If every pole is in the open left half plane, the impulse response $h$ is a sum of decaying modes, so its total size is finite: $\int_0^\infty|h|\,dt < \infty$. Suppose the input never exceeds $\max|u|$. The convolution of lesson 7 gives $y = \int_0^t h(\tau)u(t - \tau)\,d\tau$, and the size of an integral is at most the integral of the size, so

$$
|y| \le \max|u| \int_0^\infty |h|\,dt ,
$$

a fixed bound that holds for all time.
:::

::: warning A right-half-plane zero is not an instability
Do not confuse a *pole* at $s = 0$ with a *zero* at $s = 0$. And do not let a zero on the right tempt you into calling a system unstable. $G(s) = (s - 3)/(s^2 + 3s + 2)$ has poles at $-1$ and $-2$ and is perfectly stable. Its right-half-plane zero makes the step response start off in the wrong direction — awkward for control, but not unstable. Stability belongs to the denominator alone.
:::

## Reading relative stability off a pole map

A pole map also says *how* stable.

- **Distance from the imaginary axis is the decay rate.** A pole with $\operatorname{Re}s = -\sigma$ gives a mode that falls to 2% after $4/\sigma$ seconds — lesson 3's settling time.
- **Angle from the negative real axis is the damping ratio**, $\zeta = \cos\theta$. A pole drifting toward the axis along a circle of constant $\omega_n$ loses damping before it loses stability.
- **Far-left poles die fast.** The **[[dominant poles|dominant-poles]]** are the ones nearest the axis, because after a short time they are all that is left of the response.

The satellite loop with a $0.05\,\mathrm{s}$ wheel lag (lessons 4 and 7) has poles at $-19.2$ and $-0.406 \pm 0.502j$. After half a second the fast mode has shrunk by $e^{-19.2 \times 0.5} = e^{-9.6} = 7 \times 10^{-5}$. The slow pair has shrunk only by $e^{-0.2} = 0.82$. So in practice the loop is the second-order system of its dominant pair: $\zeta = 0.63$, about 8% overshoot, $t_s \approx 4/0.406 = 9.9\,\mathrm{s}$.

### A quick test without finding the roots

**Second order.** The roots of $s^2 + a_1s + a_0$ have negative real parts if and only if $a_1 > 0$ and $a_0 > 0$. The reason: the roots add up to $-a_1$ and multiply to $a_0$. Two roots with negative real parts (real, or a conjugate pair) always have a negative sum and a positive product — and the reverse holds too.

**Third order.** For $a_3s^3 + a_2s^2 + a_1s + a_0$ with $a_3 > 0$, all roots lie in the left half plane if and only if

$$
a_2 > 0, \quad a_1 > 0, \quad a_0 > 0 \quad\text{and}\quad a_2a_1 > a_3a_0 .
$$

Positive coefficients are *necessary* at any order: a polynomial with all roots on the left is a product of factors $(s + a)$ and $(s^2 + 2\zeta\omega_ns + \omega_n^2)$ with positive coefficients, and multiplying them out cannot make a minus sign. But beyond second order they are not *enough*. The extra inequality is the cubic case of the **[[Routh–Hurwitz criterion|routh-hurwitz]]**, which the control track develops in general. On the boundary, $a_2a_1 = a_3a_0$, the cubic has a pole pair exactly on the imaginary axis at $\omega = \sqrt{a_0/a_2}$, and the system oscillates at that frequency without decaying.

::: key Low-order stability tests
Second order $s^2 + a_1s + a_0$: stable iff $a_1 > 0$ and $a_0 > 0$. Third order $a_3s^3 + a_2s^2 + a_1s + a_0$ ($a_3 > 0$): stable iff all coefficients are positive and $a_2a_1 > a_3a_0$; at equality a pole pair sits on the axis at $\omega = \sqrt{a_0/a_2}$. Positive coefficients are necessary at every order, sufficient only up to second.
:::

::: example A slow actuator destabilizes the satellite loop
Lesson 7 found the characteristic polynomial of the PD satellite ($I = 50\,\mathrm{kg\,m^2}$, $K_p = 20$, $K_d = 40$) with a wheel lag $\tau$:

$$
50\tau s^3 + 50s^2 + 40s + 20 .
$$

**Coefficients.** All four are positive for any $\tau > 0$, so the test comes down to $a_2a_1 > a_3a_0$:

$$
50 \times 40 > 50\tau \times 20 \quad\Longrightarrow\quad 2000 > 1000\,\tau \quad\Longrightarrow\quad \tau < 2\,\mathrm{s} .
$$

The plant and gains are unchanged; only the actuator's speed decides stability.

**Check by solving.** The numerical roots agree:

| $\tau$ (s) | Real pole | Complex pair | $\zeta$ of the pair | Verdict |
| --- | --- | --- | --- | --- |
| 0.05 | $-19.2$ | $-0.406 \pm 0.502j$ | 0.63 | stable, actuator invisible |
| 0.5 | $-1.23$ | $-0.386 \pm 0.709j$ | 0.48 | stable, more overshoot |
| 1.0 | $-0.685$ | $-0.158 \pm 0.748j$ | 0.21 | stable, rings for $4/0.158 = 25\,\mathrm{s}$ |
| 2.0 | $-0.500$ | $\pm 0.632j$ | 0 | marginal: steady oscillation at $0.632\,\mathrm{rad/s}$ |
| 3.0 | $-0.431$ | $+0.049 \pm 0.554j$ | — | unstable, amplitude doubles every $14\,\mathrm{s}$ |

The boundary frequency matches $\sqrt{a_0/a_2} = \sqrt{20/50} = 0.632\,\mathrm{rad/s}$ (period $9.9\,\mathrm{s}$), and at $\tau = 3$ the doubling time is $\ln 2/0.049 = 14\,\mathrm{s}$.

**Why.** The lag **[[delays the corrective torque|late-push]]**. Once the delay is a big enough fraction of the loop's period, the "damping" torque arrives so late that it adds energy instead of removing it.
:::

::: example A statically unstable launch vehicle
When a launch vehicle's center of pressure is ahead of its center of mass, an angle of attack creates a pitching moment that makes the angle *bigger*. Near a steady flight condition (a trim point), in still air, the angle of attack equals the pitch error $\theta$, and the rigid-body pitch dynamics are

$$
\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta ,
$$

with $\mu_\alpha > 0$ ("mu alpha") the aerodynamic instability coefficient and $\mu_\delta$ the control effectiveness of the nozzle deflection $\delta$. Take $\mu_\alpha = 2\,\mathrm{s^{-2}}$ and $\mu_\delta = 4\,\mathrm{s^{-2}/rad}$, typical of a mid-sized vehicle near maximum dynamic pressure.

**Open loop** ($\delta = 0$). The characteristic equation is $s^2 - 2 = 0$, so the poles are $s = \pm\sqrt{2} = \pm 1.41\,\mathrm{s^{-1}}$, one of them on the right. Released from a $1^\circ$ error at rest, $\theta = \cosh(1.41t)$ degrees: $2.2^\circ$ after one second, $8.5^\circ$ after two, $35^\circ$ after three. The e-folding time (to grow by a factor $e \approx 2.72$) is $1/1.41 = 0.71\,\mathrm{s}$ and the doubling time $\ln 2/1.41 = 0.49\,\mathrm{s}$.

**Close a PD loop**, $\delta = -(K_p\theta + K_d\dot{\theta})$. Substituting gives $\ddot{\theta} + \mu_\delta K_d\dot{\theta} + (\mu_\delta K_p - \mu_\alpha)\theta = 0$, with characteristic equation

$$
s^2 + \mu_\delta K_d\,s + (\mu_\delta K_p - \mu_\alpha) = 0 .
$$

**Apply the second-order test.** Both coefficients must be positive. The damping condition $K_d > 0$ is easy. The stiffness condition $K_p > \mu_\alpha/\mu_\delta = 0.5\,\mathrm{rad/rad}$ says the control torque per radian of error must beat the aerodynamic torque per radian just to hold the pole at the origin.

- $K_p = 0.4$, $K_d = 1$: $s^2 + 4s - 0.4$, roots $+0.098$ and $-4.10$. Still unstable, now slowly.
- $K_p = 0.5$ exactly: a pole sits at $s = 0$. Marginal — the vehicle holds any attitude error it picks up.
- $K_p = 2$, $K_d = 1$: $s^2 + 4s + 6$, poles $-2 \pm 1.41j$, $\omega_n = \sqrt{6} = 2.45\,\mathrm{rad/s}$, $\zeta = 2/2.45 = 0.82$. Stable, with a $4/2 = 2\,\mathrm{s}$ settling time.

Feedback alone has moved the right-half-plane pole across the axis. Keeping it there, with margin, all through the flight as $\mu_\alpha$ changes, is the launch-vehicle autopilot's central problem.
:::

::: note Discrete time: the unit circle
A flight computer runs in steps of $\Delta t$. Lesson 4 showed that the exact step matrix $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ has eigenvalues $e^{p_i\Delta t}$, and $|e^{p\Delta t}| = e^{\sigma\Delta t} < 1$ exactly when $\operatorname{Re}p < 0$. So the left half plane maps to the inside of the unit circle, and the imaginary axis to the circle itself. A discrete-time system is asymptotically stable iff every eigenvalue of $\boldsymbol{\Phi}$ has size less than one.
:::

## The phase plane

A hiking map shows *where* you went as a line on the ground, not *when*. The phase plane is that kind of map for a system's state.

Instead of plotting $y$ against $t$, plot the point $(x_1, x_2) = (y, \dot{y})$ and watch it move. The plane of $(y, \dot{y})$ is the **[[phase plane|phase-word]]**. The curve the point traces is a **trajectory**. The whole family of trajectories, one through every starting point, is the **phase portrait**. Time is not an axis; it runs along each curve, shown by arrows. Exactly one solution passes through each state, so trajectories never cross.

Two facts orient any portrait of $\dot{x}_1 = x_2$, $\dot{x}_2 = f(x_1, x_2)$:

- **It turns clockwise.** In the upper half, $x_2 = \dot{y} > 0$, so $y$ increases and the point moves right. In the lower half it moves left. So trajectories circle the origin clockwise.
- **It crosses the horizontal axis vertically.** On that axis $x_2 = 0$, so $\dot{x}_1 = 0$ while $\dot{x}_2 = f(x_1, 0)$ generally is not zero.

Points where both $\dot{x}_1$ and $\dot{x}_2$ are zero are **equilibria**: put the system there and it stays. For a linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with $\mathbf{A}$ invertible, the only equilibrium is the origin.

### The linear portraits and the eigenvalues

For $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ the trajectory from $\mathbf{x}(0)$ is $e^{\mathbf{A}t}\mathbf{x}(0)$, and the eigenvalues of $\mathbf{A}$ — the poles — fix its shape. For the companion form $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -a_0 & -a_1 \end{bmatrix}$ the eigenvalues solve $s^2 + a_1s + a_0 = 0$. Their sum is $-a_1 = \operatorname{tr}\mathbf{A}$ (the **trace**, the sum of the diagonal) and their product is $a_0 = \det\mathbf{A}$. Six portraits cover the main cases:

| Eigenvalues | $\det\mathbf{A}$, $\operatorname{tr}\mathbf{A}$ | Portrait | Stability |
| --- | --- | --- | --- |
| complex, $\operatorname{Re} < 0$ | $\det > 0$, $\operatorname{tr} < 0$, $\operatorname{tr}^2 < 4\det$ | **stable spiral** (focus) into the origin | asymptotically stable |
| real, both negative | $\det > 0$, $\operatorname{tr} < 0$, $\operatorname{tr}^2 \ge 4\det$ | **stable node**: curves run in, tangent to the slow eigenvector | asymptotically stable |
| purely imaginary | $\det > 0$, $\operatorname{tr} = 0$ | **center**: closed ellipses | marginal |
| complex, $\operatorname{Re} > 0$ | $\det > 0$, $\operatorname{tr} > 0$, $\operatorname{tr}^2 < 4\det$ | **unstable spiral** outward | unstable |
| real, both positive | $\det > 0$, $\operatorname{tr} > 0$, $\operatorname{tr}^2 \ge 4\det$ | **unstable node** | unstable |
| real, opposite signs | $\det < 0$ | **saddle**: in along one eigenvector, out along the other | unstable |

The eigenvectors are the straight-line trajectories: along an eigenvector $\mathbf{v}$ the motion is $\mathbf{v}e^{\lambda t}$ — toward the origin if $\lambda < 0$, away if $\lambda > 0$. In a saddle the incoming eigenvector is the only road to the origin; every other trajectory leaves along the outgoing one. That incoming line is the **separatrix**, dividing regions with different fates.

::: key The phase plane
Phase plane: the plane of $(y, \dot{y})$; a trajectory is the state's path, circling clockwise and crossing the $y$-axis vertically. Linear portraits by eigenvalue: complex left-half-plane pair → stable spiral; real negative → stable node; imaginary pair → center (closed orbits); right-half-plane → unstable spiral or node; real pair of opposite sign → saddle, with the eigenvectors as the straight-line trajectories. For a $2 \times 2$ matrix, $\det\mathbf{A} < 0$ means saddle; $\det > 0$ with $\operatorname{tr}\mathbf{A} < 0$ means stable, oscillatory when $\operatorname{tr}^2 < 4\det$.
:::

Three portraits from this module:

- **The undamped oscillator**, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_n^2 & 0 \end{bmatrix}$, has $\operatorname{tr} = 0$: a center. Lesson 4 found $e^{\mathbf{A}t}$ to be a rotation in the coordinates $(y, \dot{y}/\omega_n)$. So in those coordinates the trajectories are circles, and in $(y, \dot{y})$ they are ellipses $\omega_n^2y^2 + \dot{y}^2 = \mathrm{const}$ — conservation of energy drawn as a curve.
- **The PD satellite**, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -0.4 & -0.8 \end{bmatrix}$, has $\operatorname{tr} = -0.8$, $\det = 0.4$ and $\operatorname{tr}^2 - 4\det = 0.64 - 1.6 = -0.96 < 0$: a **[[stable spiral|satellite-spiral]]**, worked out in the next example.
- **The open-loop launch vehicle**, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 2 & 0 \end{bmatrix}$, has $\det = -2$: a **[[saddle|saddle-picture]]**, with eigenvalues $\pm 1.41$ and eigenvectors $[1, \pm 1.41]^T$. Released with $\dot{\theta} = -1.41\theta$ exactly, it slides into the origin along the incoming eigenvector. Released any other way, it departs along the outgoing one, $\dot{\theta} = +1.41\theta$, and tumbles. The trajectories are the hyperbolas $\dot{\theta}^2 - 2\theta^2 = \mathrm{const}$: multiply $\ddot{\theta} = 2\theta$ by $\dot{\theta}$ and integrate.

::: example The satellite's spiral, step by step
Release the PD satellite from $\theta = 0.1\,\mathrm{rad}$ at rest: $\mathbf{x}(0) = [0.1, 0]^T$, a point on the positive $\theta$-axis. Using $e^{\mathbf{A}t}$ from lesson 4, with $\sigma = 0.4$ and $\omega_d = 0.490$, the state at a few times is

| $t$ (s) | 0 | 1 | 2 | 3 | 4 | 5 | 6.41 | 8 | 12.8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $\theta$ (rad) | 0.100 | 0.085 | 0.056 | 0.028 | 0.008 | $-0.003$ | $-0.0077$ | $-0.005$ | 0.0006 |
| $\dot{\theta}$ (rad/s) | 0 | $-0.026$ | $-0.030$ | $-0.024$ | $-0.015$ | $-0.007$ | 0 | 0.002 | 0 |

**Follow the point.** It leaves the axis heading straight down: the torque is negative, so the rate goes negative. It swings clockwise through the lower half, reaching its most negative rate, $-0.031\,\mathrm{rad/s}$, at $t = 1.8\,\mathrm{s}$. It crosses the negative $\theta$-axis vertically at $t = \pi/\omega_d = 6.41\,\mathrm{s}$ — half a ringing period — at $\theta = -0.0077\,\mathrm{rad}$. It comes back to the positive axis at $12.8\,\mathrm{s}$, at $0.0006\,\mathrm{rad}$.

**The shrink per half turn** is $e^{-\sigma\pi/\omega_d} = e^{-2.57} = 0.077$. So the axis crossings go $0.1$, $-0.0077$, $0.0006$, … each $0.077$ times the one before, flipping side. Check: $0.1 \times 0.077 = 0.0077$. Good.

**What $\zeta$ and $\omega_n$ look like.** With $\zeta = 0.63$ the point gets within 1% of the origin before one full turn. The bending mode of lesson 3, with $\zeta = 0.005$, would circle more than a hundred times before shrinking that much, and would look like a center to the eye. In the phase plane, damping ratio is how fast the spiral winds in per turn, and natural frequency is how fast the point travels along it.
:::

### Beyond the linear case

The phase plane is most useful where transfer functions stop working. A **nonlinear** second-order system $\ddot{y} = f(y, \dot{y})$ has a portrait too, usually with several equilibria. Near each one the portrait looks like that of the **linearization** — the matrix of partial derivatives of $f$ evaluated there.

Take the pendulum $\ddot{\theta} + \omega_0^2\sin\theta = 0$, with $\omega_0 = \sqrt{g/L} = 3.13\,\mathrm{rad/s}$ for $L = 1\,\mathrm{m}$. It has equilibria at $\theta = 0$ (hanging down) and $\theta = \pi$ (balanced upside down).

- Near $0$, $\sin\theta \approx \theta$ gives $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_0^2 & 0 \end{bmatrix}$: a center.
- Near $\pi$, $\sin\theta \approx -(\theta - \pi)$ gives $\begin{bmatrix} 0 & 1 \\ \omega_0^2 & 0 \end{bmatrix}$: a saddle, with eigenvalues $\pm 3.13\,\mathrm{s^{-1}}$.

The full portrait stitches these together: closed loops around the bottom for small swings, saddles at $\pm\pi$, and between them the separatrix that divides swinging from tumbling over the top. Energy gives it: $\tfrac{1}{2}\dot{\theta}^2 - \omega_0^2\cos\theta = \omega_0^2$, which passes the bottom at $\dot{\theta} = 2\omega_0 = 6.26\,\mathrm{rad/s}$. Add damping and the centers become spirals; the saddles stay saddles. A **[[gravity-gradient-stabilized satellite|gravity-gradient]]** is exactly this system, rocking gently about the local vertical.

The other must-know nonlinear portrait is the **double integrator with limited control**, $\ddot{y} = u$ with $|u| \le u_{\max}$ — the model of any thruster-controlled spacecraft. For constant $u$, multiply $\ddot{y} = u$ by $\dot{y}$ and integrate: $\tfrac{1}{2}\dot{y}^2 = uy + \mathrm{const}$. So the trajectories are parabolas, opening to the right for $u > 0$ and to the left for $u < 0$. A time-optimal maneuver is two parabolic arcs: full thrust one way, then **[[full thrust the other|bang-bang]]**, switching on the one parabola that passes through the origin. The phase plane is where that switching curve is drawn.

::: warning Where, not when
A phase portrait shows *where* the state goes, not *when*. Two trajectories that look identical can be traveled at very different speeds: the satellite with $\omega_n$ doubled draws the same spiral in half the time. And a trajectory that seems to arrive at the origin may be creeping toward it ever more slowly along a slow eigenvector.
:::

## Check yourself

::: check
Without solving, decide whether each characteristic polynomial describes a stable system: (a) $s^3 + 2s^2 + 3s + 10$; (b) $s^3 + 4s^2 + 5s + 2$; (c) $s^4 + 2s^2 + 1$.
:::

::: answer
(a) All coefficients are positive, but $a_2a_1 = 2 \times 3 = 6$ is less than $a_3a_0 = 1 \times 10 = 10$. Unstable. The roots are $-2.45$ and $+0.223 \pm 2.01j$, a growing oscillation.

(b) All positive, and $4 \times 5 = 20 > 1 \times 2 = 2$. Stable. It factors as $(s + 1)^2(s + 2)$.

(c) The $s^3$ and $s$ coefficients are zero, so the necessary condition fails. In fact $s^4 + 2s^2 + 1 = (s^2 + 1)^2$: a *repeated* pair on the imaginary axis, whose modes include $t\sin t$. Unstable — not marginal, because the axis poles are not simple.
:::

::: check
A plant $1/(s(s + 2)(s + 5))$ is under unity feedback with gain $K$. For what range of $K$ is the loop stable, at what frequency does it oscillate on the boundary, and where are the poles for $K = 100$?
:::

::: answer
Closed-loop bottom line $=$ open-loop bottom line $+$ top line: $s(s + 2)(s + 5) + K = s^3 + 7s^2 + 10s + K$.

Stability needs $K > 0$ and $7 \times 10 > 1 \times K$, so $0 < K < 70$.

At $K = 70$ the axis poles are at $\pm j\sqrt{a_0/a_2} = \pm j\sqrt{70/7} = \pm j\sqrt{10} = \pm 3.16j$: a steady oscillation at $3.16\,\mathrm{rad/s}$ (the third pole is at $-7$).

At $K = 100$ the roots are $-7.46$ and $+0.229 \pm 3.65j$. Unstable: each cycle takes $2\pi/3.65$ seconds, so the amplitude grows by $e^{0.229 \times 2\pi/3.65} = 1.48$ per cycle.
:::

::: check
Classify the phase portrait of each system and state its stability: $\mathbf{A}_1 = \begin{bmatrix} 0 & 1 \\ -9 & 0 \end{bmatrix}$, $\mathbf{A}_2 = \begin{bmatrix} 0 & 1 \\ -9 & -6 \end{bmatrix}$, $\mathbf{A}_3 = \begin{bmatrix} 0 & 1 \\ 9 & 0 \end{bmatrix}$, $\mathbf{A}_4 = \begin{bmatrix} 0 & 1 \\ -9 & 2 \end{bmatrix}$.
:::

::: answer
$\mathbf{A}_1$: $\operatorname{tr} = 0$, $\det = 9$, eigenvalues $\pm 3j$. A center, marginally stable, with ellipses $9y^2 + \dot{y}^2 = \mathrm{const}$.

$\mathbf{A}_2$: $\operatorname{tr} = -6$, $\det = 9$, $\operatorname{tr}^2 - 4\det = 36 - 36 = 0$. A repeated eigenvalue $-3$: a stable (degenerate) node, critically damped, asymptotically stable.

$\mathbf{A}_3$: $\det = -9$, eigenvalues $\pm 3$. A saddle, unstable, with eigenvectors $[1, \pm 3]^T$.

$\mathbf{A}_4$: $\operatorname{tr} = +2$, $\det = 9$, $\operatorname{tr}^2 - 4\det = 4 - 36 = -32 < 0$. Eigenvalues $1 \pm 2.83j$: an unstable spiral.

Only $\mathbf{A}_2$ has all its poles strictly in the left half plane.
:::

::: check
Why is a rigid body with no attitude feedback called unstable rather than marginally stable, when nothing about it grows exponentially?
:::

::: answer
Its transfer function $1/(Is^2)$ has a double pole at $s = 0$. A simple pole on the axis gives the mode $e^{0t} = 1$, which is bounded. The repeated pole adds the mode $t$, which is not.

Physically, any starting rate makes the attitude grow in a straight line forever. "Unstable" means the state escapes every bound from some starting point, and straight-line growth does that; exponential growth is not required. The undamped oscillator's simple pair $\pm j\omega_n$, by contrast, is marginal: bounded from every starting point.
:::

::: check
A spacecraft modeled as $\ddot{y} = u$ with $|u| \le 1$ starts at $y = 1$, $\dot{y} = 0$ and must reach the origin at rest as fast as possible. Using phase-plane parabolas, describe the trajectory and find the switching point and total time.
:::

::: answer
**First arc.** Apply $u = -1$. The trajectory is the leftward parabola $\dot{y}^2 = 2(1 - y)$ through the start, on which $y = 1 - t^2/2$ and $\dot{y} = -t$.

**The arc into the origin.** The only $u = +1$ trajectory that reaches the origin at rest is $\dot{y}^2 = 2y$ with $\dot{y} < 0$ (from $\tfrac{1}{2}\dot{y}^2 = y + \mathrm{const}$ with the constant zero).

**Where they meet.** $2(1 - y) = 2y$ gives $y = 0.5$ and $\dot{y} = -1$, reached at $t = 1\,\mathrm{s}$.

**Second arc.** Switch to $u = +1$ there: $\dot{y} = -1 + (t - 1)$ and $y = 0.5 - (t - 1) + (t - 1)^2/2$. Both reach zero together at $t = 2\,\mathrm{s}$.

Total time $2\,\mathrm{s}$. Switching later (at $y = 0$, say) would overshoot to $y = -1$ before stopping.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{Re}s < 0$ for every pole | Asymptotically stable (necessary and sufficient); each mode $e^{pt}$ decays |
| Any pole with $\operatorname{Re}s > 0$ | Unstable; doubling time $\ln 2/\operatorname{Re}s$ |
| Simple pole on $\operatorname{Re}s = 0$ | Marginally stable: bounded, non-decaying; fails BIBO |
| Repeated pole on $\operatorname{Re}s = 0$ | Unstable ($t$, $t\sin\omega t$ modes); e.g. the rigid body $1/(Is^2)$ |
| Zeros | No effect on stability |
| $s^2 + a_1s + a_0$: $a_1, a_0 > 0$ | Second-order stability test |
| $a_2a_1 > a_3a_0$ (plus positive coefficients) | Third-order test; boundary oscillation at $\sqrt{a_0/a_2}$ |
| $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$ | Statically unstable vehicle, poles $\pm\sqrt{\mu_\alpha}$; needs $K_p > \mu_\alpha/\mu_\delta$ |
| $\lvert e^{p\Delta t}\rvert < 1 \iff \operatorname{Re}p < 0$ | Discrete-time equivalent: eigenvalues inside the unit circle |
| Phase plane $(y, \dot{y})$ | Trajectories circle clockwise, cross the $y$-axis vertically, never intersect |
| spiral, node, center, saddle | Portraits for complex, real-same-sign, imaginary and real-opposite-sign eigenvalues |
| $\det\mathbf{A} < 0$; $\det > 0$, $\operatorname{tr} < 0$ | Saddle; stable (spiral if $\operatorname{tr}^2 < 4\det$) |
| $\tfrac{1}{2}\dot{y}^2 = uy + \mathrm{const}$ | Double-integrator trajectories under constant control: parabolas |

This closes the module. The control track picks up every one of these tools: transfer functions and block algebra to build loops, pole locations to judge them, $\zeta$ and $\omega_n$ to specify them, the frequency response of lesson 5 to measure their margins, and the phase plane to handle the thrusters and saturations that no transfer function can describe.

::: context cp-ahead Why a rocket wants its feathers at the back
An arrow flies straight because its feathers are at the back. If it tilts, air pushes on the feathers and swings the tail back in line. The point where the air's push effectively acts is the **center of pressure**; the balance point is the **center of mass**. Push behind the balance point and the arrow straightens itself. Push ahead of it and any tilt gets worse.

Model rockets have fins for the same reason. Many large launch vehicles have no fins, and their center of pressure sits ahead of their center of mass during much of the climb through the atmosphere. Their gimbaled engines keep them pointed, many times a second.
:::

::: context bibo Bounded, in plain words
A signal is **bounded** if there is some fixed number it never goes beyond, however long you wait. $\sin t$ is bounded (never past $1$); $t$ is not; $e^{-t}$ is.

BIBO stability asks: if I promise to keep my input bounded, will you promise to keep your output bounded? A stable autopilot must keep that promise, because gusts, sensor noise and vibration are all bounded inputs that never stop arriving.
:::

::: context s-plane-map The map of where poles live
Every pole is a point on the plane of complex numbers: its real part across, its imaginary part up. The left half (shaded) is stable ground. The imaginary axis is the knife-edge. The right half is unstable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="180" height="180" fill="#8fb8f0" fill-opacity="0.35"/>
  <line x1="20" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="190" x2="200" y2="10" stroke="#1f2a44" stroke-width="2"/>
  <text x="340" y="116" font-size="12" text-anchor="end" fill="#1f2a44">Re s</text>
  <text x="206" y="22" font-size="12" fill="#1f2a44">Im s</text>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="115" y1="55" x2="125" y2="65"/><line x1="125" y1="55" x2="115" y2="65"/>
    <line x1="115" y1="135" x2="125" y2="145"/><line x1="125" y1="135" x2="115" y2="145"/>
    <line x1="55" y1="95" x2="65" y2="105"/><line x1="65" y1="95" x2="55" y2="105"/>
  </g>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="195" y1="35" x2="205" y2="45"/><line x1="205" y1="35" x2="195" y2="45"/>
    <line x1="195" y1="155" x2="205" y2="165"/><line x1="205" y1="155" x2="195" y2="165"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="255" y1="55" x2="265" y2="65"/><line x1="265" y1="55" x2="255" y2="65"/>
    <line x1="255" y1="135" x2="265" y2="145"/><line x1="265" y1="135" x2="255" y2="145"/>
  </g>
  <text x="80" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">stable: modes decay</text>
  <text x="212" y="60" font-size="12" fill="#1f2a44">marginal</text>
  <text x="290" y="30" font-size="12" text-anchor="middle" fill="#b4232c">unstable: modes grow</text>
  <text x="120" y="180" font-size="11" text-anchor="middle" fill="#1f2a44">−2 ± 1j</text>
  <text x="260" y="180" font-size="11" text-anchor="middle" fill="#b4232c">+1.5 ± 1j</text>
</svg>
```

Farther left means faster decay. Higher up means faster oscillation.
:::

::: context dominant-poles Why the slow poles run the show
Picture two candles, one that burns out in a second and one that lasts an hour. Walk into the room after a minute and only the slow candle is still lit. Modes are like that: each fades at its own rate $e^{-\sigma t}$, and the fast ones are gone almost at once.

That is why engineers happily describe a tenth-order loop by its two slowest poles. The usual rule of thumb is that a pole at least five times farther from the axis than the dominant pair can be ignored for overshoot and settling time. It is a rule of thumb, not a law — always check.
:::

::: context routh-hurwitz Two mathematicians, one test
In 1877 the English mathematician Edward Routh won Cambridge's Adams Prize for an essay on the stability of motion, which included a table method for deciding whether all roots of a polynomial have negative real parts — without solving for them. In 1895 the German mathematician Adolf Hurwitz, asked by the engineer Aurel Stodola about stabilizing turbine speed governors, found an equivalent test using determinants.

The two methods give the same answer, so today they share a name. The cubic condition $a_2a_1 > a_3a_0$ in this lesson is the smallest case that needs more than "all coefficients positive".
:::

::: context late-push Pushing a swing at the wrong moment
To make a playground swing die down, you push against its motion — backward while it swings forward. That removes energy. Now suppose you react slowly and push a quarter swing late. Your push now lines up partly with the motion and does less good. Later still, and your "braking" push arrives while the swing is already coming back toward you, and it adds energy.

A slow actuator does exactly this to a control loop. The torque is the right size but arrives late, and past a certain delay it pumps the oscillation up instead of calming it.
:::

::: context phase-word Why "phase"?
**Phase** is an old word for a stage in a repeating cycle, like the phases of the Moon. For an oscillator, knowing position and velocity together tells you exactly where it is in its cycle — its phase. So the plane of position and velocity became the phase plane.

The idea of studying the *shape* of all solutions at once, instead of solving for one, is largely due to the French mathematician Henri Poincaré in the 1880s. It is still the first tool engineers reach for when an equation is too nonlinear to solve.
:::

::: context satellite-spiral The satellite's spiral, drawn
The PD satellite released from $\theta = 0.1\,\mathrm{rad}$ at rest, plotted from $t = 0$ to $13\,\mathrm{s}$. The two axes use different scales so the shape is visible: the rate never gets beyond about $0.031\,\mathrm{rad/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="50" x2="345" y2="50" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="85" y1="195" x2="85" y2="12" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="342" y="42" font-size="12" text-anchor="end" fill="#1f2a44">θ</text>
  <text x="91" y="22" font-size="12" fill="#1f2a44">θ̇</text>
  <line x1="201.7" y1="47" x2="201.7" y2="53" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="318.3" y1="47" x2="318.3" y2="53" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="201.7" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">0.05</text>
  <text x="318.3" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">0.1</text>
  <line x1="82" y1="170" x2="88" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="79" y="174" font-size="11" text-anchor="end" fill="#1f2a44">−0.03</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="318.3,50.0 317.9,65.4 316.6,79.5 314.5,92.4 311.6,104.2 308.2,114.8 304.1,124.4 299.5,133.0 294.4,140.6 288.9,147.2 283.1,153.0 276.9,157.9 270.5,162.1 263.9,165.5 257.1,168.2 250.1,170.2 243.1,171.6 235.9,172.4 228.8,172.7 221.6,172.5 214.5,171.9 207.4,170.8 200.4,169.3 193.5,167.5 186.7,165.4 180.0,163.0 173.5,160.4 167.2,157.5 161.0,154.5 155.0,151.2 149.2,147.9 143.6,144.4 138.2,140.8 133.0,137.2 128.0,133.4 123.2,129.7 118.7,125.9 114.4,122.2 110.3,118.4 106.4,114.7 102.7,111.0 99.3,107.4 96.0,103.8 93.0,100.3 90.2,96.9 87.5,93.5 85.1,90.2 82.8,87.1 80.8,84.0 78.9,81.1 77.1,78.2 75.6,75.5 74.2,72.8 72.9,70.3 71.8,67.9 70.8,65.6 70.0,63.5 69.2,61.4 68.6,59.5 68.1,57.7 67.7,56.0 67.4,54.3 67.2,52.8 67.1,51.5 67.1,50.2 67.1,49.0 67.2,47.9 67.3,46.9 67.5,45.9 67.8,45.1 68.1,44.4 68.5,43.7 68.8,43.1 69.3,42.6 69.7,42.1 70.2,41.7 70.7,41.4 71.2,41.1 71.7,40.9 72.2,40.8 72.8,40.7 73.3,40.6 73.9,40.6 74.4,40.6 75.0,40.6 75.5,40.7 76.1,40.8 76.6,40.9 77.1,41.1 77.6,41.3 78.1,41.5 78.6,41.7 79.1,41.9 79.6,42.2 80.0,42.4 80.4,42.7 80.9,43.0 81.3,43.3 81.6,43.5 82.0,43.8 82.4,44.1 82.7,44.4 83.0,44.7 83.3,45.0 83.6,45.3 83.9,45.6 84.1,45.8 84.4,46.1 84.6,46.4 84.8,46.6 85.0,46.9 85.1,47.1 85.3,47.4 85.5,47.6 85.6,47.8 85.7,48.0 85.8,48.2 85.9,48.4 86.0,48.6 86.1,48.8 86.1,48.9 86.2,49.1 86.3,49.3 86.3,49.4 86.3,49.5 86.3,49.7 86.4,49.8 86.4,49.9 86.4,50.0"/>
  <polygon points="283.1,153.0 288.0,141.0 295.1,148.1" fill="#1d6fd1"/>
  <circle cx="318.3" cy="50" r="4" fill="#1f2a44"/>
  <circle cx="67.1" cy="50" r="3.5" fill="#b4232c"/>
  <circle cx="228.8" cy="172.7" r="3.5" fill="#b4232c"/>
  <text x="310" y="68" font-size="11" text-anchor="end" fill="#1f2a44">start</text>
  <text x="228.8" y="190" font-size="11" text-anchor="middle" fill="#b4232c">fastest: t = 1.8 s</text>
  <text x="45" y="36" font-size="11" text-anchor="middle" fill="#b4232c">−0.0077</text>
</svg>
```

It leaves the start heading straight down, circles clockwise, and crosses the $\theta$-axis vertically each half turn (the red dot on the left is $-0.0077$, at $6.41\,\mathrm{s}$), each crossing $0.077$ times the size of the one before.
:::

::: context saddle-picture The launch vehicle's saddle
The blue lines are the eigenvectors, $\dot{\theta} = \pm 1.41\,\theta$. Along the incoming one the state slides into the origin; along the outgoing one it rushes away. The grey curves are hyperbolas $\dot{\theta}^2 - 2\theta^2 = \pm 1$. Both axes use the same scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="180" y1="192" x2="180" y2="8" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="336" y="115" font-size="12" text-anchor="end" fill="#1f2a44">θ</text>
  <text x="186" y="18" font-size="12" fill="#1f2a44">θ̇</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" points="126.0,13.8 130.0,18.8 134.0,23.6 138.0,28.4 142.0,33.0 146.0,37.5 150.0,41.7 154.0,45.7 158.0,49.3 162.0,52.6 166.0,55.4 170.0,57.6 174.0,59.1 178.0,59.9 182.0,59.9 186.0,59.1 190.0,57.6 194.0,55.4 198.0,52.6 202.0,49.3 206.0,45.7 210.0,41.7 214.0,37.5 218.0,33.0 222.0,28.4 226.0,23.6 230.0,18.8 234.0,13.8"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" points="126.0,186.2 130.0,181.2 134.0,176.4 138.0,171.6 142.0,167.0 146.0,162.5 150.0,158.3 154.0,154.3 158.0,150.7 162.0,147.4 166.0,144.6 170.0,142.4 174.0,140.9 178.0,140.1 182.0,140.1 186.0,140.9 190.0,142.4 194.0,144.6 198.0,147.4 202.0,150.7 206.0,154.3 210.0,158.3 214.0,162.5 218.0,167.0 222.0,171.6 226.0,176.4 230.0,181.2 234.0,186.2"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" points="248.4,188.0 243.2,180.0 238.2,172.0 233.4,164.0 228.7,156.0 224.2,148.0 220.0,140.0 216.2,132.0 213.0,124.0 210.5,116.0 208.8,108.0 208.3,100.0 208.8,92.0 210.5,84.0 213.0,76.0 216.2,68.0 220.0,60.0 224.2,52.0 228.7,44.0 233.4,36.0 238.2,28.0 243.2,20.0 248.4,12.0"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" points="111.6,188.0 116.8,180.0 121.8,172.0 126.6,164.0 131.3,156.0 135.8,148.0 140.0,140.0 143.8,132.0 147.0,124.0 149.5,116.0 151.2,108.0 151.7,100.0 151.2,92.0 149.5,84.0 147.0,76.0 143.8,68.0 140.0,60.0 135.8,52.0 131.3,44.0 126.6,36.0 121.8,28.0 116.8,20.0 111.6,12.0"/>
  <line x1="117.8" y1="188.0" x2="242.2" y2="12.0" stroke="#b4232c" stroke-width="2"/>
  <line x1="117.8" y1="12.0" x2="242.2" y2="188.0" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="232.0,26.5 229.2,39.2 221.0,33.4" fill="#b4232c"/>
  <polygon points="204.0,133.9 215.0,140.8 206.8,146.6" fill="#1d6fd1"/>
  <polygon points="156.0,66.1 145.0,59.2 153.2,53.4" fill="#1d6fd1"/>
  <text x="250" y="30" font-size="11" fill="#b4232c">out: θ̇ = +1.41θ</text>
  <text x="250" y="182" font-size="11" fill="#1d6fd1">in: θ̇ = −1.41θ</text>
</svg>
```

The incoming blue line is the separatrix. Start a hair off it and the state eventually leaves along the red line.
:::

::: context gravity-gradient Satellites that hang like pendulums
A long satellite in orbit feels slightly stronger gravity at its low end than at its high end. That small difference makes it want to hang pointing at Earth, the way a pendulum hangs down. Push it and it rocks back and forth about the vertical instead of tumbling.

NASA's Long Duration Exposure Facility, a school-bus-sized satellite released in 1984, kept its orientation for nearly six years this way, with no thrusters or wheels for pointing. Many small satellites still use long booms for the same effect. Its phase portrait near the vertical is the pendulum's: a center, turned into a slow spiral by a little damping.
:::

::: context bang-bang Bang-bang control and the switching curve
Thrusters are usually either fully on or off. Control that slams between full one way and full the other is called **bang-bang** control. In the phase plane it is two parabolic arcs joined at a switch. This picture is the Check yourself problem: start at $y = 1$ at rest, thrust backward along the red arc, switch at $(0.5, -1)$, and ride the blue arc into the origin. The dashed curve is the rest of the switching parabola.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="80" y1="195" x2="80" y2="15" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="336" y="52" font-size="12" text-anchor="end" fill="#1f2a44">y</text>
  <text x="86" y="24" font-size="12" fill="#1f2a44">ẏ</text>
  <text x="180" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">0.5</text>
  <text x="280" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="74" y="164" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <line x1="180" y1="57" x2="180" y2="63" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="280" y1="57" x2="280" y2="63" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="77" y1="160" x2="83" y2="160" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4" points="249.0,190.0 236.2,185.0 224.0,180.0 212.2,175.0 201.0,170.0 190.2,165.0 180.0,160.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="280.0,60.0 279.8,65.0 279.0,70.0 277.8,75.0 276.0,80.0 273.8,85.0 271.0,90.0 267.8,95.0 264.0,100.0 259.8,105.0 255.0,110.0 249.8,115.0 244.0,120.0 237.8,125.0 231.0,130.0 223.8,135.0 216.0,140.0 207.7,145.0 199.0,150.0 189.8,155.0 180.0,160.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="180.0,160.0 170.2,155.0 161.0,150.0 152.2,145.0 144.0,140.0 136.2,135.0 129.0,130.0 122.2,125.0 116.0,120.0 110.3,115.0 105.0,110.0 100.2,105.0 96.0,100.0 92.2,95.0 89.0,90.0 86.2,85.0 84.0,80.0 82.2,75.0 81.0,70.0 80.2,65.0 80.0,60.0"/>
  <circle cx="280" cy="60" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="160" r="4" fill="#1f2a44"/>
  <text x="288" y="80" font-size="11" fill="#b4232c">u = −1</text>
  <text x="112" y="150" font-size="11" fill="#1d6fd1">u = +1</text>
  <text x="188" y="178" font-size="11" fill="#1f2a44">switch</text>
</svg>
```

The Apollo Lunar Module's digital autopilot fired its attitude thrusters using switching lines drawn in exactly this kind of phase plane.
:::
