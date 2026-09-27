---
id: l05-wheels-and-sdists
title: Wheels, source distributions and manylinux
minutes: 24
covers:
  - Wheels versus source distributions; manylinux
---

Think about buying a bookshelf. One store sells it **flat-packed**: a box of boards, screws and an instruction sheet. You need a screwdriver, some floor space and an hour, and if a screw is missing you are stuck. Another store delivers it **already built**. It goes straight into the room, ready to use, in a minute. But the built one has a catch: it was made to a fixed size, so the store has to know it will fit through your door.

Python packages ship the same two ways. A **source distribution**, or **sdist**, is the flat-pack box: your source files and the instructions to build them. A **wheel** is the built bookshelf: a finished archive that pip can drop into place without building anything. For pure Python code, the "assembly" is quick and the result fits every door. For code with compiled C, C++ or Fortran inside it, assembly needs a compiler, can take many minutes, and the result fits only one kind of computer.

That second case is the whole scientific stack. NumPy, SciPy and the flight-dynamics libraries built on them are full of compiled code. If every engineer's laptop, CI runner and simulation container had to compile them from source, installs would take ages and fail on any machine without the right compilers. This lesson shows what is inside each kind of archive, how a wheel's file name says which computers it fits, and what **manylinux** means — the trick that lets one Linux wheel install on almost every Linux machine.

## Two boxes from one command

In the last lesson you met the build backend: the tool that turns a project folder into something installable. The front-end command that drives it is `python -m build`. Run it in the `gnc-toolkit` project from the previous lessons:

```text
$ python -m build
* Creating isolated environment: venv+pip...
* Building sdist...
* Building wheel from sdist
* Creating isolated environment: venv+pip...
* Building wheel...
Successfully built gnc_toolkit-0.1.0.tar.gz and gnc_toolkit-0.1.0-py3-none-any.whl
```

(The output is trimmed.) Two files land in `dist/`, and together they are about 3.7 kB:

```text
$ ls -l dist
-rw-r--r-- 1 you you 2082 gnc_toolkit-0.1.0-py3-none-any.whl
-rw-r--r-- 1 you you 1619 gnc_toolkit-0.1.0.tar.gz
```

Notice the line `Building wheel from sdist`. The build tool first makes the sdist, then unpacks it into a temporary folder and builds the wheel from *that*. It is a deliberate test: if the sdist lacks a file the build needs, the wheel build fails here, on your machine, not on a stranger's.

### What is in the sdist

The sdist is a **[[tarball|tarball]]** — a `.tar.gz` archive, the Unix world's usual zip file. List it:

```text
$ tar tzf dist/gnc_toolkit-0.1.0.tar.gz
gnc_toolkit-0.1.0/PKG-INFO
gnc_toolkit-0.1.0/README.md
gnc_toolkit-0.1.0/pyproject.toml
gnc_toolkit-0.1.0/setup.cfg
gnc_toolkit-0.1.0/src/gnc/__init__.py
gnc_toolkit-0.1.0/src/gnc/constants.py
gnc_toolkit-0.1.0/src/gnc/data/earth.json
gnc_toolkit-0.1.0/src/gnc/orbits.py
gnc_toolkit-0.1.0/tests/test_constants.py
...
```

It looks like your project folder: the `pyproject.toml`, the `src/` tree, the README, even the tests. `PKG-INFO` holds the package's metadata. To install from it, a machine must unpack it, run the build backend named in `pyproject.toml`, and produce a wheel. Only then can it install.

### What is in the wheel

The wheel is a plain **zip** file with a `.whl` ending:

```text
$ python -m zipfile -l dist/gnc_toolkit-0.1.0-py3-none-any.whl
File Name                                        Size
gnc/__init__.py                                    41
gnc/constants.py                                  184
gnc/orbits.py                                     228
gnc/data/earth.json                                70
gnc_toolkit-0.1.0.dist-info/METADATA              165
gnc_toolkit-0.1.0.dist-info/WHEEL                  91
gnc_toolkit-0.1.0.dist-info/top_level.txt           4
gnc_toolkit-0.1.0.dist-info/RECORD                597
```

