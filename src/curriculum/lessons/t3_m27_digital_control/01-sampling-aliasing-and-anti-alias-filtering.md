---
id: l01-sampling-aliasing-anti-alias
title: Sampling, aliasing and the anti-alias filter
minutes: 22
covers:
  - 'Sampling and the Nyquist-Shannon theorem; aliasing and anti-alias filtering'
---

Everything you built in the signals and systems module, and everything you tuned in the classical feedback control design module, lives in continuous time. The plant genuinely does: a launch vehicle's pitch dynamics evolve every instant, and so does the gimbal actuator driving them. The controller does not. It is a routine on a flight computer that wakes on a timer interrupt, reads whatever number the analog-to-digital converter latched, runs a fixed sequence of multiplies and adds, writes one number to a digital-to-analog converter, and goes back to sleep. Between those wakings it knows nothing and does nothing.

That gap is where this module lives. This first lesson deals with the front door: what the act of measuring a continuous signal at discrete instants does to the information in it. The answer is not "nothing, if you sample fast enough". It is that sampling folds every frequency above half the sample rate down into the band below it, permanently, and no amount of software downstream can unfold it. A structural bending mode at $47\,\mathrm{Hz}$ read by a $50\,\mathrm{Hz}$ attitude loop does not appear as a $47\,\mathrm{Hz}$ disturbance the controller can ignore. It appears as a $3\,\mathrm{Hz}$ disturbance in the middle of the control band, indistinguishable from real vehicle motion, and the loop will dutifully fight it.

The defence is an analog filter in front of the converter. Sizing that filter is a real engineering trade, because the filter also eats phase inside the control band — the same phase you spent the previous module protecting. This lesson sets up the arithmetic of folding, states the sampling theorem precisely enough to see what it does and does not promise, and then works the anti-alias trade with numbers.

## Sampling: notation and the one modelling idea

A sampler produces the sequence

$$
x[n] = x(nT), \qquad n = 0, 1, 2, \ldots
$$

from the continuous signal $x(t)$. $T$ is the **sample period** in seconds, $f_s = 1/T$ the **sample rate** in hertz, and $\omega_s = 2\pi/T$ the sample rate in radians per second. Half the sample rate,

$$
f_N = \frac{f_s}{2} = \frac{1}{2T},
$$

is the **Nyquist frequency**: the highest frequency a sequence sampled at $f_s$ can represent. A $50\,\mathrm{Hz}$ control loop has $T = 20\,\mathrm{ms}$ and $f_N = 25\,\mathrm{Hz}$.

The square brackets are a convention worth keeping: $x[n]$ is a sequence indexed by integer $n$, $x(t)$ a function of continuous $t$. Flight code manipulates only the former.

To see what sampling does in the frequency domain, model the sampler as multiplication by an impulse train, $p(t) = \sum_{k} \delta(t - kT)$. This is a modelling device, not a physical claim — no converter emits impulses — but it gets the spectrum right, and the spectrum is what we are after. The impulse train is periodic with period $T$, so it has a Fourier series, and every one of its coefficients is $1/T$:

$$
p(t) = \frac{1}{T}\sum_{k=-\infty}^{\infty} e^{\,j 2\pi k f_s t}.
$$

Multiplying $x(t)$ by that sum and transforming term by term, each exponential shifts the spectrum by $k f_s$:

$$
X_s(f) = \frac{1}{T}\sum_{k=-\infty}^{\infty} X(f - k f_s).
$$

That single line is the whole subject. **Sampling replicates the spectrum at every multiple of the sample rate.** If $X(f)$ occupies only $|f| < f_N$, the copies sit side by side and never touch, and the original is recoverable by keeping the $k = 0$ copy and discarding the rest. If $X(f)$ extends past $f_N$, the copies overlap, and in the overlap region the sum of two different signals is all that remains. Addition is not invertible. The information is gone.

## The Nyquist-Shannon theorem, and what it does not say

