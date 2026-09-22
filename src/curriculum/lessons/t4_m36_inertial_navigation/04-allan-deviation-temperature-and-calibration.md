---
id: l04-allan-deviation-temperature-and-calibration
title: The Allan deviation, temperature effects, and calibration
minutes: 20
covers:
  - "Allan variance for IMU characterization; temperature effects and calibration"
---

The probability module defined the Allan variance from a static bench record, $\sigma_A^2(\tau) = \tfrac12\mathbb{E}[(\bar y_{k+1}-\bar y_k)^2]$, and used it to read off angle random walk and a Gauss-Markov bias instability. This lesson finishes the job. It derives the **overlapping** estimator that every real Allan-deviation routine actually computes, works out where all five noise slopes named across this module's first three lessons — quantization, angle or velocity random walk, bias instability, rate random walk, and a deterministic rate ramp — come from in closed form, and then turns to the one thing no amount of noise modelling fixes: temperature. A sensor's bias and scale factor move with the die temperature by an amount that dwarfs bias instability on any vehicle that is not sitting in a thermally controlled lab, and characterizing that movement in a chamber is as much a part of "IMU characterization" as the Allan plot is.

Everything here answers the same practical question from a different angle: you are handed hours of raw output from one gyro and one accelerometer, at one or several temperatures, and asked to hand back the dozen numbers — ARW, VRW, bias instability, rate random walk, thermal coefficients — that the rest of this module's mechanization and filtering feed on. This is where those numbers actually come from.

## The overlapping estimator

The definition above compares *consecutive, non-overlapping* windows of length $\tau$: cut an $N$-sample record into $\lfloor N/m\rfloor$ blocks of $m = \tau/\tau_0$ samples ($\tau_0$ the sample interval), average each block, and root-mean-square the differences between neighbours. At large $\tau$ this throws data away — a $200\,\mathrm{s}$ record analyzed at $\tau=10\,\mathrm{s}$ yields only $20$ non-overlapping blocks and $19$ differences, a noisy estimate of a noisy quantity. The fix costs nothing extra to compute: slide the window one sample at a time instead of jumping by $m$, and average over every valid placement.

Work with the integrated angle $\theta_i = \tau_0\sum_{j<i}\tilde\omega_j$ (or velocity, for an accelerometer), the running sum of the raw samples. A block average over samples $i$ to $i+m$ is $(\theta_{i+m}-\theta_i)/\tau$, so the overlapping estimator is

$$
\sigma_A^2(\tau) = \frac{1}{2\tau^2(N-2m)}\sum_{i=0}^{N-2m-1}\big(\theta_{i+2m} - 2\theta_{i+m} + \theta_i\big)^2 ,
$$

the mean-square **second difference** of the integrated signal, at every starting index rather than every $m$-th one. It estimates exactly the same quantity the non-overlapping definition does — the two agree in expectation for a stationary process — but reuses each sample in roughly $2m$ overlapping windows instead of one, which lowers the estimator's own variance substantially. A Monte Carlo of $2000$ independent $200\,\mathrm{s}$ white-noise records, evaluated at $\tau=10\,\mathrm{s}$, makes the gain concrete: the non-overlapping estimate has a relative scatter (standard deviation divided by mean) of $0.194$ across the trials, the overlapping estimate $0.133$ — a factor of $1.45$ tighter, equivalent to about twice the effective data. This is why every published Allan-deviation curve, including the one the module's exercise asks you to compute, uses the overlapping form; nobody analyzes a hard-won multi-hour static record with the wasteful version.

```python
import numpy as np

def overlapping_allan_deviation(omega, dt, taus):
    theta = np.concatenate(([0.0], np.cumsum(omega) * dt))
    N = len(theta)
    out = []
    for tau in taus:
        m = int(round(tau / dt))
        d2 = theta[2*m:N] - 2*theta[m:N-m] + theta[0:N-2*m]
        out.append(np.sqrt(np.mean(d2**2) / (2.0 * (m*dt)**2)))
    return np.array(out)

rng = np.random.default_rng(0)
sigma = 0.02                                    # rad/s white rate noise
w = sigma * rng.standard_normal(200_000)
ad = overlapping_allan_deviation(w, 0.01, np.array([0.1, 1.0, 10.0]))
print(ad, sigma * np.sqrt(0.01 / np.array([0.1, 1.0, 10.0])))
# [0.00630332 0.00201646 0.00066429] [0.00632456 0.002      0.00063246]
```

