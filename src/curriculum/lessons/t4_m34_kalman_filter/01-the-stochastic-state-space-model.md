---
id: l01-the-stochastic-state-space-model
title: The stochastic state-space model, process noise Q and measurement noise R
minutes: 22
covers:
  - "The stochastic state-space model: process noise Q and measurement noise R"
---

Walk across a dark room with your eyes closed, counting steps. After five steps you have a good guess of where you are. After fifty, the guess is poor: every step was a little longer or shorter than you thought, and the small errors piled up. Now a friend calls out "you're near the door!" every few seconds. Her call is not perfect either, but it stops your guess drifting away. Mix the two and you beat either one alone.

That mix is what this whole module is about. The mixing machine is the **Kalman filter**, a recipe that blends a prediction with a measurement in the best possible proportion. It can only weigh two kinds of ignorance against each other once both are written down as numbers. This lesson writes them down.

A booster falling back through the atmosphere is in your shoes. Winds push it, and the flight computer knows its thrust only roughly: those are the uneven steps. Its radar altimeter's reading jitters from one return to the next: the friend's imperfect call. Its motion sensors carry a small offset that no calibration removed. The filter handles all of this with [[three matrices|which-matrices]]: $\mathbf{Q}$ for what the model of the motion leaves out, $\mathbf{R}$ for what the sensor gets wrong, and $\mathbf{P}_0$ for what you do not know at the start. Every later lesson works with these three, and none can tell you whether they are right. Getting them right happens here.

In the state-space module you met $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$ and an [[observer|observer-bridge]] whose gain $\mathbf{L}$ you picked by hand. That lesson ended by admitting the principled way to choose the gain is from the noise itself. This lesson builds the model of the noise that makes that possible.

## The discrete stochastic model

Take the step-by-step model you already know and add one noise term to each equation:

$$
\mathbf{x}_{k+1} = \mathbf{F}_k\mathbf{x}_k + \mathbf{G}_k\mathbf{u}_k + \mathbf{w}_k, \qquad
\mathbf{z}_k = \mathbf{H}_k\mathbf{x}_k + \mathbf{v}_k.
$$

Read $\mathbf{x}_k$ as "x sub k": the **state** at time $t_k$, a list of $n$ numbers such as position and velocity. The other symbols:

- $\mathbf{F}_k$ is the **state transition matrix**. It is the old $\mathbf{A}_d$ under the name estimation books use (some write $\boldsymbol{\Phi}$, "phi"). It says where the state goes in one step if nothing disturbs it.
- $\mathbf{G}_k$ is the input matrix, formerly $\mathbf{B}_d$, and $\mathbf{u}_k$ is a known input, such as a commanded thrust.
- $\mathbf{w}_k$ is the **process noise**: everything that moved the state and is not in $\mathbf{F}\mathbf{x} + \mathbf{G}\mathbf{u}$. The uneven steps.
- $\mathbf{z}_k$ is the **measurement**, a list of $m$ numbers the sensors report.
- $\mathbf{H}_k$ is the **measurement matrix**, formerly $\mathbf{C}$. It says which combination of the state each sensor sees.
- $\mathbf{v}_k$ is the **measurement noise**: the sensor's error on that reading.

The subscript $k$ lets a matrix change with time; when it does not, we drop it.

Four statistical assumptions complete the model. Two symbols first. $\mathcal{N}(\mathbf{0}, \mathbf{Q})$, read "normal with mean zero and covariance Q", is a bell-curve (Gaussian) spread of values centered on zero. Its **[[covariance|covariance-matrix]]** $\mathbf{Q}$ is a square matrix: the diagonal holds each variable's variance (its spread, squared), and the off-diagonal entries say how two variables tend to move together. $\mathbb{E}[\cdot]$, read "the expected value of", is the long-run average.

1. The process noise is zero-mean, Gaussian and **[[white|white-noise]]**: $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q}_k)$ with $\mathbb{E}[\mathbf{w}_k\mathbf{w}_j^{\mathsf{T}}] = \mathbf{Q}_k\,\delta_{kj}$. Here $\delta_{kj}$ ("delta k j") is $1$ when $k = j$ and $0$ otherwise. So white means: the noise at one step is unrelated to the noise at any other step.
2. The measurement noise is zero-mean, Gaussian and white: $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R}_k)$ with $\mathbb{E}[\mathbf{v}_k\mathbf{v}_j^{\mathsf{T}}] = \mathbf{R}_k\,\delta_{kj}$.
3. The two are **mutually uncorrelated**: $\mathbb{E}[\mathbf{w}_k\mathbf{v}_j^{\mathsf{T}}] = \mathbf{0}$ for all $k$ and $j$.
4. The starting state is Gaussian, $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0, \mathbf{P}_0)$, and unrelated to both noises. The hat in $\hat{\mathbf{x}}_0$, read "x hat zero", marks an estimate: your best guess.

::: key The discrete stochastic model
$\mathbf{x}_{k+1} = \mathbf{F}\mathbf{x}_k + \mathbf{G}\mathbf{u}_k + \mathbf{w}_k$ and $\mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}_k$, with $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q})$ and $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$, both white and mutually uncorrelated. $\mathbf{Q}$ is the process noise covariance, $\mathbf{R}$ the measurement noise covariance.
:::

