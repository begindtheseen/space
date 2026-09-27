---
id: l10-biquad-sections
title: Biquad sections for discrete filters and notches
minutes: 22
covers:
  - Biquad sections for discrete filters and notches
---

Think of the equalizer on a music app. One slider turns down the boom of the bass. Another cuts a single squeaky note. Each slider is a **filter**: a small calculation that lets some wiggles in a signal through and holds others back.

A flight controller is mostly filters: a roll-off that keeps high-frequency noise out of the derivative path, one **notch** — a filter that cuts a narrow band and leaves the rest alone — for each **[[structural mode|structural-mode]]** the design must suppress, perhaps a lead network. Each is second order or splits into second-order pieces, and each piece is the same small block of code.

That block is the **biquad**, short for "bi-quadratic": a second-order section with two poles, two zeros, five coefficients and two remembered numbers. It is the building brick of discrete filtering. This lesson gives the biquad, the three ways to arrange its arithmetic and why one is preferred, ready-made coefficients for a notch, and why a sixth-order filter is built from three biquads instead of one polynomial. That last point is not taste: in the example below, the one-polynomial version is *unstable* and the three biquads are fine.

## The biquad

Picture a cook with a tiny notebook. Each frame a new ingredient arrives. She mixes it, in fixed amounts, with the last two ingredients and the last two dishes she made, and serves the result. That is a biquad.

Written out, a second-order section computes

$$
y[n] = b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] - a_1 y[n-1] - a_2 y[n-2].
$$

Read it aloud as "y at n equals b-zero times x at n, plus …". Here $x[n]$ is the input sample in frame $n$, $x[n-1]$ the one from the frame before, and $y[n]$ the output. The $b$'s are the **feedforward** coefficients — how much of each recent input goes in. The $a$'s are the **feedback** coefficients — how much of each recent output comes back around. Their minus signs are a convention, chosen so the transfer function looks tidy:

$$
H(z) = \frac{b_0 + b_1 z^{-1} + b_2 z^{-2}}{1 + a_1 z^{-1} + a_2 z^{-2}}
= \frac{b_0 z^2 + b_1 z + b_2}{z^2 + a_1 z + a_2}.
$$

There are five coefficients, not six, because $a_0$ is scaled to $1$. The poles are the roots of $z^2 + a_1z + a_2$; a complex pair has radius $\sqrt{a_2}$ and angle $\arccos\!\big(-a_1/(2\sqrt{a_2})\big)$, and with the sample period $T$ those turn into a damping ratio $\zeta$ and a natural frequency $\omega_n$.

Two one-line gains are worth computing for any coefficient set you are handed.

- **DC gain** — the gain for a signal that does not change. A steady signal has $z = 1$, so the gain is $(b_0+b_1+b_2)/(1+a_1+a_2)$.
- **Nyquist gain** — the gain for the fastest wiggle the loop can represent, one that flips sign every sample. That is $z = -1$, so the gain is $(b_0-b_1+b_2)/(1-a_1+a_2)$.

Why second order and not first or third? Poles that ring come in **[[complex-conjugate pairs|conjugate-pairs]]**. Second order is the smallest piece with real coefficients that can hold a resonance, so it is the natural brick.

::: key
**Biquad section.** $y[n] = b_0x[n] + b_1x[n-1] + b_2x[n-2] - a_1y[n-1] - a_2y[n-2]$. Cascade biquads rather than implementing a high-order polynomial directly — conditioning degrades fast with order.
:::

## Three ways to arrange the arithmetic

A recipe says what goes into the dish, not which bowl to use first or how many bowls to dirty. The difference equation likewise says what to compute, not in what order or with how many remembered numbers. Each remembered number is a **[[state word|state-word]]** — one slot of memory that survives from frame to frame. Three arrangements are standard.

### Direct form I

**Direct form I** does exactly what the equation says. It stores $x[n-1]$, $x[n-2]$, $y[n-1]$ and $y[n-2]$ — four state words — and adds up all five products in one running total.

Its virtue in fixed point is that there is exactly one running total. Processors built for this work have a **[[double-width accumulator|accumulator]]**, a register with extra bits for sums. With it, individual products can be large and nothing overflows along the way. Only the final answer has to fit in the output word. The cost is four state words per section instead of two.

### Direct form II

**Direct form II** splits the section into two halves — first the poles alone, then the zeros — and lets them share one set of delays. That needs only two state words:

$$
w[n] = x[n] - a_1w[n-1] - a_2w[n-2],
\qquad
y[n] = b_0w[n] + b_1w[n-1] + b_2w[n-2].
$$

