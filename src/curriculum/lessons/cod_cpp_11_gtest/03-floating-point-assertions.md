---
id: l03-floating-point-assertions
title: Comparing floating-point results, and choosing the tolerance
minutes: 22
covers:
  - 'Floating-point assertions: EXPECT_NEAR, EXPECT_DOUBLE_EQ, and choosing the tolerance'
---

Ask two friends to measure the same table with a tape measure. One says $1.52\,\mathrm{m}$. The other says $1.521\,\mathrm{m}$. Is one of them wrong? No. Both are as right as their tape allows. If you asked "are these two numbers exactly equal?" the answer would be no, and it would be the wrong question. The useful question is "are they within a millimeter or so of each other?"

A computer doing arithmetic with decimals is in the same spot as your friends. It stores numbers with a fixed number of digits, so almost every result is rounded a tiny bit. A long calculation, such as stepping a spacecraft's attitude forward a thousand times, piles up a second, much bigger kind of error on top: the error of the method itself. So in a test, "is the answer exactly $0.000495750435\ldots$?" is almost never the right question. "Is it within a sensible distance?" is.

This lesson gives you the two GoogleTest tools for that question. **`EXPECT_DOUBLE_EQ`** asks "are these equal up to rounding?" **`EXPECT_NEAR`** asks "are these within a distance I choose?" Then comes the part that separates a real test from a decoration: how to choose that distance from the mathematics of the method, so the test catches bugs instead of hiding them.

## Why exact equality fails

Start with the smallest possible surprise:

```cpp
// f1.cpp
#include <gtest/gtest.h>
#include <cmath>

TEST(RoundingTest, ExactEquality) {
    EXPECT_EQ(0.1 + 0.2, 0.3);
}

TEST(RoundingTest, WithinFourUlps) {
    EXPECT_DOUBLE_EQ(0.1 + 0.2, 0.3);
}

TEST(RoundingTest, NearZero) {
    const double pi = std::acos(-1.0);
    EXPECT_DOUBLE_EQ(std::sin(pi), 0.0);
    EXPECT_NEAR(std::sin(pi), 0.0, 1e-15);
}
```

```text
[ RUN      ] RoundingTest.ExactEquality
f1.cpp:5: Failure
Expected equality of these values:
  0.1 + 0.2
    Which is: 0.30000000000000004
  0.3

[  FAILED  ] RoundingTest.ExactEquality (0 ms)
[ RUN      ] RoundingTest.WithinFourUlps
[       OK ] RoundingTest.WithinFourUlps (0 ms)
[ RUN      ] RoundingTest.NearZero
f1.cpp:14: Failure
Expected equality of these values:
  std::sin(pi)
    Which is: 1.2246467991473532e-16
  0.0
    Which is: 0

[  FAILED  ] RoundingTest.NearZero (0 ms)
```

Three tests, three lessons. We take them in order.

**First: $0.1 + 0.2$ is not $0.3$ on a computer.** A `double` stores a number in binary, as a sum of halves, quarters, eighths and so on. In binary, one tenth never ends, the way one third never ends in decimal: $0.333\ldots$. So `0.1` is stored as the **[[nearest number the computer can hold|binary-fractions]]**, a hair off. So are `0.2` and `0.3`. The rounding of $0.1 + 0.2$ lands on a different nearby number from the rounding of $0.3$, and `EXPECT_EQ`, which demands exact equality, fails.

That is not a bug in your code or in the computer. It is what finite storage means. It is also why `EXPECT_EQ` on two `double` values that were computed along different paths is almost always a mistake.

## Units in the last place

To say how close two doubles are, we need a ruler with the right markings. Here it is.

Doubles are not spread evenly. Between $1$ and $2$ there are exactly $2^{52}$ of them, evenly spaced. Between $2$ and $4$ there are also $2^{52}$, so they are twice as far apart. The gap between one double and the next one up is called a **[[ULP|ulp]]**, for **unit in the last place** — the value of one step in the last stored digit. Read "ULP" as the letters U-L-P, or as "ulp" to rhyme with "gulp".

A few sizes, checked with `numpy.spacing` in Python:

| Near the value | One ULP is about |
| --- | --- |
| $0.3$ | $5.55 \times 10^{-17}$ |
| $1.0$ | $2.22 \times 10^{-16}$ |
| $7784\,\mathrm{m/s}$ (a low-orbit speed) | $9.09 \times 10^{-13}\,\mathrm{m/s}$ |
| $6.771 \times 10^{6}\,\mathrm{m}$ (a low-orbit radius) | $9.31 \times 10^{-10}\,\mathrm{m}$ |

The pattern: one ULP is always about $2.2 \times 10^{-16}$ times the size of the number itself, give or take a factor of two. It is a *relative* ruler. That number, $2^{-52} \approx 2.22 \times 10^{-16}$, is called **machine epsilon**, and C++ gives it to you as `std::numeric_limits<double>::epsilon()`.

`EXPECT_DOUBLE_EQ(a, b)` (read "expect double equal") passes when `a` and `b` are at most **four ULPs** apart. It uses the ULP ruler at the size of the numbers, so it works the same for $0.3$ and for $6.771 \times 10^{6}$. Its partner `EXPECT_FLOAT_EQ` does the same for `float`, whose ULP near $1.0$ is much coarser, about $1.19 \times 10^{-7}$.

::: example Counting ULPs by hand
How far apart are `0.1 + 0.2` and `0.3`?

GoogleTest printed `0.30000000000000004` for the sum. The difference from $0.3$ is about $5.55 \times 10^{-17}$. One ULP near $0.3$ is also $5.55 \times 10^{-17}$ (from the table). So the difference is

$$
\frac{5.55 \times 10^{-17}}{5.55 \times 10^{-17}} = 1 \text{ ULP}.
$$

One is less than four, so `EXPECT_DOUBLE_EQ` passes, as the run showed. That is the right answer: the two numbers differ only because of rounding, and a four-ULP window forgives that.

Now the third test, $\sin(\pi)$. The true value is $0$, but the stored $\pi$ is itself a hair off, so `std::sin` returns about $1.22 \times 10^{-16}$. That is tiny. But ULPs near $0$ are tinier still: the doubles crowd together as they approach zero, so there are about $4.4 \times 10^{18}$ of them between $0$ and $1.22 \times 10^{-16}$. Four ULPs is nowhere near enough, and `EXPECT_DOUBLE_EQ` fails. The fix is the line after it: `EXPECT_NEAR` with an absolute tolerance of $10^{-15}$, which passes.
:::

So when is `EXPECT_DOUBLE_EQ` the right tool? When the two values *should be the same number*, and only the order of a few roundings differs. Some honest uses:

- A value that went through a round trip — degrees to radians and back, or written into a telemetry frame as a full double and decoded — should come back within a few ULPs.
- Two ways of writing the same short formula, such as `a * (b + c)` and `a * b + a * c`, differ by a rounding or two.
- A value that was copied, not computed, should come back identical, and four ULPs is a gentle way to check it.

::: key
EXPECT_DOUBLE_EQ allows about four units in the last place, which is right only for values that should be bitwise-almost-identical. EXPECT_NEAR takes an explicit absolute tolerance, which is what a numerical result with accumulated error needs.
:::

::: warning
Never compare against zero with `EXPECT_DOUBLE_EQ`. Near zero, a ULP shrinks to about $5 \times 10^{-324}$, so any real rounding error counts as billions of billions of ULPs. A "should be zero" result — a cross product of parallel vectors, a residual, $\sin(\pi)$ — needs `EXPECT_NEAR(x, 0.0, tol)` with a tolerance chosen for the problem.
:::

## EXPECT_NEAR: a distance you choose

`EXPECT_NEAR(actual, expected, tol)` (read "expect near") passes when

$$
|\text{actual} - \text{expected}| \le \text{tol}.
$$

The bars $|\ |$ mean **absolute value** — the size of the difference with the sign thrown away. The tolerance is **absolute**: it is in the same units as the values. If the values are in radians per second, `tol` is in radians per second. If they are in meters, `tol` is in meters.

That makes it the right tool for any result that carries error from a calculation, such as a filter, a root finder or an integrator. It also makes it easy to misuse, because now *you* choose the number. There are two ways to choose badly.

**Too tight.** A tolerance smaller than one ULP of the values is the same as asking for exact equality. `EXPECT_NEAR(r, r_expected, 1e-12)` on an orbit radius near $6.771 \times 10^6\,\mathrm{m}$ can never pass unless the numbers are identical, because two different doubles there are at least $9.31 \times 10^{-10}\,\mathrm{m}$ apart. That is almost a thousand times the tolerance.

