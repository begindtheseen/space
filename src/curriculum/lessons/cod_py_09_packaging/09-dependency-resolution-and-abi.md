---
id: l09-dependency-resolution-and-abi
title: Dependency resolution, extras and the ABI problem
minutes: 21
covers:
  - Dependency resolution, extras, and the scientific-stack ABI problem
---

Imagine planning a movie night with three friends. One can only come before 8 pm. One can only come on a weekend. One cannot do Saturday. You look for a time that fits everybody. If you find one, great. If you try Saturday at 7 and it fails, you back up and try Sunday. And sometimes, after trying everything, there is no time that works, and the honest answer is "these three people cannot all come to the same movie".

Installing Python packages is the same puzzle. Every package lists ranges of versions it accepts for its dependencies, as you saw two lessons ago. The installer has to pick **one** version of every package so that all the ranges are satisfied at the same moment. That search is called **dependency resolution**, and the part of pip or uv that does it is the **resolver**.

This lesson watches a resolver work on a small set of packages you can build yourself, then looks at **extras** — optional groups of dependencies a user can switch on — and finishes with a problem that ordinary pure-Python code never meets but NumPy and SciPy users meet regularly: packages that contain compiled machine code must match each other at the level of bytes in memory. That is the **ABI problem**, and it is why the scientific stack is pinned more tightly than anything else in your environment.

## One version of everything

Start from the fact that makes resolution necessary. An environment has one `site-packages` folder, and it can hold only one copy of each package. If two libraries both need `frames`, a small package of coordinate frames, they share the one `frames` that is installed. So its version has to fit both of them.

To make this concrete, here are five small wheels built locally, with these dependencies:

| Package | Version | Depends on |
| --- | --- | --- |
| `frames` | 1.4.0 | nothing |
| `frames` | 2.1.0 | nothing |
| `gnc-filters` | 1.0.0 | `frames>=1.2,<2` |
| `gnc-filters` | 2.0.0 | `frames>=2` |
| `orbit-tools` | 3.2.0 | `frames>=1.3,<2` |

Now ask for both libraries. The `--no-index --find-links wheels` part tells pip to look only in a local folder called `wheels`, never on the internet:

```text
$ pip install --no-index --find-links wheels gnc-filters orbit-tools
Processing ./wheels/gnc_filters-2.0.0-py2.py3-none-any.whl
Processing ./wheels/orbit_tools-3.2.0-py2.py3-none-any.whl
Processing ./wheels/frames-2.1.0-py2.py3-none-any.whl (from gnc-filters)
INFO: pip is looking at multiple versions of orbit-tools to determine which version is compatible with other requirements. This could take a while.
Processing ./wheels/gnc_filters-1.0.0-py2.py3-none-any.whl
Processing ./wheels/frames-1.4.0-py2.py3-none-any.whl (from gnc-filters)
Installing collected packages: frames, orbit-tools, gnc-filters
Successfully installed frames-1.4.0 gnc-filters-1.0.0 orbit-tools-3.2.0
```

Read it line by line, because it shows exactly what a resolver does:

1. It [[starts optimistic|resolver-speed]] and picks the **newest** version of each thing you asked for: `gnc-filters` 2.0.0 and `orbit-tools` 3.2.0.
2. `gnc-filters` 2.0.0 wants `frames>=2`, so it picks `frames` 2.1.0.
3. Then it notices `orbit-tools` needs `frames<2`. Conflict. The `INFO` line is the resolver saying "I have to back up".
4. It **[[backtracks|backtracking]]**: it undoes a choice and tries an older candidate. With `gnc-filters` 1.0.0, the range becomes `frames>=1.2,<2`, and `frames` 1.4.0 fits both libraries.

The result is not "newest of everything". It is the newest combination that works. That trade happened quietly: you got an older `gnc-filters` than you might have expected, and the only clue was the `INFO` line. When a resolver's choice surprises you, `pip install --dry-run` or reading the lockfile diff shows what it picked.