### What each assumption buys

**White process noise** means the push at step $k$ tells you nothing about the push at step $k+1$. So all the memory of the system lives in $\mathbf{x}$. Given $\mathbf{x}_k$, the future does not depend on how you got there. That is the **[[Markov property|markov]]**, and it is why a filter can carry one estimate and one covariance forward instead of the whole history of measurements.

**White measurement noise** means each reading brings fresh, independent evidence. Evidence piles up by addition.

**Uncorrelated noises** keep the two sources separate, so $\mathbf{Q}$ and $\mathbf{R}$ are two knobs you tune apart.

**Gaussian noise** makes the filter the best of *all* possible estimators. Drop it and the filter is still the best *linear* estimator (the BLUE, best linear unbiased estimator, of the least-squares module). That is usually enough.

The assumption that fails most often in real life is whiteness, and it fails in one typical way: a sensor error that stays put from one sample to the next. A gyro's offset, a GPS signal bouncing off a building for seconds, an altimeter reading $1\%$ high: none is white. Treat any of them as $\mathbf{v}$ and the filter thinks it is hearing fresh evidence when it is hearing the same error again and again. That gives the most important modeling rule in the module.

::: key Noise with memory is a state
If an error is correlated from one step to the next, it is not noise. Move it into $\mathbf{x}$, give it dynamics (a constant, a random walk, a Gauss-Markov process) and drive *that* with white noise. The model's noises must be white; whatever is not white must be a state.
:::

One word on the input $\mathbf{u}_k$. In a navigation filter, $\mathbf{u}$ is often not a command but a *sensor*: the measured acceleration and spin rate from the inertial measurement unit (IMU) drive the prediction. A sensor used as an input carries noise, and that noise becomes process noise: much of $\mathbf{Q}$ in an inertial filter comes from there.

## Where the process noise comes from

Physics is written in continuous time:

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{G}_c\mathbf{w}_c(t), \qquad
\mathbb{E}[\mathbf{w}_c(t)\mathbf{w}_c(\tau)^{\mathsf{T}}] = \mathbf{Q}_c\,\delta(t - \tau).
$$

Here $\dot{\mathbf{x}}$ ("x dot") is the rate of change of the state, and $\mathbf{w}_c$ is continuous white noise: zero on average, and unrelated between any two different instants. The spike $\delta(t - \tau)$ is the **[[Dirac delta|dirac-delta]]**. The matrix $\mathbf{Q}_c$ ("Q sub c") is the noise's **power spectral density**: how much noise power arrives per unit of frequency.

Watch the units. The units of $\mathbf{Q}_c$ are the units of $\mathbf{G}_c\mathbf{w}_c$ squared, *times seconds*. For a white acceleration noise, that is $\mathrm{(m/s^2)^2\,s} = \mathrm{m^2/s^3}$, the same as $\mathrm{(m/s^2)^2/Hz}$. A spectral density is not a variance. Mixing them up is the commonest unit error in filter design; the next lines show how one turns into the other.

Solve the continuous equation across one step of length $\Delta t$ ("delta t"), using the transition matrix $e^{\mathbf{A}\tau}$ ("e to the A tau") from the state-space module:

$$
\mathbf{x}_{k+1} = e^{\mathbf{A}\Delta t}\mathbf{x}_k + \int_0^{\Delta t} e^{\mathbf{A}(\Delta t - s)}\mathbf{B}\mathbf{u}\,ds
+ \int_0^{\Delta t} e^{\mathbf{A}(\Delta t - s)}\mathbf{G}_c\mathbf{w}_c(t_k + s)\,ds.
$$

The first piece gives $\mathbf{F} = e^{\mathbf{A}\Delta t}$. The second is the zero-order-hold input matrix $\mathbf{G}$ times $\mathbf{u}_k$. The third is the discrete process noise $\mathbf{w}_k$. It adds up every tiny kick during the step, each carried forward to the end of the step, and has zero mean because every kick does.

::: note Why it has to be true: the covariance of the kicks
Multiply the third integral by its own transpose and take the expected value. Two time variables appear, $s$ and $s'$, and the white-noise rule replaces $\mathbb{E}[\mathbf{w}_c\mathbf{w}_c^{\mathsf{T}}]$ with $\mathbf{Q}_c\,\delta(s - s')$:

$$
\mathbf{Q} = \mathbb{E}[\mathbf{w}_k\mathbf{w}_k^{\mathsf{T}}]
= \int_0^{\Delta t}\!\!\int_0^{\Delta t} e^{\mathbf{A}(\Delta t - s)}\mathbf{G}_c\,\mathbf{Q}_c\,\delta(s - s')\,\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}(\Delta t - s')}\,ds\,ds'
= \int_0^{\Delta t} e^{\mathbf{A}\tau}\mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}\tau}\,d\tau .
$$

The delta collapses the double integral to a single one: it keeps only the moments where $s' = s$. Renaming $\tau = \Delta t - s$ tidies it up.

A bonus falls out. $\mathbf{w}_k$ and $\mathbf{w}_j$ for $k \neq j$ add up kicks from two time windows that do not overlap, and white noise is unrelated across such windows. So the discrete process noise is automatically white. The whiteness assumption of the last section is not an extra guess: it is inherited from the continuous model.
:::

