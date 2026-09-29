---
id: l03-pyproject-and-backends
title: pyproject.toml and build backends
minutes: 20
covers:
  - 'pyproject.toml: project metadata, dependencies, optional-dependencies, build-system'
  - 'Build backends: setuptools, hatchling, flit'
---

Think of the label on a jar of jam you buy at a farmers' market. It says what is inside, who made it, when, and what it contains that some people cannot eat. A second, smaller note on the back says how it was made: "cooked in a copper pot, sealed with wax." Anyone can read the label without opening the jar, and any cook who follows the note can make the same jam again.

A Python package carries both of those on one card, a file named **`pyproject.toml`** in the repository root. Its top half is the label: the package's name, its version, what Python it needs, and what other packages it depends on. Its bottom half is the recipe card: which tool turns your source folder into an installable package. Every modern Python tool reads this one file — pip, the `build` command, uv, pytest, ruff, mypy — so it is the single place where a project says what it is.

For a GNC team, this file is where "our simulator needs NumPy 1.24 or newer and SciPy below 2" gets written down, so that a colleague, a CI machine and a flight-software container all install the same thing. In the last lesson you edited small pieces of it. This lesson reads the whole file, section by section, and then builds the same package three times with three different **build backends**, the programs that do the actual packing.

## The shape of the file

The file is written in **[[TOML|toml]]**, a plain-text format for settings. You need three pieces of its grammar:

- `key = value` sets one value. Strings go in double quotes; lists go in square brackets.
- `[name]` starts a **table**, a named group of keys. Everything under it, up to the next table header, belongs to it.
- A dotted header like `[project.optional-dependencies]` is a table inside the table `project`.

Here is a complete `pyproject.toml` for the `gnc-toolkit` package from the last lesson, in the src layout:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "gnc-toolkit"
version = "0.1.0"
description = "Small guidance, navigation and control helpers"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
authors = [{ name = "Ada Flight", email = "ada@example.com" }]
dependencies = [
    "numpy>=1.24",
    "scipy>=1.10,<2",
]

[project.optional-dependencies]
plot = ["matplotlib>=3.7"]
dev = ["pytest>=7", "ruff"]

[tool.hatch.build.targets.wheel]
packages = ["src/gnc"]
```

Python can read it with the standard library's `tomllib`, which is exactly what tools do:

```python
import tomllib

with open("pyproject.toml", "rb") as f:
    config = tomllib.load(f)

print(config["build-system"])
# {'requires': ['hatchling'], 'build-backend': 'hatchling.build'}
print(config["project"]["optional-dependencies"])
# {'plot': ['matplotlib>=3.7'], 'dev': ['pytest>=7', 'ruff']}
```

There are three kinds of table, each owned by someone different:

1. `[build-system]` — how to build. Read by installers and build tools.
2. `[project]` — what the package is. A shared standard, written down in **[[PEP 621|pep-621]]**, so every backend reads it the same way.
3. `[tool.something]` — private settings for one named tool. `[tool.hatch...]` is for hatchling, `[tool.pytest.ini_options]` for pytest, `[tool.ruff]` for ruff. Other tools ignore tables that are not theirs.

## The label: the [project] table

Each key in `[project]` becomes a line in the package's **metadata**, a small text file that travels inside every built package and that pip reads before installing.

- **`name`** is the **distribution name**, the name you `pip install`. It does not have to match the import name. Here you install `gnc-toolkit` and write `import gnc`. Installers treat names loosely: case, dashes, underscores and dots are all the same, so `GNC_Toolkit` and `gnc.toolkit` both mean `gnc-toolkit`.
- **`version`** is the release number, like `0.1.0`. A later lesson covers how to choose it.
- **`description`** is one line; **`readme`** points to a file whose text becomes the long description on a package index page.
- **`requires-python`** says which Python versions the package supports. pip refuses to install it on anything else, so a user on Python 3.9 gets a clear error instead of a crash on the first new-syntax line.
- **`license`** is a short standard **[[license identifier|spdx]]** like `"MIT"` or `"Apache-2.0"`. (This string form is recent; setuptools accepts it from version 77.)
- **`authors`** is a list of small inline tables, each with a `name` and an `email`.

### dependencies

**`dependencies`** lists what the package needs at run time: other distributions that pip must install alongside it. Each entry is a **requirement string**: a name, then optionally a **[[version specifier|specifier]]** that limits which versions are acceptable.

- `numpy>=1.24` reads "numpy, version 1.24 or newer".
- `scipy>=1.10,<2` reads "scipy, at least 1.10 and below 2". A comma means *and*: both conditions must hold.
- `ruff` with nothing after it means "any version".

Version numbers are compared piece by piece as numbers, not as text. So `1.9.3` is *older* than `1.10.0`, because 9 is less than 10, even though the text "1.9" sorts after "1.10" alphabetically. The `packaging` library, which pip itself uses, will show you:

```python
from packaging.specifiers import SpecifierSet

