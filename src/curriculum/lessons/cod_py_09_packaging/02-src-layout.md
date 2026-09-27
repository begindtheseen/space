---
id: l02-src-layout
title: The src layout
minutes: 17
covers:
  - The src layout and why it prevents accidental local imports
---

Picture a bakery that tastes every cake before it goes in the box. Good habit. But suppose the taster always samples from the mixing bowl in the kitchen, never from the finished, boxed cake. The bowl has all the ingredients. The box might be missing the frosting, because somebody forgot to pack it. The taster says "delicious" every time, and customers keep opening boxes with no frosting.

Python projects have exactly this problem. Your tests are the taster. The folder where you write code is the mixing bowl. The package that gets built and installed on someone else's machine is the boxed cake. If your tests import the code straight out of your working folder, they taste the bowl, and they will happily pass while the installed package is missing a file.

The fix is a folder arrangement called the **src layout** — putting your package one level down, inside a folder named `src/`, so that it *cannot* be imported from the repository root and your tests are forced to use the installed copy. This lesson builds the broken version first, shows the tests lying, then moves one folder and watches the same bugs get caught. A simulation team that hands its package to a [[CI machine|ci-machine]], a colleague or a flight-software container needs exactly this guarantee: what was tested is what ships.

## Two layouts, one difference

The **repository root** is the top folder of your project — the one with `pyproject.toml`, the README and the `.git` folder in it. There are two common ways to arrange a package inside it.

The **flat layout** puts the package folder directly in the root:

```text
gnc-toolkit/
    pyproject.toml
    gnc/
        __init__.py
        atmosphere.py
        data/atmosphere.csv
        nav/
            __init__.py
            filters.py
    tests/
        test_gnc.py
```

The **src layout** moves it one level down:

```text
gnc-toolkit/
    pyproject.toml
    src/
        gnc/
            __init__.py
            atmosphere.py
            data/atmosphere.csv
            nav/
                __init__.py
                filters.py
    tests/
        test_gnc.py
```

That is the whole difference. There is no `__init__.py` in `src/`, and `src` is not part of any import name: you still write `import gnc`, never `import src.gnc`.

Why does one extra folder matter? Remember from the last lesson that Python searches `sys.path` in order, and that when you start Python with `-m` or `-c`, the **[[working directory|working-directory]]** — the folder your terminal is sitting in — goes first on the list. Engineers run tests from the repository root almost every time. In the flat layout, the root contains a folder called `gnc/`, so `import gnc` finds your source code right there and never looks at what was installed. In the src layout, the root holds `src/` but no `gnc/`, so `import gnc` finds nothing in the root and moves on down the list to the installed copy in `site-packages`.

::: key
Why the src/ layout? It makes the package unimportable from the repository root, so tests run against the installed copy. That catches missing data files, missing modules in the wheel and bad relative imports before your users do.
:::

## Watching the tests lie

Here is the project in the flat layout, with a small bug of the most common kind. The package has two real modules and a data file:

```python
# gnc/nav/filters.py
def blend(gyro_angle, accel_angle, alpha=0.98):
    """Complementary filter: trust the gyro short-term, the accelerometer long-term."""
    return alpha * gyro_angle + (1 - alpha) * accel_angle
```

```python
# gnc/atmosphere.py
import csv
from importlib.resources import files


def density(altitude_km):
    """Air density in kg/m^3 from the bundled table (nearest row)."""
    table = files("gnc").joinpath("data/atmosphere.csv").read_text()
    rows = [(float(h), float(rho)) for h, rho in csv.reader(table.splitlines()[1:])]
    return min(rows, key=lambda r: abs(r[0] - altitude_km))[1]
```

The function `files("gnc")` from the standard library's `importlib.resources` finds the folder where the `gnc` package *actually lives* — wherever it was imported from — so the code can read **[[package data|package-data]]**, the non-Python files shipped inside a package. The table holds three rows of standard atmosphere: $1.225\,\mathrm{kg/m^3}$ at sea level, $0.4135$ at $10\,\mathrm{km}$ and $0.08891$ at $20\,\mathrm{km}$.

