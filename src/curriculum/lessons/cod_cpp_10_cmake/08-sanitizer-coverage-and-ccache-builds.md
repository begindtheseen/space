---
id: l08-sanitizer-coverage-and-ccache-builds
title: Sanitizer, coverage and ccache builds
minutes: 24
covers:
  - Sanitizer and coverage build configurations
  - ccache and build-time hygiene
---

Think about a new car before it goes on sale. The same car goes through a crash test, an emissions test and a long drive around a test track. For the crash test it gets extra sensors bolted on. For the emissions test a probe goes in the exhaust. Nobody designs and builds a second car for each test. It is one car, fitted with different instruments for different checks, and the instruments come off before a customer ever drives it.

Your C++ code is the car. In the memory module you met **AddressSanitizer** (ASan), which catches reads and writes to memory you do not own, and **UndefinedBehaviorSanitizer** (UBSan), which catches things like signed integer overflow and out-of-range array indexes. You will also want **coverage**, which records which lines and branches your tests actually ran. Each is a set of instruments the compiler bolts onto the program. Each makes it slower and bigger, so none of them belongs in the [[flight build|flight-build]]. And each must be applied to the *same* targets you ship, or it tests something else.

This lesson adds those builds without a second copy of any target, through the `asan` preset from lesson 07 and a new `coverage` preset. Then it tackles the time all these builds cost, with **ccache** and a few habits.

## The problem: flags that change how everything is built

Sanitizer flags are unlike the warning flags of lesson 03. Warnings are about one target's own code. A sanitizer has to be on for *every* piece of your code that runs in the test, and it has to be on at two moments: when each file is compiled, so the compiler inserts its checks, and when each program is linked, so the sanitizer's **[[runtime library|sanitizer-runtime]]** is pulled in.

Two tempting ways to do this are both wrong.

**Copying targets.** Write `gnc_asan` next to `gnc`, `gnc_tests_asan` next to `gnc_tests`, and so on. Now every source file and every link must be kept in step in two places, and sooner or later a file added to `gnc` is missing from `gnc_asan`, so the sanitizer build silently tests less code than ships.

**Setting global flags in the CMake files.** Write `set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fsanitize=address")` inside an `if`. Lesson 03 explained why global settings are a bad habit: they apply to everything in the folder and below, including third-party code pulled in with FetchContent, they cannot be seen on any one target, and they cannot be combined or exported.

What we want is the car-and-instruments pattern: **one target definition, several configurations**. Each target is written once. A switch, chosen by a preset, decides which instruments get bolted on.

## An INTERFACE options target

Lesson 02 introduced **INTERFACE libraries** — targets with no source files of their own, only usage requirements for whoever links them. That is exactly the shape we need. A target called `gnc_build_options` compiles nothing. It carries compile options and link options, and every target that links it receives them.

Here is the whole helper file, `cmake/GncBuildOptions.cmake`:

```cmake
# One place for flags that change how everything is built,
# switched on and off from presets. Targets opt in by linking it.
option(GNC_SANITIZE "Build with AddressSanitizer and UBSan" OFF)
option(GNC_COVERAGE "Build with gcov coverage counters" OFF)

add_library(gnc_build_options INTERFACE)

if(GNC_SANITIZE)
  target_compile_options(gnc_build_options INTERFACE
    -fsanitize=address,undefined
    -fno-sanitize-recover=all
    -fno-omit-frame-pointer)
  target_link_options(gnc_build_options INTERFACE
    -fsanitize=address,undefined)
endif()

if(GNC_COVERAGE)
  target_compile_options(gnc_build_options INTERFACE --coverage -O0)
  target_link_options(gnc_build_options INTERFACE --coverage)
endif()
```

The root `CMakeLists.txt` loads it near the top:

```cmake
list(APPEND CMAKE_MODULE_PATH ${PROJECT_SOURCE_DIR}/cmake)
include(GncBuildOptions)
```

`CMAKE_MODULE_PATH` is the list of folders `include()` searches, so adding `cmake/` lets you write `include(GncBuildOptions)` without a path. Then each of our targets links the options target, PRIVATE:

```cmake
target_link_libraries(gnc PRIVATE gnc_build_options)                           # src/
target_link_libraries(gnc_demo PRIVATE gnc gnc_build_options)                  # apps/gnc_demo/
target_link_libraries(gnc_tests PRIVATE gnc gnc_build_options GTest::gtest_main)  # tests/
```

Walk through the pieces.

- **`option(NAME "description" OFF)`** creates an on/off cache variable, off unless someone sets it. The `asan` preset sets `GNC_SANITIZE` to `ON`; a new `coverage` preset will set `GNC_COVERAGE`.
- When a switch is off, `gnc_build_options` is empty, so the debug and release builds are unchanged.
- **Compile options and link options are both needed.** The compile flag makes the compiler insert checks that call into the sanitizer runtime. The link flag brings that runtime in. Forget the link half and every program fails to link.
- **`-fno-sanitize-recover=all`** makes UBSan stop the program at the first problem. By default UBSan prints a message and *carries on*, and the program still exits with code 0 — which CTest reads as a pass. For a test build you want a finding to fail the test.
- **`-fno-omit-frame-pointer`** keeps [[a register|frame-pointer]] the compiler would otherwise reuse, so the sanitizer can print a readable stack trace.
- **PRIVATE**, because these flags are about how *we* build *our* code. They are not a usage requirement of `gnc`; someone who uses the installed library should not have sanitizers forced on them.

The division of labor from lesson 07 holds: the CMake files say *what can be switched on*; presets choose. No target appears twice.

::: key
Add a sanitizer build without duplicating targets: define a build configuration or a preset that adds `-fsanitize=address,undefined` to the compile and link options, typically through a generator expression or an INTERFACE options target that the real targets link. One target definition, several configurations.
:::

::: warning
Leave out `target_link_options` and the compile succeeds but the link does not. With only the compile flag on the options target, the linker reports errors like `undefined reference to '__asan_report_store4'`. Names starting with `__asan_` or `__ubsan_` in a link error always mean the same thing: a file was compiled with a sanitizer, and the program was linked without it.
:::

::: example A bug the debug build cannot see
The `gnc` library has a table of pitch-loop gains, one per altitude band, and a function that picks one. Bands above the top one should use the top gain. Suppose someone writes the clamp with an off-by-one mistake:

```cpp
// src/gains.cpp (buggy version)
#include <gnc/gains.hpp>

namespace gnc {

namespace {
const double kPitchGain[4] = {0.80, 0.65, 0.50, 0.40};
}

double pitch_gain(int band) {
    if (band < 0) band = 0;
    if (band > 4) band = 4;     // should be 3: valid indexes are 0 to 3
    return kPitchGain[band];
}

}  // namespace gnc
```

A test checks that a high band gives a sensible number:

```cpp
TEST(Gains, HighBandsStayFinite) {
    EXPECT_TRUE(std::isfinite(gnc::pitch_gain(7)));
}
```

Band 7 is clamped to 4, and `kPitchGain[4]` is one past the end of a four-element array. In the ordinary debug build, the read lands on whatever sits next to the table in memory, which happened to be a finite number:

```text
$ cmake --build --preset debug && ctest --preset debug
...
100% tests passed, 0 tests failed out of 7
```

The same code, the same test, the `asan` button:

```text
$ cmake --preset asan && cmake --build --preset asan && ctest --preset asan
...
6/7 Test #6: Gains.HighBandsStayFinite ........***Failed    0.11 sec
[ RUN      ] Gains.HighBandsStayFinite
/home/you/gnc/src/gains.cpp:12:27: runtime error: index 4 out of bounds for type 'double [4]'
    #0 0x559df1fcbf13 in gnc::pitch_gain(int) /home/you/gnc/src/gains.cpp:12
    #1 0x559df1fc9e95 in Gains_HighBandsStayFinite_Test::TestBody() /home/you/gnc/tests/test_gains.cpp:12
...
86% tests passed, 1 tests failed out of 7
```

