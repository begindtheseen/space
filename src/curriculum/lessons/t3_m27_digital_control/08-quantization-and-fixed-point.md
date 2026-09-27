---
id: l08-quantization-fixed-point
title: Quantization, finite word length and fixed point
minutes: 22
covers:
  - Quantization, finite word length, and fixed-point implementation
---

A bathroom scale that shows whole kilograms cannot tell you that you gained $300$ grams. Every number inside a flight computer has the same limit. The gyro reading arrives as a whole number of steps from a converter. The filter coefficients were rounded to fit a memory word. Each multiply must be rounded before it is stored. The command leaves through another converter with its own step. None of these roundings is large. All of them happen every frame, forever.

Turning a real value into one of a limited set of values is **quantization**. The number of bits used to store a value is its **word length**, and it is always finite. That causes trouble in three different ways, and mixing them up causes most of the confusion.

1. It puts **noise** into the loop, which reaches the actuator amplified by the controller's high-frequency gain.
2. It **moves the poles and zeros** you placed, because the coefficients you stored are not the ones you designed.
3. It creates **nonlinear behavior** with no continuous counterpart: dead bands, where a small error gets no response, and limit cycles, which oscillate forever at the level of the smallest step.

This lesson puts numbers on all three, then covers **fixed-point** arithmetic — fractional math done with integers. Many **[[radiation-tolerant|rad-hard-processors]]** flight processors lack a floating-point unit, and even with one, the same arithmetic governs how coefficients are stored.

## The uniform quantizer

A **uniform quantizer** with step $q$ replaces a real value $x$ by the nearest whole multiple of $q$. Call the result $Q(x)$, and the error $e = Q(x) - x$. With round-to-nearest, $e$ always lies between $-q/2$ and $+q/2$. The smallest step, $q$, is also called one **least significant bit** (LSB).

If the signal moves across many steps between samples, where it lands inside a step is effectively random, so the error is well modeled as **[[uniformly distributed|uniform-error]]** over $[-q/2, +q/2]$ — every value equally likely — and independent from one sample to the next. Its mean is zero by symmetry. Its **variance** — the average of the squared error, the usual measure of noise power — is

$$
\mathbb{E}[e] = 0,
\qquad
\mathrm{Var}(e) = \int_{-q/2}^{q/2} e^2\,\frac{de}{q}
= \frac{1}{q}\left[\frac{e^3}{3}\right]_{-q/2}^{q/2}
= \frac{q^2}{12}.
$$

In words: every error value has the same probability density, $1/q$. Weight $e^2$ by it and integrate; $e^3/3$ between the two ends gives $\frac{1}{q}\cdot\frac{2}{3}\cdot\frac{q^3}{8} = q^2/12$. So the error's **standard deviation** — the square root of the variance, the typical size — is $q/\sqrt{12} = 0.2887\,q$.

::: key
**Quantization noise power.** For a uniform quantizer of step $q$, the error is approximately uniform with variance $q^2/12$. Derivative terms multiply this by roughly $N/T$ — exactly $2/T^2$ for a raw backward difference, and about $N^2$ for a derivative filtered at $N\,\mathrm{rad/s}$ — which is why filtered derivatives matter even more in fixed point.
:::

### Truncation is a drift, not a noise

Some hardware **truncates** instead — chops off the extra bits, always rounding down. Then the error lies in $[-q, 0]$ and has mean $-q/2$. That average is the difference between a noise and a drift.

Picture a cashier who always rounds your change down. Once, it costs you half a cent. Every day for a year, it adds up. An integrator is that cashier. A truncating integrator piles up $-q/2$ every frame. At $q = 2^{-15}$ and $200\,\mathrm{Hz}$, that is $\tfrac12 \times 2^{-15} \times 200 = 3.05\times10^{-3}$ per second of false drift in the integrator state — a steadily growing false command. Round, do not truncate, anywhere a result is accumulated.

### Six decibels per bit

An $N$-bit converter spanning a full-scale range $\mathrm{FS}$ has step $q = \mathrm{FS}/2^N$. Feed it a full-scale sine wave, amplitude $\mathrm{FS}/2$. A sine of amplitude $A$ has power $A^2/2$, so the signal power is $\mathrm{FS}^2/8$. The noise power is $q^2/12$. Their ratio, in **[[decibels|decibels]]**, is the **signal-to-noise ratio**:

$$
\mathrm{SNR} = 10\log_{10}\!\left(\frac{12 \cdot 2^{2N}}{8}\right) = 6.02\,N + 1.76\ \mathrm{dB}.
$$

Six decibels per bit: each extra bit halves the step and quarters the noise power. A $16$-bit converter gives $6.02 \times 16 + 1.76 = 98\,\mathrm{dB}$ at full scale. A signal using only part of the range gets less — the usual case — so match the converter's range to the signal, not to the worst transient imaginable.

