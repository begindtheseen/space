---
id: l11-logging
title: Logging instead of print
minutes: 15
covers:
  - logging instead of print; levels and handlers
---

You debug with `print`. Everyone does. The problem is what happens next: either the prints stay, and every run of the module is noisy for everybody, or they are deleted, and the next time the same bug appears you write them again from memory.

The deeper problem is that a `print` carries no priority. "starting case 4" and "q exceeded the structural limit" arrive on the same stream, in the same format, with nothing to distinguish routine chatter from the one line that matters. When a six-hour campaign produces 40,000 lines of output, grepping them is the only tool you have left.

`logging` solves both. Every message carries a *level*, so the interesting ones can be shown and the routine ones suppressed without editing anything; and the destination is configurable, so the same code writes an abbreviated stream to your terminal and a full one to a file. That last property is the one that matters most for long runs: you get the terse view while it runs and the detailed view afterwards, from one execution.

## Five levels and one logger per module

```python
# levels.py
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("guidance")

log.debug("integrator step dt=%.3f", 0.005)
log.info("ignition at t=%.1f s", 0.0)
log.warning("gimbal command %.3f rad near the %.3f rad stop", 0.34, 0.35)
log.error("no convergence after %d iterations", 50)
log.critical("abort commanded")
```

```bash
python3 levels.py
# INFO guidance: ignition at t=0.0 s
# WARNING guidance: gimbal command 0.340 rad near the 0.350 rad stop
# ERROR guidance: no convergence after 50 iterations
# CRITICAL guidance: abort commanded
```

Five calls, four lines of output. The `debug` message was discarded because the configured level is `INFO`, and it was discarded *by the logging machinery*, not by you editing the file. Raise the level and it appears:

```python
# levels_debug.py
import logging

logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("guidance")

log.debug("integrator step dt=%.3f", 0.005)
log.info("ignition at t=%.1f s", 0.0)
```

```bash
python3 levels_debug.py
# DEBUG guidance: integrator step dt=0.005
# INFO guidance: ignition at t=0.0 s
```

The five levels, with the meaning each should carry in analysis code:

- `DEBUG` — the per-step detail you want when something has already gone wrong: step sizes, intermediate residuals, which branch was taken.
- `INFO` — the run's narrative: configuration loaded, 500 cases started, campaign finished.
- `WARNING` — something surprising that the code handled: a limit approached, a channel missing, a fallback used.
- `ERROR` — something the code could not do: a case that failed to converge, a file that could not be parsed.
- `CRITICAL` — the run cannot continue.

Output goes to the standard error stream by default, which is correct: it keeps diagnostics out of a pipeline that is consuming your program's real output on standard out.

::: key
Create one logger per module with `log = logging.getLogger(__name__)` at the top of the file, and never configure it there. The module *emits*; the application — the script with the `if __name__ == "__main__":` guard — *configures*, once, with `logging.basicConfig(...)` or explicit handlers.
:::

The `__name__` idiom matters because logger names are hierarchical, dot-separated, and inherit configuration. With loggers named `gnc.guidance`, `gnc.navigation` and `gnc.sim.atmosphere`, one line — `logging.getLogger("gnc.navigation").setLevel(logging.DEBUG)` — turns up the detail on the navigation code alone and leaves the rest as it was. That is impossible with prints, and it is the reason the module should not name its own logger by hand.

::: example The same code, with prints and with logging
Here is the print version, of the kind that is in every analysis script:

```python
# print_debug.py
def propagate(cases):
    results = []
    for case in cases:
        print("starting case", case)          # left in, noisy
        q = 30.0 + 2.0 * case
        if q > 35.0:
            print("WARNING q high:", q)       # indistinguishable from the above
        results.append(q)
    print("done", len(results))
    return results


propagate([0, 2, 4])
```

```bash
python3 print_debug.py
# starting case 0
# starting case 2
# starting case 4
# WARNING q high: 38.0
# done 3
```

Now the same logic with logging, and note that the module configures nothing:

```python
# log_debug.py
import logging

log = logging.getLogger(__name__)


def propagate(cases):
    results = []
    for case in cases:
        log.debug("starting case %d", case)
        q = 30.0 + 2.0 * case
        if q > 35.0:
            log.warning("case %d: q = %.1f kPa exceeds 35.0", case, q)
        results.append(q)
    log.info("propagated %d cases", len(results))
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    propagate([0, 2, 4])
```

```bash
python3 log_debug.py
# WARNING __main__: case 4: q = 38.0 kPa exceeds 35.0
# INFO __main__: propagated 3 cases
```

Two lines instead of five, and the one that matters is marked `WARNING` and names its case and its number. The per-case chatter is still in the code, still maintained, and simply not shown.

When you need it, you turn it on from outside, without touching the module:

```python
# run_verbose.py
import logging

import log_debug

logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(name)s: %(message)s")
log_debug.propagate([0, 2, 4])
```

```bash
python3 run_verbose.py
# DEBUG log_debug: starting case 0
# DEBUG log_debug: starting case 2
# DEBUG log_debug: starting case 4
# WARNING log_debug: case 4: q = 38.0 kPa exceeds 35.0
# INFO log_debug: propagated 3 cases
```

Same module, same code, five lines instead of two. Note the logger name changed from `__main__` to `log_debug`, because `__name__` is `"__main__"` only in the file being run — which is exactly the naming you want, since it tells you which module a line came from.
:::

## Pass the arguments; do not format the message

`log.debug("case %d: q=%.1f", case, q)` looks like an old style next to an f-string. It is the correct one, and the reason is that the formatting happens only if the message is going to be emitted:

```python
# lazy_format.py
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("sim")

FORMATTED = {"n": 0}


class State:
    """Its repr is expensive; count how often the logger asks for it."""

    def __repr__(self):
        FORMATTED["n"] += 1
        return "State(t=12.5, mass=31500.0)"


state = State()

for _ in range(1000):
    log.debug(f"step: {state!r}")
log.info("eager f-string, reprs built: %d", FORMATTED["n"])

FORMATTED["n"] = 0
for _ in range(1000):
    log.debug("step: %r", state)
log.info("lazy %%r, reprs built: %d", FORMATTED["n"])
```

```bash
python3 lazy_format.py
# INFO: eager f-string, reprs built: 1000
# INFO: lazy %r, reprs built: 0
```

A thousand debug calls that were never emitted still built a thousand reprs when the message was an f-string, because the f-string is evaluated *before* `log.debug` is called and cannot be avoided afterwards. With `%r` and the object as an argument, the logger checks the level first, finds the record is not wanted, and never formats anything: zero reprs.

Timed on this machine, over a 200-element list at a level where the message is discarded:

```bash
python3 -m timeit -s "import logging; logging.basicConfig(level=logging.INFO); log = logging.getLogger('t'); xs = list(range(200))" "log.debug(f'values: {xs!r}')"
python3 -m timeit -s "import logging; logging.basicConfig(level=logging.INFO); log = logging.getLogger('t'); xs = list(range(200))" "log.debug('values: %r', xs)"
```

about 6.0 µs per suppressed call with the f-string against about 90 ns with the lazy form — a factor near 65. In a propagator that logs once per step at 500 Hz, that is the difference between debug logging you can leave in the code and debug logging you cannot.

::: example Two destinations, one run
An application configures *handlers*: each one has its own level and its own format, and a record goes to all of them that will accept it.

```python
# handlers.py
import logging

log = logging.getLogger("campaign")
log.setLevel(logging.DEBUG)

console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter("%(levelname)-8s %(message)s"))

to_file = logging.FileHandler("campaign.log", mode="w")
to_file.setLevel(logging.DEBUG)
to_file.setFormatter(
    logging.Formatter("%(asctime)s %(levelname)-8s %(name)s:%(lineno)d %(message)s")
)

log.addHandler(console)
log.addHandler(to_file)

for case in range(3):
    log.debug("case %d: seed=%d", case, 20250922 + case)
    if case == 1:
        log.warning("case %d: q exceeded %.1f kPa", case, 35.0)
log.info("campaign finished: %d cases", 3)
```