Fewer state words, and a serious problem in fixed point. The middle signal $w[n]$ is the output of the poles alone, with no zeros to hold it back. Two things make it large.

- A resonance. Near the pole frequency the poles amplify by roughly $Q = 1/(2\zeta)$, the "quality factor" of the ringing.
- A fast sample rate. When the poles sit close to $z = 1$, the number $1 + a_1 + a_2$ is tiny, so even a steady input gets divided by something small.

Together they make the peak gain from $x$ to $w$ roughly $Q/(\omega_n T)^2$. For the notch in the example below, with $\zeta_d = 0.3$ and $\omega_n T = 0.09$, the node $w$ peaks at about $222$ times the input. That is nearly eight extra bits of headroom, needed at one internal point, and paid for with lost resolution everywhere else.

### Transposed direct form II

**Transposed direct form II** runs the same diagram with every arrow reversed. That is the **[[transposition|transposition]]** trick: flipping every signal path leaves the transfer function unchanged but reorders the arithmetic. It becomes

$$
\begin{aligned}
y[n] &= b_0\,x[n] + s_1, \\
s_1 &\leftarrow b_1\,x[n] - a_1\,y[n] + s_2, \\
s_2 &\leftarrow b_2\,x[n] - a_2\,y[n].
\end{aligned}
$$

Read the arrow "$\leftarrow$" as "becomes": it overwrites the stored value for the next frame. The two state words, $s_1$ and $s_2$ ("s one" and "s two"), are partial sums of the *output*, not the output of an unrestrained resonator. So no internal node runs far larger than the input and output, and the scaling problem goes away. Each sample costs five multiplies and four adds — the same count every time, with no branches.

::: key
**Why transposed direct-form II.** It has the best numerical conditioning of the standard forms for fixed and floating point, with only two state words per section and no large intermediate accumulator growth.
:::

::: warning
Do not confuse "two state words" with "safe in fixed point". Direct form II also has two, and its internal node is the worst of the three. What makes transposed direct form II safe is *where* its words sit, not how many there are.
:::

## The notch, in closed form

Pluck a guitar string and it hums at one pitch. A rocket's body bends at a few natural frequencies in the same way. If the controller reacts to that bending, it can pump it up. A notch cuts the gain in a narrow band around the bending frequency and leaves the rest nearly untouched.

The notch from the classical control module is

$$
N(s) = \frac{s^2 + 2\zeta_n\omega_m s + \omega_m^2}{s^2 + 2\zeta_d\omega_m s + \omega_m^2}.
$$

Here $\omega_m$ ("omega sub m") is the modal frequency, $\zeta_n$ ("zeta sub n") is the numerator damping and $\zeta_d$ the denominator damping, with $\zeta_n \ll \zeta_d$. At the center frequency the gain drops to $\zeta_n/\zeta_d$ — the **depth** of the notch.

To put it in flight code, discretize it with Tustin **[[prewarped|prewarp]]** at $\omega_m$, so the notch lands exactly on the mode. Write $t = \tan(\omega_m T/2)$. The coefficients come out as

$$
\begin{aligned}
b &= \big[\,1 + 2\zeta_n t + t^2,\ \ -2 + 2t^2,\ \ 1 - 2\zeta_n t + t^2\,\big], \\
a &= \big[\,1 + 2\zeta_d t + t^2,\ \ -2 + 2t^2,\ \ 1 - 2\zeta_d t + t^2\,\big],
\end{aligned}
$$

and then you divide both lists by $a_0$ so the leading denominator coefficient is $1$.

::: note Why the coefficients come out this way
Prewarped Tustin replaces $s$ by $K(z-1)/(z+1)$ with $K = \omega_m/\tan(\omega_m T/2) = \omega_m/t$.

Put that into the numerator of $N(s)$ and multiply top and bottom of the whole fraction by $(z+1)^2$, which clears the fractions. The numerator becomes

$$
\frac{\omega_m^2}{t^2}(z-1)^2 + \frac{2\zeta_n\omega_m^2}{t}(z^2-1) + \omega_m^2(z+1)^2.
$$

Each term used $(z-1)(z+1) = z^2 - 1$ where one factor of each kind met. Now multiply through by $t^2/\omega_m^2$. Every $\omega_m$ cancels:

$$
(z-1)^2 + 2\zeta_n t\,(z^2 - 1) + t^2 (z+1)^2 .
$$

