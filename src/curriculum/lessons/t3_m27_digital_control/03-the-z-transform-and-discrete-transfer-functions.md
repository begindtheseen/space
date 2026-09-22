---
id: l03-z-transform-discrete-tf
title: The z-transform and discrete transfer functions
minutes: 17
covers:
  - The z-transform and discrete transfer functions
---

The two previous lessons patched continuous results: a folding formula for the sampler, a factor $e^{-sT/2}$ for the hold. That works for a phase budget and stops working the moment the controller itself is discrete, because a difference equation has no Laplace transform. You need an algebra that treats sequences the way the Laplace transform treats functions of time — one that turns the recursion a flight computer actually executes into a ratio of polynomials you can factor, plot and reason about.

That algebra is the **z-transform**. The connection to what you already know is direct: where the Laplace transform makes $d/dt$ into multiplication by $s$, the z-transform makes *delay by one sample* into multiplication by $z^{-1}$, and delay is the only memory a difference equation has. Everything else follows.

This lesson builds the transform, its handful of properties, and the discrete transfer function; shows how to move in both directions between a transfer function and the loop of code that implements it; and evaluates frequency response on the unit circle, which is how a discrete filter's Bode plot is drawn. The geometry of that unit circle — why it is the stability boundary, and how continuous pole locations map onto it — is the next lesson.

## Definition

For a sequence $x[n]$ defined for $n \ge 0$, the one-sided z-transform is

$$
X(z) = \mathcal{Z}\{x[n]\} = \sum_{n=0}^{\infty} x[n]\,z^{-n},
$$

with $z$ a complex variable. One-sided is the right choice here: flight software powers on at a definite instant, and everything before $n = 0$ is a matter of initialisation rather than of history.

The sum converges outside some circle in the complex plane, $|z| > R$, called the region of convergence. For the sequences in this module the transform is always a ratio of polynomials and the region of convergence is outside the largest pole magnitude; it matters for inverting transforms rigorously and rarely changes an engineering answer, so it will not be laboured.

Three transforms do most of the work. The unit sample $\delta[n]$, which is 1 at $n = 0$ and 0 afterwards, gives a single term:

$$
\mathcal{Z}\{\delta[n]\} = 1.
$$

The unit step $u[n] = 1$ for all $n \ge 0$ gives a geometric series:

$$
\mathcal{Z}\{u[n]\} = \sum_{n=0}^{\infty} z^{-n} = \frac{1}{1 - z^{-1}} = \frac{z}{z - 1}.
$$

And the geometric sequence $a^n u[n]$ — the discrete equivalent of an exponential, and the impulse response of every first-order filter you will write — gives

$$
\mathcal{Z}\{a^n u[n]\} = \sum_{n=0}^{\infty} (a z^{-1})^n = \frac{1}{1 - a z^{-1}} = \frac{z}{z - a}.
$$

Setting $a = e^{-\sigma T}$ turns that into the transform of a sampled continuous exponential $e^{-\sigma nT}$, which is the bridge between the two domains and the subject of the next lesson.

## The one property that matters: delay

Shift a sequence one sample later, so the new sequence is $x[n-1]$, and transform it. With $x[n] = 0$ for $n < 0$,

$$
\sum_{n=0}^{\infty} x[n-1] z^{-n}
= \sum_{m=-1}^{\infty} x[m] z^{-(m+1)}
= z^{-1}\sum_{m=0}^{\infty} x[m] z^{-m}
= z^{-1} X(z).
$$

**A delay of one sample is multiplication by $z^{-1}$.** A delay of $k$ samples is $z^{-k}$. This is the entire reason the transform exists, and it is why flight code and z-domain algebra are the same object written two ways: in the code, a delay is a variable holding last frame's value; in the algebra, it is a factor of $z^{-1}$.

If the sequence is not zero before $n = 0$ — a controller restarted in flight with state carried over — the shift picks up the initial condition, $\mathcal{Z}\{x[n-1]\} = z^{-1}X(z) + x[-1]$. That term is how bumpless transfer is analysed, and it is the reason the reset value of every delay register in a flight controller is a documented quantity rather than whatever the linker left there.

