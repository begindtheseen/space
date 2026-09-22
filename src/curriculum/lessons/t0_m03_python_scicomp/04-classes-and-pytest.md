---
id: l04-classes-and-pytest
title: "Classes and pytest: a tested Vec3 and Quaternion"
minutes: 20
covers:
  - Python syntax, control flow, functions, classes
  - pytest and test-driven numerical code
---

A quaternion is four numbers, but it is not *any* four numbers: it must stay at unit length, it multiplies by a rule that is not commutative, and it rotates vectors only when used in a specific sandwich. Carry those four numbers around as a bare list and every one of those facts lives in your head instead of in the code. A *class* moves them into the code: the data and the operations that are legal on it travel together, so `q1 * q2` means the Hamilton product and nothing else, and `q.rotate(v)` cannot be called with the arguments in the wrong order.

The second half of this lesson is about proving that such a class is right. Flight software does not trust a rotation routine because it looked correct; it trusts it because a test suite exercises its defining properties on every commit, and turns red when a sign flips. The module's objective "write a unit-tested module with a real pytest suite" is exactly this. You will write a `Vec3` and a `Quaternion`, then a `test_vecquat.py` that would catch the bugs these types actually suffer from.

Everything here runs in the app's Python playground; the `pytest` command itself is for a terminal in the project directory from the last lesson.

## Classes: data and behaviour together

A class is a template for objects. `class Vec3:` opens one; inside it, functions are called *methods*, and the special method `__init__` runs when an object is created. Every method's first parameter, conventionally `self`, is the object itself — Python fills it in for you when you write `v.norm()`, which is `Vec3.norm(v)` spelled the readable way. Attributes are stored on `self` with a dot:

```python
import math

class Vec3:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    def norm(self):
        return math.sqrt(self.x**2 + self.y**2 + self.z**2)

v = Vec3(3.0, 4.0, 12.0)
print(v.x, v.norm())          # 3.0 13.0
```

`Vec3(3.0, 4.0, 12.0)` calls `__init__` with a fresh object as `self`; the result is an *instance* of `Vec3`. `type(v)` reports `<class '__main__.Vec3'>`. Methods can call other methods through `self`, and they can return new instances, which is how arithmetic on your own types is built.

### Dataclasses

Writing `__init__` by hand for every class is tedious, and the version above lacks a readable `print(v)` and a sensible `==`. The `dataclasses` module generates all three from a list of typed fields:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Vec3:
    x: float
    y: float
    z: float

v = Vec3(3.0, 4.0, 12.0)
print(v)                        # Vec3(x=3.0, y=4.0, z=12.0)
print(v == Vec3(3.0, 4.0, 12.0))  # True
```

The `@dataclass` line is a *decorator*: a function that takes the class and hands back an improved one. `frozen=True` makes instances immutable — `v.x = 5.0` raises `FrozenInstanceError` — which is what you want for a vector: a value, not a container that some other function might quietly edit. Immutable instances can also be used as dictionary keys and set members.

### Operators are methods

`a + b` on two objects calls `a.__add__(b)`. Define that method and your class gains the operator; the double-underscore names are called *dunder* methods. The ones a vector type needs are `__add__`, `__sub__`, `__neg__`, `__mul__` (for `v * k`) and `__rmul__` (for `k * v`, when the left operand is a plain number and does not know how to multiply a `Vec3`):

```python
@dataclass(frozen=True)
class Vec3:
    x: float
    y: float
    z: float

    def __add__(self, o):
        return Vec3(self.x + o.x, self.y + o.y, self.z + o.z)

    def __sub__(self, o):
        return Vec3(self.x - o.x, self.y - o.y, self.z - o.z)

    def __mul__(self, k):
        return Vec3(k * self.x, k * self.y, k * self.z)

    __rmul__ = __mul__

    def __neg__(self):
        return self * -1.0

    def dot(self, o):
        return self.x * o.x + self.y * o.y + self.z * o.z

    def cross(self, o):
        return Vec3(self.y * o.z - self.z * o.y,
                    self.z * o.x - self.x * o.z,
                    self.x * o.y - self.y * o.x)

    def norm(self):
        return math.sqrt(self.dot(self))

    def normalized(self):
        n = self.norm()
        if n == 0.0:
            raise ZeroDivisionError("cannot normalise the zero vector")
        return self * (1.0 / n)

