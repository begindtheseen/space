---
id: l11-logging
title: Logging instead of print
minutes: 20
covers:
  - logging instead of print; levels and handlers
---

Think about a ship's logbook. The crew writes down what happens as it happens: the time, who wrote it, and how serious it is. "0800, course steady." "1412, fire alarm in the engine room." Later, someone can read only the serious entries, or the whole day in order. Nobody tears pages out after each voyage, and nobody has to rewrite the book from memory when something goes wrong again.

You probably debug with `print`. Everyone does. The trouble is what happens next. Either the prints stay, and every run of the module is noisy for everyone who uses it. Or they get deleted, and the next time the same bug appears you write them all again from memory.

The deeper trouble is that a `print` has no priority. "starting case 4" and "q exceeded the structural limit" arrive on the same stream, in the same format. Nothing marks routine chatter apart from the one line that matters. When a six-hour campaign of simulations produces 40,000 lines, searching them by hand is the only tool you have left.

Python's `logging` module is the logbook. Every message carries a **level** — how serious it is — so the important ones can be shown and the routine ones hidden without editing the code. And where the messages go is configurable, so the same code can write a short stream to your terminal and a full one to a file. For long runs that matters most of all: you get the brief view while it runs and the detailed view afterwards, from one run.

## Five levels, and one logger per module

A **logger** is the object your code hands messages to. You get one with `logging.getLogger(name)`, and then call a method named after the level you want.

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

Here is what each line of the script did.

1. `logging.basicConfig(...)` set up the program's logging in one line. `level=logging.INFO` means "show `INFO` and anything more serious". The `format` string says what each output line looks like. `%(levelname)s` is replaced by the level's name, `%(name)s` by the logger's name, and `%(message)s` by the message.
2. `logging.getLogger("guidance")` fetched a logger named `guidance`.
3. Each call passed a message with **[[placeholders|percent-format]]** like `%.3f` (read "a float with three decimals") and `%d` (read "a whole number"), followed by the values to fill them with.

Five calls, four lines of output. The `debug` message was thrown away because the level is `INFO`, and `DEBUG` is less serious than that. Crucially, the logging machinery threw it away — you did not edit anything. Lower the level and it appears:

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

Each level is a number underneath, and a logger shows a message only if its number is at least the configured level. Here are the five, from least to most serious, with the meaning each should carry in analysis code:

- `DEBUG` (10) — the step-by-step detail you want once something has already gone wrong: step sizes, intermediate results, which branch was taken.
- `INFO` (20) — the story of the run: configuration loaded, 500 cases started, campaign finished.
- `WARNING` (30) — something surprising that the code handled: a limit approached, a channel missing, a fallback used.
- `ERROR` (40) — something the code could not do: a case that did not converge, a file that could not be read.
- `CRITICAL` (50) — the run cannot continue.

By default the output goes to **[[standard error|two-streams]]**, not standard output. That is the right choice. It keeps diagnostics out of the way of a pipeline that is reading your program's real results.

::: key One logger per module
Create one logger per module with `log = logging.getLogger(__name__)` at the top of the file, and never configure it there. The module *emits*; the application — the script with the `if __name__ == "__main__":` guard — *configures*, once, with `logging.basicConfig(...)` or explicit handlers.
:::

Why `__name__`? Inside a module, `__name__` holds the module's import path, such as `gnc.navigation`. Logger names use dots to form a **[[family tree|logger-tree]]**, and a logger inherits its settings from the loggers above it. Suppose your loggers are named `gnc.guidance`, `gnc.navigation` and `gnc.sim.atmosphere`. Then one line —

```python
logging.getLogger("gnc.navigation").setLevel(logging.DEBUG)
```

— turns up the detail on the navigation code alone and leaves the rest as it was. That is impossible with prints. It is also why a module should not make up its own logger name: `__name__` keeps the tree matching the package automatically.

::: example The same code, with prints and with logging
Here is the print version, of the kind found in every analysis script:

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

Check the numbers: $q$ is **[[dynamic pressure|dynamic-pressure]]** in kilopascals, and $q = 30.0 + 2.0 \times \text{case}$ gives $30$, $34$ and $38$ for cases 0, 2 and 4. Only $38$ is above $35$, so one warning — correct. But on screen it looks the same as the chatter around it.

Now the same logic with logging. Notice that the module configures nothing:

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

Two lines instead of five. The one that matters says `WARNING` and names its case, its value and its unit. The per-case chatter is still in the code, still kept up to date — only hidden.

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