The remaining properties are short. **Linearity**: $\mathcal{Z}\{\alpha x[n] + \beta y[n]\} = \alpha X(z) + \beta Y(z)$, directly from the sum. **Convolution**: $\mathcal{Z}\{\sum_k h[k] x[n-k]\} = H(z)X(z)$, by applying the delay property term by term. **Initial value**: $x[0] = \lim_{z\to\infty} X(z)$, since every other term carries a negative power of $z$. **Final value**: if the sequence settles,

$$
\lim_{n\to\infty} x[n] = \lim_{z\to 1}\,(z - 1)X(z),
$$

the discrete counterpart of $\lim_{s\to 0} sF(s)$, with the same caveat — the limit is meaningless unless the sequence actually converges, so check the poles first.

## Difference equation to transfer function and back

A linear, time-invariant, causal filter computes each output from present and past inputs and past outputs:

$$
y[n] = b_0 x[n] + b_1 x[n-1] + \cdots + b_M x[n-M] - a_1 y[n-1] - \cdots - a_N y[n-N].
$$

The minus signs on the $a_k$ are a convention, chosen so that the denominator below comes out with plus signs. Transform every term with the delay property and collect:

$$
Y(z)\left(1 + a_1 z^{-1} + \cdots + a_N z^{-N}\right)
= X(z)\left(b_0 + b_1 z^{-1} + \cdots + b_M z^{-M}\right),
$$

so the **discrete transfer function** is

$$
H(z) = \frac{Y(z)}{X(z)} = \frac{b_0 + b_1 z^{-1} + \cdots + b_M z^{-M}}{1 + a_1 z^{-1} + \cdots + a_N z^{-N}}.
$$

The map runs both ways with no work: a transfer function written in negative powers of $z$ with leading denominator coefficient 1 *is* the difference equation, coefficient for coefficient. Reading a filter out of flight code and reading it off a Bode plot are the same act.

Multiplying top and bottom by $z^N$ gives the positive-power form, $H(z) = (b_0 z^N + b_1 z^{N-1} + \cdots)/(z^N + a_1 z^{N-1} + \cdots)$, whose roots are the **zeros** and **poles**. Both forms appear constantly; the negative-power form is the one that matches code, the positive-power form is the one you factor.

Two structural facts follow from causality. The filter cannot use $x[n+1]$, so no positive powers of $z$ survive in the numerator once the denominator is monic in $z^N$ — the transfer function is proper. And $b_0$ is the **direct feedthrough**: the part of this frame's output that depends on this frame's input. A filter with $b_0 \ne 0$ assumes the flight computer can read the sensor and write the actuator in zero time. It cannot, and the lesson on computational delay in this module deals with what to do about it.

::: key
**Discrete transfer function.** $H(z) = \big(b_0 + b_1 z^{-1} + \cdots\big)/\big(1 + a_1 z^{-1} + \cdots\big)$, where $z^{-1}$ is a delay of one sample. The coefficients are the difference equation the flight computer runs, read straight off. Poles are the roots of the denominator in $z$; the DC gain is $H(1)$; the frequency response is $H(e^{j\omega T})$ for $0 \le \omega \le \pi/T$.
:::

## DC gain and frequency response

Set $x[n] = 1$ for all $n$ and wait for the output to settle at some constant $y_\infty$. Every delayed term is also 1, or $y_\infty$, so the difference equation reduces to $y_\infty(1 + a_1 + \cdots) = (b_0 + b_1 + \cdots)$, giving

$$
\text{DC gain} = \frac{\sum_k b_k}{1 + \sum_k a_k} = H(1).
$$

That is the fastest check you can run on any discrete filter: sum the numerator coefficients, sum the denominator coefficients, divide. If a notch or a low-pass does not come out at exactly 1, a coefficient is wrong.

