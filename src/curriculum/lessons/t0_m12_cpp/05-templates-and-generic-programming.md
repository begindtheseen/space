---
id: l05-templates-and-generic-programming
title: Templates and generic programming
minutes: 25
covers:
  - templates and generic programming
---

A Python function is generic for free. `def rk4_step(x, t, dt, f)` works for a float, a NumPy array or anything else that supports `+` and `*`, and if you pass something that does not, you find out at run time when the `+` fails. C++ templates give you the same generality with the checking moved to compile time and the cost moved to zero: the compiler generates a separate, fully typed copy of the function for each combination of types you use, and each copy is exactly the code you would have written by hand for those types.

For flight software this is the mechanism behind almost every reusable numerical component. One `rk4_step` serves a 6-state orbit and a 13-state rigid body. One `RingBuffer` holds gyro samples in one place and GPS fixes in another, with its capacity part of its type so that the storage is a plain array and never the heap. A derivative function passed as a template parameter is inlined into the integrator; there is no function pointer, no virtual call, nothing for a worst-case-execution-time analyst to enumerate. The exercises for this module ask for exactly these things — a templated `rk4_step` taking its derivative as a callable with no heap allocation inside the step, and a `RingBuffer` over a `std::array` with a `constexpr` capacity — and this lesson gives you the tools.

The cost is paid at compile time and in code size, and the error messages take practice to read. C++20 concepts, the last section, make both the requirements and the errors legible.

## Function templates

A function template is a recipe with type parameters. The header line `template` followed by `typename T` in angle brackets introduces a parameter `T`, which the body then uses as a type. When you call the function, the compiler *deduces* `T` from the argument types, *instantiates* a concrete function with that `T` substituted everywhere, and compiles it like any other function.

::: example One clamp for every numeric type
```cpp
#include <cstdint>
#include <iostream>

// One definition, many instantiations. T is deduced from the arguments.
template <typename T>
T clamp_abs(T value, T limit) {
  if (value > limit) return limit;
  if (value < -limit) return -limit;
  return value;
}

int main() {
  std::cout << clamp_abs(12.5, 5.0) << "\n";                 // T = double
  std::cout << clamp_abs(-3.0f, 2.5f) << "\n";               // T = float
  std::cout << clamp_abs<std::int16_t>(-400, 300) << "\n";   // T stated explicitly
  // std::cout << clamp_abs(12.5, 5) << "\n";   // error: T deduced as double and int
  return 0;
}
// Output:
// 5
// -2.5
// -300
```

Three functions exist in the compiled program — `clamp_abs` for `double`, for `float` and for `std::int16_t` — and each is as fast as a hand-written one, because each *is* one. The commented-out call fails: from `12.5` the compiler deduces `T = double`, from `5` it deduces `T = int`, and it refuses to guess which you meant:

```text
dederr.cpp:2:47: error: no matching function for call to 'clamp_abs(double, int)'
dederr.cpp:1:25: note: candidate: 'template<class T> T clamp_abs(T, T)'
dederr.cpp:1:25: note:   template argument deduction/substitution failed:
```

Either make the arguments agree (`5.0`) or state the type, as the third call does with angle brackets after the name. Deduction never performs a conversion to make two deductions agree.
:::

What a template costs is worth stating once. Every distinct set of template arguments produces a new function in the binary, so a template used with ten types is ten functions — code size, which on a flight processor with a small instruction cache and limited flash is a real budget. Duplicate instantiations across translation units are merged by the linker, so the same `clamp_abs` for `double` used in fifty files appears once. Compile time grows with the number of instantiations too. Neither cost appears at run time.

## Class templates and non-type parameters

A class template works the same way, and it may take *values* as parameters as well as types. `std::array` is the canonical case: its element type and its size are both template parameters, `std::array<double, 6>` is a distinct type from `std::array<double, 7>`, and because the size is part of the type, the storage is an ordinary member array — no heap, no pointer, no run-time size field.