Same module, same code, five lines instead of two. The logger's name changed from `__main__` to `log_debug`. That is because `__name__` is `"__main__"` only in the file you run directly; when another file imports it, `__name__` is the module's name. That is the naming you want, since every line now tells you which module wrote it.
:::

## Pass the values; do not format the message yourself

`log.debug("case %d: q=%.1f", case, q)` can look old-fashioned next to an f-string such as `f"case {case}: q={q:.1f}"`. It is the correct style anyway. The reason: the logger fills in the placeholders only if the message is actually going to be shown.

An f-string is different. Python builds the finished text *before* calling `log.debug`, because it is an argument, and arguments are worked out first. If the level then says "not wanted", the work was wasted. This script counts that waste:

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

Step by step:

1. `State.__repr__` adds one to a counter every time something asks for the object's text form.
2. The first loop makes 1,000 `debug` calls with an f-string. The level is `INFO`, so none is shown. Yet the counter reached 1,000: every f-string was built and then thrown away.
3. The second loop passes `%r` (read "the repr of") and the object separately. The logger checks the level first, sees the message is not wanted, and stops. The counter stays at 0.
4. In the last message, `%%` is how you write a literal percent sign, so it prints as `%r`.

How much does that cost? Timed on the machine that built this lesson, over a 200-element list, at a level where the message is discarded:

```bash
python3 -m timeit -s "import logging; logging.basicConfig(level=logging.INFO); log = logging.getLogger('t'); xs = list(range(200))" "log.debug(f'values: {xs!r}')"
python3 -m timeit -s "import logging; logging.basicConfig(level=logging.INFO); log = logging.getLogger('t'); xs = list(range(200))" "log.debug('values: %r', xs)"
```

The f-string form took about 7.8 **[[µs|time-units]]** per hidden call. The placeholder form took about 118 ns. That is a factor of about 66. Over a million calls — a long simulation logging once per step — it is roughly 7.8 seconds against 0.12 seconds. Your machine's numbers will differ, but the ratio will be large. It is the difference between debug logging you can leave in a busy loop and debug logging you have to delete.

::: key Lazy formatting
Write `log.debug("q=%.1f", q)`, passing the values as arguments. The message is formatted only if it is emitted. An f-string is always formatted, even when the message is thrown away.
:::

## Handlers: where messages go

So far everything went to one place. Real applications often want two: a short view on screen and a full record in a file. That is the job of **handlers**. A handler is a destination — the terminal, a file, a network collector — with its own level and its own format. A logger passes each message to every handler attached to it, and each handler decides whether to accept it.

::: example Two destinations, one run
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

What the setup does:

1. The logger `campaign` is set to `DEBUG`, so it creates records at every level.
2. `console` is a `StreamHandler`, which writes to standard error. It accepts `INFO` and above. Its format pads the level name to 8 characters (`%(levelname)-8s`) so the messages line up.
3. `to_file` is a `FileHandler` writing `campaign.log`. `mode="w"` starts a fresh file each run. It accepts everything from `DEBUG` up, and its format adds the time (`%(asctime)s`), the logger's name and the line number (`%(lineno)d`).
4. Both handlers are attached to the logger.

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

Two views of one run. The terminal shows two lines — what you want while watching a campaign. The file has every case with its **[[seed|random-seed]]**, the time to the millisecond (the `,814` is milliseconds), the logger's name and the line number. That is what you want the next morning, when a reviewer asks which seed produced the exceedance.

Count the checks involved. The *logger's* level decides whether a record is created at all. Each *handler's* level decides whether that destination writes it. A record must **[[pass both gates|two-gates]]**. If the logger here were at `INFO`, the file would have no debug lines no matter how its handler was set. That is the most common reason a log file is missing something a person swears they logged.

The times will differ when you run it. Everything else in that file comes out exactly the same. For a long campaign, use `logging.handlers.RotatingFileHandler` instead of a plain `FileHandler`. It **[[caps the file size|rotation]]** and keeps a few older files, instead of growing until the disk is full.
:::

::: key Why logging instead of print
Levels let you keep diagnostics in the code and turn them on selectively; handlers route to file, console or a collector; records carry timestamp, module and line. `print` writes to stdout unconditionally and is stripped or forgotten.
:::

::: key Two gates
The logger's level decides whether a record exists. Each handler's level decides whether that destination writes it. A record must pass both.
:::

::: warning Use log.exception inside except
Inside an `except` block, call `log.exception(...)` rather than `log.error(...)`. It logs at `ERROR` and attaches the **[[traceback|traceback]]** — the list of calls that led to the failure:

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

