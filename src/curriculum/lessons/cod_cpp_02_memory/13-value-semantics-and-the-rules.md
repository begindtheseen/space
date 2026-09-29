---
id: l13-value-semantics-and-the-rules
title: Value semantics, reference semantics, and the rule of zero
minutes: 26
covers:
  - Value semantics vs reference semantics; the rule of zero, three and five
---

Think about a recipe card and a house. If a friend wants your pancake recipe, you photocopy the card. Now there are two cards. She can scribble "add blueberries" on hers, and yours does not change. The two cards are interchangeable: nobody cares which one is the "real" one.

Your house is different. You cannot photocopy a house. If a friend needs to get there, you give her the address. There is still only one house, and if she paints the front door, you come home to a painted door.

C++ makes you decide, for every type you write, which of those two it is. That decision is called **value semantics** — copying gives a new, independent object, like the recipe card — or **reference semantics** — the object is one particular thing, and others get a way to reach it, like the address. ("Semantics" means "what it means": what assignment *means* for this type.)

On a spacecraft the split is easy to see. A **state vector** (position and velocity), a **[[quaternion|quaternion-attitude]]** (an attitude) and a 3×3 matrix are values: two holding the same numbers are interchangeable. An **[[IMU driver|imu-driver]]**, a telemetry radio link and a thruster controller are not. Each one *is* a particular piece of hardware, and copying the object does not give you a second IMU.

In Python, `b = a` always makes `b` a second name for the same object. C++ lets you choose, type by type, and the choice decides whether a reference into the object can dangle, whether two threads can share it safely, and whether the compiler writes five functions for you or none. This lesson builds the rules of zero, three and five from what goes wrong without them.

## Two kinds of type

A type with value semantics behaves like an `int`. A type with reference semantics stands for something unique, so it forbids copying and hands out references instead. Here are both, side by side.

In the code, `State&` is read "reference to State": a second name for an existing `State` (lesson 04). `= delete` is read "equals delete": it tells the compiler that this function must not exist, so any code that tries to use it fails to compile.

::: example Copying a value, and naming a device twice
```cpp
#include <cstdio>
#include <vector>

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

int main() {
    State a{6771000.0, 7670.0};
    State b = a;                   // a copy
    b.v_mps = 0.0;
    std::printf("a.v_mps = %.1f, b.v_mps = %.1f\n", a.v_mps, b.v_mps);

    bump(a);
    std::printf("after bump(a):     a.v_mps = %.1f\n", a.v_mps);
    bump_ref(a);
    std::printf("after bump_ref(a): a.v_mps = %.1f\n", a.v_mps);

    std::vector<State> log;
    log.push_back(a);              // the vector stores a copy
    a.v_mps = -1.0;
    std::printf("log[0].v_mps = %.1f while a.v_mps = %.1f\n", log[0].v_mps, a.v_mps);

    ImuDriver imu{3};
    // ImuDriver copy = imu;       // does not compile: copy is deleted
    ImuDriver& ref = imu;          // a second name for the same device
    std::printf("imu bus %d, ref bus %d, same object: %s\n",
                imu.bus(), ref.bus(), &imu == &ref ? "yes" : "no");
}
```

Built with `g++ -std=c++20 -Wall -Wextra` and run:

```text
a.v_mps = 7670.0, b.v_mps = 0.0
after bump(a):     a.v_mps = 7670.0
after bump_ref(a): a.v_mps = 7770.0
log[0].v_mps = 7770.0 while a.v_mps = -1.0
imu bus 3, ref bus 3, same object: yes
```

Read it line by line.

1. `State b = a;` and then `b.v_mps = 0.0` left `a` at 7670 m/s, a typical low-orbit speed. The copy is independent. That is the defining property of a value.
2. `bump(a)` changed nothing in `a`. The parameter `s` was a copy, so the function added 100 to the copy.
3. `bump_ref(a)` changed `a` to 7670 + 100 = 7770. The parameter was a reference, a second name for `a` itself.
4. `log.push_back(a)` put a *copy* into the vector. Setting `a.v_mps = -1.0` afterwards left the logged entry at 7770. That is what you want from a log.
5. The `ImuDriver` is the other kind. Its copy operations are deleted, so the commented-out line would not compile. `ref` is a second name for the one device, and `&imu == &ref` says both names sit at the same address.

