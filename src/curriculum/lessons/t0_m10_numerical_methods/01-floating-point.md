---
id: l01-floating-point
title: Floating point in flight software
minutes: 18
covers:
  - floating-point representation, machine epsilon, catastrophic cancellation
---

Every number a flight computer holds is a finite string of bits, and every arithmetic operation it performs rounds. Most of the time the rounding is harmless: a double-precision number carries about sixteen decimal digits, and no sensor on a vehicle is good to sixteen digits. The trouble is that a small class of operations throws those digits away wholesale, and a small class of design decisions — which precision to store a quantity in, how to accumulate time, how to compare two values — turns a harmless rounding into a divergence that grows for the whole mission.

A GNC engineer meets this in three places. In simulation, where a propagator run for a hundred thousand steps accumulates round-off that can masquerade as a physics error. In flight software, where the choice between 32-bit and 64-bit storage for a position vector decides whether the vehicle knows where it is to a nanometre or to half a metre. And in estimation, where covariance matrices lose positive-definiteness through cancellation and a Kalman filter quietly stops working.

This lesson gives you the model of floating-point arithmetic you need to predict these failures before they happen: how a number is stored, how large the rounding error is, when subtraction destroys accuracy, and how to compare and accumulate numbers safely.

## How a floating-point number is stored

A floating-point number is scientific notation in base 2. It has a sign, an exponent, and a significand (the string of significant bits). IEEE 754 fixes the layout:

| Format | Sign | Exponent | Fraction bits | Significand precision | Decimal digits |
| --- | --- | --- | --- | --- | --- |
| binary32 (`float32`, C `float`) | 1 | 8 | 23 | 24 bits | about 7.2 |
| binary64 (`float64`, C `double`, Python `float`) | 1 | 11 | 52 | 53 bits | about 15.9 |

The value stored is

$$
x = (-1)^s \times 1.f \times 2^{e - \text{bias}},
$$

where $s$ is the sign bit, $f$ is the fraction field read as binary digits after the point, and $e$ is the exponent field with bias 127 for `float32` and 1023 for `float64`. The leading 1 before the binary point is not stored — every normalised binary number starts with 1, so it is implied. That hidden bit is why a 52-bit fraction gives 53 bits of precision, and 53 bits is $53 \log_{10} 2 \approx 15.95$ decimal digits.

Two exponent values are reserved. The largest (all ones) encodes infinity when the fraction is zero and NaN (not a number) otherwise. The smallest (all zeros) encodes zero and the *subnormal* numbers, which fill the gap between zero and the smallest normalised value with reduced precision. The ranges that result:

| | `float32` | `float64` |
| --- | --- | --- |
| Largest finite | about $3.40 \times 10^{38}$ | about $1.80 \times 10^{308}$ |
| Smallest normalised | about $1.18 \times 10^{-38}$ | about $2.23 \times 10^{-308}$ |
| Smallest subnormal | about $1.40 \times 10^{-45}$ | about $4.94 \times 10^{-324}$ |

Range is rarely the problem in GNC — nothing on a vehicle is near $10^{308}$. Precision is.

Most decimal fractions are not representable at all. One tenth in binary is $0.0001100110011\ldots$, repeating forever, so the stored `float64` value of `0.1` is

$$
0.1000000000000000055511151231257827\ldots
$$

and the stored `float32` value is $0.100000001490116\ldots$. Neither is 0.1. That single fact explains a famous class of timing bugs, which the first worked example takes apart.

## Machine epsilon and unit round-off

Because the significand has a fixed number of bits, representable numbers are not evenly spaced. Between $2^k$ and $2^{k+1}$ the spacing is $2^{k-52}$ in `float64` and $2^{k-23}$ in `float32`. That spacing is called the *unit in the last place*, or ulp, of any number in that range.

*Machine epsilon* $\varepsilon$ is the spacing just above 1: the distance from 1 to the next representable number.

$$
\varepsilon_{64} = 2^{-52} \approx 2.22 \times 10^{-16}, \qquad
\varepsilon_{32} = 2^{-23} \approx 1.19 \times 10^{-7}.
$$

You can find it in three lines of Python: keep halving a candidate until adding it to 1 no longer changes 1.

```python
eps = 1.0
while 1.0 + eps / 2 > 1.0:
    eps /= 2
print(eps)   # 2.220446049250313e-16
```

