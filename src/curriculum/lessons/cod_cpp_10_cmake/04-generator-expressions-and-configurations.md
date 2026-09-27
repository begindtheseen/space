---
id: l04-generator-expressions-and-configurations
title: Generator expressions and build configurations
minutes: 18
covers:
  - Generator expressions and per-configuration settings
---

Think of a form letter. A school sends the same letter to every family: "Dear ____, your child's bus leaves at ____." The office writes the letter once, in September. The blanks are filled in later, one copy at a time, when the letters are printed. Nobody writes three hundred letters by hand, and nobody has to know every family's name on the day the letter is written.

CMake has blanks like that. You write a target once, but some of its settings depend on things CMake does not know yet while it reads your `CMakeLists.txt`: whether this is a Debug or a Release build, which compiler will run, where the library will end up on disk. A **generator expression** — a blank written as `$<...>` that CMake fills in later, separately for each target and each build configuration — lets you leave those answers open.

On a flight-software team this matters every day. The same guidance library is built in Debug on laptops, with every self-check on, and in Release for the flight computer, with the checks trimmed and the optimizer on. Some of it is compiled with GCC for the Linux simulator and with another compiler for a test bench. Generator expressions keep that one library to one target definition.

## Two moments: configure and generate

The first lesson split a CMake build into two commands: `cmake -S . -B build` to configure, and `cmake --build build` to build. The first command actually does two jobs, one after the other.

1. **Configure.** CMake runs your `CMakeLists.txt` from top to bottom, like a script. Variables get values, `if()` tests run, `message()` prints, and targets get created with their properties.
2. **Generate.** With every target known, CMake writes the real build files — a `Makefile` or a `build.ninja` — one for each configuration it has to support.

Generator expressions are filled in during **[[the second step|two-phases]]**, generate. That is where their name comes from: they are expressions evaluated by the *generator*, the part of CMake that writes the build files. During configure they are only text. If you print one with `message()`, you see the raw `$<...>`, not an answer:

```text
-- At configure time the definition reads: $<CONFIG:Debug>
```

That line is real output from the project in the first example below. The words were stored on the target as a recipe, and filled in later.

::: warning Generator expressions do not work in if()
`if($<CONFIG:Debug>)` never does what you hope. `if()` runs during configure, when the expression is still plain text, so the test sees a string, not a yes or no. Anything that depends on the configuration or the compiler belongs *inside* a target command, such as `target_compile_definitions`, where CMake fills it in at generate time.
:::

## Why the configuration is not known while configuring

Lesson 1 set the build type with a variable: `cmake -S . -B build -DCMAKE_BUILD_TYPE=Release`. That kind of build folder holds exactly one configuration, so a CMake generator that works this way is called a **single-config generator**. Unix Makefiles and plain Ninja are single-config.

A **multi-config generator** writes build files for several configurations into one build folder, and you pick the configuration when you *build*, not when you configure. The **[[multi-config generators|multi-config-generators]]** are Visual Studio, Xcode and Ninja Multi-Config.

```bash
cmake -S . -B build -G "Ninja Multi-Config"     # configure once
cmake --build build --config Debug              # build Debug
cmake --build build --config Release            # build Release, same folder
```

Here the variable `CMAKE_BUILD_TYPE` is empty during configure, because no single build type exists. So an old-style test such as

```cmake
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
  add_compile_definitions(GNC_CHECK_LEVEL=2)
endif()
```

is false for *every* configuration, and your Debug build quietly loses its checks. A line `message(STATUS "CMAKE_BUILD_TYPE is '${CMAKE_BUILD_TYPE}'")` in a Ninja Multi-Config project prints:

```text
-- CMAKE_BUILD_TYPE is ''
```

A generator expression does not have that problem. It is evaluated once per configuration, at generate time, when the answer is known. It also works identically with a single-config generator, where there is only one configuration to evaluate. So it is the one spelling that is right for both.

::: key
Settings that differ between Debug and Release go into target commands as generator expressions such as `$<CONFIG:Debug>`, not into `if(CMAKE_BUILD_TYPE ...)`. The generator expression is evaluated at generate time for each configuration, so it works with single-config and multi-config generators alike.
:::

