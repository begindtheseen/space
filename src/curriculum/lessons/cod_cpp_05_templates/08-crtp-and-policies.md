---
id: l08-crtp-and-policies
title: CRTP mixins, deducing this, and policy-based design
minutes: 21
covers:
  - CRTP revisited for static polymorphism
  - Policy-based design and when it beats inheritance
---

Think of a power drill. The motor, the grip and the trigger are built once. The bit is not: you snap in a wood bit, a masonry bit or a screwdriver tip, depending on the job. Nobody builds six drills for six kinds of hole. And the bit is chosen before you start drilling, not halfway through each turn.

This lesson is about building C++ classes the same way. Two techniques do it, both resolved entirely while compiling.

The first you have met. The RAII module's lesson on vtables introduced **CRTP**, the Curiously Recurring Template Pattern: a class derives from a base template given the class itself, `class Thermistor : public SensorBase<Thermistor>`, so the base can call the derived class with no virtual call. Here CRTP gets new jobs: bolting the same feature onto many unrelated types (a **mixin**), and checking at compile time that a derived class really supplies what the base needs. Then comes the C++23 feature that replaces much of CRTP's ceremony, **deducing this**.

The second is **policy-based design**: a class written once whose parts — where it stores data, whether it locks — are template parameters, like drill bits. It is how one telemetry logger can serve both a desktop simulation and a flight computer from the same source. The lesson ends with the honest part: when that beats inheritance, and when it costs more than it saves.

## CRTP as a mixin

A **mixin** is a small base class whose only job is to add a feature to whatever class inherits it. The word comes from ice-cream shops, where you "mix in" nuts or candy to a plain flavor.

Here is the problem a mixin solves. A 3-D vector and a quaternion (the four-number attitude representation from the kinematics modules) both need `+`, `-` and multiplication by a scalar. The rule for each operator is the same every time: `a + b` is "copy `a`, then `+=` `b`". Writing that for every type is repetition, and repetition is where the one wrong minus sign hides.

With CRTP, the base knows the derived type `D`, so it can write the operators in terms of `D`'s own `+=`, `-=` and `*=`:

```cpp
template <typename D>
struct Arithmetic {
    friend D operator+(D a, const D& b) { a += b; return a; }
    friend D operator-(D a, const D& b) { a -= b; return a; }
    friend D operator*(D a, double k)   { a *= k; return a; }
    friend D operator*(double k, D a)   { a *= k; return a; }
};
```

Read `friend D operator+(D a, const D& b)` as "a friend function, `operator+`, that takes a `D` by value and a `D` by const reference and returns a `D`". Each is a **[[hidden friend|hidden-friend]]**: a non-member function defined inside the class body. It is not a member, so `2.0 * v`, whose left side is a plain `double`, works too. Taking `a` by value gives the function its own copy to modify and return.

