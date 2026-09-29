---
id: l04-parameterised-tests
title: Parameterized tests — one test, many cases
minutes: 24
covers:
  - TEST_P parameterized tests and value generators
---

Imagine you are checking a new calculator. You write ten sums on a card and type them in one after another. The third answer is wrong. If you stop right there and send the calculator back, you learn one thing: sum number three failed. You do not learn whether sums four to ten were fine, or whether they were all wrong in the same way. That second question is often the one that tells you *what* is broken.

Flight software has the same problem at a bigger size. A function that turns altitude and speed into air pressure on the nose has to work across the whole **[[flight envelope|flight-envelope]]** — the range of altitudes and speeds the vehicle will ever fly. A heading function has to work for headings that are positive, negative, and many turns around. You do not want one test per number, written out by hand. You want one test, and a **table** of cases it runs on.

This lesson teaches the GoogleTest tool for that: the **parameterized test**, written with `TEST_P` — a test whose body is written once and run once for every value in a list. You will see why it beats a loop inside a single test, how to give every case a name a human can read, and the **value generators** — `Values`, `ValuesIn`, `Range`, `Bool` and `Combine` — that build the list for you. The last example brings back the tolerance reasoning from the floating-point lesson, so each case in the table carries its own honest tolerance.

## A table in a loop hides failures

Start with the obvious way. Here is a function that should **[[wrap|heading-wrap]]** a heading — fold any angle in degrees into the range from $0$ up to (but not including) $360$. A heading of $370°$ and a heading of $10°$ point the same way, and $-90°$ is the same as $270°$. The function has a bug, and we will let the tests find it.

The first try puts a **[[table-driven|table-driven]]** list of cases inside one ordinary `TEST` and walks through it with a loop:

```cpp
#include <gtest/gtest.h>
#include <cmath>

// Wrap a heading in degrees into [0, 360). Has a bug.
double wrap_deg(double deg) {
    return std::fmod(deg, 360.0);
}

TEST(WrapDeg, TableInALoop) {
    struct Row { double in; double want; };
    const Row rows[] = {
        {10.0, 10.0}, {370.0, 10.0}, {-90.0, 270.0}, {720.0, 0.0}, {-450.0, 270.0},
    };
    for (const Row& r : rows) {
        ASSERT_DOUBLE_EQ(wrap_deg(r.in), r.want);
    }
}
```

`std::fmod(a, b)` (read "f-mod") is the remainder after dividing $a$ by $b$. The catch is that its answer keeps the sign of $a$. So $\mathrm{fmod}(-90, 360) = -90$, not $270$. Running the test:

```text
[ RUN      ] WrapDeg.TableInALoop
loop.cpp:15: Failure
Expected equality of these values:
  wrap_deg(r.in)
    Which is: -90
  r.want
    Which is: 270

[  FAILED  ] WrapDeg.TableInALoop (0 ms)
...
[  PASSED  ] 0 tests.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] WrapDeg.TableInALoop
```

Look at what this report does *not* tell you.

- It does not say which row failed. You see the values $-90$ and $270$, and you have to hunt through the table to find the row that makes them.
- It stopped. `ASSERT_DOUBLE_EQ` is fatal, so the test function returned at row three. Row five, $-450°$, is *also* wrong — it gives $-90$ too — and you never heard about it. The pattern "every negative input fails" is invisible.
- The whole table counts as one test. You cannot rerun only the failing row, and you cannot mark one row as slow or skip it.

Switching to `EXPECT_DOUBLE_EQ` keeps the loop going, so both failures print. But it is still one test with one name, the messages still do not say which row they came from unless you add `<<` messages by hand, and you still cannot pick out a single row to rerun. The loop is fighting the test framework instead of using it.

## TEST_P: every row becomes its own test

A parameterized test has three parts. Read them in this order.

1. **A fixture class that names the parameter type.** You derive from `::testing::TestWithParam<T>`, where `T` is the type of one row. It is an ordinary fixture from lesson 01, so it may also have members and `SetUp`.
2. **The test body, written with `TEST_P`** (read "test P", for parameterized). Inside, `GetParam()` hands you the current row.
3. **An instantiation**, `INSTANTIATE_TEST_SUITE_P`, which says which rows to run. It takes a **prefix** (a label for this batch of rows), the fixture's name, a generator that produces the rows, and, optionally, a function that gives each row a name.

Here is the heading test rebuilt that way. The row type gets a `name` field, and a small `operator<<` so GoogleTest can print a row:

```cpp
#include <gtest/gtest.h>
#include <cmath>
#include <ostream>
#include <string>

// Wrap a heading in degrees into [0, 360). Still has the bug.
double wrap_deg(double deg) {
    return std::fmod(deg, 360.0);
}

struct WrapCase {
    const char* name;
    double in;
    double want;
};

// Lets GoogleTest print a WrapCase in failure messages.
std::ostream& operator<<(std::ostream& os, const WrapCase& c) {
    return os << c.name << " (in=" << c.in << ", want=" << c.want << ")";
}

class WrapDegTest : public ::testing::TestWithParam<WrapCase> {};

TEST_P(WrapDegTest, LandsInZeroTo360) {
    const WrapCase& c = GetParam();
    EXPECT_DOUBLE_EQ(wrap_deg(c.in), c.want);
}

INSTANTIATE_TEST_SUITE_P(
    Headings, WrapDegTest,
    ::testing::Values(
        WrapCase{"small",         10.0,  10.0},
        WrapCase{"one_turn_over", 370.0, 10.0},
        WrapCase{"minus_90",      -90.0, 270.0},
        WrapCase{"two_turns",     720.0, 0.0},
        WrapCase{"minus_450",    -450.0, 270.0}),
    [](const ::testing::TestParamInfo<WrapCase>& info) {
        return std::string(info.param.name);
    });
```

::: example Reading the parameterized report
Build and run it exactly as before (`g++ -std=c++20 param.cpp -lgtest -lgtest_main -pthread`). The end of the output:

```text
[  PASSED  ] 3 tests.
[  FAILED  ] 2 tests, listed below:
[  FAILED  ] Headings/WrapDegTest.LandsInZeroTo360/minus_90, where GetParam() = minus_90 (in=-90, want=270)
[  FAILED  ] Headings/WrapDegTest.LandsInZeroTo360/minus_450, where GetParam() = minus_450 (in=-450, want=270)

 2 FAILED TESTS
```

Walk through what changed.

**Five tests, not one.** The runner counted three passes and two failures. Every row ran, even after a failure.

**Each name has four parts.** Take `Headings/WrapDegTest.LandsInZeroTo360/minus_90` apart at the punctuation: the prefix `Headings`, a slash, the fixture `WrapDegTest`, a dot, the test `LandsInZeroTo360`, a slash, and the row's own name `minus_90`.

**The failing rows share a pattern you can see at a glance.** Both failures are negative inputs, and both positive ones that went past $360$ passed. That points straight at the sign behavior of `fmod`. The fix is to add $360$ when the remainder comes out negative.

**You can rerun one row.** The flag `--gtest_filter` takes a name pattern, where `*` matches anything:

```text
$ ./param --gtest_filter='*minus_90'
...
[  FAILED  ] 1 test, listed below:
[  FAILED  ] Headings/WrapDegTest.LandsInZeroTo360/minus_90, where GetParam() = minus_90 (in=-90, want=270)
```

Sanity check: five rows in the table, five tests reported, and $3 + 2 = 5$. Nothing was silently skipped.
:::

::: key
Why parameterize a test rather than loop inside it? Each parameter becomes its own test case, so all cases run, the failing one is named, and you can filter or mark individual cases. A loop stops at the first failure and hides the rest.
:::

The fixture here is empty, `{}`. That is common. When the rows share some setup — a filter to build, a table to load — put it in the fixture's constructor or `SetUp` exactly as in lesson 01. Every row gets a fresh fixture, the same way every `TEST_F` does.

::: warning A TEST_P with no instantiation fails
If you write a `TEST_P` and forget the `INSTANTIATE_TEST_SUITE_P`, zero rows run. GoogleTest refuses to let that pass quietly. It adds a failing test called `GoogleTestVerification.UninstantiatedParameterizedTestSuite<WrapDegTest>` with the message "is defined via TEST_P, but never instantiated". If you see that name in a report, the fix is the missing instantiation, not the test body.
:::

### Names a human can read

The last argument of `INSTANTIATE_TEST_SUITE_P` is a **name generator**: any function, or a **[[lambda|lambda]]** (an unnamed function written inline, starting with `[]`), that takes a `::testing::TestParamInfo<T>` and returns a `std::string`. The info object has two fields you will use: `info.param`, the row itself, and `info.index`, its position in the list, counting from $0$.

Leave the name generator out and every row is named by its index: `LandsInZeroTo360/0`, `LandsInZeroTo360/1`, and so on. A failure then reads "row 2 failed", and you are back to counting through the table.

Names have strict rules. They may contain only letters, digits and underscores, and every name in one instantiation must be different. Breaking either rule stops the whole test program before any test runs:

```text
[ FATAL ] /usr/include/gtest/internal/gtest-param-util.h:585:: Condition IsValidParamName(param_name) failed. Parameterized test name '0.8' is invalid, in badname.cpp line 4
```

That one came from asking GoogleTest to name rows by printing a `double`, $0.8$, whose dot is not allowed. The **[[allowed characters|name-characters]]** are strict for a reason: the dot, the slash, `*`, `-` and `:` all mean something in a filter pattern. So write `M0p8` for "Mach 0.8" and `minus_90` for $-90$.

### Values a human can read

The name says *which* row. The printed value says *what was in it*. After a failure, GoogleTest prints `where GetParam() = ...` using `operator<<` if your type has one. Without one, it cannot know what your struct means, so it prints the raw bytes:

```text
[  FAILED  ] Headings/WrapDegTest.LandsInZeroTo360/2, where GetParam() = 24-byte object <CF-40 71-70 02-56 00-00 00-00 00-00 00-80 56-C0 00-00 00-00 00-E0 70-40> (0 ms)
```

