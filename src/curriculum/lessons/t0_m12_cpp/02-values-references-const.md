---
id: l02-values-references-const
title: Value semantics, references and const
minutes: 25
covers:
  - value semantics, references, const-correctness
---

Suppose a friend asks to see your homework. You can hand over a photocopy — whatever they scribble on it, your page stays clean. Or you can lend them the notebook itself, and then any change they make is a change to your notebook. Or you can lend it with a rule: look, but do not write.

Those three choices are this whole lesson. In Python, `b = a` hands over the notebook: both names point at the same object, and appending to `b` changes what `a` sees. In C++, `b = a` makes the photocopy: a second object holding a copy of the first. This is the biggest mental shift a Python programmer makes, and everything else here — references, pointers, `const` — is built on top of it.

The shift pays off in flight software. A control loop that shares state between modules through hidden aliases is one whose data flow nobody can read off the page. A reviewer would have to trace every link to learn who might have changed the navigation state between the sensor read and the actuator write. In C++, copies are the safe default (a copy is yours alone), sharing is visible in the function's signature, and `const` turns "I will only read this" into a promise the compiler enforces. Read a well-written C++ signature and you know what the function can change without opening its body.

There is a speed story too, but it comes second. A 24-byte vector copies in a couple of machine instructions; a `std::vector` of samples copies by grabbing new memory. The language lets you choose, for each parameter, whether the caller's object is copied, borrowed for reading, or borrowed for writing.

## Variables are objects

Every C++ variable names an **object**: a patch of memory with a type, a size and a **lifetime** — the stretch of time it exists. `double x = 3.0;` sets aside eight bytes and puts a number in them. `Vec3 a{1.0, 2.0, 3.0};` sets aside 24 bytes for a struct of three doubles.

**Assignment** copies a value into storage that already exists. For a struct, it copies member by member. There is no separate "object somewhere" that the variable points to. The variable *is* the object. That is what **value semantics** means.

Compare Python. There, `a = [1, 2]` makes `a` a **[[name tag|name-tags]]** on a list stored elsewhere, and `b = a` puts a second tag on the same list. NumPy arrays behave the same way. That is why `y = x; y[0] = 0` in the Python module changed `x`, and why you had to write `x.copy()` to stop it. In C++ the copy is the default, and sharing is what you have to ask for.

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

Walk through it.

- `b` is a photocopy with its own 24 bytes (three doubles of 8 bytes each) at its own place in memory. Writing `b.x = 100.0` cannot touch `a`, so `a.x` is still 1.
- `r` is declared with `Vec3&`, read "Vec3 reference". It has no storage of its own: it is a second name for `a`. So `r.y = 200.0` changes `a.y`.
- `&a`, read "address of a", gives the object's **[[address|memory-addresses]]** — its location in memory. `&a == &r` is true because they are the same object. `&a == &b` is false because `b` lives somewhere else.

The `&` sign has two jobs. In front of an existing variable, as in `&a`, it means "address of". In a declaration, as in `Vec3& r`, it means "reference". The next section covers the second meaning.
:::

Two things follow.

First, a copy is safe by construction. A snapshot of the vehicle state taken for a fault log is truly independent. No later update can disturb it.

Second, a copy costs time in proportion to the object's size. A `Vec3` costs almost nothing. A $6 \times 6$ matrix of doubles is $36 \times 8 = 288$ bytes. A `std::vector` of a million samples owns memory on the heap, and copying it means finding room for another million values and filling them. That cost is why the language also lets you borrow an object instead of copying it.

One more detail: structs do not get `==` for free. In C++20 you ask for the obvious member-by-member comparison with one line inside the struct, `bool operator==(const Vec3&) const = default;`. The same works for `<=>`, the ordering comparison.

## References: another name for an existing object

A **reference** is a nickname. `T& r = obj;` declares `r` as a reference to `obj`. Four rules come with it:

- it must be given its object when declared;
- it refers to that same object for its whole life;
- it can never be null (refer to nothing);
- it has no arithmetic of its own — every operation on `r` is an operation on `obj`.

Those limits are what make references safe to pass around. A function taking a `const Vec3&` can rely on there being a vector there.

