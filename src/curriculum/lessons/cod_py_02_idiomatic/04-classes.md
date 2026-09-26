---
id: l04-classes
title: Classes: state, behavior and properties
minutes: 19
covers:
  - Classes: __init__, attributes vs methods, @property, @staticmethod, @classmethod
---

Think of the difference between a pile of sticky notes and a printed form. On sticky notes you can write anything: "mass 31500", "mas5 30000", a phone number. Nothing stops a typo, nothing says which notes belong together, and nothing checks that the mass is a sensible number. A printed form has fixed boxes with labels. It says exactly what goes on it. The office that uses the form also knows what to *do* with a filled-in one.

In Python, a dictionary is the pile of sticky notes and a **class** is the form. A class is a blueprint for a new kind of object: it says what data each object carries and what operations the object supports. Each object built from the blueprint is an **instance** of the class — one filled-in copy of the form.

A six-degree-of-freedom flight simulation carries a **[[state|six-dof]]**: time, position, velocity, attitude, spin rate, mass. Every function in the simulation takes a state and returns a state, so the first design decision anybody makes is how to hold one. The usual first answer is a dict. The usual second answer, a week later, is a class. This lesson shows why, and teaches the vocabulary: `__init__`, attributes and methods, `@property`, `@classmethod` and `@staticmethod`. The next lesson adds the special methods that make your class behave like one of Python's own types.

## What the dict version costs

Here is a state stored as a dict, with one derived quantity (speed) and two typos.

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

Three problems hide in those few lines.

The speed calculation is correct, but it lives at the call site. It will be copied into six other files, and one of those copies will get the square root wrong.

The misspelled `state.get("mas5", 0.0)` did not fail. It quietly returned `0.0`. In a mass-flow calculation that zero becomes a division by zero somewhere far away, and the traceback points at the wrong line.

The misspelled assignment `state["mas5"] = 30000.0` added a *sixth* key instead of failing. The dict now describes a state that does not exist: one with two masses.

A class fixes all three. It names the parts once, it keeps the operations next to the data, and it can refuse bad values.

## A class names the parts and holds the operations

```python
# state.py
import math


class State:
    """Vehicle state at one instant, in an Earth-centered inertial frame."""

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

Walk through it from the top.

`class State:` starts the blueprint. Everything indented under it belongs to the class. The string right under the `class` line is the **docstring** — a description that `help(State)` will show.

`def __init__(self, t, velocity, mass):` is the setup method. The name is read "dunder init" — **dunder** is short for "double underscore", the two underscores on each side. Python calls it for you when you write `State(12.5, ...)`.

`s = State(12.5, (410.0, -3.2, 88.0), 31500.0)` builds one instance and names it `s`. The dot in `s.t` is read "s dot t" and means "the `t` that belongs to `s`".

Now four things that are worth saying precisely.

**`__init__` is not a constructor.** By the time it runs, the object already exists and is empty. `__init__` fills it in and returns `None`. Whatever it assigns to `self` is what the object has. (The step that actually creates the empty object is a different method, `__new__`, which you will almost never write.)

**`self` is an ordinary parameter, and Python passes it for you.** `self` is the instance the method is working on. Writing `s.speed()` is shorthand for `State.speed(s)` — you can write the long form and it does the same thing. That is why every method's first parameter is `self`, and why forgetting it gives an error about the number of arguments rather than something mysterious.

**Converting and copying in `__init__` pays off.** The line `self.velocity = tuple(float(v) for v in velocity)` does two jobs. It turns each component into a float, so a caller who passes integers, or strings read from a file, still gets floats. And it copies the components into a **tuple** — a list that cannot be changed — so a caller who later edits the list they passed in cannot change this state behind its back.

**Attributes are data; methods are behavior.** `t`, `velocity` and `mass` are **attributes**: values stored separately in each instance. `speed` and `kinetic_energy` are **methods**: functions stored once on the class and shared by every instance. You can see the split:

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
# <function State.speed at 0x7fe960ba5d00>
# <bound method State.speed of <state.State object at 0x7fe960b92190>>
# True
```

