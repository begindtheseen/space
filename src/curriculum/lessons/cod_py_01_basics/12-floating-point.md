---
id: l12-floating-point
title: Floating point, and why 0.1 + 0.2 is not 0.3
minutes: 22
covers:
  - Floating point: why 0.1 + 0.2 != 0.3 and what to do about it
---

Try this with a pencil. You have an index card with room for eight digits after the decimal point, and you must write one third on it. The best you can do is 0.33333333. Write it on three cards and add them: 0.99999999, not 1. Your adding was fine. Each card was too short to hold one third, so each was a tiny bit low, and the shortfalls added up.

Your computer does exactly this, only in base two instead of base ten. Ask Python:

```python
>>> 0.1 + 0.2
0.30000000000000004
```

That is not a bug. C++, MATLAB, Java and JavaScript all give the same answer. A `float` is not a decimal number. It is the nearest binary number the machine can store, and "nearest" is not "equal".

This matters to a GNC engineer early. Your scripts compare computed velocities, add up time over a hundred thousand integration steps, and decide whether a simulated landing passed. Every one of those is a comparison between floats. A test written with `==` (read "equals equals", Python's equality test) will fail for reasons that have nothing to do with the physics — or pass on your laptop and fail on the build server. This lesson shows what is stored, why the sum comes out as it does, what to compare with instead, how error grows in a loop, and the two special values a bad calculation produces.

## What a float actually stores

A Python `float` follows a standard called **[[IEEE 754|ieee-754]]** — the rulebook nearly every processor uses for decimal-point arithmetic. Python's float is that standard's **binary64** format, which C++ calls a `double`. It is 64 bits (ones and zeros) in three parts:

- **1 sign bit** — plus or minus;
- **11 exponent bits** — which power of two sets the scale, like the "× 10³" in scientific notation;
- **52 fraction bits** — the digits themselves, in binary.

A hidden leading 1 comes for free, so you get 53 binary digits of precision. That is about 15.9 decimal digits, since $53 \times \log_{10} 2 \approx 15.95$. The **[[layout of the 64 bits|binary64-layout]]** is fixed, and the interpreter will tell you its limits:

```python
>>> import sys
>>> sys.float_info.dig
15
>>> sys.float_info.epsilon
2.220446049250313e-16
```

`dig` is how many decimal digits are guaranteed to survive a trip into a float and back. `epsilon` is the gap between 1.0 and the next float up. It equals $2^{-52}$ (read "two to the minus fifty-two"), about $2.22 \times 10^{-16}$. That is the size of the error, relative to the number, in every stored value and every operation.

### Which numbers exist

A decimal fraction is built from tenths, hundredths, thousandths. A binary fraction is built from **[[halves, quarters, eighths, sixteenths|binary-ruler]]**, and so on. So a number is stored exactly only if you can make it from those pieces — that is, when written as a fraction in lowest terms, its bottom number is a power of two.

- One half is $\frac{1}{2}$: exact.
- 0.375 is $\frac{3}{8}$: exact.
- One tenth is $\frac{1}{10}$. Ten is not a power of two, so no finite pile of halves and quarters makes it. In binary it repeats forever, like one third in decimal, and is cut off after 53 digits.

You can ask Python for the exact fraction it holds:

```python
>>> (0.1).as_integer_ratio()
(3602879701896397, 36028797018963968)
```

The bottom number is $2^{55}$. So when you write `0.1`, the program holds exactly $3602879701896397 / 2^{55}$. That is very close to one tenth, and it is not one tenth.

### The gap between neighbors

Floats are not spread evenly. Between 1 and 2 there are $2^{52}$ of them, evenly spaced. Between 2 and 4 there are also $2^{52}$, so each gap is twice as wide. That gap has a name: an **[[ulp|ulp-spacing]]** — a **unit in the last place**, the distance from that float to the next one up. Python measures it with `math.ulp`:

```python
>>> import math
>>> math.ulp(1.0)
2.220446049250313e-16
>>> math.ulp(0.3)
5.551115123125783e-17
>>> math.ulp(1e16)
2.0
```

The first is `epsilon`: epsilon is the ulp of 1.0. Remember the last one: near $10^{16}$, the next float up is 2 away.

## Why the sum is not 0.3

The `decimal` module can print the *exact* value of a stored float. That turns the mystery into three lines you can read:

```python
>>> from decimal import Decimal
>>> Decimal(0.1)
Decimal('0.1000000000000000055511151231257827021181583404541015625')
>>> Decimal(0.2)
Decimal('0.200000000000000011102230246251565404236316680908203125')
>>> Decimal(0.3)
Decimal('0.299999999999999988897769753748434595763683319091796875')
```

Read them one at a time:

1. The stored `0.1` is a little **above** one tenth.
2. The stored `0.2` is a little **above** two tenths.
3. So their sum must be a little above three tenths.
4. But the stored `0.3` is a little **below** three tenths.

Two different numbers, so `==` is right. Here is what the addition produced:

```python
>>> from decimal import Decimal
>>> Decimal(0.1 + 0.2)
Decimal('0.3000000000000000444089209850062616169452667236328125')
>>> 0.1 + 0.2 - 0.3
5.551115123125783e-17
```

The gap is $5.55 \times 10^{-17}$. Compare it with `math.ulp(0.3)` above: it is the same number. The sum landed on the float **one ulp above** the stored 0.3 — the very next float up. That is also a quarter of epsilon, which makes sense: 0.3 lies between $\frac{1}{4}$ and $\frac{1}{2}$, where the gaps are a quarter of the gaps next to 1.

Nothing went wrong. Each step rounded to the nearest float, as the standard promises.

The symbol `!=` (read "not equal") in this lesson's title is the opposite of `==`. `0.1 + 0.2 != 0.3` is `True`.

::: key Why 0.1 + 0.2 == 0.3 is False
Binary floating point cannot represent those decimals exactly, so the sum lands one ulp away from the stored value of 0.3. Compare with a tolerance (`math.isclose` or `pytest.approx`), never with `==`.
:::

## Why `0.1` displays as `0.1`

If the stored value is really 0.1000000000000000055…, why does the prompt show `0.1`? Because Python's `repr` — the function that turns a value into the text you see at the prompt — prints the **[[shortest text that reads back as the same float|shortest-repr]]**. No shorter decimal lands on that exact binary value, so `0.1` is an honest short name for it. The display is rounded. The value is not.

So the surprise comes when you *add*. Each number on its own has a clean short name; their sum has none shorter than `0.30000000000000004`.

## Comparing with a tolerance

Two rulers from different shops never agree to the atom, but you still call them equal. In engineering, "equal" means "close enough for the job".

`math.isclose(a, b)` is the tool. It applies two tolerances at once:

$$
|a - b| \le \max\big(\text{rel\_tol} \times \max(|a|, |b|),\ \text{abs\_tol}\big)
$$

Read it as "the gap between $a$ and $b$ is no bigger than the larger of two allowances". The bars $|x|$ mean the size of $x$ with its sign dropped.

- The **relative tolerance**, `rel_tol`, is a fraction of the numbers' size. It scales, as you want for a velocity near 7,700 m/s.
- The **absolute tolerance**, `abs_tol`, is a fixed amount in the numbers' units. It covers values near zero.

The defaults are `rel_tol=1e-09` (one part in a billion) and `abs_tol=0.0`. The `e` means "times ten to the": `1e-09` is $10^{-9}$.

```python
# isclose.py
import math

print(math.isclose(0.1 + 0.2, 0.3))                 # True
print(math.isclose(1e6, 1e6 + 1.0))                 # False
print(math.isclose(0.0, 1e-20))                     # False
print(math.isclose(0.0, 1e-20, abs_tol=1e-12))      # True
```

Go through the four lines.

1. The famous sum is close to 0.3. Good.
2. $10^6$ and $10^6 + 1$ differ by one part in a million, a thousand times more than the default allows. The default is strict on purpose.
3. This one catches people. With `abs_tol` at zero, *nothing* is close to exactly zero except zero itself. The allowance is one billionth of $10^{-20}$, far smaller than the gap of $10^{-20}$.
4. Give an absolute tolerance and the test behaves.

So any comparison against zero — a leftover error, an error signal — needs an `abs_tol` chosen from the physics. "Within a micrometer per second" is a real statement. "Within one part in a billion of zero" means nothing.

In tests you will meet the same idea as `pytest.approx`, from the pytest testing tool: `assert 0.1 + 0.2 == pytest.approx(0.3)` passes. Its defaults are looser — a relative tolerance of $10^{-6}$ and an absolute tolerance of $10^{-12}$ — and you can override both, as with `isclose`.

## Rounding is not a comparison

Rounding both sides and comparing fails, because rounding has **boundaries**, and two values a hair apart can sit on opposite sides of one:

```python
# rounding_is_not_closeness.py
import math

a = 0.145
b = 0.14500000000000002

print(math.isclose(a, b))          # True
print(round(a, 2), round(b, 2))    # 0.14 0.15
print(round(a, 2) == round(b, 2))  # False
```

These two floats are neighbors, one ulp apart. But the stored `0.145` is really 0.14499999999999999…, a hair under the halfway point, so it rounds down to 0.14. Its neighbor is a hair over, so it rounds up to 0.15. The "forgiving" test fails.

Rounding is for display. `isclose` is for comparison. Nor does `round(x, 2)` "clean up" a value before you store it: it swaps one inexact binary number for another and loses information.

## Error grows in a loop

One operation is off by at most half an ulp. A hundred thousand of them in a row is a different story. Watch a clock that ticks in tenths:

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

`t += 0.1` (read "t plus-equals 0.1") means "add 0.1 to t and store it back in t". Adding one tenth ten times gives 0.9999999999999999: each addition rounds, and the errors do not cancel. Multiplying 10 by 0.1 once gives exactly 1.0, because there is only one rounding.

That gives you the rule for time in a simulation loop: **count steps in an integer and compute the time as `step * dt`**. Python's `int` is exact at any size, so the count never drifts, and the multiplication rounds only once. Your stopping condition can test the integer — `while step < n:` — instead of a float that may never hit its target exactly.

How big does the drift get? Add 0.1 a hundred thousand times and you get 10000.000000018848 instead of 10000: about 19 nanoseconds off. In single precision, the 32-bit float common on small flight computers, the same loop ends **[[about 1.4 seconds short|patriot-clock]]**.

`math.fsum` is the other tool. It keeps track of the bits that ordinary addition throws away and returns the **[[correctly rounded total|fsum-inside]]** — the float nearest the true sum. It is slower than `sum`; use it to total a long column of numbers offline.

::: example A loop that never stops at 1.0
Here is the bug in the wild. A script steps a simulated clock by 0.1 s and should stop when it reaches one second:

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

Follow it step by step. After step 10, `t` is `0.9999999999999999`. That is not `1.0`, so `t != 1.0` is still true and the loop keeps going. From then on `t` only moves further away. The safety counter `steps < 20` stops it at `t` ≈ 2.0; without it the program would run forever. The loop does not look wrong on the page, which is why you need to recognize it.

There are two correct fixes.

**Fix one: use an inequality.** `while t < 1.0:` always ends, because it stops at the first step at or past the target. Use this when the target is a physical quantity, like "until the altitude drops below zero". Be ready for one surprise: after ten steps `t` is 0.9999999999999999, which is still less than 1.0, so this loop runs an eleventh step and ends at 1.0999999999999999.

**Fix two: take the float out of the condition.**

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

The counter is an `int`, so the loop runs exactly 10 times. The time is *recomputed* from the counter rather than *accumulated*, so each value holds one rounding instead of a growing pile.

**Sanity check.** Not every `step * dt` is the "nice" decimal — `3 * 0.1` is `0.30000000000000004` — but each is within about an ulp of the true time, and that error does not grow. Every simulation loop in the integration module has this shape.
:::

## Subtracting two nearly equal numbers

This failure gives answers that are *wrong*, not merely inexact. Measure two tall buildings to the nearest meter and subtract: if they differ by 30 cm, your answer is pure measuring noise. Floats do the same. Subtract two close numbers and the matching leading digits cancel, leaving mostly the rounding error already in them.

```python
# cancellation.py
a = 1e16
print(repr(a + 1 - a))     # 0.0
print(repr(a - a + 1))     # 1.0
```

Remember that near $10^{16}$ the gap between floats is 2. So $10^{16} + 1$ rounds straight back to $10^{16}$, and the 1 is lost. The first line subtracts and gets 0. The second line does the subtraction first, gets exactly 0, then adds 1.

This shows that **floating-point addition is not associative**: the grouping of a sum changes its value. In ordinary arithmetic $(a + b) + c = a + (b + c)$ always. In floats it does not.

The numerical methods module treats this as **catastrophic cancellation**, with ways to rearrange formulas around it. For now, be suspicious of any difference between two large, nearly equal numbers: two positions in an Earth-centered frame, two times counted in **[[seconds since 2000|j2000-seconds]]**, an energy computed as one big term minus another. When you can, compute the small quantity directly.

## Infinity and not-a-number

IEEE 754 defines two special values that a calculation can produce instead of stopping: **infinity**, written `inf`, and **not-a-number**, written `nan`. Python's own float division refuses to make them from a division by zero. That differs from C++ and from NumPy.

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

`nan` comes out of operations with no sensible answer: `inf - inf`, zero divided by zero in NumPy, the square root of a negative number in NumPy. It is **sticky**: any arithmetic with a `nan` in it gives `nan`, so one bad value poisons everything after it.

The dangerous part is how it compares. **Every comparison with `nan` is false**, even `nan == nan`. So a limit check like `if value > limit:` is `False` for a `nan`, and the `nan` slips quietly through a test built to catch bad values. That rule was a **[[deliberate choice|nan-not-equal]]** in the standard, and you have to work with it.

Test for it directly. `math.isnan(x)` is true only for `nan`. `math.isfinite(x)` is false for `nan` *and* for both infinities, which makes it the better guard on inputs.

::: warning NumPy does not stop on zero division
NumPy, which you meet in later modules, does *not* raise on zero division. It produces `inf` or `nan` and a `RuntimeWarning` that is easy to miss in a log. Wherever a computed array feeds a decision, check it with `numpy.isfinite` first. Python's `ZeroDivisionError` is the exception among languages, not the rule.
:::

::: example Comparing two computed velocities
A regression test — one that checks new code still gives the old answers — compares a velocity from a rewritten integrator with the value recorded from the old one. Three ways to write it; only one is right.

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

**Line one, `==`.** It fails on a difference of one ulp. At 7,676 m/s one ulp is $9.09 \times 10^{-13}$ m/s — less than a picometer (a trillionth of a meter) per second. No physics changed; the same arithmetic was done in a different order.

**Line two, rounding.** It works here, and is a trap waiting for a value near a rounding boundary.

**Line three, `isclose`.** It states the engineering requirement: agreement to one part in $10^{12}$. For this velocity that allowance is $10^{-12} \times 7676.5 \approx 7.68 \times 10^{-9}$ m/s. That is a claim you can defend in a review.

**The last two lines** check a **residual**, a leftover error that should be zero. With `rel_tol` alone, any nonzero residual fails. Adding `abs_tol=1e-9` — a nanometer per second, chosen from what this test means by "zero" — passes it, since $3.2 \times 10^{-13} \le 10^{-9}$.

**Sanity check.** The one-ulp gap should be far below the allowance, and it is: about 8,000 times smaller.
:::

## When a float is the wrong type

The standard library has two exact alternatives. Both are much slower than `float`, so use them only where exactness matters more than speed.

- **`decimal.Decimal`** does arithmetic in base ten, exactly as written, with a precision you choose. It suits money and anything specified in decimal. `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")` is `True`. Build a Decimal from a **string**, not a float: `Decimal(0.1)` faithfully records the binary approximation you were trying to escape.
- **`fractions.Fraction`** holds an exact ratio of two integers. It fits a constant defined as a ratio, like the 5/9 in a Rankine-to-kelvin conversion: `Fraction(5, 9)` is exactly five ninths.

For physics, use `float`. Real measurements are good to five or six digits at best, so sixteen digits is never the weak link. When something goes wrong, the cause is the way the arithmetic was arranged: a `==`, an accumulated clock, a difference of two huge numbers.

## Check yourself

::: check
A colleague finds that `0.1 + 0.2 == 0.3` is `False` and asks whether Python has a bug. Answer in three sentences, and say how big the difference is.
:::

::: answer
A binary float holds exactly only fractions whose bottom is a power of two, so 0.1 and 0.2 are stored slightly high and 0.3 slightly low. The sum of the two stored values is therefore the next float above the stored 0.3, and `==` correctly says they differ. Numerically `0.1 + 0.2 - 0.3` is `5.551115123125783e-17`, which is exactly one ulp of 0.3 (and a quarter of `sys.float_info.epsilon`); C++ and MATLAB give the same result.
:::

::: check
Why does `math.isclose(0.0, 1e-20)` return `False`, and what does that tell you about testing whether a residual is zero?
:::

::: answer
`isclose` defaults to `rel_tol=1e-09` and `abs_tol=0.0`. The relative allowance is one billionth of the larger value, here $10^{-29}$, which is smaller than the gap $10^{-20}$ — and if both sides were nearer zero it would shrink further. In short, nothing is relatively close to zero except zero itself. Any comparison against zero needs an absolute tolerance: `math.isclose(r, 0.0, abs_tol=1e-12)`, or `abs(r) < 1e-12`. Pick the number from the problem — what size counts as "no residual" in these units.
:::

::: check
A propagator runs `t += dt` with `dt = 0.001` for one million steps. Estimate the worst-case error in `t`, and give the fix.
:::

::: answer
Each addition can round by up to half an ulp of the running total, a relative error of about $u \approx 1.1 \times 10^{-16}$ (half of epsilon). The total ends near $10^6 \times 0.001 = 1000$ s, so the worst case is about $n \times u \times \text{total} = 10^6 \times 1.1 \times 10^{-16} \times 1000 \approx 1.1 \times 10^{-7}$ s, a tenth of a microsecond. Running it gives `999.9999999832651`, off by $1.7 \times 10^{-8}$ s — inside the bound. The fix: keep an integer step counter and compute `t = step * dt`, which rounds once instead of a million times.
:::

::: check
A limit check reads `if peak > limit: fail()`. A sensor dropout has put a `nan` into the data, and `peak` is `nan`. What happens, and how should the code be written?
:::

::: answer
Every comparison with `nan` is false, so `peak > limit` is `False` and `fail()` never runs. Bad data is reported as a good run — the worst outcome for a safety check. Test validity first: `if not math.isfinite(peak): raise TelemetryError(...)`, and only then compare with `limit`. No ordinary comparison catches a `nan` reliably; use `math.isnan` or `math.isfinite`.
:::

::: check
Why is `Decimal(0.1)` the wrong way to get an exact one tenth, and what is the right way?
:::

::: answer
`Decimal(0.1)` starts from the float `0.1`, already the binary approximation, and records it exactly — all 55 digits after the point of `0.1000000000000000055511151231257827021181583404541015625`. Faithful to the wrong number. Build it from a string: `Decimal("0.1")` is exactly one tenth, and `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")` is `True`. The same goes for fractions: `Fraction(1, 10)` is exact, while `Fraction(0.1)` gives `3602879701896397/36028797018963968`, the binary approximation's exact ratio.
:::

## Summary

| Item | Statement |
| --- | --- |
| `float` | IEEE 754 binary64: 1 sign, 11 exponent, 52 fraction bits; about 15.9 decimal digits |
| `sys.float_info.epsilon` | $2^{-52} \approx 2.22 \times 10^{-16}$, the gap above 1.0 |
| ulp | Unit in the last place, the gap to the next float: `math.ulp(x)` |
| Exact floats | Only fractions with a power-of-two bottom; `0.1` is $3602879701896397/2^{55}$ |
| `0.1 + 0.2` | `0.30000000000000004`: one ulp above the stored `0.3`, a gap of `5.551115123125783e-17` |
| `repr` | The shortest text that reads back as the same float, so `0.1` looks clean |
| Comparing | `math.isclose(a, b, rel_tol=1e-9, abs_tol=0.0)` or `pytest.approx`; never `==` on computed floats |
| Against zero | `rel_tol` cannot work; supply `abs_tol` from the physics |
| Rounding | Not a closeness test: neighbors can round to different values |
| Accumulation | `t += dt` drifts; count steps in an `int` and use `t = step * dt` |
| Exact totals | `math.fsum(xs)` is correctly rounded; `sum(xs)` is not |
| Not associative | `1e16 + 1 - 1e16` is `0.0`; `1e16 - 1e16 + 1` is `1.0` |
| `nan` | Every comparison with it is false, even `nan == nan`; test `math.isnan` / `math.isfinite` |
| Zero division | Python raises; NumPy gives `inf`/`nan` and a warning |
| Exact alternatives | `Decimal("0.1")`, `Fraction(5, 9)`; never build from a float |

The next and last lesson makes your work reproducible: virtual environments, `pip`, and the files that record which library versions produced a result.

::: context ieee-754 One rulebook for every chip
Before the 1980s, each computer maker did decimal-point arithmetic its own way, and the same program could give different answers on different machines. The Institute of Electrical and Electronics Engineers (IEEE) published standard 754 in 1985 to fix that, and revised it in 2008 and 2019. It fixes the bit layouts, how every operation must round, and the special values `inf` and `nan`. That is why `0.1 + 0.2` gives the same `0.30000000000000004` in Python, C++ and JavaScript, on a laptop or a flight computer.
:::

::: context binary64-layout The 64 bits of 0.1
Here is `0.1` exactly as it sits in memory, hex `3FB999999999999A`. The exponent field holds 1019; subtract the fixed offset of 1023 and you get $-4$, so the scale is $2^{-4} = \frac{1}{16}$. The fraction bits, with the hidden leading 1, make about 1.6. And $1.6 \times \frac{1}{16} = 0.1$ — almost. The pattern 1001 repeats and has to stop somewhere; the last group rounds up to 1010, which is why the stored value is a hair above one tenth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="20" font-size="11" fill="#1f2a44">sign</text>
  <text x="44" y="20" font-size="11" fill="#1f2a44">exponent (11)</text>
  <text x="180" y="20" font-size="11" fill="#1f2a44">fraction (52)</text>
  <rect x="10" y="28" width="6" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="16" y="28" width="58" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="74" y="28" width="276" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <text x="45" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">1019</text>
  <text x="212" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">1001 1001 1001 … 1001 1010</text>
  <text x="12" y="84" font-size="12" fill="#1f2a44">sign 0 → plus</text>
  <text x="12" y="104" font-size="12" fill="#1d6fd1">exponent 01111111011 = 1019 → 2^(1019 − 1023) = 2^−4</text>
  <text x="12" y="124" font-size="12" fill="#1f2a44">fraction → 1.6000000000000000888…</text>
  <text x="12" y="143" font-size="12" fill="#b4232c">value = 1.6000…0888 × 1/16 = 0.1000…0555</text>
</svg>
```
:::

::: context binary-ruler Why one tenth never lands on a mark
Picture a ruler that only has binary marks: halves, then quarters, then eighths, and so on, each set halving the gaps of the one before. Zoomed in on the stretch from 0 to one quarter, 0.1 sits between $\frac{1}{16}$ and $\frac{1}{8}$, then between $\frac{3}{32}$ and $\frac{1}{8}$, then between $\frac{3}{32}$ and $\frac{7}{64}$ — and however many times you halve, it never sits exactly on a mark. A float gets 53 halvings, then must pick the nearest mark.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="48" x2="20" y2="72"/>
    <line x1="340" y1="48" x2="340" y2="72"/>
    <line x1="180" y1="50" x2="180" y2="70"/>
    <line x1="100" y1="52" x2="100" y2="68"/>
    <line x1="260" y1="52" x2="260" y2="68"/>
    <line x1="140" y1="54" x2="140" y2="66"/>
    <line x1="160" y1="55" x2="160" y2="65"/>
  </g>
  <text x="20" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="100" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">1/16</text>
  <text x="140" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">3/32</text>
  <text x="180" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">1/8</text>
  <text x="166" y="104" font-size="11" text-anchor="start" fill="#1f2a44">7/64</text>
  <text x="260" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">3/16</text>
  <text x="340" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">1/4</text>
  <line x1="148" y1="30" x2="148" y2="60" stroke="#b4232c" stroke-width="2"/>
  <circle cx="148" cy="60" r="3.5" fill="#b4232c"/>
  <text x="148" y="24" font-size="12" text-anchor="middle" fill="#b4232c">0.1</text>
</svg>
```
:::

::: context ulp-spacing Floats get sparser as they grow
A float stores a fixed number of binary digits, then a scale. So every stretch from one power of two to the next — 1 to 2, 2 to 4, 4 to 8 — holds the same count of floats, and doubling the stretch doubles the gap. The picture shows a toy float with 8 values per doubling; a real binary64 has $2^{52}$. "Unit in the last place" means the value of the smallest digit, which is exactly that gap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="68" x2="340" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="20.0" y1="56" x2="20.0" y2="74"/><line x1="25.7" y1="60" x2="25.7" y2="68"/><line x1="31.4" y1="60" x2="31.4" y2="68"/><line x1="37.1" y1="60" x2="37.1" y2="68"/><line x1="42.9" y1="60" x2="42.9" y2="68"/><line x1="48.6" y1="60" x2="48.6" y2="68"/><line x1="54.3" y1="60" x2="54.3" y2="68"/><line x1="60.0" y1="60" x2="60.0" y2="68"/>
    <line x1="65.7" y1="56" x2="65.7" y2="74"/><line x1="77.1" y1="60" x2="77.1" y2="68"/><line x1="88.6" y1="60" x2="88.6" y2="68"/><line x1="100.0" y1="60" x2="100.0" y2="68"/><line x1="111.4" y1="60" x2="111.4" y2="68"/><line x1="122.9" y1="60" x2="122.9" y2="68"/><line x1="134.3" y1="60" x2="134.3" y2="68"/><line x1="145.7" y1="60" x2="145.7" y2="68"/>
    <line x1="157.1" y1="56" x2="157.1" y2="74"/><line x1="180.0" y1="60" x2="180.0" y2="68"/><line x1="202.9" y1="60" x2="202.9" y2="68"/><line x1="225.7" y1="60" x2="225.7" y2="68"/><line x1="248.6" y1="60" x2="248.6" y2="68"/><line x1="271.4" y1="60" x2="271.4" y2="68"/><line x1="294.3" y1="60" x2="294.3" y2="68"/><line x1="317.1" y1="60" x2="317.1" y2="68"/>
    <line x1="340.0" y1="56" x2="340.0" y2="74"/>
  </g>
  <text x="20" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">0.5</text>
  <text x="65.7" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="157.1" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="340" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="43" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">gap 1/16</text>
  <text x="111" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">gap 1/8</text>
  <text x="248" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">gap 1/4</text>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#b4232c">same count per doubling, so the gap doubles</text>
</svg>
```
:::

::: context shortest-repr How Python picks the digits it shows
Every float has one exact decimal value, often 50 or more digits long. Showing all of them would bury you. Showing a fixed 17 digits would print `0.1` as `0.10000000000000001`. Since Python 3.1, `repr` searches for the shortest decimal string that, read back in, gives the very same float. For `0.1` that is `0.1`. For the sum `0.1 + 0.2` nothing shorter than `0.30000000000000004` works, because `0.3` already belongs to a different float.
:::

::: context patriot-clock When a clock drift cost lives
In February 1991, a Patriot air-defense battery at Dhahran, Saudi Arabia, failed to intercept an incoming Scud missile, which struck a barracks and killed 28 US soldiers. A US government investigation traced it to the system clock. It counted time in tenths of a second, and one tenth was stored in a 24-bit register, cut short by about $9.5 \times 10^{-8}$ s each tick. After about 100 hours of running, that had built up to about 0.34 s. The Scud travels roughly 1.7 km per second, so the tracking system looked for it in the wrong place by hundreds of meters.
:::

::: context fsum-inside How fsum keeps what sum throws away
When you add a small number to a big running total, the low-order bits of the small number fall off the end and are lost. `math.fsum` does not let them go. It keeps several partial sums, each holding pieces of different sizes with no overlap, so every bit that ordinary addition would discard is kept in some partial sum. Only at the very end does it combine them, with a single rounding. That one rounding is why its answer is the float closest to the true total.
:::

::: context j2000-seconds Time as one big number
Spacecraft software often counts time as seconds since an agreed starting instant, the J2000 epoch — noon on 1 January 2000. By late 2026 that count is about 840 million seconds. Near that size the gap between neighboring doubles is about $1.2 \times 10^{-7}$ s, a tenth of a microsecond. Subtract two such timestamps a millisecond apart and the answer carries that much rounding. It is fine for most work, but it is why precise timing code often keeps whole seconds and the fraction of a second in two separate numbers.
:::

::: context nan-not-equal Why nan is not equal to itself
It looks like a mistake, but it was chosen on purpose. A `nan` stands for "no meaningful answer", and two different failed calculations should not count as equal merely because both failed. It also gave programmers a test that works in any language, even before a library function existed: `x != x` is true only when `x` is a `nan`. The price is that ordinary limit checks let it through, which is why you guard with `math.isfinite`.
:::
