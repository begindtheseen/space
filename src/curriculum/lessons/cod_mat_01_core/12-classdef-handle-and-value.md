---
id: l12-classdef-handle-and-value
title: Classes in MATLAB, and handle versus value
minutes: 20
covers:
  - 'MATLAB OOP: classdef, handle versus value semantics'
---

Suppose you print a worksheet and hand a copy to a friend. She scribbles all over her copy. Yours is still clean, because a photocopy is a separate piece of paper. Now suppose instead you send her a link to a shared online document. When she types in it, you see her typing, because there is only one document and you both have a way to reach it.

MATLAB objects come in exactly these two kinds. A **value** object behaves like the photocopy: every time you assign it or pass it to a function, the receiver gets an independent copy. A **handle** object behaves like the shared link: everyone who holds it reaches the same single object, and a change made by anyone is seen by everyone. Which one you choose decides whether an update in one part of a simulation shows up in another part or silently vanishes.

In lesson 9 you saw that ordinary MATLAB arrays are passed by value, and in the last lesson you learned to check what a function accepts. This lesson bundles data and the functions that act on it into a **class**, using MATLAB's `classdef` syntax, and then settles the handle-versus-value choice. On a GNC team you will meet both kinds constantly: a small value class for a state vector or an orbit, a handle class for the one spacecraft that every subsystem in a simulation must share.

## Classes and objects

A **class** is a blueprint: it says what data a thing carries and what it can do. An **object** is one thing built from that blueprint, as a **[[cookie from a cookie cutter|cookie-cutter]]** is one cookie from the cutter's shape. You already use this in Python, where `class Tank:` defines a blueprint and `Tank(500)` builds an object.

A class has two main parts:

- **Properties**, the named pieces of data each object carries, such as a position or a mass. They work like the fields of a struct.
- **Methods**, the functions that belong to the class and act on its objects.

One special method, the **constructor**, has the same name as the class. It runs when an object is created and sets up its properties.

### A first classdef file

In MATLAB, a class lives in its own file, named after the class. Here is `StateVec.m`, a small class for a spacecraft's position and velocity:

```matlab
% StateVec.m
classdef StateVec
    properties
        Position = [0 0 0]     % m
        Velocity = [0 0 0]     % m/s
    end

    methods
        function obj = StateVec(r, v)          % the constructor
            if nargin > 0
                obj.Position = r;
                obj.Velocity = v;
            end
        end

        function obj = coast(obj, dt)          % move for dt seconds
            obj.Position = obj.Position + obj.Velocity * dt;
        end

        function s = speed(obj)
            s = norm(obj.Velocity);
        end
    end
end
```

Read it from the top. `classdef StateVec` opens the class. The `properties` block lists the data, each with a default value. The `methods` block holds the functions. Every method takes the object as its first input, by convention called `obj`, which plays the role of `self` in Python.

The constructor checks `nargin > 0`, the tool from the last lesson, because MATLAB sometimes needs to build an object with no inputs at all (for example, when it creates an empty array of them). With no inputs, the defaults stay.

You call a method in either of two ways, and they mean the same thing:

```matlab
a = StateVec([0 0 400e3], [7670 0 0]);   % 400 km up, 7.67 km/s
a.speed()
% ans = 7670
speed(a)
% ans = 7670
```

### Properties can carry checks

Everything you learned about arguments blocks works on properties too. A property can declare a size, a class, validators and a default in the same order:

```matlab
properties
    Mass (1,1) double {mustBeNonnegative} = 0     % kg
end
```

Now any attempt to set `Mass` to a vector or to $-5$ errors at the moment of assignment, wherever in the program it happens. That turns a class into a guard for its own data.

::: key
A `classdef` file named after the class holds a `properties` block (the data) and a `methods` block (the functions). The constructor has the class's name and returns the new object. Call a method as `obj.method(args)` or `method(obj, args)`. Properties can declare size, class, validators and defaults, like an arguments block.
:::

## Value classes: every copy is its own

A class written as plain `classdef StateVec` is a **value class**. That is MATLAB's default. It behaves exactly like a number or an array: assigning it copies it, and passing it to a function copies it.

