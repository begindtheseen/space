---
id: l12-argparse
title: Command-line tools with argparse
minutes: 20
covers:
  - argparse for command-line tools
---

Think about a paper form at a doctor's office. Some boxes you must fill in, in order: name, date of birth. Some are labeled and optional: "Allergies, if any". Some are checkboxes you tick or leave blank. The form tells you what it wants, and if you write "banana" in the date box, the receptionist hands it back and points at that one box.

A program run from the terminal can take its inputs the same way. A **command-line argument** is a word you type after the program's name, like `500` or `--seed 41`. The standard library module **`argparse`** turns your program into that well-designed form: you declare the boxes, and it reads what the user typed, converts it to numbers, checks it, points at the wrong box when something is off, and writes a help page for you.

Here is why that matters for real work. A **[[dispersion sweep|dispersion-sweep]]** runs a vehicle simulation thousands of times with slightly different inputs. It has a number of cases, a random seed, a structural limit and an output file. The first version of the script puts those at the top as constants, and every run edits them. Three weeks later you have a folder of results and no record of which constants produced which file, because the constants lived in the source and the source has moved on.

Make them command-line arguments and your **shell history** — the terminal's list of commands you have typed — becomes the record. `sweep.py 5000 --seed 41 --limit-kpa 33.0 --out cold_case.txt` says exactly what was run. The script is now usable by someone who has never read it, and schedulable by a batch system that cannot edit source files. This lesson builds that tool, starting with the hand-made version, because comparing the two is the best argument for `argparse`.

## What a program sees: `sys.argv`

When you type a command, the shell splits it at the spaces and hands your program a list of strings. In Python that list is **`sys.argv`**, read "sys dot arg-v", short for "argument vector". Item `0` is the script's name. Everything you typed after it follows, in order, as **[[strings, never numbers|argv-list]]**. `500` arrives as the text `"500"`, not the number five hundred.

So reading arguments by hand means indexing into that list and converting each item yourself:

```python
# manual.py
import sys

if len(sys.argv) < 3:
    print("usage: manual.py CASES SEED [LIMIT]")
    raise SystemExit(2)

cases = int(sys.argv[1])
seed = int(sys.argv[2])
limit = float(sys.argv[3]) if len(sys.argv) > 3 else 35.0
print(cases, seed, limit)
```

The square brackets in `[LIMIT]` are the usual way a usage line marks something optional. `raise SystemExit(2)` ends the program with **exit status** 2 — a small whole number every program hands back to whatever started it, where `0` means "it worked".

```bash
python3 manual.py 500 20250922
python3 manual.py 500 20250922 33.0
# 500 20250922 35.0
# 500 20250922 33.0
```

It works. With no third argument, the limit falls back to 35.0, and with one it takes 33.0.

## Four problems with doing it by hand

That tiny script already carries four separate liabilities.

First, the usage string is maintained by hand. The day someone adds a fourth argument and forgets to update it, the message is wrong.

Second, position is the only interface. `manual.py 20250922 500` is a perfectly valid call with the two numbers swapped, and nothing will complain — you get twenty million cases and seed 500.

Third, adding a fifth parameter means renumbering every index below it.

Fourth, a bad value produces a raw **traceback** — Python's multi-line report of where an error happened inside your code — instead of a message the user can act on:

```bash
python3 manual.py five 20250922 2>&1 | tail -1
# ValueError: invalid literal for int() with base 10: 'five'
```

Read `2>&1` aloud as "send **[[stream 2 into stream 1|stdout-stderr]]**": it merges the error output into the normal output, so `| tail -1` ("pipe into tail, last line") can show the last line of the traceback. A person who mistypes a number should get one line naming the argument that was wrong, not a tour of your file.

## The same interface with argparse

Here is the sweep written properly. It builds on the logging lesson: `-v` turns on INFO messages and `-vv` turns on DEBUG.

