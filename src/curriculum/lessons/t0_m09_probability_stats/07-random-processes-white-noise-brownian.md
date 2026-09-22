---
id: l07-random-processes-white-noise-brownian
title: Random processes, white noise and Brownian motion
minutes: 26
covers:
  - stochastic processes and Brownian motion
  - white noise, random walk, Gauss-Markov processes
---

Every lesson so far has treated a noisy quantity as a single random number: one draw, one distribution. A gyro does not deliver one number. It delivers a stream, several hundred numbers a second for the whole flight, and the question that decides whether an inertial navigator works is not "how big is one sample's error?" but "how do the errors at different times relate to one another?" Two gyros can have identical per-sample noise and behave completely differently over a ten-minute coast: one whose errors are fresh every sample averages down, one whose errors persist for minutes does not.

A quantity that is random at every instant, with a joint distribution linking the instants, is a **random process** (also *stochastic process*). This lesson defines the object, introduces the two descriptions a filter designer uses for it, the autocorrelation function and, in a later lesson, the power spectral density, and then builds the two processes that every IMU error model is made of: **white noise**, whose values at distinct instants are unrelated, and its integral, the **random walk**, whose continuous-time form is **Brownian motion**. The gyro spec called angle random walk is exactly this pair, and by the end you will be able to turn a datasheet noise density into an attitude error after any coast time. The next lesson adds the third ingredient, the Gauss-Markov process, and assembles the full bias model.

## What a random process is

Fix a sensor and record its output as a function of time. Now imagine doing the same with a thousand identical sensors, or the same sensor on a thousand identical days. You obtain a thousand different functions of time. A random process $X(t)$ is the rule that assigns probabilities to these functions: for each fixed $t$, $X(t)$ is an ordinary random variable; for each fixed outcome, $X(\cdot)$ is an ordinary function of time, called a **realisation** or **sample path**. The collection of all possible realisations is the **ensemble**.

The full description of a process is the joint distribution of $(X(t_1), X(t_2), \ldots, X(t_n))$ for every choice of instants. That is too much to work with, and for Gaussian processes it is unnecessary, because a joint Gaussian is fixed by its means and covariances. So the working description is the first two moments:

$$
m_X(t) = \mathbb{E}[X(t)], \qquad
R_X(t_1, t_2) = \mathbb{E}[X(t_1)\,X(t_2)].
$$

$R_X$ is the **autocorrelation function**; with the means subtracted it is the **autocovariance**, and for the zero-mean processes that model noise the two coincide. It answers the question the opening posed: how strongly does the value at $t_1$ predict the value at $t_2$? Setting $t_1 = t_2 = t$ gives $R_X(t, t) = \mathbb{E}[X(t)^2]$, the mean-square value, which is the variance for a zero-mean process.

A process is **wide-sense stationary** (WSS) when its mean is constant and its autocorrelation depends only on the separation $\tau = t_2 - t_1$:

$$
m_X(t) = m_X, \qquad R_X(t_1, t_2) = R_X(\tau).
$$

Stationarity says the statistics do not care what time it is. A stationary autocorrelation is even, $R_X(-\tau) = R_X(\tau)$, and takes its maximum at zero, $|R_X(\tau)| \leq R_X(0)$, by the Cauchy–Schwarz inequality. The width of $R_X(\tau)$ is the **correlation time** of the process: the separation beyond which knowing one value tells you little about another. A white sequence has correlation time zero; a slowly wandering bias has a correlation time of minutes or hours; and a random walk, as you will see, is not stationary at all.

::: note
Averaging over the ensemble is what the definitions ask for; averaging over time on a single record is what a bench test can do. A process for which the two agree, so that the time average of one long realisation converges to the ensemble mean and the time-lagged product average converges to $R_X(\tau)$, is called **ergodic**. Stationary noise from a well-behaved sensor is treated as ergodic, and every noise parameter you read off a bench record rests on that assumption. A record that contains a temperature ramp or a warm-up transient is not stationary, so its time averages estimate nothing well defined; trim the record first.
:::

## White noise in discrete time

