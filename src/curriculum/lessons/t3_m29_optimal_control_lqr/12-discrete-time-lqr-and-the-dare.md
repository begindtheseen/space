---
id: l12-discrete-time-lqr-and-the-dare
title: Discrete-time LQR and the DARE
minutes: 17
covers:
  - Discrete-time LQR and the DARE
---

Think of a movie. It looks like smooth motion, but it is really 24 still pictures a second. Between frames, nothing on the screen changes. A flight computer sees and acts on the world the same way: in frames.

Every controller in this module flies on a computer. It reads the sensors at a fixed rate. It computes for part of a cycle. It writes a command to a **[[digital-to-analog converter or a pulse-width modulator|dac-pwm]]**, and that command stays fixed until the next cycle. None of that is continuous. Once the sample period gets long enough, the continuous design stops describing what the vehicle actually does.

**Discrete-time LQR** is the version of the theory that matches the hardware. It is not a numerical approximation of the continuous problem. It is the exact solution of a different, more honest problem: choose a *sequence* of held commands to minimise a *sum*. Its backward recursion falls out of dynamic programming in a few lines. Its steady state is the **discrete algebraic Riccati equation**, the **DARE**. And its gain formula has one extra term that catches people out badly enough that the module's flashcard warns about it.

The lesson ends with two things flight software engineers actually have to decide: how fast to run, and what to do about the one-cycle delay between reading a sensor and delivering the command.

## The plant, sampled

The control is held constant over each interval of length $T$ (the **sample period**): $\mathbf{u}(t) = \mathbf{u}_k$ for $t$ from $kT$ up to $(k+1)T$. Holding like this is called a **[[zero-order hold|zero-order-hold]]**. Integrate the continuous dynamics across one interval and you get the sampled plant exactly:

$$
\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k,
\qquad
\mathbf{A}_d = e^{\mathbf{A}T},
\qquad
\mathbf{B}_d = \left(\int_0^T e^{\mathbf{A}s}\,ds\right)\mathbf{B}.
$$

Read $\mathbf{x}_k$ as "x sub k", the state at the $k$-th sample. $e^{\mathbf{A}T}$ is the **[[matrix exponential|matrix-exponential]]**: it carries the state forward one period with no input.

For the reaction-wheel axis, $\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$. Multiply it by itself and you get the zero matrix, so the exponential's series stops after two terms:

$$
\mathbf{A}_d = \begin{bmatrix}1 & T\\ 0 & 1\end{bmatrix},
\qquad
\mathbf{B}_d = \begin{bmatrix}T^2/(2J)\\ T/J\end{bmatrix} .
$$

This says something familiar. The angle moves by rate times $T$, plus the torque's own contribution, $\tfrac{1}{2}(u/J)T^2$ — the "half a t squared" from school physics. At $T = 0.05\,\mathrm{s}$ and $J = 120\,\mathrm{kg\,m^2}$, $\mathbf{B}_d = (1.0417\times10^{-5},\ 4.1667\times10^{-4})$.

Compare this with the tempting shortcut, **Euler's approximation**: $\mathbf{A}_d \approx \mathbf{I} + \mathbf{A}T$ and $\mathbf{B}_d \approx \mathbf{B}T$. For this plant $\mathbf{A}_d$ happens to equal $\mathbf{I} + \mathbf{A}T$ exactly, because the series stops — on most plants it does not. But $\mathbf{B}T = (0,\ T/J)$ loses the $T^2/2J$ term: the angle change caused by the torque *within* a single sample. That term is exactly what the controller needs to know about.

Stability moves too. A continuous pole $\mu$ becomes a discrete pole $z = e^{\mu T}$. So the stable region changes from "left half plane" ($\mathrm{Re}\,\mu < 0$) to "inside the **[[unit circle|unit-circle]]**" ($|z| < 1$). Going back, $\mu = \log(z)/T$ gives the **continuous-equivalent pole**.

## The cost, sampled

The natural discrete cost is a sum over samples:

$$
J = \mathbf{x}_N^\top\mathbf{Q}_f\mathbf{x}_N + \sum_{k=0}^{N-1}\big(\mathbf{x}_k^\top\mathbf{Q}_d\mathbf{x}_k + \mathbf{u}_k^\top\mathbf{R}_d\mathbf{u}_k\big).
$$