The tests:

```python
# tests/test_gnc.py
from gnc.atmosphere import density
from gnc.nav.filters import blend


def test_blend():
    assert abs(blend(10.0, 12.0) - 10.04) < 1e-12


def test_sea_level_density():
    assert density(0) == 1.225
```

The first test's expected value comes from the filter formula: $0.98 \times 10 + 0.02 \times 12 = 9.8 + 0.24 = 10.04$. The gyro gets 98 percent of the vote, so the answer sits close to the gyro's $10$, as it should.

And the build configuration, which you will learn to write properly in the next lesson. For now, read it as "build a package with setuptools, and the Python packages to include are: `gnc`".

```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=61"]
build-backend = "setuptools.build_meta"

[project]
name = "gnc-toolkit"
version = "0.1.0"

[tool.setuptools]
packages = ["gnc"]
```

That last line is the bug. It lists `gnc` but not the subpackage `gnc.nav`, and setuptools takes the list literally. It also says nothing about the CSV file, and setuptools does not pack non-Python files unless told to.

::: example The tests pass, the package is broken
In a fresh virtual environment, install the project for real with `pip install .` (the dot means "the project in this folder"), then run the tests from the repository root the usual way:

```text
$ pip install .
$ python -m pytest -q
..                                                                       [100%]
2 passed in 0.01s
```

Two for two. Now look inside what was actually installed. `pip show -f` lists the installed files:

```text
$ pip show -f gnc-toolkit
...
Files:
  gnc/__init__.py
  gnc/atmosphere.py
  gnc_toolkit-0.1.0.dist-info/METADATA
  ...
```

Count the package's own files. The source tree has five: `__init__.py`, `atmosphere.py`, `data/atmosphere.csv`, `nav/__init__.py` and `nav/filters.py`. The installed copy has two. Three of five files — 60 percent — never made it, including the whole navigation subpackage.

So how did `test_blend` pass? Step by step:

1. `python -m pytest` put the working directory, the repository root, first on `sys.path`.
2. The test file said `from gnc.nav.filters import blend`.
3. Python searched the root first, found the source folder `gnc/`, and imported everything from there.
4. The installed copy in `site-packages`, the one your users get, was never touched.

The tests tasted the mixing bowl. Every user who installs this package gets `ModuleNotFoundError: No module named 'gnc.nav'` the first time they touch the filter.
:::

The failure is invisible exactly where you work and visible everywhere else. That is why this bug is so common: it passes the one check you ran, on the one machine you ran it on.

::: warning Plain pytest and python -m pytest differ
The two commands put different folders on `sys.path`. `python -m pytest` adds the working directory, so the flat-layout source is always found. Plain `pytest` does not add the working directory; in its default mode it adds the folder of each test file (here `tests/`), or, if that folder has an `__init__.py`, the first folder above it that has none — which is often the repository root. A `conftest.py` file in the root also causes the root to be added. So "it passes with one command and fails with the other" is a strong sign that tests are finding source code by accident. Do not "fix" this by adding the source folder to `sys.path`; fix the layout.
:::

## Moving one folder

Move `gnc/` into a new `src/` folder and tell setuptools where to look. Keep the same bug, the incomplete package list, to see what changes:

```toml
[tool.setuptools]
package-dir = {"" = "src"}
packages = ["gnc"]
```

The line `package-dir = {"" = "src"}` reads "top-level packages live in the `src` folder".

Now run the tests *before* installing anything:

```text
$ python -m pytest -q
E   ModuleNotFoundError: No module named 'gnc'
1 error in 0.09s
```

This failure is good news. It proves the root no longer offers a free copy of the package. The only way the tests can find `gnc` now is the way your users find it: by installing it. So install it and run them again:

```text
$ pip install .
$ python -m pytest -q
E   ModuleNotFoundError: No module named 'gnc.nav'
1 error in 0.09s
```

There is the missing subpackage, caught on your own machine in the first minute. The src layout did not fix the bug. It stopped hiding it.