```bash
python3 handlers.py
# WARNING  case 1: q exceeded 35.0 kPa
# INFO     campaign finished: 3 cases
```

```bash
cat campaign.log
# 2026-09-22 20:40:53,814 DEBUG    campaign:21 case 0: seed=20250922
# 2026-09-22 20:40:53,815 DEBUG    campaign:21 case 1: seed=20250923
# 2026-09-22 20:40:53,815 WARNING  campaign:23 case 1: q exceeded 35.0 kPa
# 2026-09-22 20:40:53,815 DEBUG    campaign:21 case 2: seed=20250924
# 2026-09-22 20:40:53,815 INFO     campaign:24 campaign finished: 3 cases
```

Two views of one run. The terminal shows two lines, which is what you want while watching a campaign. The file has every case with its seed, the timestamp to the millisecond, the module and the line number — which is what you want the next morning, when a reviewer asks which seed produced the exceedance.

Note the three levels involved. The *logger* is at `DEBUG`, which decides what is created at all; each *handler* has its own level, which decides what that destination accepts. A record must pass both. Setting the logger to `INFO` here would have left the file empty of debug lines however the handler was configured — which is the commonest reason a log file is missing what somebody swears they logged.

The timestamps will obviously differ when you run it; everything else in that file reproduces exactly. For a long campaign, prefer `logging.handlers.RotatingFileHandler`, which caps the file size and keeps a few previous ones, over a `FileHandler` that grows until the disk is full.
:::

::: warning
Inside an `except` block, use `log.exception(...)` rather than `log.error(...)`. It logs at `ERROR` and attaches the traceback:

```python
# exception_log.py
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("sweep")


def margin(case, rho):
    try:
        return 1.0 / rho
    except ZeroDivisionError:
        log.exception("case %d: atmosphere table gave zero density", case)
        return None


print(margin(7, 0.0), flush=True)
```

```bash
python3 exception_log.py 2>&1 | grep -v 'File "'
# ERROR case 7: atmosphere table gave zero density
# Traceback (most recent call last):
#     return 1.0 / rho
#            ~~~~^~~~~
# ZeroDivisionError: float division by zero
# None
```

The `grep` above removes the two lines naming this machine's file paths, which differ on yours; the rest is the record. `log.error("...")` in the same place would have given you the message and nothing about where it came from, which in a batch over 500 cases means knowing that something failed and not what.

Two other traps. Calling the module-level functions — `logging.info(...)` rather than `log.info(...)` — configures the root logger implicitly on first use and gives every message the name `root`, so you lose the per-module control the whole design exists for. And `basicConfig` does nothing on a second call if handlers already exist, which is why a script that calls it in two places silently keeps the first configuration.
:::

## Check yourself

::: check
A library module you are writing needs to log. What should it do at import time, and what must it not do?
:::

::: answer
It should create a logger and nothing else: `log = logging.getLogger(__name__)` at the top of the file, then call `log.debug(...)`, `log.warning(...)` and so on where appropriate.

It must not call `logging.basicConfig`, add handlers, or set levels. Configuration is global to the process, and a library that configures it makes that decision for the application that imported it — changing where output goes, or suppressing messages from unrelated code. The application owns that choice.

The one exception is that a library may add a `logging.NullHandler()` to its top-level logger, which prevents Python's "no handlers could be found" fallback if an application uses the library without configuring logging at all. It adds no output and overrides nothing.
:::

::: check
Why is `log.debug("state: %r", state)` preferred to `log.debug(f"state: {state!r}")`?
:::

::: answer
Because the lazy form is only formatted if the record is actually going to be emitted. The f-string is evaluated before the call — it has to be, it is an argument — so its `repr` runs whether or not the level is enabled. The measurement in this lesson counted a thousand reprs built by the f-string form at a level where every one of those messages was discarded, against zero for the lazy form.

