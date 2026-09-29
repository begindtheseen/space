---
id: l01-sampling-aliasing-anti-alias
title: Sampling, aliasing and the anti-alias filter
minutes: 22
covers:
  - 'Sampling and the Nyquist-Shannon theorem; aliasing and anti-alias filtering'
---

Everything you tuned in the classical control module lived in continuous time. The plant really does: a rocket's pitch changes every instant, and so does the gimbal that steers it. The controller does not. It is a routine on a flight computer. A timer wakes it up. It reads the number the **[[analog-to-digital converter|adc]]** (the chip that turns a sensor voltage into a number) grabbed, runs a fixed list of multiplies and adds, writes one number out, and goes back to sleep. Between wake-ups it knows nothing.

That gap is what this module is about. This first lesson looks at the front door: what happens to a signal when you only look at it at separate instants. You have seen the effect in movies, where **[[wagon wheels|wagon-wheel]]** seem to spin slowly backward. The camera takes pictures at a fixed rate, and a fast wheel fools it.

A flight computer is fooled the same way. A bending mode of the rocket's body at $47\,\mathrm{Hz}$, read by a $50\,\mathrm{Hz}$ attitude loop, does not show up at $47\,\mathrm{Hz}$. It shows up at $3\,\mathrm{Hz}$ — right in the middle of the control band, looking exactly like real vehicle motion. The loop will fight it. And no software written afterwards can undo the mix-up. The defense is an analog filter in front of the converter, and sizing it is a real trade, because that filter also costs phase inside the control band.

## Sampling: the words and the one big idea

A **sampler** reads a continuous signal $x(t)$ at evenly spaced instants and produces a list of numbers:

$$
x[n] = x(nT), \qquad n = 0, 1, 2, \ldots
$$

Read $x[n]$ as "x of n". The square brackets say it is a **sequence** — a numbered list — while $x(t)$ with round brackets is a function of continuous time. Flight code only ever handles the first kind.

- $T$ is the **sample period**: the time between readings, in seconds.
- $f_s = 1/T$ ("f sub s") is the **sample rate** in hertz, readings per second.
- $\omega_s = 2\pi/T$ is the same rate in radians per second.

Half the sample rate gets its own name, the **Nyquist frequency**:

$$
f_N = \frac{f_s}{2} = \frac{1}{2T}.
$$

It is the highest frequency a list of samples at $f_s$ can represent. A $50\,\mathrm{Hz}$ control loop has $T = 20\,\mathrm{ms}$ and $f_N = 25\,\mathrm{Hz}$.

Now the big idea. Think of a signal's **spectrum** — how much of each frequency it contains — as a hill drawn on a frequency axis. Sampling makes copies of that hill. One copy sits at zero, one at $f_s$, one at $2f_s$, one at $-f_s$, and so on forever:

$$
X_s(f) = \frac{1}{T}\sum_{k=-\infty}^{\infty} X(f - k f_s).
$$

Here $X(f)$ is the original spectrum and $X_s(f)$ the spectrum of the samples. The sum over $k$ lists the copies, each shifted by $k f_s$.

That one line is the whole subject. **Sampling [[replicates the spectrum|spectrum-copies]] at every multiple of the sample rate.** If the hill is narrow — all of it below $f_N$ — the copies sit side by side and never touch. Keep the copy at zero, throw away the rest, and you have the original back. If the hill is wider than $f_N$, the copies overlap. Where they overlap, all that is left is the *sum* of two different signals. You cannot un-add two numbers when you only know their total. The information is gone.

::: note Why it has to be true
Model the sampler as multiplying $x(t)$ by an **[[impulse train|impulse-train]]**, $p(t) = \sum_k \delta(t - kT)$: a row of infinitely thin spikes, one every $T$ seconds. No converter emits spikes; this is a bookkeeping device, and it gets the spectrum right.

The impulse train repeats every $T$, so it has a Fourier series, and every coefficient works out to $1/T$:

$$
p(t) = \frac{1}{T}\sum_{k=-\infty}^{\infty} e^{\,j 2\pi k f_s t}.
$$

Multiply $x(t)$ by this sum and transform term by term. Multiplying by $e^{j2\pi k f_s t}$ slides a spectrum over by $k f_s$. So each term contributes one shifted copy $X(f - k f_s)$, scaled by $1/T$ — which is the replication formula.
:::

## The Nyquist-Shannon theorem, and what it does not say

The **[[Nyquist-Shannon|names]] sampling theorem** makes the "narrow hill" case exact.

> **Sampling theorem.** If $x(t)$ contains no energy at or above $f_N = f_s/2$, then $x(t)$ is exactly recoverable from its samples $x[n] = x(nT)$, by
> $$
> x(t) = \sum_{n=-\infty}^{\infty} x[n]\,\frac{\sin\!\big(\pi (t - nT)/T\big)}{\pi (t - nT)/T}.
> $$

The recipe is "keep the copy at zero". A perfect low-pass filter does that, and its response to one spike is the **[[sinc|sinc-name]]** shape $\sin(u)/u$. So each sample gets a sinc bump centered on it, and the bumps add up to the original signal between the samples. You can never build this. The sinc stretches forever in both directions, so it would need samples from the future. But it tells you exactly what the samples contain.

Read the conditions carefully, because both of them bite.

First, it needs strictly *no* energy at or above $f_N$ — not "not much". A sine at exactly $f_N$ breaks it. Sampling $\sin(2\pi f_N t)$ at $f_s$ gives $\sin(\pi n) = 0$ for every $n$. Every sample is zero, whatever the amplitude. Real signals are never perfectly band-limited, so in practice the energy above $f_N$ must be *small enough not to matter* — and "small enough" is a number you must choose.

Second, it is about *recovering a signal*, not *controlling a plant*. A loop closed through a sampler needs phase margin, and sampling costs phase no matter whether the signal could in principle be rebuilt. Sampling a $2\,\mathrm{Hz}$ command at $5\,\mathrm{Hz}$ satisfies the theorem and gives an unflyable loop. A later lesson in this module builds the phase budget that sets the real rate: 20 to 40 times the closed-loop bandwidth, one or two orders of magnitude above what Nyquist alone asks for.

::: key
**Nyquist-Shannon sampling theorem.** A signal band-limited to $f_{\max}$ is recoverable only if sampled above $2 f_{\max}$. For closed-loop *control* this is far too loose; use 20 to 40 times the closed-loop bandwidth.
:::

## Where a frequency lands after sampling

When there *is* content above $f_N$, a tone at $f$ turns up somewhere else. Where? The copy at $k f_s$ puts it at $f - k f_s$. Exactly one member of that family lands between $0$ and $f_N$, and that is what the samples show. Pick $k$ as the whole number nearest to $f/f_s$:

$$
f_a = \left| f - \mathrm{round}\!\left(\frac{f}{f_s}\right) f_s \right| .
$$

Read it as "f alias is the distance from f to the nearest multiple of the sample rate". A tone below $f_N$ maps to itself, as it must. Above $f_N$, the frequency axis [[folds back and forth|folding-ribbon]] at every multiple of $f_N$, like a ribbon folded into a stack. So $f_a$ is called the **folded** or **aliased** frequency — an **alias** being a false name the signal goes by.

