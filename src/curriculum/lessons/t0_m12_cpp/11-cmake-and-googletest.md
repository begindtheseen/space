---
id: l11-cmake-and-googletest
title: Building with CMake and testing with GoogleTest
minutes: 28
covers:
  - CMake, with Bazel awareness
  - GoogleTest
---

A single `g++` command stops being a build system at the second source file. A real flight-software repository has hundreds of translation units grouped into libraries, a test binary for each library, three compilers — the host GCC, the host Clang with sanitizers for continuous integration, and the cross-compiler for the flight processor — and a configuration for each. Something has to describe that structure once, rebuild only what changed, and produce the same binary on every developer's machine and on the build server. In most C++ codebases that something is CMake; in some large organisations it is Bazel. The tests those builds run are, overwhelmingly, GoogleTest.

The Python module gave you `pytest`: write a function whose name starts with `test_`, assert inside it, run `pytest`. GoogleTest is the same idea with more ceremony and more precision — a family of assertion macros that know how to compare floating-point numbers with tolerances, fixtures that share set-up between tests, and a runner that filters, repeats and shuffles. The ceremony pays for itself the first time a test named `Orbit.CircularOrbitEnergyIsMinusHalfVSquared` fails on a build server and the message tells you both values, the tolerance, and the line.

This lesson builds the library from the previous lessons into a CMake project, adds a GoogleTest binary, runs it through `ctest`, and shows what the output of a passing and a failing suite looks like. Every exercise in this module needs exactly this.

## What a build system does

A build is a dependency graph: sources compile to object files, object files link into libraries, libraries and more objects link into executables, and a change to a header must recompile every translation unit that includes it and nothing else. A build system stores that graph, tracks which outputs are older than their inputs, and runs the minimum set of commands — with the right flags, include paths and libraries for each target.

CMake does not build anything itself. It is a *generator*: it reads a description of the targets in `CMakeLists.txt` files and writes build files for a native tool — Ninja, or Makefiles — which then does the work. That gives a three-step rhythm you will type many times a day:

```text
$ cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release    (configure: generate build/ from CMakeLists.txt)
$ cmake --build build                                        (build: run ninja in build/)
$ ctest --test-dir build                                     (test: run every registered test)
```

The build directory is separate from the sources, so several can coexist — `build-release`, `build-debug`, `build-asan`, `build-flight` — each configured differently from the same source tree. Nothing generated is ever committed.

## A minimal modern CMake project

Here is the project this lesson builds, with the orbit functions from lesson 1 as the library:

```text
gnc_core/
  CMakeLists.txt
  include/gnc/orbit.hpp
  src/orbit.cpp
  test/test_orbit.cpp
```

```cmake
cmake_minimum_required(VERSION 3.20)
project(gnc_core CXX)

add_library(core src/orbit.cpp)
target_include_directories(core PUBLIC include)
target_compile_features(core PUBLIC cxx_std_20)
target_compile_options(core PRIVATE -Wall -Wextra -Werror)

find_package(GTest REQUIRED)
enable_testing()
add_executable(tests test/test_orbit.cpp)
target_link_libraries(tests PRIVATE core GTest::gtest_main)
include(GoogleTest)
gtest_discover_tests(tests)
```

Every line does one thing. `cmake_minimum_required` pins the CMake language version so that behaviour does not shift under you. `project` names the project and declares the language. `add_library(core src/orbit.cpp)` creates a library *target* from its sources — a static library by default, which is what a flight binary links; `add_library(core STATIC ...)` says so explicitly. Everything that follows attaches properties to targets, never to the whole project.

The keyword after the target name is the important idea in modern CMake. `PUBLIC` means "this target needs it, and so does anything that links to this target": the `include` directory is `PUBLIC` because the test binary needs `gnc/orbit.hpp` too, and so is the C++20 requirement, because a consumer compiled as C++14 could not include the header. `PRIVATE` means "this target only": the warning flags apply when compiling `core`, but a downstream project with its own warning policy is not forced to inherit them. `INTERFACE` means "consumers only, not this target" and is how header-only libraries such as Eigen are expressed. These propagated properties are called *usage requirements*, and they are why you never see `include_directories()` or a global `CMAKE_CXX_FLAGS` in well-written CMake: those set state for every target in the directory, which is exactly the coupling the target model was designed to remove.

