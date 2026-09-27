---
id: l07-golden-files
title: Golden-file regression tests
minutes: 22
covers:
  - Golden-file regression tests with explicit tolerances
---

Picture a guitar tuner. You pluck the A string, and the tuner compares what it hears against a reference note of exactly 440 hertz. It does not ask for a perfect match, because no string is ever perfect. It shows a green light when you are within a few hundredths of a note, and a needle pointing sharp or flat when you are not. Two things make the tuner useful: a trusted reference, and a stated idea of "close enough".

A simulation needs the same kind of check. Unit tests from the earlier lessons ask small, sharp questions: does this function return the right number for this input? But a flight simulator is thousands of functions calling each other, run for thousands of steps. The question you most need answered after any change is broader: **did anything about the output change?** A unit test cannot answer that, because it only looks where you told it to look.

The tool for that question is the **golden-file test**: run the simulation once, save its output in a file you commit to git, and from then on compare every new run against that file at a tolerance you chose on purpose. It is a kind of **[[regression test|regression-word]]** — a test whose only job is to notice that something that used to behave one way now behaves another. Every serious trajectory and GNC simulation team keeps these. In this lesson you will build one, and learn the part that is easy to get wrong: choosing the tolerance.

## What a golden file is

A **golden file** is a saved copy of a program's output that everyone has agreed is correct, or at least agreed to treat as the baseline. The **[[name "golden"|golden-name]]** comes from the idea of an approved original that copies are checked against.

The test has three parts:

1. **The reference.** A file in the repository, usually under `tests/golden/`, holding the numbers a known-good version of the code produced.
2. **The comparison.** A test that runs the current code, loads the reference and compares them.
3. **The tolerance.** A number, written in the test, that says how far apart the two may be before the test fails. It comes with a comment explaining why it is that number.

The third part decides whether the test protects you or annoys you. Compare with `==` and the test breaks every time a library or compiler changes the last digit of a number. Make it loose and it passes while the physics drifts.

::: key
A golden-file regression test is a committed reference output plus a comparison at a stated tolerance. It answers the question no unit test can: did anything about this simulation change. The tolerance is part of the contract and must be justified, not tuned until green.
:::

A golden file does not tell you the output is *right*. It tells you the output is *the same as before*. That is a different promise, and both matter. Unit tests and the invariant checks in the next lesson establish that the physics is right. The golden file then guards that correctness against every future edit, including edits in places nobody thought were related.

## A small simulation to protect

Here is the code we will guard. It is a sounding rocket — a small rocket fired straight up to take measurements and fall back. It starts at $1000\,\mathrm{kg}$, burns $20\,\mathrm{kg}$ of propellant per second for $30\,\mathrm{s}$ with a thrust of $30\,\mathrm{kN}$, and feels gravity and air drag. Air gets thinner with height, so drag uses a density that falls off exponentially. The equations of motion are stepped forward with the classic fourth-order Runge–Kutta method (RK4), using a step of $\Delta t = 0.01\,\mathrm{s}$ (read "delta t", the time step). Every $1\,\mathrm{s}$ it records a row: time, height, vertical velocity and mass.

