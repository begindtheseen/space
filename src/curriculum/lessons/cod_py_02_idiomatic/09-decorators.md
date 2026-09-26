---
id: l09-decorators
title: Decorators, wraps and caching
minutes: 20
covers:
  - Decorators, functools.wraps, functools.lru_cache
---

Think of gift wrap. You take a present, wrap it in paper, and hand over something that looks different on the outside but still has the same present inside. A **decorator** does that to a function. It takes your function, wraps extra behavior around it — timing, checking, caching, retrying — and hands back something you call in exactly the same way.

You have been using decorators since lesson 4: `@property`, `@classmethod`, `@staticmethod`, `@dataclass`, `@contextmanager`. Every one of them is the same mechanism, and the mechanism is smaller than it looks. A decorator is a function that takes a function and returns a function. That works because in Python **[[functions are ordinary values|first-class]]**: you can pass them around, store them in lists, and hand them to other functions — as you did with `sorted(key=...)` in lesson 3.

The `@` line puts the wrapping right on top of the definition, so anyone reading `q_dyn` sees at once that calls to it are timed, checked, cached or retried. Two things need getting right: keeping the wrapped function's identity, which takes `functools.wraps`, and knowing when a cache speeds things up and when it quietly breaks your answers. Both are measured below.

## `@` is an assignment

Writing `@timed` on the line above `def q_dyn(...)` means exactly one thing:

```python
q_dyn = timed(q_dyn)
```

Read `@timed` aloud as "decorated with timed". Python runs that assignment the moment the `def` finishes. There is no new scope and no new kind of object. To see it plainly, here is a decorator applied by hand, with no `@` at all:

```python
# naked.py
import time


def timed(fn):
    """Wrap fn so that every call records its duration."""

    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = fn(*args, **kwargs)
        timed.calls.append((fn.__name__, time.perf_counter() - t0))
        return result

    return wrapper


timed.calls = []


def q_dyn(rho, v):
    """Dynamic pressure, Pa, from density and true airspeed."""
    return 0.5 * rho * v * v


q_dyn = timed(q_dyn)
print(q_dyn(1.225, 250.0))
print(len(timed.calls), timed.calls[0][0])
print(q_dyn.__name__)
print(q_dyn.__doc__)
```

```bash
python3 naked.py
# 38281.25
# 1 q_dyn
# wrapper
# None
```

A few pieces to read aloud first. `*args` ("star args") collects any positional arguments into a tuple. `**kwargs` ("star-star kwargs") collects any keyword arguments into a dict. Passing them on as `fn(*args, **kwargs)` hands every argument to the real function untouched. That is how one wrapper fits any function. `time.perf_counter()` is a **[[high-resolution clock|perf-counter]]**; subtracting two readings gives the elapsed time in seconds.

Now the result. **Dynamic pressure** — the push of the oncoming air — is $q = \tfrac12 \rho v^2$, where $\rho$ ("rho") is the air density and $v$ the speed. At sea level, $\rho = 1.225$ kg/m³, and at 250 m/s:

$$
q = 0.5 \times 1.225 \times 250^2 = 0.5 \times 1.225 \times 62500 = 38281.25\,\mathrm{Pa}
$$

That is about 38.3 kPa, and the wrapper recorded one call. `timed` works because `wrapper` is a **closure**, in the sense of the first module's scope lesson: it refers to `fn` from the call to `timed` that made it, so **[[each wrapper remembers its own function|wrapper-closure]]**.

Now read the last two lines of output. The name `q_dyn` is now bound to `wrapper`. So `q_dyn.__name__` is `"wrapper"`, and the docstring is gone. That is not cosmetic:

- `help(q_dyn)` shows the wrapper's arguments and no documentation.
- A traceback through it says `wrapper`. With six decorated functions, six lines say `wrapper`.
- `inspect.signature` reports `(*args, **kwargs)` instead of the real parameters. That breaks anything that reads a function's parameters to decide what to do: documentation builders, tools that build command-line options from a function, and test runners.