::: example A fixed-capacity vector with no heap
```cpp
#include <array>
#include <cstddef>
#include <iostream>

// A vector with fixed capacity and no heap: storage is a std::array member.
template <typename T, std::size_t N>
class StaticVector {
 public:
  static_assert(N > 0, "capacity must be positive");

  constexpr std::size_t capacity() const noexcept { return N; }
  std::size_t size() const noexcept { return size_; }
  bool full() const noexcept { return size_ == N; }

  // Returns false instead of growing: the caller decides what a full buffer means.
  [[nodiscard]] bool push_back(const T& value) noexcept {
    if (size_ == N) return false;
    data_[size_] = value;
    ++size_;
    return true;
  }

  const T& operator[](std::size_t i) const noexcept { return data_[i]; }
  T& operator[](std::size_t i) noexcept { return data_[i]; }

 private:
  std::array<T, N> data_{};
  std::size_t size_ = 0;
};

struct Waypoint { double north_m, east_m; };

int main() {
  StaticVector<Waypoint, 4> route;
  static_assert(sizeof(route) == 4 * sizeof(Waypoint) + sizeof(std::size_t), "inline storage");

  const Waypoint plan[] = {{0, 0}, {100, 0}, {100, 50}, {0, 50}, {0, 0}};
  int rejected = 0;
  for (const Waypoint& w : plan) {
    if (!route.push_back(w)) ++rejected;
  }
  std::cout << "size " << route.size() << " of " << route.capacity()
            << ", rejected " << rejected << "\n";
  for (std::size_t i = 0; i < route.size(); ++i) {
    std::cout << "  wp" << i << " = (" << route[i].north_m << ", " << route[i].east_m << ")\n";
  }
  StaticVector<double, 128> samples;
  std::cout << "sizeof(StaticVector<double,128>) = " << sizeof(samples) << " bytes\n";
  return 0;
}
// Output:
// size 4 of 4, rejected 1
//   wp0 = (0, 0)
//   wp1 = (100, 0)
//   wp2 = (100, 50)
//   wp3 = (0, 50)
// sizeof(StaticVector<double,128>) = 1032 bytes
```

Every idiom of a flight-software container is here. `N` is a *non-type template parameter*, a compile-time constant, so `data_` is a `std::array` living inside the object — on the stack, or inside whatever owns the `StaticVector` — and `sizeof` is $128 \times 8 + 8 = 1032$ bytes for the `double` version, with nothing else anywhere. `capacity()` is `constexpr` because its value is known at compile time. The `static_assert` inside the class body is checked for every instantiation, so `StaticVector<T, 0>` is a compile error with a readable message. `push_back` never grows and never throws; it returns `false` when full, `[[nodiscard]]` makes ignoring that return a warning, and `noexcept` promises the compiler and the reader that no exception can leave it.

The exercise's `RingBuffer` has the same skeleton with one difference: when full it overwrites the oldest element rather than refusing, which needs a write index that wraps modulo `N` and a mapping from "oldest-first logical index" to physical slot. You now have every piece except those two lines of arithmetic, which are yours to write.
:::

::: key
A non-type template parameter such as `std::size_t N` makes a size part of the type. Storage becomes a `std::array` member with no heap and no run-time size, `capacity()` can be `constexpr`, and a `static_assert` in the class body checks every instantiation at compile time.
:::

## Callables as template parameters

A *lambda* is an anonymous function object: `[omega](double t, const State2& s) { return ...; }` captures `omega` by value and can be called like a function. Every lambda has its own unique type, which you cannot name but the compiler knows exactly. If a function takes its callable as a template parameter, the compiler instantiates the function for that exact lambda type, sees straight through the call, and inlines the body. That is how a generic integrator can call a user-supplied derivative with zero overhead.

::: example A generic RK4 step with an inlined derivative
The classical fourth-order Runge–Kutta step for $\dot{\mathbf{x}} = \mathbf{f}(t, \mathbf{x})$ evaluates the derivative four times and combines the results:

$$
\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t, \mathbf{x}) \\
\mathbf{k}_2 &= \mathbf{f}(t + \tfrac{h}{2}, \mathbf{x} + \tfrac{h}{2}\mathbf{k}_1) \\
\mathbf{k}_3 &= \mathbf{f}(t + \tfrac{h}{2}, \mathbf{x} + \tfrac{h}{2}\mathbf{k}_2) \\
\mathbf{k}_4 &= \mathbf{f}(t + h, \mathbf{x} + h\mathbf{k}_3) \\
\mathbf{x}_{n+1} &= \mathbf{x} + \tfrac{h}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)
\end{aligned}
$$

