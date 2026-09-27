---
id: l08-solve-do-not-invert
title: Solve, do not invert
minutes: 20
covers:
  - Solving Ax=b with ldlt().solve(b) rather than inverting
---

You have 12 cookies to share among 3 friends. You divide: $12 \div 3 = 4$. You would never first work out $1/3$ on a calculator, get 0.333, and then multiply $12 \times 0.333 = 3.996$. In exact math the two routes give the same answer. In practice the detour costs an extra step and leaves you with a rounding error you did not need.

Matrices tempt you into exactly that detour. The equation $A\mathbf{x} = \mathbf{b}$ has the textbook answer $\mathbf{x} = A^{-1}\mathbf{b}$, read "A inverse times b", and Eigen will happily compute `A.inverse() * b`. But forming the **inverse** $A^{-1}$ (the matrix that undoes $A$, so $A^{-1}A = I$) is the "work out one third first" route. The direct route is to factor $A$, as the last lesson showed, and **solve**: `A.ldlt().solve(b)` for a symmetric positive definite matrix, `A.partialPivLu().solve(b)` for a general one.

On a vehicle, the most important place this shows up is the Kalman filter's measurement update. Its gain has an inverse right in the textbook formula. This lesson shows why and how flight code computes it without one, how the Joseph form keeps the covariance healthy afterwards, and how to prove the whole update never touches the heap.

## Why the inverse is a detour

Think about what an inverse really is. Column $j$ of $A^{-1}$ is the solution of $A\mathbf{x} = \mathbf{e}_j$, where $\mathbf{e}_j$ is the $j$-th column of the identity. So computing $A^{-1}$ means factoring $A$ and then solving $n$ systems, one per column. If all you wanted was $A^{-1}\mathbf{b}$, you have solved $n$ systems to answer one question, and then you still have to multiply.

Count the flops (one flop is one floating-point add, subtract, multiply or divide) for an $n \times n$ matrix with LU:

- Factor and solve: the factorization is about $\tfrac{2}{3}n^3$, and one solve is about $2n^2$.
- Invert and multiply: the factorization, plus about $\tfrac{4}{3}n^3$ to build all $n$ columns of the inverse, plus $2n^2$ for the multiply. About $2n^3$ in all.

For large $n$ the $n^3$ terms win, and $2n^3$ is three times $\tfrac{2}{3}n^3$. The Cholesky family shows the same ratio: about $\tfrac{1}{3}n^3$ to factor, about $n^3$ to invert.

The cost is only half the story. The inverse also rounds every one of its $n^2$ entries, and then the multiply rounds again. The solve never builds those entries. It works straight from the triangular factors, whose rounding the factorization already controls.

::: key
**Why solve rather than invert?** Forming the inverse costs roughly three times a factorize-and-solve and adds rounding; `solve()` uses the factorization directly. Explicit inverses are for when the matrix itself is the answer, which is rare.
:::

"The matrix itself is the answer" does happen. You might need to report a covariance's inverse (an **[[information matrix|information-matrix]]**) to another system, or store an inverse inertia tensor that is used thousands of times and never changes. A rotation matrix is its own special case: its inverse is its transpose, which costs nothing. But when the inverse is only a stepping stone toward a product, solve.

::: example Inverse against solve on a hard matrix
The **[[Hilbert matrix|hilbert]]** has entries $H_{ij} = 1/(i + j + 1)$, counting from zero. It is symmetric, positive definite, and famously badly conditioned. Build the right side from a known answer of all ones, then see who recovers it.