::: key Discrete process noise from a continuous model
$\mathbf{Q} = \int_0^{\Delta t} e^{\mathbf{A}\tau}\mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}\tau}\,d\tau$, where $\mathbf{Q}_c$ is a power spectral density. For $\Delta t$ short compared with the dynamics, $\mathbf{Q} \approx \mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}\,\Delta t$: a spectral density becomes a variance by multiplying by the step.
:::

### The constant-velocity model, exactly

The model this module uses most tracks a position $p$ and a velocity $v$ along one line. Think of a car on cruise control on a gusty day: the speed should stay fixed, but random gusts nudge it. We treat the acceleration as white noise with spectral density $q$. This is the **white-noise acceleration** model, also called the **constant-velocity model**.

In symbols, $\mathbf{x} = (p, v)^{\mathsf{T}}$, $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$, $\mathbf{G}_c = (0,\ 1)^{\mathsf{T}}$ (the noise enters the velocity) and $\mathbf{Q}_c = q$. Work the integral step by step.

1. Multiply $\mathbf{A}$ by itself: $\mathbf{A}^2 = \mathbf{0}$. So the series $e^{\mathbf{A}\tau} = \mathbf{I} + \mathbf{A}\tau + \tfrac12\mathbf{A}^2\tau^2 + \cdots$ stops after two terms: $e^{\mathbf{A}\tau} = \begin{pmatrix} 1 & \tau \\ 0 & 1 \end{pmatrix}$.
2. Multiply by $\mathbf{G}_c$: $e^{\mathbf{A}\tau}\mathbf{G}_c = (\tau,\ 1)^{\mathsf{T}}$.
3. The integrand is that column times $q$ times its transpose:

$$
q\begin{pmatrix} \tau \\ 1 \end{pmatrix}\begin{pmatrix} \tau & 1 \end{pmatrix} = q\begin{pmatrix} \tau^2 & \tau \\ \tau & 1 \end{pmatrix}.
$$

4. Integrate each entry from $0$ to $\Delta t$: $\tau^2$ gives $\Delta t^3/3$, $\tau$ gives $\Delta t^2/2$, and $1$ gives $\Delta t$.

::: key Exact process noise of the constant-velocity model
For $\mathbf{F} = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}$ and white acceleration noise of spectral density $q$ (units $\mathrm{m^2/s^3}$),
$\mathbf{Q} = q\begin{pmatrix} \Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t \end{pmatrix}$.
:::

- **Velocity:** it gains variance $q\,\Delta t$ per step. That is a random walk in velocity: its spread grows like $\sqrt{q t}$. So $\sqrt{q}$ is the **velocity random walk** of an accelerometer, quoted in $\mathrm{m/s/\sqrt{s}}$ or $\mathrm{m/s/\sqrt{h}}$.
- **Position:** it collects the integral of those velocity kicks, variance $q\,\Delta t^3/3$.
- **Cross term:** the two are [[correlated|cv-correlation]], with coefficient $(\Delta t^2/2)/\sqrt{(\Delta t^3/3)\,\Delta t} = \sqrt{3}/2 \approx 0.866$ at any step size. A velocity kick early in the step has also had time to move the position.

The determinant is $q^2\Delta t^4/12$, which is positive, so $\mathbf{Q}$ has full rank. It is nearly singular, though: at $\Delta t = 0.1\,\mathrm{s}$ its two eigenvalues differ by a factor of about $1200$, and the factor grows as the step shrinks.

The short-step shortcut $\mathbf{Q} \approx \mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}\Delta t = \operatorname{diag}(0,\ q\,\Delta t)$ keeps the velocity entry and drops the rest. It is exactly singular. It tells the filter that position gets no noise at all within a step. Nearly true at a fast rate, false at a slow one; the exact form costs nothing extra.

::: example Discretizing the constant-velocity model
Take $q = 0.5\,\mathrm{m^2/s^3}$ and $\Delta t = 0.1\,\mathrm{s}$.

**The three pieces.** $\Delta t^3/3 = 0.001/3 = 3.333\times10^{-4}$, $\Delta t^2/2 = 0.01/2 = 5\times10^{-3}$, and $\Delta t = 0.1$. Multiply each by $q = 0.5$:

$$
\mathbf{Q} = \begin{pmatrix} 1.667\times10^{-4} & 2.5\times10^{-3} \\ 2.5\times10^{-3} & 5.0\times10^{-2} \end{pmatrix},
$$

with the entries in $\mathrm{m^2}$, $\mathrm{m^2/s}$ and $\mathrm{m^2/s^2}$.

