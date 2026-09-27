---
id: l01-packages-and-imports
title: Packages, __init__.py and relative imports
minutes: 19
covers:
  - __init__.py, package versus namespace package, relative imports
---

Think of a kitchen. One drawer holds forks, one holds knives, one holds the weird gadgets. Nobody puts every utensil in one giant pile, because then you could never find anything. And when a friend helps you cook, you can say "the peeler is in the gadget drawer" and they find it.

Python code grows the same way. A single script is fine for twenty lines. At two thousand lines you want drawers: one file for coordinate frames, one for orbits, one for the navigation filter. At twenty thousand lines you want drawers inside cabinets. A **module** is one drawer — a single `.py` file. A **package** is a cabinet — a folder of modules that you import under one shared name, like `gnc.orbits` or `gnc.nav.imu`.

A flight software or simulation team lives inside packages all day. The guidance code imports the frames code, the Monte Carlo runner imports the vehicle model, and a test imports all of it. When an import goes wrong, the error messages can be strange, and people lose whole afternoons to them. This lesson shows you exactly what `import` does, what the file named `__init__.py` is for, what happens when it is missing, and how to write imports between files inside one package. Everything here is the ground floor for the rest of the module, which turns a package into something other people can install.

## What import actually does

When you write `import gnc`, Python has to find something called `gnc`. It does not search your whole disk. It walks a short list of folders, in order, and takes the first match. That list is called the **[[search path|search-path]]**, and Python keeps it in a plain list named `sys.path` (read it "sys dot path").

```python
import sys

for entry in sys.path[:3]:
    print(repr(entry))
# ''
# '/usr/lib/python311.zip'
# '/usr/lib/python3.11'
```

That first entry, the empty string, means "the current folder". When you start Python with `python -c` or `python -m`, the current folder goes at the front of the list. When you run a script with `python path/to/script.py`, the folder that holds the script goes there instead. Either way, your own folder is searched *before* the standard library and before anything you installed. Remember this, because the next lesson is all about it.

In each folder on the path, Python looks for one of these, named `gnc`:

1. a folder `gnc/` with a file `__init__.py` inside — a **regular package**;
2. a file `gnc.py` — a plain module (or a compiled extension, such as `gnc.cpython-311-x86_64-linux-gnu.so`);
3. a folder `gnc/` with no `__init__.py` — a candidate **namespace package**, which you will meet below.

Once found, the module's code runs, top to bottom, once. The finished module object is stored in a dictionary called `sys.modules`, the **[[module cache|module-cache]]**. The next `import gnc` anywhere in the program finds it there and does not run the file again.

::: warning Do not name your file after a library
Because your folder comes first on `sys.path`, a file of yours called `statistics.py`, `random.py` or `logging.py` hides the standard library module with the same name. Every `import statistics` in the program, including ones inside other libraries, now gets your file. If an import suddenly returns something that has none of the functions you expected, print its `__file__` attribute to see which file Python really loaded.
:::

## A package is a folder with a front door

Here is a small guidance, navigation and control package, `gnc`. Every folder in it has an `__init__.py` file — read it "dunder init", where **[[dunder|dunder]]** is short for "double underscore".

```text
gnc/
    __init__.py
    constants.py
    orbits.py
    nav/
        __init__.py
        filters.py
        imu.py
```

The inner folder `nav` is a **subpackage** — a package inside a package. Its full name is `gnc.nav`, and the file `imu.py` inside it is the module `gnc.nav.imu`. The dots in the name follow the folders on disk.

The `__init__.py` file is the package's front door. When anybody imports `gnc`, or anything inside it, Python runs `gnc/__init__.py` first. Whatever names that file defines become the attributes of the package. Here is ours:

```python
# gnc/__init__.py
"""GNC toolkit: frames, orbits and navigation helpers."""
from .orbits import circular_speed

__all__ = ["circular_speed"]
__version__ = "0.1.0"
```

And the module it pulls from:

```python
# gnc/orbits.py
import math

from .constants import MU_EARTH, R_EARTH


def circular_speed(altitude_m):
    """Speed of a circular orbit at the given altitude, in m/s."""
    r = R_EARTH + altitude_m
    return math.sqrt(MU_EARTH / r)
```

where `gnc/constants.py` holds `MU_EARTH = 3.986e14` (Earth's gravitational parameter, in $\mathrm{m^3/s^2}$) and `R_EARTH = 6_371_000.0` (Earth's mean radius, in meters).

That short `__init__.py` does three jobs.

- **It marks a regular package.** Its presence tells Python "this folder is one package, and it lives here and only here."
- **It controls what the package exports.** Because it imports `circular_speed` from the `orbits` module, users can write `gnc.circular_speed(...)` without knowing which file the function lives in. You can later move the function to another file, keep this line pointing at it, and nobody's code breaks. That list of names you promise to users is the package's **public interface**.
- **It lists the public names in `__all__`.** The special list `__all__` decides what `from gnc import *` hands over. Names that start with an underscore, like `_helper`, are treated as private by convention.

```python
from gnc import *

print(sorted(k for k in dir() if not k.startswith("__")))
# ['circular_speed']
```

::: warning Keep __init__.py light
Every import of any part of the package runs `__init__.py` first. If it imports a big plotting library or reads a file from disk, then `import gnc.constants` becomes slow or fails on a machine without that library. Put re-exports and a version string in it. Put real work in modules.
:::

::: example Tracing one import, file by file
Start Python in the folder that holds `gnc/`, and type `import gnc.nav.imu`. Here is exactly what runs, in order.

**Step 1.** Python needs `gnc` first. It finds the folder `gnc/` with an `__init__.py` in the current folder, which is first on `sys.path`. It runs `gnc/__init__.py`.

**Step 2.** That file says `from .orbits import circular_speed`. So `gnc/orbits.py` runs now, which in turn runs `gnc/constants.py`. Three files have run, and `sys.modules` holds `gnc`, `gnc.orbits` and `gnc.constants`.

**Step 3.** Python needs `gnc.nav`. It looks inside the `gnc` package's own folder (not all of `sys.path`), finds `nav/__init__.py`, and runs it.

**Step 4.** Finally it runs `gnc/nav/imu.py`.

Now call the function the package exported, for the International Space Station's height of about $400\,\mathrm{km}$:

```python
import gnc

print(round(gnc.circular_speed(400_000), 1))
# 7672.6
```

Check it by hand. The orbit radius is $r = 6\,371\,000 + 400\,000 = 6\,771\,000\,\mathrm{m}$. The speed is

$$
v = \sqrt{\frac{\mu}{r}} = \sqrt{\frac{3.986 \times 10^{14}}{6.771 \times 10^{6}}} \approx 7673\,\mathrm{m/s}.
$$

About $7.7\,\mathrm{km/s}$, the speed every low-orbit spacecraft moves at, so the package works. If you now type `import gnc` a second time, nothing prints and nothing runs: the module cache already has it.
:::

## Namespace packages: a folder without a front door

Since Python 3.3, a folder with *no* `__init__.py` can still be imported. It becomes a **namespace package** — a package with no single home folder, whose pieces can be spread over several folders on `sys.path`. The rules come from a Python design document called **[[PEP 420|pep-420]]**.

Here is how Python treats a folder named `orbit/` without an `__init__.py`. It does not stop. It notes the folder down as a possible piece, called a **portion**, and keeps searching the rest of `sys.path`. Then:

- if it later finds a regular package or a module called `orbit`, that one wins, and the portions it noted are thrown away;
- if it reaches the end of the path and found only portions, it glues all of them together into one namespace package.

The gluing is the whole point. Two teams can ship separate installable pieces that share the top-level name. Here two folders each hold part of `orbit`:

```text
team_nav/orbit/nav/__init__.py      # def fuse(): return "nav"
team_prop/orbit/prop/__init__.py    # def isp(): return 311
```