That is the same failing row, with no name generator and no printer. The **[[byte dump|byte-dump]]** is correct, and useless to a person reading a CI log. Four lines of `operator<<` fix it. (A free function called `PrintTo(const T&, std::ostream*)` works too, and wins if you have both.)

::: warning Put the printer where GoogleTest can find it
`operator<<` for your row type must be declared in the same namespace as the type, so the compiler's lookup finds it. A printer tucked inside some other namespace is silently ignored, and you get the byte dump back.
:::

## Value generators

`Values` is one way to make the rows. GoogleTest has a small family of **generators**, each a function that produces a list of parameter values:

- `::testing::Values(a, b, c, ...)` — exactly the values you list.
- `::testing::ValuesIn(container)` — every element of a `std::vector`, a `std::array` or a plain C array. Handy when the table is long, or is built by a function.
- `::testing::Range(begin, end, step)` — `begin`, `begin + step`, and so on, stopping *before* `end`. The step defaults to $1$.
- `::testing::Bool()` — `false`, then `true`.
- `::testing::Combine(g1, g2, ...)` — every combination of the values from several generators. Each row is a `std::tuple`, a fixed-size bundle of values of possibly different types.

Here are the first four, each instantiated and listed with `--gtest_list_tests`, which prints every test name without running anything:

```cpp
#include <gtest/gtest.h>
#include <vector>

class StepCount : public ::testing::TestWithParam<int> {};
TEST_P(StepCount, IsNonNegative) { EXPECT_GE(GetParam(), 0); }
INSTANTIATE_TEST_SUITE_P(ByRange, StepCount, ::testing::Range(0, 10, 3));

const std::vector<int> kRates = {50, 100, 400};
INSTANTIATE_TEST_SUITE_P(FromVector, StepCount, ::testing::ValuesIn(kRates),
                         ::testing::PrintToStringParamName());

class Switch : public ::testing::TestWithParam<bool> {};
TEST_P(Switch, Runs) { SUCCEED(); }
INSTANTIATE_TEST_SUITE_P(Both, Switch, ::testing::Bool());

class Grid : public ::testing::TestWithParam<std::tuple<int, bool>> {};
TEST_P(Grid, Runs) {
    const auto [rate, armed] = GetParam();
    EXPECT_GT(rate, 0);
    (void)armed;
}
INSTANTIATE_TEST_SUITE_P(RateByArmed, Grid,
                         ::testing::Combine(::testing::Values(50, 100),
                                            ::testing::Bool()));
```

```text
ByRange/StepCount.
  IsNonNegative/0  # GetParam() = 0
  IsNonNegative/1  # GetParam() = 3
  IsNonNegative/2  # GetParam() = 6
  IsNonNegative/3  # GetParam() = 9
FromVector/StepCount.
  IsNonNegative/50  # GetParam() = 50
  IsNonNegative/100  # GetParam() = 100
  IsNonNegative/400  # GetParam() = 400
Both/Switch.
  Runs/0  # GetParam() = false
  Runs/1  # GetParam() = true
RateByArmed/Grid.
  Runs/0  # GetParam() = (50, false)
  Runs/1  # GetParam() = (50, true)
  Runs/2  # GetParam() = (100, false)
  Runs/3  # GetParam() = (100, true)
```

Four things to notice.

- `Range(0, 10, 3)` gave $0, 3, 6, 9$. It stopped at $9$ because the next value, $12$, is not less than $10$. The end is never included, the same as a `for (int i = 0; i < 10; i += 3)` loop.
- One fixture, `StepCount`, was instantiated twice, with two prefixes. That is allowed, and the prefix keeps the names apart.
- `::testing::PrintToStringParamName()` is a ready-made name generator: it names each row by printing it. It works for whole numbers like $50$. For a `double` like $0.8$ the dot breaks the name rule, as you saw.
- In `Combine`, the *last* generator changes fastest, like the last digit of a car's odometer. The four rows are $(50, \text{false})$, $(50, \text{true})$, $(100, \text{false})$, $(100, \text{true})$. Inside the test, `const auto [rate, armed] = GetParam();` — a **structured binding** — unpacks the tuple into two named variables.

::: key
Value generators: `Values(a, b, ...)` lists values; `ValuesIn(container)` takes them from a container; `Range(begin, end, step)` counts up and excludes `end`; `Bool()` gives false and true; `Combine(g1, g2, ...)` gives every combination as a `std::tuple`, which is the **[[Cartesian product|cartesian-product]]** of the lists. Rows are wired up by `INSTANTIATE_TEST_SUITE_P(Prefix, Fixture, generator, name_generator)`, and each test is named `Prefix/Fixture.Test/RowName`.
:::

::: warning Combine multiplies
`Combine` of lists with $3$ and $4$ values gives $3 \times 4 = 12$ tests. Five parameters with five values each give $5^5 = 3125$. Before you reach for `Combine`, ask whether every pair of values really needs testing together. Often a hand-picked `Values` table of the corners and a few middles covers the risk with a tenth of the tests. The count matters in CI, where every extra minute of testing is paid on every push.
:::

::: example A grid over the flight envelope
The **[[dynamic pressure|dynamic-pressure]]** $q$ (read "q", or "q-bar" when it has a bar on top) is the pressure the air builds up on a surface moving through it, in pascals:

