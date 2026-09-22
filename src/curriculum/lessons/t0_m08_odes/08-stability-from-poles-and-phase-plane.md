---
id: l08-stability-from-poles-and-phase-plane
title: Stability from pole locations, and the phase plane
minutes: 24
covers:
  - stability from pole locations
  - phase-plane basics
---

Every response in this module has been a sum of modes $e^{pt}$, one per pole $p$. Whether a mode grows or dies is decided by one number, the real part of $p$, and so whether a *system* is stable is decided by where its poles sit in the complex plane. That single geometric test — all poles strictly to the left of the imaginary axis — is the most important fact in this module and the one the control track will use in every lesson. It is also the reason lesson 4 introduced the eigenvalues of $\mathbf{A}$ and lesson 7 the roots of $1 + GH$: both are ways of computing the poles you then test.

The test has edges, and the edges matter on a vehicle. A pole exactly on the imaginary axis is neither stable nor unstable in the everyday sense: an undamped bending mode rings forever, a rigid body with no attitude feedback holds whatever attitude it is given. A launch vehicle with its centre of pressure ahead of its centre of mass has a pole in the right half plane before any control is applied, and its attitude error doubles every half second; the controller's first job is to move that pole across the axis. A slow actuator can push a closed loop's poles the other way, from stable to unstable, without any parameter of the plant changing.

The second half of the lesson looks at the same second-order systems from a different angle: instead of plotting $y$ against $t$, plot the state $(\,y, \dot{y}\,)$ as a curve in the **phase plane**. Stable poles become spirals or curves running into the origin, a pole pair on the axis becomes a closed loop, a real pole in the right half plane becomes a saddle. The picture makes stability visible, extends to nonlinear systems that have no poles at all, and is the natural setting for the bang-bang and limit-cycle behaviour you will meet in attitude control.

## What stability means

Consider an LTI system with all inputs zero, released from an initial state. It is **asymptotically stable** if the state returns to zero from every initial condition, **marginally stable** (or neutrally stable) if it stays bounded but does not return to zero for some initial conditions, and **unstable** if it grows without bound from some initial condition. There is a second, input–output notion: a system is **BIBO stable** (bounded input, bounded output) if every bounded input produces a bounded output. For the systems in this module the two agree in the only case you need — asymptotic stability implies BIBO stability, and the marginal case fails BIBO, as shown below.

The free response is $\sum_i c_i e^{p_it}$ for distinct poles, with $t^ke^{pt}$ terms for a pole repeated $k + 1$ times. Write $p = \sigma + j\omega$; then $|e^{pt}| = e^{\sigma t}$, so each mode's magnitude is governed by the real part alone:

- $\sigma < 0$: the mode decays to zero, with time constant $1/|\sigma|$, whether or not it oscillates;
- $\sigma > 0$: the mode grows without bound, doubling every $\ln 2/\sigma$ seconds;
- $\sigma = 0$: the mode neither grows nor decays — a constant ($\omega = 0$) or a sustained oscillation ($\omega \ne 0$) — *if the pole is simple*. A repeated pole on the axis brings a factor $t$, and $t$ or $t\sin\omega t$ grows.

Since the free response is a sum of modes and the coefficients $c_i$ can be made nonzero by a suitable initial condition, the system's stability is the worst case over its poles:

::: key
Stability of a continuous-time LTI system from its poles (eigenvalues of $\mathbf{A}$, roots of the characteristic polynomial): **asymptotically stable if and only if every pole has $\operatorname{Re}s < 0$** — all poles strictly inside the open left half plane. If any pole has $\operatorname{Re}s > 0$ the system is unstable. Poles exactly on the imaginary axis ($\operatorname{Re}s = 0$) give marginal stability when they are simple and instability when they are repeated. Zeros have no effect on stability.
:::

The words "strictly" and "open" are load-bearing. The boundary $\operatorname{Re}s = 0$ is not stable: a pole at $-10^{-6}$ is stable with a time constant of eleven days, a pole at $0$ is marginal, a pole at $+10^{-6}$ is unstable, and the three are indistinguishable on any plot. In practice a designer requires a margin — every pole to the left of some line $\operatorname{Re}s = -\sigma_{\min}$, or inside some damping-ratio ray — and the control track quantifies those margins.

