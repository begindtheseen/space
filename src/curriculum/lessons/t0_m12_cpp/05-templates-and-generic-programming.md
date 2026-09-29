---
id: l05-templates-and-generic-programming
title: Templates and generic programming
minutes: 24
covers:
  - templates and generic programming
---

Think of a recipe card that says "___ pie". Put "apple" in the blank and you get apple pie. Put "cherry" and you get cherry pie. The steps — roll the crust, fill, bake at 200 °C — are written once, and the blank decides the rest.

A C++ **template** is that card. It is a function or a class written with a blank for a type, or for a number. When you use it, the compiler fills in the blank and writes out a complete, ordinary function for that exact type. Python gets something similar for free: `def rk4_step(x, t, dt, f)` works for a float or a NumPy array, and if you pass something that cannot be added, you find out when the program runs. A template moves that check to compile time and makes the cost zero at run time, because each filled-in copy *is* the code you would have written by hand.

Almost every reusable numerical part of flight software is built this way. One `rk4_step` serves a 6-number orbit state and a 13-number rigid-body state. One `RingBuffer` holds gyro samples in one place and GPS fixes in another, with its capacity built into its type so its storage is a plain array and never the heap. This module's exercises ask for exactly that — a templated `rk4_step` taking its derivative as a callable with no heap allocation, and a `RingBuffer` over a `std::array` with a `constexpr` capacity — and this lesson gives you every tool they need.

## Function templates

The line `template <typename T>` in front of a function says: "`T` is a blank for a type." You read it "template, typename T". The function body then uses `T` like any type name.

When you call the function, the compiler does two things.

1. It **deduces** `T` — works out what the blank must be — from the types of the arguments you passed.
2. It **[[instantiates|instantiate-word]]** the template: writes a concrete function with `T` replaced everywhere, and compiles that like any other function.

::: example One clamp for every number type
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

Check each line. $12.5$ is above $5$, so the answer is $5$. $-3.0$ is below $-2.5$, so the answer is $-2.5$. $-400$ is below $-300$, so the answer is $-300$.

Three separate functions now exist in the compiled program — `clamp_abs` for `double`, for `float` and for `std::int16_t` (a 16-bit whole number). Each runs as fast as a hand-written one, because each is one.

The third call writes the type in angle brackets after the name, `clamp_abs<std::int16_t>`. That is an **explicit template argument**: you fill the blank yourself, so nothing is deduced.

The commented-out call fails. From `12.5` the compiler deduces `T = double`. From `5` it deduces `T = int`. Two answers for one blank, and it refuses to guess:

```text
dederr.cpp:3:34: error: no matching function for call to 'clamp_abs(double, int)'
dederr.cpp:2:3: note: candidate: 'template<class T> T clamp_abs(T, T)'
dederr.cpp:2:3: note:   template argument deduction/substitution failed:
dederr.cpp:3:34: note:   deduced conflicting types for parameter 'T' ('double' and 'int')
```

Fix it by making the arguments agree (`5.0`) or by stating the type. Deduction never converts one argument to make the two answers match.
:::

Templates do have a cost, and it is worth stating once. Every different set of template arguments makes a new function in the program. A template used with ten types is ten functions. That is **code size**, and on a flight processor with a small **[[instruction cache|code-budget]]** and limited memory it is a real budget. The linker does merge duplicates: `clamp_abs` for `double`, used in fifty files, ends up in the program once. Compile time also grows with the number of instantiations. Neither cost shows up at run time.

## Class templates and number parameters

A class can be a template too. And the blank can hold a *number* as well as a type. Such a blank is a **non-type template parameter**: a constant value, fixed at compile time.

`std::array` is the standard example. Both its element type and its length are template parameters. `std::array<double, 6>` and `std::array<double, 7>` are two different types. Because the length is part of the type, the storage is an ordinary array inside the object — no heap, no pointer, no length stored at run time.

::: example A fixed-capacity vector with no heap
Here is a list that can hold up to `N` items and never asks for more memory.

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

The plan has five waypoints and the route holds four, so the fifth is rejected. Every habit of a flight-software container is in this class.