**What it means per step.** Take square roots of the diagonal. The velocity gets nudged by about $\sqrt{0.05} = 0.224\,\mathrm{m/s}$ and the position by $\sqrt{1.667\times10^{-4}} = 0.0129\,\mathrm{m} = 12.9\,\mathrm{mm}$. The eigenvalues are $4.16\times10^{-5}$ and $5.01\times10^{-2}$. Computing the same $\mathbf{Q}$ by [[Van Loan's method|van-loan]] (the code below) agrees to $4\times10^{-19}$, which is round-off.

**Coasting.** Let the filter coast for $T = 10\,\mathrm{s}$ with no measurement, starting from a perfectly known state ($\mathbf{P} = \mathbf{0}$). Repeat $\mathbf{P}_{k+1} = \mathbf{F}\mathbf{P}_k\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ for $100$ steps:

$$
\mathbf{P} = \begin{pmatrix} 166.67 & 25.0 \\ 25.0 & 5.0 \end{pmatrix}, \qquad \sigma_p = 12.9\,\mathrm{m}, \quad \sigma_v = 2.24\,\mathrm{m/s}.
$$

That is *exactly* $q\begin{pmatrix} T^3/3 & T^2/2 \\ T^2/2 & T \end{pmatrix}$, because the exact discretization stacks up: a hundred steps of $0.1\,\mathrm{s}$ equal one step of $10\,\mathrm{s}$.

**The crossover.** A radar altimeter with $\sigma_r = 2\,\mathrm{m}$ beats the prediction once $\sigma_p = \sqrt{qT^3/3}$ passes $2\,\mathrm{m}$. Solve $0.5\,T^3/3 = 4$: $T^3 = 24$, so $T \approx 2.88\,\mathrm{s}$, which is step $29$. So the motion model is worth more than one altimeter reading for about three seconds, and less after that: the balance the filter strikes every cycle.

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

### A second model with the same name

Books also use a **piecewise-constant acceleration** model. Here the acceleration is a fresh random constant $a_k \sim \mathcal{N}(0, \sigma_a^2)$ held for each whole step. Over one step, a constant $a_k$ moves the position by $a_k\Delta t^2/2$ and the velocity by $a_k\Delta t$. So $\mathbf{w}_k = a_k\,(\Delta t^2/2,\ \Delta t)^{\mathsf{T}}$ and

$$
\mathbf{Q} = \sigma_a^2\begin{pmatrix} \Delta t^4/4 & \Delta t^3/2 \\ \Delta t^3/2 & \Delta t^2 \end{pmatrix},
$$

which has rank one. Choose $\sigma_a^2 = q/\Delta t$ so the velocity entries match. Then its position entry is $q\Delta t^3/4$, which is $3/4$ of the exact one. Both are defensible, but they are different models; this module's exercises use the continuous one.

::: warning Q depends on the step
Because $\mathbf{Q}$ adds up a spectral density over the step, its entries scale with $\Delta t$: linearly for the velocity entry, as $\Delta t^3$ for the position entry. A $\mathbf{Q}$ tuned by hand at $10\,\mathrm{Hz}$ is wrong by a factor of ten in the velocity entry at $100\,\mathrm{Hz}$, and by a factor of a thousand in the position entry. Store $\mathbf{Q}_c$, the physical quantity, and recompute $\mathbf{Q}$ whenever the step changes.
:::

## Where the measurement noise comes from

$\mathbf{R}_k$ is the covariance of the error in *one* measurement, at the rate measurements arrive. It is a property of the sensor you can measure on a bench. Clamp the sensor still, record for a long time, and use the tools of the probability module: the power spectral density of the record, the **[[Allan deviation|allan]]**, or a maximum-likelihood fit. They return the white-noise level. That level, not the datasheet's headline "accuracy", is $\mathbf{R}$.

The datasheet number usually lumps bias, scale factor and temperature drift in with the noise. The bias belongs in the state, by the rule above; put it in $\mathbf{R}$ and the filter expects independent errors when it will get the same error every time.

Two parts of $\mathbf{R}$ can be computed instead of measured.

**Rounding (quantization).** A sensor that reports in steps of size $\Delta$ adds an error spread evenly between $-\Delta/2$ and $+\Delta/2$. That has variance $\Delta^2/12$. A radar altimeter with $0.5\,\mathrm{m}$ resolution adds $0.25/12 = 0.0208\,\mathrm{m^2}$, or $\sigma = 0.144\,\mathrm{m}$. A $16$-bit converter spanning $\pm 20\,g$ has $2^{16} = 65\,536$ steps across $40 \times 9.80665 = 392.3\,\mathrm{m/s^2}$, a step of $5.99\times10^{-3}\,\mathrm{m/s^2}$, and adds $\sigma = 1.73\times10^{-3}\,\mathrm{m/s^2}$.

**Averaging.** If a $100\,\mathrm{Hz}$ sensor is averaged in groups of ten to feed a $10\,\mathrm{Hz}$ filter, the averaged reading has $\mathbf{R}$ divided by $10$, but only if the $100\,\mathrm{Hz}$ errors are white. Suppose instead the altimeter's $0.5\,\mathrm{m}$ error has a correlation time of $1\,\mathrm{s}$. Then ten samples $10\,\mathrm{ms}$ apart are nearly the same error. The standard deviation falls from $0.500$ to only $0.492\,\mathrm{m}$, not to $0.500/\sqrt{10} = 0.158\,\mathrm{m}$. Averaging an error with itself cannot shrink it.

Errors with memory, like GPS multipath, a star tracker's slowly varying error, or a drift driven by temperature, are not $\mathbf{R}$. The module's last lesson handles them; until then, every $\mathbf{R}$ is white.

## Sensors as inputs: an attitude and gyro-bias model

The second model this module reuses is the standard single-axis attitude filter. **Attitude** is which way the vehicle points. A **gyro** measures how fast it is turning, but with an offset, the **bias** $b$, that wanders slowly, plus white noise $n_g$:

$$
\omega_m = \omega + b + n_g .
$$

(Read $\omega$ as "omega", the true turn rate; $\omega_m$ is the measured one.) A **[[star tracker|star-tracker]]** measures the angle $\theta$ ("theta") directly, less often, with its own white noise. The filter adds up the gyro readings to predict $\theta$ (the gyro is the input, so its noise is process noise) and uses the star tracker to correct it.

Take the state $\mathbf{x} = (\theta,\ b)^{\mathsf{T}}$. The true rate is $\omega = \omega_m - b - n_g$. Add it up over one step:

$$
\theta_{k+1} = \theta_k + \Delta t\,(\omega_{m,k} - b_k) + w_{\theta,k}, \qquad
b_{k+1} = \phi\, b_k + w_{b,k}.
$$

The bias follows the probability module's first-order **Gauss-Markov process**: a value that wanders but is pulled gently back toward zero. It has standard deviation $\sigma_b$ and correlation time $T_b$. Its exact step form has $\phi = e^{-\Delta t/T_b}$ ("phi") and $\operatorname{Var}(w_b) = \sigma_b^2(1 - \phi^2)$. In the module's notation:

$$
\mathbf{F} = \begin{pmatrix} 1 & -\Delta t \\ 0 & \phi \end{pmatrix}, \quad
\mathbf{G} = \begin{pmatrix} \Delta t \\ 0 \end{pmatrix}, \quad u_k = \omega_{m,k}, \quad
\mathbf{Q} = \begin{pmatrix} \mathrm{ARW}^2\,\Delta t & 0 \\ 0 & \sigma_b^2(1-\phi^2) \end{pmatrix}, \quad
\mathbf{H} = \begin{pmatrix} 1 & 0 \end{pmatrix}, \quad R = \sigma_{st}^2 .
$$

The angle's noise is white rate noise added up over the step. Its variance is the rate noise's spectral density times $\Delta t$. The square root of that spectral density is the gyro's **angle random walk**, ARW.

The minus sign in $\mathbf{F}$ is the whole trick of bias estimation. A positive bias makes the added-up angle drift upward. The star tracker sees the drift. The filter has built a link (a correlation) between $\theta$ and $b$, and that link lets it blame the drift on the bias.

::: example A gyro-bias model from datasheet numbers
A tactical-grade gyro lists an angle random walk of $0.1\,^\circ/\sqrt{\mathrm{h}}$ and a bias that wanders with $\sigma_b = 1\,^\circ/\mathrm{h}$ and a correlation time of about an hour. The star tracker gives $10''$ (ten arcseconds) per axis. The filter runs at $\Delta t = 0.1\,\mathrm{s}$.

**Angle noise.** Convert the ARW to SI. Degrees to radians is $\times\,\pi/180$; $\sqrt{\mathrm{h}} = \sqrt{3600\,\mathrm{s}} = 60\,\sqrt{\mathrm{s}}$. So $0.1 \times (\pi/180)/60 = 2.909\times10^{-5}\,\mathrm{rad/\sqrt{s}}$. Then $Q_{\theta} = \mathrm{ARW}^2\Delta t = 8.46\times10^{-11}\,\mathrm{rad^2}$ per step, a standard deviation of $9.2\,\mathrm{\mu rad}$, about $1.9''$ per step.

**Bias noise.** $\sigma_b = 1\,^\circ/\mathrm{h} = (\pi/180)/3600 = 4.848\times10^{-6}\,\mathrm{rad/s}$. Next $\phi = e^{-0.1/3600} = 0.99997222$. So $Q_b = \sigma_b^2(1 - \phi^2) = 1.31\times10^{-15}\,\mathrm{(rad/s)^2}$, a kick of $3.6\times10^{-8}\,\mathrm{rad/s}$, or $0.0075\,^\circ/\mathrm{h}$, per step.

**Star tracker.** $10'' = 10/206\,265 = 4.848\times10^{-5}\,\mathrm{rad}$, so $R = 2.35\times10^{-9}\,\mathrm{rad^2}$.

**Is the diagonal $\mathbf{Q}$ good enough?** It ignores the bias noise that leaks into the angle within one step. Van Loan's method on the coupled continuous model gives the exact answer: $Q_\theta$ changes by a relative $5\times10^{-8}$, and the correlation coefficient is $-2\times10^{-4}$. At this step size, the diagonal version is accurate to more digits than any datasheet supports.

**Coasting for an hour.** Propagate the covariance for one hour on the gyro alone, from a perfectly known attitude. The ARW alone would give $\sigma_\theta = \mathrm{ARW}\sqrt{3600\,\mathrm{s}} = 0.100^\circ$. The bias alone adds up to $0.580^\circ$. Together, the covariance reports $\sigma_\theta = 0.588^\circ$. (Independent errors add as squares: $\sqrt{0.100^2 + 0.580^2} = 0.589$, close.) The bias uncertainty has grown to $0.930\,^\circ/\mathrm{h}$, most of the way to its steady $1\,^\circ/\mathrm{h}$ after one correlation time.

**Sanity check.** $0.588^\circ = 2120''$, so the gyro-only prediction is about $210$ times worse than one $10''$ star-tracker fix. So the update will nearly replace the predicted angle with the measured one, and learn the bias through the $\theta$–$b$ correlation the hour of drift built. The next three lessons show how.
:::

## Check yourself

::: check
State the four assumptions of the discrete stochastic model. Then say in one sentence each what the whiteness of $\mathbf{w}$ and the whiteness of $\mathbf{v}$ buy the filter.
:::

::: answer
The process noise $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q}_k)$ and the measurement noise $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R}_k)$ are each zero-mean, Gaussian and white. They are uncorrelated with each other. And the initial state $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0, \mathbf{P}_0)$ is uncorrelated with both.

