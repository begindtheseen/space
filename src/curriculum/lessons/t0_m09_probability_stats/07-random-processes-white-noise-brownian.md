---
id: l07-random-processes-white-noise-brownian
title: Random processes, white noise and Brownian motion
minutes: 26
covers:
  - stochastic processes and Brownian motion
  - white noise, random walk, Gauss-Markov processes
---

Until now, every noisy quantity in this module has been one random number. A gyro does not give you one number. It gives you a stream — hundreds of numbers every second, for the whole flight. The question that decides whether a navigation system works is not only "how big is each error?" but "how do the errors at different times relate to each other?"

Imagine two gyros whose single readings look equally noisy. In the first, every reading's error is brand new, like a fresh coin flip, so averaging many readings cancels it. In the second, the error hangs around for minutes, like a kitchen scale that reads two grams heavy all morning, and averaging does nothing. Over a ten-minute coast, those two gyros behave completely differently.

This lesson gives you the language for a quantity that is random at every instant, and builds the two noise types every sensor error model is made from: **white noise**, whose values at different moments have nothing to do with each other, and its running total, the **random walk**, called **Brownian motion** in continuous time. The gyro spec called *angle random walk* is exactly this pair; by the end you will turn it into an attitude error for any coast time.

## What a random process is

Record a sensor's output for ten seconds and you get a wiggly line: a function of time. Do the same with a thousand identical sensors and you get a thousand different wiggly lines.

A **random process** $X(t)$ (also called a **[[stochastic process|stochastic]]**) is the rule that gives probabilities to all those lines. You can look at it two ways:

- Freeze the time at some instant $t$. Across all the sensors, $X(t)$ is an ordinary random variable, with a mean and a variance like any from earlier lessons.
- Freeze the sensor. Its line, $X(\cdot)$, is an ordinary function of time. One such line is a **realization** (also called a **sample path**). The whole collection of possible lines is the **[[ensemble|ensemble]]**.

A complete description would give the joint distribution of the values at every set of instants — far too much to handle, and for Gaussian noise not needed, because a joint Gaussian is fixed by its means and covariances. So engineers work with two summaries:

$$
m_X(t) = \mathbb{E}[X(t)], \qquad
R_X(t_1, t_2) = \mathbb{E}[X(t_1)\,X(t_2)].
$$

Read $\mathbb{E}[\cdot]$ as "the expected value of" — the average over the whole ensemble. The first is the **mean function**. The second, $R_X$ (read "R sub X"), is the **autocorrelation function**: the average product of the value at time $t_1$ and the value at time $t_2$. It answers "if I know the value now, how well can I guess it later?" With the means subtracted first it is the **autocovariance**; for the zero-mean noise models of this module the two are the same. Setting $t_1 = t_2 = t$ gives $R_X(t, t) = \mathbb{E}[X(t)^2]$, which for a zero-mean process is the variance.

### Stationary processes

Think about the weather. Hot at noon means probably still hot at 1 p.m., but says almost nothing about noon a month from now. And that pattern — one hour apart, strongly linked; one month apart, barely linked — is the same in any week you pick. The statistics do not care what the date is.

A process like that is **wide-sense stationary** (WSS): its mean is constant, and its autocorrelation depends only on the gap $\tau$ (the Greek letter "tau") between the two times, $\tau = t_2 - t_1$:

$$
m_X(t) = m_X, \qquad R_X(t_1, t_2) = R_X(\tau).
$$

A stationary autocorrelation is **even**, $R_X(-\tau) = R_X(\tau)$, because the product does not care which time comes first. And it is largest at zero gap, $|R_X(\tau)| \leq R_X(0)$ — nothing predicts a value better than the value itself (the precise reason is the Cauchy–Schwarz inequality). The width of the autocorrelation is the **correlation time**: the gap beyond which one value tells you little about the other. White noise has correlation time zero. A slowly wandering sensor bias has one of minutes or hours. A random walk, as you will see, is not stationary at all.

::: note Averages over time versus averages over the ensemble
The definitions average across the ensemble — many sensors at one instant. A bench test can only average along one long record. A process where the two give the same answer is called **ergodic**. Steady noise from a well-behaved sensor is treated as ergodic, and every noise number read off a bench record rests on that. A record with a warm-up transient or a temperature ramp is not stationary, so its time averages estimate nothing well defined: trim it first.
:::

## White noise in discrete time

Start with what a sampled sensor actually produces: one number per tick. A **white sequence** $w_k$ (read "w sub k", the $k$-th sample, $k = 0, 1, 2, \ldots$) is a list of zero-mean random numbers, each with variance $\sigma_s^2$ ("sigma sub s squared", the per-sample variance), none correlated with any other:

$$
\mathbb{E}[w_k] = 0, \qquad \mathbb{E}[w_j w_k] = \sigma_s^2\,\delta_{jk}.
$$

The **Kronecker delta** $\delta_{jk}$ ("delta j k") is $1$ when $j = k$ and $0$ otherwise, so the autocorrelation is a single spike at zero gap. If the samples are also jointly Gaussian, "uncorrelated" upgrades to "independent": each sample is a fresh draw from $\mathcal{N}(0, \sigma_s^2)$ that owes nothing to the ones before. That is **Gaussian white noise** — the hiss on an untuned radio, in number form. It is what earlier lessons assumed when they said the mean of $N$ samples has standard error $\sigma_s/\sqrt{N}$.

The name is borrowed from light. Sunlight mixes every color at about the same strength and looks **[[white|white-name]]**. A white sequence mixes every frequency at the same strength — a statement the spectral-density lesson makes exact.

## White noise in continuous time

Sensor electronics run in continuous time, and the equations a navigation filter integrates are differential equations. So we need a continuous version. Continuous **white noise** $w(t)$ is defined by

$$
\mathbb{E}[w(t)] = 0, \qquad \mathbb{E}[w(t)\,w(\tau)] = Q\,\delta(t - \tau).
$$

Here $\delta$ is the **[[Dirac delta|dirac-delta]]** — an infinitely tall, infinitely thin spike at zero whose area is exactly $1$. The number $Q$ is the **noise strength**, also called the **spectral density**. For a vector of noises the number becomes a matrix: $\mathbb{E}[\mathbf{w}(t)\mathbf{w}(\tau)^{\mathsf{T}}] = \mathbf{Q}\,\delta(t - \tau)$. The definition says that the values at *any* two different instants, however close, are uncorrelated.

**Units.** The delta has units of $1/\mathrm{s}$, because it integrates over time to the pure number $1$. So if $w$ is a rate in $\mathrm{rad/s}$, then $Q$ has units $(\mathrm{rad/s})^2 \cdot \mathrm{s} = (\mathrm{rad/s})^2/\mathrm{Hz}$. That is why datasheets quote noise "per root hertz". The square root, $\sqrt{Q}$, is the **noise density**, in $\mathrm{rad/s}/\sqrt{\mathrm{Hz}}$ — or, on a gyro datasheet, $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, and for an accelerometer $\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$ (millionths of standard gravity per root hertz).

**Variance.** Put $\tau = t$: $\mathbb{E}[w(t)^2] = Q\,\delta(0) = \infty$. Continuous white noise has infinite variance and infinite power. No real signal does. So $w(t)$ is an idealization, like the delta itself, and it only makes sense inside an integral.

It is still the right idealization. Any real noise whose correlation time is far shorter than anything the system responds to acts exactly like white noise. A gyro's electronic noise forgets itself in microseconds; a navigation filter cares about minutes. To the filter, that noise is white.

::: key
White noise is zero-mean with a flat power spectral density and autocorrelation $\mathbb{E}[w(t)w(\tau)^{\mathsf{T}}] = \mathbf{Q}\,\delta(t - \tau)$: uncorrelated between any two distinct instants. It is a mathematical idealization with infinite power, physically unrealizable, and it becomes a well-defined quantity only once it is integrated or filtered.
:::

### From continuous noise to samples

Integrating is what makes white noise usable, and it links the continuous and the sampled pictures. Suppose a sensor sampled every $\Delta t$ seconds reports the average of $w(t)$ over each interval:

$$
w_k = \frac{1}{\Delta t}\int_{k\Delta t}^{(k+1)\Delta t} w(t)\,dt.
$$

Its variance is a double integral of the autocorrelation. The delta collapses one of the integrals, leaving the interval length:

$$
\operatorname{Var}(w_k) = \frac{1}{\Delta t^2}\int\!\!\int Q\,\delta(t - \tau)\,dt\,d\tau = \frac{Q\,\Delta t}{\Delta t^2} = \frac{Q}{\Delta t}.
$$

Averages over different intervals are uncorrelated, because the delta never links two different intervals. So continuous white noise of strength $Q$, sampled at rate $f_s = 1/\Delta t$, becomes a white sequence with

$$
\sigma_s^2 = \frac{Q}{\Delta t} = Q f_s, \qquad \sigma_s = \sqrt{Q}\,\sqrt{f_s}.
$$

Sample faster and each sample gets noisier, but you get proportionally more samples, and the noise per unit of *time* stays the same. That is why $Q$, not $\sigma_s$, is the real physical property of the sensor: the per-sample sigma changes whenever someone changes the output rate, and $Q$ does not.

::: example From a datasheet noise density to a per-sample sigma
A MEMS gyro datasheet gives a rate noise density of $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. Square it for the strength:

$$
Q = (0.005)^2 = 2.5 \times 10^{-5}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}.
$$

Set the gyro to output at $100\,\mathrm{Hz}$. Multiply the density by the square root of the rate:

$$
\sigma_s = 0.005 \times \sqrt{100} = 0.005 \times 10 = 0.05\,^\circ/\mathrm{s}.
$$

At $400\,\mathrm{Hz}$ the square root is $20$, so $\sigma_s = 0.1\,^\circ/\mathrm{s}$: four times the rate, twice the per-sample noise. Neither number is "the noise of the gyro"; both come from the one number that is. A simulation that hard-codes $0.05\,^\circ/\mathrm{s}$ will be silently wrong the day the sample rate changes. Simulate the density, and work out the sigma from the time step.
:::

::: warning
Not every manufacturer means the same thing by "per root hertz". Some quote $\sqrt{Q}$ as defined here (then the angle random walk below is $60\sqrt{Q}$). Others quote the square root of a *one-sided* spectral density, larger by $\sqrt{2}$: a $41\%$ difference in sigma, a factor of two in variance, enough to change a filter's tuning. When it matters, measure the noise yourself from a record of the sensor sitting still, using the Allan deviation of the next lesson.
:::

## Random walk: adding up white noise

Now add white noise up. Picture a walker who, every second, flips a coin and steps left or right. After a hundred steps she is probably not far from the start — but probably not *at* it either, and the longer she walks, the farther she tends to wander.

In symbols, let each step be a white-sequence sample $w_i$ and keep a running total:

$$
x_k = \sum_{i=0}^{k-1} w_i, \qquad x_{k+1} = x_k + w_k.
$$

Read $\sum$ as "add up". This is a **random walk**: each step adds a fresh, independent kick. Its mean is zero. Its variance grows, because the kicks are uncorrelated and variances of uncorrelated things add:

$$
\operatorname{Var}(x_k) = k\,\sigma_s^2, \qquad \sigma_{x_k} = \sigma_s\sqrt{k}.
$$

The spread grows with the **[[square root of the number of steps|sqrt-growth]]**: four times as many steps, twice the spread.

The autocorrelation is $\mathbb{E}[x_j x_k] = \min(j, k)\,\sigma_s^2$, because $x_j$ and $x_k$ share exactly the first $\min(j, k)$ kicks ("the smaller of $j$ and $k$") and every other kick is uncorrelated with everything. That depends on $j$ and $k$ themselves, not only on the gap between them — so the random walk is **not stationary**. Its past never fades: a kick that went in at step $3$ is still fully there at step $3000$. That is the mechanism behind the drift of an **[[unaided|aiding]]** inertial navigator.

## Brownian motion

Now the continuous version. Integrate continuous white noise of strength $Q$:

$$
W(t) = \int_0^t w(s)\,ds.
$$

The result is **Brownian motion**, also called the **Wiener process**, named for the jittery dance of tiny particles in water shoved by countless molecules — a **[[story that helped prove atoms exist|brownian-history]]**.

The mean is zero. For the variance, write $W(t)^2$ as a double integral, take the expectation inside, and let the delta collapse one integral:

$$
\operatorname{Var}(W(t)) = \mathbb{E}\!\left[\int_0^t\!\!\int_0^t w(s)\,w(u)\,ds\,du\right] = \int_0^t\!\!\int_0^t Q\,\delta(s - u)\,ds\,du = Q\,t.
$$

So

$$
\sigma_W(t) = \sqrt{Q\,t} = \sigma_w\sqrt{t}, \qquad \sigma_w = \sqrt{Q}.
$$

This is the continuous twin of the sampled walk. Check it: with samples, the integral becomes the sum $\sum w_k\,\Delta t$ — each sample times the time it lasts. That sum has $k = t/\Delta t$ terms, each of variance $\sigma_s^2\,\Delta t^2 = (Q/\Delta t)\,\Delta t^2 = Q\,\Delta t$. Adding $k$ of them gives $k\,Q\,\Delta t = Q\,t$. The two pictures agree exactly.

The same calculation with different limits gives the autocorrelation:

$$
R_W(t, s) = \mathbb{E}[W(t)\,W(s)] = Q\,\min(t, s).
$$

So for $s < t$ the correlation coefficient between $W(s)$ and $W(t)$ is $Qs/\sqrt{Qs \cdot Qt} = \sqrt{s/t}$. Halfway through a record, the process is already correlated $\sqrt{1/2} = 0.707$ with its final value.

Mathematicians define Brownian motion by three properties:

1. It starts at zero: $W(0) = 0$.
2. It has **independent increments**: the change over one time interval is independent of the change over any non-overlapping interval, because the two integrate white noise over separate stretches of time.
3. Each change is Gaussian, with variance proportional to how long it lasts:

$$
W(t) - W(s) \sim \mathcal{N}\big(0,\ Q\,(t - s)\big).
$$

Read "$\sim$" as "is distributed as". The Gaussian shape is the central limit theorem from the last lesson at work: each increment is the sum of a huge number of tiny independent kicks.

The paths are continuous — a short interval carries a small change — but nowhere smooth. The change over a step $\Delta t$ is about $\sqrt{\Delta t}$ in size, so the slope is about $\sqrt{\Delta t}/\Delta t = 1/\sqrt{\Delta t}$, which blows up as $\Delta t$ shrinks. A Brownian path has no velocity — another way of saying that white noise, its would-be derivative, is not a real function.

::: key
An integrated white noise, a random walk, has standard deviation $\sigma(t) = \sigma_w\sqrt{t}$, where $\sigma_w = \sqrt{Q}$ is the white-noise strength. Doubling the time increases the uncertainty by only $\sqrt{2}$, but the growth never stops, which is why inertial navigation must be aided.
:::

Property 3 is also the recipe for simulating it: over each step $\Delta t$, add an independent $\mathcal{N}(0, Q\,\Delta t)$ draw.

```python
import numpy as np

rng = np.random.default_rng(0)
Q, dt, n_steps, n_paths = 0.01, 1.0, 600, 20_000   # m^2/s, s
dW = np.sqrt(Q * dt) * rng.standard_normal((n_paths, n_steps))
W = np.cumsum(dW, axis=1)                          # Brownian paths, W(0) = 0 omitted
print(round(W[:, -1].std(), 2))   # 2.44  (theory: sqrt(Q * 600) = 2.449 m)
print(round(W[:, 299].std(), 2))  # 1.73  (theory: sqrt(Q * 300) = 1.732 m)
```

::: warning
The step is `np.sqrt(Q * dt)`, not `Q * dt`. Mixing these up is the most common error in noise simulation, and for small $Q$ and $\Delta t$ it is wrong by orders of magnitude. It is the *variance* of a step that grows with $\Delta t$, so its standard deviation grows with the square root.
:::

::: example A wandering altimeter bias
A barometric altimeter's bias is modeled as Brownian motion with $Q = 0.01\,\mathrm{m^2/s}$, so $\sigma_w = \sqrt{0.01} = 0.1\,\mathrm{m}/\sqrt{\mathrm{s}}$. It starts from a calibrated zero.

- after one minute: $\sqrt{0.01 \times 60} = \sqrt{0.6} = 0.775\,\mathrm{m}$;
- after ten minutes: $\sqrt{0.01 \times 600} = \sqrt{6} = 2.45\,\mathrm{m}$;
- after an hour: $\sqrt{0.01 \times 3600} = \sqrt{36} = 6.0\,\mathrm{m}$.