## Five slopes, five processes

Plot $\sigma_A(\tau)$ against $\tau$ on log-log axes and each noise mechanism this module has named contributes a straight segment of its own, because each is a different number of integrations away from a white source, and an integration is a multiplication by $\tau$ in this log-log picture. Two of the five are new here.

**White noise (angle or velocity random walk), slope $-\tfrac12$.** The probability module's result, restated: $\sigma_A(\tau) = \sqrt{Q}/\sqrt\tau$. Read the curve at $\tau=1\,\mathrm{s}$ and the value is the noise density directly; multiply by $60$ for ARW in $^\circ/\sqrt{\mathrm h}$ or VRW in $\mathrm{m/s}/\sqrt{\mathrm h}$.

**Quantization, slope $-1$.** A quantized angle output adds an independent rounding error $q_i \sim \mathrm{Unif}(-\Delta/2,\Delta/2)$, variance $\sigma_q^2=\Delta^2/12$, directly to each sample of $\theta$ — not integrated, just added. The second difference at one starting index is $q_{i+2m}-2q_{i+m}+q_i$, three *independent* draws, so its variance is $\sigma_q^2 + 4\sigma_q^2+\sigma_q^2 = 6\sigma_q^2$ by the usual rule for a linear combination of independent variables. Then

$$
\sigma_A^2(\tau) = \frac{6\sigma_q^2}{2\tau^2} = \frac{3\sigma_q^2}{\tau^2}, \qquad \sigma_A(\tau) = \frac{\sqrt3\,\sigma_q}{\tau}.
$$

A direct simulation with $\Delta = 10^{-3}$ (so $\sigma_q = \Delta/\sqrt{12} = 2.89\times10^{-4}$) matches this to four figures at every $\tau$ tested from $0.1$ to $5\,\mathrm s$. The $\tau^{-1}$ law is the steepest fall of the five, which is exactly why quantization only ever matters at the shortest averaging times: by $\tau=1\,\mathrm s$ it has usually dropped below the white-noise floor.

**Bias instability, slope $0$ — with a catch.** A single first-order Gauss-Markov bias, autocorrelation $\sigma^2e^{-|\tau|/T}$, gives an Allan variance you can derive from the same cluster-variance-minus-cluster-covariance construction as any stationary process. Writing $\bar y_1$, $\bar y_2$ for two adjacent length-$\tau$ block averages, $\operatorname{Var}(\bar y) = \frac{2\sigma^2T^2}{\tau^2}(\tau/T-1+e^{-\tau/T})$ (the identical reduction the probability module used for $\operatorname{Var}(\int b\,dt)$), and a short calculation with the same exponential integrals gives $\operatorname{Cov}(\bar y_1,\bar y_2)=\frac{\sigma^2T^2}{\tau^2}(1-e^{-\tau/T})^2$. Since $\sigma_A^2=\operatorname{Var}(\bar y)-\operatorname{Cov}(\bar y_1,\bar y_2)$,

$$
\sigma_A^2(\tau) = \frac{\sigma^2T^2}{\tau^2}\left[\frac{2\tau}{T} - 3 + 4e^{-\tau/T} - e^{-2\tau/T}\right].
$$

This is not flat. It rises from zero at small $\tau$, peaks at $\tau \approx 1.89\,T$ with a height of about $0.617\,\sigma$, and *falls* again for $\tau \gg T$, approaching the white-noise shape $\sqrt{2\sigma^2T/\tau}$ — a single relaxation process behaves like white noise again once you average far longer than its own memory. A simulated Gauss-Markov record with $\sigma=3^\circ/\mathrm h$, $T=100\,\mathrm s$ confirms the closed form to within $2\%$ across two decades of $\tau$, and confirms the hump: the curve peaks near $\tau=200\,\mathrm s$ and is already falling by $\tau=1000\,\mathrm s$.

