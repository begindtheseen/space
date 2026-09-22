---
id: l10-biquad-sections
title: Biquad sections for discrete filters and notches
minutes: 21
covers:
  - Biquad sections for discrete filters and notches
---

A flight controller is mostly filters. Between the sensor and the actuator there is a roll-off to keep high-frequency noise out of the derivative path, one notch per structural mode the design has to suppress, sometimes a lead network, and whatever the estimator needs. Each is second order or can be factored into second-order pieces, and each is written in the same small block of code.

That block is the **biquad** — a second-order section, two poles and two zeros, five coefficients and two state words. It is the unit of discrete filtering in the same way the second-order transfer function is the unit of continuous analysis, and for the same reason: complex poles come in conjugate pairs, so second order is the smallest piece with real coefficients that can represent a resonance.

This lesson gives the biquad, the three standard ways to arrange its arithmetic and why one of them is preferred, the closed-form coefficients for a notch, and the reason a sixth-order filter is built from three biquads rather than from one sixth-order polynomial. That last point is not a matter of taste: at a $1\,\mathrm{kHz}$ frame rate the polynomial version with sixteen-bit coefficients is unstable and the cascade is correct to six digits.

## The biquad

A second-order section computes

$$
y[n] = b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] - a_1 y[n-1] - a_2 y[n-2],
$$

which is the transfer function

$$
H(z) = \frac{b_0 + b_1 z^{-1} + b_2 z^{-2}}{1 + a_1 z^{-1} + a_2 z^{-2}}
= \frac{b_0 z^2 + b_1 z + b_2}{z^2 + a_1 z + a_2}.
$$

Five coefficients, since $a_0$ is normalised to 1. The poles are the roots of $z^2 + a_1z + a_2$, read as the previous lessons described: radius $\sqrt{a_2}$, angle $\arccos(-a_1/(2\sqrt{a_2}))$, converted to $\zeta$ and $\omega_n$ with $T$. The DC gain is $(b_0+b_1+b_2)/(1+a_1+a_2)$, and the Nyquist gain is $(b_0-b_1+b_2)/(1-a_1+a_2)$; both are one line and both are worth computing for every coefficient set you are handed.

::: key
**Biquad section.** $y[n] = b_0x[n] + b_1x[n-1] + b_2x[n-2] - a_1y[n-1] - a_2y[n-2]$. Cascade biquads rather than implementing a high-order polynomial directly — conditioning degrades fast with order.
:::

## Three ways to arrange the arithmetic

The difference equation says what to compute, not in what order or with how much state. Three arrangements are standard.

**Direct form I** implements the equation literally: store $x[n-1]$, $x[n-2]$, $y[n-1]$, $y[n-2]$, four state words, and compute the whole sum in one accumulator. Its virtue in fixed point is that there is exactly one accumulation, so a wide accumulator guarantees no internal overflow even when individual products are large — only the final result has to fit the output word. Its cost is four state words per section instead of two.

**Direct form II** factors the section into the all-pole part and the all-zero part and shares the delays, giving two state words:

$$
w[n] = x[n] - a_1w[n-1] - a_2w[n-2],
\qquad
y[n] = b_0w[n] + b_1w[n-1] + b_2w[n-2].
$$

Fewer state words, and a serious problem in fixed point: $w[n]$ is the output of the all-pole part alone, with no zeros to restrain it. For a resonant section the poles can amplify by a factor of $Q$ before the zeros pull the result back down, so the internal node can be far larger than either the input or the output. Scaling the section so $w$ cannot overflow costs headroom — and therefore resolution — everywhere else.

**Transposed direct form II** reverses the signal flow graph, which leaves the transfer function unchanged and rearranges the arithmetic:

$$
\begin{aligned}
y[n] &= b_0\,x[n] + s_1, \\
s_1 &\leftarrow b_1\,x[n] - a_1\,y[n] + s_2, \\
s_2 &\leftarrow b_2\,x[n] - a_2\,y[n].
\end{aligned}
$$

Two state words, and both of them are partial sums of the output rather than the output of an unrestrained resonator. There is no internal node that can greatly exceed the input and output, so the scaling problem disappears. Five multiplies and four adds per sample, a fixed instruction count, no branches.

