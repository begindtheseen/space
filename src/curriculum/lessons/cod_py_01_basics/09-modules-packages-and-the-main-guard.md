---
id: l09-modules-packages-and-the-main-guard
title: Modules, imports, packages and the main guard
minutes: 20
covers:
  - Modules, import, packages, the if __name__ == "__main__" guard
---

Think about a family recipe for pancakes. You could copy it by hand into every notebook in the house. Then one day someone fixes a mistake — "two eggs, not three" — in one copy, and now the notebooks disagree. The better way is one recipe card in one box, and everyone who needs it goes to the box.

Code has the same problem. A 200-line analysis script is one file. The next script wants its unit conversions. The one after that wants its limit checks. If the only way to reuse them is to copy them, then within a month there are three versions of the same conversion, and one of them has the wrong constant. A **module** is the recipe box: a file of Python whose contents another file can use by name.

You have been importing since lesson 1. `import math` brings in a module from the **standard library**, the collection of modules that comes with Python. `import numpy as np`, in the modules after this one, brings in a **third-party package** — one written by other people and installed separately. Writing your own module is the same act from the other side. Put the functions in a file, and import the file.

The part of this lesson that matters most is also the smallest: `if __name__ == "__main__":`. Importing a module **runs it**, top to bottom. A file that starts a two-hour Monte Carlo simulation (one run thousands of times with random inputs) when it is imported cannot be imported for the one function you wanted. The guard is what separates "what this file defines" from "what this file does when you run it".

## A module is a file, and importing it runs it

Put the reusable parts in a file. The `print` on the line before the guard is only there to show you *when* the file's body runs. A real module would not print anything:

```python
# telemetry.py
"""Helpers for reading and summarising accelerometer records."""

DROPOUT = -999.0


def clean(samples):
    """Return the samples with dropout markers removed."""
    good = []
    for s in samples:
        if s != DROPOUT:
            good.append(s)
    return good


def mean(samples):
    """Arithmetic mean; 0.0 for an empty sequence."""
    if not samples:
        return 0.0
    return sum(samples) / len(samples)


print("telemetry module loaded")

if __name__ == "__main__":
    demo = [9.79, DROPOUT, 9.81]
    print("self-test:", mean(clean(demo)))
```

(`DROPOUT` is a marker value: a sensor that missed a reading writes $-999.0$ instead. `!=` reads "is not equal to".)

Run it directly, and both prints happen:

```bash
python3 telemetry.py
# telemetry module loaded
# self-test: 9.8
```

Sanity check on the self-test: after the dropout is removed, the mean of 9.79 and 9.81 is 9.80.

Now use it from another file. `import telemetry` ties the name `telemetry` to a **module object**. Everything defined at the top level of the file is reachable through a dot, read aloud as "telemetry dot clean":

```python
# report.py
import telemetry

raw = [9.79, -999.0, 9.81, 9.80]
good = telemetry.clean(raw)

print(good)
print(f"{telemetry.mean(good):.4f}")
print(telemetry.DROPOUT)
print(telemetry.__name__)
```

```bash
python3 report.py
# telemetry module loaded
# [9.79, 9.81, 9.8]
# 9.8000
# -999.0
# telemetry
```