Start with the simplest process, because a sampled sensor produces one. A **white sequence** $w_k$, $k = 0, 1, 2, \ldots$, is a sequence of zero-mean random variables, each of variance $\sigma_s^2$, uncorrelated with one another:

$$
\mathbb{E}[w_k] = 0, \qquad \mathbb{E}[w_j w_k] = \sigma_s^2\,\delta_{jk},
$$

where $\delta_{jk}$ is $1$ when $j = k$ and $0$ otherwise. Its autocorrelation is a single spike at zero lag. When the $w_k$ are also Gaussian the sequence is **Gaussian white noise** and uncorrelated implies independent, so each sample is a fresh draw from $\mathcal{N}(0, \sigma_s^2)$ that owes nothing to its predecessors. This is what the expectation lesson's sample-mean formulas assumed: the mean of $N$ samples of a white sequence has standard error $\sigma_s/\sqrt{N}$ because the samples are uncorrelated.

The name is an analogy. Sunlight contains every colour at comparable strength and looks white; a white sequence contains every frequency at equal strength, in a sense the spectral-density lesson makes exact. For now the working definition is the one above: flat memory, spike autocorrelation.

## White noise in continuous time

Sensor electronics operate in continuous time, and the dynamics a filter integrates are differential equations, so a continuous-time counterpart is needed. Continuous **white noise** $w(t)$ is defined by

$$
\mathbb{E}[w(t)] = 0, \qquad \mathbb{E}[w(t)\,w(\tau)] = Q\,\delta(t - \tau),
$$

where $\delta$ is the Dirac delta and $Q$ is the **noise strength** or **spectral density**. For a vector process the scalar becomes a matrix, $\mathbb{E}[\mathbf{w}(t)\mathbf{w}(\tau)^{\mathsf{T}}] = \mathbf{Q}\,\delta(t - \tau)$. The definition says that values at *any* two distinct instants, however close, are uncorrelated.

Look at the units. The delta function has units of $1/\mathrm{s}$ (it integrates to one over time), so if $w$ is a rate in $\mathrm{rad/s}$, then $Q$ has units of $(\mathrm{rad/s})^2 \cdot \mathrm{s} = (\mathrm{rad/s})^2/\mathrm{Hz}$. That is why datasheets quote noise in "units per root hertz": the quantity $\sqrt{Q}$, the **noise density**, has units of $\mathrm{rad/s}/\sqrt{\mathrm{Hz}}$, or in gyro datasheets $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, and for an accelerometer $\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$.

Now look at the variance. Setting $\tau = t$ gives $\mathbb{E}[w(t)^2] = Q\,\delta(0) = \infty$. Continuous white noise has infinite variance and infinite power. No physical signal does, so $w(t)$ is an idealisation, a mathematical object like the delta function itself, meaningful only under an integral. It is nevertheless the right idealisation, for the same reason the delta function is: any real noise whose correlation time is much shorter than the shortest time scale the system responds to acts exactly as white noise would. A gyro's electronic noise decorrelates in microseconds; a navigation filter integrates over milliseconds and cares about minutes. To the filter, the noise is white.

::: key
White noise is zero-mean with a flat power spectral density and autocorrelation $\mathbb{E}[w(t)w(\tau)^{\mathsf{T}}] = \mathbf{Q}\,\delta(t - \tau)$: uncorrelated between any two distinct instants. It is a mathematical idealisation with infinite power, physically unrealisable, and it becomes a well-defined quantity only once it is integrated or filtered.
:::

The integral is what makes it usable, and it also connects the continuous and discrete pictures. Suppose a sensor sampled at interval $\Delta t$ reports the average of $w(t)$ over each interval, $w_k = \frac{1}{\Delta t}\int_{k\Delta t}^{(k+1)\Delta t} w(t)\,dt$. Then

$$
\operatorname{Var}(w_k) = \frac{1}{\Delta t^2}\int\!\!\int Q\,\delta(t - \tau)\,dt\,d\tau = \frac{Q\,\Delta t}{\Delta t^2} = \frac{Q}{\Delta t},
$$

and averages over non-overlapping intervals are uncorrelated because the delta never links two different intervals. So continuous white noise of strength $Q$, sampled at $f_s = 1/\Delta t$, is a discrete white sequence of variance

