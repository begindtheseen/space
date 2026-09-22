---
id: l08-gauss-markov-and-imu-error-models
title: Gauss-Markov processes and IMU error models
minutes: 28
covers:
  - white noise, random walk, Gauss-Markov processes
---

Ask a navigation engineer what the state vector of an aided inertial filter contains and the answer will include, alongside position, velocity and attitude, six numbers that are not physical quantities at all: three gyro biases and three accelerometer biases. Those six states, and the noise model attached to them, are what allow the filter to estimate the sensor's slow drift from the aiding measurements and remove it, and they are the reason a modern MEMS IMU can support navigation performance far beyond what its datasheet bias figure suggests. Get the model right and the filter learns the bias; get it wrong and the filter either chases noise or trusts a bias that has long since wandered.

The model is almost always the same one: the **first-order Gauss-Markov process**. This lesson derives it from a one-line differential equation, works out its variance, its autocorrelation and its exact discrete-time form, shows how it degenerates into the random walk and the white noise of the previous lesson at its two extremes, and then does what the module's third objective asks: builds a gyro bias model from datasheet and bench-test numbers, angle random walk and bias instability, with every parameter traced to a measurement. The mathematics is short. The judgement about which numbers to feed it is the actual skill, and the lesson spends its time there.

## The gap between white noise and random walk

The previous lesson ended with the observation that neither of its processes describes a sensor bias. White noise has no memory: modelled that way, a bias would be a new random number every sample and would average away in a second. The random walk has perfect memory: its variance grows as $Qt$ forever, so after a long enough mission the filter would believe the bias could be anything. A real gyro bias, observed on a bench for a day, does something in between. Over seconds it looks constant. Over minutes it wanders. Over hours it stays within a band of a few degrees per hour and shows no tendency to escape. It has a **finite memory**: a correlation time beyond which where it was tells you little about where it is.

The simplest process with that behaviour adds one term to the random walk. Instead of $\dot{b} = w$, write

$$
\dot{b}(t) = -\frac{1}{T}\,b(t) + w(t), \qquad \mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau).
$$

The white noise $w$ still kicks the bias around; the new term $-b/T$ pulls it back toward zero at a rate proportional to how far it has strayed, with **correlation time** $T$ in seconds. It is a first-order low-pass filter driven by white noise, or, mechanically, a particle on a spring in a heat bath. The process is Gaussian because it is a linear operation on Gaussian noise, and it is **Markov** because, given the present value $b(t)$, the future is independent of the past: the differential equation needs only the current state. Hence the name.

## Mean, variance and autocorrelation

Solve the equation as any linear first-order ODE, by the integrating factor $e^{t/T}$:

$$
b(t) = e^{-t/T}\,b(0) + \int_0^t e^{-(t - s)/T}\,w(s)\,ds.
$$

The first term is the initial value decaying away; the second is the accumulated noise, each kick weighted by how long ago it arrived. Taking expectations, and since $w$ has zero mean, $\mathbb{E}[b(t)] = e^{-t/T}\,\mathbb{E}[b(0)]$: whatever the initial mean, it is forgotten within a few correlation times.

For the variance $P(t) = \operatorname{Var}(b(t))$, differentiate rather than integrate. The variance of a linear system $\dot{x} = a x + w$ driven by white noise of strength $Q$ obeys $\dot{P} = 2aP + Q$. You can see why from the discrete step: over a short $\Delta t$, $x$ becomes $(1 + a\Delta t)x + \text{noise of variance } Q\Delta t$, so $P$ becomes $(1 + a\Delta t)^2 P + Q\Delta t \approx P + (2aP + Q)\Delta t$. With $a = -1/T$,

$$
\dot{P} = -\frac{2}{T}\,P + Q, \qquad P(t) = \frac{QT}{2}\Big(1 - e^{-2t/T}\Big) + e^{-2t/T}P(0).
$$

As $t \to \infty$ the variance settles to a **steady-state** value

$$
\sigma^2 = \frac{Q\,T}{2}, \qquad\text{equivalently}\qquad Q = \frac{2\sigma^2}{T}.
$$

