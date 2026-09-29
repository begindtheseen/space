---
id: l14-smart-pointers
title: unique_ptr, shared_ptr, and why sharing is not the default
minutes: 28
covers:
  - unique_ptr, make_unique, shared_ptr and its control block, weak_ptr and cycles
---

Think about two ways to look after a borrowed bike. In the first, there is one key. Whoever holds the key is responsible for the bike, and if you want a friend to take over, you hand her the key — and now you do not have it. In the second, a whole club shares the bike. There is a sign-out sheet by the door, everyone who is using it adds a tally mark, and the last person to cross off their mark has to put the bike away.

The first costs nothing. The second works, but the sheet must be updated every time, and nobody knows in advance who will put the bike away.

C++ has a pointer for each. Lesson 13 said: let members own their resources. But sometimes a subsystem must create an object on the heap — its type is chosen at start-up, or its size is known only after a configuration file is read. What member owns that? The answer is a **[[smart pointer|smart-pointer-history]]**: an object that holds an address, and destroys whatever is at that address when it is itself destroyed.

- `std::unique_ptr` is the single key: **exclusive ownership**, at no run-time cost.
- `std::shared_ptr` is the sign-out sheet: **shared ownership**. It costs a bookkeeping block, a counter that must be updated safely across threads, and an unpredictable moment of destruction. It is the wrong default.
- `std::weak_ptr` is someone who checks whether the bike is still there without adding a tally mark. It is how you break the loop that `shared_ptr` makes possible.

This lesson measures sizes, allocations, machine instructions, the cost of a copy with one thread and with two, and a loop of pointers that leaks. By the end you can say, with numbers, why a **[[1 kHz control loop|one-khz-loop]]** does not copy `shared_ptr`s.

## `unique_ptr`: one owner, no run-time cost

A `std::unique_ptr<T>` (read "unique pointer to T") holds a `T*` and calls `delete` on it in its destructor. It cannot be copied, because a copy would mean two owners. It is **moved** to transfer ownership, exactly like handing over the one key.

You create one with `std::make_unique<T>(args…)`, which runs `new T(args…)` for you and wraps the result. The **deleter** is the piece that frees the object; by default it calls `delete`, but you can supply your own.

::: example Size, transfer, and destruction
```cpp
#include <cstdio>
#include <memory>
#include <utility>

struct Sensor {
    int id;
    explicit Sensor(int i) : id(i) { std::printf("  ctor Sensor %d\n", id); }
    ~Sensor() { std::printf("  dtor Sensor %d\n", id); }
};

struct LoggingDeleter {                     // stateless
    void operator()(Sensor* s) const { std::printf("  custom deleter\n"); delete s; }
};
struct CountingDeleter { int calls; void operator()(Sensor* s) const { delete s; } };

void takes_ownership(std::unique_ptr<Sensor> s) {
    std::printf("  inside takes_ownership, id = %d\n", s->id);
}                                        // destroyed here

int main() {
    std::printf("sizeof(Sensor*)                                 = %zu\n", sizeof(Sensor*));
    std::printf("sizeof(std::unique_ptr<Sensor>)                 = %zu\n", sizeof(std::unique_ptr<Sensor>));
    std::printf("sizeof(std::unique_ptr<Sensor, LoggingDeleter>) = %zu\n", sizeof(std::unique_ptr<Sensor, LoggingDeleter>));
    std::printf("sizeof(std::unique_ptr<Sensor, CountingDeleter>)= %zu\n", sizeof(std::unique_ptr<Sensor, CountingDeleter>));
    std::printf("sizeof(std::shared_ptr<Sensor>)                 = %zu\n", sizeof(std::shared_ptr<Sensor>));

    std::printf("scope A:\n");
    {
        auto a = std::make_unique<Sensor>(1);
        std::printf("  a.get() is %s\n", a ? "non-null" : "null");
        auto b = std::move(a);           // ownership moves; a becomes null
        std::printf("  after move: a is %s, b->id = %d\n", a ? "non-null" : "null", b->id);
        takes_ownership(std::move(b));
        std::printf("  back in scope A: b is %s\n", b ? "non-null" : "null");
    }
    std::printf("scope B:\n");
    {
        std::unique_ptr<Sensor, LoggingDeleter> c(new Sensor(2));
    }
    std::printf("done\n");
}
```

Built with `g++ -std=c++20 -Wall -Wextra -fsanitize=address,undefined` on x86-64 Linux:

```text
sizeof(Sensor*)                                 = 8
sizeof(std::unique_ptr<Sensor>)                 = 8
sizeof(std::unique_ptr<Sensor, LoggingDeleter>) = 8
sizeof(std::unique_ptr<Sensor, CountingDeleter>)= 16
sizeof(std::shared_ptr<Sensor>)                 = 16
scope A:
  ctor Sensor 1
  a.get() is non-null
  after move: a is null, b->id = 1
  inside takes_ownership, id = 1
  dtor Sensor 1
  back in scope A: b is null
scope B:
  ctor Sensor 2
  custom deleter
  dtor Sensor 2
done
```

**The sizes.** `std::unique_ptr<Sensor>` is 8 bytes, like a raw pointer. With `LoggingDeleter` it is still 8: that deleter has no data members, and the library stores an empty class for free using the **[[empty-base optimization|empty-base]]**. `CountingDeleter` has an `int`, so it needs real storage: 8 bytes of pointer, 4 of `int`, 4 of padding to keep the whole thing 8-byte aligned, 16 in all. State inside the deleter is the one thing that makes a `unique_ptr` bigger than a pointer.

**The transfer.** After `auto b = std::move(a);` the source `a` is **null**, so exactly one object owns the `Sensor` at every moment. Passing `b` by value to `takes_ownership` moved it again, and the destructor ran at the end of *that* function: the object died where its owner did.

In scope B, the closing brace called `LoggingDeleter`, which printed and then ran `delete`.
:::

The function signature now tells the reader who owns what, with no comment needed:

- `void takes_ownership(std::unique_ptr<Sensor>)` — "I take it, and you no longer have it."
- `void borrows(const Sensor&)` — "I look at it, and you keep it."
- `void may_take(std::unique_ptr<Sensor>&)` — "I might take it; you keep the handle either way."

## What `unique_ptr` costs in machine code

Size is half the story; the other half is the instructions. Here are two functions doing the same job, with a raw pointer and with a `unique_ptr`.

::: example The same function, two ways, identical instructions
```cpp
#include <memory>

struct Sensor { int id; double last; };     // trivial destructor

void use(Sensor* s);                        // defined in another translation unit

__attribute__((noinline)) void with_raw(int id) {
    Sensor* s = new Sensor{id, 0.0};
    use(s);
    delete s;
}

__attribute__((noinline)) void with_unique(int id) {
    std::unique_ptr<Sensor> s(new Sensor{id, 0.0});
    use(s.get());
}
```

`noinline` keeps both bodies in the listing, and `use` lives in another file, so the optimizer cannot see into it.

Compiled with `g++ -std=c++20 -O2 -fno-exceptions -masm=intel -S`, with the assembler's bookkeeping lines (`.cfi`, `.size` and similar) filtered out:

```text
_Z8with_rawi:
	endbr64
	push	rbp
	mov	ebp, edi
	mov	edi, 16
	push	rbx
	sub	rsp, 8
	call	_Znwm@PLT
	mov	DWORD PTR [rax], ebp
	mov	rdi, rax
	mov	rbx, rax
	mov	QWORD PTR 8[rax], 0x000000000
	call	_Z3useP6Sensor@PLT
	add	rsp, 8
	mov	rdi, rbx
	mov	esi, 16
	pop	rbx
	pop	rbp
	jmp	_ZdlPvm@PLT
_Z11with_uniquei:
	endbr64
	push	rbp
	mov	ebp, edi
	mov	edi, 16
	push	rbx
	sub	rsp, 8
	call	_Znwm@PLT
	mov	DWORD PTR [rax], ebp
	mov	rdi, rax
	mov	rbx, rax
	mov	QWORD PTR 8[rax], 0x000000000
	call	_Z3useP6Sensor@PLT
	add	rsp, 8
	mov	rdi, rbx
	mov	esi, 16
	pop	rbx
	pop	rbp
	jmp	_ZdlPvm@PLT
```

The labels are **[[mangled names|mangled-names]]**: `_Znwm` is `operator new(unsigned long)` and `_ZdlPvm` is the sized `operator delete`. Reading the body of each function:

1. Ask for 16 bytes (`mov edi, 16`, `call _Znwm`). That is `sizeof(Sensor)`: a 4-byte `int`, 4 bytes of padding, an 8-byte `double`.
2. Store `id` at offset 0 and `0.0` at offset 8.
3. Call `use`.
4. Free the 16 bytes (`mov esi, 16`, `jmp _ZdlPvm`).