| Tone | Sampled at | Appears at |
| --- | --- | --- |
| $2\,\mathrm{Hz}$ | $100\,\mathrm{Hz}$ | $2\,\mathrm{Hz}$ |
| $60\,\mathrm{Hz}$ | $100\,\mathrm{Hz}$ | $40\,\mathrm{Hz}$ |
| $60\,\mathrm{Hz}$ | $50\,\mathrm{Hz}$ | $10\,\mathrm{Hz}$ |
| $120\,\mathrm{Hz}$ | $100\,\mathrm{Hz}$ | $20\,\mathrm{Hz}$ |
| $47\,\mathrm{Hz}$ | $50\,\mathrm{Hz}$ | $3\,\mathrm{Hz}$ |
| $250\,\mathrm{Hz}$ | $200\,\mathrm{Hz}$ | $50\,\mathrm{Hz}$ |

Two things in that table matter on a real vehicle. Content a little below a multiple of $f_s$ lands at a very *low* frequency: the $47\,\mathrm{Hz}$ row is the dangerous one, because $47$ is close to $50$. And halving the sample rate does not halve the problem, it moves it. $60\,\mathrm{Hz}$ went from $40\,\mathrm{Hz}$, safely above a typical control band, to $10\,\mathrm{Hz}$, inside one.

::: key
**Aliased frequency after sampling.** A tone at $f$ sampled at $f_s$ appears at $f_a = \lvert f - \mathrm{round}(f/f_s)\,f_s\rvert$. $60\,\mathrm{Hz}$ at $100\,\mathrm{Hz}$ sampling shows up at $40\,\mathrm{Hz}$. The fix must be an *analog* filter before the sampler; software cannot undo it.
:::

::: example A 47 Hz bending mode in a 50 Hz attitude loop
A launch vehicle's first sideways **bending mode** — the body flexing like a plucked ruler — rings at $47\,\mathrm{Hz}$. The rate gyro sits on the forward skirt, where it feels the mode strongly. The attitude task runs at $f_s = 50\,\mathrm{Hz}$, so $f_N = 25\,\mathrm{Hz}$.

**Fold it.** The mode is above Nyquist. $47/50 = 0.94$ rounds to $1$, so $f_a = |47 - 50| = 3\,\mathrm{Hz}$.

**Check it on the samples themselves.** With $T = 0.02\,\mathrm{s}$, the mode advances $47 \times 0.02 = 0.94$ of a cycle per sample. That is one whole cycle (invisible to the sampler) minus $0.06$ of a cycle. So each sample of $\sin(2\pi \cdot 47 \cdot nT)$ equals $\sin(2\pi n - 2\pi \cdot 0.06 n) = -\sin(2\pi \cdot 3 \cdot nT)$:

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

The two lists agree to rounding error. The printed samples rise and fall over about 17 samples ($50/3 \approx 16.7$), a $3\,\mathrm{Hz}$ wave, upside down. That matches the fold.

**What the controller does with it.** Rigid-body attitude bandwidth on a vehicle like this is around $1\,\mathrm{Hz}$, and the loop still has plenty of gain at $3\,\mathrm{Hz}$. It sees a $3\,\mathrm{Hz}$ wobble in measured rate, believes the vehicle is wobbling, and swings the gimbal at $3\,\mathrm{Hz}$ to oppose it. Those swings shake the structure, the structure shakes the gyro, and the loop is now closed around a signal that is not the state it thinks it is. Whether this grows depends on the relative phase, and you cannot design for it: the classical tools assume a linear time-invariant loop, and folding is not something any transfer function does.

**Why it is hard to catch.** A $3\,\mathrm{Hz}$ wobble in telemetry looks exactly like an ordinary control problem. The natural response — retune the gains, add damping at $3\,\mathrm{Hz}$ — treats the symptom and moves the failure to the next vehicle, whose mode sits at $46\,\mathrm{Hz}$.
:::

::: warning
Aliasing happens at the sampler and cannot be undone afterwards. Once the $47\,\mathrm{Hz}$ mode and a genuine $3\,\mathrm{Hz}$ motion are added into one number per frame, no digital filter, faster task or clever estimator can separate them — the samples do not contain the information. A notch at $47\,\mathrm{Hz}$ in flight software does nothing: after sampling there is no $47\,\mathrm{Hz}$ left to notch. The fix must sit before the converter, in analog hardware.
:::

## Anti-alias filtering

The defense follows straight from the theorem: remove the troublesome energy *before* the sampler. An **anti-alias filter** is an analog low-pass filter — one that passes slow signals and blocks fast ones — placed between the sensor and the converter. It is sized so that anything that would fold into the control band is already weak when the sample is taken.

Its specification has two halves, and they pull against each other.

**Stopband** — the frequencies to block. List the frequencies that would fold into the band you care about, and pick how much to cut them. You want the folded signal below the sensor's noise, or at least far below the loop's gain there. $20$ **[[decibels|decibels]]** — a factor of ten in amplitude — is a common start; $40$ if the mode is strongly excited.

**Passband** — the frequencies to keep. The filter sits inside the loop, so its phase lag at crossover (the frequency where the loop gain falls to 1) comes straight out of your phase margin. This is the whole difficulty. A filter that cuts hard at $60\,\mathrm{Hz}$ has its **corner** (the frequency where it starts cutting) below $60\,\mathrm{Hz}$. And a corner anywhere within a factor of ten of crossover costs real phase.

A common choice is the second-order **[[Butterworth|butterworth]]** low-pass, designed to be as flat as possible in the passband. With corner $f_c$, write $r = f/f_c$ for the frequency measured in corners. Then

$$
|H(f)| = \frac{1}{\sqrt{1 + r^4}}, \qquad
\angle H(f) = -\arctan\!\frac{\sqrt{2}\, r}{1 - r^2}.
$$

Take the arctangent with the quadrant in mind, so the lag keeps growing past $r = 1$ instead of jumping. The magnitude formula turns around neatly. To cut a tone at $f_m$ by a factor $A$, set $1/\sqrt{1+r^4} = 1/A$:

$$
r^4 = A^2 - 1 \quad\Longrightarrow\quad f_c = \frac{f_m}{(A^2 - 1)^{1/4}} .
$$

::: example Sizing the anti-alias filter for a 100 Hz loop
A loop samples at $f_s = 100\,\mathrm{Hz}$ and commands at $2\,\mathrm{Hz}$. A $60\,\mathrm{Hz}$ vibration from a turbopump reaches the sensor. It would fold to $|60 - 100| = 40\,\mathrm{Hz}$. Ask for $20\,\mathrm{dB}$ of cut at $60\,\mathrm{Hz}$, so $A = 10$, and find what it costs at $2\,\mathrm{Hz}$.

**Corner.** $A^2 - 1 = 99$, so $f_c = 60/99^{1/4} = 19.021\,\mathrm{Hz}$.

**At the command frequency.** $r = 2/19.021 = 0.10514$. Then

$$
|H(2\,\mathrm{Hz})| = \frac{1}{\sqrt{1 + 0.10514^4}} = 0.99994,
\qquad
\angle H = -\arctan\frac{\sqrt2 \cdot 0.10514}{1 - 0.10514^2} = -8.55^\circ .
$$