```python
# sweep.py
"""Run a dispersion sweep and report the cases over the structural limit."""
import argparse
import logging
import random
from pathlib import Path

log = logging.getLogger(__name__)


def build_parser():
    parser = argparse.ArgumentParser(
        prog="sweep.py",
        description="Run a dispersion sweep and report limit exceedances.",
    )
    parser.add_argument("cases", type=int, help="number of Monte Carlo cases")
    parser.add_argument("--seed", type=int, default=20250922, help="RNG seed")
    parser.add_argument(
        "--limit-kpa", type=float, default=35.0, help="structural limit on q"
    )
    parser.add_argument(
        "--config", choices=["nominal", "hot_high", "cold_low"], default="nominal"
    )
    parser.add_argument("--out", type=Path, help="write the exceedance list here")
    parser.add_argument(
        "-v", "--verbose", action="count", default=0, help="-v for INFO, -vv for DEBUG"
    )
    return parser


OFFSET = {"nominal": 31.0, "hot_high": 32.6, "cold_low": 29.8}


def run(args):
    rng = random.Random(args.seed)
    mean = OFFSET[args.config]
    log.info("sweep: %d cases, config=%s, limit=%.1f kPa", args.cases, args.config, args.limit_kpa)
    over = []
    for case in range(args.cases):
        q = rng.gauss(mean, 2.4)
        log.debug("case %d: q=%.3f kPa", case, q)
        if q > args.limit_kpa:
            over.append(case)
    log.info("exceedances: %d of %d", len(over), args.cases)
    if args.out is not None:
        args.out.write_text("\n".join(str(c) for c in over) + "\n")
        log.info("wrote %s", args.out)
    return over


def main(argv=None):
    args = build_parser().parse_args(argv)
    level = [logging.WARNING, logging.INFO, logging.DEBUG][min(args.verbose, 2)]
    logging.basicConfig(level=level, format="%(levelname)s %(name)s: %(message)s")
    over = run(args)
    print(len(over))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

The simulation is a stand-in. Each case draws a peak **[[dynamic pressure|max-q]]** $q$ (in kilopascals, kPa) from a bell curve with the configuration's mean and a spread of 2.4 kPa, and counts the cases above the limit. The interesting part is `build_parser`.

`ArgumentParser` makes the empty form. Each `add_argument` call adds one box. When the program runs, `parse_args` reads the list of strings, fills in the boxes and hands back a **namespace** — a plain object with one attribute per argument, so you write `args.cases`, `args.seed` and so on.

The help page is generated from those declarations. Nobody wrote it:

```bash
python3 sweep.py --help
# usage: sweep.py [-h] [--seed SEED] [--limit-kpa LIMIT_KPA]
#                 [--config {nominal,hot_high,cold_low}] [--out OUT] [-v]
#                 cases
#
# Run a dispersion sweep and report limit exceedances.
#
# positional arguments:
#   cases                 number of Monte Carlo cases
#
# options:
#   -h, --help            show this help message and exit
#   --seed SEED           RNG seed
#   --limit-kpa LIMIT_KPA
#                         structural limit on q
#   --config {nominal,hot_high,cold_low}
#   --out OUT             write the exceedance list here
#   -v, --verbose         -v for INFO, -vv for DEBUG
```

That is wrapped for a terminal 80 characters wide; a wider window shows the same content on fewer lines. Nobody maintains it, and it cannot drift from the code, because it *is* the code.

Now run it:

```bash
python3 sweep.py 500 -v 2>&1
# INFO __main__: sweep: 500 cases, config=nominal, limit=35.0 kPa
# INFO __main__: exceedances: 21 of 500
# 21
```

```bash
python3 sweep.py 500 --config hot_high --limit-kpa 36.0 --out over.txt -v 2>&1
head -3 over.txt
# INFO __main__: sweep: 500 cases, config=hot_high, limit=36.0 kPa
# INFO __main__: exceedances: 35 of 500
# INFO __main__: wrote over.txt
# 35
# 10
# 12
# 14
```

Sanity-check those counts. With a mean of 31.0 kPa and a spread of 2.4 kPa, a limit of 35.0 kPa sits $(35.0 - 31.0)/2.4 \approx 1.67$ spreads above the mean, and a bell curve puts about 4.8% of its cases beyond that — about 24 out of 500. We got 21. The hot-and-high case, mean 32.6 kPa against a limit of 36.0 kPa, is $1.42$ spreads out, about 7.8%, or 39 expected; we got 35. Both are within the wobble you expect from 500 random draws. And because the **[[seed|seeds]]** is fixed by default, running the same command again gives exactly the same 21 and 35.

## Reading the declarations

Six details in `build_parser` are worth naming one at a time.

**Positional or optional.** A name with no dashes, like `"cases"`, is a **positional argument**: required, and recognized by where it sits. A name with dashes, like `"--seed"`, is an **optional argument** (also called an option or flag): recognized by its label, so it can go anywhere on the line. Read `--seed` as "dash dash seed". A single dash marks a one-letter short form, so `-v` and `--verbose` are the same option.

**`type=` converts and checks in one step.** `type=int` and `type=float` turn the string into a number, so `args.cases` is already an `int` when you see it. `type=Path` does the same for a file path, which is why `args.out.write_text(...)` works without any conversion where it is used. Any function that takes one string and returns a value is allowed there.

**Dashes become underscores.** `--limit-kpa` becomes `args.limit_kpa`. Dashes are the normal separator in command-line flags, but `args.limit-kpa` would be read by Python as a subtraction. If you want a different attribute name, `dest="q_limit"` sets it explicitly.

**`choices=` and `default=`.** `choices=[...]` rejects anything not in the list and shows the options in the help. `default=` supplies the value when the flag is left out. If you want the defaults printed in the help page too, pass `formatter_class=argparse.ArgumentDefaultsHelpFormatter` to `ArgumentParser`.

**`action=` changes what the flag does.** `action="count"` makes `-v`, `-vv`, `-vvv` give 1, 2, 3 — the conventional way to expose logging levels. `action="store_true"` is the plain on/off switch: a flag that takes no value, where being present means `True`.

**No default means `None`.** `--out` has no default, so `args.out` is `None` when the flag is absent, and `run` tests for that with `is not None`. An optional file argument should be `None`, not an empty string, so that "not asked for" and "asked for with an empty name" stay different.

::: key The argparse form
A positional argument (`"cases"`) is required and found by position; an optional argument (`"--seed"`) is found by its label and falls back to its `default`, or `None`. `type=` converts and validates, `choices=` restricts, `action="store_true"` makes an on/off flag, `action="count"` counts repeats, and `--limit-kpa` arrives as `args.limit_kpa`.
:::

::: example The errors a user sees
Every mistake produces one line naming the offending argument, and exit status 2:

```bash
python3 sweep.py 2>&1 | tail -1
# sweep.py: error: the following arguments are required: cases
```

```bash
python3 sweep.py five 2>&1 | tail -1
# sweep.py: error: argument cases: invalid int value: 'five'
```

```bash
python3 sweep.py 500 --config warm 2>&1 | tail -1
# sweep.py: error: argument --config: invalid choice: 'warm' (choose from 'nominal', 'hot_high', 'cold_low')
```

(These are from Python 3.11; the exact wording can shift a little between versions.) Before the error line, argparse also prints the short usage line, which is why the transcript keeps only the last line.

Compare that with the manual version's `ValueError: invalid literal for int() with base 10: 'five'` and its traceback. The difference is not politeness. A traceback tells the user that *your program* is broken. A usage error tells them that *their command* was, and which part of it.

The **[[exit status|exit-status]]** is part of the interface too. `argparse` exits with 2 on a usage error, a common convention, while the manual script's uncaught `ValueError` exited with 1, Python's status for "the program crashed". `main` returns 0 on success. So a shell line like `sweep.py 5000 || echo failed` — read `||` as "or else": run the second command only if the first one failed — behaves correctly without anybody reading the output.

`raise SystemExit(main())` is the idiom that makes this work. `main` returns a whole number, and raising `SystemExit` with it ends the program with that status. Step by step: Python calls `main()`, `main` returns `0`, `SystemExit(0)` is raised, and the process exits with status 0. Returning a value, rather than calling `sys.exit` deep inside the work, keeps `main` callable from a test.
:::

::: example Parsing without a subprocess
`parse_args()` with no argument reads `sys.argv[1:]` — everything after the script's name. Passing a list instead is what makes the whole interface testable. The parser and the run can be exercised inside Python, with no shell and no second process:

```python
# test_sweep.py
"""Exercise the parser and the run without starting a subprocess."""
from sweep import build_parser, run

