---
id: l09-autocorrelation-and-power-spectral-density
title: Autocorrelation and power spectral density
minutes: 25
covers:
  - power spectral density and autocorrelation
---

The last two lessons described noise by its autocorrelation: a spike for white noise, a decaying exponential for a Gauss-Markov bias, $Q\min(t, s)$ for a random walk. Every one of those descriptions has an equivalent in the frequency domain, and it is the frequency-domain version that appears on datasheets, in the phrase "per root hertz", in the design of the anti-alias filter in front of an IMU's sampler, and in the reasoning about why a structural vibration at $47\,\mathrm{Hz}$ does or does not corrupt a navigation solution. The **power spectral density** (PSD) says how the variance of a random process is distributed across frequency, exactly as a Fourier transform says how the energy of a deterministic signal is.

This lesson defines the PSD, proves that it is the Fourier transform of the autocorrelation, computes it for the processes you already know, and establishes the one rule that makes it useful in design: a linear system multiplies the PSD of its input by the squared magnitude of its frequency response. It then returns to the time domain to show how the autocorrelation of a recorded signal is estimated and tested for whiteness, which is the test a filter's innovations must pass in the consistency lesson that closes the module.

## The autocorrelation function

For a wide-sense stationary process $X(t)$ with zero mean, the autocorrelation is $R_X(\tau) = \mathbb{E}[X(t)\,X(t + \tau)]$, a function of the separation $\tau$ alone. Three facts follow from the definition. It is even, $R_X(-\tau) = R_X(\tau)$, because the product does not care which factor comes first. Its value at zero is the variance, $R_X(0) = \mathbb{E}[X^2] = \sigma_X^2$. And it is bounded by that value, $|R_X(\tau)| \leq R_X(0)$, since by the Cauchy–Schwarz inequality $|\mathbb{E}[XY]| \leq \sqrt{\mathbb{E}[X^2]\mathbb{E}[Y^2]}$. The normalised form $\rho_X(\tau) = R_X(\tau)/R_X(0)$ is the correlation coefficient between the process and a copy of itself shifted by $\tau$, and the separation at which it falls to a small value is the process's **correlation time**.

If the mean $m_X$ is not zero, $R_X(\tau)$ contains a constant $m_X^2$ that never decays, and the quantity that behaves as described above is the **autocovariance** $C_X(\tau) = R_X(\tau) - m_X^2$. Noise models are built zero-mean, with any mean handled as a separate bias state, so the distinction rarely matters in a filter; it matters when analysing a raw record, where the mean must be removed first.

The two stationary autocorrelations met so far are, for continuous white noise of strength $Q$ and for a first-order Gauss-Markov process of variance $\sigma^2$ and correlation time $T$,

$$
R_w(\tau) = Q\,\delta(\tau), \qquad R_b(\tau) = \sigma^2 e^{-|\tau|/T}.
$$

## The power spectral density

> **Definition.** The power spectral density of a wide-sense stationary process is the Fourier transform of its autocorrelation function:
> $$
> S_X(\omega) = \int_{-\infty}^{\infty} R_X(\tau)\,e^{-j\omega\tau}\,d\tau, \qquad
> R_X(\tau) = \frac{1}{2\pi}\int_{-\infty}^{\infty} S_X(\omega)\,e^{j\omega\tau}\,d\omega.
> $$

This pairing is the **Wiener–Khinchin theorem**. The definition that motivates the name is different: take a realisation, truncate it to a window of length $2L$, Fourier transform it, and form $\mathbb{E}[|\hat{X}_L(\omega)|^2]/2L$, the expected power per unit bandwidth. The theorem states that as $L \to \infty$ this limit equals the transform of $R_X$. The proof is a change of variables: writing $|\hat{X}_L|^2$ as a double integral of $X(t)X(s)e^{-j\omega(t - s)}$, taking the expectation inside to produce $R_X(t - s)$, substituting $\tau = t - s$ and letting the window grow leaves exactly the integral above. What matters for use is the conclusion: the autocorrelation and the PSD carry identical information, one in time and one in frequency.

