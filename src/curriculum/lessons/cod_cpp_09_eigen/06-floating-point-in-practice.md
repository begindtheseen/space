---
id: l06-floating-point-in-practice
title: Floating point in practice
minutes: 26
covers:
  - 'IEEE-754 in practice: fma, Kahan summation, condition number, reproducibility'
---

Measure a pencil with a school ruler and you read the nearest millimeter mark. The pencil might really be 143.6 mm long, but the ruler says 144. That small snap is harmless once. Now measure a hallway by laying the ruler end to end forty times, rounding each time, and the snaps start to add up. Measure something that is itself the small difference between two long lengths, and the snap can be bigger than the answer.

A computer's `double` is a ruler like that, with one twist: its marks are close together near zero and spread farther apart as numbers grow, the way scientific notation keeps a fixed number of digits whatever the size. Every add, subtract, multiply and divide lands exactly on a mark. The rules for where the marks are and how results snap to them are set by a standard called **[[IEEE-754|ieee-754]]**, and nearly every processor that has floating-point hardware, flight computers included, follows it.

Most of the time those snaps are fifteen digits below anything you care about. This lesson is about the times they are not: a clock that drifts because of the way it adds, a cross product that cancels to zero, a covariance whose solve keeps only two good digits, and a test that passes on one build and fails on another. You will meet four tools: **fused multiply-add**, **Kahan summation**, the **condition number**, and the habits that make results **reproducible**.

## The ruler inside a double

A `double` stores a number in 64 bits, as a sign, a power of two, and a fraction with 52 stored bits (53 counting a hidden leading 1). The **[[bit layout|double-layout]]** means a double carries about 16 **significant digits** (the digits that count, starting from the first one that is not zero), whatever the size of the number.

The gap between 1 and the next double above it is called **machine epsilon**:

$$
\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16}
$$

Read $\varepsilon$ as "epsilon". The gap between neighboring doubles scales with the number: near 1 it is $\varepsilon$; near 3600 it is about $4.5 \times 10^{-13}$; near $10^{16}$ it is 2. So in a double, $10^{16} + 1$ is exactly $10^{16}$: the 1 falls between two marks and snaps away.

IEEE-754 promises that each basic operation gives the exact answer rounded to the nearest mark. The rounding error of one operation is therefore at most half a gap, which relative to the answer is at most

$$
u = \frac{\varepsilon}{2} = 2^{-53} \approx 1.11 \times 10^{-16},
$$

the **unit roundoff**. A `float` has 23 stored fraction bits, so its $\varepsilon$ is $2^{-23} \approx 1.19 \times 10^{-7}$: about 7 digits.

Many ordinary decimals are not on any mark. **[[0.1 is one of them|point-one]]**, which is why `0.1 + 0.2 == 0.3` is false in C++ and in Python: the sum prints as `0.30000000000000004`.

::: key
A `double` keeps about 16 significant digits: $\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16}$, and each operation's relative rounding error is at most $u = 2^{-53} \approx 1.11 \times 10^{-16}$. A `float` keeps about 7: $\varepsilon = 2^{-23} \approx 1.19 \times 10^{-7}$.
:::

One rounding is tiny. The trouble comes from two patterns: **many roundings piling up**, and **subtracting two nearly equal numbers**, which throws away the digits they share and leaves the rounding dust in front. The next two sections take those one at a time.

## Adding many small numbers: Kahan summation

The simplest way for a flight computer running at 1 kHz to keep time is to add the step $\Delta t = 0.001$ s every cycle (read $\Delta t$ as "delta t", the time step). After one hour that is 3,600,000 additions. Each one adds a small number to a large one, and each one rounds.

**Kahan summation** (also called **compensated summation**) keeps a second variable, `c`, that remembers the part of each addition that fell off the ruler, and feeds it back in on the next step.

