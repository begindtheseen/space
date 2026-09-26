---
id: l09-autocorrelation-and-power-spectral-density
title: Autocorrelation and power spectral density
minutes: 23
covers:
  - power spectral density and autocorrelation
---

Think of a music equalizer — the row of bars that jump up and down while a song plays. Each bar shows how much of the sound is at one pitch: bass on the left, treble on the right. The song is one wiggly signal in time. The equalizer shows the same signal sorted by frequency.

The last two lessons described noise in time, by its autocorrelation: a spike for white noise, a fading exponential for a Gauss-Markov bias, $Q\min(t, s)$ for a random walk. Each of those has a twin sorted by frequency — noise's own equalizer display. That frequency view is what datasheets use when they say "per root hertz". It is how engineers design the filter that sits in front of an IMU's sampler, and how they decide whether a structural vibration at $47\,\mathrm{Hz}$ will corrupt a navigation solution. It is called the **power spectral density** (PSD): it says how a random signal's variance is spread across frequency.

This lesson defines the PSD, shows that it is the Fourier transform of the autocorrelation, works it out for the noises you already know, and proves the rule that makes it a design tool: a linear system multiplies the input's PSD by the square of its gain. Then it comes back to time, to estimate an autocorrelation from a recording and test whether a signal is white — the test a filter's residuals must pass in the consistency lesson that closes the module.

## The autocorrelation function

A quick recap. For a wide-sense stationary process $X(t)$ with zero mean, the autocorrelation is

$$
R_X(\tau) = \mathbb{E}[X(t)\,X(t + \tau)],
$$

a function of the gap $\tau$ alone. Three facts follow from the definition:

- It is **even**, $R_X(-\tau) = R_X(\tau)$: the product does not care which factor comes first.
- At zero gap it is the variance, $R_X(0) = \mathbb{E}[X^2] = \sigma_X^2$.
- It never exceeds that value, $|R_X(\tau)| \leq R_X(0)$. This is the Cauchy–Schwarz inequality, $|\mathbb{E}[XY]| \leq \sqrt{\mathbb{E}[X^2]\,\mathbb{E}[Y^2]}$.

Dividing by the variance gives $\rho_X(\tau) = R_X(\tau)/R_X(0)$ ("rho"), the correlation coefficient between the process and a copy of itself slid by $\tau$. The gap at which it falls to a small value is the **correlation time**.

If the mean $m_X$ is not zero, $R_X(\tau)$ carries a constant $m_X^2$ that never fades. The quantity that behaves as above is then the **autocovariance** $C_X(\tau) = R_X(\tau) - m_X^2$. Noise models are built with zero mean, with any mean handled as a separate bias state, so in a filter the difference rarely matters. It does matter for a raw recording: subtract the mean first.

The two stationary autocorrelations so far, for white noise of strength $Q$ and for a Gauss-Markov process of variance $\sigma^2$ and correlation time $T$, are

$$
R_w(\tau) = Q\,\delta(\tau), \qquad R_b(\tau) = \sigma^2 e^{-|\tau|/T}.
$$

## The power spectral density

Here is the precise definition. It uses the **[[Fourier transform|fourier]]**, which turns a function of time into a function of frequency.

> **Definition.** The power spectral density of a wide-sense stationary process is the Fourier transform of its autocorrelation function:
> $$
> S_X(\omega) = \int_{-\infty}^{\infty} R_X(\tau)\,e^{-j\omega\tau}\,d\tau, \qquad
> R_X(\tau) = \frac{1}{2\pi}\int_{-\infty}^{\infty} S_X(\omega)\,e^{j\omega\tau}\,d\omega.
> $$

Here $\omega$ ("omega") is the angular frequency in radians per second, and $j$ is the **[[imaginary unit|j-unit]]**, $j^2 = -1$. The second formula runs the transform backward.

This pairing is the **[[Wiener–Khinchin theorem|wiener-khinchin]]**. The name "power spectral density" comes from a different starting point. Take one realization, cut out a window of length $2L$, Fourier transform it, square its size and divide by the window length: $\mathbb{E}[|\hat{X}_L(\omega)|^2]/2L$. That is the average power per unit of bandwidth. The theorem says that as the window grows ($L \to \infty$), this equals the transform of $R_X$.

::: note Why it has to be true
Write $|\hat{X}_L|^2$ as a double integral of $X(t)X(s)e^{-j\omega(t - s)}$ over the window. Take the expectation inside: $\mathbb{E}[X(t)X(s)] = R_X(t - s)$. Now change variables to the gap $\tau = t - s$. Each gap occurs along a strip of the window, and as the window grows, dividing by $2L$ leaves exactly $\int R_X(\tau)e^{-j\omega\tau}\,d\tau$.
:::

What matters for use: the autocorrelation and the PSD carry the same information, one sorted by time gap, one sorted by frequency.

Because $R_X$ is real and even, $S_X$ is real and even too. It is never negative, as a power must not be. And putting $\tau = 0$ into the backward transform gives the property that names it:

$$
\sigma_X^2 = R_X(0) = \frac{1}{2\pi}\int_{-\infty}^{\infty} S_X(\omega)\,d\omega.
$$

**The variance is the total area under the PSD.** The PSD says which frequencies contribute how much of it — like the equalizer bars adding up to the song's total loudness.

**Units.** If $X$ is in $\mathrm{rad/s}$ and $\tau$ in seconds, $S_X$ is in $(\mathrm{rad/s})^2 \cdot \mathrm{s} = (\mathrm{rad/s})^2/\mathrm{Hz}$: variance per unit of bandwidth. Its square root, in $\mathrm{rad/s}/\sqrt{\mathrm{Hz}}$, is the **noise density** of the last two lessons. This is where "per root hertz" comes from.

::: note One-sided and two-sided
Conventions differ, by factors of two. The $S_X(\omega)$ above is **two-sided**: defined for negative and positive $\omega$, in radians per second. Engineers often use a **one-sided** density in hertz,

$$
S_1(f) = 2\,S_X(2\pi f), \qquad f \geq 0,
$$

chosen so that $\sigma_X^2 = \int_0^\infty S_1(f)\,df$, with no $2\pi$ and no negative frequencies. The $2$ folds the negative half onto the positive half; the change from $d\omega/2\pi$ to $df$ is only relabeling. A datasheet noise density may be the square root of either one — the $\sqrt{2}$ puzzle flagged two lessons ago. In this module $Q$ and $\sqrt{Q}$ always mean the two-sided level, the one in $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$ and in every Kalman-filter process-noise formula.
:::

## White noise is flat

Transform the white-noise autocorrelation. The delta picks out the value of $e^{-j\omega\tau}$ at $\tau = 0$, which is $1$:

$$
S_w(\omega) = \int Q\,\delta(\tau)\,e^{-j\omega\tau}\,d\tau = Q.
$$

