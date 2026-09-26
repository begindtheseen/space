---
id: l07-stiffness-backward-euler-bdf
title: Stiffness, backward Euler and BDF
minutes: 25
covers:
  - 'stiffness and implicit methods: backward Euler, BDF'
---

Imagine filming a snail crossing a garden path. It takes an hour. But a hummingbird hovers in the shot, and your camera has a strange rule: if anything moves too far between two frames, the film is ruined. So you shoot at the hummingbird's frame rate for the whole hour, although the bird leaves after two seconds and you only care about the snail.

That is **stiffness**. Put a reaction wheel into a spacecraft attitude simulation. The spacecraft answers a turn command in about a minute; the wheel's motor current settles in a millisecond. Add the motor and your RK4 integrator — happy at 10 Hz on the rigid body alone — must run at 400 Hz or it blows up. A mode that stopped mattering after a few milliseconds now sets the step for the whole 200-second run.

Stiffness is everywhere in GNC simulation: actuator loops inside vehicle dynamics, structural bending, propellant slosh, a small sensor bolted to a big radiator, chemistry in an engine. This lesson defines it, puts numbers on the step limit, builds backward Euler and the BDF methods that escape it, and then tackles the part people skip: an implicit method must solve an equation every step, and *how* you solve it decides whether it works at all.

## What stiffness is

A thin spoon in hot coffee heats up in seconds; the coffee cools over many minutes. Each has a **[[time constant|time-constant]]** $\tau$ ("tau"), the time to cover about 63% of the remaining gap. The two are far apart: that is stiffness.

In an ODE $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$, the time constants come from the **Jacobian** $\mathbf{J} = \partial\mathbf{f}/\partial\mathbf{y}$ — the matrix of slopes that says how each rate changes when each state changes. Near any point the system behaves like the linear system $\dot{\mathbf{y}} = \mathbf{J}\mathbf{y}$. Each eigenvalue $\lambda_i$ ("lambda sub i") of $\mathbf{J}$ is one **mode**, a pattern that grows or shrinks like $e^{\lambda_i t}$. A mode with $\lambda_i$ real and negative dies away with time constant $\tau_i = 1/|\lambda_i|$.

The **stiffness ratio** compares the fastest and slowest modes:

$$
S = \frac{\max_i |\mathrm{Re}\,\lambda_i|}{\min_i |\mathrm{Re}\,\lambda_i|} = \frac{\tau_{\text{slow}}}{\tau_{\text{fast}}} .
$$

Here $\mathrm{Re}\,\lambda$ means "the real part of lambda". A problem is stiff when $S$ is large *and* the stretch of time you care about, $T$, is long compared with $\tau_{\text{fast}}$. Both matter. A motor loop with $\tau = 1\,\mathrm{ms}$ is not stiff if you want its first 10 ms, and is stiff if you want 200 s. Stiffness belongs to the problem *and the question you ask of it*.

The symptom is unmistakable. An adaptive integrator takes tiny steps while the solution is smooth and flat. The controller is not asking for accuracy; it is forced down by rejected steps, because above a certain $h$ the fast mode's numerical copy grows and the error estimate explodes. If `solve_ivp` with `RK45` crawls where nothing happens, the problem is stiff and the method is wrong.

::: key Stiffness
An ODE is stiff when its Jacobian has eigenvalues with widely separated time constants and you must integrate over the slow one. An explicit method must then take steps set by the fastest decaying mode for *stability*, not accuracy — the fast mode has long since died physically, but its numerical image grows if $h|\lambda_{\text{fast}}|$ leaves the stability region. Use an implicit method instead: backward Euler, BDF, or an implicit Runge–Kutta method such as Radau.
:::

## The limit, in numbers

Take a single-axis attitude loop with a reaction wheel. The spacecraft has moment of inertia $I_s = 500\,\mathrm{kg\,m^2}$. The wheel motor has torque constant $K_t = 0.05\,\mathrm{N\,m/A}$ (amps of current in, torque out), winding **[[inductance|inductance]]** $L = 2\,\mathrm{mH}$ and resistance $R = 2\,\Omega$. So its electrical time constant is $L/R = 1\,\mathrm{ms}$. A rate feedback of gain $K = 400\,\mathrm{V}$ per $\mathrm{rad/s}$ sets the motor voltage. The state is $\mathbf{x} = (\omega_b, i)$: body rate $\omega_b$ in $\mathrm{rad/s}$ and motor current $i$ in amps.

$$
\dot{\omega}_b = -\frac{K_t}{I_s}\,i, \qquad
\frac{di}{dt} = \frac{K}{L}\,\omega_b - \frac{R}{L}\,i,
\qquad
\mathbf{A} = \begin{pmatrix} 0 & -10^{-4} \\ 2\times10^{5} & -10^{3}\end{pmatrix}.
$$

The entries: $K_t/I_s = 0.05/500 = 10^{-4}$, $K/L = 400/0.002 = 2\times10^5$ and $R/L = 2/0.002 = 1000$. For a $2\times2$ matrix the eigenvalues solve $\lambda^2 - (\mathrm{tr}\,\mathbf{A})\lambda + \det\mathbf{A} = 0$. The trace is $-1000$ and the determinant is $0 - (-10^{-4})(2\times10^5) = 20$, so $\lambda^2 + 1000\lambda + 20 = 0$:

$$
\lambda_{\text{slow}} = -0.02000, \quad \tau_{\text{slow}} = 50.0\,\mathrm{s};
\qquad
\lambda_{\text{fast}} = -999.98, \quad \tau_{\text{fast}} = 1.000\,\mathrm{ms} .
$$