```python
# ascent.py
import numpy as np

G0 = 9.80665       # m/s^2, standard gravity
RHO0 = 1.225       # kg/m^3, sea-level air density
H_SCALE = 8500.0   # m, density scale height
T_BURN = 30.0      # s, engine burn time


def deriv(state, burning, thrust=30e3, mdot=20.0, cd=0.30, area=0.2, g=G0):
    h, v, m = state
    rho = RHO0 * np.exp(-h / H_SCALE)
    drag = 0.5 * rho * v * abs(v) * cd * area
    f = thrust if burning else 0.0
    return np.array([v, (f - drag) / m - g, -mdot if burning else 0.0])


def simulate(t_end=150.0, dt=0.01, grouping="a", **params):
    state = np.array([0.0, 0.0, 1000.0])       # h [m], v [m/s], m [kg]
    rows = [np.concatenate(([0.0], state))]
    for i in range(1, int(round(t_end / dt)) + 1):
        on = (i - 1) * dt < T_BURN - 0.5 * dt  # engine state for this step
        k1 = deriv(state, on, **params)
        k2 = deriv(state + 0.5 * dt * k1, on, **params)
        k3 = deriv(state + 0.5 * dt * k2, on, **params)
        k4 = deriv(state + dt * k3, on, **params)
        if grouping == "a":
            state = state + dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6
        else:  # the same maths, grouped differently
            state = state + dt / 6 * k1 + dt / 3 * k2 + dt / 3 * k3 + dt / 6 * k4
        if i % 100 == 0:
            rows.append(np.concatenate(([i * dt], state)))
    return np.array(rows)   # columns: t [s], h [m], v [m/s], m [kg]
```

The `grouping` switch is there only for this lesson. Option `"b"` does exactly the same arithmetic as `"a"` on paper — $\frac{1}{6}$, $\frac{2}{6}$, $\frac{2}{6}$, $\frac{1}{6}$ of the four slopes — but in a different order. We will use it to imitate what a new compiler or a new NumPy does to your code without asking.

A few rows of the output:

```python
from ascent import simulate

out = simulate()
for row in out[[0, 30, 106, 150]]:
    print("%6.1f %10.3f %9.3f %8.3f" % tuple(row))
#    0.0      0.000     0.000 1000.000
#   30.0  11608.207   884.093  400.000
#  106.0  41334.256     3.296  400.000
#  150.0  32019.400  -424.427  400.000
```

The rocket burns out at $30\,\mathrm{s}$ doing about $884\,\mathrm{m/s}$, coasts to a peak (its **apogee**) of about $41.3\,\mathrm{km}$ around $106\,\mathrm{s}$, and is falling at about $424\,\mathrm{m/s}$ by $150\,\mathrm{s}$. The velocity column starts positive, passes through zero near the top and ends negative. Hold on to that; it matters when we pick the tolerance.

## Writing the golden test

The test needs to do two jobs: normally, compare against the file; once in a while, on purpose, rewrite the file. A command-line switch keeps the two apart. In the fixtures lesson you met `conftest.py`, the file pytest reads before collecting tests. It is also where you add your own command-line options:

```python
# conftest.py
def pytest_addoption(parser):
    parser.addoption("--update-golden", action="store_true",
                     help="rewrite golden files instead of comparing")
```

`pytest_addoption` is a **hook** — a function with a name pytest looks for and calls at the right moment. This one teaches pytest a new flag, `--update-golden`. Tests read it through the built-in `request` fixture:

```python
# tests/test_ascent_golden.py
from pathlib import Path

import numpy as np
from numpy.testing import assert_allclose

from ascent import simulate

GOLDEN = Path(__file__).parent / "golden" / "ascent_v1.csv"
HEADER = "t_s,h_m,v_mps,m_kg  (ascent.simulate defaults, dt=0.01 s)"

# Tolerance: 1e-9 of each column's largest value.
# Measured noise from regrouping the RK4 sum: about 1e-14 of scale.
# Smallest physics change we must catch (g 9.80665 -> 9.81): 5e-4 of scale.
REL_TO_SCALE = 1e-9


def test_ascent_matches_golden(request):
    got = simulate()
    if request.config.getoption("--update-golden"):
        np.savetxt(GOLDEN, got, fmt="%.17g", delimiter=",", header=HEADER)
    ref = np.loadtxt(GOLDEN, delimiter=",")
    assert got.shape == ref.shape
    scale = np.abs(ref).max(axis=0)
    for col, name in enumerate(["t", "h", "v", "m"]):
        assert_allclose(got[:, col], ref[:, col], rtol=0,
                        atol=REL_TO_SCALE * scale[col], err_msg=f"column {name}")
```

Walk through it line by line.