Read the output line by line.

- `vars(s)` shows the instance's own data. It holds exactly the three attributes and no methods. It is, under the hood, **[[a dictionary|instance-dict]]** — but one that only the class's own code fills in.
- `State.speed` is a plain function that lives on the class.
- `s.speed` is that same function with `s` already attached as its first argument. That is what a **[[bound method|bound-method]]** means: a method glued to one instance.
- The last line confirms the two calls give the same answer.

The two hex numbers are memory addresses. They will differ on your machine; nothing else in that output will.

::: key
`__init__(self, ...)` initializes an already-created object and returns `None`. Instance data lives in the instance (`vars(obj)`); methods live on the class and are shared. `obj.method(args)` means `Class.method(obj, args)`.
:::

## @property: a method that reads like an attribute

Look at `s.speed()` and `s.mass`. Both are "a number belonging to this state", yet one has parentheses and one does not. The parentheses are an implementation detail — "this one is computed" — leaking into every place that uses it. Worse, if you later decide to store speed instead of computing it, or to compute mass instead of storing it, every one of those places has to change.

Think of a car's fuel gauge. You glance at it the same way whether it reads a float in the tank or a computer estimates the level from flow meters. How the number is produced is hidden behind the dial.

`@property` is that dial. The `@` line above a `def` is a **[[decorator|decorator-preview]]** — read `@property` as "at property" — and it changes the function underneath. A **property** is a method you read without parentheses:

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

Five things happened, one per output line.

1. `s.speed`, with no parentheses, ran a method and printed 419.35.
2. `s.mass = 29800.0` ran the **setter** — the method marked `@mass.setter`, which handles writes. It checked the value and stored it.
3. After `velocity` changed to all zeros, `s.speed` was 0.0 at once. Speed is worked out fresh at every read and never stored, so speed and velocity can never disagree.
4. Assigning a negative mass raised a `ValueError` right at the assignment, not later inside a propagator.
5. `speed` has no setter, so it is read-only, and writing to it raised `AttributeError`.

The wording of the last message, `property 'speed' of 'State' object has no setter`, is from Python 3.11. Older versions said `can't set attribute`. The exception type, `AttributeError`, is the part to write code against.

::: key
`@property` turns a method into a read-only attribute; `@name.setter` adds a write path that can validate. The value of this is that you may start with a plain attribute and add validation or derivation later **without changing a single caller**. That is why Python code does not begin life with `get_mass()` and `set_mass()` the way **[[Java|java-getters]]** code does.
:::

::: example A State class for a propagator, and what the property bought
Suppose `mass` began life as a plain attribute and the class shipped. Fifty places read `s.mass`, and a dozen assign it. Then a Monte Carlo run — thousands of simulated flights with randomized inputs — hits a propellant-depletion bug that drives the mass negative. The trajectory carries on quietly with a negative kinetic energy.

With a plain attribute, the fix means hunting down every assignment. With the property above, the fix is the eight lines of `mass` and `mass.setter`, and **no call site changes at all**. `s.mass` still reads. `s.mass = x` still writes. The invalid write now raises at the exact line where the bad value is produced:

```bash
python3 property_state.py
# 419.35
# 29800.0
# 0.0
# ValueError: mass must be positive, got -1.0
# AttributeError: property 'speed' of 'State' object has no setter
```

Two details trip people up.

First, the stored value has to go somewhere other than `self.mass`. If the setter wrote `self.mass = value`, that assignment would call the setter again, which would call it again, forever. The convention is a leading underscore, `self._mass`, which means "**[[internal|underscore]]** — do not touch from outside".

Second, `__init__` assigns `self.mass = mass`, not `self._mass = mass`, on purpose. That sends construction through the same check as any later assignment. So `State(12.5, (0, 0, 0), -5.0)` raises instead of building a state nobody can use.

