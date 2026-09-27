---
id: l06-property-based-testing
title: Property-based testing with Hypothesis
minutes: 21
covers:
  - Property-based testing with Hypothesis; invariants over examples
---

Suppose you wrote a program that spells a word backward. You test it: "cat" gives "tac". Good. "rocket" gives "tekcor". Good. Two examples, both right. But you picked them, and you picked easy ones. What about an empty word? A word with one letter? A word with an accent, or an emoji?

Here is a different kind of check. Whatever the word is, spelling it backward *twice* must give back the original word. You do not need to know the right answer for any particular word to check that. You can throw a thousand random words at the program and check the rule for every one. A rule like that — true for every input — is a **property**, and a property that never changes is often called an **[[invariant|word-invariant]]**.

**Property-based testing** means writing tests as properties and letting a tool invent the inputs. In Python the tool is **Hypothesis**. You describe what kind of inputs are allowed, it generates hundreds of them — including the nasty ones you would never think to write — and when one breaks the property, it shrinks that input down to the smallest, simplest case that still fails. On a spacecraft, the code that most needs this is the attitude math: quaternions, rotation matrices and angle conversions, where a rare bad input at a special orientation can hide for years.

## Examples versus properties

Every test so far in this module has been an **example-based test**: one input, one expected output, written by hand. `vertical_accel(0.0, 549_000)` should be $-9.80665\,\mathrm{m/s^2}$. Example tests are clear and cheap, and you will always want some. Their weakness is that they only check the inputs you thought of, and the inputs you thought of are the ones your code already handles.

A property test flips it around. You state a rule, and the tool hunts for inputs that break it. Good properties for engineering code come in a few familiar shapes:

- **Round trip.** Convert and convert back, and you get what you started with: a quaternion to a rotation matrix and back, a file saved and loaded, Cartesian to spherical coordinates and back.
- **Something is preserved.** Normalizing a vector gives length $1$. Multiplying two unit quaternions gives a unit quaternion. A rotation keeps a vector's length.
- **Two ways agree.** A fast function and a slow, easy-to-trust one give the same answer. The slow one is called an **[[oracle|oracle]]**.
- **Order or symmetry.** Sorting twice is the same as sorting once. Rotating by $a$ then by $b$ about the same axis is the same as rotating by $a + b$.

None of these needs a hard-coded expected number. That is their power: you check a *relationship*, which is true for every input, instead of a value you had to compute somewhere else and paste in.

::: key Property-based testing
Property-based testing generates many inputs and checks invariants, so it explores cases you would not have written: near-singular angles, huge magnitudes, denormals. Hypothesis also shrinks a failure to a minimal reproducing example.
:::

## Your first Hypothesis test

A property test in Hypothesis has two parts. A **strategy** describes which inputs are allowed — "floats between $-1000$ and $1000$", say. The decorator `@given(...)` tells Hypothesis to call the test many times, each time with fresh values drawn from the strategies. By default it runs $100$ examples per test.

Here is a function every GNC codebase has: scale a vector to length $1$ (a **unit vector**), used for pointing directions and rotation axes. The property is the definition itself: the result has length $1$.

```python
import math

from hypothesis import given
from hypothesis import strategies as st


def unit(x, y, z):
    """Scale a 3-vector to length 1."""
    n = math.sqrt(x * x + y * y + z * z)
    return x / n, y / n, z / n


components = st.floats(min_value=-1e3, max_value=1e3)


@given(components, components, components)
def test_unit_has_length_one(x, y, z):
    ux, uy, uz = unit(x, y, z)
    assert math.isclose(math.hypot(ux, uy, uz), 1.0, rel_tol=1e-12)
```

(`math.hypot(a, b, c)` is $\sqrt{a^2 + b^2 + c^2}$, the length of a vector. Read `st` as "strategies".)

Run it with plain `pytest`. It fails in about a quarter of a second:

```text
x = 0.0, y = 0.0, z = 0.0

>       return x / n, y / n, z / n
E       ZeroDivisionError: float division by zero
E       Failing test case: test_unit_has_length_one(
E           x=0.0,
E           y=0.0,
E           z=0.0,
E       )
```

Of course: the zero vector has no direction, so it cannot be scaled to length $1$. You probably knew that. But notice what Hypothesis reported. Whatever input first tripped the failure, Hypothesis then **shrank** it — tried smaller and simpler versions again and again, keeping any that still failed — until it reached the simplest failing input there is, all zeros. That is **[[shrinking|shrinking]]**, and it is why Hypothesis failures are pleasant to read.

The zero vector is a genuine edge, and the function should refuse it with a clear error. For now, tell the test it is out of bounds with `assume`, which throws away any generated input that does not meet a condition:

```python
from hypothesis import assume


@given(components, components, components)
def test_unit_has_length_one(x, y, z):
    assume((x, y, z) != (0.0, 0.0, 0.0))    # the zero vector is out of bounds
    ux, uy, uz = unit(x, y, z)
    assert math.isclose(math.hypot(ux, uy, uz), 1.0, rel_tol=1e-12)
```

::: example A bug nobody would have written a test for
With the zero vector excluded, run the test again. It still fails:

```text
E       ZeroDivisionError: float division by zero
E       Failing test case: test_unit_has_length_one(
E           x=0.0,
E           y=0.0,
E           z=2.225073858507e-311,
E       )
```

(The exact tiny number varies from run to run — $10^{-194}$ and $4 \times 10^{-193}$ also turned up in other runs — but the story is the same.)

**Step 1: read the input.** $z = 2.2 \times 10^{-311}$ is not zero. It is a legal vector pointing straight along $z$. The right answer is $(0, 0, 1)$.

**Step 2: follow the arithmetic.** The code squares it: $z^2 \approx 5 \times 10^{-622}$. The smallest positive number a double-precision float can hold is about $5 \times 10^{-324}$. So $z^2$ **underflows** — it is too small to represent, and becomes exactly $0.0$. Then $n = \sqrt{0} = 0$, and the division fails.

**Step 3: notice the kind of number.** This run's $2.2 \times 10^{-311}$ is even smaller than $2.2 \times 10^{-308}$, the smallest *normal* double. It is a **[[subnormal|subnormal-floats]]** (also called a denormal): one of the extra-tiny values floats keep near zero at reduced precision. You would never have typed it into a test. Hypothesis tries such values on purpose, because they break code so often.

**Step 4: fix it.** Python's `math.hypot` computes a length without squaring the raw numbers, so it does not underflow. Using `n = math.hypot(x, y, z)` fixes this failure.

Sanity check: is this a real-world problem? A unit-vector routine fed a nearly-zero relative velocity at the end of a docking approach, or a nearly-zero angular rate on a still spacecraft, can meet very small numbers. A function that returns a crash for a legal input is a bug, whatever size the input is.
:::

## Strategies: describing the inputs

A strategy is a recipe for inputs. The ones you will use most for numerical code live in `hypothesis.strategies`:

- `st.floats(min_value=..., max_value=..., allow_nan=..., allow_infinity=...)` — floating-point numbers. With no bounds it produces everything a float can be, including `nan` (not a number), `inf` (infinity), $-0.0$ and subnormals. With both bounds set, nan and infinity are left out automatically.
- `st.integers(min_value=..., max_value=...)` — whole numbers.
- `st.lists(strategy, min_size=..., max_size=...)` and `st.tuples(s1, s2, ...)` — collections built from other strategies.
- `st.sampled_from([...])` — one of a fixed set, such as a list of frame names.
- `strategy.map(f)` — transform each value; `strategy.filter(pred)` — keep only values that pass a check.

When the input needs several steps to build, write a **composite** strategy. The decorator `@st.composite` gives your function a `draw` argument; each `draw(strategy)` pulls one value. Here is a strategy for random unit quaternions — four numbers, normalized:

```python
import numpy as np
from hypothesis import assume
from hypothesis import strategies as st

part = st.floats(min_value=-1.0, max_value=1.0)


@st.composite
def unit_quats(draw):
    q = np.array([draw(part), draw(part), draw(part), draw(part)])
    n = np.linalg.norm(q)
    assume(n > 0.1)                  # too short to normalize safely: discard
    return q / n
```

Two settings control the search. `@settings(max_examples=2000)` runs more examples than the default $100$ — worth it for a core math routine. And every test has a **deadline** of $200\,\mathrm{ms}$ per example by default, so a property test that is too slow fails loudly instead of quietly dragging down the fast suite from the last lesson; `@settings(deadline=None)` turns that off when you truly need it.

Two more tools make failures stick. `@example(0.0, 0.0, 1e-311)`, stacked above `@given`, forces a specific case to run every time — the way to pin a bug you fixed so it can never come back unnoticed. And Hypothesis keeps a small **[[example database|example-database]]** in a `.hypothesis` folder, so a failure found once is tried first on the next run.

::: warning A narrow strategy hides the bugs you were looking for
It is tempting to write `st.floats(min_value=-100, max_value=100)` because "our values are never bigger than that." But the bugs live at the edges. After fixing the underflow, widening the strategy to every finite float, `st.floats(allow_nan=False, allow_infinity=False)`, found a new failure at once:

```text
E       Failing test case: test_unit_has_length_one(
E           x=0.0,  # or any other generated value
E           y=1.2711610061536462e+308,
E           z=1.2711610061536464e+308,
E       )
```

Each component fits in a float, but the length is about $\sqrt{2} \times 1.27 \times 10^{308} \approx 1.80 \times 10^{308}$, a little past the largest double, about $1.797 \times 10^{308}$. The length **overflows** to infinity, and $y / \infty = 0$: the "unit" vector comes back as all zeros, with no error at all. The fix is to divide by the largest component first, so the numbers going into `hypot` are between $-1$ and $1$, then normalize. Start with the widest strategy the function's contract allows, and narrow it only for a reason you can write down.
:::

## Invariants for a rotation library

Now the case that matters most for GNC. Attitude code converts constantly between **quaternions** — four numbers $q = (w, x, y, z)$ that encode a rotation — and **direction cosine matrices** (DCMs), the $3 \times 3$ rotation matrices. Hard-coding expected matrices for a few angles tests only those angles. Invariants test all of them.

Three invariants every quaternion library should pass:

1. **Unit norm is preserved by multiplication.** Composing two rotations, the quaternion product of two unit quaternions, is again a unit quaternion.
2. **$q$ and $-q$ give the same rotation matrix.** Flipping the sign of all four numbers describes the same physical rotation. This is called the **[[double cover|double-cover]]**.
3. **Round trip.** Quaternion to DCM and back to a quaternion reproduces the original rotation — compared as DCMs, since the quaternion might come back as $-q$.

::: key Quaternion invariants
Three good invariants for a quaternion library: unit norm is preserved by multiplication; $q$ and $-q$ give the same rotation matrix; converting to a DCM and back reproduces the original rotation. None of these require a hard-coded expected value.
:::

A rotation matrix has its own invariants, which make a good property for anything that produces one. A proper rotation matrix $\mathbf{C}$ satisfies:

- **finite**: every entry is an ordinary number, no nan or infinity;
- **orthonormal**: $\mathbf{C}\mathbf{C}^\mathsf{T} = \mathbf{I}$ — read "C times C transpose equals the identity" — which says the rows are perpendicular unit vectors, so lengths and angles are kept;
- **determinant $+1$**: $\det \mathbf{C} = +1$. A determinant of $-1$ would be a mirror reflection, which turns a right hand into a left hand; no physical rotation does that.

In NumPy those are `np.isfinite(C).all()`, `np.allclose(C @ C.T, np.eye(3), atol=tol, rtol=0.0)` and `abs(np.linalg.det(C) - 1.0) < tol`. Setting `rtol=0.0` makes the comparison purely absolute, which is right here: the identity is full of zeros, and a relative tolerance means nothing at zero.

