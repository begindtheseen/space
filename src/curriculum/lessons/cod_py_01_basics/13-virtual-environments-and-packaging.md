---
id: l13-virtual-environments-and-packaging
title: Virtual environments, pip and pyproject.toml
minutes: 16
covers:
  - Virtual environments with venv, pip, requirements and pyproject.toml
---

Six months after a design review, someone asks why the dispersion ellipse in figure 4 was 4 km wide. The only acceptable answer is to check out the code that produced it, install the exact library versions it used, and run it again. The code half of that is version control. The libraries half is this lesson.

Python installs third-party packages — NumPy, SciPy, matplotlib, pytest — into a directory called `site-packages`. Left alone, there is one such directory for the whole machine, and every project shares it. That works until the second project: a propagator validated against NumPy 1.26 and a new tool that needs NumPy 2.4 cannot both be satisfied, upgrading for one breaks the other, and neither can tell you which version produced last year's results.

A *virtual environment* gives one project its own `site-packages`. It is a directory you create in the project, throw away when it goes wrong, and never commit. With a pinned list of versions beside it, the environment becomes reproducible, which is what turns a figure into a result. This lesson covers creating and activating one, installing into it, recording what is in it, and the `pyproject.toml` file that describes your own project to the same machinery.

## Creating an environment

`venv` is part of the standard library. Run it as a module, and give the environment a directory — `.venv` inside the project is the near-universal convention:

```bash
mkdir descent-analysis
cd descent-analysis
python3 -m venv .venv
```

That takes a few seconds and creates a small directory tree:

```bash
ls .venv
# bin
# include
# lib
# lib64
# pyvenv.cfg
```

`bin` holds a `python` and a `pip` belonging to this environment (on Windows it is `Scripts`). `lib` holds the environment's own `site-packages`, which starts out almost empty. `pyvenv.cfg` records which interpreter the environment was built from, and one line of it matters:

```bash
grep include-system .venv/pyvenv.cfg
# include-system-site-packages = false
```

That is the isolation: the environment cannot see packages installed globally. Whatever you import inside it, you put there.

## Activating

*Activating* an environment edits the shell's `PATH` so that `python` and `pip` mean the copies inside `.venv`. Most shells also show the environment's name in the prompt as a reminder.

```bash
source .venv/bin/activate
python -c "import sys; print(sys.prefix != sys.base_prefix)"
deactivate
python -c "import sys; print(sys.prefix != sys.base_prefix)"
# True
# False
```

`sys.prefix` is the root of the environment in use and `sys.base_prefix` is the interpreter it was built from; they differ exactly when you are inside a virtual environment, which makes that one-liner a reliable way to check. `deactivate` puts the old `PATH` back. Activation affects **one shell**: a second terminal, or a cron job, or an editor's run button, is not activated unless it activates itself.

On Windows the activation command is `.venv\Scripts\activate` instead; everything else in this lesson is identical.

::: key
A virtual environment isolates the `site-packages` of one project, so two projects can pin different versions of NumPy and a pinned requirements file actually reproduces. It does **not** isolate the operating system, the compiler or the system libraries — that is what containers are for.
:::

## Installing into it

A fresh environment has nothing in it. That is the point, and the first import proves it:

```bash
source .venv/bin/activate
python -c "import numpy"
# Traceback (most recent call last):
#   File "<string>", line 1, in <module>
# ModuleNotFoundError: No module named 'numpy'
```

Install with `pip`, and write it as `python -m pip` rather than a bare `pip`:

```bash
python -m pip install numpy
```

The output ends with a line naming exactly what landed:

```text
Collecting numpy
  Using cached numpy-2.4.6-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (6.6 kB)
Using cached numpy-2.4.6-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (16.9 MB)
Installing collected packages: numpy
Successfully installed numpy-2.4.6
```

The middle lines vary — on a machine that has not downloaded this wheel before they say `Downloading` with a progress bar — but the last line is the one to read.

`python -m pip` runs the pip belonging to the `python` you are running, which removes a whole family of "but I installed it" confusion: a bare `pip` may be a different environment's pip that happens to be earlier on the path. The same form gives you `python -m venv`, and it is why lesson 1 insisted on knowing which interpreter you are running.

Now the import works, and it is the version the environment holds:

```bash
python -c "import numpy; print(numpy.__version__)"
# 2.4.6
```

`python -m pip list` shows everything installed, including pip itself. `python -m pip show numpy` gives one package's version, location and dependencies. `python -m pip uninstall numpy` removes it.

