---
id: l13-chi-square-and-filter-consistency
title: The chi-square distribution and filter consistency testing
minutes: 24
covers:
  - the chi-square distribution and filter consistency testing
---

A weather forecaster who says "70% chance of rain" makes a claim you can check. Collect all the days she said 70%. If it rained on about seven in ten, her numbers are honest. If it rained on every one, she was too sure of herself.

A navigation filter makes the same kind of claim. It outputs two things: an **estimate** and a **covariance**. The covariance is the filter saying how wrong it expects its estimate to be — and everything downstream believes it. Guidance sizes its margins from it; the measurement checker uses it to judge a GNSS fix; abort logic compares it against a limit. A filter three metres off while claiming one is more dangerous than one that admits three, because it will reject the very measurements that would correct it.

Checking that claim is **consistency testing**. If a filter is honest, its errors are Gaussian with the covariance it reports. Divide each error by that covariance and square it, and you get a sum of squared standard normals: a **chi-square** variable, with a known average and a known acceptance band. Land outside the band and the filter is lying, and the side says which setting is wrong. This lesson builds the distribution and then the two standard tests: **NEES** on the state error in simulation, and **NIS** on the measurement residuals in flight.

## The chi-square distribution

Throw darts at a target, each miss a standard normal in each direction. The *squared* distance from the bullseye is a sum of squared standard normals — a sum so common it has a name.

::: key Chi-square
If $Z_1, \ldots, Z_k$ are independent standard normal variables, then $\chi^2_k = \sum_{i=1}^{k} Z_i^2$ has the **[[chi-square distribution|chi-name]]** with $k$ **[[degrees of freedom|dof-meaning]]**. Its mean is $k$ and its variance is $2k$.
:::

Read $\chi^2_k$ as "chi-square with $k$ degrees of freedom" (χ is the Greek letter chi, said "kye").

### Mean and spread

Each $Z_i^2$ has mean $\mathbb{E}[Z^2] = 1$, the variance of a standard normal. Its variance uses the Gaussian fourth moment $\mathbb{E}[Z^4] = 3$:

$$
\operatorname{Var}(Z^2) = \mathbb{E}[Z^4] - \big(\mathbb{E}[Z^2]\big)^2 = 3 - 1 = 2.
$$

The terms are independent, so means add and variances add:

$$
\mathbb{E}[\chi^2_k] = k, \qquad \operatorname{Var}(\chi^2_k) = 2k, \qquad \operatorname{sd}(\chi^2_k) = \sqrt{2k}.
$$

The mean being exactly $k$ is what makes the method work: a normalised squared error with $k$ degrees of freedom should average $k$, and $\sqrt{2k}$ says how far it may stray. Independent chi-squares also add their degrees of freedom, $\chi^2_a + \chi^2_b = \chi^2_{a+b}$, straight from the definition, which lets a test pool many steps or runs into one number.

### Density and shape

The density — the curve whose area gives probability — is

$$
p_k(x) = \frac{x^{k/2 - 1}e^{-x/2}}{2^{k/2}\,\Gamma(k/2)}, \qquad x \geq 0.
$$

Here $\Gamma$ ("gamma") is the **[[gamma function|gamma-function]]**, a smooth version of the factorial. The CDF is the regularised lower incomplete gamma function $P(k/2,\ x/2)$, which the code later in this lesson computes. Two special cases are worth holding onto:

- $k = 1$ is one squared normal. Its density shoots to infinity at zero and is heavily lopsided.
- $k = 2$ is an exponential with mean $2$, so $P(\chi^2_2 \leq x) = 1 - e^{-x/2}$ exactly. That is why 2-D ellipse containments are tidy numbers.

The **[[shape changes with $k$|chi2-shapes]]**. At small $k$ it leans hard to the right, with a long tail. The lean, measured by the skewness $\sqrt{8/k}$, fades as $k$ grows, and the curve heads toward a Gaussian $\mathcal{N}(k, 2k)$. But the Gaussian is a poor stand-in until $k$ is large: it puts the $97.5\%$ point of $\chi^2_{100}$ at $100 + 1.96\sqrt{200} = 127.7$, against the true $129.6$. A better hand approximation, **[[Wilson–Hilferty|wilson-hilferty]]**, gets $129.56$.

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

Notice how the band tightens, relative to its centre, as $k$ grows. At $k = 1$ the middle $95\%$ spans a factor of five thousand. At $k = 200$ it is only about $\pm 20\%$ around the mean. So consistency tests average: one normalised error says almost nothing, two hundred say a lot.

## Three places it has already appeared

### Ellipsoid containment

The squared Mahalanobis distance $d^2 = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu})$ is, in the principal axes of the Gaussian lesson, a sum of $n$ squared independent standard normals. So it is $\chi^2_n$. The chance of lying inside the $k$-sigma ellipsoid is the chi-square CDF with $n$ degrees of freedom, evaluated at $k^2$:

| $n$ | $1\sigma$ | $2\sigma$ | $3\sigma$ |
| --- | --- | --- | --- |
| $1$ | $68.27\%$ | $95.45\%$ | $99.73\%$ |
| $2$ | $39.35\%$ | $86.47\%$ | $98.89\%$ |
| $3$ | $19.87\%$ | $73.85\%$ | $97.07\%$ |

