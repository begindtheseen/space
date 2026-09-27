---
id: l10-install-and-export
title: 'Install and export: letting other projects find you'
minutes: 21
covers:
  - install and export so downstream projects can find_package you
---

Think about lending a board game to a friend. You would not hand over a loose pile of cards and a board. You put everything in the box, and you tuck the rule sheet on top. The rule sheet says how to set up, and it says what is *not* in the box: "needs two AA batteries". Your friend opens the box, reads the sheet, and plays. They never have to phone you to ask where the dice went.

Your `gnc` library is the game. Other projects — the flight software, a simulator, a ground-station tool — want to use it. Those users are called **[[downstream|downstream]]** projects: they sit below yours in the flow of code, the way a town sits downstream of a river's source. Lesson 05 showed the downstream side of this: `find_package(Eigen3)` found Eigen's rule sheet and handed you a ready-made target. This lesson is the other side. You will pack `gnc` so that a downstream project can write `find_package(gnc)` and get the same treatment.

Packing takes two CMake ideas. **Install** copies the finished files — the library and its headers — into a tidy folder tree. **Export** writes the rule sheet: a generated CMake file that describes the target, with every usage requirement from lesson 03 attached.

## What a downstream project needs

Start with the library from lesson 03's bug hunt. Its public header uses Eigen types, so Eigen is a public dependency:

```cpp
#pragma once

#include <Eigen/Geometry>

namespace gnc {

// Rotates a vector from the vehicle's body frame into the inertial frame.
Eigen::Vector3d body_to_inertial(const Eigen::Quaterniond& q_ib,
                                 const Eigen::Vector3d& v_body);

}  // namespace gnc
```

The source file, `src/attitude.cpp`:

```cpp
#include "gnc/attitude.hpp"

namespace gnc {

Eigen::Vector3d body_to_inertial(const Eigen::Quaterniond& q_ib,
                                 const Eigen::Vector3d& v_body) {
    return q_ib.normalized() * v_body;
}

}  // namespace gnc
```

To compile and link against this, a downstream project needs four things: the folder holding `gnc/attitude.hpp`, the folder holding Eigen's headers, C++20, and the file `libgnc.a`. Those are exactly the usage requirements `gnc` already carries inside its own build. The question is how to get them out of your build and into someone else's.

::: example Hand-rolling it, and getting it wrong
Suppose `gnc` has been copied into a folder called `stage` — an `include/` folder and a `lib/` folder — and a downstream project wires it up by hand:

```cmake
cmake_minimum_required(VERSION 3.28)
project(guidance_app LANGUAGES CXX)

set(GNC_ROOT "" CACHE PATH "Where gnc was installed")

add_executable(guidance_app main.cpp)
target_include_directories(guidance_app PRIVATE ${GNC_ROOT}/include)
target_link_libraries(guidance_app PRIVATE ${GNC_ROOT}/lib/libgnc.a)
```

Configure with `-DGNC_ROOT=` pointing at `stage` and build. Real output, paths shortened with `[...]`:

```text
[...]/stage/include/gnc/attitude.hpp:3:10: fatal error: Eigen/Geometry: No such file or directory
```

The author remembered two of the four requirements and forgot Eigen. The error even appears inside *gnc's* header, which makes it look like gnc's fault. Next week `gnc` adds a new dependency, and every hand-rolled consumer breaks again. This is the mistake install and export exist to prevent: consumers should never have to know your requirements. Your package should tell them.
:::

## Step 1: install copies the files

The `install()` command does not do anything during the build. It records rules. Later, the command `cmake --install` follows the rules and copies files into a folder called the **install prefix**. By default the prefix is **[[/usr/local|install-prefix]]**; for practice you pick your own with `--prefix`.

Two `install()` calls cover the files:

```cmake
include(GNUInstallDirs)   # CMAKE_INSTALL_LIBDIR, CMAKE_INSTALL_INCLUDEDIR, ...

install(TARGETS gnc EXPORT gncTargets
  ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
  LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
  RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})
install(DIRECTORY include/gnc DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})
```

Read the first one aloud as: "install the target `gnc`, remember it as part of a group called `gncTargets`, and put each kind of output file in this folder". `ARCHIVE` means a static library (`.a`), `LIBRARY` a shared library (`.so`), and `RUNTIME` an executable or a Windows `.dll`. Listing all three means the same rule works whatever kind of library lesson 02's `add_library` made.