- `GOLDEN` is the reference file's path, built next to the test file so the test works from any folder.
- With `--update-golden`, the test writes the file first and then compares against what it wrote. That run always passes; it is how you create or refresh the reference.
- `fmt="%.17g"` writes 17 significant digits, enough to bring back the **[[exact same double|seventeen-digits]]** when the file is read, so the file adds no rounding of its own.
- `np.loadtxt` skips the `#` header line, so the header can carry notes for humans: column names, units, settings.
- The shape check catches a changed number of rows or columns.
- Then each column is compared with `assert_allclose`, which you met in the tolerance lesson. It takes `rtol` (relative tolerance) and `atol` (absolute tolerance) and passes when $|\text{actual} - \text{desired}| \le \text{atol} + \text{rtol}\cdot|\text{desired}|$ for every entry. Here `rtol=0` and the absolute tolerance is set per column, for a reason the next section explains. The `err_msg` names the column, so a failure says where to look.

Create the reference, then run the test normally:

```text
$ pytest -q --update-golden
.                                                                        [100%]
1 passed in 0.49s
$ head -3 tests/golden/ascent_v1.csv
# t_s,h_m,v_mps,m_kg  (ascent.simulate defaults, dt=0.01 s)
0,0,0,1000
1,10.196401171938454,20.49222990530771,979.99999999999545
$ pytest -q
.                                                                        [100%]
1 passed in 0.43s
```

The file has 151 data rows and fits on a few screens. Commit it with the test, in the same pull request.

::: warning Never write the golden file in the normal run
A test that silently creates its reference whenever the file is missing will pass on the first run on every new machine — and so will a test whose file was deleted by accident. Creating or rewriting the reference should only happen when a person asks for it with a flag, and the result should show up as a change in `git diff` that someone reviews.
:::

## Choosing the tolerance: noise below, physics above

Every number a computer stores in a `float` is rounded to about 16 significant digits. The gap between $1.0$ and the next larger double is $2^{-52} \approx 2.22 \times 10^{-16}$, called **[[machine epsilon|machine-epsilon]]** and written $\varepsilon$ ("epsilon"). Each arithmetic step can be off by up to half of that, relative to its result. Most of the time these errors are the same from run to run on the same machine. But change the *order* of the operations, and the rounding changes too. For example, in Python `(0.1 + 0.2) + 0.3` prints `0.6000000000000001` while `0.1 + (0.2 + 0.3)` prints `0.6`. Addition of floats does **[[not group freely|reassociation]]**.

Compilers, NumPy and the linear-algebra libraries underneath it reorder operations all the time to go faster. A new version may use a **[[fused multiply-add|fma]]** instruction, split a sum across processor lanes, or pick a different algorithm for a matrix product. None of that is a bug, and none of it changes the physics. It does change the last few digits.

So there are two kinds of difference a golden test can see:

- **Noise**: last-digit changes from reordered arithmetic. A test that fails on these is broken, not helpful.
- **Physics changes**: a different gravity constant, drag coefficient, thrust, time step, or a sign error. These are what the test exists to catch.

A good tolerance sits in the gap between them. To find the gap you measure both sides.

::: example Measuring the noise floor and the physics floor
**The noise.** Run the simulation with `grouping="a"` and with `grouping="b"` — the same maths in a different order — and compare every column:

```python
import numpy as np
from ascent import simulate

a = simulate()
b = simulate(grouping="b")
scale = np.abs(a).max(axis=0)[1:]           # columns h, v, m
noise = np.abs(b - a).max(axis=0)[1:]
print(np.round(scale, 3))                   # [41334.256   884.093  1000.   ]
print(["%.1e" % x for x in noise])          # ['3.1e-10', '1.0e-11', '3.2e-11']
print(["%.1e" % x for x in noise / scale])  # ['7.4e-15', '1.2e-14', '3.2e-14']
```