That last point is the one that bites first. **pytest**, the standard Python test runner, reads a test function's parameters to decide which **[[fixtures|pytest-fixture]]** to hand it. It also reads its name and any marks attached to it. Here is a test decorated without and with the fix below:

```python
# test_decorated.py
import functools


def plain(fn):
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper


def careful(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper


@plain
def test_without_wraps(tmp_path):
    assert tmp_path.exists()


@careful
def test_with_wraps(tmp_path):
    assert tmp_path.exists()
```

```bash
python3 -m pytest -q test_decorated.py
# E       TypeError: test_without_wraps() missing 1 required positional argument: 'tmp_path'
# 1 failed, 1 passed
```

pytest looked at the plain wrapper, saw `(*args, **kwargs)`, concluded the test needed nothing, and called it with no arguments. The same test with the fix passed.

## `functools.wraps` copies the identity across

```python
# wrapped.py
import functools
import inspect
import time

CALLS = []


def timed(fn):
    """Wrap fn so that every call records its duration, keeping fn's identity."""

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = fn(*args, **kwargs)
        CALLS.append((fn.__name__, time.perf_counter() - t0))
        return result

    return wrapper


@timed
def q_dyn(rho, v):
    """Dynamic pressure, Pa, from density and true airspeed."""
    return 0.5 * rho * v * v


print(q_dyn(1.225, 250.0))
print(q_dyn.__name__)
print(q_dyn.__doc__)
print(inspect.signature(q_dyn))
print(q_dyn.__wrapped__.__name__)
print([name for name, _ in CALLS])
```

```bash
python3 wrapped.py
# 38281.25
# q_dyn
# Dynamic pressure, Pa, from density and true airspeed.
# (rho, v)
# q_dyn
# ['q_dyn']
```

One line — `@functools.wraps(fn)` on the wrapper — fixes everything. It copies the wrapped function's `__name__`, `__doc__`, `__module__`, **[[`__qualname__`|qualname]]** and `__annotations__` onto the wrapper, and merges in its `__dict__`, which is where things like pytest's marks live. It also sets `__wrapped__` to point at the original function. That is how `inspect.signature` recovers `(rho, v)` instead of `(*args, **kwargs)`.

Notice that `wraps` is itself a decorator — one that takes an argument, `fn`. You will write that kind in a moment.

This is not optional. There is no situation in which you want a decorator that wipes out its target's identity. A reviewer will ask about a missing `wraps` before reading anything else in the decorator.

::: key
Why does a decorator need functools.wraps? Without it the wrapper replaces the original `__name__`, `__doc__`, `__module__` and `__wrapped__`, which breaks `help()`, tracebacks, pytest test collection and any introspection-based tooling.

`@decorator` above `def f` means `f = decorator(f)`. `@functools.wraps(fn)` on the wrapper copies `__name__`, `__doc__`, `__module__`, `__qualname__` and `__annotations__`, and sets `__wrapped__` so that `inspect.signature` still reports the real parameters.
:::

::: example A decorator that takes arguments
`@bounded(-0.35, 0.35)` is a **decorator factory**: a function that *makes* a decorator. Python first calls `bounded(-0.35, 0.35)`. That call returns the decorator, which is then applied to the function. So there are three nested functions — one for the arguments, one for the function, one for each call — and the nesting is the whole trick.

```python
# factory.py
import functools


def bounded(low, high):
    """Return a decorator that rejects a return value outside [low, high]."""

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            value = fn(*args, **kwargs)
            if not low <= value <= high:
                raise ValueError(
                    f"{fn.__name__} returned {value:.4f}, outside [{low}, {high}]"
                )
            return value

        return wrapper

    return decorator


@bounded(-0.35, 0.35)
def gimbal_command(error_rad, gain):
    """Proportional gimbal angle command, rad."""
    return gain * error_rad


print(round(gimbal_command(0.02, 4.0), 4))
print(gimbal_command.__name__, "-", gimbal_command.__doc__)

try:
    gimbal_command(0.2, 4.0)
except ValueError as exc:
    print("ValueError:", exc)
```