- `N` is a compile-time constant, so `data_` is a `std::array` living *inside* the object. The size is $128 \times 8 + 8 = 1032$ bytes: 128 doubles plus the `size_` counter, and **[[nothing anywhere else|staticvector-layout]]**.
- `capacity()` is **`constexpr`** — its value is known while compiling, so it can be used wherever a constant is needed.
- **`static_assert`** is a check the compiler runs. Inside a class template it runs for every instantiation, so `StaticVector<double, 0>` is a compile error with a readable message.
- `push_back` never grows and never throws. It returns `false` when full. **`[[nodiscard]]`** makes ignoring that answer a warning, and **`noexcept`** promises that no exception can escape.

The exercise's `RingBuffer` has the same skeleton with one change: when full, it overwrites the oldest item instead of refusing. That needs a write position that wraps around to zero after `N`, and a way to turn "the i-th oldest" into a slot number. Those two lines of arithmetic are yours to write.
:::

::: key Number parameters
A non-type template parameter such as `std::size_t N` makes a size part of the type. Storage becomes a `std::array` member with no heap and no run-time size, `capacity()` can be `constexpr`, and a `static_assert` in the class body checks every instantiation at compile time.
:::

## Passing a function to a template

A generic integrator needs to be handed a function: the derivative of the state. Anything you can call like a function is called a **callable**. C++ writes a callable in place as a **lambda** — a function with no name, written right where it is used:

`[omega](double t, const State2& s) { return State2{s.v, -omega * omega * s.x}; }`

The square brackets list what it **captures**: variables from outside that it keeps a copy of, here `omega`. The parentheses are its parameters, and the braces are its body. A lambda can be stored in a variable and called like any function.

Here is the key fact. Every lambda has its own unique type, which you cannot name but the compiler knows exactly. If a function takes its callable as a *template* parameter, the compiler builds that function for this one lambda's type, sees straight through the call, and inlines the body (pastes it in, as lesson 4 described). The integrator calls your derivative at zero cost.

::: example A generic RK4 step with an inlined derivative
The classical fourth-order **Runge–Kutta** step, RK4, advances the solution of $\dot{\mathbf{x}} = \mathbf{f}(t, \mathbf{x})$ by one step $h$. (Read $\dot{\mathbf{x}}$ as "x dot", the rate of change of the state.) It samples the slope four times and takes a **[[weighted average|rk4-weights]]**:

$$
\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t, \mathbf{x}) \\
\mathbf{k}_2 &= \mathbf{f}(t + \tfrac{h}{2}, \mathbf{x} + \tfrac{h}{2}\mathbf{k}_1) \\
\mathbf{k}_3 &= \mathbf{f}(t + \tfrac{h}{2}, \mathbf{x} + \tfrac{h}{2}\mathbf{k}_2) \\
\mathbf{k}_4 &= \mathbf{f}(t + h, \mathbf{x} + h\mathbf{k}_3) \\
\mathbf{x}_{n+1} &= \mathbf{x} + \tfrac{h}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)
\end{aligned}
$$

Written as a template over the state type and the callable, it needs only two things from the state: `+` between two states, and `*` by a number.

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

The system is a mass on a spring: $\ddot{x} = -\omega^2 x$, with $\omega = 1\,\mathrm{rad/s}$, starting at $x = 1$ at rest. The exact answer is $x = \cos t$, and one full swing takes $2\pi \approx 6.28\,\mathrm{s}$. After 628 steps of $0.01\,\mathrm{s}$, $t = 6.28$, a little short of a full swing. So $x$ is a hair under $1$ and $v$ is a small positive number, as the output shows.

How good is it? The velocity is off by $5.2 \times 10^{-10}$. (The position error, $6 \times 10^{-12}$, looks even better only because near the end of a swing the position barely changes, so a tiny timing error hardly shows in it.) RK4's error shrinks like $h^4$: rerun with $h = 0.02\,\mathrm{s}$ and the velocity error is $8.37 \times 10^{-9}$, which is $16 = 2^4$ times larger.

