---
id: l03-random-walk-bias-instability-rate-random-walk
title: Random walk, bias instability, and rate random walk
minutes: 17
covers:
  - "Angle random walk, velocity random walk, rate random walk, and bias instability"
---

The error-model lesson wrote a gyro's output as the true rate, plus five deterministic terms a calibration table removes, plus two random ones: white noise and a wandering bias. Those two random terms are not one thing each. A bias wanders on at least two distinguishable time scales, with two different long-run behaviours, and each behaviour has its own name, its own datasheet units, and its own consequence for how long an unaided coast can last. This lesson gives each one a precise definition and a growth law: **angle random walk** and **velocity random walk**, the direct integrals of white sensor noise; **bias instability**, the size of the bounded wander a bias makes around its own mean; and **rate random walk**, a slower and structurally different process in which the bias itself has no mean to return to.

These four numbers are what a datasheet's noise specification actually describes, and they are what the process-noise matrix of an aided filter is built from, term by term. The probability module derived the machinery in full — white noise, the random walk it integrates into, and the first-order Gauss-Markov process that gives a bias finite memory — and worked every formula below for a representative tactical-grade gyro and accelerometer. This lesson does not repeat that derivation. It recalls the results, adds the one process the probability module only sketched in passing, and then puts all four side by side on the same sensor, at the same coast times, so their relative sizes become a habit rather than a formula to look up.

Why this matters here rather than in a statistics module: an inertial navigator has no choice but to integrate everything it is handed, forever, with nothing to reset against until an aiding measurement arrives. A radio receiver that free-runs for an hour produces an hour of noise. A gyro that free-runs for an hour produces an attitude error that is the *integral* of an hour of noise, and the shape of that integral — square-root, saturating, or unbounded — is set entirely by which of these four processes is doing the integrating.

## Angle random walk and velocity random walk, recalled

White rate noise $w(t)$, with $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t-\tau)$, integrates into a random walk in angle. The probability module derived this exactly: the standard deviation grows as $\sigma_\theta(t) = \sqrt{Q}\,\sqrt{t}$, and gyro datasheets report $\sqrt{Q}$ in units of degrees per root hour, the **angle random walk** (ARW), related to a rate noise density in $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ by the factor $60 = \sqrt{3600\,\mathrm{s/h}}$:

$$
\mathrm{ARW}\ [^\circ/\sqrt{\mathrm{h}}] = 60 \times \text{density}\ [^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}], \qquad
\sigma_\theta(t) = \mathrm{ARW}\sqrt{t[\mathrm{h}]}.
$$

White specific-force noise on an accelerometer integrates the same way into velocity: the **velocity random walk** (VRW), in $\mathrm{m/s}/\sqrt{\mathrm{h}}$, obtained from a noise density in $\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}$ by the identical factor of $60$, giving $\sigma_v(t) = \mathrm{VRW}\sqrt{t[\mathrm{h}]}$. Both are consequences of one fact proved once: integrate white noise and you get a process whose variance grows linearly in time, so its standard deviation grows as $\sqrt{t}$ — fast at first, slower and slower thereafter, but never stopping.

::: key Angle random walk
White noise on the rate output integrates into an attitude random walk, quoted in $^\circ/\sqrt{\mathrm{h}}$: $\sigma_\theta(t) = \mathrm{ARW}\sqrt{t[\mathrm{h}]}$. It is read off an Allan deviation plot at $\tau = 1\,\mathrm{s}$ on the $-\tfrac12$ slope, which the next lesson derives. Velocity random walk is the same process on an accelerometer, in $\mathrm{m/s}/\sqrt{\mathrm{h}}$.
:::

## Bias instability: the wander that saturates

A real bias is not white — it has memory — and it is not a plain random walk either, because a plain random walk's uncertainty grows without limit, while a bench record of a real bias stays inside a band for as long as you care to watch it. The probability module's first-order Gauss-Markov process is the model with exactly that property: $\dot{b} = -b/T + w$, restoring force plus white noise, stationary variance $\sigma^2 = QT/2$. The datasheet number that reports this stationary standard deviation is **bias instability**, written $B$, in $^\circ/\mathrm{h}$ for a gyro or $\mu g$ for an accelerometer.

