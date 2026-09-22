---
id: l09-modules-packages-and-the-main-guard
title: Modules, imports, packages and the main guard
minutes: 19
covers:
  - Modules, import, packages, the if __name__ == "__main__" guard
---

A 200-line analysis script is one file. The next one reuses its unit conversions, and the one after that reuses its limit checks, and if the only way to reuse them is to copy them, then within a month there are three versions of the same conversion and one of them has the wrong constant. A *module* is the mechanism that prevents this: a file of Python whose contents another file can use by name.

You have been importing since lesson 1. `import math` brings in a module of the standard library. `import numpy as np`, in the modules after this one, brings in a third-party package. Writing your own is the same act from the other side, and it takes one thing: put the functions in a file, and import the file.

The part of this lesson that matters most is the smallest: `if __name__ == "__main__":`. Importing a module **runs it**, top to bottom. A file that starts a two-hour Monte Carlo when it is imported cannot be imported for the one function you wanted, and the guard is what separates "what this file defines" from "what this file does when you run it".

## A module is a file, and importing it runs it

Put the reusable parts in a file. The `print` on the last line before the guard is there to show you when the file's body runs; a real module would not print anything:

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

Run it directly and both prints happen:

```bash
python3 telemetry.py
# telemetry module loaded
# self-test: 9.8
```

Now use it from another file. `import telemetry` binds the name `telemetry` to a *module object*, and everything defined at the top level of the file is reachable through a dot:

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

Look at the first line of that output. `report.py` never printed it — `telemetry.py` did, while being imported. The import statement executed the module's body: the `def` statements ran (which is what creates the functions), the assignment to `DROPOUT` ran, and so did the `print`. What did *not* run is the block under the guard, and the next section is why.

## `__name__` and the main guard

Every module has a `__name__`. When a file is run directly, Python sets its `__name__` to the string `"__main__"`. When it is imported, `__name__` is the module's own name — which is why `report.py` printed `telemetry` on the last line.

So the standard idiom reads exactly as it means: *if this file is the one being run, do this; if it is being imported, do not*.

```python
# guard_shape.py
def main():
    """Everything this file does when it is run."""
    print("running as a script")   # running as a script


if __name__ == "__main__":
    main()
```

Everything that *does* something — running the analysis, reading a file, printing a report — goes under the guard or into a function the guard calls. Everything that *defines* something stays above it. Without the guard, importing your simulation module to reuse one function executes the whole run.

::: key
`if __name__ == "__main__":` guards code that should run only when the file is executed directly, not when it is imported. `__name__` is `"__main__"` in the file you ran and the module's own name everywhere else.
:::

## Importing twice runs it once

Python caches modules. The first import executes the file and stores the module object in `sys.modules`; every later import of the same name finds it there and binds the existing object:

```bash
python3 -c "import telemetry; import telemetry"
# telemetry module loaded
```

One line, not two. This is why a module's body is the wrong place for anything expensive or anything with a side effect: it runs at an unpredictable moment — whenever some file first imports it — and it never runs again, so you cannot rely on it either. It is also why changing a file has no effect on a REPL session that already imported it; restart the interpreter.

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

The first form is the default: `math.sqrt` says where `sqrt` came from, which is what a reader needs. The second is for names you use constantly, and it is how `from pathlib import Path` will appear in the next lesson. The third is a convention with established short names — `import numpy as np` is universal, and using anything else is unkind.

The fourth, `from math import *`, imports every public name into your file at once. It saves typing and costs you the ability to tell where anything came from; worse, two star-imports can silently overwrite each other's names, so the meaning of your code depends on the order of your import lines. Do not use it.

## Where Python looks for a module

When you write `import x`, Python looks in this order:

1. `sys.modules`, the cache of modules already imported in this process.
2. The modules compiled into the interpreter itself, listed in `sys.builtin_module_names` — `math`, `sys` and `time` are among them.
3. Each directory in `sys.path`, in order: the directory of the script you ran, then any directories named in the `PYTHONPATH` environment variable, then the standard library, then the `site-packages` directory where installed third-party packages live.

