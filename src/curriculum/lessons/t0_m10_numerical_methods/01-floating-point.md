---
id: l01-floating-point
title: Floating point in flight software
minutes: 22
covers:
  - floating-point representation, machine epsilon, catastrophic cancellation
---

Imagine a ruler with only a few marks on it. Any length you measure gets written down as the nearest mark. A computer stores numbers the same way. Every number it holds is a finite string of **[[bits|bits]]** — ones and zeros — so it can only hold certain values, and every answer it computes gets rounded to the nearest one it can hold.

Mostly that rounding is harmless. A double-precision number carries about sixteen decimal digits, and no sensor on a vehicle is good to sixteen digits. The trouble is a small set of operations that throw most of those digits away at once, and a small set of design choices that turn a harmless rounding into an error that grows for the whole mission: which precision to store a quantity in, how to add up time, how to compare two values.

A guidance, navigation and control (GNC) engineer meets this in three places. In **simulation**, where an orbit simulation run for a hundred thousand steps piles up rounding that can look like a physics error. In **flight software**, where storing a position in 32 bits instead of 64 decides whether the vehicle knows where it is to a nanometer or to half a meter. And in **estimation**, where a Kalman filter's matrices lose their meaning through a bad subtraction and the filter quietly stops working. This lesson turns the machine epsilon you met in the Python module into a model that predicts these failures before they happen.

## How a floating-point number is stored

You already know scientific notation: $6.02 \times 10^{23}$ is "six point oh two, times ten to the twenty-third". The digits $6.02$ carry the precision. The power of ten says where the decimal point goes — it lets the point "float". A **floating-point number** is the same thing in base 2. It has three parts:

- a **sign** — plus or minus, one bit;
- an **exponent** — the power of two, which says how big the number is;
- a **significand** — the string of significant bits, which carries the precision.

A standard called **[[IEEE 754|ieee-754]]** fixes the layout, so every modern computer rounds the same way:

| Format | Sign | Exponent | Fraction bits | Significand precision | Decimal digits |
| --- | --- | --- | --- | --- | --- |
| binary32 (`float32`, C `float`) | 1 | 8 | 23 | 24 bits | about 7.2 |
| binary64 (`float64`, C `double`, Python `float`) | 1 | 11 | 52 | 53 bits | about 15.9 |

The value stored is

$$
x = (-1)^s \times 1.f \times 2^{e - \text{bias}}.
$$

Here $s$ is the sign bit ($0$ for plus, $1$ for minus). The fraction $f$ is the stored bits, read as binary digits after the point. The exponent field $e$ is stored as a plain positive number, and a fixed **bias** — $127$ for `float32`, $1023$ for `float64` — is subtracted so that negative powers are possible too.

Notice the $1$ before the point. In decimal scientific notation the first digit can be anything from 1 to 9. In binary the only nonzero digit is 1, so every number (except zero) starts with "1.". There is no point storing a bit that is always 1, so it is left out. That **hidden bit** is why 52 stored fraction bits give 53 bits of precision. And 53 bits is worth $53 \log_{10} 2 \approx 15.95$ decimal digits.

Two exponent values are kept for special jobs. All ones means **infinity** (when the fraction is zero) or **NaN**, "not a number" (otherwise). All zeros means zero, or a **subnormal** number — a tiny value between zero and the smallest ordinary number, stored with fewer bits of precision. The ranges that result:

| | `float32` | `float64` |
| --- | --- | --- |
| Largest finite | about $3.40 \times 10^{38}$ | about $1.80 \times 10^{308}$ |
| Smallest ordinary (normalized) | about $1.18 \times 10^{-38}$ | about $2.23 \times 10^{-308}$ |
| Smallest subnormal | about $1.40 \times 10^{-45}$ | about $4.94 \times 10^{-324}$ |

Range is rarely the problem in GNC — nothing on a vehicle is near $10^{308}$. Precision is.

### Most decimals cannot be stored

One third in decimal is $0.3333\ldots$, repeating forever. You cannot write it exactly with any number of digits. Binary has the same problem with numbers that look innocent to us. One tenth in binary is $0.0001100110011\ldots$, repeating forever. So the value `float64` actually stores for `0.1` is

$$
0.1000000000000000055511151231257827\ldots
$$

and the `float32` value is $0.100000001490116\ldots$. Neither is 0.1. That one fact explains a famous family of clock bugs, which the first worked example takes apart.

## Machine epsilon and unit round-off

Because the significand has a fixed number of bits, the numbers a computer can hold are not evenly spaced. Picture the ruler again, but this ruler has the same number of marks between 1 and 2 as between 2 and 4, and between 4 and 8. So the marks get **[[twice as far apart|spacing-doubles]]** every time the numbers double.