> **Sampling theorem.** If $x(t)$ contains no energy at or above $f_N = f_s/2$, then $x(t)$ is exactly recoverable from its samples $x[n] = x(nT)$, by
> $$
> x(t) = \sum_{n=-\infty}^{\infty} x[n]\,\frac{\sin\!\big(\pi (t - nT)/T\big)}{\pi (t - nT)/T}.
> $$

The reconstruction formula is the inverse transform of "keep the $k = 0$ copy": an ideal brick-wall low-pass filter has a sinc impulse response, and filtering the impulse train with it interpolates between the samples. It is not something you can implement — the sinc has infinite support in both directions, so it is neither causal nor finite — but it is the statement of what the samples contain.

Read the theorem's conditions carefully, because both of them bite.

It requires strictly *no* energy at or above $f_N$, not "not much". A sine at exactly $f_N$ is the counterexample: sampling $\sin(2\pi f_N t)$ at $f_s$ gives $\sin(\pi n) = 0$ for every $n$. The samples are identically zero and the amplitude is unrecoverable. Real signals are never strictly band-limited, so the practical statement is that the energy above $f_N$ must be small enough not to matter, and "small enough" is a number you have to choose.

And it is a statement about *recovering a signal*, not about *controlling a plant*. A loop closed around a sampler needs phase margin at crossover, and the sampling process costs phase that has nothing to do with whether the signal could in principle be reconstructed. Sampling a $2\,\mathrm{Hz}$ command at $5\,\mathrm{Hz}$ satisfies the theorem and produces an unflyable loop. The rate you actually pick comes out of a phase budget — a later lesson in this module builds that budget and lands on 20 to 40 times the closed-loop bandwidth, one to two orders of magnitude above what Nyquist alone demands.

::: key
**Nyquist-Shannon sampling theorem.** A signal band-limited to $f_{\max}$ is recoverable only if sampled above $2 f_{\max}$. For closed-loop *control* this is far too loose; use 20 to 40 times the closed-loop bandwidth.
:::

## Where a frequency lands after sampling

When content above $f_N$ is present, the copies overlap and a tone at $f$ shows up somewhere else. To find where, take the replication formula: the copy centred at $k f_s$ puts the tone at $f - k f_s$, and the one value of that family lying in $[0, f_N]$ is what the sequence looks like. Choosing $k$ as the nearest integer to $f/f_s$,

$$
f_a = \left| f - \mathrm{round}\!\left(\frac{f}{f_s}\right) f_s \right| .
$$

A tone below $f_N$ maps to itself, as it must. Above it, the frequency axis folds back and forth at every multiple of $f_N$ like a ribbon, which is why $f_a$ is called the **folded** or **aliased** frequency.

| Tone | Sampled at | Appears at |
| --- | --- | --- |
| $2\,\mathrm{Hz}$ | $100\,\mathrm{Hz}$ | $2\,\mathrm{Hz}$ |
| $60\,\mathrm{Hz}$ | $100\,\mathrm{Hz}$ | $40\,\mathrm{Hz}$ |
| $60\,\mathrm{Hz}$ | $50\,\mathrm{Hz}$ | $10\,\mathrm{Hz}$ |
| $120\,\mathrm{Hz}$ | $100\,\mathrm{Hz}$ | $20\,\mathrm{Hz}$ |
| $47\,\mathrm{Hz}$ | $50\,\mathrm{Hz}$ | $3\,\mathrm{Hz}$ |
| $250\,\mathrm{Hz}$ | $200\,\mathrm{Hz}$ | $50\,\mathrm{Hz}$ |

Two features of that table matter operationally. Content immediately below a multiple of $f_s$ lands at a very *low* frequency — the $47\,\mathrm{Hz}$ row is the dangerous one, because $47$ is close to $50$ and the difference is small. And halving the sample rate does not halve the problem, it moves it: $60\,\mathrm{Hz}$ went from $40\,\mathrm{Hz}$, safely above a typical control band, to $10\,\mathrm{Hz}$, inside one.