Written as a template over the state type and the callable, it needs the state to support `+` and scalar `*`, and nothing else.

```cpp
#include <cmath>
#include <format>
#include <iostream>

struct State2 {          // position and velocity of a 1-D oscillator
  double x, v;
};
State2 operator+(const State2& a, const State2& b) { return {a.x + b.x, a.v + b.v}; }
State2 operator*(double s, const State2& a) { return {s * a.x, s * a.v}; }

// Generic RK4 step: works for any State with + and scalar *, and any callable f(t, x).
// Everything is inlined at compile time; nothing here touches the heap.
template <typename State, typename Deriv>
State rk4_step(const State& x, double t, double dt, Deriv&& f) {
  const State k1 = f(t, x);
  const State k2 = f(t + 0.5 * dt, x + (0.5 * dt) * k1);
  const State k3 = f(t + 0.5 * dt, x + (0.5 * dt) * k2);
  const State k4 = f(t + dt, x + dt * k3);
  return x + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

int main() {
  const double omega = 1.0;                                // rad/s
  auto oscillator = [omega](double, const State2& s) {     // x'' = -omega^2 x
    return State2{s.v, -omega * omega * s.x};
  };

  const double dt = 0.01;
  const int steps = 628;                                   // about one period
  State2 s{1.0, 0.0};
  double t = 0.0;
  for (int i = 0; i < steps; ++i) {
    s = rk4_step(s, t, dt, oscillator);
    t += dt;
  }
  const double exact_x = std::cos(omega * t);
  const double exact_v = -omega * std::sin(omega * t);
  std::cout << std::format("t = {:.2f}  x = {:.9f}  exact {:.9f}  error {:.2e}\n", t, s.x, exact_x, s.x - exact_x);
  std::cout << std::format("           v = {:.9f}  exact {:.9f}  error {:.2e}\n", s.v, exact_v, s.v - exact_v);
  return 0;
}
// Output:
// t = 6.28  x = 0.999994927  exact 0.999994927  error -6.03e-12
//            v = 0.003185302  exact 0.003185302  error 5.23e-10
```

After 628 steps of 0.01 s the oscillator has come back to within $6 \times 10^{-12}$ of the exact position — the $h^4$ accuracy of RK4 at work. `Deriv&& f` is a *forwarding reference*: in a template parameter position, `&&` binds to a lambda passed as a temporary or as a named variable alike. The unnamed first parameter of the lambda, `double,`, is the time, which this autonomous system ignores; leaving it unnamed silences the unused-parameter warning. Swap `State2` for an Eigen fixed-size vector, and `oscillator` for two-body gravity, and this is the exercise's propagator.
:::

There are two other ways to pass a callable, and both are worse here. A raw function pointer cannot carry captured state and is banned outright by the Power of Ten. `std::function` is a *type-erased* wrapper that can hold any callable with a given signature behind one fixed type. It is convenient — a `std::vector` of `std::function` holds mixed lambdas — but every call goes through an indirect jump, and a callable larger than its small internal buffer is copied onto the heap. Counting allocations shows it:

```cpp
struct Gains { double k[8]; };   // 64 bytes of captured state

template <typename F>
double apply_template(F&& f, double e) { return f(e); }

double apply_erased(const std::function<double(double)>& f, double e) { return f(e); }

// with a global operator new that counts calls, and law = [g](double e) { return g.k[0] * e; }:
// template call:      result 3, allocations 0
// std::function call: result 3, allocations 1
// sizeof(std::function) = 32, sizeof(law) = 64
```

The 64-byte lambda does not fit in the 32-byte `std::function`, so constructing the wrapper allocates. In a control loop that is one heap allocation per cycle, which lesson 9 explains is disqualifying. The template parameter costs nothing and is the idiom for passing callables in numerical code.

::: key
Pass a callable to numerical code as a template parameter (a `typename F` template parameter with an `F&& f` argument), not as `std::function` or a function pointer. The compiler instantiates the function for the lambda's exact type and inlines the call; `std::function` adds an indirect call and may allocate on the heap when the callable exceeds its small buffer.
:::

## Concepts: saying what a template needs