::: key
**Why transposed direct-form II.** It has the best numerical conditioning of the standard forms for fixed and floating point, with only two state words per section and no large intermediate accumulator growth.
:::

## The notch, in closed form

The notch from the classical control module is

$$
N(s) = \frac{s^2 + 2\zeta_n\omega_m s + \omega_m^2}{s^2 + 2\zeta_d\omega_m s + \omega_m^2},
$$

with $\omega_m$ the modal frequency, $\zeta_n \ll \zeta_d$, and depth $\zeta_n/\zeta_d$ at the centre. Discretize it with Tustin prewarped at $\omega_m$, so the notch lands exactly on the mode.

Substitute $s \to K(z-1)/(z+1)$ with $K = \omega_m/\tan(\omega_m T/2)$, and write $t = \tan(\omega_m T/2)$. The numerator becomes

$$
\frac{\omega_m^2}{t^2}(z-1)^2 + \frac{2\zeta_n\omega_m^2}{t}(z^2-1) + \omega_m^2(z+1)^2,
$$

and multiplying through by $t^2/\omega_m^2$ leaves a polynomial with no $\omega_m$ in it at all. Collecting powers of $z$, and doing the same for the denominator with $\zeta_d$:

$$
\begin{aligned}
b &= \big[\,1 + 2\zeta_n t + t^2,\ \ -2 + 2t^2,\ \ 1 - 2\zeta_n t + t^2\,\big], \\
a &= \big[\,1 + 2\zeta_d t + t^2,\ \ -2 + 2t^2,\ \ 1 - 2\zeta_d t + t^2\,\big],
\end{aligned}
$$

then divide both by $a_0$. Three features fall out immediately. The middle coefficients are identical, $b_1 = a_1$, which is the signature of a notch and a free check on any coefficient table. The DC gain is exactly 1, since summing each row gives $2t^2$ over $2t^2$. And the only place the sample rate enters is through $t$.

::: example A 200 Hz notch, coefficients and code
Build the $\omega_m = 18\,\mathrm{rad/s}$ notch — $2.8648\,\mathrm{Hz}$, matching a mode identified on the vehicle — with $\zeta_n = 0.02$ and $\zeta_d = 0.3$ at $f_s = 200\,\mathrm{Hz}$, and run it in transposed direct form II against a direct form I reference.

```python
import numpy as np


def biquad_df2t(b, a, x):
    """Transposed direct-form II biquad. b = [b0,b1,b2], a = [1,a1,a2]."""
    b0, b1, b2 = b
    _, a1, a2 = a
    s1 = s2 = 0.0
    y = np.empty_like(x)
    for n, xn in enumerate(x):
        yn = b0 * xn + s1                 # 1 multiply, 1 add
        s1 = b1 * xn - a1 * yn + s2       # 2 multiplies, 2 adds
        s2 = b2 * xn - a2 * yn            # 2 multiplies, 1 add
        y[n] = yn
    return y


def biquad_df1(b, a, x):
    """Direct form I, four state words, for comparison."""
    x1 = x2 = y1 = y2 = 0.0
    y = np.empty_like(x)
    for n, xn in enumerate(x):
        yn = b[0] * xn + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2
        x2, x1, y2, y1 = x1, xn, y1, yn
        y[n] = yn
    return y


# the 18 rad/s notch at 200 Hz, prewarped Tustin
wm, dt, zn, zd = 18.0, 0.005, 0.02, 0.3
t = np.tan(wm * dt / 2)
a0 = 1 + 2 * zd * t + t * t
b = np.array([1 + 2 * zn * t + t * t, -2 + 2 * t * t, 1 - 2 * zn * t + t * t]) / a0
a = np.array([a0, -2 + 2 * t * t, 1 - 2 * zd * t + t * t]) / a0

print("b =", np.round(b, 8))
print("a =", np.round(a, 8))
print("DC gain =", b.sum() / a.sum())

rng = np.random.default_rng(0)
x = rng.normal(size=20000)
print("max |DF2T - DF1| =", np.max(np.abs(biquad_df2t(b, a, x) - biquad_df1(b, a, x))))

for f in (0.5, 2.8648, 10.0):
    z = np.exp(2j * np.pi * f * dt)
    h = np.polyval(b, z) / np.polyval(a, z)
    print("%7.4f Hz  |H| = %.6f  (%7.2f dB)  phase = %7.2f deg"
          % (f, abs(h), 20 * np.log10(abs(h)), np.degrees(np.angle(h))))

# b = [ 0.97549475 -1.93960675  0.97199401]
# a = [ 1.         -1.93960675  0.94748876]
# DC gain = 1.000000000000014
# max |DF2T - DF1| = 3.275157922644212e-14
#  0.5000 Hz  |H| = 0.994251  (  -0.05 dB)  phase =   -5.75 deg
#  2.8648 Hz  |H| = 0.066667  ( -23.52 dB)  phase =    0.01 deg
# 10.0000 Hz  |H| = 0.983286  (  -0.15 dB)  phase =    9.80 deg
```