print(Vec3(1, 2, 3) + Vec3(4, 5, 6))   # Vec3(x=5, y=7, z=9)
print(2 * Vec3(1, 2, 3))               # Vec3(x=2, y=4, z=6)
```

Two design choices are worth noticing. `__rmul__ = __mul__` says that `2 * v` and `v * 2` mean the same thing. And `normalized` raises rather than returning a vector of `nan`: a zero-length thrust direction is a caller's bug, and an exception at the point of the mistake is far cheaper than a `nan` that surfaces three functions later.

## The geometry the methods encode

The dot and cross products are the two ways to multiply 3-vectors, and each has a geometric reading you should be able to state without thinking:

::: key
For two 3-vectors, $\mathbf{a}\cdot\mathbf{b} = |\mathbf{a}|\,|\mathbf{b}|\cos\theta$ is a scalar: the projection of one onto the other. $\mathbf{a}\times\mathbf{b}$ is a vector perpendicular to both, of magnitude $|\mathbf{a}|\,|\mathbf{b}|\sin\theta$, with direction given by the right-hand rule. Here $\theta$ is the angle between the vectors.
:::

In components, with $\mathbf{a} = (a_x, a_y, a_z)$ and $\mathbf{b} = (b_x, b_y, b_z)$:

$$
\mathbf{a}\cdot\mathbf{b} = a_x b_x + a_y b_y + a_z b_z,
\qquad
\mathbf{a}\times\mathbf{b} = \begin{pmatrix} a_y b_z - a_z b_y \\ a_z b_x - a_x b_z \\ a_x b_y - a_y b_x \end{pmatrix}.
$$

The cross-product pattern is cyclic — $x$ from $y$ and $z$, $y$ from $z$ and $x$, $z$ from $x$ and $y$ — and swapping the operands flips the sign: $\mathbf{b}\times\mathbf{a} = -\mathbf{a}\times\mathbf{b}$. That anticommutativity is the first thing a test should pin down, because a transposed pair of indices in `cross` produces a vector of the right length pointing the wrong way.

::: example Angle between two vectors
Take $\mathbf{a} = (1, 2, 3)$ and $\mathbf{b} = (4, 5, 6)$. The dot product is $4 + 10 + 18 = 32$. The norms are $|\mathbf{a}| = \sqrt{14} \approx 3.742$ and $|\mathbf{b}| = \sqrt{77} \approx 8.775$, so

$$
\cos\theta = \frac{32}{\sqrt{14}\sqrt{77}} = \frac{32}{\sqrt{1078}} \approx 0.97463,
\qquad
\theta \approx 12.93^\circ.
$$

The cross product is $(2\cdot 6 - 3\cdot 5,\; 3\cdot 4 - 1\cdot 6,\; 1\cdot 5 - 2\cdot 4) = (-3, 6, -3)$, of length $\sqrt{9 + 36 + 9} = \sqrt{54} \approx 7.348$. Check against the geometric form: $|\mathbf{a}||\mathbf{b}|\sin\theta = \sqrt{1078}\,\sin 12.93^\circ \approx 7.348$. Both readings agree, and $(-3, 6, -3)\cdot(1, 2, 3) = -3 + 12 - 9 = 0$ confirms the result is perpendicular to $\mathbf{a}$.

```python
a, b = Vec3(1, 2, 3), Vec3(4, 5, 6)
print(a.dot(b))                                   # 32
print(a.cross(b))                                 # Vec3(x=-3, y=6, z=-3)
print(math.degrees(math.acos(a.dot(b) / (a.norm() * b.norm()))))  # 12.933154491899135
```
:::

## A Quaternion class

A unit quaternion encodes a rotation. This curriculum stores it *scalar-first*, $q = (w, x, y, z)$, with scalar part $w$ and vector part $\mathbf{q}_v = (x, y, z)$. A rotation by angle $\phi$ about a unit axis $\hat{\mathbf{n}}$ is

$$
q = \left(\cos\tfrac{\phi}{2},\; \hat{\mathbf{n}}\sin\tfrac{\phi}{2}\right).
$$

Quaternions compose by the *Hamilton product*. For $p = (p_w, \mathbf{p}_v)$ and $q = (q_w, \mathbf{q}_v)$:

$$
p \otimes q = \begin{pmatrix} p_w q_w - \mathbf{p}_v\cdot\mathbf{q}_v \\ p_w\,\mathbf{q}_v + q_w\,\mathbf{p}_v + \mathbf{p}_v\times\mathbf{q}_v \end{pmatrix}.
$$

The cross term makes the product non-commutative — $p \otimes q \ne q \otimes p$ in general — which is right, because rotations do not commute either. The *conjugate* $q^* = (w, -\mathbf{q}_v)$ undoes a unit rotation: $q \otimes q^* = (1, 0, 0, 0)$, the identity. The norm is $|q| = \sqrt{w^2 + x^2 + y^2 + z^2}$, and the norm of a product is the product of the norms, $|p \otimes q| = |p|\,|q|$, so a product of unit quaternions stays unit — up to round-off.

Rotating a vector $\mathbf{v}$ is the sandwich $q \otimes (0, \mathbf{v}) \otimes q^*$. Expanding that product for a unit $q$ and dropping the (zero) scalar part gives a cheaper form with no quaternion multiplications:

$$
\mathbf{v}' = \mathbf{v} + 2w\,(\mathbf{q}_v\times\mathbf{v}) + 2\,\mathbf{q}_v\times(\mathbf{q}_v\times\mathbf{v}).
$$

Finally, $q$ and $-q$ produce the same rotation: negating all four components leaves the sandwich unchanged because $q$ appears twice. This is the *double cover*, and it means a test that compares quaternions must compare rotations, not components.

```python
@dataclass(frozen=True)
class Quaternion:
    w: float
    x: float
    y: float
    z: float

    def __mul__(self, o):
        """Hamilton product self ⊗ o."""
        return Quaternion(
            self.w*o.w - self.x*o.x - self.y*o.y - self.z*o.z,
            self.w*o.x + self.x*o.w + self.y*o.z - self.z*o.y,
            self.w*o.y - self.x*o.z + self.y*o.w + self.z*o.x,
            self.w*o.z + self.x*o.y - self.y*o.x + self.z*o.w,
        )

    def conjugate(self):
        return Quaternion(self.w, -self.x, -self.y, -self.z)

    def norm(self):
        return math.sqrt(self.w**2 + self.x**2 + self.y**2 + self.z**2)

    def normalized(self):
        n = self.norm()
        return Quaternion(self.w / n, self.x / n, self.y / n, self.z / n)

    def rotate(self, v):
        qv = Vec3(self.x, self.y, self.z)
        t = qv.cross(v)
        return v + 2.0 * self.w * t + 2.0 * qv.cross(t)
