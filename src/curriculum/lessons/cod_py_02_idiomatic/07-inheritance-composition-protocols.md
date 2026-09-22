---
id: l07-inheritance-composition-protocols
title: Inheritance, composition and Protocols
minutes: 16
covers:
  - Inheritance vs composition; duck typing and Protocols
---

A six-degree-of-freedom simulation has a lot of sensors in it: rate gyros, accelerometers, star trackers, a barometer, a radar altimeter, and a fake version of each one for the tests. They share a shape — you hand them the truth, they hand back a measurement with the imperfections of real hardware — and the question is how to express that shape in code.

The answer most people reach for first is inheritance: a `Sensor` base class, and everything else derived from it. It works, and then the requirements arrive that inheritance handles badly, and the class tree acquires a `Gyro` that is also a `TemperatureCompensated` that is also a `Redundant`, and nobody can say what any of them is.

Python's actual practice is different. Relationships between objects are usually *composition* — this object has one of those — and relationships between an object and an interface are usually *duck typing*: if it has a `measure` method, it can be used where a sensor is wanted, whatever its class. `typing.Protocol` is the tool that makes duck typing checkable without making it inheritance. This lesson is the three of them and when each is right.

## Inheritance says "is a", and means it

`class B(A)` puts `A` in `B`'s method resolution order, so any attribute not found on `B` is looked for on `A`, and every `B` is an `A` as far as `isinstance` is concerned. `super()` calls the next class in that order, which is how a subclass's `__init__` runs the base's.

```python
# inherit_imu.py
class Gyro:
    """A rate gyro with a bias, in rad/s."""

    def __init__(self, bias_rps):
        self.bias_rps = float(bias_rps)

    def measure_rate(self, true_rate_rps):
        return true_rate_rps + self.bias_rps


class ImuByInheritance(Gyro):
    """An IMU that 'is a' gyro. This is the mistake."""

    def __init__(self, bias_rps, accel_bias_ms2):
        super().__init__(bias_rps)
        self.accel_bias_ms2 = float(accel_bias_ms2)

    def measure_accel(self, true_accel_ms2):
        return true_accel_ms2 + self.accel_bias_ms2


imu = ImuByInheritance(0.002, 0.05)
print(round(imu.measure_rate(0.100), 6))
print(round(imu.measure_accel(9.81), 6))
print(isinstance(imu, Gyro))
print(ImuByInheritance.__mro__)
```

```bash
python3 inherit_imu.py
# 0.102
# 9.86
# True
# (<class '__main__.ImuByInheritance'>, <class '__main__.Gyro'>, <class 'object'>)
```

Everything works. The IMU reports a biased rate and a biased acceleration, `super().__init__` set the gyro bias, and the method resolution order shows where Python looks: the class, then `Gyro`, then `object`.

And the design is wrong, because `isinstance(imu, Gyro)` is `True` and an IMU is not a gyro. It *contains* a gyro. The difference becomes a real defect the first time the requirement is "the IMU has three gyros and votes":

- There is one `self.bias_rps`, so there is one gyro's worth of state on the class. A second gyro has nowhere to live.
- `measure_rate` is the gyro's method inherited unchanged. With three gyros there is no single answer for it to return.
- Any code that received the IMU because it asked for a `Gyro` is now holding something whose rate output is a vote across three units, which is not what it asked for.

The rule this is an instance of is *substitutability*: derive `B` from `A` only if every place that works with an `A` still works, unchanged and correctly, when handed a `B`. An IMU fails that, and the failure is not aesthetic. It is that the class cannot represent the hardware.

::: example The same IMU by composition
```python
# compose_imu.py
class Gyro:
    """A rate gyro with a bias, in rad/s."""

    def __init__(self, name, bias_rps):
        self.name = name
        self.bias_rps = float(bias_rps)

    def measure(self, true_rate_rps):
        return true_rate_rps + self.bias_rps


class Accelerometer:
    """A linear accelerometer with a bias, in m/s^2."""

    def __init__(self, name, bias_ms2):
        self.name = name
        self.bias_ms2 = float(bias_ms2)

    def measure(self, true_accel_ms2):
        return true_accel_ms2 + self.bias_ms2


class Imu:
    """An IMU *has* gyros and accelerometers. Any number of them."""

    def __init__(self, gyros, accels):
        self.gyros = list(gyros)
        self.accels = list(accels)

    def rates(self, true_rate_rps):
        return [g.measure(true_rate_rps) for g in self.gyros]

    def voted_rate(self, true_rate_rps):
        """Mid-value select across the gyros: the reason redundancy exists."""
        readings = sorted(self.rates(true_rate_rps))
        return readings[len(readings) // 2]


imu = Imu(
    gyros=[Gyro("a", 0.002), Gyro("b", -0.001), Gyro("c", 0.030)],
    accels=[Accelerometer("x", 0.05)],
)
print([round(r, 6) for r in imu.rates(0.100)])
print(round(imu.voted_rate(0.100), 6))
print(round(imu.accels[0].measure(9.81), 6))
```