Sanity check: ten times the time gave $\sqrt{10} = 3.16$ times the spread ($0.775 \to 2.45$). Good.

What is the chance that, ten minutes in, the bias has wandered more than $5\,\mathrm{m}$ either way? Divide by the sigma: $5/2.449 = 2.04$ standard deviations. Both tails together: $2\big(1 - \Phi(2.04)\big) = 0.041$, where $\Phi$ is the standard normal CDF. That is about one flight in twenty-five.

Finally, the covariance of the bias at $300\,\mathrm{s}$ and at $600\,\mathrm{s}$ is $Q\min(300, 600) = 0.01 \times 300 = 3.0\,\mathrm{m^2}$, and the correlation is $\sqrt{300/600} = 0.707$. The second half of the flight inherits the whole of the first half's wander and adds its own on top.
:::

## Angle random walk

Now a real sensor. A gyro measures turn rate $\omega$ (the Greek letter "omega"). Its output is the true rate plus, among other errors, white noise: $\tilde{\omega} = \omega + w$, with $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$. The tilde (the squiggle on top) marks "measured". The attitude software integrates rate to get angle. So the integrated noise is Brownian motion, and the attitude error it causes grows as

$$
\sigma_\theta(t) = \sqrt{Q}\,\sqrt{t}.
$$

Gyro makers call $\sqrt{Q}$ the **angle random walk** (ARW) coefficient, quoted in $^\circ/\sqrt{\mathrm{h}}$ ("degrees per root hour"): the attitude error, in degrees, that white rate noise builds up in one hour.

Converting from a rate noise density is only units: $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ is the same as $^\circ/\mathrm{s} \cdot \sqrt{\mathrm{s}} = {}^\circ/\sqrt{\mathrm{s}}$, because a hertz is $1/\mathrm{s}$. And one root hour is $\sqrt{3600\,\mathrm{s}} = 60\sqrt{\mathrm{s}}$. So

$$
\mathrm{ARW}\,[^\circ/\sqrt{\mathrm{h}}] = 60 \times \text{noise density}\,[^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}].
$$

::: key
Angle random walk specifies the random-walk growth of attitude error from white gyro rate noise, quoted in $^\circ/\sqrt{\mathrm{h}}$; equivalently it is the square root of the rate noise PSD, and $\mathrm{ARW}\,[^\circ/\sqrt{\mathrm{h}}] = 60 \times$ density $[^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}]$. Attitude error grows as $\sigma_\theta = \mathrm{ARW}\cdot\sqrt{t}$.
:::

Accelerometers have the same physics: white acceleration noise integrates into a **velocity random walk** (VRW), quoted in $\mathrm{m/s}/\sqrt{\mathrm{h}}$, and found from the density in $\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}$ by the same factor of $60$.

Integrate once more, from velocity to position, and the growth is faster than $\sqrt{t}$. Position is the integral of Brownian motion, $p(t) = \int_0^t W(s)\,ds$. Its variance is a double integral of $Q\min(s, u)$:

$$
\operatorname{Var}(p(t)) = \int_0^t\!\!\int_0^t Q\min(s, u)\,ds\,du = 2Q\int_0^t\!\!\int_0^u s\,ds\,du = 2Q\int_0^t \frac{u^2}{2}\,du = \frac{Q\,t^3}{3}.
$$

(The factor $2$ appears because the square splits into two equal triangles, $s < u$ and $s > u$.) So $\sigma_p(t) = \sqrt{Q}\,t^{3/2}/\sqrt{3}$: position error from accelerometer white noise grows as time to the power three-halves.

::: example Attitude error from angle random walk
Take the gyro with rate noise density $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ again. Its ARW is

$$
60 \times 0.005 = 0.3\,^\circ/\sqrt{\mathrm{h}},
$$

a typical figure for a good **[[MEMS or a low-end fiber-optic gyro|gyro-types]]**. During a $600\,\mathrm{s}$ coast with no attitude reference, $600\,\mathrm{s} = 600/3600 = 1/6\,\mathrm{h}$, so

$$
\sigma_\theta = 0.3 \times \sqrt{1/6} = 0.3 \times 0.408 = 0.122^\circ.
$$

Same thing in seconds: $0.005 \times \sqrt{600} = 0.005 \times 24.5 = 0.122^\circ$. After one minute it is $0.005 \times \sqrt{60} = 0.0387^\circ$. After a full hour it is $0.3^\circ$, by the definition of ARW.

Now check with the sampled picture. At $100\,\mathrm{Hz}$ each sample has $\sigma_s = 0.05\,^\circ/\mathrm{s}$ and lasts $0.01\,\mathrm{s}$, so it adds an angle step of sigma $0.05 \times 0.01 = 5 \times 10^{-4}\,^\circ$. Ten minutes is $60\,000$ samples, so the walk reaches $5 \times 10^{-4} \times \sqrt{60\,000} = 5 \times 10^{-4} \times 245 = 0.122^\circ$. The continuous and sampled calculations agree, as they must.
:::

::: example Accelerometer noise into position
An accelerometer has a noise density of $100\,\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$. Convert to SI with $g_0 = 9.80665\,\mathrm{m/s^2}$:

$$
\sqrt{Q} = 100 \times 10^{-6} \times 9.80665 = 9.81 \times 10^{-4}\,\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}.
$$

Its VRW is $60 \times 9.81 \times 10^{-4} = 0.0588\,\mathrm{m/s}/\sqrt{\mathrm{h}}$.

Over a $60\,\mathrm{s}$ unaided stretch:

- velocity error: $\sqrt{Q}\sqrt{t} = 9.81 \times 10^{-4} \times \sqrt{60} = 7.60 \times 10^{-3}\,\mathrm{m/s}$;
- position error: $\sqrt{Q}\,t^{3/2}/\sqrt{3} = 9.81 \times 10^{-4} \times 465 / 1.732 = 0.263\,\mathrm{m}$.

Over $600\,\mathrm{s}$ — ten times longer — velocity grows by $\sqrt{10}$ to $0.0240\,\mathrm{m/s}$, but position grows by $10^{3/2} = 31.6$ to $8.32\,\mathrm{m}$. A $20\,000$-path simulation of the double integral at $\Delta t = 0.1\,\mathrm{s}$ gives a $60\,\mathrm{s}$ position sigma of $0.263\,\mathrm{m}$, matching the formula. Still, over minutes the bias terms of the next lesson, which grow as $t^2$, overtake this quickly.
:::

## What white noise and random walk cannot model

Between this lesson's two processes lies a gap. White noise forgets everything instantly. A random walk forgets nothing, ever. Real sensor biases do neither. A gyro bias wanders, but around a value it keeps coming back to, pushed by temperature, mechanical stress and electronics that change over seconds to hours.

Modeled as white noise, the bias would average away in a second. Modeled as a random walk, its uncertainty would grow without limit over a long mission. It does neither. The **first-order Gauss-Markov process** of the next lesson has a finite memory you can set: white noise pushing against a restoring pull. Its autocorrelation fades as $e^{-|\tau|/T}$ and its variance levels off. It becomes a random walk when $T \to \infty$ and white noise when $T \to 0$, so it contains both processes from this lesson as its two extremes.

::: warning
The $\sigma \propto \sqrt{t}$ law is for integrated *white* noise only. Integrate a constant bias $b$ and the error is $b\,t$: it grows in a straight line. Integrate a slowly varying bias and you get something between straight-line and square-root growth. So a datasheet's ARW bounds only one part of the attitude error. Over any coast longer than a few tens of seconds the bias terms usually dominate, and an error budget built on ARW alone understates the error badly. Independent error sources add in *variance*, so the total is the root-sum-square: $\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2}$.
:::

## Check yourself

::: check
A gyro has $\mathrm{ARW} = 0.2\,^\circ/\sqrt{\mathrm{h}}$. What is its rate noise density in $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, and what attitude error does white rate noise produce over a $90\,\mathrm{s}$ coast?
:::

::: answer
Divide by $60$: the density is $0.2/60 = 3.33 \times 10^{-3}\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$.

For the coast, $90\,\mathrm{s} = 90/3600 = 0.025\,\mathrm{h}$, so $\sigma_\theta = 0.2 \times \sqrt{0.025} = 0.2 \times 0.158 = 0.0316^\circ$.

The other route: $3.33 \times 10^{-3} \times \sqrt{90} = 0.0316^\circ$. If the two routes disagree, a unit conversion has gone wrong.
:::