The practical question is how to get $\mathbf{Q}_d$ and $\mathbf{R}_d$ from the continuous weights. The simple answer is $\mathbf{Q}_d = \mathbf{Q}T$ and $\mathbf{R}_d = \mathbf{R}T$. That is the rectangle rule for approximating an integral: height times width.

The exact answer adds up the cost incurred *inside* each sample, while the state drifts and the input is held:

$$
\begin{bmatrix}\mathbf{Q}_d & \mathbf{N}_d\\ \mathbf{N}_d^\top & \mathbf{R}_d\end{bmatrix}
= \int_0^T \begin{bmatrix}\boldsymbol{\Phi}(s) & \boldsymbol{\Gamma}(s)\end{bmatrix}^\top
\begin{bmatrix}\mathbf{Q} & \mathbf{0}\\ \mathbf{0} & \mathbf{R}\end{bmatrix}
\begin{bmatrix}\boldsymbol{\Phi}(s) & \boldsymbol{\Gamma}(s)\end{bmatrix} ds,
$$

with $\boldsymbol{\Phi}(s) = e^{\mathbf{A}s}$ and $\boldsymbol{\Gamma}(s) = \int_0^s e^{\mathbf{A}\tau}d\tau\,\mathbf{B}$. It produces a cross term $\mathbf{N}_d$ even when the continuous problem had none, because inside a sample both the state and the held input feed the cost.

For the wheel axis, the gains from the two recipes agree to within about $0.05\,\%$ at every rate tried below, even at $T = 1\,\mathrm{s}$. So this lesson uses the simple scaling and calls it an approximation rather than defending it as exact. On a plant with fast modes inside one sample, the difference is real and the exact form is worth computing.

## The backward recursion and the DARE

In discrete time, dynamic programming needs no limits and no partial differential equation. Let $V_k(\mathbf{x})$ be the best cost from step $k$ to the end, with $V_N(\mathbf{x}) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$. **[[Bellman's equation|bellman]]** says: the best cost from here is the best choice of this step's cost plus the best cost from wherever that step lands you:

$$
V_k(\mathbf{x}) = \min_{\mathbf{u}}\Big[\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + V_{k+1}\big(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}\big)\Big].
$$

(From here on, $\mathbf{A}$, $\mathbf{B}$, $\mathbf{Q}$, $\mathbf{R}$ mean the discrete ones.) Guess that the cost-to-go is a bowl, $V_k(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}_k\mathbf{x}$. Then the bracket is a quadratic in $\mathbf{u}$, and its minimum is where the slope is zero:

$$
2\mathbf{R}\mathbf{u} + 2\mathbf{B}^\top\mathbf{P}_{k+1}(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}) = \mathbf{0}.
$$

Collect the $\mathbf{u}$ terms on one side:

$$
\big(\mathbf{R} + \mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\big)\mathbf{u} = -\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A}\mathbf{x}.
$$

So $\mathbf{u}_k = -\mathbf{K}_k\mathbf{x}_k$, with

$$
\mathbf{K}_k = \big(\mathbf{R} + \mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\big)^{-1}\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A} .
$$

Put this $\mathbf{u}$ back into the bracket and collect terms. You get the **backward Riccati recursion**:

$$
\mathbf{P}_k = \mathbf{Q} + \mathbf{A}^\top\mathbf{P}_{k+1}\mathbf{A} - \mathbf{A}^\top\mathbf{P}_{k+1}\mathbf{B}\big(\mathbf{R}+\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\big)^{-1}\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A},
\qquad \mathbf{P}_N = \mathbf{Q}_f .
$$

Run it backward from the end to get the finite-horizon gain schedule. Run it until it stops changing to get the infinite-horizon gain. The value it settles on is the fixed point, and the equation for that fixed point is the DARE.

