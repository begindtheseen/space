---
id: l12-discrete-time-lqr-and-the-dare
title: Discrete-time LQR and the DARE
minutes: 18
covers:
  - Discrete-time LQR and the DARE
---

Every controller in this module flies on a computer. It reads sensors at a fixed rate, computes for some fraction of a cycle, writes a command to a digital-to-analogue converter or a pulse-width modulator, and that command is held constant until the next cycle. Nothing about that is continuous, and beyond a certain sample period the continuous design stops describing what the vehicle does.

Discrete-time LQR is the version of the theory that matches the hardware. It is not a numerical approximation of the continuous problem — it is the exact solution of a different, and more honest, problem: choose a sequence of held commands to minimise a sum. The backward recursion falls out of dynamic programming in four lines, its steady state is the discrete algebraic Riccati equation, and the gain formula has one term that catches people out badly enough that the module's flashcard says so explicitly.

The lesson also covers the two things a flight software engineer actually has to decide: how fast to run, and what to do about the cycle of delay between reading a sensor and delivering the command.

## The plant, sampled

The control is held constant over each interval, $\mathbf{u}(t) = \mathbf{u}_k$ for $t \in [kT, (k+1)T)$. Integrating the continuous dynamics across one interval gives the **zero-order-hold** discretisation exactly:

$$
\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k,
\qquad
\mathbf{A}_d = e^{\mathbf{A}T},
\qquad
\mathbf{B}_d = \left(\int_0^T e^{\mathbf{A}s}\,ds\right)\mathbf{B}.
$$

For the reaction-wheel axis, $\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$ is nilpotent, so the exponential terminates:

$$
\mathbf{A}_d = \begin{bmatrix}1 & T\\ 0 & 1\end{bmatrix},
\qquad
\mathbf{B}_d = \begin{bmatrix}T^2/(2J)\\ T/J\end{bmatrix} .
$$

At $T = 0.05\,\mathrm{s}$ and $J = 120$, $\mathbf{B}_d = (1.0417\times10^{-5},\ 4.1667\times10^{-4})$. Note that $\mathbf{A}_d$ is not $\mathbf{I} + \mathbf{A}T$ and $\mathbf{B}_d$ is not $\mathbf{B}T$; the Euler approximation loses the $T^2/2J$ term, which is the position change produced by the torque within a single sample, and that term is exactly what the controller needs to know about.

Stability moves from the left half plane to the unit disc: a continuous eigenvalue $\mu$ maps to a discrete one $z = e^{\mu T}$, so $\mathrm{Re}\,\mu < 0$ becomes $|z| < 1$, and $\mu = \log(z)/T$ recovers the continuous-equivalent pole.

## The cost, sampled

The natural discrete cost is a sum,

$$
J = \mathbf{x}_N^\top\mathbf{Q}_f\mathbf{x}_N + \sum_{k=0}^{N-1}\big(\mathbf{x}_k^\top\mathbf{Q}_d\mathbf{x}_k + \mathbf{u}_k^\top\mathbf{R}_d\mathbf{u}_k\big),
$$

and the practical question is how to get $\mathbf{Q}_d$ and $\mathbf{R}_d$ from the continuous weights. The simple answer, $\mathbf{Q}_d = \mathbf{Q}T$ and $\mathbf{R}_d = \mathbf{R}T$, is a rectangle rule on the continuous integral. The exact answer accumulates the cost incurred *within* each sample, which for held controls gives

$$
\begin{bmatrix}\mathbf{Q}_d & \mathbf{N}_d\\ \mathbf{N}_d^\top & \mathbf{R}_d\end{bmatrix}
= \int_0^T \begin{bmatrix}\boldsymbol{\Phi}(s) & \boldsymbol{\Gamma}(s)\end{bmatrix}^\top
\begin{bmatrix}\mathbf{Q} & \mathbf{0}\\ \mathbf{0} & \mathbf{R}\end{bmatrix}
\begin{bmatrix}\boldsymbol{\Phi}(s) & \boldsymbol{\Gamma}(s)\end{bmatrix} ds,
$$