In the command, `2>&1` (read "send stream 2 to where stream 1 goes") merges standard error into standard output, and `grep -v 'File "'` removes the lines naming this machine's file paths, which differ on yours. The rest is the record. `log.error(...)` in the same place gives the message and nothing about where it came from. In a batch of 500 cases, that means knowing something failed but not what.

Two more traps.

Calling the module-level functions — `logging.info(...)` instead of `log.info(...)` — quietly configures the **root logger** (the top of the family tree) on first use, and labels every message `root`. You lose the per-module control the whole design exists for.

And `basicConfig` does nothing on a second call if handlers already exist. A script that calls it in two places silently keeps the first setup. Passing `force=True` replaces the old setup instead.
:::

## Check yourself

::: check
A library module you are writing needs to log. What should it do at import time, and what must it not do?
:::

::: answer
It should create a logger and nothing else: `log = logging.getLogger(__name__)` at the top of the file, then call `log.debug(...)`, `log.warning(...)` and so on where they make sense.

It must not call `logging.basicConfig`, add handlers, or set levels. Logging setup is shared by the whole program. A library that configures it makes that choice for every application that imports it — changing where output goes, or hiding messages from unrelated code. The application owns that choice.

The one exception: a library may add `logging.NullHandler()` to its top-level logger. That handler throws everything away. Its purpose is to stop Python's **[[last-resort handler|last-resort]]** from printing the library's warnings when an application has set up no logging at all. It adds no output and overrides nothing the application does.
:::

::: check
Why is `log.debug("state: %r", state)` preferred to `log.debug(f"state: {state!r}")`?
:::

::: answer
Because the placeholder form is formatted only if the record is actually going to be written. The f-string is built before the call — it has to be, since it is an argument — so its `repr` runs whether or not the level is enabled. The count in this lesson showed 1,000 reprs built by the f-string form at a level where every message was thrown away, against zero for the placeholder form.

The timing was about 7.8 µs per hidden call against about 118 ns, a factor of about 66. That is the difference between debug logging that can stay in a busy loop and debug logging that must be deleted before a real run.

There is a safety side too. If building the message can fail — a `repr` on a half-built object, say — the f-string raises right at your call and can stop the program. With the placeholder form, the formatting happens inside logging, which catches the error and prints a "Logging error" report instead of crashing your run.
:::

::: check
A campaign's log file is missing every `DEBUG` line, although the file handler was created with `setLevel(logging.DEBUG)`. What is the likely cause?
:::

::: answer
The logger's own level is higher than `DEBUG`, so the debug records are never created and no handler ever sees them. There are two gates: the logger decides whether a record exists, and each handler decides whether to write the records it receives. A record must pass both.

The fix is `log.setLevel(logging.DEBUG)` on the logger, while leaving the console handler at `INFO` so the terminal stays readable. That is exactly the setup in this lesson's two-handler example.

A second possibility, if the code uses `logging.basicConfig`: something called it earlier. `basicConfig` does nothing when the root logger already has handlers, so a later call's `level=logging.DEBUG` is silently ignored — unless it passes `force=True`.
:::

::: check
Name two things a log record gives you that a `print` line does not, and one case where `print` is still the right tool.
:::

::: answer
First, a level, so the line can be filtered without editing the code. Second, a source: the record carries the logger's name, the module, the function and the line number, and the format string can include any of them. It also carries a timestamp to the millisecond, which is how you match a diagnostic to an event in the telemetry. And it can be sent to several destinations at once, each with its own level.

`print` is still right for a program's *output*, as opposed to its diagnostics: the results table a script exists to produce, or the number a command-line tool prints so another program can read it from standard output. Logging goes to standard error precisely so the two do not mix.

A good test: if a colleague piping your script into another program would want the line, it is output and belongs in `print`. If they would be annoyed by it, it is a diagnostic and belongs in a log record.
:::

::: check
Your simulation package has modules `gnc.guidance`, `gnc.navigation` and `gnc.control`, each with `log = logging.getLogger(__name__)`. You need full detail from navigation only. What do you write, and why does it work?
:::

::: answer
```python
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logging.getLogger("gnc.navigation").setLevel(logging.DEBUG)
```

The first line sets up the application: a handler on the root logger, with the root at `INFO`. The second line sets one branch of the tree to `DEBUG`.

It works because logger names form a dotted family tree. A logger with no level of its own uses the level of its nearest ancestor that has one. Setting `gnc.navigation` to `DEBUG` affects it and its children, such as `gnc.navigation.kalman`. `gnc.guidance` and `gnc.control` still inherit `INFO` from the root.