The white-noise model fails when the signal is small or creeps slowly: a signal sitting between two codes makes the same error sample after sample, which is a tone, not noise. The classic cure is **[[dither|dither]]**.

## What the controller does with that noise

Quantization noise enters at the sensor and leaves through the actuator. The proportional path multiplies it by $k_p$. The derivative path does the damage.

A raw backward difference, $d[n] = (x[n] - x[n-1])/T$, subtracts two independent errors, each of variance $\sigma_q^2$ ("sigma sub q squared"). Variances of independent errors add, so the difference has variance $2\sigma_q^2$, and dividing by $T$ divides the variance by $T^2$: $2\sigma_q^2/T^2$.

A derivative **filtered** at $N\,\mathrm{rad/s}$ — the practical form $k_d N s/(s+N)$ the classical control module insisted on — does much better. Written as a discrete filter,

$$
H(z) = G\,\frac{1 - z^{-1}}{1 - az^{-1}},
\qquad a = e^{-NT},
\qquad G = \frac{N(1+a)}{2},
$$

with $G$ chosen so the high-frequency gain matches the continuous one. The output noise **[[works out|derivative-noise-proof]]** to

$$
\sigma_d = \sigma_q\,N\sqrt{\frac{1+a}{2}} .
$$

::: example Quantization noise through a derivative, in a 200 Hz loop
A $16$-bit rate gyro spans $\pm300^\circ/\mathrm{s}$. The step is $q = 600/65536 = 9.155\times10^{-3}\,{}^\circ/\mathrm{s}$, so $\sigma_q = q/\sqrt{12} = 2.643\times10^{-3}\,{}^\circ/\mathrm{s}$. The loop runs at $200\,\mathrm{Hz}$, so $T = 5\,\mathrm{ms}$.

Send that error through three derivatives. Compare the formulas with a simulation of four million random uniform errors:

| Derivative path | Predicted $\sigma_d$ | Simulated |
| --- | --- | --- |
| Raw backward difference | $0.7475\,{}^\circ/\mathrm{s^2}$ | $0.7475$ |
| Filtered at $N = 2\pi\cdot30 = 188.5\,\mathrm{rad/s}$ | $0.4152$ | $0.4153$ |
| Filtered at $N = 2\pi\cdot10 = 62.83\,\mathrm{rad/s}$ | $0.1545$ | $0.1545$ |

Check the first row by hand: $\sqrt2 \times 2.643\times10^{-3}/0.005 = 0.7475$. For the $10\,\mathrm{Hz}$ row, $a = e^{-62.83 \times 0.005} = 0.730$, so $\sigma_d = 2.643\times10^{-3} \times 62.83 \times \sqrt{1.730/2} = 0.1545$.

Filtering at $30\,\mathrm{Hz}$ cuts the noise by $44\%$. Filtering at $10\,\mathrm{Hz}$ cuts it by $79\%$. The price is phase. A first-order filter at $N$ costs $\arctan(\omega/N)$, so at a $4\,\mathrm{Hz}$ crossover the $30\,\mathrm{Hz}$ filter costs $\arctan(4/30) = 7.6^\circ$ and the $10\,\mathrm{Hz}$ filter costs $\arctan(4/10) = 21.8^\circ$. Noise against phase, set by one number: that is why $N$ is tunable.

Before tuning, compare with the sensor's own noise. As a density, the quantization error is $\sigma_q\sqrt{2T} = 2.64\times10^{-4}\,{}^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. A high-performance gyro — fiber-optic class — can have an **[[angle random walk|angle-random-walk]]** around $0.01^\circ/\sqrt{\mathrm{hr}}$, which is $0.01/60 = 1.67\times10^{-4}\,{}^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. For a sensor that good, the converter is noisier than the sensor. Filtering harder will not fix that; more bits or a narrower range will.
:::

## Dead bands and limit cycles

Quantization is a **nonlinearity** — its output is not proportional to its input — and two of its effects have no linear counterpart.

A **dead band** is a region where the loop cannot respond, because the correction it wants is smaller than one actuator step. Think of a steering wheel with play in it: small turns do nothing. If the command converter has step $q_u$ and the gain from attitude error to command is $k$, then an attitude error smaller than $q_u/(2k)$ rounds to no change in the command. Inside that band the loop is effectively open, and the band, not the integrator, limits the steady pointing error.

A **[[limit cycle|limit-cycle-picture]]** is what happens when the loop is not quite dead but keeps flipping between neighboring codes, or stalls where it should have decayed. See it in the simplest recursion, a first-order filter with no input: $y[n] = Q(a\,y[n-1])$. In exact arithmetic $y$ shrinks by the factor $a$ every step and fades to zero. With rounding, the output stops changing as soon as rounding returns the same value. That happens when the change, $|a y - y|$, is no more than half a step:

$$
|y|\,(1 - |a|) \le \frac{q}{2}
\quad\Longrightarrow\quad
|y| \le \frac{q}{2(1 - |a|)} .
$$

