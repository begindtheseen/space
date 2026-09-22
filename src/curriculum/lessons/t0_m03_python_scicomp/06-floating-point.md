---
id: l06-floating-point
title: "Floating point: machine epsilon and catastrophic cancellation"
minutes: 20
covers:
  - floating-point pitfalls: catastrophic cancellation, machine epsilon
---

<<<<<<< Updated upstream
In February 1991 a Patriot battery in Dhahran failed to intercept a Scud because its clock had drifted. The system counted time in tenths of a second, stored the tenth as a 24-bit binary fraction, and 0.1 has no finite binary expansion, so every tick carried a truncation error of a little under $10^{-7}\,\mathrm{s}$. After a hundred hours of continuous operation — $3.6 \times 10^{6}$ ticks — the inquiry put the accumulated error at about a third of a second, and a target moving at $1.7\,\mathrm{km/s}$ was several hundred metres from where the radar looked for it. Nothing in the software raised an exception. The arithmetic did exactly what floating point always does.
=======
In February 1991 a Patriot battery in Dhahran failed to intercept a Scud because its clock had drifted. The system counted time in tenths of a second, stored the tenth as a 24-bit binary fraction, and 0.1 has no finite binary expansion, so every tick carried a rounding error of about $10^{-7}\,\mathrm{s}$. After a hundred hours of continuous operation the accumulated error was about a third of a second, and a target moving at $1.7\,\mathrm{km/s}$ was several hundred metres from where the radar looked for it. Nothing in the software raised an exception. The arithmetic did exactly what floating point always does.
>>>>>>> Stashed changes

Every number your propagators, filters and controllers touch is a float64, and float64 is not the real line. It is a finite set of about $1.8 \times 10^{19}$ points, spaced unevenly, with rules for rounding onto them. This lesson makes those rules precise enough that you can predict when they matter — most of the time they do not — and recognise the two situations where they do: a long accumulation of tiny errors, and a single subtraction that erases every digit you had.

## What a float64 is

A float64 stores a number as a sign, a 53-bit *significand* and an exponent:

$$
x = \pm\, 1.f_1 f_2 \ldots f_{52} \times 2^{e}, \qquad -1022 \le e \le 1023 .
$$

The leading 1 is implied, so 52 bits of fraction $f$ give 53 bits of precision; the 11-bit exponent covers roughly $2.2 \times 10^{-308}$ to $1.8 \times 10^{308}$. Between any two adjacent powers of two there are exactly $2^{52}$ representable numbers, evenly spaced; the spacing doubles every time the exponent goes up by one. Integers are exact as long as they fit in 53 bits, so every integer up to $2^{53} = 9\,007\,199\,254\,740\,992$ is a float64, and $2^{53} + 1$ is not.

Most decimal fractions are not representable at all. One tenth in binary is $0.000110011001100\ldots$, repeating for ever, and the stored value is the nearest 53-bit truncation:

```python
print((0.1).hex())                # 0x1.999999999999ap-4
print((0.1).as_integer_ratio())   # (3602879701896397, 36028797018963968)
print(f"{0.1:.20f}")              # 0.10000000000000000555
print(0.1 + 0.2)                  # 0.30000000000000004
print(0.1 + 0.2 == 0.3)           # False
```

The stored `0.1` is $3602879701896397 / 2^{55}$, about $5.5 \times 10^{-18}$ above one tenth. The sum `0.1 + 0.2` rounds to the float one ulp above the float nearest `0.3`. Neither operation was wrong; both did the best a 53-bit number can. Python prints the *shortest* decimal that rounds back to the same float, which is why `0.1` prints as `0.1` and the sum prints with the 4 at the end.

## Machine epsilon

The gap between 1 and the next representable float is $2^{-52}$, and that number has a name:

::: key
Machine epsilon for IEEE-754 float64 is $\varepsilon \approx 2.22 \times 10^{-16}$ ($2^{-52}$) — about 15–16 significant decimal digits. Every rounding introduces a relative error of at most $\varepsilon/2 \approx 1.1 \times 10^{-16}$.
:::

```python
<<<<<<< Updated upstream
import sys, math
import numpy as np
=======
import sys, numpy as np
>>>>>>> Stashed changes
print(sys.float_info.epsilon)        # 2.220446049250313e-16
print(np.finfo(np.float64).eps)      # 2.220446049250313e-16
print(1.0 + 2**-53 == 1.0)           # True   (half an epsilon rounds away)
print(1.0 + 2**-52 == 1.0)           # False  (one epsilon is the next float)
```

