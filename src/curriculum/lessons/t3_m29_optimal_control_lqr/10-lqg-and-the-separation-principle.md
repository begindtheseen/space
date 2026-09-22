---
id: l10-lqg-and-the-separation-principle
title: LQG and the stochastic separation principle
minutes: 19
covers:
  - LQG = LQR + Kalman filter, and the stochastic separation principle
---

Nine lessons have assumed the full state vector arrives on a wire. No vehicle works that way. A spacecraft measures attitude with a star tracker at a few hertz and angular rate with a gyro that drifts; a launch vehicle measures acceleration and rate and has to integrate for position; a lander has a radar that stops working below some altitude. The state is inferred, not read, and the inference has dynamics and error of its own.

Linear quadratic Gaussian control is the answer to the stochastic version of the regulator problem: minimise the expected quadratic cost when the plant is driven by Gaussian process noise and observed through Gaussian measurement noise. The answer is remarkable in its tidiness. Estimate the state with a Kalman filter, designed as though no controller existed; compute the LQR gain, designed as though the state were known exactly; apply the LQR gain to the filter's estimate. Each half is optimal on its own, and the combination is optimal for the joint problem. That is the **separation theorem**, and it is what makes an otherwise intractable stochastic optimal-control problem into two Riccati equations you already know how to solve.

The previous lesson on margins established the price. Separation is a statement about the expected cost and about where the closed-loop poles land. It is not a statement about robustness, and treating it as one is the single most reliable way to produce a controller that is optimal on paper and unflyable in practice.

## The stochastic problem

The plant now carries noise on both sides:

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{G}\mathbf{w},
\qquad
\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{v},
$$

with $\mathbf{w}$ and $\mathbf{v}$ zero-mean white Gaussian processes of intensity $\mathbf{W} \succeq 0$ and $\mathbf{V} \succ 0$, mutually uncorrelated, and $\mathbf{G}$ the matrix saying where the process noise enters. The cost becomes an expectation,

$$
J = \lim_{T\to\infty}\ \mathbb{E}\left[\frac{1}{T}\int_0^T\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)dt\right],
$$

minimised over all control laws that use only the measurement history $\{\mathbf{y}(\tau): \tau \le t\}$. That last restriction is what makes this a hard problem in principle: the admissible controls are functionals of a data stream, not functions of a state.

## The estimator is the dual Riccati equation

The optimal estimator is the steady-state Kalman filter,

$$
\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}\big(\mathbf{y} - \mathbf{C}\hat{\mathbf{x}}\big),
\qquad
\mathbf{L} = \boldsymbol{\Sigma}\mathbf{C}^\top\mathbf{V}^{-1},
$$

where $\boldsymbol{\Sigma} = \mathbb{E}[\mathbf{e}\mathbf{e}^\top]$ is the steady-state covariance of the estimation error $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$, and solves the **filter algebraic Riccati equation**

$$
\mathbf{A}\boldsymbol{\Sigma} + \boldsymbol{\Sigma}\mathbf{A}^\top - \boldsymbol{\Sigma}\mathbf{C}^\top\mathbf{V}^{-1}\mathbf{C}\boldsymbol{\Sigma} + \mathbf{G}\mathbf{W}\mathbf{G}^\top = \mathbf{0}.
$$

That is the CARE with a dictionary applied. Every fact proved about the regulator transfers:

| Regulator | Estimator |
| --- | --- |
| $\mathbf{A}$ | $\mathbf{A}^\top$ |
| $\mathbf{B}$ | $\mathbf{C}^\top$ |
| $\mathbf{Q}$ | $\mathbf{G}\mathbf{W}\mathbf{G}^\top$ |
| $\mathbf{R}$ | $\mathbf{V}$ |
| $\mathbf{P}$ (cost-to-go) | $\boldsymbol{\Sigma}$ (error covariance) |
| $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ | $\mathbf{L}^\top = \mathbf{V}^{-1}\mathbf{C}\boldsymbol{\Sigma}$ |
| stabilizable $(\mathbf{A},\mathbf{B})$ | detectable $(\mathbf{A},\mathbf{C})$ |
| detectable $(\mathbf{A},\mathbf{Q}^{1/2})$ | stabilizable $(\mathbf{A},\mathbf{G}\mathbf{W}^{1/2})$ |
| closed loop $\mathbf{A}-\mathbf{B}\mathbf{K}$ stable | error dynamics $\mathbf{A}-\mathbf{L}\mathbf{C}$ stable |

