---
id: l13-virtual-environments-and-packaging
title: Virtual environments, pip and pyproject.toml
minutes: 20
covers:
  - Virtual environments with venv, pip, requirements and pyproject.toml
---

Picture two cooks sharing one kitchen pantry. One bakes bread that needs the old flour. The other's recipe needs a new kind. Every time one of them restocks the shelf, the other's recipe breaks, and six months later nobody can remember which flour went into which loaf. The fix: give each cook a labeled box of their own ingredients, and tape a shopping list to the lid saying exactly what went in.

Python projects have the same problem. Six months after a design review, someone asks why the dispersion ellipse in figure 4 — the spread of simulated landing points — was 4 km wide. The only good answer is to check out the code that made it, install the exact library versions it used, and run it again. Version control handles the code. This lesson handles the libraries.

Python installs third-party packages — NumPy, SciPy, matplotlib, pytest — into a folder called **`site-packages`**: the shelf where add-on libraries live. Left alone, there is one such folder for the whole machine, and every project shares it. That works until the second project. A propagator checked against NumPy 1.26 and a new tool that needs NumPy 2.4 cannot both be happy. Upgrading for one breaks the other, and neither can tell you which version produced last year's results.

A **virtual environment** gives one project its own `site-packages` — its own labeled box. It is a folder you create inside the project, throw away when it goes wrong, and never commit. Add a list of exact versions beside it, and the environment can be rebuilt anywhere. That is what turns a figure into a result. This lesson covers creating and activating one, installing into it, recording what is in it, and the `pyproject.toml` file that describes your own project.

## Creating an environment

`venv` is part of Python's standard library, so there is nothing to install. You run it as a module with `-m` (read "dash m", meaning "run this module as a program"), and give it a folder name. `.venv` inside the project is the near-universal choice; the leading dot hides it from a plain `ls`.

```bash
mkdir descent-analysis
cd descent-analysis
python3 -m venv .venv
```

That takes a few seconds and builds a **[[small folder tree|venv-tree]]**:

```bash
ls .venv
# bin
# include
# lib
# lib64
# pyvenv.cfg
```

Here is what each part is for.

- `bin` holds a `python` and a `pip` that belong to this environment, plus the `activate` script you meet next. (On Windows this folder is called `Scripts`.)
- `lib` holds the environment's own `site-packages`, which starts out almost empty.
- `lib64` is a shortcut pointing at `lib`, kept for systems that look there.
- `pyvenv.cfg` is a small text file recording which Python the environment was built from.

One line of `pyvenv.cfg` matters most:

```bash
grep include-system .venv/pyvenv.cfg
# include-system-site-packages = false
```

That is the isolation. The environment cannot see packages installed for the whole machine. Whatever you import inside it, you put there.

## Activating

**Activating** an environment tells your shell to use the environment's `python` and `pip` instead of the system ones. It does this by putting `.venv/bin` at the front of your **[[`PATH`|path-search]]** — the list of folders the shell searches, in order, when you type a command name. Most shells also show the environment's name at the start of the prompt, as a reminder.

```bash
source .venv/bin/activate
python -c "import sys; print(sys.prefix != sys.base_prefix)"
deactivate
python -c "import sys; print(sys.prefix != sys.base_prefix)"
# True
# False
```

Walk through it.

1. **[[`source`|source-not-run]]** runs the `activate` script inside your current shell, so its changes stick.
2. `python -c "…"` runs one line of Python given on the command line (`-c` for "command").
3. `sys.prefix` is the root folder of the environment in use. `sys.base_prefix` is the Python it was built from. They differ exactly when you are inside a virtual environment, so `!=` (read "not equal") gives `True`. That one-liner is a reliable check.
4. `deactivate` puts the old `PATH` back, and the same check now prints `False`.

Activation affects **one shell only**. A second terminal window, a scheduled job, or your editor's run button is not activated unless it activates itself. Each can also skip activation and name the environment's Python by its full path, `.venv/bin/python`.

On Windows the activation command is `.venv\Scripts\activate`. Everything else in this lesson is the same.

