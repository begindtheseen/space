---
id: l09-toolchain-files-and-cross-compiling
title: Toolchain files and cross-compiling
minutes: 25
covers:
  - Toolchain files for cross-compiling to an embedded target
---

Think about packing for a trip abroad. You pack at home, but you do not pack for home. You check the weather where you are going. You bring a plug adapter, because your hair dryer's plug will not fit their wall. And you leave behind anything that only works in your own house. A good traveler keeps a short note about the destination — "cold, different plugs, no hair dryer in the hotel" — and reads it before packing, not after.

Flight software is built the same way. You write and compile it on a laptop, but it runs on a small flight computer with a different processor and no operating system. The machine you build on is the **[[host|host-and-target]]**. The machine the program will run on is the **target**. Building on one machine for another is called **cross-compiling**, and the compiler that does it is a **cross-compiler**.

CMake's short note about the destination is the **toolchain file**: a small CMake script that describes the *target machine*, not your project. This lesson writes one for an Arm Cortex-M4 flight controller, line by line, and shows the two ways a missing line breaks the build. By the end, one unchanged `CMakeLists.txt` builds the same guidance library for your laptop and for the chip.

## Why CMake needs to be told

In every lesson so far, CMake found your compiler by itself. When the `project()` line ran, CMake looked for a program called `c++` (or `g++`), asked it a few questions and remembered the answers. That compiler makes programs for the machine it runs on: an x86-64 laptop running Linux.

A flight computer is different in three ways that matter to a compiler:

- **The processor.** A typical small flight controller uses a **microcontroller** — a whole computer on one chip, with processor, memory and input/output pins together. A common family is Arm **Cortex-M**. An x86-64 instruction means nothing to a Cortex-M4.
- **The operating system.** There usually is none. Code that runs with no operating system under it is called **bare metal**. Nobody opens files or prints to a screen for you.
- **The libraries.** The target has its own small C library, built for its own processor. Your laptop's libraries are useless to it.

So you need a different compiler. For Cortex-M the usual one is the GNU Arm toolchain, whose programs all start with **[[arm-none-eabi|target-triple]]**: `arm-none-eabi-gcc`, `arm-none-eabi-g++`, `arm-none-eabi-objcopy`, and so on. CMake will never pick these on its own. It has no way to know that you want to build for a chip that is not in the room.

## When the toolchain file is read

Here is the part that makes toolchain files special. CMake detects and tests the compiler *during* the `project()` command, near the top of your `CMakeLists.txt`. Anything your `CMakeLists.txt` says after `project()` is too late to change which compiler was chosen. And anything it says before `project()` would tie your project to one target forever.

So the target description lives in its own file, and you hand that file to CMake from the outside, on the command line, the first time you configure a build folder:

```bash
cmake -S . -B build-m4 -DCMAKE_TOOLCHAIN_FILE=cmake/arm-none-eabi.cmake
```

Read `-D` as "define": it sets the variable `CMAKE_TOOLCHAIN_FILE` to the path of the file. CMake runs the toolchain file first, before its compiler detection, and then carries on with your project as usual. It also runs it again inside each of its own small test builds, so everything CMake tests is tested with the target's compiler.

::: key
A toolchain file tells CMake about a different target platform before the first compiler test: the cross compiler, the sysroot, the target processor and search behaviour. It is how you build for arm-none-eabi from an x86 host. You pass it once, with `-DCMAKE_TOOLCHAIN_FILE=`, when a build folder is first configured.
:::

::: warning The choice is frozen into the build folder
The compiler is chosen on the *first* configure of a build folder and saved in that folder's cache, `CMakeCache.txt`. Passing a different toolchain file to a folder that already exists does not cleanly switch compilers. Use one build folder per target — `build-host` and `build-m4`, say — and when in doubt, delete the folder and configure again. Lesson 01 showed why a clean build is a folder delete; here it is the only safe way to change targets.
:::

## A toolchain file, line by line

Here is a complete toolchain file for a Cortex-M4 with a floating-point unit. It lives in the project's `cmake/` folder, the place lesson 06 set aside for CMake helper files.

