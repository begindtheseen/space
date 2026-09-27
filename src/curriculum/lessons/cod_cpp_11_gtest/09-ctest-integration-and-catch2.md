---
id: l09-ctest-integration-and-catch2
title: Every test by name in CTest, and a look at Catch2
minutes: 21
covers:
  - gtest_discover_tests, CTest registration, test filters and labels
  - Catch2 as the alternative and what it trades
---

Imagine a school report card with one line on it: "Overall: fail." You know something went wrong, but not what. Was it math? History? All of them? You cannot study for the right subject, and next term you cannot tell whether you improved. A real report card has one line per subject, so a single glance tells you where the trouble is.

A test program is the same. It may hold two hundred GoogleTest tests. If CTest only knows "the program passed" or "the program failed", your CI system shows one red line and you go digging through a log. If CTest knows every test by name, the red line *is* the answer: `Rk4/Decay.MatchesExp/growth` failed, and everything else passed.

In the CMake module you met `gtest_discover_tests`, which gives CTest that per-test view. This lesson goes one level deeper. You will see exactly what discovery registers, compare it with the older `gtest_add_tests`, pick tests to run with **filters**, group them with **labels** so CI can run the quick ones on every push and the slow ones overnight, and then meet **Catch2**, the most common alternative to GoogleTest, and weigh what it gives and what it takes away.

## What discovery really registers

A reminder of the mechanism. `gtest_discover_tests(target)` adds a step that runs right after the test program is linked. That step runs the program with `--gtest_list_tests`, which prints every test name without running any, and writes one CTest test per name. Each CTest test then runs the same program with a `--gtest_filter` that selects only its own test.

Here is a small project to watch it work. It has a header-only library `nav` with two kernels, an angle wrap and an RK4 integrator for $\dot{y} = \lambda y$ (read "y dot equals lambda y"), plus two test programs: a fast one and a deliberately slow **[[soak test|soak-test]]**.

```text
nav/
├── CMakeLists.txt
├── include/nav/kernels.hpp
└── tests/
    ├── CMakeLists.txt
    ├── test_kernels.cpp      fast unit tests
    └── test_soak.cpp         a slow soak test
```

The root `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.20)
project(nav LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)

add_library(nav INTERFACE)
target_include_directories(nav INTERFACE include)

enable_testing()
add_subdirectory(tests)
```

The library:

```cpp
// include/nav/kernels.hpp
#pragma once
#include <cmath>
#include <numbers>

namespace nav {

// Folds any angle into (-pi, pi].
inline double wrap_pi(double a) {
    const double two_pi = 2.0 * std::numbers::pi;
    double r = std::fmod(a + std::numbers::pi, two_pi);
    if (r <= 0.0) r += two_pi;
    return r - std::numbers::pi;
}

// y' = lambda * y from y0, n RK4 steps to t_end.
inline double rk4_decay(double y0, double lambda, double t_end, int n) {
    const double h = t_end / n;
    double y = y0;
    for (int i = 0; i < n; ++i) {
        const double k1 = lambda * y;
        const double k2 = lambda * (y + 0.5 * h * k1);
        const double k3 = lambda * (y + 0.5 * h * k2);
        const double k4 = lambda * (y + h * k3);
        y += (h / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4);
    }
    return y;
}

}  // namespace nav
```

The fast tests, including a parameterized suite from lesson 04 with a name generator:

```cpp
// tests/test_kernels.cpp
#include <gtest/gtest.h>
#include <cmath>
#include <numbers>
#include <string>
#include <nav/kernels.hpp>

TEST(Wrap, KeepsSmallAngles) { EXPECT_DOUBLE_EQ(nav::wrap_pi(0.5), 0.5); }
TEST(Wrap, FoldsLargeAngles) { EXPECT_NEAR(nav::wrap_pi(7.0), 7.0 - 2 * std::numbers::pi, 1e-12); }

struct Case { const char* name; double lambda; double t_end; double tol; };

class Decay : public ::testing::TestWithParam<Case> {};

TEST_P(Decay, MatchesExp) {
    const Case& c = GetParam();
    const double got = nav::rk4_decay(1.0, c.lambda, c.t_end, 200);
    EXPECT_NEAR(got, std::exp(c.lambda * c.t_end), c.tol);
}

INSTANTIATE_TEST_SUITE_P(
    Rk4, Decay,
    ::testing::Values(Case{"slow", -0.1, 10.0, 1e-11},
                      Case{"fast", -5.0, 2.0, 1e-10},
                      Case{"growth", 0.5, 4.0, 5e-9}),
    [](const ::testing::TestParamInfo<Case>& info) { return std::string(info.param.name); });
```

