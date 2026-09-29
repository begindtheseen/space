---
id: l10-type-annotations-and-mypy
title: Type annotations and mypy
minutes: 22
covers:
  - Type annotations, Optional, Sequence, npt.NDArray, and mypy
---

Picture a kitchen with a row of jars. One says SUGAR, one says SALT. The labels are useful, but a label does not stop anyone from pouring salt into the sugar jar. For the labels to protect the cake, somebody has to walk along the shelf and check that each jar holds what its label says — before the baking starts, not after the first bite.

Python's **type annotations** are those labels. You write down what kind of value each function input and output is meant to be: a float, a list of floats, a NumPy array. Python itself never reads them while the program runs. A separate tool called a **type checker** — in this lesson, **mypy** — walks the whole shelf. It reads every line of your module and of every module that calls it, compares each value with its label, and reports the mismatches. It does all that without running a single line.

Why it matters: a six-hour **[[Monte Carlo|monte-carlo]]** run of a landing simulation fails in hour five with `TypeError: '>' not supported between instances of 'float' and 'str'`. The cause is a limit read from a configuration file as text and never turned into a number. It reached a comparison that only a rare, extreme case ever hits. No test covered that branch, because no test runs for six hours. With annotations, mypy points at that line in about a second.

This lesson teaches the notation, the three pieces that matter most for numerical work — `Optional`, `Sequence` and NumPy's array types — how to run mypy, and what it cannot catch.

## Writing an annotation, and the fact that nothing enforces it

An annotation sits in three places. After a colon on a parameter. After an arrow `->` at the end of the `def` line, for the value the function gives back. And after a colon on a variable. Read `value: float` aloud as "value is a float", and read `-> float` as "returns a float".

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

Walk through the three lines of output.

1. `scale(9.81, 2.0)` gave `19.62`, as you would expect.
2. `scale("imu", 3)` gave `"imuimuimu"`. The label said "float", the value was a string, and Python did not care. A string times a whole number repeats the string, so it did that.
3. `scale.__annotations__` shows where the labels went. Python stored them in a dictionary on the function and otherwise ignored them.

That is the central rule. **Annotations are metadata** — information *about* the code that the code itself never acts on. The interpreter does not enforce them. That is why a type checker is a separate program you have to run:

```bash
python3 -m mypy not_enforced.py
# not_enforced.py:8: error: Argument 1 to "scale" has incompatible type "str"; expected "float"  [arg-type]
# Found 1 error in 1 file (checked 1 source file)
```

mypy named the file, the line (8) and the problem. The bracketed `[arg-type]` is the **error code** — a short name for the kind of mistake.

Notice that mypy reported one error, not two. The `3` is an `int`, not a `float`, and mypy let it through. The type system has a built-in rule that an `int` is acceptable wherever a `float` is wanted, because every whole number is also a real number. So you annotate `float` and get `int` for free. Do not write `int | float`.

::: key Annotations are not enforced
Python does not enforce type annotations at runtime. They are metadata, checked only by external tools such as mypy or pyright, or at runtime by libraries that choose to read them. Their value is catching interface mistakes before the simulation runs for an hour.
:::

### Containers and "or"

A container is labeled with the type of what it holds, in square brackets. Since **[[Python 3.9|annotation-history]]** you can use the built-in names directly:

- `list[float]` — a list of floats;
- `dict[str, float]` — a dictionary from strings (the keys) to floats (the values);
- `set[int]` — a set of whole numbers;
- `tuple[float, float, float]` — a tuple of exactly three floats;
- `tuple[float, ...]` — a tuple of floats of any length. The three dots are real Python syntax, read "and so on".

The vertical bar `|` inside an annotation means "or". Read `float | None` aloud as "float or None". You will meet it in the section after next.

## What a checker sees that tests do not

A test **executes** code. It feeds in some inputs, runs the function, and checks the answer. It can only tell you about the paths the program actually took on those inputs. A function with ten `if` statements has up to $2^{10} = 1024$ ways through it, and your tests take a handful.

A **static** checker — static means "without running" — works differently. It **[[reads every branch|branch-coverage]]**, taken or not, and checks that at each step the kinds of value line up. The rare branch is as visible to it as the common one.

