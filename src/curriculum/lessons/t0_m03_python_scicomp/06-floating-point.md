---
id: l06-floating-point
title: "Floating point: machine epsilon and catastrophic cancellation"
minutes: 23
covers:
  - floating-point pitfalls: catastrophic cancellation, machine epsilon
---

In February 1991, during the Gulf War, a **[[Patriot|patriot]]** missile battery in Dhahran, Saudi Arabia, failed to stop an incoming Scud missile because its clock had drifted. The system counted time in tenths of a second. It stored one tenth as a 24-bit binary number — and 0.1 has no exact binary form, so every tick was short by a little under $10^{-7}\,\mathrm{s}$. After a hundred hours of running — $3.6 \times 10^{6}$ ticks — the official inquiry put the total error at about a third of a second. A target moving at $1.7\,\mathrm{km/s}$ travels several hundred metres in that time, so the radar looked in the wrong place. No error message appeared. The arithmetic did exactly what computer arithmetic always does.

Every number your orbit propagators, filters and controllers touch is a **float64**, and float64 is not the smooth number line from math class. It is a finite set of about $1.8 \times 10^{19}$ points, spaced unevenly, with rules for rounding onto them. Think of a ruler with a limited number of tick marks: every value snaps to the nearest tick.

This lesson makes those rules precise enough that you can predict when they matter. Most of the time they do not. The two situations where they do are a long pile-up of tiny errors, and a single subtraction that wipes out every digit you had.

## What a float64 is

Your calculator shows big numbers in **scientific notation**: $6.378 \times 10^{6}$. A float64 does the same thing in binary. It stores a sign, a 53-bit **[[significand|significand-word]]** (the digits of the number) and an exponent (how far to slide the point):

$$
x = \pm\, 1.f_1 f_2 \ldots f_{52} \times 2^{e}, \qquad -1022 \le e \le 1023 .
$$

Here each $f_i$ is a binary digit, $0$ or $1$, and $e$ is the exponent. The leading $1$ is not stored — every normal number starts with it, so it comes free. That is how 52 stored bits of fraction give 53 bits of precision. The 11-bit exponent covers roughly $2.2 \times 10^{-308}$ to $1.8 \times 10^{308}$.

Between any two neighboring powers of two there are exactly $2^{52}$ floats, evenly spaced. Each time the exponent goes up by one, the **[[spacing doubles|spacing-doubles]]**.

Whole numbers are exact as long as they fit in 53 bits. So every integer up to $2^{53} = 9\,007\,199\,254\,740\,992$ is a float64, and $2^{53} + 1$ is not.

### Why 0.1 is not exact

Try writing one third as a decimal: $0.3333\ldots$, forever. You have to stop somewhere, and wherever you stop, you are slightly off. Binary has the same problem with one tenth. In binary it is $0.000110011001100\ldots$, [[repeating forever|binary-tenth]], so the stored value is the nearest 53-bit number:

```python
print((0.1).hex())                # 0x1.999999999999ap-4
print((0.1).as_integer_ratio())   # (3602879701896397, 36028797018963968)
print(f"{0.1:.20f}")              # 0.10000000000000000555
print(0.1 + 0.2)                  # 0.30000000000000004
print(0.1 + 0.2 == 0.3)           # False
```

The stored `0.1` is exactly $3602879701896397 / 2^{55}$, about $5.5 \times 10^{-18}$ above one tenth. The sum `0.1 + 0.2` rounds to the float one step above the float nearest `0.3`. Neither step was wrong; each did the best a 53-bit number can.

Python prints the *shortest* decimal that rounds back to the same float. That is why `0.1` prints as `0.1`, while the sum — a different float — needs the `4` at the end to be told apart.

## Machine epsilon

The gap between $1$ and the next float up is $2^{-52}$. That gap has a name, **machine epsilon**, written $\varepsilon$ (the Greek letter "epsilon"):

::: key
Machine epsilon for IEEE-754 float64 is $\varepsilon \approx 2.22 \times 10^{-16}$ ($2^{-52}$) — about 15–16 significant decimal digits. Every rounding introduces a relative error of at most $\varepsilon/2 \approx 1.1 \times 10^{-16}$.
:::

```python
import sys, math
import numpy as np
print(sys.float_info.epsilon)        # 2.220446049250313e-16
print(np.finfo(np.float64).eps)      # 2.220446049250313e-16
print(1.0 + 2**-53 == 1.0)           # True   (half an epsilon rounds away)
print(1.0 + 2**-52 == 1.0)           # False  (one epsilon is the next float)
```

The precise statement is about **relative error** — the error as a fraction of the value. Store any real number $x$ in range and you get

