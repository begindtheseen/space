---
id: l13-chi-square-and-filter-consistency
title: The chi-square distribution and filter consistency testing
minutes: 26
covers:
  - the chi-square distribution and filter consistency testing
---

A navigation filter outputs two things: an estimate and a covariance. The estimate is what the vehicle flies on. The covariance is a *claim* — the filter asserting how wrong it expects the estimate to be. Everything downstream believes that claim: the guidance law sizes its margins from it, the measurement editor decides from it whether an incoming GNSS fix is plausible, the abort logic compares it against a limit. A filter that is three metres off while reporting one metre of uncertainty is more dangerous than one that is three metres off and says so, because the first one will reject the very measurements that would have corrected it.

Checking that claim is called **consistency testing**, and it is the single most important thing an estimation engineer does that is not writing the filter itself. The test rests on one distribution. The errors of a well-behaved filter are Gaussian with the covariance the filter reports, so the squared error normalised by that covariance is a sum of squared standard normals — a chi-square variable with a known number of degrees of freedom and therefore a known acceptance band. Fall outside the band and the filter is lying, and the direction tells you which term is mistuned.

This lesson develops the chi-square distribution, collects the three places in this module where it has already appeared without being named, defines the innovation and its covariance, and builds the two standard tests: **NEES** on the state error in simulation and **NIS** on the innovations in flight. It closes with the procedure an engineer actually follows, worked through on a filter deliberately mistuned three different ways.

## The chi-square distribution

> **Definition.** If $Z_1, \ldots, Z_k$ are independent standard normal variables, then
> $$
> \chi^2_k = \sum_{i=1}^{k} Z_i^2
> $$
> has the **chi-square distribution with $k$ degrees of freedom**.

Its first two moments follow from the Gaussian moments of the fourth lesson. Each $Z_i^2$ has mean $\mathbb{E}[Z^2] = 1$ and variance $\mathbb{E}[Z^4] - (\mathbb{E}[Z^2])^2 = 3 - 1 = 2$, and the terms are independent, so means and variances both add:

$$
\mathbb{E}[\chi^2_k] = k, \qquad \operatorname{Var}(\chi^2_k) = 2k, \qquad \operatorname{sd}(\chi^2_k) = \sqrt{2k}.
$$

The mean being exactly $k$ is what makes the whole apparatus usable: if a normalised squared error should have $k$ degrees of freedom, its average should be $k$, and how far from $k$ it may stray is set by $\sqrt{2k}$. Independent chi-squares add in degrees of freedom as well, $\chi^2_a + \chi^2_b = \chi^2_{a+b}$, directly from the definition, and that additivity is what lets a test pool many time steps or many Monte Carlo runs into one statistic.

The density is

$$
p_k(x) = \frac{x^{k/2 - 1}e^{-x/2}}{2^{k/2}\,\Gamma(k/2)}, \qquad x \geq 0,
$$

and its CDF is the regularised lower incomplete gamma function $P(k/2,\ x/2)$, which every numerical library provides and which the code below computes in ten lines. Two special cases are worth holding: $k = 1$ gives the density of a single squared normal, infinite at the origin and heavily skewed, and $k = 2$ gives an exponential with mean $2$, so $P(\chi^2_2 \leq x) = 1 - e^{-x/2}$ exactly — the only case with a clean closed form, and the reason the two-dimensional ellipse containments come out as round numbers.

The shape changes with $k$. At small $k$ it is strongly right-skewed with its mode below the mean; as $k$ grows the skewness falls as $\sqrt{8/k}$ and the distribution approaches $\mathcal{N}(k, 2k)$, since it is a sum of $k$ independent pieces. That Gaussian approximation is poor until $k$ is large: at $k = 100$ it puts the $97.5\%$ point at $100 + 1.96\sqrt{200} = 127.7$ against the true $129.6$. The **Wilson–Hilferty** approximation, which says $(\chi^2_k/k)^{1/3}$ is approximately normal with mean $1 - 2/(9k)$ and variance $2/(9k)$, gives $129.56$ — accurate enough to use by hand.

