---
id: l13-package-layout
title: Package layout and relative imports
minutes: 20
covers:
  - Package layout: src/ layout, __init__.py, relative imports
---

Think about a small shop. Customers come in through the front door and see a counter with the few things for sale. Behind a curtain is the stockroom, full of boxes, tools and half-finished work. Customers never need to know how the stockroom is arranged. They only need the counter. And before the shop sells anything, someone should check the product as it will leave in the box — not the prototype still sitting on the workbench.

A Python package is that shop. Its `__init__.py` file is the front door and counter. Its other modules are the stockroom. And where the files sit on disk decides whether your tests check the boxed product or the workbench copy.

Your code has grown up over this module. It has a parser, a logger, type annotations and a set of dataclasses. It is no longer a script, and the next question is where its files go — because `import gnc` either works for everybody who checks out the repository, or works only for you, in one folder, on one machine. The difference is entirely in the layout.

The first Python module set up the mechanics. A **package** is a **[[folder|package-folders]]** with an `__init__.py` file in it, imported by a dotted name like `gnc.frames`. A project is described by a `pyproject.toml` file that lets it be installed. This lesson is about the decisions on top of those mechanics: what belongs in `__init__.py`, how a module should name its neighbors, and why the code goes under a folder called `src/` — a choice that looks like a habit and is really the difference between testing what you wrote and testing what you ship.

## `__init__.py` is the package's front door

`__init__.py` (read "dunder init dot py") runs the first time anything in the package is imported. Its job is to say what the package offers. The usual pattern is to **re-export** — import and pass along — the handful of names a user should reach for. Then `from gnc import body_to_inertial` works without anybody needing to know which file it lives in.

Here is a three-file package named `gnc`, for guidance, navigation and control:

```python
# pkg/src/gnc/__init__.py
"""Guidance, navigation and control: the package's public surface."""
from .frames import body_to_inertial
from .units import DEG, deg_to_rad

__version__ = "0.2.0"
__all__ = ["body_to_inertial", "deg_to_rad", "DEG", "__version__"]
```

```python
# pkg/src/gnc/units.py
"""Angle and length conversions."""
import math

DEG = math.pi / 180.0


def deg_to_rad(deg):
    return deg * DEG
```

```python
# pkg/src/gnc/frames.py
"""Frame transformations. Uses a sibling module by a relative import."""
import math

from .units import deg_to_rad


def body_to_inertial(v_body, yaw_deg):
    psi = deg_to_rad(yaw_deg)
    c, s = math.cos(psi), math.sin(psi)
    x, y, z = v_body
    return (c * x - s * y, s * x + c * y, z)
```

`body_to_inertial` turns a direction measured on the vehicle (its **[[body frame|frames]]**) into the fixed, outside frame, for a vehicle turned by a **yaw** angle $\psi$ (the Greek letter "psi") about its vertical axis. `__version__` is a string naming this release of the package.

Now import it. `PYTHONPATH=src` tells Python to look in the `src` folder for packages; the section on layouts explains why that is only a stand-in here:

```bash
cd pkg
PYTHONPATH=src python3 -c "import gnc
print(gnc.__version__)
print(tuple(round(c, 6) for c in gnc.body_to_inertial((1.0, 0.0, 0.0), 90.0)))
print(round(gnc.deg_to_rad(180.0), 6))
print(gnc.__all__)"
# 0.2.0
# (0.0, 1.0, 0.0)
# 3.141593
# ['body_to_inertial', 'deg_to_rad', 'DEG', '__version__']
```

Check the numbers. At a yaw of 90°, $\cos\psi = 0$ and $\sin\psi = 1$, so the body x-axis $(1, 0, 0)$ becomes $(0 \cdot 1 - 1 \cdot 0,\ 1 \cdot 1 + 0 \cdot 0,\ 0) = (0, 1, 0)$ — the nose now points along the outside y-axis. And 180° is $\pi$ radians, $3.141593$. The package works, and the caller never mentioned `gnc.frames`.

### `__all__`: the list of what is for sale

**`__all__`** (read "dunder all") is a list of the names that `from gnc import *` would bring in. That star statement — "import everything" — is one you should not write, because afterwards nobody can tell where a name came from. The real value of `__all__` is different: it is the package's written statement of what is public. **[[Linters|linters]]** use it; for example, they stop warning that `body_to_inertial` is "imported but unused" in `__init__.py` once it is listed there. Documentation tools use it to choose what to document. And a reader learns, in one line, which names are the counter and which are the stockroom.