Check the results against theory. The depth at the centre is $0.066667 = \zeta_n/\zeta_d = 0.02/0.3$ exactly, which it must be, since prewarping made the discretization exact at $\omega_m$. The middle coefficients agree, $b_1 = a_1 = -1.939607$. The two implementations agree to $3\times10^{-14}$, which is floating-point round-off over twenty thousand samples.

The phase column is the part a control engineer reads first. At $0.5\,\mathrm{Hz}$ — well below the notch, where the loop is doing its work — the notch still costs $5.75^\circ$ of lag. At $1\,\mathrm{Hz}$ it costs $12.50^\circ$; at $2\,\mathrm{Hz}$, $36.11^\circ$. And above the centre it contributes *lead*, $+9.80^\circ$ at $10\,\mathrm{Hz}$, which is not a gift: lead above crossover raises the loop gain where you were trying to lower it.

This is the quantitative version of the classical control module's warning that a notch near crossover is expensive. With a crossover at $1\,\mathrm{Hz}$ and a notch centre at $2.86\,\mathrm{Hz}$ — a factor of under three — the notch takes $12.5^\circ$ before the hold, the computational delay or the anti-alias filter have taken anything. Widening $\zeta_d$ to make the notch gentler reduces that phase and also reduces the depth, since depth is $\zeta_n/\zeta_d$; the only way to have both is to move the mode further from crossover, which is a structures problem rather than a control one.
:::

## Why you cascade

A sixth-order filter can be written as one sixth-order difference equation with seven denominator coefficients, or as three biquads in series. Algebraically they are the same filter. Numerically they are not remotely the same filter.

The reason is the root-sensitivity formula from the finite-word-length lesson:

$$
\frac{\partial z_i}{\partial a_k} = \frac{-z_i^{\,N-k}}{\prod_{j\ne i}(z_i - z_j)} .
$$

The denominator is the product of distances from root $i$ to every *other* root of the same polynomial. In a sixth-order polynomial that is five distances, and for a filter whose poles all sit in the same small region — which is what a narrow-band filter at a high sample rate gives you — every one of them is small, so the product is very small and the sensitivity is very large. In a biquad the only other root is the complex conjugate, a single distance, and the sensitivity is bounded.

::: example One sixth-order filter, two ways, at 1 kHz
Take a sixth-order Butterworth low-pass with a $10\,\mathrm{Hz}$ corner in a $1\,\mathrm{kHz}$ loop — an ordinary requirement for keeping vibration out of a rate signal. As three prewarped-Tustin biquads the denominators are

| Section | $\zeta$ | $a_1$ | $a_2$ |
| --- | --- | --- | --- |
| 1 | $0.258819$ | $-1.9641336$ | $0.9680170$ |
| 2 | $0.707107$ | $-1.9111971$ | $0.9149758$ |
| 3 | $0.965926$ | $-1.8819136$ | $0.8856344$ |

Multiplied out, the single sixth-order denominator is

$$
z^6 - 5.757244z^5 + 13.815511z^4 - 17.687376z^3 + 12.741617z^2 - 4.896925z + 0.784417 .
$$

Now round every coefficient, in both representations, to a $16$-bit fixed-point word with resolution $2^{-15}$, and find the poles.