That is its strength, and it tells you its limit too. mypy checks **interfaces** — what goes in and out of each function, and what each operation is handed. It says nothing about whether your arithmetic is right. A function annotated `-> float` that returns the wrong float passes mypy happily.

::: key What mypy gives you
mypy checks a whole program for interface mistakes without executing any code path, so it covers branches your tests never reach. It proves nothing about numerical correctness — only about interfaces.
:::

## Optional: saying "maybe nothing"

Some functions sometimes have no answer. The largest value in an empty list, for example, does not exist. A common Python habit is to return `None` in that case.

The annotation for that is `float | None`: "a float, or None". Older code writes the same thing as `Optional[float]`, imported from `typing`. The two spellings mean exactly the same. "Optional" here does not mean the argument is optional to pass. It means the *value* might be missing.

Saying so pays for itself, because mypy then makes every caller deal with the `None`. Here is a small, fully annotated telemetry module:

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

Check the output. The peak of the five samples is $14.2$, and the peak of an empty list is `None`. The samples above $10.0$ sit at positions 2 and 4. The vector $(3, 4, 0)$ has length $\sqrt{9 + 16} = 5$, and $(1, 2, 2)$ has length $\sqrt{1 + 4 + 4} = 3$. The margin is $15.0 - 14.2 = 0.8$, with the usual tiny floating-point leftover.

Now a caller that is not clean:

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

Take the two errors one at a time.

**Line 6.** `peak` can return `None`, and the code subtracts its result without checking. On this list it happens to work. On an empty record it would raise `TypeError`. mypy found that without an empty record ever existing.

**Line 9.** This is the failure from the opening: a limit that arrived as the string `"10.0"` instead of the number `10.0`. Run the file and Python does crash on exactly this line, with `'>' not supported between instances of 'float' and 'str'`. mypy found it in a second, before anything ran.

The fix for line 6 is to handle the missing case:

```python
p = peak(az)
headroom = None if p is None else 15.0 - p
```

mypy accepts this, because it follows the test. After `p is None` turns out false, it knows `p` must be a `float`. This is called **[[narrowing|narrowing]]**: a check in the code shrinks the set of types a value can have on that branch.

The third call passed a tuple where the annotation says `Sequence[float]`, and mypy said nothing at all. That is the next idea.

::: example Sequence in, list out
Annotate a parameter as `list[float]` and you have demanded a list. A tuple, a `deque`, a row from a CSV reader — all rejected, even though every one of them would work:

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

Step by step:

1. Both functions have the same body. Only the label on `samples` differs.
2. At runtime both calls work and give the same mean. Check it: $(9.81 + 9.79 + 12.4)/3 = 32.0/3 \approx 10.67$.
3. mypy rejected only `mean_list(record)`. The tuple was fine for the body. The label was needlessly narrow.

**`Sequence`**, from `collections.abc`, is the general idea "things in order, which you can index and take the length of". A list is one. So is a tuple, and so is a `range`. This gives a rule worth memorizing, because it applies to every function you annotate:

> Accept the most general type you can use. Return the most specific type you have.

For inputs, pick the loosest label the body needs:

- if you only loop over it, use **`Iterable[float]`**;
- if you loop and take the length, use `Collection[float]`;
- if you also index it, use `Sequence[float]`;
- for a dictionary you only look things up in, use `Mapping[str, float]`.

For outputs, be exact: say `list[float]` or `dict[str, float]`. The caller then knows they may sort it in place or add to it.

Requiring a `dict` when you only read it rules out a `defaultdict` wrapper, a read-only view of a dictionary, and every **[[test double|test-double]]** a colleague might hand you.
:::

::: example NumPy arrays, and being honest about the limits
NumPy ships its own typing module, `numpy.typing`, usually imported as `npt`. The label `npt.NDArray[np.float64]` means "a NumPy array whose **dtype** is float64". The dtype is the kind of number stored in every cell of the array; **[[float64|dtype]]** is the ordinary 8-byte decimal number. The habit is to give it a short alias once per module:

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

Those two catches are real wins, and they are the two mistakes people actually make with arrays:

1. Line 12 hands a **nested list** to a function that does array arithmetic. Run it and Python crashes inside `rss`, because `v * v` means nothing for two lists.
2. Line 13 stores an **array** in a variable that the rest of the code treats as a single number.

What the label does **not** check is the **[[shape|array-shape]]** — how many rows and columns:

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

1. The correct (1, 3) input gave `[5.]` — one vector, length 5.
2. `rss` was written for (N, 3) arrays of vectors. Given one flat row of six numbers, it returned a single number, $13.93$. That is $\sqrt{9 + 16 + 0 + 144 + 25 + 0} = \sqrt{194} \approx 13.93$: the length of all six numbers lumped together, which means nothing physically. mypy said `Success`.
3. The last line stores an array of whole numbers (`int64`) under a float64 label. The dtype check did not catch that either, with this combination of NumPy 2.4.6 and mypy 2.3.1.

So annotate arrays, because the first two catches are worth having. Keep the shape promise in the docstring, and where a wrong shape would be expensive, check it while the program runs with `assert v.shape[-1] == 3`.
:::

::: warning Same type, wrong order
The most common numerical bug of all — two arguments of the same type passed in the wrong order — is invisible to a type checker:

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

The last call swapped altitude and terrain, both plain floats, and got a clearance of $-5820\,\mathrm{m}$: the aircraft is apparently far underground. mypy reported nothing, because both arguments are floats and that is all the labels said.

**`NewType`** makes a new name for an existing type that the checker treats as different. `Metres` and `Feet` are both ordinary floats while the program runs — the second call happily computed $8420 - 9100 = -680$, mixing units. But to mypy they are distinct, so mixing them was the one error it did report. Use it for the quantities your project really does **[[confuse in practice|unit-mixups]]**: meters against feet, radians against degrees, body frame against inertial frame.
:::

## Running mypy on a real module

`python3 -m mypy path` checks a file and follows its imports. Run it from the same Python environment where your packages are installed. Otherwise mypy reports that it cannot find NumPy, whose type information ships inside NumPy itself.

One default surprises everyone. mypy does not look inside a function that has **no annotations at all**:

```python
# untyped.py
def f(x):
    return 1 + "a"


def g(x: int) -> int:
    return 1 + "a"
```

```bash
python3 -m mypy untyped.py
# untyped.py:6: error: Unsupported operand types for + ("int" and "str")  [operator]
# Found 1 error in 1 file (checked 1 source file)
```

Both functions contain the same bug. Only `g` has labels, so only `g` was checked. That lets you annotate an old script one function at a time without a flood of errors. The flag `--check-untyped-defs` tells mypy to look inside the unlabeled ones too.

So start gentle and tighten. On an existing module, annotate the public functions first — the ones other files call. On a new module, use **`--strict`**, which turns on every check at once, including "every function must be annotated". It is also pickier: on `analysis.py` it flags `rss` with `no-any-return`, because NumPy's `np.sqrt` is labeled loosely and mypy cannot prove it returns a float64 array.

Put the settings in the project's `pyproject.toml` under `[tool.mypy]`, so you, your colleague and the automatic build all check the same way:

```toml
[tool.mypy]
python_version = "3.11"
warn_unused_ignores = true

[[tool.mypy.overrides]]
module = ["yaml"]
ignore_missing_imports = true
```

Two situations come up early.

A third-party package that ships no type information produces an `import-untyped` error on the `import` line. With PyYAML, for example, mypy says `Library stubs not installed for "yaml"  [import-untyped]`. Silence that once, for that package, in the configuration — the `overrides` table above does exactly that.

And when you truly know better than the checker on one line, write `# type: ignore[code]` with the specific error code in the brackets, such as `# type: ignore[assignment]`. That silences one kind of complaint. The bare `# type: ignore` silences everything on that line, including the next, different mistake someone makes there. Do not use the bare form.

## Check yourself

::: check
`def scale(value: float, factor: float) -> float` is called as `scale("imu", 3)` and returns `"imuimuimu"`. Explain why, and say what the annotation is for.
:::

