---
id: l14-smart-pointers
title: unique_ptr, shared_ptr, and why sharing is not the default
minutes: 25
covers:
  - unique_ptr, make_unique, shared_ptr and its control block, weak_ptr and cycles
---

Lesson 13 said: design so that no special member function is needed, and let members own their resources. That leaves a question. If a subsystem must create an object on the heap — because its type is chosen at start-up, or its size is not known until a configuration file is read — what member owns it?

The answer is a smart pointer: an object that holds an address and destroys what is at that address when it is itself destroyed. `std::unique_ptr` expresses exclusive ownership and costs nothing at run time. `std::shared_ptr` expresses shared ownership, costs a control block, an atomic counter and an unpredictable moment of destruction, and is the wrong default. `std::weak_ptr` observes without owning and is how you break the cycle that `shared_ptr` makes possible.

This lesson measures all of that: the sizes, the number of allocations, the generated instructions, the cost of a copy with one thread and with two, and a cycle that leaks with the leak report to prove it. By the end you should be able to say, with numbers, why a 1 kHz control loop does not copy `shared_ptr`s.

## `unique_ptr`: exclusive ownership, no runtime cost

A `std::unique_ptr<T>` holds a `T*` and calls `delete` on it in its destructor. It cannot be copied — copying would mean two owners — and it is moved to transfer ownership.

::: example Size, transfer, and destruction
```cpp
struct Sensor {
    int id;
    explicit Sensor(int i) : id(i) { std::printf("  ctor Sensor %d\n", id); }
    ~Sensor() { std::printf("  dtor Sensor %d\n", id); }
};

struct FileDeleter {                     // stateless
    void operator()(Sensor* s) const { std::printf("  custom deleter\n"); delete s; }
};
struct CountingDeleter { int calls; void operator()(Sensor* s) const { delete s; } };

void takes_ownership(std::unique_ptr<Sensor> s) {
    std::printf("  inside takes_ownership, id = %d\n", s->id);
}                                        // destroyed here
```

```text
sizeof(Sensor*)                                 = 8
sizeof(std::unique_ptr<Sensor>)                 = 8
sizeof(std::unique_ptr<Sensor, FileDeleter>)    = 8
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

`sizeof(std::unique_ptr<Sensor>)` is 8 — the same as a raw pointer. So is the version with a *stateless* custom deleter, because an empty class as a member costs nothing thanks to the empty-base optimisation. The version whose deleter has an `int` member is 16: state in the deleter is the one thing that makes a `unique_ptr` bigger than a pointer.

Ownership transfer is visible. After `auto b = std::move(a);` the source is **null** — `unique_ptr`'s move constructor takes the address and sets the source's to `nullptr`, so exactly one object owns the `Sensor` at all times. Passing by value to `takes_ownership` moves it again, and the destructor runs at the end of *that* function, not back in `main`: the object died where its owner did.

The function signature says all of this. `void takes_ownership(std::unique_ptr<Sensor>)` means "I take it and you no longer have it"; `void borrows(const Sensor&)` means "I look at it and you keep it"; `void may_take(std::unique_ptr<Sensor>&)` means "I may take it, and you keep the handle either way". None of these needs a comment.
:::

## What `unique_ptr` costs

::: example The same function, two ways, identical instructions
```cpp
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

The `noinline` attributes only stop the compiler from folding these two into `main`, so that both bodies appear in the listing.

Compiled with `g++ -std=c++20 -O2 -fno-exceptions` (with `use` defined in another translation unit, so the optimiser cannot see into it), both functions produce the same instruction sequence — the listing below is the two of them one after the other, with the assembler's `.cfi` and `.size` directives filtered out:

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

Instruction for instruction identical: the allocation, the two stores, the call, the deallocation. `unique_ptr` is a class with one pointer member and an inlined destructor, so at `-O2` there is nothing left of it but the `delete` it emits.

The `-fno-exceptions` matters for the comparison, not for the conclusion. With exceptions enabled the `unique_ptr` version *additionally* emits an unwind path that frees the `Sensor` if `use` throws — which is code the raw version does not have because the raw version leaks in that case. So the honest statement is: identical on the path where nothing goes wrong, and correct on the path where something does.
:::

::: key
`std::unique_ptr<T>` with the default or any stateless deleter is the same size as a raw pointer and compiles to the same instructions plus the `delete` at scope exit. It is the default answer for an object one owner is responsible for, and `std::make_unique<T>(args…)` is how to create one — it keeps `new` out of your code and cannot leak if another argument's evaluation throws.
:::