**Too loose.** A tolerance picked by running the test, seeing it fail, and bumping the number until it goes green is worse. It passes today. But it will also pass tomorrow, when someone breaks the code, as long as the break is smaller than your inflated number. The test has become a decoration. Engineers call this **[[tuning until green|tuning-green]]**.

The way out is to compute the tolerance from something you know about the method.

::: warning
`EXPECT_NEAR` is absolute, so one tolerance does not fit values of very different sizes. A tolerance of $10^{-9}$ is loose for a number near $10^{-6}$ and impossibly tight for a number near $10^{7}$. When a test covers values of many sizes, scale the tolerance: `const double tol = 1e-12 * std::abs(expected);` gives a relative check of about 12 digits, and a small absolute floor, such as `std::max(1e-12 * std::abs(expected), 1e-15)`, keeps it working when `expected` is zero.
:::

## Choosing the tolerance for an integrator

An **integrator** steps a differential equation forward in time: from the state now, and the rate of change now, it works out the state a short step $h$ later. Flight software does this constantly — for attitude, for position, for the navigation filter's prediction. The most common workhorse is **[[RK4|rk4-history]]**, the classic fourth-order Runge–Kutta method. Each step samples the rate four times and blends the samples:

```cpp
// rk4.hpp
#pragma once

// Integrates dw/dt = lambda * w from w0 over t_end seconds
// with n fixed RK4 steps. Returns w(t_end).
inline double rk4_decay(double w0, double lambda, double t_end, int n) {
    const double h = t_end / n;
    double w = w0;
    for (int i = 0; i < n; ++i) {
        const double k1 = lambda * w;
        const double k2 = lambda * (w + 0.5 * h * k1);
        const double k3 = lambda * (w + 0.5 * h * k2);
        const double k4 = lambda * (w + h * k3);
        w += (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
    }
    return w;
}
```

The problem it solves here is **rate damping**. A spacecraft is spinning at $w_0 = 0.2\,\mathrm{rad/s}$, and a damper slows it so that the spin rate $w$ obeys $\frac{dw}{dt} = \lambda w$ (read "d w by d t equals lambda w"), with $\lambda = -1.5\,\mathrm{s^{-1}}$. The minus sign means the rate shrinks. This equation has an exact answer, $w(t) = w_0 e^{\lambda t}$, which is what makes it a good test: we know what the integrator *should* get.

A method is **order $p$** if its **global error** — how far the final answer is from the truth after many steps — shrinks like $h^p$. RK4 is fourth order: halve the step and the error drops by a factor of $2^4 = 16$. The error has a size you can predict, and that prediction is the tolerance.

::: key
Pick the tolerance in EXPECT_NEAR from the method order and step size, not by tuning until green. For a fourth-order scheme at step $h$, the global error scales as $h^4$; set the tolerance a small factor above that bound and record the reasoning in a comment.
:::

For this particular equation the error can be worked out in closed form (the note below shows how). After running to time $T$, RK4's error is about

$$
|e| \approx |w(T)| \cdot \frac{T \, |\lambda|^5 \, h^4}{120}.
$$

Every piece has a job. The $h^4$ is the fourth order. The $T$ says error piles up over more steps. The $|\lambda|^5$ says a faster-changing system is harder to follow. The $120$ is $5!$ (read "five factorial", $5 \cdot 4 \cdot 3 \cdot 2 \cdot 1$), the size of the first term RK4 leaves out.

::: example Deriving the tolerance for 1000 RK4 steps
Take $w_0 = 0.2\,\mathrm{rad/s}$, $\lambda = -1.5\,\mathrm{s^{-1}}$, $T = 4\,\mathrm{s}$ and $n = 1000$ steps.

**Step size.** $h = T / n = 4 / 1000 = 0.004\,\mathrm{s}$.

**Exact answer.** $w(4) = 0.2 \, e^{-1.5 \times 4} = 0.2 \, e^{-6} \approx 0.2 \times 0.00247875 \approx 4.9575 \times 10^{-4}\,\mathrm{rad/s}$. Sanity check: $e^{-6}$ is a small number, so after six "time constants" the spin is almost gone, as a damper should make it.

**Predicted error.** Work the formula piece by piece:

- $|\lambda|^5 = 1.5^5 = 7.59375$
- $h^4 = 0.004^4 = 2.56 \times 10^{-10}$
- $T \, |\lambda|^5 \, h^4 / 120 = 4 \times 7.59375 \times 2.56 \times 10^{-10} / 120 \approx 6.48 \times 10^{-11}$
- times $|w(T)| \approx 4.9575 \times 10^{-4}$ gives $|e| \approx 3.21 \times 10^{-14}\,\mathrm{rad/s}$.

**Measured error.** Running `rk4_decay` gives an error of $3.23 \times 10^{-14}\,\mathrm{rad/s}$. The prediction is within one percent.

**Rounding check.** Each step also rounds, and each **[[rounding error|error-vs-step]]** moves $w$ by about one ULP. At the end, $w \approx 5 \times 10^{-4}$, where one ULP is about $1.08 \times 10^{-19}$. (Earlier roundings happened on a larger $w$, but the damping has shrunk their effect by the same proportion.) Even if all $1000$ roundings pushed the same way, they would add about $1000 \times 1.08 \times 10^{-19} \approx 10^{-16}\,\mathrm{rad/s}$, over $300$ times smaller than the method error. So the $h^4$ bound is the one that matters.

**Tolerance.** Take a small factor above the bound — three times, rounded up — so $3 \times 3.21 \times 10^{-14} \approx 9.6 \times 10^{-14}$, and use $10^{-13}\,\mathrm{rad/s}$. Write the reasoning into the test:

```cpp
// f2.cpp
#include <gtest/gtest.h>
#include <cmath>
#include "rk4.hpp"

// Rate damping: w(t) = w0 * exp(lambda * t), with w0 = 0.2 rad/s,
// lambda = -1.5 1/s, integrated for 4 s in 1000 steps (h = 0.004 s).
constexpr double w0 = 0.2, lambda = -1.5, t_end = 4.0;
constexpr int n = 1000;

TEST(Rk4DecayTest, UlpCheckIsTheWrongTool) {
    const double exact = w0 * std::exp(lambda * t_end);
    EXPECT_DOUBLE_EQ(rk4_decay(w0, lambda, t_end, n), exact);
}

TEST(Rk4DecayTest, MatchesAnalyticSolution) {
    const double exact = w0 * std::exp(lambda * t_end);
    // RK4 global error for dw/dt = lambda*w is about
    //   |w(T)| * T * |lambda|^5 * h^4 / 120  =  3.2e-14 rad/s here.
    // Tolerance: three times that bound, rounded up. Rounding error
    // (about n * 1e-19 = 1e-16) is far below it.
    const double tol = 1e-13;
    EXPECT_NEAR(rk4_decay(w0, lambda, t_end, n), exact, tol);
}
```

```text
[ RUN      ] Rk4DecayTest.UlpCheckIsTheWrongTool
f2.cpp:12: Failure
Expected equality of these values:
  rk4_decay(w0, lambda, t_end, n)
    Which is: 0.00049575043536555729
  exact
    Which is: 0.0004957504353332717

[  FAILED  ] Rk4DecayTest.UlpCheckIsTheWrongTool (0 ms)
[ RUN      ] Rk4DecayTest.MatchesAnalyticSolution
[       OK ] Rk4DecayTest.MatchesAnalyticSolution (0 ms)
```

Look at the first test. The two numbers agree to ten significant digits, and the integrator is working perfectly, yet the ULP check fails. The difference, $3.23 \times 10^{-14}$, is about $300{,}000$ ULPs at this size. Method error from a thousand steps is in a different league from rounding. The second test, with the derived tolerance, passes.
:::

The comment in that test is not decoration. A year from now, someone will change the step size or the time span. The comment tells them how to recompute the tolerance instead of guessing.

::: note Why the error is $T |\lambda|^5 h^4 / 120$
For $\frac{dw}{dt} = \lambda w$, write $z = \lambda h$. Push the four RK4 stages through by hand: $k_1 = \lambda w$, $k_2 = \lambda w (1 + z/2)$, $k_3 = \lambda w (1 + z/2 + z^2/4)$, $k_4 = \lambda w (1 + z + z^2/2 + z^3/4)$. Blending them gives

$$
w_{\text{next}} = w \left(1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24}\right).
$$

The exact solution multiplies by $e^z = 1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24} + \frac{z^5}{120} + \cdots$. RK4 matches the first five terms and drops the rest, so each step is off by a fraction of about $\frac{|z|^5}{120}$. That is the **local error**, and it scales as $h^5$.