::: key Discrete algebraic Riccati equation
$\mathbf{P} = \mathbf{A}^\top\mathbf{P}\mathbf{A} - \mathbf{A}^\top\mathbf{P}\mathbf{B}(\mathbf{R}+\mathbf{B}^\top\mathbf{P}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{A} + \mathbf{Q}$, with $\mathbf{K} = (\mathbf{R}+\mathbf{B}^\top\mathbf{P}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{A}$. Note the gain is **not** $\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$.
:::

Iterating the recursion is itself a perfectly good solver. Starting from $\mathbf{P}_0 = \mathbf{Q}$, it converges to the stabilizing solution under the same stabilizability and detectability conditions as the continuous case. Unlike the continuous backward sweep, it costs nothing extra: the recursion is what the designer computes anyway. Production solvers use the discrete cousin of the Hamiltonian method from lesson 3 — a **[[symplectic|symplectic]]** matrix pencil whose stable eigenvectors give $\mathbf{P}$.

::: warning The discrete gain is not the continuous formula with discrete matrices
$\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is a continuous-time result, and it is wrong in discrete time. The extra $\mathbf{B}^\top\mathbf{P}\mathbf{B}$ inside the inverse is the cost the current input will cause at the *next* step. In continuous time one step lasts zero seconds and that term vanishes. But a held command acts for a full sample.

Put numbers on it for the wheel axis at $20\,\mathrm{Hz}$. $\mathbf{R}_d = 0.078125$ and $\mathbf{B}_d^\top\mathbf{P}\mathbf{B}_d = 0.005042$, so the bracket is $6.5\,\%$ bigger than $\mathbf{R}_d$ alone. The correct gain is $(88.851,\ 147.708)$. The wrong formula gives $(94.585,\ 152.511)$: high by $6.5\,\%$ and $3.3\,\%$. That error is small enough to pass a step-response check and big enough to show up as lost margin. It grows as the sample period grows.
:::

::: example The wheel axis at seven sample rates
The continuous design is $\mathbf{K}_c = (91.673,\ 150.089)$, with closed-loop poles $-0.6254 \pm 0.6106j\,\mathrm{s^{-1}}$, $\omega_n = 0.8740\,\mathrm{rad/s}$, gain crossover at $1.3695\,\mathrm{rad/s}$, and phase margin $65.96^\circ$. Discretise with a zero-order hold, use $\mathbf{Q}_d = \mathbf{Q}T$ and $\mathbf{R}_d = \mathbf{R}T$, and solve the DARE at each rate:

| $T$ (s) | rate | $\mathbf{K}_d$ | discrete poles $z$ | $\log z/T$ $(\mathrm{s^{-1}})$ |
| --- | --- | --- | --- | --- |
| $0.005$ | $200\,\mathrm{Hz}$ | $(91.387,\ 149.849)$ | $0.9969 \pm 0.0030j$ | $-0.6254 \pm 0.6106j$ |
| $0.02$ | $50\,\mathrm{Hz}$ | $(90.534,\ 149.132)$ | $0.9875 \pm 0.0121j$ | $-0.6254 \pm 0.6106j$ |
| $0.05$ | $20\,\mathrm{Hz}$ | $(88.851,\ 147.708)$ | $0.9688 \pm 0.0296j$ | $-0.6253 \pm 0.6106j$ |
| $0.1$ | $10\,\mathrm{Hz}$ | $(86.117,\ 145.367)$ | $0.9376 \pm 0.0573j$ | $-0.6253 \pm 0.6107j$ |
| $0.2$ | $5\,\mathrm{Hz}$ | $(80.902,\ 140.803)$ | $0.8759 \pm 0.1076j$ | $-0.6250 \pm 0.6110j$ |
| $0.5$ | $2\,\mathrm{Hz}$ | $(67.142,\ 128.046)$ | $0.6983 \pm 0.2210j$ | $-0.6228 \pm 0.6130j$ |
| $1.0$ | $1\,\mathrm{Hz}$ | $(49.533,\ 109.733)$ | $0.4396 \pm 0.3142j$ | $-0.6156 \pm 0.6205j$ |

Two things are worth pausing on.

**The gain falls as the rate drops.** At $1\,\mathrm{Hz}$ it is $46\,\%$ below the continuous value ($49.5/91.7 = 0.54$). A command that will be held for a whole second must be gentler than one that will be revised in five milliseconds.

**The continuous-equivalent poles barely move.** $\log z / T$ stays within $2\,\%$ of $-0.6254 \pm 0.6106j$ across three decades of sample rate. The discrete design is not approximating the continuous one and failing gracefully. It reproduces the same closed-loop behavior with whatever authority the sample rate leaves it. That is what optimal means here.

Now try something different: keep the *continuous* gain and run it through a zero-order hold. $\mathbf{K}_c = (91.673,\ 150.089)$ stays stable only for $T < 1.599\,\mathrm{s}$ — about $4.5$ samples per closed-loop period ($2\pi/0.874 = 7.19\,\mathrm{s}$, and $7.19/1.599 = 4.5$). The margins fall apart long before that. The hold acts like about $T/2$ of pure delay, so it costs $\omega_c T/2$ of phase at crossover. At $20\,\mathrm{Hz}$ that is $1.3695 \times 0.05/2 = 0.034\,\mathrm{rad} = 2.0^\circ$, which is negligible. At $2\,\mathrm{Hz}$ it is $19.6^\circ$, dropping the margin from $66^\circ$ to about $46^\circ$. At $1\,\mathrm{Hz}$ it is $39^\circ$, and the design is in trouble.
:::

## Choosing the sample rate

Three things decide it, usually in this order.

- **Phase.** The hold costs $\omega_c T/2$ radians at crossover. Keeping that under about $5^\circ$ ($0.0873\,\mathrm{rad}$) needs $T \lesssim 0.17/\omega_c$ — about $36$ samples per cycle of the crossover frequency. The familiar aerospace rule of $20$ to $40$ samples per closed-loop period is the same calculation with slightly different tolerances.
- **The fastest mode you intend to control.** The Nyquist rate is a floor, not a target. A flexible mode at $18\,\mathrm{Hz}$ that the controller must actively damp needs several hundred hertz, not $36$.
- **[[Aliasing|aliasing]].** Anything above the **Nyquist frequency** (half the sample rate) folds down and shows up as a slow disturbance the controller will faithfully chase. An analog **anti-alias filter** in front of the sampler is not optional, and its own phase lag belongs in the first bullet.

## Computational delay

Between reading the sensor at $t_k$ and delivering the command, the processor needs time to compute. The usual and safest design delivers the command at $t_{k+1}$, because that makes the **[[timing deterministic|timing]]**. But then during the interval starting at $t_k$, the plant is still feeling $\mathbf{u}_{k-1}$. That is a one-sample delay inside the loop, and none of the algebra above covers it.

The fix is to make the delay part of the state. Carry the previously issued command as an extra state:

$$
\begin{bmatrix}\mathbf{x}_{k+1}\\ \mathbf{u}_k\end{bmatrix}
= \begin{bmatrix}\mathbf{A}_d & \mathbf{B}_d\\ \mathbf{0} & \mathbf{0}\end{bmatrix}
\begin{bmatrix}\mathbf{x}_k\\ \mathbf{u}_{k-1}\end{bmatrix}
+ \begin{bmatrix}\mathbf{0}\\ \mathbf{I}\end{bmatrix}\mathbf{v}_k .
$$

Here $\mathbf{v}_k$ is the command computed now and applied next cycle. Weight the *applied* control — the extra state $\mathbf{u}_{k-1}$ — with $\mathbf{R}_d$. Put a small weight $\varepsilon\mathbf{R}_d$ on $\mathbf{v}_k$ so the problem stays well posed ($\varepsilon$, "epsilon", is $10^{-3}$ below). Then solve the DARE on the enlarged plant.

::: example What a cycle of delay costs, designed for and ignored
The wheel axis again, with three designs at each rate: no delay at all; a delay that is modelled in the design; and a delay that is really there but ignored (the no-delay gain, run with the delay).

| $T$ | no delay, $\mathbf{K}_d$ | no-delay poles $(\mathrm{s^{-1}})$ | delay-aware $\mathbf{K}$ | delay-aware poles | ignored-delay poles |
| --- | --- | --- | --- | --- | --- |
| $0.02\,\mathrm{s}$ | $(90.53,\ 149.13)$ | $-0.6254\pm0.6106j$ | $(90.49,\ 150.90,\ 0.0250)$ | $-0.6252\pm0.6105j$ | $-0.6337\pm0.6184j$ |
| $0.1\,\mathrm{s}$ | $(86.12,\ 145.37)$ | $-0.6253\pm0.6107j$ | $(86.08,\ 153.94,\ 0.1247)$ | $-0.6251\pm0.6106j$ | $-0.6748\pm0.6571j$ |
| $0.5\,\mathrm{s}$ | $(67.14,\ 128.05)$ | $-0.6228\pm0.6130j$ | $(67.11,\ 161.58,\ 0.6033)$ | $-0.6227\pm0.6129j$ | $-0.2902\pm1.2939j$ |

**Designed for**, a known one-cycle delay costs almost nothing. The main poles move by less than $0.1\,\%$ at every rate. The optimiser sees the delay coming and puts the extra authority into the rate gain: at $2\,\mathrm{Hz}$, $k_2$ rises from $128.0$ to $161.6$ while $k_1$ stays put.

**Ignored**, the delay costs the damping. At $2\,\mathrm{Hz}$ the poles move to $-0.290 \pm 1.294j$. The damping ratio is $0.290/\sqrt{0.290^2 + 1.294^2} = 0.22$ instead of $0.71$. The loop goes unstable outright for $T > 0.702\,\mathrm{s}$ — while the same DARE design without the delay stays stable at every sample period.

The general lesson is the useful one: **a delay you model is nearly free; a delay you ignore eats your phase margin.**
:::

## Check yourself

::: check
Derive the discrete LQR gain from Bellman's equation, and explain the $\mathbf{B}^\top\mathbf{P}\mathbf{B}$ term physically.
:::

::: answer
With $V_{k+1}(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}_{k+1}\mathbf{x}$, the bracket to minimise is

$$
\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + (\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})^\top\mathbf{P}_{k+1}(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}).
$$

