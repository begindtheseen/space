---
id: l11-cmake-and-googletest
title: Building with CMake and testing with GoogleTest
minutes: 22
covers:
  - CMake, with Bazel awareness
  - GoogleTest
---

Think of a big kitchen on a busy night. A recipe for one dish fits on a card. A restaurant needs more: which dishes depend on which sauces, which sauce has to be remade when the stock changes, and the same result no matter which cook is on shift. Someone writes that down once, and everyone follows it.

A single `g++` command is the recipe card. It stops working at the second source file. A real flight-software repository has hundreds of **[[translation units|translation-unit]]** — source files the compiler turns into machine code one at a time — grouped into libraries, with a test program for each library. It is built with three compilers: the everyday GCC, Clang with sanitizers for automatic checks, and the compiler for the flight processor. Something has to describe that structure once, rebuild only what changed, and produce the same program on every laptop and on the build server. That something is a **build system**. In most C++ code it is **CMake**; in some large organizations it is **Bazel**.

The tests those builds run are almost always written with **GoogleTest**. You met `pytest` in the Python module: write a function whose name starts with `test_`, assert inside it, run `pytest`. GoogleTest is the same idea with more ceremony and more precision. It has assertions that compare decimals with tolerances, shared set-up between tests, and a runner that can filter, repeat and shuffle. The ceremony pays for itself the first time a test fails on a build server and the message tells you both values, the tolerance and the line.

This lesson turns the orbit functions from lesson 1 into a CMake project, adds a GoogleTest program, runs it through `ctest`, and shows what passing and failing output look like. Every exercise in this module needs exactly this.

## What a build system does

A build is a chain of steps. Source files compile to **object files** (machine code for one file). Object files link into **libraries** (bundles of object files) and **executables** (runnable programs). If you edit a header, every source file that includes it must recompile — and nothing else should.

Drawn out, those steps form a **[[dependency graph|dependency-graph]]**: arrows from each input to each output. A build system stores that graph, notices which outputs are older than their inputs, and runs the fewest commands needed, each with the right flags, folders and libraries.

CMake does not build anything itself. It is a **generator**: it reads a description of your targets from files named `CMakeLists.txt` and writes instructions for a native build tool — **[[Ninja|ninja]]**, or Make — which does the work. That gives a three-step rhythm you will type many times a day:

```text
$ cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release    (configure: generate build/ from CMakeLists.txt)
$ cmake --build build                                        (build: run ninja in build/)
$ ctest --test-dir build                                     (test: run every registered test)
```

Read `-S .` as "the source is here" and `-B build` as "put the build in the folder `build`". The build folder is separate from the source, so several can live side by side — `build-release`, `build-debug`, `build-asan`, `build-flight` — each set up differently from the same code. Nothing generated is ever committed to version control.

## A minimal modern CMake project

Here is the project. The library is the orbit code from lesson 1:

```text
gnc_core/
  CMakeLists.txt
  include/gnc/orbit.hpp
  src/orbit.cpp
  test/test_orbit.cpp
```

The header declares what the library offers:

```cpp
#pragma once
namespace gnc {
constexpr double kMuEarth = 3.986004418e14;  // m^3/s^2
double circular_speed(double radius_m);
double orbital_period(double radius_m);
double specific_energy(double radius_m, double speed_m_s);
}  // namespace gnc
```

And this is the whole build description:

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

Every line does one thing.

- `cmake_minimum_required` pins the version of the CMake language, so its behavior does not shift under you.
- `project` names the project and says the language is C++.
- `add_library(core src/orbit.cpp)` creates a library **target** — a named thing to build — from its sources. It is a static library by default, which is what a flight program links. `add_library(core STATIC ...)` says so out loud.
- Every line after that attaches a property *to a target*, never to the whole project.

### PUBLIC, PRIVATE, INTERFACE

The keyword after the target name is the big idea in modern CMake. It answers: who else needs this?