This is the property the random walk lacked. The noise keeps pushing, but the restoring term keeps pulling, and the two balance at a variance set by their ratio. Started from zero, the variance reaches $86\%$ of $\sigma^2$ after one correlation time and $98\%$ after two. A process that has been running for longer than a few $T$ is in its stationary state, and a filter initialised with $P(0) = \sigma^2$ is initialised correctly.

Now the autocorrelation in the stationary state. For $\tau > 0$, use the solution from time $t$ forward:

$$
b(t + \tau) = e^{-\tau/T}\,b(t) + \int_t^{t+\tau} e^{-(t + \tau - s)/T}\,w(s)\,ds.
$$

Multiply by $b(t)$ and take the expectation. The integral involves noise after time $t$, which is independent of $b(t)$, so its cross term vanishes, leaving

$$
R_b(\tau) = \mathbb{E}[b(t)\,b(t + \tau)] = e^{-\tau/T}\,\mathbb{E}[b(t)^2] = \sigma^2 e^{-\tau/T},
$$

and by symmetry of the autocorrelation, for either sign of $\tau$,

$$
R_b(\tau) = \sigma^2 e^{-|\tau|/T}.
$$

The correlation between the bias now and the bias one correlation time later is $e^{-1} = 0.368$; after three correlation times it is $0.050$, and the bias has effectively been redrawn. This exponential is the signature of the process, and the exercise that accompanies this module asks you to recover it from simulated data.

::: key
The first-order Gauss-Markov process is $\dot{b} = -b/T + w$, with $w$ white of strength $Q = 2\sigma^2/T$. It is stationary with variance $\sigma^2$ and autocorrelation $R(\tau) = \sigma^2 e^{-|\tau|/T}$, where $T$ is the correlation time. It is the standard model for gyro and accelerometer bias drift.
:::

## The exact discrete-time form

A filter runs in steps, so the process must be sampled. Evaluate the solution over one step $\Delta t$, from $t_k$ to $t_{k+1}$:

$$
b_{k+1} = \phi\,b_k + n_k, \qquad \phi = e^{-\Delta t/T}, \qquad n_k = \int_{t_k}^{t_{k+1}} e^{-(t_{k+1} - s)/T}\,w(s)\,ds.
$$

The $n_k$ are zero-mean, Gaussian and uncorrelated from step to step, since each integrates noise over its own interval. Their variance follows from the same delta-function collapse as in the previous lesson:

$$
\operatorname{Var}(n_k) = Q\int_0^{\Delta t} e^{-2u/T}\,du = \frac{QT}{2}\Big(1 - e^{-2\Delta t/T}\Big) = \sigma^2\big(1 - \phi^2\big).
$$

Check it against the steady state. If $\operatorname{Var}(b_k) = \sigma^2$, then $\operatorname{Var}(b_{k+1}) = \phi^2\sigma^2 + \sigma^2(1 - \phi^2) = \sigma^2$: the discrete process holds exactly the variance the continuous one does, at any step size. This form is *exact*, not an Euler approximation. For $\Delta t \ll T$, expanding $1 - \phi^2 \approx 2\Delta t/T$ recovers the intuitive $\operatorname{Var}(n_k) \approx 2\sigma^2\Delta t/T = Q\,\Delta t$, which is what an Euler step would use; the exact form matters when the step is not small compared with $T$.

::: example Discretising a gyro bias model at three rates
Take a bias with $\sigma = 3\,^\circ/\mathrm{h}$ and $T = 100\,\mathrm{s}$, so $Q = 2 \times 9/100 = 0.18\,(^\circ/\mathrm{h})^2/\mathrm{s}$. At three step sizes:

| $\Delta t$ | $\phi = e^{-\Delta t/T}$ | $\sigma_n = \sigma\sqrt{1 - \phi^2}$ | Euler $\sqrt{Q\,\Delta t}$ |
| --- | --- | --- | --- |
| $0.01\,\mathrm{s}$ | $0.99990$ | $0.0424\,^\circ/\mathrm{h}$ | $0.0424\,^\circ/\mathrm{h}$ |
| $1\,\mathrm{s}$ | $0.99005$ | $0.422\,^\circ/\mathrm{h}$ | $0.424\,^\circ/\mathrm{h}$ |
| $10\,\mathrm{s}$ | $0.90484$ | $1.277\,^\circ/\mathrm{h}$ | $1.342\,^\circ/\mathrm{h}$ |