| | Largest pole magnitude |
| --- | --- |
| Exact, either representation | $0.983879$ |
| Sixth-order polynomial, $\mathrm{Q}15$ coefficients | $1.117144$ |
| Three biquads, $\mathrm{Q}15$ coefficients | $0.983879$ |

The cascade reproduces every pole to six decimal places. The single polynomial is *unstable*, with a pole pair $12\%$ outside the unit circle, growing by that much every millisecond — a factor of $10^{48}$ per second. Its other poles are wrong too: the exact set is $\{0.9411, 0.9411, 0.9565, 0.9565, 0.9839, 0.9839\}$ and the quantized set is $\{0.8236, 0.8236, 0.9626, 0.9626, 1.1171, 1.1171\}$, which is not a perturbed version of the filter, it is a different filter.

Nothing exotic happened. The coefficients are ordinary numbers, the rounding is to sixteen bits, and the filter is a textbook Butterworth. The polynomial simply has six roots packed into a region of radius $0.05$ around $z = 0.96$, and the sensitivity formula says what that costs.
:::

## Practicalities of a cascade

Three decisions have to be made once the sections exist, and they are made the same way every time.

**Pair poles with zeros.** Assign to each pole pair the zero pair nearest to it. This keeps each section's frequency response as flat as possible, which keeps its peak gain — and therefore the headroom it needs — small.

**Order the sections.** Put the section with the lowest peak gain first when the concern is overflow, so signals are attenuated before they meet the resonant section; put the most resonant section last when the concern is round-off noise, so its noise passes through fewer subsequent stages. For a filter with a large dynamic range, the usual compromise is to order sections by increasing peak gain and to scale between them.

**Scale between sections.** Distribute the overall gain across the sections rather than putting it all in the first or last, so each section's output uses the available word length without overflowing. The bound to use is the one from the finite-word-length lesson: $\sum_n|h[n]|$ where the input can step, the peak of $|H|$ where it cannot.

::: warning
The biquad's $b_0$ term is direct feedthrough: $x[n]$ affects $y[n]$ in the same frame. That is correct for a filter, and it is what makes a cascade of $k$ sections cost no delay beyond the computation time.

It also means a long cascade is a long critical path. Every section in the chain has to complete before the actuator command exists, so a controller with an anti-alias roll-off, three notches and a lead has six sections' worth of arithmetic inside the measurement-to-actuation window of the computational-delay lesson. At five multiplies and four adds per section that is small on any modern processor, but the accompanying memory traffic, the coefficient loads and the gain-schedule interpolation around them are not always small. Measure the path, do not assume it.

The related trap is the notch that is not needed. Each notch costs phase at crossover, code, worst-case execution time and a coefficient set that has to be re-verified whenever the modal survey is updated. A mode that is already $20\,\mathrm{dB}$ below unity loop gain does not need one.
:::

## Check yourself

::: check
A biquad has $b = [0.9755, -1.9396, 0.9720]$ and $a = [1, -1.9396, 0.9475]$. Without computing any roots, say what kind of filter it is and what its DC and Nyquist gains are.
:::

::: answer
$b_1 = a_1$ exactly, and $b_0$ and $b_2$ are both slightly larger than the corresponding $a$ entries. That is the signature of a notch built by prewarped Tustin, as derived above: the numerator and denominator differ only in the $\zeta$ that multiplies $2t$, so the middle coefficient is shared.

DC gain: $(0.9755 - 1.9396 + 0.9720)/(1 - 1.9396 + 0.9475) = 0.0079/0.0079 = 1.00$.

Nyquist gain: $(0.9755 + 1.9396 + 0.9720)/(1 + 1.9396 + 0.9475) = 3.8871/3.8871 = 1.00$.

Unity at both ends and something else in between — which is what a notch is. The depth follows from the ratio of the damping terms, and since $b_0 - a_0 = -0.0245$ and $b_2 - a_2 = 0.0245$ come from $2(\zeta_d - \zeta_n)t$, you could recover $\zeta_n/\zeta_d$ from the coefficients if you knew $t$. What you cannot get without factoring is the notch frequency.
:::

::: check
Explain why direct form II can overflow internally when direct form I cannot, using a resonant section as the example.
:::