$$
\mathrm{fl}(x) = x(1 + \delta), \qquad |\delta| \le \varepsilon/2 .
$$

Read $\mathrm{fl}(x)$ as "the float stored for $x$", and $\delta$ ("delta") as the tiny relative error. The standard also promises that $+$, $-$, $\times$, $\div$ and $\sqrt{\ }$ each give the **correctly rounded** result — the exact answer, snapped to the nearest float. So the same bound holds for every single arithmetic step.

Why "about 16 digits"? Because $\log_{10} 2^{53} \approx 15.95$. A float32, with 24 significant bits, has $\varepsilon = 2^{-23} \approx 1.19 \times 10^{-7}$ and about 7 digits.

### Spacing grows with size

The *absolute* gap between floats depends on how big the number is. The **unit in the last place**, or **ulp**, at $x$ is

$$
\mathrm{ulp}(x) = \varepsilon \cdot 2^{\lfloor \log_2 |x| \rfloor}.
$$

The brackets $\lfloor\ \rfloor$ mean "round down to a whole number", so $2^{\lfloor \log_2 |x| \rfloor}$ is the power of two at or below $|x|$. The ulp is about $2.2 \times 10^{-16}$ near $1$, about $9.3 \times 10^{-10}$ near Earth's radius, and exactly $2$ near $10^{16}$. That last one leads to a strange result:

```python
print(1e16 + 1 - 1e16)     # 0.0    the 1 fell below the spacing of floats near 1e16
print(1e16 + 2)            # 1.0000000000000002e+16
```

Near $10^{16}$ the floats go $\ldots, 10^{16}, 10^{16} + 2, \ldots$. There is no float at $10^{16} + 1$, so adding $1$ rounds back to $10^{16}$, and subtracting $10^{16}$ leaves $0$.

::: note What epsilon does not tell you
Machine epsilon bounds the error of *one* rounding. It says nothing directly about the error after a million operations. And it says nothing at all about errors in the *inputs*: a sensor that reports 16-bit readings is only good to about $10^{-5}$ of its range, not $10^{-16}$. Numerical analysis is the study of how these per-step errors travel through a calculation. The two ways below are the ones a GNC engineer meets every week.
:::

## Accumulation

Imagine a store that rounds every item on your receipt up to the next cent. One item, no big deal. A receipt a million items long, and the store is ahead by thousands of dollars. Small errors that lean one way pile up.

Add 0.1 to itself a million times. The answer should be 100 000. Each addition rounds, the roundings do not all cancel, and the sum drifts:

```python
s = 0.0
for _ in range(1_000_000):
    s += 0.1
print(s)                         # 100000.00000133288
print(math.fsum([0.1] * 1_000_000))   # 100000.0
```

The error is $1.3 \times 10^{-6}$. That is about $6 \times 10^{9}$ epsilons. Where did it come from? Each of the million additions rounded by up to half the ulp of a number near $10^5$, and that ulp is $1.5 \times 10^{-11}$. The roundings leaned one way because the stored 0.1 is slightly too big.

Two tools do better. `math.fsum` keeps track of the lost low-order bits and returns the correctly rounded sum. `np.sum` uses **[[pairwise summation|pairwise-sum]]**, which keeps the error growing like $\log n$ instead of like $n$.

The same pile-up sits inside every simulation that advances its clock with `t += dt`. After $10^5$ steps of $dt = 0.01\,\mathrm{s}$ the clock reads $999.9999999992356$, not $1000$. The error, $7.6 \times 10^{-10}\,\mathrm{s}$, is harmless here. But it grows with every step, and it is already enough to make `t == 1000.0` false when a guidance phase is supposed to switch at exactly that time. So compute time as `t = n * dt` from a whole-number step counter `n`, and trigger events with `t >= t_switch`, never `==`.

::: warning `while t != t_end`
A loop that stops when an added-up float equals a target may never stop, because the float can step right over the target. Write `while t < t_end` — or better, loop over a whole number of steps and compute `t` from the counter. The same goes for comparing any computed value against a threshold: use `>=`, and for equality use a tolerance.
:::

## Catastrophic cancellation

Here is a way to weigh a cat. Step on the bathroom scale holding the cat: $75.3\,\mathrm{kg}$. Step on without it: $70.8\,\mathrm{kg}$. The cat is $4.5\,\mathrm{kg}$. But suppose each reading can be off by $0.5\,\mathrm{kg}$. That is under 1 % of your weight — and over 10 % of the cat. [[Subtracting two big, nearly equal numbers|cat-scale]] keeps their absolute error but throws away their size, so the error becomes huge compared with the answer.

