---
id: l11-testing-numerical-kernels
title: Testing numerical kernels
minutes: 26
covers:
  - 'Testing numerical kernels: invariants, convergence, golden data'
---

Suppose a friend hands you a map app's route across a city you have never visited, and asks whether it is right. You do not know the best route yourself, but you can still check a lot. Does it start at your door and end at the destination? Does it ever drive through a lake? If you ask for a route to somewhere nearer, is the trip shorter? And if a friend who lives there wrote down the route last year, does the app's route match it?

Numerical code puts you in the same spot. An integrator that carries a spacecraft's state forward, the code that turns gyro rates into attitude, a Kalman filter's covariance update — these are **[[numerical kernels|kernel]]**, the small, heavily used routines at the center of guidance and navigation. For most real inputs nobody knows the exact answer. So you test them the way you checked the route, with three kinds of question:

- **Invariants**: things that must stay true however the calculation goes. (No driving through lakes.)
- **Convergence**: when you make the step smaller, the answer must get better, and by the right amount. (A nearer trip is shorter.)
- **Golden data**: a trusted answer recorded earlier, from an independent source, that the code must keep matching. (The friend's written route.)

This last lesson of the module uses every tool you have met — fixtures, `EXPECT_NEAR` with a derived tolerance, parameterised tests, labels, the sanitizer matrix — on exactly this kind of code.

## Invariants: what must never change

An **invariant** is a property the true answer always has, whatever the inputs. The bank that moves money between your accounts must end with the same total. Three invariants carry most of the weight in GNC code.

**A unit quaternion stays unit.** Spacecraft attitude is usually stored as a **[[quaternion|quaternion]]**, four numbers $q = (w, x, y, z)$. Only quaternions of length one, $\lVert q \rVert = 1$ (read "the norm of q equals one"), describe rotations. A propagator that lets the norm drift is producing something that is not an attitude at all.

**Energy is conserved** when no force adds or removes it. A satellite in a two-body orbit keeps the same **specific orbital energy**, $\varepsilon = v^2/2 - \mu/r$ (read "epsilon"), in joules per kilogram.

**A covariance matrix stays symmetric and positive.** A Kalman filter's **[[covariance|covariance]]** matrix $\mathbf{P}$ records how uncertain each estimate is. It must equal its own transpose, $\mathbf{P} = \mathbf{P}^\mathsf{T}$, and all its eigenvalues must be positive — no negative uncertainties.

You can check an invariant for *any* input, with no reference answer at all.

::: example Catching attitude drift with the norm
A common first-order propagator adds a small step each cycle: $q_{k+1} = q_k + \tfrac{1}{2}\Delta t\, q_k \otimes \omega$, where $\omega$ is the body rate from the gyros written as a quaternion with a zero first element, and $\otimes$ (read "quaternion times") is quaternion multiplication. Some implementations renormalize after each step; some forget. A parameterised test runs both:

```cpp
#include <Eigen/Geometry>
#include <gtest/gtest.h>

// One first-order (Euler) step of q_dot = 0.5 * q * [0, w].
Eigen::Quaterniond euler_step(const Eigen::Quaterniond& q,
                              const Eigen::Vector3d& w, double dt,
                              bool renormalize) {
    const Eigen::Quaterniond wq(0.0, w.x(), w.y(), w.z());
    const Eigen::Quaterniond qdot = q * wq;
    Eigen::Quaterniond next(q.coeffs() + 0.5 * dt * qdot.coeffs());
    if (renormalize) next.normalize();
    return next;
}

class AttitudeTest : public ::testing::TestWithParam<bool> {};

TEST_P(AttitudeTest, KeepsUnitNorm) {
    Eigen::Quaterniond q = Eigen::Quaterniond::Identity();
    const Eigen::Vector3d w(0.3, -0.4, 0.0);  // |w| = 0.5 rad/s
    for (int k = 0; k < 10000; ++k) q = euler_step(q, w, 0.01, GetParam());
    // Renormalizing leaves only rounding error, a few times 1e-16.
    // 1e-12 is far above that and far below any real drift.
    EXPECT_NEAR(q.norm(), 1.0, 1e-12);
}

INSTANTIATE_TEST_SUITE_P(Renormalize, AttitudeTest, ::testing::Bool(),
    [](const auto& info) { return info.param ? "On" : "Off"; });
```

That is 10,000 steps of $0.01\,\mathrm{s}$: 100 seconds of a slow tumble at $0.5\,\mathrm{rad/s}$. The output:

```text
[ RUN      ] Renormalize/AttitudeTest.KeepsUnitNorm/Off
quat_test.cpp:23: Failure
The difference between q.norm() and 1.0 is 0.031743306743336586, which exceeds 1e-12, where
q.norm() evaluates to 1.0317433067433366,
[  FAILED  ] Renormalize/AttitudeTest.KeepsUnitNorm/Off, where GetParam() = false (6 ms)
[ RUN      ] Renormalize/AttitudeTest.KeepsUnitNorm/On
[       OK ] Renormalize/AttitudeTest.KeepsUnitNorm/On (9 ms)
```

Without renormalizing, the "attitude" grew to about 3.2% too long in under two minutes.

**Sanity check.** Can we predict that number? Each Euler step is [[at right angles to q|euler-growth]], so each step multiplies the length by $\sqrt{1 + (\lvert\omega\rvert\Delta t/2)^2}$. Here $\lvert\omega\rvert\Delta t/2 = 0.5 \times 0.01/2 = 0.0025$, and its square is $6.25\times10^{-6}$. Over 10,000 steps the square roots multiply up to $(1 + 6.25\times10^{-6})^{5000} \approx 1.0317$ — the failure message, to the last digit shown here.
:::

An invariant is **necessary, not sufficient**. Rotate at the wrong speed and the norm is still one. The norm test catches a whole family of bugs cheaply, but it cannot say the attitude is *right*; convergence and golden data do that.

The energy invariant works the same way, with one new step: deciding how much drift is allowed. Fourth-order Runge-Kutta (RK4, from lesson 03) does not conserve energy exactly, so the tolerance must come from how much energy RK4 is known to lose, not from trying numbers until the test goes green. For a satellite in a circular orbit at 400 km, with 555 steps per orbit (about 10 s each):

```cpp
    const State end = rk4_integrate(two_body, 0.0, period, s, 555);
    const double rel = std::abs((energy(end) - e0) / e0);
    std::printf("relative energy change %.2e\n", rel);
    // RK4 on an oscillation loses about 2*pi*theta^5/72 of its energy per
    // cycle, theta = 2*pi/555: 1.6e-11. An orbit is not a pure oscillator,
    // so allow ten times that.
    EXPECT_LT(rel, 2e-10);
```

It printed `relative energy change 3.25e-11` and passed. The measured drift is about twice the simple estimate and well inside the allowance. The comment records where $2\times10^{-10}$ came from, so the next reader can check the reasoning.

::: note Why RK4 loses that much energy
Apply RK4 to the simplest oscillation, $\dot{y} = i\omega y$, whose exact solution goes round a circle and keeps $\lvert y \rvert$ fixed. One RK4 step multiplies $y$ by the first five terms of the exponential series, with $\theta = \omega h$:

$$
R = 1 + i\theta - \frac{\theta^2}{2} - \frac{i\theta^3}{6} + \frac{\theta^4}{24}
$$

Its real part is $1 - \theta^2/2 + \theta^4/24$ and its imaginary part is $\theta - \theta^3/6$. Square both and add; every term up to $\theta^4$ cancels, leaving

$$
\lvert R \rvert^2 = 1 - \frac{\theta^6}{72} + \frac{\theta^8}{576}
$$

Energy goes as $\lvert y \rvert^2$, so each step loses about $\theta^6/72$ of it. One full cycle takes $N = 2\pi/\theta$ steps, so the loss per cycle is about $N\theta^6/72 = 2\pi\theta^5/72$. With $\theta = 2\pi/555 \approx 0.01132$, that is $1.6\times10^{-11}$. Notice the fifth power: halve the step and the energy error per orbit should drop about 32 times. Running the orbit at 1,110 steps gave $1.01\times10^{-12}$, down from $3.25\times10^{-11}$, a factor of about 32.
:::

::: example A covariance bug no crash would reveal
A position-velocity filter predicts forward and then updates with a position measurement of variance $25\,\mathrm{m^2}$ (a 5 m standard deviation). The textbook update is $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$. Suppose someone multiplies in the wrong order, $\mathbf{P}(\mathbf{I} - \mathbf{K}\mathbf{H})$ — an easy slip, since matrix products do not commute. The test checks both invariants after 50 cycles:

```cpp
#include <Eigen/Dense>
#include <gtest/gtest.h>

using Mat2 = Eigen::Matrix2d;
using Row2 = Eigen::RowVector2d;

// Measurement update of a position-velocity filter that measures
// position with variance r (m^2). Returns the new covariance.
Mat2 update(const Mat2& P, double r, bool buggy) {
    const Row2 H(1.0, 0.0);
    const double S = (H * P * H.transpose())(0, 0) + r;
    const Eigen::Vector2d K = P * H.transpose() / S;
    const Mat2 I_KH = Mat2::Identity() - K * H;
    return buggy ? Mat2(P * I_KH) : Mat2(I_KH * P);
}

// Time update: constant-velocity model, step dt, process noise q.
Mat2 predict(const Mat2& P, double dt, double q) {
    Mat2 F;
    F << 1.0, dt,
         0.0, 1.0;
    Mat2 Q;
    Q << q * dt * dt * dt / 3.0, q * dt * dt / 2.0,
         q * dt * dt / 2.0,       q * dt;
    return F * P * F.transpose() + Q;
}

class CovarianceTest : public ::testing::TestWithParam<bool> {};

TEST_P(CovarianceTest, StaysSymmetricAndPositive) {
    Mat2 P;
    P << 100.0, 0.0,
         0.0,   4.0;  // 10 m and 2 m/s standard deviations
    for (int k = 0; k < 50; ++k) {
        P = update(predict(P, 0.1, 0.5), 25.0, GetParam());
    }
    const double asym = (P - P.transpose()).cwiseAbs().maxCoeff();
    EXPECT_LE(asym, 1e-12 * P.norm()) << "P =\n" << P;
    Eigen::SelfAdjointEigenSolver<Mat2> eig(P);
    EXPECT_GT(eig.eigenvalues().minCoeff(), 0.0);
}

INSTANTIATE_TEST_SUITE_P(Update, CovarianceTest, ::testing::Bool(),
    [](const auto& info) { return info.param ? "Buggy" : "Correct"; });
```

The correct update passes. The buggy one:

```text
[ RUN      ] Update/CovarianceTest.StaysSymmetricAndPositive/Buggy
cov_test.cpp:38: Failure
Expected: (asym) <= (1e-12 * P.norm()), actual: 25.324696282607849 vs 2.7337048827424539e-11
P =
3.8917286163829803 26.249999999999993
0.9253037173921419 6.4999999999999911
```

The two off-diagonal entries, which must be equal, are 26.25 and 0.925. No crash, no NaN — the filter would run happily and be quietly wrong.

**Sanity check.** The correct filter settled at position and velocity variances of about $2.36\,\mathrm{m^2}$ and $1.05\,\mathrm{m^2/s^2}$, standard deviations of about $1.54\,\mathrm{m}$ and $1.03\,\mathrm{m/s}$. After 50 position fixes of 5 m accuracy, a position uncertainty well under 5 m is what you would expect.
:::

::: warning
Check symmetry *before* trusting an eigenvalue test. Eigen's `SelfAdjointEigenSolver` assumes the matrix is symmetric and reads only its lower triangle. On the buggy $\mathbf{P}$ above it reported two positive eigenvalues, about 3.60 and 6.79, so the positivity check passed. Only the symmetry check caught the bug. Order your assertions so a broken assumption fails first.
:::

## Convergence: the error must shrink at the right rate

Think of drawing a circle with straight ruler strokes: the shorter the strokes, the closer to a true circle. A good numerical method behaves the same way, and the error shrinks by a predictable amount.

For a method of **order** $p$ with step $h$, the global error behaves like $E(h) \approx C h^p$, for some constant $C$. Halve the step and

$$
\frac{E(h)}{E(h/2)} \approx \frac{C h^p}{C (h/2)^p} = 2^p
$$

For RK4, $p = 4$ and $2^4 = 16$: halving the step divides the error by about 16. Turned around, the **observed order** from two runs is

$$
p_{\text{obs}} = \log_2 \frac{E(h)}{E(h/2)}
$$

(read "log base two", the power you must raise 2 to; see [[the note on logarithms|log-two]]). If the code really is fourth order, $p_{\text{obs}}$ comes out near 4. The constant $C$ depends on the problem; the *ratio* does not, which is what makes it such a sharp test.

Here is the real behavior of our RK4 on $\ddot{x} = -x$ (a spring), from $x = 1$ at rest, integrated to $t = 10\,\mathrm{s}$ and compared with the exact $x = \cos t$, $v = -\sin t$. The error is the length of the difference between the computed and exact $(x, v)$:

| Steps | $h$ (s) | Error | Ratio to previous | $p_{\text{obs}}$ |
| --- | --- | --- | --- | --- |
| 10 | 1 | $8.03\times10^{-2}$ | 9.65 | 3.27 |
| 20 | 0.5 | $5.19\times10^{-3}$ | 15.47 | 3.95 |
| 80 | 0.125 | $2.03\times10^{-5}$ | 15.99 | 4.00 |
| 160 | 0.0625 | $1.27\times10^{-6}$ | 16.00 | 4.00 |
| 2560 | 0.0039 | $1.94\times10^{-11}$ | 16.00 | 4.00 |
| 20480 | 0.00049 | $4.66\times10^{-15}$ | 15.95 | 4.00 |
| 40960 | 0.00024 | $6.06\times10^{-15}$ | 0.77 | $-0.38$ |

(Some rows between are left out; each ratio is to the run with twice the step.) Three regions show up:

- **Too coarse.** At $h = 1\,\mathrm{s}$ the step is not small next to the motion, whose period is about $6.3\,\mathrm{s}$. The $h^4$ term does not dominate yet, and the ratio is off.
- **The asymptotic range.** From about $h = 0.25\,\mathrm{s}$ down to $0.0005\,\mathrm{s}$, the ratio sits at 16 as the theory says.
- **The [[rounding floor|round-off-floor]].** Near $10^{-14}$ the error is no longer the method's; it is rounding in the thousands of additions. Smaller steps stop helping, and the ratio becomes noise.

A convergence test picks two step sizes safely inside the middle region. The integrator under test is a small header, generic over the state type so the same code steps a 2-element spring and a 6-element orbit:

```cpp
// rk4.hpp
#pragma once

// One classic fourth-order Runge-Kutta step for y' = f(t, y).
template <class State, class F>
State rk4_step(F&& f, double t, const State& y, double h) {
    const State k1 = f(t, y);
    const State k2 = f(t + h / 2, State(y + (h / 2) * k1));
    const State k3 = f(t + h / 2, State(y + (h / 2) * k2));
    const State k4 = f(t + h, State(y + h * k3));
    return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

// Take n equal steps from t0 to t1.
template <class State, class F>
State rk4_integrate(F&& f, double t0, double t1, State y, int n) {
    const double h = (t1 - t0) / n;
    for (int i = 0; i < n; ++i) y = rk4_step(f, t0 + i * h, y, h);
    return y;
}
```

::: example A one-character bug that passes a loose accuracy test
```cpp
#include <Eigen/Dense>
#include <gtest/gtest.h>

#include <cmath>

#include "rk4.hpp"

using V2 = Eigen::Vector2d;

// Error at t = 10 s for x'' = -x, x(0) = 1, v(0) = 0, using n steps.
double oscillator_error(int n) {
    auto f = [](double, const V2& y) { return V2(y(1), -y(0)); };
    const V2 y = rk4_integrate(f, 0.0, 10.0, V2(1.0, 0.0), n);
    const V2 exact(std::cos(10.0), -std::sin(10.0));
    return (y - exact).norm();
}

TEST(Rk4Convergence, HalvingTheStepCutsTheErrorSixteenfold) {
    // h = 0.125 s and 0.0625 s: well inside the range where the
    // h^4 term dominates, well above the rounding floor near 1e-14.
    const double e_h = oscillator_error(80);
    const double e_half = oscillator_error(160);
    const double observed_order = std::log2(e_h / e_half);
    EXPECT_NEAR(observed_order, 4.0, 0.2)
        << "errors " << e_h << " and " << e_half;
}
```

With the correct `rk4.hpp` the test passes: the errors are $2.03\times10^{-5}$ and $1.27\times10^{-6}$, a ratio of $15.99$. Now make the kind of slip that survives code review — the third stage uses `k1` where it should use `k2`:

```cpp
    const State k3 = f(t + h / 2, State(y + (h / 2) * k1));  // should be k2
```

The test fails:

```text
The difference between observed_order and 4.0 is 1.9990798372812839, which exceeds 0.2, where
observed_order evaluates to 2.0009201627187161,
errors 0.013031066008494028 and 0.003255689334441576
```

The broken method is **second order**: halving the step cut the error only by $0.01303/0.003256 \approx 4.0 = 2^2$. Its error at $h = 0.125\,\mathrm{s}$ is $0.013$ — small enough to pass a test whose tolerance was set to 0.05 by "trying numbers until green". The convergence test does not care what the tolerance was; it checks the *law*.

**Sanity check.** Why is a tolerance of $\pm 0.2$ on the order sensible? In the asymptotic range the table shows $p_{\text{obs}}$ within $0.01$ of 4, so 0.2 leaves plenty of room for another problem or compiler, while the nearest wrong answers, orders 3 and 2, are far outside it.
:::

::: key
Convergence-order test: run at $h$ and $h/2$ inside the asymptotic range, compute $p_{\text{obs}} = \log_2(E(h)/E(h/2))$, and assert it is near the method's order. For RK4 the error ratio is about $2^4 = 16$. The global error scales as $h^4$, so the tolerance in `EXPECT_NEAR` for a fourth-order scheme at step $h$ is set a small factor above that bound, with the reasoning in a comment.
:::

::: warning
Measure the error of the whole state, not one component. The first version of the table above used only $x$. At $h = 0.25\,\mathrm{s}$ its ratio came out $6.92$, not 16. The error in $x$ alone happened to pass close to zero there, because the phase error and amplitude error of the oscillation can partly cancel in one component. The length of the full $(x, v)$ error has no such accidents.
:::

## Golden data: a trusted answer on file

Some problems have no exact solution to compare against. Add the Earth's equatorial bulge, the **[[J2 term|j2]]**, to an orbit, and there is no formula for where the satellite is after 90 minutes. For those you keep **golden data**: reference outputs, computed once by an independent, more accurate method, stored in the repository, and compared on every test run.

The word that matters is *independent*. Our reference comes from a Python script that uses a different language, a different integrator ([[DOP853|dop853]], an eighth-order method from SciPy) and tolerances far tighter than the C++ test needs:

```python
"""Regenerate tests/golden/leo_j2.csv.

Independent of the C++ code under test: different language, different
integrator (DOP853), tolerances far tighter than the test's.
Run by hand, review the diff, and say why in the commit message.
"""
import numpy as np
import scipy
from scipy.integrate import solve_ivp

MU = 3.986004418e14    # m^3/s^2
RE = 6378137.0         # m
J2 = 1.08262668e-3

def rhs(t, s):
    r = s[:3]
    rn = np.linalg.norm(r)
    k = 1.5 * J2 * MU * RE**2 / rn**5
    zz = 5.0 * r[2]**2 / rn**2
    a = -MU * r / rn**3 - k * r * np.array([1.0 - zz, 1.0 - zz, 3.0 - zz])
    return np.concatenate([s[3:], a])

r0 = RE + 400e3
v0 = np.sqrt(MU / r0)
inc = np.radians(51.6)
s0 = [r0, 0.0, 0.0, 0.0, v0 * np.cos(inc), v0 * np.sin(inc)]
times = np.arange(0.0, 5400.0 + 1.0, 600.0)
sol = solve_ivp(rhs, (0.0, 5400.0), s0, method="DOP853",
                rtol=1e-13, atol=1e-8, t_eval=times)
assert sol.success

with open("tests/golden/leo_j2.csv", "w") as f:
    f.write("# LEO orbit with J2, 400 km circular start, 51.6 deg inclination\n")
    f.write("# generator: tools/make_golden_leo_j2.py\n")
    f.write(f"# method: scipy {scipy.__version__} DOP853, rtol 1e-13, atol 1e-8\n")
    f.write("# columns: t [s], x, y, z [m], vx, vy, vz [m/s]\n")
    for k, t in enumerate(sol.t):
        row = [t] + list(sol.y[:, k])
        f.write(",".join(f"{v:.17g}" for v in row) + "\n")
```

The file it writes starts with its own history — what it is, what made it, and how:

```text
# LEO orbit with J2, 400 km circular start, 51.6 deg inclination
# generator: tools/make_golden_leo_j2.py
# method: scipy 1.17.1 DOP853, rtol 1e-13, atol 1e-8
# columns: t [s], x, y, z [m], vx, vy, vz [m/s]
0,6778137,0,0,0,4763.3078885891819,6009.7988691890896
```

How good is the reference? Re-running with two other SciPy methods (RK45 and Radau) at tight tolerances, the positions agreed with it to within 0.06 mm at every row. That is the reference's own error bar, and it matters for the tolerance below.

::: example A golden-data test, and the typo it catches
The C++ side is a fixture that loads the file once per test and a test that propagates between rows with RK4 at $h = 5\,\mathrm{s}$. `j2.hpp` holds the C++ `two_body_j2`, the same physics written independently in Eigen.

```cpp
#include <gtest/gtest.h>

#include <fstream>
#include <sstream>
#include <string>
#include <vector>

#include "j2.hpp"
#include "rk4.hpp"

struct GoldenRow {
    double t;
    State s;
};

// Reads "t,x,y,z,vx,vy,vz" rows; lines starting with # are comments.
std::vector<GoldenRow> read_golden(const std::string& path) {
    std::vector<GoldenRow> rows;
    std::ifstream in(path);
    std::string line;
    while (std::getline(in, line)) {
        if (line.empty() || line[0] == '#') continue;
        std::stringstream ss(line);
        std::string cell;
        std::vector<double> v;
        while (std::getline(ss, cell, ',')) v.push_back(std::stod(cell));
        GoldenRow row{v.at(0), State::Zero()};
        for (int i = 0; i < 6; ++i) row.s(i) = v.at(i + 1);
        rows.push_back(row);
    }
    return rows;
}

class LeoJ2Golden : public ::testing::Test {
protected:
    void SetUp() override {
        rows_ = read_golden(std::string(GOLDEN_DIR) + "/leo_j2.csv");
        ASSERT_EQ(rows_.size(), 10u) << "golden file missing or truncated";
    }
    std::vector<GoldenRow> rows_;
};

TEST_F(LeoJ2Golden, Rk4MatchesReferenceTrajectory) {
    // RK4 error scales as h^4. The same run at h = 10 s is off by
    // 17 mm, so at h = 5 s expect about 17/16 = 1.1 mm. The reference
    // is good to 0.1 mm. Tolerance: 5 mm, about 4x the expected error.
    const double tol_m = 5e-3;
    State s = rows_[0].s;
    for (std::size_t k = 1; k < rows_.size(); ++k) {
        const double dt = rows_[k].t - rows_[k - 1].t;
        s = rk4_integrate(two_body_j2, rows_[k - 1].t, rows_[k].t, s,
                          static_cast<int>(dt / 5.0));
        const double miss = (s.head<3>() - rows_[k].s.head<3>()).norm();
        EXPECT_LT(miss, tol_m) << "at t = " << rows_[k].t << " s";
    }
}
```

Notice the pieces from earlier lessons. `ASSERT_EQ` in `SetUp` stops the test if the file is missing, because every line after it would index rows that do not exist. The tolerance has a comment deriving it from the method's order. It passes; the largest miss over the 90 minutes is 1.06 mm.

Now the bug. Someone retypes the J2 constant in `j2.hpp` and swaps two digits: `1.08626680e-3` instead of `1.08262668e-3`, a change of about a third of a percent. Every invariant in this lesson still holds, and the convergence order is still 4, because the typo changes the *problem*, not the method. The golden test:

```text
golden_test.cpp:54: Failure
Expected: (miss) < (tol_m), actual: 7.2413061925730728 vs 0.005
at t = 600 s
...
golden_test.cpp:54: Failure
Expected: (miss) < (tol_m), actual: 243.3240915174473 vs 0.005
at t = 5400 s
```

After 90 minutes the satellite is 243 m from where it should be — enough to spoil a rendezvous, too small to see on a plot of the orbit.

**Sanity check.** The tolerance reasoning predicted about 1.1 mm at $h = 5\,\mathrm{s}$, and the measured worst case was 1.06 mm. Halving again to $h = 2.5\,\mathrm{s}$ gave 0.067 mm, a ratio of $1.0637/0.066694 \approx 15.9$ — RK4's 16 again, even on this harder problem.
:::

The CMake side has two jobs: tell the test where the file is, and give regeneration a name of its own.

```cmake
# tests/CMakeLists.txt
add_executable(numerics_tests golden_test.cpp)
target_link_libraries(numerics_tests PRIVATE numerics GTest::gtest_main)
target_compile_definitions(numerics_tests PRIVATE
  GOLDEN_DIR="${CMAKE_CURRENT_SOURCE_DIR}/golden")
gtest_discover_tests(numerics_tests PROPERTIES LABELS numerics)

# top-level CMakeLists.txt: never part of the build or of ctest
find_package(Python3 COMPONENTS Interpreter)
add_custom_target(regenerate_golden
  COMMAND Python3::Interpreter tools/make_golden_leo_j2.py
  WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
  COMMENT "Regenerating golden data: review the diff before committing")
```

`GOLDEN_DIR` is baked in as an absolute path to the source folder, so the test finds the file wherever `ctest` runs. The `numerics` label lets CI run `ctest -L numerics` on its own. And `add_custom_target` without `ALL` builds only when someone asks by name: `cmake --build build --target regenerate_golden`.

### Regenerating golden data honestly

Golden files have one great danger. When a golden test fails, the quickest way to make it pass is to regenerate the file. Do that without thinking and the test can never fail again — it only records whatever the code does today.

These rules keep the data honest:

1. **Explain the failure first.** A golden test failing means the output changed. Before touching the file, find out *why*. If you cannot say, you have found a bug, not a stale file.
2. **Regenerate from an independent source**, never from the code under test. Rerun the C++ at a tiny step and save its output, and the test compares the code with itself; the J2 typo would have been recorded as truth.
3. **Regenerate deliberately.** A named target, run by a person, never by `ctest` or CI. Our target runs, and `git diff --stat tests/golden/` then printed nothing: the script reproduces the file byte for byte. That is what you want to see when nothing should have changed.
4. **Review the diff and say why in the commit**, with the numbers: "J2 value updated to match the new gravity model; positions move by up to X m at 90 minutes, consistent with a change of Y in J2." A reviewer can check that sentence.
5. **Keep the provenance in the file**: generator, method, versions, as in our header.

A file recorded from your own code is still useful, but as a different tool, a [[characterization test|characterization]]: it proves a refactor changed nothing. Label it as such, so no one mistakes it for a check of correctness.

## The module, in one kernel

Each kind of test catches a different kind of bug, and this lesson met one of each:

| Bug | Caught by | Missed by |
| --- | --- | --- |
| Missing renormalization | norm invariant | a single-step accuracy test |
| Wrong multiplication order in the update | symmetry invariant | "does not crash", eigenvalue check alone |
| `k1` for `k2` in RK4 | convergence order | a loose tolerance tuned until green |
| J2 digits swapped | golden data | invariants and convergence |

All of it runs through the machinery of the earlier lessons. Fixtures load golden files. Parameterised tests sweep step sizes and cases with readable names. `EXPECT_NEAR` tolerances are derived and commented. `gtest_discover_tests` registers every case with a label, and the matrix of lesson 10 runs the whole suite under ASan, UBSan and TSan and measures coverage. A numerical kernel tested this way is one you can trust.

## Check yourself

::: check
A teammate's attitude filter test asserts only that `q.norm()` stays within `1e-12` of 1 after an hour of simulated flight, and it passes. They say the propagator is verified. What does that test prove, and what could still be wrong?
:::

::: answer
It proves the norm invariant holds: the propagator returns something that is a valid rotation, so bugs like missing renormalization or a step formula that inflates the quaternion are ruled out. It proves nothing about *which* rotation. If the propagator renormalizes each step, a wrong rate (a gyro scale factor applied twice, a sign flipped on one axis, the rate multiplied in the wrong order) still produces a unit quaternion — pointing the wrong way. The invariant is necessary, not sufficient. Add a convergence test against a case with a known exact answer, such as a constant rate about one axis, or golden data.
:::

::: check
A convergence study of a new integrator gives errors $3.2\times10^{-4}$ at $h = 0.1\,\mathrm{s}$ and $4.0\times10^{-5}$ at $h = 0.05\,\mathrm{s}$. What order is it? What would you expect at $h = 0.025\,\mathrm{s}$?
:::

::: answer
The ratio is $3.2\times10^{-4} / 4.0\times10^{-5} = 8$. Since $8 = 2^3$, the observed order is $p_{\text{obs}} = \log_2 8 = 3$: a third-order method. Halving the step again should divide the error by 8 again: about $4.0\times10^{-5}/8 = 5.0\times10^{-6}$ at $h = 0.025\,\mathrm{s}$, as long as that step is still inside the asymptotic range and well above the rounding floor. If the method was *meant* to be RK4, the study has found a bug.
:::

::: check
You extend the RK4 convergence table down to $h = 10^{-5}\,\mathrm{s}$, and the error there is *larger* than at $h = 10^{-3}\,\mathrm{s}$. Is the integrator broken?
:::

::: answer
No. That is the rounding floor. A double carries about 16 significant digits, and each step's additions round off a little. With a tiny step the method's own error, $C h^4$, has fallen below the rounding error, and more steps mean more roundings, so the total error stops falling and can grow. In the lesson's table the floor was near $10^{-14}$ to $10^{-15}$. Convergence tests should use step sizes where the error is far above that, such as $h = 0.125$ and $0.0625\,\mathrm{s}$ there.
:::

::: check
After a teammate updates Eigen, the golden test fails: every miss is about 30 mm, against the 5 mm tolerance. The teammate proposes regenerating the golden file. What do you do?
:::

::: answer
Do not regenerate. The golden file comes from an independent Python script that did not change, so the reference is not stale — and regenerating would not even change the file, since it does not depend on the C++ code. The C++ answer has moved by about 30 mm, about 30 times the expected RK4 error of 1 mm. A library update changes rounding in the 16th significant digit, which over this orbit is far below a millimeter, so rounding cannot explain it. This is a real finding: a behavior change in the new version, or code of ours that relied on something it should not have. Find the cause — run the convergence test, compare one step under the old and new versions — before changing anything.
:::

::: check
Why does the golden test's `SetUp` use `ASSERT_EQ` on the number of rows rather than `EXPECT_EQ`?
:::

::: answer
If the file is missing, `rows_` is empty. With `EXPECT_EQ` the failure would be recorded and the test body would still run, reading `rows_[0]` from an empty vector — undefined behavior, which could crash or print misleading numbers. (A cut-short file would be compared over fewer rows and could pass while checking almost nothing.) A fatal failure in `SetUp` means the test body never runs, so `ASSERT_EQ` stops everything right there, with the clear message "golden file missing or truncated". This is the case lesson 02 described: use a fatal assertion when continuing would be meaningless or unsafe.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Invariant | a property the true answer always has: $\lVert q \rVert = 1$, conserved energy, $\mathbf{P} = \mathbf{P}^\mathsf{T}$ with positive eigenvalues |
| Necessary, not sufficient | an invariant rules out a family of bugs; it cannot prove the answer right |
| Energy tolerance | derived from the method: RK4 loses about $2\pi\theta^5/72$ per cycle, $\theta = \omega h$ |
| Symmetry before eigenvalues | the self-adjoint solver reads one triangle only |
| Convergence order | $p_{\text{obs}} = \log_2(E(h)/E(h/2))$; RK4 ratio about 16 inside the asymptotic range |
| Three regions | too coarse, asymptotic, rounding floor; test in the middle |
| Whole-state error | one component can cancel by accident |
| Golden data | reference outputs from an independent, more accurate source, with provenance in the file |
| Honest regeneration | explain the failure first, independent generator, named target, reviewed diff with a reason |
| Characterization file | recorded from your own code; proves "unchanged", not "correct" |

This lesson closes the module. You can now take a piece of flight software — a filter, a controller, an integrator, the logic behind a sensor interface — and build a suite that tests it without hardware, pins its numerical behavior to laws and trusted data, and runs on every change under sanitizers and coverage. Whatever C++ guidance, navigation or control code you write next, that habit is what lets you say it works.

::: context kernel The small code that does the heavy lifting
In computing, a kernel is a small routine that does the core arithmetic of a bigger job and runs over and over: one integration step, one matrix update, one filter cycle. (The word has other meanings, such as the core of an operating system; here it means the numerical kind.)

Kernels are worth special testing effort because everything else stands on them. A navigation filter might call its update kernel hundreds of times a second for an entire mission, so a tiny bias in it becomes a large error by the end.
:::

::: context quaternion Four numbers for one rotation
A quaternion is a four-number way to store an orientation: $q = (w, x, y, z)$. For a rotation by angle $\phi$ about a unit axis $\mathbf{n}$, $w = \cos(\phi/2)$ and $(x, y, z) = \sin(\phi/2)\,\mathbf{n}$, so $w^2 + x^2 + y^2 + z^2 = 1$ automatically.

Spacecraft use them because they have no gimbal-lock singularity, unlike three Euler angles, and combining two rotations is one multiplication. The catch is the constraint: only unit-length quaternions are rotations, and arithmetic slowly nudges them off it. That is why propagators renormalize, and why the norm makes such a good test.
:::

::: context covariance Uncertainty with a shape
A covariance matrix says how unsure a filter is, and in which directions. For a position-velocity filter, the diagonal holds the variances: the square of the position uncertainty and the square of the velocity uncertainty. The off-diagonal entry says how the two errors go together — whether "too far ahead" tends to come with "too fast".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="320" y2="90" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="20" x2="180" y2="160" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="316" y="108" font-size="11" text-anchor="end" fill="#6c7a93">position error</text>
  <text x="186" y="30" font-size="11" fill="#6c7a93">velocity error</text>
  <ellipse cx="180" cy="90" rx="110" ry="38" transform="rotate(-25 180 90)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <text x="64" y="160" font-size="11" fill="#1f2a44">tilt comes from the off-diagonal term</text>
</svg>
```

Draw every error the filter considers likely and you get an ellipse. A symmetric matrix with positive eigenvalues is exactly what describes a real ellipse; lose either property and the "shape of the uncertainty" stops making sense.
:::

::: context euler-growth Why the step always points outward
For a pure rate quaternion $\omega$ (zero first element), the product $q \otimes \omega$ is always at right angles to $q$, viewed as vectors in four dimensions. So the Euler step moves along the tangent of the unit sphere, never along its surface.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M60 170 A 130 130 0 0 1 190 40" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <text x="70" y="120" font-size="11" fill="#6c7a93">unit circle</text>
  <line x1="190" y1="170" x2="190" y2="40" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="190,40 185,50 195,50" fill="#1d6fd1"/>
  <text x="170" y="110" font-size="12" text-anchor="end" fill="#1d6fd1">q (length 1)</text>
  <line x1="190" y1="40" x2="290" y2="40" stroke="#b4232c" stroke-width="2"/>
  <polygon points="290,40 280,35 280,45" fill="#b4232c"/>
  <text x="240" y="30" font-size="11" text-anchor="middle" fill="#b4232c">step, at right angles</text>
  <line x1="190" y1="170" x2="290" y2="40" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="258" y="120" font-size="11" fill="#1f2a44">new q: longer than 1</text>
  <rect x="190" y="40" width="10" height="10" fill="none" stroke="#1f2a44" stroke-width="1"/>
</svg>
```

By Pythagoras the new length is $\sqrt{1 + s^2}$, where $s$ is the step's length, $\lvert\omega\rvert\Delta t/2$. The growth is tiny each step and never cancels, so it piles up.
:::

::: context log-two Undoing a power of two
A logarithm answers "what power?" $\log_2 16 = 4$ because $2^4 = 16$; $\log_2 8 = 3$ because $2^3 = 8$. So when halving the step divides the error by some ratio, $\log_2$ of that ratio is the power of $h$ the error follows.

The ratio will rarely be exactly 16, and the log turns "15.3 or 16.8?" into "3.94 or 4.07?", which is easier to judge against the order you expect. In C++ it is `std::log2`, from `<cmath>`.
:::

::: context round-off-floor Where smaller steps stop helping
Two kinds of error compete. The method's truncation error falls as $h^4$. Rounding error grows with the number of steps, because each addition in a double loses a little past the 16th significant digit. On a log-log plot the total makes a V.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">step size h (log scale), smaller to the left</text>
  <text x="18" y="95" font-size="11" fill="#1f2a44" transform="rotate(-90 18 95)" text-anchor="middle">error (log)</text>
  <line x1="130" y1="150" x2="330" y2="25" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="258" y="95" font-size="11" fill="#1d6fd1">slope 4: method error</text>
  <path d="M60 128 L100 140 L130 150" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="62" y="118" font-size="11" fill="#b4232c">rounding</text>
  <rect x="165" y="30" width="110" height="18" fill="#ffffff" stroke="#6c7a93"/>
  <text x="220" y="43" font-size="11" text-anchor="middle" fill="#6c7a93">test here</text>
  <line x1="220" y1="48" x2="220" y2="85" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
</svg>
```

Test on the straight part of the blue line, where the slope, and so the order, can be read cleanly.
:::

::: context j2 The Earth is not a perfect ball
The Earth spins, so it bulges at the equator: its equatorial radius is about 21 km more than its polar radius. Gravity models describe this with coefficients, and the biggest, $J_2 \approx 1.0826\times10^{-3}$, captures most of the bulge.

For low orbits J2 is the largest effect after the main pull of gravity. It swings an inclined orbit's plane slowly around the Earth; for the International Space Station, at about 51.6 degrees inclination, the plane turns by roughly 5 degrees a day. Mission planners use the same effect deliberately to keep sun-synchronous orbits lined up with the Sun.
:::

::: context dop853 An integrator from the same family
DOP853 is a Runge-Kutta method of order 8, from the family developed by Dormand and Prince, with built-in error estimates that choose the step size automatically to meet the tolerances you give. SciPy's `solve_ivp` offers it as `method="DOP853"`.

That makes it a good reference for our RK4: different order, different step control, different code base and language. If the two agree to a millimeter, it is very unlikely they share the same mistake. That agreement between independent methods is what makes the file "golden".
:::

::: context characterization Recording what the code does now
Michael Feathers, in *Working Effectively with Legacy Code*, calls a test that records the current behavior of code a **characterization test**. You write it before changing old code you do not fully understand, so that any change in behavior shows up, whether it is right or wrong.

It is a valuable safety net for refactoring. It is not evidence the behavior was ever correct, because the "expected" values came from the code itself. Keep the two kinds of reference file clearly apart, by name or by a line in the header.
:::