The precise statement is about *relative* error. Storing any real number $x$ in the representable range gives $\mathrm{fl}(x) = x(1 + \delta)$ with $|\delta| \le \varepsilon/2$, and each of $+$, $-$, $\times$, $\div$ and $\sqrt{\ }$ returns the correctly rounded result of the exact operation, so the same bound applies to every arithmetic step. Since $\log_{10} 2^{53} \approx 15.95$, that is "about 16 digits". A float32, with 24 significant bits, has $\varepsilon = 2^{-23} \approx 1.19 \times 10^{-7}$ and about 7 digits.

The *absolute* spacing depends on the magnitude. The unit in the last place at $x$ is $\mathrm{ulp}(x) = \varepsilon \cdot 2^{\lfloor \log_2 |x| \rfloor}$: about $2.2 \times 10^{-16}$ near 1, about $9.3 \times 10^{-10}$ near Earth's radius, and exactly 2 near $10^{16}$. That last figure explains the opening puzzle:

```python
print(1e16 + 1 - 1e16)     # 0.0    the 1 fell below the spacing of floats near 1e16
print(1e16 + 2)            # 1.0000000000000002e+16
```

::: note
Machine epsilon bounds the error of *one* rounding. It says nothing directly about the error of a computed result after a million operations, and nothing at all about errors in the *inputs* — a sensor quantised to 16 bits contributes $10^{-5}$, not $10^{-16}$. Numerical analysis is the business of tracking how these per-step errors propagate; the two mechanisms below are the ones a GNC engineer meets weekly.
:::

## Accumulation

Add 0.1 to itself a million times and the result should be 100 000. Each addition rounds, the rounding errors do not all cancel, and the sum drifts:

```python
s = 0.0
for _ in range(1_000_000):
    s += 0.1
print(s)                         # 100000.00000133288
print(math.fsum([0.1] * 1_000_000))   # 100000.0
```

The error, $1.3 \times 10^{-6}$, is about $6 \times 10^{9}$ epsilons — every one of a million additions contributed a rounding of order the ulp of a number near $10^5$, which is $1.5 \times 10^{-11}$, and the errors were biased in one direction because the stored 0.1 is slightly too large. `math.fsum` tracks the lost low-order bits exactly and returns the correctly rounded sum; `np.sum` uses pairwise summation, which keeps the error growing like $\log n$ rather than $n$.

The same mechanism sits inside every fixed-step simulation that advances its clock with `t += dt`. After $10^5$ steps of $dt = 0.01\,\mathrm{s}$ the clock reads $999.9999999992356$, not $1000$: an error of $7.6 \times 10^{-10}\,\mathrm{s}$, harmless here, but growing linearly, and enough to make `t == 1000.0` false when a guidance phase is supposed to switch. Compute time as `t = n * dt` from an integer step counter, and trigger events with `t >= t_switch`, never `==`.

::: warning `while t != t_end`
A loop that stops when an accumulated float equals a target may never stop. Write `while t < t_end` or, better, loop over an integer number of steps and derive `t` from the counter. The same applies to comparing a propagated quantity against a threshold: use `>=`, and for equality use a tolerance.
:::

## Catastrophic cancellation

::: key
Catastrophic cancellation: subtracting two nearly equal floating-point numbers annihilates the leading digits, so the small absolute error of the inputs becomes a large relative error in the result. Fix by algebraic rearrangement, not by more precision.
:::

