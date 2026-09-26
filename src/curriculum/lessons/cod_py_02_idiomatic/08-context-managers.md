---
id: l08-context-managers
title: Context managers: release on every path
minutes: 18
covers:
  - Context managers: with, __enter__/__exit__, contextlib
---

Borrowing a library book has three steps: check it out, read it, give it back. The first two take care of themselves. The third is the one that gets forgotten — especially on the day something went wrong, like the day you dropped the book in a puddle and left in a hurry.

Programs borrow things all the time and follow the same three steps: **acquire, use, release**. Open a file, read it, close it. Take a **[[lock|lock-meaning]]**, update a shared table, let go of the lock. Command a valve open, flow propellant, command it shut. The step that goes wrong is always the same one: the release, on the path where something failed.

You met the shape of this problem in the exceptions lesson of the first module. A `f.close()` written after the work does not run when the work raises an error, because the exception carries control straight past it. `try` / `finally` fixes that, but it costs three lines and an extra indent every time. So people write it for the important resources and forget it for the rest.

Python's answer is the `with` statement. It is the same idea as **[[RAII|raii]]** in C++: the release is attached to the *object*, not to the place where you called it, so it happens on every path out of the block. This lesson covers using `with`, writing the two methods behind it yourself, and the `contextlib` shortcut that turns a generator into one.

## What `with` actually guarantees

Here are two readers that parse the first line of a file as a number. The first closes the file by hand. The second uses `with`. Both are fed a file whose first line is not a number:

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

Follow the first reader. `float("n/a\n")` raises `ValueError`. The exception jumps out of the function, and the line `f.close()` never runs. The file's `closed` flag says `False` — not "might be open", but open.

Python will close it eventually, when nothing refers to the file any more. But "eventually" is not a promise you can build on. In a loop over a thousand run files, it shows up as `OSError: [Errno 24] Too many open files` — an error whose message has nothing to do with the parsing bug that caused it. The program has **[[run out of file handles|too-many-open-files]]**.

Now the second reader. It returns from *inside* the `with` block, and the file is still closed afterwards. That is the property to remember: the release runs on every way out — `return`, `break`, and an exception on its way up.

::: key
`with expr as name:` calls `expr.__enter__()`, binds its return value to `name`, runs the body, and calls `__exit__` on **[[every path out|with-paths]]** — normal end, `return`, `break`, `continue`, or a propagating exception. It is the one construct that makes release unforgettable.
:::

## Writing one: `__enter__` and `__exit__`

A **context manager** is any object with two special methods:

- `__enter__` — read it "dunder enter" — does the acquiring. Whatever it returns is bound to the name after `as`.
- `__exit__` — "dunder exit" — does the releasing. Python calls it however the block ends.

Here is a valve that stays open only while a block runs:

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

Read the aborted run line by line. The valve opened. Propellant flowed. Then the block raised. The valve closed, and only *then* did the `except` clause print "caught". So `__exit__` runs while the exception is **[[unwinding|unwinding]]**, before any handler further out sees it. That is exactly what you want from a **[[safing|safing]]** action: the valve is shut before anyone starts deciding what went wrong.

::: key
`__enter__` acquires and returns the resource, `__exit__` releases it and runs even when the body raises. It is Python RAII, and `contextlib.contextmanager` lets you write it as a generator with one `yield`.
:::

### The three arguments, and the return value

`__exit__` receives three arguments describing the exception in flight: its type, the exception object itself, and the **[[traceback|traceback-arg]]**. On the normal path all three are `None`. You rarely need them, except when the release should differ: save the work on success, undo it on failure.

The `return False` is the important line. A **falsy** return (one that counts as false, such as `False` or `None`) means "I did my cleanup; let the exception carry on". Returning `True` means "I have dealt with this; throw it away". That is almost always wrong:

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

The division by zero vanished without a trace, and `margin` kept its old value, `None`. That is a context manager that hides bugs.

`contextlib.suppress(ExceptionType)` is the careful version. It throws away only the types you name and lets everything else through, as the third block shows: `ZeroDivisionError` is not `FileNotFoundError`, so it escapes. Use `suppress` where the exception really is the expected case, such as deleting a file that may not exist.