$$
\sigma_s^2 = \frac{Q}{\Delta t} = Q f_s, \qquad \sigma_s = \sqrt{Q}\,\sqrt{f_s}.
$$

The faster you sample, the noisier each sample is, but there are proportionally more of them and the noise per unit *time* stays fixed. That is the sense in which $Q$, not $\sigma_s$, is the physical parameter: the per-sample sigma changes when someone reconfigures the output rate, and $Q$ does not.

::: example From a datasheet noise density to a per-sample sigma
A MEMS gyro datasheet quotes a rate noise density of $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, so $Q = (0.005)^2 = 2.5 \times 10^{-5}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}$. Configured for a $100\,\mathrm{Hz}$ output, each sample carries white noise of standard deviation

$$
\sigma_s = 0.005 \times \sqrt{100} = 0.05\,^\circ/\mathrm{s}.
$$

At a $400\,\mathrm{Hz}$ output the per-sample sigma doubles to $0.1\,^\circ/\mathrm{s}$. Neither number is "the noise of the gyro"; both follow from the one number that is, and a simulation that hard-codes $0.05\,^\circ/\mathrm{s}$ will silently be wrong the day the sample rate changes. Simulate the density, and derive the sigma from the step size.
:::

::: warning
Manufacturers do not all use the same convention for "per root hertz". Some quote $\sqrt{Q}$ as defined here (in which case ARW in the next section is $60\sqrt{Q}$), others quote the square root of a one-sided spectral density, which is larger by $\sqrt{2}$. The two conventions differ by $41\%$ in sigma and a factor of two in variance, which is well within the range that changes a filter's tuning. When it matters, do not trust the datasheet arithmetic: measure the noise yourself from a static record, using the Allan deviation of the next lesson.
:::

## Random walk: integrating a white sequence

Integrate white noise and something new appears. In discrete time, let

$$
x_k = \sum_{i=0}^{k-1} w_i, \qquad x_{k+1} = x_k + w_k,
$$

a **random walk**: each step adds a fresh independent increment. Its mean is zero. Its variance, since the increments are uncorrelated and variances add, is

$$
\operatorname{Var}(x_k) = k\,\sigma_s^2, \qquad \sigma_{x_k} = \sigma_s\sqrt{k}.
$$

The standard deviation grows with the square root of the number of steps. The autocorrelation is $\mathbb{E}[x_j x_k] = \min(j, k)\,\sigma_s^2$, because $x_j$ and $x_k$ share exactly the first $\min(j, k)$ increments and the rest are uncorrelated with everything. This depends on $j$ and $k$ separately, not on their difference, so the random walk is not stationary. Its past never fades: an increment that entered at step $3$ is still fully present at step $3000$. That is the mechanism of unaided inertial drift.

## Brownian motion

Take the continuous-time version: integrate continuous white noise of strength $Q$,

$$
W(t) = \int_0^t w(s)\,ds.
$$

The result is **Brownian motion**, also called the **Wiener process** after Norbert Wiener, who made the mathematics rigorous; physicists met it first as the path of a pollen grain buffeted by water molecules, each collision an independent kick. Its properties follow directly from the definition of $w$. The mean is zero. The variance is

$$
\operatorname{Var}(W(t)) = \mathbb{E}\!\left[\int_0^t\!\!\int_0^t w(s)\,w(u)\,ds\,du\right] = \int_0^t\!\!\int_0^t Q\,\delta(s - u)\,ds\,du = Q\,t,
$$

the delta collapsing one integral. So

$$
\sigma_W(t) = \sqrt{Q\,t} = \sigma_w\sqrt{t}, \qquad \sigma_w = \sqrt{Q},
$$

which is the continuous form of $\sigma_s\sqrt{k}$; with $t = k\Delta t$ and $\sigma_s^2 = Q/\Delta t$ the two agree exactly. The autocorrelation is, by the same calculation with different limits,

$$
R_W(t, s) = \mathbb{E}[W(t)\,W(s)] = Q\,\min(t, s),
$$