## `shared_ptr` and its control block

A `std::shared_ptr<T>` is two pointers: one to the object, one to a **control block** holding the strong reference count, the weak count, and the deleter. When the strong count reaches zero the object is destroyed; when the weak count also reaches zero the control block is freed.

::: example Allocations, counts, and what `weak_ptr` does to them
Replacing the global `operator new` makes the allocations countable.

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

Three numbers to take from the top half. Constructing a `shared_ptr` from a raw `new` makes **two** allocations — one for the object (16 bytes) and one for the control block (24 more, giving 40) — while `make_shared` makes **one** of 32 bytes, fusing the object and the control block into a single block. `make_unique` makes one allocation of 16 bytes and no control block at all, because `unique_ptr` has nothing to count.

So `make_shared` is both faster and smaller. Its one drawback: because object and control block share an allocation, the memory is not released until the last `weak_ptr` also goes away, which matters if the object is large and the weak references are long-lived.

The bottom half shows the counting. Three `shared_ptr`s to the object give `use_count() == 3`. Adding a `weak_ptr` leaves it at 3 — a weak reference does not keep the object alive, which is the whole point. `w.lock()` returns a `shared_ptr`, and while that temporary exists the count is 4; it drops back when the temporary dies. `w.expired()` asks whether the object is gone without creating a reference.
:::

## The cost of sharing

::: example One thread, then two
Twenty million copies of a `shared_ptr` — each one an atomic increment on construction and an atomic decrement on destruction — against the same number of raw pointer copies.

```text
one thread:  raw pointer copy 0.16 ns   shared_ptr copy 1.24 ns
two threads: shared_ptr copy 118.67 ns per copy (2 x 20000000 copies)
(hardware_concurrency = 4)
```

That is one run; the figures below give the spread over repeats.

Single-threaded, a `shared_ptr` copy costs about 1.2 ns against 0.16 ns for a raw pointer: roughly eight times more, and still small enough to ignore in most code. Repeat runs gave 1.18 and 1.59 ns, so treat it as "about 1 to 1.5 ns".

Two threads copying the *same* `shared_ptr` cost about **119 ns per copy** — and repeat runs gave 97 and 94 ns, so call it around 100 ns, roughly seventy times the uncontended figure. Nothing about the counter changed; what changed is that its cache line now moves between cores on every increment, and each atomic read-modify-write has to take exclusive ownership of it before it can proceed. Two threads that merely *look at* the same object, sharing no data and holding no lock, serialise on the reference count.

That is the first of the two reasons a control loop does not copy `shared_ptr`s, and it is the one people do not expect, because the code contains no lock and no shared mutable data — only a pointer being copied.
:::

## Why `shared_ptr` is the wrong default in a 1 kHz loop

Three distinct reasons, and the interview answer needs two of them.

**The reference count is atomic.** Every copy is a synchronised read-modify-write, and as measured above, a contended one costs about a hundred nanoseconds rather than one. The cost is invisible in the source: a function taking `shared_ptr<T>` by value performs two atomic operations per call.

**Destruction happens at an unpredictable time, in an unpredictable thread.** Whichever thread drops the last reference runs the destructor — and every destructor it owns, transitively, and every `operator delete` those need. A telemetry thread releasing the last handle to a large object graph does an unbounded amount of work at a moment nobody chose. In a hard real-time task that is a deadline miss with no line of code to blame.

**There is an extra allocation unless you use `make_shared`** — measured above as 2 allocations and 40 bytes versus 1 and 32 — and allocation in the loop is already forbidden by lesson 07.

The alternative is not `shared_ptr` used carefully. It is ownership that is decided before the loop starts: the subsystem that owns an object holds it in a `unique_ptr` member or by value, and everything else receives a `const T&` or a `T*` for the duration of a call. Lifetime is then a property of the initialisation order, which is reviewable, rather than of the runtime reference graph, which is not.

::: warning
Passing `shared_ptr<T>` by value to a function that only reads the object is the most common way this cost appears. The function does not need ownership, so it should take `const T&`. Take `shared_ptr<T>` by value only when the function genuinely stores a copy; take `const shared_ptr<T>&` when it might, and otherwise pass the object.
:::

## Cycles, and `weak_ptr`