Three familiar systems sit on the axis. The integrator $1/s$ has a simple pole at the origin: released with an initial value it holds it forever, bounded but not returning to zero — marginally stable. The undamped oscillator $\omega_n^2/(s^2 + \omega_n^2)$, poles $\pm j\omega_n$, rings at constant amplitude — marginally stable. The rigid body $1/(Is^2)$ has a *double* pole at the origin, modes $1$ and $t$: give it a rate and its attitude grows linearly forever — unstable, in the strict sense, even though nothing is blowing up exponentially. Every spacecraft is unstable in this sense until its attitude loop is closed.

The marginal case also fails the input–output test. Drive the undamped oscillator with $\cos\omega_n t$, a bounded input, and lesson 5 showed the output $(A\omega_n t/2)\sin\omega_n t$ grows without bound. Drive the integrator with a unit step and the output is a ramp. Both have poles on the axis; neither is BIBO stable. Asymptotic stability, by contrast, guarantees a bounded output for any bounded input, because the impulse response is then absolutely integrable — $\int_0^\infty|h|\,dt < \infty$ — and the convolution $|y| \le \max|u|\int_0^\infty|h|\,dt$ is bounded.

::: warning
Do not confuse a *pole* at $s = 0$ with a *zero* at $s = 0$, and do not let a zero in the right half plane tempt you into calling a system unstable. $G(s) = (s - 3)/(s^2 + 3s + 2)$ has poles at $-1$ and $-2$ and is perfectly stable; its right-half-plane zero makes the step response start off in the wrong direction, an inconvenience for control but not an instability. Stability is a property of the denominator alone.
:::

## Reading relative stability off a pole map

Beyond yes or no, the pole map tells you *how* stable. Distance from the imaginary axis is the decay rate: a pole at $\operatorname{Re}s = -\sigma$ contributes a mode that has fallen to 2% after $4/\sigma$ seconds, which is lesson 3's settling time. Angle from the negative real axis is the damping ratio, $\zeta = \cos\theta$, and a pole that drifts toward the axis along a circle of constant $\omega_n$ loses damping before it loses stability. Poles far to the left die quickly and are usually ignored; the **dominant poles** are those nearest the axis, because after a short time they are all that is left of the response.

The satellite loop with a $0.05\,\mathrm{s}$ wheel lag (lessons 4 and 7) has poles at $-19.2$ and $-0.406 \pm 0.502j$. After half a second the fast mode has decayed by $e^{-9.6} = 7 \times 10^{-5}$ while the slow pair has decayed by only $e^{-0.2} = 0.82$. The loop is, for every practical purpose, the second-order system of its dominant pair, and its overshoot and settling time are read from that pair alone: $\zeta = 0.63$, about 8% overshoot, $t_s \approx 4/0.406 = 9.9\,\mathrm{s}$.

### A quick test without finding the roots

For low-order polynomials you can decide stability without solving. For $s^2 + a_1s + a_0$ the roots have negative real parts if and only if $a_1 > 0$ and $a_0 > 0$: the sum of the roots is $-a_1$ and their product $a_0$, and two numbers (or a conjugate pair) with negative real parts have negative sum and positive product, and conversely. For the cubic $a_3s^3 + a_2s^2 + a_1s + a_0$ with $a_3 > 0$, all roots lie in the left half plane if and only if

$$
a_2 > 0, \quad a_1 > 0, \quad a_0 > 0 \quad\text{and}\quad a_2a_1 > a_3a_0.
$$

Positive coefficients are necessary at any order (a polynomial with all roots in the left half plane is a product of factors $(s + a)$ and $(s^2 + 2\zeta\omega_ns + \omega_n^2)$ with positive coefficients) but not sufficient beyond second order: the extra inequality is the cubic case of the **Routh–Hurwitz criterion**, which the control track develops in general. At the boundary $a_2a_1 = a_3a_0$ the cubic has a pair of poles exactly on the imaginary axis at $\omega = \sqrt{a_0/a_2}$, and the system oscillates at that frequency without decay.

::: key
Second order $s^2 + a_1s + a_0$: stable iff $a_1 > 0$ and $a_0 > 0$. Third order $a_3s^3 + a_2s^2 + a_1s + a_0$ ($a_3 > 0$): stable iff all coefficients are positive and $a_2a_1 > a_3a_0$; at equality a pole pair sits on the axis at $\omega = \sqrt{a_0/a_2}$. Positive coefficients are necessary at every order, sufficient only up to second.
:::