so the correlation coefficient between $W(s)$ and $W(t)$ for $s < t$ is $Q s/\sqrt{Q s \cdot Q t} = \sqrt{s/t}$. Half-way through a record the process is already correlated $0.707$ with its final value.

Three further properties define Brownian motion for a mathematician and are worth knowing as an engineer. First, $W(0) = 0$. Second, it has **independent increments**: for non-overlapping intervals, $W(t_2) - W(t_1)$ and $W(t_4) - W(t_3)$ are independent, because they integrate the white noise over disjoint time spans. Third, each increment is Gaussian with variance proportional to its duration:

$$
W(t) - W(s) \sim \mathcal{N}\big(0,\ Q\,(t - s)\big).
$$

The Gaussianity is a central-limit statement: an increment is the sum of a huge number of tiny independent kicks. Its sample paths are continuous, since a small interval carries a small increment, but they are nowhere differentiable, since the increment over $\Delta t$ has size of order $\sqrt{\Delta t}$, and $\sqrt{\Delta t}/\Delta t \to \infty$. The velocity of a Brownian path does not exist, which is another way of saying white noise, its formal derivative, is not a real function.

::: key
An integrated white noise, a random walk, has standard deviation $\sigma(t) = \sigma_w\sqrt{t}$, where $\sigma_w = \sqrt{Q}$ is the white-noise strength. Doubling the time increases the uncertainty by only $\sqrt{2}$, but the growth never stops, which is why inertial navigation must be aided.
:::

The third property is also the recipe for simulating it. Over a step $\Delta t$ the process gains an independent $\mathcal{N}(0, Q\,\Delta t)$ increment, so

```python
import numpy as np

rng = np.random.default_rng(0)
Q, dt, n_steps, n_paths = 0.01, 1.0, 600, 20_000   # m^2/s, s
dW = np.sqrt(Q * dt) * rng.standard_normal((n_paths, n_steps))
W = np.cumsum(dW, axis=1)                          # Brownian paths, W(0) = 0 omitted
print(W[:, -1].std())        # ~2.45  (theory: sqrt(Q * 600) = 2.449 m)
print(W[:, 299].std())       # ~1.73  (theory: sqrt(Q * 300) = 1.732 m)
```

The increment scales as $\sqrt{Q\,\Delta t}$, not $Q\,\Delta t$. Writing `Q * dt` where `sqrt(Q * dt)` belongs is the single most common error in noise simulation, and it produces a walk whose variance is wrong by a factor of $Q\,\Delta t$, which for small $Q$ and $\Delta t$ can be many orders of magnitude.

::: example A wandering altimeter bias
A barometric altimeter's bias is modelled as Brownian motion with $Q = 0.01\,\mathrm{m^2/s}$, that is $\sigma_w = 0.1\,\mathrm{m}/\sqrt{\mathrm{s}}$. Starting from a calibrated zero, the bias standard deviation after one minute is $\sqrt{0.01 \times 60} = 0.775\,\mathrm{m}$, after ten minutes $\sqrt{0.01 \times 600} = 2.45\,\mathrm{m}$, and after an hour $\sqrt{0.01 \times 3600} = 6.0\,\mathrm{m}$. Ten minutes in, the probability that the bias has wandered more than $5\,\mathrm{m}$ from zero is $2\big(1 - \Phi(5/2.449)\big) = 2\big(1 - \Phi(2.04)\big) = 0.041$, about one flight in twenty-five. The covariance between the bias at $300\,\mathrm{s}$ and at $600\,\mathrm{s}$ is $Q\min(300, 600) = 3.0\,\mathrm{m^2}$, a correlation coefficient of $\sqrt{300/600} = 0.707$: the second half of the record inherits the whole of the first half's excursion and merely adds to it.
:::

## Angle random walk

Here is where the two ideas meet a real sensor. A gyro measures angular rate $\omega$. Its output is the true rate plus, among other errors, white noise: $\tilde{\omega} = \omega + w$, with $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$. An attitude algorithm integrates rate to get angle. The integrated noise is therefore Brownian motion, and the attitude error it causes grows as

$$
\sigma_\theta(t) = \sqrt{Q}\,\sqrt{t}.
$$