```cmake
# Toolchain file for a Cortex-M4 with a single-precision FPU, no operating system.
# It describes the TARGET machine. It says nothing about the project.

set(CMAKE_SYSTEM_NAME Generic)        # no OS; setting this turns on cross-compiling
set(CMAKE_SYSTEM_PROCESSOR arm)

set(CMAKE_C_COMPILER   arm-none-eabi-gcc)
set(CMAKE_CXX_COMPILER arm-none-eabi-g++)
set(CMAKE_ASM_COMPILER arm-none-eabi-gcc)

# The compiler check builds a library, because a bare-metal program
# cannot be linked without startup code and a linker script.
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

set(CPU_FLAGS "-mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16")
set(CMAKE_C_FLAGS_INIT   "${CPU_FLAGS}")
set(CMAKE_CXX_FLAGS_INIT "${CPU_FLAGS} -fno-exceptions -fno-rtti")
set(CMAKE_EXE_LINKER_FLAGS_INIT "${CPU_FLAGS} --specs=nano.specs --specs=nosys.specs")

# Where the target's own headers and libraries live on this machine.
set(CMAKE_FIND_ROOT_PATH /usr/lib/arm-none-eabi)

# Programs (tools) come from the host; libraries, headers and packages
# come only from the target's directories.
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

It has five parts. Take them one at a time.

### 1. What kind of machine

`CMAKE_SYSTEM_NAME` names the target's operating system. `Linux` and `Windows` are possible values; `Generic` means "no operating system CMake knows about", which is what bare metal is. Setting this variable yourself is the switch that puts CMake into cross-compiling mode: from then on, the variable `CMAKE_CROSSCOMPILING` is true, and your project can test it.

`CMAKE_SYSTEM_PROCESSOR` names the target's processor family. CMake mostly passes it along for your own scripts to read. It does not choose any compiler flags by itself.

### 2. Which compilers

The three `COMPILER` lines name the cross-compilers. They are found on the `PATH` like any other program; you can also give a full path such as `/opt/gcc-arm/bin/arm-none-eabi-g++` if a team pins one exact toolchain version in one exact place. CMake also finds the matching helper tools from the same family by itself — the archiver `arm-none-eabi-ar`, and `arm-none-eabi-objcopy`, which it stores in the variable `CMAKE_OBJCOPY`.

### 3. How to test the compiler

Before building anything, CMake checks that the compiler works by building a tiny test program. This test is called a **[[try-compile|try-compile]]**. On a laptop it is harmless. On bare metal it fails, because a complete program for a microcontroller needs startup code and a map of the chip's memory, and the test has neither.

`CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` tells CMake to build its tests as a static library instead. A library is compiled but never linked, so the missing pieces are never needed.

::: example What the compiler check says without that line
Take the toolchain file above and delete two lines: the `CMAKE_TRY_COMPILE_TARGET_TYPE` line and the `CMAKE_EXE_LINKER_FLAGS_INIT` line. Configure a fresh folder with it. This is real output from CMake 3.28, with the long scratch paths replaced by `[...]`:

```text
-- The CXX compiler identification is GNU 13.2.1
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - failed
-- Check for working CXX compiler: /usr/bin/arm-none-eabi-g++
-- Check for working CXX compiler: /usr/bin/arm-none-eabi-g++ - broken
CMake Error at /usr/share/cmake-3.28/Modules/CMakeTestCXXCompiler.cmake:60 (message):
  The C++ compiler

    "/usr/bin/arm-none-eabi-g++"

  is not able to compile a simple test program.
  [...]
    Linking CXX executable cmTC_19db1
  [...]
    [...] in function `exit':
    [...] undefined reference to `_exit'
  [...]
    [...] undefined reference to `_write'
  [...]
    [...] undefined reference to `_sbrk'
  [...]
    collect2: error: ld returned 1 exit status