And the slow one, ten million calls to `wrap_pi` to make sure the result never leaves its range:

```cpp
// tests/test_soak.cpp
#include <gtest/gtest.h>
#include <algorithm>
#include <cmath>
#include <numbers>
#include <nav/kernels.hpp>

// Ten million wraps of a slowly growing angle: slow, so it gets its own label.
TEST(Soak, WrapStaysInRange) {
    double worst = 0.0;
    for (int i = 0; i < 10'000'000; ++i) {
        worst = std::max(worst, std::abs(nav::wrap_pi(i * 0.001)));
    }
    EXPECT_LE(worst, std::numbers::pi);
}
```

Before any CMake, ask the fast program what it contains. This is the same question discovery asks:

```text
$ ./tests/unit_tests --gtest_list_tests
Running main() from ./googletest/src/gtest_main.cc
Wrap.
  KeepsSmallAngles
  FoldsLargeAngles
Rk4/Decay.
  MatchesExp/slow  # GetParam() = 32-byte object <42-12 54-EA B5-55 00-00 9A-99 99-99 99-99 B9-BF 00-00 00-00 00-00 24-40 95-64 79-E1 7F-FD A5-3D>
  MatchesExp/fast  # GetParam() = 32-byte object <22-16 54-EA B5-55 00-00 00-00 00-00 00-00 14-C0 00-00 00-00 00-00 00-40 BB-BD D7-D9 DF-7C DB-3D>
  MatchesExp/growth  # GetParam() = 32-byte object <47-12 54-EA B5-55 00-00 00-00 00-00 00-00 E0-3F 00-00 00-00 00-00 10-40 3A-8C 30-E2 8E-79 35-3E>
```

Suite names end in a dot, and each test is indented under its suite. The parameterized tests carry a comment: GoogleTest prints the parameter after `#`. It does not know how to print a `Case`, so it dumps its 32 bytes in [[hexadecimal|hex-dump]].

::: key
`gtest_discover_tests` runs the test binary at build time to enumerate its cases and registers each with CTest, so ctest reports individual test names and can filter and parallelise them, rather than treating the binary as one opaque test.
:::

::: warning
CMake tries to make parameterized names prettier by swapping the index for the printed parameter. That works for names like `MatchesExp/0`. With a custom name generator it misfires: the whole `# GetParam() = 32-byte object <…>` comment ends up glued to the CTest name. The fix is one word, `NO_PRETTY_VALUES`, in the `gtest_discover_tests` call, which keeps the clean `MatchesExp/growth` name. Run `ctest -N` after adding a parameterized suite and read the names.
:::

## Two ways to register, and why discovery usually wins

CMake's `GoogleTest` module has two commands, and both give each test its own CTest entry.

**`gtest_add_tests`** is the older one. At configure time, it reads your `.cpp` files and looks for `TEST(…)` and `TEST_F(…)` with a text pattern. It never runs the program. **`gtest_discover_tests`** runs the built program and believes what it says. That difference decides what each one can see.

::: example The same program registered both ways
Here is `tests/CMakeLists.txt` with discovery. It registers both programs and gives each a **label** (more on labels below), and the soak test a longer timeout:

```cmake
find_package(GTest REQUIRED)
include(GoogleTest)

add_executable(unit_tests test_kernels.cpp)
target_link_libraries(unit_tests PRIVATE nav GTest::gtest_main)
gtest_discover_tests(unit_tests
  NO_PRETTY_VALUES
  PROPERTIES LABELS "unit")

add_executable(soak_tests test_soak.cpp)
target_link_libraries(soak_tests PRIVATE nav GTest::gtest_main)
gtest_discover_tests(soak_tests PROPERTIES LABELS "slow" TIMEOUT 120)
```

Configure, build, and list what CTest knows with `ctest -N` (`-N` lists without running):

```text
$ cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
$ cmake --build build
$ cd build && ctest -N
  Test #1: Wrap.KeepsSmallAngles
  Test #2: Wrap.FoldsLargeAngles
  Test #3: Rk4/Decay.MatchesExp/slow
  Test #4: Rk4/Decay.MatchesExp/fast
  Test #5: Rk4/Decay.MatchesExp/growth
  Test #6: Soak.WrapStaysInRange

Total Tests: 6
```

