---
id: l09-fixed-point-and-determinism
title: Fixed-point arithmetic and bit-exact determinism
minutes: 22
covers:
  - Fixed-point arithmetic where floating point is unavailable or unqualified
  - Determinism and bit-exact reproducibility across compilers and platforms
---

A store does not keep its prices in dollars with a decimal point. Its computer stores $12.34 as the whole number 1234 — a count of **cents**. Adding prices is adding whole numbers. Nothing is ever rounded in a strange way, and every cash register in every store gets exactly the same total for the same basket. A carpenter does the same with a tape measure: 1.5 cm is written as 15 mm, and the decimal point disappears.

That trick has a name in computing: **fixed-point arithmetic**. You store a fraction as a whole number, and you agree in advance where the decimal point (really, the binary point) sits. Small flight processors that have no hardware for fractions use it every day, and so do digital signal processors and FPGAs.

The second half of this lesson is about a property that fixed-point gives you for free and floating point makes you work for: **determinism**. A deterministic program, given the same inputs, produces exactly the same output, bit for bit, every time — on your laptop, on the test rig, and on the flight computer. The radiation defenses of the last lesson, where two cores compare answers and three computers vote, only work if correct computers agree exactly. You will see how a single compiler flag can quietly break that.

## Why not use floating point everywhere?

On your laptop, a `double` is fast and easy. Not every flight processor is a laptop.

- **No hardware at all.** Many small microcontrollers have no **[[floating-point unit|fpu]]**. The compiler then does every `float` operation in software, with dozens of integer instructions per multiply. A motor controller running a current loop at 20 kHz may not have the time.
- **Hardware you cannot use.** A flight processor may have a floating-point unit, but the project may not be allowed to rely on it. For software that must be certified, every piece of hardware the code depends on needs evidence that it behaves as documented. If that evidence does not exist for the floating-point unit, it is **[[unqualified|qualified]]**, and the software must not use it.
- **Hardware you build yourself.** Logic designed for an FPGA does arithmetic with the circuits you put there. Integer adders and multipliers are small; full floating-point units are large.

In all three cases the answer is fixed point: fractions carried by integer hardware that every processor has.

## The Q format: where the binary point sits

In the store, the agreement is "divide by 100". In a computer it is "divide by a power of 2", because dividing by $2^n$ is a shift. The format is written **Q*m*.*n***: *m* bits for the whole-number part (after the sign) and *n* bits for the fraction. The value of a stored integer $r$ (the **raw** value) is

$$
x = \frac{r}{2^n}.
$$

Read $2^n$ as "two to the n". Two formats cover most flight code:

- **Q15** (also written Q0.15, or Q1.15 if you count the sign bit). A 16-bit signed integer, with 15 fraction bits. Value $= r / 2^{15} = r / 32768$. It holds numbers from $-1$ up to $1 - 2^{-15} \approx 0.99997$, in steps of $2^{-15} \approx 3.05 \times 10^{-5}$. It is ideal for signals already scaled to $\pm 1$, such as a normalized sensor reading or a filter coefficient.
- **Q16.16**. A 32-bit signed integer: 16 bits for the whole part, 16 for the fraction. Value $= r / 65536$. It holds $-32768$ up to about $32767.99998$, in steps of $2^{-16} \approx 1.53 \times 10^{-5}$. It suits values like angles in degrees or speeds in meters per second.

Look at how the **[[bits are laid out|q-layout]]**: the integer is ordinary two's complement. Only the meaning you attach to it changes.

::: key
Fixed point stores $x$ as an integer $r = \mathrm{round}(x \cdot 2^n)$. Q15: 16-bit, $x = r/2^{15}$, range $[-1, 1)$. Q16.16: 32-bit, $x = r/2^{16}$, range $[-32768, 32768)$, resolution $2^{-16}$.
:::

### The four operations

**Converting in.** Multiply by $2^n$ and round. For Q15, $0.5 \to 0.5 \times 32768 = 16384$ and $0.25 \to 8192$.

**Adding.** If both numbers are in the same format, add the raw integers. $16384 + 8192 = 24576$, and $24576 / 32768 = 0.75$. Correct. Numbers in *different* formats must first be shifted to the same one, the same way you cannot add cents to dollars without converting.