Inside that band the quantized filter acts as though its pole had magnitude $1$ — it stops decaying. The band grows as the pole nears the unit circle, which is another way of saying it grows with sample rate:

| Pole $a$ | Dead band, in LSBs |
| --- | --- |
| $0.9$ | $5$ |
| $0.99$ | $50$ |
| $0.999$ | $500$ |

Take $q = 2^{-15}$ and a pole at $a = 0.999$ — a filter with corner $1\,\mathrm{rad/s}$ (about $0.16\,\mathrm{Hz}$) running at $1\,\mathrm{kHz}$, since $e^{-1 \times 0.001} = 0.999$. The band is $500 \times 2^{-15} = 1.5\times10^{-2}$ of full scale, or $1.5\%$: not a rounding error at all. The same filter at $50\,\mathrm{Hz}$ has $a = e^{-0.02} = 0.980$ and a band of $25$ LSBs, twenty times smaller.

::: warning
Do not try to kill a limit cycle by adding gain. More gain shrinks the dead band in attitude error but leaves the mechanism alone, and pushes the oscillation up in frequency and size at the actuator: wear, heat and noise. Three things do work: more bits on the actuator command; a slower filter pole (or a lower sample rate for that element); and explicit dead-band logic that holds the command still when the error is smaller than the loop can act on. The last is what flies on spacecraft **[[thruster control|thruster-deadband]]**, where the actuator is quantized by nature and the dead band is a designed number in the requirements.
:::

## Coefficient quantization moves your poles

Rounding $a_1$ and $a_2$ to a finite word moves the roots of $z^2 + a_1 z + a_2$. How far depends entirely on where the roots are.

For a polynomial of degree $N$ with roots $z_j$, the **sensitivity** of root $z_i$ to coefficient $a_k$ is

$$
\frac{\partial z_i}{\partial a_k} = \frac{-z_i^{\,N-k}}{\prod_{j\ne i}(z_i - z_j)} .
$$

(The $\prod$, "product", multiplies the terms for every other root $j$. The **[[derivation|root-sensitivity]]** is a few lines.) Look at the bottom: it is the product of the distances from this root to all the others. When roots cluster, those distances are tiny and the sensitivity is huge. Clustering is exactly what a high sample rate does, pulling every pole toward $z = 1$. This is the conditioning argument of the sample-rate lesson with a formula attached. It is also why high-order filters are built as a cascade of second-order sections, which the biquad lesson takes up.

::: example The same notch at 200 Hz and at 2 kHz
Take the $18\,\mathrm{rad/s}$ notch used throughout this module: center $\omega_m = 18\,\mathrm{rad/s} = 2.8648\,\mathrm{Hz}$, numerator damping $\zeta_n = 0.02$, denominator damping $\zeta_d = 0.3$. Discretize it with Tustin prewarped at $\omega_m$, then round the coefficients to a fixed-point word.

At $f_s = 200\,\mathrm{Hz}$ the exact denominator has $a_1 = -1.939607$, $a_2 = 0.947489$.

| Coefficient word | Notch center | Depth | Pole radius |
| --- | --- | --- | --- |
| exact | $2.8648\,\mathrm{Hz}$ | $-23.52\,\mathrm{dB}$ | $0.973390$ |
| 16-bit ($2^{-15}$) | $2.8633\,\mathrm{Hz}$ | $-23.50\,\mathrm{dB}$ | $0.973385$ |
| 12-bit ($2^{-11}$) | $2.9401\,\mathrm{Hz}$ | $-23.81\,\mathrm{dB}$ | $0.973276$ |

Sixteen bits is fine. Twelve bits moves the center up $2.6\%$ and pushes the zero-frequency (**DC**) gain to $1.0625$ instead of $1$.

Now the same filter at $f_s = 2\,\mathrm{kHz}$, where $a_1 = -1.994534$ and $a_2 = 0.994615$. The poles have crowded toward $z = 1$, as the sample-rate lesson predicted.

| Coefficient word | Result |
| --- | --- |
| exact | center $2.8648\,\mathrm{Hz}$, $\zeta_d = 0.300$, poles at $0.997304\,e^{\pm j0.00859}$ |
| 16-bit | center $3.0498\,\mathrm{Hz}$ — $6.5\%$ high — and $\zeta_d = 0.281$ |
| 12-bit | denominator becomes $z^2 - 1.994629z + 0.994629$, whose roots are $z = 1$ and $z = 0.994629$ |

Read the last row slowly. Rounding to twelve bits made $1 + a_1 + a_2 = 1 - 1.994629 + 0.994629 = 0$ exactly. Plugging $z = 1$ into the denominator gives exactly that sum, so $z = 1$ is now a root. The notch has become an *integrator*: infinite DC gain, ramping without limit on any constant input. The complex pair collided with the real axis and split, and one half landed on the stability boundary.

The design did not change between the tables. At $2\,\mathrm{kHz}$ the information that tells this notch apart from an integrator lives below the twelfth bit. That is what "the coefficients cluster near $z = 1$ and lose precision" means, and why the realization forms of the next lesson exist.
:::

