---
id: l03-z-transform-discrete-tf
title: The z-transform and discrete transfer functions
minutes: 18
covers:
  - The z-transform and discrete transfer functions
---

The last two lessons patched continuous results: a folding formula for the sampler, a factor $e^{-sT/2}$ for the hold. That is fine for a phase budget. It stops working the moment the controller itself is discrete, because a flight computer does not run a differential equation. It runs a **difference equation** — a rule that computes this frame's output from numbers saved in earlier frames. You need an algebra that treats lists of numbers the way the Laplace transform treats smooth signals: one that turns the loop of code into a ratio of polynomials you can factor, plot and reason about.

That algebra is the **[[z-transform|z-name]]**. Think of the Laplace transform as a translator. It turns "take the derivative" into "multiply by $s$". The z-transform is a translator too. It turns "wait one sample" into "multiply by $z^{-1}$". And waiting — remembering last frame's number — is the only memory a difference equation has. Everything else follows from that.

This lesson builds the transform and its few key properties, defines the discrete transfer function, and shows how to move both ways between a transfer function and the code that runs it. It ends with frequency response on the unit circle, which is how a discrete filter's Bode plot is drawn. Why that circle is also the stability boundary is the next lesson.

## Definition

Take a sequence $x[n]$ that starts at $n = 0$. Its one-sided z-transform is

$$
X(z) = \mathcal{Z}\{x[n]\} = \sum_{n=0}^{\infty} x[n]\,z^{-n}.
$$

Read $\mathcal{Z}\{x[n]\}$ as "the z-transform of x of n". Here $z$ is a complex number. Each sample gets tagged with a power of $z^{-1}$ that records *when* it happened: $x[0]$ with $z^0$, $x[1]$ with $z^{-1}$, $x[2]$ with $z^{-2}$. It is like writing a list as a polynomial whose powers are the frame numbers.

One-sided — starting at $n = 0$ — is the right choice. Flight software powers on at a definite instant. Everything before $n = 0$ is a question of initialization, not of history.

The sum only adds up to a finite value for $z$ outside some circle, $|z| > R$. That zone is the **[[region of convergence|roc]]**. For every sequence in this module, the transform is a ratio of polynomials, and the region of convergence is everything outside the largest pole's circle. It matters for inverting transforms rigorously and rarely changes an engineering answer, so we will not labor it.

Three transforms do most of the work.

**The unit sample** $\delta[n]$ is $1$ at $n = 0$ and $0$ after. Only one term survives:

$$
\mathcal{Z}\{\delta[n]\} = 1.
$$

**The unit step** $u[n]$ is $1$ for every $n \ge 0$. The sum is a **[[geometric series|geometric-series]]** with ratio $z^{-1}$:

$$
\mathcal{Z}\{u[n]\} = \sum_{n=0}^{\infty} z^{-n} = \frac{1}{1 - z^{-1}} = \frac{z}{z - 1}.
$$

**The geometric sequence** $a^n u[n]$ — the discrete cousin of an exponential, and the impulse response of every first-order filter you will write — gives

$$
\mathcal{Z}\{a^n u[n]\} = \sum_{n=0}^{\infty} (a z^{-1})^n = \frac{1}{1 - a z^{-1}} = \frac{z}{z - a}.
$$

Set $a = e^{-\sigma T}$ and this is the transform of a sampled continuous exponential $e^{-\sigma nT}$. That is the bridge between the two worlds, and the subject of the next lesson.

## The one property that matters: delay

Take a sequence and slide it one sample later, so the new sequence is $x[n-1]$. Its transform is the old one times $z^{-1}$.