The first entry is the interesting one. The directory your script lives in is searched before the standard library, so `import telemetry` found your `telemetry.py` with no configuration at all — and a file of yours whose name collides with a standard library module wins.

```python
# wherefrom.py
import os
import sys

print(sys.path[0] == os.path.dirname(os.path.abspath(__file__)))   # True
```

`__file__` is the path of the module being run, and the check confirms that `sys.path[0]` is that file's own directory. Run a script from anywhere and its own directory is where its imports are found first.

If the name is nowhere on the path, you get a specific error:

```bash
python3 -c "import flght"
# Traceback (most recent call last):
#   File "<string>", line 1, in <module>
# ModuleNotFoundError: No module named 'flght'
```

`ModuleNotFoundError` means one of three things: a typo, a package you have not installed into this environment (lesson 13), or a file that is not on the path because you ran the script from a different directory than you thought.

## Packages: a directory of modules

When one file is not enough, a *package* groups several. A package is a directory containing a file named `__init__.py`, which marks the directory as importable and runs when the package is first imported:

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

The directory layout is

```bash
ls flight
# __init__.py
# units.py
```

and a script beside the `flight` directory imports from it with a dotted name:

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

100 nautical miles is 185.2 km exactly, because the nautical mile is defined as 1852 m; and 14.696 psi is 101,325.4 Pa, which is one standard atmosphere to the precision the input was written in. Both are the kind of conversion that must have its constant in exactly one file.

`from flight import units` gives you the submodule; `from flight.units import nmi_to_m` gives you the function directly. What `import flight` alone does *not* do is import the submodules — only `__init__.py` runs — so `flight.units.nmi_to_m(1.0)` after a bare `import flight` raises `AttributeError` unless `__init__.py` imported the submodule itself. Small packages often put `from flight import units` in `__init__.py` for exactly that reason.

::: example Splitting a script that had grown too big
You have one file that reads a record, cleans it, computes statistics and prints a report, and now a second analysis needs the cleaning and the statistics but not the report. Split it:

- `telemetry.py` — `DROPOUT`, `clean`, `mean`. Definitions only, no output, no file reading at import time.
- `report.py` — imports `telemetry`, does the work, prints.

`report.py` keeps its actions under `if __name__ == "__main__":` too, so that a third script can one day import `report` for one of its formatting helpers without printing a report as a side effect. The rule generalises: **every file should be importable without doing anything**.

The test for whether you have it right is one command. If `python3 -c "import report"` prints nothing and takes no measurable time, the file is safe to import. If it prints a report, the file is a script pretending to be a module, and the next person to want one function out of it will copy that function instead — which is how a codebase ends up with three versions of a conversion.
:::

## Two naming traps

A module of your own that shares a name with a standard library module shadows it, because the script's directory comes before the standard library on `sys.path`:

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

The message is about an attribute, not about an import, which is what makes it hard to place: `import random` succeeded — it imported the wrong `random`. The same happens with `csv.py`, `json.py`, `statistics.py`, `email.py` and every other pure-Python module of the standard library.

Curiously, a file called `math.py` does *not* do this, because `math` is compiled into the interpreter and step 2 of the search finds it before `sys.path` is consulted at all. That inconsistency is the reason the rule has to be blunt rather than clever: never name a file after a module you might import, and if a name is suspiciously short and generic, assume it is taken.

::: example Which file did the import actually find?
When a name resolves to the wrong module, the module itself will tell you where it came from. Every imported module carries `__file__`, the path it was loaded from:

```python
# which_module.py
from pathlib import Path
import random

print(Path(random.__file__).name)
print(Path(random.__file__) == Path("random.py").resolve())
```

Run in the directory that still contains the `random.py` from the previous section:

```bash
python3 which_module.py
# random.py
# True
```

The file name alone tells you nothing — the standard library's module is also called `random.py`. The full path is what settles it, and here it is the copy in the working directory. Delete that file and ask again:

```bash
rm random.py
python3 which_module.py
# random.py
# False
```

Now `random.__file__` points into the standard library instead, several directories away, and `random.uniform` exists again. Two lines of diagnosis for a failure that otherwise looks like the standard library losing a function.

The same trick works for any import that behaves strangely, including third-party packages in lesson 13: `print(numpy.__file__)` says which environment's NumPy you are actually running. The only modules without a `__file__` are the ones compiled into the interpreter, such as `math` — and that absence is itself the answer to why a local `math.py` never shadows anything.
:::

The second trap is the leftover `__pycache__` directory. Python caches the compiled bytecode of every imported module there. It is regenerated automatically, it should never be committed to version control, and deleting it is always safe.

::: warning
Do not put an expensive or side-effecting statement at a module's top level: reading a data file, opening a network connection, creating a directory, or starting a run. It executes on first import, at a moment you do not control, and never again. Put it in a function, and call that function from under the main guard.
:::

## Check yourself

::: check
A colleague's `sim.py` ends with 30 lines that set up a vehicle and run a 10-minute simulation, not indented under anything. You want to reuse its `atmosphere` function. What happens when you write `import sim`, and what is the one-line fix to their file?
:::

::: answer
Importing `sim` executes the whole file, so the 10-minute simulation runs before your first line does — and it runs every time your script starts. You would get the function eventually, along with its output and its run time. The fix is to put the 30 lines into a function, say `def main(): ...`, and call it under `if __name__ == "__main__": main()`. Then `python3 sim.py` behaves exactly as before and `import sim` costs nothing.
:::

::: check
What does `__name__` hold inside `telemetry.py` when you run `python3 telemetry.py`, and when `report.py` does `import telemetry`?
:::

::: answer
`"__main__"` in the first case, and `"telemetry"` in the second. Python sets `__name__` to `"__main__"` for the file it was asked to run, and to the module's own name for every module it imports. That single difference is what the guard tests; there is nothing more to it, and `__main__` is an ordinary string.
:::

::: check
Why does `python3 -c "import telemetry; import telemetry"` print the module's load message once rather than twice?
:::

::: answer
Because the first import executes the file and stores the resulting module object in `sys.modules` under the name `telemetry`. The second import finds the name already there and binds the same object without re-executing anything. The consequence worth remembering: a module's body runs exactly once per process, so it is the wrong place for work you want repeated — and editing a module does not affect a REPL that has already imported it.
:::

::: check
You save a file called `csv.py` containing your own parsing helpers, in the directory of a script that also does `import csv` for the standard library reader. What happens, and what does the error look like?
:::

::: answer
Your file wins: the script's own directory is the first entry on `sys.path`, and `csv` is a pure-Python standard library module rather than one compiled into the interpreter. `import csv` binds your module, and the first use of the real one fails with an `AttributeError` such as `module 'csv' has no attribute 'reader'` — an error that says nothing about imports and sends you looking in the wrong place. Rename your file to something like `csv_helpers.py`.
:::

::: check
What is the minimum needed to turn a directory of modules into a package, and what does `import flight` alone actually import?
:::

::: answer
A file named `__init__.py` in the directory, which may be empty; that is what marks the directory as a package and gives it a body to run on first import. `import flight` runs only `__init__.py` and binds the name `flight`. It does not import the submodules, so `flight.units` raises `AttributeError` unless `__init__.py` imported `units` itself or you wrote `from flight import units`. The version string in the example is reachable after a bare `import flight` precisely because it is defined in `__init__.py`.
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
| Shadowing | A local `random.py` or `csv.py` beats the standard library; `math.py` does not, because `math` is built in |
| Importability | Every file should be importable with no visible effect and no measurable cost |

The next lesson is about the other half of a reusable module: what it does when something goes wrong. A file that is missing, a line that will not parse, a channel that is not in the table — exceptions are how Python reports these, and how your code decides which ones to handle.
