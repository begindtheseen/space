---
id: l01-why-cmake-and-a-first-project
title: Why CMake, and a first project
minutes: 22
covers:
  - cmake_minimum_required, project, and why a modern minimum matters
  - Out-of-source builds and CMAKE_BUILD_TYPE
---

Think about a recipe card. It says "bake at 180 degrees for 25 minutes". It does not say which knob on *your* oven to turn, or whether your oven is gas or electric. The card describes *what* you want. Your own knowledge of your kitchen supplies the *how*.

In the C++ basics module you wrote a Makefile by hand. That was more like a note taped to one particular oven: "turn the left knob to 4". Move to a teammate's Mac, a Windows machine or a flight computer's cross compiler, and the note is wrong. Somebody has to rewrite it, and every rewrite is a chance to get it slightly different.

**CMake** — a free tool that reads a description of your project and writes the build instructions for whatever machine it is running on — is the recipe card. You write, once, *what* to build: "these source files make a program called `orbit_speed`, and it needs C++20". CMake works out *how* for the computer in front of it. It is a **[[build system generator|build-system-generator]]**: it does not compile anything itself. It writes a Makefile (or a file for another build tool), and that tool runs the compiler, exactly as you did by hand.

Drone autopilots, NASA flight-software frameworks, Eigen and GoogleTest are all [[built with CMake|who-uses-cmake]]. This lesson gets a first project running and explains four ideas every CMake project stands on: configure-then-build, the `cmake_minimum_required` line, the `project` line, and where the build goes and what kind of build it is.

## Two steps: configure, then build

CMake always works in two steps. Keep them apart in your head, because errors in one look nothing like errors in the other.

1. **Configure** — CMake reads your `CMakeLists.txt` (the recipe card; the name must be spelled exactly that way), finds a compiler, tests it, and writes the real build files into a folder you choose. The last part of this step is called **generate**, and CMake prints both words when it finishes.
2. **Build** — a build tool such as `make` or **[[Ninja|ninja]]** reads those generated files and runs the compiler and linker. It only rebuilds what has changed, as your hand-written Makefile did.

The two commands are:

```bash
cmake -S . -B build
cmake --build build
```

Read the first aloud as "CMake, the **S**ource is here (the dot means this folder), put the **B**uild in `build`", and the second as "CMake, build whatever is in `build`". The second calls `make` or `ninja` for you, so you never need to remember which was chosen.

::: key
Configure (`cmake -S . -B build`) reads `CMakeLists.txt`, detects the compiler and writes build files into `build/`. Build (`cmake --build build`) runs the generated build tool, which runs the compiler. Change a `CMakeLists.txt` and the next build re-runs configure by itself.
:::

::: example A first project, start to finish
Make a folder called `orbit_speed` with two files. The program works out how fast a spacecraft must go to stay in a circular orbit $400\,\mathrm{km}$ up, using $v = \sqrt{\mu / r}$, where $\mu$ (read "mew") is Earth's gravitational parameter and $r$ is the distance from Earth's center.

`main.cpp`:

```cpp
#include <cmath>
#include <cstdio>

int main() {
    const double mu = 3.986e14;       // Earth's gravitational parameter, m^3/s^2
    const double r  = 6378e3 + 400e3; // Earth's radius plus 400 km, in m
    const double v  = std::sqrt(mu / r);
    std::printf("circular orbit speed at 400 km: %.0f m/s\n", v);
    return 0;
}
```

`CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.28)
project(orbit_speed VERSION 0.1.0 LANGUAGES CXX)

message(STATUS "Configuring ${PROJECT_NAME} ${PROJECT_VERSION}")

add_executable(orbit_speed main.cpp)
```

Line by line: which CMake rules this file follows; the project's name and language; a note printed while configuring, showing two variables `project` filled in; and "make a program called `orbit_speed` from `main.cpp`".

Now configure:

```bash
cmake -S . -B build
```

```text
-- The CXX compiler identification is GNU 13.3.0
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /usr/bin/c++ - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Configuring orbit_speed 0.1.0
-- Configuring done (0.2s)
-- Generating done (0.0s)
-- Build files have been written to: .../orbit_speed/build
```

(The dots stand for a folder path that will differ on your computer.) The first six lines are CMake meeting your compiler: GNU g++ 13.3.0, and which C++ features it supports. Then our message, then the two halves of configure.

