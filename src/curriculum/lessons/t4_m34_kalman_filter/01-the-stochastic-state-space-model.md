---
id: l01-the-stochastic-state-space-model
title: The stochastic state-space model, process noise Q and measurement noise R
minutes: 20
covers:
  - "The stochastic state-space model: process noise Q and measurement noise R"
---

The state-space module gave you $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$ and a Luenberger observer whose gain $\mathbf{L}$ you placed by hand, choosing poles two to six times faster than the controller and accepting whatever sensor noise that let through. The observer lesson ended on an admission: the principled way to choose $\mathbf{L}$ is from the noise statistics. To do that you need a model of the noise itself, written into the state equation with the same care you gave the dynamics. That model is this lesson.

A booster on its way back through the atmosphere is being pushed by winds and by a thrust the flight computer knows only approximately; its radar altimeter returns a height that jitters from return to return; its IMU integrates accelerations carrying a bias no calibration removed. The Kalman filter's whole job is to weigh these kinds of ignorance against each other, and it can do so only if each has been written down as a covariance: $\mathbf{Q}$ for what the dynamics model leaves out, $\mathbf{R}$ for what the sensor gets wrong, $\mathbf{P}_0$ for what you do not know at the start. Every later lesson in this module manipulates these three matrices. None of them can tell you whether the matrices are right.

This lesson writes the discrete stochastic model and states the assumptions behind it, derives the discrete process noise from a continuous white-noise model — including the exact result for the constant-velocity model the whole module reuses — and then does the part that decides whether a filter works in flight: tracing every entry of $\mathbf{Q}$ and $\mathbf{R}$ back to a physical source and a measured number.

## The discrete stochastic model

Take the deterministic discrete model and add one noise term to each equation:

$$
\mathbf{x}_{k+1} = \mathbf{F}_k\mathbf{x}_k + \mathbf{G}_k\mathbf{u}_k + \mathbf{w}_k, \qquad
\mathbf{z}_k = \mathbf{H}_k\mathbf{x}_k + \mathbf{v}_k.
$$

Here $\mathbf{x}_k$ is the $n$-dimensional state at time $t_k$; $\mathbf{F}_k$ is the state transition matrix, the $\mathbf{A}_d$ of the state-space module under the name the estimation literature uses ($\mathbf{F}$ or $\boldsymbol{\Phi}$); $\mathbf{G}_k$ is the discrete input matrix, formerly $\mathbf{B}_d$; $\mathbf{u}_k$ is a known input; $\mathbf{w}_k$ is the **process noise**, everything that moved the state and is not in $\mathbf{F}\mathbf{x} + \mathbf{G}\mathbf{u}$; $\mathbf{z}_k$ is the $m$-dimensional measurement; $\mathbf{H}_k$ is the measurement matrix, formerly $\mathbf{C}$; and $\mathbf{v}_k$ is the **measurement noise**. The subscripts allow every matrix to change with time. When they do not, the subscripts are dropped.

The model is completed by four statistical assumptions.

1. The process noise is zero-mean Gaussian and **white**: $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q}_k)$ with $\mathbb{E}[\mathbf{w}_k\mathbf{w}_j^{\mathsf{T}}] = \mathbf{Q}_k\,\delta_{kj}$, where $\delta_{kj}$ is $1$ for $k = j$ and $0$ otherwise.
2. The measurement noise is zero-mean Gaussian and white: $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R}_k)$ with $\mathbb{E}[\mathbf{v}_k\mathbf{v}_j^{\mathsf{T}}] = \mathbf{R}_k\,\delta_{kj}$.
3. The two are mutually uncorrelated: $\mathbb{E}[\mathbf{w}_k\mathbf{v}_j^{\mathsf{T}}] = \mathbf{0}$ for all $k, j$.
4. The initial state is Gaussian, $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0, \mathbf{P}_0)$, and uncorrelated with both noise sequences.