Every Riccati solver written for the regulator solves the filter problem by being handed $(\mathbf{A}^\top, \mathbf{C}^\top, \mathbf{G}\mathbf{W}\mathbf{G}^\top, \mathbf{V})$ and transposing the answer. The symmetric root locus transfers too: the noise ratio $\mathbf{W}/\mathbf{V}$ plays the part of $1/\mathbf{R}$, so a low-noise sensor produces a fast estimator on the same Butterworth pattern the cheap-control limit produced for the regulator.

## The separation theorem

> **Stochastic separation.** For the linear plant with Gaussian noise and quadratic cost above, the optimal control law is $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$, where $\mathbf{K}$ is the deterministic LQR gain computed from $(\mathbf{A},\mathbf{B},\mathbf{Q},\mathbf{R})$ with no reference to the noise, and $\hat{\mathbf{x}}$ is the Kalman estimate computed from $(\mathbf{A},\mathbf{C},\mathbf{G}\mathbf{W}\mathbf{G}^\top,\mathbf{V})$ with no reference to the cost.

The reason it works is worth carrying. Write $\mathbf{x} = \hat{\mathbf{x}} + \mathbf{e}$. The Kalman filter's defining property is that the error $\mathbf{e}$ is orthogonal to — and hence, being Gaussian, independent of — everything in the measurement history, including $\hat{\mathbf{x}}$. So for any control law built from measurements,

$$
\mathbb{E}\big[\mathbf{x}^\top\mathbf{Q}\mathbf{x}\big] = \mathbb{E}\big[\hat{\mathbf{x}}^\top\mathbf{Q}\hat{\mathbf{x}}\big] + \mathbb{E}\big[\mathbf{e}^\top\mathbf{Q}\mathbf{e}\big],
$$

and the second term does not depend on $\mathbf{u}$ at all — the filter's accuracy is unaffected by what the controller does, because the filter knows the control it applied. The controller is therefore left minimising a quadratic cost in $\hat{\mathbf{x}}$, whose dynamics are the plant's driven by the innovation; and that is the deterministic problem, whose answer is $-\mathbf{K}\hat{\mathbf{x}}$. The property being used is **certainty equivalence**: the optimal action is the one you would take if the estimate were the truth.

::: key LQG structure
LQG is LQR state feedback applied to the Kalman filter estimate. The stochastic separation theorem says the two designs are individually optimal — which is true for the cost and false for the margins.
:::

## The closed loop

Write the compensated system in the coordinates $(\mathbf{x}, \mathbf{e})$. Since $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}} = -\mathbf{K}(\mathbf{x}-\mathbf{e})$ and the error obeys $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e} + \mathbf{G}\mathbf{w} - \mathbf{L}\mathbf{v}$,

$$
\frac{d}{dt}\begin{bmatrix}\mathbf{x}\\ \mathbf{e}\end{bmatrix}
= \begin{bmatrix}\mathbf{A}-\mathbf{B}\mathbf{K} & \mathbf{B}\mathbf{K}\\ \mathbf{0} & \mathbf{A}-\mathbf{L}\mathbf{C}\end{bmatrix}
\begin{bmatrix}\mathbf{x}\\ \mathbf{e}\end{bmatrix}
+ \begin{bmatrix}\mathbf{G} & \mathbf{0}\\ \mathbf{G} & -\mathbf{L}\end{bmatrix}\begin{bmatrix}\mathbf{w}\\ \mathbf{v}\end{bmatrix}.
$$

The system matrix is block upper triangular, so its eigenvalues are the union of those of $\mathbf{A}-\mathbf{B}\mathbf{K}$ and those of $\mathbf{A}-\mathbf{L}\mathbf{C}$: the regulator poles and the estimator poles, unmoved by each other's presence. That is the pole-placement form of separation, and it is what makes the design decomposable in practice as well as in theory.