scipy_ok = SpecifierSet(">=1.10,<2")
for v in ["1.9.3", "1.10.0", "1.17.1", "2.0.0"]:
    print(v, v in scipy_ok)
# 1.9.3 False
# 1.10.0 True
# 1.17.1 True
# 2.0.0 False
```

A requirement can also carry an **[[environment marker|markers]]** after a semicolon, a condition on the machine doing the install: `"tomli>=1.1; python_version < '3.11'"` installs `tomli` only on Pythons older than 3.11, which lack the built-in `tomllib`.

How tight should these ranges be? For a library, loose enough to live alongside other libraries; for an application, the exact versions go in a separate lockfile. That choice has its own lesson later in this module. Here, the point is where the list lives.

### optional-dependencies

Some users want extra features that need extra packages. Plotting ground tracks needs matplotlib, but a flight computer running the navigation filter has no screen and should not carry a plotting library. **`[project.optional-dependencies]`** holds these groups. Each key is the name of an **extra**, and its value is a list of requirement strings.

A user asks for an extra with square brackets after the name:

```text
$ pip install "gnc-toolkit[plot]"
$ pip install "gnc-toolkit[plot,dev]"
$ pip install -e ".[dev]"
```

The quotes stop your shell from treating the square brackets as a filename pattern. The last line installs the project in the current folder (`.`) with its `dev` extra, a common setup for working on the package itself.

::: key
`[project]` holds the package's metadata: `name`, `version`, `requires-python`, `dependencies` (what it always needs at run time) and `[project.optional-dependencies]` (named extras, installed with `pip install "name[extra]"`).
:::

::: example Reading the metadata the backend wrote
Build the package (you will see how in a moment) and open the wheel file it produces. It is a zip archive, and one file inside, `METADATA`, is the label. These are its lines for our project:

```text
Metadata-Version: 2.5
Name: gnc-toolkit
Version: 0.1.0
License-Expression: MIT
Requires-Python: >=3.10
Requires-Dist: numpy>=1.24
Requires-Dist: scipy<2,>=1.10
Provides-Extra: dev
Requires-Dist: pytest>=7; extra == 'dev'
Requires-Dist: ruff; extra == 'dev'
Provides-Extra: plot
Requires-Dist: matplotlib>=3.7; extra == 'plot'
```

**Step 1: count the always-needed dependencies.** The `Requires-Dist` lines with no condition: `numpy` and `scipy`. Two. They match the `dependencies` list.

**Step 2: count the conditional ones.** Three `Requires-Dist` lines end in `extra == ...`: two for `dev`, one for `plot`. Extras are stored as ordinary requirements guarded by an environment marker, and `Provides-Extra` lists the extra names.

**Step 3: ask pip what it would install.** In an empty virtual environment, `pip install --dry-run` resolves without installing. For the plain wheel pip reported 3 distributions: `gnc-toolkit`, `numpy` and `scipy`. With `[plot]` it reported 13, because the extra adds ten: matplotlib itself and the nine packages it needs, `contourpy`, `cycler`, `fonttools`, `kiwisolver`, `packaging`, `pillow`, `pyparsing`, `python-dateutil` and `six`. (The exact versions pip picked depend on the day you run it.)

**Sanity check.** $13 - 3 = 10$ extra distributions for one word in square brackets. That is why plotting is an extra and not a dependency: ten packages the flight computer never needs.
:::

## The recipe card: the [build-system] table

Here is the question `[build-system]` answers. You type `pip install .` in a folder of source code. pip must turn that folder into a wheel before it can install it. Which program does that, and how does pip get hold of that program?

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

- **`requires`** lists the packages needed to *run the build*, in the same requirement-string format as `dependencies`.
- **`build-backend`** names the Python module that does the build. pip imports it and calls a few agreed functions on it, such as `build_wheel` and `build_sdist`.

Two words split the job. The **build frontend** is the tool you type a command into: pip, `python -m build` or uv. It reads `[build-system]`, prepares a place to build, and calls the backend. The **build backend** is the tool that actually knows how to collect your files, write the metadata and zip up a wheel. The agreement between them, a short list of function names and what they return, was written down in PEP 517. Any frontend works with any backend.

The frontend does something clever with `requires`: **[[build isolation|build-isolation]]**. It creates a brand-new, temporary virtual environment, installs *only* the packages in `requires` into it, runs the backend there, and then throws the environment away. Here is `python -m build` doing it:

```text
$ python -m build
* Creating isolated environment: venv+pip...
* Installing packages in isolated environment:
  - hatchling
