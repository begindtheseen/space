---
id: l09-test-doubles
title: Fakes and mocks for sensors and hardware
minutes: 21
covers:
  - 'Test doubles: fakes and mocks for sensors and hardware interfaces'
---

When a movie needs an actor to fall off a building, the actor does not fall off the building. A **[[stunt double|stunt-double]]** does — someone dressed the same, moving the same way, standing in for the real person in the one scene where the real person would be too slow, too expensive or too breakable. The audience sees the same scene either way.

Flight software has the same problem, all the time. The code that decides when to deploy a parachute reads an altimeter. The code that pressurizes a propellant tank opens and closes a valve. You want to test that code on your laptop, hundreds of times a day, in a fraction of a second. You cannot put a barometric altimeter on your laptop, you certainly cannot fly it through apogee a hundred times, and nobody will let a unit test cycle a real valve. Often the hardware does not even exist yet: the avionics board arrives in six months, and the software has to be ready before it.

So you test with stand-ins. A **test double** is any object that takes the place of a real dependency during a test — a fake altimeter, a pretend valve. This lesson covers the two you will use most: **fakes**, which behave like the real thing, and **mocks**, which record how your code talked to them. It also covers the design that makes both possible, and the habits that keep a stand-in honest.

## First, a seam

A stand-in is only useful if you can slide it in. In the fixtures lesson you met the **seam**: a place where a test can change what a program does without editing it. The simplest seam is a function parameter. Compare two versions of an apogee detector:

```python
# Sketch: BaroAltimeter stands for the real flight driver.
# Hard-wired: the detector builds its own sensor
class ApogeeDetector:
    def __init__(self):
        self.altimeter = BaroAltimeter(port="/dev/ttyUSB0")


# Injected: the detector is handed a sensor
class ApogeeDetector:
    def __init__(self, altimeter):
        self.altimeter = altimeter
```

The first version reaches out and grabs a specific piece of hardware. To test it without that hardware you would have to patch the class inside the module, as `monkeypatch` did in the fixtures lesson — surgery on the code from outside. The second version is handed whatever it needs. On the vehicle you hand it the real driver; in a test you hand it a fake. Nothing needs patching. Passing dependencies in like this is called **dependency injection**, and it is the single design choice that makes hardware code testable.

The detector does not care *what* it is handed, only that the object has a `read()` method returning altitude in meters. That promise is the **interface**. Python lets you write it down with `typing.Protocol`:

```python
from typing import Protocol


class Altimeter(Protocol):
    def read(self) -> float:
        """Altitude above the launch pad, in meters."""
        ...
```

A **[[Protocol|protocol-class]]** is a description of the methods an object must have. The real driver, the fake and any recorded-data player each provide a `read()` that returns meters, so each of them *is* an `Altimeter` as far as the detector knows. They never need to inherit from anything. Type checkers such as mypy, from the linters lesson, check that every object you pass in keeps the promise.

Write the units and sign convention into the interface's docstring. "Altitude above the pad, meters" is part of the contract, as much as the method name is.

::: key
A seam at the interface — the dependency passed in as a parameter, with its behavior written down as a Protocol — lets you test logic now against a stand-in and swap the real driver in later. If you find yourself reaching for `monkeypatch` to replace hardware, the dependency probably should have been injected instead.
:::

## A zoo of stand-ins

Test doubles come in several kinds. The names come from Gerard Meszaros's book *xUnit Test Patterns*, and they are worth knowing because teams argue in them.

- A **dummy** fills a parameter the test never uses. Passing `None` for a logger is a dummy.
- A **stub** returns canned answers: "whenever you are asked for pressure, say $3.2\,\mathrm{MPa}$." It has no logic.
- A **fake** has a real, working, simplified implementation. A fake altimeter computes a trajectory and adds noise. A fake file system keeps files in a dictionary.
- A **spy** is a stub that also records how it was called, so the test can inspect the calls afterward.
- A **mock** is set up to know what calls to expect, and the test checks that those calls happened. In Python, `unittest.mock` objects are spies and mocks at once.

For hardware code, the two you need are fakes (to feed your code realistic inputs) and mocks (to check the commands your code sends out). Sensors are mostly *inputs*, so they tend to get fakes. Actuators — valves, igniters, reaction wheels — are mostly *outputs*, so they tend to get mocks.

## Fakes: a sensor you can fly on a laptop