The size is untouched — four nines. The phase costs $8.55^\circ$. That is not a rounding error. Against a $45^\circ$ phase-margin target it is a fifth of the budget, spent before the zero-order hold and the computing delay (the next lessons) take their share.

**Would a sharper filter help?** A higher-order filter meets the same $60\,\mathrm{Hz}$ spec with a higher corner, so it is tempting. Size each order so that $|H(60\,\mathrm{Hz})| = 0.1$ exactly, then read its lag at $2\,\mathrm{Hz}$:

| Order | $f_c$ | lag at $2\,\mathrm{Hz}$ |
| --- | --- | --- |
| 1 | $6.03\,\mathrm{Hz}$ | $18.35^\circ$ |
| 2 | $19.02\,\mathrm{Hz}$ | $8.55^\circ$ |
| 3 | $27.90\,\mathrm{Hz}$ | $8.22^\circ$ |
| 4 | $33.78\,\mathrm{Hz}$ | $8.87^\circ$ |
| 6 | $40.91\,\mathrm{Hz}$ | $10.83^\circ$ |
| 8 | $45.02\,\mathrm{Hz}$ | $13.05^\circ$ |

First to second order is well worth it: $18.35^\circ$ down to $8.55^\circ$. After that the curve goes flat, then rises. The reason is the filter's delay at low frequency, its **[[group delay|group-delay]]** $\tau_0 = \sum_i 2\zeta_i/\omega_{c,i}$, summed over its pairs of poles ($\zeta_i$ is each pair's damping ratio, $\omega_{c,i}$ its corner). A higher order lets you raise the corner, but it adds pole pairs, and for a Butterworth the two effects nearly cancel past second order. Order 3 is the shallow best here, and nobody builds a third-order analog filter to save a third of a degree.

**Sanity check.** The first-order row has the lowest corner and the most lag, as it should: a gentle slope must start cutting early to be down tenfold by $60\,\mathrm{Hz}$.

The lesson: for a fixed stopband requirement, the passband delay is close to a fixed cost, set by *where the stopband is*, not by how steep the filter is. If $8.5^\circ$ is too much, the remedy is not a better filter. It is a different sample rate, so the folding frequency moves away from the disturbance and the corner can go up.
:::

## Oversample, then decimate

That last idea is the standard design, and it looks like cheating.

Sample much faster than the loop needs — say $1\,\mathrm{kHz}$ — behind a gentle analog filter. Then filter in software and **decimate** (keep only every $n$th sample) down to the $50\,\mathrm{Hz}$ control rate. At $1\,\mathrm{kHz}$ the analog filter only has to guard against content near $1\,\mathrm{kHz}$, so its corner can sit at $150\,\mathrm{Hz}$. A second-order Butterworth there gives $21\,\mathrm{dB}$ at $500\,\mathrm{Hz}$ and costs $1.08^\circ$ at $2\,\mathrm{Hz}$ — against $8.55^\circ$ for the filter guarding a $100\,\mathrm{Hz}$ sampler.

The job of removing everything between $25\,\mathrm{Hz}$ and $500\,\mathrm{Hz}$ then falls to a digital filter running at $1\,\mathrm{kHz}$, before decimating to $50\,\mathrm{Hz}$. That is legitimate: at $1\,\mathrm{kHz}$ that content is properly sampled, so software can act on it. It is not free — that filter has phase of its own. What you gain is control of the trade. Digital coefficients are exact, identical on every unit, and do not drift with temperature or age, while an analog corner built from real capacitors moves by several percent across the qualification range. And you can pick a linear-phase digital filter whose cost is a pure delay of known size, which the controller design can account for exactly.

::: note
Most modern inertial sensors do this inside the chip and say so in the datasheet. A MEMS gyro with a $32\,\mathrm{kHz}$ sigma-delta front end and a configurable output rate has an on-chip decimation filter, and the "bandwidth" register chooses its corner. Read that part of the datasheet before you choose your loop rate. The sensor's internal filter is an element of your loop, with its own phase lag at crossover. Its group delay is sometimes specified and sometimes has to be measured.
:::

## Check yourself

::: check
A spacecraft reaction wheel spins at $6{,}000\,\mathrm{rpm}$, and its imbalance shakes the spacecraft once per turn. The attitude loop samples at $10\,\mathrm{Hz}$. Where does that disturbance appear in the samples, and what happens as the wheel slows to $5{,}940\,\mathrm{rpm}$?
:::

::: answer
$6{,}000\,\mathrm{rpm}$ is $6{,}000/60 = 100\,\mathrm{Hz}$. Sampled at $10\,\mathrm{Hz}$: $\mathrm{round}(100/10) = 10$ and $100 - 10 \times 10 = 0$. The disturbance folds all the way to DC (zero frequency). It shows up as a constant bias, whose size depends on where in each turn the samples happen to land.

At $5{,}940\,\mathrm{rpm} = 99\,\mathrm{Hz}$: $\mathrm{round}(99/10) = 10$ and $f_a = |99 - 100| = 1\,\mathrm{Hz}$. A one percent change in wheel speed moves the apparent disturbance from a steady bias to a $1\,\mathrm{Hz}$ wobble squarely in the control band. That is the signature of aliased rotating machinery: a slow wander whose frequency tracks a speed the attitude loop has no reason to care about. It is one reason for wheel-speed **[[avoidance zones|wheel-zones]]** in momentum management, and why the sampler needs an analog filter regardless.
:::

::: check
A colleague proposes fixing an aliasing problem by keeping the $50\,\mathrm{Hz}$ control law but averaging four consecutive $200\,\mathrm{Hz}$ converter readings into each control sample. Does that help? If so, why is it not the same as doing nothing?
:::

::: answer
It helps, and it is truly different, because the sampler now runs at $200\,\mathrm{Hz}$ instead of $50\,\mathrm{Hz}$. Only content near multiples of $200\,\mathrm{Hz}$ folds during reading. A $47\,\mathrm{Hz}$ mode is now below the $100\,\mathrm{Hz}$ Nyquist frequency and is captured honestly.

The four-sample average is then a digital anti-alias filter for the step down from $200\,\mathrm{Hz}$ to $50\,\mathrm{Hz}$ — a weak one. A length-4 moving average has nulls (zero response) at $50$, $100$ and $150\,\mathrm{Hz}$, and its first sidelobe is only about $11\,\mathrm{dB}$ down. A $47\,\mathrm{Hz}$ mode happens to sit near a null and is cut by $23\,\mathrm{dB}$; a mode at $65\,\mathrm{Hz}$ is cut by only $12.5\,\mathrm{dB}$. A properly designed decimation filter does better and does not rely on luck. And the analog filter must still exist — now sized for the $200\,\mathrm{Hz}$ sampler, so its corner can sit three or four times higher for a fraction of the phase. That is the oversample-and-decimate trade.
:::

::: check
A first-order analog RC filter with corner $f_c$ is proposed in front of a $200\,\mathrm{Hz}$ sampler, to put a $250\,\mathrm{Hz}$ tone $26\,\mathrm{dB}$ down. Where would the tone have folded, what corner does the spec require, and what does it cost at a $3\,\mathrm{Hz}$ crossover?
:::