## Reading a generator expression

Every generator expression has the same shape: a dollar sign, angle brackets, a name, and sometimes a colon and arguments.

```text
$<NAME>                 a value, for example $<CONFIG> gives "Debug"
$<NAME:arg>             a question or a transformation, for example $<CONFIG:Debug> gives 1 or 0
$<condition:text>       gives text if condition is 1, and nothing if it is 0
```

Read `$<CONFIG:Debug>` aloud as "is the configuration Debug?" It is a yes-or-no question, and the answer is written as `1` for yes and `0` for no.

The third form is the one you will use most. Read `$<1:-Wall>` as "if yes, then `-Wall`". It gives `-Wall`. `$<0:-Wall>` gives an empty string, so the flag disappears. Now put a question where the `1` or `0` goes:

```cmake
$<$<CONFIG:Debug>:GNC_CHECK_LEVEL=2>
```

Read it **[[from the inside out|nesting]]**. First the inner question: is the configuration Debug? That becomes `1` or `0`. Then the outer expression: if `1`, the text `GNC_CHECK_LEVEL=2`; if `0`, nothing. So in Debug this adds a definition, and in every other configuration it adds nothing.

When you want one value for yes and a different one for no, use `$<IF:condition,then,else>`, available since CMake 3.8:

```cmake
$<IF:$<CONFIG:Debug>,GNC_CHECK_LEVEL=2,GNC_CHECK_LEVEL=0>
```

Read it "if Debug, then `GNC_CHECK_LEVEL=2`, else `GNC_CHECK_LEVEL=0`".

### The expressions you will actually use

| Expression | Means | Gives |
|---|---|---|
| `$<CONFIG>` | the current configuration | `Debug`, `Release`, … |
| `$<CONFIG:Debug>` | is it Debug? | `1` or `0` |
| `$<CONFIG:Debug,RelWithDebInfo>` | is it either of these? (CMake 3.19 and later) | `1` or `0` |
| `$<CXX_COMPILER_ID>` | which C++ compiler | `GNU`, `Clang`, `MSVC`, … |
| `$<CXX_COMPILER_ID:GNU,Clang>` | is it one of these? | `1` or `0` |
| `$<AND:a,b>`, `$<OR:a,b>`, `$<NOT:a>` | combine yes/no answers | `1` or `0` |
| `$<BOOL:text>` | turn a CMake truth value like `ON` or `""` into `1` or `0` | `1` or `0` |
| `$<IF:c,a,b>` | `a` if `c` is `1`, else `b` | `a` or `b` |
| `$<TARGET_FILE:tgt>` | full path of a built target's file | a path |
| `$<BUILD_INTERFACE:x>` | `x` while building this project, nothing once installed | `x` or nothing |
| `$<INSTALL_INTERFACE:x>` | `x` once installed, nothing while building here | `x` or nothing |

Configuration names match without caring about capital letters, so `$<CONFIG:debug>` also matches `Debug`. Compiler IDs are fixed words that CMake chooses, listed in the notes under **[[compiler IDs|compiler-ids]]**.

::: warning Quote a generator expression that holds a list
To give several flags under one condition, separate them with semicolons, CMake's list separator, and put the whole expression in double quotes:

```cmake
target_compile_options(gnc PRIVATE "$<$<CONFIG:Debug>:-Og;-g3>")
```

After CMake fills in the blank, the semicolons split the result into two flags, `-Og` and `-g3`. Writing a space instead of a semicolon mixes CMake's argument splitting into the expression, and whether the result is one flag or two becomes hard to predict. Semicolons inside quotes always mean "separate items".
:::

## Per-configuration settings

Before writing any expression, know what each configuration already does. For every configuration CMake keeps a variable of default compiler flags, named `CMAKE_CXX_FLAGS_<CONFIG>`. Read from the cache of the project below, for GCC 13:

| Configuration | `CMAKE_CXX_FLAGS_<CONFIG>` | In words |
|---|---|---|
| `Debug` | `-g` | debug symbols, no optimization |
| `Release` | `-O3 -DNDEBUG` | full optimization, asserts off |
| `RelWithDebInfo` | `-O2 -g -DNDEBUG` | optimized, with symbols, asserts off |
| `MinSizeRel` | `-Os -DNDEBUG` | optimized for small code, asserts off |