- **`PUBLIC`** — this target needs it, and so does anything that links to it. The `include` folder is `PUBLIC` because the test program needs `gnc/orbit.hpp` too. The C++20 requirement is `PUBLIC` because a user compiling as C++14 could not read the header.
- **`PRIVATE`** — this target only. The warning flags apply when compiling `core`, but a project that uses `core` keeps its own warning policy.
- **`INTERFACE`** — users only, not this target. This is how header-only libraries such as Eigen are described: there is nothing to compile, only folders and flags to pass along.

Properties passed along this way are called **[[usage requirements|usage-requirements]]**. They are why well-written CMake never uses `include_directories()` or a global `CMAKE_CXX_FLAGS`. Those set things for every target in the folder at once — exactly the tangle the target model was built to remove.

`find_package(GTest REQUIRED)` finds an installed GoogleTest and defines the target `GTest::gtest_main`. That target carries its own folders and libraries as usage requirements. So the one `target_link_libraries` line gives the test program everything: the `core` library, its public headers, its C++20 requirement, and GoogleTest with a ready-made `main`. `enable_testing()` turns on `ctest`. `gtest_discover_tests(tests)` runs the test program once after each build, asks it for its list of tests, and registers each one with `ctest` by name.

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
[1/4] Building CXX object CMakeFiles/core.dir/src/orbit.cpp.o
[2/4] Linking CXX static library libcore.a
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

Count the build steps: four. Two object files, one library, one executable.

Now watch the dependency graph work. Edit `src/orbit.cpp`, and only step 1, step 2 and the final link rerun. Edit `include/gnc/orbit.hpp`, and *both* object files recompile, because both source files include it. Edit nothing, and nothing runs.

`ctest` knows the five test names because `gtest_discover_tests` asked the program for them. A build server reads `ctest`'s exit code: zero means all passed.
:::

### Three more words you will meet right away

**Build types.** `CMAKE_BUILD_TYPE` picks a set of flags. `Debug` means no optimization, with debug information (`-g`). `Release` means `-O3 -DNDEBUG`. `RelWithDebInfo` means `-O2 -g -DNDEBUG`. The sanitizer build of lesson 12 is a fourth kind you add yourself, with an `option()` that adds `-fsanitize=address,undefined` through `target_compile_options` and `target_link_options`.

**Toolchain files.** A **toolchain file**, passed as `-DCMAKE_TOOLCHAIN_FILE=arm-flight.cmake`, tells CMake which **[[cross-compiler|cross-compiler]]**, system files and flags to use. It is how the same `CMakeLists.txt` produces the flight program.

**FetchContent.** `FetchContent` downloads a dependency while configuring, from a pinned Git tag. It is how most projects get GoogleTest when it is not installed:

```cmake
include(FetchContent)
FetchContent_Declare(googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG v1.14.0)
FetchContent_MakeAvailable(googletest)
```

After that, `GTest::gtest_main` exists exactly as it did with `find_package`. Eigen is found the same way — `find_package(Eigen3 REQUIRED)` and `target_link_libraries(core PUBLIC Eigen3::Eigen)` — with `PUBLIC` because the library's own headers include Eigen's.

::: warning
Do not collect source files with `file(GLOB ...)`. CMake runs the glob only when it configures, so a newly added `.cpp` file is not built until someone reconfigures, and the "undefined reference" error that follows is confusing. List every source file by name. The extra line per file is the point.
:::

## Bazel awareness

**Bazel** is the open-source version of Google's internal build system, and several large aerospace and robotics companies build their flight and simulation code with it. You will not write Bazel in this module. You should be able to read a `BUILD` file and know why a team would choose it.

CMake writes instructions for another tool, from a flexible scripting language. Bazel *is* the build tool, and it is strict on purpose.

- Every folder has a `BUILD` file that lists targets with their sources and their dependencies, and nothing else. A target can see only the headers of the targets it lists.
- Every build step runs in a sandbox, with a pinned compiler that Bazel downloads itself. The compiler, the flags and every dependency are identical on every machine. This is called a **[[hermetic|hermetic]]** build — sealed off from whatever else is on the computer.
- Every step's output is saved under a fingerprint of its inputs, on your machine and on a shared server. Nobody ever redoes work that anyone has already done.