That has a big consequence for methods. A method on a value class cannot reach back and change the caller's object. It receives a copy, changes the copy, and must **return** the changed copy. The caller then has to **assign** that result back. That is why `coast` is written `function obj = coast(obj, dt)`, with `obj` both in and out.

::: example Coasting a state vector, the value way
A spacecraft is $400\,\mathrm{km}$ up and moving at $7670\,\mathrm{m/s}$ along $x$. Copy its state, then coast the copy for $10\,\mathrm{s}$ in a straight line.

```matlab
a = StateVec([0 0 400e3], [7670 0 0]);
b = a;                 % b is an independent copy
b = b.coast(10);       % coast the copy and keep the result
b.Position
% ans = 76700      0   400000
a.Position
% ans = 0      0   400000      <- a is untouched

a.coast(10);           % result thrown away!
a.Position
% ans = 0      0   400000      <- still untouched
```

**Step 1.** `b = a` makes a separate object. From here on, `a` and `b` share nothing.

**Step 2.** `b.coast(10)` computes $x = 0 + 7670 \times 10 = 76\,700\,\mathrm{m}$ and returns a changed copy. `b = ...` stores it.

**Step 3.** `a.coast(10);` also computes a changed copy, but nobody stores it, so it disappears. `a` is exactly as it was.

**Sanity check.** $76.7\,\mathrm{km}$ in $10\,\mathrm{s}$ is $7.67\,\mathrm{km/s}$, the speed we started with, so the arithmetic fits. (A real orbit curves; this straight-line coast is only a short-time sketch.)
:::

::: warning The silent no-op
`a.coast(10);` on a value class runs without any error and changes nothing. This is the most common value-class bug, and Python programmers write it all the time, because in Python a method changes its object in place. With a value class, every call that changes the object must be written `a = a.coast(10);`.
:::

Why is value the default? Because it is safe. A function that receives a value object cannot damage the caller's copy, the same guarantee MATLAB gives for arrays. And copying is cheaper than it sounds: MATLAB uses the same copy-on-write trick you met in lesson 9, so a copy costs nothing until someone actually changes it.

## Handle classes: one object, many names

To make a handle class, add `< handle` to the first line. Read `<` here as "is a kind of": the class **[[inherits|inheritance]]** from MATLAB's built-in `handle` class, which means it takes on all of `handle`'s behavior.

```matlab
% FuelTank.m
classdef FuelTank < handle
    properties
        Mass            % kg of propellant left
    end

    methods
        function obj = FuelTank(m0)
            obj.Mass = m0;
        end

        function drain(obj, mdot, dt)
            % Burn mdot kg/s for dt seconds; never go below empty.
            obj.Mass = max(obj.Mass - mdot * dt, 0);
        end
    end
end
```

Look at `drain`. It returns nothing. It does not need to. A variable holding a handle object does not hold the object itself; it holds a **reference**, a way to reach the one object stored elsewhere in memory. Copying the variable copies the reference, not the object. So `obj` inside `drain` reaches the very same tank the caller has, and the change sticks.

::: example Draining a shared tank
A tank starts with $500\,\mathrm{kg}$ of propellant. The engine burns $2.5\,\mathrm{kg/s}$. One part of the code burns for $60\,\mathrm{s}$, then a separate function burns for $40\,\mathrm{s}$.

```matlab
% burnFor.m
function burnFor(tank, seconds)
    tank.drain(2.5, seconds);     % 2.5 kg/s
end
```

```matlab
t1 = FuelTank(500);
t2 = t1;                 % a second name for the SAME tank
t2.drain(2.5, 60);
t1.Mass
% ans = 350
burnFor(t1, 40);         % the function changes the caller's tank
t1.Mass
% ans = 250
t1 == t2
% ans = logical 1   (true: both names reach one object)
```

**Step 1.** `t2 = t1` copies the reference. There is still only one tank.

**Step 2.** Draining through `t2` removes $2.5 \times 60 = 150\,\mathrm{kg}$, so the tank has $500 - 150 = 350\,\mathrm{kg}$. Reading through `t1` shows it, because it is the same tank.

**Step 3.** `burnFor` receives a copy of the reference, which still reaches the same tank. It removes $2.5 \times 40 = 100\,\mathrm{kg}$, leaving $250\,\mathrm{kg}$, and the caller sees the change with no return value and no reassignment.