`-DNDEBUG` is the switch that turns **[[assert() into nothing|ndebug]]**, so the three optimized configurations drop every `assert`. `RelWithDebInfo` — "release with debug info" — is the **[[one flight teams often ship|relwithdebinfo]]**, because it runs at near-Release speed but a crash can still be traced to a line of source.

Your own per-configuration settings go on top of these, on the target, as generator expressions. Three patterns cover almost everything.

- **A definition that changes with the configuration**, as in the example below.
- **Extra flags in some configurations only**: `"$<$<CONFIG:Debug>:-Og;-g3>"`.
- **A library linked in one configuration only**: `target_link_libraries(gnc PRIVATE $<$<CONFIG:Debug>:gnc_debug_hooks>)`.

::: example One target, three configurations
A small `gnc` library clamps a throttle command to the range 0 to 1. In Debug it also reports every out-of-range command. The public header reads the check level from a macro:

```cpp
#pragma once

namespace gnc {

// How many runtime self-checks this build performs (set by the build system).
inline constexpr int check_level = GNC_CHECK_LEVEL;

double clamp_throttle(double command);

}  // namespace gnc
```

```cpp
#include <gnc/checks.hpp>
#include <cstdio>

namespace gnc {

double clamp_throttle(double command) {
    if constexpr (check_level >= 2) {
        if (command < 0.0 || command > 1.0) {
            std::printf("[check] throttle %.2f out of range, clamping\n", command);
        }
    }
    return command < 0.0 ? 0.0 : (command > 1.0 ? 1.0 : command);
}

}  // namespace gnc
```

The program asks for a throttle of 1.25, which is 25% more than the engine can give:

```cpp
#include <gnc/checks.hpp>
#include <cstdio>

int main() {
    std::printf("check level %d\n", gnc::check_level);
    std::printf("throttle = %.2f\n", gnc::clamp_throttle(1.25));
}
```

The whole `CMakeLists.txt`. The last lines write a small report file per configuration with `file(GENERATE)`, which is the standard way to **[[see what an expression turns into|file-generate]]**:

```cmake
cmake_minimum_required(VERSION 3.28)
project(genex_demo LANGUAGES CXX)

add_library(gnc STATIC src/checks.cpp)
target_include_directories(gnc PUBLIC include)
target_compile_features(gnc PUBLIC cxx_std_20)

# More self-checks in Debug, fewer in Release.
target_compile_definitions(gnc PUBLIC
  $<IF:$<CONFIG:Debug>,GNC_CHECK_LEVEL=2,GNC_CHECK_LEVEL=0>)

# Warning flags in the spelling each compiler understands.
target_compile_options(gnc PRIVATE
  $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall;-Wextra;-Wconversion>
  $<$<CXX_COMPILER_ID:MSVC>:/W4>)

add_executable(nav_app apps/main.cpp)
target_link_libraries(nav_app PRIVATE gnc)

message(STATUS "At configure time the definition reads: $<CONFIG:Debug>")
file(GENERATE OUTPUT "genex-$<CONFIG>.txt" CONTENT
"config          = $<CONFIG>
compiler        = $<CXX_COMPILER_ID> $<CXX_COMPILER_VERSION>
is Debug        = $<CONFIG:Debug>
gnc definitions = $<TARGET_PROPERTY:gnc,INTERFACE_COMPILE_DEFINITIONS>
gnc options     = $<TARGET_GENEX_EVAL:gnc,$<TARGET_PROPERTY:gnc,COMPILE_OPTIONS>>
" TARGET gnc)
```

Configure once with a multi-config generator, then build two configurations into the same folder:

```bash
cmake -S . -B build -G "Ninja Multi-Config"
cmake --build build --config Debug
cmake --build build --config Release
```