The listings match instruction for instruction: at `-O2` nothing is left of `unique_ptr` but the `delete` it emits.

With exceptions on (no `-fno-exceptions`), the build adds a `with_unique.cold` section that frees the `Sensor` if `use` throws, then continues the throw with `_Unwind_Resume`. The raw version has no such path — it *leaks* in that case. So: identical when nothing goes wrong, and correct when something does.
:::

::: key What unique_ptr costs
`std::unique_ptr` costs nothing at runtime compared to a raw pointer with a stateless deleter; it is the same size and compiles to the same code plus the delete at scope exit. It buys exclusive ownership expressed in the type system. It is the default for an object one owner is responsible for, created with `std::make_unique<T>(args…)`.
:::

## `shared_ptr` and its control block

The club's sign-out sheet has to live somewhere. For `shared_ptr`, it is a small record on the heap called the **[[control block|control-block-picture]]**. It holds:

- the **strong count** — how many `shared_ptr`s currently own the object;
- the **weak count** — how many `weak_ptr`s are watching it;
- the deleter (and the allocator, if you gave one).

So a `std::shared_ptr<T>` is two pointers: one to the object, one to the control block. That is the 16 bytes you saw above. When the strong count reaches zero, the object is destroyed. When the weak count also reaches zero, the control block itself is freed.

`std::make_shared<T>(args…)` creates the object and its control block together. `use_count()` reports the strong count.

::: example Allocations, counts, and what `weak_ptr` does to them
To count allocations, the test program replaces the global `operator new` with one that adds 1 to a counter and the requested size to a byte total, then calls `malloc`. Each line below resets the counters, makes one pointer, and prints them. Built at `-O2`:

```text
sizeof(Sensor) = 16
shared_ptr<Sensor>{new Sensor}: 2 allocations, 40 bytes
std::make_shared<Sensor>():     1 allocations, 32 bytes
std::make_unique<Sensor>():     1 allocations, 16 bytes
use_count with one owner: 1
use_count with three owners: 3
after adding a weak_ptr:     3
w.expired() = 0; w.lock() while alive raises it to 4
use_count back to: 1
```

**The allocations**, one line at a time:

1. `shared_ptr<Sensor>{new Sensor}` made **two** allocations. Your `new` made the 16-byte `Sensor`. The `shared_ptr` then made a separate 24-byte control block. 16 + 24 = 40 bytes.
2. `make_shared` made **one** allocation of 32 bytes. It put the control block and the `Sensor` side by side in one block, so the control block's share is 32 − 16 = 16 bytes.
3. `make_unique` made one allocation of 16 bytes — only the `Sensor`. A `unique_ptr` has nothing to count, so it needs no control block.

So `make_shared` is faster (one trip to the allocator) and smaller. Its drawback: since object and control block share one allocation, the memory is not returned until the last `weak_ptr` is gone too, which matters only for a large object with long-lived weak references.

**The counts.** Three owners give 3. Adding a `weak_ptr` leaves it at 3: a weak reference does not keep the object alive. `w.lock()` returns a new `shared_ptr`, so while that temporary exists the count is 4. `w.expired()` asks "is the object gone?" without creating a reference.
:::

## The cost of sharing

Every copy of a `shared_ptr` adds one to the strong count, and every destruction takes one away. Two threads might copy the same `shared_ptr` at the same moment, so these updates must be **[[atomic|atomic-rmw]]**: each one reads the count, changes it and writes it back as a single step that no other thread can interrupt. That safety has a price. Here is how big.

::: example One thread, then two
```cpp laptop
#include <chrono>
#include <cstdio>
#include <memory>
#include <thread>

struct Sensor { int id; double last; };
using Clock = std::chrono::steady_clock;
constexpr long N = 20'000'000;

template <typename P>
double copy_loop(const P& src) {
    auto t0 = Clock::now();
    for (long i = 0; i < N; ++i) {
        P copy = src;                        // one copy per iteration
        asm volatile("" : : "r"(&copy) : "memory");   // keep the copy from being optimised away
    }
    auto t1 = Clock::now();
    return std::chrono::duration<double, std::nano>(t1 - t0).count() / N;
}

int main() {
    auto sp = std::make_shared<Sensor>();
    Sensor* raw = sp.get();
    double r = copy_loop(raw);
    double s = copy_loop(sp);
    std::printf("one thread:  raw pointer copy %.2f ns   shared_ptr copy %.2f ns\n", r, s);

    auto t0 = Clock::now();
    std::thread t1([&] { copy_loop(sp); });
    std::thread t2([&] { copy_loop(sp); });
    t1.join(); t2.join();
    auto t = std::chrono::duration<double, std::nano>(Clock::now() - t0).count();
    std::printf("two threads: shared_ptr copy %.2f ns per copy (2 x %ld copies)\n", t / N, N);
    std::printf("(hardware_concurrency = %u)\n", std::thread::hardware_concurrency());
}
```

