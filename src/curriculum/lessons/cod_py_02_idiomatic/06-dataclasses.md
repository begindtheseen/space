---
id: l06-dataclasses
title: Dataclasses and value semantics
minutes: 20
covers:
  - dataclasses and frozen dataclasses
---

Imagine filling in the same form by hand every day, and each time you add a new box you must also update four other pages: the page that sets the form up, the page that reads it out loud, the page that compares two forms, and the page that files it. Forget one page and the form quietly goes wrong. A rubber stamp that prints all four pages from one list of box names would save you the trouble.

That is the situation with the `Vec3` of the last lesson. It was about thirty lines, and only three of them carried real information: the names `x`, `y`, `z`. The rest was `__init__` assigning each argument to an attribute of the same name, `__repr__` listing the three names again, `__eq__` comparing them a third time and `__hash__` hashing them a fourth. Four places to add a field; four places to forget one.

`@dataclass` is the rubber stamp. You write the fields once, as type annotations, and Python generates `__init__`, `__repr__` and `__eq__` for you, plus `__hash__` and ordering if you ask. A record type costs three lines. Even better than the brevity is the option `frozen=True`. A **frozen** dataclass cannot be changed after it is built. In simulation code that removes a whole family of bugs: the ones where a propagator changes a state object that a log, a plot and an event detector are all still holding. This lesson produces that bug on purpose, and then makes it impossible.

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

Read the class first. `from dataclasses import dataclass` brings in the decorator. Each line like `x: float` is a **[[type annotation|annotations-preview]]** — read it "x, a float". It declares a field named `x` and says what kind of value is meant to go in it. The decorator reads those lines, in order, and writes the methods.

Now the output, line by line.

1. The generated repr names each field: `Vec3(x=410.0, ...)`. That is better than the hand-written one, which did not.
2. `a == b` is `True` and `a is b` is `False`. Equality is field by field.
3. The list printed its elements with that same useful repr.
4. `Vec3.__hash__` is `None`.
5. Putting `a` in a set raised `TypeError: unhashable type`.

Lines 4 and 5 are the rule from the last lesson, unchanged. A plain `@dataclass` generates `__eq__`, so `__hash__` becomes `None`, and instances are unhashable. That is correct: a plain dataclass can be changed, and a hash that could change under your feet is worse than no hash.

The annotations are *read*, never *enforced*. `x: float` does not convert or check anything when the program runs. `Vec3("410", 0, 0)` builds happily with a string inside. The annotations serve `@dataclass` and a type checker, which is the subject of lesson 10.

::: key
`@dataclass` generates `__init__`, `__repr__` and `__eq__` from the annotated class-level fields, in declaration order. It reads the annotations; it does not enforce them. A plain dataclass is mutable and therefore unhashable.
:::

## The mutable default, caught this time

Remember the trap from the first Python module: a default argument like `faults=[]` is created once, when the function is defined, and shared by every call that uses it. A record type has an exact twin of that trap — a field whose default is an empty list. Dataclasses refuse it the moment the class is defined:

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

The first class never gets built. The error arrives when Python reads the class, before any instance exists — as early as an error can possibly arrive — and it names the field and the fix.

The second class uses `field(default_factory=list)`. A **[[default factory|factory-word]]** is a function the dataclass calls to make a fresh default. Here it calls `list()` once per instance, so each `Run` gets its own empty list. The output proves it: appending to `r1.faults` left `r2.faults` empty, and `r1.faults is r2.faults` is `False`.

This is a real improvement over a plain class. There, `self.faults = []` inside `__init__` is correct, but nothing stops you writing the shared version by mistake.

## frozen=True: the bug it makes unwritable

Think of a photo album versus a live webcam. A photo album holds one picture per moment, and last Tuesday's photo never changes. If you "saved" a live webcam feed four times, you would have four windows all showing *now*. A simulation log should be a photo album.

In Python, putting an object in a list does not copy it. The list stores a **[[reference|references-picture]]** — a pointer to the one object. That is fine as long as the object never changes. Watch what happens when it does:

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

The vehicle climbs at 120 m/s for three one-second steps. So the right answers are 8,000, 8,120, 8,240 and 8,360 m.

The mutable log has four entries, and all four are the *same object*. Each `append` stored a reference, and every later step changed the object that reference points at. The recorded trajectory is four copies of the final state: 8,360 m every time. Nothing raised, and the plot shows a vehicle that never moved. This is not a made-up bug. It is the most common defect in first attempts at a simulation loop.

