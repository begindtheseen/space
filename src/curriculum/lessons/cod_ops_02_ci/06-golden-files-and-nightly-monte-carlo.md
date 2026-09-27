---
id: l06-golden-files-and-nightly-monte-carlo
title: Golden files and the nightly Monte Carlo
minutes: 26
covers:
  - Golden-file regression comparison with numerical tolerance
  - Nightly and scheduled long-running Monte Carlo jobs
---

A baker who has perfected a cake keeps one thing above all: the recipe card with notes from the day it came out right. When a new helper bakes it, nobody expects the new cake to weigh exactly the same, down to the last crumb. The oven runs a degree hotter, the eggs are a little bigger. What the baker checks is that it is the same cake *within reason*: a few grams either way is fine, a cake half the height is not. And the baker decides in advance what "within reason" means.

A simulation team keeps the same kind of record. A **golden file** is a saved output from a simulation run that the team reviewed and approved: the "cake that came out right". Every change to the code reruns the same scenario and compares the new output with the golden file. The comparison allows a small, stated difference called a **tolerance**, because computers, like ovens, are never exactly the same twice.

The second half of this lesson is about the runs that are too big for every pull request: the **Monte Carlo** campaign that flies the same scenario hundreds of times with random errors. That job runs on a schedule, overnight, and publishes a report. Both halves share one idea: a simulation result is evidence, so it must be checked in a way that is honest about numbers and reproducible afterwards.

## A golden file for a reference orbit

Here is a small orbit propagator in Python. It moves a satellite around the Earth using only Earth's gravity, stepping forward in time with the RK4 method you met in lesson 1:

```python
"""Two-body orbit propagator with a fixed-step RK4 integrator."""
import numpy as np

MU = 3.986004418e14  # Earth's gravitational parameter, m^3/s^2


def deriv(state):
    r = state[:3]
    v = state[3:]
    a = -MU * r / np.linalg.norm(r) ** 3
    return np.concatenate([v, a])


def rk4_step(state, dt):
    k1 = deriv(state)
    k2 = deriv(state + 0.5 * dt * k1)
    k3 = deriv(state + 0.5 * dt * k2)
    k4 = deriv(state + dt * k3)
    return state + dt / 6.0 * (k1 + 2 * k2 + 2 * k3 + k4)


def propagate(state0, dt, steps, every):
    """Return rows of (t, x, y, z, vx, vy, vz), one row every `every` steps."""
    rows = [np.concatenate([[0.0], state0])]
    state = np.array(state0, dtype=float)
    for k in range(1, steps + 1):
        state = rk4_step(state, dt)
        if k % every == 0:
            rows.append(np.concatenate([[k * dt], state]))
    return np.array(rows)


def reference_orbit():
    """Circular 400 km orbit, inclined 51.6 degrees, one hour at dt = 10 s."""
    r0 = 6378137.0 + 400e3
    v0 = np.sqrt(MU / r0)
    inc = np.radians(51.6)
    state0 = np.array([r0, 0.0, 0.0, 0.0, v0 * np.cos(inc), v0 * np.sin(inc)])
    return propagate(state0, dt=10.0, steps=360, every=6)


if __name__ == "__main__":
    import sys

    out = sys.argv[1]
    np.savetxt(out, reference_orbit(), delimiter=",", fmt="%.17g",
               header="t,x,y,z,vx,vy,vz", comments="")
    print(f"wrote {out}")
```

The **reference scenario** is a circular orbit 400 km up, tilted 51.6 degrees to the equator, propagated for one hour with a 10-second step and saved once a minute. The **state** is six numbers: position $x, y, z$ in meters and velocity $v_x, v_y, v_z$ in meters per second.

Running `python3 orbit.py golden/reference_orbit.csv` wrote a 62-line file: one header line and 61 rows, one for each minute from 0 to 60. Its first three lines (all runs in this lesson used Python 3.11, NumPy 2.4.6 and pytest 9.0.2):

