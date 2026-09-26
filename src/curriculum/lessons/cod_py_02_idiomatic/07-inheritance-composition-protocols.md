---
id: l07-inheritance-composition-protocols
title: Inheritance, composition and Protocols
minutes: 19
covers:
  - Inheritance vs composition; duck typing and Protocols
---

Think about a car and an engine. A car *has* an engine. It would be silly to say a car *is* an engine — a car also has wheels, seats and a radio, and some cars have two engines. The words "is a" and "has a" sound almost the same, but they describe very different relationships. Code has to choose between them too, and choosing wrong gives you a class that cannot describe the thing it was written for.

A **[[six-degree-of-freedom|six-dof]]** simulation of a rocket is full of sensors: rate gyros, accelerometers, star trackers, a barometer, a radar altimeter, and a fake version of each one for the tests. They all share a shape. You hand them the true value, and they hand back a measurement with the flaws of real hardware. The question for this lesson is how to write that shared shape down in code.

Most people first reach for **inheritance**: a `Sensor` base class, with everything else built on top of it. It works, until new requirements arrive that inheritance handles badly. Then the class tree grows a `Gyro` that is also a `TemperatureCompensated` that is also a `Redundant`, and nobody can say what any of them is.

Everyday Python works differently. Objects are usually connected by **composition** — this object *has* one of those. And an object usually fits an interface by **duck typing** — if it has a `measure` method, it can go wherever a sensor is wanted, whatever its class. `typing.Protocol` is the tool that lets a checker verify duck typing without turning it into inheritance. This lesson covers all three, and when each one is right.

## Inheritance says "is a", and means it

Writing `class B(A)` — read it "class B, based on A" — makes `B` a **subclass** of `A`. Two things follow:

- Any attribute Python cannot find on `B`, it looks for on `A`. The list of classes it searches, in order, is the **[[method resolution order|mro-chain]]**, stored in `B.__mro__`.
- Every `B` counts as an `A`. `isinstance(b, A)` is `True`.

`super()` means "the next class in that order". A subclass's `__init__` calls `super().__init__(...)` to run the base class's setup.

Here is an IMU — an **inertial measurement unit**, the box of motion sensors at the heart of a vehicle's navigation — built by inheriting from a gyro:

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

Walk through the output. The true rate is 0.100 rad/s and the gyro bias is 0.002, so the measured rate is 0.102. The true acceleration is 9.81 m/s² and the accelerometer bias is 0.05, so the reading is 9.86. `super().__init__` set the gyro bias. The last line shows where Python looks for a name: the class itself, then `Gyro`, then `object`, the root of every class.

Everything works, and the design is still wrong. `isinstance(imu, Gyro)` is `True`, but an IMU is not a gyro. It *contains* gyros. That difference turns into a real defect the first time someone says "the IMU has three gyros and votes":

- There is one `self.bias_rps`, so there is room for one gyro's state. A second gyro has nowhere to live.
- `measure_rate` is the gyro's method, inherited unchanged. With three gyros there is no single answer for it to give.
- Code that accepted the IMU because it asked for a `Gyro` is now holding something whose rate is a vote across three units. That is not what it asked for.

The rule being broken is **substitutability**: derive `B` from `A` only if every place that works with an `A` still works, unchanged and correctly, when handed a `B`. The IMU fails that test. The failure is not about style. The class cannot describe the hardware.

::: example The same IMU by composition
Now let the IMU **[[hold its sensors in lists|imu-has-a]]**, the way the real box holds them on a circuit board.

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

Step by step. The truth is 0.100 rad/s. Gyro `a` adds +0.002 and reads 0.102. Gyro `b` adds −0.001 and reads 0.099. Gyro `c` adds +0.030 and reads 0.130.

`voted_rate` sorts the three readings into 0.099, 0.102, 0.130. With three items, `len(readings) // 2` is `3 // 2`, which is 1, so it picks the middle one: 0.102. This is **[[mid-value select|mid-value-select]]**. The unit with the large 30 mrad/s bias is outvoted, which is the whole reason to fly three. Sanity check: the answer is within 0.002 of the truth, while the bad gyro was off by 0.030. The inheritance version had no way to say any of this.

Here is what composition bought you:

- The number of gyros is *data*, not *structure*. One, three or four costs nothing extra.
- The IMU has its own interface, so `voted_rate` can mean something the gyro's `measure` does not.
- `isinstance(imu, Gyro)` is `False`, so nothing can be handed an IMU where a gyro was required.