```text
$ PYTHONPATH=team_nav:team_prop python3 -c "
import orbit
print(orbit.__file__)
print(len(orbit.__path__))
from orbit.nav import fuse
from orbit.prop import isp
print(fuse(), isp())"
None
2
nav 311
```

(`PYTHONPATH` is an environment variable whose folders get added to `sys.path`.) A namespace package has no file, so its `__file__` is `None`. Its `__path__`, the list of folders Python searches for its submodules, has two entries — one from each team.

That flexibility is also the danger. Watch what happens when someone on the propulsion team adds an empty `__init__.py` to their `orbit/` folder, meaning to tidy up:

```text
$ touch team_prop/orbit/__init__.py
$ PYTHONPATH=team_nav:team_prop python3 -c "from orbit.nav import fuse"
ModuleNotFoundError: No module named 'orbit.nav'
```

Nothing in the navigation team's folder changed, yet their code vanished. The propulsion folder is now a regular package, a regular package beats namespace portions, and a regular package lives in exactly one folder.

Stray folders cause the opposite surprise. Say the current folder holds a data folder called `config/`, full of YAML settings files and no Python at all. Somebody expects `import config` to load the team's settings module, but on this machine that module was never installed:

```text
$ python3 -c "import config; print(config.__file__); config.load('sim.yaml')"
None
AttributeError: module 'config' has no attribute 'load'
```

The import *succeeded*. Python found a folder, made an empty namespace package out of it, and the error only showed up one line later. On a machine where the real `config` module is installed, the real one wins, because a regular module beats namespace portions. So the bug appears only on some machines, and it points at the wrong line. That is what "baffling" looks like in practice.

::: key
Why write `__init__.py` explicitly? It marks a regular package, controls what the package exports, and avoids ambiguity with implicit namespace packages, which silently merge directories and produce baffling import behaviour in a large **[[monorepo|monorepo]]**.
:::

So the rule of thumb is short. Give every folder of your own package an `__init__.py`. Use a namespace package only when you really mean "one name, many separately installed pieces" — a company-wide `acme.` prefix shared by dozens of independently released libraries is the classic case.

::: example Regular or namespace? Reading the evidence
You are handed an unknown module `m` and asked which kind of package it is. Three attributes tell you.

**Step 1.** Print `m.__file__`. The regular package `gnc` gives the path ending in `gnc/__init__.py`. The namespace package `orbit` gives `None`.

**Step 2.** Print `m.__path__`. The regular package gives a plain list with one folder. The namespace package gives a special list type, `_NamespacePath`, with one entry per portion. For `orbit` that was 2 entries.

**Step 3.** Look at the module's repr, the text you get from `print(m)`. A namespace package prints with `NamespaceLoader` in it:

```text
<module 'config' (<_frozen_importlib_external.NamespaceLoader object at 0x7f...>)>
```

If a module you expected to have functions prints like that, you have found a stray folder, not your code.
:::

## Relative imports: directions from where you stand

Inside a package, files import each other all the time. You can give the full address, the **absolute import**:

```python
from gnc.constants import R_EARTH
```

Or you can give directions starting from where you are, the **relative import**. A leading dot means "the package I am in". Each extra dot climbs one level up, like `..` in a terminal:

```python
# gnc/nav/imu.py   (this module is gnc.nav.imu; its package is gnc.nav)
from ..constants import R_EARTH   # two dots: up to gnc, then constants
from . import filters             # one dot: gnc.nav, then filters


def describe():
    return f"IMU model on a planet of radius {R_EARTH / 1000:.0f} km, filter={filters.NAME}"
```

Read `from ..constants import R_EARTH` aloud as "from the constants module one level up, import R underscore EARTH".

Python turns a relative import into an absolute name using the module's own **package name**, stored in its `__package__` attribute. For `gnc.nav.imu`, that is `gnc.nav`. The standard library can show you the arithmetic:

```python
import importlib.util

print(importlib.util.resolve_name(".filters", "gnc.nav"))    # gnc.nav.filters
print(importlib.util.resolve_name("..constants", "gnc.nav"))  # gnc.constants
```

Here is the step-by-step rule. Take the package name and split it at the dots: `gnc.nav` is the list `gnc`, `nav`. One dot keeps all of it. Each extra dot chops one piece off the end. Then add the rest of the name. Two dots on `gnc.nav` chops `nav`, leaving `gnc`, then adds `constants`, giving `gnc.constants`.

Relative imports are handy. If the whole package gets renamed from `gnc` to `gnc_core`, none of the relative imports inside it need editing. Absolute imports are easier to read and to search for. Many teams use absolute imports everywhere except between close neighbors. Either is fine. Mixing both randomly in one file is what hurts.

### The error everyone meets once

Run that file directly, the way you would run a script:

```text
$ python3 gnc/nav/imu.py
Traceback (most recent call last):
  File ".../gnc/nav/imu.py", line 1, in <module>
    from ..constants import R_EARTH
ImportError: attempted relative import with no known parent package
```

A file run as a script is not imported as `gnc.nav.imu`. Python names it `__main__`, and its package name is empty. There is nothing to climb up from, so the dots mean nothing.

The fix is to ask Python to run the module *by its package name*, with the **[[-m switch|dash-m]]**, from the folder that holds `gnc/`:

```text
$ python3 -m gnc.nav.imu
```

Now Python imports `gnc`, then `gnc.nav`, then runs `imu` with its package name set to `gnc.nav`, and the relative imports work.

::: warning Too many dots
Dots can only climb as far as the top of the package. In `gnc/nav/imu.py`, a line `from ...x import y` asks for three levels when there are only two (`gnc.nav`), and Python stops with `ImportError: attempted relative import beyond top-level package`. The fix is never to add a folder to `sys.path` by hand; it is to count the dots again, or to use the absolute name.
:::

::: key
A relative import (`from . import x`, `from ..pkg import y`) resolves against the importing module's own package, `__package__`. It works only inside a package, so run package code with `python -m package.module`, not `python path/to/file.py`.
:::

One more trap lives here. If `gnc/orbits.py` imports from `gnc/nav/imu.py` and `imu.py` imports back from `orbits.py` at the top of the file, you have a **[[circular import|circular-import]]**. One of them runs while the other is only half finished, and you get an `ImportError` that says "cannot import name … (most likely due to a circular import)". Fix it by moving the shared piece into a third module both can import.

## Check yourself

::: check
You run `python3 -c "import gnc; print(gnc.__version__)"` twice in a row, in two separate terminal commands. Does `gnc/__init__.py` run once or twice? And inside one Python program, if three different modules all say `import gnc`, how many times does it run?
:::

::: answer
Across two separate commands it runs twice: each command starts a fresh Python process with an empty module cache. Inside one program it runs once. The first `import gnc` runs the file and stores the module in `sys.modules`. The second and third imports find it in `sys.modules` and hand back the same module object without running anything.
:::

::: check
In `gnc/nav/filters.py` (module `gnc.nav.filters`), what absolute name does each line import? (a) `from . import imu` (b) `from .. import orbits` (c) `from ..constants import MU_EARTH`
:::

::: answer
The package of `gnc.nav.filters` is `gnc.nav`. (a) One dot keeps `gnc.nav`, so it imports `gnc.nav.imu`. (b) Two dots chop `nav`, leaving `gnc`, so it imports the module `gnc.orbits`. (c) Two dots again leave `gnc`, then add `constants`: it imports `MU_EARTH` from `gnc.constants`.
:::

::: check
A teammate's folder holds `tools/plot_helpers.py` and no `__init__.py`. They write `from tools.plot_helpers import ground_track` and it works on their laptop. On the CI machine it fails with `ModuleNotFoundError: No module named 'tools.plot_helpers'`, and on that machine a third-party library that ships a regular package named `tools` is installed. Explain.
:::