```cpp
#include <Eigen/Dense>
#include <cstdio>

int main() {
    // The 10 x 10 Hilbert matrix, H(i,j) = 1 / (i + j + 1): symmetric,
    // positive definite, and very badly conditioned.
    constexpr int n = 10;
    Eigen::Matrix<double, n, n> H;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            H(i, j) = 1.0 / (i + j + 1);

    const Eigen::Matrix<double, n, 1> x_true = Eigen::Matrix<double, n, 1>::Ones();
    const Eigen::Matrix<double, n, 1> b = H * x_true;

    const Eigen::Matrix<double, n, 1> x_inv   = H.inverse() * b;
    const Eigen::Matrix<double, n, 1> x_lu    = H.partialPivLu().solve(b);
    const Eigen::Matrix<double, n, 1> x_ldlt  = H.ldlt().solve(b);

    auto report = [&](const char* name, const Eigen::Matrix<double, n, 1>& x) {
        std::printf("%-10s residual |Hx - b| = %.1e   error |x - x_true| = %.1e\n",
                    name, (H * x - b).norm(), (x - x_true).norm());
    };
    report("inverse", x_inv);
    report("LU solve", x_lu);
    report("LDLT solve", x_ldlt);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -I/usr/include/eigen3`:

```text
inverse    residual |Hx - b| = 5.6e-05   error |x - x_true| = 2.1e-02
LU solve   residual |Hx - b| = 4.7e-16   error |x - x_true| = 1.6e-04
LDLT solve residual |Hx - b| = 4.2e-16   error |x - x_true| = 5.3e-04
```

Two numbers per method. The **[[residual|residual-vs-error]]** $\lVert H\mathbf{x} - \mathbf{b} \rVert$ asks "does the answer satisfy the equations?" The **error** $\lVert \mathbf{x} - \mathbf{x}_{\text{true}} \rVert$ asks "is it the right answer?"

Both solves have residuals around $4 \times 10^{-16}$: they satisfy the equations to the last bit double precision can hold. The inverse's residual is about $5.6 \times 10^{-5}$, over a hundred billion times worse. Its error is $2.1 \times 10^{-2}$, about 40 to 130 times the solves' errors.

**Sanity check** with lesson 06. This matrix's condition number is about $1.6 \times 10^{13}$. Double precision carries about 16 digits, so about 13 are at risk and even the best method can only promise about three. The solves' errors of $10^{-4}$ on entries of size 1 fit that: three or four good digits. The inverse lost one or two more.
:::

::: warning Do not hide the inverse inside a formula
The inverse rarely appears alone. It hides in lines like `K = P * H.transpose() * S.inverse()` or `x = (A.transpose() * A).inverse() * A.transpose() * b`. Each is a solve wearing a disguise. The second one is worse than it looks: forming $A^T A$ squares the condition number before anything else happens, so use a QR on $A$ directly, as in the last lesson's gyro-bias fit.
:::

::: note Tiny fixed-size matrices
For fixed-size $2 \times 2$, $3 \times 3$ and $4 \times 4$ matrices, Eigen's `inverse()` uses explicit cofactor formulas: the determinant in the denominator and small products on top. They are fast, so at those sizes the "three times the cost" argument is weak. The accuracy argument is not. The cofactor formulas do no pivoting, and dividing by a nearly zero determinant loses exactly the digits a badly conditioned matrix cannot spare. `ldlt().solve()` on a $3 \times 3$ costs a few dozen flops too. Keep the habit.
:::

## Solving when the unknown is on the left

A short reminder of the **[[Kalman filter|kalman-history]]**, which the estimation modules teach in full. The filter carries a **state estimate** $\mathbf{x}$ and its **covariance** $P$. A measurement $\mathbf{z}$ arrives, predicted by $H\mathbf{x}$, where $H$ is the **measurement matrix**, with measurement noise covariance $R$. The update is:

$$
S = H P H^T + R, \qquad K = P H^T S^{-1}, \qquad \mathbf{x} \leftarrow \mathbf{x} + K(\mathbf{z} - H\mathbf{x}).
$$

$S$ is the **[[innovation covariance|innovation]]**: how uncertain the difference between the measurement and the prediction should be. $K$ is the **gain**: how far to move the estimate toward the measurement. Read $\leftarrow$ as "becomes".

The gain formula has $S^{-1}$ on the *right*. `solve()` solves $S X = B$, with the unknown on the left of $S$. So turn the equation around. Multiply both sides of $K = PH^TS^{-1}$ on the right by $S$:

$$
K S = P H^T.
$$

Now transpose both sides. The transpose of a product reverses the order, $(KS)^T = S^T K^T$, and $S$ is symmetric, so $S^T = S$:

$$
S K^T = (P H^T)^T.
$$