with $\boldsymbol{\Phi}(s) = e^{\mathbf{A}s}$ and $\boldsymbol{\Gamma}(s) = \int_0^s e^{\mathbf{A}\tau}d\tau\,\mathbf{B}$ — and it produces a cross term $\mathbf{N}_d$ even when the continuous problem had none, because within a sample the state and the held input both contribute. For the wheel axis the two recipes agree to four or five significant figures at every rate tried below, including $T = 1\,\mathrm{s}$, so the simple scaling is used here and noted as an approximation rather than defended as exact. On a plant with fast modes inside a sample the difference is real and the exact form is worth the quadrature.

## The backward recursion and the DARE

Dynamic programming in discrete time needs no limits and no partial differential equation. Let $V_k(\mathbf{x})$ be the optimal cost from step $k$ to the end, with $V_N(\mathbf{x}) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$. Bellman's equation is

$$
V_k(\mathbf{x}) = \min_{\mathbf{u}}\Big[\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + V_{k+1}\big(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}\big)\Big].
$$

Try $V_k(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}_k\mathbf{x}$. The bracket is quadratic in $\mathbf{u}$, so setting its gradient to zero,

$$
2\mathbf{R}\mathbf{u} + 2\mathbf{B}^\top\mathbf{P}_{k+1}(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}) = \mathbf{0}
\quad\Longrightarrow\quad
\big(\mathbf{R} + \mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\big)\mathbf{u} = -\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A}\mathbf{x},
$$

so $\mathbf{u}_k = -\mathbf{K}_k\mathbf{x}_k$ with

$$
\mathbf{K}_k = \big(\mathbf{R} + \mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\big)^{-1}\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A} .
$$

Substituting back and collecting gives the **backward Riccati recursion**

$$
\mathbf{P}_k = \mathbf{Q} + \mathbf{A}^\top\mathbf{P}_{k+1}\mathbf{A} - \mathbf{A}^\top\mathbf{P}_{k+1}\mathbf{B}\big(\mathbf{R}+\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\big)^{-1}\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A},
\qquad \mathbf{P}_N = \mathbf{Q}_f .
$$

Run it backwards from the terminal condition for the finite-horizon schedule; run it until it stops changing for the infinite-horizon gain, whose fixed point is the **discrete algebraic Riccati equation**.

