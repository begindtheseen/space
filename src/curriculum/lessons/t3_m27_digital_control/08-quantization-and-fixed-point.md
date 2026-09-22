---
id: l08-quantization-fixed-point
title: Quantization, finite word length and fixed point
minutes: 24
covers:
  - Quantization, finite word length, and fixed-point implementation
---

Every number in a flight computer is an approximation. The gyro reading arrives as an integer from a converter with a finite number of bits; the filter coefficients were rounded to fit a word; each multiply produces a result that has to be rounded before it is stored; and the command leaves through a converter with its own finite resolution. None of these steps is large, and all of them are systematic.

Finite word length shows up in three distinct ways, and confusing them is the source of most of the trouble. It puts **noise** into the loop, which travels through the controller and reaches the actuator amplified by whatever gain the controller has at high frequency. It **moves the poles and zeros** you placed, because the coefficients you stored are not the coefficients you designed. And it creates **nonlinear behaviour with no continuous counterpart** — dead bands where a small error produces no response at all, and limit cycles that oscillate forever at the level of the least significant bit.

This lesson quantifies all three, then covers fixed-point arithmetic: the Q-format notation, where the overflow happens, why saturation and not wrapping, and why rounding beats truncation by more than it sounds like it should. Flight processors with no floating-point unit are still common on radiation-tolerant parts, and even on a processor with one the same arithmetic governs how the coefficients are stored.

## The uniform quantizer

A quantizer with step $q$ replaces a real value $x$ by the nearest representable multiple of $q$. Write the error as $e = Q(x) - x$. With round-to-nearest, $e$ lies in $[-q/2, +q/2]$, and for a signal that moves across many steps between samples the error is well modelled as uniformly distributed over that interval and independent from sample to sample. Then

$$
\mathbb{E}[e] = 0,
\qquad
\mathrm{Var}(e) = \int_{-q/2}^{q/2} e^2\,\frac{de}{q}
= \frac{1}{q}\left[\frac{e^3}{3}\right]_{-q/2}^{q/2}
= \frac{q^2}{12},
$$

so the error has standard deviation $q/\sqrt{12} = 0.2887\,q$.

With **truncation** instead of rounding, the error lies in $[-q, 0]$ and has mean $-q/2$. That bias is the difference between a noise and a drift, and the distinction matters enormously in an integrator: a truncating integrator accumulates $-q/2$ every frame, which at $q = 2^{-15}$ and $200\,\mathrm{Hz}$ is a drift of $3.05\times10^{-3}$ per second in the integrator state — a steadily growing false command. Round, do not truncate, anywhere a result is accumulated.

For an $N$-bit converter spanning a full-scale range $\mathrm{FS}$, the step is $q = \mathrm{FS}/2^N$. Driving it with a full-scale sine of amplitude $\mathrm{FS}/2$ gives signal power $\mathrm{FS}^2/8$ against noise power $q^2/12$, so

$$
\mathrm{SNR} = 10\log_{10}\!\left(\frac{12 \cdot 2^{2N}}{8}\right) = 6.02\,N + 1.76\ \mathrm{dB}.
$$

Six decibels per bit. A 16-bit converter gives $98\,\mathrm{dB}$ at full scale — and proportionally less for a signal that uses only part of the range, which is the usual case and the reason converter range should be matched to the signal rather than to the worst imaginable transient.

::: key
**Quantization noise power.** For a uniform quantizer of step $q$, the error is approximately uniform with variance $q^2/12$. Derivative terms multiply this by roughly $N/T$ — exactly $2/T^2$ for a raw backward difference, and about $N^2$ for a derivative filtered at $N\,\mathrm{rad/s}$ — which is why filtered derivatives matter even more in fixed point.
:::

::: note
The white-noise model of quantization error fails when the input is small or highly correlated with the quantizer's grid: a slowly drifting signal that sits between two codes produces long runs of identical error, which is a tone, not noise. The classical remedy is **dither** — adding a small random signal, typically one LSB peak to peak, before quantizing — which decorrelates the error at the cost of slightly more noise power. In GNC you rarely add dither deliberately, because sensor noise and vehicle vibration usually supply it. Where it does matter is on a stationary vehicle on the pad, which is exactly where a static pointing test is run and exactly where a quantization tone will be mistaken for a control problem.
:::

## What the controller does with that noise