At a $100\,\mathrm{Hz}$ IMU rate the exact and Euler forms agree to four figures. At a $10\,\mathrm{s}$ step, a plausible interval between GNSS fixes in a loosely coupled filter that propagates the bias only between updates, Euler overstates the driving noise by $5\%$ and, more seriously, an Euler transition $1 - \Delta t/T = 0.90$ instead of $\phi = 0.905$ is a different process. Use the exact form; it costs one exponential.
:::

The Python is three lines, and it is exactly what the module's exercise asks for:

```python
import numpy as np

def gauss_markov(sigma, T, dt, n, seed=0):
    rng = np.random.default_rng(seed)
    phi = np.exp(-dt / T)
    b = np.empty(n)
    b[0] = sigma * rng.standard_normal()            # start in the stationary state
    noise = sigma * np.sqrt(1 - phi**2) * rng.standard_normal(n - 1)
    for k in range(n - 1):
        b[k + 1] = phi * b[k] + noise[k]
    return b

b = gauss_markov(3.0, 100.0, 1.0, 400_000)           # deg/h, s, s
print(b.std())                                       # ~3.0
lag = 100
print(np.mean(b[:-lag] * b[lag:]) / np.mean(b * b))  # ~0.37  (theory: 1/e = 0.368)
```

::: warning
Two things go wrong in practice. The first is to initialise the bias state at zero with $P(0) = 0$, or to start the simulation at $b_0 = 0$ without discarding a few correlation times of transient: the process then spends its first $2T$ or $3T$ with the wrong variance, and a consistency test run over that window fails for no good reason. The second is to keep $Q$ fixed while changing $T$ during tuning. The steady-state variance $QT/2$ then changes too, and a filter that was told the bias is bounded by $3\,^\circ/\mathrm{h}$ quietly starts believing $10$. Tune $\sigma$ and $T$, and derive $Q$.
:::

## The two limits: random walk and white noise

Hold $Q$ fixed and let $T \to \infty$. The restoring term vanishes, $\dot{b} = w$, and the process is a random walk. In the discrete form, $\phi \to 1$ and $\operatorname{Var}(n_k) = \frac{QT}{2}(1 - e^{-2\Delta t/T}) \to Q\,\Delta t$, exactly the Brownian increment of the previous lesson. The steady-state variance $QT/2$ goes to infinity, which is the random walk's unbounded growth seen from the other side.

Hold $\sigma$ fixed and let $T \to 0$. Then $\phi \to 0$ and $\operatorname{Var}(n_k) \to \sigma^2$: each sample is an independent draw from $\mathcal{N}(0, \sigma^2)$, a white sequence. The autocorrelation $\sigma^2 e^{-|\tau|/T}$ collapses toward a spike at zero.

Between these limits sits the process's real character. On time scales short compared with $T$ it behaves like a random walk of strength $Q$; on time scales long compared with $T$ it behaves like a stationary noise of variance $\sigma^2$ whose successive values are unrelated. What distinguishes it from a random walk, and what the module's quiz will ask you to articulate, is that its variance **saturates** at $\sigma^2$ instead of growing without bound, and its correlation decays as $e^{-|\tau|/T}$ rather than persisting forever. What distinguishes it from white noise is that it has memory at all.

## What a wandering bias does to attitude

A gyro bias enters the attitude error through an integral, $\theta_b(t) = \int_0^t b(s)\,ds$, and how that integral grows depends on the memory of $b$. Its variance is a double integral of the autocorrelation:

$$
\operatorname{Var}(\theta_b(t)) = \int_0^t\!\!\int_0^t \sigma^2 e^{-|u - v|/T}\,du\,dv = 2\sigma^2\int_0^t (t - \tau)\,e^{-\tau/T}\,d\tau,
$$

the second form counting each ordered pair once and noting that there are $t - \tau$ pairs at separation $\tau$. Integrating by parts, $\int_0^t (t - \tau)e^{-\tau/T}d\tau = T^2\big(t/T - 1 + e^{-t/T}\big)$, so

