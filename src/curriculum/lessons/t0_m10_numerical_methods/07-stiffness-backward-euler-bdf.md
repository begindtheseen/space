---
id: l07-stiffness-backward-euler-bdf
title: Stiffness, backward Euler and BDF
minutes: 28
covers:
  - 'stiffness and implicit methods: backward Euler, BDF'
---

Put a reaction wheel into a spacecraft attitude simulation and something strange happens. The vehicle's response to a slew command takes a minute; the wheel's motor current loop settles in a millisecond. Both are in the same state vector, and the moment you add the motor, your RK4 integrator — which was running happily at 10 Hz on rigid-body dynamics alone — has to run at 400 Hz or it explodes. It is not that the simulation became less accurate. It is that a mode which is *physically irrelevant after the first few milliseconds* now dictates the step size for the whole 200-second run.

That is **stiffness**. A problem is stiff when it contains time constants separated by orders of magnitude, and you want to integrate over the long one. An explicit method's step is then set by the fastest mode for *stability* — for not blowing up — and not by any accuracy requirement, and the mismatch is the entire cost. The remedy is an implicit method, which has no such stability limit and can take a step sized by the accuracy you actually want.

Stiffness is everywhere in GNC simulation: actuator loops inside vehicle dynamics, structural bending modes inside a launch trajectory, propellant slosh, thermal networks with a small sensor bonded to a large radiator, chemical kinetics in an engine or a re-entry shock layer. This lesson defines stiffness precisely, shows the stability constraint in numbers, builds backward Euler and the BDF family, and then deals with the part people skip: an implicit method requires solving a nonlinear system every step, and how you solve it decides whether the method works at all.

## What stiffness is

Linearise $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ about a point. The local behaviour is governed by the Jacobian $\mathbf{J} = \partial\mathbf{f}/\partial\mathbf{y}$, whose eigenvalues $\lambda_i$ set the modes: a mode with $\lambda_i$ real and negative decays with time constant $\tau_i = 1/|\lambda_i|$. Define the **stiffness ratio**

$$
S = \frac{\max_i |\mathrm{Re}\,\lambda_i|}{\min_i |\mathrm{Re}\,\lambda_i|} = \frac{\tau_{\text{slow}}}{\tau_{\text{fast}}} .
$$

A problem is stiff when $S$ is large *and* the interval of interest $T$ is long compared with $\tau_{\text{fast}}$. Both conditions matter. A motor loop with $\tau = 1\,\mathrm{ms}$ is not a stiff problem if you only want the first 10 ms of it; it becomes one the moment you want 200 s. Stiffness is a property of the problem *and the question you are asking of it*, which is why the same model can be stiff in a mission-length simulation and not stiff in a hardware-in-the-loop frame.

The practical symptom is unmistakable once you know it. An adaptive integrator takes very small steps while the solution is visibly smooth and flat. The controller is not asking for accuracy — the local error estimate is tiny — it is being forced down by rejected steps, because above a certain $h$ the fast mode's numerical amplitude grows and the estimate explodes. If `solve_ivp` with `RK45` crawls through a region where nothing is happening, the problem is stiff and you are using the wrong method.

::: key
An ODE is stiff when its Jacobian has eigenvalues with widely separated time constants and you must integrate over the slow one. An explicit method must then take steps set by the fastest decaying mode for *stability*, not accuracy — the fast mode has long since died physically, but its numerical image grows if $h|\lambda_{\text{fast}}|$ leaves the stability region. Use an implicit method instead: backward Euler, BDF, or an implicit Runge–Kutta method such as Radau.
:::

## The constraint, in numbers

Take a single-axis attitude loop with a reaction wheel. The spacecraft has inertia $I_s = 500\,\mathrm{kg\,m^2}$; the wheel motor has torque constant $K_t = 0.05\,\mathrm{N\,m/A}$, winding inductance $L = 2\,\mathrm{mH}$ and resistance $R = 2\,\Omega$, so its electrical time constant is $L/R = 1\,\mathrm{ms}$; a rate feedback of gain $K = 400\,\mathrm{V}$ per $\mathrm{rad/s}$ commands the motor voltage. With state $\mathbf{x} = (\omega_b, i)$ — body rate in $\mathrm{rad/s}$ and motor current in A —