Quantization noise enters at the measurement and leaves through the actuator, multiplied by the controller's gain along the way. The proportional path multiplies it by $k_p$ and nothing more. The derivative path is where the damage is.

A raw backward difference, $d[n] = (x[n] - x[n-1])/T$, takes two independent errors of variance $\sigma_q^2$ and produces variance $2\sigma_q^2/T^2$. A derivative filtered at $N\,\mathrm{rad/s}$ — the practical form $k_d N s/(s+N)$ that the classical control module insisted on — does much better. Realised as $H(z) = G(1 - z^{-1})/(1 - az^{-1})$ with $a = e^{-NT}$ and $G = N(1+a)/2$ so the high-frequency gain matches, its impulse response has $\sum_n h[n]^2 = N^2(1+a)/2$, so

$$
\sigma_d = \sigma_q\,N\sqrt{\frac{1+a}{2}},
\qquad a = e^{-NT}.
$$

::: example Quantization noise through a derivative, in a 200 Hz loop
A $16$-bit rate gyro spans $\pm300^\circ/\mathrm{s}$, so $q = 600/65536 = 9.155\times10^{-3}\,{}^\circ/\mathrm{s}$ and $\sigma_q = q/\sqrt{12} = 2.643\times10^{-3}\,{}^\circ/\mathrm{s}$. The loop runs at $200\,\mathrm{Hz}$, $T = 5\,\mathrm{ms}$.

Feed that error through three derivative implementations and measure the standard deviation at the output, both from the formulas and from four million samples of simulated uniform error:

| Derivative path | Predicted $\sigma_d$ | Simulated |
| --- | --- | --- |
| Raw backward difference | $0.7475\,{}^\circ/\mathrm{s^2}$ | $0.7475$ |
| Filtered at $N = 2\pi\cdot30 = 188.5\,\mathrm{rad/s}$ | $0.4152$ | $0.4153$ |
| Filtered at $N = 2\pi\cdot10 = 62.83\,\mathrm{rad/s}$ | $0.1545$ | $0.1545$ |

Filtering the derivative at $30\,\mathrm{Hz}$ cuts the noise by $44\%$; filtering at $10\,\mathrm{Hz}$ cuts it by $79\%$. The price is phase: a first-order filter at $N$ costs $\arctan(\omega/N)$ at crossover, so at a $4\,\mathrm{Hz}$ crossover the $30\,\mathrm{Hz}$ filter costs $7.6^\circ$ and the $10\,\mathrm{Hz}$ filter costs $21.8^\circ$. That trade — noise against phase, set by one number — is the whole reason the filtered derivative has a tunable $N$ rather than a fixed one.

Worth checking against the sensor's own noise before tuning anything. Expressed as a density, the quantization error is $\sigma_q\sqrt{2T} = 2.64\times10^{-4}\,{}^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. A good tactical-grade MEMS gyro has an angle random walk around $0.01^\circ/\sqrt{\mathrm{hr}}$, which converts to $0.01/60 = 1.67\times10^{-4}\,{}^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. The converter is noisier than the sensor. Filtering the derivative harder will not fix that; a converter with more bits, or a narrower full-scale range, will.
:::

## Dead bands and limit cycles

Quantization is a nonlinearity, and two of its effects have no linear counterpart.

A **dead band** is a region where the loop cannot respond because the correction it wants is smaller than one step of the actuator. If the command converter has step $q_u$ and the loop gain from attitude error to command is $k$, then an attitude error below $q_u/(2k)$ produces no change in the command at all. The loop is open inside that region, and the steady-state pointing error is bounded by it rather than by the integrator.

A **limit cycle** is the oscillation that appears when the loop is not quite dead inside that band but alternates between adjacent codes. The mechanism is visible in a first-order recursion $y[n] = Q(a\,y[n-1])$: a constant output persists forever if rounding returns the same value, which requires $|a y - y| \le q/2$, that is

$$
|y| \le \frac{q}{2(1 - |a|)} .
$$

Inside that band the quantized filter has an effective pole magnitude of 1 — it stops decaying. The band grows as the pole approaches the unit circle, which is another way of saying it grows with sample rate:

| Pole $a$ | Dead band, in LSBs |
| --- | --- |
| $0.9$ | $5$ |
| $0.99$ | $50$ |
| $0.999$ | $500$ |