::: check
A random-walk error has standard deviation $2\,\mathrm{m}$ after $100\,\mathrm{s}$. What is its noise strength $Q$, and what is the standard deviation after $400\,\mathrm{s}$ and after $25\,\mathrm{s}$?
:::

::: answer
From $\sigma^2 = Q\,t$: $Q = 2^2/100 = 4/100 = 0.04\,\mathrm{m^2/s}$.

After $400\,\mathrm{s}$: $\sigma = \sqrt{0.04 \times 400} = \sqrt{16} = 4\,\mathrm{m}$. Four times the time, twice the error.

After $25\,\mathrm{s}$: $\sigma = \sqrt{0.04 \times 25} = \sqrt{1} = 1\,\mathrm{m}$. A quarter of the time, half the error.

:::

::: check
An accelerometer sampled at $200\,\mathrm{Hz}$ shows white noise with a per-sample standard deviation of $0.02\,\mathrm{m/s^2}$. Find its noise density in $\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$ and its velocity random walk in $\mathrm{m/s}/\sqrt{\mathrm{h}}$.
:::

::: answer
The per-sample variance is $Q f_s$, so divide the per-sample sigma by $\sqrt{f_s}$:

$$
\sqrt{Q} = \frac{0.02}{\sqrt{200}} = \frac{0.02}{14.14} = 1.41 \times 10^{-3}\,\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}.
$$

In micro-$g$, divide by $9.80665 \times 10^{-6}\,\mathrm{m/s^2}$: $144\,\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$.

The VRW is $60 \times 1.41 \times 10^{-3} = 0.0849\,\mathrm{m/s}/\sqrt{\mathrm{h}}$.

At $100\,\mathrm{Hz}$ the per-sample sigma would drop to $0.0141\,\mathrm{m/s^2}$, and neither figure would change.
:::

::: check
For Brownian motion $W(t)$ with strength $Q$, what is the correlation coefficient between $W(100)$ and $W(900)$? Why is this process not wide-sense stationary?
:::

::: answer
The covariance is $Q\min(100, 900) = 100Q$. The standard deviations are $\sqrt{100Q}$ and $\sqrt{900Q}$. So

$$
\rho = \frac{100Q}{\sqrt{100Q \times 900Q}} = \frac{100}{300} = \frac{1}{3}.
$$

It fails twice: its variance $Qt$ changes with time, and its autocorrelation $Q\min(t, s)$ depends on the two instants themselves, not only on the gap. Slide the pair from $(100, 900)$ to $(1100, 1900)$ — the same gap of $800\,\mathrm{s}$ — and the covariance changes from $100Q$ to $1100Q$.
:::

::: check
A colleague simulates gyro noise at $\Delta t = 0.01\,\mathrm{s}$ with the line `w = Q * rng.standard_normal()`, where `Q` holds the noise strength in $(^\circ/\mathrm{s})^2/\mathrm{Hz}$, and integrates the result for angle. By what factor is the simulated attitude random walk wrong for the $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ gyro?
:::

::: answer
The correct per-sample rate sigma is $\sqrt{Q/\Delta t} = \sqrt{2.5 \times 10^{-5}/0.01} = \sqrt{2.5 \times 10^{-3}} = 0.05\,^\circ/\mathrm{s}$.

The code uses $2.5 \times 10^{-5}$ instead. That is smaller by $0.05/(2.5 \times 10^{-5}) = 2000$.

The integrated angle error scales in step with the per-sample sigma, so the simulated random walk is $2000$ times too small. The $0.122^\circ$ after ten minutes becomes about $6 \times 10^{-5}\,^\circ$. Any filter tuned against this simulation will be wildly over-confident on the real sensor.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $X(t)$, realization, ensemble | Random process: a random variable at every instant, a function of time for every outcome |
| $R_X(t_1, t_2) = \mathbb{E}[X(t_1)X(t_2)]$ | Autocorrelation function; $R_X(t, t)$ is the mean-square value |
| WSS: $m_X$ constant, $R_X(t_1, t_2) = R_X(\tau)$ | Wide-sense stationary; $R_X$ even, largest at $\tau = 0$ |
| $\mathbb{E}[w_j w_k] = \sigma_s^2\,\delta_{jk}$ | Discrete white sequence |
| $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$ | Continuous white noise of strength $Q$, units $(\text{unit})^2/\mathrm{Hz}$ |
| $\sigma_s^2 = Q/\Delta t = Q f_s$ | Per-sample variance of sampled white noise |
| $x_{k+1} = x_k + w_k$, $\operatorname{Var}(x_k) = k\sigma_s^2$ | Discrete random walk |
| $W(t) = \int_0^t w\,ds$, $\operatorname{Var} = Qt$, $\sigma(t) = \sigma_w\sqrt{t}$ | Brownian motion (Wiener process), $\sigma_w = \sqrt{Q}$ |
| $R_W(t, s) = Q\min(t, s)$, $\rho = \sqrt{s/t}$ | Brownian autocorrelation; not stationary |
| $W(t) - W(s) \sim \mathcal{N}(0, Q(t - s))$ | Independent Gaussian increments; simulate with $\sqrt{Q\,\Delta t}\,z$ |
| $\mathrm{ARW} = 60 \times$ density, $\sigma_\theta = \mathrm{ARW}\sqrt{t}$ | Angle random walk, $^\circ/\sqrt{\mathrm{h}}$ from $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ |
| $\sigma_p(t) = \sqrt{Q}\,t^{3/2}/\sqrt{3}$ | Position error from white acceleration noise |
| $\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2}$ | Independent errors add in variance |

Next lesson: the restoring pull that both white noise and the random walk lack. It gives the first-order Gauss-Markov process, its exact step-by-step form, and — together with angle random walk and bias instability — the complete gyro and accelerometer error model that every inertial navigation filter carries.

::: context stochastic A word about aiming
**Stochastic** comes from an old Greek word meaning "skillful at aiming" or "good at guessing". A stochastic process is one you can only guess at: you cannot say what the next value will be, but you can say how likely each value is and how the values hang together over time. "Random process" and "stochastic process" mean exactly the same thing; engineers use both.
:::

