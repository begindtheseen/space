---
id: l06-dataclasses
title: Dataclasses and value semantics
minutes: 16
covers:
  - dataclasses and frozen dataclasses
---

The `Vec3` of the last lesson was about thirty lines, of which three carried information: the names `x`, `y`, `z`. The rest was `__init__` assigning each argument to an attribute of the same name, `__repr__` listing the same three names again, `__eq__` comparing the same three names a third time, and `__hash__` hashing them a fourth. Four places to add a field, four places to forget one.

`@dataclass` writes those methods from the field declarations. You state the fields once, as annotations, and get `__init__`, `__repr__` and `__eq__` for free, plus `__hash__` and ordering if you ask. A record type costs three lines.

The option worth more than the brevity is `frozen=True`. A frozen dataclass cannot be modified after construction, which is what value semantics means, and in simulation code that removes an entire family of bugs — the ones where a propagator mutates the state object that a log, a plot and an event detector are all still holding. The measurement in this lesson is that bug, produced and then made impossible.

## The generated methods

```python
# basic_dc.py
from dataclasses import dataclass


@dataclass
class Vec3:
    """Three floats, with __init__, __repr__ and __eq__ generated."""

    x: float
    y: float
    z: float


a = Vec3(410.0, -3.2, 88.0)
b = Vec3(410.0, -3.2, 88.0)
print(a)
print(a == b, a is b)
print([a, b])
print(Vec3.__hash__)
try:
    {a}
except TypeError as exc:
    print("TypeError:", exc)
```

```bash
python3 basic_dc.py
# Vec3(x=410.0, y=-3.2, z=88.0)
# True False
# [Vec3(x=410.0, y=-3.2, z=88.0), Vec3(x=410.0, y=-3.2, z=88.0)]
# None
# TypeError: unhashable type: 'Vec3'
```

The repr names its fields, which the hand-written one did not, and the equality is field by field. The last two lines are the rule from the previous lesson, unchanged: a plain `@dataclass` generates `__eq__`, so it sets `__hash__` to `None`, and instances are unhashable. That is correct, because a plain dataclass is mutable and a hash that could change is worse than no hash.

The annotations are what the decorator reads, and they are *only* read. `x: float` does not convert or check anything at runtime; `Vec3("410", 0, 0)` builds happily with a string in it. The annotations are for `@dataclass` and for a type checker, which is the subject of a later lesson in this module.

::: key
`@dataclass` generates `__init__`, `__repr__` and `__eq__` from the annotated class-level fields, in declaration order. It reads the annotations; it does not enforce them. A plain dataclass is mutable and therefore unhashable.
:::

## The mutable default, caught this time

The trap from the first module — a default argument evaluated once and shared by every call — has an exact analogue in a record type. Dataclasses refuse it at class-definition time:

```python
# mutable_default.py
from dataclasses import dataclass, field


try:
    @dataclass
    class Run:
        case_id: int
        faults: list = []
except ValueError as exc:
    print("ValueError:", exc)


@dataclass
class Run:
    case_id: int
    faults: list = field(default_factory=list)


r1, r2 = Run(1), Run(2)
r1.faults.append("imu dropout")
print(r1, r2)
print(r1.faults is r2.faults)
```

```bash
python3 mutable_default.py
# ValueError: mutable default <class 'list'> for field faults is not allowed: use default_factory
# Run(case_id=1, faults=['imu dropout']) Run(case_id=2, faults=[])
# False
```

The error arrives when the class is defined, not when an instance misbehaves, which is as early as it could possibly arrive. `field(default_factory=list)` calls `list` once per instance, so each `Run` gets its own list — the two runs above do not share, and `r1.faults is r2.faults` is `False`.

This is a genuine improvement over a plain class, where `self.faults = []` in `__init__` is correct but nothing stops you writing the shared version.

## frozen=True: the bug it makes unwritable

```python
# aliasing.py
import dataclasses
from dataclasses import dataclass


@dataclass
class MutableState:
    t: float
    altitude_m: float


@dataclass(frozen=True)
class State:
    t: float
    altitude_m: float


def step_in_place(state, dt, climb_rate):
    """A propagator that mutates the state it was handed."""
    state.t += dt
    state.altitude_m += climb_rate * dt
    return state


def step(state, dt, climb_rate):
    """A propagator that returns a new state."""
    return dataclasses.replace(
        state, t=state.t + dt, altitude_m=state.altitude_m + climb_rate * dt
    )


start = MutableState(0.0, 8000.0)
log = [start]
current = start
for _ in range(3):
    current = step_in_place(current, 1.0, 120.0)
    log.append(current)
print("mutable log:", log)

start = State(0.0, 8000.0)
log = [start]
current = start
for _ in range(3):
    current = step(current, 1.0, 120.0)
    log.append(current)
print("frozen log: ", log)
```

