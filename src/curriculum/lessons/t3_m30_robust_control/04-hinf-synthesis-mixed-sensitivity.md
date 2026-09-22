---
id: l04-hinf-synthesis-mixed-sensitivity
title: H-infinity synthesis and mixed sensitivity
minutes: 18
covers:
  - 'H-infinity synthesis: mixed sensitivity S/KS/T weighting, the two-Riccati (DGKF) solution'
---

Up to now the H-infinity norm has been a diagnostic: compute it for a closed loop you already have and see whether the number is below one. Synthesis turns it into an objective. You write down every specification — tracking accuracy, disturbance rejection, actuator effort, roll-off, robustness — as a weight on one closed-loop transfer function, stack the weighted functions into a single matrix, and ask an algorithm for the controller that minimises the H-infinity norm of the stack. The number it returns, $\gamma$, is a scorecard for every specification at once: below one and they are all met, above one and you are short somewhere by that factor.

What makes this practical rather than merely elegant is that the minimisation has a solution in closed form up to a scalar search. The Doyle–Glover–Khargonekar–Francis result of 1989 — the "two-Riccati" or DGKF solution — reduced the whole problem to two algebraic Riccati equations of the same size as the plant, plus a condition coupling their solutions. That is why H-infinity synthesis runs in milliseconds on problems with dozens of states, and why it sits in the standard toolkit alongside LQG rather than in the research literature.

This lesson sets up the generalised plant, defines the mixed-sensitivity problem and shows how to turn a specification into each of the three weights, states the DGKF solution with its assumptions, and works the arithmetic of reading $\gamma$ on real designs — including one case where the optimum can be computed exactly by hand.

## The generalised plant

Every H-infinity problem is put into one shape. Collect all exogenous inputs — references, disturbances, noises — into a vector $w$, and all the signals you want kept small, each already multiplied by its weight, into a vector $z$. The controller measures $v$ and produces $u$. The fixed interconnection of plant and weights is the **generalised plant**

$$\begin{pmatrix} z \\ v\end{pmatrix} = \mathbf{P}(s)\begin{pmatrix} w \\ u\end{pmatrix} = \begin{pmatrix}\mathbf{P}_{11} & \mathbf{P}_{12} \\ \mathbf{P}_{21} & \mathbf{P}_{22}\end{pmatrix}\begin{pmatrix} w \\ u\end{pmatrix}, \qquad u = \mathbf{K}(s)\,v .$$

Eliminating $u$ and $v$ gives the closed-loop map from $w$ to $z$, the **lower linear fractional transformation**

$$\mathbf{N} = \mathcal{F}_l(\mathbf{P}, \mathbf{K}) = \mathbf{P}_{11} + \mathbf{P}_{12}\mathbf{K}(\mathbf{I} - \mathbf{P}_{22}\mathbf{K})^{-1}\mathbf{P}_{21},$$

and the problem is: over all $\mathbf{K}$ that stabilise the loop internally, minimise $\lVert\mathbf{N}\rVert_\infty$. Note that this is the same algebraic object as the $\mathbf{M}$–$\boldsymbol{\Delta}$ loop of the small gain lesson, with the roles swapped — there the unknown block closed the loop, here the controller does. That duality is what lets the same machinery test robustness and design controllers.

## Mixed sensitivity: the S/KS/T stack

The standard specification set uses three closed-loop functions, all defined from the loop gain $\mathbf{L} = \mathbf{G}\mathbf{K}$:

$$\mathbf{S} = (\mathbf{I} + \mathbf{L})^{-1}, \qquad \mathbf{K}\mathbf{S}, \qquad \mathbf{T} = \mathbf{L}(\mathbf{I} + \mathbf{L})^{-1} = \mathbf{I} - \mathbf{S}.$$

$\mathbf{S}$ maps reference to tracking error and output disturbance to output; $\mathbf{K}\mathbf{S}$ maps reference and disturbance to control signal; $\mathbf{T}$ maps reference to output and, crucially, measurement noise to output. Weight each and stack:

::: key The mixed-sensitivity H-infinity problem
Minimise, over all stabilising $\mathbf{K}$,

