---
id: l08-gauss-markov-and-imu-error-models
title: Gauss-Markov processes and IMU error models
minutes: 25
covers:
  - white noise, random walk, Gauss-Markov processes
---

Ask a navigation engineer what an aided inertial filter keeps track of. Position, velocity and attitude, of course. But the list also holds six numbers that are not about the vehicle at all: three gyro biases and three accelerometer biases. They sit in the filter's **[[state vector|state-vector]]** so it can learn the sensors' slow drift from the aiding measurements and subtract it. That is why a cheap MEMS **inertial measurement unit** (IMU — the box of three gyros and three accelerometers) can navigate far better than its datasheet bias figure suggests. Get the bias model right and the filter learns the bias. Get it wrong and the filter either chases noise or trusts a bias that has long since wandered off.

The model is almost always the same one: the **first-order Gauss-Markov process**. This lesson builds it from a one-line differential equation, works out its variance, its autocorrelation and its exact step-by-step form, and shows that the white noise and random walk of the last lesson are its two extremes. Then it does what the module asks: build a gyro bias model from real bench-test numbers, with every parameter traced to a measurement. The mathematics is short. Choosing the numbers to feed it is the real skill.

## The gap between white noise and random walk

The last lesson ended with a problem. Neither of its processes describes a sensor bias.

- **White noise** has no memory. A bias modeled that way would be a new random number every sample and would average away in a second.
- **A random walk** has perfect memory. Its variance grows as $Qt$ forever, so after a long mission the filter would believe the bias could be anything.

A real gyro bias, watched on a bench for a day, does something in between. Over seconds it looks constant. Over minutes it wanders. Over hours it stays inside a band a few degrees per hour wide and never escapes. It has a **finite memory**: after a while, where it was tells you little about where it is.

Picture a dog on a springy leash in a crowd. People bump it at random, so it wanders. But the farther it strays, the harder the leash pulls it back. It never settles, and it never runs away.

That picture is one extra term added to the random walk. Instead of $\dot{b} = w$, write

$$
\dot{b}(t) = -\frac{1}{T}\,b(t) + w(t), \qquad \mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau).
$$

Read $\dot{b}$ ("b dot") as the rate of change of the bias $b$. The white noise $w$ still kicks the bias around. The new term $-b/T$ is the leash: it pulls the bias back toward zero, harder the farther it has strayed. $T$ is the **correlation time**, in seconds. Engineers also describe the equation as a first-order low-pass filter driven by white noise, or a particle on a **[[spring in a bath of jostling molecules|ornstein]]**.

The process is **Gaussian** because it is a linear operation on Gaussian noise. It is **[[Markov|markov]]** because, once you know the present value $b(t)$, the past adds nothing about the future: the differential equation needs only the current state. Hence the name.

## Mean, variance and autocorrelation

Solve the equation like any linear first-order differential equation, with the **[[integrating factor|integrating-factor]]** $e^{t/T}$:

$$
b(t) = e^{-t/T}\,b(0) + \int_0^t e^{-(t - s)/T}\,w(s)\,ds.
$$

Read it in words. The first term is the starting value, fading away. The second is all the kicks so far, each one shrunk by how long ago it arrived. Since $w$ has zero mean, taking expectations gives $\mathbb{E}[b(t)] = e^{-t/T}\,\mathbb{E}[b(0)]$: whatever the starting mean, it is forgotten within a few correlation times.

### The variance levels off

For the variance $P(t) = \operatorname{Var}(b(t))$, a rule about linear systems does the work. For $\dot{x} = a x + w$ with white noise of strength $Q$, the variance obeys

$$
\dot{P} = 2aP + Q.
$$

::: note Why it has to be true
Take one short step $\Delta t$. The state becomes $(1 + a\Delta t)\,x$ plus a fresh noise kick of variance $Q\,\Delta t$ (the Brownian step of the last lesson). The kick is independent of $x$, so variances add:

$$
P \to (1 + a\Delta t)^2 P + Q\,\Delta t \approx P + (2aP + Q)\,\Delta t,
$$

dropping the tiny $a^2\Delta t^2 P$ term. The change per unit time is $2aP + Q$.
:::

Here $a = -1/T$, so

$$
\dot{P} = -\frac{2}{T}\,P + Q, \qquad P(t) = \frac{QT}{2}\Big(1 - e^{-2t/T}\Big) + e^{-2t/T}P(0).
$$

As $t$ grows, the exponentials die and the variance **[[settles to a steady value|saturation]]**:

$$
\sigma^2 = \frac{Q\,T}{2}, \qquad\text{equivalently}\qquad Q = \frac{2\sigma^2}{T}.
$$

This is exactly what the random walk lacked. The noise keeps pushing, the leash keeps pulling, and the two balance at a variance set by their ratio. Started from zero, the variance reaches $1 - e^{-2} = 86\%$ of $\sigma^2$ after one correlation time and $1 - e^{-4} = 98\%$ after two. A sensor that has been running for more than a few $T$ is in its steady state, and a filter that starts the bias state with $P(0) = \sigma^2$ starts it correctly.

### The autocorrelation fades exponentially

Now the autocorrelation in the steady state. For a gap $\tau > 0$, run the solution forward from time $t$:

$$
b(t + \tau) = e^{-\tau/T}\,b(t) + \int_t^{t+\tau} e^{-(t + \tau - s)/T}\,w(s)\,ds.
$$

Multiply both sides by $b(t)$ and average. The integral holds only kicks that arrive *after* time $t$, which are independent of $b(t)$, so that cross term averages to zero. What is left:

$$
R_b(\tau) = \mathbb{E}[b(t)\,b(t + \tau)] = e^{-\tau/T}\,\mathbb{E}[b(t)^2] = \sigma^2 e^{-\tau/T}.
$$

An autocorrelation is even, so for either sign of the gap,

$$
R_b(\tau) = \sigma^2 e^{-|\tau|/T}.
$$

After one correlation time the correlation has dropped to $e^{-1} = 0.368$ of its starting value. After three it is $e^{-3} = 0.050$ — the bias has effectively been redrawn. This **[[fading exponential|exp-acf]]** is the fingerprint of the process, and the module's exercise asks you to find it in simulated data.

::: key
The first-order Gauss-Markov process is $\dot{b} = -b/T + w$, with $w$ white of strength $Q = 2\sigma^2/T$. It is stationary with variance $\sigma^2$ and autocorrelation $R(\tau) = \sigma^2 e^{-|\tau|/T}$, where $T$ is the correlation time. It is the standard model for gyro and accelerometer bias drift.
:::

