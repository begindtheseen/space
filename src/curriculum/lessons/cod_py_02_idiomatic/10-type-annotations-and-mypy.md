---
id: l10-type-annotations-and-mypy
title: Type annotations and mypy
minutes: 17
covers:
  - Type annotations, Optional, Sequence, npt.NDArray, and mypy
---

A six-hour Monte Carlo fails in hour five with `TypeError: '>' not supported between instances of 'float' and 'str'`. The cause is a limit read from a configuration file and never converted, passed to a comparison that only the dispersed tail of the distribution reaches. No test covered that branch, because no test runs six hours.

Type annotations are how you find that in a second instead. You write down what each parameter and each return value is supposed to be, and a checker — `mypy` here — reads every line of the module and every line of its callers and reports the mismatches, without running anything. It covers the branches your tests do not, which is most of them, and it says nothing whatever about whether your algorithm is right.

Annotations are also documentation that cannot drift, because a checker is comparing it against the code. That alone is worth the keystrokes on a module other people import. This lesson is the notation, the three pieces of it that matter most for numerical work — `Optional`, `Sequence`, and NumPy's array types — how to run mypy, and an honest account of what it does not catch.

## The notation, and the fact that nothing enforces it

An annotation goes after a colon on a parameter, after an arrow for the return, and after a colon on a variable:

```python
# not_enforced.py
def scale(value: float, factor: float) -> float:
    """Scale a measurement. The annotations are documentation, not a check."""
    return value * factor


print(scale(9.81, 2.0))
print(scale("imu", 3))
print(scale.__annotations__)
```

```bash
python3 not_enforced.py
# 19.62
# imuimuimu
# {'value': <class 'float'>, 'factor': <class 'float'>, 'return': <class 'float'>}
```

`scale("imu", 3)` returned `"imuimuimu"`. Python did not look at the annotations at all: it stored them in `__annotations__` and ran the multiplication that `str` and `int` happen to support. That is the rule — **annotations are metadata, never enforced by the interpreter** — and it is why a type checker is a separate tool you have to run.

```bash
python3 -m mypy not_enforced.py
# not_enforced.py:8: error: Argument 1 to "scale" has incompatible type "str"; expected "float"  [arg-type]
# Found 1 error in 1 file (checked 1 source file)
```

One error, not two. `3` is an `int` and an `int` is acceptable wherever a `float` is wanted — the numeric tower is built into the type system, so you annotate `float` and get `int` for free. Do not write `int | float`.

Containers are annotated with their element types, using the built-in names since Python 3.9: `list[float]`, `dict[str, float]`, `set[int]`, `tuple[float, float, float]` for a fixed-length tuple, `tuple[float, ...]` for a variable-length one.

::: key
Annotations are read by tools, not by the interpreter. `mypy` checks them across a whole program without executing it, so it covers branches your tests never reach. It proves nothing about numerical correctness — only about interfaces.
:::

## Optional is the one that pays for itself

A function that sometimes has no answer returns `float | None` — written `Optional[float]` in older code, and the same thing. The value of saying so is that the checker then forces every caller to deal with the `None`:

```python
# analysis.py
"""A small, fully annotated telemetry module."""
from collections.abc import Sequence

import numpy as np
import numpy.typing as npt

Array = npt.NDArray[np.float64]


def peak(samples: Sequence[float]) -> float | None:
    """Largest sample, or None for an empty record."""
    if not samples:
        return None
    return max(samples)


def exceedances(samples: Sequence[float], limit: float) -> list[int]:
    """Indices of the samples above `limit`."""
    return [i for i, s in enumerate(samples) if s > limit]


def rss(v: Array) -> Array:
    """Root-sum-square across the last axis of an (N, 3) array."""
    return np.sqrt((v * v).sum(axis=-1))


def margin_table(peaks: dict[str, float], limits: dict[str, float]) -> dict[str, float]:
    """Limit minus peak for every channel present in both tables."""
    return {k: limits[k] - peaks[k] for k in peaks.keys() & limits.keys()}


if __name__ == "__main__":
    az = [9.81, 9.79, 12.4, 9.80, 14.2]
    print(peak(az), peak([]))
    print(exceedances(az, 10.0))
    print(np.round(rss(np.array([[3.0, 4.0, 0.0], [1.0, 2.0, 2.0]])), 4))
    print(margin_table({"az": 14.2}, {"az": 15.0, "ax": 4.0}))
```

