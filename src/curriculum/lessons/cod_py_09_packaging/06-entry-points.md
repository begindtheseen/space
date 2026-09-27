---
id: l06-entry-points
title: Console entry points for command-line tools
minutes: 20
covers:
  - Console entry points for command-line tools
---

Think about speed dial on an old phone. You press and hold `2`, and the phone calls Grandma. You do not need to remember her number, which area code it has, or whether she moved last year. Somebody set up the mapping once — "button 2 means this number" — and from then on one press does the whole job.

A GNC team ships little tools all the time. One prints the speed and period of an orbit. Another decodes a telemetry file from a test firing. Another runs a thousand-case Monte Carlo overnight. Without any setup, a colleague who wants to run one has to know where the script lives, which Python to run it with, and which folder to start in: `python ~/repos/gnc/scripts/orbit.py 400`, and a new error message every time one of those is wrong.

A **console entry point** is speed dial for your package. You write one line in `pyproject.toml` saying "the command `gnc-orbit` means: call the function `main` in the module `gnc.cli`". When anyone installs the package, the installer creates a real command with that name, in the right place, wired to the right Python. They type `gnc-orbit 400` from any folder and it works. This lesson builds such a tool, opens up the file the installer writes, shows how exit codes and tests fit in, and ends with the same mechanism used for plugins.

## A tool worth installing

Start with the function you want to expose. It will be a small **[[command-line|command-line]]** tool — a program you run by typing its name in a terminal, with options after it. Python's standard library has a module for reading those options, **[[argparse|argparse]]**. Here is the whole tool, in a new module of the `gnc` package:

```python
# src/gnc/cli.py
"""Command-line interface for gnc-toolkit."""
import argparse

from .orbits import circular_speed, orbital_period


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="gnc-orbit",
        description="Circular-orbit speed and period at a given altitude.",
    )
    parser.add_argument("altitude_km", type=float, help="altitude above the equator, km")
    args = parser.parse_args(argv)

    if args.altitude_km < 0:
        parser.error("altitude must be zero or positive")

    h = args.altitude_km * 1000.0
    print(f"speed  {circular_speed(h):8.1f} m/s")
    print(f"period {orbital_period(h) / 60:8.1f} min")
    return 0
```

Read it in three parts.

1. `ArgumentParser` describes the command: its name and a one-line description.
2. `add_argument("altitude_km", type=float)` declares one required value, converted to a float. If the user types `gnc-orbit banana`, argparse prints a usage message and stops the program for you.
3. `parse_args(argv)` does the reading. When `argv` is `None`, argparse reads the words the user typed after the command. When `argv` is a list such as `["400"]`, it reads that list instead. That one detail makes the function easy to test, as you will see.

The function returns `0` when it succeeds. Hold on to that; it matters when the program ends.

::: key The main function pattern
Put the command's logic in a function, `main(argv=None)`, that parses `argv`, does the work and returns an integer exit code. The entry point calls it with no arguments; tests call it with a list.
:::

## Declaring the command

Now the speed-dial line. In `pyproject.toml`, add a table named `[project.scripts]`:

```toml
[project]
name = "gnc-toolkit"
version = "0.1.0"
requires-python = ">=3.10"

[project.scripts]
gnc-orbit = "gnc.cli:main"
```

The key, `gnc-orbit`, is the command name people will type. The value is an **object reference**, in the form `module:attribute`. Read `"gnc.cli:main"` aloud as "the attribute `main` of the module `gnc.cli`". Everything before the colon is an importable module path, with dots. Everything after it is a name inside that module.

Python's own tools split it the same way:

```python
from importlib.metadata import EntryPoint

ep = EntryPoint(name="gnc-orbit", value="gnc.cli:main", group="console_scripts")
print(ep.module, ep.attr)
# gnc.cli main
```

Command names are usually lowercase words joined with dashes. A package can declare as many as it likes, one per line.

::: key What a console entry point is
A declaration that maps a command name to a module function; the installer generates the executable shim. It is how a package ships a CLI without users invoking python -m or setting PATH by hand.
:::

::: example Installing and running gnc-orbit
Make a fresh virtual environment, install the package, and run the command from a folder that has nothing to do with the project.

**Step 1.** Install and run:

```text
$ pip install .
$ cd /tmp
$ gnc-orbit 400
speed    7668.6 m/s
period     92.6 min
```

**Step 2.** Check the period by hand. The orbit radius is $r = 6\,378\,137 + 400\,000 = 6\,778\,137\,\mathrm{m}$. The period of a circular orbit is

