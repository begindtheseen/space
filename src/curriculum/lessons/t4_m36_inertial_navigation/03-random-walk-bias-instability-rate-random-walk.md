---
id: l03-random-walk-bias-instability-rate-random-walk
title: Random walk, bias instability, and rate random walk
minutes: 18
covers:
  - "Angle random walk, velocity random walk, rate random walk, and bias instability"
---

Picture a person walking home in the dark, taking each step in a random direction. After a while, how far are they from the lamppost? Not zero, and not steps times step length either. Somewhere in between, and growing more and more slowly. Now picture a dog on a leash tied to the lamppost: it wanders, but never farther than the leash. And picture a lamppost that is itself sliding slowly across the street, with nothing pulling it back.

Those three pictures are this lesson. The error-model lesson wrote a gyro's output as the truth, plus fixed terms a calibration table removes, plus two random ones: white noise and a wandering bias. The random part splits into distinct behaviors, each with its own name, datasheet units, and effect on how long an unaided coast can last:

- **angle random walk** and **velocity random walk**, the running total of white sensor noise — the walker;
- **bias instability**, the size of the bounded wander a bias makes around its average — the dog on a leash;
- **rate random walk**, a slower process in which the bias has no average to return to — the sliding lamppost.

These numbers are what a datasheet's noise section describes, and the navigation filter's process noise is built from them, term by term. The probability module derived the machinery: white noise, the random walk it adds up to, and the Gauss–Markov process that gives a bias limited memory. This lesson recalls those results, adds the one process that module only sketched, and puts all of them side by side on one sensor so their sizes become a habit.

Why here and not in a statistics module? An inertial navigator must add up everything it is handed, forever, with nothing to reset against until an outside measurement arrives. A gyro that runs free for an hour produces an attitude error that is the *total* of an hour of noise. The shape of that total — square-root, leveling off, or runaway — is set entirely by which of these processes is doing the adding.

## Angle random walk and velocity random walk, recalled

**White noise** is jitter where every sample is unrelated to the one before, like the hiss on an untuned radio. Write the white rate noise as $w(t)$. Its strength is $Q$, defined by $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t-\tau)$. Here $\mathbb{E}$ means "the average over many tries" and $\delta$ ("delta") is a spike at zero that says samples at different times are unrelated.

Adding up white noise gives a **[[random walk|random-walk]]**. The probability module proved that its standard deviation grows as

$$
\sigma_\theta(t) = \sqrt{Q}\,\sqrt{t}.
$$

Gyro datasheets report $\sqrt{Q}$ in degrees per root hour. This is the **angle random walk** (ARW). It connects to a rate noise density in $^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$ by the factor $60 = \sqrt{3600\,\mathrm{s/h}}$:

$$
\mathrm{ARW}\ [^\circ/\sqrt{\mathrm{h}}] = 60 \times \text{density}\ [^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}], \qquad
\sigma_\theta(t) = \mathrm{ARW}\sqrt{t[\mathrm{h}]}.
$$

Here $t[\mathrm{h}]$ means "time measured in hours". The **[[odd unit|root-hour]]** $^\circ/\sqrt{\mathrm{h}}$ is there because the error grows with the square root of time.

White noise on an accelerometer adds up the same way, into velocity. That is the **velocity random walk** (VRW), in $\mathrm{m/s}/\sqrt{\mathrm{h}}$. It comes from a noise density in $\mathrm{m/s^2}/\sqrt{\mathrm{Hz}}$ by the same factor of $60$, and $\sigma_v(t) = \mathrm{VRW}\sqrt{t[\mathrm{h}]}$.

Both come from one fact: add up white noise, and the variance grows in step with time, so the standard deviation grows as $\sqrt{t}$. Fast at first, then slower and slower, but it never stops. Four times as long gives only twice the error.

::: key Angle random walk
White noise on the rate output integrates into an attitude random walk, quoted in $^\circ/\sqrt{\mathrm{h}}$: $\sigma_\theta(t) = \mathrm{ARW}\sqrt{t[\mathrm{h}]}$. It is read off an Allan deviation plot at $\tau = 1\,\mathrm{s}$ on the $-\tfrac12$ slope, which the next lesson derives. Velocity random walk is the same process on an accelerometer, in $\mathrm{m/s}/\sqrt{\mathrm{h}}$.
:::