Gyro manufacturers call $\sqrt{Q}$ the **angle random walk** (ARW) coefficient and quote it in $^\circ/\sqrt{\mathrm{h}}$: the attitude error, in degrees, accumulated from white rate noise in one hour. The conversion from a rate noise density in $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ is a matter of units. Since $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}} = {}^\circ/\mathrm{s} \cdot \sqrt{\mathrm{s}} = {}^\circ/\sqrt{\mathrm{s}}$, and $\sqrt{\mathrm{h}} = \sqrt{3600}\,\sqrt{\mathrm{s}} = 60\sqrt{\mathrm{s}}$,

$$
\mathrm{ARW}\,[^\circ/\sqrt{\mathrm{h}}] = 60 \times \text{noise density}\,[^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}].
$$

The same physics under a different name applies to accelerometers: white acceleration noise integrates to a **velocity random walk** (VRW), quoted in $\mathrm{m/s}/\sqrt{\mathrm{h}}$ and obtained from the density in $\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}$ by the same factor of $60$. Integrate once more and the position error grows faster than $\sqrt{t}$. Position is the integral of Brownian motion, $p(t) = \int_0^t W(s)\,ds$, and its variance is

$$
\operatorname{Var}(p(t)) = \int_0^t\!\!\int_0^t Q\min(s, u)\,ds\,du = 2Q\int_0^t\!\!\int_0^u s\,ds\,du = 2Q\int_0^t \frac{u^2}{2}\,du = \frac{Q\,t^3}{3},
$$

so $\sigma_p(t) = \sqrt{Q}\,t^{3/2}/\sqrt{3}$: the position error from accelerometer white noise grows as the three-halves power of time.

::: key
Angle random walk specifies the random-walk growth of attitude error from white gyro rate noise, quoted in $^\circ/\sqrt{\mathrm{h}}$; equivalently it is the square root of the rate noise PSD, and $\mathrm{ARW}\,[^\circ/\sqrt{\mathrm{h}}] = 60 \times$ density $[^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}]$. Attitude error grows as $\sigma_\theta = \mathrm{ARW}\cdot\sqrt{t}$.
:::

::: example Attitude error from angle random walk
Return to the gyro with rate noise density $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. Its ARW is $60 \times 0.005 = 0.3\,^\circ/\sqrt{\mathrm{h}}$, a typical figure for a good MEMS or a low-end fibre-optic gyro. During a $600\,\mathrm{s}$ coast with no attitude reference, the accumulated attitude error from this term alone is

$$
\sigma_\theta = 0.3\,^\circ/\sqrt{\mathrm{h}} \times \sqrt{600/3600\,\mathrm{h}} = 0.3 \times 0.408 = 0.122^\circ,
$$

or, in seconds and degrees per root second, $0.005 \times \sqrt{600} = 0.122^\circ$, the same thing. After one minute it is $0.0387^\circ$; after a full hour, $0.3^\circ$ by definition. Now check against the sampled picture: at $100\,\mathrm{Hz}$ each sample has $\sigma_s = 0.05\,^\circ/\mathrm{s}$ and contributes an angle increment of $0.05 \times 0.01 = 5 \times 10^{-4}\,^\circ$; over $60\,000$ samples the random walk reaches $5 \times 10^{-4} \times \sqrt{60\,000} = 0.122^\circ$. The continuous and discrete calculations agree, as they must.
:::

::: example Accelerometer noise into position
An accelerometer with a noise density of $100\,\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$ has $\sqrt{Q} = 100 \times 10^{-6} \times 9.80665 = 9.81 \times 10^{-4}\,\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}$, a VRW of $60 \times 9.81 \times 10^{-4} = 0.0588\,\mathrm{m/s}/\sqrt{\mathrm{h}}$. Over a $60\,\mathrm{s}$ unaided interval the velocity error from this term is $9.81 \times 10^{-4} \times \sqrt{60} = 7.60 \times 10^{-3}\,\mathrm{m/s}$, and the position error is $9.81 \times 10^{-4} \times 60^{3/2}/\sqrt{3} = 0.263\,\mathrm{m}$. Over $600\,\mathrm{s}$ the velocity error grows by $\sqrt{10}$ to $0.0240\,\mathrm{m/s}$, but the position error grows by $10^{3/2} = 31.6$ to $8.32\,\mathrm{m}$. A $20\,000$-path simulation of the double integral at $\Delta t = 0.1\,\mathrm{s}$ returns a $60\,\mathrm{s}$ position sigma of $0.262\,\mathrm{m}$ against the theoretical $0.263\,\mathrm{m}$. White accelerometer noise is rarely the dominant position error over minutes, though; the bias terms of the next lesson, which grow as $t^2$, overtake it quickly.
:::

