---
id: l03-usage-requirements-public-private-interface
title: 'Usage requirements: PUBLIC, PRIVATE and INTERFACE'
minutes: 24
covers:
  - target_link_libraries with PUBLIC, PRIVATE and INTERFACE, and what each propagates
  - target_include_directories, target_compile_features, target_compile_options, target_compile_definitions
---

Picture a bakery that sells packaged cookies. To bake them, the baker uses an oven, a mixer and a secret brand of vanilla. None of that goes on the label. You can eat a cookie without owning an oven. But one ingredient must go on the label: the peanuts. The peanuts are *inside* the cookie, so everyone who eats it has to know about them. And some labels carry a line the baker never needed at all, like "best with a glass of milk". That line is only for the eater.

So the baker sorts everything into three piles. Things only the kitchen needs. Things only the eater needs. Things both need.

A C++ library has exactly the same three piles, and CMake has a word for each: **PRIVATE**, **INTERFACE** and **PUBLIC**. Get one wrong and either somebody else's build breaks with a missing header, or every program that touches your library quietly pays for things it never uses. On a flight-software team, that "somebody else" is the guidance engineer three desks away.

The last lesson made targets. This lesson teaches how a target tells the world what it needs, and how those needs travel from one target to the next.

## What a target needs, and what its users need

A target needs things in order to *build*. The compiler needs to know where the headers are, which C++ standard to use, which warning flags to turn on, and which macros to define. The linker needs to know which other libraries to pull in.

A target's *users* need things too. The CMake word for a user is a **consumer**: any target that links to yours with `target_link_libraries`. Your consumers compile their own `.cpp` files, and those files `#include` your **[[public headers|header-travel]]**. So their compiler has to find your headers, and every header yours pulls in, with the same macros and a new enough C++ standard.

These needs have a name.

::: key
**What is a usage requirement?** Anything a consumer needs in order to use your target: include directories, compile definitions, language features, and linked libraries. Modern CMake attaches these to the target instead of setting global variables.
:::

A **[[usage requirement|build-versus-usage]]** is a promise stapled to the target. When another target links to yours, CMake reads the promise and adds the right flags to the consumer's compile and link lines. Nobody copies include paths by hand.

## The three keywords

Every `target_*` command that adds a requirement takes one of three keywords in front of each item. Here is what they mean, in the baker's language first and then CMake's.

- **PRIVATE** — the kitchen only. Use it to build *this* target. Do not tell consumers.
- **INTERFACE** — the label only. Do *not* use it to build this target, but hand it to every consumer.
- **PUBLIC** — both. Use it here, and hand it on.

Read `PUBLIC` as "for me and my users", `PRIVATE` as "for me alone" and `INTERFACE` as "for my users alone".

::: key
**PUBLIC, PRIVATE and INTERFACE in target_link_libraries.** PRIVATE: used to build this target only. INTERFACE: not used to build it, but propagated to consumers. PUBLIC: both. The rule follows the headers: if the dependency appears in your public headers it must be PUBLIC or INTERFACE.
:::

That last sentence is the whole decision procedure. You do not choose a keyword by feel. You open your public header and look.

1. Does your public header `#include` something from the dependency, or use one of its types in a function signature or a class member? Then consumers will need it: **PUBLIC**.
2. Is the dependency used only inside your `.cpp` files? Then consumers never see it: **PRIVATE**.
3. Is your target header-only, with no `.cpp` files at all? Then there is nothing to build, and everything is for consumers: **INTERFACE**. That is why an `INTERFACE` library from the last lesson can only take `INTERFACE` requirements.

A **public header** here means a header that consumers include — normally everything under your `include/` folder. A header that sits next to your `.cpp` files in `src/` and is never installed is a private header, and whatever *it* includes counts as private too.

## Watching a requirement travel

Let us build a tiny project with three targets and watch what happens.

- `mathlib` is a header-only vector library. It has one header, `mathlib/vec3.hpp`, holding a `Vec3` struct and a `norm()` function.
- `gnc` is a static library. Its public header `gnc/guidance.hpp` declares a function that takes and returns a `mathlib::Vec3`.
- `nav_app` is a program that uses `gnc`.

The header of `gnc` looks like this. Notice the first `#include`:

```cpp
#pragma once
#include <mathlib/vec3.hpp>

namespace gnc {

// Unit vector pointing opposite the velocity: the direction to burn to slow down.
mathlib::Vec3 retrograde(const mathlib::Vec3& velocity);

}  // namespace gnc
```

Because `mathlib::Vec3` appears right there in the declaration, anyone who includes `gnc/guidance.hpp` is also including `mathlib/vec3.hpp`. The rule says: PUBLIC. Let us see what happens if we get it wrong.

::: example The consumer that could not find the header
Here is the whole `CMakeLists.txt`, with the mistake on the line marked "the bug".

```cmake
cmake_minimum_required(VERSION 3.28)
project(propagation LANGUAGES CXX)

# A header-only library: nothing to compile, only requirements to hand on.
add_library(mathlib INTERFACE)
target_include_directories(mathlib INTERFACE mathlib/include)
target_compile_features(mathlib INTERFACE cxx_std_20)

# The gnc library. Its public header includes <mathlib/vec3.hpp>.
add_library(gnc STATIC gnc/src/guidance.cpp)
target_include_directories(gnc PUBLIC gnc/include)
target_compile_features(gnc PUBLIC cxx_std_20)
target_compile_options(gnc PRIVATE -Wall -Wextra -Wpedantic)
target_link_libraries(gnc PRIVATE mathlib)   # <-- the bug

add_executable(nav_app apps/main.cpp)
target_link_libraries(nav_app PRIVATE gnc)
```

Configure and build, the two steps from lesson 1:

```bash
cmake -S . -B build
cmake --build build
```

The output (long folder names shortened to `…`):

```text
[ 25%] Building CXX object CMakeFiles/gnc.dir/gnc/src/guidance.cpp.o
[ 50%] Linking CXX static library libgnc.a
[ 50%] Built target gnc
[ 75%] Building CXX object CMakeFiles/nav_app.dir/apps/main.cpp.o
In file included from …/apps/main.cpp:1:
…/gnc/include/gnc/guidance.hpp:2:10: fatal error: mathlib/vec3.hpp: No such file or directory
    2 | #include <mathlib/vec3.hpp>
      |          ^~~~~~~~~~~~~~~~~~
compilation terminated.
gmake[2]: *** [CMakeFiles/nav_app.dir/build.make:76: CMakeFiles/nav_app.dir/apps/main.cpp.o] Error 1
gmake[1]: *** [CMakeFiles/Makefile2:111: CMakeFiles/nav_app.dir/all] Error 2
gmake: *** [Makefile:91: all] Error 2
```

Read it slowly, line by line.

1. The library `gnc` **built fine**. PRIVATE means "use it to build me", so `guidance.cpp` was compiled with `-I…/mathlib/include` and found the header.
2. The program failed. PRIVATE also means "do not tell consumers", so `main.cpp` was compiled *without* that include path.
3. The error points at *your* header, line 2, even though the file being compiled was `main.cpp`. That is the fingerprint of this bug: a consumer's build dies inside a library's header.

Now change one word, `PRIVATE` to `PUBLIC`, on the marked line, and build again:

```text
[ 50%] Built target gnc
[ 75%] Building CXX object CMakeFiles/nav_app.dir/apps/main.cpp.o
[100%] Linking CXX executable nav_app
[100%] Built target nav_app
```

Running `./build/nav_app` with a velocity of $(3, 4, 12)\,\mathrm{m/s}$ prints

```text
burn direction: -0.230769 -0.307692 -0.923077
```

Sanity check: the length of $(3, 4, 12)$ is $\sqrt{9 + 16 + 144} = \sqrt{169} = 13$, so the unit vector pointing the other way is $(-3/13, -4/13, -12/13) \approx (-0.231, -0.308, -0.923)$. That matches.
:::

::: warning The library's own build will not catch this
The broken version passed every build step *of the library itself*. If your library's **continuous integration** job — the server that builds and tests every change automatically — builds only the library, the mistake ships. The first person to see it is a consumer. That is why a well-run library project always builds at least one small program or test that links the library *the way a stranger would* — through `target_link_libraries` and nothing else.
:::

### It travels more than one step