## Fixed-point arithmetic

Stores do not keep prices as "$2.49$ dollars". They keep the whole number $249$ and agree that it means cents. **Fixed point** is the same trick in binary: store an integer and agree where the binary point goes.

The notation **[[Q-format|q-format]]** $\mathrm{Q}m.n$ (read "Q m dot n") means $m$ integer bits and $n$ fraction bits, so the stored integer $I$ stands for $I \cdot 2^{-n}$. The common signed forms in a $16$-bit word, where one bit is the sign:

| Format | Range | Resolution |
| --- | --- | --- |
| $\mathrm{Q}15$ (that is $\mathrm{Q}0.15$) | $[-1,\ 1 - 2^{-15}]$ | $3.052\times10^{-5}$ |
| $\mathrm{Q}14$ | $[-2,\ 2 - 2^{-14}]$ | $6.104\times10^{-5}$ |
| $\mathrm{Q}12$ | $[-8,\ 8 - 2^{-12}]$ | $2.441\times10^{-4}$ |

Every bit of range costs a bit of resolution. That bites a second-order section at once, because $a_1$ is close to $-2$ and does not fit in $\mathrm{Q}15$. The standard answers: store $a_1/2$ in $\mathrm{Q}15$ and shift left after the multiply, or use $\mathrm{Q}14$ and accept half the resolution. The choice changes the tables above by a factor of two, so it is a design decision, not a detail.

Four rules come straight from the arithmetic.

**Multiplication doubles the word length.** A $\mathrm{Q}15 \times \mathrm{Q}15$ product is $\mathrm{Q}30$ in a $32$-bit register. Shifting it back to $\mathrm{Q}15$ before adding up throws away the low bits of every product — the classic way to make a good filter noisy. Add up at full width and round once at the end. Signal processors provide **wide accumulators**, often $40$ bits, for exactly this.

