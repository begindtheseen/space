---
id: l02-values-references-const
title: Value semantics, references and const
minutes: 22
covers:
  - value semantics, references, const-correctness
---

In Python, `b = a` binds a second name to the same object, and appending to `b` changes what `a` sees. In C++, `b = a` creates a second object holding a copy of the first. This is the single largest mental adjustment a Python programmer makes, and everything else in this lesson — references, pointers, `const` — is machinery built on top of it.

The adjustment pays for itself in flight software. A control loop that shares state between modules through hidden aliases is a control loop whose data flow nobody can read off the page; a reviewer has to trace every reference to know who might have modified the navigation state between the sensor read and the actuator write. Value semantics make the default safe (a copy is yours alone), references make sharing visible in the function signature, and `const` makes read-only access a promise the compiler enforces. Read a well-written C++ signature and you know what the function can change without opening its body.

There is a performance story too, but it is secondary. A 24-byte vector copies in a couple of instructions; a `std::vector` copies by allocating; the language lets you choose, per parameter, whether a caller's object is copied, borrowed for reading, or borrowed for writing.

## Variables are objects

Every C++ variable names an *object*: a region of storage with a type, a size and a lifetime. `double x = 3.0;` reserves eight bytes and puts a number in them. `Vec3 a{1.0, 2.0, 3.0};` reserves 24 bytes for a struct of three doubles. Assignment copies a value into the storage that already exists; for a struct, it copies member by member. There is no separate "object" that the variable refers to — the variable *is* the object.

Compare Python, where `a = [1, 2]` makes `a` a name bound to a list somewhere on the heap, and `b = a` binds `b` to the same list. NumPy arrays behave the same way, which is why `y = x; y[0] = 0` in the Python module changed `x` and why you had to write `x.copy()` to prevent it. In C++ the copy is the default and aliasing is what you have to ask for.

::: example Copy versus alias
```cpp
#include <iostream>

struct Vec3 {
  double x, y, z;
};

int main() {
  Vec3 a{1.0, 2.0, 3.0};
  Vec3 b = a;        // copy: b is a new object with the same values
  Vec3& r = a;       // reference: r is another name for a

  b.x = 100.0;       // changes b only
  r.y = 200.0;       // changes a, because r is a

  std::cout << "a = " << a.x << " " << a.y << " " << a.z << "\n";
  std::cout << "b = " << b.x << " " << b.y << " " << b.z << "\n";
  std::cout << "sizeof(Vec3) = " << sizeof(Vec3) << " bytes\n";
  std::cout << "&a == &r ? " << (&a == &r ? "yes" : "no") << "\n";
  std::cout << "&a == &b ? " << (&a == &b ? "yes" : "no") << "\n";
  return 0;
}
// Output:
// a = 1 200 3
// b = 100 2 3
// sizeof(Vec3) = 24 bytes
// &a == &r ? yes
// &a == &b ? no
```

`b` has its own 24 bytes at its own address; writing to it cannot affect `a`. `r` has no storage of its own — `&r` is the address of `a` — so writing through `r` is writing to `a`. The `&` prefix operator takes an object's address; you will see its other meaning, in a declaration, in the next section.
:::

Two consequences follow. First, copying is safe by construction: a snapshot of the vehicle state taken for a fault log is a genuinely independent value, and no later update can disturb it. Second, copying has a cost proportional to the object's size. A `Vec3` costs almost nothing; a $6 \times 6$ matrix of doubles is 288 bytes; a `std::vector` of a million samples owns heap memory and copying it means allocating another million slots. That cost is why the language gives you a way to borrow an object instead of copying it.

Structs do not get `==` for free. In C++20 you can ask for the obvious memberwise comparison with one line inside the struct, `bool operator==(const Vec3&) const = default;`, and the same applies to `<=>` for ordering.

## References: another name for an existing object

`T& r = obj;` declares `r` as a reference to `obj`. A reference must be initialised when declared, refers to the same object for its whole life, can never be null, and has no arithmetic of its own — every operation on `r` is an operation on `obj`. That set of restrictions is what makes references safe to hand around: a function taking a `const Vec3&` can rely on there being a vector there.

References appear mostly in two places: function parameters and range-for loops. For parameters, C++ gives you three ways to receive an argument, and choosing among them is a decision you make on every function you write:

| Parameter | What the callee receives | Use it when |
| --- | --- | --- |
| `T v` | its own copy | `T` is small — a `double`, an `enum`, a `Vec3`, a pointer — or you need a copy anyway |
| `const T& v` | a read-only alias of the caller's object | `T` is large or expensive to copy and you only read it |
| `T& v` | a mutable alias of the caller's object | the function's purpose is to modify the caller's object in place |