The frozen log is correct: four distinct objects, climbing by 120 m per step. With `frozen=True`, `step_in_place` cannot even run — its first assignment raises. The only propagator you *can* write is one that returns a new state, and so the log records what really happened. That is **value semantics**: a state behaves like a number, which is a **[[value|value-semantics]]** that never changes, rather than like a shared whiteboard.

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

(The underscore in `8_420.0` is a digit separator, like a comma in 8,420. Python ignores it.)

Four things `frozen=True` gives you, matched to the output:

1. **Hashable again.** Two equal states have equal hashes, and a set of both has one element. Because the fields cannot change, a stable hash is now safe, so states can go in sets and be dict keys.
2. **Assignment raises.** `s.altitude_m = 0.0` raised `FrozenInstanceError`, which is a kind of `AttributeError`.
3. **Changed copies with `replace`.** `dataclasses.replace(s, t=13.0, altitude_m=8_640.0)` built a *new* state with two fields changed. The original `s` printed unchanged right after. This is the idiomatic way to "modify" a frozen object.
4. **Plain containers.** `asdict` and `astuple` turn the record into a dict or a tuple, ready for JSON, a CSV file or NumPy.

::: key
`@dataclass(frozen=True)` blocks attribute assignment (`FrozenInstanceError`) and generates a `__hash__` consistent with `__eq__`. `dataclasses.replace(obj, field=value)` is how you produce a changed copy. Prefer frozen for records that flow through a simulation; a state that cannot be mutated cannot be mutated by the wrong function.
:::

::: warning
Frozen is **[[shallow|shallow-picture]]**. It stops you pointing a field at a new object. It does nothing to stop you changing the object a field already points at. That matters the moment a field is a list or a NumPy array:

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

`s.t = 1.0` raised. `s.channels[0] = 99.0` did not, and the "unchangeable" sample now holds different data. The last line shows the other half: the generated `__hash__` hashes the fields, and an array cannot be hashed, so the class is hashable only in the sense that the method exists.

If you need true immutability with array data, store a tuple of floats instead, or call `arr.setflags(write=False)` on the array before storing it, so a write raises `ValueError`. Either way you are relying on a convention, so say so in the docstring.
:::

::: example A result record that sorts itself, and checks itself
Three more tools. `order=True` generates `<`, `<=`, `>` and `>=` (the methods `__lt__`, `__le__`, `__gt__`, `__ge__`), comparing the fields as a tuple in declaration order. `field(compare=False)` leaves a field out of both `__eq__` and that ordering. `__post_init__` is a method you write yourself; the generated `__init__` calls it as its last step, so it is where checks and derived values go.

The record below is one case from a **[[dispersion sweep|monte-carlo]]**: a large batch of simulated flights, each with slightly different inputs, where the margin says how far the case stayed from a limit.

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

Step through it.

1. `sorted(results)` needed no `key`. `margin` is the first field and the only one that takes part in comparisons, so the order is by margin: 0.61, 1.42, 2.07. Sanity check: smallest first, as `sorted` always does.
2. `min(results)` picked the case with margin 0.61, case 9 — the closest call, which is the one an engineer wants to look at first.
3. Building a case with a `nan` margin raised, and the message names case 12.

The declaration order carries weight. Move `margin` to second place without `compare=False` on `case_id`, and the table sorts by case id instead.

`__post_init__` catches the **[[`nan`|nan-compares]]** at construction. That matters in a sweep, because a `nan` margin spreads silently. Every comparison with `nan` is `False`, so a check like "fail if margin < 0" never fires, and a case that failed to converge is reported as passing every limit. Rejecting it where it is built means the traceback names the case.

Three awkward corners. Fields with defaults must come after fields without, so only the last field, `q_max_kpa`, carries a default. Also, because every field except `margin` has `compare=False`, two *different* cases with the same margin compare equal — and, being frozen, hash equal — so a set would keep only one of them. Finally, in a frozen dataclass `__post_init__` cannot assign to fields either. If you need a derived field, set it with `object.__setattr__(self, "name", value)`, which is deliberately ugly because you are working around the freezing you asked for.
:::

::: example What slots=True is worth, measured
`slots=True` (Python 3.10 and later) gives the generated class **[[`__slots__`|slots-layout]]**. Each instance then stores its fields in a fixed row of slots instead of its own dictionary. Two hundred thousand records is a small Monte Carlo campaign, so measure that many:

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

`tracemalloc` is the standard library's memory tracker. It counts the bytes Python allocated while the list was being built. The numbers came out the same on repeated runs here (Python 3.11 on 64-bit Linux).

Work out the saving:

1. Per instance: $136 - 96 = 40$ bytes.
2. As a fraction: $40 / 136 \approx 0.29$, about 29 percent less.
3. In total: $27{,}226{,}664 - 19{,}221{,}600 = 8{,}005{,}064$ bytes, about 8 MB on 200,000 records.