A good fake sensor does what the real one does, in the ways that matter to the code under test: it returns the right quantity, in the right units, at the right rate, with realistic noise. Here is a fake barometric altimeter for a rocket coasting upward after burnout. It plays back the ballistic path $h(t) = h_0 + v_0 t - \tfrac{1}{2} g_0 t^2$ (read $g_0$ as "g nought", standard gravity) sampled at $20\,\mathrm{Hz}$, and adds **[[Gaussian noise|gaussian-noise]]** — random errors in the familiar bell-curve shape — with standard deviation $\sigma$ ("sigma"), the typical size of one error.

```python
import numpy as np

G0 = 9.80665


class FakeAltimeter:
    """Plays back a coasting trajectory, sampled at `rate` Hz, with
    Gaussian noise of `sigma` meters from a seeded generator."""

    def __init__(self, h0=1000.0, v0=200.0, rate=20.0, sigma=2.0, seed=0):
        self.h0, self.v0, self.dt = h0, v0, 1.0 / rate
        self.sigma = sigma
        self.rng = np.random.default_rng(seed)
        self.n = 0

    @property
    def t(self):
        return self.n * self.dt

    def read(self) -> float:
        t = self.t
        self.n += 1
        h = self.h0 + self.v0 * t - 0.5 * G0 * t**2
        return h + self.sigma * self.rng.normal()
```

Each call to `read()` returns the next sample, exactly as a real sensor polled at $20\,\mathrm{Hz}$ would. The `seed` makes the noise repeatable, so a failing test fails the same way every time.

```python
alt = FakeAltimeter(sigma=2.0, seed=0)
print([round(alt.read(), 2) for _ in range(3)])   # [1000.25, 1009.72, 1021.23]
```

The true heights at $0$, $0.05$ and $0.10\,\mathrm{s}$ are $1000.00$, $1009.99$ and $1019.95\,\mathrm{m}$; the rest is noise of a meter or two.

The detector it will feed declares apogee once the altitude has fallen $10\,\mathrm{m}$ below the highest reading so far, on three readings in a row. The margin and the confirmation count are there so that one noisy reading cannot trigger a parachute:

```python
class ApogeeDetector:
    def __init__(self, altimeter: Altimeter, drop=10.0, confirm=3):
        self.altimeter = altimeter
        self.drop = drop
        self.confirm = confirm
        self.peak = float("-inf")
        self.count = 0
        self.fired = False

    def update(self) -> bool:
        h = self.altimeter.read()
        self.peak = max(self.peak, h)
        self.count = self.count + 1 if h < self.peak - self.drop else 0
        if self.count >= self.confirm and not self.fired:
            self.fired = True
            return True
        return False
```

::: example Testing an apogee detector against a fake altimeter
**The physics.** With $h_0 = 1000\,\mathrm{m}$ and $v_0 = 200\,\mathrm{m/s}$, the rocket stops climbing when its speed is used up: $t_{\text{apo}} = v_0 / g_0 = 200 / 9.80665 = 20.39\,\mathrm{s}$. It peaks at $h_0 + v_0^2 / (2 g_0) = 1000 + 2039 = 3039\,\mathrm{m}$.

**What the detector should do.** Falling $10\,\mathrm{m}$ from rest takes $\sqrt{2 \times 10 / 9.80665} = 1.43\,\mathrm{s}$. With noise, the first reading $10\,\mathrm{m}$ below the peak comes a little earlier or later, and three confirmations add $0.1\,\mathrm{s}$. So a sensible requirement is: fire after the true apogee, and within $2.5\,\mathrm{s}$ of it. Fire exactly once.

**The tests.** Parametrize over 20 noise seeds, so the detector meets 20 different noisy flights:

```python
import pytest

from fakes import FakeAltimeter, G0
from flight import ApogeeDetector

T_APOGEE = 200.0 / G0          # s, when v0 = 200 m/s has been used up


def fly(detector, altimeter, t_max=40.0):
    """Run the detector until it fires; return the time of that reading."""
    while altimeter.t < t_max:
        t = altimeter.t
        if detector.update():
            return t
    return None


@pytest.mark.parametrize("seed", range(20))
def test_apogee_detected_soon_after_the_real_one(seed):
    alt = FakeAltimeter(sigma=2.0, seed=seed)
    t_fire = fly(ApogeeDetector(alt), alt)
    assert t_fire is not None
    assert T_APOGEE < t_fire < T_APOGEE + 2.5


def test_fires_only_once():
    alt = FakeAltimeter()
    det = ApogeeDetector(alt)
    fired = [det.update() for _ in range(800)]      # 40 s at 20 Hz
    assert fired.count(True) == 1
```