```bash
python3 factory.py
# 0.08
# gimbal_command - Proportional gimbal angle command, rad.
# ValueError: gimbal_command returned 0.8000, outside [-0.35, 0.35]
```

The function computes how far to swivel the engine — the **[[gimbal|gimbal]]** angle — as gain times attitude error. Step by step:

1. First call: $4.0 \times 0.02 = 0.08$ rad. That is inside the ±0.35 rad hard stop, so the value passes through.
2. The second line shows the name and docstring survived, thanks to `wraps`.
3. Second call: $4.0 \times 0.2 = 0.8$ rad. The real actuator cannot swing that far — 0.8 rad is about 46°, against a stop near 20°. The decorator raises, with the value and the limits in the message.

Why use a decorator here rather than an `if` in each caller? The check is attached to the function, so it applies at every call site, including ones written next year. The limits sit next to the definition, where a reviewer comparing them with the actuator's specification will look. And `wraps` keeps `gimbal_command` recognizable, as the second line of output confirms.

Everyone gets the **[[three levels|factory-layers]]** wrong once, so name them:

- `bounded` takes the *decorator's arguments* (`low`, `high`).
- `decorator` takes the *function* (`fn`).
- `wrapper` takes the *call's arguments* (`*args`, `**kwargs`).

If a decorator works as `@bounded` but not as `@bounded(-0.35, 0.35)`, you have two levels where you need three.
:::

### Two tools for handling failures inside a wrapper

A wrapper that retries or reports failures leans on two facts about exceptions. First, an `except` clause accepts a **tuple of types** and catches any of them. Second, an exception is an ordinary object: you can store it in a variable and `raise` it again later.

```python
# catch_tuple.py
errors = []
for text in ["9.81", "n/a", None]:
    try:
        float(text)
    except (ValueError, TypeError) as exc:
        errors.append(exc)

print([type(e).__name__ for e in errors])

try:
    raise errors[-1]
except TypeError as exc:
    print("raised again:", exc)
```

```bash
python3 catch_tuple.py
# ['ValueError', 'TypeError']
# raised again: float() argument must be a string or a real number, not 'NoneType'
```

`"9.81"` converted fine. `"n/a"` raised `ValueError` and `None` raised `TypeError`; the one `except` caught both. Then the last stored exception was raised again and caught as the `TypeError` it always was. A decorator factory that takes a tuple of exception types to catch is built from exactly these pieces.

## `functools.lru_cache`: remember answers you already worked out

A **cache** is a notebook of answers. The first time you ask a question, you work it out and write the answer down. Next time, you look it up instead. For a function, the "question" is its arguments. This trick is called **[[memoization|memoize-word]]**.

`functools.lru_cache` gives any function a cache in one line. The cache is a dictionary keyed by the arguments, so the arguments must be **[[hashable|hashable]]** — usable as dictionary keys. Numbers, strings and tuples are. Lists, dicts and NumPy arrays are not.

::: key
What does functools.lru_cache change about a function? It memoises results keyed by the arguments, which must be hashable. It is a large win for expensive pure functions and a correctness hazard for anything that is not pure or whose arguments are mutable.
:::

A **pure** function is one whose answer depends only on its arguments, and which changes nothing outside itself. Only pure functions are safe to cache.

::: example A standard-atmosphere lookup in a dispersion sweep
A **dispersion sweep** runs the same flight many times with small random changes. Every case asks for the air density on the same altitude grid, and the arithmetic is identical each time.