::: example One hour of clock ticks
```cpp fragment
#include <Eigen/Dense>
#include <cstdio>

// Kahan (compensated) summation: carry the rounding error along.
double kahan_sum(const Eigen::VectorXd& v) {
    double sum = 0.0;
    double c = 0.0;                   // what the last addition lost
    for (Eigen::Index i = 0; i < v.size(); ++i) {
        const double y = v(i) - c;    // add back what was lost last time
        const double t = sum + y;     // big + small: low bits of y fall off
        c = (t - sum) - y;            // recover exactly what fell off
        sum = t;
    }
    return sum;
}

double naive_sum(const Eigen::VectorXd& v) {
    double sum = 0.0;
    for (Eigen::Index i = 0; i < v.size(); ++i) sum += v(i);
    return sum;
}

int main() {
    // One hour of 1 kHz time steps, dt = 0.001 s.
    const Eigen::VectorXd dt = Eigen::VectorXd::Constant(3'600'000, 0.001);

    float clock_f = 0.0f;             // the same clock kept in float
    for (Eigen::Index i = 0; i < dt.size(); ++i) clock_f += 0.001f;

    std::printf("float loop : %.6f s\n", clock_f);
    std::printf("naive loop : %.12f s\n", naive_sum(dt));
    std::printf("Kahan      : %.12f s\n", kahan_sum(dt));
    std::printf("Eigen sum(): %.12f s\n", dt.sum());
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -I/usr/include/eigen3`:

```text
float loop : 3530.204102 s
naive loop : 3600.000000274667 s
Kahan      : 3600.000000000000 s
Eigen sum(): 3599.999999942519 s
```

Read the four lines.

1. **Float.** The clock is 69.8 s slow after one hour. Near 3000, neighboring floats are $2^{-12} \approx 0.000244$ s apart. Adding 0.001 s lands between marks and snaps to four gaps, $4 \times 0.000244 = 0.000977$ s. There, every tick loses about 2.3 percent.
2. **Naive double.** Off by $2.7 \times 10^{-7}$ s. Tiny, but for a vehicle at orbital speed, 7.7 km/s, that timing error alone is $7700 \times 2.7 \times 10^{-7} \approx 0.002$ m of position. And it keeps growing with flight time.
3. **Kahan.** Correct to every printed digit. (The stored 0.001 is itself very slightly off from one thousandth, but 3,600,000 of those stored values add up to a number that rounds to exactly 3600.)
4. **Eigen's `sum()`.** A different answer again, off by $-5.7 \times 10^{-8}$ s. Eigen adds with **[[SIMD|simd-lanes]]** instructions, keeping several partial sums side by side and combining them at the end. That order of additions is different from the plain loop, so the rounding is different.

Sanity check: all three double results agree to about 10 significant digits, and none is further off than a few tenths of a microsecond. The float result is off in the third digit, which matches its 7-digit precision after millions of roundings.
:::

::: note Why it has to be true
Trace one step with a large `sum` and a small `y`. The exact sum $s + y$ does not fit, so `t` is the rounded version and some low bits of $y$ are lost. Then `t - sum` is the part of `y` that actually got in. A result of T. J. Dekker from 1971 shows that when $|s| \ge |y|$, the subtraction `t - sum` is exact, and so is `(t - sum) - y`. So `c` is *exactly* the negative of what was lost. The next step computes `y = v(i) - c`, adding the lost piece back into the next small number, where it has a chance to fit. The total error of Kahan summation stays at a few units of $u$ times the sum of the sizes, no matter how many terms there are, instead of growing with the number of terms.
:::

::: warning -ffast-math deletes Kahan summation
Algebraically, `c = (t - sum) - y` is zero, because `t = sum + y`. The whole method relies on the computer *not* doing algebra on it. The GCC and Clang flag `-ffast-math` lets the compiler rearrange floating-point expressions as if they were exact. Built with `-O2 -ffast-math`, the same program printed `Kahan : 3600.000000274667 s`: identical to the naive loop, because the compiler proved `c` is always zero and removed it. Any compensated algorithm needs a build without **[[fast-math|fast-math]]**.
:::

## Fused multiply-add

Many calculations in GNC code are "multiply two numbers, then add a third": dot products, matrix products, polynomial evaluation. Normally $a \times b + c$ rounds twice, once after the multiply and once after the add. A **fused multiply-add**, or **FMA**, computes $a \times b + c$ exactly and rounds **once** at the end. C++ spells it `std::fma(a, b, c)` from `<cmath>`. Most modern processors have an FMA instruction, including all 64-bit ARM chips and x86 chips since about 2013. Without one, `std::fma` still gives the correctly rounded answer, computed slowly in software.

