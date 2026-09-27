---
id: l04-hinf-synthesis-mixed-sensitivity
title: H-infinity synthesis and mixed sensitivity
minutes: 22
covers:
  - 'H-infinity synthesis: mixed sensitivity S/KS/T weighting, the two-Riccati (DGKF) solution'
---

Imagine planning a school trip with a list of rules. The bus must leave by eight. The cost must stay under twenty dollars each. Nobody may ride longer than two hours. You could check each rule one at a time. Or you could hand the whole list to someone and ask: "Find me the plan that breaks the rules least, and tell me by how much the worst rule is broken." One number comes back. Below one, every rule is met. Above one, the worst rule is missed by that factor.

That is **H-infinity synthesis**. Up to now the H-infinity norm has been a *test*: you had a closed loop, you computed its peak gain, and you checked that the number was below one. Synthesis turns the test into a *goal*. You write every specification — tracking accuracy, disturbance rejection, actuator effort, roll-off, robustness — as a weight on one closed-loop transfer function. You stack the weighted functions into one matrix. Then you ask an algorithm for the controller that makes the H-infinity norm of the stack as small as possible. The number it returns, $\gamma$ (the Greek letter "gamma"), is a scorecard for every specification at once.

What makes this practical, not merely elegant, is that the search has a solution in closed form, apart from a search over one number. The [[Doyle–Glover–Khargonekar–Francis result of 1989|dgkf-paper]] — the "two-Riccati" or **DGKF** solution — reduced the whole problem to two algebraic Riccati equations the same size as the plant, plus one condition linking their solutions. That is why it runs in milliseconds on problems with dozens of states and sits in the standard toolkit next to LQG.

Here you will set the problem up, turn specifications into weights, meet the DGKF solution, and read $\gamma$ on real designs — including one you can solve by hand.

## The generalised plant

Every H-infinity problem is put into one shape first. Think of a wiring diagram with exactly two plugs on each side.

- $w$ is every outside input you do not control: references, disturbances, sensor noise. These are the **exogenous inputs** — "exogenous" means "coming from outside".
- $z$ is every signal you want kept small, each already multiplied by its weight. These are the **performance outputs**.
- $v$ is what the controller measures.
- $u$ is what the controller commands.

The fixed wiring of plant and weights is the **[[generalised plant|generalised-plant]]** $\mathbf{P}(s)$. It maps the two inputs to the two outputs:

$$\begin{pmatrix} z \\ v\end{pmatrix} = \mathbf{P}(s)\begin{pmatrix} w \\ u\end{pmatrix} = \begin{pmatrix}\mathbf{P}_{11} & \mathbf{P}_{12} \\ \mathbf{P}_{21} & \mathbf{P}_{22}\end{pmatrix}\begin{pmatrix} w \\ u\end{pmatrix}, \qquad u = \mathbf{K}(s)\,v .$$

Read $\mathbf{P}_{12}$ as "P one two": the part of $\mathbf{P}$ that carries $u$ (input 2) to $z$ (output 1). The controller $\mathbf{K}$ closes the bottom loop, from $v$ back to $u$.

Now eliminate $u$ and $v$. What is left is the closed-loop map from $w$ to $z$. It is called the **[[lower linear fractional transformation|lft-name]]**, written $\mathcal{F}_l$ ("F sub l", the l for "lower", because $\mathbf{K}$ closes the lower loop):

$$\mathbf{N} = \mathcal{F}_l(\mathbf{P}, \mathbf{K}) = \mathbf{P}_{11} + \mathbf{P}_{12}\mathbf{K}(\mathbf{I} - \mathbf{P}_{22}\mathbf{K})^{-1}\mathbf{P}_{21}.$$

The problem is: over all $\mathbf{K}$ that stabilise the loop internally (no signal anywhere inside the loop can grow without bound), make $\lVert\mathbf{N}\rVert_\infty$ as small as possible.

This is the same algebraic object as the $\mathbf{M}$–$\boldsymbol{\Delta}$ loop of the small gain lesson, with the roles swapped. There the unknown block closed the loop. Here the controller does. That match is what lets the same machinery both test robustness and design controllers.

::: note Why it has to be true: where the formula comes from
Write the two rows out. The bottom row says $v = \mathbf{P}_{21}w + \mathbf{P}_{22}u$, and the controller says $u = \mathbf{K}v$. Substitute the second into the first:

$$v = \mathbf{P}_{21}w + \mathbf{P}_{22}\mathbf{K}v \quad\Longrightarrow\quad (\mathbf{I} - \mathbf{P}_{22}\mathbf{K})v = \mathbf{P}_{21}w \quad\Longrightarrow\quad v = (\mathbf{I} - \mathbf{P}_{22}\mathbf{K})^{-1}\mathbf{P}_{21}w .$$

So $u = \mathbf{K}(\mathbf{I} - \mathbf{P}_{22}\mathbf{K})^{-1}\mathbf{P}_{21}w$. The top row, $z = \mathbf{P}_{11}w + \mathbf{P}_{12}u$, then gives the formula for $\mathbf{N}$ above. That is all.
:::

## Mixed sensitivity: the S/KS/T stack

Three closed-loop functions tell you almost everything about a single feedback loop. All three come from the **loop gain** $\mathbf{L} = \mathbf{G}\mathbf{K}$ — plant times controller:

$$\mathbf{S} = (\mathbf{I} + \mathbf{L})^{-1}, \qquad \mathbf{K}\mathbf{S}, \qquad \mathbf{T} = \mathbf{L}(\mathbf{I} + \mathbf{L})^{-1} = \mathbf{I} - \mathbf{S}.$$