| $k$ | $2.5\%$ | median | $95\%$ | $97.5\%$ |
| --- | --- | --- | --- | --- |
| $1$ | $0.001$ | $0.455$ | $3.841$ | $5.024$ |
| $2$ | $0.051$ | $1.386$ | $5.991$ | $7.378$ |
| $3$ | $0.216$ | $2.366$ | $7.815$ | $9.348$ |
| $6$ | $1.237$ | $5.348$ | $12.592$ | $14.449$ |
| $10$ | $3.247$ | $9.342$ | $18.307$ | $20.483$ |
| $50$ | $32.357$ | $49.335$ | $67.505$ | $71.420$ |
| $100$ | $74.222$ | $99.334$ | $124.342$ | $129.561$ |
| $200$ | $162.728$ | $199.334$ | $233.994$ | $241.058$ |

Notice how the band tightens in relative terms as $k$ grows. At $k = 1$ the middle $95\%$ spans a factor of five thousand; at $k = 200$ it spans $162.7$ to $241.1$, only $\pm 20\%$ around the mean. That is the whole reason consistency tests average over many steps or many runs: a single normalised error tells you almost nothing, and two hundred of them tell you a great deal.

## Three places it has already appeared

**Ellipsoid containment.** The squared Mahalanobis distance $d^2 = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu})$ is, in the principal coordinates of the Gaussian lesson, a sum of $n$ squared independent standard normals, hence $\chi^2_n$. So the probability of lying inside the $k$-sigma ellipsoid is the chi-square CDF at $k^2$ with $n$ degrees of freedom:

| $n$ | $1\sigma$ | $2\sigma$ | $3\sigma$ |
| --- | --- | --- | --- |
| $1$ | $68.27\%$ | $95.45\%$ | $99.73\%$ |
| $2$ | $39.35\%$ | $86.47\%$ | $98.89\%$ |
| $3$ | $19.87\%$ | $73.85\%$ | $97.07\%$ |

The $3\sigma$ ellipsoid of a three-dimensional position covariance holds $97.07\%$, not $99.73\%$. To enclose $99.73\%$ in three dimensions you need $\sqrt{\chi^2_{3,\,0.9973}} = 3.76\sigma$, and in two dimensions $3.44\sigma$. A requirement written as "the $3\sigma$ position ellipsoid shall lie within the corridor" therefore means something different in one, two and three dimensions, and the difference is not small.

**The sample variance.** For $N$ independent Gaussian samples, $(N-1)s^2/\sigma^2 \sim \chi^2_{N-1}$. The single degree of freedom lost to estimating the mean is exactly the Bessel correction of the expectation lesson, seen from the other side. Inverting the statement gives a confidence interval for the variance:

$$
\left[\frac{(N-1)s^2}{\chi^2_{N-1,\,1-\alpha/2}},\ \frac{(N-1)s^2}{\chi^2_{N-1,\,\alpha/2}}\right].
$$

**The least-squares residual.** The maximum likelihood lesson fitted $n$ parameters to $m$ weighted measurements and left a residual cost $J = \hat{\mathbf{v}}^{\mathsf{T}}\mathbf{R}^{-1}\hat{\mathbf{v}}$. The residuals are $m$ whitened Gaussians constrained by $n$ fitted parameters, so $J \sim \chi^2_{m-n}$: the **chi-square goodness-of-fit test** for a model. The rate-table fit gave $J = 3.18$ with $m - n = 3$, and $P(\chi^2_3 > 3.18) = 0.36$ — an entirely ordinary value, so the straight-line model with $\sigma = 0.05\,^\circ/\mathrm{s}$ describes the data. A $J$ of $30$ on three degrees of freedom would have meant the model is wrong or $\sigma$ was understated; a $J$ of $0.05$ would have meant $\sigma$ was overstated or the model has too many parameters.

::: example Is the gyro really a 0.2 °/h sensor?
The eight-sample bench test gave $s = 0.187\,^\circ/\mathrm{h}$, so $s^2 = 0.0351\,(^\circ/\mathrm{h})^2$ and $(N-1)s^2 = 7 \times 0.0351 = 0.2458$. With $\nu = 7$ the chi-square quantiles are $\chi^2_{7,\,0.025} = 1.690$ and $\chi^2_{7,\,0.975} = 16.013$, so the $95\%$ interval for the variance is

$$
\left[\frac{0.2458}{16.013},\ \frac{0.2458}{1.690}\right] = [0.01535,\ 0.14545]\,(^\circ/\mathrm{h})^2,
$$

and for the standard deviation, $[0.124,\ 0.381]\,^\circ/\mathrm{h}$. Eight samples pin the noise level only to within a factor of three. A datasheet claim of $0.2\,^\circ/\mathrm{h}$ sits comfortably inside, and so does $0.35$; the test cannot tell them apart. The general rule comes from $\operatorname{Var}(s^2) = 2\sigma^4/(N-1)$: the relative standard deviation of $s$ itself is about $1/\sqrt{2(N-1)}$, so pinning a noise level to $10\%$ takes about $50$ samples and to $1\%$ about $5000$. Filter tuning parameters are variances, which is why a tuning campaign needs many runs before its numbers deserve three significant figures.
:::