A real bias-instability floor — flat across a decade or more, as every navigation-grade datasheet shows — is not one relaxation process; it is many, with a spread of correlation times, superposed. Summing five Gauss-Markov processes with the same total variance but correlation times spread half a decade apart, $10$ to $1000\,\mathrm s$, and re-running the same simulation, flattens the curve dramatically: the ratio of the highest to lowest value between $\tau=100$ and $\tau=1000\,\mathrm s$ drops from $1.50$ for one process to $1.07$ for the sum of five. Real flicker noise is the limit of infinitely many such processes, spread continuously in $\log T$, each one's rising edge overlapping the next one's falling edge so completely that the sum is flat over many decades rather than one. The physical picture behind that spread is a resonator and its electronics relaxing through many independent microscopic mechanisms at once — different stress points, different thermal paths — each with its own time constant, none of them dominant.

For that idealized, continuous-spectrum limit, the height of the floor is a standard result of frequency-stability theory: $\sigma_A(\tau)_{\min} = \sqrt{2\ln2/\pi}\,B = 0.664\,B$, where $B$, the bias instability quoted on a datasheet, is defined through the flicker noise's spectral level rather than through any single $\sigma$. Treat $0.664$ as an accepted constant of the field, the way the module's first lesson treated the hemispherical resonator's Bryan factor: it comes from an integral over the noise's power spectral density that is standard in metrology but outside what this lesson derives from scratch. What this lesson has derived is *why* the floor is flat at all — superposition of many relaxation times — rather than asking you to take flatness on faith.

::: key Bias instability, precisely
A single Gauss-Markov process's Allan deviation is a hump, peaking near $\tau \approx 1.9\,T$ at about $0.62\,\sigma$, not a floor. The floor real sensors show comes from many superposed relaxation times; for the idealized flicker-noise limit, its height is $0.664\,B$, where $B$ is the bias instability datasheets quote.
:::

**Rate random walk, slope $+\tfrac12$.** Model a bias with no restoring term at all, $\dot b = w_r$, $\mathbb{E}[w_r(t)w_r(\tau)]=Q_r\delta(t-\tau)$ — the random-walk lesson's construction, one level up. Writing the block-average difference as a linear functional of $w_r$ and integrating the squared kernel (the same order-swap trick used throughout this module) gives $\operatorname{Var}(\bar y_2-\bar y_1) = 2Q_r\tau/3$, so

$$
\sigma_A^2(\tau) = \frac{Q_r\,\tau}{3}, \qquad \sigma_A(\tau) = \sqrt{Q_r}\sqrt{\tau/3}.
$$

At $\tau=3\,\mathrm s$ the $\sqrt{\tau/3}$ factor is exactly $1$, so the curve's value there is $\sqrt{Q_r}$ directly — the rate random walk lesson's noise-density reading, exactly analogous to reading ARW at $\tau=1\,\mathrm s$. Multiply by $60$ for the datasheet coefficient $K$ in $^\circ/\mathrm h/\sqrt{\mathrm h}$. A simulated pure rate-random-walk bias with $K=0.05\,^\circ/\mathrm h/\sqrt{\mathrm h}$ matches $\sigma_A(\tau)=\sqrt{Q_r\tau/3}$ to within $2\%$ at every $\tau$ tested, and its value at $\tau=3\,\mathrm s$ comes out to $8.4\times10^{-4\,\circ}/\mathrm h$, matching $K/60 = 8.3\times10^{-4}\,^\circ/\mathrm h$.

**Rate ramp, slope $+1$.** Not a random process at all — a slow, deterministic drift $b(t)=Rt$, from an uncompensated warm-up transient or a slowly changing supply voltage. Its integral is $\theta(t)=\tfrac12Rt^2$, and the second difference at $t=0,\tau,2\tau$ is $2R\tau^2 - R\tau^2 = R\tau^2$ exactly, the same for every cluster since there is nothing random to average over. So

$$
\sigma_A^2(\tau) = \frac{(R\tau^2)^2}{2\tau^2} = \frac{R^2\tau^2}{2}, \qquad \sigma_A(\tau) = \frac{R}{\sqrt2}\,\tau,
$$

confirmed exactly (to six figures) against a direct simulation of a pure ramp. A $+1$ slope on a real Allan plot is the signature of something that has not finished settling — most often the tail of a warm-up transient that the record was not long enough to run past — and it is a flag to extend the record, not a parameter to report.