::: key
Dependency resolution: the installer must choose exactly one version of every package, direct and transitive, so that every declared range holds at once. It prefers newer versions and **backtracks** to older ones when a choice leads to a conflict.
:::

### When there is no answer

Now make the puzzle impossible. Insist on the new `gnc-filters`:

```text
$ pip install --no-index --find-links wheels "gnc-filters>=2" orbit-tools
ERROR: Cannot install gnc-filters==2.0.0 and orbit-tools==3.2.0 because these package versions have conflicting dependencies.

The conflict is caused by:
    gnc-filters 2.0.0 depends on frames>=2
    orbit-tools 3.2.0 depends on frames<2 and >=1.3

To fix this you could try to:
1. loosen the range of package versions you've specified
2. remove package versions to allow pip to attempt to solve the dependency conflict

ERROR: ResolutionImpossible: for help visit https://pip.pypa.io/en/latest/topics/dependency-resolution/#dealing-with-dependency-conflicts
```

This is the empty-intersection problem from the pinning lesson, found by the real tool. The error message is good: it names both packages and the two ranges that do not overlap. Your options are the ones listed. Loosen your own requirement, wait for `orbit-tools` to support `frames` 2, or ask whether you truly need both libraries in one environment.

::: warning Do not escape a conflict with --no-deps
`pip install --no-deps` installs a package without checking its dependencies at all. It makes the error go away by skipping the resolver, which means the environment now breaks one of its own rules and nobody is told. For pure-Python code that may fail at import. For compiled code it can do much worse, as the ABI section below shows. If you must, run `pip check` afterwards: it lists every installed package whose declared requirements are not met.
:::

::: example Resolving a small graph by hand
Using the table above, suppose `orbit-tools` releases 4.0.0 with `frames>=1.3,<3`. Which versions does `pip install gnc-filters orbit-tools` choose now?

Step 1: start with the newest of each request: `gnc-filters` 2.0.0 and `orbit-tools` 4.0.0.

Step 2: combine their rules for `frames`. `gnc-filters` 2.0.0 says `>=2`. `orbit-tools` 4.0.0 says `>=1.3,<3`. Together that is `>=2,<3`.

Step 3: check the available `frames` versions. 1.4.0 fails (below 2). 2.1.0 passes (at least 2, below 3).

Step 4: nothing conflicts, so no backtracking. The result is `frames` 2.1.0, `gnc-filters` 2.0.0, `orbit-tools` 4.0.0.

Sanity check: one library widening its range from `<2` to `<3` let the resolver keep the newest version of everything. That is exactly the argument from the pinning lesson for libraries declaring the widest range they honestly support.
:::

### Environment markers

Some requirements only apply on certain machines. A requirement can carry an **[[environment marker|pep-508]]** after a semicolon — a condition on the Python version, the operating system and so on. Here are real lines from the metadata of pandas 2.1.4:

```text
numpy<2,>=1.22.4; python_version < "3.11"
numpy<2,>=1.23.2; python_version == "3.11"
numpy<2,>=1.26.0; python_version >= "3.12"
```

The resolver keeps only the lines whose condition is true on the machine being installed. On Python 3.11, pandas 2.1.4 needs NumPy at least 1.23.2 and below 2. Remember that `<2`; it comes back at the end of this lesson.

## Extras: optional groups of dependencies

Your trajectory simulator computes with NumPy. It can also draw plots, but not every user wants a plotting library installed — a CI machine running headless tests has no screen to show a plot on. An **extra** is a named, optional group of additional dependencies that a user switches on when installing.

You declare extras in `pyproject.toml` under `[project.optional-dependencies]`, the table you met in the lesson on project metadata:

```toml
[project]
name = "trajsim"
version = "0.3.0"
dependencies = ["numpy>=1.26"]

[project.optional-dependencies]
plot = ["plotkit>=0.5"]
dev = ["pytest>=8"]
```

When the wheel is built, the extras become ordinary requirement lines with a special marker, `extra == '...'`. Here is the metadata inside the built wheel:

```text
Name: trajsim
Version: 0.3.0
Requires-Dist: numpy>=1.26
Provides-Extra: dev
Requires-Dist: pytest>=8; extra == 'dev'
Provides-Extra: plot
Requires-Dist: plotkit>=0.5; extra == 'plot'
```

The user names extras in square brackets after the package name:

```text
$ pip install trajsim
Successfully installed numpy-2.4.6 trajsim-0.3.0

$ pip install "trajsim[plot]"
Installing collected packages: plotkit
Successfully installed plotkit-0.5.0
```

The first command ignored every line with an `extra ==` marker. The second switched `plot` on, so `plotkit` joined the resolution. Several extras go in one pair of brackets, separated by commas: `"trajsim[plot,dev]"`. The **[[quotes|shell-brackets]]** are there because some shells treat square brackets as a pattern.

A few facts about extras that trip people up:

- Extras only **add** requirements. There is no way for an extra to remove or replace a dependency.
- The extra's packages join the same resolution as everything else. If `plotkit` needed `numpy<2`, asking for `trajsim[plot]` could force an older NumPy on the whole environment.
- A typo is only a warning. `pip install "trajsim[plots]"` prints `WARNING: trajsim 0.3.0 does not provide the extra 'plots'` and carries on without it.
- In your own code, import the optional package inside the function that needs it, and raise a clear error if it is missing ("install trajsim[plot] to draw plots"). Then the core package still imports without the extra.

::: key
An **extra** is a named optional group of dependencies declared in `[project.optional-dependencies]` and requested as `package[extra]`. It adds requirements to the same resolution; it never removes any.
:::

Big projects use extras heavily. SciPy 1.17.1 declares `test`, `doc` and `dev` extras, with more than thirty extra requirements between them. A normal `pip install scipy` installs only NumPy.

## Compiled code and the ABI problem

Everything so far treats a version range as the whole story: if NumPy is inside the range, all is well. For pure-Python packages that is close to true. For packages that contain compiled C, C++ or Fortran code — NumPy, SciPy, pandas, Matplotlib, and any extension you built with Cython or pybind11 in the performance module — there is a second kind of compatibility, and ranges alone do not capture it.

### API and ABI

Picture a [[wall socket|socket-picture]]. The **API** is like the shape of the plug: which functions exist, their names and arguments. If the shape changes, the plug will not go in, and you find out at once. The **ABI** — application binary interface — is like the wiring behind the socket: which pin carries power and how many volts. Two sockets can have the same shape and different wiring. The plug goes in, and then something burns.

More exactly, an ABI is the agreement, at the level of machine code, about how compiled pieces talk: how big each structure is in memory, at which byte each field sits, how functions are called, and what names they are found under. An API break shows up when you compile. An ABI break shows up when compiled code built against one version runs against another.

Here is why it bites. When SciPy's C code is compiled, it reads NumPy's C header files, which describe NumPy's internal structures: "an array object is this many bytes, and the data pointer is at this offset". Those numbers are baked into SciPy's machine code. If you later install a NumPy whose structures have a different size or order, SciPy's compiled code still uses the old numbers. It reads the wrong bytes.

::: example Reading memory with the wrong layout
You can see the effect with Python's `struct` module, which packs numbers into raw bytes the way C lays them out. Suppose version 1 of a library stores a state as three 8-byte doubles: time $t$, position $x$, speed $v$. Version 2 adds a 4-byte integer `flags` field at the front. Code compiled against version 1 still reads three doubles from the start:

```python
import struct

new_bytes = struct.pack("@iddd", 1, 12.5, 7000.0, 7.55)   # written by the new library
print("new layout:", struct.calcsize("@iddd"), "bytes")
print("old layout:", struct.calcsize("@ddd"), "bytes")

t, x, v = struct.unpack_from("@ddd", new_bytes)            # read by code built for the old one
print("t =", t, " x =", x, " v =", v)

# new layout: 32 bytes
# old layout: 24 bytes
# t = 5e-324  x = 12.5  v = 7000.0
```

Step 1: the new layout is $4 + 4 + 3 \times 8 = 32$ bytes. The integer takes 4 bytes, then the compiler adds 4 bytes of **[[padding|padding]]** so the first double starts at a multiple of 8.