## The innovation and its covariance

A Kalman filter repeats two steps. It **predicts**, carrying the estimate and covariance forward through the dynamics, $\hat{\mathbf{x}}_k^- = \mathbf{F}_{k-1}\hat{\mathbf{x}}_{k-1}^+$ and $\mathbf{P}_k^- = \mathbf{F}_{k-1}\mathbf{P}_{k-1}^+\mathbf{F}_{k-1}^{\mathsf{T}} + \mathbf{Q}_{k-1}$, which is the covariance propagation of the linear-transformations lesson with the process noise added because variances of independent terms add. It then **updates** with a measurement $\mathbf{z}_k = \mathbf{H}_k\mathbf{x}_k + \mathbf{v}_k$, $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R}_k)$. The superscripts mark before and after the update.

The quantity the whole update turns on is the **innovation**, the part of the measurement the filter did not already predict:

$$
\tilde{\mathbf{y}}_k = \mathbf{z}_k - \mathbf{H}_k\hat{\mathbf{x}}_k^-.
$$

Substituting the measurement model and writing $\mathbf{e}_k^- = \mathbf{x}_k - \hat{\mathbf{x}}_k^-$ for the prediction error,

$$
\tilde{\mathbf{y}}_k = \mathbf{H}_k\mathbf{e}_k^- + \mathbf{v}_k.
$$

The prediction error depends on past noise only and the new measurement noise is independent of it, so the two terms are uncorrelated and their covariances add. By the sandwich formula,

$$
\mathbf{S}_k = \operatorname{Cov}(\tilde{\mathbf{y}}_k) = \mathbf{H}_k\mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}} + \mathbf{R}_k.
$$

This is the **innovation covariance**: the filter's own prediction of how large the next measurement residual should be, combining what it does not know about the state with what it does not know about the sensor. The gain is $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}}\mathbf{S}_k^{-1}$, and the update is $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\tilde{\mathbf{y}}_k$.

For a correctly modelled linear-Gaussian system, the innovation sequence has three properties, and each one is a test.

1. It is **zero mean**: $\mathbb{E}[\tilde{\mathbf{y}}_k] = \mathbf{0}$. A persistent offset means an unmodelled bias or an unmodelled acceleration.
2. Its covariance is exactly $\mathbf{S}_k$. Too large and the filter is over-confident; too small and it is throwing away information.
3. It is **white**: $\mathbb{E}[\tilde{\mathbf{y}}_k\tilde{\mathbf{y}}_j^{\mathsf{T}}] = \mathbf{0}$ for $k \neq j$. All the predictable content has been extracted; what remains is new. Correlated innovations mean the filter is repeatedly failing to predict the same thing.

## NIS: normalised innovation squared

Whiten the innovation. The linear-transformations lesson showed that the squared length of a whitened vector is its squared Mahalanobis distance, so define

$$
\epsilon_k = \tilde{\mathbf{y}}_k^{\mathsf{T}}\,\mathbf{S}_k^{-1}\,\tilde{\mathbf{y}}_k.
$$

This is the **normalised innovation squared**, or NIS, and for a consistent filter it is $\chi^2_m$ with $m$ the dimension of the measurement. Its expected value is $m$, whatever the units, whatever the sensor, at every time step.

The decisive practical point is that NIS needs no truth. It is built from the measurement, the filter's own prediction and the filter's own $\mathbf{S}$, all available on board. It is the only consistency test you can run in flight, and it is computed inside the update step of essentially every production Kalman filter.

**Single-step gating.** Because a single $\epsilon_k$ is $\chi^2_m$, an unusually large one flags a measurement that does not fit. Rejecting a measurement when $\epsilon_k$ exceeds a chi-square quantile is the standard **innovation gate** or measurement editor:

| $m$ | $95\%$ gate | $99\%$ gate | $99.7\%$ gate |
| --- | --- | --- | --- |
| $1$ | $3.841$ | $6.635$ | $8.807$ |
| $2$ | $5.991$ | $9.210$ | $11.618$ |
| $3$ | $7.815$ | $11.345$ | $13.931$ |