The timing on this machine was about 6.0 µs per suppressed call against about 90 ns, a factor near 65. That is the difference between debug logging that can stay in a hot loop and debug logging that has to be deleted before the run.

There is a correctness aspect too: if building the message can raise — a `repr` on a half-initialised object — the f-string raises at the call site, while the lazy form raises inside logging, which catches formatting errors and reports them without taking your program down.
:::

::: check
A campaign's log file is missing every `DEBUG` line although the file handler was created with `setLevel(logging.DEBUG)`. What is the likely cause?
:::

::: answer
The logger's own level is higher than `DEBUG`, so the records are never created and no handler ever sees them. There are two gates: the logger decides whether a record exists, and each handler decides whether to write the records it receives. A record must pass both.

The fix is `log.setLevel(logging.DEBUG)` on the logger, leaving the console handler at `INFO` so the terminal stays readable — which is exactly the arrangement in this lesson's two-handler example.

A second possibility, if the code uses `logging.basicConfig`, is that something called it earlier: `basicConfig` is a no-op when the root logger already has handlers, so the second call's `level=logging.DEBUG` is silently ignored.
:::

::: check
Name two things a log record gives you that a `print` line does not, and one case where `print` is still correct.
:::

::: answer
A level, so the line can be filtered without editing the code; and a source, since the record carries the logger's name, the module, the function and the line number, any of which the format string can include. It also carries a timestamp to the millisecond, which is how you correlate a diagnostic with an event in the telemetry, and it can be routed to several destinations with different levels at once.

`print` is still correct for a program's *output* as opposed to its diagnostics: the results table a script exists to produce, the number a command-line tool is meant to emit so another program can consume it on standard out. Logging goes to standard error precisely so that the two do not mix. The test is simple — if a colleague piping your script into another program would want the line, it is output and belongs in `print`; if they would be annoyed by it, it is a diagnostic and belongs in a log record.
:::

::: check
Your simulation package has modules `gnc.guidance`, `gnc.navigation` and `gnc.control`, each with `log = logging.getLogger(__name__)`. You need full detail from navigation only. What do you write, and why does it work?
:::

::: answer
```python
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logging.getLogger("gnc.navigation").setLevel(logging.DEBUG)
```

It works because logger names are a dotted hierarchy and each logger inherits the effective level of its ancestors until one is set explicitly. Setting `gnc.navigation` to `DEBUG` affects it and its children, such as `gnc.navigation.kalman`, and leaves `gnc.guidance` and `gnc.control` at the level they inherit.

This is what `getLogger(__name__)` buys, and why a module should not invent a name of its own: the name is the import path, so the configuration hierarchy matches the package structure without anybody maintaining a list.
:::

## Summary

| Item | Statement |
| --- | --- |
| Module line | `log = logging.getLogger(__name__)` at the top; modules emit, applications configure |
| Levels | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`, in increasing severity |
| Default stream | Standard error, so diagnostics do not contaminate piped output |
| `basicConfig(level=, format=)` | One-line application setup; a no-op if handlers already exist |
| Lazy formatting | `log.debug("q=%.1f", q)` formats only if emitted; f-strings always format |
| Measured here | 1,000 suppressed calls built 1,000 reprs eagerly and 0 lazily; ≈6.0 µs against ≈90 ns |
| Handlers | `StreamHandler`, `FileHandler`, `RotatingFileHandler`; each with its own level and format |
| Two gates | The logger's level decides whether a record exists; the handler's decides whether it is written |
| `log.exception(...)` | Inside `except`: logs at `ERROR` and attaches the traceback |
| Hierarchy | Dotted names inherit; `getLogger("gnc.navigation").setLevel(DEBUG)` targets one subtree |
| Avoid | `logging.info(...)` at module level — it configures the root logger implicitly |
| Libraries | May add `logging.NullHandler()`; must not call `basicConfig` |

The next lesson gives the application its other outside surface. If the level, the seed and the output directory are decided by whoever runs the script, they should be arguments to it — and `argparse` turns a function's parameters into a command-line interface with a help page you did not write.
