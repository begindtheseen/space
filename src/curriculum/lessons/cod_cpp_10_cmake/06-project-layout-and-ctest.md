---
id: l06-project-layout-and-ctest
title: A project layout a stranger can build, and ctest
minutes: 24
covers:
  - 'Canonical layout: apps, cmake, extern, include, src, tests'
  - ctest and test registration
---

Walk into a well-run workshop. Screwdrivers hang on one pegboard, drill bits sit in a labeled drawer, and the half-finished projects are on their own bench. A visitor who has never been there before can find a 10 mm wrench in thirty seconds. Walk into a messy garage and the same wrench takes half an hour, and you might give up and buy a new one.

A code repository is a workshop. When every C++ project keeps its public headers, its source files, its programs and its tests in the same named folders, a new teammate can open any of them and know where to look. Tools can find things too: the build, the test runner, the code-coverage report and the packaging step all depend on files being where the convention says.

This lesson does two things. First, it lays out the **canonical layout** — the standard set of folders most modern CMake projects use: `apps`, `cmake`, `extern`, `include`, `src` and `tests`. Second, it teaches **CTest** — the test runner that comes with CMake — and how you **register** a test, which means telling CMake "this is a test; here is how to run it". By the end you will have a flight-software library, a small program that uses it, and seven tests that run with one command. That is the skeleton of the module's first exercise.

## Six folders, one job each

Here is the whole project we will build. The library is called `gnc`, for guidance, navigation and control. It has two small jobs: converting degrees to radians, and **wrapping** an angle, which means folding any angle, such as $370°$, back into the range from $-\pi$ to $\pi$ radians (read "pi"). A heading of $370°$ and a heading of $10°$ point the same way, and a controller must treat them as the same.

```text
gnc/
├── CMakeLists.txt          the root file: project name, testing switch, subfolders
├── apps/
│   ├── CMakeLists.txt
│   └── gnc_demo/
│       ├── CMakeLists.txt
│       └── main.cpp        a small program that uses the library
├── cmake/                  helper .cmake files (empty for now)
├── extern/                 third-party code you did not write (empty for now)
├── include/
│   └── gnc/
│       └── angles.hpp      the library's public header
├── src/
│   ├── CMakeLists.txt
│   └── angles.cpp          the library's source
└── tests/
    ├── CMakeLists.txt
    └── test_angles.cpp     unit tests for the library
```

Take the folders one at a time.

- **`include/gnc/`** holds the **public headers** — the header files a user of your library is allowed to include. Every header here is a promise: "this function exists and will keep working". Notice the extra `gnc` folder inside `include`. Users write `#include <gnc/angles.hpp>`, never `#include <angles.hpp>`. The folder name works like a family name, so your `angles.hpp` can never be confused with some other library's `angles.hpp`. That problem has a name, a **[[header collision|header-namespace]]**, and the extra folder is the cure.
- **`src/`** holds the library's `.cpp` files, plus any **private headers** — helpers only the library itself uses. Nobody outside can include them, so you can change them freely.
- **`apps/`** holds programs, one subfolder each. A program here should be a **[[thin main|thin-main]]**: it reads its inputs, calls the library and prints results. The real work lives in the library, where the tests can reach it.
- **`tests/`** holds the test programs. A common habit is to mirror `src/`: `angles.cpp` gets `test_angles.cpp`.
- **`cmake/`** holds helper files written in the CMake language, ending in `.cmake`. Later in this module it will hold build options (lesson 08), a **toolchain file** for cross-compiling (lesson 09) and a package template (lesson 10).
- **`extern/`** holds third-party code that lives inside your repository, often as a git submodule (lesson 05). You do not edit it. Keeping it apart makes its license and its version easy to see, and it keeps your warning flags from being aimed at code you do not own.

::: key
Canonical layout: public headers in `include/<name>/`, library sources and private headers in `src/`, programs in `apps/`, tests in `tests/`, CMake helper files in `cmake/`, vendored third-party code in `extern/`. Users include `<gnc/angles.hpp>`, so the folder name protects against collisions.
:::

