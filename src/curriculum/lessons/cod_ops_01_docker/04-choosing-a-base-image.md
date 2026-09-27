---
id: l04-choosing-a-base-image
title: Choosing a base image, and the Alpine trap
minutes: 19
covers:
  - 'Base-image choice: debian-slim vs alpine and the musl trap for scientific Python'
---

Think about buying a pair of shoes online. One pair weighs 200 grams and the other weighs 350 grams. The light pair sounds better, until you notice it only comes in sizes nobody on your team wears. You can have them made to measure, but that takes weeks, and the shoemaker may not use quite the same materials. The heavy pair fits everyone today.

Picking a base image is the same trade. Every Dockerfile starts with `FROM`, and the image you name there is the floor your whole environment stands on. Two families of small bases are everywhere: **Debian slim**, a trimmed-down Debian Linux, and **Alpine**, a tiny Linux built for size. Alpine is often less than half the size. For a web server written in Go, that can be a fine choice. For scientific Python — NumPy, SciPy, the tools a GNC team runs its Monte Carlo campaigns with — it hides a trap, and this lesson is about exactly where the trap is and how to step around it.

Everything below was run with Docker 29.3.1 on an x86-64 Linux machine in September 2026. The sizes, timings and file names are copied from the real terminal.

## What a base image gives you

A **base image** is the image named in `FROM`: the ready-made starting point your own layers go on top of. It supplies three things.

- A set of **operating-system files**: the shell, the package manager, the basic command-line tools.
- A **[[C standard library|c-standard-library]]** (often shortened to **libc**): the shared library that almost every compiled program calls to open files, allocate memory, print text and do math.
- Often a language runtime on top, such as the Python interpreter in `python:3.12-slim`.

Of these three, the C library matters most, and it is the one people forget to check. Your Python code does not call it directly. But NumPy is written largely in C, the Python interpreter is written in C, and every compiled piece of them was built against one particular C library. A compiled program built against one C library generally will not run on a system that has only a different one.

Linux has two C libraries you will meet in containers:

- **glibc**, the GNU C Library. Debian, Ubuntu, Red Hat and nearly every desktop and server Linux use it.
- **musl** (pronounced "muscle"), a small, clean C library written from scratch. Alpine uses it, together with **[[BusyBox|busybox]]** for its command-line tools.

Both are good pieces of software. They are not interchangeable for compiled code.

## Debian slim and Alpine side by side

Here is how to ask each image which C library it carries. `ldd` is a tool that lists the shared libraries a program needs; asked for its version, it also reports which C library it belongs to.

```bash
docker run --rm python:3.12-slim   sh -c 'ldd --version | head -1; head -1 /etc/os-release'
docker run --rm python:3.12-alpine sh -c 'ldd 2>&1 | head -2; head -1 /etc/os-release'
```

```text
ldd (Debian GLIBC 2.41-12+deb13u4) 2.41
PRETTY_NAME="Debian GNU/Linux 13 (trixie)"
musl libc (x86_64)
Version 1.2.6
NAME="Alpine Linux"
```

The slim image is Debian 13, code-named **[[trixie|debian-codenames]]**, with glibc 2.41. The Alpine image has musl 1.2.6. Same Python, 3.12.14, in both. Different floor.

::: example How big is each floor?
Measure the unpacked size of each image's files with `du -sxm /`, which adds up every file on the container's root filesystem, in mebibytes (1 MiB is $1\,048\,576$ bytes). Then install the same NumPy and SciPy into each and measure again.

```bash
docker run --rm python:3.12-slim sh -c '
  du -sxm / | tail -1
  pip install -q --no-cache-dir numpy==2.5.3 scipy==1.18.1
  du -sxm / | tail -1'
```

The same commands in `python:3.12-alpine` give the second column:

| | `python:3.12-slim` | `python:3.12-alpine` |
| --- | --- | --- |
| Bare image | 125 MiB | 53 MiB |
| With NumPy 2.5.3 and SciPy 1.18.1 | 341 MiB | 282 MiB |