**Time averaging.** A single $\epsilon_k$ is far too noisy to judge the tuning — at $m = 1$ its middle $95\%$ runs from $0.001$ to $5.024$. Average over $N$ steps. Because the innovations of a consistent filter are independent, the sum is chi-square with $Nm$ degrees of freedom, so

$$
\bar{\epsilon} = \frac{1}{N}\sum_{k=1}^{N}\epsilon_k \quad\text{lies in}\quad
\left[\frac{\chi^2_{Nm,\,\alpha/2}}{N},\ \frac{\chi^2_{Nm,\,1-\alpha/2}}{N}\right]
$$

with probability $1 - \alpha$. For $m = 1$ and $N = 200$ steps of flight data the $95\%$ band on $\bar\epsilon$ is $[0.814,\ 1.205]$ — a tight test from a little over three minutes at $1\,\mathrm{Hz}$.

## NEES: normalised estimation error squared

In simulation you have the truth, so you can test the thing that actually matters: the state error against the covariance the filter reports. Define the **normalised estimation error squared**,

$$
\epsilon_{x,k} = (\mathbf{x}_k - \hat{\mathbf{x}}_k)^{\mathsf{T}}\,\mathbf{P}_k^{-1}\,(\mathbf{x}_k - \hat{\mathbf{x}}_k),
$$

which for a consistent filter is $\chi^2_n$ with $n$ the number of states, so $\mathbb{E}[\epsilon_{x,k}] = n$. It is the squared Mahalanobis distance of the truth from the estimate, under the filter's own covariance; use the posterior $\mathbf{x}_k - \hat{\mathbf{x}}_k^+$ with $\mathbf{P}_k^+$, consistently.

NEES is averaged over **Monte Carlo runs**, not over time. Run $M$ independent simulations with independent noise and independent initial errors, and at each time step $k$ average the $M$ values of $\epsilon_{x,k}$. Those $M$ values are independent, so $M\bar\epsilon_x(k) \sim \chi^2_{Mn}$ and the band for $\bar\epsilon_x(k)$ is $[\chi^2_{Mn,\,\alpha/2}/M,\ \chi^2_{Mn,\,1-\alpha/2}/M]$. Plotting $\bar\epsilon_x(k)$ against that band across the whole trajectory is the standard consistency plot, and about $95\%$ of the steps should lie inside it. Averaging over time within a single run is not equivalent: consecutive state errors are strongly correlated, so a time average has far fewer effective degrees of freedom than its sample count suggests, and a band computed as though it had $Kn$ of them is far too tight.

```python
import math


def chi2_cdf(x, k):
    """Regularised lower incomplete gamma P(k/2, x/2) by its power series."""
    a, t = k / 2.0, x / 2.0
    if t <= 0.0:
        return 0.0
    term = total = 1.0 / a
    n = a
    while term > 1e-16 * total:
        n += 1.0
        term *= t / n
        total += term
    return total * math.exp(-t + a * math.log(t) - math.lgamma(a))


def acceptance_band(dof, level=0.95):
    """Two-sided chi-square interval holding `level` of the probability."""
    def quantile(p):
        lo, hi = 0.0, 4.0 * dof + 40.0
        for _ in range(100):
            mid = 0.5 * (lo + hi)
            if chi2_cdf(mid, dof) < p:
                lo = mid
            else:
                hi = mid
        return 0.5 * (lo + hi)
    tail = 0.5 * (1.0 - level)
    return quantile(tail), quantile(1.0 - tail)


runs, n_states, m_meas = 100, 2, 1
lo, hi = acceptance_band(runs * n_states)
print("NEES band:", lo / runs, hi / runs)
lo, hi = acceptance_band(runs * m_meas)
print("NIS  band:", lo / runs, hi / runs)

# NEES band: 1.6272798250184628 2.410578955063071
# NIS  band: 0.7422192747492374 1.2956119718583592
```

::: key
For a consistent filter the normalised innovation squared $\epsilon = \tilde{\mathbf{y}}^{\mathsf{T}}\mathbf{S}^{-1}\tilde{\mathbf{y}}$ is $\chi^2$ with $m$ degrees of freedom, $m$ being the measurement dimension, and $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$. Consistently high $\epsilon$ means the filter is over-confident. The normalised estimation error squared $\epsilon_x = (\mathbf{x} - \hat{\mathbf{x}})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \hat{\mathbf{x}})$ is $\chi^2_n$ with $n$ the state dimension, needs truth, and is averaged over $M$ Monte Carlo runs against the band $[\chi^2_{Mn,\,0.025}/M,\ \chi^2_{Mn,\,0.975}/M]$.
:::

