---
id: l13-value-semantics-and-the-rules
title: Value semantics, reference semantics, and the rule of zero
minutes: 21
covers:
  - Value semantics vs reference semantics; the rule of zero, three and five
---

Python has one answer to "what happens when I assign": the name is bound to the same object, and nothing is copied. C++ makes you choose, type by type, and the choice is the most consequential design decision in the language. It decides whether `b = a` gives you an independent object or a second handle on the same one; whether a function can be called concurrently; whether a reference into the object can dangle; and whether the compiler will write five functions for you or none.

The vocabulary is **value semantics** and **reference semantics**. A state vector, a quaternion and a 3×3 matrix are values: two of them with the same numbers are interchangeable, copying one is cheap and produces something independent, and nothing outside can observe which copy you have. An IMU driver, a telemetry link and a thruster controller are not values: each one *is* a particular device or resource, copying one is meaningless, and the identity is the whole point.

Getting this right is what makes a class either trivially safe or a source of double frees. The rules of zero, three and five are the practical encoding of that, and this lesson derives them rather than reciting them. The next module, on RAII in depth, then goes through each special member function properly; here the aim is the design decision and the one rule you should follow by default.

## Two kinds of type

::: example Copying a value, aliasing a device
```cpp
struct State {                     // a value: copying makes an independent object
    double r_m;
    double v_mps;
};

class ImuDriver {                  // an identity: copying makes no sense
public:
    explicit ImuDriver(int bus) : bus_(bus) {}
    ImuDriver(const ImuDriver&)            = delete;
    ImuDriver& operator=(const ImuDriver&) = delete;
    int bus() const { return bus_; }
private:
    int bus_;
};

void bump(State s)        { s.v_mps += 100.0; }      // by value: caller unaffected
void bump_ref(State& s)   { s.v_mps += 100.0; }      // by reference: caller changed
```

```text
a.v_mps = 7670.0, b.v_mps = 0.0
after bump(a):     a.v_mps = 7670.0
after bump_ref(a): a.v_mps = 7770.0
log[0].v_mps = 7770.0 while a.v_mps = -1.0
imu bus 3, ref bus 3, same object: yes
```

Line by line. `State b = a;` then `b.v_mps = 0.0` left `a` at 7670: the copy is independent, which is the defining property of a value. `bump(a)` changed nothing, because the parameter was a copy; `bump_ref(a)` changed `a` to 7770, because the parameter was an alias. `log.push_back(a)` put a *copy* in the vector, so setting `a.v_mps = -1.0` afterwards left the logged entry at 7770 — which is exactly what you want from a log and exactly what a Python list would not have given you.

The `ImuDriver` is the other kind. Its copy operations are `= delete`d, so `ImuDriver copy = imu;` does not compile. There is one device on bus 3, and `ref` is a second name for it: `&imu == &ref`. If copying were allowed, two `ImuDriver` objects would both believe they own bus 3, and the second destructor to run would release a bus the first had already released.

That is the decision in one sentence: **if two objects with the same contents are interchangeable, it is a value; if the object stands for something unique, delete the copy and hand out references or a pointer.**
:::

## The six special members

Whether you write them or not, a class has six operations the compiler can supply: default constructor, destructor, copy constructor, copy assignment, move constructor, move assignment. The generation rules are intricate — the next module lays out all of them — but three facts drive everything here.

The generated copy is **memberwise**: each member is copied using *its* copy operation. For an `int` or a `double` that is a byte copy. For a `std::vector` it is the vector's deep copy. For a **raw pointer** it copies the pointer — the address, not what is at the address. That last case is where all the trouble is.

The generated destructor destroys each member. A raw pointer member has no destructor, so nothing is freed.

And declaring some of these suppresses others. In particular, **declaring a destructor suppresses the implicit move constructor and move assignment**, so a class that gains a destructor silently loses its moves and falls back to copying.

## The rule of three, derived

Suppose a class owns a heap buffer through a raw pointer and you write the obvious destructor.