Now build and run:

```bash
cmake --build build
./build/orbit_speed
```

```text
[ 50%] Building CXX object CMakeFiles/orbit_speed.dir/main.cpp.o
[100%] Linking CXX executable orbit_speed
[100%] Built target orbit_speed
circular orbit speed at 400 km: 7669 m/s
```

The two familiar stages from the basics module are there: compile `main.cpp` into an object file, then link it into a program.

Sanity check: $\sqrt{3.986 \times 10^{14} / 6.778 \times 10^{6}} \approx 7669\,\mathrm{m/s}$, and the International Space Station, about 400 km up, moves at about 7.7 km/s. It makes sense.
:::

Here is what landed in `build`:

```text
CMakeCache.txt  CMakeFiles  Makefile  cmake_install.cmake  orbit_speed
```

The `Makefile` is the one CMake wrote. `CMakeCache.txt` is CMake's memory of this build folder (more below). `orbit_speed` is your program.

To see the real compiler commands, add `--verbose` to the build. They include `-MD`, a cousin of the header-tracking `-MMD` you added to your Makefile by hand; CMake switches it on for you.

::: warning Do not edit the generated files
The `Makefile` in `build/` is output, like an object file. Edit it and your change is thrown away the next time CMake regenerates it, which happens every time any `CMakeLists.txt` changes. Every change goes in `CMakeLists.txt`.
:::

## `cmake_minimum_required`: which rulebook this file follows

CMake is more than twenty-five years old. Its authors keep finding old behaviors that were mistakes. Changing them outright would silently break thousands of projects, so each change is recorded as a **policy** — a named switch, like `CMP0083`, with an OLD behavior and a NEW one — and each project decides which it gets.

Picture a board game that has had several editions of its rulebook. Before you play, everyone agrees which edition you are using. `cmake_minimum_required` is that agreement. Writing

```cmake
cmake_minimum_required(VERSION 3.28)
```

does two jobs at once:

1. It refuses to run on any CMake older than 3.28, with a clear error, instead of failing halfway through on a command the old version does not know.
2. It switches every **[[policy|policies]]** that was introduced up to version 3.28 to its NEW behavior. You get the fixed behavior, not the historical mistake.

Here is the first job in action. With `VERSION 3.30` on a machine that has CMake 3.28:

```text
CMake Error at CMakeLists.txt:1 (cmake_minimum_required):
  CMake 3.30 or higher is required.  You are running version 3.28.3


-- Configuring incomplete, errors occurred!
```

And here is the second. This test file asks CMake for the setting of two policies, `CMP0083` (added in CMake 3.14) and `CMP0135` (added in 3.24), under three different minimums:

```cmake
cmake_minimum_required(VERSION 3.28)   # tried with 2.8.12, 3.10 and 3.28
project(policy_demo LANGUAGES CXX)
cmake_policy(GET CMP0083 pie)
cmake_policy(GET CMP0135 ts)
message(STATUS "minimum ${CMAKE_MINIMUM_REQUIRED_VERSION}: CMP0083='${pie}' CMP0135='${ts}'")
```

`cmake_policy(GET ...)` copies a policy's setting into a variable, and `CMAKE_MINIMUM_REQUIRED_VERSION` holds the number from line 1. The three runs print:

```text
-- minimum 2.8.12: CMP0083='' CMP0135=''
-- minimum 3.10: CMP0083='' CMP0135=''
-- minimum 3.28: CMP0083='NEW' CMP0135='NEW'
```

An empty setting means "not chosen", and CMake falls back to the OLD behavior. One number in line 1 changed how the same CMake behaves. The 2.8.12 run also printed:

```text
CMake Deprecation Warning at CMakeLists.txt:1 (cmake_minimum_required):
  Compatibility with CMake < 3.5 will be removed from a future version of
  CMake.

  Update the VERSION argument <min> value or use a ...<max> suffix to tell
  CMake that the project does not need compatibility with older versions.
```

That warning came true: [[CMake 4.0 removed that old compatibility|cmake-4]].

### Why a modern minimum matters

A modern minimum buys three concrete things.

- **The commands this module teaches.** Asking for C++20 with `target_compile_features(... cxx_std_20)` needs CMake 3.12 or newer, `FetchContent_MakeAvailable` (lesson 05) needs 3.14, and preset files (lesson 07) need 3.19.
- **Fixed behavior.** Every NEW policy is a bug fix or a safer default. An old minimum opts you back into every old mistake at once.
- **A clear failure.** A teammate with an ancient CMake gets one honest error on line 1, not a puzzle on line 80.