$B$ is not read directly off a time record — a finite record's sample standard deviation depends on how long you watched, since a Gauss-Markov process needs several correlation times to reach its stationary variance and a short record undershoots it. It is read off the flattest part of an Allan deviation curve instead, and the next lesson derives exactly why that floor sits at $0.664\,B$ rather than at $B$ itself. For now, treat $B \approx \sigma$: the bias instability is the size of the band a bias wanders inside once it has forgotten where it started, and it does not grow with how long you keep the sensor on.

::: key Bias instability
The stationary standard deviation of a first-order Gauss-Markov bias, $B \approx \sigma = \sqrt{QT/2}$. It is read off the flat floor of an Allan deviation plot, at height $0.664\,B$. Unlike a random walk it saturates: watching longer does not make the band wider.
:::

## Rate random walk: the wander that does not

Every real gyro also carries a slower process that the Gauss-Markov model, tuned to fit the minutes-to-hours wander above, does not capture: over very long times the bias itself drifts, not around a fixed mean but without one, from aging, slow structural relaxation, and radiation or thermal effects with no restoring mechanism on any time scale a flight cares about. Model that as one further integration. Instead of $\dot b = -b/T + w$, write

$$
\dot{b}(t) = w_r(t), \qquad \mathbb{E}[w_r(t)w_r(\tau)] = Q_r\,\delta(t-\tau) :
$$

no restoring term at all, so the bias is itself a Wiener process. This is precisely the random-walk construction the probability module built from white noise, applied one level up: there, $\dot x = w$ made a position random-walk from a white velocity noise; here, $\dot b = w_r$ makes a *rate* random-walk from a white noise on the bias's own derivative. By the identical calculation — a single delta-function collapse under a double integral — the bias itself now has standard deviation

$$
\sigma_b(t) = \sqrt{Q_r}\,\sqrt{t}.
$$

Datasheets report $\sqrt{Q_r}$ as the **rate random walk** (RRW) coefficient $K$, in $^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$, with the same hour-conversion factor of $60$ as ARW: $K = 60\sqrt{Q_r}$ when $Q_r$ is expressed per second. On the Allan deviation plot it produces the mirror image of angle random walk, a slope of $+\tfrac12$ rather than $-\tfrac12$, because the underlying white noise is now one integration further from what the plot displays.

Attitude error is one integration further still, since $\theta_r(t) = \int_0^t b(s)\,ds$ with $b$ itself Brownian. That is exactly the double integral of white noise the probability module carried out to get position error from accelerometer white noise, $\sigma_p(t) = \sqrt{Q}\,t^{3/2}/\sqrt3$ — substitute a bias random walk for a velocity random walk and an attitude for a position, and the same $t^{3/2}$ law appears:

$$
\sigma_{\theta,\mathrm{RRW}}(t) = \sqrt{Q_r}\,\frac{t^{3/2}}{\sqrt3}.
$$

This is the fastest-growing of the four processes in this lesson, precisely because it sits two integrations away from a white source instead of one. It is also, for most gyros, the smallest in absolute size over any coast a vehicle actually flies, because $Q_r$ is tiny; the worked example below puts a number on both halves of that sentence.

::: key Rate random walk
A bias with no restoring term, $\dot b = w_r$, is itself a random walk: $\sigma_b(t) = K\sqrt{t[\mathrm{h}]}$, $K$ in $^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$. Its attitude effect grows as $t^{3/2}$, the fastest law in this lesson, and it shows as a $+\tfrac12$ slope on the Allan plot, opposite angle random walk's $-\tfrac12$.
:::

::: warning
Bias instability and rate random walk are frequently confused because both describe "the bias drifting," and a filter tuned with one number standing in for the other is wrong in a specific, dangerous direction. Feed a filter a rate-random-walk state where a saturating Gauss-Markov bias belongs, and its estimated bias uncertainty grows without bound over a long, quiet flight, so it distrusts a perfectly good bias estimate and leans on aiding measurements it does not need. Feed it a Gauss-Markov state where a genuine long-term drift belongs, and the covariance saturates while the real bias keeps walking away underneath it, so the filter becomes overconfident exactly when it should not be. The cure is not a better number; it is carrying both states, because most real sensors have both mechanisms at once.
:::

## The four terms side by side