White $\mathbf{w}$ makes the state Markov: given $\mathbf{x}_k$, the future does not depend on the past, so the filter carries one estimate and one covariance instead of the whole history. White $\mathbf{v}$ makes each measurement independent evidence, so evidence adds up and each update can treat the new reading as new information.
:::

::: check
For the constant-velocity model with $q = 0.5\,\mathrm{m^2/s^3}$, compute $\mathbf{Q}$ for $\Delta t = 1\,\mathrm{s}$. Compare it with ten steps of $\Delta t = 0.1\,\mathrm{s}$ starting from a perfectly known state.
:::

::: answer
$\mathbf{Q} = 0.5\begin{pmatrix} 1/3 & 1/2 \\ 1/2 & 1 \end{pmatrix} = \begin{pmatrix} 0.1667 & 0.25 \\ 0.25 & 0.5 \end{pmatrix}$, so $\sigma_p = \sqrt{0.1667} = 0.408\,\mathrm{m}$ and $\sigma_v = \sqrt{0.5} = 0.707\,\mathrm{m/s}$ after one second.

Repeating $\mathbf{P}_{k+1} = \mathbf{F}\mathbf{P}_k\mathbf{F}^{\mathsf{T}} + \mathbf{Q}_{0.1}$ ten times from $\mathbf{P}_0 = \mathbf{0}$ gives the identical matrix. The exact discretization is the integral of the same spectral density over the same second, cut into ten pieces and carried to the end.