One rounding instead of two sounds like a small gain. It becomes a big one when the products nearly cancel.

::: example A cross product that cancels
Two vectors that are almost parallel have a cross product that is small compared with the vectors themselves. The x component of $\mathbf{u} \times \mathbf{v}$ is $u_y v_z - u_z v_y$: a difference of two products. The numbers below are chosen so the exact answer is known, 1. With $b = 2^{27} = 134{,}217{,}728$, take $\mathbf{u} = (0,\ b+1,\ b+2)$ and $\mathbf{v} = (0,\ b,\ b+1)$. Then

$$
u_y v_z - u_z v_y = (b+1)^2 - (b+2)\,b = b^2 + 2b + 1 - b^2 - 2b = 1.
$$

Each product is about $1.8 \times 10^{16}$, where doubles are 4 apart, so $(b+1)^2 = 2^{54} + 2^{28} + 1$ loses its final $+1$ when rounded.

```cpp fragment
#include <Eigen/Dense>
#include <cmath>
#include <cstdio>

// a*d - b*c written the obvious way. The compiler MAY fuse one product.
double plain_diff(double a, double b, double c, double d) {
    return a * d - b * c;
}

// a*d - b*c with an fma that recovers the rounding error of b*c
// (W. Kahan's method for a 2x2 determinant).
double careful_diff(double a, double b, double c, double d) {
    const double w = b * c;
    const double err = std::fma(-b, c, w);   // exactly w - b*c
    const double f = std::fma(a, d, -w);     // a*d - w, rounded once
    return f + err;
}

int main() {
    volatile double big_in = 134217728.0;    // 2^27; volatile stops constant folding
    const double big = big_in;
    const Eigen::Vector3d u(0.0, big + 1.0, big + 2.0);
    const Eigen::Vector3d v(0.0, big, big + 1.0);      // almost parallel to u

    // The x component of u x v is u.y*v.z - u.z*v.y, which is exactly 1.
    std::printf("Eigen u.cross(v).x(): %.1f\n", u.cross(v).x());
    std::printf("plain a*d - b*c     : %.1f\n", plain_diff(u.y(), u.z(), v.y(), v.z()));
    std::printf("careful, with fma   : %.1f\n", careful_diff(u.y(), u.z(), v.y(), v.z()));
}
```

The same source, three builds:

```text
== g++ -O2
Eigen u.cross(v).x(): 0.0
plain a*d - b*c     : 0.0
careful, with fma   : 1.0
== g++ -O2 -march=native
Eigen u.cross(v).x(): 1.0
plain a*d - b*c     : 1.0
careful, with fma   : 1.0
== g++ -O2 -march=native -ffp-contract=off
Eigen u.cross(v).x(): 0.0
plain a*d - b*c     : 0.0
careful, with fma   : 1.0
```

Walk through the first build. Both products round: $u_y v_z$ becomes $2^{54} + 2^{28}$ (the $+1$ is gone) and $u_z v_y = 2^{54} + 2^{28}$ is exact. Their difference is 0. The answer has lost *all* its digits, although each product was off by only 1 part in $10^{16}$.

The careful version uses one FMA to find the exact rounding error of $w = u_z v_y$, and a second to compute $u_y v_z - w$ with a single rounding. Both steps are exact here, so it returns 1 in every build.

The second build is the surprise. `-march=native` tells GCC it may use this machine's FMA instruction, and GCC then **contracts** `a * d - b * c` into one FMA on its own. Here it happened to fuse the product whose rounding did the damage, so the plain code also printed 1. `-ffp-contract=off` forbids contraction and brings back 0.

Sanity check: the length of a cross product is $\lVert \mathbf{u} \rVert \lVert \mathbf{v} \rVert \sin\theta$, where $\theta$ ("theta") is the angle between the vectors. Here $\lVert \mathbf{u} \rVert \lVert \mathbf{v} \rVert \approx 2b^2 \approx 3.6 \times 10^{16}$, so an answer of 1 means the vectors are only about $3 \times 10^{-17}$ rad apart. They are about as close to parallel as doubles can describe, which is exactly where cancellation eats every digit.
:::