$$
\dot{\omega}_b = -\frac{K_t}{I_s}\,i, \qquad
\frac{di}{dt} = \frac{K}{L}\,\omega_b - \frac{R}{L}\,i,
\qquad
\mathbf{A} = \begin{pmatrix} 0 & -10^{-4} \\ 2\times10^{5} & -10^{3}\end{pmatrix}.
$$

The eigenvalues follow from $\lambda^2 - (\mathrm{tr}\,\mathbf{A})\lambda + \det\mathbf{A} = 0$, that is $\lambda^2 + 1000\lambda + 20 = 0$:

$$
\lambda_{\text{slow}} = -0.02000, \quad \tau_{\text{slow}} = 50.0\,\mathrm{s};
\qquad
\lambda_{\text{fast}} = -999.98, \quad \tau_{\text{fast}} = 1.000\,\mathrm{ms} .
$$

Stiffness ratio $S = 50{,}000$. The engineering question is the vehicle's rate response over 200 s, four slow time constants; the current transient is over in 5 ms and contributes nothing after that.

Now apply the stability intervals from the previous lessons. Along the negative real axis, explicit Euler is stable for $h\lambda \in (-2, 0)$, RK4 for $(-2.785, 0)$ and AB4 for $(-0.3, 0)$. With $|\lambda_{\text{fast}}| = 999.98\,\mathrm{s^{-1}}$:

| Method | $h_{\text{max}}$ | steps for 200 s | evaluations of $\mathbf{f}$ |
| --- | --- | --- | --- |
| Explicit Euler | $2.000\,\mathrm{ms}$ | 99,998 | 99,998 |
| RK4 | $2.785\,\mathrm{ms}$ | 71,805 | 287,220 |
| AB4 | $0.300\,\mathrm{ms}$ | 666,654 | 666,654 |
| Backward Euler, $h = 1\,\mathrm{s}$ | unlimited | 200 | 200 solves |

Nothing in that table is about accuracy. RK4 at $h = 2.785\,\mathrm{ms}$ resolves the slow mode to about $10^{-15}$ — twelve digits more than anyone wants — and takes 287,220 force evaluations to do it. Note also that AB4, which won the cost comparison in the previous lesson, is now the *worst* of the three: its stability interval is nine times shorter than RK4's, and on a stability-limited problem that is what decides.

::: example Explicit Euler crossing the line
Integrate the system above from $\omega_b = 10^{-3}\,\mathrm{rad/s}$, $i = 0$ for 0.1 s with explicit Euler. The exact answer at $t = 0.1\,\mathrm{s}$ is $\omega_b = 9.98022\times10^{-4}\,\mathrm{rad/s}$ and $i = 0.199608\,\mathrm{A}$; the fast transient died a hundred time constants ago.

| $h$ | $h\lvert\lambda_{\text{fast}}\rvert$ | $i$ at $t = 0.1\,\mathrm{s}$ | range of $i$ over the last 20 steps |
| --- | --- | --- | --- |
| $1.50\,\mathrm{ms}$ | 1.500 | $0.19961\,\mathrm{A}$ | $0.19961$ to $0.19972$ |
| $1.90\,\mathrm{ms}$ | 1.900 | $0.20036\,\mathrm{A}$ | $0.19419$ to $0.20474$ |
| $2.00\,\mathrm{ms}$ | 2.000 | $0.0\,\mathrm{A}$ | $0$ to $0.39952$ |
| $2.10\,\mathrm{ms}$ | 2.100 | $-19.17\,\mathrm{A}$ | $-19.17$ to $17.81$ |
| $2.50\,\mathrm{ms}$ | 2.500 | $-2.2\times10^{6}\,\mathrm{A}$ | $\pm 2\times10^{6}$ |
| $3.00\,\mathrm{ms}$ | 3.000 | $1.7\times10^{9}\,\mathrm{A}$ | $\pm 1.7\times10^{9}$ |

At $h = 1.5\,\mathrm{ms}$ the answer is right to five digits. At exactly $h\lambda = -2$ the numerical fast mode has amplification factor $-1$: it neither grows nor decays, so the current alternates between 0 and $0.4\,\mathrm{A}$ forever while the truth sits at $0.1996\,\mathrm{A}$. A 5% increase in the step past that, and the answer is off by a factor of a hundred with the wrong sign. There is no gradual degradation — the failure is a cliff, and its location has nothing to do with the accuracy you asked for.
:::

## Backward Euler

Evaluate the derivative at the *end* of the step instead of the beginning:

$$
\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}(t_{n+1}, \mathbf{y}_{n+1}) .
$$

This is AM1 from the previous lesson, and it is implicit: $\mathbf{y}_{n+1}$ appears on both sides. Its local error is $-\tfrac12 h^2 y''$ and its global error $O(h)$ — first order, like explicit Euler, with the opposite sign.

The stability is what it is for. On $\dot y = \lambda y$, with $z = h\lambda$, the step gives $y_{n+1} = y_n + z y_{n+1}$, so

$$
y_{n+1} = R(z)\,y_n, \qquad R(z) = \frac{1}{1 - z} .
$$

For any $z$ with $\mathrm{Re}\,z < 0$, the denominator satisfies $|1 - z| > 1$, so $|R(z)| < 1$. The method is stable for *every* step size on *every* decaying mode. That property has a name:

> A method is **A-stable** when its stability region contains the whole left half plane: every mode that decays in the true solution also decays in the numerical one, at any $h$.

Backward Euler has more than that. As $z \to -\infty$, $R(z) \to 0$: the faster a mode is, the harder the method kills it. A method with $R(-\infty) = 0$ is called **L-stable**, and L-stability is what you want on a stiff problem, because it reproduces the physics — the fast transient really does vanish — instead of merely refusing to amplify it.

::: example Backward Euler and trapezoidal on the same stiff system
Run the reaction-wheel system for 200 s. The exact body rate at $t = 200\,\mathrm{s}$ is $\omega_b = 1.831454\times10^{-5}\,\mathrm{rad/s}$.

| Step | Backward Euler $\omega_b$ | relative error | Trapezoidal $\omega_b$ | relative error |
| --- | --- | --- | --- | --- |
| $0.1\,\mathrm{s}$ | $1.838785\times10^{-5}$ | $4.00\times10^{-3}$ | $1.831452\times10^{-5}$ | $1.3\times10^{-6}$ |
| $0.5\,\mathrm{s}$ | $1.868206\times10^{-5}$ | $2.01\times10^{-2}$ | $1.831311\times10^{-5}$ | $7.8\times10^{-5}$ |
| $1.0\,\mathrm{s}$ | $1.905199\times10^{-5}$ | $4.03\times10^{-2}$ | $1.830311\times10^{-5}$ | $6.2\times10^{-4}$ |
| $5.0\,\mathrm{s}$ | $2.209376\times10^{-5}$ | $2.06\times10^{-1}$ | $1.823413\times10^{-5}$ | $4.4\times10^{-3}$ |

At $h = 1\,\mathrm{s}$ — a step five hundred times the fast time constant, which no explicit method could survive — both methods produce a usable answer in 200 steps, against RK4's 287,220 evaluations. Backward Euler's error halves when the step halves (first order); trapezoidal's falls by four (second order) and is 65 times smaller at every step. Neither ever becomes unstable, however large the step.
:::

## Trapezoidal: A-stable is not enough

The trapezoidal rule, AM2 from the previous lesson, is $\mathbf{y}_{n+1} = \mathbf{y}_n + \tfrac{h}{2}(\mathbf{f}_{n+1} + \mathbf{f}_n)$. Its amplification factor is

$$
R(z) = \frac{1 + z/2}{1 - z/2},
$$

which satisfies $|R| < 1$ throughout the left half plane — A-stable, and second order, the best combination a linear multistep method can have. But look at the limit: $R(z) \to -1$ as $z \to -\infty$. A very fast mode is not damped at all; it is *flipped in sign* every step and decays only in proportion to $1/|z|$.

::: example Ringing
$\dot y = -1000\,y$, $y_0 = 1$, $h = 0.1\,\mathrm{s}$, so $z = -100$. The exact solution at $t = 0.1\,\mathrm{s}$ is $e^{-100} = 3.7\times10^{-44}$ — zero to any engineering purpose.

| step | backward Euler | trapezoidal |
| --- | --- | --- |
| 1 | $9.901\times10^{-3}$ | $-0.960784$ |
| 2 | $9.803\times10^{-5}$ | $+0.923106$ |
| 3 | $9.706\times10^{-7}$ | $-0.886906$ |
| 5 | $9.515\times10^{-11}$ | $-0.818709$ |
| 10 | $9.053\times10^{-21}$ | $+0.670284$ |
| 50 | — | $+0.135299$ |
| 200 | — | $+0.000335$ |