Sanity check: $200{,}000 \times 40 = 8{,}000{,}000$, which matches the total to within the small overhead of the list itself. That is worth having when the campaign is 10 million cases (about 400 MB) and worth nothing when it is 200.

The trade: a slotted instance has no `__dict__`, so you cannot attach an attribute that was never declared. `r.note = "check this one"` raises `AttributeError`. For a record type that is a feature, since it catches the misspelled field name a plain class would have accepted silently.
:::

## When not to use a dataclass

A dataclass is a **record**: data with a little behavior. When behavior dominates — a propagator, a controller, a file reader that holds an open file and a parse position — a plain class says so more honestly. The generated `__eq__` would be meaningless for such a thing anyway. What would it mean for two controllers to be "equal"?

There is no rule against methods on a dataclass. The test is whether "these fields, compared field by field, printed field by field" is a true description of the type. If it is, use a dataclass. If you do not want the generated equality, `@dataclass(eq=False)` turns it off.

::: key
A dataclass generates `__init__`, `__repr__` and optionally `__eq__` and ordering from annotated fields, so a record type costs three lines. Use `frozen=True` for value semantics; use a plain class when behavior dominates over data.
:::

The other tool to know is **[[`typing.NamedTuple`|namedtuple]]**. It gives you an unchangeable record that is also a tuple, so it can be unpacked (`t, alt, v = state`) and indexed (`state[0]`). Use it when you want that tuple behavior. Use a frozen dataclass when you do not, which is more often than people expect: a `State` that can be unpacked into three variables is a `State` somebody will unpack in the wrong order.

## Check yourself

::: check
`@dataclass class Pose: r: list = []` fails at import. What is the error, what would the matching plain-class mistake have been, and why is failing at import better?
:::

::: answer
The error is `ValueError: mutable default <class 'list'> for field r is not allowed: use default_factory`.

The matching plain-class mistake is `def __init__(self, r=[])`. There the list is created once, when the function is defined, and shared by every instance that uses the default.

Failing at import is better because the plain-class version never fails at all. It produces instances that quietly share one list, and the symptom shows up much later as one object's data appearing in another's. Here the error names the field and the fix in one line, before a single instance exists. The fix is `r: list = field(default_factory=list)`, which calls `list` once per instance.
:::

::: check
A propagator is written as `def step(state, dt): state.t += dt; ...` and the run log records the same final state 6,000 times. Explain what happened, and name the two-word change to the class that would have prevented it.
:::

::: answer
`log.append(state)` stores a *reference*, not a copy. The loop then changes that same object on every step. So all 6,000 entries are one object, and every one of them shows the values it had when the loop finished. Nothing raises, and the plot is a flat line.

The change is `frozen=True` on the state's dataclass. Assigning to a field then raises `FrozenInstanceError`, so `step` cannot be written that way. It has to return `dataclasses.replace(state, t=state.t + dt, ...)`, and each log entry is then a separate object holding the values of its own moment.

The other repair, without freezing, is to log a copy. But that means remembering to copy at every append, forever — exactly the kind of discipline that fails in the file somebody else writes.
:::

::: check
Why is a plain `@dataclass` unhashable while `@dataclass(frozen=True)` is hashable?
:::

::: answer
Both generate `__eq__`, and Python's rule is that objects that compare equal must hash equal. That only works if the fields the hash is computed from cannot change.

A plain dataclass can change. Hash a state, put it in a set, change a field, and the object now sits in the wrong bucket: `state in seen` is `False` for an object that is in `seen`. Rather than allow that, `@dataclass` sets `__hash__` to `None`.

`frozen=True` fixes the fields, so the hash is stable, and the decorator generates `__hash__` over the same fields as `__eq__`. You can force a hash onto a changeable class with `@dataclass(eq=True, unsafe_hash=True)` — and the name of that argument is the warning.
:::

::: check
A frozen `Sample` has a field `channels: np.ndarray`. A colleague says the samples are safe to share between threads because the class is immutable. What do you tell them?
:::

::: answer
That frozen is shallow. It prevents `sample.channels = other_array` but does nothing about `sample.channels[0] = 99.0`, as the warning above showed. The field still points at the same array, and the array can be changed. Anyone holding the sample can change its contents, and every other holder sees the change.

If the guarantee is needed, either store the data as a tuple of floats, or make the array read-only with `arr.setflags(write=False)` before building the sample, so an attempted write raises `ValueError`. Also point out that a frozen dataclass with an array field cannot really be hashed — the generated `__hash__` hashes the fields, and arrays are unhashable — so it cannot go in a set either.
:::