```

::: key
Why unit-test a quaternion normalisation routine: a quaternion that drifts off unit norm silently corrupts the DCM built from it — the rotation picks up a scale factor and stops being orthonormal, so every rotated vector is subtly wrong with no exception thrown. Nothing in the arithmetic complains; only a test that checks $|q| = 1$ and $|\mathbf{v}'| = |\mathbf{v}|$ does.
:::

The expanded `rotate` above assumes $|q| = 1$. If the quaternion has norm $1.01$ — a one per cent drift, easily accumulated by integrating attitude rates for a few minutes without renormalising — the rotated vector comes out $1.01^2 \approx 1.02$ times too long. Position estimates then grow by two per cent per rotation through the attitude, and no exception is ever raised.

::: example Ninety degrees about z
A rotation of $90^\circ$ about $\hat{\mathbf{z}}$ has $\phi/2 = 45^\circ$, so $q = (\cos 45^\circ, 0, 0, \sin 45^\circ) \approx (0.7071, 0, 0, 0.7071)$. Applying it to $\hat{\mathbf{x}}$:

```python
h = math.radians(45)
q = Quaternion(math.cos(h), 0.0, 0.0, math.sin(h))
print(q.norm())                    # 1.0
print(q.rotate(Vec3(1.0, 0.0, 0.0)))
# Vec3(x=2.220446049250313e-16, y=1.0, z=0.0)
print(q * q.conjugate())           # Quaternion(w=1.0, x=0.0, y=0.0, z=0.0)
print(q * q)
# Quaternion(w=2.220446049250313e-16, x=0.0, y=0.0, z=1.0)
```

$\hat{\mathbf{x}}$ goes to $\hat{\mathbf{y}}$, as a right-handed $90^\circ$ turn about $\hat{\mathbf{z}}$ should; the $2.2 \times 10^{-16}$ where a zero belongs is one unit of float64 round-off, the subject of a later lesson. $q \otimes q$ is a $180^\circ$ rotation, $(\cos 90^\circ, 0, 0, \sin 90^\circ) = (0, 0, 0, 1)$, again to round-off. Notice that none of these results is *exactly* what the algebra promises — which is why the tests below never compare floats with `==`.
:::

## pytest

pytest is a test runner. It looks for files named `test_*.py`, imports them, runs every function whose name starts with `test_`, and reports which ones raised. A test is a plain function containing plain `assert` statements — no base classes, no special methods:

```python
# test_vecquat.py
import math
import pytest
from vecquat import Vec3, Quaternion