For frequency response, feed the filter a sampled complex exponential $x[n] = e^{j\omega n T}$. By the delay property each $x[n-k]$ is $e^{-j\omega kT}$ times $x[n]$, so the steady-state output is $x[n]$ multiplied by $H(z)$ evaluated at $z = e^{j\omega T}$:

$$
H(e^{j\omega T}) = \frac{\sum_k b_k e^{-j\omega k T}}{1 + \sum_k a_k e^{-j\omega k T}} .
$$

The frequency variable moves around the **unit circle** rather than up the imaginary axis. Two consequences. The response is periodic: $\omega$ and $\omega + \omega_s$ give the same point on the circle and therefore the same response, which is the frequency-domain image of aliasing. And the useful range is one half-turn, $\omega T$ from $0$ to $\pi$, that is DC to Nyquist; beyond $\pi$ the circle retraces conjugate values.

::: example An exponential filter, in both domains
Rate measurements from a gyro at $f_s = 200\,\mathrm{Hz}$ are smoothed with the recursion every embedded engineer has written:

$$
y[n] = a\,y[n-1] + (1 - a)\,x[n].
$$

Choose $a$ to match a continuous first-order lag of time constant $\tau = 50\,\mathrm{ms}$ by putting the discrete pole where the sampled continuous pole would be: $a = e^{-T/\tau} = e^{-0.1} = 0.904837$, so $1 - a = 0.095163$.

**Transfer function.** Read it off the recursion: $b_0 = 0.095163$, $a_1 = -0.904837$, so

$$
H(z) = \frac{0.095163}{1 - 0.904837\,z^{-1}} = \frac{0.095163\,z}{z - 0.904837}.
$$

One pole at $z = 0.904837$, one zero at $z = 0$, and direct feedthrough $b_0 = 0.095163$.

**DC gain.** $\sum b_k = 0.095163$ and $1 + \sum a_k = 1 - 0.904837 = 0.095163$, so $H(1) = 1$ exactly. The filter passes steady rate unchanged, as a smoother must.

**Impulse response.** From the geometric-sequence transform, $h[n] = 0.095163 \times 0.904837^n$: $h[0] = 0.095163$, $h[10] = 0.035008$, decaying by a factor $e^{-1}$ every $\tau/T = 10$ samples.

**Step response.** Summing that geometric series, $s[n] = 1 - a^{n+1} = 1 - e^{-(n+1)T/\tau}$, which is the continuous step response evaluated at $t = (n+1)T$. At $n = 9$, that is $1 - e^{-1} = 0.632121$.

**Frequency response.** Evaluate on the unit circle and compare with the continuous lag $1/(1 + j\omega\tau)$:

```python
import numpy as np

fs, tau = 200.0, 0.05
T = 1.0 / fs
a = np.exp(-T / tau)

for f in (0.5, 3.0, 10.0):
    th = 2 * np.pi * f * T                      # omega*T, the angle on the unit circle
    Hd = (1 - a) / (1 - a * np.exp(-1j * th))   # discrete filter
    Hc = 1 / (1 + 1j * 2 * np.pi * f * tau)     # continuous lag it was matched to
    print("%5.1f Hz  |Hd|=%.6f  %8.4f deg   |Hc|=%.6f  %8.4f deg   lead=%.4f deg"
          % (f, abs(Hd), np.degrees(np.angle(Hd)),
             abs(Hc), np.degrees(np.angle(Hc)),
             np.degrees(np.angle(Hd) - np.angle(Hc))))

#   0.5 Hz  |Hd|=0.987897   -8.4846 deg   |Hc|=0.987887   -8.9271 deg   lead=0.4425 deg
#   3.0 Hz  |Hd|=0.727996  -40.6488 deg   |Hc|=0.727727  -43.3038 deg   lead=2.6550 deg
#  10.0 Hz  |Hd|=0.304565  -63.4934 deg   |Hc|=0.303314  -72.3432 deg   lead=8.8498 deg
```