$$
\operatorname{Var}(\theta_b(t)) = 2\sigma^2 T^2\Big(\frac{t}{T} - 1 + e^{-t/T}\Big).
$$

Examine the two ends. For $t \ll T$, expand the exponential to second order: $t/T - 1 + (1 - t/T + t^2/2T^2) = t^2/2T^2$, giving $\operatorname{Var} \approx \sigma^2 t^2$, so $\sigma_\theta \approx \sigma\,t$. Over times short compared with the correlation time the bias is effectively constant and the angle error grows linearly, as a constant bias would. For $t \gg T$ the bracket is $\approx t/T$ and $\operatorname{Var} \approx 2\sigma^2 T\,t = Q T^2\,t$: linear growth of *variance*, a random walk in angle with effective strength $2\sigma^2 T$. The bias changes sign every few correlation times and its integral wanders rather than drifts.

::: example Attitude error from a Gauss-Markov bias
For $\sigma = 3\,^\circ/\mathrm{h} = 8.33 \times 10^{-4}\,^\circ/\mathrm{s}$ and $T = 100\,\mathrm{s}$, the angle error from the bias alone, compared with what a constant $3\,^\circ/\mathrm{h}$ bias would give and with the $0.3\,^\circ/\sqrt{\mathrm{h}}$ angle random walk of the previous lesson:

| $t$ | GM bias $\sigma_\theta$ | Constant bias $\sigma t$ | ARW $0.3\sqrt{t}$ |
| --- | --- | --- | --- |
| $10\,\mathrm{s}$ | $0.0082^\circ$ | $0.0083^\circ$ | $0.0158^\circ$ |
| $60\,\mathrm{s}$ | $0.0455^\circ$ | $0.0500^\circ$ | $0.0387^\circ$ |
| $600\,\mathrm{s}$ | $0.264^\circ$ | $0.500^\circ$ | $0.122^\circ$ |
| $3600\,\mathrm{s}$ | $0.697^\circ$ | $3.00^\circ$ | $0.300^\circ$ |

At ten seconds the bias is as good as constant and the white noise dominates. By a minute the two are comparable. At ten minutes the bias term is twice the random-walk term, but only half of what a constant bias would have produced, because over six correlation times the bias has already wandered through several values that partly cancelled. At an hour the constant-bias model overstates the error by a factor of four. The RSS total at $600\,\mathrm{s}$ is $\sqrt{0.264^2 + 0.122^2} = 0.291^\circ$. This is the honest version of the "bias dominates the coast" argument: it does, but by how much depends on $T$, and treating the bias as constant over an interval much longer than $T$ is pessimistic, just as treating it as constant over an interval shorter than $T$ is exactly right.
:::

## Reading the parameters from a bench test: the Allan deviation

The model has three inputs: the white-noise strength (ARW) and the two Gauss-Markov parameters $\sigma$ and $T$. All three come from a static record of the sensor, hours long, analysed with the **Allan variance**, which is a way of asking "how much does the average over a window of length $\tau$ change from one window to the next?" Divide the record into consecutive windows of length $\tau$, compute the mean rate $\bar{y}_k(\tau)$ in each, and define

$$
\sigma_A^2(\tau) = \tfrac{1}{2}\,\mathbb{E}\big[(\bar{y}_{k+1} - \bar{y}_k)^2\big].
$$

Plot $\sigma_A(\tau)$ against $\tau$ on log-log axes and each noise type appears as a straight segment with its own slope.

**White noise**, slope $-\tfrac{1}{2}$. The window average of white noise of strength $Q$ has variance $Q/\tau$, the averages of adjacent windows are independent, so $\sigma_A^2 = \tfrac{1}{2}(2Q/\tau) = Q/\tau$ and $\sigma_A(\tau) = \sqrt{Q}/\sqrt{\tau}$. Read the line at $\tau = 1\,\mathrm{s}$ and you have the noise density $\sqrt{Q}$ directly, hence the ARW.

**Bias instability**, slope $0$. Below the white-noise line, the curve flattens into a floor. This is the region where the bias wanders: averaging longer no longer helps, because the thing being averaged is itself moving. The height of the floor is conventionally written $0.664\,B$, where $B$ is the **bias instability** coefficient, the number datasheets quote in $^\circ/\mathrm{h}$. The factor $\sqrt{2\ln 2/\pi} = 0.664$ comes from the exact Allan variance of flicker ($1/f$) noise, which is what the floor physically is.