::: key The 3σ ellipsoid in 3-D
About $97.07\%$ of a 3-D Gaussian lies inside the $3\sigma$ ellipsoid, not $99.73\%$ — the containment probability of a $k$-sigma ellipsoid comes from the chi-square CDF with $n$ degrees of freedom (2-D $3\sigma$ ≈ $98.89\%$).
:::

To enclose $99.73\%$ you need $\sqrt{\chi^2_{3,\,0.9973}} = 3.76\sigma$ in three dimensions and $3.44\sigma$ in two. So "the $3\sigma$ ellipsoid shall lie within the corridor" means different things in one, two and three dimensions.

### The sample variance

For $N$ independent Gaussian samples with sample variance $s^2$,

$$
\frac{(N-1)s^2}{\sigma^2} \sim \chi^2_{N-1}.
$$

(The symbol $\sim$ reads "is distributed as".) One degree of freedom is used up estimating the mean — Bessel's $N - 1$, seen from the other side. Turning the statement around gives an interval for the true variance:

$$
\left[\frac{(N-1)s^2}{\chi^2_{N-1,\,1-\alpha/2}},\ \frac{(N-1)s^2}{\chi^2_{N-1,\,\alpha/2}}\right].
$$

Here $\chi^2_{\nu,\,q}$ means the point with probability $q$ below it. The big quantile goes on the bottom of the lower limit.

### The least-squares residual

The maximum-likelihood lesson fitted $n$ parameters to $m$ weighted measurements, leaving a cost $J = \hat{\mathbf{v}}^{\mathsf{T}}\mathbf{R}^{-1}\hat{\mathbf{v}}$ built from the residuals $\hat{\mathbf{v}}$. These are $m$ normalised Gaussians tied together by $n$ fitted parameters, so $J \sim \chi^2_{m-n}$. This is the **chi-square goodness-of-fit test**.

The rate-table fit gave $J = 3.18$ with $m - n = 3$, and $P(\chi^2_3 > 3.18) = 0.36$ — entirely ordinary. So the straight-line model with $\sigma = 0.05\,^\circ/\mathrm{s}$ describes the data. A $J$ of $30$ would have meant the model was wrong or $\sigma$ understated.

::: example Is the gyro really a 0.2 °/h sensor?
The eight-sample bench test gave $s = 0.187\,^\circ/\mathrm{h}$ and $s^2 = 0.03511\,(^\circ/\mathrm{h})^2$.

**Step 1.** Scale up: $(N-1)s^2 = 7 \times 0.03511 = 0.2458$.

**Step 2.** Look up the quantiles for $\nu = N - 1 = 7$: $\chi^2_{7,\,0.025} = 1.690$ and $\chi^2_{7,\,0.975} = 16.013$.

**Step 3.** Divide:

$$
\left[\frac{0.2458}{16.013},\ \frac{0.2458}{1.690}\right] = [0.01535,\ 0.1454]\,(^\circ/\mathrm{h})^2.
$$

**Step 4.** Take square roots for the standard deviation: $[0.124,\ 0.381]\,^\circ/\mathrm{h}$.

Sanity check: the measured $0.187$ sits inside. But eight samples pin the noise only to within a factor of three: a datasheet claim of $0.2\,^\circ/\mathrm{h}$ fits, and so does $0.35$.

The general rule comes from $\operatorname{Var}(s^2) = 2\sigma^4/(N-1)$: the relative spread of $s$ is about $1/\sqrt{2(N-1)}$. Pinning a noise level to $10\%$ takes about $50$ samples; to $1\%$, about $5000$. Tuning parameters are variances, so a tuning campaign needs many runs before its numbers deserve three figures.
:::

## The innovation and its covariance

A Kalman filter repeats two steps. It **predicts**: $\hat{\mathbf{x}}_k^- = \mathbf{F}_{k-1}\hat{\mathbf{x}}_{k-1}^+$ and $\mathbf{P}_k^- = \mathbf{F}_{k-1}\mathbf{P}_{k-1}^+\mathbf{F}_{k-1}^{\mathsf{T}} + \mathbf{Q}_{k-1}$. That is the covariance rule of the linear-transformations lesson, plus process noise $\mathbf{Q}$. The superscript $-$ means "before the measurement" and $+$ means "after".

It then **updates** with a measurement $\mathbf{z}_k = \mathbf{H}_k\mathbf{x}_k + \mathbf{v}_k$, where $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R}_k)$ is sensor noise with covariance $\mathbf{R}_k$.

Everything in the update turns on the **[[innovation|innovation-word]]** — the part of the measurement the filter did not already predict, its surprise:

$$
\tilde{\mathbf{y}}_k = \mathbf{z}_k - \mathbf{H}_k\hat{\mathbf{x}}_k^-.
$$

Substitute the measurement model and write $\mathbf{e}_k^- = \mathbf{x}_k - \hat{\mathbf{x}}_k^-$ for the prediction error:

$$
\tilde{\mathbf{y}}_k = \mathbf{H}_k\mathbf{e}_k^- + \mathbf{v}_k.
$$

The prediction error depends only on past noise, so it is uncorrelated with the new sensor noise, and their covariances add. By the sandwich formula,

$$
\mathbf{S}_k = \operatorname{Cov}(\tilde{\mathbf{y}}_k) = \mathbf{H}_k\mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}} + \mathbf{R}_k.
$$

