---
id: l05-markers-and-fast-suite
title: Markers, choosing tests, and keeping the suite fast
minutes: 21
covers:
  - Markers, -k, -x, --lf, and keeping the fast suite fast
---

Before you leave the house, you pat your pockets: keys, phone, wallet. It takes two seconds, so you do it every single time. Once a year, the house gets a real inspection — the furnace, the smoke alarms, the roof. That takes a whole afternoon, so it happens rarely. Both checks matter. What would be silly is doing the full inspection every time you walk out the door. You would stop leaving the house, or, more likely, stop checking.

A test suite has the same split. Most tests check one small function in a few milliseconds. A few do something heavy: fly a landing simulation $500$ times with random winds, soak a navigation filter for an hour of simulated flight, or talk to a real flight computer on a lab bench. If every run of `pytest` includes the heavy ones, the run takes minutes, and people stop running it after each change. The bugs that would have been caught in seconds get caught days later, tangled up with other changes.

This lesson is about the pocket-pat. You will label tests with **markers** so the heavy ones can be left out on purpose, choose tests by name with `-k`, stop at the first failure with `-x`, rerun only the failures with `--lf`, and find the tests that are eating your time. The goal is a **fast suite** — the tests you run after every change — that finishes in seconds, alongside a slow suite that runs on a schedule and still gets run.

## Why speed is a feature

A test only helps if you run it. How often you run it depends almost entirely on how long it takes. A suite that finishes in $5\,\mathrm{s}$ gets run after every edit, and a failure points at the three lines you changed a moment ago. A suite that takes $10$ minutes gets run before lunch, and a failure could be in any of the forty things you touched all morning.

That cycle — change the code, run the tests, read the result — is called the **[[feedback loop|feedback-loop]]**. Every second you shave off the fast suite makes the loop tighter. A common goal is for the fast suite to finish in well under a minute on a laptop, and many teams aim for ten seconds or less.

The slow tests are not thrown away. They move to a place where waiting is fine: a **[[nightly run|nightly-ci]]** on a build server, or a check that runs before a pull request is merged. The trick is to make the split explicit, so nobody has to remember which tests are slow.

## Markers: labels on tests

A **marker** is a label you attach to a test with a decorator, `@pytest.mark.<name>`. A marker by itself does nothing. It is a sticky note that pytest, a plugin or your conftest.py can read later and act on.

Some markers come built in, and pytest acts on them directly:

- `@pytest.mark.skip(reason="...")` — do not run this test; report it as skipped.
- `@pytest.mark.skipif(condition, reason="...")` — skip only when the condition is true, for example on the wrong operating system.
- `@pytest.mark.xfail(reason="...", strict=True)` — this test is **expected to fail**, because it describes a known bug or a missing feature. Read "xfail" as "expected fail".
- `@pytest.mark.parametrize(...)` — the table-of-cases marker from the parametrize lesson. Yes, it is a marker too.

Others you invent. A GNC suite typically has a `slow` marker for long runs and something like `hil` for tests that need a **[[hardware-in-the-loop|hil]]** rig — real flight hardware wired to a simulator.

```python
import sys
import time

import pytest


def test_nav_filter_predict():
    assert 2 + 2 == 4


@pytest.mark.slow
def test_nav_filter_long_soak():
    time.sleep(2.0)          # stands in for an hour of simulated flight
    assert True


@pytest.mark.hil
def test_imu_on_rig():
    assert True


@pytest.mark.skipif(sys.platform == "win32", reason="uses POSIX shared memory")
def test_shared_memory_bus():
    assert True
```

The examples in the rest of this lesson use a small suite of two files, `test_guidance.py` and `test_nav.py`, with nine tests in all, including the four above. Two are marked `slow` and one `hil`.

### Register your markers

Custom markers must be **registered**: listed, with a one-line description, in the project's configuration. In `pyproject.toml` that looks like this:

```toml
[tool.pytest.ini_options]
addopts = "--strict-markers"
markers = [
    "slow: takes more than a second; skipped by -m 'not slow'",
    "hil: needs hardware-in-the-loop rig",
]
```

The same registration can live in conftest.py instead, through the `pytest_configure` hook, as you will see at the end of this lesson. The `addopts` line adds `--strict-markers` to every run, which turns any unregistered marker into an error instead of a warning.

