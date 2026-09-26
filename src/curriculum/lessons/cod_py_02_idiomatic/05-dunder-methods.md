---
id: l05-dunder-methods
title: Dunder methods: behaving like a built-in type
minutes: 20
covers:
  - Dunder methods: __repr__, __eq__, __add__, __mul__, __len__, __iter__
---

Think of a wall socket. Any lamp, phone charger or kettle works in it, because each one has a plug of the agreed shape. The socket does not know or care what is on the other end of the cord. It only cares about the plug.

Python's operators and built-in functions are sockets like that. `print(v)`, `a == b`, `a + b`, `len(x)` and `for x in thing` each look for one method with an agreed name on your object. If the method is there, your object plugs in and works like a list or a number. If it is not there, you get a default that is usually useless, or an error.

Those agreed names have two underscores on each side — `__repr__`, `__eq__`, `__add__` — so they are called **[[dunder methods|dunder-name]]**, for "double underscore". You rarely call them yourself. Python calls them when it needs the behavior:

- `repr(v)`, and `print(v)` when there is no `__str__`, call `__repr__`;
- `a == b` calls `__eq__`;
- `a + b` calls `__add__`, and `a * b` calls `__mul__`;
- `len(x)` calls `__len__`;
- `for x in thing` calls `__iter__`.

The class from the last lesson works, but put one in a list and print the list and you get lines of hexadecimal. Compare two states holding the same numbers and you get `False`. Add two force vectors with `+` and you get a `TypeError`. None of that is a bug in your class. The plugs are missing. This lesson adds them, and shows the two sharp traps in `__eq__`: exact float comparison, and the way defining `__eq__` silently makes your objects unhashable.

## __repr__ is for you at three in the morning