```text
[1/4] Building CXX object CMakeFiles/nav_app.dir/Debug/apps/main.cpp.o
[2/4] Building CXX object CMakeFiles/gnc.dir/Debug/src/checks.cpp.o
[3/4] Linking CXX static library Debug/libgnc.a
[4/4] Linking CXX executable Debug/nav_app
[1/4] Building CXX object CMakeFiles/gnc.dir/Release/src/checks.cpp.o
[2/4] Building CXX object CMakeFiles/nav_app.dir/Release/apps/main.cpp.o
[3/4] Linking CXX static library Release/libgnc.a
[4/4] Linking CXX executable Release/nav_app
```

Each configuration got its own subfolder, `build/Debug/` and `build/Release/`. Run both programs:

```text
$ ./build/Debug/nav_app
check level 2
[check] throttle 1.25 out of range, clamping
throttle = 1.00
$ ./build/Release/nav_app
check level 0
throttle = 1.00
```

And the two report files:

```text
== build/genex-Debug.txt
config          = Debug
compiler        = GNU 13.3.0
is Debug        = 1
gnc definitions = GNC_CHECK_LEVEL=2
gnc options     = -Wall;-Wextra;-Wconversion
== build/genex-Release.txt
config          = Release
compiler        = GNU 13.3.0
is Debug        = 0
gnc definitions = GNC_CHECK_LEVEL=0
gnc options     = -Wall;-Wextra;-Wconversion
```

Check it line by line.

1. `is Debug` is `1` in one file and `0` in the other: the same expression, answered once per configuration.
2. The `$<IF:...>` picked `GNC_CHECK_LEVEL=2` for Debug and `GNC_CHECK_LEVEL=0` for Release, and the programs agree: only Debug printed the `[check]` line.
3. The compiler is GNU, so `$<CXX_COMPILER_ID:GNU,Clang>` answered `1` and the GCC warning flags appear. The MSVC line answered `0` and added nothing, which is why `/W4` is missing.
4. Both programs clamp 1.25 to 1.00. The configurations change how much the library *checks*, not what it *computes*. That is the property you want.
:::

::: note Why the same folder can hold both builds
With Ninja Multi-Config, CMake wrote one set of build rules per configuration (`build-Debug.ninja`, `build-Release.ninja`, `build-RelWithDebInfo.ninja`) and one object folder per configuration. A generator expression is evaluated separately for each of those rule files. That is the "generate" step running three times over the same targets. Its default list of configurations, `CMAKE_CONFIGURATION_TYPES`, is `Debug;Release;RelWithDebInfo`, and a plain `cmake --build build` with no `--config` builds the first one, Debug.
:::

::: example The same file with a single-config generator
Nothing in the file mentions a generator, so the same project also works the old way, one configuration per folder:

```bash
cmake -S . -B build-rel -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build-rel
./build-rel/nav_app
```

```text
check level 0
throttle = 1.00
```

This time CMake wrote only `build-rel/genex-Release.txt`, with the same five lines as the Release file above. A single-config build has one configuration to evaluate, so the expression is filled in once. The `CMakeLists.txt` did not change by a single character between the two examples, which is the point: generator expressions make one target definition correct for every generator.
:::

## Writing for other compilers

Compiler flags are not a shared language. GCC and Clang take `-Wall -Wextra`. The Microsoft compiler, MSVC, takes `/W4`, and treats `-Wall` as "every warning there is", thousands of them. A library that must build on more than one compiler writes each flag under a compiler test, as the example did:

```cmake
target_compile_options(gnc PRIVATE
  $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall;-Wextra;-Wconversion>
  $<$<CXX_COMPILER_ID:MSVC>:/W4>)
```

Two rules keep this under control.

1. **Prefer a CMake feature over a raw flag whenever one exists.** `target_compile_features(gnc PUBLIC cxx_std_20)` from the last lesson already picks the right standard flag for every compiler. Only use a compiler test for things CMake has no word for, like warning sets.
2. **Combine questions instead of nesting deeper.** "GCC in Debug" is `$<AND:$<CXX_COMPILER_ID:GNU>,$<CONFIG:Debug>>`. Two levels of nesting is readable. Four is not; at that point, give the result a name with a small INTERFACE target that holds the options, which lesson 8 does for sanitizer builds.

## A first look at BUILD_INTERFACE and INSTALL_INTERFACE