The empty `asm volatile` line tells the compiler the copy is used, so it cannot delete the loop. In the two-thread case both threads copy the *same* `sp` in parallel, so total time ÷ 20 million is one copy's time inside one thread. Three runs, `g++ -std=c++20 -O2 -pthread`, on a 4-core machine:

```text
one thread:  raw pointer copy 0.37 ns   shared_ptr copy 1.84 ns
two threads: shared_ptr copy 88.64 ns per copy (2 x 20000000 copies)
(hardware_concurrency = 4)
one thread:  raw pointer copy 0.36 ns   shared_ptr copy 1.48 ns
two threads: shared_ptr copy 95.10 ns per copy (2 x 20000000 copies)
(hardware_concurrency = 4)
one thread:  raw pointer copy 0.45 ns   shared_ptr copy 1.46 ns
two threads: shared_ptr copy 85.28 ns per copy (2 x 20000000 copies)
(hardware_concurrency = 4)
```

**One thread.** A `shared_ptr` copy (an increment plus a decrement) costs about 1.5 to 1.8 ns against about 0.4 ns for a raw pointer: 3 to 5 times more, still negligible in most code.

**Two threads.** The same copy now costs about **85 to 95 ns** — roughly 50 to 65 times the one-thread figure. Nothing about the counter changed. What changed is that two cores now fight over it. Each atomic update needs the **[[cache line|cache-line-bounce]]** holding the counter to itself, so the line bounces from core to core on every copy.

Sanity check: 90 ns is about 270 clock cycles at 3 GHz — the size of a round trip between cores, not of one instruction. The surprise is that the threads share no data and take no lock; they only *look at* the same object, and yet they wait for each other.
:::

## Why `shared_ptr` is the wrong default in a 1 kHz loop

There are three separate reasons. An interview answer needs two of them.

**1. The reference count is atomic.** Every copy is a synchronized read-modify-write. As measured above, a contended one costs around 90 ns instead of under 2. The cost is invisible in the source: a function that takes `shared_ptr<T>` by value does an atomic increment on the way in and a decrement on the way out, on every call.

**2. Destruction happens at an unpredictable time, in an unpredictable thread.** Whichever thread drops the last reference runs the destructor, every destructor that triggers, and every `operator delete` they need. A telemetry thread releasing the last handle to a large tree of objects does an unbounded amount of work at a moment nobody chose — in a hard real-time task, a missed deadline with no line of code to blame.

**3. There is an extra allocation unless you use `make_shared`** — measured above as 2 allocations and 40 bytes against 1 and 32. And lesson 07 already banned allocation inside the loop.

::: key Why shared_ptr is a poor default in a 1 kHz control loop
Its reference count is atomic, so every copy is a synchronized read-modify-write; and destruction happens at an unpredictable point in whichever thread drops the last reference, which makes timing non-deterministic. It also costs a second allocation unless you use `make_shared`.
:::

The fix is to decide ownership before the loop starts. The owning subsystem holds the object by value or in a `unique_ptr` member, and everything else receives a `const T&` or `T*` for one call. Lifetime then follows the start-up order, which a reviewer can read, not a run-time reference graph, which nobody can.

::: warning Passing `shared_ptr` by value to a reader
This is the most common way the cost sneaks in. A function that only reads the object does not need ownership, so it should take `const T&`. Take `shared_ptr<T>` by value only when the function really stores a copy. Take `const shared_ptr<T>&` when it might store one. Otherwise, pass the object itself.
:::

## Cycles, and `weak_ptr`

Counting has one blind spot. Suppose A holds a `shared_ptr` to B, and B holds a `shared_ptr` back to A. That is a **cycle**: a loop of owners. Even after everyone else lets go, A keeps B's count at 1 and B keeps A's count at 1. Neither count ever reaches zero, so neither destructor ever runs.