::: key Markers
A marker is a label, `@pytest.mark.name`, that pytest or your conftest.py can act on. Built-ins: `skip`, `skipif`, `xfail`, `parametrize`. Register custom markers (such as `slow`) in `pyproject.toml` or conftest.py, and run with `--strict-markers` so a misspelled marker is an error.
:::

::: warning A typo in a marker silently un-marks the test
Suppose someone writes `@pytest.mark.slwo` on a four-second Monte Carlo test. Without strict markers, pytest only warns, and the test is not marked `slow` — so `-m "not slow"` happily runs it:

```text
$ pytest -q -m "not slow" test_typo.py
.
PytestUnknownMarkWarning: Unknown pytest.mark.slwo - is this a typo?
1 passed, 1 warning in 4.12s
```

The fast suite is now four seconds slower, and a warning scrolled past that nobody reads. With `--strict-markers` the same file stops the run:

```text
ERROR collecting tests/test_typo.py
'slwo' not found in `markers` configuration option
1 error in 0.26s
```

Loud and immediate is what you want. Turn strict markers on in every project.
:::

### xfail, strictly

An `xfail` test is a promise: "this fails today, and we know why." Mark it `strict=True`. Then, the day someone fixes the bug and the test starts passing, pytest reports it as a failure, `XPASS(strict)` — an unexpected pass. That forces someone to remove the marker, so the test goes back to guarding the fix. Without `strict`, a surprise pass is only reported quietly, and the marker can sit there for years, hiding whether the test still means anything.

```text
$ pytest -q
FAILED test_x.py::test_hypersonic_drag - [XPASS(strict)] drag table above Mach 5 not yet implemented
```

## Choosing which tests run: -m and -k

pytest gives you two filters on the command line.

**`-m` picks by marker.** It takes a small true-or-false expression built from marker names with `and`, `or`, `not` and parentheses. The everyday fast suite is:

```text
$ pytest -q -m "not slow and not hil"
......
6 passed, 3 deselected in 0.22s
```

**Deselected** means "collected, then left out on purpose" — different from skipped. Nothing ran, nothing was judged. To run only the slow ones, `-m slow`. To see what a filter would pick without running anything, add `--collect-only`:

```text
$ pytest -m slow --collect-only -q
tests/test_guidance.py::test_monte_carlo_landing_dispersion
tests/test_nav.py::test_nav_filter_long_soak

2/9 tests collected (7 deselected) in 0.19s
```

Each of those lines is a **[[node id|node-ids]]**: the file, then `::`, then the test's name. You can pass a node id straight to pytest to run exactly one test, as in `pytest tests/test_nav.py::test_nav_filter_long_soak`.

**`-k` picks by name.** It takes an expression too, but its words are matched as pieces of text against each test's name — and against the names of its folder, its file, its class, its parametrize ids, and any markers on it. So `-k slow` also picks every test marked `slow`.

```text
$ pytest -q -k "throttle"
..
2 passed, 7 deselected in 0.19s
```

That ran `test_throttle_limits` and `test_throttle_floor` and nothing else. Case does not matter: `-k THROTTLE` picks the same two.

This is where the readable ids from the parametrize lesson pay off. If each initial condition in a solver test has an id like `leo-circular` or `gto-high-ecc`, then `-k gto` reruns only the transfer-orbit cases while you debug them.

::: warning -k also matches file names
The words in `-k` are matched against the whole chain of names — folder, file, class, function, id — and against marker names, not only the function name. In a file called `test_nav.py`, every test contains "nav", even `test_imu_on_rig`:

```text
$ pytest -k "nav and not soak" -v
tests/test_nav.py::test_nav_filter_predict PASSED
tests/test_nav.py::test_nav_filter_update PASSED
tests/test_nav.py::test_imu_on_rig PASSED
tests/test_nav.py::test_shared_memory_bus PASSED
4 passed, 5 deselected
```

If you meant only the navigation-filter tests, `-k "nav_filter and not soak"` is sharper. Run with `-v` (verbose) the first time you use a new `-k` expression, so you see exactly what it picked.
:::