::: answer
Python runs the body without looking at the annotations. They are stored on the function in `__annotations__` and otherwise do nothing. So `"imu" * 3` runs, and a string times a whole number repeats it three times. Nothing in the interpreter checks types when a function starts. That is what "annotations are not enforced at runtime" means.

The annotation is for tools and people: static checkers such as mypy and pyright, editors that underline mistakes as you type, libraries such as `@dataclass` that read annotations on purpose, and human readers.

The value is that a checker compares the label against every call in the program, so a mismatch is found before anything runs. Some libraries check annotations at runtime by choosing to inspect them — `pydantic` is the common example — but that is the library's behavior, not the language's.
:::

::: check
Why does `def mean(samples: Sequence[float])` accept more callers than `def mean(samples: list[float])`? What would you annotate the return value as?
:::

::: answer
`Sequence` is the general interface "in order, indexable, has a length". A list satisfies it, and so do a tuple and a `range`. Your own class counts too if it inherits from `collections.abc.Sequence` — defining `__getitem__` and `__len__` alone is not enough for mypy, because `Sequence` is checked by name, not by shape. `list[float]` demands that one exact class and rejects all the others, although the body would work with any of them.

The return value should be as specific as you can honestly make it: `float` for a mean, `list[float]` if you return a list. The caller then knows exactly what they have, and nobody is harmed by being told more.

The rule in one line: be generous in what you accept and specific in what you return. `Mapping` against `dict`, and `Iterable` against `list`, work the same way.
:::

::: check
mypy reports `Unsupported operand types for - ("float" and "None")` on a line that has run correctly a thousand times. Is mypy wrong?
:::

::: answer
No. It has found a path your runs have not taken. The function on the right of the minus returns `float | None`, and the code subtracts the result without checking. On every input seen so far the value was a float. On the input that produces `None`, the line raises `TypeError`. An empty telemetry record, a channel that never reported, a filtered list with nothing left: that is the input.

Static checking covers branches by reading them, not by running them, so the rare case is as visible as the common one.

The fix is to handle the case: `p = peak(az)`, then `if p is None:` and decide what should happen. mypy narrows the type inside each branch and accepts the arithmetic where `p` must be a float. Do not silence it with `# type: ignore`. Do not reach for an `assert` either, unless a `None` there really would be a programming error rather than a normal data condition.
:::

::: check
Does `npt.NDArray[np.float64]` on both parameters of `def cross(a, b)` guarantee that a shape mismatch is caught before the code runs?
:::

::: answer
No. The label constrains the dtype and says nothing about how many dimensions the array has or how long each one is. The measurement in this lesson is the evidence: a function written for an (N, 3) array was handed one flat row of six numbers, returned a meaningless $13.93$, and mypy reported `Success`.

What the label does catch is a list passed where an array is expected, and an array stored where a single number is declared. Both are common, and both are worth catching. Shape promises belong in the docstring and, where a mistake would be expensive, in a runtime check such as `assert a.shape == b.shape`, or an explicit `if` that raises an error naming both shapes.
:::

::: check
A reviewer asks why `altitude_m: float` and `terrain_m: float` is not good enough, since mypy is already running. What is your answer, and what does `NewType` cost at runtime?
:::

::: answer
Both arguments are floats, so passing them in the wrong order is a perfectly valid call as far as the checker knows. The lesson's run shows this: a swapped call produced a terrain clearance of $-5820\,\mathrm{m}$, and mypy said nothing. Labeling everything `float` catches a string passed as a number, but no unit mistakes and no order mistakes at all — and those are the ones that lose vehicles.

`Metres = NewType("Metres", float)` gives the checker a distinct type while staying a plain `float` at runtime. `Metres(8420.0)` hands back the same float it was given, and arithmetic on it is ordinary float arithmetic at full speed. The cost is one small function call wherever a value is created, and the discipline of writing `Metres(...)` when a raw number enters the typed part of the code.

Use it where the confusion is real and keeps happening — meters and feet, radians and degrees, seconds and milliseconds, body frame and inertial frame. Do not put it on every parameter, or the clutter will cost more than the errors it prevents.
:::

## Summary