::: key The discrete stochastic model
$\mathbf{x}_{k+1} = \mathbf{F}\mathbf{x}_k + \mathbf{G}\mathbf{u}_k + \mathbf{w}_k$ and $\mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}_k$, with $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q})$ and $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$, both white and mutually uncorrelated. $\mathbf{Q}$ is the process noise covariance, $\mathbf{R}$ the measurement noise covariance.
:::

Each assumption buys something specific. Whiteness of $\mathbf{w}$ says the disturbance at step $k$ tells you nothing about the disturbance at step $k+1$, so all the memory of the system lives in $\mathbf{x}$: given $\mathbf{x}_k$, the future is independent of the past. That is the Markov property, and it is what lets a filter carry a single estimate and a single covariance forward instead of the whole measurement history. Whiteness of $\mathbf{v}$ says each measurement brings independent evidence, so evidence accumulates by addition. Mutual independence keeps the two sources separable, which is what allows $\mathbf{Q}$ and $\mathbf{R}$ to be tuned as two knobs rather than one. Gaussianity is what makes the filter optimal among *all* estimators; drop it and the filter is still the best *linear* estimator, the BLUE of the least-squares module, which is usually good enough.

The assumption that fails most often in practice is whiteness, and it fails in one characteristic way: a sensor error that persists from sample to sample. A gyro bias, a GNSS multipath return that lasts several seconds, an altimeter scale-factor error — none of these is white, and modelling any of them as $\mathbf{v}$ makes the filter believe it is receiving independent evidence when it is receiving the same error again and again. The rule that follows is the most important modelling rule in this module.

::: key Noise with memory is a state
If an error is correlated from one step to the next, it is not noise. Move it into $\mathbf{x}$, give it dynamics (a constant, a random walk, a Gauss-Markov process) and drive *that* with white noise. The model's noises must be white; whatever is not white must be a state.
:::

The known input $\mathbf{u}_k$ deserves a word. In the observer lesson the command cancelled from the error dynamics because the observer applied the same $\mathbf{u}$ to the same $\mathbf{B}$. In a navigation filter $\mathbf{u}$ is very often not a command but a sensor: the IMU's measured acceleration and angular rate drive the propagation. A sensor used as an input carries noise, and that noise becomes process noise, which is where much of $\mathbf{Q}$ in an inertial filter comes from. The attitude example at the end of the lesson does exactly this.

## Where the process noise comes from

Physics is written in continuous time. The continuous model is

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{G}_c\mathbf{w}_c(t), \qquad
\mathbb{E}[\mathbf{w}_c(t)\mathbf{w}_c(\tau)^{\mathsf{T}}] = \mathbf{Q}_c\,\delta(t - \tau),
$$

with $\mathbf{w}_c$ the white noise of the probability module: zero-mean, uncorrelated between any two distinct instants, and characterised by the power spectral density matrix $\mathbf{Q}_c$. The units of $\mathbf{Q}_c$ are those of $\mathbf{G}_c\mathbf{w}_c$ squared, *times seconds*: a white acceleration noise has $\mathbf{Q}_c$ in $\mathrm{(m/s^2)^2\,s} = \mathrm{m^2/s^3}$, equivalently $\mathrm{(m/s^2)^2/Hz}$. Confusing a spectral density with a variance is the commonest unit error in filter design, and the derivation below shows exactly how the two are related.

Solve the continuous equation across one step with the transition matrix of the state-space module, $\boldsymbol{\Phi}(\tau) = e^{\mathbf{A}\tau}$:

$$
\mathbf{x}_{k+1} = e^{\mathbf{A}\Delta t}\mathbf{x}_k + \int_0^{\Delta t} e^{\mathbf{A}(\Delta t - s)}\mathbf{B}\mathbf{u}\,ds
+ \int_0^{\Delta t} e^{\mathbf{A}(\Delta t - s)}\mathbf{G}_c\mathbf{w}_c(t_k + s)\,ds.
$$

The first term gives $\mathbf{F} = e^{\mathbf{A}\Delta t}$, the second is the zero-order-hold input matrix $\mathbf{G}$ applied to $\mathbf{u}_k$, and the third is the discrete process noise $\mathbf{w}_k$: the continuous noise over the step, each instant's kick propagated forward through the dynamics to the end of the step. It has zero mean because $\mathbf{w}_c$ does. For its covariance, multiply the integral by its own transpose and take the expectation:

$$
\mathbf{Q} = \mathbb{E}[\mathbf{w}_k\mathbf{w}_k^{\mathsf{T}}]
= \int_0^{\Delta t}\!\!\int_0^{\Delta t} e^{\mathbf{A}(\Delta t - s)}\mathbf{G}_c\,\mathbf{Q}_c\,\delta(s - s')\,\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}(\Delta t - s')}\,ds\,ds'
= \int_0^{\Delta t} e^{\mathbf{A}\tau}\mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}\tau}\,d\tau .
$$

The delta function collapses the double integral to a single one, and the substitution $\tau = \Delta t - s$ tidies it. Notice what else the derivation gives you for free: $\mathbf{w}_k$ and $\mathbf{w}_j$ for $k \neq j$ integrate the continuous noise over disjoint time intervals, and white noise is uncorrelated across disjoint intervals, so the discrete process noise is white. The whiteness assumption of the previous section is not an extra assumption at all; it is inherited from the continuous model.

::: key Discrete process noise from a continuous model
$\mathbf{Q} = \int_0^{\Delta t} e^{\mathbf{A}\tau}\mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}\tau}\,d\tau$, where $\mathbf{Q}_c$ is a power spectral density. For $\Delta t$ short compared with the dynamics, $\mathbf{Q} \approx \mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}\,\Delta t$: a spectral density becomes a variance by multiplying by the step.
:::

### The constant-velocity model, exactly

The model this module returns to most often tracks a position $p$ and a velocity $v$ along one axis, with the acceleration treated as white noise of spectral density $q$: the **white-noise acceleration** or constant-velocity model. In continuous time $\mathbf{x} = (p, v)^{\mathsf{T}}$, $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$, $\mathbf{G}_c = (0,\ 1)^{\mathsf{T}}$ and $\mathbf{Q}_c = q$. Because $\mathbf{A}^2 = \mathbf{0}$ the exponential series stops after two terms, $e^{\mathbf{A}\tau} = \mathbf{I} + \mathbf{A}\tau = \begin{pmatrix} 1 & \tau \\ 0 & 1 \end{pmatrix}$, so $e^{\mathbf{A}\tau}\mathbf{G}_c = (\tau,\ 1)^{\mathsf{T}}$ and the integrand is

$$
q\begin{pmatrix} \tau \\ 1 \end{pmatrix}\begin{pmatrix} \tau & 1 \end{pmatrix} = q\begin{pmatrix} \tau^2 & \tau \\ \tau & 1 \end{pmatrix}.
$$

Integrating each entry from $0$ to $\Delta t$:

::: key Exact process noise of the constant-velocity model
For $\mathbf{F} = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}$ and white acceleration noise of spectral density $q$ (units $\mathrm{m^2/s^3}$),
$\mathbf{Q} = q\begin{pmatrix} \Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t \end{pmatrix}$.
:::

Read the entries physically. The velocity picks up a variance $q\,\Delta t$ per step, a random walk in velocity exactly as the probability module described: standard deviation growing as $\sqrt{q t}$, so $\sqrt{q}$ is the **velocity random walk** coefficient, quoted for accelerometers in $\mathrm{m/s/\sqrt{s}}$ or $\mathrm{m/s/\sqrt{h}}$. The position picks up the integral of that, variance $q\,\Delta t^3/3$. And the two are correlated, with coefficient $(\Delta t^2/2)/\sqrt{(\Delta t^3/3)\,\Delta t} = \sqrt{3}/2 = 0.866$ whatever the step: a velocity kick that arrived early in the step has also moved the position. The determinant $q^2\Delta t^4/12$ is positive, so $\mathbf{Q}$ has full rank, but it is nearly singular — its two eigenvalues differ by a factor of $1200$.