### What stays out of the front door

Two things do not belong in `__init__.py`.

Anything slow. Importing any submodule — even `gnc.units` alone — runs `__init__.py` first. So a file read, a table load or a heavy import there is paid by every program that touches any part of the package.

Anything long. A hundred-line `__init__.py` is a module pretending to be a list of contents. Put the code in a submodule and re-export the name.

::: key The front door
`__init__.py` runs on the first import of the package or of any of its submodules, and defines the public surface: re-export the few names callers need, set `__version__`, and list them in `__all__`. Keep it short and fast — everything in it is paid for by every import of every submodule.
:::

## Relative imports name a sibling, not a path

Inside `frames.py`, `from .units import deg_to_rad` means "from the `units` module beside me". This is a **relative import**. Read the leading `.` as "this package". Two dots, `..`, mean the parent package, one level up. The name after the dots is a module, or a name inside one. So `from ..core import y` reads "from the `core` module in the package above me, import `y`".

There are two other ways to write the same import.

`from gnc.units import deg_to_rad` is an **absolute import**: it spells out the full dotted name from the top. It is correct and explicit. But it hard-codes the package's own name, so renaming the package means editing every module in it.

`from units import deg_to_rad` is the one to avoid. It is an absolute import of a top-level module called `units`, and it only works by accident, when the package's own folder happens to be on Python's search path. Imported properly, as `gnc`, it fails.

The house rule in most projects is: relative imports within a package, absolute imports across packages. Both are unambiguous, and only the relative one survives a rename.

::: key Relative imports
`from .units import x` imports from the sibling module `units`; `from ..core import y` imports from the parent package's `core`. Use relative imports within a package and absolute imports (`from gnc.units import x`) across packages.
:::

::: warning A module with relative imports cannot be run as a script
```bash
cd pkg
PYTHONPATH=src python3 src/gnc/frames.py 2>&1 | tail -1
# ImportError: attempted relative import with no known parent package
```

Running a file directly makes it the **[[main module|dunder-main-package]]**, `__main__`, with no package. There is no "beside me" for the dot to refer to. Everyone meets this error the first time they try to test a submodule by running it. The fix is not to delete the dot. It is to run the code *as a module*, with `python3 -m`, read "python three dash m":

```python
# pkg/src/gnc/__main__.py
"""What `python3 -m gnc` runs."""
from . import body_to_inertial, deg_to_rad

print("90 deg in radians:", round(deg_to_rad(90.0), 6))
print("body x rotated 90 deg:", tuple(round(c, 6) for c in body_to_inertial((1.0, 0.0, 0.0), 90.0)))
```

```bash
cd pkg
PYTHONPATH=src python3 -m gnc
# 90 deg in radians: 1.570796
# body x rotated 90 deg: (0.0, 1.0, 0.0)
```

Check: 90° is $\pi/2 \approx 1.570796$ radians. `python3 -m gnc` imports the package properly and then runs its `__main__.py`, so every relative import resolves. `__main__.py` is where a package's command-line entry point belongs — the argparse `main` from the last lesson goes here — and it is why you type `python3 -m pytest` and `python3 -m mypy` the way you do.
:::

## Flat layout or src layout

Here is the decision that looks like taste and is not.

In a **flat layout**, the package folder sits at the top of the repository: `project/gnc/`. In a **src layout**, it sits one level down, inside a folder named `src`: `project/src/gnc/`. That one extra folder changes what `import gnc` finds, because of how Python searches.

When you start Python with `python3 -c ...` or `python3 -m ...`, the **current folder goes at the front of the [[search path|sys-path]]**, `sys.path` — the list of places Python looks for imports, in order. The first match wins. So from the project root, a flat layout's `gnc/` is found before anything installed.

::: example Flat layout against src layout, with the difference measured
Take two projects with the same package in them. The first keeps `gnc/` at the top; the second puts it under `src/`. Assume both are also installed, as they would be in a working environment. Here a `site_packages` folder stands in for the installed copy, holding a different version string so the two copies can be told apart:

```python
# site_packages/gnc/__init__.py
__version__ = "1.0.0-installed"
```

```python
# flat_layout/gnc/__init__.py
__version__ = "0.2.0-worktree"
```

```python
# src_layout/src/gnc/__init__.py
__version__ = "0.2.0-worktree"
```

The **working tree** is the set of files you are editing. Now import `gnc` from each project's root folder, the way `python3 -m pytest` does, and print which copy was loaded:

```bash
cd flat_layout && PYTHONPATH=../site_packages python3 -c "import gnc, os; print(gnc.__version__, os.path.relpath(gnc.__file__))"
cd ../src_layout && PYTHONPATH=../site_packages python3 -c "import gnc, os; print(gnc.__version__, os.path.relpath(gnc.__file__))"
# 0.2.0-worktree gnc/__init__.py
# 1.0.0-installed ../site_packages/gnc/__init__.py
```

That is the whole argument, in two lines of output.

**Flat layout, line 1.** The current folder was first on the search path and contained `gnc/`, so `import gnc` found the working tree. The installed copy was never looked at. Your tests would run against the folder you are editing. Every question only the *installed* package can answer goes unasked. Is a data file listed in the packaging configuration, or does it exist only in your checkout? Is every submodule included in the **[[distribution|wheel]]**? The answer arrives from a user, after release.

**src layout, line 2.** There is no `gnc` in the current folder — only `src` — so `import gnc` can only find the installed one. The tests exercise what will ship. If a file is missing from the distribution, the import fails on your machine, today.

The cost of the src layout is one short table in `pyproject.toml`, because the build tool must be told where the package is:

```toml
# src_layout/pyproject.toml
[project]
name = "gnc"
version = "0.2.0"
requires-python = ">=3.11"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]
```

The last two lines say "look for packages in `src`". With that, `pip install -e .` in the project's virtual environment — the **[[editable install|editable-install]]** from the first module's packaging lesson — makes the installed `gnc` point at your source folder, so edits take effect at once while `import gnc` still goes through the installation rather than around it. For the strictest check, a test job can run `pip install .` (no `-e`) to install a real copy, then run the tests against exactly that.

The `PYTHONPATH=src` in this lesson's transcripts is a stand-in for the install, so they run without one. In a real project, install the package. Setting `PYTHONPATH` by hand is how you bring back the problem the layout was chosen to prevent.
:::

::: key src layout
Put the package in `src/<name>/` and set `[tool.setuptools.packages.find] where = ["src"]`. The package is then not importable from the project root, so tests import the installed package — what you ship — instead of the working tree. In a flat layout, the working tree shadows the installed package.
:::

## Circular imports

A **circular import** is a loop: module A imports B, and B, directly or through others, imports A. Picture two people each refusing to go through a door until the other one has.

::: example A circular import, and what it tells you
`__init__.py` imports from a submodule that imports back from the package:

```python
# circ/src/gnc/__init__.py
from .frames import body_to_inertial
```

```python
# circ/src/gnc/frames.py
from .sensors import Gyro


def body_to_inertial(v):
    return v
```

```python
# circ/src/gnc/sensors.py
from gnc import body_to_inertial


class Gyro:
    pass
```

```python
# circ/check.py
"""Import the package and report the failure without this machine's paths."""
try:
    import gnc
except ImportError as exc:
    print(type(exc).__name__ + ":", str(exc).split(" (/")[0])
else:
    print("imported", gnc.__name__)
```

```bash
cd circ
PYTHONPATH=src python3 check.py
# ImportError: cannot import name 'body_to_inertial' from partially initialized module 'gnc' (most likely due to a circular import)
```

Follow the **[[sequence|import-cycle]]** one step at a time:

1. `import gnc` starts running `__init__.py`.
2. Its first line imports `frames`, so `frames.py` starts running.
3. The first line of `frames.py` imports `sensors`, so `sensors.py` starts running.
4. `sensors.py` asks `gnc` for `body_to_inertial`. But `gnc` is still stuck at step 1, and `body_to_inertial` is not defined until `frames.py` gets past its first line. The name does not exist yet.

"Partially initialized module" is the diagnosis: a module that has started running and not finished.

The tempting fix is to change `sensors.py` to `from .frames import body_to_inertial`. It does not help. `frames` is *also* half-built at that moment — still on its first line — and Python says so:

```
ImportError: cannot import name 'body_to_inertial' from partially initialized module 'gnc.frames' (most likely due to a circular import)
```

The real fix is structural. A loop almost always means a shared piece that wants to be its own module. Move it to `core.py`, which imports nothing from the package, and have both modules import from there:

```python
# circ_fixed/src/gnc/core.py
def body_to_inertial(v):
    return v
```

```python
# circ_fixed/src/gnc/frames.py
from .core import body_to_inertial
from .sensors import Gyro
```

