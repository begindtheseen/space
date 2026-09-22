---
id: l08-context-managers
title: Context managers: release on every path
minutes: 15
covers:
  - Context managers: with, __enter__/__exit__, contextlib
---

Acquire, use, release. Open a file, read it, close it. Take a lock, update the shared table, release it. Command a valve open, flow propellant, command it shut. The pattern is everywhere, and the part that goes wrong is always the same part: the release, on the path where something failed.

You already know the shape of the problem from the exceptions lesson in the first module. `f.close()` written after the work does not run when the work raises, because the exception carries control past it. `try` / `finally` fixes that and costs three lines and an indent every time, which means it gets written for the important resources and forgotten for the rest.

`with` is Python's answer, and it is the same idea as RAII in C++: the release is attached to the object, not to the call site, so it happens on every path out of the block — normal completion, `return`, `break`, and an exception on its way up. This lesson covers using `with`, writing `__enter__` and `__exit__` yourself, and the `contextlib` shortcut that turns a generator into a context manager.

## What `with` actually guarantees

Two readers, the same parse, the same failing input:

```python
# close_paths.py
OPENED = []


def read_first_float(path):
    """Closes the file only when nothing goes wrong."""
    f = open(path)
    OPENED.append(f)
    value = float(f.readline())
    f.close()
    return value


def read_first_float_with(path):
    """Closes the file on every path out of the block."""
    with open(path) as f:
        OPENED.append(f)
        return float(f.readline())


with open("good.txt", "w") as f:
    f.write("9.81\n")
with open("bad.txt", "w") as f:
    f.write("n/a\n")

for reader in (read_first_float, read_first_float_with):
    OPENED.clear()
    try:
        reader("bad.txt")
    except ValueError as exc:
        print(f"{reader.__name__}: {type(exc).__name__}, file closed afterwards:", OPENED[0].closed)
```

```bash
python3 close_paths.py
# read_first_float: ValueError, file closed afterwards: False
# read_first_float_with: ValueError, file closed afterwards: True
```

The first function left the file open. Not "might have"; the `closed` flag says so. CPython will eventually close it when the last reference goes away, but "eventually" is not a guarantee you can build on, and on a loop over a thousand run files it arrives as `OSError: [Errno 24] Too many open files` — a failure whose message has nothing to do with the parsing bug that caused it.

Note the second function returns from *inside* the `with` block and the file is still closed. That is the property worth internalising: `__exit__` runs on every exit, including `return`, including `break`, including an exception passing through.

::: key
`with expr as name:` calls `expr.__enter__()`, binds its return value to `name`, runs the body, and calls `__exit__` on every path out — normal end, `return`, `break`, `continue`, or a propagating exception. It is the one construct that makes release unforgettable.
:::

## Writing one: `__enter__` and `__exit__`

Any object with those two methods is a context manager.

```python
# valve.py
class PropellantValve:
    """Holds a valve open for the duration of a block, and closes it whatever happens."""

    def __init__(self, name):
        self.name = name
        self.is_open = False

    def __enter__(self):
        self.is_open = True
        print(f"  {self.name}: open")
        return self

    def __exit__(self, exc_type, exc, tb):
        self.is_open = False
        print(f"  {self.name}: closed (exc_type={exc_type.__name__ if exc_type else None})")
        return False

    def flow(self, kg_per_s):
        if not self.is_open:
            raise RuntimeError(f"{self.name} is closed")
        return kg_per_s


valve = PropellantValve("lox_main")

print("nominal run:")
with valve as v:
    print("  flowing", v.flow(240.0), "kg/s")
print("valve open?", valve.is_open)

print("aborted run:")
try:
    with valve as v:
        print("  flowing", v.flow(240.0), "kg/s")
        raise RuntimeError("chamber pressure low")
except RuntimeError as exc:
    print("  caught:", exc)
print("valve open?", valve.is_open)
```