So $S = 50{,}000$. We want the rate over 200 s; the current transient is over in 5 ms.

Recall from the Euler and Adams lessons: on $\dot y = \lambda y$, each step multiplies $y$ by an **amplification factor** $R(z)$, with $z = h\lambda$. The method is stable where $|R(z)| \le 1$, its **[[stability region|stability-region]]**. Along the negative real axis, explicit Euler is stable for $z \in (-2, 0)$, RK4 for $(-2.785, 0)$ and AB4 for $(-0.3, 0)$. Divide each limit by $|\lambda_{\text{fast}}| = 999.98\,\mathrm{s^{-1}}$ to get the largest step:

| Method | largest step | steps for 200 s | evaluations of $\mathbf{f}$ |
| --- | --- | --- | --- |
| Explicit Euler | $2.000\,\mathrm{ms}$ | about 100,000 | about 100,000 |
| RK4 | $2.785\,\mathrm{ms}$ | about 71,800 | about 287,000 |
| AB4 | $0.300\,\mathrm{ms}$ | about 667,000 | about 667,000 |
| Backward Euler, $h = 1\,\mathrm{s}$ | unlimited | 200 | 200 solves |

Nothing in that table is about accuracy: RK4 follows the slow mode to far more digits than anyone wants. And AB4, the Adams lesson's winner on cost, is now the *worst*, because its stability interval is nine times shorter than RK4's.

::: example Explicit Euler crossing the line
Start from $\omega_b = 10^{-3}\,\mathrm{rad/s}$, $i = 0$ and run explicit Euler for about 0.1 s. The exact answer at $t = 0.1\,\mathrm{s}$ is $\omega_b = 9.98022\times10^{-4}\,\mathrm{rad/s}$, $i = 0.199608\,\mathrm{A}$; the fast transient died a hundred time constants ago. Here is the current at the step nearest 0.1 s, and its spread over the last 20 steps:

| $h$ | $h\lvert\lambda_{\text{fast}}\rvert$ | $i$ near $t = 0.1\,\mathrm{s}$ | range of $i$, last 20 steps |
| --- | --- | --- | --- |
| $1.50\,\mathrm{ms}$ | 1.500 | $0.19961\,\mathrm{A}$ | $0.19961$ to $0.19972$ |
| $1.90\,\mathrm{ms}$ | 1.900 | $0.20036\,\mathrm{A}$ | $0.19419$ to $0.20474$ |
| $2.00\,\mathrm{ms}$ | 2.000 | $0.0\,\mathrm{A}$ | $0$ to $0.39952$ |
| $2.10\,\mathrm{ms}$ | 2.100 | $-19.17\,\mathrm{A}$ | $-19.17$ to $17.81$ |
| $2.50\,\mathrm{ms}$ | 2.500 | $-2.2\times10^{6}\,\mathrm{A}$ | about $\pm 2\times10^{6}$ |
| $3.00\,\mathrm{ms}$ | 3.000 | $1.7\times10^{9}\,\mathrm{A}$ | $-0.86\times10^{9}$ to $1.7\times10^{9}$ |

At $h = 1.5\,\mathrm{ms}$ the answer is right to five digits. At exactly $h\lambda = -2$ the fast mode's factor is $1 + h\lambda = -1$, so the current flips between 0 and $0.4\,\mathrm{A}$ forever. Make the step 5% bigger and the answer is off by a factor of a hundred, with the wrong sign.

Does that make sense? At $h = 2.1\,\mathrm{ms}$, $|1 + h\lambda| = 1.1$, and 48 steps of growth by 1.1 is $1.1^{48} \approx 97$. Yes. The failure is a cliff, and where it sits has nothing to do with accuracy.
:::

## Backward Euler

Explicit Euler uses the slope at the *start* of the step. **Backward Euler** uses the slope at the *end*:

$$
\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}(t_{n+1}, \mathbf{y}_{n+1}) .
$$

The unknown $\mathbf{y}_{n+1}$ is on both sides, so you must *solve* for it: the method is **implicit**. It is AM1 from the Adams lesson, with local error $-\tfrac12 h^2 y''$ and global error $O(h)$ — first order, like explicit Euler, opposite sign.

On $\dot y = \lambda y$ with $z = h\lambda$, the step reads $y_{n+1} = y_n + z\,y_{n+1}$. Move the $y_{n+1}$ terms together, $(1 - z)\,y_{n+1} = y_n$, and divide:

$$
y_{n+1} = R(z)\,y_n, \qquad R(z) = \frac{1}{1 - z} .
$$

If $\mathrm{Re}\,z < 0$, then $1 - z$ has real part bigger than 1, so $|1 - z| > 1$ and $|R(z)| < 1$. It is stable for *every* step on *every* decaying mode:

> A method is **A-stable** when its stability region contains the whole left half plane: every mode that decays in the true solution also decays in the numerical one, at any $h$.

There is more. As $z \to -\infty$, $R(z) \to 0$: the faster a mode, the harder it is crushed. A method with $R(-\infty) = 0$ is **L-stable**. That is what you want on a stiff problem, because it copies the physics — the fast transient really vanishes — instead of merely not growing.

::: example Backward Euler and trapezoidal on the stiff system
Run the reaction-wheel system for 200 s. The exact body rate at $t = 200\,\mathrm{s}$ is $\omega_b = 1.831454\times10^{-5}\,\mathrm{rad/s}$. The trapezoidal rule, AM2, appears in the next section; here are both.