The cost is **delegation** — reaching through one object to use another. `imu.accels[0].measure(...)` goes through the IMU to its accelerometer. If that reaching-through happens everywhere, the IMU should grow a method that does it for you. That cost is real, and it is smaller than the one it replaces.
:::

::: note Why one bad gyro can never win the vote
Suppose at most one of the three gyros is faulty, and call the two healthy readings $h_1 \le h_2$. The faulty reading $f$ can land in only three places.

- If $f$ is above both, the sorted list is $h_1, h_2, f$, and the middle is $h_2$.
- If $f$ is below both, the list is $f, h_1, h_2$, and the middle is $h_1$.
- If $f$ is between them, the middle is $f$ itself, and it lies between $h_1$ and $h_2$.

In every case the answer lies between the two healthy readings, however wild $f$ is. An average has no such guarantee: the mean of 0.102, 0.099 and 0.130 is about 0.110, dragged a tenth of the way toward the bad unit. With two faulty gyros out of three the guarantee is gone, which is why four or more units fly where two failures must be survived.
:::

::: key
Composition for capabilities and inheritance only for genuine is-a substitutability. An IMU that contains a Gyro and an Accelerometer models reality; making IMU inherit from Gyro forces an is-a claim that breaks the first time the IMU needs two gyros. When in doubt, compose — turning composition into inheritance later is easier than the reverse.
:::

## Duck typing: the class is not the interface

Look again at `Imu.rates`. It calls `g.measure(rate)` for each gyro. Nothing in it requires `g` to be a `Gyro`. Anything with a `measure` method works: a detailed model with noise, a player that replays recorded flight data, a **[[test double|test-double]]** that always returns the same number.

That is **[[duck typing|duck-typing-name]]**: an object is accepted because of what it can *do*, not because of what class it belongs to. It is why Python code so rarely needs a base class just to share an interface.

The weakness is that nothing writes the requirement down. A reader of `Imu` has to work out "these things need a `measure`" from the body. A caller who passes the wrong objects finds out from an `AttributeError` at runtime — possibly forty minutes into a **[[Monte Carlo|monte-carlo]]** run.

`typing.Protocol` fixes exactly that, without adding a base class. A **Protocol** is a class that lists the members an object must have. Any object that has them fits, with no inheritance at all:

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

A few symbols to read aloud. `name: str` is an **annotation**: "name is a string". The `-> float` after a function's brackets reads "returns a float". The `...` body of `measure` is Python's **[[Ellipsis|ellipsis-body]]** — a placeholder that says "no code here; this line only describes the shape". Lesson 10 covers annotations in full.

Now the result. The errors are +0.002 for `a`, +0.030 for `c`, and 0.0 − 0.100 = −0.100 for the stuck sensor. The largest in size is −0.1, so `worst_error` names `stuck`. And **mypy**, a program that checks annotations without running the code, found no problems.

`Gyro` and `StuckSensor` do not inherit from `Sensor` and do not import it. They fit because they have the right members. That is what **[[structural typing|structural-vs-nominal]]** means — fitting by shape. The alternative, *nominal* typing, is what a base class gives you: you fit only if you declare the relationship by name.

This solves the test-double problem. A fake sensor in a test file, a vendor's object you cannot modify, a stub that replays a CSV of flight data: all three can satisfy `Sensor` without touching anybody's class tree.

::: key
A Protocol is a structural type: any object with the right methods satisfies it, with no inheritance required. It types duck typing, so a mock sensor and a real sensor both satisfy a SensorProtocol without a shared base class.
:::

::: example The mistake caught before the run starts
Here is a magnetometer that means well but names its method `read` instead of `measure`:

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

mypy names the line (16), the class, the protocol and the missing member. It did all that **without running the file**. Run it instead, and you get the same news later and with less detail:

```bash
python3 bad_sensor.py 2>&1 | tail -1
# AttributeError: 'Magnetometer' object has no attribute 'measure'
```

(`2>&1` reads "send error output to the same place as normal output", and `| tail -1` keeps only the last line.)

That is the whole case for Protocols over bare duck typing. The duck typing still happens — `worst_error` never checks a type at runtime. But the requirement is now written down in a form a tool can check, and the check costs one second instead of a simulation run. The output above is from mypy 2.3.1. The wording of a note may differ on another version; the substance will not.
:::

## Protocol, ABC, or neither

An **abstract base class**, or ABC, is the nominal alternative. Subclasses declare the relationship by inheriting. Marking a method `@abstractmethod` means "every subclass must write this one", and Python refuses to create an object from a subclass that has not.

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