parser = build_parser()

args = parser.parse_args(["500"])
print(args.cases, args.seed, args.limit_kpa, args.config, args.out, args.verbose)

args = parser.parse_args(["500", "--limit-kpa", "33.0", "--config", "cold_low", "-vv"])
print(args.cases, args.limit_kpa, args.config, args.verbose)

print(len(run(parser.parse_args(["500"]))))
print(len(run(parser.parse_args(["500", "--limit-kpa", "33.0"]))))

try:
    parser.parse_args(["500", "--config", "warm"])
except SystemExit as exc:
    print("SystemExit code", exc.code)
```

```bash
python3 test_sweep.py 2>/dev/null
# 500 20250922 35.0 nominal None 0
# 500 33.0 cold_low 2
# 21
# 88
# SystemExit code 2
```

`2>/dev/null` ("send stream 2 to nowhere") throws away the usage message that argparse prints for the last case.

Walk through the output. Line 1: with only `"500"`, every option took its default, and `--out` came back as `None`. Line 2: `"33.0"` arrived as the float `33.0`, and `-vv` counted to 2. Line 3: the same 21 exceedances as the command line gave, because the seed is the same. Line 4: lowering the limit to 33.0 kPa lets more cases over — 88. Sanity check: 33.0 is $2.0/2.4 \approx 0.83$ spreads above the mean, where a bell curve puts about 20% of cases, or 101 expected. 88 is in range, and more than 21, as it must be.

The last case matters most. An invalid choice raises `SystemExit`, not `ValueError`. `argparse` is designed to end the program, so a test that checks a rejection must catch `SystemExit` and look at its `code`, which is 2 for a usage error.

This is the reason for the **[[three-function shape|three-functions]]**. `build_parser` makes the parser, a value you can construct and question. `run` takes the parsed arguments and does the work, so a test can hand it arguments without typing any strings. `main` is the thin layer that wires them together, and it is the only part tied to a running process.
:::

::: warning `type=bool` does not do what it looks like
```python
# bool_trap.py
import argparse