::: key
`std::fma(a, b, c)` computes $a \times b + c$ with one rounding. It makes differences of products, such as cross products and 2-by-2 determinants, accurate even when they nearly cancel. The compiler may also fuse `a * b + c` on its own (**contraction**) when FMA hardware is enabled; `-ffp-contract=off` forbids that.
:::

## Condition number: how much a problem amplifies errors

Some problems are touchy on their own, however carefully you compute. Picture finding where two straight roads cross on a map. If they cross at a right angle, nudging one road a little moves the crossing a little. If they are **[[nearly parallel|parallel-lines]]**, the same small nudge slides the crossing point a long way down the road. The trouble is in the problem, not in your pencil.

Solving $\mathbf{A}\mathbf{x} = \mathbf{b}$ works the same way. The **condition number** of $\mathbf{A}$, written $\kappa(\mathbf{A})$ (read "kappa of A"), measures how touchy the solve is. It compares the largest and smallest amount by which $\mathbf{A}$ can stretch a vector, its largest and smallest **[[singular values|singular-values]]**:

$$
\kappa(\mathbf{A}) = \frac{\sigma_{\max}}{\sigma_{\min}} \ge 1
$$

(read $\sigma$ as "sigma"). The rule it gives you:

$$
\frac{\lVert \Delta \mathbf{x} \rVert}{\lVert \mathbf{x} \rVert} \;\lesssim\; \kappa(\mathbf{A}) \, \frac{\lVert \Delta \mathbf{b} \rVert}{\lVert \mathbf{b} \rVert}
$$

In words: a relative error in the input can come out up to $\kappa$ times larger in the answer. Merely storing $\mathbf{b}$ in doubles puts a relative error of about $10^{-16}$ into it. So a good solver loses about $\log_{10} \kappa$ of the 16 digits a double carries:

$$
\text{digits you can trust} \approx 16 - \log_{10} \kappa .
$$

::: example A covariance with two almost identical states
A Kalman filter's covariance $\mathbf{P}$ records how uncertain each state is and how their errors move together. When two states become almost perfectly correlated, for example two estimates that are both driven by the same sensor for a long time, $\mathbf{P}$ looks like

$$
\mathbf{P} = \begin{pmatrix} 1 & 1 - \delta \\ 1 - \delta & 1 \end{pmatrix},
$$

with a small $\delta$ (read "delta"). Its singular values are $2 - \delta$ and $\delta$, so $\kappa = (2 - \delta)/\delta \approx 2/\delta$. The program solves $\mathbf{P}\mathbf{x} = \mathbf{b}$ for 1,000 random known $\mathbf{x}$ and reports the worst error.

```cpp fragment
#include <Eigen/Dense>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>

// A 2x2 covariance of two almost perfectly correlated states.
// Solve P x = b for 1000 known x and report the worst relative error.
void trial(double delta) {
    Eigen::Matrix2d P;
    P << 1.0,         1.0 - delta,
         1.0 - delta, 1.0;

    const Eigen::JacobiSVD<Eigen::Matrix2d> svd(P);
    const double kappa = svd.singularValues()(0) / svd.singularValues()(1);

    std::srand(42);
    double worst = 0.0;
    for (int k = 0; k < 1000; ++k) {
        const Eigen::Vector2d x_true = Eigen::Vector2d::Random();
        const Eigen::Vector2d b = P * x_true;          // rounded once per entry
        const Eigen::Vector2d x = P.ldlt().solve(b);   // solve it back
        worst = std::max(worst, (x - x_true).norm() / x_true.norm());
    }
    std::printf("kappa %.0e   worst relative error %.0e   good digits ~%.0f\n",
                kappa, worst, -std::log10(worst));
}

int main() {
    for (double delta : {1e-2, 1e-6, 1e-10, 1e-14}) trial(delta);
}
```

Output:

```text
kappa 2e+02   worst relative error 3e-14   good digits ~13
kappa 2e+06   worst relative error 3e-10   good digits ~10
kappa 2e+10   worst relative error 2e-06   good digits ~6
kappa 2e+14   worst relative error 3e-02   good digits ~2
```