```bash
python3 aliasing.py
# mutable log: [MutableState(t=3.0, altitude_m=8360.0), MutableState(t=3.0, altitude_m=8360.0), MutableState(t=3.0, altitude_m=8360.0), MutableState(t=3.0, altitude_m=8360.0)]
# frozen log:  [State(t=0.0, altitude_m=8000.0), State(t=1.0, altitude_m=8120.0), State(t=2.0, altitude_m=8240.0), State(t=3.0, altitude_m=8360.0)]
```

The mutable log has four entries and they are all the same object: `append` stored a reference, and every subsequent step mutated the object that reference points at. The recorded trajectory is four copies of the final state, and nothing raised, and the plot looks like a vehicle that never moved. This is not a contrived bug; it is the single most common defect in first-attempt simulation loops.

With `frozen=True`, `step_in_place` cannot even be written — the assignment raises — so the only propagator you can write is one that returns a new state, and the log records what actually happened.

```python
# frozen.py
import dataclasses
from dataclasses import dataclass


@dataclass(frozen=True)
class State:
    """One instant of a trajectory. Value semantics: never modified in place."""

    t: float
    altitude_m: float
    speed_ms: float


s = State(12.5, 8_420.0, 419.35)
print(s)
print(hash(s) == hash(State(12.5, 8_420.0, 419.35)))
print(len({s, State(12.5, 8_420.0, 419.35)}))

try:
    s.altitude_m = 0.0
except dataclasses.FrozenInstanceError as exc:
    print("FrozenInstanceError:", exc)

later = dataclasses.replace(s, t=13.0, altitude_m=8_640.0)
print(later)
print(s)
print(dataclasses.asdict(s))
print(dataclasses.astuple(s))
```

```bash
python3 frozen.py
# State(t=12.5, altitude_m=8420.0, speed_ms=419.35)
# True
# 1
# FrozenInstanceError: cannot assign to field 'altitude_m'
# State(t=13.0, altitude_m=8640.0, speed_ms=419.35)
# State(t=12.5, altitude_m=8420.0, speed_ms=419.35)
# {'t': 12.5, 'altitude_m': 8420.0, 'speed_ms': 419.35}
# (12.5, 8420.0, 419.35)
```

Four things `frozen=True` gives you. Assignment raises `FrozenInstanceError`, which is a subclass of `AttributeError`. Instances are hashable again, because the fields cannot change, so states go in sets and dict keys. `dataclasses.replace(s, **changes)` builds a new instance from an old one with some fields changed — the idiomatic "modify" — and the original is untouched, as the two prints show. And `asdict` and `astuple` convert to plain containers, for writing to JSON or handing to NumPy.

::: key
`@dataclass(frozen=True)` blocks attribute assignment (`FrozenInstanceError`) and generates a `__hash__` consistent with `__eq__`. `dataclasses.replace(obj, field=value)` is how you produce a changed copy. Prefer frozen for records that flow through a simulation; a state that cannot be mutated cannot be mutated by the wrong function.
:::

::: warning
Frozen is *shallow*. It stops you rebinding a field; it does nothing about mutating the object a field points at, which matters the moment a field is a NumPy array or a list:

```python
# shallow.py
import dataclasses
from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Sample:
    t: float
    channels: np.ndarray


s = Sample(0.0, np.array([1.0, 2.0, 3.0]))
print(s.channels)

try:
    s.t = 1.0
except dataclasses.FrozenInstanceError as exc:
    print("FrozenInstanceError:", exc)

s.channels[0] = 99.0
print(s.channels)

try:
    hash(s)
except TypeError as exc:
    print("TypeError:", exc)
```

```bash
python3 shallow.py
# [1. 2. 3.]
# FrozenInstanceError: cannot assign to field 't'
# [99.  2.  3.]
# TypeError: unhashable type: 'numpy.ndarray'
```

`s.t = 1.0` raised; `s.channels[0] = 99.0` did not, and the "immutable" sample now holds different data. The hash attempt shows the other half of the story: the generated `__hash__` hashes the fields, and an array is unhashable, so the class is hashable only in the sense that the method exists.

If you need real immutability with array fields, store a tuple, or call `arr.setflags(write=False)` on the array before storing it, and know that you are relying on a convention either way.
:::

::: example A result record that sorts itself, and validates itself
`order=True` generates `__lt__`, `__le__`, `__gt__` and `__ge__` comparing the fields as a tuple, in declaration order. `field(compare=False)` keeps a field out of both `__eq__` and the ordering. `__post_init__` runs at the end of the generated `__init__`, which is where validation and derived fields go.