- The **sensitivity** $\mathbf{S}$ maps a reference to the tracking error, and an output disturbance to the output. Small $\mathbf{S}$ means good tracking and good rejection.
- $\mathbf{K}\mathbf{S}$ maps references and disturbances to the **control signal** — how hard the actuator has to work.
- The **complementary sensitivity** $\mathbf{T}$ maps a reference to the output. Crucially, it also maps *measurement noise* to the output. Small $\mathbf{T}$ means noise and model error at that frequency do little harm.

Multiply each one by its own weight and stack them in a column. That column is the whole specification:

::: key The mixed-sensitivity H-infinity problem
Minimise, over all stabilising $\mathbf{K}$, the H-infinity norm of the stacked $[\mathbf{W}_1\mathbf{S};\ \mathbf{W}_2\mathbf{K}\mathbf{S};\ \mathbf{W}_3\mathbf{T}]$:

$$\gamma = \left\lVert\begin{pmatrix}\mathbf{W}_1\mathbf{S} \\ \mathbf{W}_2\mathbf{K}\mathbf{S} \\ \mathbf{W}_3\mathbf{T}\end{pmatrix}\right\rVert_\infty .$$

$\mathbf{W}_1$ shapes tracking and disturbance rejection, $\mathbf{W}_2$ bounds actuator effort, $\mathbf{W}_3$ forces roll-off and robustness. Achieving $\gamma \le 1$ means every weighted specification is met simultaneously.
:::

Why is this a *specification* language rather than only a cost to shrink? Because of what $\gamma \le 1$ promises. If the whole stack is at most one, then each row is at most one on its own, at every frequency $\omega$ ("omega"). Dividing through by the weight gives three **[[fences on the Bode plot|weights-as-fences]]**:

$$\bar{\sigma}(\mathbf{S}(j\omega)) \le \frac{1}{\lvert W_1(j\omega)\rvert}, \qquad \bar{\sigma}(\mathbf{K}\mathbf{S}) \le \frac{1}{\lvert W_2\rvert}, \qquad \bar{\sigma}(\mathbf{T}) \le \frac{1}{\lvert W_3\rvert}.$$

Here $\bar{\sigma}$ ("sigma bar") is the largest singular value — for a single loop, the plain magnitude. So you draw the three curves $1/\lvert W_i\rvert$ first. Those curves *are* the specification. The synthesis either fits under all of them, or tells you by how much it missed.

Stacking also costs a little in the other direction. For a three-row stack, the norm is at most $\sqrt{3}$ times the largest single channel. So a design with $\gamma = 1.5$ may well meet each specification separately.

::: note Why it has to be true: rows and the square root of three
At one frequency, and for a single loop, the stack is a column of three numbers $a$, $b$, $c$, and its size is $\sqrt{a^2 + b^2 + c^2}$. That is at least as big as any one of them, so stack $\le 1$ forces each row $\le 1$. It is also at most $\sqrt{3}\max(a, b, c)$, because each square is at most the largest square. Take the peak over frequency on both sides and you get the two statements above. (For a multivariable loop the same two inequalities hold with singular values in place of magnitudes.)
:::

::: key What gamma tells you
$\gamma$ is the achieved H-infinity norm of the weighted stack. $\gamma \le 1$ means every weighted specification is met simultaneously. $\gamma$ of $2$ means you are a factor of two short somewhere — look at which channel peaks.
:::

### Choosing the weights

**$\mathbf{W}_1$ is the performance weight.** The standard first-order choice is

$$W_1(s) = \frac{s/M + \omega_B}{s + \omega_B A}.$$

It turns $1/\lvert W_1\rvert$ into a fence on $\lvert S\rvert$ with three readable numbers:

- at DC (zero frequency), $\lvert S\rvert \le A$ — the steady-state error;
- at high frequency, $\lvert S\rvert \le M$ — the **peak sensitivity**, which sets the margins;
- the fence crosses one near $\omega_B$, the bandwidth you want.

Precisely, $\lvert W_1\rvert = 1$ at $\omega = \omega_B/\sqrt{1 - 1/M^2}$ when $A$ is negligible. Typical values are $A = 10^{-3}$ or smaller, $M = 1.5$ to $2$, and $\omega_B$ the closed-loop bandwidth you are after. $M = 2$ already allows a sensitivity peak of $6\,\mathrm{dB}$, which is a poor margin. Going above about $2$ asks for worse.

::: note Why it has to be true: where the fence crosses one
With $A$ negligible, $W_1(j\omega) \approx (j\omega/M + \omega_B)/(j\omega)$. Its squared magnitude is $(\omega^2/M^2 + \omega_B^2)/\omega^2$. Set that equal to one and multiply by $\omega^2$: $\omega^2/M^2 + \omega_B^2 = \omega^2$, so $\omega^2(1 - 1/M^2) = \omega_B^2$. Take the square root. For $M = 2$ the crossing is at $\omega_B/\sqrt{0.75} = 1.155\,\omega_B$.
:::

**$\mathbf{W}_2$ bounds $\lvert KS\rvert$**, the gain from references and disturbances to the actuator command. A constant $W_2 = 1/u_{\max}$ caps the control signal for a unit input. A weight that rises with frequency also punishes fast, jittery actuator commands. That is what stops a reaction wheel or a hydraulic gimbal from chasing sensor noise. Leave $\mathbf{W}_2$ out entirely and the problem is usually **singular** — badly posed — and the synthesis returns a controller with unbounded gain. So some $\mathbf{W}_2$ is always there, even if small.