**Rate random walk**, slope $+\tfrac{1}{2}$. If the bias itself contains a random-walk component of strength $K^2$, the curve turns upward again at long $\tau$ with $\sigma_A = K\sqrt{\tau/3}$. Many MEMS gyros show it; a good fibre-optic gyro may not within a day's record.

Now the modelling step, and it involves a choice. Flicker noise is not a Gauss-Markov process; its correlation decays more slowly than any exponential. But a Gauss-Markov process with $\sigma \approx B$ and $T$ set to the value of $\tau$ at which the Allan curve leaves the white-noise line and enters the floor reproduces the behaviour on the time scales a navigation filter operates on, and it has a two-parameter state-space form that flicker noise does not. That is the compromise every practical filter makes.

::: example From an Allan plot to a gyro bias model
A twelve-hour static record of a MEMS gyro yields an Allan deviation plot with three features. At $\tau = 1\,\mathrm{s}$, on the $-\tfrac{1}{2}$ slope, $\sigma_A = 0.005\,^\circ/\mathrm{s}$. The curve flattens around $\tau \approx 80$ to $100\,\mathrm{s}$ into a floor at $\sigma_A = 5.5 \times 10^{-4}\,^\circ/\mathrm{s}$. Beyond $\tau \approx 1000\,\mathrm{s}$ it begins to rise.

The white-noise line gives the noise density directly: $\sqrt{Q_w} = 0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, so $\mathrm{ARW} = 0.3\,^\circ/\sqrt{\mathrm{h}}$. The floor gives $B = 5.5 \times 10^{-4}/0.664 = 8.3 \times 10^{-4}\,^\circ/\mathrm{s} = 3.0\,^\circ/\mathrm{h}$. The knee gives the correlation time: the white-noise line $0.005/\sqrt{\tau}$ meets the floor $5.5 \times 10^{-4}$ where $\tau = (0.005/5.5 \times 10^{-4})^2 = 82\,\mathrm{s}$, consistent with the visible transition, so take $T = 100\,\mathrm{s}$. The bias model is then $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$, $Q = 2\sigma^2/T = 0.18\,(^\circ/\mathrm{h})^2/\mathrm{s}$, the parameters used throughout this lesson. The rise beyond $1000\,\mathrm{s}$ would be modelled, if the mission lasted hours, as an additional random-walk state; for a flight of minutes it can be folded into a slightly larger $\sigma$.
:::

::: note
The turn-on bias, the value the bias takes when the sensor is powered up, is a separate matter. It is a constant for the duration of a run, different each run, often ten to a hundred times larger than the bias instability, and it is not visible in a single Allan plot at all, because the Allan variance differences it away. In the filter it appears as a large initial variance on the bias state, or as a separate constant state; the Gauss-Markov model covers only the in-run wander around it.
:::

## Assembling the gyro and accelerometer model

The complete error model for one gyro axis, in the form a filter uses, reads

$$
\tilde{\omega}(t) = \omega(t) + b(t) + w_g(t), \qquad \dot{b} = -\frac{b}{T} + w_b,
$$

with $w_g$ white of strength $Q_w = (\mathrm{ARW}/60)^2$ in $(^\circ/\mathrm{s})^2/\mathrm{Hz}$ and $w_b$ white of strength $Q_b = 2\sigma^2/T$. The measured rate is the true rate, plus a slowly wandering bias, plus fresh noise. In the filter, $b$ becomes a state with transition $\phi = e^{-\Delta t/T}$ and process-noise variance $\sigma^2(1 - \phi^2)$, while $w_g$ enters the attitude state directly as process noise of variance $Q_w\Delta t$ per step in angle. Three gyros give three such states; the accelerometers give three more with their own $\sigma$, $T$ and velocity random walk.