The short-step approximation $\mathbf{Q} \approx \mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}\Delta t = \operatorname{diag}(0,\ q\,\Delta t)$ keeps the velocity entry and drops the rest. It is exactly singular, and it tells the filter that position receives no noise at all within a step. At a high propagation rate that is nearly true; at a low one it is not, and the exact form costs nothing.

::: example Discretising the constant-velocity model
Take $q = 0.5\,\mathrm{m^2/s^3}$ and $\Delta t = 0.1\,\mathrm{s}$. Then $\Delta t^3/3 = 3.333\times10^{-4}$, $\Delta t^2/2 = 5\times10^{-3}$ and $\Delta t = 0.1$, so

$$
\mathbf{Q} = \begin{pmatrix} 1.667\times10^{-4} & 2.5\times10^{-3} \\ 2.5\times10^{-3} & 5.0\times10^{-2} \end{pmatrix},
$$

with the entries in $\mathrm{m^2}$, $\mathrm{m^2/s}$ and $\mathrm{m^2/s^2}$ respectively. Per step the velocity is perturbed by $\sqrt{0.05} = 0.224\,\mathrm{m/s}$ and the position by $\sqrt{1.667\times10^{-4}} = 12.9\,\mathrm{mm}$; the eigenvalues are $4.16\times10^{-5}$ and $5.01\times10^{-2}$. Computing the same $\mathbf{Q}$ by Van Loan's matrix exponential (the code below) agrees to $4\times10^{-19}$, which is round-off.

Now let the filter coast for $T = 10\,\mathrm{s}$ with no measurement, starting from a perfectly known state. Propagating $\mathbf{P}_{k+1} = \mathbf{F}\mathbf{P}_k\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ for $100$ steps gives

$$
\mathbf{P} = \begin{pmatrix} 166.67 & 25.0 \\ 25.0 & 5.0 \end{pmatrix}, \qquad \sigma_p = 12.9\,\mathrm{m}, \quad \sigma_v = 2.24\,\mathrm{m/s},
$$

and this is *exactly* $q\begin{pmatrix} T^3/3 & T^2/2 \\ T^2/2 & T \end{pmatrix}$, because the exact discretisation composes: a hundred steps of $0.1\,\mathrm{s}$ are one step of $10\,\mathrm{s}$. Against a radar altimeter with $\sigma_r = 2\,\mathrm{m}$, the prediction is already worse than a single measurement after $29$ steps, $2.9\,\mathrm{s}$, when $\sigma_p = \sqrt{qT^3/3}$ first exceeds $2\,\mathrm{m}$. That crossover is the balance the filter will strike every cycle: the dynamics model is worth more than a measurement for about three seconds, and less after that.
:::

```python
import numpy as np
from scipy.linalg import expm

def van_loan(A, Gc, Qc, dt):
    """Exact (F, Q) for x' = A x + Gc w, w white with PSD Qc, over a step dt."""
    n = A.shape[0]
    M = np.block([[-A, Gc @ Qc @ Gc.T], [np.zeros((n, n)), A.T]]) * dt
    E = expm(M)
    F = E[n:, n:].T
    Q = F @ E[:n, n:]
    return F, Q

A = np.array([[0.0, 1.0], [0.0, 0.0]])
F, Q = van_loan(A, np.array([[0.0], [1.0]]), np.array([[0.5]]), 0.1)
print(Q)
# [[0.00016667 0.0025    ]
#  [0.0025     0.05      ]]
```

There is a second constant-velocity model in the literature, the **piecewise-constant acceleration** model: the acceleration is a fresh random constant $a_k \sim \mathcal{N}(0, \sigma_a^2)$ on each step, so $\mathbf{w}_k = a_k\,(\Delta t^2/2,\ \Delta t)^{\mathsf{T}}$ and $\mathbf{Q} = \sigma_a^2\begin{pmatrix} \Delta t^4/4 & \Delta t^3/2 \\ \Delta t^3/2 & \Delta t^2 \end{pmatrix}$, which has rank one. Matching the velocity increment, $\sigma_a^2 = q/\Delta t$, its position entry is $3/4$ of the exact one. Both are defensible; they are not the same model, and the exercises in this module use the continuous form.