## The exact discrete-time form

A filter runs in steps, so we need the process one step at a time. Apply the solution over one step $\Delta t$, from $t_k$ to $t_{k+1}$:

$$
b_{k+1} = \phi\,b_k + n_k, \qquad \phi = e^{-\Delta t/T}, \qquad n_k = \int_{t_k}^{t_{k+1}} e^{-(t_{k+1} - s)/T}\,w(s)\,ds.
$$

Read $\phi$ ("phi") as "how much of the bias survives one step". The kicks $n_k$ are zero-mean, Gaussian, and unrelated from step to step, since each collects noise from its own interval. Their variance comes from the same delta-function collapse as before:

$$
\operatorname{Var}(n_k) = Q\int_0^{\Delta t} e^{-2u/T}\,du = \frac{QT}{2}\Big(1 - e^{-2\Delta t/T}\Big) = \sigma^2\big(1 - \phi^2\big).
$$

Check it against the steady state. If $\operatorname{Var}(b_k) = \sigma^2$, then

$$
\operatorname{Var}(b_{k+1}) = \phi^2\sigma^2 + \sigma^2(1 - \phi^2) = \sigma^2.
$$

The stepped process holds exactly the variance of the continuous one, at any step size. This form is *exact*, not an approximation. When $\Delta t$ is much smaller than $T$, $1 - \phi^2 \approx 2\Delta t/T$, and the kick variance becomes $2\sigma^2\Delta t/T = Q\,\Delta t$ — the simple **Euler step** (one straight-line step of the differential equation). The exact form matters when the step is *not* small compared with $T$.

::: example Discretizing a gyro bias model at three rates
Take a bias with $\sigma = 3\,^\circ/\mathrm{h}$ and $T = 100\,\mathrm{s}$. Its strength is $Q = 2 \times 3^2/100 = 0.18\,(^\circ/\mathrm{h})^2/\mathrm{s}$. For each step size, compute $\phi = e^{-\Delta t/T}$, the exact kick $\sigma_n = \sigma\sqrt{1 - \phi^2}$, and the Euler kick $\sqrt{Q\,\Delta t}$:

| $\Delta t$ | $\phi = e^{-\Delta t/T}$ | $\sigma_n = \sigma\sqrt{1 - \phi^2}$ | Euler $\sqrt{Q\,\Delta t}$ |
| --- | --- | --- | --- |
| $0.01\,\mathrm{s}$ | $0.99990$ | $0.0424\,^\circ/\mathrm{h}$ | $0.0424\,^\circ/\mathrm{h}$ |
| $1\,\mathrm{s}$ | $0.99005$ | $0.422\,^\circ/\mathrm{h}$ | $0.424\,^\circ/\mathrm{h}$ |
| $10\,\mathrm{s}$ | $0.90484$ | $1.277\,^\circ/\mathrm{h}$ | $1.342\,^\circ/\mathrm{h}$ |

At a $100\,\mathrm{Hz}$ IMU rate the two agree to four figures. At a $10\,\mathrm{s}$ step — a plausible gap between satellite-navigation (GNSS) fixes in a filter that only moves the bias forward between updates — Euler overstates the kick by $1.342/1.277 = 1.05$, or $5\%$. Worse, the Euler survival factor $1 - \Delta t/T = 0.90$ instead of $\phi = 0.905$ describes a different process. Use the exact form; it costs one exponential.
:::

The code is a few lines, and it is exactly what the module's exercise asks for:

```python
import numpy as np

def gauss_markov(sigma, T, dt, n, seed=0):
    rng = np.random.default_rng(seed)
    phi = np.exp(-dt / T)
    b = np.empty(n)
    b[0] = sigma * rng.standard_normal()            # start in the steady state
    noise = sigma * np.sqrt(1 - phi**2) * rng.standard_normal(n - 1)
    for k in range(n - 1):
        b[k + 1] = phi * b[k] + noise[k]
    return b

b = gauss_markov(3.0, 100.0, 1.0, 400_000)           # deg/h, s, s
print(round(b.std(), 2))                             # 2.99  (theory: 3)
lag = 100                                            # one correlation time
print(round(np.mean(b[:-lag] * b[lag:]) / np.mean(b * b), 3))  # 0.361  (theory: 1/e = 0.368)
```

::: warning
Two mistakes are common. The first is starting the bias at zero — $b_0 = 0$ in a simulation, or $P(0) = 0$ in a filter — without letting a few correlation times of start-up pass. For its first $2T$ or $3T$ the process then has the wrong variance, and a consistency test over that window fails for no good reason. The second is keeping $Q$ fixed while changing $T$ during tuning. The steady variance $QT/2$ changes with it, and a filter told the bias stays within $3\,^\circ/\mathrm{h}$ quietly starts believing $10$. Tune $\sigma$ and $T$, and work out $Q$ from them.
:::

## The two limits: random walk and white noise

Keep $Q$ fixed and let $T \to \infty$ (read "T goes to infinity"). The leash goes slack: $\dot{b} = w$, a random walk. In the stepped form, $\phi \to 1$ and $\operatorname{Var}(n_k) = \frac{QT}{2}(1 - e^{-2\Delta t/T}) \to Q\,\Delta t$, exactly the Brownian step of the last lesson. The steady variance $QT/2$ goes to infinity — the random walk's endless growth, seen from the other side.

Keep $\sigma$ fixed and let $T \to 0$. Then $\phi \to 0$ and $\operatorname{Var}(n_k) \to \sigma^2$: each sample is a fresh draw from $\mathcal{N}(0, \sigma^2)$, a white sequence. The autocorrelation $\sigma^2 e^{-|\tau|/T}$ squeezes into a spike at zero.

Between these limits lies the process's real character. Over times much shorter than $T$ it acts like a random walk of strength $Q$. Over times much longer than $T$ it acts like steady noise of variance $\sigma^2$ whose values far apart are unrelated. Two things set it apart from a random walk: its variance **levels off** at $\sigma^2$ instead of growing forever, and its correlation **fades** as $e^{-|\tau|/T}$ instead of lasting forever. What sets it apart from white noise is that it has any memory at all.

## What a wandering bias does to attitude