::: example Fixing the bugs the layout reveals
Keep going until the installed copy is complete, one failure at a time.

**Step 1: the missing subpackage.** Replace the hand-written list with automatic discovery, which searches `src/` for every folder that is a package:

```toml
[tool.setuptools.packages.find]
where = ["src"]
```

Reinstall and rerun:

```text
$ pip install .
$ python -m pytest -q
E       FileNotFoundError: [Errno 2] No such file or directory:
        '.../site-packages/gnc/data/atmosphere.csv'
1 failed, 1 passed in 0.04s
```

Progress: `test_blend` passes, so `gnc.nav` is installed now. And look at the path in the error. It ends in `site-packages/gnc/data/atmosphere.csv`: the test really is reading from the installed copy, and the CSV file is not in it.

**Step 2: the missing data file.** Tell setuptools to ship the table as package data:

```toml
[tool.setuptools.package-data]
gnc = ["data/*.csv"]
```

Reinstall and rerun:

```text
$ pip install .
$ python -m pytest -q
2 passed in 0.01s
```

**Step 3: count again.** `pip show -f gnc-toolkit` now lists `gnc/__init__.py`, `gnc/atmosphere.py`, `gnc/data/atmosphere.csv`, `gnc/nav/__init__.py` and `gnc/nav/filters.py`. Five of five. This "2 passed" means something the first one did not: the thing that was tested is the thing users get.
:::

In the flat layout, nothing would have pushed you to make either fix. Both tests were already green.

::: warning Do not undo the layout in your test settings
pytest has a setting, `pythonpath = ["src"]`, that adds `src/` to `sys.path` for every test run. It looks like a convenience. It puts the mixing bowl straight back on the tasting table and throws away the whole benefit. The same goes for setting `PYTHONPATH=src` in a CI script. If tests cannot find the package, install it.
:::

## What the layout catches, and what it does not

The src layout catches three families of bug. Each one comes from the same root cause: code that works only because of where you are standing.

- **Missing modules in the built package.** A subpackage left out of the list, or a folder missing its `__init__.py` so an older discovery setting skips it. You saw this one.
- **Missing data files.** Tables, configuration defaults, star catalogs, **[[ephemeris|ephemeris]]** files and anything else that is not a `.py` file. You saw this one too.
- **Bad relative imports.** Imports that resolve only from inside your source tree. For example, a module in `gnc` that says `import constants` when it should say `from . import constants`, which only works if someone runs it with the `gnc/` folder itself on the path. Or a module that imports a helper from some other folder at the repository root that was never part of the package. These work in your working folder and break on install.

There is a bonus. With setuptools, the flat layout makes automatic package discovery nervous. If the root holds both `gnc/` and, say, an `analysis/` folder with an `__init__.py`, setuptools refuses to guess: it stops with `Multiple top-level packages discovered in a flat-layout: ['gnc', 'analysis']`. In the src layout, everything inside `src/` is the package and everything outside is not, so there is nothing to guess.

What the layout does *not* do is make the root disappear from `sys.path`. `python -m pytest` still adds the root, so a helper folder *outside* `src/`, say `tools/`, stays importable while you test, even though it will not be in the package. The complete check therefore goes one step further, and it is the one worth putting in CI: build the package, install it into a **[[fresh virtual environment|fresh-venv]]**, and run the tests from a folder outside the source tree.

```text
$ python -m build --wheel
Successfully built gnc_toolkit-0.1.0-py3-none-any.whl
$ python -m venv /tmp/ci-env
$ /tmp/ci-env/bin/pip install dist/gnc_toolkit-0.1.0-py3-none-any.whl pytest
$ cd /tmp
$ /tmp/ci-env/bin/python -m pytest -q ~/gnc-toolkit/tests
2 passed in 0.01s
```

(The file ending `.whl` is a **[[wheel|wheel-file]]**, the built package, which you will open up in a later lesson.) From `/tmp`, nothing in the repository is on `sys.path` except the test files themselves. Anything that passes here will pass for your users.

::: key
The src layout removes the package from the repository root, so `import gnc` must use the installed copy. Test the real install in CI: build the wheel, install it in a fresh environment, and run the tests from outside the source tree.
:::