That is a bowl-shaped quadratic in $\mathbf{u}$, with gradient $2\mathbf{R}\mathbf{u} + 2\mathbf{B}^\top\mathbf{P}_{k+1}(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})$. Set it to zero and collect the $\mathbf{u}$ terms: $(\mathbf{R}+\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B})\mathbf{u} = -\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A}\mathbf{x}$. Hence $\mathbf{K}_k = (\mathbf{R}+\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A}$.

The $\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}$ term is the cost-to-go penalty the control creates by moving the state over one sample. Applying $\mathbf{u}$ shifts the next state by $\mathbf{B}\mathbf{u}$, which costs $\mathbf{u}^\top\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\mathbf{u}$ in the value function. So it acts as extra control weight: the effective weight is $\mathbf{R} + \mathbf{B}^\top\mathbf{P}\mathbf{B}$, not $\mathbf{R}$. In continuous time the state moves by only $\mathbf{B}\mathbf{u}\,dt$ in one instant, the matching term is of size $dt^2$, and it disappears.
:::

::: check
Your continuous design has a closed-loop natural frequency of $12\,\mathrm{rad/s}$ and a gain crossover at $18\,\mathrm{rad/s}$. Pick a sample rate and justify it.
:::

::: answer
Start from the phase budget. The hold adds about $\omega_c T/2$ of lag at crossover. Allowing $5^\circ = 0.0873\,\mathrm{rad}$ gives $T \le 2(0.0873)/18 = 9.7\,\mathrm{ms}$, which is about $100\,\mathrm{Hz}$.

