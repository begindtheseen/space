---
id: l05-dependencies-find-package-and-fetchcontent
title: 'Dependencies: find_package and FetchContent'
minutes: 20
covers:
  - find_package and config packages; FetchContent versus submodules versus Conan or vcpkg
---

You are cooking dinner and the recipe needs tomato sauce. You have four ways to get it.

- Take the jar that is already in the pantry. Fast, but only if somebody bought the right one.
- Grow tomatoes in the backyard and cook the sauce yourself, every time. You know exactly what went in, but dinner takes longer.
- Keep a jar of your grandmother's sauce in your own freezer, labeled with the date it was made. It is always there, but somebody has to remember to take it out.
- Order from a grocery delivery service with a written list: "brand X, size Y". It arrives the same every time, and the store may even have it ready-made.

A C++ project needs other people's code the same way. The guidance library needs Eigen for matrices. The tests need GoogleTest. The telemetry tool wants fmt for formatting text. Each is a **dependency** — a library your project needs but did not write. This lesson covers the four ways a CMake project gets them: **find_package** (the pantry), **FetchContent** (the backyard), **git submodules** (the freezer) and **package managers** like Conan and vcpkg (the delivery service). Choosing between them decides how long a fresh build takes, whether two engineers get the same Eigen, and whether the flight build can be repeated exactly years later.

## find_package: use what is already installed

`find_package` asks CMake to locate a library that is already installed on this machine and hand you a target for it. The last two lessons made targets carry their own usage requirements. `find_package` is how another project's targets, with their requirements, arrive in yours.

```cmake
find_package(Eigen3 3.3 REQUIRED NO_MODULE)
```

Read it word by word.

- `Eigen3` is the **package name**. It must match what the library's authors chose, capital letters included.
- `3.3` is the **minimum version** you accept.
- `REQUIRED` means "stop with an error if it is missing". Without it, CMake carries on and sets `Eigen3_FOUND` to false, which is only useful when the dependency is optional.
- `NO_MODULE` (the same as `CONFIG`) means "look only for a config file written by Eigen itself". The next section explains what that is.

When it succeeds, you link an **[[imported target|imported-target]]** — a target that stands for something already built and installed, rather than something this project builds:

```cmake
target_link_libraries(orbit PRIVATE Eigen3::Eigen)
```

`Eigen3::Eigen` carries Eigen's include folder as a usage requirement, exactly like the targets you wrote yourself. You never type `/usr/include/eigen3`.

### Config files and find modules

How does CMake know what `Eigen3::Eigen` means? Somebody has to describe the installed library to it, and there are two kinds of description.

A **config file** is a CMake script that a library installs *alongside itself*, named `<Name>Config.cmake` or `<lowercase-name>-config.cmake`. It is written (usually generated) by the library's own build, so it knows exactly where the headers went and which targets exist. A library that installs one is called a **config package**. Eigen installs `Eigen3Config.cmake`. GoogleTest installs `GTestConfig.cmake`. Lesson 10 makes `gnc` install one too, so other projects can `find_package(gnc)`.

A **find module** is a script named `Find<Name>.cmake`, written by *someone else* — CMake 3.28 ships about 160 of them, mostly for older libraries that never provided a config file. It searches the usual folders, guesses, and builds targets from what it finds.

`find_package` in its default form tries a find module first, and falls back to config mode if there is none. `NO_MODULE` or `CONFIG` skips the find module. Prefer config packages whenever the library provides one: the description comes from the people who built the library, not from a guess.

::: key
A config package installs its own `<Name>Config.cmake`, written by the library's build, which defines imported targets such as `Eigen3::Eigen` that already carry include folders, definitions and dependencies. `find_package(... CONFIG)` uses only these. A `Find<Name>.cmake` module is a search script written by someone else.
:::

### Where CMake looks

CMake searches **[[a list of places|search-order]]** for the config file. The ones you will steer yourself are:

1. `<Name>_DIR`, a cache variable pointing straight at the folder that holds the config file. Once found, CMake stores the answer here.
2. `CMAKE_PREFIX_PATH`, a list of install **prefixes** — the top folder of an installation, such as `/opt/gnc` — that you pass on the command line: `-DCMAKE_PREFIX_PATH=/opt/gnc;/opt/eigen-3.4`.
3. The system prefixes, such as `/usr` and `/usr/local`.

Under each prefix it tries standard subfolders, such as `lib/cmake/<name>/` and `share/<name>/cmake/`. That is how it found Eigen below, in `/usr/share/eigen3/cmake/`.

::: example Finding Eigen and reading what came back
A tiny program computes a spacecraft's angular momentum per kilogram, $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ (read "h equals r cross v"), for a circular orbit about $400\,\mathrm{km}$ up.

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    // Position of a spacecraft in km, and its distance from Earth's center.
    const Eigen::Vector3d r{6778.0, 0.0, 0.0};
    const Eigen::Vector3d v{0.0, 7.67, 0.0};  // velocity, km/s
    const Eigen::Vector3d h = r.cross(v);     // specific angular momentum
    std::cout << "Eigen " << EIGEN_WORLD_VERSION << "." << EIGEN_MAJOR_VERSION
              << "." << EIGEN_MINOR_VERSION << "\n";
    std::cout << "|h| = " << h.norm() << " km^2/s\n";
}
```

```cmake
cmake_minimum_required(VERSION 3.28)
project(uses_eigen LANGUAGES CXX)

find_package(Eigen3 3.3 REQUIRED NO_MODULE)
message(STATUS "Found Eigen3 ${Eigen3_VERSION} via ${Eigen3_DIR}")

add_executable(orbit main.cpp)
target_link_libraries(orbit PRIVATE Eigen3::Eigen)
target_compile_features(orbit PRIVATE cxx_std_20)
```

Configure, build and run:

```text
-- Found Eigen3 3.4.0 via /usr/share/eigen3/cmake
-- Configuring done (0.2s)
-- Generating done (0.0s)
[100%] Built target orbit
Eigen 3.4.0
|h| = 51987.3 km^2/s
```

Three things to read off.

1. **The version.** We asked for at least 3.3 and got 3.4.0. The config package ships a small **version file**, `Eigen3ConfigVersion.cmake`, which answered "yes, 3.4.0 satisfies 3.3".
2. **The folder.** `Eigen3_DIR` now holds `/usr/share/eigen3/cmake`, and is saved in the cache so the next configure does not search again.
3. **The answer.** The two vectors are at right angles, so $|\mathbf{h}| = |\mathbf{r}|\,|\mathbf{v}| = 6778 \times 7.67 = 51\,987.26\,\mathrm{km^2/s}$, which the program printed to six digits as $51987.3$. Right.

Asking what the imported target holds, with `get_target_property`, gives

```text
-- Eigen3::Eigen: TYPE=INTERFACE_LIBRARY IMPORTED=TRUE includes=/usr/include/eigen3
```

Eigen is header-only, so its target is an INTERFACE library, as lesson 2 said it should be, and its only usage requirement here is the include folder.
:::

### When it goes wrong

Two failures are worth recognizing on sight. Change the minimum version to `5.0`:

```text
CMake Error at CMakeLists.txt:4 (find_package):
  Could not find a configuration file for package "Eigen3" that is compatible
  with requested version "5.0".

  The following configuration files were considered but not accepted:

    /usr/share/eigen3/cmake/Eigen3Config.cmake, version: 3.4.0
```

CMake found Eigen but rejected it, and tells you which file and which version. Now misspell the target as `Eigen3::Eigne`:

```text
CMake Error at CMakeLists.txt:8 (target_link_libraries):
  Target "orbit" links to:

    Eigen3::Eigne

  but the target was not found.  Possible reasons include:

    * There is a typo in the target name.
    * A find_package call is missing for an IMPORTED target.
    * An ALIAS target is missing.