## What white noise and random walk cannot model

Between the two processes of this lesson lies a gap. White noise forgets everything instantly; the random walk forgets nothing, ever. Real sensor biases do neither. A gyro bias wanders, but it wanders around a value it returns to, driven by temperature, mechanical stress and electronics whose fluctuations are correlated over seconds to hours and then decorrelate. Modelled as white noise, the bias would average away in a second, which it does not; modelled as a random walk, its uncertainty would grow without bound over a long mission, which it also does not. The **first-order Gauss-Markov process** of the next lesson is the process with a finite, tunable memory: a white noise input pulling against a restoring force, with an autocorrelation that decays as $e^{-|\tau|/T}$ and a variance that saturates. It reduces to a random walk when $T \to \infty$ and to white noise when $T \to 0$, so it contains both of this lesson's processes as limits, and it is the model the module's gyro bias objective asks you to build.

::: warning
The random-walk law $\sigma \propto \sqrt{t}$ holds for the integral of *white* noise only. Integrating a constant bias $b$ gives an error $b\,t$ that grows linearly, and integrating a slowly varying bias gives something between linear and square-root growth. A datasheet's ARW figure therefore bounds only one part of the attitude error; over any coast longer than a few tens of seconds, the bias terms dominate, and using ARW alone to size an attitude error budget understates it badly.
:::

## Check yourself

::: check
A gyro has $\mathrm{ARW} = 0.2\,^\circ/\sqrt{\mathrm{h}}$. What is its rate noise density in $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, and what attitude error does white rate noise produce over a $90\,\mathrm{s}$ coast?
:::

::: answer
Dividing by $60$, the density is $0.2/60 = 3.33 \times 10^{-3}\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. Over $90\,\mathrm{s} = 0.025\,\mathrm{h}$ the random walk reaches $\sigma_\theta = 0.2 \times \sqrt{0.025} = 0.0316^\circ$. Equivalently $3.33 \times 10^{-3} \times \sqrt{90} = 0.0316^\circ$. The two routes must agree; if they do not, a unit conversion has gone wrong.
:::

::: check
A random-walk error has standard deviation $2\,\mathrm{m}$ after $100\,\mathrm{s}$. What is its noise strength $Q$, and what is the standard deviation after $400\,\mathrm{s}$ and after $25\,\mathrm{s}$?
:::

::: answer
From $\sigma^2 = Q\,t$, $Q = 4/100 = 0.04\,\mathrm{m^2/s}$. After $400\,\mathrm{s}$, $\sigma = \sqrt{0.04 \times 400} = 4\,\mathrm{m}$: four times the duration, twice the error. After $25\,\mathrm{s}$, $\sigma = \sqrt{0.04 \times 25} = 1\,\mathrm{m}$. The square-root law means the error you see at one duration scales to any other by the square root of the ratio of durations.
:::

::: check
An accelerometer sampled at $200\,\mathrm{Hz}$ shows white noise with a per-sample standard deviation of $0.02\,\mathrm{m/s^2}$. Find its noise density in $\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$ and its velocity random walk in $\mathrm{m/s}/\sqrt{\mathrm{h}}$.
:::

::: answer
The per-sample variance is $Q f_s$, so $\sqrt{Q} = \sigma_s/\sqrt{f_s} = 0.02/\sqrt{200} = 1.41 \times 10^{-3}\,\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}$. In micro-$g$, divide by $9.80665 \times 10^{-6}$: $144\,\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$. The VRW is $60 \times 1.41 \times 10^{-3} = 0.0849\,\mathrm{m/s}/\sqrt{\mathrm{h}}$. Halving the sample rate to $100\,\mathrm{Hz}$ would reduce the per-sample sigma to $0.0141\,\mathrm{m/s^2}$ without changing either of these figures.
:::