Rounding to nearest means the *relative* error of storing any number is at most half an ulp, which is at most $\varepsilon/2$. This quantity, $u = \varepsilon/2 = 2^{-53} \approx 1.11 \times 10^{-16}$, is the *unit round-off*. It gives the model that all error analysis rests on: for any real $x$ in range, the stored value is

$$
\mathrm{fl}(x) = x\,(1 + \delta), \qquad |\delta| \le u,
$$

and for any of the four basic operations on two stored numbers $a$ and $b$,

$$
\mathrm{fl}(a \circ b) = (a \circ b)(1 + \delta), \qquad |\delta| \le u.
$$

Each operation is correctly rounded; the true result is computed and then rounded once. The error is relative, not absolute. Large numbers carry large absolute errors: the ulp of $10^{16}$ in `float64` is 2, so `1e16 + 1 - 1e16` evaluates to `0.0`, because $10^{16} + 1$ rounds back to $10^{16}$ before the subtraction happens.

::: key
Machine epsilon is the spacing of representable numbers just above 1: $\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16}$ for `float64` and $2^{-23} \approx 1.19 \times 10^{-7}$ for `float32`. Every stored number and every arithmetic result carries a relative error of at most $u = \varepsilon/2$: $\mathrm{fl}(x) = x(1+\delta)$ with $|\delta| \le u$. The error is relative, so the absolute error scales with the size of the number.
:::

## Spacing in practice: positions and clocks

Relative precision of $10^{-16}$ sounds like more than enough for anything. Convert it to absolute spacing at the magnitudes GNC actually uses and the picture changes.

An Earth-centred inertial position for a low orbit has magnitude about $7 \times 10^{6}\,\mathrm{m}$, which lies between $2^{22} = 4{,}194{,}304$ and $2^{23} = 8{,}388{,}608$. The ulp is therefore $2^{22-52} \approx 9.3 \times 10^{-10}\,\mathrm{m}$ in `float64` — a nanometre, fine — but $2^{22-23} = 0.5\,\mathrm{m}$ in `float32`. A `float32` ECI position cannot represent a half-metre motion. A relative-navigation filter that differences two `float32` positions a metre apart gets an answer quantised to half a metre. That is not a precision loss; it is a different vehicle.

Time is the same story. Seconds since the J2000 epoch are now about $8 \times 10^{8}\,\mathrm{s}$, between $2^{29}$ and $2^{30}$, so the `float64` ulp is $2^{29-52} = 2^{-23} \approx 1.2 \times 10^{-7}\,\mathrm{s}$. A tenth of a microsecond is fine for propagating an orbit and useless for GPS, where a nanosecond is 30 cm of range. Precision timing code keeps an integer count of whole seconds and a separate floating-point fraction, so that the fraction always lives near zero where the spacing is fine.

::: example A mission clock kept in float32
A flight computer increments its mission elapsed time by 0.1 s every 10 Hz frame, and someone declares the accumulator as a 32-bit float. Two things go wrong. First, the increment itself is stored as $0.1000000014901\ldots$, high by $1.49 \times 10^{-9}\,\mathrm{s}$ per tick. Over a day, $864{,}000$ ticks, that alone gives $1.3\,\mathrm{ms}$ — annoying, not fatal.

The second effect is the killer. Once the accumulator passes $65{,}536\,\mathrm{s} = 2^{16}$, its ulp is $2^{16-23} = 0.0078125\,\mathrm{s}$. The sum $t + 0.1$ must round to a multiple of that spacing: 0.1 s is 12.8 ulps, so it rounds to 13 ulps, or $0.1015625\,\mathrm{s}$. Every tick the clock advances 1.56% too far. Emulating the arithmetic in Python (rounding to `float32` after each addition with `struct.pack('f', x)`), the clock reads $3601.16\,\mathrm{s}$ after one hour — already 1.16 s fast — and $87{,}145.8\,\mathrm{s}$ after one day, fast by $745.8\,\mathrm{s}$. In `float64` the same loop is off by $5.4 \times 10^{-7}\,\mathrm{s}$ after a day.

The fix is not "use `float64`". It is to count ticks in an integer and multiply by the period when a time in seconds is needed: $864{,}000 \times 0.1 = 86{,}400.0$ exactly, because the multiplication rounds once instead of $864{,}000$ times.
:::