Over $n = T/h$ steps, those small fractions add up:

$$
n \cdot \frac{|\lambda h|^5}{120} = \frac{T}{h} \cdot \frac{|\lambda|^5 h^5}{120} = \frac{T \, |\lambda|^5 \, h^4}{120}.
$$

One power of $h$ is lost because the number of steps grows as $1/h$. That is why a method whose local error is $h^5$ has a global error of $h^4$, and why it is called fourth order. Multiplying by $|w(T)|$ turns the fraction into an error in rad/s.
:::

### What a derived tolerance catches

A tolerance is only worth something if it fails when the code is wrong. Test that, too.

::: example A one-character typo, and a doubled step
**The typo.** Someone writes `k1` where the third stage should use `k2`:

```cpp
        const double k3 = lambda * (w + 0.5 * h * k1);   // typo: k1 instead of k2
```

The method still runs and still looks sensible: the answer agrees with the truth to about five significant digits. But it is no longer fourth order. The test says:

```text
[ RUN      ] Rk4DecayTest.MatchesAnalyticSolution
f3.cpp:18: Failure
The difference between rk4_decay(w0, lambda, t_end, n) and exact is 8.9503911995672883e-09, which exceeds tol, where
rk4_decay(w0, lambda, t_end, n) evaluates to 0.00049575938572447127,
exact evaluates to 0.0004957504353332717, and
tol evaluates to 1e-13.
```

The error is $8.95 \times 10^{-9} / 3.23 \times 10^{-14} \approx 277{,}000$ times what real RK4 gives. A tolerance of $10^{-6}$, the kind people pick by feel, would have passed this bug without a murmur.

**The doubled step.** Leave the method correct, but run $500$ steps instead of $1000$, so $h = 0.008\,\mathrm{s}$:

```text
f4.cpp:18: Failure
The difference between rk4_decay(w0, lambda, t_end, n) and exact is 5.1916077773578317e-13, which exceeds tol, where
```

Check the ratio: $5.19 \times 10^{-13} / 3.23 \times 10^{-14} \approx 16.1$. Doubling $h$ multiplied the error by almost exactly $2^4 = 16$, as fourth order predicts. The tolerance was set for $h = 0.004\,\mathrm{s}$, so it correctly refuses the coarser run. If you change $h$, you recompute the tolerance, which is what the comment is for.
:::

That doubling experiment is powerful on its own. Measure the error at $h$ and at $h/2$; if their ratio is close to $16$, the code really is fourth order. Lesson 11 turns it into a **[[convergence-order test|convergence-bridge]]** that works even when there is no exact solution to compare against.

::: warning
Watch out for NaN. A NaN ("not a number") is what you get from $0/0$ or the square root of a negative number, and every comparison with NaN is false. That is good news for tests: `EXPECT_NEAR(x, 1.0, 1e-9)` fails if `x` is NaN, and GoogleTest prints `nan` in the message. But a hand-written check such as `EXPECT_FALSE(std::abs(x - 1.0) > 1e-9)` passes on NaN, because the `>` is false. Use `EXPECT_NEAR` rather than rolling your own.
:::

## A short decision guide

Ask where the two numbers came from.

1. **Integers, enums, strings, pointers, or doubles copied without arithmetic?** `EXPECT_EQ`.
2. **The same value reached by a few different roundings?** `EXPECT_DOUBLE_EQ` (or `EXPECT_FLOAT_EQ` for `float`) — but never against zero.
3. **A computed result with method error: an integrator, a filter, an iterative solver, a series cut short?** `EXPECT_NEAR`, with the tolerance derived from the method's order and step size, a small factor above the bound, and the reasoning in a comment.
4. **Values spanning many sizes?** `EXPECT_NEAR` with a tolerance scaled by the size of the expected value.

## Check yourself

::: check
What does one ULP measure, and roughly how big is it for a double near $100$? Use the fact that one ULP is about $2.2 \times 10^{-16}$ times the size of the number, within a factor of two.
:::

::: answer
One ULP is the gap between a double and the next larger double — the value of one step in the last stored bit. Near $100$ it is about $100 \times 2.2 \times 10^{-16} = 2.2 \times 10^{-14}$, within a factor of two. The exact value is $2^{-46} \approx 1.42 \times 10^{-14}$, because $100$ lies between $2^6 = 64$ and $2^7 = 128$, where doubles are spaced $2^{6-52} = 2^{-46}$ apart.
:::