```text
$ pytest -q tests/test_apogee.py
.....................                                                    [100%]
21 passed in 0.22s
```

Forty simulated seconds of flight, twenty times over, in under a quarter of a second. Across the 20 seeds, the detector fired between $21.45$ and $21.85\,\mathrm{s}$, that is $1.06$ to $1.46\,\mathrm{s}$ after the true apogee, which matches the $1.43\,\mathrm{s}$ estimate.

**Now make the fake honest about the sensor.** Suppose the real altimeter's datasheet says its noise is $\sigma = 5\,\mathrm{m}$, not $2$. Change one number in the fake and rerun:

```text
$ pytest -q tests/test_apogee.py
..F.F.F...FF.FF..FF..                                                    [100%]
...
>       assert T_APOGEE < t_fire < T_APOGEE + 2.5
E       assert 20.394324259558566 < 19.8
...
9 failed, 12 passed in 0.24s
```

Nine of twenty flights deploy the parachute *before* apogee, one of them at $15.3\,\mathrm{s}$ — five seconds early, while the rocket is still climbing at about $50\,\mathrm{m/s}$. The cause is in the detector: `peak` is the largest *noisy* reading, so one high spike raises it, and the ordinary readings after it look like a $10\,\mathrm{m}$ drop. The fake found a design flaw that would have shown up for the first time in flight. The fix — smoothing the readings, or requiring the fall to last longer — can now be tested the same way, in seconds.
:::

::: warning A fake is only as good as its resemblance
The detector passed with $\sigma = 2\,\mathrm{m}$ and failed with $\sigma = 5\,\mathrm{m}$. A fake with less noise than the real sensor, a smoother trajectory, a faster sample rate, or no dropouts will tell you your code works when it does not. Build fakes from the sensor's datasheet — noise, rate, range, resolution, failure modes — and put those numbers in the fake's docstring.
:::

## Mocks: checking the commands your code sends

Sensors feed your code. Actuators are the other direction: your code *commands* them, and the thing you need to test is the command. Did the controller open the valve when the pressure fell too low? Did it close it once, not twice? Did it do nothing when nothing needed doing?

Here the useful stand-in records calls. Python's `unittest.mock` module provides this. A `Mock` object accepts any method call and remembers it; after the test, `mock.method_calls` is the list of calls made, in order, and `call.open()` is how you write "a call to `open` with no arguments" when comparing.

The code under test is a simple **bang-bang** pressurization controller — one that is either fully on or fully off, like a household thermostat. It opens the pressurant valve when the tank falls below $3.0\,\mathrm{MPa}$ (megapascals, millions of pascals) and closes it above $3.4\,\mathrm{MPa}$. Between the two it leaves the valve alone; that gap, called **[[hysteresis|hysteresis]]**, stops it from chattering open and shut. If the pressure sensor stops answering, it closes the valve, because pressurizing blind could burst the tank.

```python
class Valve(Protocol):
    def open(self) -> None: ...
    def close(self) -> None: ...


class PressureSensor(Protocol):
    def read(self) -> float:
        """Tank pressure in pascals."""
        ...


class PressController:
    """Bang-bang tank pressurization: open below `low`, close above `high`."""

    def __init__(self, valve: Valve, sensor: PressureSensor, low=3.0e6, high=3.4e6):
        self.valve, self.sensor = valve, sensor
        self.low, self.high = low, high
        self.is_open = False

    def step(self) -> None:
        try:
            p = self.sensor.read()
        except TimeoutError:
            if self.is_open:            # fail safe: stop pressurizing
                self.valve.close()
                self.is_open = False
            return
        if p < self.low and not self.is_open:
            self.valve.open()
            self.is_open = True
        elif p > self.high and self.is_open:
            self.valve.close()
            self.is_open = False
```

::: example Mocking a valve and scripting a sensor
The tests build both doubles with `create_autospec`, which makes a mock shaped exactly like the given class: it has `open` and `close` and nothing else. The sensor's `read` gets a **[[side effect|side-effect]]**: a list of values handed out one per call. An exception in that list is raised instead of returned, which is how you script a sensor that stops answering.