$$
q = \tfrac{1}{2} \rho V^2
$$

where $\rho$ (read "rho") is the air density in $\mathrm{kg/m^3}$ and $V$ is the airspeed in $\mathrm{m/s}$. Aerodynamic loads grow with $q$, so a flight computer computes it every cycle.

The code under test gets there the long way. From altitude $h$ it finds temperature $T$ and pressure $p$ in the standard atmosphere, then density $\rho = p / (R T)$, then the **[[speed of sound|speed-of-sound]]** $a = \sqrt{\gamma R T}$ (read "gamma R T"), then $V = M a$ from the Mach number $M$. For an independent check, substitute those into the formula:

$$
q = \tfrac{1}{2} \cdot \frac{p}{R T} \cdot M^2 \gamma R T = \tfrac{1}{2} \gamma p M^2 .
$$

The $R T$ on the bottom cancels the $R T$ inside $a^2$. So the test can compare the long route against $\tfrac{1}{2}\gamma p M^2$. The two differ only by a handful of roundings, so a relative tolerance of $10^{-12}$ of the answer is generous.

```cpp
#include <gtest/gtest.h>
#include <cmath>
#include <string>
#include <tuple>

// International Standard Atmosphere, troposphere only (0 to 11 km).
constexpr double kGamma = 1.4;       // ratio of specific heats for air
constexpr double kR     = 287.05287; // gas constant for air, J/(kg K)
constexpr double kG0    = 9.80665;   // m/s^2
constexpr double kL     = 0.0065;    // temperature lapse rate, K/m

double isa_temperature(double h) { return 288.15 - kL * h; }
double isa_pressure(double h) {
    return 101325.0 * std::pow(isa_temperature(h) / 288.15, kG0 / (kL * kR));
}

// Code under test: dynamic pressure from altitude and Mach, the long way.
double dynamic_pressure(double h, double mach) {
    const double T   = isa_temperature(h);
    const double rho = isa_pressure(h) / (kR * T);   // density, kg/m^3
    const double v   = mach * std::sqrt(kGamma * kR * T);  // airspeed, m/s
    return 0.5 * rho * v * v;
}

using Condition = std::tuple<double, double>;  // (altitude m, Mach)

class DynamicPressureTest : public ::testing::TestWithParam<Condition> {};

TEST_P(DynamicPressureTest, MatchesGammaPMachSquared) {
    const auto [h, mach] = GetParam();
    // Independent route: q = (gamma / 2) p M^2. The two routes differ only
    // by a handful of roundings, so a relative tolerance of 1e-12 is generous.
    const double want = 0.5 * kGamma * isa_pressure(h) * mach * mach;
    EXPECT_NEAR(dynamic_pressure(h, mach), want, 1e-12 * want);
}

std::string ConditionName(const ::testing::TestParamInfo<Condition>& info) {
    const auto [h, mach] = info.param;
    std::string m = std::to_string(mach).substr(0, 3);  // "0.8", "2.0"
    m[1] = 'p';                                         // "0p8", "2p0"
    return "h" + std::to_string(static_cast<int>(h)) + "m_M" + m;
}

INSTANTIATE_TEST_SUITE_P(
    Envelope, DynamicPressureTest,
    ::testing::Combine(::testing::Values(0.0, 5000.0, 11000.0),
                       ::testing::Values(0.5, 0.8, 1.2, 2.0)),
    ConditionName);
```

The name generator turns the row $(5000, 0.8)$ into `h5000m_M0p8`: an `h`, the altitude as a whole number, `m_M`, then the Mach number with its dot swapped for a `p`. Three altitudes times four Mach numbers is $12$ rows, and all $12$ pass.

Now plant a realistic bug. Someone "saves time" by using the sea-level speed of sound everywhere, writing `288.15` in place of `T` on the airspeed line. Run again:

```text
[ RUN      ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h5000m_M0p8
qbar_bug.cpp:34: Failure
The difference between dynamic_pressure(h, mach) and want is 3076.5874125539012, which exceeds 1e-12 * want, where
dynamic_pressure(h, mach) evaluates to 27277.497320843213,
want evaluates to 24200.909908289312, and
1e-12 * want evaluates to 2.4200909908289311e-08.
...
[  PASSED  ] 4 tests.
[  FAILED  ] 8 tests, listed below:
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h5000m_M0p5, where GetParam() = (5000, 0.5)
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h5000m_M0p8, where GetParam() = (5000, 0.8)
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h5000m_M1p2, where GetParam() = (5000, 1.2)
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h5000m_M2p0, where GetParam() = (5000, 2)
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h11000m_M0p5, where GetParam() = (11000, 0.5)
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h11000m_M0p8, where GetParam() = (11000, 0.8)
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h11000m_M1p2, where GetParam() = (11000, 1.2)
[  FAILED  ] Envelope/DynamicPressureTest.MatchesGammaPMachSquared/h11000m_M2p0, where GetParam() = (11000, 2)
```

Read the list of names, not the numbers. All four sea-level rows passed. Every failing row starts with `h5000` or `h11000`, across every Mach number. So the bug depends on altitude and not on speed. That points at something that changes with altitude, which is the temperature.