Without a `__repr__`, an object prints as its type and its address in memory:

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
# <__main__.Vec3 object at 0x7f39bc96d690>
# [<__main__.Vec3 object at 0x7f39bc96d690>, <__main__.Vec3 object at 0x7f39bc96d690>]
# True
```

The `0x7f39...` is a **[[hexadecimal|hex-address]]** memory address. A list of a hundred of those tells you nothing. The address is not even reliable for telling two objects apart in a log file, because Python reuses an address once the old object is cleaned up.

`__repr__` (read "dunder repr") should return a string that says without ambiguity what the object is. By convention it looks like the call that would rebuild the object. `__str__` is a separate, optional, human-friendly form:

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

Go through the output.

1. `print(v)` used `__str__`: the friendly form with units.
2. `repr(v)` used `__repr__`: the rebuild-me form.
3. The list printed each element with `repr`, not `str`.
4. The f-string used `str` for `{v}` and `repr` for `{v!r}`.
5. `eval(repr(v))` rebuilt a `Vec3` from the text, and its `x` came back as 410.0.

Line 3 is the one to remember: **a container always shows its elements' `repr`, never their `str`**. That is why `__repr__` is the one to write first, and `__str__` the one you may never write at all. If you define only `__repr__`, `str()` falls back to it and everything prints usefully. If you define only `__str__`, lists, dicts and tracebacks still show hexadecimal.

The `!r` inside the f-string (read "bang r") applies `repr` to that field. It matters most for strings. `f"Sensor({self.name})"` gives `Sensor(imu)`, while `f"Sensor({self.name!r})"` gives `Sensor('imu')`. Only the second tells you the name was text, and only the second would show a stray trailing space.

The **[[`eval`|eval-danger]]** on the last line is not something to do in real code. It is a test of whether the repr is faithful, and passing that test is a good goal.

::: warning
A `__repr__` that can crash is a liability, because you need it most when the object is in a state you did not expect:

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

An empty run is exactly the case you were debugging, and now the debugger cannot show it to you. Handle the odd cases inside `__repr__`, or print only fields that always exist.
:::

## __eq__, and the two things it changes

By default, `a == b` asks "are these the very same object?" Two separate vectors with the same numbers are not equal. Define `__eq__` and you get comparison by value instead. You also, without being told, lose **hashability** — the ability to go in a set or be a dict key:

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

Line by line: `a == b` is now `True` although `a is b` is `False` — equal values, different objects. `Vec3Eq.__hash__` is `None`. Putting `a` in a set, `{a}`, raises `TypeError: unhashable type`.

Python does that on purpose. A set or dict finds things by their **hash** — a whole number computed from the object, used like a locker number to decide which **[[bucket|hash-buckets]]** to look in. The rule is: *objects that compare equal must hash equal*. Otherwise two equal vectors could sit in different buckets, and `v in seen` could be `False` for a vector that is in `seen`. Python cannot guess a hash that matches your new idea of equality, so it removes the old one. A clear `TypeError` is much better than a set that quietly lies.

So: if instances must go in a set or be dict keys, define `__hash__` too, over the same fields as `__eq__`. Do it only if those fields never change after construction. The last two lines show it working: `c == d`, and a set holding both has one element. If the object is meant to change, leaving it unhashable is the correct answer, not an oversight.

::: key
Defining `__eq__` sets `__hash__` to `None` and makes instances unhashable. Define `__hash__` explicitly over the same fields — and only for objects whose fields do not change — or use a frozen dataclass, which does both for you.
:::

## __add__, __mul__ and NotImplemented

Operators go through dunder methods. `a + b` tries `type(a).__add__(a, b)`, and `a * k` tries `type(a).__mul__(a, k)`.

What if the left operand does not know how to combine with the right one? The correct response is to `return NotImplemented`. That is a special built-in value meaning "not me — ask the other side". It is returned, not raised. Python then tries the **reflected** method on the right operand, `type(b).__radd__(b, a)` (read "dunder r-add"). Only if that also declines does Python raise a `TypeError` naming both types. The whole handshake is the **[[operator dispatch|dispatch-flow]]**.

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

Walk through the output.

1. `thrust + drag` called `__add__` and gave the sum, component by component: $(0 - 12{,}000,\ 0,\ 760{,}000 + 0)$.
2. `abs(total)` called `__abs__`, the length: $\sqrt{12{,}000^2 + 760{,}000^2} \approx 760{,}095\,\mathrm{N}$. That is a hair more than the biggest component, as it should be for a mostly-vertical force.
3. `total * 0.5 == 0.5 * total` is `True`. The left side used `__mul__`; the right side used `__rmul__`.
4. `list(total)` went through `__iter__`, which is a generator yielding the three components. `len(total)` called `__len__`.
5. `total + 1` failed with Python's own clear message.

The line `__rmul__ = __mul__` is what makes `0.5 * total` work. When Python sees `0.5 * total`, it first asks the float `0.5` to multiply by a `Vec3`. The float has no idea how, so it returns `NotImplemented`. Python then asks `total.__rmul__(0.5)`.

Scalar multiplication **commutes** — the order does not matter — so the reflected method can be the same function. For an operation that does *not* commute, such as a quaternion product or a matrix product, `__rmul__` must be written separately and must not call `__mul__`. Otherwise `q1 * q2` and `q2 * q1` give the same answer, and every rotation composed in the wrong order is silently wrong.

::: note
The quaternion case is worth stating precisely, because you will build one in this module's exercise. A **[[quaternion|hamilton-bridge]]** is a four-part number used to store a spacecraft's attitude. Scalar first, it is $q = w + x\,i + y\,j + z\,k$, with the basis rules $i^2 = j^2 = k^2 = ijk = -1$. From those follow $ij = k$, $jk = i$, $ki = j$, and each reversed product gets a minus sign: $ji = -k$.

Write $q = (w, \mathbf{v})$ with $\mathbf{v} = (x, y, z)$. The **Hamilton product** is

$$q_1 q_2 = \left(w_1 w_2 - \mathbf{v}_1 \cdot \mathbf{v}_2,\; w_1 \mathbf{v}_2 + w_2 \mathbf{v}_1 + \mathbf{v}_1 \times \mathbf{v}_2\right)$$

The cross product $\mathbf{v}_1 \times \mathbf{v}_2$ is what makes it non-commutative. Swapping the operands flips the sign of that term and leaves the rest alone.

The **conjugate** is $q^{*} = (w, -\mathbf{v})$. The **norm** is $\lVert q \rVert = \sqrt{w^2 + x^2 + y^2 + z^2}$. And $q q^{*} = (\lVert q \rVert^2, \mathbf{0})$. That last identity is the one to test an implementation against: the vector part must come out zero to within rounding. For $q = (1, 2, 3, 4)$, $\lVert q \rVert^2 = 1 + 4 + 9 + 16 = 30$, so $q q^{*} = (30, 0, 0, 0)$.

A unit quaternion (norm 1) represents a rotation. So `normalized()` is not tidying: it restores the property that makes the object mean anything. Normalizing a zero quaternion is undefined and should raise rather than divide by zero. With the convention in the exercise, applying $q_1 q_2$ to a vector means applying $q_2$ first, then $q_1$ — the same right-to-left reading as matrices.
:::

The final `TypeError` came from Python, not from the class, and it names both types. That message is what `return NotImplemented` buys. Had `__add__` raised `TypeError("expected a Vec3")` itself, Python would never have tried `int.__radd__`. And a future `Vec3 + numpy.ndarray` could not work either.

## The float trap in __eq__

`__eq__` built from `==` on floats is *exact* comparison. Computed floats are almost never exactly equal. Watch ten steps of 0.1:

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

Ten steps of 0.1 do not add up to 1.0. The reason is that 0.1 cannot be written exactly in binary, the same way $1/3$ cannot be written exactly in decimal. Each step adds a tiny rounding error, and the sum ends up short by about $1.1 \times 10^{-16}$. That is **one [[ulp|ulp-picture]]** — one "unit in the last place", the smallest possible gap between two floats at that size.

A test written as `assert state == expected` might pass on your machine. Then it fails on a machine whose **[[math library|libm]]** rounds a sine slightly differently, and it gets labeled "flaky" and retried until it passes.

The fix is *not* to make `__eq__` tolerant. A tolerant `==` breaks rules the language relies on. It is not **[[transitive|transitivity]]**: `a == b` and `b == c` no longer mean `a == c`, and a dict lookup built on it would give answers that depend on the order you inserted things. Keep `__eq__` exact, and put the tolerance in a named method, as `Vec3.isclose` does above. Then each call site says which comparison it meant.

::: key
Exact float comparison is the trap in `__eq__` on a state vector: two states that differ by one ulp compare unequal, so an equality test built for convenience becomes a flaky test. Keep `__eq__` exact and never use it for numerical checks; compare with a tolerance in an explicit method such as `isclose`. And defining `__eq__` sets `__hash__` to `None` unless you define it.
:::

::: example Making a container behave like one
`__len__` and `__iter__` turn a class that *holds* things into a class that *is* a sequence. Then `len`, `for`, `max`, `sum`, unpacking and truth tests all work on it. Here is a trajectory: a list of (time, velocity) pairs.

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

Step through what each line used.

1. `print(traj)` used `__repr__`, which handles the empty case safely — the lesson of the warning above.
2. `len(traj)` called `__len__` and gave 4. `bool(traj)` was `True`. There is no `__bool__`, so Python asked `__len__`: nonzero means true.
3. `traj[1]` called `__getitem__` with 1 and returned the second sample.
4. `traj[-1][0]` worked with a negative index, because `__getitem__` hands the index to a list, and lists understand $-1$ as "the last one".
5. `max(abs(v) for _, v in traj)` looped through `__iter__`. The biggest speed is the last one: $\sqrt{43^2 + 4.8^2} \approx 43.27\,\mathrm{m/s}$. Sanity check: a bit more than 43, since the vertical part is small.
6. The list comprehension also looped through `__iter__`.
7. The empty trajectory printed safely and was **falsy** — treated as false by `if`.

Four dunder methods bought all of that, and no caller had to be taught anything new. The falsy empty container is why `if traj:` is the natural way to test for emptiness, rather than `if len(traj) > 0:`.

Notice also that the tuple printed its `Vec3` with `repr`, so `Vec3(12.0, 0.0, 1.5)` appears instead of an address. A good repr on a small class pays off in every container that holds it.
:::

::: example Where NotImplemented earns its keep
Adding a `Vec3` to something that is not a `Vec3` is the case to get right. Get it wrong and other people's types can never work with yours.

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

Here is the handshake for `v + Offset(0.5, 0.0, -1.0)`, one step at a time.

1. Python calls `Vec3.__add__(v, offset)`. The other object is not a `Vec3`, so it returns `NotImplemented`.
2. Python turns to the right operand and calls `Offset.__radd__(offset, v)`. That method does know what to do.
3. It returns $(1 + 0.5,\ 2 + 0,\ 3 - 1) = (1.5, 2.0, 2.0)$, which is what printed.

For `v + "north"`, step 1 declines, the string has no `__radd__` that accepts a `Vec3`, and Python raises its own clear error.

`Offset` is a class `Vec3` has never heard of, and it still works. A `Vec3` that raised instead of declining would have made this impossible — and with it every future pairing: with a NumPy array, a units library, or a colleague's frame-aware vector type.
:::

## Check yourself

::: check
A class defines `__str__` and not `__repr__`. What does a list of ten of them print, and why is that the wrong way round?
:::

::: answer
It prints ten copies of the default `<module.Class object at 0x...>`. Containers format their elements with `repr`, never with `str`. So a class with only `__str__` looks informative when printed alone and useless in every list, dict, tuple, traceback and debugger window.

The fallback runs the other way: if only `__repr__` is defined, `str(obj)` and `print(obj)` use it. So `__repr__` is the one to write first. `__str__` is worth adding only when a separate human-facing form — with units, with rounding — really helps.
:::

::: check
You add `__eq__` to a `Waypoint` class. The next test run fails with `TypeError: unhashable type: 'Waypoint'` in code you did not touch. Explain, and give two fixes.
:::

::: answer
Defining `__eq__` sets `__hash__` to `None` on the class, so instances can no longer go in a set or be dict keys. The untouched code was doing exactly that — removing duplicate waypoints with a set, or keying a dict by waypoint. It worked before because the inherited default hashed by identity.

The reason for the behavior is the rule that equal objects must hash equal. The old identity hash would put two now-equal waypoints in different buckets, so `wp in seen` could be `False` for a waypoint equal to one in the set.

Fix one: define `__hash__` over the same fields `__eq__` uses, `return hash((self.lat, self.lon, self.alt))`. That is correct only if those fields never change after construction. Fix two: make the class a frozen dataclass, which generates a matching `__eq__` and `__hash__` and enforces the unchangeability the hash depends on. The next lesson does exactly that.
:::

::: check
Why should `__eq__` compare floats exactly rather than with a tolerance, given that exact comparison of computed floats almost always fails?
:::

::: answer
Because a tolerant equality breaks the rules of equality. With a tolerance of one millimeter, a point at 0 mm equals one at 0.9 mm, and that one equals a point at 1.8 mm — but the first and last are 1.8 mm apart, so they are not equal. Transitivity fails. Everything that relies on equality — sets, dict keys, `in`, `list.index`, `list.count` — then gives answers that depend on order.

So `__eq__` stays exact, and the tolerance goes in a named method such as `isclose`, or in `math.isclose` or `numpy.allclose` at the call site. The call site then states which comparison it meant. That also makes a failing test readable: "these differed by 3e-9 with a tolerance of 1e-12" is a diagnosis, where "not equal" is not.
:::

::: check
`Vec3.__mul__` returns `NotImplemented` for a non-numeric operand instead of raising `TypeError`. Give a concrete thing that would stop working if it raised.
:::

::: answer
Any right-hand operand that knows how to handle a `Vec3` itself. Think of `Vec3 * SomeUnitsQuantity`, `Vec3 * numpy.ndarray`, or a colleague's `Dcm` (rotation matrix) class that defines `__rmul__` to rotate a vector. In each case Python's rule is: try the left operand's `__mul__`, and on `NotImplemented`, try the right operand's `__rmul__`. Raising from `__mul__` ends the handshake at step one, and the right operand never gets asked.

You also lose the standard error message. Python's own `TypeError: unsupported operand type(s) for *: 'Vec3' and 'str'` names both types and the operator. A hand-written raise usually names neither well.
:::

::: check
`Trajectory` defines `__len__` but no `__bool__`. What does `if traj:` do for a trajectory with zero samples, and what would happen if the class defined neither?
:::

::: answer
With `__len__` and no `__bool__`, `bool(traj)` calls `__len__` and treats zero as false. So `if traj:` is false for an empty trajectory and true otherwise, which is what you want.

If the class defined neither, every instance would be truthy, including the empty one. The default for an object with no `__bool__` and no `__len__` is `True`. That is the failure where a guard meant to skip empty runs never skips anything, and the code below it gets an empty trajectory it was written to assume away.
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
| `__abs__` | `abs(x)` | Natural home for a vector's length |
| `__len__` | `len(x)`, and `bool(x)` when there is no `__bool__` | Empty means falsy |
| `__iter__` | `for`, comprehensions, `max`, `sum`, unpacking | Return an iterator, or be a generator with `yield` |
| `__getitem__` | `x[i]` | Handing the index to a list gives negative indices and slices for free |
| Measured here | — | Ten additions of 0.1 gave 0.9999999999999999, short by $1.1\times 10^{-16}$ (one ulp) |

The next lesson removes most of the typing. `__init__`, `__repr__`, `__eq__` and a matching `__hash__` over a fixed list of fields is such a common need that Python can write them for you, from type annotations, with `@dataclass`.

::: context dunder-name Why the double underscores
The underscores mark names that belong to Python itself. No ordinary program would name a method `__len__` by accident, so the language can hook into those names without ever clashing with yours.

Older books call these "magic methods" or "special methods". The official documentation says "special method names". Programmers shortened "double underscore len double underscore" to "dunder len", and the name stuck. Rule of thumb: write dunder methods to plug into Python, but do not invent new ones of your own — future Python versions may claim the name.
:::

::: context hex-address What the 0x number is
`0x7f39bc96d690` is a number written in **hexadecimal** — base 16, using digits 0 to 9 and letters a to f. The `0x` in front says "this is hex". It is the object's address in your computer's memory, and `id(v)` gives the same value in ordinary decimal.

Hex is used because every hex digit is exactly four binary bits, so memory addresses are shorter and tidier in hex. For debugging, though, an address says only *which* object, never *what* is in it — which is why a real `__repr__` beats it.
:::

::: context eval-danger Why eval stays in the test
`eval(text)` runs a string as Python code. `eval("Vec3(410.0, -3.2, 88.0)")` builds a vector, but `eval` would run *any* code in that string, including code that deletes files. Never call it on text from a file, a network or a user.

Here it serves only as a round-trip check: if pasting your repr back into Python gives an equal object, the repr is faithful. For reading data safely, use a real parser such as `json.loads`, or `ast.literal_eval` for plain numbers, strings, lists and dicts.
:::

::: context hash-buckets How a set finds things fast
A set does not search item by item. It computes each item's hash and uses it to pick one bucket, then checks only the few items in that bucket with `==`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="62" width="92" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="56" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">Vec3(1,2,3)</text>
  <line x1="102" y1="77" x2="140" y2="77" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="146,77 136,72 136,82" fill="#1f2a44"/>
  <text x="124" y="68" font-size="11" text-anchor="middle" fill="#6c7a93">hash</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="150" y="12" width="60" height="28"/>
    <rect x="150" y="40" width="60" height="28"/>
    <rect x="150" y="68" width="60" height="28" fill="#8fb8f0"/>
    <rect x="150" y="96" width="60" height="28"/>
    <rect x="150" y="124" width="60" height="28"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="31">bucket 0</text><text x="180" y="59">bucket 1</text><text x="180" y="87">bucket 2</text>
    <text x="180" y="115">bucket 3</text><text x="180" y="143">bucket 4</text>
  </g>
  <line x1="210" y1="82" x2="236" y2="82" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="240" y="68" width="110" height="28" rx="5" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="295" y="87" font-size="11" text-anchor="middle" fill="#1d6fd1">then check with ==</text>
</svg>
```