::: example A 47 Hz bending mode in a 50 Hz attitude loop
A launch vehicle's first lateral bending mode sits at $47\,\mathrm{Hz}$. The rate gyro is bolted to the forward skirt, where the mode has good observability, and the attitude control task runs at $f_s = 50\,\mathrm{Hz}$, so $f_N = 25\,\mathrm{Hz}$.

The mode is above Nyquist, so it folds: $\mathrm{round}(47/50) = 1$ and $f_a = |47 - 50| = 3\,\mathrm{Hz}$.

Check it directly against the sample values. With $T = 0.02\,\mathrm{s}$, a unit-amplitude mode $\sin(2\pi \cdot 47 \cdot nT)$ has $47nT = 0.94n$ cycles per sample, and $0.94n = n - 0.06n$, so each sample equals $\sin(2\pi n - 2\pi \cdot 0.06 n) = -\sin(2\pi \cdot 3 \cdot nT)$:

```python
import numpy as np

fs = 50.0                                # Hz, the attitude loop rate
n = np.arange(12)
t = n / fs
mode = np.sin(2 * np.pi * 47.0 * t)      # 47 Hz bending mode at the gyro
fold = -np.sin(2 * np.pi * 3.0 * t)      # what the flight computer sees

print(np.max(np.abs(mode - fold)))       # 5.495603971894525e-15
print(np.round(mode, 4))
# [ 0.     -0.3681 -0.6845 -0.9048 -0.998  -0.9511 -0.7705 -0.4818 -0.1253
#   0.2487  0.5878  0.8443]
```

The two sequences agree to floating-point round-off. The printed samples rise and fall over about 17 samples, a $3\,\mathrm{Hz}$ oscillation, with the sign of the mode inverted along the way.

Now consider what the controller does with it. Rigid-body attitude bandwidth on a vehicle like this is around $1\,\mathrm{Hz}$, and the loop still has substantial gain at $3\,\mathrm{Hz}$. The controller sees a $3\,\mathrm{Hz}$ oscillation in measured rate, believes the vehicle is oscillating, and commands gimbal deflection at $3\,\mathrm{Hz}$ to oppose it. Those commands excite the structure, the structure feeds the gyro, and the loop is closed around a signal that is not the state it thinks it is. Whether this diverges depends on the relative phase, and you cannot design for it: the analysis tools from the classical control module assume a linear time-invariant loop, and folding is not an operation any transfer function performs.

Note also what makes this hard to catch in test. A $3\,\mathrm{Hz}$ oscillation on the telemetry looks exactly like a real low-frequency control problem. The natural response — retune the gains, add damping at $3\,\mathrm{Hz}$ — changes the symptom without touching the cause, and moves the failure to the next vehicle whose mode sits at $46\,\mathrm{Hz}$ instead.
:::

::: warning
Aliasing happens at the sampler and cannot be undone afterwards. Once the $47\,\mathrm{Hz}$ mode and a genuine $3\,\mathrm{Hz}$ vehicle motion have been added together into one number per frame, no digital filter, no higher-rate task, no smarter estimator can separate them, because the sequence does not contain the information. A notch at $47\,\mathrm{Hz}$ in flight software does nothing at all: after sampling there is no energy at $47\,\mathrm{Hz}$ left to notch. The fix has to sit upstream of the converter, in analog hardware.
:::

## Anti-alias filtering

The defence follows straight from the theorem: remove the offending energy before the sampler. An **anti-alias filter** is an analog low-pass filter between the sensor and the analog-to-digital converter, sized so that everything that would fold into the control band is already attenuated when the sampling instant arrives.

The specification has two halves, pulling in opposite directions.