Backward Euler's factor is $1/101 = 0.00990$, so the transient is gone in three steps. Trapezoidal's is $-49/51 = -0.9608$, so it takes 345 steps to fall by a factor of $10^6$, and in the meantime it alternates sign every step at close to full amplitude. In a vehicle simulation this appears as a clean-looking oscillation at exactly half the frame rate, on a signal that should be flat — and it is routinely mistaken for real actuator chatter or a control instability.
:::

The lesson is that A-stability keeps you from exploding, and L-stability keeps you from ringing. On a genuinely stiff problem you want both.

::: warning
The damping that makes implicit methods good on stiff problems makes them bad on oscillatory ones. Backward Euler applied to a circular orbit has $|R(\pm i\omega h)| = 1/\sqrt{1 + h^2\omega^2} < 1$ and spirals the orbit inward, exactly as the symplectic lesson showed — its artificial dissipation removes real energy. Never reach for an implicit method because it is "more stable"; reach for it because the problem has fast decaying modes you want removed. For an undamped oscillation the trapezoidal rule, with $|R| = 1$ exactly on the imaginary axis, is the implicit method that does least harm.
:::

## BDF: differentiate the interpolant instead of integrating it

The Adams methods of the previous lesson fit a polynomial to past values of $\mathbf{f}$ and integrate it. The **backward differentiation formulas** do the opposite: fit a polynomial to past values of $\mathbf{y}$, and require its *derivative* at $t_{n+1}$ to equal $\mathbf{f}_{n+1}$. Since the polynomial passes through $\mathbf{y}_{n+1}$, which is unknown, the formula is implicit by construction.

With backward differences $\nabla \mathbf{y}_{n+1} = \mathbf{y}_{n+1} - \mathbf{y}_n$ and $\nabla^{j}$ its $j$-fold repetition, the $k$-step formula is

$$
\sum_{j=1}^{k} \frac{1}{j}\,\nabla^{j}\mathbf{y}_{n+1} = h\,\mathbf{f}_{n+1} .
$$

Expanding for $k = 1, 2, 3$ and solving for $\mathbf{y}_{n+1}$:

| Method | Order | Formula |
| --- | --- | --- |
| BDF1 | 1 | $\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}_{n+1}$ (backward Euler) |
| BDF2 | 2 | $\mathbf{y}_{n+1} = \frac{4}{3}\mathbf{y}_n - \frac{1}{3}\mathbf{y}_{n-1} + \frac{2}{3}h\,\mathbf{f}_{n+1}$ |
| BDF3 | 3 | $\mathbf{y}_{n+1} = \frac{18}{11}\mathbf{y}_n - \frac{9}{11}\mathbf{y}_{n-1} + \frac{2}{11}\mathbf{y}_{n-2} + \frac{6}{11}h\,\mathbf{f}_{n+1}$ |
| BDF4 | 4 | $\mathbf{y}_{n+1} = \frac{48}{25}\mathbf{y}_n - \frac{36}{25}\mathbf{y}_{n-1} + \frac{16}{25}\mathbf{y}_{n-2} - \frac{3}{25}\mathbf{y}_{n-3} + \frac{12}{25}h\,\mathbf{f}_{n+1}$ |

Only one evaluation of $\mathbf{f}$ appears in each, at the new point, which is the reason this family and not Adams–Moulton is the basis of every production stiff solver.

Their stability is excellent but not unlimited. Put $\mathbf{y}_n = \zeta^n$ and $z = h\lambda$; the characteristic equation becomes $\sum_{j=1}^{k}\frac{1}{j}(1 - \zeta^{-1})^j = z$, and tracing $\zeta = e^{i\theta}$ around the unit circle draws the boundary of the *unstable* region. What is left is a wedge around the negative real axis: a method is **$A(\alpha)$-stable** when it is stable for every $z$ with $|\arg(-z)| \le \alpha$. Computing that angle from the boundary locus:

| Method | $\alpha$ | Note |
| --- | --- | --- |
| BDF1 | $90^\circ$ | A-stable and L-stable |
| BDF2 | $90^\circ$ | A-stable and L-stable; the highest order that can be A-stable |
| BDF3 | $86.03^\circ$ | |
| BDF4 | $73.35^\circ$ | |
| BDF5 | $51.84^\circ$ | |
| BDF6 | $17.84^\circ$ | rarely useful |
| BDF7 | — | not zero-stable: unusable at any step |