**Multiplying.** Multiplying two raw values multiplies the scale factors too. $r_a / 2^n$ times $r_b / 2^n$ is $r_a r_b / 2^{2n}$: the product has twice as many fraction bits. So you multiply in a *wider* integer, then shift right by $n$ to get back to the original format.

**Saturating.** When a result is too large for the format, clamp it to the largest (or smallest) value instead of letting it wrap around.

::: example Q15 by hand: a multiply and an overflow
**Multiply 0.5 by 0.25.** The raw values are 16384 and 8192.

1. Multiply the raw values in 32 bits: $16384 \times 8192 = 134217728$. This is in Q30 — thirty fraction bits.
2. Shift right by 15 to return to Q15: $134217728 / 2^{15} = 4096$.
3. Read it back: $4096 / 32768 = 0.125$.

And $0.5 \times 0.25 = 0.125$. Correct.

**Add 0.75 and 0.5.** The raw values are 24576 and 16384. The sum is $24576 + 16384 = 40960$. But a 16-bit signed integer only reaches 32767. Stored back into 16 bits, 40960 **[[wraps around|wraparound]]** to $40960 - 65536 = -24576$, which reads as $-24576 / 32768 = -0.75$.

**Sanity check.** Adding two positive numbers gave a negative one. The true answer, 1.25, is out of range for Q15, so no answer can be exactly right — but $-0.75$ is about as wrong as possible: the sign flipped. A saturating add returns 32767 instead, which reads as $0.99997$, the closest value Q15 can hold. For a control loop, "full positive command" is a safe failure; "full negative command" can be a disaster.
:::

::: warning Choose the format from the physics
The designer must know the largest value each variable can ever take, and pick $n$ so it fits with room to spare. A rate that can reach 40 rad/s does not fit in Q15. Too few whole-number bits and values saturate; too few fraction bits and small values vanish into rounding. Writing the range and format of every fixed-point variable into its comment, or its type name, is standard practice. The **[[Ariane 5|ariane]]** loss is the famous reminder of what happens when a value outgrows the integer it is squeezed into.
:::

### A Q16.16 type in C++