```bash
python3 compose_imu.py
# [0.102, 0.099, 0.13]
# 0.102
# 9.86
```

Three gyros with biases of +0.002, −0.001 and +0.030 rad/s report 0.102, 0.099 and 0.130 against a truth of 0.100. The mid-value select returns 0.102, rejecting the unit with the 30 mrad/s bias — which is the entire point of flying three of them, and which the inheritance version had no way to express.

What composition bought, concretely: the number of gyros is data, not structure, so one, three or four costs nothing; the IMU's interface is its own, so `voted_rate` can mean something the gyro's `measure` does not; and `isinstance(imu, Gyro)` is `False`, so nothing can be handed an IMU where a gyro was required.

The cost is delegation. `imu.accels[0].measure(...)` reaches through the IMU to its accelerometer, and if that reaching happens everywhere, the IMU should grow a method that does it. That is a real cost and it is smaller than the one it replaces.
:::

::: key
Inherit only for genuine substitutability: every place that works with the base must still work, unchanged, given the derived class. Compose for capabilities — an object that *has* a gyro, a filter, a logger. When in doubt, compose; converting composition to inheritance later is easier than the reverse.
:::

## Duck typing: the class is not the interface

`Imu.rates` calls `g.measure(rate)` for each gyro. Nothing in it requires `g` to be a `Gyro`. Anything with a `measure` method works: a high-fidelity model with noise and quantisation, a recorded-data playback object, a test double that always returns the same number. That is duck typing, and it is why Python code so rarely needs a base class to share an interface.

The weakness is that nothing states the requirement. A reader of `Imu` has to infer "these need a `measure`" from the body, and a caller who passes a list of the wrong objects learns about it from an `AttributeError`, at runtime, possibly forty minutes into a Monte Carlo.

`typing.Protocol` fixes exactly that, without introducing a base class:

```python
# sensors.py
from typing import Protocol


class Sensor(Protocol):
    """Anything with a name and a measure() is a Sensor. No inheritance needed."""

    name: str

    def measure(self, truth: float) -> float: ...


class Gyro:
    """A real sensor model. It does not mention Sensor anywhere."""

    def __init__(self, name: str, bias_rps: float) -> None:
        self.name = name
        self.bias_rps = bias_rps

    def measure(self, truth: float) -> float:
        return truth + self.bias_rps


class StuckSensor:
    """A test double. Also does not mention Sensor anywhere."""

    def __init__(self, name: str, value: float) -> None:
        self.name = name
        self.value = value

    def measure(self, truth: float) -> float:
        return self.value


def worst_error(sensors: list[Sensor], truth: float) -> tuple[str, float]:
    """Return the name and signed error of the sensor furthest from truth."""
    errors = [(s.name, s.measure(truth) - truth) for s in sensors]
    return max(errors, key=lambda pair: abs(pair[1]))


if __name__ == "__main__":
    fleet: list[Sensor] = [Gyro("a", 0.002), Gyro("c", 0.030), StuckSensor("stuck", 0.0)]
    print(worst_error(fleet, 0.100))
```

```bash
python3 sensors.py
python3 -m mypy sensors.py
# ('stuck', -0.1)
# Success: no issues found in 1 source file
```

`Gyro` and `StuckSensor` do not inherit from `Sensor` and do not import it. They satisfy it because they have the right members — that is what *structural* typing means, as against the *nominal* typing of a base class, where you must declare the relationship.

This is the answer to the test-double problem. A fake sensor in a test file, a vendor SDK object you cannot modify, a stub built from a CSV of recorded flight data: all three can satisfy `Sensor` without touching anybody's class hierarchy.

::: example The mistake caught before the run starts
```python
# bad_sensor.py
from sensors import Sensor, worst_error


class Magnetometer:
    """Conforms in spirit and not in fact: the method has the wrong name."""

    def __init__(self, name: str, scale: float) -> None:
        self.name = name
        self.scale = scale

    def read(self, truth: float) -> float:
        return truth * self.scale


fleet: list[Sensor] = [Magnetometer("mag", 1.02)]
print(worst_error(fleet, 0.100))
```