The magnitudes agree to four decimal places through the useful band. The phases do not, and the discrepancy is recognisable: $0.44^\circ$, $2.66^\circ$, $8.85^\circ$ against a half sample of $180^\circ f/f_s = 0.45^\circ$, $2.70^\circ$, $9.00^\circ$. The discrete filter *leads* the continuous one by very nearly half a sample, because its direct feedthrough lets $x[n]$ influence $y[n]$ in the same frame, which no physical continuous lag does. Its low-frequency group delay works out to $aT/(1-a) = 47.54\,\mathrm{ms}$ against the continuous $\tau = 50\,\mathrm{ms}$.

That half sample is not free money. It is exactly what the zero-order hold takes back when the filter's output is written to a converter, which is why this filter and a ZOH-equivalent discretisation of the same lag differ by one factor of $z^{-1}$.
:::

::: example What a backward difference really computes
Rate from position, or acceleration from rate, is usually a two-tap difference:

$$
d[n] = \frac{x[n] - x[n-1]}{T}, \qquad D(z) = \frac{1 - z^{-1}}{T}.
$$

Its frequency response follows from the same half-angle factoring used for the hold:

$$
D(e^{j\omega T}) = \frac{1 - e^{-j\omega T}}{T}
= \frac{2}{T}\sin\!\left(\frac{\omega T}{2}\right) e^{\,j(\pi/2 - \omega T/2)} .
$$

Compare with the ideal differentiator, whose response is $j\omega$: magnitude $\omega$, phase exactly $+90^\circ$. The backward difference has

$$
\frac{|D|}{\omega} = \frac{\sin(\omega T/2)}{\omega T/2},
\qquad
\angle D = 90^\circ - 180^\circ\frac{f}{f_s}.
$$

The same sinc, and the same half-sample delay, as the zero-order hold — for the same reason, since both are built from $1 - e^{-j\omega T}$. At $f_s = 200\,\mathrm{Hz}$:

| $f$ | $\lvert D \rvert$ | ideal $\omega$ | ratio | phase |
| --- | --- | --- | --- | --- |
| $1\,\mathrm{Hz}$ | $6.2829$ | $6.2832$ | $0.99996$ | $89.10^\circ$ |
| $10\,\mathrm{Hz}$ | $62.574$ | $62.832$ | $0.99589$ | $81.00^\circ$ |
| $20\,\mathrm{Hz}$ | $123.61$ | $125.66$ | $0.98363$ | $72.00^\circ$ |
| $50\,\mathrm{Hz}$ | $282.84$ | $314.16$ | $0.90032$ | $45.00^\circ$ |

Read the phase column as the design consequence. A PD controller's whole purpose is the phase lead its derivative term supplies at crossover. A backward difference delivers $90^\circ$ minus half a sample, so at a crossover of one tenth of the sample rate you get $72^\circ$ of lead instead of $90^\circ$ — an $18^\circ$ shortfall that appears nowhere in the continuous design and is on top of the zero-order hold's own $18^\circ$ on the way out. The magnitude error, meanwhile, is under $2\%$ over the same range and can be ignored.
:::

::: warning
Two notational traps cause most of the sign errors in discrete control code.

The first is $z$ against $z^{-1}$. The form $H(z) = (b_0 + b_1 z^{-1})/(1 + a_1 z^{-1})$ and the form $H(z) = (b_0 z + b_1)/(z + a_1)$ are the same filter, and the coefficients are the same numbers, but the *roots* you get by factoring differ: the first is a polynomial in $z^{-1}$, whose roots are the reciprocals of the poles. Factor the positive-power form, always.

The second is the sign of $a_k$. With the convention used here — denominator $1 + a_1 z^{-1} + \cdots$ — the difference equation has $-a_1 y[n-1]$, with a minus. Some references and most digital-filter libraries keep that convention; some textbooks write $y[n] = \cdots + a_1 y[n-1]$ with a plus and flip the sign in the denominator. A pole at $z = +0.9$ is a smooth decay and a pole at $z = -0.9$ alternates sign every sample, so getting this backwards produces a filter that rings at Nyquist instead of smoothing. Check the DC gain with $H(1)$ before believing any set of coefficients: it catches this immediately.
:::