That is a solve with $S$ on the left and the unknown $K^T$ beside it. Its right side is a whole matrix, not one column. `solve()` handles that: it solves for every column at once, reusing one factorization. In Eigen, with `PHt` holding $PH^T$:

```cpp
const K_t K = S.ldlt().solve(PHt.transpose()).transpose();
```

Check the sizes for 6 states and 3 measurements. $PH^T$ is $6 \times 3$, so its transpose is $3 \times 6$. $S$ is $3 \times 3$. The solve returns a $3 \times 6$ matrix, $K^T$, and one more transpose gives the $6 \times 3$ gain. With fixed-size types, a mismatch anywhere in that chain is a compile error, not a crash in flight.

Why LDLT? Because $S$ is a covariance: $HPH^T$ is positive semi-definite, and adding the noise $R$ makes it positive definite. That is the Cholesky family's home ground.

## The Joseph form

After the gain comes the covariance update. The short textbook form is

$$
P \leftarrow (I - KH)\,P.
$$

It is correct, but only when $K$ is exactly the optimal gain. And it subtracts: $P - KHP$ takes a big positive matrix and removes most of it. That is the kind of subtraction where rounding survives and the good digits cancel. The result can drift out of symmetry, and after enough steps, lose positive definiteness. A covariance with a negative variance in it makes the filter trust a direction infinitely, and it **[[diverges|divergence]]**.

The **[[Joseph form|joseph-name]]** computes the same thing another way:

$$
P \leftarrow (I - KH)\,P\,(I - KH)^T + K R K^T.
$$

Read it as two pieces. The first carries the old uncertainty through the correction. The second adds the uncertainty the measurement noise brings in. Both pieces have the shape $M Q M^T$ with $Q$ a covariance, and any matrix of that shape is symmetric and positive semi-definite. Their sum is too. So no matter what gain went in, what comes out is a legal covariance.

::: key
**Why the Joseph form covariance update?** It is algebraically equivalent to the simple form for the optimal gain, but stays symmetric positive semi-definite even when the gain is slightly wrong or round-off has crept in. That robustness is why flight filters use it.

$$
P^+ = (I - KH)\,P\,(I - KH)^T + K R K^T
$$
:::

::: example One dimension, three gains
A position estimate with variance $P = 4\ \mathrm{m^2}$ (a 2 m spread) meets a measurement with $R = 1\ \mathrm{m^2}$, and $H = 1$. Then $S = 4 + 1 = 5$ and the optimal gain is $K = 4/5 = 0.8$. In one dimension the simple form is $(1 - K)P$ and the Joseph form is $(1 - K)^2 P + K^2 R$.

**Optimal gain, $K = 0.8$.** Simple: $(1 - 0.8) \times 4 = 0.8\ \mathrm{m^2}$. Joseph: $0.2^2 \times 4 + 0.8^2 \times 1 = 0.16 + 0.64 = 0.8\ \mathrm{m^2}$. They agree, as promised.

**A slightly wrong gain, $K = 0.9$.** Simple: $(1 - 0.9) \times 4 = 0.4\ \mathrm{m^2}$. Joseph: $0.1^2 \times 4 + 0.9^2 \times 1 = 0.04 + 0.81 = 0.85\ \mathrm{m^2}$. The Joseph value is the true variance of the error for that gain (the note below proves it). The simple form claims 0.4, less than half the truth: the filter now believes it knows the position far better than it does.

**A badly wrong gain, $K = 1.3$.** Simple: $(1 - 1.3) \times 4 = -1.2\ \mathrm{m^2}$, a negative variance, which is impossible. Joseph: $0.3^2 \times 4 + 1.3^2 \times 1 = 0.36 + 1.69 = 2.05\ \mathrm{m^2}$. Still better than the prior 4, but far worse than the 0.8 the right gain delivers. That is honest: a gain above 1 jumps 30% past the measurement, and overshooting does throw information away.

**Sanity check.** With the optimal gain, the new variance 0.8 is smaller than both the old 4 and the measurement's 1. Combining two sources of information should beat either one alone, and it does.
:::