References show up mostly in two places: function parameters and range-for loops. For parameters, C++ gives you three ways to receive an argument — the photocopy, the loan with "look but do not write", and the full loan. You choose among them on every function you write:

| Parameter | What the callee receives | Use it when |
| --- | --- | --- |
| `T v` | its own copy | `T` is small — a `double`, an `enum`, a `Vec3`, a pointer — or you need a copy anyway |
| `const T& v` | a read-only alias of the caller's object | `T` is large or expensive to copy and you only read it |
| `T& v` | a mutable alias of the caller's object | the function's purpose is to modify the caller's object in place |

"Small" means a few **[[machine words|machine-word]]** — up to two or three doubles is a reasonable line. A `const T&` costs the size of one address, eight bytes on a 64-bit machine, however large `T` is.

A plain `T&` parameter announces that the function changes the caller's object. You want that visible. So prefer returning a new value where you can, and keep `T&` for true in-place updates, such as an integrator advancing a state.

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

Follow the vector $(3, 4, 0)$ through it.

- `norm` gets its own copy — cheap for 24 bytes. The length is $\sqrt{9 + 16 + 0} = 5$.
- Inside `normalized`, `v` is the caller's `thrust_dir` under another name, and `const` forbids the body from changing it. The result is a fresh `Vec3`, $(3/5, 4/5, 0) = (0.6, 0.8, 0)$, returned by value. Lesson 3 explains why that return costs nothing.
- `normalize_in_place` takes `Vec3&`, so the change is visible to the caller. It is also visible to a reader, because the signature has no `const`.

Sanity check: the final norm prints 1, as a unit vector's should.
:::

Range-for loops have the same choice. `for (const auto& s : samples)` visits each element without copying. `for (auto s : samples)` copies every element into `s`. For a container of `double` that is harmless. For a container of $6 \times 6$ matrices it copies 288 bytes per pass for nothing. Write `const auto&` unless you need a copy, and write `auto&` when you mean to change the elements.

## Pointers, briefly

A **pointer** is an address written on a sticky note. `T* p`, read "p is a pointer to T", holds the address of a `T`.

- `&x` produces the address of `x`.
- `*p`, read "star p", is the object at that address — "follow the note".
- `p->member` is shorthand for `(*p).member`.

Unlike a reference, a pointer may hold **`nullptr`** — "points at nothing" — and may be changed to point somewhere else. It also supports arithmetic that steps through an array. Those extra powers are exactly what references lack, so the choice between them has a clear rule:

- use a **reference** when an object must be there;
- use a **pointer** when "absent" is a legitimate answer, or when the address itself is the point — a hardware register at a fixed location, or a position inside a buffer.

```cpp
#include <iostream>

struct Sample { double value; bool valid; };

// A pointer parameter says "may be absent"; a reference cannot be null.
double value_or(const Sample* s, double fallback) {
  if (s == nullptr || !s->valid) return fallback;
  return s->value;
}

int main() {
  const Sample good{9.81, true};
  std::cout << value_or(&good, -1.0) << "\n";
  std::cout << value_or(nullptr, -1.0) << "\n";
  return 0;
}
// Output:
// 9.81
// -1
```

The function checks for **[[null|billion-dollar-mistake]]** before following the pointer. (`||` means "or", and it stops at the first true part, so `s->valid` is never read when `s` is null.)

### Where `const` goes on a pointer

A pointer involves two things — the note and the object it points at — so `const` can lock either one. The rule: `const` applies to the thing on its left, or, if nothing is on its left, to the thing on its right. The easy way to use it is to **[[read the declaration right to left|const-right-to-left]]**:

- `const double* pc` reads "pc is a pointer to a double that is const". You may re-point `pc`, but you may not write `*pc = 1.0`.
- `double* const cp` reads "cp is a const pointer to a double". You may write `*cp = 1.0`, but `cp` itself cannot be re-pointed.

In modern C++ a raw pointer never *owns* anything — it never decides when the object is destroyed. Ownership is the subject of lesson 3.

## const-correctness

`const` appears in three places, with three meanings.