parser = argparse.ArgumentParser(prog="bool_trap.py")
parser.add_argument("--plot", type=bool, default=False, help="the wrong way")
parser.add_argument("--save", action="store_true", help="the right way")

for argv in ([], ["--plot", "True"], ["--plot", "False"], ["--save"]):
    args = parser.parse_args(argv)
    print(argv, "->", "plot:", args.plot, "save:", args.save)
```

```bash
python3 bool_trap.py
# [] -> plot: False save: False
# ['--plot', 'True'] -> plot: True save: False
# ['--plot', 'False'] -> plot: True save: False
# ['--save'] -> plot: False save: True
```

`--plot False` set `plot` to `True`. `type=bool` calls `bool("False")`, and **[[every non-empty string is truthy|string-truthiness]]**, so the only ways to get `False` are to leave the flag out or pass an empty string. A run that was meant to skip plotting spends an hour drawing figures.

Use `action="store_true"` for an on/off flag, which takes no value at all. For a three-way setting, use `choices=["on", "off", "auto"]` and convert it yourself, where the conversion is visible.
:::

## More flag shapes

Three more patterns cover most of what real tools need. This script shows all three at once:

```python
# flags.py
import argparse

parser = argparse.ArgumentParser(prog="flags.py")
parser.add_argument("--no-plot", action="store_false", dest="plot")
parser.add_argument("--save", action=argparse.BooleanOptionalAction, default=True)
group = parser.add_mutually_exclusive_group()
group.add_argument("-q", "--quiet", action="store_true")
group.add_argument("-v", "--verbose", action="count", default=0)

for argv in ([], ["--no-plot"], ["--no-save", "-vv"], ["-q"]):
    args = parser.parse_args(argv)
    print(argv, "->", args)

parser.parse_args(["-q", "-v"])
```

```bash
python3 flags.py 2>&1
# [] -> Namespace(plot=True, save=True, quiet=False, verbose=0)
# ['--no-plot'] -> Namespace(plot=False, save=True, quiet=False, verbose=0)
# ['--no-save', '-vv'] -> Namespace(plot=True, save=False, quiet=False, verbose=2)
# ['-q'] -> Namespace(plot=True, save=True, quiet=True, verbose=0)
# usage: flags.py [-h] [--no-plot] [--save | --no-save] [-q | -v]
# flags.py: error: argument -v/--verbose: not allowed with argument -q/--quiet
```

Take them in order.

**`action="store_false"` with `dest=`** makes a "turn this off" flag. `--no-plot` stores `False` into `args.plot`, and when the flag is absent, `plot` is `True`. The `dest="plot"` is what names the attribute `plot` rather than `no_plot`.

**`argparse.BooleanOptionalAction`** (Python 3.9 and later) makes a matched pair from one declaration: `--save` sets `True` and `--no-save` sets `False`. The usage line shows it as `[--save | --no-save]`, where `|` reads "or".

**`add_mutually_exclusive_group()`** makes options that cannot be used together. Asking for `-q` (quiet) and `-v` (verbose) at once becomes a usage error with exit status 2, instead of something your code has to sort out.

## Where argparse stops

Two more tools are worth knowing before you need them.

**Subcommands.** Some tools have several verbs: `git commit`, `git push`. In argparse these come from `parser.add_subparsers()`, and each subcommand gets its own small parser with its own arguments:

```python
# tool.py
import argparse