This is what `getLogger(__name__)` buys you, and why a module should not invent its own name. The name is the import path, so the logging tree matches the package structure without anyone keeping a list.
:::

## Summary

| Item | Statement |
| --- | --- |
| Module line | `log = logging.getLogger(__name__)` at the top; modules emit, applications configure |
| Levels | `DEBUG` 10, `INFO` 20, `WARNING` 30, `ERROR` 40, `CRITICAL` 50, in increasing severity |
| Default stream | Standard error, so diagnostics do not mix with piped output |
| `basicConfig(level=, format=)` | One-line application setup; does nothing if handlers already exist, unless `force=True` |
| Lazy formatting | `log.debug("q=%.1f", q)` formats only if emitted; f-strings always format |
| Measured here | 1,000 hidden calls built 1,000 reprs eagerly and 0 lazily; about 7.8 µs against 118 ns |
| Handlers | `StreamHandler`, `FileHandler`, `RotatingFileHandler`; each with its own level and format |
| Two gates | The logger's level decides whether a record exists; the handler's decides whether it is written |
| `log.exception(...)` | Inside `except`: logs at `ERROR` and attaches the traceback |
| Hierarchy | Dotted names inherit; `getLogger("gnc.navigation").setLevel(DEBUG)` targets one branch |
| Avoid | `logging.info(...)` at module level — it configures the root logger implicitly |
| Libraries | May add `logging.NullHandler()`; must not call `basicConfig` |

The next lesson gives the application its other face to the outside world. If the log level, the seed and the output file are chosen by whoever runs the script, they should be arguments to it — and `argparse` turns them into a command-line interface, complete with a help page you did not have to write.

::: context percent-format The little codes inside the message
The `%` placeholders are an old, compact way to describe how to print a value. They came to Python from the C language's `printf`.

- `%d` — a whole number: `42`.
- `%.3f` — a float with three digits after the point: `0.340`.
- `%.1f` — one digit after the point: `38.0`.
- `%r` — the value's `repr`, its programmer-facing text form.
- `%s` — its ordinary text form, as `str()` gives.
- `%%` — a literal percent sign.

The logging format string uses a named version, `%(name)s`, where the name in brackets picks which piece of the record to insert. The `-8` in `%(levelname)-8s` means "pad to 8 characters, text on the left".
:::

::: context two-streams Two pipes out of every program
Every program starts with two output streams. **Standard output** (stream 1) is for results. **Standard error** (stream 2) is for messages about the run. On your terminal both appear mixed together, but a pipe `|` (read "pipe into") carries only standard output to the next program.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="45" width="96" height="46" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="62" y="73" font-size="12" text-anchor="middle" fill="#1f2a44">sweep.py</text>
  <line x1="110" y1="58" x2="226" y2="36" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="236,34 224,30 226,42" fill="#1d6fd1"/>
  <text x="160" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">1: stdout (print)</text>
  <rect x="240" y="18" width="106" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="293" y="39" font-size="12" text-anchor="middle" fill="#1f2a44">next program</text>
  <line x1="110" y1="80" x2="226" y2="104" stroke="#b4232c" stroke-width="3"/>
  <polygon points="236,106 226,98 224,110" fill="#b4232c"/>
  <text x="160" y="120" font-size="11" text-anchor="middle" fill="#b4232c">2: stderr (logging)</text>
  <rect x="240" y="88" width="106" height="34" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="293" y="109" font-size="12" text-anchor="middle" fill="#1f2a44">your terminal</text>
</svg>
```

So `python3 sweep.py | sort` sorts the results and still shows you the warnings, unsorted and untouched.
:::

::: context logger-tree The family tree of loggers
Dots in a logger's name make a tree. The **root** logger sits at the top. A logger with no level of its own looks upward until it finds an ancestor that has one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="32" x2="180" y2="54"/>
    <line x1="180" y1="78" x2="70" y2="100"/><line x1="180" y1="78" x2="180" y2="100"/><line x1="180" y1="78" x2="290" y2="100"/>
    <line x1="180" y1="124" x2="180" y2="140"/>
  </g>
  <rect x="130" y="8" width="100" height="24" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="25" font-size="12" text-anchor="middle" fill="#1f2a44">root: INFO</text>
  <rect x="140" y="54" width="80" height="24" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="71" font-size="12" text-anchor="middle" fill="#1f2a44">gnc</text>
  <rect x="14" y="100" width="112" height="24" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="117" font-size="12" text-anchor="middle" fill="#1f2a44">gnc.guidance</text>
  <rect x="124" y="100" width="112" height="24" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="117" font-size="12" text-anchor="middle" fill="#1f2a44">navigation: DEBUG</text>
  <rect x="234" y="100" width="112" height="24" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="117" font-size="12" text-anchor="middle" fill="#1f2a44">gnc.control</text>
  <rect x="124" y="140" width="112" height="24" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="157" font-size="12" text-anchor="middle" fill="#1f2a44">….kalman</text>
</svg>
```