::: key What a virtual environment isolates
The interpreter's `site-packages` for one project, so two projects can pin different NumPy versions and a pinned requirements file actually reproduces. It does **not** isolate the operating system, the compiler or the system libraries — that is what containers are for.
:::

## Installing into it

A fresh environment is empty. That is the point, and the first import proves it:

```bash
source .venv/bin/activate
python -c "import numpy"
# Traceback (most recent call last):
#   File "<string>", line 1, in <module>
# ModuleNotFoundError: No module named 'numpy'
```

Install with **`pip`**, Python's package installer. Write it as `python -m pip`, not a bare `pip`:

```bash
python -m pip install numpy
```

pip fetches the package from **[[PyPI|pypi]]**, the public package index, and the output ends with a line naming exactly what landed:

```text
Collecting numpy
  Using cached numpy-2.4.6-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (6.6 kB)
Using cached numpy-2.4.6-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (16.9 MB)
Installing collected packages: numpy
Successfully installed numpy-2.4.6
```

The middle lines vary. On a machine that has never fetched this file they say `Downloading`, with a progress bar. The long name ending in `.whl` is a **[[wheel|wheel-name]]** — a ready-built package file for one kind of computer. The last line is the one to read. (pip may also print a `[notice]` suggesting you upgrade pip itself. That is advice, not an error.)

Why `python -m pip`? Because it runs the pip that belongs to the `python` you are running. A bare `pip` is whichever `pip` comes first on the `PATH`, and that may belong to a different environment. That mismatch causes a classic puzzle: the install reports success, then `import numpy` fails, because the package went into an environment you are not using. The same form gives you `python -m venv`, and it is why lesson 1 had you ask which `python3` you are running.

Now the import works, and it finds the environment's copy:

```bash
python -c "import numpy; print(numpy.__version__)"
# 2.4.6
```

As lesson 9 showed, `print(numpy.__file__)` would tell you exactly which folder it came from — here, somewhere inside `.venv`.

Three more commands you will use:

- `python -m pip list` shows everything installed, including pip itself (and, on Python 3.11, setuptools).
- `python -m pip show numpy` gives one package's version, location and dependencies.
- `python -m pip uninstall numpy` removes it.

## Recording what is in it

An environment you cannot rebuild is no better than a shared shelf. `pip freeze` prints every installed package with its exact version, in a format that `pip install` can read back:

```bash
python -m pip freeze
# numpy==2.4.6
```

Save that to a file, and commit the file along with the code:

```bash
python -m pip freeze > requirements.txt
cat requirements.txt
# numpy==2.4.6
```

The `>` (read "into") sends the command's output into a file instead of the screen, replacing whatever the file held. `cat` prints the file back so you can check it.

A colleague — or you, on a new machine — rebuilds the environment in two lines:

```bash
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt
```

`&&` (read "and then") runs the second command only if the first one succeeded. `-r` means "read the list of packages from this file".

The `==` in `numpy==2.4.6` is a **pin**: install exactly this version and no other. Pins are what make a result reproducible. The price is that upgrades become **[[deliberate|version-numbers]]**: you change the pin, re-run the tests, and commit that change on its own. Writing `>=2.0` instead (read "at least 2.0") would mean "any version from 2.0 up". That is right for a library you publish to others and wrong for an analysis you want to repeat.

::: warning Never commit the environment folder
Never commit `.venv` to version control. It is often a hundred megabytes or more of files built for one kind of machine, it will not work on anyone else's, and `requirements.txt` rebuilds it completely. Put `.venv/` and `__pycache__/` in your **[[`.gitignore`|gitignore-file]]** before the first commit.
:::

::: example An environment for one analysis, from nothing
Here is the whole cycle, as you would type it. The project folder already exists, and the shell is inside it.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install numpy
python -m pip freeze > requirements.txt
```

Line by line: build the environment, switch it on, install NumPy into it, and write down what is now installed. Four commands, and the project is reproducible.

Now prove it. Throw the environment away and rebuild it from the file alone:

```bash
deactivate
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