parser = argparse.ArgumentParser(prog="tool.py")
sub = parser.add_subparsers(dest="command", required=True)

run_p = sub.add_parser("run", help="run a sweep")
run_p.add_argument("cases", type=int)

report_p = sub.add_parser("report", help="summarize a result file")
report_p.add_argument("path")

print(parser.parse_args(["run", "500"]))
print(parser.parse_args(["report", "over.txt"]))
```

```bash
python3 tool.py
# Namespace(command='run', cases=500)
# Namespace(command='report', path='over.txt')
```

`dest="command"` records which verb was used, so `main` can decide what to call. Reach for subcommands when a tool grows a second verb, not before.

**Configuration files.** Settings too numerous for one command line belong in a file. The usual arrangement is `--config run.toml` for the bulk of the settings — a **[[TOML|toml]]** file is a plain-text settings file of `name = value` lines — with command-line flags overriding a few individual values. The campaign is then reproducible from a file you can commit and a command you can read.

::: key The testable command-line shape
Write `build_parser()`, `run(args)` and `main(argv=None)`, with `args = build_parser().parse_args(argv)` inside `main`, and end the file with `if __name__ == "__main__": raise SystemExit(main())`. Production calls `main()` and gets `sys.argv[1:]`; a test calls `main([...])` with its own list. Usage errors raise `SystemExit` with code 2; success returns 0.
:::

## Check yourself

::: check
`parser.add_argument("--limit-kpa", type=float)` — what attribute name does the parsed result carry, and why not the one you wrote?
:::

::: answer
`args.limit_kpa`. Argparse drops the leading dashes and turns the inner dash into an underscore. The result is an object whose attributes you reach with a dot, and `args.limit-kpa` would be read as `args.limit` minus `kpa`.

Each side gets the spelling it expects: dashes are normal in command-line flags, underscores are normal in Python names. If you want something else, `dest="q_limit"` names the attribute explicitly — worth doing when the flag name is long, or when two flags should write to the same place.
:::

::: check
Why does `--plot False` set the flag to `True` when the argument was declared `type=bool`?
:::

::: answer
`type=` names a conversion function that argparse calls on the string it read, and `bool("False")` is `True`, because every non-empty string is truthy. Only the empty string would give `False`, which is awkward to type and pointless to require.

The right declaration for an on/off flag is `action="store_true"`, which takes no value: present means `True`, absent means `False`. The help page is better too, because the flag is shown without a placeholder, and `--save` is shorter and clearer than `--save True`. If you want both spellings, `argparse.BooleanOptionalAction` gives you `--save` and `--no-save`.

Remember the symptom from the lesson: the run that was told not to plot, plotted.
:::

::: check
What does `parse_args()` read when you give it no argument, and why does the worked example pass a list instead?
:::

::: answer
It reads `sys.argv[1:]` — everything after the script's name. That is right in production, and it is what makes a parser awkward to test, because exercising it would mean changing `sys.argv` or starting a second process.

Passing a list, `parse_args(["500", "--limit-kpa", "33.0"])`, parses those strings instead. A test can then check that the conversion produced a float, that the default seed is what the documentation says, and that an invalid choice is rejected — all inside Python, in milliseconds.

The pattern that allows this is `def main(argv=None)` with `parse_args(argv)` inside. Production calls `main()`, `argv` is `None`, and argparse falls back to `sys.argv[1:]`. A test calls `main(["500", "-v"])` and gets its own list. The `None` default is the hinge.
:::

::: check
A colleague's script prints a traceback when given a bad number, and yours prints one line and exits with status 2. Why does the exit status matter?
:::

::: answer
Because whatever runs your script reads it. A shell `&&` chain, a Makefile, a continuous-integration job, a batch scheduler running 500 sweeps overnight: all of them decide what to do next from the exit status, and all of them treat 0 as success. A script that exits 0 after failing gets recorded as a successful run with missing output, and that is discovered days later.

Argparse exits with 2 for a usage error, the common convention for "your command was wrong", as distinct from 1 for "the program failed" — which is what an uncaught exception gives. Returning a whole number from `main` and writing `raise SystemExit(main())` gives you the same control over your own failures, and keeps `main` callable from a test, where a `sys.exit` buried in the middle of the work would end the test run.
:::

::: check
Your sweep takes a number of cases, a seed, a limit and an output path. When should those become a configuration file instead of command-line flags?
:::

::: answer
When the number of settings passes the point where a command is readable, or when the settings need to be kept under version control beside the results. Four flags fit comfortably on one line. Forty do not, and a forty-flag command is neither reviewable nor reproducible, because nobody will copy it correctly.

The usual arrangement keeps both: `--config run.toml` for the bulk of the settings, and a handful of flags that override individual values for a one-off variation. The file is committed with the campaign and answers "what was run"; the flags answer "what did you change this time".

Two things stay on the command line whatever happens. The verbosity flag, because it is about this run and not about the analysis. And the output path, because it is about where this run's results go, not what they are.
:::

## Summary

| Item | Statement |
| --- | --- |
| `sys.argv` | The list of strings the shell passed; item 0 is the script name |
| `ArgumentParser(prog=, description=)` | The parser; `--help` is generated from the declarations |
| `add_argument("name")` | Positional, required by default |
| `add_argument("--name")` | Optional; absent means the `default`, or `None` if none is given |
| `type=int`, `type=float`, `type=Path` | Any one-argument callable; converts and validates in one step |
| `choices=[...]` | Rejects anything else and lists the options in the help |
| `action="store_true"` | The on/off flag; never use `type=bool`, which makes every non-empty string true |
| `action="store_false"`, `dest=` | A `--no-something` flag writing to a chosen attribute |
| `BooleanOptionalAction` | `--save` and `--no-save` from one declaration |
| `action="count"` | `-v`, `-vv` give 1, 2 — the conventional verbosity control |
| Mutually exclusive group | Options that together are a usage error |
| `add_subparsers()` | Verbs like `tool.py run` and `tool.py report`, each with its own arguments |
| Dashes to underscores | `--limit-kpa` becomes `args.limit_kpa`; `dest=` overrides |
| `parse_args(argv)` | With a list instead of `None`, the whole interface is testable in-process |
| Usage errors | One line naming the argument, exit status 2, raised as `SystemExit` |
| `raise SystemExit(main())` | `main` returns a status; the guard makes it the process exit code |
| Shape | `build_parser`, `run(args)`, `main(argv=None)` — only `main` is tied to a process |

The last lesson of this module decides where the file lives. A script that has grown a parser, a logger, typed functions and a set of dataclasses is a package now, and where its files sit decides whether `import gnc` works for everybody or only for you, in that folder, on that machine.

::: context dispersion-sweep Running the flight a thousand times
No input to a simulation is known exactly: engine thrust, the wind, the vehicle's mass all vary a little from flight to flight. A **dispersion** is that spread. A dispersion sweep, also called a **Monte Carlo** analysis after the casino in Monaco, runs the simulation thousands of times with each input drawn at random from its spread, then counts how many runs break a limit. Launch providers and NASA use this to show that a vehicle stays inside its limits in, say, 99.7% of cases, not only in the one "perfect" flight.
:::

::: context argv-list The list your program receives
The shell cuts the line at spaces and hands over the pieces as strings. `python3` itself is not in the list; the script's name is item 0.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="12" y="22" font-size="12" fill="#1f2a44">python3 sweep.py 500 --seed 41</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="48" width="96" height="32" rx="4" fill="#f2b880"/>
    <rect x="112" y="48" width="70" height="32" rx="4" fill="#8fb8f0"/>
    <rect x="186" y="48" width="90" height="32" rx="4" fill="#8fb8f0"/>
    <rect x="280" y="48" width="68" height="32" rx="4" fill="#8fb8f0"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="69">"sweep.py"</text>
    <text x="147" y="69">"500"</text>
    <text x="231" y="69">"--seed"</text>
    <text x="314" y="69">"41"</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="60" y="98">argv[0]</text>
    <text x="147" y="98">argv[1]</text>
    <text x="231" y="98">argv[2]</text>
    <text x="314" y="98">argv[3]</text>
  </g>
  <text x="230" y="120" font-size="11" fill="#1d6fd1" text-anchor="middle">sys.argv[1:] is what parse_args reads</text>
</svg>
```
:::