```text
t,x,y,z,vx,vy,vz
0,6778137,0,0,0,4763.3078885891819,6009.7988691890896
60,6762526.2840498192,285579.03224198124,360311.06642159697,-520.15736736153065,4752.3375221843617,5995.9577114986078
```

Two details matter. First, `fmt="%.17g"` writes 17 significant digits, which is enough to [[bring back every double exactly|seventeen-digits]]. A golden file that rounds its own numbers has thrown away the evidence before any comparison starts. Second, this file is **committed to the repository**, next to the code, and it only changes on purpose, in a reviewed pull request.

## Why "exactly equal" is the wrong test

The tempting test is: run again, and check that every number is exactly the same. It fails for reasons that have nothing to do with bugs.

In the last lesson, the same C++ source gave `0` at `-O0` and `5.55e-17` at `-O2`, because the optimizer fused a multiply and an add into one instruction with a single rounding. Floating-point results can shift in their last bits whenever something below your code changes:

- a different compiler, or the same compiler with different optimization flags;
- a different version of the math library (**libm**), which computes `sqrt`, `sin`, `exp` and friends, each with its own tiny rounding choices;
- **vectorization**, where the processor adds numbers four or eight at a time and so in a different order;
- a different number of threads, which changes the order in which partial sums are added up.

Each difference is around $10^{-16}$ of the value, the size of one rounding step for a double. None of them changes the physics. An exact comparison turns every one of them into a red build, and a team that sees red builds for no reason soon stops looking.

::: key Why can a simulation regression test not use exact equality?
Floating-point results differ across compilers, libm versions, vectorisation and thread counts. Compare with an explicit relative and absolute tolerance chosen from the physics, and record the tolerance as part of the test contract.
:::

::: warning Two "fixes" that make it worse
Rounding every output to, say, four decimal places before comparing does make the red go away. It also hides any real change smaller than the fourth decimal, which for a position in meters may be a big one. Turning on `-ffast-math` so that two platforms "agree" is worse still: it allows the compiler to reorder arithmetic freely and to assume there are no NaNs or infinities, so results get *less* reproducible and NaN checks can silently stop working. Choose a tolerance instead.
:::

## The tolerance rule

The rule used almost everywhere comes from NumPy. `numpy.testing.assert_allclose(actual, desired, rtol, atol)` passes when, for **every** element,

$$
|\,\text{actual} - \text{desired}\,| \le \text{atol} + \text{rtol} \times |\,\text{desired}\,|
$$

Read it as: "the size of the error is at most the absolute tolerance plus the relative tolerance times the size of the expected value". It has two parts:

- **rtol**, the **relative tolerance**, scales with the value. With $\text{rtol} = 10^{-9}$, a position of $6\,778\,137\,\mathrm{m}$ may be off by $6\,778\,137 \times 10^{-9} \approx 6.78 \times 10^{-3}\,\mathrm{m}$, about 7 mm.
- **atol**, the **absolute tolerance**, is a fixed floor in the column's own units. It matters when the expected value is zero or close to it, where the relative part shrinks to nothing.

The exact behavior of `assert_allclose` is worth knowing by heart:

- Its defaults are `rtol=1e-07` and `atol=0`. With `atol=0`, an expected value of exactly zero demands an actual value of exactly zero.
- The tolerance is measured against `desired`, the second argument, not the first. Put the golden value second. The rule is not symmetric: with $\text{rtol} = 0.1$, `numpy.isclose(1.0, 1.11, rtol=0.1, atol=0)` is `True` but `numpy.isclose(1.11, 1.0, rtol=0.1, atol=0)` is `False`, because 10 percent of 1.11 is bigger than 10 percent of 1.0. (Python's `math.isclose` is symmetric; NumPy's functions are not.)
- It has `equal_nan=True` by default: a NaN in the actual result matches a NaN in the same place in the expected one. This matters because in plain arithmetic `float("nan") == float("nan")` is `False`, so a hand-written comparison must test for NaN on its own, with `math.isnan(x)`, before comparing values.
- It fails if **any** element is out of tolerance, and its message reports how many elements failed and the largest absolute and relative differences.
- `numpy.isclose` uses the same formula but different defaults (`rtol=1e-05`, `atol=1e-08`, `equal_nan=False`). Always pass both tolerances explicitly, so nobody has to remember which default applies.