Because $R_X$ is real and even, $S_X$ is real and even too. It is also non-negative, as a power density must be. Setting $\tau = 0$ in the inverse transform gives the property that names it:

$$
\sigma_X^2 = R_X(0) = \frac{1}{2\pi}\int_{-\infty}^{\infty} S_X(\omega)\,d\omega.
$$

The variance is the total area under the PSD, and the PSD says which frequencies contribute how much of it.

Units follow from the transform. If $X$ is in $\mathrm{rad/s}$ and $\tau$ in seconds, $S_X$ is in $(\mathrm{rad/s})^2 \cdot \mathrm{s} = (\mathrm{rad/s})^2/\mathrm{Hz}$: variance per unit bandwidth. Its square root, in $\mathrm{rad/s}/\sqrt{\mathrm{Hz}}$, is the **noise density** the previous lessons used, and this is where the "per root hertz" comes from.

::: note
Conventions differ, and the differences are factors of two. The $S_X(\omega)$ above is **two-sided**, defined for negative and positive $\omega$, in radians per second. Engineers often use a **one-sided** density in hertz, $S_1(f) = 2\,S_X(2\pi f)$ for $f \geq 0$, chosen so that $\sigma_X^2 = \int_0^\infty S_1(f)\,df$ with no $2\pi$ and no negative frequencies. The factor of $2$ folds the negative-frequency half onto the positive, and the change from $d\omega/2\pi$ to $df$ is a pure relabelling. A datasheet noise density may be the square root of either $S_X$ or $S_1$, which is the $\sqrt{2}$ ambiguity flagged two lessons ago. In this module $Q$ and $\sqrt{Q}$ refer to the two-sided level, which is the one that appears in $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$ and in every Kalman-filter process-noise formula.
:::

## White noise is flat

Transform the white-noise autocorrelation: $\int Q\,\delta(\tau)e^{-j\omega\tau}\,d\tau = Q$. The PSD of white noise is the constant $Q$ at every frequency, which is what "white" means: equal power per unit bandwidth from zero to infinity. Its total area, and therefore its variance, is infinite, in agreement with the previous finding that $R_w(0) = Q\delta(0)$ diverges. The idealisation is now visible as a statement about frequency: no physical process can have a flat spectrum forever, but any process whose spectrum is flat out to well beyond the bandwidth of the system it drives may be treated as white.

**Band-limited white noise** makes this concrete. A process with $S_X(\omega) = Q$ for $|\omega| \leq 2\pi B$ and zero beyond has variance

$$
\sigma_X^2 = \frac{1}{2\pi}\int_{-2\pi B}^{2\pi B} Q\,d\omega = 2BQ,
$$

finite, and proportional to the bandwidth. Compare this with sampled white noise from the earlier lesson, whose per-sample variance was $Q f_s$. A sampler at rate $f_s$ can represent frequencies only up to the Nyquist frequency $f_s/2$; a white process band-limited to $B = f_s/2$ has variance $2 \cdot (f_s/2) \cdot Q = Q f_s$. The two pictures are the same picture. Averaging over the sample interval and band-limiting to the Nyquist frequency are two descriptions of the same act, and the per-sample sigma is the noise density times the square root of the sampled bandwidth.

::: key
The power spectral density $S_X(\omega)$ is the Fourier transform of the autocorrelation $R_X(\tau)$, and the variance is its total area, $\sigma_X^2 = \frac{1}{2\pi}\int S_X\,d\omega$. White noise has the flat PSD $S_w(\omega) = Q$; its noise density $\sqrt{Q}$ has units of the signal per $\sqrt{\mathrm{Hz}}$, and band-limiting it to $B$ hertz leaves variance $2BQ$.
:::

## The Gauss-Markov process is a Lorentzian

Transform the exponential autocorrelation, splitting the integral at zero:

$$
S_b(\omega) = \sigma^2\int_{-\infty}^{\infty} e^{-|\tau|/T}e^{-j\omega\tau}\,d\tau
= \sigma^2\left[\frac{1}{1/T + j\omega} + \frac{1}{1/T - j\omega}\right]
= \frac{2\sigma^2 T}{1 + \omega^2 T^2}.
$$

This shape, a constant at low frequency rolling off as $1/\omega^2$ at high frequency, is a **Lorentzian**, and it is the spectrum of any first-order low-pass process. Read its features. The low-frequency level is $S_b(0) = 2\sigma^2 T$, which, using $Q = 2\sigma^2/T$, is $Q T^2$: the driving white noise, amplified by the square of the time constant, because a slow integrator accumulates slow inputs. The **corner frequency**, where the PSD has fallen to half its low-frequency value, is at $\omega T = 1$:

$$
f_c = \frac{1}{2\pi T}.
$$

Above the corner the PSD falls by a factor of $100$ per decade of frequency, $-20\,\mathrm{dB}$ per decade. And the area check: $\frac{1}{2\pi}\int 2\sigma^2 T/(1 + \omega^2 T^2)\,d\omega = \frac{2\sigma^2 T}{2\pi}\cdot\frac{\pi}{T} = \sigma^2$, as it must be. Half of that variance lies below $f_c$ and half above, since $\int_0^{1/T} d\omega/(1 + \omega^2 T^2)$ is exactly half of $\int_0^\infty$; a Gauss-Markov bias with $T = 100\,\mathrm{s}$ has half its power at periods longer than $2\pi T = 628\,\mathrm{s}$.

::: example The spectrum of a gyro's errors
The gyro of the previous lesson has white rate noise with $Q_w = (0.005)^2 = 2.5 \times 10^{-5}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}$ and a Gauss-Markov bias with $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$. The bias PSD has low-frequency level $2\sigma^2 T = 1800\,(^\circ/\mathrm{h})^2/\mathrm{Hz}$; dividing by $3600^2$ to bring it into the same units as the white noise gives $1.39 \times 10^{-4}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}$, a density of $0.0118\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, about $2.4$ times the white-noise density. Its corner is at $f_c = 1/(2\pi \times 100) = 1.59 \times 10^{-3}\,\mathrm{Hz}$. The two spectra cross where $S_b(f) = Q_w$, that is where $1 + (f/f_c)^2 = 1.39 \times 10^{-4}/2.5 \times 10^{-5} = 5.56$, so $f = f_c\sqrt{4.56} = 2.13\,f_c = 3.4 \times 10^{-3}\,\mathrm{Hz}$, a period of about $290\,\mathrm{s}$.

The plot to hold in mind: a flat white floor across the whole band, and rising out of it below a few millihertz the Lorentzian hump of the bias. Everything the filter's aiding measurements need to correct lives in that hump; everything below the floor is unrecoverable and simply averages down. A gyro with a lower floor but the same hump would be no better over a ten-minute coast, and this is why the bias model, not the ARW, decides navigation performance.
:::

## Power-law spectra: random walk and flicker noise

Two more spectra complete the IMU picture. A random walk is not stationary, so its PSD does not exist in the strict sense, but it is the integral of white noise, and integration multiplies a spectrum by $1/\omega^2$, as the next section shows. Its PSD is therefore written $S(\omega) = Q/\omega^2$, rising without limit toward zero frequency, which is the spectral face of its unbounded variance. **Flicker noise**, the physical origin of the bias-instability floor on an Allan plot, has $S(\omega) \propto 1/|\omega|$, between white and random walk.

The three power laws map onto the three Allan-deviation slopes of the previous lesson, and the correspondence is worth memorising because a PSD estimate and an Allan plot are the two standard views of the same bench record:

| Noise | PSD $S(\omega)$ | Allan deviation $\sigma_A(\tau)$ | IMU name |
| --- | --- | --- | --- |
| White | $\propto \omega^0$ | $\propto \tau^{-1/2}$ | Angle / velocity random walk |
| Flicker | $\propto \omega^{-1}$ | $\propto \tau^{0}$ | Bias instability |
| Random walk | $\propto \omega^{-2}$ | $\propto \tau^{+1/2}$ | Rate / acceleration random walk |

The Gauss-Markov process is the stationary stand-in for the middle row: it is white ($\omega^0$) below its corner and random-walk-like ($\omega^{-2}$) above it, and with $T$ chosen at the Allan knee it approximates the flicker floor over the decade or two of frequency that a navigation filter cares about.

## Noise through a linear system

Here is the rule that makes the PSD a design tool. Pass a stationary process $x(t)$ through a linear time-invariant system with impulse response $h(t)$ and frequency response $H(j\omega) = \int h(t)e^{-j\omega t}\,dt$. The output is the convolution $y(t) = \int h(u)\,x(t - u)\,du$, and its autocorrelation is

$$
R_y(\tau) = \mathbb{E}[y(t)\,y(t + \tau)] = \int\!\!\int h(u)\,h(v)\,R_x(\tau + u - v)\,du\,dv,
$$

a double convolution of $R_x$ with $h$ and with the time-reversed $h$. Convolution in time is multiplication in frequency, and the transform of $h(-t)$ is the complex conjugate $H^*(j\omega)$, so

$$
S_y(\omega) = |H(j\omega)|^2\,S_x(\omega).
$$

The phase of $H$ is irrelevant; only the gain at each frequency matters, and it enters squared because the PSD is a power. The output variance is then $\frac{1}{2\pi}\int |H|^2 S_x\,d\omega$, an integral you can often do in closed form and always do numerically.

Two applications close the loop with the earlier lessons. First, an integrator has $H(j\omega) = 1/(j\omega)$, so $|H|^2 = 1/\omega^2$: integrating white noise of strength $Q$ gives $S = Q/\omega^2$, the random-walk spectrum claimed above. Second, the Gauss-Markov equation $\dot{b} = -b/T + w$ is the low-pass filter $H(j\omega) = 1/(j\omega + 1/T)$ driven by white noise, so

$$
S_b(\omega) = \frac{Q}{\omega^2 + 1/T^2} = \frac{Q T^2}{1 + \omega^2 T^2},
$$

the Lorentzian again, with $QT^2 = 2\sigma^2 T$ as before. The autocorrelation derivation and the transfer-function derivation agree, which is the Wiener–Khinchin theorem doing its job.

::: example White noise through an anti-alias filter
Before a gyro's $100\,\mathrm{Hz}$ output is sampled, its analogue noise is passed through a single-pole low-pass filter $H(j\omega) = 1/(1 + j\omega\tau_c)$ with time constant $\tau_c = 0.05\,\mathrm{s}$, a corner at $1/(2\pi\tau_c) = 3.18\,\mathrm{Hz}$. The output PSD is $Q/(1 + \omega^2\tau_c^2)$ and the output variance is

$$
\sigma_y^2 = \frac{1}{2\pi}\int_{-\infty}^{\infty}\frac{Q}{1 + \omega^2\tau_c^2}\,d\omega = \frac{Q}{2\pi}\cdot\frac{\pi}{\tau_c} = \frac{Q}{2\tau_c}.
$$

For $Q = 2.5 \times 10^{-5}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}$ this gives $\sigma_y = \sqrt{2.5 \times 10^{-5}/0.1} = 0.0158\,^\circ/\mathrm{s}$, against $0.05\,^\circ/\mathrm{s}$ for the unfiltered noise band-limited to the $50\,\mathrm{Hz}$ Nyquist frequency. The filter has removed most of the noise variance, and the quantity $1/(4\tau_c) = 5\,\mathrm{Hz}$ is the **equivalent noise bandwidth**: the width of an ideal brick-wall filter that would pass the same white-noise power. It is wider than the $3.18\,\mathrm{Hz}$ corner because the single pole's gentle roll-off lets through noise well above it. The price is a phase lag of $\tau_c = 50\,\mathrm{ms}$ at low frequency, which an attitude filter must know about; noise reduction and latency trade against each other in every sensor front end.
:::