"Small" means a few machine words: up to two or three doubles is a reasonable boundary. A `const T&` costs the size of one address, eight bytes, regardless of how large `T` is. A plain `T&` parameter announces that the function changes the caller's object — that is information you want to be visible at the call site, so prefer returning a new value where you can and reserve `T&` for genuine in-place updates such as an integrator advancing a state.

::: example Three ways to pass a vector
```cpp
#include <cmath>
#include <iostream>

struct Vec3 {
  double x, y, z;
};

double norm(Vec3 v) {                       // by value: a 24-byte copy
  return std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

Vec3 normalized(const Vec3& v) {            // by const reference: read-only alias
  const double n = norm(v);
  return Vec3{v.x / n, v.y / n, v.z / n};   // a new value, returned by value
}

void normalize_in_place(Vec3& v) {          // by reference: mutates the caller's object
  const double n = norm(v);
  v.x /= n;
  v.y /= n;
  v.z /= n;
}

void print(const char* label, const Vec3& v) {
  std::cout << label << " = (" << v.x << ", " << v.y << ", " << v.z << ")\n";
}

int main() {
  Vec3 thrust_dir{3.0, 4.0, 0.0};
  const Vec3 unit = normalized(thrust_dir);
  print("thrust_dir", thrust_dir);          // unchanged
  print("unit      ", unit);

  normalize_in_place(thrust_dir);
  print("thrust_dir", thrust_dir);          // now changed
  std::cout << "norm = " << norm(thrust_dir) << "\n";
  return 0;
}
// Output:
// thrust_dir = (3, 4, 0)
// unit       = (0.6, 0.8, 0)
// thrust_dir = (0.6, 0.8, 0)
// norm = 1
```

Inside `normalized`, `v` is the caller's `thrust_dir` under another name, and `const` forbids the body from changing it. The result is a fresh `Vec3` built inside the function and returned by value; lesson 3 explains why that return costs nothing. `normalize_in_place` takes `Vec3&` and the change is visible to the caller — and visible to a reader, because the signature has no `const`. A $(3, 4, 0)$ vector has norm 5, so the unit vector is $(0.6, 0.8, 0)$.
:::

Range-for has the same choice. `for (const auto& s : samples)` visits each element without copying; `for (auto s : samples)` copies every element into `s`. For a container of `double` that is harmless, for a container of $6 \times 6$ matrices it is 288 bytes of copying per iteration for no reason. Write `const auto&` unless you need a copy or intend to modify the elements, in which case write `auto&`.

## Pointers, briefly

A pointer `T* p` holds the address of a `T`. `&x` produces the address of `x`, `*p` is the object at that address, and `p->member` abbreviates `(*p).member`. A pointer may hold `nullptr`, may be reassigned to point elsewhere, and supports arithmetic that steps through arrays. Those extra powers are exactly what references lack, so the choice is principled: use a reference when an object must be present; use a pointer when "absent" is a legitimate state, or when the address itself is the point — a hardware register at a fixed location, or a position inside a buffer.

```cpp
struct Sample { double value; bool valid; };

// A pointer parameter says "may be absent"; a reference cannot be null.
double value_or(const Sample* s, double fallback) {
  if (s == nullptr || !s->valid) return fallback;
  return s->value;
}
// value_or(&good, -1.0) == 9.81, value_or(nullptr, -1.0) == -1.0
```

`const` attaches to whatever is immediately to its left, and reads right to left: `const double* pc` is a pointer to a `double` that is const — you may re-point `pc`, but you may not write `*pc = 1.0`. `double* const cp` is a const pointer to a mutable `double` — you may write `*cp = 1.0`, but `cp` itself cannot be re-pointed. Raw pointers in modern C++ never *own* anything; ownership is the subject of lesson 3.

## const-correctness

`const` on a variable makes it immutable after initialisation. `const` on a reference or pointer parameter makes it a read-only view. `const` after a member function's parameter list — `double bias() const` — is a promise that the function does not modify the object, and only such functions may be called on a `const` object or through a `const` reference. That last rule is what makes `const` *propagate*: once a function receives `const State&`, everything it calls on that state must itself be `const`, all the way down. A single non-`const` getter breaks the chain for every caller above it, so getters are `const` without exception.