::: example A slow actuator destabilises the satellite loop
Lesson 7 found the characteristic polynomial of the PD satellite ($I = 50\,\mathrm{kg\,m^2}$, $K_p = 20$, $K_d = 40$) with a wheel lag $\tau$ to be $50\tau s^3 + 50s^2 + 40s + 20$. All four coefficients are positive for any $\tau > 0$, so the cubic test reduces to $a_2a_1 > a_3a_0$: $50 \times 40 > 50\tau \times 20$, i.e. $\tau < 2\,\mathrm{s}$. The plant and the gains have not changed; only the actuator's speed decides whether the loop is stable. Solving the cubic numerically confirms the picture:

| $\tau$ (s) | Real pole | Complex pair | $\zeta$ of the pair | Verdict |
| --- | --- | --- | --- | --- |
| 0.05 | $-19.2$ | $-0.406 \pm 0.502j$ | 0.63 | stable, actuator invisible |
| 0.5 | $-1.23$ | $-0.386 \pm 0.709j$ | 0.48 | stable, more overshoot |
| 1.0 | $-0.685$ | $-0.158 \pm 0.748j$ | 0.21 | stable, rings for $4/0.158 = 25\,\mathrm{s}$ |
| 2.0 | $-0.500$ | $\pm 0.632j$ | 0 | marginal: sustained oscillation at $0.632\,\mathrm{rad/s}$ |
| 3.0 | $-0.432$ | $+0.049 \pm 0.554j$ | — | unstable, amplitude doubles every $14\,\mathrm{s}$ |

The boundary frequency agrees with $\sqrt{a_0/a_2} = \sqrt{20/50} = 0.632\,\mathrm{rad/s}$, a period of $9.9\,\mathrm{s}$. The mechanism is phase: the lag delays the corrective torque, and once the delay is a large fraction of the loop's period the "damping" torque arrives late enough to add energy instead of removing it.
:::

::: example A statically unstable launch vehicle
For a launch vehicle whose centre of pressure is ahead of its centre of mass, an angle of attack produces a pitching moment that *increases* it. About a trim point, with the angle of attack equal to the pitch error $\theta$ in still air, the rigid-body pitch dynamics are

$$
\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta,
$$

with $\mu_\alpha > 0$ the aerodynamic instability coefficient and $\mu_\delta$ the control effectiveness of the nozzle deflection $\delta$. Take $\mu_\alpha = 2\,\mathrm{s^{-2}}$ and $\mu_\delta = 4\,\mathrm{s^{-2}/rad}$, representative of a mid-sized vehicle near maximum dynamic pressure. Open loop ($\delta = 0$) the characteristic equation is $s^2 - 2 = 0$: poles at $s = \pm\sqrt{2} = \pm 1.41\,\mathrm{s^{-1}}$, one of them in the right half plane. Released from a $1^\circ$ error at rest, $\theta = \cosh(1.41t)$ degrees: $2.2^\circ$ after one second, $8.5^\circ$ after two, $35^\circ$ after three. The e-folding time is $1/1.41 = 0.71\,\mathrm{s}$ and the doubling time $\ln 2/1.41 = 0.49\,\mathrm{s}$.

Close a PD loop, $\delta = -(K_p\theta + K_d\dot{\theta})$:

$$
s^2 + \mu_\delta K_d\,s + (\mu_\delta K_p - \mu_\alpha) = 0.
$$

Both coefficients must be positive. The damping condition $K_d > 0$ is easy; the stiffness condition $K_p > \mu_\alpha/\mu_\delta = 0.5\,\mathrm{rad/rad}$ says the control torque per radian of error must exceed the aerodynamic torque per radian just to hold the pole at the origin. With $K_p = 0.4$ and $K_d = 1$ the polynomial is $s^2 + 4s - 0.4$, roots $+0.098$ and $-4.10$: still unstable, now slowly. With $K_p = 0.5$ exactly, a pole sits at $s = 0$ — marginal, the vehicle holds any attitude error it acquires. With $K_p = 2$ and $K_d = 1$: $s^2 + 4s + 6$, poles $-2 \pm 1.41j$, $\omega_n = 2.45\,\mathrm{rad/s}$, $\zeta = 0.82$, and the vehicle is stable with a $2\,\mathrm{s}$ settling time. The right-half-plane pole has been moved across the axis by feedback alone; that crossing, and the margin by which it is achieved through the whole flight as $\mu_\alpha$ changes, is the launch-vehicle autopilot's central problem.
:::