| Item | Statement |
| --- | --- |
| Syntax | `def f(x: float, xs: list[float]) -> float:`; variables as `name: T = value` |
| Enforcement | None at runtime; stored in `__annotations__` and read by tools |
| `int` and `float` | `int` is accepted wherever `float` is annotated; do not write a union of the two |
| Optional | `Optional[T]`, the same as a union of `T` with `None`; forces callers to handle the missing case |
| Narrowing | After `if p is None: ...`, the checker knows the other branch has a `float` |
| `Sequence[float]` | Accept the general interface; `Iterable`, `Collection` and `Mapping` likewise |
| Return types | Be specific: `list[float]`, `dict[str, float]` |
| `npt.NDArray[np.float64]` | Catches lists passed as arrays and arrays assigned to scalars |
| Not caught | Shapes, and swapped arguments of the same type |
| `NewType("Metres", float)` | Distinct to the checker, a plain `float` at runtime |
| Unannotated functions | Not checked inside unless `--check-untyped-defs` |
| Running it | `python3 -m mypy path`, from the environment holding your packages |
| Configuration | `[tool.mypy]` in `pyproject.toml`; `--strict` for new modules |
| Suppression | `# type: ignore[code]` with the specific code, never the bare form |

Annotations tell you what the code means before it runs. The next lesson covers the other half: **logging**, which records what the code actually did while it ran, with levels you can turn up and down without editing anything.

::: context monte-carlo Why simulations roll dice
A **Monte Carlo** run answers "what could happen?" by running the same simulation thousands of times. Each run nudges the inputs a little at random — wind, engine thrust, sensor noise, the mass of the propellant — within the ranges engineers expect. Then you look at the whole spread of results, and especially at the worst few percent.

Those worst cases are the **dispersed tail**: the rare combinations far from normal. They are exactly where untested code paths hide, because they are the cases nobody writes a quick test for. The name comes from the casino in Monaco, because the method runs on chance.
:::

::: context annotation-history How the labels arrived, one version at a time
Python did not get annotations all at once.

- Python 3.0 (2008) allowed annotations on function parameters and returns, but said nothing about what they should mean.
- PEP 484, in Python 3.5 (2015), gave them their meaning as type hints. It drew heavily on mypy, which Jukka Lehtosalo had started as a research project.
- Python 3.6 added annotations on variables, like `az: list[float] = []`.
- Python 3.9 let you write `list[float]` instead of importing `List` from `typing`.
- Python 3.10 added `float | None` as a shorter spelling of `Optional[float]`.

So in older code you will see `List[float]` and `Optional[float]`. They mean the same as the modern forms.
:::

::: context branch-coverage Tests walk some paths; a checker reads the map
Think of a function as a set of forking paths. A test is one walk from the entrance to an exit. A type checker is someone reading the whole map.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="85" r="8" fill="#1f2a44"/>
  <text x="40" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">call</text>
  <g stroke-width="3" fill="none">
    <path d="M48 85 L130 50" stroke="#1d6fd1"/>
    <path d="M48 85 L130 120" stroke="#8fb8f0"/>
    <path d="M130 50 L230 30" stroke="#1d6fd1"/>
    <path d="M130 50 L230 70" stroke="#8fb8f0"/>
    <path d="M130 120 L230 105" stroke="#8fb8f0"/>
    <path d="M130 120 L230 145" stroke="#b4232c" stroke-dasharray="6 4"/>
  </g>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <circle cx="130" cy="50" r="6"/><circle cx="130" cy="120" r="6"/>
    <circle cx="230" cy="30" r="6"/><circle cx="230" cy="70" r="6"/>
    <circle cx="230" cy="105" r="6"/><circle cx="230" cy="145" r="6"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="242" y="34">tested path</text>
    <text x="242" y="74">never run</text>
    <text x="242" y="109">never run</text>
    <text x="242" y="149" fill="#b4232c">bug: float &gt; str</text>
  </g>
  <text x="180" y="165" font-size="11" text-anchor="middle" fill="#6c7a93">mypy reads all four endings; the test walked one</text>