No `pyproject.toml`, no `src/`, no tests. The files are already arranged exactly as they will sit in site-packages: a `gnc/` folder, and next to it a `.dist-info` folder of metadata. Installing a wheel is, at heart, unzipping it into the right place.

::: key Wheel versus sdist
A wheel is a prebuilt, installable archive; an sdist is the source that must be built on the target. Wheels install fast and avoid needing a compiler, which is why the scientific stack ships manylinux wheels.
:::

## Inside the wheel's metadata

Three files in `.dist-info` do the work.

**`METADATA`** holds the facts from your `[project]` table: name, version, required Python version, dependencies and the README text.

```text
Metadata-Version: 2.4
Name: gnc-toolkit
Version: 0.1.0
Requires-Python: >=3.10
Description-Content-Type: text/markdown
```

**`WHEEL`** describes the archive itself:

```text
Wheel-Version: 1.0
Generator: setuptools (84.0.0)
Root-Is-Purelib: true
Tag: py3-none-any
```

`Root-Is-Purelib: true` says the package is pure Python. `Tag` is the compatibility label, which the next section decodes.

**`RECORD`** lists every file in the wheel with a **[[hash|hash]]** — a short fingerprint computed from the file's bytes — and its size in bytes:

```text
gnc/data/earth.json,sha256=BIxqac9xesGNqS33USP32b4hdW6whYWFANK8kFs5-38,70
```

pip checks each file against its fingerprint as it installs, and later uses the same list to uninstall. You can recompute a fingerprint yourself.

::: example Checking one line of RECORD
The data file `earth.json` holds one line of text and a newline. RECORD claims its SHA-256 fingerprint starts `BIxqac9x` and its size is $70$ bytes. Recompute both.

**Step 1.** Take the file's exact bytes and hash them with SHA-256, which always gives $32$ bytes of output.

**Step 2.** Wheels write the hash in **URL-safe base64**, a way of spelling bytes with letters, digits, `-` and `_`, and drop the `=` padding at the end.

```python
import base64
import hashlib

data = b'{"mu_m3_s2": 3.986004418e14, "radius_m": 6378137.0, "j2": 0.00108263}\n'
digest = hashlib.sha256(data).digest()
print(len(data))
print(base64.urlsafe_b64encode(digest).rstrip(b"=").decode())
# 70
# BIxqac9xesGNqS33USP32b4hdW6whYWFANK8kFs5-38
```

**Step 3.** Compare. The size matches, $70$ bytes. The fingerprint matches, character for character. Base64 spells every $3$ bytes as $4$ characters, so $32$ bytes need $\lceil 32/3 \rceil \times 4 = 44$ characters, the last of them padding; drop it and $43$ are left. Count the string above: $43$. Everything agrees.

If even one bit of the file had changed on its way to you, the fingerprint would be completely different, and pip would refuse to install it.
:::

::: warning Installing an sdist runs code; installing a wheel does not
To install from an sdist, pip runs the project's build backend, and for setuptools projects that includes the project's own `setup.py`. Any code can sit there. Installing a wheel only copies files. That is one reason secure build systems prefer wheels, and it is why pip has a switch to refuse sdists entirely, which you will meet below.
:::

## The file name is a compatibility label

A wheel's file name is not decoration. It is five or six fields joined by dashes:

$$
\texttt{name-version-python-abi-platform.whl}
$$

(An optional build number can sit after the version.) The last three fields are called the wheel's **tags**:

- the **Python tag** says which Python can run it: `py3` means any Python 3, `cp311` means CPython 3.11 exactly;
- the **ABI tag** says which binary interface compiled code in it expects: `none` means it has no compiled code, `cp311` means it was compiled against CPython 3.11's **[[ABI|abi]]**, the binary rules compiled code uses to talk to Python;
- the **platform tag** says which operating system and processor: `any` for pure Python, or something like `win_amd64`, `macosx_11_0_arm64` or `manylinux_2_28_x86_64`.

So `gnc_toolkit-0.1.0-py3-none-any.whl` reads: "any Python 3, no compiled code, any computer". That is the best a wheel can say, and every pure-Python package should say it. One wheel serves the whole world.