$$\gamma = \left\lVert\begin{pmatrix}\mathbf{W}_1\mathbf{S} \\ \mathbf{W}_2\mathbf{K}\mathbf{S} \\ \mathbf{W}_3\mathbf{T}\end{pmatrix}\right\rVert_\infty .$$

$\mathbf{W}_1$ shapes tracking and disturbance rejection, $\mathbf{W}_2$ bounds actuator effort, $\mathbf{W}_3$ forces roll-off and robustness. Achieving $\gamma \le 1$ means every weighted specification is met simultaneously.
:::

The reason this is a *specification* language rather than a cost function is the inequality it implies. If $\gamma \le 1$ then each row is individually bounded, so

$$\bar{\sigma}(\mathbf{S}(j\omega)) \le \frac{1}{\lvert W_1(j\omega)\rvert}, \qquad \bar{\sigma}(\mathbf{K}\mathbf{S}) \le \frac{1}{\lvert W_2\rvert}, \qquad \bar{\sigma}(\mathbf{T}) \le \frac{1}{\lvert W_3\rvert}.$$

You draw the three curves $1/\lvert W_i\rvert$ first — those are the specification — and the synthesis either fits under all of them or tells you by how much it missed. Conversely, stacking costs a little conservatism: for a three-row stack the norm is at most $\sqrt{3}$ times the largest individual channel, so a design with $\gamma = 1.5$ may well satisfy each specification separately.

### Choosing the weights

$\mathbf{W}_1$ is the performance weight, and the standard first-order choice is

$$W_1(s) = \frac{s/M + \omega_B}{s + \omega_B A},$$

which makes $1/\lvert W_1\rvert$ a specification on $\lvert S\rvert$: at most $A$ at DC (steady-state error), at most $M$ at high frequency (peak sensitivity, hence margins), crossing one near $\omega_B$. Precisely, $\lvert W_1\rvert = 1$ at $\omega = \omega_B/\sqrt{1 - 1/M^2}$ when $A$ is negligible. Typical values: $A = 10^{-3}$ or smaller, $M = 1.5$ to $2$, $\omega_B$ the closed-loop bandwidth you want. Taking $M$ above about $2$ is asking for a sensitivity peak of $6\,\mathrm{dB}$, which is already a poor margin.

$\mathbf{W}_2$ bounds $\lvert KS\rvert$, the gain from reference and disturbance to actuator command. A constant $W_2 = 1/u_{\max}$ caps the control signal for a unit input; a weight that rises with frequency additionally penalises high-frequency actuator activity, which is what protects a reaction wheel or a hydraulic gimbal from chasing sensor noise. If $\mathbf{W}_2$ is left out entirely the problem is usually singular and the synthesis returns a controller with unbounded gain, so some $\mathbf{W}_2$ is always present even if small.

$\mathbf{W}_3$ bounds $\lvert T\rvert$ and is the robustness weight: comparing with the small gain lesson, taking $W_3 = W$, the multiplicative uncertainty weight, makes the third channel exactly the robust stability test $\lvert WT\rvert < 1$. A convenient form mirrors $W_1$,

$$W_3(s) = \frac{s + \omega_T A_T}{s/M_T + \omega_T},$$

which is near $A_T$ at DC (no constraint), rises through one at $\omega_T$ and levels at $M_T$, forcing $\lvert T\rvert \le 1/M_T$ at high frequency.

## The two-Riccati (DGKF) solution

Write the generalised plant in state space,

$$\dot{x} = \mathbf{A}x + \mathbf{B}_1 w + \mathbf{B}_2 u, \qquad z = \mathbf{C}_1 x + \mathbf{D}_{11}w + \mathbf{D}_{12}u, \qquad v = \mathbf{C}_2 x + \mathbf{D}_{21}w + \mathbf{D}_{22}u .$$

The DGKF theorem is stated under four standing assumptions, each of which is a genuine requirement rather than bookkeeping:

1. $(\mathbf{A}, \mathbf{B}_2)$ is stabilisable and $(\mathbf{C}_2, \mathbf{A})$ detectable — otherwise no stabilising controller exists at all.
2. $\mathbf{D}_{12}$ has full column rank and $\mathbf{D}_{21}$ full row rank — every control input is penalised in $z$, and every measurement carries noise. This is what $\mathbf{W}_2$ and the noise channel are for.
3. $\begin{pmatrix}\mathbf{A} - j\omega\mathbf{I} & \mathbf{B}_2 \\ \mathbf{C}_1 & \mathbf{D}_{12}\end{pmatrix}$ has full column rank for every $\omega$: no imaginary-axis zeros in the control channel.
4. The dual condition on $\begin{pmatrix}\mathbf{A} - j\omega\mathbf{I} & \mathbf{B}_1 \\ \mathbf{C}_2 & \mathbf{D}_{21}\end{pmatrix}$: no imaginary-axis zeros in the measurement channel.

With the customary normalisations $\mathbf{D}_{11} = \mathbf{0}$, $\mathbf{D}_{22} = \mathbf{0}$, $\mathbf{D}_{12}^\mathsf{T}[\mathbf{C}_1\ \ \mathbf{D}_{12}] = [\mathbf{0}\ \ \mathbf{I}]$ and $[\mathbf{B}_1;\ \mathbf{D}_{21}]\mathbf{D}_{21}^\mathsf{T} = [\mathbf{0};\ \mathbf{I}]$:

::: key The DGKF conditions
A stabilising $\mathbf{K}$ achieving $\lVert\mathcal{F}_l(\mathbf{P},\mathbf{K})\rVert_\infty < \gamma$ exists if and only if all three hold:

1. the Riccati equation $\mathbf{A}^\mathsf{T}\mathbf{X} + \mathbf{X}\mathbf{A} + \mathbf{C}_1^\mathsf{T}\mathbf{C}_1 + \mathbf{X}(\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T} - \mathbf{B}_2\mathbf{B}_2^\mathsf{T})\mathbf{X} = \mathbf{0}$ has a stabilising solution $\mathbf{X}_\infty \ge 0$;
2. the dual equation $\mathbf{A}\mathbf{Y} + \mathbf{Y}\mathbf{A}^\mathsf{T} + \mathbf{B}_1\mathbf{B}_1^\mathsf{T} + \mathbf{Y}(\gamma^{-2}\mathbf{C}_1^\mathsf{T}\mathbf{C}_1 - \mathbf{C}_2^\mathsf{T}\mathbf{C}_2)\mathbf{Y} = \mathbf{0}$ has a stabilising solution $\mathbf{Y}_\infty \ge 0$;
3. the coupling condition $\rho(\mathbf{X}_\infty\mathbf{Y}_\infty) < \gamma^2$, where $\rho$ is the spectral radius.
:::

The **central controller** — one of infinitely many that achieve $\gamma$, and the one every toolbox returns — is then

$$\mathbf{K}_c(s) = \begin{pmatrix}\hat{\mathbf{A}} & -\mathbf{Z}_\infty\mathbf{Y}_\infty\mathbf{C}_2^\mathsf{T} \\ -\mathbf{B}_2^\mathsf{T}\mathbf{X}_\infty & \mathbf{0}\end{pmatrix}, \qquad \mathbf{Z}_\infty = (\mathbf{I} - \gamma^{-2}\mathbf{Y}_\infty\mathbf{X}_\infty)^{-1},$$

with $\hat{\mathbf{A}} = \mathbf{A} + \gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}\mathbf{X}_\infty - \mathbf{B}_2\mathbf{B}_2^\mathsf{T}\mathbf{X}_\infty - \mathbf{Z}_\infty\mathbf{Y}_\infty\mathbf{C}_2^\mathsf{T}\mathbf{C}_2$. Read the shape: it is an observer plus state feedback, exactly like LQG, with two modifications. The state feedback gain $-\mathbf{B}_2^\mathsf{T}\mathbf{X}_\infty$ comes from a Riccati equation carrying an extra $+\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}$ term — a *destabilising* term representing the worst-case disturbance playing against you — and the observer gain is scaled by $\mathbf{Z}_\infty$, which accounts for the estimator having to work against that same adversary. Let $\gamma\to\infty$ and both extra terms vanish: the equations become the LQR and Kalman Riccati equations, the coupling condition becomes vacuous, and the central controller becomes the LQG controller. H-infinity synthesis contains H2 synthesis as its infinite-$\gamma$ limit, which is the cleanest statement of what the extra conservatism buys.