::: example An accelerometer bias in position
An accelerometer's in-run bias has $\sigma = 50\,\mathrm{\mu g} = 4.90 \times 10^{-4}\,\mathrm{m/s^2}$ and $T = 300\,\mathrm{s}$, so $Q_b = 2\sigma^2/T = 1.60 \times 10^{-9}\,(\mathrm{m/s^2})^2/\mathrm{s}$; at a $100\,\mathrm{Hz}$ step, $\phi = e^{-0.01/300} = 0.99997$ and $\sigma_n = 4.0 \times 10^{-6}\,\mathrm{m/s^2}$. Over a $60\,\mathrm{s}$ unaided interval, short compared with $T$, the bias is effectively constant, and a constant $4.90 \times 10^{-4}\,\mathrm{m/s^2}$ acceleration error integrates twice into $\tfrac{1}{2}\sigma t^2 = 0.5 \times 4.90 \times 10^{-4} \times 3600 = 0.88\,\mathrm{m}$ of position error, against the $0.26\,\mathrm{m}$ from velocity random walk computed in the previous lesson. Over $600\,\mathrm{s}$ the constant-bias figure would be $88\,\mathrm{m}$, an overstatement since $600\,\mathrm{s} = 2T$, but the order of magnitude is right, and it is why an unaided IMU cannot hold position for ten minutes without a bias estimate.
:::

::: warning
$\sigma$ and $Q$ are different numbers with different units, and datasheets quote neither directly. Bias instability $B$ is in $^\circ/\mathrm{h}$ and is close to $\sigma$; the process-noise strength $Q = 2\sigma^2/T$ is in $(^\circ/\mathrm{h})^2/\mathrm{s}$ and depends on your choice of $T$. Entering $B$ where the filter expects $Q$, or $Q\Delta t$ where it expects $Q$, produces a filter that is wrong by orders of magnitude and yet runs without complaint. Write the units next to every noise parameter in the configuration file.
:::

## Check yourself

::: check
A gyro bias is modelled as first-order Gauss-Markov with $\sigma = 1\,^\circ/\mathrm{h}$ and $T = 1\,\mathrm{h}$. Write the discrete-time model at $\Delta t = 0.1\,\mathrm{s}$: the transition $\phi$, the driving-noise standard deviation and the continuous strength $Q$.
:::

::: answer
$\phi = e^{-0.1/3600} = 0.999972$. The driving noise has $\sigma_n = \sigma\sqrt{1 - \phi^2} = 1 \times \sqrt{1 - 0.999944} = 7.45 \times 10^{-3}\,^\circ/\mathrm{h}$ per step. The continuous strength is $Q = 2\sigma^2/T = 2/3600 = 5.56 \times 10^{-4}\,(^\circ/\mathrm{h})^2/\mathrm{s}$, and $\sqrt{Q\,\Delta t} = 7.45 \times 10^{-3}$ agrees with the exact figure because $\Delta t \ll T$. Note how small the per-step kick is: over a ten-minute flight this bias is very nearly constant, and the filter's ability to estimate it comes from the aiding measurements, not from its wander.
:::

::: check
A bias process has autocorrelation $R(\tau) = 0.25\,e^{-|\tau|/T}\,(^\circ/\mathrm{h})^2$ and you measure $R(30\,\mathrm{s}) = 0.10\,(^\circ/\mathrm{h})^2$. What are $\sigma$ and $T$?
:::

::: answer
$R(0) = \sigma^2 = 0.25$, so $\sigma = 0.5\,^\circ/\mathrm{h}$. From $0.25\,e^{-30/T} = 0.10$, $e^{-30/T} = 0.4$, so $T = 30/\ln(2.5) = 32.7\,\mathrm{s}$. As a check, $R(T)$ should be $0.25/e = 0.092$, slightly below the $0.10$ observed at the shorter lag of $30\,\mathrm{s}$.
:::

::: check
A Gauss-Markov bias is initialised at exactly zero. After how many correlation times has its variance reached $90\%$ of the steady-state value? What does this imply for the initial covariance of a bias state in a filter?
:::

::: answer
From $P(t) = \sigma^2(1 - e^{-2t/T})$, set $1 - e^{-2t/T} = 0.9$, so $e^{-2t/T} = 0.1$ and $t = \tfrac{T}{2}\ln 10 = 1.15\,T$. The variance approaches its limit twice as fast as the autocorrelation decays, because it involves $e^{-2t/T}$ rather than $e^{-t/T}$. In a filter, the bias state should be initialised with $P(0) = \sigma^2$ (plus the turn-on bias variance) rather than zero, since a sensor that has been powered for more than a couple of correlation times is already in its stationary state and its bias is already somewhere in the $\pm\sigma$ band.
:::