::: context stdout-stderr Two output streams
Every program starts with two output channels. Stream 1, **standard output**, is for results. Stream 2, **standard error**, is for messages about the run: logging, warnings, usage errors. Keeping them apart means `sweep.py 500 > count.txt` saves only the answer while the log lines still reach your screen. `2>&1` redirects stream 2 to wherever stream 1 is going, and `2>/dev/null` sends it to `/dev/null`, a special file that discards whatever is written to it. The logging and argparse messages in this lesson all go to stream 2.
:::

::: context max-q The hardest squeeze of the climb
Dynamic pressure, written $q$, is how hard the air pushes on a moving vehicle: $q = \tfrac{1}{2}\rho v^2$, air density times speed squared, halved. As a rocket climbs, its speed rises while the air thins, so $q$ rises to a peak — "max-q" — about a minute after lift-off, then falls. The structure is designed for that peak, which is why a sweep checks each case's peak $q$ against a limit. The 31 kPa in this lesson's toy model is in the range real launchers see at max-q.
:::

::: context seeds Random, but repeatable
A computer's "random" numbers come from a formula that produces a long, jumbled-looking sequence from a starting number called the **seed**. The same seed gives exactly the same sequence every time. That is why `random.Random(args.seed)` makes a sweep repeatable: record the seed and anyone can rerun your 5000 cases and get your exact numbers. Change the seed and you get a fresh, equally valid set of draws.
:::