```python
# circ_fixed/src/gnc/sensors.py
from .core import body_to_inertial


class Gyro:
    pass
```

```bash
cd circ_fixed
PYTHONPATH=src python3 check.py
# imported gnc
```

`__init__.py` is unchanged: `frames` still has the name `body_to_inertial`, now imported from `core`. The imports form a tree with `core` at the bottom, and nothing waits on anything half-built.

A last resort, when a refactor is not possible yet, is to move the import inside the function that needs it, so it runs when the function is called — long after every module has finished loading.

This is also a second argument for keeping `__init__.py` short. Every import it performs is a place where a future submodule can close a loop by accident.
:::

## What a finished package looks like

Putting this module's thirteen lessons together, a small analysis package ends up like this:

```text
descent-analysis/
├── pyproject.toml          name, version, dependencies, where the package is
├── README.md
├── src/
│   └── descent/
│       ├── __init__.py     re-exports, __version__, __all__
│       ├── __main__.py     the argparse entry point
│       ├── telemetry.py    generators that stream run files
│       ├── frames.py       frozen dataclasses and their dunder methods
│       ├── sensors.py      a Protocol and the models that satisfy it
│       └── atmosphere.py   an lru_cache over the layer integration
└── tests/
    └── test_frames.py
```

Nothing in that tree is decoration. `src/` keeps the tests honest. `__init__.py` is the interface. `__main__.py` is what a scheduler runs. The modules are separated by what they are about, not by what kind of code they contain, so a change to the atmosphere model touches one file. And `pyproject.toml` is the one place that says what the project is, which is what makes it installable by somebody who has never read it.

## Check yourself

::: check
What does `__all__` in `__init__.py` actually control, and what is the better reason to write it?
:::

::: answer
Technically, it controls `from gnc import *`: only the names it lists come in. Without it, the star import brings in every name not starting with an underscore — including modules the package imported for its own use, like `math`.

The better reason is that it documents the public surface. Star imports are discouraged anyway, because they hide where a name came from, so the list is rarely used for what it was invented for. It is used by linters (which treat a listed re-export as intentional, and can check that every listed name exists), by documentation generators, and by the next engineer, who reads one line and knows which four names are the interface and which are internals that may change.
:::

::: check
Explain why `python3 src/gnc/frames.py` fails with "attempted relative import with no known parent package", and give the command that works.
:::

::: answer
Running a file directly sets its `__name__` to `"__main__"` and gives it no package. A relative import is resolved against the module's package, and with no package the leading dot has nothing to mean, so `from .units import deg_to_rad` cannot be resolved.

Running it as a module works: `python3 -m gnc.frames` imports `gnc` first, then runs `gnc.frames` with its package set. One catch here: this package's `__init__.py` already imports `frames`, so Python prints a `RuntimeWarning` that `gnc.frames` was imported before being run. It still runs. For a package with a `__main__.py`, `python3 -m gnc` runs that, and that is the usual home for runnable code.

The wrong fix, which people try first, is changing the import to `from units import ...`. That makes the direct run work and breaks the package for every proper import, because `units` is only findable when the package's own folder happens to be on the search path.
:::

::: check
Your tests pass locally, and a user reports `ModuleNotFoundError` for a submodule right after installing your package. What layout were you using, and why did the tests not catch it?
:::

::: answer
A flat layout, with the package folder at the top of the repository. Running the tests from the project root put that folder first on `sys.path`, so `import gnc` found the working tree — where the submodule of course exists, because you wrote it. The installed copy, which lacks it because the packaging configuration missed it, was never imported.

With a src layout, there is no importable `gnc` in the project root. The tests can only reach the installed package, and the missing submodule fails on the machine that built it.

The general rule is worth more than this bug: test the artifact you distribute, not the folder you edit. The src layout is how a Python project enforces that, and it costs one table in `pyproject.toml`.
:::

::: check
`gnc/__init__.py` imports `frames`, `frames` imports `sensors`, and `sensors` does `from gnc import body_to_inertial`. Name the error, explain why changing `sensors` to `from .frames import body_to_inertial` does not fix it, and give a fix that does.
:::

::: answer
`ImportError: cannot import name 'body_to_inertial' from partially initialized module 'gnc' (most likely due to a circular import)`. When `sensors` runs, `gnc` is mid-import: its `__init__.py` has begun and has not yet bound `body_to_inertial`.

Importing from `.frames` instead does not help, because `frames` is also mid-import — it is paused on its own first line, `from .sensors import Gyro`, and has not yet reached the `def`. The error now names `gnc.frames` as the partially initialized module.

