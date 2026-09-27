---
id: l01-pytest-basics
title: Your first pytest suite
minutes: 22
covers:
  - pytest discovery rules, plain assert, and the rewritten assertion output
---

Before every flight, a pilot walks around the airplane with a checklist. Tires inflated. Fuel caps closed. Nothing stuck in the air intakes. Each check asks a single yes-or-no question, and the pilot answers every one, every time, even on the hundredth flight. The checklist exists because people forget.

Code needs the same walk-around. You change one line in a guidance function, and three other functions that call it quietly start giving different answers. A **test** is one checklist item for code: a small function that runs a piece of your program and checks that the answer is what it should be. A **test suite** is the whole checklist — every test for a project. A **test runner** is the program that finds all the tests, runs them, and tells you which ones failed.

In Python the standard test runner is **[[pytest|pytest-name]]**. Rocket and spacecraft teams use it to check everything from a unit conversion to a full six-degree-of-freedom simulator. In this lesson you will write your first tests, learn exactly which files and functions pytest picks up, read what it prints when something breaks, and learn the habit that makes a suite worth trusting: watching it fail on purpose.

## A test is a function that checks one thing

Picture baking a cake from a recipe. You cannot taste the cake until it is done. But you can check small things along the way: the oven reads 180 °C, the batter weighs about 900 g, the toothpick comes out clean. Each check is quick and has a clear yes-or-no answer.

A test works the same way. You call your function with inputs where you already know the right answer, and you check the result with Python's **`assert`** statement. Read `assert x > 0` aloud as "make sure that x is greater than zero". If the condition is true, nothing happens and the program moves on. If it is false, Python raises an **AssertionError** — the error that means "a check failed".

Here is a function to test. It is the ideal **[[rocket equation|rocket-equation]]**: how much a rocket's speed changes when it burns propellant, given its engine's specific impulse `isp` in seconds, its starting mass `m0` and its final mass `mf`, both in kilograms.

```python
# rocket.py
import math

G0 = 9.80665  # m/s^2, standard gravity


def delta_v(isp, m0, mf):
    """Ideal rocket equation: speed change in m/s."""
    if mf <= 0 or m0 < mf:
        raise ValueError("need m0 >= mf > 0")
    return isp * G0 * math.log(m0 / mf)
```

And here is a file of tests for it. Each test is an ordinary Python function whose name starts with `test`. There is nothing to inherit from and no special method to call. You import the function, call it, and `assert` something about the answer.

```python
# test_rocket.py
import math

import pytest

from rocket import delta_v


def test_no_burn_gives_no_speed():
    assert delta_v(311.0, 1000.0, 1000.0) == 0.0


def test_mass_ratio_e_gives_exhaust_speed():
    ve = 311.0 * 9.80665
    assert abs(delta_v(311.0, math.e, 1.0) - ve) < 1e-9


def test_more_propellant_means_more_speed():
    assert delta_v(311.0, 1000.0, 400.0) > delta_v(311.0, 1000.0, 500.0)


def test_rejects_zero_final_mass():
    with pytest.raises(ValueError, match="m0 >= mf"):
        delta_v(311.0, 1000.0, 0.0)
```

Look at what each test checks. None of them copies a long number out of the function's own output. Instead, each one uses a fact you know from outside the code:

- burning nothing changes nothing, so the answer is zero;
- when the mass ratio $m_0/m_f$ (read "m nought over m f") equals $e \approx 2.718$, the logarithm is exactly $1$, so the answer is the exhaust speed $I_{sp} g_0$;
- burning more propellant must give more speed;
- a final mass of zero is nonsense, so the function must refuse it.

The last test uses **`pytest.raises`**, which checks that a block of code raises a particular error. The `with` block passes only if a `ValueError` comes out of it. The `match` argument is a **[[regular expression|regex-match]]** that must be found in the error's message, so you know it failed for the reason you expected and not some other one.

To run the suite, open a terminal in the folder and type `pytest`:

```text
$ pytest
============================= test session starts ==============================
platform linux -- Python 3.11.15, pytest-9.1.1, pluggy-1.6.0
collected 4 items

test_rocket.py ....                                                      [100%]

============================== 4 passed in 0.14s ===============================
```