The same three commands do everything: `bazel build //gnc/...`, `bazel test //...`, `bazel run //tools:monte_carlo`. The library and test above would read:

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

`cc_library`, `cc_binary` and `cc_test` match `add_library`, `add_executable` and a test target. `deps` is `target_link_libraries`, with the rules enforced rather than passed along. `@googletest` is an outside dependency declared once, in a file named `MODULE.bazel`, at a pinned version.

Why would a flight team accept Bazel's learning curve? Reproducibility. Suppose a program that flew must be rebuilt, byte for byte, a year later for an investigation. A hermetic build with a pinned compiler can do it. A CMake build on whatever compiler the machine has today often cannot. CMake projects reach the same goal with toolchain files, containers and discipline; Bazel makes it the default. Otherwise the two are not rivals — most open-source C++ uses CMake, and a GNC engineer reads both.

## GoogleTest

A GoogleTest test is a function declared with the macro `TEST(SuiteName, TestName)`, with checks inside. The `gtest_main` library supplies `main`, finds every `TEST` when the program starts, runs them all, and prints a line per test and a summary.

The checks come in two families, and knowing which to use is the first thing an interviewer asks. Think of a pilot's preflight checklist. Some items are "note it and keep going" — a scuffed seat. Some are "stop right here" — no fuel. If the tank is empty, there is no point checking the radio.

::: key
GoogleTest: `ASSERT_*` aborts the current test function on failure — use it when continuing would crash or be meaningless; `EXPECT_*` records the failure and continues, so one run reports several problems. For floats use `EXPECT_NEAR` or `EXPECT_DOUBLE_EQ`.
:::

The common checks:

- `EXPECT_TRUE(c)`, `EXPECT_FALSE(c)`;
- `EXPECT_EQ(a, b)` (equal), `EXPECT_NE` (not equal), `EXPECT_LT` (less than), `EXPECT_LE`, `EXPECT_GT` (greater than), `EXPECT_GE`;
- for decimals, `EXPECT_NEAR(a, b, abs_tol)` with a tolerance you choose, and `EXPECT_DOUBLE_EQ(a, b)`, which allows a difference of up to four **[[units in the last place|ulp]]** — enough to absorb rounding, tight enough to catch a real error;
- `EXPECT_DEATH(statement, regex)` for code that is *supposed* to abort, such as lesson 9's allocation guard firing.

Every check accepts a message streamed after it, `<< "at i = " << i`, printed only on failure. Each has an `ASSERT_` twin.

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

(The real printout has a few extra divider lines; they are trimmed here.) The three plain tests each check one kind of fact.

1. **A known value.** At 400 km, circular speed is $\sqrt{\mu/r} = 7668.6\,\mathrm{m/s}$, checked to $0.1\,\mathrm{m/s}$.
2. **An identity.** Kepler's third law says $T^2/r^3 = 4\pi^2/\mu$. `EXPECT_DOUBLE_EQ` can hold it to rounding, because both sides come from the same constants.
3. **A relationship with a *relative* tolerance.** On a circular orbit the energy is $-v^2/2$. The energy is about $-2.94 \times 10^7\,\mathrm{J/kg}$, so the tolerance is $10^{-6}$ of it, about $29\,\mathrm{J/kg}$. A fixed tolerance like $10^{-9}$ would be meaningless on a number that size.

`OrbitFamily` is a **[[fixture|fixture]]**: a class that derives from `::testing::Test` and prepares shared data in `SetUp`. Each `TEST_F` gets a fresh copy, so tests never share state. Here the radii are 6,600, 7,600, 8,600 and 9,600 km.

Inside the loop, `ASSERT_GT` guards the fixture's promise. If the radii were not increasing, the comparison after it would mean nothing, so the test should stop. The `EXPECT_LT` after it records and continues. A failure at `i = 2` would still let `i = 3` be checked, and the streamed `"at i = "` says which one failed.