Because the conditions are a yes-or-no test for a fixed $\gamma$, the optimum is found by **$\gamma$-iteration**: bisect on $\gamma$, at each step attempting both Riccati solutions and checking the spectral radius, until the interval is small. Since all three conditions fail monotonically as $\gamma$ decreases, bisection is valid, and twenty or thirty steps reach three-figure accuracy. The resulting controller has the order of the generalised plant — the plant order plus the order of all the weights — so a sixth-order flexible model with three first-order weights yields a ninth-order controller, and a model-order-reduction step before flight software is routine.

::: warning Mixed sensitivity cancels stable plant dynamics
The S/KS/T problem drives $\lvert S\rvert$ small at the plant's stable poles, and the algebra does it by putting controller zeros on top of them. For a well-damped pole that is harmless. For a lightly damped bending mode it is a disaster: the nominal loop looks clean while the true loop, whose mode is at a slightly different frequency, has a near-cancellation with an enormous internal signal. The standard defences are to include the mode in the uncertainty description so the cancellation is penalised, to use a weight that keeps $\lvert S\rvert$ from going small in that band, or to use a loop-shaping formulation with coprime-factor uncertainty, which does not cancel.
:::

::: example Reading gamma on a spacecraft axis
Plant $G(s) = 1/(Js^2)$, $J = 120\,\mathrm{kg\,m^2}$. Specification: steady-state error below $10^{-3}$ of command, sensitivity peak below $2$, closed-loop bandwidth about $1\,\mathrm{rad/s}$, $\lvert KS\rvert$ below $2\times 10^4\,\mathrm{N\,m/rad}$ so that a microradian of sensor noise at tens of rad/s costs less than $0.02\,\mathrm{N\,m}$, and $\lvert T\rvert$ below $0.01$ above $20\,\mathrm{rad/s}$. In weights:

$$W_1 = \frac{s/2 + 1}{s + 10^{-3}}, \qquad W_2 = 5\times 10^{-5}, \qquad W_3 = \frac{s + 0.2}{s/100 + 20}.$$

$\lvert W_1\rvert$ is $10^3$ at DC, $0.5$ at high frequency and crosses one at $1.155\,\mathrm{rad/s}$; $\lvert W_3\rvert$ is $0.01$ at DC, crosses one at exactly $20\,\mathrm{rad/s}$ and levels at $100$.

Try the proportional-derivative controller with $\omega_n = 3\,\mathrm{rad/s}$, $\zeta = 0.7$, so $k_p = 1080$ and $k_d = 504$. The stack norm is $\gamma = 25\,200$, and the channel breakdown says why at once: $\lVert W_1S\rVert_\infty = 0.514$, $\lVert W_3T\rVert_\infty = 0.217$, and $\lVert W_2KS\rVert_\infty$ grows without bound. A proportional-derivative controller has $\lvert K\rvert \to \infty$, so it violates any effort weight by an unbounded factor. The weight is doing its job by refusing it.

Add a second-order roll-off, $K(s) = (k_ds + k_p)/(1 + s/40)^2$. Now $\gamma = 0.781$, peaking at $25.4\,\mathrm{rad/s}$, with channel peaks $\lVert W_1S\rVert_\infty = 0.650$ at $6.6\,\mathrm{rad/s}$, $\lVert W_2KS\rVert_\infty = 0.537$ at $34.9\,\mathrm{rad/s}$ and $\lVert W_3T\rVert_\infty = 0.269$ at $5.9\,\mathrm{rad/s}$. Every specification is met with about twenty percent to spare.

Push the bandwidth: $\omega_n = 4\,\mathrm{rad/s}$ with roll-off at $60\,\mathrm{rad/s}$ gives $\gamma = 1.203$, peaking at $50\,\mathrm{rad/s}$ where $\lVert W_2KS\rVert$ reaches $1.065$. The scorecard names the culprit without ambiguity: the actuator-effort channel is binding, not tracking and not robustness. Moving the roll-off back to $40\,\mathrm{rad/s}$ recovers $\gamma = 0.959$ at the same bandwidth. These are *achieved* values for hand-shaped controllers; a synthesis searches over all stabilising $\mathbf{K}$ and returns the smallest achievable $\gamma$, which can only be smaller.
:::