Why forbid the copy? Otherwise two `ImuDriver` objects would both believe they owned bus 3, and the second to be destroyed would release a bus the first had already released.
:::

::: key Value or identity
If two objects with the same contents are interchangeable, the type is a **value**: copying gives an independent object. If the object stands for something unique, it has **identity**: delete its copy operations and pass it by reference or pointer.
:::

## The six special members

Every class has six operations the compiler can write for you if you do not. They are called the **special member functions**:

1. the **default constructor** — makes an object from nothing, `T a;`
2. the **destructor** — cleans up when the object dies, written `~T()` (the `~` is read "tilde")
3. the **copy constructor** — makes a new object from an existing one, `T b = a;`
4. the **copy assignment** — overwrites an existing object with a copy, `b = a;`
5. the **move constructor** — makes a new object by taking over another's insides, `T b = std::move(a);`
6. the **move assignment** — overwrites an existing object the same way, `b = std::move(a);`

The next module lays out every generation rule. Three facts are enough here.

**The generated copy is [[memberwise|memberwise-copy]].** Each member is copied using that member's own copy operation. For an `int` or a `double`, that copies the number. For a `std::vector`, that is the vector's own **deep copy**: a new buffer with the same elements. For a **raw pointer** it copies the pointer — the address, not what lives at the address. That is a **shallow copy**, and it is where all the trouble is.

Think of a sticky note with a locker number on it. Photocopy the note and you have two notes with the same number. You do not have two lockers.

**The generated destructor destroys each member.** A raw pointer has no destructor, so when an object with a raw pointer member dies, nothing is freed.

**Declaring some members stops others being generated.** The one that matters most: **declaring a destructor stops the compiler from writing the move constructor and move assignment.** A class that gains a destructor quietly loses its moves and falls back to copying. The note on **[[which members get switched off|suppression-grid]]** has the picture.

## The rule of three, derived

Suppose a class owns a heap buffer through a raw pointer. You write the obvious destructor to free it, and nothing else. Here is what happens the first time someone copies one.

::: example One destructor, no copy constructor, one use-after-free
```cpp
#include <cstdio>

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

The compiler wrote the copy constructor for you, and it copied `data_` — the pointer. Now `a` and `b` hold the same address. `b` dies first at the closing brace and frees the buffer. `a` is left holding the address of freed memory.

Built with `g++ -std=c++20 -g -fsanitize=address,undefined -fno-sanitize-recover=all` and saved as `l13-rule-of-three.cpp`:

```text
b.front() = -9.80
=================================================================
==13436==ERROR: AddressSanitizer: heap-use-after-free on address 0x503000000040 at pc 0x5597edb0ca88 bp 0x7ffc024d9b40 sp 0x7ffc024d9b30
READ of size 8 at 0x503000000040 thread T0
    #0 0x5597edb0ca87 in SampleBuffer::front() const l13-rule-of-three.cpp:9
    #1 0x5597edb0c4fc in main l13-rule-of-three.cpp:21
    ...

0x503000000040 is located 0 bytes inside of 32-byte region [0x503000000040,0x503000000060)
freed by thread T0 here:
    #0 0x7f65738ff1f8 in operator delete[](void*) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:155
    #1 0x5597edb0c9b5 in SampleBuffer::~SampleBuffer() l13-rule-of-three.cpp:8
    #2 0x5597edb0c4dd in main l13-rule-of-three.cpp:20

previously allocated by thread T0 here:
    #0 0x7f65738fe6c8 in operator new[](unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:98
    #1 0x5597edb0c6de in SampleBuffer::SampleBuffer(int) l13-rule-of-three.cpp:5
    #2 0x5597edb0c453 in main l13-rule-of-three.cpp:16