Run only the fixture's tests with `./build/tests --gtest_filter='OrbitFamily.*'`. Run everything a hundred times in random order with `--gtest_repeat=100 --gtest_shuffle`, to flush out tests that secretly depend on each other. `M_PI` is a constant from the POSIX standard, not from C++; on a compiler without it, write out the digits.
:::

::: example What failure looks like
```cpp
#include <gtest/gtest.h>
#include "gnc/orbit.hpp"

TEST(Orbit, WrongExpectation) {
  const double v = gnc::circular_speed(6778.137e3);
  EXPECT_NEAR(v, 7700.0, 1.0) << "circular speed at 400 km";
  EXPECT_DOUBLE_EQ(0.1 + 0.2, 0.3);
  EXPECT_EQ(2 + 2, 4);
}

TEST(Orbit, AssertStopsTheTest) {
  double* table = nullptr;
  ASSERT_NE(table, nullptr) << "table not loaded";
  EXPECT_GT(table[0], 0.0);  // never reached: ASSERT_NE returned from the test
}
// Output (trimmed):
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
// test/test_fail.cpp:13: Failure
// Expected: (table) != (nullptr), actual: NULL vs (nullptr)
// table not loaded
//
// [  FAILED  ] Orbit.AssertStopsTheTest (0 ms)
// [  PASSED  ] 0 tests.
// [  FAILED  ] 2 tests, listed below:
// [  FAILED  ] Orbit.WrongExpectation
// [  FAILED  ] Orbit.AssertStopsTheTest
//
//  2 FAILED TESTS
```

Read the first failure. It gives the two values, their difference and the tolerance: $7700 - 7668.56 = 31.44$, which is more than $1.0$. That is everything you need to decide whether the code or the expectation is wrong. Here the expectation is: 7700 was a guess, and 7668.6 is the real value.

The next line of the same test, `EXPECT_DOUBLE_EQ(0.1 + 0.2, 0.3)`, *passed* and printed nothing. The two doubles differ by one unit in the last place, inside the four the macro allows. `EXPECT_EQ` would have failed.

The second test shows `ASSERT_NE` doing its job. The pointer is null. Going on to `table[0]` would have crashed the whole program and taken every later test with it. Instead the assertion returned from the test function, and the failure was reported cleanly.
:::

::: warning
Never compare decimal results with `EXPECT_EQ`. Two calculations that are equal on paper differ in the last bits when the operations happen in a different order, and the test then fails on one compiler or optimization level and passes on another. Use `EXPECT_NEAR` with a tolerance you can justify — absolute for quantities near zero, relative (a fraction of the size) otherwise — or `EXPECT_DOUBLE_EQ` when the two sides should agree to rounding.
:::

### Testing numerical flight code

*What* to test is harder than *how*. The tests that catch real GNC bugs come in four kinds.

- **Known values**: a circular speed, a published checksum value, a rotation of a unit vector.
- **Invariants and conservation laws**: specific energy over one orbit, the norm of a quaternion after ten thousand updates, the symmetry of a covariance matrix.
- **Agreement with a reference**: your Python propagator's output, stored as a data file and matched to $10^{-10}$ — which is what the first exercise asks for.
- **Non-functional properties**: lesson 9's allocation counter wrapped as `EXPECT_EQ(g_allocations, 0)` around the propagation loop, timing limits, and compile-time facts through `static_assert`, which needs no test framework at all.

A **[[continuous-integration|ci]]** server runs the whole suite on every change: in Debug, in Release, and under the sanitizers of the next lesson.

## Check yourself

::: check
Why is `include` declared `PUBLIC` in `target_include_directories(core PUBLIC include)`, and what would break if it were `PRIVATE`?
:::

::: answer
`PUBLIC` makes the folder a usage requirement: `core` needs it to compile its own sources, and every target that links `core` gets it too.

`test/test_orbit.cpp` includes `gnc/orbit.hpp`. With `PRIVATE`, the test target would not receive the `-I include` flag, so it would fail to compile with "no such file or directory" for the header. `PRIVATE` is right for things only the library's own sources need, such as an internal header folder or the warning flags.
:::