::: example An H-infinity optimum you can compute by hand
One case admits an exact answer, and it is the case that matters most. Take a stable plant with a single right-half-plane zero at $s = z$, and the one-block problem of minimising $\lVert W_1S\rVert_\infty$ alone.

Any stabilising controller gives a stable $S$ with $S(z) = 1$: the plant has no gain at $z$, so the loop cannot affect that point, and $S = 1/(1+GK)$ with $G(z) = 0$ forces $S(z) = 1$. Now $W_1S$ is stable, hence analytic in the closed right half plane, so the maximum modulus principle applies: its largest value anywhere in the right half plane is attained on the boundary. Therefore

$$\lVert W_1S\rVert_\infty = \sup_\omega\lvert W_1(j\omega)S(j\omega)\rvert \ \ge\ \lvert W_1(z)S(z)\rvert = \lvert W_1(z)\rvert .$$

No controller escapes this. It is also tight: for a single interpolation constraint the infimum over stabilising controllers equals $\lvert W_1(z)\rvert$ exactly.

Put numbers in. A spacecraft axis with a non-collocated rate sensor has a right-half-plane zero at $z = 8\,\mathrm{rad/s}$. With $W_1 = (s/M + \omega_B)/(s + \omega_BA)$, $M = 2$, $A = 10^{-3}$,

$$\gamma_{\text{opt}} = \lvert W_1(8)\rvert = \frac{8/2 + \omega_B}{8 + 10^{-3}\omega_B}.$$

At $\omega_B = 1\,\mathrm{rad/s}$ this is $5/8.001 = 0.625$ — the specification is achievable with room. At $\omega_B = 2$ it is $0.750$; at $\omega_B = 4$ it is $0.9995$; at $\omega_B = 5$ it is $1.124$ and the specification is impossible for *any* controller. Setting $\gamma_{\text{opt}} = 1$ and solving, $\omega_B(1 - A) = z(1 - 1/M)$, so

$$\omega_B = \frac{z\,(1 - 1/M)}{1 - A} = \frac{8\times 0.5}{0.999} = 4.004\ \mathrm{rad/s} \approx \frac{z}{2}.$$

The familiar rule that closed-loop bandwidth must stay below half the right-half-plane zero is not a rule of thumb at all: it is the exact solution of a one-block H-infinity problem with $M = 2$. Choose $M = 1.5$ instead and the limit becomes $z/3$; choose $M = 3$ and it relaxes to $2z/3$, at the price of a sensitivity peak of $9.5\,\mathrm{dB}$. The right-half-plane lesson develops this into bounds for poles and zeros together.
:::

::: warning Gamma is only as honest as the weights
A design with $\gamma = 0.9$ against weak weights is worse than one with $\gamma = 1.3$ against demanding ones, and the two numbers are not comparable at all. Report $\gamma$ with the weights, or better, report the achieved $\lVert S\rVert_\infty$, $\lVert T\rVert_\infty$, bandwidth and margins. The commonest failure of an H-infinity design review is a $\gamma$ quoted without its weights, followed by a slow discovery that the weights were relaxed three times to get there.
:::

## Check yourself

::: check
A mixed-sensitivity design returns $\gamma = 2.4$. The peak is at $12\,\mathrm{rad/s}$ and the channel values there are $\lvert W_1S\rvert = 0.31$, $\lvert W_2KS\rvert = 2.36$, $\lvert W_3T\rvert = 0.42$. What is wrong, and name two fixes.
:::

::: answer
The stack norm at that frequency is $\sqrt{0.31^2 + 2.36^2 + 0.42^2} = 2.42$, and $\lvert W_2KS\rvert = 2.36$ accounts for essentially all of it: the design demands $2.36$ times more actuator authority than $W_2$ permits, at $12\,\mathrm{rad/s}$. Tracking and robustness are comfortable. Two fixes: relax $W_2$ if the actuator can genuinely deliver that much — the weight may have been set from a conservative torque budget — or reduce the demand by lowering $\omega_B$ in $W_1$, since actuator effort near crossover scales with bandwidth. A third, often the right one, is to buy a faster or stronger actuator, because the synthesis has quantified exactly what is needed.
:::