**$\mathbf{W}_3$ bounds $\lvert T\rvert$ and is the robustness weight.** Look back at the small gain lesson. If you take $W_3 = W$, the multiplicative uncertainty weight, the third row becomes exactly the robust stability test $\lvert WT\rvert < 1$. A handy form mirrors $W_1$:

$$W_3(s) = \frac{s + \omega_T A_T}{s/M_T + \omega_T}.$$

It is near $A_T$ at DC, which is no constraint at all. It rises through one at $\omega_T$ and levels off at $M_T$, forcing $\lvert T\rvert \le 1/M_T$ at high frequency.

## The two-Riccati (DGKF) solution

To solve the problem, write the generalised plant in state space. Here $x$ is its state: the plant's state and the weights' states together.

$$\dot{x} = \mathbf{A}x + \mathbf{B}_1 w + \mathbf{B}_2 u, \qquad z = \mathbf{C}_1 x + \mathbf{D}_{11}w + \mathbf{D}_{12}u, \qquad v = \mathbf{C}_2 x + \mathbf{D}_{21}w + \mathbf{D}_{22}u .$$

The subscript 1 goes with $w$ and $z$; the subscript 2 goes with $u$ and $v$. The DGKF theorem rests on four standing assumptions. Each is a real requirement, not bookkeeping:

1. $(\mathbf{A}, \mathbf{B}_2)$ is stabilisable and $(\mathbf{C}_2, \mathbf{A})$ detectable. Otherwise no stabilising controller exists at all.
2. $\mathbf{D}_{12}$ has full column rank and $\mathbf{D}_{21}$ full row rank. In words: every control input is penalised in $z$, and every measurement carries noise. This is what $\mathbf{W}_2$ and the noise channel are for.
3. $\begin{pmatrix}\mathbf{A} - j\omega\mathbf{I} & \mathbf{B}_2 \\ \mathbf{C}_1 & \mathbf{D}_{12}\end{pmatrix}$ has full column rank for every $\omega$: no zeros on the imaginary axis in the control channel.
4. The mirror-image condition on $\begin{pmatrix}\mathbf{A} - j\omega\mathbf{I} & \mathbf{B}_1 \\ \mathbf{C}_2 & \mathbf{D}_{21}\end{pmatrix}$: no imaginary-axis zeros in the measurement channel.

With the customary tidy-ups $\mathbf{D}_{11} = \mathbf{0}$, $\mathbf{D}_{22} = \mathbf{0}$, $\mathbf{D}_{12}^\mathsf{T}[\mathbf{C}_1\ \ \mathbf{D}_{12}] = [\mathbf{0}\ \ \mathbf{I}]$ and $[\mathbf{B}_1;\ \mathbf{D}_{21}]\mathbf{D}_{21}^\mathsf{T} = [\mathbf{0};\ \mathbf{I}]$, the answer is a yes-or-no test for any chosen $\gamma$:

::: key The DGKF conditions
A stabilising $\mathbf{K}$ achieving $\lVert\mathcal{F}_l(\mathbf{P},\mathbf{K})\rVert_\infty < \gamma$ exists if and only if all three hold:

1. the [[Riccati equation|riccati-name]] $\mathbf{A}^\mathsf{T}\mathbf{X} + \mathbf{X}\mathbf{A} + \mathbf{C}_1^\mathsf{T}\mathbf{C}_1 + \mathbf{X}(\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T} - \mathbf{B}_2\mathbf{B}_2^\mathsf{T})\mathbf{X} = \mathbf{0}$ has a stabilising solution $\mathbf{X}_\infty \ge 0$;
2. the dual equation $\mathbf{A}\mathbf{Y} + \mathbf{Y}\mathbf{A}^\mathsf{T} + \mathbf{B}_1\mathbf{B}_1^\mathsf{T} + \mathbf{Y}(\gamma^{-2}\mathbf{C}_1^\mathsf{T}\mathbf{C}_1 - \mathbf{C}_2^\mathsf{T}\mathbf{C}_2)\mathbf{Y} = \mathbf{0}$ has a stabilising solution $\mathbf{Y}_\infty \ge 0$;
3. the coupling condition $\rho(\mathbf{X}_\infty\mathbf{Y}_\infty) < \gamma^2$, where $\rho$ is the spectral radius (the largest eigenvalue magnitude).
:::

When all three hold, one controller that works is the **central controller**. It is one of infinitely many that achieve $\gamma$, and it is the one every toolbox returns:

$$\mathbf{K}_c(s) = \begin{pmatrix}\hat{\mathbf{A}}_\infty & -\mathbf{Z}_\infty\mathbf{L}_\infty \\ \mathbf{F}_\infty & \mathbf{0}\end{pmatrix}, \qquad \mathbf{F}_\infty = -\mathbf{B}_2^\mathsf{T}\mathbf{X}_\infty, \quad \mathbf{L}_\infty = -\mathbf{Y}_\infty\mathbf{C}_2^\mathsf{T}, \quad \mathbf{Z}_\infty = (\mathbf{I} - \gamma^{-2}\mathbf{Y}_\infty\mathbf{X}_\infty)^{-1},$$

with $\hat{\mathbf{A}}_\infty = \mathbf{A} + \gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}\mathbf{X}_\infty + \mathbf{B}_2\mathbf{F}_\infty + \mathbf{Z}_\infty\mathbf{L}_\infty\mathbf{C}_2$. (The block layout is state-space shorthand: top-left is the controller's own dynamics, top-right its input matrix, bottom-left its output matrix, bottom-right its direct feedthrough.)

Read the shape. It is an observer plus state feedback, exactly like LQG, with two changes.

- The state feedback gain $\mathbf{F}_\infty = -\mathbf{B}_2^\mathsf{T}\mathbf{X}_\infty$ comes from a Riccati equation with an extra $+\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}$ term. That term is *destabilising*. It stands for the [[worst-case disturbance playing against you|worst-case-game]].
- The observer gain is scaled by $\mathbf{Z}_\infty$, which accounts for the estimator having to work against that same opponent.