## Check yourself

::: check
A discrete filter is $H(z) = \dfrac{0.2 z}{z - 0.8}$ at $f_s = 100\,\mathrm{Hz}$. Write the difference equation, state the DC gain, and find how many samples the impulse response takes to fall below $1\%$ of its initial value.
:::

::: answer
Divide top and bottom by $z$: $H(z) = 0.2/(1 - 0.8z^{-1})$, so $Y(1 - 0.8z^{-1}) = 0.2X$ and

$$
y[n] = 0.8\,y[n-1] + 0.2\,x[n].
$$

DC gain: $\sum b_k / (1 + \sum a_k) = 0.2/(1 - 0.8) = 1$. The filter is a unity-gain smoother.

The impulse response is $h[n] = 0.2 \times 0.8^n$, so falling below $1\%$ of $h[0]$ needs $0.8^n < 0.01$, that is $n > \ln(0.01)/\ln(0.8) = 20.6$, so $n = 21$ samples, which at $100\,\mathrm{Hz}$ is $210\,\mathrm{ms}$. For reference the equivalent continuous time constant is $\tau = -T/\ln(0.8) = 0.01/0.2231 = 44.8\,\mathrm{ms}$, and $210\,\mathrm{ms}$ is about $4.7\tau$, consistent with $e^{-4.7} \approx 0.009$.
:::

::: check
Use the final value theorem to find the steady-state output of the filter $H(z) = (0.1 + 0.1z^{-1})/(1 - 0.9 z^{-1} + 0.1 z^{-2})$ driven by a unit step, then verify it against $H(1)$.
:::

::: answer
The step transform is $X(z) = z/(z-1)$, so $Y(z) = H(z)\,z/(z-1)$ and

$$
\lim_{n\to\infty} y[n] = \lim_{z\to1} (z-1)\,H(z)\,\frac{z}{z-1} = H(1)\cdot 1 = H(1).
$$

The $(z-1)$ factors cancel, which is the whole content of the theorem for a step input: the steady-state step response *is* the DC gain. Evaluate: $H(1) = (0.1 + 0.1)/(1 - 0.9 + 0.1) = 0.2/0.2 = 1$.

Before trusting it, check that the sequence converges. The denominator in positive powers is $z^2 - 0.9z + 0.1$, with roots $z = (0.9 \pm \sqrt{0.81 - 0.4})/2 = (0.9 \pm 0.6403)/2$, that is $0.7702$ and $0.1298$. Both are inside the unit circle, so the response settles and the limit is meaningful. Had a root been outside, the algebra would still have produced "1" and the answer would have been nonsense.
:::

::: check
Why is the frequency response of a discrete filter periodic, and what is the highest frequency at which asking for the response is meaningful?
:::

::: answer
The response is $H(e^{j\omega T})$, and $e^{j\omega T}$ is unchanged when $\omega T$ increases by $2\pi$, that is when $\omega$ increases by $\omega_s = 2\pi/T$. So $H$ repeats with period $f_s$ in frequency. This is not an artefact of the algebra: it is aliasing seen from the frequency side. The filter operates on samples, and two sinusoids whose frequencies differ by $f_s$ produce identical sample sequences, so no filter acting on those samples can treat them differently.

Meaningful frequencies run from $0$ to $f_s/2$. Above Nyquist the point $e^{j\omega T}$ continues around the circle into the lower half, where the response is the complex conjugate of a frequency already covered — the mirror image, not new information. A discrete Bode plot therefore stops at Nyquist, and the axis is often drawn as $\omega T$ from $0$ to $\pi$, or as $f/f_s$ from 0 to $0.5$, to make the sample rate explicit.
:::

::: check
A colleague implements a notch as $y[n] = b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] + a_1 y[n-1] + a_2 y[n-2]$, taking the coefficients $b = [0.9391, -1.7601, 0.9391]$, $a = [-1.7601, 0.8782]$ from a design tool that uses the denominator convention $1 + a_1 z^{-1} + a_2 z^{-2}$. What goes wrong, and what is the one-line test that catches it?
:::