Cross-check with the usual rule. The closed-loop period is $2\pi/12 = 0.524\,\mathrm{s}$, and $100\,\mathrm{Hz}$ gives $52$ samples per period. That is on the generous side of the $20$–$40$ band, which is where you want to be before the anti-alias filter takes its own share of the phase.

Then check the other two limits: whether any mode the controller must damp sits above $50\,\mathrm{Hz}$ (which would force a higher rate anyway), and what the anti-alias filter's corner does to the phase at $18\,\mathrm{rad/s}$. If the processor cannot keep up at $100\,\mathrm{Hz}$, drop to $50\,\mathrm{Hz}$, accept about $10^\circ$ of hold lag, and re-solve the DARE at that rate rather than reusing the continuous gain.
:::

::: check
Why does the discrete gain fall as the sample period grows, when the plant and the weights are unchanged?
:::

::: answer
Because the command is held for longer, so the same gain does more. A command computed from the state at $t_k$ is right at $t_k$ and gets more and more wrong as the state moves away from where it was sampled. With a long hold, an aggressive command overshoots before anyone can revise it.

The optimiser sees this directly through the $\mathbf{B}_d^\top\mathbf{P}\mathbf{B}_d$ term. It grows with $T$ because $\mathbf{B}_d$ grows with $T$, so the effective control weight rises and the gain falls. In the table, $k_1$ drops from $91.4$ at $200\,\mathrm{Hz}$ to $49.5$ at $1\,\mathrm{Hz}$.