::: check
Why does the H-infinity Riccati equation for $\mathbf{X}_\infty$ carry a $+\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}$ term that the LQR equation does not, and what happens to it as $\gamma\to\infty$?
:::

::: answer
The H-infinity problem is a game: the controller minimises while the disturbance maximises, subject to the disturbance having bounded energy. The state-feedback half of the solution is the saddle point of that game, and the worst-case disturbance is itself a state feedback, $w = \gamma^{-2}\mathbf{B}_1^\mathsf{T}\mathbf{X}_\infty x$. Substituting it into the closed loop contributes the $+\gamma^{-2}\mathbf{B}_1\mathbf{B}_1^\mathsf{T}\mathbf{X}$ term, with a plus sign because the disturbance is pushing the state away while $-\mathbf{B}_2\mathbf{B}_2^\mathsf{T}\mathbf{X}$ pulls it back. As $\gamma\to\infty$ the adversary's budget shrinks to nothing, the term vanishes, and the equation is the LQR one. That is also why the Riccati solution stops existing below some $\gamma$: the adversary's term eventually wins and no stabilising solution remains, which is exactly what the $\gamma$-iteration detects.
:::

::: check
You need $\lvert S\rvert \le 0.01$ below $0.5\,\mathrm{rad/s}$ and $\lvert S\rvert \le 1.8$ everywhere. Write a $W_1$ that encodes this and state where $\lvert W_1\rvert$ crosses one.
:::

::: answer
Use the standard form with $M = 1.8$ (peak sensitivity) and $A$ chosen to give the low-frequency accuracy. The requirement $\lvert S\rvert \le 0.01$ below $0.5\,\mathrm{rad/s}$ means $\lvert W_1\rvert \ge 100$ there; with $W_1 = (s/M + \omega_B)/(s + \omega_BA)$ and $\omega \ll \omega_B$, $\lvert W_1\rvert \approx 1/A$, so $A = 0.01$ would only be enough at DC. Taking $\omega_B$ a decade above $0.5$, say $\omega_B = 5\,\mathrm{rad/s}$, and $A = 0.01$ gives $\lvert W_1(j0.5)\rvert = \sqrt{5^2 + (0.5/1.8)^2}\,/\,\sqrt{0.5^2 + 0.05^2} = 5.008/0.5025 = 9.97$, far short of the $100$ required. So $\omega_B = 5$ with $A = 0.01$ does not meet the requirement; you need $A \le 0.01$ *and* enough slope, which means either a larger $\omega_B$ or a second-order weight with a double integrator-like roll-up. The lesson is that a first-order $W_1$ has only $20\,\mathrm{dB}$ per decade of slope, and a demanding low-frequency accuracy at a frequency close to the bandwidth needs a second-order weight $W_1 = ((s/\sqrt{M} + \omega_B)/(s + \omega_B\sqrt{A}))^2$.
:::

::: check
The plant is $G(s) = 1/(s^2 + 0.02s + 144)$, a lightly damped mode at $12\,\mathrm{rad/s}$ with $\zeta = 0.00083$, and a mixed-sensitivity design returns a beautiful $\gamma = 0.6$. Why should you be suspicious?
:::

::: answer
The mixed-sensitivity formulation makes $\lvert S\rvert$ small at the plant's stable poles by placing controller zeros on them, so the returned controller almost certainly has a lightly damped zero pair at $12\,\mathrm{rad/s}$ cancelling the plant's pole pair. The nominal $\gamma$ is then excellent and the real loop is not: the physical mode sits a few percent away from $12\,\mathrm{rad/s}$ because the array temperature or the propellant load has changed, the cancellation is incomplete, and the residual excites a mode with essentially no damping and no loop authority over it. The tests to run are, first, look at the controller's zeros; second, compute $\lVert WT\rVert_\infty$ against a weight covering a $\pm 10\,\%$ shift in the mode frequency, which will be large; third, check the internal signal from disturbance to the mode's state, which the stack does not include. This is the standard argument for coprime-factor loop shaping on flexible structures.
:::