::: example `@contextmanager`: one generator instead of two methods
Writing a whole class for a two-line acquire and release is heavy. `contextlib.contextmanager` turns a **generator** — a function containing `yield`, from lesson 2 — into a context manager. **[[Everything before the `yield`|generator-split]]** is the enter part. Everything after it is the exit part. And the whole thing must be wrapped in `try` / `finally`, or the exit part does not run when the block fails.

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

The durations themselves are not printed, because they change on every run and every machine. What matters is which stages got recorded.

Go through the three blocks:

1. `ascent` finished normally. After the `yield`, the `finally` clause recorded it.
2. `aborted` raised inside the block. The exception was thrown into the generator at the `yield`. The `finally` clause ran on its way out, recorded the stage, and let the exception continue to the `except`, which printed "caught".
3. `aborted_no_finally` raised too. The exception arrived at the bare `yield`, with no `try` to stop it, and left the generator at once. The lines after the `yield` never ran. The stage is **missing** from the list.

That is the one thing to remember about `@contextmanager`: the code after `yield` is your `__exit__`, and it only runs on the failure path if you put it in a `finally`. A stage timer that quietly leaves out the stage that crashed is worse than no timer. The missing row looks like a stage that was skipped.
:::

::: example A context manager from the library you will use most
NumPy has a floating-point error policy — what to do on a divide by zero, an overflow, and so on. It is **global state**: one setting shared by the whole program. `np.errstate` is a context manager that changes it for one block and puts it back afterwards. This is the shape to recognize: *change a global setting for a while, and restore it whatever happens*.

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

The code turns **dynamic pressure** $q$ (the push of the oncoming air, in pascals) into **[[true airspeed|airspeed-from-q]]** with $v = \sqrt{2q/\rho}$, where $\rho$ (read "rho") is the air density in kg/m³. Check the first entry by hand: $2 \times 1000 / 1.225 = 1632.7$, and $\sqrt{1632.7} \approx 40.4$ m/s. The third: $2 \times 4000 / 0.3639 = 21984$, and its square root is about 148.3 m/s. Faster at altitude for the same push, because the air is thinner — as it should be.

The middle density is zero, because the atmosphere table ran out. Dividing by zero gives `inf`, meaning infinity:

- Inside the first block, with `divide="ignore"`, you get `inf` and no warning.
- Inside the second, with `divide="raise"`, you get a `FloatingPointError` you can catch and trace back to one altitude.
- After both blocks, `np.geterr()` shows the policy back at its default, `warn`.

That restoring is the part `with` guarantees. Setting the policy with `np.seterr` and putting it back by hand works — right up until the block raises. Then the rest of the program runs with a policy somebody set for one calculation, and the next `nan` in an unrelated filter goes unreported.

Several managers can share one `with`, separated by commas. They are entered left to right and **[[released right to left|with-stack]]**, so the rightmost is released first:

```python
with open("in.csv") as src, open("out.csv", "w") as dst:
    dst.write(src.readline())
```

From Python 3.10 the list may be wrapped in parentheses and split over several lines. That is how a `with` holding four resources stays readable.
:::

::: warning
A context manager built with `@contextmanager` is **single use**. The generator is used up by the first `with`, so reusing the same object fails:

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

The message names a private detail inside `contextlib`, so do not write code that depends on it. The fact to take away is that reuse fails. Call the function again — `with once() as v:` every time — rather than storing the manager in a variable. A class-based manager *can* be reusable, as `PropellantValve` is, but that is something you design in, not something you get for free.
:::

## Check yourself

::: check
Compare `with open(path) as f:` against `f = open(path)` with `f.close()` at the end of the function. Name the exact circumstance in which they differ, and describe what the symptom looks like in a batch job.
:::

::: answer
They differ whenever the code between the open and the close does not finish normally: an exception, an early `return`, a `break` out of a loop around it, or a `continue`. In every one of those cases the hand-written `close()` is skipped and the file stays open, as the `closed: False` in this lesson's first measurement showed.