```bash
python3 -m mypy bad_sensor.py
# bad_sensor.py:16: error: List item 0 has incompatible type "Magnetometer"; expected "Sensor"  [list-item]
# bad_sensor.py:16: note: "Magnetometer" is missing following "Sensor" protocol member:
# bad_sensor.py:16: note:     measure
# Found 1 error in 1 file (checked 1 source file)
```

mypy names the class, the protocol and the missing member, and it did so **without running the file**. Run it instead and you get the same information later and with less of it:

```bash
python3 bad_sensor.py 2>&1 | tail -1
# AttributeError: 'Magnetometer' object has no attribute 'measure'
```

That is the whole case for Protocols over bare duck typing. The duck typing still happens — `worst_error` never checks a type at runtime — but the requirement is now written down in a form a tool can check, and the check costs a second rather than a simulation run. The output above is from mypy 2.3.1; the wording of a note may differ on another version, though the substance will not.
:::

## Protocol, ABC, or neither

An *abstract base class* is the nominal alternative: subclasses declare the relationship by inheriting, and `@abstractmethod` makes instantiation fail if they have not implemented everything.

```python
# abc_demo.py
from abc import ABC, abstractmethod


class SensorBase(ABC):
    """An abstract base class: subclasses must implement measure()."""

    def __init__(self, name):
        self.name = name

    @abstractmethod
    def measure(self, truth):
        """Return the measured value of `truth`."""

    def error(self, truth):
        """Shared behaviour every subclass inherits for free."""
        return self.measure(truth) - truth


class Gyro(SensorBase):
    def __init__(self, name, bias_rps):
        super().__init__(name)
        self.bias_rps = bias_rps

    def measure(self, truth):
        return truth + self.bias_rps


class Incomplete(SensorBase):
    """Forgot to implement measure()."""


g = Gyro("a", 0.002)
print(g.name, round(g.error(0.100), 6))

try:
    Incomplete("x")
except TypeError as exc:
    print("TypeError:", exc)
```

```bash
python3 abc_demo.py
# a 0.002
# TypeError: Can't instantiate abstract class Incomplete with abstract method measure
```

The ABC gives two things a Protocol does not: a runtime guarantee that every subclass implemented the abstract methods, and a place to put *shared implementation* — `error` here is written once and inherited by every sensor.

So choose on this basis. Use a Protocol when you are describing what you *need* from objects other people own, especially when test doubles and third-party types must qualify. Use an ABC when you own the whole family, want shared code in the base, and want the failure at instantiation. Use neither — plain duck typing — for a small module where the interface is obvious and the audience is you.

::: warning
`@runtime_checkable` lets `isinstance` work with a Protocol, and checks less than it appears to:

```python
# runtime_proto.py
from typing import Protocol, runtime_checkable


@runtime_checkable
class Measurable(Protocol):
    def measure(self, truth: float) -> float: ...


class Gyro:
    def measure(self, truth: float) -> float:
        return truth + 0.002


class WrongSignature:
    def measure(self) -> float:
        return 0.0


print(isinstance(Gyro(), Measurable))
print(isinstance(WrongSignature(), Measurable))
try:
    WrongSignature().measure(0.1)
except TypeError as exc:
    print("TypeError:", exc)
```

```bash
python3 runtime_proto.py
# True
# True
# TypeError: WrongSignature.measure() takes 1 positional argument but 2 were given
```

`isinstance` against a runtime-checkable Protocol tests only that the *names* exist. `WrongSignature` passed the check and failed the call. Treat the runtime check as a coarse filter and leave the real checking to the static one, which does compare signatures.
:::

## Check yourself

::: check
State the test for whether `B` should inherit from `A`, and apply it to `Quaternion` and `Vec4`.
:::

::: answer
The test is substitutability: every piece of code that works correctly with an `A` must still work correctly, unchanged, when given a `B`. It is about behaviour, not about which fields the two types happen to share.

`Quaternion` and `Vec4` both hold four floats, and it is tempting to derive the quaternion from the vector to inherit addition and scaling. It fails the test on multiplication: `Vec4 * Vec4` would reasonably be component-wise or a dot product, while `Quaternion * Quaternion` is the Hamilton product, which is not commutative. Code written for `Vec4` that multiplies two of them gets a different operation, silently, and a rotation composed in the wrong order does not raise — it just points the vehicle somewhere else.

Normalisation is a second failure: normalising a `Vec4` is arithmetic, and normalising a `Quaternion` is a constraint that must hold for it to represent a rotation at all. Two types, sharing an implementation detail. If the arithmetic is worth reusing, compose — hold a `Vec4` inside — or share a module of free functions.
:::