::: example One destructor, no copy constructor, one use-after-free
```cpp
class SampleBuffer {
public:
    explicit SampleBuffer(int n) : n_(n), data_(new double[n]) {
        for (int i = 0; i < n; ++i) data_[i] = -9.80 - 0.01 * i;
    }
    ~SampleBuffer() { delete[] data_; }
    double front() const { return data_[0]; }
private:
    int     n_;
    double* data_;
};

int main() {
    SampleBuffer a{4};
    {
        SampleBuffer b = a;              // implicit copy: same pointer in both
        std::printf("b.front() = %.2f\n", b.front());
    }                                    // ~b runs delete[] on the shared buffer
    std::printf("a.front() = %.2f\n", a.front());   // use after free
}
```

The compiler generated the copy constructor, and it copied `data_` — the pointer. Now `a` and `b` hold the same address, `b` dies first and frees it, and `a` is left owning a freed block. Built with `-fsanitize=address -fno-sanitize-recover=all`:

```text
b.front() = -9.80
=================================================================
==22338==ERROR: AddressSanitizer: heap-use-after-free on address 0x503000000040 at pc 0x556c5477d62a bp 0x7ffc8b44ffa0 sp 0x7ffc8b44ff90
READ of size 8 at 0x503000000040 thread T0
    #0 0x556c5477d629 in SampleBuffer::front() const l13-rule-of-three.cpp:12
    #1 0x556c5477d629 in main l13-rule-of-three.cpp:26
    ...

0x503000000040 is located 0 bytes inside of 32-byte region [0x503000000040,0x503000000060)
freed by thread T0 here:
    #0 0x7f7614cff1f8 in operator delete[](void*) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:155
    #1 0x556c5477d5c5 in SampleBuffer::~SampleBuffer() l13-rule-of-three.cpp:11
    #2 0x556c5477d5c5 in main l13-rule-of-three.cpp:25

previously allocated by thread T0 here:
    #0 0x7f7614cfe6c8 in operator new[](unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:98
    #1 0x556c5477d431 in SampleBuffer::SampleBuffer(int) l13-rule-of-three.cpp:8
    #2 0x556c5477d431 in main l13-rule-of-three.cpp:21

SUMMARY: AddressSanitizer: heap-use-after-free l13-rule-of-three.cpp:12 in SampleBuffer::front() const
```

(The `...` is the library tail below `main`, cut as in lesson 09.)

Three lines again, and they read as a story: the constructor at line 8 allocated, the destructor at line 11 freed it when `b` went out of scope at line 25, and `front()` at line 12 read it at line 26. Had `a` also gone out of scope, the second `~SampleBuffer` would have produced `attempting double-free` instead.

Nothing warned. This is a class that looks finished and is a defect in every program that copies one.
:::

The **rule of three** is the generalisation: *if you had to write a destructor, a copy constructor or a copy assignment operator, you almost certainly need all three.* The reason is now visible rather than folkloric — a class needs a destructor precisely when it owns something, and a class that owns something cannot be copied by copying its members.

## The rule of five, and the trap in it

C++11 added the move pair, and moving is how you transfer ownership cheaply: the source hands over its pointer and sets its own to null, so exactly one object owns the resource and no buffer is copied. So the rule of three became the **rule of five**: destructor, copy constructor, copy assignment, move constructor, move assignment.

The trap is the suppression rule, and it bites classes that are otherwise correct.

::: example A destructor silently costs you the move
```cpp
struct Noisy {
    Noisy() { std::printf("  ctor\n"); }
    Noisy(const Noisy&) { std::printf("  COPY\n"); }
    Noisy(Noisy&&) noexcept { std::printf("  MOVE\n"); }
};

struct WithDtor    { Noisy n; ~WithDtor() {} };   // a user-declared destructor
struct WithoutDtor { Noisy n; };                  // nothing declared
```

```text
WithDtor:
  ctor
  COPY
WithoutDtor:
  ctor
  MOVE
```

Both lines did `T b = std::move(a);`. `WithoutDtor` moved. `WithDtor` **copied** — its move constructor was never generated, because the user-declared destructor suppressed it, so `std::move(a)` produced an rvalue that the copy constructor happily bound to, `const Noisy&` accepting rvalues as lesson 04 showed.

Nothing warns, and for a class holding a large vector the consequence is an allocation and a full copy at every point you believed you were moving. An empty `~WithDtor() {}` added to silence a linter is enough to cause it.
:::