Notice the position entry is *not* ten times the $0.1\,\mathrm{s}$ entry ($1.667\times10^{-4}$). It is a thousand times, because velocity kicks early in the second had time to move the position.
:::

::: check
An accelerometer's noise density is $150\,\mathrm{\mu g/\sqrt{Hz}}$. What is $q$ for a filter that treats this noise as white acceleration? What velocity nudge does one $10\,\mathrm{ms}$ step receive?
:::

::: answer
Convert to SI: $150\times10^{-6} \times 9.80665 = 1.471\times10^{-3}\,\mathrm{m/s^2/\sqrt{Hz}}$. The spectral density is the square, $q = 2.16\times10^{-6}\,\mathrm{m^2/s^3}$.

Per step, the velocity variance is $q\,\Delta t = 2.16\times10^{-6} \times 0.01 = 2.16\times10^{-8}\,\mathrm{m^2/s^2}$, a nudge of $\sqrt{q\,\Delta t} = 1.47\times10^{-4}\,\mathrm{m/s}$.

The same digits play two roles. $\sqrt{q} = 1.47\times10^{-3}$ is a density in $\mathrm{m/s^2/\sqrt{Hz}}$ (the same as a velocity random walk in $\mathrm{m/s/\sqrt{s}}$). $\sqrt{q\Delta t}$ is a standard deviation in $\mathrm{m/s}$.
:::

::: check
Why does the short-step shortcut $\mathbf{Q} \approx \operatorname{diag}(0, q\,\Delta t)$ give a singular matrix, and why might that matter to a filter?
:::

::: answer
It keeps only the entry where the noise enters directly, the velocity. It drops the position entry (which is higher order in $\Delta t$) and the cross term. The result has rank one: it claims the position gets no process noise at all within a step.

A filter believing that can drive the position variance toward zero when position readings are frequent. Then the position estimate stops responding to the very disturbances the model was meant to allow. A singular $\mathbf{Q}$ also removes the margin that keeps $\mathbf{P}$ safely positive definite in finite-precision arithmetic. The exact form costs three more multiplications and has neither problem.
:::

::: check
A magnetometer's datasheet lists "accuracy $0.5^\circ$". A bench record of the sensor at rest shows white noise with standard deviation $0.05^\circ$, plus a slow wander of a few tenths of a degree over an hour. What goes in $\mathbf{R}$, and where does the rest go?
:::

::: answer
$\mathbf{R}$ gets the white part only: $R = (0.05^\circ)^2$ at the measurement rate.

The slow wander is correlated from sample to sample, so it is not measurement noise in this model's sense. By the rule that noise with memory is a state, it becomes a bias state with Gauss-Markov dynamics driven by white noise, and the filter estimates it.

Using $0.5^\circ$ as $R$ would tell the filter to expect independent $0.5^\circ$ errors, when it will actually get nearly the same error for minutes at a time. The filter would average errors that do not average out, and report a covariance far smaller than its true error.
:::

