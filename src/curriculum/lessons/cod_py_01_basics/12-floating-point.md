---
id: l12-floating-point
title: Floating point, and why 0.1 + 0.2 is not 0.3
minutes: 19
covers:
  - Floating point: why 0.1 + 0.2 != 0.3 and what to do about it
---

```python
>>> 0.1 + 0.2
0.30000000000000004
```

That is not a bug in Python, in your machine, or in the way you typed it. It is the arithmetic that every language on every processor does, and the same expression gives the same answer in C++, MATLAB, Java and JavaScript. What it means is that a `float` is not a decimal number: it is the nearest binary approximation to one, and "nearest" is not "equal".

This matters to you sooner than it does to most programmers. A GNC script compares computed velocities, accumulates time over a hundred thousand integration steps, checks whether a residual is zero and decides whether a Monte Carlo run passed. Every one of those is a floating-point comparison, and a test written with `==` will fail for reasons that have nothing to do with the physics — or, worse, pass on your machine and fail in the build.

By the end of this lesson you will know exactly what is stored, why the sum is what it is, what to compare with instead of `==`, how error accumulates in a loop, and the two special values — infinity and not-a-number — that a bad computation produces instead of stopping.

## What a float actually stores

A Python `float` is an IEEE 754 *binary64* number, called a double in C++: one sign bit, an 11-bit exponent, and 52 stored fraction bits giving 53 bits of precision. That is about 15.9 decimal digits, and the interpreter will tell you:

```python
>>> import sys
>>> sys.float_info.dig
15
>>> sys.float_info.epsilon
2.220446049250313e-16
```

`dig` is how many decimal digits are guaranteed to survive a round trip. `epsilon` is the gap between 1.0 and the next representable number, $2^{-52} \approx 2.22 \times 10^{-16}$, and it is the scale of the error in every stored value and every operation.

The key fact is about *which* numbers exist. A binary fraction is a sum of halves, quarters, eighths and so on, so a decimal fraction is representable only when its denominator is a power of two. One half, one quarter and 0.375 are exact. One tenth is not: in binary it repeats forever, like one third in decimal, and it has to be cut off at 53 bits.

```python
>>> (0.1).as_integer_ratio()
(3602879701896397, 36028797018963968)
```

The denominator is $2^{55}$. So the number your program holds when you write `0.1` is exactly $3602879701896397 / 2^{55}$, which is close to one tenth and is not one tenth.

## Why the sum is not 0.3

The `decimal` module can print the *exact* value of a stored float, which turns the whole mystery into three lines you can read:

```python
>>> from decimal import Decimal
>>> Decimal(0.1)
Decimal('0.1000000000000000055511151231257827021181583404541015625')
>>> Decimal(0.2)
Decimal('0.200000000000000011102230246251565404236316680908203125')
>>> Decimal(0.3)
Decimal('0.299999999999999988897769753748434595763683319091796875')
```

The stored `0.1` is a little **above** one tenth. The stored `0.2` is a little above two tenths. Their sum is therefore above three tenths — while the stored `0.3` is a little **below** it. Two different numbers; `==` correctly says they differ. Adding the two and looking at what came out:

```python
>>> from decimal import Decimal
>>> Decimal(0.1 + 0.2)
Decimal('0.3000000000000000444089209850062616169452667236328125')
>>> 0.1 + 0.2 - 0.3
5.551115123125783e-17
```

The gap is $5.55 \times 10^{-17}$, which is a quarter of `epsilon` — one or two units in the last place, exactly what the arithmetic promises. Nothing went wrong. The mistake was expecting a decimal answer from a binary machine.

::: key
`0.1 + 0.2 == 0.3` is `False` because binary floating point cannot represent those decimals exactly: the stored `0.1` and `0.2` are slightly high, the stored `0.3` is slightly low, and the sum lands about $5.6 \times 10^{-17}$ away. Compare computed floats with a tolerance — `math.isclose` — never with `==`.
:::

## Why `0.1` displays as `0.1`

If the stored value is really 0.1000000000000000055…, why does the prompt print `0.1`? Because `repr` prints the **shortest string that reads back as the same number**. Since there is no shorter decimal that lands on that exact binary value, `0.1` is the honest short name for it. The display is rounded; the value is not.

That is why the surprise arrives at the moment of *arithmetic* rather than at the moment of typing. Each individual number looks clean, and only when two of them are added does a result appear that has no short spelling.

## Comparing with a tolerance

`math.isclose(a, b)` is the right tool, and it applies two tolerances at once:

$$
|a - b| \le \max(\text{rel\_tol} \times \max(|a|, |b|),\ \text{abs\_tol})
$$