`find_package(GTest REQUIRED)` locates an installed GoogleTest and defines the imported target `GTest::gtest_main`, which carries its own include paths and libraries as usage requirements, so the single `target_link_libraries` line gives the test binary everything: the `core` library, its public headers, its C++20 requirement, and GoogleTest with a ready-made `main`. `enable_testing()` turns on `ctest`, and `gtest_discover_tests(tests)` runs the binary once after it is built to list its tests and registers each with `ctest` by name.

::: key
Minimal modern CMake for a library plus a test binary: `cmake_minimum_required(VERSION 3.20)` · `project(x CXX)` · `add_library(core src/core.cpp)` · `target_include_directories(core PUBLIC include)` · `target_compile_features(core PUBLIC cxx_std_20)` · `add_executable(tests test/test_core.cpp)` · `target_link_libraries(tests PRIVATE core GTest::gtest_main)`.
:::

::: example Configure, build, test
```text
$ cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
-- Configuring done (0.3s)
-- Generating done (0.0s)
-- Build files have been written to: .../gnc_core/build
$ cmake --build build
[3/4] Building CXX object CMakeFiles/tests.dir/test/test_orbit.cpp.o
[4/4] Linking CXX executable tests
$ ctest --test-dir build
    Start 1: Orbit.CircularSpeedAt400km
1/5 Test #1: Orbit.CircularSpeedAt400km .....................   Passed    0.00 sec
    Start 2: Orbit.PeriodMatchesKeplersThirdLaw
2/5 Test #2: Orbit.PeriodMatchesKeplersThirdLaw .............   Passed    0.00 sec
    Start 3: Orbit.CircularOrbitEnergyIsMinusHalfVSquared
3/5 Test #3: Orbit.CircularOrbitEnergyIsMinusHalfVSquared ...   Passed    0.00 sec
    Start 4: OrbitFamily.SpeedFallsWithRadius
4/5 Test #4: OrbitFamily.SpeedFallsWithRadius ...............   Passed    0.00 sec
    Start 5: OrbitFamily.PeriodGrowsWithRadius
5/5 Test #5: OrbitFamily.PeriodGrowsWithRadius ..............   Passed    0.00 sec

100% tests passed, 0 tests failed out of 5
```

Four build steps: two objects, one library, one executable. Change `src/orbit.cpp` and only the library and the link rerun; change `include/gnc/orbit.hpp` and both objects recompile because both include it — the dependency graph at work. `ctest` knows the five test names because `gtest_discover_tests` asked the binary for them, and a build server reads its exit code.
:::

Three more pieces of CMake vocabulary you will meet immediately. `CMAKE_BUILD_TYPE` selects `Debug` (`-O0 -g`), `Release` (`-O3 -DNDEBUG`) or `RelWithDebInfo` (`-O2 -g -DNDEBUG`); the sanitizer build of lesson 12 is a fourth configuration you add yourself with an `option()` that appends `-fsanitize=address,undefined` through `target_compile_options` and `target_link_options`. A *toolchain file*, passed as `-DCMAKE_TOOLCHAIN_FILE=arm-flight.cmake`, tells CMake which cross-compiler, sysroot and flags to use, and is how the same `CMakeLists.txt` produces the flight binary. And `FetchContent` downloads a dependency at configure time from a pinned Git tag, which is how most projects obtain GoogleTest when it is not installed:

```cmake
include(FetchContent)
FetchContent_Declare(googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG v1.14.0)
FetchContent_MakeAvailable(googletest)
```

after which `GTest::gtest_main` exists exactly as it did with `find_package`. Eigen is found the same way, `find_package(Eigen3 REQUIRED)` and `target_link_libraries(core PUBLIC Eigen3::Eigen)`, with `PUBLIC` because the library's headers include Eigen's.

