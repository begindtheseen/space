---
id: l02-approx-and-allclose
title: Comparing numbers that are only close
minutes: 22
covers:
  - pytest.approx and its rel/abs semantics; the 1e-6 relative default
  - numpy.testing assert_allclose and assert_array_equal
---

Weigh a bag of flour on a kitchen scale and you might read 1.002 kg. Weigh it again and you get 0.998 kg. Nobody calls the scale broken. You know the flour is "about a kilogram", and a few grams either way do not matter. Now weigh a loaded truck on a highway scale. A reading off by 4 kg is excellent, even though 4 kg of flour error would be terrible. How close counts as "the same" depends on what you are measuring.

Computers have the same problem with numbers that have a decimal point. Most of them cannot be stored exactly, and every calculation rounds a little. So a test that asks "is the answer exactly 7668.558175407055?" is asking the wrong question. The right question is "is the answer close enough, for this quantity, at this size?" — and you have to say what "close enough" means.

This lesson gives you the tools. You will see why `==` fails, learn the two ways to measure closeness, **relative** and **absolute**, and then use the two workhorses of numerical testing: **`pytest.approx`** for single numbers and small collections, and **`numpy.testing.assert_allclose`** for arrays. Along the way you will learn the default tolerances these tools use, and why you should almost never rely on them in guidance and navigation code.

## Why == fails on floating-point numbers

A **[[floating-point number|floating-point]]** is how a computer stores a number with a fractional part. Python's `float` and NumPy's `float64` keep about 16 significant digits. Numbers such as $0.1$ have no exact binary form, the way $1/3$ has no exact decimal form, so they are stored rounded. Then every addition or multiplication rounds again.

```python
print(0.1 + 0.2 == 0.3)            # False
print((0.1 + 0.2) + 0.3)           # 0.6000000000000001
print(0.1 + (0.2 + 0.3))           # 0.6
```

The last two lines add the same three numbers in a different order and get different answers. In ordinary arithmetic, order does not matter. In floating point, it does, at the level of the last digit.

That matters for testing because you rarely control the order. Here is the same sum, of ten copies of $0.1$, done two ways:

```python
import numpy as np

print(sum([0.1] * 10))             # 0.9999999999999999
print(np.sum(np.full(10, 0.1)))    # 1.0
```

Python's `sum` adds left to right. NumPy's `sum` [[adds in pairs|pairwise-sum]], a trick that reduces rounding. Both are correct. They round differently. The same thing happens when your code runs on a different processor, with a different build of the **[[BLAS|blas]]** library that does NumPy's matrix work, or with a compiler that reorders or fuses operations to run faster. The answers agree to about 15 digits and then disagree in the last bit or two.

The size of that last bit is set by **[[machine epsilon|machine-epsilon]]** — the gap between $1$ and the next larger number a `float64` can store, about $2.2 \times 10^{-16}$. Read $10^{-16}$ as "ten to the minus sixteen". Near any number $x$, neighboring floats are roughly $x \times 2.2 \times 10^{-16}$ apart. Near an orbit radius of $6.78 \times 10^{6}\,\mathrm{m}$, that spacing is about $9.3 \times 10^{-10}\,\mathrm{m}$ — less than a nanometer. Near $1$, it is $2.2 \times 10^{-16}$. The gap grows with the number.

::: key
Exact `==` on floats tests the last bit, and the last bit changes with summation order, library builds and compilers. Numerical tests compare with a stated tolerance.
:::

## Two ways to say "close enough"

Think about the two scales again. One way to judge them is **absolute**: "within 5 grams". Another is **relative**: "within 0.5 percent of the reading". A fixed amount, or a fraction of the size.

**Absolute tolerance** is a fixed allowed gap, written $\epsilon_\text{abs}$ and read "epsilon abs". Values $a$ and $b$ pass when

$$
|a - b| \le \epsilon_\text{abs}.
$$

The bars $|\,\cdot\,|$ mean absolute value, the size without the sign. It has the same units as $a$ and $b$ — meters, meters per second, radians.

**Relative tolerance** is an allowed gap that grows with the size of the numbers, written $\epsilon_\text{rel}$ ("epsilon rel"). It is a pure fraction with no units. Using the expected value $b$ as the yardstick, $a$ passes when