`EXPORT gncTargets` is the important part. It does not copy anything. It adds `gnc` to a named **export set**, a list of targets whose descriptions will be written out in step 2.

The second call copies the whole `include/gnc` folder, headers and all, into the install tree's include folder.

**[[GNUInstallDirs|gnuinstalldirs]]** is a module that sets the standard folder names for this system: `CMAKE_INSTALL_LIBDIR` is usually `lib`, `CMAKE_INSTALL_INCLUDEDIR` is `include`, `CMAKE_INSTALL_BINDIR` is `bin`. Using the variables instead of typing `lib` keeps the package correct on systems with other conventions.

### Two include paths for one library

Here is a snag. Inside your build, `gnc`'s headers live in your source folder, say `/home/you/gnc/include`. Once installed, they live in `<prefix>/include`. A usage requirement that names your source folder would be useless — worse than useless — on anyone else's machine.

Lesson 04 previewed the fix: two generator expressions, one for each situation.

```cmake
target_include_directories(gnc PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>)
```

`$<BUILD_INTERFACE:...>` is kept only while building inside this project. `$<INSTALL_INTERFACE:...>` is kept only in the exported description, and a relative path there is taken relative to wherever the package ends up installed.

::: warning CMake refuses to export your source folder
Write the plain `target_include_directories(gnc PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)` and add the `install(EXPORT ...)` rule from step 2. Configure fails with this real error:

```text
CMake Error in CMakeLists.txt:
  Target "gnc" INTERFACE_INCLUDE_DIRECTORIES property contains path:

    "[...]/bad/include"

  which is prefixed in the source directory.
```

CMake is protecting your users: that path exists only on your machine. The fix is the `BUILD_INTERFACE` and `INSTALL_INTERFACE` pair. When you see "prefixed in the source directory" or "prefixed in the build directory", this is the cause.
:::

## Step 2: export writes the target's description

Now the rule sheet. One more `install()` call turns the export set into a CMake file:

```cmake
install(EXPORT gncTargets
  NAMESPACE gnc::
  DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/gnc)
```

It writes `gncTargets.cmake` into `lib/cmake/gnc/`, a folder where `find_package` knows to look. That file creates an **[[imported target|imported-target]]** — a target that stands for a library someone else already built. You cannot compile an imported target; you can only link to it, and linking to it hands you its usage requirements.

`NAMESPACE gnc::` puts `gnc::` in front of every target name in the set, so the consumer links `gnc::gnc`. The **[[double colon|double-colon]]** is not decoration. CMake knows a name containing `::` must be a target, so a typo becomes a clear error at configure time instead of a strange link error later.

