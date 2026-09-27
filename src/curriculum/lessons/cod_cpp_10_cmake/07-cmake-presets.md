---
id: l07-cmake-presets
title: CMake presets
minutes: 19
covers:
  - CMakePresets.json for reproducible configure and build commands
---

Think about the seat in a family car that has memory buttons. One press and the seat, the mirrors and the steering wheel slide to exactly where Mom likes them. Another press, and they go to where Dad likes them. Nobody has to remember "seat back three notches, mirror tilted a bit left". The settings are stored once, under a short name, and anyone can recall them.

At the end of lesson 06, building and testing the `gnc` project took three commands. They were short, but real projects grow long ones. A sanitizer build, a release build with a particular compiler, a build with coverage switched on: each one wants its own folder, its own build type and its own handful of `-D` options. Teams used to keep these in a wiki page or a README, and the wiki was always a little out of date. One person built with Ninja, another with Make; one remembered `-DCMAKE_BUILD_TYPE=Debug` and one forgot. When a test failed on the build server and not on a laptop, the first half hour went on finding out how the two builds differed.

A **preset** is a memory button for CMake: a named, stored set of settings for configuring, building or testing. Presets live in a file called **`CMakePresets.json`** at the top of the repository, next to the root `CMakeLists.txt`. It is committed to git with the code, so everyone who clones the project gets the same buttons. This lesson writes that file for `gnc` with three buttons — `debug`, `release` and `asan` — and shows how each piece works.

## The file, and the three kinds of preset

`CMakePresets.json` is written in **[[JSON|json]]** — a plain-text format for structured data made of named fields in curly braces and lists in square brackets. It is not the CMake language. It holds a few lists, and each list holds one kind of preset:

- **Configure presets** describe the configure step: which generator (Ninja or Make), which build folder, and which cache variables, such as `CMAKE_BUILD_TYPE`. You use one with `cmake --preset <name>`.
- **Build presets** describe the build step. The important field is `configurePreset`: which configured folder to build. You use one with `cmake --build --preset <name>`.
- **Test presets** describe a CTest run: which configured folder to test, output settings, environment variables. You use one with `ctest --preset <name>`.

A fourth kind, **workflow presets**, strings the other three together; it comes at the end of the lesson.

The file also carries a **`version`** number. It is the version of the preset file format, not of your project. Each CMake release that added a feature to presets bumped the format version, and a CMake too old to understand a file's version refuses to read it, with a clear message. Version 6 needs CMake 3.25 or newer, which matches the `cmake_minimum_required(VERSION 3.25)` in our root file.

::: key
`CMakePresets.json` gives one committed, versioned definition of the configure, build and test commands, so every developer, the IDE and CI run the same thing. It kills the folklore of long cmake command lines in a wiki.
:::

## Writing the presets for gnc

Since lesson 06 the project has grown a second library file, `src/gains.cpp`. It holds a table of pitch-loop gains, one for each altitude band from the launch pad upward, and `tests/test_gains.cpp` adds two tests for it. Nothing else about the layout changed.

Here is the whole presets file. Read it once top to bottom, and then we take it apart.

```json
{
  "version": 6,
  "cmakeMinimumRequired": { "major": 3, "minor": 25, "patch": 0 },
  "configurePresets": [
    {
      "name": "base",
      "hidden": true,
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/${presetName}",
      "cacheVariables": {
        "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
      }
    },
    {
      "name": "debug",
      "displayName": "Debug",
      "inherits": "base",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "Debug" }
    },
    {
      "name": "release",
      "displayName": "Release",
      "inherits": "base",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "Release" }
    },
    {
      "name": "asan",
      "displayName": "Debug + AddressSanitizer + UBSan",
      "inherits": "debug",
      "cacheVariables": { "GNC_SANITIZE": "ON" }
    }
  ],
  "buildPresets": [
    { "name": "debug",   "configurePreset": "debug" },
    { "name": "release", "configurePreset": "release" },
    { "name": "asan",    "configurePreset": "asan" }
  ],
  "testPresets": [
    {
      "name": "base",
      "hidden": true,
      "output": { "outputOnFailure": true },
      "execution": { "noTestsAction": "error" }
    },
    { "name": "debug",   "inherits": "base", "configurePreset": "debug" },
    { "name": "release", "inherits": "base", "configurePreset": "release" },
    {
      "name": "asan",
      "inherits": "base",
      "configurePreset": "asan",
      "environment": {
        "ASAN_OPTIONS": "detect_leaks=1:abort_on_error=1",
        "UBSAN_OPTIONS": "print_stacktrace=1"
      }
    }
  ]
}
```