(Paths are shortened and the long stack trace is trimmed.) UBSan's bounds check fired first, naming the file, the line, the bad index and the array's type. Because of `-fno-sanitize-recover=all`, the program stopped there, so the test failed and CTest exited with code 8.

**Sanity check.** $6$ of $7$ tests passed, and $6/7 \approx 0.857$, which CTest rounds down to the $86\%$ it printed. Change the clamp to `if (band > 3) band = 3;` and all seven pass in both builds. Nothing in any `CMakeLists.txt` changed between the two runs; only the preset did.
:::

## The same idea with a generator expression

**Generator expressions** from lesson 04, the `$<...>` pieces filled in once the configuration is known, give a second way: make the sanitizer build its own *configuration*, `Asan`, next to Debug and Release.

```cmake
set(san_flags -fsanitize=address,undefined -fno-omit-frame-pointer)
add_library(gnc_build_options INTERFACE)
target_compile_options(gnc_build_options INTERFACE
  "$<$<CONFIG:Asan>:${san_flags}>")
target_link_options(gnc_build_options INTERFACE
  "$<$<CONFIG:Asan>:${san_flags}>")
```

Read `$<$<CONFIG:Asan>:...>` as "if the configuration is Asan, these flags; otherwise nothing". Configure with `-DCMAKE_BUILD_TYPE=Asan` and the flags appear; configure as Debug and they do not. With a multi-config generator such as Ninja Multi-Config, list the new name in `CMAKE_CONFIGURATION_TYPES` (for example `Debug;Release;Asan`) and build it with `cmake --build build --config Asan`.

Both give one target definition and several configurations. The option-plus-preset form is easier to read; the generator-expression form suits multi-config generators, where one build folder holds every configuration.

::: warning
A space inside a quoted generator expression becomes part of a single argument. Write `"$<$<CONFIG:Asan>:-fsanitize=address -fno-omit-frame-pointer>"` and the compiler receives one strange flag, `"-fsanitize=address -fno-omit-frame-pointer"`, and fails with `unrecognized argument to '-fsanitize=' option`. Put several flags in a CMake list variable, as `san_flags` above, and expand it inside the quotes: CMake splits a list on its semicolons, not on spaces.
:::

::: warning
Linking `gnc_build_options` PRIVATE from a *static* library still records it as a link-only dependency, because a static library is not linked until the program that uses it is. When lesson 10 exports `gnc` for other projects, CMake stops with `install(EXPORT "gncTargets" ...) includes target "gnc" which requires target "gnc_build_options" that is not in any export set`. The fix is to say the link is for this build tree only: `target_link_libraries(gnc PRIVATE $<BUILD_INTERFACE:gnc_build_options>)`.
:::

## Coverage: which lines did the tests run?

Picture a museum map where you color in each room you walk through; the white rooms are the ones you missed. **Code coverage** is that map for your code. It records how many times each line, function and [[branch|branch]] ran while the tests ran. It cannot tell you your tests are good. It can tell you, with certainty, which code no test ever touched.

GCC's coverage tool is called **gcov**. The flag `--coverage` does two things at once. At compile time, it adds a counter to every branch and writes a map of the code, a `.gcno` file, next to each object file. At run time, the counters are written out to a `.gcda` file when the program ends. The `-O0` in our options file turns optimization off, so that each counted line is a real line in your source and not one the optimizer merged or removed.

**lcov** reads those files and writes a summary; **genhtml** turns the summary into a web page with the untested lines in red. Add a coverage preset to `CMakePresets.json`, next to `asan`:

```json
{
  "name": "coverage",
  "displayName": "Debug + gcov coverage",
  "inherits": "debug",
  "cacheVariables": { "GNC_COVERAGE": "ON" }
}
```

plus a build preset and a test preset that point at it, in the same way as for `asan`.

::: example Measuring the gains code
With the off-by-one fixed, build and test the coverage configuration, then collect the counters from the library's folder only (we want the coverage of `gnc`, not of the tests themselves):