Inside your own build, add the same name as an **alias**, so code that uses `gnc` from source (through `add_subdirectory` or lesson 05's FetchContent) spells it the same way as code that uses the installed package:

```cmake
add_library(gnc::gnc ALIAS gnc)
```

::: example What the generated file says
Here is the heart of the `gncTargets.cmake` that CMake 3.28 wrote, copied from the install tree:

```cmake
add_library(gnc::gnc STATIC IMPORTED)

set_target_properties(gnc::gnc PROPERTIES
  INTERFACE_COMPILE_FEATURES "cxx_std_20"
  INTERFACE_INCLUDE_DIRECTORIES "${_IMPORT_PREFIX}/include"
  INTERFACE_LINK_LIBRARIES "Eigen3::Eigen"
)
```

and, in a companion file for the Release configuration, `gncTargets-release.cmake`:

```cmake
set_property(TARGET gnc::gnc APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(gnc::gnc PROPERTIES
  IMPORTED_LINK_INTERFACE_LANGUAGES_RELEASE "CXX"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libgnc.a"
  )
```

Walk through the four requirements from the start of the lesson:

1. `gnc`'s header folder: `INTERFACE_INCLUDE_DIRECTORIES`, from the `INSTALL_INTERFACE` half.
2. Eigen: `INTERFACE_LINK_LIBRARIES "Eigen3::Eigen"`, because `gnc` linked Eigen `PUBLIC`. Eigen's own target brings Eigen's header folder.
3. C++20: `INTERFACE_COMPILE_FEATURES "cxx_std_20"`, from `target_compile_features(gnc PUBLIC cxx_std_20)`.
4. The library file: `IMPORTED_LOCATION_RELEASE`.

`_IMPORT_PREFIX` is computed when the file is loaded, from the file's own location, so the package still works after someone moves the whole install folder.

Now notice what is *missing*. The library's CMakeLists also has `target_compile_options(gnc PRIVATE -Wall -Wextra)`. It is not in the file. `PRIVATE` meant "for building gnc only", and export respects that: only the `PUBLIC` and `INTERFACE` halves travel. That is lesson 03's rule, written to disk.
:::

## Step 3: the config file and the version file

`find_package(gnc)` does not look for `gncTargets.cmake`. It looks for a file named `gncConfig.cmake` (or `gnc-config.cmake`). That is the front page of the rule sheet, and you write a template for it. By convention it goes in `cmake/gncConfig.cmake.in`:

```cmake
@PACKAGE_INIT@

# gnc's public headers include Eigen, so a consumer needs Eigen too.
include(CMakeFindDependencyMacro)
find_dependency(Eigen3 3.4 NO_MODULE)

# The imported target gnc::gnc, written by install(EXPORT).
include("${CMAKE_CURRENT_LIST_DIR}/gncTargets.cmake")

check_required_components(gnc)
```

Line by line:

- `@PACKAGE_INIT@` is a placeholder. When the template is filled in, it becomes a block of helper code that works out the install prefix from the file's own location.
- `find_dependency(Eigen3 ...)` is the "batteries not included" line. The targets file *mentions* `Eigen3::Eigen` but cannot create it. This line finds Eigen on the consumer's machine first. If Eigen is missing, `find_dependency` makes `find_package(gnc)` fail cleanly with a message that names Eigen.
- `include(...gncTargets.cmake)` loads the file from step 2, which creates `gnc::gnc`.
- `check_required_components(gnc)` handles packages that come in optional parts; for a one-part package it has nothing to check but is standard.

Two commands from the module `CMakePackageConfigHelpers` turn this into real files:

```cmake
include(CMakePackageConfigHelpers)

configure_package_config_file(cmake/gncConfig.cmake.in
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfig.cmake
  INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/gnc)
write_basic_package_version_file(
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfigVersion.cmake
  COMPATIBILITY SameMajorVersion)
install(FILES
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfig.cmake
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfigVersion.cmake
  DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/gnc)
```

`configure_package_config_file` fills in the template. `write_basic_package_version_file` writes `gncConfigVersion.cmake`, a small file that answers one question: "is the version you have good enough for the version I asked for?" It takes the version from the `project(gnc VERSION 1.2.0 ...)` line. The `install(FILES ...)` call copies both into the same folder as the targets file.

The `COMPATIBILITY` word sets the rule for "good enough". `SameMajorVersion` fits **[[semantic versioning|semantic-versioning]]**, where the first number changes only when old code would break. The other choices are `AnyNewerVersion`, `SameMinorVersion` and `ExactVersion`.

::: warning The missing batteries line
Leave out `find_dependency(Eigen3 ...)` and the package still installs. The consumer's configure then fails inside *your* file:

```text
CMake Error at [...]/stage-bad/lib/cmake/gnc/gncTargets.cmake:61 (set_target_properties):
  The link interface of target "gnc::gnc" contains:

    Eigen3::Eigen

  but the target was not found.
```

Every `PUBLIC` or `INTERFACE` dependency that is an imported target needs a matching `find_dependency` in the config file. A `PRIVATE` dependency of a shared library does not. A static library's link dependencies still travel, as the generated file shows, so check them too.
:::

::: key
Install plus export gives a downstream project a generated package configuration file so the consumer can call `find_package(gnc)` and link an imported target that already carries the usage requirements. Without it, consumers hand-roll include paths and get them wrong. The pieces: `install(TARGETS gnc EXPORT gncTargets ...)`, `install(EXPORT gncTargets NAMESPACE gnc:: ...)`, `configure_package_config_file` for `gncConfig.cmake`, and `write_basic_package_version_file` for `gncConfigVersion.cmake`.
:::

## Installing and consuming

Put all three steps into the library's `CMakeLists.txt`. Here is the complete file:

```cmake
cmake_minimum_required(VERSION 3.28)
project(gnc VERSION 1.2.0 LANGUAGES CXX)

include(GNUInstallDirs)              # CMAKE_INSTALL_LIBDIR, CMAKE_INSTALL_INCLUDEDIR, ...
include(CMakePackageConfigHelpers)   # configure_package_config_file, write_basic_...

find_package(Eigen3 3.4 REQUIRED NO_MODULE)

add_library(gnc STATIC src/attitude.cpp)
add_library(gnc::gnc ALIAS gnc)      # same name inside the build as outside it
target_include_directories(gnc PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>)
target_compile_features(gnc PUBLIC cxx_std_20)
target_compile_options(gnc PRIVATE -Wall -Wextra)
target_link_libraries(gnc PUBLIC Eigen3::Eigen)

# 1. Copy the built library and the headers into the install tree.
install(TARGETS gnc EXPORT gncTargets
  ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
  LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
  RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})
install(DIRECTORY include/gnc DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

# 2. Write gncTargets.cmake, which defines the imported target gnc::gnc.
install(EXPORT gncTargets
  NAMESPACE gnc::
  DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/gnc)

# 3. Write gncConfig.cmake (what find_package loads) and its version file.
configure_package_config_file(cmake/gncConfig.cmake.in
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfig.cmake
  INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/gnc)
write_basic_package_version_file(
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfigVersion.cmake
  COMPATIBILITY SameMajorVersion)
install(FILES
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfig.cmake
  ${CMAKE_CURRENT_BINARY_DIR}/gncConfigVersion.cmake
  DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/gnc)
```

The downstream project is the short part. That is the whole point:

```cmake
cmake_minimum_required(VERSION 3.28)
project(guidance_app LANGUAGES CXX)

find_package(gnc 1.2 REQUIRED)

add_executable(guidance_app main.cpp)
target_link_libraries(guidance_app PRIVATE gnc::gnc)
```

and its program, which turns a 1000-newton thrust along the vehicle's nose into the inertial frame after a 90-degree yaw:

```cpp
#include <gnc/attitude.hpp>

#include <cstdio>

int main() {
    // The vehicle has yawed 90 degrees to the left about the vertical (z) axis.
    const Eigen::Quaterniond q_ib(Eigen::AngleAxisd(EIGEN_PI / 2.0, Eigen::Vector3d::UnitZ()));
    const Eigen::Vector3d thrust_body(1000.0, 0.0, 0.0);   // newtons, along the nose

    const Eigen::Vector3d thrust_inertial = gnc::body_to_inertial(q_ib, thrust_body);
    std::printf("thrust in inertial frame: [%.1f, %.1f, %.1f] N\n",
                thrust_inertial.x(), thrust_inertial.y(), thrust_inertial.z());
    return 0;
}
```

Not one line of it mentions Eigen's folder, gnc's folder, C++20 or `libgnc.a`.

::: example Install, then find
Build and install the library into a folder called `stage`:

```bash
cmake -S gnc -B gnc/build -DCMAKE_BUILD_TYPE=Release
cmake --build gnc/build
cmake --install gnc/build --prefix stage
```

The install step lists every file it copies. The resulting tree:

```text
stage
stage/include
stage/include/gnc
stage/include/gnc/attitude.hpp
stage/lib
stage/lib/cmake
stage/lib/cmake/gnc
stage/lib/cmake/gnc/gncConfig.cmake
stage/lib/cmake/gnc/gncConfigVersion.cmake
stage/lib/cmake/gnc/gncTargets-release.cmake
stage/lib/cmake/gnc/gncTargets.cmake
stage/lib/libgnc.a
```

Count the pieces: one header, one library, four CMake files. Now build the consumer. `CMAKE_PREFIX_PATH` is the list of prefixes where `find_package` should look, besides the system's usual places:

```bash
cmake -S consumer -B consumer/build -DCMAKE_PREFIX_PATH=$PWD/stage
cmake --build consumer/build
./consumer/build/guidance_app
```

```text
thrust in inertial frame: [0.0, 1000.0, 0.0] N
```

Sanity check: a 90-degree turn to the left about the vertical axis swings the nose from the $x$ axis to the $y$ axis. The thrust keeps its size, $1000\,\mathrm{N}$, and now points along $y$. That is what printed.

To see the requirements arrive, touch `main.cpp` and rebuild with `cmake --build consumer/build -v`. The compile line (shortened):

```text
/usr/bin/c++  -isystem [...]/stage/include -isystem /usr/include/eigen3 -std=gnu++20 [...] -c [...]/consumer/main.cpp
```

gnc's headers, Eigen's headers and C++20 — every one supplied by the package. And no `-Wall -Wextra`, because those were gnc's private business. The headers come in with `-isystem` rather than `-I`, which CMake does for **[[imported targets' headers|isystem]]**.
:::

