---
id: l02-targets-libraries-and-executables
title: Targets, libraries and executables
minutes: 22
covers:
  - add_library and add_executable; INTERFACE, STATIC and SHARED
---

Think about three ways a classmate can help with your science poster.

- She hands you a sheet of **stickers**. You peel off the ones you need and stick them on your poster. Your poster now carries its own copies, and it does not matter what happens to her sheet afterwards.
- She points you to a **book on the class shelf**. Your poster says "see page 12 of the book". Everyone in class shares that one book. But if someone takes it off the shelf, your poster stops making sense.
- She gives you a **how-to card**: "use blue for water, label every arrow". There is nothing to hand over. It is only rules, and you follow them while you make your own poster.

C++ libraries come in exactly these three kinds. A **static library** is the sticker sheet: its machine code is copied into your program when you link. A **shared library** is the book on the shelf: your program points to it and finds it every time it starts. A **header-only library** is the how-to card: there is no compiled code at all, only headers and rules for how to use them.

In the last lesson a whole project was one program. Real flight software is never like that. The guidance math lives in a library. The flight program links it. The unit tests link the same library. A ground-station tool may link it too. This lesson shows how CMake describes those pieces, and how to choose which of the three kinds each one should be.

## Targets: the nouns of CMake

Every modern `CMakeLists.txt` is built around **targets**. A target is a named thing CMake knows how to build, or knows how to use, together with its **properties** — the settings attached to it, such as its source files, its include folders and the C++ version it needs.

Two commands create targets you build yourself:

- `add_executable(name sources...)` makes a program you can run.
- `add_library(name KIND sources...)` makes a library, where KIND is one of `STATIC`, `SHARED` or `INTERFACE` (plus a few rarer ones).

Everything else in this module hangs off targets. The commands that start with `target_` attach a property to one named target. Linking says "this target uses that one". Installing (lesson 10) ships targets to other projects. When you read a `CMakeLists.txt`, find the `add_executable` and `add_library` lines first: they are the nouns, and everything else is describing them.

A target name is a CMake name, not a file name. The library target `gnc` becomes the file `libgnc.a` on Linux and `gnc.lib` with Microsoft's compiler, and CMake picks the right one. Names must be unique across the whole project. You can build one target on its own with `--target`:

```bash
cmake --build build --target gnc
```

```text
[ 50%] Building CXX object CMakeFiles/gnc.dir/src/orbit.cpp.o
[100%] Linking CXX static library libgnc.a
[100%] Built target gnc
```

::: key
A target is a named thing CMake builds or uses, plus its properties. `add_executable` makes a program; `add_library` makes a library of kind `STATIC` (an archive copied into programs at link time), `SHARED` (a `.so` loaded when the program starts) or `INTERFACE` (nothing compiled, only usage requirements passed on).
:::

## The project we will build

Here is a small GNC project with all three pieces in it:

```text
gnc_demo/
  CMakeLists.txt
  include/gnc/units.hpp      header-only unit conversions
  include/gnc/orbit.hpp      declarations for the orbit functions
  src/orbit.cpp              their definitions, compiled
  apps/orbit_report.cpp      a program that uses both
```

`include/gnc/units.hpp` is complete in itself. Every function is `constexpr` and written right in the header:

```cpp
#pragma once
// Header-only: every function is constexpr and lives right here.
namespace gnc {
inline constexpr double pi = 3.141592653589793;
constexpr double deg_to_rad(double deg) { return deg * pi / 180.0; }
constexpr double km_to_m(double km) { return km * 1000.0; }
}  // namespace gnc
```

`include/gnc/orbit.hpp` only *declares* two functions, and `src/orbit.cpp` *defines* them, so they must be compiled somewhere:

```cpp
#pragma once
namespace gnc {
inline constexpr double mu_earth = 3.986e14;  // m^3/s^2
inline constexpr double r_earth = 6378e3;     // m

double circular_speed(double r_m);   // m/s
double orbit_period(double r_m);     // s
}  // namespace gnc
```