$$
|a - b| \le \epsilon_\text{rel}\,|b|.
$$

A relative tolerance of $10^{-6}$ means "agree to about six significant digits", whatever the size.

Each one fails in a predictable place.

- **Relative tolerance breaks at zero.** If the expected value is $b = 0$, the right side is $\epsilon_\text{rel} \times 0 = 0$. The test now demands $|a| \le 0$ — exact equality. A value that should be zero, such as the out-of-plane position of a satellite on an equatorial orbit, can come out as $2 \times 10^{-9}\,\mathrm{m}$ from rounding, and the test fails on noise.
- **Absolute tolerance breaks at large sizes.** Earth's **[[gravitational parameter|mu-earth]]** is $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$ (read "mu"). An absolute tolerance of $10^{-12}$ on that number asks for agreement to 26 significant digits, ten more than a float even has. It can only pass by luck.

The usual answer is to use both, and pass when [[either one is satisfied|tolerance-band]]. Python's `math.isclose` does this:

$$
|a - b| \le \max\big(\epsilon_\text{abs},\ \epsilon_\text{rel} \max(|a|, |b|)\big).
$$

Read $\max(x, y)$ as "the larger of x and y". Far from zero the relative part is larger and does the work. Near zero the relative part shrinks away and the absolute part takes over as a floor. This version uses the larger of $|a|$ and $|b|$ as the yardstick, so swapping $a$ and $b$ gives the same answer. We call that **symmetric**.

```python
import math

print(math.isclose(2.5e5, 2.5e5 + 0.2, rel_tol=1e-6))   # True: 0.2 <= 0.25
print(math.isclose(2.5e5, 2.5e5 + 0.3, rel_tol=1e-6))   # False: 0.3 > 0.25
print(math.isclose(0.0, 1e-13))                         # False: abs_tol is 0
print(math.isclose(0.0, 1e-13, abs_tol=1e-12))          # True
```

In the first line the relative gap allowed is $10^{-6} \times 250{,}000 = 0.25$, so a difference of $0.2$ passes and $0.3$ does not. The third line shows the zero trap: `math.isclose` has no absolute floor unless you give it one.

::: key
Use an absolute tolerance for a value that passes through zero. A relative tolerance around zero demands exact equality, so the test fails on noise at 1e-18. State an absolute floor that reflects the physically meaningful resolution.
:::

### Choosing the absolute floor

The absolute floor is not a number to tune until the test goes green. It comes from the physics. Ask: "What is the smallest difference in this quantity that would matter to anyone?" For a position that feeds a landing, a micrometer is far below anything real. For an attitude angle, $10^{-9}\,\mathrm{rad}$ is far below the noise of any [[star tracker|star-tracker]]. Then pick a floor comfortably above rounding noise and comfortably below that meaningful size, and write the reason next to it in a comment.

When a check fails, it helps to report exactly what went wrong. If you write your own comparison helper, raise an `AssertionError` with a message that names the numbers. The `!r` inside an f-string prints each value's full `repr`, every digit:

```python
def assert_positive_mass(m):
    if not m > 0:
        raise AssertionError(f"mass must be positive, got m={m!r}")

try:
    assert_positive_mass(-12.5)
except AssertionError as exc:
    print(exc)            # mass must be positive, got m=-12.5
```

A tolerance check deserves the same treatment: name both values, the gap between them, and the tolerances used, so whoever reads the failure can see at once whether it missed by a hair or by a mile.

## pytest.approx

`pytest.approx` wraps an expected value so that `==` means "close enough" instead of "identical". You write it on one side of an ordinary comparison:

```python
import pytest

print(0.1 + 0.2 == pytest.approx(0.3))    # True
print(repr(pytest.approx(0.3)))           # 0.3 ± 3.0e-07
```

The `repr` shows the allowed window: $0.3 \pm 3 \times 10^{-7}$ (read "plus or minus"). That window comes from its two tolerances:

- `rel`, the relative tolerance, **default $10^{-6}$**;
- `abs`, the absolute tolerance, **default $10^{-12}$**.

The allowed gap is the larger of the two:

$$
\text{tolerance} = \max\big(\text{rel} \times |\text{expected}|,\ \text{abs}\big).
$$