def test_cross_is_anticommutative():
    a, b = Vec3(1, 2, 3), Vec3(4, 5, 6)
    assert a.cross(b) == -b.cross(a)

def test_cross_product_known_value():
    assert Vec3(1, 2, 3).cross(Vec3(4, 5, 6)) == Vec3(-3, 6, -3)

def test_normalized_rejects_zero_vector():
    with pytest.raises(ZeroDivisionError):
        Vec3(0, 0, 0).normalized()
```

Run it from the project directory:

```bash
python -m pytest -q
# ...                                                    [100%]
# 3 passed in 0.02s
```

When an assertion fails, pytest rewrites the `assert` to show the values on both sides, so you rarely need a message. The `with pytest.raises(...)` block passes only if the enclosed code raises that exception — the right way to test the zero-vector guard.

### Comparing floats

The two integer-valued tests above compare with `==` because the arithmetic is exact. Anything involving `sqrt`, `sin` or a division is not, and `assert q.norm() == 1.0` will fail for a perfectly good quaternion because `0.7071067811865476**2` twice does not sum to exactly `1.0`. Compare with a tolerance instead:

::: key
Assert floating-point closeness in pytest / NumPy with `assert x == pytest.approx(expected, rel=1e-9)`, or for arrays `np.testing.assert_allclose(actual, desired, rtol=..., atol=...)`. Never assert exact float equality on a computed value.
:::

`pytest.approx(expected, rel=1e-9)` accepts anything within one part in $10^9$ of `expected`; add `abs=1e-12` when the expected value is zero, because a relative tolerance on zero is zero. `np.testing.assert_allclose` does the same for whole arrays and prints the offending elements when it fails; the NumPy lesson introduces the arrays it acts on. Choose the tolerance from the arithmetic — a few units of $10^{-16}$ per operation for float64 — not by loosening it until the test passes.

```python
def test_rotation_preserves_length():
    q = Quaternion(0.5, 0.5, 0.5, 0.5)           # 120 deg about (1,1,1)/sqrt(3)
    v = Vec3(0.3, -1.2, 2.5)
    assert q.rotate(v).norm() == pytest.approx(v.norm(), rel=1e-12)