So far every include folder was a path inside the source tree. That is right while *you* build. But in lesson 10 you will install the library, copying its headers to somewhere like `/opt/gnc/include`, so other projects can use it. The installed copy must not point back into your source folder, which will not exist on their machine.

Two generator expressions give one include folder two different answers:

```cmake
target_include_directories(gnc PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>)
```

- `$<BUILD_INTERFACE:...>` gives its path while building inside this project, and nothing in the installed package.
- `$<INSTALL_INTERFACE:...>` gives nothing while building here, and its path — relative to wherever the package was installed — in the installed package.

A configuration expression goes out with an exported target *unevaluated*. When this project was installed and exported, the file CMake generated for consumers still held

```text
INTERFACE_COMPILE_DEFINITIONS "\$<IF:\$<CONFIG:Debug>,GNC_CHECK_LEVEL=2,GNC_CHECK_LEVEL=0>"
INTERFACE_INCLUDE_DIRECTORIES "${_IMPORT_PREFIX}/include"
```

The definition is still a blank, so the consumer's own Debug build will get level 2 and its Release build level 0. The include folder has already been rewritten to the installed location. Lesson 10 builds the whole install and export on top of this.

## Check yourself

::: check
You configure with Ninja Multi-Config and then build with `--config Release`. Your `CMakeLists.txt` contains `if(CMAKE_BUILD_TYPE STREQUAL "Release") target_compile_options(gnc PRIVATE -march=native) endif()`. Is `-march=native` used? Explain, and rewrite the line so it works.
:::

::: answer
It is **not** used. With a multi-config generator, `CMAKE_BUILD_TYPE` is empty during configure, because the configuration is chosen later, at build time. The `if()` runs during configure, compares an empty string with `"Release"`, and skips its body for every configuration.

Move the decision into the target command as a generator expression, which is evaluated at generate time for each configuration:

```cmake
target_compile_options(gnc PRIVATE $<$<CONFIG:Release>:-march=native>)
```

This works with single-config generators too.
:::

::: check
Evaluate each expression for a Release build compiled with Clang: (a) `$<CONFIG:Debug>`, (b) `$<$<CONFIG:Release>:-O3>`, (c) `$<IF:$<CXX_COMPILER_ID:GNU>,gcc,other>`, (d) `$<AND:$<CONFIG:Release,RelWithDebInfo>,$<NOT:$<CXX_COMPILER_ID:MSVC>>>`.
:::

::: answer
Work from the inside out each time.

- (a) Is the configuration Debug? No: **`0`**.
- (b) The inner question, "is it Release?", gives `1`. `$<1:-O3>` gives **`-O3`**.
- (c) "Is the compiler GNU?" gives `0`, because Clang has its own ID, `Clang`. `$<IF:0,gcc,other>` gives **`other`**.
- (d) "Release or RelWithDebInfo?" gives `1`. "Is the compiler MSVC?" gives `0`, and `$<NOT:0>` gives `1`. `$<AND:1,1>` gives **`1`**.
:::

::: check
You add `message(STATUS "level = $<IF:$<CONFIG:Debug>,2,0>")` to your file to check your expression. It prints `level = $<IF:$<CONFIG:Debug>,2,0>`. What went wrong, and how do you check the value instead?
:::

::: answer
Nothing is wrong with the expression. `message()` runs during configure, and generator expressions are only filled in at generate time, so at that moment it is still plain text.

To see the value, have CMake write it out during generate, for example

```cmake
file(GENERATE OUTPUT "level-$<CONFIG>.txt" CONTENT "level = $<IF:$<CONFIG:Debug>,2,0>\n")
```

and read `build/level-Debug.txt`. Another way is to build and read the real compile command in `compile_commands.json`.
:::

::: check
`gnc` is a static library linked by `nav_app`. In Debug, the files of `gnc` must be compiled with `-fsanitize=address`, and whatever program links `gnc` must be linked with it too. Nothing should change in other configurations. Write the two target commands, on `gnc` only, and say which keyword each needs.
:::

::: answer
The same condition goes into two commands. `target_link_options` is the linking twin of `target_compile_options`.