The blue boxes run at `DEBUG`: `gnc.navigation`, set directly, and `gnc.navigation.kalman`, which inherits it. The white ones inherit `INFO` from the root.
:::

::: context dynamic-pressure What q measures
**Dynamic pressure**, written $q$, is how hard the oncoming air pushes on a vehicle: $q = \tfrac{1}{2}\rho v^2$, with $\rho$ the air density and $v$ the speed. It grows as a rocket speeds up and shrinks as the air thins with height, so it peaks partway up, at **max-q**. That is when the structure is squeezed hardest.

A kilopascal is 1,000 pascals, and one pascal is one newton per square meter. So $35\,\mathrm{kPa}$ is $35{,}000$ newtons pressing on each square meter of the nose.
:::

::: context time-units Microseconds and nanoseconds
A **microsecond** (µs, the Greek letter mu for "micro") is one millionth of a second. A **nanosecond** (ns) is one billionth, so $1\,\mathrm{µs} = 1000\,\mathrm{ns}$.

That makes $7.8\,\mathrm{µs}$ equal to $7800\,\mathrm{ns}$, and $7800 / 118 \approx 66$. Tiny per call, but multiplied by a million calls it is $7.8\,\mathrm{s}$ against $0.118\,\mathrm{s}$. In a simulation that steps 500 times per simulated second for hours, those calls add up to real minutes.
:::

::: context random-seed Why log the seed
A computer's "random" numbers come from a formula that starts from one number, the **seed**. Same seed, same sequence of numbers, every time. That is why each Monte Carlo case logs its seed: with it, anyone can rerun exactly that case — the one that exceeded the limit — and watch it happen again with full debug logging turned on.
:::

::: context two-gates A record passes two gates
Every call like `log.debug(...)` first meets the logger's gate. Only if it passes is a record made and handed to each handler, which has a gate of its own.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="40" y="79" font-size="12" text-anchor="middle" fill="#1f2a44">log.debug</text>
  <line x1="78" y1="75" x2="112" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <rect x="114" y="55" width="80" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="154" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">logger</text>
  <text x="154" y="87" font-size="11" text-anchor="middle" fill="#1f2a44">DEBUG</text>
  <line x1="194" y1="70" x2="240" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <line x1="194" y1="80" x2="240" y2="115" stroke="#1f2a44" stroke-width="2"/>
  <rect x="242" y="15" width="104" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="294" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">console: INFO</text>
  <text x="294" y="47" font-size="11" text-anchor="middle" fill="#b4232c">debug dropped</text>
  <rect x="242" y="95" width="104" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="294" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">file: DEBUG</text>
  <text x="294" y="127" font-size="11" text-anchor="middle" fill="#1f2a44">debug written</text>
</svg>
```

Raise the logger to `INFO` and the debug call stops at the first box, so the file never hears of it.
:::

::: context rotation How a rotating log file works
`RotatingFileHandler("campaign.log", maxBytes=..., backupCount=3)` writes to `campaign.log` until the next record would push it past `maxBytes`. Then it renames the files along: `campaign.log.2` becomes `campaign.log.3`, `campaign.log.1` becomes `campaign.log.2`, the current file becomes `campaign.log.1`, and a fresh `campaign.log` starts. Anything past `.3` is deleted.

So the total space used can never grow past about four times `maxBytes`, however long the campaign runs. `TimedRotatingFileHandler` does the same on a clock, for example once a day.
:::

::: context traceback Reading a traceback
A **traceback** is Python's record of how it got to the failing line: which function called which, from the outermost call down to the line that raised. It prints with "most recent call last", so the line that actually failed is at the bottom, right above the error's name and message.

In the lesson's output, the markers `~~~~^~~~~` under `1.0 / rho` point at the exact operation that failed — the division. Python 3.11 added those markers.
:::

::: context last-resort What happens when nobody configured logging
If a message reaches the top of the logger tree and no handler anywhere has seen it, Python falls back to a built-in **last-resort handler**. It prints `WARNING` and above to standard error, as bare text, and hides everything below.

That is why a warning from a library can appear even in a program that never mentioned logging. A `NullHandler` on the library's logger counts as "a handler saw it", so the fallback stays quiet — until the application sets up real handlers of its own, which then receive everything as normal.
:::