::: warning
Never store an absolute position, an absolute time, or a running total in `float32`. Single precision is acceptable for quantities that live near zero — a relative position, a body rate, an error signal — and for interface buses where bandwidth matters. The number you must keep in your head is the ulp at the magnitude in question: $0.5\,\mathrm{m}$ at $7 \times 10^{6}\,\mathrm{m}$, $0.0078\,\mathrm{s}$ at one day.
:::

## Catastrophic cancellation

The rounding model says every operation has relative error at most $u$. Subtraction obeys the model too — and yet subtraction is where accuracy is destroyed. The reason is that the model bounds the error of the *result of the subtraction relative to that result*, while the inputs already carry errors relative to *themselves*.

Suppose $a$ and $b$ are computed values with small relative errors $\delta_a$ and $\delta_b$, so the stored values are $a(1+\delta_a)$ and $b(1+\delta_b)$. Their difference is

$$
a(1+\delta_a) - b(1+\delta_b) = (a - b) + a\,\delta_a - b\,\delta_b,
$$

so the relative error of the difference is

$$
\frac{|a\,\delta_a - b\,\delta_b|}{|a - b|} \le \frac{|a| + |b|}{|a - b|}\,u.
$$

When $a$ and $b$ are close, the amplification factor $(|a|+|b|)/|a-b|$ is enormous. The subtraction itself is exact (in fact, if $a$ and $b$ are within a factor of two of each other, $a - b$ is computed with no rounding at all); what it does is *expose* the rounding errors that were already present in $a$ and $b$ by removing the leading digits they agreed on. This is *catastrophic cancellation*: the leading digits cancel, and what remains is dominated by old rounding error.

A clean case is $1 - \cos x$ for small $x$. At $x = 10^{-4}$ the true value is $x^2/2 - x^4/24 \approx 4.9999999958 \times 10^{-9}$. Python's `1 - math.cos(1e-4)` returns $4.999999969612645 \times 10^{-9}$: eight of sixteen digits gone, because $\cos x$ was stored with an absolute error near $10^{-16}$ and then $0.99999999\ldots$ was subtracted from 1. At $x = 10^{-8}$ the result is exactly `0.0`, since $\cos(10^{-8})$ rounds to 1. The cure is an algebraically equivalent form with no subtraction: $1 - \cos x = 2\sin^2(x/2)$, which returns $5.000000000 \times 10^{-17}$ at $x = 10^{-8}$, correct to all digits.

::: example The small root of a quadratic
Solve $x^2 - 10^{8}x + 1 = 0$. The exact roots are $x_1 \approx 10^{8}$ and $x_2 \approx 10^{-8}$ (their product is $c/a = 1$). The textbook formula computes

$$
x_2 = \frac{-b - \sqrt{b^2 - 4ac}}{2a} = \frac{10^{8} - \sqrt{10^{16} - 4}}{2}.
$$

The square root is $99{,}999{,}999.99999998$, which in `float64` rounds to a neighbour of $10^{8}$, and the subtraction of two numbers that agree to sixteen digits leaves only rounding noise. Python gives $x_2 = 7.45 \times 10^{-9}$ — wrong by 25%. The large root, $x_1 = (10^{8} + \sqrt{\ldots})/2 = 10^{8}$, involves an addition and is fine. Use it: since $x_1 x_2 = c/a$,

$$
x_2 = \frac{c}{a\,x_1} = \frac{1}{10^{8}} = 1.0 \times 10^{-8},
$$

correct to machine precision. The rule generalises: compute the root whose sign avoids cancellation from the formula, and the other from the product of the roots.
:::

The same pattern hides in statistics. The variance formula $\mathrm{E}[x^2] - (\mathrm{E}[x])^2$ subtracts two nearly equal large numbers when the data has a large mean. For the three values $10^{8}+1$, $10^{8}+2$, $10^{8}+3$ it returns exactly `0.0` in `float64`; the two-pass formula $\frac{1}{n}\sum (x_i - \bar{x})^2$ returns the correct $0.6667$. Kalman filter covariance updates of the form $P - K H P$ have precisely this structure, which is why the Joseph form and square-root filters exist — you will meet them in the estimation modules.

::: key
Catastrophic cancellation: subtracting two nearly equal numbers $a$ and $b$ amplifies their existing relative errors by the factor $(|a| + |b|)/|a - b|$. The subtraction is exact; it exposes the rounding already in the operands. Cures are algebraic rearrangement ($1 - \cos x = 2\sin^2(x/2)$, $x_2 = c/(a x_1)$), Taylor series for small arguments, or a two-pass formulation.
:::