::: example A const member function, and what happens without one
```cpp
#include <iostream>

class RateGyro {
 public:
  explicit RateGyro(double bias_rad_s) : bias_rad_s_(bias_rad_s) {}

  // Reads state, promises not to change it: callable on a const RateGyro.
  double corrected(double raw_rad_s) const { return raw_rad_s - bias_rad_s_; }
  double bias() const { return bias_rad_s_; }

  // Mutates state: not callable on a const RateGyro.
  void update_bias(double new_bias_rad_s) { bias_rad_s_ = new_bias_rad_s; }

 private:
  double bias_rad_s_;
};

double filter_step(const RateGyro& gyro, double raw) {
  // gyro.update_bias(0.0);   // would not compile: gyro is const here
  return gyro.corrected(raw);
}

int main() {
  RateGyro gyro(0.002);
  std::cout << "corrected = " << filter_step(gyro, 0.0105) << " rad/s\n";
  gyro.update_bias(0.003);
  std::cout << "corrected = " << filter_step(gyro, 0.0105) << " rad/s\n";

  const RateGyro frozen(0.001);
  std::cout << "frozen bias = " << frozen.bias() << "\n";
  return 0;
}
// Output:
// corrected = 0.0085 rad/s
// corrected = 0.0075 rad/s
// frozen bias = 0.001
```

`class` differs from `struct` only in its default access: members are private unless you say otherwise. The `explicit` on the constructor stops a bare `double` from silently becoming a `RateGyro` where one is expected. Uncomment the call to `update_bias` inside `filter_step`, or try `frozen.update_bias(0.5)`, and the compiler refuses:

```text
consterr.cpp:10:21: error: passing 'const RateGyro' as 'this' argument discards
    qualifiers [-fpermissive]
```

"Discards qualifiers" is the compiler's phrase for "you promised not to modify this and now you are trying to". The object every member function operates on is reachable inside it as `this`, a pointer to the object, and in a `const` member function `this` points to a `const` object.
:::

The habit to build is **const by default**: declare every variable, parameter and member function `const` unless it must change, and remove the `const` only when the compiler shows you a genuine reason. Physical constants take one step further, `constexpr double kMuEarth = 3.986004418e14;`, which is `const` plus "known at compile time"; lesson 7 develops that. The gain is not mainly speed — the optimiser can often infer constness — it is that the data flow of a 300-line estimator becomes readable from its declarations.

::: key
A C++ variable is an object with its own storage; `b = a` copies the value. A reference `T&` is another name for an existing object — always initialised, never reseated, never null. Pass small types by value, large types you only read by `const T&`, and use plain `T&` only when the function's purpose is to modify the caller's object.
:::

::: key
`const` propagates: a `const T&` parameter can only call `const` member functions, so getters are always `const`. Declare everything `const` by default and remove it only when the compiler shows you a real reason.
:::

## Lifetime and dangling references

A reference does not keep its object alive. If the object is destroyed, the reference *dangles*, and using it is undefined behaviour. The classic case is returning a reference to a local variable:

```cpp
const Vec3& make_unit_x() {
  Vec3 local{1.0, 0.0, 0.0};
  return local;         // reference to an object about to be destroyed
}
```

```text
dangle.cpp:4:10: warning: reference to local variable 'local' returned [-Wreturn-local-addr]
```

The compiler catches this one because the local is in plain sight. It cannot catch a reference into a `std::vector` that a later `push_back` reallocates, or a reference to an element of a container that has since been cleared. The rule that avoids the whole class: return values, not references, unless you are returning a reference to something the caller passed in or to a member of a long-lived object. Returning by value is free for temporaries in C++17, as the next lesson shows.

::: warning
`for (auto row : matrix_rows)` copies every row, and `for (auto& row : matrix_rows)` lets the loop body modify the container. If you want neither, write `const auto&`. Similarly, `auto v = get_state();` copies, while `const auto& v = get_state();` on a function returning by value binds to the temporary and extends its lifetime to the end of the enclosing scope — safe, but only for that one special case of a `const` reference bound directly to a temporary.
:::

## Units as types

A `double` carries no unit. `fall_distance(3.0)` reads plausibly whether the argument is seconds or metres, and the compiler cannot help. Wrapping a value in a one-member struct changes that at zero run-time cost — a `struct Seconds { double value; }` has the same size as a `double` and compiles to the same instructions — while making a mixed-up call a compile error:

```cpp
struct Seconds { double value; };
struct Meters  { double value; };

Meters fall_distance(Seconds t) {
  constexpr double g0 = 9.80665;   // m/s^2
  return Meters{0.5 * g0 * t.value * t.value};
}

int main() {
  Seconds t{3.0};
  Meters d = fall_distance(t);     // d.value == 44.1299
  // fall_distance(d);   // error: no conversion from Meters to Seconds
  // fall_distance(3.0); // error: no conversion from double to Seconds
  return 0;
}
```