**Step 4.** For handle objects, `==` asks "are these the same object?", not "do they have equal properties?". A brand new `FuelTank(500)` compared with `t1` would give false, even with equal masses.

**Sanity check.** A total of $100\,\mathrm{s}$ of burning at $2.5\,\mathrm{kg/s}$ is $250\,\mathrm{kg}$, half the load, and half of $500\,\mathrm{kg}$ remains.
:::

When two names reach the same object, programmers call it **[[aliasing|aliasing]]**. It is the whole point of a handle class, and also its danger. If a function you did not write keeps a copy of your handle and changes the object later, your data changes under you.

If you really need an independent copy of a handle object, `b = a` will not give you one. MATLAB offers a mix-in class, `matlab.mixin.Copyable`, to inherit from instead of `handle`; it adds a `copy` method that makes a new object with the same property values. To destroy a handle object, call `delete(obj)`; afterwards `isvalid(obj)` returns false for every name that referred to it.

::: key
A value class copies on assignment, so passing it to a function cannot mutate the caller copy. A handle class is a reference, so mutation is visible everywhere. Use handle when the object models a single shared entity, and expect Python users to be surprised by the value default.
:::

::: warning A handle as a property default is shared
Property defaults are worked out once, when MATLAB first loads the class, not each time you build an object. For a number that makes no difference. But if a default is itself a handle object — say `Tank = FuelTank(500)` in a `Spacecraft` class's properties — then every `Spacecraft` gets the *same* tank, and draining one drains them all. Create handle-object properties inside the constructor instead, so each object gets its own. This is the MATLAB cousin of Python's **[[mutable default argument|shared-default]]** trap.
:::

## Choosing between them

The choice is about what the object *is* in the world you are modeling.

**Choose value** when the object is a piece of data — something you could write on a card and hand over. A state vector at one instant, an orbit's six numbers, a quaternion, a set of controller gains, one row of telemetry. Two state vectors with the same numbers are, for every purpose, the same state. Copies are safe, functions cannot damage your version, and code reads like arithmetic: `s2 = s1.coast(10)`.

**Choose handle** when the object is one particular thing that several parts of a program must all see. The spacecraft in a closed-loop simulation, updated by the dynamics and read by the sensors, the navigation filter and the logger. A connection to a piece of test hardware. A logger that many functions write into. There is exactly one of each, and if every subsystem got its own copy, they would drift apart. MATLAB's own **[[figure windows|graphics-handles]]** are handle objects for exactly this reason.

| Question | Value class | Handle class |
|---|---|---|
| First line | `classdef Name` | `classdef Name < handle` |
| `b = a` gives | an independent copy | a second name for one object |
| Method that changes it | returns `obj`; caller writes `a = a.m()` | returns nothing; change sticks |
| Passing to a function | function gets a copy | function reaches the original |
| `==` means | an error, unless the class defines it | same object |
| Good for | data: states, orbits, gains | entities: a vehicle, a logger, hardware |

::: note Why Python programmers get surprised
In Python every object is reached through a reference, as if every class were a handle class. `b = a` never copies, and a function that receives an object can change it. So a Python programmer who writes their first MATLAB class, leaves off `< handle`, and writes `sc.setMass(900);` expecting the mass to change, gets a program that runs, prints nothing wrong, and ignores every update. Knowing that MATLAB defaults to value is the whole cure. When you translate a Python class, decide deliberately: is this data (value), or one shared thing (handle)?
:::

::: example Choosing for a flight simulation
A **[[six-degree-of-freedom|six-dof]]** simulation has these classes. Decide value or handle for each.

1. `OrbitElements`, holding six numbers that describe an orbit.
2. `Vehicle`, the one simulated spacecraft, updated each time step by the dynamics and read by the guidance, the sensors and the plotter.
3. `Gains`, three [[PID gains|pid-gains]] for a pitch controller.
4. `TelemetryLog`, which many functions append records to during a run.

**Step 1.** `OrbitElements` is data. Two orbits with equal numbers are equal. **Value.**

**Step 2.** `Vehicle` is one entity that four subsystems must all see the same way. If guidance held its own copy, it would steer by a stale vehicle. **Handle.**

**Step 3.** `Gains` is data, and value semantics protect it: a function that tries out a gain change on its copy cannot accidentally retune the real controller. **Value.**