Now work the comparison.

- Bare: $125 - 53 = 72$ MiB saved, and $125 / 53 \approx 2.36$. Alpine is less than half the size.
- With the science stack: $341 - 282 = 59$ MiB saved, and $341 / 282 \approx 1.21$. Alpine is about 17% smaller.

The saving shrank from "less than half" to "about a sixth", because NumPy and SciPy bring their own large compiled libraries, and those are about the same size on either floor. For a scientific image, the base is a small part of the total. Sanity check: both images grew by about 216 to 229 MiB for the same two packages, which is what you would expect if the packages dominate.
:::

The size win of Alpine is real for tiny programs. For the images a simulation team builds, it is modest. So the next question is what that modest saving costs.

## Wheels: prebuilt packages with a label

When you run `pip install numpy`, pip does not normally compile NumPy. It downloads a **wheel**: a zip file with the extension `.whl` holding the package already compiled, ready to unpack. A wheel's file name is a label saying exactly which computers it fits. Here are the two NumPy wheels pip picked on the two images:

```text
numpy-2.5.3-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl
numpy-2.5.3-cp312-cp312-musllinux_1_2_x86_64.whl
```

Read the **[[wheel file name|wheel-name]]** from left to right: the package, its version, the Python it was built for (`cp312` is CPython 3.12), and at the end the **platform tag** — the kind of system it runs on.

- **manylinux** wheels are built against glibc. The tag `manylinux_2_28_x86_64` means "runs on any x86-64 Linux whose glibc is version 2.28 or newer". The name comes from the goal of [[one wheel for many Linux distributions|manylinux-name]].
- **musllinux** wheels are built against musl. `musllinux_1_2_x86_64` means "musl 1.2 or newer, on x86-64".

Pip keeps a list of platform tags the running system accepts, and it only downloads a wheel whose tag is on the list. You can see the list with `pip debug --verbose`:

```text
# python:3.12-slim (first lines of the list)
  cp312-cp312-manylinux_2_41_x86_64
  cp312-cp312-manylinux_2_40_x86_64
  cp312-cp312-manylinux_2_39_x86_64

# python:3.12-alpine (first lines of the list)
  cp312-cp312-musllinux_1_2_x86_64
  cp312-cp312-musllinux_1_1_x86_64
  cp312-cp312-musllinux_1_0_x86_64
```

On the Debian image, only manylinux tags appear. On Alpine, only musllinux tags. A manylinux wheel is never used on Alpine, however new it is.

::: key Why Alpine is a trap for scientific Python
Alpine uses musl libc, so manylinux wheels for NumPy/SciPy do not apply and pip falls back to building from source, which is slow, fragile, and can link a different BLAS. Use debian-slim unless you have measured a reason not to.
:::

The key's first half is always true: manylinux wheels never apply on Alpine. The second half — "falls back to building from source" — happens whenever the project has not also published a musllinux wheel for your exact Python and processor. That is the next section.

## When there is no wheel: the fallback to source

If pip finds no wheel whose tag fits, it does not give up. It downloads the **[[source distribution|sdist]]** — the package's raw source code — and tries to compile it on the spot. For a scientific package, compiling means C, C++ and sometimes Fortran compilers, the Python header files, and math libraries such as **[[BLAS and LAPACK|blas-lapack]]**, the standard routines for vector and matrix arithmetic.

The Alpine Python image has none of those tools. Here is what happens with an older NumPy release, 1.24.4, pinned in a lockfile somewhere, on Python 3.11:

::: example The same pin on two floors
On Debian slim, with the time taken measured by the shell's `time`:

```bash
docker run --rm python:3.11-slim bash -c 'time pip install numpy==1.24.4'
```

```text
real 0m4.561s
```

About four and a half seconds: pip found a manylinux wheel, downloaded it and unpacked it.

On Alpine, the same command:

```bash
docker run --rm python:3.11-alpine sh -c 'time pip install numpy==1.24.4'
```