Three seconds of free fall under $g_0 = 9.80665\,\mathrm{m/s^2}$ covers $\tfrac{1}{2} g_0 t^2 = 44.13\,\mathrm{m}$. The mismatched calls fail before the program exists. This is the simplest form of "units as types"; lesson 7 generalises it so that `Meters / Seconds` yields a velocity type automatically, with every unit check done by the compiler and nothing left for run time.

## Check yourself

::: check
After `Vec3 a{1.0, 2.0, 3.0}; Vec3& r = a; Vec3 c = r; c.z = 9.0;`, what are `a.z` and `c.z`?
:::

::: answer
`a.z` is `3.0` and `c.z` is `9.0`. `r` is an alias of `a`, so `Vec3 c = r;` copies `a` into a new object `c`. Declaring `c` as a plain `Vec3` (not `Vec3&`) makes it a value with its own storage; writing to `c.z` cannot reach `a`. Only `Vec3& c = r;` would have made `c` a third name for the same object.
:::

::: check
A colleague writes `void integrate(State s, double dt) { s.position += s.velocity * dt; }` and reports that the vehicle state never changes. Explain, and give two ways to fix it.
:::

::: answer
`State s` is a by-value parameter, so `integrate` receives its own copy of the caller's state, modifies the copy, and destroys it on return; the caller's object is untouched. Fix one: take `State& s`, so the function modifies the caller's object in place, and the signature now advertises that. Fix two, usually better: take `const State& s` and return the new state by value, `State integrate(const State& s, double dt)`, so the caller writes `state = integrate(state, dt);` and the data flow is explicit.
:::

::: check
Given `double x = 1.0, y = 2.0; const double* p = &x; double* const q = &x;`, which of these four statements compile: `*p = 5.0;`, `p = &y;`, `*q = 5.0;`, `q = &y;`?
:::

::: answer
`p = &y;` and `*q = 5.0;` compile; the other two do not. `const double* p` is a pointer to a `const double`: the pointee is read-only, so `*p = 5.0` is rejected, but the pointer itself can be re-pointed. `double* const q` is a `const` pointer to a mutable `double`: `*q = 5.0` writes through it happily, but `q = &y` tries to change a `const` pointer. Read each declaration right to left and `const` lands on what it protects.
:::

::: check
A navigation filter has `double Estimator::covariance_trace()` without `const`. A reviewer says this one omission will force `const` to be removed from several other signatures. Why?
:::

::: answer
Because `const` propagates upward. Any function that receives `const Estimator&` — a telemetry formatter, a health monitor, a test helper — cannot call a non-`const` member function through that reference. To call `covariance_trace()` those functions would have to take `Estimator&` instead, which in turn forces their callers to hold non-`const` estimators, and so on up the call chain. Marking the getter `const` (it does not modify the object, so this is merely stating the truth) restores the chain at no cost.
:::

::: check
A Monte Carlo post-processor loops over a `std::array` of 100 covariance matrices, each $6 \times 6$ doubles, with `for (auto P : covariances) { trace_sum += trace(P); }`. How many bytes does the loop copy, and how would you make it copy none?
:::

::: answer
Each matrix is $36 \times 8 = 288$ bytes, so the loop copies $100 \times 288 = 28\,800$ bytes into `P`, one matrix per iteration, for no purpose since `trace` only reads. Writing `for (const auto& P : covariances)` binds `P` as a read-only alias of each element, copying nothing. The `const` also documents that the loop cannot modify the array.
:::

## Summary

| Item | Meaning |
| --- | --- |
| value semantics | `b = a` copies; each variable is its own object with its own storage |
| `T&` | reference: another name for an existing object; initialised once, never null |
| `const T&` | read-only alias; the default for passing anything larger than a few words |
| `T v` by value | a copy; right for `double`, enums, `Vec3`-sized structs |
| `T*` | pointer: an address that may be null or re-pointed; non-owning in modern code |
| `const double*` vs `double* const` | pointee is const vs pointer is const; read right to left |
| `double f() const` | member function that cannot modify the object; required to call on a `const` object |
| const by default | declare everything `const` until the compiler proves you need otherwise |
| dangling reference | a reference whose object has been destroyed; returning a reference to a local is the classic case |
| units as types | `struct Seconds { double value; }` — zero-cost wrapper that makes mixed-up arguments a compile error |

The next lesson turns to what happens when an object *owns* something — heap memory, a file, a lock — and how C++ ties that ownership to lifetime so that nothing is ever leaked or freed twice.