## Summary

| Item | Statement |
| --- | --- |
| Discrete model | $\mathbf{x}_{k+1} = \mathbf{F}_k\mathbf{x}_k + \mathbf{G}_k\mathbf{u}_k + \mathbf{w}_k$, $\mathbf{z}_k = \mathbf{H}_k\mathbf{x}_k + \mathbf{v}_k$ |
| Noise assumptions | $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0},\mathbf{Q}_k)$, $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0},\mathbf{R}_k)$, white ($\mathbb{E}[\mathbf{w}_k\mathbf{w}_j^{\mathsf{T}}] = \mathbf{Q}_k\delta_{kj}$), mutually uncorrelated, uncorrelated with $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0,\mathbf{P}_0)$ |
| Modeling rule | Noise with memory is a state: correlated errors go into $\mathbf{x}$, driven by white noise |
| Continuous to discrete | $\mathbf{F} = e^{\mathbf{A}\Delta t}$, $\mathbf{Q} = \int_0^{\Delta t} e^{\mathbf{A}\tau}\mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}e^{\mathbf{A}^{\mathsf{T}}\tau}\,d\tau$; short step $\mathbf{Q} \approx \mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}\Delta t$; Van Loan computes both from one exponential |
| Constant-velocity model | $\mathbf{F} = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}$, $\mathbf{Q} = q\begin{pmatrix} \Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t \end{pmatrix}$, $q$ in $\mathrm{m^2/s^3}$, correlation $\sqrt{3}/2$ |
| Piecewise-constant acceleration | $\mathbf{Q} = \sigma_a^2\begin{pmatrix} \Delta t^4/4 & \Delta t^3/2 \\ \Delta t^3/2 & \Delta t^2 \end{pmatrix}$, rank one; a different model |
| Units | $\mathbf{Q}_c$ is a spectral density (unit$^2$/Hz); $\mathbf{Q}$ and $\mathbf{R}$ are variances at the step and measurement rate |
| Measurement noise | $\mathbf{R}$ from bench data (PSD, Allan deviation, MLE); quantization adds $\Delta^2/12$; averaging $N$ white samples divides $\mathbf{R}$ by $N$ |
| Attitude and bias model | $\mathbf{x} = (\theta, b)$, $\mathbf{F} = \begin{pmatrix} 1 & -\Delta t \\ 0 & \phi \end{pmatrix}$, $u = \omega_m$, $\mathbf{Q} = \operatorname{diag}(\mathrm{ARW}^2\Delta t,\ \sigma_b^2(1-\phi^2))$, $\mathbf{H} = (1\ \ 0)$ |