A plain template accepts anything and fails only when the body tries an operation the type does not support. The failure is reported from deep inside the instantiation, often through several layers of library code, and the message says nothing about what you were supposed to provide. C++20 *concepts* let the template state its requirements up front, where the compiler checks them before instantiating anything.

::: example A concept for state vectors
```cpp
#include <concepts>
#include <iostream>
#include <string>

struct State2 { double x, v; };
State2 operator+(const State2& a, const State2& b) { return {a.x + b.x, a.v + b.v}; }
State2 operator*(double s, const State2& a) { return {s * a.x, s * a.v}; }

// A state vector is anything you can add to itself and scale by a double.
template <typename S>
concept StateVector = requires(S a, S b, double k) {
  { a + b } -> std::convertible_to<S>;
  { k * a } -> std::convertible_to<S>;
};

template <StateVector S>
S euler_step(const S& x, double dt, const S& dxdt) {
  return x + dt * dxdt;
}

template <std::floating_point T>
T half(T x) { return x / 2; }

int main() {
  static_assert(StateVector<State2>);
  static_assert(StateVector<double>);
  static_assert(!StateVector<std::string>);   // + works, but double * string does not

  State2 s = euler_step(State2{1.0, 0.0}, 0.1, State2{0.0, -1.0});
  std::cout << "s = (" << s.x << ", " << s.v << ")\n";
  std::cout << "half(5.0) = " << half(5.0) << "\n";
  // half(5);   // error: constraints not satisfied, int is not floating_point
  return 0;
}
// Output:
// s = (1, -0.1)
// half(5.0) = 2.5
```

The `requires` expression lists operations that must compile, with `->` naming the type each must yield. Writing `StateVector S` in place of `typename S` in the template header then constrains the parameter, and `std::floating_point` is one of the many concepts the standard library ships (`std::integral`, `std::invocable`, `std::convertible_to` are others). The three `static_assert` lines document, and enforce, which types the codebase considers state vectors. Uncomment `half(5)` and the error is short and on point:

```text
cerr.cpp:3:42: error: no matching function for call to 'half(int)'
cerr.cpp:2:36: note: constraints not satisfied
note: the expression 'is_floating_point_v<_Tp> [with _Tp = int]' evaluated to 'false'
```

Compare that to an unconstrained template failing somewhere in the middle of an Eigen expression, and the value of concepts in a large codebase is clear.
:::

Two shorthand forms are common. A `requires` clause can follow the parameter list instead of constraining the header — `T half(T x) requires std::floating_point` applied to `T` — and a parameter declared with `auto` makes the function a template without the `template` line at all: `double norm(const auto& v)`.

## Where templates live, and choosing between static and dynamic

A template is not code until it is instantiated, and the compiler can only instantiate what it can see. The definition — the whole body, not a declaration — must therefore be visible in every translation unit that uses it, which means templates live in headers. Put a template's definition in a `.cpp` file and every other file that uses it fails to link with an undefined reference, because no instantiation was ever generated for their types.

Templates give *static polymorphism*: the choice of behaviour is made at compile time, from types. Virtual functions (lesson 4) give *dynamic polymorphism*: the choice is made at run time, from an object's dynamic type. Neither is better; they answer different questions.

| | Templates (static) | Virtual functions (dynamic) |
| --- | --- | --- |
| choice made | at compile time, per type | at run time, per object |
| call cost | direct, inlinable | indirect, not inlinable |
| code size | one copy per type set | one copy |
| set of alternatives | must be known when compiling | open; new classes link in later |
| errors | at compile time (readable with concepts) | at run time or never |
| typical GNC use | integrators, filters, containers, `float`/`double` variants | sensor drivers, hardware vs simulation, guidance modes selected in flight |

The philosophy behind the STL, and behind good numerical C++, is *generic programming*: write an algorithm against the operations it needs — addition and scaling, comparison, random access — rather than against a specific type, and state those needs as concepts. `std::sort` works on any random-access range; `rk4_step` works on any `StateVector`. Each new type that meets the requirements gets the algorithm for free, with no wrapper and no cost.

::: warning
Template error messages report the failure inside the instantiation, so the first line of a long error is usually the least useful; look for the `required from here` note that points at your call. Constraining the template with a concept moves the error to the call site and makes the first line the right one.
:::

## Check yourself