After 15,000 steps the height differs by at most $3.1 \times 10^{-10}\,\mathrm{m}$ — about a third of a nanometer. Compared with the largest height in the column, $41\,334\,\mathrm{m}$, that is $7.4 \times 10^{-15}$ of the scale. The other columns are similar: roughly $10^{-14}$ of their scale. That is about fifty times machine epsilon, which is what you would expect after thousands of rounded steps.

**The physics.** Now make the smallest change we would want the test to catch. Suppose someone "rounds" gravity from $9.80665$ to $9.81\,\mathrm{m/s^2}$:

```python
c = simulate(g=9.81)
diff = np.abs(c - a).max(axis=0)[1:3]       # columns h, v
print(np.round(diff, 3))                    # [33.625  0.448]
print(["%.1e" % x for x in diff / scale[:2]])  # ['8.1e-04', '5.1e-04']
```

The height moves by up to $33.6\,\mathrm{m}$ and the velocity by $0.448\,\mathrm{m/s}$: about $5 \times 10^{-4}$ of scale or more. Other plausible mistakes are bigger. Raising the thrust by one part in a thousand, from $30.00$ to $30.03\,\mathrm{kN}$, moves the height by $140\,\mathrm{m}$ ($3.4 \times 10^{-3}$ of scale). Changing the drag coefficient from $0.30$ to $0.31$ moves it by $1044\,\mathrm{m}$.

**The gap.** Noise sits near $10^{-14}$ of scale; the smallest physics change sits near $5 \times 10^{-4}$. That is more than ten powers of ten apart. A tolerance of $10^{-9}$ of scale is about $30\,000$ times above the largest noise and $500\,000$ times below the smallest physics change. For height that is $10^{-9} \times 41\,334 \approx 4.1 \times 10^{-5}\,\mathrm{m}$, a few hundredths of a millimeter. Nobody's rocket reaches a different apogee by that little, and no compiler moves it that much.
:::

A **[[wide gap|tolerance-gap]]** like this is typical for a well-behaved, deterministic simulation in double precision. Put the tolerance roughly in the middle of it, on a logarithmic scale, and write both measurements into the comment above the constant, as the test file does. Now anyone who reads the number knows where it came from and can re-measure it.

### Why each column gets its own absolute tolerance

The tolerance lesson taught that a relative tolerance is meaningless near zero. The velocity column passes through zero near apogee. At $t = 106\,\mathrm{s}$ it is $3.30\,\mathrm{m/s}$, about 270 times smaller than its peak of $884\,\mathrm{m/s}$. A relative tolerance applied entry by entry would allow 270 times less error there. But the rounding noise in that entry was carried along from every earlier step, where the velocities were hundreds of meters per second. Noise scales with the numbers that flowed through the calculation, not with the entry you are looking at.

So the test scales the tolerance by each column's largest value and uses it as an **absolute** tolerance, `atol = 1e-9 * scale[col]`, with `rtol=0`. Height gets about $4.1 \times 10^{-5}\,\mathrm{m}$, velocity about $8.8 \times 10^{-7}\,\mathrm{m/s}$, and mass $1.0 \times 10^{-6}\,\mathrm{kg}$. Each is in that column's own units.

::: warning Do not tune the tolerance until the test goes green
Raising the tolerance a notch at a time until a failing test passes turns it into a mirror of the current code. The tolerance must come from the measurements — noise below, the smallest meaningful change above — not from whatever makes today's failure go away. If the only tolerance that passes would also let a gravity-constant change through, the test has found something real.
:::

## When the golden test fails

Now watch the test earn its keep. First, the harmless change: switch the default to `grouping="b"`, imitating a compiler that reorders the RK4 sum.

```text
$ pytest -q
.                                                                        [100%]
1 passed in 0.43s
```

It passes, as it should. Now the physics change: someone edits the drag coefficient default from `0.30` to `0.31`.