This is the **innovation covariance**: the filter's own prediction of how big the next surprise should be, from both its state uncertainty and the sensor's. The gain is $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}}\mathbf{S}_k^{-1}$ and the update is $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\tilde{\mathbf{y}}_k$.

For a correctly modelled linear-Gaussian system, the innovations have three properties, and each one is a test.

1. **Zero mean**, $\mathbb{E}[\tilde{\mathbf{y}}_k] = \mathbf{0}$. A persistent offset means an unmodelled bias or acceleration.
2. **Covariance exactly $\mathbf{S}_k$.** Too large and the filter is over-confident; too small and it is throwing information away.
3. **White**, $\mathbb{E}[\tilde{\mathbf{y}}_k\tilde{\mathbf{y}}_j^{\mathsf{T}}] = \mathbf{0}$ for $k \neq j$: everything predictable has been used. Correlated innovations mean the filter keeps failing to predict the same thing.

## NIS: normalised innovation squared

Divide the innovation by its own expected size and square it. For a vector, that is the squared Mahalanobis distance:

$$
\epsilon_k = \tilde{\mathbf{y}}_k^{\mathsf{T}}\,\mathbf{S}_k^{-1}\,\tilde{\mathbf{y}}_k.
$$

::: key NIS
Normalised innovation squared: $\epsilon = \tilde{\mathbf{y}}^{\mathsf{T}}\mathbf{S}^{-1}\tilde{\mathbf{y}}$, which is $\chi^2$ with $m$ degrees of freedom ($m$ = measurement dimension) for a consistent filter, where $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$. Consistently high $\epsilon$ means the filter is over-confident.
:::

Its expected value is $m$ at every step, whatever the sensor. And NIS needs no truth. It is built from the measurement, the prediction and $\mathbf{S}$ — all on board. It is the only consistency test you can run in flight, and it sits inside nearly every production Kalman filter.

### Single-step gating

Rejecting any measurement whose $\epsilon_k$ exceeds a chi-square quantile is the standard **[[innovation gate|gate-picture]]**:

| $m$ | $95\%$ gate | $99\%$ gate | $99.7\%$ gate |
| --- | --- | --- | --- |
| $1$ | $3.841$ | $6.635$ | $8.807$ |
| $2$ | $5.991$ | $9.210$ | $11.618$ |
| $3$ | $7.815$ | $11.345$ | $13.931$ |

### Time averaging

One $\epsilon_k$ is far too noisy to judge tuning (at $m = 1$ its middle $95\%$ runs from $0.001$ to $5.024$), so average over $N$ steps. A consistent filter's innovations are independent, so the sum is chi-square with $Nm$ degrees of freedom, and

$$
\bar{\epsilon} = \frac{1}{N}\sum_{k=1}^{N}\epsilon_k \quad\text{lies in}\quad
\left[\frac{\chi^2_{Nm,\,\alpha/2}}{N},\ \frac{\chi^2_{Nm,\,1-\alpha/2}}{N}\right]
$$

with probability $1 - \alpha$. For $m = 1$ and $N = 200$ steps of flight data, the $95\%$ band on $\bar\epsilon$ is $[162.728/200,\ 241.058/200] = [0.814,\ 1.205]$: a tight test from about three minutes of data at $1\,\mathrm{Hz}$.

## NEES: normalised estimation error squared

In simulation you know the truth, so you can test the real state error against the reported covariance. Define the **normalised estimation error squared**:

$$
\epsilon_{x,k} = (\mathbf{x}_k - \hat{\mathbf{x}}_k)^{\mathsf{T}}\,\mathbf{P}_k^{-1}\,(\mathbf{x}_k - \hat{\mathbf{x}}_k).
$$

For a consistent filter it is $\chi^2_n$, with $n$ the number of states, so $\mathbb{E}[\epsilon_{x,k}] = n$. Use the after-update error with the after-update covariance, $\mathbf{x}_k - \hat{\mathbf{x}}_k^+$ with $\mathbf{P}_k^+$, and do not mix them.

NEES is averaged over **Monte Carlo runs**, not over time. Run $M$ independent simulations and, at each step $k$, average the $M$ values. These are independent, so $M\bar\epsilon_x(k) \sim \chi^2_{Mn}$, and the band for $\bar\epsilon_x(k)$ is $[\chi^2_{Mn,\,\alpha/2}/M,\ \chi^2_{Mn,\,1-\alpha/2}/M]$. Plotting $\bar\epsilon_x(k)$ against that band along the trajectory is the standard **[[consistency plot|consistency-plot]]**, and about $95\%$ of the steps should lie inside.

Why not average over time within one run? Consecutive state errors are strongly correlated — an error now is mostly the error a moment ago — so a time average has far fewer independent pieces than it seems, and a band built as though it had $Kn$ degrees of freedom is far too tight.

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

::: key NEES
The normalised estimation error squared $\epsilon_x = (\mathbf{x} - \hat{\mathbf{x}})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \hat{\mathbf{x}})$ is $\chi^2_n$ with $n$ the state dimension. It needs the truth, and it is averaged over $M$ Monte Carlo runs against the band $[\chi^2_{Mn,\,0.025}/M,\ \chi^2_{Mn,\,0.975}/M]$.
:::