```

Read it from the bottom up, the way you read compiler errors in the C++ basics module:

1. `ld returned 1 exit status` — the **linker** failed, not the compiler. Compiling the test file worked.
2. `undefined reference to _exit`, `_write`, `_sbrk` — the target's C library, **[[newlib|newlib-and-nosys]]**, calls these functions to leave the program, write output and grow the heap. On a laptop the operating system supplies them. On bare metal nobody does.
3. `Linking CXX executable` — so CMake was trying to build a whole program.

Now put back only the `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` line. Configure succeeds, and the `gnc` library builds. But linking the real program, `fin_controller`, fails with the same six undefined references. That is the honest result: the line fixes CMake's *check*, not your firmware. The `--specs=nosys.specs` linker flag supplies do-nothing versions of those functions, which is enough for this lesson. A real flight program supplies its own startup code and a linker script instead, which the real-time C++ module covers.
:::

### 4. What exact processor

`-mcpu=cortex-m4` picks the processor, so the compiler uses its instructions and timings. `-mthumb` picks the compact instruction encoding that every Cortex-M runs. `-mfloat-abi=hard -mfpu=fpv4-sp-d16` says the chip has a **floating-point unit**, a piece of hardware that does arithmetic on fractional numbers, and that it handles **[[single precision only|single-precision-fpu]]** — `float`, not `double`. `-fno-exceptions -fno-rtti` switch off two C++ features that cost code space and that most flight code bans anyway.

The flags go into variables ending in `_INIT`. These are **[[starting values|flags-init]]**: CMake copies them into the cache the first time the folder is configured, and anything a developer adds later goes after them instead of replacing them.

::: warning Every piece must agree on the CPU flags
The `-mcpu`, `-mfloat-abi` and `-mfpu` flags must be the same for every file in the program, and for the linker too, so the linker picks the matching build of the C library. Mix `-mfloat-abi=hard` in one file with `-mfloat-abi=soft` in another and the link fails, or worse, floats are passed in the wrong registers. That is why the flags live in the toolchain file, once, and not scattered through the project.
:::

### 5. Where to look for things

Your project may ask CMake to find a header, a library or a whole package with `find_path`, `find_library` or `find_package` (lesson 05). When cross-compiling, there are two places those could come from: the host's folders, like `/usr/include`, and the target's folders. A header from the host is the wrong-shaped plug. It may compile, and then fail in a confusing way much later, or not fail at all and quietly describe the wrong machine.

Three variables control this:

- **`CMAKE_FIND_ROOT_PATH`** lists folders that hold the target's files. CMake puts each one in front of every search path. Read it as "pretend this folder is `/`". So a search of `/include` becomes a search of `/usr/lib/arm-none-eabi/include`. The Debian `arm-none-eabi` package keeps the target's C library there.
- **`CMAKE_SYSROOT`** is used when the target has a whole copy of its own file system on your disk — a **[[sysroot|sysroot]]**. CMake passes it to the compiler as `--sysroot=` and also searches inside it. A bare-metal GNU Arm compiler already knows where its own C library lives, so the file above leaves it out. For an Arm board running Linux, you would set it to the copy of the board's files.
- **`CMAKE_FIND_ROOT_PATH_MODE_*`** says, for each kind of search, which places are allowed. `NEVER` means host only, `ONLY` means target only, and `BOTH`, the default, means target first and then host.

The usual choice is in the file above. **Programs** are things you *run* during the build, such as a code generator or `objcopy`, so they must be host programs: `NEVER`. **Libraries, headers and packages** end up inside the firmware, so they must be the target's: `ONLY`.

::: example A host header sneaks into a target build
A small test project asks CMake to find zlib, a compression library that is installed on the laptop but has never been built for the Cortex-M4:

```cmake
cmake_minimum_required(VERSION 3.28)
project(findtest LANGUAGES CXX)