```text
$ pytest -q
F                                                                        [100%]
...
E           AssertionError:
E           Not equal to tolerance rtol=0, atol=4.13343e-05
E           column h
E           Mismatched elements: 150 / 151 (99.3%)
E           First 5 mismatches are at indices:
E            [1]: 10.19635831454325 (ACTUAL), 10.196401171938454 (DESIRED)
E            [2]: 41.18122200312671 (ACTUAL), 41.18192698749474 (DESIRED)
...
E           Max absolute difference among violations: 1043.57305033
E           Max relative difference among violations: 0.0325919
...
FAILED tests/test_ascent_golden.py::test_ascent_matches_golden - AssertionErr...
1 failed in 0.46s
```

Read the report from the top. It names the column (`h`), the tolerance in meters, how many rows disagree (150 of 151 — every row after launch), the first few mismatches with both values, and the worst one: $1044\,\mathrm{m}$. That is exactly the drag change measured earlier. A test that says *which* quantity moved and *by how much* turns a red light into a starting point.

When the test goes red, sort the failure into one of three cases before touching anything:

1. **Noise-sized** — near the measured noise floor, around $10^{-14}$ of the column's scale here. The code is fine; the tolerance was tighter than floating-point arithmetic can promise. Fix the tolerance and write the reasoning in the comment and the commit message.
2. **Physics-sized and meant** — you fixed a bug or improved the drag model on purpose. The old reference is out of date. Regenerate it with `--update-golden` in its own commit, saying what changed in the physics and by roughly how much. The reviewer reads the golden file's diff as carefully as the code.
3. **Physics-sized and not meant.** This is the case the test exists for. Something you did not think was connected changed the answer. Find it before you merge.

::: warning Regenerating is a decision, not a fix
Running `--update-golden` makes any failure disappear, including a real bug. Never bundle a regeneration into an unrelated change, and never regenerate because "the test was flaky". Once the reference is overwritten, the old baseline is gone, and with it your ability to notice what changed.
:::

::: example Sorting three real failures
Three failures of the ascent golden test, all measured with the setup above.

**Failure A.** An older copy of the test had `REL_TO_SCALE = 1e-15`, which someone picked because "the test passed on my machine". On a new build server it fails. Worst mismatch: height off by $3.1 \times 10^{-10}\,\mathrm{m}$ against a tolerance of $10^{-15} \times 41\,334 \approx 4.1 \times 10^{-11}\,\mathrm{m}$. Relative to scale the mismatch is $3.1 \times 10^{-10} / 41\,334 \approx 7.4 \times 10^{-15}$, right on the noise floor measured earlier. The code is fine. Case 1: raise the tolerance to the measured value, with the reasoning written down.

**Failure B.** Worst mismatch: height off by $140\,\mathrm{m}$ ($3.4 \times 10^{-3}$ of scale) on a branch whose description says "update engine model to measured thrust of $30.03\,\mathrm{kN}$". Physics-sized and intended. Case 2: regenerate in its own commit, and write in the message that the recorded apogee rises by about $95\,\mathrm{m}$ with the measured thrust.

**Failure C.** Worst mismatch: velocity off by $0.448\,\mathrm{m/s}$ ($5.1 \times 10^{-4}$ of scale) on a branch that "only tidied up the constants file". Physics-sized and unintended. Case 3. Searching the diff finds `G0 = 9.81`. The tidy-up rounded standard gravity. The test caught it.
:::

## Practical habits

A few habits keep golden files useful for years.

- **Keep them small and readable.** Record what matters at a coarse interval — one row per second, not one per step. CSV shows up in `git diff`, so a reviewer sees which numbers changed. For big arrays a binary `.npz` file (written with `np.savez`) is fine, with a short script that prints the differences.
- **Store full precision.** Use `fmt="%.17g"` or NumPy's default `"%.18e"`, never six digits.
- **Pin everything random.** Sensor noise, wind gusts, Monte Carlo dispersions: fix the **[[seed|random-seed]]** so every run draws the same numbers.
- **Let the file explain itself.** Put the function, time step and column units in the header.
- **One file per scenario.** Nominal ascent, engine-out, high wind — a parametrized test with one file each, so a failure names the scenario.
- **Mark them slow.** A real six-degree-of-freedom simulator takes minutes per scenario. Mark golden tests, as in the markers lesson, so the fast suite stays fast and CI runs the golden suite on every pull request.

