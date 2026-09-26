---
id: l04-classes-and-pytest
title: "Classes and pytest: a tested Vec3 and Quaternion"
minutes: 24
covers:
  - Python syntax, control flow, functions, classes
  - pytest and test-driven numerical code
---

Think of a TV remote. The buttons come built in, so you never have to remember which ones work on it. This lesson does the same for numbers in your code.

A **quaternion** — four numbers that describe how a spacecraft is turned — is not *any* four numbers. It must keep a length of exactly $1$. It multiplies by its own rule, where order matters. And it turns a vector only inside one particular "sandwich". Carry those numbers as a bare list and every rule lives in your head. A **class** moves the rules into the code: the numbers and the actions allowed on them travel together, so `q1 * q2` can only mean the right product.

The second half proves the class is right. Flight software does not trust a rotation routine because it looked correct. It trusts it because a set of automatic checks — a **test suite** — runs on every change and turns red the moment a sign flips. You will write a `Vec3` and a `Quaternion`, then a `test_vecquat.py` that catches the bugs these types really suffer from.

Everything here runs in the app's playground; the `pytest` command itself is for a terminal in last lesson's project folder.

## Classes: data and behavior together

A class is like a cookie cutter: not a cookie, but the shape every cookie will have. Each cookie you press out is an **object**, also called an **instance** of the class.

`class Vec3:` opens a class. Functions written inside it are **methods** — actions that belong to the object. One special method, `__init__` (read "dunder init", short for "double underscore init"), runs every time a new object is made. It is where the object gets its starting numbers.

Every method's first input is named `self` by custom: the object itself. When you write `v.norm()`, Python runs `Vec3.norm(v)`, handing `v` over as `self`. Values stored on the object with a dot, like `self.x`, are called **attributes**.

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

`Vec3(3.0, 4.0, 12.0)` makes a fresh object and calls `__init__` with it as `self`, which stores the three numbers. The result is an instance of `Vec3`; `type(v)` reports `<class '__main__.Vec3'>`. Then `v.norm()` gives the length, $\sqrt{9 + 16 + 144} = 13$. Methods can call other methods through `self` and hand back new instances — that is how you build arithmetic for your own types.

### Dataclasses

Writing `__init__` by hand gets tedious. Worse, the class above prints as a memory address, and `==` between two equal vectors says `False`, because it only asks whether they are the very same object. The `dataclasses` module writes all three pieces for you from a list of typed fields:

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

The `@dataclass` line is a **[[decorator|decorator-word]]**: a function that takes the class and hands back an improved one. `frozen=True` makes every instance **immutable** — unchangeable after it is made. Writing `v.x = 5.0` raises `FrozenInstanceError`.

That is what you want for a vector. A vector is a *value*, like the number $7$, not a box some other function can quietly edit. Frozen instances can also be dictionary keys and set members.

### Operators are methods

When Python sees `a + b` on two objects, it runs `a.__add__(b)`. Write that method and your class gains the `+` sign. Methods with double underscores on both sides are called **[[dunder methods|dunder-names]]**.

A vector type needs five of them:

- `__add__` for `a + b`,
- `__sub__` for `a - b`,
- `__neg__` for `-a`,
- `__mul__` for `v * k`, a vector times a plain number,
- `__rmul__` for `k * v`, where the plain number on the left does not know how to multiply a `Vec3`, so Python asks the vector.

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

Two design choices are worth a second look.

First, `__rmul__ = __mul__` makes `2 * v` mean the same as `v * 2`.

Second, `normalized` — which scales a vector to length $1$, keeping its direction — **raises an error** on the zero vector instead of returning `nan` ("not a number"). A zero-length thrust direction is the caller's mistake, and an error at that line is far cheaper than a `nan` that surfaces three functions later.

## The geometry the methods encode

There are two ways to multiply two 3-vectors, and each has a picture you should be able to call up without thinking.

The **dot product** is about shadows. Shine a flashlight straight down onto vector $\mathbf{b}$ and look at the [[shadow that $\mathbf{a}$ casts on it|dot-shadow]]. The dot product is that shadow's length times the length of $\mathbf{b}$. It is a single number — a **scalar**.

The **cross product** is about twisting. Push on a wrench handle and the bolt turns about an axis at right angles to both handle and push. The cross product is a vector along that axis. You find which way it points with the **[[right-hand rule|right-hand-rule]]**: curl the fingers of your right hand from $\mathbf{a}$ toward $\mathbf{b}$, and your thumb points along $\mathbf{a}\times\mathbf{b}$.

Below, $|\mathbf{a}|$ is read "the length of a", and $\theta$ ("theta") is the angle between the vectors.