::: answer
Direct form II computes the all-pole part first: $w[n] = x[n] - a_1w[n-1] - a_2w[n-2]$, and then forms the output as a weighted sum of $w$ values. The intermediate $w$ is the response of the poles *alone*. For a resonant section — a notch's denominator, or a lightly damped low-pass — that all-pole system has a peak gain of roughly $Q = 1/(2\zeta)$ at the resonant frequency, so a bounded input can drive $w$ to many times its own size. The zeros that would have pulled the response back down are applied afterwards, too late to protect the node.

A concrete case: the notch above has $\zeta_d = 0.3$, so its denominator alone peaks at about $1/(2 \times 0.3) = 1.7$; a section with $\zeta_d = 0.02$ would peak at $25$. Direct form II would need five extra bits of headroom at that node.

Direct form I never forms $w$. It computes the entire weighted sum of past inputs and outputs in one accumulation, so the only value that has to fit the output word is the output itself. With a double-width accumulator, intermediate products can be as large as they like. This is why direct form I survives in fixed-point code despite needing four state words — and why transposed direct form II, which has the same protection with two state words, is preferred when it is available.
:::

::: check
A structural mode is identified at $12.5\,\mathrm{Hz}$ and must be notched $20\,\mathrm{dB}$ deep. The loop runs at $100\,\mathrm{Hz}$ and crosses over at $1.5\,\mathrm{Hz}$. Compute the biquad coefficients and the phase the notch costs at crossover.
:::

::: answer
$\omega_m = 2\pi \times 12.5 = 78.540\,\mathrm{rad/s}$, $T = 0.01\,\mathrm{s}$, so $t = \tan(\omega_m T/2) = \tan(0.39270) = 0.414214$. Depth $20\,\mathrm{dB}$ means $\zeta_n/\zeta_d = 0.1$; take $\zeta_d = 0.3$ and $\zeta_n = 0.03$.

$$
\begin{aligned}
b &= [\,1 + 2(0.03)(0.414214) + 0.171573,\ -2 + 0.343146,\ 1 - 0.024853 + 0.171573\,] \\
&= [\,1.196426,\ -1.656854,\ 1.146720\,], \\
a &= [\,1 + 2(0.3)(0.414214) + 0.171573,\ -1.656854,\ 1 - 0.248528 + 0.171573\,] \\
&= [\,1.420101,\ -1.656854,\ 0.923045\,].
\end{aligned}
$$

Normalising by $a_0 = 1.420101$: $b = [0.842493, -1.166716, 0.807492]$ and $a = [1, -1.166716, 0.649985]$. Check: $\sum b = \sum a = 0.483269$, so the DC gain is $1.000$, and $b_1 = a_1$ as it should be.

Phase at crossover: evaluate at $z = e^{j2\pi(1.5)(0.01)} = e^{j0.094248}$. The result is $|H| = 0.99764$ and $\angle H = -3.56^\circ$. Cheap — because the notch sits at $8.3$ times the crossover frequency. Compare with the worked example, where the notch was at $2.9$ times crossover and cost $12.5^\circ$.

The scaling is worth knowing. For $\omega \ll \omega_m$ the notch's phase is approximately $2(\zeta_n - \zeta_d)\,\omega/\omega_m$ radians, linear in the frequency ratio: $2(0.03 - 0.3)(1.5/12.5) = -0.0648\,\mathrm{rad} = -3.71^\circ$ here, against the exact $-3.56^\circ$. So the cost falls in proportion to how far the mode sits above crossover, and in proportion to $\zeta_d$ — which is the same $\zeta_d$ that sets the depth.
:::

::: check
Your filter chain is an anti-alias roll-off, two notches and a lead, and a colleague proposes multiplying them into one eighth-order transfer function "to save operations". Give two reasons to refuse, with numbers where you can.
:::

::: answer
**Conditioning.** Eight roots in one polynomial means each root's sensitivity carries seven distances in its denominator, all of them small if the roots are in the same neighbourhood. The sixth-order example above, at $1\,\mathrm{kHz}$ with $16$-bit coefficients, went from a largest pole magnitude of $0.9839$ to $1.1171$ — unstable — while the cascade reproduced every pole to six decimals. An eighth-order chain is worse, not better, and the coefficients themselves span a huge range: multiplying four sections gives leading terms of order 1 and trailing terms of order $10^{-2}$ to $10^{-3}$, all of which have to share one word format.