find_library(Z_LIB z)
find_path(Z_INC zlib.h)
message(STATUS "libz found at:   ${Z_LIB}")
message(STATUS "zlib.h found in: ${Z_INC}")
```

Configure it twice with `-DCMAKE_PREFIX_PATH=/usr`, a setting often left over in a developer's scripts. First with the full toolchain file:

```text
-- libz found at:   Z_LIB-NOTFOUND
-- zlib.h found in: Z_INC-NOTFOUND
```

Then with a copy of the toolchain file that has the four `CMAKE_FIND_ROOT_PATH_MODE_*` lines deleted, so every mode is the default, `BOTH`:

```text
-- libz found at:   Z_LIB-NOTFOUND
-- zlib.h found in: /usr/include
```

The second run found the laptop's `zlib.h`. The header describes a 64-bit x86 machine, and the Cortex-M4 is 32-bit Arm. Your code would compile against it, and the failure would show up later, somewhere else, if at all. The first run's "NOTFOUND" is the good outcome: a clear, early error that says zlib has not been built for the target yet.

Sanity check: the library was missed in both runs, because with `Generic` CMake does not search the laptop's folder for x86 libraries. The header was not so lucky. A half-found dependency like this is exactly what `ONLY` rules out.
:::

::: key
A toolchain file holds the target's description: `CMAKE_SYSTEM_NAME` (setting it turns on cross-compiling), the cross compiler paths, the CPU flags, `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` for bare metal, the sysroot or `CMAKE_FIND_ROOT_PATH`, and `CMAKE_FIND_ROOT_PATH_MODE_*`: `PROGRAM NEVER`, and `LIBRARY`, `INCLUDE`, `PACKAGE` set to `ONLY`. It is read before compiler detection, which is why none of this can be an ordinary project setting.
:::

## The project does not change

The whole point of a toolchain file is that the project's own `CMakeLists.txt` stays the same for every target. Here is a small project: the `gnc` library from lesson 06's layout, holding a clamped **PID controller** (a controller that steers using the error, its running total and its rate of change), plus a program that commands a rocket fin. The library header:

```cpp
#pragma once

namespace gnc {

// A proportional-integral-derivative controller with a clamped output.
class Pid {
public:
    Pid(float kp, float ki, float kd, float limit);
    float update(float error, float dt_s);

private:
    float kp_, ki_, kd_, limit_;
    float integral_ = 0.0f;
    float prev_error_ = 0.0f;
};

}  // namespace gnc
```

The library source, `src/pid.cpp`:

```cpp
#include "gnc/pid.hpp"

#include <algorithm>

namespace gnc {

Pid::Pid(float kp, float ki, float kd, float limit)
    : kp_(kp), ki_(ki), kd_(kd), limit_(limit) {}

float Pid::update(float error, float dt_s) {
    integral_ += error * dt_s;
    const float derivative = (error - prev_error_) / dt_s;
    prev_error_ = error;
    const float u = kp_ * error + ki_ * integral_ + kd_ * derivative;
    return std::clamp(u, -limit_, limit_);
}

}  // namespace gnc
```

The fin program, `apps/fin_controller.cpp`:

```cpp
#include "gnc/pid.hpp"

// Commands a fin from a pitch error. On the flight computer the error
// would come from the IMU; here it is a fixed test value.
volatile float fin_command_rad = 0.0f;

int main() {
    gnc::Pid pitch(2.0f, 0.5f, 0.1f, 0.35f);
    for (int i = 0; i < 100; ++i) {
        fin_command_rad = pitch.update(0.05f, 0.01f);
    }
    return 0;
}
```

A unit test, `tests/test_pid.cpp`:

```cpp
#include "gnc/pid.hpp"

#include <gtest/gtest.h>

TEST(Pid, ClampsToLimit) {
    gnc::Pid pid(100.0f, 0.0f, 0.0f, 0.35f);
    EXPECT_FLOAT_EQ(pid.update(1.0f, 0.01f), 0.35f);
}
```

And the `CMakeLists.txt`, kept in one file here so it fits on the page:

```cmake
cmake_minimum_required(VERSION 3.28)
project(gnc VERSION 1.2.0 LANGUAGES CXX)

add_library(gnc STATIC src/pid.cpp)
target_include_directories(gnc PUBLIC include)
target_compile_features(gnc PUBLIC cxx_std_20)
target_compile_options(gnc PRIVATE -Wall -Wextra)

add_executable(fin_controller apps/fin_controller.cpp)
target_link_libraries(fin_controller PRIVATE gnc)

if(CMAKE_CROSSCOMPILING)
  # A raw image of the program, ready to write into the chip's flash.
  add_custom_command(TARGET fin_controller POST_BUILD
    COMMAND ${CMAKE_OBJCOPY} -O binary $<TARGET_FILE:fin_controller> fin_controller.bin
    COMMENT "Making fin_controller.bin")
