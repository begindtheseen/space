---
id: l04-fixtures
title: Fixtures, scopes, conftest.py, tmp_path and monkeypatch
minutes: 22
covers:
  - Fixtures, scopes, conftest.py, tmp_path, monkeypatch
---

Think about a science class lab. Before each group walks in, somebody sets out clean beakers, a scale that reads zero, and fresh safety goggles. When the group leaves, somebody washes the beakers. Nobody wants to start an experiment in a beaker that still holds the last group's vinegar. And the expensive thing in the room — the one microscope — is not rebuilt for every group. It is set up once in the morning and shared all day.

Tests need the same care. A test of an orbit propagator needs a starting state. A test of a log writer needs an empty folder to write in. A test of liftoff detection needs an accelerometer reading, and the laptop running the test has no accelerometer. That setup is called a **fixture**: the prepared world a test runs in. The word comes from the **[[factory floor|word-fixture]]**, where a fixture is the clamp that holds a part in a known position while it is machined or measured.

pytest has a clean way to build fixtures, share them, clean up after them, and decide how often each one is rebuilt. This lesson covers all of that, plus two fixtures pytest ships ready-made: `tmp_path`, a clean folder, and `monkeypatch`, a way to change the world for one test and have it changed back afterwards. By the end, the tests from the last three lessons will stop repeating their setup, and a GNC test suite with an expensive reference orbit will run in seconds instead of minutes.

## A fixture is setup you ask for by name

Here is the whole idea in one file. A function decorated with `@pytest.fixture` builds something and returns it. A test that wants it lists the fixture's name as a parameter.

```python
import numpy as np
import pytest


@pytest.fixture
def state():
    """A fresh spacecraft state for each test: position (m) and velocity (m/s)."""
    r = np.array([6_778_000.0, 0.0, 0.0])
    v = np.array([0.0, 7_669.0, 0.0])
    return r, v


def test_radius(state):
    r, v = state
    assert np.linalg.norm(r) == pytest.approx(6.778e6)


def test_speed(state):
    r, v = state
    assert np.linalg.norm(v) == pytest.approx(7669.0)
```