### Hidden presets and inheritance

The first configure preset, `base`, has `"hidden": true`. A **hidden preset** is never used on its own and does not show up in lists. It exists to be copied from. The field **`inherits`** says "start with everything that preset has, then apply my own fields on top". It is the same idea as a recipe that says "make the basic dough from page 12, then add cinnamon".

Follow the [[chain|inherit-chain]] for `asan`. It inherits from `debug`, which inherits from `base`. So `asan` gets Ninja and the build-folder rule from `base`, `CMAKE_BUILD_TYPE=Debug` from `debug`, and adds its own `GNC_SANITIZE=ON`. Cache variables from each level are merged. Where two levels set the same variable, the preset nearer the bottom of the chain wins.

This is why presets stay short as they multiply. Change the generator once in `base`, and every build changes with it.

### The build folder

`binaryDir` says where the build goes. `${sourceDir}` and `${presetName}` are **[[macros|preset-macros]]** — placeholders that CMake fills in when it reads the file. `${sourceDir}` becomes the folder holding `CMakePresets.json`; `${presetName}` becomes the name of the preset being used. So the debug build lands in `build/debug`, release in `build/release`, and asan in `build/asan`. Three configurations sit side by side, out of source, exactly as lesson 01 recommended, and none of them can overwrite another's files. A clean build of any one is still a folder delete.

### Cache variables

`cacheVariables` are the `-D` options you used to type. `"CMAKE_BUILD_TYPE": "Debug"` in a preset means the same as `-DCMAKE_BUILD_TYPE=Debug` on the command line. Values are written as strings, even for on and off switches, so it is `"ON"`, in quotes.

`CMAKE_EXPORT_COMPILE_COMMANDS` asks CMake to write a [[compilation database|compile-commands]], a file called `compile_commands.json`, listing the exact compiler command for every source file. Editors and tools such as clang-tidy read it to understand your code. Putting it in `base` means every build has one.

### The asan switch

`GNC_SANITIZE` is not built into CMake. It is an **option** — an on/off cache variable — that the project defines for itself in a helper file, `cmake/GncBuildOptions.cmake`, which the root `CMakeLists.txt` loads with `include(GncBuildOptions)` after adding the `cmake/` folder to `CMAKE_MODULE_PATH`. The part that matters here is:

```cmake
option(GNC_SANITIZE "Build with AddressSanitizer and UBSan" OFF)

add_library(gnc_build_options INTERFACE)

if(GNC_SANITIZE)
  target_compile_options(gnc_build_options INTERFACE
    -fsanitize=address,undefined
    -fno-sanitize-recover=all
    -fno-omit-frame-pointer)
  target_link_options(gnc_build_options INTERFACE
    -fsanitize=address,undefined)
endif()
```

and the library, the demo and the tests each link `gnc_build_options`. Lesson 08 explains this pattern properly. For now notice the division of labor: the `CMakeLists.txt` files say *what can be switched on*, and the presets say *which switches each named build uses*.

### Build and test presets

Each build preset points at a configure preset by name. You could give a build preset more fields — `"jobs": 4` for parallel compiles, or `"targets"` to build only some targets — but pointing at the right folder is its main job.

Test presets have their own hidden `base`, and it carries two settings every run should have. `"outputOnFailure": true` is the preset form of `ctest --output-on-failure`, so no one ever again sees "test 6 failed" without the reason. `"noTestsAction": "error"` turns "No tests were found" into a failure instead of a quiet success; that catches a test run pointed at an empty or unbuilt folder. The `asan` test preset adds `environment`: variables set for every test program it runs. `ASAN_OPTIONS` and `UBSAN_OPTIONS` are how you pass settings to the sanitizer runtime, as in the memory module.

::: example Using the presets from a clean clone
First, list the buttons:

```text
$ cmake --list-presets
Available configure presets:

  "debug"   - Debug
  "release" - Release
  "asan"    - Debug + AddressSanitizer + UBSan
```

The hidden `base` is not listed, as intended. Now the three commands the module's first exercise asks for (the long folder paths are shortened to `/home/you/gnc`):