::: example Tuning a constant-velocity filter, and three ways to get it wrong
A two-state filter tracks altitude and vertical speed, $\mathbf{x} = (p, v)$, every $\Delta t = 0.1\,\mathrm{s}$. The truth is pushed by white acceleration noise of PSD $q_a = 0.5\,\mathrm{m^2/s^3}$, and a position sensor has noise $\sigma_r = 2\,\mathrm{m}$. So $n = 2$ and $m = 1$, and the discrete process noise is

$$
\mathbf{Q} = q_a\begin{bmatrix} \Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t \end{bmatrix}.
$$

Run $M = 100$ simulated flights of $K = 200$ steps each. Start every filter at its own settled covariance, so there is no start-up transient. The code above gives the bands: $[1.627,\ 2.411]$ for the run-averaged NEES and $[0.742,\ 1.296]$ for the run-averaged NIS. Four cases, identical truth:

| Case | NEES | steps in band | NIS | steps in band | mean $\tilde{y}/\sqrt{S}$ | lag-1 autocorr |
| --- | --- | --- | --- | --- | --- | --- |
| Correct | $2.01$ | $194/200$ | $0.99$ | $192/200$ | $-0.004$ | $-0.004$ |
| $\mathbf{Q}$ ten times too small | $10.67$ | $0/200$ | $1.16$ | $153/200$ | $-0.004$ | $+0.141$ |
| $\mathbf{R}$ four times too small | $5.04$ | $0/200$ | $3.80$ | $0/200$ | $-0.005$ | $-0.044$ |
| Unmodelled $2\,\mathrm{m/s^2}$ | $11.86$ | $1/200$ | $1.71$ | $15/200$ | $+0.833$ | $+0.026$ |

The last two columns test properties 1 and 3: the average normalised innovation, and how much each innovation resembles the one before (the lag-one autocorrelation). With $100 \times 200$ innovations, each has a standard error of about $0.007$.

**Correct.** NEES $2.01$ against an expected $2$; NIS $0.99$ against $1$; $194$ and $192$ of $200$ steps in band, about the $190$ expected at $95\%$. The actual RMS errors after the first $50$ steps are $0.744\,\mathrm{m}$ and $0.783\,\mathrm{m/s}$, against a reported $\sqrt{P_{11}} = 0.745\,\mathrm{m}$ and $\sqrt{P_{22}} = 0.803\,\mathrm{m/s}$. The covariance is telling the truth to within a few per cent.

**$\mathbf{Q}$ ten times too small.** NEES $10.7$. The filter reports $0.341\,\mathrm{m/s}$ of velocity uncertainty while carrying $0.925\,\mathrm{m/s}$ of error — over-confident by a factor of $2.7$. Yet its NIS is $1.16$, in band at three-quarters of the steps, because the position prediction's uncertainty is small next to the $2\,\mathrm{m}$ sensor noise: $\mathbf{S} \approx \mathbf{R}$, and the innovations barely notice. What catches it is the lag-one autocorrelation of $+0.141$, twenty standard errors from zero. A too-stiff filter lags the truth, so its surprises repeat.

**$\mathbf{R}$ four times too small.** Both tests fire: NEES $5.04$, NIS $3.80$, out of band at every step — the easy case, since $\mathbf{R}$ enters $\mathbf{S}$ directly.

**Unmodelled $2\,\mathrm{m/s^2}$ acceleration.** NEES $11.9$, NIS $1.71$. But the diagnostic that names the cause is the mean normalised innovation, $+0.833$ against a standard error of $0.007$. The surprises are not scattered around zero; they are *biased*, which neither squared statistic would tell you.
:::

## Reading the verdict

The test gives one of three answers.

**Inside the band.** The covariance fairly describes the error. That is necessary, not sufficient: consistency says the error matches the claim, not that it is small.

**Above the band: over-confident.** $\mathbf{P}$ is too small for the errors actually happening. The usual causes, roughly in the order they are found: $\mathbf{Q}$ too small; $\mathbf{R}$ too small; a missing state, such as a sensor bias or lever arm, so the error has nowhere to go; sensor noise that is correlated in time but modelled as white (what an unmodelled Gauss–Markov bias does); wrong time tags; and, in an extended filter, linearisation error. This is the dangerous direction. An over-confident filter gates out the measurements that would fix it and quietly **diverges** — drifts away from the truth.

**Below the band: conservative.** $\mathbf{P}$ is bigger than the errors warrant, usually from an inflated $\mathbf{Q}$ or $\mathbf{R}$. The estimate is safe but sluggish: gains are too low, information is wasted, and a real anomaly hides behind wide bounds. Engineers often tune slightly to this side on purpose, which is fine as long as it is deliberate.

::: warning A passing total can hide a failing state
A filter can pass an overall NEES test while one state is badly off, because the statistic is a *sum*: one state's too-small uncertainty can hide behind another's too-large one. Plot each state's normalised error $(x_i - \hat{x}_i)/\sqrt{P_{ii}}$ too, and check each is standard normal — zero mean, unit variance, about $5\%$ outside $\pm 1.96$. The total says whether the budget balances; the per-state plots say whether it balances for the right reasons.
:::

## How an engineer decides a filter is tuned