## Check yourself

::: check
In one or two sentences each: what does a golden-file test tell you that a unit test does not, and what does it *not* tell you?
:::

::: answer
It tells you whether anything about the whole simulation's output changed since the reference was made — including changes caused by edits in code you did not think was related. A unit test only checks the particular function and inputs you wrote it for.

It does not tell you the output is correct. If the reference was produced by buggy code, the golden test faithfully protects the bug. Correctness has to come from unit tests, invariants and comparisons with known solutions; the golden file then guards it.
:::

::: check
A teammate proposes `REL_TO_SCALE = 1e-3` for the ascent golden test "so it never fails on other machines". Using the measurements in this lesson, explain what that tolerance would miss.
:::

::: answer
With `REL_TO_SCALE = 1e-3`, each column may move by a tenth of a percent of its largest value: about $41\,\mathrm{m}$ of height and $0.88\,\mathrm{m/s}$ of velocity. The gravity change from $9.80665$ to $9.81\,\mathrm{m/s^2}$ moved the height by $33.6\,\mathrm{m}$ ($8.1 \times 10^{-4}$ of scale) and the velocity by $0.448\,\mathrm{m/s}$ ($5.1 \times 10^{-4}$) — both inside the tolerance, so the test would pass with the wrong gravity. Meanwhile the noise it is meant to forgive is around $10^{-14}$ of scale, so nothing near $10^{-3}$ is needed for portability. A tolerance of $10^{-9}$ of scale is already tens of thousands of times above the noise.
:::

::: check
Why does the test use `rtol=0` with a per-column `atol`, rather than a single `rtol`? Use the velocity column in your answer.
:::

::: answer
The velocity passes through zero near apogee ($3.30\,\mathrm{m/s}$ at $106\,\mathrm{s}$ against a peak of $884\,\mathrm{m/s}$). A relative tolerance applied to each entry shrinks the allowed error in proportion to the entry, so it becomes extremely strict near zero — and at an entry that is exactly zero, it demands exact equality. But the rounding noise in that entry was built up from all the earlier steps, where the velocities were hundreds of meters per second, so it does not shrink. An absolute tolerance per column, scaled from the column's largest value, matches the noise level and stays in that column's own units.
:::

::: check
A golden test fails. The worst mismatch is $2 \times 10^{-12}\,\mathrm{m/s}$ in a velocity column whose largest value is $900\,\mathrm{m/s}$, and the test's tolerance is `atol = 1e-15`. Which of the three cases is this, and what do you do?
:::

::: answer
Relative to scale, the difference is $2 \times 10^{-12} / 900 \approx 2.2 \times 10^{-15}$ — about ten times machine epsilon. That is rounding noise, case 1. The tolerance of $10^{-15}\,\mathrm{m/s}$ is about $10^{-18}$ of the column's scale, far below what double precision can promise after thousands of steps. The fix is to set a tolerance from measurement: find the noise floor (for example by regrouping the arithmetic, or running on a second machine) and the smallest physics change you need to catch, choose a value between them, and write that reasoning in a comment and the commit message. Do not regenerate the reference; the reference is fine.
:::

::: check
Why should the golden file be written with `%.17g` rather than `%.6g`? Put a number on it using the first nonzero height, $10.196401171938454\,\mathrm{m}$.
:::