Between $2^k$ and $2^{k+1}$ the spacing is $2^{k-52}$ in `float64` and $2^{k-23}$ in `float32`. That spacing is called the **ulp** — "unit in the last place" — of any number in that range.

**Machine epsilon**, written $\varepsilon$ (the Greek letter epsilon), is the ulp just above 1: the gap between 1 and the next number the computer can hold.

$$
\varepsilon_{64} = 2^{-52} \approx 2.22 \times 10^{-16}, \qquad
\varepsilon_{32} = 2^{-23} \approx 1.19 \times 10^{-7}.
$$

You can find it in a few lines of Python. Keep halving a candidate until adding it to 1 no longer changes 1:

```python
eps = 1.0
while 1.0 + eps / 2 > 1.0:
    eps /= 2
print(eps)   # 2.220446049250313e-16
```

### The rounding model

The computer rounds to the nearest mark. The nearest mark is never more than half a gap away, so the error of storing a number is at most half an ulp. Relative to the number itself, that is at most $\varepsilon/2$. This quantity has its own name, the **unit round-off**:

$$
u = \varepsilon/2 = 2^{-53} \approx 1.11 \times 10^{-16} \quad (\texttt{float64}).
$$

It gives the model that all error analysis rests on. Write $\mathrm{fl}(x)$ — read "float of $x$" — for the stored version of a real number $x$. Then

$$
\mathrm{fl}(x) = x\,(1 + \delta), \qquad |\delta| \le u .
$$

Here $\delta$ (small delta) is the relative error, and all we know is that it is no bigger than $u$. The same holds for each of the four basic operations on two stored numbers $a$ and $b$. Write $\circ$ for any one of $+$, $-$, $\times$, $\div$:

$$
\mathrm{fl}(a \circ b) = (a \circ b)(1 + \delta), \qquad |\delta| \le u.
$$

In words: the computer behaves as if it found the exact answer and then rounded it once. That is what **correctly rounded** means.

The error is *relative*, not absolute. Big numbers carry big absolute errors. The ulp of $10^{16}$ in `float64` is 2. So `1e16 + 1 - 1e16` evaluates to `0.0`: the sum $10^{16} + 1$ rounds back to $10^{16}$ before the subtraction ever happens.

::: key
Machine epsilon is the spacing of representable numbers just above 1: $\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16}$ for `float64` and $2^{-23} \approx 1.19 \times 10^{-7}$ for `float32`. Every stored number and every arithmetic result carries a relative error of at most $u = \varepsilon/2$: $\mathrm{fl}(x) = x(1+\delta)$ with $|\delta| \le u$. The error is relative, so the absolute error scales with the size of the number.
:::

## Spacing in practice: positions and clocks

One part in $10^{16}$ sounds like more than enough for anything. Turn it into an actual gap at the sizes GNC works with and the picture changes.

**Positions.** A position measured from Earth's center in an **[[Earth-centered inertial|eci-j2000]]** (ECI) frame is about $7 \times 10^{6}\,\mathrm{m}$ long for a low orbit. That lies between $2^{22} = 4{,}194{,}304$ and $2^{23} = 8{,}388{,}608$, so $k = 22$. The ulp is:

- `float64`: $2^{22-52} \approx 9.3 \times 10^{-10}\,\mathrm{m}$ — about a nanometer. Fine.
- `float32`: $2^{22-23} = 0.5\,\mathrm{m}$ — half a meter.

A `float32` ECI position cannot record a motion smaller than half a meter. A docking filter that subtracts two `float32` positions a meter apart gets an answer rounded to the nearest half meter. That is not a small loss of precision. It is a different vehicle.

**Clocks.** Time is often kept as seconds since the J2000 epoch, noon on January 1, 2000. That count is now about $8.4 \times 10^{8}\,\mathrm{s}$, between $2^{29}$ and $2^{30}$. The `float64` ulp there is $2^{29-52} = 2^{-23} \approx 1.2 \times 10^{-7}\,\mathrm{s}$. A tenth of a microsecond is fine for propagating an orbit. It is useless for GPS, where one nanosecond of timing is $30\,\mathrm{cm}$ of range. So precision timing code keeps an integer count of whole seconds plus a separate floating-point fraction. The fraction always stays near zero, where the marks are close together.

::: example A mission clock kept in float32
A flight computer adds 0.1 s to its mission elapsed time every frame, ten frames a second. Someone declares that running total as a 32-bit float. Two things go wrong.

**The tick itself is wrong.** The increment is stored as $0.1000000014901\ldots$, high by $1.49 \times 10^{-9}\,\mathrm{s}$. A day has $864{,}000$ ticks, so that alone adds $864{,}000 \times 1.49 \times 10^{-9} \approx 1.3\,\mathrm{ms}$. Annoying, not fatal.