::: warning
Putting the real logic in `main.cpp` is the most common layout mistake. A test program cannot call a function that lives inside another program's `main.cpp`. If the angle-wrapping code sat in `apps/gnc_demo/main.cpp`, the only way to test it would be to run the whole demo and read its screen. Move it into the library, and a test can call it directly with any input you like.
:::

## One CMakeLists.txt per folder

Each folder that builds something gets its own `CMakeLists.txt`. The root file sets up the project and then hands each folder its turn with **`add_subdirectory`** — "go into this folder and read the `CMakeLists.txt` you find there". Targets defined in one folder can be used in any other, because target names are global to the whole project.

The root file:

```cmake
cmake_minimum_required(VERSION 3.25)
project(gnc VERSION 0.1.0 LANGUAGES CXX)

enable_testing()

add_subdirectory(src)
add_subdirectory(apps)
add_subdirectory(tests)
```

The order of the `add_subdirectory` lines matters a little. `src` goes first because it defines the `gnc` target, and the other folders use it.

The library, in `src/CMakeLists.txt`:

```cmake
add_library(gnc
  angles.cpp
)
target_include_directories(gnc PUBLIC ${PROJECT_SOURCE_DIR}/include)
target_compile_features(gnc PUBLIC cxx_std_20)
target_compile_options(gnc PRIVATE -Wall -Wextra -Wpedantic)
```

These are the three decisions from lesson 03, each made once, on the target. The include folder is PUBLIC because every user of `gnc` needs to find `gnc/angles.hpp`. C++20 is PUBLIC because the public header may use C++20. The warning flags are PRIVATE because they are about how *we* build our own code; a user should not have our warnings forced on theirs. `${PROJECT_SOURCE_DIR}` (read "dollar, project source dir") is the folder that holds the root `CMakeLists.txt`, so the path works no matter which subfolder this line sits in.

The program, in `apps/gnc_demo/CMakeLists.txt`, is two lines, and `apps/CMakeLists.txt` is one line, `add_subdirectory(gnc_demo)`:

```cmake
add_executable(gnc_demo main.cpp)
target_link_libraries(gnc_demo PRIVATE gnc)
```

The demo never mentions an include folder or a C++ standard. It links `gnc`, and `gnc`'s PUBLIC usage requirements arrive with it.

The header and source:

```cpp
// include/gnc/angles.hpp
#pragma once

namespace gnc {

// Degrees to radians.
double deg_to_rad(double deg);

// Wrap an angle in radians into the range (-pi, pi].
double wrap_pi(double rad);

}  // namespace gnc
```

```cpp
// src/angles.cpp
#include <gnc/angles.hpp>

#include <cmath>
#include <numbers>

namespace gnc {

double deg_to_rad(double deg) { return deg * std::numbers::pi / 180.0; }

double wrap_pi(double rad) {
    const double two_pi = 2.0 * std::numbers::pi;
    double r = std::fmod(rad + std::numbers::pi, two_pi);
    if (r <= 0.0) r += two_pi;
    return r - std::numbers::pi;
}

}  // namespace gnc
```

The wrap works in three moves. Shift the angle up by $\pi$ so the target range becomes $0$ to $2\pi$. Take the remainder after dividing by $2\pi$ with `std::fmod`; the remainder can come out negative or zero, so add $2\pi$ once if it does. Then shift back down by $\pi$.

::: example Configure and build the layout
The demo program:

```cpp
// apps/gnc_demo/main.cpp
#include <gnc/angles.hpp>

#include <cstdio>

int main() {
    const double heading_deg = 370.0;
    const double wrapped = gnc::wrap_pi(gnc::deg_to_rad(heading_deg));
    std::printf("heading %.1f deg wraps to %.4f rad\n", heading_deg, wrapped);
    return 0;
}
```

From the `gnc` folder (the paths CMake prints are shortened here to `/home/you/gnc`; yours will differ):