Two hard facts sit in that table. **Dahlquist's second barrier** says no A-stable linear multistep method can have order above 2, which is why BDF2 is the end of the A-stable line and the trapezoidal rule is the other endpoint. And BDF7 fails outright: the roots of its characteristic polynomial at $z = 0$ include one of modulus 1.022, so the recurrence amplifies even with no differential equation at all. That is why every BDF solver you will meet — `scipy`'s `BDF`, MATLAB's `ode15s`, the venerable LSODE and DASSL — tops out at order 5 or 6 and varies its order as it runs.

All of them are L-stable in the sense that matters: for BDF2, the two roots at $z = -1000$ have modulus $0.0223$, falling as $0.707/\sqrt{|z|}$, so a very fast mode is annihilated in a step or two while a second-order accurate slow solution is carried along.

::: key
BDF methods fit a polynomial through past values of $\mathbf{y}$ and set its derivative at $t_{n+1}$ equal to $\mathbf{f}_{n+1}$: $\sum_{j=1}^{k}\frac{1}{j}\nabla^{j}\mathbf{y}_{n+1} = h\mathbf{f}_{n+1}$. BDF1 is backward Euler; BDF2 is $\mathbf{y}_{n+1} = \frac43\mathbf{y}_n - \frac13\mathbf{y}_{n-1} + \frac23 h\mathbf{f}_{n+1}$. BDF1 and BDF2 are A-stable and L-stable; BDF3 to BDF6 are $A(\alpha)$-stable with $\alpha$ falling from $86^\circ$ to $18^\circ$; BDF7 is not zero-stable and does not exist as a usable method. Dahlquist's second barrier: no A-stable linear multistep method has order above 2.
:::

## Solving the implicit equation

Every implicit step requires solving

$$
\mathbf{G}(\mathbf{y}_{n+1}) = \mathbf{y}_{n+1} - \mathbf{y}_n - h\beta\,\mathbf{f}(t_{n+1}, \mathbf{y}_{n+1}) - (\text{known past terms}) = \mathbf{0},
$$

a nonlinear system in the state dimension, once per step. How you solve it is not a detail.

The obvious method is **fixed-point iteration**: guess $\mathbf{y}^{(0)}$, then set $\mathbf{y}^{(m+1)} = \mathbf{y}_n + h\beta\,\mathbf{f}(t_{n+1}, \mathbf{y}^{(m)})$ and repeat. It converges when the map is a contraction, that is when $h\beta\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert < 1$. On a stiff problem $\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert$ *is* $|\lambda_{\text{fast}}|$, so this condition is the explicit step limit all over again. Fixed-point iteration throws away everything the implicit method was for — and it is exactly what a predictor–corrector cycle does, which is why the PECE scheme of the previous lesson is useless on stiff problems no matter how many corrector passes you make.

The right method is **Newton**, from the root-finding lesson. With $\mathbf{J} = \partial\mathbf{f}/\partial\mathbf{y}$, the Jacobian of $\mathbf{G}$ is $\mathbf{I} - h\beta\mathbf{J}$, and each iteration solves

$$
\left(\mathbf{I} - h\beta\,\mathbf{J}\right)\boldsymbol{\delta}^{(m)} = -\mathbf{G}\!\left(\mathbf{y}^{(m)}\right),
\qquad \mathbf{y}^{(m+1)} = \mathbf{y}^{(m)} + \boldsymbol{\delta}^{(m)} .
$$

Convergence is quadratic and, crucially, has no step-size restriction: the matrix $\mathbf{I} - h\beta\mathbf{J}$ contains the stiffness rather than being defeated by it. The price is one linear solve per iteration — which is where the conditioning of that matrix starts to matter, and the last lesson of this module takes it up, along with the sparsity that makes such a solve affordable when the state is large. Three further practicalities: production solvers reuse a factorisation of $\mathbf{I} - h\beta\mathbf{J}$ across several steps because refactoring is the dominant cost (a *modified Newton* iteration, which converges linearly but quickly enough); they start Newton from the predictor polynomial, not from $\mathbf{y}_n$, so the first guess is already accurate to the method's order; and the Jacobian itself must be good, which is what makes complex-step differentiation — the subject of a later lesson in this module — worth the trouble for stiff solvers.

::: example One backward-Euler step by Newton
A thrust-vector-control gimbal servo in a launch vehicle simulation, modelled as a first-order loop with a smooth rate limit:

$$
\dot\delta = A\tanh\!\left(\frac{\delta_c - \delta}{\tau A}\right),
\qquad A = 20^\circ/\mathrm{s} = 0.349066\,\mathrm{rad/s},
\qquad \tau = 5\,\mathrm{ms} .
$$

For small errors this is a lag with time constant $\tau$, so $\lambda = -200\,\mathrm{s^{-1}}$; the vehicle's pitch dynamics it drives act over seconds. Command a step to $\delta_c = 0.1^\circ$ from $\delta_n = 0$ and take one backward-Euler step at the $50\,\mathrm{Hz}$ simulation frame, $h = 0.02\,\mathrm{s}$, so $h/\tau = 4$ — twice the explicit Euler limit.

Solve $G(\delta) = \delta - \delta_n - h\,\dot\delta(\delta) = 0$ with $G'(\delta) = 1 + (h/\tau)\,\mathrm{sech}^2\!\big((\delta_c-\delta)/(\tau A)\big)$, starting from $\delta = \delta_n$:

| iteration | $\delta$ (deg) | $G$ | correction |
| --- | --- | --- | --- |
| 0 | 0.00000000 | $-5.317\times10^{-3}$ | $+1.984\times10^{-3}$ |
| 1 | 0.11367512 | $+2.933\times10^{-3}$ | $-5.954\times10^{-4}$ |
| 2 | 0.07956365 | $-1.854\times10^{-5}$ | $+3.833\times10^{-6}$ |
| 3 | 0.07978327 | $+6.491\times10^{-9}$ | $-1.341\times10^{-9}$ |
| 4 | 0.07978320 | $+7.9\times10^{-16}$ | — |

Four iterations, with the residual squaring each time — quadratic convergence, as promised. Fixed-point iteration on the same step does not converge at all: starting from $\delta_n$ it goes $+0.305^\circ$, $-0.387^\circ$, $+0.400^\circ$, $-0.398^\circ$, $+0.400^\circ$, settling into a two-cycle, because $h\lvert\partial\dot\delta/\partial\delta\rvert = 1.68$ exceeds 1.

The payoff, frame by frame against a reference solution:

| $t$ (s) | reference (deg) | backward Euler, $h = 20\,\mathrm{ms}$ | explicit Euler, $h = 20\,\mathrm{ms}$ | explicit Euler, $h = 4\,\mathrm{ms}$ |
| --- | --- | --- | --- | --- |
| 0.02 | 0.097848 | 0.079783 | 0.304638 | 0.099925 |
| 0.04 | 0.099961 | 0.095955 | $-0.082227$ | 0.100000 |
| 0.06 | 0.099999 | 0.099191 | 0.297399 | 0.100000 |
| 0.08 | 0.100000 | 0.099838 | $-0.087458$ | 0.100000 |
| 0.10 | 0.100000 | 0.099968 | 0.294145 | 0.100000 |

Explicit Euler at the 50 Hz frame chatters between $+0.29^\circ$ and $-0.09^\circ$ indefinitely; the rate-limit nonlinearity bounds it, so it never overflows and never looks obviously wrong — it looks like a gimbal buzzing. Backward Euler at the same frame settles monotonically. Explicit Euler at 250 Hz, where $h/\tau = 0.8$ is inside the limit, is also correct — which is the other way out, and usually the cheaper one for this particular model.
:::

## What you actually do about stiffness

On the ground, in simulation and analysis, the answer is an implicit solver, and you should recognise the names. `scipy.integrate.solve_ivp` offers `Radau` (a fifth-order, L-stable implicit Runge–Kutta method, three stages, excellent on very stiff problems), `BDF` (variable-order 1 to 5, the workhorse for large systems), and `LSODA`, which detects stiffness at run time by monitoring the step the error controller wants against the step stability allows, and switches between an Adams method and a BDF method accordingly. When you do not know whether a problem is stiff, `LSODA` is the honest first try; when you know it is, `Radau` or `BDF` with an analytic Jacobian is faster.