```python
from unittest.mock import call, create_autospec

from flight import PressController, PressureSensor, Valve


def make(readings):
    valve = create_autospec(Valve, instance=True)
    sensor = create_autospec(PressureSensor, instance=True)
    sensor.read.side_effect = readings          # one value per call
    return PressController(valve, sensor), valve


def test_opens_below_low_and_closes_above_high():
    ctrl, valve = make([3.2e6, 2.9e6, 3.0e6, 3.3e6, 3.5e6, 3.45e6])
    for _ in range(6):
        ctrl.step()
    assert valve.method_calls == [call.open(), call.close()]


def test_sensor_timeout_closes_an_open_valve():
    ctrl, valve = make([2.9e6, TimeoutError("no reply from sensor")])
    ctrl.step()
    ctrl.step()
    assert valve.method_calls == [call.open(), call.close()]
```

Walk through the first test's six readings, in megapascals:

1. $3.2$: inside the band, valve closed. Nothing.
2. $2.9$: below $3.0$. **Open.**
3. $3.0$: not *below* $3.0$, and the valve is already open anyway. Nothing.
4. $3.3$: inside the band. Nothing — the valve stays open and the tank keeps filling.
5. $3.5$: above $3.4$. **Close.**
6. $3.45$: still above $3.4$, but already closed. Nothing.

So the valve must see exactly one `open` and then one `close`. The second test opens the valve at $2.9\,\mathrm{MPa}$ and then has the sensor time out; the controller must close it.

Both pass. Now inject a bug: drop the `and self.is_open` check, so the controller closes whenever pressure is high, whether or not the valve is open:

```text
$ pytest -q tests/test_press.py
F.                                                                       [100%]
...
>       assert valve.method_calls == [call.open(), call.close()]
E       assert [call.open(),... call.close()] == [call.open(), call.close()]
E
E         Left contains one more item: call.close()
...
1 failed, 1 passed in 0.15s
```

At reading 6 ($3.45\,\mathrm{MPa}$) the broken controller sent a second `close`. On a real valve, repeated commands can wear a solenoid or, in some drivers, fault. The mock caught a behavior no return value would have shown, because `step()` returns nothing at all.
:::

::: warning A plain Mock agrees with everything
A bare `Mock()` accepts any attribute. Misspell a method in the code under test and the test still passes:

```python
from unittest.mock import Mock, create_autospec

from flight import Valve

v = Mock()
v.opne()                   # typo: silently accepted
print(v.method_calls)      # [call.opne()]

v2 = create_autospec(Valve, instance=True)
v2.opne()                  # AttributeError: Mock object has no attribute 'opne'
```

With a plain `Mock`, the code "opens" a valve method that does not exist, and the real driver would crash on the vehicle. Always build mocks with `create_autospec` (or `Mock(spec=Valve)`) so they reject calls the real interface would reject.
:::

## Keeping stand-ins honest

A test double is a claim: "the real thing behaves like this." Claims drift. The driver team changes `read()` to return feet, or adds a warm-up period during which it returns `nan`, and the fake never hears about it. Every test still passes, and every test is now wrong. Three habits guard against that.

### Contract tests

A **contract test** is one test that runs against *both* the fake and the real implementation, checking the promises in the interface. With a parametrized fixture, the same test runs twice: once with the fake, everywhere, and once with the real driver, only on the hardware rig. The `hil` marker from the markers lesson — for **[[hardware-in-the-loop|hil-rig]]** — keeps the real case out of the laptop suite:

```python
import math

import pytest

from fakes import FakeAltimeter


@pytest.fixture(params=["fake", pytest.param("real", marks=pytest.mark.hil)])
def altimeter(request):
    if request.param == "fake":
        return FakeAltimeter(h0=0.0, v0=0.0)        # sitting on the pad
    drivers = pytest.importorskip("avionics.drivers")   # only on the rig
    return drivers.BaroAltimeter(port="/dev/ttyUSB0")


def test_reads_a_float_in_meters_near_zero_on_the_pad(altimeter):
    h = altimeter.read()
    assert isinstance(h, float) and math.isfinite(h)
    assert abs(h) < 20.0      # meters, not feet, not pascals
```

```text
$ pytest -q -rs tests/test_altimeter_contract.py
SKIPPED [1] tests/test_altimeter_contract.py:16: could not import 'avionics.drivers': No module named 'avionics'
1 passed, 1 skipped in 0.19s
```