::: example Why the absolute tolerance is not optional
Compare an actual result `[7000.0, 3e-16]` with an expected `[7000.000001, 0.0]`, first with only a relative tolerance:

```python
np.testing.assert_allclose([7000.0, 3e-16], [7000.000001, 0.0], rtol=1e-9)
```

```text
Not equal to tolerance rtol=1e-09, atol=0

Mismatched elements: 1 / 2 (50%)
Mismatch at index:
 [1]: 3e-16 (ACTUAL), 0.0 (DESIRED)
Max absolute difference among violations: 3.e-16
Max relative difference among violations: inf
```

Check the first element by hand. The error is $|7000.0 - 7000.000001| = 1.0 \times 10^{-6}$. The allowance is $0 + 10^{-9} \times 7000.000001 = 7.0 \times 10^{-6}$. The error is smaller, so it passes.

The second element fails. The expected value is $0$, so the allowance is $0 + 10^{-9} \times 0 = 0$, and nothing but an exact zero can pass. The "relative difference" is reported as `inf` because dividing by zero is infinite. Yet $3 \times 10^{-16}$ is a rounding crumb.

Add `atol=1e-12` and the same call passes: the second element's allowance becomes $10^{-12}$, and $3 \times 10^{-16}$ fits easily.

Positions and velocities cross zero all the time. The reference orbit starts with $y = 0$, $z = 0$ and $v_x = 0$ exactly. A test with no absolute tolerance is a test waiting to fail on its first platform change.
:::

## Choosing tolerances from the physics

A tolerance is a claim: "differences smaller than this are noise, and differences bigger than this are real". So it has to sit in a gap: well above the rounding noise, and well below any change you would care about. You find the gap by measuring both sides.

Here is the regression test for the reference orbit. Each column gets its own pair of tolerances, written in a table at the top of the test:

```python
"""Regression test: the reference orbit must match the committed golden file."""
from pathlib import Path

import numpy as np

import orbit

GOLDEN = Path(__file__).parent.parent / "golden" / "reference_orbit.csv"

# The tolerance contract, column by column: (rtol, atol).
# 1e-9 relative is about 7 mm at orbit radius; atol covers values near zero.
TOLERANCE = {
    "t": (0.0, 0.0),
    "x": (1e-9, 1e-3), "y": (1e-9, 1e-3), "z": (1e-9, 1e-3),        # m
    "vx": (1e-9, 1e-6), "vy": (1e-9, 1e-6), "vz": (1e-9, 1e-6),     # m/s
}


def test_reference_orbit_matches_golden():
    golden = np.loadtxt(GOLDEN, delimiter=",", skiprows=1)
    columns = GOLDEN.read_text().splitlines()[0].split(",")
    actual = orbit.reference_orbit()
    assert actual.shape == golden.shape
    for i, name in enumerate(columns):
        rtol, atol = TOLERANCE[name]
        np.testing.assert_allclose(actual[:, i], golden[:, i],
                                   rtol=rtol, atol=atol, err_msg=f"column {name}")
```

The `TOLERANCE` table is the **[[tolerance contract|tolerance-contract]]**. It is part of the test, reviewed like code, with units in the comments. Time must match exactly, because it is computed from whole numbers of steps. Positions may differ by $10^{-9}$ relative or 1 mm absolute, whichever allows more. Velocities get $10^{-9}$ relative or $10^{-6}\,\mathrm{m/s}$ absolute.

::: example Four changes, measured against the tolerance
Each change below was made to `orbit.py`, the test was run, and the differences from the golden file were measured.

**1. A harmless rewrite.** The acceleration line becomes `a = -(MU / (rn * rn * rn)) * r`, with `rn` the length of `r`. Mathematically identical; the rounding happens in a different order. The largest position difference over the hour was $9.3 \times 10^{-10}\,\mathrm{m}$, the largest velocity difference $9.1 \times 10^{-13}\,\mathrm{m/s}$. Test result: `1 passed`. Exact comparison would have failed.