```python
# cache.py
import functools
import math

EVALUATIONS = {"uncached": 0, "cached": 0}

LAYERS = [
    (0.0, 288.15, -0.0065),
    (11000.0, 216.65, 0.0),
    (20000.0, 216.65, 0.001),
    (32000.0, 228.65, 0.0028),
]
R = 287.052874
G0 = 9.80665
P0 = 101325.0


def _density(h_m):
    """Density from the 1976 standard atmosphere, integrated layer by layer."""
    p, t = P0, 288.15
    for i, (h_base, t_base, lapse) in enumerate(LAYERS):
        h_top = LAYERS[i + 1][0] if i + 1 < len(LAYERS) else 47000.0
        if h_m <= h_base:
            break
        dh = min(h_m, h_top) - h_base
        t_next = t_base + lapse * dh
        if lapse == 0.0:
            p *= math.exp(-G0 * dh / (R * t_base))
        else:
            p *= (t_next / t_base) ** (-G0 / (lapse * R))
        t = t_next
    return p / (R * t)


def density(h_m):
    EVALUATIONS["uncached"] += 1
    return _density(h_m)


@functools.lru_cache(maxsize=None)
def density_cached(h_m):
    EVALUATIONS["cached"] += 1
    return _density(h_m)


grid = [1000.0 * k for k in range(41)]


if __name__ == "__main__":
    # A dispersion sweep re-evaluates the same altitude grid for every case.
    for _case in range(500):
        for h in grid:
            density(h)
            density_cached(h)

    print("uncached evaluations:", EVALUATIONS["uncached"])
    print("cached evaluations:  ", EVALUATIONS["cached"])
    print(density_cached.cache_info())
    print("rho(0 m)     =", round(density(0.0), 6))
    print("rho(11000 m) =", round(density(11000.0), 6))
    print("rho(20000 m) =", round(density(20000.0), 6))
```

```bash
python3 cache.py
# uncached evaluations: 20500
# cached evaluations:   41
# CacheInfo(hits=20459, misses=41, maxsize=None, currsize=41)
# rho(0 m)     = 1.225
# rho(11000 m) = 0.363918
# rho(20000 m) = 0.088035
```

The `_density` function follows the **[[1976 standard atmosphere|standard-atmosphere]]**: the air is split into layers, each with its own temperature trend, and the pressure is carried up one layer at a time.

Count the calls. The grid runs from 0 to 40 km in 1 km steps, so it has 41 points. 500 cases × 41 points = 20,500 calls to each function.

- The uncached function did the full layer calculation all 20,500 times.
- The cached one did it 41 times, once per distinct altitude. The other 20,500 − 41 = 20,459 calls were answered from the dictionary.

`cache_info()` reports exactly that: 20,459 **hits** (found in the cache), 41 **misses** (had to compute), and 41 entries stored. It is the first thing to look at when a cache seems not to help. A hit count near zero means the arguments are not repeating — often because a float differs in its last few bits.

The density values are the standard atmosphere's own: 1.225 kg/m³ at sea level, 0.363918 at 11 km where the **tropopause** (the top of the weather layer) begins, and 0.088035 at 20 km. They match the uncached function, which is your check that caching changed nothing about the answer.

The wall-clock effect, timed with Python's `timeit` module:

```bash
python3 -m timeit -s "import cache" "for h in cache.grid: cache.density(h)"
python3 -m timeit -s "import cache" "for h in cache.grid: cache.density_cached(h)"
```

On the machine used to write this, one pass over the grid took about 43 µs uncached and about 3.3 µs cached — roughly 13 times faster. Your numbers will differ. The speed-up is roughly the function's cost divided by the cost of a dictionary lookup. It is large for an expensive function and can be *less than one* for a cheap one: caching `lambda x: x + 1` makes it slower, about 45 ns per call against 38 ns here.
:::

::: warning
Three ways `lru_cache` goes wrong, all in one script:

```python
# cache_traps.py
import functools

CALLS = {"n": 0}


@functools.lru_cache(maxsize=None)
def mean_of(samples):
    CALLS["n"] += 1
    return sum(samples) / len(samples)


print(mean_of((9.81, 9.79, 9.80)))
print(mean_of((9.81, 9.79, 9.80)), CALLS["n"])

try:
    mean_of([9.81, 9.79, 9.80])
except TypeError as exc:
    print("TypeError:", exc)


@functools.lru_cache(maxsize=None)
def limits_for(stage):
    """Impure in a way the cache makes permanent: it returns a fresh mutable object."""
    return {"q_max_kpa": 35.0, "alpha_max_deg": 5.0}


a = limits_for("upper")
a["q_max_kpa"] = 1.0
print(limits_for("upper"))
```