| Step | Backward Euler $\omega_b$ | relative error | Trapezoidal $\omega_b$ | relative error |
| --- | --- | --- | --- | --- |
| $0.1\,\mathrm{s}$ | $1.838785\times10^{-5}$ | $4.00\times10^{-3}$ | $1.831452\times10^{-5}$ | $1.3\times10^{-6}$ |
| $0.5\,\mathrm{s}$ | $1.868206\times10^{-5}$ | $2.01\times10^{-2}$ | $1.831311\times10^{-5}$ | $7.8\times10^{-5}$ |
| $1.0\,\mathrm{s}$ | $1.905199\times10^{-5}$ | $4.03\times10^{-2}$ | $1.830311\times10^{-5}$ | $6.2\times10^{-4}$ |
| $5.0\,\mathrm{s}$ | $2.209376\times10^{-5}$ | $2.06\times10^{-1}$ | $1.823413\times10^{-5}$ | $4.4\times10^{-3}$ |

At $h = 1\,\mathrm{s}$ — a thousand fast time constants per step — both give a usable answer in 200 steps, against RK4's 287,000 evaluations. Backward Euler's error halves when the step halves (first order). Trapezoidal's falls about four times per halving (second order), and at $h = 1\,\mathrm{s}$ it is $4.03\times10^{-2} / 6.2\times10^{-4} \approx 65$ times smaller. Neither ever goes unstable.
:::

## Trapezoidal: A-stable is not enough

The **trapezoidal rule**, AM2, averages the slopes at both ends: $\mathbf{y}_{n+1} = \mathbf{y}_n + \tfrac{h}{2}(\mathbf{f}_{n+1} + \mathbf{f}_n)$. On the test equation, $y_{n+1}(1 - z/2) = y_n(1 + z/2)$, so

$$
R(z) = \frac{1 + z/2}{1 - z/2}.
$$

For $\mathrm{Re}\,z < 0$ the top is closer to zero than the bottom, so $|R| < 1$: A-stable, and second order. That is the best pairing any linear multistep method can have. But look at the far end: as $z \to -\infty$, $R(z) \to -1$. A very fast mode is not damped. It is *flipped in sign* every step, and shrinks only slowly.

::: example Ringing
Take $\dot y = -1000\,y$, $y_0 = 1$, $h = 0.1\,\mathrm{s}$, so $z = -100$. The exact solution at $t = 0.1\,\mathrm{s}$ is $e^{-100} = 3.7\times10^{-44}$ — zero for any engineering purpose.

| step | backward Euler | trapezoidal |
| --- | --- | --- |
| 1 | $9.901\times10^{-3}$ | $-0.960784$ |
| 2 | $9.803\times10^{-5}$ | $+0.923106$ |
| 3 | $9.706\times10^{-7}$ | $-0.886906$ |
| 5 | $9.515\times10^{-11}$ | $-0.818709$ |
| 10 | $9.053\times10^{-21}$ | $+0.670284$ |
| 50 | — | $+0.135299$ |
| 200 | — | $+0.000335$ |

Backward Euler's factor is $1/(1 + 100) = 1/101 = 0.00990$, so the transient is gone in three steps. Trapezoidal's is $(1 - 50)/(1 + 50) = -49/51 = -0.9608$. To fall by a factor of $10^6$ takes $\ln(10^{-6})/\ln(0.9608) \approx 345$ steps, and all that while it flips sign every step at nearly full size.

In a vehicle simulation this is a clean oscillation at exactly **[[half the frame rate|half-frame-rate]]** on a signal that should be flat, routinely mistaken for actuator chatter or a control instability.
:::

So: A-stability keeps you from exploding, and L-stability keeps you from ringing. On a truly stiff problem you want both.

::: warning Damping is not always a gift
The damping that helps on stiff problems hurts on oscillating ones. Backward Euler on a circular orbit has $|R(\pm i\omega h)| = 1/\sqrt{1 + h^2\omega^2} < 1$, so it spirals the orbit inward — fake friction removing real energy. Pick an implicit method because the problem has fast decaying modes you want gone, never because it is "more stable". For an undamped oscillation the trapezoidal rule, with $|R| = 1$ exactly on the imaginary axis, is the implicit method that does least harm.
:::

## BDF: differentiate the curve instead of integrating it

Adams methods fit a polynomial through past values of $\mathbf{f}$ and integrate it. The **backward differentiation formulas** (BDF) fit a polynomial through recent values of $\mathbf{y}$ — including the unknown $\mathbf{y}_{n+1}$ — and demand that its *slope* at $t_{n+1}$ equal $\mathbf{f}_{n+1}$. That makes them implicit by construction.

Write $\nabla \mathbf{y}_{n+1} = \mathbf{y}_{n+1} - \mathbf{y}_n$ for a **backward difference** (read $\nabla$ as "nabla"), and $\nabla^{j}$ for doing it $j$ times. The $k$-step formula is

$$
\sum_{j=1}^{k} \frac{1}{j}\,\nabla^{j}\mathbf{y}_{n+1} = h\,\mathbf{f}_{n+1} .
$$

For example, with $k = 2$: $\nabla\mathbf{y}_{n+1} + \tfrac12\nabla^2\mathbf{y}_{n+1} = (\mathbf{y}_{n+1} - \mathbf{y}_n) + \tfrac12(\mathbf{y}_{n+1} - 2\mathbf{y}_n + \mathbf{y}_{n-1}) = \tfrac32\mathbf{y}_{n+1} - 2\mathbf{y}_n + \tfrac12\mathbf{y}_{n-1}$. Set that equal to $h\mathbf{f}_{n+1}$ and divide by $\tfrac32$ to get BDF2. The others come out the same way:

| Method | Order | Formula |
| --- | --- | --- |
| BDF1 | 1 | $\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}_{n+1}$ (backward Euler) |
| BDF2 | 2 | $\mathbf{y}_{n+1} = \frac{4}{3}\mathbf{y}_n - \frac{1}{3}\mathbf{y}_{n-1} + \frac{2}{3}h\,\mathbf{f}_{n+1}$ |
| BDF3 | 3 | $\mathbf{y}_{n+1} = \frac{18}{11}\mathbf{y}_n - \frac{9}{11}\mathbf{y}_{n-1} + \frac{2}{11}\mathbf{y}_{n-2} + \frac{6}{11}h\,\mathbf{f}_{n+1}$ |
| BDF4 | 4 | $\mathbf{y}_{n+1} = \frac{48}{25}\mathbf{y}_n - \frac{36}{25}\mathbf{y}_{n-1} + \frac{16}{25}\mathbf{y}_{n-2} - \frac{3}{25}\mathbf{y}_{n-3} + \frac{12}{25}h\,\mathbf{f}_{n+1}$ |

Each needs one evaluation of $\mathbf{f}$, at the new point — why BDF, not Adams–Moulton, sits under production stiff solvers. Their stability is excellent but not unlimited. Substitute $\mathbf{y}_n = \zeta^n$ ($\zeta$ is "zeta") and $z = h\lambda$ to get $\sum_{j=1}^{k}\frac{1}{j}(1 - \zeta^{-1})^j = z$. Walking $\zeta = e^{i\theta}$ once around the unit circle traces the edge of the *unstable* region. What remains stable includes a wedge around the negative real axis. A method is **$A(\alpha)$-stable** ("A-alpha") when it is stable for every $z$ with $|\arg(-z)| \le \alpha$ — every $z$ within angle $\alpha$ of the negative real axis:

| Method | $\alpha$ | Note |
| --- | --- | --- |
| BDF1 | $90^\circ$ | A-stable and L-stable |
| BDF2 | $90^\circ$ | A-stable and L-stable; the highest order that can be A-stable |
| BDF3 | $86.03^\circ$ | |
| BDF4 | $73.35^\circ$ | |
| BDF5 | $51.84^\circ$ | |
| BDF6 | $17.84^\circ$ | rarely useful |
| BDF7 | — | not zero-stable: unusable at any step |