Three details in the code:

- `Deriv&& f` is a **forwarding reference**. In a template parameter, `&&` accepts a callable passed either as a temporary or as a named variable.
- The lambda's first parameter, `double,`, has no name. It is the time, which this system ignores; leaving it unnamed avoids an "unused parameter" warning.
- Swap `State2` for an Eigen fixed-size vector and `oscillator` for two-body gravity, and this is the exercise's propagator.
:::

There are two other ways to hand over a callable, and both are worse here. A raw **function pointer** cannot carry captured values, and the Power of Ten bans it outright.

**`std::function`** is a wrapper that can hold *any* callable with a given signature behind one fixed type. Hiding the real type like this is called **[[type erasure|type-erasure]]**. It is convenient — a `std::vector` of `std::function` can hold many different lambdas — but every call goes through an indirect jump, and a callable too big for the wrapper's small internal space is copied onto the heap. Counting allocations shows it:

```cpp
#include <cstdio>
#include <cstdlib>
#include <functional>
#include <new>

// Count every heap allocation the program makes.
static int g_allocations = 0;
void* operator new(std::size_t n) {
  ++g_allocations;
  if (void* p = std::malloc(n)) return p;
  throw std::bad_alloc{};
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

struct Gains { double k[8]; };   // 64 bytes of captured state

template <typename F>
double apply_template(F&& f, double e) { return f(e); }

double apply_erased(const std::function<double(double)>& f, double e) { return f(e); }

int main() {
  const Gains g{{1.5, 0, 0, 0, 0, 0, 0, 0}};
  auto law = [g](double e) { return g.k[0] * e; };           // captures 64 bytes
  const double kp = 1.5, bias = 0.0;
  auto small = [kp, bias](double e) { return kp * e + bias; };  // captures 16 bytes

  g_allocations = 0;
  const double a = apply_template(law, 2.0);
  std::printf("template call:              result %g, allocations %d\n", a, g_allocations);

  g_allocations = 0;
  const double b = apply_erased(law, 2.0);
  std::printf("std::function, 64-byte law: result %g, allocations %d\n", b, g_allocations);

  g_allocations = 0;
  const double c = apply_erased(small, 2.0);
  std::printf("std::function, 16-byte law: result %g, allocations %d\n", c, g_allocations);

  std::printf("sizeof(std::function) = %zu, sizeof(law) = %zu, sizeof(small) = %zu\n",
              sizeof(std::function<double(double)>), sizeof(law), sizeof(small));
  return 0;
}
// Output (g++ 13 with libstdc++):
// template call:              result 3, allocations 0
// std::function, 64-byte law: result 3, allocations 1
// std::function, 16-byte law: result 3, allocations 0
// sizeof(std::function) = 32, sizeof(law) = 64, sizeof(small) = 16
```

Passing `law` to `apply_erased` builds a temporary `std::function` from it. The wrapper is 32 bytes, and in this library only 16 of them are room for the callable. The 16-byte `small` fits; the 64-byte `law` does not, so the wrapper allocates. In a control loop that is one heap allocation per cycle, which lesson 9 explains is disqualifying. The template parameter costs nothing, and it is the standard way to pass callables in numerical code.

::: key Passing callables
Pass a callable to numerical code as a template parameter (a `typename F` template parameter with an `F&& f` argument), not as `std::function` or a function pointer. The compiler instantiates the function for the lambda's exact type and inlines the call; `std::function` adds an indirect call and may allocate on the heap when the callable exceeds its small buffer.
:::

## Concepts: saying what a template needs

A plain template accepts anything. It fails only when the body tries something the type cannot do — and then the error comes from deep inside, often through layers of library code, and says nothing about what you were supposed to provide.

C++20 **concepts** fix that. A concept is a named list of requirements, checked at the call before anything is built. Think of the sign at a fairground ride: "you must be this tall". It is checked at the gate, not halfway up the track.

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

Read the concept line by line. The **`requires` expression** names some sample values (`a`, `b`, `k`) and lists expressions that must compile. The arrow `->` says what type each must produce: `a + b` must give something convertible to `S`, and so must `k * a`.