::: note
Discrete-time systems have the same theorem in a different shape. Lesson 4 showed that the exact discretisation $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ has eigenvalues $e^{p_i\Delta t}$, and $|e^{p\Delta t}| < 1$ exactly when $\operatorname{Re}p < 0$. So the left half plane maps to the interior of the unit circle, the imaginary axis to the circle itself, and a discrete-time system is asymptotically stable if and only if all eigenvalues of $\boldsymbol{\Phi}$ have modulus less than one. A flight computer's loop is judged by that criterion.
:::

## The phase plane

Take a second-order system and, instead of plotting $y(t)$, plot the point $(x_1, x_2) = (y, \dot{y})$ and watch it move. The plane of $(y, \dot{y})$ is the **phase plane**; the curve the point traces is a **trajectory**; the whole family of trajectories, one through every starting point, is the **phase portrait**. Time is not an axis — it is the parameter along each curve, marked by arrows. Because a second-order ODE has a unique solution through each state, trajectories never cross, and the portrait is a complete map of everything the system can do from anywhere.

Two facts orient the picture for any system of the form $\dot{x}_1 = x_2$, $\dot{x}_2 = f(x_1, x_2)$. In the upper half plane $x_2 = \dot{y} > 0$, so $y$ is increasing and trajectories move to the right; in the lower half they move left. A trajectory therefore circulates clockwise around the origin. And it crosses the horizontal axis ($x_2 = 0$) vertically, because there $\dot{x}_1 = 0$ while $\dot{x}_2 = f(x_1, 0)$ is generally not. Points where both $\dot{x}_1$ and $\dot{x}_2$ vanish are **equilibria**: the system placed there stays there. For a linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with $\mathbf{A}$ invertible the only equilibrium is the origin.

### The linear portraits and the eigenvalues

For $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ the trajectory from $\mathbf{x}(0)$ is $e^{\mathbf{A}t}\mathbf{x}(0)$, and the shape of the portrait is fixed by the eigenvalues of $\mathbf{A}$ — the poles. For the companion form $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -a_0 & -a_1 \end{bmatrix}$ the eigenvalues solve $s^2 + a_1s + a_0 = 0$, with sum $-a_1 = \operatorname{tr}\mathbf{A}$ and product $a_0 = \det\mathbf{A}$. Six portraits cover every case:

| Eigenvalues | $\det\mathbf{A}$, $\operatorname{tr}\mathbf{A}$ | Portrait | Stability |
| --- | --- | --- | --- |
| complex, $\operatorname{Re} < 0$ | $\det > 0$, $\operatorname{tr} < 0$, $\operatorname{tr}^2 < 4\det$ | **stable spiral** (focus) into the origin | asymptotically stable |
| real, both negative | $\det > 0$, $\operatorname{tr} < 0$, $\operatorname{tr}^2 \ge 4\det$ | **stable node**: curves run in, tangent to the slow eigenvector | asymptotically stable |
| purely imaginary | $\det > 0$, $\operatorname{tr} = 0$ | **centre**: closed ellipses | marginal |
| complex, $\operatorname{Re} > 0$ | $\det > 0$, $\operatorname{tr} > 0$, $\operatorname{tr}^2 < 4\det$ | **unstable spiral** outward | unstable |
| real, both positive | $\det > 0$, $\operatorname{tr} > 0$, $\operatorname{tr}^2 \ge 4\det$ | **unstable node** | unstable |
| real, opposite signs | $\det < 0$ | **saddle**: in along one eigenvector, out along the other | unstable |

The eigenvectors are the straight-line trajectories: along an eigenvector $\mathbf{v}$ the motion is $\mathbf{v}e^{\lambda t}$, toward the origin if $\lambda < 0$ and away if $\lambda > 0$. In a saddle the incoming eigenvector is the only route to the origin, and every other trajectory eventually leaves along the outgoing one; that incoming line is the **separatrix** dividing the portrait into regions of qualitatively different fate.