The fix is to break the loop. Ask why a sensor model needs a frame transformation while the frame module needs a sensor. Usually both need a shared piece: move `body_to_inertial` into `gnc/core.py`, which imports nothing from the package, and have `frames` and `sensors` import it from `.core`. The imports then form a tree. Moving the import inside the function that uses it also works, as a last resort rather than a first choice.
:::

::: check
A colleague's package has a 300-line `__init__.py` that loads an atmosphere table from disk at import time. Give two concrete costs.
:::

::: answer
First, every program pays for it. `from gnc.units import deg_to_rad`, in a script that never touches the atmosphere, still runs the whole `__init__.py` and reads the table, because importing any submodule imports the package first. Python caches a module after its first import, so the cost comes once per process — but that is every command-line run, every subprocess and every worker in a parallel job. A tool that should start at once takes a second, every time.

Second, it fails in places that have nothing to do with it. If the table is read by a path relative to the current folder, the import breaks whenever the program is started from somewhere else. If the file is missing from the distribution, the package cannot be imported at all after installation. An import that reads files turns every unrelated import into a possible failure.

The repair: move the code into a submodule, load the table lazily — behind a function, a `@property`, or an `lru_cache` that reads it on first use — and find the file with `importlib.resources`, which locates data files inside the installed package. `__init__.py` then holds re-exports, `__version__` and `__all__`, and nothing that can fail.
:::

## Summary

| Item | Statement |
| --- | --- |
| Package | A folder with `__init__.py`; importing any submodule runs it first |
| `__init__.py` contents | Re-exports, `__version__`, `__all__`; nothing slow, nothing long, no file reads |
| `__all__` | Controls `from pkg import *`; its real value is declaring the public surface |
| Relative import | `from .units import x`, `from ..core import y`; survives renaming the package |
| Absolute import | `from gnc.units import x`; correct too, but hard-codes the package name |
| Direct run of a submodule | Fails: "attempted relative import with no known parent package" |
| `python3 -m pkg.module` | Imports the package first, so relative imports resolve |
| `__main__.py` | What `python3 -m pkg` runs; the home of the argparse entry point |
| Flat layout | The working tree shadows the installed package; tests never see what ships |
| src layout | The package is not importable from the project root, so tests use the install |
| Measured here | Same command, two layouts: `0.2.0-worktree` against `1.0.0-installed` |
| `[tool.setuptools.packages.find] where = ["src"]` | The one table the src layout costs |
| Circular import | "partially initialized module"; fix by moving the shared piece into its own module |

That is the module. You began it able to write Python that works, and you end it able to write Python a reviewer will accept: comprehensions and generators for the data, classes and dataclasses for the objects, Protocols for the interfaces, context managers for the resources, decorators for the cross-cutting parts, annotations for the contracts, logging and `argparse` for the outside world, and a layout that makes the whole thing installable. The next module puts NumPy under all of it, where the loops you have been writing over lists become array expressions over millions of elements.

::: context package-folders Folders without `__init__.py`
Since Python 3.3, a folder with no `__init__.py` can still be imported: it becomes a **namespace package**, a feature meant for splitting one large package across several separately installed pieces. That means a missing `__init__.py` often does not cause an error, only quieter surprises — no place for `__version__`, no front door, and tools that search for packages may skip the folder. For your own projects, give every package folder an `__init__.py`.
:::

::: context frames Two ways to point
A **frame** is a set of three axes you measure directions against. The body frame is fixed to the vehicle: x out of the nose, and so on. The inertial frame stays fixed while the vehicle turns. When the vehicle yaws by $\psi$, the same arrow has different numbers in the two frames, and $\cos\psi$ and $\sin\psi$ convert between them. Converting between frames is one of the most common jobs in guidance code, which is why it is the example package here; the attitude and rotation modules later in the course treat it in full, in three dimensions.
:::

::: context linters Programs that read your code
A **linter** is a program that reads source code without running it and points out likely mistakes and style problems: an import that is never used, a name that is never defined, a line that is too long. The name comes from `lint`, a checker for the C language written at Bell Labs in the 1970s, named after the fluff a clothes dryer picks out. For Python, widely used linters include pyflakes, flake8 and ruff. Many teams run one automatically on every change, next to the type checker you met in the annotations lesson.
:::