::: warning Q depends on the step
Because $\mathbf{Q}$ integrates a spectral density over the step, its entries scale with $\Delta t$ — linearly for a velocity, as $\Delta t^3$ for a position. A $\mathbf{Q}$ tuned by hand at $10\,\mathrm{Hz}$ is wrong by a factor of ten in the velocity entry at $100\,\mathrm{Hz}$ and by a thousand in the position entry. Store $\mathbf{Q}_c$, the physical quantity, and recompute $\mathbf{Q}$ whenever the step changes.
:::

## Where the measurement noise comes from

$\mathbf{R}_k$ is the covariance of the error in one measurement at the rate the measurements arrive. It is a physical quantity and can be measured on a bench: record the sensor on a fixed input, and the probability module's tools — the power spectral density of the record, the Allan deviation, a maximum-likelihood fit with its confidence interval — return the white-noise level. That level, not the datasheet's headline accuracy, is $\mathbf{R}$. A datasheet accuracy figure typically bundles bias, scale factor and temperature sensitivity together with the noise; the bias belongs in the state by the rule above, and putting it in $\mathbf{R}$ tells the filter to expect independent errors when it will receive the same error every time.

Two contributions to $\mathbf{R}$ can be computed rather than measured. **Quantisation**: a sensor reporting in steps of $\Delta$ adds an error uniform on $[-\Delta/2, \Delta/2]$, variance $\Delta^2/12$. A radar altimeter with $0.5\,\mathrm{m}$ resolution contributes $0.0208\,\mathrm{m^2}$, or $\sigma = 0.144\,\mathrm{m}$; a $16$-bit converter spanning $\pm 20\,g$ has a step of $5.99\times10^{-3}\,\mathrm{m/s^2}$ and contributes $\sigma = 1.73\times10^{-3}\,\mathrm{m/s^2}$. **Averaging**: if a $100\,\mathrm{Hz}$ sensor is averaged down to $10\,\mathrm{Hz}$ before the filter sees it, the averaged measurement has $\mathbf{R}$ reduced by the factor $10$ — but only if the $100\,\mathrm{Hz}$ errors are white. Average ten samples of a $0.5\,\mathrm{m}$ altimeter whose error has a $1\,\mathrm{s}$ correlation time and the standard deviation falls from $0.500$ to $0.492\,\mathrm{m}$, not to $0.158$: the ten errors were nearly the same error.

Errors that are correlated in time — multipath, a star tracker's slowly varying low-spatial-frequency error, a temperature-driven drift — are not $\mathbf{R}$, and the last lesson of this module treats them properly, by augmentation or as consider parameters. Until then, everything the lessons call $\mathbf{R}$ is white.

## Sensors as inputs: an attitude and gyro-bias model

The second model the module reuses is the standard single-axis attitude filter. A gyro measures the body rate, $\omega_m = \omega + b + n_g$, where $b$ is a slowly wandering bias and $n_g$ is white rate noise; a star tracker measures the attitude angle $\theta$ directly, less often and with its own white noise. The filter integrates the gyro to propagate $\theta$ and uses the star tracker to correct it. The gyro is the *input*; its noise becomes process noise.

Write the state as $\mathbf{x} = (\theta,\ b)^{\mathsf{T}}$. Integrating $\dot{\theta} = \omega = \omega_m - b - n_g$ over a step of $\Delta t$,

$$
\theta_{k+1} = \theta_k + \Delta t\,(\omega_{m,k} - b_k) + w_{\theta,k}, \qquad
b_{k+1} = \phi\, b_k + w_{b,k},
$$

where the bias follows the probability module's first-order Gauss-Markov process with standard deviation $\sigma_b$ and correlation time $T_b$, so its exact discrete form is $\phi = e^{-\Delta t/T_b}$ and $\operatorname{Var}(w_b) = \sigma_b^2(1 - \phi^2)$. In the module's notation,