Sanity check the size of the error. At $5000\,\mathrm{m}$ the standard temperature is $288.15 - 0.0065 \times 5000 = 255.65\,\mathrm{K}$. The bug uses $288.15\,\mathrm{K}$ for $V^2$, which is proportional to $T$, so it should overestimate $q$ by the factor $288.15 / 255.65 \approx 1.127$. The report shows $27277.5 / 24200.9 \approx 1.127$. The bug is exactly the size the diagnosis predicts.
:::

## A tolerance column, derived instead of tuned

Lesson 03 said the tolerance for an integrator comes from its order and its step size, never from tuning until the test goes green. A parameterized test is where that rule pays off, because different rows need different tolerances. A row with a large step deserves a looser tolerance than a row with a small one, and the reasoning should be written down once, in the test body, not typed as a magic number into every row.

::: example RK4 on a spring, one tolerance per row
A mass on a spring obeys $\ddot{x} = -\omega^2 x$ (read "x double-dot equals minus omega squared x"), where $\omega$ is the **[[angular frequency|angular-frequency]]** in $\mathrm{rad/s}$. Started at $x = 1$ and at rest, the exact answer is $x(t) = \cos(\omega t)$. The code under test steps this with the classic fourth-order Runge–Kutta method (RK4) using $n$ equal steps of size $h = t_\text{end}/n$.

For this equation RK4's main error is a small **[[phase error|phase-error]]**: the simulated spring runs very slightly ahead of or behind the true one. After time $t_\text{end}$ that phase slip is about

$$
\delta \approx \frac{\omega\, t_\text{end}\, (\omega h)^4}{120},
$$

and a position error can never be bigger than the phase slip that caused it. The note after this example shows where the formula comes from. The test allows twice that bound, a small factor above it, as lesson 03 recommends.

```cpp
#include <gtest/gtest.h>
#include <cmath>
#include <ostream>
#include <string>

// RK4 for the spring equation x'' = -w^2 x, starting at x = 1, v = 0.
double rk4_spring(double w, double t_end, int n) {
    const double h = t_end / n;
    double x = 1.0, v = 0.0;
    for (int i = 0; i < n; ++i) {
        const double k1x = v,                 k1v = -w * w * x;
        const double k2x = v + 0.5 * h * k1v, k2v = -w * w * (x + 0.5 * h * k1x);
        const double k3x = v + 0.5 * h * k2v, k3v = -w * w * (x + 0.5 * h * k2x);
        const double k4x = v + h * k3v,       k4v = -w * w * (x + h * k3x);
        x += (h / 6.0) * (k1x + 2 * k2x + 2 * k3x + k4x);
        v += (h / 6.0) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
    return x;
}

struct SpringCase {
    const char* name;
    double w;      // angular frequency, rad/s
    double t_end;  // s
    int steps;
};

std::ostream& operator<<(std::ostream& os, const SpringCase& c) {
    return os << c.name << " (w=" << c.w << " rad/s, t_end=" << c.t_end
              << " s, steps=" << c.steps << ")";
}

class SpringTest : public ::testing::TestWithParam<SpringCase> {};

TEST_P(SpringTest, MatchesCosine) {
    const SpringCase& c = GetParam();
    const double h = c.t_end / c.steps;
    // RK4 phase error is about w*t_end*(w*h)^4/120, and the position error
    // is at most the phase error. Allow twice that bound.
    const double tol = 2.0 * c.w * c.t_end * std::pow(c.w * h, 4) / 120.0;
    EXPECT_NEAR(rk4_spring(c.w, c.t_end, c.steps), std::cos(c.w * c.t_end), tol);
}

INSTANTIATE_TEST_SUITE_P(
    Rk4, SpringTest,
    ::testing::Values(
        SpringCase{"slow_1_rad_s",   1.0, 10.0, 1000},
        SpringCase{"medium_2_rad_s", 2.0, 10.0, 1000},
        SpringCase{"fast_10_rad_s", 10.0,  2.0, 1000},
        SpringCase{"coarse_steps",   1.0, 10.0,  100}),
    [](const ::testing::TestParamInfo<SpringCase>& info) {
        return std::string(info.param.name);
    });
```

```text
[       OK ] Rk4/SpringTest.MatchesCosine/slow_1_rad_s (0 ms)
[       OK ] Rk4/SpringTest.MatchesCosine/medium_2_rad_s (0 ms)
[       OK ] Rk4/SpringTest.MatchesCosine/fast_10_rad_s (0 ms)
[       OK ] Rk4/SpringTest.MatchesCosine/coarse_steps (0 ms)
[  PASSED  ] 4 tests.
```

Work the first row by hand. $\omega = 1\,\mathrm{rad/s}$, $t_\text{end} = 10\,\mathrm{s}$, $n = 1000$, so $h = 10/1000 = 0.01\,\mathrm{s}$ and $\omega h = 0.01$. Then $(\omega h)^4 = 10^{-8}$, the bound is $1 \times 10 \times 10^{-8} / 120 \approx 8.33 \times 10^{-10}$, and the tolerance is twice that, $1.67 \times 10^{-9}$. The measured error, computed separately, is $4.48 \times 10^{-10}$: about a quarter of the tolerance.

