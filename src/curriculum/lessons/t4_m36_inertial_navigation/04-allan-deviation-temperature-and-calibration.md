---
id: l04-allan-deviation-temperature-and-calibration
title: The Allan deviation, temperature effects, and calibration
minutes: 22
covers:
  - "Allan variance for IMU characterization; temperature effects and calibration"
---

Put a bag of flour on a cheap kitchen scale and watch the display. The last digit flickers: 1003, 1001, 1004, 1002. If you write down one reading, you might be off by a few grams. If you average ten readings, the flicker mostly cancels and you get a better number. Average a hundred and it gets better still. But leave the scale on the counter all afternoon and something else shows up: the kitchen warms, the scale's zero creeps, and averaging for longer stops helping. Past some point, a longer average only measures how much the scale itself has wandered.

A gyro sitting still on a bench behaves like that scale: a true rate (Earth's spin) buried in noise of several kinds. Some of the noise averages away fast. Some averages away slowly. Some gets *worse* the longer you average. The tool that pulls these apart from one long record of a sensor sitting still is the **[[Allan deviation|allan-name]]** — a measure of how much two back-to-back averages of the same record disagree, plotted against how long each average is.

This lesson builds the **overlapping** Allan estimator every real analysis program uses, shows where each of the five slopes on an Allan plot comes from, and then turns to the one error no noise model fixes: temperature. Together they produce the dozen numbers — ARW, VRW, bias instability, rate random walk, thermal coefficients — that the rest of this module feeds on.

## Two averages, side by side

In words first: chop the record into blocks, each $\tau$ seconds long ($\tau$ is the Greek letter "tau", the **averaging time**). Average each block. Now look at neighboring blocks: how different are their averages? For a perfect sensor the difference would be zero. The bigger the typical difference, the noisier the sensor *at that averaging time*.

In symbols, with $\bar y_k$ ("y bar sub k") the average of block $k$:

$$
\sigma_A^2(\tau) = \tfrac12\,\mathbb{E}\big[(\bar y_{k+1}-\bar y_k)^2\big].
$$

Read $\sigma_A^2(\tau)$ as "the Allan variance at tau". The $\mathbb{E}$ means "the average over all pairs", and the $\tfrac12$ makes the answer equal the ordinary variance when the noise is plain white noise. Its square root, $\sigma_A(\tau)$, is the **Allan deviation**, in the same units as the sensor output.

## The overlapping estimator

The definition above uses **non-overlapping** blocks: cut an $N$-sample record into $\lfloor N/m\rfloor$ blocks of $m = \tau/\tau_0$ samples each ($\tau_0$ is the time between samples, and $\lfloor\cdot\rfloor$ means "round down"). At long averaging times this throws data away. A $200\,\mathrm{s}$ record analyzed at $\tau = 10\,\mathrm{s}$ has only $20$ blocks and $19$ differences — a noisy estimate of a noisy quantity.

The fix costs nothing extra. Slide the window one sample at a time, instead of jumping a whole block, and average over every place it fits.

To write that down neatly, first add up the samples. Call $\theta_i = \tau_0\sum_{j<i}\tilde\omega_j$ the **integrated angle**: the running total of the raw rate samples $\tilde\omega_j$ ("omega tilde", the tilde marking a measured value), times the sample interval. For an accelerometer the same running total is a velocity. The average of samples $i$ to $i+m$ is then the change in $\theta$ across the block, divided by $\tau$: $(\theta_{i+m}-\theta_i)/\tau$. The difference between two neighboring block averages is therefore $(\theta_{i+2m}-2\theta_{i+m}+\theta_i)/\tau$, and the overlapping estimator is

$$
\sigma_A^2(\tau) = \frac{1}{2\tau^2(N-2m)}\sum_{i=0}^{N-2m-1}\big(\theta_{i+2m} - 2\theta_{i+m} + \theta_i\big)^2 .
$$

The quantity in brackets is a **[[second difference|second-difference]]**: take three points $\tau$ apart, and measure how far the middle one sits from the straight line through the outer two. The estimator averages its square at *every* starting index, not every $m$-th one.

It estimates the same thing as the non-overlapping version, but it reuses each sample in roughly $2m$ windows instead of one, so its own scatter is smaller. A **[[Monte Carlo|monte-carlo]]** test makes that concrete: $2000$ independent $200\,\mathrm{s}$ white-noise records, each analyzed at $\tau = 10\,\mathrm{s}$. The non-overlapping estimate scatters by $0.195$ of its mean (standard deviation divided by mean); the overlapping one by $0.134$. That is $1.45$ times tighter — like having about twice as much data for free. Every published Allan curve uses the overlapping form.

```python
import numpy as np

def overlapping_allan_deviation(omega, dt, taus):
    theta = np.concatenate(([0.0], np.cumsum(omega) * dt))   # integrated angle
    N = len(theta)
    out = []
    for tau in taus:
        m = int(round(tau / dt))
        d2 = theta[2*m:N] - 2*theta[m:N-m] + theta[0:N-2*m]   # second differences
        out.append(np.sqrt(np.mean(d2**2) / (2.0 * (m*dt)**2)))
    return np.array(out)

rng = np.random.default_rng(0)
sigma = 0.02                                    # rad/s white rate noise
w = sigma * rng.standard_normal(200_000)
ad = overlapping_allan_deviation(w, 0.01, np.array([0.1, 1.0, 10.0]))
print(ad, sigma * np.sqrt(0.01 / np.array([0.1, 1.0, 10.0])))
# [0.00630332 0.00201646 0.00066429] [0.00632456 0.002      0.00063246]
```

The second list is what theory predicts for white noise, $\sigma\sqrt{\tau_0/\tau}$. The estimator lands within a few per cent of it at every $\tau$.

## Five slopes, five processes

Plot $\sigma_A(\tau)$ against $\tau$ with both axes on a **[[log-log|log-log]]** scale, where each step along an axis multiplies the value by ten. Each kind of noise then draws a straight segment with its own slope. The reason: each kind is a different number of integrations away from white noise, and each integration tilts the line up by the same amount. Here are all five, from steepest-falling to steepest-rising.

### White noise: slope $-\tfrac12$

This is the probability module's result: $\sigma_A(\tau) = \sqrt{Q}/\sqrt\tau$, where $\sqrt Q$ is the noise density. Averaging four times longer halves the deviation. Read the curve at $\tau = 1\,\mathrm s$, where $\sqrt\tau = 1$, and the value *is* the noise density. Multiply by $60$ (which is $\sqrt{3600}$, the seconds in an hour under a square root) for ARW in $^\circ/\sqrt{\mathrm h}$, or VRW in $\mathrm{m/s}/\sqrt{\mathrm h}$ for an accelerometer.

::: key Angle random walk
White noise on the rate output, integrating into an attitude random walk. Quoted in $^\circ/\sqrt{\mathrm{h}}$. Read off the Allan deviation at $\tau = 1\,\mathrm{s}$ on the $-\tfrac12$ slope.
:::

### Quantization: slope $-1$

A digital sensor rounds its angle output to whole counts of some step $\Delta$ ("delta"). This **[[quantization|quantization]]** adds a small rounding error $q_i$ to each value of $\theta$. Each error is equally likely to be anywhere between $-\Delta/2$ and $+\Delta/2$, so its variance is $\sigma_q^2 = \Delta^2/12$. These errors are *added on top* of $\theta$, not integrated.

Now look at one second difference: $q_{i+2m}-2q_{i+m}+q_i$. That is three independent random numbers, with weights $1$, $-2$ and $1$. Variances of independent numbers add, each multiplied by its weight squared, so the variance is $\sigma_q^2 + 4\sigma_q^2 + \sigma_q^2 = 6\sigma_q^2$. Put that into the estimator:

$$
\sigma_A^2(\tau) = \frac{6\sigma_q^2}{2\tau^2} = \frac{3\sigma_q^2}{\tau^2}, \qquad \sigma_A(\tau) = \frac{\sqrt3\,\sigma_q}{\tau}.
$$

A simulation with $\Delta = 10^{-3}$ (so $\sigma_q = \Delta/\sqrt{12} = 2.89\times10^{-4}$) matches this to better than half a per cent at every $\tau$ from $0.1$ to $5\,\mathrm s$. The $\tau^{-1}$ fall is the steepest of the five. That is why quantization only matters at the shortest averaging times: by $\tau = 1\,\mathrm s$ it has usually sunk below the white-noise line.

### Bias instability: slope $0$, with a catch

The previous lesson modeled a wandering bias as a **first-order Gauss-Markov process**: a random value that drifts but is pulled back toward zero, forgetting its past over a **correlation time** $T$. Its variance is $\sigma^2$. You might expect its Allan curve to be flat. It is not.

$$
\sigma_A^2(\tau) = \frac{\sigma^2T^2}{\tau^2}\left[\frac{2\tau}{T} - 3 + 4e^{-\tau/T} - e^{-2\tau/T}\right].
$$

This curve is a hump. It rises from zero at short $\tau$, peaks at $\tau \approx 1.89\,T$ with a height of about $0.617\,\sigma$, and then *falls* again. Far past the peak it approaches $\sqrt{2\sigma^2T/\tau}$, the shape of white noise. Once each block is many correlation times long, the process has forgotten itself many times inside it, so it averages down like noise with no memory. A simulated record with $\sigma = 3^\circ/\mathrm h$ and $T = 100\,\mathrm s$ follows the formula within $2\%$ over two decades of $\tau$, peaks near $\tau = 200\,\mathrm s$, and is already falling by $1000\,\mathrm s$.

::: note Why it has to be true
Write $\bar y_1$ and $\bar y_2$ for two neighboring block averages. Expanding the square in the definition gives $\sigma_A^2 = \operatorname{Var}(\bar y) - \operatorname{Cov}(\bar y_1, \bar y_2)$: the spread of one block average, minus how much two neighbors move together. For a Gauss-Markov bias with autocorrelation $\sigma^2 e^{-|t|/T}$, the probability module found $\operatorname{Var}(\bar y) = \frac{2\sigma^2T^2}{\tau^2}\big(\tau/T - 1 + e^{-\tau/T}\big)$. The same exponential integrals, taken across two neighboring blocks, give $\operatorname{Cov}(\bar y_1,\bar y_2) = \frac{\sigma^2T^2}{\tau^2}\big(1-e^{-\tau/T}\big)^2$. Subtract, and expand $(1-e^{-\tau/T})^2 = 1 - 2e^{-\tau/T} + e^{-2\tau/T}$, to reach the formula above.
:::

So where do the flat floors on datasheets come from? From many such processes at once, each with its own correlation time. Add five Gauss-Markov processes with the same total variance and correlation times spread half a decade apart — $10$, $32$, $100$, $316$ and $1000\,\mathrm s$. The rising edge of each hump overlaps the falling edge of the next. Between $\tau = 100$ and $1000\,\mathrm s$, the ratio of the highest to the lowest value of the curve drops from $1.50$ for one process to about $1.08$ for five. The limit of infinitely many processes, spread evenly on a log scale of $T$, is **[[flicker noise|flicker-noise]]**, and its Allan curve is flat over many decades.

For that ideal flicker limit, the height of the floor is a standard result of frequency-stability theory:

$$
\sigma_A(\tau)_{\min} = \sqrt{2\ln2/\pi}\;B = 0.664\,B,
$$

where $B$ is the **bias instability** a datasheet quotes, defined from the flicker noise's strength. Treat $0.664$ as an accepted constant of the field. It comes from an integral over the noise spectrum that is beyond this lesson; what this lesson has shown is why the floor is flat at all.

::: key Reading bias instability off an Allan plot
It is the flat minimum of the Allan deviation divided by $0.664$. It is the floor below which averaging longer stops helping — the sensor is wandering, not just noisy. A single Gauss-Markov process gives a hump peaking near $\tau \approx 1.9\,T$ at about $0.62\,\sigma$, not a floor; the flat floor comes from many superposed correlation times.
:::

### Rate random walk: slope $+\tfrac12$

Now take a bias with no pull back toward zero at all: $\dot b = w_r$ ("b dot equals w sub r"), where $w_r$ is white noise of strength $Q_r$. The bias itself does a random walk — the previous lesson's construction, one level up.

$$
\sigma_A^2(\tau) = \frac{Q_r\,\tau}{3}, \qquad \sigma_A(\tau) = \sqrt{Q_r}\sqrt{\tau/3}.
$$

At $\tau = 3\,\mathrm s$ the factor $\sqrt{\tau/3}$ is exactly $1$, so the curve's value there is $\sqrt{Q_r}$ directly — the same trick as reading ARW at $\tau = 1\,\mathrm s$. Multiply by $60$ for the datasheet coefficient $K$ in $^\circ/\mathrm h/\sqrt{\mathrm h}$. A simulated rate random walk with $K = 0.05\,^\circ/\mathrm h/\sqrt{\mathrm h}$ follows $\sqrt{Q_r\tau/3}$ within a few per cent, and reads $8.4\times10^{-4}\,^\circ/\mathrm h$ at $\tau = 3\,\mathrm s$, against $K/60 = 8.3\times10^{-4}\,^\circ/\mathrm h$.

::: note Why it has to be true
The difference of two neighboring block averages, $\bar y_2 - \bar y_1$, is a weighted sum of all the kicks $w_r(s)$ since the start. A kick at time $s$ inside the first block raises every later bias value, so it counts fully in $\bar y_2$ but in $\bar y_1$ only for the fraction $(\tau - s)/\tau$ of the block after it: its weight in the difference is $1 - (\tau-s)/\tau = s/\tau$. A kick at time $s$ in the second block counts only in $\bar y_2$, for the part after $s$: its weight is $(2\tau - s)/\tau$. White noise makes the variance equal to $Q_r$ times the integral of the squared weight: $\int_0^\tau (s/\tau)^2\,ds + \int_\tau^{2\tau}\big((2\tau-s)/\tau\big)^2\,ds = \tau/3 + \tau/3 = 2\tau/3$. Halve it, and $\sigma_A^2 = Q_r\tau/3$.
:::

### Rate ramp: slope $+1$

The last one is not random at all. It is a slow, steady drift $b(t) = Rt$, from a warm-up that has not finished or a supply voltage that is slowly sagging. Its integral is $\theta(t) = \tfrac12Rt^2$. The second difference over points $0$, $\tau$, $2\tau$ is $\tfrac12R(2\tau)^2 - 2\cdot\tfrac12R\tau^2 + 0 = 2R\tau^2 - R\tau^2 = R\tau^2$, and it comes out the same for every starting point, since nothing is random. So

$$
\sigma_A^2(\tau) = \frac{(R\tau^2)^2}{2\tau^2} = \frac{R^2\tau^2}{2}, \qquad \sigma_A(\tau) = \frac{R}{\sqrt2}\,\tau,
$$

which a direct simulation of a pure ramp confirms to six figures. A $+1$ slope on a real plot is a flag that something had not settled — usually the tail of a warm-up the record did not run past. It tells you to take a longer record, not to report a number.

::: key Allan deviation slopes — the five signatures
$-1$: quantization. $-\tfrac12$: angle (or velocity) random walk. $0$ (flat floor): bias instability. $+\tfrac12$: rate random walk. $+1$: rate ramp / drift.
:::

| Process | $\sigma_A(\tau)$ | Slope | Read at |
| --- | --- | --- | --- |
| Quantization | $\sqrt3\,\sigma_q/\tau$ | $-1$ | anywhere on the line |
| Angle / velocity random walk | $\sqrt{Q}/\sqrt\tau$ | $-\tfrac12$ | $\tau=1\,\mathrm s$, $\times60$ |
| Bias instability | floor at $0.664\,B$ | $0$ | the minimum |
| Rate random walk | $\sqrt{Q_r}\sqrt{\tau/3}$ | $+\tfrac12$ | $\tau=3\,\mathrm s$, $\times60$ |
| Rate ramp | $R\tau/\sqrt2$ | $+1$ | extend the record instead |

::: example Recovering three parameters from one synthetic record
Build a fake gyro whose answers you know, then check that the Allan plot finds them. Take $400\,000$ samples at $1\,\mathrm{Hz}$ — $400\,000\,\mathrm s$, about $4.6$ days — with:

- $\mathrm{ARW} = 0.3\,^\circ/\sqrt{\mathrm h}$;
- a bias instability built from three Gauss-Markov processes with correlation times $10$, $60$ and $400\,\mathrm s$ and combined $\sigma = 3\,^\circ/\mathrm h$, standing in for flicker noise the way the five-process sum did above;
- a rate random walk of $K = 8\,^\circ/\mathrm h/\sqrt{\mathrm h}$. That is far larger than the $0.05$ used elsewhere in this module, chosen only so its upturn shows up inside a record short enough to simulate in a second. A realistic $K$ does not overtake bias instability until about a day, as the previous lesson found.

```python
import numpy as np
from scipy.signal import lfilter

rng = np.random.default_rng(5)
dt, n = 1.0, 400_000
ARW_true, sigma_true, K_true = 0.3, 3.0, 8.0          # deg/sqrt(h), deg/h, deg/h/sqrt(h)

white = np.sqrt((ARW_true/60.0)**2/dt) * rng.standard_normal(n)   # deg/s

Ts = np.array([10.0, 60.0, 400.0])                    # three relaxation times, one bias
bias_gm = np.zeros(n)
for T in Ts:
    phi = np.exp(-dt/T)
    s_each = sigma_true/np.sqrt(len(Ts))
    innov = s_each*np.sqrt(1-phi**2)*rng.standard_normal(n)
    innov[0] += phi*s_each*rng.standard_normal()
    bias_gm += lfilter([1.0], [1.0, -phi], innov)      # deg/h

Qr = (K_true/60.0)**2
bias_rrw = np.cumsum(np.sqrt(Qr/dt)*rng.standard_normal(n))*dt   # deg/h

omega = white + (bias_gm + bias_rrw)/3600.0            # deg/s

def overlapping_allan_deviation(omega, dt, taus):
    theta = np.concatenate(([0.0], np.cumsum(omega)*dt))
    N = len(theta)
    out = []
    for tau in taus:
        m = int(round(tau/dt))
        d2 = theta[2*m:N] - 2*theta[m:N-m] + theta[0:N-2*m]
        out.append(np.sqrt(np.mean(d2**2)/(2.0*(m*dt)**2)))
    return np.array(out)

taus = np.array([1.0, 10.0, 30.0, 100.0, 200.0, 300.0, 500.0, 1000.0])
ad = overlapping_allan_deviation(omega, dt, taus) * 3600.0   # deg/h
for t, s in zip(taus, ad):
    print(f"tau={t:6.1f} s   AD={s:.4f} deg/h")
# tau=   1.0 s   AD=17.9907 deg/h
# tau=  10.0 s   AD=5.8073 deg/h
# tau=  30.0 s   AD=3.5910 deg/h
# tau= 100.0 s   AD=2.4145 deg/h
# tau= 200.0 s   AD=2.1750 deg/h
# tau= 300.0 s   AD=2.1739 deg/h
# tau= 500.0 s   AD=2.2595 deg/h
# tau=1000.0 s   AD=2.7017 deg/h
```

**ARW.** At $\tau = 1\,\mathrm s$ the curve reads $17.99\,^\circ/\mathrm h$. Divide by $3600$ to get $^\circ/\mathrm s$, then multiply by $60$ for ARW — or, in one step, divide by $60$: $17.99/60 = 0.2998\,^\circ/\sqrt{\mathrm h}$. That is the true $0.3$ to three figures.

**Bias instability.** The curve bottoms out between $\tau = 200$ and $300\,\mathrm s$, at $2.174\,^\circ/\mathrm h$. Divide by $0.664$: $2.174/0.664 = 3.27\,^\circ/\mathrm h$, against the true $3.0$ — $9\%$ high. That is inside the $10\%$ the module's exercise asks for. The gap comes from the finite record and from three correlation times being a rough stand-in for true flicker noise.

**Rate random walk.** Past the floor the curve climbs again, to $2.70\,^\circ/\mathrm h$ by $\tau = 1000\,\mathrm s$: the $+\tfrac12$ upturn, on the far side of a genuine floor. A single correlation time never produced that shape.

Sanity check: every number came back close to what went in, but none exactly. An Allan plot is an honest estimator, not an exact one.
:::

## Temperature effects

Take a guitar tuned in a warm room out into the cold, and it goes out of tune: the strings and the wood shrink by different amounts. Every part of an inertial sensor does the same: spring stiffness, resonant frequency, electronic offsets all depend on temperature.

The effect is not subtle. A tactical MEMS gyro's bias typically moves $0.01$ to $0.1\,^\circ/\mathrm h$ for each degree Celsius. Its scale factor moves tens of **[[parts per million|ppm]]** per degree. Compare that with the $3\,^\circ/\mathrm h$ bias instability this module has used throughout. A gyro that a lab Allan plot rates at $3\,^\circ/\mathrm h$ can show a bias several times larger in the field, after nothing more than a climb from a $20^\circ\mathrm C$ hangar to $-15^\circ\mathrm C$ at altitude, unless that dependence was measured and removed.

::: example A cold start
A gyro has a thermal bias sensitivity of $0.04\,^\circ/\mathrm h$ per $^\circ\mathrm C$. It is calibrated at $20^\circ\mathrm C$ and flown after cooling to $-10^\circ\mathrm C$: a change of $\Delta T = 30^\circ\mathrm C$.

**Bias shift.** Uncompensated, the bias moves by $0.04\times30 = 1.2\,^\circ/\mathrm h$. That is forty per cent of the $3\,^\circ/\mathrm h$ bias instability.

**Attitude error.** A constant bias $b$ builds an attitude error $b\,t$. Over a ten-minute coast, $t = 600\,\mathrm s$ is $600/3600$ of an hour, so the error is $1.2\times(600/3600) = 0.2^\circ$ — comparable to the whole random-noise budget the previous lesson worked out for the same coast.

**Scale factor.** A $20\,\mathrm{ppm}$ per $^\circ\mathrm C$ scale factor over the same $30^\circ\mathrm C$ shifts by $20\times30 = 600\,\mathrm{ppm}$. On a $90^\circ$ turn, the error-model lesson's rule (attitude error equals scale-factor error times angle turned) gives $600\times10^{-6}\times90 = 0.054^\circ$.

Sanity check: neither number is exotic. Both are why "the IMU was calibrated" is an incomplete sentence until it says over what temperature range.
:::

Two different effects are at work, and both matter.

- The **steady-state** dependence is what the example used: bias and scale factor as smooth, repeatable functions of temperature, once the whole unit has settled at one temperature.
- The **transient** is different. Right after power-on, before the sensing chip and the case reach the same temperature, uneven heating stresses the sensing element. A single temperature reading on the chip cannot capture that. For the first several minutes, the bias can wander well outside its steady-state curve. This **[[warm-up|warm-up]]** is often the biggest bias swing the unit ever shows, and the usual source of a $+1$ slope on an Allan plot. A navigation-grade unit is typically given ten to fifteen minutes to settle before an alignment that matters; a tactical unit, less.

## Calibration in a thermal chamber

The fix is the six-position static test from the error-model lesson, repeated at a ladder of temperatures. Place the IMU in a **[[thermal chamber|thermal-chamber]]** and step through five to nine temperatures spanning its operating range. At each one, wait until the unit is at one temperature all through, then run the six-orientation test that separates bias, scale factor and misalignment.

The result is a table for each parameter (bias, scale factor and, for a gyro, $g$-sensitivity), for each axis, against temperature. Fit each table with a low-order polynomial — cubic is typical — or keep it as a lookup table and interpolate in straight lines between points. Store the numbers in the unit's own memory, next to a live temperature sensor on the chip.

In operation, the correction runs on every sample:

1. read the current temperature;
2. evaluate the fitted bias and scale-factor curves at that temperature;
3. subtract the bias and divide out the scale factor from the raw measurement, before anything else in the mechanization sees it.

This comes first, even before the error-model lesson's other deterministic corrections, because those corrections are usually the very quantities that depend on temperature. What is left afterward is, ideally, the noise floor this lesson measured — ARW, bias instability, rate random walk — plus whatever the polynomial fit missed. That leftover is usually the biggest reason a unit does worse in the field than on its datasheet.

::: warning Level is not rate
A chamber calibration measures temperature *level*, not how fast temperature is *changing*. A unit soaked at each point until it settles will be well compensated through a slow, gentle change. It can still show a bias jump during a fast one — a rapid climb, or a sudden move from shade into direct sun — because the internal temperature differences a fast change creates are not the same function of the one chip-temperature reading. Where this matters, the calibration adds the rate $dT/dt$ ("d T d t") as a second input to the correction, not only $T$. Otherwise, a longer warm-up hold is the cheaper fix.
:::

## Check yourself

::: check
An Allan deviation plot shows a clean $-1$ slope from $\tau = 0.05\,\mathrm s$ to $\tau = 0.3\,\mathrm s$ before it flattens. At $\tau = 0.1\,\mathrm s$ the value is $2\times10^{-4}\,^\circ/\mathrm s$. What is the quantization step $\Delta$, in degrees?
:::

::: answer
A $-1$ slope is quantization, with $\sigma_A(\tau) = \sqrt3\,\sigma_q/\tau$. Solve for $\sigma_q$ by multiplying both sides by $\tau$ and dividing by $\sqrt3$:

$$
\sigma_q = \frac{\sigma_A(\tau)\,\tau}{\sqrt3} = \frac{2\times10^{-4}\times0.1}{\sqrt3} = 1.155\times10^{-5}\,^\circ.
$$

Since $\sigma_q = \Delta/\sqrt{12}$, multiply by $\sqrt{12}$: $\Delta = 1.155\times10^{-5}\times3.464 = 4.0\times10^{-5}\,^\circ$. That is about $0.14$ arcseconds per count.
:::

::: check
Why does a single Gauss-Markov process's Allan deviation fall again at very long $\tau$, instead of staying at its peak?
:::

::: answer
Once the averaging time is many correlation times long, the process has forgotten its state many times over inside one block. Each block average is then an average of many effectively independent values. Averaging more independent values shrinks the spread the usual way, as $1/\sqrt\tau$, so the curve returns to the $-\tfrac12$ slope of white noise.
:::

::: check
Two gyros show the same Allan deviation minimum, $2\,^\circ/\mathrm h$. One is flat from $\tau = 50\,\mathrm s$ to $\tau = 2000\,\mathrm s$. The other only dips to $2\,^\circ/\mathrm h$ in a narrow window, between $\tau = 180$ and $220\,\mathrm s$. What does the difference say about each sensor's inner workings?
:::

::: answer
The wide flat floor fits true flicker-type noise: many relaxation mechanisms with a broad spread of correlation times, none dominant — the picture this lesson built by adding Gauss-Markov processes.

The narrow feature fits a single relaxation process with one main correlation time. Its extremum sits near $\tau = 200\,\mathrm s$, and the single-process peak is at about $1.89\,T$, so $T \approx 200/1.89 \approx 106\,\mathrm s$. Away from that window its curve changes with $\tau$, as the single-process formula predicts, instead of staying flat.

Same number on paper, different behavior over a mission whose length falls outside that window.
:::

::: check
A datasheet gives rate random walk as $K = 0.08\,^\circ/\mathrm h/\sqrt{\mathrm h}$. What is the strength $Q_r$ in $(^\circ/\mathrm h)^2/\mathrm s$, and what Allan deviation does this process alone produce at $\tau = 3\,\mathrm s$ and at $\tau = 300\,\mathrm s$?
:::

::: answer
Undo the factor of $60$ and square: $Q_r = (K/60)^2 = (0.08/60)^2 = 1.778\times10^{-6}\,(^\circ/\mathrm h)^2/\mathrm s$.

At $\tau = 3\,\mathrm s$: $\sigma_A = \sqrt{Q_r\times3/3} = \sqrt{Q_r} = 1.333\times10^{-3}\,^\circ/\mathrm h$, which is $K/60$, as the reading rule promises.

At $\tau = 300\,\mathrm s$: $\sigma_A = \sqrt{Q_r\times300/3} = \sqrt{100\,Q_r} = 10\sqrt{Q_r} = 0.0133\,^\circ/\mathrm h$.

The $+\tfrac12$ slope means a hundred-fold increase in $\tau$ gave only a ten-fold increase in $\sigma_A$.
:::

::: check
An IMU is calibrated only at $20^\circ\mathrm C$. Its gyro bias changes by $0.03\,^\circ/\mathrm h$ per $^\circ\mathrm C$, and its bias instability is tiny by comparison. Roughly how much attitude error does a ten-minute flight at $5^\circ\mathrm C$ pick up from the thermal bias alone? How could you remove it without a second calibration temperature?
:::

::: answer
The temperature is $15^\circ\mathrm C$ away from the calibration point, so the uncompensated bias is $0.03\times15 = 0.45\,^\circ/\mathrm h$. Held constant over $600\,\mathrm s$, one sixth of an hour, the attitude error is $0.45\times(600/3600) = 0.075^\circ$.

With one calibration temperature the slope is unknown, so there is nothing to interpolate. Instead, measure the bias on the day: hold the vehicle still at the start for a [[zero-velocity update|zupt-later]] or a gyrocompass alignment, which observes and removes whatever bias is actually present.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\sigma_A^2(\tau)=\frac{1}{2\tau^2(N-2m)}\sum(\theta_{i+2m}-2\theta_{i+m}+\theta_i)^2$ | Overlapping Allan variance; every window placement, not every $m$-th one |
| $\sqrt3\,\sigma_q/\tau$, slope $-1$ | Quantization |
| $\sqrt{Q}/\sqrt\tau$, slope $-\tfrac12$, read at $\tau=1\,\mathrm s$ | Angle / velocity random walk |
| $\frac{\sigma^2T^2}{\tau^2}[2\tau/T-3+4e^{-\tau/T}-e^{-2\tau/T}]$ | One Gauss-Markov process: a hump peaking at $\tau\approx1.89T$, height $\approx0.62\sigma$ |
| Floor at $0.664\,B$ | Bias instability, for the many-correlation-time (flicker) limit |
| $\sqrt{Q_r}\sqrt{\tau/3}$, slope $+\tfrac12$, read at $\tau=3\,\mathrm s$ | Rate random walk |
| $R\tau/\sqrt2$, slope $+1$ | Rate ramp — usually an unfinished warm-up |
| Steady-state vs transient thermal effects | Bias and scale factor against temperature level, and against how fast it changes |

This closes the module's account of what a sensor does on its own, sitting still. The next lesson sets the sensors moving: the strapdown mechanization that turns a stream of corrected gyro and accelerometer samples into attitude, velocity and position, in the three reference frames a navigator actually computes in.

::: context allan-name Borrowed from clockmakers
David Allan, a physicist at the US National Bureau of Standards (now NIST), introduced this statistic in 1966 to compare atomic clocks. Ordinary variance was useless for them: for some kinds of clock noise it keeps growing the longer you record, so it never settles on an answer. Comparing *neighboring* averages fixed that. Gyro engineers borrowed the tool because a gyro and a clock have the same problem — both are supposed to put out a steady number, and both wander in several ways at once. The IEEE test standards for fiber-optic and ring-laser gyros later adopted it as the standard way to specify gyro noise.
:::

::: context second-difference Three points and a straight line
A second difference asks one question: how far does the middle point sit from the straight line joining its two neighbors?

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="150" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="36" y="22" font-size="12" fill="#1f2a44">θ (running total)</text>
  <path d="M40,137 Q50,133 60,130 Q120,110 180,95 Q240,75 300,45 Q312,39 325,32" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="130" x2="300" y2="45" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="60" cy="130" r="5" fill="#1f2a44"/>
  <circle cx="180" cy="95" r="5" fill="#1f2a44"/>
  <circle cx="300" cy="45" r="5" fill="#1f2a44"/>
  <line x1="180" y1="95" x2="180" y2="87.5" stroke="#b4232c" stroke-width="3"/>
  <text x="192" y="112" font-size="12" fill="#b4232c">gap</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="166">t</text><text x="180" y="166">t + τ</text><text x="300" y="166">t + 2τ</text>
  </g>
</svg>
```

The slope of $\theta$ over a block is that block's average rate. If both blocks had the same average rate, the three points would lie on one straight line and the gap would be zero. The gap is half the second difference, $(\theta_{i+2m}-2\theta_{i+m}+\theta_i)/2$, so its size measures how much the two neighboring averages disagree.
:::

::: context monte-carlo Answering questions by rolling dice
A **Monte Carlo** test answers "how does this behave on average?" by trying it many times with random inputs and counting. Here: make $2000$ fake noise records, run both estimators on each, and see how much each one's answers scatter. It is named after the casino in Monaco, because it runs on chance. Stanislaw Ulam and John von Neumann developed the method at Los Alamos in the 1940s, for nuclear-weapons problems no formula could solve, and their colleague Nicholas Metropolis suggested the name. In GNC it is everywhere: a launch vehicle's guidance is signed off after thousands of simulated flights with randomized winds, engine performance and sensor errors.
:::

::: context log-log Why the plot is a bathtub
On log-log axes, a power law $\sigma_A \propto \tau^p$ is a straight line of slope $p$. A real sensor adds the five together, and whichever is largest at a given $\tau$ shows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="194" font-size="12" fill="#1f2a44" text-anchor="middle">averaging time τ (log scale)</text>
  <text x="46" y="22" font-size="12" fill="#1f2a44">σ_A (log)</text>
  <polyline points="55,30 90,65 170,105 250,105 300,80 335,45" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <g font-size="12" text-anchor="middle">
    <text x="84" y="44" fill="#b4232c">−1</text>
    <text x="137" y="82" fill="#b4232c">−1/2</text>
    <text x="210" y="97" fill="#b4232c">0</text>
    <text x="264" y="84" fill="#b4232c">+1/2</text>
    <text x="330" y="70" fill="#b4232c">+1</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="72" y="140">quant.</text><text x="130" y="140">white</text><text x="210" y="140">bias inst.</text><text x="275" y="140">RRW</text><text x="325" y="140">ramp</text>
  </g>
</svg>
```

Each segment's steepness here matches its label: the first falls one decade per decade, the white-noise part half a decade, and so on. Real curves bend smoothly between segments rather than meeting at corners.
:::

::: context quantization Counting in whole steps
A digital sensor reports whole numbers of some smallest step, called the **least significant bit** or LSB. Anything between two steps is rounded. Think of a ruler marked only in millimeters: every length you read is off by up to half a millimeter, and if you know nothing else, any error in that range is equally likely. An error spread evenly over a range of width $\Delta$ has variance $\Delta^2/12$ — the same $12$ that appears in the formula for the variance of a uniform distribution, which you can check by integrating $x^2$ from $-\Delta/2$ to $\Delta/2$ and dividing by $\Delta$.
:::

::: context flicker-noise Noise that looks the same at every scale
Flicker noise is also called **1/f noise**, because its power at frequency $f$ goes as $1/f$: every octave of frequency holds the same amount of power. It turns up far from gyros — in the current through almost every transistor and resistor, in the rise and fall of river levels, in the loudness of recorded music. Nobody has one tidy explanation for all of them. For sensors, the stacked-relaxation picture in this lesson is the standard working model: many independent slow processes, with time constants spread evenly on a log scale, add up to a spectrum that falls as $1/f$ over many decades.
:::

::: context ppm Parts per million
A **part per million** (ppm) is one millionth: $1\,\mathrm{ppm} = 10^{-6}$. A scale-factor error of $100\,\mathrm{ppm}$ means the sensor reports $1.0001$ times the true value. For a gyro turning through a full circle, that is $360\times10^{-4} = 0.036^\circ$ of error — small, but a navigation-grade gyro's bias would take hours to build up that much. A kitchen scale is typically good to a few thousand ppm; a good gyro's scale factor is good to a few ppm.
:::

::: context warm-up Why the first minutes are the worst
Power reaches the electronics first, and they heat up. The sensing element warms more slowly, and its mounting and case more slowly still. For a while, one side of the chip is warmer than the other, and the uneven expansion bends it very slightly. The temperature sensor sits in one spot, so it reports one number while the chip is really at several. The bias follows the bending, not the one number.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="162" font-size="12" fill="#1f2a44" text-anchor="middle">minutes after power-on</text>
  <text x="46" y="22" font-size="12" fill="#1f2a44">gyro bias</text>
  <path d="M40,40 C70,40 90,105 130,112 S220,100 340,100" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="130" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="230" y="92" font-size="11" fill="#6c7a93" text-anchor="middle">steady-state value</text>
  <line x1="190" y1="30" x2="190" y2="140" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3,3"/>
  <text x="196" y="42" font-size="11" fill="#b4232c">trust it from here</text>
</svg>
```

The shape is a sketch, not a measurement; real warm-up curves differ from unit to unit.
:::

::: context thermal-chamber An oven that also freezes
A thermal chamber is an insulated box that can hold its inside at any set temperature, typically from about $-55^\circ\mathrm C$ to $+85^\circ\mathrm C$ or beyond. It heats with electric elements and cools with a refrigeration unit or liquid nitrogen. For IMU work the chamber often sits on top of, or around, a precision rotation table, so the unit can be turned into its six orientations — or spun at known rates — without opening the door. Calibrating one unit across a full temperature range can take a day or more of chamber time, which is a real part of what a navigation-grade IMU costs.
:::

::: context zupt-later Coming back later
Holding still is one of the most useful things a vehicle can do for its navigator. If you know the true velocity is exactly zero, any velocity the INS computes is error, and a filter can trace that error back to the biases and tilts that caused it. Lesson 10 uses this for initial alignment, and lesson 13 turns it into the **zero-velocity update**, the cheapest accuracy boost in ground and pedestrian navigation.
:::