Check each row against the rule, digits $\approx 16 - \log_{10}\kappa$:

1. $\kappa = 2 \times 10^{2}$: $\log_{10}\kappa \approx 2.3$, so about $13.7$ digits. Measured: 13.
2. $\kappa = 2 \times 10^{6}$: about $9.7$. Measured: 10.
3. $\kappa = 2 \times 10^{10}$: about $5.7$. Measured: 6.
4. $\kappa = 2 \times 10^{14}$: about $1.7$. Measured: 2. A 3 percent error.

Sanity check: every time $\kappa$ grew by a factor of $10^4$, four digits disappeared. The solver is the same (`ldlt()`, a good one); only the matrix changed.
:::

::: key
Why does the condition number matter to a filter? It bounds how much a relative input error is amplified. A covariance with condition $10^{14}$ in double precision has roughly two trustworthy digits left, which is how a filter silently loses positive definiteness and diverges.
:::

**Positive definite** means every variance the matrix describes, in any direction, is greater than zero, as a real uncertainty must be. With two good digits, a tiny positive variance can come out of the arithmetic as a tiny *negative* one. Push the example one step further, $\delta = 10^{-17}$: then $1 - \delta$ rounds to exactly 1, the correlation information is gone, and Eigen's Cholesky factorization refuses the matrix:

```cpp
// delta 1e-02  LLT ok, rcond estimate 5.0e-03
// delta 1e-08  LLT ok, rcond estimate 5.0e-09
// delta 1e-14  LLT ok, rcond estimate 5.0e-15
// delta 1e-17  LLT failed: not positive definite
const Eigen::LLT<Eigen::Matrix2d> llt(P);
if (llt.info() != Eigen::Success) { /* not positive definite */ }
const double rc = llt.rcond();   // only call this after a successful factorization
```

`rcond()` gives a cheap **[[estimate of 1/κ|rcond]]** from the factorization you already have. It is a sensible health monitor for a flight filter: log it, and raise a flag when it falls below, say, $10^{-12}$, long before the factorization fails.

::: warning A small determinant does not mean trouble
The determinant is tempting as a warning light, and it is the wrong one. The matrix $10^{-3}\,\mathbf{I}$ of size 3 has determinant $10^{-9}$ but condition number exactly 1: it is perfectly well-behaved, only small. Scaling a matrix changes its determinant hugely and its condition number not at all. Measure touchiness with $\kappa$ or `rcond()`.
:::

## Reproducibility: the same code, different bits

You have now seen three ways the same source code gives different bits: Eigen's `sum()` changed with `-march=native`, the plain cross product changed with FMA contraction, and Kahan summation changed with `-ffast-math`. The full list of usual suspects:

- **Contraction.** The compiler fuses `a * b + c` into an FMA when the target has one. A 64-bit ARM flight computer and an x86 test PC can then round differently.
- **Vector width.** Eigen's reductions and products split the work across SIMD lanes. Two lanes on one build and eight on another means a different order of additions.
- **Reassociation.** `-ffast-math` (and `-Ofast`, which includes it) lets the compiler reorder sums freely.
- **Math libraries.** `std::sin` or `std::exp` from two different libraries may disagree in the last bit.
- **Threads.** A reduction split across threads adds in whatever order the threads finish.

None of these is a bug in the arithmetic. Each result is a correctly rounded answer to a slightly different sequence of operations. But a flight team that compares a replay against a recorded flight, or two redundant computers that vote, needs to know which differences to expect.

The habits that follow:

1. **Pin the toolchain and flags.** One compiler version and one set of flags, recorded in the build files. No `-ffast-math`. Use `-ffp-contract=off` unless fusing is a deliberate choice, and write `std::fma` where you want it.
2. **Where bits must match across machines**, remove the choices. Defining `EIGEN_DONT_VECTORIZE` makes Eigen use plain loops: the clock program's `sum()` then printed `3600.000000274667`, the naive loop's value, in both the `-O2` and the `-march=native` build. That costs speed, so do it on purpose.
3. **Everywhere else, compare with a tolerance**, not `==`. Eigen's `a.isApprox(b, tol)` checks $\lVert \mathbf{a} - \mathbf{b} \rVert \le \mathrm{tol} \cdot \min(\lVert \mathbf{a} \rVert, \lVert \mathbf{b} \rVert)$. Choose `tol` from what you now know: a few times $u$ for a single operation, more for long sums, and roughly $\kappa u$ for a solve. When you port a NumPy filter to Eigen and match it to $10^{-12}$, this is the reasoning behind that number: NumPy adds with its own **[[summation order|numpy-pairwise]]**, so bit-for-bit agreement is not on offer, and $10^{-12}$ leaves room for honest rounding differences while still catching real bugs.

