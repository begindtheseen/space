---
id: l04-classes
title: Classes: state, behaviour and properties
minutes: 16
covers:
  - Classes: __init__, attributes vs methods, @property, @staticmethod, @classmethod
---

A six-degree-of-freedom simulation carries a *state*: time, position, velocity, attitude, angular rate, mass. Every function in the simulation takes one and returns one, and so the first design decision anybody makes is how to represent it. The usual first answer is a dict, and the usual second answer, a week later, is a class.

The reason is not that dicts are slow. It is that a dict has no fixed set of keys, no place to put the operations that belong to a state, and nothing to say what a valid state is. `state["mas5"]` is a new key, not an error. A derived quantity like speed gets recomputed at every call site, three of which will have a typo in the square root. Nothing knows that mass must be positive.

A class fixes all three. `__init__` says what a state consists of, methods say what you can do with one, `@property` gives derived quantities a name without storing them, and `@classmethod` gives you a second way to build one without a second name to remember. This lesson is that vocabulary, and the next one is the dunder methods that make your class behave like a built-in type.

## What the dict version costs

```python
# dict_state.py
state = {"t": 12.5, "vx": 410.0, "vy": -3.2, "vz": 88.0, "mass": 31500.0}

speed = (state["vx"] ** 2 + state["vy"] ** 2 + state["vz"] ** 2) ** 0.5
print(round(speed, 3))

print(state.get("mas5", 0.0))
state["mas5"] = 30000.0
print(sorted(state))
```

```bash
python3 dict_state.py
# 419.35
# 0.0
# ['mas5', 'mass', 't', 'vx', 'vy', 'vz']
```

The speed calculation is correct and will be copied into six other files. The misspelled `state.get("mas5", 0.0)` returned `0.0` instead of raising, which in a mass-flow calculation is a division by zero somewhere far away. And the misspelled assignment added a *sixth* key rather than failing, so the dict now describes a state that does not exist.

## A class names the parts and holds the operations

```python
# state.py
import math


class State:
    """Vehicle state at one instant, in an Earth-centred inertial frame."""

    def __init__(self, t, velocity, mass):
        self.t = float(t)
        self.velocity = tuple(float(v) for v in velocity)
        self.mass = float(mass)

    def speed(self):
        """Magnitude of the velocity, m/s."""
        return math.sqrt(sum(v * v for v in self.velocity))

    def kinetic_energy(self):
        """Translational kinetic energy, J."""
        return 0.5 * self.mass * self.speed() ** 2


if __name__ == "__main__":
    s = State(12.5, (410.0, -3.2, 88.0), 31500.0)
    print(s.t, s.mass)
    print(round(s.speed(), 3))
    print(round(s.kinetic_energy(), 1))
```

```bash
python3 state.py
# 12.5 31500.0
# 419.35
# 2769704280.0
```

Four things in that file are worth saying precisely.

`__init__` is not a constructor. By the time it runs, the object exists and is empty; `__init__` fills it in, and returns `None`. Whatever it assigns to `self` is what the object has.

`self` is an ordinary parameter and Python passes it explicitly. `s.speed()` is `State.speed(s)`, and you can write the second form; the first is sugar. This is why every method's first parameter is `self`, and why forgetting it gives an argument-count error rather than something mysterious.

`self.velocity = tuple(float(v) for v in velocity)` does two useful things in one line: it coerces the components to float, so a caller passing integers or strings from a file gets floats out, and it copies them into a tuple, so a caller who later mutates the list they passed in cannot change this state behind its back.

`speed` and `kinetic_energy` are *methods*: behaviour, stored once on the class. `t`, `velocity` and `mass` are *attributes*: data, stored per instance. You can see the split:

```python
# bound.py
from state import State

s = State(12.5, (410.0, -3.2, 88.0), 31500.0)

print(vars(s))
print(State.speed)
print(s.speed)
print(s.speed() == State.speed(s))
```

```bash
python3 bound.py
# {'t': 12.5, 'velocity': (410.0, -3.2, 88.0), 'mass': 31500.0}
# <function State.speed at 0x7fd853819b20>
# <bound method State.speed of <state.State object at 0x7fd853806190>>
# True
```

`vars(s)` is the instance's own data and holds exactly the three attributes — no methods. `State.speed` is a plain function. `s.speed` is that same function with `s` already attached, which is what "bound method" means. The two hex addresses will differ on your machine; nothing else in that output will.

::: key
`__init__(self, ...)` initialises an already-created object and returns `None`. Instance data lives in the instance (`vars(obj)`); methods live on the class and are shared. `obj.method(args)` means `Class.method(obj, args)`.
:::