::: key
For two 3-vectors, $\mathbf{a}\cdot\mathbf{b} = |\mathbf{a}|\,|\mathbf{b}|\cos\theta$ is a scalar: the projection of one onto the other. $\mathbf{a}\times\mathbf{b}$ is a vector perpendicular to both, of magnitude $|\mathbf{a}|\,|\mathbf{b}|\sin\theta$, with direction given by the right-hand rule. Here $\theta$ is the angle between the vectors.
:::

To compute them, write each vector as its three parts, or **components**: $\mathbf{a} = (a_x, a_y, a_z)$ and $\mathbf{b} = (b_x, b_y, b_z)$. Then

$$
\mathbf{a}\cdot\mathbf{b} = a_x b_x + a_y b_y + a_z b_z,
\qquad
\mathbf{a}\times\mathbf{b} = \begin{pmatrix} a_y b_z - a_z b_y \\ a_z b_x - a_x b_z \\ a_x b_y - a_y b_x \end{pmatrix}.
$$

The cross-product pattern goes around in a circle. The $x$ part is built from $y$ and $z$. The $y$ part is built from $z$ and $x$. The $z$ part is built from $x$ and $y$.

Swapping the two vectors flips the sign: $\mathbf{b}\times\mathbf{a} = -\mathbf{a}\times\mathbf{b}$. This is **anticommutativity** ("commute": order does not matter; "anti": swapping flips the sign). It is the first thing a test should pin down, because two mixed-up letters inside `cross` give a vector of the right length pointing the wrong way.

::: example Angle between two vectors
Take $\mathbf{a} = (1, 2, 3)$ and $\mathbf{b} = (4, 5, 6)$.

**Dot product.** Multiply matching parts and add: $1\cdot 4 + 2\cdot 5 + 3\cdot 6 = 4 + 10 + 18 = 32$.

**Lengths.** $|\mathbf{a}| = \sqrt{1 + 4 + 9} = \sqrt{14} \approx 3.742$ and $|\mathbf{b}| = \sqrt{16 + 25 + 36} = \sqrt{77} \approx 8.775$.

**Angle.** Rearrange the key fact to get $\cos\theta$ on its own:

$$
\cos\theta = \frac{32}{\sqrt{14}\sqrt{77}} = \frac{32}{\sqrt{1078}} \approx 0.97463,
\qquad
\theta \approx 12.93^\circ.
$$

Small, as it should be: the two vectors point in nearly the same direction.

**Cross product.** Follow the pattern: $(2\cdot 6 - 3\cdot 5,\; 3\cdot 4 - 1\cdot 6,\; 1\cdot 5 - 2\cdot 4) = (-3, 6, -3)$. Its length is $\sqrt{9 + 36 + 9} = \sqrt{54} \approx 7.348$.

**Check with the picture.** The key fact says the length should be $|\mathbf{a}||\mathbf{b}|\sin\theta = \sqrt{1078}\,\sin 12.93^\circ \approx 7.348$. The two ways agree. And $(-3, 6, -3)\cdot(1, 2, 3) = -3 + 12 - 9 = 0$: a dot product of zero means a right angle, so the result really is perpendicular to $\mathbf{a}$.

```python
a, b = Vec3(1, 2, 3), Vec3(4, 5, 6)
print(a.dot(b))                                   # 32
print(a.cross(b))                                 # Vec3(x=-3, y=6, z=-3)
print(math.degrees(math.acos(a.dot(b) / (a.norm() * b.norm()))))  # 12.933154491899135
```
:::

## A Quaternion class

Stick a pencil through a toy rocket. Any way you could turn the rocket, you could also get by twisting it some angle about some pencil direction. So a turn needs an **axis** (the pencil, a unit vector) and an **angle**.

A **unit quaternion** packs those two things into four numbers. This course stores them **scalar-first**, $q = (w, x, y, z)$. The first number $w$ is the **scalar part**. The other three form the **vector part** $\mathbf{q}_v = (x, y, z)$, read "q sub v". A turn by angle $\phi$ (read "phi") about a unit axis $\hat{\mathbf{n}}$ (read "n hat"; the hat means length $1$) is

$$
q = \left(\cos\tfrac{\phi}{2},\; \hat{\mathbf{n}}\sin\tfrac{\phi}{2}\right).
$$

Notice the **[[half angle|why-half-angle]]**. It is not a typo.

### Multiplying quaternions

Two turns in a row make one combined turn. For quaternions, that combining is the **[[Hamilton product|hamilton]]**, written $\otimes$ (read "times" or "otimes"). For $p = (p_w, \mathbf{p}_v)$ and $q = (q_w, \mathbf{q}_v)$:

$$
p \otimes q = \begin{pmatrix} p_w q_w - \mathbf{p}_v\cdot\mathbf{q}_v \\ p_w\,\mathbf{q}_v + q_w\,\mathbf{p}_v + \mathbf{p}_v\times\mathbf{q}_v \end{pmatrix}.
$$

The top line is the new scalar part; the bottom line, the new vector part. The cross term makes the product **non-commutative**: $p \otimes q \ne q \otimes p$ in general. That is correct: tip a book forward then spin it left, and you get a different pose than spinning first then tipping. Real turns do not commute either.

Three more tools:

- The **conjugate** $q^* = (w, -\mathbf{q}_v)$ (read "q star") flips the vector part. For a unit quaternion it undoes the turn: $q \otimes q^* = (1, 0, 0, 0)$, the **identity**, which means "no turn at all".
- The **norm** is the length of all four numbers together, $|q| = \sqrt{w^2 + x^2 + y^2 + z^2}$.
- The norm of a product is the product of the norms, $|p \otimes q| = |p|\,|q|$. So a product of unit quaternions stays unit — up to tiny rounding errors.

### Rotating a vector

To turn a vector $\mathbf{v}$, make the sandwich $q \otimes (0, \mathbf{v}) \otimes q^*$: the vector dressed as a quaternion with scalar part $0$, between $q$ and $q^*$. Multiplying it out for a unit $q$ and dropping the scalar part (which is zero) gives a cheaper form with no quaternion products:

$$
\mathbf{v}' = \mathbf{v} + 2w\,(\mathbf{q}_v\times\mathbf{v}) + 2\,\mathbf{q}_v\times(\mathbf{q}_v\times\mathbf{v}).
$$

Here $\mathbf{v}'$ (read "v prime") is the turned vector.

One last surprise: $q$ and $-q$ give the same turn. $q$ appears twice in the sandwich, so the two minus signs cancel. This is called the **[[double cover|double-cover]]**. It means a test that compares two quaternions must compare the *turns they make*, not their four numbers.

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
Why unit-test a quaternion normalisation routine: a quaternion that drifts off unit norm silently corrupts the **[[DCM|dcm-word]]** built from it — the rotation picks up a scale factor and stops being orthonormal, so every rotated vector is subtly wrong with no exception thrown. Nothing in the arithmetic complains; only a test that checks $|q| = 1$ and $|\mathbf{v}'| = |\mathbf{v}|$ does.
:::

**Orthonormal** means "keeps every length and right angle", as a pure turn does.

The fast `rotate` formula assumes $|q| = 1$. Suppose the quaternion has **[[drifted|attitude-drift]]** to norm $1.01$ — easily picked up by adding up turn rates for a few minutes without fixing the length. A vector at right angles to the axis then comes out $1.01^2 \approx 1.02$ times too long, while a vector along the axis keeps its length. The "turn" now bends shapes too, every position computed through it is off by up to two percent, and no error is ever raised.

::: example Ninety degrees about z
A turn of $90^\circ$ about the $z$ axis, $\hat{\mathbf{z}}$, has half-angle $\phi/2 = 45^\circ$. So $q = (\cos 45^\circ, 0, 0, \sin 45^\circ) \approx (0.7071, 0, 0, 0.7071)$. Apply it to the $x$ axis, $\hat{\mathbf{x}}$:

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

- $\hat{\mathbf{x}}$ goes to $\hat{\mathbf{y}}$, as a right-handed quarter turn about $\hat{\mathbf{z}}$ should. The $2.2 \times 10^{-16}$ where a $0$ belongs is one unit of rounding in the computer's number format, the subject of the floating-point lesson.
- $q \otimes q^*$ is the identity, as promised.
- $q \otimes q$ is two quarter turns, a half turn of $180^\circ$. The formula predicts $(\cos 90^\circ, 0, 0, \sin 90^\circ) = (0, 0, 0, 1)$, and that is what came out, again up to rounding.

None of these is *exactly* what the algebra promises — which is why the tests below never compare computed decimals with `==`.
:::

## pytest

Before every flight, a pilot runs a checklist. If any line fails, the plane does not go. A test suite is a checklist for code.

**pytest** is a **test runner**. It finds files named `test_*.py`, runs every function in them whose name starts with `test_`, and reports which failed. A test is an ordinary function holding ordinary `assert` statements. `assert something` does nothing when `something` is true and raises an error when it is false.

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

Run it from the project folder:

```bash
python -m pytest -q
# ...                                                    [100%]
# 3 passed in 0.02s
```