**2. Halving the time step.** With `dt = 5.0` s (and a row every 12 steps, so the times still line up), the integrator is more accurate, and the answer moves by up to $1.18 \times 10^{-2}\,\mathrm{m}$, about 12 mm. That exceeds the allowance of about 7 mm in 23 of the 61 rows, starting at $t = 2280\,\mathrm{s}$. The test fails. That is correct: the results changed by a measurable amount, and someone must decide on purpose that the new numbers are the approved ones.

**3. A typo in the constant.** `MU = 3.986004e14` instead of `3.986004418e14`, a relative change of about $1.05 \times 10^{-7}$. The test fails at once:

```text
E           AssertionError:
E           Not equal to tolerance rtol=1e-09, atol=0.001
E           column x
E           Mismatched elements: 58 / 61 (95.1%)
E           First 5 mismatches are at indices:
E            [3]: 6638071.676040179 (ACTUAL), 6638071.661402755 (DESIRED)
E            [4]: 6529801.043052586 (ACTUAL), 6529801.017170555 (DESIRED)
...
E           Max absolute difference among violations: 1.16150876
E           Max relative difference among violations: 8.60759112e-06
```

A position error of 1.16 m after one hour, from dropping three digits.

**4. Exact comparison, for contrast.** Setting every tolerance to zero fails change 1 as well as changes 2 and 3. It cannot tell a rounding crumb from a typo.

Put the sizes on one line: rounding noise about $10^{-9}\,\mathrm{m}$, tolerance about $7 \times 10^{-3}\,\mathrm{m}$, a step-size change about $10^{-2}\,\mathrm{m}$, a wrong constant about $1\,\mathrm{m}$. The tolerance sits more than six factors of ten above the noise, and below every real change. That [[gap|tolerance-window]] is what makes the test trustworthy.
:::

::: warning The tolerance is not a dial for making tests pass
When a golden test fails, the tempting move is to loosen `rtol` until it passes. Do that and the test stops catching the typo in example 3. Change a tolerance only for a reason you can write down, from the physics or a measured noise level, and change it in its own reviewed commit.
:::

## Updating a golden file on purpose

Sometimes the new numbers are the right ones. The step size was halved for accuracy, or a better gravity model was added. Then the golden file must change. Do it as a deliberate, visible act:

1. Regenerate it with the same command that made it: `python3 orbit.py golden/reference_orbit.csv`.
2. Look at the size of the change before committing. `git diff` shows the old and new rows; a small script can print the largest difference per column.
3. Commit the new golden file in the same pull request as the code change, with a message that says why the numbers moved and by how much ("dt 10 s to 5 s: positions change by up to 12 mm").
4. Let a reviewer who knows the physics approve it.

Never let CI rewrite golden files by itself. A pipeline that "updates the golden file if the test fails" has no golden file at all.

When a golden test fails in a long report, the reviewer wants to see the **worst offender first**. Collect the failures as tuples and sort them by error, largest first. In Python, `sorted(errors, key=lambda e: e[2], reverse=True)` sorts by the third item of each tuple, biggest first:

```python
errors = [("x", 3, 2.0e-9), ("vz", 7, 4.1e-6), ("y", 1, 5.0e-8)]
worst_first = sorted(errors, key=lambda e: e[2], reverse=True)
print(worst_first[0])   # ('vz', 7, 4.1e-06)
```

## The nightly Monte Carlo

A single reference orbit checks that the code does what it did yesterday. It does not tell you whether the vehicle is safe when things go a little wrong. For that, GNC teams run a **Monte Carlo** analysis, also called a **dispersion** run: the same scenario hundreds or thousands of times, each with random errors drawn from their expected sizes, to see the spread of outcomes and how often a requirement is broken.