```text
$ cmake --preset coverage && cmake --build --preset coverage && ctest --preset coverage
...
100% tests passed, 0 tests failed out of 7
$ lcov --rc branch_coverage=1 --capture --directory build/coverage/src --output-file build/coverage/gnc.info
...
Found 2 data files in build/coverage/src
Processing build/coverage/src/CMakeFiles/gnc.dir/angles.cpp.gcda
Processing build/coverage/src/CMakeFiles/gnc.dir/gains.cpp.gcda
Finished .info-file creation
$ lcov --rc branch_coverage=1 --summary build/coverage/gnc.info
Summary coverage rate:
  lines......: 100.0% (10 of 10 lines)
  functions..: 100.0% (3 of 3 functions)
  branches...: 83.3% (5 of 6 branches)
$ genhtml --branch-coverage build/coverage/gnc.info --output-directory build/coverage/html
```

Every line ran. Every function ran. But one branch of six never did: $5/6 \approx 0.833$, the $83.3\%$ printed. The `.info` file puts the untaken branch on line 10 of `gains.cpp`, the `if (band < 0)` line. No test ever asked for a negative band, so the code that clamps it to $0$ has never been checked. Add `EXPECT_DOUBLE_EQ(gnc::pitch_gain(-1), 0.80);` and branch coverage reaches $6/6$.

**Sanity check.** Two files ran, `angles.cpp` and `gains.cpp`, with three functions between them: `deg_to_rad`, `wrap_pi` and `pitch_gain`. That matches "3 of 3 functions".
:::

::: warning
A high coverage number is not proof of correctness, as the example showed: $100\%$ of lines hid a branch no test had taken, and even $100\%$ of branches says nothing about whether the tests checked the *answers*. Use coverage to find code with no tests, not to grade tests. Also, the `.gcda` counters **add up** across runs. Run the tests twice without cleaning and every count doubles; run an old test program and its counts mix in. Reset them before each measured run with `lcov --zerocounters --directory build/coverage`, or start from a fresh build folder.
:::

Keep coverage and sanitizers in separate presets: one hunts bugs, the other wants clean counts at `-O0`, and mixing them makes both slower and harder to trust. Separate presets cost a folder each, and the next section makes folders cheap.

## ccache: never compile the same thing twice

Picture a math teacher who keeps every worked answer in a binder. When a student hands in a problem she has seen before, she does not work it again; she copies the answer from the binder. **ccache** is that binder for your compiler. It sits in front of the compiler and, for each file it is asked to compile, it computes a **[[hash|hash]]** — a short fingerprint — of everything that could change the result: the source file, every header it includes, the compiler flags and the compiler itself. If that fingerprint is already in its cache, it hands back the stored object file instead of compiling. If not, it compiles and stores the result.

CMake has a hook for exactly this: `CMAKE_CXX_COMPILER_LAUNCHER`, a program to run in front of the compiler. Add one line to the hidden `base` configure preset, and every preset gets it:

```json
"cacheVariables": {
  "CMAKE_EXPORT_COMPILE_COMMANDS": "ON",
  "CMAKE_CXX_COMPILER_LAUNCHER": "ccache"
}
```

::: example Deleting the build folder, cheaply
Configure and build `debug` from nothing with an empty cache, then delete `build/debug` completely and build again. `ccache -s` prints statistics; `ccache -z` zeroes them between runs. Times were measured around the build command on a four-core machine.

```text
first build, empty cache:        1.45 s
  Hits:               0 /   5 ( 0.00%)
  Misses:             5 /   5 (100.0%)

after deleting build/debug:      0.14 s
  Hits:               5 /   5 (100.0%)
    Direct:           5 /   5 (100.0%)
  Misses:             0 /   5 ( 0.00%)
```

Five compiles — `angles.cpp`, `gains.cpp`, `main.cpp` and the two test files — were all misses the first time and all hits the second. The build went from $1.45\,\mathrm{s}$ to $0.14\,\mathrm{s}$, about $10$ times faster, and the remaining time is linking and the test-discovery step, which ccache does not cache.

**Sanity check.** Would a rebuild of the `asan` folder hit the same entries? No: its files are compiled with different flags, so the fingerprints differ and it gets entries of its own. That is correct, because a sanitized object file really is different.
:::