## The rule of zero

The way out is not to write the five carefully. It is to arrange that you need none of them.

**Rule of zero: design classes so that no special member function has to be written.** Let each member manage its own resource, and the compiler's memberwise copy, move and destroy are all correct by construction.

::: example The same class, owning nothing directly
```cpp
class SampleBuffer {
public:
    explicit SampleBuffer(int n) : data_(static_cast<std::size_t>(n)) {
        for (int i = 0; i < n; ++i) data_[static_cast<std::size_t>(i)] = -9.80 - 0.01 * i;
    }
    double front() const { return data_.front(); }
    std::size_t size() const { return data_.size(); }
    const double* raw() const { return data_.data(); }
private:
    std::vector<double> data_;
};
```

No destructor, no copy, no move, and under `-fsanitize=address`:

```text
a: size 4 front -9.80
b: size 4 front -9.80   a.raw()==b.raw(): no
a still valid: front -9.80
c took the buffer without copying: yes
c: size 4 front -9.80
```

`SampleBuffer b = a;` produced a genuine deep copy: `a.raw() != b.raw()`, two buffers, and destroying `b` left `a` untouched. `SampleBuffer c = std::move(a);` produced a genuine move: `c.raw()` is the *same address* `a` had before, so the buffer was transferred rather than copied. Both were generated by the compiler, both are correct, and the sanitizer found nothing.

The class is also shorter, and every line of it is about sample buffers rather than about memory management. That is the real argument: the five special members are where ownership bugs live, so the best number of them to write is zero.
:::

## When you cannot get to zero

Two cases remain.

**The resource has no ready-made owner.** A file descriptor, a mutex handle, a DMA channel. Then you write exactly one small class whose only job is to own that one resource — with all five members, or with the copy pair deleted if copying is meaningless — and every other class holds it as a member and writes none.

That pattern has a name, and it is worth being able to state in three sentences. **Every resource is owned by an object. Acquisition happens in the constructor and release in the destructor. Because destructors run automatically at scope exit, including during exception propagation, the resource cannot leak.** That is RAII — resource acquisition is initialisation — and it is what the rule of zero is standing on: the reason a `std::vector` member needs no help from you is that `std::vector` is an RAII class someone else already wrote. The next module builds several of them.

**The type has identity.** An `ImuDriver` is not copyable in any sense, so you write `= delete` for the copy pair. Whether to allow moving is a separate question: moving a driver is meaningful if the object can be handed to another owner, and meaningless if a fixed subsystem holds it for the program's life. Deleting copy does not delete move, and leaving both out is the honest statement that the object stays where it was created.

::: key
Rule of zero: design so that no special member function is needed, letting members manage themselves. Rule of three: if you must write a destructor, copy constructor or copy assignment, you almost certainly need all three. Rule of five: add the move constructor and move assignment, because declaring any of the others suppresses them. A value type copies independently; a type with identity deletes its copy operations and is passed by reference or pointer.
:::

::: warning
`= default` is not the same as writing nothing. `~T() = default;` is still a *user-declared* destructor, so it suppresses the implicit moves exactly as an empty body does. If you want the defaults, the way to get all of them is to declare none — or, if you must declare one, to `= default` all five so the set is explicit and complete.
:::

## Check yourself

::: check
`SampleBuffer` with a raw pointer needs three functions. Write the copy constructor and say what copy assignment must do that the copy constructor does not.
:::

::: answer
`SampleBuffer(const SampleBuffer& other) : n_(other.n_), data_(new double[other.n_]) { for (int i = 0; i < n_; ++i) data_[i] = other.data_[i]; }` — allocate a new buffer of the same size and copy the elements, so the two objects own separate storage. Copy assignment has two extra obligations. It must release what the target already owns, since the target is an existing object with a buffer of its own, and it must be safe against self-assignment: `a = a;` that frees `data_` before reading from it reads freed memory. The standard way to get both right without thinking about them is copy-and-swap — construct a copy from the parameter taken by value, then `std::swap` the members with it, and let the parameter's destructor release the old buffer — which is self-assignment-safe and exception-safe for free. The better answer, of course, is to hold a `std::vector` and write none of this.
:::