::: example Tuning a constant-velocity filter, and three ways to get it wrong
Take a two-state filter tracking altitude and vertical speed, $\mathbf{x} = (p, v)$, at $\Delta t = 0.1\,\mathrm{s}$, driven by white acceleration noise of PSD $q_a = 0.5\,\mathrm{m^2/s^3}$, with a position measurement of $\sigma_r = 2\,\mathrm{m}$. So $n = 2$, $m = 1$, and the discrete process noise is the standard

$$
\mathbf{Q} = q_a\begin{bmatrix} \Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t \end{bmatrix}.
$$

Run $M = 100$ Monte Carlo trajectories of $K = 200$ steps, initialising each filter consistently so there is no start-up transient. The bands are $[\chi^2_{200,\,0.025}/100,\ \chi^2_{200,\,0.975}/100] = [1.627,\ 2.411]$ for the run-averaged NEES and $[\chi^2_{100,\,0.025}/100,\ \chi^2_{100,\,0.975}/100] = [0.742,\ 1.296]$ for the run-averaged NIS. Four cases, all with identical truth:

| Case | NEES | steps in band | NIS | steps in band | mean $\tilde{y}/\sqrt{S}$ | lag-1 autocorr |
| --- | --- | --- | --- | --- | --- | --- |
| Correct | $2.05$ | $195/200$ | $1.01$ | $189/200$ | $-0.008$ | $-0.003$ |
| $\mathbf{Q}$ ten times too small | $9.53$ | $10/200$ | $1.16$ | $156/200$ | $-0.016$ | $+0.109$ |
| $\mathbf{R}$ four times too small | $5.33$ | $0/200$ | $3.87$ | $1/200$ | $-0.009$ | $-0.039$ |
| Unmodelled $2\,\mathrm{m/s^2}$ | $11.61$ | $3/200$ | $1.71$ | $23/200$ | $+0.892$ | $-0.003$ |

The correctly tuned filter sits where it should: NEES $2.05$ against an expected $2$, NIS $1.01$ against an expected $1$, and $195$ and $189$ of the $200$ steps inside their $95\%$ bands, which is about the $190$ you would expect. Its actual RMS errors over the steady-state portion are $0.741\,\mathrm{m}$ and $0.798\,\mathrm{m/s}$ against a reported $\sqrt{P_{11}} = 0.745\,\mathrm{m}$ and $\sqrt{P_{22}} = 0.803\,\mathrm{m/s}$. The covariance is telling the truth to within half a per cent.

Each fault leaves a different fingerprint. With $\mathbf{Q}$ ten times too small the NEES is $9.5$ against an expected $2$: the filter reports $0.341\,\mathrm{m/s}$ of velocity uncertainty while actually carrying $0.947\,\mathrm{m/s}$ of error, over-confident by a factor of $2.8$. Yet its NIS is $1.16$ and sits inside the band at three-quarters of the steps — because the position channel's prediction uncertainty is small next to the $2\,\mathrm{m}$ measurement noise, so $\mathbf{S} \approx \mathbf{R}$ and the innovations barely notice. The signature that does catch it is the lag-one autocorrelation of the normalised innovations, $+0.109$, which for a pooled average over $100$ runs has a standard error of $0.008$ and is therefore thirteen standard errors from zero: an over-stiff filter lags the truth, so its residuals repeat themselves.

With $\mathbf{R}$ four times too small both tests fire, NEES $5.33$ and NIS $3.87$, and NIS is out of band at $199$ of $200$ steps. That is the easy case and the reason to trust NIS when it does speak: an understated $\mathbf{R}$ enters $\mathbf{S}$ directly. With an unmodelled $2\,\mathrm{m/s^2}$ acceleration the NEES is $11.6$ and the NIS $1.71$, but the diagnostic that identifies the cause is the mean normalised innovation of $+0.892$ against a standard error of $0.008$: the residuals are not scattered about zero, they are *biased*, which is what an unmodelled input looks like and what neither squared statistic on its own would tell you.
:::

## Reading the verdict

The test returns one of three answers.

**Inside the band.** The filter's covariance is a fair description of its error at the tested level. This is necessary, not sufficient: a filter can be consistent and still be worse than another consistent filter, because consistency says the error matches the claim, not that the error is small. Compare designs on the error itself, and use consistency to decide whether the comparison is meaningful.

