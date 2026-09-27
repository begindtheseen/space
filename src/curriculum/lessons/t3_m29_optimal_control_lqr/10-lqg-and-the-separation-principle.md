---
id: l10-lqg-and-the-separation-principle
title: LQG and the stochastic separation principle
minutes: 20
covers:
  - LQG = LQR + Kalman filter, and the stochastic separation principle
---

Picture a car driving through thick fog with two people in the front. The navigator cannot see the road either, but she has a map, the speedometer, and a phone that gives a jumpy GPS fix every few seconds. Her job is to say, "I think we are *here*." The driver's job is to steer as if the navigator is right. Neither has to understand the other's job in detail. That split is the whole idea of this lesson.

For nine lessons we have assumed the full state vector arrives on a wire, exact and instant. No vehicle works that way. A spacecraft measures its attitude with a **[[star tracker|star-tracker]]** a few times per second and its turn rate with a gyro that slowly drifts. A launch vehicle measures acceleration and rate and has to add them up to know its position. A lander's radar stops working below some altitude. The state is *worked out*, not read, and working it out has its own delays and errors.

**Linear quadratic Gaussian** control — **LQG** — is the answer to the noisy version of the regulator problem. The recipe is tidy. Estimate the state with a Kalman filter, designed as if no controller existed. Compute the LQR gain, designed as if the state were known exactly. Then apply the LQR gain to the filter's estimate. Each half is optimal on its own, and together they are optimal for the combined problem. That fact is the **separation theorem**. It turns a hard problem into two Riccati equations you already know how to solve.

Lesson 5 already showed the price. Separation is a statement about the average cost and about where the closed-loop poles land. It is *not* a statement about robustness. Treating it as one is the most reliable way to build a controller that is optimal on paper and unflyable in practice.

## The noisy problem

Now the plant has noise on both sides — noise pushing the vehicle, and noise on the sensor:

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{G}\mathbf{w},
\qquad
\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{v}.
$$

Here $\mathbf{w}$ is the **process noise** — random pushes on the vehicle, like gusts or a wobbly torque. $\mathbf{G}$ says where those pushes enter. $\mathbf{y}$ is the measurement, $\mathbf{C}$ says which parts of the state the sensor sees, and $\mathbf{v}$ is the **measurement noise** — the sensor's jitter.

Both noises are **[[zero-mean white Gaussian|white-gaussian]]** processes. Zero-mean means they average out to nothing. White means each instant is unrelated to the next. Gaussian means their values follow the bell curve. Their strength is given by an **intensity**: $\mathbf{W} \succeq 0$ for the process noise and $\mathbf{V} \succ 0$ for the sensor. (Read $\succeq 0$ as "positive semi-definite" and $\succ 0$ as "positive definite", as in lesson 1.) The two noises are assumed uncorrelated with each other.

With noise in the loop, the cost can no longer be a single number for a single run. Every run is different. So we average it. The symbol $\mathbb{E}[\cdot]$, read "the expected value of", means the average over all the ways the noise could come out:

$$
J = \lim_{T\to\infty}\ \mathbb{E}\left[\frac{1}{T}\int_0^T\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)dt\right].
$$

This is the long-run average cost per second. We minimise it over every control law that uses only the measurement history — everything $\mathbf{y}(\tau)$ for times $\tau \le t$. That restriction is what makes the problem hard in principle. The control is no longer a function of a state. It is a function of a whole stream of past data.

## The estimator is the regulator in a mirror

The best estimator for this plant is the steady-state **[[Kalman filter|kalman-filter]]**. It runs a copy of the plant model inside the computer and nudges that copy toward the measurements:

$$
\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}\big(\mathbf{y} - \mathbf{C}\hat{\mathbf{x}}\big),
\qquad
\mathbf{L} = \boldsymbol{\Sigma}\mathbf{C}^\top\mathbf{V}^{-1}.
$$

Read $\hat{\mathbf{x}}$ as "x hat", the estimate. The bracket $\mathbf{y} - \mathbf{C}\hat{\mathbf{x}}$ is the **innovation**: the surprise, meaning the difference between what the sensor said and what the model expected it to say. The **Kalman gain** $\mathbf{L}$ decides how hard to react to that surprise. A big $\mathbf{L}$ trusts the sensor. A small $\mathbf{L}$ trusts the model.