```text
$ cmake --preset debug && cmake --build --preset debug && ctest --preset debug
Preset CMake variables:

  CMAKE_BUILD_TYPE="Debug"
  CMAKE_EXPORT_COMPILE_COMMANDS="ON"

-- The CXX compiler identification is GNU 13.3.0
...
-- Build files have been written to: /home/you/gnc/build/debug
[1/8] Building CXX object src/CMakeFiles/gnc.dir/gains.cpp.o
[2/8] Building CXX object apps/gnc_demo/CMakeFiles/gnc_demo.dir/main.cpp.o
[3/8] Building CXX object src/CMakeFiles/gnc.dir/angles.cpp.o
[4/8] Linking CXX static library src/libgnc.a
[5/8] Linking CXX executable apps/gnc_demo/gnc_demo
[6/8] Building CXX object tests/CMakeFiles/gnc_tests.dir/test_angles.cpp.o
[7/8] Building CXX object tests/CMakeFiles/gnc_tests.dir/test_gains.cpp.o
[8/8] Linking CXX executable tests/gnc_tests
Test project /home/you/gnc/build/debug
    Start 1: Angles.DegToRadRightAngle
1/7 Test #1: Angles.DegToRadRightAngle ........   Passed    0.00 sec
...
7/7 Test #7: demo_runs ........................   Passed    0.00 sec

100% tests passed, 0 tests failed out of 7
```

Read the output against the file. CMake printed the variables it took from the preset, merged from `base` and `debug`. The `[1/8]` style lines are Ninja's, because `base` chose Ninja. The build went into `build/debug`, from the `binaryDir` rule. And the `&&` between the commands (read [["and then, if that worked"|and-chain]]) means each step runs only if the one before it succeeded, so a failed build never runs stale tests.

**Sanity check.** Seven tests: four for angles, two for gains, and the `demo_runs` smoke test — the five from lesson 06 plus the two new ones.
:::

::: example The sanitizer button
The same three commands with `asan` in place of `debug`:

```text
$ cmake --preset asan
Preset CMake variables:

  CMAKE_BUILD_TYPE="Debug"
  CMAKE_EXPORT_COMPILE_COMMANDS="ON"
  GNC_SANITIZE="ON"
...
$ cmake --build --preset asan
...
[8/8] Linking CXX executable tests/gnc_tests
$ ctest --preset asan
...
100% tests passed, 0 tests failed out of 7
```

Look at the variables block: three of them, from three levels of inheritance — the generator and export setting from `base`, the build type from `debug`, and `GNC_SANITIZE` from `asan` itself. The code is clean today, so every test passes under the sanitizers too. Lesson 08 plants a real out-of-bounds bug that the debug build misses and this button catches.

Afterwards `build/` holds two folders, `debug` and `asan`, side by side. Switching between them costs nothing: each keeps its own cache and its own compiled files.
:::

::: warning
JSON is strict. A comma after the last item in a list or object, which C++ forgives in many places, is an error here. So is a comment: JSON has no comment syntax at all. When you get it wrong, CMake says so before doing anything else, for example `JSON Parse Error: ... CMakePresets.json: Line 25, Column 7  Missing '}' or object member name`. Go to that line and look for a stray comma.
:::

## Your own buttons: CMakeUserPresets.json

Some settings belong to one person, not the team: a compiler only you have installed, a build folder on a fast disk, a debugging option you are trying out. Those go in a second file, **`CMakeUserPresets.json`**, in the same folder. It has the same format, CMake reads both files together, and a user preset may inherit from a project preset:

```json
{
  "version": 6,
  "configurePresets": [
    {
      "name": "my-debug-clang",
      "inherits": "debug",
      "cacheVariables": { "CMAKE_CXX_COMPILER": "clang++" }
    }
  ]
}
```

With that file present, `cmake --list-presets` shows `my-debug-clang` alongside `debug`, `release` and `asan`. The rule that keeps this tidy: **`CMakePresets.json` is committed, `CMakeUserPresets.json` never is.** Put it in `.gitignore`, along with `build/`.

::: warning
Keep machine-specific things out of `CMakePresets.json`: no `/home/alex/...` paths, no compiler that only one laptop has. The whole value of the file is that it works unchanged on every machine that clones the repository, including the build server. If a setting only makes sense on your machine, it belongs in `CMakeUserPresets.json`. Paths inside the project should be written with `${sourceDir}` so they follow the repository wherever it is cloned.
:::

## Why presets beat the wiki

It is worth being exact about what the file buys you, because "it saves typing" undersells it.