**Operation count.** It does not save operations. Four biquads are $20$ multiplies and $16$ adds with $8$ state words. One eighth-order direct form is $17$ multiplies and $16$ adds with $16$ state words: three multiplies saved, eight extra state words spent. The saving is in the noise of any realistic budget.

There is a third reason worth stating: a cascade can be tested, changed and verified section by section. When the modal survey moves a mode by $0.4\,\mathrm{Hz}$ you recompute three coefficients in one section, and the change is visibly local. In the combined polynomial every one of the nine denominator coefficients changes, and there is no way to inspect the result other than factoring it — which is the operation whose conditioning was the problem in the first place.
:::

::: check
When would you deliberately place a notch's zeros exactly on the unit circle, and what does that cost?
:::

::: answer
Putting the zeros on the unit circle means $\zeta_n = 0$, so $b = [1 + t^2,\ -2 + 2t^2,\ 1 + t^2]$, which satisfies $b_0 = b_2$ and gives infinite attenuation exactly at $\omega_m$. You would do it when the mode's frequency is known very precisely and is stable — a rotating machine locked to a known speed, for instance, where the disturbance frequency is commanded rather than estimated.

Two costs. First, infinite depth is achieved at exactly one frequency and the skirts are as steep as $\zeta_d$ allows, so a mode that drifts even slightly off centre gets much less attenuation than the plot suggests: with $\zeta_d = 0.3$, a $5\%$ frequency error already reduces the attenuation from infinite to $-15.9\,\mathrm{dB}$. A structural mode whose frequency changes with propellant load, temperature and flight time is the wrong candidate.

Second, the phase goes through $180^\circ$ abruptly at the centre rather than passing smoothly through it, which makes the loop's behaviour near that frequency very sensitive to the model. If the notch is anywhere near crossover, or if the mode is phase-stabilised rather than gain-stabilised, that sharpness is a liability.

The usual practice is a small non-zero $\zeta_n$ giving $20$ to $30\,\mathrm{dB}$ of depth, with the notch width chosen to cover the modal frequency's uncertainty band rather than to be as deep as possible at one point.
:::

## Summary

| Item | Statement |
| --- | --- |
| Biquad | $y[n] = b_0x[n] + b_1x[n-1] + b_2x[n-2] - a_1y[n-1] - a_2y[n-2]$ |
| Gains | DC $= \sum b/(1 + \sum a)$; Nyquist $= (b_0-b_1+b_2)/(1-a_1+a_2)$ |
| Direct form I | Four state words, one accumulation, no internal overflow with a wide accumulator |
| Direct form II | Two state words; the internal node peaks at roughly $Q$ times the signal |
| Transposed direct form II | Two state words, no large internal node — the preferred structure |
| DF2T update | $y = b_0x + s_1$; $s_1 \leftarrow b_1x - a_1y + s_2$; $s_2 \leftarrow b_2x - a_2y$ |
| Notch, prewarped Tustin | $t = \tan(\omega_m T/2)$; $b = [1+2\zeta_nt+t^2,\ -2+2t^2,\ 1-2\zeta_nt+t^2]$, $a$ the same with $\zeta_d$, both over $a_0$ |
| Notch checks | $b_1 = a_1$; DC gain exactly 1; depth exactly $\zeta_n/\zeta_d$ at the centre |
| Notch phase cost | $5.75^\circ$ at $0.5\,\mathrm{Hz}$, $12.5^\circ$ at $1\,\mathrm{Hz}$ for a $2.86\,\mathrm{Hz}$ notch with $\zeta_d = 0.3$; lead above the centre |
| Cascade | Root sensitivity carries $N-1$ inter-root distances; a $16$-bit sixth-order polynomial went unstable where the cascade was exact to six digits |
| Cascade practice | Pair each pole with its nearest zero, order by peak gain, scale between sections |

The last lesson of this module leaves the single fixed-rate loop behind. Real flight software runs several rate groups at once, they exchange data across frame boundaries, and no frame starts exactly when the schedule says it will — which is where fixed delay becomes jitter, and where the linear analysis of this module stops applying.