::: example An LQG attitude loop, end to end
Reaction-wheel axis, $J = 120\,\mathrm{kg\,m^2}$, states $(\theta, \omega)$. The wheel torque command is corrupted by a broadband disturbance torque of intensity $\mathbf{W} = (2\,\mathrm{mN\,m})^2 = 4\times10^{-6}\,\mathrm{(N\,m)^2\,s}$ entering through $\mathbf{G} = \mathbf{B}$, and a star tracker measures $\theta$ at $10\,\mathrm{Hz}$ with $1$ arcsecond of noise, giving a continuous-time intensity $\mathbf{V} = (4.848\times10^{-6})^2 \times 0.1 = 2.350\times10^{-12}\,\mathrm{rad^2\,s}$. The regulator uses the effort-sized weights of the tuning lesson.

**Regulator.** $\mathbf{K} = (91.673,\ 150.089)$, poles $-0.6254 \pm 0.6106j\,\mathrm{s^{-1}}$, $\omega_n = 0.8740\,\mathrm{rad/s}$.

**Estimator.** Solving the filter Riccati equation,

$$
\boldsymbol{\Sigma} = \begin{bmatrix}1.0960\times10^{-11} & 2.5552\times10^{-11}\\ 2.5552\times10^{-11} & 1.1914\times10^{-10}\end{bmatrix},
\qquad
\mathbf{L} = \begin{bmatrix}4.6629\\ 10.8711\end{bmatrix},
$$

with estimator poles $-2.3314 \pm 2.3314j\,\mathrm{s^{-1}}$ — damping exactly $0.7071$, the dual of the Butterworth pattern from the cheap-control lesson, and natural frequency $\omega_e = 3.2971\,\mathrm{rad/s}$, matching the closed form $\big(W/(J^2V)\big)^{1/4}$ to five digits. The estimator is $3.77$ times the regulator bandwidth, squarely in the usual band. On its own the filter knows the attitude to $0.683$ arcsecond and the rate to $6.25\times10^{-4}\,^\circ/\mathrm{s}$.

**Closed loop.** The four eigenvalues of the compensated system are $-0.6254 \pm 0.6106j$ and $-2.3314 \pm 2.3314j$ — the union, to machine precision, with nothing moved.

**Performance.** Solving the augmented Lyapunov equation for the steady-state covariance:

| Quantity | LQG | Full state feedback |
| --- | --- | --- |
| $\sigma_\theta$ | $3.992$ arcsec | $2.487$ arcsec |
| $\sigma_\omega$ | $8.98\times10^{-4}\,^\circ/\mathrm{s}$ | — |
| $\sigma_u$ | $2.28\,\mathrm{mN\,m}$ | $1.93\,\mathrm{mN\,m}$ |
| average cost | $1.3253\times10^{-5}$ | $7.8172\times10^{-6}$ |

Estimating the state rather than knowing it costs $61\,\%$ in pointing RMS and $70\,\%$ in cost on this loop. Note also that the achieved $\sigma_\theta = 3.99$ arcsec is much larger than the filter's own $0.68$ arcsec error: the filter is accurate, and what dominates the pointing is the regulator's response to the disturbance torque, not the estimate's error.
:::

## What LQG costs, exactly

The steady-state average cost has a closed form with an instructive split:

$$
J_{\text{LQG}} = \underbrace{\mathrm{tr}\big(\mathbf{P}\,\mathbf{G}\mathbf{W}\mathbf{G}^\top\big)}_{\text{cost with perfect state knowledge}} + \underbrace{\mathrm{tr}\big(\boldsymbol{\Sigma}\,\mathbf{K}^\top\mathbf{R}\mathbf{K}\big)}_{\text{price of estimating}} ,
$$

where $\mathbf{P}$ solves the control Riccati equation and $\boldsymbol{\Sigma}$ the filter one. An equivalent form, obtained by swapping which Riccati solution carries which noise, is $J_{\text{LQG}} = \mathrm{tr}(\boldsymbol{\Sigma}\mathbf{Q}) + \mathrm{tr}(\mathbf{P}\mathbf{L}\mathbf{V}\mathbf{L}^\top)$.