::: warning
Do not collect sources with `file(GLOB ...)`. CMake evaluates the glob at configure time, so a newly added `.cpp` file is not built until someone reconfigures, and the resulting "undefined reference" is confusing. List sources explicitly; the extra line per file is the point.
:::

## Bazel awareness

Bazel is the open-source form of Google's internal build system, and several large aerospace and robotics organisations build their flight and simulation code with it. You are not expected to write Bazel in this module, but you should be able to read a `BUILD` file and understand why a project would choose it.

Where CMake generates a native build from a flexible scripting language, Bazel *is* the build tool and is deliberately strict. Every package directory has a `BUILD` file declaring targets with their sources and their dependencies, and nothing else: a target can see only the headers of the targets it lists in `deps`. Builds run in a sandbox with a pinned, downloaded toolchain, so the compiler, the flags and every dependency are identical on every machine — a *hermetic* build. The output of every action is cached by a hash of its inputs, locally and on a shared remote cache, so a build server and a developer never redo work either has done. The same three commands do everything: `bazel build //gnc/...`, `bazel test //...`, `bazel run //tools:monte_carlo`.

The library and test above would read, in Bazel:

```text
cc_library(
    name = "core",
    srcs = ["src/orbit.cpp"],
    hdrs = ["include/gnc/orbit.hpp"],
    includes = ["include"],
    copts = ["-std=c++20", "-Wall", "-Wextra", "-Werror"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "orbit_test",
    srcs = ["test/test_orbit.cpp"],
    deps = [":core", "@googletest//:gtest_main"],
)
```

`cc_library`, `cc_binary` and `cc_test` map directly onto `add_library`, `add_executable` and a test target; `deps` is `target_link_libraries` with the usage requirements enforced rather than propagated; `@googletest` is an external dependency declared once, in `MODULE.bazel`, at a pinned version. The reason a flight organisation accepts Bazel's learning curve is reproducibility: when a binary that flew must be rebuilt bit-for-bit a year later for an investigation, a hermetic build with a pinned toolchain can do it, and a CMake build on whatever compiler the machine happens to have often cannot. CMake projects reach the same goal with toolchain files, containers and discipline; Bazel makes it the default. The two systems are not otherwise in competition — most open-source C++ is CMake, and a GNC engineer reads both.

## GoogleTest

A GoogleTest test is a function declared with the `TEST(SuiteName, TestName)` macro, containing assertions. The library provides `main` through `gtest_main`, discovers every `TEST` at start-up, and runs them all, printing a line per test and a summary. The assertions come in two families, and knowing when to use which is the first thing an interviewer checks.

::: key
GoogleTest: `ASSERT_*` aborts the current test function on failure — use it when continuing would crash or be meaningless; `EXPECT_*` records the failure and continues, so one run reports several problems. For floats use `EXPECT_NEAR` or `EXPECT_DOUBLE_EQ`.
:::

The common assertions: `EXPECT_TRUE(c)`, `EXPECT_FALSE(c)`; `EXPECT_EQ(a, b)`, `EXPECT_NE`, `EXPECT_LT`, `EXPECT_LE`, `EXPECT_GT`, `EXPECT_GE`; for floating point, `EXPECT_NEAR(a, b, abs_tol)` with an explicit tolerance and `EXPECT_DOUBLE_EQ(a, b)`, which accepts a difference of up to four units in the last place — enough to absorb rounding, tight enough to catch a real error; and `EXPECT_DEATH(statement, regex)` for code that is supposed to abort, such as the allocation guard of lesson 9 firing. Every assertion accepts a streamed message, `<< "at i = " << i`, printed only on failure.