```

That clear error is the reward for the **[[double colon|double-colon]]** in the name. A plain name that is not a target, like `Eigne`, would be passed to the linker as `-lEigne` and fail much later, with a much vaguer message.

::: warning find_package depends on the machine
`find_package` uses whatever is installed. Your laptop has Eigen 3.4.0; a teammate's older system image might have 3.3.9; the build server might have none. The minimum version keeps out anything too old, but nothing keeps two machines on the *same* version. For a flight project that must rebuild the exact same binary, something else has to decide what is installed. That is the job of the other three methods.
:::

## FetchContent: download and build it with your project

`FetchContent` is a CMake module that downloads a dependency's source during configure and adds it to your build as if it were part of your project. Its targets become ordinary targets in your build.

```cmake
include(FetchContent)
FetchContent_Declare(
  fmt
  GIT_REPOSITORY https://github.com/fmtlib/fmt.git
  GIT_TAG        0c9fce2ffefecfdce794e1859584e25877b7b592  # 11.0.2
)
FetchContent_MakeAvailable(fmt)
```

- `FetchContent_Declare` says *what* to get and *which exact version*. It downloads nothing yet.
- `FetchContent_MakeAvailable` downloads it (if not already there) into `build/_deps/fmt-src`, then runs the dependency's own `CMakeLists.txt` as if with `add_subdirectory`. After that, `fmt::fmt` exists.

The `GIT_TAG` line is where the version is pinned. It can name a branch, a tag or a commit. Only two of those are acceptable.

- A **commit hash**, the 40-character name git gives each snapshot, is computed from the snapshot's contents, so it **[[can never point at different code|pin-by-commit]]**. This is the strongest pin.
- A **release tag** such as `11.0.2` is readable, and fine for well-run projects, but a tag can be deleted and re-created pointing elsewhere.
- A **branch** such as `master` moves every time someone pushes. Pinning to a branch means two builds a week apart can get different code. Never do it.

A common habit is the hash, with the tag in a comment, as above: the hash for the machine, the tag for the human.

::: example Fetching fmt, and what it costs
A small telemetry tool prints with fmt:

```cpp fragment
#include <fmt/core.h>

int main() {
    const double altitude_km = 408.0;
    const double speed_km_s = 7.66;
    fmt::print("ISS: {:.0f} km up, {:.2f} km/s\n", altitude_km, speed_km_s);
}
```

```cmake
cmake_minimum_required(VERSION 3.28)
project(uses_fmt LANGUAGES CXX)

include(FetchContent)
FetchContent_Declare(
  fmt
  GIT_REPOSITORY https://github.com/fmtlib/fmt.git
  GIT_TAG        0c9fce2ffefecfdce794e1859584e25877b7b592  # 11.0.2
)
FetchContent_MakeAvailable(fmt)