$$
T = 2\pi\sqrt{\frac{r^3}{\mu}} = 2\pi\sqrt{\frac{(6.778137 \times 10^{6})^3}{3.986004418 \times 10^{14}}} \approx 5554\,\mathrm{s}.
$$

Divide by $60$: about $92.6$ minutes. The International Space Station goes around the Earth in about an hour and a half, so the tool agrees with the real world.

**Step 3.** A harder sanity check: the height of a geostationary orbit, $35\,786\,\mathrm{km}$.

```text
$ gnc-orbit 35786
speed    3074.7 m/s
period   1436.1 min
```

$1436.1$ minutes is $23.93$ hours. A geostationary satellite must go around once per **[[sidereal day|sidereal-day]]**, which is $23.93$ hours, so the tool is right to four figures.

**Step 4.** Try a bad input. The `--` tells argparse that the words after it are values, not options, so `-5` is not mistaken for a flag:

```text
$ gnc-orbit -- -5
usage: gnc-orbit [-h] altitude_km
gnc-orbit: error: altitude must be zero or positive
```

And `gnc-orbit --help` prints the usage line, the description and the help text for `altitude_km`, all generated by argparse. Nobody had to add the project to any path or type `python` at all.
:::

## What the installer writes

Where did the `gnc-orbit` command come from? Not from the wheel. Build the wheel and list it: the only trace of the command is a $43$-byte text file in the metadata folder, `entry_points.txt`:

```text
[console_scripts]
gnc-orbit = gnc.cli:main
```

The backend copied your `[project.scripts]` table into that file, under the group name `console_scripts`. That is all a wheel carries: a description of the command, not the command itself.

The command is written by the **installer** — pip, or uv — at install time, for the machine it is installing on. On Linux and macOS, pip writes a small Python file into the environment's `bin/` folder. Here is the whole of it:

```python
#!/home/you/gnc-toolkit/.venv/bin/python3
# -*- coding: utf-8 -*-
import re
import sys
from gnc.cli import main
if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw|\.exe)?$', '', sys.argv[0])
    sys.exit(main())
```

That file is a **[[shim|shim]]** — a thin piece of glue whose only job is to hand control to the real code. Line by line:

- The first line, starting with `#!`, is a **[[shebang|shebang]]**. It tells the operating system which program runs this file: the Python *inside this environment*, by its full path.
- `from gnc.cli import main` imports your function, exactly as the object reference said.
- The `re.sub` line tidies the program's name, removing a Windows `.exe` ending if there is one, so help messages say `gnc-orbit`.
- `sys.exit(main())` calls your function and hands its return value to the operating system as the exit code.

On Windows, pip writes a small `gnc-orbit.exe` launcher into the environment's `Scripts\` folder instead, because Windows does not read shebang lines. That is why the wheel carries only a description: the right command file depends on the target machine, and only the installer knows the target.

The shebang explains something useful. The command remembers its own environment. Even when that environment is not active, running `/home/you/gnc-toolkit/.venv/bin/gnc-orbit 400` by its full path uses the right Python, with the right packages. And when the environment is active, its `bin/` folder is at the front of **[[PATH|path-variable]]**, the list of folders the terminal searches for commands, so the short name works.

::: warning A typo installs fine and fails later
pip does not import your code at install time, so it cannot check the object reference. Misspell it as `"gnc.cli:mian"` and the install succeeds. The first person to run the command gets:

```text
ImportError: cannot import name 'mian' from 'gnc.cli'
```

Add a test that runs the installed command, shown below, so CI finds the typo before a colleague does.
:::

::: warning Editable installs and new commands
The shim imports your code, so with an editable install, edits to `main` take effect at once. But the shim itself is written only at install time. Add a second command, or rename one, and nothing appears until you run `pip install -e .` again.
:::

## Exit codes: how a command reports success

Every program that finishes hands the operating system one small whole number, its **[[exit code|exit-code]]**. Zero means success. Anything else means something went wrong, and different numbers can mean different problems. Shells, CI servers and pipeline scripts read this number to decide whether to carry on. A nightly Monte Carlo script that runs `gnc-orbit` and then a plotting step relies on it: a nonzero code stops the pipeline instead of plotting garbage.

`sys.exit(value)` turns a Python value into an exit code. It helps to see all the cases:

```python
import subprocess
import sys

for value in ["0", "None", "3", "'bad input file'"]:
    result = subprocess.run(
        [sys.executable, "-c", f"import sys; sys.exit({value})"],
        capture_output=True, text=True,
    )
    print(f"{value:18} exit code {result.returncode}  stderr: {result.stderr.strip()!r}")
# 0                  exit code 0  stderr: ''
# None               exit code 0  stderr: ''
# 3                  exit code 3  stderr: ''
# 'bad input file'   exit code 1  stderr: 'bad input file'
```