Reference counting cannot collect a cycle. If A holds a `shared_ptr` to B and B holds one to A, each keeps the other's count at 1 forever, and neither destructor runs.

::: example A controller and an estimator that point at each other
```cpp
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
```

Both pairs are created with `make_shared`, wired to each other, and dropped at the end of a block. Under `-fsanitize=address -fno-sanitize-recover=all`:

```text
with weak_ptr breaking the cycle:
  c.use_count() = 1, e.use_count() = 2
  ~ControllerW
  ~EstimatorWeak
with two shared_ptrs:
  c.use_count() = 2, e.use_count() = 2
end of main

=================================================================
==32161==ERROR: LeakSanitizer: detected memory leaks

Indirect leak of 32 byte(s) in 1 object(s) allocated from:
    ...
    #9 0x5566f83526ff in main l14-cycle.cpp:43
    ...

Indirect leak of 32 byte(s) in 1 object(s) allocated from:
    ...

SUMMARY: AddressSanitizer: 64 byte(s) leaked in 2 allocation(s).
```

(Each leak's trace is nine frames of `make_shared` machinery inside libstdc++; the `...` lines cut them, and the frame that names your own code is `#9`.)

The weak version's counts are 1 and 2: the local `c` is the only owner of the controller, because the estimator's back-reference is weak. Both destructors ran, in order, at the closing brace.

The cyclic version's counts are 2 and 2, and **neither destructor printed**. The objects outlived `main`, and LeakSanitizer reported 64 bytes in 2 allocations — "indirect" because each block is still reachable from the other, which is exactly what a cycle is.

The rule that prevents this: **the owning direction uses `shared_ptr`, the back-reference uses `weak_ptr`.** Parent owns child; child observes parent. Use the observer with `if (auto p = w.lock()) { … }`, which gives you a `shared_ptr` that is non-null only if the object is still alive, and keeps it alive for the duration of the block.
:::

## Choosing

| Situation | Use |
| --- | --- |
| an object with one clear owner | `std::unique_ptr<T>`, made with `make_unique` |
| a function that reads an object it does not own | `const T&` |
| a function that may be given nothing | `const T*` or `std::optional` |
| an object whose owner is genuinely undecidable | `std::shared_ptr<T>`, made with `make_shared` |
| a back-reference from an owned object to its owner | `std::weak_ptr<T>` |
| a fixed-size collection created at start-up | no pointer at all: a member by value, or `std::array` |

The last row is the one flight software uses most. A pointer is for indirection you need; if the object's lifetime is the subsystem's lifetime, make it a member.

## Check yourself

::: check
`sizeof(std::unique_ptr<Sensor>)` is 8 and `sizeof(std::shared_ptr<Sensor>)` is 16. Where does the second 8 bytes go, and how much memory does a `shared_ptr` actually cost?
:::

::: answer
The second pointer is the address of the control block, which holds the strong count, the weak count, the deleter and the allocator. So the `shared_ptr` object itself is 16 bytes, but the true cost includes the control block it points at: the measurement showed `make_shared<Sensor>` allocating 32 bytes for a 16-byte `Sensor`, so 16 bytes of control block, and `shared_ptr<Sensor>{new Sensor}` allocating 40 bytes across two blocks — 16 for the object and 24 for a separately allocated control block. Against a `unique_ptr`'s 8 bytes on the stack and 16 on the heap, sharing a small object roughly doubles its footprint. For a large object the proportion is negligible and the argument against `shared_ptr` becomes entirely about time and determinism rather than space.
:::

::: check
A colleague says the contended measurement is unfair because real code does not copy a `shared_ptr` twenty million times. Rebut or concede, and say what the measurement is actually evidence for.
:::

::: answer
Concede the framing and keep the number. The benchmark's job is to isolate the per-copy cost, not to predict any real program's total; twenty million iterations is how you get a stable figure out of an operation that takes a nanosecond. What it is evidence for is the *shape*: a `shared_ptr` copy costs about 1.2 ns when one thread owns the counter and about 100 ns when two threads touch it, so the cost is not a property of the operation but of the sharing pattern, and it appears with no lock and no shared data in the source. The consequence for real code is a rule rather than a budget: do not put `shared_ptr` copies on a path that several threads execute concurrently, and in particular do not take `shared_ptr` by value in a function that only reads the object. A 1 kHz loop making even twenty such copies per cycle spends 2 µs on reference counting when contended, which is 0.2 per cent of the cycle for nothing.
:::

::: check
Why does `make_unique` exist, given that `std::unique_ptr<T> p(new T(args))` is one line and works?
:::

::: answer
Three reasons, in increasing importance. It is shorter and says the type once instead of twice. It keeps `new` out of application code, so a reviewer can search for `new` and expect to find only the places that genuinely need raw allocation. And it removes a leak that the explicit form allowed: in `f(std::unique_ptr<A>(new A), g())`, a compiler was permitted before C++17 to evaluate `new A`, then call `g()`, then construct the `unique_ptr` — so if `g()` threw, the `A` leaked. C++17 tightened the evaluation order so that each argument's evaluation is complete before the next begins, which closes that particular hole, but `make_unique` never had it and does not depend on the reader knowing the standard version. The same argument applies with more force to `make_shared`, which additionally fuses two allocations into one.
:::

::: check
A logging subsystem needs to look at a `Telemetry` object owned by the flight-data recorder, which may be shut down while logging is in progress. Which pointer type, and what does the using code look like?
:::

::: answer
If the recorder owns the object through a `shared_ptr`, the logger holds a `std::weak_ptr<Telemetry>` and uses it as `if (auto p = w.lock()) { use(*p); }`. `lock()` returns an empty `shared_ptr` if the object has been destroyed, so the check and the acquisition are one operation and there is no window between them — testing `w.expired()` and then calling `lock()` is a race. While `p` is in scope the object cannot be destroyed, because `p` is a strong reference, so the body is safe even if the recorder shuts down mid-call. That is `weak_ptr`'s real purpose: not just breaking cycles, but observing an object whose lifetime you do not control, with a safe way to ask whether it is still there. If instead the recorder owns the object by value or through a `unique_ptr`, there is no `weak_ptr` to be had and the problem must be solved by ordering — the logger stops before the recorder shuts down — which is the usual flight-software answer.
:::

::: check
LeakSanitizer called the cycle's blocks "indirect" leaks. What would a "direct" leak have looked like, and why is the distinction useful?
:::

::: answer
A direct leak is a block that nothing at all points at when the program ends — the classic `new` with no matching `delete`, as in lesson 09, where the report said "Direct leak of 384 byte(s) in 3 object(s)". An indirect leak is a block that *is* still pointed at, but only from another block that is itself leaked, which is precisely the cycle's situation: each object holds a `shared_ptr` to the other, so each is reachable from the other and neither is reachable from any live root. The distinction is useful because it tells you where to look. A page of indirect leaks usually has one direct leak at its head — fix that and they all go away — whereas a set of indirect leaks with no direct leak at all is the signature of a cycle, and points you at the ownership graph rather than at a missing `delete`.
:::

## Summary

| Item | Detail |
| --- | --- |
| `std::unique_ptr<T>` | exclusive ownership; 8 bytes here, same as a raw pointer; move-only |
| stateless custom deleter | still 8 bytes (empty-base optimisation); a deleter with state made it 16 |
| generated code | identical to raw `new`/`delete` at `-O2 -fno-exceptions`, plus an unwind path when exceptions are on |
| `std::make_unique<T>(args…)` | one allocation, no `new` in your code, no leak if another argument throws |
| `std::shared_ptr<T>` | 16 bytes: object pointer plus control-block pointer |
| control block | strong count, weak count, deleter; separately allocated unless you use `make_shared` |
| measured allocations | `shared_ptr{new Sensor}` 2 blocks / 40 bytes; `make_shared` 1 / 32; `make_unique` 1 / 16 |
| copy cost | about 1.2 ns one thread; about 100 ns with two threads on the same counter |
| why not in a 1 kHz loop | atomic refcount, unpredictable destruction point and thread, extra allocation |
| `std::weak_ptr<T>` | observes without owning; `expired()`, and `lock()` to obtain a strong reference safely |
| cycles | two `shared_ptr`s pointing at each other never reach zero; LeakSanitizer calls them indirect leaks |
| the rule | owner holds `shared_ptr`, back-reference holds `weak_ptr` |

That closes the module. You can now say where every object lives, how long it lives, who owns it, what the compiler is entitled to assume about the memory it occupies, and how to produce evidence when one of those goes wrong. The next module takes the ownership idea into the class itself: constructors, destructors, the copy and move pairs, and the special-member generation rules that lesson 13 only sketched.