On a laptop the real case skips with a clear reason. On the rig it runs, and if the driver ever returns something the fake does not — feet, pascals, an integer count, `nan` — the contract test on the rig goes red. (The first draft of this very test built the fake with the default `h0 = 1000.0`, and it failed: the contract caught a fake that was not on the pad.) Units deserve special suspicion: a **[[units mismatch|units-mismatch]]** between two pieces of software has cost a real spacecraft.

### Replay recorded data

Fakes are models, and models leave things out. Real sensors glitch, saturate, drop samples and drift with temperature. So keep a folder of **recorded data** from real tests — a drop test, a static fire, a previous flight — and write a small player that implements the same `read()` by stepping through the recording. Then run the same detector tests against it. A detector that passes against your fake and fails against last summer's flight log has taught you something about your fake.

### Test behavior, not choreography

A mock can check *everything*: every call, every argument, the exact order. That is a trap. If a test asserts that the controller called `sensor.read()` exactly six times, a harmless change — reading twice to average out noise — breaks the test without breaking anything real. Check the outcomes that matter to the system: the valve opened and closed at the right pressures, the parachute fired once after apogee. Leave the rest free.

::: warning Mocking what you do not own
Mocking a third-party library in detail — the exact sequence of calls to a serial-port package, say — ties your tests to your guess about how that library works. When the guess is wrong, the mock agrees with your wrong guess and the tests pass. Better: wrap the library in a thin driver class you own, mock *that* in the logic tests, and test the thin driver itself in contract tests against the real library or hardware.
:::

## Where test doubles sit in the ladder

Test doubles are the bottom rung of a ladder that every flight program climbs:

1. **Unit tests with doubles**, on every laptop and every pull request. Seconds. They check logic.
2. **Software-in-the-loop (SIL)**: the flight software runs against a full simulation of the vehicle and its sensors — one big, careful fake. Minutes.
3. **Hardware-in-the-loop (HIL)**: real flight computers and some real sensors, wired to a simulator that plays the rest of the world. Hours, on a shared rig.
4. **Integrated vehicle tests and flight.**

Each rung is slower, more expensive and more realistic than the one below. The point of the bottom rung is that almost every logic bug is found there, in seconds, so the expensive rungs spend their time on what only they can find: timing, electrical noise, real hardware behavior.

## Check yourself

::: check
A colleague's `ThrottleController.__init__` does `self.engine = EngineInterface(can_bus="can0")`. Why is this hard to test, and what one change makes it easy?
:::

::: answer
The controller builds its own engine interface, tied to a specific CAN bus, so every test needs either the real hardware or patching of `EngineInterface` inside the module from the outside. There is no seam. The change is dependency injection: take the engine interface as a constructor parameter, `ThrottleController(engine)`. The vehicle code passes the real interface; tests pass a mock or fake that implements the same Protocol.
:::

::: check
For each, say whether a fake or a mock is the better fit, and why: (a) an IMU feeding a navigation filter; (b) a pyro channel that fires a separation bolt.
:::

::: answer
(a) A fake. The IMU is an input, and the filter needs realistic streams of data — the right rate, noise, bias and dynamics — to be tested meaningfully. A fake that generates measurements from a known trajectory lets you check the filter's estimate against the truth.

(b) A mock (built with `create_autospec`). The pyro channel is an output; what matters is the command: did the code fire it, once, on the right channel, at the right time, and never otherwise? A mock records the calls so the test can check exactly that.
:::

::: check
In the apogee example, the detector passed at $\sigma = 2\,\mathrm{m}$ and 9 of 20 flights failed at $\sigma = 5\,\mathrm{m}$. Explain the mechanism in your own words, and say what the result tells you about building fakes.
:::

::: answer
The detector's `peak` is the largest reading seen, and readings include noise. With $\sigma = 5\,\mathrm{m}$, a single reading a couple of $\sigma$ high lifts the peak $10\,\mathrm{m}$ or more above the true height. Near apogee the rocket climbs slowly, so the next few ordinary readings sit more than $10\,\mathrm{m}$ below that inflated peak, and the three-reading confirmation is met while the rocket is still rising.

For fakes: the noise level decided whether the flaw was visible at all. A fake must match the real sensor's datasheet — noise, rate, resolution, dropouts — or it will certify code that fails in flight.
:::