`rm -rf .venv` deletes the whole folder. That is safe here because nothing in it is precious: everything it held is described by `requirements.txt`. Then ask the rebuilt environment what it has:

```bash
python -c "import numpy; print(numpy.__version__)"
# 2.4.6
```

**Sanity check.** The same version came back, because the file named it. Run that check after every rebuild: it is the difference between believing the environment is right and knowing it.

Two habits go with this. First, when an environment behaves strangely, delete and rebuild it — it costs a minute. Second, re-freeze after every deliberate install, so `requirements.txt` never drifts from what you actually run. An environment holding a package that is not in the file produces results nobody else can reproduce.
:::

## Describing your own project: pyproject.toml

`requirements.txt` says what to install. It does not say what *your* code is: its name, its version, which Python it needs, or how to install it. That is the job of **`pyproject.toml`**, the standard Python project file. It is written in **[[TOML|toml-name]]**, a settings format made of section names in square brackets and `key = value` lines.

```toml
# pyproject.toml
[project]
name = "descent-analysis"
version = "0.1.0"
description = "Quick-look analysis for descent telemetry"
requires-python = ">=3.11"
dependencies = [
    "numpy>=2.0",
]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"
```

Read it section by section.

- **`[project]`** is your project's description: its name, version, a one-line summary, the oldest Python it supports, and its dependencies. The dependencies are written as **ranges**, not pins. A project states what it *can work with*. `requirements.txt` records what one particular environment *actually has*.
- **`[build-system]`** names the tool that turns the folder into an installable package. setuptools is the common default, and you will rarely need to think about it.

The code itself goes under `src/`, in a folder named after the package you will import:

```python
# src/descent/__init__.py
"""Descent telemetry analysis."""

__version__ = "0.1.0"
```

With those two files in place, you can install the project into its own environment in **editable** mode:

```bash
python -m pip install -e .
```

The `.` (read "dot") means "the current folder": install the project described here. The `-e` means editable. Instead of copying your code into `site-packages`, pip **[[leaves a pointer|editable-pointer]]** to your `src` folder. So when you edit a file, the change takes effect the next time you import — no reinstall needed.

```bash
python -c "import descent; print(descent.__version__)"
# 0.1.0
```

What this buys you: `import descent` now works from any folder, for any script run in this environment. You no longer depend on running from the right folder so that `sys.path` happens to find your module, as in lesson 9. This is the grown-up answer to "how does my other script find my module?", and a later packaging module returns to this layout in detail.

::: warning Freeze before you install yourself
After `pip install -e .`, running `pip freeze` also lists your own project, as a line starting `-e` followed by the full path of the folder on *your* machine. That line is useless on anyone else's computer. Either freeze before the editable install, or delete that line from `requirements.txt`, and let colleagues run `pip install -e .` themselves.
:::

::: example What an environment does not protect you from
A colleague cannot reproduce your result. You both have the same `requirements.txt`, you both built a fresh `.venv`, and yet the numbers differ in the twelfth significant digit. The environment was not the problem. An environment isolates less than people assume.

Here are four things it does not pin.

1. **The Python version.** A `.venv` is built from whichever `python3` created it. Yours may be 3.11 and theirs 3.13. `requires-python = ">=3.11"` in `pyproject.toml` states the minimum; it does not make the two the same.
2. **Compiled and system libraries.** NumPy hands its matrix arithmetic to a fast compiled library called **[[BLAS|blas-library]]**. Which BLAS it uses, and on which processor, can change the last bits of a matrix product — the same floating-point effect as lesson 12's order of additions. Nothing in `requirements.txt` records that.
3. **The operating system and the compiler.** A C++ extension built on one machine is not the same wheel as one installed on another.
4. **Your own data and settings.** An input file read from outside the project, or an environment variable, travels with neither the code nor the environment.

Check the first one the way you check everything — by asking:

```bash
source .venv/bin/activate
python -c "import sys; print(sys.version_info[:2])"
# (3, 11)
```

`sys.version_info[:2]` is the first two parts of the version: major 3, minor 11.

