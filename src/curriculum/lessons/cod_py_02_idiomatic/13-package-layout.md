---
id: l13-package-layout
title: Package layout and relative imports
minutes: 17
covers:
  - Package layout: src/ layout, __init__.py, relative imports
---

The module has a parser, a logger, annotations and a set of dataclasses. It is no longer a script, and the next question is where its files go — because `import gnc` either works for everybody who checks out the repository or works only for you, in one directory, on one machine, and the difference is entirely in the layout.

The first module established the mechanics: a package is a directory with an `__init__.py`, imported by a dotted name, and a project is described by a `pyproject.toml` that lets it be installed. This lesson is about the decisions that sit on top of those mechanics. What belongs in `__init__.py` and what does not. How a module inside a package should refer to its siblings. And why the code goes under `src/` rather than at the top of the repository — a choice that looks like a convention and is in fact the difference between testing what you wrote and testing what you ship.

## `__init__.py` is the package's front door

It runs when the package is first imported, and its job is to say what the package offers. The idiom is to re-export the handful of names a user should reach for, so that `from gnc import body_to_inertial` works without anybody having to know which submodule it lives in:

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

A yaw of 90° carries the body x-axis onto the inertial y-axis, and 180° is $\pi$ radians: the package works, and the caller never mentioned `gnc.frames`.

`__all__` is a list of the names `from gnc import *` will bring in. Its real value is not that statement — which you should not write — but that it is the package's declaration of what is public. Linters use it, documentation tools use it, and a reader learns in one line which names are the interface and which are implementation.

Two things not to put in `__init__.py`. Anything slow, because it runs on every import of anything in the package: a file read, a table load, a NumPy import chain you do not always need. And anything long, because a hundred-line `__init__.py` is a module pretending to be a manifest; put the code in a submodule and re-export the name.

::: key
`__init__.py` runs on first import of the package and defines its public surface: re-export the few names callers need, set `__version__`, and list them in `__all__`. Keep it short and fast — everything in it is paid for by every import of every submodule.
:::

## Relative imports name a sibling, not a path

Inside `frames.py`, `from .units import deg_to_rad` means "from the `units` module beside me". One dot is the current package, two dots is the parent, and the name after the dots is a module or a name inside it.

The alternative, `from units import deg_to_rad`, is a plain absolute import that happens to work when the package directory is on `sys.path` — which is the accident the next section is about — and fails the moment the package is imported properly. The alternative that *is* correct, `from gnc.units import deg_to_rad`, is absolute and also fine; it is more explicit and more typing, and it hard-codes the package's own name, so renaming the package means editing every module in it.

The house rule in most projects is relative imports within a package and absolute imports across packages. Both are unambiguous; only the relative one survives a rename.

::: warning
A module that uses relative imports cannot be run as a script:

```bash
cd pkg
PYTHONPATH=src python3 src/gnc/frames.py 2>&1 | tail -1
# ImportError: attempted relative import with no known parent package
```

Running a file directly makes it `__main__`, with no package, so there is no "beside me" for the dot to refer to. This is the error everyone meets the first time they try to test a submodule by running it, and the fix is not to delete the dot. It is to run the module *as* a module:

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

`python3 -m gnc` imports the package properly and runs its `__main__.py`, so every relative import resolves. `__main__.py` is where a package's command-line entry point belongs — the `argparse` `main` from the last lesson goes here — and it is why `python3 -m pytest` and `python3 -m mypy` are spelled the way they are.
:::

::: example Flat layout against src layout, with the difference measured
Two projects with the same package in them. The first keeps `gnc/` at the top of the repository; the second puts it under `src/`. Assume both are also installed, as they would be in a working environment — a `site_packages` directory stands in for that here, holding a different version so the two copies can be told apart:

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

Now import `gnc` from each project's root directory, exactly as a test runner would:

```bash
cd flat_layout && PYTHONPATH=../site_packages python3 -c "import gnc, os; print(gnc.__version__, os.path.relpath(gnc.__file__))"
cd ../src_layout && PYTHONPATH=../site_packages python3 -c "import gnc, os; print(gnc.__version__, os.path.relpath(gnc.__file__))"
# 0.2.0-worktree gnc/__init__.py
# 1.0.0-installed ../site_packages/gnc/__init__.py
```

That is the whole argument, in two lines of output.

In the flat layout the current directory is on `sys.path` and comes first, so `import gnc` found the working tree and the installed copy was never consulted. Your tests ran against the directory you are editing. Every question that only the *installed* package can answer went unasked: is a data file listed in the packaging configuration, or does it exist only in your checkout? Is a submodule actually included in the distribution? Does the package still import when the tests directory is not next to it? The answer arrives from a user, after release.

In the src layout there is no `gnc` in the current directory, so `import gnc` can only find the installed one. The tests exercise what will ship. If a file is missing from the distribution, the import fails on your machine, today.

The cost of the src layout is one line of configuration, because the build tool must be told where the package is:

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

With that, `pip install -e .` in the project's virtual environment — the editable install from the first module's packaging lesson — links the source directory so that edits take effect immediately, while `import gnc` still goes through the installed package rather than around it.

The `PYTHONPATH=src` used in this lesson is a stand-in for that install, so the transcripts run without one. In a real project, install the package; setting `PYTHONPATH` by hand is how you reintroduce the problem the layout was chosen to prevent.
:::

::: example A circular import, and what it tells you
`__init__.py` importing from a submodule that imports from the package is a loop, and Python says so:

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

Follow the sequence. `import gnc` starts running `__init__.py`, which imports `frames`, which imports `sensors`, which imports `gnc` — a module that is *already being imported* and is therefore half-built, with `body_to_inertial` not yet bound. The phrase "partially initialized module" is the diagnosis.

The mechanical fix is for `sensors.py` to import from `.frames` rather than from the package, which breaks the loop by not going back through the front door. The design fix is usually better: a cycle almost always means two modules that want to be one, or a shared piece that wants to be a third module both depend on. Put the common thing in `gnc/core.py` and have both import from there.

This is also the second argument for keeping `__init__.py` short. Every import it performs is a place a future submodule can accidentally close a loop.
:::

## What a finished module looks like

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
Technically it controls `from gnc import *`: only the names it lists are imported by that statement, and without it the star import brings in every name not starting with an underscore, including modules the package imported for its own use.

The better reason is that it documents the public surface. Star imports are discouraged anyway — they make it impossible to tell where a name came from — so the list is rarely used for what it was invented for. It is used by linters, which flag a public name that is not in `__all__` or an `__all__` entry that does not exist, and by documentation generators, and by the next engineer, who reads one line and knows which four names are the interface and which are internals that may change.
:::

::: check
Explain why `python3 src/gnc/frames.py` fails with "attempted relative import with no known parent package", and give the command that works.
:::

::: answer
Running a file directly sets its `__name__` to `"__main__"` and its `__package__` to `None`. A relative import resolves against the package the module belongs to, and a module with no package has nothing for the leading dot to mean, so `from .units import deg_to_rad` cannot be resolved.

The command that works is `python3 -m gnc.frames`, which imports the module through its package — Python imports `gnc` first, then runs `gnc.frames` with its package set correctly. For a package with a `__main__.py`, `python3 -m gnc` runs that.

The wrong fix, which people try first, is changing the relative import to `from units import ...`. That makes the direct run work and breaks the package for every proper import, because `units` is only findable when the package's own directory happens to be on `sys.path`.
:::

::: check
Your tests pass locally and a user reports `ModuleNotFoundError` for a submodule immediately after installing your package. What layout were you using, and why did the tests not catch it?
:::

::: answer
A flat layout, with the package directory at the top of the repository. Running the tests from the project root put that directory on `sys.path` ahead of everything else, so `import gnc` found the working tree — where the submodule obviously exists, because you wrote it. The installed copy, which does not contain it because the packaging configuration missed it, was never imported.