When you run `pip install`, pip asks your Python for its list of supported tags, from most preferred to least. On the machine used for this lesson (CPython 3.11, Linux, x86-64) the list is long:

```python
from packaging.tags import sys_tags

tags = [str(t) for t in sys_tags()]
print(tags[:3])
print(len(tags), tags.index("py3-none-any"))
# ['cp311-cp311-linux_x86_64', 'cp311-cp311-manylinux_2_39_x86_64', 'cp311-cp311-manylinux_2_38_x86_64']
# 989 977
```

pip compares every wheel a package offers against this list and takes the one whose tag appears earliest. A compiled wheel that exactly fits wins. The universal `py3-none-any` sits near the end, at position $977$ of $989$: it fits everywhere, so it is the last resort. If no wheel matches at all, pip falls back to the sdist and builds it.

::: example Reading NumPy's wheel name
NumPy 2.3.3 was published to PyPI as $74$ files: $73$ wheels and one sdist. The one pip picked for this machine is

`numpy-2.3.3-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`

Take it apart at the dashes:

```python
name = "numpy-2.3.3-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl"

dist, version, python_tag, abi_tag, platform_tag = name[:-4].split("-")
print(dist, version)
print(python_tag, abi_tag)
for plat in platform_tag.split("."):
    print(plat)
# numpy 2.3.3
# cp311 cp311
# manylinux_2_27_x86_64
# manylinux_2_28_x86_64
```

**Step 1.** `cp311` and `cp311`: it holds compiled code built for CPython 3.11. It will not load in Python 3.12, which is why NumPy publishes a separate wheel for each Python version.

**Step 2.** The platform field holds *two* tags joined by a dot. A dot means "any of these", so the same file is labeled as fitting both.

**Step 3.** `manylinux_2_27_x86_64` means: Linux on a 64-bit Intel or AMD processor, with version $2.27$ or newer of the system's C library. The next section explains that number.

**Step 4.** Sizes. This wheel is $16.9\,\mathrm{MB}$ zipped and unpacks to $58.8\,\mathrm{MB}$ in $1127$ files. It installed from a local file in about $2.2\,\mathrm{s}$. The sdist for the same release is $20.6\,\mathrm{MB}$ of source that would first need a C and C++ compiler and a build run lasting minutes.

So the $73$ wheels are $73$ ready-built bookshelves, one for each common door: every supported Python version on Windows, macOS and Linux, for Intel and ARM processors.
:::

## Compiled wheels and manylinux

A pure-Python wheel fits everywhere because Python reads `.py` files the same way on every computer. Compiled code is different. Build a C extension module, and the result is machine code for one processor, linked against one Python version's ABI and against the libraries of one operating system.

Here is a tiny example: a C function that solves Kepler's equation, $M = E - e \sin E$, for the eccentric anomaly $E$ (read "big E") given the mean anomaly $M$ and the eccentricity $e$. Every orbit propagator solves this equation millions of times, so people do write it in C. Package it with setuptools and build:

```text
$ python -m build
...
x86_64-linux-gnu-gcc ... -c src/kepler/_solve.c -o build/temp.linux-x86_64-cpython-311/src/kepler/_solve.o
Successfully built kepler_fast-0.1.0.tar.gz and kepler_fast-0.1.0-cp311-cp311-linux_x86_64.whl
```

(Setuptools can compile a small extension like this one. Bigger compiled projects use backends built for the job, the family the pyproject lesson mentioned: NumPy and SciPy build with **meson-python**, and CMake-based C++ projects often use **scikit-build-core**. Whichever backend runs, the wheel that comes out follows the same rules.)

The wheel now contains a compiled file, `kepler/_solve.cpython-311-x86_64-linux-gnu.so`, $25\,248$ bytes of machine code. And its platform tag is `linux_x86_64`. That tag says "some Linux on x86-64", which is far too vague to be safe. Linux machines differ in which libraries they have and which versions. So the package index **PyPI** refuses to accept `linux_x86_64` wheels at all.

### The C library sets the floor