In the fixed project, `nav_app` never mentions `mathlib`. It links only `gnc`. Yet `main.cpp` got `-I…/mathlib/include`. The requirement **[[passed through two links|transitive-chain]]**: `mathlib` promised its include folder to its consumers, `gnc` passed that promise on because it linked PUBLIC, and so `nav_app` received it. Requirements that are passed along like this are called **transitive** — they carry across a chain.

A PRIVATE link is where the chain stops. A PUBLIC or INTERFACE link is where it continues.

::: note Why the rule has to follow the headers
Think about what the compiler actually does with `#include`. It pastes the whole text of the included file into the file being compiled, before compiling anything. So when `main.cpp` includes `gnc/guidance.hpp`, and that includes `mathlib/vec3.hpp`, the compiler working on `main.cpp` must open *both* files.

That compiler is running for `nav_app`, not for `gnc`. It only knows the flags that `nav_app` was given. So every folder, macro and language setting needed by *any header reachable from your public headers* must reach the consumer. The only way CMake can deliver it is through usage requirements marked PUBLIC or INTERFACE. Anything a consumer's compiler never opens can safely stay PRIVATE.
:::

## The four other target commands

`target_link_libraries` hands on whole targets. Four more commands attach one kind of requirement at a time. All of them take the same three keywords, with the same meaning.

### target_include_directories

This names folders the compiler searches for `#include <...>`. Each becomes a `-I` flag.

```cmake
target_include_directories(gnc
  PUBLIC  gnc/include          # consumers #include <gnc/...>
  PRIVATE gnc/src)             # only guidance.cpp looks here
```

Your `include/` folder is PUBLIC, because consumers include from it. A folder of private helper headers is PRIVATE. A relative path is read relative to the folder that holds this `CMakeLists.txt`.

### target_compile_features

This states which C++ features the target needs. The one you will write most is `cxx_std_20`, which means "at least C++20".

```cmake
target_compile_features(gnc PUBLIC cxx_std_20)
```

It is PUBLIC because the headers of `gnc` are written in C++20. A consumer compiling them with an older standard would fail inside them.

::: key
**target_compile_features(PUBLIC cxx_std_20): what does it do?** Requires C++20 for this target and propagates that requirement to consumers, so a consumer stuck on C++17 gets a clear error rather than a mysterious parse failure inside your headers.
:::

Why is this better than the older ways of asking for C++20? Compare the alternatives.

- A raw flag such as `-std=c++20` works only on compilers that spell it that way. The Microsoft compiler spells it `/std:c++20`. `cxx_std_20` names the *need*, and CMake picks the right flag for whatever compiler it found.
- The variable `CMAKE_CXX_STANDARD` sets a default for targets created after it, in this project only. It is not a usage requirement, so it does not travel to anyone who links your library from another project.
- `target_compile_features` is attached to one target, is compiler-neutral, travels to consumers, and later goes out with the target when you export it. If the consumer's compiler cannot do C++20 at all, CMake stops with a message naming the missing feature, before a single file is compiled.

When two requirements disagree, the stronger one wins. A consumer that asks for C++17 but links `gnc` is compiled as C++20, because C++20 satisfies both.

### target_compile_options

This adds raw compiler flags: warnings, optimization tweaks, sanitizers.

```cmake
target_compile_options(gnc PRIVATE -Wall -Wextra -Wpedantic)
```

Warning flags are almost always PRIVATE. They are your team's policy for your own code. Your consumers have their own policy, and your flags would apply to *their* `.cpp` files, not to yours.

### target_compile_definitions

This defines **[[preprocessor macros|macro-definitions]]**, the names that `#if` and `#ifdef` test. Each becomes a `-D` flag. The rule follows the headers here too.

```cmake
target_compile_definitions(gnc
  PUBLIC  GNC_MAX_THRUSTERS=12 # used in a public header
  PRIVATE GNC_LOG_LEVEL=2)     # used only inside guidance.cpp
```

`GNC_MAX_THRUSTERS` appears in `gnc/guidance.hpp`, so consumers must see the same value. `GNC_LOG_LEVEL` is tested only in `guidance.cpp`, so it stays in the kitchen.