At $q = 2^{-15}$ and a pole at $a = 0.999$ — a $1.6\,\mathrm{Hz}$ filter at $1\,\mathrm{kHz}$ — the dead band is $1.5\times10^{-2}$ of full scale, which is $1.5\%$: not a rounding error at all. The same filter at $50\,\mathrm{Hz}$ has $a = 0.98$ and a dead band of $2.5$ LSBs.

::: warning
Do not attempt to eliminate a limit cycle by adding gain. Raising the loop gain narrows the dead band in units of attitude error but does nothing to the mechanism, and it moves the oscillation up in frequency and amplitude at the actuator, where it produces wear, heat and acoustic noise. The three things that do work are: more bits on the actuator command, a slower filter pole (equivalently a lower sample rate for that element), and explicit dead-band logic that holds the command constant when the error is below the resolution the loop can act on. The last one is what flies on spacecraft thruster control, where the actuator is quantized by nature and the dead band is a designed quantity with a number in the requirements.
:::

## Coefficient quantization moves your poles

The coefficients stored in flight software are not the ones the design tool printed. Rounding $a_1$ and $a_2$ to a finite word moves the roots of $z^2 + a_1 z + a_2$, and how far depends entirely on where those roots are.

The sensitivity of a root $z_i$ to a coefficient follows from differentiating the polynomial:

$$
\frac{\partial z_i}{\partial a_k} = \frac{-z_i^{\,N-k}}{\prod_{j\ne i}(z_i - z_j)} .
$$

The denominator is the product of distances from this root to all the others. When roots cluster — which is exactly what a high sample rate does, pulling everything towards $z = 1$ — those distances are small and the sensitivity is large. This is the numerical conditioning argument of the sample-rate lesson, now with a formula attached, and it is also the argument for cascading second-order sections rather than implementing one high-order polynomial, which the biquad lesson takes up.

::: example The same notch at 200 Hz and at 2 kHz
Take the $18\,\mathrm{rad/s}$ notch used throughout this module — $\omega_m = 18\,\mathrm{rad/s} = 2.8648\,\mathrm{Hz}$, $\zeta_n = 0.02$, $\zeta_d = 0.3$ — discretized with Tustin prewarped at $\omega_m$, and round the coefficients to a fixed-point word.

At $f_s = 200\,\mathrm{Hz}$ the exact denominator is $a_1 = -1.939607$, $a_2 = 0.947489$.

| Coefficient word | Notch centre | Depth | Pole radius |
| --- | --- | --- | --- |
| exact | $2.8648\,\mathrm{Hz}$ | $-23.52\,\mathrm{dB}$ | $0.973390$ |
| 16-bit ($2^{-15}$) | $2.8632\,\mathrm{Hz}$ | $-23.50\,\mathrm{dB}$ | $0.973385$ |
| 12-bit ($2^{-11}$) | $2.9401\,\mathrm{Hz}$ | $-23.81\,\mathrm{dB}$ | $0.973276$ |

Sixteen bits is fine, twelve bits moves the centre by $2.6\%$ and pushes the DC gain to $1.0625$ instead of 1.

Now the same filter at $f_s = 2\,\mathrm{kHz}$, where $a_1 = -1.994534$ and $a_2 = 0.994615$ — the poles have crowded against $z = 1$ exactly as the sample-rate lesson predicted.

| Coefficient word | Result |
| --- | --- |
| exact | centre $2.8647\,\mathrm{Hz}$, $\zeta_d = 0.300$, poles at $0.997304\,e^{\pm j0.00860}$ |
| 16-bit | centre $3.0497\,\mathrm{Hz}$ — $6.5\%$ high — and $\zeta_d = 0.281$ |
| 12-bit | denominator becomes $z^2 - 1.994629z + 0.994629$, whose roots are $z = 1$ and $z = 0.994629$ |

Read the last row carefully. Rounding to twelve bits made $a_1$ and $a_2$ satisfy $1 + a_1 + a_2 = 0$ exactly, which puts a root at $z = 1$. The notch is now an *integrator*: infinite DC gain, and a filter that ramps without bound on any constant input. The complex pole pair did not merely move — it collided with the real axis and split, and one half landed on the stability boundary.

Nothing about the design changed between the two tables. The filter is the same filter, the coefficients came from the same formula, and the only difference is that at $2\,\mathrm{kHz}$ the information distinguishing this notch from an integrator lives below the twelfth bit. That is what "the coefficients cluster near $z = 1$ and lose precision" means in practice, and it is why the realization form of the next lesson exists.
:::

