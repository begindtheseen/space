---
id: l12-argparse
title: Command-line tools with argparse
minutes: 15
covers:
  - argparse for command-line tools
---

A dispersion sweep has a number of cases, a seed, a structural limit and an output file. The first version of the script puts those at the top as constants, and every run edits them. Three weeks later you have a directory of results and no record of which constants produced which file, because the constants were in the source and the source has moved on.

Making them command-line arguments fixes that, and the shell history becomes the record: `sweep.py 5000 --seed 41 --limit-kpa 33.0 --out cold_case.txt` says exactly what was run. It also makes the script usable by somebody who has not read it, and schedulable by a batch system that cannot edit source files.

`argparse` is the standard library's tool for this. You declare the arguments, it parses them, converts them, checks them, and generates a `--help` page you did not write. The alternative — reading `sys.argv` yourself — is where this lesson starts, because the comparison is the argument.

## Doing it by hand

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

```bash
python3 manual.py 500 20250922
python3 manual.py 500 20250922 33.0
# 500 20250922 35.0
# 500 20250922 33.0
```

It works, and it is already carrying four separate liabilities. The usage string is maintained by hand and will drift from the code. The positional order is the only interface, so `manual.py 20250922 500` is a valid call with the arguments swapped. Adding a fifth parameter means renumbering every index below it. And a bad value produces a raw traceback rather than a message:

```bash
python3 manual.py five 20250922 2>&1 | tail -1
# ValueError: invalid literal for int() with base 10: 'five'
```

A user who mistypes a number should get one line telling them which argument was wrong, not a traceback through your file.

## The same interface with argparse

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

The help page is generated from those declarations:

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

That is wrapped for an 80-column terminal; a wider window gives the same content on fewer lines. Nobody wrote it, nobody maintains it, and it cannot drift from the code because it *is* the code.

Running it:

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

Five hundred cases at the nominal mean of 31.0 kPa with a standard deviation of 2.4 kPa put 21 over a 35.0 kPa limit; the hot-and-high configuration, with its mean of 32.6 kPa, puts 35 over a limit of 36.0 kPa. The seed is fixed by default, so those counts reproduce.

Six details from the declarations are worth naming.

`type=int` and `type=float` convert and validate in one step, so `args.cases` is an `int` by the time you see it. `type=Path` does the same for a filesystem path, which is why `args.out.write_text(...)` works without any conversion at the call site — any one-argument callable is allowed there.

`--limit-kpa` becomes `args.limit_kpa`: dashes become underscores. A flag named `--limit-kpa` is conventional on the command line and would be a syntax error as an attribute name.

`choices=[...]` rejects anything else and lists the options in the help. `default=` supplies the value when the flag is absent, and is shown to the user if you add `formatter_class=argparse.ArgumentDefaultsHelpFormatter`.

`action="count"` makes `-v`, `-vv`, `-vvv` give 1, 2, 3, which is the conventional way to expose the logging levels of the last lesson. `action="store_true"` is the plain on/off flag.

`--out` has no default, so it is `None` when absent, and the code tests for that. An optional file argument should be `None` rather than an empty string, so that "not asked for" and "asked for with an empty name" stay distinguishable.

::: example The errors a user sees
Every failure mode produces one line naming the offending argument, and exit status 2:

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

Compare that with the manual version's `ValueError: invalid literal for int() with base 10: 'five'` and traceback. The difference is not politeness. A traceback tells the user that *your program* is broken; a usage error tells them that *their command* was, and which part of it.

The exit status is part of the interface too. `argparse` exits with 2 on a usage error, which is the convention, and `main` returns 0 on success — so a shell script or a batch scheduler running `sweep.py 5000 || echo failed` behaves correctly without anybody parsing the output.

`raise SystemExit(main())` is the idiom for that last part: `main` returns an integer status and the guard turns it into the process exit code. Returning a value rather than calling `sys.exit` deep inside keeps `main` callable from a test.
:::

::: example Parsing without a subprocess
`parse_args()` with no argument reads `sys.argv[1:]`. Passing a list instead is what makes the whole interface testable: the parser and the run can be exercised in-process, with no shell and no subprocess.