::: warning
$|H|^2 S_x$ describes the *steady-state* output of a stable system driven by stationary noise. It says nothing about the transient after switch-on, and it does not apply to an unstable or marginally stable system such as a pure integrator, whose output never becomes stationary; there the formula gives the right power-law shape but the variance integral diverges, and you must return to the time domain, where $\operatorname{Var}(W(t)) = Qt$ is finite for every finite $t$. A PSD that is infinite at $\omega = 0$ is telling you the process has no steady state.
:::

## Estimating the autocorrelation and testing for whiteness

Given a zero-mean record $x_0, x_1, \ldots, x_{N-1}$ sampled at $\Delta t$, the **sample autocorrelation** at lag $k$ is

$$
r_k = \frac{1}{N - k}\sum_{i=0}^{N-k-1} x_i\,x_{i+k}, \qquad \hat{\rho}_k = \frac{r_k}{r_0},
$$

an estimate of $R_X(k\Delta t)$ and of $\rho_X(k\Delta t)$. It relies on ergodicity: a time average standing in for the ensemble average. Its scatter is the useful part. For a white sequence the true $\rho_k$ is zero for every $k \geq 1$, and each $\hat{\rho}_k$ is a sum of $N - k$ products of independent zero-mean variables, so by the central limit theorem it is approximately $\mathcal{N}(0, 1/N)$. That gives a **whiteness test**: if the sequence is white, about $95\%$ of the $\hat{\rho}_k$ for $k \geq 1$ should lie within

$$
\pm\frac{1.96}{\sqrt{N}}.
$$

For $N = 1000$ the band is $\pm 0.062$; for $N = 100$ it is $\pm 0.196$, wide enough that a correlation time of a few samples could hide in it. A record of $1000$ standard normal samples, run through this test for lags $1$ to $20$, produced a largest $|\hat{\rho}_k|$ of $0.079$ and two of the twenty lags outside the band, which is what one expects from $20$ trials at $5\%$. A sequence with several consecutive early lags all outside the band, and all of the same sign, is not white, and its correlation time is roughly the lag at which the estimate returns to the band.

::: example Recovering a Gauss-Markov autocorrelation from data
A $200\,000$-sample record of the $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$ bias process at $\Delta t = 1\,\mathrm{s}$ gives these normalised sample autocorrelations against the theoretical $e^{-k\Delta t/T}$:

| Lag $k$ | $\hat{\rho}_k$ | $e^{-k/100}$ |
| --- | --- | --- |
| $10$ | $0.907$ | $0.905$ |
| $50$ | $0.606$ | $0.607$ |
| $100$ | $0.366$ | $0.368$ |
| $200$ | $0.126$ | $0.135$ |
| $500$ | $-0.007$ | $0.007$ |

The fit is excellent at short lags and degrades at long ones, where the true value is small and the estimate's scatter, of order $1/\sqrt{N_{\text{eff}}}$ with $N_{\text{eff}} \approx N\Delta t/(2T) = 1000$ effectively independent stretches rather than $N$, is comparable to it. Reading $T$ off the lag at which $\hat{\rho}$ crosses $1/e$ gives $100\,\mathrm{s}$ to within a few seconds. Fitting a straight line to $\ln\hat{\rho}_k$ over lags $0$ to $100$ is the standard way to estimate $T$ from a record, and the maximum-likelihood lesson makes the estimate precise.
:::

The frequency-domain estimate is the **periodogram**, $|\hat{X}(f)|^2/N$ from a discrete Fourier transform of the record. Its problem is that its variance does not shrink as $N$ grows: each frequency bin is a single chi-square draw with two degrees of freedom, so a raw periodogram is as noisy at a million samples as at a thousand. The remedy, **Welch's method**, splits the record into segments, computes a periodogram of each and averages them, trading frequency resolution for variance. Averaging $M$ segments reduces the relative scatter to about $1/\sqrt{M}$. A noise-density figure read off a Welch estimate of a static record is the frequency-domain twin of the $\tau = 1\,\mathrm{s}$ point on the Allan plot, and the two should agree.