**Saturate, never wrap.** In **[[two's complement|twos-complement]]**, the usual way computers store signed integers, an addition that overflows wraps around: one count above the largest positive value is the largest negative value. In a control loop that is a full-scale command reversal — at a gimbal, a hard-over the wrong way. **Saturating** arithmetic clips at the extreme instead. That is a survivable nonlinearity, which anti-windup logic already handles. Use saturating operations on every accumulator that can reach its limits, and count the saturations in telemetry.

**Scale so overflow cannot happen.** Before choosing a format for any internal value, bound how big it can get. For a filter with impulse response $h$ and input bounded by $x_{\max}$, the safe bound is $x_{\max}\sum_n |h[n]|$. The less cautious one, fine for narrowband inputs, is $x_{\max}\max_\omega |H(e^{j\omega T})|$ — the input size times the peak of the frequency response. Use the first for a signal that can contain a step, the second for one that cannot. A resonant section's peak gain of $10$ or more must fit in the format.

**Round at every store, and check the bias.** Rounding costs one add and one shift, and it removes the $-q/2$ average that truncation leaves. In anything with an integrator, that bias is not noise. It integrates.

### What about floating point?

On a processor with hardware floating point, **[[single precision|single-precision]]** keeps $24$ bits of mantissa (the significant digits), about $7$ decimal digits. That beats every fixed-point format above, and it leaves the $200\,\mathrm{Hz}$ notch untouched. Even at $2\,\mathrm{kHz}$ the stored coefficients are fine: $a_2 = 0.994615$ rounds to single precision with an error of at most $3\times10^{-8}$, which moves the pole radius by at most $1.5\times10^{-8}$ and the decay rate by at most $3\times10^{-5}\,\mathrm{s^{-1}}$ out of $5.4$ — harmless. The weak spot at high rates is the *state* arithmetic, where the part of the answer carrying the dynamics has relative size about $(\omega_n T)^2$. Single precision resolves relative differences of $2^{-24} = 6.0\times10^{-8}$. For a $1\,\mathrm{Hz}$ mode, $(\omega_n T)^2$ is $9.9\times10^{-4}$ at $200\,\mathrm{Hz}$ and $4.0\times10^{-5}$ at $1\,\mathrm{kHz}$, far above that floor. At $10\,\mathrm{kHz}$ it is $4.0\times10^{-7}$, only a factor of seven clear, and at $100\,\mathrm{kHz}$ it is $4.0\times10^{-9}$, entirely below the rounding. Double precision pushes the problem out of reach for any realistic rate, at some cost in memory and speed. Floating point moves the threshold; it does not remove it.

## Check yourself

::: check
A gimbal command goes out through a $12$-bit converter spanning $\pm 6^\circ$. The control effectiveness is $4.75\,\mathrm{rad/s^2}$ of vehicle angular acceleration per radian of gimbal. What angular acceleration does one LSB produce, and what does that mean for the pointing the loop can hold?
:::

::: answer
The range is $12^\circ$ over $2^{12} = 4096$ steps, so $q_u = 12^\circ/4096 = 2.930\times10^{-3}\,{}^\circ = 5.113\times10^{-5}\,\mathrm{rad}$.

One LSB of gimbal gives $4.75 \times 5.113\times10^{-5} = 2.429\times10^{-4}\,\mathrm{rad/s^2}$. Over one $20\,\mathrm{ms}$ frame that changes the body rate by $2.429\times10^{-4} \times 0.02 = 4.86\times10^{-6}\,\mathrm{rad/s}$, which is $2.8\times10^{-4}\,{}^\circ/\mathrm{s}$.

So command resolution does not limit pointing. A rate step of $3\times10^{-4}\,{}^\circ/\mathrm{s}$ per frame is far below the gyro's own step of $9.2\times10^{-3}\,{}^\circ/\mathrm{s}$ and far below the vehicle's disturbances. Look elsewhere — the sensor, the actuator's mechanical resolution and backlash, the structure — before adding bits to the command converter. Getting this ordering right is most of what a word-length analysis is for.
:::

::: check
Why does truncation behave so much worse than rounding inside an integrator, and how big is the effect in a $100\,\mathrm{Hz}$ loop with $\mathrm{Q}15$ arithmetic?
:::

::: answer
Rounding gives a zero-mean error, so an integrator builds up a **random walk**: after $n$ samples its standard deviation is $\sigma_q\sqrt{n}$, growing slowly in no preferred direction. Truncation gives an error with mean $-q/2$, so the integrator builds up a *steady ramp*, $-qn/2$, growing in a straight line and always the same way.

With $q = 2^{-15} = 3.052\times10^{-5}$ and $f_s = 100\,\mathrm{Hz}$, the drift is $q f_s/2 = 1.526\times10^{-3}$ of full scale per second — about $0.15\%$ per second, $9\%$ per minute. The state reaches full scale in $1/1.526\times10^{-3} = 655\,\mathrm{s}$, about eleven minutes. That looks exactly like a real, slowly growing bias, and any outer loop will chase it.

Over the same eleven minutes ($65{,}500$ samples) the rounding random walk reaches about $\sigma_q\sqrt{65500} = (3.052\times10^{-5}/\sqrt{12}) \times 256 = 2.3\times10^{-3}$ of full scale — more than two orders of magnitude smaller, with no preferred sign. Rounding costs one instruction.
:::

::: check
A filter's coefficients were validated in double precision on the ground and then compiled for a target that uses single precision. What would you check before trusting that the validation still holds?
:::

::: answer
Three things, in order of how likely they are to bite.

First, the poles. Compute them from the single-precision coefficients and compare $\zeta$ and $\omega_n$ with the design — not the coefficients with each other. By the sensitivity formula, a relative coefficient change of $10^{-7}$ can move clustered poles by much more. Clustering is decided by $\omega_n T$, so the real question is "how fast is this loop compared with its dynamics?"

Second, the state arithmetic, not only the coefficients. A direct-form section at a high rate computes $y[n]$ as the small leftover of a near-cancellation, and single precision has only $24$ bits of mantissa for it. This is where a cascade of biquads, or the delta form of the next lesson, earns its place.

Third, the DC gain and any other property you know exactly. $H(1) = \sum b/(1 + \sum a)$ should still be $1.000000$ to the precision the design needs. A notch whose DC gain has drifted to $1.03$ has a coefficient problem, whatever the poles say.

If $\omega_n T$ is above about $0.05$, single precision is very unlikely to matter. Below $0.005$, expect to find something.
:::

::: check
An engineer reports that a rate filter "sticks" at a small nonzero value after the vehicle stops moving, and never returns to zero. Diagnose it, and give the number that confirms the diagnosis.
:::

::: answer
It is a quantization limit cycle in the filter's own recursion. With $y[n] = Q(a\,y[n-1] + (1-a)x[n])$ and input $x = 0$, the state freezes at any value with $|a y - y| \le q/2$, that is $|y| \le q/(2(1-a))$. Inside that band rounding returns the same number every frame, and the state never decays.

The confirming number is the band. Get $a$ from the filter (or its time constant $\tau$, since $a = e^{-T/\tau}$) and $q$ from the number format. For a $\tau = 0.5\,\mathrm{s}$ filter at $200\,\mathrm{Hz}$, $a = e^{-0.005/0.5} = e^{-0.01} = 0.99005$. With $\mathrm{Q}15$ the band is $3.052\times10^{-5}/(2 \times 0.00995) = 1.53\times10^{-3}$, about $50$ LSBs. If the stuck value is at or below that, the diagnosis is confirmed. The cures are more fraction bits, a faster pole, or explicitly resetting the state to zero once the input has stayed below a threshold for a set number of frames.

If the stuck value is much *larger* than the band, look for an accumulator stuck at saturation, windup, or a sensor bias.
:::

::: check
Why is $x_{\max}\sum_n |h[n]|$ the conservative overflow bound rather than $x_{\max}\max_\omega |H|$, and when would you use each?
:::

::: answer
The output is a sum of past inputs weighted by $h$. The sum of $|h[n]|$ is the worst-case gain over *every* bounded input: the input that reaches it has the same sign as $h$ at every lag, so every term of the sum adds up in the same direction. No input bounded by $x_{\max}$ can give more than $x_{\max}\sum|h[n]|$, and some input gives exactly that. It is the true bound.

The peak of the frequency response is the worst-case gain over *sine-wave* inputs only. It is smaller — often much smaller for a resonant section — and it is what the output actually reaches when the input is narrowband and has had time to settle.

Use the sum bound where the input can contain a step or a spike: a command path, a mode change, a fault injection, the first frame after startup. Use the frequency-response bound where the input is truly narrowband and limited by physics, such as a structural-mode signal from an accelerometer, and the extra headroom cannot be afforded. Whichever you pick, record it beside the Q format, so the next person to change a coefficient can redo it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Uniform quantizer | Step $q$; with rounding the error is zero-mean, uniform, variance $q^2/12$ |
| Truncation | Mean $-q/2$: a drift, not a noise. In an integrator it ramps at $qf_s/2$ per second |
| Converter SNR | $6.02N + 1.76\,\mathrm{dB}$ at full scale, for an $N$-bit converter |
| Noise density | $\sigma_q\sqrt{2T}$ per $\sqrt{\mathrm{Hz}}$ — compare it with the sensor's own noise before tuning |
| Derivative amplification | Variance $2\sigma_q^2/T^2$ for a raw difference; $\sigma_d = \sigma_q N\sqrt{(1+a)/2}$ with $a = e^{-NT}$ when filtered at $N$ |
| Dead band | A correction smaller than one actuator LSB does nothing; steady error bounded by $q_u/(2k)$ |
| Limit cycle | First-order band $\lvert y\rvert \le q/(2(1-\lvert a\rvert))$: $5$ LSBs at $a = 0.9$, $500$ at $a = 0.999$ |
| Coefficient sensitivity | $\partial z_i/\partial a_k = -z_i^{N-k}/\prod_{j\ne i}(z_i - z_j)$ — clustered roots are fragile |
| $\mathrm{Q}m.n$ | Stored integer $I$ means $I\cdot 2^{-n}$; $\mathrm{Q}15$ resolves $3.05\times10^{-5}$ over $[-1, 1)$ |
| Fixed-point rules | Accumulate at double width, round once; saturate, never wrap; bound every value before choosing a format |
| Floating point | Single precision has $24$ mantissa bits: ample at $200\,\mathrm{Hz}$, marginal at $10\,\mathrm{kHz}$ and hopeless at $100\,\mathrm{kHz}$ for a $1\,\mathrm{Hz}$ mode |

The next lesson uses all of this. A PID can be written in several forms that are identical on paper and behave very differently once the arithmetic is finite. That is how choosing between the direct, parallel and delta forms becomes an engineering decision rather than a matter of taste.

::: context rad-hard-processors Computers built for radiation
In space, charged particles from the Sun and from deep space pass through electronics. One can flip a stored bit or, worse, latch a circuit into a short. **Radiation-tolerant** (or radiation-hardened) processors are designed and tested to survive this.

Hardening takes years of design and qualification, so these chips run generations behind consumer processors, and some small ones used in sensors, actuators and motor drives have no floating-point hardware at all. On those, every fraction is done with integer arithmetic.
:::

::: context uniform-error The error is a sawtooth
Top: the staircase $Q(x)$ against the smooth line $x$ it approximates (dashed). Bottom: the error $Q(x) - x$. It slides steadily from $+q/2$ down to $-q/2$ across each step, then jumps back. A signal moving across many steps spends equal time at every point of that slope — so every error in the band is equally likely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="340" y2="25" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M40,100.0 H70 V85.0 H130 V70.0 H190 V55.0 H250 V40.0 H310 V25.0 H340" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="46" y="40" font-size="11" fill="#1d6fd1">Q(x), step q</text>
  <line x1="40" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3"/>
  <line x1="40" y1="180" x2="340" y2="180" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3"/>
  <path d="M40,160 L70,180 M70,140 L130,180 M130,140 L190,180 M190,140 L250,180 M250,140 L310,180 M310,140 L340,160" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="36" y="144" font-size="11" fill="#1f2a44" text-anchor="end">+q/2</text>
  <text x="36" y="164" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="36" y="184" font-size="11" fill="#1f2a44" text-anchor="end">−q/2</text>
  <text x="200" y="197" font-size="11" fill="#b4232c" text-anchor="middle">error Q(x) − x</text>
</svg>
```
:::

::: context decibels Counting ratios in decibels
A **decibel** (dB) is a way of writing a ratio of powers as $10\log_{10}(\text{ratio})$. A factor of $10$ in power is $10\,\mathrm{dB}$, a factor of $100$ is $20\,\mathrm{dB}$, a factor of $2$ is about $3\,\mathrm{dB}$.

One extra bit halves the step $q$, which cuts the noise power $q^2/12$ by four. Four times is $10\log_{10}4 = 6.02\,\mathrm{dB}$ — hence "six decibels per bit".
:::

::: context dither Adding noise on purpose
A signal that drifts slowly between two codes makes the same rounding error sample after sample: a pattern, not random noise, and patterns show up as tones. **Dither** is a small random signal — typically about one LSB peak to peak — added before quantizing. It shakes the signal across code boundaries so the error becomes random again, at the cost of slightly more noise power.

In GNC you rarely add dither on purpose, because sensor noise and vibration supply it. The exception is a vehicle sitting still on the pad — exactly where static pointing tests are run, and exactly where a quantization tone gets mistaken for a control problem.
:::

::: context derivative-noise-proof Why the filtered formula holds
White noise through a filter comes out with variance $\sigma_q^2 \sum_n h[n]^2$, where $h[n]$ is the filter's impulse response (its output when hit with a single $1$). Here $h[0] = G$ and, for $n \ge 1$, $h[n] = G(a^n - a^{n-1}) = -G(1-a)a^{n-1}$. Sum the squares, using the geometric series $\sum_{n\ge1} a^{2(n-1)} = 1/(1-a^2)$:

$$
\sum_n h[n]^2 = G^2\left[1 + \frac{(1-a)^2}{1-a^2}\right] = G^2\left[1 + \frac{1-a}{1+a}\right] = \frac{2G^2}{1+a}.
$$

With $G = N(1+a)/2$ this is $N^2(1+a)/2$. Take the square root and multiply by $\sigma_q$.
:::

::: context angle-random-walk Reading a gyro's noise spec
Gyro noise is quoted as **angle random walk** (ARW): white noise on the rate, which, once integrated into angle, makes the angle error wander like a random walk — growing with the square root of time. Its unit, degrees per square-root hour, says how far: $0.01^\circ/\sqrt{\mathrm{hr}}$ means about $0.01^\circ$ of angle error after one hour.

To compare with a rate-noise density, convert: $1\,\sqrt{\mathrm{hr}} = 60\,\sqrt{\mathrm{s}}$, so $0.01^\circ/\sqrt{\mathrm{hr}} = 1.67\times10^{-4}\,{}^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. Typical MEMS gyros are ten or more times noisier than that.
:::

::: context limit-cycle-picture A filter that stops decaying
The recursion $y[n] = Q(0.9\,y[n-1])$ with step $q = 1$ and rounding, started at $30$. The dashed curve is exact arithmetic, fading toward zero. The dots are the rounded version: they follow along, then freeze at $5$ — the edge of the band $q/(2(1-0.9)) = 5$ — because $0.9 \times 5 = 4.5$ rounds back up to $5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="24" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="24" y1="15" x2="24" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="24" y1="145" x2="340" y2="145" stroke="#f2b880" stroke-width="2" stroke-dasharray="4 3"/>
  <polyline points="30,20.0 42,35.0 54,48.5 66,60.6 78,71.6 90,81.4 102,90.3 114,98.3 126,105.4 138,111.9 150,117.7 162,122.9 174,127.6 186,131.9 198,135.7 210,139.1 222,142.2 234,145.0 246,147.5 258,149.7 270,151.8 282,153.6 294,155.2 306,156.7 318,158.0 330,159.2" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="30" cy="20" r="3" fill="#1d6fd1"/><circle cx="42" cy="35" r="3" fill="#1d6fd1"/><circle cx="54" cy="50" r="3" fill="#1d6fd1"/><circle cx="66" cy="60" r="3" fill="#1d6fd1"/><circle cx="78" cy="70" r="3" fill="#1d6fd1"/><circle cx="90" cy="80" r="3" fill="#1d6fd1"/><circle cx="102" cy="90" r="3" fill="#1d6fd1"/><circle cx="114" cy="100" r="3" fill="#1d6fd1"/><circle cx="126" cy="105" r="3" fill="#1d6fd1"/><circle cx="138" cy="110" r="3" fill="#1d6fd1"/><circle cx="150" cy="115" r="3" fill="#1d6fd1"/><circle cx="162" cy="120" r="3" fill="#1d6fd1"/><circle cx="174" cy="125" r="3" fill="#1d6fd1"/><circle cx="186" cy="130" r="3" fill="#1d6fd1"/><circle cx="198" cy="135" r="3" fill="#1d6fd1"/><circle cx="210" cy="140" r="3" fill="#1d6fd1"/><circle cx="222" cy="145" r="3" fill="#1d6fd1"/><circle cx="234" cy="145" r="3" fill="#1d6fd1"/><circle cx="246" cy="145" r="3" fill="#1d6fd1"/><circle cx="258" cy="145" r="3" fill="#1d6fd1"/><circle cx="270" cy="145" r="3" fill="#1d6fd1"/><circle cx="282" cy="145" r="3" fill="#1d6fd1"/><circle cx="294" cy="145" r="3" fill="#1d6fd1"/><circle cx="306" cy="145" r="3" fill="#1d6fd1"/><circle cx="318" cy="145" r="3" fill="#1d6fd1"/><circle cx="330" cy="145" r="3" fill="#1d6fd1"/>
  <text x="20" y="24" font-size="11" fill="#1f2a44" text-anchor="end">30</text>
  <text x="20" y="149" font-size="11" fill="#1f2a44" text-anchor="end">5</text>
  <text x="20" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="250" y="138" font-size="11" fill="#1f2a44">stuck at 5</text>
  <text x="182" y="186" font-size="11" fill="#6c7a93" text-anchor="middle">sample n, 0 to 25</text>
</svg>
```
:::

::: context thruster-deadband Thrusters are quantized by nature
A small attitude thruster is either firing or not. It cannot give $3\%$ thrust. So a spacecraft steering with thrusters cannot make arbitrarily small corrections, and trying to would fire the thrusters back and forth endlessly, wasting propellant.

The standard answer is a deliberate dead band: while the attitude error stays inside a set box, fire nothing and let the spacecraft drift. Only when the error crosses the edge does a pulse fire. The box size is a written requirement, traded between pointing accuracy and fuel.
:::

::: context root-sensitivity Where the sensitivity formula comes from
Write the monic polynomial as $p(z) = \prod_j (z - z_j) = z^N + a_1 z^{N-1} + \cdots + a_N$. Nudge one coefficient $a_k$ by $\delta a_k$. The root $z_i$ moves to $z_i + \delta z_i$, and the polynomial must still be zero there. To first order,

$$
p'(z_i)\,\delta z_i + z_i^{\,N-k}\,\delta a_k = 0 ,
$$

because $\partial p/\partial a_k = z^{N-k}$. So $\delta z_i/\delta a_k = -z_i^{N-k}/p'(z_i)$. And differentiating the product form, every term but one vanishes at $z_i$, leaving $p'(z_i) = \prod_{j\ne i}(z_i - z_j)$.
:::

::: context q-format Reading a Q number
Take $\mathrm{Q}15$, read "Q fifteen": fifteen fraction bits, so the stored integer is divided by $2^{15} = 32{,}768$. The integer $16{,}384$ means $0.5$; $-32{,}768$ means $-1$; $1$ means $3.05\times10^{-5}$, the smallest step.

Adding two Q15 numbers is plain integer addition. Multiplying them gives an integer that must be divided by $2^{15}$ — a right shift by $15$ bits — to get back to Q15. Forgetting that shift, or shifting too early, is a classic fixed-point bug.
:::

::: context twos-complement Why overflow flips the sign
Two's complement numbers sit on a circle, like the digits of a car's odometer. Counting up from $0$ you reach $+32{,}767$, the largest $16$-bit value. One more step lands on $-32{,}768$. Nothing in the hardware complains.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs><marker id="tw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker></defs>
  <circle cx="180" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M180,30 A70,70 0 0,1 180,170" fill="none" stroke="#1d6fd1" stroke-width="5"/>
  <path d="M180,170 A70,70 0 0,1 180,30" fill="none" stroke="#f2b880" stroke-width="5"/>
  <circle cx="180" cy="30" r="4" fill="#1f2a44"/><circle cx="250" cy="100" r="4" fill="#1f2a44"/><circle cx="110" cy="100" r="4" fill="#1f2a44"/>
  <text x="180" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="258" y="104" font-size="11" fill="#1d6fd1">+16,384</text>
  <text x="102" y="104" font-size="11" fill="#1f2a44" text-anchor="end">−16,384</text>
  <text x="188" y="192" font-size="11" fill="#1d6fd1">+32,767</text>
  <text x="172" y="192" font-size="11" fill="#1f2a44" text-anchor="end">−32,768</text>
  <path d="M200,158 Q180,150 160,158" fill="none" stroke="#b4232c" stroke-width="2" marker-end="url(#tw)"/>
  <text x="180" y="140" font-size="11" fill="#b4232c" text-anchor="middle">+1 wraps</text>
  <text x="300" y="50" font-size="11" fill="#1d6fd1" text-anchor="middle">positive</text>
  <text x="60" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">negative</text>
</svg>
```

Saturating arithmetic refuses that step and stays at $+32{,}767$.
:::

::: context single-precision Floating point in brief
A floating-point number is stored like scientific notation: a **mantissa** holding the significant digits, and an **exponent** saying where the point goes. Single precision (32 bits) has $24$ bits of mantissa counting a hidden leading $1$; double precision (64 bits) has $53$, about $16$ decimal digits.

Because the point floats, tiny and huge numbers both keep about the same *relative* precision. What it cannot do is keep a small difference between two nearly equal large numbers: the difference only gets whatever digits were left over.
:::