Sanity check on the numbers: the speed is $\sqrt{410^2 + 3.2^2 + 88^2} \approx 419.35\,\mathrm{m/s}$. It is a little more than the biggest component, 410, as a length should be.

There is an honest cost. A property is a function call, so reading `s.speed` a million times inside an integration loop is a million calls. If profiling shows that matters, compute the value once, outside the loop. It is not a reason to avoid properties in general.
:::

## @classmethod and @staticmethod

A normal method receives the instance as its first argument. Two decorators change that.

A **class method**, marked `@classmethod`, receives the *class* as its first argument, named `cls` by convention, instead of an instance. Its main use is an **alternative constructor**: a second way to build an object, named for where the data came from. Think of a bakery that takes orders by phone or by web form. Either way you end up with the same cake; the bakery has two front doors.

A **static method**, marked `@staticmethod`, receives neither the instance nor the class. It is a plain function that lives inside the class because it belongs to the same subject, not because it needs any object.

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

The physics is the **[[Tsiolkovsky rocket equation|rocket-equation]]**:

$$\Delta v = I_{sp}\, g_0 \ln\!\left(\frac{m_0}{m_f}\right)$$

Read $\Delta v$ as "delta v", the change in speed the stage can give. $I_{sp}$ ("I sub s p") is the specific impulse in seconds. $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity, which turns seconds into an exhaust speed. $m_0$ is the mass at ignition and $m_f$ the mass at burnout. $\ln$ is the natural logarithm.

Now the numbers, step by step.

1. Burnout mass: dry plus payload, $m_f = 4{,}000 + 15{,}000 = 19{,}000\,\mathrm{kg}$.
2. Ignition mass: add the propellant, $m_0 = 19{,}000 + 92{,}000 = 111{,}000\,\mathrm{kg}$. The program printed the same.
3. Mass ratio: $111{,}000 / 19{,}000 \approx 5.8421$.
4. Its logarithm: $\ln 5.8421 \approx 1.7651$.
5. Exhaust speed: $348 \times 9.80665 \approx 3{,}413\,\mathrm{m/s}$.
6. Multiply: $3{,}413 \times 1.7651 \approx 6{,}024\,\mathrm{m/s}$, about 6.02 km/s.

That is a plausible upper-stage number. It is also an upper bound, because it ignores gravity and drag losses.

Three design points.

`from_config` is a class method, not a free function called `vehicle_from_config`. So it is found where you would look for it — next to the class. And it builds with `cls(...)`, not `Vehicle(...)`, so a subclass calling `Reusable.from_config(cfg)` gets a `Reusable`.

`delta_v` is a static method because it is the rocket equation itself. It needs an Isp and a mass ratio, not a vehicle. You can call it on the class, `Vehicle.delta_v(311.0, 3.5)`, or through an instance, which is what `ideal_delta_v` does with `self.delta_v(...)` to supply this vehicle's numbers. A static method gets no `cls`, which is why it has to spell out `Vehicle.G0`.

`G0` is a **class attribute**: one value, stored on the class, shared by all instances, reachable as `Vehicle.G0` or through any instance as `stage.G0`. That is the right home for a physical constant. It is a fact about the world, not about one vehicle.
:::

::: warning
A class attribute that can be *changed in place* — a list, a dict — is shared in a way almost nobody intends. It is the same trap as a mutable default argument, wearing different clothes:

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

The GPS reported the IMU's fault, because `self.faults.append(...)` changed the one list the class owns. (`is` asks "are these the very same object?", and the answer was `True`.) Unchangeable class attributes such as `G0 = 9.80665` are fine. Anything you will change belongs in `__init__`, where each instance gets its own. The reason the lookup reaches the class at all is the **[[search order for attributes|lookup-order]]**.
:::

## Check yourself

::: check
Why does `__init__` return `None` rather than the new object, and what happens if you write `return self` at the end of it?
:::