::: example Asking for the right version
With `gnc` 1.2.0 installed and `COMPATIBILITY SameMajorVersion`, change the version in the consumer's `find_package(gnc 1.2 REQUIRED)` line and configure again each time. The real results:

| Requested | Result |
| --- | --- |
| `1.0` | accepted |
| `1.2` | accepted |
| `1.3` | rejected |
| `2.0` | rejected |

The rule: the major number (the first one) must match, and the installed version must be at least the one asked for. $1.2.0 \ge 1.0$ with major 1 matching, so accepted. $1.2.0 < 1.3$: a consumer that needs a 1.3 feature cannot use 1.2, so rejected. `2.0` has a different major number, so rejected even though it is newer, because a new major version is allowed to break old code. The `2.0` error message reads:

```text
CMake Error at CMakeLists.txt:4 (find_package):
  Could not find a configuration file for package "gnc" that is compatible
  with requested version "2.0".

  The following configuration files were considered but not accepted:

    [...]/stage/lib/cmake/gnc/gncConfig.cmake, version: 1.2.0
```

And with no `CMAKE_PREFIX_PATH` at all, CMake finds nothing and says so, listing the two file names it looked for, `gncConfig.cmake` and `gnc-config.cmake`, and suggesting you set `CMAKE_PREFIX_PATH` or `gnc_DIR`.
:::