The gain depends on $\boldsymbol{\Sigma}$ ("capital sigma"), the **error covariance**. It is $\boldsymbol{\Sigma} = \mathbb{E}[\mathbf{e}\mathbf{e}^\top]$, where $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$ is the estimation error. Its diagonal holds the squared typical error of each state. In steady state it solves the **filter algebraic Riccati equation**:

$$
\mathbf{A}\boldsymbol{\Sigma} + \boldsymbol{\Sigma}\mathbf{A}^\top - \boldsymbol{\Sigma}\mathbf{C}^\top\mathbf{V}^{-1}\mathbf{C}\boldsymbol{\Sigma} + \mathbf{G}\mathbf{W}\mathbf{G}^\top = \mathbf{0}.
$$

Look closely and you will recognize it. It is the CARE with the letters swapped by a dictionary. This mirror relationship is called **[[duality|duality]]**, and every fact proved about the regulator carries over:

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

So any Riccati solver written for the regulator also solves the filter. Hand it $(\mathbf{A}^\top, \mathbf{C}^\top, \mathbf{G}\mathbf{W}\mathbf{G}^\top, \mathbf{V})$ and transpose the gain it returns.

The symmetric root locus from lesson 8 carries over too. The noise ratio $\mathbf{W}/\mathbf{V}$ plays the part of $1/\mathbf{R}$. A quiet sensor (small $\mathbf{V}$) makes a fast estimator, on the same Butterworth pattern that cheap control gave the regulator.

## The separation theorem

Here is the result stated carefully.

> **Stochastic separation.** For the linear plant with Gaussian noise and quadratic cost above, the optimal control law is $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$. Here $\mathbf{K}$ is the ordinary LQR gain computed from $(\mathbf{A},\mathbf{B},\mathbf{Q},\mathbf{R})$ with no reference to the noise, and $\hat{\mathbf{x}}$ is the Kalman estimate computed from $(\mathbf{A},\mathbf{C},\mathbf{G}\mathbf{W}\mathbf{G}^\top,\mathbf{V})$ with no reference to the cost.

In the fog, the driver steers exactly as she would on a clear day, using the navigator's best guess in place of the real position. That habit has a name: **[[certainty equivalence|certainty-equivalence]]**. The optimal action is the one you would take if the estimate were the truth.

::: key LQG structure
LQG is LQR state feedback applied to the Kalman filter estimate. The stochastic separation theorem says the two designs are individually optimal — which is true for the cost and false for the margins.
:::

::: note Why it has to be true
Split the true state into the estimate plus the error: $\mathbf{x} = \hat{\mathbf{x}} + \mathbf{e}$.

The Kalman filter's defining property is that its error $\mathbf{e}$ is **orthogonal** to everything in the measurement history — uncorrelated with it. For Gaussian signals, uncorrelated means fully independent. The estimate $\hat{\mathbf{x}}$ is built from that history, so $\mathbf{e}$ is independent of $\hat{\mathbf{x}}$. The cross terms therefore average to zero, and the state cost splits in two:

$$
\mathbb{E}\big[\mathbf{x}^\top\mathbf{Q}\mathbf{x}\big] = \mathbb{E}\big[\hat{\mathbf{x}}^\top\mathbf{Q}\hat{\mathbf{x}}\big] + \mathbb{E}\big[\mathbf{e}^\top\mathbf{Q}\mathbf{e}\big].
$$

The second term does not depend on $\mathbf{u}$ at all. The filter's accuracy is unaffected by what the controller does, because the filter is told which control was applied. So the controller is left minimising a quadratic cost in $\hat{\mathbf{x}}$. The estimate moves like the plant, driven by the innovation. That is the deterministic LQR problem again, and its answer is $-\mathbf{K}\hat{\mathbf{x}}$.
:::

## The closed loop

What does the whole system do once the two halves are wired together? Track two things: the true state $\mathbf{x}$ and the error $\mathbf{e}$.