::: check
A test loads a gain table, checks that the loading worked, and then checks that every gain is positive. Which family goes on the load check, which on the gain checks, and why?
:::

::: answer
`ASSERT_TRUE` (or `ASSERT_NE` against null) on the load. If the table did not load, indexing it would read garbage or a null pointer and crash the whole test program, so the test must stop there.

`EXPECT_GT` on each gain. One bad gain should not hide others. `EXPECT_*` records every failure and keeps going, so a single run reports all of them, with their indices in the streamed message.
:::

::: check
`EXPECT_DOUBLE_EQ(0.1 + 0.2, 0.3)` passes but `EXPECT_EQ(0.1 + 0.2, 0.3)` fails. Explain both results.
:::

::: answer
In binary floating point, `0.1 + 0.2` comes out as `0.30000000000000004`. That is one unit in the last place above the double nearest to `0.3`.

`EXPECT_EQ` compares with `==`, which is exact, so it fails. `EXPECT_DOUBLE_EQ` calls two doubles equal if they are within four units in the last place of each other. That absorbs exactly this kind of rounding while still catching any real difference, so it passes. For results expected to differ by more than rounding — an integrator against an exact formula — `EXPECT_NEAR` with an explicit tolerance is the right tool.
:::

::: check
Sketch the CMake needed to build the test program with AddressSanitizer and UndefinedBehaviorSanitizer when an option `GNC_SANITIZE` is on.
:::

::: answer
```cmake
option(GNC_SANITIZE "Build with ASan and UBSan" OFF)
if(GNC_SANITIZE)
  target_compile_options(tests PRIVATE -fsanitize=address,undefined -fno-omit-frame-pointer -g)
  target_link_options(tests PRIVATE -fsanitize=address,undefined)
endif()
```

Configure a separate build folder with `cmake -S . -B build-asan -DGNC_SANITIZE=ON`, then run `ctest --test-dir build-asan`. The flag must appear both when compiling and when linking. In practice you apply it to `core` as well (or to every target, through a small helper function) so that the library code is checked too.
:::

::: check
An accident investigation needs the exact program that flew eighteen months ago, rebuilt from the tagged source. Why is that routine with a hermetic Bazel build and hard with an ordinary CMake build, and how do CMake projects close the gap?
:::

::: answer
A hermetic build treats the compiler, the standard library, every dependency and every flag as pinned inputs, downloaded and sandboxed by the build tool itself. The same source then produces the same bytes on any machine, at any time.

An ordinary CMake build uses whatever compiler and libraries the machine has. Eighteen months later those have changed, and the program differs in ways that may or may not matter.

CMake projects close the gap with a toolchain file naming an exact compiler, a container image or archived toolchain that provides it, pinned dependency versions (`FetchContent` with a tag, or copied-in sources), and a recorded configure command. That is reproducibility by discipline rather than by default.
:::

## Summary

| Item | Meaning |
| --- | --- |
| configure / build / test | `cmake -S . -B build -G Ninja` · `cmake --build build` · `ctest --test-dir build` |
| target | a library or executable; all properties attach to targets, never globally |
| `PUBLIC` / `PRIVATE` / `INTERFACE` | this target and its users / this target only / users only |
| `target_include_directories`, `target_compile_features`, `target_compile_options`, `target_link_libraries` | the four property commands |
| `find_package(GTest)` / `FetchContent` | installed dependency / downloaded at a pinned tag; both give `GTest::gtest_main` |
| `CMAKE_BUILD_TYPE` | `Debug`, `Release`, `RelWithDebInfo`; add a sanitizer option yourself |
| toolchain file | how one `CMakeLists.txt` produces the flight program with a cross-compiler |
| Bazel `cc_library` / `cc_test` / `deps` | hermetic, sandboxed, cached builds; reproducible by default |
| `TEST(Suite, Name)`, `TEST_F(Fixture, Name)` | a test; a test with shared `SetUp` |
| `ASSERT_*` vs `EXPECT_*` | stop the test / record and continue |
| `EXPECT_NEAR(a, b, tol)`, `EXPECT_DOUBLE_EQ(a, b)` | a tolerance you choose / four units in the last place |
| `--gtest_filter`, `--gtest_repeat`, `--gtest_shuffle` | run a subset; hunt for tests that depend on each other |