**Above the band: over-confident.** $\mathbf{P}$ is too small for the errors actually occurring. The usual causes, in the order they are usually found: $\mathbf{Q}$ too small; $\mathbf{R}$ too small; an unmodelled state, such as a sensor bias or a lever arm, absorbing error the filter has nowhere to put; measurement noise correlated in time but modelled as white, which is what an unmodelled Gauss-Markov bias does; measurements timestamped wrong; and, in an extended filter, linearisation error across an uncertainty too large for the Jacobian to describe. This is the dangerous direction, because an over-confident filter gates out the measurements that would fix it and diverges quietly.

**Below the band: conservative.** $\mathbf{P}$ is larger than the errors warrant, usually from an inflated $\mathbf{Q}$ or $\mathbf{R}$. The estimate is safe but sluggish: information is being thrown away, gains are too low, and a real anomaly is harder to detect against the widened bounds. Engineers habitually tune slightly to this side, which is defensible as long as it is deliberate.

::: warning
A filter can pass an aggregate NEES test while one of its states is badly inconsistent, because the chi-square statistic is a *sum*: a state with too little uncertainty can be masked by another with too much. Always plot the individual normalised errors $(x_i - \hat{x}_i)/\sqrt{P_{ii}}$ as well, and check that each is a standard normal — zero mean, unit variance, about $5\%$ outside $\pm 1.96$. The aggregate says whether the total budget balances; the per-state plots say whether it balances for the right reasons.
:::

## How an engineer decides a filter is tuned

The procedure, in the order it is actually done.

1. **Set $\mathbf{R}$ from measurement data, not from the tuning knob.** The sensor's noise is measurable on a bench: the Allan deviation and the power spectral density of a static record give the white-noise level, and maximum likelihood gives the fit and its error bar. $\mathbf{R}$ is a physical quantity, and treating it as free is how tuning becomes guesswork.
2. **Set $\mathbf{Q}$ from the physics, then accept that it is also a fudge factor.** Part of $\mathbf{Q}$ is real — driving noise, quantisation, the discretised acceleration PSD above. The rest is the honest admission that the dynamics model is imperfect, and that part is tuned.
3. **Run a truth-model Monte Carlo.** Fifty to a hundred runs is usually enough, since the band at $M = 100$ and $n = 2$ is already $[1.63,\ 2.41]$. Plot $\bar\epsilon_x(k)$ against the band for the whole trajectory, including the initialisation transient, and plot the per-state normalised errors.
4. **Adjust $\mathbf{Q}$ and iterate.** The ratio is a usable first correction: a NEES sitting at $3n$ means the covariance is roughly three times too small somewhere. It is not exactly proportional, because $\mathbf{P}$ depends on $\mathbf{Q}$ through the Riccati recursion, so iterate two or three times rather than solving once.
5. **Check the innovations, not only their squares.** Mean, whiteness, per-channel. A zero-mean, white, correctly scaled innovation sequence is the complete statement that the filter has extracted everything the measurements contain.
6. **Move to hardware-in-the-loop and flight data, where only NIS exists.** Run the time-averaged test over windows of a few hundred steps and watch it across flight phases: a filter consistent in cruise and inconsistent during a manoeuvre is telling you which part of the dynamics model is inadequate. Keep the gate, size it from the chi-square quantile, and log every rejection, because a rising rejection rate is often the first symptom of a developing fault.

Then re-run the tests after *every* model change, because a $\mathbf{Q}$ tuned for one trajectory is not tuned for another, and keep them in the regression suite: NEES and NIS are cheap, automatable and quantitative, which makes them the rare engineering check a build server can enforce.

::: example Gating a GNSS update in flight
A filter carrying a local-level position state predicts with $\mathbf{P}^-$ giving position standard deviations of $1.2$, $1.5$ and $2.8\,\mathrm{m}$ on the three axes, and receives a GNSS fix with $\mathbf{R} = \operatorname{diag}(1.5^2, 1.5^2, 3.0^2)\,\mathrm{m^2}$. With $\mathbf{H}$ selecting position and the axes uncorrelated,

$$
\mathbf{S} = \operatorname{diag}(1.2^2 + 1.5^2,\ 1.5^2 + 1.5^2,\ 2.8^2 + 3.0^2) = \operatorname{diag}(3.69,\ 4.50,\ 16.84)\,\mathrm{m^2}.
$$

A fix arrives with innovation $\tilde{\mathbf{y}} = (2.1,\ -3.4,\ 5.2)\,\mathrm{m}$. Then