```python
# post_init.py
import math
from dataclasses import dataclass, field


@dataclass(frozen=True, order=True)
class CaseResult:
    """One dispersion case. Ordered by margin, so sorted() needs no key."""

    margin: float
    case_id: int = field(compare=False)
    config: str = field(compare=False)
    q_max_kpa: float = field(compare=False, default=0.0)

    def __post_init__(self):
        if not math.isfinite(self.margin):
            raise ValueError(f"case {self.case_id}: margin is {self.margin}")


results = [
    CaseResult(1.42, 7, "hot_high", 33.1),
    CaseResult(0.61, 9, "hot_high", 35.4),
    CaseResult(2.07, 1, "cold_low", 29.8),
]
for r in sorted(results):
    print(r)
print(min(results))

try:
    CaseResult(float("nan"), 12, "nominal")
except ValueError as exc:
    print("ValueError:", exc)
```

```bash
python3 post_init.py
# CaseResult(margin=0.61, case_id=9, config='hot_high', q_max_kpa=35.4)
# CaseResult(margin=1.42, case_id=7, config='hot_high', q_max_kpa=33.1)
# CaseResult(margin=2.07, case_id=1, config='cold_low', q_max_kpa=29.8)
# CaseResult(margin=0.61, case_id=9, config='hot_high', q_max_kpa=35.4)
# ValueError: case 12: margin is nan
```

`sorted(results)` and `min(results)` needed no `key` at all, because `margin` is the first field and the only one that compares. The declaration order is load-bearing: put `margin` second and the table sorts by case id.

`__post_init__` catches the `nan` at construction. That matters in a dispersion sweep, because a `nan` margin propagates silently — it compares `False` against every threshold, so a case that failed to converge is reported as passing every limit. Rejecting it where it is built means the traceback names the case.

Note the awkward corner: fields with defaults must come after fields without, so `q_max_kpa` carries the default and the three before it do not. In a frozen dataclass, `__post_init__` cannot assign to fields either; if you need a derived field, compute it with `object.__setattr__(self, "name", value)`, which is deliberately ugly because you are working around the freezing you asked for.
:::

::: example What slots=True is worth, measured
`slots=True` (Python 3.10 and later) gives the generated class `__slots__`, so instances carry a fixed array of fields instead of a per-instance `__dict__`. Two hundred thousand records is a small Monte Carlo campaign:

```python
# slots_size.py
import tracemalloc
from dataclasses import dataclass


@dataclass
class Plain:
    t: float
    x: float
    y: float
    z: float


@dataclass(slots=True)
class Slotted:
    t: float
    x: float
    y: float
    z: float


def peak(cls, n=200_000):
    tracemalloc.start()
    before = tracemalloc.get_traced_memory()[0]
    keep = [cls(float(i), 1.0, 2.0, 3.0) for i in range(n)]
    used = tracemalloc.get_traced_memory()[0] - before
    tracemalloc.stop()
    return used, len(keep)


plain_bytes, n = peak(Plain)
slot_bytes, _ = peak(Slotted)
print(f"{n} plain dataclass instances: {plain_bytes} bytes")
print(f"{n} slots=True instances:      {slot_bytes} bytes")
print("bytes per instance:", plain_bytes // n, "vs", slot_bytes // n)
```

```bash
python3 slots_size.py
# 200000 plain dataclass instances: 27226664 bytes
# 200000 slots=True instances:      19221600 bytes
# bytes per instance: 136 vs 96
```

136 bytes per record against 96, measured with `tracemalloc` on this machine and reproducing exactly between runs: about 29 percent less, or 8 MB saved on 200,000 records. That is worth having when the campaign is 10 million cases and worth nothing when it is 200.

The trade is that a slotted instance has no `__dict__`, so you cannot attach an attribute that was not declared — `r.note = "check this one"` raises `AttributeError`. For a record type that is a feature, since it catches the misspelled field name that a plain class would have accepted silently.
:::

## When not to use a dataclass

A dataclass is a record: data with a little behaviour. When behaviour dominates — a propagator, a controller, a file reader that holds a handle and a parse state — a plain class says so more honestly, and the generated `__eq__` would be meaningless for it anyway. There is no rule against methods on a dataclass; the question is whether "these fields, compared field by field, printed field by field" is a true description of the type.

The other case to know is `typing.NamedTuple`, which gives you an immutable record that is also a tuple, so it unpacks and indexes. Use it when the tuple behaviour is wanted. Use a frozen dataclass when it is not, which is more often than people expect: a `State` that can be unpacked into three variables is a `State` somebody will unpack in the wrong order.

## Check yourself

::: check
`@dataclass class Pose: r: list = []` fails at import. What is the error, what would the equivalent plain-class mistake have been, and why is failing at import better?
:::

::: answer
`ValueError: mutable default <class 'list'> for field r is not allowed: use default_factory`. The equivalent plain-class mistake is `def __init__(self, r=[])`, where the list is created once when the function is defined and shared by every instance that uses the default.