```python
# with quat_to_dcm from the quat.py file in the next example
@given(unit_quats())
def test_dcm_is_a_rotation(q):
    C = quat_to_dcm(q)
    assert np.isfinite(C).all()
    assert np.allclose(C @ C.T, np.eye(3), atol=1e-12, rtol=0.0)
    assert abs(np.linalg.det(C) - 1.0) < 1e-12

# 1 passed   (100 passing examples)
```

::: example The textbook formula that fails at 180 degrees
Here is the quaternion library under test: a product, a quaternion-to-DCM function, and the conversion back, using the formula found in many textbooks. Scalar first, $q = (w, x, y, z)$.

```python
# quat.py
import numpy as np


def quat_mul(p, q):
    """Hamilton product of two scalar-first quaternions [w, x, y, z]."""
    pw, px, py, pz = p
    qw, qx, qy, qz = q
    return np.array([
        pw * qw - px * qx - py * qy - pz * qz,
        pw * qx + px * qw + py * qz - pz * qy,
        pw * qy - px * qz + py * qw + pz * qx,
        pw * qz + px * qy - py * qx + pz * qw,
    ])


def quat_to_dcm(q):
    """Rotation matrix of a unit quaternion (scalar first)."""
    w, x, y, z = q
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
        [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
        [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
    ])


def dcm_to_quat(C):
    """Textbook formula: fine for small rotations, fragile near 180 degrees."""
    w = 0.5 * np.sqrt(1.0 + np.trace(C))
    x = (C[2, 1] - C[1, 2]) / (4.0 * w)
    y = (C[0, 2] - C[2, 0]) / (4.0 * w)
    z = (C[1, 0] - C[0, 1]) / (4.0 * w)
    return np.array([w, x, y, z])
```

And the three invariants as property tests, using the `unit_quats` strategy from above:

```python
# test_quat.py: imports, then the unit_quats strategy from above
import numpy as np
from hypothesis import assume, given
from hypothesis import strategies as st

from quat import dcm_to_quat, quat_mul, quat_to_dcm

# ... part and unit_quats as defined earlier ...


@given(unit_quats(), unit_quats())
def test_product_stays_unit(p, q):
    assert abs(np.linalg.norm(quat_mul(p, q)) - 1.0) < 1e-12


@given(unit_quats())
def test_q_and_minus_q_same_rotation(q):
    np.testing.assert_allclose(quat_to_dcm(q), quat_to_dcm(-q), atol=1e-15)


@given(unit_quats())
def test_dcm_round_trip(q):
    C = quat_to_dcm(q)
    np.testing.assert_allclose(quat_to_dcm(dcm_to_quat(C)), C, atol=1e-9)
```

Run them (output trimmed):

```text
    | Failing test case: test_dcm_round_trip(
    |     q=array([0.        , 0.        , 0.70710678, 0.70710678]),
    | )
    | Failing test case: test_dcm_round_trip(
    |     q=array([0., 0., 0., 1.]),
    | )
1 failed, 2 passed
```

Two invariants hold. The round trip fails, and Hypothesis reports two distinct failures: in one, the square root itself produces nan; in the other, a division does. The first case differs from run to run, but in every run both have $w = 0$. Take the simpler one.

**Step 1: what rotation is it?** For a unit quaternion, $w = \cos(\theta / 2)$, where $\theta$ ("theta") is the rotation angle. Here $w = 0$, so $\theta / 2 = 90^\circ$ and $\theta = 180^\circ$: a half turn about the $z$ axis.

**Step 2: follow the formula.** A half turn about $z$ is $\mathbf{C} = \mathrm{diag}(-1, -1, 1)$, whose **trace** (the sum of the diagonal) is $-1$. So $w = \tfrac{1}{2}\sqrt{1 + (-1)} = 0$, and the next line divides by $4w = 0$. The result is nan. When rounding makes the trace a hair below $-1$, the square root of a negative number gives nan even earlier.