```text
$ cmake -S . -B build
...
-- Found GTest: /usr/lib/x86_64-linux-gnu/cmake/GTest/GTestConfig.cmake (found version "1.14.0")
-- Configuring done (0.3s)
-- Generating done (0.0s)
-- Build files have been written to: /home/you/gnc/build
$ cmake --build build
[ 16%] Building CXX object src/CMakeFiles/gnc.dir/angles.cpp.o
[ 33%] Linking CXX static library libgnc.a
[ 33%] Built target gnc
[ 50%] Building CXX object apps/gnc_demo/CMakeFiles/gnc_demo.dir/main.cpp.o
[ 66%] Linking CXX executable gnc_demo
[ 66%] Built target gnc_demo
[ 83%] Building CXX object tests/CMakeFiles/gnc_tests.dir/test_angles.cpp.o
[100%] Linking CXX executable gnc_tests
[100%] Built target gnc_tests
$ ./build/apps/gnc_demo/gnc_demo
heading 370.0 deg wraps to 0.1745 rad
```

Look at the order CMake chose: the library first, then the two programs that need it. You never said so; CMake worked it out from the `target_link_libraries` lines.

**Sanity check.** $370° - 360° = 10°$, and $10 \times \pi / 180 \approx 0.1745$ radians. The build folder also mirrors the source folders (`build/apps/gnc_demo/`), so you always know where a program ended up.
:::

## What a test is, to CTest

Before a launch, the team runs down a checklist, and every line gets a "go" or a "no go". Nobody on that call explains *why* the fuel pressure is fine; they report the verdict. CTest works the same way. It does not know anything about C++ or about GoogleTest. It runs programs, one per test, and reads one number from each: the **[[exit code|exit-code]]** — the small whole number a program hands back to whoever started it when it finishes. Zero means "go". Anything else means "no go".

That is the entire contract. Any program that returns 0 on success and something else on failure can be a CTest test: a C++ unit-test program, a Python script, a shell script, or the demo program itself.

Two commands turn testing on:

- **`enable_testing()`** — tells CMake to write a test list, a file called `CTestTestfile.cmake`, into the build folder. Put it in the **root** `CMakeLists.txt`, before the `add_subdirectory` lines. CTest starts reading at the top of the build folder, so a test list that starts lower down is invisible from the top.
- **`add_test(NAME <name> COMMAND <program> <arguments>...)`** — registers one test. If the program is the name of a target you built, such as `gnc_demo`, CMake swaps in the full path to the built program for you.

Here is the smallest useful test: "the demo runs and says the right thing".

```cmake
add_test(NAME demo_runs COMMAND gnc_demo)
set_tests_properties(demo_runs PROPERTIES
  PASS_REGULAR_EXPRESSION "wraps to 0\\.1745 rad"
  TIMEOUT 10
)
```

**`set_tests_properties`** adjusts how CTest judges a test. **PASS_REGULAR_EXPRESSION** replaces the exit-code rule: the test passes only if the program's output matches this **[[regular expression|regex]]** — a pattern for matching text. **TIMEOUT** fails the test if it runs longer than 10 seconds, so a program stuck in an endless loop cannot hang the whole run. Two more you will meet: **WILL_FAIL** flips the verdict (for a test that is supposed to fail), and **LABELS** tags tests so you can run a group, such as all the slow ones.

::: warning
Inside a CMake string, a backslash starts an escape, the same way it does in C++. To hand CTest the pattern `0\.1745` (a real dot, not "any character"), you write `0\\.1745` in the `CMakeLists.txt`. Write `0.1745` and it still passes today, but it would also accept `0x1745`, which is not what you meant.
:::

::: note Switching tests off: include(CTest)
Many projects write `include(CTest)` instead of `enable_testing()`. It calls `enable_testing()` for you and also creates a cache option called `BUILD_TESTING`, on by default. Wrap `add_subdirectory(tests)` in `if(BUILD_TESTING)`, and someone who only wants the library can configure with `-DBUILD_TESTING=OFF` and skip building the tests (and skip needing GoogleTest at all). Either form is fine for this module's exercise.
:::

## Registering GoogleTest tests

A GoogleTest program holds many tests. Our `tests/test_angles.cpp` has four:

```cpp
#include <gnc/angles.hpp>

#include <gtest/gtest.h>

#include <numbers>

TEST(Angles, DegToRadRightAngle) {
    EXPECT_DOUBLE_EQ(gnc::deg_to_rad(90.0), std::numbers::pi / 2.0);
}

TEST(Angles, WrapKeepsSmallAngles) {
    EXPECT_DOUBLE_EQ(gnc::wrap_pi(0.5), 0.5);
}

TEST(Angles, WrapFoldsLargeAngles) {
    EXPECT_NEAR(gnc::wrap_pi(gnc::deg_to_rad(370.0)), gnc::deg_to_rad(10.0), 1e-12);
}

TEST(Angles, WrapMapsMinusPiToPlusPi) {
    EXPECT_DOUBLE_EQ(gnc::wrap_pi(-std::numbers::pi), std::numbers::pi);
}
```