## Bias instability: the wander that levels off

A real bias is not white, because it has memory: this second's bias is close to last second's. But it is not a plain random walk either. A plain random walk's spread grows forever, while a bench recording of a real bias stays inside a band for as long as you watch.

The dog on the leash has exactly that behavior, and the probability module's first-order **Gauss–Markov process** is its equation:

$$
\dot{b} = -\frac{b}{T} + w .
$$

Read $\dot b$ as "b dot", how fast the bias changes. The term $-b/T$ is the leash: it pulls the bias back toward zero, harder the farther it strays. The **[[correlation time|correlation-time]]** $T$ says how long the bias "remembers" where it was. The white noise $w$ is the random kicks. Pull and kicks balance at a steady variance $\sigma^2 = QT/2$.

The datasheet number that reports this steady standard deviation is **bias instability**, written $B$. It is in $^\circ/\mathrm{h}$ for a gyro or $\mathrm{\mu g}$ for an accelerometer.

You do not read $B$ straight off a time recording. A Gauss–Markov process needs several correlation times to spread out to its full width, so a short recording underestimates it, and the answer depends on how long you watched. Instead $B$ is read off the flattest part of an **[[Allan deviation|allan-preview]]** curve. The next lesson shows why that floor sits at $0.664\,B$ rather than at $B$ itself. For now, treat $B \approx \sigma$: bias instability is the width of the band the bias wanders in once it has forgotten where it started. It does not grow however long you leave the sensor on.

::: key Bias instability
The stationary standard deviation of a first-order Gauss–Markov bias, $B \approx \sigma = \sqrt{QT/2}$. It is read off the flat floor of an Allan deviation plot, at height $0.664\,B$. Unlike a random walk it saturates: watching longer does not make the band wider.
:::

## Rate random walk: the wander that does not level off

Every real gyro also has a slower process that the leash model misses. Over very long times the bias itself drifts off, with no average to come back to. Aging, slow relaxation of the structure, radiation and temperature effects all push it, and nothing pulls it back on any time scale a flight cares about. That is the sliding lamppost.

Model it by cutting the leash. Instead of $\dot b = -b/T + w$, write

$$
\dot{b}(t) = w_r(t), \qquad \mathbb{E}[w_r(t)w_r(\tau)] = Q_r\,\delta(t-\tau) .
$$

With no pull-back term, the bias is itself a random walk. This is the same construction the probability module built, moved one level up. There, $\dot x = w$ turned white velocity noise into a random-walk position. Here, $\dot b = w_r$ turns white noise on the bias's own rate of change into a random-walk *rate*. The same calculation gives

$$
\sigma_b(t) = \sqrt{Q_r}\,\sqrt{t}.
$$

Datasheets report $\sqrt{Q_r}$ as the **rate random walk** (RRW) coefficient $K$, in $^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$ — "degrees per hour, per root hour": a rate that grows like the square root of hours. The same factor of $60$ converts it: $K = 60\sqrt{Q_r}$ when $Q_r$ is in $(^\circ/\mathrm{h})^2$ per second. On the Allan deviation plot it shows the mirror image of angle random walk, a slope of $+\tfrac12$ instead of $-\tfrac12$, because its white noise sits one integration further from what the plot shows.

Attitude error is one more integration away, since $\theta_r(t) = \int_0^t b(s)\,ds$ ("the running total of the bias"). The probability module did exactly this double integral of white noise to get position error from accelerometer noise, and found $\sigma_p(t) = \sqrt{Q}\,t^{3/2}/\sqrt3$. Swap the random-walk velocity for a random-walk bias, and position for attitude, and the same law appears:

$$
\sigma_{\theta,\mathrm{RRW}}(t) = \sqrt{Q_r}\,\frac{t^{3/2}}{\sqrt3}.
$$

Read $t^{3/2}$ as "t to the three-halves", which is $t\sqrt{t}$. This is the fastest-growing law in the lesson, because it is two integrations from a white source instead of one. It is also, for most gyros, the smallest over any coast a vehicle really flies, because $Q_r$ is tiny. The first worked example below puts numbers on both halves of that sentence.