Here $10^{-6} \times 0.3 = 3 \times 10^{-7}$, which beats $10^{-12}$. Unlike `math.isclose`, pytest measures the relative part against the **expected** value only — the one inside `approx(...)`. So it is not symmetric: `1 == pytest.approx(2, rel=0.5)` is `True` (the window is $2 \pm 1$), while `2 == pytest.approx(1, rel=0.5)` is `False` (the window is $1 \pm 0.5$). Always put the trusted reference value inside `approx`.

The two keyword arguments interact in a way that surprises people. Check the windows:

```python
import pytest

print(repr(pytest.approx(7.0, rel=1e-3)))            # 7.0 ± 0.007
print(repr(pytest.approx(7.0, abs=1e-3)))            # 7.0 ± 0.001
print(repr(pytest.approx(1e-20, rel=1e-3)))          # 1e-20 ± 1.0e-12
print(repr(pytest.approx(7.0, rel=1e-3, abs=1)))     # 7.0 ± 1
```

- Give only `rel`, and the default absolute floor of $10^{-12}$ is still there (third line).
- Give only `abs`, and pytest drops the relative part entirely (second line: the window is exactly $0.001$, not $0.007$).
- Give both, and the larger wins (fourth line).

`approx` also works on lists, tuples, dictionaries and NumPy arrays, comparing element by element with the same rule: `[0.1 + 0.2, 0.2 + 0.4] == pytest.approx([0.3, 0.6])` is `True`. It only supports `==` and `!=`. Writing `x < pytest.approx(2.0)` raises a `TypeError`, because "less than, roughly" has no single meaning.

::: key
pytest.approx default tolerance: relative 1e-6 with an absolute floor of 1e-12. That is far looser than double precision, so for a tight numerical check you must state the tolerance you actually mean.
:::

Why "far looser"? A float carries about 16 digits. A relative tolerance of $10^{-6}$ checks only 6 of them. For quick checks of a formula that is fine. For code where the seventh digit matters, it lets real bugs through, as the next example shows.

::: example A rounded constant that the default lets through
A function computes the speed of a circular orbit, $v = \sqrt{\mu / r}$, but someone typed Earth's $\mu$ as `3.986e14` instead of `3.986004418e14`. Two tests compare it to the reference, 400 km above the equator, $r = 6{,}378{,}137 + 400{,}000 = 6{,}778{,}137\,\mathrm{m}$:

```python
# speed.py
import math

MU_EARTH = 3.986e14  # m^3/s^2  (bug: rounded; the real value is 3.986004418e14)


def circular_speed(r):
    """Speed (m/s) of a circular orbit of radius r (m)."""
    return math.sqrt(MU_EARTH / r)
```

```python
# test_speed.py
import math

import pytest

from speed import circular_speed      # uses the rounded MU

MU = 3.986004418e14  # m^3/s^2, reference value
R = 6378137.0 + 400e3  # m, 400 km above the equator


def test_speed_default_tolerance():
    assert circular_speed(R) == pytest.approx(math.sqrt(MU / R))


def test_speed_stated_tolerance():
    assert circular_speed(R) == pytest.approx(math.sqrt(MU / R), rel=1e-12)
```

```text
.F                                                                       [100%]
_________________________ test_speed_stated_tolerance __________________________

>       assert circular_speed(R) == pytest.approx(math.sqrt(MU / R), rel=1e-12)
E       assert 7668.553925574911 == 7668.558175407055 ± 7.7e-09
E
E         comparison failed
E         Obtained: 7668.553925574911
E         Expected: 7668.558175407055 ± 7.7e-09

test_speed.py:17: AssertionError
1 failed, 1 passed in 0.15s
```

**Step 1: the true speed.** $v = \sqrt{3.986004418 \times 10^{14} / 6{,}778{,}137} = 7668.558\,\mathrm{m/s}$, about $7.67\,\mathrm{km/s}$, the familiar low-orbit speed.

**Step 2: the buggy speed.** With the rounded $\mu$, $v = 7668.554\,\mathrm{m/s}$. The gap is $0.00425\,\mathrm{m/s}$, about $4\,\mathrm{mm/s}$, a relative error of $5.5 \times 10^{-7}$.

**Step 3: the default window.** $10^{-6} \times 7668.56 = 0.00767\,\mathrm{m/s}$. The gap of $0.00425$ fits inside it, so the first test passes. The bug is invisible.