- **On a variable:** it cannot change after it is initialized.
- **On a reference or pointer parameter:** a read-only view of the caller's object.
- **After a member function's parameter list,** as in `double bias() const`: a promise that the function does not change the object. Only such functions may be called on a `const` object, or through a `const` reference.

That last rule makes `const` **propagate** — spread down the call chain. Once a function receives `const State&`, everything it calls on that state must itself be `const`, all the way down. A single non-`const` **getter** (a function that only returns a value) breaks the chain for every caller above it. So getters are `const`, without exception.

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

A gyro measures turn rate but reads a little high or low; that fixed error is its **bias**, and subtracting it gives the corrected rate. Check the numbers: $0.0105 - 0.002 = 0.0085$, and after the bias update, $0.0105 - 0.003 = 0.0075\,\mathrm{rad/s}$.

Some new words:

- `class` differs from `struct` only in its default: members are **private** (hidden from outside code) unless you say `public:`.
- The `explicit` on the constructor stops a bare `double` from silently turning into a `RateGyro` where one is expected.

Uncomment the call to `update_bias` inside `filter_step`, or try `frozen.update_bias(0.5)`, and the compiler refuses:

```text
consterr.cpp:10:21: error: passing 'const RateGyro' as 'this' argument discards
    qualifiers [-fpermissive]
```

"Discards qualifiers" is the compiler's way of saying "you promised not to change this, and now you are trying to". Inside any member function, the object is reachable as `this`, a **[[hidden pointer|this-pointer]]** to the object. In a `const` member function, `this` points to a `const` object.
:::

The habit to build is **const by default**. Declare every variable, parameter and member function `const` unless it must change. Remove the `const` only when the compiler shows you a real reason. Physical constants go one step further: `constexpr double kMuEarth = 3.986004418e14;` is `const` plus "known at compile time", which lesson 7 develops.

The gain is not mainly speed; the optimizer can often work out constness for itself. The gain is that the data flow of a 300-line estimator can be read straight from its declarations.

::: key
A C++ variable is an object with its own storage; `b = a` copies the value. A reference `T&` is another name for an existing object — always initialized, never reseated, never null. Pass small types by value, large types you only read by `const T&`, and use plain `T&` only when the function's purpose is to modify the caller's object.
:::

::: key
`const` propagates: a `const T&` parameter can only call `const` member functions, so getters are always `const`. Declare everything `const` by default and remove it only when the compiler shows you a real reason.
:::

## Lifetime and dangling references

A reference is a nickname, and a nickname does not keep anyone alive. If the object is destroyed, the reference **dangles** — it names something that no longer exists — and using it is undefined behavior. The classic case is returning a reference to a local variable:

```cpp
const Vec3& make_unit_x() {
  Vec3 local{1.0, 0.0, 0.0};
  return local;         // reference to an object about to be destroyed
}
```

```text
dangle.cpp:4:10: warning: reference to local variable 'local' returned [-Wreturn-local-addr]
```

`local` is destroyed the moment the function returns, so the caller receives a nickname for nothing. The compiler catches this one because the local is in plain sight.

It cannot catch a reference into a `std::vector` that a later `push_back` **[[moves to new memory|vector-reallocation]]**, or a reference to an element of a container that has since been cleared. One rule avoids the whole family: **return values, not references**, unless you are returning a reference to something the caller passed in, or to a member of a long-lived object. Returning by value is free for temporaries in C++17, as the next lesson shows.

::: warning
`for (auto row : matrix_rows)` copies every row, and `for (auto& row : matrix_rows)` lets the loop body change the container. If you want neither, write `const auto&`.

Similarly, `auto v = get_state();` copies. And `const auto& v = get_state();`, on a function returning by value, binds to the temporary result and stretches its lifetime to the end of the enclosing scope. That is safe, but only in that one special case: a `const` reference bound directly to a temporary.
:::

## Units as types

A `double` carries no unit. `fall_distance(3.0)` looks fine whether the argument is seconds or meters, and the compiler cannot help. Mixing units up is not a small risk: it has **[[destroyed a spacecraft|mars-climate-orbiter]]**.