## @property: a method that is read like an attribute

`s.speed()` and `s.mass` read differently although both are "a number belonging to this state". The parentheses are an implementation detail leaking into every call site, and the moment you decide to store speed instead of computing it, or to compute mass instead of storing it, every call site has to change.

`@property` removes the distinction. A property is a method you access without parentheses:

```python
# property_state.py
import math


class State:
    """Vehicle state at one instant, with a validated mass."""

    def __init__(self, t, velocity, mass):
        self.t = float(t)
        self.velocity = tuple(float(v) for v in velocity)
        self.mass = mass

    @property
    def speed(self):
        """Magnitude of the velocity, m/s. Derived, never stored."""
        return math.sqrt(sum(v * v for v in self.velocity))

    @property
    def mass(self):
        """Vehicle mass, kg."""
        return self._mass

    @mass.setter
    def mass(self, value):
        value = float(value)
        if value <= 0.0:
            raise ValueError(f"mass must be positive, got {value}")
        self._mass = value


s = State(12.5, (410.0, -3.2, 88.0), 31500.0)
print(round(s.speed, 3))

s.mass = 29800.0
print(s.mass)

s.velocity = (0.0, 0.0, 0.0)
print(s.speed)

try:
    s.mass = -1.0
except ValueError as exc:
    print("ValueError:", exc)

try:
    s.speed = 100.0
except AttributeError as exc:
    print("AttributeError:", exc)
```

```bash
python3 property_state.py
# 419.35
# 29800.0
# 0.0
# ValueError: mass must be positive, got -1.0
# AttributeError: property 'speed' of 'State' object has no setter
```

Five things happened there. `s.speed` with no parentheses ran a method. Setting `s.mass` ran the setter, which validated. Changing `velocity` changed `speed` immediately, because speed is derived at every read and never stored — so the two can never disagree, which a cached copy could. Assigning an invalid mass raised at the assignment, not later in a propagator. And `speed`, having no setter, is read-only.

The last message, `property 'speed' of 'State' object has no setter`, is the Python 3.11 wording; older versions said `can't set attribute`. The exception type, `AttributeError`, is the part you should write code against.

::: key
`@property` turns a method into a read-only attribute; `@name.setter` adds a write path that can validate. The value of this is that you may start with a plain attribute and add validation or derivation later **without changing a single caller**. That is why Python code does not begin life with `get_mass()` and `set_mass()` the way Java code does.
:::

::: example A State class for a propagator, and what the property bought
Suppose `mass` began as a plain attribute and the class shipped. Fifty call sites read `s.mass`, a dozen assign it. Then a Monte Carlo run produces a negative mass after a propellant-depletion bug, and the trajectory quietly continues with negative kinetic energy.

With a plain attribute the fix means finding every assignment. With the property above the fix is the eight lines of `mass` and `mass.setter`, and **no call site changes at all** — `s.mass` still reads, `s.mass = x` still writes, and the invalid write now raises at the point where the bad value is produced:

```bash
python3 property_state.py
# 419.35
# 29800.0
# 0.0
# ValueError: mass must be positive, got -1.0
# AttributeError: property 'speed' of 'State' object has no setter
```

Two details that trip people. The stored value has to go somewhere other than `self.mass`, or the setter calls itself forever; the convention is a leading underscore, `self._mass`, meaning "internal, do not touch from outside". And `__init__` assigns `self.mass = mass` rather than `self._mass = mass` on purpose, so that construction goes through the same validation as any later assignment — which is what makes `State(12.5, (0, 0, 0), -5.0)` raise instead of building a state nobody can use.

There is a cost, and it is honest to state it: a property is a function call, so reading `s.speed` a million times inside an integration loop is a million calls. If profiling shows that, compute the value once outside the loop. It is not a reason to avoid properties in general.
:::

## @classmethod and @staticmethod

A `@classmethod` receives the class as its first argument, conventionally `cls`, instead of an instance. Its main use is an *alternative constructor*: a second way to build an object, named for where the data came from.

A `@staticmethod` receives neither. It is a plain function that lives inside the class because it belongs to the subject, not because it needs any object.