::: example Two mixins on two types
```cpp
#include <cstddef>
#include <cstdio>

// Mixin 1: give + - and scalar * to any type that has += -= and *=.
template <typename D>
struct Arithmetic {
    friend D operator+(D a, const D& b) { a += b; return a; }
    friend D operator-(D a, const D& b) { a -= b; return a; }
    friend D operator*(D a, double k)   { a *= k; return a; }
    friend D operator*(double k, D a)   { a *= k; return a; }
};

// Mixin 2: give print() to any type that has name() and write(buf, size).
template <typename D>
struct Printable {
    void print() const {
        const D& self = static_cast<const D&>(*this);
        char buf[96];
        self.write(buf, sizeof buf);
        std::printf("%s%s\n", D::name(), buf);
    }
};

struct Vec3 : Arithmetic<Vec3>, Printable<Vec3> {
    double x = 0, y = 0, z = 0;
    Vec3(double x_, double y_, double z_) : x(x_), y(y_), z(z_) {}
    Vec3& operator+=(const Vec3& o) { x += o.x; y += o.y; z += o.z; return *this; }
    Vec3& operator-=(const Vec3& o) { x -= o.x; y -= o.y; z -= o.z; return *this; }
    Vec3& operator*=(double k)      { x *= k;   y *= k;   z *= k;   return *this; }
    static const char* name() { return "Vec3"; }
    void write(char* b, std::size_t n) const { std::snprintf(b, n, "(%.3f, %.3f, %.3f)", x, y, z); }
};

struct Quat : Arithmetic<Quat>, Printable<Quat> {
    double w = 1, x = 0, y = 0, z = 0;
    Quat(double w_, double x_, double y_, double z_) : w(w_), x(x_), y(y_), z(z_) {}
    Quat& operator+=(const Quat& o) { w += o.w; x += o.x; y += o.y; z += o.z; return *this; }
    Quat& operator-=(const Quat& o) { w -= o.w; x -= o.x; y -= o.y; z -= o.z; return *this; }
    Quat& operator*=(double k)      { w *= k;   x *= k;   y *= k;   z *= k;   return *this; }
    static const char* name() { return "Quat"; }
    void write(char* b, std::size_t n) const { std::snprintf(b, n, "[%.4f, %.4f, %.4f, %.4f]", w, x, y, z); }
};

int main() {
    const Vec3 r{7000e3, 0, 0};            // position, m
    const Vec3 v{0, 7546.0, 0};            // velocity, m/s
    const double dt = 0.5;                 // one half-second step, s
    (r + v * dt).print();                  // new position after the step

    const Quat q{1, 0, 0, 0};              // attitude: no rotation
    const Quat qdot{0, 0, 0, 0.005};       // its rate of change, per second
    (q + dt * qdot).print();               // one Euler step, not yet normalised

    std::printf("sizeof(Vec3) = %zu, sizeof(Quat) = %zu\n", sizeof(Vec3), sizeof(Quat));
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
Vec3(7000000.000, 3773.000, 0.000)
Quat[1.0000, 0.0000, 0.0000, 0.0025]
sizeof(Vec3) = 24, sizeof(Quat) = 32
```

Walk through it.

1. `v * dt` finds `operator*(D a, double k)` from `Arithmetic<Vec3>`, with `D` = `Vec3`. It copies `v`, runs `Vec3::operator*=`, and returns $(0, 3773, 0)$.
2. `r + ...` uses `operator+` the same way: $(7\,000\,000, 0, 0) + (0, 3773, 0)$. Sanity check: a spacecraft at 7,000 km from Earth's center moving at 7,546 m/s travels $7546 \times 0.5 = 3773$ m in half a second, all sideways.
3. `dt * qdot` uses the scalar-on-the-left version, which only a non-member function can provide. $0.5 \times 0.005 = 0.0025$, added to the identity quaternion.
4. `.print()` comes from `Printable`, which calls each type's own `write` and `name`.
5. The sizes: `Vec3` is three `double`s, 24 bytes, and `Quat` four, 32 bytes. The two mixin bases add **[[nothing at all|empty-base]]**, and there is no vtable pointer.

Two lines of inheritance gave two types eight operators and a print function each. A third type costs the same two lines.
:::

::: warning Mixins do not replace C++20's comparison rules
Do not write a `Comparable<D>` mixin to generate `!=`, `<=` and the rest. Since C++20, a defaulted `operator<=>` and `operator==` already give every comparison, as the operator-overloading lesson showed. Mixins earn their place for things the language does not generate: arithmetic from compound assignment, printing, counting instances, serializing.
:::

## Checking the interface at compile time

A CRTP base depends on its derived class to supply certain functions. `Printable<D>` needs `D::name()` and `D::write`. Forget one and you get an error, but from deep inside the base template, naming the base's line rather than your mistake.

You cannot check this in the base's class body. When the compiler reads `struct Vec3 : Printable<Vec3>`, it instantiates `Printable<Vec3>` before it has seen a single member of `Vec3`. At that moment `Vec3` is an **[[incomplete type|incomplete-type]]**: its name exists, its contents do not.

A member function body is different. It is only instantiated when called, long after the derived class is complete. So put the check there, with a `static_assert` around a `requires` expression from lesson 6:

```cpp
template <typename Derived>
class SensorBase {
public:
    double sample() const {
        static_assert(requires(const Derived& d) {
                          { d.read_raw() } -> std::convertible_to<double>;
                      },
                      "a sensor must provide: int read_raw() const");
        const Derived& self = static_cast<const Derived&>(*this);
        return scale_ * self.read_raw() + bias_;
    }
private:
    SensorBase(double scale, double bias) : scale_(scale), bias_(bias) {}
    friend Derived;                 // only Derived can build its base
    double scale_, bias_;
};
```