The relative part scales with the size of the numbers, which is what you want for velocities near 7,700 m/s. The absolute part covers values near zero, where a relative tolerance demands an impossible exactness. The defaults are `rel_tol=1e-09` and `abs_tol=0.0`:

```python
# isclose.py
import math

print(math.isclose(0.1 + 0.2, 0.3))                 # True
print(math.isclose(1e6, 1e6 + 1.0))                 # False
print(math.isclose(0.0, 1e-20))                     # False
print(math.isclose(0.0, 1e-20, abs_tol=1e-12))      # True
```

Read the third line carefully, because it is the one that catches people. With `abs_tol` at its default of zero, *nothing* is close to exactly zero except zero itself: the relative tolerance is a fraction of zero, which is zero. Any comparison against zero — a residual, an error signal, a component of a difference vector — must pass an `abs_tol` chosen from the physics. "Within a micrometre per second" is a real statement; "within one part in a billion of zero" is not.

The second line is the other half of the same idea: `1e6` and `1e6 + 1` differ by one part in a million, which is far outside the default tolerance of one part in a billion, so they are not close. The default is strict, and it should be: a tolerance is an engineering statement about what you consider equal, and it deserves a deliberate number.

## Rounding is not a comparison

An obvious-looking alternative is to round both sides and compare. It fails, because rounding has boundaries and two values a hair apart can fall on opposite sides of one:

```python
# rounding_is_not_closeness.py
import math

a = 0.145
b = 0.14500000000000002

print(math.isclose(a, b))          # True
print(round(a, 2), round(b, 2))    # 0.14 0.15
print(round(a, 2) == round(b, 2))  # False
```

Two numbers that differ in the seventeenth digit round to visibly different values, and the test that was supposed to be tolerant reports a mismatch. Rounding is for display. `isclose` is for comparison. This is also why `round(x, 2)` is not a way to "clean up" a value before storing it: you have replaced one inexact binary number with a different inexact binary number, and thrown away information.

## Error accumulates in a loop

One operation is out by at most half an ulp. A hundred thousand of them are not:

```python
# accumulate.py
import math

t = 0.0
for _ in range(10):
    t += 0.1

print(repr(t))          # 0.9999999999999999
print(t == 1.0)         # False

steps = 10
dt = 0.1
print(repr(steps * dt))       # 1.0
print(steps * dt == 1.0)      # True

print(repr(sum([0.1] * 10)))        # 0.9999999999999999
print(repr(math.fsum([0.1] * 10)))  # 1.0
```

Adding one tenth ten times gives 0.9999999999999999 — each addition rounds, and the errors do not cancel. Multiplying once gives exactly 1.0, because there is only one rounding.

That is the practical rule for time in a simulation loop: **count steps in an integer and compute the time as `steps * dt`**. The loop counter is exact, the multiplication rounds once, and the hundred-thousandth frame is at exactly the time it should be rather than 3 ms early. It also means a stopping condition can be written on the integer — `while steps < n:` — instead of on an accumulated float that may never equal its target.

`math.fsum` is the other tool: it tracks the rounding it loses and gives the correctly rounded total of a sequence. It is slower than `sum`, and it is the right choice when you are totalling a long column of values offline and want the answer to be the best available.

::: example A loop that never stops at 1.0
The bug in its natural habitat. A script steps a simulated clock in 0.1 s increments and stops when it reaches one second:

```python
# never_stops.py
t = 0.0
steps = 0

while t != 1.0 and steps < 20:     # the guard is the only reason this ends
    t += 0.1
    steps += 1

print(steps)        # 20
print(repr(t))      # 2.0000000000000004
print(t == 1.0)     # False
```

At step 10 the accumulated `t` is `0.9999999999999999`, which is not `1.0`, so the loop sails past its target and only the safety counter stops it. Without that counter the program hangs, and the loop is not obviously wrong on the page — which is what makes it worth recognising.

Two fixes, both correct. Use an inequality, `while t < 1.0:`, which stops at the first step past the target and is what you want when the target is a physical quantity. Or take the float out of the condition altogether:

```python
# integer_clock.py
dt = 0.1
n_steps = 10

for step in range(1, n_steps + 1):
    t = step * dt

print(step)         # 10
print(repr(t))      # 1.0
print(t == 1.0)     # True
```

The counter is an `int`, which is exact at any size, and the time is recomputed rather than accumulated, so it rounds once per step instead of once per step *cumulatively*. Every simulation loop you write in the integration module will have this shape.
:::

## Subtracting two nearly equal numbers

One more failure mode, because it produces answers that are wrong rather than merely inexact. When two close numbers are subtracted, the leading digits cancel and what remains is dominated by the rounding error that was already in them:

```python
# cancellation.py
a = 1e16
print(repr(a + 1 - a))     # 0.0
print(repr(a - a + 1))     # 1.0
```

Adding 1 to $10^{16}$ changes nothing, because at that magnitude the gap between representable numbers is 2. The first expression therefore loses the 1 entirely and the second keeps it: **floating-point addition is not associative**, and the order you write a sum in changes its value.

The numerical methods module treats this properly, under the name catastrophic cancellation, along with the algebraic rearrangements that avoid it. For now, carry one habit: be suspicious of a difference between two large, nearly equal quantities — two positions in an Earth-centred frame, two epochs in seconds since 2000, an energy computed as a difference of two terms. Compute the small quantity directly when you can.

## Infinity and not-a-number

IEEE 754 defines two special values. Python's own float division refuses to produce them from zero division, which differs from C and from NumPy:

```python
# specials.py
import math

try:
    print(0.0 / 0.0)
except ZeroDivisionError as e:
    print(type(e).__name__ + ":", e)   # ZeroDivisionError: float division by zero

inf = float("inf")
nan = float("nan")

print(inf, nan, inf - inf)             # inf nan nan
print(nan == nan)                      # False
print(math.isnan(nan))                 # True
print(math.isfinite(inf))              # False
```

`nan` — not a number — comes out of undefined operations such as `inf - inf`, the square root of a negative in NumPy, or the norm of a zero-length vector divided by itself. It is *sticky*: any arithmetic involving a nan produces a nan, so one bad value at the start of a run poisons everything downstream.

The dangerous property is the comparison rule: every comparison with nan is false, including `nan == nan`. So a limit check like `if value > limit:` is `False` for a nan, and a nan sails silently through a test designed to catch bad values. Test explicitly with `math.isnan(x)`, or guard inputs with `math.isfinite(x)`, which is false for both nan and the infinities.

::: warning
NumPy, which you meet in the next modules, does *not* raise on zero division: it produces `inf` or `nan` and a `RuntimeWarning`, which is easy to miss in a log. Wherever a computed array feeds a decision, check it with `numpy.isfinite` before believing it. Python's own behaviour — raising `ZeroDivisionError` — is the exception among languages, not the rule.
:::

::: example Comparing two computed velocities
A regression test compares a velocity from a refactored integrator against the recorded value from the old one. Three ways to write the comparison, and only one of them is right.

```python
# compare_velocity.py
import math

recorded = 7676.543210987654
computed = 7676.543210987655       # one ulp higher

print(computed == recorded)                                   # False
print(round(computed, 6) == round(recorded, 6))               # True
print(math.isclose(computed, recorded, rel_tol=1e-12))        # True

residual_old = 0.0
residual_new = 3.2e-13

print(math.isclose(residual_new, residual_old, rel_tol=1e-12))                  # False
print(math.isclose(residual_new, residual_old, rel_tol=1e-12, abs_tol=1e-9))    # True
```

The first comparison fails on a difference of one unit in the last place — $9.09 \times 10^{-13}$ m/s at this magnitude, which is under a picometre per second. No integrator on earth is being tested at that level, and no physics changed; the two numbers came out of different orderings of the same arithmetic.

The second appears to work and is a trap waiting for a value near a rounding boundary, as the previous section showed.

The third states the engineering requirement: agreement to one part in $10^{12}$, which for a 7.7 km/s velocity is about $8 \times 10^{-9}$ m/s. That is a claim you can defend in a review.

The last two lines are the residual case. `rel_tol` alone cannot compare anything with zero, so the check on a residual that should be zero fails no matter how small the residual is; adding `abs_tol=1e-9` — a nanometre per second, chosen from what the test means by "zero" — makes it pass. Every comparison against zero needs an absolute tolerance with a physical justification.
:::

## When a float is the wrong type

Two alternatives exist in the standard library, and both are far slower than `float`. Use them where exactness matters more than speed.

- `decimal.Decimal` does arithmetic in base ten, exactly as written, with a precision you choose. It is for money and for anything specified in decimal terms. `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")` is `True`. Build them from **strings**, not from floats — `Decimal(0.1)` faithfully records the binary approximation you were trying to escape.
- `fractions.Fraction` holds an exact ratio of integers. It is the right tool when a constant is defined as a ratio, such as the 5/9 in a Rankine-to-kelvin conversion.

For physics, use `float`. The measurements themselves are good to five or six digits at best, and sixteen digits of binary precision is not the limiting factor in any GNC calculation. What the limiting factor *is*, sometimes, is the way you arranged the arithmetic — which is what this lesson has been about.

## Check yourself

::: check
A colleague reports that `0.1 + 0.2 == 0.3` is `False` and asks whether Python has a bug. Answer in three sentences, and say what the difference is numerically.
:::