ccache pays off less on a four-file project than on switching git branches, deleting a build folder to clear a confusing problem, and CI servers that start every job from a fresh checkout but keep [[the ccache folder|ci-cache]] between jobs. On a code base of thousands of files, a warm cache can turn a CI build measured in tens of minutes into one measured in minutes.

::: warning
ccache is safe because the fingerprint includes everything that affects the output, but it only knows what it is shown. Two things defeat it: the `__TIME__` macro, which bakes the build time into the code (so a file using it is "different" every time and never hits), and absolute paths that differ between machines, which is why the ccache setting `base_dir` exists for CI. If the hit rate stays near zero, run `ccache -s` and look for those first.
:::

## Build-time hygiene

A slow build gets run less often, and code tested less often ships more bugs, so build time is part of quality. Beyond ccache, these habits keep a CMake project fast:

- **Use Ninja and all your cores.** Ninja starts faster than Make and schedules jobs well; `cmake --build --preset debug -j 8` or `"jobs"` in a build preset uses the cores you have.
- **Keep heavy headers out of public headers.** Every file that includes `gnc/attitude.hpp` also compiles everything *it* includes. If that header includes Eigen, every user of `gnc` pays to parse Eigen, many thousands of lines, in every file. When a type is only used by pointer or reference in a header, a **[[forward declaration|forward-declaration]]** such as `class Ekf;` is enough, and the real `#include` moves to the `.cpp`.
- **List source files; do not glob them.** `file(GLOB ...)` finds files when CMake *configures*, not when you build. Add a new `.cpp` and the build does not know about it until someone re-runs configure, so it compiles fine on your machine and fails on a clean clone. Listing files by hand in `add_library` makes each addition a visible, reviewed line.
- **Precompiled headers and unity builds, when you need them.** `target_precompile_headers(gnc PRIVATE <cmath> <numbers>)` compiles those standard headers once per target and reuses the result. Configuring with `-DCMAKE_UNITY_BUILD=ON` glues each target's `.cpp` files into a few large files so shared headers are parsed once. Both can hide missing `#include` lines, so measure first and keep a normal build in CI.

::: key
ccache: set `CMAKE_CXX_COMPILER_LAUNCHER` to `ccache` in the base preset; it reuses an object file whenever the source, headers, flags and compiler are all unchanged. Build-time hygiene: Ninja with parallel jobs, heavy includes kept out of public headers, no source globbing, and precompiled headers or unity builds only after measuring.
:::

## Check yourself

::: check
A teammate adds `-fsanitize=address` to `gnc_build_options` with `target_compile_options` only. The library compiles; the tests fail to link with `undefined reference to '__asan_report_load8'`. Explain the error and the fix.
:::

::: answer
The compile flag made the compiler insert calls to ASan's checking functions, such as `__asan_report_load8`, into every object file. Those functions live in the ASan runtime library, which is only added when the *link* step also sees `-fsanitize=address`. Without it, the linker finds calls to functions that exist nowhere. The fix is the other half: `target_link_options(gnc_build_options INTERFACE -fsanitize=address)`, so every program that links the options target is linked with the runtime.
:::

::: check
The sanitizer build has `-fsanitize=undefined` but not `-fno-sanitize-recover=all`. A test triggers a signed integer overflow. What does the test output show, and what does CTest report? Why?
:::