::: note Why it has to be true: deriving the Joseph form
Let $\mathbf{e} = \mathbf{x}_{\text{true}} - \mathbf{x}$ be the error before the update, with covariance $P$, and let the measurement be $\mathbf{z} = H\mathbf{x}_{\text{true}} + \mathbf{v}$, with noise $\mathbf{v}$ of covariance $R$, independent of $\mathbf{e}$. After the update the estimate is $\mathbf{x} + K(\mathbf{z} - H\mathbf{x})$, so the new error is

$$
\mathbf{e}^+ = \mathbf{e} - K(H\mathbf{e} + \mathbf{v}) = (I - KH)\,\mathbf{e} - K\mathbf{v}.
$$

The covariance of $M\mathbf{e}$ is $MPM^T$, the two pieces are independent, and so

$$
P^+ = (I - KH)\,P\,(I - KH)^T + KRK^T.
$$

Nothing here assumed $K$ was optimal: the Joseph form is the true covariance for *any* gain. Now expand it:

$$
P^+ = P - KHP - PH^TK^T + K(HPH^T + R)K^T = P - KHP - PH^TK^T + KSK^T.
$$

For the optimal gain, $KS = PH^T$, so $KSK^T = PH^TK^T$, and the last two terms cancel. What remains is $P - KHP = (I - KH)P$, the simple form. So the simple form is a shortcut that is only valid when the cancellation is exact.
:::

::: warning Re-symmetrizing aliases
Filters often finish with $P \leftarrow \tfrac{1}{2}(P + P^T)$ to scrub off the last round-off asymmetry. Lesson 05 showed that the obvious line, `P = 0.5 * (P + P.transpose());`, aliases: it writes `P` entry by entry while the transpose is still reading it, so the lower triangle is built from upper entries that were already overwritten. From a $3 \times 3$ matrix holding 1 to 9, the build used for this module printed a result that was not symmetric at all, with no warning in either debug or release. Force the transpose into a temporary first: `P = 0.5 * (P + P.transpose().eval());`.
:::

## A whole update, and no allocation

Here is the complete 6-state, 3-measurement update: position and velocity in three axes, with a position fix from a GPS receiver. Every type is fixed-size. The program checks for heap use in two ways, because there are two doors to the heap.

- It **[[replaces the global operator new|replace-new]]** with a version that counts calls. The C++ standard lets a program do that, and every `new` in the program, including those inside standard containers, then passes through the counter.
- Eigen's own dynamic matrices do not use `new`: they call `malloc` directly, so the counter never sees them. For those, the program defines `EIGEN_RUNTIME_NO_MALLOC` before including Eigen and switches allocation off around the call with `Eigen::internal::set_is_malloc_allowed(false)`. If Eigen tries to allocate in that window, an assertion stops the program. Lesson 11 covers this switch in depth.