::: answer
Written with six significant digits it becomes $10.1964\,\mathrm{m}$, off by about $1.2 \times 10^{-6}\,\mathrm{m}$ — an error the file itself adds before any comparison. Six digits can add up to $5 \times 10^{-6}$ relative error, far larger than a well-chosen tolerance like $10^{-9}$ of scale, so it could fake a failure or hide a real change. Seventeen significant digits always bring back the exact same double, so the file adds no error at all.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Golden file | committed reference output of a known-good run |
| Golden-file test | run, load reference, compare at a stated, justified tolerance |
| What it answers | did anything about the simulation's output change |
| What it does not answer | whether the output is correct |
| Noise floor | last-digit changes from reordered arithmetic; here about $10^{-14}$ of scale |
| Physics floor | smallest change you must catch; here about $5 \times 10^{-4}$ of scale |
| Choosing the tolerance | between the two, roughly the middle on a log scale; write both measurements in a comment |
| Near-zero columns | absolute tolerance per column, scaled by the column's largest value |
| `--update-golden` | a `conftest.py` option; regeneration is a reviewed decision in its own commit |
| File format | `np.savetxt(..., fmt="%.17g")` so the file adds no rounding |

A golden file guards whatever the code does today — right or wrong. The next lesson is about the other half: testing that the numbers are right in the first place, using invariants, convergence order and conservation laws, when you have no answer key to compare against.

::: context regression-word Why it is called a regression
To regress is to go backward. In software, a regression is a feature that used to work and has stopped working — the code went backward. A regression test is any test kept around to catch that, and a regression suite is the whole collection that runs on every change. Statisticians use the same word for fitting a line to data, which is an unrelated meaning with a separate history; in testing, it only ever means "going backward".
:::

::: context golden-name Where "golden" comes from
The word comes from manufacturing, where a golden master (or golden reference) is the approved original that every copy is checked against — a reference circuit board, a reference disk, a reference part. Software teams borrowed it for a saved output that later runs are compared with. You will also meet the same idea as "snapshot testing" in web development, "approval testing", and "characterization tests", a name used for tests written around old code so it can be changed safely. The mechanics are the same in every case: save an output, compare against it later.
:::

::: context seventeen-digits Why seventeen digits round-trip a double
A double stores 53 binary digits of precision. Converting that to decimal and back without losing anything needs enough decimal digits that no two neighboring doubles print the same. Working it out gives $\lceil 1 + 53 \log_{10} 2 \rceil = 17$ significant digits, which is always enough. Python's `repr` is cleverer: it prints the shortest string that reads back to the same double, often fewer than 17 digits, which is why `0.1` prints as `0.1`. The `%.17g` format is the simple, always-safe choice for files.
:::