::: check
`clamp_abs(12.5, 5)` fails to compile although `12.5` and `5` are both numbers. Explain, and give two ways to make the call compile.
:::

::: answer
Template argument deduction works independently on each parameter: `12.5` says `T` is `double`, `5` says `T` is `int`, and deduction does not apply conversions to reconcile them, so the compiler reports a deduction failure. Fix one: make the arguments agree, `clamp_abs(12.5, 5.0)`. Fix two: state the type explicitly so nothing is deduced — `clamp_abs` with `double` in angle brackets after the name — and the `int` argument then converts to `double` as it would for an ordinary function.
:::

::: check
`sizeof(StaticVector<double, 128>)` printed 1032. Account for the number, and explain why no part of this object can be on the heap.
:::

::: answer
The `std::array` member holds $128 \times 8 = 1024$ bytes of `double`, and `size_` is a `std::size_t` of 8 bytes, for 1032 in total. Because `N` is a compile-time constant, the array's size is fixed in the type and its storage is an ordinary member laid out inside the object; there is no pointer to external memory anywhere in the class. Wherever the `StaticVector` itself lives — a local variable, a member of another object, a static — its elements live in the same place.
:::

::: check
Why does `rk4_step` take its derivative as a template parameter rather than as a `std::function` parameter, given that both would accept the same lambda?
:::

::: answer
With a template parameter the compiler instantiates `rk4_step` for the lambda's exact type, calls it directly and can inline the derivative into the four stage evaluations; nothing is allocated. A `std::function` erases the lambda's type behind a fixed wrapper: each of the four calls per step is an indirect call the compiler cannot see through, and if the lambda's captures exceed the wrapper's small buffer — 32 bytes on this implementation — constructing the `std::function` allocates on the heap. The exercise forbids heap allocation inside the step, and a flight control loop forbids it everywhere.
:::

::: check
Write a concept `IndexedBuffer` satisfied by any type `B` that has a `size()` member convertible to `std::size_t` and an `operator[]` taking a `std::size_t`.
:::

::: answer
```cpp
template <typename B>
concept IndexedBuffer = requires(const B& b, std::size_t i) {
  { b.size() } -> std::convertible_to<std::size_t>;
  b[i];
};
```
The `requires` expression names the parameters it needs, lists each required expression, and uses `->` where the result type matters. `StaticVector` satisfies it, as do `std::array` and `std::vector`; a plain `double` does not, and a template constrained with `IndexedBuffer` rejects it at the call site.
:::

::: check
A colleague moves the definition of a class template's member functions from the header into `ring_buffer.cpp` to speed up compilation. Every file using the template now fails at link time with undefined references. Why?
:::

::: answer
A template is instantiated only where its definition is visible. The files that use `RingBuffer` see only declarations in the header, so the compiler emits calls to member functions for their particular `T` and `N` but cannot generate the bodies; `ring_buffer.cpp` never instantiates those combinations either, because nothing in it uses them. No object file contains the functions, and the linker reports them undefined. Template definitions belong in headers, whole; the compile-time cost is the price of instantiation on demand.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `template` header with `typename T` | a function or class parameterised by a type; instantiated per distinct set of arguments |
| deduction | `T` inferred from the call's arguments; no conversions to reconcile conflicting deductions |
| explicit arguments | the type written in angle brackets after the function name instead of deduced |
| non-type parameter `std::size_t N` | a compile-time value in the type; inline `std::array` storage, `constexpr capacity()` |
| `static_assert` in a template | checked for every instantiation |
| lambda `[captures](params) { body }` | a function object with a unique type; pass it as a template parameter |
| `Deriv&& f` | forwarding reference; binds temporaries and named callables alike |
| `std::function` | type-erased callable; indirect call, may heap-allocate; not for hot loops |
| `concept`, `requires` | state a template's requirements; errors move to the call site |
| `std::floating_point`, `std::integral`, `std::convertible_to` | standard concepts |
| templates live in headers | the definition must be visible wherever it is instantiated |
| static vs dynamic polymorphism | compile-time choice by type, zero cost / run-time choice by object, indirect call |

The next lesson surveys the standard library that these templates are made of — `std::array`, `std::vector`, `std::span`, iterators and the algorithms — and which of them a flight codebase lets into the control loop.