```python
import numpy as np

def sample_autocorr(x, max_lag):
    x = x - x.mean()
    r0 = np.dot(x, x) / len(x)
    return np.array([np.dot(x[:-k], x[k:]) / (len(x) - k) / r0 for k in range(1, max_lag + 1)])

rng = np.random.default_rng(1)
w = rng.standard_normal(1000)
rho = sample_autocorr(w, 20)
print(np.abs(rho).max(), 1.96 / np.sqrt(1000))  # ~0.08 against the 0.062 band
print(np.sum(np.abs(rho) > 1.96 / np.sqrt(1000)))  # ~1 of 20 outside, as expected
```

## Check yourself

::: check
A velocity error process has autocorrelation $R(\tau) = 4\,e^{-|\tau|/20}\,(\mathrm{m/s})^2$ with $\tau$ in seconds. Write its PSD, its low-frequency level, its corner frequency and its variance.
:::

::: answer
It is Gauss-Markov with $\sigma^2 = 4\,(\mathrm{m/s})^2$ and $T = 20\,\mathrm{s}$, so $S(\omega) = 2\sigma^2 T/(1 + \omega^2T^2) = 160/(1 + 400\,\omega^2)\,(\mathrm{m/s})^2/\mathrm{Hz}$. The low-frequency level is $160\,(\mathrm{m/s})^2/\mathrm{Hz}$, the corner is at $f_c = 1/(2\pi \times 20) = 7.96 \times 10^{-3}\,\mathrm{Hz}$, and the variance is $R(0) = 4\,(\mathrm{m/s})^2$, which is also $\frac{1}{2\pi}\int S\,d\omega$.
:::

::: check
White noise of strength $Q = 10^{-4}\,\mathrm{unit^2/Hz}$ drives a first-order low-pass filter with time constant $0.2\,\mathrm{s}$. What is the output standard deviation, and how would it change if the time constant were doubled?
:::

::: answer
The output variance is $Q/(2\tau_c) = 10^{-4}/0.4 = 2.5 \times 10^{-4}\,\mathrm{unit^2}$, so $\sigma_y = 0.0158\,\mathrm{unit}$. Doubling $\tau_c$ halves the variance and reduces the standard deviation by $\sqrt{2}$ to $0.0112\,\mathrm{unit}$, at the cost of doubling the filter's lag. Standard deviation falls only as the square root of the time constant, which is the low-pass version of the $\sigma/\sqrt{N}$ averaging law.
:::

::: check
A sensor sampled at $50\,\mathrm{Hz}$ shows white noise with a per-sample standard deviation of $0.1\,\mathrm{unit}$. What is the two-sided PSD level $Q$, the one-sided level $S_1$ and the noise density?
:::

::: answer
The per-sample variance of band-limited white noise is $Q f_s$, so $Q = 0.01/50 = 2 \times 10^{-4}\,\mathrm{unit^2/Hz}$, giving a noise density $\sqrt{Q} = 0.0141\,\mathrm{unit}/\sqrt{\mathrm{Hz}}$. The one-sided level is $S_1 = 2Q = 4 \times 10^{-4}\,\mathrm{unit^2/Hz}$; integrating it from $0$ to the Nyquist frequency of $25\,\mathrm{Hz}$ returns $0.01\,\mathrm{unit^2}$, the per-sample variance, as a check. A datasheet using the one-sided convention would quote $\sqrt{S_1} = 0.02\,\mathrm{unit}/\sqrt{\mathrm{Hz}}$ for the same sensor.
:::