SUMMARY: AddressSanitizer: heap-use-after-free l13-rule-of-three.cpp:9 in SampleBuffer::front() const
```

(The `...` stands for the library frames below `main`, cut as in lesson 09.)

Read the three stack traces bottom up:

1. **Allocated:** the constructor at line 5, called from `main` at line 16, made a 32-byte block. That is 4 doubles × 8 bytes = 32 bytes, which matches the "32-byte region".
2. **Freed:** the destructor at line 8 freed it when `b` went out of scope at line 20.
3. **Used:** `front()` at line 9 read it, called from `main` at line 21.

Had `a` reached the end of its scope first, the second `~SampleBuffer` would have freed the block again, and ASan would have reported `attempting double-free`. Nothing warned at compile time: this class looks finished, and it is a defect in every program that copies one.
:::

The **rule of three** is the lesson of that example: *if you had to write a destructor, a copy constructor or a copy assignment, you almost certainly need all three.*

The reason is now visible. A class needs a destructor exactly when it owns something. A class that owns something cannot be copied by copying its members, because copying the pointer does not copy what it points at. So the copy constructor must allocate a new buffer and copy the elements, and the copy assignment must do the same and also free the buffer the target already held.

## The rule of five, and the trap in it

Copying a big buffer is slow, and often you do not need a copy at all: the source object is about to die, and you only want its contents somewhere else.

Picture moving house. You do not build a copy of your furniture at the new address and then burn the old set. You carry the furniture over and hand back the old keys. That is a **[[move|move-picture]]**: the new object takes the source's pointer, and the source sets its own pointer to null. Exactly one object owns the buffer, and no element is copied.

C++11 added the **move constructor** and **move assignment** to do this. They take a parameter of type `T&&`, read "T double-ampersand" or "rvalue reference to T": a reference that binds to an object you are allowed to take from (lesson 04). You ask for a move with **[[std::move|std-move-is-a-cast]]**. So the rule of three grew into the **rule of five**: destructor, copy constructor, copy assignment, move constructor, move assignment.

The trap is the switching-off rule from the last section. It catches classes that are otherwise correct.

::: example A destructor silently costs you the move
```cpp
#include <cstdio>
#include <utility>

struct Noisy {
    Noisy() { std::printf("  ctor\n"); }
    Noisy(const Noisy&) { std::printf("  COPY\n"); }
    Noisy(Noisy&&) noexcept { std::printf("  MOVE\n"); }
};

struct WithDtor    { Noisy n; ~WithDtor() {} };            // a user-declared destructor
struct WithoutDtor { Noisy n; };                           // nothing declared
struct DefaultDtor { Noisy n; ~DefaultDtor() = default; }; // "= default" is still declared

int main() {
    std::printf("WithDtor:\n");
    { WithDtor a;    [[maybe_unused]] WithDtor b    = std::move(a); }
    std::printf("WithoutDtor:\n");
    { WithoutDtor a; [[maybe_unused]] WithoutDtor b = std::move(a); }
    std::printf("DefaultDtor:\n");
    { DefaultDtor a; [[maybe_unused]] DefaultDtor b = std::move(a); }
}
```

`Noisy` prints which of its operations runs, so it shows you what happened to the member. Output:

```text
WithDtor:
  ctor
  COPY
WithoutDtor:
  ctor
  MOVE
DefaultDtor:
  ctor
  COPY
```

All three blocks did the same thing: `T b = std::move(a);`.

- `WithoutDtor` declares nothing, so the compiler wrote a move constructor, and the member moved.
- `WithDtor` **copied**. Its empty destructor is *user-declared* — you wrote it — so the compiler did not write a move constructor. `std::move(a)` still produced an rvalue, and the copy constructor accepted it, because a `const Noisy&` parameter binds to rvalues too (lesson 04).
- `DefaultDtor` copied as well. Writing `= default` ("equals default": "compiler, write the usual body") still counts as declaring the destructor.

Nothing warns. For a class holding a large vector, every "move" now allocates and copies the whole buffer — and an empty `~WithDtor() {}` added to quiet a code-checking tool is enough to cause it.
:::

::: warning `= default` is not the same as writing nothing
`~T() = default;` is still a user-declared destructor, so it switches off the implicit moves exactly as an empty body does — the `DefaultDtor` line above is the proof. If you want all the defaults, declare none of the special members. If you must declare one, declare all five, with `= default` on the ones you did not change, so the set is explicit and complete.
:::

## The rule of zero

The way out is not to write the five functions very carefully. It is to arrange that you need none of them.

**Rule of zero: design classes so that no special member function has to be written.** Let each member manage its own resource. Then the compiler's memberwise copy, move and destroy are correct automatically, because each member already knows how to copy, move and destroy itself.

::: example The same class, owning nothing directly
```cpp
#include <cstddef>
#include <cstdio>
#include <utility>
#include <vector>

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