else()
  # Unit tests run on the build machine, so only build them there.
  enable_testing()
  find_package(GTest REQUIRED)
  add_executable(test_pid tests/test_pid.cpp)
  target_link_libraries(test_pid PRIVATE gnc GTest::gtest_main)
  add_test(NAME test_pid COMMAND test_pid)
endif()
```

Notice what is *not* in it: no compiler name, no `-mcpu`, no path to the Arm C library. The only target-aware line is the `if(CMAKE_CROSSCOMPILING)`. It does two sensible things. A test program built for the Cortex-M4 cannot run on the laptop, so tests are only built for the host. And a flight computer is loaded from a plain binary image, so the cross build makes one with `objcopy`.

The two builds are easiest to keep straight as two presets from lesson 07. A configure preset has a `toolchainFile` field made for this:

```json
{
  "version": 6,
  "configurePresets": [
    {
      "name": "host-debug",
      "binaryDir": "build-host",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "Debug" }
    },
    {
      "name": "m4-release",
      "binaryDir": "build-m4",
      "toolchainFile": "${sourceDir}/cmake/arm-none-eabi.cmake",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "MinSizeRel" }
    }
  ],
  "buildPresets": [
    { "name": "host-debug", "configurePreset": "host-debug" },
    { "name": "m4-release", "configurePreset": "m4-release" }
  ]
}
```

`MinSizeRel` is the build type that optimizes for size (`-Os`), because a microcontroller's memory is small. Each preset has its own build folder, which obeys the warning about frozen compilers without anyone having to remember it.

::: example One source, two machines
Configure and build both:

```bash
cmake --preset m4-release && cmake --build --preset m4-release
cmake --preset host-debug && cmake --build --preset host-debug
ctest --test-dir build-host
```

The cross build's configure output names the new compiler:

```text
-- The CXX compiler identification is GNU 13.2.1
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /usr/bin/arm-none-eabi-g++ - skipped
```

and its build ends with the post-build step:

```text
[100%] Linking CXX executable fin_controller
Making fin_controller.bin
[100%] Built target fin_controller
```

(The Arm linker also prints warnings that `_close`, `_read`, `_write` and `_lseek` "are not implemented and will always fail". Those are the do-nothing functions from `nosys.specs` owning up to what they are. A program with no files never calls them.)

The host tests pass:

```text
100% tests passed, 0 tests failed out of 1
```

Now ask the `file` tool what each program is:

```text
build-host/fin_controller: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, with debug_info, not stripped
build-m4/fin_controller:   ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), statically linked, with debug_info, not stripped
```

Same source, two machines: 64-bit x86 for Linux, and 32-bit Arm with everything linked in. The size tool from the Arm family reports how much memory the flight program needs:

```text
   text	   data	    bss	    dec	    hex	filename
   3496	    108	    508	   4112	   1010	build-m4/fin_controller