```cmake
target_compile_options(gnc PRIVATE $<$<CONFIG:Debug>:-fsanitize=address>)
target_link_options(gnc PUBLIC $<$<CONFIG:Debug>:-fsanitize=address>)
```

The compile flag is for the files of `gnc`: **PRIVATE**. The link flag is different. A static library is never linked on its own; the *program* is linked, so the flag must reach the consumer's link line: **PUBLIC** (INTERFACE would also do). With PRIVATE there, the Debug link of `nav_app` fails with undefined references to the sanitizer's functions, which is what happens when you try it.

In Debug, `$<CONFIG:Debug>` gives `1` and both flags appear. In every other configuration it gives `0` and both lines add nothing. Lesson 8 shows the tidy way to switch sanitizers on for every target at once.
:::

::: check
Why can the include folder of a library that will be installed not be written as a plain `${CMAKE_CURRENT_SOURCE_DIR}/include`, and what do you write instead?
:::

::: answer
A PUBLIC include folder is a usage requirement, so it is copied into the installed package for consumers. A plain source path would point into *your* source tree, which does not exist on the consumer's machine, so their compiler would search a folder that is not there. CMake refuses to export a target like that.

Give the folder two answers:

```cmake
target_include_directories(gnc PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>)
```

The first applies while building this project. The second applies in the installed package, relative to the install location.
:::

## Summary

| Idea | Meaning | Example |
|---|---|---|
| Generator expression | a blank `$<...>` filled in at generate time, per target and configuration | `$<CONFIG>` |
| Configure, then generate | script runs first; build files are written second | `message()` shows raw `$<...>` |
| Single-config generator | one configuration per build folder | Ninja, Unix Makefiles + `CMAKE_BUILD_TYPE` |
| Multi-config generator | several configurations in one folder, chosen at build | `-G "Ninja Multi-Config"`, `--config Release` |
| Condition | `$<cond:text>` gives text if `cond` is `1` | `$<$<CONFIG:Debug>:-Og>` |
| If-else | `$<IF:c,a,b>` | `$<IF:$<CONFIG:Debug>,2,0>` |
| Compiler test | `$<CXX_COMPILER_ID:GNU,Clang>` | per-compiler warning flags |
| Lists | semicolons, whole expression in quotes | `"$<$<CONFIG:Debug>:-Og;-g3>"` |
| Default flags | `CMAKE_CXX_FLAGS_<CONFIG>` | Release: `-O3 -DNDEBUG` |
| Build versus install paths | `$<BUILD_INTERFACE:...>`, `$<INSTALL_INTERFACE:...>` | include folders of exported targets |

Every target so far used only code from this project. Lesson 5, *Dependencies: find_package and FetchContent*, brings in other people's libraries — Eigen, GoogleTest, fmt — and compares the ways a team can get them onto every machine.

::: context two-phases Configure, generate, build
Running `cmake -S . -B build` does the first two steps; `cmake --build build` does the third. Generator expressions live in the gap between them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="100" height="50" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="60" y="52" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">configure</text>
  <text x="60" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">run the script</text>
  <rect x="130" y="30" width="100" height="50" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="52" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">generate</text>
  <text x="180" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">fill in $&lt;...&gt;</text>
  <rect x="250" y="30" width="100" height="50" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="300" y="52" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">build</text>
  <text x="300" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">run the compiler</text>
  <line x1="110" y1="55" x2="122" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="130,55 121,50 121,60" fill="#1f2a44"/>
  <line x1="230" y1="55" x2="242" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="250,55 241,50 241,60" fill="#1f2a44"/>
  <line x1="10" y1="100" x2="230" y2="100" stroke="#1d6fd1" stroke-width="2"/>
  <text x="120" y="118" font-size="11" fill="#1d6fd1" text-anchor="middle">cmake -S . -B build</text>
  <line x1="250" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="2"/>
  <text x="300" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">cmake --build build</text>
  <text x="60" y="140" font-size="11" fill="#b4232c" text-anchor="middle">if() and message()</text>
  <text x="180" y="140" font-size="11" fill="#b4232c" text-anchor="middle">generator expressions</text>