Every compiled program on Linux leans on the system's C library, **[[glibc|glibc]]**, for basics such as memory, files and maths. glibc keeps an old promise: a program built against an old glibc keeps working on every newer one. The reverse is not true. A program built on a new system may use a function that older glibc versions do not have, and it crashes at import time on an older machine.

That promise is what **manylinux** uses. A wheel is built on an *old* Linux, using only the oldest library features it can, and then labeled with the oldest glibc it needs. The tag `manylinux_2_28_x86_64` reads "runs on any x86-64 Linux whose glibc is version $2.28$ or newer". Red Hat Enterprise Linux 8 ships glibc $2.28$; Ubuntu 24.04 ships $2.39$. Both can install it. The format of the tag, `manylinux_X_Y`, comes from a standard called **[[PEP 600|manylinux-history]]**.

::: key manylinux in one line
`manylinux_X_Y_arch` means: runs on any Linux for processor `arch` whose glibc is version $X.Y$ or newer, because it was built against glibc $X.Y$ and bundles every other library it needs.
:::

### auditwheel: checking and fixing the label

A tool called `auditwheel` reads a Linux wheel, finds every system function its compiled files call (compilers call these names **symbols**), and works out the oldest glibc that provides them all. For the Kepler wheel:

```text
$ auditwheel show dist/kepler_fast-0.1.0-cp311-cp311-linux_x86_64.whl
kepler_fast-0.1.0-cp311-cp311-linux_x86_64.whl is consistent with the
following platform tag: "manylinux_2_5_x86_64".

The wheel references external versioned symbols in these
system-provided shared libraries: libc.so.6 with versions
{'GLIBC_2.2.5', 'GLIBC_2.4'}
```

The C code only called `sin`, `cos` and `fabs` plus Python's own functions, so it needs nothing newer than glibc $2.5$. Then `auditwheel repair` rewrites the label:

```text
$ auditwheel repair dist/kepler_fast-*.whl -w wheelhouse
New WHEEL info tags: cp311-cp311-manylinux_2_5_x86_64, cp311-cp311-manylinux1_x86_64
```

`repair` does a second, bigger job for real projects. If a compiled file needs a library that is not part of the basic system — a fast linear-algebra library, say — `repair` copies that library *into* the wheel and points the extension at the copy. This is called **[[vendoring|vendoring]]**. NumPy's wheel carries a folder `numpy.libs/` holding its own copy of the OpenBLAS linear-algebra library, $25.1\,\mathrm{MB}$ of it, plus the Fortran runtime. That is why a NumPy wheel works on a machine that never had OpenBLAS installed.

::: example Why the build machine matters
Suppose your C code calls a function that first appeared in glibc $2.34$, and you build the wheel on your Ubuntu 24.04 laptop (glibc $2.39$).

**Step 1.** `auditwheel show` finds a symbol versioned `GLIBC_2.34`, so the best label it can give is `manylinux_2_34_x86_64`.

**Step 2.** A colleague's cluster runs Red Hat Enterprise Linux 8, with glibc $2.28$. Since $2.28 < 2.34$, pip on that cluster sees no matching wheel. It falls back to the sdist and tries to compile.

**Step 3.** If the cluster has no compiler, the install fails. If it has one, it builds a wheel for that machine alone, and repeats the build in every fresh container whose pip cache is empty.

The fix is to build on an old system on purpose. The Python packaging community publishes container images for exactly this, such as `manylinux_2_28`, whose glibc is $2.28$. Build inside that image and the wheel's floor is at most $2.28$, which the cluster meets. Tools like **[[cibuildwheel|cibuildwheel]]** run that build for every Python version and platform in one CI job.
:::

::: warning Newer build machine, narrower wheel
A Linux wheel can never run on a glibc older than the one it was built against. Building release wheels on your up-to-date laptop quietly raises the floor and shuts out older clusters and containers. Build compiled wheels in the official manylinux images, and let auditwheel check the label.
:::

Other platforms have their own versions of the same idea. `musllinux_1_2` wheels are for Linux systems such as Alpine that use the musl C library instead of glibc. macOS tags carry the oldest macOS version supported, as in `macosx_11_0_arm64`. Windows tags such as `win_amd64` need no version, because Windows keeps its system libraries compatible for a long time.