::: answer
Without `__init__.py`, the teammate's `tools/` folder is only a namespace portion. Python keeps searching the rest of `sys.path`. On the CI machine it finds the installed library's regular package `tools`, which beats any namespace portions, so `tools` means the library's folder only, and it has no `plot_helpers`. On the laptop, no regular `tools` existed, so the portion was used. Adding `tools/__init__.py` (or, better, a less generic name) makes the teammate's folder a regular package that wins as soon as it is first on the path.
:::

::: check
You want users to write `from gnc import circular_speed, hohmann_dv` even though the functions live in `gnc/orbits.py` and `gnc/transfers.py`. What goes in `gnc/__init__.py`? Why is this better than asking users to import from the submodules?
:::

::: answer
Two re-export lines, and optionally a matching `__all__`:

```python
from .orbits import circular_speed
from .transfers import hohmann_dv

__all__ = ["circular_speed", "hohmann_dv"]
```

It makes the package's public interface a short, deliberate list. Users depend on `gnc.hohmann_dv`, not on which file it sits in, so you can split or rename internal modules later without breaking anyone.
:::

::: check
`python3 gnc/nav/imu.py` fails with "attempted relative import with no known parent package", but `python3 -m gnc.nav.imu` from the same folder works. What is different about how Python loads the file in the two cases?
:::

::: answer
Run as a path, the file becomes a module named `__main__` with no package, so `__package__` is empty and a leading dot has nothing to resolve against. Run with `-m`, Python imports `gnc` and `gnc.nav` first and then runs the file as part of `gnc.nav`, so `__package__` is `gnc.nav` and `..constants` resolves to `gnc.constants`.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| module | one `.py` file | runs once; cached in `sys.modules` |
| package | a folder of modules under one name | dotted names follow folders: `gnc.nav.imu` |
| `sys.path` | ordered list of folders Python searches | first match wins; your folder comes first |
| regular package | folder with `__init__.py` | lives in one folder; beats namespace portions |
| `__init__.py` | the package's front door | marks the package, sets its exports and `__all__` |
| namespace package | folder(s) with no `__init__.py` | `__file__` is `None`; portions merge silently |
| relative import | `from . import x`, `from ..m import y` | resolves against `__package__`; one level per extra dot |
| `python -m pkg.mod` | run a module by its package name | makes relative imports work |

You now know that Python searches `sys.path` in order and that your own folder is first. The next lesson, on the src layout, shows why that ordering quietly lets broken packages pass their tests, and how moving the package one folder down fixes it.

::: context search-path The list Python walks, in order
Python builds `sys.path` at startup from four sources: the folder of the script (or the current folder for `-c` and `-m`), the folders in the `PYTHONPATH` environment variable, the standard library's folders, and the `site-packages` folder where installed packages live. You can print it any time, and a program may even change it while running, though that is a habit to avoid. Order matters: when two folders both contain `gnc`, the one earlier in the list wins and the other is never looked at.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="78" height="40" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="47" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">your folder</text>
  <rect x="96" y="30" width="78" height="40" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">PYTHONPATH</text>
  <rect x="184" y="30" width="78" height="40" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="223" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">std library</text>
  <rect x="272" y="30" width="80" height="40" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="312" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">site-packages</text>
  <line x1="20" y1="92" x2="332" y2="92" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="340,92 330,87 330,97" fill="#b4232c"/>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#b4232c">searched left to right; first match wins</text>