- **It is reviewed like code.** Change the release build to add a flag, and that change arrives as a line in a pull request that a teammate reads and approves. A wiki edit has no review and no history tied to the code.
- **It moves with the code.** Check out last year's version of the repository to [[reproduce a flight anomaly|old-build]], and you get last year's presets with it — the commands that built that version, not today's.
- **Everyone runs the same thing.** The developer at the terminal, the [[IDE|ide]] and the **[[CI|ci-presets]]** server all call `--preset debug`. Visual Studio, VS Code's CMake Tools and CLion read `CMakePresets.json` directly and show the presets in a menu. When CI fails and your laptop passes, the build commands are no longer a suspect.

What presets do **not** do is replace `CMakeLists.txt`. The CMake files still say what the targets are and what can be switched on. Presets only choose among those switches and name the result. Nor do they make a build faster: they run the same generator and compiler you would have run by hand.

::: key
Presets are versioned with the code, reviewed like code, and used identically by developers, IDEs and CI. Standard names for this module: `cmake --preset debug && cmake --build --preset debug && ctest --preset debug`.
:::

## One command: workflow presets

Since format version 6 there is a fourth list, **`workflowPresets`**, which chains a configure, a build and a test preset under one name. Add this to the file:

```json
"workflowPresets": [
  {
    "name": "debug",
    "steps": [
      { "type": "configure", "name": "debug" },
      { "type": "build", "name": "debug" },
      { "type": "test", "name": "debug" }
    ]
  }
]
```

Then `cmake --workflow --preset debug` runs all three steps in order and stops at the first failure, printing `Executing workflow step 1 of 3: configure preset "debug"` and so on as it goes. It is the `&&` chain, stored in the file. The three separate commands still work and are still what most people type while they work, because often you only want to rebuild and re-test without reconfiguring.

::: warning
Running `ctest --preset debug` before the debug build exists does not crash; it finds no tests. Without `noTestsAction`, CTest prints "No tests were found!!!" and still exits with code 0, a success, so a CI job with a typo in a folder name would go green while testing nothing. With `"noTestsAction": "error"` in the test preset, that run reports `Errors while running CTest` and fails, which is what you want.
:::

## Check yourself

::: check
A configure preset `ci-asan` inherits from `asan` and sets `"CMAKE_BUILD_TYPE": "RelWithDebInfo"`. Using this lesson's file, list every cache variable it ends up with and where each comes from. What is its build folder?
:::

::: answer
Walk the chain from the top: `base` gives `CMAKE_EXPORT_COMPILE_COMMANDS=ON` (and the Ninja generator). `debug` gives `CMAKE_BUILD_TYPE=Debug`. `asan` gives `GNC_SANITIZE=ON`. Then `ci-asan` sets `CMAKE_BUILD_TYPE=RelWithDebInfo`, which overrides `Debug` because the preset lower in the chain wins. So: `CMAKE_EXPORT_COMPILE_COMMANDS=ON`, `CMAKE_BUILD_TYPE=RelWithDebInfo`, `GNC_SANITIZE=ON`.

The build folder comes from `base`'s rule `${sourceDir}/build/${presetName}`, and `${presetName}` is filled in with the name of the preset actually used, so it is `build/ci-asan`.
:::

::: check
A teammate adds `"CMAKE_CXX_COMPILER": "/opt/gcc-14/bin/g++"` to the `debug` preset in `CMakePresets.json` because that is where GCC 14 lives on their laptop. What goes wrong, and where should the setting go?
:::

::: answer
On every machine where `/opt/gcc-14/bin/g++` does not exist — other laptops, the build server — `cmake --preset debug` now fails when it tries to find the compiler. The shared file has been tied to one machine. The setting belongs in the teammate's own `CMakeUserPresets.json`, for example as a preset `my-debug-gcc14` that inherits from `debug` and adds the compiler. That file is in `.gitignore`, so it never reaches anyone else.
:::

::: check
Why is it a good idea for `outputOnFailure` to sit in a hidden test preset that every other test preset inherits, rather than being added to each one?
:::

::: answer
Because every test run wants it: a failure without its output tells you which test broke but not why. Putting it once in the hidden `base` means every present and future test preset gets it automatically. If it were copied into each preset, the next person to add one (say, `coverage`) could forget it, and that build's failures would be silent. Settings that should be the same everywhere belong at the top of an inheritance chain, the same reason the generator lives in the configure `base`.
:::