```cpp
#include "gnc/orbit.hpp"

#include <cmath>

namespace gnc {
double circular_speed(double r_m) { return std::sqrt(mu_earth / r_m); }

double orbit_period(double r_m) {
    return 2.0 * 3.141592653589793 * std::sqrt(r_m * r_m * r_m / mu_earth);
}
}  // namespace gnc
```

And `apps/orbit_report.cpp` uses both:

```cpp
#include <cstdio>

#include "gnc/orbit.hpp"
#include "gnc/units.hpp"

int main() {
    const double r = gnc::r_earth + gnc::km_to_m(400.0);
    std::printf("speed:  %.0f m/s\n", gnc::circular_speed(r));
    std::printf("period: %.1f min\n", gnc::orbit_period(r) / 60.0);
    std::printf("51.6 deg = %.4f rad\n", gnc::deg_to_rad(51.6));
    return 0;
}
```

Now the `CMakeLists.txt`. It makes three targets:

```cmake
cmake_minimum_required(VERSION 3.28)
project(gnc_demo VERSION 0.1.0 LANGUAGES CXX)

# 1. A header-only library: nothing to compile, only instructions to pass on.
add_library(gnc_units INTERFACE)
target_include_directories(gnc_units INTERFACE include)
target_compile_features(gnc_units INTERFACE cxx_std_20)

# 2. A compiled library, turned into an archive of object files.
add_library(gnc STATIC src/orbit.cpp)
target_include_directories(gnc PUBLIC include)
target_compile_features(gnc PUBLIC cxx_std_20)

# 3. A program that uses both.
add_executable(orbit_report apps/orbit_report.cpp)
target_link_libraries(orbit_report PRIVATE gnc gnc_units)
```

Three new commands appear, and you need only a first sketch of them today.

- `target_include_directories(tgt ... include)` adds the `include` folder to the header search path, the `-I` flag you typed by hand in the basics module. A relative path like `include` means "relative to this `CMakeLists.txt`".
- `target_compile_features(tgt ... cxx_std_20)` says "this code needs C++20".
- `target_link_libraries(a ... b)` says "target `a` uses target `b`". It is much more than a linker flag: `a` also receives the include folders and features that `b` passes on.

Each has a **[[scope keyword|scope-keywords]]** in the middle. For now, read them like this: `PRIVATE` means "for me only", `INTERFACE` means "for whoever uses me, but not me", and `PUBLIC` means "for me and for whoever uses me". The settings a library passes on to its users are called its **usage requirements**. Lesson 03 is entirely about these three words, because getting them wrong is the most common CMake bug.

## `add_executable`: a program

An executable target takes a name and a list of source files:

```cmake
add_executable(orbit_report apps/orbit_report.cpp)
```

It compiles each source into an object file and links them, plus whatever libraries you list in `target_link_libraries`, into one program. Only `.cpp` files need to be listed; the compiler finds headers through the include path.

::: warning List your source files by name
CMake has a `file(GLOB ...)` command that collects "every `.cpp` in this folder", and it is tempting. The trouble is that the list is made at configure time. Add a new `.cpp` file, run `cmake --build build`, and CMake does not know it exists, because no `CMakeLists.txt` changed, so configure never re-ran. The new code is silently left out. The CMake documentation itself recommends listing sources by name. One line per file is a small price for a build that sees every file.
:::

## `STATIC`: the sticker sheet

A **static library** is an **[[archive|archive]]**: a single file that bundles object files together. On Linux it is named `lib<name>.a`. When you link a program against it, the linker copies the machine code the program needs out of the archive and into the program. After that, the archive is not needed any more.

::: example Building and looking inside a static library
Configure and build `gnc_demo` with `--verbose`. Among the output, these are the lines that matter (long folder paths shortened to `...`):

