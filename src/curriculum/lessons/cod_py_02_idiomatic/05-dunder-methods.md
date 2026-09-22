---
id: l05-dunder-methods
title: Dunder methods: behaving like a built-in type
minutes: 16
covers:
  - Dunder methods: __repr__, __eq__, __add__, __mul__, __len__, __iter__
---

The class you wrote in the last lesson works, and then you put one in a list, print the list, and get three lines of hexadecimal. You compare two states that hold the same numbers and get `False`. You try to add two force vectors with `+` and get a `TypeError`. None of that is a defect in your class; it is the absence of the methods Python looks for when it needs those behaviours.

Those methods have names with two leading and two trailing underscores — *dunder* methods, for double underscore. They are not magic and they are not called by you. They are the hooks Python's operators and built-in functions go through: `print(v)` consults `__repr__` or `__str__`, `a == b` consults `__eq__`, `a + b` consults `__add__`, `len(x)` consults `__len__`, and `for x in thing` consults `__iter__`. Implementing them is how a class of yours behaves like a class of Python's.

Two of them carry traps sharp enough to have their own sections. `__eq__` on floating-point data is a flaky test waiting to happen, and defining `__eq__` at all silently makes your instances unhashable. Both are below, with the evidence.

## __repr__ is for you at three in the morning

Without a `__repr__`, an object prints as its type and its address:

```python
# default_repr.py
class Vec3:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = float(x), float(y), float(z)


v = Vec3(410.0, -3.2, 88.0)
print(v)
print([v, v])
print(str(v) == repr(v))
```

```bash
python3 default_repr.py
# <__main__.Vec3 object at 0x7f4d9c021610>
# [<__main__.Vec3 object at 0x7f4d9c021610>, <__main__.Vec3 object at 0x7f4d9c021610>]
# True
```

A list of a hundred of those tells you nothing. The address is not even useful for telling two objects apart in a log file, because it is reused after garbage collection.

`__repr__` should return a string that says unambiguously what the object is, and by convention it should look like the call that would rebuild it. `__str__` is the separate, optional, human-facing form:

```python
# repr_str.py
class Vec3:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = float(x), float(y), float(z)

    def __repr__(self):
        return f"Vec3({self.x!r}, {self.y!r}, {self.z!r})"

    def __str__(self):
        return f"({self.x:.1f}, {self.y:.1f}, {self.z:.1f}) m/s"


v = Vec3(410.0, -3.2, 88.0)
print(v)
print(repr(v))
print([v, v])
print(f"{v} / {v!r}")
print(eval(repr(v)).x)
```

```bash
python3 repr_str.py
# (410.0, -3.2, 88.0) m/s
# Vec3(410.0, -3.2, 88.0)
# [Vec3(410.0, -3.2, 88.0), Vec3(410.0, -3.2, 88.0)]
# (410.0, -3.2, 88.0) m/s / Vec3(410.0, -3.2, 88.0)
# 410.0
```

Read the third line: **a container always shows its elements' `repr`, never their `str`**. That is why `__repr__` is the one to write first and `__str__` the one you may never write at all. If you define only `__repr__`, `str()` falls back to it, and everything prints usefully; if you define only `__str__`, lists and dicts and tracebacks still show hexadecimal.

The `!r` in the f-string is the conversion that applies `repr` to the field. It matters for strings — `f"Sensor({self.name})"` gives `Sensor(imu)` while `f"Sensor({self.name!r})"` gives `Sensor('imu')`, and only the second tells you the name was text and shows you a trailing space if there is one.

The `eval(repr(v))` on the last line is not something to do in real code; it is the test of whether the repr is faithful, and passing it is a good goal.

::: warning
A `__repr__` that can raise is a liability, because the moment you most need it is when the object is in a state you did not expect:

```python
# fragile_repr.py
class Run:
    """A __repr__ that assumes the object is well formed."""

    def __init__(self, samples):
        self.samples = list(samples)

    def __repr__(self):
        return f"Run(t0={self.samples[0]}, n={len(self.samples)})"


print(Run([0.0, 1.0]))
try:
    print(Run([]))
except IndexError as exc:
    print("IndexError raised by __repr__:", exc)
```

```bash
python3 fragile_repr.py
# Run(t0=0.0, n=2)
# IndexError raised by __repr__: list index out of range
```