So a `main` that returns `0`, or returns nothing at all, reports success. A `main` that returns a number reports that number. A `main` that returns a string prints the string as an error and reports $1$. And argparse, when the user types something invalid, exits with code $2$, the usual code for "you used the command wrong".

::: example Testing a command-line tool three ways
You want CI to prove that `gnc-orbit` works. The `main(argv=None)` pattern makes that easy.

```python
# tests/test_cli.py
import subprocess

import pytest

from gnc.cli import main


def test_main_prints_speed_and_period(capsys):
    assert main(["400"]) == 0
    out = capsys.readouterr().out
    assert "7668.6 m/s" in out
    assert "92.6 min" in out


def test_negative_altitude_is_rejected(capsys):
    with pytest.raises(SystemExit) as exc:
        main(["--", "-5"])
    assert exc.value.code == 2
    assert "zero or positive" in capsys.readouterr().err


def test_installed_command_runs():
    result = subprocess.run(["gnc-orbit", "400"], capture_output=True, text=True)
    assert result.returncode == 0
    assert "92.6 min" in result.stdout
```

**Test 1** calls `main` directly with a list, the way the shim would with real input. pytest's `capsys` fixture captures what was printed, so the test can check the numbers from the example above.

**Test 2** checks the failure path. `parser.error` does not return; it raises `SystemExit` with code $2$. `pytest.raises` catches that, and the test checks both the code and the message on the error stream.

**Test 3** runs the *installed* command in a separate process, exactly as a user would. It is the only one of the three that catches a misspelled object reference in `pyproject.toml`, because it is the only one that goes through the shim.

Run from outside the source tree, with the package installed:

```text
$ pytest -q ~/gnc-toolkit/tests/test_cli.py
...                                                    [100%]
3 passed in 0.05s
```

The first two are fast and precise. The third is slower but proves the wiring. Keep all three.
:::

## python -m: the other front door

There is a second way to run a package as a program, with no entry point at all. Put a file named `__main__.py` in the package:

```python
# src/gnc/__main__.py
import sys

from .cli import main

sys.exit(main())
```

Now `python -m gnc 400` runs it. The `-m` flag tells Python "find this package on `sys.path` and run its `__main__.py`". The output is the same as `gnc-orbit 400`.

The two doors suit different moments. The entry point is the polished door for users: a short name, available anywhere once the environment is active. `python -m` is the precise door: it runs the package with *exactly* the Python you typed, which is why experienced people type `python -m pip install ...` instead of `pip install ...` when several Pythons live on one machine. Many packages offer both, and both call the same `main`.

::: note Why not put the scripts in a scripts/ folder?
Older projects shipped plain `.py` files and asked users to run them, or used a setuptools option that copied them into `bin/`. Both break in the same ways. A copied script has no link to the environment it was installed into, so its imports can find the wrong package, or none. It cannot be tested by importing it, because it runs everything at the top level. And on Windows a `.py` file is not a command at all. An entry point avoids all three: the installer writes a launcher for each platform, bound to the right Python, and your logic lives in an importable, testable function.
:::

## Entry-point groups and plugins

`console_scripts` is only one **entry-point group**. A group is a named list that any installed package can add to, and that any program can read. `[project.scripts]` is shorthand for the group `console_scripts`, and `[project.gui-scripts]` for `gui_scripts`, which on Windows starts a program without opening a console window. You can also invent your own group, and that gives you a **[[plugin|plugin]]** system for free.

Say your simulator lets people add atmosphere models without editing the simulator. A separate package, `gnc-atmos`, declares one:

```toml
[project]
name = "gnc-atmos"
version = "0.1.0"

[project.entry-points."gnc.atmospheres"]
exponential = "gnc_atmos:exponential"
```

The group name `gnc.atmospheres` is in quotes because it contains a dot. The simulator finds every installed model by reading the group:

```python
from importlib.metadata import entry_points

for ep in entry_points(group="gnc.atmospheres"):
    print(ep.name, "->", ep.value)
    model = ep.load()
    print(round(model(10_000), 4))
# exponential -> gnc_atmos:exponential
# 0.3777
```

`ep.load()` imports the module and returns the function. Here it is an exponential model, $\rho = 1.225\,e^{-h/8500}$, read "rho equals 1.225 times e to the minus h over 8500", with density $\rho$ in $\mathrm{kg/m^3}$ and height $h$ in meters. At $10\,\mathrm{km}$: $1.225 \times e^{-10\,000/8500} = 1.225 \times 0.3084 \approx 0.378\,\mathrm{kg/m^3}$, about a third of the density at sea level, which is right for airliner cruising height.