::: example A 6-state Kalman update with a zero-allocation check
```cpp
#define EIGEN_RUNTIME_NO_MALLOC   // lets a test forbid Eigen heap use
#include <Eigen/Dense>
#include <cstdio>
#include <cstdlib>
#include <new>

// Count every call to operator new in the program.
static long g_allocs = 0;
void* operator new(std::size_t n) {
    ++g_allocs;
    if (void* p = std::malloc(n)) return p;
    throw std::bad_alloc();
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

using State   = Eigen::Matrix<double, 6, 1>;   // position (m), velocity (m/s)
using Cov     = Eigen::Matrix<double, 6, 6>;
using Meas    = Eigen::Matrix<double, 3, 1>;   // measured position (m)
using MeasCov = Eigen::Matrix<double, 3, 3>;
using H_t     = Eigen::Matrix<double, 3, 6>;
using K_t     = Eigen::Matrix<double, 6, 3>;

void update(State& x, Cov& P, const H_t& H, const MeasCov& R, const Meas& z) {
    const K_t PHt = P * H.transpose();            // 6 x 3
    const MeasCov S = H * PHt + R;                // innovation covariance, 3 x 3

    // K S = PHt  <=>  S K^T = PHt^T  (S is symmetric): solve, never invert.
    const K_t K = S.ldlt().solve(PHt.transpose()).transpose();

    const Meas y = z - H * x;                      // innovation
    x.noalias() += K * y;

    // Joseph form.
    const Cov I_KH = Cov::Identity() - K * H;
    P = I_KH * P * I_KH.transpose() + K * R * K.transpose();
    P = 0.5 * (P + P.transpose().eval());          // clean off round-off asymmetry
}

int main() {
    State x;
    x << 7000e3, 0, 0, 0, 7.5e3, 0;               // a rough orbit guess
    Cov P = Cov::Zero();
    P.diagonal() << 100, 100, 100, 1, 1, 1;        // (10 m)^2 and (1 m/s)^2
    P(0, 3) = P(3, 0) = 5;                          // position-velocity correlation
    H_t H = H_t::Zero();
    H.leftCols<3>().setIdentity();                  // we measure position only
    const MeasCov R = MeasCov::Identity() * 25;     // (5 m)^2 GPS noise
    Meas z;
    z << 7000e3 + 8, -4, 3;

    std::printf("trace P before: %.4f\n", P.trace());
    const long before = g_allocs;
    Eigen::internal::set_is_malloc_allowed(false);  // Eigen asserts if it allocates
    update(x, P, H, R, z);
    Eigen::internal::set_is_malloc_allowed(true);
    const long allocs = g_allocs - before;
    std::printf("trace P after:  %.4f\n", P.trace());
    std::printf("x after: %.4f %.4f %.4f %.4f %.4f %.4f\n",
                x(0) - 7000e3, x(1), x(2), x(3), x(4) - 7.5e3, x(5));
    std::printf("P(0,0) = %.4f m^2, P(3,3) = %.4f (m/s)^2\n", P(0, 0), P(3, 3));
    std::printf("symmetry error: %.1e\n", (P - P.transpose()).cwiseAbs().maxCoeff());
    std::printf("LLT of P: %s\n",
                P.llt().info() == Eigen::Success ? "succeeds (positive definite)" : "FAILS");
    std::printf("operator new calls during update: %ld\n", allocs);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3`, without `-DNDEBUG`, so Eigen's assertions stay switched on:

```text
trace P before: 303.0000
trace P after:  62.8000
x after: 6.4000 -3.2000 2.4000 0.3200 0.0000 0.0000
P(0,0) = 20.0000 m^2, P(3,3) = 0.8000 (m/s)^2
symmetry error: 0.0e+00
LLT of P: succeeds (positive definite)
operator new calls during update: 0
```

The printout subtracts the big numbers (7000 km and 7.5 km/s) so the changes are easy to read. Check the numbers by hand, one axis at a time, since this $P$ keeps the axes separate.

- The position gain is $100 / (100 + 25) = 0.8$, so the $x$ position moves $0.8 \times 8 = 6.4$ m toward the measurement. The $y$ and $z$ positions move $0.8 \times (-4) = -3.2$ m and $0.8 \times 3 = 2.4$ m.
- The $x$ velocity is correlated with the $x$ position, with covariance 5. Its gain is $5 / 125 = 0.04$, so it moves $0.04 \times 8 = 0.32$ m/s, even though no velocity was measured. The other velocities have no correlation with any position, so they stay put.
- The position variance falls to $(1 - 0.8) \times 100 = 20\ \mathrm{m^2}$, a 4.5 m spread, better than both the 10 m prior and the 5 m GPS.
- The $x$ velocity variance falls to $1 - 0.04 \times 5 = 0.8\ \mathrm{(m/s)^2}$.
- The trace is $3 \times 20 + 0.8 + 1 + 1 = 62.8$. Down from 303, as a measurement update should be.

And the health checks: the symmetry error is exactly zero, the Cholesky factorization of the new $P$ succeeds, the counter saw **zero** calls to `operator new`, and Eigen's no-allocation assertion never fired. Every temporary, even the LDLT object, lived on the stack.

To see the second check earn its keep, change one line so the gain is a dynamic matrix, `const Eigen::MatrixXd K = ...`. The program still compiles, the counter still reads zero, and the run stops:

```text
kf_bad: /usr/include/eigen3/Eigen/src/Core/util/Memory.h:164: void Eigen::internal::check_that_malloc_is_allowed(): Assertion `is_malloc_allowed() && "heap allocation is forbidden (EIGEN_RUNTIME_NO_MALLOC is defined and g_is_malloc_allowed is false)"' failed.
```
:::

The counter is a general tool: it catches any `new` in the program, from any library. Eigen's switch is specific: it catches Eigen's own allocations and stops at the exact line that tries one. Together they belong in a unit test, so that a future edit that slips a `MatrixXd` or a `std::vector` into the update fails the build instead of the timing budget.

::: warning A test only proves the paths it runs
Both checks see only allocations that happen while the test runs. A branch the test never takes (say, a fallback when `ldlt().info()` fails) is not proven. Drive the update through its unusual paths too. And remember which door each check guards: a lone `operator new` counter would have reported zero for the `MatrixXd` version above.
:::

## Check yourself

::: check
For a $300 \times 300$ general matrix, estimate the flops for (a) LU factor-and-solve with one right-hand side and (b) forming the inverse and multiplying.
:::

::: answer
(a) Factoring costs about $\tfrac{2}{3}n^3 = \tfrac{2}{3} \times 300^3 = 18$ million flops, and one solve about $2n^2 = 180{,}000$. Total about 18.2 million.

(b) The inverse costs about $2n^3 = 54$ million flops, and the multiply another 180,000. Total about 54.2 million.

The ratio is about 3, as the flop count predicts for large $n$.
:::

::: check
A colleague writes `x = A.inverse() * b;` for a well-conditioned $3 \times 3$ matrix and says "it's tiny and well-conditioned, so who cares?" Give one reason it is still worth changing.
:::

::: answer
Any of these. At $3 \times 3$ Eigen's inverse uses cofactor formulas with no pivoting, so if the matrix later becomes badly conditioned (a new sensor geometry, a covariance that collapses), the code loses digits it did not have to; a solve degrades far more gracefully. The inverse also hides the question "is this matrix healthy?": an `ldlt()` or `llt()` gives you `info()` (and LDLT `isPositive()`) to check. And the habit carries over to larger matrices, where both the cost and the accuracy gaps are big.
:::

::: check
A filter has 9 states and 2 measurements. Write out the sizes of $P$, $H$, $PH^T$, $S$, the argument passed to `solve()`, the result of `solve()`, and $K$.
:::

::: answer
$P$ is $9 \times 9$ and $H$ is $2 \times 9$. $PH^T$ is $(9 \times 9)(9 \times 2) = 9 \times 2$. $S = HPH^T + R$ is $2 \times 2$. The argument to `solve()` is $(PH^T)^T$, which is $2 \times 9$. `solve()` returns $K^T$ with the same shape, $2 \times 9$. Transposing gives $K$, $9 \times 2$: one row per state, one column per measurement, as a gain should be.
:::

::: check
A scalar filter has $P = 9\ \mathrm{m^2}$, $R = 9\ \mathrm{m^2}$ and $H = 1$. Find the optimal gain, then the updated variance by the simple form and by the Joseph form. Repeat both forms for a gain of 0.8.
:::

::: answer
$S = 9 + 9 = 18$ and the optimal gain is $K = 9/18 = 0.5$. Simple form: $(1 - 0.5) \times 9 = 4.5\ \mathrm{m^2}$. Joseph form: $0.5^2 \times 9 + 0.5^2 \times 9 = 2.25 + 2.25 = 4.5\ \mathrm{m^2}$. They agree.

With $K = 0.8$: simple form $(1 - 0.8) \times 9 = 1.8\ \mathrm{m^2}$. Joseph form $0.2^2 \times 9 + 0.8^2 \times 9 = 0.36 + 5.76 = 6.12\ \mathrm{m^2}$. The Joseph value is the real variance for that gain. The simple form claims a variance more than three times too small, so the filter would become overconfident.
:::

::: check
Why does adding $KRK^T$ in the Joseph form guarantee the result is positive semi-definite, while $(I - KH)P$ does not?
:::

::: answer
For any vector $\mathbf{v}$, $\mathbf{v}^T(MQM^T)\mathbf{v} = (M^T\mathbf{v})^T Q (M^T\mathbf{v})$, which is $\geq 0$ whenever $Q$ is positive semi-definite. Both Joseph terms have that shape, with $Q = P$ and $Q = R$, so each is positive semi-definite, and so is their sum. Each term is also symmetric by construction. The simple form $(I - KH)P$ is a product of two matrices with no such structure; it is only symmetric and positive semi-definite when $K$ is exactly optimal, so a slightly wrong gain or round-off can push it out of symmetry or make a variance negative.
:::

## Summary

| Idea | Meaning | Code or formula |
|---|---|---|
| Solve, do not invert | factor once, substitute; never build $A^{-1}$ for a product | `A.ldlt().solve(b)`, `A.partialPivLu().solve(b)` |
| Cost | inverting is about three times factor-and-solve | $2n^3$ against $\tfrac{2}{3}n^3$ (LU) |
| Accuracy | the solve's residual stays at rounding level | Hilbert 10: $4 \times 10^{-16}$ against $6 \times 10^{-5}$ |
| Gain | $K = PH^TS^{-1}$, solved as $SK^T = (PH^T)^T$ | `S.ldlt().solve(PHt.transpose()).transpose()` |
| Joseph form | covariance update that stays symmetric positive semi-definite for any gain | $P^+ = (I - KH)P(I - KH)^T + KRK^T$ |
| Re-symmetrize safely | avoid transpose aliasing | `P = 0.5 * (P + P.transpose().eval());` |
| No allocation | fixed-size types keep every temporary on the stack | count `operator new` calls and use `EIGEN_RUNTIME_NO_MALLOC` |

The next lesson, *Rotations and frames: the Geometry module*, leaves the filter's covariance for its attitude: quaternions, angle-axis rotations, rigid transforms between frames, and smooth interpolation between orientations.

::: context information-matrix The inverse of a covariance
The inverse of a covariance, $P^{-1}$, is called the **information matrix**. Where the covariance says how uncertain you are, the information matrix says how much you know. It has a handy property: information from independent measurements adds. So some filters (called information filters) and many smoothing and mapping systems carry the information matrix instead of the covariance.

That is a case where an inverse, or rather its structure, really is the answer. Even then, good implementations factor it and solve with it rather than inverting it back.
:::

::: context hilbert A famous troublemaker
David Hilbert, the German mathematician, met this matrix while studying how well polynomials can approximate a function. It has become the standard test for numerical linear algebra because its condition number explodes as it grows: about $1.6 \times 10^{13}$ at size 10, and by size 12 it passes $10^{16}$, beyond what double precision can handle at all.

It is not a contrived monster. Fitting a polynomial with powers $1, t, t^2, \dots$ to data spread evenly over $[0, 1]$ by the normal equations produces a matrix very close to it. That is one more reason to fit with QR and to prefer well-behaved basis functions.
:::

::: context residual-vs-error Right answer to a nearby question
A good solver cannot promise the exact answer to your problem, because the problem itself was rounded when it was stored. What it can promise is the exact answer to a problem a hair away from yours. Numerical analysts call that **backward stability**, and a residual at rounding level is its fingerprint.

How far that nearby answer is from the true one depends on the matrix, not the solver: roughly the condition number times the size of the nudge. So a backward-stable solve on a badly conditioned matrix can still have a sizable error, as the Hilbert solves do. Computing $A^{-1}\mathbf{b}$ is not backward stable in this sense, and its residual shows it.
:::

::: context kalman-history From a 1960 paper to the Moon
Rudolf Kálmán published the filter that carries his name in 1960. Stanley Schmidt and his team at NASA Ames saw that it could solve a problem they had: navigating a spacecraft to the Moon with limited computing power. Their version, extended to handle nonlinear dynamics, flew in the Apollo navigation software.

The filter runs in two alternating steps. **Predict** moves the estimate forward in time and grows its uncertainty. **Update** folds in a measurement and shrinks it. This lesson is about the update.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="35" width="120" height="46" rx="8" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="210" y="35" width="120" height="46" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="56" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">predict</text>
  <text x="90" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">P grows</text>
  <text x="270" y="56" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">update</text>
  <text x="270" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">P shrinks</text>
  <path d="M150 45 L204 45" stroke="#1f2a44" stroke-width="1.5" fill="none"/>
  <polygon points="204,40 212,45 204,50" fill="#1f2a44"/>
  <path d="M210 72 L156 72" stroke="#1f2a44" stroke-width="1.5" fill="none"/>
  <polygon points="156,67 148,72 156,77" fill="#1f2a44"/>
  <text x="180" y="25" font-size="11" fill="#6c7a93" text-anchor="middle">measurement z</text>
  <text x="180" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">next time step</text>
</svg>
```
:::