On a flight computer, the answer is almost never an implicit method. A Newton solve per step has a data-dependent iteration count, so its worst-case execution time cannot be bounded — the same objection the adaptive-stepping lesson raised, and worse, because it applies to every step rather than to the step size. Flight software takes one of three other routes. It runs a fixed-step explicit method fast enough for the fastest mode, which is affordable when the fast mode is an actuator loop and the loop is cheap. It *removes* the fast mode from the model: if the motor current settles in 1 ms and the frame is 20 ms, replace the current dynamics by their steady-state value, $i = K\omega_b/R$, and integrate a first-order system with no stiffness at all — this is the standard quasi-steady or singular-perturbation argument, and it is why flight models of actuators are so much simpler than simulation models of the same hardware. Or it runs the fast subsystem in its own faster loop and the slow one at the outer rate, a multi-rate scheme, with the interface between them designed deliberately.

Knowing which of those three you are looking at, in someone else's flight code, is most of the skill. The tell is a comment saying the loop runs at 400 Hz "for the actuator": that is an explicit method paying the stability price, and the question to ask is whether the actuator state is needed at all.

## Check yourself

::: check
A six-degree-of-freedom launch vehicle simulation has rigid-body modes with time constants of a few seconds and a first structural bending mode at $12\,\mathrm{Hz}$ with $2\%$ damping. Estimate the stiffness ratio and the RK4 step the bending mode forces, for a 300 s ascent.
:::

::: answer
The bending mode has $\omega = 2\pi \times 12 = 75.4\,\mathrm{rad/s}$ and $\zeta = 0.02$, so its eigenvalues are $\lambda = -\zeta\omega \pm i\omega\sqrt{1-\zeta^2} = -1.51 \pm 75.4i$, of magnitude $75.4\,\mathrm{s^{-1}}$. Against a rigid-body time constant of, say, 3 s ($|\lambda| = 0.33$), the ratio of magnitudes is about 230. The mode is lightly damped, so the binding constraint is RK4's imaginary-axis limit $|z| < 2\sqrt{2} = 2.83$, giving $h < 2.83/75.4 = 37.5\,\mathrm{ms}$, or a rate above 27 Hz. That is not severe — this problem is only mildly stiff, and an explicit method at the usual few-hundred-hertz simulation rate handles it. Note that an implicit method would be the *wrong* choice here anyway: the mode is oscillatory, not decaying, and backward Euler's artificial damping would quietly delete the very dynamics the simulation exists to study.
:::

::: check
Why does adding more corrector passes to an Adams predictor–corrector scheme not make it work on a stiff problem?
:::

::: answer
A corrector pass is one step of fixed-point iteration on the implicit equation, and fixed-point iteration converges only when the map is a contraction, $h\beta\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert < 1$. On a stiff problem $\lVert\partial\mathbf{f}/\partial\mathbf{y}\rVert \approx |\lambda_{\text{fast}}|$, so that condition is precisely the explicit step restriction the implicit method was meant to escape. Iterating to convergence would give the true Adams–Moulton solution with its large stability region, but the iteration diverges before it gets there. Only a Newton iteration, which uses $\mathbf{I} - h\beta\mathbf{J}$ rather than $\mathbf{f}$ alone, converges at a stiff step size.
:::

::: check
A thermal model of an instrument has a sensor with time constant $0.5\,\mathrm{s}$ bolted to a radiator panel with time constant $2{,}000\,\mathrm{s}$, and you want 12 hours of orbital thermal cycling. Compute the stiffness ratio, the number of RK4 steps required, and the number of backward Euler steps at an accuracy-driven step of $20\,\mathrm{s}$.
:::

::: answer
$S = 2000/0.5 = 4{,}000$. RK4's real-axis limit gives $h < 2.785 \times 0.5 = 1.39\,\mathrm{s}$, so 12 hours ($43{,}200\,\mathrm{s}$) needs $43{,}200/1.39 = 31{,}000$ steps and about 124,000 force evaluations. Backward Euler at $h = 20\,\mathrm{s}$ — a hundredth of the slow time constant, plenty for the panel — needs 2,160 steps, each with a Newton solve of a two-state system: three or four iterations of a $2\times2$ solve, entirely negligible. The saving is a factor of about 15 in steps and much more in wall time, and it grows with the length of the run. Note that the sensor's $0.5\,\mathrm{s}$ response is not lost: backward Euler tracks it in quasi-steady fashion, following the panel with the correct lag once the initial transient has been damped out.
:::

::: check
Explain why the trapezoidal rule is A-stable but not L-stable, and give one situation where you would choose it over backward Euler and one where you would not.
:::