Now the `coarse_steps` row: ten times the step, $h = 0.1\,\mathrm{s}$. The formula has $h^4$ in it, so the tolerance grows by $10^4$, to $1.67 \times 10^{-5}$. The measured error is $3.94 \times 10^{-6}$. It grew from $4.48 \times 10^{-10}$ by a factor of about $8800$, close to the $10^4$ a fourth-order method predicts. The tolerance moved with the step, automatically, because it was computed from the step.

Does the tolerance still catch bugs? Change one character: write `2 * k2x` where `2 * k3x` belongs in the `x` update. Every row fails, and the first one reports an error of $2.23 \times 10^{-5}$ against a tolerance of $1.67 \times 10^{-9}$. A tolerance tuned "until green" at, say, $10^{-4}$ would have waved that bug through.
:::

::: note Why the phase slip is about omega t (omega h)^4 / 120
Write the spring's state as one complex number, $x + i\,v/\omega$. The exact motion turns it around a circle, and one step of length $h$ multiplies it by $e^{-i\omega h}$. RK4 applied to this linear equation multiplies it by the first five terms of that exponential's series instead (the terms up to power four), because RK4 matches the exact Taylor series through $h^4$. With $z = \omega h$, the first missing term is $(-iz)^5/5! = -i z^5/120$. A pure $i$ times a small real number is a small turn, so each step turns the state by an angle about $z^5/120$ too little or too much. The size change it causes is much smaller, of order $z^6$.

There are $n = t_\text{end}/h$ steps, and the small turns add up:

$$
\delta \approx \frac{t_\text{end}}{h} \cdot \frac{(\omega h)^5}{120} = \frac{\omega\, t_\text{end}\,(\omega h)^4}{120}.
$$

Finally $x = \cos(\text{angle})$, and the slope of cosine is never steeper than $1$, so a phase slip of $\delta$ moves $x$ by at most about $\delta$.
:::

This is the pattern the module's parameterized-integrator exercise asks for: a `TestWithParam<Case>` fixture, a `Case` struct with a name, an instantiation with a name generator, and a tolerance whose reasoning sits in a comment. Some teams put the tolerance itself into the table as a column. That is fine too, as long as a comment says how each number was derived. Then anyone can check the column, and a row whose tolerance is tighter than the others is easy to spot when the step size changes.

## Check yourself

::: check
A test for a gain-scheduling function walks a `std::vector` of twenty altitude cases with `ASSERT_NEAR` inside a `for` loop. In CI it fails on case 7. Name two things you do not know from that report, and say how `TEST_P` would tell you.
:::

::: answer
You do not know whether cases 8 to 20 pass, because the fatal `ASSERT_NEAR` ended the test function at case 7. You also do not know the case by name — only the values printed in the failure, which you have to match against the table by hand. (You also cannot rerun case 7 on its own.)

With `TEST_P` and `ValuesIn(the_vector)`, each of the twenty cases is its own test. All twenty run, the report lists every failing one, and with a name generator each failure carries a name such as `h9000m`. You can rerun one with `--gtest_filter='*h9000m'`.
:::

::: check
What values does `::testing::Range(1.0, 2.0, 0.25)` produce? Then write a generator that produces the altitudes $0, 2000, 4000, \dots, 10000\,\mathrm{m}$.
:::

::: answer
It starts at $1.0$ and adds $0.25$ each time: $1.0, 1.25, 1.5, 1.75$. The next value would be $2.0$, which is not less than the end, $2.0$, so it is left out. Four rows.

For the altitudes, the end must be *past* $10000$, because the end is excluded: `::testing::Range(0.0, 10001.0, 2000.0)` gives $0, 2000, 4000, 6000, 8000, 10000$ (checked with `--gtest_list_tests`). Many people find `::testing::Values(0.0, 2000.0, 4000.0, 6000.0, 8000.0, 10000.0)` clearer, and for six values it is.
:::

::: check
A test uses `Combine(Values(0.0, 3000.0, 6000.0, 9000.0), Values(0.3, 0.6, 0.9), Bool())`. How many tests is that, and what are the first three rows?
:::

::: answer
$4 \times 3 \times 2 = 24$ tests. The last generator changes fastest, then the middle one, then the first. The first three rows are $(0, 0.3, \text{false})$, $(0, 0.3, \text{true})$, $(0, 0.6, \text{false})$.
:::

::: check
Write a name generator for a `std::tuple<double, double>` of (altitude in m, Mach) that gives `h3000m_M0p6` for $(3000, 0.6)$. Why can't you use `PrintToStringParamName()` here?
:::

::: answer
The one from the lesson works:

```cpp
std::string ConditionName(const ::testing::TestParamInfo<Condition>& info) {
    const auto [h, mach] = info.param;
    std::string m = std::to_string(mach).substr(0, 3);  // "0.6"
    m[1] = 'p';                                         // "0p6"
    return "h" + std::to_string(static_cast<int>(h)) + "m_M" + m;
}
```