```bash
python3 analysis.py
python3 -m mypy analysis.py
# 14.2 None
# [2, 4]
# [5. 3.]
# {'az': 0.8000000000000007}
# Success: no issues found in 1 source file
```

The module is clean. Now a caller that is not:

```python
# caller.py
from analysis import exceedances, peak

az: list[float] = [9.81, 9.79, 12.4]

headroom = 15.0 - peak(az)
print(headroom)

print(exceedances(az, "10.0"))
print(exceedances((9.81, 12.4), 10.0))
```

```bash
python3 -m mypy caller.py
# caller.py:6: error: Unsupported operand types for - ("float" and "None")  [operator]
# caller.py:6: note: Right operand is of type "float | None"
# caller.py:9: error: Argument 2 to "exceedances" has incompatible type "str"; expected "float"  [arg-type]
# Found 2 errors in 1 file (checked 1 source file)
```

The first error is the Monte Carlo failure from the opening, found without running anything: `peak` can return `None` and the subtraction does not handle it. The note even names the union. The fix is to handle the case, and mypy then accepts the code because it narrows the type inside the branch:

```python
p = peak(az)
headroom = None if p is None else 15.0 - p
```

The second error is the configuration-file string. The third call, passing a tuple where a `Sequence[float]` is expected, produced no error at all — which is the next section.

::: example Sequence in, list out
Annotate a parameter `list[float]` and you have required a list. A tuple, a `deque`, a NumPy-free row from a CSV reader — all rejected, although every one of them would work:

```python
# sequence_vs_list.py
from collections.abc import Sequence


def mean_list(samples: list[float]) -> float:
    return sum(samples) / len(samples)


def mean_seq(samples: Sequence[float]) -> float:
    return sum(samples) / len(samples)


record = (9.81, 9.79, 12.4)
print(mean_seq(record))
print(mean_list(record))
```

```bash
python3 -m mypy sequence_vs_list.py
# sequence_vs_list.py:15: error: Argument 1 to "mean_list" has incompatible type "tuple[float, float, float]"; expected "list[float]"  [arg-type]
# Found 1 error in 1 file (checked 1 source file)
```

```bash
python3 sequence_vs_list.py
# 10.666666666666666
# 10.666666666666666
```

Both calls work at runtime and give the same number. mypy rejected only the one whose annotation was needlessly narrow.

The guidance, which is worth memorising because it applies to every function you annotate: **accept the most general type you can use, return the most specific type you have.** For a parameter you only read, index and take the length of, that is `Sequence[float]` from `collections.abc`; if you only iterate, it is `Iterable[float]`; if you only need membership and length, `Collection[float]`. For a return value, say `list[float]`, because the caller should be told exactly what they are getting and be free to sort it in place.

The same rule gives `Mapping[str, float]` for a dict parameter you only look things up in, and `dict[str, float]` for one you return. Requiring a `dict` when you only read it rules out a `defaultdict` wrapper, a read-only mapping proxy, and every test double.
:::

::: example NumPy arrays, and being honest about the limits
NumPy ships its own typing module. `npt.NDArray[np.float64]` means "a NumPy array whose dtype is float64", and the idiom is to alias it once per module:

```python
# nd_caught.py
import numpy as np
import numpy.typing as npt

Array = npt.NDArray[np.float64]


def rss(v: Array) -> Array:
    return np.sqrt((v * v).sum(axis=-1))


print(rss([[3.0, 4.0, 0.0]]))
total: float = rss(np.array([[3.0, 4.0, 0.0]]))
```

```bash
python3 -m mypy nd_caught.py
# nd_caught.py:12: error: Argument 1 to "rss" has incompatible type "list[list[float]]"; expected "ndarray[tuple[Any, ...], dtype[float64]]"  [arg-type]
# nd_caught.py:13: error: Incompatible types in assignment (expression has type "ndarray[tuple[Any, ...], dtype[float64]]", variable has type "float")  [assignment]
# Found 2 errors in 1 file (checked 1 source file)
```

Those are the two real wins, and they are the two mistakes people actually make with arrays: handing a nested list to a function that will do array arithmetic on it, and assigning an array to something the rest of the code treats as a scalar.

What it does **not** check is the shape:

```python
# shapes.py
import numpy as np
import numpy.typing as npt

Array = npt.NDArray[np.float64]


def rss(v: Array) -> Array:
    """Expects (N, 3). The annotation says nothing about the shape."""
    return np.sqrt((v * v).sum(axis=-1))


ok = rss(np.array([[3.0, 4.0, 0.0]]))
print(ok)

wrong_shape = rss(np.array([3.0, 4.0, 0.0, 12.0, 5.0, 0.0]))
print(wrong_shape)

wrong_dtype: Array = np.array([1, 2, 3])
print(wrong_dtype.dtype)
```