::: key
Reproducibility: the same source can give different bits through FMA contraction, SIMD width, `-ffast-math` reassociation, math libraries and threads. Pin compiler and flags, avoid `-ffast-math`, control contraction with `-ffp-contract=off` and explicit `std::fma`, and compare results with a tolerance justified by $u$ and $\kappa$.
:::

## Check yourself

::: check
A 100 Hz navigation loop keeps mission time in a `float`, adding 0.01 s each cycle. Near $t = 5000$ s, neighboring floats are $2^{-11} \approx 0.000488$ s apart. What does one tick actually add there, and roughly what fraction of each tick is lost?
:::

::: answer
The gap is $2^{-11} = 0.00048828125$ s, so 0.01 s is $0.01 / 0.00048828125 = 20.48$ gaps. The sum snaps to the nearest mark, so each tick adds 20 gaps: $20 \times 0.00048828125 = 0.009765625$ s. The loss is $0.01 - 0.009765625 = 0.000234375$ s per tick, about 2.3 percent, so the clock runs about 2.3 percent slow while it is in this range. The fix is a `double` (or an integer count of ticks), and Kahan summation if the additions must stay exact for a long time.
:::

::: check
Explain in your own words what the variable `c` in Kahan summation holds, and why a compiler flag can make it disappear.
:::

::: answer
`c` holds the part of the previous addition that was rounded away, with its sign flipped: `t - sum` is what actually got added, and subtracting `y` leaves the shortfall. The next step subtracts `c` from the new term, putting the lost part back. In exact algebra `(t - sum) - y` is zero because `t = sum + y`, so a flag that lets the compiler use exact algebra on floating point, such as `-ffast-math`, is allowed to replace `c` by 0, which turns the method back into the naive loop.
:::

::: check
Two unit line-of-sight vectors to a star differ by about $10^{-9}$ rad. Why might `a.cross(b)` computed in double lose most of its digits, and what tool keeps them?
:::

::: answer
Each cross-product component is a difference of two products, $a_y b_z - a_z b_y$, and for nearly parallel vectors the two products are almost equal. Each product rounds with a relative error near $10^{-16}$, an absolute error near $10^{-16}$ for unit vectors, while the true difference is only about $10^{-9}$. So the result keeps roughly $16 - 9 = 7$ good digits instead of 16, and fewer still if the products are larger. Computing each component with an FMA-based difference of products (Kahan's method: one `std::fma` to capture the rounding error of one product, one to form the difference) keeps close to full precision.
:::

::: check
A covariance has singular values $4 \times 10^{6}$ and $2 \times 10^{-5}$. What is its condition number, and about how many digits of a solve with it can you trust in double? In float?
:::

::: answer
$\kappa = 4 \times 10^{6} / 2 \times 10^{-5} = 2 \times 10^{11}$, so $\log_{10}\kappa \approx 11.3$. In double, about $16 - 11.3 \approx 5$ digits. In float, with about 7 digits to start with, $7 - 11.3$ is negative: the answer may have no correct digits at all. That is one reason flight filters run in double, or restructure the covariance (for example as a square-root or UD factorization) when they must use float.
:::

::: check
The same Eigen unit test passes on a developer's x86 laptop and fails on the ARM flight-computer target with a difference of $3 \times 10^{-16}$ in a result near 1. Name two likely causes and a sensible fix for the test.
:::

::: answer
Likely causes: FMA contraction (the ARM target always has FMA, so the compiler may fuse `a * b + c` where the x86 build did not), and a different SIMD width changing the order of additions in Eigen's reductions or products. A different math library is a third possibility. A difference of $3 \times 10^{-16}$ near 1 is about one gap, $\varepsilon \approx 2.2 \times 10^{-16}$: honest rounding. The test should compare with a tolerance, for example `result.isApprox(expected, 1e-12)`, unless bit-for-bit agreement is a stated requirement, in which case pin the flags (`-ffp-contract=off`, and `EIGEN_DONT_VECTORIZE` if needed) on both builds.
:::

## Summary

| Idea | Formula or fact | In practice |
| --- | --- | --- |
| Machine epsilon | $\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16}$ (double), $2^{-23}$ (float) | about 16 and 7 significant digits |
| Unit roundoff | $u = 2^{-53} \approx 1.11 \times 10^{-16}$ | worst relative error of one operation |
| Gaps grow with size | near $10^{16}$ the gap is 2 | small + big loses the small |
| Kahan summation | carry `c = (t - sum) - y` into the next term | exact-looking long sums; breaks under `-ffast-math` |
| FMA | `std::fma(a, b, c)`: $a b + c$, one rounding | rescues differences of products |
| Contraction | compiler fuses `a * b + c` when allowed | `-ffp-contract=off` to forbid |
| Condition number | $\kappa = \sigma_{\max}/\sigma_{\min}$ | digits left $\approx 16 - \log_{10}\kappa$; $10^{14}$ leaves about 2 |
| Health check | `llt.info()`, `llt.rcond()` | watch `rcond` before the factorization fails |
| Reproducibility | contraction, SIMD width, fast-math, libm, threads | pin flags; compare with tolerances |