**The running total is worse.** Each new total $t + 0.1$ must round to a mark near $t$, and those marks spread apart as $t$ grows. Once $t$ passes $65{,}536\,\mathrm{s} = 2^{16}$, the ulp is $2^{16-23} = 0.0078125\,\mathrm{s}$. The step $0.1$ is $0.1 / 0.0078125 = 12.8$ ulps, which rounds to 13 ulps, or $13 \times 0.0078125 = 0.1015625\,\mathrm{s}$. (The same thing already happens from $2^{15} = 32{,}768\,\mathrm{s}$, where $25.6$ ulps of $2^{-8}$ round up to 26.) So every tick moves the clock about $1.56\%$ too far.

Running the loop in Python with rounding to `float32` after every addition (`numpy.float32`), the clock reads $3601.16\,\mathrm{s}$ after one hour — already $1.16\,\mathrm{s}$ fast — and $87{,}145.8\,\mathrm{s}$ after one day, fast by $745.8\,\mathrm{s}$. That is more than **[[twelve minutes|clock-drift-plot]]** in a day. The same loop in `float64` is off by only $5.4 \times 10^{-7}\,\mathrm{s}$ after a day.

**The fix** is not "switch to `float64`". It is to count ticks in an integer and multiply by the period only when you need seconds: $864{,}000 \times 0.1 = 86{,}400.0$ exactly. The multiplication rounds once instead of $864{,}000$ times. This is the lesson of the **[[Patriot missile clock|patriot]]**, a real failure of exactly this kind.
:::

::: warning Where float32 does not belong
Never store an absolute position, an absolute time or a running total in `float32`. Single precision is acceptable for quantities that live near zero — a relative position, a body rate, an error signal — and for data buses where bandwidth matters. Keep one number in your head: the ulp at the size in question. It is $0.5\,\mathrm{m}$ at $7 \times 10^{6}\,\mathrm{m}$ and $0.0078\,\mathrm{s}$ at one day.
:::

## Catastrophic cancellation

Weigh a truck with its driver, then weigh it without, and subtract to find the driver's weight. If the scale is good to 10 kg, each weighing is fine — 10 kg in 20,000 kg is tiny. But the driver weighs about 80 kg, and the difference could be off by 20 kg. The subtraction did nothing wrong. It removed the big part the two weighings agreed on and left the small errors standing out.

Computers do the same thing. The rounding model promises every subtraction a relative error of at most $u$ — but only relative to the *result*, and only for the rounding it does itself. The inputs arrive already carrying their own rounding errors, relative to *themselves*.

Say $a$ and $b$ are computed values with small relative errors $\delta_a$ and $\delta_b$. What is stored is $a(1+\delta_a)$ and $b(1+\delta_b)$. Their difference is

$$
a(1+\delta_a) - b(1+\delta_b) = (a - b) + a\,\delta_a - b\,\delta_b .
$$

The first part is the answer you wanted. The rest is error. Divide it by the true answer and use $|\delta_a|, |\delta_b| \le u$:

$$
\frac{|a\,\delta_a - b\,\delta_b|}{|a - b|} \le \frac{|a| + |b|}{|a - b|}\,u .
$$

When $a$ and $b$ are close, the factor $(|a|+|b|)/|a-b|$ is enormous — just like $20{,}000 / 80$ for the truck. The subtraction itself is exact. In fact, when $a$ and $b$ are within a factor of two of each other, $a - b$ is computed with no rounding at all. What the subtraction does is *expose* the errors already in $a$ and $b$, by removing the leading digits they **[[agreed on|cancellation-digits]]**. This is **catastrophic cancellation**: the leading digits cancel, and what remains is mostly old rounding error.

### A clean case: one minus cosine

Take $1 - \cos x$ for a small angle $x$. At $x = 10^{-4}$ the true value is $x^2/2 - x^4/24 \approx 4.9999999958 \times 10^{-9}$. Python's `1 - math.cos(1e-4)` returns $4.999999969612645 \times 10^{-9}$. Only the first eight of sixteen digits are right. The reason: $\cos x$ was stored with an absolute error near $10^{-16}$, and then $0.99999999\ldots$ was subtracted from 1, leaving that same error sitting on a result near $10^{-8}$.

At $x = 10^{-8}$ it gets worse: the answer is exactly `0.0`, because $\cos(10^{-8})$ rounds to exactly 1.

The cure is a formula that means the same thing but does no subtracting. The half-angle identity from trigonometry gives $1 - \cos x = 2\sin^2(x/2)$. At $x = 10^{-8}$ it returns $5.000000000 \times 10^{-17}$, correct to all digits.

::: example The small root of a quadratic
Solve $x^2 - 10^{8}x + 1 = 0$. The roots are about $x_1 \approx 10^{8}$ and $x_2 \approx 10^{-8}$. (Their product must be $c/a = 1$, which checks.) The quadratic formula for the small one reads

