---
id: l09-decorators
title: Decorators, wraps and caching
minutes: 15
covers:
  - Decorators, functools.wraps, functools.lru_cache
---

You have been using decorators since lesson 4: `@property`, `@classmethod`, `@staticmethod`, `@dataclass`, `@contextmanager`. Each of them is the same mechanism, and the mechanism is smaller than it looks.

A decorator is a function that takes a function and returns a function. The `@` line is shorthand for one assignment: writing `@timed` above `def q_dyn(...)` means exactly `q_dyn = timed(q_dyn)`, executed the moment the `def` finishes. There is no new scope, no new object model, nothing to learn beyond the fact that functions are ordinary values you can pass around — which the first module already established when it taught `sorted(key=...)`.

What the syntax buys is that the wrapping is announced at the definition rather than hidden in an assignment forty lines below, so a reader of `q_dyn` sees immediately that calls to it are timed, validated, cached or retried. The two things to get right are preserving the wrapped function's identity, which needs `functools.wraps`, and knowing when a cache is a speedup and when it is a correctness hazard. Both are measured below.

## `@` is an assignment

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

Dynamic pressure at sea level and 250 m/s is $q = \tfrac12 \rho v^2 = 0.5 \times 1.225 \times 250^2 = 38281.25\,\mathrm{Pa}$, about 38.3 kPa, and the wrapper recorded the call. `timed` is a *closure*, as the first module's scope lesson used the word: `wrapper` refers to `fn` from the enclosing call, so each decorated function gets a wrapper that remembers which function it wraps.

Now read the last two lines. The name `q_dyn` is now bound to `wrapper`, so `q_dyn.__name__` is `"wrapper"` and the docstring is gone. That is not cosmetic:

- `help(q_dyn)` shows the wrapper's signature and no documentation.
- A traceback through it says `wrapper`, and if six functions are decorated, six frames say `wrapper`.
- pytest collects tests by name; a decorated test function whose `__name__` is `wrapper` is reported under the wrong name, and tooling that filters by name stops seeing it.
- `inspect.signature` reports `(*args, **kwargs)` instead of the real parameters, which breaks anything that introspects — argument-based dispatch, automatic command-line generation, documentation builders.

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

One line — `@functools.wraps(fn)` on the wrapper — and `__name__`, `__doc__`, `__module__` and `__qualname__` are copied from the wrapped function to the wrapper. It also sets `__wrapped__` to the original, which is how `inspect.signature` recovers `(rho, v)` instead of `(*args, **kwargs)`.

This is not optional. There is no situation in which you want a decorator that destroys its target's identity, and a reviewer will ask about a decorator without `wraps` before they read anything else in it.

::: key
`@decorator` above `def f` means `f = decorator(f)`. The wrapper must carry `@functools.wraps(fn)`, which copies `__name__`, `__doc__`, `__module__` and `__qualname__`, and sets `__wrapped__` so that `inspect.signature` still reports the real parameters. Without it, `help`, tracebacks, pytest collection and every introspection-based tool see the wrapper instead of your function.
:::

::: example A decorator that takes arguments
`@bounded(-0.35, 0.35)` is a *decorator factory*: `bounded(-0.35, 0.35)` is called first and returns the decorator, which is then applied. That is three nested functions — arguments, function, call — and the nesting is the whole trick.

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

A gain of 4 on an attitude error of 0.02 rad commands 0.08 rad of gimbal, well inside the ±0.35 rad hard stop. An error of 0.2 rad commands 0.8 rad, which the physical actuator cannot do, and the decorator raises with the value and the limits in the message.

What the decorator bought over an `if` at the top of the caller: the check is attached to the function, so it applies at every call site including the ones written next year; the limits appear next to the definition where a reviewer checking them against the actuator specification will look; and `functools.wraps` keeps `gimbal_command` identifiable, as the second line of output confirms.

A note on the three levels, because everyone writes this wrong once. `bounded` takes the *arguments*. `decorator` takes the *function*. `wrapper` takes the *call arguments*. If you find yourself with a decorator that works as `@bounded` but not as `@bounded(-0.35, 0.35)`, you have two levels where you need three.
:::