add_executable(telemetry main.cpp)
target_link_libraries(telemetry PRIVATE fmt::fmt)
target_compile_features(telemetry PRIVATE cxx_std_20)
```

Configuring a fresh build folder:

```text
-- {fmt} version: 11.0.2
-- Build type: 
-- Configuring done (2.9s)
```

The `{fmt} version` line is printed by fmt's own `CMakeLists.txt`, proof that it now runs inside our build. Building:

```text
[ 20%] Building CXX object _deps/fmt-build/CMakeFiles/fmt.dir/src/format.cc.o
[ 40%] Building CXX object _deps/fmt-build/CMakeFiles/fmt.dir/src/os.cc.o
[ 60%] Linking CXX static library libfmt.a
[ 60%] Built target fmt
[ 80%] Building CXX object CMakeFiles/telemetry.dir/main.cpp.o
[100%] Linking CXX executable telemetry
[100%] Built target telemetry
```

```text
ISS: 408 km up, 7.66 km/s
```

Count the cost. Configure took about 3 seconds, mostly the download, and the source copy in `build/_deps/fmt-src` is 23 MB with its git history. Three of the seven build lines are fmt, not our code. And that happens in *every* new build folder: a Debug folder, a Release folder, a sanitizer folder and every fresh CI job (continuous integration: the server that builds every change from scratch) each download and compile fmt again.

For GoogleTest the same measurement on this machine was about 8 seconds of compiling per fresh build folder, because it also builds GoogleMock. Small here; on a project with ten dependencies, and CI jobs that start from nothing, it adds up to minutes per run.
:::

::: key
**FetchContent versus find_package.** FetchContent downloads and builds the dependency as part of your build, which is reproducible and hermetic but rebuilds it for everyone. find_package uses a dependency already installed or provided by a package manager. Large teams usually use find_package with vcpkg or Conan.
:::

**Hermetic** means sealed off: the build uses only what it declares, never whatever happens to be installed on the machine. Together with a pinned commit, that makes FetchContent **reproducible** — anyone, anywhere, configures and gets the same fmt source. The network is needed when you *configure* a fresh build folder, not when the program runs; the finished program contains fmt's compiled code and needs no download.

### The best of both

Since CMake 3.24, one declaration can say "use an installed copy if there is one, otherwise fetch":

```cmake
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        f8d7d77c06936315286eb55f8de22cd23c188571  # v1.14.0
  FIND_PACKAGE_ARGS NAMES GTest   # try find_package(GTest) first
)
FetchContent_MakeAvailable(googletest)
```

On this machine, which has GoogleTest 1.14.0 installed, configuring created no `_deps` folder at all: `find_package(GTest)` succeeded and nothing was downloaded. Configuring again with `-DFETCHCONTENT_TRY_FIND_PACKAGE_MODE=NEVER` forced the download, and `build/_deps/googletest-src` appeared. The test program linked `GTest::gtest_main` and passed both ways. Developers with the package installed skip the cost; a bare CI machine still builds.

::: warning Pin the version, and check what you pinned
A FetchContent line without a pinned commit or tag is a build that changes on its own. Watch for `GIT_TAG main`, `GIT_TAG master`, or a download `URL` with no `URL_HASH SHA256=...` next to it. The hash on a download is what makes CMake refuse a file that is not byte-for-byte the one you checked. Pinning is also a **[[supply-chain defense|supply-chain]]**: code you did not review cannot slip in under a moving name.
:::

## Git submodules: keep the source in your repository's history

A **git submodule** is a pointer, stored in your repository, to one exact commit of another repository, checked out into a folder of yours. A common place for it is `extern/`.

```bash
git submodule add https://github.com/google/googletest.git extern/googletest
git -C extern/googletest checkout f8d7d77c06936315286eb55f8de22cd23c188571
git add extern/googletest
git commit -m "Add GoogleTest v1.14.0 as a submodule"
```

Then in `CMakeLists.txt`:

```cmake
add_subdirectory(extern/googletest)
```

The pin lives in git itself: your commit records the submodule's commit hash, and changing it is a reviewed change like any other. Building needs no network after cloning, which some secure build rooms require.

The costs are human ones. A plain `git clone` leaves `extern/googletest` **[[empty|submodule-empty]]**; everyone must remember `git clone --recurse-submodules`, or `git submodule update --init --recursive` afterwards. Updating is a multi-step chore. And like FetchContent, the dependency is compiled in every build folder, because `add_subdirectory` makes it part of your build.

## Package managers: Conan and vcpkg

A **package manager** is a separate tool that reads a list of dependencies with exact versions, gets each one — often as an already-compiled **binary** from a cache, so nothing is rebuilt — and installs them into a folder. Then it points CMake at that folder, and your `CMakeLists.txt` uses plain `find_package`. The two common ones for C++ are **vcpkg**, from Microsoft, and **Conan**, from JFrog.

With **vcpkg**, the list is a `vcpkg.json` file in your repository:

```json
{
  "dependencies": ["eigen3", "fmt", "gtest"],
  "builtin-baseline": "<a commit of the vcpkg registry>"
}
```

The `builtin-baseline` pins every version at once, to one snapshot of vcpkg's catalog. You configure with vcpkg's **toolchain file**:

```bash
cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake
```

and vcpkg installs what the list asks for during configure.

With **Conan**, the list is a `conanfile.txt`, and Conan is run first:

```text
[requires]
eigen/3.4.0
fmt/11.0.2