The simulator never imported `gnc_atmos` by name. Installing the plugin package was enough. pytest finds its plugins the same way, through a group named `pytest11`.

## Check yourself

::: check
Write the `pyproject.toml` lines that create a command `tlm-decode` which calls the function `run` in the module `gnc.telemetry.decode`. Then say, in words, what pip does with them when the package is installed on a Linux machine.
:::

::: answer
```toml
[project.scripts]
tlm-decode = "gnc.telemetry.decode:run"
```

The backend copies the line into `entry_points.txt` in the wheel's metadata, under `[console_scripts]`. At install time pip reads it and writes an executable file named `tlm-decode` into the environment's `bin/` folder. That file's shebang names the environment's Python, it imports `run` from `gnc.telemetry.decode`, and it calls `sys.exit(run())`.
:::

::: check
A colleague's `main` function ends with `print("done")` and no `return`. Another ends with `return "3 cases diverged"`. What exit code does each command report, and which one lets a CI job notice a problem?
:::

::: answer
The first returns `None`, and `sys.exit(None)` reports exit code $0$, success. The second returns a string; `sys.exit` prints the string to the error stream and reports exit code $1$. Only the second tells CI that something failed. Even better is to return a clear integer, such as $1$, after printing a helpful message, so the code is deliberate.
:::

::: check
You install a package in a virtual environment, deactivate the environment, and type `gnc-orbit 400`. The shell says "command not found". Then you type the full path, `.venv/bin/gnc-orbit 400`, and it works. Explain both results.
:::

::: answer
The shell looks for commands only in the folders listed in PATH. Activating the environment puts its `bin/` folder at the front of PATH; deactivating removes it, so the short name is not found. Typing the full path skips the PATH search. The shim's shebang line names the environment's own Python by its full path, so the command still runs with the right interpreter and the right installed packages, active or not.
:::

::: check
Why does `main` take an `argv` parameter instead of always reading the real command line?
:::

::: answer
With `argv=None`, argparse reads the words the user typed, which is what the shim needs. With a list, it reads the list. That lets a test call `main(["400"])` in the same process and check the return value and printed output directly, with no subprocess and no real command line. Without the parameter, a test would have to fake `sys.argv` or run the program as a separate process for every case.
:::

::: check
You maintain a trajectory tool and want other teams to add new guidance laws without sending changes to your repository. Sketch how entry points solve this: what the other team writes, and what your tool does.
:::

::: answer
Pick a group name, say `traj.guidance`. The other team makes its own package and declares, in its `pyproject.toml`, a table `[project.entry-points."traj.guidance"]` with a line such as `pdg = "their_pkg.laws:powered_descent"`. Your tool calls `importlib.metadata.entry_points(group="traj.guidance")`, lists the names it finds, and calls `ep.load()` on the one the user picks to get the function. Installing their package is enough to make the new law appear; your code never names their package.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Console entry point | A command name mapped to a function | `[project.scripts]`, `name = "module:function"` |
| Object reference | `gnc.cli:main` | Module path before the colon, attribute after it |
| `entry_points.txt` | What the wheel carries | The declaration, under `[console_scripts]` |
| Shim | The command file the installer writes | Shebang to the environment's Python, then `sys.exit(main())` |
| `main(argv=None)` | The testable pattern | Tests call it with a list; the shim calls it bare |
| Exit code | The number a program hands back | $0$ success; nonzero failure; argparse uses $2$ |
| `python -m pkg` | Runs `pkg/__main__.py` | Uses exactly the Python you typed |
| Entry-point group | A named list any package can join | `importlib.metadata.entry_points(group=...)` finds plugins |

The next lesson turns from what your package provides to what it needs: how to write the versions of its dependencies, with exact pins for applications, ranges for libraries, and lockfiles for both.

::: context command-line Talking to the computer in words
A terminal is a window where you type commands instead of clicking. The program reading what you type is the shell (bash, zsh or PowerShell). A command-line tool is any program meant to be run there: its name first, then its arguments, separated by spaces. Flight and test teams live in terminals because commands can be scripted, logged and rerun exactly, which a sequence of mouse clicks cannot.
:::

::: context argparse The standard library's option reader
argparse turns the words after a command into Python values. You declare each argument once, with its type and help text, and it handles the rest: converting `"400"` to `400.0`, rejecting bad input with a usage message, and writing the `--help` page. Libraries such as Click and Typer do the same job with decorators, but argparse ships with Python, so a tool built on it needs no extra dependency.
:::