Start with the error. Subtract the filter equation from the plant equation. The $\mathbf{B}\mathbf{u}$ terms cancel, because the filter used the same $\mathbf{u}$ the plant received. What is left is

$$
\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e} + \mathbf{G}\mathbf{w} - \mathbf{L}\mathbf{v}.
$$

Now the state. The control is $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}} = -\mathbf{K}(\mathbf{x}-\mathbf{e})$. Put that into the plant and stack both equations:

$$
\frac{d}{dt}\begin{bmatrix}\mathbf{x}\\ \mathbf{e}\end{bmatrix}
= \begin{bmatrix}\mathbf{A}-\mathbf{B}\mathbf{K} & \mathbf{B}\mathbf{K}\\ \mathbf{0} & \mathbf{A}-\mathbf{L}\mathbf{C}\end{bmatrix}
\begin{bmatrix}\mathbf{x}\\ \mathbf{e}\end{bmatrix}
+ \begin{bmatrix}\mathbf{G} & \mathbf{0}\\ \mathbf{G} & -\mathbf{L}\end{bmatrix}\begin{bmatrix}\mathbf{w}\\ \mathbf{v}\end{bmatrix}.
$$

The big matrix has a block of zeros in its bottom-left corner. It is **[[block upper triangular|block-triangular]]**, and the eigenvalues of such a matrix are the eigenvalues of its diagonal blocks put together. So the closed-loop poles are the regulator poles, $\mathrm{eig}(\mathbf{A}-\mathbf{B}\mathbf{K})$, together with the estimator poles, $\mathrm{eig}(\mathbf{A}-\mathbf{L}\mathbf{C})$. Neither set moves the other. This is the pole-placement form of separation, and it is why the design splits cleanly in practice as well as in theory.

::: example An LQG attitude loop, end to end
Take the reaction-wheel axis from the tuning lesson: inertia $J = 120\,\mathrm{kg\,m^2}$, states $(\theta, \omega)$ — angle and turn rate — and the effort-sized weights of lesson 4.

**The noise.** The wheel torque is spoiled by a random disturbance torque of about $2\,\mathrm{mN\,m}$, entering where the control does, so $\mathbf{G} = \mathbf{B}$. Its intensity is $\mathbf{W} = (2\,\mathrm{mN\,m})^2 = 4\times10^{-6}\,\mathrm{(N\,m)^2\,s}$. A star tracker measures $\theta$ ten times a second with $1$ **[[arcsecond|arcsecond]]** of noise. One arcsecond is $4.848\times10^{-6}\,\mathrm{rad}$. The **[[continuous-time intensity|intensity-from-samples]]** is the variance times the sample spacing: $\mathbf{V} = (4.848\times10^{-6})^2 \times 0.1 = 2.350\times10^{-12}\,\mathrm{rad^2\,s}$.

**Regulator.** The LQR gain is $\mathbf{K} = (91.673,\ 150.089)$. Its poles are $-0.6254 \pm 0.6106j\,\mathrm{s^{-1}}$, with natural frequency $\omega_n = 0.8740\,\mathrm{rad/s}$.

**Estimator.** Solving the filter Riccati equation gives

$$
\boldsymbol{\Sigma} = \begin{bmatrix}1.0960\times10^{-11} & 2.5552\times10^{-11}\\ 2.5552\times10^{-11} & 1.1914\times10^{-10}\end{bmatrix},
\qquad
\mathbf{L} = \begin{bmatrix}4.6629\\ 10.8711\end{bmatrix}.
$$

The estimator poles are $-2.3314 \pm 2.3314j\,\mathrm{s^{-1}}$. Real and imaginary parts are equal, so the damping is exactly $0.7071$ — the mirror image of the Butterworth pattern from the cheap-control lesson. The natural frequency is $\omega_e = 3.2971\,\mathrm{rad/s}$, and the closed form $\big(W/(J^2V)\big)^{1/4}$ gives the same number to five digits. The estimator runs $3.77$ times faster than the regulator, well inside the usual range.