::: key Selecting tests
`-m "not slow"` selects by marker; `-k "expr"` selects by matching text in test names, including file and class names, parametrize ids and marker names. Both take `and`, `or`, `not`. Unselected tests are reported as deselected.
:::

## Stopping early and rerunning what failed

When a change breaks things, the first failure is often the most useful one, and the other forty are the same problem echoing through the suite. Three flags help.

- **`-x`** — stop at the first failure. (`--maxfail=3` stops after three.)
- **`--lf`**, "last failed" — run only the tests that failed on the previous run. If nothing failed last time, it runs everything.
- **`--ff`**, "failed first" — run everything, but put last time's failures at the front of the line.

`--lf` and `--ff` work because pytest remembers each run's results in a **[[hidden cache folder|pytest-cache]]** called `.pytest_cache`.

::: example A sign error, found and fixed
Here is a one-line physics function and four tests. The net upward acceleration of a rocket climbing straight up is thrust divided by mass, minus gravity:

$$
a = \frac{T}{m} - g_0, \qquad g_0 = 9.80665\,\mathrm{m/s^2}.
$$

```python
# ascent.py
G0 = 9.80665  # m/s^2


def vertical_accel(thrust, mass):
    """Net upward acceleration (m/s^2) of a rocket going straight up."""
    return thrust / mass - G0
```

```python
# test_ascent.py
import pytest

from ascent import G0, vertical_accel


def test_hover():
    # thrust equal to weight: no net acceleration
    assert vertical_accel(549_000 * G0, 549_000) == pytest.approx(0.0, abs=1e-9)


def test_liftoff():
    assert vertical_accel(7.607e6, 549_000) == pytest.approx(4.049, rel=1e-3)


def test_engine_off():
    assert vertical_accel(0.0, 549_000) == pytest.approx(-G0)


def test_units_not_swapped():
    assert vertical_accel(1.0e3, 1.0) > 0
```

All four pass. Check the liftoff number by hand: $7.607 \times 10^6\,\mathrm{N}$ on $549\,000\,\mathrm{kg}$ is $13.856\,\mathrm{m/s^2}$ of push, minus $9.807$ for gravity, leaves about $4.049\,\mathrm{m/s^2}$ upward. That is less than half a $g$, a gentle climb, which is how big rockets leave the pad.

Now break it on purpose: change `- G0` to `+ G0`. Run with `-x`:

```text
$ pytest -q -x
>       assert vertical_accel(549_000 * G0, 549_000) == pytest.approx(0.0, abs=1e-9)
E       assert 19.6133 == 0.0 ± 1.0e-09
FAILED test_ascent.py::test_hover - assert 19.6133 == 0.0 ± 1.0e-09
!!!!!!!!!!!!!!!!!!!!!!!!!! stopping after 1 failures !!!!!!!!!!!!!!!!!!!!!!!!!!!
1 failed in 0.12s
```

**Read the number.** At hover the answer should be $0$, and it came out $19.6133 = 2 \times 9.80665$. Twice gravity, pointing the wrong way: exactly what a flipped sign on $g_0$ would do. The failure message points at the cause.

**See the whole damage.** Without `-x`, three of the four fail:

```text
FAILED test_ascent.py::test_hover - assert 19.6133 == 0.0 ± 1.0e-09
FAILED test_ascent.py::test_liftoff - assert 23.662752003642986 == 4.049 ± 0....
FAILED test_ascent.py::test_engine_off - assert 9.80665 == -9.80665 ± 9.8e-06
3 failed, 1 passed in 0.13s
```

**Fix and rerun only the failures.** Put `- G0` back and run `--lf`:

```text
$ pytest --lf
collected 3 items
run-last-failure: rerun previous 3 failures
test_ascent.py ...                                     [100%]
3 passed in 0.12s
```

pytest collected only the three that failed before. Run `--lf` once more and, with nothing left over from last time, it runs all four.

Sanity check on the test that never failed: `test_units_not_swapped` passed with the sign flipped, because $1000/1 + 9.8$ is still positive. It is a weak test — it cannot tell a right formula from a wrong one. The injected bug told you that too.
:::