Step 2: the old code reads bytes 0 to 7 as $t$. Those hold the integer 1 and four zero bytes, which as a double is about $5 \times 10^{-324}$, a meaningless tiny number.

Step 3: it reads bytes 8 to 15 as $x$, but those hold the new version's $t = 12.5$. And it reads bytes 16 to 23 as $v$, which now hold the position, $7000$.

Sanity check: nothing raised an error. Every value is a perfectly valid float, each shifted one slot. A trajectory code fed this would report a speed of $7000\,\mathrm{m/s}$ where the truth is $7.55$, and carry on. This is what "silently wrong memory layout" means.
:::

### What it looks like with real NumPy

Real libraries guard against this. When a compiled module loads, it can check whether the structure sizes it was compiled with match what is actually running. Here is pandas 2.1.4, whose wheel was compiled against NumPy 1.x, forced into an environment with NumPy 2.4.6 using `--no-deps`:

```text
$ python -c "import pandas"
  File "interval.pyx", line 1, in init pandas._libs.interval
ValueError: numpy.dtype size changed, may indicate binary incompatibility. Expected 96 from C header, got 88 from PyObject
```

Read the last line. When pandas was compiled, NumPy's header said a `dtype` object is 96 bytes. The NumPy actually installed builds `dtype` objects of 88 bytes. The layout changed between NumPy 1 and NumPy 2, and the check caught it at import. You were lucky: a check fired. When no check covers the structure that changed, you get the `struct` example instead — no error, wrong numbers.

And this is why pandas 2.1.4 declares `numpy<2`. The resolver would never have built this environment. Only `--no-deps` got around it.

::: key
Why do NumPy and SciPy version constraints matter more than most? Compiled extensions link against a specific binary interface. A mismatch between the version a package was built against and the one installed produces import-time crashes or silently wrong memory layout, which is why the scientific stack pins more tightly than pure Python.
:::

### How the scientific stack lives with it

Look again at SciPy's own dependency line, read from the metadata of the SciPy 1.17.1 wheel:

```text
Requires-Dist: numpy<2.7,>=1.26.4
```

The pinning lesson said libraries should usually leave the top of a range open. SciPy caps NumPy anyway, because SciPy is compiled against NumPy's C interface, and its developers only promise the NumPy versions they have tested their compiled code with. Compiled code is the main place where an upper cap is justified.

NumPy follows a rule about which direction is safe. Within the 1.x series, an extension compiled against an *older* NumPy runs on a *newer* one, but not the other way around. That is why packages used to be built against the oldest NumPy they supported. [[NumPy 2.0|numpy-2]] broke the ABI on purpose, so an extension compiled against NumPy 1.x cannot run on NumPy 2. An extension compiled against NumPy 2 can run on NumPy 1.x releases back to a floor that NumPy documents.

So a scientific Python project follows a few habits:

- **Keep compiled packages consistent.** NumPy, SciPy, pandas and your own extensions should come from one resolution — one lockfile, one tool — never a mix of `pip install` over a **[[conda|conda-mix]]** environment for the compiled parts.
- **Pin NumPy with the rest.** In an application's lockfile it is pinned anyway. When you upgrade NumPy across a major version, expect to upgrade SciPy, pandas and friends at the same time.
- **Rebuild your own extensions** when NumPy changes major version. A `.so` file you compiled with Cython or pybind11 against NumPy 1.x has the old sizes baked in.
- **Never `--no-deps` a compiled package**, and run `pip check` after any manual change.
- **Match the platform.** A compiled wheel's file name carries tags such as `cp311` and `manylinux_2_28_x86_64`, as in the lesson on wheels. `cp311` means it was compiled for [[CPython 3.11's own ABI|stable-abi]]; it will not install on Python 3.12.

::: warning "The version is in range" is not enough for compiled code
A range check only compares numbers. It cannot know which NumPy a wheel was compiled against. If you build your own extension on a laptop with NumPy 1.26 and install it next to NumPy 2, every version range can be satisfied while the machine code is wrong. The compiled file has to be rebuilt against the NumPy that will run it.
:::