The gyro's error is 0.102 − 0.100 = 0.002, as expected. The incomplete class fails the moment you try to build one.

So an ABC gives you two things a Protocol does not:

- A runtime guarantee that every subclass wrote the abstract methods.
- A home for **shared code**. `error` is written once and every sensor inherits it.

Choose on this basis:

- **Protocol** when you are describing what you *need* from objects other people own — especially when test doubles and third-party objects must qualify.
- **ABC** when you own the whole family, want shared code in the base, and want the failure at the moment an object is created.
- **Neither** — plain duck typing — for a small module where the interface is obvious and the only user is you.

::: warning
`@runtime_checkable` lets `isinstance` work with a Protocol. It checks less than it appears to:

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

`isinstance` against a runtime-checkable Protocol only tests that the members *exist*. `WrongSignature` passed the check and then failed the call. Treat the runtime check as a rough filter, and leave the real checking to the static checker, which does compare the arguments and types.
:::

## Check yourself

::: check
State the test for whether `B` should inherit from `A`, and apply it to `Quaternion` and `Vec4`.
:::

::: answer
The test is substitutability: every piece of code that works correctly with an `A` must still work correctly, unchanged, when given a `B`. It is about behavior, not about which fields the two types happen to share.

`Quaternion` and `Vec4` both hold four floats, so it is tempting to derive the quaternion from the vector and inherit addition and scaling. It fails the test on multiplication. `Vec4 * Vec4` would sensibly be component-by-component, or a dot product. `Quaternion * Quaternion` is the Hamilton product, which is not commutative — the order matters. Code written for `Vec4` that multiplies two of them silently gets a different operation. A rotation composed in the wrong order does not raise an error. It just points the vehicle somewhere else.

Normalizing is a second failure. Normalizing a `Vec4` is arithmetic. Normalizing a `Quaternion` is a rule that must hold for it to represent a rotation at all. The two types share an implementation detail, not a behavior. If the arithmetic is worth reusing, compose — hold a `Vec4` inside — or share a module of plain functions.
:::

::: check
Your IMU model must work with three gyro models: an ideal one, one with bias and scale factor, and one that replays recorded flight data. Does this argue for inheritance or a Protocol?
:::

::: answer
A Protocol, unless there is real shared code. All three are used the same way: hand in a true rate, get back a measured rate. Inside, they have nothing in common. The ideal one is a single `return`. The second holds bias and scale-factor numbers. The third owns an open file and a position in it. With no code to share, a base class would be empty, and it would force the replay model to import your class tree even though it is really a file reader.

Write `class Gyro(Protocol)` with the one method, annotate the IMU's `gyros` parameter with it, and let each model be its own class. mypy then checks that every model you pass fits. A new test double is one class with one method — no inheritance, no registration.

If all three later need the same temperature-correction arithmetic, that is a shared *function* each can call, or a small object each can hold. Shared code alone is not a reason to make them relatives.
:::

::: check
Why does `isinstance(obj, SomeRuntimeCheckableProtocol)` return `True` for an object whose method takes the wrong arguments?
:::

::: answer
Because the runtime check only looks for the protocol's member *names* on the object, the way `hasattr` would. It does not compare arguments. To do that, Python would have to inspect parameters and compare types that it does not track at runtime — which is exactly the work a static checker does ahead of time.

The same goes for data members: `isinstance` checks that a declared attribute such as `name` exists, never that it holds a `str`.

So a runtime protocol check is a smoke test. It is useful for, say, a plug-in loader that wants to reject obviously wrong objects with a clear message. It is not a guarantee. mypy, or another static checker, is what compares the signature.
:::

::: check
When is an abstract base class the better choice over a Protocol?
:::

::: answer
When you own every implementation and there is shared behavior to inherit. `SensorBase` above defines `error` once in terms of the abstract `measure`, so every subclass gets it for free. A Protocol cannot give you that: it describes an interface and holds no code.

The second reason is the kind of failure you want. An ABC makes `Incomplete("x")` raise `TypeError` when the object is created — a loud, early failure that needs no extra tool. That is valuable in a codebase whose pipeline never runs a type checker. A Protocol's failure is a mypy error, which comes earlier still, but only if somebody runs mypy.

The reason to prefer a Protocol stays the one the sensor example showed: objects you do not own, and objects written for tests, fit it without inheriting from anything of yours.
:::

::: check
A colleague's `TelemetryReader` class inherits from `dict` so that it can be indexed by channel name. Name two things that can go wrong.
:::