$$
x_2 = \frac{-b - \sqrt{b^2 - 4ac}}{2a} = \frac{10^{8} - \sqrt{10^{16} - 4}}{2}.
$$

**Step 1: the square root.** Its true value is $99{,}999{,}999.99999998$. In `float64` it rounds to a neighbor of $10^{8}$.

**Step 2: the subtraction.** Now $10^{8}$ minus a number that agrees with it to sixteen digits leaves only rounding noise. Python gives $x_2 = 7.45 \times 10^{-9}$ — wrong by 25%.

**Step 3: use the root that has no cancellation.** The large root is $x_1 = (10^{8} + \sqrt{\ldots})/2 = 10^{8}$. That is an addition, and it is fine. Now use the product of the roots, $x_1 x_2 = c/a$:

$$
x_2 = \frac{c}{a\,x_1} = \frac{1}{10^{8}} = 1.0 \times 10^{-8},
$$

correct to machine precision. **Check:** $10^{8} \times 10^{-8} = 1$, as the product must be.

The rule works for any quadratic. Compute the root whose sign avoids cancellation from the formula. Get the other from the product of the roots.
:::

### The same trap in statistics

The **variance** of a set of numbers measures how spread out they are. One formula for it is "the average of the squares, minus the square of the average", $\mathrm{E}[x^2] - (\mathrm{E}[x])^2$. When the data has a large average, that subtracts two nearly equal huge numbers. For the three values $10^{8}+1$, $10^{8}+2$, $10^{8}+3$ it returns exactly `0.0` in `float64`. The **two-pass** formula first finds the average $\bar{x}$ ("x bar"), then averages the squared distances from it, $\frac{1}{n}\sum (x_i - \bar{x})^2$. It returns the correct $0.6667$.

Kalman filter covariance updates of the form $P - KHP$ have exactly this shape. That is why the **Joseph form** and **square-root filters** exist; you will meet them in the estimation modules.

::: key
Catastrophic cancellation: subtracting two nearly equal numbers $a$ and $b$ amplifies their existing relative errors by the factor $(|a| + |b|)/|a - b|$. The subtraction is exact; it exposes the rounding already in the operands. Cures are algebraic rearrangement ($1 - \cos x = 2\sin^2(x/2)$, $x_2 = c/(a x_1)$), Taylor series for small arguments, or a two-pass formulation.
:::

## Adding up many numbers

Pour a teaspoon of water into a bathtub, and then try to read the change on a bathtub gauge. The gauge cannot show it. Adding a small number to a large running total has the same problem — the mission-clock problem in general form. Each addition rounds relative to the size of the *total*, so the small number loses its last few bits every time.

Summing 0.1 ten times in Python gives `0.9999999999999999`. Summing it a million times in a loop gives $100{,}000.00000133$, off by $1.3 \times 10^{-6}$. That sits comfortably inside the worst-case bound, which is about $n u$ times the total: $10^{6} \times 1.1 \times 10^{-16} \times 10^{5} \approx 1.1 \times 10^{-5}$.

Three fixes, from least to most effort:

1. **Sum in a wider precision** than you store.
2. **Sum pairwise.** Add neighbors, then add those sums, and so on, like a tournament bracket. The error growth drops from about $n u$ to about $u \log_2 n$.
3. **Compensated summation**, invented by **[[William Kahan|kahan]]**. Keep track of the rounding error of each addition and feed it back into the next one:

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

The line `c = (t - s) - y` looks as if it must equal zero, since $t = s + y$. In floating point it does not, and that difference is the whole point. Offline, Python's `math.fsum` computes an exactly rounded sum and is the right tool.

## Comparing floating-point numbers

In `float64`, `0.1 + 0.2 == 0.3` is `False`, because the left side is $0.30000000000000004$. So testing computed values with `==` is a bug. A comparison needs a tolerance with two parts:

$$
|a - b| \le \text{atol} + \text{rtol}\,\max(|a|, |b|).
$$

Here **atol** is an absolute tolerance and **rtol** a relative one. The relative part handles big numbers, where the marks are far apart. The absolute part handles numbers near zero, where a relative tolerance alone would demand impossible exactness. You will see this same two-part form in adaptive integrators, where it sets how much error each step may make. Asking for an `rtol` below about $10^{-15}$ in `float64` asks for something the arithmetic cannot deliver.

## Infinities and NaN

**Overflow** — a result too big to store — gives $\pm\infty$. The operations $0/0$, $\infty - \infty$ and $\sqrt{-1}$ give NaN. NaN is **sticky**: any operation with a NaN input gives NaN. And every comparison with NaN is false, even `x == x`.