1. **Set $\mathbf{R}$ from measurement data, not a tuning knob.** Sensor noise can be measured on a bench, from the Allan deviation and PSD of a still record, with maximum likelihood giving the fit and its error bar.
2. **Set $\mathbf{Q}$ from the physics, then accept that it is partly a fudge factor.** Part is real — driving noise, the acceleration PSD above. The rest admits the dynamics model is imperfect, and that part is tuned.
3. **Run a truth-model Monte Carlo.** Fifty to a hundred runs is usually enough; at $M = 100$, $n = 2$ the band is already $[1.63,\ 2.41]$. Plot $\bar\epsilon_x(k)$ against it for the whole trajectory, start-up included, plus the per-state normalised errors.
4. **Adjust $\mathbf{Q}$ and repeat.** A NEES sitting at $3n$ means the covariance is roughly three times too small somewhere. The fix is not exactly proportional, because $\mathbf{P}$ depends on $\mathbf{Q}$ through the **[[Riccati recursion|riccati]]**, so iterate two or three times.
5. **Check the innovations, not only their squares.** Mean, whiteness, each channel. A zero-mean, white, correctly scaled innovation sequence is the full statement that the filter has used everything the measurements contain.
6. **Move to hardware tests and flight data, where only NIS exists.** Run the time-averaged test over windows of a few hundred steps, across flight phases: a filter consistent in cruise but not in a manoeuvre points at the weak part of its dynamics model. Size the gate from the chi-square table and log every rejection, since a rising rejection rate is often the first symptom of a fault.

Re-run the tests after *every* model change — a $\mathbf{Q}$ tuned for one trajectory is not tuned for another — and keep them in the automated test suite, where a build server can enforce them.

::: example Gating a GNSS update in flight
A filter predicts position (east, north, up) with standard deviations of $1.2$, $1.5$ and $2.8\,\mathrm{m}$. A GNSS fix arrives with $\mathbf{R} = \operatorname{diag}(1.5^2, 1.5^2, 3.0^2)\,\mathrm{m^2}$. With uncorrelated axes, $\mathbf{S}$ is diagonal, and each entry is prediction variance plus sensor variance:

$$
\mathbf{S} = \operatorname{diag}(1.2^2 + 1.5^2,\ 1.5^2 + 1.5^2,\ 2.8^2 + 3.0^2) = \operatorname{diag}(3.69,\ 4.50,\ 16.84)\,\mathrm{m^2}.
$$

**First fix.** The innovation is $\tilde{\mathbf{y}} = (2.1,\ -3.4,\ 5.2)\,\mathrm{m}$. For a diagonal $\mathbf{S}$, NIS is a sum of squared surprises, each divided by its own variance:

$$
\epsilon = \frac{2.1^2}{3.69} + \frac{3.4^2}{4.50} + \frac{5.2^2}{16.84} = 1.195 + 2.569 + 1.606 = 5.37.
$$

The expected value is $m = 3$ and the $99.7\%$ gate is $13.93$, so the fix is accepted. Its p-value, $P(\chi^2_3 > 5.37) = 0.15$, is unremarkable. The $5.2\,\mathrm{m}$ vertical surprise looks alarming, but vertical is the channel both filter and receiver know least well, and dividing by $\mathbf{S}$ makes that judgement automatically.

**Later fix.** $\tilde{\mathbf{y}} = (1.0,\ 2.0,\ 22.0)\,\mathrm{m}$ gives $\epsilon = 0.27 + 0.89 + 28.74 = 29.9$, and $P(\chi^2_3 > 29.9) = 1.4 \times 10^{-6}$. Rejected: a **[[multipath|multipath]]** return or a cycle slip, not navigation information.

Two things govern the gate. First, a $99.7\%$ threshold throws away $0.3\%$ of *good* measurements — at $1\,\mathrm{Hz}$, one every $1/0.003 = 333\,\mathrm{s}$, about five and a half minutes — which must be budgeted for, not treated as an anomaly. Second, the gate must use $\mathbf{S}$, never $\mathbf{R}$ alone: $\mathbf{R}$ ignores the filter's own uncertainty, so the gate is too tight exactly when the filter is least certain. That is the classic divergence trap: an over-confident $\mathbf{P}^-$ shrinks $\mathbf{S}$, the gate rejects the corrections, and $\mathbf{P}^-$ shrinks further.
:::

## Check yourself

::: check
A filter has $n = 6$ states and is tested over $M = 50$ Monte Carlo runs. The run-averaged NEES at a given step is $8.4$. Using $\chi^2_{300,\,0.025} = 253.9$ and $\chi^2_{300,\,0.975} = 349.9$, is the filter consistent at that step, and in which direction is it wrong?
:::

::: answer
The degrees of freedom are $Mn = 300$, which is why those quantiles apply. The band for the average is $[253.9/50,\ 349.9/50] = [5.08,\ 7.00]$, around an expected $n = 6$.

The observed $8.4$ is above the upper limit, so the filter is **over-confident**: its errors exceed its reported covariance by roughly $\sqrt{8.4/6} = 1.18$ in standard deviation. Try increasing $\mathbf{Q}$ first; then look for a missing state, a mis-timed measurement and, in an extended filter, linearisation error.
:::

::: check
Why can NIS be computed in flight while NEES cannot, and what does that cost you?
:::