::: check
For a stable plant with a right-half-plane zero at $z = 3\,\mathrm{rad/s}$ and the performance weight $W_1 = (s/1.5 + \omega_B)/(s + 10^{-4}\omega_B)$, what is the largest bandwidth $\omega_B$ for which $\gamma \le 1$ is possible?
:::

::: answer
The exact optimum of the one-block problem is $\gamma_{\text{opt}} = \lvert W_1(z)\rvert = (z/M + \omega_B)/(z + A\omega_B)$ with $M = 1.5$ and $A = 10^{-4}$. Setting this to one: $z/M + \omega_B = z + A\omega_B$, so $\omega_B(1 - A) = z(1 - 1/M) = 3(1 - 0.6667) = 1.0$, giving $\omega_B = 1.0/0.9999 = 1.000\,\mathrm{rad/s}$, that is $z/3$. Tightening the allowed sensitivity peak from $2$ to $1.5$ has cut the achievable bandwidth from $z/2$ to $z/3$. The trade between peak sensitivity and bandwidth in the presence of a right-half-plane zero is not negotiable by controller cleverness; it is arithmetic on $W_1(z)$.
:::

## Summary

| Item | Statement |
| --- | --- |
| Generalised plant | $\mathbf{P}$ maps $(w, u)$ to $(z, v)$; closed loop $\mathbf{N} = \mathcal{F}_l(\mathbf{P},\mathbf{K}) = \mathbf{P}_{11} + \mathbf{P}_{12}\mathbf{K}(\mathbf{I}-\mathbf{P}_{22}\mathbf{K})^{-1}\mathbf{P}_{21}$ |
| Mixed sensitivity | minimise $\lVert[\mathbf{W}_1\mathbf{S};\ \mathbf{W}_2\mathbf{K}\mathbf{S};\ \mathbf{W}_3\mathbf{T}]\rVert_\infty$ over stabilising $\mathbf{K}$ |
| Specification reading | $\gamma \le 1$ gives $\bar\sigma(\mathbf{S}) \le 1/\lvert W_1\rvert$, $\bar\sigma(\mathbf{K}\mathbf{S}) \le 1/\lvert W_2\rvert$, $\bar\sigma(\mathbf{T}) \le 1/\lvert W_3\rvert$ |
| Performance weight | $W_1 = (s/M + \omega_B)/(s + \omega_BA)$: $\lvert S\rvert \le A$ at DC, $\le M$ at high frequency, crossing at $\omega_B/\sqrt{1 - 1/M^2}$ |
| DGKF assumptions | stabilisable and detectable; $\mathbf{D}_{12}$, $\mathbf{D}_{21}$ full rank; no imaginary-axis zeros in either channel |
| DGKF conditions | $\mathbf{X}_\infty \ge 0$, $\mathbf{Y}_\infty \ge 0$ from two Riccati equations, plus $\rho(\mathbf{X}_\infty\mathbf{Y}_\infty) < \gamma^2$ |
| Central controller | observer plus state feedback, gains $-\mathbf{B}_2^\mathsf{T}\mathbf{X}_\infty$ and $-\mathbf{Z}_\infty\mathbf{Y}_\infty\mathbf{C}_2^\mathsf{T}$; becomes LQG as $\gamma\to\infty$ |
| Gamma iteration | bisect on $\gamma$; controller order = plant order + weight order |
| Reading gamma | $\gamma = 1.203$ with $\lvert W_2KS\rvert = 1.065$ at the peak names the actuator-effort channel as binding |
| Exact optimum | one RHP zero $z$: $\min\lVert W_1S\rVert_\infty = \lvert W_1(z)\rvert$; with $M = 2$ this gives $\omega_B \le z/2$ |
| Pitfall | mixed sensitivity cancels stable plant poles, including lightly damped ones |

The next lesson attacks the conservatism that the small gain theorem left behind. When the uncertainty is block-structured, the right measure of the smallest destabilising perturbation is not the largest singular value but the structured singular value $\mu$.