## When pip has only an sdist

If no wheel fits, pip installs from the sdist. Watch it happen with the Kepler package:

```text
$ pip install dist/kepler_fast-0.1.0.tar.gz
Processing ./dist/kepler_fast-0.1.0.tar.gz
  Installing build dependencies: finished with status 'done'
  Getting requirements to build wheel: finished with status 'done'
  Preparing metadata (pyproject.toml): finished with status 'done'
Building wheels for collected packages: kepler-fast
  Building wheel for kepler-fast (pyproject.toml): finished with status 'done'
  Created wheel for kepler-fast: filename=kepler_fast-0.1.0-cp311-cp311-linux_x86_64.whl
Successfully installed kepler-fast-0.1.0
```

Read it line by line. pip made an isolated build environment and installed the backend into it, as the `[build-system]` table asked. It built a wheel, on this machine, with this machine's compiler. Then it installed that wheel. **pip always installs a wheel in the end**; with an sdist it has to build one first. It also keeps the wheel it built in its cache, so the next install on the same machine skips the build.

Now the same install on a machine where the C compiler is missing (simulated here by naming a compiler that does not exist):

```text
  error: [Errno 2] No such file or directory: 'cc-missing'
  ERROR: Failed building wheel for kepler-fast
ERROR: Could not build wheels for kepler-fast, which is required to install pyproject.toml-based projects
```

For a tiny Kepler solver that is a nuisance. For NumPy, which needs C and C++ compilers, or SciPy, which also needs a Fortran compiler, it is the difference between a two-second install and an afternoon of fighting build tools. That is why the scientific stack puts so much work into shipping wheels for every common platform.

Two pip switches control the choice:

- `pip install --only-binary :all: numpy` refuses sdists. It fails fast if no wheel fits, instead of starting a long build. CI jobs and containers often use it.
- `pip install --no-binary :all: numpy` refuses wheels and builds from source. It is for rare cases, such as custom compiler flags.

::: warning Ship both
Publish a wheel *and* an sdist for every release. The wheels serve almost everybody. The sdist serves the rest: an unusual platform, a Linux distribution that rebuilds everything from source, or an auditor who wants to see the code that made the wheel. A release with only wheels locks those people out.
:::

::: note Why a wheel is tied to one Python version
A compiled extension talks to Python through C structures: how a Python object is laid out in memory, where its reference count lives, which functions exist. CPython is allowed to change those details between minor versions, such as 3.11 and 3.12. An extension compiled against 3.11's layout would read the wrong memory under 3.12, so the tag `cp311` pins it to 3.11. CPython does offer a smaller **stable ABI** that is promised not to change; extensions that limit themselves to it get the tag `abi3` and one wheel serves 3.11 and every later version. The dependency-resolution lesson comes back to binary interfaces, because the same problem appears between NumPy and every package compiled against it.
:::

## Check yourself

::: check
A colleague sends you `nav_filter-2.1.0-cp312-cp312-win_amd64.whl`. Read each field aloud, then say whether it will install on a Linux laptop running Python 3.12.
:::

::: answer
`nav_filter` is the distribution name and `2.1.0` the version. `cp312` as the Python tag means CPython 3.12. `cp312` as the ABI tag means it contains compiled code built against CPython 3.12's binary interface. `win_amd64` means Windows on a 64-bit x86 processor. The Python version matches, but the platform does not: a Windows compiled file cannot load on Linux. pip will reject this wheel and look for another one, or fall back to an sdist.
:::

::: check
You run `python -m build` and it prints "Building wheel from sdist". Why does the build tool bother with the detour, instead of building the wheel straight from your project folder?
:::

::: answer
Building the wheel from the unpacked sdist proves the sdist is complete. Anyone installing from the sdist later will build from exactly those files. If a file the build needs, such as a C source file or a data file, was left out of the sdist, the wheel build fails right away on your machine. Building straight from the project folder would succeed, because the folder has every file, and the broken sdist would reach users.
:::

::: check
Your package is pure Python. A teammate proposes publishing separate wheels for Windows, macOS and Linux "to be safe". What should the wheel's tags be, and why is one wheel enough?
:::