::: key Rate random walk
A bias with no restoring term, $\dot b = w_r$, is itself a random walk: $\sigma_b(t) = K\sqrt{t[\mathrm{h}]}$, $K$ in $^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$. Its attitude effect grows as $t^{3/2}$, the fastest law in this lesson, and it shows as a $+\tfrac12$ slope on the Allan plot, opposite angle random walk's $-\tfrac12$.
:::

::: warning
Bias instability and rate random walk are often confused, because both describe "the bias drifting". Using one in place of the other in a filter goes wrong in a specific, dangerous way.

- **Random-walk state where a leashed bias belongs:** the filter's bias uncertainty grows without limit over a long, quiet flight. It stops trusting a perfectly good bias estimate and leans on outside measurements it does not need.
- **Leashed state where a real long-term drift belongs:** the filter's uncertainty levels off while the true bias keeps walking away underneath it. The filter becomes **[[overconfident|overconfident]]** exactly when it should not be.

The cure is not a better number. It is carrying both states, because most real sensors have both behaviors at once.
:::

## The four terms side by side

| Process | Driving equation | Grows as | Units | Allan slope |
| --- | --- | --- | --- | --- |
| Angle random walk | $\dot\theta = w$ | $\sigma_\theta \propto \sqrt{t}$ | $^\circ/\sqrt{\mathrm{h}}$ | $-\tfrac12$ |
| Velocity random walk | $\dot v = w$ | $\sigma_v \propto \sqrt{t}$ | $\mathrm{m/s}/\sqrt{\mathrm{h}}$ | $-\tfrac12$ |
| Bias instability | $\dot b = -b/T + w$ | saturates at $B$ | $^\circ/\mathrm{h}$, $\mu g$ | $0$ (floor) |
| Rate random walk | $\dot b = w_r$ | $\sigma_b \propto \sqrt{t}$, $\sigma_\theta \propto t^{3/2}$ | $^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$ | $+\tfrac12$ |

Two more processes sit at either end of this family: quantization, whose $-1$ slope the error-model lesson met, and a steady rate ramp with slope $+1$. The next lesson puts all five on one plot.

Everything here describes one axis of one sensor. The three axes of a triad are treated as independent unless calibration says otherwise. **Independent** errors combine by **[[root-sum-square|rss]]** (RSS): their variances add, so the total standard deviation is $\sqrt{\sigma_1^2 + \sigma_2^2 + \cdots}$.

::: note Why it has to be true
Where does the Gauss–Markov attitude error used in the examples come from? Integrate $b$ over time $t$. For a leashed bias that started in its steady state, the probability module showed the variance of the running total is
$$
\sigma_\theta^2(t) = 2\sigma^2T^2\left(\frac{t}{T} - 1 + e^{-t/T}\right).
$$
Check the two ends. For $t \ll T$, $e^{-t/T} \approx 1 - t/T + t^2/(2T^2)$, so the bracket is about $t^2/(2T^2)$ and $\sigma_\theta \approx \sigma t$: a constant bias. For $t \gg T$, the bracket is about $t/T$, so $\sigma_\theta \approx \sigma\sqrt{2Tt}$: a random walk.
:::

::: example A tactical gyro left to coast
Take the tactical MEMS gyro from the probability module: $\mathrm{ARW} = 0.3\,^\circ/\sqrt{\mathrm{h}}$, and bias instability $\sigma = 3\,^\circ/\mathrm{h}$ with correlation time $T = 100\,\mathrm{s}$. Give it a rate random walk of $K = 0.05\,^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$ — small enough that a good fiber-optic gyro might not show it in a day's recording, big enough that a MEMS part often does.

Work out the attitude error each term causes alone after $10\,\mathrm{s}$, $60\,\mathrm{s}$ and $3600\,\mathrm{s}$ of free coasting, then combine them by root-sum-square.

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

**At ten seconds** white noise wins outright. Bias instability has not yet had time to look like anything but a constant. Rate random walk is thousands of times too small to matter.

**By a minute** the two big terms are within twenty percent of each other. Solving $\mathrm{ARW}\sqrt{t} = \sigma_{\mathrm{bias\ instab}}(t)$ numerically puts the crossover at $t \approx 41\,\mathrm{s}$. After that, bias instability leads for the rest of the hour, ending more than twice angle random walk's share ($0.697$ against $0.300$).