Here is a small Q16.16 library with saturation and rounding, and a first-order low-pass filter, $y \leftarrow y + \alpha (x - y)$, run both in Q16.16 and in `double`. (Read $\alpha$ as "alpha", the filter's smoothing factor.)

::: example A low-pass filter in Q16.16
```cpp
#include <cstdint>
#include <cstdio>
#include <limits>

// Q16.16: a 32-bit integer that counts in steps of 1/65536.
struct Q16 {
    std::int32_t raw;
    static constexpr int kFrac = 16;
    static constexpr std::int64_t kOne = std::int64_t{1} << kFrac;   // 65536
};

constexpr std::int32_t saturate(std::int64_t x) {
    constexpr std::int64_t hi = std::numeric_limits<std::int32_t>::max();
    constexpr std::int64_t lo = std::numeric_limits<std::int32_t>::min();
    return static_cast<std::int32_t>(x > hi ? hi : (x < lo ? lo : x));
}

// Only at init or on the ground: converting needs floating point.
constexpr Q16 from_double(double d) {
    return Q16{saturate(static_cast<std::int64_t>(d * Q16::kOne + (d >= 0 ? 0.5 : -0.5)))};
}
constexpr double to_double(Q16 q) { return static_cast<double>(q.raw) / Q16::kOne; }

constexpr Q16 add(Q16 a, Q16 b) {
    return Q16{saturate(std::int64_t{a.raw} + b.raw)};
}
constexpr Q16 sub(Q16 a, Q16 b) {
    return Q16{saturate(std::int64_t{a.raw} - b.raw)};
}
constexpr Q16 mul(Q16 a, Q16 b) {
    const std::int64_t wide = std::int64_t{a.raw} * b.raw;           // Q32.32
    const std::int64_t half = std::int64_t{1} << (Q16::kFrac - 1);   // for rounding
    return Q16{saturate((wide + half) >> Q16::kFrac)};               // back to Q16.16
}

int main() {
    const Q16 a = from_double(1.5);
    const Q16 b = from_double(-2.25);
    std::printf("1.5   -> raw %d\n", a.raw);
    std::printf("-2.25 -> raw %d\n", b.raw);
    std::printf("a*b = %g (raw %d)\n", to_double(mul(a, b)), mul(a, b).raw);

    // A low-pass filter y += alpha * (x - y), in Q16.16 and in double.
    const Q16 alpha = from_double(0.1);
    const Q16 x = from_double(3.0);
    Q16 yq = from_double(0.0);
    double yd = 0.0;
    for (int k = 1; k <= 30; ++k) {
        yq = add(yq, mul(alpha, sub(x, yq)));
        yd = yd + 0.1 * (3.0 - yd);
        if (k % 10 == 0) {
            std::printf("step %2d  fixed %.6f  double %.6f  diff %.2e\n", k,
                        to_double(yq), yd, to_double(yq) - yd);
        }
    }
    const Q16 big = from_double(30000.0);
    std::printf("30000 + 30000 saturates to %.5f\n", to_double(add(big, big)));
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
1.5   -> raw 98304
-2.25 -> raw -147456
a*b = -3.375 (raw -221184)
step 10  fixed 1.954041  double 1.953965  diff 7.58e-05
step 20  fixed 2.635345  double 2.635270  diff 7.54e-05
step 30  fixed 2.872864  double 2.872827  diff 3.72e-05
30000 + 30000 saturates to 32767.99998
```

Check the numbers. $1.5 \times 65536 = 98304$ and $-2.25 \times 65536 = -147456$. Their product is $-3.375$, and $-3.375 \times 65536 = -221184$. Right.

Why does the filter differ from `double` by about $7.6 \times 10^{-5}$? Mostly because of $\alpha$. The raw value of 0.1 is $\mathrm{round}(0.1 \times 65536) = 6554$, and $6554 / 65536 = 0.100006\ldots$ — a little more than 0.1. So the fixed-point filter moves toward 3 slightly faster, and runs slightly ahead. As both outputs settle at 3, the gap shrinks. The rest of the difference is rounding in each multiply, at most half a step, $2^{-17} \approx 7.6 \times 10^{-6}$, per operation.

**Sanity check.** After 30 steps the filter should have closed $1 - 0.9^{30} \approx 0.958$ of the gap to 3, giving about $2.87$. Both columns say 2.87. And the last line shows saturation: $30000 + 30000$ does not fit, so the sum clamps to the largest value, $2147483647 / 65536 \approx 32767.99998$, instead of wrapping to a negative number.
:::

Notice three habits in that code. The multiply is done in `std::int64_t`, because the product of two 32-bit values needs up to 64 bits. The saturation happens *before* narrowing back to 32 bits, because **[[signed overflow is undefined behavior|signed-overflow]]** in C++: an `int32_t` addition that overflows is not guaranteed to wrap, it is a bug the compiler may assume never happens. And `from_double` uses floating point, so it is meant for initialization or for tools on the ground; the flight loop itself touches only integers.

::: warning Fixed point makes rounding error visible, not absent
Every multiply rounds to the nearest $2^{-n}$, and every constant is rounded when it is converted in. Those errors are small but they add up, especially in a filter that runs millions of times. The **[[Patriot missile|patriot]]** failure of 1991 is the classic case of a constant that could not be stored exactly. Know the size of your rounding step and check how errors grow over a whole mission, not over ten steps.
:::

## Determinism: the same bits, every time

Now the second topic. Think of a recipe. If two cooks follow the same recipe with the same ingredients, you hope they get the same cake. But if one adds the eggs before the sugar and the other after, the cakes might come out slightly different. Computers are the same. Floating-point arithmetic is *rounded* after every operation, so the **order** of operations can change the last bits of the answer.

Here is the smallest example. In `double` arithmetic:

$$
(0.1 + 0.2) + 0.3 = 0.6000000000000001, \qquad 0.1 + (0.2 + 0.3) = 0.6.
$$

In real-number math those are equal: addition is **associative**, meaning the grouping does not matter. In floating point it is not, because $0.1 + 0.2$ is rounded before $0.3$ is added. The difference is one unit in the last place. Small — but it is a *different* answer.

**Bit-exact reproducibility** means the same inputs give the same output bits on every run, every build and every machine that is supposed to be equivalent. Flight software needs it for very practical reasons:

- **Replay.** Engineers feed recorded flight data into the same code on the ground to investigate an anomaly. If the ground build does not reproduce the flight numbers exactly, they cannot tell a real problem from a build difference. This is **[[golden-output testing|golden-replay]]**.
- **Redundant computers.** When two cores or three flight computers compare their outputs, an honest one-bit difference looks exactly like a radiation upset.
- **Certification.** The binary that was tested must behave like the binary that flies. If a change of compiler flags can change the numbers, the test evidence no longer applies.

### Where differences sneak in

- **Reassociation.** The compiler regroups sums, often to use vector instructions that add four or eight numbers at once. The grouping changes, so the rounding changes.
- **Fused multiply-add (FMA).** Many processors can compute $a \times b + c$ with a *single* rounding at the end instead of two. That is more accurate, but it is a different answer. On a 64-bit ARM chip, which always has FMA, a compiler may fuse where an x86 build without FMA does not. The GCC and Clang flag `-ffp-contract=off` forbids fusing, and `std::fma` asks for it explicitly where you want it.
- **The math library.** `std::sin`, `std::exp` and friends are not required to be correctly rounded. **[[Different libraries|libm]]** may disagree in the last bit.
- **Anything not arithmetic.** Reading uninitialized memory, iterating over an `std::unordered_map` (whose order depends on the library and its hashing), or letting thread timing decide which result is combined first.

### The flag that breaks everything: -ffast-math

GCC and Clang have a switch called `-ffast-math`. It sounds like a free speedup. It is a bundle of permissions. The two that matter most here: the compiler may **reassociate** floating-point math as if it were exact real-number math, and it may **assume no NaNs or infinities** ever occur. Both are false promises in GNC code, as the next example shows.

::: example Two builds, two answers
The program checks a sensor reading for NaN, adds up 1,000 numbers, and computes $a \times a + c$ both normally and with `std::fma`.

```cpp
#include <cmath>
#include <cstdio>
#include <cstring>

// noinline: the compiler must not see the inputs and fold the answers away.
__attribute__((noinline)) bool looks_valid(double x) {
    return !std::isnan(x);
}

__attribute__((noinline)) double sum(const double* v, int n) {
    double s = 0.0;
    for (int i = 0; i < n; ++i) { s += v[i]; }
    return s;
}

__attribute__((noinline)) double mul_add(double a, double b, double c) {
    return a * b + c;
}

int main() {
    // 1. A NaN from a failed sensor read.
    volatile double raw = -1.0;               // the sensor driver failed
    const double bad = std::sqrt(raw);         // sqrt of a negative is NaN
    std::printf("reading is %s\n", looks_valid(bad) ? "VALID" : "NaN, rejected");

    // 2. Adding the same 1000 numbers, in a loop.
    double v[1000];
    for (int i = 0; i < 1000; ++i) { v[i] = 1.0 / (i + 1.0); }
    const double s = sum(v, 1000);
    unsigned long long bits;
    std::memcpy(&bits, &s, sizeof bits);
    std::printf("sum = %.17g  bits = %016llx\n", s, bits);

    // 3. Multiply-then-add, rounded twice or (with fma) once.
    const double a = 1.0 + std::ldexp(1.0, -30);
    const double c = -(1.0 + std::ldexp(1.0, -29));
    std::printf("a*a+c = %g   fma(a,a,c) = %g\n", mul_add(a, a, c), std::fma(a, a, c));
}
```

Built on x86-64 with `g++ -std=c++20 -Wall -Wextra -O3`:

```text
reading is NaN, rejected
sum = 7.4854708605503433  bits = 401df11f45f4e618
a*a+c = 0   fma(a,a,c) = 8.67362e-19
```

The same source, built with `-O3 -ffast-math`:

```text
reading is VALID
sum = 7.4854708605503335  bits = 401df11f45f4e60d
a*a+c = 0   fma(a,a,c) = 8.67362e-19
```

Go line by line.

1. **The NaN check vanished.** Under `-ffast-math` the compiler is told NaNs never happen, so it replaced `!std::isnan(x)` with `true`. A failed sensor read — exactly the thing the check exists to catch — is now reported as VALID and would flow into the navigation filter. Lesson 07's `FLIGHT_ASSERT(std::isfinite(out))` would be deleted the same way.
2. **The sum changed.** Allowed to reassociate, the compiler added the numbers in several parallel lanes and combined them at the end. The result differs in the last few bits: `...e618` versus `...e60d`. Neither is wrong, but they are *different*, and whether you get one or the other depends on the optimization level and the target chip.
3. **FMA gives a different answer from multiply-then-add.** Here $a = 1 + 2^{-30}$, so $a^2 = 1 + 2^{-29} + 2^{-60}$. Rounding the product to a `double` loses the tiny $2^{-60}$, and adding $c$ gives 0. The fused version rounds only once, at the end, and keeps $2^{-60} \approx 8.67 \times 10^{-19}$. This build did not fuse `a * b + c` on its own; a build for a chip with FMA might.

**Sanity check.** The true sum of $1/k$ for $k = 1$ to 1000 is about $\ln 1000 + 0.5772 \approx 7.485$. Both builds agree to 14 digits, which is why nobody notices this in a unit test that compares with a tolerance. It shows up only when you compare bits, which is exactly what redundant computers and replay tests do.
:::

::: key
`-ffast-math` is dangerous in GNC code. It permits reassociation and assumes no NaNs or infinities, so results change with optimization level, NaN-based fault detection stops working, and bit-exact reproducibility across builds is lost. Determinism is a requirement, not a preference.
:::

::: warning It is not one flag
`-ffast-math` turns on several narrower flags, including `-fassociative-math` and `-ffinite-math-only`, and turning any of them on alone brings the same problem. Higher optimization settings such as GCC's `-Ofast` include `-ffast-math`. A build review checks the *final* command line, not only the flags someone typed on purpose. Some toolchains also change the processor's handling of **[[tiny numbers|denormals]]** for the whole program when you link with it.
:::

### How flight projects keep the bits the same

- **Pin the toolchain.** One compiler version, one set of flags, recorded in the build files and checked in review. No `-ffast-math`, and `-ffp-contract=off` unless fusing is a deliberate, documented choice.
- **Control the order yourself.** Write sums in a fixed order. Do not let thread timing decide the order of a reduction.
- **Own the math functions.** Use a math library whose version is pinned, or your own implementations of the few functions you need, so every platform computes `sin` the same way.
- **Test bits, not tolerances.** Keep golden outputs, and compare them as hex, exactly, in continuous integration. A tolerance test is still useful for *correctness*; the bit test is what catches a change of *behavior*.
- **Use fixed point where it fits.** Integer arithmetic has one correct answer. Given the same raw inputs, a Q16.16 filter produces the same raw outputs on every chip that exists, as long as you avoid undefined behavior such as signed overflow.

## Check yourself

::: check
Convert $-0.3$ to Q15. What raw value is stored, what value does it really represent, and how big is the error?
:::

::: answer
Multiply by $2^{15} = 32768$: $-0.3 \times 32768 = -9830.4$. Round to the nearest integer: $-9830$. It represents $-9830 / 32768 \approx -0.2999878$. The error is about $1.22 \times 10^{-5}$, which is less than half a step ($2^{-16} \approx 1.53 \times 10^{-5}$), as rounding guarantees.
:::

::: check
Multiply 2.5 by 4.0 in Q16.16. Show the raw values at every step.
:::

::: answer
The raw values are $2.5 \times 65536 = 163840$ and $4 \times 65536 = 262144$. Their product, in 64 bits, is $163840 \times 262144 = 42949672960$, a Q32.32 number. Shift right by 16: $42949672960 / 65536 = 655360$. Read it back: $655360 / 65536 = 10$. And $2.5 \times 4 = 10$. Note the intermediate product is far bigger than a 32-bit integer can hold (about $2.1 \times 10^9$), which is why the multiply is done in 64 bits.
:::

::: check
Why does the `add` in the Q16.16 code convert both operands to `std::int64_t` before adding, instead of adding the two `int32_t` values and checking afterwards?
:::

::: answer
Signed integer overflow is undefined behavior in C++. If two large `int32_t` values are added directly and the sum does not fit, the program has no defined meaning, and the compiler is allowed to assume that never happens — it may even delete a check written afterwards. Adding in 64 bits can never overflow for 32-bit inputs, so the true sum exists, and `saturate` can then clamp it safely into range.
:::

::: check
A navigation filter marks a measurement bad with `if (std::isnan(z)) reject(z);`. It works in the debug build but, in the release build, bad measurements get through. What would you look for first?
:::

::: answer
Look at the release build's final compiler flags for `-ffast-math`, `-Ofast` or `-ffinite-math-only`. Any of them lets the compiler assume NaN never occurs, so it may remove the `std::isnan` test entirely. The fix is to remove the flag, and to add a test that feeds a NaN through the release build and checks it is rejected, so the problem cannot come back silently.
:::

::: check
The same GNC code, built with the same flags, gives bit-identical results on two x86-64 test machines but differs in the last bit from the build for the 64-bit ARM flight computer. Name two likely causes and a fix for each.
:::

::: answer
First, fused multiply-add: the ARM build may fuse `a * b + c` into one rounding where the x86 build rounds twice. Fix: compile both with `-ffp-contract=off`, or use `std::fma` explicitly where you want fusing so both platforms do the same thing. Second, the math library: `sin`, `exp` and similar may come from different library implementations that disagree in the last bit. Fix: use one pinned math library, or your own implementations, on both platforms. (A third possibility is vectorized reductions reordering sums differently on each target, fixed by removing any reassociation permission and writing reductions in a fixed order.)
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Fixed point | fraction stored as an integer with an agreed scale | $x = r / 2^n$ |
| Q15 | 16-bit, 15 fraction bits | range $[-1, 1)$, step $3.05 \times 10^{-5}$ |
| Q16.16 | 32-bit, 16 whole and 16 fraction bits | range $[-32768, 32768)$, step $1.53 \times 10^{-5}$ |
| Fixed-point multiply | widen, multiply, round, shift right by $n$ | the product has $2n$ fraction bits |
| Saturation | clamp instead of wrapping | wraparound flips the sign |
| Determinism | same inputs give the same bits | needed for replay, voting, certification |
| Reassociation | compiler regroups float operations | changes the last bits |
| FMA | $a \times b + c$ with one rounding | differs from two roundings; `-ffp-contract=off` |
| `-ffast-math` | reassociate, assume no NaN or Inf | deletes NaN checks, breaks reproducibility |

Fixed point and deterministic builds matter most on small, dedicated processors, which are exactly the machines you cannot compile code *on*. The next lesson, on cross-compiling and linker scripts, shows how to build for such a target from your laptop with a CMake toolchain file, and how to decide where in the chip's memory each piece of code lives.

::: context fpu The part of the chip that does fractions
A floating-point unit is circuitry inside a processor that adds, multiplies and divides floating-point numbers directly, in a few clock cycles. Chips without one — for example Arm's small Cortex-M0 and Cortex-M3 cores — can still run `float` code, but the compiler turns each operation into a call to a software routine built from integer instructions, which is many times slower. Many motor controllers, power supplies and sensor boards on a spacecraft use chips like these.
:::

::: context qualified What "qualified" means
In safety-critical work, a part or tool is qualified when there is documented evidence that it behaves as specified in the conditions it will face. For aircraft software, the DO-178C guidance asks for this kind of evidence about the platform the code runs on. Floating-point units are complicated, and processor makers publish lists of known hardware bugs (errata) for them. If a project cannot show its floating-point unit is trustworthy, the simplest honest choice is not to depend on it.
:::

::: context q-layout The same bits, read two ways
A Q15 number is an ordinary 16-bit signed integer. The top bit is the sign, and the other 15 bits are all fraction. A Q16.16 number is a 32-bit signed integer with the binary point in the middle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="12" fill="#1f2a44">Q15</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="15" width="18" height="24" fill="#f2b880"/>
    <rect x="78" y="15" width="270" height="24" fill="#8fb8f0"/>
  </g>
  <line x1="78" y1="8" x2="78" y2="46" stroke="#b4232c" stroke-width="2"/>
  <text x="69" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">sign</text>
  <text x="213" y="32" font-size="11" fill="#1f2a44" text-anchor="middle">15 fraction bits</text>
  <text x="10" y="100" font-size="12" fill="#1f2a44">Q16.16</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="85" width="9" height="24" fill="#f2b880"/>
    <rect x="69" y="85" width="135" height="24" fill="#ffffff"/>
    <rect x="204" y="85" width="144" height="24" fill="#8fb8f0"/>
  </g>
  <line x1="204" y1="78" x2="204" y2="116" stroke="#b4232c" stroke-width="2"/>
  <text x="64" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">sign</text>
  <text x="136" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">15 whole bits</text>
  <text x="276" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">16 fraction bits</text>
  <text x="204" y="142" font-size="11" fill="#b4232c" text-anchor="middle">binary point</text>
</svg>
```
:::

::: context wraparound The number line bent into a circle
A 16-bit signed integer is not a line with ends; it is a circle. Counting up past 32767 lands on $-32768$, the far side. So $24576 + 16384$ goes a quarter of the way past the top and lands at $-24576$. In Q15 terms, $0.75 + 0.5$ lands on $-0.75$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="30" r="5" fill="#1f2a44"/>
  <text x="180" y="13" font-size="11" fill="#1f2a44" text-anchor="middle">32767 | -32768</text>
  <circle cx="180" cy="170" r="5" fill="#1f2a44"/>
  <text x="180" y="190" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <circle cx="230" cy="51" r="6" fill="#1d6fd1"/>
  <text x="242" y="48" font-size="11" fill="#1d6fd1">24576 (0.75)</text>
  <circle cx="130" cy="51" r="6" fill="#b4232c"/>
  <text x="118" y="48" font-size="11" fill="#b4232c" text-anchor="end">-24576 (-0.75)</text>
  <path d="M236,62 A62,62 0 0,0 124,62" fill="none" stroke="#f2b880" stroke-width="3"/>
  <path d="M130,56 L122,66 L134,66 Z" fill="#f2b880"/>
  <text x="180" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">add 16384</text>
  <text x="180" y="115" font-size="11" fill="#6c7a93" text-anchor="middle">(a quarter turn)</text>
  <text x="275" y="160" font-size="11" fill="#6c7a93">counting up</text>
  <text x="85" y="160" font-size="11" fill="#6c7a93" text-anchor="end">negatives</text>
</svg>
```
:::

::: context ariane Flight 501
On 4 June 1996 the first Ariane 5 rocket broke up about 40 seconds after launch. Inside the inertial reference system, code reused from Ariane 4 converted a 64-bit floating-point value related to horizontal velocity into a 16-bit signed integer. Ariane 5 flew a faster trajectory, the value was too large, and the conversion raised an unhandled error. The backup unit, running the same code, had failed the same way a moment earlier. The inquiry board's report is short and worth reading.
:::

::: context signed-overflow Why wrapping is not guaranteed
Unsigned integers in C++ wrap around by definition. Signed integers do not: if an `int32_t` operation overflows, the behavior is undefined. Optimizers use that. For example, they may conclude that `x + 1 > x` is always true for a signed `x`, and delete code that relies on the wrap. So "it wrapped on my machine" is not a design. Doing the arithmetic in a wider type and clamping, as the example does, keeps every step defined.
:::

::: context patriot A tenth of a second, 3.6 million times
In 1991 a Patriot air-defense battery at Dhahran, Saudi Arabia, failed to intercept an incoming Scud missile, and 28 soldiers were killed. The system counted time in tenths of a second, and 0.1 has no exact binary form; stored in a 24-bit fixed-point register, each tick was short by about $9.5 \times 10^{-8}$ s. After about 100 hours of running, the clock was off by about a third of a second. A Scud travels well over half a kilometer in that time, so the system looked for the target in the wrong place.
:::

::: context golden-replay Recording the right answer
A golden output is a saved result of running the code on a known input, reviewed once and then treated as the reference. Every later build reruns the same input and compares, bit for bit. When it differs, someone must explain why before the change is accepted. Flight projects use the same machinery for anomaly investigation: they replay the sensor data recorded in flight through the ground build and expect to see exactly the numbers the vehicle sent down.
:::

::: context libm Why sin is not the same everywhere
The IEEE 754 standard requires the basic operations — add, subtract, multiply, divide, square root — to be correctly rounded, so every conforming machine gives the same bits for them. It does not require that of functions like `sin`, `cos` or `exp`, because computing them to the last bit is expensive. Each math library chooses its own trade of speed and accuracy, and different libraries can return results that differ in the last bit or two.
:::

::: context denormals Flushing the tiniest numbers
Floating point has a range of extra-small "subnormal" numbers near zero. Handling them can be slow on some processors, so there is a processor setting that treats them as zero. On x86 Linux, linking a program with GCC's `-ffast-math` adds startup code that switches this setting on for the whole program — including code in other files that was compiled without the flag. One file's flag can change another file's results.
:::