int main() {
    SampleBuffer a{4};
    std::printf("a: size %zu front %.2f\n", a.size(), a.front());
    {
        SampleBuffer b = a;                        // deep copy
        std::printf("b: size %zu front %.2f   a.raw()==b.raw(): %s\n",
                    b.size(), b.front(), a.raw() == b.raw() ? "yes" : "no");
    }                                              // b's buffer freed; a's untouched
    std::printf("a still valid: front %.2f\n", a.front());
    const double* before = a.raw();
    SampleBuffer c = std::move(a);                 // move: the buffer changes hands
    std::printf("c took the buffer without copying: %s\n", c.raw() == before ? "yes" : "no");
    std::printf("c: size %zu front %.2f\n", c.size(), c.front());
}
```

No destructor, no copy, no move written. Built with `-fsanitize=address,undefined`:

```text
a: size 4 front -9.80
b: size 4 front -9.80   a.raw()==b.raw(): no
a still valid: front -9.80
c took the buffer without copying: yes
c: size 4 front -9.80
```

Step by step:

1. `SampleBuffer b = a;` made a real deep copy. `a.raw() != b.raw()`, so there are two buffers.
2. Destroying `b` at the closing brace freed only `b`'s buffer. `a` still reads −9.80.
3. `SampleBuffer c = std::move(a);` made a real move. `c.raw()` is the *same address* `a` had before, so the buffer changed hands instead of being copied.

The compiler wrote both operations, and the sanitizer found nothing. The class is also shorter. The five special members are where ownership bugs live, so the best number of them to write is zero.
:::

::: key Rule of zero, three, five
**Rule of zero:** design classes so that no special member is needed, letting members manage themselves. **Rule of three:** if you must write a destructor, copy constructor or copy assignment, you probably need all three. **Rule of five:** add the move pair (move constructor and move assignment), because declaring any of the others suppresses them.
:::

## When you cannot get to zero

Two cases are left.

### The resource has no ready-made owner

A file descriptor, a mutex handle, a DMA channel: nothing in the standard library owns these for you. Then you write exactly one small class whose only job is to own that one resource. It gets all five special members, or it deletes the copy pair if copying makes no sense. Every other class holds it as a member and writes none.

That pattern has a name, **[[RAII|raii-name]]**, short for "resource acquisition is initialization". It is worth being able to say in three sentences:

::: key RAII in three sentences
Every resource is owned by an object. Acquisition happens in the constructor and release in the destructor. Because destructors run automatically at scope exit, including during exception propagation, the resource cannot leak.
:::

"Exception propagation" means an error thrown with `throw` traveling up through the functions that called it. On the way up, C++ destroys every local object whose scope it leaves, so their destructors release what they own.

RAII is what the rule of zero stands on: a `std::vector` member needs no help from you because `std::vector` is an RAII class somebody else already wrote. The next module builds your own.

### The type has identity

An `ImuDriver` should never be copied, so you delete the copy pair. Whether it may be **moved** — handed to a new owner — is a separate question.

Here is a detail people get wrong. Deleting the copy pair *declares* the copy operations, and declaring them switches off the implicit moves, as declaring a destructor does. So the `ImuDriver` above is neither copyable nor movable: `ImuDriver b = std::move(imu);` fails to compile with "use of deleted function `ImuDriver(const ImuDriver&)`". If you want it movable, declare the move pair yourself, and make sure a moved-from driver no longer believes it owns the bus. Leaving moves out is the honest statement that the object stays where it was created.

## Check yourself

::: check
`SampleBuffer` with a raw pointer needs three functions. Write the copy constructor, and say what copy assignment must do that the copy constructor does not.
:::

::: answer
```cpp
SampleBuffer(const SampleBuffer& other)
    : n_(other.n_), data_(new double[other.n_]) {
    for (int i = 0; i < n_; ++i) data_[i] = other.data_[i];
}
```

It allocates a new buffer of the same size and copies each element, so the two objects own separate storage.

Copy assignment has two extra jobs. First, the target is an existing object that already owns a buffer, so it must free that buffer or it leaks. Second, it must survive **self-assignment**: `a = a;` that frees `data_` before reading from it would read freed memory.

The standard way to get both right is **copy-and-swap**: take the parameter by value (a copy is made on the way in), swap your members with the copy's, and let the parameter's destructor free your old buffer. It is safe against self-assignment, and if the copy throws, the target is untouched:

```cpp
SampleBuffer& operator=(SampleBuffer other) {
    std::swap(n_, other.n_);
    std::swap(data_, other.data_);
    return *this;
}
```

The better answer is still to hold a `std::vector` and write none of this.
:::

::: check
A class has a `std::vector<double>`, a `std::string` and an `int`. A colleague adds `~Telemetry() { log("destroyed"); }`. What measurably changes?
:::

::: answer
The class stops being movable. The user-declared destructor switches off the implicit move constructor and move assignment. So every `std::move` of a `Telemetry`, every return of one from a function where **[[copy elision|copy-elision]]** does not apply, and every time a `std::vector<Telemetry>` grows and relocates its elements, the object is now *copied*. Each copy allocates and copies the vector's buffer and the string's buffer, instead of handing over two pointers.

Correctness is unaffected, because copying is a valid fallback, but the cost can be large and nothing warns.

Two fixes. Put the logging in a small member type whose own destructor does it, so the outer class declares nothing. Or declare all five in the outer class, with `= default` on the four you did not change. The first is the rule of zero, and it is better.
:::

::: check
Would making `ImuDriver` copyable ever be reasonable? What would have to be true?
:::

::: answer
Only if the object stopped standing for the device. Suppose `ImuDriver` were a thin handle that looked the device up by bus number on every call: no cached registers, no open file descriptor, no ownership of anything. Then copying it is as harmless as copying an `int`. Two copies talking to the same hardware is then a concurrency question, not a lifetime one.

That design is called a **handle** or a **view**, the same shape as `std::span`: cheap to copy, owns nothing, valid only while the thing it names exists.

The moment the class acquires something — a descriptor to close, a buffer to free, a lock to release — copying becomes wrong again, because the copy's destructor would release what the original still uses. The test is short: ask what the second destructor does.
:::

::: check
Why is value semantics an argument about threads as well as about lifetimes?
:::

::: answer
Because a value has no aliases — no second path to the same memory. If `State b = a;` makes an independent object, a thread holding `b` cannot see a change made through `a`, and it needs no lock to read `b`.

Every sharing bug needs two paths to the same storage. A **data race** is two threads touching the same memory at once with at least one writing. A **torn read** is reading a value halfway through someone else's write. Value semantics removes the second path by design.

That is why real-time code passes small values by copy and keeps shared, changing state in a few deliberately designed objects with explicit locking. A raw pointer or reference member is a threading question in disguise: the class copies like a value but shares like a reference, and nothing at the call site says so.
:::

::: check
Under the rule of zero, who actually frees the memory, and what does that mean when a constructor throws?
:::

::: answer
The member does. `std::vector<double> data_;` has a destructor that frees its buffer, and the compiler-written `~SampleBuffer` calls it. The release is written once, in the standard library.

When a constructor throws, this decides whether you leak. Suppose a class has two owning members and the constructor throws while building the second. The first member was fully built, so the language destroys it, and nothing leaks.

With two raw pointer members, the same failure leaks the first allocation. A raw pointer has no destructor, and the object's own destructor never runs, because the object's lifetime never began — its constructor never finished. That is lesson 01's rule about constructors that throw, seen from the design side: every resource must be owned by a member, because members are what the language cleans up for you.
:::

## Summary

| Idea | Meaning |
| --- | --- |
| value semantics | copying gives an independent object; no aliases; equal contents means interchangeable |
| reference semantics | the object has identity; copy is deleted; pass by reference or pointer |
| the six special members | default ctor, destructor, copy ctor, copy assignment, move ctor, move assignment |
| generated copy | memberwise; for a raw pointer that copies the address, not the data (shallow) |
| generated destructor | destroys members; a raw pointer has no destructor, so nothing is freed |
| rule of three | write a destructor, copy ctor or copy assignment, and you probably need all three |
| rule of five | add the move pair, because declaring any of the others suppresses the moves |
| seen in the output | a user-declared `~T() {}` or `~T() = default;` turned `std::move` into a copy |
| deleted copy | also declares the copy pair, so the moves are not generated either |
| rule of zero | need none of them: let members own their resources |
| RAII | each resource owned by an object; acquire in the constructor, release in the destructor; cannot leak |
| when you cannot reach zero | one small RAII class per raw resource; every other class holds it and writes nothing |

Lesson 14 supplies the ready-made owners the rule of zero leans on when an object must live on the heap: `unique_ptr` for one owner at no run-time cost, and `shared_ptr`, with its control block, its atomic counter, and the reasons not to reach for it in a control loop.

::: context quaternion-attitude Four numbers for an orientation
A **quaternion** is a set of four numbers that describes how a spacecraft is turned in space — its **attitude**. Flight software prefers it over three angles because it has no special orientations where the math breaks down, and combining two rotations is a quick multiplication.

For this lesson, what matters is that a quaternion is a perfect value type: four `double`s, 32 bytes, copied freely, and two quaternions with the same numbers mean the same orientation. The attitude modules later in the course use them constantly.
:::

::: context imu-driver What an IMU driver is
An **IMU**, or inertial measurement unit, is the sensor box that measures how a vehicle is accelerating and rotating. It usually holds three accelerometers and three gyroscopes, one per axis.

A **driver** is the piece of software that talks to one particular device. It knows which **bus** — the set of wires shared by several chips, such as SPI or I²C — the IMU sits on, and how to read its registers. There is one physical IMU on that bus, so there should be one driver object for it. That is what "identity" means here.
:::

::: context memberwise-copy A shallow copy, drawn
The compiler's copy of `SampleBuffer` copied both members: the count `n_` and the pointer `data_`. Copying a pointer copies the address, so both objects now point at the same heap block. Whichever object dies first frees it, and the other is left pointing at freed memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#6c7a93">stack</text>
  <text x="250" y="18" font-size="12" fill="#6c7a93">heap</text>
  <rect x="20" y="28" width="110" height="50" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="28" y="46" font-size="12" fill="#1f2a44" font-weight="700">a</text>
  <text x="28" y="66" font-size="11" fill="#1f2a44">n_ = 4   data_</text>
  <rect x="20" y="100" width="110" height="50" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="28" y="118" font-size="12" fill="#1f2a44" font-weight="700">b (copy)</text>
  <text x="28" y="138" font-size="11" fill="#1f2a44">n_ = 4   data_</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="220" y="70" width="30" height="30" fill="#8fb8f0"/>
    <rect x="250" y="70" width="30" height="30" fill="#8fb8f0"/>
    <rect x="280" y="70" width="30" height="30" fill="#8fb8f0"/>
    <rect x="310" y="70" width="30" height="30" fill="#8fb8f0"/>
  </g>
  <text x="280" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">4 doubles, 32 bytes</text>
  <path d="M118 62 C170 62 180 80 214 82" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,83 211,78 211,88" fill="#1d6fd1"/>
  <path d="M118 134 C170 134 180 96 214 90" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="220,89 210,86 213,96" fill="#b4232c"/>
  <text x="280" y="150" font-size="11" fill="#b4232c" text-anchor="middle">one block, two owners</text>
</svg>
```
:::