...
Successfully built gnc_toolkit-0.1.0.tar.gz and gnc_toolkit-0.1.0-py3-none-any.whl
```

Look at what was installed to do the build: hatchling, and nothing else. Not NumPy, not SciPy. The runtime dependencies are needed to *use* the package, not to *pack* it, so the build does not wait for them and cannot be confused by whatever you happen to have installed.

To see that the backend is an ordinary Python module, you can play frontend yourself, with no isolation, in an environment that has hatchling installed:

```python
import importlib
import tomllib

with open("pyproject.toml", "rb") as f:
    backend_name = tomllib.load(f)["build-system"]["build-backend"]

backend = importlib.import_module(backend_name)
print(backend_name)                  # hatchling.build
print(backend.build_wheel("out"))    # gnc_toolkit-0.1.0-py3-none-any.whl
```

That is, in essence, what every frontend does. The rest is preparing the environment.

::: key
What goes in `[build-system]` in pyproject.toml? The build backend and the requirements needed to run it, for example setuptools or hatchling. It is what lets pip build your package in an isolated environment without your dependencies being installed first.
:::

::: warning Build requirements are not runtime dependencies
People put `numpy` in `[build-system] requires` "to be safe", or put `hatchling` in `dependencies`. Both are wrong. `requires` is only for the build; it is never installed for users. `dependencies` is only for running; it is never available during an isolated build. The one real exception is a package with compiled code that must see NumPy's C headers while compiling. Then NumPy belongs in both lists, for two different reasons.
:::

::: warning Turning isolation off
`python -m build --no-isolation` and `pip install --no-build-isolation` skip the temporary environment and use whatever is installed right now. That is useful offline, or in a locked-down build container. But the backend must already be installed, or you get `ERROR Backend 'hatchling.build' is not available.` And now the build can quietly depend on something that happens to be lying around, which is what isolation was protecting you from.
:::

If a project has no `[build-system]` table at all, pip falls back to assuming setuptools, for the sake of very old projects built around a **[[setup.py|setup-py]]** script. New projects should always write the table.

## Three backends, one package

Because `[project]` is a shared standard, switching backends mostly means changing the two lines of `[build-system]`. The three pure-Python backends you will meet most:

| Backend | `requires` | `build-backend` | Known for |
|---|---|---|---|
| setuptools | `["setuptools>=77"]` | `setuptools.build_meta` | the oldest; builds C extensions; huge ecosystem |
| hatchling | `["hatchling"]` | `hatchling.build` | modern defaults; plugins; version read from a file |
| flit | `["flit_core>=3.12,<5"]` | `flit_core.buildapi` | tiny and strict; pure-Python packages only |

**setuptools** has been around since 2004 and still builds a large part of the packages on the public index. It can compile C and C++ extensions, which the other two cannot. The price is a long history of options and a few surprising defaults, like the package data you had to list by hand in the last lesson.

**hatchling** is the backend of the Hatch project. It picks sensible files by default, respects your `.gitignore`, and has plugins, for example to read the version from a file or from your git tags.

**flit** (its backend is the small package `flit_core`) does less on purpose. It packs one pure-Python module or package, includes the files inside that package folder, and refuses anything clever. For a small, pure-Python library it is hard to get wrong.

For code with compiled extensions, a different family of **[[compiled-code backends|compiled-backends]]** takes over, and the wheels lesson returns to them.

::: example Same source, three backends
Take the src-layout `gnc` package from the last lesson — five package files, including `data/atmosphere.csv` — and give it the same `[project]` table under each backend.

**Step 1: build each one with only the shared tables.** Setuptools finds `src/gnc` on its own and builds, but its wheel holds four package files, not five: the CSV is missing, as in the last lesson. Hatchling and flit both stop with errors:

```text
hatchling:  ValueError: Unable to determine which files to ship inside the wheel ...
            The most likely cause of this is that there is no directory that
            matches the name of your project (gnc_toolkit).