Failing at import is better because the plain-class version never fails: it produces instances that quietly share one list, and the symptom appears later as one object's data turning up in another's. Here the error names the field and the fix in one line, before a single instance exists. `r: list = field(default_factory=list)` calls `list` once per instance.
:::

::: check
A propagator is written as `def step(state, dt): state.t += dt; ...` and the run log records the same final state 6,000 times. Explain the mechanism, and name the two-word change to the class that would have prevented it.
:::

::: answer
`log.append(state)` stores a *reference*, not a copy. The loop then mutates that same object on every step, so all 6,000 entries are one object and every one of them shows whatever the values were when the loop finished. Nothing raises, and the plot is a flat line.

The change is `frozen=True` on the state's dataclass. Assignment to a field then raises `FrozenInstanceError`, so `step` cannot be written that way; it has to return `dataclasses.replace(state, t=state.t + dt, ...)`, and each log entry is then a distinct object holding the values it had at that instant.

The other repair, without freezing, is to log a copy — but that requires remembering, at every append, forever, and it is exactly the kind of discipline that fails in the file somebody else writes.
:::

::: check
Why is a plain `@dataclass` unhashable while `@dataclass(frozen=True)` is hashable?
:::

::: answer
Because both generate `__eq__`, and Python's rule is that objects comparing equal must hash equal, which requires that the fields the hash is computed from cannot change. A plain dataclass is mutable: hash a state, put it in a set, change a field, and the object is now in the wrong bucket and `state in seen` is `False` for an object that is in `seen`. Rather than allow that, `@dataclass` sets `__hash__` to `None`.

`frozen=True` makes the fields fixed, so the hash is stable, and the decorator generates `__hash__` over the same fields as `__eq__`. You can also force it on a mutable class with `@dataclass(eq=True, unsafe_hash=True)`, and the name of that argument is the warning.
:::

::: check
A frozen `Sample` has a field `channels: np.ndarray`. A colleague says the samples are safe to share between threads because the class is immutable. What do you tell them?
:::

::: answer
That frozen is shallow. It prevents `sample.channels = other_array` and does nothing about `sample.channels[0] = 99.0`, which was demonstrated above: the field still points at the same array, and the array is mutable. Anyone holding the sample can change its contents, and every other holder sees the change.

If the guarantee is needed, either store the data as a tuple of floats, or make the array read-only with `arr.setflags(write=False)` before constructing the sample, so an attempted write raises `ValueError` rather than succeeding. Also note that a frozen dataclass with an array field is not hashable in practice — the generated `__hash__` hashes the fields and arrays are unhashable — so it cannot go in a set either.
:::

::: check
`order=True` generates comparisons from the fields in declaration order. You want the table sorted by margin, but `case_id` is declared first because it reads better. What are your options?
:::

::: answer
Three, in rough order of preference. Reorder the fields so that `margin` comes first and mark the others `field(compare=False)`, which is what the worked example does; the declaration order then *is* the sort order, and a reader of the class can see it.

Or leave the order alone, drop `order=True`, and sort with an explicit key: `sorted(results, key=attrgetter("margin"))`. This is the right answer when different reports want different orderings, because an order baked into the class can only be one thing.

Or set `field(compare=False)` on `case_id` alone, which removes it from the comparison so `margin` becomes the first comparing field — but be aware it also removes it from `__eq__`, so two different cases with the same margin now compare equal, which is usually wrong.
:::

## Summary

| Item | Statement |
| --- | --- |
| `@dataclass` | Generates `__init__`, `__repr__`, `__eq__` from annotated fields in order |
| Annotations | Read by the decorator and by type checkers; never enforced at runtime |
| Plain dataclass | Mutable, so `__hash__` is `None` and instances are unhashable |
| `field(default_factory=list)` | One new container per instance; a bare `= []` raises `ValueError` at import |
| `frozen=True` | Assignment raises `FrozenInstanceError`; generates a matching `__hash__` |
| `dataclasses.replace(o, f=v)` | A new instance with some fields changed; the original is untouched |
| `asdict` / `astuple` | Convert to plain containers for JSON, CSV or NumPy |
| `order=True` | Comparisons from the fields as a tuple, in declaration order |
| `field(compare=False)` | Excludes a field from `__eq__` and from the ordering |
| `__post_init__` | Runs at the end of the generated `__init__`; validation goes here |
| `slots=True` | Measured here: 96 bytes per instance against 136, on 200,000 records |
| Shallow | Frozen stops rebinding, not mutation of a list or array a field points at |

The next lesson asks how classes should relate to one another: when a new type should inherit from an old one, when it should merely contain one, and how Python types the duck-typing it has always relied on.