**At one hour**, rate random walk, despite growing as $t^{3/2}$ against the others' slower laws, is still about ten times smaller than angle random walk ($0.029$ against $0.300$). Solving the same way, it does not catch up until $t \approx 37\,400\,\mathrm{s}$ — over ten hours of unaided coasting. That crossover time is the number to remember: rate random walk matters for a ship or a submarine and not for a ten-minute rocket flight.
:::

::: example The same coast, through the accelerometer
Reuse the probability module's accelerometer: velocity random walk $\mathrm{VRW} = 0.0588\,\mathrm{m/s}/\sqrt{\mathrm{h}}$ (from a $100\,\mu g/\sqrt{\mathrm{Hz}}$ noise density: $100 \times 10^{-6} \times 9.80665 \times 60 = 0.0588$), and bias instability $\sigma = 50\,\mu g = 4.905\times10^{-4}\,\mathrm{m/s^2}$ with $T = 300\,\mathrm{s}$.

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

Here bias instability overtakes velocity random walk almost at once: the crossover is at about $4\,\mathrm{s}$. By an hour it is nearly twelve times larger ($0.690$ against $0.0588$).

Why so early? For times short compared with $T$, the bias term grows like $\sigma t$ and the random walk like $N\sqrt{t}$, where $N$ is the random-walk coefficient in per-root-second units ($N = \mathrm{VRW}/60$). They meet when $\sigma t = N\sqrt{t}$, that is at $t \approx (N/\sigma)^2$. For this accelerometer $N/\sigma = (0.0588/60)/(4.905 \times 10^{-4}) \approx 2.0\,\sqrt{\mathrm{s}}$, so $t \approx 4\,\mathrm{s}$. For the gyro, $N/\sigma = (0.3/60)/(3/3600) = 6.0\,\sqrt{\mathrm{s}}$, so $t \approx 36\,\mathrm{s}$ — close to the exact $41\,\mathrm{s}$, which is a little later because the leash has started to slow the bias term.

None of this is *position* yet. Velocity error still has to be added up once more, which is where the later lessons' cubic and quadratic growth laws come from. But the ranking already tells you which term a filter must estimate first.
:::

## Check yourself

::: check
A gyro has $\mathrm{ARW} = 0.15\,^\circ/\sqrt{\mathrm{h}}$ and negligible bias instability and rate random walk. How long can it coast unaided before white noise alone has built up $0.05^\circ$ of attitude error?
:::

::: answer
Solve $0.05 = 0.15\sqrt{t[\mathrm h]}$. Divide both sides by $0.15$: $\sqrt{t} = 1/3$. Square both sides: $t = 1/9\,\mathrm{h} = 400\,\mathrm{s}$.

Doubling the allowed error to $0.1^\circ$ would not double the time — it would quadruple it, to $1600\,\mathrm{s}$, because the error grows as $\sqrt{t}$, not $t$.
:::

::: check
Explain in words, without formulas, why bias instability has an Allan-plot slope of zero, while angle random walk and rate random walk have slopes of $-\tfrac12$ and $+\tfrac12$.
:::

::: answer
The Allan plot shows how much the sensor's average output jitters when you average over a window of length $\tau$.

**Angle random walk** is white noise. A longer window averages more independent samples, so the jitter shrinks, at the $\sqrt\tau$ rate every average of independent noise shrinks by. That is the negative slope.

**Bias instability** is a leashed wander that has already spread to its full width once $\tau$ is several correlation times. Averaging longer cannot shrink something that is not shrinking to begin with, so the curve is flat.

**Rate random walk** is the opposite of angle random walk. Instead of averaging down, the bias itself drifts farther the longer you watch, so the curve rises with $\tau$ — a slope with the opposite sign.
:::

::: check
Two gyros have the same bias instability, $B = 2\,^\circ/\mathrm{h}$, but correlation times $T_1 = 20\,\mathrm{s}$ and $T_2 = 2000\,\mathrm{s}$. Which contributes less attitude error over a $30\,\mathrm{s}$ coast, and why?
:::

::: answer
The gyro with the shorter correlation time contributes less. Over $30\,\mathrm{s}$, $T_1 = 20\,\mathrm{s}$ is $1.5$ correlation times, so its bias has had room to wander and partly cancel itself. For $T_2 = 2000\,\mathrm{s}$, $30\,\mathrm{s}$ is under two percent of one correlation time, so that bias is in effect a constant. A constant bias produces the biggest error a given $\sigma$ can make over a short time, $\sigma\,t$.