A last word on convenience. During development you do not want to reinstall after every one-line change. The answer is an **[[editable install|editable-install]]**, which the lesson after next takes apart. It works with the src layout, and it is exactly the reason the CI check above must use a real, non-editable install.

## Check yourself

::: check
In the flat layout, you have the package installed normally, and you run `python -m pytest` from the repository root. Which copy of `gnc` do the tests import, and why?
:::

::: answer
The source copy in the repository root. `python -m` puts the working directory, the root, first on `sys.path`. The root contains a folder `gnc/` with an `__init__.py`, so Python finds a regular package there and stops searching. The installed copy in `site-packages`, further down the list, is never reached.
:::

::: check
After moving to the src layout, a teammate complains: "Now `python -m pytest` fails with `No module named 'gnc'` until I install. The old layout was better." What do you tell them?
:::

::: answer
That failure is the layout doing its job: the tests can no longer find the package by accident, so they must use an installed copy, the same way users do. Install it once (normally, or as an editable install during development) and the tests run. The error that disappeared was not protecting anything; the old layout was hiding a whole class of packaging bugs behind a passing test.
:::

::: check
Your src-layout test run fails with a `FileNotFoundError` whose path ends in `site-packages/gnc/data/star_catalog.csv`. What does that path tell you, and what do you fix?
:::

::: answer
The path shows the code ran from the installed copy in `site-packages`, so the test is exercising the real package, and the file is absent from it. The source tree has the file; the build did not include it. Fix the build configuration to ship it as package data (with setuptools, for example `[tool.setuptools.package-data]` with `gnc = ["data/*.csv"]`), reinstall, and rerun.
:::

::: check
Your project uses the src layout. `python -m pytest` from the root passes, but running the tests from `/tmp` against a freshly installed wheel fails with `No module named 'tools'`. There is a `tools/` folder next to `src/`. Explain the difference.
:::

::: answer
Some module in the package imports from `tools`, which is not part of the package: it sits at the repository root, outside `src/`, so it was never built into the wheel. Running `python -m pytest` from the root still puts the root on `sys.path`, so `tools` was importable there. From `/tmp`, only the installed wheel is available, and it has no `tools`. Either move the helper into the package (for example `src/gnc/_units.py`) or make it a real, declared dependency.
:::

::: check
A project has `pythonpath = ["src"]` in its pytest settings. What does that line do to the benefit of the src layout, and what should replace it?
:::

::: answer
It adds `src/` to `sys.path` for every test run, so tests import the source folder directly again, exactly like the flat layout. Missing modules and data files in the built package become invisible again. Delete the line and install the package into the test environment instead, with a real install in CI.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| repository root | top folder of the project | on `sys.path` when you run `python -m` there |
| flat layout | package folder directly in the root | tests can import the source by accident |
| src layout | package inside `src/` | unimportable from the root; tests use the installed copy |
| `package-dir = {"" = "src"}` | setuptools: packages live in `src/` | `import gnc`, never `import src.gnc` |
| package data | non-Python files inside the package | must be declared or it is left out |
| `importlib.resources.files("gnc")` | find files inside the installed package | shows which copy ran |
| the complete check | build, install in a fresh env, test from outside the tree | what passes there passes for users |

The next lesson opens up `pyproject.toml`, the file you have been editing in pieces here, and shows what each table in it means, which program actually reads it, and how three different build backends turn the same source into the same installable package.

::: context ci-machine The robot that runs your tests
CI stands for continuous integration: a server that, on every change pushed to the shared repository, checks out the code on a clean machine, installs it and runs the tests. GitHub Actions, GitLab CI and Jenkins are common systems. The key word is *clean*. A CI machine has none of the leftover files, half-installed packages or handy folders that your laptop has built up over months. That is why a CI run so often finds bugs that "work on my machine", and why it is the right place to test the real install.
:::