When an `assert` fails, pytest shows the values on both sides, so you rarely need a message. A `with pytest.raises(...)` block passes only if the code inside raises that kind of error — the right way to test the zero-vector guard.

### Comparing floats

The tests above use `==` safely, because whole-number arithmetic is exact. Anything with a square root, a sine or a division is not: the computer stores decimals with a fixed number of binary digits, so most results are rounded a tiny amount. So `assert q.norm() == 1.0` can fail for a perfectly good quaternion: `0.7071067811865476**2` added to itself gives `1.0000000000000002`. Compare with a **tolerance** — a small allowed gap — instead:

::: key
Assert floating-point closeness in pytest / NumPy with `assert x == pytest.approx(expected, rel=1e-9)`, or for arrays `np.testing.assert_allclose(actual, desired, rtol=..., atol=...)`. Never assert exact float equality on a computed value.
:::

`pytest.approx(expected, rel=1e-9)` accepts anything within one part in $10^9$ of `expected`. `rel` means **relative**: the allowed gap grows with the number. The trap: a relative tolerance on zero is zero, so when you expect zero add an **absolute** tolerance, `abs=1e-12`, a fixed gap. `np.testing.assert_allclose` does the same for whole arrays (the NumPy lesson introduces them) and prints the elements that disagree.

Choose the tolerance from the arithmetic — a few parts in $10^{16}$ per operation — not by loosening it until the test passes.

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

def test_hamilton_known_answer():
    i, j = Quaternion(0, 1, 0, 0), Quaternion(0, 0, 1, 0)
    assert i * j == Quaternion(0, 0, 0, 1)       # i times j is k
```

The last test uses the basic quaternions $i = (0,1,0,0)$, $j = (0,0,1,0)$, $k = (0,0,0,1)$ and Hamilton's rule $i \otimes j = k$; whole numbers, so `==` is safe.

### Running the same test on many inputs

`@pytest.mark.parametrize` runs one test once for each value in a list, reporting each run separately — a sweep over angles or awkward cases without copying the function:

```python
@pytest.mark.parametrize("phi_deg", [0.0, 30.0, 90.0, 179.0, 180.0, 359.0])
def test_unit_quaternion_has_unit_norm(phi_deg):
    h = math.radians(phi_deg) / 2
    q = Quaternion(math.cos(h), 0.0, math.sin(h), 0.0)
    assert q.norm() == pytest.approx(1.0, rel=1e-15)
```

Everyday switches:

- `-q` (quiet) prints one character per test;
- `-v` (verbose) names each one;
- `-k length` runs only tests whose names contain `length`;
- `-x` stops at the first failure;
- `--lf` reruns only the tests that failed last time.

## Test-driven numerical code

**Test-driven development** (TDD) flips the usual order. You write the test *first*, watch it fail (**red**), write the least code that makes it pass (**green**), then tidy the code without changing what it does (**[[refactor|red-green-refactor]]**).

For numerical code this pays twice. Writing the test first makes you decide what "correct" means *before* the code tempts you to accept whatever number it prints. And a test you have seen go from red to green has proved it can spot the bug it was written for.

Three kinds of test cover most numerical routines:

- **Invariant (property) tests** check something that must hold for *any* input. An **invariant** never changes: a turn keeps lengths, $q \otimes q^* = 1$, $|p \otimes q| = |p|\,|q|$, $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$. These are cheap to write and catch whole families of bugs at once.
- **Known-answer tests** check one case you can work out by hand: $90^\circ$ about $\hat{\mathbf{z}}$ sends $\hat{\mathbf{x}}$ to $\hat{\mathbf{y}}$; $(1,2,3)\times(4,5,6) = (-3,6,-3)$; $i \otimes j = k$. They pin down **conventions** — agreed choices, such as right-handed axes or storing $w$ first — that invariants cannot see.
- **Error tests** check that bad input raises an error: `Vec3(0,0,0).normalized()` raises `ZeroDivisionError` rather than returning `nan`.

Length preservation is the most valuable single invariant for a rotation library. A turn *is* a length-keeping operation, so an un-normalised quaternion, a wrong sign inside `rotate`, or a rotation matrix used back-to-front all break it.

But it is not enough on its own. Suppose `rotate` is built from the sandwich product, and someone flips the sign of the whole cross term in the Hamilton product. Every sandwich then turns by $-\phi$ instead of $+\phi$. That is still a perfectly good turn — it keeps every length — but it sends $\hat{\mathbf{x}}$ to $-\hat{\mathbf{y}}$. Only a known-answer test sees it: here, $i \otimes j$ would come out $-k$. A suite with both kinds is what the module's exercise means by a test file that "earns its keep".

::: example Test-driving `normalized`
**Red.** Write the test before the method exists:

```python
def test_normalized_has_unit_norm():
    v = Vec3(3.0, 4.0, 12.0)
    assert v.normalized().norm() == pytest.approx(1.0, rel=1e-15)
    assert v.normalized() == Vec3(3.0, 4.0, 12.0) * (1.0 / 13.0)