```bash
python3 valve.py
# nominal run:
#   lox_main: open
#   flowing 240.0 kg/s
#   lox_main: closed (exc_type=None)
# valve open? False
# aborted run:
#   lox_main: open
#   flowing 240.0 kg/s
#   lox_main: closed (exc_type=RuntimeError)
#   caught: chamber pressure low
# valve open? False
```

Read the aborted run's order: the valve closed *before* the `except` clause printed. `__exit__` runs as the exception unwinds, before any handler further out sees it, which is what you want from a safing action.

`__exit__` takes three arguments describing the exception in flight: its type, the exception object and the traceback, all `None` on the normal path. You almost never need them except to decide whether the release should differ — commit on success, roll back on failure.

The `return False` is the important line. A falsy return means "I did my cleanup; let the exception continue". Returning `True` means "I have handled this; discard it", and that is almost always wrong:

```python
# swallow.py
import contextlib


class Swallow:
    """__exit__ returning True discards the exception. Almost never what you want."""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return True


margin = None
with Swallow():
    margin = 1.0 / 0.0
print("after Swallow, margin is", margin)

with contextlib.suppress(FileNotFoundError):
    open("no_such_run.csv")
print("suppress(FileNotFoundError): the missing file was not an error here")

try:
    with contextlib.suppress(FileNotFoundError):
        1.0 / 0.0
except ZeroDivisionError as exc:
    print("ZeroDivisionError still propagates:", exc)
```

```bash
python3 swallow.py
# after Swallow, margin is None
# suppress(FileNotFoundError): the missing file was not an error here
# ZeroDivisionError still propagates: float division by zero
```

The division by zero vanished and `margin` kept its previous value — a context manager that hides bugs. `contextlib.suppress(ExceptionType)` is the disciplined version: it discards only the named types and lets everything else through, as the third block shows. Use it where the exception genuinely is the expected case, such as deleting a file that may not exist.

::: example `@contextmanager`: one generator instead of two methods
Writing a class for a two-line acquire and release is heavy. `contextlib.contextmanager` turns a generator into a context manager: everything before the `yield` is `__enter__`, everything after is `__exit__`, and the whole thing must be wrapped in `try` / `finally` or the "after" part does not run on the exception path.

```python
# ctxmgr.py
import time
from contextlib import contextmanager

DURATIONS = {}


@contextmanager
def timed(label):
    """Record how long a block took, even if it raised."""
    t0 = time.perf_counter()
    try:
        yield
    finally:
        DURATIONS[label] = time.perf_counter() - t0
        print(f"  {label}: recorded")


@contextmanager
def timed_no_finally(label):
    """The same thing with the try/finally left out. It is not the same thing."""
    t0 = time.perf_counter()
    yield
    DURATIONS[label] = time.perf_counter() - t0
    print(f"  {label}: recorded")


with timed("ascent"):
    sum(range(100_000))

try:
    with timed("aborted"):
        raise RuntimeError("solver diverged")
except RuntimeError as exc:
    print("  caught:", exc)

try:
    with timed_no_finally("aborted_no_finally"):
        raise RuntimeError("solver diverged")
except RuntimeError as exc:
    print("  caught:", exc)

print("stages recorded:", sorted(DURATIONS))
print("all durations non-negative:", all(dt >= 0.0 for dt in DURATIONS.values()))
```

```bash
python3 ctxmgr.py
#   ascent: recorded
#   aborted: recorded
#   caught: solver diverged
#   caught: solver diverged
# stages recorded: ['aborted', 'ascent']
# all durations non-negative: True
```

The durations themselves are not printed, because they differ on every run and on every machine; what is printed is which stages got recorded, and that is the whole result. `ascent` and `aborted` are both there. `aborted_no_finally` is **not**, because its generator was resumed with the exception thrown in at the `yield`, and with no `try` / `finally` the lines after the `yield` never ran.

That is the one thing to remember about `@contextmanager`: the body after `yield` is your `__exit__`, and it only runs on the failure path if you put it in a `finally`. A stage timer that silently omits the stage that crashed is worse than no timer, because the missing row looks like a stage that was skipped.
:::