If two equal objects had different hashes, they would land in different buckets, and the `==` check would never even run. That is why "equal must mean same hash" is not negotiable.
:::

::: context dispatch-flow The handshake behind a + b
Every binary operator follows the same short script. Here it is for `a + b`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="10" width="160" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">a.__add__(b)</text>
  <line x1="180" y1="40" x2="180" y2="76" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,82 175,72 185,72" fill="#b4232c"/>
  <text x="188" y="62" font-size="11" fill="#b4232c">NotImplemented</text>
  <rect x="100" y="84" width="160" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">b.__radd__(a)</text>
  <line x1="180" y1="114" x2="180" y2="150" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,156 175,146 185,146" fill="#b4232c"/>
  <text x="188" y="136" font-size="11" fill="#b4232c">NotImplemented</text>
  <rect x="100" y="158" width="160" height="30" rx="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="178" font-size="12" text-anchor="middle" fill="#b4232c">raise TypeError</text>
  <line x1="260" y1="25" x2="300" y2="25" stroke="#1d6fd1" stroke-width="2"/>
  <text x="304" y="29" font-size="11" fill="#1d6fd1">result</text>
  <line x1="260" y1="99" x2="300" y2="99" stroke="#1d6fd1" stroke-width="2"/>
  <text x="304" y="103" font-size="11" fill="#1d6fd1">result</text>