**Sanity check.** A difference in the twelfth digit, with everything in `site-packages` identical, points at items 1 to 3: arithmetic done in a different order somewhere below Python. A difference in the *second* digit would point at item 4, or a real bug.

When these four are not enough, the next step up is a **[[container|containers]]**, which ships the operating system's files as well. That is beyond this module. What is not beyond it is knowing where the environment's boundary lies, so you look past it when the numbers do not match.
:::

## Two other tools you will meet

`conda` also manages dependencies that are not Python at all — compilers, GPU libraries, fast math libraries — and it is common in scientific groups for exactly the reasons in the last example. `uv` is a much faster modern replacement for `pip` and `venv`, and it is spreading quickly. The ideas are the same in all three: one isolated environment per project, with exact versions written to a file that lives beside the code. The commands in this lesson are the ones every tutorial and every colleague will assume you know, so they come first.

## Check yourself

::: check
Why write `python -m pip install numpy` rather than `pip install numpy`?
:::

::: answer
`python -m pip` runs the pip that belongs to the interpreter you named. A bare `pip` is whichever `pip` program comes first on the `PATH`, and that may belong to a different environment or to the system Python. The failure this prevents: the install says it succeeded, then `import numpy` raises `ModuleNotFoundError`, because the package went into an environment you are not running. The same reasoning gives `python -m venv` and `python -m pytest`.
:::

::: check
What exactly does activating an environment change, and why does a second terminal not see it?
:::

::: answer
It changes that shell's `PATH` (and sets a variable called `VIRTUAL_ENV`) so that `python` and `pip` find the copies in `.venv/bin` first. These are settings of one running shell. Commands started from that shell inherit them, and nothing else does. A second terminal, a scheduled job, an editor's run button or a background service each need their own activation, or must call `.venv/bin/python` by its full path. Nothing on disk outside `.venv` is changed, which is also why deleting the folder is a complete uninstall.
:::

::: check
Your `requirements.txt` says `numpy==2.4.6`, and a colleague's identical environment gives a result that differs in the twelfth digit. Name two things the environment does not pin.
:::

::: answer
Any two of these: the Python version, because the `.venv` is built from whatever `python3` created it; the BLAS or other compiled library NumPy uses, and the processor it runs on, which can change the last bits of a matrix product; the operating system and compiler behind any compiled extension; and anything read from outside the project, such as a data file or an environment variable. A virtual environment isolates `site-packages` and nothing else. When that is not enough, the next step is a container.
:::

::: check
What is the difference between the `dependencies` list in `pyproject.toml` and the contents of `requirements.txt`?
:::

::: answer
`dependencies` in `pyproject.toml` states what your project *can work with*, usually as ranges such as `numpy>=2.0`. It travels with the project to anyone who installs it. `requirements.txt` records what one particular environment *actually has*, as exact pins such as `numpy==2.4.6`, so that one specific result can be reproduced. A library publishes ranges; an analysis commits pins. Many projects have both, and they are not copies of each other.
:::

::: check
You install your own project with `python -m pip install -e .` and then edit a function in `src/descent/`. Do you need to reinstall?
:::

::: answer
No. An editable install leaves a pointer to your source folder instead of a copy, so the next import picks up the edit at once. You *do* need to reinstall after changing `pyproject.toml` itself — a new dependency, a new package folder, a new name — because that information was read at install time. A plain `pip install .` copies the code instead, so every edit would need a reinstall. Editable mode exists so you can run and test the code you are writing.
:::

## Summary

| Item | Statement |
| --- | --- |
| Create | `python3 -m venv .venv` in the project folder |
| Activate | `source .venv/bin/activate`; `.venv\Scripts\activate` on Windows; `deactivate` to leave |
| Check | `python -c "import sys; print(sys.prefix != sys.base_prefix)"` prints `True` inside one |
| Scope | Changes one shell's `PATH`; a second terminal is not activated |
| Isolation | Its own `site-packages`; `include-system-site-packages = false` |
| Install | `python -m pip install numpy`, never a bare `pip` |
| Inspect | `pip list`, `pip show numpy`, `pip uninstall numpy` |
| Record | `python -m pip freeze > requirements.txt`, committed with the code |
| Rebuild | `python -m pip install -r requirements.txt` into a fresh `.venv` |
| Pin vs range | `==2.4.6` reproduces a result; `>=2.0` states what a project can work with |
| `pyproject.toml` | `[project]`: name, version, `requires-python`, `dependencies`; `[build-system]` |
| Editable install | `python -m pip install -e .` points at the source; edits take effect at once |
| Not isolated | Python version, BLAS and compiled libraries, the OS and compiler, your data |
| Never commit | `.venv/`, `__pycache__/` |