That last point is the reason to break code on purpose. A suite that has never failed has never proved it *can* fail. Flip a sign, swap two arguments, or delete a line, and watch: does the suite go red, and does the message point at the cause? Then undo the change. This is a manual version of **[[mutation testing|mutation-testing]]**, and a fast suite is what makes it cheap enough to do often.

::: key Break it on purpose
A deliberately injected sign error belongs in your workflow because it is the only way to know your tests can fail. Flip a sign, confirm the suite goes red and that the failure message points at the cause, then revert. A suite that never fails is measuring nothing.
:::

## Keeping the fast suite fast

Suites get slow a little at a time. Nobody adds a ten-minute test. People add a dozen tests that take half a second each, and a fixture that quietly rebuilds a lookup table for every test. The first step is to measure.

`--durations=N` lists the $N$ slowest steps of the run — each test's setup, call and teardown are timed separately.

::: example Where did the time go?
A suite of nine tests takes $5.20\,\mathrm{s}$. Ask for the three slowest steps:

```text
$ pytest -q --durations=3
.........
============================= slowest 3 durations ==============================
3.00s call     tests/test_guidance.py::test_monte_carlo_landing_dispersion
2.00s call     tests/test_nav.py::test_nav_filter_long_soak
9 passed in 5.20s
```

**Add up the top two:** $3.00 + 2.00 = 5.00\,\mathrm{s}$.

**Compare with the total:** $5.00 / 5.20 \approx 0.96$. Two tests out of nine take about $96\%$ of the run time. The other seven, plus the time pytest spends starting up and collecting, share the remaining $0.20\,\mathrm{s}$.

**Act on it.** Mark those two `slow`. The fast suite, `-m "not slow and not hil"`, then finishes in $0.22\,\mathrm{s}$ — more than twenty times faster, and it still runs every other test.

Sanity check: this is the usual shape. Test time is almost never spread evenly. A handful of tests take most of it, so a few markers buy most of the speed.
:::

Once you have found the slow tests, you have a few moves, roughly in order of preference:

1. **Share expensive setup.** If the time is in building a reference orbit or loading an aero table, a session-scoped fixture (last lesson) builds it once. The `setup` lines in `--durations` show this kind of cost.
2. **Shrink the problem, keep the logic.** A test that a guidance law steers toward the target does not need a full $600\,\mathrm{s}$ ascent. Ten seconds of simulated flight, or a coarse grid instead of a fine one, runs the same code paths. Save full length for the slow suite.
3. **Never sleep.** A test that waits with `time.sleep` for something to happen is slow and flaky at once. Fake the clock instead, or pass the time in as a parameter.
4. **Mark what is left** as `slow` (or `hil`) and make sure a scheduled job runs it. A slow test nobody runs is worse than none: it looks like protection.

Done this way, the suite ends up shaped like a **[[pyramid|test-pyramid]]**: many tests that take milliseconds, and a few heavy ones at the top that run on a schedule.

Some teams also run the fast suite across several CPU cores with a plugin called pytest-xdist. That helps, but it hides slowness instead of removing it, so measure first.

::: key The fast suite
The fast suite is what you run after every change: `-m "not slow"` (and not `hil`), aiming for seconds. Find the slow tests with `--durations=N`, cut their cost with shared fixtures and smaller problems, and mark the rest `slow` for a scheduled run.
:::

### Slow tests off by default

Typing `-m "not slow"` every time gets old, and a newcomer running plain `pytest` will sit through the slow suite. A common pattern flips the default: slow tests are skipped unless you pass a `--runslow` option. It lives in the top-level conftest.py and uses three hooks — one to add the option, one to register the marker, and one to skip marked tests after collection.

```python
# conftest.py
import pytest


def pytest_addoption(parser):
    parser.addoption("--runslow", action="store_true", help="also run tests marked slow")


def pytest_configure(config):
    config.addinivalue_line("markers", "slow: long-running; needs --runslow")


def pytest_collection_modifyitems(config, items):
    if config.getoption("--runslow"):
        return
    skip_slow = pytest.mark.skip(reason="slow: add --runslow to run")
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(skip_slow)
```

With one fast test, one slow test and one strict `xfail` test in the folder:

```text
$ pytest -q -rs
.sx
SKIPPED [1] test_x.py:8: slow: add --runslow to run
1 passed, 1 skipped, 1 xfailed in 0.12s

$ pytest -q --runslow
..x
2 passed, 1 xfailed in 0.12s
```