::: example A controller and an estimator that point at each other
```cpp
#include <cstdio>
#include <memory>

struct Estimator;
struct EstimatorWeak;

struct Controller {
    std::shared_ptr<Estimator> est;                 // owns the estimator
    ~Controller() { std::printf("  ~Controller\n"); }
};

struct Estimator {
    std::shared_ptr<Controller> ctl;                // and points back: a cycle
    ~Estimator() { std::printf("  ~Estimator\n"); }
};

struct ControllerW {
    std::shared_ptr<EstimatorWeak> est;
    ~ControllerW() { std::printf("  ~ControllerW\n"); }
};

struct EstimatorWeak {
    std::weak_ptr<ControllerW> ctl;                 // observes, does not own
    ~EstimatorWeak() { std::printf("  ~EstimatorWeak\n"); }
};

void weak_pair() {
    auto c = std::make_shared<ControllerW>();
    auto e = std::make_shared<EstimatorWeak>();
    c->est = e;                                     // controller owns estimator
    e->ctl = c;                                     // estimator observes controller
    std::printf("  c.use_count() = %ld, e.use_count() = %ld\n", c.use_count(), e.use_count());
}                                                   // c and e dropped here

void cyclic_pair() {
    auto c = std::make_shared<Controller>();
    auto e = std::make_shared<Estimator>();
    c->est = e;
    e->ctl = c;
    std::printf("  c.use_count() = %ld, e.use_count() = %ld\n", c.use_count(), e.use_count());
}                                                   // c and e dropped here

int main() {
    std::printf("with weak_ptr breaking the cycle:\n");
    weak_pair();
    std::printf("with two shared_ptrs:\n");
    cyclic_pair();
    std::printf("end of main\n");
}
```

Saved as `l14-cycle.cpp` and built with `g++ -std=c++20 -g -fsanitize=address,undefined -fno-sanitize-recover=all`:

```text
with weak_ptr breaking the cycle:
  c.use_count() = 1, e.use_count() = 2
  ~ControllerW
  ~EstimatorWeak
with two shared_ptrs:
  c.use_count() = 2, e.use_count() = 2
end of main

=================================================================
==13237==ERROR: LeakSanitizer: detected memory leaks

Indirect leak of 32 byte(s) in 1 object(s) allocated from:
    #0 0x7fcda68fe548 in operator new(unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:95
    ...
    #9 0x5637bf22f872 in cyclic_pair() l14-cycle.cpp:37
    ...

Indirect leak of 32 byte(s) in 1 object(s) allocated from:
    #0 0x7fcda68fe548 in operator new(unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:95
    ...
    #9 0x5637bf22f844 in cyclic_pair() l14-cycle.cpp:36
    ...

SUMMARY: AddressSanitizer: 64 byte(s) leaked in 2 allocation(s).
```

(Frames `#1` to `#8` are the `make_shared` machinery inside the standard library, and the frames after `#9` lead up through `main`; the `...` lines cut them. Frame `#9` is the one that names your code.)

**The weak pair.** The counts are 1 and 2. The controller's only owner is the local `c`, because the back-reference is weak; the estimator has two, `e` and the controller's `est`. At the closing brace the controller reaches 0 and `~ControllerW` runs, which releases `est`, so the estimator reaches 0 too.

**The cyclic pair.** The counts are 2 and 2, and **neither destructor printed**. When the locals died, each count fell to 1 and stopped there. LeakSanitizer reported two 32-byte blocks — the same size `make_shared` gave in the last example — allocated at lines 36 and 37, 64 bytes in all. It calls them **indirect** leaks because each block is still pointed at, but only by the other leaked block. That is exactly what a cycle is.

(The cycle is built inside its own function for a reason; the note on **[[how LeakSanitizer searches|lsan-conservative]]** explains it.)
:::

The rule that prevents this is short: **the owning direction uses `shared_ptr`, the back-reference uses `weak_ptr`.** Parent owns child; child observes parent.

To use a `weak_ptr`, write:

```cpp
if (auto p = w.lock()) {
    use(*p);
}
```

`w.lock()` returns a `shared_ptr` that is non-null only if the object is still alive, and that keeps it alive until the end of the block. Checking and grabbing happen in one step, which avoids a **[[race|check-then-act]]**.

## Choosing