## Fixed-point arithmetic

A fixed-point number is an integer with an agreed binary point. The notation $\mathrm{Q}m.n$ means $m$ integer bits and $n$ fraction bits, so the stored integer $I$ represents $I \cdot 2^{-n}$. The common signed forms in a $16$-bit word:

| Format | Range | Resolution |
| --- | --- | --- |
| $\mathrm{Q}15$ (that is $\mathrm{Q}0.15$) | $[-1,\ 1 - 2^{-15}]$ | $3.052\times10^{-5}$ |
| $\mathrm{Q}14$ | $[-2,\ 2 - 2^{-14}]$ | $6.104\times10^{-5}$ |
| $\mathrm{Q}12$ | $[-8,\ 8 - 2^{-12}]$ | $2.441\times10^{-4}$ |

Every bit of range costs a bit of resolution. That is immediately a problem for a biquad, because $a_1$ is close to $-2$ and does not fit in $\mathrm{Q}15$. The standard answers are to store $a_1/2$ in $\mathrm{Q}15$ and shift left after the multiply, or to use $\mathrm{Q}14$ and accept half the resolution. Which you choose changes the tables above by a factor of two, so it is a design decision, not a detail.

Four rules follow from the arithmetic itself.

**Multiplication doubles the word length.** A $\mathrm{Q}15 \times \mathrm{Q}15$ product is $\mathrm{Q}30$ in a $32$-bit register. Shifting it back to $\mathrm{Q}15$ immediately, before accumulating, throws away the low bits of every product and is the classic way to turn a good filter into a noisy one. Accumulate at full width and round once at the end. Signal processors provide wide accumulators — often $40$ bits — for exactly this reason.

**Saturate, never wrap.** Two's-complement addition that overflows wraps: one count above the largest positive value is the largest negative value. In a control loop that is a full-scale command reversal, which at a gimbal actuator is a hard-over in the wrong direction. Saturating arithmetic clips at the extreme instead, which is a survivable nonlinearity the anti-windup logic of the classical control module already knows how to handle. Use saturating operations on every accumulator that can reach the rails, and count the saturations in telemetry.

**Scale so overflow cannot happen.** Bound the worst-case magnitude at every internal node before choosing its format. The conservative bound on the output of a filter with impulse response $h$ driven by an input bounded by $x_{\max}$ is $x_{\max}\sum_n |h[n]|$; the less conservative one, valid for narrowband inputs, is $x_{\max}\max_\omega |H(e^{j\omega T})|$. Use the first for a signal that can contain a step, the second for one that cannot. A resonant section can have a peak gain of $10$ or more, and that factor has to be somewhere in the format.

**Round at every store, and check the bias.** Rounding costs one add and one shift and removes the $-q/2$ mean that truncation leaves. In any element with an integrator, that bias is not noise — it integrates.

::: note
On a processor with hardware floating point, single precision gives about $7$ decimal digits, which is $24$ bits of mantissa: better than any of the fixed-point formats above, and enough that the $200\,\mathrm{Hz}$ notch of the worked example is untouched. It is *not* enough at very high sample rates, and the binding limit is the filter state rather than the coefficients. In the $2\,\mathrm{kHz}$ table, $a_2 = 0.994615$ stored in single precision has a rounding error near $6\times10^{-8}$, giving a pole-radius error around $3\times10^{-8}$ and a decay-rate error of $6\times10^{-5}\,\mathrm{s^{-1}}$ out of $5.4$ — harmless.

The state arithmetic is the one to watch. A direct-form section at a high rate computes $y[n] \approx 2y[n-1] - y[n-2] + \cdots$, and the part of the answer that carries the dynamics is of relative size $(\omega_n T)^2$. Single precision resolves relative differences of $2^{-24} = 6.0\times10^{-8}$. For a $1\,\mathrm{Hz}$ mode, $(\omega_n T)^2$ is $9.9\times10^{-4}$ at $200\,\mathrm{Hz}$ and $4.0\times10^{-5}$ at $1\,\mathrm{kHz}$ — both far above the floor — but $4.0\times10^{-7}$ at $10\,\mathrm{kHz}$, only a factor of seven clear, and $4.0\times10^{-9}$ at $100\,\mathrm{kHz}$, where the dynamics are entirely below the rounding. Double precision pushes the problem out of reach for any realistic rate, at the cost of memory and, on some targets, speed. The point is that floating point moves the threshold, it does not remove it.
:::