```bash
python3 -m mypy shapes.py
# Success: no issues found in 1 source file
```

```bash
python3 shapes.py
# [5.]
# 13.92838827718412
# int64
```

`rss` was written for an (N, 3) array of vectors. Given a flat six-element array it returned a single number, 13.93, which is the root-sum-square of all six components and means nothing. mypy said `Success`. The flat array passed because its dtype is float64 and the annotation constrains nothing else, and the third line shows the dtype parameter did not catch an integer array either, with this combination of numpy 2.4.6 and mypy 2.3.1.

So: annotate arrays, because the two errors above are worth catching, and keep the shape contract in the docstring and in an `assert v.shape[-1] == 3` where it matters. Anyone who tells you type checking makes shape bugs impossible has not run this file.
:::

::: warning
The largest single class of numerical bug — two arguments of the same type in the wrong order — is invisible to a type checker:

```python
# newtype_units.py
from typing import NewType

Metres = NewType("Metres", float)
Feet = NewType("Feet", float)


def terrain_clearance(altitude: Metres, terrain: Metres) -> Metres:
    return Metres(altitude - terrain)


altitude_m = Metres(8420.0)
terrain_ft = Feet(9100.0)

print(terrain_clearance(altitude_m, Metres(2600.0)))
print(terrain_clearance(altitude_m, terrain_ft))


def clearance_plain(altitude: float, terrain: float) -> float:
    return altitude - terrain


print(clearance_plain(2600.0, 8420.0))
```

```bash
python3 -m mypy newtype_units.py
# newtype_units.py:16: error: Argument 2 to "terrain_clearance" has incompatible type "Feet"; expected "Metres"  [arg-type]
# Found 1 error in 1 file (checked 1 source file)
```

```bash
python3 newtype_units.py
# 5820.0
# -680.0
# -5820.0
```

The last call swapped altitude and terrain, both plain floats, and got a clearance of −5820 m. mypy reported nothing about it, because both arguments are floats and that is all the annotation said.

`NewType` is the tool that buys you the distinction: `Metres` and `Feet` are both `float` at runtime — the third line of output cost nothing — but they are distinct to the checker, so mixing them is the one error it did report. Use it for the quantities your project confuses in practice: metres against feet, radians against degrees, body frame against inertial frame.
:::

## Running mypy on a real module

`python3 -m mypy path` checks a file and everything it imports that has annotations. Run it from the environment where your dependencies are installed, or it will report that it cannot find NumPy — the stubs ship with NumPy itself.

Start permissive and tighten. On an existing module, annotate the public functions first and leave the internals; mypy checks what it can and stays quiet about the rest. `--strict` turns on every check at once, including "every function must be annotated", which is the right setting for a new module and an unproductive one for a legacy script. Configuration lives in `pyproject.toml` under `[tool.mypy]`, so the settings are the same for you, for your colleague and for the pipeline.

Two things you will need early. A third-party package with no type information produces `import-untyped` errors; silence those per-module in the configuration rather than sprinkling `# type: ignore` through your code. And `# type: ignore[code]` with the specific error code in brackets is acceptable where you genuinely know better than the checker — the bare form, which silences everything on that line including the next mistake, is not.

## Check yourself

::: check
`def scale(value: float, factor: float) -> float` is called as `scale("imu", 3)` and returns `"imuimuimu"`. Explain, and say what the annotation is for.
:::

::: answer
Python evaluates the body without consulting the annotations at all. They are stored on the function as `__annotations__` and are otherwise inert, so `"imu" * 3` runs and produces the repeated string. Nothing in the interpreter checks types on function entry — that is what "annotations are not enforced at runtime" means.

The annotation is for tools: mypy and other static checkers, editors offering completion and inline errors, `@dataclass` and similar libraries that read annotations deliberately, and human readers. Its value is that a checker compares it against every call site in the program, so a mismatch is found before anything runs. Some libraries do enforce annotations at runtime by choosing to inspect them — `pydantic` is the common example — but that is the library's behaviour, not the language's.
:::

::: check
Why does `def mean(samples: Sequence[float])` accept more callers than `def mean(samples: list[float])`, and what would you annotate the return value as?
:::