For the loop above: $\mathrm{tr}(\mathbf{P}\mathbf{G}\mathbf{W}\mathbf{G}^\top) = 7.8172\times10^{-6}$, which is exactly the full-state-feedback cost computed independently, and $\mathrm{tr}(\boldsymbol{\Sigma}\mathbf{K}^\top\mathbf{R}\mathbf{K}) = 5.4363\times10^{-6}$; their sum is $1.32534\times10^{-5}$, matching the Lyapunov result to six digits. The second form gives $2.4170\times10^{-7} + 1.30117\times10^{-5}$ and the same total.

The first decomposition is the one to remember, because it turns a design question into arithmetic: the first term is what the disturbance costs you even with a perfect sensor, and no filter can reduce it. The second term is what the sensor costs, and it falls as $\boldsymbol{\Sigma}$ falls. If the first term dominates, buying a better sensor is wasted money and the answer is a stiffer loop or a quieter vehicle; if the second dominates, the sensor is the bottleneck.

::: example How good does the sensor need to be
Hold the regulator fixed and sweep the star-tracker noise:

| $1\sigma$ noise | $\mathbf{L}$ | $\omega_e\,(\mathrm{rad/s})$ | $\omega_e/\omega_n$ | $\sigma_\theta$ | $\sigma_u\,(\mathrm{mN\,m})$ |
| --- | --- | --- | --- | --- | --- |
| $0.2$ arcsec | $(10.43,\ 54.36)$ | $7.373$ | $8.44$ | $3.118$ arcsec | $2.08$ |
| $0.5$ arcsec | $(6.594,\ 21.74)$ | $4.663$ | $5.34$ | $3.516$ arcsec | $2.18$ |
| $1$ arcsec | $(4.663,\ 10.87)$ | $3.297$ | $3.77$ | $3.992$ arcsec | $2.28$ |
| $3$ arcsec | $(2.692,\ 3.624)$ | $1.904$ | $2.18$ | $5.296$ arcsec | $2.55$ |
| $10$ arcsec | $(1.475,\ 1.087)$ | $1.043$ | $1.19$ | $8.271$ arcsec | $3.10$ |

The estimator bandwidth goes as the fourth root of the noise ratio, so a factor of $50$ in sensor quality buys a factor of $50^{1/4} = 2.66$ in estimator speed — and only $2.7$ in achieved pointing, because at the good end the disturbance-driven floor of $2.49$ arcsec takes over. The last row is the interesting one: with a $10$ arcsec sensor the estimator is barely faster than the regulator, its transients are inside the control loop rather than outside it, and both pointing and control effort deteriorate sharply. That is the origin of the usual guidance that an observer should run two to six times the controller bandwidth — fast enough that estimation transients die before the controller reacts to them, not so fast that it amplifies noise through $\mathbf{L}$.
:::

::: warning Separation is about the cost, not about robustness
The separation theorem is exactly two claims: the optimal compensator is the filter followed by the regulator gain, and the closed-loop poles are the union of the two designs' poles. It says nothing about the loop transfer function at the plant input, and the previous lesson showed what happens there — Doyle's example has both halves individually optimal and a combined gain margin of one part in a thousand. Every design review should therefore report the margins of the *compensated* loop, computed from $\mathbf{L}_{\text{LQG}}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$, never the LQR margins of the state-feedback design. The next lesson is about buying some of them back.
:::

::: note What LQG assumes, and what happens when it is wrong
Gaussian, white, zero-mean, known intensities, uncorrelated with each other, and a model that is exactly right. Real disturbances are none of these: solar pressure has a once-per-orbit period, gyro noise has a random-walk component, star-tracker errors are correlated with the field of view, and flexible modes are unmodelled dynamics rather than noise. The standard repairs are to augment the state with a model of the coloured disturbance — a bias state, a first-order Gauss–Markov process, a harmonic oscillator at orbit rate — so that the augmented noise really is white, and then to inflate $\mathbf{W}$ beyond any physical justification to keep the filter from becoming overconfident and diverging. Both are standard, both are honest engineering, and both mean the filter you fly is not the optimal one for the noise you assumed.
:::

## Check yourself

::: check
State the separation theorem precisely, and say which of its two claims fails when the noise is not Gaussian.
:::