In the progress line, `.` is a pass, `s` a skip, `x` an expected failure. The `-rs` flag asks for the reasons behind skips in the summary, so nobody forgets the slow test exists. The nightly job runs `pytest --runslow`.

## Check yourself

::: check
Your team's suite takes eight minutes. What would you do first, and why that before anything else?
:::

::: answer
Measure: run `pytest --durations=20` to see which tests and fixture setups take the time. Test time is almost always concentrated in a few places, so the list tells you where a change pays off. Without it you would be guessing — you might speed up a hundred fast tests and save seconds while one fixture rebuilt per test is costing minutes. After measuring: move expensive setup to a wider-scoped fixture, shrink problems where the code path stays the same, and mark what remains `slow` for a scheduled run.
:::

::: check
What is the difference between a test reported as **skipped** and one reported as **deselected**?
:::

::: answer
A skipped test was selected to run, but a `skip` or `skipif` marker (or a call to `pytest.skip()`) told pytest not to execute it; it appears as `s` and counts in the summary as skipped. A deselected test was filtered out before running by `-m` or `-k`; pytest collected it and set it aside without judging it at all. Skipping is a decision written in the code; deselecting is a choice made on the command line for this run.
:::

::: check
A test is marked `@pytest.mark.xfail(reason="gimbal limit not enforced yet")` without `strict=True`. A teammate fixes the gimbal limit. What does pytest report for this test, and why is `strict=True` better?
:::

::: answer
Without `strict`, the now-passing test is reported as `XPASS` (unexpectedly passing), which does not fail the run and is easy to miss. The marker stays on forever, and if the gimbal limit later breaks again, the test fails "as expected" and nobody hears about it — the regression hides behind the `xfail`. With `strict=True`, the unexpected pass fails the run, so the teammate has to remove the marker right away, and from then on the test guards the fix.
:::

::: check
Your parametrized test of an attitude controller has ids like `roll-small`, `roll-large`, `pitch-small`, `pitch-large`, `yaw-small`. Write a `-k` expression that runs the large-angle cases except yaw, and one that runs every case except roll ones.
:::

::: answer
Large-angle but not yaw: `pytest -k "large and not yaw"`. That picks `roll-large` and `pitch-large`.

Everything but roll: `pytest -k "not roll"`. That picks the three pitch and yaw cases.

A word of care: `-k` also matches the file and function names. If the file were called `test_roll_pitch_yaw.py`, every test would contain "roll" and "yaw", so both expressions would pick nothing at all. Run with `-v` to confirm what was chosen.
:::

::: check
You change a quaternion normalization and run the suite: $37$ failures. You fix one bug. Which flags would you use for the next run, and what does each buy you?
:::

::: answer
`pytest --lf -x`. `--lf` reruns only the $37$ tests that failed, skipping the hundreds that already passed, so the loop is fast. `-x` stops at the first one still failing, so you read one fresh failure at a time instead of a wall of them. When `--lf` finally passes, run the whole fast suite once more to be sure the fix did not break something that was passing before. (`--ff` is the alternative when you want the full run with the old failures first.)
:::

## Summary

| Tool | What it does |
|---|---|
| `@pytest.mark.name` | attaches a label to a test |
| `skip`, `skipif`, `xfail(strict=True)` | built-in markers pytest acts on |
| `markers = [...]`, `--strict-markers` | register custom markers; typos become errors |
| `-m "not slow"` | select by marker expression |
| `-k "expr"` | select by text in names, including files and ids |
| `--collect-only`, `-v` | see what a filter picks |
| `-x`, `--maxfail=N` | stop at the first (or $N$th) failure |
| `--lf`, `--ff` | rerun last failures only, or run them first |
| `--durations=N` | list the $N$ slowest steps |
| `pytest_addoption` + `--runslow` | slow tests off by default, on in the nightly run |
| Injected bug | proves the suite can fail and that its messages point at the cause |

The next lesson changes what a test checks. Instead of a handful of hand-picked examples, Hypothesis generates hundreds of inputs and checks that a rule — an invariant — holds for every one of them, and when it finds a failure it shrinks it to the smallest input that still breaks.