**Step 4.** `TelemetryLog` must collect records from everywhere into one place. With a value class, every function's appended records would vanish when the function returned, unless each one handed the log back. **Handle.**

**Sanity check.** Ask of each: "if two parts of the code had separate copies, would anything break?" For the orbit and the gains, no. For the vehicle and the log, yes. That question and the answers agree.
:::

## Check yourself

::: check
A value class `Counter` has a property `N = 0` and a method `function obj = up(obj), obj.N = obj.N + 1; end`. What does this print, and how would you fix it?

```matlab
c = Counter();
c.up(); c.up();
disp(c.N)
```
:::

::: answer
It prints `0`. `Counter` is a value class, so each `c.up()` works on a copy, returns the changed copy, and the result is thrown away. Two fixes: write `c = c.up();` each time, or make the class a handle class (`classdef Counter < handle`) and drop the output from `up`, so the change sticks on the one object.
:::

::: check
With the handle class `FuelTank` from this lesson, what is `x.Mass` at the end?

```matlab
x = FuelTank(800);
y = x;
z = FuelTank(800);
y.drain(4, 50);
z.drain(4, 100);
```
:::

::: answer
`x.Mass` is 600. `y = x` makes `y` a second name for the tank `x` refers to, so `y.drain(4, 50)` removes $4 \times 50 = 200\,\mathrm{kg}$ from that tank: $800 - 200 = 600$. `z` is a separate tank built by its own constructor call, so draining it (down to 400) does not touch `x`.
:::

::: check
Write the first line and the `properties` block of a value class `Burn` whose `DeltaV` must be a nonnegative scalar double in m/s with default 0, and whose `Axis` must be a 1-by-3 double with default `[1 0 0]`.
:::

::: answer
```matlab
classdef Burn
    properties
        DeltaV (1,1) double {mustBeNonnegative} = 0   % m/s
        Axis   (1,3) double = [1 0 0]
    end
end
```

It has no `< handle`, so it is a value class, MATLAB's default. The property declarations use the same size-class-validator-default order as an arguments block.
:::

::: check
A `Spacecraft` handle class declares the property `Tank = FuelTank(500)`. A script builds `s1 = Spacecraft()` and `s2 = Spacecraft()`, then drains `s1.Tank` by 100 kg. What is `s2.Tank.Mass`, and why?
:::

::: answer
It is 400. The default `FuelTank(500)` was evaluated once, when the class was loaded, so both spacecraft hold references to the same tank object. Draining it through `s1` drains it for `s2` too. The fix is to leave the property without a handle default and build it in the constructor, `obj.Tank = FuelTank(500);`, so each spacecraft gets its own tank.
:::

::: check
Explain in one or two sentences why a quaternion class should be a value class.
:::

::: answer
A quaternion is a piece of data: two with the same four numbers describe the same orientation, and nobody needs to share one particular quaternion object. As a value class, code like `q2 = q1.normalize()` cannot accidentally change `q1`, which keeps attitude math as predictable as ordinary arithmetic.
:::

## Summary

| Idea | Meaning | In MATLAB |
|---|---|---|
| Class | a blueprint for data plus behavior | `classdef Name ... end` in `Name.m` |
| Property | a named piece of an object's data | `properties` block, optional size, class, validators, default |
| Method | a function belonging to the class | `methods` block; `obj.m(x)` or `m(obj, x)` |
| Constructor | builds and sets up a new object | method named like the class, returns `obj` |
| Value class | copies on assignment and on calls | default; changing methods return `obj` |
| Handle class | a reference to one shared object | `classdef Name < handle` |
| Aliasing | two names reaching one object | `b = a` with a handle |
| Handle `==` | same object, not equal properties | `t1 == t2` |
| Shared default trap | a handle default is made once and shared | build handle properties in the constructor |

Next lesson: you can now write clean, well-guarded MATLAB. The next lesson measures how fast it runs — with the Profiler and `tic`/`toc` — and shows how preallocation, vectorization and `parfor` turn a slow script into a fast one.