| Process | Driving equation | Grows as | Units | Allan slope |
| --- | --- | --- | --- | --- |
| Angle random walk | $\dot\theta = w$ | $\sigma_\theta \propto \sqrt{t}$ | $^\circ/\sqrt{\mathrm{h}}$ | $-\tfrac12$ |
| Velocity random walk | $\dot v = w$ | $\sigma_v \propto \sqrt{t}$ | $\mathrm{m/s}/\sqrt{\mathrm{h}}$ | $-\tfrac12$ |
| Bias instability | $\dot b = -b/T + w$ | saturates at $B$ | $^\circ/\mathrm{h}$, $\mu g$ | $0$ (floor) |
| Rate random walk | $\dot b = w_r$ | $\sigma_b \propto \sqrt{t}$, $\sigma_\theta \propto t^{3/2}$ | $^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$ | $+\tfrac12$ |

Two more processes bound this family at either end — quantization, whose $-1$ slope the error-model lesson already met, and a deterministic rate ramp with slope $+1$ — and the next lesson places all five on one plot and shows why the slope is diagnostic rather than incidental. Everything in this lesson is a statement about one axis of one sensor; the three axes of a triad are modelled as independent unless a calibration explicitly says otherwise, so their variances add when you need a vector error, exactly as independent variances always do.

::: example A tactical gyro left to coast

Take the tactical MEMS gyro the probability module used throughout: $\mathrm{ARW} = 0.3\,^\circ/\sqrt{\mathrm{h}}$, bias instability $\sigma = 3\,^\circ/\mathrm{h}$ with correlation time $T = 100\,\mathrm{s}$. Give it a representative rate random walk of $K = 0.05\,^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$ — small enough that a good fibre-optic gyro might not show it in a day's record, large enough that a MEMS part often does. Compute the attitude error each term produces alone, uncorrelated with the others, after $10\,\mathrm{s}$, $60\,\mathrm{s}$, and $3600\,\mathrm{s}$ of free coast, and combine by root-sum-square.

```python
import numpy as np

ARW, sigma_b, T_b, K = 0.3, 3.0, 100.0, 0.05   # deg/sqrt(h), deg/h, s, deg/h/sqrt(h)

def sigma_arw(t):                       # t in seconds
    return ARW * np.sqrt(t / 3600.0)

def sigma_bias_instability(t, sigma=sigma_b, T=T_b):
    s = sigma / 3600.0                  # deg/s
    var = 2 * s**2 * T**2 * (t / T - 1 + np.exp(-t / T))
    return np.sqrt(var)

def sigma_rrw(t, K=K):
    Qr = (np.deg2rad(K) / 3600.0 / 60.0) ** 2   # (rad/s)^2/s, driving the bias derivative
    return np.degrees(np.sqrt(Qr * t**3 / 3.0))

for t in [10.0, 60.0, 3600.0]:
    a, g, r = sigma_arw(t), sigma_bias_instability(t), sigma_rrw(t)
    print(f"t={t:6.0f}s  ARW={a:.5f} deg  bias-instab={g:.5f} deg  RRW={r:.7f} deg  RSS={np.sqrt(a*a+g*g+r*r):.5f} deg")
# t=    10s  ARW=0.01581 deg  bias-instab=0.00820 deg  RRW=0.0000042 deg  RSS=0.01781 deg
# t=    60s  ARW=0.03873 deg  bias-instab=0.04546 deg  RRW=0.0000621 deg  RSS=0.05972 deg
# t=  3600s  ARW=0.30000 deg  bias-instab=0.69722 deg  RRW=0.0288675 deg  RSS=0.75957 deg
```

At ten seconds white noise wins outright: bias instability has not had time to reveal itself as anything but a constant, and rate random walk is six orders of magnitude too small to matter. By a minute the two dominant terms are within twenty per cent of each other — solving $\mathrm{ARW}\sqrt{t} = \sigma_{\mathrm{bias\ instab}}(t)$ numerically puts the exact crossover at $t \approx 41\,\mathrm{s}$ — and past that point bias instability leads for the rest of the hour, ending more than twice angle random walk's contribution. Rate random walk, despite growing as $t^{3/2}$ against everyone else's $t^{1/2}$, is still two orders of magnitude below angle random walk even at the one-hour mark; solving the same way shows it does not overtake angle random walk until $t \approx 37\,400\,\mathrm{s}$, nearly ten and a half hours of continuous unaided coasting. That crossover time, not the coefficient itself, is the number worth remembering: rate random walk is a concern for a ship or a submarine, and irrelevant to a ten-minute rocket flight.
:::