## Accumulation and summation order

Adding many small numbers to a large running total is the mission-clock problem in general form. Each addition rounds relative to the size of the *total*, so the small addend loses low bits every time. Summing 0.1 ten times in Python gives `0.9999999999999999`; summing it a million times in a loop gives $100{,}000.00000133$, an error of $1.3 \times 10^{-6}$, roughly $n u \times \text{total}$ with $n = 10^{6}$.

Three remedies, in increasing order of effort. Sum in a wider precision than you store. Sum pairwise (add neighbours, then add the sums, and so on), which reduces the error growth from $n u$ to about $u \log_2 n$. Or use *compensated* (Kahan) summation, which carries the rounding error of each step and feeds it back into the next:

```python
def kahan_sum(xs):
    s, c = 0.0, 0.0
    for x in xs:
        y = x - c          # correct the addend by the last error
        t = s + y          # the addition that rounds
        c = (t - s) - y    # recover what the rounding lost
        s = t
    return s

print(kahan_sum([0.1] * 1_000_000))   # 100000.0
print(sum([0.1] * 1_000_000))         # 100000.00000133288
```

The line `c = (t - s) - y` looks algebraically like zero. It is not zero in floating point, and that difference is the whole point. Python's `math.fsum` does an exactly rounded sum and is the right tool offline.

## Comparing floating-point numbers

Because `0.1 + 0.2 == 0.3` is `False` in `float64` (the left side is $0.30000000000000004$), equality comparison of computed values is a bug. A comparison needs a tolerance, and it needs both an absolute and a relative part:

$$
|a - b| \le \text{atol} + \text{rtol}\,\max(|a|, |b|).
$$

The relative part handles large numbers, where the spacing is coarse; the absolute part handles numbers near zero, where a relative tolerance alone would demand an impossible exactness. You will see the same two-term form again in adaptive integrators, where it sets the error a step is allowed to make in each state component. Asking for `rtol` below about $10^{-15}$ in `float64` asks for something the arithmetic cannot deliver.

## Infinities, NaN and the guard against them

Overflow produces $\pm\infty$; $0/0$, $\infty - \infty$ and $\sqrt{-1}$ produce NaN. NaN is *sticky*: any operation with a NaN input yields NaN, and every comparison with NaN is false, including `x == x`. In a control loop this means one bad divide (a norm of a zero vector, a quaternion of zero length) poisons the whole state within a frame, while every `if` guarding the code silently takes the false branch. Flight software checks `isfinite` on inputs at frame boundaries and clamps or substitutes rather than letting a NaN propagate. In Python, `math.isfinite(x)` is the test, and `x != x` is the classic idiom for detecting NaN.

::: warning
`float32` has only 24 bits of significand, so quantities that look modest can already be at the edge. The `float32` ulp of one day in seconds is 7.8 ms; of Earth's gravitational parameter in $\mathrm{m^3/s^2}$, $3.986 \times 10^{14}$, it is $3.4 \times 10^{7}$ — a relative error of $8 \times 10^{-8}$ that shows up directly as a period error. Use `float64` for all physics; reserve `float32` for storage of small, bounded signals.
:::

## Check yourself

::: check
A velocity of about $7{,}700\,\mathrm{m/s}$ is stored in `float32`. What is the spacing of representable values there, and is it adequate for a navigation filter working to $1\,\mathrm{mm/s}$?
:::

::: answer
$7{,}700$ lies between $2^{12} = 4{,}096$ and $2^{13} = 8{,}192$, so the exponent is 12 and the `float32` ulp is $2^{12-23} = 2^{-11} \approx 4.9 \times 10^{-4}\,\mathrm{m/s}$. Rounding to nearest gives at most half that, about $0.24\,\mathrm{mm/s}$ of error. That is inside a 1 mm/s requirement but with only a factor of four margin — and the *difference* of two such velocities is quantised to $0.49\,\mathrm{mm/s}$. In `float64` the ulp is $2^{12-52} \approx 9.1 \times 10^{-13}\,\mathrm{m/s}$. Store the state in `float64`.
:::

::: check
Explain, using the rounding model, why `1e16 + 1 - 1e16` evaluates to `0.0` while `1e16 - 1e16 + 1` evaluates to `1.0`.
:::