In a batch job over a thousand run files, a few of which fail to parse, the open files pile up. The job runs fine for the first few hundred files. Then every later open fails with `OSError: [Errno 24] Too many open files`. That error is about resources. It is reported long after, and far away from, the parsing bug that caused it. Worse, it goes away when you re-run with a smaller batch — the most confusing property a bug can have.
:::

::: check
What are the three arguments to `__exit__`, and what does returning `True` from it do?
:::

::: answer
`__exit__(self, exc_type, exc, tb)`: the type of the exception in flight, the exception object, and its traceback. All three are `None` when the block finished normally. That is how `__exit__` tells the two cases apart — useful when the release should differ, such as saving on success and undoing on failure.

Returning a truthy value tells Python the exception has been handled. It is thrown away, and the program carries on after the `with` block. That is almost never what you want. It hides the failure from every caller, and the code after the block runs with whatever half-finished state the failure left behind. Return `False`, or let the method end without a `return`, which gives `None` — also falsy. The one fair use is a manager built to swallow one named exception type, and `contextlib.suppress` already does that correctly.
:::

::: check
Why must the body of a `@contextmanager` generator wrap its `yield` in `try` / `finally`?
:::

::: answer
Because when the `with` block raises, the exception is thrown into the generator at the `yield`. Without a `try`, that exception passes straight out of the generator, and the statements after the `yield` — your whole release — never run.

With `try` / `finally`, the `finally` clause runs as the exception passes through. The release happens, and the exception continues on its way. This lesson's measurement is the evidence: the stage that raised was recorded by the version with `finally` and missing from the version without.

If you want to *catch* the exception rather than only clean up, use `try` / `except` inside the generator and re-raise with a bare `raise`. Be deliberate about it: swallowing the exception there has the same effect as returning `True` from `__exit__`.
:::

::: check
A test needs NumPy to raise on overflow for one calculation and warn everywhere else. Write the shape, and say what is wrong with `np.seterr(over="raise")` at the top of the test.
:::

::: answer
```python
with np.errstate(over="raise"):
    result = risky_calculation(x)
```

`np.seterr` changes the policy for the whole program and returns the old settings, which you are then responsible for putting back. If the calculation raises — which is the whole point of setting the policy — the line that restores it never runs. Every later test in the session inherits a policy it did not ask for. Tests then pass or fail depending on the order they happened to run in, which is the hardest kind of test failure to track down.

`np.errstate` is a context manager, so the restore is attached to the block and happens on the exception path too. The last line of this lesson's measurement, `warn`, is that restore, observed after a block that raised.
:::

::: check
You are writing a `TestStand` class that connects to hardware, runs a sequence, and must command the stand safe at the end. Sketch the interface, and say what `__exit__` should do if the safing command itself fails.
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

`__enter__` acquires the connection and returns the object the body will use. `__exit__` safes the stand, then closes the connection, then returns a falsy value so any exception from the body carries on to the caller.

If the safing command itself raises, that new exception replaces the one from the body. That is the right priority: a stand that could not be made safe is more urgent news than whatever the sequence was doing. The original is not lost. Python **chains** them: the new exception's `__context__` attribute holds the old one, and the traceback shows the body's exception, then "During handling of the above exception, another exception occurred", then the safing failure. Running a small version confirms it: the caught error is `RuntimeError('safing failed')`, and its `__context__` is the body's `ValueError`.

The inner `finally` makes sure the connection closes even when safing failed. A stuck connection would stop the next attempt from reaching the hardware at all.
:::

## Summary