::: context ensemble One instant, many sensors
Each colored line is one realization — one sensor, one run. Freeze time at $t_1$ (the dashed line) and read off where each line is: those dots are four draws of the single random variable $X(t_1)$. The mean function $m_X(t_1)$ is the average height of such dots over *all* possible lines, and the variance is their spread.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="20" x2="30" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="216.0" y1="20" x2="216.0" y2="170" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="4 3"/>
  <path d="M30.0,99.7 L33.1,102.8 L36.2,104.3 L39.3,118.5 L42.4,120.1 L45.5,140.4 L48.6,99.3 L51.7,100.6 L54.8,99.1 L57.9,97.9 L61.0,101.1 L64.1,94.3 L67.2,95.5 L70.3,86.0 L73.4,111.0 L76.5,105.8 L79.6,104.8 L82.7,102.6 L85.8,87.1 L88.9,75.9 L92.0,76.7 L95.1,81.4 L98.2,75.9 L101.3,69.1 L104.4,69.6 L107.5,71.4 L110.6,75.2 L113.7,85.3 L116.8,83.8 L119.9,76.3 L123.0,76.0 L126.1,88.9 L129.2,82.4 L132.3,100.5 L135.4,100.3 L138.5,100.8 L141.6,110.5 L144.7,114.7 L147.8,113.9 L150.9,117.6 L154.0,129.9 L157.1,109.9 L160.2,117.4 L163.3,100.8 L166.4,83.9 L169.5,84.5 L172.6,81.6 L175.7,79.9 L178.8,78.9 L181.9,75.0 L185.0,70.5 L188.1,81.9 L191.2,92.6 L194.3,92.4 L197.4,117.6 L200.5,111.3 L203.6,101.4 L206.7,117.0 L209.8,120.6 L212.9,125.9 L216.0,115.1 L219.1,130.9 L222.2,119.9 L225.3,119.7 L228.4,115.1 L231.5,118.7 L234.6,122.6 L237.7,113.6 L240.8,123.1 L243.9,97.8 L247.0,99.7 L250.1,102.2 L253.2,117.6 L256.3,92.7 L259.4,89.3 L262.5,94.2 L265.6,102.0 L268.7,101.4 L271.8,87.8 L274.9,85.0 L278.0,69.7 L281.1,77.1 L284.2,81.4 L287.3,84.4 L290.4,78.0 L293.5,80.1 L296.6,95.6 L299.7,105.1 L302.8,115.3 L305.9,116.2 L309.0,107.7 L312.1,110.8 L315.2,117.3 L318.3,126.9 L321.4,108.2 L324.5,98.7 L327.6,95.0 L330.7,98.8 L333.8,102.8 L336.9,94.1 L340.0,81.9" fill="none" stroke="#1d6fd1" stroke-width="1.8"/>
  <path d="M30.0,94.5 L33.1,93.6 L36.2,94.3 L39.3,90.5 L42.4,89.0 L45.5,73.2 L48.6,61.0 L51.7,56.2 L54.8,64.9 L57.9,68.2 L61.0,71.7 L64.1,71.8 L67.2,89.3 L70.3,99.0 L73.4,102.0 L76.5,121.6 L79.6,114.1 L82.7,117.4 L85.8,112.8 L88.9,112.0 L92.0,81.8 L95.1,91.4 L98.2,93.5 L101.3,83.3 L104.4,64.1 L107.5,53.3 L110.6,44.0 L113.7,56.0 L116.8,71.7 L119.9,76.0 L123.0,70.9 L126.1,67.4 L129.2,81.8 L132.3,90.2 L135.4,96.4 L138.5,93.7 L141.6,98.9 L144.7,89.8 L147.8,83.1 L150.9,89.4 L154.0,91.2 L157.1,96.2 L160.2,109.0 L163.3,100.4 L166.4,87.9 L169.5,91.2 L172.6,106.1 L175.7,103.6 L178.8,98.7 L181.9,101.2 L185.0,95.1 L188.1,98.0 L191.2,109.4 L194.3,112.8 L197.4,120.9 L200.5,124.0 L203.6,119.0 L206.7,111.2 L209.8,109.1 L212.9,104.1 L216.0,94.1 L219.1,78.9 L222.2,87.8 L225.3,79.5 L228.4,88.9 L231.5,85.1 L234.6,78.1 L237.7,76.2 L240.8,73.5 L243.9,84.3 L247.0,58.4 L250.1,66.3 L253.2,63.9 L256.3,59.3 L259.4,69.0 L262.5,61.5 L265.6,61.6 L268.7,47.5 L271.8,58.9 L274.9,59.6 L278.0,57.5 L281.1,57.9 L284.2,58.2 L287.3,70.6 L290.4,77.9 L293.5,81.8 L296.6,86.3 L299.7,76.3 L302.8,81.9 L305.9,93.8 L309.0,94.7 L312.1,105.7 L315.2,104.5 L318.3,108.6 L321.4,102.8 L324.5,105.8 L327.6,89.8 L330.7,81.2 L333.8,76.3 L336.9,67.9 L340.0,68.9" fill="none" stroke="#b4232c" stroke-width="1.8"/>
  <path d="M30.0,101.5 L33.1,113.8 L36.2,109.2 L39.3,109.3 L42.4,101.4 L45.5,103.3 L48.6,107.1 L51.7,93.4 L54.8,102.6 L57.9,91.6 L61.0,95.8 L64.1,96.7 L67.2,105.9 L70.3,111.2 L73.4,106.8 L76.5,124.3 L79.6,121.5 L82.7,128.6 L85.8,121.0 L88.9,111.2 L92.0,123.5 L95.1,116.7 L98.2,116.3 L101.3,108.6 L104.4,103.8 L107.5,98.6 L110.6,118.8 L113.7,129.6 L116.8,117.0 L119.9,117.3 L123.0,125.0 L126.1,113.4 L129.2,111.9 L132.3,116.7 L135.4,109.0 L138.5,107.6 L141.6,110.6 L144.7,99.1 L147.8,89.0 L150.9,100.4 L154.0,111.1 L157.1,103.5 L160.2,82.8 L163.3,83.5 L166.4,78.6 L169.5,87.2 L172.6,89.0 L175.7,65.9 L178.8,64.1 L181.9,58.5 L185.0,73.5 L188.1,67.9 L191.2,77.0 L194.3,68.2 L197.4,68.8 L200.5,84.5 L203.6,87.3 L206.7,97.7 L209.8,94.8 L212.9,92.3 L216.0,78.8 L219.1,82.7 L222.2,76.8 L225.3,76.9 L228.4,64.5 L231.5,55.2 L234.6,59.8 L237.7,61.7 L240.8,57.9 L243.9,64.8 L247.0,72.3 L250.1,67.4 L253.2,60.0 L256.3,65.6 L259.4,65.6 L262.5,71.6 L265.6,72.0 L268.7,86.5 L271.8,81.5 L274.9,78.2 L278.0,97.2 L281.1,85.3 L284.2,80.9 L287.3,83.8 L290.4,90.9 L293.5,88.8 L296.6,95.3 L299.7,90.8 L302.8,91.4 L305.9,88.9 L309.0,93.2 L312.1,82.4 L315.2,83.6 L318.3,88.5 L321.4,88.6 L324.5,100.0 L327.6,101.8 L330.7,124.2 L333.8,123.6 L336.9,130.6 L340.0,130.9" fill="none" stroke="#6c7a93" stroke-width="1.8"/>
  <path d="M30.0,113.6 L33.1,107.6 L36.2,110.9 L39.3,104.4 L42.4,93.7 L45.5,96.0 L48.6,99.4 L51.7,96.6 L54.8,92.0 L57.9,91.9 L61.0,86.7 L64.1,89.4 L67.2,103.2 L70.3,101.3 L73.4,96.7 L76.5,89.9 L79.6,98.7 L82.7,115.9 L85.8,121.2 L88.9,132.8 L92.0,136.4 L95.1,133.8 L98.2,131.2 L101.3,108.5 L104.4,93.0 L107.5,86.4 L110.6,77.6 L113.7,67.4 L116.8,65.5 L119.9,62.4 L123.0,67.1 L126.1,108.9 L129.2,109.8 L132.3,109.7 L135.4,104.8 L138.5,111.8 L141.6,115.3 L144.7,112.2 L147.8,114.3 L150.9,91.4 L154.0,86.9 L157.1,81.7 L160.2,92.7 L163.3,87.4 L166.4,73.3 L169.5,89.8 L172.6,78.0 L175.7,75.4 L178.8,69.2 L181.9,72.3 L185.0,78.2 L188.1,73.7 L191.2,82.4 L194.3,74.7 L197.4,78.1 L200.5,73.9 L203.6,94.9 L206.7,93.1 L209.8,104.6 L212.9,116.0 L216.0,102.5 L219.1,109.2 L222.2,115.1 L225.3,131.8 L228.4,123.1 L231.5,121.2 L234.6,111.7 L237.7,100.8 L240.8,109.7 L243.9,99.7 L247.0,99.2 L250.1,78.6 L253.2,79.7 L256.3,81.8 L259.4,77.1 L262.5,83.5 L265.6,79.3 L268.7,86.5 L271.8,74.5 L274.9,82.6 L278.0,76.0 L281.1,69.5 L284.2,66.3 L287.3,77.9 L290.4,81.9 L293.5,74.5 L296.6,80.9 L299.7,81.0 L302.8,93.8 L305.9,102.1 L309.0,108.3 L312.1,85.4 L315.2,86.4 L318.3,95.3 L321.4,105.8 L324.5,110.8 L327.6,97.4 L330.7,91.5 L333.8,84.9 L336.9,94.4 L340.0,95.5" fill="none" stroke="#f2b880" stroke-width="1.8"/>
  <circle cx="216.0" cy="115.1" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="216.0" cy="94.1" r="4" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="216.0" cy="78.8" r="4" fill="#6c7a93" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="216.0" cy="102.5" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="216.0" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">t₁</text>
  <text x="340" y="186" font-size="12" text-anchor="end" fill="#1f2a44">time</text>
  <text x="34" y="14" font-size="12" fill="#1f2a44">four realizations of X(t)</text>