An empty run is exactly the case you were debugging, and the debugger cannot show it to you. Handle the degenerate cases inside `__repr__`, or print only fields that always exist.
:::

## __eq__, and the two things it changes

Define `__eq__` and you get value comparison. You also, without being told, lose hashability:

```python
# eq_hash.py
class Vec3Eq:
    """Defines __eq__ and nothing else."""

    def __init__(self, x, y, z):
        self.x, self.y, self.z = float(x), float(y), float(z)

    def __eq__(self, other):
        if not isinstance(other, Vec3Eq):
            return NotImplemented
        return (self.x, self.y, self.z) == (other.x, other.y, other.z)


a, b = Vec3Eq(1.0, 2.0, 3.0), Vec3Eq(1.0, 2.0, 3.0)
print(a == b, a is b)
print(Vec3Eq.__hash__)
try:
    {a}
except TypeError as exc:
    print("TypeError:", exc)


class Vec3(Vec3Eq):
    def __hash__(self):
        return hash((self.x, self.y, self.z))


c, d = Vec3(1.0, 2.0, 3.0), Vec3(1.0, 2.0, 3.0)
print(c == d, len({c, d}))
```

```bash
python3 eq_hash.py
# True False
# None
# TypeError: unhashable type: 'Vec3Eq'
# True 1
```

`Vec3Eq.__hash__` is `None`. Python sets it that way on purpose, because the rule for hashing is that objects which compare equal must hash equal, and it has no way to guess a hash consistent with your new equality. Leaving the inherited identity hash in place would put two equal vectors in different buckets of a dict, which is a much worse bug than a clear `TypeError`.

So: if instances must go in a set or be dict keys, define `__hash__` too, over the same fields, and only if those fields do not change after construction. The last two lines show it working — `c == d` and the set of both has one element. If the object is mutable, leaving it unhashable is the correct answer, not an oversight.

::: key
Defining `__eq__` sets `__hash__` to `None` and makes instances unhashable. Define `__hash__` explicitly over the same fields — and only for objects whose fields do not change — or use a frozen dataclass, which does both for you.
:::

## __add__, __mul__ and NotImplemented

Operators dispatch to dunder methods: `a + b` tries `type(a).__add__(a, b)`, and `a * k` tries `type(a).__mul__(a, k)`. When the left operand does not know what to do with the right, the correct response is to `return NotImplemented` — the singleton, not a raise. Python then tries the *reflected* operation on the right operand, `type(b).__radd__(b, a)`, and only if that also declines does it raise a `TypeError` naming both types.

```python
# vec3.py
import math


class Vec3:
    """A 3-vector of floats: position, velocity or force, in one frame."""

    def __init__(self, x, y, z):
        self.x, self.y, self.z = float(x), float(y), float(z)

    def __repr__(self):
        return f"Vec3({self.x!r}, {self.y!r}, {self.z!r})"

    def __eq__(self, other):
        if not isinstance(other, Vec3):
            return NotImplemented
        return (self.x, self.y, self.z) == (other.x, other.y, other.z)

    def __hash__(self):
        return hash((self.x, self.y, self.z))

    def __add__(self, other):
        if not isinstance(other, Vec3):
            return NotImplemented
        return Vec3(self.x + other.x, self.y + other.y, self.z + other.z)

    def __mul__(self, k):
        if not isinstance(k, (int, float)):
            return NotImplemented
        return Vec3(self.x * k, self.y * k, self.z * k)

    __rmul__ = __mul__

    def __abs__(self):
        return math.sqrt(self.x ** 2 + self.y ** 2 + self.z ** 2)

    def __iter__(self):
        yield self.x
        yield self.y
        yield self.z

    def __len__(self):
        return 3

    def isclose(self, other, rel_tol=1e-9, abs_tol=0.0):
        """Component-wise tolerant comparison; use this, not ==, on computed values."""
        return all(
            math.isclose(a, b, rel_tol=rel_tol, abs_tol=abs_tol)
            for a, b in zip(self, other, strict=True)
        )


if __name__ == "__main__":
    thrust = Vec3(0.0, 0.0, 7.6e5)
    drag = Vec3(-1.2e4, 0.0, 0.0)
    total = thrust + drag
    print(total)
    print(abs(total))
    print(total * 0.5 == 0.5 * total)
    print(list(total), len(total))
    try:
        total + 1
    except TypeError as exc:
        print("TypeError:", exc)
```