flit:       ValueError: No file/folder found for module gnc_toolkit
```

Both guess the package folder from the distribution name. The name `gnc-toolkit`, normalized to `gnc_toolkit`, has no folder to match, because the import package is called `gnc`.

**Step 2: give each backend its one hint.** Hatchling gets

```toml
[tool.hatch.build.targets.wheel]
packages = ["src/gnc"]
```

flit gets `[tool.flit.module]` with `name = "gnc"`, and setuptools gets its `[tool.setuptools.package-data]` table with `gnc = ["data/*.csv"]`. Each backend wanted exactly one extra table for this project, each for a different reason.

**Step 3: compare the wheels.** All three are named `gnc_toolkit-0.1.0-py3-none-any.whl`, and all three hold the same five package files, `data/atmosphere.csv` included. The `Requires-Dist` lines say the same thing, with small differences in formatting (setuptools wrote `scipy<2,>=1.10`, flit kept `scipy>=1.10,<2`). Only the `Generator:` line in the `WHEEL` file tells them apart: `setuptools (84.0.0)`, `hatchling 1.32.4`, `flit 4.1.0`.

**Step 4: compare the source archives.** The `.tar.gz` files differ more. Counting files, setuptools packed 14: the 8 that the others packed, plus a generated `setup.cfg` and five files of an old-style `egg-info` folder. Hatchling and flit each packed 8: `PKG-INFO`, `README.md`, `pyproject.toml` and the five package files.

**Sanity check.** Users installing the wheel get identical files from all three. The backend is a choice about how the package is built, not about what the package is, which is exactly what the split between `[build-system]` and `[project]` promised.
:::

### Reading the version from the code

Often you want the version written in exactly one place, inside the package, so that `gnc.__version__` and the metadata cannot disagree. You mark the field as **dynamic** — to be filled in by the backend at build time — instead of writing it in `[project]`:

```toml
[project]
name = "gnc-toolkit"
dynamic = ["version"]

[tool.hatch.version]
path = "src/gnc/__init__.py"
```

Hatchling now reads the line `__version__ = "0.2.0"` from that file, and the build produced `gnc_toolkit-0.2.0-py3-none-any.whl`. Flit does the same with `dynamic = ["version"]` and no extra table, because it always looks for `__version__` in the module it is packing. Setuptools can do it too, with its own `[tool.setuptools.dynamic]` table.

### Choosing one

For a new, pure-Python package, pick hatchling or flit: hatchling if you want room to grow, flit if you want the smallest possible thing. Pick setuptools when you compile C or C++ with it, or when you are maintaining an existing setuptools project and a switch would buy nothing. The frontend commands — `pip install .`, `python -m build` — stay the same whatever you pick, so nobody else on the team has to learn anything new.

::: key
A build backend (setuptools via `setuptools.build_meta`, hatchling via `hatchling.build`, flit via `flit_core.buildapi`) turns the source tree into a wheel and an sdist. The frontend (pip, `build`, uv) reads `[build-system]`, installs `requires` into an isolated environment and calls the backend.
:::

## Check yourself

::: check
A teammate's `pyproject.toml` has `dependencies = ["numpy", "hatchling"]` and `[build-system] requires = ["hatchling", "numpy", "scipy"]`. The package is pure Python and imports NumPy and SciPy at run time. What is wrong, and what should the two lists say?
:::

::: answer
The lists are mixed up. `hatchling` is only needed to build, so it does not belong in `dependencies`, where every user would install it for nothing. `numpy` and `scipy` are needed to run, so they belong in `dependencies`, and they are useless in `requires` for a pure-Python package: nothing in the build uses them, and they make the isolated build slow. Correct: `dependencies = ["numpy", "scipy"]` (with suitable ranges) and `requires = ["hatchling"]`.
:::

::: check
Which of these versions satisfy `scipy>=1.10,<2`: `1.9.3`, `1.11.4`, `2.0.0`, `1.10`? Explain the one people get wrong.
:::

::: answer
`1.11.4` and `1.10` satisfy it; `1.9.3` and `2.0.0` do not. The one people get wrong is `1.9.3`: as text, "1.9" looks bigger than "1.10", but versions compare piece by piece as numbers, and in the second piece 9 is less than 10, so `1.9.3` is older than `1.10` and fails the `>=1.10` condition. `2.0.0` fails `<2`.
:::

::: check
You want the navigation filter to install on a flight computer without matplotlib, while analysts can get plotting with one command. Write the relevant part of `[project]` and the analysts' install command.
:::

::: answer
Put matplotlib in an extra, not in `dependencies`:

```toml
[project]
dependencies = ["numpy>=1.24"]