The PSD of white noise is the same constant $Q$ at every frequency. That is what "white" means: equal power per unit bandwidth, from zero to infinity. Its total area, and so its variance, is infinite — the same finding as $R_w(0) = Q\delta(0) = \infty$ in the random-process lesson. The idealization is now visible as a statement about frequency. No real process stays flat forever. But any process that is flat well beyond the frequencies the system responds to can be treated as white.

**Band-limited white noise** makes this concrete. Suppose $S_X(\omega) = Q$ up to $B$ hertz ($|\omega| \leq 2\pi B$) and zero beyond. Its variance is the area of a rectangle:

$$
\sigma_X^2 = \frac{1}{2\pi}\int_{-2\pi B}^{2\pi B} Q\,d\omega = \frac{1}{2\pi} \cdot 4\pi B \cdot Q = 2BQ.
$$

Finite now, and proportional to the bandwidth.

Compare this with sampled white noise, whose per-sample variance was $Q f_s$. A sampler at rate $f_s$ can only represent frequencies up to half its rate, the **[[Nyquist frequency|nyquist]]** $f_s/2$. White noise band-limited to $B = f_s/2$ has variance $2 \cdot (f_s/2) \cdot Q = Q f_s$. Same answer. Averaging over the sample interval and cutting off at the Nyquist frequency are two descriptions of the same act, and the per-sample sigma is the noise density times the square root of the sampled bandwidth.

::: key
The power spectral density $S_X(\omega)$ is the Fourier transform of the autocorrelation $R_X(\tau)$, and the variance is its total area, $\sigma_X^2 = \frac{1}{2\pi}\int S_X\,d\omega$. White noise has the flat PSD $S_w(\omega) = Q$; its noise density $\sqrt{Q}$ has units of the signal per $\sqrt{\mathrm{Hz}}$, and band-limiting it to $B$ hertz leaves variance $2BQ$.
:::

## The Gauss-Markov process is a Lorentzian

Now transform the fading exponential. Split the integral at $\tau = 0$, where the absolute value changes form, and integrate each exponential:

$$
S_b(\omega) = \sigma^2\int_{-\infty}^{\infty} e^{-|\tau|/T}e^{-j\omega\tau}\,d\tau
= \sigma^2\left[\frac{1}{1/T + j\omega} + \frac{1}{1/T - j\omega}\right]
= \frac{2\sigma^2 T}{1 + \omega^2 T^2}.
$$

(The last step puts the two fractions over the common bottom $1/T^2 + \omega^2$ and multiplies top and bottom by $T^2$.)

This shape — flat at low frequency, falling as $1/\omega^2$ at high frequency — is called a **[[Lorentzian|lorentzian]]**. It is the spectrum of every first-order low-pass process. Read its features:

- **Low-frequency level.** $S_b(0) = 2\sigma^2 T$. Using $Q = 2\sigma^2/T$, that is $QT^2$: the driving white noise, boosted by the time constant squared, because a slow process piles up slow inputs.
- **Corner frequency.** The PSD falls to half its low-frequency level where $\omega T = 1$, that is at

$$
f_c = \frac{1}{2\pi T}.
$$

- **Roll-off.** Above the corner, the PSD falls by a factor of $100$ for every factor of ten in frequency: $-20\,\mathrm{dB}$ per **[[decade|decibels]]**.
- **Area.** $\frac{1}{2\pi}\int 2\sigma^2 T/(1 + \omega^2 T^2)\,d\omega = \frac{2\sigma^2 T}{2\pi}\cdot\frac{\pi}{T} = \sigma^2$, as it must be.

In fact half the variance lies below $f_c$ and half above, since $\int_0^{1/T} d\omega/(1 + \omega^2 T^2) = \pi/(4T)$ is exactly half of $\int_0^\infty = \pi/(2T)$. A Gauss-Markov bias with $T = 100\,\mathrm{s}$ has half its power at periods longer than $2\pi T = 628\,\mathrm{s}$.

::: example The spectrum of a gyro's errors
The gyro from the last lesson has white rate noise $Q_w = (0.005)^2 = 2.5 \times 10^{-5}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}$ and a Gauss-Markov bias with $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$.

**Bias level.** $2\sigma^2 T = 2 \times 9 \times 100 = 1800\,(^\circ/\mathrm{h})^2/\mathrm{Hz}$. To compare with the white noise, convert hours to seconds — divide by $3600^2$: $1.39 \times 10^{-4}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}$. As a density, $\sqrt{1.39 \times 10^{-4}} = 0.0118\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, about $2.4$ times the white density.

**Corner.** $f_c = 1/(2\pi \times 100) = 1.59 \times 10^{-3}\,\mathrm{Hz}$.

**Crossing.** The bias spectrum drops to the white level where $S_b(f) = Q_w$, that is where

$$
1 + (f/f_c)^2 = \frac{1.39 \times 10^{-4}}{2.5 \times 10^{-5}} = 5.56,
$$

so $f = f_c\sqrt{4.56} = 2.13\,f_c = 3.4 \times 10^{-3}\,\mathrm{Hz}$, a period of about $290\,\mathrm{s}$. Sanity check: above the corner, as it must be, since at the corner the bias is still at half its level, well above the floor.

**The [[picture to hold in mind|gyro-psd]]:** a flat white floor across the whole band, and rising out of it below a few millihertz the Lorentzian hump of the bias. Everything the aiding measurements must correct lives in that hump. Everything in the floor is unrecoverable, and averages down. A gyro with a lower floor but the same hump would be no better over a ten-minute coast — which is why the bias model, not the ARW, decides navigation performance.
:::

## Power-law spectra: random walk and flicker noise

Two more spectra complete the IMU picture. A random walk is not stationary, so strictly it has no PSD. But it is the integral of white noise, and integrating divides a spectrum by $\omega^2$ (shown in the next section). So its PSD is written $S(\omega) = Q/\omega^2$, rising without limit toward zero frequency — the frequency-side face of its endless variance. **Flicker noise**, the source of the bias-instability floor on an Allan plot, has $S(\omega) \propto 1/|\omega|$, in between. (Read $\propto$ as "is proportional to".)

The three power laws match the three Allan-deviation slopes of the last lesson. A PSD estimate and an Allan plot are the two standard views of the same bench record, so this table is worth memorizing:

| Noise | PSD $S(\omega)$ | Allan deviation $\sigma_A(\tau)$ | IMU name |
| --- | --- | --- | --- |
| White | $\propto \omega^0$ | $\propto \tau^{-1/2}$ | Angle / velocity random walk |
| Flicker | $\propto \omega^{-1}$ | $\propto \tau^{0}$ | Bias instability |
| Random walk | $\propto \omega^{-2}$ | $\propto \tau^{+1/2}$ | Rate / acceleration random walk |