::: warning Install into a prefix you own
`cmake --install build` with no `--prefix` installs into `/usr/local`, which needs administrator rights and mixes your files with everyone else's. For development and CI, install into a folder inside your workspace and point consumers at it with `CMAKE_PREFIX_PATH`. Package managers from lesson 05, vcpkg and Conan, do exactly this for you: they run your install step into their own prefix and pass that prefix to the consumer.
:::

## Why it is worth the trouble

A flight software team might have a dozen libraries: math, frames, navigation filters, guidance, telemetry. Each one is used by the flight program, the simulator, the hardware test rig and ground tools. With install and export, each library states its requirements once, in its own `CMakeLists.txt`, and every consumer gets them right automatically. When the navigation library adds a dependency, nothing downstream changes.

It also works for the cross-compiled world of lesson 09. Build `gnc` with the Arm toolchain file and install it into a prefix of Arm libraries. A firmware project built with the same toolchain file puts that prefix in `CMAKE_FIND_ROOT_PATH`, and `find_package(gnc)` finds the Arm copy, never the laptop's.

## Check yourself

::: check
A library installs its `.a` file and headers with `install(TARGETS ...)` and `install(DIRECTORY ...)`, but has no `install(EXPORT ...)` and no config file. A consumer writes `find_package(gnc REQUIRED)`. What happens, and why?
:::

::: answer
Configure fails: CMake cannot find a package configuration file named `gncConfig.cmake` or `gnc-config.cmake`. The files are on disk, but nothing describes them. `find_package` in config mode does not go looking for headers and libraries; it looks for the rule sheet. Without the export and config file, the only option left is hand-rolling the paths, which is the fragile approach this lesson replaces.
:::

::: check
In the exported `gncTargets.cmake`, `INTERFACE_LINK_LIBRARIES` says `Eigen3::Eigen` but nothing mentions `-Wall`. Explain both facts from how the target was declared.
:::

::: answer
`target_link_libraries(gnc PUBLIC Eigen3::Eigen)`: `PUBLIC` means "use it to build gnc and pass it on to users", so it is part of the interface and is exported. `target_compile_options(gnc PRIVATE -Wall -Wextra)`: `PRIVATE` means "for building gnc only", so it has no interface half and nothing is written. Export writes down exactly the interface — the usage requirements — and nothing else.
:::