```

Running `pytest -q` gives `AttributeError: 'Vec3' object has no attribute 'normalized'`. Red.

**Green.** Add the one-line method `return self * (1.0 / self.norm())`; the suite passes. The length is $\sqrt{9 + 16 + 144} = 13$ exactly, so the second assertion is exact too.

**A free promise.** Now add `test_normalized_rejects_zero_vector`. It passes at once, because `1.0 / 0.0` already raises `ZeroDivisionError` — behavior you got by accident. The test turns the accident into a promise: it goes red if someone later rewrites the method with `self * (self.norm() ** -1)`, or a NumPy division that returns `inf` (infinity) instead of raising.

**Refactor.** Replace the accidental error with the explicit check and message shown in the class. The suite stays green.

**Sabotage.** Prove the suite can see a bug. In `cross`, change `self.y * o.z - self.z * o.y` to `self.y * o.z + self.z * o.y` and run it. `test_cross_is_anticommutative` and `test_cross_product_known_value` fail, and so does `test_rotation_preserves_length`, because `rotate` calls `cross`. Put the sign back: green again, and the suite has shown it catches the bug.
:::

::: warning Testing the code against itself
`assert q.rotate(v) == rotate_with_same_formula(q, v)` proves nothing: both sides share any mistake. Every test needs an independent source of truth — an algebra rule, a hand calculation, a value from a reference book, or a completely different method (the sandwich product checked against the expanded formula, for instance).
:::

::: warning Tolerances chosen to pass
If a test fails at `rel=1e-12` but passes at `rel=1e-6`, the arithmetic is telling you something — usually a quaternion not being re-normalised, or two conventions mixed. Find out why before touching the tolerance.
:::

::: note Running tests in the playground
The playground has no `pytest` command, but every test above is an ordinary function. Paste the classes and tests into one cell and call `test_rotation_preserves_length()` yourself: a silent return is a pass, an `AssertionError` a failure. Use `from pytest import approx` if the package is there, or `abs(a - b) <= tol` while exploring.
:::

## Check yourself

::: check
Why does `2 * Vec3(1, 2, 3)` need `__rmul__`, when `Vec3(1, 2, 3) * 2` works with `__mul__` alone?
:::

::: answer
`a * b` first tries `a.__mul__(b)`. For `2 * v`, the left side is the whole number `2`. Its `int.__mul__` does not know what a `Vec3` is, so it returns the special value `NotImplemented`. Python then tries the *reflected* method on the right side, `v.__rmul__(2)`. Without `__rmul__`, the expression raises `TypeError`. Setting `__rmul__ = __mul__` says that multiplying by a plain number works the same from either side.
:::

::: check
A colleague's quaternion test compares `q_result` with `q_expected` number by number using `pytest.approx`. It fails now and then, even though every rotated vector matches. What is the likely cause, and how should the test be written?
:::

::: answer
The double cover. $q$ and $-q$ are the same turn, and a routine that builds a quaternion — from a rotation matrix, from a product, from a time step of an integration — may return either sign quite correctly.

Fix it one of three ways: compare turns (rotate a few vectors with both and compare those); or flip signs so that $w \ge 0$ before comparing; or compare $|q_1 \cdot q_2|$ with $1$, the dot running over all four numbers.
:::

::: check
The frozen dataclass `Vec3` raises `FrozenInstanceError` if you write `v.x = 0.0`. Give one concrete bug in guidance code that this prevents.
:::

::: answer
A function receives a thrust-direction vector, "temporarily" scales it in place to work in other units, and forgets to scale it back. Every other part of the program holding that object now sees a wrong direction.

With a frozen `Vec3`, the in-place edit is impossible: the function must build a new vector, and everyone else's copy is untouched. The same protection stops a shared position vector being shrunk to length $1$ in place by a routine that only wanted its direction.
:::

::: check
You are testing a function that returns the time for one lap of a circular orbit, $T = 2\pi\sqrt{r^3/\mu}$, at radius $r = 6\,778\,137\,\mathrm{m}$ with $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$ (Earth's gravity constant). The expected value is about $5553.6\,\mathrm{s}$. Write the assertion, and say why `assert period(r) == 5553.624271252228` is wrong even if it passes today.
:::

::: answer
```python
assert period(6_778_137.0) == pytest.approx(5553.624271252228, rel=1e-9)
```

The exact version locks in one particular sequence of rounded operations. Rewrite the function as `2 * math.pi * r * math.sqrt(r / mu)` — the same algebra — and the last digit changes (`5553.624271252227`), breaking the test with no bug anywhere. A relative tolerance of $10^{-9}$ allows any correct rearrangement, yet a wrong power or a missing $2\pi$ still fails loudly.
:::

::: check
Name the three kinds of test in this lesson, and give one example of each for a `Vec3.cross` method.
:::

::: answer
**Invariant:** $\mathbf{a}\times\mathbf{b}$ is perpendicular to both inputs, so `a.cross(b).dot(a) == pytest.approx(0, abs=1e-12)` for any `a` and `b`. Anticommutativity, `a.cross(b) == -b.cross(a)`, also works.

**Known answer:** `Vec3(1,0,0).cross(Vec3(0,1,0)) == Vec3(0,0,1)`. This also pins down right-handedness.

**Error case:** `cross` expects a `Vec3`, so `Vec3(1,2,3).cross(5)` should raise. As written it raises `AttributeError`; you could add a check that raises a `TypeError` with a clear message.

The invariant catches sign and index slips; the known answer catches a handedness flip applied everywhere, which the invariant cannot see.
:::

## Summary

| Idea | Python | Notes |
| --- | --- | --- |
| Class, constructor, method | `class Vec3:`, `def __init__(self, x, y, z)`, `def norm(self)` | `self` is the instance |
| Dataclass | `@dataclass(frozen=True)` with typed fields | writes `__init__`, `__repr__`, `__eq__`; frozen = immutable |
| Operators | `__add__`, `__sub__`, `__neg__`, `__mul__`, `__rmul__` | `2 * v` needs `__rmul__` |
| Dot / cross | $\mathbf{a}\cdot\mathbf{b} = \vert \mathbf{a}\vert \vert \mathbf{b}\vert \cos\theta$; $\vert \mathbf{a}\times\mathbf{b}\vert  = \vert \mathbf{a}\vert \vert \mathbf{b}\vert \sin\theta$, right-hand rule | cross is anticommutative |
| Quaternion storage | scalar-first $(w, x, y, z)$; $q = (\cos\frac{\phi}{2}, \hat{\mathbf{n}}\sin\frac{\phi}{2})$ | $q$ and $-q$ are the same rotation |
| Hamilton product | $(p_w q_w - \mathbf{p}_v\cdot\mathbf{q}_v,\; p_w\mathbf{q}_v + q_w\mathbf{p}_v + \mathbf{p}_v\times\mathbf{q}_v)$ | not commutative; $\vert p\otimes q\vert  = \vert p\vert \vert q\vert $; $i \otimes j = k$ |
| Rotate | $\mathbf{v} + 2w(\mathbf{q}_v\times\mathbf{v}) + 2\mathbf{q}_v\times(\mathbf{q}_v\times\mathbf{v})$ | requires $\vert q\vert  = 1$ |
| Test file / function | `test_*.py`, `def test_*():`, plain `assert` | `python -m pytest -q` |
| Float comparison | `x == pytest.approx(e, rel=1e-9)`; `np.testing.assert_allclose(a, d, rtol=, atol=)` | never `==` on computed floats |
| Errors, sweeps | `with pytest.raises(E):`; `@pytest.mark.parametrize` | |
| TDD | red → green → refactor; invariant, known-answer and error tests | sabotage the code once to prove the suite sees it |

The next lesson replaces the hand-written `Vec3` arithmetic with NumPy arrays, where one line works on a hundred thousand vectors at once — and `np.testing.assert_allclose` becomes the check you reach for.

::: context decorator-word What the @ line does
A decorator is a function that takes something and hands back a changed version of it. Writing `@dataclass(frozen=True)` above a class is shorthand for writing `Vec3 = dataclass(frozen=True)(Vec3)` after it. The `dataclass` function reads the list of fields, writes the `__init__`, `__repr__` and `__eq__` methods for you, and attaches them. You will meet the same `@` shape again later in this lesson on `@pytest.mark.parametrize`, which marks a test to be run many times.
:::

::: context dunder-names Why the double underscores
Python reserves names that start and end with two underscores for methods the language itself calls behind your back: `__init__` when an object is made, `__add__` for `+`, `__eq__` for `==`, `__repr__` when an object is printed. The underscores keep them out of the way of your own names, so you will never clash with them by accident. Programmers say "dunder" — **d**ouble **under**score — because "underscore underscore add underscore underscore" is a mouthful. You rarely call a dunder method yourself; you write `a + b` and Python calls it.
:::

::: context dot-shadow The dot product as a shadow
Shine a light straight down onto the line of $\mathbf{b}$. The shadow of $\mathbf{a}$ has length $|\mathbf{a}|\cos\theta$. Multiply by $|\mathbf{b}|$ and you have the dot product. When the vectors are at right angles the shadow shrinks to a point, $\cos 90^\circ = 0$, and the dot product is zero — the quick test for "perpendicular".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="320" y2="150" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="320,150 308,144 308,156" fill="#1d6fd1"/>
  <line x1="40" y1="150" x2="177.89" y2="34.30" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="177.89,34.30 164.84,37.41 172.56,46.61" fill="#1f2a44"/>
  <line x1="177.89" y1="34.30" x2="177.89" y2="150" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="40" y1="162" x2="177.89" y2="162" stroke="#f2b880" stroke-width="5"/>
  <path d="M80,150 A40,40 0 0,0 70.64,124.29" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="84" y="138" font-size="13" fill="#1f2a44">θ</text>
  <text x="96" y="80" font-size="13" fill="#1f2a44">a</text>
  <text x="300" y="138" font-size="13" fill="#1d6fd1">b</text>
  <text x="109" y="182" font-size="12" text-anchor="middle" fill="#1f2a44">shadow |a| cos θ</text>
  <text x="200" y="60" font-size="12" fill="#1f2a44">a · b = |a| |b| cos θ</text>
</svg>
```
:::