**Stopband.** Pick the frequencies that fold into the band you care about, and the attenuation you need there. If the loop crosses over at $\omega_c$ and a mode at $f_m$ folds to somewhere near $\omega_c$, you want the sensor's response at $f_m$ small enough that the folded signal is below the sensor noise floor, or at least far below the gain the loop has there. Twenty decibels — a factor of ten — is a common starting point; forty if the mode is well excited.

**Passband.** The filter is inside the loop, so its phase lag at crossover comes straight out of your phase margin. This is the whole difficulty. A filter that attenuates hard at $60\,\mathrm{Hz}$ has its corner somewhere below $60\,\mathrm{Hz}$, and a corner anywhere within a decade of crossover costs real phase.

For a second-order Butterworth low-pass with corner $f_c$, writing $r = f/f_c$,

$$
|H(f)| = \frac{1}{\sqrt{1 + r^4}}, \qquad
\angle H(f) = -\arctan\!\frac{\sqrt{2}\, r}{1 - r^2},
$$

where the arctangent is taken with attention to quadrant so the lag keeps growing past $r = 1$ rather than jumping. The magnitude expression inverts cleanly: to put a tone at $f_m$ down by a factor $A$,

$$
r^4 = A^2 - 1 \quad\Longrightarrow\quad f_c = \frac{f_m}{(A^2 - 1)^{1/4}} .
$$

::: example Sizing the anti-alias filter for a 100 Hz loop
A loop samples at $f_s = 100\,\mathrm{Hz}$ and commands at $2\,\mathrm{Hz}$. A $60\,\mathrm{Hz}$ vibration from a turbopump reaches the sensor and would fold to $|60 - 100| = 40\,\mathrm{Hz}$. Specify $20\,\mathrm{dB}$ of attenuation at $60\,\mathrm{Hz}$, that is $A = 10$, and find what it costs at $2\,\mathrm{Hz}$.

Second-order Butterworth: $f_c = 60/(100 - 1)^{1/4} = 60/99^{1/4} = 19.021\,\mathrm{Hz}$. At the command frequency, $r = 2/19.021 = 0.10514$, so

$$
|H(2\,\mathrm{Hz})| = \frac{1}{\sqrt{1 + 0.10514^4}} = 0.99994,
\qquad
\angle H = -\arctan\frac{\sqrt2 \cdot 0.10514}{1 - 0.10514^2} = -8.55^\circ .
$$

The magnitude is untouched — four nines — and the phase costs $8.55^\circ$. That is not a rounding error. Against a design target of $45^\circ$ phase margin it is a fifth of the budget, spent before the zero-order hold and the computational delay of the next two lessons have taken their share.

The instinct is to buy the phase back with a sharper filter, since a higher-order filter meets the same $60\,\mathrm{Hz}$ spec with a higher corner. Work it out. Each order is sized so that $|H(60\,\mathrm{Hz})| = 0.1$ exactly, then evaluated at $2\,\mathrm{Hz}$:

| Order | $f_c$ | lag at $2\,\mathrm{Hz}$ |
| --- | --- | --- |
| 1 | $6.03\,\mathrm{Hz}$ | $18.35^\circ$ |
| 2 | $19.02\,\mathrm{Hz}$ | $8.55^\circ$ |
| 3 | $27.90\,\mathrm{Hz}$ | $8.22^\circ$ |
| 4 | $33.78\,\mathrm{Hz}$ | $8.87^\circ$ |
| 6 | $40.91\,\mathrm{Hz}$ | $10.83^\circ$ |
| 8 | $45.02\,\mathrm{Hz}$ | $13.05^\circ$ |

Going from first to second order is worth having: $18.35^\circ$ down to $8.55^\circ$. After that the curve is flat and then rises. The reason is visible in the low-frequency slope of the phase, which is the group delay at DC, $\tau_0 = \sum_i 2\zeta_i/\omega_{c,i}$ summed over the pole pairs. A higher order lets you raise $\omega_c$, but it also adds pole pairs, and for a Butterworth the two effects very nearly cancel once you are past second order. Order 3 is the shallow minimum here, and nobody would build a third-order analog filter to save a third of a degree.