def test_q_times_conjugate_is_identity():
    q = Quaternion(0.7071067811865476, 0.0, 0.0, 0.7071067811865475)
    r = q * q.conjugate()
    assert r.w == pytest.approx(1.0, rel=1e-12)
    assert (r.x, r.y, r.z) == pytest.approx((0.0, 0.0, 0.0), abs=1e-12)

def test_product_norm_is_product_of_norms():
    p, q = Quaternion(1, 2, 3, 4), Quaternion(0.5, -1, 2, 0.25)
    assert (p * q).norm() == pytest.approx(p.norm() * q.norm(), rel=1e-12)

def test_double_cover():
    q = Quaternion(0.5, 0.5, 0.5, 0.5)
    minus_q = Quaternion(-0.5, -0.5, -0.5, -0.5)
    v = Vec3(0.3, -1.2, 2.5)
    a, b = q.rotate(v), minus_q.rotate(v)
    assert (a.x, a.y, a.z) == pytest.approx((b.x, b.y, b.z), rel=1e-12)
```

### Running the same test on many inputs

`@pytest.mark.parametrize` runs one test function once per row of a table, each row reported separately. It is how you turn a single check into a sweep over angles, axes or edge cases without copying the function:

```python
@pytest.mark.parametrize("phi_deg", [0.0, 30.0, 90.0, 179.0, 180.0, 359.0])
def test_unit_quaternion_has_unit_norm(phi_deg):
    h = math.radians(phi_deg) / 2
    q = Quaternion(math.cos(h), 0.0, math.sin(h), 0.0)
    assert q.norm() == pytest.approx(1.0, rel=1e-15)
```

`-q` (quiet) prints one character per test; `-v` names each one; `-k length` runs only tests whose names contain `length`; `-x` stops at the first failure. `python -m pytest --lf` reruns only the tests that failed last time, which is what you want in the edit–test loop.

## Test-driven numerical code

*Test-driven development* reverses the usual order: write the test first, watch it fail (red), write the least code that passes it (green), then tidy without changing behaviour (refactor). For numerical code the discipline pays twice. Writing the test first forces you to decide what "correct" means — an invariant, a known answer, an error case — before the implementation tempts you to accept whatever number it produces. And a failing test that turns green is evidence that the test can actually detect the bug it was written for.

Three kinds of test cover most numerical routines:

- **Invariant (property) tests** check something that must hold for *any* input: rotation preserves length, $q \otimes q^* = 1$, $|p \otimes q| = |p|\,|q|$, $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$. They are cheap to write and they catch entire families of bugs at once.
- **Known-answer tests** check one case you can compute by hand: $90^\circ$ about $\hat{\mathbf{z}}$ sends $\hat{\mathbf{x}}$ to $\hat{\mathbf{y}}$; $(1,2,3)\times(4,5,6) = (-3,6,-3)$. They pin down conventions — handedness, scalar-first storage, active versus passive rotation — that invariants cannot see.
- **Error tests** check that bad input raises: `Vec3(0,0,0).normalized()` raises `ZeroDivisionError` rather than returning `nan`.

Length preservation is the single most valuable invariant for a rotation library, because a rotation *is* a length-preserving linear map: an un-normalised quaternion, a component with the wrong sign in `rotate`, or a transposed direction-cosine matrix all break it. It is not sufficient on its own. Flip the sign of the entire cross term in the Hamilton product and you get a perfectly good rotation — by $-\phi$ instead of $+\phi$ — that preserves every length and sends $\hat{\mathbf{x}}$ to $-\hat{\mathbf{y}}$. Only the known-answer test sees that. A suite with both is what the module's exercise means by a test file that "earns its keep".

::: example Test-driving `normalized`
Write the test before the method exists:

```python
def test_normalized_has_unit_norm():
    v = Vec3(3.0, 4.0, 12.0)
    assert v.normalized().norm() == pytest.approx(1.0, rel=1e-15)
    assert v.normalized() == Vec3(3.0, 4.0, 12.0) * (1.0 / 13.0)