::: answer
NIS is built from $\tilde{\mathbf{y}}$ and $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, which the filter already has. NEES needs $\mathbf{x} - \hat{\mathbf{x}}$, and the truth exists only in simulation.

The cost is sensitivity. NIS sees only the error that shows up in the measurement, and only relative to $\mathbf{R}$. In the worked example, the filter with $\mathbf{Q}$ ten times too small had NEES $10.7$ against an expected $2$, while its NIS stayed at $1.16$, in band. So tuning is done in simulation, and flight NIS is a monitor, not a substitute.
:::

::: check
A filter's time-averaged NIS over $400$ steps of a three-dimensional measurement is $2.1$. The band is $[\chi^2_{1200,\,0.025}/400,\ \chi^2_{1200,\,0.975}/400] = [2.76,\ 3.24]$. What do you conclude, and what would you change?
:::

::: answer
The expected value is $m = 3$, and $2.1$ is well below the lower limit of $2.76$. So the filter is **conservative**: its innovations are smaller than the $\mathbf{S}$ it predicts, by about $\sqrt{3/2.1} = 1.20$ in standard deviation.

Either $\mathbf{R}$ exceeds the sensor's true noise, or $\mathbf{P}^-$ is inflated by too large a $\mathbf{Q}$; the filter is safe but sluggish. Measure $\mathbf{R}$ from still sensor data first, since it is physical. Then reduce $\mathbf{Q}$ and re-check in simulation, because that is exactly the change that can tip a filter into over-confidence.
:::

::: check
The normalised innovations of a filter have mean $+0.6$, a variance close to one, and a lag-one autocorrelation within the whiteness band. Which of the three innovation properties has failed, and what class of modelling error does that point to?
:::

::: answer
The **zero-mean** property has failed; the scale and whiteness are fine. A steady offset means the filter keeps predicting the measurement wrong in one direction — the signature of an unmodelled, steady effect: a sensor bias with no state, an unaccounted lever arm or misalignment, an unmodelled acceleration such as drag or a thrust tail-off, or a time-tag offset.

Increasing $\mathbf{Q}$ could pull a squared statistic back into band while leaving the bias untouched — hiding the symptom. The fix is to add the missing state or term.
:::

::: check
Your NEES test passes comfortably, but the filter's position error is twice as large as the mission requires. What has the test told you, and what has it not?
:::

::: answer
It has told you the covariance is honest: when the filter reports $\sigma$, it really is wrong by about $\sigma$, so everything downstream can trust it. It has told you nothing about whether the error is small enough.

Consistency is honesty; performance is size. Better performance needs better sensors, a better model, more measurements or better observability. Retuning $\mathbf{Q}$ to shrink $\mathbf{P}$ would only trade an honest filter for an over-confident one.
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
| Band $[\chi^2_{Md,\,\alpha/2}/M,\ \chi^2_{Md,\,1-\alpha/2}/M]$ | Acceptance interval for an average of $M$ independent chi-squares of $d$ degrees of freedom |
| Gate $\epsilon_k > \chi^2_{m,\,1-\alpha}$ | Innovation gate: $8.81$, $11.62$, $13.93$ at $99.7\%$ for $m = 1, 2, 3$ |
| Above band $\Rightarrow$ $\mathbf{P}$ too small; below $\Rightarrow$ too large | Over-confident versus conservative, and which knob to move |

That closes the module. You began with sample spaces and end with a way to decide whether a flight navigation filter deserves to be believed. The covariance sandwich moves $\mathbf{P}$ forward, the Gaussian gives the Mahalanobis distance, the noise-process lessons supply $\mathbf{Q}$ and $\mathbf{R}$, and Monte Carlo generates the runs the test consumes. The estimation track builds the Kalman filter itself; the statistics that say whether it works are already in your hands.

::: context chi-name Where the name comes from
The distribution was worked out by the German geodesist Friedrich Helmert in the 1870s, while he studied the errors in land-survey measurements. It got its name from Karl Pearson, who in 1900 built his famous goodness-of-fit test on it and happened to write the key quantity with the Greek letter χ. The quantity was squared, so it became "chi-square". Like the Gaussian, it was born from measurement errors — the same job it does in a navigation filter.
:::

::: context dof-meaning What "degrees of freedom" counts
Degrees of freedom count how many independent squared pieces a sum really contains. Add up the squares of $k$ free standard normals and you have $k$. But if some pieces are tied together, you have fewer. Deviations from a sample mean always add to zero, so once you know $N - 1$ of them, the last one is fixed — which is why the sample variance has $N - 1$ degrees of freedom, and a fit with $n$ parameters leaves $m - n$.
:::

::: context gamma-function A factorial that fills the gaps
The factorial $n! = 1 \times 2 \times \cdots \times n$ only makes sense for whole numbers. The gamma function is a smooth curve through those points, shifted by one: $\Gamma(n) = (n-1)!$, so $\Gamma(1) = 1$, $\Gamma(2) = 1$, $\Gamma(3) = 2$, $\Gamma(4) = 6$. It also has values in between, such as $\Gamma(1/2) = \sqrt{\pi}$. The chi-square density needs $\Gamma(k/2)$, which is a half-integer whenever $k$ is odd — exactly the gaps the ordinary factorial cannot fill.
:::