::: check
Compare a Gauss-Markov bias with $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$ against a random walk driven by the same $Q$. What are the two standard deviations after $10\,\mathrm{s}$ and after one hour, each started from zero?
:::

::: answer
$Q = 2 \times 9/100 = 0.18\,(^\circ/\mathrm{h})^2/\mathrm{s}$. After $10\,\mathrm{s}$: random walk $\sqrt{0.18 \times 10} = 1.34\,^\circ/\mathrm{h}$; Gauss-Markov $3\sqrt{1 - e^{-0.2}} = 1.28\,^\circ/\mathrm{h}$, nearly the same because $10\,\mathrm{s} \ll T$. After $3600\,\mathrm{s}$: random walk $\sqrt{0.18 \times 3600} = 25.5\,^\circ/\mathrm{h}$; Gauss-Markov $3.0\,^\circ/\mathrm{h}$, fully saturated. A filter using the random-walk model for this sensor would, after an hour of coasting, allow the bias to be eight times larger than it can physically be, and would weight aiding measurements accordingly.
:::

::: check
Explain in two or three sentences why the module's earlier statement that "the bias dominates the coast" and this lesson's finding that the constant-bias model overstates the error at long times are both correct.
:::

::: answer
Over any interval up to a few correlation times, the bias is effectively constant and its integrated angle error grows linearly, quickly overtaking the $\sqrt{t}$ growth of the angle random walk; for the example gyro the crossover is near one minute, and by ten minutes the bias contribution is twice the white-noise one. But over intervals much longer than $T$ the bias changes sign repeatedly, its integral becomes a random walk of strength $2\sigma^2T$ rather than a linear drift, and the constant-bias estimate $\sigma t$ becomes increasingly pessimistic: a factor of four at one hour in the example. The bias dominates in both regimes; the constant model correctly sizes it in the first and overstates it in the second.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{b} = -b/T + w$, $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$ | First-order Gauss-Markov process, correlation time $T$ |
| $\dot{P} = -2P/T + Q$, $P(t) = \sigma^2(1 - e^{-2t/T}) + e^{-2t/T}P(0)$ | Variance evolution; saturates, unlike a random walk |
| $\sigma^2 = QT/2$, $Q = 2\sigma^2/T$ | Steady-state variance and the strength that produces it |
| $R(\tau) = \sigma^2 e^{-\lvert\tau\rvert/T}$ | Autocorrelation; $R(T)/R(0) = 1/e$ |
| $b_{k+1} = \phi\,b_k + n_k$, $\phi = e^{-\Delta t/T}$, $\operatorname{Var}(n_k) = \sigma^2(1 - \phi^2)$ | Exact discrete form; $\approx Q\,\Delta t$ when $\Delta t \ll T$ |
| $T \to \infty$: random walk; $T \to 0$: white noise | The two limits |
| $\operatorname{Var}(\int_0^t b) = 2\sigma^2T^2(t/T - 1 + e^{-t/T})$ | Angle error from a GM bias: $\approx \sigma^2 t^2$ for $t \ll T$, $\approx 2\sigma^2 T t$ for $t \gg T$ |
| $\sigma_A^2(\tau) = \tfrac{1}{2}\mathbb{E}[(\bar{y}_{k+1} - \bar{y}_k)^2]$ | Allan variance of window averages |
| Slope $-\tfrac{1}{2}$: $\sigma_A = \sqrt{Q}/\sqrt{\tau}$; floor $0.664B$; slope $+\tfrac{1}{2}$: $K\sqrt{\tau/3}$ | White noise (ARW), bias instability, rate random walk |
| $\tilde{\omega} = \omega + b + w_g$ | Gyro measurement model: truth, GM bias, white noise |

The next lesson takes the autocorrelation functions met so far, the spike of white noise and the exponential of the Gauss-Markov process, into the frequency domain, where the power spectral density makes the words "white", "noise density" and "per root hertz" exact and shows how a linear system reshapes the noise passing through it.