Expand and collect powers of $z$. The $z^2$ terms give $1 + 2\zeta_n t + t^2$. The $z$ terms give $-2 + 2t^2$. The constants give $1 - 2\zeta_n t + t^2$. The denominator is the same with $\zeta_d$ in place of $\zeta_n$. That is the list above.
:::

Three facts fall out, and each one is a free check on any coefficient table.

- **The middle coefficients match**: $b_1 = a_1$. That is the fingerprint of a notch.
- **The DC gain is exactly 1.** Add up each list: both sums are $4t^2$ before dividing by $a_0$, so the ratio is $1$.
- **The sample rate enters only through $t$.** Change the frame rate and you recompute one tangent.

::: example A notch at a 200 Hz frame rate, coefficients and code
Build the $\omega_m = 18\,\mathrm{rad/s}$ notch — that is $2.8648\,\mathrm{Hz}$, matching a mode identified on the vehicle — with $\zeta_n = 0.02$ and $\zeta_d = 0.3$, at $f_s = 200\,\mathrm{Hz}$. Run it in transposed direct form II and compare against a direct form I reference.

First the numbers by hand. $T = 1/200 = 0.005\,\mathrm{s}$, so $\omega_m T/2 = 18 \times 0.005/2 = 0.045$ and $t = \tan(0.045) = 0.045030$. That is barely more than $0.045$ itself, as it should be for a small angle. Now the code:

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

Check the results against the theory.

- **Depth.** At the center the gain is $0.066667$. The theory says $\zeta_n/\zeta_d = 0.02/0.3 = 0.066667$. They match exactly, because prewarping made the discretization exact at $\omega_m$.
- **Fingerprint.** $b_1 = a_1 = -1.939607$, as a notch must have.
- **The two forms agree** to $3\times10^{-14}$ over twenty thousand samples. That is floating-point round-off, nothing more.

The phase column is what a control engineer reads first. At $0.5\,\mathrm{Hz}$ — well below the notch, where the loop is doing its work — the notch still costs $5.75^\circ$ of lag. At $1\,\mathrm{Hz}$ it costs $12.50^\circ$; at $2\,\mathrm{Hz}$, $36.11^\circ$. Above the center it gives *lead*, $+9.80^\circ$ at $10\,\mathrm{Hz}$. That is not a gift: lead above crossover raises the loop gain where you were trying to lower it.

That is the classical control module's warning — a notch near crossover is expensive — with numbers. With crossover at $1\,\mathrm{Hz}$ and the notch under three times higher, the notch takes $12.5^\circ$ before the hold or the computational delay take anything. Widening $\zeta_d$ lowers that cost but also makes the notch shallower, since the depth is $\zeta_n/\zeta_d$. The only way to have both is to move the mode further from crossover — a structures problem, not a control one.
:::

## Why you cascade

Imagine tuning six guitar strings with one knob that tightens all of them in a fixed pattern. Nudge it a hair and every string goes off. With three knobs, one per pair of strings, each nudge stays local. That is the difference between one high-order polynomial and a **cascade** — a chain of biquads, each one's output feeding the next one's input.

A sixth-order filter can be written as one sixth-order difference equation with seven denominator coefficients, or as three biquads in series. On paper they are the same filter. In a computer that rounds every number, they are not remotely the same filter.

The reason is the **root-sensitivity formula** from the finite-word-length lesson. It says how far root $z_i$ of an $N$th-order polynomial moves when coefficient $a_k$ changes a little:

$$
\frac{\partial z_i}{\partial a_k} = \frac{-z_i^{\,N-k}}{\prod_{j\ne i}(z_i - z_j)} .
$$

Look at the bottom. The symbol $\prod$ ("product") means multiply together, here over every other root $j$. So the bottom is the product of the distances from root $i$ to every *other* root. In a sixth-order polynomial that is five distances. When the poles all **[[crowd together|crowded-roots]]** — which is what a low-frequency filter at a high sample rate gives you — every distance is small, their product is tiny, and the sensitivity is enormous. In a biquad the only other root is the conjugate partner: one distance, and the sensitivity stays bounded.

::: example One sixth-order filter, two ways, at 1 kHz
Take a sixth-order **Butterworth** low-pass — the flattest possible passband for its order — with a $10\,\mathrm{Hz}$ corner in a $1\,\mathrm{kHz}$ loop. That is an ordinary requirement for keeping vibration out of a rate signal. As three prewarped-Tustin biquads, the denominators are