</svg>
```

The autocorrelation asks the next question: if a line is high at $t_1$, is it usually still high a little later?
:::

::: context white-name White, pink and brown
Engineers name noise by its spectrum, the way light is named by its colors. **White** noise has equal strength at every frequency, like white light. **Pink** noise has more strength at low frequencies, falling as $1/f$; you will meet it as "flicker noise" in the next two lessons. **Brown** noise falls as $1/f^2$ and is the spectrum of a random walk. That one is not named after a color at all: it is named after Robert Brown, the botanist of the Brownian motion story later in this lesson.
:::

::: context dirac-delta A spike with area one
Take a box one second wide and one unit per second tall: its area is $1$. Make it half as wide and twice as tall — still area $1$. Keep squeezing. The limit is the Dirac delta $\delta(t)$: zero everywhere except at $t = 0$, infinitely tall there, and its area is always exactly $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140.0" y="135.0" width="80.0" height="15.0" fill="#8fb8f0" fill-opacity="0.45" stroke="#8fb8f0" stroke-width="1.8"/>
  <rect x="160.0" y="120.0" width="40.0" height="30.0" fill="#1d6fd1" fill-opacity="0.45" stroke="#1d6fd1" stroke-width="1.8"/>
  <rect x="170.0" y="90.0" width="20.0" height="60.0" fill="#b4232c" fill-opacity="0.45" stroke="#b4232c" stroke-width="1.8"/>
  <text x="225" y="142" font-size="11" fill="#1f2a44">width 2 s, height 0.5 /s</text>
  <text x="205" y="117" font-size="11" fill="#1d6fd1">width 1 s, height 1 /s</text>
  <text x="194" y="90" font-size="11" fill="#b4232c">width 0.5 s, height 2 /s</text>
  <text x="20" y="22" font-size="12" fill="#1f2a44">every box has area 1 — squeeze it to a spike: δ(t)</text>
  <text x="180" y="168" font-size="12" text-anchor="middle" fill="#1f2a44">t = 0</text>
</svg>
```

Because its area is a pure number and its width is in seconds, its height — the delta itself — has units of $1/\mathrm{s}$. Its one job: under an integral, $\int f(t)\,\delta(t - a)\,dt = f(a)$. It picks out a single value and throws away the rest. That is the "collapse" used in the variance calculations of this lesson.
:::