::: example Reading the real compile lines
Put all of those commands together, with `mathlib` linked PUBLIC, and ask CMake to write a **[[compilation database|compile-commands]]** — a file that records the exact command for every source file:

```bash
cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build
./build/nav_app
```

```text
[gnc] |v| = 13.0 m/s
burn direction: -0.230769 -0.307692 -0.923077
thruster slots: 12
```

Now the two compile lines from `build/compile_commands.json` (folder names shortened to `.`):

```text
guidance.cpp: /usr/bin/c++ -DGNC_LOG_LEVEL=2 -DGNC_MAX_THRUSTERS=12 -I./gnc/include -I./gnc/src -I./mathlib/include -std=gnu++20 -Wall -Wextra -Wpedantic -o CMakeFiles/gnc.dir/gnc/src/guidance.cpp.o -c ./gnc/src/guidance.cpp
main.cpp:     /usr/bin/c++ -DGNC_MAX_THRUSTERS=12 -I./gnc/include -I./mathlib/include -std=gnu++20 -o CMakeFiles/nav_app.dir/apps/main.cpp.o -c ./apps/main.cpp
```

Line them up flag by flag.

| Flag | `guidance.cpp` (building gnc) | `main.cpp` (consumer) | Why |
|---|---|---|---|
| `-DGNC_LOG_LEVEL=2` | yes | no | PRIVATE definition |
| `-DGNC_MAX_THRUSTERS=12` | yes | yes | PUBLIC definition |
| `-I./gnc/include` | yes | yes | PUBLIC include folder |
| `-I./gnc/src` | yes | no | PRIVATE include folder |
| `-I./mathlib/include` | yes | yes | arrived through PUBLIC `mathlib` |
| `-std=gnu++20` | yes | yes | PUBLIC feature `cxx_std_20` |
| `-Wall -Wextra -Wpedantic` | yes | no | PRIVATE options |