::: context suppression-grid What declaring a destructor switches off
When you declare a destructor yourself — even an empty one, even `= default` — this is what the compiler still writes for you. The two copies are still generated, but the standard has marked that as **deprecated** (kept for old code, may be removed) since C++11. The moves are not declared at all, so a move request falls back to the copy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="180" y="18" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">you declare ~T()</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="30" width="110" height="44" fill="#8fb8f0"/>
    <rect x="125" y="30" width="110" height="44" fill="#f2b880"/>
    <rect x="240" y="30" width="110" height="44" fill="#fff"/>
    <rect x="10" y="80" width="110" height="44" fill="#f2b880"/>
    <rect x="125" y="80" width="110" height="44" fill="#fff" stroke-dasharray="4 3"/>
    <rect x="240" y="80" width="110" height="44" fill="#fff" stroke-dasharray="4 3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="50">default ctor</text><text x="65" y="66">generated</text>
    <text x="180" y="50">copy ctor</text><text x="180" y="66">generated, deprecated</text>
    <text x="295" y="50">destructor</text><text x="295" y="66">yours</text>
    <text x="65" y="100">copy assignment</text><text x="65" y="116">generated, deprecated</text>
    <text x="180" y="100">move ctor</text><text x="180" y="116" fill="#b4232c">not declared</text>
    <text x="295" y="100">move assignment</text><text x="295" y="116" fill="#b4232c">not declared</text>
  </g>
  <text x="180" y="142" font-size="11" fill="#6c7a93" text-anchor="middle">std::move(a) then picks the copy constructor</text>