::: example The same coast, through the accelerometer

Reuse the probability module's accelerometer: velocity random walk $\mathrm{VRW} = 0.0588\,\mathrm{m/s}/\sqrt{\mathrm{h}}$ (from a $100\,\mu g/\sqrt{\mathrm{Hz}}$ noise density) and bias instability $\sigma = 50\,\mu g = 4.905\times10^{-4}\,\mathrm{m/s^2}$ with $T = 300\,\mathrm{s}$.

```python
import numpy as np

VRW, sigma_a, T_a = 0.0588, 50e-6 * 9.80665, 300.0   # m/s/sqrt(h), m/s^2, s

def sigma_vrw(t):
    return VRW * np.sqrt(t / 3600.0)

def sigma_v_bias(t, sigma=sigma_a, T=T_a):
    return np.sqrt(2 * sigma**2 * T**2 * (t / T - 1 + np.exp(-t / T)))

for t in [10.0, 60.0, 3600.0]:
    v, b = sigma_vrw(t), sigma_v_bias(t)
    print(f"t={t:6.0f}s  VRW={v:.6f} m/s  bias-instab={b:.6f} m/s  RSS={np.sqrt(v*v+b*b):.6f} m/s")
# t=    10s  VRW=0.003099 m/s  bias-instab=0.004876 m/s  RSS=0.005778 m/s
# t=    60s  VRW=0.007591 m/s  bias-instab=0.028471 m/s  RSS=0.029466 m/s
# t=  3600s  VRW=0.058800 m/s  bias-instab=0.689959 m/s  RSS=0.692460 m/s
```

Here bias instability overtakes velocity random walk almost immediately — the crossover works out to about $4\,\mathrm{s}$ — and by an hour it is more than eleven times larger. The accelerometer's bias term dominates far earlier than the gyro's did, for the same reason the error-model lesson flagged: bias instability integrates once into velocity, exactly as white noise does, so the two random-walk-shaped curves race on equal footing in their time exponent, and the one with the larger coefficient at short times stays ahead throughout. There is nothing here yet about *position* — velocity error still has to be integrated once more, which is where the next lessons' cubic and quadratic growth laws come from — but the ranking of the two velocity terms already tells you which one a filter needs to estimate first.
:::

## Check yourself

::: check
A gyro has $\mathrm{ARW} = 0.15\,^\circ/\sqrt{\mathrm{h}}$ and negligible bias instability and rate random walk. How long can it coast unaided before white noise alone has contributed $0.05^\circ$ of attitude error?
:::

::: answer
Solve $0.05 = 0.15\sqrt{t[\mathrm h]}$ for $t$: $\sqrt{t} = 1/3$, $t = 1/9\,\mathrm{h} = 400\,\mathrm{s}$. Doubling the tolerance to $0.1^\circ$ would not double the time — it would quadruple it, to $1600\,\mathrm{s}$, because the growth is in $\sqrt{t}$, not $t$.
:::

::: check
Explain, without formulas, why bias instability has an Allan-plot slope of exactly zero while angle random walk and rate random walk have slopes of $-\tfrac12$ and $+\tfrac12$.
:::

::: answer
Angle random walk comes from averaging white noise over a window of length $\tau$: a longer window averages more independent samples, so the residual shrinks, at the $\sqrt\tau$ rate any average of independent noise shrinks by — hence the negative slope. Bias instability is a Gauss-Markov process that has already reached its steady-state variance once $\tau$ exceeds a few correlation times; averaging longer does not shrink a quantity that is not decreasing in the first place, so the curve is flat. Rate random walk is the opposite of angle random walk: instead of averaging down, the *bias itself* accumulates further wander the longer you watch, so the curve grows with $\tau$ rather than shrinking, mirroring angle random walk's slope in sign.
:::