| Situation | Use |
| --- | --- |
| an object with one clear owner | `std::unique_ptr<T>`, made with `make_unique` |
| a function that reads an object it does not own | `const T&` |
| a function that may be given nothing | `const T*` or `std::optional` |
| an object whose owner truly cannot be decided | `std::shared_ptr<T>`, made with `make_shared` |
| a back-reference from an owned object to its owner | `std::weak_ptr<T>` |
| a fixed-size collection created at start-up | no pointer at all: a member by value, or `std::array` |

Flight software uses the last row most: if an object lives as long as its subsystem, make it a member.

## Check yourself

::: check
`sizeof(std::unique_ptr<Sensor>)` is 8 and `sizeof(std::shared_ptr<Sensor>)` is 16. Where do the second 8 bytes go, and how much memory does a `shared_ptr` really cost?
:::

::: answer
The second 8 bytes are the address of the control block, which holds the strong count, the weak count, the deleter and the allocator.

The true cost includes the control block: `make_shared<Sensor>` allocated 32 bytes for a 16-byte `Sensor` (16 of control block), and `shared_ptr<Sensor>{new Sensor}` allocated 40 in two blocks (16 object, 24 control block). A `unique_ptr` costs 8 bytes in the owner and 16 on the heap, so sharing a small object roughly doubles its memory. For a large object that is negligible, and the argument becomes entirely about time and predictability.
:::

::: check
A colleague says the two-thread measurement is unfair, because real code never copies a `shared_ptr` twenty million times. Agree or disagree, and say what the measurement is really evidence for.
:::

::: answer
Agree with the framing, and keep the number. The benchmark isolates the cost of *one* copy; twenty million repeats is how you get a steady figure for something that takes a nanosecond. What it shows is the *shape*: under 2 ns when one thread owns the counter, about 90 ns when two touch it. The cost depends on the sharing pattern, and it appears with no lock and no shared data visible in the source.

For real code that gives a rule, not a budget: keep `shared_ptr` copies off paths that several threads run at the same time, and never take `shared_ptr` by value in a function that only reads. A 1 kHz loop making twenty contended copies per cycle spends 20 × 90 ns = 1.8 µs, about 0.2% of its 1 ms cycle, on counting — for nothing.
:::

::: check
Why does `make_unique` exist, when `std::unique_ptr<T> p(new T(args))` is one line and works?
:::

::: answer
Three reasons, from least to most important.

1. It is shorter and names the type once instead of twice.
2. It keeps `new` out of application code, so a reviewer who searches for `new` finds only the places that really need raw allocation.
3. It removes a leak the explicit form used to allow. In `f(std::unique_ptr<A>(new A), g())`, compilers before C++17 were allowed to run `new A`, then call `g()`, then build the `unique_ptr`. If `g()` threw in the middle, the `A` was never owned by anything and leaked.

C++17 made each function argument fully evaluated before the next starts, closing that hole, but `make_unique` never had it and does not depend on the reader knowing the standard version. `make_shared` has the same advantage and also fuses two allocations into one.
:::

::: check
A logging subsystem needs to look at a `Telemetry` object owned by the flight-data recorder, which may be shut down while logging is in progress. Which pointer type should the logger hold, and what does its code look like?
:::

::: answer
If the recorder owns the object through a `shared_ptr`, the logger holds a `std::weak_ptr<Telemetry>` and uses it like this:

```cpp
if (auto p = w.lock()) {
    use(*p);
}
```

`lock()` returns an empty `shared_ptr` if the object is gone, so checking and grabbing are one operation. Testing `w.expired()` and then calling `lock()` would be a race. While `p` is in scope it is a strong reference, so the object survives even if the recorder shuts down mid-call.

That is `weak_ptr`'s real job: safely watching an object whose lifetime you do not control. If the recorder instead owns the object by value or through a `unique_ptr`, there is no `weak_ptr` to be had. Then the problem is solved by ordering: the logger stops before the recorder shuts down. That is the usual flight-software answer.
:::

::: check
LeakSanitizer called the cycle's blocks "indirect" leaks. What would a "direct" leak look like, and why is the difference useful?
:::

::: answer
A **direct** leak is a block that nothing at all points to when the program ends — the classic `new` with no matching `delete`, as in lesson 09, where the report said "Direct leak of 384 byte(s) in 3 object(s)".