With the formula in the note above: $0.0134^\circ$ for $T_1$, $0.0166^\circ$ for $T_2$, against $\sigma t = 2 \times 30/3600 = 0.0167^\circ$ for a true constant. So the datasheet's $B$ alone does not decide which sensor is better over a short coast; $T$ does.
:::

::: check
A rate-random-walk coefficient is $K = 0.02\,^\circ/\mathrm{h}/\sqrt{\mathrm{h}}$. What is the standard deviation of the bias itself after a $10\,\mathrm{h}$ flight, and how does it compare with a bias instability of $B = 1\,^\circ/\mathrm{h}$?
:::

::: answer
$\sigma_b(10\,\mathrm h) = 0.02\sqrt{10} = 0.0632\,^\circ/\mathrm h$, about $6\%$ of the bias instability. Over this flight the leashed process is still the bigger of the two.

But rate random walk keeps growing every hour, and bias instability does not. Over a $100\,\mathrm h$ flight the same sensor would show $\sigma_b = 0.02\sqrt{100} = 0.2\,^\circ/\mathrm h$, a fifth of $B$ and closing. The mission's length matters as much as the coefficients.
:::

::: check
A second accelerometer has the same $\mathrm{VRW} = 0.0588\,\mathrm{m/s}/\sqrt{\mathrm{h}}$ but a bias instability ten times smaller, $5\,\mu g$. Roughly when does its bias term overtake its random walk, assuming $T$ is long enough not to matter?
:::

::: answer
Use the short-time crossover $t \approx (N/\sigma)^2$ with $N = 0.0588/60 = 9.8 \times 10^{-4}\,\mathrm{m/s}/\sqrt{\mathrm{s}}$ and $\sigma = 5 \times 10^{-6} \times 9.80665 = 4.9 \times 10^{-5}\,\mathrm{m/s^2}$. Then $N/\sigma = 20\,\sqrt{\mathrm{s}}$ and $t \approx 400\,\mathrm{s}$.

A bias ten times smaller pushes the crossover a hundred times later, because the crossover time goes as the *square* of the ratio. (For this to hold, $T$ must be well over $400\,\mathrm{s}$; a shorter $T$ would slow the bias term and push the crossover later still.)
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathrm{ARW}\ [^\circ/\sqrt{\mathrm h}] = 60\times$ density | Angle random walk; $\sigma_\theta(t) = \mathrm{ARW}\sqrt{t[\mathrm h]}$ |
| $\mathrm{VRW}\ [\mathrm{m/s}/\sqrt{\mathrm h}] = 60\times$ density | Velocity random walk; $\sigma_v(t) = \mathrm{VRW}\sqrt{t[\mathrm h]}$ |
| $\dot b = -b/T+w$, $B\approx\sigma=\sqrt{QT/2}$ | Bias instability: leashed Gauss–Markov wander, Allan floor at $0.664B$ |
| $\dot b = w_r$, $K=60\sqrt{Q_r}$ | Rate random walk: $\sigma_b(t)=K\sqrt{t[\mathrm h]}$, attitude effect $\propto t^{3/2}$ |
| Slopes $-\tfrac12, 0, +\tfrac12$ | Angle/velocity random walk, bias instability, rate random walk on an Allan plot |
| $t \approx (N/\sigma)^2$ | Rough time when a bias term overtakes a random walk |
| RSS combination | Independent error sources: variances add, so standard deviations combine as $\sqrt{\sum\sigma_i^2}$ |

The next lesson builds the Allan deviation itself, derives all five slopes — including quantization's $-1$ and the rate ramp's $+1$ — and shows how to read bias instability, angle random walk and rate random walk off one plot of real IMU data.