A gyro bias turns into attitude error through an integral, $\theta_b(t) = \int_0^t b(s)\,ds$ ($\theta$ is "theta"). How fast that grows depends on the bias's memory. Its variance is a double integral of the autocorrelation:

$$
\operatorname{Var}(\theta_b(t)) = \int_0^t\!\!\int_0^t \sigma^2 e^{-|u - v|/T}\,du\,dv = 2\sigma^2\int_0^t (t - \tau)\,e^{-\tau/T}\,d\tau.
$$

The second form groups pairs of instants by their gap $\tau$: there is a strip of width $t - \tau$ of pairs at each gap, and the $2$ counts both orders. Integrating by parts gives $\int_0^t (t - \tau)e^{-\tau/T}d\tau = T^2\big(t/T - 1 + e^{-t/T}\big)$, so

$$
\operatorname{Var}(\theta_b(t)) = 2\sigma^2 T^2\Big(\frac{t}{T} - 1 + e^{-t/T}\Big).
$$

Look at the two ends.

- **Short times, $t \ll T$** ("t much less than T"). Expand $e^{-t/T} \approx 1 - t/T + t^2/2T^2$. The bracket becomes $t^2/2T^2$, so $\operatorname{Var} \approx \sigma^2 t^2$ and $\sigma_\theta \approx \sigma\,t$. The bias has not had time to change, so it acts like a constant and the angle error grows in a straight line.
- **Long times, $t \gg T$.** The bracket is about $t/T$, so $\operatorname{Var} \approx 2\sigma^2 T\,t = Q T^2\,t$. Now the *variance* grows in a straight line: a random walk in angle with effective strength $2\sigma^2 T$. The bias flips sign every few correlation times, and its integral wanders rather than drifts.

::: example Attitude error from a Gauss-Markov bias
Use $\sigma = 3\,^\circ/\mathrm{h} = 3/3600 = 8.33 \times 10^{-4}\,^\circ/\mathrm{s}$ and $T = 100\,\mathrm{s}$. Compare the bias's angle error with what a constant $3\,^\circ/\mathrm{h}$ bias would give, and with the $0.3\,^\circ/\sqrt{\mathrm{h}}$ angle random walk of the last lesson:

| $t$ | GM bias $\sigma_\theta$ | Constant bias $\sigma t$ | ARW $0.3\sqrt{t}$ |
| --- | --- | --- | --- |
| $10\,\mathrm{s}$ | $0.0082^\circ$ | $0.0083^\circ$ | $0.0158^\circ$ |
| $60\,\mathrm{s}$ | $0.0455^\circ$ | $0.0500^\circ$ | $0.0387^\circ$ |
| $600\,\mathrm{s}$ | $0.264^\circ$ | $0.500^\circ$ | $0.122^\circ$ |
| $3600\,\mathrm{s}$ | $0.697^\circ$ | $3.00^\circ$ | $0.300^\circ$ |

Read down the table. At ten seconds the bias is as good as constant, and the white noise is the bigger error. The two cross at about $40\,\mathrm{s}$. At ten minutes the bias term is twice the random-walk term — but only half what a constant bias would give, because over six correlation times the bias has wandered through several values that partly cancel. At an hour, the constant-bias model overstates the error four times over.

The two sources are independent, so their variances add. The total at $600\,\mathrm{s}$ is the root-sum-square: $\sqrt{0.264^2 + 0.122^2} = 0.291^\circ$. Sanity check: bigger than either piece, smaller than their sum ($0.386^\circ$). Good.

So "the bias dominates the coast" is true, but by how much depends on $T$. Treating the bias as constant is exactly right for intervals shorter than $T$ and pessimistic for intervals much longer.
:::

## Reading the parameters from a bench test: the Allan deviation

The model has three inputs: the white-noise strength (the ARW) and the two Gauss-Markov numbers $\sigma$ and $T$. All three come from recording the sensor sitting perfectly still for hours and analyzing the record with the **[[Allan variance|allan-history]]**.

The idea is a question. Chop the record into back-to-back windows, each $\tau$ seconds long. Average the rate in each window. How much does one window's average differ from the next? Call the window averages $\bar{y}_k(\tau)$ ("y bar sub k") and define

$$
\sigma_A^2(\tau) = \tfrac{1}{2}\,\mathbb{E}\big[(\bar{y}_{k+1} - \bar{y}_k)^2\big].
$$

Plot the Allan deviation $\sigma_A(\tau)$ against $\tau$ on **log-log axes** — both axes marked in powers of ten. Each kind of noise shows up as a straight piece with its own slope.

**White noise: slope $-\tfrac{1}{2}$.** Averaging white noise of strength $Q$ over $\tau$ seconds leaves variance $Q/\tau$, and neighboring windows are independent. So $\sigma_A^2 = \tfrac{1}{2}(2Q/\tau) = Q/\tau$ and $\sigma_A(\tau) = \sqrt{Q}/\sqrt{\tau}$. Read the line at $\tau = 1\,\mathrm{s}$ and you have the noise density $\sqrt{Q}$ directly — hence the ARW.

**Bias instability: slope $0$.** Further along, the curve flattens into a floor. Here averaging longer stops helping, because the thing being averaged is itself moving. The height of the floor is written $0.664\,B$, where $B$ is the **bias instability**, the number datasheets quote in $^\circ/\mathrm{h}$. The factor $\sqrt{2\ln 2/\pi} = 0.664$ comes from the exact Allan variance of **[[flicker noise|flicker]]**, a noise whose spectrum goes as $1/f$, which is what the floor physically is.

**Rate random walk: slope $+\tfrac{1}{2}$.** If the bias also contains a random walk of strength $K^2$, the curve turns up again at long $\tau$, with $\sigma_A = K\sqrt{\tau/3}$. Many MEMS gyros show it. A good fiber-optic gyro may not, within a day's record.

Now a modeling choice. Flicker noise is *not* a Gauss-Markov process; its correlation fades more slowly than any exponential. But a Gauss-Markov process with $\sigma \approx B$, and $T$ set to the $\tau$ where the Allan curve leaves the white-noise line and enters the floor, copies its behavior on the time scales a navigation filter cares about. And it has a two-number, one-state form that flicker noise does not. That is the compromise every practical filter makes.