::: check
Why does `target_include_directories` need both `$<BUILD_INTERFACE:...>` and `$<INSTALL_INTERFACE:...>`? What would each consumer see if you wrote only the source folder path?
:::

::: answer
The headers live in two different places in two different situations: in your source folder while building gnc (and for anything using gnc through `add_subdirectory` or FetchContent), and in `<prefix>/include` once installed. Each expression keeps its path only in its own situation. With only the source path, CMake refuses to generate, with the error that the path is "prefixed in the source directory" — and if it did not refuse, every consumer on another machine would get an include path that does not exist there.
:::

::: check
`gnc` 1.2.0 is installed with `COMPATIBILITY AnyNewerVersion` instead of `SameMajorVersion`. Which of the requests `1.0`, `1.3` and `2.0` would now be accepted? Which choice fits a library that follows semantic versioning, and why?
:::

::: answer
`AnyNewerVersion` accepts any installed version at least as new as the request. $1.2.0 \ge 1.0$, so `1.0` is accepted. $1.2.0 < 1.3$ and $1.2.0 < 2.0$, so both are rejected. The difference shows the other way round: if `gnc` 2.0.0 were installed, `AnyNewerVersion` would accept a request for `1.0`, even though under semantic versioning 2.0 may have broken 1.x code. `SameMajorVersion` rejects that, which is why it fits semantic versioning.
:::

::: check
A teammate moves `navlib` from `PRIVATE` to `PUBLIC` in `target_link_libraries(gnc ...)` because gnc's headers now use a `navlib` type. Besides that line, what else must change for downstream `find_package(gnc)` users to keep working?
:::

::: answer
The config template needs `find_dependency(navlib)` before it includes `gncTargets.cmake`. The exported file will now list `navlib::navlib` in `INTERFACE_LINK_LIBRARIES`, and a consumer's configure fails with "the target was not found" unless something has created that target first. `find_dependency` does that and, if `navlib` is missing, fails with a message naming it. Consider bumping gnc's version too, since consumers now need `navlib` installed.
:::

## Summary

| Idea | Meaning | Command or fact |
| --- | --- | --- |
| downstream project | a project that uses yours | writes `find_package(gnc)` and links `gnc::gnc` |
| install | rules to copy built files into a prefix | `install(TARGETS gnc EXPORT gncTargets ...)`, `cmake --install build --prefix stage` |
| export set | a named group of targets to describe | `EXPORT gncTargets` |
| export | writes the imported target with its usage requirements | `install(EXPORT gncTargets NAMESPACE gnc:: DESTINATION lib/cmake/gnc)` |
| two include paths | build tree versus install tree | `$<BUILD_INTERFACE:...>`, `$<INSTALL_INTERFACE:include>` |
| config file | what `find_package` loads | `configure_package_config_file` from `gncConfig.cmake.in` |
| dependencies | public imported targets must be found first | `find_dependency(Eigen3 3.4 NO_MODULE)` |
| version file | "is this version good enough?" | `write_basic_package_version_file(... COMPATIBILITY SameMajorVersion)` |
| alias | same name from source or installed | `add_library(gnc::gnc ALIAS gnc)` |
| finding it | where to look | `CMAKE_PREFIX_PATH` or `gnc_DIR` |

This was the last lesson of the module. With it you can stand up a library, an application and tests that build with two commands, cross-compile them, and hand the library to any other project. The GoogleTest and GoogleMock module builds on this setup: the tests you write there register with CTest through `gtest_discover_tests` and run in the Debug, Release, sanitizer and coverage builds you already have.