::: context sqrt-growth Why the square root
Each step adds variance $\sigma_s^2$, so after $k$ steps the variance is $k\sigma_s^2$ and the standard deviation is $\sigma_s\sqrt{k}$. The walks below are six random walks of $120$ steps each. The solid red curves are $\pm\sigma\sqrt{k}$; the dashed ones are $\pm 2\sigma\sqrt{k}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="12" x2="30" y2="188" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M30.0,100.0 L32.6,97.5 L35.2,101.0 L37.8,106.8 L40.3,117.5 L42.9,118.8 L45.5,114.2 L48.1,114.1 L50.7,112.2 L53.2,108.5 L55.8,111.7 L58.4,102.0 L61.0,105.2 L63.6,103.8 L66.2,93.8 L68.8,94.3 L71.3,93.8 L73.9,95.7 L76.5,94.5 L79.1,102.3 L81.7,104.6 L84.2,98.4 L86.8,97.7 L89.4,98.5 L92.0,97.2 L94.6,95.7 L97.2,95.1 L99.8,93.0 L102.3,99.1 L104.9,96.9 L107.5,99.4 L110.1,96.5 L112.7,96.6 L115.2,100.2 L117.8,100.5 L120.4,104.1 L123.0,100.4 L125.6,100.6 L128.2,97.4 L130.8,101.5 L133.3,95.6 L135.9,96.7 L138.5,91.7 L141.1,88.6 L143.7,92.6 L146.2,91.4 L148.8,93.4 L151.4,91.9 L154.0,86.7 L156.6,84.2 L159.2,80.3 L161.8,84.6 L164.3,83.8 L166.9,82.5 L169.5,78.5 L172.1,80.8 L174.7,78.7 L177.2,77.1 L179.8,82.7 L182.4,86.5 L185.0,84.9 L187.6,89.2 L190.2,93.7 L192.8,90.4 L195.3,89.3 L197.9,90.2 L200.5,89.8 L203.1,91.3 L205.7,93.3 L208.2,94.9 L210.8,93.5 L213.4,88.7 L216.0,90.4 L218.6,90.7 L221.2,91.5 L223.8,96.1 L226.3,95.1 L228.9,92.0 L231.5,95.1 L234.1,92.0 L236.7,94.1 L239.2,89.9 L241.8,85.5 L244.4,86.9 L247.0,94.2 L249.6,95.4 L252.2,100.5 L254.8,105.3 L257.3,106.2 L259.9,101.3 L262.5,101.6 L265.1,102.4 L267.7,109.2 L270.2,111.4 L272.8,116.5 L275.4,114.6 L278.0,116.5 L280.6,116.7 L283.2,116.7 L285.8,117.4 L288.3,113.9 L290.9,112.2 L293.5,113.3 L296.1,112.8 L298.7,110.7 L301.2,105.7 L303.8,105.3 L306.4,100.0 L309.0,102.1 L311.6,103.0 L314.2,108.4 L316.8,105.4 L319.3,109.2 L321.9,113.0 L324.5,109.9 L327.1,111.8 L329.7,114.6 L332.2,111.1 L334.8,111.8 L337.4,108.4 L340.0,109.9" fill="none" stroke="#8fb8f0" stroke-width="1.2"/>
  <path d="M30.0,100.0 L32.6,97.3 L35.2,93.4 L37.8,93.1 L40.3,86.5 L42.9,88.0 L45.5,88.8 L48.1,88.5 L50.7,84.8 L53.2,85.8 L55.8,87.4 L58.4,86.5 L61.0,82.0 L63.6,83.5 L66.2,88.1 L68.8,88.6 L71.3,86.3 L73.9,88.3 L76.5,87.9 L79.1,94.7 L81.7,94.6 L84.2,94.2 L86.8,92.0 L89.4,90.8 L92.0,88.0 L94.6,91.6 L97.2,89.2 L99.8,95.3 L102.3,97.4 L104.9,93.4 L107.5,90.3 L110.1,97.1 L112.7,94.9 L115.2,96.5 L117.8,99.3 L120.4,98.6 L123.0,98.1 L125.6,93.0 L128.2,98.3 L130.8,99.9 L133.3,100.4 L135.9,107.1 L138.5,102.8 L141.1,96.4 L143.7,98.7 L146.2,97.3 L148.8,98.3 L151.4,97.3 L154.0,99.7 L156.6,96.7 L159.2,101.0 L161.8,96.0 L164.3,94.7 L166.9,85.8 L169.5,91.9 L172.1,92.2 L174.7,96.9 L177.2,97.4 L179.8,95.8 L182.4,99.2 L185.0,104.4 L187.6,110.8 L190.2,110.0 L192.8,105.3 L195.3,101.0 L197.9,100.9 L200.5,104.4 L203.1,105.7 L205.7,111.2 L208.2,117.0 L210.8,113.1 L213.4,114.1 L216.0,113.0 L218.6,114.0 L221.2,109.1 L223.8,103.9 L226.3,106.7 L228.9,108.0 L231.5,110.5 L234.1,105.7 L236.7,101.1 L239.2,102.2 L241.8,93.8 L244.4,93.7 L247.0,98.2 L249.6,105.6 L252.2,106.1 L254.8,104.9 L257.3,107.1 L259.9,105.7 L262.5,101.4 L265.1,101.6 L267.7,98.5 L270.2,92.4 L272.8,90.6 L275.4,92.7 L278.0,91.2 L280.6,89.2 L283.2,81.4 L285.8,83.0 L288.3,88.7 L290.9,87.6 L293.5,86.4 L296.1,87.9 L298.7,85.8 L301.2,84.7 L303.8,80.2 L306.4,83.3 L309.0,85.9 L311.6,85.9 L314.2,87.8 L316.8,83.2 L319.3,81.0 L321.9,81.1 L324.5,75.5 L327.1,73.7 L329.7,70.1 L332.2,67.1 L334.8,67.7 L337.4,68.2 L340.0,68.1" fill="none" stroke="#8fb8f0" stroke-width="1.2"/>
  <path d="M30.0,100.0 L32.6,104.0 L35.2,105.2 L37.8,102.1 L40.3,101.0 L42.9,104.4 L45.5,95.8 L48.1,99.6 L50.7,97.3 L53.2,94.6 L55.8,90.0 L58.4,93.1 L61.0,93.0 L63.6,93.7 L66.2,89.5 L68.8,88.1 L71.3,86.5 L73.9,84.5 L76.5,77.3 L79.1,74.8 L81.7,71.5 L84.2,74.8 L86.8,72.2 L89.4,76.6 L92.0,73.0 L94.6,72.3 L97.2,75.4 L99.8,79.4 L102.3,79.6 L104.9,78.9 L107.5,80.8 L110.1,81.7 L112.7,82.6 L115.2,84.3 L117.8,84.8 L120.4,83.6 L123.0,78.6 L125.6,76.0 L128.2,77.7 L130.8,71.5 L133.3,66.9 L135.9,67.5 L138.5,63.5 L141.1,65.1 L143.7,67.5 L146.2,69.7 L148.8,63.5 L151.4,62.6 L154.0,61.0 L156.6,60.4 L159.2,61.4 L161.8,59.2 L164.3,56.3 L166.9,48.7 L169.5,51.4 L172.1,45.3 L174.7,42.4 L177.2,48.2 L179.8,44.2 L182.4,37.8 L185.0,33.3 L187.6,31.9 L190.2,30.8 L192.8,37.5 L195.3,35.8 L197.9,34.7 L200.5,37.6 L203.1,36.3 L205.7,38.2 L208.2,29.5 L210.8,33.5 L213.4,36.3 L216.0,43.7 L218.6,44.7 L221.2,43.9 L223.8,43.5 L226.3,45.5 L228.9,42.0 L231.5,40.8 L234.1,36.2 L236.7,36.3 L239.2,42.4 L241.8,42.7 L244.4,46.1 L247.0,42.8 L249.6,44.8 L252.2,45.4 L254.8,45.3 L257.3,50.6 L259.9,51.9 L262.5,48.5 L265.1,50.4 L267.7,50.9 L270.2,50.2 L272.8,52.5 L275.4,53.4 L278.0,51.7 L280.6,53.0 L283.2,52.7 L285.8,53.2 L288.3,56.9 L290.9,61.5 L293.5,54.2 L296.1,49.2 L298.7,49.5 L301.2,46.0 L303.8,41.9 L306.4,38.4 L309.0,39.6 L311.6,44.8 L314.2,49.3 L316.8,50.1 L319.3,45.2 L321.9,39.4 L324.5,40.2 L327.1,41.4 L329.7,36.9 L332.2,29.3 L334.8,32.6 L337.4,30.8 L340.0,30.2" fill="none" stroke="#8fb8f0" stroke-width="1.2"/>
  <path d="M30.0,100.0 L32.6,101.1 L35.2,102.2 L37.8,103.3 L40.3,103.2 L42.9,108.7 L45.5,108.6 L48.1,105.6 L50.7,102.8 L53.2,99.8 L55.8,98.5 L58.4,97.7 L61.0,90.5 L63.6,91.0 L66.2,90.3 L68.8,85.7 L71.3,85.4 L73.9,90.0 L76.5,91.9 L79.1,93.3 L81.7,93.8 L84.2,95.3 L86.8,91.6 L89.4,88.9 L92.0,87.0 L94.6,88.4 L97.2,84.5 L99.8,80.8 L102.3,72.7 L104.9,74.7 L107.5,75.0 L110.1,69.8 L112.7,73.6 L115.2,72.5 L117.8,71.5 L120.4,71.2 L123.0,74.4 L125.6,74.1 L128.2,79.4 L130.8,74.9 L133.3,76.5 L135.9,75.8 L138.5,75.7 L141.1,74.8 L143.7,74.2 L146.2,72.6 L148.8,73.8 L151.4,73.5 L154.0,77.4 L156.6,81.1 L159.2,84.1 L161.8,87.7 L164.3,92.6 L166.9,94.8 L169.5,92.4 L172.1,90.8 L174.7,92.3 L177.2,91.0 L179.8,89.6 L182.4,79.8 L185.0,85.5 L187.6,84.5 L190.2,89.2 L192.8,84.5 L195.3,85.2 L197.9,83.5 L200.5,82.6 L203.1,80.0 L205.7,90.4 L208.2,94.5 L210.8,94.1 L213.4,98.8 L216.0,96.6 L218.6,92.0 L221.2,96.6 L223.8,98.0 L226.3,95.6 L228.9,88.8 L231.5,85.0 L234.1,82.3 L236.7,85.3 L239.2,85.0 L241.8,84.4 L244.4,86.5 L247.0,84.8 L249.6,85.8 L252.2,87.3 L254.8,79.4 L257.3,79.9 L259.9,73.0 L262.5,74.2 L265.1,74.4 L267.7,78.8 L270.2,80.7 L272.8,74.9 L275.4,74.7 L278.0,81.9 L280.6,76.6 L283.2,79.8 L285.8,81.3 L288.3,81.4 L290.9,88.2 L293.5,82.5 L296.1,77.8 L298.7,79.0 L301.2,77.7 L303.8,78.7 L306.4,80.9 L309.0,81.7 L311.6,87.0 L314.2,88.4 L316.8,90.5 L319.3,83.5 L321.9,88.8 L324.5,84.2 L327.1,81.6 L329.7,81.1 L332.2,83.3 L334.8,76.7 L337.4,71.4 L340.0,71.6" fill="none" stroke="#8fb8f0" stroke-width="1.2"/>
  <path d="M30.0,100.0 L32.6,100.7 L35.2,100.0 L37.8,93.4 L40.3,96.7 L42.9,96.4 L45.5,92.3 L48.1,97.3 L50.7,97.6 L53.2,93.6 L55.8,95.2 L58.4,95.6 L61.0,101.2 L63.6,99.8 L66.2,104.1 L68.8,105.5 L71.3,104.3 L73.9,106.3 L76.5,103.2 L79.1,100.6 L81.7,98.8 L84.2,95.2 L86.8,95.8 L89.4,103.7 L92.0,100.6 L94.6,97.7 L97.2,99.5 L99.8,102.5 L102.3,98.3 L104.9,100.1 L107.5,101.5 L110.1,103.1 L112.7,94.6 L115.2,97.3 L117.8,106.8 L120.4,107.3 L123.0,111.2 L125.6,117.8 L128.2,117.6 L130.8,119.9 L133.3,117.0 L135.9,118.6 L138.5,114.7 L141.1,111.5 L143.7,111.8 L146.2,109.4 L148.8,103.3 L151.4,101.2 L154.0,106.8 L156.6,106.9 L159.2,106.6 L161.8,102.5 L164.3,103.4 L166.9,99.7 L169.5,100.6 L172.1,100.9 L174.7,102.2 L177.2,102.6 L179.8,103.6 L182.4,102.8 L185.0,106.0 L187.6,110.2 L190.2,111.0 L192.8,111.0 L195.3,112.9 L197.9,111.9 L200.5,111.2 L203.1,105.6 L205.7,111.4 L208.2,104.8 L210.8,113.8 L213.4,120.8 L216.0,120.5 L218.6,124.6 L221.2,126.4 L223.8,128.7 L226.3,134.2 L228.9,139.9 L231.5,142.0 L234.1,141.5 L236.7,140.1 L239.2,140.3 L241.8,142.2 L244.4,138.7 L247.0,147.4 L249.6,148.1 L252.2,144.3 L254.8,139.2 L257.3,135.6 L259.9,131.5 L262.5,128.5 L265.1,128.8 L267.7,137.6 L270.2,140.2 L272.8,141.9 L275.4,136.9 L278.0,139.1 L280.6,141.1 L283.2,139.4 L285.8,143.6 L288.3,144.1 L290.9,142.7 L293.5,144.6 L296.1,145.4 L298.7,152.5 L301.2,157.6 L303.8,159.2 L306.4,155.7 L309.0,158.5 L311.6,162.5 L314.2,166.0 L316.8,164.3 L319.3,170.2 L321.9,170.2 L324.5,172.2 L327.1,172.7 L329.7,176.0 L332.2,176.4 L334.8,172.1 L337.4,173.8 L340.0,176.3" fill="none" stroke="#8fb8f0" stroke-width="1.2"/>
  <path d="M30.0,100.0 L32.6,110.0 L35.2,108.9 L37.8,111.9 L40.3,111.2 L42.9,111.4 L45.5,114.9 L48.1,117.9 L50.7,123.4 L53.2,116.8 L55.8,114.0 L58.4,111.6 L61.0,107.9 L63.6,103.4 L66.2,100.8 L68.8,97.7 L71.3,89.2 L73.9,95.9 L76.5,95.7 L79.1,98.4 L81.7,98.6 L84.2,108.2 L86.8,112.5 L89.4,110.0 L92.0,114.9 L94.6,113.3 L97.2,116.7 L99.8,117.6 L102.3,123.5 L104.9,126.1 L107.5,131.9 L110.1,130.2 L112.7,136.8 L115.2,136.0 L117.8,138.2 L120.4,139.1 L123.0,134.1 L125.6,135.3 L128.2,137.8 L130.8,137.9 L133.3,135.6 L135.9,137.7 L138.5,131.7 L141.1,131.1 L143.7,132.5 L146.2,135.0 L148.8,135.6 L151.4,133.6 L154.0,129.8 L156.6,129.6 L159.2,131.7 L161.8,131.9 L164.3,139.5 L166.9,135.5 L169.5,132.4 L172.1,133.1 L174.7,130.5 L177.2,134.0 L179.8,127.3 L182.4,127.5 L185.0,128.8 L187.6,120.7 L190.2,123.5 L192.8,121.2 L195.3,123.4 L197.9,124.5 L200.5,124.6 L203.1,125.7 L205.7,119.4 L208.2,114.5 L210.8,115.5 L213.4,105.8 L216.0,105.0 L218.6,104.6 L221.2,102.1 L223.8,104.9 L226.3,99.0 L228.9,101.3 L231.5,104.9 L234.1,100.1 L236.7,102.5 L239.2,102.6 L241.8,106.1 L244.4,107.0 L247.0,105.8 L249.6,113.8 L252.2,113.4 L254.8,115.7 L257.3,110.0 L259.9,102.1 L262.5,99.6 L265.1,97.0 L267.7,92.6 L270.2,88.2 L272.8,93.0 L275.4,97.3 L278.0,98.7 L280.6,103.4 L283.2,104.3 L285.8,103.6 L288.3,106.2 L290.9,104.3 L293.5,98.9 L296.1,98.5 L298.7,96.7 L301.2,96.6 L303.8,96.7 L306.4,98.4 L309.0,102.4 L311.6,100.2 L314.2,96.1 L316.8,96.1 L319.3,95.7 L321.9,100.5 L324.5,101.3 L327.1,100.1 L329.7,100.4 L332.2,100.1 L334.8,103.7 L337.4,108.3 L340.0,109.2" fill="none" stroke="#8fb8f0" stroke-width="1.2"/>
  <path d="M30.0,100.0 L37.8,93.7 L45.5,91.1 L53.2,89.0 L61.0,87.4 L68.8,85.9 L76.5,84.5 L84.2,83.3 L92.0,82.1 L99.8,81.0 L107.5,80.0 L115.2,79.0 L123.0,78.1 L130.8,77.2 L138.5,76.3 L146.2,75.5 L154.0,74.7 L161.8,73.9 L169.5,73.2 L177.2,72.4 L185.0,71.7 L192.8,71.0 L200.5,70.3 L208.2,69.7 L216.0,69.0 L223.8,68.4 L231.5,67.8 L239.2,67.1 L247.0,66.5 L254.8,65.9 L262.5,65.4 L270.2,64.8 L278.0,64.2 L285.8,63.7 L293.5,63.1 L301.2,62.6 L309.0,62.1 L316.8,61.5 L324.5,61.0 L332.2,60.5 L340.0,60.0" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <path d="M30.0,100.0 L37.8,87.4 L45.5,82.1 L53.2,78.1 L61.0,74.7 L68.8,71.7 L76.5,69.0 L84.2,66.5 L92.0,64.2 L99.8,62.1 L107.5,60.0 L115.2,58.0 L123.0,56.2 L130.8,54.4 L138.5,52.7 L146.2,51.0 L154.0,49.4 L161.8,47.8 L169.5,46.3 L177.2,44.9 L185.0,43.4 L192.8,42.0 L200.5,40.7 L208.2,39.3 L216.0,38.0 L223.8,36.8 L231.5,35.5 L239.2,34.3 L247.0,33.1 L254.8,31.9 L262.5,30.7 L270.2,29.6 L278.0,28.4 L285.8,27.3 L293.5,26.2 L301.2,25.2 L309.0,24.1 L316.8,23.1 L324.5,22.0 L332.2,21.0 L340.0,20.0" fill="none" stroke="#b4232c" stroke-width="1.4" stroke-dasharray="5 3"/>
  <path d="M30.0,100.0 L37.8,106.3 L45.5,108.9 L53.2,111.0 L61.0,112.6 L68.8,114.1 L76.5,115.5 L84.2,116.7 L92.0,117.9 L99.8,119.0 L107.5,120.0 L115.2,121.0 L123.0,121.9 L130.8,122.8 L138.5,123.7 L146.2,124.5 L154.0,125.3 L161.8,126.1 L169.5,126.8 L177.2,127.6 L185.0,128.3 L192.8,129.0 L200.5,129.7 L208.2,130.3 L216.0,131.0 L223.8,131.6 L231.5,132.2 L239.2,132.9 L247.0,133.5 L254.8,134.1 L262.5,134.6 L270.2,135.2 L278.0,135.8 L285.8,136.3 L293.5,136.9 L301.2,137.4 L309.0,137.9 L316.8,138.5 L324.5,139.0 L332.2,139.5 L340.0,140.0" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <path d="M30.0,100.0 L37.8,112.6 L45.5,117.9 L53.2,121.9 L61.0,125.3 L68.8,128.3 L76.5,131.0 L84.2,133.5 L92.0,135.8 L99.8,137.9 L107.5,140.0 L115.2,142.0 L123.0,143.8 L130.8,145.6 L138.5,147.3 L146.2,149.0 L154.0,150.6 L161.8,152.2 L169.5,153.7 L177.2,155.1 L185.0,156.6 L192.8,158.0 L200.5,159.3 L208.2,160.7 L216.0,162.0 L223.8,163.2 L231.5,164.5 L239.2,165.7 L247.0,166.9 L254.8,168.1 L262.5,169.3 L270.2,170.4 L278.0,171.6 L285.8,172.7 L293.5,173.8 L301.2,174.8 L309.0,175.9 L316.8,176.9 L324.5,178.0 L332.2,179.0 L340.0,180.0" fill="none" stroke="#b4232c" stroke-width="1.4" stroke-dasharray="5 3"/>
  <text x="340" y="14.0" font-size="12" text-anchor="end" fill="#b4232c">2σ√k</text>
  <text x="340" y="156.0" font-size="12" text-anchor="end" fill="#b4232c">σ√k</text>
  <text x="340" y="96" font-size="11" text-anchor="end" fill="#1f2a44">step k = 120</text>