::: example From an Allan plot to a gyro bias model
A twelve-hour still record of a MEMS gyro gives an **[[Allan deviation plot|allan-plot]]** with three features. At $\tau = 1\,\mathrm{s}$, on the $-\tfrac{1}{2}$ slope, $\sigma_A = 0.005\,^\circ/\mathrm{s}$. Around $\tau \approx 80$ to $100\,\mathrm{s}$ it flattens into a floor at $\sigma_A = 5.5 \times 10^{-4}\,^\circ/\mathrm{s}$. Beyond about $1000\,\mathrm{s}$ it starts to rise.

**Step 1 — ARW, from the white line.** $\sqrt{Q_w} = 0.005\,^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, so $\mathrm{ARW} = 60 \times 0.005 = 0.3\,^\circ/\sqrt{\mathrm{h}}$.

**Step 2 — bias instability, from the floor.** $B = 5.5 \times 10^{-4}/0.664 = 8.3 \times 10^{-4}\,^\circ/\mathrm{s}$. Multiply by $3600$ for degrees per hour: $B = 3.0\,^\circ/\mathrm{h}$.

**Step 3 — correlation time, from the knee.** The white line $0.005/\sqrt{\tau}$ meets the floor $5.5 \times 10^{-4}$ where $\sqrt{\tau} = 0.005/(5.5 \times 10^{-4}) = 9.09$, so $\tau = 9.09^2 = 82\,\mathrm{s}$. That matches the visible bend, so take $T = 100\,\mathrm{s}$.

**Result.** The bias model is $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$, $Q = 2\sigma^2/T = 0.18\,(^\circ/\mathrm{h})^2/\mathrm{s}$ — the numbers used all through this lesson. The rise beyond $1000\,\mathrm{s}$ would get its own random-walk state if the mission lasted hours. For a flight of minutes, it can be folded into a slightly larger $\sigma$.
:::

::: note The turn-on bias
The **turn-on bias** is the value the bias takes when the sensor powers up. It stays constant for the whole run, changes from run to run, and is often ten to a hundred times larger than the bias instability. A single Allan plot cannot see it at all, because the Allan variance subtracts neighboring windows and the constant cancels. In the filter it appears as a large starting variance on the bias state, or as a separate constant state. The Gauss-Markov model covers only the in-run wander around it.
:::

## Assembling the gyro and accelerometer model

The full error model for one gyro axis, in the form a filter uses:

$$
\tilde{\omega}(t) = \omega(t) + b(t) + w_g(t), \qquad \dot{b} = -\frac{b}{T} + w_b.
$$

In words: the measured rate is the true rate, plus a slowly wandering bias, plus fresh white noise. The white noise $w_g$ has strength $Q_w = (\mathrm{ARW}/60)^2$ in $(^\circ/\mathrm{s})^2/\mathrm{Hz}$. The bias's driving noise $w_b$ has strength $Q_b = 2\sigma^2/T$.

Inside the filter, $b$ is a state that steps forward with $\phi = e^{-\Delta t/T}$ and gets a kick of variance $\sigma^2(1 - \phi^2)$ each step. The white noise $w_g$ goes straight into the attitude state, as a kick of variance $Q_w\Delta t$ per step in angle. Three gyros give three bias states. The three accelerometers give three more, each with its own $\sigma$, $T$ and velocity random walk.

::: example An accelerometer bias in position
An accelerometer's in-run bias has $\sigma = 50\,\mathrm{\mu g}$ and $T = 300\,\mathrm{s}$. In SI, $\sigma = 50 \times 10^{-6} \times 9.80665 = 4.90 \times 10^{-4}\,\mathrm{m/s^2}$.

Model numbers: $Q_b = 2\sigma^2/T = 2 \times (4.90 \times 10^{-4})^2/300 = 1.60 \times 10^{-9}\,(\mathrm{m/s^2})^2/\mathrm{s}$. At a $100\,\mathrm{Hz}$ step, $\phi = e^{-0.01/300} = 0.99997$ and the kick is $\sigma_n = \sigma\sqrt{1 - \phi^2} = 4.0 \times 10^{-6}\,\mathrm{m/s^2}$.

Effect over a $60\,\mathrm{s}$ unaided stretch: $60\,\mathrm{s}$ is short next to $T = 300\,\mathrm{s}$, so the bias is nearly constant. A constant acceleration error integrated twice gives position error $\tfrac{1}{2}\sigma t^2$:

$$
\tfrac{1}{2} \times 4.90 \times 10^{-4} \times 60^2 = 0.5 \times 4.90 \times 10^{-4} \times 3600 = 0.88\,\mathrm{m},
$$

against $0.26\,\mathrm{m}$ from the velocity random walk in the last lesson. Over $600\,\mathrm{s}$ the constant-bias figure is $0.5 \times 4.90 \times 10^{-4} \times 600^2 = 88\,\mathrm{m}$. That is an overstatement, since $600\,\mathrm{s} = 2T$, but the size is right — and it is why an unaided IMU cannot hold position for ten minutes without a bias estimate.
:::

::: warning
$\sigma$ and $Q$ are different numbers with different units, and datasheets quote neither one directly. Bias instability $B$ is in $^\circ/\mathrm{h}$ and is close to $\sigma$. The strength $Q = 2\sigma^2/T$ is in $(^\circ/\mathrm{h})^2/\mathrm{s}$ and depends on your choice of $T$. Typing $B$ where the filter expects $Q$, or $Q\Delta t$ where it expects $Q$, makes a filter that is wrong by orders of magnitude — and still runs without complaint. Write the units next to every noise number in the configuration file.
:::

## Check yourself

::: check
A gyro bias is modeled as first-order Gauss-Markov with $\sigma = 1\,^\circ/\mathrm{h}$ and $T = 1\,\mathrm{h}$. Write the discrete-time model at $\Delta t = 0.1\,\mathrm{s}$: the transition $\phi$, the driving-noise standard deviation and the continuous strength $Q$.
:::

::: answer
Put everything in seconds: $T = 3600\,\mathrm{s}$.

- Transition: $\phi = e^{-0.1/3600} = 0.999972$.
- Kick: $\sigma_n = \sigma\sqrt{1 - \phi^2} = 1 \times \sqrt{1 - 0.999944} = \sqrt{5.56 \times 10^{-5}} = 7.45 \times 10^{-3}\,^\circ/\mathrm{h}$ per step.
- Strength: $Q = 2\sigma^2/T = 2/3600 = 5.56 \times 10^{-4}\,(^\circ/\mathrm{h})^2/\mathrm{s}$.