Wrap each value in a one-member struct, and the compiler can help. A `struct Seconds { double value; }` has the same size as a `double` and compiles to the same instructions, so it costs nothing at run time. But now a mixed-up call is a compile error.

::: example Seconds and meters that cannot be swapped
```cpp
#include <iostream>

struct Seconds { double value; };
struct Meters  { double value; };

Meters fall_distance(Seconds t) {
  constexpr double g0 = 9.80665;   // m/s^2
  return Meters{0.5 * g0 * t.value * t.value};
}

int main() {
  static_assert(sizeof(Seconds) == sizeof(double), "no size cost");
  Seconds t{3.0};
  Meters d = fall_distance(t);
  std::cout << "fell " << d.value << " m\n";
  // fall_distance(d);   // error: no conversion from Meters to Seconds
  // fall_distance(3.0); // error: no conversion from double to Seconds
  return 0;
}
// Output:
// fell 44.1299 m
```

Three seconds of free fall under $g_0 = 9.80665\,\mathrm{m/s^2}$ covers

$$
\tfrac{1}{2} g_0 t^2 = 0.5 \times 9.80665 \times 3^2 = 0.5 \times 9.80665 \times 9 \approx 44.13\,\mathrm{m}.
$$

Sanity check: that is about the height of a 14-story building, a fair drop for three seconds.

The `static_assert` is a check the compiler runs while building; it proves the wrapper adds no size. Uncomment either wrong call and the build stops with `could not convert 'd' from 'Meters' to 'Seconds'`. The mistake fails before the program exists.
:::

This is the simplest form of "units as types". Lesson 7 extends it so that dividing `Meters` by `Seconds` gives a velocity type automatically, with every unit check done by the compiler and nothing left for run time.

## Check yourself

::: check
After `Vec3 a{1.0, 2.0, 3.0}; Vec3& r = a; Vec3 c = r; c.z = 9.0;`, what are `a.z` and `c.z`?
:::

::: answer
`a.z` is `3.0` and `c.z` is `9.0`. `r` is a second name for `a`, so `Vec3 c = r;` copies `a` into a new object `c`. Because `c` is declared as a plain `Vec3` (not `Vec3&`), it is a value with its own storage, and writing to `c.z` cannot reach `a`. Only `Vec3& c = r;` would have made `c` a third name for the same object.
:::

::: check
A colleague writes `void integrate(State s, double dt) { s.position += s.velocity * dt; }` and reports that the vehicle state never changes. Explain, and give two ways to fix it.
:::

::: answer
`State s` is a by-value parameter. `integrate` receives its own copy of the caller's state, changes the copy, and throws it away on return; the caller's object is untouched.

Fix one: take `State& s`, so the function changes the caller's object in place — and the signature now says so.

Fix two, usually better: take `const State& s` and return the new state by value, `State integrate(const State& s, double dt)`. The caller writes `state = integrate(state, dt);` and the data flow is plain to see.
:::

::: check
Given `double x = 1.0, y = 2.0; const double* p = &x; double* const q = &x;`, which of these four statements compile: `*p = 5.0;`, `p = &y;`, `*q = 5.0;`, `q = &y;`?
:::

::: answer
`p = &y;` and `*q = 5.0;` compile; the other two do not.

`const double* p` is a pointer to a `const double`. The object pointed at is read-only, so `*p = 5.0` is rejected, but the pointer itself can be re-pointed.

`double* const q` is a `const` pointer to a changeable `double`. `*q = 5.0` writes through it happily, but `q = &y` tries to change a `const` pointer. Read each declaration right to left and `const` lands on what it protects.
:::

::: check
A navigation filter has `double Estimator::covariance_trace()` without `const`. A reviewer says this one omission will force `const` to be removed from several other signatures. Why?
:::

::: answer
Because `const` propagates. Any function that receives `const Estimator&` — a telemetry formatter, a health monitor, a test helper — cannot call a non-`const` member function through that reference. To call `covariance_trace()`, those functions would have to take `Estimator&` instead. That in turn forces *their* callers to hold non-`const` estimators, and so on up the chain. Marking the getter `const` — which only states the truth, since it does not change the object — restores the chain at no cost.
:::