| Process | $\sigma_A(\tau)$ | Slope | Read at |
| --- | --- | --- | --- |
| Quantization | $\sqrt3\,\sigma_q/\tau$ | $-1$ | anywhere on the line |
| Angle / velocity random walk | $\sqrt{Q}/\sqrt\tau$ | $-\tfrac12$ | $\tau=1\,\mathrm s$, $\times60$ |
| Bias instability | floor at $0.664\,B$ | $0$ | the minimum |
| Rate random walk | $\sqrt{Q_r}\sqrt{\tau/3}$ | $+\tfrac12$ | $\tau=3\,\mathrm s$, $\times60$ |
| Rate ramp | $R\tau/\sqrt2$ | $+1$ | extend the record instead |

::: example Recovering three parameters from one synthetic record

Synthesize $400\,000$ samples at $1\,\mathrm{Hz}$ ($400\,000\,\mathrm s$, about $4.6$ days) of a gyro with known $\mathrm{ARW}=0.3\,^\circ/\sqrt{\mathrm h}$; a bias instability built honestly as three superposed Gauss-Markov processes with correlation times $10$, $60$ and $400\,\mathrm s$ and combined $\sigma=3\,^\circ/\mathrm h$, standing in for real flicker noise the way this lesson's earlier five-process sum did; and a rate random walk of $K=8\,^\circ/\mathrm h/\sqrt{\mathrm h}$ — deliberately far larger than the $0.05$ used elsewhere in this module, chosen only so its upturn is visible inside a record short enough to simulate in under a second, since a realistic $K$ does not overtake bias instability until roughly a day, as the random-walk lesson found.

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

At $\tau=1\,\mathrm s$, $17.99/3600\times60=0.2998\,^\circ/\sqrt{\mathrm h}$ — divide the reading by $3600$ for the density and multiply by $60$ for ARW, or, working in $^\circ/\mathrm h$ throughout, divide by $60$ directly — recovering the true $0.3$ to three figures. The curve turns over between $\tau=200$ and $300\,\mathrm s$, bottoming out at $2.174\,^\circ/\mathrm h$ and rising to $2.70$ by $\tau=1000\,\mathrm s$: a genuine floor with the rate-random-walk upturn on its far side, the shape a single relaxation time alone never showed in this lesson's earlier check. Dividing the floor by $0.664$ gives $B\approx3.27\,^\circ/\mathrm h$ against the true $3.0$ — $9\%$ high, inside the $10\%$ the module's own Allan-deviation exercise asks for, the residual coming from finite-record estimation noise and from three relaxation times still being a coarse approximation to true flicker noise. This is the exercise's own workflow end to end: synthesize with known parameters, run the overlapping estimator, and check that what comes back is close to what went in — an Allan plot is an honest estimator, not an exact one.
:::

## Temperature effects

Every mechanism in the previous three lessons — spring constants, resonant frequencies, electronic offsets, the drive-to-sense coupling that makes quadrature error — depends on temperature, because every material property it rests on does. The consequence is not subtle. A tactical MEMS gyro's bias typically moves $0.01$ to $0.1\,^\circ/\mathrm h$ per degree Celsius; its scale factor moves tens of parts per million per degree. Compare that against the $3\,^\circ/\mathrm h$ bias instability this module has used throughout: a device that a lab Allan plot rates at $3\,^\circ/\mathrm h$ can show a field bias error several times larger after nothing more than climbing from a $20^\circ\mathrm C$ hangar to a $-15^\circ\mathrm C$ cruise altitude, unless that temperature dependence has been measured and removed.

::: example A cold start

A gyro with a thermal bias sensitivity of $0.04\,^\circ/\mathrm h/^\circ\mathrm C$ is calibrated at $20^\circ\mathrm C$ and flown after cooling to $-10^\circ\mathrm C$, a $\Delta T = 30^\circ\mathrm C$ excursion. Uncompensated, the bias shifts by $0.04\times30=1.2\,^\circ/\mathrm h$ — forty per cent of this module's running $3\,^\circ/\mathrm h$ bias instability figure, and, from the free-inertial growth law of the random-walk lesson, enough on its own to add roughly $\sigma\,t = 1.2\times(600/3600)=0.2^\circ$ of attitude error over a ten-minute coast, comparable to the whole stochastic budget computed there. A $20\,\mathrm{ppm}/^\circ\mathrm C$ scale factor over the same $30^\circ\mathrm C$ is a $600\,\mathrm{ppm}$ shift, enough by itself to matter on any manoeuvre of more than a few tens of degrees, by the scale-factor arithmetic of the error-model lesson. Neither number is exotic; both are why "the IMU was calibrated" is an incomplete sentence until it says over what temperature range.
:::