Check: the Euler kick $\sqrt{Q\,\Delta t} = \sqrt{5.56 \times 10^{-5}} = 7.45 \times 10^{-3}$ agrees, because $\Delta t \ll T$. Notice how tiny each kick is. Over a ten-minute flight this bias is very nearly constant; the filter learns it from the aiding measurements, not from its wander.
:::

::: check
A bias process has autocorrelation $R(\tau) = 0.25\,e^{-|\tau|/T}\,(^\circ/\mathrm{h})^2$ and you measure $R(30\,\mathrm{s}) = 0.10\,(^\circ/\mathrm{h})^2$. What are $\sigma$ and $T$?
:::

::: answer
At zero gap, $R(0) = \sigma^2 = 0.25$, so $\sigma = 0.5\,^\circ/\mathrm{h}$.

At $30\,\mathrm{s}$: $0.25\,e^{-30/T} = 0.10$, so $e^{-30/T} = 0.4$. Take the natural log of both sides: $30/T = \ln 2.5 = 0.916$, so $T = 30/0.916 = 32.7\,\mathrm{s}$.

Check: at $\tau = T$ the value should be $0.25/e = 0.092$ — a little below the $0.10$ measured at the slightly shorter gap of $30\,\mathrm{s}$. Consistent.
:::

::: check
A Gauss-Markov bias is started at exactly zero. After how many correlation times has its variance reached $90\%$ of the steady value? What does this imply for the starting covariance of a bias state in a filter?
:::

::: answer
From $P(t) = \sigma^2(1 - e^{-2t/T})$, set $1 - e^{-2t/T} = 0.9$. Then $e^{-2t/T} = 0.1$, so $2t/T = \ln 10$ and $t = \tfrac{T}{2}\ln 10 = 1.15\,T$.

The variance approaches its limit twice as fast as the autocorrelation fades, because it carries $e^{-2t/T}$ rather than $e^{-t/T}$.

For the filter: start the bias state with $P(0) = \sigma^2$ (plus the turn-on bias variance), not zero. A sensor powered on for more than a couple of correlation times is already in its steady state, with its bias somewhere in the $\pm\sigma$ band.
:::

::: check
Compare a Gauss-Markov bias with $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$ against a random walk driven by the same $Q$. What are the two standard deviations after $10\,\mathrm{s}$ and after one hour, each started from zero?
:::

::: answer
$Q = 2 \times 9/100 = 0.18\,(^\circ/\mathrm{h})^2/\mathrm{s}$.

After $10\,\mathrm{s}$: random walk $\sqrt{0.18 \times 10} = \sqrt{1.8} = 1.34\,^\circ/\mathrm{h}$. Gauss-Markov $3\sqrt{1 - e^{-0.2}} = 3\sqrt{0.181} = 1.28\,^\circ/\mathrm{h}$. Nearly the same, because $10\,\mathrm{s} \ll T$.

After $3600\,\mathrm{s}$: random walk $\sqrt{0.18 \times 3600} = \sqrt{648} = 25.5\,^\circ/\mathrm{h}$. Gauss-Markov $3.0\,^\circ/\mathrm{h}$, fully leveled off.

A filter using the random-walk model for this sensor would, after an hour of coasting, allow a bias about eight times larger than it can physically be, and would weight the aiding measurements accordingly.
:::

::: check
Explain in two or three sentences why "the bias dominates the coast" and this lesson's finding that the constant-bias model overstates the error at long times are both correct.
:::

::: answer
Over intervals up to a few correlation times the bias is nearly constant, so its angle error grows in a straight line and soon overtakes the $\sqrt{t}$ growth of angle random walk — for the example gyro the crossover is about $40\,\mathrm{s}$, and by ten minutes the bias term is twice the white-noise one. Over intervals much longer than $T$ the bias changes sign again and again, its integral becomes a random walk of strength $2\sigma^2T$ instead of a straight-line drift, and the constant-bias estimate $\sigma t$ grows more and more pessimistic — four times too big at one hour in the example. The bias dominates in both regimes; the constant model sizes it correctly in the first and overstates it in the second.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{b} = -b/T + w$, $\mathbb{E}[w(t)w(\tau)] = Q\,\delta(t - \tau)$ | First-order Gauss-Markov process, correlation time $T$ |
| $\dot{P} = -2P/T + Q$, $P(t) = \sigma^2(1 - e^{-2t/T}) + e^{-2t/T}P(0)$ | Variance over time; levels off, unlike a random walk |
| $\sigma^2 = QT/2$, $Q = 2\sigma^2/T$ | Steady-state variance and the strength that produces it |
| $R(\tau) = \sigma^2 e^{-\lvert\tau\rvert/T}$ | Autocorrelation; $R(T)/R(0) = 1/e$ |
| $b_{k+1} = \phi\,b_k + n_k$, $\phi = e^{-\Delta t/T}$, $\operatorname{Var}(n_k) = \sigma^2(1 - \phi^2)$ | Exact discrete form; $\approx Q\,\Delta t$ when $\Delta t \ll T$ |
| $T \to \infty$: random walk; $T \to 0$: white noise | The two limits |
| $\operatorname{Var}(\int_0^t b) = 2\sigma^2T^2(t/T - 1 + e^{-t/T})$ | Angle error from a GM bias: $\approx \sigma^2 t^2$ for $t \ll T$, $\approx 2\sigma^2 T t$ for $t \gg T$ |
| $\sigma_A^2(\tau) = \tfrac{1}{2}\mathbb{E}[(\bar{y}_{k+1} - \bar{y}_k)^2]$ | Allan variance of window averages |
| Slope $-\tfrac{1}{2}$: $\sigma_A = \sqrt{Q}/\sqrt{\tau}$; floor $0.664B$; slope $+\tfrac{1}{2}$: $K\sqrt{\tau/3}$ | White noise (ARW), bias instability, rate random walk |
| $\tilde{\omega} = \omega + b + w_g$ | Gyro measurement model: truth, GM bias, white noise |

Next lesson: the same noises seen by frequency instead of time. The spike of white noise and the fading exponential of the Gauss-Markov process each have a **power spectral density**, which makes the words "white", "noise density" and "per root hertz" exact and shows how a filter or an integrator reshapes the noise passing through it.