| Section | $\zeta$ | $a_1$ | $a_2$ |
| --- | --- | --- | --- |
| 1 | $0.258819$ | $-1.9641336$ | $0.9680170$ |
| 2 | $0.707107$ | $-1.9111971$ | $0.9149758$ |
| 3 | $0.965926$ | $-1.8819136$ | $0.8856344$ |

Multiply the three together and the single sixth-order denominator is

$$
z^6 - 5.757244z^5 + 13.815511z^4 - 17.687376z^3 + 12.741617z^2 - 4.896925z + 0.784417 .
$$

Notice how the coefficients swing from $+13.8$ to $-17.7$ and back. They are big numbers that nearly cancel.

Now round every coefficient, in both versions, to 15 binary places — the nearest multiple of $2^{-15} \approx 3.05\times10^{-5}$, the resolution of a **[[Q15|q15]]** number. Then find the poles again.

| | Largest pole magnitude |
| --- | --- |
| Exact, either representation | $0.983879$ |
| Sixth-order polynomial, rounded | $1.117144$ |
| Three biquads, rounded | $0.983879$ |

The cascade keeps every pole magnitude within $1\times10^{-5}$ of the exact value. The biggest one does not change in the sixth digit.

The single polynomial is *unstable*: a pole pair about $12\%$ outside the unit circle, growing by that factor every millisecond, or $1.117144^{1000} \approx 10^{48}$ per second. The other poles are wrong too. The exact magnitudes are $\{0.9411, 0.9411, 0.9565, 0.9565, 0.9839, 0.9839\}$; the rounded polynomial gives $\{0.8236, 0.8236, 0.9626, 0.9626, 1.1171, 1.1171\}$. That is not a slightly nudged version of the filter. It is a different filter.

Why? Each rounding error was at most $1.5\times10^{-5}$. But the six exact poles all lie within about $0.06$ of $z = 0.96$. For the outermost pole, the product of the five distances to its neighbors is about $2\times10^{-6}$. In its own biquad, the one distance to its partner is about $0.12$. That is roughly sixty thousand times less sensitive. Nothing exotic happened: ordinary coefficients, ordinary rounding, a textbook Butterworth. The sensitivity formula said what crowding would cost, and it cost that.
:::

## Practicalities of a cascade

Once the sections exist, three decisions follow, made the same way every time.

**Pair poles with zeros.** Give each pole pair the zero pair nearest to it. Each section's frequency response then stays as flat as possible, which keeps its peak gain — and so the headroom it needs — small.

**Order the sections.** Against overflow, put the lowest-peak-gain section first, so signals are trimmed before they meet the resonant one. Against round-off noise, put the most resonant section last, so its noise passes through fewer stages. The usual compromise is to order by increasing peak gain and scale between sections.

**Scale between sections.** Spread the overall gain across the sections instead of putting it all in the first or last. Then each section's output uses the word length well without overflowing. Use the bound from the finite-word-length lesson: $\sum_n|h[n]|$ — the sum of the sizes of the impulse response — if the input can step; the peak of $|H|$ if it cannot.

::: warning
The biquad's $b_0$ term is **direct feedthrough**: $x[n]$ affects $y[n]$ in the same frame. That is right for a filter, and it is why a cascade of $k$ sections adds no delay beyond the time to compute it.

It also means a long cascade is a long **critical path**: every section must finish before the actuator command exists. An anti-alias roll-off, three notches and a lead put six sections inside the measurement-to-actuation window of the computational-delay lesson. The arithmetic is small on any modern processor; the memory traffic, coefficient loads and gain-schedule interpolation around it are not always small. Measure the path; do not assume it.

The related trap is the unneeded notch. Each one costs phase, code, execution time, and a coefficient set to re-verify whenever the **[[modal survey|modal-survey]]** is updated. A mode that is already $20\,\mathrm{dB}$ below unity loop gain does not need one.
:::

## Check yourself

::: check
A biquad has $b = [0.9755, -1.9396, 0.9720]$ and $a = [1, -1.9396, 0.9475]$. Without computing any roots, say what kind of filter it is and what its DC and Nyquist gains are.
:::

::: answer
$b_1 = a_1$ exactly, and $b_0$ and $b_2$ differ from the matching $a$ entries by small, equal and opposite amounts. That is the fingerprint of a notch built by prewarped Tustin: numerator and denominator differ only in the $\zeta$ that multiplies $2t$, so the middle coefficient is shared.

DC gain, using $z = 1$: $(0.9755 - 1.9396 + 0.9720)/(1 - 1.9396 + 0.9475) = 0.0079/0.0079 = 1.00$.