::: check
A test converts an angle from degrees to radians and back, then checks it equals the starting angle. Which assertion fits, and why not `EXPECT_EQ`?
:::

::: answer
`EXPECT_DOUBLE_EQ`. The value should come back as the same number, and only a couple of roundings (a multiply and a divide by $\pi/180$) stand between it and the start. Those can move it by an ULP or two, so exact `EXPECT_EQ` may fail on some angles and pass on others. Four ULPs forgives the rounding and still catches any real bug in the conversion.
:::

::: check
The RK4 rate-damping test above passes with $n = 1000$. You change it to $n = 2000$ steps over the same $4\,\mathrm{s}$. Estimate the new error and propose a tolerance.
:::

::: answer
Doubling $n$ halves $h$ to $0.002\,\mathrm{s}$. The error scales as $h^4$, so it shrinks by $2^4 = 16$: $3.21 \times 10^{-14} / 16 \approx 2.0 \times 10^{-15}\,\mathrm{rad/s}$ (a real run gives $2.01 \times 10^{-15}$). Three times that is about $6 \times 10^{-15}\,\mathrm{rad/s}$. Now check rounding again: $2000$ roundings of about $1.08 \times 10^{-19}$ each add at most about $2.2 \times 10^{-16}$. That is still below the tolerance, but only by a factor of about $27$, where before it was over $300$. So use $6 \times 10^{-15}\,\mathrm{rad/s}$ and update the comment, noting that the test is getting closer to the rounding floor, so shrinking $h$ much further will stop improving the answer.
:::

::: check
A teammate's test uses `EXPECT_NEAR(pos, expected, 1e-3)` for a position in meters from an RK4 orbit propagation, and says "it passes, so it's fine". What question do you ask, and why?
:::

::: answer
Ask where $10^{-3}\,\mathrm{m}$ came from. If it was picked by bumping the number until the test went green, it may be thousands of times larger than RK4's real error at that step size, and then the test would pass even if a typo turned the method into a lower-order one. The tolerance should come from the method order and step size (error scales as $h^4$), set a small factor above that bound, with the reasoning in a comment. Checking that the test fails when you double the step is a quick way to see whether the tolerance is tight enough to mean anything.
:::

::: check
Why does `EXPECT_DOUBLE_EQ(residual, 0.0)` fail even when `residual` is $10^{-17}$?
:::

::: answer
`EXPECT_DOUBLE_EQ` counts ULPs, and near zero the doubles are packed extremely densely: the gaps shrink to about $5 \times 10^{-324}$. Between $0$ and $10^{-17}$ there are billions of billions of doubles, so $10^{-17}$ is far more than four ULPs from zero. A "should be zero" check needs `EXPECT_NEAR(residual, 0.0, tol)` with a tolerance chosen for the problem.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Rounding | most decimals are stored a hair off; results computed different ways rarely match exactly |
| ULP | gap to the next double; about $2.2 \times 10^{-16}$ times the value's size |
| `EXPECT_DOUBLE_EQ` | within about four ULPs; for values that should be bitwise-almost-identical; never against zero |
| `EXPECT_FLOAT_EQ` | the same for `float` |
| `EXPECT_NEAR(a, b, tol)` | $\lvert a - b \rvert \le \text{tol}$; absolute, in the values' units |
| Order $p$ | global error scales as $h^p$; RK4 has $p = 4$, so halving $h$ divides the error by 16 |
| Choosing tol | from order and step size, a small factor above the bound, reasoning in a comment |
| Test the test | a derived tolerance fails on a typo and on a doubled step; a tuned one does not |

You now have tests, fixtures, fatal and nonfatal checks, and tolerances with reasons behind them. The next lesson, *TEST_P parameterised tests*, runs one test body over a whole table of cases — six flight conditions, each with its own tolerance — so every case is reported by name.

::: context binary-fractions Why one tenth cannot be stored exactly
In decimal, a fraction ends only if its bottom number is built from 2s and 5s: $\frac{1}{4} = 0.25$ ends, $\frac{1}{3} = 0.333\ldots$ does not. In binary, a fraction ends only if its bottom number is a power of 2. One tenth has a 5 in its bottom, so in binary it repeats forever: $0.000110011001100\ldots$. A double keeps 53 significant bits and rounds the rest, so `0.1` is stored as $0.1000000000000000055511151231257827\ldots$. Close, but not equal.
:::