::: example A test file with a fixture
```cpp
#include <gtest/gtest.h>

#include <cmath>

#include "gnc/orbit.hpp"

namespace {

constexpr double kLeoRadius = 6378.137e3 + 400.0e3;   // m

TEST(Orbit, CircularSpeedAt400km) {
  EXPECT_NEAR(gnc::circular_speed(kLeoRadius), 7668.6, 0.1);
}

TEST(Orbit, PeriodMatchesKeplersThirdLaw) {
  const double T = gnc::orbital_period(kLeoRadius);
  EXPECT_NEAR(T, 5553.6, 0.1);
  // T^2 / r^3 = 4 pi^2 / mu, to floating-point precision
  EXPECT_DOUBLE_EQ(T * T / std::pow(kLeoRadius, 3), 4.0 * M_PI * M_PI / gnc::kMuEarth);
}

TEST(Orbit, CircularOrbitEnergyIsMinusHalfVSquared) {
  const double v = gnc::circular_speed(kLeoRadius);
  const double e = gnc::specific_energy(kLeoRadius, v);
  EXPECT_LT(e, 0.0);                                // bound orbit
  EXPECT_NEAR(e, -0.5 * v * v, 1e-6 * std::abs(e)); // relative tolerance
}

// A fixture: shared set-up for several tests over the same object.
class OrbitFamily : public ::testing::Test {
 protected:
  void SetUp() override {
    for (int i = 0; i < 4; ++i) radii_m[i] = 6.6e6 + 1.0e6 * i;
  }
  double radii_m[4]{};
};

TEST_F(OrbitFamily, SpeedFallsWithRadius) {
  for (int i = 1; i < 4; ++i) {
    ASSERT_GT(radii_m[i], radii_m[i - 1]) << "fixture radii must increase";
    EXPECT_LT(gnc::circular_speed(radii_m[i]), gnc::circular_speed(radii_m[i - 1])) << "at i = " << i;
  }
}

TEST_F(OrbitFamily, PeriodGrowsWithRadius) {
  for (int i = 1; i < 4; ++i) {
    EXPECT_GT(gnc::orbital_period(radii_m[i]), gnc::orbital_period(radii_m[i - 1]));
  }
}

}  // namespace
// $ ./build/tests
// [==========] Running 5 tests from 2 test suites.
// [----------] 3 tests from Orbit
// [ RUN      ] Orbit.CircularSpeedAt400km
// [       OK ] Orbit.CircularSpeedAt400km (0 ms)
// [ RUN      ] Orbit.PeriodMatchesKeplersThirdLaw
// [       OK ] Orbit.PeriodMatchesKeplersThirdLaw (0 ms)
// [ RUN      ] Orbit.CircularOrbitEnergyIsMinusHalfVSquared
// [       OK ] Orbit.CircularOrbitEnergyIsMinusHalfVSquared (0 ms)
// [----------] 2 tests from OrbitFamily
// [ RUN      ] OrbitFamily.SpeedFallsWithRadius
// [       OK ] OrbitFamily.SpeedFallsWithRadius (0 ms)
// [ RUN      ] OrbitFamily.PeriodGrowsWithRadius
// [       OK ] OrbitFamily.PeriodGrowsWithRadius (0 ms)
// [==========] 5 tests from 2 test suites ran. (0 ms total)
// [  PASSED  ] 5 tests.
```