## Check yourself

::: check
A gimbal command goes out through a $12$-bit converter spanning $\pm 6^\circ$. The control effectiveness is $4.75\,\mathrm{rad/s^2}$ of vehicle angular acceleration per radian of gimbal deflection. What angular acceleration does one LSB produce, and what does that imply for the pointing the loop can hold?
:::

::: answer
The step is $q_u = 12^\circ/4096 = 2.930\times10^{-3}\,{}^\circ = 5.113\times10^{-5}\,\mathrm{rad}$.

One LSB of gimbal is $4.75 \times 5.113\times10^{-5} = 2.429\times10^{-4}\,\mathrm{rad/s^2}$ of angular acceleration. Over a single $20\,\mathrm{ms}$ frame that changes the body rate by $4.86\times10^{-6}\,\mathrm{rad/s}$, which is $2.8\times10^{-4}\,{}^\circ/\mathrm{s}$.

The implication is that the command resolution is not the limiting factor for pointing: a rate granularity of $3\times10^{-4}\,{}^\circ/\mathrm{s}$ per frame is far below the gyro's own quantization of $9.2\times10^{-3}\,{}^\circ/\mathrm{s}$ computed earlier, and far below the vehicle's disturbance environment. The correct conclusion is to look elsewhere — at the sensor, at the actuator's own mechanical resolution and backlash, and at structural response — before adding bits to the command converter. Getting this ordering right is most of what a word-length analysis is for.
:::

::: check
Why does truncation behave so much worse than rounding inside an integrator, and how large is the effect in a $100\,\mathrm{Hz}$ loop with $\mathrm{Q}15$ arithmetic?
:::

::: answer
Rounding produces a zero-mean error, so an integrator accumulates a random walk: the state's standard deviation after $n$ samples grows as $\sigma_q\sqrt{n}$, slowly and without a preferred direction. Truncation produces an error with mean $-q/2$, so the integrator accumulates a *deterministic ramp*, $-q n/2$, which grows linearly and always in the same direction.

At $q = 2^{-15} = 3.052\times10^{-5}$ and $f_s = 100\,\mathrm{Hz}$, the drift is $q f_s/2 = 1.526\times10^{-3}$ of full scale per second — about $0.15\%$ per second, $9\%$ per minute. An integrator state drifting to full scale in about eleven minutes is indistinguishable at the vehicle from a real, slowly growing bias, and it will be chased by whatever outer loop sits above it.

The random-walk case over the same eleven minutes reaches about $\sigma_q\sqrt{66000} = 2.3\times10^{-3}$ of full scale, more than two orders of magnitude smaller and with no preferred sign. Rounding costs one instruction.
:::

::: check
A filter coefficient set is validated in double precision on the ground and then compiled for a target that uses single precision. What would you check before accepting that the validation still applies?
:::

::: answer
Three things, in order of how likely they are to bite.

First, where the poles are. Compute the poles from the single-precision coefficients and compare $\zeta$ and $\omega_n$ against the design, not the coefficients against each other. A relative coefficient change of $10^{-7}$ can be a relative pole change of much more, by the sensitivity formula, when the poles are clustered — which is decided by $\omega_n T$, so the question is really "how fast is this loop relative to its dynamics".

Second, the state arithmetic, not only the coefficients. A direct-form section at a high rate computes $y[n]$ as the small residue of a near-cancellation, and single precision has $24$ bits of mantissa to give to it. This is where a cascade of biquads, or the delta form of the next lesson, earns its place.

Third, the DC gain and any other exactly-known property. $H(1) = \sum b/(1 + \sum a)$ should still be $1.000000$ to the precision the design demands; a notch whose DC gain has drifted to $1.03$ has a coefficient problem whatever the poles say.

If the loop is slow relative to its sample rate — say $\omega_n T$ above $0.05$ — single precision is very unlikely to matter and the checks will confirm it in minutes. If $\omega_n T$ is below $0.005$, expect to find something.
:::

::: check
An engineer reports that a rate filter "sticks" at a small non-zero value after the vehicle stops moving, and never returns to zero. Diagnose it, and give the number that confirms the diagnosis.
:::