::: context innovation The surprise in a measurement
The **innovation** is $\mathbf{y} = \mathbf{z} - H\mathbf{x}$: what the sensor said minus what the filter expected it to say. In plain words, it is the surprise. $S$ is how big the filter thinks that surprise should be, combining its own uncertainty ($HPH^T$) and the sensor's ($R$).

Comparing the two is one of the most useful health checks in navigation. The number $\mathbf{y}^T S^{-1} \mathbf{y}$ (computed with a solve, of course) should average about the number of measurements, 3 for a GPS position. When it is repeatedly large, either the sensor is lying or the filter is overconfident, and fault-detection logic can reject the measurement. That test comes back in the estimation modules.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="130" cy="70" r="7" fill="#1d6fd1"/>
  <circle cx="250" cy="70" r="7" fill="#b4232c"/>
  <text x="130" y="50" font-size="12" fill="#1d6fd1" text-anchor="middle">predicted Hx</text>
  <text x="250" y="50" font-size="12" fill="#b4232c" text-anchor="middle">measured z</text>
  <line x1="138" y1="92" x2="242" y2="92" stroke="#f2b880" stroke-width="3"/>
  <polygon points="242,86 252,92 242,98" fill="#f2b880"/>
  <text x="190" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">innovation y = z - Hx</text>