```bash
python3 cache_traps.py
# 9.8
# 9.8 1
# TypeError: unhashable type: 'list'
# {'q_max_kpa': 1.0, 'alpha_max_deg': 5.0}
```

First, **unhashable arguments**. The mean of 9.81, 9.79 and 9.80 is 29.40 / 3 = 9.8, and the second call was a cache hit — the counter stayed at 1. But the same numbers in a *list* raise `TypeError: unhashable type: 'list'`, because the arguments are the cache key. NumPy arrays are unhashable too, which rules out caching most array functions directly.

Second, **shared mutable results**. `limits_for("upper")` returns the *same dict object* every time. The first caller changed it, and the next caller got the changed version: `q_max_kpa` is now 1.0 for the rest of the program. Cache functions that return values that cannot be changed, or return a copy.

Third, **impurity**. A cached function that reads a file, a clock, a global variable or a random number returns its first answer forever. And `maxsize=None` means the cache never throws anything out, so a function called with a million different arguments keeps a million entries. Use a finite `maxsize` when the arguments can be anything — that is where the **[["LRU"|lru-meaning]]** in the name comes in — and call `cache_clear()` when the underlying data changes.
:::

## Stacking, and decorating methods

You can put several decorators on one function. They apply **bottom-up**: the one nearest the `def` wraps first.

```python
@timed
@bounded(-0.35, 0.35)
def gimbal_command(error_rad, gain):
    ...
```

This means `gimbal_command = timed(bounded(-0.35, 0.35)(gimbal_command))`. The bounds check sits *inside* the timing, so a rejected command is still timed. Swap the two lines and the timing sits inside the check. Now a rejected command raises before the timer records it. Neither order is wrong. The point is to choose, not stumble into one.

On methods there is one rule worth knowing. `self` is an ordinary first argument, so a `*args` wrapper handles methods without any change. But `lru_cache` on a method includes `self` in the cache key. The cache then holds a reference to every object it has ever seen, so none of them can be freed from memory while the cache exists — a **memory leak** that looks like nothing at all. Cache a module-level function instead, or use `functools.cached_property` for a value computed once per object and stored on that object.

## Check yourself

::: check
Expand `@timed` above `def q_dyn(rho, v)` into the assignment it stands for, and say when that assignment happens.
:::

::: answer
`q_dyn = timed(q_dyn)`. It runs right after the `def` statement finishes — when the module is imported, or when the enclosing block runs — not when `q_dyn` is first called.

Two things follow. Any work the decorator does outside its wrapper — adding the function to a table, checking its parameters, setting up a cache — happens once, at import. So a decorator that does something slow makes a module slow to import. And from then on the name `q_dyn` means whatever the decorator returned. If the decorator forgets its `return wrapper`, it returns `None`, and every call raises `TypeError: 'NoneType' object is not callable`.
:::

::: check
After a `@retry` decorator is added to a test suite, every test that uses a pytest fixture fails with `TypeError: ... missing 1 required positional argument`. What is the likeliest cause, and what is the one-line fix?
:::

::: answer
The decorator's wrapper has no `@functools.wraps`. pytest reads each test's parameters to decide which fixtures to pass. Looking at the bare wrapper, it sees only `(*args, **kwargs)`, decides the test needs nothing, and calls it with no arguments. The real test function then complains that its fixture argument is missing. The same loss of identity also puts `wrapper` in place of the test's name, docstring and marks, which confuses reports and any selection by name or mark.

The fix is one line inside the decorator: `@functools.wraps(fn)` on the wrapper. It restores `__name__`, `__doc__`, `__module__` and `__qualname__`, copies the function's attributes (including marks), and sets `__wrapped__`, so a framework that inspects the signature sees the real parameters.
:::