## `functools.lru_cache`: memoise a pure function

A cache stores the result of a call keyed by its arguments, and returns the stored value when the same arguments come back. `functools.lru_cache` does that in one line. The arguments must be hashable, because they are the dictionary key.

::: example A standard-atmosphere lookup in a dispersion sweep
Every case in a sweep evaluates the atmosphere on the same altitude grid. The arithmetic is identical each time.

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

500 cases over a 41-point grid is 20,500 calls. The uncached function ran the layer integration 20,500 times; the cached one ran it 41 times, once per distinct altitude, and answered the other 20,459 from the dictionary. `cache_info()` reports exactly that, and is the first thing to look at when a cache seems not to be helping — a hit count near zero means the arguments are not repeating, often because a float differs in its last bits.

The density values are the standard atmosphere's: 1.225 kg/m³ at sea level, 0.363918 at the tropopause, 0.088035 at 20 km, which is the check that the caching changed nothing about the answer.

The wall-clock effect, timed on this machine:

```bash
python3 -m timeit -s "import cache" "for h in cache.grid: cache.density(h)"
python3 -m timeit -s "import cache" "for h in cache.grid: cache.density_cached(h)"
```

about 32 µs per grid pass uncached against about 2.5 µs cached, a factor near 13. The factor is whatever your function costs divided by a dictionary lookup, so it is large for an expensive function and can be *negative* for a cheap one — caching `lambda x: x + 1` is slower than calling it.
:::

::: warning
Three ways `lru_cache` goes wrong, all of them in one script:

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

First, **unhashable arguments**. A tuple of samples works; the same data in a list raises `TypeError: unhashable type: 'list'`, because the arguments are the cache key. NumPy arrays are unhashable too, which rules out caching most array functions directly.

Second, **shared mutable results**. `limits_for("upper")` returns the *same dict object* every time. The caller mutated it, and the next caller got the mutated version — `q_max_kpa` is now 1.0 for the rest of the process. Cache functions that return immutable values, or return a copy.

Third, **impurity**. A cached function that reads a file, a clock, a global or a random number returns the first answer forever. `maxsize=None` also means the cache never evicts, so a function called with a million distinct arguments keeps a million entries; use a finite `maxsize` when the argument space is open, and `cache_clear()` when the underlying data changes.
:::

## Stacking, and decorating methods

Decorators apply bottom-up: the one nearest the `def` wraps first.

```python
@timed
@bounded(-0.35, 0.35)
def gimbal_command(error_rad, gain):
    ...
```

means `gimbal_command = timed(bounded(-0.35, 0.35)(gimbal_command))`, so the bounds check is inside the timing and a rejected command is still timed. Reverse them and the timing happens inside, so a rejected command is not recorded. Neither is wrong; the order has to be chosen rather than stumbled into.

On methods there is one rule worth knowing: `self` is an ordinary positional argument, so a `*args`-based wrapper handles methods without change. But `lru_cache` on a method keys the cache on `self` as well, which keeps every instance alive for as long as the class exists — a memory leak that looks like nothing at all. Cache a module-level function, or use `functools.cached_property` for a per-instance value computed once.

## Check yourself

::: check
Expand `@timed` above `def q_dyn(rho, v)` into the assignment it stands for, and say when that assignment happens.
:::

::: answer
`q_dyn = timed(q_dyn)`, executed immediately after the `def` statement finishes, at the time the module is imported or the enclosing block runs — not at the time `q_dyn` is first called.

Two consequences follow. Any work the decorator does outside its wrapper — registering the function in a table, validating its signature, allocating a cache — happens once, at import, which is why a decorator that does something slow makes a module slow to import. And the name `q_dyn` from then on refers to whatever the decorator returned, so if the decorator returns `None` by forgetting its `return wrapper`, every call raises `TypeError: 'NoneType' object is not callable`.
:::

::: check
pytest reports that a suite of twelve tests collected four items after a `@retry` decorator was added. What is the likeliest cause, and what is the one-line fix?
:::

::: answer
The decorator's wrapper has no `@functools.wraps`, so every decorated test function is now named `wrapper`. Collection and reporting use `__name__`, and names that are no longer distinct collapse in the report; anything filtering by name or by the `test_` prefix stops matching as well.