::: check
Why does `create_autospec(Valve, instance=True)` catch a bug that `Mock()` misses? Give the bug.
:::

::: answer
A plain `Mock()` creates any attribute you ask for, so a typo like `self.valve.opne()` in the controller succeeds silently in the test and is even recorded as `call.opne()`. On the vehicle, the real valve driver has no `opne` method and the code crashes. `create_autospec` builds the mock from the `Valve` class, so it only has `open` and `close`; calling `opne` raises `AttributeError` in the test, where it is cheap to find.
:::

::: check
Your team's fake GPS receiver passes every test. Name two ways it could still be lying to you, and a guard against each.
:::

::: answer
It could disagree with the real receiver on the interface: different units (degrees versus radians, meters versus feet), a different time reference, `nan` or a stale fix during start-up. Guard: a contract test that runs against both the fake and the real receiver, the real case marked for the hardware rig.

It could be too kind: less noise than the real thing, no multipath jumps, no dropouts under dynamics. Guard: replay recorded data from real receivers through the same tests, and build the fake's noise and failure modes from the datasheet.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Test double | any stand-in for a real dependency during a test |
| Seam, dependency injection | pass the dependency in as a parameter, so a test can hand in a stand-in |
| Interface | a `typing.Protocol` with units and sign conventions in its docstrings |
| Dummy, stub, spy | unused filler; canned answers; canned answers that record calls |
| Fake | a working simplified implementation — e.g. a trajectory plus seeded noise |
| Mock | records calls so the test can check the commands sent; `method_calls`, `call.open()` |
| `create_autospec` | a mock shaped like the real class; rejects methods it does not have |
| `side_effect` | a list of return values, one per call; exceptions in it are raised |
| Contract test | the same test against the fake and (on the rig, marked `hil`) the real driver |
| Recorded data | replay real sensor logs through the same tests |
| The ladder | unit tests with doubles → SIL → HIL → vehicle and flight |

The next lesson asks how much of your code all these tests actually run — coverage — and why a high coverage number, on its own, promises much less than it seems.

::: context stunt-double Where the name comes from
Gerard Meszaros coined "test double" in his 2007 book *xUnit Test Patterns*, choosing it after the stunt double of film-making, precisely because "mock" had come to mean too many things. His names — dummy, stub, spy, mock, fake — are now the common vocabulary, although many tools still call every kind a mock. When a colleague says "mock", ask which one they mean.
:::

::: context protocol-class Duck typing, written down
Python has always cared more about what an object can *do* than what class it is: if it has a `read()` that returns a float, it can be used as an altimeter. This is called duck typing — if it walks like a duck and quacks like a duck, treat it as a duck. `typing.Protocol`, added in Python 3.8, lets you write that expectation down so a type checker can verify it, without forcing the real driver and the fake to share a parent class.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="12" width="140" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">ApogeeDetector</text>
  <text x="180" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">needs: read() → meters</text>
  <line x1="180" y1="52" x2="180" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="80" x2="300" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="80" x2="60" y2="104" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="80" x2="180" y2="104" stroke="#1f2a44" stroke-width="2"/>
  <line x1="300" y1="80" x2="300" y2="104" stroke="#1f2a44" stroke-width="2"/>
  <rect x="10" y="104" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="128" font-size="12" fill="#1f2a44" text-anchor="middle">real driver</text>
  <rect x="130" y="104" width="100" height="40" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="128" font-size="12" fill="#1d6fd1" text-anchor="middle">fake</text>
  <rect x="250" y="104" width="100" height="40" rx="6" fill="#fff" stroke="#f2b880" stroke-width="2"/>
  <text x="300" y="128" font-size="12" fill="#1f2a44" text-anchor="middle">recorded data</text>
  <text x="180" y="162" font-size="11" fill="#6c7a93" text-anchor="middle">on the vehicle · in unit tests · in replay tests</text>