::: answer
It should be one wheel tagged `py3-none-any`: any Python 3, no compiled code, any platform. Pure Python files run the same way on every operating system and processor, so there is nothing platform-specific to build. Separate platform wheels would contain identical files, triple the release work, and mislabel the package as compiled.
:::

::: check
A wheel is tagged `manylinux_2_31_x86_64`. Which of these can install it: a container with glibc $2.28$, a laptop with glibc $2.35$, a Raspberry Pi (ARM processor) with glibc $2.36$? Explain each.
:::

::: answer
The tag needs x86-64 and glibc $2.31$ or newer. The container fails: $2.28$ is older than $2.31$, and a program built against newer glibc may call functions the older one lacks. The laptop works: $2.35 \geq 2.31$ on x86-64. The Raspberry Pi fails despite its new glibc, because its processor is ARM (`aarch64`), and machine code for x86-64 cannot run on it. Each of the two failing machines would need its own wheel, or would fall back to building the sdist.
:::

::: check
`pip install` of a scientific package on a fresh CI runner suddenly takes eight minutes instead of ten seconds, and the log shows "Building wheel for ...". Name two likely causes and one flag that would have turned the slow build into a fast, clear failure.
:::

::: answer
pip found no wheel matching the runner, so it built from the sdist. Likely causes: the runner moved to a Python version the package has not yet published wheels for (a new `cp3XX` tag), or to a platform without wheels, such as an ARM runner or an old glibc below the wheel's manylinux floor. Also possible: a new release was published as an sdist before its wheels were uploaded. `pip install --only-binary :all:` refuses to build from source, so the job would fail at once with a message that no matching distribution exists.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| sdist | `name-version.tar.gz` | Source plus build instructions; must be built on the target |
| Wheel | `name-version-python-abi-platform.whl` | Prebuilt zip; installing it means unpacking it |
| `python -m build` | The standard build front end | Makes the sdist, then the wheel from the sdist |
| `.dist-info` | Metadata folder in every wheel | `METADATA`, `WHEEL` (tags) and `RECORD` (file hashes) |
| `py3-none-any` | Pure Python wheel | One wheel for every platform |
| `cp311-cp311-...` | Compiled for CPython 3.11 | One wheel per Python version and platform |
| `manylinux_X_Y_arch` | Linux wheel with a glibc floor | Runs on glibc $X.Y$ or newer; built on old Linux |
| auditwheel | Checks and repairs Linux wheels | Sets the manylinux tag and bundles extra libraries |
| sdist fallback | No wheel matches | pip builds a wheel locally, which needs compilers |

The next lesson uses the wheel's metadata for something visible: console entry points, the declaration that makes pip write a real command such as `gnc-orbit` onto your PATH.

::: context tarball A box of files, squeezed
A tar file bundles many files into one, keeping folder structure and permissions; the name comes from "tape archive", from the days when backups went to magnetic tape. Adding gzip compression gives a `.tar.gz`, often called a tarball. On Linux or macOS, `tar tzf` lists what is inside and `tar xzf` unpacks it. Python's standard library reads them too, with the `tarfile` module.
:::

::: context hash A fingerprint for a file
A hash function turns any amount of data into a short, fixed-size fingerprint. SHA-256 always produces 256 bits (32 bytes). Change one bit of the input and roughly half the output bits flip, so a matching fingerprint is overwhelming evidence the file is unchanged. Wheels record one per file, and lockfiles, later in this module, record one per downloaded archive, so an install can prove it got exactly the bytes that were tested.
:::

::: context abi The rules for plugging compiled code together
An API (application programming interface) is the set of function names and arguments you write in source code. An ABI (application binary interface) is the same agreement one level down, as the compiled machine code sees it: how big each structure is, where each field sits in memory, how arguments are passed. Two pieces of compiled code can share an API yet disagree on the ABI, and then they read each other's memory wrongly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="130" height="70" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">CPython 3.11</text>
  <text x="85" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">object layout A</text>
  <rect x="150" y="58" width="16" height="12" fill="#1f2a44"/>
  <rect x="150" y="80" width="16" height="12" fill="#1f2a44"/>
  <rect x="210" y="40" width="130" height="70" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">extension .so</text>
  <text x="275" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">built for layout A</text>
  <line x1="166" y1="64" x2="210" y2="64" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="166" y1="86" x2="210" y2="86" stroke="#1d6fd1" stroke-width="3"/>
  <text x="188" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">plugs fit: cp311</text>
  <text x="180" y="138" font-size="11" text-anchor="middle" fill="#b4232c">a 3.12 socket has a different shape: no fit</text>