Two effects are distinct and both matter. The **steady-state** dependence is what the numbers above describe: bias and scale factor as smooth, repeatable functions of temperature once the unit has equilibrated. The **transient** is different: during warm-up, before the die and the case reach a common temperature, internal thermal gradients stress the sensing element in ways a single die-temperature reading does not capture, and the bias can wander well outside its steady-state thermal curve for the first several minutes after power-on — often the largest bias excursion the unit ever shows, and the reason a $+1$ rate-ramp slope on an Allan plot is so often traced to a record that started during warm-up rather than after it. A navigation-grade unit is typically given ten to fifteen minutes to stabilize before an alignment that matters is trusted; a tactical unit, less.

## Calibration in a thermal chamber

The fix is the same multi-position test the error-model lesson described, repeated at a ladder of temperatures. Soak the IMU in a chamber at each of perhaps five to nine points spanning its operating range, wait for thermal equilibrium at each one — minutes for a small MEMS part, longer for a unit with more thermal mass — and at each point run the six-orientation static test that separates bias, scale factor and misalignment from one another. The result is bias, scale factor, and (for a gyro) $g$-sensitivity, each as a table of values against temperature, one table per axis per parameter. Fit each table with a low-order polynomial, cubic is typical, or keep it as a lookup table with linear interpolation between points, and store the coefficients in the unit's own memory alongside a live die-temperature sensor.

In operation the correction is applied every sample: read the current temperature, evaluate the fitted bias and scale-factor curves at that temperature, and subtract or divide them out of the raw measurement before anything else in the mechanization sees it — this happens even before the calibration corrections of the error-model lesson's deterministic terms, because those terms are themselves usually the temperature-dependent quantities being corrected. What remains after thermal compensation is, ideally, the sensor's noise floor — the ARW, bias instability, and rate random walk this lesson has spent its time on — plus whatever residual the polynomial fit did not capture, typically the largest single contributor to the gap between a datasheet's lab-measured Allan plot and a unit's performance in the field.

::: warning
A chamber calibration measures temperature *level*, not temperature *rate*. A unit calibrated by soaking at each point until it stabilizes will compensate well for a slow, gentle temperature change and can still show a bias excursion during a fast one — a rapid climb, a sudden shift from shade to direct sun — because the internal gradients that a fast transient creates are not the same function of the single die-temperature reading that a slow soak produces. Where this matters, the calibration adds $dT/dt$ as a second input to the correction model, not just $T$ itself; where it does not, a longer warm-up hold before trusting the sensor is the cheaper fix.
:::

## Check yourself

::: check
An Allan deviation plot shows a clean $-1$ slope from $\tau=0.05\,\mathrm s$ to $\tau=0.3\,\mathrm s$ before flattening. At $\tau=0.1\,\mathrm s$ the value is $2\times10^{-4}\,^\circ/\mathrm s$. What is the quantization step $\Delta$, in degrees?
:::

::: answer
From $\sigma_A(\tau)=\sqrt3\,\sigma_q/\tau$, $\sigma_q = \sigma_A(\tau)\,\tau/\sqrt3 = 2\times10^{-4}\times0.1/\sqrt3 = 1.155\times10^{-5}\,^\circ$. Since $\sigma_q=\Delta/\sqrt{12}$, $\Delta = \sigma_q\sqrt{12} = 4.0\times10^{-5\,\circ}$, about $0.14$ arcseconds per count.
:::

::: check
Why does a single Gauss-Markov process's Allan deviation eventually fall again at very large $\tau$, instead of staying at its peak?
:::

::: answer
Once the averaging time $\tau$ is many correlation times long, each block average is effectively an average of many statistically independent samples drawn from the process's own stationary distribution, because the process has forgotten its state many times over within one block. Averaging more independent samples reduces variance the same way it always does, as $1/\sqrt\tau$, so the curve resumes the $-\tfrac12$ slope of ordinary white noise — the process looks, from far enough away in time, like noise with no memory at all, even though up close it is highly correlated.
:::

::: check
Two gyros show identical Allan deviation floors of $2\,^\circ/\mathrm h$. One floor is flat from $\tau=50\,\mathrm s$ to $\tau=2000\,\mathrm s$; the other is a narrow dip only between $\tau=180$ and $\tau=220\,\mathrm s$. What does the difference tell you about each sensor's internal physics?
:::