The three plain tests each check one property of the library: a known value, an algebraic identity (Kepler's third law, $T^2/r^3 = 4\pi^2/\mu$, which `EXPECT_DOUBLE_EQ` can hold to rounding because both sides are computed from the same constants), and a relationship between two functions with a *relative* tolerance, $10^{-6}$ of the value, because an absolute tolerance on a number of magnitude $3 \times 10^7$ would be meaningless. The fixture `OrbitFamily` derives from `::testing::Test`, fills its array in `SetUp`, and each `TEST_F` gets a fresh instance — tests never share state. Inside the loop, `ASSERT_GT` guards the fixture's precondition: if the radii were not increasing, the comparison that follows would be meaningless, so the test should stop. The `EXPECT_LT` after it records and continues, so a failure at `i = 2` would still let `i = 3` be checked, and the streamed `"at i = "` says which.

Run only the fixture's tests with `./build/tests --gtest_filter='OrbitFamily.*'`; run everything a hundred times in random order with `--gtest_repeat=100 --gtest_shuffle` to flush out tests that depend on each other. `M_PI` is a POSIX constant; on a compiler without it, write the digits.
:::

::: example What failure looks like
```cpp
TEST(Orbit, WrongExpectation) {
  const double v = gnc::circular_speed(6778.137e3);
  EXPECT_NEAR(v, 7700.0, 1.0) << "circular speed at 400 km";
  EXPECT_DOUBLE_EQ(0.1 + 0.2, 0.3);
  EXPECT_EQ(2 + 2, 4);
}
TEST(Orbit, AssertStopsTheTest) {
  double* table = nullptr;
  ASSERT_NE(table, nullptr) << "table not loaded";
  EXPECT_GT(table[0], 0.0);      // never reached: ASSERT_NE returned from the test
}
// Output:
// [ RUN      ] Orbit.WrongExpectation
// test/test_fail.cpp:6: Failure
// The difference between v and 7700.0 is 31.441824592944613, which exceeds 1.0, where
// v evaluates to 7668.5581754070554,
// 7700.0 evaluates to 7700, and
// 1.0 evaluates to 1.
// circular speed at 400 km
//
// [  FAILED  ] Orbit.WrongExpectation (0 ms)
// [ RUN      ] Orbit.AssertStopsTheTest
// test/test_fail.cpp:12: Failure
// Expected: (table) != (nullptr), actual: NULL vs (nullptr)
// table not loaded
//
// [  FAILED  ] Orbit.AssertStopsTheTest (0 ms)
// [  FAILED  ] 2 tests, listed below:
// [  FAILED  ] Orbit.WrongExpectation
// [  FAILED  ] Orbit.AssertStopsTheTest
//
//  2 FAILED TESTS
```

The `EXPECT_NEAR` message gives the two values, the difference and the tolerance — everything needed to decide whether the code or the expectation is wrong (here the expectation: 7700 was a guess, 7668.6 is the value). The same test's `EXPECT_DOUBLE_EQ(0.1 + 0.2, 0.3)` *passed*: the two doubles differ by one unit in the last place, within the four the macro allows, whereas `EXPECT_EQ` would have failed. And the second test shows `ASSERT_NE` doing its job: with the pointer null, continuing to `table[0]` would have crashed the whole binary and taken every later test with it, so the assertion returned from the test function instead and the failure was reported cleanly.
:::

::: warning
Never compare floating-point results with `EXPECT_EQ`. Two computations that are mathematically equal differ in the last bits after different operation orders, and the test fails intermittently with compiler version and optimisation level. Use `EXPECT_NEAR` with a tolerance you can justify — absolute for quantities near zero, relative (a fraction of the magnitude) otherwise — or `EXPECT_DOUBLE_EQ` when the two sides should agree to rounding.
:::

### Testing numerical flight code

What to test is a harder question than how. The tests that catch real GNC bugs are of four kinds. **Known values**: a circular speed, a published CRC check value, a rotation of a unit vector. **Invariants and conservation laws**: specific energy over one orbit, the norm of a quaternion after ten thousand updates, the symmetry of a covariance matrix. **Agreement with a reference**: your Python propagator's output, stored as a data file and compared to $10^{-10}$, which is what the first exercise asks for. **Non-functional properties**: the allocation counter from lesson 9 wrapped as `EXPECT_EQ(g_allocations, 0)` around the propagation loop, timing bounds, and compile-time facts through `static_assert`, which needs no test framework at all. A continuous-integration server runs the whole suite in Debug, in Release and under the sanitizers of the next lesson, on every commit.

## Check yourself

::: check
Why is `include` declared `PUBLIC` in `target_include_directories(core PUBLIC include)`, and what would break if it were `PRIVATE`?
:::

::: answer
`PUBLIC` makes the include directory a usage requirement: `core` needs it to compile its own sources, and every target that links `core` inherits it. `test/test_orbit.cpp` includes `gnc/orbit.hpp`, so with `PRIVATE` the test target would not receive the `-I include` flag and would fail to compile with "no such file or directory" for the header. `PRIVATE` is right for things only the library's own sources need, such as an internal header directory or the warning flags.
:::

::: check
A test loads a gain table, checks that the loading succeeded, and then checks that every gain is positive. Which assertion family goes on the load check, which on the gain checks, and why?
:::

::: answer
`ASSERT_TRUE` (or `ASSERT_NE` against null) on the load: if the table did not load, indexing it would dereference garbage or a null pointer and crash the whole test binary, so the test must stop there. `EXPECT_GT` on each gain: one bad gain should not hide others, and `EXPECT_*` records every failure and keeps going, so a single run reports all of them with their indices in the streamed message.
:::

::: check
`EXPECT_DOUBLE_EQ(0.1 + 0.2, 0.3)` passes but `EXPECT_EQ(0.1 + 0.2, 0.3)` fails. Explain both results.
:::

::: answer
In binary floating point, `0.1 + 0.2` evaluates to `0.30000000000000004`, one unit in the last place above the nearest double to `0.3`. `EXPECT_EQ` compares with `==`, which is exact, so it fails. `EXPECT_DOUBLE_EQ` treats two doubles as equal if they are within four units in the last place of each other, absorbing exactly this kind of rounding while still detecting any genuine difference, so it passes. For results that are expected to differ by more than rounding — an integrator against an analytic solution — `EXPECT_NEAR` with an explicit tolerance is the right tool.
:::

::: check
Sketch the CMake needed to build the test binary with AddressSanitizer and UndefinedBehaviorSanitizer when a cache option `GNC_SANITIZE` is on.
:::

::: answer
```cmake
option(GNC_SANITIZE "Build with ASan and UBSan" OFF)
if(GNC_SANITIZE)
  target_compile_options(tests PRIVATE -fsanitize=address,undefined -fno-omit-frame-pointer -g)
  target_link_options(tests PRIVATE -fsanitize=address,undefined)
endif()
```
Configure a separate build directory with `cmake -S . -B build-asan -DGNC_SANITIZE=ON` and run `ctest --test-dir build-asan`. The flag must appear at both compile and link time, and in practice you apply it to `core` as well (or to every target through a small helper function) so that the library code is instrumented too.
:::

::: check
An accident investigation needs the exact binary that flew eighteen months ago rebuilt from the tagged source. Why is that routine with a hermetic Bazel build and difficult with an ordinary CMake build, and how do CMake projects close the gap?
:::

::: answer
A hermetic build pins the compiler, the standard library, every dependency and every flag as inputs to the build, downloaded and sandboxed by the build tool itself, so the same source hash produces the same bytes on any machine. An ordinary CMake build uses whatever compiler and libraries the machine has; eighteen months later those have changed, and the binary differs in ways that may or may not matter. CMake projects close the gap with a toolchain file naming an exact compiler, a container image or archived toolchain that provides it, pinned dependency versions (`FetchContent` with a tag, or vendored sources), and a recorded configure command — reproducibility by discipline rather than by default.
:::

## Summary

| Item | Meaning |
| --- | --- |
| configure / build / test | `cmake -S . -B build -G Ninja` · `cmake --build build` · `ctest --test-dir build` |
| target | a library or executable; all properties attach to targets, never globally |
| `PUBLIC` / `PRIVATE` / `INTERFACE` | this target and consumers / this target only / consumers only |
| `target_include_directories`, `target_compile_features`, `target_compile_options`, `target_link_libraries` | the four property commands |
| `find_package(GTest)` / `FetchContent` | installed dependency / downloaded at a pinned tag; both give `GTest::gtest_main` |
| `CMAKE_BUILD_TYPE` | `Debug`, `Release`, `RelWithDebInfo`; add a sanitizer option yourself |
| toolchain file | how one `CMakeLists.txt` produces the flight binary with a cross-compiler |
| Bazel `cc_library` / `cc_test` / `deps` | hermetic, sandboxed, cached builds; reproducible by default |
| `TEST(Suite, Name)`, `TEST_F(Fixture, Name)` | a test; a test with shared `SetUp` |
| `ASSERT_*` vs `EXPECT_*` | stop the test / record and continue |
| `EXPECT_NEAR(a, b, tol)`, `EXPECT_DOUBLE_EQ(a, b)` | tolerance you choose / four units in the last place |
| `--gtest_filter`, `--gtest_repeat`, `--gtest_shuffle` | run a subset; hunt order dependence |

The next lesson is about the bugs the compiler is allowed not to tell you about — undefined behaviour — and the sanitizer builds that make the test binary you have just created report them.