::: context downstream Upstream and downstream
Programmers borrow the picture of a river. The project that provides code is **upstream**; the projects that use it are **downstream**. Changes flow downstream: when Eigen releases a new version, your gnc library feels it, and then the flight program that uses gnc feels it. "Send the fix upstream" means offering it to the original project so everyone downstream gets it too.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="80" height="36" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="63" font-size="12" fill="#1f2a44" text-anchor="middle">Eigen</text>
  <rect x="140" y="40" width="80" height="36" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="63" font-size="12" fill="#1f2a44" text-anchor="middle">gnc</text>
  <rect x="265" y="40" width="85" height="36" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="307" y="63" font-size="12" fill="#1f2a44" text-anchor="middle">flight app</text>
  <line x1="92" y1="58" x2="132" y2="58" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="138,58 128,52 128,64" fill="#1d6fd1"/>
  <line x1="222" y1="58" x2="257" y2="58" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="263,58 253,52 253,64" fill="#1d6fd1"/>
  <text x="50" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">upstream</text>
  <text x="307" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">downstream</text>
  <text x="180" y="25" font-size="11" fill="#1d6fd1" text-anchor="middle">code and changes flow this way</text>
</svg>
```
:::

::: context install-prefix Where installed files go
On Linux and macOS, `/usr` belongs to the operating system's package manager, and `/usr/local` is the traditional place for software you build yourself. CMake uses `/usr/local` as the default `CMAKE_INSTALL_PREFIX` there. Many teams instead install into `/opt/<name>` for a whole product, or into a folder inside the workspace for builds and CI, so nothing touches the system at all.
:::

::: context gnuinstalldirs Why not type lib
Linux distributions disagree on small things. Some put 64-bit libraries in `lib64`; Debian and Ubuntu use `lib/x86_64-linux-gnu` when the prefix is `/usr`. The GNU coding standards name these folders, and CMake's GNUInstallDirs module picks the right value for the system at configure time. Into the `stage` prefix of this lesson it chose plain `lib`. Your CMake files stay the same everywhere.
:::

::: context imported-target A target someone else built
A normal target is a recipe: sources plus settings that CMake turns into build steps. An imported target has no recipe. It points at a file that already exists, like `libgnc.a`, and carries the usage requirements for using it. `Eigen3::Eigen`, `GTest::gtest_main` and `gnc::gnc` are all imported targets. From the consumer's side, linking one looks exactly like linking a library built in the same project, which is the point.
:::

::: context double-colon Why the name has two colons
In `target_link_libraries`, a plain word could be a target or the name of a system library: `m` means "link `libm`". If you mistype a target's plain name, CMake may quietly pass it to the linker as `-lgnx`, and the error appears later and makes less sense. A name with `::` can only be a target, so CMake checks it at configure time and stops with a clear message if it does not exist. That is why every exported target, and its alias, should carry a namespace.
:::

::: context semantic-versioning Three numbers with meanings
Semantic versioning writes versions as MAJOR.MINOR.PATCH, like 1.2.0. PATCH goes up for bug fixes that change nothing else. MINOR goes up when features are added and old code still works. MAJOR goes up when something changes that can break old code. So a consumer written for 1.2 should work with 1.5, but maybe not with 2.0.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="180" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">installed: 1.2.0, rule: SameMajorVersion</text>
  <line x1="20" y1="65" x2="340" y2="65" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" text-anchor="middle">
    <circle cx="50" cy="65" r="7" fill="#1d6fd1"/><text x="50" y="92" fill="#1f2a44">1.0</text><text x="50" y="108" fill="#1d6fd1">yes</text>
    <circle cx="130" cy="65" r="7" fill="#1d6fd1"/><text x="130" y="92" fill="#1f2a44">1.2</text><text x="130" y="108" fill="#1d6fd1">yes</text>
    <circle cx="210" cy="65" r="7" fill="#b4232c"/><text x="210" y="92" fill="#1f2a44">1.3</text><text x="210" y="108" fill="#b4232c">too new</text>
    <circle cx="300" cy="65" r="7" fill="#b4232c"/><text x="300" y="92" fill="#1f2a44">2.0</text><text x="300" y="108" fill="#b4232c">new major</text>
  </g>
  <line x1="130" y1="40" x2="130" y2="55" stroke="#f2b880" stroke-width="3"/>
  <text x="130" y="36" font-size="11" fill="#1f2a44" text-anchor="middle">installed</text>
</svg>
```
:::

::: context isystem Quiet about other people's headers
`-isystem` works like `-I`, but tells the compiler to treat the folder as a system header folder. The compiler then does not report most warnings from inside those headers. That matters when your own code builds with strict warnings, maybe even treating warnings as errors: a warning in Eigen's templates is not something you can fix, and it should not break your build. Your own headers, included with `-I`, still get every warning.
:::