`std::to_string(0.6)` is `"0.600000"`. The first three characters are `"0.6"`, and the dot becomes `p`. `PrintToStringParamName()` would print the tuple as `(3000, 0.6)`. Brackets, a comma, a space and a dot are all outside the allowed letters, digits and underscore, so GoogleTest would stop with an invalid-name error before running anything. (This generator assumes Mach below $10$ with one decimal place, which is fine for this table. A more general one would format with care.)
:::

::: check
Your RK4 spring table uses the tolerance $2\,\omega t_\text{end} (\omega h)^4 / 120$. A teammate halves the number of steps in every row, to speed up CI. Does anything need retuning? What would happen if the tolerance had instead been a fixed number typed into each row?
:::

::: answer
Halving the steps doubles $h$. The error grows by about $2^4 = 16$, and the computed tolerance also grows by exactly $2^4 = 16$, because it has $h^4$ in it. So every row still passes with the same margin, and nothing needs retuning.

With fixed typed-in tolerances, each row's error would grow by about $16$ while its tolerance stayed put. Every row whose error was already more than one sixteenth of its tolerance would start failing — the tightest-tolerance rows first. The teammate would then face exactly the temptation the rule warns against: loosening numbers until the suite goes green, without any reasoning behind the new values.
:::

## Summary

| Idea | Meaning | Form |
|---|---|---|
| Parameterized fixture | A fixture whose tests get one row at a time | `class F : public ::testing::TestWithParam<T> {};` |
| `TEST_P` | Test body written once, run per row | `TEST_P(F, Name) { GetParam(); }` |
| Instantiation | Chooses the rows and names them | `INSTANTIATE_TEST_SUITE_P(Prefix, F, gen, namer)` |
| Full test name | What reports and filters see | `Prefix/F.Name/RowName` |
| Name generator | Readable row names from letters, digits, `_` | lambda taking `TestParamInfo<T>`, returns `std::string` |
| Printer | Readable row values in failures | `operator<<` or `PrintTo` next to the type |
| Generators | Build the list of rows | `Values`, `ValuesIn`, `Range` (end excluded), `Bool`, `Combine` (tuples) |
| Why not a loop | Loops stop early and hide failures | each row is its own named, filterable test |
| Tolerance per row | Derived from order and step, in a comment | RK4: about $\omega t_\text{end} (\omega h)^4/120$ |

Parameterized tests vary the *values* a test runs on. The next lesson, "Typed tests and death tests", varies the *types* instead — the same test run for `float`, `double` and a 16-bit integer — and then tests the one outcome ordinary assertions cannot: that the program stops when a contract is broken.

::: context flight-envelope The box a vehicle lives in
A flight envelope is usually drawn as a region on a chart with speed along one axis and altitude up the other. Inside the region the vehicle is designed, analyzed and tested to fly. Outside it something gives: the wing stalls, the structure is overloaded, the engine flames out. Test tables for flight software are often built by picking points on the edges and corners of this region, because that is where the equations are pushed hardest. A parameterized test is a natural way to write "the same check, at every one of these points".
:::

::: context heading-wrap Why -90 and 270 are the same heading
A heading is a direction on a compass, and a compass is a circle. Going $90°$ counterclockwise from north lands on the same spot as going $270°$ clockwise: due west. So $-90°$ and $270°$ are one direction with two names. Flight software picks one name for each direction, usually $[0, 360)$ or $(-180, 180]$, and wraps every angle into it. Otherwise a heading controller could see the change from $359°$ to $1°$ as a jump of $358°$ and swing the vehicle the long way round.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="70" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">N (0)</text>
  <text x="258" y="104" font-size="12" fill="#1f2a44">E (90)</text>
  <text x="180" y="190" font-size="12" fill="#1f2a44" text-anchor="middle">S (180)</text>
  <line x1="180" y1="100" x2="180" y2="30" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="100" x2="110" y2="100" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="110" cy="100" r="5" fill="#b4232c"/>
  <text x="102" y="94" font-size="12" fill="#b4232c" text-anchor="end">W</text>
  <path d="M 180 55 A 45 45 0 0 0 135 100" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="124" y="60" font-size="12" fill="#1d6fd1" text-anchor="end">-90</text>
  <path d="M 180 42 A 58 58 0 1 1 122 100" fill="none" stroke="#f2b880" stroke-width="2"/>
  <text x="268" y="160" font-size="12" fill="#1f2a44">270</text>