::: check
Why must a decorator factory have three levels of function, and what is the symptom of writing only two?
:::

::: answer
Three things arrive at three different times, and each needs a scope to be captured in. First the decorator's own arguments (`low`, `high`). Then the function being decorated (`fn`). Then the arguments of each call (`*args`). `bounded(low, high)` returns `decorator`, which remembers the limits. `decorator(fn)` returns `wrapper`, which remembers both the limits and the function. `wrapper(*args)` does the work.

With only two levels you have written a plain decorator, `def bounded(fn)`, with the limits stuck inside it. It works as `@bounded`. Written as `@bounded(-0.35, 0.35)`, Python calls `bounded` with the two numbers where it expected one function, and fails at once, while the module is loading: `TypeError: bounded() takes 1 positional argument but 2 were given`.

The opposite slip — the correct three-level factory used without brackets, `@bounded` — also fails at once: the function is passed as `low`, nothing is passed as `high`, and you get `TypeError: bounded() missing 1 required positional argument: 'high'`.
:::

::: check
You cache a function `trajectory(mass, isp, thrust)` with `lru_cache`. `cache_info()` shows almost no hits, although the sweep repeats the same nominal case hundreds of times. What is the likely cause?
:::

::: answer
The arguments are floats that are equal in intent but not in their exact bits. If `mass` comes from `26000.0 * dispersion_factor`, with a factor that is only approximately 1.0, or from text parsed with varying precision, each call presents a key never seen before. The cache stores a new entry every time. Under `maxsize=None` it grows without limit while delivering no hits.

Two remedies. Round the key on purpose, for example `round(mass, 6)`, and write down the tolerance that implies. Or cache at a level where the arguments really are discrete: a case number, a grid index, an altitude from a fixed table, as the atmosphere example did.

Either way, `cache_info()` is the test: near-zero hits with a steadily rising `currsize` is this failure.
:::

::: check
Give two reasons not to put `@lru_cache` on a method of a class.
:::

::: answer
First, the cache key includes `self`. Every object ever passed to the method is held by the cache, which lives on the class's function, so none of those objects can be freed while the cache exists. In a Monte Carlo run that builds a new vehicle object per case, that is every vehicle, and the program's memory grows until it is killed.

Second, one cache is shared by all the objects, rather than one per object. Ordinary objects hash by identity, so two vehicles with identical fields still never share a result. You pay for a shared cache and get none of its benefit.

If the value depends only on the object's fixed fields, use `functools.cached_property`: it computes once per object and stores the result on that object, so it disappears with the object. If the value depends only on the arguments, move the function out of the class.
:::

## Summary

| Item | Statement |
| --- | --- |
| `@d` above `def f` | Exactly `f = d(f)`, evaluated when the `def` runs, not when `f` is called |
| Decorator | A function taking a function and returning a function; the wrapper is a closure |
| `@functools.wraps(fn)` | Copies `__name__`, `__doc__`, `__module__`, `__qualname__`, `__annotations__`, `__dict__`; sets `__wrapped__` |
| Without `wraps` | `help`, tracebacks, pytest fixtures and marks, and `inspect.signature` all see `wrapper` |
| Decorator factory | Three levels: arguments, then function, then call arguments |
| `except (A, B) as e` | Catches either type; a stored exception can be raised again later |
| Stacking | Bottom-up: the decorator nearest the `def` wraps first |
| `functools.lru_cache` | Memoizes by arguments; arguments must be hashable; only for pure functions |
| `cache_info()` | `hits`, `misses`, `currsize` — the diagnostic for a cache that is not helping |
| Cache hazards | Unhashable arguments, shared mutable results, impure functions, unbounded growth |
| On methods | Keys on `self` and keeps every instance alive; prefer `functools.cached_property` |
| Measured here | 20,500 calls became 41 evaluations; about 43 µs per grid pass against about 3.3 µs |