**Step 3: it is not only exactly 180 degrees.** Trying quaternions with small $w$ by hand shows the whole neighborhood is sick. At $w = 10^{-5}$, a rotation $0.0011^\circ$ short of a half turn, the round-tripped matrix is off by about $4 \times 10^{-7}$. At $w = 10^{-7}$, only $1.1 \times 10^{-5}$ degrees short, it is off by $0.089$ — a badly wrong attitude from a perfectly good input.

**Step 4: fix it.** The standard cure, **[[Shepperd's method|shepperd]]**, computes all four of $4w^2, 4x^2, 4y^2, 4z^2$ from the diagonal and trace, picks the largest, and divides only by that one — which can never be small, since the four squares add to $1$ and so the largest is at least $\tfrac{1}{4}$. With it, the round-trip property passes $3000$ examples.

Sanity check: is a half turn a strange input? No. A spacecraft flipping end-over-end to point its engine backward for a braking burn rotates by $180^\circ$. So does a satellite turning its solar panels to the far side. The failure is the tool doing its job.
:::

::: warning A failure at a special point is still a failure
When Hypothesis lands on an exact angle like $180^\circ$ or $90^\circ$, it is tempting to dismiss it: "that input is unlikely." Resist that. Special points are where formulas divide by zero or lose a direction, and vehicles fly through them — a spacecraft flips, a rocket pitches through vertical, a lander rolls. Every attitude representation built from three angles has such a point, called a **[[singularity|gimbal-lock]]**. The right response is to handle the special point explicitly in the code and add it as an `@example`, not to narrow the strategy until it goes away.
:::

## What properties cannot see

Properties are powerful, but they have a blind spot worth knowing exactly. Here is a rotation about the $x$ axis with a sign error: the two sine terms are swapped.

```python
import numpy as np
from hypothesis import given
from hypothesis import strategies as st


def rot_x(a):
    """Active rotation by angle a (rad) about +x, right-hand rule."""
    c, s = np.cos(a), np.sin(a)
    return np.array([[1.0, 0.0, 0.0], [0.0, c, s], [0.0, -s, c]])  # sign error!


angles = st.floats(min_value=-10.0, max_value=10.0)


@given(angles)
def test_orthonormal(a):
    C = rot_x(a)
    np.testing.assert_allclose(C @ C.T, np.eye(3), atol=1e-12)


@given(angles)
def test_det_plus_one(a):
    assert abs(np.linalg.det(rot_x(a)) - 1.0) < 1e-12


@given(angles, angles)
def test_angles_add(a, b):
    np.testing.assert_allclose(rot_x(a) @ rot_x(b), rot_x(a + b), atol=1e-12)


def test_quarter_turn_takes_y_to_z():
    np.testing.assert_allclose(rot_x(np.pi / 2) @ [0.0, 1.0, 0.0],
                               [0.0, 0.0, 1.0], atol=1e-12)

# FAILED test_rot.py::test_quarter_turn_takes_y_to_z
#  Mismatch at index:
#   [2]: -1.0 (ACTUAL), 1.0 (DESIRED)
# 1 failed, 3 passed
```

All three property tests pass. The wrong matrix is still orthonormal, still has determinant $+1$, and angles still add. It is a perfectly good rotation — by $-a$ instead of $a$. Every invariant that is true of all rotations is true of the wrong one too.

The single hand-written example is what catches it. By the **[[right-hand rule|right-hand-rule]]**, a positive quarter turn about $x$ carries the $y$ axis onto the $z$ axis. The buggy matrix sends it to $-z$, and the failure message says so: $-1.0$ where $1.0$ was wanted.

So the best suites use both. Properties sweep the whole input space for crashes, lost precision and broken structure. A few anchored examples fix the **direction** — which way is positive, which frame is which — that no symmetry can pin down.

::: warning Invariants cannot tell a rotation from its reverse
Orthonormality, determinant $+1$, composition and round trips all hold for a rotation by $-\theta$ as well as by $+\theta$. A sign convention error sails through them. Keep at least one directional example test per rotation function: rotate a known axis by a known positive angle and check where it lands.
:::

## Check yourself

::: check
For each function, name one property you could test without knowing any expected output: (a) `cartesian_to_spherical` and its inverse; (b) a function that sorts a list of ground-station contact windows by start time; (c) a function that propagates a two-body orbit forward by time $\Delta t$.
:::

::: answer
(a) Round trip: converting to spherical and back returns the original point, within a tolerance, for any point not at the origin (where the angles are undefined).

(b) Several: the output has the same windows as the input (same length, same members); each start time is less than or equal to the next; sorting the sorted list changes nothing.

(c) Conserved quantities: the orbital energy $\tfrac{1}{2}v^2 - \mu/r$ and the angular momentum vector $\mathbf{r} \times \mathbf{v}$ stay the same, within tolerance. Also, propagating by $\Delta t$ and then by $-\Delta t$ returns to the start, and two steps of $\Delta t$ equal one step of $2\Delta t$.
:::

::: check
A teammate's property test for an angle-wrapping function uses `st.floats(min_value=-3.0, max_value=3.0)` "because angles are always between $-\pi$ and $\pi$." What is wrong with that reasoning?
:::

::: answer
The function exists to handle angles *outside* $-\pi$ to $\pi$ — that is what wrapping means. The strategy never generates one, so it never tests the function's main job. It also misses the edges: $\pm\pi$ themselves ($3.0$ is less than $\pi \approx 3.14159$), angles of many full turns, and huge values where floating-point wrapping loses precision. The strategy should cover everything the function promises to accept, for example `st.floats(min_value=-1e6, max_value=1e6)`, with any narrowing justified in writing.
:::

::: check
Hypothesis reports a failing input of $x = 0.0$, $y = 1.0$ for your function. Your first thought is that it probably failed first on some complicated input. Is that right, and why does Hypothesis show you this one instead?
:::

::: answer
Almost certainly right. The first failure is usually a random-looking value. Hypothesis then shrinks it: it keeps trying simpler inputs — smaller numbers, zeros, shorter lists — and keeps any that still fail, until no simpler one does. What it reports is the minimal failing case. That is more useful than the original, because it points straight at the cause: here, something about $x$ being exactly zero.
:::

::: check
Write a Hypothesis test that checks a rotation matrix from `rot_x(a)` keeps the length of any vector. Use `st.floats` for the angle and for three vector components.
:::

::: answer
```python
import numpy as np
import pytest
from hypothesis import given
from hypothesis import strategies as st

from rot import rot_x

angle = st.floats(min_value=-10.0, max_value=10.0)
comp = st.floats(min_value=-1e6, max_value=1e6)


@given(angle, comp, comp, comp)
def test_rotation_keeps_length(a, x, y, z):
    v = np.array([x, y, z])
    w = rot_x(a) @ v
    assert np.linalg.norm(w) == pytest.approx(np.linalg.norm(v), rel=1e-12, abs=1e-9)
```

The tolerance has both parts on purpose: a relative part for big vectors, and a small absolute floor for vectors near zero, where a relative tolerance alone would demand exact equality. Note that this property passes for the sign-flipped `rot_x` too — keeping length is true of every rotation, whichever way it turns.
:::

::: check
Your DCM round-trip property passes $10\,000$ examples. Your lead asks, "So the conversion is correct?" What do you answer?
:::

::: answer
"It is correct in structure, not proven in direction." Passing shows that for every input tried — including edge cases like half turns — converting to a DCM and back reproduces the same rotation matrix, and that nothing crashes or goes nan. It cannot show the convention is right: if both functions used the opposite sign convention, or transposed matrices, the round trip would still close perfectly. For that you need a few directional example tests: a known quaternion for a $90^\circ$ turn about $z$ should carry the $x$ axis to the $y$ axis.
:::

## Summary

| Idea | What to remember |
|---|---|
| Property | a rule true for every input; no hard-coded expected value |
| Common properties | round trip, preserved quantity, agreement with an oracle, symmetry |
| `@given(strategy, ...)` | runs the test on many generated inputs, $100$ by default |
| Strategies | `st.floats`, `st.integers`, `st.lists`, `st.tuples`, `st.sampled_from`, `@st.composite` |
| `assume(cond)` | discard inputs outside the function's contract |
| `@settings`, `@example` | more examples or no deadline; pin a known case forever |
| Shrinking | a failure is reduced to the simplest input that still fails |
| Quaternion invariants | unit norm under product; $q$ and $-q$ same DCM; DCM round trip |
| Rotation matrix | finite, $\mathbf{C}\mathbf{C}^\mathsf{T} = \mathbf{I}$, $\det \mathbf{C} = +1$ |
| Blind spot | invariants cannot see a sign or handedness error; add directional examples |

The next lesson takes the opposite approach for whole simulations: instead of a rule for every input, it records one trusted output — a golden file — and checks, at a tolerance you have to justify, that nothing about it has changed.

::: context word-invariant Something that does not vary
"Invariant" is the old mathematical word for a quantity that stays fixed while something else changes. The length of a vector is invariant under rotation; the total energy of an orbit is invariant as the spacecraft moves along it. In testing the word is used a little more loosely, for any rule the code must keep no matter what input it is given.
:::

::: context oracle Who knows the right answer
In testing, an **oracle** is anything that can tell you the correct output: a hand calculation, a trusted library, or a slow but simple version of your function. A property test can use one directly: check that your fast, clever quaternion multiply matches a plain four-by-four matrix version on every input Hypothesis generates. The simple version is too slow for flight, but perfect as a referee.
:::

::: context shrinking How the smallest failure is found
Once Hypothesis sees a failure, it edits the input step by step: lists get shorter, numbers move toward zero or toward simple values like $1.0$, and floats lose digits. After each edit it reruns the test. An edit that still fails is kept; one that passes is thrown away. When no edit helps, it stops and reports what is left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="150" height="28" rx="6" fill="#ffffff" stroke="#b4232c"/>
  <text x="85" y="31" font-size="12" fill="#1f2a44" text-anchor="middle">x=-713.4, y=0.028</text>
  <rect x="10" y="60" width="150" height="28" rx="6" fill="#ffffff" stroke="#b4232c"/>
  <text x="85" y="79" font-size="12" fill="#1f2a44" text-anchor="middle">x=0.0, y=0.028</text>
  <rect x="10" y="108" width="150" height="28" rx="6" fill="#f2b880" stroke="#b4232c"/>
  <text x="85" y="127" font-size="12" fill="#1f2a44" text-anchor="middle">x=0.0, y=1.0</text>
  <line x1="85" y1="40" x2="85" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="85" y1="88" x2="85" y2="106" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="200" y="36" width="150" height="28" rx="6" fill="#ffffff" stroke="#1d6fd1"/>
  <text x="275" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">x=0.0, y=0.0: passes</text>
  <line x1="160" y1="74" x2="200" y2="50" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="275" y="90" font-size="12" fill="#6c7a93" text-anchor="middle">edit rejected</text>
  <text x="275" y="127" font-size="12" fill="#b4232c" text-anchor="middle">reported: still fails</text>
</svg>
```

The picture is an illustration of the process with made-up values, not a real run.
:::

::: context subnormal-floats The tiny numbers near zero
A double-precision float stores a number as digits times a power of two. The smallest **normal** double is about $2.2 \times 10^{-308}$. Below that, floats give up digits of precision to reach further down, all the way to about $4.9 \times 10^{-324}$. These **subnormal** numbers fill the gap to zero; anything smaller rounds to $0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="14" y1="54" x2="348" y2="54" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="44" x2="30" y2="64" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="82" font-size="12" fill="#1f2a44" text-anchor="middle">0</text>
  <rect x="34" y="46" width="96" height="16" fill="#f2b880"/>
  <text x="82" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">subnormal</text>
  <line x1="130" y1="44" x2="130" y2="64" stroke="#1f2a44" stroke-width="2"/>
  <text x="130" y="82" font-size="12" fill="#1f2a44" text-anchor="middle">2.2e-308</text>
  <rect x="134" y="46" width="210" height="16" fill="#8fb8f0"/>
  <text x="240" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">normal doubles</text>
  <text x="180" y="102" font-size="11" fill="#6c7a93" text-anchor="middle">not to scale: the axis is squeezed to show the gap</text>
</svg>
```

Arithmetic on subnormals can also be much slower on some processors, which is one more reason flight code watches for them.
:::

::: context example-database Failures are remembered
When a property fails, Hypothesis saves the failing input in a local folder called `.hypothesis`. On the next run it replays saved failures first, so a bug you are fixing shows up immediately instead of waiting for random search to find it again. The folder is a cache on your machine; to make a case part of the suite for everyone, write it into the test with `@example`.
:::

::: context double-cover Two quaternions, one rotation
A rotation by angle $\theta$ about an axis $\hat{\mathbf{n}}$ has the quaternion $q = (\cos\tfrac{\theta}{2}, \hat{\mathbf{n}}\sin\tfrac{\theta}{2})$. Rotating by $\theta + 360^\circ$ ends in the same place, but halves become $\tfrac{\theta}{2} + 180^\circ$, which flips the sign of every component. So $q$ and $-q$ are the same physical rotation. The DCM formula uses only products of pairs of components, like $wz$ or $y^2$, and a product of two flipped signs is unchanged.
:::

::: context shepperd A 1978 fix still in use
Stanley Shepperd published the largest-component method in 1978, in the *Journal of Guidance and Control*. The idea: $4w^2 = 1 + \mathrm{tr}\,\mathbf{C}$, $4x^2 = 1 + 2C_{11} - \mathrm{tr}\,\mathbf{C}$, and similarly for $y$ and $z$. Since $w^2 + x^2 + y^2 + z^2 = 1$, the largest of the four squares is at least $\tfrac{1}{4}$, so the largest component is at least $\tfrac{1}{2}$. Compute that one with a square root, and get the other three from sums and differences of off-diagonal entries, dividing only by it. Variants of this method are standard in attitude software.
:::

::: context gimbal-lock Where three angles run out
Describe an attitude with three angles — yaw, then pitch, then roll (the 3-2-1 sequence) — and at pitch $\pm 90^\circ$ the yaw and roll axes line up. Two of the three angles then describe the same motion, one direction of rotation is lost, and the formulas that recover the angles divide by $\cos(\text{pitch}) = 0$. With mechanical gimbals this was a real hazard: the Apollo guidance platform had only three gimbals and warned the crew when it neared this condition. Quaternions have no such point, which is one reason flight software uses them.
:::

::: context right-hand-rule Which way is positive
Point your right thumb along the rotation axis. Your fingers curl in the direction of a positive rotation. For a positive turn about $x$, the fingers carry the $y$ axis toward the $z$ axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="170" y1="120" x2="80" y2="164" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="74,167 83,158 87,167" fill="#1f2a44"/>
  <text x="20" y="160" font-size="13" fill="#1f2a44">x (axis)</text>
  <line x1="170" y1="120" x2="300" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="306,120 294,115 294,125" fill="#1d6fd1"/>
  <text x="312" y="125" font-size="13" fill="#1d6fd1">y</text>
  <line x1="170" y1="120" x2="170" y2="22" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="170,16 165,28 175,28" fill="#1d6fd1"/>
  <text x="178" y="24" font-size="13" fill="#1d6fd1">z</text>
  <path d="M 270 110 Q 262 50 184 40" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="178,40 189,34 189,46" fill="#b4232c"/>
  <text x="262" y="48" font-size="12" fill="#b4232c">+90° about x</text>
  <text x="260" y="160" font-size="12" fill="#6c7a93" text-anchor="middle">y is carried to z</text>
  <text x="60" y="40" font-size="11" fill="#6c7a93">x points toward you</text>
</svg>
```
:::