::: context right-hand-rule Finding which way the cross product points
There are two directions at right angles to both $\mathbf{a}$ and $\mathbf{b}$: "up" and "down" from the flat sheet they lie in. The right-hand rule picks one. Point the fingers of your right hand along $\mathbf{a}$ and curl them toward $\mathbf{b}$; your thumb gives $\mathbf{a}\times\mathbf{b}$. Swap the order and you must curl the other way, so the thumb flips — that is why $\mathbf{b}\times\mathbf{a} = -\mathbf{a}\times\mathbf{b}$. The length of the arrow equals the area of the slanted box (a **parallelogram**) the two vectors outline.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon points="90,150 240,150 300,115 150,115" fill="#8fb8f0" stroke="none" opacity="0.6"/>
  <line x1="90" y1="150" x2="240" y2="150" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="240,150 228,144 228,156" fill="#1f2a44"/>
  <line x1="90" y1="150" x2="150" y2="115" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="150,115 136.61,115.87 142.65,126.23" fill="#1d6fd1"/>
  <line x1="90" y1="150" x2="90" y2="40" stroke="#b4232c" stroke-width="3"/>
  <polygon points="90,40 84,52 96,52" fill="#b4232c"/>
  <text x="232" y="172" font-size="13" fill="#1f2a44">a</text>
  <text x="154" y="108" font-size="13" fill="#1d6fd1">b</text>
  <text x="100" y="50" font-size="13" fill="#b4232c">a × b</text>
  <text x="200" y="70" font-size="12" fill="#1f2a44">shaded area =</text>
  <text x="200" y="86" font-size="12" fill="#1f2a44">|a| |b| sin θ = |a × b|</text>