$$
\mathbf{F} = \begin{pmatrix} 1 & -\Delta t \\ 0 & \phi \end{pmatrix}, \quad
\mathbf{G} = \begin{pmatrix} \Delta t \\ 0 \end{pmatrix}, \quad u_k = \omega_{m,k}, \quad
\mathbf{Q} = \begin{pmatrix} \mathrm{ARW}^2\,\Delta t & 0 \\ 0 & \sigma_b^2(1-\phi^2) \end{pmatrix}, \quad
\mathbf{H} = \begin{pmatrix} 1 & 0 \end{pmatrix}, \quad R = \sigma_{st}^2 .
$$

The angle noise term is the integral of white rate noise over the step, so its variance is the rate noise spectral density times $\Delta t$, and the square root of that spectral density is the **angle random walk** of the probability module. The minus sign in $\mathbf{F}$ is the whole mechanism of bias estimation: a positive bias makes the integrated angle drift upward, the star tracker sees the drift, and the correlation the filter builds between $\theta$ and $b$ lets it attribute the drift to the bias.

::: example A gyro-bias model from datasheet numbers
A tactical-grade gyro quotes an angle random walk of $0.1\,^\circ/\sqrt{\mathrm{h}}$ and a bias that wanders with $\sigma_b = 1\,^\circ/\mathrm{h}$ and a correlation time of about an hour. The star tracker gives $10''$ per axis; the filter runs at $\Delta t = 0.1\,\mathrm{s}$.

Convert the ARW: $0.1\,^\circ/\sqrt{\mathrm{h}} = 0.1 \times (\pi/180)/\sqrt{3600}\,\mathrm{rad/\sqrt{s}} = 2.909\times10^{-5}\,\mathrm{rad/\sqrt{s}}$. Then $Q_{\theta} = \mathrm{ARW}^2\Delta t = 8.46\times10^{-11}\,\mathrm{rad^2}$ per step, a standard deviation of $9.2\,\mathrm{\mu rad} = 1.9''$ per step. The bias: $\sigma_b = 1\,^\circ/\mathrm{h} = 4.848\times10^{-6}\,\mathrm{rad/s}$, $\phi = e^{-0.1/3600} = 0.99997222$, and $Q_b = \sigma_b^2(1 - \phi^2) = 1.31\times10^{-15}\,\mathrm{(rad/s)^2}$, a kick of $3.6\times10^{-8}\,\mathrm{rad/s} = 0.0075\,^\circ/\mathrm{h}$ per step. The star tracker: $10'' = 4.848\times10^{-5}\,\mathrm{rad}$, so $R = 2.35\times10^{-9}\,\mathrm{rad^2}$.

The diagonal $\mathbf{Q}$ above neglects the bias noise that leaks into the angle within a step. Van Loan's method on the coupled continuous model gives the exact answer: $Q_\theta$ differs from $\mathrm{ARW}^2\Delta t$ by a relative $5\times10^{-8}$, and the cross-correlation coefficient is $-2\times10^{-4}$. At this step size the diagonal approximation is accurate to more digits than any datasheet supports.

Now the question the filter exists to answer. Propagate the covariance for one hour on the gyro alone from a perfectly known attitude. The ARW alone would give $\sigma_\theta = \mathrm{ARW}\sqrt{3600\,\mathrm{s}} = 0.100^\circ$; the bias alone integrates to $0.580^\circ$; together the propagated covariance reports $\sigma_\theta = 0.588^\circ$, and the bias uncertainty has grown to $0.930\,^\circ/\mathrm{h}$, most of the way to its stationary $1\,^\circ/\mathrm{h}$ after that one correlation time. Against a $10''$ star tracker, $0.588^\circ = 2120''$, the gyro-only prediction is about $210$ times worse than a single measurement. The update will therefore almost entirely replace the predicted angle with the measured one — and, through the correlation between $\theta$ and $b$ that the hour of drift created, learn the bias. How a filter turns that correlation into a bias estimate is the subject of the next three lessons.
:::