::: context chi2-shapes Four chi-square curves
Densities for $k = 1$ (red), $2$ (dark), $3$ (blue) and $6$ (orange). The $k = 1$ curve runs off the top at zero. The $k = 2$ curve is an exponential starting at $0.5$. As $k$ grows the hump moves right, sitting near $k - 2$, and the curve gets wider and more symmetric.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="49.0,30.0 49.3,33.0 55.3,74.2 61.4,97.0 67.4,111.7 73.5,122.0 79.6,129.7 85.6,135.5 91.7,140.0 97.7,143.6 103.8,146.4 109.8,148.7 115.9,150.6 122.0,152.2 128.0,153.4 134.1,154.5 140.1,155.4 146.2,156.1 152.2,156.7 158.3,157.2 164.4,157.6 170.4,158.0 176.5,158.3 182.5,158.6 188.6,158.8 194.6,159.0 200.7,159.1 206.7,159.2 212.8,159.4 218.9,159.4 224.9,159.5 231.0,159.6 243.1,159.7 267.3,159.8 297.6,159.9 340.0,160.0"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40.0,30.0 45.4,45.3 50.7,58.8 56.1,70.7 61.4,81.2 66.8,90.4 72.1,98.6 77.5,105.8 82.9,112.2 88.2,117.8 93.6,122.8 98.9,127.1 104.3,131.0 109.6,134.4 115.0,137.4 120.4,140.1 125.7,142.4 131.1,144.5 136.4,146.3 141.8,147.9 147.1,149.3 152.5,150.6 157.9,151.7 163.2,152.7 168.6,153.5 179.3,155.0 190.0,156.1 200.7,156.9 211.4,157.6 222.1,158.1 232.9,158.6 243.6,158.9 254.3,159.1 265.0,159.3 281.1,159.5 297.1,159.7 318.6,159.8 340.0,159.9"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,160.0 45.4,114.2 50.7,102.9 56.1,98.3 61.4,97.1 66.8,97.9 72.1,100.0 77.5,102.8 82.9,106.0 88.2,109.5 93.6,113.0 98.9,116.5 104.3,119.9 109.6,123.2 115.0,126.3 120.4,129.2 125.7,131.9 131.1,134.5 136.4,136.8 141.8,139.0 147.1,141.0 152.5,142.8 157.9,144.4 163.2,146.0 168.6,147.4 173.9,148.6 179.3,149.7 184.6,150.8 190.0,151.7 200.7,153.3 211.4,154.6 222.1,155.7 232.9,156.5 243.6,157.2 254.3,157.8 265.0,158.2 281.1,158.7 297.1,159.1 318.6,159.4 340.0,159.6"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,160.0 45.4,159.1 50.7,156.8 56.1,153.7 61.4,150.1 66.8,146.4 72.1,142.7 77.5,139.3 82.9,136.1 88.2,133.3 93.6,130.9 98.9,128.9 104.3,127.4 109.6,126.2 115.0,125.4 120.4,125.0 125.7,124.8 131.1,124.9 136.4,125.3 141.8,125.9 147.1,126.7 152.5,127.6 157.9,128.6 163.2,129.7 168.6,130.9 173.9,132.1 179.3,133.4 184.6,134.7 190.0,136.0 195.4,137.2 200.7,138.5 206.1,139.7 211.4,141.0 216.8,142.1 222.1,143.3 227.5,144.3 232.9,145.4 238.2,146.4 243.6,147.3 248.9,148.2 254.3,149.1 259.6,149.8 265.0,150.6 270.4,151.3 275.7,152.0 281.1,152.6 286.4,153.2 291.8,153.7 297.1,154.2 302.5,154.7 307.9,155.1 313.2,155.5 318.6,155.9 323.9,156.2 329.3,156.5 334.6,156.8 340.0,157.1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="175">0</text><text x="82.9" y="175">2</text><text x="168.6" y="175">6</text><text x="254.3" y="175">10</text><text x="340" y="175">14</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="35" y="34">0.5</text><text x="35" y="99">0.25</text></g>
  <g font-size="11">
    <text x="70" y="70" fill="#b4232c">k=1</text><text x="100" y="118" fill="#1f2a44">k=2</text>
    <text x="68" y="90" fill="#1d6fd1">k=3</text><text x="130" y="118" fill="#f2b880">k=6</text>
  </g>