::: example A context manager from the library you will use most
NumPy's floating-point error policy is process-wide state, and `np.errstate` is a context manager that changes it for one block and puts it back. This is the shape to recognise: *temporarily change a global, restore it whatever happens*.

```python
# errstate.py
import numpy as np

q_pa = np.array([1.0e3, 2.0e3, 4.0e3])
rho = np.array([1.225, 0.0, 0.3639])

with np.errstate(divide="ignore"):
    v = np.sqrt(2.0 * q_pa / rho)
print(np.round(v, 3))

with np.errstate(divide="raise"):
    try:
        np.sqrt(2.0 * q_pa / rho)
    except FloatingPointError as exc:
        print("FloatingPointError:", exc)

print(np.geterr()["divide"])
```

```bash
python3 errstate.py
# [ 40.406     inf 148.27 ]
# FloatingPointError: divide by zero encountered in divide
# warn
```

The array is dynamic pressure converted to true airspeed, $v = \sqrt{2q/\rho}$, at three altitudes, one of which has a density of zero because the atmosphere table ran out. Inside the first block that is `inf` and no warning; inside the second it is a `FloatingPointError` you can catch and attribute to a specific altitude; and after both blocks `np.geterr()` shows the policy back at its default, `warn`.

The restoration is the part `with` guarantees. Setting the policy with `np.seterr` and restoring it by hand works exactly until the block raises, at which point the rest of the program runs with a floating-point policy somebody set for one calculation — and the next `nan` in an unrelated filter goes unreported.

Several managers can share one `with`, separated by commas, and they nest left to right, so the rightmost is released first:

```python
with open("in.csv") as src, open("out.csv", "w") as dst:
    dst.write(src.readline())
```

From Python 3.10 the list may be wrapped in parentheses and split over lines, which is how a `with` holding four resources stays readable.
:::

::: warning
A context manager built with `@contextmanager` is **single use**. The generator is consumed by the first `with`, so reusing the same object raises:

```python
# single_use.py
from contextlib import contextmanager


@contextmanager
def once():
    yield 1


cm = once()
with cm as v:
    print("first use:", v)

try:
    with cm as v:
        print("second use:", v)
except AttributeError as exc:
    print("AttributeError:", exc)

with once() as v:
    print("a fresh manager:", v)
```

```bash
python3 single_use.py
# first use: 1
# AttributeError: '_GeneratorContextManager' object has no attribute 'args'
# a fresh manager: 1
```

The message names a private attribute of `contextlib`'s implementation and is not something to write code against; the fact to take away is that reuse fails. Call the factory again — `with once() as v:` each time — rather than storing the manager. A class-based context manager may be reusable, as `PropellantValve` above is, but that is a property you have to design in, not one you get.
:::

## Check yourself

::: check
`with open(path) as f:` and `f = open(path)` followed by `f.close()` at the end of the function. Name the specific circumstance in which they differ, and what the symptom looks like in a batch job.
:::

::: answer
They differ whenever the code between the open and the close does not complete normally: an exception, an early `return`, a `break` out of a surrounding loop, or a `continue`. In all of those the manual `close()` is skipped and the file stays open, as the `closed: False` in this lesson's first measurement showed.

In a batch job over a thousand run files, each of which occasionally fails to parse, the open handles accumulate. The symptom is that the job runs fine for the first few hundred files and then every subsequent open fails with `OSError: [Errno 24] Too many open files` — an error about resources, reported long after and far from the parsing bug that caused it, and one that goes away when you re-run with a smaller batch, which is the worst possible property for a bug to have.
:::

::: check
What are the three arguments to `__exit__`, and what does returning `True` from it do?
:::

::: answer
`__exit__(self, exc_type, exc, tb)`: the type of the exception in flight, the exception instance, and its traceback. All three are `None` when the block finished normally, which is how `__exit__` tells the two cases apart — useful when the release differs, such as committing on success and rolling back on failure.