::: context ulp A ruler whose marks spread out
Doubles are packed tightly near zero and spread out as numbers grow. Every time the value doubles, the gap between neighbours doubles too. So a ULP is a relative ruler: always about $2.2 \times 10^{-16}$ of the value, within a factor of two.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="20" y1="52" x2="20" y2="68"/><line x1="30" y1="54" x2="30" y2="66"/><line x1="40" y1="54" x2="40" y2="66"/><line x1="50" y1="54" x2="50" y2="66"/>
    <line x1="60" y1="52" x2="60" y2="68"/><line x1="80" y1="54" x2="80" y2="66"/><line x1="100" y1="54" x2="100" y2="66"/><line x1="120" y1="54" x2="120" y2="66"/>
    <line x1="140" y1="52" x2="140" y2="68"/><line x1="180" y1="54" x2="180" y2="66"/><line x1="220" y1="54" x2="220" y2="66"/><line x1="260" y1="54" x2="260" y2="66"/>
    <line x1="300" y1="52" x2="300" y2="68"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="88">1</text><text x="60" y="88">2</text><text x="140" y="88">4</text><text x="300" y="88">8</text>
  </g>
  <text x="40" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">gap g</text>
  <text x="100" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">gap 2g</text>
  <text x="220" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">gap 4g</text>
  <text x="180" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">same count of doubles in each band; the bands double in width</text>
</svg>
```

The picture shows four marks per band to keep it readable; a real double has $2^{52}$ in each band.
:::

::: context tuning-green The tolerance that hides a bug
"Tuning until green" is the habit of loosening a tolerance, run after run, until a failing test passes. It feels like progress, but it throws away the only thing the test was for. A test's job is to fail when the code is wrong. A tolerance chosen by trial passes whatever the code happens to do today, including its bugs. In the typo example in this lesson, the broken RK4 was off by about $9 \times 10^{-9}$, so any tolerance above that would have hidden it. Reviewers on flight software teams routinely ask "where does this tolerance come from?" for exactly this reason.
:::

::: context rk4-history Two German mathematicians
The family of methods is named after Carl Runge, who published the idea in 1895, and Martin Kutta, who extended it in 1901. The version in this lesson, with four stages weighted $1, 2, 2, 1$ and divided by $6$, is so common that people call it "the" Runge–Kutta method or "classic RK4". It is a favourite for simulations and many onboard propagators because it is accurate for its cost, needs only the current state, and is easy to write correctly — and, as the typo example shows, easy to write almost correctly.
:::

::: context error-vs-step Two errors pulling in opposite directions
Shrinking the step makes the method error fall fast, as $h^4$. But more steps means more roundings, so rounding error slowly rises. On a log-log plot the method error is a line with slope 4 going down, and the rounding error is a gentle line going up. The total has a floor where they cross. Below that step size, a smaller $h$ makes the answer worse, not better, and a tolerance based on $h^4$ alone would be too tight.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="2"/>
  <line x1="300" y1="25" x2="90" y2="165" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="60" y1="110" x2="330" y2="155" stroke="#f2b880" stroke-width="3"/>
  <circle cx="150" cy="125" r="5" fill="#b4232c"/>
  <text x="200" y="40" font-size="11" fill="#1d6fd1">method error, slope 4</text>
  <text x="228" y="128" font-size="11" fill="#1f2a44">rounding error</text>
  <text x="150" y="108" font-size="11" fill="#b4232c" text-anchor="middle">floor</text>
  <text x="195" y="190" font-size="12" fill="#1f2a44" text-anchor="middle">step size h (log scale)</text>
  <text x="14" y="95" font-size="12" fill="#1f2a44" transform="rotate(-90 14 95)" text-anchor="middle">error (log)</text>
</svg>
```

The picture is a sketch of the shape, not measured data.
:::

::: context convergence-bridge Testing the order without knowing the answer
Real flight dynamics rarely have an exact formula to compare with. But you can still run the same simulation at step $h$, at $h/2$ and at $h/4$. If the differences between successive runs shrink by about $16$ each time, the integrator is behaving like a fourth-order method. That is the convergence-order test, and lesson 11 of this module builds it, alongside invariant checks and golden data files.
:::