```text
Collecting numpy==1.24.4
  Downloading numpy-1.24.4.tar.gz (10.9 MB)
Building wheels for collected packages: numpy
...
      RuntimeError: Broken toolchain: cannot link a simple C program.
...
ERROR: Failed building wheel for numpy
real 0m 16.47s
```

Read it line by line. `numpy-1.24.4.tar.gz` is the source archive, not a wheel: NumPy's first musllinux wheels came with the 1.25 series, so for 1.24.4 there was none to take. Pip then tried to build, found no C compiler, and failed after about 16 seconds.

On a real team the next step is to add compilers and libraries to the Dockerfile with Alpine's package manager, `apk`, and try again. The build then really does compile NumPy's C code, which takes minutes where the wheel took seconds, and it repeats every time that layer's cache is invalidated.
:::

So does the trap still bite in 2026, now that NumPy and SciPy publish musllinux wheels? Asking pip directly, on Python 3.12 for x86-64, with `pip download --only-binary=:all:` (which refuses anything but a wheel):

| Package | Wheel on Debian slim | Wheel on Alpine |
| --- | --- | --- |
| numpy 2.5.3 | manylinux | musllinux |
| scipy 1.18.1 | manylinux | musllinux |
| pandas 3.0.6 | manylinux | musllinux |
| matplotlib 3.11.2 | manylinux | musllinux |
| h5py 3.16.0 | manylinux | musllinux |
| astropy 8.0.1 | manylinux | musllinux |
| scikit-learn 1.9.1 | manylinux | none |
| numba 0.67.0 and llvmlite 0.49.0 | manylinux | none |
| netCDF4 1.7.4 | manylinux | none |
| casadi 3.8.1 | manylinux | none |

The core is covered. The edges are not. Numba, which many teams use to speed up their dynamics loops, has no Alpine wheel. Neither does CasADi, a popular optimisation toolkit for trajectory and control problems. Neither does netCDF4, the reader for a common atmosphere and weather data format. A requirements file with thirty packages only needs one of these to send the whole build down the from-source road. And an older pinned version — exactly what a reproducibility lockfile contains — may predate a project's first musllinux wheel, as NumPy 1.24.4 did.

::: warning A table like this goes out of date
Which packages ship musllinux wheels changes with every release. Do not trust this table, or any blog post, for your own project. Run `pip download --only-binary=:all: -r requirements.txt` inside the base image you are considering. If it fails, you have found your from-source packages before they cost you a build.
:::

## Why a source build is worse than slow

Slowness is the obvious cost. Three quieter ones matter more to a simulation team.

**Fragile.** A source build needs the right compiler version, the right header files and the right libraries, all present in the image. A new release of any of them can break the build months after it last worked, with an error deep in someone else's C code.

**A different BLAS.** A manylinux NumPy wheel carries its own copy of OpenBLAS, a fast implementation of BLAS, built and tested by the NumPy team. A source build links whatever BLAS it finds on the system. That may be a different library, a different version, or a slow reference one. Matrix products and linear solves then run at a different speed, and may round their last digits differently, because the order of additions inside a matrix multiply is up to the library.

**Different math underneath.** Even with the same NumPy, musl's math library and glibc's are separate implementations of `sin`, `exp` and friends. Both aim to be accurate, but they are [[not guaranteed to agree to the last bit|last-bit-math]]. A result you validated on one may differ in the last digits on the other.

None of this means Alpine is broken. It means an Alpine image is a different platform from the Debian one your laptop, your CI runner and most of the scientific Python world test on.

::: key Base-image rule of thumb
For scientific Python and compiled simulation code, start from a Debian slim image (for example `python:3.12-slim`). Pick Alpine only when you have measured a real benefit and checked that every dependency has a musllinux wheel for your exact Python version and processor.
:::

## Other floors worth knowing

Debian slim and Alpine are the two you will meet most, but not the only ones.