$$
\epsilon = \frac{2.1^2}{3.69} + \frac{3.4^2}{4.50} + \frac{5.2^2}{16.84} = 1.195 + 2.569 + 1.606 = 5.37,
$$

against an expectation of $m = 3$ and a $99.7\%$ gate of $13.93$. The measurement is accepted; its p-value, $P(\chi^2_3 > 5.37) = 0.15$, is unremarkable. The vertical residual of $5.2\,\mathrm{m}$ looked alarming in isolation and is not, because the vertical channel is the one both the filter and the receiver know least well — which is exactly the judgement the normalisation by $\mathbf{S}$ automates.

A later fix has $\tilde{\mathbf{y}} = (1.0,\ 2.0,\ 22.0)\,\mathrm{m}$, giving $\epsilon = 0.27 + 0.89 + 28.74 = 29.9$, with $P(\chi^2_3 > 29.9) = 1.4 \times 10^{-6}$. It is rejected: a multipath return or a cycle slip, not navigation information.

Two numbers govern the gate. A $99.7\%$ threshold discards $0.3\%$ of perfectly good measurements, which at $1\,\mathrm{Hz}$ is one every five and a half minutes — acceptable, and it must be budgeted for rather than treated as an anomaly. And the gate must be computed against $\mathbf{S}$, never against $\mathbf{R}$ alone: using $\mathbf{R}$ ignores the filter's own uncertainty, makes the gate too tight exactly when the filter is least certain, and produces the classic divergence trap in which an over-confident $\mathbf{P}^-$ shrinks $\mathbf{S}$, rejects the corrections, and shrinks $\mathbf{P}^-$ further.
:::

## Check yourself

::: check
A filter has $n = 6$ states and is tested over $M = 50$ Monte Carlo runs. The run-averaged NEES at a given step is $8.4$. Using $\chi^2_{300,\,0.025} = 253.9$ and $\chi^2_{300,\,0.975} = 349.9$, is the filter consistent at that step, and in which direction is it wrong?
:::

::: answer
The band for the average is $[253.9/50,\ 349.9/50] = [5.08,\ 7.00]$, and the expected value is $n = 6$. The observed $8.4$ is above the upper limit, so the filter is inconsistent and **over-confident**: the actual state errors are larger than the covariance it reports, by a factor of roughly $\sqrt{8.4/6} = 1.18$ in standard deviation. The first thing to try is increasing $\mathbf{Q}$; the things to check are an unmodelled state, a mis-timestamped measurement and, in an extended filter, linearisation error.
:::

::: check
Why can NIS be computed in flight while NEES cannot, and what does that cost you?
:::

::: answer
NIS is built from $\tilde{\mathbf{y}} = \mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-$ and $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, all of which the filter already has. NEES needs $\mathbf{x} - \hat{\mathbf{x}}$, and the true state is available only in simulation. The cost is sensitivity and scope. NIS sees only the error that projects into the measurement, and only relative to $\mathbf{R}$: in the worked example a filter with $\mathbf{Q}$ ten times too small had a NEES of $9.5$ against an expected $2$ while its NIS stayed at $1.16$, inside the band. Unobserved states can be badly inconsistent without NIS reacting at all, which is why the simulation campaign is where tuning is done and flight NIS is a monitor rather than a substitute.
:::

::: check
A filter's time-averaged NIS over $400$ steps of a three-dimensional measurement is $2.1$. The band is $[\chi^2_{1200,\,0.025}/400,\ \chi^2_{1200,\,0.975}/400] = [2.76,\ 3.24]$. What do you conclude, and what would you change?
:::

::: answer
The expected value is $m = 3$ and the observed $2.1$ is well below the lower limit of $2.76$, so the filter is **conservative**: its innovations are smaller than the $\mathbf{S}$ it predicts, by a factor of about $\sqrt{3/2.1} = 1.20$ in standard deviation. Either $\mathbf{R}$ is set larger than the sensor's true noise or $\mathbf{P}^-$ is inflated by an over-large $\mathbf{Q}$. The filter is safe but sluggish, with gains lower than optimal and more error than it needs to carry. Measure $\mathbf{R}$ from static sensor data first, since that is a physical quantity, and only then reduce $\mathbf{Q}$; and re-check with the state-error test in simulation, because reducing $\mathbf{Q}$ is exactly the change that creates over-confidence.
:::

::: check
The normalised innovations of a filter have mean $+0.6$, a variance close to one, and a lag-one autocorrelation within the whiteness band. Which of the three innovation properties has failed, and what class of modelling error does that point to?
:::