## Recording what is in it

An environment you cannot rebuild is no better than a global install. `pip freeze` prints the installed packages with exact versions, in a format `pip install` can read back:

```bash
python -m pip freeze
# numpy==2.4.6
```

Write that to a file and commit the file with the code:

```bash
python -m pip freeze > requirements.txt
cat requirements.txt
# numpy==2.4.6
```

A colleague — or you, on a new machine — rebuilds the environment in two commands:

```text
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt
```

The `==` is a *pin*: install exactly that version. Pins are what make a result reproducible, and the price is that upgrades become deliberate — you change the pin, re-run the tests, and commit the change on its own. `>=2.0` instead would mean "any version from 2.0", which is right for a library you publish and wrong for an analysis you want to reproduce.

::: warning
Never commit `.venv` to version control. It is hundreds of megabytes of platform-specific binaries, it will not work on anyone else's machine, and it is completely reproducible from `requirements.txt`. Put `.venv/` and `__pycache__/` in `.gitignore` before the first commit.
:::

::: example An environment for one analysis, from nothing
The whole cycle, as you would actually type it. The project directory already exists and the shell is in it.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install numpy
python -m pip freeze > requirements.txt
```

Four commands, and the project is now reproducible. To prove it, throw the environment away and rebuild it from the file alone:

```bash
deactivate
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

and then ask the rebuilt environment what it has:

```bash
python -c "import numpy; print(numpy.__version__)"
# 2.4.6
```

The same version came back, because the file said which one. That last command is worth running after any rebuild: it is the difference between believing the environment is right and knowing it.

Two habits go with this. Delete and rebuild the environment whenever it behaves strangely — it costs a minute and it is not precious. And re-freeze after every deliberate install, so `requirements.txt` never drifts from what you are actually running; an environment with a package that is not in the file is a result nobody else can reproduce.
:::

## Describing your own project: pyproject.toml

`requirements.txt` says what to install. It does not say what *your* code is, what it is called, which Python it needs, or how it should be built if someone wants to install it. That is `pyproject.toml`, the standard Python project file, written in TOML — a configuration format of sections in square brackets and `key = value` lines.

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

`[project]` is your project's metadata and its dependencies, stated as *ranges* rather than pins: a project declares what it can work with, and `requirements.txt` records what one particular environment actually has. `[build-system]` names the tool that turns the directory into an installable package; setuptools is the default choice and you will not need to think about it again.

The code itself goes under `src/`, in a directory named after the importable package:

```python
# src/descent/__init__.py
"""Descent telemetry analysis."""

__version__ = "0.1.0"
```

With those two files, the project can be installed into its own environment in *editable* mode, which links the source directory rather than copying it — so an edit takes effect immediately, with no reinstall:

```bash
python -m pip install -e .
```

```bash
python -c "import descent; print(descent.__version__)"
# 0.1.0
```

The dot is the current directory: install the project described here. What this buys you is that `import descent` now works from any directory, for any script run inside this environment, without the `sys.path` games of lesson 9. That is the grown-up answer to "how does my other script find my module", and it is the layout the packaging module returns to in detail.

::: example What an environment does not protect you from
A colleague cannot reproduce your result. Both of you have the same `requirements.txt`, both created a fresh `.venv`, and the numbers differ in the fourth decimal place. The environment was not the problem, because an environment isolates less than people assume.

Four things it does not pin:

1. **The interpreter version.** A `.venv` is built from whichever `python3` created it. Yours may be 3.11 and theirs 3.13. `requires-python = ">=3.11"` in `pyproject.toml` states the floor; it does not make the two the same.
2. **Compiled and system libraries.** NumPy is linked against a BLAS implementation, and which one — and on what CPU — affects the last bits of a matrix multiplication. Nothing in `requirements.txt` records that.
3. **The operating system and the compiler.** A C++ extension built on one machine is not the wheel installed on another.
4. **Your own data and configuration.** An input file read from outside the project, or an environment variable, travels with neither the code nor the environment.

Check the first of those the way you check everything else — by asking:

```bash
source .venv/bin/activate
python -c "import sys; print(sys.version_info[:2])"
# (3, 11)
```

When those four are not enough, the next step up is a container, which ships the operating system as well. That is beyond this module; what is not beyond it is knowing where the boundary of the environment is, so that you look past it when the numbers do not match.
:::

## Two other tools you will meet