::: note Which matrices carry the physics
Between them, $\mathbf{F}$, $\mathbf{G}$ and $\mathbf{H}$ hold the deterministic physics and are usually known well. $\mathbf{R}$ is a sensor property and can be measured. $\mathbf{Q}$ is partly physics — the ARW and the bias model above are traceable to bench data — and partly a confession about what the model omits, which is why a later lesson is devoted to it alone. $\mathbf{P}_0$ is what you know at switch-on, and the module's convergence lesson shows how quickly a well-posed filter forgets it.
:::

## Check yourself

::: check
State the four assumptions of the discrete stochastic model, and explain in one sentence each what the whiteness of $\mathbf{w}$ and the whiteness of $\mathbf{v}$ buy the filter.
:::

::: answer
The process noise $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q}_k)$ and measurement noise $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R}_k)$ are each zero-mean, Gaussian and white; they are mutually uncorrelated; and the initial state $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0, \mathbf{P}_0)$ is uncorrelated with both. White $\mathbf{w}$ makes the state Markov — given $\mathbf{x}_k$ the future does not depend on the past — so the filter can carry one estimate and one covariance instead of the whole history. White $\mathbf{v}$ makes each measurement independent evidence, so evidence accumulates additively and each update can treat the new measurement as new information.
:::

::: check
For the constant-velocity model with $q = 0.5\,\mathrm{m^2/s^3}$, compute $\mathbf{Q}$ for $\Delta t = 1\,\mathrm{s}$ and compare it with ten steps of $\Delta t = 0.1\,\mathrm{s}$ from a perfectly known state.
:::

::: answer
$\mathbf{Q} = 0.5\begin{pmatrix} 1/3 & 1/2 \\ 1/2 & 1 \end{pmatrix} = \begin{pmatrix} 0.1667 & 0.25 \\ 0.25 & 0.5 \end{pmatrix}$, so $\sigma_p = 0.408\,\mathrm{m}$ and $\sigma_v = 0.707\,\mathrm{m/s}$ after one second. Propagating $\mathbf{P}_{k+1} = \mathbf{F}\mathbf{P}_k\mathbf{F}^{\mathsf{T}} + \mathbf{Q}_{0.1}$ ten times from $\mathbf{P}_0 = \mathbf{0}$ gives the identical matrix, because the exact discretisation is the integral of the same spectral density over the same second, split into ten pieces and propagated to the end. The position entry is *not* ten times the $0.1\,\mathrm{s}$ entry ($1.667\times10^{-4}$); it is a thousand times, because the velocity kicks early in the second had time to move the position.
:::

::: check
An accelerometer's noise density is $150\,\mathrm{\mu g/\sqrt{Hz}}$. What is $q$ for a filter that treats this noise as white acceleration, and what velocity perturbation does one $10\,\mathrm{ms}$ step receive?
:::

::: answer
Convert to SI: $150\times10^{-6} \times 9.80665 = 1.471\times10^{-3}\,\mathrm{m/s^2/\sqrt{Hz}}$. The spectral density is the square, $q = 2.16\times10^{-6}\,\mathrm{m^2/s^3}$. Per step the velocity variance is $q\,\Delta t = 2.16\times10^{-8}\,\mathrm{m^2/s^2}$, a perturbation of $\sqrt{q\,\Delta t} = 1.47\times10^{-4}\,\mathrm{m/s}$. Note the two different roles of the same number: $\sqrt{q} = 1.47\times10^{-3}$ is a density in $\mathrm{m/s^2/\sqrt{Hz}}$, equivalently a velocity random walk in $\mathrm{m/s/\sqrt{s}}$, while $\sqrt{q\Delta t}$ is a standard deviation in $\mathrm{m/s}$.
:::

::: check
Why does the short-step approximation $\mathbf{Q} \approx \operatorname{diag}(0, q\,\Delta t)$ produce a singular matrix, and why might that matter to a filter?
:::