::: context sidereal-day Why a day in orbit is 23.93 hours
A normal, solar day of 24 hours is measured from noon to noon. But the Earth moves along its path around the Sun during that day, so it must turn a little more than once to bring the Sun back overhead. Measured against the distant stars instead, one full turn takes about 23 hours 56 minutes, or $23.93$ hours: the sidereal day. A geostationary satellite has to match that turn, not the 24-hour clock.
:::

::: context shim A thin piece of glue
In carpentry a shim is a thin wedge slipped into a gap to make two parts fit. In software it is a tiny program that sits between two others and passes control along. The console-script shim knows only two things: which Python to use and which function to call. Everything else lives in your package.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="40" width="80" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="48" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">you type</text>
  <text x="48" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">gnc-orbit</text>
  <rect x="100" y="40" width="72" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="136" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">shim in</text>
  <text x="136" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">.venv/bin</text>
  <rect x="184" y="40" width="72" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">.venv</text>
  <text x="220" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">python3</text>
  <rect x="268" y="40" width="84" height="40" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="310" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">gnc.cli</text>
  <text x="310" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">main()</text>
  <g fill="#1f2a44">
    <polygon points="100,60 92,55 92,65"/><polygon points="184,60 176,55 176,65"/><polygon points="268,60 260,55 260,65"/>
  </g>
  <text x="136" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">shebang</text>
  <text x="220" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">import</text>
  <text x="310" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">exit code back</text>
</svg>
```
:::

::: context shebang The #! line
The two characters `#!` at the very start of a file are called a shebang, from "hash" and "bang", programmers' names for `#` and `!`. On Linux and macOS, when you run a file marked executable, the operating system reads that first line and starts the program it names, passing the file along. To Python the line is a comment, so it does no harm.
:::

::: context path-variable How the shell finds a command
PATH is an environment variable holding a list of folders, separated by colons on Linux and macOS and by semicolons on Windows. When you type a command, the shell checks each folder in order and runs the first file with that name. Activating a virtual environment puts its `bin/` folder first, which is why its `python` and its commands win.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="18" font-size="12" fill="#1f2a44" font-weight="bold">PATH, searched in order</text>
  <rect x="12" y="28" width="200" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="20" y="45" font-size="11" fill="#1f2a44">1. ~/gnc-toolkit/.venv/bin</text>
  <rect x="12" y="54" width="200" height="26" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="20" y="71" font-size="11" fill="#1f2a44">2. /usr/local/bin</text>
  <rect x="12" y="80" width="200" height="26" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="20" y="97" font-size="11" fill="#1f2a44">3. /usr/bin</text>
  <rect x="244" y="28" width="104" height="26" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="296" y="45" font-size="11" text-anchor="middle" fill="#b4232c">gnc-orbit found</text>
  <line x1="212" y1="41" x2="238" y2="41" stroke="#b4232c" stroke-width="2"/>
  <polygon points="244,41 236,36 236,46" fill="#b4232c"/>
  <text x="12" y="132" font-size="11" fill="#6c7a93">deactivate and row 1 disappears: command not found</text>
</svg>
```
:::

::: context exit-code The number every program leaves behind
In a Linux or macOS shell, `echo $?` prints the exit code of the last command. A code is a whole number from 0 to 255. Zero is the only success; by convention 1 is a general error and 2 is misuse of the command, which is why argparse uses 2. CI systems mark a step failed on any nonzero code, and the shell's `&&` runs the next command only after a zero.
:::

::: context plugin Extending a program without editing it
A plugin is a piece of code, shipped separately, that a host program finds and uses at run time. Entry-point groups are Python's standard way to do it: installing a package registers its plugins in its metadata, and the host reads that metadata. pytest (group `pytest11`), Sphinx themes and many data-format readers work this way. A simulator can do the same for atmosphere, gravity or sensor models.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="120" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">gnc-atmos</text>
  <text x="80" y="55" font-size="11" text-anchor="middle" fill="#1f2a44">exponential</text>
  <rect x="20" y="84" width="120" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">another package</text>
  <text x="80" y="119" font-size="11" text-anchor="middle" fill="#1f2a44">us76</text>
  <rect x="210" y="50" width="136" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="278" y="71" font-size="11" text-anchor="middle" fill="#1f2a44">simulator reads</text>
  <text x="278" y="87" font-size="11" text-anchor="middle" fill="#1f2a44">gnc.atmospheres</text>
  <line x1="140" y1="42" x2="202" y2="68" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="210,71 199,72 203,63" fill="#1d6fd1"/>
  <line x1="140" y1="106" x2="202" y2="84" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="210,81 203,88 199,79" fill="#1d6fd1"/>
</svg>
```
:::