::: key Discrete algebraic Riccati equation
$\mathbf{P} = \mathbf{A}^\top\mathbf{P}\mathbf{A} - \mathbf{A}^\top\mathbf{P}\mathbf{B}(\mathbf{R}+\mathbf{B}^\top\mathbf{P}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{A} + \mathbf{Q}$, with $\mathbf{K} = (\mathbf{R}+\mathbf{B}^\top\mathbf{P}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{A}$. Note the gain is **not** $\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$.
:::

Iterating the recursion is itself a perfectly usable solver — it converges to the stabilizing solution from $\mathbf{P}_0 = \mathbf{Q}$ under the same stabilizability and detectability conditions as the continuous case, and unlike the continuous backward sweep it costs nothing extra, because the recursion is what the controller's designer would compute anyway. Production solvers use the discrete analogue of the Hamiltonian method: a symplectic matrix pencil whose stable generalised eigenvectors give $\mathbf{P}$.

::: warning The discrete gain is not the continuous formula with discrete matrices
$\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is a continuous-time result and it is wrong in discrete time. The extra $\mathbf{B}^\top\mathbf{P}\mathbf{B}$ inside the inverse is the cost the current input will incur at the *next* step — in continuous time a single step has zero duration and the term vanishes, but a held command acts for a full sample. Concretely, for the wheel axis at $20\,\mathrm{Hz}$: $\mathbf{R}_d = 0.078125$, $\mathbf{B}_d^\top\mathbf{P}\mathbf{B}_d = 0.005042$, so the denominator is $6.5\,\%$ larger than $\mathbf{R}_d$ alone. The correct gain is $(88.851,\ 147.708)$; the wrong formula gives $(94.585,\ 152.511)$, high by $6.5\,\%$ and $3.3\,\%$. That is a small enough error to pass a step-response check and a large enough one to show up as reduced margin, and it gets larger as the sample period grows.
:::

::: example The wheel axis at seven sample rates
Continuous design: $\mathbf{K}_c = (91.673,\ 150.089)$, closed-loop poles $-0.6254 \pm 0.6106j\,\mathrm{s^{-1}}$, $\omega_n = 0.8740\,\mathrm{rad/s}$, gain crossover $1.3695\,\mathrm{rad/s}$, phase margin $65.96^\circ$. Discretising with zero-order hold and $\mathbf{Q}_d = \mathbf{Q}T$, $\mathbf{R}_d = \mathbf{R}T$:

| $T$ (s) | rate | $\mathbf{K}_d$ | discrete poles $z$ | $\log z/T$ $(\mathrm{s^{-1}})$ |
| --- | --- | --- | --- | --- |
| $0.005$ | $200\,\mathrm{Hz}$ | $(91.387,\ 149.849)$ | $0.9969 \pm 0.0030j$ | $-0.6254 \pm 0.6106j$ |
| $0.02$ | $50\,\mathrm{Hz}$ | $(90.534,\ 149.132)$ | $0.9875 \pm 0.0121j$ | $-0.6254 \pm 0.6106j$ |
| $0.05$ | $20\,\mathrm{Hz}$ | $(88.851,\ 147.708)$ | $0.9688 \pm 0.0296j$ | $-0.6253 \pm 0.6106j$ |
| $0.1$ | $10\,\mathrm{Hz}$ | $(86.117,\ 145.367)$ | $0.9376 \pm 0.0573j$ | $-0.6253 \pm 0.6107j$ |
| $0.2$ | $5\,\mathrm{Hz}$ | $(80.902,\ 140.803)$ | $0.8759 \pm 0.1076j$ | $-0.6250 \pm 0.6110j$ |
| $0.5$ | $2\,\mathrm{Hz}$ | $(67.142,\ 128.046)$ | $0.6983 \pm 0.2210j$ | $-0.6228 \pm 0.6130j$ |
| $1.0$ | $1\,\mathrm{Hz}$ | $(49.533,\ 109.733)$ | $0.4396 \pm 0.3142j$ | $-0.6156 \pm 0.6205j$ |

Two things are worth pausing on. The gain falls steadily as the rate drops — at $1\,\mathrm{Hz}$ it is $46\,\%$ below the continuous value — because a command that will be held for a whole second must be less aggressive than one that will be revised in five milliseconds. And the *continuous-equivalent poles* barely move: $\log z / T$ stays within $2\,\%$ of $-0.6254 \pm 0.6106j$ across three decades of sample rate. The discrete design is not approximating the continuous one and failing gracefully; it is reproducing the same closed-loop behaviour with whatever authority the sample rate leaves it, which is what optimality means here.

Holding the *continuous* gain and sampling it is a different story. Applied through a zero-order hold, $\mathbf{K}_c = (91.673,\ 150.089)$ stays stable only for $T < 1.599\,\mathrm{s}$, about $4.5$ samples per closed-loop period, and the margins degrade long before that. The zero-order hold contributes roughly $T/2$ of pure delay, so the phase margin loses $\omega_c T/2$: at $20\,\mathrm{Hz}$ that is $2.0^\circ$ (negligible), at $2\,\mathrm{Hz}$ it is $19.6^\circ$, dropping the margin from $66^\circ$ to about $46^\circ$, and at $1\,\mathrm{Hz}$ it is $39^\circ$ and the design is in trouble.
:::

## Choosing the sample rate

Three considerations, in the order they usually bind.

- **Phase.** The hold costs $\omega_c T/2$ radians of phase at crossover. Keeping that below about $5^\circ$ needs $T \lesssim 0.17/\omega_c$, which is roughly $35$ samples per closed-loop period. The familiar aerospace rule of $20$ to $40$ samples per period is this calculation with different tolerances.
- **The fastest mode you intend to control.** Nyquist is a floor, not a target: a flexible mode at $18\,\mathrm{Hz}$ that the controller must actively damp needs several hundred hertz, not $36$.
- **Aliasing.** Anything above the Nyquist frequency folds down and appears as a low-frequency disturbance the controller will faithfully chase. An analogue anti-alias filter ahead of the sampler is not optional, and it adds phase of its own that belongs in the first bullet.

## Computational delay

Between reading the sensor at $t_k$ and delivering the command, the processor has to compute. If the command is delivered at $t_{k+1}$ — the usual, and safest, design, because it makes the timing deterministic — the plant sees $\mathbf{u}_{k-1}$ during the interval starting at $t_k$. That is a one-sample transport delay inside the loop, and it is not covered by any of the algebra above.

The fix is a state augmentation. Carry the previously issued command as a state:

$$
\begin{bmatrix}\mathbf{x}_{k+1}\\ \mathbf{u}_k\end{bmatrix}
= \begin{bmatrix}\mathbf{A}_d & \mathbf{B}_d\\ \mathbf{0} & \mathbf{0}\end{bmatrix}
\begin{bmatrix}\mathbf{x}_k\\ \mathbf{u}_{k-1}\end{bmatrix}
+ \begin{bmatrix}\mathbf{0}\\ \mathbf{I}\end{bmatrix}\mathbf{v}_k ,
$$

where $\mathbf{v}_k$ is the command computed now and applied next cycle. Weight the *applied* control — the augmented state $\mathbf{u}_{k-1}$ — with $\mathbf{R}_d$, put a small regularising weight $\varepsilon\mathbf{R}_d$ on $\mathbf{v}_k$, and solve the DARE on the augmented plant.

::: example What a cycle of delay costs, designed for and ignored
Wheel axis again, comparing three designs at each rate.

| $T$ | no delay, $\mathbf{K}_d$ | no-delay poles $(\mathrm{s^{-1}})$ | delay-aware $\mathbf{K}$ | delay-aware poles | ignored-delay poles |
| --- | --- | --- | --- | --- | --- |
| $0.02\,\mathrm{s}$ | $(90.53,\ 149.13)$ | $-0.6254\pm0.6106j$ | $(90.49,\ 150.90,\ 0.0250)$ | $-0.6252\pm0.6105j$ | $-0.6337\pm0.6184j$ |
| $0.1\,\mathrm{s}$ | $(86.12,\ 145.37)$ | $-0.6253\pm0.6107j$ | $(86.08,\ 153.94,\ 0.1247)$ | $-0.6251\pm0.6106j$ | $-0.6748\pm0.6571j$ |
| $0.5\,\mathrm{s}$ | $(67.14,\ 128.05)$ | $-0.6228\pm0.6130j$ | $(67.11,\ 161.58,\ 0.6033)$ | $-0.6227\pm0.6129j$ | $-0.2902\pm1.2939j$ |

Designed for, a known one-cycle delay costs almost nothing: the dominant poles move by less than $0.1\,\%$ at every rate, because the optimiser anticipates the delay and puts the extra authority into the rate gain — note $k_2$ rising from $128.0$ to $161.6$ at $2\,\mathrm{Hz}$ while $k_1$ is unchanged. Ignored, it costs the damping: at $2\,\mathrm{Hz}$ the poles move to $-0.290 \pm 1.294j$, a damping ratio of $0.22$ instead of $0.71$, and the loop goes unstable outright for $T > 0.702\,\mathrm{s}$ — a factor of $2.3$ less sample-period margin than the same design with no delay. The general result is the useful one: **a delay you model is nearly free; a delay you ignore eats your phase margin.**
:::

## Check yourself

::: check
Derive the discrete LQR gain from Bellman's equation, and explain the $\mathbf{B}^\top\mathbf{P}\mathbf{B}$ term physically.
:::

::: answer
With $V_{k+1}(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}_{k+1}\mathbf{x}$, the bracket to minimise is $\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + (\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})^\top\mathbf{P}_{k+1}(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})$, a convex quadratic in $\mathbf{u}$ whose gradient is $2\mathbf{R}\mathbf{u} + 2\mathbf{B}^\top\mathbf{P}_{k+1}(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})$. Setting it to zero and collecting the $\mathbf{u}$ terms gives $(\mathbf{R}+\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B})\mathbf{u} = -\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A}\mathbf{x}$, hence $\mathbf{K}_k = (\mathbf{R}+\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{A}$. The $\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}$ term is the cost-to-go penalty the control itself generates by moving the state over one sample: applying $\mathbf{u}$ shifts the next state by $\mathbf{B}\mathbf{u}$, which costs $\mathbf{u}^\top\mathbf{B}^\top\mathbf{P}_{k+1}\mathbf{B}\mathbf{u}$ in the value function. It therefore acts as extra control weight, and the effective weight is $\mathbf{R} + \mathbf{B}^\top\mathbf{P}\mathbf{B}$ rather than $\mathbf{R}$. In continuous time the state moves by $\mathbf{B}\mathbf{u}\,dt$ in one instant, the corresponding term is $O(dt^2)$, and it disappears.
:::