::: key
Phase plane: the plane of $(y, \dot{y})$; a trajectory is the state's path, circulating clockwise and crossing the $y$-axis vertically. Linear portraits by eigenvalue: complex left-half-plane pair → stable spiral; real negative → stable node; imaginary pair → centre (closed orbits); right-half-plane → unstable spiral or node; real pair of opposite sign → saddle, with the eigenvectors as the straight-line trajectories. For a $2 \times 2$ matrix, $\det\mathbf{A} < 0$ means saddle; $\det > 0$ with $\operatorname{tr}\mathbf{A} < 0$ means stable, oscillatory when $\operatorname{tr}^2 < 4\det$.
:::

Three portraits from this module, with numbers. The **undamped oscillator** $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_n^2 & 0 \end{bmatrix}$ has $\operatorname{tr} = 0$: a centre. Lesson 4 found $e^{\mathbf{A}t}$ to be a rotation in the coordinates $(y, \dot{y}/\omega_n)$, so in those coordinates the trajectories are circles and in $(y, \dot{y})$ they are ellipses $\omega_n^2y^2 + \dot{y}^2 = \mathrm{const}$ — conservation of energy drawn as a curve. The **PD satellite**, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -0.4 & -0.8 \end{bmatrix}$, has $\operatorname{tr} = -0.8$, $\det = 0.4$ and $\operatorname{tr}^2 - 4\det = -0.96 < 0$: a stable spiral, drawn in the example below. The **open-loop launch vehicle**, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 2 & 0 \end{bmatrix}$, has $\det = -2$: a saddle, with eigenvalues $\pm 1.41$ and eigenvectors $[1, \pm 1.41]^T$. A vehicle released with $\dot{\theta} = -1.41\theta$ exactly — moving toward zero at precisely the right rate — would slide into the origin along the incoming eigenvector; released with any other rate it departs along the outgoing one, $\dot{\theta} = +1.41\theta$, tumbling in whichever direction the initial state put it. The trajectories are the hyperbolas $\dot{\theta}^2 - 2\theta^2 = \mathrm{const}$, which follow from $\ddot{\theta} = 2\theta$ by multiplying by $\dot{\theta}$ and integrating.

::: example The satellite's spiral, step by step
Release the PD satellite from $\theta = 0.1\,\mathrm{rad}$ at rest: $\mathbf{x}(0) = [0.1, 0]^T$, a point on the positive $\theta$-axis. Using $e^{\mathbf{A}t}$ from lesson 4 with $\sigma = 0.4$ and $\omega_d = 0.490$, the state at successive times is

| $t$ (s) | 0 | 1 | 2 | 3 | 4 | 5 | 6.41 | 8 | 12.8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $\theta$ (rad) | 0.100 | 0.085 | 0.056 | 0.028 | 0.008 | $-0.003$ | $-0.0077$ | $-0.005$ | 0.0006 |
| $\dot{\theta}$ (rad/s) | 0 | $-0.026$ | $-0.031$ | $-0.025$ | $-0.015$ | $-0.007$ | 0 | 0.002 | 0 |

The point leaves the axis vertically downward (the torque is negative, the rate becomes negative), swings clockwise through the lower half plane with its most negative rate $-0.031\,\mathrm{rad/s}$ at $t = 1.8\,\mathrm{s}$, crosses the negative $\theta$-axis vertically at $t = \pi/\omega_d = 6.41\,\mathrm{s}$ — half a ringing period — at $\theta = -0.0077\,\mathrm{rad}$, and returns to the positive axis at $12.8\,\mathrm{s}$ at $0.0006\,\mathrm{rad}$. Each half turn shrinks the radius by $e^{-\sigma\pi/\omega_d} = e^{-2.57} = 0.077$: a spiral whose successive axis crossings are $0.1$, $-0.0077$, $0.0006$, … The spiral's tightness is $\zeta$: with $\zeta = 0.63$ the trajectory makes less than one full turn before it is within 1% of the origin, whereas the bending mode of lesson 3, with $\zeta = 0.005$, would circle some thirty times and look like a centre to the eye. In the phase plane, damping ratio is how fast the spiral winds in per turn, and natural frequency is how fast the point moves along it.
:::

### Beyond the linear case