::: check
The residuals of a filter over $N = 400$ steps have sample autocorrelations $\hat{\rho}_1 = 0.31$, $\hat{\rho}_2 = 0.18$, $\hat{\rho}_3 = 0.12$, $\hat{\rho}_4 = 0.05$, $\hat{\rho}_5 = -0.02$. Are the residuals white?
:::

::: answer
The $95\%$ band for a white sequence is $\pm 1.96/\sqrt{400} = \pm 0.098$. The first three lags lie outside it, all positive and decaying, which is the signature of a process with a correlation time of two or three steps, not of scatter. The residuals are not white: something the filter is not modelling, an unmodelled bias, a too-small process noise or a lagged measurement, is leaking correlated error into them. The consistency lesson turns this observation into a diagnostic.
:::

::: check
Explain, using the PSD, why a $100\,\mathrm{Hz}$ gyro with a rate noise density of $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ produces the same attitude random walk whether or not a $5\,\mathrm{Hz}$ anti-alias filter is applied to its output.
:::

::: answer
Attitude is the integral of rate, and the integrator's $|H|^2 = 1/\omega^2$ weights the rate PSD overwhelmingly toward low frequencies. The anti-alias filter has unit gain well below its corner, so it leaves the rate PSD unchanged at the frequencies that dominate the integrated error, and it reduces only the high-frequency content that the integration was already suppressing. The random-walk growth $\sigma_\theta = \sqrt{Q}\sqrt{t}$ depends on the PSD level at $\omega \to 0$, which the filter does not touch. The per-sample rate sigma drops from $0.05$ to about $0.016\,^\circ/\mathrm{s}$, which looks like an improvement on an oscilloscope and is no improvement at all in navigation.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $R_X(\tau) = \mathbb{E}[X(t)X(t + \tau)]$ | Autocorrelation; even, $R_X(0) = \sigma_X^2$, $\lvert R_X(\tau)\rvert \leq R_X(0)$ |
| $S_X(\omega) = \int R_X(\tau)e^{-j\omega\tau}\,d\tau$ | Power spectral density, two-sided, $(\text{unit})^2/\mathrm{Hz}$ (Wiener–Khinchin) |
| $\sigma_X^2 = \frac{1}{2\pi}\int S_X(\omega)\,d\omega = \int_0^\infty S_1(f)\,df$ | Variance is the area under the PSD; $S_1(f) = 2S_X(2\pi f)$ one-sided |
| $S_w(\omega) = Q$; band-limited to $B$: $\sigma^2 = 2BQ$ | White noise: flat spectrum, noise density $\sqrt{Q}$ |
| $S_b(\omega) = 2\sigma^2 T/(1 + \omega^2T^2)$, $f_c = 1/(2\pi T)$ | Gauss-Markov (Lorentzian): level $2\sigma^2T = QT^2$, $-20\,\mathrm{dB}$/decade above $f_c$ |
| $\omega^0$, $\omega^{-1}$, $\omega^{-2}$ $\leftrightarrow$ $\tau^{-1/2}$, $\tau^0$, $\tau^{+1/2}$ | White, flicker, random walk in PSD and Allan slopes |
| $S_y(\omega) = \lvert H(j\omega)\rvert^2 S_x(\omega)$ | Noise through a linear system |
| Single pole $1/(1 + j\omega\tau_c)$: $\sigma_y^2 = Q/(2\tau_c)$ | Low-passed white noise; equivalent noise bandwidth $1/(4\tau_c)$ |
| $\hat{\rho}_k = r_k/r_0$, white if $\lvert\hat{\rho}_k\rvert \lesssim 1.96/\sqrt{N}$ | Sample autocorrelation and the whiteness test |
| Periodogram, Welch averaging | PSD estimation; averaging $M$ segments cuts scatter by $\approx 1/\sqrt{M}$ |

The module now turns from describing noise to estimating from it. The next lesson introduces maximum likelihood estimation, the principle behind the sample mean, weighted least squares and the Kalman filter alike, and uses it to fit the Gauss-Markov parameters to a bias record rather than reading them off a plot.