The cost is that everyone needs that CMake or newer, which is cheap: CMake is a single download. Set the minimum to the oldest version your team and your **continuous integration** servers (the machines that build every change automatically) actually run. This module uses 3.28, the version that ships with Ubuntu 24.04.

::: key
`cmake_minimum_required(VERSION x.y)` must be the first line. It rejects older CMake with a clear error and sets every policy up to x.y to NEW. A modern minimum gives you the target-based commands, the fixed behaviors and an honest failure on old tools; an old one silently opts you into old behavior.
:::

::: warning Put it first, and do not leave it out
Without it, or with it after `project`, CMake warns:

```text
CMake Warning (dev) at CMakeLists.txt:1 (project):
  cmake_minimum_required() should be called prior to this top-level project()
  call.  Please see the cmake-commands(7) manual for usage documentation of
  both commands.
This warning is for project developers.  Use -Wno-dev to suppress it.
```

It is only a warning, so it is easy to ignore. Do not: the project then runs with a guess at which rulebook applies.
:::

## `project`: naming the thing and meeting the compiler

The second line of every top-level `CMakeLists.txt` is `project`:

```cmake
project(orbit_speed VERSION 0.1.0 LANGUAGES CXX)
```

It does three things.

- It **names the project** and stores the name in the variable `PROJECT_NAME`. A **variable** in CMake is a named piece of text, and `${PROJECT_NAME}` (read "the value of PROJECT_NAME") pastes it in, the way `$HOME` does in the shell.
- It **records the version**, split into `PROJECT_VERSION` (`0.1.0`), `PROJECT_VERSION_MAJOR` (`0`) and so on. Lesson 10 turns this into a version file other projects can check.
- It **turns on the languages** you list and finds a compiler for each. Those "Detecting CXX compiler" lines you saw come from here. `LANGUAGES CXX` means C++ only; leave it out and CMake looks for a C compiler too, which costs time and fails on machines that have no C compiler.

It also sets `PROJECT_SOURCE_DIR` (the folder holding this `CMakeLists.txt`) and `PROJECT_BINARY_DIR` (the matching folder in the build tree).

Because `project` is where the compiler is found, anything that changes the compiler must happen *before* it. That is why cross-compiling to a flight processor (lesson 09) uses a special file CMake reads before this line.

## Out-of-source builds

When you cook, you do not mix the batter inside the flour bag. The mess happens in a bowl, and afterwards you wash the bowl. The flour never changed.

Your source folder is the flour bag. An **out-of-source build** keeps everything CMake and the compiler produce — generated Makefiles, object files, the cache, the programs — in a separate folder. `-B build` is what does that.

The alternative, an **in-source build**, runs CMake inside the source folder itself (`cmake .` with no `-B`). Here is `git status --short` for the `orbit_speed` project, first after an out-of-source configure, then after also running `cmake .` in the source folder:

```text
?? CMakeLists.txt
?? build/
?? main.cpp
```

```text
?? CMakeCache.txt
?? CMakeFiles/
?? CMakeLists.txt
?? Makefile
?? build/
?? cmake_install.cmake
?? main.cpp
```

(`??` means "a file git is not tracking".) In the first listing, `build/` covers every generated file, and one line in a **[[.gitignore file|gitignore]]** hides it for good. In the second, CMake's output is mixed in with your own files, and someone will soon commit a `Makefile` by accident.

Out of source also lets you keep several builds of the same code side by side, each in its own folder, sharing one copy of the source:

```bash
cmake -S . -B build/debug   -DCMAKE_BUILD_TYPE=Debug
cmake -S . -B build/release -DCMAKE_BUILD_TYPE=Release
```

The `-D` (read "define") sets a CMake variable from the command line. Each folder is a complete, independent build. And a truly clean build is deleting a folder: `rm -rf build`.

::: key
Why an out-of-source build? It keeps generated files out of the repository, lets several configurations coexist, and makes a clean build a directory delete. In-source builds pollute git status and make the cache hard to reason about.
:::

### The cache remembers