::: context exit-status What the number means
A program's exit status is a small whole number, 0 to 255, that the shell can test.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="14" width="44" height="32" rx="4" fill="#8fb8f0"/>
    <rect x="12" y="58" width="44" height="32" rx="4" fill="#f2b880"/>
    <rect x="12" y="102" width="44" height="32" rx="4" fill="#f2b880"/>
  </g>
  <g font-size="16" font-weight="700" fill="#1f2a44" text-anchor="middle">
    <text x="34" y="36">0</text><text x="34" y="80">1</text><text x="34" y="124">2</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="68" y="28">success: main returned 0</text>
    <text x="68" y="72">the program crashed:</text>
    <text x="68" y="116">usage error: argparse rejected</text>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="68" y="42">"|| echo failed" is skipped</text>
    <text x="68" y="86">an uncaught exception</text>
    <text x="68" y="130">the command line</text>
  </g>
  <text x="340" y="80" font-size="11" fill="#b4232c" text-anchor="end">non-zero:</text>
  <text x="340" y="94" font-size="11" fill="#b4232c" text-anchor="end">echo runs</text>
</svg>
```
:::

::: context three-functions Who calls what
Only `main` touches the real process. Tests can enter at either of the two lower boxes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="100" y="10" width="160" height="32" rx="5" fill="#f2b880"/>
    <rect x="30" y="100" width="140" height="32" rx="5" fill="#8fb8f0"/>
    <rect x="200" y="100" width="130" height="32" rx="5" fill="#8fb8f0"/>
    <line x1="150" y1="42" x2="110" y2="96"/>
    <line x1="210" y1="42" x2="255" y2="96"/>
  </g>
  <polygon points="108,99 108,88 116,93" fill="#1f2a44"/>
  <polygon points="257,99 249,93 257,88" fill="#1f2a44"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="31">main(argv=None)</text>
    <text x="100" y="121">build_parser()</text>
    <text x="265" y="121">run(args)</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="100" y="152">test: parse_args([...])</text>
    <text x="265" y="152">test: run(parsed args)</text>
    <text x="180" y="66">1 parse, then 2 run</text>
  </g>
</svg>
```
:::

::: context string-truthiness Why "False" is true
In Python every value can be used as a yes-or-no. For strings the rule is only about length: the empty string `""` counts as false, and every other string counts as true, whatever its letters say. So `bool("False")`, `bool("0")` and `bool("no")` are all `True`. Python does not read the word; it only checks whether there is one.
:::

::: context toml A settings file people can read
TOML stands for "Tom's Obvious, Minimal Language", after its creator, Tom Preston-Werner. A TOML file holds lines like `cases = 5000` and `limit_kpa = 33.0`, grouped under headings in square brackets. Python has read it with the standard library module `tomllib` since version 3.11, and the `pyproject.toml` file you will meet in the next lesson is written in it.
:::