::: answer
**Fold.** $\mathrm{round}(250/200) = 1$, so $f_a = |250 - 200| = 50\,\mathrm{Hz}$. Above the control band, but not by much, and where structural models are shaky — so suppress it.

**Corner.** $26\,\mathrm{dB}$ is $A = 10^{26/20} = 19.95$. A first-order filter has $|H| = 1/\sqrt{1 + r^2}$, so $r = \sqrt{A^2 - 1} = 19.93$ and $f_c = 250/19.93 = 12.54\,\mathrm{Hz}$.

**Cost at $3\,\mathrm{Hz}$.** Lag $= \arctan(3/12.54) = 13.4^\circ$. Size $= 1/\sqrt{1 + (3/12.54)^2} = 0.973$, a $2.7\%$ gain loss. Thirteen degrees at crossover from the anti-alias filter alone is too much for most designs.

A second-order filter meeting the same spec has $f_c = 250/(A^2-1)^{1/4} = 250/4.464 = 56.0\,\mathrm{Hz}$ and costs $\arctan\!\big(\sqrt2 \cdot 0.0536 / (1 - 0.0536^2)\big) = 4.34^\circ$. Same conclusion as the worked example: going from first to second order is almost always worth the parts.
:::

::: check
Explain why sampling a sine wave at exactly twice its frequency does not satisfy the sampling theorem, and give the sample values that show it.
:::

::: answer
The theorem needs no energy *at or above* $f_N$, and a tone at exactly $f_N$ sits on the boundary. Take $x(t) = \sin(2\pi f_N t)$ sampled at $f_s = 2 f_N$, so $T = 1/(2 f_N)$ and

$$
x[n] = \sin\!\left(2\pi f_N \cdot \frac{n}{2 f_N}\right) = \sin(\pi n) = 0
$$

for every $n$. Every sample is zero whatever the amplitude, so the amplitude cannot be recovered.

Phase makes it vivid. Had the tone been a cosine, the samples would go $+1, -1, +1, \ldots$ at full size. Same frequency, same rate — everything or nothing, depending on where the sampling instants land. That is why "twice the highest frequency" is a theoretical boundary, not a design rule.
:::

::: check
A gyro datasheet offers output rates of $100\,\mathrm{Hz}$, $200\,\mathrm{Hz}$ and $400\,\mathrm{Hz}$, each with an internal digital low-pass whose corner is one fifth of the output rate. Your loop runs at $100\,\mathrm{Hz}$ and crosses over at $4\,\mathrm{Hz}$. Which output rate would you configure, and what must you still check?
:::

::: answer
Configure $400\,\mathrm{Hz}$ and decimate in software: filter the $400\,\mathrm{Hz}$ stream yourself and run the control law on every fourth sample. The reason is the internal corner. At a $100\,\mathrm{Hz}$ output rate it sits at $20\,\mathrm{Hz}$, and a second-order response with a $20\,\mathrm{Hz}$ corner costs $\arctan\!\big(\sqrt2 \cdot 0.2/(1 - 0.04)\big) = 16.4^\circ$ at $4\,\mathrm{Hz}$ — a third of a typical phase-margin budget, spent inside the sensor. At $400\,\mathrm{Hz}$ the corner is $80\,\mathrm{Hz}$ and the same formula gives $4.05^\circ$.

Still to check: what protects the $400\,\mathrm{Hz}$ sampler, and what happens between $400\,\mathrm{Hz}$ and your $100\,\mathrm{Hz}$ rate. The sensor's own analog front end handles the first; the datasheet should state its cut near the sampling clock. The second is yours: content between $50\,\mathrm{Hz}$ and $200\,\mathrm{Hz}$ folds when you decimate, so your software filter must cut it, and its phase at $4\,\mathrm{Hz}$ joins the same budget. The gain is that you choose that filter, with exact coefficients, instead of inheriting the vendor's.
:::

## Summary

| Item | Statement |
| --- | --- |
| Sample period, rate | $T$ in seconds, $f_s = 1/T$ in hertz, $\omega_s = 2\pi/T$ in $\mathrm{rad/s}$ |
| Nyquist frequency | $f_N = f_s/2$: the highest frequency samples at $f_s$ can represent |
| Sampling in frequency | $X_s(f) = \frac{1}{T}\sum_k X(f - k f_s)$ — copies of the spectrum at every multiple of $f_s$ |
| Sampling theorem | No energy at or above $f_s/2$ means $x(t)$ is exactly recoverable, by sinc interpolation |
| For control | Nyquist is far too loose; use 20 to 40 times the closed-loop bandwidth |
| Aliased frequency | $f_a = \lvert f - \mathrm{round}(f/f_s)\,f_s \rvert$; $60\,\mathrm{Hz}$ at $100\,\mathrm{Hz}$ appears at $40\,\mathrm{Hz}$ |
| Can't be undone | Folding adds overlapping spectra; no software downstream can separate them |
| Anti-alias filter | Analog, before the converter. Stopband set by what folds into the control band; cost is phase at crossover |
| Second-order Butterworth | $\lvert H \rvert = 1/\sqrt{1 + r^4}$, lag $= \arctan\big(\sqrt2 r/(1 - r^2)\big)$, $r = f/f_c$; $f_c = f_m/(A^2-1)^{1/4}$ for a cut of $A$ at $f_m$ |
| Order versus phase | For a fixed stopband spec, passband lag barely improves past second order, then worsens |
| Oversample and decimate | Fast sampler, gentle analog filter, then a digital filter with exact, repeatable coefficients |

The next lesson takes the other end of the loop. Having sampled the measurement, the controller must put a command *out*, and it does so by holding one number steady until the next frame. That hold has a frequency response, and its phase is the first entry in the digital phase budget this lesson started.

::: context adc Analog in, numbers out
A sensor like a gyro produces a voltage that moves smoothly. A computer can only store numbers. The **analog-to-digital converter**, or ADC, is the chip in between. At each tick of its clock it measures the voltage and writes down the nearest number it can represent — for a 16-bit converter, one of $65{,}536$ levels.

Two things happen at that moment. Time becomes separate ticks, which is this lesson. And the value becomes one of a fixed set of levels, which is **quantization**, a later lesson in this module.
:::

::: context wagon-wheel The wagon wheel that spins backward
Film cameras take 24 pictures every second. If a wheel's spokes move almost one spoke-gap between pictures, each picture shows the spokes a little *behind* where they were, so the wheel seems to creep backward. The camera has sampled a fast motion and reported a slow false one.