::: context dunder-main-package Why the dot has nothing to hold on to
Every module carries two labels: `__name__`, its own name, and `__package__`, the package it belongs to. A relative import starts from `__package__`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="12" width="160" height="126" rx="6" fill="#fff"/>
    <rect x="188" y="12" width="160" height="126" rx="6" fill="#fff"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="22" y="32" font-weight="700">python3 -m gnc.frames</text>
    <text x="22" y="58">__name__ = "__main__"</text>
    <text x="22" y="78">__package__ = "gnc"</text>
    <text x="198" y="32" font-weight="700">python3 .../frames.py</text>
    <text x="198" y="58">__name__ = "__main__"</text>
    <text x="198" y="78">__package__ = None</text>
  </g>
  <g font-size="12">
    <text x="22" y="112" fill="#1d6fd1">.units means gnc.units</text>
    <text x="198" y="112" fill="#b4232c">.units means nothing</text>
    <text x="198" y="128" fill="#b4232c">ImportError</text>
  </g>
</svg>
```
:::

::: context sys-path Where Python looks, in order
`sys.path` is an ordinary list of folders. Python tries them from the top and stops at the first match. Started from the project root, the first entry is the current folder.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">flat layout</text>
  <text x="270" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">src layout</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="30" width="156" height="36" rx="5" fill="#f2b880"/>
    <rect x="12" y="78" width="156" height="36" rx="5" fill="#fff"/>
    <rect x="192" y="30" width="156" height="36" rx="5" fill="#fff"/>
    <rect x="192" y="78" width="156" height="36" rx="5" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="20" y="46">1  current folder</text>
    <text x="20" y="60">has gnc/  (found)</text>
    <text x="20" y="94">2  site-packages</text>
    <text x="20" y="108" fill="#6c7a93">never reached</text>
    <text x="200" y="46">1  current folder</text>
    <text x="200" y="60" fill="#6c7a93">only src/, no gnc/</text>
    <text x="200" y="94">2  site-packages</text>
    <text x="200" y="108">has gnc  (found)</text>
  </g>
  <text x="90" y="144" font-size="11" fill="#b4232c" text-anchor="middle">tests the working tree</text>
  <text x="270" y="144" font-size="11" fill="#1d6fd1" text-anchor="middle">tests the installed copy</text>
</svg>
```
:::

::: context wheel What "the distribution" is
When a Python project is released, a build tool packs it into a **distribution**: usually a **wheel**, a `.whl` file that is really a zip archive of the package's files plus a description of the project. `pip install` unpacks a wheel into the environment's `site-packages` folder. Only files the build configuration includes go into the wheel. A module or data file that exists in your folder but was left out of the configuration is absent after installation, which is the bug the src layout catches.
:::

::: context editable-install An installed link, not a copy
A normal `pip install .` builds the package and copies it into `site-packages`. An **editable** install, `pip install -e .`, instead installs a small pointer that sends `import gnc` to your `src/gnc` folder, so edits show up without reinstalling. Checked for this lesson with setuptools 79 on Python 3.11: after `pip install -e .`, `gnc.__file__` was the `__init__.py` inside `src/gnc`. Because it points at your whole source folder, a file missing from the build configuration can still be found; that is why a strict test job installs the real, non-editable copy.
:::

::: context import-cycle The loop, drawn
Each arrow is "starts importing". The red arrow asks for a name from a module that has not finished, so the name is not there yet.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="120" y="12" width="120" height="34" rx="5" fill="#f2b880"/>
    <rect x="12" y="116" width="120" height="34" rx="5" fill="#8fb8f0"/>
    <rect x="228" y="116" width="120" height="34" rx="5" fill="#8fb8f0"/>
    <line x1="140" y1="46" x2="84" y2="110"/>
    <line x1="132" y1="133" x2="220" y2="133"/>
  </g>
  <polygon points="80,114 82,103 89,108" fill="#1f2a44"/>
  <polygon points="228,133 218,128 218,138" fill="#1f2a44"/>
  <line x1="276" y1="116" x2="224" y2="52" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="220,47 230,51 223,57" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="34">gnc/__init__.py</text>
    <text x="72" y="138">frames.py</text>
    <text x="288" y="138">sensors.py</text>
  </g>
  <g font-size="11" text-anchor="middle">
    <text x="84" y="76" fill="#6c7a93">1</text>
    <text x="176" y="126" fill="#6c7a93">2</text>
    <text x="300" y="80" fill="#b4232c">3: from gnc import</text>
    <text x="300" y="94" fill="#b4232c">not defined yet</text>
  </g>
</svg>
```
:::