::: answer
Because `__init__` does not create the object. `Vehicle(...)` first calls `Vehicle.__new__` to make an empty instance, then calls `__init__` on it to fill it in, then hands the instance back to you. `__init__` is an initializer, and Python ignores its return value — as long as that value is `None`.

Returning anything else is an error: `TypeError: __init__() should return None, not 'Vehicle'`. If you want a method that builds and returns an object, that is a `@classmethod` alternative constructor, which is exactly what `from_config` is.
:::

::: check
`speed` is a property computed on every read. What would go wrong if you instead computed it once in `__init__` and stored it as `self.speed`?
:::

::: answer
It would be correct right up until something changed `velocity`, and then it would be silently wrong. The stored speed and the velocity it came from are two pieces of state that must agree, and nothing makes them agree. The propagator updates the velocity, nobody remembers to update the speed, and the log reports the speed at ignition for the rest of the flight.

The property has one source of truth. The general rule: store what is independent, derive what follows from it, and cache only when a measurement says the recomputing costs you something. At that point you cache *inside* the property, and clear the cache in the setter that can change the inputs.
:::

::: check
When should a helper be a `@staticmethod` on a class rather than a function at the top level of the module?
:::

::: answer
When it belongs to the class's subject but needs no instance, and you want a reader to find it next to the class. `Vehicle.delta_v(isp, ratio)` reads as "the rocket equation, which is part of what a Vehicle is about", and it comes along whenever the class is imported.

If the helper is useful to code that never touches a `Vehicle`, a module-level function is better. A static method is an awkward import for somebody who wanted only the formula. And if the helper needs the class — to build an instance, or to read a class attribute a subclass might override — it should be a `@classmethod`, so subclasses behave correctly.
:::

::: check
`from_config` is written `return cls(...)` rather than `return Vehicle(...)`. What breaks if you write the second form, and when?
:::

::: answer
Nothing breaks until somebody makes a **subclass** — a new class built on top of `Vehicle`, which lesson 7 covers. Say `class Reusable(Vehicle)` adds landing-propellant bookkeeping. Then `Reusable.from_config(cfg)` returns a plain `Vehicle`, because the method hard-coded which class it builds. The subclass's `__init__` never runs, and none of its extra attributes exist. The failure shows up as an `AttributeError` the first time something uses a subclass-only attribute, far from the constructor that caused it.

`cls` is bound to whichever class the method was called on, so `Reusable.from_config(cfg)` calls `Reusable(...)`. That is the whole reason alternative constructors are class methods and not static methods.
:::

::: check
A `Mission` class has `waypoints = []` as a class attribute. Two missions are created, and three waypoints are appended to the first. What does the second report, and what is the one-line fix?
:::

::: answer
The second reports the same three waypoints, and `m1.waypoints is m2.waypoints` is `True`. There is one list, owned by the class, and `self.waypoints.append(...)` changes it through whichever instance is at hand.

The fix is to make the list per instance, in `__init__`: `self.waypoints = []`.

Notice that the bug appears only when the list is *changed in place*. Writing `self.waypoints = [wp]` would instead create a new attribute on that one instance, which hides the class attribute and leaves the other mission alone. That is why the bug seems to come and go. Assignment shadows; mutation shares.
:::

## Summary

| Item | Statement |
| --- | --- |
| `class Name:` | Defines a type; `Name(...)` creates an instance and runs `__init__` on it |
| `__init__(self, ...)` | Initializes an existing object, returns `None`, is not a constructor |
| `self` | The instance, passed for you; `obj.m(x)` is `Class.m(obj, x)` |
| Attributes | Per-instance data, visible in `vars(obj)` |
| Methods | Behavior stored on the class; reached through an instance they are bound |
| Class attribute | One object shared by all instances; fine for constants, a trap when mutable |
| `@property` | Method read as an attribute; derive instead of store, add validation later without changing callers |
| `@name.setter` | The write path; store behind `self._name` to avoid endless recursion |
| `@classmethod` | Receives `cls`; the idiomatic alternative constructor, `return cls(...)` |
| `@staticmethod` | Receives neither instance nor class; a related function housed with the class |
| Worked here | Upper stage, mass ratio 5.8421, ideal delta-v about 6.02 km/s |