You could register the whole program with one `add_test`. It would work, but CTest would see one test. When one of the four broke, the report would say "gnc_tests failed", and you could not run the broken one alone or run the four in parallel.

The fix ships with CMake. The **`GoogleTest` module** — a helper file you load with `include(GoogleTest)` — provides **`gtest_discover_tests`**. After the test program is built, it runs the program once with a flag that asks "list your tests", and registers each one as its own CTest test. This is **[[test discovery|test-discovery]]**. Add a new `TEST` and it appears in CTest after the next build, with no CMake edit.

The whole `tests/CMakeLists.txt`:

```cmake
find_package(GTest REQUIRED)
include(GoogleTest)

add_executable(gnc_tests test_angles.cpp)
target_link_libraries(gnc_tests PRIVATE gnc GTest::gtest_main)
gtest_discover_tests(gnc_tests)

add_test(NAME demo_runs COMMAND gnc_demo)
set_tests_properties(demo_runs PROPERTIES
  PASS_REGULAR_EXPRESSION "wraps to 0\\.1745 rad"
  TIMEOUT 10
)
```

`GTest::gtest_main` is GoogleTest's library plus a ready-made `main` that runs every test, so the test file has no `main` of its own. Here GoogleTest comes from the system through `find_package`; lesson 05 showed how FetchContent could download a pinned version instead, and the rest of this file would not change.

::: key
`enable_testing()` in the root `CMakeLists.txt`; `add_test(NAME … COMMAND …)` registers one program as one test, judged by its exit code (0 passes); `gtest_discover_tests(target)` registers every GoogleTest `TEST` as its own CTest test; run them all with `ctest --output-on-failure`.
:::

## Running ctest

CTest runs from the build folder. You can `cd build` and type `ctest`, or stay in the source folder and point at it with `ctest --test-dir build`. The flags you will use every day:

| Flag | Meaning |
| --- | --- |
| `--output-on-failure` | print the output of any test that fails |
| `-R pattern` | run only tests whose names match the pattern |
| `-E pattern` | skip tests whose names match the pattern |
| `-j 4` | run up to 4 tests at the same time |
| `-N` | list the tests without running them |
| `--rerun-failed` | run only the tests that failed last time |

Without `--output-on-failure`, CTest hides each test's output and prints only the verdict. That keeps a passing run tidy. But a failing run then says *which* test failed and not *why*, and you have to go digging in a log file. In practice you almost always want the flag, which is why lesson 07 bakes it into a preset.

::: example A failing test, and what the output tells you
Change one character in `src/angles.cpp`: turn `if (r <= 0.0)` into `if (r < 0.0)`. Rebuild with `cmake --build build`, then run `ctest` in the build folder:

```text
    Start 4: Angles.WrapMapsMinusPiToPlusPi
4/5 Test #4: Angles.WrapMapsMinusPiToPlusPi ...***Failed    0.00 sec
    Start 5: demo_runs
5/5 Test #5: demo_runs ........................   Passed    0.00 sec

80% tests passed, 1 tests failed out of 5

The following tests FAILED:
	  4 - Angles.WrapMapsMinusPiToPlusPi (Failed)
Errors while running CTest
```

(The first three lines of passes are left out.) CTest's own exit code was 8 — not zero — so a script or a [[CI job|ci-exit]] would stop here. Now ask for the details, for this one test only:

```text
$ ctest --output-on-failure -R Minus
    Start 4: Angles.WrapMapsMinusPiToPlusPi
1/1 Test #4: Angles.WrapMapsMinusPiToPlusPi ...***Failed    0.00 sec
Running main() from ./googletest/src/gtest_main.cc
Note: Google Test filter = Angles.WrapMapsMinusPiToPlusPi
[ RUN      ] Angles.WrapMapsMinusPiToPlusPi
/home/you/gnc/tests/test_angles.cpp:20: Failure
Expected equality of these values:
  gnc::wrap_pi(-std::numbers::pi)
    Which is: -3.1415926535897931
  std::numbers::pi
    Which is: 3.1415926535897931
[  FAILED  ] Angles.WrapMapsMinusPiToPlusPi (0 ms)
```