</svg>
```
:::

::: context why-half-angle Why the angle is halved
In the sandwich $q \otimes (0, \mathbf{v}) \otimes q^*$, the quaternion $q$ acts twice: once from the left and once, as $q^*$, from the right. Each side turns the vector by half the angle, and the two halves add up to the full turn $\phi$. So $q$ has to store $\phi/2$. A side effect is that a full $360^\circ$ turn gives $w = \cos 180^\circ = -1$, not $+1$ — which is where the double cover comes from.
:::

::: context hamilton A formula carved into a bridge
Quaternions were invented by the Irish mathematician William Rowan Hamilton in 1843. He had spent years trying to extend complex numbers to three dimensions and failing. Walking along the Royal Canal in Dublin, he realised he needed *four* numbers and three square roots of $-1$, called $i$, $j$ and $k$. He carved the rule $i^2 = j^2 = k^2 = ijk = -1$ into the stone of Brougham Bridge; a plaque marks the spot today. The Hamilton product in this lesson is that rule, written out for whole quaternions.
:::

::: context double-cover Two quaternions for every turn
Follow $w = \cos(\phi/2)$ as the turn angle $\phi$ grows. At $0^\circ$ it is $+1$. At $360^\circ$ — the object back where it started — it is $-1$. Only at $720^\circ$ does $q$ come back to itself. So every physical orientation has exactly two quaternions, $q$ and $-q$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="95" x2="345" y2="95" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="160" stroke="#6c7a93" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,40.0 44.2,40.2 48.3,40.8 52.5,41.9 56.7,43.3 60.8,45.2 65.0,47.4 69.2,49.9 73.3,52.9 77.5,56.1 81.7,59.6 85.8,63.5 90.0,67.5 94.2,71.8 98.3,76.2 102.5,80.8 106.7,85.4 110.8,90.2 115.0,95.0 119.2,99.8 123.3,104.6 127.5,109.2 131.7,113.8 135.8,118.2 140.0,122.5 144.2,126.5 148.3,130.4 152.5,133.9 156.7,137.1 160.8,140.1 165.0,142.6 169.2,144.8 173.3,146.7 177.5,148.1 181.7,149.2 185.8,149.8 190.0,150.0 194.2,149.8 198.3,149.2 202.5,148.1 206.7,146.7 210.8,144.8 215.0,142.6 219.2,140.1 223.3,137.1 227.5,133.9 231.7,130.4 235.8,126.5 240.0,122.5 244.2,118.2 248.3,113.8 252.5,109.2 256.7,104.6 260.8,99.8 265.0,95.0 269.2,90.2 273.3,85.4 277.5,80.8 281.7,76.2 285.8,71.8 290.0,67.5 294.2,63.5 298.3,59.6 302.5,56.1 306.7,52.9 310.8,49.9 315.0,47.4 319.2,45.2 323.3,43.3 327.5,41.9 331.7,40.8 335.8,40.2 340.0,40.0"/>
  <circle cx="40" cy="40" r="4" fill="#b4232c"/>
  <circle cx="190" cy="150" r="4" fill="#b4232c"/>
  <circle cx="340" cy="40" r="4" fill="#b4232c"/>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">+1</text>
  <text x="34" y="154" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="14" y="99" font-size="12" fill="#1f2a44">w</text>
  <text x="115" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">180°</text>
  <text x="190" y="175" font-size="11" text-anchor="middle" fill="#1f2a44">360°: same pose, w = −1</text>
  <text x="265" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">540°</text>
  <text x="330" y="28" font-size="11" text-anchor="middle" fill="#1f2a44">720°</text>
</svg>
```
:::