::: check
`order=True` compares the fields in declaration order. You want the table sorted by margin, but `case_id` is declared first because it reads better. What are your options?
:::

::: answer
Three, roughly in order of preference.

First, reorder the fields so `margin` comes first, and mark the others `field(compare=False)`. That is what the worked example does. The declaration order then *is* the sort order, and a reader of the class can see it.

Second, keep your field order, drop `order=True`, and sort with an explicit key: `sorted(results, key=attrgetter("margin"))`, with `from operator import attrgetter`. This is the right answer when different reports want different orderings, because an order baked into the class can only be one thing.

Third, put `field(compare=False)` on `case_id` alone. That removes it from the comparison, so `margin` becomes the first field that compares. But it also removes `case_id` from `__eq__`, so two different cases that match on margin and the other compared fields now count as equal — usually not what you meant.
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
| `field(compare=False)` | Leaves a field out of `__eq__` and out of the ordering |
| `__post_init__` | Runs at the end of the generated `__init__`; validation goes here |
| `slots=True` | Measured here: 96 bytes per instance against 136, on 200,000 records |
| Shallow | Frozen stops rebinding, not changes inside a list or array a field points at |
| Plain class instead | When behavior dominates over data |

The next lesson asks how classes should relate to one another: when a new type should inherit from an old one, when it should contain one instead, and how Python gives a type to the duck typing it has always relied on.

::: context annotations-preview Labels the program ignores
A **type annotation** is a label written after a colon: `x: float`, `name: str`. Python stores these labels but does not act on them when the code runs. `@dataclass` reads them only to learn the field names and their order.

The real payoff comes from **type checkers** such as mypy. They read the labels without running the program and complain when, say, a string is passed where a float was promised. Lesson 10 is about exactly that, and it turns these same annotations into a safety net.
:::

::: context factory-word Why it is called a factory
In programming, a **factory** is anything that makes new objects on request. `list` is a factory: each call `list()` makes a brand-new empty list.

`default_factory=list` hands the dataclass the factory itself — note there are no parentheses — so it can call it once per instance. Writing `default_factory=list()` would be wrong: that calls it once, right away, and passes a single list. Any function with no arguments works, for example `default_factory=lambda: [0.0, 0.0, 0.0]`.
:::

::: context references-picture Four arrows, one object
A Python list does not hold objects. It holds arrows to objects.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#b4232c">mutable log</text>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="26" width="30" height="24"/><rect x="20" y="50" width="30" height="24"/>
    <rect x="20" y="74" width="30" height="24"/><rect x="20" y="98" width="30" height="24"/>
  </g>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="42" y1="38" x2="100" y2="70"/><line x1="42" y1="62" x2="100" y2="72"/>
    <line x1="42" y1="86" x2="100" y2="76"/><line x1="42" y1="110" x2="100" y2="78"/>
  </g>
  <rect x="100" y="58" width="72" height="32" rx="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="136" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">t=3.0</text>
  <text x="270" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#1d6fd1">frozen log</text>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="200" y="26" width="30" height="24"/><rect x="200" y="50" width="30" height="24"/>
    <rect x="200" y="74" width="30" height="24"/><rect x="200" y="98" width="30" height="24"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="222" y1="38" x2="270" y2="38"/><line x1="222" y1="62" x2="270" y2="62"/>
    <line x1="222" y1="86" x2="270" y2="86"/><line x1="222" y1="110" x2="270" y2="110"/>
  </g>
  <g fill="#fff" stroke="#1d6fd1" stroke-width="2">
    <rect x="270" y="28" width="70" height="20" rx="4"/><rect x="270" y="52" width="70" height="20" rx="4"/>
    <rect x="270" y="76" width="70" height="20" rx="4"/><rect x="270" y="100" width="70" height="20" rx="4"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="305" y="42">t=0.0</text><text x="305" y="66">t=1.0</text><text x="305" y="90">t=2.0</text><text x="305" y="114">t=3.0</text>
  </g>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">left: 4 slots, 1 object changed 3 times</text>
  <text x="180" y="180" font-size="11" text-anchor="middle" fill="#1f2a44">right: 4 slots, 4 objects that never change</text>