::: check
Your IMU model needs to work with three different gyro fidelities: an ideal one, one with bias and scale factor, and one that replays recorded flight data. Does this argue for inheritance or a Protocol?
:::

::: answer
A Protocol, unless there is real shared code. All three are used the same way — hand them a true rate, get a measured rate — and they have nothing in common internally: the ideal one is a return statement, the second carries bias and scale-factor state, and the third owns a file handle and a cursor. There is no implementation to share, so a base class would be an empty base class, and it would force the replay model to import your hierarchy even though it is really a file reader.

Write `class Gyro(Protocol)` with the one method, annotate the IMU's `gyros` parameter with it, and let each model be its own class. mypy then checks that every model you pass satisfies the interface, and a test double is added by writing a class with one method — no inheritance, no registration.

If, later, all three need the same temperature-compensation arithmetic, that is a shared *function* they can each call, or a small class they each hold. Shared code is not by itself a reason to make them relatives.
:::

::: check
Why does `isinstance(obj, SomeRuntimeCheckableProtocol)` return `True` for an object whose method takes the wrong arguments?
:::

::: answer
Because the runtime check is implemented by looking for the *names* of the protocol's members on the object, and nothing more. Signatures are not compared: Python would have to inspect the parameters and compare types it does not have at runtime, which is precisely the work a static checker does ahead of time.

The practical consequence is that a runtime protocol check is a smoke test, useful for a plug-in loader that wants to reject obviously wrong objects with a clear message. It is not a guarantee, and `mypy` or another static checker is what actually compares the signature. Data attributes declared on a protocol are also not checked at all by `isinstance` in the general case, which is another reason not to lean on it.
:::

::: check
When is an abstract base class the better choice over a Protocol?
:::

::: answer
When you own every implementation and there is shared behaviour to inherit. The `SensorBase` above defines `error` once in terms of the abstract `measure`, so every subclass gets it for free; a Protocol cannot give you that, because it describes an interface and holds no implementation.

The second reason is the failure you want. An ABC makes `Incomplete("x")` raise `TypeError` at instantiation, which is a loud, early, runtime failure that needs no separate tool — valuable in a codebase with no type checking in its pipeline. A Protocol's failure is a mypy error, which is earlier still but only if somebody runs mypy.

The reason to prefer a Protocol remains what the sensor example showed: objects you do not own, and objects written for tests, can satisfy it without inheriting from anything of yours.
:::

::: check
A colleague's `TelemetryReader` class inherits from `dict` so that it can be indexed by channel name. Name two things that can go wrong.
:::

::: answer
First, substitutability fails in both directions. Every `dict` method comes along uninvited: `update`, `clear`, `popitem`, `|=`. Any of them can put the reader into a state its own methods do not expect, and none of them can be removed. Code that receives it as a `dict` may legitimately clear it.

Second, the inherited methods do not go through the overrides. `dict.update` and `dict.get` are implemented in C against the underlying storage, so if `TelemetryReader` overrides `__getitem__` to decode a raw value, `update` and `get` will not call it, and the object behaves differently depending on which accessor a caller happens to use. This is the classic reason `collections.UserDict` exists.

The composition version holds a dict in an attribute and exposes `__getitem__`, `__len__` and `__iter__` — three dunder methods from the earlier lesson — which gives indexing and iteration and nothing else.
:::

## Summary

| Item | Statement |
| --- | --- |
| Inheritance | `class B(A)`: puts `A` in `B.__mro__`; `isinstance(b, A)` is `True` |
| `super()` | Calls the next class in the method resolution order, typically the base `__init__` |
| Substitutability test | Derive only if every use of the base still works, unchanged, with the derived class |
| Composition | The object *has* the capability; the number of parts becomes data, not structure |
| Duck typing | Any object with the right methods is acceptable; the class is irrelevant |
| `typing.Protocol` | Structural type: conformance by having the members, with no inheritance or import |
| Checked by | A static checker, before anything runs; mypy names the missing member |
| `@runtime_checkable` | Lets `isinstance` test member *names* only; signatures are not compared |
| `abc.ABC` + `@abstractmethod` | Nominal; instantiating an incomplete subclass raises `TypeError` |
| Choose ABC when | You own the family and there is shared implementation to inherit |
| Choose Protocol when | Third-party objects and test doubles must qualify without inheriting |
| Worked here | Three gyros at +0.002, −0.001 and +0.030 rad/s; mid-value select returned 0.102 |

The next lesson takes the other half of RAII: `with`, `__enter__` and `__exit__`, and how to guarantee that a file, a lock or a hardware connection is released on the path where something went wrong.
