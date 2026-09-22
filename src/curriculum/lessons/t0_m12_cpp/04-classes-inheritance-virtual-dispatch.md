---
id: l04-classes-inheritance-virtual-dispatch
title: Classes, inheritance and the cost of virtual dispatch
minutes: 24
covers:
  - classes, inheritance, virtual dispatch and its cost
---

A Python method call is a run-time search: the interpreter looks the name up in the instance's dictionary, then the class's, then each base class's, on every single call. A C++ member function call is resolved by the compiler. It knows the exact function, can inline it, and emits a direct jump — unless you declare the function `virtual`, in which case you get one deliberate run-time indirection and nothing more. This lesson is about classes as C++ means them, about inheritance, and about what that one indirection costs and where a flight codebase is willing to pay it.

The flight-software use of classes is mostly unglamorous: a class holds an *invariant* — a PID controller's integrator state, a quaternion that stays unit length, a ring buffer whose indices stay in range — and exposes the only operations that preserve it. Inheritance and virtual functions appear at module boundaries. The estimator reads from a `RateSensor` and does not know whether the object behind the reference is a hardware gyro driver or a simulated one fed by a truth model; that is what lets the same compiled flight code run on the bench, in the hardware-in-the-loop rig and on the vehicle.

The cost of virtual dispatch is small in nanoseconds and large in one specific way: it stops the compiler from inlining. For a function whose body is two floating-point operations, that changes the cost by an order of magnitude. Knowing this is what separates using virtual functions well from using them everywhere.

## Classes hold invariants

A `class` is a `struct` whose members are private by default. Private data plus a public interface is how you make a statement about the data — "the integrator has been advanced by exactly one step per call to `update`", "this buffer never holds more than `N` elements" — that no other code can falsify. The constructor establishes the invariant; every public member function preserves it.

::: example A PID controller as a class
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

Check the first two lines by hand. On the first call the error jumps from 0 to 1 in one 10 ms step, so the derivative term is $0.1 \times (1 - 0)/0.01 = 10$, the proportional term is 2, the integral term is $0.5 \times 0.01 = 0.005$, and the raw command $12.005$ is clamped to the limit of 5. On the second call the integral is $0.018$, the derivative is $(0.8 - 1)/0.01 = -20$, and $2 \times 0.8 + 0.5 \times 0.018 + 0.1 \times (-20) = -0.391$. Nothing outside the class can set `integral_` to a value that did not come from this arithmetic, and `integral()` is `const` so that telemetry can read it through a `const` reference.

The members `integral_` and `previous_error_` use *default member initialisers*, `= 0.0` at the declaration, so every constructor gets them without repeating the value. The trailing underscore is a common convention for private data; it keeps `integral_` and the getter `integral()` from colliding.
:::

Operators are member functions with special names, and a class or struct may define them to make numerical code read like mathematics. The propagator in the next lesson relies on this:

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

Define arithmetic operators as free functions taking `const` references, return by value, and default `==` when memberwise equality is what you mean. Overload only operators whose conventional meaning fits — `+` for vector addition, yes; `<<` to mean "push into a buffer", no.

## Inheritance

`class HardwareGyro : public RateSensor` makes `HardwareGyro` a kind of `RateSensor`: every `HardwareGyro` object contains a `RateSensor` subobject, the base constructor runs before the derived one, and a reference or pointer to the derived object converts implicitly to a reference or pointer to the base. That conversion is the entire point. Code written against the base type works for every derived type, present and future.

The relationship is "is-a" and should be used only when substitutability is genuinely what you want. A `PidController` is not a `Vec3`; a class that needs a `Vec3` holds one as a member (composition, "has-a"). Most classes in a GNC codebase use composition only, and inheritance is reserved for interfaces. Multiple inheritance exists and is used, when at all, to implement several interfaces at once.

## Virtual functions and interfaces

Declared `virtual`, a member function is dispatched on the *dynamic* type of the object — the type it was created as — rather than the static type of the reference or pointer it is reached through. Declared `= 0`, it is *pure* virtual: the class provides no implementation and cannot be instantiated, and every concrete derived class must implement it. A class with only pure virtual functions and a virtual destructor is an *interface*, and it is the shape most virtual functions in flight code take.

::: example A sensor interface with hardware and simulated implementations
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

`filtered_rate` is compiled once and never mentions a gyro type. `override` on each implementation asks the compiler to confirm that a base virtual function with exactly that signature exists; misspell `read_rad_s` as `read_rads` and you get `error: 'double Gyro::read_rads()' marked 'override', but does not override` instead of a silently unused new function. `final` on a class forbids deriving from it further, which also lets the compiler devirtualise calls when it can see the concrete type. The `unique_ptr` to the base holds an object whose type is chosen at run time — from a configuration file, a command-line flag, a hardware probe — and is destroyed correctly because the destructor is `virtual`.

