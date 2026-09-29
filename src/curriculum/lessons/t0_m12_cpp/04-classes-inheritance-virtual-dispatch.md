---
id: l04-classes-inheritance-virtual-dispatch
title: Classes, inheritance and the cost of virtual dispatch
minutes: 24
covers:
  - classes, inheritance, virtual dispatch and its cost
---

Think of a vending machine. You can push its buttons and feed it coins, and that is all. You cannot reach inside and change its coin count. Because the only way in is through the buttons, the machine keeps its books straight: the money in the box always matches what was sold.

A C++ **class** is a vending machine for data. It hides its numbers inside and offers a short list of operations — its buttons — that are the only way to change them. This lesson shows how to build one, how one class can be declared "a kind of" another (**inheritance**), and how a program can decide *while it runs* which version of an operation to call (**virtual dispatch**) — and what that choice costs.

On a vehicle: a controller's memory of past errors, a quaternion that must stay unit length, a telemetry buffer whose indices must stay in range — each is a class guarding its own numbers. And the attitude estimator reads rotation rates from a `RateSensor` without knowing whether a real gyro driver or a simulated gyro is behind it. That trick lets the same compiled flight code run on a desk, in the **[[hardware-in-the-loop rig|hil-rig]]**, and on the vehicle.

## Classes guard a promise