The phase plane is most useful where transfer functions stop working. A **nonlinear** second-order system $\ddot{y} = f(y, \dot{y})$ has a portrait too, generally with several equilibria, and near each equilibrium the portrait looks like that of the **linearisation** — the matrix of partial derivatives of $f$ evaluated there. The pendulum $\ddot{\theta} + \omega_0^2\sin\theta = 0$ with $\omega_0 = \sqrt{g/L} = 3.13\,\mathrm{rad/s}$ for $L = 1\,\mathrm{m}$ has equilibria at $\theta = 0$ (hanging) and $\theta = \pi$ (inverted). Linearising, $\sin\theta \approx \theta$ near zero gives $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_0^2 & 0 \end{bmatrix}$, a centre; near $\pi$, $\sin\theta \approx -(\theta - \pi)$ gives $\begin{bmatrix} 0 & 1 \\ \omega_0^2 & 0 \end{bmatrix}$, a saddle with eigenvalues $\pm 3.13\,\mathrm{s^{-1}}$. The full portrait stitches these together: closed orbits around the bottom for small energies, saddles at $\pm\pi$, and the separatrix between swinging and tumbling, obtained from energy, $\tfrac{1}{2}\dot{\theta}^2 - \omega_0^2\cos\theta = \omega_0^2$, which passes through the bottom at $\dot{\theta} = 2\omega_0 = 6.26\,\mathrm{rad/s}$. Add a little damping and the centres become spirals while the saddles stay saddles — a gravity-gradient-stabilised satellite is exactly this system, librating about the local vertical.

The other indispensable nonlinear portrait is the **double integrator with bounded control**, $\ddot{y} = u$ with $|u| \le u_{\max}$, the model of any thruster-controlled spacecraft. For constant $u$, multiply $\ddot{y} = u$ by $\dot{y}$ and integrate: $\tfrac{1}{2}\dot{y}^2 = uy + \mathrm{const}$, so the trajectories are parabolas opening to the right for $u > 0$ and to the left for $u < 0$. A time-optimal manoeuvre is two parabolic arcs — full thrust one way, then full thrust the other, switching on the one parabola that passes through the origin — and the phase plane is where that switching curve is drawn.

::: warning
A phase portrait shows *where* the state goes, not *when*. Two trajectories that look identical can be traversed at very different speeds — the satellite with $\omega_n$ doubled draws the same spiral in half the time — and a trajectory that seems to arrive at the origin may be approaching it ever more slowly along a slow eigenvector.
:::

## Check yourself

::: check
Without solving, decide whether each characteristic polynomial describes a stable system: (a) $s^3 + 2s^2 + 3s + 10$; (b) $s^3 + 4s^2 + 5s + 2$; (c) $s^4 + 2s^2 + 1$.
:::

::: answer
(a) All coefficients positive, but $a_2a_1 = 2 \times 3 = 6$ is less than $a_3a_0 = 10$: unstable. The roots are $-2.45$ and $+0.223 \pm 2.01j$, a growing oscillation. (b) All positive and $4 \times 5 = 20 > 2$: stable; it factors as $(s + 1)^2(s + 2)$. (c) The $s^3$ and $s$ coefficients are zero, so a necessary condition fails; indeed $s^4 + 2s^2 + 1 = (s^2 + 1)^2$, a *repeated* pair on the imaginary axis, whose modes include $t\sin t$. Unstable — not marginal, because the axis poles are not simple.
:::

::: check
A plant $1/(s(s + 2)(s + 5))$ is under unity feedback with gain $K$. For what range of $K$ is the loop stable, at what frequency does it oscillate at the boundary, and where are the poles for $K = 100$?
:::

::: answer
The closed-loop characteristic polynomial is $s(s + 2)(s + 5) + K = s^3 + 7s^2 + 10s + K$. Stability needs $K > 0$ and $7 \times 10 > K$, so $0 < K < 70$. At $K = 70$ the axis poles are at $\pm j\sqrt{K/7} = \pm j\sqrt{10} = \pm 3.16j$, a sustained oscillation at $3.16\,\mathrm{rad/s}$ (the third pole is at $-7$). At $K = 100$ the roots are $-7.46$ and $+0.229 \pm 3.65j$: unstable, with the oscillation's amplitude growing by $e^{0.229 \times 2\pi/3.65} = 1.48$ per cycle.
:::