Now let $\gamma \to \infty$. Both extra terms vanish. The equations become the LQR and Kalman filter Riccati equations, the coupling condition is automatically true, and the central controller becomes the LQG controller. H-infinity synthesis contains H2 synthesis as its infinite-$\gamma$ limit. That is the cleanest statement of what the extra caution buys.

### Finding the best gamma

The conditions answer "yes" or "no" for one fixed $\gamma$. To find the smallest $\gamma$, play a guessing game: **$\gamma$-iteration**, which is [[bisection|bisection]]. Guess a $\gamma$. If all three conditions hold, the best is at most that, so try smaller. If they fail, try larger. Halve the interval each time. Because the conditions fail steadily as $\gamma$ decreases and never come back, bisection is valid, and twenty or thirty steps reach three-figure accuracy.

The resulting controller has the order of the generalised plant: the plant order plus the order of all the weights. A sixth-order flexible model with three first-order weights gives a ninth-order controller. So a [[model-order-reduction step|order-reduction]] before flight software is routine.

::: warning Mixed sensitivity cancels stable plant dynamics
The S/KS/T problem drives $\lvert S\rvert$ small at the plant's stable poles, and the algebra does it by putting controller zeros right on top of them. For a well-damped pole that is harmless. For a lightly damped [[bending mode|bending-mode]] it is a disaster. The nominal loop looks clean. But the true mode sits at a slightly different frequency, so the cancellation is not exact, and a huge internal signal builds up that the stack never shows you. The standard defences: include the mode in the uncertainty description so the cancellation is penalised; use a weight that keeps $\lvert S\rvert$ from going small in that band; or use a loop-shaping formulation with coprime-factor uncertainty, which does not cancel.
:::

::: example Reading gamma on a spacecraft axis
**The plant.** One spacecraft axis, $G(s) = 1/(Js^2)$, with $J = 120\,\mathrm{kg\,m^2}$ (the moment of inertia).

**The specification.**
- steady-state error below $10^{-3}$ of the command;
- sensitivity peak below $2$;
- closed-loop bandwidth about $1\,\mathrm{rad/s}$;
- $\lvert KS\rvert$ below $2\times 10^4\,\mathrm{N\,m/rad}$, so that a microradian of sensor noise at tens of rad/s costs at most $10^{-6}\times 2\times 10^4 = 0.02\,\mathrm{N\,m}$ of torque;
- $\lvert T\rvert$ allowed up to one at $20\,\mathrm{rad/s}$, then forced down toward $0.01$ at high frequency.

**In weights:**

$$W_1 = \frac{s/2 + 1}{s + 10^{-3}}, \qquad W_2 = 5\times 10^{-5}, \qquad W_3 = \frac{s + 0.2}{s/100 + 20}.$$

Check them. $\lvert W_1\rvert$ is $10^3$ at DC, $0.5$ at high frequency, and crosses one at $1/\sqrt{0.75} = 1.155\,\mathrm{rad/s}$. $1/W_2 = 2\times 10^4$, as asked. $\lvert W_3\rvert$ is $0.01$ at DC, crosses one at exactly $20\,\mathrm{rad/s}$, and levels off at $100$.

**Try 1: a PD controller.** Pick $\omega_n = 3\,\mathrm{rad/s}$ and $\zeta = 0.7$. Then $k_p = J\omega_n^2 = 120\times 9 = 1080$ and $k_d = 2\zeta\omega_n J = 2\times 0.7\times 3\times 120 = 504$. The channel peaks are $\lVert W_1S\rVert_\infty = 0.514$ and $\lVert W_3T\rVert_\infty = 0.217$ — fine. But $\lVert W_2KS\rVert_\infty$ is infinite. At high frequency $L \to 0$, so $KS \to K = k_ds + k_p$, whose size grows like $504\,\omega$ forever. (A computer evaluating on a grid up to $10^6\,\mathrm{rad/s}$ would print $\gamma = 5\times 10^{-5}\times 504\times 10^6 = 25\,200$, a number that only measures where the grid stopped.) A PD controller has $\lvert K\rvert \to \infty$, so it breaks any effort weight by an unbounded factor. The weight is doing its job by refusing it.

**Try 2: add roll-off.** Use $K(s) = (k_ds + k_p)/(1 + s/40)^2$. Now $\gamma = 0.781$, peaking at $25.4\,\mathrm{rad/s}$. The channel peaks are $\lVert W_1S\rVert_\infty = 0.650$ at $6.6\,\mathrm{rad/s}$, $\lVert W_2KS\rVert_\infty = 0.537$ at $34.9\,\mathrm{rad/s}$, and $\lVert W_3T\rVert_\infty = 0.269$ at $5.9\,\mathrm{rad/s}$. Every specification is met with about twenty percent to spare.

**Try 3: push the bandwidth.** Take $\omega_n = 4\,\mathrm{rad/s}$ (so $k_p = 1920$, $k_d = 672$) with roll-off at $60\,\mathrm{rad/s}$. Now $\gamma = 1.203$, peaking at $50\,\mathrm{rad/s}$, and the effort channel peaks at $\lVert W_2KS\rVert_\infty = 1.065$. The scorecard names the culprit at once: actuator effort is binding, not tracking and not robustness. Move the roll-off back to $40\,\mathrm{rad/s}$ and $\gamma = 0.959$ at the same bandwidth.