```

Running `pytest -q` gives `AttributeError: 'Vec3' object has no attribute 'normalized'` — red. Add the one-line method `return self * (1.0 / self.norm())` — green; $\sqrt{9 + 16 + 144} = 13$ exactly, so the second assertion is exact too. Now add `test_normalized_rejects_zero_vector` from above. It passes at once, because `1.0 / 0.0` already raises `ZeroDivisionError` — behaviour you got for free. The test still earns its place: it turns that accident into a promise, and will go red if someone later rewrites the method with `self * (self.norm() ** -1)` or a NumPy division that returns `inf` instead of raising. The refactor step replaces the accidental error with the explicit guard and message shown in the class. Finally, the deliberate-sabotage check: change `self.y * o.z - self.z * o.y` in `cross` to `self.y * o.z + self.z * o.y` and run the suite. `test_cross_is_anticommutative` and `test_cross_product_known_value` both fail, and `test_rotation_preserves_length` fails too, because `rotate` calls `cross`. Restore the sign; the suite is green and has proved it can see the bug.
:::

::: warning Testing the implementation against itself
`assert q.rotate(v) == rotate_with_same_formula(q, v)` proves nothing: both sides share the error. Every test needs an independent source of truth — an algebraic identity, a hand computation, a textbook value, or an entirely different method (the sandwich product against the expanded formula, for instance).
:::

::: warning Tolerances chosen to pass
If a test fails at `rel=1e-12` and passes at `rel=1e-6`, the arithmetic is telling you something — usually that a quaternion is not being renormalised, or that two different conventions are being mixed. Find out why before touching the tolerance.
:::

::: note
In the app's playground there is no `pytest` command, but every test above is an ordinary function: paste the classes and the tests into one cell and call `test_rotation_preserves_length()` directly. A silent return is a pass; an `AssertionError` is a failure. For `pytest.approx` use `from pytest import approx` if the package is present, or compare with `abs(a - b) <= tol` while exploring.
:::

## Check yourself

::: check
Why does `2 * Vec3(1, 2, 3)` require `__rmul__` when `Vec3(1, 2, 3) * 2` works with `__mul__` alone?
:::

::: answer
`a * b` first tries `a.__mul__(b)`. For `2 * v` the left operand is the integer `2`, and `int.__mul__` does not know what a `Vec3` is, so it returns `NotImplemented`. Python then tries the *reflected* method on the right operand, `v.__rmul__(2)`. Without `__rmul__` the expression raises `TypeError`. Setting `__rmul__ = __mul__` says scalar multiplication commutes.
:::

::: check
A colleague's quaternion test suite compares `q_result` to `q_expected` component by component with `pytest.approx` and fails intermittently even though every rotated vector matches. What is the likely cause, and how should the test be written?
:::

::: answer
The double cover: $q$ and $-q$ are the same rotation, and a routine that builds a quaternion — from a DCM, from a product, from an integration step — may legitimately return either sign. Either compare rotations (rotate a few vectors with both and compare the results), or canonicalise before comparing (flip the sign so that $w \ge 0$, and compare only then), or compare $|q_1 \cdot q_2|$ to $1$, where the dot is over all four components.
:::

::: check
The frozen dataclass `Vec3` raises `FrozenInstanceError` if you write `v.x = 0.0`. Give one concrete bug that immutability prevents in GNC code.
:::

::: answer
A function receives a thrust-direction vector, "temporarily" scales it in place to work in a different unit, and forgets to scale it back; every later caller holding the same object now sees a wrong direction. With a frozen `Vec3` the in-place edit is impossible, so the function must build a new vector, and the caller's copy is untouched. The same protects a shared position vector from being normalised in place by a routine that wanted only its direction.
:::

::: check
You are testing a function that returns the period of a circular orbit, $T = 2\pi\sqrt{r^3/\mu}$, at $r = 6\,778\,137\,\mathrm{m}$ with $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$. The expected value is about $5553.6\,\mathrm{s}$. Write the assertion, and say why `assert period(r) == 5553.624271252228` is wrong even if it passes today.
:::

::: answer
```python
assert period(6_778_137.0) == pytest.approx(5553.624271252228, rel=1e-9)
```

The exact-equality form encodes one particular sequence of float64 operations. Rewriting the function as `2 * math.pi * r * math.sqrt(r / mu)` — algebraically identical — changes the last bit or two and breaks the test without any bug. A relative tolerance of $10^{-9}$ is loose enough for any correct rearrangement and tight enough that a wrong exponent or a missing $2\pi$ still fails.
:::

::: check
Name the three kinds of test in this lesson and give one example of each for a `Vec3.cross` method.
:::

::: answer
Invariant: $\mathbf{a}\times\mathbf{b}$ is perpendicular to both operands, so `a.cross(b).dot(a) == pytest.approx(0, abs=1e-12)` for any `a`, `b` — or anticommutativity, `a.cross(b) == -b.cross(a)`. Known answer: `Vec3(1,0,0).cross(Vec3(0,1,0)) == Vec3(0,0,1)`, which also pins down right-handedness. Error case: `cross` takes a `Vec3`, so `Vec3(1,2,3).cross(5)` should raise (`AttributeError` as written; a `TypeError` with a clear message if you add a check). The invariant catches sign and index slips in general; the known answer catches a consistent handedness flip that the invariant cannot see.
:::

## Summary

| Idea | Python | Notes |
| --- | --- | --- |
| Class, constructor, method | `class Vec3:`, `def __init__(self, x, y, z)`, `def norm(self)` | `self` is the instance |
| Dataclass | `@dataclass(frozen=True)` with typed fields | generates `__init__`, `__repr__`, `__eq__`; frozen = immutable |
| Operators | `__add__`, `__sub__`, `__neg__`, `__mul__`, `__rmul__` | `2 * v` needs `__rmul__` |
| Dot / cross | $\mathbf{a}\cdot\mathbf{b} = \vert \mathbf{a}\vert \vert \mathbf{b}\vert \cos\theta$; $\vert \mathbf{a}\times\mathbf{b}\vert  = \vert \mathbf{a}\vert \vert \mathbf{b}\vert \sin\theta$, right-hand rule | cross is anticommutative |
| Quaternion storage | scalar-first $(w, x, y, z)$; $q = (\cos\frac{\phi}{2}, \hat{\mathbf{n}}\sin\frac{\phi}{2})$ | $q$ and $-q$ are the same rotation |
| Hamilton product | $(p_w q_w - \mathbf{p}_v\cdot\mathbf{q}_v,\; p_w\mathbf{q}_v + q_w\mathbf{p}_v + \mathbf{p}_v\times\mathbf{q}_v)$ | not commutative; $\vert p\otimes q\vert  = \vert p\vert \vert q\vert $ |
| Rotate | $\mathbf{v} + 2w(\mathbf{q}_v\times\mathbf{v}) + 2\mathbf{q}_v\times(\mathbf{q}_v\times\mathbf{v})$ | requires $\vert q\vert  = 1$ |
| Test file / function | `test_*.py`, `def test_*():`, plain `assert` | `python -m pytest -q` |
| Float comparison | `x == pytest.approx(e, rel=1e-9)`; `np.testing.assert_allclose(a, d, rtol=, atol=)` | never `==` on computed floats |
| Exceptions, sweeps | `with pytest.raises(E):`; `@pytest.mark.parametrize` | |
| TDD | red → green → refactor; invariant, known-answer and error tests | sabotage the code once to prove the suite sees it |

The next lesson replaces the hand-written `Vec3` arithmetic with NumPy arrays, where a single expression operates on a hundred thousand vectors at once — and `np.testing.assert_allclose` becomes the assertion you reach for.