(A few GoogleTest banner lines are trimmed.) Now the bug is readable. Trace it by hand: $-\pi + \pi = 0$, and the remainder of $0$ divided by $2\pi$ is $0$. With `r <= 0.0`, zero gets $2\pi$ added and the answer is $2\pi - \pi = \pi$. With `r < 0.0`, zero stays zero and the answer is $0 - \pi = -\pi$, the one end of the range the function promised never to return.

Notice that `-R Minus` matched the test by part of its name. The four other tests still pass, which is the point of registering them one by one: the report names the one broken case, not the whole program.
:::

::: warning
`ctest` runs whatever programs are in the build folder right now. It never rebuilds them. Edit a source file, forget `cmake --build build`, run `ctest`, and you are testing yesterday's code — the run above passed all five tests until the rebuild. Always build, then test. Lesson 07's presets make that a fixed pair of commands.
:::

## Everything from a clean clone

The test of a good layout is a stranger. They clone the repository onto a fresh machine and type three commands:

```bash
cmake -S . -B build
cmake --build build -j 4
ctest --test-dir build --output-on-failure
```

If that works with no wiki page, no "oh, you also need to set this", the layout has done its job. The `-j 4` asks the build tool to compile up to four files at once; on a laptop with four cores, that is about as fast as it goes.

The module's first exercise asks for exactly this skeleton, plus the presets of the next lesson so that the three commands become `cmake --preset debug`, `cmake --build --preset debug` and `ctest --preset debug`. Everything else it needs — the PUBLIC include folder, `target_compile_features` with `cxx_std_20`, the PRIVATE warning flags, the `apps`, `src`, `include/gnc` and `tests` folders — is in this lesson.

::: note Why the tests live in their own folder and not beside the code
Some languages keep tests next to the code they test. In C++ with CMake, a separate `tests/` folder has two practical wins. The test programs are separate targets that depend on the library, so the dependency arrow points one way only: tests use the library, never the other way round. And a user who builds your library with `BUILD_TESTING` off never compiles a line of test code or needs GoogleTest installed.
:::

## Check yourself

::: check
A teammate puts `wrap_angle.hpp` directly in `include/`, not in `include/gnc/`, and users write `#include <wrap_angle.hpp>`. Everything compiles. What could go wrong later?
:::

::: answer
Nothing today, but the name is unprotected. The day a project uses `gnc` together with another library that also has a `wrap_angle.hpp` in its include folder, the compiler takes whichever folder it searches first. One of the two libraries gets the wrong header, and the error, if there is one, shows up far from the cause. With `include/gnc/wrap_angle.hpp` and `#include <gnc/wrap_angle.hpp>`, the name is qualified by the library, like a family name, and the clash cannot happen.
:::

::: check
You move `enable_testing()` from the root `CMakeLists.txt` into `tests/CMakeLists.txt`. You rebuild and run `ctest` in the build folder. What happens, and why?
:::

::: answer
CTest reports "No tests were found!!!". CTest starts from the test list at the top of the build folder, and that list only exists when `enable_testing()` is called in the root `CMakeLists.txt`. With the call inside `tests/`, the list exists only in `build/tests/`, so `ctest` run from `build/tests` would find the tests but `ctest` run from `build` does not. Put `enable_testing()` (or `include(CTest)`) in the root file, before the `add_subdirectory` lines.
:::

::: check
A test program checks a Kalman filter and prints "FAIL: covariance not symmetric" when something is wrong, but always ends with `return 0;`. It is registered with `add_test`. What does CTest report when the check fails? Give two ways to fix it.
:::

::: answer
CTest reports the test as **passed**, because it only looks at the exit code, and the exit code is 0. The printed "FAIL" is ignored.