```text
[ 25%] Building CXX object CMakeFiles/gnc.dir/src/orbit.cpp.o
/usr/bin/c++  -I.../gnc_demo/include -std=gnu++20 -MD ... -c .../gnc_demo/src/orbit.cpp
[ 50%] Linking CXX static library libgnc.a
/usr/bin/ar qc libgnc.a CMakeFiles/gnc.dir/src/orbit.cpp.o
/usr/bin/ranlib libgnc.a
[ 75%] Building CXX object CMakeFiles/orbit_report.dir/apps/orbit_report.cpp.o
/usr/bin/c++  -I.../gnc_demo/include -std=gnu++20 -MD ... -c .../gnc_demo/apps/orbit_report.cpp
[100%] Linking CXX executable orbit_report
/usr/bin/c++ CMakeFiles/orbit_report.dir/apps/orbit_report.cpp.o -o orbit_report  libgnc.a
```

Walk through it.

1. `orbit.cpp` is compiled with `-I.../include`, because `gnc` set that include folder, and with `-std=gnu++20`, the [[GNU flavor of C++20|gnu-extensions]], because it asked for C++20.
2. The library is not "linked" in the usual sense. `ar qc` (read "archive, quick-append, create") packs the object file into `libgnc.a`, and `ranlib` adds an index so the linker can find symbols quickly.
3. `orbit_report.cpp` gets the same `-I` and `-std` flags, although its own target never asked for them. They came through `target_link_libraries` from `gnc` and `gnc_units`. That is a usage requirement at work.
4. The final link names `libgnc.a` directly.

Now look inside. `ar t` lists the members of an archive, and `nm -C` lists the names (symbols) in an object file, with C++ names made readable:

```bash
ar t build/libgnc.a
nm -C build/libgnc.a
```

```text
orbit.cpp.o

orbit.cpp.o:
000000000000002f T gnc::orbit_period(double)
0000000000000000 T gnc::circular_speed(double)
                 U sqrt
```

`T` means "defined here, in the code section". `U` means "used here, defined somewhere else" — `sqrt` comes from the math library. Now the finished program:

```bash
nm -C build/orbit_report | grep gnc
./build/orbit_report
```

```text
000000000000122c W gnc::deg_to_rad(double)
0000000000001287 T gnc::orbit_period(double)
0000000000001258 T gnc::circular_speed(double)
speed:  7669 m/s
period: 92.6 min
51.6 deg = 0.9006 rad
```

Both orbit functions are `T` inside the program: they were copied in. The program carries its own stickers. And `deg_to_rad`, from the header-only library, is there too, marked `W`, a [[weak symbol|weak-symbols]]. It was compiled into the program straight from the header.

Sanity check with python3: at $r = 6778\,\mathrm{km}$, $v = \sqrt{\mu/r} \approx 7669\,\mathrm{m/s}$, the period $2\pi\sqrt{r^3/\mu} \approx 5553\,\mathrm{s} \approx 92.6$ minutes (the Space Station takes about 92 minutes per lap), and $51.6° \times \pi/180 \approx 0.9006$ rad. All three match.
:::

The file sizes tell the same story. `libgnc.a` is 1,982 bytes; `orbit_report` is 16,192 bytes. Running `ldd` (which lists the shared libraries a program needs when it starts) on `orbit_report` shows only system libraries: `libm`, `libc` and the loader. Nothing called `libgnc`. Delete `libgnc.a` and the program still runs.

That is why static linking is the usual choice for flight software. The program that was tested is completely described by one file. Nothing has to be found at start-up, and on a small **[[bare-metal|bare-metal]]** processor with no operating system there is nothing that *could* find a library at start-up anyway.

## `SHARED`: the book on the shelf

A **shared library** is a separate file, `lib<name>.so` on Linux (`.so` for "shared object"; `.dll` on Windows, `.dylib` on macOS). The program does not copy its code. It records "I need `libgnc.so`", and every time the program starts, the **[[dynamic loader|dynamic-loader]]** finds the file and connects the program to it.

::: example The same project, shared
Change one word, `STATIC` to `SHARED`, and rebuild from a clean folder with `--verbose`:

```text
[ 25%] Building CXX object CMakeFiles/gnc.dir/src/orbit.cpp.o
/usr/bin/c++ -Dgnc_EXPORTS -I.../gnc_shared/include -std=gnu++20 -fPIC -MD ... -c .../src/orbit.cpp
[ 50%] Linking CXX shared library libgnc.so
/usr/bin/c++ -fPIC -shared -Wl,-soname,libgnc.so -o libgnc.so CMakeFiles/gnc.dir/src/orbit.cpp.o
[100%] Linking CXX executable orbit_report
/usr/bin/c++ CMakeFiles/orbit_report.dir/apps/orbit_report.cpp.o -o orbit_report  -Wl,-rpath,.../gnc_shared/build libgnc.so
```

Four differences, and CMake added every one:

1. `-fPIC` compiles **[[position-independent code|fpic]]**, which a shared library needs because it can be loaded at any address.
2. `-shared` makes the linker produce a `.so` instead of a program, and `-Wl,-soname,libgnc.so` stamps the library's name inside it.
3. `-Dgnc_EXPORTS` defines a name that code can use to mark which functions the library makes visible. On Linux we do not need it; on Windows it matters.
4. The program's link adds `-Wl,-rpath,.../build`, which writes "look for libraries in the build folder" into the program, so it runs straight from the build tree.

Now ask the program what it needs, and where its gnc functions are:

```bash
ldd build/orbit_report
nm -C build/orbit_report | grep gnc
```

```text
	linux-vdso.so.1 (0x00007f0e5c727000)
	libgnc.so => .../gnc_shared/build/libgnc.so (0x00007f0e5c715000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f0e5c400000)
	libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f0e5c623000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f0e5c729000)
000000000000124c W gnc::deg_to_rad(double)
                 U gnc::orbit_period(double)
                 U gnc::circular_speed(double)
```

`libgnc.so` is now on the list of things to find at start-up, and the two orbit functions are `U`: used, but not inside the program. `deg_to_rad` is still `W`, still compiled in from the header; a header-only library behaves the same whatever kind the other libraries are. The program prints the same three lines as before.

Now take the book off the shelf. Move `libgnc.so` into another folder and run the program:

```text
./orbit_report: error while loading shared libraries: libgnc.so: cannot open shared object file: No such file or directory
```

The exit code is 127, and `main` never ran. The program was fine; the thing it points at was missing.
:::

So why would anyone choose shared? Because the book on the shelf has real advantages. Twenty ground-station tools that all use the same telemetry decoder can share one copy on disk and in memory. Fix a bug in the decoder, replace the one `.so`, and all twenty tools get the fix without being relinked. Big desktop libraries, such as graphics toolkits, are nearly always shared for these reasons.

The price is that the program is no longer one self-contained file. The right `.so`, of a compatible version, must be present on every machine, every time. For flight code that must behave exactly as tested, that is usually a price not worth paying.

::: warning "It works on my machine"
The build-tree program runs because CMake wrote the build folder's path into it. Copy only the program to another computer and you get `error while loading shared libraries`. The fixes: copy the `.so` too and install both properly (lesson 10 shows `install`), or link statically. And a missing `.so` is an error at *start-up*, not at build time, so a build that succeeds proves nothing about it.
:::

If you leave the kind out, as in `add_library(gnc src/orbit.cpp)`, CMake uses the variable `BUILD_SHARED_LIBS`, a [[project-wide switch|build-shared-libs]]: off (the default) gives a static library, and configuring with `-DBUILD_SHARED_LIBS=ON` gives a shared one. Tested here, the same file linked `libgnc.a` in one build folder and `libgnc.so` in another. Write the kind explicitly when it matters, and leave it out only when you want users to choose.

## `INTERFACE`: the how-to card

Now the third kind. `gnc_units` has no `.cpp` file. Everything in it is in the header. There is nothing to compile, so there is nothing to put in an archive or a `.so`. What *does* a user of it need? Only instructions:

- which folder to add to the include path,
- which C++ version the headers need,
- any names that must be defined, or other libraries that must come along.

Those instructions are exactly the usage requirements from earlier. An **INTERFACE library** is a target that has *only* usage requirements: no sources, no build step, no output file. Look back at the `build` folder listing: there is `libgnc.a` and `orbit_report`, and nothing at all for `gnc_units`. Yet `orbit_report` was compiled with the right `-I` and `-std=gnu++20`, because `target_link_libraries(orbit_report PRIVATE ... gnc_units)` handed the card over.

Because an INTERFACE library is never built, it has no "me" to apply settings to. So every `target_` command on it must use the `INTERFACE` keyword. Try `PUBLIC` and configure stops:

```text
CMake Error at CMakeLists.txt:4 (target_include_directories):
  target_include_directories may only set INTERFACE properties on INTERFACE
  targets
```

The most famous header-only library in engineering C++ is Eigen, which you met in the Eigen module. Its own CMake files describe it this way. This line is from Eigen's installed `Eigen3Targets.cmake` on this machine:

```cmake
add_library(Eigen3::Eigen INTERFACE IMPORTED)
```

and a few lines later it sets the target's `INTERFACE_INCLUDE_DIRECTORIES` to Eigen's include folder. (`IMPORTED` means "already built or provided elsewhere; do not build it here". Lesson 05 shows how `find_package` brings such targets in.) When you link `Eigen3::Eigen`, you get Eigen's include path, and nothing else, because there is nothing else.

::: key
When should a library be INTERFACE? When it is header-only: there is nothing to compile, only usage requirements to propagate. Eigen is the canonical example.
:::

::: warning Giving a header-only library the wrong kind
Write `add_library(gnc_units STATIC)` for a library with no sources, and the build stops at the generate step:

```text
CMake Error at CMakeLists.txt:3 (add_library):
  No SOURCES given to target: gnc_units
```

A `STATIC` or `SHARED` library promises an output file, and with no sources there is nothing to make it from. The other workaround people reach for, a global `include_directories(include)` at the top of the file, "works" but attaches the folder to every target in the directory instead of to the one library, and cannot be passed on to another project. The next lesson explains why that matters.
:::

## Choosing the kind

| Kind | What gets built | When it joins the program | Pick it when |
| --- | --- | --- | --- |
| `STATIC` | `libname.a`, an archive of `.o` files | at link time; code is copied in | flight code, embedded targets, one self-contained program |
| `SHARED` | `libname.so`, loaded code | at every start-up, by the loader | many programs share it, or it must be updated without relinking |
| `INTERFACE` | nothing | never compiled on its own | header-only code: templates, `constexpr` helpers, Eigen |

A header-only library's code still ends up in the program; it is compiled as part of each file that includes it. That makes header-only natural for templates, which must be in headers anyway. The cost is compile time: every file that includes a big header-only library recompiles it.

::: warning A misspelled target name is not caught by default
`target_link_libraries(app PRIVATE gnc_unit)` (missing the final `s`) configures without complaint. CMake assumes an unknown plain name is a system library, passes `-lgnc_unit` to the linker, and the build fails much later:

```text
/usr/bin/ld: cannot find -lgnc_unit: No such file or directory
```

The common defense is an **[[alias with a namespace|alias-targets]]**: `add_library(gnc::units ALIAS gnc_units)`, then link `gnc::units`. A name with `::` in it must be a target, so a typo like `gnc::unit` stops configure at once with "Target "app" links to: gnc::unit but the target was not found."
:::

## Check yourself

::: check
A teammate writes `add_library(quat INTERFACE)` for a header-only quaternion library, then `target_include_directories(quat PUBLIC include)`. Configure fails. Explain the error in plain words and fix the line.
:::