**Step 4: the stated window.** With `rel=1e-12` the window is $7.7 \times 10^{-9}\,\mathrm{m/s}$. The gap is half a million times bigger, so the second test fails and prints both speeds.

**Sanity check.** Is $10^{-12}$ fair, or too strict? The computation is one division and one square root, each rounding by at most about one part in $10^{16}$. So $10^{-12}$ leaves a margin of thousands over rounding noise, while catching any wrong constant. And $4\,\mathrm{mm/s}$ is not harmless: a speed off by $0.00425\,\mathrm{m/s}$ puts a predicted position about $0.00425 \times 86{,}400 = 367\,\mathrm{m}$ behind after one day.
:::

::: warning The default is a placeholder, not a decision
Writing `== pytest.approx(expected)` with no arguments is fine for a first draft. Before the test is merged, decide what tolerance the quantity deserves, pass it explicitly, and say why in a comment. A reviewer should be able to read the tolerance and agree with it.
:::

::: example A zero that is zero in one unit but not another
On a circular orbit, position and velocity are perpendicular, so their **[[dot product|dot-product]]** $\mathbf{r} \cdot \mathbf{v}$ is zero. Here is a function that builds the state on a circular orbit in the equator's plane, at angle $\theta$ (read "theta") from the $x$ axis:

```python
# orbit.py
import numpy as np

MU_EARTH = 3.986004418e14  # m^3/s^2


def circular_state(r, theta):
    """Position (m) and velocity (m/s) on a circular equatorial orbit."""
    v = np.sqrt(MU_EARTH / r)
    pos = np.array([r * np.cos(theta), r * np.sin(theta), 0.0])
    vel = np.array([-v * np.sin(theta), v * np.cos(theta), 0.0])
    return pos, vel
```

Test it at $\theta = 4\,\mathrm{rad}$ on a $6{,}778{,}137\,\mathrm{m}$ orbit. The `@` operator is NumPy's dot product:

```python
# test_orbit.py
import numpy as np
import pytest

from orbit import circular_state


def test_r_dot_v_is_zero():
    pos, vel = circular_state(6778137.0, 4.0)
    assert pos @ vel == pytest.approx(0.0)


def test_radial_speed_is_zero():
    pos, vel = circular_state(6778137.0, 4.0)
    v_radial = pos @ vel / np.linalg.norm(pos)   # m/s
    assert v_radial == pytest.approx(0.0, abs=1e-6)
```

```text
F.                                                                       [100%]
_____________________________ test_r_dot_v_is_zero _____________________________

>       assert pos @ vel == pytest.approx(0.0)
E       assert np.float64(3....213367408e-06) == 0.0 ± 1.0e-12
E
E         comparison failed
E         Obtained: 3.1199601213367408e-06
E         Expected: 0.0 ± 1.0e-12
```

**Step 1: why the first test fails.** The expected value is zero, so the relative part of the window is zero and only the $10^{-12}$ floor is left. The dot product came out as $3.1 \times 10^{-6}\,\mathrm{m^2/s}$. That sounds tiny, but it is a product of numbers near $6.8 \times 10^{6}\,\mathrm{m}$ and $7.7 \times 10^{3}\,\mathrm{m/s}$, about $5 \times 10^{10}$ in size before the terms cancel. Rounding at one part in $10^{16}$ of that is a few times $10^{-6}$. The result is pure noise, and the floor was set for numbers near 1.

**Step 2: change to a quantity with meaning.** Dividing by $|\mathbf{r}|$ gives the **radial speed**, how fast the vehicle moves toward or away from Earth, in m/s. It came out near $4.6 \times 10^{-13}\,\mathrm{m/s}$.

**Step 3: pick the floor from the physics.** No navigation system can tell a radial speed of one micrometer per second from zero, so `abs=1e-6` m/s is a meaningful resolution. It sits millions of times above the noise and far below any real error.

**Sanity check.** A genuine bug, such as a velocity pointing a few degrees off perpendicular, gives a radial speed of hundreds of m/s. The test would catch it by eight orders of magnitude.
:::

## NumPy's assert_allclose and assert_array_equal

For arrays, reach for the `numpy.testing` module. Its two most used functions differ in one question: is any difference allowed?