::: context state-vector What the filter keeps track of
A navigation filter keeps a list of numbers it is trying to estimate, called its **state vector**. The obvious entries are position, velocity and attitude. But anything that changes slowly and affects the measurements can be added — including the sensors' own biases. The filter then treats each bias like an unknown quantity to be measured indirectly: if the GPS keeps saying the vehicle is a little east of where the gyros think it is, some of that disagreement is blamed on the bias and subtracted. Every added state needs a model of how it changes over time, and for biases that model is this lesson's.
:::

::: context ornstein A particle on a spring
In 1930 the physicists Leonard Ornstein and George Uhlenbeck studied a particle in water that is both jostled by molecules and held back by friction. Its velocity obeys exactly $\dot{b} = -b/T + w$: random kicks plus a pull back toward zero. Mathematicians still call this the **Ornstein–Uhlenbeck process**. Engineers call it first-order Gauss-Markov. Same equation, two names — you will see both in papers.
:::

::: context markov Andrey Markov's chains
Andrey Markov was a Russian mathematician who, around 1906, studied sequences where each step depends only on the one before, not on the whole history. To show the idea applied to real data, he famously counted how vowels and consonants follow one another in Pushkin's poem *Eugene Onegin*. Any process with this "only the present matters" property is now called **Markov**. It is what makes Kalman filters practical: the filter only has to carry the current state and its covariance, never the whole past.
:::

::: context integrating-factor Undoing the leash
The equation $\dot{b} + b/T = w$ is hard to integrate as written, because $b$ appears on both sides. Multiply every term by $e^{t/T}$. The left side becomes exactly the derivative of a product:

$$
\frac{d}{dt}\big(e^{t/T}\,b\big) = e^{t/T}\,\dot{b} + \frac{1}{T}e^{t/T}\,b = e^{t/T}\,w.
$$

Now integrate both sides from $0$ to $t$ and divide by $e^{t/T}$. That gives the solution in the lesson. The multiplier $e^{t/T}$ is the **integrating factor**; the calculus module uses the same trick for every linear first-order equation.
:::

::: context saturation Leveling off versus growing forever
Here are the two standard deviations from the fourth check question, started from zero, for $\sigma = 3\,^\circ/\mathrm{h}$, $T = 100\,\mathrm{s}$ and the same $Q = 0.18$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="40.0" y1="175.0" x2="340.0" y2="175.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40.0" y1="15.0" x2="40.0" y2="175.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="36.0" y1="121.7" x2="40.0" y2="121.7" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="33.0" y="125.7" font-size="11" fill="#1f2a44" text-anchor="end">3</text>
  <line x1="36.0" y1="68.3" x2="40.0" y2="68.3" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="33.0" y="72.3" font-size="11" fill="#1f2a44" text-anchor="end">6</text>
  <line x1="36.0" y1="15.0" x2="40.0" y2="15.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="33.0" y="19.0" font-size="11" fill="#1f2a44" text-anchor="end">9</text>
  <line x1="115.0" y1="175.0" x2="115.0" y2="179.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="115.0" y="191.0" font-size="11" fill="#1f2a44" text-anchor="middle">100</text>
  <line x1="190.0" y1="175.0" x2="190.0" y2="179.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190.0" y="191.0" font-size="11" fill="#1f2a44" text-anchor="middle">200</text>
  <line x1="265.0" y1="175.0" x2="265.0" y2="179.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265.0" y="191.0" font-size="11" fill="#1f2a44" text-anchor="middle">300</text>
  <line x1="340.0" y1="175.0" x2="340.0" y2="179.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340.0" y="191.0" font-size="11" fill="#1f2a44" text-anchor="middle">400</text>
  <text x="340.0" y="205.0" font-size="11" fill="#1f2a44" text-anchor="end">time since start (s)</text>
  <line x1="40.0" y1="121.7" x2="340.0" y2="121.7" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M40.0,175.0 L43.8,158.1 L47.5,151.1 L51.2,145.8 L55.0,141.3 L58.8,137.3 L62.5,133.7 L66.2,130.4 L70.0,127.3 L73.8,124.4 L77.5,121.7 L81.2,119.1 L85.0,116.6 L88.8,114.2 L92.5,111.9 L96.2,109.7 L100.0,107.5 L103.8,105.5 L107.5,103.4 L111.2,101.5 L115.0,99.6 L118.8,97.7 L122.5,95.9 L126.2,94.1 L130.0,92.4 L133.8,90.7 L137.5,89.0 L141.2,87.4 L145.0,85.8 L148.8,84.2 L152.5,82.6 L156.2,81.1 L160.0,79.6 L163.8,78.1 L167.5,76.7 L171.2,75.2 L175.0,73.8 L178.8,72.4 L182.5,71.0 L186.2,69.7 L190.0,68.3 L193.8,67.0 L197.5,65.7 L201.2,64.4 L205.0,63.1 L208.8,61.9 L212.5,60.6 L216.2,59.4 L220.0,58.2 L223.8,56.9 L227.5,55.7 L231.2,54.6 L235.0,53.4 L238.8,52.2 L242.5,51.1 L246.2,49.9 L250.0,48.8 L253.8,47.7 L257.5,46.6 L261.2,45.5 L265.0,44.4 L268.8,43.3 L272.5,42.2 L276.2,41.1 L280.0,40.1 L283.8,39.0 L287.5,38.0 L291.2,37.0 L295.0,35.9 L298.8,34.9 L302.5,33.9 L306.2,32.9 L310.0,31.9 L313.8,30.9 L317.5,29.9 L321.2,28.9 L325.0,28.0 L328.8,27.0 L332.5,26.0 L336.2,25.1 L340.0,24.2" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <path d="M40.0,175.0 L43.8,158.5 L47.5,152.3 L51.2,147.8 L55.0,144.4 L58.8,141.5 L62.5,139.2 L66.2,137.2 L70.0,135.4 L73.8,133.9 L77.5,132.6 L81.2,131.4 L85.0,130.4 L88.8,129.5 L92.5,128.7 L96.2,128.0 L100.0,127.4 L103.8,126.8 L107.5,126.3 L111.2,125.8 L115.0,125.4 L118.8,125.0 L122.5,124.7 L126.2,124.4 L130.0,124.1 L133.8,123.9 L137.5,123.7 L141.2,123.5 L145.0,123.3 L148.8,123.2 L152.5,123.0 L156.2,122.9 L160.0,122.8 L163.8,122.7 L167.5,122.6 L171.2,122.5 L175.0,122.4 L178.8,122.3 L182.5,122.3 L186.2,122.2 L190.0,122.2 L193.8,122.1 L197.5,122.1 L201.2,122.0 L205.0,122.0 L208.8,122.0 L212.5,121.9 L216.2,121.9 L220.0,121.9 L223.8,121.9 L227.5,121.8 L231.2,121.8 L235.0,121.8 L238.8,121.8 L242.5,121.8 L246.2,121.8 L250.0,121.8 L253.8,121.8 L257.5,121.7 L261.2,121.7 L265.0,121.7 L268.8,121.7 L272.5,121.7 L276.2,121.7 L280.0,121.7 L283.8,121.7 L287.5,121.7 L291.2,121.7 L295.0,121.7 L298.8,121.7 L302.5,121.7 L306.2,121.7 L310.0,121.7 L313.8,121.7 L317.5,121.7 L321.2,121.7 L325.0,121.7 L328.8,121.7 L332.5,121.7 L336.2,121.7 L340.0,121.7" fill="none" stroke="#1d6fd1" stroke-width="2.4"/>
  <text x="227.5" y="47.7" font-size="12" fill="#b4232c" text-anchor="end">random walk: √(Qt)</text>
  <text x="332.5" y="137.7" font-size="12" fill="#1d6fd1" text-anchor="end">Gauss-Markov: levels off at σ = 3</text>
  <text x="44.0" y="17.0" font-size="11" fill="#1f2a44" text-anchor="start">σ (°/h)</text>