What is striking is that the continuous-equivalent closed-loop poles barely move. The design gives up gain, not performance — which it can do only until the sample rate itself limits the achievable bandwidth.
:::

::: check
A one-cycle delay was nearly free when designed for. Does that mean sample rate does not matter for delay?
:::

::: answer
No. It means a *known, constant* delay of one cycle is cheap to compensate — and the cycle length sets how long that delay is.

At $50\,\mathrm{Hz}$ the delay is $20\,\mathrm{ms}$ and the enlarged design recovers the poles to within $0.1\,\%$. At $2\,\mathrm{Hz}$ it is $500\,\mathrm{ms}$. The design still recovers the poles, but only by buying back the phase with a rate gain raised from $128$ to $162$. That extra gain costs noise amplification and actuator activity that the pole locations do not show.

The compensation also depends on the delay being exactly what the model says. A variable delay — an interrupt that sometimes finishes late, a data bus whose latency depends on traffic — cannot be compensated this way. That is the practical reason flight software issues the command on a fixed schedule at the start of the next cycle, even when the computation finished early.
:::

::: check
Someone implements $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}_d^\top\mathbf{P}$ on a discrete plant and the loop works. Should they fix it?
:::

::: answer
Yes, and the reason it "works" is worth understanding. That formula always gives a gain that is too large, by the factor the $\mathbf{B}^\top\mathbf{P}\mathbf{B}$ term would have supplied: $6.5\,\%$ in $k_1$ at $20\,\mathrm{Hz}$ for the wheel axis, and more at slower rates because $\mathbf{B}_d$ grows with $T$.

A slightly over-gained loop is still stable and looks faster on a step response, so normal testing does not flag it. What it costs is margin — which matters least on the nominal plant and most on the real one — and it stacks with any other lag you did not model. It also means the flying controller is not the optimum of any stated cost, so the tuning story in the design documents does not describe the software.

Fix it, re-run the margin analysis, and expect the corrected loop to be slightly slower and noticeably more forgiving.
:::

## Summary