Read the `requires` expression aloud: "given a `const Derived&` called `d`, the expression `d.read_raw()` must compile, and its result must convert to `double`". It is `true` or `false`, and `static_assert` turns `false` into your own message.

A `SunSensor` that names its function `read_counts` by mistake now fails like this (g++ 13.3):

```text
si_ok.cpp: In instantiation of 'double SensorBase<Derived>::sample() const [with Derived = SunSensor]':
si_ok.cpp:39:35:   required from here
si_ok.cpp:8:23: error: static assertion failed: a sensor must provide: int read_raw() const
```

The first error line states the rule that was broken, in your words. A second error, about `read_raw` missing, still follows, but you have read the answer by then.

The constructor trick guards a different slip. CRTP's classic copy-paste mistake is `class PressureTap : public SensorBase<Thermistor>` — the wrong name in the angle brackets. Then the base would `static_cast` a `PressureTap` to a `Thermistor`, which is undefined behavior. Making the base's constructor `private` and declaring `friend Derived;` means only the class named in the brackets can construct the base:

```text
si.cpp:35:41: error: 'SensorBase<Derived>::SensorBase(double, double) [with Derived = Thermistor]' is private within this context
```

::: key
CRTP: a base class templated on its derived type, so calls are resolved at compile time and inlined — static polymorphism, with no virtual call and no vtable pointer. Check the derived class's interface with a `static_assert` inside a member function (the derived class is incomplete in the base's body), and make the base's constructor private with `friend Derived;` so the wrong derived class cannot use it.
:::

## Deducing this: CRTP without the template base

All CRTP exists to answer one question: inside a base member function, what is the real type of the object? CRTP answers by passing the type in as a template argument, then casting.

C++23 answers more directly. A member function may name its object as an ordinary first parameter, marked with `this`:

```cpp
void print(this const auto& self);
```

Read it as "print, whose object is `self`, a const reference of whatever type it is called on". This is the **explicit object parameter**, nicknamed **[[deducing this|deducing-this-name]]**. The type of `self` is deduced at each call, like any `auto` parameter. Call `print` on a `Vec3` and `self` is a `const Vec3&`, already the derived type — no template argument on the base, no cast.

::: example The Printable mixin, rewritten in C++23
```cpp
#include <cstddef>
#include <cstdio>

// C++23: the mixin is an ordinary class. Each member names its own object
// as a parameter, "this const auto& self", whose type is deduced at the call.
struct Printable {
    void print(this const auto& self) {
        char buf[96];
        self.write(buf, sizeof buf);
        std::printf("%s%s\n", self.name(), buf);
    }
};

struct Vec3 : Printable {
    double x = 0, y = 0, z = 0;
    static const char* name() { return "Vec3"; }
    void write(char* b, std::size_t n) const { std::snprintf(b, n, "(%.3f, %.3f, %.3f)", x, y, z); }
};

struct Rates : Printable {
    double p = 0, q = 0, r = 0;          // body rates, rad/s
    static const char* name() { return "Rates"; }
    void write(char* b, std::size_t n) const { std::snprintf(b, n, "(p=%.4f q=%.4f r=%.4f)", p, q, r); }
};

int main() {
    Vec3{{}, 1.0, 2.0, 3.0}.print();
    Rates{{}, 0.01, -0.02, 0.0}.print();
    std::printf("sizeof(Vec3) = %zu\n", sizeof(Vec3));
}
```

The g++ 13.3 on this machine does not support it. It stops at the first `this`:

```text
cod_cpp_05_08_ex2.cpp:7:16: error: expected identifier before 'this'
```

GCC added explicit object parameters in version 14, and clang in version 18. Built with `clang++ -std=c++23 -Wall -Wextra -O2` (clang 18.1.3):

```text
Vec3(1.000, 2.000, 3.000)
Rates(p=0.0100 q=-0.0200 r=0.0000)
sizeof(Vec3) = 24
```

Step by step:

1. `Printable` is no longer a template. `struct Vec3 : Printable` names it plainly — no chance of the copy-paste slip, because there is no argument to get wrong.
2. `Vec3{{}, 1.0, 2.0, 3.0}` builds a `Vec3` as an aggregate. The first `{}` is its empty `Printable` base; the three numbers fill `x`, `y`, `z`.
3. `.print()` deduces `self` as `const Vec3&`. `self.write` and `self.name()` go straight to `Vec3`'s functions, resolved while compiling.
4. For `Rates`, the same `print` is instantiated a second time with `self` as `const Rates&`. It is still a template underneath; only the spelling got simpler.
5. `Vec3` is still 24 bytes: the empty base still costs nothing.
:::