That is the module. You can run Python three ways, hold data in lists, tuples, dicts and sets, write functions and modules other files import, read and write the files an analysis lives on, handle the failures that matter, compare floats honestly, and record the environment that produced the answer. The next Python module turns this into idiomatic code — comprehensions, generators, classes, decorators and type annotations — and after that comes NumPy, where a hundred thousand samples stop being a list and become an array.

::: context venv-tree What python3 -m venv builds
The environment is an ordinary folder inside your project. Its `python` is only a shortcut (a symbolic link) to the Python that created it, which is why the environment is small until you install things, and why it breaks if that Python is removed. Installed packages land in `site-packages`, deep inside `lib`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="18">descent-analysis/</text>
    <text x="34" y="40" fill="#1d6fd1">.venv/</text>
    <text x="58" y="62">bin/</text>
    <text x="58" y="84">include/</text>
    <text x="58" y="106">lib/python3.11/site-packages/</text>
    <text x="58" y="128">lib64 → lib</text>
    <text x="58" y="150">pyvenv.cfg</text>
    <text x="34" y="172">requirements.txt</text>
    <text x="34" y="194">pyproject.toml</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1" fill="none">
    <path d="M20,24 V190"/>
    <path d="M20,36 H30"/><path d="M20,168 H30"/><path d="M20,190 H30"/>
    <path d="M44,46 V146"/>
    <path d="M44,58 H54"/><path d="M44,80 H54"/><path d="M44,102 H54"/><path d="M44,124 H54"/><path d="M44,146 H54"/>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="130" y="62">python, pip, activate</text>
    <text x="250" y="106" fill="#b4232c">numpy/</text>
    <text x="150" y="128">shortcut</text>
    <text x="150" y="150">which Python, isolation on</text>
    <text x="150" y="172">commit this</text>
    <text x="150" y="194">commit this</text>
    <text x="100" y="40">never commit</text>
  </g>
</svg>
```
:::

::: context path-search How the shell finds python
When you type `python`, the shell does not search the whole disk. It walks the folders listed in `PATH`, left to right, and runs the first `python` it finds. Activation puts `.venv/bin` at the front, so the search stops there. `deactivate` removes it, and the search reaches the system folders again. This is also why the `#!/usr/bin/env python3` line from lesson 1 picks up the environment's Python while it is active.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">you type: python</text>
  <rect x="10" y="34" width="104" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="62" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">.venv/bin</text>
  <text x="62" y="67" font-size="11" text-anchor="middle" fill="#1f2a44">python found</text>
  <line x1="114" y1="54" x2="128" y2="54" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
  <rect x="130" y="34" width="104" height="40" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="182" y="52" font-size="12" text-anchor="middle" fill="#6c7a93">/usr/local/bin</text>
  <text x="182" y="67" font-size="11" text-anchor="middle" fill="#6c7a93">not reached</text>
  <line x1="234" y1="54" x2="248" y2="54" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
  <rect x="250" y="34" width="100" height="40" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="300" y="52" font-size="12" text-anchor="middle" fill="#6c7a93">/usr/bin</text>
  <text x="300" y="67" font-size="11" text-anchor="middle" fill="#6c7a93">not reached</text>
  <text x="10" y="100" font-size="11" fill="#1f2a44">PATH is searched left to right; the first match wins.</text>
  <text x="10" y="118" font-size="11" fill="#b4232c">Activation adds the first box; deactivate removes it.</text>