::: answer
The theorem: for a linear plant with additive white Gaussian process and measurement noise and a quadratic cost, the control law minimising the expected cost over all measurement-feedback laws is $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$, with $\mathbf{K}$ the deterministic LQR gain for $(\mathbf{A},\mathbf{B},\mathbf{Q},\mathbf{R})$ and $\hat{\mathbf{x}}$ the Kalman estimate for $(\mathbf{A},\mathbf{C},\mathbf{G}\mathbf{W}\mathbf{G}^\top,\mathbf{V})$; and the closed-loop eigenvalues are the union of those of $\mathbf{A}-\mathbf{B}\mathbf{K}$ and $\mathbf{A}-\mathbf{L}\mathbf{C}$. Without Gaussianity the second claim survives — it is pure linear algebra on the block-triangular system matrix and needs no distributional assumption — and so does a weaker version of the first: among *linear* controllers, the Kalman filter is still the minimum-variance estimator and the combination is still optimal. What is lost is optimality over all controllers, because for non-Gaussian noise the conditional mean is generally a nonlinear function of the measurements and a nonlinear estimator can do better.
:::

::: check
Why does the filter's error covariance not depend on the control law?
:::

::: answer
Because the filter is told the control. Its propagation step uses $\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}(\mathbf{y}-\mathbf{C}\hat{\mathbf{x}})$ with the same $\mathbf{u}$ that was applied, so subtracting it from the true dynamics gives $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e} + \mathbf{G}\mathbf{w} - \mathbf{L}\mathbf{v}$, in which $\mathbf{u}$ has cancelled entirely. The error dynamics are autonomous, driven only by the two noises, so $\boldsymbol{\Sigma}$ depends on $\mathbf{A}$, $\mathbf{C}$, $\mathbf{G}$, $\mathbf{W}$ and $\mathbf{V}$ and on nothing the controller does. This is precisely the fact that makes separation work, and it fails the moment the applied control differs from the commanded one — actuator saturation is the common case, which is why a saturating LQG loop is not covered by the theorem.
:::

::: check
In the worked example the filter estimates attitude to $0.68$ arcsec but the loop holds attitude to only $3.99$ arcsec. Explain, and say what you would change to improve the pointing.
:::

::: answer
The two numbers measure different things. $0.68$ arcsec is how far the estimate is from the truth; $3.99$ arcsec is how far the truth is from zero. The disturbance torque pushes the vehicle around and the regulator, at $0.874\,\mathrm{rad/s}$ of bandwidth, lets it move that much before pulling it back — the cost decomposition makes this explicit, with $7.82\times10^{-6}$ of the $1.33\times10^{-5}$ total attributable to the disturbance under perfect state knowledge. So the dominant term is the regulator's, not the filter's. To improve pointing, raise the regulator bandwidth (lower $\mathbf{R}$), which the sweep shows moves the full-state-feedback floor down, or reduce the disturbance itself. A better star tracker helps only with the remaining $5.44\times10^{-6}$, and the sensor sweep confirms it: going from $1$ to $0.2$ arcsec improves pointing from $3.99$ to $3.12$ arcsec and no further, because the floor at $2.49$ arcsec is set by the disturbance and the loop bandwidth.
:::

::: check
Your estimator poles come out slower than your regulator poles. What goes wrong, and why does the steady-state cost formula fail to show it?
:::

::: answer
The estimator's transients are then inside the control loop's bandwidth rather than outside it, so the regulator is acting on an estimate that is still converging and is effectively chasing filter dynamics. Symptoms are extra phase lag around the loop, a sluggish and often oscillatory disturbance response, and much worse margins than the state-feedback design would suggest. The steady-state cost formula does not display this because it is a steady-state statistic: $\mathrm{tr}(\mathbf{P}\mathbf{G}\mathbf{W}\mathbf{G}^\top) + \mathrm{tr}(\boldsymbol{\Sigma}\mathbf{K}^\top\mathbf{R}\mathbf{K})$ counts the cost of a large $\boldsymbol{\Sigma}$ but says nothing about where the poles sit. The last row of the sensor sweep is exactly this case — $\omega_e/\omega_n = 1.19$ — and it shows up as pointing degrading from $3.99$ to $8.27$ arcsec and control effort rising, but you would only see the phase problem by computing the compensated loop's margins.
:::