::: warning Deducing this sees the static type
`self` gets the type of the *expression* you call it on, known while compiling — not the object's real type at run time. Write `const Printable& base = v; base.print();` and `self` is deduced as `const Printable&`. clang 18 then fails with `no member named 'write' in 'Printable'`. It is not a virtual call and does not pretend to be one.
:::

When to use which? On a C++23 compiler, deducing this is the cleaner way to write member-function mixins. CRTP still has jobs it cannot take over: a mixin that must supply non-member functions, like `2.0 * v`, where the object is not on the left; code that must build with C++20 or older compilers, which in flight software is common; and a base that needs the derived type in its own declarations, such as a `static` counter per derived type.

## Policy-based design

Back to the drill. A **policy** is a small class that supplies one decision — where records are stored, how access is locked, what happens on an error — through a fixed set of member functions. A **host** class takes its policies as template parameters and calls them. The combination is fixed while compiling. That is **[[policy-based design|alexandrescu]]**.

The standard library is full of it, under other names: `std::vector<T, Allocator>` takes a memory policy, `std::unique_ptr<T, Deleter>` a clean-up policy, and `std::unordered_map` takes its hash function as a template parameter.

Here is the flight-software case. A telemetry log records timestamped values. On the flight computer it must never touch the heap and runs on one thread. In the desktop simulation it should keep everything and may be fed by several threads. One class, two pairs of policies:

- **Storage policy**: `RingStorage<N>`, a fixed `std::array` that overwrites the oldest record when full, or `GrowingStorage`, a `std::vector` that grows. Each must supply `push`, `size` and `at`.
- **Locking policy**: `NoLock`, whose `lock` and `unlock` do nothing, or `MutexLock`, which wraps a `std::mutex`. Each must supply `lock` and `unlock`.

::: example One logger, configured two ways
```cpp
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <mutex>
#include <vector>

struct Record {
    std::uint32_t t_ms;   // time tag, ms
    float value;          // the measurement
};

// ---- storage policies: where records go --------------------------------
template <std::size_t N>
class RingStorage {                      // fixed size, no heap: for flight
public:
    void push(const Record& r) {
        buf_[(head_ + count_) % N] = r;
        if (count_ < N) ++count_; else head_ = (head_ + 1) % N;   // overwrite oldest
    }
    std::size_t size() const { return count_; }
    const Record& at(std::size_t i) const { return buf_[(head_ + i) % N]; }
private:
    std::array<Record, N> buf_{};
    std::size_t head_ = 0, count_ = 0;
};

class GrowingStorage {                   // grows without limit: for a desktop sim
public:
    void push(const Record& r) { v_.push_back(r); }
    std::size_t size() const { return v_.size(); }
    const Record& at(std::size_t i) const { return v_[i]; }
private:
    std::vector<Record> v_;
};

// ---- locking policies: what happens around each push -------------------
struct NoLock {                          // one thread only: nothing to do
    void lock() {}
    void unlock() {}
};

struct MutexLock {                       // several threads: a real mutex
    void lock() { m_.lock(); }
    void unlock() { m_.unlock(); }
private:
    std::mutex m_;
};

// ---- the host class: written once, configured by its policies ----------
template <class Storage, class Locking>
class TelemetryLog {
public:
    void record(std::uint32_t t_ms, float value) {
        std::lock_guard<Locking> guard(lock_);   // lock_.lock() now, unlock() at }
        store_.push(Record{t_ms, value});
    }
    std::size_t size() const { return store_.size(); }
    const Record& oldest() const { return store_.at(0); }
private:
    Storage store_;
    [[no_unique_address]] Locking lock_;
};

using FlightLog = TelemetryLog<RingStorage<64>, NoLock>;
using SimLog    = TelemetryLog<GrowingStorage, MutexLock>;

int main() {
    FlightLog flight;
    SimLog sim;
    for (std::uint32_t k = 0; k < 70; ++k) {          // 70 samples at 100 Hz
        flight.record(10 * k, 0.5f * k);
        sim.record(10 * k, 0.5f * k);
    }
    std::printf("flight: %zu records, oldest t = %u ms\n", flight.size(), flight.oldest().t_ms);
    std::printf("sim:    %zu records, oldest t = %u ms\n", sim.size(), sim.oldest().t_ms);
    std::printf("sizeof(FlightLog) = %zu\n", sizeof(FlightLog));
    std::printf("sizeof(TelemetryLog<RingStorage<64>, MutexLock>) = %zu\n",
                sizeof(TelemetryLog<RingStorage<64>, MutexLock>));
    std::printf("sizeof(SimLog) = %zu\n", sizeof(SimLog));
}
```