An **indirect** leak is a block that *is* still pointed to, but only from another block that is itself leaked. That is the cycle exactly: each object holds a `shared_ptr` to the other, so each is reachable from the other, and neither is reachable from any live variable.

The difference tells you where to look. Indirect leaks usually hang off one direct leak; fix that and they all go. Indirect leaks with no direct leak at all are the signature of a cycle, pointing at the ownership graph rather than a missing `delete`.
:::

## Summary

| Item | Detail |
| --- | --- |
| `std::unique_ptr<T>` | exclusive ownership; 8 bytes here, same as a raw pointer; move-only |
| stateless custom deleter | still 8 bytes (empty-base optimization); a deleter with an `int` made it 16 |
| generated code | identical to raw `new`/`delete` at `-O2 -fno-exceptions`, plus an unwind path when exceptions are on |
| `std::make_unique<T>(args…)` | one allocation, no `new` in your code, no leak if another argument throws |
| `std::shared_ptr<T>` | 16 bytes: object pointer plus control-block pointer |
| control block | strong count, weak count, deleter; a separate allocation unless you use `make_shared` |
| copy cost | about 1.5 ns with one thread; about 90 ns with two threads on the same counter |
| why not in a 1 kHz loop | atomic count; unpredictable destruction point and thread; extra allocation |
| `std::weak_ptr<T>` | watches without owning; `expired()`, and `lock()` to get a strong reference safely |
| cycles | two `shared_ptr`s pointing at each other never reach zero; LeakSanitizer calls them indirect leaks |
| the rule | owner holds `shared_ptr`, back-reference holds `weak_ptr` |

That closes the module: you can say where every object lives, how long, who owns it, and how to produce evidence when that goes wrong. The next module takes ownership into the class itself: constructors, destructors, the copy and move pairs, and the generation rules that lesson 13 only sketched.

::: context smart-pointer-history The smart pointer that came before
C++98 had a first attempt, `std::auto_ptr`. It tried to express single ownership before the language had move semantics, so *copying* an `auto_ptr` secretly transferred ownership and left the source null. Code that looked like an ordinary copy quietly emptied a variable, and `auto_ptr` could not be stored safely in standard containers.

C++11 added rvalue references, which made a clean "move" possible, and with them `unique_ptr`, `shared_ptr` and `weak_ptr`. `auto_ptr` was deprecated in C++11 and removed in C++17. If you meet it in old code, `unique_ptr` is its replacement.
:::

::: context one-khz-loop What "1 kHz" means for a control loop
A **control loop** reads sensors, computes a command and sends it to actuators, over and over. **1 kHz** (one kilohertz) means it runs 1000 times per second, so each pass has a budget of 1 ms = 1,000,000 ns.

That sounds generous next to a 90 ns pointer copy. The problem is not the average; it is the worst case. A "hard" real-time loop must finish *every* pass on time, for years, and one pass that runs long can mean a thruster fires late.
:::

::: context empty-base Why an empty deleter costs zero bytes
Every C++ object must take at least one byte, so a plain member of an empty class would add a byte — and then 7 bytes of padding. But an empty class used as a **base class** may take no room at all. That is the **empty-base optimization**, and the library's `unique_ptr` stores its deleter in a way that uses it. (C++20 also offers `[[no_unique_address]]` for the same effect on a member.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="11" fill="#1f2a44">LoggingDeleter</text>
  <rect x="110" y="16" width="160" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="31" font-size="11" fill="#1f2a44" text-anchor="middle">Sensor* (8 bytes)</text>
  <text x="280" y="31" font-size="11" fill="#1f2a44">= 8</text>
  <text x="10" y="80" font-size="11" fill="#1f2a44">CountingDeleter</text>
  <rect x="110" y="66" width="160" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="81" font-size="11" fill="#1f2a44" text-anchor="middle">Sensor* (8 bytes)</text>
  <rect x="110" y="88" width="80" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="103" font-size="11" fill="#1f2a44" text-anchor="middle">int calls (4)</text>
  <rect x="190" y="88" width="80" height="22" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="230" y="103" font-size="11" fill="#6c7a93" text-anchor="middle">padding (4)</text>
  <text x="280" y="92" font-size="11" fill="#1f2a44">= 16</text>
