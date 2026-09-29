---
id: l03-parametrize
title: One test, a whole table of cases
minutes: 20
covers:
  - parametrize for tables of cases; ids for readable failures
---

Think about how a school marks a spelling test. There is one answer key, and thirty students hand in papers. The teacher does not stop at the first wrong paper and send the rest home ungraded. Every paper gets its own mark, with the student's name on it. At the end the teacher can see at a glance that Sam and Priya both missed the same word, which says something about the word, not the students.

Tests of numerical code often look like that. You have one check — "the solver's answer satisfies the equation" — and a whole table of inputs to try it on: a circular orbit, a slightly oval one, a very stretched one, a point near the far end. You want every input checked, and you want each failure to carry a name that tells you which input it was.

pytest does this with **[[parametrization|parametrize-word]]**: you write the test once, hand pytest a table of cases, and it turns each row into a separate test. In this lesson you will write a parametrized test for a Kepler solver, see why it beats a `for` loop, give the cases readable names, build grids of cases, and parametrize a differential-equation solver over its initial conditions.

## A table of cases with @pytest.mark.parametrize

Here is the solver we will test. It finds the eccentric anomaly $E$ from the mean anomaly $M$ and the eccentricity $e$ by solving **[[Kepler's equation|kepler-recap]]**, $M = E - e \sin E$, with Newton's method. You met this equation and this method in the root-finding lesson of the SciPy module. Each Newton step divides the residual by the slope, $f'(E) = 1 - e \cos E$ (read "f prime of E").

```python
# kepler.py
import math


def solve_kepler(M, e, tol=1e-12, max_iter=50):
    """Eccentric anomaly E (rad) from mean anomaly M (rad), for 0 <= e < 1."""
    E = M if e < 0.8 else math.pi          # starting guess
    for _ in range(max_iter):
        f = E - e * math.sin(E) - M        # residual
        E -= f / (1.0 - e * math.cos(E))   # Newton step: f / f'(E)
        if abs(f) < tol:
            return E
    raise RuntimeError("Kepler solver did not converge")
```

A good check for any equation solver: put the answer back into the equation and confirm the residual is tiny. The residual is $E - e\sin E - M$, which is a value that passes through zero, so, as the last lesson showed, it needs an absolute tolerance.

Now the test. The line starting with `@` right above the function is a **[[decorator|decorator]]** — a line that wraps the function below it and changes how it is used. `@pytest.mark.parametrize` takes two things:

1. a string naming the test's arguments, separated by commas: `"M, e"`;
2. a list of cases, one tuple per case, with values in the same order as the names.

```python
# test_kepler.py
import math

import pytest

from kepler import solve_kepler


@pytest.mark.parametrize(
    "M, e",
    [
        (0.0, 0.0),
        (1.0, 0.0167),
        (1.0, 0.5),
        (0.525, 0.74),
        (2.0, 0.73),
        (3.0, 0.95),
    ],
)
def test_residual_is_tiny(M, e):
    E = solve_kepler(M, e)
    assert E - e * math.sin(E) - M == pytest.approx(0.0, abs=1e-12)
```

The test function has parameters `M` and `e`, matching the names in the string. pytest calls it once per tuple, filling in the values. Run it with `-v` to see every case:

```text
$ pytest -v test_kepler.py
test_kepler.py::test_residual_is_tiny[0.0-0.0] PASSED                    [ 16%]
test_kepler.py::test_residual_is_tiny[1.0-0.0167] PASSED                 [ 33%]
test_kepler.py::test_residual_is_tiny[1.0-0.5] PASSED                    [ 50%]
test_kepler.py::test_residual_is_tiny[0.525-0.74] PASSED                 [ 66%]
test_kepler.py::test_residual_is_tiny[2.0-0.73] PASSED                   [ 83%]
test_kepler.py::test_residual_is_tiny[3.0-0.95] PASSED                   [100%]
============================== 6 passed in 0.16s ===============================
```

One function became six tests. Each has its own node id, with a **case id** in square brackets. By default pytest builds the case id from the values themselves, joined by dashes: `M = 1.0` and `e = 0.5` gives `[1.0-0.5]`.

The rows are not random. Each one covers a different kind of orbit:

- `(0.0, 0.0)`: a perfect circle at the starting point, where the answer is exactly zero;
- `(1.0, 0.0167)`: nearly circular, about as oval as Earth's path around the Sun;
- `(1.0, 0.5)`: a moderately stretched orbit;
- `(0.525, 0.74)`: a **[[Molniya orbit|molniya]]** satellite one hour after its closest point;
- `(2.0, 0.73)`: a **[[geostationary transfer orbit|gto]]**, on the way out;
- `(3.0, 0.95)`: a very stretched orbit near its far end.

A table like this is worth more than a pile of random inputs. Each row should be there for a reason you could say out loud.

When the test has only one argument, the list holds plain values instead of tuples: `@pytest.mark.parametrize("e", [0.0, 0.3, 0.9])`.

::: key
`@pytest.mark.parametrize("a, b", [(a1, b1), (a2, b2), ...])` runs the test once per tuple. Each case is a separate test with its own node id, `test_name[case-id]`.
:::

## Why not a for loop?

You could write the same table as a loop inside one test. It looks shorter:

```python
# test_kepler_loop.py
import math

import pytest

from kepler import solve_kepler

CASES = [(0.0, 0.0), (1.0, 0.0167), (1.0, 0.5), (0.525, 0.74), (2.0, 0.73), (3.0, 0.95)]


def test_residual_loop():
    for M, e in CASES:
        E = solve_kepler(M, e)
        assert E - e * math.sin(E) - M == pytest.approx(0.0, abs=1e-12)
```

While everything passes, the two versions look the same. The difference shows the day something breaks.

::: example One bug, reported two ways
Plant a sign error in the Newton step, using the slope $1 + e\cos E$ instead of $1 - e\cos E$:

```python fragment
        E -= f / (1.0 + e * math.cos(E))   # bug: wrong sign in f'(E)
```

Run the loop version:

```text
>           E = solve_kepler(M, e)

test_kepler_loop.py:13:
M = 2.0, e = 0.73, tol = 1e-12, max_iter = 50
>       raise RuntimeError("Kepler solver did not converge")
E       RuntimeError: Kepler solver did not converge
FAILED test_kepler_loop.py::test_residual_loop - RuntimeError: Kepler solver ...
1 failed in 0.13s
```

Run the parametrized version:

```text
FAILED test_kepler.py::test_residual_is_tiny[2.0-0.73] - RuntimeError: Kepler...
FAILED test_kepler.py::test_residual_is_tiny[3.0-0.95] - RuntimeError: Kepler...
2 failed, 4 passed in 0.13s
```

**Step 1: count what each one tells you.** The loop reports one failure. It stopped at the fifth case, because a failed `assert` or an exception ends the test function on the spot. The sixth case never ran. You have to dig into the traceback to learn which inputs were being used. The parametrized version ran all six cases and reports two failures and four passes, each named.

**Step 2: read the pattern.** Four cases survived the bug. Why? The wrong slope is $1 + e\cos E$ instead of $1 - e\cos E$. When $e$ is small, both are close to $1$, so the steps are nearly right and the iteration still limps to the answer. The two failures are the high-eccentricity cases whose answers lie on the far side of the orbit, where $\cos E$ is negative. For `(3.0, 0.95)`, starting at $E = \pi$ where $\cos E = -1$, the true slope is $1 + 0.95 = 1.95$ but the buggy one is $1 - 0.95 = 0.05$. That makes the first step $1.95 / 0.05 = 39$ times too long, and the iteration flies off.

**Step 3: notice what would have happened with a shorter table.** With only the first four rows, this bug passes every test. The table caught it because it included the hard cases.

**Sanity check.** "Fails only at high eccentricity, far from periapsis" points straight at the part of the formula that depends on $e\cos E$. That is exactly where the bug is.
:::

::: key
`@pytest.mark.parametrize` beats a loop in the test body: each case becomes a separate test, they all run even if one fails, failures name the specific case, and you can select or mark individual cases. A loop stops at the first failure and hides the rest.
:::

## Case ids for readable failures

`[2.0-0.73]` is better than nothing, but it makes you remember what those numbers mean. A failure in a nightly run, read by someone who did not write the test, should say what kind of case broke. You can name each case yourself. The name you give is its **id**.

There are three ways to do it.

**1. `pytest.param` with `id=`.** Wrap each row in `pytest.param(...)` and give it a name. This keeps each name right next to its values, which is the easiest to read and to keep correct when you add rows:

```python
# test_kepler_named.py
import math

import pytest

from kepler import solve_kepler


@pytest.mark.parametrize(
    "M, e",
    [
        pytest.param(0.0, 0.0, id="circle-at-periapsis"),
        pytest.param(1.0, 0.0167, id="earth-like"),
        pytest.param(1.0, 0.5, id="moderate"),
        pytest.param(0.525, 0.74, id="molniya-1h"),
        pytest.param(2.0, 0.73, id="gto"),
        pytest.param(3.0, 0.95, id="high-e-near-apoapsis"),
    ],
)
def test_residual_is_tiny(M, e):
    E = solve_kepler(M, e)
    assert E - e * math.sin(E) - M == pytest.approx(0.0, abs=1e-12)
```

With the same planted bug, the summary now reads like a sentence:

```text
FAILED test_kepler_named.py::test_residual_is_tiny[gto] - RuntimeError: Keple...
FAILED test_kepler_named.py::test_residual_is_tiny[high-e-near-apoapsis] - Ru...
```

"The transfer orbit and the high-eccentricity case broke." You know where to look before you open the traceback.

**2. `ids=` with a list of strings,** one per case, in the same order. It is shorter when the rows are short, but the names sit far from their values, so it is easy to add a row and forget its name. pytest refuses to run if the lists have different lengths, which at least makes that mistake loud.

**3. `ids=` with a function.** pytest calls the function on each value and uses what it returns. That is handy when a name can be built from the value, like `ids=lambda e: f"e={e}"`. A **[[lambda|lambda-word]]** is a one-line function without a name. When a case has several arguments, pytest calls the function on each argument separately and joins the pieces with dashes.

If pytest cannot turn a value into a short name — a NumPy array, a dictionary, an object of your own class — it falls back to the argument name plus the row number: `state0`, `state1`. That is a strong hint that the case deserves an id.

::: key
Give cases ids with `pytest.param(..., id="name")`, or `ids=[...]`, or `ids=function`. Name each case for what makes it special, so a failure summary says which kind of input broke.
:::

### Running and selecting single cases

A case id is part of the node id, so you can run one case alone. Put quotes around it, because square brackets have a special meaning in most shells:

```text
$ pytest -q "test_kepler_named.py::test_residual_is_tiny[gto]"
.                                                                        [100%]
1 passed in 0.13s
```

The `-k` option selects tests whose names contain some words. It accepts `and`, `or` and `not`:

```text
$ pytest -q -k "gto or molniya" test_kepler_named.py
..                                                                       [100%]
2 passed, 4 deselected in 0.16s
```

`-k` only understands simple words, so an id with an `=` sign in it, like `e=0.9`, cannot be typed after `-k`; pytest stops with "Wrong expression passed to '-k'". Use the full node id in quotes for those. Lesson 5 covers `-k` and its relatives in depth.

You can also attach a mark to one case. Here the lunar case is skipped until a gravity model with the Moon's pull exists, while the others run:

```python
import pytest


@pytest.mark.parametrize(
    "altitude_km",
    [
        pytest.param(400, id="leo"),
        pytest.param(35786, id="geo"),
        pytest.param(384400, id="lunar", marks=pytest.mark.skip(reason="needs third-body gravity")),
    ],
)
def test_altitude_positive(altitude_km):
    assert altitude_km > 0
```

```text
test_skipcase.py::test_altitude_positive[leo] PASSED                     [ 33%]
test_skipcase.py::test_altitude_positive[geo] PASSED                     [ 66%]
test_skipcase.py::test_altitude_positive[lunar] SKIPPED (needs third...) [100%]
```

::: warning Ids must describe, not only number
An id like `case1`, `case2` is no better than the default. An id that lies is worse: rename a row's values and forget its id, and "earth-like" now labels a hyperbola. With `pytest.param`, the id sits on the same line as the values, so review both together.
:::

## Grids of cases

Sometimes you want every combination of two settings, such as every eccentricity at every mean anomaly. Stack two `parametrize` decorators, and pytest runs the **[[Cartesian product|cartesian-product]]** — every value of one paired with every value of the other:

```python
# test_kepler_grid.py
import math

import pytest

from kepler import solve_kepler


@pytest.mark.parametrize("e", [0.0, 0.3, 0.9], ids=lambda e: f"e={e}")
@pytest.mark.parametrize("M", [0.5, 2.5], ids=lambda M: f"M={M}")
def test_one_lap_range(M, e):
    E = solve_kepler(M, e)
    assert 0.0 <= E <= 2 * math.pi
```

```text
test_kepler_grid.py::test_one_lap_range[M=0.5-e=0.0] PASSED              [ 58%]
test_kepler_grid.py::test_one_lap_range[M=0.5-e=0.3] PASSED              [ 66%]
test_kepler_grid.py::test_one_lap_range[M=0.5-e=0.9] PASSED              [ 75%]
test_kepler_grid.py::test_one_lap_range[M=2.5-e=0.0] PASSED              [ 83%]
test_kepler_grid.py::test_one_lap_range[M=2.5-e=0.3] PASSED              [ 91%]
test_kepler_grid.py::test_one_lap_range[M=2.5-e=0.9] PASSED              [100%]
```

Two values of `M` times three of `e` gives six tests. The id function makes each name say which corner of the grid it is.

This test checks something different from the residual: that the answer stays within one lap. With the planted sign bug, it fails at `[M=2.5-e=0.3]` and `[M=2.5-e=0.9]`. Even a mild eccentricity breaks when the answer is on the far side of the orbit — a fact the first table did not show, because it had no case with a small $e$ and a large $M$.

::: warning Grids grow fast
Each stacked decorator multiplies the count. Five settings with ten values each is $10^5 = 100{,}000$ tests. If each takes a tenth of a second, the grid takes almost three hours. Stack decorators when you truly need every combination, and otherwise write a hand-picked table of the combinations that matter. Lesson 5 shows how to keep a big grid out of the fast suite that runs on every change.
:::

::: warning Parameter values are shared, not copied
pytest hands the same object to every case that uses it. If a parameter is a list, a dictionary or an array, and a test changes it in place, the next case sees the change. Here a list is used across both values of `e`:

```python
import pytest


@pytest.mark.parametrize("e", [0.0, 0.5])
@pytest.mark.parametrize("history", [[]])
def test_shared(history, e):
    history.append(e)
    assert len(history) == 1
```

The first case passes. The second fails with `assert 2 == 1`, because the list already holds the first case's value. The result depends on which cases ran first. Treat parameter values as read-only, and copy anything you need to change (`history = list(history)`, or `state = state.copy()` for an array).
:::

## Parametrizing over initial conditions

The same tool lets you test an integrator from many starting points. Take a mass on a spring. It obeys $\ddot{x} = -\omega^2 x$, read "x double-dot equals minus omega squared x": the acceleration pulls back toward the middle in proportion to how far away the mass is. Here $\omega$ (omega) is the **angular frequency** in rad/s. From a starting position $x_0$ and velocity $v_0$, the exact answer is

$$
x(t) = x_0 \cos \omega t + \frac{v_0}{\omega} \sin \omega t.
$$

That gives a perfect test: integrate numerically from several initial conditions and compare with the formula.

::: example A spring tested from four starting points
Use SciPy's `solve_ivp` with $\omega = 2\,\mathrm{rad/s}$ over $10\,\mathrm{s}$, and give the four initial conditions names that say what physically happens:

```python
# test_oscillator.py
import numpy as np
import pytest
from numpy.testing import assert_allclose
from scipy.integrate import solve_ivp

OMEGA = 2.0  # rad/s


def rhs(t, y):
    x, v = y
    return [v, -OMEGA**2 * x]


def exact(t, x0, v0):
    return x0 * np.cos(OMEGA * t) + v0 / OMEGA * np.sin(OMEGA * t)


@pytest.mark.parametrize(
    "x0, v0",
    [(0.0, 0.0), (1.0, 0.0), (0.0, 3.0), (-0.5, 1.5)],
    ids=["at-rest", "released", "kicked", "released-and-kicked"],
)
def test_matches_exact_solution(x0, v0):
    t = np.linspace(0.0, 10.0, 101)
    sol = solve_ivp(rhs, (0.0, 10.0), [x0, v0], t_eval=t, rtol=1e-10, atol=1e-12)
    assert_allclose(sol.y[0], exact(t, x0, v0), rtol=0, atol=1e-8)
```

```text
test_oscillator.py::test_matches_exact_solution[at-rest] PASSED          [ 25%]
test_oscillator.py::test_matches_exact_solution[released] PASSED         [ 50%]
test_oscillator.py::test_matches_exact_solution[kicked] PASSED           [ 75%]
test_oscillator.py::test_matches_exact_solution[released-and-kicked] PASSED [100%]
```

**Step 1: why these four.** "At rest" should stay at zero forever. "Released" starts displaced and still, so it traces a pure cosine with amplitude $1\,\mathrm{m}$. "Kicked" starts in the middle with speed $3\,\mathrm{m/s}$, a pure sine with amplitude $v_0/\omega = 3/2 = 1.5\,\mathrm{m}$. The last mixes both.

**Step 2: why an absolute tolerance.** The position swings through zero again and again, and one case is zero throughout. A relative tolerance would ask for exact agreement at those points. The solver was asked for about $10^{-10}$ relative accuracy, and the largest error in any case turns out to be about $3.2 \times 10^{-10}\,\mathrm{m}$. An `atol` of $10^{-8}\,\mathrm{m}$ leaves a margin of about 30.

**Step 3: plant a bug.** Flip the sign of the spring force to `+OMEGA**2 * x`. Now the mass is pushed away from the middle, and the position grows like $e^{\omega t}$ — about $e^{20} \approx 4.9 \times 10^{8}$ times its start by $t = 10\,\mathrm{s}$:

```text
FAILED test_oscillator.py::test_matches_exact_solution[released] - AssertionE...
FAILED test_oscillator.py::test_matches_exact_solution[kicked] - AssertionErr...
FAILED test_oscillator.py::test_matches_exact_solution[released-and-kicked]
3 failed, 1 passed in 1.08s
```

**Step 4: read the survivor.** `at-rest` still passes. Zero times anything is zero, so a mass at rest stays at rest whatever the sign of the force. That case can never catch a sign error. It is still worth keeping — it checks that the solver does not invent motion — but it must never be the only case.

**Sanity check.** A spring that pushes outward is a runaway, and three of four named cases flagged it at once.
:::

## Check yourself

::: check
A test is decorated with `@pytest.mark.parametrize("x", [1, 2, 3])` and `@pytest.mark.parametrize("y", ["a", "b"])`, stacked. How many tests does pytest create? What would change if you replaced the two decorators with a single one, `@pytest.mark.parametrize("x, y", [(1, "a"), (2, "b"), (3, "a")])`?
:::

::: answer
Stacked decorators run every combination: $3 \times 2 = 6$ tests, with ids from `[a-1]` to `[b-3]`, pairing every `x` with every `y`.

The single decorator runs exactly the rows you list: 3 tests, one per tuple. You lose the combinations `(1, "b")`, `(2, "a")` and `(3, "b")`. Use the single table when only certain pairs matter, and the stacked form when every pair matters and the count stays small.
:::

::: check
A colleague's test loops over 40 attitude cases and fails with a single `AssertionError` on the line inside the loop. Give three things parametrizing it would change.
:::

::: answer
1. All 40 cases would run even after one fails, so you would see every failing case, not only the first.
2. Each failure would be named by its case id in the summary, so you would know which attitude broke without reading the traceback.
3. You could rerun or select a single case by its node id or with `-k`, and attach a mark, such as `skip`, to one case alone.

A fourth bonus: the pass and fail counts now mean something, "37 passed, 3 failed", rather than "1 failed".
:::

::: check
You parametrize a test over three NumPy arrays of initial states. The output shows `test_propagate[state0]`, `[state1]` and `[state2]`. What happened, and how would you improve it?
:::

::: answer
pytest cannot turn an array into a short readable name, so it fell back to the argument name plus the row number. The names say nothing about what each state is.

Wrap each array in `pytest.param(..., id="...")` with a name that says what is special about it, for example `"leo-circular"`, `"gto-perigee"`, `"polar"`, or pass `ids=["leo-circular", "gto-perigee", "polar"]`. Then a failure reads `test_propagate[gto-perigee]`.
:::

::: check
A test is parametrized over five initial conditions for a pendulum simulator, and one of them is "hanging straight down, not moving". Why can that case never catch a sign error in the gravity term, and what should the table include to catch it?
:::

::: answer
A pendulum hanging straight down and at rest has no gravity torque to begin with: the torque is proportional to the sine of the angle from vertical, and that angle is zero. Flip the sign of the gravity term and the torque is still zero, so the pendulum stays put and the test still passes. Like `at-rest` in the spring example, it checks only that the simulator does not invent motion.

To catch the sign, include cases where gravity actually acts: a pendulum released from a small angle, which should swing back toward the bottom, and one with an initial swing speed. Compare them with a known answer, such as the small-angle solution, so a sign flip that pushes the pendulum away from the bottom shows up as a failure.
:::

::: check
Your test uses `@pytest.mark.parametrize("q", [np.array([1.0, 0.0, 0.0, 0.0])])` stacked with a second parametrize over five rotation rates, and the test normalizes `q` in place with `q /= np.linalg.norm(q)` before using it. Why is this risky even though the result looks right?
:::

::: answer
The same array object is handed to all five cases. Normalizing in place changes that shared array. Here the quaternion is already unit length, so dividing by $1$ changes nothing and the risk stays hidden. But if a test ever modifies `q` in a way that matters — or someone changes the value to a non-unit quaternion to test normalization — later cases would receive the modified array, and results would depend on which cases ran before. Copy first, `q = q.copy()`, or build a fresh array inside the test.
:::

## Summary

| Idea | Syntax | What it gives you |
|---|---|---|
| table of cases | `@pytest.mark.parametrize("a, b", [(1, 2), (3, 4)])` | one test per row |
| single argument | `@pytest.mark.parametrize("e", [0.0, 0.5])` | plain values, no tuples |
| default case id | values joined by dashes | `test_x[1.0-0.5]`; objects become `state0` |
| named case | `pytest.param(1.0, 0.5, id="moderate")` | `test_x[moderate]` |
| ids list or function | `ids=[...]` or `ids=lambda v: ...` | names for every case at once |
| mark one case | `pytest.param(..., marks=pytest.mark.skip(reason=...))` | skip or flag a single row |
| grid | stacked decorators | every combination; counts multiply |
| select a case | `pytest "file.py::test_x[gto]"` or `-k "gto"` | rerun only that row |

Every test in this lesson built its inputs fresh inside the test. The next lesson introduces fixtures: reusable setup, such as a reference orbit or a temporary folder, that pytest builds for the tests that ask for it, with control over how often it is rebuilt.

::: context parametrize-word Where the word comes from
A parameter is a value you can change while the rest of a setup stays fixed, like the eccentricity in a family of orbits. To parametrize something is to write it in terms of such a value. pytest spells it "parametrize", without the extra "e" some dictionaries use in "parameterize". Typing the other spelling in `@pytest.mark.parameterize` is a common slip, and pytest stops with an error that tells you the right spelling.
:::

::: context kepler-recap Kepler's equation in one picture
The mean anomaly $M$ grows steadily with time, like a clock hand. The eccentric anomaly $E$ says where the satellite actually is, measured on a circle drawn around the ellipse. Kepler's equation, $M = E - e \sin E$, links them. There is no formula for $E$ in terms of $M$, so software solves for it numerically.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="160" cy="100" r="80" fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 4"/>
  <ellipse cx="160" cy="100" rx="80" ry="48" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="224" cy="100" r="6" fill="#1d6fd1"/>
  <line x1="228" y1="105" x2="256" y2="134" stroke="#1d6fd1" stroke-width="1"/>
  <text x="259" y="143" font-size="11" fill="#1d6fd1">Earth (focus)</text>
  <circle cx="160" cy="100" r="2.5" fill="#1f2a44"/>
  <line x1="160" y1="100" x2="200" y2="30.7" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="200" y1="30.7" x2="200" y2="58.4" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="3 3"/>
  <circle cx="200" cy="58.4" r="5" fill="#b4232c"/>
  <line x1="205" y1="57" x2="243" y2="52" stroke="#b4232c" stroke-width="1"/>
  <text x="246" y="55" font-size="12" fill="#b4232c">satellite</text>
  <path d="M 185 100 A 25 25 0 0 0 172.5 78.3" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="188" y="90" font-size="12" fill="#1f2a44">E</text>
  <line x1="160" y1="100" x2="240" y2="100" stroke="#1f2a44" stroke-width="1" stroke-dasharray="2 3"/>
  <text x="300" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">e = 0.8</text>
</svg>
```

The satellite's point on the ellipse sits straight below the point at angle $E$ on the circle.
:::

::: context decorator What the @ line does
A decorator is a function that takes your function and returns a changed version of it. Writing `@something` on the line above `def f` is shorthand for `f = something(f)` after the definition. `@pytest.mark.parametrize(...)` does not change what `f` computes. It attaches a label with your table to the function, and pytest reads that label during collection to generate one test per row. That is why decorators stack: each one adds its own label.
:::

::: context molniya The orbit named for lightning
Molniya means "lightning" in Russian, the name of the Soviet communication satellites that first used this orbit in the 1960s. The orbit is very stretched, with eccentricity around $0.74$ and a period of about 12 hours. Its far point sits high over the northern hemisphere, so the satellite hangs there for hours, well placed to serve high-latitude regions that geostationary satellites over the equator see only low on the horizon. Its strong eccentricity makes it a classic test case for Kepler solvers.
:::

::: context gto The halfway orbit to geostationary
A geostationary transfer orbit, or GTO, is the ellipse a rocket often leaves a communications satellite on. Its low point is a few hundred kilometers up and its high point is at geostationary height, $35{,}786\,\mathrm{km}$. With a $185\,\mathrm{km}$ low point, the eccentricity is

$$
e = \frac{r_a - r_p}{r_a + r_p} = \frac{42{,}164 - 6{,}563}{42{,}164 + 6{,}563} \approx 0.73,
$$

where $r_a$ and $r_p$ are the distances of the far and near points from Earth's center, in km. The satellite later fires its own engine at the high point to make the orbit circular.
:::

::: context lambda-word A function on one line
`lambda e: f"e={e}"` is a whole function written in one expression. It takes one argument, `e`, and returns the string. It does the same job as a two-line `def` whose body is `return f"e={e}"`, except that it has no name. Lambdas fit places like `ids=` where you need a tiny function once. The word comes from the lambda calculus, a mathematical theory of functions from the 1930s, where the Greek letter $\lambda$ marked a function.
:::

::: context cartesian-product Every pair from two lists
The Cartesian product of two lists pairs each item of the first with each item of the second, like laying the values out as the rows and columns of a grid. Two values of $M$ and three of $e$ make a $2 \times 3$ grid of six cells.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="160" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">e = 0.0</text>
  <text x="230" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">e = 0.3</text>
  <text x="300" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">e = 0.9</text>
  <text x="95" y="62" font-size="12" text-anchor="end" fill="#1f2a44">M = 0.5</text>
  <text x="95" y="112" font-size="12" text-anchor="end" fill="#1f2a44">M = 2.5</text>
  <rect x="125" y="35" width="70" height="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="195" y="35" width="70" height="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="265" y="35" width="70" height="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="125" y="80" width="70" height="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="195" y="80" width="70" height="45" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="265" y="80" width="70" height="45" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="107" font-size="11" text-anchor="middle" fill="#b4232c">fails</text>
  <text x="300" y="107" font-size="11" text-anchor="middle" fill="#b4232c">fails</text>
</svg>
```

The orange cells are the two that failed with the planted sign bug: both on the far side of the orbit, where $M = 2.5$. A third list with four values would make it a $2 \times 3 \times 4$ block of 24.
:::