The Gauss-Markov process stands in for the middle row. It is flat ($\omega^0$) below its corner and falls like a random walk ($\omega^{-2}$) above it. With $T$ chosen at the Allan knee, it copies the flicker floor over the decade or two of frequency a navigation filter cares about.

## Noise through a linear system

Here is the rule that turns the PSD into a design tool. Think of a sound system's tone knob: turn down the treble and every high-pitched part of the music gets quieter by the same factor, whatever the song. A linear system does that to noise.

Pass a stationary process $x(t)$ through a **linear time-invariant** system — one whose response to a sum is the sum of responses, and which behaves the same today as tomorrow. It has an **impulse response** $h(t)$ (its output after one sharp kick) and a **frequency response** $H(j\omega) = \int h(t)e^{-j\omega t}\,dt$ (its gain and phase shift at each frequency). The output is the convolution $y(t) = \int h(u)\,x(t - u)\,du$ — a weighted sum of past inputs — and its autocorrelation is

$$
R_y(\tau) = \mathbb{E}[y(t)\,y(t + \tau)] = \int\!\!\int h(u)\,h(v)\,R_x(\tau + u - v)\,du\,dv.
$$

That is $R_x$ convolved with $h$ and with $h$ run backward in time. Convolution in time becomes multiplication in frequency, and the transform of $h(-t)$ is the complex conjugate $H^*(j\omega)$. Since $H H^* = |H|^2$,

$$
S_y(\omega) = |H(j\omega)|^2\,S_x(\omega).
$$

The phase of $H$ drops out. Only the gain at each frequency matters, and it enters squared, because a PSD is a power. The output variance is then $\frac{1}{2\pi}\int |H|^2 S_x\,d\omega$ — an integral you can often do by hand and can always do numerically.

Two uses tie this back to earlier lessons.

**An integrator** has $H(j\omega) = 1/(j\omega)$, so $|H|^2 = 1/\omega^2$. Integrating white noise of strength $Q$ gives $S = Q/\omega^2$: the random-walk spectrum claimed above.

**The Gauss-Markov equation** $\dot{b} = -b/T + w$ is the low-pass filter $H(j\omega) = 1/(j\omega + 1/T)$ driven by white noise. So

$$
S_b(\omega) = \frac{Q}{\omega^2 + 1/T^2} = \frac{Q T^2}{1 + \omega^2 T^2},
$$

the Lorentzian again, with $QT^2 = 2\sigma^2 T$ as before. Two completely different routes — through the autocorrelation and through the transfer function — give the same answer. That is the Wiener–Khinchin theorem doing its job.

::: example White noise through an anti-alias filter
Before a gyro's output is sampled at $100\,\mathrm{Hz}$, its analog noise passes through a single-pole low-pass filter, $H(j\omega) = 1/(1 + j\omega\tau_c)$, with time constant $\tau_c = 0.05\,\mathrm{s}$ ("tau sub c"). Its corner is at $1/(2\pi\tau_c) = 1/(2\pi \times 0.05) = 3.18\,\mathrm{Hz}$.

**Output PSD.** $|H|^2 = 1/(1 + \omega^2\tau_c^2)$, so the output PSD is $Q/(1 + \omega^2\tau_c^2)$.

**Output variance.** The area under it:

$$
\sigma_y^2 = \frac{1}{2\pi}\int_{-\infty}^{\infty}\frac{Q}{1 + \omega^2\tau_c^2}\,d\omega = \frac{Q}{2\pi}\cdot\frac{\pi}{\tau_c} = \frac{Q}{2\tau_c}.
$$

**Numbers.** For $Q = 2.5 \times 10^{-5}\,(^\circ/\mathrm{s})^2/\mathrm{Hz}$: $\sigma_y = \sqrt{2.5 \times 10^{-5}/0.1} = \sqrt{2.5 \times 10^{-4}} = 0.0158\,^\circ/\mathrm{s}$. Without the filter, noise band-limited at the $50\,\mathrm{Hz}$ Nyquist frequency has $\sigma = 0.05\,^\circ/\mathrm{s}$. The filter removed most of the noise variance.

**Equivalent noise bandwidth.** Set $Q/(2\tau_c)$ equal to the band-limited $2BQ$ and solve: $B = 1/(4\tau_c) = 5\,\mathrm{Hz}$. That is the width of an ideal brick-wall filter that would pass the same white-noise power. It is wider than the $3.18\,\mathrm{Hz}$ corner, because the single pole's gentle roll-off lets through some noise well above its corner.

**The price.** At low frequency the filter delays the signal by about $\tau_c = 50\,\mathrm{ms}$, and an attitude filter must know about that lag. Noise reduction and delay trade against each other in every sensor front end.
:::

::: warning
$|H|^2 S_x$ describes the *steady* output of a stable system driven by stationary noise. It says nothing about the transient after switch-on. And it does not apply to a system that never settles, such as a pure integrator: there the formula gives the right shape, but the variance integral is infinite. Go back to the time domain, where $\operatorname{Var}(W(t)) = Qt$ is finite for every finite $t$. A PSD that is infinite at $\omega = 0$ is telling you the process has no steady state.
:::

## Estimating the autocorrelation and testing for whiteness

Now back to time, and to real data. Given a zero-mean record $x_0, x_1, \ldots, x_{N-1}$ sampled every $\Delta t$, the **sample autocorrelation** at lag $k$ (a gap of $k$ samples) is

$$
r_k = \frac{1}{N - k}\sum_{i=0}^{N-k-1} x_i\,x_{i+k}, \qquad \hat{\rho}_k = \frac{r_k}{r_0}.
$$

It estimates $R_X(k\Delta t)$ and, after dividing by $r_0$, $\rho_X(k\Delta t)$. The hat on $\hat{\rho}$ marks an estimate. It leans on ergodicity: an average along time standing in for the ensemble average.

Its scatter is the useful part. For a white sequence the true $\rho_k$ is zero for every lag $k \geq 1$. Each $\hat{\rho}_k$ is then an average of $N - k$ products of independent zero-mean numbers, so by the central limit theorem it is roughly $\mathcal{N}(0, 1/N)$. That gives a **whiteness test**: if the sequence is white, about $95\%$ of the $\hat{\rho}_k$ for $k \geq 1$ should lie within

$$
\pm\frac{1.96}{\sqrt{N}}.
$$

For $N = 1000$ the band is $\pm 1.96/31.6 = \pm 0.062$. For $N = 100$ it is $\pm 0.196$ — so wide that a correlation time of a few samples could hide inside it.

A record of $1000$ standard normal samples, tested at lags $1$ to $20$ by the code below, gave a largest $|\hat{\rho}_k|$ of $0.078$, with **[[one of the twenty lags outside the band|whiteness-bars]]**. That is what you expect: at $5\%$ each, twenty lags should put about one outside by chance. A sequence with *several consecutive early lags* outside the band, all the same sign, is not white, and its correlation time is roughly the lag where the estimate returns inside.