Output, the same from g++ 13.3 and clang++ 18.1.3:

```text
flight: 64 records, oldest t = 60 ms
sim:    70 records, oldest t = 0 ms
sizeof(FlightLog) = 528
sizeof(TelemetryLog<RingStorage<64>, MutexLock>) = 568
sizeof(SimLog) = 64
```

Check each line.

1. Seventy samples went in, every 10 ms. The ring holds 64, so the first $70 - 64 = 6$ were overwritten. The oldest left is sample 6, at $6 \times 10 = 60$ ms. The growing log kept all 70, starting at 0 ms.
2. `FlightLog` is 528 bytes: $64 \times 8 = 512$ bytes of records (a 4-byte time and a 4-byte `float` each), plus two 8-byte counters. The `NoLock` member adds 0 bytes, thanks to `[[no_unique_address]]` — read it as "this member need not have an address of its own". Remove that attribute and the size becomes 536: an empty member normally takes one byte, padded to eight.
3. Swap in `MutexLock` and the same log is 568 bytes: a `std::mutex` is 40 bytes on this Linux system.
4. `SimLog` is a `std::vector` (24 bytes: three pointers) plus the 40-byte mutex, 64 bytes. Its records live on the heap.

Look at the machine code g++ `-O2` produced for `FlightLog::record`: 17 instructions, with no call at all. The empty `lock` and `unlock` vanished completely. And `% 64` became a bit mask, `andl $63`, because `N` is a compile-time constant. `SimLog::record`, by contrast, calls `pthread_mutex_lock`, `pthread_mutex_unlock`, and can call the memory allocator. Each build pays only for the parts it chose.
:::

::: key
Policy-based design: behavior is injected as template parameters (a storage policy, a locking or checking policy), so the composition is resolved at compile time with no virtual calls. It is how you make a library configurable for both a desktop sim and a flight target from one source.
:::

### When it beats inheritance

The run-time alternative is an abstract `ILogStorage` with virtual `push`, and an abstract `ILock`, each passed in by pointer. Compare:

- **Zero overhead.** Policies are called directly and inlined; an empty policy costs no bytes and no instructions. The virtual version pays two pointers, a vtable pointer in each part, and indirect calls that block inlining — the cost measured in the RAII module.
- **Composition at compile time.** A wrong combination, like a storage policy without `push`, is a build error, not a crash on the pad.
- **Every configuration is a real type.** `FlightLog` can be checked: `static_assert(sizeof(FlightLog) <= 1024)` holds a RAM budget in the build.

### When it does not

- **[[Type explosion|type-explosion]].** Every combination is a different, unrelated type. Three storage policies times two locking policies times two error policies is twelve classes. You cannot put a `FlightLog` and a `SimLog` in one array, and every function that takes "any log" must itself be a template.
- **Build time and code size.** Each combination instantiates its own copy of every member function, and the code lives in headers that every file re-compiles. Lesson 10 measures this cost.
- **No run-time choice.** A configuration file cannot pick a policy after the program is built. If an operator must switch storage on the ground, you need a run-time mechanism: a virtual interface, or a `std::variant`.
- **Harder errors.** A policy missing one function produces a template error from inside the host. The `static_assert`-with-`requires` check above, or a concept on each policy parameter, is the cure.

The usual engineering answer is a mix: policies inside a component, where the inner loops are, and a plain interface at the component's boundary, where one run-time choice is made once.

## Check yourself

::: check
Every `Arithmetic<D>` instantiation defines `operator+`. Why do `Arithmetic<Vec3>` and `Arithmetic<Quat>` not clash, and why does `v + w` for two `Vec3`s find the right one?
:::