</svg>
```
:::

::: context module-cache Why a module runs only once
`sys.modules` is an ordinary dictionary from module names to module objects. Every import checks it first. That is why module-level code, like reading a table of atmosphere data, runs only once per program no matter how many files import it, and why two files that import the same module share one copy of its variables. It also explains a confusing moment in an interactive session: after you edit a file, `import` again does nothing, because the old module is still cached. `importlib.reload(module)` re-runs it, but restarting Python is the reliable fix.
:::

::: context dunder Why so many double underscores
Python marks names that the language itself gives meaning to with two underscores on each side: `__init__`, `__name__`, `__file__`, `__all__`, `__path__`. Programmers shortened "double underscore" to "dunder", so `__init__.py` is read "dunder init dot p y". The underscores are a warning sign: these names are part of how Python works, and you should not invent new ones of your own in that style. A single leading underscore, as in `_helper`, is a softer signal that means "private to this module, do not rely on it".
:::

::: context pep-420 Where namespace packages came from
A PEP, short for Python Enhancement Proposal, is the design document the Python community writes, argues over and then accepts or rejects before a change goes into the language. PEP 420, accepted for Python 3.3 in 2012, made folders without `__init__.py` importable as "implicit namespace packages". Before that, big projects that wanted one top-level name split across separately installed pieces had to use fragile tricks inside `__init__.py` files. PEP 420 made the splitting official. The price is that any stray folder on `sys.path` can now be imported by accident.
:::

::: context monorepo One repository, many packages
A monorepo is a single version-control repository that holds many projects at once: flight software, ground tools, simulation, test rigs. Big aerospace and tech companies often work this way so that one change can update a library and every program that uses it together. In a Python monorepo, dozens of folders end up on `sys.path` at the same time, and many teams choose the same obvious names, like `utils`, `config` or `tools`. That is exactly where namespace packages merge folders nobody meant to merge, and why explicit `__init__.py` files earn their keep.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="100" height="34" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">nav/utils/</text>
  <rect x="10" y="58" width="100" height="34" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">prop/utils/</text>
  <rect x="10" y="104" width="100" height="34" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">sim/utils/</text>
  <line x1="110" y1="29" x2="226" y2="70" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="110" y1="75" x2="226" y2="75" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="110" y1="121" x2="226" y2="80" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="230" y="55" width="120" height="40" rx="4" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="290" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">import utils</text>
  <text x="290" y="87" font-size="11" text-anchor="middle" fill="#1f2a44">one merged package</text>
</svg>
```
:::

::: context dash-m What python -m really does
The `-m` switch tells Python "find this module on `sys.path` by its dotted name and run it as the main program". Because it goes through the normal import machinery, every parent package is imported first and the module knows which package it belongs to. You have already used it: `python -m pip`, `python -m venv` and `python -m pytest` all run a module by name. If you give `-m` a package name rather than a module, Python runs that package's `__main__.py` file, which is how many tools make `python -m toolname` work.
:::

::: context circular-import Two modules waiting on each other
Imagine `orbits.py` starts running and, on line 3, imports `imu.py`. Python pauses `orbits`, which has defined nothing yet, and runs `imu`. If `imu` now asks for a name from `orbits`, it finds the half-built module, the name is not there yet, and the import fails. The fix is structural: move what both need into a third module, such as `constants.py`, so the imports form a tree instead of a loop.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="90" height="34" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">orbits</text>
  <rect x="20" y="84" width="90" height="34" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">imu</text>
  <line x1="55" y1="54" x2="55" y2="78" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="55,84 50,76 60,76" fill="#b4232c"/>
  <line x1="75" y1="84" x2="75" y2="60" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="75,54 70,62 80,62" fill="#b4232c"/>
  <text x="65" y="12" font-size="11" text-anchor="middle" fill="#b4232c">loop</text>
  <rect x="200" y="20" width="70" height="34" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="235" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">orbits</text>
  <rect x="282" y="20" width="70" height="34" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="317" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">imu</text>
  <rect x="236" y="84" width="80" height="34" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="276" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">constants</text>
  <line x1="235" y1="54" x2="262" y2="80" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="266,84 257,80 264,73" fill="#1d6fd1"/>
  <line x1="317" y1="54" x2="290" y2="80" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="286,84 288,73 295,80" fill="#1d6fd1"/>
  <text x="276" y="12" font-size="11" text-anchor="middle" fill="#1d6fd1">tree</text>
</svg>
```
:::