The file `CMakeCache.txt` in each build folder is **[[the cache|cmake-cache]]**: CMake's notebook of every choice made for that folder, including every `-D` you passed. It makes later configures fast, and it is a trap. Configure a folder as Release, configure it again without the `-D`, and ask the cache:

```text
CMAKE_BUILD_TYPE:STRING=Release
```

The setting stuck. Usually that is what you want, but a build folder can carry an old choice nobody remembers making.

::: warning When the build acts strangely, delete the build folder
If a build is behaving in a way the `CMakeLists.txt` does not explain, the cache may hold a stale value. Removing the folder and configuring again costs a minute and rules the cache out completely. With an in-source build that cure is much harder, because the cache is mixed in with your source files.
:::

## `CMAKE_BUILD_TYPE`: practice mode or race mode

Many video games have a practice mode with hints and rewinds, and a race mode that is fast and gives no help. Your program has the same two modes.

- A **Debug** build keeps the machine code close to what you wrote, so a debugger can step through it line by line, and it keeps every `assert` check switched on. It is slow.
- A **Release** build lets the compiler rearrange and speed up the code, and it switches the `assert` checks off. It is fast, and it is what flies.

The variable `CMAKE_BUILD_TYPE` picks the mode at configure time. CMake knows four. With GCC, these are the flags each adds, read from `CMakeCache.txt`:

| Build type | Flags added | What they mean |
| --- | --- | --- |
| `Debug` | `-g` | debugging information, no optimization |
| `Release` | `-O3 -DNDEBUG` | heavy optimization, `assert` switched off |
| `RelWithDebInfo` | `-O2 -g -DNDEBUG` | optimized, with debugging information |
| `MinSizeRel` | `-Os -DNDEBUG` | optimized for a small program |

`-O3` (read "oh three") is the compiler's highest standard **[[optimization level|optimization-levels]]**. `-DNDEBUG` defines the name `NDEBUG`, and when that name is defined, every **[[assert|ndebug]]** in your code turns into nothing.

If you set no build type at all, as in the first example, the variable is empty and CMake adds *none* of these flags: no `-O`, no `-g`, no `-DNDEBUG`. You get an unoptimized program with no debug information — the worst of both — and a benchmark run on it tells you nothing.

::: example The same code, two build types
One `CMakeLists.txt` with a single `add_executable(numcheck main.cpp)`, configured twice. The extra `-DCMAKE_CXX_FLAGS=-march=native` lets the compiler use every instruction this machine's processor has, as many performance-minded projects do:

```bash
cmake -S . -B build/debug   -DCMAKE_BUILD_TYPE=Debug   -DCMAKE_CXX_FLAGS=-march=native
cmake -S . -B build/release -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS=-march=native
cmake --build build/debug
cmake --build build/release
```

`main.cpp` does three small jobs:

```cpp
#include <cassert>
#include <chrono>
#include <cstdio>

// How fast a reading changed, per second.
double rate(double change, double dt_s) {
    assert(dt_s > 0.0 && "time step must be positive");
    return change / dt_s;
}

// a*b + c: the pattern a processor can do in one "fused" step.
double residual(double a, double b, double c) { return a * b + c; }

int main() {
    // 1. Speed: call rate() one hundred million times, 50 Hz steps.
    const auto t0 = std::chrono::steady_clock::now();
    double sum = 0.0;
    for (int i = 0; i < 100'000'000; ++i) {
        const double change = static_cast<double>(i % 1000);
        sum += rate(change, 0.02);
    }
    const auto t1 = std::chrono::steady_clock::now();
    const double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
    std::printf("sum = %.6e   time = %.0f ms\n", sum, ms);

    // 2. Rounding: 0.1 * 10 - 1 should be zero.
    volatile double a = 0.1, b = 10.0, c = -1.0;
    std::printf("0.1 * 10 - 1 = %.3g\n", residual(a, b, c));

    // 3. A bad input: a time step of zero.
    volatile double dt = 0.0;
    std::printf("rate = %g per second\n", rate(5.0, dt));
    return 0;
}
```

(`volatile` stops the compiler working the answer out in advance, so the arithmetic really happens while the program runs.)

The Debug build, `./build/debug/numcheck`:

```text
sum = 2.497500e+12   time = 988 ms
0.1 * 10 - 1 = 0
numcheck: .../numcheck/main.cpp:7: double rate(double, double): Assertion `dt_s > 0.0 && "time step must be positive"' failed.
```

and the program stops. The Release build, `./build/release/numcheck`:

```text
sum = 2.497500e+12   time = 100 ms
0.1 * 10 - 1 = 5.55e-17
rate = inf per second
```

**Speed.** Same answer, about ten times faster in Release (988 ms against 100 ms here; your numbers will differ, but the gap will be large). A timing in one build type says nothing about the other.

**Rounding.** Debug says zero. Release says $5.55 \times 10^{-17}$. Neither is a bug. The Release build used a **[[fused multiply-add|fma]]**, one processor instruction that computes `a * b + c` with a single rounding at the end instead of two. The note below shows exactly where the tiny number comes from. A test that compares floating-point results with `==` can pass in one build and fail in the other.

**The bad input.** Debug stops at the `assert` and names the line. In Release, `-DNDEBUG` removed the `assert`, so it divides by zero and carries on with an infinite rate that a guidance loop would happily use.

Sanity check on the sum: `i % 1000` runs through $0, 1, \dots, 999$ a hundred thousand times. Those add to $499{,}500$ each round, so the total change is $4.995 \times 10^{10}$, and dividing by $0.02\,\mathrm{s}$ gives $2.4975 \times 10^{12}$. Both builds print exactly that.
:::

::: note Why the fused result is not zero
A `double` cannot hold $0.1$ exactly. The nearest one is

$$
0.1000000000000000055511151231257827\ldots
$$

which is $0.1 + 5.55 \times 10^{-18}$. Multiply by $10$ exactly and you get $1 + 5.55 \times 10^{-17}$.

Without fusing, that product is rounded to the nearest `double` first. Near $1$, neighboring doubles are $2^{-52} \approx 2.22 \times 10^{-16}$ apart, so anything within half of that, $1.11 \times 10^{-16}$, rounds to exactly $1$. Our extra $5.55 \times 10^{-17}$ is smaller than that, so the product becomes $1$, and $1 - 1 = 0$.

With fusing, there is no rounding between the multiply and the add. The processor subtracts $1$ from the exact product and rounds only the final answer, $5.55 \times 10^{-17}$, which a double can hold almost exactly. One rounding instead of two: more accurate, and different.
:::

So for GNC code the build type is not a detail. A navigation filter's output can differ in its last digits between Debug and Release, an `assert` guarding a zero time step exists in only one of them, and "the filter update takes 40 microseconds" means nothing until you say which build was measured.

::: key
Why does CMAKE_BUILD_TYPE matter for a numerical library? It selects the optimisation and assertion flags, so Debug and Release can produce different timing, different floating-point contraction and different assertion behaviour. Both must be built and tested, and the type must be stated in any benchmark.
:::

::: warning Testing only one build type
Teams often test only in Debug, which developers use every day, and then ship Release. Those are different programs. Run the tests in both, and write the build type next to every benchmark number. And an empty build type is not "the default optimized build": it is no optimization at all.
:::

Make and Ninja are **single-configuration** tools: each build folder has one build type, fixed at configure time, which is why we made two folders. Some generators, such as Visual Studio and "Ninja Multi-Config", are **[[multi-configuration|multi-config]]**: one build folder holds several build types, and you pick one when you build, with `cmake --build build --config Release`. Lesson 04 shows how to write settings that work under both kinds.

## Check yourself

::: check
A teammate says, "I ran `cmake -S . -B build` and it printed `Build files have been written to`, so my code compiles." What is wrong with that reasoning?
:::

::: answer
That line ends the *configure* step, which reads `CMakeLists.txt`, tests the compiler and writes build files. Not one of your source files has been compiled yet. A syntax error in `main.cpp` shows up only at `cmake --build build`. Configure catches mistakes in `CMakeLists.txt` (a misspelled command, a missing file, too old a CMake); build catches mistakes in your C++.
:::

::: check
Your `CMakeLists.txt` starts with `cmake_minimum_required(VERSION 3.5)`, and your whole team has CMake 3.28. Everything builds. Name two things you lose compared with `VERSION 3.28`.
:::

::: answer
First, every policy added after 3.5 is left unset, so CMake silently uses the OLD behavior for all of them, even though your CMake knows the fix. Second, the file no longer says what it needs. Once someone uses a feature newer than 3.5 (such as `cxx_std_20`, which needs 3.12), a person with CMake 3.10 gets past line 1 and fails in the middle with a confusing message, instead of a clear "CMake 3.28 or higher is required" at the top.
:::

::: check
You have one source folder and want a Debug build for the debugger and a Release build for timing. Write the four commands, and say how you would get a completely clean Release build later.
:::

::: answer
```bash
cmake -S . -B build/debug   -DCMAKE_BUILD_TYPE=Debug
cmake -S . -B build/release -DCMAKE_BUILD_TYPE=Release
cmake --build build/debug
cmake --build build/release
```

Each `-B` folder is a complete build with its own cache. A clean Release build is `rm -rf build/release`, then its configure and build commands again. The source folder is never touched, because the builds are out of source.
:::

::: check
Someone configures with `cmake -S . -B build` (no build type) and reports that the attitude filter takes 3 ms per update. What flags were used, and what should you ask them to do?
:::

::: answer
No per-type flags at all: no `-O` (so no optimization), no `-g`, no `-DNDEBUG`. The 3 ms is unoptimized code with every `assert` still running, possibly several times slower than what will fly. Ask them to configure a separate folder with `-DCMAKE_BUILD_TYPE=Release` (or `RelWithDebInfo` to profile), measure again, and report the number with the build type.
:::

::: check
In the example, `0.1 * 10 - 1` printed `0` in Debug and `5.55e-17` in Release. Is the Release answer wrong? What does this mean for a unit test that checks `residual(0.1, 10, -1) == 0.0`?
:::

::: answer
Neither is wrong. The exact value of (the double nearest 0.1) × 10 − 1 is about $5.55 \times 10^{-17}$, and Release's fused multiply-add gets it. Debug rounds the product to $1$ first and gets $0$. The test passes in Debug and fails in Release. Floating-point tests should compare with a tolerance suited to the problem (say, "within $10^{-12}$"), and run in both build types.
:::

## Summary

| Idea | Meaning | Command or fact |
| --- | --- | --- |
| build system generator | writes build files for this machine; does not compile | CMake writes a `Makefile` or `build.ninja` |
| configure | read `CMakeLists.txt`, detect compiler, write build files | `cmake -S . -B build` |
| build | run the generated build tool | `cmake --build build` (add `--verbose` to see commands) |
| `cmake_minimum_required` | first line; rejects older CMake, sets policies NEW | `cmake_minimum_required(VERSION 3.28)` |
| policy | a named old-versus-new behavior switch | `CMP0083`, set NEW by a 3.14+ minimum |
| `project` | name, version, languages; finds the compiler | `project(orbit_speed VERSION 0.1.0 LANGUAGES CXX)` |
| out-of-source build | all output in its own folder | clean build is `rm -rf build` |
| cache | remembers every choice for one build folder | `build/CMakeCache.txt` |
| `CMAKE_BUILD_TYPE` | chooses optimization and assert flags | Debug `-g`; Release `-O3 -DNDEBUG`; empty adds nothing |

The next lesson, *Targets: libraries and executables*, grows the one-program project into a library plus a program, and shows the three kinds of library CMake can make — static, shared and header-only — and when a flight project wants each one.

::: context build-system-generator A tool that writes instructions for another tool
CMake sits one level above the build tools you already know. You describe the project once; CMake writes the rules; the build tool follows them and calls the compiler.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="40" width="72" height="40" rx="4" fill="#ffffff"/>
    <rect x="98" y="40" width="64" height="40" rx="4" fill="#8fb8f0"/>
    <rect x="180" y="40" width="80" height="40" rx="4" fill="#ffffff"/>
    <rect x="278" y="40" width="74" height="40" rx="4" fill="#f2b880"/>
  </g>
  <text x="44" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">CMakeLists</text>
  <text x="44" y="71" font-size="11" text-anchor="middle" fill="#1f2a44">.txt</text>
  <text x="130" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">cmake</text>
  <text x="220" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">Makefile or</text>
  <text x="220" y="71" font-size="11" text-anchor="middle" fill="#1f2a44">build.ninja</text>
  <text x="315" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">make/ninja</text>
  <text x="315" y="71" font-size="11" text-anchor="middle" fill="#1f2a44">runs g++</text>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="80" y1="60" x2="94" y2="60"/><line x1="162" y1="60" x2="176" y2="60"/><line x1="260" y1="60" x2="274" y2="60"/>
  </g>
  <line x1="98" y1="100" x2="260" y2="100" stroke="#1d6fd1" stroke-width="2"/>
  <text x="179" y="118" font-size="11" text-anchor="middle" fill="#1d6fd1">configure: cmake -S . -B build</text>
  <line x1="278" y1="100" x2="352" y2="100" stroke="#6c7a93" stroke-width="2"/>
  <text x="315" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">build</text>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">you write only the first box</text>
</svg>
```