::: answer
They are two different classes, stamped from one template, and each defines functions whose parameters are its own `D`: one `operator+(Vec3, const Vec3&)` and one `operator+(Quat, const Quat&)`. Different parameter types mean two different overloads, not a clash. The call `v + w` finds them by argument-dependent lookup: the arguments are `Vec3`s, a `Vec3`'s base classes count as associated classes, so the compiler looks inside `Arithmetic<Vec3>` and finds its hidden friend. It never even considers the `Quat` version.
:::

::: check
Why does the interface check in `SensorBase` go inside `sample()` and not directly in the class body, as `static_assert(requires(const Derived& d) { d.read_raw(); });`?
:::

::: answer
Because the base is instantiated at the point `class Thermistor : public SensorBase<Thermistor>` is read, before any of `Thermistor`'s members have been seen. In the base's body `Derived` is incomplete, so the requirement would be checked against a class with no known members and be false (or an error) even for a correct sensor. A member function's body is instantiated only when the function is used, by which time `Thermistor` is complete, so the check there sees the real class.
:::

::: check
A team on g++ 13 wants the C++23 `Printable`. What happens, and what are their options?
:::

::: answer
It does not compile: g++ 13 does not implement explicit object parameters and reports `expected identifier before 'this'` at the first `this` parameter. Their options: move to a compiler that supports it (g++ 14 or newer, or clang 18 or newer) with `-std=c++23`, or keep the CRTP form, `template <typename D> struct Printable` with `static_cast<const D&>(*this)`, which works on every compiler they have and gives the same generated code.
:::

::: check
Your ring storage is `RingStorage<64>`. Someone proposes `RingStorage<100>` "for a round number". Using the lesson's evidence, what does that change in the generated code, and does it matter?
:::

::: answer
With `N` = 64 the compiler replaced `% N` with a bit mask (`andl $63`), a single fast instruction, because 64 is a power of two known while compiling. With `N` = 100 it must compute a true remainder; with a constant divisor compilers typically use a multiply-and-shift sequence rather than a divide, which is a few instructions longer. For a log written at 100 Hz the difference is irrelevant. The size does matter for RAM: $100 \times 8 = 800$ bytes of records instead of 512. The point generalizes: because `N` is a template parameter, the compiler optimizes for the exact value you chose.
:::

::: check
A ground-station tool must let an operator choose, from a settings file at start-up, whether the log grows or wraps. Is `TelemetryLog<Storage, Locking>` the right tool for that choice? What would you do?
:::

::: answer
Not on its own. The policy is fixed while compiling, so a file read at run time cannot pick it; `TelemetryLog<RingStorage<64>, MutexLock>` and `TelemetryLog<GrowingStorage, MutexLock>` are unrelated types. Put the run-time choice at the boundary: an abstract interface with virtual `record` and `size`, with two implementations that each wrap one policy-based log, or a `std::variant` of the two log types visited with `std::visit`. The choice is made once, at start-up; inside each log the calls stay direct and inlined.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| mixin | a base that adds one feature | `struct Vec3 : Arithmetic<Vec3>, Printable<Vec3>`; empty bases cost 0 bytes |
| hidden friend | non-member operator defined in the base | found by argument-dependent lookup; allows `2.0 * v` |
| static interface check | `static_assert(requires ...)` in a member function | not in the base's body: `Derived` is incomplete there |
| private base constructor | `friend Derived;` | stops `B : Base<A>` copy-paste slips |
| deducing this | `void f(this const auto& self)` | C++23; g++ 14+, clang 18+; deduces the static type |
| policy | a template parameter supplying one decision | resolved while compiling, inlined, empty ones cost nothing |
| `[[no_unique_address]]` | empty member takes no space | `FlightLog` 528 bytes, not 536 |
| policy costs | type explosion, build time | no run-time choice; mix with an interface at the boundary |

The next lesson uses CRTP at its most ambitious: expression templates, where `a + b + c` on matrices builds a small tree of types instead of computing anything — which is how Eigen avoids temporary matrices.