Here the question is: if the rocket puts the satellite into orbit slightly wrong, how low can the orbit dip in its first lap? Each **case** adds a random position error (1-sigma 200 m on each axis) and a random velocity error (1-sigma 2 m/s on each axis) to the reference state, propagates one orbit, and records the lowest altitude reached. The requirement, invented for this example, is to stay above 385 km.

The heart of `dispersion.py` is one function that runs one case:

```python
def run_case(base_seed, case_id):
    """One case. Its random numbers depend only on (base_seed, case_id)."""
    rng = np.random.default_rng([base_seed, case_id])
    r0 = R_EARTH + 400e3
    v0 = np.sqrt(orbit.MU / r0)
    inc = np.radians(51.6)
    state = np.array([r0, 0.0, 0.0, 0.0, v0 * np.cos(inc), v0 * np.sin(inc)])
    state[:3] += rng.normal(0.0, 200.0, 3)   # position error, 1-sigma 200 m
    state[3:] += rng.normal(0.0, 2.0, 3)     # velocity error, 1-sigma 2 m/s
    lowest = np.inf
    for _ in range(280):                     # 280 steps of 20 s: one orbit
        state = orbit.rk4_step(state, 20.0)
        lowest = min(lowest, np.linalg.norm(state[:3]) - R_EARTH)
    return lowest / 1000.0                   # km
```

The script's `main` runs cases 0 to 499, finds the cases below the floor, sorts them lowest first with `np.argsort`, writes everything to `mc-report/report.json`, and exits with code 1 if any case broke the requirement, so the scheduled run shows red and someone looks.

Why not run this on every pull request? This toy version takes 3.3 seconds. A real dispersion flies a full six-degree-of-freedom vehicle with engines, winds and sensor models, often thousands of cases, and takes hours. That is exactly the kind of job lesson 5 moved off the pull request and onto a schedule.

## Seeds: random by design, reproducible by record

A Monte Carlo run is random on purpose. But when case 428 fails at 3 a.m., you must be able to rerun case 428 exactly, the next morning, on your own computer. So the randomness must be **reproducible by record**.

A **random seed** is the starting number for a **[[random number generator|prng]]**. The same seed gives the same sequence of "random" numbers every time. The line that makes this work is:

```python
rng = np.random.default_rng([base_seed, case_id])
```

Each case builds its own generator from two numbers: the run's **base seed**, and the case number. So case 428's random errors depend only on the pair (base seed, 428). Not on which cases ran before it, not on how many cases there are, not on how the work was split between machines. Write the base seed into the report, and any case can be rebuilt from the report alone.

::: example A dispersion run, and a rerun of its worst case
The run used the date as its base seed:

```bash
python3 dispersion.py --seed 20260927 --cases 500
```

Its report, `mc-report/report.json`:

```text
{
  "base_seed": 20260927,
  "cases": 500,
  "floor_km": 385.0,
  "lowest_km_percentiles": {
    "1": 386.068,
    "50": 398.269,
    "99": 400.232
  },
  "violations": [
    { "case": 428, "lowest_km": 378.876 },
    { "case": 317, "lowest_km": 383.836 },
    { "case": 340, "lowest_km": 384.611 }
  ]
}
```

(The violations list is shown compacted onto one line per case.) Read it: half the cases dipped no lower than 398.3 km; one case in a hundred went below 386.1 km; and 3 of 500 cases, 0.6 percent, broke the 385 km floor. The process exited with code 1.

The next morning, rerun only the worst case:

```text
$ python3 dispersion.py --seed 20260927 --case 428
seed 20260927 case 428: lowest altitude 378.876 km
```

The same 378.876 km, from one case instead of five hundred.

Is the number believable? Printing that case's random draws shows a velocity error of $-5.80\,\mathrm{m/s}$ along the direction of flight. For a circular orbit, a small along-track speed change $\Delta v$ changes the altitude on the far side by about $4\,r\,\Delta v / v$. Here $r = 6\,778\,137\,\mathrm{m}$ and $v = 7669\,\mathrm{m/s}$, so each $1\,\mathrm{m/s}$ moves the far side by about $3.54\,\mathrm{km}$. Then $5.80 \times 3.54 \approx 20.5\,\mathrm{km}$ lower, which takes 400 km to about 379.5 km. The simulation says 378.9 km; the small rest comes from the other error terms. The worst case of 500 is a roughly three-sigma draw, which is what you would expect to find in 500 tries.
:::