The next lesson makes your class behave like a built-in type: printing usefully, comparing correctly, adding, multiplying and being looped over. Those are the dunder methods, and the traps hidden in `__eq__` in particular.

::: context six-dof What "six degrees of freedom" means
A rigid body can move in six independent ways. It can slide along three directions (forward, sideways, up) and turn about three axes (roll, pitch, yaw). A **degree of freedom** is one of those independent ways to move, so a "6-DOF" simulation tracks all six.

To step such a simulation forward you need, at each instant, the position and velocity (three numbers each), the attitude and the spin rate (three or four numbers each), plus time and mass. Bundling those into one `State` object is exactly the job this lesson builds toward.
:::

::: context instance-dict Objects are dictionaries inside
Here is a nice irony. A normal Python object stores its attributes in a hidden dictionary called `__dict__`, and `vars(s)` hands you that dictionary. So the class did not get rid of the dict — it put a gatekeeper in front of it.

The gain is that only the class's own code decides which keys go in, methods live elsewhere and are shared, and properties can check values on the way in. In lesson 6 you will meet `slots=True`, which replaces this hidden dict with a fixed row of slots and saves memory.
:::

::: context bound-method Where methods and data live
Each instance holds only its data. The functions sit once on the class. When you write `s.speed`, Python finds `speed` on the class and glues `s` onto it as the first argument, making a bound method.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="200" y="20" width="145" height="120" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="272" y="40" font-size="13" font-weight="700" text-anchor="middle" fill="#1d6fd1">class State</text>
  <text x="212" y="66" font-size="12" fill="#1f2a44">__init__</text>
  <text x="212" y="88" font-size="12" fill="#1f2a44">speed</text>
  <text x="212" y="110" font-size="12" fill="#1f2a44">kinetic_energy</text>
  <text x="272" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">methods: stored once</text>
  <rect x="15" y="20" width="130" height="62" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="25" y="38" font-size="12" font-weight="700" fill="#1f2a44">s1</text>
  <text x="25" y="56" font-size="11" fill="#1f2a44">t=12.5  mass=31500</text>
  <text x="25" y="72" font-size="11" fill="#1f2a44">velocity=(410, …)</text>
  <rect x="15" y="100" width="130" height="62" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="25" y="118" font-size="12" font-weight="700" fill="#1f2a44">s2</text>
  <text x="25" y="136" font-size="11" fill="#1f2a44">t=0.0  mass=40000</text>
  <text x="25" y="152" font-size="11" fill="#1f2a44">velocity=(0, 0, 0)</text>
  <line x1="145" y1="51" x2="196" y2="70" stroke="#b4232c" stroke-width="2"/>
  <polygon points="200,72 190,64 188,74" fill="#b4232c"/>
  <line x1="145" y1="131" x2="196" y2="100" stroke="#b4232c" stroke-width="2"/>
  <polygon points="200,98 188,98 193,107" fill="#b4232c"/>
  <text x="180" y="172" font-size="11" text-anchor="middle" fill="#b4232c">each instance points to its class</text>