Nyquist gain, using $z = -1$: $(0.9755 + 1.9396 + 0.9720)/(1 + 1.9396 + 0.9475) = 3.8871/3.8871 = 1.00$.

Unity at both ends and something else in between — which is what a notch is. What you cannot read off without factoring is the notch frequency.
:::

::: check
Explain why direct form II can overflow internally when direct form I cannot, using a resonant section as the example.
:::

::: answer
Direct form II computes the all-pole part first, $w[n] = x[n] - a_1w[n-1] - a_2w[n-2]$, and only then weights the $w$ values into the output. So $w$ is the response of the poles *alone*, with gain roughly $Q/(\omega_nT)^2$. The zeros that would pull it back down come afterward, too late to protect the node.

For the $200\,\mathrm{Hz}$ notch above with $\zeta_d = 0.3$, the all-pole part peaks at about $222$ times the input, near $2.6\,\mathrm{Hz}$ — nearly $8$ extra bits of headroom. With $\zeta_d = 0.02$ it would peak at about $3100$, nearly $12$ bits. The notch's own gain never rises above $1$.

Direct form I never forms $w$. It adds up all the weighted past inputs and outputs in one accumulation, so only the output itself has to fit the output word; with a double-width accumulator the in-between sums can be as large as they like. That is why direct form I survives in fixed-point code despite its four state words.
:::

::: check
A structural mode is identified at $12.5\,\mathrm{Hz}$ and must be notched $20\,\mathrm{dB}$ deep. The loop runs at $100\,\mathrm{Hz}$ and crosses over at $1.5\,\mathrm{Hz}$. Compute the biquad coefficients and the phase the notch costs at crossover.
:::

::: answer
Start with the numbers that go into $t$. $\omega_m = 2\pi \times 12.5 = 78.540\,\mathrm{rad/s}$ and $T = 0.01\,\mathrm{s}$, so $t = \tan(\omega_m T/2) = \tan(0.39270) = 0.414214$, and $t^2 = 0.171573$.

A depth of $20\,\mathrm{dB}$ means a gain of $0.1$, so $\zeta_n/\zeta_d = 0.1$. Take $\zeta_d = 0.3$ and $\zeta_n = 0.03$.

$$
\begin{aligned}
b &= [\,1 + 2(0.03)(0.414214) + 0.171573,\ -2 + 0.343146,\ 1 - 0.024853 + 0.171573\,] \\
&= [\,1.196426,\ -1.656854,\ 1.146720\,], \\
a &= [\,1 + 2(0.3)(0.414214) + 0.171573,\ -1.656854,\ 1 - 0.248528 + 0.171573\,] \\
&= [\,1.420101,\ -1.656854,\ 0.923045\,].
\end{aligned}
$$

Divide both by $a_0 = 1.420101$: $b = [0.842493, -1.166716, 0.807492]$ and $a = [1, -1.166716, 0.649985]$. Check: $\sum b = \sum a = 0.483269$, so the DC gain is $1.000$, and $b_1 = a_1$ as it should be.

Phase at crossover: evaluate at $z = e^{j2\pi(1.5)(0.01)} = e^{j0.094248}$. The result is $|H| = 0.99764$ and $\angle H = -3.56^\circ$. Cheap, because the notch sits $8.3$ times above crossover; the worked example's notch, $2.9$ times above, cost $12.5^\circ$.

A handy rule: well below the notch, its phase is about $2(\zeta_n - \zeta_d)\,\omega/\omega_m$ radians, straight-line in the frequency ratio. Here that is $2(0.03 - 0.3)(1.5/12.5) = -0.0648\,\mathrm{rad} = -3.71^\circ$, close to the exact $-3.56^\circ$. The cost falls as the mode moves above crossover and grows with $\zeta_d$, which also sets the depth.
:::

::: check
Your filter chain is an anti-alias roll-off, two notches and a lead, and a colleague proposes multiplying them into one eighth-order transfer function "to save operations". Give two reasons to refuse, with numbers where you can.
:::

::: answer
**Conditioning.** With eight roots in one polynomial, each root's sensitivity has seven small distances multiplied in its denominator. The sixth-order example, rounded to $2^{-15}$, went from a largest pole magnitude of $0.9839$ to $1.1171$ — unstable — while the cascade held every pole magnitude to within $10^{-5}$. Eighth order is worse. The coefficients also nearly cancel, like the $+13.8$, $-17.7$, $+12.7$ of the sixth-order polynomial, yet must share one word format.