The three `sizeof` lines are the first hint of cost. `PlainGyro` has no data and the minimum size of one byte. `HardwareGyro` has no data either, yet is eight bytes: it carries a hidden pointer. `SimulatedGyro` is that pointer plus its `double`.
:::

::: warning
A class with any virtual function needs a virtual destructor. Without one, `delete` through a base pointer — which is what `std::unique_ptr` to the base does — destroys only the base part and is undefined behaviour. `virtual ~Base() = default;` costs nothing and is part of writing an interface.
:::

::: warning
Passing a derived object *by value* to a function taking the base type copies the base subobject only and loses the derived part — *slicing*. With `void by_value(Sensor s)` and `void by_reference(const Sensor& s)`, calling both with a `Gyro` prints `base` from the first and `gyro` from the second. Polymorphic objects travel by reference or by pointer, never by value, and a container of them is a container of `unique_ptr`, not of base objects.
:::

## How dispatch works, and what it costs

The hidden pointer is the *vtable pointer*. For every class with virtual functions the compiler emits one static table — the vtable — holding the addresses of that class's implementations of each virtual function, and every object of the class stores a pointer to its class's table as its first member. A call `sensor.read_rad_s()` through a reference compiles to: load the vtable pointer from the object, load the function address from the table slot for `read_rad_s`, and call through that address. Two dependent loads and an indirect call, in place of a direct call whose target the compiler knew.

Four costs follow, in increasing order of importance.

1. **Object size.** Eight bytes per object, which matters only when you have many small objects.
2. **The indirect call.** A modern core predicts the target of an indirect call it has seen before; a correct prediction costs a few cycles, a mispredicted one costs roughly fifteen to twenty as the pipeline refills. When the call site alternates between implementations, prediction fails often.
3. **No inlining.** The compiler cannot inline a function whose identity it does not know. For a large function that is irrelevant. For `accel(x)`, whose body is two multiplications, inlining would dissolve the call into the surrounding loop and let the compiler vectorise it; the virtual call fixes the loop at one call per element.
4. **Analysability.** Worst-case execution time analysis needs to know which function runs. The set of possible targets is finite and known at link time — every override is in the binary — so the call is bounded, but the analyst must enumerate the overrides. Flight coding standards ban function pointers (Power of Ten rule 9, lesson 9), and a vtable is a table of function pointers under the hood; most standards permit virtual functions with the restriction that they stay out of hot paths, and some ban them outright.