</svg>
```

A thousand states cost a thousand small data boxes, not a thousand copies of `speed`.
:::

::: context decorator-preview A first look at the @ sign
The line `@property` above `def speed` is shorthand. It means: define the function `speed`, then pass it to `property`, and keep what comes back under the name `speed`. Written out in full, it is `speed = property(speed)`.

`@classmethod` and `@staticmethod` work the same way. Lesson 9 opens decorators up properly and shows you how to write your own — for example one that times every call to a function.
:::

::: context java-getters The getters Python does not need
In Java, code usually starts with private fields and a pair of methods for each one: `getMass()` and `setMass(x)`. The reason is defensive. If a field were public and later needed checking, every caller would have to change from `v.mass` to `v.getMass()`. So Java programmers pay for the methods up front, in case they are ever needed.

Python's `@property` removes that reason. You start with a plain attribute. If checking is ever needed, you turn it into a property, and `v.mass` keeps working everywhere. Writing `get_mass()` in Python is a sign someone brought a habit from another language.
:::

::: context underscore What a leading underscore promises
Python has no truly private attributes. A single leading underscore, as in `_mass`, is a polite sign that says "internal detail, may change, please do not use from outside". Nothing enforces it; tools and readers respect it.

Two leading underscores, as in `__mass`, trigger **name mangling**: Python quietly renames it to `_State__mass` so that a subclass cannot clash with it by accident. That is for avoiding name collisions, not for secrecy, and most code sticks with one underscore.
:::

::: context rocket-equation The equation and its numbers
Konstantin Tsiolkovsky, a Russian schoolteacher, published this equation in 1903. It says the speed change a rocket can give depends on its exhaust speed and on the *ratio* of full mass to empty mass, not on the size of the rocket.

The upper stage in the example, drawn to scale by mass (the full bar is 111,000 kg):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="34" width="43.2" height="32" fill="#6c7a93"/>
  <rect x="63.2" y="34" width="11.5" height="32" fill="#1f2a44"/>
  <rect x="74.7" y="34" width="265.3" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="41.6" y="26" font-size="11" text-anchor="middle" fill="#1f2a44">payload 15 t</text>
  <line x1="69" y1="34" x2="92" y2="20" stroke="#1f2a44" stroke-width="1"/>
  <text x="95" y="18" font-size="11" fill="#1f2a44">dry 4 t</text>
  <text x="207" y="55" font-size="12" text-anchor="middle" fill="#1f2a44">propellant 92 t</text>
  <path d="M20,74 L20,80 L74.7,80 L74.7,74" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="47" y="94" font-size="11" text-anchor="middle" fill="#b4232c">burnout 19 t</text>
  <path d="M20,98 L20,104 L340,104 L340,98" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="200" y="117" font-size="11" text-anchor="middle" fill="#1d6fd1">ignition 111 t</text>
</svg>
```

A tonne (t) is 1,000 kg. Most of the stage is propellant, which is why the ratio is almost 6.
:::

::: context lookup-order Instance first, then class
When you read `obj.name`, Python looks in the instance's own dictionary first. Only if the name is not there does it look on the class. That one rule explains both halves of the shared-list trap.

`self.faults.append(x)` *reads* `faults`, finds nothing on the instance, finds the class's list, and changes that list — so every instance sees the change. `self.faults = [x]` *writes*, and a write always goes into the instance's own dictionary. It creates a new, private attribute that hides the class one from then on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="30" width="140" height="80" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="85" y="22" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">1. instance imu</text>
  <text x="27" y="56" font-size="12" fill="#1f2a44">name = "imu"</text>
  <text x="27" y="80" font-size="11" fill="#6c7a93">no "faults" here</text>
  <rect x="205" y="30" width="140" height="80" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="275" y="22" font-size="12" font-weight="700" text-anchor="middle" fill="#1d6fd1">2. class SensorShared</text>
  <text x="217" y="56" font-size="12" fill="#1f2a44">faults = [ ]</text>
  <text x="217" y="80" font-size="12" fill="#1f2a44">report</text>
  <line x1="155" y1="70" x2="197" y2="70" stroke="#b4232c" stroke-width="2"/>
  <polygon points="203,70 193,65 193,75" fill="#b4232c"/>
  <text x="180" y="135" font-size="11" text-anchor="middle" fill="#b4232c">not found on the instance? look on the class</text>
</svg>
```

The same rule is why `stage.G0` works: `G0` is not on the instance, so Python finds it on the class.
:::