| Object | Statement |
| --- | --- |
| ZOH discretisation | $\mathbf{A}_d = e^{\mathbf{A}T}$, $\mathbf{B}_d = \big(\int_0^T e^{\mathbf{A}s}ds\big)\mathbf{B}$ |
| Double integrator | $\mathbf{A}_d = \begin{bmatrix}1&T\\0&1\end{bmatrix}$, $\mathbf{B}_d = (T^2/2J,\ T/J)^\top$ |
| Pole mapping | $z = e^{\mu T}$; stability is $\lvert z\rvert < 1$; $\mu = \log z / T$ |
| Cost weights | $\mathbf{Q}_d \approx \mathbf{Q}T$, $\mathbf{R}_d \approx \mathbf{R}T$; the exact form adds a cross term $\mathbf{N}_d$ |
| Backward recursion | $\mathbf{P}_k = \mathbf{Q} + \mathbf{A}^\top\mathbf{P}_{k+1}\mathbf{A} - \mathbf{A}^\top\mathbf{P}_{k+1}\mathbf{B}(\mathbf{R}+\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A}$ |
| DARE | The fixed point of that recursion |
| Gain | $\mathbf{K} = (\mathbf{R}+\mathbf{B}^\top\mathbf{P}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{A}$, **not** $\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ |
| Size of that error | $6.5\,\%$ in $k_1$ at $20\,\mathrm{Hz}$ on the worked plant, growing with $T$ |
| Sample rate | $\omega_c T/2$ of hold lag; $20$–$40$ samples per closed-loop period; plus Nyquist and aliasing |
| Continuous gain sampled | Stable only for $T < 1.599\,\mathrm{s}$ on the worked plant, with margins gone well before |
| Delay augmentation | Carry $\mathbf{u}_{k-1}$ as a state; $\mathbf{A}_a = \begin{bmatrix}\mathbf{A}_d & \mathbf{B}_d\\ \mathbf{0} & \mathbf{0}\end{bmatrix}$, $\mathbf{B}_a = \begin{bmatrix}\mathbf{0}\\ \mathbf{I}\end{bmatrix}$ |
| Delay cost | Modelled: poles move under $0.1\,\%$. Ignored: $\zeta$ from $0.71$ to $0.22$ at $2\,\mathrm{Hz}$, unstable beyond $T = 0.702\,\mathrm{s}$ |

The next lesson steps back from the linear quadratic case and places it inside the general theory of optimal control, where finding the best control is no longer a matter of setting a derivative to zero.

::: context dac-pwm How a number becomes a push
A computer outputs numbers, but a motor needs a voltage. A digital-to-analog converter turns each number into a voltage and holds it until the next one. A pulse-width modulator instead switches full power on and off very fast, and the fraction of time it is on sets the average push — like flicking a light switch fast enough that the room looks dimmed. Either way, the command is frozen between updates.
:::

::: context zero-order-hold Holding the command like a staircase
The smooth curve is what a continuous controller would ask for. The staircase is what a sampled controller actually delivers: each value is held flat for one period. On average the staircase lags the curve by half a step, which is where the $T/2$ delay comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2.5" points="30.0,100.0 37.5,90.4 45.0,81.6 52.5,73.9 60.0,67.5 67.5,62.5 75.0,59.2 82.5,57.6 90.0,57.7 97.5,59.3 105.0,62.5 112.5,66.9 120.0,72.5 127.5,78.8 135.0,85.7 142.5,92.9 150.0,100.0 157.5,106.8 165.0,113.2 172.5,118.7 180.0,123.3 187.5,126.8 195.0,129.2 202.5,130.4 210.0,130.3 217.5,129.1 225.0,126.9 232.5,123.7 240.0,119.7 247.5,115.2 255.0,110.2 262.5,105.1 270.0,100.0 277.5,95.1 285.0,90.6 292.5,86.6 300.0,83.3 307.5,80.8 315.0,79.1 322.5,78.2 330.0,78.3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30.0,100.0 60.0,100.0 60.0,67.5 90.0,67.5 90.0,57.7 120.0,57.7 120.0,72.5 150.0,72.5 150.0,100.0 180.0,100.0 180.0,123.3 210.0,123.3 210.0,130.3 240.0,130.3 240.0,119.7 270.0,119.7 270.0,100.0 300.0,100.0 300.0,83.3 330.0,83.3"/>
  <g fill="#1d6fd1"><circle cx="30" cy="100" r="3"/><circle cx="60" cy="67.5" r="3"/><circle cx="90" cy="57.7" r="3"/><circle cx="120" cy="72.5" r="3"/><circle cx="150" cy="100" r="3"/><circle cx="180" cy="123.3" r="3"/><circle cx="210" cy="130.3" r="3"/><circle cx="240" cy="119.7" r="3"/><circle cx="270" cy="100" r="3"/><circle cx="300" cy="83.3" r="3"/></g>
  <text x="30" y="28" font-size="11" fill="#1f2a44">light: wanted command · dark: held samples</text>
  <text x="60" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">t₁</text>
  <text x="90" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">t₂</text>
  <text x="120" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">t₃</text>
  <text x="195" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">one period T per step</text>
</svg>
```
:::

::: context matrix-exponential The exponential of a matrix
For a single number, $e^{aT} = 1 + aT + (aT)^2/2 + \dots$ The matrix version uses the same series with powers of $\mathbf{A}T$. It answers "if nothing pushes, where does the state go in $T$ seconds?" For most matrices the series never stops and computers evaluate it by cleverer methods (SciPy's `expm`). For the double integrator, $\mathbf{A}^2 = \mathbf{0}$, so it stops after two terms.
:::

::: context unit-circle Where the discrete poles sit
The upper halves of the discrete poles from the seven-rate table (four shown), on the unit circle. As the sample period grows, the poles slide along the curve $z = e^{\mu T}$ traced by the continuous design's pole $\mu = -0.6254 + 0.6106j$ — and stay almost exactly on it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="205" x2="355" y2="205" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M350,205 A180,180 0 0,0 170,25" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2" points="350.0,205.0 344.4,199.7 338.8,194.7 333.2,190.0 327.7,185.7 322.2,181.6 316.7,177.8 311.3,174.3 306.0,171.1 300.8,168.1 295.6,165.4 290.5,162.9 285.5,160.7 280.6,158.7 275.7,156.8 271.0,155.2 266.4,153.8 261.9,152.5 257.4,151.5 253.1,150.5 248.9,149.8 244.8,149.2 240.8,148.7 236.9,148.4 233.2,148.2 229.5,148.1 226.0,148.1"/>
  <g fill="#b4232c"><circle cx="344.4" cy="199.7" r="4"/><circle cx="327.7" cy="185.6" r="4"/><circle cx="295.7" cy="165.2" r="4"/><circle cx="249.1" cy="148.4" r="4"/></g>
  <text x="340" y="186" font-size="11" text-anchor="end" fill="#b4232c">0.05 s</text>
  <text x="322" y="176" font-size="11" text-anchor="end" fill="#b4232c">0.2 s</text>
  <text x="295" y="156" font-size="11" text-anchor="middle" fill="#b4232c">0.5 s</text>
  <text x="249" y="139" font-size="11" text-anchor="middle" fill="#b4232c">1 s</text>
  <text x="170" y="218" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="350" y="218" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="178" y="40" font-size="11" fill="#1f2a44">|z| = 1</text>
  <line x1="170" y1="200" x2="170" y2="210" stroke="#1f2a44"/>
</svg>
```

Drawn at 180 pixels per unit. Inside the arc is stable; every pole is well inside.
:::

::: context bellman The name "dynamic programming"
Richard Bellman developed the method at the RAND Corporation in the early 1950s. In his autobiography he wrote that he chose the name partly because it sounded impressive and hard to object to at a time when "mathematical research" was not popular with the officials funding it. "Programming" meant planning, as in a schedule, not writing code.
:::

::: context symplectic A word from mechanics
A symplectic matrix preserves a special kind of area in the paired state-costate space, the way the motion of a frictionless pendulum preserves area in position-momentum space. For the DARE it means the eigenvalues come in pairs $z$ and $1/z$: one inside the unit circle, one outside. The solver keeps the inside ones, the same way the continuous Hamiltonian method keeps the left-half-plane ones.
:::

::: context aliasing The wagon-wheel effect
In old Western movies, a stagecoach's wheels sometimes seem to turn slowly backward. The camera samples 24 times a second, and a spoke pattern turning a little *less* than one spoke-gap per frame looks like it is creeping in reverse. A sampled controller is fooled the same way: vibration above half the sample rate shows up as a slow, fake motion. The only cure is to filter it out before the sampler sees it.
:::

::: context timing Why late on purpose beats early by chance
It feels wasteful to hold a finished command until the next tick. But a command that goes out whenever the computation happens to finish arrives with a delay that varies from cycle to cycle, and a varying delay cannot be modelled. A fixed one-cycle delay can, as the next example shows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="345" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="345,70 335,65 335,75" fill="#1f2a44"/>
  <line x1="40" y1="62" x2="40" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="62" x2="180" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="320" y1="62" x2="320" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="94" font-size="12" text-anchor="middle" fill="#1f2a44">tₖ</text>
  <text x="180" y="94" font-size="12" text-anchor="middle" fill="#1f2a44">tₖ₊₁</text>
  <text x="320" y="94" font-size="12" text-anchor="middle" fill="#1f2a44">tₖ₊₂</text>
  <rect x="44" y="40" width="90" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="89" y="55" font-size="11" text-anchor="middle" fill="#1f2a44">compute</text>
  <text x="40" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">read sensor</text>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#b4232c">apply command</text>
  <line x1="180" y1="36" x2="180" y2="58" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,62 175,52 185,52" fill="#b4232c"/>
  <text x="180" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">exactly one period T late, every cycle</text>
</svg>
```
:::