**Sanity check.** These are *achieved* values for hand-shaped controllers. A synthesis searches over every stabilising $\mathbf{K}$, so its $\gamma$ can only be smaller or equal.
:::

::: example An H-infinity optimum you can compute by hand
One case has an exact answer, and it is the case that matters most. Take a stable plant with a single **right-half-plane zero** at $s = z$ (a zero with positive real part), and the one-row problem of minimising $\lVert W_1S\rVert_\infty$ alone.

**Step 1: $S$ is pinned at the zero.** The plant has no gain at $z$: $G(z) = 0$. So $S(z) = 1/(1 + G(z)K(z)) = 1$, whatever the controller. The loop cannot touch that point.

**Step 2: the edge holds the maximum.** $W_1S$ is stable, so it is smooth ("analytic") everywhere in the closed right half plane. The [[maximum modulus principle|maximum-modulus]] then says its largest size anywhere in that half plane is reached on the boundary — the imaginary axis. The imaginary axis is exactly where the H-infinity norm looks. So

$$\lVert W_1S\rVert_\infty = \sup_\omega\lvert W_1(j\omega)S(j\omega)\rvert \ \ge\ \lvert W_1(z)S(z)\rvert = \lvert W_1(z)\rvert .$$

No controller escapes this. It is also tight: with one such constraint, the best achievable (the infimum over stabilising controllers) equals $\lvert W_1(z)\rvert$ exactly.

**Step 3: numbers.** A spacecraft axis with a non-collocated rate sensor (mounted away from the actuator, across flexible structure) has a right-half-plane zero at $z = 8\,\mathrm{rad/s}$. With $M = 2$ and $A = 10^{-3}$,

$$\gamma_{\text{opt}} = \lvert W_1(8)\rvert = \frac{8/2 + \omega_B}{8 + 10^{-3}\omega_B}.$$

- $\omega_B = 1$: $5/8.001 = 0.625$. Achievable with room.
- $\omega_B = 2$: $6/8.002 = 0.750$.
- $\omega_B = 4$: $8/8.004 = 0.9995$. Barely.
- $\omega_B = 5$: $9/8.005 = 1.124$. Impossible for *any* controller.

**Step 4: the exact limit.** Set $\gamma_{\text{opt}} = 1$: $z/M + \omega_B = z + A\omega_B$. Collect the $\omega_B$ terms: $\omega_B(1 - A) = z(1 - 1/M)$. So

$$\omega_B = \frac{z\,(1 - 1/M)}{1 - A} = \frac{8\times 0.5}{0.999} = 4.004\ \mathrm{rad/s} \approx \frac{z}{2}.$$

**Sanity check.** It sits between the $\omega_B = 4$ case (slightly under one) and the $\omega_B = 5$ case (over one), as it must.

The familiar rule that closed-loop bandwidth must stay below half the right-half-plane zero is not a rule of thumb at all. It is the exact solution of a one-row H-infinity problem with $M = 2$. Choose $M = 1.5$ and the limit becomes $z/3$. Choose $M = 3$ and it relaxes to $2z/3$ — at the price of a sensitivity peak of $20\log_{10}3 = 9.5\,\mathrm{dB}$. The right-half-plane lesson develops this into bounds for poles and zeros together.
:::

::: warning Gamma is only as honest as the weights
A design with $\gamma = 0.9$ against weak weights is worse than one with $\gamma = 1.3$ against demanding ones. The two numbers cannot be compared at all. Report $\gamma$ together with its weights — or better, report the achieved $\lVert S\rVert_\infty$, $\lVert T\rVert_\infty$, bandwidth and margins. The commonest failure in an H-infinity design review is a $\gamma$ quoted without its weights, followed by the slow discovery that the weights were relaxed three times to get there.
:::

## Check yourself

::: check
A mixed-sensitivity design returns $\gamma = 2.4$. The peak is at $12\,\mathrm{rad/s}$, and the channel values there are $\lvert W_1S\rvert = 0.31$, $\lvert W_2KS\rvert = 2.36$, $\lvert W_3T\rvert = 0.42$. What is wrong? Name two fixes.
:::

::: answer
First check the stack at that frequency: $\sqrt{0.31^2 + 2.36^2 + 0.42^2} = 2.42$. The effort channel, $\lvert W_2KS\rvert = 2.36$, accounts for almost all of it. The design demands $2.36$ times more actuator authority than $W_2$ allows, at $12\,\mathrm{rad/s}$. Tracking and robustness are comfortable.

Fix one: relax $W_2$, if the actuator can really deliver that much — the weight may have come from a cautious torque budget. Fix two: lower the demand by reducing $\omega_B$ in $W_1$, since actuator effort near crossover grows with bandwidth. A third fix, often the right one, is a faster or stronger actuator, because the synthesis has told you exactly how much more is needed.
:::

::: check
Why does the H-infinity Riccati equation for $\mathbf{X}_\infty$ carry a $+\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}$ term that the LQR equation does not? What happens to it as $\gamma\to\infty$?
:::

::: answer
The H-infinity problem is a game. The controller tries to make the weighted output small, while the disturbance tries to make it big, with a limited energy budget. The state-feedback half of the solution is the balance point of that game, and the worst-case disturbance turns out to be a state feedback itself: $w = \gamma^{-2}\mathbf{B}_1^\mathsf{T}\mathbf{X}_\infty x$. Putting it into the closed loop produces the $+\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}\mathbf{X}$ term. The sign is plus because the disturbance pushes the state away, while $-\mathbf{B}_2\mathbf{B}_2^\mathsf{T}\mathbf{X}$ pulls it back.