::: answer
The output shows UBSan's message, for example `runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'`. But by default UBSan *recovers*: it prints the message and lets the program continue. If the program then finishes normally, its exit code is 0, and CTest, which judges only by the exit code, reports the test as **passed**. The finding scrolls past unnoticed. `-fno-sanitize-recover=all` makes UBSan stop the program with a nonzero exit code at the first finding, so the test fails.
:::

::: check
Why does `gnc` link `gnc_build_options` PRIVATE rather than PUBLIC? What would PUBLIC do to someone who installs `gnc` and uses it in their own project?
:::

::: answer
The options describe how *this project's* code is built for testing; they are not something a user of `gnc` needs in order to use it. PRIVATE keeps them on our own targets. PUBLIC would make them a usage requirement: every consumer target would inherit `gnc_build_options`, and whatever flags it held — sanitizers, `--coverage -O0` — would be forced onto the consumer's own code. (For export, the link must also be wrapped as `$<BUILD_INTERFACE:gnc_build_options>` so it is not recorded in the installed package.)
:::

::: check
A coverage report says a navigation library has 97% line coverage. Your lead says "good enough, ship it". Give two reasons that number could be misleading, one from this lesson's example and one about what coverage measures.
:::

::: answer
First, line coverage can hide untaken branches. In the gains example every line ran ($100\%$) but one branch of six ($83.3\%$ branch coverage) never did: the negative-band clamp was untested. A 97% line figure could hide many such branches. Second, coverage records that code *ran*, not that any test checked its *result*. A test that calls a function and asserts nothing adds coverage but catches nothing. Coverage is a map of untested code, not a grade.
:::

::: check
Your project's full build takes 12 minutes on CI. The team adds ccache, keeps its cache between jobs, and most builds drop to 3 minutes. One job still takes 12 minutes every time. Its compile commands include `-DBUILD_STAMP=\"$(date)\"`. What is going on?
:::

::: answer
ccache reuses an object file only when the fingerprint of everything that affects it — source, headers, flags, compiler — matches a stored one. That job passes a define whose value is the current date and time, and it changes on every run. So the flags are different every time, every fingerprint is new, and every compile is a miss. The fix is to keep changing values out of compiler flags: write the build stamp into one small generated `.cpp` file that only it compiles, so one file misses and the rest hit.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Options target | `add_library(gnc_build_options INTERFACE)`; real targets link it PRIVATE |
| `option(GNC_SANITIZE …)` | on/off cache variable set by a preset; off means an empty target |
| Sanitizer flags | `-fsanitize=address,undefined` on compile **and** link; `-fno-sanitize-recover=all`; `-fno-omit-frame-pointer` |
| Generator-expression form | `"$<$<CONFIG:Asan>:${san_flags}>"` with a custom `Asan` configuration |
| Export-safe link | `$<BUILD_INTERFACE:gnc_build_options>` |
| Coverage flags | `--coverage -O0` on compile, `--coverage` on link; `.gcno` at compile, `.gcda` at run |
| lcov and genhtml | capture, summarize, HTML report; `--rc branch_coverage=1`; zero counters between runs |
| Coverage caveat | 100% lines can hide untaken branches; ran is not checked |
| ccache | `CMAKE_CXX_COMPILER_LAUNCHER=ccache`; hit when source, headers, flags and compiler all match |
| Hygiene | Ninja and `-j`, light public headers, forward declarations, no globbing, measured PCH or unity builds |

Every build so far has run on the machine that built it. The next lesson, *Toolchain files and cross-compiling*, tells CMake about a different machine entirely — an ARM microcontroller of the kind that flies — and builds `gnc` for it from your laptop.

::: context flight-build Why the instruments come off
A sanitized program is a different program. ASan typically makes code about twice as slow and uses several times the memory, because it keeps a shadow record of every byte and pads every allocation with guard zones. A coverage build runs unoptimized and writes counters to files. A flight computer has fixed deadlines — a control loop that must finish every few milliseconds — and little memory to spare, so none of that can fly.

That is also why the tests must run on the *same* targets as the flight build, only instrumented: the aim is to test the code that ships, with extra eyes on it for the test run.
:::

::: context sanitizer-runtime The code behind the checks
When the compiler adds sanitizer checks, it does not write the whole checker into your program. It inserts short calls — "check this address", "report this error" — to functions in a separate library that ships with the compiler, such as `libasan` and `libubsan` with GCC. That library also replaces `malloc` and `free` so ASan can track every allocation.

The compile flag creates the calls. The link flag supplies the library that answers them. Which is why a sanitizer needs both, and why a link error full of `__asan_` names means one half is missing.
:::

::: context frame-pointer A bookmark for each function call
A register is one of the handful of tiny, very fast storage slots inside the processor. On x86-64, one of them, the frame pointer, can hold the start of the current function's stack frame, and each frame stores the previous one's start. Following that chain backward lists every function that led to the current line — the stack trace a sanitizer prints.