Next lesson: writing down what the arguments are supposed to be. Annotations are the notation, mypy is the checker, and the point is to catch the interface mistake before a six-hour Monte Carlo run, not in hour five.

::: context first-class Functions are values too
In Python a function is an object like a number or a list. The name `q_dyn` is a label stuck on that object, and you can stick other labels on it, put it in a list, or pass it to another function.

Programmers call this having **first-class functions**: functions get every right an ordinary value has. That is all a decorator needs. `timed(q_dyn)` passes the function object in, and `q_dyn = ...` moves the label to whatever comes back.
:::

::: context perf-counter A stopwatch, not a wall clock
`time.perf_counter()` returns a number of seconds from some arbitrary starting point. The number on its own means nothing. Only the difference between two readings is useful — exactly like a stopwatch.

It is the right clock for timing code because it has the finest resolution available and never jumps backwards. `time.time()`, the wall clock, can jump when the computer adjusts its clock over the network, which would give you a negative duration.
:::

::: context wrapper-closure What the name points at after decorating
After `q_dyn = timed(q_dyn)`, the name no longer points at your function. It points at `wrapper`, and `wrapper` keeps a hidden reference, called a **cell**, to the original function object.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="30" y="44" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">q_dyn</text>
  <line x1="56" y1="40" x2="92" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="98,40 90,35 90,45" fill="#1f2a44"/>
  <rect x="100" y="16" width="110" height="48" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="155" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">wrapper</text>
  <text x="155" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">cell: fn</text>
  <line x1="210" y1="40" x2="236" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="242,40 234,35 234,45" fill="#1f2a44"/>
  <rect x="244" y="16" width="108" height="48" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="298" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">original</text>
  <text x="298" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">q_dyn(rho, v)</text>
  <text x="155" y="90" font-size="11" fill="#b4232c" text-anchor="middle">no wraps: __name__ is "wrapper"</text>
  <text x="155" y="108" font-size="11" fill="#1d6fd1" text-anchor="middle">with wraps: __name__ is "q_dyn",</text>
  <text x="155" y="124" font-size="11" fill="#1d6fd1" text-anchor="middle">and __wrapped__ points right</text>
  <path d="M238 120 Q292 118 298 64" stroke="#1d6fd1" stroke-width="1.5" fill="none" stroke-dasharray="4 3"/>
</svg>
```

Decorating `density` and `pressure` with the same `timed` makes two separate wrappers, each with its own cell pointing at its own function.
:::

::: context pytest-fixture What a fixture is
A **fixture** in pytest is a ready-made thing a test needs: a temporary folder, a database connection, a loaded configuration. You ask for one by naming it as a parameter. A test written `def test_save(tmp_path):` gets a fresh empty folder passed in as `tmp_path`, and pytest deletes it afterwards.

This only works because pytest reads the parameter names before calling the test. Hide them behind `(*args, **kwargs)` and pytest has nothing to go on.
:::

::: context qualname The full name inside a module
`__name__` is a function's short name, such as `rates`. `__qualname__`, the **qualified name**, also says where inside the module it lives, such as `Imu.rates` for a method of the `Imu` class, or `timed.<locals>.wrapper` for a function defined inside `timed`.

That second example is exactly what you see in a traceback through an undecorated wrapper — a clue that someone forgot `wraps`.
:::

::: context gimbal Steering by swiveling the engine
A rocket steers by tilting its engine a few degrees, so the thrust pushes slightly sideways and turns the vehicle. The engine hangs on a **gimbal**, a pivot that lets it swing, and hydraulic or electric **actuators** push it to the commanded angle.

The swing is limited by a mechanical **hard stop**. A command beyond it cannot be carried out, so flight software clamps or rejects it. The ±0.35 rad in the example is about ±20°, chosen for illustration; real engines swing less — often only a few degrees.
:::

::: context factory-layers Three boxes, three moments
Each level of a decorator factory is created at a different moment and remembers what arrived at that moment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="160" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="22" y="30" font-size="12" fill="#1f2a44" font-weight="700">bounded(low, high)</text>
  <text x="340" y="30" font-size="11" fill="#6c7a93" text-anchor="end">when @ line runs</text>
  <rect x="30" y="42" width="304" height="116" rx="8" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="42" y="62" font-size="12" fill="#1f2a44" font-weight="700">decorator(fn)</text>
  <text x="324" y="62" font-size="11" fill="#1f2a44" text-anchor="end">right after the def</text>
  <rect x="50" y="76" width="266" height="70" rx="8" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="62" y="96" font-size="12" fill="#1f2a44" font-weight="700">wrapper(*args, **kwargs)</text>
  <text x="304" y="96" font-size="11" fill="#1f2a44" text-anchor="end">every call</text>
  <text x="62" y="124" font-size="11" fill="#1f2a44">sees low, high and fn from outside;</text>
  <text x="62" y="139" font-size="11" fill="#1f2a44">gets the call's own arguments</text>
</svg>
```