How good is the estimate by itself? Take square roots of the diagonal of $\boldsymbol{\Sigma}$. The filter knows the attitude to $0.683$ arcsecond and the rate to $6.25\times10^{-4}\,^\circ/\mathrm{s}$.

**Closed loop.** The four eigenvalues of the combined system are $-0.6254 \pm 0.6106j$ and $-2.3314 \pm 2.3314j$. That is the two sets put together, to machine precision, with nothing moved.

**Performance.** Solving the Lyapunov equation of the combined system gives its steady-state spread. The symbol $\sigma$ ("sigma") is a standard deviation, a typical size:

| Quantity | LQG | Full state feedback |
| --- | --- | --- |
| $\sigma_\theta$ | $3.992$ arcsec | $2.487$ arcsec |
| $\sigma_\omega$ | $8.98\times10^{-4}\,^\circ/\mathrm{s}$ | — |
| $\sigma_u$ | $2.28\,\mathrm{mN\,m}$ | $1.93\,\mathrm{mN\,m}$ |
| average cost | $1.3253\times10^{-5}$ | $7.8172\times10^{-6}$ |

Estimating the state instead of knowing it costs $61\,\%$ in pointing ($3.992/2.487 = 1.61$) and $70\,\%$ in cost ($1.3253/0.78172 = 1.70$).

Sanity check: the loop holds attitude to $3.99$ arcsec, far worse than the filter's own $0.68$ arcsec error. Is that a contradiction? No. The filter is accurate. What sets the pointing is how far the disturbance torque pushes the vehicle before the regulator pulls it back.
:::

## What LQG costs, exactly

The average cost has a closed form that splits into two meaningful pieces:

$$
J_{\text{LQG}} = \underbrace{\mathrm{tr}\big(\mathbf{P}\,\mathbf{G}\mathbf{W}\mathbf{G}^\top\big)}_{\text{cost with perfect state knowledge}} + \underbrace{\mathrm{tr}\big(\boldsymbol{\Sigma}\,\mathbf{K}^\top\mathbf{R}\mathbf{K}\big)}_{\text{price of estimating}} .
$$

Here $\mathrm{tr}$, the **trace**, is the sum of a matrix's diagonal entries. $\mathbf{P}$ solves the control Riccati equation and $\boldsymbol{\Sigma}$ the filter one. There is an equivalent form, found by swapping which Riccati solution carries which noise: $J_{\text{LQG}} = \mathrm{tr}(\boldsymbol{\Sigma}\mathbf{Q}) + \mathrm{tr}(\mathbf{P}\mathbf{L}\mathbf{V}\mathbf{L}^\top)$.

Check it on the loop above. The first piece is $\mathrm{tr}(\mathbf{P}\mathbf{G}\mathbf{W}\mathbf{G}^\top) = 7.8172\times10^{-6}$, exactly the full-state-feedback cost from the table. The second is $\mathrm{tr}(\boldsymbol{\Sigma}\mathbf{K}^\top\mathbf{R}\mathbf{K}) = 5.4363\times10^{-6}$. Their sum is $1.32534\times10^{-5}$, matching the Lyapunov result to six digits. The second form gives $2.4170\times10^{-7} + 1.30117\times10^{-5}$ — the same total, split differently.

Remember the first form, because it turns a design question into **[[arithmetic|cost-split]]**. The first piece is what the disturbance costs you even with a perfect sensor. No filter can shrink it. The second piece is what the sensor costs, and it falls as $\boldsymbol{\Sigma}$ falls. If the first piece dominates, a better sensor is wasted money: you need a stiffer loop or a quieter vehicle. If the second dominates, the sensor is the bottleneck.

::: example How good does the sensor need to be?
Keep the regulator fixed and try star trackers of different quality:

| $1\sigma$ noise | $\mathbf{L}$ | $\omega_e\,(\mathrm{rad/s})$ | $\omega_e/\omega_n$ | $\sigma_\theta$ | $\sigma_u\,(\mathrm{mN\,m})$ |
| --- | --- | --- | --- | --- | --- |
| $0.2$ arcsec | $(10.43,\ 54.36)$ | $7.373$ | $8.44$ | $3.118$ arcsec | $2.08$ |
| $0.5$ arcsec | $(6.594,\ 21.74)$ | $4.663$ | $5.33$ | $3.516$ arcsec | $2.18$ |
| $1$ arcsec | $(4.663,\ 10.87)$ | $3.297$ | $3.77$ | $3.992$ arcsec | $2.28$ |
| $3$ arcsec | $(2.692,\ 3.624)$ | $1.904$ | $2.18$ | $5.296$ arcsec | $2.55$ |
| $10$ arcsec | $(1.475,\ 1.087)$ | $1.043$ | $1.19$ | $8.271$ arcsec | $3.10$ |

The estimator's speed goes as the fourth root of the noise ratio. So a sensor $50$ times better (from $10$ down to $0.2$ arcsec) buys only $50^{1/4} = 2.66$ in estimator speed. The pointing improves by about the same factor, $8.271/3.118 = 2.65$. At the good end it cannot go further, because the disturbance-driven floor of $2.49$ arcsec takes over.

The last row is the interesting one. With a $10$ arcsec sensor the estimator is barely faster than the regulator. Its slow settling now sits *inside* the control loop, and both pointing and control effort get sharply worse. That is where the usual rule comes from: an observer should run **two to six times** the controller bandwidth. Fast enough that its transients die before the controller reacts to them. Not so fast that it amplifies sensor noise through $\mathbf{L}$.
:::

::: warning Separation is about the cost, not about robustness
The separation theorem makes exactly two claims. The optimal compensator is the filter followed by the regulator gain. And the closed-loop poles are the two designs' poles put together. It says nothing about the loop at the plant input — and lesson 5 showed what happens there. **[[Doyle's example|doyle]]** has both halves individually optimal and a combined gain margin of one part in a thousand.

So every design review must report the margins of the *compensated* loop, computed from

$$
\mathbf{L}_{\text{LQG}}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B},
$$

never the LQR margins of the state-feedback design. The next lesson is about buying some of them back.
:::

::: note What LQG assumes, and what happens when it is wrong
LQG assumes noise that is Gaussian, white, zero-mean, of known strength, uncorrelated between the two sources — and a model that is exactly right. Real disturbances are none of these. Solar radiation pressure repeats once per orbit. Gyro noise has a slowly wandering random-walk part. Star-tracker errors depend on where the tracker is looking. Flexible modes are missing dynamics, not noise.

There are two standard repairs. First, add a model of the **[[colored disturbance|colored-noise]]** to the state — a bias state, a first-order Gauss–Markov process, an oscillator at orbit rate — so that what drives the bigger model really is white. Second, inflate $\mathbf{W}$ beyond any physical reason, to stop the filter from becoming overconfident and drifting away from the truth. Both are honest engineering. Both mean the filter you fly is not the optimal one for the noise you assumed.
:::

## Check yourself

::: check
State the separation theorem precisely, and say which of its two claims fails when the noise is not Gaussian.
:::

::: answer
The theorem: for a linear plant with additive white Gaussian process and measurement noise and a quadratic cost, the control law that minimises the expected cost over all measurement-feedback laws is $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$. Here $\mathbf{K}$ is the deterministic LQR gain for $(\mathbf{A},\mathbf{B},\mathbf{Q},\mathbf{R})$ and $\hat{\mathbf{x}}$ is the Kalman estimate for $(\mathbf{A},\mathbf{C},\mathbf{G}\mathbf{W}\mathbf{G}^\top,\mathbf{V})$. And the closed-loop eigenvalues are those of $\mathbf{A}-\mathbf{B}\mathbf{K}$ together with those of $\mathbf{A}-\mathbf{L}\mathbf{C}$.

Without Gaussian noise, the second claim survives. It is pure linear algebra on the block-triangular matrix and needs no assumption about the noise's distribution. A weaker version of the first also survives: among *linear* controllers, the Kalman filter is still the minimum-variance estimator and the combination is still optimal. What is lost is optimality over *all* controllers. For non-Gaussian noise the best estimate (the conditional mean) is generally a nonlinear function of the measurements, and a nonlinear estimator can do better.
:::

::: check
Why does the filter's error covariance not depend on the control law?
:::