```bash
python3 vec3.py
# Vec3(-12000.0, 0.0, 760000.0)
# 760094.7309381904
# True
# [-12000.0, 0.0, 760000.0] 3
# TypeError: unsupported operand type(s) for +: 'Vec3' and 'int'
```

`__rmul__ = __mul__` is the line that makes `0.5 * total` work. Scalar multiplication commutes, so the reflected method is the same function; for an operation that does not commute — a quaternion product, a matrix product — `__rmul__` must be written separately and must not simply call `__mul__`, or `q1 * q2` and `q2 * q1` will give the same answer and every rotation composed in the wrong order will be silently wrong.

::: note
The quaternion case is worth stating precisely, because you will implement it. A scalar-first quaternion is $q = w + x\,i + y\,j + z\,k$, with the basis relations $i^2 = j^2 = k^2 = ijk = -1$, from which $ij = k$, $jk = i$, $ki = j$ and each reversed product carries a minus sign. Writing $q = (w, \mathbf{v})$ with $\mathbf{v} = (x, y, z)$, the Hamilton product is

$$q_1 q_2 = \left(w_1 w_2 - \mathbf{v}_1 \cdot \mathbf{v}_2,\; w_1 \mathbf{v}_2 + w_2 \mathbf{v}_1 + \mathbf{v}_1 \times \mathbf{v}_2\right)$$

and the cross product is what makes it non-commutative: swapping the operands flips that term's sign and leaves the rest alone. The conjugate is $q^{*} = (w, -\mathbf{v})$, the norm is $\lVert q \rVert = \sqrt{w^2 + x^2 + y^2 + z^2}$, and $q q^{*} = (\lVert q \rVert^2, \mathbf{0})$ — which is the identity to test an implementation against, because it must come out with a zero vector part to within rounding.

A unit quaternion represents a rotation, so `normalized()` is not tidying: it restores the constraint that makes the object mean anything, and normalising a zero quaternion is undefined and should raise rather than divide.
:::

The final `TypeError` came from Python, not from the class, and it names both types. That message is what `return NotImplemented` buys: had `__add__` raised `TypeError("expected a Vec3")` itself, Python would never have tried `int.__radd__`, and a future `Vec3 + numpy.ndarray` could not work either.

## The float trap in __eq__

`__eq__` built from `==` on floats is exact comparison, and computed floats are almost never exactly equal:

```python
# float_eq.py
from vec3 import Vec3

dt = 0.1
v = Vec3(0.0, 0.0, 0.0)
for _ in range(10):
    v = v + Vec3(dt, 0.0, 0.0)

expected = Vec3(1.0, 0.0, 0.0)
print(v)
print(v == expected)
print(v.isclose(expected))
print(v.x - expected.x)
```

```bash
python3 float_eq.py
# Vec3(0.9999999999999999, 0.0, 0.0)
# False
# True
# -1.1102230246251565e-16
```

Ten steps of 0.1 do not sum to 1.0, because 0.1 is not representable in binary; the result is short by about $1.1 \times 10^{-16}$, one unit in the last place. A test written as `assert state == expected` passes on your machine, fails on a machine whose libm rounds a sine differently, and gets marked flaky and retried.

The resolution is not to make `__eq__` tolerant. A tolerant `==` breaks the rules the language relies on — it is not transitive, so `a == b` and `b == c` no longer imply `a == c`, and a dict lookup using it would be incoherent. Keep `__eq__` exact, and put the tolerance in a named method, as `Vec3.isclose` does in the class above: the call site then says which comparison it meant.

::: example Making a container behave like one
`__len__` and `__iter__` are what turn a class that *holds* things into a class that *is* a sequence, so that `len`, `for`, `max`, `sum`, unpacking and truthiness all work on it.