::: answer
It keeps only the direct noise input — the velocity — and drops the position entry, which is of higher order in $\Delta t$, together with the cross term. The result has rank one: it claims that one direction of the state, position, receives no process noise at all within a step. A filter carrying that claim can drive the position variance toward zero when position measurements are dense, so the position estimate stops responding to the very disturbances the model was supposed to admit, and a singular $\mathbf{Q}$ also removes the margin that keeps $\mathbf{P}$ safely positive definite in finite arithmetic. The exact form costs three multiplications more and has neither problem.
:::

::: check
A magnetometer's datasheet lists "accuracy $0.5^\circ$". A bench record of the sensor at rest shows a white-noise standard deviation of $0.05^\circ$ and a slow wander of a few tenths of a degree over an hour. What goes in $\mathbf{R}$, and where does the rest go?
:::

::: answer
$\mathbf{R}$ gets the white part only: $R = (0.05^\circ)^2$ at the measurement rate. The slow wander is correlated from sample to sample, so it is not measurement noise in the model's sense; by the rule that noise with memory is a state, it becomes a bias state with Gauss-Markov dynamics driven by white noise, and the filter estimates it. Using the $0.5^\circ$ figure as $R$ would tell the filter to expect independent $0.5^\circ$ errors, when it will receive nearly the same error for minutes at a time: the filter would average errors that do not average, and report a covariance far smaller than its true error.
:::

## Summary

| Item | Statement |
| --- | --- |
| Discrete model | $\mathbf{x}_{k+1} = \mathbf{F}_k\mathbf{x}_k + \mathbf{G}_k\mathbf{u}_k + \mathbf{w}_k$, $\mathbf{z}_k = \mathbf{H}_k\mathbf{x}_k + \mathbf{v}_k$ |
| Noise assumptions | $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0},\mathbf{Q}_k)$, $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0},\mathbf{R}_k)$, white ($\mathbb{E}[\mathbf{w}_k\mathbf{w}_j^{\mathsf{T}}] = \mathbf{Q}_k\delta_{kj}$), mutually uncorrelated, uncorrelated with $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0,\mathbf{P}_0)$ |
| Modelling rule | Noise with memory is a state: correlated errors are augmented into $\mathbf{x}$, driven by white noise |
| Continuous to discrete | $\mathbf{F} = e^{\mathbf{A}\Delta t}$, $\mathbf{Q} = \int_0^{\Delta t} e^{\mathbf{A}\tau}\mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}\tau}\,d\tau$; short step $\mathbf{Q} \approx \mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}\Delta t$; Van Loan computes both from one exponential |
| Constant-velocity model | $\mathbf{F} = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}$, $\mathbf{Q} = q\begin{pmatrix} \Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t \end{pmatrix}$, $q$ in $\mathrm{m^2/s^3}$, correlation $\sqrt{3}/2$ |
| Piecewise-constant acceleration | $\mathbf{Q} = \sigma_a^2\begin{pmatrix} \Delta t^4/4 & \Delta t^3/2 \\ \Delta t^3/2 & \Delta t^2 \end{pmatrix}$, rank one; a different model |
| Units | $\mathbf{Q}_c$ is a spectral density (unit$^2$/Hz); $\mathbf{Q}$ and $\mathbf{R}$ are variances at the step and measurement rate |
| Measurement noise | $\mathbf{R}$ from bench data (PSD, Allan deviation, MLE); quantisation adds $\Delta^2/12$; averaging $N$ white samples divides $\mathbf{R}$ by $N$ |
| Attitude and bias model | $\mathbf{x} = (\theta, b)$, $\mathbf{F} = \begin{pmatrix} 1 & -\Delta t \\ 0 & \phi \end{pmatrix}$, $u = \omega_m$, $\mathbf{Q} = \operatorname{diag}(\mathrm{ARW}^2\Delta t,\ \sigma_b^2(1-\phi^2))$, $\mathbf{H} = (1\ \ 0)$ |

With the model written down, the question becomes how to combine a prediction of $\mathbf{x}$ carrying covariance $\mathbf{P}$ with a measurement carrying covariance $\mathbf{R}$. The next lesson answers it three times over — by minimum variance, by Bayes' theorem on Gaussians, and by recursive least squares — and shows that all three roads arrive at the same gain.