::: check
For Brownian motion $W(t)$ with strength $Q$, what is the correlation coefficient between $W(100)$ and $W(900)$? Why is this process not wide-sense stationary?
:::

::: answer
$\operatorname{Cov}(W(100), W(900)) = Q\min(100, 900) = 100Q$, and the standard deviations are $\sqrt{100Q}$ and $\sqrt{900Q}$, so $\rho = 100Q/\sqrt{100Q \times 900Q} = \sqrt{100/900} = 1/3$. The process fails stationarity twice: its variance $Qt$ changes with time, and its autocorrelation $Q\min(t, s)$ depends on the two instants themselves rather than on their separation. Shift the pair $(100, 900)$ to $(1100, 1900)$, the same separation, and the covariance changes from $100Q$ to $1100Q$.
:::

::: check
A colleague simulates gyro noise at $\Delta t = 0.01\,\mathrm{s}$ with the line `w = Q * rng.standard_normal()`, where `Q` holds the noise strength in $(^\circ/\mathrm{s})^2/\mathrm{Hz}$, and integrates the result for angle. By what factor is the simulated attitude random walk wrong for the $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ gyro?
:::

::: answer
The correct per-sample rate sigma is $\sqrt{Q/\Delta t} = \sqrt{2.5 \times 10^{-5}/0.01} = 0.05\,^\circ/\mathrm{s}$. The code uses $Q = 2.5 \times 10^{-5}\,^\circ/\mathrm{s}$ instead, smaller by a factor of $0.05/2.5 \times 10^{-5} = 2000$. The integrated angle error is linear in the per-sample sigma, so the simulated random walk is $2000$ times too small: $0.122^\circ$ after ten minutes becomes $6 \times 10^{-5}\,^\circ$, and any filter tuned against this simulation will be wildly over-confident on the real sensor.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $X(t)$, realisation, ensemble | Random process: a random variable at every instant, a function of time for every outcome |
| $R_X(t_1, t_2) = \mathbb{E}[X(t_1)X(t_2)]$ | Autocorrelation function; $R_X(t, t)$ is the mean-square value |
| WSS: $m_X$ constant, $R_X(t_1, t_2) = R_X(\tau)$ | Wide-sense stationary; $R_X$ even, maximal at $\tau = 0$ |
| $\mathbb{E}[w_j w_k] = \sigma_s^2\,\delta_{jk}$ | Discrete white sequence |
| $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$ | Continuous white noise of strength $Q$, units $(\text{unit})^2/\mathrm{Hz}$ |
| $\sigma_s^2 = Q/\Delta t = Q f_s$ | Per-sample variance of sampled white noise |
| $x_{k+1} = x_k + w_k$, $\operatorname{Var}(x_k) = k\sigma_s^2$ | Discrete random walk |
| $W(t) = \int_0^t w\,ds$, $\operatorname{Var} = Qt$, $\sigma(t) = \sigma_w\sqrt{t}$ | Brownian motion (Wiener process), $\sigma_w = \sqrt{Q}$ |
| $R_W(t, s) = Q\min(t, s)$, $\rho = \sqrt{s/t}$ | Brownian autocorrelation; not stationary |
| $W(t) - W(s) \sim \mathcal{N}(0, Q(t - s))$ | Independent Gaussian increments; simulate with $\sqrt{Q\,\Delta t}\,z$ |
| $\mathrm{ARW} = 60 \times$ density, $\sigma_\theta = \mathrm{ARW}\sqrt{t}$ | Angle random walk, $^\circ/\sqrt{\mathrm{h}}$ from $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ |
| $\sigma_p(t) = \sqrt{Q}\,t^{3/2}/\sqrt{3}$ | Position error from white acceleration noise |

The next lesson adds the restoring force that white noise and random walk both lack, derives the first-order Gauss-Markov process and its exact discrete-time form, and uses angle random walk together with bias instability to build the complete gyro and accelerometer error model that every inertial navigation filter carries.