::: answer
Operations proceed left to right. In the first expression, $10^{16} + 1$ is computed first. The ulp of $10^{16}$ (between $2^{53}$ and $2^{54}$) is $2^{53-52} = 2$, so $10^{16}+1$ lies exactly halfway between two representable numbers and rounds to even, back to $10^{16}$. Subtracting $10^{16}$ then gives 0. In the second expression $10^{16} - 10^{16} = 0$ is exact, and $0 + 1 = 1$ is exact. Floating-point addition is not associative.
:::

::: check
You need $\sqrt{x^2 + 1} - 1$ for $x$ around $10^{-6}$. Estimate how many digits the direct formula loses, and give a formula that loses none.
:::

::: answer
At $x = 10^{-6}$, $\sqrt{x^2+1} \approx 1 + 5 \times 10^{-13}$. The square root is stored with absolute error up to about $u = 1.1 \times 10^{-16}$; subtracting 1 leaves $5 \times 10^{-13}$ carrying that same absolute error, a relative error near $2 \times 10^{-4}$: twelve of sixteen digits lost. Multiply and divide by the conjugate:

$$
\sqrt{x^2+1} - 1 = \frac{x^2}{\sqrt{x^2+1} + 1},
$$

which has an addition in the denominator and no cancellation anywhere. It returns $5.0 \times 10^{-13}$ correct to machine precision.
:::

::: check
A simulation logs $\varepsilon = v^2/2 - \mu/r$ for a circular orbit with $r = 6{,}878\,\mathrm{km}$, $\mu = 398{,}600.4\,\mathrm{km^3/s^2}$, so $v^2/2 \approx 28.98$ and $\mu/r \approx 57.95\,\mathrm{km^2/s^2}$. Roughly what is the smallest change in $\varepsilon$ the `float64` computation can resolve, and why does this matter for an energy-drift check?
:::

::: answer
Both terms are of order 30–60, where the `float64` ulp is $2^{5-52} \approx 7 \times 10^{-15}$. Each carries rounding of a few times $10^{-15}$, and the subtraction, with $|a| + |b| \approx 87$ against $|a-b| \approx 29$, amplifies the relative error by about 3. So relative changes in $\varepsilon$ below roughly $10^{-14}$ are noise. That sets the floor for an energy-conservation check: a propagator showing relative energy variation of $10^{-15}$ is at the arithmetic floor and cannot be judged further; one showing $10^{-8}$ is showing a real truncation error.
:::

::: check
Why does Kahan summation's line `c = (t - s) - y` not evaluate to zero, and what would happen if a compiler "optimised" it to zero?
:::

::: answer
Algebraically $t = s + y$, so $(t - s) - y = 0$. In floating point $t$ is the *rounded* sum, so $t - s$ recovers the part of $y$ that actually made it into the total (exactly, by Sterbenz's lemma, since $t$ and $s$ are close), and subtracting $y$ leaves the part that was rounded away. That remainder is the compensation. A compiler applying real-number algebra (as with aggressive fast-math flags) would delete the compensation and reduce the routine to a naive sum, silently. This is why flight code forbids such flags.
:::

## Summary

| Item | Statement |
| --- | --- |
| `float64` layout | 1 sign, 11 exponent, 52 fraction bits; 53-bit significand, about 15.9 digits |
| `float32` layout | 1 sign, 8 exponent, 23 fraction bits; 24-bit significand, about 7.2 digits |
| Machine epsilon | $\varepsilon_{64} = 2^{-52} \approx 2.22 \times 10^{-16}$, $\varepsilon_{32} = 2^{-23} \approx 1.19 \times 10^{-7}$ |
| Unit round-off | $u = \varepsilon/2$; $\mathrm{fl}(x) = x(1+\delta)$, $|\delta| \le u$ |
| ulp at $x \in [2^k, 2^{k+1})$ | $2^{k-52}$ (`float64`), $2^{k-23}$ (`float32`) |
| ECI position in `float32` | ulp $0.5\,\mathrm{m}$ at $7 \times 10^{6}\,\mathrm{m}$ — unusable |
| Cancellation factor | relative error grows by $(|a|+|b|)/|a-b|$ |
| Safe comparison | $|a-b| \le \text{atol} + \text{rtol}\max(|a|,|b|)$ |
| Accumulation | error of a naive sum grows like $n u$; use integer ticks, pairwise or Kahan summation |

The next lesson uses this arithmetic to solve nonlinear equations — Kepler's equation above all — where the stopping tolerance you can honestly ask for is set by exactly the round-off floor described here.