## Check yourself

::: check
Using the five-wheel table, a user runs `pip install orbit-tools "frames>=1.4"`. Walk through what the resolver picks, and say whether it needs to backtrack.
:::

::: answer
It starts with the newest `orbit-tools`, 3.2.0, which needs `frames>=1.3,<2`. The user also asked for `frames>=1.4`. Together: `>=1.4,<2`.

Available `frames` versions: 1.4.0 fits, 2.1.0 does not (it is not below 2). So it picks `frames` 1.4.0 and `orbit-tools` 3.2.0.

If the resolver's first guess for `frames` was the newest, 2.1.0, it would discover the conflict with `orbit-tools` and fall back to 1.4.0. Either way no older `orbit-tools` is needed, and the final set is `frames` 1.4.0, `orbit-tools` 3.2.0.
:::

::: check
A package `thermo` declares `dependencies = ["numpy>=1.26"]` and `[project.optional-dependencies] fast = ["numba>=0.60"]`. What does `pip install thermo` install, and what does `pip install "thermo[fast]"` add? Could installing the extra change which NumPy you get?
:::

::: answer
`pip install thermo` installs `thermo` and a NumPy version at least 1.26, plus whatever NumPy itself needs. The `numba` line carries the marker `extra == 'fast'`, which is false, so it is skipped.

`pip install "thermo[fast]"` also adds `numba` at least 0.60 and Numba's own dependencies.

Yes, it can change NumPy. Numba's requirements join the same resolution. If the chosen Numba supports only some NumPy versions, the combined range for NumPy narrows, and the resolver may pick an older NumPy than the plain install did.
:::

::: check
In the `struct` example, suppose version 2 had added the 4-byte `flags` field at the **end** instead of the front. What would the old code read, and why is that still an ABI change?
:::

::: answer
The new layout would be three doubles, then 4 bytes of integer, then 4 bytes of padding: 32 bytes. The old code reads the first 24 bytes, which are still $t$, $x$ and $v$ in the same places, so it gets the right values.

It is still an ABI change, because the structure's size changed from 24 to 32 bytes. Any compiled code that allocates these structures, copies them, or steps through an array of them uses the old size of 24 bytes. It would place the second element at byte 24, where the new library has `flags`. Appending fields is safer than inserting them, but it is not free.
:::

::: check
A colleague's laptop shows `ValueError: numpy.dtype size changed, may indicate binary incompatibility` when importing a package. What most likely happened, and how should they fix it?
:::

::: answer
A compiled package in the environment was built against a different NumPy than the one installed — most often built for NumPy 1.x while NumPy 2 is installed. It got there by skipping the resolver (`--no-deps`), by mixing installers for compiled packages, or by a locally built extension that was never rebuilt.

The fix is to make the environment consistent: create a fresh environment from the lockfile, or install a version of the package whose wheels are built for the installed NumPy (or install a NumPy inside its declared range). For a locally built extension, rebuild it against the NumPy that will run it. Then run `pip check`.
:::

::: check
Why is `numpy<2.7` in SciPy's requirements a reasonable upper cap, when the pinning lesson advised libraries to avoid caps?
:::

::: answer
The general advice exists because most caps block versions that would have worked fine. SciPy is different: it contains machine code compiled against NumPy's C interface, and whether a future NumPy keeps that binary interface compatible is not something a number range can promise. SciPy's developers test each release against the NumPy versions it supports and cap at the edge of what they have tested. That is a cap with a specific, known reason, which is when caps are justified.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Dependency resolution | choose one version of every package so every range holds at once |
| Backtracking | on a conflict, the resolver undoes a choice and tries an older version |
| ResolutionImpossible | no combination works; loosen a range or drop a package |
| `--no-deps` | skips the resolver; `pip check` finds what it broke |
| Environment marker | `; python_version == "3.11"` applies a line only where true |
| Extra | `package[extra]`, from `[project.optional-dependencies]`; only adds requirements |
| API vs ABI | the plug's shape vs the wiring: names and arguments vs bytes in memory |
| ABI mismatch | import-time crash if a check catches it, silently wrong values if not |
| Scientific stack | pins tighter, caps NumPy, keeps compiled packages from one resolution |