::: answer
`Sequence` is the abstract interface for "ordered, indexable, has a length". A list satisfies it, and so do a tuple, a `range`, a string of characters, and any custom container implementing `__getitem__` and `__len__` — including the `Trajectory` class from the dunder lesson. `list[float]` demands that exact concrete class and rejects all of them, although the function body would work with any.

The return value should be as specific as you can honestly make it: `float` for a mean, `list[float]` if you return a list. The caller benefits from knowing exactly what they have — that they may sort it in place, index it, append to it — and no caller is inconvenienced by being told more.

The rule is one line: be liberal in what you accept and specific in what you return. It applies to `Mapping` against `dict` and `Iterable` against `list` in the same way.
:::

::: check
mypy reports `Unsupported operand types for - ("float" and "None")` on a line that has run correctly a thousand times. Is mypy wrong?
:::

::: answer
No. It has found a path your runs have not taken. The function on the right returns `float | None`, and the code subtracts the result without checking — so on every input seen so far the value was not `None`, and on the input that produces `None` it will raise `TypeError`. An empty telemetry record, a channel that never reported, a filtered list with nothing left: that is the input.

This is the characteristic strength of static checking, and the reason it is worth running on numerical code: it covers branches by reading them, not by executing them, so the rare case is as visible as the common one.

The fix is to handle the case explicitly, `p = peak(az)` then `if p is None:`; mypy narrows the type inside the branch and accepts the arithmetic afterwards. Do not silence it with `# type: ignore`, and do not reach for an assertion unless a `None` there really would be a programming error rather than a data condition.
:::

::: check
Does `npt.NDArray[np.float64]` on both parameters of `def cross(a, b)` guarantee that a shape mismatch is caught before the code runs?
:::

::: answer
No. The annotation constrains the dtype and says nothing about the number of dimensions or the size of any of them. The measurement in this lesson is the evidence: a function written for an (N, 3) array was handed a flat six-element array, returned a meaningless scalar, and mypy reported `Success`.

What the annotation does catch is a list passed where an array is expected, and an array assigned to something declared a scalar — both common, both worth catching. Shape contracts belong in the docstring and, where getting them wrong would be expensive, in a runtime `assert a.shape == b.shape` or an explicit check that raises with a message naming both shapes.
:::

::: check
A reviewer asks why `altitude_m: float` and `terrain_m: float` is not good enough, given that mypy is already running. What is the answer, and what does `NewType` cost at runtime?
:::

::: answer
Because both arguments are floats, so passing them in the wrong order is a perfectly valid call as far as the checker is concerned. The lesson's measurement shows exactly that: a swapped call produced a terrain clearance of −5820 m, and mypy said nothing. Annotating everything `float` catches string-for-float mistakes and no unit or ordering mistakes at all, and the latter are the ones that lose vehicles.

`Metres = NewType("Metres", float)` gives the checker two distinct types while remaining a plain `float` at runtime: `Metres(8420.0)` is the identity function, the object stored is a float, and arithmetic on it is float arithmetic at float speed. The cost is a function call at each construction site and the discipline of writing `Metres(...)` when a raw number enters the typed world.

Use it where the confusion is real and recurrent — metres and feet, radians and degrees, seconds and milliseconds, body frame and inertial frame — not on every parameter, or the noise will cost you more than the errors it prevents.
:::

## Summary

| Item | Statement |
| --- | --- |
| Syntax | `def f(x: float, xs: list[float]) -> float:`; variables as `name: T = value` |
| Enforcement | None at runtime; stored in `__annotations__` and read by tools |
| `int` and `float` | `int` is acceptable wherever `float` is annotated; do not annotate a union of the two |
| Optional | `Optional[T]`, or the same thing written as a union with `None`; forces callers to handle the missing case |
| Narrowing | After `if p is None: ...`, the checker knows the other branch has a `float` |
| `Sequence[float]` | Accept the general interface; `Iterable`, `Collection` and `Mapping` likewise |
| Return types | Be specific: `list[float]`, `dict[str, float]` |
| `npt.NDArray[np.float64]` | Catches lists passed as arrays and arrays assigned to scalars |
| Not caught | Shapes, and swapped arguments of the same type |
| `NewType("Metres", float)` | Distinct to the checker, a plain `float` at runtime |
| Running it | `python3 -m mypy path`, from the environment holding your dependencies |
| Configuration | `[tool.mypy]` in `pyproject.toml`; `--strict` for new modules |
| Suppression | `# type: ignore[code]` with the specific code, never the bare form |

The next lesson replaces the other half of the diagnostic story. Annotations tell you what the code means before it runs; logging tells you what it did while it ran, with levels you can turn up without editing anything.