::: check
Two gyros have the same bias instability, $B = 2\,^\circ/\mathrm{h}$, but correlation times of $T_1 = 20\,\mathrm{s}$ and $T_2 = 2000\,\mathrm{s}$. Which one contributes less attitude error over a $30\,\mathrm{s}$ coast, and why?
:::

::: answer
The gyro with the shorter correlation time contributes less. Over $30\,\mathrm{s}$, $T_1 = 20\,\mathrm{s}$ is only $1.5$ correlation times, so its bias has had room to wander and partly cancel; $T_2 = 2000\,\mathrm{s}$ means $30\,\mathrm{s}$ is under two per cent of one correlation time, so that bias is, for practical purposes, a constant, and a constant bias produces the largest possible attitude error a given $\sigma$ can produce, $\sigma\,t$, over any interval short compared with $T$. The datasheet number $B$ alone does not decide which sensor is better over a short coast; $T$ does.
:::

::: check
A rate-random-walk coefficient is quoted as $K = 0.02\,^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$. What is the standard deviation of the bias itself after a $10\,\mathrm{h}$ flight, and how does that compare with a bias instability of $B = 1\,^\circ/\mathrm{h}$?
:::

::: answer
$\sigma_b(10\,\mathrm h) = 0.02\sqrt{10} = 0.0632\,^\circ/\mathrm h$, about $6\%$ of the bias instability figure. Over this particular flight length the saturating process is still the larger of the two, but rate random walk keeps growing with every additional hour while bias instability does not, so a mission profile matters as much as the coefficients: the same two sensors compared over a $100\,\mathrm h$ flight would show $\sigma_b = 0.02\sqrt{100} = 0.2\,^\circ/\mathrm h$, a fifth of $B$ and closing.
:::

::: check
Why does the accelerometer's bias instability overtake its velocity random walk so much sooner (about $4\,\mathrm s$) than the gyro's bias instability overtakes its angle random walk (about $41\,\mathrm s$), given that both pairs grow with the same two time-exponents?
:::

::: answer
Both crossovers are races between a $\sqrt t$ curve and a curve that starts at zero, grows roughly linearly for $t \ll T$, and saturates afterward — the shape is identical in both cases. What differs is the ratio of the coefficients at short time: for the accelerometer, the bias instability's initial slope ($\sigma_a/1$, using $\sigma_a = 4.905\times10^{-4}\,\mathrm{m/s^2}$) is large relative to $\mathrm{VRW}=0.0588\,\mathrm m/\mathrm s/\sqrt{\mathrm h}$, while for the gyro the corresponding ratio is smaller. A shorter correlation time also pulls the crossover earlier, and $T_a = 300\,\mathrm s$ for the accelerometer is not vastly different from $T_b=100\,\mathrm s$ for the gyro, so the dominant effect is the size of the bias-instability coefficient itself relative to the random-walk coefficient — the accelerometer's is the larger of the two ratios.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathrm{ARW}\ [^\circ/\sqrt{\mathrm h}] = 60\times$ density | Angle random walk; $\sigma_\theta(t) = \mathrm{ARW}\sqrt{t[\mathrm h]}$ |
| $\mathrm{VRW}\ [\mathrm{m/s}/\sqrt{\mathrm h}] = 60\times$ density | Velocity random walk; $\sigma_v(t) = \mathrm{VRW}\sqrt{t[\mathrm h]}$ |
| $\dot b = -b/T+w$, $B\approx\sigma=\sqrt{QT/2}$ | Bias instability: saturating Gauss-Markov wander, Allan floor at $0.664B$ |
| $\dot b = w_r$, $K=60\sqrt{Q_r}$ | Rate random walk: $\sigma_b(t)=K\sqrt{t[\mathrm h]}$, attitude effect $\propto t^{3/2}$ |
| Slopes $-\tfrac12, 0, +\tfrac12$ | Angle/velocity random walk, bias instability, rate random walk on an Allan plot |
| RSS combination | Independent error sources: variances add, so standard deviations combine as $\sqrt{\sum\sigma_i^2}$ |

The next lesson builds the Allan deviation itself, derives all five slopes — including quantization's $-1$ and the rate ramp's $+1$ that bound this lesson's three — from first principles, and shows how to read a bias instability, an angle random walk and a rate random walk coefficient off one plot of real IMU data.