Next lesson: you now know what an environment must contain. The tools that build one — **venv, pip, uv and conda** — differ in exactly the places this lesson touched: how they resolve, whether they lock, and whether they manage compiled libraries below Python too.

::: context resolver-speed Why a resolver can take a while
Finding versions that satisfy every range at once is, in the general case, as hard as the hardest puzzles computers know — computer scientists have proved that dependency resolution is NP-complete. In practice real graphs are friendly, and resolvers use good guesses: start from the newest versions, and when a conflict appears, learn from it so the same dead end is not explored twice. pip's resolver is built on a library called resolvelib; uv uses an algorithm called PubGrub, which is why uv's error messages explain the conflict as a chain of "because … and because …" steps.
:::

::: context backtracking Backing up in the search
The resolver explores choices like paths in a maze. When a path hits a wall, it walks back to the last fork and tries the next branch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="26" rx="5" fill="#1d6fd1"/>
  <text x="180" y="27" font-size="12" text-anchor="middle" fill="#fff">orbit-tools 3.2.0</text>
  <line x1="160" y1="36" x2="90" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="36" x2="270" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="70" width="140" height="26" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="87" font-size="12" text-anchor="middle" fill="#1f2a44">gnc-filters 2.0.0</text>
  <rect x="200" y="70" width="140" height="26" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="87" font-size="12" text-anchor="middle" fill="#1f2a44">gnc-filters 1.0.0</text>
  <line x1="90" y1="96" x2="90" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="270" y1="96" x2="270" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="30" y="122" width="120" height="26" rx="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="90" y="139" font-size="12" text-anchor="middle" fill="#b4232c">frames: none fits</text>
  <rect x="210" y="122" width="120" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="270" y="139" font-size="12" text-anchor="middle" fill="#1f2a44">frames 1.4.0</text>
  <text x="90" y="164" font-size="11" text-anchor="middle" fill="#b4232c">tried first, dead end</text>
  <text x="270" y="164" font-size="11" text-anchor="middle" fill="#1f2a44">tried next, works</text>
</svg>
```

The newer branch is tried first because resolvers prefer new versions. Only when it fails does the older one get a turn.
:::

::: context pep-508 The grammar of a requirement line
The full syntax of a line such as `numpy<2,>=1.23.2; python_version == "3.11"` is set by PEP 508: a name, optional extras in brackets, a version specifier, and an optional marker after the semicolon. Markers can test `python_version`, `sys_platform` (such as `"linux"` or `"win32"`), `platform_machine` (such as `"x86_64"` or `"arm64"`) and a few more, joined with `and` and `or`. Extras are themselves markers — `extra == 'plot'` — which is how one metadata file describes every optional group.
:::

::: context shell-brackets Why the quotes around the brackets
In a terminal, the shell reads your command before pip ever sees it. Some shells, zsh (the default on modern Macs) among them, treat square brackets as a filename pattern: `trajsim[plot]` means "a file named trajsim followed by one of the letters p, l, o or t". When no such file exists, zsh stops with an error like "no matches found". Wrapping the whole thing in quotes, `"trajsim[plot]"`, tells the shell to pass it through untouched. It is harmless in shells that did not need it, so the habit is to always quote.
:::

::: context socket-picture Same shape, different wiring
An API is what you can see and name; an ABI is what the machine code assumes about memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="100" height="80" rx="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="47" y="45" width="10" height="26" fill="#1f2a44"/>
  <rect x="83" y="45" width="10" height="26" fill="#1f2a44"/>
  <line x1="52" y1="100" x2="52" y2="125" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="88" y1="100" x2="88" y2="125" stroke="#b4232c" stroke-width="3"/>
  <text x="70" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">version 1</text>
  <rect x="240" y="20" width="100" height="80" rx="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="267" y="45" width="10" height="26" fill="#1f2a44"/>
  <rect x="303" y="45" width="10" height="26" fill="#1f2a44"/>
  <line x1="272" y1="100" x2="272" y2="125" stroke="#b4232c" stroke-width="3"/>
  <line x1="308" y1="100" x2="308" y2="125" stroke="#1d6fd1" stroke-width="3"/>
  <text x="290" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">version 2</text>
  <text x="180" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">same face (API)</text>
  <text x="180" y="118" font-size="11" text-anchor="middle" fill="#b4232c">wires swapped (ABI)</text>
</svg>
```