::: answer
The signs on the feedback terms are wrong. With the tool's convention the difference equation is $y[n] = b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] - a_1 y[n-1] - a_2 y[n-2]$, so the correct code adds $+1.7601\,y[n-1]$ and $-0.8782\,y[n-2]$. As written it applies $-1.7601\,y[n-1]$ and $+0.8782\,y[n-2]$, which is the filter with its denominator's odd-power signs flipped — the poles reflected across the imaginary axis of the $z$ plane, from $z = 0.937\,e^{\pm j 0.350}$ to $z = 0.937\,e^{\pm j 2.792}$. Instead of notching a low frequency it now notches a frequency near Nyquist and has a resonant pair there as well. It will not diverge — the pole radius is unchanged, so it is still stable — which is what makes it so easy to ship.

The one-line test is the DC gain. As intended, $H(1) = (0.9391 - 1.7601 + 0.9391)/(1 - 1.7601 + 0.8782) = 0.1181/0.1181 = 1.000$. As coded, the denominator becomes $1 + 1.7601 + 0.8782 = 3.6383$ and $H(1) = 0.1181/3.6383 = 0.0325$. A unity-gain notch that passes $3.2\%$ of a constant input is visible on the first bench run, and checking $\sum b / (1 + \sum a)$ takes a moment.
:::

::: check
The delay property gives $\mathcal{Z}\{x[n-1]\} = z^{-1}X(z) + x[-1]$ when the sequence is not zero before $n = 0$. Why does that term matter in a flight controller, and what is it called?
:::

::: answer
It is the initial condition of the delay register — the number sitting in the variable that holds last frame's value at the moment the filter starts running. The transfer-function description assumes that number is zero; if it is not, the output carries an extra transient that the transfer function does not predict.

It matters whenever a filter or an integrator starts, restarts, or is switched into the loop: mode changes, handover from an outer guidance law to a terminal one, recovery after a detected fault, or a channel coming out of standby. Setting the state so the new element's output begins at the value the old one was producing is called **bumpless transfer**, and it amounts to choosing $x[-1]$, and the equivalent $y[-1]$, so the transient is zero. The alternative is a step command into the actuator at the instant of the switch, which on a launch vehicle is a visible transient and on a landing vehicle can be a great deal worse.
:::

## Summary

| Item | Statement |
| --- | --- |
| z-transform | $X(z) = \sum_{n\ge0} x[n] z^{-n}$ |
| Delay | $\mathcal{Z}\{x[n-k]\} = z^{-k}X(z)$ for a sequence zero before $n=0$ |
| Standard pairs | $\delta[n] \to 1$; $u[n] \to z/(z-1)$; $a^n u[n] \to z/(z-a)$ |
| Initial, final value | $x[0] = \lim_{z\to\infty}X(z)$; $x[\infty] = \lim_{z\to1}(z-1)X(z)$, if it converges |
| Transfer function | $H(z) = (b_0 + b_1z^{-1} + \cdots)/(1 + a_1z^{-1} + \cdots)$, identical to the difference equation |
| Difference equation | $y[n] = \sum_k b_k x[n-k] - \sum_k a_k y[n-k]$ |
| Direct feedthrough | $b_0$: this frame's input affecting this frame's output — a zero-time computation, which no computer performs |
| DC gain | $H(1) = \sum b_k / (1 + \sum a_k)$ — the first check on any coefficient set |
| Frequency response | $H(e^{j\omega T})$, periodic with period $f_s$, meaningful from DC to $f_s/2$ |
| Backward difference | $D(z) = (1 - z^{-1})/T$: magnitude $\omega\,\mathrm{sinc}(\omega T/2)$, phase $90^\circ - 180^\circ f/f_s$ |

The next lesson puts geometry on all of this: where a continuous pole lands when it is sampled, why the unit circle is the stability boundary, and how to read damping and settling time off a point in the $z$ plane.