</svg>
```
:::

::: context source-not-run Why activate needs source
If you ran `.venv/bin/activate` like an ordinary program, the shell would start a separate child process to run it. That child would change its own `PATH` and then exit, and your shell's `PATH` would be untouched — a process can change its own settings and pass them down to programs it starts, but never back up to the one that started it. `source` (or its short form, a single `.`) reads the script's lines into your current shell instead, so the changes stay.
:::

::: context pypi Where pip gets packages
By default pip downloads from the Python Package Index, PyPI (say "pie-P-I"), at pypi.org — a public collection of hundreds of thousands of projects. Anyone can publish there, which is why engineering teams often run their own internal package index, or a checked copy of PyPI, and point pip at it. Downloaded files are also cached on your machine, which is why a second install can say `Using cached`.
:::

::: context wheel-name Reading a wheel's file name
A wheel is a zip file of ready-to-install code. Its name is a label, split by dashes, saying exactly which computers it fits. pip picks the wheel whose tags match your machine, so nobody has to compile NumPy's C code during the install.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="20" width="52" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="32" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">numpy</text>
  <rect x="62" y="20" width="48" height="30" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="86" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">2.4.6</text>
  <rect x="114" y="20" width="50" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="139" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">cp311</text>
  <rect x="168" y="20" width="50" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="193" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">cp311</text>
  <rect x="222" y="20" width="132" height="30" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.2"/>
  <text x="288" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">manylinux…x86_64.whl</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="32" y="68">name</text>
    <text x="86" y="68">version</text>
    <text x="139" y="68">Python</text>
    <text x="193" y="68">ABI</text>
    <text x="288" y="68">platform</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="139" y="84">CPython 3.11</text>
    <text x="193" y="100">compiled for it</text>
    <text x="288" y="84">Linux, 64-bit Intel/AMD</text>
  </g>
</svg>
```
:::

::: context version-numbers What the three numbers mean
Most packages number releases as major.minor.patch. In 2.4.6, a patch bump (2.4.7) should only fix bugs, a minor bump (2.5.0) adds features, and a major bump (3.0.0) is allowed to break old code. NumPy 2.0, released in 2024, was such a break: some code written for 1.x needed changes. That is why an analysis pins the exact version, and why an upgrade is a decision you test, not an accident.
:::

::: context gitignore-file A list of things git should not see
`.gitignore` is a plain text file in the top folder of a project, one pattern per line. Git, the version-control tool, skips any file or folder that matches, so it never offers to commit it. A Python project's usually starts with these two lines:

`.venv/` and `__pycache__/`

The first is the environment; the second holds the compiled bytecode Python caches next to your modules. Both are rebuilt automatically, so storing them would only add noise.
:::

::: context toml-name Tom's settings language
TOML stands for "Tom's Obvious, Minimal Language", after its creator, Tom Preston-Werner, one of GitHub's founders. It was designed to be easy for people to read and hard to get wrong. Python adopted `pyproject.toml` as the standard project file through a formal proposal, PEP 518, in 2016, and since Python 3.11 the standard library can read TOML with the `tomllib` module.
:::

::: context editable-pointer How an editable install points at your code
You can see the pointer. In the environment's `site-packages`, the editable install leaves a tiny file ending in `.pth` whose only content is the path of your `src` folder. When Python starts, it reads every `.pth` file there and adds those folders to `sys.path`. So `import descent` searches your `src` folder directly, and always sees the latest version of your files.
:::

::: context blas-library The engine under NumPy
BLAS, the Basic Linear Algebra Subprograms, is a standard set of routines for vector and matrix arithmetic, first defined in the late 1970s. NumPy hands its big matrix products to a BLAS library such as OpenBLAS or Intel's MKL. These split the work across processor cores and use special wide instructions, so the additions happen in a different order on different machines. By lesson 12, different order means different last bits.
:::

::: context containers One step past the environment
A container packages a program together with the operating system files it needs — the system libraries, the Python interpreter, everything but the core of the operating system (the kernel), which it borrows from the host. Docker is the best-known tool. Where a virtual environment says "these Python packages", a container image says "this whole machine setup", so a result can be rerun years later on a different computer.
:::