[project.optional-dependencies]
plot = ["matplotlib>=3.7"]
```

The flight computer runs `pip install gnc-toolkit` and gets only NumPy. Analysts run `pip install "gnc-toolkit[plot]"`, with quotes so the shell leaves the brackets alone. In the metadata, matplotlib appears as `Requires-Dist: matplotlib>=3.7; extra == 'plot'`.
:::

::: check
In the isolated build shown in this lesson, only hatchling was installed, yet the package depends on NumPy and SciPy. Why does the build still succeed, and why is that a feature?
:::

::: answer
Building a pure-Python package means collecting files, writing metadata and zipping a wheel; none of that imports NumPy or SciPy, so they are not needed. That is a feature because the build depends on nothing except what `[build-system] requires` declares. It cannot accidentally use some other package sitting in your environment, it gives the same result on your laptop and on CI, and it does not have to install large runtime dependencies only to pack the files.
:::

::: check
Hatchling fails on your project `rocket-sim` with "no directory that matches the name of your project (rocket_sim)". Your code is in `src/rsim/`. What is going on, and what is the fix?
:::

::: answer
Hatchling guesses which folder to pack from the normalized distribution name, `rocket_sim`, and there is no folder by that name: the import package is `rsim`. The distribution name and the import name are allowed to differ, but then you must tell the backend. Add `[tool.hatch.build.targets.wheel]` with `packages = ["src/rsim"]`, or rename one of the two so they match.
:::

## Summary

| Piece | Meaning | Example |
|---|---|---|
| `[build-system] requires` | packages needed to run the build | `["hatchling"]` |
| `[build-system] build-backend` | module that does the build | `"hatchling.build"` |
| `[project] name` | distribution name you `pip install` | `"gnc-toolkit"` (import `gnc`) |
| `requires-python` | supported Pythons | `">=3.10"` |
| `dependencies` | needed at run time | `"scipy>=1.10,<2"` |
| `[project.optional-dependencies]` | named extras | `plot = ["matplotlib>=3.7"]` |
| `[tool.xxx]` | settings for one tool | `[tool.hatch.version]` |
| frontend | pip, `build`, uv: isolates and calls the backend | `python -m build` |
| backends | setuptools, hatchling, flit | same wheel, different build rules |

You can now describe a package and build it. The next lesson looks at the shortcut everyone uses while developing, `pip install -e .`, and shows what it really puts in `site-packages` and why it can let a broken package pass.

::: context toml A settings format made for people
TOML stands for Tom's Obvious, Minimal Language, after Tom Preston-Werner, who designed it in 2013 (he also wrote the Semantic Versioning rules you will meet later in this module). It was built to be easy for people to read and write and to have exactly one meaning, unlike older formats where a value like `no` might quietly turn into false. Python's packaging community chose it for `pyproject.toml` in 2016, and Python 3.11 added `tomllib` to the standard library to read it.
:::

::: context pep-621 How the label became standard
For most of Python's history, a package described itself by running a program, `setup.py`, that called setuptools with its name, version and dependencies as arguments. To read the metadata, a tool had to run the code. Three proposals changed that. PEP 518 (2016) added `pyproject.toml` and the `[build-system]` table. PEP 517 (2017) defined the frontend-backend functions. PEP 621 (2020) defined the `[project]` table, so the label became plain data that any backend or tool can read without running anything.
:::

::: context spdx Short names for licenses
SPDX, the Software Package Data Exchange, keeps a list of short, exact identifiers for software licenses: `MIT`, `Apache-2.0`, `BSD-3-Clause`, `GPL-3.0-only` and hundreds more. Using the identifier instead of pasting license text lets tools check licenses automatically, which companies do before shipping software that bundles other people's code. Expressions can combine them, such as `MIT OR Apache-2.0`. Packaging standard PEP 639 made this the `license` field's format, which is why recent backends write a `License-Expression` line into the metadata.
:::

::: context specifier Reading a version range
A specifier is a list of conditions joined by commas, and a version must pass all of them. The common operators are `>=` (at least), `<` (below), `==` (exactly), `!=` (anything but) and `~=` (compatible release: `~=1.24` means at least 1.24 but below 2). Pre-releases such as `2.0.0rc1` are skipped unless you ask for them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="110" y="42" width="170" height="16" fill="#8fb8f0"/>
  <circle cx="110" cy="50" r="6" fill="#1d6fd1"/>
  <circle cx="280" cy="50" r="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="110" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">1.10</text>
  <text x="280" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">2.0</text>
  <line x1="60" y1="44" x2="60" y2="56" stroke="#b4232c" stroke-width="2"/>
  <text x="60" y="80" font-size="11" text-anchor="middle" fill="#b4232c">1.9.3</text>
  <line x1="200" y1="44" x2="200" y2="56" stroke="#1f2a44" stroke-width="2"/>
  <text x="200" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">1.17.1</text>
  <text x="195" y="28" font-size="11" text-anchor="middle" fill="#1d6fd1">&gt;=1.10,&lt;2</text>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">filled dot: included; open dot: excluded</text>
</svg>
```
:::