::: answer
$R(z) = (1 + z/2)/(1 - z/2)$ has $|R| < 1$ for all $\mathrm{Re}\,z < 0$, so it is A-stable. But $|R| \to 1$ as $z \to -\infty$, not 0, so a very fast mode is reflected rather than damped — the numerical solution alternates sign at close to full amplitude for hundreds of steps. Choose it when the fast dynamics are *oscillatory and physical* and you want them preserved rather than damped: an undamped structural mode, or a long orbit propagation where backward Euler's artificial dissipation would shrink the orbit. Do not choose it when the fast dynamics are a stiff transient you want removed — an actuator loop, a chemical relaxation, a thermal mass — because the ringing then contaminates the answer and looks like a physical oscillation.
:::

::: check
Your simulation of a satellite with a reaction wheel runs `solve_ivp` with the default `RK45` and takes 40 minutes to cover 200 s, with the step hovering at $2.7\,\mathrm{ms}$ even though the attitude is smooth. Diagnose it, and give two different fixes with their trade-offs.
:::

::: answer
The hovering step is the signature: the controller is not asking for accuracy, it is being held at the stability boundary of RK45's error estimate by the motor's $1\,\mathrm{ms}$ electrical mode. $2.7\,\mathrm{ms}$ is suspiciously close to $2.785/|\lambda_{\text{fast}}|$, which confirms it. Fix one: switch to `method='Radau'` or `method='BDF'` and supply the analytic Jacobian. The step then rises to whatever accuracy demands — order 1 s — and the run drops to a few hundred steps, at the cost of a linear solve per Newton iteration, which for a state of this size is free. Fix two: remove the fast mode from the model by setting the motor current to its steady-state value $i = K\omega_b/R$, leaving a first-order attitude loop with no stiffness. That is faster still and matches what the flight software will do anyway, but it discards the current transient, so it is wrong if you are sizing the motor or studying the first few milliseconds after a command. Use the reduced model for mission-length runs and the stiff solver for the short, detailed ones.
:::

## Summary

| Item | Statement |
| --- | --- |
| Stiffness | Widely separated time constants in the Jacobian's eigenvalues, $S = \tau_{\text{slow}}/\tau_{\text{fast}}$, with the interval of interest long compared with $\tau_{\text{fast}}$ |
| Symptom | An explicit method's step is set by the fastest mode for *stability*, not accuracy; the adaptive step hovers while the solution is smooth |
| Backward Euler | $\mathbf{y}_{n+1} = \mathbf{y}_n + h\mathbf{f}(t_{n+1}, \mathbf{y}_{n+1})$, order 1, $R(z) = 1/(1-z)$ |
| A-stable | Stability region contains the whole left half plane |
| L-stable | A-stable and $R(-\infty) = 0$: fast modes are annihilated, not merely bounded |
| Trapezoidal | Order 2, A-stable, $R(-\infty) = -1$: not L-stable, rings at half the frame rate |
| BDF | $\sum_{j=1}^{k}\frac{1}{j}\nabla^{j}\mathbf{y}_{n+1} = h\mathbf{f}_{n+1}$; BDF2: $\mathbf{y}_{n+1} = \frac43\mathbf{y}_n - \frac13\mathbf{y}_{n-1} + \frac23 h\mathbf{f}_{n+1}$ |
| BDF stability | BDF1, BDF2 A-stable; $A(\alpha)$ with $\alpha = 86.0^\circ, 73.4^\circ, 51.8^\circ, 17.8^\circ$ for BDF3–6; BDF7 not zero-stable |
| Dahlquist barrier | No A-stable linear multistep method has order above 2 |
| Implicit solve | Newton on $\mathbf{G} = \mathbf{0}$ with Jacobian $\mathbf{I} - h\beta\mathbf{J}$; fixed-point iteration needs $h\beta\lVert\mathbf{J}\rVert < 1$ and therefore fails on stiff problems |
| Solvers | `Radau` (implicit RK, L-stable, order 5), `BDF` (order 1–5), `LSODA` (switches automatically) |
| Flight software | Implicit methods have unbounded worst-case execution time; instead run fast enough explicitly, reduce the fast mode to quasi-steady, or use a multi-rate scheme |

The last three lessons have all been about advancing a solution in time. The next one changes the question: given a solution, or a table of measured data, how do you get a value *between* the samples — which is how an adaptive integrator produces output on a regular grid, and how every atmospheric density model in a drag calculation is evaluated.