::: context working-directory Where your terminal is standing
Every running program has a current working directory, the folder that relative paths start from. In a terminal, `pwd` prints it and `cd` changes it. Python uses it in two quiet ways: `open("data.csv")` looks there, and `python -m` and `python -c` put it first on `sys.path`. So the same command can import different code depending only on which folder you typed it in. Two engineers running "the same" test command from different folders may be testing two different copies of the package.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">flat layout</text>
  <rect x="20" y="26" width="140" height="30" rx="4" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="90" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">root/gnc  (found first)</text>
  <rect x="20" y="96" width="140" height="30" rx="4" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="90" y="115" font-size="11" text-anchor="middle" fill="#6c7a93">site-packages/gnc</text>
  <line x1="90" y1="56" x2="90" y2="92" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="90" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">never reached</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">src layout</text>
  <rect x="200" y="26" width="140" height="30" rx="4" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="270" y="45" font-size="11" text-anchor="middle" fill="#6c7a93">root: no gnc here</text>
  <rect x="200" y="96" width="140" height="30" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="270" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">site-packages/gnc</text>
  <line x1="270" y1="56" x2="270" y2="88" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="270,95 265,86 275,86" fill="#1d6fd1"/>
  <text x="270" y="142" font-size="11" text-anchor="middle" fill="#1d6fd1">the copy users get</text>
</svg>
```
:::

::: context package-data Files that are not code
Many engineering packages need more than code: an atmosphere table, gravity model coefficients, a default configuration, a star catalog for an attitude sensor. These files sit inside the package folder and must be listed in the build configuration, or setuptools leaves them out. Reading them with `importlib.resources.files(...)` instead of a path like `"gnc/data/x.csv"` matters too, because a hard-coded relative path starts from the working directory, which works in your repository and nowhere else.
:::

::: context ephemeris Tables of where things are
An ephemeris (plural ephemerides) is a table of where a body, such as the Moon, a planet or a satellite, is at each moment. NASA's Jet Propulsion Laboratory publishes planetary ephemerides as large binary files that mission-design and navigation tools read to know where Earth, the Sun and the Moon are on any date. A GNC package that bundles or downloads such a file must make sure the installed copy can find it, which is exactly the kind of data file a flat layout lets you forget.
:::

::: context fresh-venv Why fresh matters
A virtual environment is a private folder of installed packages for one project, made with `python -m venv`. A fresh one starts with nothing but pip. Testing there proves that everything your package needs is either inside it or declared as a dependency; nothing can be borrowed from something you happened to install months ago. The environment-tools lesson near the end of this module compares venv with uv and conda and says when each is the right tool.
:::

::: context wheel-file A package in a zip file
A wheel is the finished, ready-to-install form of a Python package. It is an ordinary zip archive with a `.whl` ending: inside are the package's files, exactly as they will be laid out in `site-packages`, plus a small folder of metadata. Installing a wheel is mostly unzipping it into the right place. Because it is a zip file, you can list its contents with Python's `zipfile` module and check that every module and data file is present before you ship it. The wheels lesson later in this module explains the name, the tags in it, and how it differs from a source distribution.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="90" height="50" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">src/gnc</text>
  <text x="55" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">source</text>
  <rect x="135" y="30" width="90" height="50" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">.whl file</text>
  <text x="180" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">zip archive</text>
  <rect x="260" y="30" width="90" height="50" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">site-packages</text>
  <text x="305" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">installed</text>
  <line x1="100" y1="55" x2="128" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="134,55 126,50 126,60" fill="#1f2a44"/>
  <line x1="225" y1="55" x2="253" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="259,55 251,50 251,60" fill="#1f2a44"/>
  <text x="114" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">build</text>
  <text x="242" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">install</text>
</svg>
```
:::

::: context editable-install Installing a pointer instead of a copy
An editable install, made with `pip install -e .`, puts a small pointer in `site-packages` that leads back to your source folder instead of copying the files. Edits show up immediately, with no reinstall. That convenience has a cost that connects straight back to this lesson: because the pointer leads to the source tree, an editable install can hide the same missing-file bugs the src layout is meant to expose. The editable-installs lesson shows the pointer files and exactly which bugs slip through.
:::