As $\gamma\to\infty$ the opponent's budget shrinks to nothing, the term vanishes, and you are left with the LQR equation. This also explains why the Riccati solution stops existing below some $\gamma$: the opponent's term eventually wins, no stabilising solution remains, and that is exactly what the $\gamma$-iteration detects.
:::

::: check
You need $\lvert S\rvert \le 0.01$ below $0.5\,\mathrm{rad/s}$ and $\lvert S\rvert \le 1.8$ everywhere. Write a $W_1$ that encodes this and say where $\lvert W_1\rvert$ crosses one.
:::

::: answer
The peak sets $M = 1.8$. The accuracy requirement means $\lvert W_1\rvert \ge 100$ at every frequency up to $0.5\,\mathrm{rad/s}$.

**A first-order try that fails.** Take $W_1 = (s/1.8 + \omega_B)/(s + \omega_BA)$ with $\omega_B = 5$ (a decade above $0.5$) and $A = 0.01$. At $\omega = 0.5$: numerator size $\sqrt{5^2 + (0.5/1.8)^2} = 5.008$, denominator size $\sqrt{0.5^2 + 0.05^2} = 0.5025$, ratio $9.97$. That is ten times short of $100$. Below $\omega_B$ a first-order weight only climbs $20\,\mathrm{dB}$ per decade, so its size at $0.5$ is roughly $\omega_B/0.5$.

**A first-order weight that works, at a price.** To get $100$ at $0.5\,\mathrm{rad/s}$ you need $\omega_B \approx 50\,\mathrm{rad/s}$ (with $A = 10^{-4}$, $\lvert W_1(j0.5)\rvert = 100.0$). It crosses one at $50/\sqrt{1 - 1/1.8^2} = 60.1\,\mathrm{rad/s}$ — a bandwidth a hundred times the accuracy frequency, which the actuator will probably not allow.

**The better answer: a second-order weight.** Use $W_1 = \big((s/\sqrt{M} + \omega_B)/(s + \omega_B\sqrt{A})\big)^2$, which is $1/A$ at DC, $1/M$ at high frequency, and climbs $40\,\mathrm{dB}$ per decade in between. With $M = 1.8$, $A = 10^{-4}$ and $\omega_B = 5.1\,\mathrm{rad/s}$, $\lvert W_1(j0.5)\rvert = 104$, which meets the requirement, and $\lvert W_1\rvert$ crosses one at about $7.65\,\mathrm{rad/s}$. The lesson: demanding accuracy close to the bandwidth needs more slope than a first-order weight has.
:::

::: check
The plant is $G(s) = 1/(s^2 + 0.02s + 144)$: a lightly damped mode at $12\,\mathrm{rad/s}$ with $\zeta = 0.02/24 = 0.00083$. A mixed-sensitivity design returns a beautiful $\gamma = 0.6$. Why should you be suspicious?
:::

::: answer
Mixed sensitivity makes $\lvert S\rvert$ small at the plant's stable poles by putting controller zeros on them. So the returned controller almost certainly has a lightly damped zero pair at $12\,\mathrm{rad/s}$, cancelling the plant's pole pair. The nominal $\gamma$ is then excellent, and the real loop is not. The physical mode sits a few percent away from $12\,\mathrm{rad/s}$ because the solar-array temperature or the propellant load has changed. The cancellation is incomplete, and what is left excites a mode with almost no damping and no loop authority over it.

Three tests to run: first, look at the controller's zeros. Second, compute $\lVert WT\rVert_\infty$ against a weight covering a $\pm 10\,\%$ shift in the mode frequency — it will be large. Third, check the internal signal from disturbance to the mode's state, which the stack does not include. This is the standard argument for coprime-factor loop shaping on flexible structures.
:::

::: check
A stable plant has a right-half-plane zero at $z = 3\,\mathrm{rad/s}$. The performance weight is $W_1 = (s/1.5 + \omega_B)/(s + 10^{-4}\omega_B)$. What is the largest bandwidth $\omega_B$ for which $\gamma \le 1$ is possible?
:::

::: answer
The exact optimum of the one-row problem is $\gamma_{\text{opt}} = \lvert W_1(z)\rvert = (z/M + \omega_B)/(z + A\omega_B)$, with $M = 1.5$ and $A = 10^{-4}$. Set it to one: $z/M + \omega_B = z + A\omega_B$. Collect terms: $\omega_B(1 - A) = z(1 - 1/M) = 3\times(1 - 0.6667) = 1.0$. So $\omega_B = 1.0/0.9999 = 1.000\,\mathrm{rad/s}$, which is $z/3$.

Tightening the allowed sensitivity peak from $2$ to $1.5$ has cut the achievable bandwidth from $z/2$ to $z/3$. With a right-half-plane zero, the trade between peak sensitivity and bandwidth cannot be beaten by a cleverer controller. It is arithmetic on $W_1(z)$.
:::

## Summary