### assert_allclose

`assert_allclose(actual, desired, rtol=1e-07, atol=0)` checks every element with this rule:

$$
|\text{actual} - \text{desired}| \le \text{atol} + \text{rtol} \times |\text{desired}|.
$$

Three things to notice. It *adds* the two tolerances instead of taking the larger, which makes almost no difference in practice. Like pytest, it measures relative error against `desired`, the second argument, so put your reference there. And its default `atol` is **zero**, so with the defaults it is a pure relative test — any element whose desired value is exactly zero must match exactly. It also checks that the two arrays have the same shape.

Its real strength is the report. When it fails, it tells you how many elements missed, which index was worst, and by how much in absolute and relative terms.

::: example A full lap that does not quite come home
Build the state at $\theta = 0$ and again at $\theta = 2\pi$, one full lap later. Physically they are identical. The test:

```python
# test_state.py
import numpy as np
from numpy.testing import assert_allclose

from orbit import circular_state

R = 6778137.0  # m


def test_full_lap_returns_to_start():
    pos0, vel0 = circular_state(R, 0.0)
    pos1, vel1 = circular_state(R, 2 * np.pi)
    assert_allclose(pos1, pos0)
```

```text
E       Not equal to tolerance rtol=1e-07, atol=0
E
E       Mismatched elements: 1 / 3 (33.3%)
E       Mismatch at index:
E        [1]: -1.6601647562464487e-09 (ACTUAL), 0.0 (DESIRED)
E       Max absolute difference among violations: 1.66016476e-09
E       Max relative difference among violations: inf
E        ACTUAL: array([ 6.778137e+06, -1.660165e-09,  0.000000e+00])
E        DESIRED: array([6778137.,       0.,       0.])
```

**Step 1: read the report.** One of three elements failed, at index 1, the $y$ position. It came out $-1.66 \times 10^{-9}\,\mathrm{m}$ where zero was expected. The relative difference is infinite, because it divides by a desired value of zero.

**Step 2: find the cause.** In floating point, $\sin(2\pi)$ is not exactly zero. It is about $-2.4 \times 10^{-16}$, because $2\pi$ itself is stored rounded. Multiply by $6.78 \times 10^{6}\,\mathrm{m}$ and you get $-1.66 \times 10^{-9}\,\mathrm{m}$. That is about two float spacings at the size of the orbit radius — pure rounding, not a bug.

**Step 3: state tolerances with units.** Position and velocity have different units, so check them separately:

```python
    assert_allclose(pos1, pos0, rtol=1e-12, atol=1e-6)   # m
    assert_allclose(vel1, vel0, rtol=1e-12, atol=1e-9)   # m/s
```

This version passes. A micrometer of position and a nanometer per second of velocity are far below anything a navigation filter can see, and far above rounding.

**Sanity check.** A real bug, such as a lap that ends $10^{-4}\,\mathrm{rad}$ short, would miss by $678\,\mathrm{m}$, hundreds of millions of times the atol.
:::

::: key
Use assert_allclose rather than assert_array_equal for floats. assert_array_equal requires bit-for-bit equality, which differs across BLAS builds, vectorization and compilers. assert_allclose takes rtol and atol and prints the worst mismatch and its index when it fails.
:::

### assert_array_equal

`assert_array_equal(actual, desired)` demands exact equality, element by element, and the same shape. It is the right tool when the values are exact by nature:

- integer arrays, such as counts or the indices returned by `np.argsort`;
- boolean masks, such as "which samples were flagged as outliers";
- shapes and sizes, and values that were copied rather than computed.

It treats [[NaN|nan]] ("not a number", the float that marks a missing or undefined value) in the same position of both arrays as equal, which is usually what a test wants.

On floats it tests the last bit, and its report can look strange:

```python
import numpy as np
from numpy.testing import assert_array_equal

assert_array_equal(np.array([0.1 + 0.2, 1.0]), np.array([0.3, 1.0]))
# AssertionError:
# Arrays are not equal
#
# Mismatched elements: 1 / 2 (50%)
# Mismatch at index:
#  [0]: 0.30000000000000004 (ACTUAL), 0.3 (DESIRED)
# Max absolute difference among violations: 5.55111512e-17
# Max relative difference among violations: 1.85037171e-16
#  ACTUAL: array([0.3, 1. ])
#  DESIRED: array([0.3, 1. ])
```