::: answer
First, substitutability fails in both directions. Every `dict` method comes along uninvited: `update`, `clear`, `popitem`, `|=`. Any of them can put the reader into a state its own methods do not expect, and none of them can be removed. Code that receives it as a `dict` may quite properly clear it.

Second, the inherited methods skip your overrides. `dict.get` and `dict.update` are written in C and work on the underlying storage directly. If `TelemetryReader` overrides `__getitem__` to decode a raw value, `reader[k]` decodes but `reader.get(k)` does not. The object behaves differently depending on which accessor a caller happens to use. This is the classic reason **[[`collections.UserDict`|userdict]]** exists.

The composition version holds a dict in an attribute and defines `__getitem__`, `__len__` and `__iter__` — three dunder methods from lesson 5. That gives indexing and looping and nothing else.
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
| `@runtime_checkable` | Lets `isinstance` test that members *exist* only; signatures are not compared |
| `abc.ABC` + `@abstractmethod` | Nominal; instantiating an incomplete subclass raises `TypeError` |
| Choose ABC when | You own the family and there is shared implementation to inherit |
| Choose Protocol when | Third-party objects and test doubles must qualify without inheriting |
| Worked here | Three gyros at +0.002, −0.001 and +0.030 rad/s; mid-value select returned 0.102 |

Next lesson: objects that hold something that must be given back — an open file, a lock, a valve held open. `with`, `__enter__` and `__exit__` guarantee the giving back happens on every path, including the one where something went wrong.

::: context six-dof Six ways to move
A **degree of freedom** is one independent way something can move. A rocket in flight has six. Three are position: it can move forward and back, left and right, up and down. Three are rotation: it can pitch its nose up or down, yaw it left or right, and roll around its long axis.

A six-degree-of-freedom ("6-DOF") simulation tracks all six at once. That is why it needs so many sensor models: gyros measure the three rotation rates, and accelerometers measure the three linear accelerations.
:::

::: context mro-chain Where Python looks for a name
When you write `imu.measure_rate`, Python walks along the method resolution order and stops at the first class that defines the name. `ImuByInheritance` does not define `measure_rate`, so the search moves on to `Gyro`, which does.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="130" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="73" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">ImuByInheritance</text>
  <rect x="170" y="30" width="80" height="40" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="210" y="55" font-size="13" fill="#1f2a44" text-anchor="middle">Gyro</text>
  <rect x="282" y="30" width="70" height="40" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
  <text x="317" y="55" font-size="13" fill="#6c7a93" text-anchor="middle">object</text>
  <line x1="138" y1="50" x2="162" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="168,50 160,45 160,55" fill="#1f2a44"/>
  <line x1="250" y1="50" x2="274" y2="50" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="280,50 272,45 272,55" fill="#6c7a93"/>
  <text x="180" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">search order for imu.measure_rate</text>
  <text x="73" y="92" font-size="12" fill="#b4232c" text-anchor="middle">1. not here</text>
  <text x="210" y="92" font-size="12" fill="#1d6fd1" text-anchor="middle">2. found here</text>
  <text x="317" y="92" font-size="12" fill="#6c7a93" text-anchor="middle">3. not needed</text>
  <text x="180" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">the order is stored in ImuByInheritance.__mro__</text>
</svg>
```

Every class ends in `object`, which is where methods such as `__repr__` come from when you did not write one.
:::

::: context imu-has-a The IMU as a box of parts
Composition draws the way the hardware looks. The `Imu` object holds two lists, and each list holds sensor objects. Adding a fourth gyro means adding one more item to a list — no class changes at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="150" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="24" y="32" font-size="13" font-weight="700" fill="#1f2a44">Imu</text>
  <text x="24" y="60" font-size="12" fill="#1f2a44">gyros</text>
  <rect x="80" y="44" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="120" y="61" font-size="11" fill="#1f2a44" text-anchor="middle">Gyro a +0.002</text>
  <rect x="168" y="44" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="208" y="61" font-size="11" fill="#1f2a44" text-anchor="middle">Gyro b &#8722;0.001</text>
  <rect x="256" y="44" width="80" height="26" rx="4" fill="#f2b880" stroke="#b4232c"/>
  <text x="296" y="61" font-size="11" fill="#1f2a44" text-anchor="middle">Gyro c +0.030</text>
  <text x="24" y="104" font-size="12" fill="#1f2a44">accels</text>
  <rect x="80" y="88" width="80" height="26" rx="4" fill="#ffffff" stroke="#1d6fd1"/>
  <text x="120" y="105" font-size="11" fill="#1f2a44" text-anchor="middle">Accel x +0.05</text>
  <text x="180" y="146" font-size="11" fill="#6c7a93" text-anchor="middle">has-a: the Imu holds sensors; it is not one of them</text>
</svg>
```