The useful conclusion is that for a fixed stopband requirement the passband delay is close to a fixed cost, set by *where the stopband is*, not by how sharp the skirt is. If $8.5^\circ$ is too expensive, the remedy is not a better filter — it is moving the sample rate, so that the folding frequency moves away from the disturbance and the corner can go up.
:::

## Oversample, then decimate

That last sentence is the standard architecture, and it is worth stating plainly because it looks like cheating.

Sample much faster than the control loop needs — say $1\,\mathrm{kHz}$ — with a gentle analog filter, then low-pass and decimate in software down to the $50\,\mathrm{Hz}$ control rate. At $1\,\mathrm{kHz}$ the analog filter only has to protect the band around $1\,\mathrm{kHz}$, so its corner can sit at $150\,\mathrm{Hz}$: a second-order Butterworth there gives $21\,\mathrm{dB}$ at $500\,\mathrm{Hz}$ and costs $1.08^\circ$ at $2\,\mathrm{Hz}$, against $8.55^\circ$ for the filter that had to protect a $100\,\mathrm{Hz}$ sampler.

The work of suppressing everything between $25\,\mathrm{Hz}$ and $500\,\mathrm{Hz}$ then falls to a digital filter running at $1\,\mathrm{kHz}$, before the decimation to $50\,\mathrm{Hz}$. This is legitimate — at $1\,\mathrm{kHz}$ that content is properly sampled, so a digital filter can act on it — and it is not free, because that filter has phase of its own. What you gain is control over the trade. Digital filter coefficients are exact, identical unit to unit, and stable over temperature and age, where an analog corner frequency built from real capacitors moves by several percent across the qualification range. And you can choose a linear-phase structure whose contribution is a pure transport delay of known size, which the controller design can account for exactly rather than approximately.

::: note
Most modern inertial sensors do this internally and tell you about it in the datasheet. A MEMS gyro running a $32\,\mathrm{kHz}$ sigma-delta front end with a configurable output data rate has an on-chip decimation filter, and the register that sets the "bandwidth" is choosing its corner. Read that part of the datasheet before choosing your loop rate: the sensor's internal filter is an element of your loop, with its own phase lag at crossover, and its group delay is sometimes specified and sometimes has to be measured.
:::

## Check yourself

::: check
A spacecraft reaction wheel runs at $6{,}000\,\mathrm{rpm}$ and its static imbalance produces a disturbance at the wheel's rotation frequency. The attitude loop samples at $10\,\mathrm{Hz}$. Where does that disturbance appear in the sampled data, and what happens as the wheel spins down to $5{,}940\,\mathrm{rpm}$?
:::

::: answer
$6{,}000\,\mathrm{rpm} = 100\,\mathrm{Hz}$, sampled at $10\,\mathrm{Hz}$. Since $\mathrm{round}(100/10) = 10$ and $100 - 10 \times 10 = 0$, the disturbance folds all the way to DC: it appears as a constant bias in the measurement, its size set by whatever phase the sampling instants happen to hit.

At $5{,}940\,\mathrm{rpm} = 99\,\mathrm{Hz}$, $\mathrm{round}(99/10) = 10$ and $f_a = |99 - 100| = 1\,\mathrm{Hz}$. So a one percent change in wheel speed moves the apparent disturbance from a DC bias to a $1\,\mathrm{Hz}$ oscillation sitting squarely in the control band. This is the characteristic signature of an aliased rotating-machinery disturbance: an apparent low-frequency wander whose frequency tracks a speed the attitude loop has no reason to care about. It is also why wheel-speed avoidance zones exist in spacecraft momentum management, and why the sampler needs an analog filter regardless.
:::

::: check
Your colleague proposes fixing an aliasing problem by running the same $50\,\mathrm{Hz}$ control law but averaging four consecutive $200\,\mathrm{Hz}$ ADC readings into each control sample. Does that help, and if so, why is it not the same as doing nothing?
:::