::: example Measuring a virtual call
The benchmark below calls a two-flop `accel` fifty million times through three mechanisms: a virtual call through a base pointer to one of two implementations chosen by data the compiler cannot see, a `switch` on an enum, and a direct call on a concrete object.

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
// virtual: 2.53 ns/call  switch: 0.84 ns/call  direct: 0.66 ns/call
```

The absolute numbers depend on the processor; the ranking does not. The direct call is inlined, so the "call" costs nothing and the 0.66 ns is the arithmetic plus the loop. The `switch` is a conditional branch on a byte that is already in cache, and it too inlines. The virtual call is about four times the direct one, because of the two loads, the indirect jump, and the arithmetic it can no longer fuse into the loop. The checksums are printed so that the compiler cannot discard the loops as unused work; a benchmark whose result is never used measures nothing.

Put the number in context. At 400 Hz a control cycle lasts 2.5 ms. A thousand virtual calls per cycle cost about 2.5 µs, one tenth of one percent of the budget — negligible. The same thousand calls inside a loop that would otherwise vectorise across a six-state vector are a different matter, not because the calls are expensive but because of the work they prevent the compiler from doing around them.
:::

The rule that falls out: **dispatch at the boundary, compute inside**. Select the sensor, the guidance mode or the vehicle model through a virtual call once per cycle — or once at initialisation — and run the numerical work below that call on concrete types the compiler can see through.

## Alternatives to virtual dispatch

When the set of alternatives is closed and known at compile time, two mechanisms give run-time selection without a vtable. A `switch` over an `enum class`, as in the benchmark, is the plainest, and `-Wswitch` checks it stays exhaustive. `std::variant` holds one of a fixed list of types in place, without heap allocation, and `std::visit` applies a callable to whichever is present; it is the type-safe generalisation of the tagged union that C flight code has always used. Both keep the object's size and behaviour fully visible to the compiler.

When the alternatives must be chosen at *compile* time — the same integrator for a 6-state and a 13-state vehicle, the same filter over `float` and `double` — templates provide *static polymorphism*: one generic definition, a separate concrete function for each type, every call direct and inlinable. That is the next lesson, and it is how the exercise's `rk4_step` accepts any derivative function with no virtual call and no allocation. Function pointers and `std::function` also give run-time selection; the first is banned by the Power of Ten and the second may allocate, and the next lesson shows that too.

Virtual functions remain the right tool when the set of implementations is genuinely open — a driver interface that a new sensor vendor's class will implement next year — and the calls are coarse-grained, a handful per cycle rather than one per element.

::: key
A virtual call loads the object's vtable pointer, loads the function address from the table, and calls indirectly. Costs: eight bytes per object, a few nanoseconds per call, the loss of inlining (the one that matters for small functions), and a set of possible targets the WCET analyst must enumerate. Dispatch at module boundaries, compute on concrete types inside.
:::

::: key
An interface is a class with only pure virtual functions (`= 0`) and a virtual destructor. Implementations mark every override with `override`, are held and passed by reference or `unique_ptr` to the base, never by value, and may be marked `final`.
:::

## Check yourself

::: check
`HardwareGyro` has no data members, yet `sizeof(HardwareGyro)` is 8 while `sizeof(PlainGyro)` is 1. Where do the eight bytes come from, and why is `SimulatedGyro` 16 rather than 9?
:::

::: answer
`HardwareGyro` has virtual functions, so every object carries a pointer to its class's vtable — eight bytes on a 64-bit machine. `PlainGyro` has no virtual functions and only needs the one byte the language requires so that distinct objects have distinct addresses. `SimulatedGyro` holds the vtable pointer plus a `double`, sixteen bytes total, and there is no padding to account for because both members are eight bytes and eight-byte aligned.
:::

::: check
A developer implements `double read_rads() { ... }` in a class derived from `RateSensor`, without the `override` keyword. The code compiles. What does `filtered_rate` call for that sensor, and how would `override` have helped?
:::

::: answer
The base class has `read_rad_s`, so `read_rads` is a brand-new non-virtual function that overrides nothing. The derived class inherits the pure virtual `read_rad_s` unimplemented, which makes it abstract — you cannot create an object of it, and the error surfaces at the first attempt to do so, far from the typo. Had the base function not been pure, the class would compile, instantiate, and `filtered_rate` would call the base implementation while the developer's code was never reached. With `override` the misspelling is a compile error at the line where it was made.
:::

::: check
A colleague stores hardware and simulated sensors as `std::vector` of `RateSensor` objects (not pointers) and reports that every element behaves like the base class. What happened, and what should the container hold?
:::

::: answer
Slicing. Copying a `HardwareGyro` into a `RateSensor` element copies only the base subobject; the derived part and the derived vtable pointer are gone, and each element is a plain `RateSensor` — which, being abstract here, would in fact not compile at all, and with a concrete base would call the base implementation. A container of polymorphic objects holds `std::unique_ptr` to the base (or, for a closed set of types, a `std::variant`), so that each element keeps its dynamic type and its own size.
:::

::: check
Using the benchmark's figures, a navigation loop makes 200 virtual calls per 2.5 ms cycle. What fraction of the cycle do they cost, and why might a reviewer still object to a virtual `accel(x)` inside the RK4 stage loop?
:::

::: answer
$200 \times 2.5\,\mathrm{ns} = 0.5\,\mathrm{\mu s}$, which is $0.5 / 2500 = 0.02\%$ of the cycle — nothing. The objection is not the call cost but what the call prevents: the two-flop body cannot be inlined into the stage loop, so the compiler cannot fuse or vectorise the arithmetic around it, and the analyst must list every `Model` implementation to bound the stage. Choosing the model once per cycle through a virtual call and running the stages on the concrete type removes both problems.
:::

::: check
Why does `std::unique_ptr` to a base class require the base to have a virtual destructor, and what does `= default` mean in `virtual ~RateSensor() = default;`?
:::

::: answer
The `unique_ptr` destroys the object with `delete` on a `RateSensor*`. Without a virtual destructor that call runs only `RateSensor`'s destructor, based on the static type of the pointer: the derived part is never destroyed and the program has undefined behaviour. Declaring the destructor `virtual` makes the delete dispatch on the dynamic type, so the derived destructor runs first and then the base one. `= default` asks the compiler to generate the ordinary destructor body — the class has nothing special to clean up — while still making it virtual.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `class` vs `struct` | identical except that class members are private by default |
| invariant | a property the constructor establishes and every public member preserves |
| member initialiser list, default member initialisers | `: a_(a)` after the constructor; `= 0.0` at the declaration |
| `class D : public B` | D is-a B; base constructed first; `D&` converts to `B&` |
| `virtual`, `= 0`, `override`, `final` | run-time dispatch; pure virtual; checked override; no further overriding |
| interface | pure virtual functions plus `virtual ~T() = default;` |
| vtable / vptr | per-class table of function addresses; per-object pointer to it (8 bytes) |
| cost of a virtual call | two loads and an indirect call; no inlining; targets must be enumerated for WCET |
| slicing | copying a derived object into a base value drops the derived part |
| alternatives | `switch` on an enum, `std::variant` + `std::visit`, templates (static polymorphism) |
| rule | dispatch at the boundary, compute inside on concrete types |

Templates are next: the mechanism that lets one `rk4_step` serve every state size and every derivative function with every call direct, every function inlinable, and no heap in sight.