::: check
A Monte Carlo post-processor loops over a `std::array` of 100 covariance matrices, each $6 \times 6$ doubles, with `for (auto P : covariances) { trace_sum += trace(P); }`. How many bytes does the loop copy, and how would you make it copy none?
:::

::: answer
Each matrix is $36 \times 8 = 288$ bytes. The loop copies one matrix into `P` per pass, so $100 \times 288 = 28\,800$ bytes in all — for nothing, since `trace` only reads. Writing `for (const auto& P : covariances)` makes `P` a read-only alias of each element and copies nothing. The `const` also documents that the loop cannot change the array.
:::

## Summary

| Item | Meaning |
| --- | --- |
| value semantics | `b = a` copies; each variable is its own object with its own storage |
| `T&` | reference: another name for an existing object; initialized once, never null |
| `const T&` | read-only alias; the default for passing anything larger than a few words |
| `T v` by value | a copy; right for `double`, enums, `Vec3`-sized structs |
| `T*` | pointer: an address that may be null or re-pointed; non-owning in modern code |
| `const double*` vs `double* const` | pointee is const vs pointer is const; read right to left |
| `double f() const` | member function that cannot modify the object; required to call on a `const` object |
| const by default | declare everything `const` until the compiler proves you need otherwise |
| dangling reference | a reference whose object has been destroyed; returning a reference to a local is the classic case |
| units as types | `struct Seconds { double value; }` — zero-cost wrapper that makes mixed-up arguments a compile error |

The next lesson turns to what happens when an object *owns* something — heap memory, a file, a lock — and how C++ ties that ownership to lifetime so that nothing is ever leaked or freed twice.

::: context name-tags Name tags versus boxes
In Python a variable is a tag tied to an object. In C++ a variable is the box itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs><marker id="nt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <text x="85" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">Python: b = a</text>
  <rect x="14" y="36" width="30" height="20" rx="3" fill="#f2b880" stroke="#1f2a44"/><text x="29" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">a</text>
  <rect x="14" y="86" width="30" height="20" rx="3" fill="#f2b880" stroke="#1f2a44"/><text x="29" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">b</text>
  <rect x="96" y="56" width="70" height="32" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="131" y="77" font-size="12" text-anchor="middle" fill="#1f2a44">[1, 2]</text>
  <g stroke="#1f2a44" stroke-width="1.5" marker-end="url(#nt)"><line x1="44" y1="46" x2="94" y2="64"/><line x1="44" y1="96" x2="94" y2="80"/></g>
  <text x="85" y="134" font-size="11" fill="#6c7a93" text-anchor="middle">two tags, one object</text>
  <line x1="186" y1="10" x2="186" y2="140" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="272" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">C++: Vec3 b = a;</text>
  <text x="212" y="54" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <rect x="226" y="34" width="110" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="281" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">1, 2, 3</text>
  <text x="212" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">b</text>
  <rect x="226" y="80" width="110" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="281" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">1, 2, 3</text>
  <text x="272" y="134" font-size="11" fill="#6c7a93" text-anchor="middle">two boxes, two copies</text>
</svg>
```

Change the list through `b` in Python and `a` sees it. Change `b` in C++ and `a` never knows.
:::

::: context memory-addresses Memory is a row of numbered mailboxes
A computer's memory is a long row of bytes, and each byte has a number — its **address** — the way houses on a street have numbers. An 8-byte `double` fills eight neighboring bytes, and its address is the number of the first one. A pointer is a variable whose value is one of those numbers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="45" y="26">1000</text><text x="115" y="26">1008</text><text x="185" y="26">1016</text><text x="255" y="26">1024</text><text x="325" y="26">1032</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="34" width="66" height="34" fill="#fff"/>
    <rect x="82" y="34" width="66" height="34" fill="#8fb8f0"/>
    <rect x="152" y="34" width="66" height="34" fill="#fff"/>
    <rect x="222" y="34" width="66" height="34" fill="#fff"/>
    <rect x="292" y="34" width="56" height="34" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="115" y="56">3.0</text><text x="320" y="56">1008</text>
    <text x="115" y="88">x</text><text x="320" y="88">p</text>
  </g>
  <path d="M320,96 C320,124 115,124 115,98" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="115,94 110,104 120,104" fill="#b4232c"/>
  <text x="218" y="114" font-size="11" fill="#b4232c" text-anchor="middle">*p follows the address to x</text>
</svg>
```