In a control loop, that means one bad divide — the length of a zero vector, a zero-length quaternion — poisons the whole state within one frame. Meanwhile every `if` guarding the code quietly takes the false branch. Flight software checks `isfinite` on inputs at frame boundaries, and clamps or substitutes a safe value rather than let a NaN spread. In Python the test is `math.isfinite(x)`, and `x != x` is the classic way to spot a NaN. Range errors are rare but can be total: see **[[Ariane 5's first flight|ariane-501]]**.

::: warning float32 runs out sooner than you think
`float32` has only 24 bits of significand, so quantities that look modest are already near the edge. The `float32` ulp of one day in seconds is 7.8 ms. Earth's gravitational parameter, $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, has a `float32` ulp of $3.4 \times 10^{7}$ — a relative error of $8 \times 10^{-8}$ that shows up directly as an error in the orbital period. Use `float64` for all physics. Keep `float32` for storing small, bounded signals.
:::

## Check yourself

::: check
A velocity of about $7{,}700\,\mathrm{m/s}$ is stored in `float32`. What is the spacing of representable values there, and is it good enough for a navigation filter working to $1\,\mathrm{mm/s}$?
:::

::: answer
$7{,}700$ lies between $2^{12} = 4{,}096$ and $2^{13} = 8{,}192$, so $k = 12$. The `float32` ulp is $2^{12-23} = 2^{-11} \approx 4.9 \times 10^{-4}\,\mathrm{m/s}$. Rounding to nearest makes an error of at most half that, about $0.24\,\mathrm{mm/s}$. That is inside a 1 mm/s requirement, but with only a factor of four to spare — and the *difference* of two such velocities is rounded to steps of $0.49\,\mathrm{mm/s}$. In `float64` the ulp is $2^{12-52} \approx 9.1 \times 10^{-13}\,\mathrm{m/s}$. Store the state in `float64`.
:::

::: check
Use the rounding model to explain why `1e16 + 1 - 1e16` gives `0.0` while `1e16 - 1e16 + 1` gives `1.0`.
:::

::: answer
The computer works left to right. In the first expression, $10^{16} + 1$ comes first. $10^{16}$ lies between $2^{53}$ and $2^{54}$, so its ulp is $2^{53-52} = 2$. That puts $10^{16} + 1$ exactly halfway between two marks. The tie rule ("round half to even") sends it back to $10^{16}$. Subtracting $10^{16}$ then gives 0.

In the second expression, $10^{16} - 10^{16} = 0$ is exact, and $0 + 1 = 1$ is exact. So the order of additions changes the answer: floating-point addition is not **associative**.
:::

::: check
You need $\sqrt{x^2 + 1} - 1$ for $x$ around $10^{-6}$. Estimate how many digits the direct formula loses, and give a formula that loses none.
:::

::: answer
At $x = 10^{-6}$, $\sqrt{x^2+1} \approx 1 + 5 \times 10^{-13}$. The square root is stored with an absolute error up to about $u = 1.1 \times 10^{-16}$. Subtracting 1 leaves $5 \times 10^{-13}$ still carrying that error: a relative error up to about $2 \times 10^{-4}$. (Python's actual result is off by $9 \times 10^{-5}$.) So about twelve of the sixteen digits are lost.

Multiply top and bottom by the "conjugate" $\sqrt{x^2+1} + 1$:

$$
\sqrt{x^2+1} - 1 = \frac{x^2}{\sqrt{x^2+1} + 1}.
$$

Now there is an addition on the bottom and no subtraction anywhere. It returns $5.0 \times 10^{-13}$, correct to machine precision.
:::

::: check
A simulation logs the orbital energy $\varepsilon = v^2/2 - \mu/r$ for a circular orbit with $r = 6{,}878\,\mathrm{km}$, $\mu = 398{,}600.4\,\mathrm{km^3/s^2}$, so $v^2/2 \approx 28.98$ and $\mu/r \approx 57.95\,\mathrm{km^2/s^2}$. Roughly what is the smallest change in $\varepsilon$ the `float64` computation can resolve, and why does this matter for an energy-drift check? (This $\varepsilon$ is energy, not machine epsilon — the letters collide.)
:::

::: answer
Both terms are between 16 and 64, so their ulp is at most $2^{5-52} \approx 7 \times 10^{-15}$. Each carries rounding of a few times $10^{-15}$. The subtraction has $|a| + |b| \approx 87$ against $|a - b| \approx 29$, so it amplifies relative error by about 3. So relative changes in $\varepsilon$ smaller than about $10^{-14}$ are noise.

That sets the floor for an energy check. A propagator whose relative energy wobbles by $10^{-15}$ is at the arithmetic floor and cannot be judged further. One showing $10^{-8}$ is showing a real integration error.
:::

::: check
Why does Kahan summation's line `c = (t - s) - y` not come out as zero, and what would happen if a compiler "optimized" it to zero?
:::

::: answer
On paper $t = s + y$, so $(t - s) - y = 0$. In floating point, $t$ is the *rounded* sum. Then $t - s$ recovers the part of $y$ that actually made it into the total — exactly, because $t$ and $s$ are close (this fact is called Sterbenz's lemma). Subtracting $y$ leaves the part that was rounded away. That remainder is the compensation.

A compiler that applies real-number algebra — as with **[[aggressive fast-math flags|fast-math]]** — would delete the compensation and quietly turn the routine back into a plain sum. That is why flight code forbids those flags.
:::

## Summary

| Item | Statement |
| --- | --- |
| `float64` layout | 1 sign, 11 exponent, 52 fraction bits; 53-bit significand, about 15.9 digits |
| `float32` layout | 1 sign, 8 exponent, 23 fraction bits; 24-bit significand, about 7.2 digits |
| Machine epsilon | $\varepsilon_{64} = 2^{-52} \approx 2.22 \times 10^{-16}$, $\varepsilon_{32} = 2^{-23} \approx 1.19 \times 10^{-7}$ |
| Unit round-off | $u = \varepsilon/2$; $\mathrm{fl}(x) = x(1+\delta)$, $\lvert\delta\rvert \le u$ |
| ulp at $x \in [2^k, 2^{k+1})$ | $2^{k-52}$ (`float64`), $2^{k-23}$ (`float32`) |
| ECI position in `float32` | ulp $0.5\,\mathrm{m}$ at $7 \times 10^{6}\,\mathrm{m}$ — unusable |
| Cancellation factor | relative error grows by $(\lvert a\rvert+\lvert b\rvert)/\lvert a-b\rvert$ |
| Safe comparison | $\lvert a-b\rvert \le \text{atol} + \text{rtol}\max(\lvert a\rvert,\lvert b\rvert)$ |
| Accumulation | a naive sum's error can grow like $n u$; use integer ticks, pairwise or Kahan summation |

The next lesson uses this arithmetic to solve equations that algebra cannot — Kepler's equation above all. There, the stopping tolerance you can honestly ask for is set by exactly the round-off floor described here.

::: context bits Counting with only two digits
A **bit** is one binary digit: 0 or 1. It is the smallest thing a computer stores — a switch that is off or on. Counting in binary works like counting in decimal, except you run out of digits after 1: $0, 1, 10, 11, 100, 101, \ldots$ Each place is worth twice the one to its right — ones, twos, fours, eights — just as decimal places are ones, tens, hundreds. So $1011$ in binary is $8 + 0 + 2 + 1 = 11$. Binary fractions work the same way after the point: halves, quarters, eighths.
:::

::: context ieee-754 One standard for every machine
Before 1985, every computer maker rounded in its own way. The same program could print different answers on two machines, and error analysis had to be redone for each. The IEEE 754 standard, driven largely by the mathematician William Kahan, fixed the formats, the rounding rule and the special values (infinity, NaN) for everyone. Kahan received the Turing Award in 1989 largely for this work. Today almost every processor you will program — laptop, phone or flight computer — follows it, which is why the numbers in this lesson are the same everywhere.
:::

::: context spacing-doubles Why the marks spread out
Here is a toy format with only two fraction bits, so there are four marks between each power of two and the next. Between 1 and 2 the marks are 0.25 apart. Between 2 and 4 they are 0.5 apart. Between 4 and 8 they are 1 apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="20" y1="40" x2="20" y2="60"/><line x1="31.4" y1="42" x2="31.4" y2="58"/><line x1="42.9" y1="42" x2="42.9" y2="58"/><line x1="54.3" y1="42" x2="54.3" y2="58"/>
    <line x1="65.7" y1="40" x2="65.7" y2="60"/><line x1="88.6" y1="42" x2="88.6" y2="58"/><line x1="111.4" y1="42" x2="111.4" y2="58"/><line x1="134.3" y1="42" x2="134.3" y2="58"/>
    <line x1="157.1" y1="40" x2="157.1" y2="60"/><line x1="202.9" y1="42" x2="202.9" y2="58"/><line x1="248.6" y1="42" x2="248.6" y2="58"/><line x1="294.3" y1="42" x2="294.3" y2="58"/>
    <line x1="340" y1="40" x2="340" y2="60"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="76">1</text><text x="65.7" y="76">2</text><text x="157.1" y="76">4</text><text x="340" y="76">8</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="42.9" y="28">gap 0.25</text><text x="111.4" y="28">gap 0.5</text><text x="248.6" y="28">gap 1</text>
  </g>
  <text x="180" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">same number of marks in each doubling</text>
</svg>
```

Real `float64` has $2^{52}$ marks in each doubling instead of four, but the pattern is the same: the gap is always the same *fraction* of the number.
:::

::: context eci-j2000 A frame that does not spin
An **Earth-centered inertial** frame puts its origin at Earth's center and points its axes at fixed directions among the stars, so the frame does not turn with the Earth. Orbits are simplest to write in it. The **J2000 epoch** is a reference instant — noon on January 1, 2000 — that such frames and many spacecraft clocks count from. Because positions and times are measured from these fixed origins, they are big numbers, and big numbers have big gaps between their floating-point marks.
:::

::: context clock-drift-plot The float32 clock over one day
The clock's error, computed by running the loop with `float32` rounding. Each time the total crosses a power of two the marks spread apart, the rounding of each tick changes, and the error changes slope. From about 2.3 to 9.1 hours each tick rounds *down* (to $0.0996\,\mathrm{s}$), so the clock falls behind. After 9.1 hours each tick rounds *up* to $0.1016\,\mathrm{s}$ and the clock races ahead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="162.2" x2="340" y2="162.2" stroke="#1f2a44" stroke-width="1.2"/>
  <g stroke="#e3e7ee" stroke-width="1"><line x1="50" y1="126.7" x2="340" y2="126.7"/><line x1="50" y1="91.1" x2="340" y2="91.1"/><line x1="50" y1="55.6" x2="340" y2="55.6"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="45" y="166">0</text><text x="45" y="130">200</text><text x="45" y="95">400</text><text x="45" y="59">600</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="122.5" y="198">6 h</text><text x="195" y="198">12 h</text><text x="267.5" y="198">18 h</text><text x="340" y="198">24 h</text></g>
  <line x1="160" y1="30" x2="160" y2="180" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="164" y="40" font-size="11" fill="#6c7a93">2¹⁵ s</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,162.2 53.0,162.2 56.0,162.3 59.1,162.2 62.1,162.0 65.1,161.9 68.1,161.7 71.1,161.5 74.2,161.4 77.2,161.2 80.2,161.8 83.2,162.4 86.2,163.0 89.3,163.7 92.3,164.3 95.3,164.9 98.3,165.5 101.4,166.2 104.4,166.8 107.4,167.4 110.4,168.0 113.4,168.7 116.5,169.3 119.5,169.9 122.5,170.5 125.5,171.2 128.5,171.8 131.6,172.4 134.6,173.0 137.6,173.7 140.6,174.3 143.6,174.9 146.7,175.5 149.7,176.2 152.7,176.8 155.7,177.4 158.8,178.0 161.8,177.1 164.8,174.6 167.8,172.1 170.8,169.6 173.9,167.1 176.9,164.6 179.9,162.1 182.9,159.6 185.9,157.1 189.0,154.6 192.0,152.1 195.0,149.6 198.0,147.1 201.0,144.6 204.1,142.1 207.1,139.6 210.1,137.1 213.1,134.6 216.1,132.1 219.2,129.6 222.2,127.1 225.2,124.6 228.2,122.1 231.2,119.6 234.3,117.1 237.3,114.6 240.3,112.1 243.3,109.6 246.4,107.1 249.4,104.6 252.4,102.1 255.4,99.6 258.4,97.1 261.5,94.6 264.5,92.1 267.5,89.6 270.5,87.1 273.5,84.6 276.6,82.1 279.6,79.6 282.6,77.1 285.6,74.6 288.6,72.1 291.7,69.6 294.7,67.1 297.7,64.6 300.7,62.1 303.8,59.6 306.8,57.1 309.8,54.6 312.8,52.1 315.8,49.6 318.9,47.1 321.9,44.6 324.9,42.1 327.9,39.6 330.9,37.1 334.0,34.6 337.0,32.1 340.0,29.6"/>
  <text x="332" y="24" font-size="11" fill="#b4232c" text-anchor="end">+746 s</text>
  <text x="56" y="30" font-size="11" fill="#1f2a44">clock error (s)</text>
</svg>
```
:::

::: context patriot The Patriot clock
In February 1991 a Patriot air-defense battery in Dhahran, Saudi Arabia, failed to stop an incoming Scud missile. Its computer counted time in tenths of a second and stored one tenth as a 24-bit fixed-point binary fraction, which chopped off the repeating tail of $0.000110011\ldots$. After about 100 hours of running, the accumulated error was about a third of a second. At the Scud's speed of about $1.7\,\mathrm{km/s}$ the radar looked for the target more than half a kilometer from where it really was. The software raised no error. The arithmetic did exactly what it was told.
:::

::: context cancellation-digits What is left after the cancel
Picture two sixteen-digit numbers that agree in their first eight digits. The last digit or two of each is already rounding noise (red). Subtract them, and the eight shared digits vanish. The answer has only eight real digits left — and the noise is now a much bigger share of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44"><text x="8" y="31">a</text><text x="8" y="61">b</text><text x="8" y="121">a − b</text></g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="44" y="18" width="136" height="18" fill="#e3e7ee"/><rect x="180" y="18" width="102" height="18" fill="#8fb8f0"/><rect x="282" y="18" width="34" height="18" fill="#b4232c"/>
    <rect x="44" y="48" width="136" height="18" fill="#e3e7ee"/><rect x="180" y="48" width="102" height="18" fill="#8fb8f0"/><rect x="282" y="48" width="34" height="18" fill="#b4232c"/>
    <rect x="180" y="108" width="102" height="18" fill="#8fb8f0"/><rect x="282" y="108" width="34" height="18" fill="#b4232c"/>
  </g>
  <g stroke="#1f2a44" stroke-width="0.6"><line x1="61" y1="18" x2="61" y2="36"/><line x1="78" y1="18" x2="78" y2="36"/><line x1="95" y1="18" x2="95" y2="36"/><line x1="112" y1="18" x2="112" y2="36"/><line x1="129" y1="18" x2="129" y2="36"/><line x1="146" y1="18" x2="146" y2="36"/><line x1="163" y1="18" x2="163" y2="36"/><line x1="180" y1="18" x2="180" y2="36"/><line x1="197" y1="18" x2="197" y2="36"/><line x1="214" y1="18" x2="214" y2="36"/><line x1="231" y1="18" x2="231" y2="36"/><line x1="248" y1="18" x2="248" y2="36"/><line x1="265" y1="18" x2="265" y2="36"/><line x1="282" y1="18" x2="282" y2="36"/><line x1="299" y1="18" x2="299" y2="36"/><line x1="61" y1="48" x2="61" y2="66"/><line x1="78" y1="48" x2="78" y2="66"/><line x1="95" y1="48" x2="95" y2="66"/><line x1="112" y1="48" x2="112" y2="66"/><line x1="129" y1="48" x2="129" y2="66"/><line x1="146" y1="48" x2="146" y2="66"/><line x1="163" y1="48" x2="163" y2="66"/><line x1="180" y1="48" x2="180" y2="66"/><line x1="197" y1="48" x2="197" y2="66"/><line x1="214" y1="48" x2="214" y2="66"/><line x1="231" y1="48" x2="231" y2="66"/><line x1="248" y1="48" x2="248" y2="66"/><line x1="265" y1="48" x2="265" y2="66"/><line x1="282" y1="48" x2="282" y2="66"/><line x1="299" y1="48" x2="299" y2="66"/><line x1="197" y1="108" x2="197" y2="126"/><line x1="214" y1="108" x2="214" y2="126"/><line x1="231" y1="108" x2="231" y2="126"/><line x1="248" y1="108" x2="248" y2="126"/><line x1="265" y1="108" x2="265" y2="126"/><line x1="282" y1="108" x2="282" y2="126"/><line x1="299" y1="108" x2="299" y2="126"/></g>
  <line x1="44" y1="84" x2="316" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="112" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">8 digits cancel</text>
  <text x="249" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">8 digits left, 2 of them noise</text>
</svg>
```

Before, the noise was 2 digits out of 16. After, it is 2 digits out of 8. Nothing new went wrong — the old error just became visible.
:::

::: context kahan The same Kahan
William Kahan, a mathematician who spent most of his career at the University of California, Berkeley, published compensated summation in 1965 — twenty years before he led the work on the IEEE 754 standard. Much of what engineers now know about writing arithmetic that fails gracefully traces back to him. His idea here is simple to state: the rounding error of an addition can itself be computed exactly, so carry it forward instead of throwing it away.
:::

::: context ariane-501 A number too big for its box
On June 4, 1996, the first Ariane 5 rocket broke up about 40 seconds after launch. Its inertial reference software converted a 64-bit floating-point value, a horizontal velocity term, into a 16-bit signed integer, which can hold nothing above 32,767. Ariane 5 flew faster sideways than the Ariane 4 the code was written for, so the value no longer fit. The conversion raised an error and both reference computers shut down. The flight computer read their error messages as flight data, swung the engine nozzles hard over, and the rocket broke apart. The lesson: know the range of every number your code stores, and what happens when it is exceeded.
:::

::: context fast-math When the compiler does algebra
Compilers for C and C++ offer options (such as `-ffast-math` in GCC and Clang) that let them treat floating-point numbers as if they were real numbers: reorder additions, cancel $(t - s) - y$ to zero, assume no NaN ever appears. The code runs a bit faster, and its answers change in ways nobody reviewed. Flight software standards ban such options, so that the arithmetic that was tested is the arithmetic that flies.
:::