| Item | Statement |
| --- | --- |
| Generalised plant | $\mathbf{P}$ maps $(w, u)$ to $(z, v)$; closed loop $\mathbf{N} = \mathcal{F}_l(\mathbf{P},\mathbf{K}) = \mathbf{P}_{11} + \mathbf{P}_{12}\mathbf{K}(\mathbf{I}-\mathbf{P}_{22}\mathbf{K})^{-1}\mathbf{P}_{21}$ |
| Mixed sensitivity | minimise $\lVert[\mathbf{W}_1\mathbf{S};\ \mathbf{W}_2\mathbf{K}\mathbf{S};\ \mathbf{W}_3\mathbf{T}]\rVert_\infty$ over stabilising $\mathbf{K}$ |
| Specification reading | $\gamma \le 1$ gives $\bar\sigma(\mathbf{S}) \le 1/\lvert W_1\rvert$, $\bar\sigma(\mathbf{K}\mathbf{S}) \le 1/\lvert W_2\rvert$, $\bar\sigma(\mathbf{T}) \le 1/\lvert W_3\rvert$ |
| Reading $\gamma$ | $\gamma \le 1$: all met; $\gamma = 2$: a factor of two short somewhere — find the channel that peaks |
| Performance weight | $W_1 = (s/M + \omega_B)/(s + \omega_BA)$: $\lvert S\rvert \le A$ at DC, $\le M$ at high frequency, crossing at $\omega_B/\sqrt{1 - 1/M^2}$ |
| DGKF assumptions | stabilisable and detectable; $\mathbf{D}_{12}$, $\mathbf{D}_{21}$ full rank; no imaginary-axis zeros in either channel |
| DGKF conditions | $\mathbf{X}_\infty \ge 0$, $\mathbf{Y}_\infty \ge 0$ from two Riccati equations, plus $\rho(\mathbf{X}_\infty\mathbf{Y}_\infty) < \gamma^2$ |
| Central controller | observer plus state feedback, $\mathbf{F}_\infty = -\mathbf{B}_2^\mathsf{T}\mathbf{X}_\infty$, $\mathbf{L}_\infty = -\mathbf{Y}_\infty\mathbf{C}_2^\mathsf{T}$, injection $-\mathbf{Z}_\infty\mathbf{L}_\infty$; becomes LQG as $\gamma\to\infty$ |
| Gamma iteration | bisect on $\gamma$; controller order = plant order + weight order |
| Worked reading | $\gamma = 1.203$ with $\lVert W_2KS\rVert_\infty = 1.065$ names the actuator-effort channel as binding |
| Exact optimum | one RHP zero $z$: $\min\lVert W_1S\rVert_\infty = \lvert W_1(z)\rvert$; with $M = 2$ this gives $\omega_B \le z/2$ |
| Pitfall | mixed sensitivity cancels stable plant poles, including lightly damped ones |

The next lesson attacks the caution the small gain theorem left behind. When the uncertainty comes in separate blocks, the right measure of the smallest destabilising perturbation is not the largest singular value but the structured singular value $\mu$.

::: context dgkf-paper The 1989 paper
The paper is "State-space solutions to standard $H_2$ and $H_\infty$ control problems" by John Doyle, Keith Glover, Pramod Khargonekar and Bruce Francis, published in the *IEEE Transactions on Automatic Control* in 1989. The H-infinity idea itself goes back to George Zames in 1981. Early solutions worked with transfer functions and produced controllers of very high order. DGKF showed that the answer looks like a familiar observer-plus-state-feedback controller, the same size as the generalised plant, found from two Riccati equations. That made the method routine engineering.
:::

::: context generalised-plant One box, two plugs on each side
Every H-infinity problem, however messy, is redrawn as this picture. All the fixed parts — the vehicle, the sensors, the weights — go inside $\mathbf{P}$. The only thing left outside is the controller $\mathbf{K}$, which you get to choose.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="20" width="100" height="60" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="56" font-size="16" text-anchor="middle" fill="#1f2a44">P(s)</text>
  <rect x="145" y="115" width="70" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="140" font-size="16" text-anchor="middle" fill="#1f2a44">K(s)</text>
  <line x1="320" y1="35" x2="236" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="230,35 240,30 240,40" fill="#1f2a44"/>
  <text x="325" y="39" font-size="13" fill="#1f2a44">w</text>
  <text x="262" y="28" font-size="11" fill="#6c7a93">disturbances, noise</text>
  <line x1="130" y1="35" x2="46" y2="35" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="40,35 50,30 50,40" fill="#1d6fd1"/>
  <text x="26" y="39" font-size="13" fill="#1d6fd1">z</text>
  <text x="50" y="28" font-size="11" fill="#6c7a93">weighted errors</text>
  <polyline points="130,65 100,65 100,135 139,135" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="145,135 135,130 135,140" fill="#1f2a44"/>
  <text x="84" y="104" font-size="13" fill="#1f2a44">v</text>
  <polyline points="215,135 260,135 260,65 236,65" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="230,65 240,60 240,70" fill="#b4232c"/>
  <text x="268" y="104" font-size="13" fill="#b4232c">u</text>