Here is the mechanism. Two numbers $a$ and $b$ each carry a relative error of about $\varepsilon$, so an absolute error of about $\varepsilon |a|$. Their difference $a - b$ is computed *exactly* by IEEE subtraction when they are close (Sterbenz's lemma), so the subtraction itself adds nothing. But the result is small, and the inherited absolute error $\varepsilon |a|$ is now compared against a small $|a - b|$: the relative error is about $\varepsilon\,|a| / |a - b|$. If $a$ and $b$ agree to eight digits, the result has lost eight of its sixteen. If they agree to sixteen, it is noise.

The classic small-angle example: $1 - \cos x$ for $x = 10^{-8}$. The true value is $x^2/2 = 5 \times 10^{-17}$. But $\cos(10^{-8})$ rounds to exactly `1.0` — the true cosine is $1 - 5\times10^{-17}$, closer to 1 than half an epsilon — so the subtraction returns `0.0`: a relative error of 100 %. The half-angle identity $1 - \cos x = 2\sin^2(x/2)$ has no subtraction at all:

```python
x = 1e-8
print(1 - math.cos(x))          # 0.0
print(2 * math.sin(x / 2)**2)   # 5.0000000000000005e-17
```

Note what did *not* help: `math.cos` was accurate to the last bit. The information was destroyed by the subtraction, and it was never in the operands to begin with. More precision would only move the failure to a smaller $x$. This is why the fix is always algebra: find an expression for the same quantity in which nearly equal terms are never subtracted.

### The standard rewrites

- **Conjugates.** $\sqrt{a} - \sqrt{b} = \dfrac{a - b}{\sqrt{a} + \sqrt{b}}$, and in general $u - v = \dfrac{u^2 - v^2}{u + v}$. The numerator is computed from the original data, the denominator adds two positives.
- **Trigonometric identities.** $1 - \cos x = 2\sin^2(x/2)$; $\sin a - \sin b = 2\cos\frac{a+b}{2}\sin\frac{a-b}{2}$.
- **Library functions built for small arguments.** `math.expm1(x)` for $e^x - 1$, `math.log1p(x)` for $\ln(1 + x)$, `np.hypot(a, b)` for $\sqrt{a^2 + b^2}$ without overflow. For $x = 10^{-10}$, `math.exp(x) - 1` returns $1.000000083 \times 10^{-10}$, wrong in the eighth digit, while `math.expm1(x)` returns $1.00000000005 \times 10^{-10}$, correct.
- **Series for small arguments.** When $|x| \ll 1$, $1 - \cos x \approx x^2/2 - x^4/24$ is exact to float64 for $|x| < 10^{-4}$ and involves no cancellation.
- **Two-pass statistics.** Compute a variance as the mean of $(x_i - \bar{x})^2$, never as $\overline{x^2} - \bar{x}^2$.

That last one deserves a demonstration, because it is a bug that has shipped in real telemetry tools. For the five values $10^8 + 1, \ldots, 10^8 + 5$ the true variance is 2:

```python
xs = np.array([1e8 + i for i in (1, 2, 3, 4, 5)])
m = xs.mean()
print((xs**2).mean() - m**2)      # 4.0   one-pass formula: garbage
print(((xs - m)**2).mean())       # 2.0   two-pass formula: exact
```

$\overline{x^2}$ and $\bar{x}^2$ are both about $10^{16}$, where the float spacing is 2, and their difference of 2 is one ulp — the answer is pure rounding noise. The two-pass form subtracts the mean *before* squaring, when the numbers are near $10^8$ and the differences are exact small integers.

::: example The quadratic formula near a large root
The roots of $x^2 - bx + c = 0$ with $b = 10^8$ and $c = 1$ are $x_1 x_2 = c$ and $x_1 + x_2 = b$, so $x_1 \approx 10^8$ and $x_2 \approx 10^{-8}$. The textbook formula for the small root is

$$
x_2 = \frac{b - \sqrt{b^2 - 4c}}{2}.
$$

In float64, $b^2 = 10^{16}$ and $b^2 - 4c$ rounds to $9\,999\,999\,999\,999\,996$ (the spacing there is 2, so the 4 is represented, barely), $\sqrt{\cdot} = 99\,999\,999.99999999$, and the subtraction leaves $1.49 \times 10^{-8}$ — the last few bits of the square root, which are all that survived. The computed root is $7.45 \times 10^{-9}$, 25 % low:

```python
b, c = 1e8, 1.0
d = math.sqrt(b*b - 4*c)
print((b - d) / 2)                # 7.450580596923828e-09   wrong
print(2 * c / (b + d))            # 1e-08                   right
```

The fix multiplies numerator and denominator by the conjugate $b + \sqrt{b^2 - 4c}$: the numerator becomes $b^2 - (b^2 - 4c) = 4c$ exactly, so $x_2 = 2c / (b + \sqrt{b^2 - 4c})$, and the denominator is a sum of two positive numbers. Compute the large root with the sign that avoids cancellation, $x_1 = (b + \sqrt{b^2 - 4c})/2$, and the small one as $c / x_1$. Any time you solve a quadratic in a guidance routine — time to intercept, burn duration from the rocket equation, the impact time of a parabola — use this form.
:::

::: example Choosing the step of a finite difference
A forward difference approximates a derivative: $f'(x) \approx (f(x + h) - f(x))/h$. Truncation error shrinks with $h$ — it is about $h\,|f''|/2$ — so a smaller $h$ seems better. But the numerator is a cancellation: $f(x+h)$ and $f(x)$ each carry an absolute error of about $\varepsilon |f|$, so the quotient carries about $2\varepsilon |f| / h$, which *grows* as $h$ shrinks. For $f = \sin$ at $x = 1$, where $f' = \cos 1 \approx 0.5403$:

| $h$ | error in $f'$ |
| --- | --- |
| $10^{-2}$ | $-4.2 \times 10^{-3}$ |
| $10^{-4}$ | $-4.2 \times 10^{-5}$ |
| $10^{-6}$ | $-4.2 \times 10^{-7}$ |
| $10^{-8}$ | $-3.0 \times 10^{-9}$ |
| $10^{-10}$ | $-5.8 \times 10^{-8}$ |
| $10^{-12}$ | $+4.3 \times 10^{-5}$ |
| $10^{-16}$ | $-0.54$ (result is exactly 0) |

Down to $10^{-8}$ the error falls in step with $h$; below that, rounding takes over and the error climbs, and at $h = 10^{-16}$ the two function values are the same float and the derivative is zero. Minimising $h/2 + 2\varepsilon/h$ gives $h_{\mathrm{opt}} = 2\sqrt{\varepsilon} \approx 3 \times 10^{-8}$, and the best achievable error is of order $\sqrt{\varepsilon} \approx 10^{-8}$ — eight digits, half of what float64 holds. A central difference improves both to $\varepsilon^{2/3}$, about $10^{-11}$ with $h \approx 6 \times 10^{-6}$. The numerical Jacobians that a Kalman filter or an optimiser builds by finite differences inherit exactly this trade, which is why they use $h \approx 10^{-6}$ to $10^{-8}$ relative to the state and not $10^{-12}$.
:::

## Where this bites in GNC

- **Absolute time.** Seconds since the J2000 epoch are about $8 \times 10^8$; the float64 ulp there is $1.2 \times 10^{-7}\,\mathrm{s}$, tolerable, but in float32 it is $64\,\mathrm{s}$. Store time as an integer count of ticks plus a float fraction, or as seconds since a recent epoch.
- **Large offsets.** Two positions of magnitude $7 \times 10^6\,\mathrm{m}$ that differ by a metre are fine in float64 (spacing $10^{-9}\,\mathrm{m}$) and hopeless in float32 (spacing $0.5\,\mathrm{m}$). Relative-motion problems are formulated in a frame centred on the target for exactly this reason.
<<<<<<< Updated upstream
- **Energy and eccentricity.** Specific orbital energy $v^2/2 - \mu/r$ subtracts two terms of about $6 \times 10^7\,\mathrm{J/kg}$ that nearly cancel for a near-parabolic orbit; $e = \sqrt{1 - h^2/(\mu a)}$ loses digits for near-circular orbits. Equinoctial elements exist to avoid these.
=======
- **Energy and eccentricity.** Specific orbital energy $v^2/2 - \mu/r$ subtracts two terms of about $3 \times 10^7\,\mathrm{J/kg}$ that nearly cancel for near-parabolic orbits; $e = \sqrt{1 - h^2/(\mu a)}$ loses digits for near-circular orbits. Equinoctial elements exist to avoid these.
>>>>>>> Stashed changes
- **Covariance updates.** $\mathbf{P} - \mathbf{K}\mathbf{H}\mathbf{P}$ subtracts nearly equal matrices when a measurement is very accurate; the Joseph form and square-root filters are the algebraic rearrangements that fix it.
- **Comparisons.** `if x == y` on computed floats is almost always a bug. Use `math.isclose(x, y, rel_tol=1e-9, abs_tol=1e-12)` or `np.isclose`, and choose the tolerances from the arithmetic that produced `x` and `y`.

::: warning "Use float128 / Decimal / higher precision"
Extra precision moves the cliff, it does not remove it. `np.longdouble` is 80-bit on x86 and plain float64 on many other platforms, `decimal.Decimal` is a hundred times slower and still cannot store one third, and none of them help a formula that cancels: $1 - \cos x$ fails at $x = 10^{-8}$ in float64 and at $x = 10^{-10}$ in 80-bit. Rearrange the algebra.
:::

## Check yourself

::: check
`0.1 + 0.2 == 0.3` is `False`, yet `0.5 + 0.25 == 0.75` is `True`. Why the difference?
:::

::: answer
$0.5 = 2^{-1}$, $0.25 = 2^{-2}$ and $0.75 = 2^{-1} + 2^{-2}$ are all exact binary fractions, so every value and the sum are representable and nothing rounds. One tenth, two tenths and three tenths are repeating binary fractions; each is stored with its own rounding error, and the rounded sum of the first two happens to land one ulp away from the rounded third. Equality of floats is reliable only when every quantity involved is exactly representable — integers below $2^{53}$, dyadic fractions — which computed physical quantities almost never are.
:::

::: check
A simulation stores time in float32 seconds since midnight and runs for a day. What is the time resolution at the end of the day, and what would you change?
:::

::: answer
At $t = 86\,400\,\mathrm{s}$, which lies between $2^{16} = 65\,536$ and $2^{17}$, the float32 ulp is $2^{16 - 23} = 2^{-7} \approx 0.0078\,\mathrm{s}$. A $100\,\mathrm{Hz}$ controller, whose step is $0.01\,\mathrm{s}$, would see its timestamps quantised to almost a whole step — `t += 0.01` would sometimes not change `t` at all. Use float64 (ulp $1.5 \times 10^{-11}\,\mathrm{s}$ at that magnitude), or better, an integer tick counter with `t = n * dt`.
:::

::: check
Explain, in terms of absolute and relative error, why $\sqrt{1 + x} - 1$ for $x = 10^{-12}$ returns $5.0004 \times 10^{-13}$ instead of $4.99999999999875 \times 10^{-13}$, and give a stable form.
:::

::: answer
<<<<<<< Updated upstream
$1 + x$ rounds to a float with absolute error up to $\varepsilon/2 \approx 1.1 \times 10^{-16}$; the square root inherits about that much. The true result is $5 \times 10^{-13}$, so an absolute error of a few times $10^{-17}$ is a relative error of about $10^{-4}$ — four digits survive of sixteen. The conjugate form $\sqrt{1+x} - 1 = \dfrac{x}{\sqrt{1+x} + 1}$ divides an exact $x$ by a sum near 2 and is accurate to full precision. (Equivalently, for tiny $x$, the series $x/2 - x^2/8$.)
=======
$1 + x$ rounds to a float with absolute error up to $\varepsilon/2 \approx 1.1 \times 10^{-16}$; the square root inherits about that much. The true result is $5 \times 10^{-13}$, so an absolute error of $10^{-16}$ is a relative error of $2 \times 10^{-4}$ — four digits survive of sixteen. The conjugate form $\sqrt{1+x} - 1 = \dfrac{x}{\sqrt{1+x} + 1}$ divides an exact $x$ by a sum near 2 and is accurate to full precision. (Equivalently, for tiny $x$, the series $x/2 - x^2/8$.)
>>>>>>> Stashed changes
:::

::: check
An optimiser's numerical gradient of a smooth cost function is noisy and the line search keeps failing. The finite-difference step is `h = 1e-13`. What is happening and what step would you try?
:::

::: answer
With $h = 10^{-13}$ the two cost evaluations differ by roughly $h\,|f'| \approx 10^{-13}|f'|$, while each carries a rounding error near $\varepsilon |f| \approx 2 \times 10^{-16}|f|$; the quotient therefore has a relative error of order $10^{-3}|f|/|f'|$, and worse if $f$ is itself computed by a long simulation with error well above $\varepsilon$. The gradient is dominated by rounding noise, so its direction is random and the line search cannot make progress. Move to $h \approx \sqrt{\varepsilon}\,\max(1, |x|) \approx 10^{-8}$ to $10^{-7}$ for a forward difference, or a central difference with $h \approx 10^{-5}$; if the cost comes from an integrator, scale $h$ up further to match the integrator's tolerance.
:::

::: check
A colleague computes the mean of $10^7$ float64 accelerometer samples of about $9.8\,\mathrm{m/s^2}$ with a running `s += a[i]` loop and gets a result that disagrees with `np.mean` in the ninth digit. Which is more trustworthy, and why?
:::

::: answer
`np.mean`. The running sum grows to about $10^8$, where the ulp is $1.5 \times 10^{-8}$; each of $10^7$ additions can round by half that, and with a systematic bias the accumulated error can reach $10^{-1}$ on a sum of $10^8$ — a relative error of $10^{-9}$, exactly the ninth digit. NumPy's pairwise summation adds numbers of similar magnitude in a tree, so the error grows like $\log_2 n \approx 23$ roundings rather than $10^7$. `math.fsum` would be exact to the last bit. Whichever you use, a disagreement in the ninth digit of a mean is a summation artefact, not a property of the data.
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

With the arithmetic understood, the next lesson hands the hard numerical work — integrating orbits, finding roots, filtering signals — to SciPy, whose routines are written by people who spent careers on exactly these pitfalls, and shows you the tolerances that make them trustworthy.