</svg>
```
:::

::: context table-driven Tests as data
Table-driven testing means writing the inputs and expected outputs as rows of data, and the checking logic once. It is a habit found in many languages — Go programmers use it for nearly every test. The benefit is that adding a case is adding a line, not copying a function. The cost, in a plain loop, is that the framework only sees one test. `TEST_P` keeps the table and gives the framework back its view of each row.
:::

::: context lambda A function with no name
A lambda is a small function written right where it is used. `[](const ::testing::TestParamInfo<WrapCase>& info) { return std::string(info.param.name); }` reads as: "a function (the `[]` starts it) that takes an info object and returns the row's name as a string". The square brackets can list outside variables the function may use; here it needs none, so they are empty. The name comes from the lambda calculus, a mathematical model of functions from the 1930s.
:::

::: context name-characters Why only letters, digits and underscores
Test names end up inside patterns. In `--gtest_filter`, a dot separates suite from test, `*` and `?` are wildcards, `:` separates several patterns, and a leading `-` means "everything except". A row named `-90` or `0.8` would be read as part of that pattern language instead of as a name. CTest, which lesson 09 connects to GoogleTest, also turns names into command lines and regular expressions. Restricting names to letters, digits and underscores keeps every one of those tools from misreading them.
:::

::: context byte-dump Reading the hex GoogleTest prints
With no printer, GoogleTest shows the object's memory, two hexadecimal digits per byte. The row `{"minus_90", -90.0, 270.0}` is 24 bytes on a 64-bit machine: 8 for the `const char*` pointer, then 8 for each `double`. The eight bytes `00-00 00-00 00-80 56-C0` in the middle are $-90.0$ stored as a `double`, lowest byte first. The first eight bytes are the pointer's address, which changes from run to run. It is all correct, and no one should have to read it in a CI log.
:::

::: context cartesian-product Every row with every column
The Cartesian product of two lists is every pair you can make by taking one item from each. Three altitudes and four Mach numbers give a grid of $3 \times 4 = 12$ points, like the squares of a table with 3 rows and 4 columns. It is named after René Descartes, whose coordinate plane is the product of the number line with itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="150" x2="80" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="205" y="174" font-size="12" fill="#1f2a44" text-anchor="middle">Mach</text>
  <text x="14" y="20" font-size="12" fill="#1f2a44">h (m)</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="120" y="164">0.5</text><text x="180" y="164">0.8</text><text x="240" y="164">1.2</text><text x="300" y="164">2.0</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="74" y="129">0</text><text x="74" y="89">5000</text><text x="74" y="49">11000</text>
  </g>
  <g fill="#1d6fd1">
    <circle cx="120" cy="125" r="6"/><circle cx="180" cy="125" r="6"/><circle cx="240" cy="125" r="6"/><circle cx="300" cy="125" r="6"/>
    <circle cx="120" cy="85" r="6"/><circle cx="180" cy="85" r="6"/><circle cx="240" cy="85" r="6"/><circle cx="300" cy="85" r="6"/>
    <circle cx="120" cy="45" r="6"/><circle cx="180" cy="45" r="6"/><circle cx="240" cy="45" r="6"/><circle cx="300" cy="45" r="6"/>
  </g>
</svg>
```
:::

::: context dynamic-pressure Max Q
As a rocket climbs, its speed rises and the air thins. Speed squared pushes $q$ up, falling density pulls it down, so $q$ rises to a peak and then falls. That peak is called **max Q**, and it is usually the moment of highest aerodynamic load on the vehicle, typically around a minute into flight. Launch commentators call it out, and many vehicles, Falcon 9 among them, throttle their engines down around it to keep the load within limits. A wrong $q$ in flight software means wrong loads and wrong control gains at exactly the worst moment.
:::

::: context speed-of-sound Why the speed of sound changes with height
Sound travels by molecules bumping into their neighbors, and warmer molecules move faster. So the speed of sound depends on temperature: $a = \sqrt{\gamma R T}$. In the standard atmosphere it is about $340.3\,\mathrm{m/s}$ at sea level ($288.15\,\mathrm{K}$) and about $295.1\,\mathrm{m/s}$ at $11\,\mathrm{km}$ ($216.65\,\mathrm{K}$). Mach 2 at $11\,\mathrm{km}$ is therefore about $590\,\mathrm{m/s}$, not $681\,\mathrm{m/s}$. Using the sea-level value everywhere is a classic shortcut bug, and the envelope grid above catches it.
:::

::: context angular-frequency Radians per second
Angular frequency $\omega$ (read "omega") counts how fast something goes around a circle, in radians per second. One full turn is $2\pi$ radians, so a spring with $\omega = 2\pi\,\mathrm{rad/s}$ bounces once per second. The ordinary frequency $f$ in hertz is $\omega / (2\pi)$. So the three springs in the table have periods of about $6.28\,\mathrm{s}$, $3.14\,\mathrm{s}$ and $0.628\,\mathrm{s}$.
:::

::: context phase-error Running slightly ahead
Phase error means the simulated oscillation has the right shape and size but drifts in time, like a clock that runs a little fast. Early on the two curves sit on top of each other. The slip grows steadily with every cycle, which is why the bound contains $t_\text{end}$: a longer simulation drifts further.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="345" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <path d="M 20 30 C 45 30 55 110 80 110 C 105 110 115 30 140 30 C 165 30 175 110 200 110 C 225 110 235 30 260 30 C 285 30 295 110 320 110" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 20 30 C 44 30 54 110 78 110 C 102 110 112 30 136 30 C 160 30 170 110 194 110 C 218 110 228 30 252 30 C 276 30 286 110 310 110" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="24" y="130" font-size="11" fill="#1f2a44">exact</text>
  <text x="80" y="130" font-size="11" fill="#b4232c">simulated (exaggerated drift)</text>
  <text x="300" y="20" font-size="11" fill="#1f2a44">slip grows</text>
</svg>
```
:::