</svg>
```
:::

::: context mangled-names Reading the strange labels
The linker needs a unique name for every function, but C++ lets many functions share a name if their parameters differ. So the compiler **mangles** each name, encoding the parameter types into it. `_Z8with_rawi` is "a name of 8 letters, `with_raw`, taking an `int`". `_Znwm` is `operator new` taking an `unsigned long`, and `_ZdlPvm` is `operator delete` taking a `void*` and an `unsigned long` (the size).

The tool `c++filt` turns them back: `echo _ZdlPvm | c++filt` prints `operator delete(void*, unsigned long)`.
:::

::: context control-block-picture Two allocations, or one
With `shared_ptr<Sensor>{new Sensor}`, the object and its control block are two separate heap blocks. With `make_shared`, they sit side by side in one. The byte counts are the ones measured in the lesson.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44" font-weight="700">shared_ptr{new Sensor}: 2 blocks, 40 bytes</text>
  <rect x="10" y="28" width="90" height="26" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">obj | ctrl</text>
  <rect x="150" y="28" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">Sensor 16</text>
  <rect x="250" y="28" width="100" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">control 24</text>
  <path d="M40 54 C60 76 150 76 176 58" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M80 54 C110 90 260 90 290 58" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="10" y="112" font-size="12" fill="#1f2a44" font-weight="700">make_shared: 1 block, 32 bytes</text>
  <rect x="10" y="122" width="90" height="26" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="139" font-size="11" fill="#1f2a44" text-anchor="middle">obj | ctrl</text>
  <rect x="150" y="122" width="100" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="139" font-size="11" fill="#1f2a44" text-anchor="middle">control 16</text>
  <rect x="250" y="122" width="100" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="139" font-size="11" fill="#1f2a44" text-anchor="middle">Sensor 16</text>
  <text x="180" y="165" font-size="11" fill="#6c7a93" text-anchor="middle">both pointers aim into the same block</text>
</svg>
```
:::

::: context atomic-rmw Why the counter must be atomic
Adding one to a number looks like one step, but the processor does three: read the value, add one, write it back. If two threads both read 5, both add one and both write 6, one increment is lost. Lose a few and the count reaches zero while someone still uses the object — a use-after-free.

An **atomic** read-modify-write, such as `lock xadd` on x86, makes the three steps one step that no other core can split. `std::shared_ptr` must use it because the library cannot know whether your program has threads.
:::

::: context cache-line-bounce A counter that two cores fight over
Each core keeps copies of memory in its own cache, in 64-byte chunks called **cache lines**. To write a line, a core must own it exclusively, so every other copy is thrown away. When two cores take turns updating the same counter, the line travels back and forth on every update.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="110" height="70" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="40" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">core 0</text>
  <rect x="35" y="52" width="80" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="69" font-size="11" fill="#1f2a44" text-anchor="middle">count line</text>
  <rect x="230" y="20" width="110" height="70" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="40" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">core 1</text>
  <rect x="245" y="52" width="80" height="26" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="285" y="69" font-size="11" fill="#6c7a93" text-anchor="middle">invalid</text>
  <path d="M130 45 H224" stroke="#b4232c" stroke-width="2"/>
  <polygon points="230,45 221,40 221,50" fill="#b4232c"/>
  <path d="M230 70 H136" stroke="#b4232c" stroke-width="2"/>
  <polygon points="130,70 139,65 139,75" fill="#b4232c"/>
  <text x="180" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">every increment moves the 64-byte line</text>
  <text x="180" y="128" font-size="11" fill="#6c7a93" text-anchor="middle">about 90 ns per copy here, against under 2 ns</text>
</svg>
```
:::

::: context lsan-conservative How LeakSanitizer decides what is lost
At exit, LeakSanitizer scans the stacks, registers and global variables for anything that *looks like* a pointer into a heap block. That scan is **conservative**: any 8 bytes that happen to hold a block's address count as a reference, even if they are a stale value left behind in a dead stack slot.

A first version of this demo built the cycle in a block inside `main`, and no leak was reported — old copies of the addresses were still sitting in `main`'s stack frame. Building the cycle in its own function lets that frame be overwritten, and the report appears. A missing report is not proof of no leak.
:::

::: context check-then-act Why check-then-lock is a race
`if (!w.expired()) { auto p = w.lock(); … }` looks safe, but it asks the question and acts on the answer in two separate steps. Another thread can drop the last owner in the gap, so `p` comes back empty and the code trusts it anyway. This pattern is called **check-then-act**, and it is a classic concurrency bug.

`if (auto p = w.lock())` does both in one atomic step: either you get a strong reference that keeps the object alive, or you get nothing.
:::