</svg>
```

For the first ten seconds or so the two curves nearly coincide: the leash has not pulled yet. After a few hundred seconds the Gauss-Markov curve (blue) has flattened at $\sigma = 3$, while the random walk (red) keeps climbing as $\sqrt{Qt}$ and never stops.
:::

::: context exp-acf The fingerprint
The autocorrelation of a Gauss-Markov process is a tent with curved sides: $\sigma^2$ at zero gap, falling as $e^{-|\tau|/T}$ in both directions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20.0" y1="160.0" x2="340.0" y2="160.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180.0" y1="12.0" x2="180.0" y2="160.0" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20.0,153.0 L22.7,152.7 L25.3,152.3 L28.0,151.9 L30.7,151.5 L33.3,151.1 L36.0,150.6 L38.7,150.1 L41.3,149.6 L44.0,149.1 L46.7,148.5 L49.3,147.9 L52.0,147.3 L54.7,146.6 L57.3,146.0 L60.0,145.2 L62.7,144.5 L65.3,143.7 L68.0,142.9 L70.7,142.0 L73.3,141.1 L76.0,140.1 L78.7,139.1 L81.3,138.0 L84.0,136.9 L86.7,135.7 L89.3,134.4 L92.0,133.1 L94.7,131.7 L97.3,130.3 L100.0,128.8 L102.7,127.2 L105.3,125.5 L108.0,123.7 L110.7,121.8 L113.3,119.9 L116.0,117.8 L118.7,115.7 L121.3,113.4 L124.0,111.0 L126.7,108.5 L129.3,105.9 L132.0,103.1 L134.7,100.2 L137.3,97.1 L140.0,93.9 L142.7,90.5 L145.3,86.9 L148.0,83.2 L150.7,79.2 L153.3,75.1 L156.0,70.7 L158.7,66.2 L161.3,61.3 L164.0,56.3 L166.7,51.0 L169.3,45.4 L172.0,39.5 L174.7,33.3 L177.3,26.8 L180.0,20.0 L182.7,26.8 L185.3,33.3 L188.0,39.5 L190.7,45.4 L193.3,51.0 L196.0,56.3 L198.7,61.3 L201.3,66.2 L204.0,70.7 L206.7,75.1 L209.3,79.2 L212.0,83.2 L214.7,86.9 L217.3,90.5 L220.0,93.9 L222.7,97.1 L225.3,100.2 L228.0,103.1 L230.7,105.9 L233.3,108.5 L236.0,111.0 L238.7,113.4 L241.3,115.7 L244.0,117.8 L246.7,119.9 L249.3,121.8 L252.0,123.7 L254.7,125.5 L257.3,127.2 L260.0,128.8 L262.7,130.3 L265.3,131.7 L268.0,133.1 L270.7,134.4 L273.3,135.7 L276.0,136.9 L278.7,138.0 L281.3,139.1 L284.0,140.1 L286.7,141.1 L289.3,142.0 L292.0,142.9 L294.7,143.7 L297.3,144.5 L300.0,145.2 L302.7,146.0 L305.3,146.6 L308.0,147.3 L310.7,147.9 L313.3,148.5 L316.0,149.1 L318.7,149.6 L321.3,150.1 L324.0,150.6 L326.7,151.1 L329.3,151.5 L332.0,151.9 L334.7,152.3 L337.3,152.7 L340.0,153.0" fill="none" stroke="#1d6fd1" stroke-width="2.4"/>
  <line x1="126.7" y1="108.5" x2="126.7" y2="160.0" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="126.7" cy="108.5" r="3.5" fill="#b4232c"/>
  <line x1="233.3" y1="108.5" x2="233.3" y2="160.0" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="233.3" cy="108.5" r="3.5" fill="#b4232c"/>
  <line x1="126.7" y1="108.5" x2="233.3" y2="108.5" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="186.0" y="24.0" font-size="12" fill="#1f2a44" text-anchor="start">σ² at τ = 0</text>
  <text x="241.3" y="104.5" font-size="12" fill="#b4232c" text-anchor="start">σ²/e ≈ 0.37σ²</text>
  <line x1="20.0" y1="160.0" x2="20.0" y2="164.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20.0" y="177.0" font-size="12" fill="#1f2a44" text-anchor="middle">−3T</text>
  <line x1="126.7" y1="160.0" x2="126.7" y2="164.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="126.7" y="177.0" font-size="12" fill="#1f2a44" text-anchor="middle">−T</text>
  <line x1="233.3" y1="160.0" x2="233.3" y2="164.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="233.3" y="177.0" font-size="12" fill="#1f2a44" text-anchor="middle">T</text>
  <line x1="340.0" y1="160.0" x2="340.0" y2="164.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340.0" y="177.0" font-size="12" fill="#1f2a44" text-anchor="middle">3T</text>
  <text x="180.0" y="177.0" font-size="12" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="340.0" y="154.0" font-size="12" fill="#1f2a44" text-anchor="end">τ</text>
</svg>
```