**A delay of one sample is multiplication by $z^{-1}$.** A delay of $k$ samples is $z^{-k}$. This is the whole reason the transform exists. It is why flight code and z-domain algebra are the same object written two ways. In code, a delay is [[a variable holding last frame's value|delay-box]]. In the algebra, it is a factor of $z^{-1}$.

::: note Why it has to be true
Assume $x[n] = 0$ for $n < 0$. Transform the shifted sequence, then rename the counter $m = n - 1$:

$$
\sum_{n=0}^{\infty} x[n-1] z^{-n}
= \sum_{m=-1}^{\infty} x[m] z^{-(m+1)}
= z^{-1}\sum_{m=0}^{\infty} x[m] z^{-m}
= z^{-1} X(z).
$$

The middle step drops the $m = -1$ term, because $x[-1] = 0$, and pulls one factor of $z^{-1}$ out of every term. What is left is the original transform.
:::

If the sequence is *not* zero before $n = 0$ — say a controller is restarted in flight with its state carried over — the shift picks up the starting value:

$$
\mathcal{Z}\{x[n-1]\} = z^{-1}X(z) + x[-1].
$$

That extra term is how **[[bumpless transfer|bumpless]]** is analyzed. It is also why the reset value of every delay register in a flight controller is a written-down, documented number — not whatever happened to be in memory.

The other properties are short.

- **Linearity:** $\mathcal{Z}\{\alpha x[n] + \beta y[n]\} = \alpha X(z) + \beta Y(z)$, straight from the sum.
- **Convolution:** $\mathcal{Z}\{\sum_k h[k] x[n-k]\} = H(z)X(z)$, by applying the delay property term by term. Running a sequence through a filter becomes multiplication.
- **Initial value:** $x[0] = \lim_{z\to\infty} X(z)$, since every other term carries a negative power of $z$ and vanishes.
- **Final value:** if the sequence settles,

$$
\lim_{n\to\infty} x[n] = \lim_{z\to 1}\,(z - 1)X(z).
$$

That is the discrete twin of $\lim_{s\to 0} sF(s)$, with the same warning: the limit means nothing unless the sequence really does settle. Check the poles first.

## Difference equation to transfer function and back

A linear, time-invariant, **causal** filter — one that never uses the future — computes each output from present and past inputs and past outputs:

$$
y[n] = b_0 x[n] + b_1 x[n-1] + \cdots + b_M x[n-M] - a_1 y[n-1] - \cdots - a_N y[n-N].
$$

The $b_k$ ("b sub k") weight the inputs; the $a_k$ weight the past outputs. The minus signs on the $a_k$ are a convention, chosen so the denominator below comes out with plus signs. Transform every term with the delay property and gather the $Y$ terms on the left:

$$
Y(z)\left(1 + a_1 z^{-1} + \cdots + a_N z^{-N}\right)
= X(z)\left(b_0 + b_1 z^{-1} + \cdots + b_M z^{-M}\right).
$$

Divide, and you have the **discrete transfer function**:

$$
H(z) = \frac{Y(z)}{X(z)} = \frac{b_0 + b_1 z^{-1} + \cdots + b_M z^{-M}}{1 + a_1 z^{-1} + \cdots + a_N z^{-N}}.
$$

The map runs both ways with no work at all. A transfer function written in negative powers of $z$, with a leading $1$ in the denominator, *is* the difference equation, coefficient for coefficient. Reading a filter out of flight code and reading it off a Bode plot are the same act.

Multiply top and bottom by $z^N$ and you get the positive-power form, $H(z) = (b_0 z^N + b_1 z^{N-1} + \cdots)/(z^N + a_1 z^{N-1} + \cdots)$. Its top's roots are the **zeros**; its bottom's roots are the **poles**. Both forms appear constantly. The negative-power form matches the code. The positive-power form is the one you factor.

Causality gives two structural facts. First, the filter cannot use $x[n+1]$, so once the denominator leads with $z^N$, no higher power of $z$ appears on top: the transfer function is **[[proper|proper-word]]**. Second, $b_0$ is the **direct feedthrough**: the part of this frame's output that depends on this frame's input. A filter with $b_0 \ne 0$ assumes the computer can read the sensor and write the actuator in zero time. It cannot. The lesson on computational delay in this module deals with what to do about that.

::: key
**Discrete transfer function.** $H(z) = \big(b_0 + b_1 z^{-1} + \cdots\big)/\big(1 + a_1 z^{-1} + \cdots\big)$, where $z^{-1}$ is a delay of one sample. The coefficients are the difference equation the flight computer runs, read straight off. Poles are the roots of the denominator in $z$; the DC gain is $H(1)$; the frequency response is $H(e^{j\omega T})$ for $0 \le \omega \le \pi/T$.
:::

## DC gain and frequency response

**DC gain.** Feed in $x[n] = 1$ forever and wait for the output to settle at some constant $y_\infty$. Now every delayed input is also $1$, and every delayed output is $y_\infty$. The difference equation collapses to $y_\infty(1 + a_1 + \cdots) = (b_0 + b_1 + \cdots)$:

$$
\text{DC gain} = \frac{\sum_k b_k}{1 + \sum_k a_k} = H(1).
$$

That is the fastest check you can run on any discrete filter. Add up the top coefficients, add up the bottom ones, divide. If a notch or a smoother does not come out at exactly $1$, a coefficient is wrong.

**Frequency response.** Feed in a sampled complex sine, $x[n] = e^{j\omega n T}$. By the delay property, each $x[n-k]$ is $e^{-j\omega kT}$ times $x[n]$. So the steady output is $x[n]$ multiplied by $H(z)$ evaluated at $z = e^{j\omega T}$:

$$
H(e^{j\omega T}) = \frac{\sum_k b_k e^{-j\omega k T}}{1 + \sum_k a_k e^{-j\omega k T}} .
$$

So the frequency moves around the **[[unit circle|unit-circle-picture]]** — the circle of radius 1 in the complex plane — instead of up the imaginary axis. Two things follow. The response is periodic: $\omega$ and $\omega + \omega_s$ land on the same point of the circle, so they get the same response. That is aliasing again, seen from the frequency side. And the useful range is half a turn, $\omega T$ from $0$ to $\pi$ — DC to Nyquist. Past $\pi$, the circle retraces mirror-image values.

::: example An exponential filter, in both domains
Rate readings from a gyro at $f_s = 200\,\mathrm{Hz}$ are smoothed with the recursion every embedded engineer has written:

$$
y[n] = a\,y[n-1] + (1 - a)\,x[n].
$$

In words: the new output is mostly the old output, nudged a little toward the new reading. Choose $a$ to match a continuous first-order lag with time constant $\tau = 50\,\mathrm{ms}$, by putting the discrete pole where the sampled continuous pole would be. With $T = 5\,\mathrm{ms}$, $a = e^{-T/\tau} = e^{-0.1} = 0.904837$, so $1 - a = 0.095163$.

**Transfer function.** Read it off: $b_0 = 0.095163$ and $a_1 = -0.904837$ (the minus sign because the code *adds* $a\,y[n-1]$). So

$$
H(z) = \frac{0.095163}{1 - 0.904837\,z^{-1}} = \frac{0.095163\,z}{z - 0.904837}.
$$

One pole at $z = 0.904837$, one zero at $z = 0$, and direct feedthrough $b_0 = 0.095163$.

**DC gain.** $\sum b_k = 0.095163$ and $1 + \sum a_k = 1 - 0.904837 = 0.095163$. So $H(1) = 1$ exactly. A steady rate passes through unchanged, as a smoother's should.

**Impulse response.** From the geometric-sequence pair, $h[n] = 0.095163 \times 0.904837^n$. So $h[0] = 0.095163$ and $h[10] = 0.035008$ — it shrinks by a factor $e^{-1}$ every $\tau/T = 10$ samples.

**Step response.** Add up the impulse response: $s[n] = 1 - a^{n+1} = 1 - e^{-(n+1)T/\tau}$. That is the continuous step response read at $t = (n+1)T$. At $n = 9$ it is $1 - e^{-1} = 0.632121$ — the familiar $63\%$ after one time constant.

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

The sizes agree to within half a percent across the useful band. The phases do not, and the gap is familiar: $0.44^\circ$, $2.66^\circ$, $8.85^\circ$, against half a sample, $180^\circ f/f_s = 0.45^\circ$, $2.70^\circ$, $9.00^\circ$. The discrete filter *leads* the continuous one by very nearly half a sample. Its direct feedthrough lets $x[n]$ affect $y[n]$ in the same frame, which no physical lag can do. Its low-frequency **[[group delay|group-delay-discrete]]** is $aT/(1-a) = 47.54\,\mathrm{ms}$, against the continuous $\tau = 50\,\mathrm{ms}$.

That half sample is not free money. It is exactly what the zero-order hold takes back when the output is written to a converter. That is why this filter and a ZOH-equivalent version of the same lag differ by one factor of $z^{-1}$.
:::

::: example What a backward difference really computes
Rate from position, or acceleration from rate, is usually found with a two-tap difference — "this reading minus the last one, divided by the time between":

$$
d[n] = \frac{x[n] - x[n-1]}{T}, \qquad D(z) = \frac{1 - z^{-1}}{T}.
$$

**Frequency response.** Use the same half-angle trick as for the hold, pulling out $e^{-j\omega T/2}$:

$$
D(e^{j\omega T}) = \frac{1 - e^{-j\omega T}}{T}
= \frac{2}{T}\sin\!\left(\frac{\omega T}{2}\right) e^{\,j(\pi/2 - \omega T/2)} .
$$

**Compare with the ideal.** A perfect differentiator has response $j\omega$: size $\omega$, phase exactly $+90^\circ$. The backward difference has

$$
\frac{|D|}{\omega} = \frac{\sin(\omega T/2)}{\omega T/2},
\qquad
\angle D = 90^\circ - 180^\circ\frac{f}{f_s}.
$$

The same sinc and the same half-sample delay as the zero-order hold — for the same reason, since both are built from $1 - e^{-j\omega T}$. At $f_s = 200\,\mathrm{Hz}$:

| $f$ | $\lvert D \rvert$ | ideal $\omega$ | ratio | phase |
| --- | --- | --- | --- | --- |
| $1\,\mathrm{Hz}$ | $6.2829$ | $6.2832$ | $0.99996$ | $89.10^\circ$ |
| $10\,\mathrm{Hz}$ | $62.574$ | $62.832$ | $0.99589$ | $81.00^\circ$ |
| $20\,\mathrm{Hz}$ | $123.61$ | $125.66$ | $0.98363$ | $72.00^\circ$ |
| $50\,\mathrm{Hz}$ | $282.84$ | $314.16$ | $0.90032$ | $45.00^\circ$ |

**Sanity check.** At $1\,\mathrm{Hz}$, far below the sample rate, the difference is almost perfect. It degrades as $f$ climbs toward Nyquist, as it should.

**The design consequence** is in the phase column. A PD controller exists for the phase lead its derivative term supplies at crossover. A backward difference delivers $90^\circ$ minus half a sample. At a crossover of one tenth of the sample rate you get $72^\circ$ of lead instead of $90^\circ$. That $18^\circ$ shortfall appears nowhere in the continuous design, and it comes on top of the zero-order hold's own $18^\circ$ on the way out. The size error, meanwhile, is under $2\%$ in the same range and can be ignored.
:::

::: warning
Two notation traps cause most sign errors in discrete control code.

**$z$ versus $z^{-1}$.** $H(z) = (b_0 + b_1 z^{-1})/(1 + a_1 z^{-1})$ and $H(z) = (b_0 z + b_1)/(z + a_1)$ are the same filter with the same coefficients. But if you factor the first as a polynomial in $z^{-1}$, its roots are the *reciprocals* of the poles. Always factor the positive-power form.

**The sign of $a_k$.** With the convention here — denominator $1 + a_1 z^{-1} + \cdots$ — the difference equation has $-a_1 y[n-1]$, with a minus. Most digital-filter libraries use this convention. Some textbooks write $y[n] = \cdots + a_1 y[n-1]$ with a plus and flip the denominator's sign. A pole at $z = +0.9$ is a smooth decay; a pole at $z = -0.9$ **[[flips sign every sample|alternating-pole]]**. Get the convention backwards and a smoother can become a filter that rings at Nyquist, or one that diverges. Check the DC gain $H(1)$ before believing any set of coefficients — it catches this at once.
:::

## Check yourself

::: check
A discrete filter is $H(z) = \dfrac{0.2 z}{z - 0.8}$ at $f_s = 100\,\mathrm{Hz}$. Write the difference equation, state the DC gain, and find how many samples the impulse response takes to fall below $1\%$ of its first value.
:::

::: answer
**Difference equation.** Divide top and bottom by $z$: $H(z) = 0.2/(1 - 0.8z^{-1})$. So $Y(1 - 0.8z^{-1}) = 0.2X$, which in the time domain is

$$
y[n] = 0.8\,y[n-1] + 0.2\,x[n].
$$

**DC gain.** $\sum b_k / (1 + \sum a_k) = 0.2/(1 - 0.8) = 1$. A unity-gain smoother.

**Decay.** $h[n] = 0.2 \times 0.8^n$. Falling below $1\%$ of $h[0]$ needs $0.8^n < 0.01$, so $n > \ln(0.01)/\ln(0.8) = 20.6$. That is $n = 21$ samples, or $210\,\mathrm{ms}$ at $100\,\mathrm{Hz}$.

**Sanity check.** The matching continuous time constant is $\tau = -T/\ln(0.8) = 0.01/0.2231 = 44.8\,\mathrm{ms}$. And $210\,\mathrm{ms}$ is about $4.7\tau$; $e^{-4.7} \approx 0.009$, a hair under $1\%$. Consistent.
:::

::: check
Use the final value theorem to find the steady output of $H(z) = (0.1 + 0.1z^{-1})/(1 - 0.9 z^{-1} + 0.1 z^{-2})$ driven by a unit step, then check it against $H(1)$.
:::

::: answer
The step transforms to $X(z) = z/(z-1)$, so $Y(z) = H(z)\,z/(z-1)$ and

$$
\lim_{n\to\infty} y[n] = \lim_{z\to1} (z-1)\,H(z)\,\frac{z}{z-1} = H(1)\cdot 1 = H(1).
$$

The $(z-1)$ factors cancel. That is the whole content of the theorem for a step: the settled step response *is* the DC gain. Evaluate: $H(1) = (0.1 + 0.1)/(1 - 0.9 + 0.1) = 0.2/0.2 = 1$.

Before trusting it, check that the output settles. The denominator in positive powers is $z^2 - 0.9z + 0.1$, with roots $z = (0.9 \pm \sqrt{0.81 - 0.4})/2 = (0.9 \pm 0.6403)/2$: that is $0.7702$ and $0.1298$. Both are **[[inside the unit circle|stability-bridge]]**, so the response settles and the limit means something. Had a root been outside, the algebra would still have said "1", and the answer would have been nonsense.
:::

::: check
Why is the frequency response of a discrete filter periodic, and what is the highest frequency at which it is meaningful to ask for the response?
:::

::: answer
The response is $H(e^{j\omega T})$, and $e^{j\omega T}$ does not change when $\omega T$ grows by $2\pi$ — that is, when $\omega$ grows by $\omega_s = 2\pi/T$. So $H$ repeats every $f_s$ in frequency. This is not a quirk of the algebra. It is aliasing seen from the frequency side. The filter only sees samples, and two sines whose frequencies differ by $f_s$ produce identical samples, so no filter can treat them differently.

The meaningful range is $0$ to $f_s/2$. Above Nyquist, the point $e^{j\omega T}$ continues into the lower half of the circle, where the response is the complex conjugate of a frequency already covered — a mirror image, not new information. So a discrete Bode plot stops at Nyquist. Its axis is often drawn as $\omega T$ from $0$ to $\pi$, or $f/f_s$ from $0$ to $0.5$, to keep the sample rate in view.
:::

::: check
A colleague implements a notch as $y[n] = b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] + a_1 y[n-1] + a_2 y[n-2]$, using $b = [0.9391, -1.7601, 0.9391]$ and $a = [-1.7601, 0.8782]$ from a design tool whose denominator convention is $1 + a_1 z^{-1} + a_2 z^{-2}$. What goes wrong, and what one-line test catches it?
:::

::: answer
**The right code.** With the tool's convention, the difference equation is $y[n] = b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] - a_1 y[n-1] - a_2 y[n-2]$. So the correct code adds $+1.7601\,y[n-1]$ and $-0.8782\,y[n-2]$. Its denominator $z^2 - 1.7601z + 0.8782$ has a complex pair of poles at radius $\sqrt{0.8782} = 0.937$ and angle $\pm 0.351\,\mathrm{rad}$, tucked inside the unit circle beside the notch's zeros.

**What was coded.** The code applies $-1.7601\,y[n-1]$ and $+0.8782\,y[n-2]$ — *both* feedback signs flipped. Move them to the left side: $y[n] + 1.7601\,y[n-1] - 0.8782\,y[n-2] = \ldots$. The denominator is now $z^2 + 1.7601z - 0.8782$. Its roots are real: $z = 0.406$ and $z = -2.166$. The second is far outside the unit circle, so the filter is **unstable**. Its output flips sign every sample and grows by a factor of about $2.17$ each time. Fed a constant input of $1$, it reaches about $-5{,}500$ within twelve samples.

**The one-line test** is the DC gain. As intended, $H(1) = (0.9391 - 1.7601 + 0.9391)/(1 - 1.7601 + 0.8782) = 0.1181/0.1181 = 1.000$. As coded, the denominator at $z = 1$ becomes $1 + 1.7601 - 0.8782 = 1.8819$, so $H(1) = 0.1181/1.8819 = 0.063$. A unity-gain notch that claims to pass $6\%$ of a constant is wrong, and $\sum b / (1 + \sum a)$ takes a moment to check. Here the bench would show it too, violently — but flipping only $a_1$ mirrors the poles to angle $\pm 2.79\,\mathrm{rad}$, near Nyquist, where the filter stays stable and quietly notches the wrong frequency. That is when the DC check earns its keep.
:::

::: check
The delay property gives $\mathcal{Z}\{x[n-1]\} = z^{-1}X(z) + x[-1]$ when the sequence is not zero before $n = 0$. Why does that term matter in a flight controller, and what is the practice built on it called?
:::

::: answer
$x[-1]$ is the starting value of the delay register — the number sitting in the "last frame's value" variable when the filter begins to run. The transfer function assumes that number is zero. If it is not, the output carries an extra transient that the transfer function does not predict.

It matters whenever a filter or an integrator starts, restarts, or is switched into the loop: mode changes, handover from one guidance law to another, recovery after a detected fault, a channel coming out of standby. Setting the state so the new element's output starts at the value the old one was producing is called **bumpless transfer**. It amounts to choosing $x[-1]$, and the matching $y[-1]$, so the transient is zero. The alternative is a step command into the actuator at the moment of the switch — a visible jolt on a launch vehicle, and potentially far worse on a vehicle trying to land.
:::

## Summary

| Item | Statement |
| --- | --- |
| z-transform | $X(z) = \sum_{n\ge0} x[n] z^{-n}$ |
| Delay | $\mathcal{Z}\{x[n-k]\} = z^{-k}X(z)$ for a sequence that is zero before $n=0$ |
| Standard pairs | $\delta[n] \to 1$; $u[n] \to z/(z-1)$; $a^n u[n] \to z/(z-a)$ |
| Initial, final value | $x[0] = \lim_{z\to\infty}X(z)$; $x[\infty] = \lim_{z\to1}(z-1)X(z)$, if it settles |
| Transfer function | $H(z) = (b_0 + b_1z^{-1} + \cdots)/(1 + a_1z^{-1} + \cdots)$, identical to the difference equation |
| Difference equation | $y[n] = \sum_k b_k x[n-k] - \sum_k a_k y[n-k]$ |
| Direct feedthrough | $b_0$: this frame's input affecting this frame's output — a zero-time computation no computer performs |
| DC gain | $H(1) = \sum b_k / (1 + \sum a_k)$ — the first check on any set of coefficients |
| Frequency response | $H(e^{j\omega T})$, periodic with period $f_s$, meaningful from DC to $f_s/2$ |
| Backward difference | $D(z) = (1 - z^{-1})/T$: size $\omega\,\mathrm{sinc}(\omega T/2)$, phase $90^\circ - 180^\circ f/f_s$ |

The next lesson puts geometry on all of this: where a continuous pole lands when it is sampled, why the unit circle is the stability boundary, and how to read damping and settling time off a point in the $z$ plane.

::: context z-name Where the z-transform came from
Engineers working on radar and gun-control systems in the 1940s needed to analyze loops with samplers in them. Witold Hurewicz worked out much of the mathematics during the Second World War. In 1952 John Ragazzini and Lotfi Zadeh at Columbia University published the method under the name "z-transform", and the name stuck.

The same sum had been used long before by mathematicians under the name **generating function**: a way of packing a whole list of numbers into one function, so that operations on the list become algebra on the function.
:::

::: context roc Where the sum adds up
An infinite sum only makes sense if its terms shrink fast enough. For $\sum a^n z^{-n}$, the terms shrink when $|a/z| < 1$, that is when $|z| > |a|$. So the transform $z/(z - a)$ is valid outside a circle of radius $|a|$.

Engineers mostly ignore this because the answer is always the same for causal filters: outside the biggest pole. It matters when you invert a transform by hand, since the same formula with a different region of convergence describes a different sequence — one that runs backward in time.
:::

::: context geometric-series Why the geometric series adds up to that
Call the sum $S = 1 + r + r^2 + r^3 + \cdots$. Multiply it by $r$: $rS = r + r^2 + r^3 + \cdots$. That is the same list without the first term, so $S - rS = 1$, and

$$
S = \frac{1}{1 - r}.
$$

It works whenever $|r| < 1$, so the terms shrink to nothing. With $r = z^{-1}$ you get the step's transform; with $r = az^{-1}$, the geometric sequence's. The whole z-transform table is built from this one trick.
:::

::: context delay-box The delay is one variable
Here is the exponential smoother from the worked example as a block diagram. Every $z^{-1}$ box is a place where last frame's number waits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 194" font-family="Inter, Arial, sans-serif">
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/></marker></defs>
<text x="14" y="55" font-size="13" fill="#1f2a44" text-anchor="start">x[n]</text>
<line x1="44" y1="50" x2="90" y2="50" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
<rect x="90" y="34" width="64" height="32" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
<text x="122.0" y="55.0" font-size="13" fill="#1f2a44" text-anchor="middle">× (1−a)</text>
<line x1="154" y1="50" x2="196" y2="50" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
<circle cx="206" cy="50" r="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
<text x="206" y="55" font-size="14" fill="#1f2a44" text-anchor="middle">+</text>
<line x1="216" y1="50" x2="300" y2="50" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
<text x="304" y="55" font-size="13" fill="#1f2a44" text-anchor="start">y[n]</text>
<line x1="258" y1="50" x2="258" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="258" y1="120" x2="238" y2="120" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
<rect x="186" y="104" width="52" height="32" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
<text x="212.0" y="125.0" font-size="13" fill="#1f2a44" text-anchor="middle">z⁻¹</text>
<text x="212" y="154" font-size="11" fill="#1d6fd1" text-anchor="middle">hold last frame</text>
<line x1="186" y1="120" x2="150" y2="120" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
<rect x="110" y="104" width="40" height="32" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
<text x="130.0" y="125.0" font-size="13" fill="#1f2a44" text-anchor="middle">× a</text>
<line x1="110" y1="120" x2="80" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="80" y1="120" x2="80" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="80" y1="84" x2="198" y2="58" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
<text x="14" y="184" font-size="12" fill="#1f2a44" text-anchor="start">In code the z⁻¹ box is one variable: y_prev = y</text>
</svg>
```

In code the whole diagram is two lines: `y = a * y_prev + (1 - a) * x`, then `y_prev = y`. The number of delay boxes is the number of state variables the routine must keep between frames — here, one.
:::

::: context bumpless Switching without a jolt
Flight software changes controllers all the time. A launch vehicle moves through flight phases with different gain sets. A lander hands over from one guidance law to another for the final descent. A spacecraft drops into safe mode after a fault.

Each switch starts a filter or integrator whose memory must be set to something. Set it to zero and the new controller's first output can be very different from the old one's last — a step into the actuator. **Bumpless transfer** means setting the new controller's internal state so its first output matches what was being commanded, so the actuator sees a smooth handover.
:::

::: context proper-word Proper: no peeking at the future
A transfer function is **proper** when the top's degree is no higher than the bottom's. In $z$, a higher power on top would mean the output depends on $x[n+1]$ — an input that has not arrived yet. No real-time code can do that.

It is **strictly proper** when the top's degree is strictly lower, which means $b_0 = 0$: the output at frame $n$ depends only on inputs up to $n - 1$. That is the form that honestly leaves time to compute.
:::

::: context unit-circle-picture Frequency is an angle
On the unit circle, frequency is an angle: $f$ sits at angle $2\pi f/f_s$ from the positive real axis. DC is at $z = 1$. A quarter of the sample rate is at the top, $z = j$. Nyquist is at $z = -1$, halfway round.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<line x1="30" y1="105" x2="240" y2="105" stroke="#6c7a93"/>
<line x1="130" y1="7" x2="130" y2="203" stroke="#6c7a93"/>
<circle cx="130" cy="105" r="76" fill="none" stroke="#1f2a44" stroke-width="2"/>
<polyline points="215.0,92.1 214.3,88.1 213.4,84.0 212.3,80.0 211.0,76.1 209.5,72.2 207.8,68.4 206.0,64.7 204.0,61.1 201.8,57.6 199.4,54.2 196.9,50.9 194.2,47.8 191.4,44.8 188.4,41.9 185.3,39.1 182.1,36.5 178.7,34.1 175.2,31.9 171.7,29.8 168.0,27.8 164.2,26.1 160.4,24.5 156.5,23.2 152.5,22.0 148.5,21.0 144.4,20.2 140.3,19.6 136.2,19.2 132.1,19.0 127.9,19.0 123.8,19.2 119.7,19.6 115.6,20.2 111.5,21.0 107.5,22.0 103.5,23.2 99.6,24.5 95.8,26.1 92.0,27.8 88.3,29.8 84.8,31.9 81.3,34.1 77.9,36.5 74.7,39.1 71.6,41.9 68.6,44.8 65.8,47.8 63.1,50.9 60.6,54.2 58.2,57.6 56.0,61.1 54.0,64.7 52.2,68.4 50.5,72.2 49.0,76.1 47.7,80.0 46.6,84.0 45.7,88.1 45.0,92.1" fill="none" stroke="#1d6fd1" stroke-width="2" marker-end="url(#ah2)"/>
<defs><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1d6fd1"/></marker></defs>
<circle cx="206" cy="105" r="4" fill="#1d6fd1"/>
<circle cx="54" cy="105" r="4" fill="#1d6fd1"/>
<circle cx="130" cy="29" r="4" fill="#1d6fd1"/>
<line x1="193.8" y1="100" x2="203.8" y2="110" stroke="#b4232c" stroke-width="2.2"/><line x1="193.8" y1="110" x2="203.8" y2="100" stroke="#b4232c" stroke-width="2.2"/>
<circle cx="130" cy="105" r="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
<text x="212" y="123" font-size="11" fill="#1d6fd1" text-anchor="start">z = 1: DC</text>
<text x="58" y="123" font-size="11" fill="#1d6fd1" text-anchor="start">z = −1: fs/2</text>
<text x="138" y="23" font-size="11" fill="#1d6fd1" text-anchor="start">fs/4</text>
<text x="250" y="34" font-size="12" fill="#b4232c" text-anchor="start">x  pole at 0.905</text>
<text x="250" y="52" font-size="12" fill="#b4232c" text-anchor="start">o  zero at 0</text>
<text x="250" y="168" font-size="12" fill="#1f2a44" text-anchor="start">frequency f sits</text>
<text x="250" y="184" font-size="12" fill="#1f2a44" text-anchor="start">at angle 2πf/fs</text>
</svg>
```

The smoother from the worked example has its pole at $0.905$, close to $z = 1$. Near DC the point on the circle is close to the pole, so the response is large; near Nyquist it is far away, so the response is small. That is a low-pass filter, read straight off the picture.
:::

::: context group-delay-discrete Group delay of the smoother
For low frequencies, a filter acts like a pure delay $\tau_0$, with lag $\omega\tau_0$. For $H(z) = (1 - a)/(1 - az^{-1})$, expanding the phase for small $\omega T$ gives $\tau_0 = aT/(1 - a)$.

With $a = 0.904837$ and $T = 5\,\mathrm{ms}$: $0.904837 \times 0.005/0.095163 = 47.54\,\mathrm{ms}$. The continuous lag has $\tau = 50\,\mathrm{ms}$. The difference, $2.46\,\mathrm{ms}$, is very nearly half a $5\,\mathrm{ms}$ sample — the same half sample the phase comparison showed.
:::

::: context alternating-pole Where a pole sits changes how it moves
A single pole at $p$ has impulse response $p^n$. At $p = +0.9$ each sample is $90\%$ of the last: a smooth decay. At $p = -0.9$ each sample is $90\%$ of the last *with the sign flipped*: an oscillation at exactly the Nyquist frequency, shrinking at the same rate.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
<line x1="20" y1="90" x2="170" y2="90" stroke="#6c7a93"/>
<line x1="24.0" y1="90" x2="24.0" y2="30.0" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="24.0" cy="30.0" r="2.8" fill="#1d6fd1"/>
<line x1="33.5" y1="90" x2="33.5" y2="36.0" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="33.5" cy="36.0" r="2.8" fill="#1d6fd1"/>
<line x1="43.0" y1="90" x2="43.0" y2="41.4" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="43.0" cy="41.4" r="2.8" fill="#1d6fd1"/>
<line x1="52.5" y1="90" x2="52.5" y2="46.3" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="52.5" cy="46.3" r="2.8" fill="#1d6fd1"/>
<line x1="62.0" y1="90" x2="62.0" y2="50.6" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="62.0" cy="50.6" r="2.8" fill="#1d6fd1"/>
<line x1="71.5" y1="90" x2="71.5" y2="54.6" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="71.5" cy="54.6" r="2.8" fill="#1d6fd1"/>
<line x1="81.0" y1="90" x2="81.0" y2="58.1" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="81.0" cy="58.1" r="2.8" fill="#1d6fd1"/>
<line x1="90.5" y1="90" x2="90.5" y2="61.3" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="90.5" cy="61.3" r="2.8" fill="#1d6fd1"/>
<line x1="100.0" y1="90" x2="100.0" y2="64.2" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="100.0" cy="64.2" r="2.8" fill="#1d6fd1"/>
<line x1="109.5" y1="90" x2="109.5" y2="66.8" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="109.5" cy="66.8" r="2.8" fill="#1d6fd1"/>
<line x1="119.0" y1="90" x2="119.0" y2="69.1" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="119.0" cy="69.1" r="2.8" fill="#1d6fd1"/>
<line x1="128.5" y1="90" x2="128.5" y2="71.2" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="128.5" cy="71.2" r="2.8" fill="#1d6fd1"/>
<line x1="138.0" y1="90" x2="138.0" y2="73.1" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="138.0" cy="73.1" r="2.8" fill="#1d6fd1"/>
<line x1="147.5" y1="90" x2="147.5" y2="74.7" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="147.5" cy="74.7" r="2.8" fill="#1d6fd1"/>
<line x1="157.0" y1="90" x2="157.0" y2="76.3" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="157.0" cy="76.3" r="2.8" fill="#1d6fd1"/>
<line x1="166.5" y1="90" x2="166.5" y2="77.6" stroke="#1d6fd1" stroke-width="2"/>
<circle cx="166.5" cy="77.6" r="2.8" fill="#1d6fd1"/>
<text x="95" y="166" font-size="12" fill="#1d6fd1" text-anchor="middle">pole at +0.9:</text>
<text x="95" y="182" font-size="12" fill="#1d6fd1" text-anchor="middle">smooth decay</text>
<line x1="190" y1="90" x2="340" y2="90" stroke="#6c7a93"/>
<line x1="194.0" y1="90" x2="194.0" y2="30.0" stroke="#b4232c" stroke-width="2"/>
<circle cx="194.0" cy="30.0" r="2.8" fill="#b4232c"/>
<line x1="203.5" y1="90" x2="203.5" y2="144.0" stroke="#b4232c" stroke-width="2"/>
<circle cx="203.5" cy="144.0" r="2.8" fill="#b4232c"/>
<line x1="213.0" y1="90" x2="213.0" y2="41.4" stroke="#b4232c" stroke-width="2"/>
<circle cx="213.0" cy="41.4" r="2.8" fill="#b4232c"/>
<line x1="222.5" y1="90" x2="222.5" y2="133.7" stroke="#b4232c" stroke-width="2"/>
<circle cx="222.5" cy="133.7" r="2.8" fill="#b4232c"/>
<line x1="232.0" y1="90" x2="232.0" y2="50.6" stroke="#b4232c" stroke-width="2"/>
<circle cx="232.0" cy="50.6" r="2.8" fill="#b4232c"/>
<line x1="241.5" y1="90" x2="241.5" y2="125.4" stroke="#b4232c" stroke-width="2"/>
<circle cx="241.5" cy="125.4" r="2.8" fill="#b4232c"/>
<line x1="251.0" y1="90" x2="251.0" y2="58.1" stroke="#b4232c" stroke-width="2"/>
<circle cx="251.0" cy="58.1" r="2.8" fill="#b4232c"/>
<line x1="260.5" y1="90" x2="260.5" y2="118.7" stroke="#b4232c" stroke-width="2"/>
<circle cx="260.5" cy="118.7" r="2.8" fill="#b4232c"/>
<line x1="270.0" y1="90" x2="270.0" y2="64.2" stroke="#b4232c" stroke-width="2"/>
<circle cx="270.0" cy="64.2" r="2.8" fill="#b4232c"/>
<line x1="279.5" y1="90" x2="279.5" y2="113.2" stroke="#b4232c" stroke-width="2"/>
<circle cx="279.5" cy="113.2" r="2.8" fill="#b4232c"/>
<line x1="289.0" y1="90" x2="289.0" y2="69.1" stroke="#b4232c" stroke-width="2"/>
<circle cx="289.0" cy="69.1" r="2.8" fill="#b4232c"/>
<line x1="298.5" y1="90" x2="298.5" y2="108.8" stroke="#b4232c" stroke-width="2"/>
<circle cx="298.5" cy="108.8" r="2.8" fill="#b4232c"/>
<line x1="308.0" y1="90" x2="308.0" y2="73.1" stroke="#b4232c" stroke-width="2"/>
<circle cx="308.0" cy="73.1" r="2.8" fill="#b4232c"/>
<line x1="317.5" y1="90" x2="317.5" y2="105.3" stroke="#b4232c" stroke-width="2"/>
<circle cx="317.5" cy="105.3" r="2.8" fill="#b4232c"/>
<line x1="327.0" y1="90" x2="327.0" y2="76.3" stroke="#b4232c" stroke-width="2"/>
<circle cx="327.0" cy="76.3" r="2.8" fill="#b4232c"/>
<line x1="336.5" y1="90" x2="336.5" y2="102.4" stroke="#b4232c" stroke-width="2"/>
<circle cx="336.5" cy="102.4" r="2.8" fill="#b4232c"/>
<text x="265" y="166" font-size="12" fill="#b4232c" text-anchor="middle">pole at −0.9:</text>
<text x="265" y="182" font-size="12" fill="#b4232c" text-anchor="middle">flips every sample</text>
<text x="20" y="20" font-size="12" fill="#1f2a44" text-anchor="start">impulse response h[n] = pⁿ, n = 0 … 15</text>
</svg>
```

Same size, same decay, completely different behavior. That is why a single sign error in the feedback coefficients is so damaging.
:::

::: context stability-bridge Inside the circle means it settles
A pole at $p$ contributes a term like $p^n$. If $|p| < 1$, that term shrinks toward zero. If $|p| > 1$, it grows without limit. If $|p| = 1$, it neither grows nor shrinks.

So a discrete system settles when every pole is strictly inside the unit circle. The next lesson shows why this circle is the exact image of the $s$ plane's imaginary axis under $z = e^{sT}$, and how the left half plane lands inside it.
:::