Real addresses are much bigger numbers, usually printed in hexadecimal such as `0x7ffd5c3a1e08`, but the idea is the same.
:::

::: context machine-word What a "machine word" is
A **word** is the chunk of data a processor handles in one step — on today's 64-bit processors, 8 bytes. A `double`, a pointer and a reference each fit in one word. Passing one or two words to a function is as cheap as it gets: they travel in the processor's own registers, never touching memory. That is why "small enough to copy" means a few words, and why a `Vec3` (three words) is still cheap to pass by value.
:::

::: context billion-dollar-mistake The billion-dollar mistake
The British computer scientist Tony Hoare added the null reference to a programming language in 1965, because it was easy to build. In a 2009 talk he called it his "billion-dollar mistake", for the crashes and errors it has caused ever since. Following a null pointer in C++ is undefined behavior — usually a crash, sometimes worse. C++ references were designed so they can never be null, which is why they are the default whenever an object must exist.
:::

::: context const-right-to-left Two pointers, two different locks
Read each declaration from the name leftwards. The lock sits on whatever `const` touches.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs><marker id="cr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <text x="10" y="20" font-size="12" font-family="monospace" fill="#1f2a44">const double* p</text>
  <rect x="20" y="30" width="80" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="60" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">p</text>
  <rect x="200" y="30" width="110" height="30" rx="4" fill="#fff" stroke="#b4232c" stroke-width="2.5"/><text x="255" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">double: locked</text>
  <line x1="100" y1="45" x2="198" y2="45" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#cr)"/>
  <text x="150" y="38" font-size="11" text-anchor="middle" fill="#1d6fd1">can re-point</text>
  <text x="10" y="92" font-size="12" font-family="monospace" fill="#1f2a44">double* const q</text>
  <rect x="20" y="102" width="80" height="30" rx="4" fill="#8fb8f0" stroke="#b4232c" stroke-width="2.5"/><text x="60" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">q: locked</text>
  <rect x="200" y="102" width="110" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="255" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">double: writable</text>
  <line x1="100" y1="117" x2="198" y2="117" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#cr)"/>
  <text x="150" y="146" font-size="11" text-anchor="middle" fill="#6c7a93">red border = cannot change</text>
</svg>
```

You can lock both at once: `const double* const r` can neither be re-pointed nor written through.
:::

::: context this-pointer The hidden first argument
When you write `gyro.corrected(0.0105)`, the compiler quietly passes the address of `gyro` into the function as a hidden argument named `this`. It is the same idea as Python's `self`, except C++ does not make you write it out. Inside the member function, `bias_rad_s_` really means `this->bias_rad_s_`. Putting `const` after the parameter list changes the hidden argument's type to "pointer to a `const RateGyro`", which is why changing a member there is refused.
:::

::: context vector-reallocation Why push_back can leave a reference dangling
A `std::vector` keeps its elements side by side in one block of heap memory with some spare room. When a `push_back` finds no room left, the vector grabs a bigger block (typically about 1.5 to 2 times the size), moves every element across, and frees the old block. Any reference or pointer to an element of the old block now names freed memory. Nothing in the source line looks dangerous, which is why the compiler cannot warn you. Calling `reserve` up front, or holding an index instead of a reference, avoids it.
:::

::: context mars-climate-orbiter The spacecraft lost to a unit mix-up
In September 1999, NASA's Mars Climate Orbiter flew too deep into the Martian atmosphere and was lost. The investigation found that ground software from one team reported thruster impulse in pound-force seconds, while the navigation software that used it expected newton-seconds — a factor of about 4.45. Every small thruster firing was mis-modeled, and the trajectory error built up over months. Both numbers were plain floating-point values, so nothing could flag the mismatch. Wrapping each unit in its own type turns that kind of mistake into a compile error.
:::