Next, **Decompositions** puts the condition number to work: LLT and LDLT (the Cholesky pair every covariance uses), LU, QR and the SVD, what each costs, and which one to pick when a matrix is touchy.

::: context ieee-754 A standard that ended the chaos
Before 1985, computer makers each had their own floating-point formats and rounding rules, so the same program could give different answers on different machines. The IEEE-754 standard, published in 1985, fixed the formats, the rounding and the handling of special values such as infinity and NaN ("not a number"). William Kahan, a professor at Berkeley, was its principal architect, and he received the 1989 Turing Award for his work on numerical computing, this standard included. The 2008 revision added fused multiply-add to the standard. The Kahan in "Kahan summation" is the same person.
:::

::: context double-layout Sixty-four bits, three fields
A double is one sign bit, 11 bits of exponent (the power of two) and 52 bits of fraction. For ordinary numbers the value is $(-1)^{s} \times 1.f \times 2^{e - 1023}$: the leading 1 is not stored, which is where the 53rd bit of precision comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="16" height="34" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="26" y="30" width="66" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="92" y="30" width="258" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="18" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">sign</text>
  <text x="59" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">exponent</text>
  <text x="221" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">fraction</text>
  <text x="18" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="59" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">11 bits</text>
  <text x="221" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">52 bits</text>
  <text x="180" y="104" font-size="11" fill="#6c7a93" text-anchor="middle">1 + 11 + 52 = 64 bits</text>