Because the middle box is generated, the same `CMakeLists.txt` can produce Makefiles on Linux, Visual Studio projects on Windows or Xcode projects on a Mac.
:::

::: context who-uses-cmake Where you will meet it
PX4, the open-source autopilot flown on many research and commercial drones, builds with CMake. So does F Prime (F´), the flight-software framework from NASA's Jet Propulsion Laboratory that flew on the Ingenuity Mars helicopter, and NASA's core Flight System (cFS). Eigen and GoogleTest, which you use in this course, ship CMake files so other projects can find them.

CMake itself comes from Kitware, a company that started it around 2000 to build a large medical-imaging toolkit on many kinds of computer. That problem — one codebase, many machines and compilers — is exactly the flight-software problem too.
:::

::: context ninja A faster build tool
Ninja is a small build tool written at Google to build the Chrome web browser, whose huge codebase made `make` feel slow. Its input files are meant to be written by a generator like CMake, not by people, so they are simple and fast to read.

Ask for it at configure time with `-G Ninja`:

```bash
cmake -S . -B build-ninja -G Ninja
cmake --build build-ninja
```

```text
[1/2] Building CXX object CMakeFiles/orbit_speed.dir/main.cpp.o
[2/2] Linking CXX executable orbit_speed
```

The folder now holds `build.ninja` instead of `Makefile`. Nothing in `CMakeLists.txt` changed, and `cmake --build` hides the difference completely. Ninja also runs as many compile jobs in parallel as your computer has cores, without being asked.
:::