::: check
Your vehicle's dominant disturbance is solar radiation pressure, which is essentially sinusoidal at orbit rate rather than white. How would you keep using this machinery?
:::

::: answer
Augment the state with a model of the disturbance so that the augmented system really is driven by white noise. For a sinusoid at known frequency $\omega_o$, add two states $\mathbf{d}$ obeying $\dot{\mathbf{d}} = \begin{bmatrix}0 & \omega_o\\ -\omega_o & 0\end{bmatrix}\mathbf{d} + \mathbf{w}_d$ with a small white $\mathbf{w}_d$ to allow amplitude and phase to drift, and let the first component enter the plant as the disturbance torque. Design the Kalman filter on the augmented plant: it will estimate the disturbance as well as the attitude, and the controller can then cancel it by feedforward, which is an internal-model argument rather than a bandwidth argument and is far cheaper than trying to reject a persistent sinusoid with gain. The same trick with a constant instead of a sinusoid is the integral action of the earlier lesson, and with a random walk it is the standard gyro-bias state. Check observability of the augmented pair before trusting any of it — a disturbance state that cannot be distinguished from an attitude error will not be estimated.
:::

## Summary

| Object | Statement |
| --- | --- |
| Stochastic plant | $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}+\mathbf{G}\mathbf{w}$, $\mathbf{y} = \mathbf{C}\mathbf{x}+\mathbf{v}$, intensities $\mathbf{W}$, $\mathbf{V}$ |
| Cost | $\lim_{T\to\infty}\mathbb{E}\big[\tfrac1T\int_0^T(\mathbf{x}^\top\mathbf{Q}\mathbf{x}+\mathbf{u}^\top\mathbf{R}\mathbf{u})dt\big]$ |
| Filter ARE | $\mathbf{A}\boldsymbol{\Sigma}+\boldsymbol{\Sigma}\mathbf{A}^\top - \boldsymbol{\Sigma}\mathbf{C}^\top\mathbf{V}^{-1}\mathbf{C}\boldsymbol{\Sigma} + \mathbf{G}\mathbf{W}\mathbf{G}^\top = \mathbf{0}$ |
| Kalman gain | $\mathbf{L} = \boldsymbol{\Sigma}\mathbf{C}^\top\mathbf{V}^{-1}$ |
| Duality | $(\mathbf{A},\mathbf{B},\mathbf{Q},\mathbf{R},\mathbf{P},\mathbf{K}) \leftrightarrow (\mathbf{A}^\top,\mathbf{C}^\top,\mathbf{G}\mathbf{W}\mathbf{G}^\top,\mathbf{V},\boldsymbol{\Sigma},\mathbf{L}^\top)$ |
| Separation | $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ is optimal; each half designed ignoring the other |
| Certainty equivalence | Act on the estimate as though it were the truth |
| Closed-loop poles | $\mathrm{eig}(\mathbf{A}-\mathbf{B}\mathbf{K}) \cup \mathrm{eig}(\mathbf{A}-\mathbf{L}\mathbf{C})$ |
| Cost | $J = \mathrm{tr}(\mathbf{P}\mathbf{G}\mathbf{W}\mathbf{G}^\top) + \mathrm{tr}(\boldsymbol{\Sigma}\mathbf{K}^\top\mathbf{R}\mathbf{K}) = \mathrm{tr}(\boldsymbol{\Sigma}\mathbf{Q}) + \mathrm{tr}(\mathbf{P}\mathbf{L}\mathbf{V}\mathbf{L}^\top)$ |
| Worked loop | $\mathbf{L} = (4.663,\ 10.871)$, estimator poles $-2.331\pm2.331j$, $\sigma_\theta = 3.99$ arcsec against $2.49$ with perfect state |
| Cost split | $7.8172\times10^{-6}$ disturbance $+\ 5.4363\times10^{-6}$ estimation $=1.32534\times10^{-5}$ |
| Observer speed | Two to six times the controller bandwidth in practice |
| What separation is not | A robustness result; always compute the compensated loop's margins |

The next lesson takes the margins that were lost here and asks what it takes to get them back.