::: context feedback-loop The loop that matters
Change the code, run the tests, read the result, change again. The shorter each trip around this loop, the more trips you make, and each trip catches mistakes while they are still small and fresh in your head.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="85" r="58" fill="none" stroke="#8fb8f0" stroke-width="6"/>
  <polygon points="238,80 244,94 230,92" fill="#1d6fd1"/>
  <polygon points="122,90 116,76 130,78" fill="#1d6fd1"/>
  <polygon points="175,27 189,21 187,35" fill="#1d6fd1"/>
  <rect x="130" y="4" width="100" height="26" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="22" font-size="13" fill="#1f2a44" text-anchor="middle">edit code</text>
  <rect x="244" y="100" width="104" height="26" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="296" y="118" font-size="13" fill="#1f2a44" text-anchor="middle">run fast suite</text>
  <rect x="12" y="100" width="104" height="26" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="64" y="118" font-size="13" fill="#1f2a44" text-anchor="middle">read result</text>
  <text x="180" y="90" font-size="13" fill="#b4232c" text-anchor="middle">seconds</text>
  <text x="180" y="162" font-size="12" fill="#6c7a93" text-anchor="middle">slow suite: nightly, outside the loop</text>
</svg>
```
:::

::: context nightly-ci Where the slow suite runs
In the git collaboration module you met continuous integration (CI): a build server that runs the tests on every pull request. The same servers can run jobs on a timer. A typical GNC project runs the fast suite on every push, the `slow` tests every night, and the hardware-in-the-loop tests on the rig a few times a week. If the nightly job goes red, whoever merged that day gets a message the next morning.
:::

::: context hil Real hardware, simulated world
In **hardware-in-the-loop** (HIL) testing, the real flight computer, or a real sensor or actuator, is wired to a computer that simulates everything else: the vehicle's motion, the atmosphere, the other sensors. The flight software cannot tell it is not flying. Rigs like this are few and shared by a whole team, so HIL tests are marked and run on the rig on a schedule, never in someone's everyday laptop run.
:::

::: context node-ids An address for every test
A **node id** is a test's full address: the file path, then `::`, then the class name if there is one, then the function name, then the parametrize id in square brackets, as in `tests/test_orbit.py::TestKepler::test_period[gto-high-ecc]`. pytest prints node ids in failure reports, and you can paste one back on the command line to rerun exactly that case.
:::

::: context pytest-cache Where pytest remembers
pytest writes a folder called `.pytest_cache` next to your tests, holding the ids of last run's failures and other small bits of state. That is what `--lf` and `--ff` read. It is safe to delete (you only lose that memory), and it belongs in `.gitignore`, because it describes your machine's last run, not the project. `pytest --cache-clear` empties it at the start of a run.
:::

::: context mutation-testing Testing the tests
**Mutation testing** automates the injected bug. A tool makes hundreds of small changes to your code — flip a `<` to `<=`, a `+` to `-`, a constant to zero — runs the suite against each changed version (each **mutant**), and reports every mutant that survived with all tests still green. Each survivor points at behavior no test checks. Python tools for this include mutmut and cosmic-ray. It is slow, since it runs the suite once per mutant — one more reason a fast suite matters.
:::

::: context test-pyramid Many fast, few slow
A healthy suite is shaped like a pyramid: a wide base of small, fast unit tests; fewer tests that run several parts together; and a narrow top of slow, full-system tests such as long Monte Carlo campaigns and hardware-in-the-loop runs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="180,12 236,62 124,62" fill="#f2b880" stroke="#1f2a44"/>
  <polygon points="124,62 236,62 290,112 70,112" fill="#8fb8f0" stroke="#1f2a44"/>
  <polygon points="70,112 290,112 344,160 16,160" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">HIL, MC</text>
  <text x="180" y="92" font-size="12" fill="#1f2a44" text-anchor="middle">integration</text>
  <text x="180" y="142" font-size="12" fill="#1f2a44" text-anchor="middle">unit tests: milliseconds each</text>
  <text x="300" y="40" font-size="12" fill="#b4232c">slow, few</text>
  <text x="14" y="100" font-size="12" fill="#1d6fd1">fast, many</text>
</svg>
```
:::