At a gap of one correlation time it is down to $1/e \approx 0.37$ of its peak (red dots). At three correlation times it is down to $0.05$. To estimate $T$ from data, find where the measured autocorrelation crosses $0.37$ of its peak.
:::

::: context allan-history Borrowed from clockmakers
The Allan variance was invented by David Allan at the US National Bureau of Standards in 1966 — not for gyros, but for atomic clocks. Clock engineers had the same problem: an ordinary variance of a clock's frequency errors kept growing as the record got longer, because some of the noise was flicker noise and never settled. Allan's trick of differencing neighboring averages gave a number that stayed finite. Gyro engineers adopted it, and IEEE standards for testing gyros now describe it in detail.
:::

::: context flicker Noise that is everywhere
**Flicker noise**, also called **pink** or **$1/f$** noise, has power that grows toward low frequencies in inverse proportion to frequency. It turns up in a remarkable range of places: electronic components, the flow of rivers, heartbeats, and the loudness of music. Nobody has one theory that explains all of them. In a sensor it shows up as a bias that wanders on every time scale at once — which is why no single exponential copies it exactly, and why the Gauss-Markov stand-in is a compromise.
:::

::: context allan-plot Reading an Allan plot
This is a sketch of the example's gyro. The dashed grey lines are the three pieces: white noise falling at slope $-\tfrac{1}{2}$, the flat bias-instability floor at $5.5 \times 10^{-4}\,^\circ/\mathrm{s}$, and a rate random walk rising at slope $+\tfrac{1}{2}$. The blue curve is their combination — independent noises add in variance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50.0" y1="170.0" x2="345.0" y2="170.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50.0" y1="12.0" x2="50.0" y2="170.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50.0" y1="170.0" x2="50.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">0.1</text>
  <line x1="109.0" y1="170.0" x2="109.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="109.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <line x1="168.0" y1="170.0" x2="168.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="168.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <line x1="227.0" y1="170.0" x2="227.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="227.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">100</text>
  <line x1="286.0" y1="170.0" x2="286.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="286.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">1000</text>
  <line x1="345.0" y1="170.0" x2="345.0" y2="174.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="345.0" y="186.0" font-size="11" fill="#1f2a44" text-anchor="middle">10⁴</text>
  <line x1="46.0" y1="170.0" x2="50.0" y2="170.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="43.0" y="174.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁴</text>
  <line x1="46.0" y1="106.8" x2="50.0" y2="106.8" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="43.0" y="110.8" font-size="11" fill="#1f2a44" text-anchor="end">10⁻³</text>
  <line x1="46.0" y1="43.6" x2="50.0" y2="43.6" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="43.0" y="47.6" font-size="11" fill="#1f2a44" text-anchor="end">10⁻²</text>
  <text x="345.0" y="200.0" font-size="11" fill="#1f2a44" text-anchor="end">averaging time τ (s)</text>
  <path d="M50.0,31.0 L244.7,135.3" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 3"/>
  <line x1="156.2" y1="123.2" x2="345.0" y2="123.2" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 3"/>
  <path d="M291.9,144.6 L345.0,116.2" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 3"/>
  <path d="M50.0,31.0 L53.0,32.6 L55.9,34.2 L58.9,35.7 L61.8,37.3 L64.8,38.9 L67.7,40.5 L70.7,42.0 L73.6,43.6 L76.5,45.2 L79.5,46.8 L82.5,48.3 L85.4,49.9 L88.3,51.5 L91.3,53.1 L94.2,54.6 L97.2,56.2 L100.2,57.8 L103.1,59.3 L106.0,60.9 L109.0,62.5 L112.0,64.0 L114.9,65.6 L117.9,67.1 L120.8,68.7 L123.8,70.2 L126.7,71.8 L129.7,73.3 L132.6,74.9 L135.6,76.4 L138.5,77.9 L141.4,79.4 L144.4,80.9 L147.4,82.4 L150.3,83.9 L153.2,85.4 L156.2,86.9 L159.2,88.4 L162.1,89.8 L165.1,91.2 L168.0,92.7 L171.0,94.1 L173.9,95.4 L176.8,96.8 L179.8,98.1 L182.8,99.4 L185.7,100.7 L188.7,102.0 L191.6,103.2 L194.6,104.4 L197.5,105.6 L200.5,106.7 L203.4,107.8 L206.4,108.8 L209.3,109.8 L212.2,110.7 L215.2,111.7 L218.2,112.5 L221.1,113.3 L224.1,114.1 L227.0,114.8 L230.0,115.5 L232.9,116.1 L235.9,116.7 L238.8,117.2 L241.8,117.7 L244.7,118.1 L247.7,118.5 L250.6,118.9 L253.6,119.2 L256.5,119.5 L259.4,119.7 L262.4,119.9 L265.4,120.0 L268.3,120.2 L271.2,120.2 L274.2,120.3 L277.1,120.3 L280.1,120.3 L283.1,120.2 L286.0,120.2 L288.9,120.0 L291.9,119.9 L294.9,119.7 L297.8,119.4 L300.8,119.2 L303.7,118.8 L306.7,118.5 L309.6,118.1 L312.6,117.7 L315.5,117.2 L318.4,116.6 L321.4,116.1 L324.4,115.4 L327.3,114.8 L330.2,114.0 L333.2,113.3 L336.2,112.4 L339.1,111.6 L342.1,110.7 L345.0,109.7" fill="none" stroke="#1d6fd1" stroke-width="2.4"/>
  <circle cx="109.0" cy="62.6" r="3.5" fill="#b4232c"/>
  <text x="116.0" y="58.6" font-size="11" fill="#b4232c" text-anchor="start">0.005 at τ = 1 s → ARW</text>
  <text x="97.2" y="100.5" font-size="11" fill="#1f2a44" text-anchor="start">slope −½</text>
  <text x="227.0" y="139.2" font-size="11" fill="#1f2a44" text-anchor="middle">floor 0.664 B</text>
  <text x="342.1" y="103.6" font-size="11" fill="#1f2a44" text-anchor="end">slope +½</text>
  <text x="54.0" y="14.0" font-size="11" fill="#1f2a44" text-anchor="start">σ_A (°/s)</text>
</svg>
```

The white line and the floor cross at $\tau \approx 82\,\mathrm{s}$: the knee that sets $T$. Because the pieces add, the blue curve sits a little above the floor at its bottom; engineers read the floor from the flat stretch, not from the lowest point.
:::