::: answer
Because the filter is told the control. Its equation $\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}(\mathbf{y}-\mathbf{C}\hat{\mathbf{x}})$ uses the same $\mathbf{u}$ that was applied. Subtracting it from the true dynamics gives $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e} + \mathbf{G}\mathbf{w} - \mathbf{L}\mathbf{v}$, in which $\mathbf{u}$ has cancelled completely. The error is driven only by the two noises. So $\boldsymbol{\Sigma}$ depends on $\mathbf{A}$, $\mathbf{C}$, $\mathbf{G}$, $\mathbf{W}$ and $\mathbf{V}$, and on nothing the controller does.

This is exactly the fact that makes separation work. It fails the moment the applied control differs from the commanded one. Actuator saturation is the common case, which is why a saturating LQG loop is not covered by the theorem.
:::

::: check
In the worked example the filter estimates attitude to $0.68$ arcsec but the loop holds attitude to only $3.99$ arcsec. Explain, and say what you would change to improve the pointing.
:::

::: answer
The two numbers measure different things. $0.68$ arcsec is how far the *estimate* is from the truth. $3.99$ arcsec is how far the *truth* is from zero. The disturbance torque pushes the vehicle around, and the regulator, with $0.874\,\mathrm{rad/s}$ of bandwidth, lets it drift that far before pulling it back.

The cost split makes this explicit: $7.82\times10^{-6}$ of the $1.33\times10^{-5}$ total is the disturbance's cost under perfect state knowledge. So the regulator's term dominates, not the filter's.

To improve pointing, raise the regulator bandwidth (lower $\mathbf{R}$), which lowers the full-state-feedback floor. Or reduce the disturbance itself. A better star tracker helps only with the remaining $5.44\times10^{-6}$, and the sensor sweep confirms it: going from $1$ to $0.2$ arcsec improves pointing from $3.99$ to $3.12$ arcsec and no further, because the floor at $2.49$ arcsec is set by the disturbance and the loop bandwidth.
:::

::: check
Your estimator poles come out slower than your regulator poles. What goes wrong, and why does the steady-state cost formula fail to show it?
:::

::: answer
The estimator's transients now sit inside the control loop's bandwidth instead of outside it. The regulator acts on an estimate that is still settling, so it ends up chasing the filter's own dynamics. The symptoms are extra phase lag around the loop, a sluggish and often oscillating response to disturbances, and much worse margins than the state-feedback design suggests.

The cost formula hides this because it is a steady-state average. $\mathrm{tr}(\mathbf{P}\mathbf{G}\mathbf{W}\mathbf{G}^\top) + \mathrm{tr}(\boldsymbol{\Sigma}\mathbf{K}^\top\mathbf{R}\mathbf{K})$ charges for a large $\boldsymbol{\Sigma}$, but says nothing about where the poles sit. The last row of the sensor sweep is exactly this case, with $\omega_e/\omega_n = 1.19$. It shows up as pointing degrading from $3.99$ to $8.27$ arcsec and control effort rising. But you would only see the phase problem by computing the compensated loop's margins.
:::

::: check
Your vehicle's main disturbance is solar radiation pressure, which is nearly a sine wave at orbit rate rather than white. How would you keep using this machinery?
:::

::: answer
Add a model of the disturbance to the state, so the enlarged system really is driven by white noise. For a sine wave at known frequency $\omega_o$, add two states $\mathbf{d}$ that obey

$$
\dot{\mathbf{d}} = \begin{bmatrix}0 & \omega_o\\ -\omega_o & 0\end{bmatrix}\mathbf{d} + \mathbf{w}_d,
$$

with a small white $\mathbf{w}_d$ that lets the amplitude and phase drift. Let the first component enter the plant as the disturbance torque. Design the Kalman filter on the enlarged plant. It will estimate the disturbance as well as the attitude, and the controller can then cancel it by feedforward. That is an internal-model argument, not a bandwidth argument, and it is far cheaper than fighting a steady sine wave with gain.

The same trick with a constant instead of a sine wave is the integral action of lesson 7. With a random walk it is the standard gyro-bias state. Check observability of the enlarged pair before trusting any of it: a disturbance state that cannot be told apart from an attitude error will not be estimated.
:::