::: context cookie-cutter Blueprint and thing
A cookie cutter is not a cookie. It fixes the shape, and every cookie pressed from it has that shape but its own dough, its own sprinkles, its own bite marks. A class fixes which properties and methods exist; each object has its own property values. Programmers say an object is an **instance** of its class, and "instantiating" a class means building an object from it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="30" width="110" height="80" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="70" y="62" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">class FuelTank</text>
  <text x="70" y="82" font-size="11" fill="#6c7a93" text-anchor="middle">Mass, drain()</text>
  <line x1="130" y1="60" x2="200" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="130" y1="80" x2="200" y2="105" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="205" y="15" width="140" height="40" rx="8" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="275" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">object: Mass = 500</text>
  <rect x="205" y="85" width="140" height="40" rx="8" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="275" y="110" font-size="12" fill="#1f2a44" text-anchor="middle">object: Mass = 120</text>
</svg>
```
:::

::: context inheritance Taking on a parent's behavior
**Inheritance** lets a new class start from an existing one and get all its properties and methods for free, adding its own on top. The existing class is the **superclass** (or parent); the new one is the **subclass**. `FuelTank < handle` makes `FuelTank` a subclass of MATLAB's built-in `handle` class, which is what gives it reference behavior, identity comparison with `==`, and `delete`. A value class inherits from nothing at all. Python writes the same idea as `class FuelTank(Base):`.
:::

::: context aliasing Two names, one tank
With a value class, `b = a` makes a second object. With a handle class, it makes a second arrow pointing at the one object. Anything done through either arrow happens to that one object.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">value: b = a</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">handle: t2 = t1</text>
  <line x1="180" y1="6" x2="180" y2="154" stroke="#6c7a93" stroke-width="1"/>
  <text x="30" y="55" font-size="12" fill="#1f2a44">a</text>
  <text x="30" y="120" font-size="12" fill="#1f2a44">b</text>
  <rect x="50" y="36" width="110" height="30" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="105" y="56" font-size="12" fill="#1f2a44" text-anchor="middle">x = 0</text>
  <rect x="50" y="101" width="110" height="30" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="105" y="121" font-size="12" fill="#1f2a44" text-anchor="middle">x = 76700</text>
  <text x="200" y="55" font-size="12" fill="#1f2a44">t1</text>
  <text x="200" y="120" font-size="12" fill="#1f2a44">t2</text>
  <line x1="218" y1="51" x2="262" y2="76" stroke="#b4232c" stroke-width="2"/>
  <line x1="218" y1="116" x2="262" y2="92" stroke="#b4232c" stroke-width="2"/>
  <rect x="265" y="67" width="85" height="34" rx="5" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="307" y="89" font-size="12" fill="#1f2a44" text-anchor="middle">Mass = 250</text>
</svg>
```
:::

::: context shared-default The same trap in two languages
In the Python module you met `def f(items=[])`, where the default list is created once and shared by every call that leaves it out. MATLAB property defaults follow the same rule: evaluated once, when the class is first loaded. For numbers and strings, which are values, sharing is harmless. For a handle object, it means one object quietly shared by every instance. The cure is the same in both languages: make the fresh object at call time — in Python with `None` and a test, in MATLAB inside the constructor.
:::

::: context graphics-handles Graphics are handles too
When you run `f = figure;` the variable `f` is a handle to the figure window, and `ax = gca` gives a handle to the current axes. Setting `ax.YLim = [0 10]` changes the plot on screen at once, because there is only one axes and `ax` reaches it. A value copy of a window would make no sense. Since R2014b, MATLAB graphics objects are handle objects, which is why the plotting lesson later in this module can change a figure after drawing it.
:::

::: context six-dof Six ways to move
A rigid body can move in six independent ways: it can slide along three axes (forward-back, left-right, up-down) and turn about three axes (roll, pitch, yaw). A **six-degree-of-freedom** or 6-DOF simulation tracks all six at once, which is what GNC engineers use to test a vehicle's guidance and control before it flies. A 3-DOF simulation tracks only the sliding motions and treats the vehicle as a point.
:::

::: context pid-gains Three knobs of a controller
A **PID controller** computes a command from an error — the gap between where the vehicle points and where it should point. **P** (proportional) pushes in proportion to the error now, **I** (integral) pushes against error that has built up over time, and **D** (derivative) pushes against how fast the error is changing. Each has a gain, a number saying how hard to push. Tuning those three numbers is a large part of control design, and it comes back in the GNC toolbox module.
:::