Two hard facts sit in that table. **[[Dahlquist's second barrier|dahlquist]]**: no A-stable linear multistep method can have order above 2, so BDF2 ends the A-stable line, with the trapezoidal rule. And BDF7 is not **[[zero-stable|zero-stable]]**: even at $z = 0$, with no equation at all, one root of its characteristic polynomial has size 1.022, so it amplifies its own rounding. So every BDF solver — SciPy's `BDF`, MATLAB's `ode15s`, the long-lived **[[LSODE and DASSL|lsode-dassl]]** — stops at order 5 or 6 and varies its order as it runs.

All of them crush very fast modes. For BDF2 at $z = -1000$ both roots have size $0.0223$, shrinking like $0.707/\sqrt{|z|}$: a fast mode dies in a step or two while the slow solution is carried to second order.

::: key BDF
BDF methods fit a polynomial through past values of $\mathbf{y}$ and set its derivative at $t_{n+1}$ equal to $\mathbf{f}_{n+1}$: $\sum_{j=1}^{k}\frac{1}{j}\nabla^{j}\mathbf{y}_{n+1} = h\mathbf{f}_{n+1}$. BDF1 is backward Euler; BDF2 is $\mathbf{y}_{n+1} = \frac43\mathbf{y}_n - \frac13\mathbf{y}_{n-1} + \frac23 h\mathbf{f}_{n+1}$. BDF1 and BDF2 are A-stable and L-stable; BDF3 to BDF6 are $A(\alpha)$-stable with $\alpha$ falling from $86^\circ$ to $18^\circ$; BDF7 is not zero-stable and does not exist as a usable method. Dahlquist's second barrier: no A-stable linear multistep method has order above 2.
:::

## Solving the implicit equation

Every implicit step has to solve

$$
\mathbf{G}(\mathbf{y}_{n+1}) = \mathbf{y}_{n+1} - \mathbf{y}_n - h\beta\,\mathbf{f}(t_{n+1}, \mathbf{y}_{n+1}) - (\text{known past terms}) = \mathbf{0},
$$

where $\beta$ ("beta") is the weight on $\mathbf{f}_{n+1}$: 1 for backward Euler, $\tfrac23$ for BDF2. How you solve it is not a detail.

The obvious way is **fixed-point iteration**: guess $\mathbf{y}^{(0)}$, compute $\mathbf{y}^{(1)} = \mathbf{y}_n + h\beta\,\mathbf{f}(t_{n+1}, \mathbf{y}^{(0)})$, repeat. Like a shrinking photocopier, it settles only if each pass shrinks the error: $h\beta\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert < 1$. On a stiff problem $\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert$ is about $|\lambda_{\text{fast}}|$, so this is the explicit step limit all over again. It is also exactly what a predictor–corrector cycle does, which is why PECE fails on stiff problems however many corrector passes you make.

The right way is **Newton's method** from the root-finding lesson. The Jacobian of $\mathbf{G}$ is $\mathbf{I} - h\beta\mathbf{J}$ ($\mathbf{I}$ is the identity matrix), and each iteration solves for a correction $\boldsymbol{\delta}$:

$$
\left(\mathbf{I} - h\beta\,\mathbf{J}\right)\boldsymbol{\delta}^{(m)} = -\mathbf{G}\!\left(\mathbf{y}^{(m)}\right),
\qquad \mathbf{y}^{(m+1)} = \mathbf{y}^{(m)} + \boldsymbol{\delta}^{(m)} .
$$

Convergence is quadratic, with no step-size limit: the matrix $\mathbf{I} - h\beta\mathbf{J}$ *contains* the stiffness instead of being defeated by it. The price is a linear solve per iteration; the module's last lesson covers its conditioning and the sparsity that keeps it cheap.

Three practical points. Solvers reuse one factorization of $\mathbf{I} - h\beta\mathbf{J}$ over several steps, since refactoring costs most (**modified Newton**: linear convergence, but fast). They start Newton from the predictor polynomial, so the first guess is already good. And the Jacobian must be right, which is why complex-step differentiation, two lessons on, matters for stiff solvers.

::: example One backward-Euler step by Newton
A thrust-vector-control **[[gimbal|gimbal]]** servo in a launch-vehicle simulation, modeled as a first-order loop with a smooth rate limit:

$$
\dot\delta = A\tanh\!\left(\frac{\delta_c - \delta}{\tau A}\right),
\qquad A = 20^\circ/\mathrm{s} = 0.349066\,\mathrm{rad/s},
\qquad \tau = 5\,\mathrm{ms} .
$$

$\delta$ is the gimbal angle, $\delta_c$ the command, and the S-shaped $\tanh$ caps the rate at $A$. For small errors this is a lag with $\lambda = -1/\tau = -200\,\mathrm{s^{-1}}$; the pitch dynamics it drives act over seconds. Command $\delta_c = 0.1^\circ$ from $\delta_n = 0$ and take one step at the 50 Hz frame, $h = 0.02\,\mathrm{s}$, so $h/\tau = 4$ — twice explicit Euler's limit.

Solve $G(\delta) = \delta - \delta_n - h\,\dot\delta(\delta) = 0$. Its slope is $G'(\delta) = 1 + (h/\tau)\,\mathrm{sech}^2\!\big((\delta_c-\delta)/(\tau A)\big)$, where $\mathrm{sech}^2$ is the slope of $\tanh$. Start from $\delta = \delta_n$ and repeat $\delta \leftarrow \delta - G/G'$ ($G$ and the correction in radians):

| iteration | $\delta$ (deg) | $G$ | correction |
| --- | --- | --- | --- |
| 0 | 0.00000000 | $-5.317\times10^{-3}$ | $+1.984\times10^{-3}$ |
| 1 | 0.11367512 | $+2.933\times10^{-3}$ | $-5.954\times10^{-4}$ |
| 2 | 0.07956365 | $-1.854\times10^{-5}$ | $+3.833\times10^{-6}$ |
| 3 | 0.07978327 | $+6.491\times10^{-9}$ | $-1.341\times10^{-9}$ |
| 4 | 0.07978320 | $+7.9\times10^{-16}$ | — |

Near the end the leftover $G$ roughly squares each time ($10^{-5}$, $10^{-9}$, $10^{-16}$): quadratic convergence. Fixed-point iteration never converges here. It goes $+0.305^\circ$, $-0.387^\circ$, $+0.400^\circ$, $-0.398^\circ$, $+0.400^\circ$, bouncing between two values, because $h\lvert\partial\dot\delta/\partial\delta\rvert$ is 1.68 at the start and 3.84 near the answer — both above 1.

Frame by frame, against an accurate reference:

| $t$ (s) | reference (deg) | backward Euler, $h = 20\,\mathrm{ms}$ | explicit Euler, $h = 20\,\mathrm{ms}$ | explicit Euler, $h = 4\,\mathrm{ms}$ |
| --- | --- | --- | --- | --- |
| 0.02 | 0.097848 | 0.079783 | 0.304638 | 0.099925 |
| 0.04 | 0.099961 | 0.095955 | $-0.082227$ | 0.100000 |
| 0.06 | 0.099999 | 0.099191 | 0.297399 | 0.100000 |
| 0.08 | 0.100000 | 0.099838 | $-0.087458$ | 0.100000 |
| 0.10 | 0.100000 | 0.099968 | 0.294145 | 0.100000 |

Explicit Euler at 50 Hz chatters between about $+0.29^\circ$ and $-0.09^\circ$ forever. The rate limit keeps it bounded, so it looks like a buzzing gimbal, not a bug. Backward Euler settles smoothly toward $0.1^\circ$. Explicit Euler at 250 Hz ($h/\tau = 0.8$, inside the limit) is also right — the other way out, and here usually the cheaper one.
:::

## What you actually do about stiffness

On the ground, in simulation, the answer is an implicit solver. SciPy's `solve_ivp` offers three:

- `Radau` — fifth-order, L-stable, three-stage implicit Runge–Kutta; excellent on very stiff problems.
- `BDF` — variable order 1 to 5, the workhorse for large systems.
- `LSODA` — compares the step accuracy wants with the step stability allows, and switches between Adams and BDF to match.

Unsure whether it is stiff? Try `LSODA`. Sure? `Radau` or `BDF` with an analytic Jacobian is faster; on the reaction-wheel system they need 23 and 53 steps.

On a flight computer, almost never. A Newton solve takes a data-dependent number of iterations, so its **[[worst-case execution time|wcet]]** cannot be bounded — the adaptive-stepping lesson's objection, now on every step. Flight software takes one of three routes:

1. **Run fast enough.** A fixed-step explicit method at a rate the fastest mode allows — affordable when that mode is a cheap actuator loop.
2. **Remove the fast mode.** If the current settles in 1 ms and the frame is 20 ms, replace it by its settled value, $i = K\omega_b/R$ (set $di/dt = 0$), leaving a first-order system with no stiffness. This **quasi-steady** (singular-perturbation) argument is why flight actuator models are far simpler than simulation ones.
3. **Split the rates.** Run the fast subsystem in its own faster loop — a **multi-rate** scheme — with the hand-off designed on purpose.

Spotting which one you are looking at is most of the skill. A comment saying the loop runs at 400 Hz "for the actuator" is an explicit method paying the stability price; ask whether the actuator state is needed at all.

## Check yourself

::: check
A six-degree-of-freedom launch vehicle simulation has rigid-body modes with time constants of a few seconds and a first structural bending mode at $12\,\mathrm{Hz}$ with $2\%$ damping. Estimate the stiffness ratio and the RK4 step the bending mode forces, for a 300 s ascent.
:::

::: answer
The mode has $\omega = 2\pi \times 12 = 75.4\,\mathrm{rad/s}$ and damping ratio $\zeta = 0.02$, so $\lambda = -\zeta\omega \pm i\omega\sqrt{1-\zeta^2} = -1.51 \pm 75.4i$, of size about $75.4\,\mathrm{s^{-1}}$. Against a 3 s rigid-body mode ($|\lambda| = 0.33\,\mathrm{s^{-1}}$) the ratio of sizes is about 230.

The mode barely decays, so RK4's imaginary-axis limit $|z| < 2\sqrt{2} = 2.83$ binds: $h < 2.83/75.4 = 37.5\,\mathrm{ms}$, a rate above about 27 Hz. Only mildly stiff; the usual few-hundred-hertz explicit simulation handles it. An implicit method would be *wrong* here anyway: backward Euler's fake damping would delete the oscillation the simulation exists to study.
:::

::: check
Why does adding more corrector passes to an Adams predictor–corrector scheme not make it work on a stiff problem?
:::

::: answer
Each corrector pass is one step of fixed-point iteration, which converges only when $h\beta\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert < 1$. On a stiff problem $\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert \approx |\lambda_{\text{fast}}|$, so that is exactly the explicit step limit. Converged, it would give the true Adams–Moulton answer with its large stability region — but at a stiff step it diverges first. Only Newton, using $\mathbf{I} - h\beta\mathbf{J}$, converges there.
:::

::: check
A thermal model of an instrument has a sensor with time constant $0.5\,\mathrm{s}$ bolted to a radiator panel with time constant $2{,}000\,\mathrm{s}$, and you want 12 hours of orbital thermal cycling. Compute the stiffness ratio, the number of RK4 steps required, and the number of backward Euler steps at an accuracy-driven step of $20\,\mathrm{s}$.
:::

::: answer
$S = 2000/0.5 = 4{,}000$. RK4 needs $h < 2.785 \times 0.5 = 1.39\,\mathrm{s}$, so 12 hours ($43{,}200\,\mathrm{s}$) takes $43{,}200/1.39 \approx 31{,}000$ steps, about 124,000 force evaluations. Backward Euler at $h = 20\,\mathrm{s}$ — a hundredth of the slow time constant — takes $43{,}200/20 = 2{,}160$ steps, each with three or four negligible $2\times2$ Newton solves. About 15 times fewer steps. The sensor is not lost: after its start-up transient it follows the panel with the right lag.
:::

::: check
Explain why the trapezoidal rule is A-stable but not L-stable, and give one situation where you would choose it over backward Euler and one where you would not.
:::

::: answer
$R(z) = (1 + z/2)/(1 - z/2)$ has $|R| < 1$ for all $\mathrm{Re}\,z < 0$: A-stable. But $|R| \to 1$ as $z \to -\infty$, not 0, so a very fast mode is flipped, not damped, for hundreds of steps. Choose it when fast motion is *oscillating and physical* and should be kept: an undamped structural mode, or a long orbit that backward Euler would shrink. Avoid it when the fast motion is a transient you want gone — an actuator loop, a thermal mass — because the ringing looks like a real oscillation.
:::

::: check
Your simulation of a satellite with a reaction wheel runs `solve_ivp` with the default `RK45` and takes 40 minutes to cover 200 s, with the step hovering near $3.3\,\mathrm{ms}$ even though the attitude is smooth. Diagnose it, and give two different fixes with their trade-offs.
:::

::: answer
The hovering step is the signature: the controller is held at the stability edge by the motor's $1\,\mathrm{ms}$ mode. RK45 (Dormand–Prince) is stable on the negative real axis out to $z \approx -3.31$, and $3.31/999.98\,\mathrm{s^{-1}} = 3.3\,\mathrm{ms}$ — a match.

Fix one: `method='Radau'` or `method='BDF'` with the analytic Jacobian. The step grows to what accuracy needs and the run takes a few dozen steps (23 for `Radau`), at the cost of a tiny linear solve per Newton iteration.

Fix two: set the current to its settled value $i = K\omega_b/R$, leaving a first-order loop with no stiffness. Faster still, and what flight software does, but it discards the current transient — wrong if you are sizing the motor. Use the reduced model for mission-length runs, the stiff solver for short detailed ones.
:::

## Summary

| Item | Statement |
| --- | --- |
| Stiffness | Widely separated time constants, $S = \tau_{\text{slow}}/\tau_{\text{fast}}$, over an interval long compared with $\tau_{\text{fast}}$ |
| Symptom | Explicit step set by the fastest mode for *stability*; adaptive step hovers while the solution is smooth |
| Backward Euler | $\mathbf{y}_{n+1} = \mathbf{y}_n + h\mathbf{f}(t_{n+1}, \mathbf{y}_{n+1})$, order 1, $R(z) = 1/(1-z)$ |
| A-stable | Stability region contains the whole left half plane |
| L-stable | A-stable and $R(-\infty) = 0$: fast modes are wiped out, not merely bounded |
| Trapezoidal | Order 2, A-stable, $R(-\infty) = -1$: not L-stable, rings at half the frame rate |
| BDF | $\sum_{j=1}^{k}\frac{1}{j}\nabla^{j}\mathbf{y}_{n+1} = h\mathbf{f}_{n+1}$; BDF2: $\mathbf{y}_{n+1} = \frac43\mathbf{y}_n - \frac13\mathbf{y}_{n-1} + \frac23 h\mathbf{f}_{n+1}$ |
| BDF stability | BDF1, BDF2 A-stable; $A(\alpha)$ with $\alpha = 86.0^\circ, 73.4^\circ, 51.8^\circ, 17.8^\circ$ for BDF3–6; BDF7 not zero-stable |
| Dahlquist barrier | No A-stable linear multistep method has order above 2 |
| Implicit solve | Newton with Jacobian $\mathbf{I} - h\beta\mathbf{J}$; fixed-point needs $h\beta\lVert\mathbf{J}\rVert < 1$, so fails when stiff |
| Solvers | `Radau` (L-stable, order 5), `BDF` (order 1–5), `LSODA` (switches) |
| Flight software | No implicit methods (unbounded run time): run fast, go quasi-steady, or multi-rate |

Next lesson: given a solution or a table of data, how do you get a value *between* the samples? That is how an adaptive integrator gives output on a regular grid, and how a density table in a drag calculation is read.

::: context time-constant Fast and slow time constants
A quantity that decays like $e^{-t/\tau}$ drops to $e^{-1} \approx 0.37$ of its start after one time constant $\tau$, and to under 1% after five. In the picture both curves start at 1. The fast one ($\tau = 0.15\,\mathrm{s}$) is gone almost at once; the slow one ($\tau = 2\,\mathrm{s}$) is still at 37% at $t = 2\,\mathrm{s}$. A stiff problem contains both, and an explicit method has to step at the pace of the fast curve for as long as the slow one lasts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="144" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="155">0</text><text x="100" y="155">1</text><text x="160" y="155">2</text><text x="220" y="155">3</text><text x="280" y="155">4</text><text x="340" y="155">5</text>
  </g>
  <text x="190" y="170" font-size="11" text-anchor="middle" fill="#1f2a44">time t (s)</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,30.0 47.5,36.7 55.0,42.9 62.5,48.8 70.0,54.3 77.5,59.5 85.0,64.4 92.5,69.0 100.0,73.3 107.5,77.3 115.0,81.1 122.5,84.7 130.0,88.0 137.5,91.2 145.0,94.1 152.5,96.9 160.0,99.5 167.5,102.0 175.0,104.3 182.5,106.5 190.0,108.5 197.5,110.4 205.0,112.2 212.5,113.9 220.0,115.5 227.5,116.9 235.0,118.3 242.5,119.7 250.0,120.9 257.5,122.0 265.0,123.1 272.5,124.2 280.0,125.1 287.5,126.0 295.0,126.9 302.5,127.7 310.0,128.4 317.5,129.1 325.0,129.8 332.5,130.4 340.0,131.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,30.0 41.5,46.9 43.0,61.2 44.5,73.3 46.0,83.5 47.5,92.2 49.0,99.5 50.5,105.7 52.0,111.0 53.5,115.5 55.0,119.2 56.5,122.4 58.0,125.1 59.5,127.4 61.0,129.3 62.5,131.0 64.0,132.4 65.5,133.5 67.0,134.5 68.5,135.4 70.0,136.1 71.5,136.7 73.0,137.2 74.5,137.6 76.0,138.0 77.5,138.3 79.0,138.6 80.5,138.8 82.0,139.0 83.5,139.1 85.0,139.3 86.5,139.4 88.0,139.5 89.5,139.6 91.0,139.6 92.5,139.7 94.0,139.7 95.5,139.8 97.0,139.8 98.5,139.8 100.0,139.9 340.0,140.0"/>
  <line x1="160" y1="99.5" x2="160" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <circle cx="160" cy="99.5" r="3" fill="#1d6fd1"/>
  <text x="200" y="80" font-size="11" fill="#1d6fd1">slow, τ = 2 s</text>
  <text x="170" y="96" font-size="11" fill="#1d6fd1">0.37 at t = τ</text>
  <text x="70" y="127" font-size="11" fill="#b4232c">fast, τ = 0.15 s</text>
</svg>
```
:::

::: context inductance What inductance does in a motor
A motor's windings are coils of wire. A coil resists any *change* in the current through it: push a new voltage across it and the current does not jump, it ramps. That property is **inductance**, measured in henries (H); $2\,\mathrm{mH}$ is two thousandths of a henry. With resistance $R$ in the same circuit, the current settles with time constant $L/R$ — here $0.002/2 = 0.001\,\mathrm{s}$. That millisecond is the hummingbird in this lesson's reaction-wheel model.
:::

::: context stability-region Where each method is stable
Plot $z = h\lambda$ on a flat plane: real part across, imaginary part up. Explicit Euler's $R = 1 + z$ has size at most 1 only inside the disk of radius 1 centred at $-1$ (blue, left). Backward Euler's $R = 1/(1 - z)$ has size at most 1 everywhere *outside* the disk of radius 1 centred at $+1$ (blue, right). That covers the whole left half, where every decaying mode lives — so no step is too big.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="190" y="20" width="160" height="110" fill="#8fb8f0"/>
  <circle cx="300" cy="75" r="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="80" cy="75" r="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="10" y1="75" x2="170" y2="75" stroke="#1f2a44" stroke-width="1"/>
  <line x1="110" y1="20" x2="110" y2="130" stroke="#1f2a44" stroke-width="1"/>
  <line x1="190" y1="75" x2="350" y2="75" stroke="#1f2a44" stroke-width="1"/>
  <line x1="270" y1="20" x2="270" y2="130" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="90">−2</text><text x="80" y="90">−1</text><text x="116" y="90">0</text>
    <text x="276" y="90">0</text><text x="300" y="90">1</text><text x="330" y="90">2</text>
    <text x="90" y="148">explicit Euler: stable inside</text>
    <text x="270" y="148">backward Euler: stable outside</text>
  </g>
</svg>
```
:::

::: context half-frame-rate Why the ringing is at half the frame rate
A signal that flips sign every step — plus, minus, plus, minus — completes one full up-and-down cycle every two steps. So at a 100 Hz frame it looks like a 50 Hz wave. That is the fastest wiggle a sampled signal can show at all (engineers call it the Nyquist frequency). In the picture, trapezoidal (red) bounces between nearly $\pm 1$, while backward Euler (blue) drops to zero after one step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="350" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" points="40,25 70,132.8 100,29.2 130,128.8 160,33.1 190,125 220,36.7 250,121.6 280,40.1 310,118.4 340,43.1"/>
  <g fill="#b4232c"><circle cx="40" cy="25" r="3.5"/><circle cx="70" cy="132.8" r="3.5"/><circle cx="100" cy="29.2" r="3.5"/><circle cx="130" cy="128.8" r="3.5"/><circle cx="160" cy="33.1" r="3.5"/><circle cx="190" cy="125" r="3.5"/><circle cx="220" cy="36.7" r="3.5"/><circle cx="250" cy="121.6" r="3.5"/><circle cx="280" cy="40.1" r="3.5"/><circle cx="310" cy="118.4" r="3.5"/><circle cx="340" cy="43.1" r="3.5"/></g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40,25 70,79.5 100,80 130,80 160,80 190,80 220,80 250,80 280,80 310,80 340,80"/>
  <g fill="#1d6fd1"><circle cx="70" cy="79.5" r="3"/><circle cx="100" cy="80" r="3"/><circle cx="130" cy="80" r="3"/></g>
  <text x="26" y="29" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="26" y="84" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="190" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">steps 0 to 10, z = −100</text>
</svg>
```
:::

::: context dahlquist Germund Dahlquist's barriers
Germund Dahlquist was a Swedish mathematician who, in the 1950s and 1960s, proved two limits on linear multistep methods. The first barrier caps how high the order of a zero-stable $k$-step method can be. The second, published in 1963, is the one here: A-stability and order above 2 cannot live together in a linear multistep method. It is why the search for high-order stiff methods moved to implicit Runge–Kutta methods such as Radau, which are not multistep methods and so escape the barrier.
:::

::: context zero-stable Zero-stability: stable with no equation at all
Set $h = 0$ and a multistep formula becomes a pure recipe for mixing old values. Zero-stability asks whether that recipe, left alone, keeps small errors small. If one root of its characteristic polynomial has size above 1 — BDF7's has 1.022 — then rounding errors are multiplied by at least that factor every step, forever. After 1,000 steps, $1.022^{1000}$ is about $3\times10^{9}$. No step size cures it, because the problem is there even when the step is zero.
:::

::: context lsode-dassl The old solvers still inside new tools
LSODE was written by Alan Hindmarsh at Lawrence Livermore National Laboratory, and DASSL by Linda Petzold, both around 1980–1982. They built on C. William Gear's 1971 work that made BDF practical, which is why BDF is often called "Gear's method". LSODA, the automatic-switching version inside SciPy, comes from the same family. Code written forty years ago is quietly running inside the Python you use today.
:::

::: context gimbal What a gimbal does on a rocket
A rocket steers by tilting its engine a few degrees so the thrust pushes a little sideways. The pivot that lets it tilt is the **gimbal**, and hydraulic or electric actuators swing it on command. The servo loop that holds the commanded angle is fast (milliseconds); the rocket's pitch response is slow (seconds). That split is exactly the stiffness this lesson is about.
:::

::: context wcet Worst-case execution time
A flight computer runs its tasks on a fixed schedule, say every 10 ms. Each task must finish inside its slot every single time, or the next one starts late and the loop falls apart. Engineers therefore prove an upper bound on each task's running time, its worst-case execution time. A loop with a fixed number of operations is easy to bound. A Newton solve that stops "when converged" might take three passes or thirty, and that cannot be promised to a scheduler.
:::