::: answer
Binary floating point can represent only fractions whose denominator is a power of two, so neither 0.1 nor 0.2 nor 0.3 is stored exactly: the first two are stored slightly high and 0.3 slightly low. The sum of the two stored values is therefore a different number from the stored 0.3, and `==` correctly reports that they differ. Numerically `0.1 + 0.2 - 0.3` is `5.551115123125783e-17`, about a quarter of `sys.float_info.epsilon` — one or two units in the last place, exactly what IEEE 754 promises. The same is true in C++ and MATLAB.
:::

::: check
Why does `math.isclose(0.0, 1e-20)` return `False`, and what does that tell you about testing whether a residual is zero?
:::

::: answer
`isclose` defaults to `rel_tol=1e-09` and `abs_tol=0.0`, and a relative tolerance measured against zero is zero — so nothing is relatively close to zero except zero itself. Any comparison against zero must supply an absolute tolerance: `math.isclose(r, 0.0, abs_tol=1e-12)`, or simply `abs(r) < 1e-12`. The number must come from the problem — what magnitude counts as "no residual" for this quantity in these units — and not from a habit.
:::

::: check
A propagator accumulates `t += dt` with `dt = 0.001` for one million steps. Estimate the error in `t`, and give the fix.
:::

::: answer
Each addition rounds to about `epsilon` relative to the running total, so the error grows roughly like the number of steps times the unit round-off times the magnitude: with $n = 10^{6}$, $u \approx 1.1 \times 10^{-16}$ and a total near 1,000 s, that is of order $10^{6} \times 1.1 \times 10^{-16} \times 1000 \approx 10^{-7}$ s — a tenth of a microsecond, and in the worst case larger. The fix is not to accumulate at all: keep an integer step counter and compute `t = step * dt`, which rounds once instead of a million times and is exact whenever `step * dt` is representable.
:::

::: check
A limit check reads `if peak > limit: fail()`. A sensor dropout has put a `nan` in the data and `peak` is `nan`. What happens, and how should the code be written?
:::

::: answer
Every comparison involving `nan` is false, so `peak > limit` is `False` and the check passes. The bad data is reported as a good run — the worst possible outcome for a safety check. The code must test for validity before testing the limit: `if not math.isfinite(peak): raise TelemetryError(...)` and only then compare. The general rule is that `nan` cannot be caught by any ordinary comparison, including `!=`, `<` and `==`, and must be detected with `math.isnan` or `math.isfinite`.
:::

::: check
Why is `Decimal(0.1)` not the right way to get an exact one tenth, and what is?
:::

::: answer
`Decimal(0.1)` converts the `float` 0.1, which is already the binary approximation, and records it exactly — all 55 digits of `0.1000000000000000055511151231257827021181583404541015625`. The conversion is faithful to the wrong number. Build it from a string instead: `Decimal("0.1")` is exactly one tenth, and `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")` is `True`. The same reasoning applies to `Fraction`: `Fraction(1, 10)` is exact, while `Fraction(0.1)` records the binary approximation's exact ratio.
:::

## Summary

| Item | Statement |
| --- | --- |
| `float` | IEEE 754 binary64: 53 bits of significand, about 15.9 decimal digits |
| `sys.float_info.epsilon` | $2^{-52} \approx 2.22 \times 10^{-16}$, the gap above 1.0 |
| Representable | Only fractions with a power-of-two denominator; `0.1` is $3602879701896397/2^{55}$ |
| `0.1 + 0.2` | `0.30000000000000004`; differs from `0.3` by `5.551115123125783e-17` |
| `repr` | The shortest text that reads back as the same number, so `0.1` looks clean |
| Comparison | `math.isclose(a, b, rel_tol=1e-9, abs_tol=0.0)`; never `==` on computed floats |
| Against zero | `rel_tol` cannot work; supply `abs_tol` from the physics |
| Rounding | Not a closeness test: values a hair apart can round to different values |
| Accumulation | `t += dt` drifts; count steps in an `int` and use `t = step * dt` |
| Exact totals | `math.fsum(xs)` is correctly rounded; `sum(xs)` is not |
| Associativity | `1e16 + 1 - 1e16` is `0.0`, `1e16 - 1e16 + 1` is `1.0` |
| `nan` | Every comparison with it is false, including `nan == nan`; test `math.isnan`/`math.isfinite` |
| Zero division | Python raises `ZeroDivisionError`; NumPy gives `inf`/`nan` with a warning |
| Exact alternatives | `Decimal("0.1")` for decimal exactness, `Fraction(5, 9)` for ratios; build from strings |

One lesson remains, and it is the one that makes everything you have written reproducible: virtual environments, `pip`, and the files that record exactly which versions produced a result.