::: check
Your laptop passes every test with the `release` preset; the CI server fails one. Before presets, what would you have checked first? With presets, what can you rule out, and what is left to look at?
:::

::: answer
Before presets, the first suspect is that the two machines ran different commands: a different build type, a missing `-D` option, a different generator, output hidden on one side. With both running `--preset release` from the same commit, those are ruled out, because the commands come from the same committed file. What is left are real differences in the environment: the compiler version installed, the operating system, the number of cores (which changes timing and ordering in threaded tests), or a genuine bug that depends on those. That is a much shorter list, and a more interesting one.
:::

::: check
Write a build preset called `asan-tests` that builds only the `gnc_tests` target in the asan configuration, using four parallel jobs.
:::

::: answer
```json
{
  "name": "asan-tests",
  "configurePreset": "asan",
  "targets": [ "gnc_tests" ],
  "jobs": 4
}
```

It goes in the `buildPresets` list. `configurePreset` picks the `build/asan` folder; `targets` limits the build to the test program (and whatever it depends on, so `gnc` gets built too); `jobs` is the preset form of `-j 4`. Run it with `cmake --build --preset asan-tests`.
:::

## Summary

| Idea | In one line |
| --- | --- |
| `CMakePresets.json` | committed file of named configure, build, test and workflow presets |
| `version` | preset file format; 6 needs CMake 3.25 or newer |
| Configure preset | generator, `binaryDir`, `cacheVariables`; `cmake --preset debug` |
| Build preset | `configurePreset` to build, plus optional `jobs`, `targets`; `cmake --build --preset debug` |
| Test preset | `configurePreset`, `output`, `execution`, `environment`; `ctest --preset debug` |
| `hidden` and `inherits` | shared base presets; the preset lower in the chain wins |
| `${sourceDir}`, `${presetName}` | macros; `build/${presetName}` gives one folder per preset |
| `outputOnFailure`, `noTestsAction` | always show failure output; finding no tests is an error |
| `CMakeUserPresets.json` | personal presets; never committed |
| Workflow preset | `cmake --workflow --preset debug` runs configure, build and test |
| Why | versioned with the code and used identically by developers, IDEs and CI |

The `asan` button works, but we have only glanced at what it switches on. The next lesson, *Sanitizer, coverage and ccache builds*, opens up `gnc_build_options`, adds a coverage configuration, and uses ccache to make all these side-by-side builds cheap.

::: context json Curly braces, square brackets and quotes
JSON stands for JavaScript Object Notation. It began as a way for web pages to send data, and is now used almost everywhere a program needs to read a settings file. It has only a few pieces: text in double quotes, numbers, `true`, `false`, `null`, lists in square brackets and objects — named fields — in curly braces.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="340" height="116" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="24" y="38" font-size="13" fill="#1f2a44">{</text>
  <text x="40" y="60" font-size="13" fill="#1d6fd1">"name"</text>
  <text x="92" y="60" font-size="13" fill="#1f2a44">: "debug",</text>
  <text x="40" y="84" font-size="13" fill="#1d6fd1">"inherits"</text>
  <text x="116" y="84" font-size="13" fill="#1f2a44">: "base"</text>
  <text x="24" y="108" font-size="13" fill="#1f2a44">}</text>
  <text x="230" y="60" font-size="11" fill="#6c7a93">field name : value</text>
  <text x="200" y="84" font-size="11" fill="#b4232c">no comma after the last</text>
  <line x1="182" y1="80" x2="196" y2="80" stroke="#b4232c" stroke-width="1.5"/>
</svg>
```

Commas go *between* items, never after the last one, and there are no comments. Those two rules cause most preset-file errors.
:::

::: context inherit-chain Following the chain down
Inheritance reads like a family tree. Each preset copies its parent's settings, then adds or overrides its own. When two levels set the same variable, the lower one — the more specific preset — wins.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="140" height="40" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="90" y="27" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">base (hidden)</text>
  <text x="90" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">Ninja, build/name</text>
  <rect x="20" y="78" width="140" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="95" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">debug</text>
  <text x="90" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">BUILD_TYPE=Debug</text>
  <rect x="200" y="78" width="140" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="95" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">release</text>
  <text x="270" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">BUILD_TYPE=Release</text>
  <rect x="20" y="146" width="140" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="163" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">asan</text>
  <text x="90" y="179" font-size="11" text-anchor="middle" fill="#1f2a44">GNC_SANITIZE=ON</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="90" y1="50" x2="90" y2="78"/>
    <line x1="140" y1="50" x2="250" y2="78"/>
    <line x1="90" y1="118" x2="90" y2="146"/>
  </g>
  <text x="200" y="170" font-size="11" fill="#6c7a93">asan = base + debug + its own</text>
</svg>
```
:::