`conda` manages non-Python dependencies too — compilers, CUDA, MKL — and is common in scientific groups for exactly the reasons in the previous example. `uv` is a much faster modern replacement for `pip` and `venv`, and is spreading quickly. The ideas are identical in all three: one isolated environment per project, versions written to a file that lives with the code. The commands in this lesson are the ones every tutorial and every colleague will assume you know, which is why they come first.

## Check yourself

::: check
Why write `python -m pip install numpy` rather than `pip install numpy`?
:::

::: answer
Because `python -m pip` runs the pip belonging to the interpreter you just named, while a bare `pip` is whatever executable is first on the `PATH` — which may belong to a different environment, or to the system Python. The failure it prevents is the one where the install reports success and the next `import numpy` raises `ModuleNotFoundError`, because the package went into an environment you are not running. The same reasoning gives `python -m venv` and `python -m pytest`.
:::

::: check
What exactly does activating an environment change, and why does a second terminal not see it?
:::

::: answer
It edits that shell's `PATH` (and sets `VIRTUAL_ENV`) so that `python` and `pip` resolve to the copies in `.venv/bin`. It is an environment variable in one process, so it is inherited by commands started from that shell and by nothing else — a second terminal, a cron job, an editor's run button or a systemd service each need their own activation, or must call `.venv/bin/python` by its full path. Nothing on disk outside `.venv` is modified, which is why deleting the directory is a complete uninstall.
:::

::: check
Your `requirements.txt` says `numpy==2.4.6`, and a colleague's identical environment gives a slightly different result in the twelfth digit. Name two things the environment does not pin.
:::

::: answer
Any two of: the Python interpreter version, since the `.venv` is built from whatever `python3` created it; the BLAS or other compiled library NumPy is linked against, and the CPU it runs on, which change the last bits of a matrix multiplication; the operating system and compiler behind any C++ extension; and anything read from outside the project, such as a data file or an environment variable. A virtual environment isolates `site-packages` and nothing else. When that is not enough, the next step is a container.
:::

::: check
What is the difference between the `dependencies` list in `pyproject.toml` and the contents of `requirements.txt`?
:::

::: answer
`dependencies` in `pyproject.toml` states what your project *can work with*, normally as ranges such as `numpy>=2.0`, and it travels with the project to anyone who installs it. `requirements.txt` records what one particular environment *actually has*, as exact pins such as `numpy==2.4.6`, and exists so that a specific result can be reproduced. A library publishes ranges; an analysis commits pins. A project often has both, and they are not copies of each other.
:::

::: check
You install your own project with `python -m pip install -e .` and then edit a function in `src/descent/`. Do you need to reinstall?
:::

::: answer
No. The `-e` (editable) install puts a link to your source directory into the environment instead of a copy, so the next import picks up the edit immediately. You do need to reinstall after changing `pyproject.toml` itself — a new dependency, a new package directory, a changed name — because that metadata was read at install time. The alternative, a plain `pip install .`, copies the code, so every edit would need a reinstall; editable mode exists precisely so that you can run and test the code you are writing.
:::

## Summary

| Item | Statement |
| --- | --- |
| Create | `python3 -m venv .venv` in the project directory |
| Activate | `source .venv/bin/activate`; `.venv\Scripts\activate` on Windows; `deactivate` to leave |
| Check | `python -c "import sys; print(sys.prefix != sys.base_prefix)"` is `True` inside one |
| Scope | Edits one shell's `PATH`; a second terminal is not activated |
| Isolation | Its own `site-packages`; `include-system-site-packages = false` |
| Install | `python -m pip install numpy`, never a bare `pip` |
| Inspect | `pip list`, `pip show numpy`, `pip uninstall numpy` |
| Record | `python -m pip freeze > requirements.txt`, committed with the code |
| Rebuild | `python -m pip install -r requirements.txt` into a fresh `.venv` |
| Pin vs range | `==2.4.6` reproduces a result; `>=2.0` states what a project can work with |
| `pyproject.toml` | `[project]` name, version, `requires-python`, `dependencies`; `[build-system]` |
| Editable install | `python -m pip install -e .` links the source; edits take effect at once |
| Not isolated | Interpreter version, BLAS and compiled libraries, the OS, your data |
| Never commit | `.venv/`, `__pycache__/` |

That is the module. You can run Python three ways, hold data in the four containers, write functions and modules that other files import, read and write the files an analysis lives on, handle the failures that matter and record the environment that produced the answer. The next Python module turns these into idiomatic code: comprehensions, generators, classes, decorators and type annotations — and after that, NumPy, where a hundred thousand samples stop being a list and start being an array.