</svg>
```
:::

::: context gaussian-noise The bell-curve shape of sensor noise
When many small, independent disturbances add up — electrical noise, air turbulence over the sensor port, rounding in the converter — the total tends to follow the bell-shaped normal (Gaussian) distribution, named after Carl Friedrich Gauss. About $68\%$ of readings land within $1\sigma$ of the truth, $95\%$ within $2\sigma$ and $99.7\%$ within $3\sigma$. So a fake with $\sigma = 5\,\mathrm{m}$ at $20\,\mathrm{Hz}$ produces a reading more than $10\,\mathrm{m}$ high about once every two seconds, which is why the apogee detector struggled.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="20,120.0 28,119.9 36,119.8 44,119.7 52,119.4 60,118.9 68,118.1 76,116.7 84,114.5 92,111.3 100,106.7 108,100.6 116,92.8 124,83.2 132,72.3 140,60.6 148,48.8 156,38.1 164,29.5 172,23.9 180,22.0 188,23.9 196,29.5 204,38.1 212,48.8 220,60.6 228,72.3 236,83.2 244,92.8 252,100.6 260,106.7 268,111.3 276,114.5 284,116.7 292,118.1 300,118.9 308,119.4 316,119.7 324,119.8 332,119.9 340,120.0" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="22" x2="180" y2="120" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="136">truth</text><text x="140" y="136">−1σ</text><text x="220" y="136">+1σ</text>
    <text x="100" y="136">−2σ</text><text x="260" y="136">+2σ</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="140" y1="116" x2="140" y2="124"/><line x1="220" y1="116" x2="220" y2="124"/>
    <line x1="100" y1="116" x2="100" y2="124"/><line x1="260" y1="116" x2="260" y2="124"/>
  </g>
  <text x="300" y="60" font-size="11" fill="#b4232c" text-anchor="middle">rare high spike</text>
  <line x1="300" y1="66" x2="290" y2="116" stroke="#b4232c" stroke-width="1.5"/>
</svg>
```
:::

::: context hysteresis Why a gap between on and off
A controller with one threshold — open below $3.2\,\mathrm{MPa}$, close above it — would flip the valve every time noise nudged the reading across the line, possibly many times a second. Two thresholds with a gap between them stop that: once open, the valve stays open until the pressure has risen all the way to the upper limit. The word hysteresis comes from the Greek for "lagging behind": the output depends on where the input has been, not only on where it is. A home thermostat works the same way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 155" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <line x1="50" y1="20" x2="50" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <text x="195" y="147" font-size="11" fill="#1f2a44" text-anchor="middle">tank pressure (MPa)</text>
  <text x="44" y="44" font-size="11" fill="#1f2a44" text-anchor="end">open</text>
  <text x="44" y="114" font-size="11" fill="#1f2a44" text-anchor="end">closed</text>
  <line x1="120" y1="116" x2="120" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="260" y1="116" x2="260" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="133" font-size="11" fill="#1f2a44" text-anchor="middle">3.0</text>
  <text x="260" y="133" font-size="11" fill="#1f2a44" text-anchor="middle">3.4</text>
  <polyline points="330,112 260,112" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="260,112 120,112 120,40" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="120,40 260,40 260,112" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="190" y="34" font-size="11" fill="#1d6fd1" text-anchor="middle">open, filling: rises to 3.4</text>
  <text x="190" y="96" font-size="11" fill="#b4232c" text-anchor="middle">closed, draining: falls to 3.0</text>
</svg>
```
:::

::: context side-effect Two meanings of "side effect"
In general programming, a side effect is anything a function does besides return a value: writing a file, sending a command to a valve. In `unittest.mock`, `side_effect` is a specific setting. If it is a list, each call returns the next item, and an exception object in the list is raised instead. If it is an exception, every call raises it. If it is a function, the mock calls it with the same arguments and returns what it returns — which is how you make a mock that answers differently depending on what it was asked.
:::

::: context hil-rig What a HIL rig looks like
A hardware-in-the-loop rig is a bench, often a rack of equipment, holding real flight computers and some real flight hardware — actuators, sometimes sensors — wired to a real-time computer that simulates everything else: the vehicle's motion, the air, the engines, the sensor readings. The flight software cannot tell it is not flying. Rigs are expensive and shared, so teams book time on them, and the tests that run there are the ones that need real timing, real electrical interfaces and real drivers — exactly the `hil`-marked cases.
:::

::: context units-mismatch A spacecraft lost to units
In September 1999 NASA's Mars Climate Orbiter was lost as it arrived at Mars. Ground software supplied by one team reported thruster impulse in pound-force seconds; the navigation software that used those numbers expected newton-seconds. One pound-force second is about $4.45$ newton-seconds, so every small trajectory correction was misjudged, and the spacecraft came in far lower than planned and was destroyed. Each piece of software worked as written. The failure lived at the interface between them — exactly the place a contract test, with units written into the interface, is meant to guard.
:::