::: context policies What a policy looks like
Every policy has a number, `CMP` followed by four digits, and a page in the CMake documentation that explains the OLD behavior, the NEW behavior, and the version that introduced it. For example, `CMP0083` (CMake 3.14) is about whether CMake passes the right flags to make programs position-independent, a security feature. `CMP0135` (CMake 3.24) is about the timestamps given to files unpacked from downloaded archives.

You rarely touch a policy by name. The minimum version sets them all in one go, and that is the point: one number in line 1 decides dozens of behaviors, so choose it deliberately.
:::

::: context cmake-4 The day old minimums stopped working
CMake 4.0, released in 2025, removed compatibility with versions older than 3.5. A project whose first line says `cmake_minimum_required(VERSION 2.8)` now stops with an error instead of a warning. Many old open-source projects broke overnight, and people building them had to set a variable, `CMAKE_POLICY_VERSION_MINIMUM`, as a temporary way through.

The lesson for your own projects: a deprecation warning in CMake output is a notice with a date on it, even when the date is not printed. A modern minimum means you are not the project that breaks.
:::

::: context gitignore Telling git to look away
A `.gitignore` file in the repository lists names git should never offer to track. For a CMake project, one line covers every out-of-source build folder you make inside the source tree:

```text
build/
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="16" y="22" font-size="12" fill="#1f2a44" font-weight="700">orbit_speed/</text>
  <g stroke="#6c7a93" stroke-width="1.5" fill="none">
    <path d="M24,28 V132"/><path d="M24,46 H40"/><path d="M24,68 H40"/><path d="M24,90 H40"/>
    <path d="M24,132 H40"/><path d="M52,98 V124"/><path d="M52,110 H66"/><path d="M52,124 H66"/>
  </g>
  <text x="44" y="50" font-size="12" fill="#1d6fd1">CMakeLists.txt</text>
  <text x="44" y="72" font-size="12" fill="#1d6fd1">main.cpp</text>
  <text x="44" y="94" font-size="12" fill="#b4232c">build/</text>
  <text x="70" y="114" font-size="11" fill="#b4232c">debug/</text>
  <text x="70" y="128" font-size="11" fill="#b4232c">release/</text>
  <text x="44" y="136" font-size="12" fill="#1d6fd1">.gitignore</text>
  <rect x="190" y="36" width="160" height="42" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="270" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">blue: your files,</text>
  <text x="270" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">tracked by git</text>
  <rect x="190" y="90" width="160" height="42" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="270" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">red: generated,</text>
  <text x="270" y="123" font-size="11" text-anchor="middle" fill="#1f2a44">ignored, deletable</text>
</svg>
```