</svg>
```

Any other return value stops the script and becomes the answer. Raising an exception also stops it — which is why a method that raises too early shuts the right operand out. (One wrinkle: if `b`'s type is a subclass of `a`'s and provides its own reflected method, Python asks `b` first.)
:::

::: context hamilton-bridge A formula carved into a bridge
The Irish mathematician William Rowan Hamilton spent years trying to multiply triples of numbers the way complex numbers multiply pairs. On 16 October 1843, walking along the Royal Canal in Dublin, he realized he needed *four* parts, not three. He carved $i^2 = j^2 = k^2 = ijk = -1$ into Broom Bridge on the spot. A plaque there marks it today.

Quaternions later fell out of fashion, pushed aside by vector notation, until spacecraft attitude control and computer graphics revived them in the twentieth century. They describe a rotation with four numbers, never hit the "gimbal lock" dead spots that three angles can, and are cheap to renormalize, so flight software stores attitude as a unit quaternion.
:::

::: context ulp-picture How far apart floats are near 1
A 64-bit float cannot hold every number. Between 0.5 and 1, neighboring floats are $2^{-53} \approx 1.1 \times 10^{-16}$ apart. Between 1 and 2 the gap doubles to $2^{-52} \approx 2.2 \times 10^{-16}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="50" x2="350" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="60" y1="42" x2="60" y2="58"/><line x1="120" y1="42" x2="120" y2="58"/>
    <line x1="180" y1="38" x2="180" y2="62"/><line x1="300" y1="42" x2="300" y2="58"/>
  </g>
  <circle cx="120" cy="50" r="5" fill="#b4232c"/>
  <text x="120" y="30" font-size="11" text-anchor="middle" fill="#b4232c">0.9999999999999999</text>
  <text x="180" y="78" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">1.0</text>
  <text x="150" y="98" font-size="11" text-anchor="middle" fill="#1d6fd1">gap 2^-53</text>
  <text x="245" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">gap 2^-52 (twice as wide)</text>
</svg>
```

The sum of ten 0.1s landed on the float right below 1.0, exactly one gap short: $1 - 2^{-53}$. That one gap is what "one ulp" means in this lesson.
:::

::: context libm Why different machines disagree
Functions like `sin`, `exp` and `log` are computed by a **math library**, usually called **libm** on Linux. The C standard does not require these functions to give the correctly rounded answer to the last bit, so different libraries — or different versions, or different processors — may return results that differ by an ulp.

Basic arithmetic (`+`, `-`, `*`, `/`, square root) is different: the IEEE 754 standard requires it to be correctly rounded, so it agrees everywhere. The mismatch creeps in through the transcendental functions a simulation calls millions of times.
:::

::: context transitivity The three rules equality must keep
Mathematicians call a proper "sameness" relation an **equivalence relation**. It must obey three rules:

- **reflexive**: every `a == a`;
- **symmetric**: if `a == b` then `b == a`;
- **transitive**: if `a == b` and `b == c` then `a == c`.

Sets, dicts and sorting all quietly assume these. A "within 1 mm" comparison keeps the first two and breaks the third, which is why it belongs in a method with its own name.

One surprising exception: the float `nan` ("not a number") breaks the *first* rule, since `nan == nan` is `False`.
:::