Writing `StateVector S` in place of `typename S` in the template line then limits the blank to types that pass. `std::floating_point` is one of many concepts the standard library supplies; `std::integral`, `std::invocable` and `std::convertible_to` are others.

Check the Euler step: $\mathbf{x} + h\,\dot{\mathbf{x}} = (1, 0) + 0.1 \times (0, -1) = (1, -0.1)$. The three `static_assert` lines record, and enforce, which types count as state vectors. A `std::string` can be added to a string, but not multiplied by a `double`, so it fails.

Uncomment `half(5)` and the error is short and to the point:

```text
cerr.cpp:4:24: error: no matching function for call to 'half(int)'
cerr.cpp:3:3: note: constraints not satisfied
note: the expression 'is_floating_point_v<_Tp> [with _Tp = int]' evaluated to 'false'
```

Compare that with an unconstrained template failing somewhere in the middle of an Eigen expression, and you will see why large codebases use concepts.
:::

Two shorter spellings are common. A **`requires` clause** can come after the parameter list instead: `T half(T x) requires std::floating_point<T>`. And a parameter declared `auto` turns a function into a template with no `template` line at all: `double norm(const auto& v)`.

## Where templates live, and when to choose them

A template is only a recipe until it is instantiated, and the compiler can only fill in a recipe it can see. So the full definition — the whole body, not only a declaration — must be visible in every **[[translation unit|translation-unit]]** that uses it. In practice, templates live in header files. Move a template's body into a `.cpp` file and every other file that uses it fails to **link** (the last build step, which joins compiled files together) with "undefined reference": nobody ever built the version for their types.

Templates give **static polymorphism**: the behavior is chosen at compile time, from types. Virtual functions (lesson 4) give **dynamic polymorphism**: the behavior is chosen at run time, from an object's real type. Neither is better. They answer different questions.

| | Templates (static) | Virtual functions (dynamic) |
| --- | --- | --- |
| choice made | at compile time, per type | at run time, per object |
| call cost | direct, inlinable | indirect, not inlinable |
| code size | one copy per type set | one copy |
| set of alternatives | must be known when compiling | open; new classes link in later |
| errors | at compile time (readable with concepts) | at run time or never |
| typical GNC use | integrators, filters, containers, `float`/`double` variants | sensor drivers, hardware vs simulation, guidance modes selected in flight |

The idea underneath the standard library, and underneath good numerical C++, is **[[generic programming|stepanov]]**: write an algorithm against the operations it needs — adding and scaling, comparing, jumping to the n-th item — rather than against one type, and state those needs as concepts. `std::sort` works on anything you can index and compare; `rk4_step` works on any `StateVector`. Every new type that meets the needs gets the algorithm for free, with no wrapper and no cost.

::: warning Reading template errors
A template error is reported from inside the instantiation, so the first line of a long error is usually the least useful. Look for the note that says `required from here` — it points at *your* call. Constraining the template with a concept moves the error to the call itself and makes the first line the right one.
:::

## Check yourself

::: check
`clamp_abs(12.5, 5)` fails to compile although `12.5` and `5` are both numbers. Explain why, and give two ways to make the call compile.
:::

::: answer
Deduction works on each argument separately. `12.5` says `T` is `double`; `5` says `T` is `int`. Deduction never converts an argument to settle the disagreement, so the compiler reports a deduction failure.

Fix one: make the arguments agree, `clamp_abs(12.5, 5.0)`.

Fix two: state the type yourself, `clamp_abs<double>(12.5, 5)`. Now nothing is deduced, and the `int` argument converts to `double` as it would for any ordinary function.
:::

::: check
`sizeof(StaticVector<double, 128>)` printed 1032. Account for the number, and explain why no part of this object can be on the heap.
:::

::: answer
The `std::array` member holds $128 \times 8 = 1024$ bytes of `double`, and `size_` is a `std::size_t` of 8 bytes: $1024 + 8 = 1032$.