Every row matches its keyword. The `nav_app` target asked for none of these flags by name. It said one thing, `target_link_libraries(nav_app PRIVATE gnc)`, and CMake worked out the rest. (The `gnu++20` rather than `c++20` is CMake's default of allowing **[[GNU extensions|gnu-extensions]]**.)
:::

::: note Where CMake keeps the piles
Each keyword writes into target **properties**, named values stored on the target. `PRIVATE` writes the ordinary property, such as `INCLUDE_DIRECTORIES`. `INTERFACE` writes the matching `INTERFACE_` property, such as `INTERFACE_INCLUDE_DIRECTORIES`. `PUBLIC` writes both. You can print them with `get_target_property`. For the fixed `gnc`, with the definitions left out:

```text
-- gnc INCLUDE_DIRECTORIES = …/gnc/include
-- gnc INTERFACE_INCLUDE_DIRECTORIES = …/gnc/include
-- gnc COMPILE_OPTIONS = -Wall;-Wextra;-Wpedantic
-- gnc INTERFACE_COMPILE_OPTIONS = value-NOTFOUND
-- gnc LINK_LIBRARIES = mathlib
-- gnc INTERFACE_LINK_LIBRARIES = mathlib
```

The warning flags sit only in the ordinary property, so they never reach a consumer. The `mathlib` include folder is not listed on `gnc` at all: it lives on `mathlib`, and it reaches `gnc` and `nav_app` through the link. When the link was PRIVATE, `INTERFACE_LINK_LIBRARIES` read `$<LINK_ONLY:mathlib>` instead, which is the **[[link-only|link-only]]** case described in the notes.
:::

## Why not set it for everybody?

Older CMake code, and a lot of code still on the internet, does the same jobs with directory-wide commands:

```cmake
include_directories(mathlib/include)          # every target from here down
add_definitions(-DGNC_LOG_LEVEL=2)            # every target from here down
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Werror")   # every C++ file
```

This works for a while. It feels simpler. It goes wrong in three ways.

1. **It leaks.** Every target in the folder and below gets every setting, needed or not. A test helper gets `GNC_LOG_LEVEL`. A third-party library you pulled in with `add_subdirectory` gets your `-Werror` and fails on its own warnings.
2. **It hides the dependency.** Nothing in the file says *which* target needed `mathlib/include`. Delete the target that needed it and nobody knows whether the line can go.
3. **It cannot travel.** A directory setting belongs to the directory, not to a target. When another project links your library, it gets none of it, and has to rediscover your include paths by hand.

::: key
**Why avoid include_directories() and global CMAKE_CXX_FLAGS?** They apply to everything in the directory and below, so requirements leak between unrelated targets and cannot be composed or exported. Target-scoped commands make dependencies explicit and correct for consumers.
:::

The **[[target-based style|modern-cmake-history]]** is the fix for all three. Every requirement is attached to the one target that has it, with a keyword that says who else needs it.

## The opposite mistake: PUBLIC when PRIVATE was right

The first example showed a requirement that was too private. The consumer broke loudly, which at least means somebody notices. The opposite mistake — marking something PUBLIC that only your `.cpp` files use — never fails on your machine. It costs you in quieter ways.

- **Slower builds for everyone downstream.** Extra `-I` folders make every consumer's compiler search more places. Extra headers reached through them mean more text to compile.
- **More rebuilds.** If a PUBLIC definition such as `GNC_LOG_LEVEL` changes, every consumer's files see a new flag and **[[recompile|rebuild-ripple]]**, even though none of them use the macro.
- **Collisions.** Your macro or include folder can clash with a consumer's own. Two different `config.h` files on the include path, and the compiler takes whichever folder comes first.
- **A heavier package.** Once you install and export your library (lesson 10), every PUBLIC dependency becomes something every consumer must also find and install.
- **Flags forced on other people.** This one can break builds outright.

::: example A warning policy that escaped
Suppose the `gnc` warning line is written with the wrong keyword:

```cmake
target_compile_options(gnc PUBLIC -Wall -Wextra -Werror)   # meant to be PRIVATE
```

`-Werror` turns every warning into an error. Another team adds a small tool that links `gnc`:

```cpp fragment
#include <gnc/guidance.hpp>
#include <cstdio>

int main(int argc, char** argv) {
    std::puts("telemetry dump v0.1");
    return 0;
}
```

```cmake
add_executable(telemetry_dump apps/telemetry_dump.cpp)
target_link_libraries(telemetry_dump PRIVATE gnc)
```

Their file is valid C++. But `gnc` handed its flags to every consumer:

```text
[ 83%] Building CXX object CMakeFiles/telemetry_dump.dir/apps/telemetry_dump.cpp.o
…/apps/telemetry_dump.cpp: In function 'int main(int, char**)':
…/apps/telemetry_dump.cpp:4:14: error: unused parameter 'argc' [-Werror=unused-parameter]
    4 | int main(int argc, char** argv) {
      |          ~~~~^~~~
…/apps/telemetry_dump.cpp:4:27: error: unused parameter 'argv' [-Werror=unused-parameter]
    4 | int main(int argc, char** argv) {
      |                    ~~~~~~~^~~~
cc1plus: all warnings being treated as errors
```

The tool's author never asked for `-Wextra` or `-Werror`. The error is about their code, but the cause is one word in somebody else's `CMakeLists.txt`. Changing `PUBLIC` back to `PRIVATE` fixes it: `gnc` keeps its strict policy for its own files, and `telemetry_dump` builds.
:::

::: warning "Make it PUBLIC to be safe" is not safe
When a build breaks with a missing header, it is tempting to mark *everything* PUBLIC so it can never happen again. That trades one loud bug for many quiet ones. Decide each dependency by the header rule: look at what your public headers include, and make exactly those PUBLIC. A header-only library — like Eigen, which is nothing but headers — follows the same rule; you link its target, and whether that link is PUBLIC or PRIVATE depends only on whether *your* headers show its types.
:::

## A checklist for any library target

1. Open every file in `include/`. Each library it includes, and each macro it tests, is PUBLIC. Everything else your `.cpp` files use is PRIVATE.
2. Warning flags are PRIVATE. No `include_directories`, `add_definitions` or edits to `CMAKE_CXX_FLAGS`.
3. Build a small consumer that links only the library target. If it compiles, your PUBLIC side is complete.

## Check yourself

::: check
A static library `imu` has a public header `imu/driver.hpp` that uses `std::span` (a C++20 feature) and a type `spi::Bus` from a library target `spi`. Its `.cpp` files also use a logging library target `log`, which appears in no header. Write the `target_link_libraries` and `target_compile_features` lines.
:::

::: answer
Apply the header rule to each dependency.

- `spi` appears in the public header, so consumers' compilers must find it: **PUBLIC**.
- `log` is used only in `.cpp` files: **PRIVATE**.
- The header needs C++20, so consumers must compile as C++20 too: **PUBLIC** feature.

```cmake
target_link_libraries(imu PUBLIC spi PRIVATE log)
target_compile_features(imu PUBLIC cxx_std_20)
```

One `target_link_libraries` call can hold several keywords; each applies to the names that follow it until the next keyword.
:::

::: check
Library `A` links `B` as PUBLIC. `B` links `C` as PRIVATE. `C` has an INTERFACE include folder `c/include`. Program `P` links `A`. Which of `A`, `B` and `P` are compiled with `-Ic/include`?
:::

::: answer
Follow the chain one link at a time.

- `B` links `C` PRIVATE. PRIVATE means "use it to build me", so **`B`** gets `-Ic/include`. But PRIVATE also means "do not hand it on", so the chain stops here.
- `A` links `B` PUBLIC, so `A` receives everything `B` hands on. `B` hands on nothing from `C`. So **`A` does not** get it.
- `P` gets whatever `A` hands on, which includes `B`'s PUBLIC and INTERFACE requirements but nothing from `C`. So **`P` does not** get it either.

Only `B` is compiled with `-Ic/include`. That is correct as long as `C` appears in none of `B`'s public headers.
:::

::: check
A consumer's build fails with `fatal error: fmt/core.h: No such file or directory`, and the error is reported from inside `nav/include/nav/logger.hpp`, not from the consumer's own file. What is the most likely mistake, and in which project is it?
:::

::: answer
The error is inside the `nav` library's public header, so that header includes `fmt/core.h`. The consumer's compiler was not told where `fmt` lives. So the `nav` library most likely links `fmt` as **PRIVATE**, which kept the include folder to itself.

The mistake is in the `nav` library's `CMakeLists.txt`, not in the consumer's. The fix is to link `fmt` as **PUBLIC** there, since its types are visible in a public header. (The alternative fix is to stop including `fmt` from the public header, for example by moving it into the `.cpp`, and then PRIVATE becomes right.)
:::

::: check
Your library defines `GNC_ENABLE_TRACE` and it is only tested inside `trace.cpp`. A reviewer sees `target_compile_definitions(gnc PUBLIC GNC_ENABLE_TRACE)`. Nothing is broken. Why should it still change?
:::

::: answer
Only `trace.cpp` reads the macro, so it belongs to the kitchen: it should be **PRIVATE**. As PUBLIC it is handed to every consumer, which costs three things even though nothing breaks today.

- Every consumer's files are compiled with an extra `-D` flag they never use; if the value is ever changed, all of them rebuild.
- The name can clash with a consumer's own macro of the same name.
- It hides the truth about the library: a reader of the `CMakeLists.txt` would think the public headers depend on it.
:::

## Summary

| Idea | Meaning | Example |
|---|---|---|
| Consumer | a target that links yours | `target_link_libraries(nav_app PRIVATE gnc)` |
| Usage requirement | what a consumer needs to use your target | include folders, definitions, features, libraries |
| PRIVATE | build this target only | warning flags, `.cpp`-only dependencies |
| INTERFACE | consumers only, not this target | everything on a header-only library |
| PUBLIC | this target and its consumers | `include/`, dependencies seen in public headers |
| The header rule | in your public headers means PUBLIC or INTERFACE | `Vec3` in `guidance.hpp` makes `mathlib` PUBLIC |
| Transitive | PUBLIC and INTERFACE links pass requirements along a chain | `nav_app` gets `mathlib`'s folder through `gnc` |
| `target_include_directories` | `-I` folders | `PUBLIC include PRIVATE src` |
| `target_compile_features` | minimum language standard | `PUBLIC cxx_std_20` |
| `target_compile_options` | raw flags | `PRIVATE -Wall -Wextra` |
| `target_compile_definitions` | `-D` macros | `PUBLIC` if a public header tests it |
| Too private | consumer fails in your header | missing header error |
| Too public | slower builds, rebuilds, clashes, forced flags | leaked `-Werror` |

Every example here chose flags the same way for every build. Lesson 4, *Generator expressions and configurations*, shows how one target can carry different flags for Debug and Release, or for GCC and another compiler, without writing the target twice.

::: context header-travel Why your headers travel and your .cpp files do not
A library ships in two parts. The compiled code — the `.a` or `.so` file — holds the machine instructions from your `.cpp` files. The headers are plain text that each consumer compiles again, inside their own files, every time.

So a `.cpp` file is compiled once, by you, and whatever it included is finished business. A header is compiled over and over, by everyone, with *their* compiler flags. That is why the question "which of my dependencies do consumers need?" always comes down to "which ones do my headers mention?"
:::

::: context build-versus-usage Two sets of requirements on every target
Every target carries two lists. The build requirements are what its own files need. The usage requirements are what it hands to consumers. The three keywords decide which list each item goes on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="200" height="130" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="120" y="40" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">target gnc</text>
  <rect x="32" y="52" width="85" height="86" rx="5" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="74" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">build</text>
  <text x="74" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">requirements</text>
  <text x="74" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">PRIVATE</text>
  <text x="74" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">+ PUBLIC</text>
  <rect x="124" y="52" width="85" height="86" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="166" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">usage</text>
  <text x="166" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">requirements</text>
  <text x="166" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">INTERFACE</text>
  <text x="166" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">+ PUBLIC</text>
  <line x1="209" y1="95" x2="262" y2="95" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="270,95 260,89 260,101" fill="#b4232c"/>
  <rect x="272" y="72" width="76" height="46" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="310" y="92" font-size="12" fill="#1f2a44" text-anchor="middle">consumer</text>
  <text x="310" y="108" font-size="11" fill="#6c7a93" text-anchor="middle">nav_app</text>
</svg>
```

Only the orange list crosses to the consumer. A PUBLIC item is written into both lists.
:::

::: context transitive-chain How far a requirement travels
Each link in the chain either passes requirements on or stops them. Here `mathlib`'s include folder reaches `nav_app` through the PUBLIC link, but a PRIVATE dependency of `gnc`, such as a logger, stops at `gnc`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="90" height="36" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="55" y="43" font-size="12" fill="#1f2a44" text-anchor="middle">mathlib</text>
  <rect x="135" y="20" width="90" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="43" font-size="12" fill="#1f2a44" text-anchor="middle">gnc</text>
  <rect x="260" y="20" width="90" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="305" y="43" font-size="12" fill="#1f2a44" text-anchor="middle">nav_app</text>
  <line x1="100" y1="38" x2="127" y2="38" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="135,38 126,33 126,43" fill="#1d6fd1"/>
  <text x="117" y="72" font-size="11" fill="#1d6fd1" text-anchor="middle">PUBLIC</text>
  <line x1="225" y1="38" x2="252" y2="38" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="260,38 251,33 251,43" fill="#1d6fd1"/>
  <rect x="135" y="100" width="90" height="36" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="123" font-size="12" fill="#1f2a44" text-anchor="middle">logger</text>
  <line x1="180" y1="100" x2="180" y2="64" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="180,56 175,65 185,65" fill="#b4232c"/>
  <text x="192" y="86" font-size="11" fill="#b4232c">PRIVATE</text>
  <line x1="236" y1="80" x2="276" y2="120" stroke="#b4232c" stroke-width="3"/>
  <line x1="276" y1="80" x2="236" y2="120" stroke="#b4232c" stroke-width="3"/>
  <text x="305" y="104" font-size="11" fill="#b4232c" text-anchor="middle">stops</text>
  <text x="305" y="118" font-size="11" fill="#b4232c" text-anchor="middle">here</text>
</svg>
```

Arrows point from a dependency to the target that links it. The folder of `mathlib` rides both blue arrows to `nav_app`. Nothing from `logger` goes past `gnc`.
:::

::: context macro-definitions What a -D flag does
A preprocessor macro is a name the compiler replaces with text before it compiles anything. `-DGNC_MAX_THRUSTERS=12` on the command line is the same as writing `#define GNC_MAX_THRUSTERS 12` at the top of every file compiled with that flag. Code then tests it with `#if GNC_MAX_THRUSTERS > 8` or uses it as a number.

Flight software uses definitions to pick hardware variants and to switch debug features in or out at build time. That is exactly why they must match: if a header's struct size depends on a macro and two files see different values, they disagree about the struct's layout, and the program misbehaves without any error.
:::

::: context compile-commands The file that records every command
`compile_commands.json` is a list with one entry per source file: the folder, the file and the exact compiler command. CMake writes it into the build folder when `CMAKE_EXPORT_COMPILE_COMMANDS` is on, for the Makefile and Ninja generators.

It is not only for debugging flags. Editor tools such as clangd, and checkers such as clang-tidy, read it so they analyze each file with the same include folders and macros the real build uses. Many teams turn it on in every build.
:::

::: context gnu-extensions Why gnu++20 and not c++20
GCC and Clang offer a few non-standard additions to C++, called GNU extensions. `-std=gnu++20` means "C++20 plus those extras"; `-std=c++20` means "strict C++20". CMake picks the `gnu` spelling by default because the variable `CMAKE_CXX_EXTENSIONS` starts out ON.

Many teams write `set(CMAKE_CXX_EXTENSIONS OFF)` near the top of the project, so that code which accidentally leans on an extension fails at home rather than on a stricter compiler later. For embedded flight code, which may move between compilers, that is a sensible default.
:::

::: context link-only Static libraries cannot hold their own dependencies
A static library (`.a`) is only a bundle of compiled object files. It has no way to say "and also link `libm` and `liblogger`". So when a static library links something PRIVATE, CMake still has to put that dependency on the final program's link line, or the program would have missing symbols.

CMake handles this for you by recording the dependency as `$<LINK_ONLY:...>`: the consumer gets it at link time, but none of its include folders or definitions. The compile side stays private; only the linker is told. A shared library (`.so`) does record its own dependencies, so there a PRIVATE link really stays inside.
:::

::: context modern-cmake-history Where "modern CMake" comes from
CMake itself dates from around 2000. For its first decade, projects configured compilers mostly with directory-wide commands and variables. The target-scoped commands — `target_include_directories`, `target_compile_definitions` and `target_compile_options` — arrived in the CMake 2.8.11 and 2.8.12 releases of 2013, together with the idea of usage requirements. `target_compile_features` followed in CMake 3.1.

"Modern CMake" is the name people gave to the style built on them: targets that carry their requirements, linked with a keyword. Old tutorials still teach the global style, which is why so much code online looks different from this lesson.
:::

::: context rebuild-ripple Why one flag can rebuild everything
A build tool rebuilds a file when its inputs change, and the compile command counts as an input. Change a `-D` flag on one target and every file compiled with that flag has a new command, so every one is recompiled.

A PRIVATE flag touches only the target's own files. A PUBLIC flag is copied onto every consumer and every consumer's consumer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="12" width="80" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="32" font-size="12" fill="#1f2a44" text-anchor="middle">gnc</text>
  <rect x="30" y="70" width="80" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="90" font-size="12" fill="#1f2a44" text-anchor="middle">nav_app</text>
  <rect x="140" y="70" width="80" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="90" font-size="12" fill="#1f2a44" text-anchor="middle">sim</text>
  <rect x="250" y="70" width="80" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="90" font-size="12" fill="#1f2a44" text-anchor="middle">tests</text>
  <rect x="140" y="124" width="80" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="144" font-size="12" fill="#1f2a44" text-anchor="middle">sim_tests</text>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="160" y1="42" x2="80" y2="70"/>
    <line x1="180" y1="42" x2="180" y2="70"/>
    <line x1="200" y1="42" x2="280" y2="70"/>
    <line x1="180" y1="100" x2="180" y2="124"/>
  </g>
  <text x="16" y="24" font-size="11" fill="#b4232c">PUBLIC -D flag</text>
  <text x="16" y="38" font-size="11" fill="#b4232c">changed here</text><text x="250" y="130" font-size="11" fill="#b4232c">all orange</text><text x="250" y="144" font-size="11" fill="#b4232c">boxes rebuild</text>
</svg>
```
 On a flight-software project with hundreds of files, flipping one leaked debug macro can turn a ten-second rebuild into a coffee break.
:::