::: context markers Conditions on the installing machine
An environment marker is a small condition after a semicolon that pip checks against the machine doing the install. It can test `python_version`, `sys_platform` (such as `"linux"` or `"win32"`), `platform_machine` (such as `"x86_64"` or `"aarch64"`) and a few others. If the condition is false, pip skips that requirement. Extras are stored the same way inside the metadata, with the special marker `extra == 'plot'`, which is true only when the user asked for that extra.
:::

::: context build-isolation A clean kitchen for every build
Build isolation means each build runs in its own temporary environment that holds only the declared build requirements. The frontend makes it, installs `requires`, calls the backend, collects the wheel and deletes the environment. The benefit is repeatability: the build cannot see anything you did not declare.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="90" height="44" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="70" font-size="11" text-anchor="middle" fill="#1f2a44">frontend</text>
  <text x="55" y="85" font-size="11" text-anchor="middle" fill="#6c7a93">pip, build, uv</text>
  <rect x="130" y="20" width="130" height="104" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="195" y="38" font-size="11" text-anchor="middle" fill="#1d6fd1">temporary env</text>
  <rect x="145" y="52" width="100" height="26" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="195" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">hatchling only</text>
  <rect x="145" y="88" width="100" height="26" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="105" font-size="11" text-anchor="middle" fill="#1f2a44">build_wheel()</text>
  <rect x="290" y="50" width="62" height="44" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="321" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">.whl</text>
  <line x1="100" y1="72" x2="124" y2="72" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="130,72 122,67 122,77" fill="#1f2a44"/>
  <line x1="260" y1="72" x2="284" y2="72" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="290,72 282,67 282,77" fill="#1f2a44"/>
  <text x="195" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">no numpy, no scipy: not needed to pack files</text>
</svg>
```
:::

::: context setup-py The old way, still around
Older projects have a file `setup.py` that calls `setuptools.setup(name=..., version=..., install_requires=[...])`. It still works: setuptools reads it when present. What is discouraged is running it directly, as in `python setup.py install`, which bypassed pip's bookkeeping and has been deprecated for years. You will see `setup.py` in many scientific and aerospace codebases, often next to a `pyproject.toml` that holds only `[build-system]`. When you touch such a project, moving the metadata into `[project]` is usually a safe first cleanup.
:::

::: context compiled-backends When the package contains C, C++ or Rust
Packages with compiled code need a backend that can drive a compiler. The common ones are scikit-build-core, which runs CMake; meson-python, which runs the Meson build system and is used by NumPy and SciPy themselves; and maturin, for extensions written in Rust. They plug into the same `[build-system]` table, so `pip install .` and `python -m build` still work unchanged. Their wheels are tied to one platform and one Python, which is why the wheels lesson and the lesson on the scientific-stack binary interface spend time on them.
:::