The fix is one line inside the decorator, `@functools.wraps(fn)` on the wrapper function. It restores `__name__`, `__doc__`, `__module__` and `__qualname__`, and sets `__wrapped__` so that a framework inspecting the signature — for fixtures, or for parametrisation — sees the real parameters instead of `(*args, **kwargs)`.
:::

::: check
Why must a decorator factory have three levels of function, and what is the symptom of writing only two?
:::

::: answer
Three things arrive at three different times and each needs a scope to be captured in: the decorator's own arguments (`low`, `high`), then the function being decorated (`fn`), then the arguments of each call (`*args`). `bounded(low, high)` returns `decorator`, which closes over the limits; `decorator(fn)` returns `wrapper`, which closes over both the limits and the function; `wrapper(*args)` does the work.

With only two levels you have written a plain decorator. Used as `@bounded` with no parentheses it appears to work, because the function is passed where the arguments were expected — and then the first call fails strangely, typically `TypeError: 'function' object is not iterable` or a comparison against a function object. Used as `@bounded(-0.35, 0.35)` it fails immediately, because the result of calling it is not a decorator.
:::

::: check
You cache a function `trajectory(mass, isp, thrust)` with `lru_cache`, and `cache_info()` shows almost no hits although the sweep repeats the same nominal case hundreds of times. What is the likely cause?
:::

::: answer
The arguments are floats that are equal in intent and not in bits. If `mass` comes from `26000.0 * dispersion_factor` with a factor that is 1.0 only approximately, or from parsing text with varying precision, each call presents a key that has never been seen, and the cache stores a new entry every time — growing without limit under `maxsize=None` while providing no hits.

Two remedies. Quantise the key deliberately, for example `round(mass, 6)`, and document the tolerance that implies. Or cache at a level where the arguments are genuinely discrete — a case identifier, a grid index, an altitude from a fixed table, as the atmosphere example did.

Whichever you choose, `cache_info()` is the diagnostic: near-zero hits with a rising `currsize` is this failure and no other.
:::

::: check
Give two reasons not to put `@lru_cache` on a method of a class.
:::

::: answer
First, the cache key includes `self`. Every instance ever passed to the method is held by a strong reference in a cache that lives on the class, so no instance is ever garbage-collected while the class exists. In a Monte Carlo that constructs a vehicle per case, that is every vehicle, and the process grows until it is killed.

Second, the cache is shared across instances rather than being per-instance, which means the hit rate is diluted, and an argument-equality question now silently depends on how `self` hashes — by identity for an ordinary class, so two equivalent vehicles never share a result anyway.

If the value depends only on the instance's fixed fields, `functools.cached_property` is the tool: it computes once per instance and stores the result on the instance, so it dies with the object. If the value depends only on the arguments, move the function out of the class.
:::

## Summary

| Item | Statement |
| --- | --- |
| `@d` above `def f` | Exactly `f = d(f)`, evaluated when the `def` executes, not when `f` is called |
| Decorator | A function taking a function and returning a function; the wrapper is a closure |
| `@functools.wraps(fn)` | Copies `__name__`, `__doc__`, `__module__`, `__qualname__`; sets `__wrapped__` |
| Without `wraps` | `help`, tracebacks, pytest collection and `inspect.signature` all see `wrapper` |
| Decorator factory | Three levels: arguments, then function, then call arguments |
| Stacking | Bottom-up: the decorator nearest the `def` wraps first |
| `functools.lru_cache` | Memoises by arguments; arguments must be hashable |
| `cache_info()` | `hits`, `misses`, `currsize` — the diagnostic for a cache that is not helping |
| Cache hazards | Unhashable arguments, shared mutable results, impure functions, unbounded growth |
| On methods | Keys on `self` and keeps every instance alive; prefer `functools.cached_property` |
| Measured here | 20,500 calls became 41 evaluations; about 32 µs per grid pass against about 2.5 µs |

The next lesson writes down what the arguments are supposed to be. Annotations are the notation, `mypy` is the checker, and the point is catching the interface mistake before the six-hour Monte Carlo rather than in hour five.