The same thing happens to a sine wave. Below, a tone at $0.9$ of the sample rate is read once per sample period. The dots trace a slow wave at $0.1$ of the sample rate, upside down — exactly like the $47\,\mathrm{Hz}$ mode seen as $3\,\mathrm{Hz}$ at $50$ samples per second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 184" font-family="Inter, Arial, sans-serif">
<line x1="24" y1="78" x2="344" y2="78" stroke="#6c7a93" stroke-width="1"/>
<polyline points="24.0,78.0 24.6,72.8 25.3,67.7 25.9,62.7 26.6,57.9 27.2,53.4 27.8,49.1 28.5,45.3 29.1,41.8 29.8,38.9 30.4,36.4 31.0,34.4 31.7,33.0 32.3,32.2 33.0,32.0 33.6,32.4 34.2,33.3 34.9,34.8 35.5,36.9 36.2,39.5 36.8,42.6 37.4,46.1 38.1,50.0 38.7,54.3 39.4,58.9 40.0,63.8 40.6,68.8 41.3,74.0 41.9,79.2 42.6,84.3 43.2,89.4 43.8,94.4 44.5,99.1 45.1,103.6 45.8,107.8 46.4,111.5 47.0,114.9 47.7,117.7 48.3,120.1 49.0,121.9 49.6,123.2 50.2,123.9 50.9,124.0 51.5,123.5 52.2,122.4 52.8,120.8 53.4,118.6 54.1,115.9 54.7,112.7 55.4,109.1 56.0,105.0 56.6,100.7 57.3,96.0 57.9,91.1 58.6,86.1 59.2,80.9 59.8,75.7 60.5,70.5 61.1,65.4 61.8,60.5 62.4,55.8 63.0,51.4 63.7,47.4 64.3,43.7 65.0,40.4 65.6,37.7 66.2,35.4 66.9,33.7 67.5,32.6 68.2,32.1 68.8,32.1 69.4,32.7 70.1,33.9 70.7,35.7 71.4,38.0 72.0,40.8 72.6,44.1 73.3,47.8 73.9,51.9 74.6,56.3 75.2,61.1 75.8,66.0 76.5,71.1 77.1,76.3 77.8,81.5 78.4,86.6 79.0,91.7 79.7,96.5 80.3,101.2 81.0,105.5 81.6,109.5 82.2,113.1 82.9,116.2 83.5,118.9 84.2,121.0 84.8,122.6 85.4,123.6 86.1,124.0 86.7,123.8 87.4,123.1 88.0,121.7 88.6,119.9 89.3,117.4 89.9,114.5 90.6,111.1 91.2,107.3 91.8,103.1 92.5,98.6 93.1,93.9 93.8,88.9 94.4,83.8 95.0,78.6 95.7,73.4 96.3,68.2 97.0,63.2 97.6,58.4 98.2,53.8 98.9,49.6 99.5,45.7 100.2,42.2 100.8,39.2 101.4,36.6 102.1,34.6 102.7,33.2 103.4,32.3 104.0,32.0 104.6,32.3 105.3,33.2 105.9,34.6 106.6,36.6 107.2,39.2 107.8,42.2 108.5,45.7 109.1,49.6 109.8,53.8 110.4,58.4 111.0,63.2 111.7,68.2 112.3,73.4 113.0,78.6 113.6,83.8 114.2,88.9 114.9,93.9 115.5,98.6 116.2,103.1 116.8,107.3 117.4,111.1 118.1,114.5 118.7,117.4 119.4,119.9 120.0,121.7 120.6,123.1 121.3,123.8 121.9,124.0 122.6,123.6 123.2,122.6 123.8,121.0 124.5,118.9 125.1,116.2 125.8,113.1 126.4,109.5 127.0,105.5 127.7,101.2 128.3,96.5 129.0,91.7 129.6,86.6 130.2,81.5 130.9,76.3 131.5,71.1 132.2,66.0 132.8,61.1 133.4,56.3 134.1,51.9 134.7,47.8 135.4,44.1 136.0,40.8 136.6,38.0 137.3,35.7 137.9,33.9 138.6,32.7 139.2,32.1 139.8,32.1 140.5,32.6 141.1,33.7 141.8,35.4 142.4,37.7 143.0,40.4 143.7,43.7 144.3,47.4 145.0,51.4 145.6,55.8 146.2,60.5 146.9,65.4 147.5,70.5 148.2,75.7 148.8,80.9 149.4,86.1 150.1,91.1 150.7,96.0 151.4,100.7 152.0,105.0 152.6,109.1 153.3,112.7 153.9,115.9 154.6,118.6 155.2,120.8 155.8,122.4 156.5,123.5 157.1,124.0 157.8,123.9 158.4,123.2 159.0,121.9 159.7,120.1 160.3,117.7 161.0,114.9 161.6,111.5 162.2,107.8 162.9,103.6 163.5,99.1 164.2,94.4 164.8,89.4 165.4,84.3 166.1,79.2 166.7,74.0 167.4,68.8 168.0,63.8 168.6,58.9 169.3,54.3 169.9,50.0 170.6,46.1 171.2,42.6 171.8,39.5 172.5,36.9 173.1,34.8 173.8,33.3 174.4,32.4 175.0,32.0 175.7,32.2 176.3,33.0 177.0,34.4 177.6,36.4 178.2,38.9 178.9,41.8 179.5,45.3 180.2,49.1 180.8,53.4 181.4,57.9 182.1,62.7 182.7,67.7 183.4,72.8 184.0,78.0 184.6,83.2 185.3,88.3 185.9,93.3 186.6,98.1 187.2,102.6 187.8,106.9 188.5,110.7 189.1,114.2 189.8,117.1 190.4,119.6 191.0,121.6 191.7,123.0 192.3,123.8 193.0,124.0 193.6,123.6 194.2,122.7 194.9,121.2 195.5,119.1 196.2,116.5 196.8,113.4 197.4,109.9 198.1,106.0 198.7,101.7 199.4,97.1 200.0,92.2 200.6,87.2 201.3,82.0 201.9,76.8 202.6,71.7 203.2,66.6 203.8,61.6 204.5,56.9 205.1,52.4 205.8,48.2 206.4,44.5 207.0,41.1 207.7,38.3 208.3,35.9 209.0,34.1 209.6,32.8 210.2,32.1 210.9,32.0 211.5,32.5 212.2,33.6 212.8,35.2 213.4,37.4 214.1,40.1 214.7,43.3 215.4,46.9 216.0,51.0 216.6,55.3 217.3,60.0 217.9,64.9 218.6,69.9 219.2,75.1 219.8,80.3 220.5,85.5 221.1,90.6 221.8,95.5 222.4,100.2 223.0,104.6 223.7,108.6 224.3,112.3 225.0,115.6 225.6,118.3 226.2,120.6 226.9,122.3 227.5,123.4 228.2,123.9 228.8,123.9 229.4,123.3 230.1,122.1 230.7,120.3 231.4,118.0 232.0,115.2 232.6,111.9 233.3,108.2 233.9,104.1 234.6,99.7 235.2,94.9 235.8,90.0 236.5,84.9 237.1,79.7 237.8,74.5 238.4,69.4 239.0,64.3 239.7,59.5 240.3,54.8 241.0,50.5 241.6,46.5 242.2,42.9 242.9,39.8 243.5,37.1 244.2,35.0 244.8,33.4 245.4,32.4 246.1,32.0 246.7,32.2 247.4,32.9 248.0,34.3 248.6,36.1 249.3,38.6 249.9,41.5 250.6,44.9 251.2,48.7 251.8,52.9 252.5,57.4 253.1,62.1 253.8,67.1 254.4,72.2 255.0,77.4 255.7,82.6 256.3,87.8 257.0,92.8 257.6,97.6 258.2,102.2 258.9,106.4 259.5,110.3 260.2,113.8 260.8,116.8 261.4,119.4 262.1,121.4 262.7,122.8 263.4,123.7 264.0,124.0 264.6,123.7 265.3,122.8 265.9,121.4 266.6,119.4 267.2,116.8 267.8,113.8 268.5,110.3 269.1,106.4 269.8,102.2 270.4,97.6 271.0,92.8 271.7,87.8 272.3,82.6 273.0,77.4 273.6,72.2 274.2,67.1 274.9,62.1 275.5,57.4 276.2,52.9 276.8,48.7 277.4,44.9 278.1,41.5 278.7,38.6 279.4,36.1 280.0,34.3 280.6,32.9 281.3,32.2 281.9,32.0 282.6,32.4 283.2,33.4 283.8,35.0 284.5,37.1 285.1,39.8 285.8,42.9 286.4,46.5 287.0,50.5 287.7,54.8 288.3,59.5 289.0,64.3 289.6,69.4 290.2,74.5 290.9,79.7 291.5,84.9 292.2,90.0 292.8,94.9 293.4,99.7 294.1,104.1 294.7,108.2 295.4,111.9 296.0,115.2 296.6,118.0 297.3,120.3 297.9,122.1 298.6,123.3 299.2,123.9 299.8,123.9 300.5,123.4 301.1,122.3 301.8,120.6 302.4,118.3 303.0,115.6 303.7,112.3 304.3,108.6 305.0,104.6 305.6,100.2 306.2,95.5 306.9,90.6 307.5,85.5 308.2,80.3 308.8,75.1 309.4,69.9 310.1,64.9 310.7,60.0 311.4,55.3 312.0,51.0 312.6,46.9 313.3,43.3 313.9,40.1 314.6,37.4 315.2,35.2 315.8,33.6 316.5,32.5 317.1,32.0 317.8,32.1 318.4,32.8 319.0,34.1 319.7,35.9 320.3,38.3 321.0,41.1 321.6,44.5 322.2,48.2 322.9,52.4 323.5,56.9 324.2,61.6 324.8,66.6 325.4,71.7 326.1,76.8 326.7,82.0 327.4,87.2 328.0,92.2 328.6,97.1 329.3,101.7 329.9,106.0 330.6,109.9 331.2,113.4 331.8,116.5 332.5,119.1 333.1,121.2 333.8,122.7 334.4,123.6 335.0,124.0 335.7,123.8 336.3,123.0 337.0,121.6 337.6,119.6 338.2,117.1 338.9,114.2 339.5,110.7 340.2,106.9 340.8,102.6 341.4,98.1 342.1,93.3 342.7,88.3 343.4,83.2 344.0,78.0" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
<polyline points="24.0,78.0 25.1,79.0 26.1,79.9 27.2,80.9 28.3,81.9 29.4,82.8 30.4,83.8 31.5,84.7 32.6,85.7 33.6,86.6 34.7,87.6 35.8,88.5 36.8,89.5 37.9,90.4 39.0,91.3 40.1,92.3 41.1,93.2 42.2,94.1 43.3,95.0 44.3,95.9 45.4,96.8 46.5,97.6 47.5,98.5 48.6,99.4 49.7,100.2 50.8,101.1 51.8,101.9 52.9,102.7 54.0,103.5 55.0,104.3 56.1,105.1 57.2,105.9 58.2,106.7 59.3,107.4 60.4,108.1 61.5,108.9 62.5,109.6 63.6,110.3 64.7,111.0 65.7,111.6 66.8,112.3 67.9,112.9 68.9,113.5 70.0,114.1 71.1,114.7 72.2,115.3 73.2,115.9 74.3,116.4 75.4,116.9 76.4,117.4 77.5,117.9 78.6,118.4 79.7,118.8 80.7,119.3 81.8,119.7 82.9,120.1 83.9,120.5 85.0,120.8 86.1,121.2 87.1,121.5 88.2,121.8 89.3,122.1 90.4,122.4 91.4,122.6 92.5,122.8 93.6,123.0 94.6,123.2 95.7,123.4 96.8,123.5 97.8,123.7 98.9,123.8 100.0,123.9 101.1,123.9 102.1,124.0 103.2,124.0 104.3,124.0 105.3,124.0 106.4,123.9 107.5,123.9 108.5,123.8 109.6,123.7 110.7,123.6 111.8,123.5 112.8,123.3 113.9,123.1 115.0,122.9 116.0,122.7 117.1,122.5 118.2,122.2 119.3,122.0 120.3,121.7 121.4,121.3 122.5,121.0 123.5,120.7 124.6,120.3 125.7,119.9 126.7,119.5 127.8,119.1 128.9,118.6 130.0,118.2 131.0,117.7 132.1,117.2 133.2,116.7 134.2,116.1 135.3,115.6 136.4,115.0 137.4,114.4 138.5,113.8 139.6,113.2 140.7,112.6 141.7,111.9 142.8,111.3 143.9,110.6 144.9,109.9 146.0,109.2 147.1,108.5 148.1,107.8 149.2,107.0 150.3,106.3 151.4,105.5 152.4,104.7 153.5,103.9 154.6,103.1 155.6,102.3 156.7,101.5 157.8,100.7 158.8,99.8 159.9,98.9 161.0,98.1 162.1,97.2 163.1,96.3 164.2,95.4 165.3,94.5 166.3,93.6 167.4,92.7 168.5,91.8 169.6,90.9 170.6,89.9 171.7,89.0 172.8,88.1 173.8,87.1 174.9,86.2 176.0,85.2 177.0,84.3 178.1,83.3 179.2,82.3 180.3,81.4 181.3,80.4 182.4,79.4 183.5,78.5 184.5,77.5 185.6,76.6 186.7,75.6 187.7,74.6 188.8,73.7 189.9,72.7 191.0,71.7 192.0,70.8 193.1,69.8 194.2,68.9 195.2,67.9 196.3,67.0 197.4,66.1 198.4,65.1 199.5,64.2 200.6,63.3 201.7,62.4 202.7,61.5 203.8,60.6 204.9,59.7 205.9,58.8 207.0,57.9 208.1,57.1 209.2,56.2 210.2,55.3 211.3,54.5 212.4,53.7 213.4,52.9 214.5,52.1 215.6,51.3 216.6,50.5 217.7,49.7 218.8,49.0 219.9,48.2 220.9,47.5 222.0,46.8 223.1,46.1 224.1,45.4 225.2,44.7 226.3,44.1 227.3,43.4 228.4,42.8 229.5,42.2 230.6,41.6 231.6,41.0 232.7,40.4 233.8,39.9 234.8,39.3 235.9,38.8 237.0,38.3 238.0,37.8 239.1,37.4 240.2,36.9 241.3,36.5 242.3,36.1 243.4,35.7 244.5,35.3 245.5,35.0 246.6,34.7 247.7,34.3 248.7,34.0 249.8,33.8 250.9,33.5 252.0,33.3 253.0,33.1 254.1,32.9 255.2,32.7 256.2,32.5 257.3,32.4 258.4,32.3 259.5,32.2 260.5,32.1 261.6,32.1 262.7,32.0 263.7,32.0 264.8,32.0 265.9,32.0 266.9,32.1 268.0,32.1 269.1,32.2 270.2,32.3 271.2,32.5 272.3,32.6 273.4,32.8 274.4,33.0 275.5,33.2 276.6,33.4 277.6,33.6 278.7,33.9 279.8,34.2 280.9,34.5 281.9,34.8 283.0,35.2 284.1,35.5 285.1,35.9 286.2,36.3 287.3,36.7 288.3,37.2 289.4,37.6 290.5,38.1 291.6,38.6 292.6,39.1 293.7,39.6 294.8,40.1 295.8,40.7 296.9,41.3 298.0,41.9 299.1,42.5 300.1,43.1 301.2,43.7 302.3,44.4 303.3,45.0 304.4,45.7 305.5,46.4 306.5,47.1 307.6,47.9 308.7,48.6 309.8,49.3 310.8,50.1 311.9,50.9 313.0,51.7 314.0,52.5 315.1,53.3 316.2,54.1 317.2,54.9 318.3,55.8 319.4,56.6 320.5,57.5 321.5,58.4 322.6,59.2 323.7,60.1 324.7,61.0 325.8,61.9 326.9,62.8 327.9,63.7 329.0,64.7 330.1,65.6 331.2,66.5 332.2,67.5 333.3,68.4 334.4,69.4 335.4,70.3 336.5,71.3 337.6,72.2 338.6,73.2 339.7,74.1 340.8,75.1 341.9,76.1 342.9,77.0 344.0,78.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
<circle cx="24.0" cy="78.0" r="4" fill="#1f2a44"/>
<circle cx="56.0" cy="105.0" r="4" fill="#1f2a44"/>
<circle cx="88.0" cy="121.7" r="4" fill="#1f2a44"/>
<circle cx="120.0" cy="121.7" r="4" fill="#1f2a44"/>
<circle cx="152.0" cy="105.0" r="4" fill="#1f2a44"/>
<circle cx="184.0" cy="78.0" r="4" fill="#1f2a44"/>
<circle cx="216.0" cy="51.0" r="4" fill="#1f2a44"/>
<circle cx="248.0" cy="34.3" r="4" fill="#1f2a44"/>
<circle cx="280.0" cy="34.3" r="4" fill="#1f2a44"/>
<circle cx="312.0" cy="51.0" r="4" fill="#1f2a44"/>
<circle cx="344.0" cy="78.0" r="4" fill="#1f2a44"/>
<text x="24" y="146" font-size="12" fill="#1d6fd1" text-anchor="start">blue: a tone at 0.9 fs, 9 cycles in 10 samples</text>
<text x="24" y="161" font-size="12" fill="#1f2a44" text-anchor="start">dots: the samples, one every T</text>
<text x="24" y="176" font-size="12" fill="#b4232c" text-anchor="start">red: the 0.1 fs wave the samples trace</text>
</svg>
```
:::

::: context spectrum-copies Copies of the hill
Draw the signal's spectrum as a hill centered at zero frequency. Sampling adds copies of that hill centered at $\pm f_s$, $\pm 2f_s$, and so on. The dashed line is the Nyquist frequency, halfway to the first copy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 202" font-family="Inter, Arial, sans-serif">
<line x1="18" y1="84" x2="348" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
<polygon points="37.0,84.0 64.1,34.0 91.1,84.0" fill="#8fb8f0" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<polygon points="114.3,84.0 141.4,34.0 168.4,84.0" fill="#1d6fd1" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<polygon points="191.6,84.0 218.6,34.0 245.7,84.0" fill="#8fb8f0" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<polygon points="268.9,84.0 295.9,34.0 323.0,84.0" fill="#8fb8f0" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<text x="141.36363636363635" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
<text x="218.63636363636363" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">fs</text>
<text x="295.9090909090909" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">2fs</text>
<text x="64.0909090909091" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">−fs</text>
<line x1="180.0" y1="24" x2="180.0" y2="84" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
<text x="184.0" y="34" font-size="11" fill="#b4232c" text-anchor="start">Nyquist</text>
<text x="18" y="22" font-size="12" fill="#1f2a44" text-anchor="start">Band-limited: copies sit apart</text>
<line x1="18" y1="186" x2="348" y2="186" stroke="#1f2a44" stroke-width="1.5"/>
<polygon points="13.9,186.0 64.1,136.0 114.3,186.0" fill="#8fb8f0" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<polygon points="91.1,186.0 141.4,136.0 191.6,186.0" fill="#1d6fd1" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<polygon points="168.4,186.0 218.6,136.0 268.9,186.0" fill="#8fb8f0" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<polygon points="245.7,186.0 295.9,136.0 346.1,186.0" fill="#8fb8f0" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1"/>
<text x="141.36363636363635" y="200" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
<text x="218.63636363636363" y="200" font-size="11" fill="#1f2a44" text-anchor="middle">fs</text>
<text x="295.9090909090909" y="200" font-size="11" fill="#1f2a44" text-anchor="middle">2fs</text>
<text x="64.0909090909091" y="200" font-size="11" fill="#1f2a44" text-anchor="middle">−fs</text>
<line x1="180.0" y1="126" x2="180.0" y2="186" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
<text x="184.0" y="136" font-size="11" fill="#b4232c" text-anchor="start">Nyquist</text>
<text x="18" y="124" font-size="12" fill="#1f2a44" text-anchor="start">Too wide: copies overlap and add</text>
<polygon points="91.1,186.0 91.7,185.4 92.3,184.8 92.9,184.2 93.5,183.6 94.1,183.0 94.7,182.4 95.3,181.9 95.9,181.3 96.5,180.7 97.1,180.1 97.7,179.5 98.3,178.9 98.9,178.3 99.5,177.7 100.1,177.1 100.6,176.5 101.2,175.9 101.8,175.3 102.4,174.8 103.0,174.8 103.6,175.3 104.2,175.9 104.8,176.5 105.4,177.1 106.0,177.7 106.6,178.3 107.2,178.9 107.8,179.5 108.4,180.1 109.0,180.7 109.6,181.3 110.2,181.9 110.8,182.4 111.3,183.0 111.9,183.6 112.5,184.2 113.1,184.8 113.7,185.4 114.3,186.0" fill="#b4232c" fill-opacity="0.75"/>
<polygon points="168.4,186.0 169.0,185.4 169.6,184.8 170.2,184.2 170.8,183.6 171.4,183.0 172.0,182.4 172.6,181.9 173.2,181.3 173.8,180.7 174.4,180.1 174.9,179.5 175.5,178.9 176.1,178.3 176.7,177.7 177.3,177.1 177.9,176.5 178.5,175.9 179.1,175.3 179.7,174.8 180.3,174.8 180.9,175.3 181.5,175.9 182.1,176.5 182.7,177.1 183.3,177.7 183.9,178.3 184.5,178.9 185.1,179.5 185.6,180.1 186.2,180.7 186.8,181.3 187.4,181.9 188.0,182.4 188.6,183.0 189.2,183.6 189.8,184.2 190.4,184.8 191.0,185.4 191.6,186.0" fill="#b4232c" fill-opacity="0.75"/>
<polygon points="245.7,186.0 246.3,185.4 246.9,184.8 247.5,184.2 248.1,183.6 248.7,183.0 249.2,182.4 249.8,181.9 250.4,181.3 251.0,180.7 251.6,180.1 252.2,179.5 252.8,178.9 253.4,178.3 254.0,177.7 254.6,177.1 255.2,176.5 255.8,175.9 256.4,175.3 257.0,174.8 257.6,174.8 258.2,175.3 258.8,175.9 259.4,176.5 259.9,177.1 260.5,177.7 261.1,178.3 261.7,178.9 262.3,179.5 262.9,180.1 263.5,180.7 264.1,181.3 264.7,181.9 265.3,182.4 265.9,183.0 266.5,183.6 267.1,184.2 267.7,184.8 268.3,185.4 268.9,186.0" fill="#b4232c" fill-opacity="0.75"/>
</svg>
```