::: answer
It helps, and it is genuinely different from doing nothing, because the sampler now runs at $200\,\mathrm{Hz}$ rather than $50\,\mathrm{Hz}$. Only content near multiples of $200\,\mathrm{Hz}$ folds during acquisition; a $47\,\mathrm{Hz}$ mode is now below the $100\,\mathrm{Hz}$ Nyquist frequency and is captured honestly.

The four-sample average is then a digital anti-alias filter for the decimation from $200\,\mathrm{Hz}$ to $50\,\mathrm{Hz}$, and it is a weak one: a length-4 boxcar has nulls at $50\,\mathrm{Hz}$, $100\,\mathrm{Hz}$ and $150\,\mathrm{Hz}$ and a first sidelobe only about $11\,\mathrm{dB}$ down, so a $47\,\mathrm{Hz}$ mode, which happens to sit close to a null, is attenuated by $23\,\mathrm{dB}$, while a mode at $65\,\mathrm{Hz}$ gets only $12.5\,\mathrm{dB}$. A properly designed decimation filter does better, and more to the point does not depend on the mode landing near a null. But the important point stands: the analog filter still has to exist, now sized for the $200\,\mathrm{Hz}$ sampler instead of the $50\,\mathrm{Hz}$ one, which is exactly the oversample-and-decimate trade and lets its corner sit three or four times higher for a fraction of the phase cost.
:::

::: check
A first-order analog RC filter with corner $f_c$ is proposed as the anti-alias filter in front of a $200\,\mathrm{Hz}$ sampler, to put a $250\,\mathrm{Hz}$ tone $26\,\mathrm{dB}$ down. Where would the tone have folded, what corner frequency does the specification require, and what does it cost at a $3\,\mathrm{Hz}$ crossover?
:::

::: answer
Folding first: $\mathrm{round}(250/200) = 1$, so $f_a = |250 - 200| = 50\,\mathrm{Hz}$. Above the control band but not by much, and inside the range where a structural model is uncertain, so suppress it.

$26\,\mathrm{dB}$ is a factor $A = 10^{26/20} = 19.95$. A first-order filter has $|H| = 1/\sqrt{1 + r^2}$, so $r = \sqrt{A^2 - 1} = 19.93$ and $f_c = 250/19.93 = 12.54\,\mathrm{Hz}$.

At $3\,\mathrm{Hz}$ the lag is $\arctan(3/12.54) = 13.4^\circ$, and the magnitude is $1/\sqrt{1 + (3/12.54)^2} = 0.973$, a $2.7\%$ gain reduction. Thirteen degrees at crossover from the anti-alias filter alone is too much for most designs; a second-order filter meeting the same spec has $f_c = 250/(A^2-1)^{1/4} = 250/4.464 = 56.0\,\mathrm{Hz}$ and costs $\arctan(\sqrt2 \cdot 0.0536 / (1 - 0.0536^2)) = 4.34^\circ$. This is the same conclusion as the worked example, in the direction that matters: going from first to second order is almost always worth the parts.
:::

::: check
Explain why sampling a sine wave at exactly twice its frequency does not satisfy the sampling theorem, and give the sample values that demonstrate it.
:::

::: answer
The theorem requires no energy *at or above* $f_N$, and a tone at exactly $f_N$ is at the boundary. Take $x(t) = \sin(2\pi f_N t)$ sampled at $f_s = 2 f_N$, so $T = 1/(2 f_N)$ and $x[n] = \sin(2\pi f_N \cdot n/(2 f_N)) = \sin(\pi n) = 0$ for every $n$. Every sample is zero regardless of the amplitude, so the amplitude cannot be recovered.