</svg>
```

Changing the one object on the left changes what all four slots show.
:::

::: context value-semantics Behaving like a number
When you write `a = 5` then `b = a` then `b = b + 1`, nobody expects `a` to become 6. Numbers and strings in Python cannot be changed in place; every "change" makes a new value. That is **value semantics**.

A frozen dataclass gives your records the same behavior. You never edit a state; you make a new one with `replace`. Anyone holding the old one keeps exactly what they had. Flight-software teams like this style because it makes a run's history trustworthy and makes code much easier to reason about when several parts of the program share the same data.
:::

::: context shallow-picture A locked box holding an unlocked drawer
`frozen=True` locks the *arrows* stored in the fields. It does not lock the objects at the ends of those arrows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="25" width="140" height="90" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="3"/>
  <text x="85" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1d6fd1">frozen Sample</text>
  <text x="28" y="55" font-size="12" fill="#1f2a44">t = 0.0</text>
  <text x="28" y="90" font-size="12" fill="#1f2a44">channels</text>
  <line x1="100" y1="86" x2="208" y2="86" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="214,86 204,81 204,91" fill="#1f2a44"/>
  <rect x="216" y="70" width="40" height="32" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="256" y="70" width="40" height="32" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="296" y="70" width="40" height="32" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="236" y="91">99</text><text x="276" y="91">2</text><text x="316" y="91">3</text>
  </g>
  <text x="276" y="60" font-size="11" text-anchor="middle" fill="#b4232c">array: still writable</text>
  <text x="85" y="132" font-size="11" text-anchor="middle" fill="#1d6fd1">fields locked</text>
</svg>
```

`s.channels = other` tries to move the arrow, and the lock stops it. `s.channels[0] = 99.0` follows the arrow and writes into the array, which has no lock at all.
:::

::: context monte-carlo Dispersion sweeps
Real inputs are never exact. Engine thrust varies a little, winds vary, the mass is known only to within some kilograms. A **dispersion analysis** runs the same simulation thousands of times, each time drawing the uncertain inputs at random from their expected spread. The name **Monte Carlo** comes from the casino, because the method runs on random draws.

The output is a pile of results like `CaseResult`, and engineers look first at the worst ones — the smallest margins. That is why sorting by margin, and catching a `nan` margin at once, matter so much.
:::

::: context nan-compares Why nan slips through checks
`nan` means "not a number". It is what floating-point arithmetic produces for undefined results such as `0.0 * float("inf")` or `inf - inf`, and it spreads: any arithmetic involving `nan` gives `nan`.

The IEEE 754 standard says every ordered comparison with `nan` is false. So `nan < 0` is `False`, `nan > 0` is `False`, and even `nan == nan` is `False`. A check like `if margin < 0: fail()` lets a `nan` pass straight through. `math.isfinite(x)` is the reliable test: it is `False` for `nan` and for both infinities.
:::

::: context slots-layout A dict per object versus fixed slots
A normal instance carries its own small dictionary of attribute values, plus the bookkeeping a dictionary needs. A slotted instance stores the values directly in fixed positions, and the names live once on the class.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">plain: 136 B each</text>
  <rect x="20" y="30" width="50" height="40" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="45" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">object</text>
  <line x1="70" y1="50" x2="92" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="98,50 90,45 90,55" fill="#1f2a44"/>
  <rect x="100" y="26" width="70" height="92" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44"><text x="108" y="44">'t': 0.0</text><text x="108" y="64">'x': 1.0</text><text x="108" y="84">'y': 2.0</text><text x="108" y="104">'z': 3.0</text></g>
  <text x="270" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#1d6fd1">slots: 96 B each</text>
  <rect x="210" y="30" width="120" height="40" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="1"><line x1="240" y1="30" x2="240" y2="70"/><line x1="270" y1="30" x2="270" y2="70"/><line x1="300" y1="30" x2="300" y2="70"/></g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44"><text x="225" y="54">0.0</text><text x="255" y="54">1.0</text><text x="285" y="54">2.0</text><text x="315" y="54">3.0</text></g>
  <text x="270" y="90" font-size="11" text-anchor="middle" fill="#6c7a93">names t, x, y, z stored</text>
  <text x="270" y="106" font-size="11" text-anchor="middle" fill="#6c7a93">once, on the class</text>
</svg>
```

Each measured figure also includes the new float made for `t` on every row (24 bytes) and the list's pointer to the record (8 bytes); the 1.0, 2.0 and 3.0 are shared constants. The 40 bytes saved per record are the dictionary storage the slotted version never builds.
:::

::: context namedtuple The record that is also a tuple
`NamedTuple` records are written with the same annotation style:

`class Fix(NamedTuple): lat: float; lon: float`

A `Fix` can be read as `fix.lat` or as `fix[0]`, and unpacked with `lat, lon = fix`. That tuple nature is the risk: someone who writes `lon, lat = fix` gets the two swapped with no error at all. A latitude/longitude swap is a classic navigation bug, which is one reason to prefer the frozen dataclass when you do not need tuple behavior.
:::