Each dot is one test that passed. A failing test prints an `F` instead, and a test that crashed before it could reach its check (an error in setup, which you will meet with fixtures in lesson 4) prints an `E`. Add `-v` for "verbose" and pytest prints one line per test with its full name. Add `-q` for "quiet" and it prints less. Whatever it prints, pytest ends with an **[[exit code|exit-codes]]** that scripts and CI servers (machines that run the suite on every change) read: 0 means every test passed, 1 means at least one failed.

::: example Checking the numbers behind the tests
Before trusting a test, check its expected value by hand. Take the second test: $I_{sp} = 311\,\mathrm{s}$ and $g_0 = 9.80665\,\mathrm{m/s^2}$.

**Step 1: the exhaust speed.** Multiply: $v_e = 311 \times 9.80665 = 3049.87\,\mathrm{m/s}$, to two decimals.

**Step 2: the rocket equation with mass ratio $e$.** The equation is

$$
\Delta v = I_{sp}\, g_0 \ln\frac{m_0}{m_f}.
$$

With $m_0/m_f = e$, $\ln e = 1$, so $\Delta v = v_e = 3049.87\,\mathrm{m/s}$. That is the value the test compares against.

**Step 3: the third test's two sides.** For $m_f = 400\,\mathrm{kg}$, $\ln(1000/400) = \ln 2.5 = 0.9163$, so $\Delta v = 3049.87 \times 0.9163 = 2794.57\,\mathrm{m/s}$. For $m_f = 500\,\mathrm{kg}$, $\ln 2 = 0.6931$, so $\Delta v = 2114.01\,\mathrm{m/s}$. The first is larger, as the test demands.

**Sanity check.** About $3\,\mathrm{km/s}$ from a mass ratio near 2.7 is the right size for a single chemical stage, and less than half the $7.7\,\mathrm{km/s}$ needed to stay in low orbit. That is why real rockets have more than one stage.
:::

::: key
A pytest test is a plain function whose name starts with `test`, containing a plain `assert`. Use `pytest.raises(SomeError, match=...)` to check that code fails the way it should.
:::

## How pytest finds your tests