::: context random-walk The drunkard's walk
Take $n$ steps of length $1$, each randomly forward or back. The steps do not cancel perfectly, and they do not all line up either. On average the distance from the start is about $\sqrt{n}$: after $100$ steps, about $10$; after $10\,000$ steps, about $100$. That square root is exactly why angle random walk grows as $\sqrt{t}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="75" x2="345" y2="75" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M30,75 L50,57 L70,49 L90,44 L110,39 L130,35 L150,31 L170,27 L190,24 L210,21 L230,18 L250,15 L270,12 L290,10 L310,7 L330,5" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <path d="M30,75 L50,93 L70,101 L90,106 L110,111 L130,115 L150,119 L170,123 L190,126 L210,129 L230,132 L250,135 L270,138 L290,140 L310,143 L330,145" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="30,75 50,70 70,78 90,66 110,58 130,64 150,52 170,57 190,47 210,54 230,44 250,50 270,40 290,46 310,36 330,42"/>
  <text x="36" y="14" font-size="11" fill="#1f2a44">spread grows like √t</text>
  <text x="340" y="90" font-size="12" text-anchor="end" fill="#1f2a44">time</text>
</svg>
```

The light curves mark one standard deviation, $\sqrt{t}$ scaled; the dark line is one possible walk.
:::

::: context root-hour Why "per root hour"?
A normal rate like $^\circ/\mathrm{h}$ means "multiply by hours to get degrees". But a random walk grows with the square root of time, so the coefficient must be multiplied by $\sqrt{\text{hours}}$ to give degrees — hence $^\circ/\sqrt{\mathrm{h}}$. Converting to seconds, $\sqrt{3600} = 60$, which is where the factor of $60$ comes from. A gyro with $\mathrm{ARW} = 0.1^\circ/\sqrt{\mathrm{h}}$ drifts about $0.1^\circ$ in one hour, $0.2^\circ$ in four, and $0.3^\circ$ in nine.
:::

::: context correlation-time How long a bias remembers
The correlation time answers: if I know the bias now, how long does that tell me anything about it later? For the leashed bias, the link between now and a time $\Delta t$ later fades as $e^{-\Delta t/T}$. After one $T$ it is down to $37\%$; after three, to $5\%$. A $100\,\mathrm{s}$ correlation time means a bias estimated now is still fairly good a minute later and nearly useless ten minutes later.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="120" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,30.0 55,49.9 70,65.4 85,77.5 100,86.9 115,94.2 130,99.9 145,104.4 160,107.8 175,110.5 190,112.6 205,114.2 220,115.5 235,116.5 250,117.3 265,117.9 280,118.4 295,118.7 310,119.0 325,119.2 340,119.4"/>
  <line x1="100" y1="120" x2="100" y2="86.9" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="100" y="136" font-size="11" text-anchor="middle" fill="#b4232c">T</text>
  <text x="106" y="82" font-size="11" fill="#b4232c">37%</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">memory = 100%</text>
  <text x="340" y="140" font-size="11" text-anchor="end" fill="#1f2a44">time apart</text>
</svg>
```
:::

::: context allan-preview A preview of the Allan plot
Imagine recording a still gyro for hours. Chop the record into chunks of length $\tau$, average each chunk, and see how much neighboring averages differ. Do that for many values of $\tau$ and plot the result on log–log axes. Short chunks are dominated by white noise, so the curve falls. Long chunks catch the slow drift, so it rises. In between is a flat floor — the bias instability. Lesson 4 builds this tool from scratch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M50,30 L140,75 C165,88 205,88 230,75 L320,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="80" y="38" font-size="11" fill="#1f2a44">slope −1/2</text>
  <text x="185" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">flat floor</text>
  <text x="255" y="38" font-size="11" fill="#1f2a44">slope +1/2</text>
  <text x="190" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">averaging time τ (log)</text>
</svg>
```

The two straight parts drop and rise by one unit for every two units across, a slope of one half.
:::

::: context overconfident When a filter trusts itself too much
A Kalman filter keeps two things: its best guess, and how sure it is of that guess. When a new measurement arrives, it blends the two according to those confidences. If it thinks its own guess is very good, it mostly ignores the measurement. So a filter that underestimates its own uncertainty stops listening to the outside world and drifts off with a wrong answer, while reporting that everything is fine. Engineers call this **divergence**, and wrong noise models are one of its commonest causes.
:::

::: context rss Why independent errors add as squares
If two errors are independent, they sometimes push the same way and sometimes cancel. On average, what adds up is not the sizes but the *squares* of the sizes, the variances — the same rule as the sides of a right triangle. Two independent errors of $3$ and $4$ combine to $\sqrt{9 + 16} = 5$, not $7$. That also means the biggest term dominates: add an error of $1$ to that $5$ and you get $\sqrt{26} \approx 5.1$.
:::