Returning a truthy value tells Python the exception has been handled, so it is discarded and execution continues after the `with` block. This is almost never what you want: it hides the failure from every caller, and the code after the block runs with whatever half-finished state the failure left. Return `False`, or simply let the method return `None`, which is falsy. The legitimate use is a manager written specifically to swallow one named exception type — and `contextlib.suppress` already is that, done correctly.
:::

::: check
Why must the body of a `@contextmanager` generator wrap its `yield` in `try` / `finally`?
:::

::: answer
Because when the `with` block raises, the exception is thrown into the generator at the point of the `yield`. Without a `try`, that exception propagates straight out of the generator and the statements after the `yield` — your entire release — never execute.

With `try` / `finally`, the `finally` clause runs as the exception passes through, so the release happens and the exception continues on its way. This lesson's measurement is the evidence: the stage that raised was recorded by the version with `finally` and missing from the version without.

If you want to catch the exception rather than merely clean up, use `try` / `except` / `raise` inside the generator, but be deliberate — swallowing it there has the same consequences as returning `True` from `__exit__`.
:::

::: check
A test needs NumPy to raise on overflow for one calculation and warn everywhere else. Write the shape, and say what is wrong with `np.seterr(over="raise")` at the top of the test.
:::

::: answer
```python
with np.errstate(over="raise"):
    result = risky_calculation(x)
```

`np.seterr` changes the policy for the whole process and returns the old settings, which you are then responsible for restoring. If the calculation raises — which is the entire point of setting the policy — the restoring line never runs, and every subsequent test in the session inherits a policy it did not ask for. Tests then pass or fail depending on the order they ran in, which is the hardest class of test failure to diagnose.

`np.errstate` is a context manager, so the restore is attached to the block and happens on the exception path too. The final line of this lesson's measurement, `warn`, is that restoration observed after a block that raised.
:::

::: check
You are writing a `TestStand` class that connects to hardware, runs a sequence, and must command the stand safe. Sketch the interface and say what `__exit__` should do if the safing command itself fails.
:::

::: answer
```python
class TestStand:
    def __enter__(self):
        self.connection = connect(self.address)
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            self.command_safe()
        finally:
            self.connection.close()
        return False
```

`__enter__` acquires and returns the object the body will use; `__exit__` safes, then closes, then returns a falsy value so any exception from the body continues to the caller.

If the safing command itself raises, that exception replaces the one from the body — which is the correct priority, because a stand that could not be safed is a more urgent fact than whatever the sequence was doing. The original is not lost: Python chains them, and the traceback shows the body's exception under "During handling of the above exception, another exception occurred". The nested `finally` is there so that the connection closes even when safing failed, since a stuck connection would prevent the next attempt from reaching the hardware at all.
:::

## Summary

| Item | Statement |
| --- | --- |
| `with expr as n:` | `__enter__` runs, its value binds to `n`, `__exit__` runs on every exit path |
| Covered paths | Normal end, `return`, `break`, `continue`, and a propagating exception |
| `__enter__(self)` | Acquires; returns the object the body should use, often `self` |
| `__exit__(self, t, e, tb)` | Releases; the three arguments are `None` on the normal path |
| Return from `__exit__` | Falsy lets the exception continue; truthy discards it — almost always wrong |
| `contextlib.suppress(E)` | The disciplined discard: only type `E`, everything else propagates |
| `@contextmanager` | Generator with one `yield`; before it is enter, after it is exit |
| The `finally` rule | Without `try`/`finally` around the `yield`, the exit part is skipped when the body raises |
| Single use | A `@contextmanager` object is consumed by one `with`; call the factory again |
| Several at once | `with a() as x, b() as y:` — released right to left; parenthesised across lines in 3.10+ |
| `np.errstate` | Temporarily changes a global policy and restores it; measured here returning to `warn` |

The next lesson is the other half of `@contextmanager`: the decorator syntax itself. `@` in front of a function means a function was passed to a function, and understanding that is what lets you write `@timed`, `@retry` and `@lru_cache` of your own.