The phase is what makes it vivid: had the tone been a cosine instead, the samples would alternate $+1, -1, +1, \ldots$ at full amplitude. The same frequency, sampled at the same rate, gives everything or nothing depending on where the sampling instants land relative to the waveform. This is why the practical rule leaves margin, and why "sample at twice the highest frequency" is a theoretical boundary rather than a design rule.
:::

::: check
A gyro datasheet offers output data rates of $100\,\mathrm{Hz}$, $200\,\mathrm{Hz}$ and $400\,\mathrm{Hz}$, each with an internal digital low-pass whose corner is one fifth of the output rate. Your control loop runs at $100\,\mathrm{Hz}$ and crosses over at $4\,\mathrm{Hz}$. Which output rate would you configure, and what do you still have to check?
:::

::: answer
Configure $400\,\mathrm{Hz}$ and decimate in software, or take the $400\,\mathrm{Hz}$ stream and run the control law on every fourth sample after your own filter. The reason is the internal corner: at a $100\,\mathrm{Hz}$ output rate it sits at $20\,\mathrm{Hz}$, and a second-order response with a $20\,\mathrm{Hz}$ corner costs about $\arctan(\sqrt2 \cdot 0.2/(1 - 0.04)) = 16.4^\circ$ at $4\,\mathrm{Hz}$ — a third of a typical phase-margin budget, spent inside the sensor. At $400\,\mathrm{Hz}$ the corner is at $80\,\mathrm{Hz}$ and the same expression gives $4.05^\circ$.

What you still have to check is what protects the $400\,\mathrm{Hz}$ sampler, and what you do between $400\,\mathrm{Hz}$ and your $100\,\mathrm{Hz}$ control rate. The sensor's own analog front end handles the first, and the datasheet should state the attenuation near the sampling clock. The second is yours: content between $50\,\mathrm{Hz}$ and $200\,\mathrm{Hz}$ folds when you decimate, so your software decimation filter has to attenuate it, and its phase at $4\,\mathrm{Hz}$ goes into the same budget. The gain is that you now choose that filter, with exact coefficients, rather than inheriting whatever the sensor vendor shipped.
:::

## Summary

| Item | Statement |
| --- | --- |
| Sample period, rate | $T$ in seconds, $f_s = 1/T$ in hertz, $\omega_s = 2\pi/T$ in $\mathrm{rad/s}$ |
| Nyquist frequency | $f_N = f_s/2$: the highest frequency a sequence at $f_s$ can represent |
| Sampling in frequency | $X_s(f) = \frac{1}{T}\sum_k X(f - k f_s)$ — the spectrum replicates at every multiple of $f_s$ |
| Sampling theorem | No energy at or above $f_s/2$ makes $x(t)$ exactly recoverable, by sinc interpolation of the samples |
| For control | Nyquist is far too loose; use 20 to 40 times the closed-loop bandwidth |
| Aliased frequency | $f_a = \lvert f - \mathrm{round}(f/f_s)\,f_s \rvert$; $60\,\mathrm{Hz}$ at $100\,\mathrm{Hz}$ appears at $40\,\mathrm{Hz}$ |
| Irreversibility | Folding is addition of overlapping spectra; no software downstream can undo it |
| Anti-alias filter | Analog, before the converter. Stopband set by what folds into the control band; passband cost is phase at crossover |
| Second-order Butterworth | $\lvert H \rvert = 1/\sqrt{1 + r^4}$, lag $= \arctan\big(\sqrt2 r/(1 - r^2)\big)$, $r = f/f_c$; $f_c = f_m/(A^2-1)^{1/4}$ for attenuation $A$ at $f_m$ |
| Order versus phase | For a fixed stopband spec, passband lag barely improves past second order and then worsens |
| Oversample and decimate | Fast sampler, gentle analog filter, digital decimation filter with exact, repeatable coefficients |

The next lesson takes the other end of the loop. Having sampled the measurement, the controller must put a command *out*, and it does so by holding one number constant until the next frame. That hold has a frequency response, and its phase is the first entry in the digital phase budget this lesson began.