Optimizing compilers like to reuse that register for ordinary work, because registers are scarce. `-fno-omit-frame-pointer` tells the compiler to leave it alone. It costs a little speed and buys a stack trace you can read, a good trade in a test build.
:::

::: context branch Two roads from one if
A branch is a point where the program can go two ways. Every `if` has two: the condition is true, or it is false. Line coverage asks "did this line run?"; branch coverage asks "did each road get taken?".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="10" width="140" height="32" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">if (band &lt; 0)</text>
  <line x1="150" y1="42" x2="90" y2="92" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="210" y1="42" x2="270" y2="92" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="72" font-size="11" text-anchor="middle" fill="#b4232c">true</text>
  <text x="270" y="72" font-size="11" text-anchor="middle" fill="#1d6fd1">false</text>
  <rect x="20" y="96" width="140" height="32" rx="6" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="90" y="117" font-size="12" text-anchor="middle" fill="#1f2a44">band = 0</text>
  <rect x="200" y="96" width="140" height="32" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="270" y="117" font-size="12" text-anchor="middle" fill="#1f2a44">carry on</text>
  <text x="90" y="148" font-size="11" text-anchor="middle" fill="#b4232c">taken 0 times</text>
  <text x="270" y="148" font-size="11" text-anchor="middle" fill="#1d6fd1">taken on every call</text>
</svg>
```

Written on one line, `if (band < 0) band = 0;` counts as "run" as soon as the condition is checked, even if the assignment never happens. Branch coverage is what exposes the road nobody drove.
:::

::: context hash A fingerprint for a file
A hash function reads any amount of data and produces a short, fixed-length number from it, called a hash or digest. The same input always gives the same hash. Change even one character, and the hash comes out completely different.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="120" height="84" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">source file</text>
  <text x="70" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">+ all headers</text>
  <text x="70" y="70" font-size="11" text-anchor="middle" fill="#1f2a44">+ flags</text>
  <text x="70" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">+ compiler</text>
  <line x1="130" y1="56" x2="170" y2="56" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="176,56 166,51 166,61" fill="#1f2a44"/>
  <rect x="180" y="38" width="80" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="61" font-size="12" text-anchor="middle" fill="#1f2a44">hash</text>
  <line x1="260" y1="56" x2="290" y2="56" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="296,56 286,51 286,61" fill="#1f2a44"/>
  <text x="325" y="52" font-size="11" text-anchor="middle" fill="#1d6fd1">in cache?</text>
  <text x="325" y="68" font-size="11" text-anchor="middle" fill="#1d6fd1">look it up</text>
  <text x="180" y="112" font-size="11" fill="#1d6fd1">found: copy the stored .o (a hit)</text>
  <text x="180" y="132" font-size="11" fill="#b4232c">not found: compile, then store (a miss)</text>
</svg>
```

ccache uses the hash as the name of a drawer in its cabinet. Same fingerprint, same drawer, same object file — so there is no need to ask the compiler again.
:::

::: context ci-cache Keeping the binder between jobs
CI jobs usually start in a brand-new, empty machine, so a cache kept inside it vanishes when the job ends. CI systems offer a way to save a folder at the end of a job and restore it at the start of the next one. Point ccache at such a folder — through the `CCACHE_DIR` environment variable — and each job starts with the previous job's binder of answers. The first job after a big change is slow; the ones after it are fast again.
:::

::: context forward-declaration Naming a type without describing it
A forward declaration tells the compiler "a class called `Ekf` exists" without saying what is in it. That is enough for the compiler to handle a pointer or a reference to an `Ekf`, because every pointer is the same size whatever it points to. It is not enough to create one, copy one or call its functions; for those the compiler needs the full class, from its header.

So a public header that only passes `Ekf` around by reference can say `class Ekf;` and skip the include. Every file that includes that header then compiles faster, and it no longer has to be recompiled when `ekf.hpp` changes. This is also the idea behind the pImpl pattern, which hides a class's private members, and their heavy includes, behind a pointer.
:::