[generators]
CMakeDeps
CMakeToolchain
```

```bash
conan install . --output-folder=build --build=missing
cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=build/conan_toolchain.cmake
```

`--build=missing` means "use a pre-built binary if one exists for this compiler and settings, and compile from source only if not". The `CMakeDeps` generator writes config files so that `find_package(fmt)` works.

In both cases the `CMakeLists.txt` is the same one you would write for installed libraries: `find_package` and imported targets. The package manager decides *what* is installed; CMake only finds it. That separation is why large teams use this approach. The compiled dependencies are shared across build folders, machines and CI jobs through a cache, and the version list is one reviewed file. The price is one more tool to install, learn and keep running.

## Choosing

| | find_package on the system | FetchContent | Submodule | Conan or vcpkg |
|---|---|---|---|---|
| Where the version is pinned | nowhere; whatever is installed | `GIT_TAG` hash or `URL_HASH` | the commit in your repository | lockfile or baseline |
| Network needed | no | on each fresh configure | on clone | on install, unless cached |
| Rebuilds the dependency per build folder | no | yes | yes | no, uses binaries |
| Extra tool | no | no | no | yes |
| Good for | quick local work, system libraries | small projects, a few light dependencies | offline or air-gapped builds | teams, many or heavy dependencies |

::: note Why the target-based style makes switching cheap
In all four columns, the line that uses the dependency is the same: `target_link_libraries(gnc PUBLIC Eigen3::Eigen)`. Only *how the target comes to exist* differs — `find_package`, `FetchContent_MakeAvailable` or `add_subdirectory`. So a project can start with FetchContent and move to vcpkg later by changing a few lines at the top, without touching a single target. That is the payoff of lessons 2 and 3: a dependency is a target with usage requirements, wherever it came from.
:::

## Check yourself

::: check
`find_package(fmt 10 REQUIRED CONFIG)` fails on a teammate's machine, although fmt 10.2 is installed under `/opt/fmt-10.2`. Give two ways to make CMake find it without editing `CMakeLists.txt`.
:::

::: answer
`/opt/fmt-10.2` is not one of the system prefixes, so CMake never looked there. Tell it where to look, on the configure command line:

1. Add the install prefix to the search list: `cmake -S . -B build -DCMAKE_PREFIX_PATH=/opt/fmt-10.2`. CMake then tries the standard subfolders, such as `/opt/fmt-10.2/lib/cmake/fmt/`.
2. Point straight at the folder holding the config file: `-Dfmt_DIR=/opt/fmt-10.2/lib/cmake/fmt`.

The first is usually better, because one prefix can serve several packages installed there.
:::

::: check
A `CMakeLists.txt` contains `FetchContent_Declare(json GIT_REPOSITORY https://github.com/nlohmann/json.git GIT_TAG develop)`. What is wrong, and what would you write instead?
:::

::: answer
`develop` is a branch, and a branch moves with every push. Two engineers configuring on different days can get different code, and a build from last month can no longer be repeated. That defeats the reason for using FetchContent.

Pin a specific commit hash, with the release it belongs to in a comment:

```cmake
GIT_TAG <40-character commit hash>  # v3.11.3
```

A release tag alone is acceptable for a trusted, well-run project, but the hash is the stronger pin because it cannot be re-pointed.
:::

::: check
A project uses FetchContent for six libraries. CI starts every job in a fresh container and takes 14 minutes, of which 9 are spent compiling those dependencies. What change would you propose, and what would the `CMakeLists.txt` look like afterwards?
:::

::: answer
The cost is the one FetchContent always carries: each fresh build folder downloads and compiles every dependency again. Move the dependencies to a package manager such as vcpkg or Conan with a binary cache, so CI downloads already-compiled libraries instead of compiling them. The versions stay pinned in `vcpkg.json` or `conanfile.txt` (plus a lockfile).

The `CMakeLists.txt` replaces each `FetchContent_Declare`/`FetchContent_MakeAvailable` pair with a `find_package(... REQUIRED)`. The `target_link_libraries` lines do not change, as long as the imported target names match. A smaller step is to add `FIND_PACKAGE_ARGS` to each declaration and pre-install the libraries in the CI image.
:::

::: check
After `git clone` of a project that uses submodules, configuring fails with an error from `add_subdirectory` saying the source directory `…/extern/googletest` does not contain a `CMakeLists.txt` file. What happened, and what is the fix?
:::

::: answer
A plain `git clone` records the submodules but does not check them out, so the folder `extern/googletest` exists but is empty. Fetch the pinned commit of every submodule:

```bash
git submodule update --init --recursive
```

or clone with `git clone --recurse-submodules` next time. Many projects also add a check to their top-level `CMakeLists.txt` that prints this exact command when the folder is empty.
:::

::: check
Why is `Eigen3::Eigen` safer to write in `target_link_libraries` than `eigen3`?
:::

::: answer
A name with `::` in it can only mean a target (an imported or alias target). If it does not exist — because of a typo or a missing `find_package` — CMake stops at generate time with an error that names it and lists likely causes.

A plain name like `eigen3` that is not a target is taken to be a library file, and is passed to the linker as `-leigen3`. The mistake then surfaces much later, as a linker error, or, since Eigen is header-only, as a missing-header error in some file, with nothing pointing back to the real cause.
:::

## Summary

| Idea | Meaning | Example |
|---|---|---|
| Dependency | a library your project needs but did not write | Eigen, fmt, GoogleTest |
| `find_package` | find an installed package, get its imported targets | `find_package(Eigen3 3.3 REQUIRED NO_MODULE)` |
| Config package | library installs its own `<Name>Config.cmake` | `/usr/share/eigen3/cmake/Eigen3Config.cmake` |
| Find module | `Find<Name>.cmake` search script by someone else | used when no config file exists |
| Imported target | stands for an installed library, carries its requirements | `Eigen3::Eigen` |
| Search hints | where to look | `CMAKE_PREFIX_PATH`, `<Name>_DIR` |
| FetchContent | download and build with your project | `FetchContent_Declare` + `FetchContent_MakeAvailable` |
| Pin | exact version that cannot move | commit hash; tag in a comment; `URL_HASH` |
| Try installed first | `FIND_PACKAGE_ARGS` (CMake 3.24+) | skips the download when installed |
| Submodule | exact commit of another repository in yours | `extern/googletest` + `add_subdirectory` |
| Package manager | installs pinned, often pre-built dependencies | vcpkg `vcpkg.json`, Conan `conanfile.txt` |

With targets, usage requirements and dependencies in hand, lesson 6, *Project layout and CTest*, arranges a real project into `apps`, `cmake`, `extern`, `include`, `src` and `tests`, and registers tests so one command runs them all.

::: context imported-target A target for something already built
An ordinary target is a recipe: CMake knows its sources and writes build rules for it. An imported target has no recipe. It only records where an existing file or header folder is and what a consumer needs to use it. CMake never builds it; it only links it and passes its usage requirements along.

Config files create imported targets for you. You rarely write one by hand, but you use them constantly: `Eigen3::Eigen`, `GTest::gtest_main`, `fmt::fmt` and, after lesson 10, `gnc::gnc`.
:::

::: context search-order How find_package walks its list
For a config package, CMake tries places in order and stops at the first acceptable config file. Simplified:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="12" width="200" height="30" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="120" y="32" font-size="12" fill="#1f2a44" text-anchor="middle">1. Name_DIR, if already set</text>
  <rect x="20" y="56" width="200" height="30" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="120" y="76" font-size="12" fill="#1f2a44" text-anchor="middle">2. CMAKE_PREFIX_PATH</text>
  <rect x="20" y="100" width="200" height="30" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="120" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">3. system: /usr/local, /usr</text>
  <rect x="20" y="144" width="200" height="30" rx="5" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="120" y="164" font-size="12" fill="#b4232c" text-anchor="middle">not found: error if REQUIRED</text>
  <line x1="120" y1="42" x2="120" y2="51" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="120,56 116,49 124,49" fill="#1f2a44"/>
  <line x1="120" y1="86" x2="120" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="120,100 116,93 124,93" fill="#1f2a44"/>
  <line x1="120" y1="130" x2="120" y2="139" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="120,144 116,137 124,137" fill="#1f2a44"/>
  <text x="235" y="62" font-size="11" fill="#6c7a93">under each prefix try</text>
  <text x="235" y="78" font-size="11" fill="#6c7a93">lib/cmake/name/</text>
  <text x="235" y="94" font-size="11" fill="#6c7a93">share/name/cmake/</text>
  <text x="235" y="110" font-size="11" fill="#6c7a93">and a few more</text>
</svg>
```

The real list has more steps, such as environment variables and a per-user package registry, but these three are the ones you steer.
:::

::: context double-colon Why target names have two colons
In CMake a name containing `::` is reserved for imported and alias targets. That rule turns a typo into a clear error: if `Foo::Bar` is not a known target, it cannot be anything else, so CMake stops and says so.

The part before the colons is a **namespace**, usually the package name, so two packages can both have a target called `core` without clashing. Well-behaved projects also create an alias with the same name for in-tree use — `add_library(gnc::gnc ALIAS gnc)` — so consumers write `gnc::gnc` whether they got it from `find_package` or `add_subdirectory`.
:::

::: context pin-by-commit Why a tag can move and a commit cannot
A git commit's name is a hash computed from its entire contents and history. Change one byte and the hash changes, so a hash always means the same code. A tag or branch is only a label stuck on some commit, and labels can be moved.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="330" y2="80" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="60" cy="80" r="10" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="140" cy="80" r="10" fill="#1d6fd1" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="220" cy="80" r="10" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="300" cy="80" r="10" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="140" y="112" font-size="11" fill="#1d6fd1" text-anchor="middle">0c9fce2f…</text>
  <text x="140" y="127" font-size="11" fill="#1d6fd1" text-anchor="middle">fixed forever</text>
  <rect x="100" y="22" width="80" height="24" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">tag 11.0.2</text>
  <line x1="140" y1="46" x2="140" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="22" width="80" height="24" rx="4" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">branch master</text>
  <line x1="300" y1="46" x2="300" y2="68" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="112" font-size="11" fill="#b4232c" text-anchor="middle">moves with</text>
  <text x="300" y="127" font-size="11" fill="#b4232c" text-anchor="middle">every push</text>
</svg>
```

A tag usually stays put, but it *can* be deleted and re-created. The hash cannot.
:::

::: context supply-chain Other people's code is part of your flight software
Every dependency you pull in ends up inside your program, so a change to it is a change to your software. In March 2024 an engineer noticed that release downloads of the compression library xz, versions 5.6.0 and 5.6.1, contained a hidden backdoor aimed at SSH servers. It had been slipped in by a trusted maintainer and was caught only because a login was half a second slower than expected.

Pinning by commit hash or download hash does not make code trustworthy, but it guarantees you get exactly the code you reviewed, not whatever a name points to today.
:::

::: context submodule-empty Why a fresh clone has empty submodule folders
Your repository does not contain the submodule's files. It contains a small record: "folder `extern/googletest` should hold commit `f8d7d77…` of this URL", plus a `.gitmodules` file listing the URLs. A plain `git clone` copies only your repository, so the folder exists but is empty.

`git submodule update --init` reads the record, clones each listed repository and checks out exactly that commit. The `--recursive` flag repeats this for submodules inside submodules.
:::