::: context preset-macros Placeholders filled in at read time
A macro in a preset file is a name wrapped in `${…}` that CMake replaces with a value when it reads the file. `${sourceDir}` is the project's top folder, `${presetName}` the preset's own name. There is also `$env{NAME}`, which reads an environment variable, so a preset can say `"$env{HOME}/ccache"` without writing anyone's home folder into the file.

They look like CMake variables but are a separate, smaller system: only the names the preset format defines work here. Write `${CMAKE_SOURCE_DIR}` in a preset and CMake stops with "Invalid macro expansion" and refuses to read the file at all, because that is a CMake-language variable and the preset file is read before any CMake code runs.
:::

::: context compile-commands The list your editor reads
A compilation database is one JSON file listing, for every source file, the exact command that compiles it: which include folders, which defines, which C++ standard. Your editor needs that list to understand the code the way the compiler does. Without it, an editor guesses, and it underlines `#include <gnc/angles.hpp>` in red because it does not know where `include/` is.

Tools such as clangd (the engine behind many editors' C++ support) and clang-tidy look for `compile_commands.json` in the build folder. Because each preset has its own build folder, each has its own database, so the asan build's list includes the sanitizer flags and the release build's does not.
:::

::: context and-chain The shell's "only if"
You met `&&` in the scripting module. The shell runs the command on its left, looks at its exit code, and runs the command on its right only if that code was 0. So `configure && build && test` stops at the first step that fails.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="90" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">configure</text>
  <rect x="135" y="20" width="90" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">build</text>
  <rect x="260" y="20" width="90" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">test</text>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="100" y1="37" x2="129" y2="37"/>
    <line x1="225" y1="37" x2="254" y2="37"/>
  </g>
  <polygon points="135,37 127,33 127,41" fill="#1d6fd1"/>
  <polygon points="260,37 252,33 252,41" fill="#1d6fd1"/>
  <text x="117" y="16" font-size="11" text-anchor="middle" fill="#1d6fd1">0</text>
  <text x="242" y="16" font-size="11" text-anchor="middle" fill="#1d6fd1">0</text>
  <line x1="180" y1="54" x2="180" y2="84" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,90 176,82 184,82" fill="#b4232c"/>
  <text x="180" y="106" font-size="11" text-anchor="middle" fill="#b4232c">not 0: stop here, tests never run</text>
</svg>
```

That is why a failed compile never leads to CTest running old programs from the last successful build.
:::

::: context old-build Rebuilding the software that flew
Flight software is not replaced every day. A vehicle may fly a version built months earlier, and when telemetry shows something odd, engineers need to rebuild that exact version to reproduce it in a simulator. The source is in git, tagged with the release. If the build commands are in git too, the same checkout gives the same build. If they lived in a wiki that has been edited since, the rebuild may quietly use different flags, and a floating-point difference between two builds can be enough to make the anomaly vanish, or to create a new one.
:::

::: context ide Editors that read the file
An IDE, an integrated development environment, is an editor that also builds, runs and debugs your code: Visual Studio, CLion, or VS Code with its CMake Tools extension. Each of these reads `CMakePresets.json` and offers the presets in a drop-down menu. Pick `asan` there, press build, and the IDE runs the same configure and build as `cmake --preset asan` at the terminal, into the same `build/asan` folder. Before presets, each IDE kept its own build settings in its own format, and they had to be set up by hand to match the command line.
:::

::: context ci-presets The build server presses the same button
A continuous integration server is a machine that checks out every change and builds and tests it. Its job script used to be a copy of the long cmake command lines, kept in a separate file and edited separately, so it drifted away from what developers ran. With presets, a CI job for the sanitizer build is three lines that do nothing but press the button: `cmake --preset asan`, `cmake --build --preset asan` and `ctest --preset asan`.

Change what `asan` means in `CMakePresets.json`, and the laptops and the CI server change together, in one reviewed commit. This is the same idea as keeping the CI pipeline itself in the repository: configuration you can read, review and roll back.
:::