Top: the hill is narrower than $f_N$, so the copies never touch and the one at zero can be kept cleanly. Bottom: the hill is too wide. The red wedges are where two copies add together, and no filter afterward can tell which part came from which copy.
:::

::: context impulse-train A row of perfect spikes
An **impulse**, written $\delta(t)$ and read "delta of t", is an idealized spike: infinitely thin, infinitely tall, with area exactly $1$. Nothing real looks like that. It is useful because multiplying a signal by a spike at time $t_0$ keeps only the value $x(t_0)$ — which is what a sampler does.

An **impulse train** is one spike every $T$ seconds. Multiplying $x(t)$ by it keeps exactly the samples and throws away everything between them, while still letting you use the ordinary Fourier and Laplace tools on the result.
:::

::: context names Who the theorem is named after
Harry Nyquist, an engineer at Bell Labs, showed in a 1928 paper on telegraph signaling that a channel of bandwidth $B$ can carry at most $2B$ independent pulses per second. Claude Shannon gave the sampling theorem its clean modern form, with the sinc reconstruction, in a 1949 paper on communication in the presence of noise.

Others found the same result independently: the mathematician E. T. Whittaker in 1915 and the Soviet engineer Vladimir Kotelnikov in 1933. That is why some books call it the Whittaker-Kotelnikov-Shannon theorem.
:::