::: key
Catastrophic cancellation: subtracting two nearly equal floating-point numbers annihilates the leading digits, so the small absolute error of the inputs becomes a large relative error in the result. Fix by algebraic rearrangement, not by more precision.
:::

Now in floats. Two numbers $a$ and $b$ each carry a relative error of about $\varepsilon$ — an absolute error of about $\varepsilon |a|$. When they are close, the computer does the subtraction $a - b$ *exactly* (a result called **[[Sterbenz's lemma|sterbenz]]**), so the subtraction adds no new error. But the result is small, and the old absolute error $\varepsilon |a|$ is still there. Compared with the small $|a - b|$, the relative error is about

$$
\frac{\varepsilon\,|a|}{|a - b|}.
$$

If $a$ and $b$ agree to eight digits, the result has lost eight of its sixteen. If they agree to sixteen, the result is noise.

The classic example is $1 - \cos x$ for a small angle, $x = 10^{-8}$. The true value is about $x^2/2 = 5 \times 10^{-17}$. But the true cosine is $1 - 5 \times 10^{-17}$, closer to $1$ than half an epsilon, so $\cos(10^{-8})$ rounds to exactly `1.0`. The subtraction returns `0.0` — a relative error of 100 %.

The half-angle identity from trigonometry, $1 - \cos x = 2\sin^2(x/2)$, has no subtraction at all:

```python
x = 1e-8
print(1 - math.cos(x))          # 0.0
print(2 * math.sin(x / 2)**2)   # 5.0000000000000005e-17
```

Notice what did *not* help. `math.cos` was accurate to the last bit. The information was never in the float `1.0` to begin with; the subtraction only exposed that. More precision would only move the failure to a smaller $x$. That is why the fix is always algebra: find a formula for the same quantity in which nearly equal numbers are never subtracted.

### The standard rewrites

- **Conjugates.** $\sqrt{a} - \sqrt{b} = \dfrac{a - b}{\sqrt{a} + \sqrt{b}}$, and in general $u - v = \dfrac{u^2 - v^2}{u + v}$. The top is computed from the original data, and the bottom adds two positive numbers, which never cancels.
- **Trigonometric identities.** $1 - \cos x = 2\sin^2(x/2)$; $\sin a - \sin b = 2\cos\frac{a+b}{2}\sin\frac{a-b}{2}$.
- **Library functions built for small inputs.** `math.expm1(x)` for $e^x - 1$, `math.log1p(x)` for $\ln(1 + x)$, `np.hypot(a, b)` for $\sqrt{a^2 + b^2}$ without overflow. For $x = 10^{-10}$, `math.exp(x) - 1` returns $1.000000083 \times 10^{-10}$, wrong in the eighth digit, while `math.expm1(x)` returns $1.00000000005 \times 10^{-10}$, correct.
- **Series for small inputs.** When $|x| \ll 1$ (read "much less than 1"), $1 - \cos x \approx x^2/2 - x^4/24$. It is exact to float64 for $|x| < 10^{-4}$ and involves no cancellation.
- **Two-pass statistics.** Compute a **variance** (the average squared distance from the mean) as the mean of $(x_i - \bar{x})^2$, never as $\overline{x^2} - \bar{x}^2$. Here $\bar{x}$ is the mean of the $x_i$ and $\overline{x^2}$ is the mean of their squares.

That last one deserves a demonstration, because it is a bug that has shipped in real telemetry tools. Take four values, $10^9 + 4$, $10^9 + 7$, $10^9 + 13$ and $10^9 + 16$. Their mean is $10^9 + 10$, their distances from it are $-6, -3, 3, 6$, and the true variance is $(36 + 9 + 9 + 36)/4 = 22.5$:

```python
xs = np.array([1e9 + i for i in (4, 7, 13, 16)])
m = xs.mean()
print((xs**2).mean() - m**2)      # -128.0   one-pass formula: garbage
print(((xs - m)**2).mean())       # 22.5     two-pass formula: exact
```

The one-pass formula returned a *negative* variance — impossible for an average of squares. $\overline{x^2}$ and $\bar{x}^2$ are both about $10^{18}$, where floats are $128$ apart. A true difference of $22.5$ cannot even be seen at that spacing; the answer is pure rounding noise. The two-pass form subtracts the mean *before* squaring, while the numbers are near $10^9$ and the differences are small exact whole numbers.

::: example The quadratic formula near a large root
The equation $x^2 - bx + c = 0$ with $b = 10^8$ and $c = 1$ has two roots, $x_1$ and $x_2$. For any quadratic like this, the roots multiply to $c$ and add to $b$: $x_1 x_2 = c$ and $x_1 + x_2 = b$. So one root is about $10^8$ and the other about $10^{-8}$.

The textbook formula for the small root is

$$
x_2 = \frac{b - \sqrt{b^2 - 4c}}{2}.
$$

Follow it in float64, step by step:

1. $b^2 = 10^{16}$.
2. $b^2 - 4c$ rounds to $9\,999\,999\,999\,999\,996$. The spacing there is $2$, so the $4$ survives, barely.
3. The square root is $99\,999\,999.99999999$.
4. $b$ minus that leaves $1.49 \times 10^{-8}$ — made only of the last few bits of the square root, which are all that survived.

Halving gives $7.45 \times 10^{-9}$. That is 25 % low.

```python
b, c = 1e8, 1.0
d = math.sqrt(b*b - 4*c)
print((b - d) / 2)                # 7.450580596923828e-09   wrong
print(2 * c / (b + d))            # 1e-08                   right
```

**The fix.** Multiply top and bottom by the conjugate $b + \sqrt{b^2 - 4c}$. The top becomes $b^2 - (b^2 - 4c) = 4c$ exactly, so

$$
x_2 = \frac{4c}{2\left(b + \sqrt{b^2 - 4c}\right)} = \frac{2c}{b + \sqrt{b^2 - 4c}},
$$

and the bottom is a sum of two positive numbers. Equivalently: compute the large root with the sign that avoids cancellation, $x_1 = (b + \sqrt{b^2 - 4c})/2$, then get the small one as $c / x_1$.

**Check:** $x_1 x_2 \approx 10^8 \times 10^{-8} = 1 = c$. Whenever you solve a quadratic in a guidance routine — time to intercept, burn duration, the impact time of a falling object — use this form.
:::

::: example Choosing the step of a finite difference
A **forward difference** estimates a slope (a derivative) from two nearby points:

$$
f'(x) \approx \frac{f(x + h) - f(x)}{h}.
$$

Read $f'(x)$ as "f prime of x", the slope of $f$ at $x$; $h$ is a small step.

Two errors fight here. The **truncation error** comes from using a straight line over a curve. It is about $h\,|f''|/2$, where $f''$ is how fast the slope itself changes, so it shrinks as $h$ shrinks. A smaller $h$ looks better.

But the top of the fraction is a cancellation. $f(x+h)$ and $f(x)$ each carry an absolute error of about $\varepsilon |f|$, so the fraction carries about $2\varepsilon |f| / h$. That **rounding error** *grows* as $h$ shrinks.

Try it for $f = \sin$ at $x = 1$, where the true slope is $f' = \cos 1 \approx 0.5403$:

| $h$ | error in $f'$ |
| --- | --- |
| $10^{-2}$ | $-4.2 \times 10^{-3}$ |
| $10^{-4}$ | $-4.2 \times 10^{-5}$ |
| $10^{-6}$ | $-4.2 \times 10^{-7}$ |
| $10^{-8}$ | $-3.0 \times 10^{-9}$ |
| $10^{-10}$ | $-5.8 \times 10^{-8}$ |
| $10^{-12}$ | $+4.3 \times 10^{-5}$ |
| $10^{-16}$ | $-0.54$ (result is exactly 0) |

Down to $10^{-8}$ the error shrinks in step with $h$. Below that, rounding takes over and the error climbs. At $h = 10^{-16}$ the two function values are the same float, and the estimated slope is zero — the whole answer is gone.

**The best step.** Here $|f|$ and $|f''|$ are both $\sin 1 \approx 0.84$, so they cancel from the comparison, and the total error behaves like $h/2 + 2\varepsilon/h$. It is smallest at $h_{\mathrm{opt}} = 2\sqrt{\varepsilon} \approx 3 \times 10^{-8}$. The best error you can get is of order $\sqrt{\varepsilon} \approx 10^{-8}$ — eight digits, half of what float64 holds. The **[[error curve|fd-v-curve]]** has a V shape with its bottom there.

A **central difference**, $\big(f(x+h) - f(x-h)\big)/2h$, improves the best error to about $\varepsilon^{2/3} \approx 10^{-11}$, with $h \approx \varepsilon^{1/3} \approx 6 \times 10^{-6}$.

The numerical **Jacobians** (tables of slopes) that a Kalman filter or an optimiser builds from finite differences inherit exactly this trade. That is why they use $h \approx 10^{-6}$ to $10^{-8}$ relative to the state, not $10^{-12}$.
:::

::: note Why the best step is 2√ε
Call the total error $E(h) = \dfrac{h}{2} + \dfrac{2\varepsilon}{h}$. The first part rises with $h$ and the second falls, so the smallest total sits where they balance. Set the slope of $E$ to zero: $\dfrac{1}{2} - \dfrac{2\varepsilon}{h^2} = 0$, so $h^2 = 4\varepsilon$ and $h = 2\sqrt{\varepsilon}$. Put it back in: $E = \sqrt{\varepsilon} + \sqrt{\varepsilon} = 2\sqrt{\varepsilon} \approx 3 \times 10^{-8}$. The true minimum in the table is a little smaller, because the rounding errors partly cancelled at $h = 10^{-8}$.
:::

## Where this bites in GNC

- **Absolute time.** Seconds since the **[[J2000|j2000]]** reference date are about $8 \times 10^8$. The float64 ulp there is $1.2 \times 10^{-7}\,\mathrm{s}$ — tolerable. In float32 it is $64\,\mathrm{s}$. Store time as a whole-number count of ticks plus a float fraction, or as seconds since a recent reference time.
- **Large offsets.** Two positions of size $7 \times 10^6\,\mathrm{m}$ that differ by a metre are fine in float64 (spacing about $10^{-9}\,\mathrm{m}$) and hopeless in float32 (spacing $0.5\,\mathrm{m}$). That is exactly why rendezvous problems are set up in a frame centred on the target.
- **Energy and eccentricity.** Orbital energy per kilogram, $v^2/2 - \mu/r$, subtracts two terms of about $6 \times 10^7\,\mathrm{J/kg}$ that nearly cancel for an orbit close to escape. The eccentricity formula $e = \sqrt{1 - h^2/(\mu a)}$ loses digits for nearly circular orbits. **Equinoctial elements**, an alternative set of orbit numbers, exist to avoid these.
- **Covariance updates.** $\mathbf{P} - \mathbf{K}\mathbf{H}\mathbf{P}$ subtracts nearly equal matrices when a measurement is very accurate. The **[[Joseph form|joseph]]** and square-root filters are the algebraic rearrangements that fix it.
- **Comparisons.** `if x == y` on computed floats is almost always a bug. Use `math.isclose(x, y, rel_tol=1e-9, abs_tol=1e-12)` or `np.isclose`, and choose the tolerances from the arithmetic that produced `x` and `y`.

::: warning "Use float128 / Decimal / higher precision"
Extra precision moves the cliff; it does not remove it. `np.longdouble` is 80-bit on x86 computers and plain float64 on many others. `decimal.Decimal` is about a hundred times slower and still cannot store one third. And none of them rescue a formula that cancels: $1 - \cos x$ fails at $x = 10^{-8}$ in float64 and at $x = 10^{-10}$ in 80-bit. Rearrange the algebra.
:::

## Check yourself

::: check
`0.1 + 0.2 == 0.3` is `False`, yet `0.5 + 0.25 == 0.75` is `True`. Why the difference?
:::

::: answer
$0.5 = 2^{-1}$, $0.25 = 2^{-2}$ and $0.75 = 2^{-1} + 2^{-2}$ are all exact binary fractions. Every value and the sum can be stored exactly, so nothing rounds.

One tenth, two tenths and three tenths repeat forever in binary. Each is stored with its own rounding error, and the rounded sum of the first two lands one ulp away from the rounded third. Float equality is reliable only when every number involved is stored exactly — whole numbers below $2^{53}$, fractions with a power of two on the bottom. Computed physical quantities almost never are.
:::

::: check
A simulation stores time in float32 seconds since midnight and runs for a day. What is the time resolution at the end of the day, and what would you change?
:::

::: answer
At $t = 86\,400\,\mathrm{s}$, which lies between $2^{16} = 65\,536$ and $2^{17} = 131\,072$, the float32 ulp is $2^{16 - 23} = 2^{-7} \approx 0.0078\,\mathrm{s}$.

A $100\,\mathrm{Hz}$ controller has a step of $0.01\,\mathrm{s}$ — only about $1.3$ ulps. So `t += 0.01` cannot add $0.01$. Each step rounds to the nearest float, which is exactly one ulp, $0.0078\,\mathrm{s}$: about 22 % short on every tick. After a hundred steps — one real second — the clock has moved only $0.78\,\mathrm{s}$.

Use float64 (ulp $1.5 \times 10^{-11}\,\mathrm{s}$ at that size), or better, a whole-number tick counter with `t = n * dt`.
:::

::: check
Explain, using absolute and relative error, why $\sqrt{1 + x} - 1$ for $x = 10^{-12}$ returns $5.0004 \times 10^{-13}$ instead of $4.99999999999875 \times 10^{-13}$. Then give a stable form.
:::

::: answer
$1 + x$ rounds to a float with an absolute error up to $\varepsilon/2 \approx 1.1 \times 10^{-16}$, and the square root carries about that much too. The true result is only $5 \times 10^{-13}$. An absolute error of a few times $10^{-17}$ on it is a relative error of about $10^{-4}$: four digits survive out of sixteen.

The conjugate form

$$
\sqrt{1+x} - 1 = \frac{x}{\sqrt{1+x} + 1}
$$

divides an exact $x$ by a sum near $2$, with no cancellation, and is accurate to full precision. (For tiny $x$, the series $x/2 - x^2/8$ also works.)
:::

::: check
An optimiser's numerical gradient of a smooth cost function is noisy, and its line search keeps failing. The finite-difference step is `h = 1e-13`. What is happening, and what step would you try?
:::

::: answer
With $h = 10^{-13}$, the two cost values differ by about $h\,|f'| \approx 10^{-13}|f'|$. Each one carries a rounding error near $\varepsilon |f| \approx 2 \times 10^{-16}|f|$. So the slope estimate has a relative error of about $10^{-3}|f|/|f'|$ — and worse if $f$ comes from a long simulation whose own error is well above $\varepsilon$.

The gradient is mostly rounding noise, so its direction is random and the line search cannot make progress. Move to $h \approx \sqrt{\varepsilon}\,\max(1, |x|) \approx 10^{-8}$ to $10^{-7}$ for a forward difference, or use a central difference with $h \approx 10^{-5}$. If the cost comes from an integrator, make $h$ bigger still, to match the integrator's tolerance.
:::

::: check
A colleague computes the mean of $10^7$ float64 accelerometer samples of about $9.8\,\mathrm{m/s^2}$ with a running `s += a[i]` loop. The result disagrees with `np.mean` in the ninth digit. Which is more trustworthy, and why?
:::

::: answer
`np.mean`. The running sum grows to about $10^8$, where the ulp is $1.5 \times 10^{-8}$. Each of $10^7$ additions can round by half that. If the roundings lean one way, the total error can reach $10^7 \times 7.5 \times 10^{-9} \approx 10^{-1}$ on a sum of $10^8$ — a relative error of $10^{-9}$, exactly the ninth digit.

NumPy's pairwise summation adds numbers of similar size in a tree, so the error grows like $\log_2 n \approx 23$ roundings rather than $10^7$. `math.fsum` would be exact to the last bit. Either way, a ninth-digit disagreement in a mean is a summing artefact, not a property of the data.
:::

## Summary

| Fact | Value / rule |
| --- | --- |
| float64 layout | sign, 11-bit exponent, 52-bit fraction (53 significant bits); range about $10^{\pm 308}$ |
| Machine epsilon | $\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16}$; about 15–16 decimal digits; float32: $2^{-23} \approx 1.19 \times 10^{-7}$, about 7 digits |
| Rounding bound | $\mathrm{fl}(x) = x(1 + \delta)$, $\lvert\delta\rvert \le \varepsilon/2$, per operation |
| Spacing (ulp) | $\varepsilon \cdot 2^{\lfloor \log_2 \lvert x \rvert \rfloor}$: $2.2 \times 10^{-16}$ at 1, $9.3 \times 10^{-10}$ at Earth's radius, 2 at $10^{16}$ |
| Exact integers | all integers up to $2^{53} \approx 9.0 \times 10^{15}$ |
| Accumulation | error grows like $n\varepsilon$ for a running sum; use `n * dt`, `math.fsum`, `np.sum` (pairwise) |
| Cancellation | subtracting nearly equal numbers: relative error $\approx \varepsilon \lvert a \rvert / \lvert a - b\rvert$ |
| Rewrites | conjugate $u - v = (u^2 - v^2)/(u + v)$; $1 - \cos x = 2\sin^2(x/2)$; `expm1`, `log1p`, `hypot`; two-pass variance; small root $2c/(b + \sqrt{b^2 - 4c})$ |
| Finite differences | forward: $h \approx \sqrt{\varepsilon} \approx 10^{-8}$, error $\sim 10^{-8}$; central: $h \approx \varepsilon^{1/3}$, error $\sim 10^{-11}$ |
| Comparison | `math.isclose(x, y, rel_tol, abs_tol)`, `np.isclose`; never `==` on computed values |

With the arithmetic understood, the next lesson hands the hard numerical work — integrating orbits, finding roots, filtering signals — to SciPy. Its routines were written by people who spent careers on exactly these pitfalls, and the lesson shows you the tolerances that make them trustworthy.

::: context patriot What the inquiry found
The US General Accounting Office investigated the Dhahran failure of 25 February 1991, in which the Scud struck an army barracks and killed 28 American soldiers. The Patriot's computer multiplied its tick count by one tenth held in a 24-bit register. Chopping 0.1 to fit lost about $9.5 \times 10^{-8}$ on each tick. Over 100 hours that added up to about $0.34\,\mathrm{s}$, and the radar's tracking window shifted far enough that the Scud fell outside it. A software fix had been sent out; it reached Dhahran the day after the attack. Operators had also been told that very long running times were a problem, but not how long was too long.
:::

::: context significand-word Significand, exponent, sign
In $6.378 \times 10^{6}$, the part $6.378$ holds the digits and is called the **significand** (older books say "mantissa"); the $6$ up top is the **exponent**, which slides the decimal point. A float does the same in base two: the significand holds 53 binary digits and the exponent says which power of two to multiply by. One more bit, the **sign**, says plus or minus. Sign, exponent and fraction add up to $1 + 11 + 52 = 64$ bits — hence "float64".
:::

::: context spacing-doubles A toy float with two fraction bits
Pretend a float had only two bits after the point. Between $1$ and $2$ it could store $1, 1.25, 1.5, 1.75$. Between $2$ and $4$ the same four patterns, stretched: $2, 2.5, 3, 3.5$. Between $4$ and $8$: $4, 5, 6, 7$. Same count in every stretch, so the gap doubles each time. Float64 works the same way with 52 fraction bits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="70" x2="345" y2="70" stroke="#6c7a93" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="2"><line x1="60" y1="62" x2="60" y2="78"/><line x1="70" y1="62" x2="70" y2="78"/><line x1="80" y1="62" x2="80" y2="78"/><line x1="90" y1="62" x2="90" y2="78"/><line x1="100" y1="62" x2="100" y2="78"/><line x1="120" y1="62" x2="120" y2="78"/><line x1="140" y1="62" x2="140" y2="78"/><line x1="160" y1="62" x2="160" y2="78"/><line x1="180" y1="62" x2="180" y2="78"/><line x1="220" y1="62" x2="220" y2="78"/><line x1="260" y1="62" x2="260" y2="78"/><line x1="300" y1="62" x2="300" y2="78"/><line x1="340" y1="62" x2="340" y2="78"/></g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="60" y="98">1</text><text x="100" y="98">2</text><text x="180" y="98">4</text><text x="340" y="98">8</text></g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="80" y="50">gap ¼</text><text x="140" y="50">gap ½</text><text x="260" y="50">gap 1</text>
  </g>
  <text x="180" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">same count of floats in each octave; the gap doubles</text>
</svg>
```
:::

::: context binary-tenth Watching 0.1 repeat in binary
To turn a fraction into binary, keep doubling it and write down the whole-number part each time. Start with $0.1$: doubling gives $0.2$ (write $0$), $0.4$ ($0$), $0.8$ ($0$), $1.6$ ($1$, keep $0.6$), $1.2$ ($1$, keep $0.2$) — and $0.2$ is where we were two steps in. From there the digits $0011$ repeat forever: $0.0\,0011\,0011\,0011\ldots$ A fraction ends in binary only if its bottom number, fully simplified, is a power of two, like $\tfrac{1}{4}$ or $\tfrac{3}{8}$. Tenths have a $5$ in the bottom, so they never end.
:::

::: context pairwise-sum Adding in a tree
A running sum adds each new number to a total that keeps getting bigger, so every rounding happens at the size of the big total. Pairwise summation adds neighbors first, then pairs of pairs, like a sports bracket. Each addition combines numbers of similar size, and each value passes through only about $\log_2 n$ additions — $3$ for eight numbers, about $20$ for a million.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 165" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.5"><line x1="45" y1="130" x2="65" y2="108"/><line x1="85" y1="130" x2="65" y2="108"/><line x1="125" y1="130" x2="145" y2="108"/><line x1="165" y1="130" x2="145" y2="108"/><line x1="205" y1="130" x2="225" y2="108"/><line x1="245" y1="130" x2="225" y2="108"/><line x1="285" y1="130" x2="305" y2="108"/><line x1="325" y1="130" x2="305" y2="108"/><line x1="65" y1="92" x2="105" y2="68"/><line x1="145" y1="92" x2="105" y2="68"/><line x1="225" y1="92" x2="265" y2="68"/><line x1="305" y1="92" x2="265" y2="68"/><line x1="105" y1="52" x2="185" y2="28"/><line x1="265" y1="52" x2="185" y2="28"/></g>
  <circle cx="65" cy="100" r="8" fill="#8fb8f0"/><circle cx="145" cy="100" r="8" fill="#8fb8f0"/><circle cx="225" cy="100" r="8" fill="#8fb8f0"/><circle cx="305" cy="100" r="8" fill="#8fb8f0"/><circle cx="105" cy="60" r="8" fill="#8fb8f0"/><circle cx="265" cy="60" r="8" fill="#8fb8f0"/><circle cx="185" cy="20" r="8" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><rect x="30" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="45" y="146">a1</text><rect x="70" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="85" y="146">a2</text><rect x="110" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="125" y="146">a3</text><rect x="150" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="165" y="146">a4</text><rect x="190" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="205" y="146">a5</text><rect x="230" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="245" y="146">a6</text><rect x="270" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="285" y="146">a7</text><rect x="310" y="130" width="30" height="22" fill="#fff" stroke="#1f2a44"/><text x="325" y="146">a8</text></g>
  <text x="201" y="24" font-size="12" fill="#1f2a44">sum: 3 levels of adding</text>
</svg>
```
:::

::: context cat-scale Why the cat gets the whole error
The two readings, $75.3$ and $70.8\,\mathrm{kg}$, are each right to within $0.5\,\mathrm{kg}$ — better than 1 %. Their difference inherits the same $0.5\,\mathrm{kg}$ uncertainty or so, but now it is compared with $4.5\,\mathrm{kg}$, not $75\,\mathrm{kg}$. The error did not grow; the answer shrank. A kitchen scale weighing the cat directly would do far better — the measuring version of "rearrange the algebra so you never subtract".
:::

::: context sterbenz The subtraction itself is innocent
Sterbenz's lemma, published by Pat Sterbenz in 1974, says: if $a$ and $b$ are floats with $b/2 \le a \le 2b$, then $a - b$ is exactly a float, so the computer's subtraction makes no error at all. That is a surprise worth holding on to. Catastrophic cancellation is not the subtraction's fault. The damage was done earlier, when $a$ and $b$ were rounded; the subtraction only removes the big shared part and leaves the old errors standing alone.
:::

::: context fd-v-curve The V-shaped error curve
The size of the error from the forward difference of $\sin$ at $x = 1$, for $h$ from $10^{-16}$ to $10^{-1}$, on log scales. To the right, the straight-line error falls as $h$ shrinks. To the left, rounding takes over and the error climbs. The bottom of the V, near $h = 10^{-8}$, is the best you can do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="165" x2="335" y2="165" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="55" y1="15" x2="55" y2="165" stroke="#6c7a93" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="60" y1="165" x2="60" y2="170"/><line x1="132" y1="165" x2="132" y2="170"/><line x1="204" y1="165" x2="204" y2="170"/><line x1="276" y1="165" x2="276" y2="170"/><line x1="50" y1="20" x2="55" y2="20"/><line x1="50" y1="76" x2="55" y2="76"/><line x1="50" y1="132" x2="55" y2="132"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="60" y="183">10⁻¹⁶</text><text x="132" y="183">10⁻¹²</text><text x="204" y="183">10⁻⁸</text><text x="276" y="183">10⁻⁴</text><text x="330" y="183">h</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="47" y="24">1</text><text x="47" y="80">10⁻⁴</text><text x="47" y="136">10⁻⁸</text></g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="330.0,39.1 312.0,53.3 294.0,67.3 276.0,81.3 258.0,95.3 240.0,109.3 222.0,123.3 204.0,139.4 186.0,121.9 168.0,121.3 150.0,103.1 132.0,81.1 114.0,63.9 96.0,54.0 78.0,45.6 60.0,23.7"/>
  <circle cx="204" cy="139.4" r="4" fill="#b4232c"/>
  <text x="80" y="140" font-size="11" fill="#1f2a44">rounding wins</text>
  <text x="250" y="140" font-size="11" fill="#1f2a44">truncation wins</text>
  <text x="200" y="14" font-size="11" text-anchor="middle" fill="#6c7a93">size of error in f′</text>
</svg>
```
:::

::: context j2000 The J2000 reference date
Space engineers measure time from a fixed starting instant called an **epoch**. The most common, **J2000**, is noon on 1 January 2000 (in a scientific time scale close to the time on your clock). Positions of planets and orbits are published relative to it. By late 2026 about $8.4 \times 10^{8}$ seconds have passed since J2000, big enough that the storage format of time really matters.
:::

::: context joseph A covariance update that stays healthy
A Kalman filter keeps a covariance matrix $\mathbf{P}$ that says how unsure it is. After a measurement, the short update $\mathbf{P} - \mathbf{K}\mathbf{H}\mathbf{P}$ subtracts two nearly equal matrices when the measurement is very good, and rounding can leave a $\mathbf{P}$ that claims negative uncertainty — nonsense that can make the filter diverge. The **Joseph form**, $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}(\mathbf{I} - \mathbf{K}\mathbf{H})^\mathsf{T} + \mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T}$, gives the same answer in exact arithmetic but is built from products and sums that keep $\mathbf{P}$ symmetric and positive. The estimation modules derive it.
:::