::: check
Your continuous design has a closed-loop natural frequency of $12\,\mathrm{rad/s}$ and a gain crossover at $18\,\mathrm{rad/s}$. Pick a sample rate and justify it.
:::

::: answer
Start from the phase budget. The hold contributes about $\omega_c T/2$ of lag at crossover, so allowing $5^\circ = 0.0873\,\mathrm{rad}$ gives $T \le 2(0.0873)/18 = 9.7\,\mathrm{ms}$, that is about $100\,\mathrm{Hz}$. Cross-check against the usual rule: the closed-loop period is $2\pi/12 = 0.524\,\mathrm{s}$, and $100\,\mathrm{Hz}$ gives $52$ samples per period, comfortably inside the $20$–$40$ band and on the generous side, which is where you want to be before the anti-alias filter takes its own share of the phase. Then check the other two constraints: whether any mode the controller must damp sits above $50\,\mathrm{Hz}$, which would force a higher rate regardless, and what the anti-alias filter's corner does to the phase at $18\,\mathrm{rad/s}$. If the processor cannot sustain $100\,\mathrm{Hz}$, drop to $50\,\mathrm{Hz}$, accept about $10^\circ$ of hold lag, and re-solve the DARE at that rate rather than reusing the continuous gain.
:::

::: check
Why does the discrete gain fall as the sample period grows, when the plant and the weights are unchanged?
:::