Because `N` is a compile-time constant, the array's length is fixed in the type, and its storage sits inside the object. There is no pointer to outside memory anywhere in the class. Wherever the `StaticVector` itself lives — a local variable, a member of another object, a global — its items live in the same place.
:::

::: check
Why does `rk4_step` take its derivative as a template parameter rather than as a `std::function`, when both would accept the same lambda?
:::

::: answer
With a template parameter, the compiler builds `rk4_step` for the lambda's exact type, calls it directly and can inline the derivative into all four stages. Nothing is allocated.

A `std::function` hides the lambda's type behind a fixed wrapper. Each of the four calls per step becomes an indirect call the compiler cannot see through. And if the lambda's captures are bigger than the wrapper's internal space — 16 bytes in g++'s library — building the `std::function` allocates on the heap. The exercise forbids heap allocation inside the step, and a flight control loop forbids it everywhere.
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

The `requires` expression names the sample values it needs (`b` and `i`), lists each expression that must compile, and uses `->` where the result type matters. `StaticVector`, `std::array` and `std::vector` all satisfy it. A plain `double` does not, and a template constrained with `IndexedBuffer` rejects it right at the call.
:::

::: check
A colleague moves the bodies of a class template's member functions from the header into `ring_buffer.cpp` to speed up compiling. Every file that uses the template now fails at link time with undefined references. Why?
:::

::: answer
A template is instantiated only where its full definition is visible. The files using `RingBuffer` now see only declarations. The compiler writes calls to the member functions for their particular `T` and `N`, but cannot build the bodies.

`ring_buffer.cpp` does not build those versions either, because nothing inside it uses them. So no compiled file contains the functions, and the linker reports them undefined. Template definitions belong in headers, whole. The extra compile time is the price of building versions on demand.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `template` line with `typename T` | a function or class with a blank for a type; one instantiation per distinct set of arguments |
| deduction | `T` worked out from the call's arguments; no conversions to settle a disagreement |
| explicit arguments | the type written in angle brackets after the function name instead of deduced |
| non-type parameter `std::size_t N` | a compile-time value in the type; inline `std::array` storage, `constexpr capacity()` |
| `static_assert` in a template | checked for every instantiation |
| lambda `[captures](params) { body }` | an unnamed function object with a unique type; pass it as a template parameter |
| `Deriv&& f` | forwarding reference; accepts temporaries and named callables alike |
| `std::function` | type-erased callable; indirect call, may heap-allocate; not for hot loops |
| `concept`, `requires` | state a template's requirements; errors move to the call |
| `std::floating_point`, `std::integral`, `std::convertible_to` | standard concepts |
| templates live in headers | the definition must be visible wherever it is instantiated |
| static vs dynamic polymorphism | compile-time choice by type, zero cost / run-time choice by object, indirect call |

The next lesson tours the standard library these templates are made of — `std::array`, `std::vector`, `std::span`, iterators and the algorithms — and which of them a flight codebase lets into the control loop.

::: context instantiate-word An instance of the recipe
"Instantiate" means "make an instance of" — produce one real example of a general pattern. A cookie cutter is the pattern; each cookie is an instance. In C++, the template is the pattern and `clamp_abs<double>` is one instance, a real function with real machine code. The same word is used for classes: creating an object is "instantiating" the class. Nothing exists in the program for a template until it has been instantiated at least once.
:::

::: context code-budget Why code size is a budget
A processor keeps the instructions it is running in a small, very fast memory called the instruction cache. Code that fits runs at full speed; code that spills out forces the processor to wait for slower memory. Flight computers are often older, radiation-tolerant designs with small caches and limited memory to hold the program. The PowerPC 750 core behind the RAD750 flight computer, for example, has a 32 KB instruction cache. Ten copies of a large template, one per type, can push a hot loop out of that space, so flight teams watch how many instantiations they create.
:::