::: key Seed every case, record the seed
A dispersion run should be stochastic by design but reproducible by record: derive each case's generator from a base seed and the case number, write the base seed into the report, and any failing case can be rerun exactly. A run without a recorded seed fails differently each night and can never be reproduced.
:::

::: warning Never "fix" a failing Monte Carlo with retries
If the nightly run fails, rerunning it with fresh random numbers until it passes throws away the one case that found a problem. A red Monte Carlo is a finding. Rerun the failing case from its seed, understand it, and fix the design or the requirement.
:::

## Scheduling the run

GitHub Actions starts a workflow on a timetable with the `schedule` event, written as a **cron** expression: five fields for minute, hour, day of the month, month and day of the week, where `*` means "every". Lesson 2 introduced it. `"23 3 * * *"` means minute 23, hour 3, every day: 03:23 every night.

To check a timetable before trusting it, compute the next few times it fires. Starting from noon UTC on Friday 2 October 2026 (with the Python package croniter 6.2.4):

```text
23 3 * * *     ->  Sat 03 Oct 03:23, Sun 04 Oct 03:23, Mon 05 Oct 03:23, Tue 06 Oct 03:23
23 3 * * 1-5   ->  Mon 05 Oct 03:23, Tue 06 Oct 03:23, Wed 07 Oct 03:23, Thu 08 Oct 03:23
40 5 * * 6     ->  Sat 03 Oct 05:40, Sat 10 Oct 05:40, Sat 17 Oct 05:40, Sat 24 Oct 05:40
```

The day-of-week field counts Sunday as 0, so `1-5` is Monday to Friday and skips the weekend, and `6` is Saturday.

A few facts about GitHub's schedules shape how you write them:

- The times are **UTC**, not your local time.
- A scheduled run uses the **latest commit on the default branch**, so the nightly job always tests what is on `main`.
- Scheduled runs can be **delayed when GitHub is busy**, and the start of every hour is the busiest time, so an odd minute like 23 is kinder than 00.
- In a public repository, scheduled workflows are switched off automatically after 60 days with no activity in the repository.
- A job on a GitHub-hosted runner may run for at most 6 hours. A campaign longer than that is split across several jobs, or runs on a self-hosted runner.

Here is the whole nightly workflow. It passes actionlint 1.7.12.

```yaml
name: Nightly Monte Carlo
on:
  schedule:
    - cron: "23 3 * * *"        # every day at 03:23 UTC
  workflow_dispatch:            # the "Run workflow" button, for reruns
    inputs:
      seed:
        description: Base seed (leave empty to use today's date)
        required: false
        default: ""
      cases:
        description: Number of cases
        required: false
        default: "500"

permissions:
  contents: read

jobs:
  dispersion:
    runs-on: ubuntu-24.04
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: "3.12"
          cache: pip
      - run: python -m pip install -r requirements.lock
      - name: Choose and record the base seed
        env:
          INPUT_SEED: ${{ inputs.seed }}
        run: echo "SEED=${INPUT_SEED:-$(date -u +%Y%m%d)}" >> "$GITHUB_ENV"
      - name: Run the dispersion
        env:
          CASES: ${{ inputs.cases || '500' }}
        run: python dispersion.py --seed "$SEED" --cases "$CASES" --out mc-report
      - name: Publish the report, pass or fail
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: mc-report-${{ env.SEED }}
          path: mc-report/
          retention-days: 30
```

Walk through the parts that are new:

1. **Two triggers.** `schedule` runs it every night. `workflow_dispatch` adds a "Run workflow" button on GitHub's Actions page, with two boxes to fill in, so a person can rerun it with a chosen seed or case count.
2. **Choosing the seed.** On a scheduled run there are no inputs, so `inputs.seed` is empty. The shell expression `${INPUT_SEED:-$(date -u +%Y%m%d)}` means "use `INPUT_SEED` if it is set and not empty, otherwise today's UTC date", which gives a new set of random cases each night, like `20260927`. Writing `SEED=...` into the file named by `$GITHUB_ENV` makes `SEED` an environment variable for every later step.
3. **The case count.** `${{ inputs.cases || '500' }}` reads "the input, or 500 if it is empty".
4. **Publishing, pass or fail.** The script exits with 1 when a case breaks the floor, which fails the job. The upload step has `if: always()`, so the report is published anyway, named with its seed, for example `mc-report-20260927`. `retention-days: 30` keeps a month of nightly reports.

Rerunning a failed night is then two clicks: press "Run workflow", type the seed from the report's name, and the same 500 cases fly again.

## Check yourself

::: check
A golden test compares a velocity column with `rtol=1e-9` and `atol=0`. The expected value in one row is `0.0` and the actual value is `-2e-17`. Does it pass? What would you change, and how would you pick the number?
:::

::: answer
It fails. The allowance is $0 + 10^{-9} \times |0| = 0$, and $|-2 \times 10^{-17} - 0| = 2 \times 10^{-17}$ is bigger than 0. Add an absolute tolerance in the column's units. Pick it from the physics and the noise: rounding noise on a velocity of a few km/s is around $10^{-12}\,\mathrm{m/s}$, and nobody cares about $10^{-6}\,\mathrm{m/s}$ in an orbit test, so something like `atol=1e-6` (in m/s) sits comfortably between them.
:::

::: check
Your golden file was made on Linux. On a Mac the regression test fails, and the largest difference anywhere is $4 \times 10^{-16}$ relative. A colleague proposes rounding every output to 6 decimals. What do you say?
:::

::: answer
A relative difference of $4 \times 10^{-16}$ is about two rounding steps of a double: normal differences between math libraries and compilers, not a bug. The fix is an explicit relative tolerance suited to double precision, such as $10^{-9}$ (plus an absolute tolerance for values near zero), not rounding. Rounding to 6 decimals would hide any real change smaller than a micrometer in a position in meters, but, worse, it can still fail when a value sits near a rounding boundary and the two platforms round it different ways.
:::

::: check
Why does `run_case` build its generator from `[base_seed, case_id]` rather than making one generator at the start of the run and drawing from it for every case in turn?
:::

::: answer
With one shared generator, case 428's random numbers depend on how many numbers cases 0 to 427 used before it. Rerunning case 428 alone would give different errors, and so would splitting the 500 cases across several machines, or changing how many numbers one case draws. Building each case's generator from (base seed, case number) makes each case independent of all the others, so any single case can be rebuilt exactly from the recorded base seed.
:::

::: check
Write a `schedule` entry that runs a long propagation job at 01:47 UTC on Saturdays only, and say why 01:47 is a better choice than 02:00.
:::

::: answer
```yaml
on:
  schedule:
    - cron: "47 1 * * 6"
```

The fields are minute 47, hour 1, any day of the month, any month, day of the week 6 (Saturday). GitHub delays scheduled runs at busy times, and the start of the hour is the busiest, so a minute like 47 is less likely to be delayed than 00.
:::

::: check
The nightly job's Monte Carlo finds violations, so the dispersion step exits with code 1. Without `if: always()` on the upload step, what would you lose, and why does that matter most on exactly these nights?
:::

::: answer
A failed step stops the job, and later steps are skipped unless they say otherwise. Without `if: always()` the report would never be uploaded, so the list of failing cases, their altitudes and the base seed would vanish with the runner. Those are the nights the report matters most: it is the only record of which cases failed and the seed needed to rerun them.
:::

## Summary