```python
import numpy as np

def sample_autocorr(x, max_lag):
    x = x - x.mean()
    r0 = np.dot(x, x) / len(x)
    return np.array([np.dot(x[:-k], x[k:]) / (len(x) - k) / r0 for k in range(1, max_lag + 1)])

rng = np.random.default_rng(1)
w = rng.standard_normal(1000)
rho = sample_autocorr(w, 20)
print(round(np.abs(rho).max(), 3), round(1.96 / np.sqrt(1000), 3))  # 0.078 0.062
print(np.sum(np.abs(rho) > 1.96 / np.sqrt(1000)))                   # 1  (of 20)
```

::: example Recovering a Gauss-Markov autocorrelation from data
Simulate $200\,000$ samples of the $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$ bias at $\Delta t = 1\,\mathrm{s}$, with `gauss_markov(3.0, 100.0, 1.0, 200_000, seed=0)` from the last lesson, and run `sample_autocorr` on it. Compare with the theory $e^{-k\Delta t/T} = e^{-k/100}$:

| Lag $k$ | $\hat{\rho}_k$ | $e^{-k/100}$ |
| --- | --- | --- |
| $10$ | $0.907$ | $0.905$ |
| $50$ | $0.612$ | $0.607$ |
| $100$ | $0.369$ | $0.368$ |
| $200$ | $0.128$ | $0.135$ |
| $500$ | $0.028$ | $0.007$ |

The fit is excellent at short lags and loosens at long ones. Why? The scatter of the estimate is about $1/\sqrt{N_{\text{eff}}}$, where $N_{\text{eff}}$ counts *effectively independent* stretches, not samples. Neighboring samples are nearly copies of each other, so $N_{\text{eff}} \approx N\Delta t/(2T) = 200\,000/200 = 1000$, and $1/\sqrt{1000} = 0.03$ — about the size of the true value at long lags.

Reading $T$ off the lag where $\hat{\rho}$ first drops below $1/e$ gives $101\,\mathrm{s}$, within a few seconds of the true $100\,\mathrm{s}$. Fitting a straight line to $\ln\hat{\rho}_k$ over lags $0$ to $100$ is the standard way to estimate $T$ from a record; the maximum-likelihood lesson makes that estimate precise.
:::