::: context staticvector-layout Where the 1032 bytes are
All of a `StaticVector<double, 128>` sits in one block: 128 slots of 8 bytes, then the 8-byte counter. There is no arrow pointing anywhere else — which is exactly what "no heap" looks like.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2" fill="#8fb8f0">
    <rect x="10" y="30" width="36" height="34"/><rect x="46" y="30" width="36" height="34"/>
    <rect x="82" y="30" width="36" height="34"/>
  </g>
  <rect x="118" y="30" width="90" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="4 3"/>
  <rect x="208" y="30" width="44" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="262" y="30" width="80" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="28" y="52">[0]</text><text x="64" y="52">[1]</text><text x="100" y="52">[2]</text>
    <text x="163" y="52">…</text><text x="230" y="52">[127]</text><text x="302" y="52">size_</text>
  </g>
  <text x="131" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">data_: 128 × 8 = 1024 bytes</text>
  <text x="302" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">8 bytes</text>
  <text x="180" y="92" font-size="12" fill="#1f2a44" text-anchor="middle">one object, 1032 bytes, no pointer out</text>
</svg>
```
:::

::: context rk4-weights Four slopes, averaged
RK4 looks at the slope four times across one step: once at the start ($\mathbf{k}_1$), twice at the midpoint ($\mathbf{k}_2$, $\mathbf{k}_3$, each using the one before it), and once at the end ($\mathbf{k}_4$). The midpoint slopes count double, so the weights are $\tfrac{1}{6}, \tfrac{2}{6}, \tfrac{2}{6}, \tfrac{1}{6}$, which add up to $1$. It is the same balance as Simpson's rule for areas. The ODE and numerical-methods modules derive it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="330" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="94" x2="40" y2="106" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="94" x2="180" y2="106" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="94" x2="320" y2="106" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="122">t</text><text x="180" y="122">t + h/2</text><text x="320" y="122">t + h</text>
  </g>
  <rect x="30" y="70" width="20" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="158" y="40" width="20" height="60" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="182" y="40" width="20" height="60" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="310" y="70" width="20" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="64">k1: 1/6</text><text x="168" y="34">k2</text><text x="192" y="34">k3</text>
    <text x="180" y="20">2/6 each</text><text x="320" y="64">k4: 1/6</text>
  </g>
</svg>
```
:::

::: context type-erasure Hiding the type, and what it costs
`std::function<double(double)>` must hold any callable that takes a `double` and returns one — a 16-byte lambda or a 64-byte one — yet it has one fixed size, 32 bytes in g++'s library. Its trick: if the callable fits in the wrapper's own 16 bytes of room, it goes there; if not, the wrapper allocates heap memory for it and keeps a pointer. Either way, calls go through a hidden function pointer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="11" fill="#1f2a44">std::function (32 bytes)</text>
  <rect x="10" y="26" width="96" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="26" width="48" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">room 16</text>
  <text x="82" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">calls</text>
  <text x="44" y="84" font-size="11" fill="#1f2a44">law lambda (64 bytes) does not fit: heap</text>
  <rect x="150" y="96" width="192" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="246" y="115" font-size="11" fill="#1f2a44" text-anchor="middle">copy of law, on the heap</text>
  <path d="M34 56 L34 111 L144 111" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="150,111 141,107 141,115" fill="#b4232c"/>
  <text x="40" y="140" font-size="11" fill="#b4232c">pointer, after one allocation</text>
</svg>
```
:::

::: context translation-unit One file, as the compiler sees it
A translation unit is one `.cpp` file after all its `#include` lines have been pasted in. The compiler works on one translation unit at a time and knows nothing about the others; the linker joins the results afterwards. That is why a template's body must be in the header: each translation unit that uses the template must see the body, because it is the one that will build the version it needs. Ordinary functions are different — one translation unit compiles the body, and the others only need the declaration.
:::

::: context stepanov Where the STL came from
The standard library's containers-plus-algorithms design grew from the work of Alexander Stepanov, who with Meng Lee at Hewlett-Packard built a library of generic algorithms in C++ in the early 1990s. It was accepted into the draft C++ standard in 1994 and is still called the STL, the Standard Template Library. Stepanov's central idea was that an algorithm should be written once, against the smallest set of operations it truly needs, and then work for every type that provides them. Concepts, added in C++20, finally let the language state those needs in code.
:::