| Idea | What it means | How you write it |
| --- | --- | --- |
| Golden file | Approved output, committed, changed only on purpose | CSV with `%.17g` digits |
| Tolerance rule | Passes when the error fits | $\lvert a - d \rvert \le \text{atol} + \text{rtol}\,\lvert d \rvert$, measured against the golden value $d$ |
| `assert_allclose` | NumPy's test with that rule | defaults `rtol=1e-07`, `atol=0`, `equal_nan=True`; pass both explicitly |
| Tolerance contract | Per-column `(rtol, atol)` in the test, with units | Chosen between measured noise and the smallest real change |
| Dispersion run | Many cases with random errors | Report percentiles and violations |
| Per-case seed | Reproducible randomness | `np.random.default_rng([base_seed, case_id])` |
| Nightly schedule | Runs on a timetable, in UTC, on the default branch | `on: schedule: - cron: "23 3 * * *"` plus `workflow_dispatch` |
| Report artifact | Evidence that survives the runner | `upload-artifact` with `if: always()` |

The next lesson brings in the tool many GNC teams live in: MATLAB and Simulink, run headless in CI with a license server and Simulink Test.

::: context seventeen-digits Why 17 digits
A double stores about 15 to 17 significant decimal digits. Printing 17 significant digits is always enough to get back the very same double when the text is read in again. Fewer may not be: `1/3` printed with 15 digits and read back is a different double from `1/3`, while with 17 digits it comes back identical. That is why the golden file shows `0.10000000000000001` style numbers: the trailing digits are not noise added by the printout, they pin down exactly which double was stored.
:::

::: context tolerance-contract A tolerance is part of the requirement
Calling the table a contract is a reminder of who it is for. It tells a reviewer, a future teammate or an auditor exactly what "the simulation still agrees" means: this column, to this many parts, in these units. If the tolerance lived in someone's head, or as a loose default buried in a helper function, two people could run the "same" test and mean different things. Many teams also record why each value was chosen, next to the value.
:::

::: context tolerance-window The window between noise and change
On a scale where each step is a factor of ten, the numbers from the example spread out like this. The tolerance has to sit in the empty stretch between the rounding noise and the smallest change anyone would care about.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <line x1="20" y1="76" x2="20" y2="84" stroke="#6c7a93"/><text x="20" y="100">1e-10</text>
    <line x1="100" y1="76" x2="100" y2="84" stroke="#6c7a93"/><text x="100" y="100">1e-7</text>
    <line x1="180" y1="76" x2="180" y2="84" stroke="#6c7a93"/><text x="180" y="100">1e-4</text>
    <line x1="260" y1="76" x2="260" y2="84" stroke="#6c7a93"/><text x="260" y="100">1e-1</text>
    <line x1="340" y1="76" x2="340" y2="84" stroke="#6c7a93"/><text x="340" y="100">100 m</text>
  </g>
  <circle cx="22" cy="80" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="22" y="60" font-size="11" fill="#1f2a44" text-anchor="start">rounding 9e-10</text>
  <rect x="204" y="70" width="4" height="20" fill="#1d6fd1"/>
  <text x="200" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">tolerance 7e-3</text>
  <line x1="206" y1="46" x2="206" y2="68" stroke="#1d6fd1"/>
  <circle cx="214" cy="80" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="236" y="125" font-size="11" fill="#1f2a44" text-anchor="middle">dt change 1.2e-2</text>
  <line x1="214" y1="87" x2="228" y2="114" stroke="#1f2a44"/>
  <circle cx="282" cy="80" r="6" fill="#b4232c" stroke="#1f2a44"/>
  <text x="300" y="60" font-size="11" fill="#b4232c" text-anchor="middle">typo 1.16</text>
  <text x="110" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">six decades of empty space</text>
</svg>
```
:::

::: context prng Numbers that only look random
A computer's random numbers come from a pseudo-random number generator: a formula that turns a starting state, the seed, into a long sequence that passes statistical tests for randomness but is completely determined by the seed. NumPy's `default_rng` uses a generator called PCG64. Giving it a list such as `[20260927, 428]` mixes both numbers into the starting state, so every pair gives its own independent-looking stream. Deterministic "randomness" is exactly what a test campaign needs: random enough to explore, repeatable enough to debug.
:::