Fix one, the better one: make the program return a nonzero value (for example `return 1;`) when a check fails. Fix two: leave the program alone and add a property, either `FAIL_REGULAR_EXPRESSION "FAIL"` so any output containing FAIL fails the test, or a `PASS_REGULAR_EXPRESSION` that only a correct run prints. Using a test framework such as GoogleTest gets the exit code right for you.
:::

::: check
Your test program has 120 GoogleTest tests and is registered with a single `add_test(NAME all_tests COMMAND gnc_tests)`. Name two things you lose compared with `gtest_discover_tests(gnc_tests)`.
:::

::: answer
First, the report: CTest sees one test, so when any of the 120 fails it says only "all_tests failed", and you cannot pick out the broken one with `-R` or re-run only it with `--rerun-failed`. Second, speed: `ctest -j 4` runs separate tests at the same time, but a single test is one program running start to finish, so it gets no benefit. (A third: per-test properties such as a TIMEOUT for one slow test are impossible.) `gtest_discover_tests` registers each `TEST` separately and fixes all of these.
:::

::: check
Lay out, as a folder tree, a project with a library called `nav` that has a public header `ekf.hpp` and a private helper header `matrix_util.hpp`, a program called `nav_replay`, and a vendored copy of a small JSON parser. Say where each file goes.
:::

::: answer
```text
nav/
├── CMakeLists.txt
├── apps/nav_replay/main.cpp        the program (plus its CMakeLists.txt)
├── cmake/                          helper .cmake files
├── extern/json/                    the vendored JSON parser, untouched
├── include/nav/ekf.hpp             public: users write #include <nav/ekf.hpp>
├── src/ekf.cpp
├── src/matrix_util.hpp             private helper: only src/ can see it
└── tests/test_ekf.cpp
```

The private helper sits in `src/` because the library's include folder is the only one made PUBLIC; `src/` is never handed to users, so `matrix_util.hpp` can change without breaking anyone. The JSON parser stays in `extern/` so its license and version are obvious and your warning flags do not land on it.
:::

## Summary

| Idea | In one line |
| --- | --- |
| `include/<name>/` | public headers; users write `#include <gnc/angles.hpp>` |
| `src/` | library sources and private headers |
| `apps/` | thin programs that call the library |
| `tests/` | test programs, often mirroring `src/` |
| `cmake/` | helper `.cmake` files: options, toolchains, package templates |
| `extern/` | third-party code you vendor and do not edit |
| `add_subdirectory(dir)` | read `dir/CMakeLists.txt`; targets are visible project-wide |
| `enable_testing()` | root file only; writes the test list CTest reads |
| `add_test(NAME … COMMAND …)` | one program is one test; exit code 0 passes |
| `set_tests_properties` | `PASS_REGULAR_EXPRESSION`, `TIMEOUT`, `WILL_FAIL`, `LABELS` |
| `gtest_discover_tests` | every GoogleTest `TEST` becomes its own CTest test |
| `ctest --output-on-failure` | show why a test failed; `-R`, `-E`, `-j`, `-N`, `--rerun-failed` |

Three commands now build and test the project, but they are three commands a newcomer has to know and type exactly. The next lesson, *CMake presets*, writes them into a file that lives in the repository, so `debug`, `release` and `asan` builds each become one short, shared name.

::: context header-namespace Two libraries, one file name
Suppose `gnc` and a camera library both ship a header called `angles.hpp`, and both put it straight into their include folder. A program that uses both writes `#include <angles.hpp>`, and the compiler walks its list of include folders in order and takes the first match. One library silently gets the other's header.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#b4232c" font-weight="700">flat: clash</text>
  <rect x="20" y="30" width="140" height="34" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">gnc: include/angles.hpp</text>
  <rect x="20" y="74" width="140" height="34" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="96" font-size="12" text-anchor="middle" fill="#1f2a44">cam: include/angles.hpp</text>
  <text x="90" y="134" font-size="12" text-anchor="middle" fill="#1f2a44">&lt;angles.hpp&gt; = which one?</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1d6fd1" font-weight="700">nested: no clash</text>
  <rect x="190" y="30" width="160" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">include/gnc/angles.hpp</text>
  <rect x="190" y="74" width="160" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="96" font-size="12" text-anchor="middle" fill="#1f2a44">include/cam/angles.hpp</text>
  <text x="270" y="134" font-size="12" text-anchor="middle" fill="#1f2a44">&lt;gnc/angles.hpp&gt;</text>
  <text x="270" y="152" font-size="12" text-anchor="middle" fill="#1f2a44">&lt;cam/angles.hpp&gt;</text>