::: answer
Because the command is held for longer, so the same gain does more. A command computed from the state at $t_k$ is correct at $t_k$ and increasingly wrong as the state moves away from where it was sampled; with a long hold, an aggressive command overshoots before anyone can revise it. The optimiser sees this directly through the $\mathbf{B}_d^\top\mathbf{P}\mathbf{B}_d$ term, which grows with $T$ because $\mathbf{B}_d$ grows with $T$, so the effective control weight rises and the gain falls. In the table, $k_1$ drops from $91.4$ at $200\,\mathrm{Hz}$ to $49.5$ at $1\,\mathrm{Hz}$. What is striking is that the closed-loop continuous-equivalent poles barely move: the design gives up gain rather than performance, which it can do only up to the point where the sample rate itself limits the achievable bandwidth.
:::

::: check
A one-cycle delay was nearly free when designed for. Does that mean sample rate does not matter for delay?
:::

::: answer
No — it means a *known, constant* delay of one cycle is cheap to compensate, and the cycle length is what sets how long that delay is. At $50\,\mathrm{Hz}$ the delay is $20\,\mathrm{ms}$ and the augmented design recovers the poles to within $0.1\,\%$; at $2\,\mathrm{Hz}$ it is $500\,\mathrm{ms}$ and it still recovers the poles, but only by buying back the phase with a rate gain raised from $128$ to $162$, and that extra gain costs noise amplification and actuator activity that the pole locations do not show. The compensation also depends on the delay being exactly what the model says. A variable delay — an interrupt that sometimes finishes late, a bus whose latency depends on traffic — cannot be compensated this way, which is the practical reason flight software issues the command on a fixed schedule at the start of the next cycle even when the computation finished early.
:::

::: check
Someone implements $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}_d^\top\mathbf{P}$ on a discrete plant and the loop works. Should they fix it?
:::

::: answer
Yes, and the reason it "works" is instructive. That formula always returns a gain that is too large, by the factor the $\mathbf{B}^\top\mathbf{P}\mathbf{B}$ term would have supplied — $6.5\,\%$ in $k_1$ at $20\,\mathrm{Hz}$ for the wheel axis, and more at slower rates because $\mathbf{B}_d$ grows with $T$. A slightly over-gained loop is still stable and looks faster on a step response, so nothing in normal testing flags it. What it costs is margin, in the direction that matters least on a nominal plant and most on a real one, and it compounds with any other unmodelled lag. It also means the implemented controller is not the optimum of any stated cost, so the tuning story in the design documentation is not describing the software. Fix it, re-run the margin analysis, and expect the corrected loop to be marginally slower and noticeably more forgiving.
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

The next lesson steps back from the linear quadratic case and places it inside the general theory of optimal control, where the minimisation over the control is no longer a matter of setting a derivative to zero.