(Here and below, the first line of CTest's output, which only names the build folder, is left out.) Six tests, each by its full name, including one per parameter.

Now swap the fast program's registration for `gtest_add_tests(TARGET unit_tests)`, in a fresh build folder, and list again:

```text
  Test #1: Wrap.KeepsSmallAngles
  Test #2: Wrap.FoldsLargeAngles
  Test #3: */Decay.MatchesExp/*

Total Tests: 3
```

The two plain tests are found. The parameterized suite is not split: the source file only says `TEST_P(Decay, MatchesExp)`, and the names `slow`, `fast` and `growth` exist only when the program runs. So `gtest_add_tests` registers one wildcard entry that runs all three. If `growth` fails, CTest reports `*/Decay.MatchesExp/*` failed, which is the one-line report card again.

Count check: discovery found $2 + 3 = 5$ fast tests; source scanning found $2 + 1 = 3$ entries. The difference, $2$, is exactly the parameter cases that got merged.
:::

Discovery has two costs, and both are worth knowing.

First, the program must *run* during the build. If you are [[cross-compiling|cross-compile]] for a flight computer's ARM processor, the build machine cannot run the result. Two fixes: set a `CROSSCOMPILING_EMULATOR` on the target (for example QEMU) so CMake runs the program under an emulator, or pass `DISCOVERY_MODE PRE_TEST`, which delays the listing until `ctest` runs, on the machine where the tests will actually execute. `gtest_add_tests` never runs anything, which is its one real advantage there.

Second, every CTest test is a separate run of the program. A suite-wide setup that takes two seconds runs once per test, not once per program. For most unit tests that is a few milliseconds each and nobody notices. For a suite with heavy setup, it can be the reason a build folder's test run takes minutes.

| | `add_test` on the program | `gtest_add_tests` | `gtest_discover_tests` |
| --- | --- | --- | --- |
| How it finds tests | it does not; one entry | scans source text at configure time | runs the program after the build |
| Parameterized cases | hidden inside one entry | one wildcard entry | one entry each |
| New test appears after | never | re-running CMake | the next build |
| Cross-compiling | works | works | needs an emulator or `PRE_TEST` |

## Choosing which tests run

You rarely want every test. You want the one that failed a minute ago, or everything about the RK4 kernel, or everything except the slow soak. There are two places to filter, and they speak different languages.

**Inside GoogleTest**, run the program directly with **`--gtest_filter`**. The value is a list of patterns separated by colons. A `*` matches any run of characters and a `?` matches one character; these are **wildcards**, the same kind a shell uses for file names. Anything after a `-` is excluded.

| Filter | Runs |
| --- | --- |
| `--gtest_filter=Wrap.*` | every test in suite `Wrap` |
| `--gtest_filter=*growth` | every test whose full name ends in `growth` |
| `--gtest_filter=Wrap.*:*growth` | both of the above |
| `--gtest_filter=-Rk4/*` | everything except the `Rk4/…` tests |
| `--gtest_filter=Wrap.*-*Large*` | suite `Wrap`, except names containing `Large` |

**Inside CTest**, use **`ctest -R`** (run tests whose names match) and **`ctest -E`** (exclude tests whose names match). These take a **[[regular expression|regex]]**, a more powerful pattern language, not wildcards.

::: example Filtering from both sides
Run two groups straight from the program:

```text
$ ./tests/unit_tests --gtest_filter='Wrap.*:*growth'
Running main() from ./googletest/src/gtest_main.cc
Note: Google Test filter = Wrap.*:*growth
[==========] Running 3 tests from 2 test suites.
[----------] Global test environment set-up.
[----------] 2 tests from Wrap
[ RUN      ] Wrap.KeepsSmallAngles
[       OK ] Wrap.KeepsSmallAngles (0 ms)
[ RUN      ] Wrap.FoldsLargeAngles
[       OK ] Wrap.FoldsLargeAngles (0 ms)
[----------] 2 tests from Wrap (0 ms total)

[----------] 1 test from Rk4/Decay
[ RUN      ] Rk4/Decay.MatchesExp/growth
[       OK ] Rk4/Decay.MatchesExp/growth (0 ms)
[----------] 1 test from Rk4/Decay (0 ms total)

[----------] Global test environment tear-down
[==========] 3 tests from 2 test suites ran. (0 ms total)
[  PASSED  ] 3 tests.
```

Two from the first pattern plus one from the second: $2 + 1 = 3$, as the header line says. The quotes around the filter stop the shell from expanding the `*` itself.

Now from CTest, excluding by name:

```text
$ ctest -E 'Soak|growth' -N
  Test #1: Wrap.KeepsSmallAngles
  Test #2: Wrap.FoldsLargeAngles
  Test #3: Rk4/Decay.MatchesExp/slow
  Test #4: Rk4/Decay.MatchesExp/fast

Total Tests: 4
```

In a regular expression, `|` means "or", so this excludes any name containing `Soak` or `growth`. Six tests minus two leaves four.
:::

::: warning
`-R` and `-E` are regular expressions, and `--gtest_filter` is wildcards. They look alike and are not. In a regular expression, `*` means "repeat the previous character", and `.` means "any character", so `ctest -R Wrap.*` happens to work but `ctest -R '*growth'` is an error. In a wildcard filter, `.` is a plain dot. When a filter matches nothing, first ask which language you were speaking.
:::

Filters are for people at a keyboard. When CI or a teammate needs a lasting grouping, use labels.

## Labels: sorting tests into groups

A **label** is a tag on a CTest test, such as `unit`, `slow` or `hil`. You set it with the `LABELS` test property; `gtest_discover_tests` applies anything after `PROPERTIES` to every test it finds, which is how every fast test above got `unit` and the soak test got `slow` (and a 120-second `TIMEOUT`, since a soak test is allowed to take a while).

Then **`ctest -L unit`** runs only tests carrying a label that matches `unit`, and **`ctest -LE slow`** runs everything *except* those labeled `slow`. `ctest --print-labels` lists the labels in use.

```text
$ ctest -L slow
    Start 6: Soak.WrapStaysInRange
1/1 Test #6: Soak.WrapStaysInRange ............   Passed    0.10 sec

100% tests passed, 0 tests failed out of 1

Label Time Summary:
slow    =   0.10 sec*proc (1 test)

Total Test time (real) =   0.11 sec
```

The **label time summary** at the end adds up time per label. On a real project, it is how you notice that "unit" has quietly grown to twelve minutes.

This is what makes a sensible CI pipeline possible, which you met in the CI module. Every push runs `ctest -L unit -j 8 --output-on-failure`, because it must come back in minutes. A nightly job runs `ctest -L slow`. A job on the lab machine wired to real hardware runs `ctest -L hil`. Same tests, same CMake, three **[[label schemes|label-scheme]]**. Add `--output-junit results.xml` (CMake 3.21 and later) and CTest writes a [[JUnit-style|junit]] XML report that most CI systems read to show a table of every test by name, pass or fail.

::: key
`--gtest_filter` takes wildcard patterns (`*`, `?`, `:` between patterns, `-` to exclude). `ctest -R` / `-E` select tests by regular expression on the name; `ctest -L` / `-LE` select by label, set with the `LABELS` property (for discovered tests, through `gtest_discover_tests(… PROPERTIES LABELS …)`).
:::

## Catch2, the main alternative

GoogleTest is not the only choice. **Catch2** is a popular open-source C++ test framework with a different taste. Here are the same kernel tests written for it.

::: example The same tests in Catch2
```cpp
// tests/test_kernels_catch.cpp
#include <catch2/catch_test_macros.hpp>
#include <catch2/generators/catch_generators.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <cmath>
#include <numbers>
#include <nav/kernels.hpp>

using Catch::Matchers::WithinAbs;

TEST_CASE("wrap_pi folds angles into the range -pi to pi", "[wrap][unit]") {
    SECTION("small angles are unchanged") {
        CHECK(nav::wrap_pi(0.5) == 0.5);
    }
    SECTION("large angles lose a full turn") {
        CHECK_THAT(nav::wrap_pi(7.0), WithinAbs(7.0 - 2 * std::numbers::pi, 1e-12));
    }
}

TEST_CASE("rk4_decay matches exp(lambda t)", "[rk4][unit]") {
    auto [lambda, t_end, tol] = GENERATE(table<double, double, double>({
        {-0.1, 10.0, 1e-11},
        {-5.0,  2.0, 1e-10},
        { 0.5,  4.0, 5e-9},
    }));
    CAPTURE(lambda, t_end);
    REQUIRE_THAT(nav::rk4_decay(1.0, lambda, t_end, 200),
                 WithinAbs(std::exp(lambda * t_end), tol));
}
```

```cmake
find_package(Catch2 3 REQUIRED)
include(Catch)

add_executable(catch_tests test_kernels_catch.cpp)
target_link_libraries(catch_tests PRIVATE nav Catch2::Catch2WithMain)
catch_discover_tests(catch_tests)
```

Built with Catch2 3.4, CTest sees:

```text
$ ctest -N
  Test #1: wrap_pi folds angles into the range -pi to pi
  Test #2: rk4_decay matches exp(lambda t)

Total Tests: 2
```

and running the program directly:

```text
$ ./tests/catch_tests
Randomness seeded to: 3446605162
===============================================================================
All tests passed (5 assertions in 2 test cases)
```

Five assertions: two from the sections and three from the generated rows, $2 + 3 = 5$. Notice that CTest sees two tests, not five. Catch2's discovery works at the level of `TEST_CASE`; sections and generated rows run inside it.
:::

Here is how the pieces map across. A Catch2 **test case** is named by a free-form string, so it can be a sentence. The **tags** in square brackets, like `[unit]`, play the role of both suites and labels: `./catch_tests "[rk4]"` runs every test tagged `rk4`. **`REQUIRE`** stops the test case on failure and **`CHECK`** records the failure and carries on, which is the same split as `ASSERT` and `EXPECT`. A **`SECTION`** replaces the fixture: Catch2 runs the test case from the top once for each section, so the code above a section is fresh setup for every section. `GENERATE` plays the part of `TEST_P`.

Catch2's party trick is **[[expression decomposition|decomposition]]**. You write an ordinary comparison, and on failure it shows both sides:

```text
fail.cpp:6: FAILED:
  CHECK( bad_reads == 0 )
with expansion:
  3 == 0

fail.cpp:7: FAILED:
  CHECK( nav::wrap_pi(7.0) < 0.5 )
with expansion:
  0.7168146928 < 0.5
```

GoogleTest gets the same information only if you pick the right macro: `EXPECT_TRUE(bad_reads == 0)` says only "Actual: false", while `EXPECT_EQ(bad_reads, 0)` shows "Which is: 3". Catch2 makes the pleasant form the only form.

So what does Catch2 trade away? For flight software, three things stand out.

1. **No mocking.** Catch2 has nothing like GoogleMock. Teams that use it pair it with a separate mocking library such as [[trompeloeil|trompeloeil]]. Everything in the last two lessons would need a second tool with its own syntax.
2. **No death tests.** Catch2 cannot check that a contract violation terminates the process, the way lesson 05 did.
3. **Coarser CTest granularity by default.** As the example showed, CTest sees test cases, not sections or generated rows. A failing row is named inside the log (that is what `CAPTURE` is for), not in the CI summary. You can split cases apart, but GoogleTest's `TEST_P` gives you the per-case CTest entry for free.

In return you get sentence-style names, nicer failure output from plain comparisons, sections instead of fixture classes, and a built-in micro-benchmark macro. Catch2 version 3 is a compiled library; version 2 was a single header, which made it easy to drop into a project but slow to compile. Neither framework is wrong. Teams that lean on mocks and death tests, as most flight-software teams do, tend to choose GoogleTest; teams writing mostly pure algorithms sometimes prefer Catch2's lighter feel.

::: warning
Catch2 test names are free text, and some characters confuse the tooling. A first draft of the example named a test `"wrap_pi folds angles into (-pi, pi]"`; with Catch2 3.4 and CMake 3.28, the square bracket and the list handling inside `catch_discover_tests` merged both test cases into one garbled CTest entry that failed. Keep names to letters, digits, spaces and plain punctuation, and run `ctest -N` to check.
:::

## Check yourself

::: check
A colleague registers a GoogleTest program with `add_test(NAME all COMMAND unit_tests)`. The program has 150 tests; one of them, `Ekf.RejectsNaNMeasurement`, fails in CI. What does the CI summary show, and what does it show after switching to `gtest_discover_tests(unit_tests)`?
:::

::: answer
With one `add_test`, CTest knows one test, named `all`. The summary says `all` failed, and someone has to open the log to learn which of 150 tests broke. After switching, CTest has 150 entries, each named after its GoogleTest test, and the summary names `Ekf.RejectsNaNMeasurement` directly. As a bonus, `ctest -j` can run the 150 in parallel, `ctest --rerun-failed` re-runs only that one, and `-R`, `-E`, `-L` can pick tests individually.
:::

::: check
Write a `--gtest_filter` that runs every test in suites `Ekf` and `Ukf` except any test whose name contains `Slow`.
:::

::: answer
`--gtest_filter='Ekf.*:Ukf.*-*Slow*'`. The part before the `-` is the list of positive patterns, separated by a colon: `Ekf.*` and `Ukf.*`. The part after the `-` lists patterns to exclude; `*Slow*` matches any name with `Slow` anywhere in it. Quote the whole thing so the shell does not try to expand the stars as file names.
:::

::: check
Your test program is cross-compiled for an ARM flight computer and built on an x86 laptop. The build fails at the `gtest_discover_tests` step. Why, and what are two fixes?
:::

::: answer
Discovery runs the freshly built test program with `--gtest_list_tests` as a post-build step. An ARM program cannot run on the x86 build machine, so that step fails. Fix one: set `CROSSCOMPILING_EMULATOR` (for example to QEMU for ARM) so CMake runs the program under an emulator. Fix two: pass `DISCOVERY_MODE PRE_TEST`, so the listing happens when `ctest` runs, on the target or a machine that can run it. A third, older option is `gtest_add_tests`, which scans source and never runs the program, at the cost of merging parameterized cases.
:::

::: check
Your project has fast unit tests, slow soak tests and hardware-in-the-loop tests. Sketch the CMake and the three `ctest` commands for "every push", "nightly" and "lab machine".
:::

::: answer
Give each test program its own label through discovery:

```cmake
gtest_discover_tests(unit_tests PROPERTIES LABELS "unit")
gtest_discover_tests(soak_tests PROPERTIES LABELS "slow" TIMEOUT 600)
gtest_discover_tests(hil_tests  PROPERTIES LABELS "hil")
```

Every push: `ctest -L unit -j 8 --output-on-failure`. Nightly: `ctest -L slow --output-on-failure` (or `ctest -LE hil` to run everything that does not need hardware). Lab machine: `ctest -L hil --output-on-failure`. The tests and the CMake are the same everywhere; only the label selection changes.
:::

::: check
Name two things a flight-software team would lose by moving from GoogleTest to Catch2, and one thing it would gain.
:::

::: answer
Losses: there is no built-in mocking, so the sensor and actuator mocks from GoogleMock would need a separate library such as trompeloeil; and there are no death tests, so checking that a contract violation aborts would need another approach. A third: by default CTest sees one entry per `TEST_CASE`, so generated rows and sections are not reported by name in the CI summary. A gain: expression decomposition, so `CHECK(a == b)` prints both values on failure without choosing a special macro, plus readable sentence-style test names and sections instead of fixture classes.
:::

## Summary

| Idea | In one line |
| --- | --- |
| `gtest_discover_tests` | runs the built program with `--gtest_list_tests`, one CTest test per name |
| `NO_PRETTY_VALUES` | keeps custom parameterized names clean in CTest |
| `gtest_add_tests` | scans source at configure time; merges `TEST_P` cases into one wildcard entry |
| `DISCOVERY_MODE PRE_TEST` | lists tests at `ctest` time, for cross-compiled programs |
| `--gtest_filter` | wildcards: `*`, `?`, `:` between patterns, `-` to exclude |
| `ctest -R` / `-E` | include / exclude by regular expression on the name |
| `LABELS`, `ctest -L` / `-LE` | tag tests into groups, then run or skip a group |
| `--output-junit` | per-test XML report for CI |
| Catch2 | string names, tags, `REQUIRE`/`CHECK`, sections, expression decomposition |
| Catch2 trades | no mocking, no death tests, CTest sees test cases, not rows |

The next lesson, *Coverage and sanitizers in the test matrix*, uses these labels and CTest runs to find out which lines and branches your tests never touch, and runs the whole suite under sanitizers so that hidden undefined behavior turns into a named, failing test.

::: context soak-test Running long on purpose
A soak test runs something many times, or for a long time, to catch problems that only appear slowly: a value that drifts, a counter that overflows, memory that leaks a few bytes per call, an angle that creeps out of range after millions of updates. Flight software runs for hours or months without a restart, so a bug that needs ten million iterations to show itself is a real bug. Soak tests are too slow for every push, which is exactly why they get their own label.
:::

::: context hex-dump Reading a hex dump
When GoogleTest cannot print a value, it shows the raw bytes in hexadecimal, base 16, where the digits run 0 to 9 then A to F. Each pair such as `9A` is one byte. The `Case` struct here has four members of 8 bytes each: a pointer for the name and three `double`s, 32 bytes in all. The first 8 bytes are a memory address, which changes from run to run, which is one more reason a CTest name should never contain them. Teaching GoogleTest to print your type, with a `PrintTo` function, makes messages friendlier, but discovery with a custom name generator still wants `NO_PRETTY_VALUES`.
:::

::: context cross-compile Building on one machine, running on another
Cross-compiling means the compiler runs on one kind of processor, usually an x86 laptop or CI server, and produces a program for another, such as the ARM chip in a flight computer. You met toolchain files for this in the CMake module. The produced program cannot run on the build machine at all, which is why a build step that runs it, such as test discovery, needs an emulator or must move to the target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="130" height="60" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="75" y="65" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">x86 build host</text>
  <text x="75" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">compiler runs here</text>
  <rect x="220" y="40" width="130" height="60" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="285" y="65" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">ARM target</text>
  <text x="285" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">program runs here</text>
  <line x1="140" y1="70" x2="210" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="220,70 208,64 208,76" fill="#1f2a44"/>
  <text x="180" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">binary</text>
  <text x="75" y="126" font-size="11" text-anchor="middle" fill="#b4232c">cannot run it</text>
  <text x="285" y="126" font-size="11" text-anchor="middle" fill="#1d6fd1">PRE_TEST lists here</text>
</svg>
```
:::

::: context regex A pattern language for text
A regular expression describes a set of strings. `Wrap` matches any name containing "Wrap"; `^Wrap` only names that start with it; `growth$` only names that end with it; `a|b` either one; `.` any single character; `.*` any run of characters. CTest's `-R`, `-E`, `-L` and `-LE` all take regular expressions, which is why `-L unit` also selects a label called `unit_slow`. Write `-L '^unit$'` when you mean exactly one label.
:::

::: context label-scheme A small, boring set of labels
Labels are most useful when there are few of them and everyone knows what each means. A common set: `unit` for fast tests with no outside dependencies, `integration` for tests that combine several components, `slow` for anything over a few seconds, and `hil` for anything that needs the lab rig. A test can carry more than one label. Resist inventing a label per feature; that is what test names and `-R` are for. The goal is that anyone can predict, from the label alone, how long a run will take and what equipment it needs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="100" height="32" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">every push</text>
  <rect x="10" y="64" width="100" height="32" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">nightly</text>
  <rect x="10" y="116" width="100" height="32" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="137" font-size="12" text-anchor="middle" fill="#1f2a44">lab machine</text>
  <line x1="110" y1="28" x2="170" y2="28" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="80" x2="170" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="132" x2="170" y2="132" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="178" y="33" font-size="12" fill="#1f2a44">ctest -L unit -j 8</text>
  <text x="178" y="85" font-size="12" fill="#1f2a44">ctest -L slow</text>
  <text x="178" y="137" font-size="12" fill="#1f2a44">ctest -L hil</text>
</svg>
```
:::

::: context junit Why a Java name shows up in C++
JUnit is a unit-testing framework for Java. Its XML report format, one `testcase` element per test with a pass, fail or skip result, became a common language that CI servers understand, whatever language the tests were written in. GoogleTest can write it too, with `--gtest_output=xml`, but for a CTest run the single report from `ctest --output-junit` covers every program at once and carries each test's labels.
:::

::: context decomposition How Catch2 sees both sides
A macro receives `bad_reads == 0` as one expression, and C++ would normally evaluate it to a single `true` or `false`, losing the 3. Catch2 rewrites it as `Decomposer() <= bad_reads == 0`. Because `<=` binds more tightly than `==`, C++ first evaluates `Decomposer() <= bad_reads`, which captures the left value in a small object. That object has its own `operator==`, which captures the right value and the comparison. On failure, both captured values are printed. It is a clever use of operator precedence, and it is why a chained expression such as `a == b && c` cannot be decomposed.
:::

::: context trompeloeil A painting that fools the eye
Trompe-l'oeil is French for "deceive the eye": a painting so realistic that a flat wall seems to have a window in it. The C++ mocking library borrows the name because a mock deceives the code under test in the same way. It is header-only, works with Catch2, doctest or GoogleTest, and has its own syntax for expectations. The ideas carry over directly from GoogleMock: expected calls, argument matchers, return values and call counts.
:::