</svg>
```

The top pair ($w$ in, $z$ out) is what you care about. The bottom pair ($v$ out, $u$ in) is what the controller sees and does.
:::

::: context lft-name Why "linear fractional"
In ordinary algebra, a **linear fractional** function is one like $(a + bk)/(c + dk)$: a straight-line expression divided by another. Look at the closed-loop formula with numbers instead of matrices: $p_{11} + p_{12}k\,p_{21}/(1 - p_{22}k)$. Put it over a common bottom and it is exactly that shape in the controller gain $k$. The matrix version keeps the name. "Lower" means the controller closes the lower pair of plugs; when an uncertainty block closes the upper pair instead, the same idea is called an *upper* LFT.
:::

::: context weights-as-fences The weights draw fences
Plot $1/\lvert W_1\rvert$ on a Bode magnitude chart and it is a fence that $\lvert S\rvert$ must stay under. Below is the fence from the spacecraft example (blue) and the sensitivity of the roll-off design that achieved $\lVert W_1S\rVert_\infty = 0.650$ (red). The red curve stays under the fence everywhere, with room.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="50" x2="340" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="40" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="54">0 dB</text><text x="36" y="114">−40</text><text x="36" y="174">−80</text><text x="36" y="24">+20</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0.01</text><text x="100" y="186">0.1</text><text x="160" y="186">1</text><text x="220" y="186">10</text><text x="280" y="186">100</text><text x="336" y="186">1000</text>
  </g>
  <text x="190" y="198" font-size="11" fill="#6c7a93" text-anchor="middle">frequency, rad/s</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,109.9 52.0,104.0 64.0,98.0 76.0,92.0 88.0,86.0 100.0,80.0 112.0,74.0 124.0,68.1 136.0,62.3 148.0,56.6 160.0,51.5 172.0,47.2 184.0,44.2 196.0,42.4 208.0,41.6 220.0,41.2 232.0,41.1 244.0,41.0 256.0,41.0 268.0,41.0 280.0,41.0 292.0,41.0 304.0,41.0 316.0,41.0 328.0,41.0 340.0,41.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="76.0,162.6 88.0,150.6 100.0,138.6 112.0,126.6 124.0,114.6 136.0,102.6 148.0,90.6 160.0,78.6 172.0,66.8 184.0,56.1 196.0,49.3 208.0,47.2 220.0,47.1 232.0,47.6 244.0,48.5 256.0,49.3 268.0,49.8 280.0,49.9 292.0,50.0 304.0,50.0 316.0,50.0 328.0,50.0 340.0,50.0"/>
  <text x="300" y="34" font-size="12" fill="#1d6fd1" text-anchor="middle">fence 1/|W₁|</text>
  <text x="120" y="150" font-size="12" fill="#b4232c">|S|</text>
</svg>
```
:::

::: context riccati-name Who Riccati was
Jacopo Riccati was an Italian mathematician of the early 1700s who studied a family of differential equations with a squared unknown in them. Control engineers inherited the name. An *algebraic* Riccati equation is the steady-state version: no derivative, only a matrix $\mathbf{X}$ appearing once on each side and once in a product $\mathbf{X}(\cdots)\mathbf{X}$. You met it already in LQR and the Kalman filter. H-infinity needs two of them, and the only change is the extra $\gamma^{-2}$ term.
:::

::: context worst-case-game A tug-of-war with an opponent
Picture a tug-of-war. You pull the state back toward zero through $\mathbf{B}_2$. An opponent pulls it away through $\mathbf{B}_1$, but the opponent has a limited amount of energy to spend, and $\gamma$ sets how much that energy counts against you. Large $\gamma$: a weak opponent, and your best play is the LQR play. Small $\gamma$: a strong opponent. Below some $\gamma$ the opponent always wins, and the Riccati equation has no stabilising solution. That boundary is the best $\gamma$ you can reach.
:::

::: context bisection Halving the gap
Bisection is the "I'm thinking of a number" game. Each test answers "feasible" or "not feasible", and you halve the interval that must contain the best $\gamma$. Here the best achievable value is supposed to be $0.8$, and the search starts on $[0, 2]$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="128" x2="230" y2="128" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="142">0</text><text x="80" y="142">0.5</text><text x="130" y="142">1</text><text x="230" y="142">2</text>
  </g>
  <line x1="110" y1="14" x2="110" y2="128" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="110" y="11" font-size="11" fill="#b4232c" text-anchor="middle">best 0.8</text>
  <rect x="30" y="20" width="200" height="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="240" y="30" font-size="11" fill="#1f2a44">try 1: yes</text>
  <rect x="30" y="46" width="100" height="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="240" y="56" font-size="11" fill="#1f2a44">try 0.5: no</text>
  <rect x="80" y="72" width="50" height="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="240" y="82" font-size="11" fill="#1f2a44">try 0.75: no</text>
  <rect x="105" y="98" width="25" height="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="240" y="108" font-size="11" fill="#1f2a44">try 0.875: yes</text>
</svg>
```

Each bar is the interval still in play; after four tries it is $[0.75, 0.875]$. Twenty halvings shrink it by a factor of about a million.
:::

::: context order-reduction Trimming the controller for flight
Every state in the controller is arithmetic the flight computer must do every cycle, and code someone must verify. **Model-order reduction** replaces a high-order controller with a smaller one that behaves almost the same in the frequency band that matters. The usual tool is balanced truncation, which throws away the states that are both hard to excite and hard to see. The reduced controller is a different controller, so its margins are checked again afterwards — the next lesson makes the same point about $\mu$.
:::

::: context bending-mode Why bending modes are fragile
A long, light structure — a launch vehicle, a solar array, a big antenna — flexes like a guitar string at particular frequencies called **bending modes**. Their damping is tiny, often well under one percent, so the peak in the response is tall and razor-thin. Their frequency also drifts as propellant drains or the structure warms. A controller zero placed exactly on a thin peak misses as soon as the peak moves by a few percent, and then the peak is back, unguarded.
:::

::: context maximum-modulus A tent held up at the edges
Think of $\lvert W_1S\rvert$ over the right half of the complex plane as a stretched rubber sheet. For a stable, smooth function the sheet has no peaks in the middle: every high point is on the edge, which is the imaginary axis. So the value at the single interior point $s = z$ can never beat the highest point along the edge. Since $\lvert S(z)\rvert = 1$ is forced, the edge — and so the H-infinity norm — must reach at least $\lvert W_1(z)\rvert$.
:::