**Operation count.** Four biquads are $20$ multiplies and $16$ adds, with $8$ state words in transposed direct form II. One eighth-order direct form I is $17$ multiplies and $16$ adds, with $16$ state words. Three multiplies saved, eight state words spent — nothing worth having.

A third reason: a cascade can be verified section by section. When the modal survey moves a mode by $0.4\,\mathrm{Hz}$, you recompute three coefficients in one section. In the combined polynomial all nine denominator coefficients change, and the only way to inspect the result is to factor it — the very operation whose conditioning was the problem.
:::

::: check
When would you deliberately place a notch's zeros exactly on the unit circle, and what does that cost?
:::

::: answer
Zeros on the unit circle means $\zeta_n = 0$, so $b = [1 + t^2,\ -2 + 2t^2,\ 1 + t^2]$ before dividing by $a_0$. Then $b_0 = b_2$, and the gain is exactly zero at $\omega_m$ — infinite attenuation. You would do it when the disturbance frequency is known precisely and fixed — a rotating machine locked to a commanded speed, say.

Two costs. First, infinite depth happens at one frequency only, so a mode that drifts gets much less attenuation than the plot promises: with $\zeta_d = 0.3$, a $5\%$ frequency error already brings the attenuation from infinite to about $16\,\mathrm{dB}$ ($-15.9\,\mathrm{dB}$ at $5\%$ high, $-15.5\,\mathrm{dB}$ at $5\%$ low). A structural mode that shifts with propellant load and temperature is the wrong candidate.

Second, the phase jumps by $180^\circ$ right at the center instead of passing smoothly through, which makes the loop near that frequency very sensitive to the model — a liability if the notch is near crossover or the mode is phase-stabilized.

The usual practice is a small non-zero $\zeta_n$ giving $20$ to $30\,\mathrm{dB}$ of depth, with the width chosen to cover the mode's uncertainty band.
:::

## Summary

| Item | Statement |
| --- | --- |
| Biquad | $y[n] = b_0x[n] + b_1x[n-1] + b_2x[n-2] - a_1y[n-1] - a_2y[n-2]$ |
| Gains | DC $= (b_0+b_1+b_2)/(1+a_1+a_2)$; Nyquist $= (b_0-b_1+b_2)/(1-a_1+a_2)$ |
| Direct form I | Four state words, one accumulation, no internal overflow with a wide accumulator |
| Direct form II | Two state words; the all-pole node peaks at roughly $Q/(\omega_nT)^2$ times the input |
| Transposed direct form II | Two state words, no large internal node — the preferred structure |
| DF2T update | $y = b_0x + s_1$; $s_1 \leftarrow b_1x - a_1y + s_2$; $s_2 \leftarrow b_2x - a_2y$ |
| Notch, prewarped Tustin | $t = \tan(\omega_m T/2)$; $b = [1+2\zeta_nt+t^2,\ -2+2t^2,\ 1-2\zeta_nt+t^2]$, $a$ the same with $\zeta_d$, both over $a_0$ |
| Notch checks | $b_1 = a_1$; DC gain exactly 1; depth exactly $\zeta_n/\zeta_d$ at the center |
| Notch phase cost | Lag below the center, about $2(\zeta_n-\zeta_d)\omega/\omega_m$ rad; lead above it |
| Cascade | Root sensitivity divides by $N-1$ root-to-root distances; crowded high-order roots move wildly |
| Cascade practice | Pair each pole with its nearest zero, order by peak gain, scale between sections |

The last lesson of this module leaves the single fixed-rate loop behind. Real flight software runs several rate groups at once. They pass data across frame boundaries, and no frame starts exactly when the schedule says it will — which is where fixed delay becomes jitter, and where the linear analysis of this module stops applying.

::: context structural-mode A rocket rings like a bell
Tap a wine glass and it rings at one pitch. Twang a ruler off a desk and it buzzes at one pitch. Every elastic object has a few natural frequencies where it likes to vibrate, and each pattern of bending is called a **mode**.

A launch vehicle is a long, thin tube, so its first bending modes are low — often only a few hertz for a large rocket. The gyro is bolted to the structure, so it measures the vehicle's rotation *plus* the local bending at its mount. If the controller answers the bending with engine gimbal commands, it can push the bending harder every cycle. The notch is there to make the controller deaf to that one pitch.
:::

::: context conjugate-pairs Why poles come in pairs
A filter's coefficients are real numbers — the kind you can store in a memory slot. When a polynomial with real coefficients has a complex root $p + jq$, it must also have the **complex conjugate** $p - jq$, the mirror image across the real axis. Only then do the imaginary parts cancel when the factors are multiplied back out:

$$
(z - p - jq)(z - p + jq) = z^2 - 2p\,z + (p^2 + q^2).
$$

Here is the $12.5\,\mathrm{Hz}$ notch from Check yourself, at $100\,\mathrm{Hz}$: its zero pair (circles) and pole pair (crosses), each a mirror-image pair.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="25" y1="105" x2="225" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="120" y1="12" x2="120" y2="198" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="120" cy="105" r="85" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="105" x2="180.1" y2="44.9" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="120" y1="105" x2="180.1" y2="165.1" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2.5">
    <circle cx="178.9" cy="46.2" r="5"/>
    <circle cx="178.9" cy="163.8" r="5"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="165.1" y1="53.2" x2="174.1" y2="62.2"/><line x1="165.1" y1="62.2" x2="174.1" y2="53.2"/>
    <line x1="165.1" y1="147.8" x2="174.1" y2="156.8"/><line x1="165.1" y1="156.8" x2="174.1" y2="147.8"/>
  </g>
  <text x="208" y="112" font-size="11" fill="#1f2a44">1</text>
  <text x="236" y="60" font-size="11" fill="#1d6fd1">zeros: radius 0.979</text>
  <text x="236" y="75" font-size="11" fill="#1d6fd1">at ±45.0°</text>
  <text x="236" y="140" font-size="11" fill="#b4232c">poles: radius 0.806</text>
  <text x="236" y="155" font-size="11" fill="#b4232c">at ±43.6°</text>
  <text x="236" y="200" font-size="11" fill="#6c7a93">unit circle |z| = 1</text>
</svg>
```

Both coefficients on the right are real. A ringing, oscillating response needs complex poles, and complex poles arrive two at a time. That is why the smallest real-coefficient building block that can ring is second order — the biquad.
:::

::: context state-word What a state word is
A **word** is one number-sized slot of computer memory — $16$, $32$ or $64$ bits, depending on the machine. A **state word** is a slot that must survive from one frame to the next, because the filter needs it next time: a past input, a past output, or a partial sum.

State words matter for three reasons. They cost memory on small processors. They must be reset or initialized correctly when the filter starts or the mode changes. And they are where overflow and round-off errors live, because a bad value in a state word is fed back in every frame after.
:::

::: context accumulator The extra-wide register
Multiply two $16$-bit numbers and the exact product needs $32$ bits. Add up five such products and the sum can need a few bits more. Processors built for filtering — digital signal processors — carry an **accumulator** wider than the data words for exactly this reason. Designs with a $40$-bit accumulator for $16$-bit data are common: the $8$ spare bits at the top are called guard bits.

With guard bits, a running sum can climb far above the output range partway through and come back down without harm. Only the final answer has to be rounded and fitted into the output word. Direct form I relies on this.
:::

::: context transposition Reversing every arrow
Draw a filter as boxes and arrows: multipliers, adders, and one-frame delay boxes marked $z^{-1}$. Now reverse every arrow. Every place where signals split becomes a place where they add, and every adder becomes a split. Swap the input and output.

A theorem about these diagrams says the new one has **exactly the same transfer function**. The mathematics sees the same filter. The computer does not: the multiplications now happen in a different order, and the delay boxes hold different in-between values.

In transposed direct form II, the delay boxes hold partial sums that are on their way to becoming the output. They cannot grow much beyond the output itself, which is why this arrangement behaves so well.
:::

::: context prewarp Squeezing the frequency axis
Tustin's substitution maps the whole infinite frequency axis of the continuous world onto the finite range from $0$ up to the Nyquist frequency. Something has to be squeezed. A continuous frequency $\omega_a$ ends up at the discrete frequency $\omega$ given by

$$
\omega_a = \frac{2}{T}\tan\!\left(\frac{\omega T}{2}\right).
$$

Low frequencies barely move; high ones are squashed toward Nyquist. At a $100\,\mathrm{Hz}$ frame rate:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="20" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="30" x2="330" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="325" y="24" font-size="11" fill="#6c7a93" text-anchor="end">Nyquist, 50 Hz</text>
  <line x1="50" y1="180" x2="275" y2="30" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="190" y="62" font-size="11" fill="#6c7a93">no warping</text>
  <polyline points="50.0,180.0 61.2,172.5 72.5,165.1 83.8,157.9 95.0,150.9 106.2,144.3 117.5,137.9 128.8,132.0 140.0,126.4 151.2,121.2 162.5,116.4 173.8,112.0 185.0,107.8 196.2,104.0 207.5,100.5 218.8,97.2 230.0,94.2 241.2,91.4 252.5,88.8 263.8,86.4 275.0,84.1 286.2,82.0 297.5,80.1 308.8,78.3 320.0,76.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="106.2" cy="144.3" r="4" fill="#b4232c"/>
  <text x="114" y="160" font-size="11" fill="#b4232c">12.5 Hz lands at 11.9 Hz</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="194">0</text><text x="140" y="194">20</text><text x="230" y="194">40</text><text x="320" y="194">60</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="184">0</text><text x="45" y="124">20</text><text x="45" y="64">40</text>
  </g>
  <text x="190" y="210" font-size="11" fill="#6c7a93" text-anchor="middle">continuous frequency, Hz (discrete frequency up the side)</text>
</svg>
``` For a notch that is fatal: a notch designed at $12.5\,\mathrm{Hz}$ and converted at $100\,\mathrm{Hz}$ with plain Tustin would land at about $11.9\,\mathrm{Hz}$, missing a narrow mode. **Prewarping** stretches the substitution by $\omega_m/\tan(\omega_m T/2)$ so the one frequency you care about lands exactly where it should.
:::