::: context sinc-name The sinc function
The function $\sin(u)/u$ is called **sinc**, short for the Latin *sinus cardinalis*, "cardinal sine". At $u = 0$ the formula reads $0/0$, but the value is taken as $1$, because $\sin u \approx u$ for tiny $u$.

It equals $1$ at its own sample and exactly $0$ at every other sample instant. That is what makes the reconstruction work: each sinc bump passes through its own sample and gets out of the way of all the others. You will meet the same shape again in the next lesson, as the gain of the zero-order hold.
:::

::: context folding-ribbon The folded frequency axis
Plot where a tone *appears* against its true frequency, for a $100\,\mathrm{Hz}$ sampler. Up to $50\,\mathrm{Hz}$ the line rises honestly. Then it turns around and heads back down, reaching zero at $100\,\mathrm{Hz}$, and zigzags forever after.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="140" x2="346" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="140" x2="40" y2="32" stroke="#1f2a44" stroke-width="1.5"/>
<polyline points="40.0,140.0 115.0,40.0 190.0,140.0 265.0,40.0 340.0,140.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<text x="40.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
<text x="115.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">50</text>
<text x="190.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">100</text>
<text x="265.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">150</text>
<text x="340.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">200</text>
<text x="190.0" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">true frequency f (Hz), sampled at fs = 100 Hz</text>
<text x="34" y="144.0" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
<text x="34" y="94.0" font-size="11" fill="#1f2a44" text-anchor="end">25</text>
<text x="34" y="44.0" font-size="11" fill="#1f2a44" text-anchor="end">50</text>
<text x="46" y="26" font-size="11" fill="#1f2a44" text-anchor="start">where it appears, fa (Hz)</text>
<line x1="130.0" y1="140" x2="130.0" y2="60.0" stroke="#b4232c" stroke-dasharray="3 3"/>
<line x1="40" y1="60.0" x2="130.0" y2="60.0" stroke="#b4232c" stroke-dasharray="3 3"/>
<circle cx="130.0" cy="60.0" r="4" fill="#b4232c"/>
<text x="136.0" y="54.0" font-size="11" fill="#b4232c" text-anchor="start">60 → 40</text>
<line x1="220.0" y1="140" x2="220.0" y2="100.0" stroke="#b4232c" stroke-dasharray="3 3"/>
<line x1="40" y1="100.0" x2="220.0" y2="100.0" stroke="#b4232c" stroke-dasharray="3 3"/>
<circle cx="220.0" cy="100.0" r="4" fill="#b4232c"/>
<text x="226.0" y="94.0" font-size="11" fill="#b4232c" text-anchor="start">120 → 20</text>
</svg>
```

Every true frequency on the bottom axis lands somewhere between $0$ and $50\,\mathrm{Hz}$. A tone at $60\,\mathrm{Hz}$ reads as $40$; a tone at $120\,\mathrm{Hz}$ reads as $20$. The zigzag is the formula $f_a = \lvert f - \mathrm{round}(f/f_s)\,f_s\rvert$ drawn as a picture.
:::

::: context decibels Decibels in one breath
A **decibel** (dB) measures a ratio on a logarithmic scale. For amplitudes, the ratio $A$ is $20\log_{10} A$ decibels. So a factor of $10$ is $20\,\mathrm{dB}$, a factor of $100$ is $40\,\mathrm{dB}$, and a factor of $2$ is about $6\,\mathrm{dB}$. A cut is a negative number: "$-20\,\mathrm{dB}$" means one tenth the amplitude.

The unit is named after Alexander Graham Bell. Engineers like it because gains in a chain multiply, and in decibels they add.
:::

::: context butterworth The flattest possible filter
Stephen Butterworth, a British physicist, described this family of filters in 1930. Among all filters of a given order, the Butterworth has the flattest possible passband: no ripple at all, only a smooth roll-off that steepens with order. An order-$N$ Butterworth has $|H| = 1/\sqrt{1 + r^{2N}}$, so it falls by $20N\,\mathrm{dB}$ per decade far above the corner.

That flatness is why it is the default anti-alias filter. It does not distort the size of signals in the control band — though, as the table shows, it still delays them.
:::

::: context group-delay Group delay: phase as a time
A filter that lags by $\phi$ radians at frequency $\omega$ acts, near that frequency, like a time delay. The **group delay** is the slope $-d\phi/d\omega$, in seconds. At low frequency, most filters behave like a pure delay $\tau_0$, so their lag grows as $\omega\tau_0$.

For a second-order section $1/(s^2/\omega_c^2 + 2\zeta s/\omega_c + 1)$ the low-frequency delay is $2\zeta/\omega_c$. A Butterworth pair has $\zeta = 0.707$. (A lone real pole, $1/(s/\omega_c + 1)$, adds $1/\omega_c$.) Add these up over the sections and you have $\tau_0$ — the number that decides the phase cost at a crossover far below the corner.
:::

::: context wheel-zones Keeping wheels out of trouble
Reaction wheels spin through a range of speeds as they absorb and dump momentum. Some speeds are bad places to linger. At zero speed, friction changes sign and makes the torque jerky. Other speeds make the wheel's imbalance shake a structural mode, or, as in this problem, fold straight into the control band.

So spacecraft momentum-management logic often keeps each wheel's speed out of chosen bands, biasing the wheels or passing through those speeds quickly. It is cheaper than rebuilding the wheel or the structure.
:::