```

`text` is machine code and constants, stored in flash. `data` is variables with starting values, stored in flash and copied to RAM. `bss` is variables that start at zero, in RAM only. So flash holds $3496 + 108 = 3604$ bytes and RAM holds $108 + 508 = 616$ bytes. Sanity check: a Cortex-M4 part often has around 1 MB of flash and 128 KB of RAM, so this tiny program uses well under 1% of either. That is about right for a single controller and a loop.

Finally, look inside the compiled `update` function with `arm-none-eabi-objdump -d`. A few of its first lines:

```text
0000817c <_ZN3gnc3Pid6updateEff>:
    817c:	edd0 6a05 	vldr	s13, [r0, #20]
    8180:	edd0 7a04 	vldr	s15, [r0, #16]
    8184:	ed80 0a05 	vstr	s0, [r0, #20]
    8188:	ee70 6a66 	vsub.f32	s13, s0, s13
    818c:	eee0 7a20 	vfma.f32	s15, s0, s1
    8190:	ee86 6aa0 	vdiv.f32	s12, s13, s1
```

The `.f32` instructions and the `s` registers belong to the floating-point unit, so the CPU flags reached the compiler. And `vfma.f32` is a **[[fused multiply-add|fused-multiply-add]]**: the line `integral_ += error * dt_s` became one instruction that multiplies and adds with a single rounding.
:::

## What belongs in the toolchain file, and what does not

A good toolchain file is short, committed to the repository, and about the target only. A useful test: if a teammate building a different project for the same chip would want the line, it belongs. Source files, warning flags, definitions for your code, sanitizers, tests and coverage do not. Those are project settings, and lessons 03 and 08 attached them to targets.

::: warning A toolchain file is read more than once
CMake runs the toolchain file at the start of configure and again inside every try-compile. So it must not have side effects: no `message()` spam, no downloads, no appending to a variable that grows each time it runs. Set variables to fixed values and stop.
:::

::: warning Setting the compiler in CMakeLists.txt
Writing `set(CMAKE_CXX_COMPILER arm-none-eabi-g++)` inside `CMakeLists.txt` looks like a shortcut. After `project()`, it is too late: the compiler has been found and tested. Before `project()`, it welds the project to one chip, and the host build and its tests break. The toolchain file exists so the project never has to say which machine it is for.
:::

Where this goes next: the tests above run only on the host. Some teams also run the target binary on the host under a processor **[[emulator|emulator]]**, so the real Arm machine code is tested before any hardware is on the bench. The real-time C++ module picks up this exact toolchain file and adds the linker script and startup code a real flight program needs.

## Check yourself

::: check
A teammate says: "Why not put `set(CMAKE_SYSTEM_NAME Generic)` and the compiler names at the top of `CMakeLists.txt`, before `project()`? Then nobody has to type `-DCMAKE_TOOLCHAIN_FILE`." What goes wrong?
:::

::: answer
It would work for the chip, but only for the chip. The project would now always cross-compile, so the host build is gone — and with it the unit tests, which must run on the laptop. The whole design is that `CMakeLists.txt` describes *what* to build and says nothing about *which machine*; the machine comes in from outside, per build folder. Presets remove the typing problem anyway: `cmake --preset m4-release` carries the toolchain file for you.
:::

::: check
You configure `build/` for the host, then run `cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=cmake/arm-none-eabi.cmake` on the same folder. What should you expect, and what should you do instead?
:::

::: answer
The compiler was chosen and cached in `build/CMakeCache.txt` on the first configure. At best CMake notices the change, warns and throws the cache away; at worst you are left with a folder that mixes the two setups. Do not reuse the folder. Configure a separate one, such as `build-m4`, or delete `build/` first. One build folder per target keeps the two worlds apart.
:::

::: check
Configuring with a new toolchain file fails with "is not able to compile a simple test program", and the log ends in `undefined reference to '_sbrk'`. Which part failed — the compiler, the linker, or CMake itself — and which toolchain line is most likely missing?
:::

::: answer
The linker. The compiler turned the test file into an object file; linking a complete program then needed `_sbrk`, a function the C library uses to grow the heap, which an operating system normally provides. On bare metal nothing provides it. The missing line is `set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)`, which makes CMake's check build a library, which is never linked. (Your real firmware still has to supply startup code, or link with `--specs=nosys.specs` for a quick experiment.)
:::

::: check
For each search, choose `NEVER` or `ONLY`, and say why: (a) `find_program` for a Python script that generates a lookup table during the build; (b) `find_library` for a math library the firmware links; (c) `find_package` for a driver library.
:::

::: answer
(a) `NEVER`, meaning host only: the program runs on the laptop during the build, so it must be a laptop program. (b) `ONLY`, meaning target only: the library's machine code ends up inside the firmware, so it must be built for the Cortex-M4. (c) `ONLY` for the same reason — a package brings headers and libraries that end up in the target program. These are the four `CMAKE_FIND_ROOT_PATH_MODE_*` settings in the lesson's toolchain file.
:::

::: check
The cross-compiled flight program reports `text 3496`, `data 108`, `bss 508`. After a change, the report reads `text 5240`, `data 108`, `bss 4604`. How much flash and how much RAM does it now need, and which number would you look into first?
:::

::: answer
Flash holds `text` plus `data`: $5240 + 108 = 5348$ bytes. RAM holds `data` plus `bss`: $108 + 4604 = 4712$ bytes. RAM went from 616 bytes to 4712, up 4096 bytes — exactly 4 KB — while code grew only 1744 bytes. RAM is the scarcer memory on a microcontroller, so look at `bss` first: a new zero-initialized buffer of 4096 bytes, such as a telemetry array, is the likely cause.
:::

## Summary

| Idea | Meaning | Command or fact |
| --- | --- | --- |
| host, target | the machine you build on; the machine it runs on | laptop x86-64 Linux; Cortex-M4, bare metal |
| cross-compiler | a compiler that makes code for another machine | `arm-none-eabi-g++` |
| toolchain file | describes the target, read before compiler detection | `-DCMAKE_TOOLCHAIN_FILE=cmake/arm-none-eabi.cmake` |
| `CMAKE_SYSTEM_NAME` | target OS; setting it turns on cross-compiling | `Generic` for bare metal; `CMAKE_CROSSCOMPILING` is then true |
| try-compile type | how CMake tests the compiler | `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` |
| CPU flags | processor, instruction set, FPU | `-mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16` in `*_FLAGS_INIT` |
| find root path, sysroot | the target's folders, searched as if they were `/` | `CMAKE_FIND_ROOT_PATH`, `CMAKE_SYSROOT` |
| search modes | host or target for each kind of search | `PROGRAM NEVER`; `LIBRARY`, `INCLUDE`, `PACKAGE` `ONLY` |
| one folder per target | the compiler is cached on first configure | `build-host`, `build-m4`; presets with `toolchainFile` |
| project stays target-free | only `if(CMAKE_CROSSCOMPILING)` differs | tests on host only; `objcopy -O binary` on target |

The next lesson, *Install and export*, turns the `gnc` library into a package: installed files plus a generated configuration file, so another project can write `find_package(gnc)` and link one target that carries every usage requirement with it.

::: context host-and-target Build here, run there
In embedded work, "host" is the development machine and "target" is the device. The host is big and friendly: gigabytes of memory, a debugger, a keyboard. The target is small and exact. Most flight software is tested on the host first, because it builds faster and is easier to debug, and then the same source is cross-compiled for the target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="30" width="130" height="80" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="80" y="58" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">host</text>
  <text x="80" y="78" font-size="11" fill="#1f2a44" text-anchor="middle">x86-64 laptop, Linux</text>
  <text x="80" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">runs the compiler</text>
  <rect x="235" y="40" width="110" height="60" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="290" y="64" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">target</text>
  <text x="290" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">Cortex-M4, no OS</text>
  <line x1="150" y1="70" x2="225" y2="70" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="230,70 220,64 220,76" fill="#1d6fd1"/>
  <text x="188" y="60" font-size="11" fill="#1d6fd1" text-anchor="middle">.bin</text>
  <text x="180" y="135" font-size="11" fill="#6c7a93" text-anchor="middle">build here, copy the program across, run there</text>
</svg>
```
:::

::: context target-triple Reading a compiler's name
Names like `arm-none-eabi` are called target triples. They read: processor family (`arm`), operating system (`none`, meaning bare metal), and the **ABI** — the "application binary interface", the rules for how functions pass arguments and how data is laid out in memory. EABI is the embedded ABI that Arm published. A compiler for an Arm board running Linux has a different triple, such as `arm-linux-gnueabihf`, and makes programs that expect a Linux kernel underneath.
:::

::: context try-compile CMake's test builds
A try-compile is a tiny throwaway project that CMake builds in a scratch folder inside your build folder, to learn something about the compiler: does it work, which C++ standards does it support, how big is a pointer. CMake runs several of them during configure. That is why it re-reads your toolchain file for each one, and why a broken toolchain file shows up as a failed "simple test program" before your own code is ever touched.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="95" height="44" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="57" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">test file</text>
  <text x="57" y="75" font-size="11" fill="#1f2a44" text-anchor="middle">.cxx</text>
  <rect x="133" y="40" width="95" height="44" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">compile</text>
  <text x="180" y="75" font-size="11" fill="#1f2a44" text-anchor="middle">works</text>
  <rect x="256" y="10" width="95" height="44" rx="5" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="303" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">link program</text>
  <text x="303" y="45" font-size="11" fill="#b4232c" text-anchor="middle">fails</text>
  <rect x="256" y="72" width="95" height="44" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="303" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">static library</text>
  <text x="303" y="107" font-size="11" fill="#1f2a44" text-anchor="middle">no link: works</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="105" y1="62" x2="128" y2="62"/>
    <line x1="228" y1="55" x2="251" y2="35"/>
    <line x1="228" y1="70" x2="251" y2="92"/>
  </g>
</svg>
```
:::

::: context newlib-and-nosys The C library for small chips
**newlib** is a small C library widely used on microcontrollers; `nano.specs` selects an even smaller build of it. Functions like `printf` and `malloc` are written in terms of a handful of low-level calls — `_write`, `_sbrk`, `_exit` — that an operating system would normally supply. On bare metal you write those yourself (for example, `_write` sends bytes out of a serial port). `nosys.specs` links in stand-ins that do nothing and report failure, which is fine when the program never prints or opens files.
:::

::: context single-precision-fpu Float is fast, double is slow here
The Cortex-M4's floating-point unit handles 32-bit `float` in hardware. A 64-bit `double` still works, but the compiler turns each operation into a call to a software routine, many times slower. That is why the PID class in this lesson uses `float` throughout, and why flight code for these chips watches for literals like `0.5` (a `double`) where `0.5f` was meant. Bigger chips, such as the Cortex-M7 in many autopilots, can have a double-precision unit.
:::

::: context flags-init Starting values, not orders
`CMAKE_CXX_FLAGS_INIT` fills in `CMAKE_CXX_FLAGS` only on the very first configure of a build folder. If the toolchain file set `CMAKE_CXX_FLAGS` directly, it would overwrite whatever a developer passed with `-DCMAKE_CXX_FLAGS=...` every time it was read. Using `_INIT` means the target's required flags always come first, and people can still add their own after them.
:::

::: context sysroot A copy of the target's file system
A sysroot is a folder on your laptop that looks like the root folder `/` of the target machine: its own `usr/include`, its own `usr/lib`. To cross-compile for a Linux board, teams copy those folders from the board's system image. When CMake searches with a root path, a search of `/usr/include` becomes a search of the same path inside the sysroot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="22" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">host</text>
  <text x="270" y="22" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">sysroot</text>
  <rect x="15" y="35" width="150" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="90" y="55" font-size="11" fill="#6c7a93" text-anchor="middle">/usr/include</text>
  <rect x="15" y="80" width="150" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="90" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">/usr/lib</text>
  <rect x="195" y="35" width="150" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="55" font-size="11" fill="#1f2a44" text-anchor="middle">board-root/usr/include</text>
  <rect x="195" y="80" width="150" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">board-root/usr/lib</text>
  <line x1="45" y1="68" x2="135" y2="78" stroke="#b4232c" stroke-width="2"/>
  <line x1="135" y1="68" x2="45" y2="78" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="138" font-size="11" fill="#1f2a44" text-anchor="middle">mode ONLY: the same paths, searched inside the sysroot</text>
</svg>
```
:::

::: context fused-multiply-add One rounding instead of two
A fused multiply-add computes $a \times b + c$ and rounds once, at the end. Doing it in two steps rounds twice: once after the multiply and once after the add. So the fused answer can differ in its last bit. The compiler is allowed to fuse, or "contract", expressions like this, and whether it does depends on the chip and the flags. That is one reason the same numerical code can give slightly different results on the host and the target, or in Debug and Release — and why both must be tested.
:::

::: context emulator Running Arm code on a laptop
A processor emulator such as QEMU imitates an Arm processor in software, so an Arm program can run on an x86 laptop. CMake has a variable for this, `CMAKE_CROSSCOMPILING_EMULATOR`: when it is set, CMake puts the emulator in front of test commands, so `ctest` runs the target's test programs through it. It never replaces testing on the real board, but it catches problems in the target's machine code much earlier.
:::