</svg>
```

The dark blue walk is what your test ran. The checker looks at every ending, including the dashed red one where the configuration string meets a number.
:::

::: context narrowing How the checker follows your if
Before the test, `p` is labeled "float or None". The `if` splits the code into two branches, and on each branch the checker knows more.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="10" width="140" height="30" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">p: float | None</text>
  <text x="180" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">if p is None:</text>
  <line x1="150" y1="66" x2="80" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="66" x2="280" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="80" font-size="11" text-anchor="end" fill="#6c7a93">true</text>
  <text x="265" y="80" font-size="11" fill="#6c7a93">false</text>
  <rect x="20" y="98" width="120" height="30" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">p: None</text>
  <rect x="220" y="98" width="120" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">p: float</text>
  <text x="280" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">15.0 - p is fine here</text>
</svg>
```

The same happens after `isinstance(x, str)`, after `if not samples:`, and after an early `return`.
:::

::: context test-double Stand-ins for the real thing
A **test double** is a fake object used in a test in place of a real one, the way a stunt double stands in for an actor. Instead of a real telemetry database, a test might pass a small dictionary-like object holding three made-up values.

If your function demands exactly `dict`, that stand-in fails the type check even though it would work. If it asks only for `Mapping[str, float]`, anything that behaves like a read-only dictionary passes. General input labels make code easier to test.
:::

::: context dtype What float64 means
Every cell of a NumPy array holds the same kind of number, and the **dtype** ("data type") says which. `float64` is a decimal number stored in 64 bits, which is 8 bytes. It keeps about 15 to 16 significant digits, the same as a plain Python `float`.

`int64` holds whole numbers in 8 bytes. `float32` uses 4 bytes and keeps only about 7 digits, which is why flight software that uses it must think carefully about rounding. `np.array([1, 2, 3])` picks `int64` on most machines because every number you gave it was whole.
:::

::: context array-shape Shape: how the numbers are arranged
An array's **shape** lists how long it is along each direction. Two vectors of three numbers each make shape (2, 3): two rows, three columns. The same six numbers in one row make shape (6,).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="70" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">shape (2, 3)</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="25" y="28" width="30" height="26"/><rect x="55" y="28" width="30" height="26"/><rect x="85" y="28" width="30" height="26"/>
    <rect x="25" y="54" width="30" height="26" fill="#f2b880"/><rect x="55" y="54" width="30" height="26" fill="#f2b880"/><rect x="85" y="54" width="30" height="26" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="46">3</text><text x="70" y="46">4</text><text x="100" y="46">0</text>
    <text x="40" y="72">12</text><text x="70" y="72">5</text><text x="100" y="72">0</text>
  </g>
  <text x="70" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">rss: 5 and 13</text>
  <text x="250" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">shape (6,)</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="160" y="41" width="30" height="26"/><rect x="190" y="41" width="30" height="26"/><rect x="220" y="41" width="30" height="26"/>
    <rect x="250" y="41" width="30" height="26"/><rect x="280" y="41" width="30" height="26"/><rect x="310" y="41" width="30" height="26"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="175" y="59">3</text><text x="205" y="59">4</text><text x="235" y="59">0</text>
    <text x="265" y="59">12</text><text x="295" y="59">5</text><text x="325" y="59">0</text>
  </g>
  <text x="250" y="100" font-size="11" text-anchor="middle" fill="#b4232c">rss: 13.93, one meaningless number</text>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#6c7a93">same numbers, same dtype; mypy sees no difference</text>
</svg>
```

In mypy's message, `ndarray[tuple[Any, ...], dtype[float64]]`, the first slot is where a shape would go. `NDArray` fills it with "any shape", which is why shapes pass unchecked.
:::

::: context unit-mixups A spacecraft lost to units
In September 1999, NASA's Mars Climate Orbiter was lost as it arrived at Mars. Ground software from one team reported thruster impulse in pound-force seconds. The navigation software of another team read those numbers as newton-seconds. One pound-force is about $4.45$ newtons, so every small thruster firing was understated by that factor.

Over months of cruise, the error pushed the spacecraft's path far lower than planned, and it went too deep into the Martian atmosphere. Both numbers were plain floating-point values. No type checker could have told them apart — unless the code had given them different types, which is what `NewType` does.
:::