With a src layout there is no importable `gnc` in the project root, so the tests can only reach the installed package, and the missing submodule fails on the machine that built it.

The general principle is worth more than the specific bug: test the artefact you distribute, not the directory you edit. The src layout is how Python enforces that, and it costs one line in `pyproject.toml`.
:::

::: check
`gnc/__init__.py` imports `frames`, `frames` imports `sensors`, and `sensors` does `from gnc import body_to_inertial`. Name the error and give both a mechanical and a structural fix.
:::

::: answer
`ImportError: cannot import name 'body_to_inertial' from partially initialized module 'gnc' (most likely due to a circular import)`. When `sensors` runs, `gnc` is mid-import: its `__init__.py` has begun and has not yet bound `body_to_inertial`, so the name is not there to import.

The mechanical fix is for `sensors.py` to import from the module that defines the name, `from .frames import body_to_inertial`, rather than from the package. That avoids re-entering `__init__.py` and breaks the cycle. Moving the import inside the function that needs it also works, and is a legitimate last resort rather than a first choice.

The structural fix is to ask why a sensor model needs a frame transformation and a frame module needs a sensor. Usually one of them does not, or both need a third thing — put the shared piece in its own module that neither imports from the package root, and the dependency graph becomes a tree again.
:::

::: check
A colleague's package has a 300-line `__init__.py` that loads an atmosphere table from disk at import time. Give two concrete costs.
:::

::: answer
First, every import pays for it. `from gnc.units import deg_to_rad`, in a script that never touches the atmosphere, still runs the whole `__init__.py` and reads the table, because importing any submodule imports the package first. A command-line tool that should start instantly takes a second, and a test suite that imports the package a hundred times takes a hundred seconds.

Second, it fails in places that have nothing to do with it. If the table is read by a relative path, the import breaks when the working directory is not the project root; if it is missing from the distribution, the package cannot be imported at all after installation. An import that does I/O turns every unrelated import into a possible failure.

The repair is to move the code into a submodule and load the table lazily — behind a function, a `@property`, or an `lru_cache` that reads it on first use — and to locate it with `importlib.resources` rather than a path relative to the working directory. `__init__.py` then holds re-exports, `__version__` and `__all__`, and nothing that can fail.
:::

## Summary

| Item | Statement |
| --- | --- |
| Package | A directory with `__init__.py`; importing any submodule runs it first |
| `__init__.py` contents | Re-exports, `__version__`, `__all__`; nothing slow, nothing long, no I/O |
| `__all__` | Controls `from pkg import *`; its real value is declaring the public surface |
| Relative import | `from .units import x`, `from ..core import y`; survives renaming the package |
| Absolute import | `from gnc.units import x`; correct too, but hard-codes the package name |
| Direct run of a submodule | Fails: "attempted relative import with no known parent package" |
| `python3 -m pkg.module` | Imports the package first, so relative imports resolve |
| `__main__.py` | What `python3 -m pkg` runs; the home of the argparse entry point |
| Flat layout | The working tree shadows the installed package; tests never see what ships |
| src layout | The package is not importable from the project root, so tests use the install |
| Measured here | Same command, two layouts: `0.2.0-worktree` against `1.0.0-installed` |
| `[tool.setuptools.packages.find] where = ["src"]` | The one line the src layout costs |
| Circular import | "partially initialized module"; fix by importing the defining module, or by refactoring |

That is the module. You began it able to write Python that works and end it able to write Python a reviewer will accept: comprehensions and generators for the data, classes and dataclasses for the objects, Protocols for the interfaces, context managers for the resources, decorators for the cross-cutting parts, annotations for the contracts, logging and `argparse` for the outside world, and a layout that makes the whole thing installable. The next module puts NumPy under all of it, where the loops you have been writing over lists become array expressions over millions of elements.