A plain decorator is the two inner boxes only. The outer box is what lets you pass settings in.
:::

::: context memoize-word Where "memoize" comes from
The word comes from "memo", a note to yourself. The British researcher Donald Michie coined "memo functions" in a 1968 paper in *Nature*, for functions that remember their earlier results and look them up instead of recomputing.

Programmers still spell it "memoize", without an r. It is not a typo for "memorize", though it means nearly the same thing.
:::

::: context hashable Why lists cannot be keys
A dictionary finds a key fast by turning it into a number, its **hash**, and jumping straight to that slot. For this to work, the key must never change while it is stored — otherwise its hash would change and the dictionary would look in the wrong slot.

So Python only lets unchangeable (immutable) types be hashed: numbers, strings, tuples of those. A list can be changed at any time, so `hash([1, 2])` raises `TypeError: unhashable type: 'list'`. Convert with `tuple(...)` when you need a list as a key.
:::

::: context standard-atmosphere A shared model of the air
The **US Standard Atmosphere, 1976** is an agreed table of temperature, pressure and density against altitude. It is not the weather on any real day. It is a common reference, so two teams comparing results use the same air.

In the lowest layer the temperature falls by 6.5 K per kilometer, from 288.15 K (15 °C) at sea level to 216.65 K at 11 km. From 11 km to 20 km it stays constant, which is why that layer uses the exponential formula in the code. Above 20 km it slowly warms again.
:::

::: context lru-meaning Least recently used goes first
**LRU** stands for "least recently used". When a cache with a size limit is full and a new answer arrives, it throws out the entry that has gone longest without being asked for. Recently used entries are likely to be wanted again soon, so they stay.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="11" fill="#6c7a93">maxsize=3, oldest use on the left</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="32" width="60" height="28" rx="4" fill="#f2b880" stroke="#b4232c"/><text x="40" y="51">h=0</text>
    <rect x="76" y="32" width="60" height="28" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/><text x="106" y="51">h=1</text>
    <rect x="142" y="32" width="60" height="28" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/><text x="172" y="51">h=2</text>
    <text x="282" y="51">new: h=3</text>
  </g>
  <line x1="240" y1="46" x2="212" y2="46" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="206,46 214,41 214,51" fill="#1f2a44"/>
  <text x="40" y="78" font-size="11" fill="#b4232c" text-anchor="middle">thrown out</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="94" width="60" height="28" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/><text x="40" y="113">h=1</text>
    <rect x="76" y="94" width="60" height="28" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/><text x="106" y="113">h=2</text>
    <rect x="142" y="94" width="60" height="28" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/><text x="172" y="113">h=3</text>
  </g>
  <text x="282" y="113" font-size="11" fill="#6c7a93" text-anchor="middle">still three entries</text>
</svg>
```

With `maxsize=None` nothing is ever thrown out, and the "LRU" part does nothing. Since Python 3.9, `functools.cache` is a shorter name for exactly that.
:::