## Summary

| Object | Statement |
| --- | --- |
| Noisy plant | $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}+\mathbf{G}\mathbf{w}$, $\mathbf{y} = \mathbf{C}\mathbf{x}+\mathbf{v}$, intensities $\mathbf{W}$, $\mathbf{V}$ |
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

The next lesson takes the margins that were lost here and asks what it costs to get them back.

::: context star-tracker A camera that reads the sky
A star tracker is a small camera pointed at the stars. Software matches the pattern of bright dots against a catalog, the way you might recognize the Big Dipper, and works out which way the spacecraft is pointing. Good ones reach a few arcseconds or better, but they update only a few to a few tens of times per second. Gyros fill in between the fixes — and gyros drift, which is why the two are blended by a filter rather than either being trusted alone.
:::

::: context white-gaussian Two words about noise
**Gaussian** means the values follow the bell curve: small errors are common, big ones rare, and about two thirds of samples fall within one standard deviation of zero. **White** borrows from light. White light mixes all colors equally; white noise mixes all frequencies equally, so knowing the noise now tells you nothing about the noise a moment later. Real noise is never perfectly white, but over the frequencies a controller cares about, many sensors come close.
:::

::: context kalman-filter Kalman and the Moon
Rudolf Kálmán published the discrete-time filter in 1960, and with Richard Bucy the continuous-time version in 1961. Stanley Schmidt's group at NASA Ames saw at once that it fit the navigation problem for Apollo, and a version of it flew in the Apollo guidance computer. Today almost every navigation system — in phones, aircraft and rockets — has a Kalman filter or one of its descendants at its heart.
:::

::: context duality Why the mirror works
Duality is not a coincidence of notation. Estimating a state from outputs and steering a state with inputs are the same geometry seen from opposite ends: transposing $\mathbf{A}$ turns "which states can the input reach" into "which states can the output see". That is why controllability and observability are also dual, and why lesson 3's Riccati machinery needs no second copy for the filter.
:::

::: context certainty-equivalence Acting on your best guess
Certainty equivalence is only optimal because the cost is quadratic and the noise is Gaussian. In general, a wise controller acts more cautiously when it is unsure, or even probes the system to learn more — a "dual" effect. LQG needs neither, because in the linear quadratic Gaussian world being unsure costs the same whatever you do, so the best move is to steer from the estimate as if it were true.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="15" width="90" height="36" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="185" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">plant + sensor</text>
  <rect x="220" y="95" width="100" height="36" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">Kalman filter</text>
  <rect x="40" y="95" width="80" height="36" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">gain −K</text>
  <polyline points="230,33 300,33 300,95" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="300,95 295,85 305,85" fill="#1f2a44"/>
  <text x="308" y="66" font-size="12" fill="#1f2a44">y</text>
  <line x1="220" y1="113" x2="120" y2="113" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="120,113 130,108 130,118" fill="#1f2a44"/>
  <text x="170" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">x̂</text>
  <polyline points="40,113 20,113 20,33 140,33" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="140,33 130,28 130,38" fill="#1f2a44"/>
  <text x="80" y="26" font-size="12" text-anchor="middle" fill="#1f2a44">u</text>
  <polyline points="100,33 100,70 250,70 250,95" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <polygon points="250,95 245,85 255,85" fill="#6c7a93"/>
  <text x="175" y="85" font-size="11" text-anchor="middle" fill="#6c7a93">u also goes to the filter</text>