```python
# trajectory.py
from vec3 import Vec3


class Trajectory:
    """A time-ordered sequence of (time, velocity) samples."""

    def __init__(self, samples):
        self.samples = list(samples)

    def __repr__(self):
        if not self.samples:
            return "Trajectory(empty)"
        return f"Trajectory({len(self.samples)} samples, t={self.t0}..{self.t1})"

    @property
    def t0(self):
        return self.samples[0][0]

    @property
    def t1(self):
        return self.samples[-1][0]

    def __len__(self):
        return len(self.samples)

    def __iter__(self):
        return iter(self.samples)

    def __getitem__(self, i):
        return self.samples[i]


if __name__ == "__main__":
    traj = Trajectory(
        [
            (0.0, Vec3(0.0, 0.0, 0.0)),
            (1.0, Vec3(12.0, 0.0, 1.5)),
            (2.0, Vec3(26.5, 0.0, 3.1)),
            (3.0, Vec3(43.0, 0.0, 4.8)),
        ]
    )

    print(traj)
    print(len(traj), bool(traj))
    print(traj[1])
    print(traj[-1][0])
    print(max(abs(v) for _, v in traj))
    print([t for t, _ in traj])
    print(Trajectory([]), bool(Trajectory([])))
```

```bash
python3 trajectory.py
# Trajectory(4 samples, t=0.0..3.0)
# 4 True
# (1.0, Vec3(12.0, 0.0, 1.5))
# 3.0
# 43.26707755326213
# [0.0, 1.0, 2.0, 3.0]
# Trajectory(empty) False
```

Four dunder methods bought six behaviours that no caller had to be taught. `len(traj)` works. `bool(traj)` works and is `False` for an empty trajectory — Python asks `__len__` when there is no `__bool__`, which is why an empty container is falsy and why `if traj:` is the idiomatic emptiness test rather than `if len(traj) > 0:`. `for`, the generator expression inside `max`, and the list comprehension all go through `__iter__`. `traj[1]` and `traj[-1]` go through `__getitem__`, and negative indices work because the underlying list handles them.

Note also what `__repr__` does inside the samples: the tuple prints its element with `repr`, so `Vec3(12.0, 0.0, 1.5)` appears rather than an address. A good repr on a small class pays off in every container that holds it.
:::

::: example Where NotImplemented earns its keep
Adding a `Vec3` to something that is not a `Vec3` is the case you have to get right, because the wrong answer is a class that other people's types cannot interoperate with.

```python
# interop.py
from vec3 import Vec3


class Offset:
    """A third-party type that knows how to add itself to a Vec3."""

    def __init__(self, dx, dy, dz):
        self.dx, self.dy, self.dz = float(dx), float(dy), float(dz)

    def __radd__(self, other):
        if not isinstance(other, Vec3):
            return NotImplemented
        return Vec3(other.x + self.dx, other.y + self.dy, other.z + self.dz)


v = Vec3(1.0, 2.0, 3.0)
print(v + Offset(0.5, 0.0, -1.0))

try:
    v + "north"
except TypeError as exc:
    print("TypeError:", exc)
```

```bash
python3 interop.py
# Vec3(1.5, 2.0, 2.0)
# TypeError: unsupported operand type(s) for +: 'Vec3' and 'str'
```

`Offset` is a class `Vec3` has never heard of, and `v + Offset(...)` still works: `Vec3.__add__` declined by returning `NotImplemented`, so Python offered the operation to the right-hand operand's `__radd__`, which accepted. A class that raised instead of declining would have made this impossible, and with it every future interoperation — with a NumPy array, with a units library, with a colleague's frame-aware vector type.
:::

## Check yourself

::: check
A class defines `__str__` and not `__repr__`. What does a list of ten of them print, and why is that the wrong way round?
:::

::: answer
It prints ten copies of the default `<module.Class object at 0x...>`. Containers format their elements with `repr`, never with `str`, so a class with only `__str__` looks informative when printed alone and useless in every list, dict, tuple, traceback and debugger watch window.

The fallback runs the other way: if only `__repr__` is defined, `str(obj)` and `print(obj)` use it. So `__repr__` is the one to write first, and `__str__` is worth adding only when a distinct human-facing form — with units, with rounding — genuinely helps.
:::

::: check
You add `__eq__` to a `Waypoint` class. The next test run fails with `TypeError: unhashable type: 'Waypoint'` in code you did not touch. Explain, and give two fixes.
:::

::: answer
Defining `__eq__` sets `__hash__` to `None` on the class, so instances can no longer go in a set or be used as dict keys. The untouched code was doing exactly that — deduplicating waypoints, or keying a dict by one — and it worked before because the inherited default hashed by identity.