</svg>
```
:::

::: context move-picture Handing over the keys
Before the move, `a` owns the buffer. The move constructor copies one pointer into `c` and writes null into `a`. No element of the buffer is touched, so a move costs the same whether the buffer holds 4 doubles or 4 million.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">before</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">after c = std::move(a)</text>
  <line x1="180" y1="8" x2="180" y2="152" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="20" y="30" width="60" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <rect x="40" y="110" width="100" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="127" font-size="11" fill="#1f2a44" text-anchor="middle">buffer</text>
  <path d="M60 60 L80 104" stroke="#1d6fd1" stroke-width="2" fill="none"/>
  <polygon points="82,110 76,101 85,99" fill="#1d6fd1"/>
  <rect x="200" y="30" width="60" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="230" y="78" font-size="11" fill="#b4232c" text-anchor="middle">null</text>
  <rect x="280" y="30" width="60" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">c</text>
  <rect x="220" y="110" width="100" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="127" font-size="11" fill="#1f2a44" text-anchor="middle">same buffer</text>
  <path d="M305 60 L278 104" stroke="#1d6fd1" stroke-width="2" fill="none"/>
  <polygon points="275,110 274,99 283,103" fill="#1d6fd1"/>
</svg>
```
:::

::: context std-move-is-a-cast std::move does not move anything
Despite its name, `std::move(a)` does no work at run time. It is a **cast**: it tells the compiler "treat `a` as an rvalue, something I am finished with". Overload resolution then picks the move constructor if one exists.

If none exists — as in `WithDtor` — the compiler picks the copy constructor instead, because `const T&` accepts rvalues. That is why `std::move` can end in a copy without any error. The name describes what you *intend* to happen, not what the function does; some experts have argued it should have been called something like `rvalue_cast`.
:::

::: context raii-name An awkward name for a good idea
"Resource acquisition is initialization" describes only half the pattern: getting the resource while the object is being built. The half that prevents leaks is the other one — releasing it in the destructor, which runs whenever the object's scope ends.

Because of that, many C++ programmers find the name clumsy, and some prefer **scope-bound resource management** (SBRM). You will hear "RAII" far more often, including in interviews, so it is the one to know. It is the single most important idea in the next module.
:::

::: context copy-elision When no copy happens at all
**Copy elision** is the compiler building an object directly in its final place, skipping the copy or move altogether. Since C++17 it is guaranteed when you return a temporary, as in `return Telemetry{…};`.

When you return a named local, as in `Telemetry t; …; return t;`, elision is allowed but not required. If the compiler does not elide, it moves `t` out — or, if the move constructor was switched off, copies it. That is where the colleague's destructor shows up as a real cost.
:::