Look at the first line of that output. `report.py` never printed it. `telemetry.py` did, while being imported. The import statement **[[executed the module's body|import-runs-body]]**:

1. The assignment to `DROPOUT` ran.
2. The two `def` statements ran — running a `def` is what creates a function.
3. The `print` ran.
4. The `if` was tested and was false, so the block under the guard was skipped.

The next section is why step 4 came out false.

## `__name__` and the main guard

Every module has a name stored in `__name__`, read "**[[dunder name|dunder-main]]**" — "dunder" is short for the double underscores on each side. Python sets it for you:

- When a file is **run directly**, its `__name__` is the string `"__main__"`.
- When a file is **imported**, its `__name__` is the module's own name. That is why `report.py` printed `telemetry` on its last line.

So the standard idiom reads exactly as it means: *if this file is the one being run, do this; if it is being imported, do not*. (`==` reads "equals".)

```python
# guard_shape.py
def main():
    """Everything this file does when it is run."""
    print("running as a script")   # running as a script


if __name__ == "__main__":
    main()
```

Here is the rule for what goes where. Everything that *does* something — running the analysis, reading a file, printing a report — goes under the guard, or into a function the guard calls. Everything that *defines* something — constants, functions — stays above it. Without the guard, importing your simulation module to reuse one function executes the whole run.

::: key
`if __name__ == "__main__":` guards code that should run only when the file is executed directly, not when it is imported. Without it, importing your simulation module to reuse one function would execute the whole run. `__name__` is `"__main__"` in the file you ran and the module's own name everywhere else.
:::

## Importing twice runs it once

Python keeps a **[[cache|sys-modules-cache]]** of modules — a store of things already fetched, called `sys.modules`. The first import executes the file and saves the module object there. Every later import of the same name finds it there and reuses that object:

```bash
python3 -c "import telemetry; import telemetry"
# telemetry module loaded
```

One line, not two. (`python3 -c "..."` runs the Python code in the quotes, as you saw in lesson 1.)

That has two consequences. First, a module's body is the wrong place for anything expensive or with a **side effect** — a change to the world outside the function, such as writing a file. It runs at a moment you do not choose (whenever some file first imports it), and it never runs again, so you cannot rely on it either. Second, editing a file has no effect on a REPL session that already imported it. Restart the interpreter.

## Four ways to import

```python
# import_forms.py
import math                      # the module object, used as math.sqrt
from math import sqrt, pi        # the names themselves, used bare
import statistics as stats       # the module object under a shorter name
from math import *               # every public name at once — avoid

print(math.sqrt(4.0))            # 2.0
print(sqrt(4.0), f"{pi:.5f}")    # 2.0 3.14159
print(stats.mean([1.0, 2.0]))    # 1.5
```

1. `import math` is the default. `math.sqrt` tells the reader where `sqrt` came from, which is what a reader needs.
2. `from math import sqrt, pi` is for names you use constantly. It is how `from pathlib import Path` will appear in lesson 11.
3. `import statistics as stats` gives the module a shorter name. Use it where the short name is an established **[[convention|np-convention]]**: `import numpy as np` is universal, and using anything else is unkind to your readers.
4. `from math import *` — read "from math import star" — pulls every public name into your file at once.

The fourth saves typing and costs you the ability to tell where anything came from. Worse, two star-imports can silently overwrite each other's names, so the meaning of your code depends on the order of your import lines. Do not use it.

## Where Python looks for a module

When you write `import x`, Python looks in **[[this order|search-order]]**:

1. `sys.modules`, the cache of modules already imported in this process.
2. The modules compiled into the interpreter program itself, listed in `sys.builtin_module_names`. `sys` is always among them. **[[Which others are|built-in-depends]]** depends on how your Python was built.
3. Each directory in `sys.path`, in order: the directory of the script you ran, then any directories named in the `PYTHONPATH` environment variable, then the standard library, then the `site-packages` directory where installed third-party packages live.

The first directory is the interesting one. The folder your script lives in is searched *before* the standard library. That is how `import telemetry` found your `telemetry.py` with no setup at all. It also means a file of yours whose name matches a standard library module wins.

```python
# wherefrom.py
import os
import sys

print(sys.path[0] == os.path.dirname(os.path.abspath(__file__)))   # True
```

`__file__` is the path of the file being run. `os.path.abspath` makes it a full path, and `os.path.dirname` keeps only the folder part. The check confirms that `sys.path[0]` is that file's own folder. Run a script from anywhere, and its own folder is where its imports are looked for first.

If the name is nowhere on the path, you get a specific error:

```bash
python3 -c "import flght"
# Traceback (most recent call last):
#   File "<string>", line 1, in <module>
# ModuleNotFoundError: No module named 'flght'
```

`ModuleNotFoundError` means one of three things: a typo (as here, `flght`), a package you have not installed into this environment (lesson 13), or a file that is not on the path because you ran the script from a different folder than you thought.

## Packages: a directory of modules

When one file is not enough, a **package** groups several. A package is a directory — a folder — containing a file named `__init__.py` ("dunder init"). That file marks the folder as importable, and it runs when the package is first imported:

```python
# flight/__init__.py
"""Small helpers shared by the test-stand analysis scripts."""

__version__ = "0.1.0"
```

```python
# flight/units.py
"""Unit conversions with their defining constants."""

NMI_TO_M = 1852.0                  # nautical mile, exact by definition
PSI_TO_PA = 6894.757293168361      # pound per square inch


def nmi_to_m(nmi):
    """Nautical miles to metres. 1 nmi = 1852 m exactly."""
    return nmi * NMI_TO_M


def psi_to_pa(psi):
    """Pounds per square inch to pascals."""
    return psi * PSI_TO_PA
```

The **[[directory layout|package-tree]]** is

```bash
ls flight
# __init__.py
# units.py
```

and a script sitting beside the `flight` folder imports from it with a dotted name:

```python
# main.py
import flight
from flight import units

print(units.nmi_to_m(100.0))          # 185200.0
print(f"{units.psi_to_pa(14.696):.1f}")   # 101325.4
print(flight.__version__)             # 0.1.0
```

```bash
python3 main.py
# 185200.0
# 101325.4
# 0.1.0
```

Check both numbers. 100 **[[nautical miles|nautical-mile]]** is $100 \times 1852 = 185\,200$ m, or 185.2 km exactly, because the nautical mile is *defined* as 1852 m. And $14.696 \times 6894.757 \approx 101\,325.4$ Pa, which is one standard atmosphere ($101\,325$ Pa) to the precision the input was written in. Both are the kind of conversion that must have its constant in exactly one file.

There are two ways to reach inside. `from flight import units` gives you the submodule. `from flight.units import nmi_to_m` gives you the function directly.

What `import flight` alone does *not* do is import the submodules. Only `__init__.py` runs. So `flight.units.nmi_to_m(1.0)` after a bare `import flight` raises `AttributeError`, unless `__init__.py` imported the submodule itself. Small packages often put `from flight import units` inside `__init__.py` for exactly that reason.

::: example Splitting a script that had grown too big
You have one file that reads a record, cleans it, computes statistics and prints a report. Now a second analysis needs the cleaning and the statistics, but not the report. Split it in two:

- `telemetry.py` — `DROPOUT`, `clean`, `mean`. Definitions only: no output, no file reading at import time.
- `report.py` — imports `telemetry`, does the work, prints.

`report.py` keeps its actions under `if __name__ == "__main__":` too. That way a third script can one day import `report` for one of its formatting helpers without printing a report as a side effect. The rule generalizes: **every file should be importable without doing anything**.

Checking you got it right takes one command. If `python3 -c "import report"` prints nothing and takes no time you can notice, the file is safe to import. If it prints a report, the file is a script pretending to be a module. The next person who wants one function out of it will copy that function instead — which is how a codebase ends up with three versions of a conversion.
:::

## Modules, scripts and notebooks

Many engineers first meet Python in a **Jupyter notebook**: a page of code "cells" you run one at a time, with the plots and tables shown right under each cell. Notebooks are excellent for exploring — load a file once, try a dozen plots against it.

A notebook is not a module, though, and the differences are exactly the things a team shipping code cares about.

- **Order.** Cells can be run in any order, and run again. The state a result depended on may be impossible to rebuild from the file.
- **Review.** The file is stored as **[[JSON|notebook-json]]** with the outputs embedded. A one-character change can produce a diff of thousands of lines that no reviewer can read.
- **Reuse.** As it stands, a notebook cannot be imported by another file or run under a test runner.

The working rule matches the rest of this lesson. Anything worth keeping moves into a `.py` module that the notebook imports. And before any result from a notebook is believed, the notebook is restarted and run top to bottom.

## Two naming traps

**Trap 1: your file hides a standard module.** A module of your own that shares a name with a standard library module shadows it, because the script's folder comes before the standard library on `sys.path`:

```python
# random.py
"""A file of your own, in the directory you run from."""

SEED = 42
```

```python
# jitter.py
import random

print(random.uniform(0.0, 1.0))
```

```bash
python3 jitter.py
# Traceback (most recent call last):
#   File ".../jitter.py", line 4, in <module>
#     print(random.uniform(0.0, 1.0))
#           ^^^^^^^^^^^^^^
# AttributeError: module 'random' has no attribute 'uniform'
```

The message is about an attribute, not about an import, and that is what makes it hard to place. `import random` *succeeded*. It imported the wrong `random`. The same happens with `csv.py`, `json.py`, `statistics.py`, `email.py` and every other standard library module that is an ordinary file.

A module compiled into the interpreter cannot be hidden this way, because step 2 of the search finds it before `sys.path` is looked at. On the usual Linux builds `math` is one of those, so a local `math.py` changes nothing there — while on a build where `math` is a separate file, the same `math.py` would take over. That inconsistency is why the rule has to be blunt rather than clever: never name a file after a module you might import, and if a name is short and generic, assume it is taken.

::: example Which file did the import actually find?
When a name leads to the wrong module, the module itself will tell you where it came from. Every module loaded from a file carries `__file__`, the path it was loaded from:

```python
# which_module.py
from pathlib import Path
import random

print(Path(random.__file__).name)
print(Path(random.__file__) == Path("random.py").resolve())
```

(`Path` is a tidy way to handle file paths, taught properly in lesson 11. `.name` is the last part of a path; `.resolve()` turns a relative path into a full one.)

Run it in the folder that still contains the `random.py` from the trap above:

```bash
python3 which_module.py
# random.py
# True
```

The file name alone tells you nothing, because the standard library's module is also called `random.py`. The full path is what settles it, and here it is the copy in the working folder. Delete that file and ask again:

```bash
rm random.py
python3 which_module.py
# random.py
# False
```

Now `random.__file__` points into the standard library, several folders away, and `random.uniform` exists again. That is two lines of diagnosis for a failure that otherwise looks like the standard library losing a function.

The same trick works for any import that behaves strangely, including third-party packages in lesson 13: `print(numpy.__file__)` tells you which environment's NumPy you are really running. The only modules without a `__file__` are the ones compiled into the interpreter — on this build, `math` is one, and `getattr(math, "__file__", None)` gives `None`.
:::

**Trap 2: the leftover `__pycache__` folder.** Python saves the translated form of every imported module — its **[[bytecode|pycache-files]]** — in a folder called `__pycache__`, so the next import is faster. It is rebuilt automatically, it should never be committed to version control, and deleting it is always safe.

::: warning
Do not put an expensive or side-effecting statement at a module's top level: reading a data file, opening a network connection, creating a directory, or starting a run. It executes on first import, at a moment you do not control, and never again. Put it in a function, and call that function from under the main guard.
:::

## Check yourself

::: check
A colleague's `sim.py` ends with 30 lines that set up a vehicle and run a 10-minute simulation, not indented under anything. You want to reuse its `atmosphere` function. What happens when you write `import sim`, and what is the fix to their file?
:::

::: answer
Importing `sim` executes the whole file, so the 10-minute simulation runs before your first line does — and it runs every time your script starts. You would get the function eventually, along with its output and its run time.

The fix is to put the 30 lines into a function, say `def main(): ...`, and call it under `if __name__ == "__main__": main()`. Then `python3 sim.py` behaves exactly as before, and `import sim` costs nothing.
:::

::: check
What does `__name__` hold inside `telemetry.py` when you run `python3 telemetry.py`, and when `report.py` does `import telemetry`?
:::

::: answer
`"__main__"` in the first case, and `"telemetry"` in the second. Python sets `__name__` to `"__main__"` for the file it was asked to run, and to the module's own name for every module it imports. That one difference is all the guard tests. There is nothing more to it: `"__main__"` is an ordinary string.
:::

::: check
Why does `python3 -c "import telemetry; import telemetry"` print the module's load message once rather than twice?
:::

::: answer
Because the first import executes the file and stores the resulting module object in `sys.modules` under the name `telemetry`. The second import finds the name already there and reuses the same object without running anything.

The consequence worth remembering: a module's body runs exactly once per process. So it is the wrong place for work you want repeated — and editing a module does not affect a REPL that has already imported it.
:::

::: check
You save a file called `csv.py` containing your own parsing helpers, in the folder of a script that also does `import csv` for the standard library reader. What happens, and what does the error look like?
:::

::: answer
Your file wins. The script's own folder is the first entry on `sys.path`, and `csv` is an ordinary-file standard library module rather than one compiled into the interpreter. So `import csv` loads your module, and the first use of the real one fails with an `AttributeError` such as `module 'csv' has no attribute 'reader'`.

That error says nothing about imports, so it sends you looking in the wrong place. `print(csv.__file__)` would show the path to your file. Rename your file to something like `csv_helpers.py`.
:::

::: check
What is the minimum needed to turn a directory of modules into a package, and what does `import flight` alone actually import?
:::

::: answer
A file named `__init__.py` in the directory, which may be empty. That is what marks the folder as a package and gives it a body to run on first import.

`import flight` runs only `__init__.py` and ties the name `flight` to the package. It does not import the submodules, so `flight.units` raises `AttributeError` unless `__init__.py` imported `units` itself or you wrote `from flight import units`. The version string in the example is reachable after a bare `import flight` precisely because it is defined in `__init__.py`.
:::

## Summary

| Item | Statement |
| --- | --- |
| Module | A `.py` file; `import m` executes its body once and binds a module object |
| Access | `m.name` for anything defined at the module's top level |
| `import` forms | `import m`, `from m import a, b`, `import m as x`; never `from m import *` |
| Caching | `sys.modules` holds imported modules; a second import does not re-execute |
| `__name__` | `"__main__"` in the file you ran, the module's own name when imported |
| Main guard | `if __name__ == "__main__": main()` — actions here, definitions above |
| Search order | `sys.modules`, then built-in modules, then `sys.path`: script directory, `PYTHONPATH`, standard library, `site-packages` |
| Missing module | `ModuleNotFoundError: No module named 'x'` — typo, not installed, or wrong directory |
| Package | A directory with `__init__.py`; `from pkg import mod`, `pkg.mod.f()` |
| Shadowing | A local `random.py` or `csv.py` beats the standard library; a compiled-in module (like `math` on most Linux builds) cannot be shadowed |
| Which file? | `print(m.__file__)` shows where module `m` was loaded from |
| Notebooks | For exploring; code worth keeping moves into modules the notebook imports |
| Importability | Every file should be importable with no visible effect and no measurable cost |

The next lesson is about the other half of a reusable module: what it does when something goes wrong. A file that is missing, a line that will not parse, a channel that is not in the table — exceptions are how Python reports these, and how your code decides which ones to handle.

::: context import-runs-body What an import actually does
`import telemetry` is not a "copy and paste". Python finds the file, runs every top-level line in order inside a fresh module, and then ties your name to that module object. Only the guarded block is skipped, because inside an import `__name__` is `"telemetry"`, not `"__main__"`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="20" width="110" height="36" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="67" y="43" font-size="12" text-anchor="middle" fill="#1f2a44">report.py</text>
  <text x="67" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">import telemetry</text>
  <line x1="122" y1="38" x2="158" y2="38" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="166,38 156,33 156,43" fill="#1f2a44"/>
  <rect x="168" y="10" width="186" height="150" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="11" fill="#1d6fd1">DROPOUT = -999.0   ran</text>
  <text x="180" y="50" font-size="11" fill="#1d6fd1">def clean(...)      ran</text>
  <text x="180" y="70" font-size="11" fill="#1d6fd1">def mean(...)       ran</text>
  <text x="180" y="90" font-size="11" fill="#1d6fd1">print("loaded")     ran</text>
  <rect x="174" y="104" width="174" height="46" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="180" y="122" font-size="11" fill="#b4232c">if __name__ == "__main__":</text>
  <text x="180" y="140" font-size="11" fill="#b4232c">skipped on import</text>
</svg>
```
:::

::: context dunder-main Where the name "__main__" comes from
The file you hand to `python3` is itself loaded as a module — one whose name is `"__main__"`, meaning "the top-level program". You can see it in the cache: `sys.modules["__main__"]` is the module for the script you ran. Names that start and end with two underscores are Python's own hooks, and people say "dunder" to save breath: `__init__` is "dunder init", `__file__` is "dunder file".
:::

::: context sys-modules-cache A dictionary of everything loaded
`sys.modules` is an ordinary Python dictionary from module names to module objects. Many modules are already in it before your first line runs, because Python loads them while starting up. If you are working in a REPL and really need a changed file without restarting, `importlib.reload(telemetry)` re-runs the file into the existing module object. It has sharp edges — objects made before the reload keep the old code — so restarting is the dependable habit.
:::

::: context np-convention Short names everyone agrees on
Scientific Python has a set of short import names that almost every project uses: `import numpy as np`, `import pandas as pd`, `import matplotlib.pyplot as plt`. They are not enforced by Python — you could write `import numpy as banana` and it would work. They are kept because an engineer reading someone else's analysis script sees `np.` and instantly knows what it is. Breaking the convention costs every future reader a moment of confusion.
:::

::: context search-order The order of the search
Python stops at the first place that has the name. Because your script's folder comes before the standard library, a file of yours can hide a standard module — but not one already cached or compiled in.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="30" y="10" width="300" height="26" rx="5" fill="#8fb8f0"/>
    <rect x="30" y="46" width="300" height="26" rx="5" fill="#8fb8f0"/>
    <rect x="30" y="82" width="300" height="26" rx="5" fill="#f2b880"/>
    <rect x="30" y="118" width="300" height="26" rx="5" fill="#fff"/>
    <rect x="30" y="154" width="300" height="26" rx="5" fill="#fff"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="42" y="28">1  sys.modules (already imported)</text>
    <text x="42" y="64">2  compiled into the interpreter</text>
    <text x="42" y="100">3  your script's folder</text>
    <text x="42" y="136">4  PYTHONPATH, standard library</text>
    <text x="42" y="172">5  site-packages (installed)</text>
  </g>
  <line x1="14" y1="16" x2="14" y2="178" stroke="#b4232c" stroke-width="2"/>
  <polygon points="14,186 9,176 19,176" fill="#b4232c"/>
</svg>
```
:::

::: context built-in-depends Compiled in, or a file?
Some standard modules are written in C and linked straight into the `python3` program; others are separate files, either Python source or compiled extension files. Which is which is decided when your Python is built, so it differs between, say, a Linux distribution's Python and one from another installer. Ask your own interpreter: `import sys; print("math" in sys.builtin_module_names)`. On the Python used to check this lesson, `math`, `time` and `sys` are compiled in, and `random` is not.
:::

::: context package-tree A package on disk
A package is a folder with an `__init__.py` in it. The `__pycache__` folder appears on its own after the first import.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="16" y="24" font-size="13" fill="#1f2a44">project/</text>
  <g stroke="#6c7a93" stroke-width="1.5" fill="none">
    <path d="M28 32 V122"/>
    <path d="M28 46 H48"/>
    <path d="M28 122 H48"/>
    <path d="M64 56 V104"/>
    <path d="M64 74 H84"/>
    <path d="M64 104 H84"/>
  </g>
  <text x="52" y="50" font-size="13" fill="#1d6fd1">flight/</text>
  <text x="88" y="78" font-size="12" fill="#1f2a44">__init__.py</text>
  <text x="180" y="78" font-size="11" fill="#6c7a93">runs on import flight</text>
  <text x="88" y="108" font-size="12" fill="#1f2a44">units.py</text>
  <text x="180" y="108" font-size="11" fill="#6c7a93">flight.units</text>
  <text x="52" y="126" font-size="12" fill="#1f2a44">main.py</text>
  <text x="180" y="126" font-size="11" fill="#6c7a93">from flight import units</text>
</svg>
```
:::

::: context nautical-mile Why a mile of the sea is 1852 metres
The nautical mile comes from navigation: it was meant to be one minute of arc of latitude, one sixtieth of a degree, so that distances on a chart match angles on the globe. Because Earth is not a perfect sphere, that length varies a little with latitude, so it was fixed by international agreement in 1929 as exactly 1852 m. Ships and aircraft still navigate by it, which is why a conversion constant like this belongs in one shared module.
:::

::: context notebook-json What a notebook file really is
A `.ipynb` file is JSON: a text format of nested lists and dictionaries, which lesson 11 teaches you to read. Every cell's code, every output — including plots stored as long runs of encoded image data — and a counter of the order cells were run all sit in that one file. Re-running a single plot changes hundreds of lines of it. Tools exist to strip outputs before committing, but the simpler rule is the one in the lesson: logic lives in `.py` modules.
:::

::: context pycache-files What is in the cache folder
Before running a module, Python translates it into **bytecode**, a compact list of instructions for its own virtual machine. It saves that in `__pycache__` under a name that includes the Python version, such as `telemetry.cpython-311.pyc`, and reuses it until the `.py` file changes. Adding `__pycache__/` to your project's `.gitignore` keeps it out of version control.
:::