::: answer
That is a quantization limit cycle in the filter's own recursion. With $y[n] = Q(a\,y[n-1] + (1-a)x[n])$ and $x = 0$, the state persists at any value satisfying $|a y - y| \le q/2$, that is $|y| \le q/(2(1-a))$. Inside that band the rounding returns the same number every frame and the state never decays.

The confirming number is the band itself. Read $a$ from the filter — or compute it from the time constant, $a = e^{-T/\tau}$ — and $q$ from the arithmetic format, and check whether the reported stuck value is at or below $q/(2(1-a))$. For a $\tau = 0.5\,\mathrm{s}$ filter at $200\,\mathrm{Hz}$, $a = e^{-0.01} = 0.99005$ and with $\mathrm{Q}15$ the band is $3.052\times10^{-5}/(2 \times 0.00995) = 1.53\times10^{-3}$, about $50$ LSBs. If the stuck value sits inside that, the diagnosis is confirmed and the remedies are more fraction bits, a faster pole, or an explicit flush of the state to zero when the input has been below a threshold for a set number of frames.

If the stuck value is much *larger* than the band, look elsewhere: a saturated accumulator that has not been released, a windup, or a sensor bias.
:::

::: check
Why is the conservative overflow bound $x_{\max}\sum_n |h[n]|$ rather than $x_{\max}\max_\omega |H|$, and when would you use each?
:::

::: answer
The sum of the absolute impulse response is the worst-case gain over *all* bounded inputs: the input that achieves it is the one whose sign matches $h[-n]$ at every step, so every term of the convolution adds. No input bounded by $x_{\max}$ can produce more than $x_{\max}\sum|h[n]|$, and some input produces exactly that. It is the true bound, and it can never be exceeded.

The peak of the frequency response is the worst-case gain over *sinusoidal* inputs only. It is smaller — often much smaller for a resonant section — and it is what the signal actually reaches if the input is narrowband and has had time to settle.

Use the sum bound where an input can contain a step or an impulse: a command path, a mode change, a fault injection, the first frame after initialisation. Use the frequency-response bound where the input is genuinely narrowband and bounded by physics, such as a structural-mode signal from an accelerometer, and where the cost of the extra headroom in bits is not affordable. Whichever you choose, say which one you used in the same comment that gives the Q format, because the next person to change a coefficient will need to redo the calculation.
:::

## Summary

| Item | Statement |
| --- | --- |
| Uniform quantizer | Step $q$; with rounding the error is zero-mean, uniform, variance $q^2/12$ |
| Truncation | Mean $-q/2$: a drift, not a noise. In an integrator it ramps at $qf_s/2$ per second |
| Converter SNR | $6.02N + 1.76\,\mathrm{dB}$ at full scale, for an $N$-bit converter |
| Noise density | $\sigma_q\sqrt{2T}$ per $\sqrt{\mathrm{Hz}}$ — compare it against the sensor's own noise before tuning |
| Derivative amplification | $2\sigma_q^2/T^2$ for a raw difference; $\sigma_q N\sqrt{(1+a)/2}$ with $a = e^{-NT}$ when filtered at $N$ |
| Dead band | A correction smaller than one actuator LSB produces nothing; steady error bounded by $q_u/(2k)$ |
| Limit cycle | First-order band $\lvert y\rvert \le q/(2(1-\lvert a\rvert))$: $5$ LSBs at $a = 0.9$, $500$ at $a = 0.999$ |
| Coefficient sensitivity | $\partial z_i/\partial a_k = -z_i^{N-k}/\prod_{j\ne i}(z_i - z_j)$ — clustered roots are fragile |
| $\mathrm{Q}m.n$ | Stored integer $I$ means $I\cdot 2^{-n}$; $\mathrm{Q}15$ resolves $3.05\times10^{-5}$ over $[-1, 1)$ |
| Fixed-point rules | Accumulate at double width, round once; saturate, never wrap; bound every node before choosing a format |
| Floating point | Single precision has $24$ mantissa bits: ample at $200\,\mathrm{Hz}$, marginal at $100\,\mathrm{kHz}$ |

The next lesson uses all of this. A PID can be written in several algebraically identical forms, and they behave very differently once the arithmetic is finite — which is how the choice between direct, parallel and delta forms becomes an engineering decision rather than a matter of taste.