With the model written down, the next question is how to combine a prediction of $\mathbf{x}$ with covariance $\mathbf{P}$ and a measurement with covariance $\mathbf{R}$. The next lesson answers it three times over (by minimum variance, by Bayes' theorem on Gaussians, and by recursive least squares) and shows that all three roads arrive at the same gain.

::: context which-matrices Which matrices carry the physics
$\mathbf{F}$, $\mathbf{G}$ and $\mathbf{H}$ hold the deterministic physics and are usually well known. $\mathbf{R}$ is a sensor property you can measure on a bench. $\mathbf{Q}$ is partly physics (a gyro's random walk traces back to bench data) and partly a confession about what the model leaves out, which is why a later lesson is about $\mathbf{Q}$ alone. $\mathbf{P}_0$ is what you know at switch-on, and the convergence lesson shows how fast a well-built filter forgets it.
:::

::: context observer-bridge From a hand-tuned observer to an optimal one
An **observer** is a small simulation of the vehicle that runs beside it on the flight computer and nudges itself toward the sensor readings with a gain $\mathbf{L}$. In the state-space module you chose $\mathbf{L}$ by placing poles, a rule of thumb. The Kalman filter is an observer too, with the same structure. The difference is that its gain is computed every step from $\mathbf{Q}$, $\mathbf{R}$ and the current uncertainty, so it is the best gain for the noise you actually have. Rudolf Kalman published the discrete filter in 1960, and within a few years it was flying in the Apollo guidance computer.
:::

::: context covariance-matrix Reading a covariance matrix
For two variables, a covariance matrix is $\begin{pmatrix} \sigma_1^2 & \rho\sigma_1\sigma_2 \\ \rho\sigma_1\sigma_2 & \sigma_2^2 \end{pmatrix}$. The diagonal holds the variances, the squares of the spreads. The off-diagonal holds how the two move together, with $\rho$ ("rho") the correlation, between $-1$ and $1$. Draw all the points that are "one sigma" away and you get an ellipse. When $\rho = 0$ it lines up with the axes. When $\rho > 0$ it tilts, because a big value of one tends to come with a big value of the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="85" x2="160" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <line x1="90" y1="20" x2="90" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="90" cy="85" rx="55" ry="30" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="166" font-size="12" fill="#1f2a44" text-anchor="middle">ρ = 0: no tilt</text>
  <line x1="200" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <line x1="270" y1="20" x2="270" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="270" cy="85" rx="60" ry="22" transform="rotate(-35 270 85)" fill="#f2b880" fill-opacity="0.6" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="166" font-size="12" fill="#1f2a44" text-anchor="middle">ρ &gt; 0: tilted</text>
  <text x="156" y="99" font-size="11" fill="#1f2a44">x₁</text>
  <text x="96" y="28" font-size="11" fill="#1f2a44">x₂</text>
  <text x="336" y="99" font-size="11" fill="#1f2a44">x₁</text>
  <text x="276" y="28" font-size="11" fill="#1f2a44">x₂</text>
</svg>
```
:::

::: context white-noise Why "white"
White light mixes every color in equal amounts. White noise mixes every frequency in equal amounts: its power spectrum is flat. In time, that means each sample is unrelated to the last, so the trace jumps about with no pattern. Noise with memory drifts in slow swells instead, and each value is a good guess for the next. The filter must be told which is which, because it treats white noise as fresh evidence every time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="18" font-size="12" fill="#1f2a44">white: no memory</text>
  <line x1="12" y1="45" x2="348" y2="45" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.5" points="12,40 24,58 36,33 48,52 60,44 72,28 84,55 96,47 108,36 120,60 132,41 144,50 156,30 168,49 180,57 192,38 204,46 216,31 228,54 240,43 252,59 264,35 276,48 288,40 300,56 312,32 324,51 336,42 348,47"/>
  <text x="12" y="92" font-size="12" fill="#1f2a44">correlated: memory</text>
  <line x1="12" y1="120" x2="348" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" points="12,118 36,112 60,104 84,100 108,103 132,111 156,122 180,131 204,136 228,133 252,125 276,116 300,110 324,112 348,118"/>
</svg>
```
:::

::: context markov Named for a mathematician who counted vowels
Andrey Markov, a Russian mathematician, studied chains of events where the next step depends only on the present one. In 1913 he tested the idea on the letters of Pushkin's poem *Eugene Onegin*, counting how often a vowel follows a vowel. A process with this "no memory beyond now" feature is called Markov. For a filter it is a gift: the estimate and its covariance at this moment summarize everything the past can tell you.
:::

::: context dirac-delta An infinitely tall, infinitely thin spike
The Dirac delta $\delta(t)$ is zero everywhere except at $t = 0$, where it is so tall that its total area is exactly $1$. Its job is to pick out one moment: $\int f(s)\,\delta(s - s')\,ds = f(s')$. Writing white noise's correlation as $\mathbf{Q}_c\,\delta(t - \tau)$ says two different instants are completely unrelated, while the area $\mathbf{Q}_c$ sets how strong the noise is. That is why integrating over time turns $\mathbf{Q}_c$ into a variance.
:::

::: context cv-correlation Why position and velocity noise are linked
Split one step into moments. A gust early in the step changes the velocity and then has almost the whole step to shift the position. A gust at the very end changes the velocity but has no time to move anything. So position errors and velocity errors from the same step tend to have the same sign. Working through the integral gives a correlation of exactly $\sqrt{3}/2 \approx 0.866$, and it is the same for every step length, because both entries scale together.
:::

::: context van-loan One matrix exponential does both
In 1978 the numerical analyst Charles Van Loan showed how to get $\mathbf{F}$ and $\mathbf{Q}$ from a single matrix exponential. Build a block matrix twice the size of $\mathbf{A}$, with $-\mathbf{A}$, $\mathbf{G}_c\mathbf{Q}_c\mathbf{G}_c^{\mathsf{T}}$ and $\mathbf{A}^{\mathsf{T}}$ in its blocks, and exponentiate it once. Its lower-right block is $\mathbf{F}^{\mathsf{T}}$, and $\mathbf{F}$ times its upper-right block is $\mathbf{Q}$. It works for any linear model, so you never need to do the integral by hand for a model too big to do by hand.
:::

::: context allan Measuring noise by averaging
The Allan deviation, from David Allan's 1966 work on atomic clocks, averages a long sensor record over clusters of length $\tau$ and asks how much neighboring averages differ. Plotted against $\tau$ on log-log axes, white noise shows up as a line of slope $-1/2$ (averaging helps), bias instability as a flat floor (averaging stops helping), and rate random walk as a rise. Gyro and accelerometer datasheets quote their random walk and bias instability straight off this plot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,30 170,90 200,96 230,96 260,90 330,55"/>
  <text x="80" y="42" font-size="11" fill="#1d6fd1">slope −1/2: white</text>
  <text x="170" y="116" font-size="11" fill="#1f2a44">floor: bias instability</text>
  <text x="262" y="60" font-size="11" fill="#b4232c">rise: random walk</text>
  <text x="190" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">averaging time τ (log)</text>
  <text x="14" y="82" font-size="12" fill="#1f2a44" transform="rotate(-90 14 82)" text-anchor="middle">Allan dev. (log)</text>
</svg>
```
:::

::: context star-tracker A camera that reads the sky
A star tracker is a small camera that photographs the stars, matches the pattern against a catalog, and works out which way the spacecraft points. Good ones reach a few arcseconds. One arcsecond is $1/3600$ of a degree, about $4.85\,\mu\mathrm{rad}$: the width of a $24\,\mathrm{mm}$ coin seen from about $5\,\mathrm{km}$ away. Trackers update a few to ten times a second, so between fixes the gyro carries the attitude, exactly the split in this lesson's model.
:::