::: check
Classify the phase portrait of each system and state its stability: $\mathbf{A}_1 = \begin{bmatrix} 0 & 1 \\ -9 & 0 \end{bmatrix}$, $\mathbf{A}_2 = \begin{bmatrix} 0 & 1 \\ -9 & -6 \end{bmatrix}$, $\mathbf{A}_3 = \begin{bmatrix} 0 & 1 \\ 9 & 0 \end{bmatrix}$, $\mathbf{A}_4 = \begin{bmatrix} 0 & 1 \\ -9 & 2 \end{bmatrix}$.
:::

::: answer
$\mathbf{A}_1$: $\operatorname{tr} = 0$, $\det = 9$; eigenvalues $\pm 3j$; a centre, marginally stable, ellipses $9y^2 + \dot{y}^2 = \mathrm{const}$. $\mathbf{A}_2$: $\operatorname{tr} = -6$, $\det = 9$, $\operatorname{tr}^2 - 4\det = 0$; a repeated eigenvalue $-3$; a stable (degenerate) node, critically damped, asymptotically stable. $\mathbf{A}_3$: $\det = -9$; eigenvalues $\pm 3$; a saddle, unstable, with eigenvectors $[1, \pm 3]^T$. $\mathbf{A}_4$: $\operatorname{tr} = +2$, $\det = 9$, $\operatorname{tr}^2 - 4\det = -32 < 0$; eigenvalues $1 \pm 2.83j$; an unstable spiral. Only $\mathbf{A}_2$ has all poles strictly in the left half plane.
:::

::: check
Why is a rigid body with no attitude feedback classed as unstable rather than marginally stable, when nothing about it grows exponentially?
:::

::: answer
Its transfer function $1/(Is^2)$ has a double pole at $s = 0$. A simple pole on the axis gives a mode $e^{0t} = 1$, bounded; a repeated one adds the mode $t$, which is unbounded. Physically, any nonzero initial rate makes the attitude grow linearly forever. "Unstable" means the state leaves every bound from some initial condition, and linear growth does that; exponential growth is not required. The undamped oscillator's simple pair $\pm j\omega_n$, by contrast, is marginal: bounded for every initial condition.
:::

::: check
A spacecraft modelled as $\ddot{y} = u$ with $|u| \le 1$ starts at $y = 1$, $\dot{y} = 0$ and must reach the origin at rest as fast as possible. Using phase-plane parabolas, describe the trajectory and find the switching point and total time.
:::

::: answer
Apply $u = -1$ first: the trajectory is the leftward-opening parabola $\dot{y}^2 = 2(1 - y)$ through the start, on which $y = 1 - t^2/2$ and $\dot{y} = -t$. The only $u = +1$ trajectory that reaches the origin at rest is $\dot{y}^2 = 2y$ with $\dot{y} < 0$ (from $\tfrac{1}{2}\dot{y}^2 = y + \mathrm{const}$ with the constant zero). The two parabolas meet where $2(1 - y) = 2y$, i.e. $y = 0.5$, $\dot{y} = -1$, reached at $t = 1\,\mathrm{s}$. Switch to $u = +1$ there: $\dot{y} = -1 + (t - 1)$ and $y = 0.5 - (t - 1) + (t - 1)^2/2$, which reach $\dot{y} = 0$ and $y = 0$ together at $t = 2\,\mathrm{s}$. Total time $2\,\mathrm{s}$; switching later (at $y = 0$, say) would overshoot to $y = -1$ before stopping.
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
| Phase plane $(y, \dot{y})$ | Trajectories circulate clockwise, cross the $y$-axis vertically, never intersect |
| spiral, node, centre, saddle | Portraits for complex, real-same-sign, imaginary and real-opposite-sign eigenvalues |
| $\det\mathbf{A} < 0$; $\det > 0$, $\operatorname{tr} < 0$ | Saddle; stable (spiral if $\operatorname{tr}^2 < 4\det$) |
| $\tfrac{1}{2}\dot{y}^2 = uy + \mathrm{const}$ | Double-integrator trajectories under constant control: parabolas |

This closes the module. The control track picks up every one of these tools: transfer functions and block algebra to build loops, pole locations to judge them, $\zeta$ and $\omega_n$ to specify them, the frequency response of lesson 5 to measure their margins, and the phase plane to handle the thrusters and saturations that no transfer function can describe.