</svg>
```
:::

::: context glibc The C library under every Linux program
glibc, the GNU C library, provides the basic functions nearly every compiled Linux program uses: opening files, allocating memory, maths such as `sin`. Each function is stamped with the glibc version that introduced it. A program records the stamps it needs, and the loader refuses to start it on a system whose glibc is older than the newest stamp.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="346,60 336,55 336,65" fill="#1f2a44"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="40" y1="54" x2="40" y2="66"/><line x1="180" y1="54" x2="180" y2="66"/>
    <line x1="269" y1="54" x2="269" y2="66"/><line x1="320" y1="54" x2="320" y2="66"/>
  </g>
  <text x="40" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">2.17</text>
  <text x="180" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">2.28</text>
  <text x="269" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">2.35</text>
  <text x="320" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">2.39</text>
  <text x="340" y="104" font-size="11" text-anchor="end" fill="#6c7a93">glibc version</text>
  <rect x="180" y="30" width="160" height="14" fill="#8fb8f0"/>
  <text x="185" y="41" font-size="11" fill="#1f2a44">manylinux_2_28 runs</text>
  <rect x="20" y="30" width="160" height="14" fill="#fff" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="100" y="41" font-size="11" text-anchor="middle" fill="#b4232c">refused</text>
  <text x="20" y="124" font-size="11" fill="#6c7a93">built against an old glibc, runs on every newer one</text>
</svg>
```
:::

::: context manylinux-history From manylinux1 to manylinux_X_Y
The first standard, PEP 513 in 2016, defined `manylinux1`: wheels built on CentOS 5, with glibc 2.5. Later standards raised the floor: `manylinux2010` (glibc 2.12) and `manylinux2014` (glibc 2.17). Each needed a new PEP. PEP 600 ended that by making the tag carry the glibc version itself, `manylinux_X_Y`, so no new standard is needed for each step. The old names survive as aliases: `manylinux1` is `manylinux_2_5`, and `manylinux2014` is `manylinux_2_17`.
:::

::: context vendoring Packing your own copy
To vendor a library is to ship a private copy of it inside your own package, instead of expecting the user's system to have it. auditwheel does this for shared libraries, renaming each copy with a hash so it cannot clash with another package's copy. The cost is size: much of a NumPy wheel's weight is its bundled OpenBLAS. The benefit is that the wheel works on a bare machine, which is exactly what a CI runner or a fresh container is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="16" width="320" height="110" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30" y="34" font-size="12" fill="#1f2a44" font-weight="bold">numpy wheel (.whl)</text>
  <rect x="34" y="46" width="130" height="64" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="99" y="74" font-size="12" text-anchor="middle" fill="#1f2a44">numpy/</text>
  <text x="99" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">19 compiled .so</text>
  <rect x="190" y="46" width="136" height="64" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="258" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">numpy.libs/</text>
  <text x="258" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">OpenBLAS 25.1 MB</text>
  <text x="258" y="101" font-size="11" text-anchor="middle" fill="#1f2a44">gfortran runtime</text>
  <line x1="164" y1="78" x2="184" y2="78" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="190,78 180,73 180,83" fill="#1d6fd1"/>
</svg>
```
:::

::: context cibuildwheel One CI job, dozens of wheels
cibuildwheel is a tool from the Python Packaging Authority that runs in CI and builds a project's compiled wheels for every Python version and platform it is asked for. On Linux it builds inside the official manylinux and musllinux container images and runs auditwheel automatically; on macOS and Windows it uses that system's own tools. It can run your test suite against each built wheel, so every one of the dozens of files is tested before release.
:::