</svg>
```

The envelope keeps opening, but more and more slowly: to double the spread you need four times as many steps. Steps partly cancel each other — some go up, some go down — which is why the spread grows slower than the number of steps.
:::

::: context aiding What "aiding" means
An inertial navigator counts on its own sensors alone, so its errors only grow. **Aiding** means correcting it with an outside measurement: GPS positions, a star tracker's attitude, a radar altimeter, landmarks seen by a camera. A Kalman filter blends the two — the inertial sensors give smooth, fast updates, and the aiding measurements stop the drift. The random walks in this lesson are exactly why that blend is needed, and the later estimation modules build it.
:::

::: context brownian-history Pollen, Einstein and atoms
In 1827 the Scottish botanist Robert Brown watched tiny particles from pollen grains, suspended in water, jiggle endlessly under his microscope. Nobody could explain it. In 1905 Albert Einstein showed that the jiggling was the particles being hit by water molecules, and predicted that their average squared distance should grow in proportion to time — the $\operatorname{Var} = Qt$ of this lesson. Jean Perrin's careful measurements around 1908 confirmed it, which helped convince the last doubters that atoms are real. The mathematics was made rigorous in the 1920s by Norbert Wiener, which is why it is also called the Wiener process.
:::

::: context gyro-types Kinds of gyro
A **MEMS** gyro (micro-electro-mechanical system) is a tiny vibrating structure etched into a silicon chip, the same kind as in a phone; it is cheap and small but noisy. A **fiber-optic gyro** sends laser light both ways around a long coil of optical fiber and measures the tiny difference in travel time when the coil rotates; it is larger, costlier and far quieter. A **ring laser gyro** does the same with light bouncing around a sealed glass block. Launch vehicles and spacecraft typically fly fiber-optic or ring laser gyros, with ARW figures from about $0.001$ to $0.1\,^\circ/\sqrt{\mathrm{h}}$.
:::