::: example Building a vehicle from a config file, and the rocket equation
```python
# vehicle.py
import math


class Vehicle:
    """An upper stage: dry mass, propellant, payload and engine performance."""

    G0 = 9.80665  # standard gravity, m/s^2; one copy, shared by every Vehicle

    def __init__(self, name, dry_mass_kg, propellant_kg, payload_kg, isp_s):
        self.name = name
        self.dry_mass_kg = float(dry_mass_kg)
        self.propellant_kg = float(propellant_kg)
        self.payload_kg = float(payload_kg)
        self.isp_s = float(isp_s)

    @classmethod
    def from_config(cls, config):
        """Build a Vehicle from a parsed configuration mapping."""
        return cls(
            config["name"],
            config["dry_mass_kg"],
            config["propellant_kg"],
            config["payload_kg"],
            config["isp_s"],
        )

    @staticmethod
    def delta_v(isp_s, mass_ratio):
        """Ideal delta-v from the rocket equation, m/s."""
        return isp_s * Vehicle.G0 * math.log(mass_ratio)

    @property
    def burnout_mass_kg(self):
        return self.dry_mass_kg + self.payload_kg

    @property
    def wet_mass_kg(self):
        return self.burnout_mass_kg + self.propellant_kg

    @property
    def mass_ratio(self):
        return self.wet_mass_kg / self.burnout_mass_kg

    def ideal_delta_v(self):
        return self.delta_v(self.isp_s, self.mass_ratio)


config = {
    "name": "upper stage",
    "dry_mass_kg": 4000.0,
    "propellant_kg": 92000.0,
    "payload_kg": 15000.0,
    "isp_s": 348.0,
}

stage = Vehicle.from_config(config)
print(stage.name, "wet mass", stage.wet_mass_kg, "kg")
print("mass ratio", round(stage.mass_ratio, 4))
print("ideal delta-v", round(stage.ideal_delta_v(), 1), "m/s")
print("bare rocket equation", round(Vehicle.delta_v(311.0, 3.5), 1), "m/s")
print(Vehicle.G0, stage.G0)
```

```bash
python3 vehicle.py
# upper stage wet mass 111000.0 kg
# mass ratio 5.8421
# ideal delta-v 6023.8 m/s
# bare rocket equation 3820.8 m/s
# 9.80665 9.80665
```

The physics is Tsiolkovsky's equation,

$$\Delta v = I_{sp}\, g_0 \ln\!\left(\frac{m_0}{m_f}\right)$$

with $I_{sp}$ the specific impulse in seconds, $g_0 = 9.80665\,\mathrm{m/s^2}$ the standard gravity that turns seconds into an exhaust velocity, $m_0$ the mass at ignition and $m_f$ at burnout. Here $m_0 = 111{,}000\,\mathrm{kg}$ and $m_f = 19{,}000\,\mathrm{kg}$, so the ratio is 5.8421 and the ideal contribution is about 6.02 km/s — a plausible upper-stage number, and an upper bound, since it ignores gravity and drag losses.

Three design points. `from_config` is a classmethod rather than a function called `vehicle_from_config`, so it is found where you look for it — next to the class — and it uses `cls(...)` rather than `Vehicle(...)` so that a subclass calling `Reusable.from_config(cfg)` gets a `Reusable`.

`delta_v` is a staticmethod because it is the rocket equation: it needs an Isp and a mass ratio, not a vehicle. It can be called on the class or on an instance, and `ideal_delta_v` calls it through `self` to supply this vehicle's numbers. Note that a staticmethod gets no `cls`, which is why it has to say `Vehicle.G0` explicitly.

`G0` is a *class attribute*: one object, shared, reachable as `Vehicle.G0` or through any instance. That is the right home for a physical constant — it is a fact about the world, not about one vehicle.
:::

::: warning
A class attribute that is *mutable* is shared in a way almost nobody intends. This is the same trap as a mutable default argument, wearing different clothes:

```python
# shared.py
class SensorShared:
    faults = []  # one list, shared by every instance

    def __init__(self, name):
        self.name = name

    def report(self, code):
        self.faults.append(code)


class Sensor:
    def __init__(self, name):
        self.name = name
        self.faults = []  # one list per instance

    def report(self, code):
        self.faults.append(code)


imu, gps = SensorShared("imu"), SensorShared("gps")
imu.report("bias jump")
print("shared:", gps.faults, imu.faults is gps.faults)

imu, gps = Sensor("imu"), Sensor("gps")
imu.report("bias jump")
print("per instance:", gps.faults, imu.faults is gps.faults)
```

```bash
python3 shared.py
# shared: ['bias jump'] True
# per instance: [] False
```

The GPS reported the IMU's fault, because `self.faults.append(...)` mutated the one list the class owns. Immutable class attributes such as `G0 = 9.80665` are fine; anything you will mutate belongs in `__init__`.
:::