</svg>
```

A float uses the same plan in 32 bits: 1, 8 and 23.
:::

::: context point-one Why 0.1 never comes out even
In base ten, one third is $0.333\ldots$ forever, because 3 does not divide any power of ten. In base two, the same happens to one tenth: 10 contains a factor of 5, which does not divide any power of two, so 0.1 in binary is $0.000110011001100\ldots$ with the $0011$ repeating forever. A double keeps 53 bits of it and rounds, so the stored value is $0.1000000000000000055511\ldots$. Both 0.1 and 0.2 are stored slightly high, and their rounded sum lands one gap above the double nearest 0.3.
:::

::: context simd-lanes Several running totals at once
A SIMD register holds several doubles side by side. To add a long vector quickly, Eigen keeps one running total per lane, adding entries 0, 4, 8, … into lane 0, entries 1, 5, 9, … into lane 1, and so on, then adds the lanes together at the end. The partial sums stay smaller, so they often lose less than one long running total. But the order of additions depends on how many lanes the build uses, so an SSE build (two lanes) and an AVX build (four lanes) can differ in the last digits.
:::

::: context fast-math What the flag permits
`-ffast-math` bundles several permissions: treat floating-point addition as associative, assume no NaNs or infinities ever appear, ignore the sign of zero, and more. Each one can speed up a loop. Each one also breaks something GNC code relies on: compensated sums, NaN checks on sensor data, and reproducible results. The real-time C++ module shows the NaN check vanishing under the same flag. Most flight projects ban it outright, and check the final compiler command line, since `-Ofast` turns it on too.
:::

::: context parallel-lines Where nearly parallel roads meet
Two lines crossing at a steep angle pin down their crossing point firmly. Two lines crossing at a shallow angle do not: shift one of them by a hair and the crossing slides far along the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="20" x2="120" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="120" x2="120" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="112" x2="120" y2="12" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <circle cx="70" cy="70" r="3.5" fill="#b4232c"/>
  <circle cx="66" cy="66" r="3.5" fill="#1d6fd1"/>
  <text x="70" y="148" font-size="12" fill="#1f2a44" text-anchor="middle">steep: small shift</text>
  <line x1="160" y1="80" x2="350" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="160" y1="60" x2="350" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="160" y1="52" x2="350" y2="72" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <circle cx="255" cy="70" r="3.5" fill="#b4232c"/>
  <circle cx="293" cy="66" r="3.5" fill="#1d6fd1"/>
  <text x="255" y="148" font-size="12" fill="#1f2a44" text-anchor="middle">shallow: same shift, big slide</text>
</svg>
```

Both dashed lines are moved up by the same 8 units. On the left the crossing moves about 6 units; on the right it slides about 38. Solving two equations in two unknowns is exactly finding this crossing, so the shallow case is a matrix with a large condition number.
:::

::: context singular-values How far a matrix can stretch
Feed a matrix every vector of length 1, a whole circle of them, and it turns the circle into an ellipse. The longest radius of the ellipse is the largest singular value, $\sigma_{\max}$; the shortest is $\sigma_{\min}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="70" r="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="70" y="128" font-size="12" fill="#1f2a44" text-anchor="middle">all length-1 vectors</text>
  <line x1="125" y1="70" x2="160" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="166,70 157,65 157,75" fill="#1f2a44"/>
  <text x="143" y="60" font-size="13" fill="#1f2a44" text-anchor="middle">A</text>
  <ellipse cx="262" cy="70" rx="88" ry="14" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="262" y1="70" x2="350" y2="70" stroke="#b4232c" stroke-width="2"/>
  <line x1="262" y1="70" x2="262" y2="56" stroke="#f2b880" stroke-width="3"/>
  <text x="306" y="40" font-size="12" fill="#b4232c" text-anchor="middle">σmax</text>
  <text x="240" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">σmin</text>
  <line x1="248" y1="44" x2="260" y2="58" stroke="#1f2a44" stroke-width="1"/>
  <text x="262" y="128" font-size="12" fill="#1f2a44" text-anchor="middle">κ = σmax / σmin ≈ 6 here</text>
</svg>
``` A long, thin ellipse means the matrix squashes some directions almost flat, and undoing that squash (solving) blows up any error that lies in those directions. For a symmetric positive definite matrix like a covariance, the singular values are its eigenvalues. The decompositions lesson computes them with `JacobiSVD`.
:::

::: context rcond A cheap estimate, not the exact value
Computing $\kappa$ exactly needs a singular value decomposition, which costs several times more than the Cholesky factorization a filter already does. `rcond()` instead uses the factors it already has to estimate the reciprocal of the condition number, measured in a slightly different norm (the largest column sum instead of the largest stretch). It is usually within a small factor of the true value, and that is all a health monitor needs: the difference between $10^{-5}$ and $10^{-14}$ is what matters, not the digits after it.
:::

::: context numpy-pairwise How NumPy adds up an array
NumPy's `sum` on a contiguous array of doubles does not add one number at a time. It splits the array into blocks, adds within blocks, then adds the block totals in pairs, like a tournament bracket. This **pairwise summation** keeps the rounding error growing roughly with the logarithm of the number of terms, not the number itself. It is a different order from both a plain C++ loop and Eigen's SIMD lanes, which is why a NumPy reference and an Eigen port agree to about $10^{-12}$ or better, but seldom bit for bit.
:::