```python
# test_sweep.py
"""Exercise the parser and the run without starting a subprocess."""
from pathlib import Path

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

The stderr redirection discards argparse's usage message from the last case, which would otherwise be four lines of noise in the transcript.

This is the whole reason for the three-function shape — `build_parser`, `run`, `main`. The parser is a value you can construct and interrogate. `run` takes the parsed arguments and does the work, so a test can build an arguments object without any strings at all. `main` is the thin layer that wires them together and is the only part tied to a process.

Note the last block: an invalid choice raises `SystemExit`, not a `ValueError`. `argparse` is designed to end the program, so a test that wants to check a rejection must catch `SystemExit` and inspect its `code`, which is 2 for a usage error. The import of `Path` at the top is unused by this transcript and is there because a fuller test would build an `--out` path.
:::

::: warning
`type=bool` does not do what it looks like it does:

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

`--plot False` set `plot` to `True`. `type=bool` calls `bool("False")`, and every non-empty string is truthy, so the only way to get `False` is to omit the flag or pass an empty string. A run that was meant to skip plotting spent an hour drawing figures.

Use `action="store_true"` for an on/off flag, which takes no value at all, and `action="store_false"` with `dest=` for a `--no-something` form. If you genuinely need a three-way flag, use `choices=["on", "off", "auto"]` and convert it yourself, where the conversion is visible.
:::

## Where argparse stops

Three things worth knowing before you need them. Subcommands — `sweep.py run`, `sweep.py report` — come from `parser.add_subparsers()`, each subcommand getting its own parser and its own arguments; reach for it when a tool grows a second verb, not before.

Mutually exclusive options are `parser.add_mutually_exclusive_group()`, which makes `--quiet` and `--verbose` together a usage error rather than something the code has to resolve.

And configuration that is too large for a command line belongs in a file. The idiomatic arrangement is `--config run.toml` for the bulk of the settings, with command-line flags overriding individual values, so a campaign is reproducible from a file that can be committed and a command that can be read.

## Check yourself

::: check
`parser.add_argument("--limit-kpa", type=float)` — what attribute name does the parsed result carry, and why not the one you wrote?
:::

::: answer
`args.limit_kpa`. Argparse converts the leading dashes away and turns interior dashes into underscores, because the result is an object whose attributes are accessed with dot notation and `args.limit-kpa` would parse as a subtraction.

The convention is deliberate: dashes are the normal separator in command-line flags and underscores are the normal separator in Python names, so each side gets the spelling it expects. If you need something different, `dest="q_limit"` names the attribute explicitly, which is worth doing when the flag name is long or when two flags should write to the same destination.
:::

::: check
Why does `--plot False` set the flag to `True` when the argument was declared `type=bool`?
:::

::: answer
Because `type=` names a conversion function that argparse calls on the string it read, and `bool("False")` is `True` — every non-empty string is truthy. The only input that would give `False` is the empty string, which is awkward to pass and pointless to require.

The correct declaration for an on/off flag is `action="store_true"`, which takes no value: the flag's presence means true and its absence means false, with `default=False` implied. That also produces a better help page, because the flag is shown without a metavariable, and a better command line, because `--save` is shorter and less ambiguous than `--save True`.

The measurement in this lesson is worth remembering as the symptom: the run that was told not to plot, plotted.
:::

::: check
What does `parse_args()` read when you give it no argument, and why does the worked example pass a list instead?
:::

::: answer
It reads `sys.argv[1:]` — everything after the program name. That is what you want in production, and it is exactly what makes the parser hard to test, because exercising it would mean assigning to `sys.argv` or starting a subprocess.

Passing a list, `parse_args(["500", "--limit-kpa", "33.0"])`, parses those strings instead. A test can then check that the conversion produced a float, that the default seed is what the documentation says, and that an invalid choice is rejected, all in-process and in milliseconds.

The pattern that makes this available is `def main(argv=None)` with `parse_args(argv)` inside: production calls `main()` and gets `sys.argv`, and a test calls `main(["500", "-v"])` and gets its own list. The `None` default is the hinge.
:::

::: check
A colleague's script prints a traceback when given a bad number, and yours prints one line and exits with status 2. Why does the exit status matter?
:::

::: answer
Because whatever is running your script reads it. A shell `&&` chain, a Makefile, a CI job, a batch scheduler running 500 sweeps overnight: all of them decide what to do next from the exit status, and all of them treat zero as success. A script that exits 0 after failing gets reported as a successful run with missing output, which is discovered days later.

Argparse exits with 2 for a usage error, which is the long-standing Unix convention for "your command was wrong" as against 1 for "the program failed". Returning an integer from `main` and writing `raise SystemExit(main())` gives you the same control over your own failures, and keeps `main` callable from a test, where `sys.exit` buried in the middle of the work would not.
:::

::: check
Your sweep takes a number of cases, a seed, a limit and an output path. When should those become a configuration file instead of command-line flags?
:::

::: answer
When the number of settings passes the point where a command is readable, or when the settings need to be version-controlled alongside the results. Four flags fit comfortably on one line; forty do not, and a forty-flag command is neither reviewable nor reproducible, because nobody will copy it correctly.

The usual arrangement keeps both: a `--config run.toml` argument for the bulk of the settings, with a handful of command-line flags that override individual values for a one-off variation. The file is committed with the campaign and answers "what was run"; the flags answer "what did you change this time".

Two things that stay on the command line whatever happens: the verbosity flag, because it is about this invocation and not about the analysis, and the output path, because it is about where this run's results go rather than what they are.
:::

## Summary

| Item | Statement |
| --- | --- |
| `ArgumentParser(prog=, description=)` | The parser; `--help` is generated from the declarations |
| `add_argument("name")` | Positional, required by default |
| `add_argument("--name")` | Optional; absent means the `default`, or `None` if none is given |
| `type=int`, `type=float`, `type=Path` | Any one-argument callable; converts and validates in one step |
| `choices=[...]` | Rejects anything else and lists the options in the help |
| `action="store_true"` | The on/off flag; never use `type=bool`, which makes every string true |
| `action="count"` | `-v`, `-vv` give 1, 2 — the conventional verbosity control |
| Dashes to underscores | `--limit-kpa` becomes `args.limit_kpa`; `dest=` overrides |
| `parse_args(argv)` | With a list instead of `None`, the whole interface is testable in-process |
| Usage errors | One line naming the argument, exit status 2, raised as `SystemExit` |
| `raise SystemExit(main())` | `main` returns a status; the guard makes it the process exit code |
| Shape | `build_parser`, `run(args)`, `main(argv=None)` — only `main` is tied to a process |

The last lesson of this module puts the file somewhere. A script that has grown a parser, a logger, typed functions and a set of dataclasses is a package now, and where its files sit determines whether `import gnc` works for everybody or only for you, in that directory, on that machine.