## Check yourself

::: check
Why does `__init__` return `None` rather than the new object, and what happens if you write `return self` at the end of it?
:::

::: answer
Because `__init__` does not create the object. `Vehicle(...)` calls `Vehicle.__new__` to allocate the instance, then calls `__init__` on it to fill it in, then hands the instance back. `__init__` is an initialiser, and its return value is not used.

Returning anything other than `None` from it is an error: `TypeError: __init__() should return None, not 'Vehicle'`. If you want a method that builds and returns an object, that is a `@classmethod` alternative constructor, which is exactly what `from_config` is.
:::

::: check
`speed` is a property computed on every read. What would go wrong if you instead computed it once in `__init__` and stored `self.speed`?
:::

::: answer
It would be correct exactly until something changed `velocity`, and then it would be silently wrong. The stored number and the velocity it came from are two pieces of state that must agree, and nothing enforces the agreement; the propagator updates the velocity, nobody remembers to update the speed, and the log reports the speed the vehicle had at ignition for the rest of the flight.

The property has one source of truth. The general rule is to store what is independent and derive what follows from it, and to cache only when a measurement says the recomputation costs you something — at which point you cache *inside* the property and invalidate it in the setter that can change the inputs.
:::

::: check
When should a helper be a `@staticmethod` on a class rather than a module-level function?
:::

::: answer
When it belongs to the class's subject but needs no instance, and you want a reader to find it next to the class. `Vehicle.delta_v(isp, ratio)` reads as "the rocket equation, which is part of what a Vehicle is about", and it comes along with the class when the class is imported.

If the helper is useful to code that never touches a `Vehicle`, a module-level function is better, because a static method on a class is an awkward import for anybody who wanted only the formula. And if the helper needs the class — to build an instance, or to read a class attribute that a subclass might override — it should be a `@classmethod`, not a static method, so that subclasses behave correctly.
:::

::: check
`from_config` is written `return cls(...)` rather than `return Vehicle(...)`. What breaks if you write the second, and when?
:::

::: answer
Nothing breaks until somebody subclasses. `class Reusable(Vehicle)` with extra landing-propellant bookkeeping then finds that `Reusable.from_config(cfg)` returns a plain `Vehicle`: the classmethod hard-coded the class it builds, so the subclass's `__init__` never runs and none of its attributes exist. The failure appears as an `AttributeError` on the first use of a subclass-only attribute, far from the constructor that caused it.

`cls` is bound to the class the method was called on, so `Reusable.from_config(cfg)` calls `Reusable(...)`. This is the entire reason `@classmethod` exists rather than `@staticmethod` for alternative constructors.
:::

::: check
A `Mission` class has `waypoints = []` as a class attribute. Two missions are created and one has three waypoints added. What does the other report, and what is the one-line fix?
:::

::: answer
The other reports the same three waypoints, and `m1.waypoints is m2.waypoints` is `True`. There is one list, owned by the class, and `self.waypoints.append(...)` mutates it through whichever instance happens to be at hand.

The fix is to create the list per instance, in `__init__`: `self.waypoints = []`. Note the failure only shows up with mutation — `self.waypoints = [wp]` would *rebind* the name on the instance and shadow the class attribute, leaving the other mission's view intact, which is why the bug is intermittent and confusing. Assignment shadows; mutation shares.
:::

## Summary

| Item | Statement |
| --- | --- |
| `class Name:` | Defines a type; `Name(...)` creates an instance and runs `__init__` on it |
| `__init__(self, ...)` | Initialises an existing object, returns `None`, is not a constructor |
| `self` | The instance, passed explicitly; `obj.m(x)` is `Class.m(obj, x)` |
| Attributes | Per-instance data, visible in `vars(obj)` |
| Methods | Behaviour stored on the class; accessed through an instance they are bound |
| Class attribute | One object shared by all instances; fine for constants, a trap when mutable |
| `@property` | Method read as an attribute; derive instead of store, add validation later without changing callers |
| `@name.setter` | The write path; store behind `self._name` to avoid infinite recursion |
| `@classmethod` | Receives `cls`; the idiomatic alternative constructor, `return cls(...)` |
| `@staticmethod` | Receives neither instance nor class; a related function housed with the class |
| Worked here | Upper stage, mass ratio 5.8421, ideal delta-v about 6.02 km/s |

The next lesson gives the class the behaviour of a built-in type: printing usefully, comparing correctly, adding, multiplying, and being looped over — the dunder methods, and the traps in `__eq__` in particular.