::: answer
The zero-mean property has failed while the scaling and the whiteness are fine. A persistent offset in the residuals means the filter is systematically predicting the measurement wrong in one direction, which is the signature of an unmodelled deterministic effect: a sensor bias with no corresponding state, a lever arm or mounting misalignment not accounted for, an unmodelled acceleration such as drag or a thrust tail-off, or a time-tag offset. Increasing $\mathbf{Q}$ would widen the covariance enough to bring a squared statistic back into band while leaving the bias untouched, so it hides the symptom rather than fixing the cause. The fix is to add the missing state or the missing term.
:::

::: check
Your NEES test passes comfortably, but the filter's position error is twice as large as the mission requires. What has the test told you, and what has it not?
:::

::: answer
It has told you that the filter's covariance is an honest description of its error: when it reports $\sigma$, it really is wrong by about $\sigma$. That is exactly what consistency means, and it means the reported covariance can be trusted by everything downstream. It has told you nothing about whether the error is small enough. Consistency is about honesty, performance is about magnitude, and improving performance needs better sensors, a better dynamics model, more measurements or better observability — not retuning. Retuning $\mathbf{Q}$ to make $\mathbf{P}$ smaller would only trade an honest filter for an over-confident one.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\chi^2_k = \sum_{i=1}^{k}Z_i^2$, mean $k$, variance $2k$ | Chi-square from squared standard normals; degrees of freedom add |
| $p_k(x) = x^{k/2-1}e^{-x/2}/(2^{k/2}\Gamma(k/2))$ | Density; CDF is the regularised incomplete gamma $P(k/2, x/2)$; $\chi^2_2$ is exponential |
| $d^2 = (\mathbf{x}-\boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu}) \sim \chi^2_n$ | Mahalanobis distance; $3\sigma$ holds $99.73\%$, $98.89\%$, $97.07\%$ in 1-D, 2-D, 3-D |
| $(N-1)s^2/\sigma^2 \sim \chi^2_{N-1}$ | Sample variance; gives the confidence interval for $\sigma$ |
| $J = \hat{\mathbf{v}}^{\mathsf{T}}\mathbf{R}^{-1}\hat{\mathbf{v}} \sim \chi^2_{m-n}$ | Least-squares goodness of fit: $m$ measurements, $n$ fitted parameters |
| $\tilde{\mathbf{y}}_k = \mathbf{z}_k - \mathbf{H}_k\hat{\mathbf{x}}_k^-$, $\mathbf{S}_k = \mathbf{H}_k\mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}} + \mathbf{R}_k$ | Innovation and its covariance; zero mean, covariance $\mathbf{S}$, white |
| $\epsilon_k = \tilde{\mathbf{y}}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\tilde{\mathbf{y}}_k \sim \chi^2_m$ | NIS; needs no truth; high means over-confident |
| $\epsilon_{x,k} = (\mathbf{x}_k - \hat{\mathbf{x}}_k)^{\mathsf{T}}\mathbf{P}_k^{-1}(\mathbf{x}_k - \hat{\mathbf{x}}_k) \sim \chi^2_n$ | NEES; needs truth; averaged over $M$ Monte Carlo runs |
| Band $[\chi^2_{Md,\,\alpha/2}/M,\ \chi^2_{Md,\,1-\alpha/2}/M]$ | Acceptance interval for an average of $M$ independent chi-squares of $d$ dof |
| Gate $\epsilon_k > \chi^2_{m,\,1-\alpha}$ | Innovation gate: $8.81$, $11.62$, $13.93$ at $99.7\%$ for $m = 1, 2, 3$ |
| Above band $\Rightarrow$ $\mathbf{P}$ too small; below $\Rightarrow$ too large | Over-confident versus conservative, and which knob to move |

That closes the module. You began with sample spaces and a coin, and you end with a quantitative decision procedure for whether a flight navigation filter deserves to be believed. Everything in between is load-bearing: the covariance sandwich propagates $\mathbf{P}$, the multivariate Gaussian gives the Mahalanobis distance, the central limit theorem justifies the Gaussian assumption, the noise-process lessons supply $\mathbf{Q}$ and $\mathbf{R}$, maximum likelihood produces the gain, the confidence interval puts an error bar on every tuning parameter, and Monte Carlo generates the runs the consistency test consumes. The estimation track that follows builds the Kalman filter itself; the statistics that tell you whether it is working are already in hand.