::: context hidden-friend How the compiler finds a friend defined inside a class
A friend function defined inside a class body is not visible to ordinary name lookup at all. The only way to reach it is **argument-dependent lookup** (ADL): when a call has arguments of class type, the compiler also searches those classes and their base classes. Because `Vec3` derives from `Arithmetic<Vec3>`, `v + w` searches `Arithmetic<Vec3>` and finds its `operator+`. This is why the pattern is called a "hidden" friend: it cannot be called by accident on unrelated types, and it keeps the overload list short, which also speeds compilation.
:::

::: context empty-base Why the empty bases take no room
A class with no data still has size 1 on its own, so that two different objects never share an address. As a base class, though, it may occupy no bytes — the **empty base optimization**, which g++ and clang apply here.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="12" y="20" font-size="12" fill="#1f2a44" font-weight="700">Vec3: 24 bytes</text>
  <rect x="20" y="36" width="104" height="34" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="124" y="36" width="104" height="34" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="228" y="36" width="104" height="34" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="72" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">x (8)</text>
  <text x="176" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">y (8)</text>
  <text x="280" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">z (8)</text>
  <line x1="20" y1="80" x2="20" y2="100" stroke="#b4232c" stroke-width="2"/>
  <text x="26" y="96" font-size="11" fill="#b4232c">Arithmetic&lt;Vec3&gt;, Printable&lt;Vec3&gt;: 0 bytes, no vptr</text>
  <text x="20" y="120" font-size="11" fill="#6c7a93">byte 0</text>
  <text x="332" y="120" font-size="11" fill="#6c7a93" text-anchor="end">byte 24</text>
</svg>
```

That is why `sizeof(Vec3)` is 24, exactly its three `double`s.
:::

::: context incomplete-type A name without contents
A type is **incomplete** when the compiler knows the name but not yet the members or size, like a class that has been declared but whose closing brace has not been reached. You can form pointers and references to it, but you cannot ask its size or call its members. Inside `class Thermistor : public SensorBase<Thermistor> { ... };`, `Thermistor` becomes complete only at the final `};`. The base list is read before the opening brace, so the base sees an incomplete class.
:::

::: context deducing-this-name Where the feature came from
The proposal was paper P0847, "Deducing this", by Gašper Ažman, Sy Brand, Ben Deane and Barry Revzin, adopted into C++23. The standard calls the feature an *explicit object parameter*; the nickname is the paper's title. Beyond mixins, it lets one function body replace the four near-copies (const, non-const, lvalue, rvalue) that getters sometimes needed, and it lets a lambda call itself recursively by naming `self`.
:::

::: context alexandrescu The book that named it
Andrei Alexandrescu set out policy-based design in *Modern C++ Design* (2001), with a library called Loki that built smart pointers, singletons and object factories from policies. The book was also one of the first to show how far template tricks could go, and much of what it did with elaborate machinery is now written with `if constexpr`, concepts and variadic templates. The idea of injecting behavior as a template parameter has stayed in everyday use.
:::

::: context type-explosion Every combination is a new type
Policies multiply. Three storage choices and two lock choices make six unrelated classes, each compiled separately.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="120" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">NoLock</text>
  <text x="270" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">MutexLock</text>
  <text x="8" y="56" font-size="12" fill="#1f2a44">Ring&lt;64&gt;</text>
  <text x="8" y="102" font-size="12" fill="#1f2a44">Ring&lt;256&gt;</text>
  <text x="8" y="148" font-size="12" fill="#1f2a44">Growing</text>
  <rect x="72" y="34" width="96" height="34" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="222" y="34" width="96" height="34" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="72" y="80" width="96" height="34" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="222" y="80" width="96" height="34" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="72" y="126" width="96" height="34" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="222" y="126" width="96" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <text x="120" y="56" font-size="11" fill="#1f2a44" text-anchor="middle">FlightLog</text>
  <text x="270" y="148" font-size="11" fill="#1f2a44" text-anchor="middle">SimLog</text>
  <text x="120" y="102" font-size="11" fill="#6c7a93" text-anchor="middle">type 3</text>
  <text x="270" y="56" font-size="11" fill="#6c7a93" text-anchor="middle">type 2</text>
  <text x="270" y="102" font-size="11" fill="#6c7a93" text-anchor="middle">type 4</text>
  <text x="120" y="148" font-size="11" fill="#6c7a93" text-anchor="middle">type 5</text>
</svg>
```

Only the combinations a program actually uses are instantiated, so in practice the count is what you use, not the full grid. It still grows with every new policy axis.
:::