(The state is a spacecraft $400\,\mathrm{km}$ up, $6778\,\mathrm{km}$ from Earth's center, moving at the circular orbit speed there, about $7669\,\mathrm{m/s}$.)

You never call `state()` yourself. When pytest collects `test_radius`, it sees a parameter called `state`, finds a fixture with that name, runs it, and passes in whatever it returned. This matching of parameter names to fixtures is pytest's form of **[[dependency injection|name-matching]]**: the test says what it needs, and something else supplies it.

To watch it happen, run with `--setup-show`. It prints each fixture being set up (`SETUP`) and torn down (`TEARDOWN`), with a letter for how often it is built — `F` here, for "function":

```text
$ pytest -q --setup-show test_fixture_basic.py
        SETUP    F state
        test_fixture_basic.py::test_radius (fixtures used: state) .
        TEARDOWN F state
        SETUP    F state
        test_fixture_basic.py::test_speed (fixtures used: state) .
        TEARDOWN F state
2 passed in 0.19s
```

Two tests, two builds. Each test got its own fresh state, so nothing one test did to its arrays can leak into the other.

A fixture can itself ask for other fixtures, the same way. A `vehicle` fixture can take a `mass_model` fixture as a parameter, and a test that asks for `vehicle` gets both built in the right order. pytest works out the order from the names.

::: key
A **fixture** is a function marked `@pytest.fixture`. A test receives it by naming it as a parameter; pytest builds it, passes the result in, and cleans it up afterwards. `pytest --setup-show` shows every setup and teardown.
:::

## Cleaning up with yield

Some setup needs undoing: a simulator process to stop, a file to close, a network port to release. For that, a fixture uses `yield` instead of `return`. Everything before the `yield` is setup. The value after `yield` is handed to the test. Everything after it is **teardown** — the cleanup that runs once the test is over.

```python
import pytest


@pytest.fixture
def sim():
    print("\n  setup: start simulator")
    handle = {"running": True}
    yield handle
    handle["running"] = False
    print("  teardown: stop simulator")


def test_one(sim):
    print("  test body runs")
    assert sim["running"]

# $ pytest -q -s test_yield.py
#   setup: start simulator
#   test body runs
# .  teardown: stop simulator
# 1 passed
```

(The `-s` flag tells pytest to let `print` output through; normally it captures it and only shows it for failing tests.)

The order is always setup, test, teardown — and the teardown runs **[[even if the test fails|yield-timeline]]**. That is the point. If cleanup lived at the bottom of the test body, a failing `assert` would skip it and leave a simulator running for the next test to trip over.

## Scopes: how often a fixture is rebuilt

Back to the lab. The beakers are washed after every group. The microscope is set up once a day. Both are fixtures; they differ in how long one copy lives. In pytest that is the fixture's **scope**, set with `@pytest.fixture(scope=...)`:

- `"function"` — the default. Built fresh for every test that uses it.
- `"class"` — built once for all the tests inside one test class.
- `"module"` — built once per test file (a Python file is a **module**).
- `"session"` — built once for the entire run, and shared by every test that asks for it.

(There is also `"package"`, once per folder of tests, used less often.)

The scopes **[[nest like boxes|scope-ladder]]**: a session holds many modules, a module holds classes and functions, and every test sits inside all of them.

::: key Fixture scopes
Fixture scopes — function, class, module, session — control how often the fixture is built and torn down. A reference orbit that costs ten seconds belongs at session scope; anything mutable that tests could contaminate belongs at function scope.
:::

::: example How many times is it built?
A suite has three test files, each with four tests. Every test asks for three fixtures: one at function scope, one at module scope, one at session scope. How many times is each built?

Here is the check, with a counter in each fixture and a hook that prints the counts when the run ends (`pytest_sessionfinish` is a **hook**, a function pytest calls at a fixed moment if you define it):

```python
# tests/conftest.py
import pytest

builds = {"function": 0, "module": 0, "session": 0}


@pytest.fixture(scope="function")
def f_fix():
    builds["function"] += 1


@pytest.fixture(scope="module")
def m_fix():
    builds["module"] += 1


@pytest.fixture(scope="session")
def s_fix():
    builds["session"] += 1


def pytest_sessionfinish(session):
    print("\nbuilds:", builds)

# Each of tests/test_a.py, test_b.py, test_c.py holds four tests like:
#     def test_0(f_fix, m_fix, s_fix):
#         pass
#
# $ pytest -q -s
# ............
# builds: {'function': 12, 'module': 3, 'session': 1}
# 12 passed
```

**Function scope:** one build per test, $3 \times 4 = 12$.

**Module scope:** one build per file, $3$.

**Session scope:** one build for the whole run, $1$.

Now put a price on it. Say the fixture is a reference orbit that takes $10\,\mathrm{s}$ to integrate at tight tolerance, and $40$ tests use it. At function scope that is $40 \times 10 = 400\,\mathrm{s}$ — almost seven minutes of recomputing the same orbit. At session scope it is $10\,\mathrm{s}$ once. Same tests, same checks, forty times faster.
:::

Here is what that session-scoped orbit looks like in practice. The fixture would normally sit in a shared `conftest.py` file, explained in the next section. It integrates one full period of a $400\,\mathrm{km}$ circular orbit with SciPy's `solve_ivp`, which you met in the SciPy module:

```python
import numpy as np
import pytest
from scipy.integrate import solve_ivp

MU = 3.986e14  # m^3/s^2, Earth


def two_body(t, y):
    r = y[:3]
    return np.concatenate([y[3:], -MU * r / np.linalg.norm(r) ** 3])


@pytest.fixture(scope="session")
def ref_orbit():
    """One period of a 400 km circular orbit, integrated tightly. Built once."""
    r0 = 6_778_000.0
    v0 = np.sqrt(MU / r0)
    period = 2 * np.pi * np.sqrt(r0**3 / MU)
    sol = solve_ivp(two_body, (0.0, period), [r0, 0, 0, 0, v0, 0],
                    rtol=1e-12, atol=1e-6)
    sol.y.flags.writeable = False  # read-only: no test can change it
    return sol


def test_orbit_closes(ref_orbit):
    start, end = ref_orbit.y[:3, 0], ref_orbit.y[:3, -1]
    assert np.linalg.norm(end - start) < 1.0  # m after one period

# With the fixture in tests/conftest.py, this test in test_closure.py,
# and an energy-conservation test in test_energy.py:
# $ pytest -q --setup-show
# SETUP    S ref_orbit
#         test_closure.py::test_orbit_closes (fixtures used: ref_orbit) .
#         test_energy.py::test_energy_constant (fixtures used: ref_orbit) .
# TEARDOWN S ref_orbit
```

The `S` in the output means session scope: one setup, two tests served, one teardown. The period is about $5553\,\mathrm{s}$, a bit over $92$ minutes — the familiar length of a low Earth orbit.

Notice the line that makes the array **[[read-only|read-only-arrays]]**. That line is there because of the one real danger of a wide scope.

::: warning A shared object is shared by everyone
When a fixture lives longer than one test, every test that uses it gets the *same object*. If a test changes it, every later test sees the change.

```python
import pytest


@pytest.fixture(scope="session")
def vehicle():
    return {"dry_mass": 22_000.0, "prop_mass": 410_000.0}  # kg


def test_burnout_mass(vehicle):
    vehicle["prop_mass"] = 0.0          # "burn" all the propellant
    assert vehicle["dry_mass"] + vehicle["prop_mass"] == 22_000.0


def test_liftoff_mass(vehicle):
    assert vehicle["dry_mass"] + vehicle["prop_mass"] == 432_000.0

# $ pytest -q test_shared.py
# .F
# vehicle = {'dry_mass': 22000.0, 'prop_mass': 0.0}
# E       assert (22000.0 + 0.0) == 432000.0
# 1 failed, 1 passed
#
# $ pytest -q test_shared.py::test_liftoff_mass
# .
# 1 passed
```

`test_liftoff_mass` is correct. It fails only because `test_burnout_mass` ran first and emptied the tanks of the shared dictionary. Run it alone and it passes. A failure that depends on which tests ran before is called **[[order-dependent|test-pollution]]**, and it is miserable to chase, because it vanishes the moment you isolate it.

The cure: give wide-scope fixtures only things nobody can change — read-only arrays, tuples, frozen dataclasses. If tests need to modify something, use function scope, or have a function-scoped fixture hand each test its own copy of the expensive session-scoped thing.
:::

## conftest.py: sharing fixtures without imports

So far each fixture sat in the same file as its tests. A real suite has dozens of test files that want the same reference orbit, the same vehicle model, the same fake sensors. Copying them into every file would be a mess, and importing them from a helper file is fragile.

pytest's answer is a file with a fixed name: **conftest.py** (read it "conf-test"). pytest loads it automatically. Every fixture defined in it is available to every test in that folder and in all the folders below it, with no `import` line at all.

```text
tests/
    conftest.py              # ref_orbit, vehicle: seen by every test below
    test_energy.py
    test_closure.py
    guidance/
        conftest.py          # fixtures only the guidance tests need
        test_gravity_turn.py
```

A test in `tests/guidance/` sees the fixtures from both conftest files. A test in `tests/` sees only the top one. If a lower conftest defines a fixture with the same name as a higher one, the **[[closer definition wins|conftest-tree]]** for tests in that folder.

conftest.py is also where suite-wide configuration lives. The `pytest_sessionfinish` hook in the counting example was in a conftest. So are custom command-line options (defined in a hook called `pytest_addoption`) and the registration of custom **markers**, the labels the next lesson is about.

::: key conftest.py
conftest.py holds fixtures and hooks shared by every test in that directory and below, with no import needed. It is also where you register markers and command-line options for the suite.
:::

::: warning Do not import from conftest.py
It is tempting to write `from conftest import MU` in a test file. Do not. conftest files are loaded by pytest in a special way, and two folders can each have one, so the import can pick up the wrong file or break when the suite is run from another folder. Put shared constants and helper functions in your real package, and import them from there.
:::

## tmp_path: a clean folder for every test

Code that writes files is awkward to test. If the test writes into your project folder, it leaves litter, and two tests writing `flight.csv` at once can overwrite each other. If it writes to a fixed spot in `/tmp`, the next run finds the last run's file already there.

pytest ships a fixture for this called `tmp_path`. Ask for it and you get a brand-new, empty folder, unique to that test, as a `pathlib.Path` object (Python's standard way to hold a file path; `/` joins path pieces).

::: example A telemetry log round trip
A small module writes flight telemetry — time in seconds and altitude in meters — to a CSV file, and reads it back. The test checks that what comes back is what went in: a **round trip**.

```python
# telemetry.py
import numpy as np


def save_log(path, t, alt):
    """Write time (s) and altitude (m) as two CSV columns."""
    np.savetxt(path, np.column_stack([t, alt]), delimiter=",", header="t,alt")


def load_log(path):
    data = np.loadtxt(path, delimiter=",")
    return data[:, 0], data[:, 1]
```

```python
# test_telemetry.py
import numpy as np

from telemetry import load_log, save_log


def test_log_round_trip(tmp_path):
    t = np.linspace(0.0, 2.0, 5)
    alt = 100.0 + 50.0 * t
    path = tmp_path / "flight.csv"
    save_log(path, t, alt)
    t2, alt2 = load_log(path)
    print(path)
    np.testing.assert_allclose(t2, t)
    np.testing.assert_allclose(alt2, alt)

# $ pytest -q -s test_telemetry.py
# /tmp/pytest-of-root/pytest-0/test_log_round_trip0/flight.csv
# .
# 1 passed
```

**Step 1.** Five sample times, $0, 0.5, 1.0, 1.5, 2.0\,\mathrm{s}$, and an altitude climbing at $50\,\mathrm{m/s}$ from $100\,\mathrm{m}$, so $100$ to $200\,\mathrm{m}$.

**Step 2.** `tmp_path / "flight.csv"` builds a file path inside the test's private folder. The printed path shows where that is: a folder named after the test, under a per-user, per-run pytest folder.

**Step 3.** Save, load, and compare with `assert_allclose` from the tolerance lesson. The file round trip goes through text, so exact equality would be the wrong promise; closeness is the right one.

Sanity check: the project folder is untouched, and running the test twice cannot collide with itself, because each run gets a new numbered folder.
:::

pytest keeps the temporary folders from the **[[last few runs|tmp-retention]]** so you can open the file a failing test wrote, and it deletes older ones on its own. For a session-scoped fixture that needs a folder, there is a sister fixture, `tmp_path_factory`, whose `mktemp("name")` method makes one folder for the whole session.

## monkeypatch: change the world for one test

Some code reaches out to things a test cannot control. It reads an **[[environment variable|environment-variables]]** to find where logs go. It calls a function that talks to a real sensor. It checks the clock.

The built-in fixture `monkeypatch` lets a test swap those things out, and — this is the important part — puts them back when the test ends, pass or fail. It is function-scoped, so each test's changes are private to that test. The methods you will use most:

- `monkeypatch.setenv("NAME", "value")` and `monkeypatch.delenv("NAME", raising=False)` — set or remove an environment variable.
- `monkeypatch.setattr(obj, "name", new_value)` — replace an attribute, such as a function inside a module.
- `monkeypatch.setitem(mapping, key, value)` — replace one entry of a dictionary, such as a configuration table.

Here is the environment variable case. The function reads `GNC_LOG_DIR` if it is set and falls back to `./logs` otherwise. Each branch gets a test.

```python
import os
from pathlib import Path


def log_dir():
    """Where flight logs live: $GNC_LOG_DIR if set, else ./logs."""
    return Path(os.environ.get("GNC_LOG_DIR", "logs"))


def test_log_dir_from_env(monkeypatch, tmp_path):
    monkeypatch.setenv("GNC_LOG_DIR", str(tmp_path))
    assert log_dir() == tmp_path


def test_log_dir_default(monkeypatch):
    monkeypatch.delenv("GNC_LOG_DIR", raising=False)
    assert str(log_dir()) == "logs"

# 2 passed
```

The second test removes the variable in case your own shell happens to set it; `raising=False` means "do not complain if it was not set." Notice the first test uses two fixtures at once.

::: example Faking an accelerometer for liftoff detection
Flight software declares liftoff when measured acceleration passes a threshold, here $15\,\mathrm{m/s^2}$. The code calls `imu.read_accel()`, which talks to a real inertial measurement unit (IMU) over a serial port. On a laptop it raises an error.

```python
# imu.py
def read_accel():
    """Talk to the real IMU over a serial port. Not available on a laptop."""
    raise RuntimeError("no IMU connected")
```

```python
# liftoff.py
import imu


def liftoff_detected(threshold=15.0):
    """True when measured acceleration (m/s^2) exceeds the threshold."""
    return imu.read_accel() > threshold


def liftoff_detected_v2(read_accel, threshold=15.0):
    """Same logic, with the sensor passed in instead of imported."""
    return read_accel() > threshold
```

```python
# test_liftoff.py
import pytest

import imu
from liftoff import liftoff_detected, liftoff_detected_v2


def test_liftoff_patched(monkeypatch):
    monkeypatch.setattr(imu, "read_accel", lambda: 21.3)
    assert liftoff_detected()


def test_imu_restored():
    with pytest.raises(RuntimeError):
        imu.read_accel()


def test_liftoff_injected():
    assert not liftoff_detected_v2(lambda: 9.81)

# 3 passed
```

**Test 1.** `monkeypatch.setattr` replaces `read_accel` inside the `imu` module with a tiny function (a `lambda`, a one-line function with no name) that always returns $21.3\,\mathrm{m/s^2}$. That is above $15$, so liftoff is detected.

**Test 2.** In the next test the real function is back: calling it raises again. monkeypatch undid its change when test 1 ended.

**Test 3.** Look at `liftoff_detected_v2`. It takes the sensor as a parameter. The test passes in a lambda returning $9.81\,\mathrm{m/s^2}$ — a rocket sitting on the pad, feeling only gravity — and checks that liftoff is *not* declared. No patching needed at all.

Sanity check: $21.3 > 15$ gives `True`, and $9.81 < 15$ gives `False`, both as the physics says.
:::

Test 3 is the lesson hiding in the example. When you find yourself patching, ask why. Usually it is because the code reaches out and grabs a dependency — here, the IMU — instead of being handed it. Code that takes its dependencies as parameters has a **[[seam|seams]]**: a place a test can plug in a stand-in without surgery. The lesson on test doubles builds on exactly this.

::: key monkeypatch
monkeypatch replaces attributes, environment variables or dictionary entries for the duration of one test, undoing them after. Avoid it when the need for patching is telling you the dependency should have been injected as a parameter instead.
:::

::: warning Patch where the name is used, not where it was defined
If `liftoff.py` had said `from imu import read_accel`, then `liftoff` holds its own name `read_accel` pointing at the original function. Patching `imu.read_accel` changes the name in `imu` and leaves `liftoff`'s copy alone — the test still hits the real sensor and raises `RuntimeError`. You would have to patch `liftoff.read_accel` instead. This is one more reason to prefer passing the dependency in.
:::

## Check yourself

::: check
A fixture uses `return` to hand a test an open file. What goes wrong, and how do you fix it?
:::

::: answer
With `return`, the fixture function is finished the moment the test gets the file, so there is no place to close it. The file stays open after the test, and many tests later you can run out of file handles or leave half-written data. Fix it with `yield`: open the file, `yield` it to the test, and close it on the lines after the `yield`. pytest runs those lines after the test, even when the test fails.
:::

::: check
Two test files each contain five tests. All ten ask for a fixture `mass_model` with `scope="module"`. How many times is it built? What if the scope is changed to `"session"`, and what if the scope line is deleted?
:::

::: answer
Module scope builds once per file: $2$ times. Session scope builds once for the run: $1$ time. With the scope line deleted, the default scope is function, so it is built once per test: $10$ times.
:::

::: check
A suite passes when run in full, but one test fails when a teammate runs `pytest tests/test_landing.py` on its own. The tests in that file use a session-scoped `wind_table` fixture. What would you suspect first?
:::

::: answer
The failing test probably depends on a change another test makes to the shared `wind_table`. In the full run, some earlier test (in another file) modifies the table, and `test_landing.py` has come to rely on the modified version without anyone noticing. Run alone, it gets the untouched table and fails. The order of tests is changing the result, which is the symptom of a mutable object at a wide scope. Make the table read-only, or give each test its own copy through a function-scoped fixture, and then fix whichever test was relying on the leak.
:::

::: check
You have a `tests/conftest.py` with a fixture `vehicle`, and a `tests/landing/conftest.py` that also defines `vehicle`. Which one does `tests/landing/test_touchdown.py` get, and which does `tests/test_ascent.py` get?
:::

::: answer
`tests/landing/test_touchdown.py` gets the one in `tests/landing/conftest.py`, because the closer conftest overrides a fixture of the same name. `tests/test_ascent.py` is not inside `landing/`, so it only sees `tests/conftest.py` and gets that one.
:::

::: check
A function `thrust_limit()` reads the environment variable `MAX_THROTTLE` and returns it as a float, defaulting to `1.0`. Write two tests for it: one where the variable is set to `"0.8"`, one where it is absent.
:::

::: answer
```python
def test_throttle_from_env(monkeypatch):
    monkeypatch.setenv("MAX_THROTTLE", "0.8")
    assert thrust_limit() == 0.8


def test_throttle_default(monkeypatch):
    monkeypatch.delenv("MAX_THROTTLE", raising=False)
    assert thrust_limit() == 1.0
```

Environment variables are always strings, so the test sets `"0.8"` and the function must convert it. `raising=False` keeps the second test from failing on a machine where the variable was never set. Both changes are undone when each test ends, so neither test can affect the other or your shell.
:::

## Summary

| Idea | What to remember |
|---|---|
| Fixture | `@pytest.fixture` function; a test names it as a parameter to receive it |
| `yield` fixture | setup before `yield`, value handed over, teardown after — runs even on failure |
| Scopes | function (default), class, module, package, session: how often it is built |
| Scope rule | expensive and unchangeable → session; mutable → function |
| `--setup-show` | prints each SETUP and TEARDOWN with its scope letter |
| conftest.py | shared fixtures and hooks for its folder and below; no import; closest wins |
| `tmp_path` | a new empty folder per test, as a `pathlib.Path` |
| `monkeypatch` | `setenv`, `delenv`, `setattr`, `setitem`, undone after the test |
| Seam | a dependency passed as a parameter needs no patching |

The next lesson turns to the whole suite: labeling tests with markers, picking which ones run with `-k` and `-m`, stopping at the first failure, rerunning only what failed, and keeping the everyday suite fast enough that you run it every few minutes.

::: context word-fixture Borrowed from the machine shop
In manufacturing, a **fixture** is a rigid holder that clamps a part in exactly the same place every time, so a drill or a measuring probe always meets it the same way. Engineers testing electronics use the same word for the rig a circuit board sits in during testing. Software borrowed it with the same meaning: a known, repeatable starting position. If a test's starting world drifts from run to run, its result means nothing, the same way a measurement is worthless if the part was clamped crooked.
:::

::: context name-matching Why names are enough
pytest reads your test function's parameter names before calling it — Python lets a program inspect another function's signature. For each name it looks for a fixture of that name, first in the test's own file, then in the conftest.py files above it, then among built-ins like `tmp_path` and `monkeypatch`. So a typo in the parameter name gives an error, "fixture 'stat' not found", along with a list of the fixtures that do exist. `pytest --fixtures` prints that list any time you want it.
:::

::: context yield-timeline The order is fixed
A fixture with `yield` is a Python **generator**: a function that can pause in the middle and resume later. pytest runs it up to the `yield`, pauses it, runs the test, then resumes it to finish the teardown — whether the test passed, failed or raised.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="12" y1="60" x2="346" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="348,60 338,55 338,65" fill="#1f2a44"/>
  <rect x="20" y="42" width="90" height="36" rx="6" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="65" y="65" font-size="13" fill="#1f2a44" text-anchor="middle">setup</text>
  <rect x="130" y="42" width="90" height="36" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="175" y="65" font-size="13" fill="#1f2a44" text-anchor="middle">test body</text>
  <rect x="240" y="42" width="90" height="36" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="285" y="65" font-size="13" fill="#1f2a44" text-anchor="middle">teardown</text>
  <text x="120" y="30" font-size="12" fill="#1d6fd1" text-anchor="middle">yield hands over</text>
  <line x1="120" y1="34" x2="120" y2="42" stroke="#1d6fd1" stroke-width="2"/>
  <text x="175" y="100" font-size="12" fill="#b4232c" text-anchor="middle">fails here?</text>
  <path d="M 205 96 Q 250 110 280 82" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="283,79 276,82 282,88" fill="#b4232c"/>
  <text x="300" y="104" font-size="12" fill="#b4232c" text-anchor="middle">still runs</text>
</svg>
```
:::

::: context scope-ladder Scopes nest
Every test sits inside a class (or not), inside a file, inside a run. A session-scoped fixture lives in the outermost box and is shared by everything inside it. A function-scoped fixture lives in the innermost box and belongs to one test only.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="8" width="344" height="164" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="18" y="26" font-size="13" fill="#1f2a44" font-weight="700">session: built once per run</text>
  <rect x="22" y="36" width="316" height="124" rx="8" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1"/>
  <text x="32" y="54" font-size="13" fill="#1f2a44">module: once per test file</text>
  <rect x="36" y="64" width="288" height="84" rx="8" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1"/>
  <text x="46" y="82" font-size="13" fill="#1f2a44">class: once per test class</text>
  <rect x="50" y="92" width="124" height="44" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="112" y="119" font-size="12" fill="#1f2a44" text-anchor="middle">function: one test</text>
  <rect x="186" y="92" width="124" height="44" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="248" y="119" font-size="12" fill="#1f2a44" text-anchor="middle">function: one test</text>
</svg>
```
:::

::: context read-only-arrays Locking a NumPy array
Every NumPy array carries a set of flags. Setting `arr.flags.writeable = False` makes any attempt to change an element raise `ValueError: assignment destination is read-only`. For a shared reference orbit, that turns a silent cross-test leak into a loud, immediate error in the test that tried to write. It is cheap insurance for anything at session scope.
:::

::: context test-pollution When order changes the answer
Engineers call a test that changes shared state and breaks a later test a **polluter**, and the broken one a victim. These bugs hide because pytest runs files in a steady order, so the suite looks green for months, until someone runs one file alone, or a new test file sorts earlier. Some teams run their tests in a random order on purpose (a plugin called pytest-randomly does this) to flush such pairs out early.
:::

::: context conftest-tree Which conftest applies
pytest walks from the test file's folder up to the top of the suite, collecting each conftest.py it passes. A fixture name found in a lower folder hides the same name from a higher one, for tests in that lower folder only.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="16" y="24" font-size="13" fill="#1f2a44" font-weight="700">tests/</text>
  <text x="36" y="46" font-size="12" fill="#1d6fd1">conftest.py  (vehicle A)</text>
  <text x="36" y="68" font-size="12" fill="#1f2a44">test_ascent.py</text>
  <text x="200" y="68" font-size="12" fill="#6c7a93">gets vehicle A</text>
  <text x="36" y="90" font-size="13" fill="#1f2a44" font-weight="700">landing/</text>
  <text x="56" y="112" font-size="12" fill="#b4232c">conftest.py  (vehicle B)</text>
  <text x="56" y="134" font-size="12" fill="#1f2a44">test_touchdown.py</text>
  <text x="200" y="134" font-size="12" fill="#6c7a93">gets vehicle B</text>
  <line x1="24" y1="30" x2="24" y2="90" stroke="#6c7a93"/>
  <line x1="44" y1="96" x2="44" y2="134" stroke="#6c7a93"/>
</svg>
```
:::

::: context tmp-retention Where the files go
By default pytest makes a base folder per run under the system's temporary directory, named like `pytest-of-<user>/pytest-<N>`, with one subfolder per test. It keeps the three most recent runs and deletes older ones. Two settings, `tmp_path_retention_count` and `tmp_path_retention_policy`, change that — for example, keeping only the folders of failed tests.
:::

::: context environment-variables Settings that live outside the code
An **environment variable** is a named piece of text that a program inherits from the shell or process that started it, like `HOME` or `PATH`. Build servers and flight-software test rigs use them to say where data lives or which hardware is attached, without editing code. In Python they are read through `os.environ`, a dictionary of strings — so numbers arrive as text and must be converted.
:::

::: context seams The seam in the fabric
The word **seam** comes from Michael Feathers' book *Working Effectively with Legacy Code*: a place where you can change what a program does without editing the code at that spot. A function parameter is the simplest seam there is. In flight software, the sensor interface is the classic one — the same guidance code runs against the real IMU on the vehicle, a simulated IMU in the lab, and a recorded one in tests. The test doubles lesson later in this module is built around it.
:::