A post office sorts mail by the address on the envelope, not by opening it. pytest does the same with your code. It does not read your files to decide what is a test. It looks at names. This name-based search is called **discovery** (pytest's own output calls it **collection**: "collected 4 items").

The rules, with pytest's default settings:

1. **Where to look.** pytest starts from the folders or files you name on the command line. If you name none, it starts from the `testpaths` setting in your config file, and if there is none, from the current folder. It walks down into every subfolder, except ones it knows are not yours: hidden folders like `.git`, and folders named `build`, `dist`, `venv`, `node_modules` and a few others.
2. **Which files.** Only files named `test_*.py` or `*_test.py`. The star stands for anything: `test_rocket.py` and `rocket_test.py` both count. `tests.py` and `rocket_tests.py` do not.
3. **Which functions.** Inside those files, functions defined at the top level whose names start with `test`.
4. **Which classes.** Classes whose names start with `Test`, as long as they have no `__init__` method. Inside them, methods whose names start with `test`.

Every test pytest collects gets an address called its **[[node id|node-id]]**: the file path, then `::`, then the class name if there is one, then `::` and the function name. You can hand that address back to pytest to run one test alone.

Here is a small project that tests every rule at once:

```python
# tests/test_units.py
def test_found():
    assert 1 + 1 == 2


def check_not_found():
    assert False


class TestConversions:
    def test_km_to_m(self):
        assert 1.5 * 1000 == 1500

    def helper(self):
        assert False


class TestWithInit:
    def __init__(self):
        pass

    def test_skipped(self):
        assert False


class ConversionTests:
    def test_not_collected(self):
        assert False
```

Next to it sit `tests/orbit_test.py`, holding one test called `test_suffix_style`, and `tests/tests.py`, holding one called `test_in_tests_py`. To see what pytest would run without running it, use **[[--collect-only|collect-only]]**:

```text
$ pytest --collect-only -q
tests/orbit_test.py::test_suffix_style
tests/test_units.py::test_found
tests/test_units.py::TestConversions::test_km_to_m

PytestCollectionWarning: cannot collect test class 'TestWithInit' because it has a __init__ constructor
3 tests collected in 0.11s
```

(The warning is trimmed to one line here; pytest prints it with the file and line number.) Read the list against the rules:

- `tests/tests.py` was skipped entirely. Its name matches neither pattern.
- `check_not_found` was skipped. Its name does not start with `test`.
- `helper` inside `TestConversions` was skipped for the same reason, which is what you want.
- `TestWithInit` was skipped because it has an `__init__`. pytest builds a fresh object of each test class for every test, and it cannot guess what arguments your `__init__` wants. At least it warns you.
- `ConversionTests` was skipped silently. Its name ends with "Tests" instead of starting with "Test".

To run one test by its node id:

```text
$ pytest -q tests/test_units.py::TestConversions::test_km_to_m
.                                                                        [100%]
1 passed in 0.11s
```

Most projects write the search settings down once, in `pyproject.toml`, so every developer and every CI server runs the same suite:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
```

With that line, a plain `pytest` from the project's top folder looks only inside `tests/`.

::: key
Default discovery: files `test_*.py` or `*_test.py`; top-level functions starting with `test`; classes starting with `Test` that have no `__init__`, and their methods starting with `test`. Hidden, build and virtual-environment folders are skipped.
:::

::: warning A test that is never collected passes forever
Discovery failures are silent. Name a file `tests.py`, or a function `check_attitude`, and pytest does not complain — it runs everything else and reports green. The dangerous case is a new test that you believe is guarding something. Two habits catch it. After adding a test, confirm the count in "collected N items" went up. And run the new test once by its node id. If pytest says "no tests ran", the name is wrong. That run also ends with exit code 5, which means "nothing was collected", so a CI job can catch it too.
:::

## Plain assert, and the output pytest writes for it

Python's own `assert` is not very chatty. Run this outside pytest:

```python
stages = ["booster", "upper", "fairing"]
assert stages == ["booster", "upper"]
# Traceback (most recent call last):
#   File "<string>", line 2, in <module>
# AssertionError
```

It tells you a check failed and on which line. It does not tell you what `stages` held. Older test frameworks worked around this with special methods, such as `assertEqual(a, b)`, so the framework could see both sides and print them.

pytest takes a different route. When it imports a test file, it reads the file's code and rewrites every `assert` statement before Python runs it. This is called **[[assertion rewriting|assertion-rewriting]]**: pytest quietly adds code that remembers the value of every piece of the condition, so that when the check fails it can print them all. You write a plain `assert`, and you still get a full report.

Here is what the same list check looks like inside a test file, followed by a dictionary check:

```python
# test_rw.py
def test_stage_names():
    stages = ["booster", "upper", "fairing"]
    assert stages == ["booster", "upper"]


def test_config():
    config = {"isp_s": 311, "stages": 2, "engine": "Merlin"}
    assert config == {"isp_s": 282, "stages": 2, "engine": "Merlin"}
```

```text
_______________________________ test_stage_names _______________________________

    def test_stage_names():
        stages = ["booster", "upper", "fairing"]
>       assert stages == ["booster", "upper"]
E       AssertionError: assert ['booster', '...r', 'fairing'] == ['booster', 'upper']
E
E         Left contains one more item: 'fairing'
E         Use -v to get more diff

test_rw.py:4: AssertionError
_________________________________ test_config __________________________________

    def test_config():
        config = {"isp_s": 311, "stages": 2, "engine": "Merlin"}
>       assert config == {"isp_s": 282, "stages": 2, "engine": "Merlin"}
E       AssertionError: assert {'isp_s': 311...ne': 'Merlin'} == {'isp_s': 282...ne': 'Merlin'}
E
E         Omitting 2 identical items, use -vv to show
E         Differing items:
E         {'isp_s': 311} != {'isp_s': 282}
E         Use -v to get more diff

test_rw.py:9: AssertionError
```

Learn to read this report from top to bottom:

- The line of underscores names the test that failed.
- The code is reprinted, and the `>` arrow marks the exact line that failed.
- Lines starting with `E` are the explanation. The first shows both sides of the comparison, shortened with `...` when they are long.
- Below it comes a **diff** — a list of only the differences. For a list it names the extra item. For a dictionary it says two items matched and shows the one that did not.
- The last line gives the file and line number.

When the condition calls functions, pytest also prints a line for each call that fed into it, starting with `+  where`. You will see those in the next section, and they are often the fastest way to the bug.

### Where rewriting does not reach

pytest only rewrites the files it imports as tests: files matching the test patterns, plus the shared `conftest.py` files you will meet in lesson 4. An `assert` inside your ordinary modules is left alone. Watch what happens when a test calls a helper from `helpers.py` that contains its own `assert`:

```text
    def check_stage_count(stages):
>       assert len(stages) == 2
               ^^^^^^^^^^^^^^^^
E       AssertionError

helpers.py:2: AssertionError
```

The rich explanation is gone. You get the bare `AssertionError`, exactly like plain Python. The fix is to keep the `assert` in the test itself: have helpers return values, and assert on those in the test file.

::: key
pytest rewrites `assert` statements in test modules (and `conftest.py`) at import time, so a failing plain `assert` prints the values on both sides, a diff for containers, and a `where` line for each function call in the condition.
:::

::: warning Asserts are for tests, not for flight code
Never use `assert` to guard real behavior in the code you ship, such as "the quaternion must be unit length before we command the thrusters". Python has an optimize switch, **[[python -O|python-optimize]]**, that deletes every `assert` statement from the program. Code that relies on an assert for safety loses that safety silently. In shipped code, test the condition with `if` and raise a real error, like `delta_v` does with its `ValueError`. Keep `assert` for tests.
:::

## A test you have never seen fail proves nothing

Imagine a smoke alarm that has never beeped. Is the house safe, or is the battery dead? You cannot tell from the silence. That is why smoke alarms have a test button.

A test suite is the same. A green run tells you nothing unless you know the tests *can* go red. So good engineers press the test button on purpose. They break the code in a small, realistic way — flip a sign, swap two arguments, drop a factor of two — and check two things: that the suite fails, and that the failure message points at the cause. Then they undo the break. This habit has a name when a tool does it automatically, **[[mutation testing|mutation-testing]]**, but doing it by hand for every important test is where it starts.

::: example Flipping a sign in the rocket equation
Break `delta_v` by swapping the fraction inside the logarithm, a classic slip:

```python
return isp * G0 * math.log(mf / m0)   # bug: should be m0 / mf
```

Because $\ln(m_f/m_0) = -\ln(m_0/m_f)$, every answer keeps its size but flips its sign. Run the suite:

```text
test_rocket.py .FF.                                                      [100%]

=================================== FAILURES ===================================
____________________ test_mass_ratio_e_gives_exhaust_speed _____________________

    def test_mass_ratio_e_gives_exhaust_speed():
        ve = 311.0 * 9.80665
>       assert abs(delta_v(311.0, math.e, 1.0) - ve) < 1e-9
E       assert 6099.7363 < 1e-09
E        +  where 6099.7363 = abs((-3049.86815 - 3049.86815))
E        +    where -3049.86815 = delta_v(311.0, 2.718281828459045, 1.0)
E        +      where 2.718281828459045 = math.e

test_rocket.py:15: AssertionError
____________________ test_more_propellant_means_more_speed _____________________

    def test_more_propellant_means_more_speed():
>       assert delta_v(311.0, 1000.0, 400.0) > delta_v(311.0, 1000.0, 500.0)
E       assert -2794.565919283175 > -2114.007509252076
E        +  where -2794.565919283175 = delta_v(311.0, 1000.0, 400.0)
E        +  and   -2114.007509252076 = delta_v(311.0, 1000.0, 500.0)

test_rocket.py:19: AssertionError
=========================== short test summary info ============================
FAILED test_rocket.py::test_mass_ratio_e_gives_exhaust_speed - assert 6099.73...
FAILED test_rocket.py::test_more_propellant_means_more_speed - assert -2794.5...
========================= 2 failed, 2 passed in 0.15s ==========================
```

**Step 1: did it go red?** Yes. Two of four tests failed.

**Step 2: does the message point at the cause?** Read the `where` lines from the bottom up. `math.e` went in. `delta_v` came back with $-3049.87$. The expected value was $+3049.87$. Same size, opposite sign. The gap, $6099.74$, is exactly twice $3049.87$, which is what a sign flip produces. The second failure says the same thing: both speeds came out negative.

**Step 3: which test did not notice?** `test_no_burn_gives_no_speed` still passed. With $m_0 = m_f$, the logarithm is $\ln 1 = 0$, and $-0$ equals $0$. That test alone would never have caught this bug. It still earns its place, but only as part of a set.

**Step 4: undo the break** and confirm the suite is green again, exit code 0.

**Sanity check.** A rocket equation that returns negative speed is a real, dangerous bug, and the suite caught it in a fraction of a second with a message that names the sign.
:::

::: key
A deliberately injected sign error is the only way to know your tests can fail. Flip a sign, confirm the suite goes red and that the failure message points at the cause, then revert. A suite that never fails is measuring nothing.
:::

The same idea runs the other way when you write a new test. Write the test before the fix, run it, and watch it fail for the reason you expect. Then make the fix and watch it pass. Programmers call this **[[red, green|red-green]]**: red is the failing run, green the passing one. Skipping the red step is how people end up with tests that pass no matter what.

::: warning Look at what the failure message says, not only that it failed
A test that fails for the wrong reason is almost as bad as one that never fails. If you flip a sign and the only red test is one that crashed on an unrelated typo, you have learned nothing about the sign. Read the `E` lines each time. They should describe the bug you planted.
:::

One more thing deserves a second look. The first test compares with `==`, which is safe only because $\ln 1$ is exactly zero in floating point. The second does its own tolerance check, `abs(a - b) < 1e-9`. Floating-point answers are almost never exact — `0.1 + 0.2 == 0.3` is `False` in Python — and hand-rolled tolerances are easy to get wrong. The next lesson gives you proper tools.

## Check yourself

::: check
Your project has these five items. Which ones does pytest collect with its default settings: (a) a function `test_gravity` in `physics_test.py`; (b) a function `test_drag` in `tests.py`; (c) a method `test_lift` in class `TestAero` in `test_aero.py`; (d) a method `test_thrust` in class `EngineTests` in `test_engine.py`; (e) a function `verify_mass` in `test_mass.py`?
:::

::: answer
Only (a) and (c).

- (a) is collected: `physics_test.py` matches `*_test.py`, and the function starts with `test`.
- (b) is not: `tests.py` matches neither `test_*.py` nor `*_test.py`, so pytest never opens the file.
- (c) is collected: the file matches, the class starts with `Test` (and has no `__init__`), and the method starts with `test`.
- (d) is not: the class name `EngineTests` does not start with `Test`.
- (e) is not: `verify_mass` does not start with `test`.

Three of the five are silently skipped, which is why you check the collected count after adding tests.
:::

::: check
A test of the orbit's mean motion $n = \sqrt{\mu / a^3}$ (read "n equals the square root of mu over a cubed") fails with this report:

```text
>       assert mean_motion(7000e3) == n_expected
E       assert 0.001078007612872506 == 0.0010780076128725062
E        +  where 0.001078007612872506 = mean_motion(7000000.0)
```

The test computed `n_expected` as `math.sqrt(MU) / 7000e3**1.5`. Is the function wrong? What should the test do instead?
:::

::: answer
Read the two numbers digit by digit. They agree in the first sixteen significant digits and differ only in the seventeenth: `...506` against `...5062`. The difference is about $2 \times 10^{-19}\,\mathrm{rad/s}$, far below anything physical. The function and the test used two different but equivalent formulas, and floating-point rounding came out one bit apart.

So the function is fine and the test is wrong: `==` on floats demands every bit to match. The test should compare with a tolerance. The tools for that, and how to pick the tolerance, are the subject of the next lesson.
:::

::: check
A helper `check_unit_quaternion(q)` lives in `attitude_utils.py` and contains `assert abs(norm(q) - 1) < 1e-12`. Tests call it. When it fails, the report says only `AssertionError`. Why, and what are two ways to get the full report back?
:::

::: answer
pytest rewrites asserts only in the modules it imports as tests (and `conftest.py`). `attitude_utils.py` is an ordinary module, so its `assert` is plain Python and carries no values.

Two fixes. First, have the helper return the number, for example `quaternion_norm_error(q)`, and write `assert quaternion_norm_error(q) < 1e-12` in the test itself, where it is rewritten. Second, if the helper is only for tests, move it into the test file or a `conftest.py`, where pytest rewrites it too.
:::

::: check
You add a test and the suite reports `12 passed`. Before the change it reported `12 passed` too. What should you suspect, and how do you check?
:::

::: answer
The new test was never collected. Most likely its file or function name breaks the discovery rules — `tests_guidance.py`, say, or a function called `check_guidance`. Run `pytest --collect-only -q` and look for its node id, or run it directly by node id. If pytest says "no tests ran" (exit code 5), rename it so the file matches `test_*.py` or `*_test.py` and the function starts with `test`.
:::

::: check
A function `body_rate_to_euler_rate` has three tests and all pass. You flip the sign of one term inside it, and all three still pass. What does that tell you, and what do you do next?
:::

::: answer
It tells you the tests cannot see that term. They might use inputs where it is zero (the way `test_no_burn_gives_no_speed` used $\ln 1 = 0$), or check something the sign does not change, such as a magnitude. The suite is not protecting that part of the code at all.

Next: write a test that uses an input where that term is not zero, and a check that depends on its sign — for example a known case worked out by hand. Run it with the sign still flipped and watch it fail with a message that points at the sign. Then revert the flip and confirm it passes.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| test | a function that checks one thing | name starts with `test`, uses `assert` |
| test file | a module pytest opens | `test_*.py` or `*_test.py` |
| test class | a group of tests | starts with `Test`, no `__init__` |
| node id | a test's address | `path::Class::test_name` |
| `--collect-only` | list tests without running them | check the count after adding a test |
| `pytest.raises` | check that code raises | `with pytest.raises(ValueError, match=...)` |
| assertion rewriting | pytest instruments `assert` | both sides, diffs and `where` lines on failure |
| injected fault | break the code on purpose | the suite must go red and name the cause |
| exit code | the result for scripts | 0 all passed, 1 failures, 5 nothing collected |

The rocket-equation suite ended with two awkward comparisons: an exact `==` that only worked because $\ln 1 = 0$, and a hand-made tolerance. The next lesson replaces both with `pytest.approx` and NumPy's `assert_allclose`, and shows how to choose between relative and absolute tolerance.

::: context pytest-name Where pytest came from
pytest grew out of `py.test`, a tool inside a library called `py` started by Holger Krekel in the mid-2000s. That is why older projects and blog posts type `py.test` on the command line. Today it is a separate project maintained by volunteers, and the most widely used test runner in Python. Python also ships its own framework, `unittest`, in the standard library, and pytest runs `unittest`-style tests too, so old suites keep working while new tests are written the plain way.
:::

::: context rocket-equation The equation behind the test
Konstantin Tsiolkovsky published this equation in 1903. It says the speed a rocket gains depends only on how fast its exhaust leaves and on the ratio of starting to final mass:

$$
\Delta v = v_e \ln\frac{m_0}{m_f}, \qquad v_e = I_{sp}\, g_0.
$$

Specific impulse $I_{sp}$ is measured in seconds because it is exhaust speed divided by standard gravity. Multiply by $g_0 = 9.80665\,\mathrm{m/s^2}$ to get back a speed. It ignores gravity and drag, which is why it is called ideal. It is also a perfect first thing to test: it has known special values, like $\ln 1 = 0$ and $\ln e = 1$, that you can check without trusting the code.
:::

::: context regex-match How match finds the message
The `match` argument of `pytest.raises` is a regular expression, a small pattern language for text. pytest calls Python's `re.search` on the error message, so the pattern can appear anywhere in it, not only at the start. Most characters match themselves. A few have special meanings: a dot matches any character, and brackets, parentheses, `+`, `*` and `?` all do pattern work. If your message contains those, pass it through `re.escape` first, or the match may fail or pass for the wrong reason.
:::

::: context exit-codes What the exit number means
Every program hands back a small whole number when it finishes, and zero conventionally means success. pytest uses six: 0 all tests passed, 1 some tests failed, 2 the run was interrupted (for example by Ctrl+C), 3 pytest itself hit an internal error, 4 the command line was wrong, and 5 no tests were collected. A CI server, the machine that runs your suite on every pull request, reads only this number to decide whether the check is green or red. That is why a zero-test run gets its own code: it should not look like success.
:::

::: context node-id Reading a node id
A node id is the path from the folder you ran pytest in down to one test, joined with double colons. Parametrized tests, which you will meet in lesson 3, add the case name in square brackets at the end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="12" y="52" font-size="11" fill="#1f2a44" font-family="monospace">tests/test_units.py::TestConversions::test_km_to_m</text>
  <line x1="12" y1="62" x2="137" y2="62" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="151" y1="62" x2="250" y2="62" stroke="#f2b880" stroke-width="3"/>
  <line x1="263" y1="62" x2="342" y2="62" stroke="#b4232c" stroke-width="3"/>
  <text x="75" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">file path</text>
  <text x="200" y="84" font-size="12" text-anchor="middle" fill="#6c7a93">class</text>
  <text x="302" y="84" font-size="12" text-anchor="middle" fill="#b4232c">test</text>
  <text x="180" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">one test's address</text>
</svg>
```

Copy a node id straight out of a failure report and paste it after `pytest` to rerun only that test.
:::

::: context collect-only A dry run of discovery
`pytest --collect-only` walks the folders, imports the test files and builds the full list of tests, then stops without running any of them. It is the quickest way to answer "is my test even being picked up?". Add `-q` for one node id per line. Because it imports the files, it also shows import errors, such as a typo in a module name, which would otherwise stop the whole run.
:::

::: context assertion-rewriting How pytest rewrites an assert
When Python imports a file, it first turns the text into a tree that describes the program's structure, then compiles that tree into bytecode, the instructions Python actually runs. pytest hooks into the import of test files and edits the tree in between. Each `assert` becomes code that saves every intermediate value into temporary variables and, only if the condition is false, builds the explanation from them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="40" width="72" height="36" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">test file</text>
  <rect x="100" y="40" width="72" height="36" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="136" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">code tree</text>
  <rect x="192" y="40" width="72" height="36" rx="4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="228" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">rewritten</text>
  <rect x="284" y="40" width="68" height="36" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="318" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">bytecode</text>
  <line x1="80" y1="58" x2="96" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="172" y1="58" x2="188" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="264" y1="58" x2="280" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="228" y="100" font-size="11" text-anchor="middle" fill="#1d6fd1">pytest edits asserts here</text>
</svg>
```

The rewritten bytecode is cached in `__pycache__`, so the cost is paid once per change to the file.
:::

::: context python-optimize What python -O removes
Running `python -O script.py` sets the built-in flag `__debug__` to false, and the compiler then leaves every `assert` statement out of the bytecode entirely — the condition is not even evaluated. The switch is rarely used, but you do not control how every deployment launches your code. That is the whole argument: a check that can be switched off from outside cannot be the thing that keeps a vehicle safe.
:::

::: context mutation-testing Letting a tool plant the bugs
Mutation testing automates the sign flip. A tool makes many small edits to your code, one at a time — `+` to `-`, `<` to `<=`, a constant nudged — and runs your suite against each edited copy, called a mutant. A mutant that makes some test fail is "killed". One that survives marks a place where your tests are not looking. Python tools for this include `mutmut` and `cosmic-ray`. Full runs are slow, because the suite runs once per mutant, so teams often aim them at their most critical modules.
:::

::: context red-green The red, green rhythm
The phrase comes from the colors test runners use: red for a failing run, green for a passing one. The full rhythm used in test-driven development is "red, green, refactor": write a test that fails, write the smallest code that makes it pass, then tidy the code while the test keeps you safe.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="55" r="38" fill="#ffffff" stroke="#b4232c" stroke-width="3"/>
  <text x="60" y="52" font-size="12" text-anchor="middle" fill="#b4232c">red</text>
  <text x="60" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">test fails</text>
  <circle cx="180" cy="55" r="38" fill="#ffffff" stroke="#1d6fd1" stroke-width="3"/>
  <text x="180" y="52" font-size="12" text-anchor="middle" fill="#1d6fd1">green</text>
  <text x="180" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">test passes</text>
  <circle cx="300" cy="55" r="38" fill="#ffffff" stroke="#6c7a93" stroke-width="3"/>
  <text x="300" y="52" font-size="12" text-anchor="middle" fill="#6c7a93">refactor</text>
  <text x="300" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">still passes</text>
  <line x1="100" y1="55" x2="136" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="141,55 133,50 133,60" fill="#1f2a44"/>
  <line x1="220" y1="55" x2="256" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="261,55 253,50 253,60" fill="#1f2a44"/>
</svg>
```

The red step is the one people skip, and it is the one that proves the test works.
:::