::: check
A class has a `std::vector<double>`, a `std::string` and an `int`. A colleague adds `~Telemetry() { log("destroyed"); }`. What measurably changes?
:::

::: answer
The class stops being movable. The user-declared destructor suppresses the implicit move constructor and move assignment, so every `std::move` of one, every return of one from a function where elision does not apply, and every reallocation of a `std::vector<Telemetry>` now *copies* — allocating and copying the vector's buffer and the string's buffer each time instead of transferring two pointers. Correctness is unaffected, since copying is a valid fallback, but the cost can be large and nothing warns. Two fixes: put the logging in a small member type whose destructor does it, so the outer class declares nothing, or declare all five explicitly with `= default` on the four you did not want to change. The first is the rule of zero and is preferable.
:::

::: check
Would making `ImuDriver` copyable ever be reasonable? What would have to be true?
:::

::: answer
Only if the object stopped standing for the device. If `ImuDriver` were a thin, stateless handle that looks the device up by bus number on every call — no cached registers, no open file descriptor, no ownership of anything — then copying it is as meaningful as copying an `int`, and two copies calling the same hardware is a concurrency question rather than a lifetime one. That is a real design (sometimes called a handle or a view), and it is the same shape as `std::span`: cheap to copy, owning nothing, valid only while the thing it names is. The moment the class acquires something — a descriptor to close, a buffer to free, a lock to release — copying becomes wrong again, because the copy's destructor would release what the original still uses. The test is simple: ask what the second destructor does.
:::

::: check
Why is "value semantics" a concurrency argument as well as a lifetime argument?
:::

::: answer
Because a value has no aliases. If `State b = a;` produces an independent object, then a thread holding `b` cannot observe a change made through `a`, and no lock is needed to read `b`. Every sharing bug — a data race, a torn read, a stale cached value — requires two paths to the same storage, and value semantics removes the second path by construction. That is why the standard advice for a real-time system is to pass small values by copy and keep mutable shared state to a small, deliberately designed set of objects with explicit synchronisation. It is also why a class with a reference member or a raw pointer member is a concurrency question in disguise: it looks like a value, copies like a value, and shares like a reference, which is the worst combination because nothing at the call site says so.
:::

::: check
Under the rule of zero, who actually frees the memory, and what does that mean for exception safety?
:::

::: answer
The member does. `std::vector<double> data_;` has a destructor that frees its buffer, and the compiler-generated `~SampleBuffer` calls it — so the release is written once, in the standard library, and is correct in every class that holds a vector. For exception safety this is decisive. If a constructor with two owning members throws while initialising the second, the language destroys the first member — it was fully constructed — and then releases the object's storage, so nothing leaks. With raw pointer members the same failure leaks the first allocation, because a raw pointer has no destructor and the object's own destructor never runs, the lifetime having never begun. That is lesson 01's rule about constructors that throw, seen from the design side: every resource must be owned by a member, because members are what the language cleans up for you.
:::

## Summary

| Idea | Detail |
| --- | --- |
| value semantics | copying yields an independent object; no aliasing; equality is about contents |
| reference semantics | the object has identity; copy is deleted; pass by reference or pointer |
| the six special members | default ctor, dtor, copy ctor, copy assign, move ctor, move assign |
| generated copy | memberwise — for a raw pointer that copies the address, not the data |
| generated destructor | destroys members; a raw pointer member has no destructor, so nothing is freed |
| rule of three | write a destructor, copy ctor or copy assign, and you need all three |
| rule of five | plus the move pair, because declaring any of the others suppresses moves |
| observed | a user-declared `~T() {}` turned `std::move` into a copy |
| `= default` | still user-declared; suppresses the implicit moves just as a body does |
| rule of zero | need none of them: let members own their resources |
| observed | the `std::vector` version deep-copied, moved without copying, and passed ASan |
| RAII | every resource owned by an object; acquire in the constructor, release in the destructor; scope exit, including by exception, cannot leak it |
| when you cannot | one small RAII class per raw resource; every other class holds it and writes nothing |

Lesson 14 supplies the owners the rule of zero depends on: `unique_ptr` for exclusive ownership at no runtime cost, and `shared_ptr` with its control block, its atomic counter and the two reasons not to reach for it in a control loop.