</svg>
```

With the extra folder, the include line names the library as well as the file, and both headers can live side by side.
:::

::: context thin-main One library, three homes
Flight software teams keep `main` thin for a practical reason: the same guidance code has to run in several places. It runs on the flight computer, inside a simulator that flies thousands of virtual missions, and inside unit tests. If the code lives in a library, all three link the same compiled code.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="55" width="100" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="80" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">gnc library</text>
  <rect x="10" y="10" width="100" height="30" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">flight app</text>
  <rect x="10" y="110" width="100" height="30" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">simulator</text>
  <rect x="250" y="60" width="100" height="30" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">unit tests</text>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="110" y1="30" x2="140" y2="55"/>
    <line x1="110" y1="120" x2="140" y2="95"/>
    <line x1="250" y1="75" x2="230" y2="75"/>
  </g>
  <text x="180" y="120" font-size="11" text-anchor="middle" fill="#6c7a93">each links the same code</text>
</svg>
```

If the code lives in one program's `main.cpp`, the simulator and the tests would each need a copy, and copies drift apart. A test that passes on a copy proves nothing about the code that flies.
:::

::: context exit-code The number every program hands back
When a program ends, it returns one small whole number to whatever started it. In C++ that is the value `main` returns, or the number passed to `std::exit`. In the shell you met in the scripting module, `echo $?` prints the last one.

The rule that 0 means success is a Unix convention from the 1970s, and it stuck because there is only one way to succeed but many ways to fail: the nonzero values are free to say *which* failure. CTest itself follows the rule, returning 8 when some tests fail, which is how a CI job knows to stop.
:::

::: context regex Patterns for matching text
A regular expression is a tiny language for describing text. Most characters match themselves: `wraps to` matches exactly those letters. A few are special. A dot matches any single character, so to match a real dot you put a backslash in front of it: `\.`. A star means "any number of the thing before me", so `.*` matches anything at all.

You met the same idea in the scripting module with `grep`. CTest uses regular expressions both in test properties and in `-R` and `-E`, which is why `-R Minus` picked out one test by a piece of its name.
:::

::: context test-discovery How CTest learns the names inside a program
A GoogleTest program answers a question if you ask it: run it with `--gtest_list_tests` and it prints the name of every test it contains, without running any. `gtest_discover_tests` does exactly that right after the program is linked, then writes one CTest entry per name, each running the program with a filter such as `--gtest_filter=Angles.WrapMapsMinusPiToPlusPi`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="100" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="70" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">gnc_tests</text>
  <text x="60" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">one program</text>
  <line x1="110" y1="72" x2="160" y2="72" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="166,72 156,67 156,77" fill="#1f2a44"/>
  <text x="138" y="62" font-size="11" text-anchor="middle" fill="#6c7a93">list</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="172" y="10" width="178" height="24" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
    <text x="180" y="26">test 1: DegToRadRightAngle</text>
    <rect x="172" y="42" width="178" height="24" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
    <text x="180" y="58">test 2: WrapKeepsSmallAngles</text>
    <rect x="172" y="74" width="178" height="24" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
    <text x="180" y="90">test 3: WrapFoldsLargeAngles</text>
    <rect x="172" y="106" width="178" height="24" rx="4" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
    <text x="180" y="122">test 4: WrapMapsMinusPi…</text>
  </g>
  <text x="261" y="146" font-size="11" text-anchor="middle" fill="#6c7a93">four CTest entries</text>
</svg>
```

Because the listing happens at build time, a new `TEST` shows up in CTest after the next build with no change to any `CMakeLists.txt`.
:::

::: context ci-exit Why a CI job cares about the exit code
Continuous integration, or CI, is a server that builds and tests every change pushed to the repository. It runs the same commands you type, one after another, and stops at the first command whose exit code is not zero. Because `ctest` returns nonzero when any test fails, a single broken test turns the whole change red before anyone merges it. Later in the course you will set up such a pipeline yourself, and it will run exactly the preset commands of the next lesson.
:::