</svg>
```
:::

::: context wilson-hilferty A cube root that straightens the curve
In 1931 Edwin Wilson and Margaret Hilferty noticed that the lopsided chi-square becomes nearly Gaussian if you take a cube root. Their rule: $(\chi^2_k/k)^{1/3}$ is roughly normal with mean $1 - 2/(9k)$ and variance $2/(9k)$. For the $97.5\%$ point of $\chi^2_{100}$ it gives $100\,(1 - 0.00222 + 1.96 \times 0.0471)^3 = 129.56$, matching the exact $129.56$ to the shown figures — far better than the plain Gaussian's $127.7$. It was the way to get chi-square quantiles before computers made tables free.
:::

::: context innovation-word Why "innovation"
In everyday English an innovation is something new. In estimation the word means the same: the innovation is the *new* information in a measurement, the part that could not have been predicted from everything that came before. If the filter could have predicted it, it carries no news. That is why a good filter's innovations look like pure white noise — anything predictable in them is information the filter failed to use.
:::

::: context gate-picture What a gate looks like
For a two-axis measurement with $\mathbf{S} = \operatorname{diag}(3.69,\ 4.50)\,\mathrm{m^2}$ (the horizontal part of this lesson's GNSS example), the $99.7\%$ gate $\epsilon = 11.62$ is an ellipse with half-widths $\sqrt{11.62 \times 3.69} = 6.55\,\mathrm{m}$ east and $\sqrt{11.62 \times 4.50} = 7.23\,\mathrm{m}$ north. The surprise $(2.1,\ -3.4)\,\mathrm{m}$ falls inside; $(7.0,\ 5.0)\,\mathrm{m}$, with $\epsilon = 18.8$, falls outside. The dashed circle is the gate built from $\mathbf{R}$ alone — smaller, so too strict.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="100" x2="270" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="18" x2="180" y2="182" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="100" rx="65.5" ry="72.3" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="100" r="51.1" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="201" cy="134" r="5" fill="#1d6fd1"/>
  <circle cx="250" cy="50" r="5" fill="#b4232c"/>
  <text x="210" y="150" font-size="11" fill="#1d6fd1">accepted, ε = 3.76</text>
  <text x="258" y="46" font-size="11" fill="#b4232c">rejected, ε = 18.8</text>
  <text x="12" y="40" font-size="11" fill="#1d6fd1">gate with S</text>
  <text x="12" y="56" font-size="11" fill="#6c7a93">gate with R only</text>
  <text x="274" y="104" font-size="11" fill="#1f2a44">east</text>
  <text x="184" y="16" font-size="11" fill="#1f2a44">north</text>
  <text x="12" y="190" font-size="11" fill="#1f2a44">scale: 10 px = 1 m</text>
</svg>
```
:::

::: context consistency-plot What a consistency plot looks like
Run-averaged NEES over $100$ runs of this lesson's altitude filter, every fifth step. The thin grey strip is the $95\%$ band $[1.63,\ 2.41]$. The correctly tuned filter (blue) runs along inside it. The filter with $\mathbf{Q}$ ten times too small (red) sits far above, around $10$ — over-confident at every step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <rect x="50" y="137.6" width="290" height="7.3" fill="#6c7a93" fill-opacity="0.35"/>
  <line x1="50" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" points="50.0,80.3 57.3,72.9 64.6,63.4 71.9,59.4 79.1,53.1 86.4,55.9 93.7,54.6 101.0,42.3 108.3,54.9 115.6,59.7 122.9,71.4 130.2,67.8 137.4,78.7 144.7,65.4 152.0,53.8 159.3,66.7 166.6,56.2 173.9,62.1 181.2,70.9 188.4,74.0 195.7,57.4 203.0,65.7 210.3,61.9 217.6,62.4 224.9,65.5 232.2,74.8 239.4,73.9 246.7,56.2 254.0,59.0 261.3,55.1 268.6,60.2 275.9,59.8 283.2,55.5 290.5,56.4 297.7,53.5 305.0,49.1 312.3,60.3 319.6,60.9 326.9,59.8 334.2,38.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.5" points="50.0,141.9 57.3,139.9 64.6,140.8 71.9,142.8 79.1,142.3 86.4,142.0 93.7,140.8 101.0,137.8 108.3,141.4 115.6,141.8 122.9,142.0 130.2,143.3 137.4,142.0 144.7,141.8 152.0,140.0 159.3,142.1 166.6,141.2 173.9,142.2 181.2,142.8 188.4,141.8 195.7,139.7 203.0,141.6 210.3,139.4 217.6,140.5 224.9,142.7 232.2,145.5 239.4,142.5 246.7,140.9 254.0,141.6 261.3,140.9 268.6,140.2 275.9,140.8 283.2,138.8 290.5,142.0 297.7,142.7 305.0,141.4 312.3,142.2 319.6,142.5 326.9,139.5 334.2,136.9"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="164">0</text><text x="45" y="145">2</text><text x="45" y="117">5</text><text x="45" y="71">10</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="175">0</text><text x="195.7" y="175">100</text><text x="340" y="175">200 steps</text>
  </g>
  <text x="120" y="30" font-size="11" fill="#b4232c">Q ten times too small</text>
  <text x="120" y="128" font-size="11" fill="#1d6fd1">correct tuning, inside band</text>
</svg>
```
:::

::: context riccati A recursion with an old name
The covariance loop — predict with $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, then shrink with the gain — is a matrix **Riccati recursion**, named after Jacopo Riccati, an 18th-century Italian mathematician who studied the scalar equation of the same shape. The key feature is that $\mathbf{P}$ appears on both sides in a non-linear way, through $\mathbf{S}^{-1}$. So doubling $\mathbf{Q}$ does not double $\mathbf{P}$, and tuning takes a few passes rather than one division.
:::

::: context multipath Echoes in the signal
**Multipath** is a GNSS signal that reaches the antenna by bouncing off a building, the ground or the vehicle itself, as well as directly. The echo travels a longer path, so the receiver measures a range that is too long, sometimes by tens of metres. A **cycle slip** is a jump in the receiver's count of carrier-wave cycles after a brief loss of lock. Both produce a measurement that is confidently wrong — exactly what an innovation gate exists to catch.
:::