The slash at the end means "a folder with this name". With in-source builds you would need a line for `CMakeCache.txt`, `CMakeFiles/`, `Makefile`, `cmake_install.cmake`, and one for every file each generator produces, and the list would never be complete.
:::

::: context cmake-cache A notebook per build folder
`CMakeCache.txt` is a plain text file of `NAME:TYPE=value` lines, one for every setting CMake decided or was told. The compiler it found, the build type, every `-D` you passed and many internal values are all written down there. On the next configure CMake reads the notebook first and skips work it already did.

You can look at it with any text editor, or list the settings with `cmake -L build`. The rule of thumb: read it freely, change settings by configuring again with `-D`, and if it ever seems to hold nonsense, delete the whole build folder rather than editing the file by hand.
:::

::: context optimization-levels What the compiler does at -O3
At `-O0`, the default with no flag, the compiler translates each line almost literally and keeps every variable in memory, so a debugger can show you any variable at any line. At `-O2` and `-O3` it keeps values in registers, copies small functions into their callers (inlining), removes work whose result is never used, and at `-O3` works harder at doing several loop iterations at once. `-Os` aims for small machine code instead of the fastest.

None of this is supposed to change what a correct program prints, apart from floating-point details the language allows. It does change timing, sometimes by a factor of ten, as the example showed.
:::

::: context ndebug The switch that removes the checks
`assert(condition)` from `<cassert>` stops the program with a message naming the file and line when the condition is false. But `<cassert>` is written so that if the name `NDEBUG` ("no debug") is defined, every `assert` becomes an empty statement. Release builds define it with `-DNDEBUG`.

So an `assert` is a Debug-build tool. A check that must protect the vehicle in flight — a zero time step, a sensor value out of range — has to be ordinary code that handles the problem, not an `assert`, because the flown build does not contain it.
:::

::: context fma Two roundings or one
A fused multiply-add computes $a \times b + c$ in one instruction. The difference is where rounding happens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44" font-weight="700">separate</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="80" y="8" width="60" height="24" rx="3" fill="#ffffff"/>
    <rect x="160" y="8" width="60" height="24" rx="3" fill="#f2b880"/>
    <rect x="240" y="8" width="44" height="24" rx="3" fill="#ffffff"/>
    <rect x="300" y="8" width="50" height="24" rx="3" fill="#f2b880"/>
  </g>
  <text x="110" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">a × b</text>
  <text x="190" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">round</text>
  <text x="262" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">+ c</text>
  <text x="325" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">round</text>
  <text x="80" y="52" font-size="11" fill="#6c7a93">1 + 5.55e-17 becomes 1, then 1 − 1 = 0</text>
  <text x="10" y="92" font-size="12" fill="#1f2a44" font-weight="700">fused</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="80" y="78" width="204" height="24" rx="3" fill="#8fb8f0"/>
    <rect x="300" y="78" width="50" height="24" rx="3" fill="#f2b880"/>
  </g>
  <text x="182" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">a × b + c, exact inside</text>
  <text x="325" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">round</text>
  <text x="80" y="122" font-size="11" fill="#6c7a93">(1 + 5.55e-17) − 1 = 5.55e-17</text>
  <text x="180" y="150" font-size="11" text-anchor="middle" fill="#b4232c">orange boxes: where rounding happens</text>
</svg>
```

Letting the compiler turn `a * b + c` into one fused instruction is called floating-point contraction. GCC does it when optimizing and when the processor supports it, which is why it appeared only in the Release build with `-march=native`.
:::

::: context multi-config One folder, several build types
With a multi-configuration generator, `CMAKE_BUILD_TYPE` is ignored. The build folder holds every type at once, in subfolders such as `Debug/` and `Release/`, and you choose at build time:

```bash
cmake -S . -B build -G "Ninja Multi-Config"
cmake --build build --config Release
```

This matters for how you write `CMakeLists.txt`. A line like "if the build type is Debug, add this flag" works at configure time, and with a multi-config generator there is no single build type at configure time. Lesson 04 introduces generator expressions, which answer the question at build time and so work under both kinds of generator.
:::