The reason for the behaviour is the invariant that equal objects must hash equal; the old identity hash would have put two now-equal waypoints in different buckets, so `wp in seen` could be `False` for a waypoint that equals one in the set.

Fix one: define `__hash__` over the same fields the `__eq__` uses, `return hash((self.lat, self.lon, self.alt))`, which is only correct if those fields never change after construction. Fix two: make the class a frozen dataclass, which generates a matching `__eq__` and `__hash__` and enforces the immutability the hash depends on. The next lesson does exactly that.
:::

::: check
Why should `__eq__` compare floats exactly rather than with a tolerance, given that exact comparison of computed floats almost always fails?
:::

::: answer
Because a tolerant equality is not an equivalence relation. With a tolerance of one millimetre, a point at 0 mm equals one at 0.9 mm and that one equals a point at 1.8 mm, but the first and last are not equal: transitivity fails. Every structure that relies on equality — sets, dict keys, `in`, `list.index`, `unique` — becomes order-dependent and incoherent.

So `__eq__` stays exact, and the tolerance goes in a named method such as `isclose`, or in `math.isclose` and `numpy.allclose` at the call site. The benefit is that the call site states which comparison it meant, which is also what makes a failing test readable: "these differed by 3e-9 with a tolerance of 1e-12" is a diagnosis, where "not equal" is not.
:::

::: check
`Vec3.__mul__` returns `NotImplemented` for a non-numeric operand instead of raising `TypeError`. Give a concrete thing that would stop working if it raised.
:::

::: answer
Any right-hand operand that knows how to handle a `Vec3` itself. `Vec3 * SomeUnitsQuantity`, `Vec3 * numpy.ndarray`, or a colleague's `Dcm` class that defines `__rmul__` to rotate a vector: in each case Python's rule is to try the left operand's `__mul__`, and on `NotImplemented` to try the right operand's `__rmul__`. Raising from `__mul__` ends the protocol at step one, and the right operand never gets asked.

You also lose the standard error message. Python's own `TypeError: unsupported operand type(s) for *: 'Vec3' and 'str'` names both types and both the operator; a hand-written raise usually names neither well.
:::

::: check
`Trajectory` defines `__len__` but no `__bool__`. What does `if traj:` do for a trajectory with zero samples, and what would happen if the class defined neither?
:::

::: answer
With `__len__` and no `__bool__`, `bool(traj)` calls `__len__` and treats zero as false, so `if traj:` is false for an empty trajectory and true otherwise — which is what you want and why `if traj:` is preferred to `if len(traj) > 0:`.

If the class defined neither, every instance would be truthy, including the empty one, because the default for an object with no `__bool__` and no `__len__` is `True`. That is the failure mode where a guard clause meant to skip empty runs never skips anything, and the code downstream gets an empty trajectory it was written to assume away.
:::

## Summary

| Dunder | Triggered by | Note |
| --- | --- | --- |
| `__repr__` | `repr(x)`, containers, the debugger | Unambiguous; aim for something `eval` could rebuild; must not raise |
| `__str__` | `str(x)`, `print(x)`, f-strings | Optional; falls back to `__repr__`; never used inside containers |
| `__eq__` | `==`, `in`, `list.index` | Return `NotImplemented` for foreign types; keep float comparison exact |
| `__hash__` | `set`, dict keys | Set to `None` automatically when you define `__eq__`; define it over the same fields |
| `__add__` / `__radd__` | `a + b` | `NotImplemented` lets the other operand try; Python then raises a good `TypeError` |
| `__mul__` / `__rmul__` | `a * b` | `__rmul__ = __mul__` only when the operation commutes |
| `__abs__` | `abs(x)` | Natural home for a vector magnitude |
| `__len__` | `len(x)`, and `bool(x)` when there is no `__bool__` | Empty means falsy |
| `__iter__` | `for`, comprehensions, `max`, `sum`, unpacking | Return an iterator, or be a generator with `yield` |
| `__getitem__` | `x[i]` | Delegating to a list gives negative indices and slices for free |
| Measured here | — | Ten additions of 0.1 gave 0.9999999999999999, short by $1.1\times 10^{-16}$ |

The next lesson removes most of the typing. `__init__`, `__repr__`, `__eq__` and a consistent `__hash__` over a fixed list of fields is such a common requirement that Python generates them for you, from annotations, with `@dataclass`.