::: answer
`PUBLIC` means "use this setting to build me, and pass it on to my users". An INTERFACE library is never built — it has no sources and produces no file — so there is no "me" for the first half to apply to. CMake refuses with "target_include_directories may only set INTERFACE properties on INTERFACE targets". The fix is `target_include_directories(quat INTERFACE include)`: pass the include folder on to everything that links `quat`. The same goes for its `target_compile_features` and any `target_link_libraries`, for example `target_link_libraries(quat INTERFACE Eigen3::Eigen)` if the quaternion headers use Eigen.
:::

::: check
You run `nm -C` on a program and see `U gnc::circular_speed(double)`. On another build of the same program you see `T gnc::circular_speed(double)`. What kind of library was `gnc` in each build, and which program still runs if you delete every `libgnc` file?
:::

::: answer
`U` means the program uses the function but does not contain it, so it must be supplied when the program starts: `gnc` was a `SHARED` library. `T` means the function's code is inside the program: it was copied in from a `STATIC` archive at link time. Delete every `libgnc` file and only the `T` program still runs. The `U` one stops at start-up with "error while loading shared libraries: libgnc.so: cannot open shared object file", exit code 127, before `main` runs.
:::

::: check
Your team builds a ground-station telemetry decoder used by fifteen separate tools, and fixes it often. Your flight program for a small microcontroller also uses a set of `constexpr` unit conversions and a compiled attitude-math library. Choose `STATIC`, `SHARED` or `INTERFACE` for each of the three libraries, with a reason.
:::

::: answer
The telemetry decoder: `SHARED`. Fifteen tools share one copy, and a bug fix is one replaced `.so` rather than fifteen relinks; the ground machines have an operating system with a loader, and you control what is installed on them. The unit conversions: `INTERFACE`, because they are header-only (`constexpr` functions in a header); there is nothing to compile, only an include path and a C++ version to pass on. The attitude-math library: `STATIC`. A microcontroller with no operating system has no dynamic loader, and a flight program should be one self-contained file whose code is exactly what was tested.
:::

::: check
You add a new file `src/drag.cpp` to a library whose sources come from `file(GLOB SRCS src/*.cpp)`. You run `cmake --build build` and get `undefined reference to 'gnc::drag_force(double)'` from the app. The file is right there. What happened, and what is the lasting fix?
:::

::: answer
The glob was evaluated at configure time, when `drag.cpp` did not exist yet. Adding a file does not change any `CMakeLists.txt`, so `cmake --build` did not re-run configure, and the library was built from the old list without `drag.cpp`. Nobody compiled `drag_force`, so the linker could not find it. Re-running `cmake -S . -B build` would hide the problem this time. The lasting fix is to list sources by name in `add_library`, so adding a file means editing `CMakeLists.txt`, which makes the next build re-run configure.
:::

::: check
In the static example, `orbit_report`'s compile line contained `-I.../include` and `-std=gnu++20`, yet no `target_` command named `orbit_report` except `target_link_libraries`. Where did those two flags come from?
:::

::: answer
From its dependencies' usage requirements. `gnc` set its include folder and `cxx_std_20` as `PUBLIC`, and `gnc_units` set the same as `INTERFACE`; both mean "pass this on to users". `target_link_libraries(orbit_report PRIVATE gnc gnc_units)` made `orbit_report` a user of both, so it received the include path and the C++20 requirement. Linking a target in CMake means "take its usage requirements", not only "add it to the link line".
:::

## Summary

| Idea | Meaning | Example |
| --- | --- | --- |
| target | a named thing CMake builds or uses, with properties | `gnc`, `orbit_report`, `Eigen3::Eigen` |
| `add_executable` | makes a program from listed sources | `add_executable(orbit_report apps/orbit_report.cpp)` |
| `STATIC` | archive of objects; code copied in at link time | `libgnc.a`; symbols `T` in the program |
| `SHARED` | loaded by the dynamic loader at every start-up | `libgnc.so`; symbols `U`; needs `-fPIC` |
| `INTERFACE` | no build, no file; only usage requirements | header-only libraries such as Eigen |
| usage requirements | what a user of a target needs | include folders, C++ version, definitions, links |
| scope keywords | who a setting is for | `PRIVATE` me, `INTERFACE` my users, `PUBLIC` both |
| `BUILD_SHARED_LIBS` | picks the kind when `add_library` leaves it out | default off, so static |
| alias target | a second, namespaced name for a target | `add_library(gnc::units ALIAS gnc_units)` |