| Item | Statement |
| --- | --- |
| `with expr as n:` | `__enter__` runs, its value binds to `n`, `__exit__` runs on every exit path |
| Covered paths | Normal end, `return`, `break`, `continue`, and a propagating exception |
| `__enter__(self)` | Acquires; returns the object the body should use, often `self` |
| `__exit__(self, t, e, tb)` | Releases; the three arguments are `None` on the normal path |
| Return from `__exit__` | Falsy lets the exception continue; truthy discards it — almost always wrong |
| `contextlib.suppress(E)` | The careful discard: only type `E`, everything else propagates |
| `@contextmanager` | Generator with one `yield`; before it is enter, after it is exit |
| The `finally` rule | Without `try`/`finally` around the `yield`, the exit part is skipped when the body raises |
| Single use | A `@contextmanager` object is used up by one `with`; call the function again |
| Several at once | `with a() as x, b() as y:` — released right to left; parenthesized across lines in 3.10+ |
| `np.errstate` | Temporarily changes a global policy and restores it; measured here returning to `warn` |

Next lesson: the `@` in `@contextmanager` is itself a tool you can write. A decorator is a function that takes a function and hands back a new one, and knowing how it works lets you write your own `@timed`, `@retry` and `@lru_cache`.

::: context lock-meaning What a lock is
When two parts of a program run at the same time — two **threads** — and both want to change the same table, they can trip over each other: one reads a value, the other changes it, the first writes back something stale. A **lock** is a token only one thread can hold at a time, like the single key to a bathroom at a gas station. You take the key, do your business, and hand it back.

Forgetting to hand it back is the classic disaster: every other thread waits forever. Python's `threading.Lock` is a context manager for exactly that reason.
:::

::: context raii The C++ name for the same idea
**RAII** stands for "Resource Acquisition Is Initialization", a clumsy name for a simple idea from C++. When an object is created it grabs its resource. When the object goes out of scope — the program leaves the curly braces it lived in — its **destructor** runs automatically and gives the resource back, whether the program left normally or because of an error.

Flight software written in C++ leans on this heavily, and you will meet it in the C++ modules. Python cannot promise exactly when an object is destroyed, so it makes the exit point explicit instead: the end of the `with` block.
:::

::: context too-many-open-files Why the count runs out
Every open file uses a small number called a **file descriptor**, which the operating system hands out from a limited supply for each process. On many Linux systems the everyday limit is 1,024 per process, and some machines set it higher. You can see yours in a terminal with `ulimit -n`.

A leaked file keeps its number until the object is finally cleaned up. Leak enough of them in a loop and the supply runs dry. "Errno 24" is the operating system's error number for "this process has no descriptors left", which is why the message sounds unrelated to your actual bug.
:::

::: context with-paths Every road goes through the exit
However the body of a `with` block ends, the path out passes through `__exit__`. There is no way around it short of the whole process being killed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="8" width="120" height="30" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="28" font-size="12" fill="#1f2a44" text-anchor="middle">__enter__()</text>
  <line x1="180" y1="38" x2="180" y2="52" stroke="#1f2a44" stroke-width="2"/>
  <rect x="100" y="52" width="160" height="30" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="72" font-size="12" fill="#1f2a44" text-anchor="middle">body</text>
  <line x1="180" y1="82" x2="50" y2="98" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="120" x2="180" y2="148" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="12" y="98" width="76" height="22" rx="11" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">normal end</text>
  <line x1="180" y1="82" x2="135" y2="98" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="135" y1="120" x2="180" y2="148" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="97" y="98" width="76" height="22" rx="11" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">return</text>
  <line x1="180" y1="82" x2="225" y2="98" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="225" y1="120" x2="180" y2="148" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="187" y="98" width="76" height="22" rx="11" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="225" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">break</text>
  <line x1="180" y1="82" x2="310" y2="98" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="310" y1="120" x2="180" y2="148" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="272" y="98" width="76" height="22" rx="11" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="310" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">exception</text>
  <rect x="120" y="148" width="120" height="30" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">__exit__(...)</text>
  <text x="180" y="194" font-size="11" fill="#6c7a93" text-anchor="middle">then on to wherever the path was going</text>