</svg>
```
:::

::: context divergence How a filter goes wrong
**Divergence** is the failure every navigation engineer fears. The filter's covariance says "I know where I am to within a meter", while the real error grows to tens or hundreds of meters. Because the filter trusts itself so much, it gives new measurements almost no weight, so nothing pulls it back.

A covariance that has lost symmetry or positive definiteness is one road there. A variance that should be small but positive has gone to zero or below, and the filter treats that direction as perfectly known.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="20" x2="40" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <path d="M40 30 Q120 82 330 90" stroke="#1d6fd1" stroke-width="2" fill="none"/>
  <path d="M40 170 Q120 118 330 110" stroke="#1d6fd1" stroke-width="2" fill="none"/>
  <path d="M40 108 L80 96 L120 106 L160 99 L200 90 L240 80 L285 66 L330 50" stroke="#b4232c" stroke-width="2.5" fill="none"/>
  <text x="250" y="126" font-size="12" fill="#1d6fd1">filter's own spread</text>
  <text x="200" y="45" font-size="12" fill="#b4232c">true error</text>
  <text x="300" y="194" font-size="11" fill="#6c7a93">time</text>
</svg>
```
:::

::: context joseph-name Where the name comes from
The form is named after Peter Joseph, who worked on filtering for guidance systems in the early 1960s, when the Kalman filter was brand new and the first flight implementations were running into round-off trouble on small computers. It appears in the 1968 book he wrote with Richard Bucy on filtering for guidance.

Its cost is extra matrix products, which mattered a great deal on those machines. Today, for a filter with a dozen states, the extra time is a few microseconds, and almost every flight filter pays it gladly.
:::

::: context replace-new Replacing operator new
C++ lets a program supply its own global `operator new` and `operator delete`. Define them once, outside any namespace, and the linker uses yours instead of the library's. Every `new` expression then goes through them, and so do standard containers, whose default allocator calls `::operator new`. The array form, `new[]`, calls the plain one by default.

Two gaps are worth knowing. Code that calls `malloc` directly never passes through `operator new`, and Eigen's dynamic matrices are exactly such code. And since C++17, over-aligned objects use a separate overload that takes an alignment argument, so a thorough counter replaces that one too.
:::