- **Full Debian or Ubuntu images** (`python:3.12`, `ubuntu:24.04`): bigger, with more tools preinstalled. Good for build stages, where size does not matter because the stage is thrown away (lesson 3's multi-stage builds).
- **Compiler images** such as `gcc:14`: the full toolchain, over 2 GB. Build stages only.
- **[[Distroless|distroless]] images**: only your program's runtime and its libraries, with no shell and no package manager. Small and hard to attack, but you cannot open a shell inside to look around, so they suit a finished service more than a research image.
- **Plain `debian:bookworm-slim` or `debian:trixie-slim`**: the floor for a C++ simulator's runtime stage. On x86-64 they unpack to 82 MiB and 84 MiB.

Whichever you pick, write the Debian release into the tag: `python:3.12-slim-bookworm`, not only `python:3.12-slim`. A tag without it moves to the next Debian release when one comes out, and your glibc version moves with it. Lesson 6 takes that idea all the way.

## Check yourself

::: check
A wheel is named `scipy-1.18.1-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`. Name every piece of the label, and say whether pip will use it on (a) a Debian 12 image with glibc 2.36, (b) an Alpine image, (c) a Debian slim image running Python 3.11.
:::

::: answer
`scipy` is the package, `1.18.1` its version, `cp312` means CPython 3.12 (twice: the interpreter tag and the binary-interface tag), and `manylinux_2_27_x86_64.manylinux_2_28_x86_64` is the platform: x86-64 Linux with glibc 2.27 or newer (the file carries two equivalent tags). (a) Yes: glibc 2.36 is newer than 2.28, and it is CPython 3.12 on x86-64. (b) No: Alpine has musl, and a manylinux tag is never on its list. (c) No: the wheel is for Python 3.12, and pip on 3.11 accepts only `cp311` (or version-independent) tags, so it will look for another wheel or fall back to source.
:::

::: check
A colleague says "NumPy has had Alpine wheels since 1.25, so the musl problem is solved". Give two reasons that is not enough for a real simulation image.
:::

::: answer
First, the image contains more than NumPy. Any one dependency without a musllinux wheel — for Python 3.12 on x86-64 in 2026 that included Numba, llvmlite, scikit-learn, netCDF4 and CasADi — sends pip back to building from source. Second, a reproducibility lockfile often pins older versions, and an older release may predate the project's first musllinux wheel (NumPy 1.24.4 has none). A third reason: even when every wheel exists, musl and glibc have different math libraries, so results validated on one platform may differ in the last digits on the other.
:::

::: check
Your image is `python:3.12-slim` plus NumPy, SciPy and pandas. Someone proposes switching to Alpine "to halve the image size". Using this lesson's measurements, what saving should they actually expect, and what would you ask them to check first?
:::

::: answer
The bare bases differ by about 72 MiB (125 versus 53), but once NumPy and SciPy are installed the images were 341 MiB and 282 MiB, a saving of about 59 MiB, or 17%, not a half. Before switching, they should run `pip download --only-binary=:all: -r requirements.txt` inside the Alpine image to prove every package has a musllinux wheel at the pinned versions, and then rerun the validation cases, because the math library and possibly the BLAS change.
:::

::: check
Why can a from-source NumPy build give different last digits from the wheel, even with the same NumPy version and the same input?
:::

::: answer
The wheel ships its own OpenBLAS, built by the NumPy team. A source build links whatever BLAS the system provides, which may be a different implementation or version. Matrix operations add many numbers together, and different libraries add them in different orders or with different machine instructions. Floating-point addition is not exactly associative, so a different order can round the last digits differently. On top of that, musl and glibc have separate math libraries, which are not guaranteed to agree to the last bit.
:::

::: check
Why is `python:3.12-slim-bookworm` a better `FROM` line than `python:3.12-slim` for a project that must keep working for years?
:::

::: answer
`python:3.12-slim` means "the current Debian release", and it moves when Debian releases a new version: today it is Debian 13 (trixie) with glibc 2.41. Writing `bookworm` in the tag keeps the operating system and its glibc on one release line, so a rebuild does not silently change the floor. It is still a moving tag — Debian and Python patch updates arrive under it — which is why lesson 6 pins by digest as well.
:::

## Summary

| Idea | Meaning | Fact to remember |
| --- | --- | --- |
| Base image | The image in `FROM` | Supplies OS files, the C library, often a runtime |
| glibc | GNU C Library | Debian, Ubuntu; `python:3.12-slim` has 2.41 |
| musl | Small C library | Alpine; `python:3.12-alpine` has 1.2.6 |
| Wheel | Prebuilt `.whl` package | Platform tag at the end of the name |
| manylinux | Wheel built on glibc | `manylinux_2_28` = glibc 2.28 or newer |
| musllinux | Wheel built on musl | Only these work on Alpine |
| sdist fallback | No matching wheel | Pip compiles from source: slow, fragile, maybe a different BLAS |
| Size | Bare vs with NumPy + SciPy | 125 vs 53 MiB bare; 341 vs 282 MiB with the stack |
| Rule | For scientific Python | Debian slim, with the release named in the tag |

The next lesson moves from the floor to the rooms: how a container keeps data after it is removed, how containers talk to each other and to your browser, and how `docker compose` starts a simulation, a database and a dashboard together.

::: context c-standard-library The library under everything
Almost every program written in C, C++ or Rust on Linux leans on one shared library for the everyday jobs: opening a file, asking for memory, printing text, computing a square root. That library is the C standard library. The Linux kernel does the real work; the C library is the polite front desk that turns a program's request into the kernel's language.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="10" width="280" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="13" text-anchor="middle" fill="#1f2a44">your_sim.py</text>
  <rect x="40" y="48" width="280" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="68" font-size="13" text-anchor="middle" fill="#1f2a44">Python interpreter, NumPy (compiled C)</text>
  <rect x="40" y="86" width="280" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="106" font-size="13" text-anchor="middle" fill="#1f2a44">C library: glibc or musl</text>
  <rect x="40" y="124" width="280" height="30" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="144" font-size="13" text-anchor="middle" fill="#ffffff">Linux kernel (shared with the host)</text>
  <text x="180" y="176" font-size="12" text-anchor="middle" fill="#b4232c">the orange layer comes from the base image</text>
</svg>
```

Because the kernel is shared but the C library lives in the image, the base image decides which C library your code meets.
:::

::: context busybox One program pretending to be hundreds
BusyBox is a single small program that contains simplified versions of `ls`, `cp`, `sh`, `grep` and hundreds of other commands. Each command name is a link to the same file, and BusyBox looks at the name it was called by to decide what to do. That trick is a big part of why Alpine is so small. It also means some commands accept fewer options than the GNU versions on Debian, so a shell script that works on your laptop can fail inside an Alpine image.
:::

::: context debian-codenames Why Debian releases have Toy Story names
Every Debian release has a code name taken from a character in the *Toy Story* films: Debian 12 is "bookworm" and Debian 13 is "trixie". The names are handy in image tags because they say exactly which release line you mean. `python:3.12-slim-bookworm` stays on Debian 12 while `python:3.12-slim` follows whatever Debian release is current.
:::

::: context wheel-name Reading a wheel's label
A wheel's name is a fixed sequence of fields separated by dashes. Reading it tells you, without opening the file, whether pip on your system will accept it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="8" y="38" font-size="11" fill="#1f2a44" font-family="monospace" textLength="317">numpy-2.5.3-cp312-cp312-musllinux_1_2_x86_64.whl</text>
  <line x1="8" y1="48" x2="41" y2="48" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="48" y1="48" x2="81" y2="48" stroke="#6c7a93" stroke-width="3"/>
  <line x1="87" y1="48" x2="120" y2="48" stroke="#1f2a44" stroke-width="3"/>
  <line x1="127" y1="48" x2="160" y2="48" stroke="#1f2a44" stroke-width="3"/>
  <line x1="166" y1="48" x2="298" y2="48" stroke="#b4232c" stroke-width="3"/>
  <text x="24" y="72" font-size="11" text-anchor="middle" fill="#1d6fd1">package</text>
  <text x="64" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">version</text>
  <text x="123" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">Python 3.12 (twice)</text>
  <text x="232" y="92" font-size="11" text-anchor="middle" fill="#b4232c">platform tag:</text>
  <text x="232" y="110" font-size="11" text-anchor="middle" fill="#b4232c">musl 1.2 or newer, x86-64</text>
</svg>
```

The two Python fields are the interpreter and its binary interface. A wheel marked `abi3` works on several Python versions at once.
:::

::: context manylinux-name One wheel for many Linux distributions
Before manylinux, a package author would have needed a separate Linux wheel for Debian, for Red Hat, for Ubuntu and so on. The manylinux standard, first agreed by the Python community in 2016, fixed a small set of system libraries a wheel may rely on and required everything else to be bundled inside the wheel. Build on an old glibc, and the wheel runs on every newer one, because glibc keeps old interfaces working. The later musllinux standard applies the same idea to musl.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,60 330,55 330,65" fill="#1f2a44"/>
  <rect x="169" y="50" width="161" height="20" fill="#8fb8f0" stroke="none" opacity="0.6"/>
  <line x1="169" y1="40" x2="169" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="169" y="32" font-size="11" text-anchor="middle" fill="#b4232c">wheel built on glibc 2.28</text>
  <line x1="50" y1="54" x2="50" y2="66" stroke="#1f2a44" stroke-width="2"/>
  <text x="50" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">2.17</text>
  <line x1="256" y1="54" x2="256" y2="66" stroke="#1f2a44" stroke-width="2"/>
  <text x="256" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">2.36</text>
  <text x="256" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">bookworm</text>
  <line x1="310" y1="54" x2="310" y2="66" stroke="#1f2a44" stroke-width="2"/>
  <text x="310" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">2.41</text>
  <text x="310" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">trixie</text>
  <text x="230" y="114" font-size="11" text-anchor="middle" fill="#1d6fd1">runs on every glibc in the blue zone</text>
  <text x="50" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">too old</text>
</svg>
```
:::

::: context sdist Source distribution
A source distribution, or sdist, is a package's source code packed as a `.tar.gz` archive, with instructions for building it. It is the universal fallback: it can in principle be built anywhere, as long as the build machine has every compiler and library the package needs. For a pure-Python package that is nothing special. For NumPy it is a real compile of a large C and C++ code base, and SciPy adds Fortran on top.
:::

::: context blas-lapack The math engine under NumPy
BLAS (Basic Linear Algebra Subprograms) is a standard set of routines for vector and matrix arithmetic, such as a dot product or a matrix multiply. LAPACK sits on top and solves linear systems, finds eigenvalues and does matrix factorisations. Both started as Fortran libraries decades ago; today several fast implementations exist, such as OpenBLAS and Intel's MKL. When you call `numpy.linalg.solve` or multiply matrices with `@`, NumPy hands the work to whichever BLAS and LAPACK it was linked with. Swap the library and you can change both speed and the last digits of the answer.
:::

::: context last-bit-math Two correct answers that differ
Most real numbers cannot be stored exactly in a 64-bit float, so a math library must round. The C standard does not require `sin` or `exp` to return the exact nearest float, so two good libraries can round a hard case differently, by one unit in the last place. That is about one part in $10^{16}$. It sounds harmless, but a simulation that runs a million steps can amplify it, and a hash of the output will certainly notice. Lesson 6 is about controlling everything that can move those last bits.
:::

::: context distroless No shell, on purpose
"Distroless" images, a name made popular by a set of images Google publishes, contain only what your program needs at run time: the C library, certificates, time-zone data, and your program. There is no shell, no package manager and no `ls`. An attacker who gets in finds very few tools. The price is debugging: you cannot `docker exec` a shell into it, so teams usually keep a normal slim image for development and use distroless only for finished services.
:::