::: context machine-epsilon The gaps between floating-point numbers
Doubles are not spread evenly. Between $1$ and $2$ there are $2^{52}$ of them, spaced $2^{-52} \approx 2.22 \times 10^{-16}$ apart. Between $2$ and $4$ there are the same number, spaced twice as far apart. So the spacing grows with the size of the number: near $1000$ it is about $1.1 \times 10^{-13}$, and near $41\,334$ (the rocket's apogee in meters) it is about $7.3 \times 10^{-12}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2"><line x1="20" y1="48" x2="20" y2="72"/><line x1="120" y1="48" x2="120" y2="72"/><line x1="320" y1="48" x2="320" y2="72"/></g>
  <g stroke="#1d6fd1" stroke-width="2"><line x1="32.5" y1="52" x2="32.5" y2="68"/><line x1="45" y1="52" x2="45" y2="68"/><line x1="57.5" y1="52" x2="57.5" y2="68"/><line x1="70" y1="52" x2="70" y2="68"/><line x1="82.5" y1="52" x2="82.5" y2="68"/><line x1="95" y1="52" x2="95" y2="68"/><line x1="107.5" y1="52" x2="107.5" y2="68"/></g>
  <g stroke="#b4232c" stroke-width="2"><line x1="145" y1="52" x2="145" y2="68"/><line x1="170" y1="52" x2="170" y2="68"/><line x1="195" y1="52" x2="195" y2="68"/><line x1="220" y1="52" x2="220" y2="68"/><line x1="245" y1="52" x2="245" y2="68"/><line x1="270" y1="52" x2="270" y2="68"/><line x1="295" y1="52" x2="295" y2="68"/></g>
  <text x="20" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="120" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="320" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="70" y="36" font-size="12" fill="#1d6fd1" text-anchor="middle">gap ε</text>
  <text x="220" y="36" font-size="12" fill="#b4232c" text-anchor="middle">gap 2ε</text>
  <text x="180" y="110" font-size="11" fill="#6c7a93" text-anchor="middle">same count in each range; really 2^52, not 8</text>
</svg>
```

That is why tolerances are set relative to a size, never as one fixed number for every quantity.
:::

::: context reassociation Why the order of adding matters
In exact arithmetic, $(a + b) + c = a + (b + c)$. In floating point, every addition rounds its result to the nearest double, and the two orders round at different places. With $0.1$, $0.2$ and $0.3$, adding the first two gives $0.30000000000000004$, and adding $0.3$ to that lands on the double right above $0.6$. Adding the last two first lands exactly on the double nearest $0.6$. Each difference is tiny, but a simulation performs millions of additions, so any reordering leaves its fingerprint in the last few digits of the output.
:::

::: context fma Fused multiply-add
Many processors have an instruction that computes $a \times b + c$ in one step and rounds only once at the end, instead of rounding after the multiply and again after the add. It is faster and usually slightly more accurate. But it gives a slightly *different* answer from the two-step version, so whether a compiler uses it — which can depend on the compiler version, its flags and the processor — changes the last bits of results. It is one of the most common reasons a golden test with a too-tight tolerance fails after a toolchain upgrade.
:::

::: context tolerance-gap The gap a tolerance lives in
On a logarithmic scale, the measurements from the ascent example look like this. The noise from reordered arithmetic sits far to the left, the smallest physics change far to the right, and the tolerance sits well away from both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="65" x2="20" y2="75"/><line x1="80" y1="65" x2="80" y2="75"/><line x1="140" y1="65" x2="140" y2="75"/>
    <line x1="200" y1="65" x2="200" y2="75"/><line x1="260" y1="65" x2="260" y2="75"/><line x1="320" y1="65" x2="320" y2="75"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="90">1e-16</text><text x="80" y="90">1e-14</text><text x="140" y="90">1e-12</text>
    <text x="200" y="90">1e-10</text><text x="260" y="90">1e-8</text><text x="320" y="90">1e-6</text>
  </g>
  <rect x="76" y="52" width="19" height="12" fill="#8fb8f0"/>
  <text x="86" y="46" font-size="11" fill="#1d6fd1" text-anchor="middle">noise</text>
  <line x1="230" y1="40" x2="230" y2="80" stroke="#b4232c" stroke-width="3"/>
  <text x="230" y="34" font-size="11" fill="#b4232c" text-anchor="middle">tolerance 1e-9</text>
  <polygon points="340,58 330,53 330,63" fill="#f2b880"/>
  <text x="300" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">physics ≥ 5e-4 (off the chart)</text>
  <text x="20" y="122" font-size="11" fill="#6c7a93">fraction of column scale</text>
</svg>
```

If the noise band and the physics changes ever overlap, no tolerance can separate them, and the golden test needs a different design — for example, comparing statistics of the output instead of the raw numbers.
:::

::: context random-seed Seeds and repeatable randomness
A pseudo-random number generator produces a long sequence that looks random but is fully decided by a starting number, the seed. With `rng = np.random.default_rng(42)`, every run draws the same values, so a simulation with sensor noise is repeatable and can have a golden file. One catch: NumPy promises the frozen, bit-for-bit stream only for its older `RandomState` generator. The newer `Generator` may change its streams between NumPy versions, so a golden file that depends on random draws should record the NumPy version in its header, and its tolerance should be reasoned about with that in mind.
:::