</svg>
```
:::

::: context block-triangular The poles, drawn to scale
The four closed-loop poles of the worked example, on axes with the same scale both ways. The regulator's pair is slow and near the origin; the estimator's pair sits on the $45^\circ$ line of damping $0.707$, about $3.8$ times farther out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="300" y1="10" x2="300" y2="210" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="300" y1="110" x2="200" y2="10" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="260" y1="106" x2="260" y2="114" stroke="#1f2a44"/>
  <line x1="220" y1="106" x2="220" y2="114" stroke="#1f2a44"/>
  <line x1="180" y1="106" x2="180" y2="114" stroke="#1f2a44"/>
  <text x="260" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">−1</text>
  <text x="220" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">−2</text>
  <text x="180" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">−3</text>
  <text x="330" y="126" font-size="11" fill="#1f2a44">Re</text>
  <text x="306" y="22" font-size="11" fill="#1f2a44">Im</text>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="270" y1="80.6" x2="280" y2="90.6"/><line x1="280" y1="80.6" x2="270" y2="90.6"/>
    <line x1="270" y1="129.4" x2="280" y2="139.4"/><line x1="280" y1="129.4" x2="270" y2="139.4"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="201.7" y1="11.7" x2="211.7" y2="21.7"/><line x1="211.7" y1="11.7" x2="201.7" y2="21.7"/>
    <line x1="201.7" y1="198.3" x2="211.7" y2="208.3"/><line x1="211.7" y1="198.3" x2="201.7" y2="208.3"/>
  </g>
  <text x="270" y="72" font-size="11" text-anchor="end" fill="#1d6fd1">regulator −0.63 ± 0.61j</text>
  <text x="120" y="40" font-size="11" text-anchor="middle" fill="#b4232c">estimator</text>
  <text x="120" y="54" font-size="11" text-anchor="middle" fill="#b4232c">−2.33 ± 2.33j</text>
</svg>
```

Axes at 40 pixels per $\mathrm{s^{-1}}$. The dashed line is damping $0.707$.
:::

::: context arcsecond How small an arcsecond is
A degree is split into 60 arcminutes, and each arcminute into 60 arcseconds, so one arcsecond is $1/3600$ of a degree, or $4.848\times10^{-6}$ radian. A US quarter, about $24\,\mathrm{mm}$ across, looks one arcsecond wide from about $5\,\mathrm{km}$ away. Space telescopes need pointing steadiness far finer than that; a typical science spacecraft is happy with a few arcseconds.
:::

::: context intensity-from-samples From sampled noise to an intensity
The continuous-time equations need a noise *intensity*, measured per unit bandwidth, not a plain variance. A sensor that reports samples with variance $\sigma^2$ every $T$ seconds behaves, at low frequencies, like continuous white noise of intensity $\sigma^2 T$. The intuition: averaging many fast, noisy samples is worth as much as a few slow, clean ones, so what matters is variance times sample spacing. Here that is $(4.848\times10^{-6})^2 \times 0.1\,\mathrm{s}$.
:::

::: context cost-split The two pieces of the bill
The worked example's average cost, split the first way. The disturbance piece is the floor no sensor can remove; the estimation piece is what a better star tracker could shrink.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="185.6" height="34" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="205.6" y="30" width="129.1" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="112.8" y="52" font-size="12" text-anchor="middle" fill="#ffffff">disturbance 7.82</text>
  <text x="270.2" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">estimation 5.44</text>
  <text x="20" y="20" font-size="11" fill="#1f2a44">average cost, units of 10⁻⁶ (total 13.25)</text>
  <text x="20" y="86" font-size="11" fill="#1f2a44">tr(P·GWGᵀ): even a perfect sensor pays this</text>
  <text x="20" y="102" font-size="11" fill="#1f2a44">tr(Σ·KᵀRK): falls as the sensor improves</text>
</svg>
```

Bar lengths are drawn to scale, 23.74 pixels per $10^{-6}$.
:::

::: context doyle The one-page paper
John Doyle's 1978 note in the *IEEE Transactions on Automatic Control* was titled "Guaranteed Margins for LQG Regulators". Its abstract was three words: "There are none." Lesson 5 worked through his two-state example. It changed how the field thought about optimal control, and it helped start the robust control movement that the next module covers.
:::

::: context colored-noise Making colored noise white
Noise whose frequencies are not evenly mixed is called colored — it has a favorite rhythm. The trick is to pretend it comes out of a small filter fed by white noise. A first-order Gauss–Markov process, $\dot{d} = -d/\tau + w$, makes noise that wanders with a memory of about $\tau$ seconds. Add $d$ to the state, and the Kalman filter will estimate it along with everything else.
:::