::: answer
The wide, flat floor is consistent with true flicker-type noise — many superposed relaxation mechanisms with a broad spread of correlation times, none dominant, exactly the picture this lesson built from summing several Gauss-Markov processes. The narrow dip is closer to a single relaxation process with one dominant correlation time near $T\approx\tau_{\min}/1.89\approx105\,\mathrm s$; away from that narrow window its Allan deviation is rising toward the dip on one side and falling away from it on the other, exactly as the closed-form single-process formula predicts, rather than sitting flat. The two sensors can share a bias-instability specification and still behave differently over a mission whose duration falls outside that narrow window.
:::

::: check
A vendor's datasheet gives rate random walk as $K=0.08\,^\circ/\mathrm h/\sqrt{\mathrm h}$. What is the strength $Q_r$ in $(^\circ/\mathrm h)^2/\mathrm s$, and what is the Allan deviation this process alone produces at $\tau=3\,\mathrm s$ and at $\tau=300\,\mathrm s$?
:::

::: answer
$Q_r = (K/60)^2 = (0.08/60)^2 = 1.778\times10^{-6}\,(^\circ/\mathrm h)^2/\mathrm s$. At $\tau=3\,\mathrm s$, $\sigma_A=\sqrt{Q_r\times3/3}=\sqrt{Q_r}=1.333\times10^{-3}\,^\circ/\mathrm h$, which is $K/60$ as the reading convention promises. At $\tau=300\,\mathrm s$, $\sigma_A=\sqrt{Q_r\times300/3}=\sqrt{100\,Q_r}=10\times1.333\times10^{-3}=0.0133\,^\circ/\mathrm h$ — the $+\tfrac12$ slope means a hundred-fold increase in $\tau$ produced only a tenfold increase in $\sigma_A$.
:::

::: check
An IMU is calibrated at $20^\circ\mathrm C$ only, with a gyro bias thermal sensitivity of $0.03\,^\circ/\mathrm h/^\circ\mathrm C$ and negligible bias instability by comparison. Roughly how much attitude error does a $10\,\mathrm{minute}$ flight at $5^\circ\mathrm C$ pick up from thermal bias alone, and how would you remove it without a second calibration point?
:::

::: answer
$\Delta T = 15^\circ\mathrm C$ gives an uncompensated bias of $0.03\times15=0.45\,^\circ/\mathrm h$. Treated as constant over the flight, the attitude error is $b\,t = 0.45\times(600/3600)=0.075^\circ$. Without a second chamber point the slope itself is unknown, so there is nothing to interpolate; the only recourse with a single-temperature calibration is to measure the bias in flight, for instance by holding still at the start for a zero-velocity update or a gyrocompass alignment, which observes and removes whatever bias is present at that day's actual temperature rather than relying on a lab number taken at a different one.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\sigma_A^2(\tau)=\frac{1}{2\tau^2(N-2m)}\sum(\theta_{i+2m}-2\theta_{i+m}+\theta_i)^2$ | Overlapping Allan variance; every valid window, not every $m$-th one |
| $\sqrt3\sigma_q/\tau$, slope $-1$ | Quantization |
| $\sqrt{Q}/\sqrt\tau$, slope $-\tfrac12$, read at $\tau=1\,\mathrm s$ | Angle / velocity random walk |
| $\frac{\sigma^2T^2}{\tau^2}[2\tau/T-3+4e^{-\tau/T}-e^{-2\tau/T}]$ | Single Gauss-Markov process: a hump peaking at $\tau\approx1.89T$, height $\approx0.62\sigma$ |
| Floor at $0.664\,B$ | Bias instability, for the many-relaxation-time (flicker) limit |
| $\sqrt{Q_r}\sqrt{\tau/3}$, slope $+\tfrac12$, read at $\tau=3\,\mathrm s$ | Rate random walk |
| $R\tau/\sqrt2$, slope $+1$ | Rate ramp — usually an unfinished warm-up transient |
| Steady-state vs transient thermal sensitivity | Bias/scale factor vs temperature level, and vs how fast it is changing |

This closes the module's account of what a sensor does on its own, sitting still. The next lesson puts a triad of each in motion: the strapdown mechanization equations that turn a stream of corrected gyro and accelerometer samples into attitude, velocity and position, in the three reference frames a navigator actually computes in.