The frequency-side estimate is the **periodogram**: $|\hat{X}(f)|^2/N$ from a discrete Fourier transform of the record. Its problem is that it does not get less noisy as the record gets longer. Each frequency bin is a single chi-square draw with two degrees of freedom, so a raw periodogram of a million samples is as ragged as one of a thousand. The fix is **[[Welch's method|welch]]**: cut the record into segments, compute a periodogram of each, and average them. Averaging $M$ segments shrinks the relative scatter to about $1/\sqrt{M}$, at the cost of coarser frequency resolution. A noise density read off a Welch estimate of a still record is the frequency-side twin of the $\tau = 1\,\mathrm{s}$ point on the Allan plot, and the two should agree.

## Check yourself

::: check
A velocity error process has autocorrelation $R(\tau) = 4\,e^{-|\tau|/20}\,(\mathrm{m/s})^2$ with $\tau$ in seconds. Write its PSD, its low-frequency level, its corner frequency and its variance.
:::

::: answer
Match it to the Gauss-Markov form: $\sigma^2 = 4\,(\mathrm{m/s})^2$ and $T = 20\,\mathrm{s}$.

- PSD: $S(\omega) = 2\sigma^2 T/(1 + \omega^2T^2) = 160/(1 + 400\,\omega^2)\,(\mathrm{m/s})^2/\mathrm{Hz}$.
- Low-frequency level: $S(0) = 2 \times 4 \times 20 = 160\,(\mathrm{m/s})^2/\mathrm{Hz}$.
- Corner: $f_c = 1/(2\pi \times 20) = 7.96 \times 10^{-3}\,\mathrm{Hz}$.
- Variance: $R(0) = 4\,(\mathrm{m/s})^2$, which is also $\frac{1}{2\pi}\int S\,d\omega$.
:::

::: check
White noise of strength $Q = 10^{-4}\,\mathrm{unit^2/Hz}$ drives a first-order low-pass filter with time constant $0.2\,\mathrm{s}$. What is the output standard deviation, and how would it change if the time constant were doubled?
:::

::: answer
The output variance is $Q/(2\tau_c) = 10^{-4}/0.4 = 2.5 \times 10^{-4}\,\mathrm{unit^2}$, so $\sigma_y = \sqrt{2.5 \times 10^{-4}} = 0.0158\,\mathrm{unit}$.

Doubling $\tau_c$ to $0.4\,\mathrm{s}$ halves the variance to $1.25 \times 10^{-4}$, so $\sigma_y$ drops by $\sqrt{2}$ to $0.0112\,\mathrm{unit}$ — at the cost of doubling the filter's lag. The standard deviation falls only as the square root of the time constant: the low-pass version of the $\sigma/\sqrt{N}$ averaging law.
:::

::: check
A sensor sampled at $50\,\mathrm{Hz}$ shows white noise with a per-sample standard deviation of $0.1\,\mathrm{unit}$. What is the two-sided PSD level $Q$, the one-sided level $S_1$ and the noise density?
:::

::: answer
The per-sample variance of band-limited white noise is $Q f_s$, so $Q = 0.1^2/50 = 0.01/50 = 2 \times 10^{-4}\,\mathrm{unit^2/Hz}$. The noise density is $\sqrt{Q} = 0.0141\,\mathrm{unit}/\sqrt{\mathrm{Hz}}$.

The one-sided level is $S_1 = 2Q = 4 \times 10^{-4}\,\mathrm{unit^2/Hz}$. Check: integrating it from $0$ to the $25\,\mathrm{Hz}$ Nyquist frequency gives $4 \times 10^{-4} \times 25 = 0.01\,\mathrm{unit^2}$, the per-sample variance.

A datasheet using the one-sided convention would quote $\sqrt{S_1} = 0.02\,\mathrm{unit}/\sqrt{\mathrm{Hz}}$ for the same sensor.
:::

::: check
The residuals of a filter over $N = 400$ steps have sample autocorrelations $\hat{\rho}_1 = 0.31$, $\hat{\rho}_2 = 0.18$, $\hat{\rho}_3 = 0.12$, $\hat{\rho}_4 = 0.05$, $\hat{\rho}_5 = -0.02$. Are the residuals white?
:::

::: answer
The $95\%$ band for a white sequence is $\pm 1.96/\sqrt{400} = \pm 1.96/20 = \pm 0.098$.

The first three lags lie outside it, all positive and shrinking. That is not chance scatter; it is the fingerprint of a process with a correlation time of two or three steps. So the residuals are not white. Something the filter does not model — an unmodeled bias, too little process noise, or a delayed measurement — is leaking correlated error into them. The consistency lesson turns this observation into a diagnostic.
:::

::: check
Explain, using the PSD, why a $100\,\mathrm{Hz}$ gyro with a rate noise density of $0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ produces the same attitude random walk whether or not the anti-alias filter of the example is applied to its output.
:::

::: answer
Attitude is the integral of rate, and the integrator's $|H|^2 = 1/\omega^2$ weights the rate PSD overwhelmingly toward low frequencies. The anti-alias filter has a gain of $1$ well below its corner, so it leaves the rate PSD untouched at the frequencies that dominate the integrated error. It removes only high-frequency noise that the integration was already suppressing.

The random-walk growth $\sigma_\theta = \sqrt{Q}\sqrt{t}$ depends on the PSD level as $\omega \to 0$, which the filter does not change. The per-sample rate sigma drops from $0.05$ to about $0.016\,^\circ/\mathrm{s}$ — which looks like an improvement on an oscilloscope and is no improvement at all for navigation.
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

Next lesson: from describing noise to estimating through it. **Maximum likelihood estimation** is the principle behind the sample mean, weighted least squares and the Kalman filter alike, and it will fit the Gauss-Markov parameters to a bias record with an error bar, instead of reading them off a plot.

::: context fourier Any signal is a stack of waves
The Fourier transform rests on one surprising fact: almost any signal can be built by adding up sine waves of different frequencies, each with its own size and starting point. The transform is the recipe — for each frequency, how much of that wave goes in. The factor $e^{-j\omega\tau}$ in the formula is a compact way to write a cosine and a sine of frequency $\omega$ at once. Joseph Fourier introduced the idea around 1807 while studying how heat spreads through a metal bar. The complex-numbers lesson in the trigonometry module built the $e^{j\theta}$ notation it uses.
:::

::: context j-unit Why engineers write j
Mathematicians write the square root of $-1$ as $i$. Electrical engineers already used $i$ for electric current, so they switched to $j$, and control and signal-processing engineers kept the habit. So $j^2 = -1$, and $e^{j\omega t} = \cos\omega t + j\sin\omega t$ is Euler's formula in engineer's spelling. NumPy follows the same custom: it writes the imaginary unit as `1j`.
:::

::: context wiener-khinchin Two mathematicians, one theorem
Norbert Wiener, the American mathematician who also put Brownian motion on solid ground, proved the result in 1930 for single signals. The Soviet mathematician Aleksandr Khinchin proved it in 1934 for stationary random processes. You will see the name spelled Khintchine, Khinchine and Khinchin; they are the same person. Einstein had written down the same idea in a short note in 1914, which went unnoticed for decades.
:::

::: context nyquist Too few samples tell lies
A sampler that takes $f_s$ samples a second cannot tell a frequency $f$ apart from $f_s - f$. Here a $9\,\mathrm{Hz}$ wave is sampled $10$ times a second — one second is shown. The dots land exactly on a $1\,\mathrm{Hz}$ wave (upside down).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="25.0" y1="90.0" x2="345.0" y2="90.0" stroke="#6c7a93" stroke-width="1"/>
  <path d="M25.0,90.0 L25.9,80.6 L26.8,71.5 L27.7,62.8 L28.6,54.7 L29.4,47.6 L30.3,41.5 L31.2,36.5 L32.1,32.9 L33.0,30.7 L33.9,30.0 L34.8,30.7 L35.7,32.9 L36.6,36.5 L37.4,41.5 L38.3,47.6 L39.2,54.7 L40.1,62.8 L41.0,71.5 L41.9,80.6 L42.8,90.0 L43.7,99.4 L44.6,108.5 L45.4,117.2 L46.3,125.3 L47.2,132.4 L48.1,138.5 L49.0,143.5 L49.9,147.1 L50.8,149.3 L51.7,150.0 L52.6,149.3 L53.4,147.1 L54.3,143.5 L55.2,138.5 L56.1,132.4 L57.0,125.3 L57.9,117.2 L58.8,108.5 L59.7,99.4 L60.6,90.0 L61.4,80.6 L62.3,71.5 L63.2,62.8 L64.1,54.7 L65.0,47.6 L65.9,41.5 L66.8,36.5 L67.7,32.9 L68.6,30.7 L69.4,30.0 L70.3,30.7 L71.2,32.9 L72.1,36.5 L73.0,41.5 L73.9,47.6 L74.8,54.7 L75.7,62.8 L76.6,71.5 L77.4,80.6 L78.3,90.0 L79.2,99.4 L80.1,108.5 L81.0,117.2 L81.9,125.3 L82.8,132.4 L83.7,138.5 L84.6,143.5 L85.4,147.1 L86.3,149.3 L87.2,150.0 L88.1,149.3 L89.0,147.1 L89.9,143.5 L90.8,138.5 L91.7,132.4 L92.6,125.3 L93.4,117.2 L94.3,108.5 L95.2,99.4 L96.1,90.0 L97.0,80.6 L97.9,71.5 L98.8,62.8 L99.7,54.7 L100.6,47.6 L101.4,41.5 L102.3,36.5 L103.2,32.9 L104.1,30.7 L105.0,30.0 L105.9,30.7 L106.8,32.9 L107.7,36.5 L108.6,41.5 L109.4,47.6 L110.3,54.7 L111.2,62.8 L112.1,71.5 L113.0,80.6 L113.9,90.0 L114.8,99.4 L115.7,108.5 L116.6,117.2 L117.4,125.3 L118.3,132.4 L119.2,138.5 L120.1,143.5 L121.0,147.1 L121.9,149.3 L122.8,150.0 L123.7,149.3 L124.6,147.1 L125.4,143.5 L126.3,138.5 L127.2,132.4 L128.1,125.3 L129.0,117.2 L129.9,108.5 L130.8,99.4 L131.7,90.0 L132.6,80.6 L133.4,71.5 L134.3,62.8 L135.2,54.7 L136.1,47.6 L137.0,41.5 L137.9,36.5 L138.8,32.9 L139.7,30.7 L140.6,30.0 L141.4,30.7 L142.3,32.9 L143.2,36.5 L144.1,41.5 L145.0,47.6 L145.9,54.7 L146.8,62.8 L147.7,71.5 L148.6,80.6 L149.4,90.0 L150.3,99.4 L151.2,108.5 L152.1,117.2 L153.0,125.3 L153.9,132.4 L154.8,138.5 L155.7,143.5 L156.6,147.1 L157.4,149.3 L158.3,150.0 L159.2,149.3 L160.1,147.1 L161.0,143.5 L161.9,138.5 L162.8,132.4 L163.7,125.3 L164.6,117.2 L165.4,108.5 L166.3,99.4 L167.2,90.0 L168.1,80.6 L169.0,71.5 L169.9,62.8 L170.8,54.7 L171.7,47.6 L172.6,41.5 L173.4,36.5 L174.3,32.9 L175.2,30.7 L176.1,30.0 L177.0,30.7 L177.9,32.9 L178.8,36.5 L179.7,41.5 L180.6,47.6 L181.4,54.7 L182.3,62.8 L183.2,71.5 L184.1,80.6 L185.0,90.0 L185.9,99.4 L186.8,108.5 L187.7,117.2 L188.6,125.3 L189.4,132.4 L190.3,138.5 L191.2,143.5 L192.1,147.1 L193.0,149.3 L193.9,150.0 L194.8,149.3 L195.7,147.1 L196.6,143.5 L197.4,138.5 L198.3,132.4 L199.2,125.3 L200.1,117.2 L201.0,108.5 L201.9,99.4 L202.8,90.0 L203.7,80.6 L204.6,71.5 L205.4,62.8 L206.3,54.7 L207.2,47.6 L208.1,41.5 L209.0,36.5 L209.9,32.9 L210.8,30.7 L211.7,30.0 L212.6,30.7 L213.4,32.9 L214.3,36.5 L215.2,41.5 L216.1,47.6 L217.0,54.7 L217.9,62.8 L218.8,71.5 L219.7,80.6 L220.6,90.0 L221.4,99.4 L222.3,108.5 L223.2,117.2 L224.1,125.3 L225.0,132.4 L225.9,138.5 L226.8,143.5 L227.7,147.1 L228.6,149.3 L229.4,150.0 L230.3,149.3 L231.2,147.1 L232.1,143.5 L233.0,138.5 L233.9,132.4 L234.8,125.3 L235.7,117.2 L236.6,108.5 L237.4,99.4 L238.3,90.0 L239.2,80.6 L240.1,71.5 L241.0,62.8 L241.9,54.7 L242.8,47.6 L243.7,41.5 L244.6,36.5 L245.4,32.9 L246.3,30.7 L247.2,30.0 L248.1,30.7 L249.0,32.9 L249.9,36.5 L250.8,41.5 L251.7,47.6 L252.6,54.7 L253.4,62.8 L254.3,71.5 L255.2,80.6 L256.1,90.0 L257.0,99.4 L257.9,108.5 L258.8,117.2 L259.7,125.3 L260.6,132.4 L261.4,138.5 L262.3,143.5 L263.2,147.1 L264.1,149.3 L265.0,150.0 L265.9,149.3 L266.8,147.1 L267.7,143.5 L268.6,138.5 L269.4,132.4 L270.3,125.3 L271.2,117.2 L272.1,108.5 L273.0,99.4 L273.9,90.0 L274.8,80.6 L275.7,71.5 L276.6,62.8 L277.4,54.7 L278.3,47.6 L279.2,41.5 L280.1,36.5 L281.0,32.9 L281.9,30.7 L282.8,30.0 L283.7,30.7 L284.6,32.9 L285.4,36.5 L286.3,41.5 L287.2,47.6 L288.1,54.7 L289.0,62.8 L289.9,71.5 L290.8,80.6 L291.7,90.0 L292.6,99.4 L293.4,108.5 L294.3,117.2 L295.2,125.3 L296.1,132.4 L297.0,138.5 L297.9,143.5 L298.8,147.1 L299.7,149.3 L300.6,150.0 L301.4,149.3 L302.3,147.1 L303.2,143.5 L304.1,138.5 L305.0,132.4 L305.9,125.3 L306.8,117.2 L307.7,108.5 L308.6,99.4 L309.4,90.0 L310.3,80.6 L311.2,71.5 L312.1,62.8 L313.0,54.7 L313.9,47.6 L314.8,41.5 L315.7,36.5 L316.6,32.9 L317.4,30.7 L318.3,30.0 L319.2,30.7 L320.1,32.9 L321.0,36.5 L321.9,41.5 L322.8,47.6 L323.7,54.7 L324.6,62.8 L325.4,71.5 L326.3,80.6 L327.2,90.0 L328.1,99.4 L329.0,108.5 L329.9,117.2 L330.8,125.3 L331.7,132.4 L332.6,138.5 L333.4,143.5 L334.3,147.1 L335.2,149.3 L336.1,150.0 L337.0,149.3 L337.9,147.1 L338.8,143.5 L339.7,138.5 L340.6,132.4 L341.4,125.3 L342.3,117.2 L343.2,108.5 L344.1,99.4 L345.0,90.0" fill="none" stroke="#8fb8f0" stroke-width="1.4"/>
  <path d="M25.0,90.0 L29.0,94.7 L33.0,99.4 L37.0,104.0 L41.0,108.5 L45.0,113.0 L49.0,117.2 L53.0,121.3 L57.0,125.3 L61.0,129.0 L65.0,132.4 L69.0,135.6 L73.0,138.5 L77.0,141.2 L81.0,143.5 L85.0,145.4 L89.0,147.1 L93.0,148.3 L97.0,149.3 L101.0,149.8 L105.0,150.0 L109.0,149.8 L113.0,149.3 L117.0,148.3 L121.0,147.1 L125.0,145.4 L129.0,143.5 L133.0,141.2 L137.0,138.5 L141.0,135.6 L145.0,132.4 L149.0,129.0 L153.0,125.3 L157.0,121.3 L161.0,117.2 L165.0,113.0 L169.0,108.5 L173.0,104.0 L177.0,99.4 L181.0,94.7 L185.0,90.0 L189.0,85.3 L193.0,80.6 L197.0,76.0 L201.0,71.5 L205.0,67.0 L209.0,62.8 L213.0,58.7 L217.0,54.7 L221.0,51.0 L225.0,47.6 L229.0,44.4 L233.0,41.5 L237.0,38.8 L241.0,36.5 L245.0,34.6 L249.0,32.9 L253.0,31.7 L257.0,30.7 L261.0,30.2 L265.0,30.0 L269.0,30.2 L273.0,30.7 L277.0,31.7 L281.0,32.9 L285.0,34.6 L289.0,36.5 L293.0,38.8 L297.0,41.5 L301.0,44.4 L305.0,47.6 L309.0,51.0 L313.0,54.7 L317.0,58.7 L321.0,62.8 L325.0,67.0 L329.0,71.5 L333.0,76.0 L337.0,80.6 L341.0,85.3 L345.0,90.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 3"/>
  <circle cx="25.0" cy="90.0" r="4" fill="#1f2a44"/>
  <circle cx="57.0" cy="125.3" r="4" fill="#1f2a44"/>
  <circle cx="89.0" cy="147.1" r="4" fill="#1f2a44"/>
  <circle cx="121.0" cy="147.1" r="4" fill="#1f2a44"/>
  <circle cx="153.0" cy="125.3" r="4" fill="#1f2a44"/>
  <circle cx="185.0" cy="90.0" r="4" fill="#1f2a44"/>
  <circle cx="217.0" cy="54.7" r="4" fill="#1f2a44"/>
  <circle cx="249.0" cy="32.9" r="4" fill="#1f2a44"/>
  <circle cx="281.0" cy="32.9" r="4" fill="#1f2a44"/>
  <circle cx="313.0" cy="54.7" r="4" fill="#1f2a44"/>
  <circle cx="345.0" cy="90.0" r="4" fill="#1f2a44"/>
  <text x="25.0" y="172.0" font-size="11" fill="#1f2a44" text-anchor="start">blue: a 9 Hz signal · dots: samples taken 10 times a second</text>
  <text x="25.0" y="188.0" font-size="11" fill="#b4232c" text-anchor="start">red: the 1 Hz wave the samples appear to show</text>
</svg>
```

This fake low frequency is called **aliasing**. Any noise above the Nyquist frequency $f_s/2$ folds down and poses as low-frequency signal, which is why a sensor puts an **anti-alias filter** in front of its sampler to remove it first.
:::

::: context lorentzian Named after a physicist of light
The curve $1/(1 + x^2)$ is named after the Dutch physicist Hendrik Lorentz, who used it around the start of the 1900s to describe the shape of spectral lines — the narrow colors given off by glowing gases. In probability the same curve, scaled to area one, is the **Cauchy distribution**. In a PSD it marks any process with one time constant: a leaky integrator, a first-order filter, a Gauss-Markov bias.
:::

::: context decibels Counting factors of ten
A **decibel** (dB) measures a power ratio on a log scale: $10\log_{10}$ of the ratio. A factor of $10$ in power is $10\,\mathrm{dB}$; a factor of $100$ is $20\,\mathrm{dB}$. A **decade** is a factor of ten in frequency. Above its corner the Lorentzian goes as $1/\omega^2$, so ten times the frequency means one hundredth the power: $-20\,\mathrm{dB}$ per decade. On log-log axes that is a straight line of slope $-2$, which is why Bode plots and PSD plots are drawn that way.
:::

::: context gyro-psd The gyro's error spectrum
This is the example's gyro, on log-log axes. The dashed grey line is the white floor $Q_w = 2.5 \times 10^{-5}$. The dashed orange curve is the bias Lorentzian, flat at $1.39 \times 10^{-4}$ below the corner (orange dot, $1.59\,\mathrm{mHz}$) and falling at slope $-2$ above it. The solid blue curve is their sum.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50.0" y1="170.0" x2="345.0" y2="170.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50.0" y1="15.0" x2="50.0" y2="170.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50.0" y1="170.0" x2="50.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">10⁻⁵</text>
  <line x1="109.0" y1="170.0" x2="109.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="109.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">10⁻⁴</text>
  <line x1="168.0" y1="170.0" x2="168.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="168.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">10⁻³</text>
  <line x1="227.0" y1="170.0" x2="227.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="227.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">10⁻²</text>
  <line x1="286.0" y1="170.0" x2="286.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="286.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">0.1</text>
  <line x1="345.0" y1="170.0" x2="345.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="345.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <line x1="46.0" y1="170.0" x2="50.0" y2="170.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="43.0" y="174.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁶</text>
  <line x1="46.0" y1="118.3" x2="50.0" y2="118.3" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="43.0" y="122.3" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁵</text>
  <line x1="46.0" y1="66.7" x2="50.0" y2="66.7" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="43.0" y="70.7" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁴</text>
  <line x1="46.0" y1="15.0" x2="50.0" y2="15.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="43.0" y="19.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁻³</text>
  <text x="345.0" y="200.0" font-size="11" fill="#1f2a44" text-anchor="end">frequency f (Hz)</text>
  <line x1="50.0" y1="97.8" x2="345.0" y2="97.8" stroke="#6c7a93" stroke-width="1.4" stroke-dasharray="5 3"/>
  <path d="M50.0,59.3 L52.5,59.3 L54.9,59.3 L57.4,59.3 L59.8,59.3 L62.3,59.3 L64.8,59.3 L67.2,59.3 L69.7,59.3 L72.1,59.3 L74.6,59.3 L77.0,59.3 L79.5,59.3 L82.0,59.3 L84.4,59.3 L86.9,59.3 L89.3,59.3 L91.8,59.3 L94.2,59.3 L96.7,59.3 L99.2,59.3 L101.6,59.3 L104.1,59.4 L106.5,59.4 L109.0,59.4 L111.5,59.4 L113.9,59.4 L116.4,59.5 L118.8,59.5 L121.3,59.5 L123.8,59.6 L126.2,59.6 L128.7,59.7 L131.1,59.8 L133.6,59.9 L136.0,60.0 L138.5,60.2 L141.0,60.3 L143.4,60.6 L145.9,60.8 L148.3,61.1 L150.8,61.5 L153.2,61.9 L155.7,62.5 L158.2,63.1 L160.6,63.8 L163.1,64.6 L165.5,65.6 L168.0,66.8 L170.5,68.1 L172.9,69.6 L175.4,71.2 L177.8,73.1 L180.3,75.2 L182.8,77.5 L185.2,80.0 L187.7,82.7 L190.1,85.5 L192.6,88.6 L195.0,91.8 L197.5,95.2 L200.0,98.7 L202.4,102.3 L204.9,106.0 L207.3,109.8 L209.8,113.7 L212.2,117.7 L214.7,121.7 L217.2,125.7 L219.6,129.8 L222.1,134.0 L224.5,138.1 L227.0,142.3 L229.5,146.5 L231.9,150.8 L234.4,155.0 L236.8,159.3 L239.3,163.5 L241.8,167.8" fill="none" stroke="#f2b880" stroke-width="2" stroke-dasharray="5 3"/>
  <path d="M50.0,55.6 L52.5,55.6 L54.9,55.6 L57.4,55.6 L59.8,55.6 L62.3,55.6 L64.8,55.6 L67.2,55.6 L69.7,55.6 L72.1,55.6 L74.6,55.6 L77.0,55.6 L79.5,55.6 L82.0,55.6 L84.4,55.6 L86.9,55.6 L89.3,55.6 L91.8,55.6 L94.2,55.6 L96.7,55.6 L99.2,55.6 L101.6,55.6 L104.1,55.6 L106.5,55.6 L109.0,55.7 L111.5,55.7 L113.9,55.7 L116.4,55.7 L118.8,55.7 L121.3,55.8 L123.8,55.8 L126.2,55.9 L128.7,55.9 L131.1,56.0 L133.6,56.1 L136.0,56.2 L138.5,56.3 L141.0,56.5 L143.4,56.6 L145.9,56.9 L148.3,57.1 L150.8,57.4 L153.2,57.8 L155.7,58.2 L158.2,58.7 L160.6,59.3 L163.1,60.0 L165.5,60.8 L168.0,61.7 L170.5,62.8 L172.9,63.9 L175.4,65.2 L177.8,66.7 L180.3,68.2 L182.8,69.9 L185.2,71.6 L187.7,73.4 L190.1,75.3 L192.6,77.2 L195.0,79.0 L197.5,80.9 L200.0,82.7 L202.4,84.4 L204.9,86.0 L207.3,87.4 L209.8,88.8 L212.2,90.0 L214.7,91.1 L217.2,92.1 L219.6,93.0 L222.1,93.7 L224.5,94.3 L227.0,94.9 L229.5,95.4 L231.9,95.8 L234.4,96.1 L236.8,96.4 L239.3,96.6 L241.8,96.8 L244.2,97.0 L246.7,97.1 L249.1,97.2 L251.6,97.3 L254.0,97.4 L256.5,97.5 L259.0,97.5 L261.4,97.6 L263.9,97.6 L266.3,97.6 L268.8,97.7 L271.2,97.7 L273.7,97.7 L276.2,97.7 L278.6,97.7 L281.1,97.7 L283.5,97.7 L286.0,97.7 L288.5,97.7 L290.9,97.8 L293.4,97.8 L295.8,97.8 L298.3,97.8 L300.8,97.8 L303.2,97.8 L305.7,97.8 L308.1,97.8 L310.6,97.8 L313.0,97.8 L315.5,97.8 L318.0,97.8 L320.4,97.8 L322.9,97.8 L325.3,97.8 L327.8,97.8 L330.2,97.8 L332.7,97.8 L335.2,97.8 L337.6,97.8 L340.1,97.8 L342.5,97.8 L345.0,97.8" fill="none" stroke="#1d6fd1" stroke-width="2.4"/>
  <line x1="199.3" y1="97.8" x2="199.3" y2="170.0" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="3 3"/>
  <circle cx="199.3" cy="97.8" r="3.5" fill="#b4232c"/>
  <text x="193.3" y="162.0" font-size="11" fill="#b4232c" text-anchor="end">3.4 mHz</text>
  <circle cx="179.9" cy="74.8" r="3.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="179.9" y="49.3" font-size="11" fill="#1f2a44" text-anchor="middle">bias hump, corner f_c</text>
  <text x="345.0" y="91.8" font-size="11" fill="#6c7a93" text-anchor="end">white floor Q_w</text>
  <text x="54.0" y="17.0" font-size="11" fill="#1f2a44" text-anchor="start">PSD ((°/s)²/Hz)</text>
</svg>
```

The red dot marks where the bias drops to the white level, at $3.4\,\mathrm{mHz}$. To the left of it the bias dominates; to the right, white noise does.
:::

::: context whiteness-bars What a white test looks like
Here are the twenty sample autocorrelations from the code, with the $\pm 0.062$ band dashed in red. Nineteen bars sit inside. One, at lag $20$ ($-0.078$), pokes out — exactly the one-in-twenty a $95\%$ band lets through by chance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40.0" y1="85.0" x2="345.0" y2="85.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40.0" y1="20.0" x2="40.0" y2="150.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40.0" y1="50.9" x2="345.0" y2="50.9" stroke="#b4232c" stroke-width="1.3" stroke-dasharray="5 3"/>
  <line x1="40.0" y1="119.1" x2="345.0" y2="119.1" stroke="#b4232c" stroke-width="1.3" stroke-dasharray="5 3"/>
  <rect x="43.0" y="85.0" width="9.2" height="9.9" fill="#1d6fd1"/>
  <rect x="58.3" y="85.0" width="9.2" height="14.2" fill="#1d6fd1"/>
  <rect x="73.5" y="69.8" width="9.2" height="15.2" fill="#1d6fd1"/>
  <rect x="88.8" y="85.0" width="9.2" height="9.4" fill="#1d6fd1"/>
  <rect x="104.0" y="85.0" width="9.2" height="1.7" fill="#1d6fd1"/>
  <rect x="119.3" y="85.0" width="9.2" height="5.6" fill="#1d6fd1"/>
  <rect x="134.6" y="58.9" width="9.2" height="26.1" fill="#1d6fd1"/>
  <rect x="149.8" y="85.0" width="9.2" height="19.7" fill="#1d6fd1"/>
  <rect x="165.1" y="67.3" width="9.2" height="17.7" fill="#1d6fd1"/>
  <rect x="180.3" y="85.0" width="9.2" height="5.7" fill="#1d6fd1"/>
  <rect x="195.6" y="85.0" width="9.2" height="5.2" fill="#1d6fd1"/>
  <rect x="210.8" y="74.0" width="9.2" height="11.0" fill="#1d6fd1"/>
  <rect x="226.1" y="85.0" width="9.2" height="7.0" fill="#1d6fd1"/>
  <rect x="241.3" y="85.0" width="9.2" height="20.2" fill="#1d6fd1"/>
  <rect x="256.6" y="82.8" width="9.2" height="2.2" fill="#1d6fd1"/>
  <rect x="271.8" y="58.0" width="9.2" height="27.0" fill="#1d6fd1"/>
  <rect x="287.1" y="55.2" width="9.2" height="29.8" fill="#1d6fd1"/>
  <rect x="302.3" y="69.7" width="9.2" height="15.3" fill="#1d6fd1"/>
  <rect x="317.6" y="69.2" width="9.2" height="15.8" fill="#1d6fd1"/>
  <rect x="332.8" y="85.0" width="9.2" height="42.7" fill="#b4232c"/>
  <text x="47.6" y="165.0" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="108.6" y="165.0" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <text x="184.9" y="165.0" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="261.1" y="165.0" font-size="11" fill="#1f2a44" text-anchor="middle">15</text>
  <text x="337.4" y="165.0" font-size="11" fill="#1f2a44" text-anchor="middle">20</text>
  <text x="345.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="end">lag k</text>
  <line x1="36.0" y1="30.0" x2="40.0" y2="30.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34.0" y="34.0" font-size="11" fill="#1f2a44" text-anchor="end">+0.1</text>
  <line x1="36.0" y1="140.0" x2="40.0" y2="140.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34.0" y="144.0" font-size="11" fill="#1f2a44" text-anchor="end">−0.1</text>
  <text x="345.0" y="44.9" font-size="11" fill="#b4232c" text-anchor="end">+1.96/√N = 0.062</text>
</svg>
```

The bars also flip sign with no pattern. Correlated residuals look different: a run of tall bars at lags $1$, $2$, $3$, all on the same side, shrinking as the lag grows.
:::

::: context welch Averaging spectra
Peter Welch, an engineer at IBM, published the method in 1967, just after the fast Fourier transform made computing spectra cheap. The idea is the same as averaging repeated measurements of anything: one periodogram is noisy, many averaged are steady. Welch also let the segments overlap and tapered each one's ends with a smooth **window** so that the cuts do not add false high frequencies. SciPy provides it as `scipy.signal.welch`, and it is the standard first look at any sensor's noise.
:::