The next lesson is about the bugs the compiler is allowed not to tell you about — undefined behavior — and the sanitizer builds that make the test program you have made report them.

::: context translation-unit One file, as the compiler sees it
The compiler never looks at your whole project at once. It takes one `.cpp` file, pastes in every header that file includes (and every header *those* include), and compiles the result into one object file. That pasted-together text is a **translation unit**. It explains two things you will notice: why editing a header forces many files to recompile, and why a missing function often shows up only at the final link, when the object files are finally put together.
:::

::: context dependency-graph The project as arrows
Each arrow says "this is made from that". Change a box, and everything downstream of it — following the arrows — is rebuilt. Change `orbit.cpp`, and only its object file, the library and the final program rebuild; the test's object file is untouched. Change `orbit.hpp`, and both object files rebuild, because both include it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="8" y="14" width="96" height="26" rx="4" fill="#fff" stroke="#1f2a44"/><text x="56" y="31">orbit.cpp</text>
    <rect x="8" y="72" width="96" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/><text x="56" y="89">orbit.hpp</text>
    <rect x="8" y="130" width="96" height="26" rx="4" fill="#fff" stroke="#1f2a44"/><text x="56" y="147">test_orbit.cpp</text>
    <rect x="134" y="14" width="86" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/><text x="177" y="31">orbit.cpp.o</text>
    <rect x="134" y="130" width="86" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/><text x="177" y="147">test_orbit.cpp.o</text>
    <rect x="250" y="14" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/><text x="290" y="31">libcore.a</text>
    <rect x="250" y="130" width="80" height="26" rx="4" fill="#1d6fd1" stroke="#1f2a44"/><text x="290" y="147" fill="#fff">tests</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="104" y1="27" x2="128" y2="27"/>
    <line x1="104" y1="85" x2="129" y2="47.5"/>
    <line x1="104" y1="85" x2="129" y2="122.5"/>
    <line x1="104" y1="143" x2="128" y2="143"/>
    <line x1="220" y1="27" x2="244" y2="27"/>
    <line x1="290" y1="40" x2="290" y2="124"/>
    <line x1="220" y1="143" x2="244" y2="143"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="134,27 126,23 126,31"/>
    <polygon points="134,40 132.3,49.7 125.7,45.3"/>
    <polygon points="134,130 125.7,124.7 132.3,120.3"/>
    <polygon points="134,143 126,139 126,147"/>
    <polygon points="250,27 242,23 242,31"/>
    <polygon points="290,130 286,122 294,122"/>
    <polygon points="250,143 242,139 242,147"/>
  </g>
</svg>
```
:::

::: context ninja A build tool made for speed
Ninja is a small build tool written by Evan Martin, an engineer at Google, to build the Chrome browser faster. It does almost nothing clever on purpose: it reads a simple file listing every command and its inputs, checks which outputs are stale, and runs the stale commands in parallel on all your processor cores. Humans are not meant to write Ninja files by hand. Generators like CMake write them, which is why the two are so often used together.
:::

::: context usage-requirements PUBLIC flows downstream, PRIVATE stays home
Picture each target as a box that can hand things to the boxes that link it. `PUBLIC` properties go into the box and are handed on. `PRIVATE` ones stay inside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="16" y="24" width="150" height="104" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="91" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">core</text>
  <rect x="28" y="36" width="126" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="91" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">PUBLIC: include/</text>
  <rect x="28" y="66" width="126" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="91" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">PUBLIC: C++20</text>
  <rect x="28" y="96" width="126" height="24" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="91" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">PRIVATE: -Werror</text>
  <rect x="226" y="24" width="120" height="104" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="286" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">tests</text>
  <text x="286" y="52" font-size="11" text-anchor="middle" fill="#1d6fd1">gets include/</text>
  <text x="286" y="82" font-size="11" text-anchor="middle" fill="#1d6fd1">gets C++20</text>
  <text x="286" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">own warnings</text>
  <line x1="154" y1="48" x2="236" y2="48" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="244,48 234,43 234,53" fill="#1d6fd1"/>
  <line x1="154" y1="78" x2="236" y2="78" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="244,78 234,73 234,83" fill="#1d6fd1"/>
  <line x1="172" y1="100" x2="190" y2="118" stroke="#b4232c" stroke-width="2"/>
  <line x1="190" y1="100" x2="172" y2="118" stroke="#b4232c" stroke-width="2"/>
  <text x="181" y="142" font-size="11" text-anchor="middle" fill="#b4232c">not passed on</text>
</svg>
```
:::