Biases are in rad/s for the gyros and m/s² for the accelerometer. The orange box is the faulty unit the vote will reject.
:::

::: context mid-value-select Why the middle reading wins
Mid-value select sorts the readings and keeps the middle one. With three units, one faulty gyro can pull its own reading anywhere it likes, but it can never become the middle value on its own — at least one healthy unit always sits between it and the answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="67.5" y1="64" x2="67.5" y2="76"/><line x1="142.5" y1="64" x2="142.5" y2="76"/>
    <line x1="217.5" y1="64" x2="217.5" y2="76"/><line x1="292.5" y1="64" x2="292.5" y2="76"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="67.5" y="92">0.10</text><text x="142.5" y="92">0.11</text><text x="217.5" y="92">0.12</text><text x="292.5" y="92">0.13</text>
  </g>
  <line x1="67.5" y1="30" x2="67.5" y2="70" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="67.5" y="24" font-size="11" fill="#6c7a93" text-anchor="middle">truth</text>
  <circle cx="60" cy="58" r="5" fill="#6c7a93"/>
  <text x="44" y="50" font-size="11" fill="#6c7a93" text-anchor="middle">b</text>
  <circle cx="82.5" cy="58" r="6" fill="#1d6fd1"/>
  <text x="104" y="50" font-size="11" fill="#1d6fd1" text-anchor="middle">a: chosen</text>
  <circle cx="292.5" cy="58" r="5" fill="#b4232c"/>
  <text x="292.5" y="48" font-size="11" fill="#b4232c" text-anchor="middle">c: outvoted</text>
  <text x="180" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">measured rate, rad/s</text>
</svg>
```

Real flight computers use this same trick for redundant sensors and redundant computers, because it needs no judgment about *which* unit failed.
:::

::: context test-double Stand-ins for testing
A **test double** is a stand-in object used in a test in place of the real thing, the way a stunt double stands in for an actor. You cannot plug a real gyro into a unit test on a laptop, so you write a small class that behaves like one in exactly the way the test needs.

A *stub* returns fixed answers. A *fake* is a working but simplified version. A *mock* also records how it was called, so the test can check it. `StuckSensor`, which always returns the same value, is a stub — and it is also a realistic fault: real sensors do get stuck.
:::

::: context duck-typing-name Walks like a duck
The name comes from an old saying: if it walks like a duck and quacks like a duck, then it is a duck. Python applies it literally. When `Imu.rates` calls `g.measure(...)`, Python never asks what class `g` belongs to. It only tries the call. If the method is there, the code works. If not, you get an `AttributeError` at that moment.
:::

::: context monte-carlo Thousands of runs with dice
A **Monte Carlo** analysis runs the same simulation many times — often thousands — each time with slightly different inputs drawn at random: a heavier stage, a weaker engine, a gust of wind. The spread of the results shows how the vehicle behaves across everything that might realistically happen.

Because each case can take minutes, a type mistake that only shows up when some rare branch runs can cost hours of computer time before it crashes. The name comes from the casino in Monaco, because the method runs on random numbers.
:::

::: context ellipsis-body What the three dots mean
`...` is a real Python value, called `Ellipsis`. Used as the whole body of a function, it does nothing except make the function legal to write — Python requires every function to have at least one statement.

In a Protocol the dots are a signal to the reader: this method is *described* here, not *written* here. The objects that fit the protocol supply the real code. You will also see `pass` used the same way.
:::

::: context structural-vs-nominal Fitting by shape or by name
Think of two job adverts. One says "must hold a certificate from Acme Driving School" — you qualify only by having that exact name on paper. The other says "must be able to drive a forklift" — you qualify by being able to do the job, however you learned.

The first is **nominal** typing, which is what a base class gives you: you fit only if your class says `(SensorBase)`. The second is **structural** typing, which is what a Protocol gives you: you fit if you have the members, and nobody asks where they came from.
:::

::: context userdict A dict built for subclassing
`collections.UserDict` is a plain-Python class that *holds* a real dictionary in an attribute called `data`. Its methods such as `get` are written in Python on top of your `__getitem__`, so overriding `__getitem__` once changes every way of reading a value.

Running it confirms the difference: with a `dict` subclass whose `__getitem__` doubles the value, `r["a"]` gives 2 but `r.get("a")` gives 1. With a `UserDict` subclass, both give 2. `UserDict` is itself composition wearing a dictionary's interface.
:::