::: context crowded-roots Six poles in a crowd
The six exact poles of the $10\,\mathrm{Hz}$ Butterworth at $1\,\mathrm{kHz}$ (blue, upper half of the $z$-plane; the lower half is a mirror image) sit huddled barely inside the unit circle. After rounding the one polynomial's coefficients to $2^{-15}$, its poles (red) scatter — one pair ends up outside the circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="190" x2="330" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <path d="M206.0,190.0 L205.8,170.0 L205.0,150.0 L203.8,130.1 L202.0,110.1 L199.8,90.3 L197.0,70.4 L193.8,50.7 L190.1,31.1" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="212" y="60" font-size="11" fill="#1f2a44">unit circle |z| = 1</text>
  <g fill="#1d6fd1">
    <circle cx="158.8" cy="177.7" r="4.5"/>
    <circle cx="170.5" cy="156.0" r="4.5"/>
    <circle cx="191.7" cy="142.3" r="4.5"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="294.8" y1="101" x2="304.8" y2="111"/><line x1="294.8" y1="111" x2="304.8" y2="101"/>
    <line x1="158.3" y1="45.2" x2="168.3" y2="55.2"/><line x1="158.3" y1="55.2" x2="168.3" y2="45.2"/>
    <line x1="57.0" y1="121.8" x2="67.0" y2="131.8"/><line x1="57.0" y1="131.8" x2="67.0" y2="121.8"/>
  </g>
  <text x="258" y="130" font-size="11" fill="#b4232c">|z| = 1.117</text>
  <text x="70" y="148" font-size="11" fill="#b4232c">0.824</text>
  <text x="120" y="42" font-size="11" fill="#b4232c">0.963</text>
  <text x="96" y="182" font-size="11" fill="#1d6fd1">exact: 0.941</text>
  <text x="110" y="208" font-size="11" fill="#6c7a93">real axis, 0.78 to 1.15</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="204">0.78</text><text x="206" y="204">1.00</text><text x="326" y="204">1.15</text>
  </g>
</svg>
```

Blue dots: exact poles. Red crosses: poles after rounding the sixth-order polynomial. The cascade's rounded poles sit on top of the blue dots.
:::

::: context q15 Numbers with a fixed point
Many flight processors store fractions as plain integers with an agreed scale. In **Q15** format a $16$-bit integer $k$ stands for $k \times 2^{-15}$: one sign bit and fifteen bits after the binary point, covering $-1$ up to a hair under $+1$ in steps of about $3.05\times10^{-5}$.

A coefficient like $-1.96$ does not fit in Q15; it needs a format with an integer bit or two, and one like $-17.7$ needs five integer bits besides the sign. The example rounds every coefficient to the same step, $2^{-15}$, to keep the comparison fair. Needing more integer bits for the big polynomial coefficients would only make its problem worse.
:::

::: context modal-survey How the mode frequencies are found
The frequencies a notch targets come from a **modal survey** — a ground vibration test. Engineers hang or support the real vehicle, shake it with small electric shakers across a sweep of frequencies, and record the response with dozens of accelerometers. The peaks in the response are the modes.

The numbers then feed a structural model that predicts how each mode shifts as propellant drains, which changes the mass the structure carries. When a later test or flight updates a mode, every notch aimed at it has to be re-checked.
:::