The next lesson, *Usage requirements: PUBLIC, PRIVATE and INTERFACE*, takes the three scope keywords apart: exactly what each one passes on, how to decide between them from your headers, and what breaks when you choose wrong.

::: context scope-keywords Three words, one question
Every `target_` command asks one question: who needs this setting?

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="90" height="36" rx="4" fill="#8fb8f0"/>
    <rect x="20" y="96" width="90" height="36" rx="4" fill="#ffffff"/>
  </g>
  <text x="65" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">library gnc</text>
  <text x="65" y="119" font-size="12" text-anchor="middle" fill="#1f2a44">its users</text>
  <line x1="65" y1="66" x2="65" y2="92" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="140" y="24" font-size="12" fill="#1f2a44" font-weight="700">setting goes to</text>
  <text x="140" y="52" font-size="12" fill="#1f2a44">PRIVATE</text>
  <text x="240" y="52" font-size="12" fill="#1d6fd1">gnc only</text>
  <text x="140" y="84" font-size="12" fill="#1f2a44">INTERFACE</text>
  <text x="240" y="84" font-size="12" fill="#b4232c">users only</text>
  <text x="140" y="116" font-size="12" fill="#1f2a44">PUBLIC</text>
  <text x="240" y="116" font-size="12" fill="#1f2a44">gnc and users</text>
</svg>
```

Lesson 03 turns this table into a rule you can apply from your header files alone.
:::

::: context archive An archive is a bag of object files
The `ar` tool is one of the oldest in Unix, and it does not know anything about C++. It packs files into one file with a small table of contents, the way a zip file does, but without compression. A static library is an `ar` archive whose members happen to be object files.

When the linker meets an archive, it does something clever: it pulls in only the members that define a symbol the program still needs. A library with a hundred object files adds only the few you use.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="170" height="92" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="14" font-size="12" text-anchor="middle" fill="#1f2a44">libgnc.a</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="30" width="70" height="30" fill="#8fb8f0"/>
    <rect x="100" y="30" width="70" height="30" fill="#ffffff"/>
    <rect x="20" y="72" width="70" height="30" fill="#ffffff"/>
    <rect x="100" y="72" width="70" height="30" fill="#ffffff"/>
  </g>
  <text x="55" y="49" font-size="11" text-anchor="middle" fill="#1f2a44">orbit.o</text>
  <text x="135" y="49" font-size="11" text-anchor="middle" fill="#6c7a93">drag.o</text>
  <text x="55" y="91" font-size="11" text-anchor="middle" fill="#6c7a93">ekf.o</text>
  <text x="135" y="91" font-size="11" text-anchor="middle" fill="#6c7a93">log.o</text>
  <line x1="90" y1="45" x2="238" y2="62" stroke="#b4232c" stroke-width="2"/>
  <polygon points="242,62 232,57 232,67" fill="#b4232c"/>
  <rect x="246" y="40" width="104" height="46" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="298" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">program uses</text>
  <text x="298" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">orbit only</text>
</svg>
```

(The gray members are made-up examples; only the member defining a needed symbol is copied.) `ranlib` writes the index that makes this search fast.
:::

::: context gnu-extensions Why gnu++20 and not c++20
CMake asked GCC for `-std=gnu++20`, not `-std=c++20`. The `gnu` form is C++20 plus a few GCC-specific extensions, and CMake uses it because the property `CXX_EXTENSIONS` is on by default.

Code that must also build with other compilers, as flight code often must, is safer with extensions off, so that an accidental GCC-only feature fails the build at once. Add this near the top of the `CMakeLists.txt`:

```cmake
set(CMAKE_CXX_EXTENSIONS OFF)
```

and every target then gets `-std=c++20`.
:::

::: context weak-symbols What the W means
`W` is a weak symbol. An inline function — and every `constexpr` function is inline — may be compiled into many object files, one per file that includes its header and uses it. That would normally be a "multiple definition" link error. Marking the copies weak tells the linker: these are all the same, keep one and drop the rest.

So a header-only library does end up as machine code in the program; it is compiled as part of the program's own files. (Here, at no optimization, `deg_to_rad` was kept as a real function. In a Release build the compiler would usually work it out in place and no symbol would remain.)
:::

::: context bare-metal Programs with no operating system
A bare-metal program runs directly on the processor with no operating system underneath: no files, no processes, and no dynamic loader. The whole program, library code included, is one image written into the chip's flash memory, and the processor starts running it at power-on.

Many small flight computers work this way — motor controllers, sensor boards, simple attitude-control units. For them `STATIC` and `INTERFACE` are the only kinds of library that make sense. Lesson 09 builds for such a processor with the `arm-none-eabi` cross compiler, where "none" means exactly this: no operating system.
:::

::: context dynamic-loader The program's first job
Before `main` runs, a Linux program that needs shared libraries is handed to the dynamic loader, `ld-linux-x86-64.so.2` (the last line of the `ldd` output). The loader reads the list of needed libraries stored in the program, searches for each one, maps it into memory and connects every `U` symbol to its real address.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="40" width="96" height="60" rx="4" fill="#ffffff"/>
    <rect x="132" y="40" width="96" height="60" rx="4" fill="#f2b880"/>
    <rect x="252" y="40" width="96" height="60" rx="4" fill="#8fb8f0"/>
  </g>
  <text x="60" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">orbit_report</text>
  <text x="60" y="82" font-size="11" text-anchor="middle" fill="#6c7a93">needs libgnc.so</text>
  <text x="180" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">loader</text>
  <text x="180" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">search, map, link</text>
  <text x="300" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">libgnc.so</text>
  <text x="300" y="82" font-size="11" text-anchor="middle" fill="#6c7a93">on disk</text>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="108" y1="70" x2="128" y2="70"/><line x1="228" y1="70" x2="248" y2="70"/>
  </g>
  <text x="180" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">search order: RUNPATH in the program, then system folders</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#b4232c">not found: exit 127 before main</text>
</svg>
```

The `-Wl,-rpath` CMake added is what put the build folder at the front of that search.
:::

::: context fpic Code that works at any address
A program's code is placed at a known address, so it may refer to its own functions and data by fixed addresses. A shared library cannot count on that: the loader puts it wherever there is room, and a different spot each time. Position-independent code refers to things relative to where it is running instead, through small lookup tables filled in by the loader.

That is what `-fPIC` asks for. CMake adds it for every `SHARED` library automatically; you never write it yourself.
:::

::: context build-shared-libs A switch for the whole project
`BUILD_SHARED_LIBS` is a standard CMake variable. Libraries that do not state their kind obey it, so a single `-DBUILD_SHARED_LIBS=ON` turns every one of them shared.

Open-source libraries often leave the kind out on purpose, so each user can choose. A packager building a Linux distribution wants shared libraries; a flight team vendoring the same code wants static. Your own flight libraries are usually better off saying `STATIC` outright.
:::

::: context alias-targets Names with two colons
An alias is a second, read-only name for an existing target. The convention, borrowed from C++ namespaces, is `project::thing`: `Eigen3::Eigen`, `GTest::gtest`, `gnc::units`.

The two colons do two jobs. First, CMake treats any name containing `::` as a target and never as a system library, so typos fail at configure time with a clear message. Second, when lesson 10 installs and exports your library, other projects will see it under a namespaced name like `gnc::gnc`. Creating the same alias inside your own project means your apps and tests link it by exactly the name outsiders will use.
:::