The last two lines print identical-looking arrays, because NumPy rounds for display. The difference, $5.6 \times 10^{-17}$, shows only in the mismatch line.

::: warning np.allclose is not assert_allclose
`np.allclose(a, b)` returns `True` or `False` instead of raising, and it has different defaults: `rtol=1e-05`, `atol=1e-08`. That hidden `atol` means `np.allclose([1.0, 1e-9], [1.0, 0.0])` is `True`, while `assert_allclose` on the same arrays fails. Inside `assert np.allclose(...)`, a failure also tells you nothing about which element missed. In tests, use `assert_allclose` and state both tolerances.
:::

## Check yourself

::: check
What window does `pytest.approx(250.0)` allow, and what window does `pytest.approx(250.0, abs=0.5)` allow? Explain the difference.
:::

::: answer
With the defaults, the tolerance is $\max(10^{-6} \times 250,\ 10^{-12}) = 2.5 \times 10^{-4}$, so the window is $250 \pm 0.00025$.

With `abs=0.5` and no `rel`, pytest switches the relative part off entirely, so the window is exactly $250 \pm 0.5$. Here the answer happens to match what "the larger of the two" would give, since $0.5 > 0.00025$. The difference shows when `abs` is the smaller one: `pytest.approx(250.0, abs=1e-9)` gives $250 \pm 10^{-9}$, not $\pm 0.00025$.
:::

::: check
A test checks the cross-track position error of a simulated vehicle that flies straight down the track. The expected value is `0.0` and the result is $-4 \times 10^{-11}\,\mathrm{m}$. The test uses `assert_allclose(err, 0.0, rtol=1e-9)` and fails. Why, and how should it be written?
:::

::: answer
`assert_allclose` allows $\text{atol} + \text{rtol} \times |\text{desired}|$. With desired $= 0$ and the default atol $= 0$, that is $0 + 10^{-9} \times 0 = 0$. The test demands an exact zero, and rounding noise of $4 \times 10^{-11}\,\mathrm{m}$ fails it. Raising `rtol` would change nothing, since it still multiplies zero.

Use an absolute tolerance chosen from what matters, for example `assert_allclose(err, 0.0, rtol=0, atol=1e-6)  # m: far below any guidance-relevant error`. A micrometer is far above the noise and far below any real cross-track error.
:::

::: check
Your test compares a 6-element state vector — three positions in meters and three velocities in m/s — with one call to `assert_allclose(state, ref, rtol=1e-10, atol=1e-6)`. What is wrong with the single `atol`?
:::

::: answer
`atol` has units, and here it means $10^{-6}\,\mathrm{m}$ for the positions but $10^{-6}\,\mathrm{m/s}$ for the velocities. Those need not be equally meaningful. A micrometer of position might be very tight while a micrometer per second of velocity, integrated over a day, grows to about $0.09\,\mathrm{m}$. Check the parts separately, `state[:3]` with a position floor and `state[3:]` with a velocity floor, each justified in its own units.
:::

::: check
Which tool fits each check, `assert_array_equal` or `assert_allclose`? (a) The indices of the three brightest stars in an image, from `np.argsort`. (b) A rotated vector computed with `R @ v`. (c) The shape of a Jacobian matrix. (d) A boolean mask marking which GPS measurements were rejected.
:::

::: answer
(a) `assert_array_equal`: indices are integers and must match exactly.

(b) `assert_allclose`: it is floating-point arithmetic, which may differ in the last bits across BLAS builds and processors. Give rtol and atol.

(c) Exact: a shape is a tuple of integers, so `assert jac.shape == (6, 6)` or `assert_array_equal` both work.

(d) `assert_array_equal`: booleans are exact. (If a rejection flips because a value sits exactly on a threshold, that is worth knowing, not hiding behind a tolerance.)
:::

::: check
`assert x == pytest.approx(y)` passes but `assert y == pytest.approx(x)` fails. How can that be, and which form should you write?
:::

::: answer
pytest measures the relative part of the tolerance against the value inside `approx`. If $|x|$ is smaller than $|y|$, the window around $x$ is narrower than the window around $y$, so the same gap can fit inside one and not the other. It only matters when the tolerance is large compared with the gap, but it can happen.