</svg>
```

`if()` and `message()` belong to the first box, which is why they cannot see a generator expression's answer.
:::

::: context multi-config-generators Where multi-config generators come from
Visual Studio and Xcode are programs where a developer switches between Debug and Release with a drop-down menu, without rerunning anything. CMake has to write one project that already contains every configuration, so it cannot know which one will be chosen. Ninja Multi-Config, added in CMake 3.17, brings the same idea to the fast command-line Ninja tool. A library written with generator expressions works under all of them; one written with `if(CMAKE_BUILD_TYPE ...)` breaks the moment a Windows teammate opens it in Visual Studio.
:::

::: context nesting Reading nested brackets like parentheses
Nested generator expressions work like nested parentheses in arithmetic: the innermost pair is worked out first and replaced by its answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="22" y="31" font-size="14" fill="#1f2a44">$&lt;</text>
  <text x="48" y="31" font-size="14" fill="#1d6fd1">$&lt;CONFIG:Debug&gt;</text>
  <rect x="42" y="12" width="132" height="27" rx="4" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="31" font-size="14" fill="#1f2a44">:GNC_CHECK_LEVEL=2&gt;</text>
  <line x1="108" y1="41" x2="108" y2="62" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="108,70 103,61 113,61" fill="#1d6fd1"/>
  <text x="108" y="86" font-size="12" fill="#1d6fd1" text-anchor="middle">1 in Debug, 0 otherwise</text>
  <text x="180" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">$&lt;1:GNC_CHECK_LEVEL=2&gt; gives the text;</text>
  <text x="180" y="127" font-size="12" fill="#b4232c" text-anchor="middle">$&lt;0:GNC_CHECK_LEVEL=2&gt; gives nothing</text>
</svg>
```

When an expression gets hard to read, point at the innermost `$<` with a finger, say its answer aloud, and replace it in your head before moving outward.
:::

::: context compiler-ids The names CMake gives compilers
CMake detects the compiler during the first configure and stores a short identifier. The common ones are `GNU` for GCC, `Clang` for LLVM Clang, `AppleClang` for Apple's build of Clang, `MSVC` for Microsoft's compiler and `IntelLLVM` for Intel's current compiler. A cross compiler such as `arm-none-eabi-gcc` still reports `GNU`, because it is GCC built for another processor.

Watch `AppleClang`: it is a separate ID, so `$<CXX_COMPILER_ID:Clang>` is `0` on a Mac using Apple's compiler. For compilers that imitate another's command line, such as clang-cl, which takes MSVC-style flags, CMake also records the variable `CMAKE_CXX_COMPILER_FRONTEND_VARIANT`.
:::

::: context ndebug How NDEBUG switches off assert
`assert(x > 0)` from `<cassert>` is a macro. When the macro `NDEBUG` ("no debug") is defined, the standard library defines `assert(...)` to expand to nothing at all: the test is not compiled, costs no time, and can never fire.

That is why Debug and Release can behave differently: an assert that catches a bad input in Debug is silently gone in Release. It is also why an `assert` must never contain work the program needs, such as `assert(init_sensors())` — in Release the sensors are never started.
:::

::: context relwithdebinfo Why optimized code still carries symbols
Debug symbols are a map from machine instructions back to source lines and variable names. They make the file bigger but do not slow the program, because the processor never reads them. So `RelWithDebInfo` gives code that runs almost as fast as Release, yet a crash dump or a debugger can still say "line 212 of guidance.cpp".

Many teams test exactly the build they fly, so they choose one optimized configuration with symbols and use it everywhere, keeping a stripped copy of the file for the vehicle and the symbol-rich copy on the ground for analysis.
:::

::: context file-generate Printing a generator expression
`file(GENERATE OUTPUT name CONTENT text)` asks CMake to write a file at generate time, filling in every generator expression in both the name and the text. Putting `$<CONFIG>` in the file name gives one file per configuration.

Some expressions, such as `$<CXX_COMPILER_ID>`, only make sense for a particular target, because in principle each target could use a different compiler. For those, add `TARGET gnc` at the end, which tells CMake whose point of view to take. Without it, CMake 3.28 stops with an error saying the expression "may only be used with binary targets".
:::