A promise about the data that must always be true is called an **[[invariant|invariant-word]]**. "The integrator advances exactly once per `update`." "This buffer never holds more than `N` items." A class keeps such a promise by making its data **private** (only the class's own functions can touch it) and offering **public** functions (anyone can call them) that each keep the promise.

The rule is short:

- the **constructor** — the function that runs when an object is created — makes the promise true;
- every public member function keeps it true.

In C++ a `class` and a `struct` are the same thing with one difference: a `class` makes its members private unless you say otherwise, and a `struct` makes them public. Use `struct` for plain bundles of numbers, `class` for things with a promise.

::: example A PID controller as a class
A **PID controller** turns an error (how far you are from where you want to be) into a command. It adds three terms: one **P**roportional to the error, one to its **I**ntegral (running total over time), and one to its **D**erivative (how fast it is changing). The running total and the previous error are the controller's memory, and nobody outside should change them.

```cpp
#include <algorithm>
#include <iostream>

struct PidGains {
  double kp, ki, kd;
};

class PidController {
 public:
  PidController(PidGains gains, double dt_s, double output_limit)
      : gains_(gains), dt_s_(dt_s), limit_(output_limit) {}

  // One control step. Not const: it advances the integrator state.
  double update(double error) {
    integral_ += error * dt_s_;
    const double derivative = (error - previous_error_) / dt_s_;
    previous_error_ = error;
    const double raw = gains_.kp * error + gains_.ki * integral_ + gains_.kd * derivative;
    return std::clamp(raw, -limit_, limit_);
  }

  void reset() { integral_ = 0.0; previous_error_ = 0.0; }
  double integral() const { return integral_; }

 private:
  PidGains gains_;
  double dt_s_;
  double limit_;
  double integral_ = 0.0;         // default member initialisers
  double previous_error_ = 0.0;
};

int main() {
  PidController pitch({.kp = 2.0, .ki = 0.5, .kd = 0.1}, 0.01, 5.0);
  const double errors[] = {1.0, 0.8, 0.5, 0.2, 0.0};
  for (double e : errors) {
    std::cout << "error " << e << " -> command " << pitch.update(e) << "\n";
  }
  std::cout << "integral = " << pitch.integral() << "\n";
  return 0;
}
// Output:
// error 1 -> command 5
// error 0.8 -> command -0.391
// error 0.5 -> command -1.9885
// error 0.2 -> command -2.5875
// error 0 -> command -1.9875
// integral = 0.025
```

The line after the constructor's parameters, starting with a colon, is the **member initializer list**: `gains_(gains)` sets the member `gains_` from the parameter `gains`. The last two members get **default member initializers** instead — the `= 0.0` where they are declared — so every constructor starts them at zero. The trailing underscore marks private data and keeps the member `integral_` from clashing with the function `integral()`.

`update` is not `const`: it changes the controller's memory. `integral()` *is* `const` — it only reads — so telemetry holding a read-only reference can call it.

Check the first two lines by hand. The time step is $0.01\,\mathrm{s}$.

**First call**, error $1$. The error jumped from $0$ to $1$ in one step, so the derivative is $(1 - 0)/0.01 = 100$ and the D term is $0.1 \times 100 = 10$. The P term is $2 \times 1 = 2$. The running total is $1 \times 0.01 = 0.01$, so the I term is $0.5 \times 0.01 = 0.005$. The raw command is $2 + 0.005 + 10 = 12.005$. That is above the limit of $5$, so `std::clamp` **[[saturates|saturation]]** it — cuts it to $5$. The output says 5.

**Second call**, error $0.8$. The running total grows to $0.01 + 0.8 \times 0.01 = 0.018$. The derivative is $(0.8 - 1)/0.01 = -20$. So the command is $2 \times 0.8 + 0.5 \times 0.018 + 0.1 \times (-20) = 1.6 + 0.009 - 2 = -0.391$. The output agrees.

After five calls the total is $0.01 \times (1 + 0.8 + 0.5 + 0.2 + 0) = 0.025$, the last line. Nothing outside the class could have set `integral_` any other way. That is the promise, kept.
:::

### Operators are functions with special names

A class or struct can define what `+`, `*` or `==` mean for it, through functions named `operator+`, `operator*` and so on. Numerical code then reads like the math, and the next lesson's propagator relies on it:

```cpp
struct Vec3 {
  double x, y, z;
  bool operator==(const Vec3&) const = default;   // memberwise, C++20
};
Vec3 operator+(const Vec3& a, const Vec3& b) { return {a.x + b.x, a.y + b.y, a.z + b.z}; }
Vec3 operator*(double s, const Vec3& v) { return {s * v.x, s * v.y, s * v.z}; }

// const Vec3 next = position + dt * velocity;   -> (7e+06, 75000, 0) for
// position (7000e3, 0, 0), velocity (0, 7.5e3, 0), dt = 10
```

Write arithmetic operators as **free functions** (outside the struct) taking `const` references and returning a new value. Write `= default` on `==` when "equal" means "every member equal". And give an operator only its usual meaning: `+` for adding vectors, yes; `<<` for "push into a buffer", no.

## Inheritance: "is a kind of"

A robin is a kind of bird. Anything true of every bird is true of a robin, so a sentence written about "a bird" works for a robin unchanged.

C++ writes that relationship as `class HardwareGyro : public RateSensor`. It says a `HardwareGyro` **is a** `RateSensor`. The words: `RateSensor` is the **base class**, and `HardwareGyro` is the **derived class**. Three things follow.

- Every `HardwareGyro` object contains a complete `RateSensor` inside it, called the **base subobject**.
- When a `HardwareGyro` is created, the `RateSensor` part is built first, then the rest.
- A reference or pointer to a `HardwareGyro` converts automatically to a reference or pointer to a `RateSensor`.

That last point is the whole reason for inheritance: code written against the base type works for every derived type, even ones not yet written.

Use "is a" only when you really want one type to stand in for another. A `PidController` is not a kind of `Vec3`; a class that needs a vector holds one as a member. That is **composition**, or "has a". Most GNC classes use composition only and keep inheritance for interfaces. A class may inherit from several bases (**multiple inheritance**); flight code uses that, if at all, to implement several interfaces.

## Virtual functions and interfaces

Think of a wall socket. It does not know whether you will plug in a lamp or a toaster. It promises a shape and a voltage, and anything built to that shape works — including a lamp made next year.

An **interface** in C++ is that socket. It lists the functions a sensor must provide and says nothing about how. Three keywords build it.

- **`virtual`** on a member function means: when called, run the version belonging to the object's *real* type — the type it was created as, called its **dynamic type** — not the type of the reference used to reach it (its **static type**).
- **`= 0`** after a virtual function makes it **pure virtual**: the base class gives no body, nobody can create a plain object of that class, and every derived class that wants to be created must supply the body.
- A class with only pure virtual functions and a **virtual destructor** is an interface. That is the shape most virtual functions in flight code take.

::: example A sensor interface with hardware and simulated versions
```cpp
#include <iostream>
#include <memory>

// An interface: pure virtual functions, virtual destructor, no data.
class RateSensor {
 public:
  virtual ~RateSensor() = default;
  virtual double read_rad_s() = 0;          // = 0: derived classes must implement
  virtual const char* name() const = 0;
};

class HardwareGyro final : public RateSensor {
 public:
  double read_rad_s() override { return 0.0123; }   // would talk to a register
  const char* name() const override { return "hardware"; }
};

class SimulatedGyro final : public RateSensor {
 public:
  explicit SimulatedGyro(double true_rate) : true_rate_(true_rate) {}
  double read_rad_s() override { return true_rate_ + 0.0005; }   // truth plus bias
  const char* name() const override { return "simulated"; }

 private:
  double true_rate_;
};

// The estimator depends only on the interface.
double filtered_rate(RateSensor& sensor, int samples) {
  double sum = 0.0;
  for (int i = 0; i < samples; ++i) sum += sensor.read_rad_s();
  return sum / samples;
}

struct PlainGyro { double read_rad_s() { return 0.0; } };   // same members, no virtual

int main() {
  HardwareGyro hw;
  SimulatedGyro sim(0.0100);
  std::cout << hw.name()  << ": " << filtered_rate(hw, 4) << " rad/s\n";
  std::cout << sim.name() << ": " << filtered_rate(sim, 4) << " rad/s\n";

  std::unique_ptr<RateSensor> chosen = std::make_unique<SimulatedGyro>(0.02);
  std::cout << "chosen at run time: " << chosen->name() << "\n";

  std::cout << "sizeof(PlainGyro)     = " << sizeof(PlainGyro) << "\n";
  std::cout << "sizeof(HardwareGyro)  = " << sizeof(HardwareGyro) << "\n";
  std::cout << "sizeof(SimulatedGyro) = " << sizeof(SimulatedGyro) << "\n";
  return 0;
}
// Output:
// hardware: 0.0123 rad/s
// simulated: 0.0105 rad/s
// chosen at run time: simulated
// sizeof(PlainGyro)     = 1
// sizeof(HardwareGyro)  = 8
// sizeof(SimulatedGyro) = 16
```

`filtered_rate` is compiled once and never names a gyro type. Given the simulated gyro, it averages four readings of $0.0100 + 0.0005 = 0.0105\,\mathrm{rad/s}$, which is the second line.

**`override`** asks the compiler to confirm that the base class has a virtual function with exactly that name and signature. Misspell `read_rad_s` as `read_rads` and you get `error: 'double Gyro::read_rads()' marked 'override', but does not override`, instead of a quiet new function that nothing ever calls.

**`final`** on a class forbids deriving from it further. It also helps speed: seeing a `final` class, the compiler knows which function a virtual call reaches and can call it directly — **devirtualising** it.

The `unique_ptr` (the owning pointer from lesson 3) holds a `RateSensor` whose real type was chosen at run time — in real code, from a configuration file or a hardware check. It is destroyed correctly because the destructor is `virtual`.

The `sizeof` lines (an object's size in bytes) hint at a cost. `PlainGyro` has no data and gets the minimum, one byte. `HardwareGyro` has no data either, yet is eight bytes: it carries a hidden pointer. `SimulatedGyro` is that pointer plus its `double`.
:::

::: warning A class with virtual functions needs a virtual destructor
Without one, deleting a derived object through a base pointer — which is exactly what a `std::unique_ptr` to the base does — destroys only the base part. The C++ standard calls that **[[undefined behavior|ub-bridge]]**: anything may happen. `virtual ~Base() = default;` costs nothing and is part of writing any interface.
:::

::: warning Polymorphic objects never travel by value
Passing a derived object *by value* to a function whose parameter is the base type copies only the base part, and the derived part is cut off. This is called **slicing**. Take a concrete base `Sensor` whose `name()` returns `"base"` and a derived `Gyro` whose `name()` returns `"gyro"`. With `void by_value(Sensor s)` and `void by_reference(const Sensor& s)`, calling both with a `Gyro` prints `base` from the first and `gyro` from the second. Objects used through a base type travel by reference or by pointer. A container of them holds `unique_ptr`s to the base, never base objects.
:::

## How dispatch works, and what it costs

Picture a restaurant where each table has a card listing its kitchen's phone number. To order, you look at the card, read the number, then dial. Two lookups before the call starts.

For every class with virtual functions, the compiler builds one fixed table, the **vtable** (virtual table). It holds the address of that class's version of each virtual function, in a fixed order. Every object of the class then stores, as its first hidden member, a pointer to its class's table: the **[[vtable pointer|vtable-picture]]**, often written *vptr*.

A call like `sensor.read_rad_s()` through a reference then compiles to three steps:

1. load the vtable pointer from the object;
2. load the function's address from the table's `read_rad_s` slot;
3. call whatever is at that address.

Two loads, the second waiting on the first, then an **indirect call** — a call to an address found at run time, where a normal call's target was fixed by the compiler.

Four costs follow. They are listed from least to most important.

1. **Object size.** Eight bytes per object, which matters only for very many small objects.
2. **The indirect call.** The processor guesses where an indirect call will go from where it went before. A right guess costs a few cycles; a wrong one costs roughly fifteen to twenty while the processor throws away work and refills its **[[pipeline|pipeline]]**. A call site that keeps switching versions guesses wrong often.
3. **No inlining.** **Inlining** means the compiler pastes a small function's body into the code that calls it, so there is no call at all. It cannot do that when it does not know which function will run. For `accel(x)`, whose whole body is two multiplications, that matters: inlined, the two operations would melt into the surrounding loop, and the compiler could process several elements at once. The virtual call pins the loop to one call per element.
4. **Analysability.** Flight software must prove its **[[worst-case execution time|wcet]]** (WCET), so the analyst must know which function each call can reach. For a virtual call the possible targets are finite — every override is in the program — but someone must list them all. NASA/JPL's **[[Power of Ten|power-of-ten]]** rules ban function pointers (rule 9, lesson 9), and a vtable is a table of function pointers underneath. Most standards allow virtual functions but keep them out of hot paths; some ban them outright.

::: example Measuring a virtual call
This benchmark calls a two-operation `accel` fifty million times, three ways:

- a virtual call through a base pointer, to one of two versions picked by data the compiler cannot predict;
- a `switch` on an `enum` (a small named list of choices);
- a direct call on a known concrete object.

```cpp
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <memory>
#include <vector>

class Model {
 public:
  virtual ~Model() = default;
  virtual double accel(double x) const = 0;
};
class Drag final : public Model {
 public:
  double accel(double x) const override { return -0.5 * x * x; }
};
class Gravity final : public Model {
 public:
  double accel(double x) const override { return -9.81 + 1e-6 * x; }
};

enum class Kind : std::uint8_t { Drag, Gravity };
double accel_switch(Kind k, double x) {
  switch (k) {
    case Kind::Drag:    return -0.5 * x * x;
    case Kind::Gravity: return -9.81 + 1e-6 * x;
  }
  return 0.0;
}

template <typename F>
double time_ns_per_call(F&& body, int n) {
  const auto t0 = std::chrono::steady_clock::now();
  const double result = body();
  const auto t1 = std::chrono::steady_clock::now();
  const double ns = std::chrono::duration<double, std::nano>(t1 - t0).count();
  std::printf("  (checksum %.3f)\n", result);
  return ns / n;
}

int main(int argc, char**) {
  const int n = 50'000'000;
  std::vector<std::unique_ptr<Model>> models;
  std::vector<Kind> kinds;
  for (int i = 0; i < 1024; ++i) {
    const bool drag = ((i * 7 + argc) % 3) != 0;   // pattern unknown at compile time
    if (drag) { models.push_back(std::make_unique<Drag>()); kinds.push_back(Kind::Drag); }
    else      { models.push_back(std::make_unique<Gravity>()); kinds.push_back(Kind::Gravity); }
  }

  std::printf("virtual call through base pointer:\n");
  const double v = time_ns_per_call([&] {
    double acc = 0.0;
    for (int i = 0; i < n; ++i) acc += models[i & 1023]->accel(1e-3 * (i & 255));
    return acc;
  }, n);

  std::printf("switch on an enum:\n");
  const double s = time_ns_per_call([&] {
    double acc = 0.0;
    for (int i = 0; i < n; ++i) acc += accel_switch(kinds[i & 1023], 1e-3 * (i & 255));
    return acc;
  }, n);

  std::printf("direct call on a concrete type:\n");
  Drag drag;
  const double d = time_ns_per_call([&] {
    double acc = 0.0;
    for (int i = 0; i < n; ++i) acc += drag.accel(1e-3 * (i & 255));
    return acc;
  }, n);

  std::printf("virtual: %.2f ns/call  switch: %.2f ns/call  direct: %.2f ns/call\n", v, s, d);
  return 0;
}
// Output on the machine this lesson was written on (g++ -O2); yours will differ:
// virtual call through base pointer:
//   (checksum -163702282.800)
// switch on an enum:
//   (checksum -163702282.800)
// direct call on a concrete type:
//   (checksum -542936.456)
// virtual: 2.53 ns/call  switch: 0.93 ns/call  direct: 0.68 ns/call
```

The exact numbers depend on the processor; the ranking does not. The direct call is inlined, so the "call" costs nothing. Its $0.68\,\mathrm{ns}$ is the arithmetic plus the loop. The `switch` is an ordinary yes-or-no branch on one byte that is already close at hand, and it inlines too. The virtual call is almost four times the direct one ($2.53 / 0.68 \approx 3.7$), because of the two loads, the indirect jump, and the arithmetic it can no longer blend into the loop.

The checksums are printed because a loop whose result is never used may be deleted by the compiler, and then the benchmark times nothing.

Now put the number in context. At 400 Hz — 400 control cycles per second — one cycle lasts $1/400 = 0.0025\,\mathrm{s} = 2.5\,\mathrm{ms}$. A thousand virtual calls per cycle cost about $1000 \times 2.5\,\mathrm{ns} = 2.5\,\mathrm{\mu s}$, which is $2.5 / 2500 = 0.1\%$ of the budget. Negligible. Inside a loop over a six-number state vector the story changes — not because the calls are expensive, but because of the work they stop the compiler from doing around them.
:::

The rule: **dispatch at the boundary, compute inside.** Choose the sensor, guidance mode or vehicle model through a virtual call once per cycle — or once at start-up — and run the number-crunching below it on concrete types the compiler can see through.

## Other ways to choose at run time

When the list of choices is fixed at compile time, two tools choose at run time without a vtable. A `switch` over an `enum class`, as in the benchmark, is the plainest; the warning `-Wswitch` flags any `switch` that forgets a newly added choice.

`std::variant` holds exactly one of a fixed list of types, stored right inside the variant with no heap memory, plus a small number saying which one it holds. `std::visit` then calls the version of a function that matches the type held. It is the type-safe form of the **[[tagged union|tagged-union]]** that C flight code has always used.

```cpp
#include <iostream>
#include <variant>

struct Drag    { double k; };   // acceleration -k v^2
struct Gravity { double g; };   // acceleration -g

using Model = std::variant<Drag, Gravity>;   // holds exactly one of the two, in place

// One overload per alternative; std::visit calls the one that matches.
struct AccelOf {
  double v;
  double operator()(const Drag& d) const { return -d.k * v * v; }
  double operator()(const Gravity& g) const { return -g.g; }
};

double accel(const Model& m, double v) { return std::visit(AccelOf{v}, m); }

int main() {
  const Model models[] = {Drag{0.002}, Gravity{9.81}};
  for (const Model& m : models) std::cout << accel(m, 50.0) << "\n";
  std::cout << "sizeof(Model) = " << sizeof(Model) << "\n";
  return 0;
}
// Output:
// -5
// -9.81
// sizeof(Model) = 16
```

Check the first line: $-0.002 \times 50^2 = -0.002 \times 2500 = -5$. The variant is 16 bytes: eight for the larger of the two structs, and eight for the "which one" number after padding. Both `switch` and `variant` keep every type and function visible to the compiler.

When the choice can be made at *compile* time — the same integrator for a 6-state and a 13-state vehicle — **templates** give **static polymorphism**: one generic recipe, a concrete function built for each type, every call direct and inlinable. That is the next lesson, and it is how the exercise's `rk4_step` accepts any derivative function with no virtual call. (Function pointers and `std::function` also choose at run time; the first is banned by the Power of Ten, and the second may use the heap.)

Virtual functions stay right when the set of versions is truly open — a driver interface a new vendor will implement next year — and the calls are few per cycle.

::: key The cost of a virtual call
A virtual call loads the object's vtable pointer, loads the function address from the table, and calls indirectly. Costs: eight bytes per object, a few nanoseconds per call, the loss of inlining (the one that matters for small functions), and a set of possible targets the WCET analyst must enumerate. Dispatch at module boundaries, compute on concrete types inside.
:::

::: key Interfaces
An interface is a class with only pure virtual functions (`= 0`) and a virtual destructor. Implementations mark every override with `override`, are held and passed by reference or `unique_ptr` to the base, never by value, and may be marked `final`.
:::

## Check yourself

::: check
`HardwareGyro` has no data members, yet `sizeof(HardwareGyro)` is 8 while `sizeof(PlainGyro)` is 1. Where do the eight bytes come from, and why is `SimulatedGyro` 16 rather than 9?
:::

::: answer
`HardwareGyro` has virtual functions, so every object carries a pointer to its class's vtable — eight bytes on a 64-bit machine. `PlainGyro` has no virtual functions. It gets the one byte the language requires so that two different objects always have different addresses.

`SimulatedGyro` holds the vtable pointer (8 bytes) plus a `double` (8 bytes), sixteen in total. Both members are eight bytes wide and eight-byte aligned, so no padding is needed. The one byte an empty class gets exists only when it has nothing else in it; it is never added on top.
:::

::: check
A developer writes `double read_rads() { ... }` in a class derived from `RateSensor`, without the `override` keyword. The code compiles. What does `filtered_rate` call for that sensor, and how would `override` have helped?
:::

::: answer
The base class has `read_rad_s`, so `read_rads` is a brand-new, non-virtual function that overrides nothing. The derived class still has the pure virtual `read_rad_s` with no body, so it is abstract: you cannot create an object of it. The error appears at the first attempt to create one, far from the typo.

If the base function had *not* been pure, it would be worse: the class would compile, and `filtered_rate` would quietly call the base version. The developer's code would never run.

With `override`, the typo is a compile error on its own line.
:::

::: check
A colleague stores hardware and simulated sensors in a `std::vector` of `RateSensor` objects (not pointers) and reports that every element behaves like the base class. What happened, and what should the container hold?
:::

::: answer
Slicing. Copying a `HardwareGyro` into a `RateSensor` slot copies only the base part; the derived part and its vtable pointer are gone. (Here `RateSensor` is abstract, so this would not even compile. With a concrete base, it compiles and every call runs the base version.)

A container of objects used through a base type holds `std::unique_ptr` to the base — or, for a fixed list of types, a `std::variant` — so each element keeps its real type and its own size.
:::

::: check
Using the benchmark's figure of about 2.5 ns per virtual call, a navigation loop makes 200 virtual calls per 2.5 ms cycle. What fraction of the cycle do they cost? Why might a reviewer still object to a virtual `accel(x)` inside the RK4 stage loop?
:::

::: answer
$200 \times 2.5\,\mathrm{ns} = 500\,\mathrm{ns} = 0.5\,\mathrm{\mu s}$. The cycle is $2.5\,\mathrm{ms} = 2500\,\mathrm{\mu s}$, so the fraction is $0.5 / 2500 = 0.0002 = 0.02\%$. Nothing.

The objection is what the call prevents. The two-operation body cannot be inlined into the stage loop, so the compiler cannot blend or batch the arithmetic around it, and the analyst must list every `Model` version to bound each stage. Choosing the model once per cycle, then running the stages on the concrete type, removes both problems.
:::

::: check
Why does a `std::unique_ptr` to a base class need the base to have a virtual destructor, and what does `= default` mean in `virtual ~RateSensor() = default;`?
:::

::: answer
The `unique_ptr` destroys its object with `delete` on a `RateSensor*`. Without a virtual destructor, that runs only `RateSensor`'s destructor, chosen from the pointer's static type: the derived part is never destroyed, and the behavior is undefined. A `virtual` destructor makes the delete use the dynamic type, so the derived destructor runs first, then the base one.

`= default` asks the compiler to write the ordinary destructor body — the class has nothing special to clean up — while still making it virtual.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `class` vs `struct` | identical except that class members are private by default |
| invariant | a promise about the data that the constructor makes true and every public member keeps true |
| member initializer list, default member initializers | `: a_(a)` after the constructor; `= 0.0` at the declaration |
| `class D : public B` | D is-a B; base built first; `D&` converts to `B&` |
| `virtual`, `= 0`, `override`, `final` | run-time dispatch; pure virtual; checked override; no further deriving |
| interface | pure virtual functions plus `virtual ~T() = default;` |
| vtable / vptr | per-class table of function addresses; per-object pointer to it (8 bytes) |
| cost of a virtual call | two loads and an indirect call; no inlining; targets must be listed for WCET |
| slicing | copying a derived object into a base value drops the derived part |
| alternatives | `switch` on an enum, `std::variant` + `std::visit`, templates (static polymorphism) |
| rule | dispatch at the boundary, compute inside on concrete types |

Templates are next: the mechanism that lets one `rk4_step` serve every state size and every derivative function, with every call direct, every function inlinable, and no heap memory anywhere.

::: context hil-rig The rig between the desk and the launch pad
A hardware-in-the-loop rig, or HIL rig, is a lab bench where the real flight computer, and often real sensors and actuators, run the real flight software, while a simulation computer pretends to be the rest of the world. The simulator feeds the flight computer the signals it would see in flight — gyro rates, GPS fixes, engine pressures — and reads back its commands. Teams at SpaceX, NASA and elsewhere fly whole missions on rigs like this many times before launch. The trick in this lesson, an interface with a "real" and a "simulated" version, is how one build of the software can talk to either side.
:::

::: context invariant-word A word borrowed from mathematics
"Invariant" is a mathematician's word for a quantity that does not change while everything around it does. The total energy of a frictionless swinging pendulum is an invariant: speed and height trade back and forth, but the sum stays fixed. Programmers borrowed the word for a promise about data that stays true while the data changes. A PID controller's numbers change every cycle; the promise that they were produced by the update arithmetic, and by nothing else, never does.
:::

::: context saturation Why commands get clamped
Every actuator has a limit. An engine gimbal might swing only about $5^\circ$ either way, a reaction wheel has a top torque, a valve is either fully open or fully shut. A command beyond the limit cannot be carried out, so the software cuts it to the limit on purpose. Engineers call this **saturation**, and `std::clamp(x, lo, hi)` does it in one line: it returns `lo` if `x` is below it, `hi` if `x` is above it, and `x` otherwise. Real controllers also stop their integral from growing while the output is saturated, a fix called anti-windup.
:::

::: context ub-bridge Undefined behavior, briefly
The C++ standard lists some mistakes as "undefined behavior": once one happens, the standard makes no promise at all about what the program does next. It might crash, give a wrong number, or appear to work today and fail after a compiler upgrade. Deleting a derived object through a base pointer with no virtual destructor is one. Reading past the end of an array is another. Lesson 12 is devoted to undefined behavior and to the sanitizer tools that catch it while tests run.
:::

::: context vtable-picture What the hidden pointer points at
Each `SimulatedGyro` object is sixteen bytes: the hidden vtable pointer, then its `double`. All `SimulatedGyro` objects share one table. The call `sensor.read_rad_s()` follows the arrow and then the slot for `read_rad_s`. The exact table layout belongs to the compiler — GCC, for example, gives the destructor two slots and keeps type information right before the slot the pointer lands on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44" font-weight="700">one SimulatedGyro object</text>
  <rect x="20" y="28" width="120" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">vptr (8 bytes)</text>
  <rect x="20" y="62" width="120" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">true_rate_ (8)</text>
  <text x="20" y="114" font-size="11" fill="#6c7a93">16 bytes in all</text>
  <text x="210" y="18" font-size="12" fill="#1f2a44" font-weight="700">SimulatedGyro vtable</text>
  <rect x="210" y="28" width="135" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="277" y="48" font-size="12" fill="#1f2a44" text-anchor="middle">destructor</text>
  <rect x="210" y="58" width="135" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="277" y="78" font-size="12" fill="#1f2a44" text-anchor="middle">read_rad_s</text>
  <rect x="210" y="88" width="135" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="277" y="108" font-size="12" fill="#1f2a44" text-anchor="middle">name</text>
  <line x1="140" y1="45" x2="204" y2="43" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="208,43 199,39 199,47" fill="#1d6fd1"/>
  <line x1="277" y1="118" x2="277" y2="140" stroke="#b4232c" stroke-width="2"/>
  <polygon points="277,146 273,137 281,137" fill="#b4232c"/>
  <text x="277" y="162" font-size="11" fill="#b4232c" text-anchor="middle">SimulatedGyro::read_rad_s code</text>
</svg>
```
:::

::: context pipeline The assembly line inside a processor
A modern processor works like a car assembly line. While one instruction is being finished, the next dozen are already partly done behind it. That keeps every station busy, but it means the processor must guess which instructions come next before it knows for sure. At an indirect call it guesses the target from past visits. If the guess was wrong, every half-built instruction behind it is thrown out and the line restarts from the right place, which wastes roughly fifteen to twenty clock cycles — about five to seven nanoseconds on a 3 GHz chip.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 132" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">guessed right: the line stays full</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="26" width="40" height="22" fill="#8fb8f0"/><rect x="54" y="26" width="40" height="22" fill="#8fb8f0"/>
    <rect x="98" y="26" width="40" height="22" fill="#8fb8f0"/><rect x="142" y="26" width="40" height="22" fill="#8fb8f0"/>
    <rect x="186" y="26" width="40" height="22" fill="#8fb8f0"/><rect x="230" y="26" width="40" height="22" fill="#8fb8f0"/>
  </g>
  <text x="10" y="72" font-size="12" fill="#1f2a44">guessed wrong: work thrown away, line refills</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="80" width="40" height="22" fill="#8fb8f0"/>
    <rect x="54" y="80" width="40" height="22" fill="#fff" stroke-dasharray="3 2"/><rect x="98" y="80" width="40" height="22" fill="#fff" stroke-dasharray="3 2"/>
    <rect x="142" y="80" width="40" height="22" fill="#fff" stroke-dasharray="3 2"/>
    <rect x="186" y="80" width="40" height="22" fill="#8fb8f0"/><rect x="230" y="80" width="40" height="22" fill="#8fb8f0"/>
  </g>
  <line x1="54" y1="110" x2="182" y2="110" stroke="#b4232c" stroke-width="2"/>
  <text x="118" y="126" font-size="11" fill="#b4232c" text-anchor="middle">wasted</text>
  <text x="280" y="96" font-size="11" fill="#6c7a93">time →</text>
</svg>
```
:::

::: context wcet Worst-case execution time
A flight computer runs its tasks on a fixed timetable: the attitude loop every 2.5 ms, say. Each task must finish before its next turn, on every cycle, forever. So engineers must know the **worst-case execution time** (WCET) of each task — the longest it could possibly take — not its average. Tools estimate WCET by examining every path through the code. A call whose target is known is easy to account for. A call through a pointer could land in several places, so each possible target must be found and its time added to the analysis.
:::

::: context power-of-ten Ten rules from JPL
"The Power of Ten — Rules for Developing Safety-Critical Code" is a four-page paper by Gerard Holzmann of NASA's Jet Propulsion Laboratory, published in 2006. It boils safe coding down to ten rules that a tool can check: no recursion or `goto`, a fixed upper bound on every loop, no heap memory after start-up, short functions, plenty of assertions, and — rule 9 — very limited use of pointers, with no function pointers at all. Lesson 9 goes through all ten. The module's resource list links the paper; it is worth reading twice.
:::

::: context tagged-union The tagged union, drawn
A tagged union is a box big enough for the largest of several types, plus a small tag saying which type is in the box right now. C programmers build it by hand, and a bug that reads the box as the wrong type goes unnoticed. `std::variant` keeps the tag for you and `std::visit` always reads the box as the right type. For `std::variant<Drag, Gravity>`, both types hold one `double`, so the box is 8 bytes and the tag, padded, another 8.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="180" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">box: Drag or Gravity (8)</text>
  <rect x="210" y="30" width="120" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">tag 0 or 1 (8)</text>
  <text x="30" y="20" font-size="11" fill="#6c7a93">std::variant&lt;Drag, Gravity&gt;, 16 bytes</text>
  <text x="120" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">only one type lives here at a time</text>
  <text x="270" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">says which one</text>
</svg>
```
:::