Write the trusted reference value inside `approx` — the analytic answer, the published constant, the golden value — and put the computed value on the other side. Then the tolerance is a fraction of the thing you trust.
:::

## Summary

| Tool or idea | Rule | Default |
|---|---|---|
| absolute tolerance | gap within a fixed amount, with units | — |
| relative tolerance | gap within a fraction of the size | — |
| `math.isclose` | larger of abs and rel times larger magnitude; symmetric | rel 1e-9, abs 0 |
| `pytest.approx` | larger of rel times expected and abs | rel 1e-6, abs 1e-12 |
| `approx` with only `abs` | relative part switched off | — |
| `assert_allclose` | atol plus rtol times desired, element-wise | rtol 1e-7, atol 0 |
| `assert_array_equal` | exact, same shape, NaN equals NaN | — |
| `np.allclose` | returns a bool, not a report | rtol 1e-5, atol 1e-8 |

Choose relative tolerance for large non-zero quantities, absolute for anything that passes through zero, and justify both in a comment. The next lesson takes one well-chosen comparison and runs it over a whole table of cases with `@pytest.mark.parametrize`, so each case passes or fails on its own with a readable name.

::: context floating-point How a float stores a number
A `float64` stores a number the way scientific notation does: a sign, 52 bits of digits (plus one implied bit) and an exponent that says where the point goes. So it keeps about 16 significant decimal digits at any size, from $10^{-308}$ to $10^{308}$. The catch is that floats are not evenly spaced. Between each power of two there are the same number of them, so the gap between neighbors doubles every time the numbers double.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="20" y1="42" x2="20" y2="58"/><line x1="30" y1="44" x2="30" y2="56"/><line x1="40" y1="44" x2="40" y2="56"/><line x1="50" y1="44" x2="50" y2="56"/>
    <line x1="60" y1="42" x2="60" y2="58"/><line x1="80" y1="44" x2="80" y2="56"/><line x1="100" y1="44" x2="100" y2="56"/><line x1="120" y1="44" x2="120" y2="56"/>
    <line x1="140" y1="42" x2="140" y2="58"/><line x1="180" y1="44" x2="180" y2="56"/><line x1="220" y1="44" x2="220" y2="56"/><line x1="260" y1="44" x2="260" y2="56"/>
    <line x1="300" y1="42" x2="300" y2="58"/>
  </g>
  <text x="20" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="60" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="140" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="300" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">8</text>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">same count of floats per doubling, so the gaps double</text>
  <text x="180" y="24" font-size="12" text-anchor="middle" fill="#1d6fd1">a toy float format with 4 values per doubling</text>
</svg>
```

That is why a relative tolerance fits floats so naturally: rounding error is a fraction of the number's size.
:::

::: context pairwise-sum Why adding in pairs rounds less
Adding a long list left to right, each new number joins a running total that keeps growing, and every addition rounds against that big total. The worst-case error grows roughly in proportion to the length of the list. Pairwise summation adds neighbors in pairs, then adds the pair sums in pairs, and so on, like the rounds of a tournament. Each number takes part in only about $\log_2 n$ additions, so the error grows like $\log_2 n$ instead. For a million numbers that is about 20 roundings instead of up to a million. NumPy uses this method for most `np.sum` calls on floats.
:::

::: context blas The library underneath NumPy
BLAS, short for Basic Linear Algebra Subprograms, is a standard set of routines for vector and matrix arithmetic, first published in 1979. NumPy hands matrix products and many other operations to whichever BLAS it was built with, such as OpenBLAS or Intel's MKL. Each is tuned for particular processors: it splits the work into blocks, uses vector instructions that handle several numbers at once, and runs threads in parallel. Those choices change the order of additions, so `A @ B` on two machines can differ in the last bit while both are correct.
:::

::: context machine-epsilon The smallest step up from one
Machine epsilon for `float64` is $2^{-52} \approx 2.22 \times 10^{-16}$: the next float after $1$ is $1 + 2^{-52}$. Rounding to the nearest float is off by at most half a step, so one arithmetic operation is accurate to about one part in $9 \times 10^{15}$. NumPy tells you both numbers: `np.finfo(float).eps` gives the epsilon, and `np.spacing(x)` gives the gap from `x` to the next float up. `np.spacing(6778137.0)` is about $9.3 \times 10^{-10}$. A tolerance tighter than a few spacings is asking for more than the hardware can give.
:::

::: context mu-earth Why engineers use mu instead of G and M
The gravitational parameter $\mu = GM$ is Newton's constant times Earth's mass. We know the product far better than either factor, because it is measured directly from how satellites move: to about ten significant digits, $3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$. $G$ alone is known to only about four or five. So orbit software carries $\mu$ as one constant. Rounding it to $3.986 \times 10^{14}$ throws away most of that hard-won precision, which is why the first example treats it as a bug.
:::

::: context tolerance-band The shape of a combined tolerance
Plot the allowed gap against the size of the expected value. The absolute tolerance is a flat line. The relative tolerance is a straight line through the origin. Taking the larger of the two gives a hockey stick: flat near zero, rising in proportion further out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#f2b880" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="40" y1="170" x2="340" y2="50" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="40,140 115,140 340,50" fill="none" stroke="#1d6fd1" stroke-width="3.5"/>
  <text x="300" y="134" font-size="11" text-anchor="middle" fill="#1f2a44">abs floor</text>
  <text x="250" y="62" font-size="11" text-anchor="end" fill="#1f2a44">rel × |expected|</text>
  <text x="190" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">size of expected value</text>
  <text x="30" y="95" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 30 95)">allowed gap</text>
  <text x="80" y="130" font-size="11" text-anchor="middle" fill="#1d6fd1">near zero</text>
</svg>
```