::: context dcm-word The direction cosine matrix
A **DCM** (direction cosine matrix) is a $3 \times 3$ grid of numbers that does the same job as a unit quaternion: multiply a vector by it and the vector turns. Its nine entries are the cosines of the angles between the axes of two frames — say, the rocket's body axes and the launch-pad axes — hence the name. Flight software often keeps attitude as a quaternion (four numbers, easy to keep tidy) and builds the DCM from it whenever it needs to turn many vectors. If the quaternion is not unit length, the DCM built from it stretches as well as turns. The linear algebra module builds DCMs properly.
:::

::: context attitude-drift Why a quaternion drifts off length 1
An attitude estimator updates the quaternion many times a second from gyroscope readings. Each update adds a small change, and each change is rounded and slightly approximate. The errors add up, and $|q|$ creeps away from $1$ — slowly, but without limit. The standard fix is cheap: divide by the norm (call `normalized()`) after every update, or whenever $|q|$ strays by more than a set amount. The test in the key box is what proves the fix is actually there.
:::

::: context red-green-refactor The red–green–refactor loop
TDD is a short loop you go around many times an hour, not a single plan. Each lap adds one small, tested behavior. The "refactor" step — reorganising code without changing what it does — is only safe because the tests from earlier laps will go red if you break something.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="60" r="36" fill="#fff" stroke="#b4232c" stroke-width="3"/>
  <circle cx="180" cy="60" r="36" fill="#fff" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="300" cy="60" r="36" fill="#fff" stroke="#1f2a44" stroke-width="3"/>
  <text x="60" y="58" font-size="13" text-anchor="middle" fill="#b4232c">red</text>
  <text x="60" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">test fails</text>
  <text x="180" y="58" font-size="13" text-anchor="middle" fill="#1d6fd1">green</text>
  <text x="180" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">code passes</text>
  <text x="300" y="58" font-size="13" text-anchor="middle" fill="#1f2a44">refactor</text>
  <text x="300" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">still green</text>
  <line x1="98" y1="60" x2="138" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="142,60 132,55 132,65" fill="#1f2a44"/>
  <line x1="218" y1="60" x2="258" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="262,60 252,55 252,65" fill="#1f2a44"/>
  <path d="M300,98 C300,135 60,135 60,102" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="60,98 55,108 65,108" fill="#6c7a93"/>
  <text x="180" y="145" font-size="11" text-anchor="middle" fill="#6c7a93">next small behavior</text>
</svg>
```
:::