A plug fits both sockets. Only the wiring behind the wall tells them apart, and you find out after you plug in.
:::

::: context padding Why the compiler adds padding
Processors read memory fastest when an 8-byte number starts at an address that is a multiple of 8. So a C compiler lines each field up, inserting unused bytes where needed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="11" fill="#1f2a44">new</text>
  <rect x="40" y="10" width="36" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="58" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">flags</text>
  <rect x="76" y="10" width="36" height="22" fill="#fff" stroke="#6c7a93" stroke-dasharray="3 2"/>
  <text x="94" y="25" font-size="11" text-anchor="middle" fill="#6c7a93">pad</text>
  <rect x="112" y="10" width="72" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="148" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">t = 12.5</text>
  <rect x="184" y="10" width="72" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="220" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">x = 7000</text>
  <rect x="256" y="10" width="72" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="292" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">v = 7.55</text>
  <text x="10" y="74" font-size="11" fill="#1f2a44">old</text>
  <rect x="40" y="60" width="72" height="22" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="76" y="75" font-size="11" text-anchor="middle" fill="#b4232c">reads t</text>
  <rect x="112" y="60" width="72" height="22" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="148" y="75" font-size="11" text-anchor="middle" fill="#b4232c">reads x</text>
  <rect x="184" y="60" width="72" height="22" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="220" y="75" font-size="11" text-anchor="middle" fill="#b4232c">reads v</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="104">0</text><text x="112" y="104">8</text><text x="184" y="104">16</text>
    <text x="256" y="104">24</text><text x="328" y="104">32</text>
  </g>
  <text x="184" y="132" font-size="11" text-anchor="middle" fill="#1f2a44">byte offsets: every old field is one slot off</text>
</svg>
```

Each box is drawn to scale: 9 pixels per byte. The old reader's three boxes line up with the wrong fields of the new layout.
:::

::: context numpy-2 The NumPy 2 transition
NumPy 2.0 came out in June 2024, the first new major version since NumPy 1.0 in 2006. The team used the break to clean up the Python API and to change internal C structures that had been frozen for years, knowing this meant every compiled package in the ecosystem had to publish new wheels. For months afterwards, the `numpy.dtype size changed` error and a longer message beginning "A module that was compiled using NumPy 1.x cannot be run in NumPy 2" were among the most common import failures in scientific Python. Packages that had declared `numpy<2` protected their users; packages without a cap broke on install day.
:::

::: context conda-mix Why mixing installers breaks compiled packages
Conda installs compiled libraries built by its own build system, often sharing lower-level libraries such as the linear-algebra library that NumPy and SciPy use. pip installs wheels that each carry their own copies. If you `pip install` a new NumPy on top of a conda environment, conda's SciPy may now sit next to a NumPy it was never built with, and conda does not know pip changed anything. The next lesson on environment tools covers when conda is the right choice; the rule here is to let one tool own the compiled packages.
:::

::: context stable-abi Python's own ABI, and the stable one
Python itself has a C interface that extensions compile against, and it changes between minor versions, so a wheel tagged `cp311` is for CPython 3.11 only. Python also offers a smaller **limited API** whose binary interface is kept stable across versions. A wheel built only against it is tagged `abi3`, and one file can serve Python 3.11, 3.12 and later. Many projects use it to publish fewer wheels. NumPy's own C interface is a separate layer on top, which is why a SciPy wheel must match both Python and NumPy.
:::