</svg>
```

After `__exit__` finishes, a `return` still returns its value and an exception still travels on to its handler — unless `__exit__` returned `True`.
:::

::: context unwinding How an exception travels
When code raises an exception, Python abandons the current line and starts looking for a matching `except`. It checks the block it is in, then the function that called this one, then the caller of that, moving outward one layer at a time. This outward search is called **unwinding the stack**.

As it leaves each `with` block and each `try` with a `finally`, Python runs their cleanup before moving further out. That is why the valve printed "closed" before the handler printed "caught": the valve's block was inside the `try`, so it was passed first.
:::

::: context safing Making a vehicle safe
To **safe** a vehicle or a test stand means putting it into a state where nothing dangerous can happen: valves shut, igniters disarmed, tanks vented to a safe pressure. Test-stand software is built so that any abort, fault or lost connection leads to a safing sequence.

Engineers care most about the *failure* path here, because that is precisely when a valve left open matters. A context manager is a natural fit: the safing lives in `__exit__`, which runs on the path where something went wrong.
:::

::: context traceback-arg What the third argument holds
The **traceback** is the record of where the exception happened: which file, which line, and the chain of function calls that led there. It is what Python prints in red when a program crashes.

Inside `__exit__` it arrives as an object, usually named `tb`. Most context managers never touch it. A logging manager might pass it on so the log records exactly where the failure came from.
:::

::: context generator-split One function, cut at the yield
`@contextmanager` runs your generator up to the `yield` when the `with` starts, and resumes it when the `with` ends. If the block raised, the exception is thrown into the generator right at the `yield`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="210" height="150" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44" font-family="monospace">
    <text x="22" y="34">t0 = perf_counter()</text>
    <text x="22" y="58">try:</text>
    <text x="40" y="82" font-weight="700" fill="#1d6fd1">yield</text>
    <text x="22" y="106">finally:</text>
    <text x="40" y="130">record(label)</text>
  </g>
  <line x1="10" y1="68" x2="220" y2="68" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="10" y1="92" x2="220" y2="92" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="290" y="40" font-size="12" fill="#1d6fd1" text-anchor="middle">like __enter__</text>
  <text x="290" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">with-block runs</text>
  <text x="290" y="120" font-size="12" fill="#1d6fd1" text-anchor="middle">like __exit__</text>
  <text x="290" y="140" font-size="11" fill="#b4232c" text-anchor="middle">also runs on failure</text>
  <text x="290" y="154" font-size="11" fill="#b4232c" text-anchor="middle">thanks to finally</text>
</svg>
```

The dashed lines mark where the generator pauses and where it resumes.
:::

::: context airspeed-from-q Where the airspeed formula comes from
Dynamic pressure is defined as $q = \tfrac12 \rho v^2$ — half the density times the speed squared. Solve for $v$: multiply both sides by 2 and divide by $\rho$ to get $v^2 = 2q/\rho$, then take the square root.

An airspeed sensor on an aircraft or a rocket's air-data probe works this way round: it measures $q$ as a pressure difference and needs a density to turn that into a speed. Feed it a density of zero and the formula divides by zero, which is exactly the fault in the example.
:::

::: context with-stack Last in, first out
Resources in one `with` behave like a stack of plates: the last one put on is the first one taken off. That order is not arbitrary. The later resource may depend on the earlier one, so it must be released while the earlier one still exists.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="70" width="140" height="30" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="90" font-size="12" fill="#1f2a44" text-anchor="middle">1. open src</text>
  <rect x="20" y="36" width="140" height="30" rx="4" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="90" y="56" font-size="12" fill="#1f2a44" text-anchor="middle">2. open dst</text>
  <text x="90" y="24" font-size="11" fill="#6c7a93" text-anchor="middle">entered bottom to top</text>
  <text x="250" y="44" font-size="12" fill="#1f2a44" text-anchor="middle">close dst first</text>
  <text x="250" y="94" font-size="12" fill="#1f2a44" text-anchor="middle">close src second</text>
  <line x1="250" y1="52" x2="250" y2="78" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="250,84 245,76 255,76" fill="#1f2a44"/>
  <text x="180" y="122" font-size="11" fill="#6c7a93" text-anchor="middle">with open("in.csv") as src, open("out.csv", "w") as dst:</text>
</svg>
```

For two files the order hardly matters. For a connection and a session opened over it, it matters a great deal.
:::