The corner sits where the two are equal, at a size of abs divided by rel. For pytest's defaults that is $10^{-12} / 10^{-6} = 10^{-6}$.
:::

::: context star-tracker A camera that finds its way by the stars
A star tracker is a small camera on a spacecraft that photographs the sky, matches the pattern of bright stars against a catalog, and works out which way the spacecraft points. Good ones are accurate to a few arcseconds. One arcsecond is $1/3600$ of a degree, about $4.8 \times 10^{-6}\,\mathrm{rad}$. So an attitude difference of $10^{-9}\,\mathrm{rad}$ is thousands of times smaller than the best measurement any vehicle can make, which makes it a safe floor for a test.
:::

::: context dot-product Why perpendicular vectors give zero
The dot product multiplies matching components and adds them: $\mathbf{r} \cdot \mathbf{v} = r_x v_x + r_y v_y + r_z v_z$. It also equals $|\mathbf{r}|\,|\mathbf{v}|\cos\phi$, where $\phi$ is the angle between the vectors. On a circular orbit the velocity is always at $90°$ to the position, and $\cos 90° = 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="95" r="70" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <circle cx="130" cy="95" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="130" y1="95" x2="190.6" y2="60" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="190.6,60 180.1,61.1 185.1,69.8" fill="#1d6fd1"/>
  <line x1="190.6" y1="60" x2="160.6" y2="8" stroke="#b4232c" stroke-width="3"/>
  <polygon points="160.6,8 161.7,18.5 170.4,13.5" fill="#b4232c"/>
  <polyline points="184.1,63.8 180.1,56.8 186.6,53.0" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="150" y="92" font-size="12" fill="#1d6fd1">r</text>
  <text x="182" y="28" font-size="12" fill="#b4232c">v</text>
  <text x="250" y="80" font-size="12" fill="#1f2a44">r · v = 0</text>
  <text x="250" y="98" font-size="11" fill="#6c7a93">on a circular orbit</text>
</svg>
```

On an elliptical orbit the angle drifts away from $90°$, and $\mathbf{r} \cdot \mathbf{v}$ becomes positive while the vehicle climbs and negative while it falls.
:::

::: context nan The number that is not equal to itself
NaN is a special float value defined by the IEEE 754 standard for floating-point arithmetic. It comes out of operations with no sensible answer, such as $0/0$ or $\infty - \infty$, and many teams also use it to mark a missing sensor sample. By the standard's rule, NaN compares unequal to everything, including itself: `np.nan == np.nan` is `False`. A naive element-by-element check would therefore fail on two arrays with NaN in the same place, so `assert_array_equal` and `assert_allclose` treat matching NaNs as equal on purpose. A NaN where a number was expected is still a failure.
:::