::: context cross-compiler Building on one computer, running on another
Your laptop almost certainly has an x86 processor. Flight computers often do not: many run ARM chips, and radiation-hardened boards such as the RAD750 that flew on Mars rovers use a PowerPC design. A program compiled for one kind of processor will not run on another. A **cross-compiler** runs on your laptop but writes machine code for the target processor. The toolchain file tells CMake which cross-compiler to use and where the target's own system libraries live.
:::

::: context hermetic Sealed like a jar
A "hermetic seal" is an airtight one — the word comes from Hermes Trismegistus, a legendary figure credited by alchemists with the art of sealing glass vessels. A hermetic build is sealed in the same sense: nothing from the outside computer leaks in. It cannot quietly pick up a newer compiler, a different library version, or an environment variable someone set years ago. Every input is named, pinned and checked.
:::

::: context ulp The spacing between doubles
A `double` cannot hold every number. Near $0.3$, the doubles are spaced about $5.55 \times 10^{-17}$ apart; that gap is one **unit in the last place**, or ULP. `0.1 + 0.2` lands on the neighbor right above the double closest to $0.3$ — one ULP away. `EXPECT_DOUBLE_EQ` accepts anything within four ULPs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="68" y="40" width="224" height="20" fill="#8fb8f0" opacity="0.6"/>
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="42" x2="40" y2="58"/><line x1="68" y1="42" x2="68" y2="58"/><line x1="96" y1="42" x2="96" y2="58"/>
    <line x1="124" y1="42" x2="124" y2="58"/><line x1="152" y1="42" x2="152" y2="58"/><line x1="180" y1="38" x2="180" y2="62"/>
    <line x1="208" y1="42" x2="208" y2="58"/><line x1="236" y1="42" x2="236" y2="58"/><line x1="264" y1="42" x2="264" y2="58"/>
    <line x1="292" y1="42" x2="292" y2="58"/><line x1="320" y1="42" x2="320" y2="58"/>
  </g>
  <circle cx="180" cy="50" r="5" fill="#1f2a44"/>
  <circle cx="208" cy="50" r="5" fill="#b4232c"/>
  <text x="180" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">0.3</text>
  <text x="222" y="30" font-size="12" text-anchor="middle" fill="#b4232c">0.1 + 0.2</text>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#1d6fd1">shaded: within 4 ULP, EXPECT_DOUBLE_EQ passes</text>
</svg>
```
:::

::: context fixture Borrowed from the workbench
In a hardware lab, a **test fixture** is the jig that holds a part in exactly the same position for every test — a clamp for a circuit board, a stand for a valve. Software borrowed the word for the same job: code that puts the object under test into a known starting state, fresh each time, so no test can be spoiled by what the previous one left behind. `SetUp` builds the state; an optional `TearDown` cleans it up.
:::

::: context ci A build server that never gets tired
**Continuous integration**, or CI, means every change a programmer pushes is built and tested automatically, usually within minutes, on a shared server. If anything fails, the change is blocked before it joins the main code. For flight software the CI server does what no person would do by hand every time: build the code three or four different ways, run every test in each, run the sanitizers and static analyzers, and keep a record of it all.
:::
