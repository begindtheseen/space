---
id: l04-static-memory-pools-arenas-and-fixed-capacity
title: Static memory, pools, arenas and fixed-capacity containers
minutes: 26
covers:
  - 'Static memory: pools, arenas, fixed-capacity containers, placement new at init'
---

Picture two ways to park a car downtown. In the first, you drive into a garage where every space was painted and numbered before it opened. There are exactly 200 spaces. If one is free, you get it in seconds. If none is free, the sign at the door says FULL, and you know right away.

In the second, a valet takes your keys and hunts for a spot on the streets. Most days it takes two minutes. Some days it takes forty. And sometimes the valet says there is no spot for your bus, even though the street has plenty of empty space in total — all of it in car-sized gaps between parked cars.

Flight software parks its data in the painted garage. This lesson shows how: memory reserved once, when the computer starts, and then reused for the whole flight without ever asking for more. You will meet three tools — **fixed-capacity containers**, **arenas** and **pools** — plus a way to *prove* that a control loop never asks for memory at all.

## Why the heap is a problem in flight

When C++ code says `new`, or a `std::vector` grows, or a long `std::string` is built, the program asks a piece of library code called the **allocator** for some bytes. The allocator hands them out from a big shared region called the **[[heap|heap-name]]** — the valet's city. When you are done, `delete` gives the bytes back.

On a flight computer this has three problems.

**Time.** To answer a request, the allocator has to search its records for a gap that is big enough. How long that search takes depends on everything that was allocated and freed before — the whole history of the program. It might take 200 nanoseconds today and 50 microseconds after a week of running. So the **worst-case** time of `new` has no bound you can write down. A 1 kHz control loop has a budget of 1 ms per cycle, and a call with no known worst case cannot be put inside a budget.

**[[Fragmentation|fragmentation-picture]].** This is the bus-and-gaps problem. After many requests of different sizes are made and returned in a mixed-up order, the free memory ends up split into many small holes. The total free space can be large while no single hole is big enough for the request in front of you. Then the request fails, with free memory remaining.

**Failure has no good answer.** Suppose a request fails 90 seconds into an ascent. What should the guidance code do without the memory it needed? On the ground you would print an error and quit. In flight, there is no sensible reply.

::: example A heap that is half empty and still full
A small flight computer gives its heap $64\,\mathrm{KiB}$, which is $64 \times 1024 = 65\,536$ bytes. At start-up the software makes 64 requests of $1\,\mathrm{KiB}$ each, one for each sensor record. That fills the heap exactly: $64 \times 1024 = 65\,536$.

Later, every other record is freed — records 1, 3, 5, and so on. That returns $32$ blocks, or $32 \times 1024 = 32\,768$ bytes. Half the heap is free.

Now a task asks for one $2\,\mathrm{KiB}$ buffer. Each free hole is $1\,\mathrm{KiB}$ wide, with a live record on each side of it. No two holes touch. So there is no $2\,\mathrm{KiB}$ stretch anywhere, and the request fails.

Sanity check: $32\,768$ free bytes is sixteen times the $2048$ requested, yet the answer is "no". Free in total is not free in one piece. Real allocators are cleverer about where they put things, but none can move a live object out of the way.
:::

Giving up the heap has a bonus. Freeing memory twice, using it after it was freed, forgetting to free it (a **leak**) — all need a `delete`. If nothing is freed in flight, those bugs cannot happen in flight.

That is the reason behind the third of the NASA/JPL **[[Power of Ten|power-of-ten]]** rules, a famous list of ten rules for safety-critical code. Lesson 11 covers all ten; here is the one about memory.

::: key Power of Ten rule 3
Do not use dynamic memory allocation after initialization. This removes allocator non-determinism, fragmentation and the whole class of use-after-free and leak defects in one stroke.
:::

## Two phases: start-up and steady state

The rule has an escape hatch built in. It says *after initialization*. So a flight program lives in two phases.

- **Initialization** (start-up) runs once, on the ground or right after power-on. It may allocate. It reads the configuration, sizes every buffer, builds every object and connects them together. If something fails here, the computer is not flying yet, so the failure can be reported and fixed.
- **Steady state** is the loop that runs for the rest of the flight: read sensors, estimate, steer, send telemetry, repeat. It allocates nothing. It only reuses what start-up built.

Think of packing a backpack before a hike: everything goes in at the trailhead, and on the trail you never go shopping.

The tool that joins the two phases is **placement new**, from the memory module. Written `::new (address) T(args)`, it runs a constructor in storage you already own and allocates nothing. So start-up reserves raw, correctly aligned bytes, and steady state builds and destroys objects inside them, paying only the constructor's small, predictable cost.

## Fixed-capacity containers

The simplest static memory is an array of fixed size. `std::array<double, 6>` holds exactly six doubles, lives wherever you put it (inside another object, on the stack, or in static memory), and never allocates.

A **fixed-capacity container** goes one step further. It has a **capacity** — the most it can ever hold, fixed at compile time — and a **size**, the number of elements it holds right now, which can go up and down. Think of an egg carton: twelve cups, and some number of eggs. A `push_back` on a full carton does not buy a bigger carton. It reports failure, usually by returning `false`.

Functions that only need to *look at* a run of elements should take a `std::span<const double>`. A **[[span|span-view]]** is a pointer plus a length: it can view a `std::array`, a plain array, a fixed-capacity container or a reserved vector, and it never owns or allocates anything.

What about `std::vector` itself? A vector allocates only when it has to grow past its **capacity**. If start-up calls `reserve(100)`, the vector asks for room for 100 elements once. After that, `push_back` up to 100 elements writes into the reserved room, and `clear()` sets the size back to zero *without* giving the memory back. So a vector reserved at start-up and never pushed past its capacity is allocation-free in steady state. The same goes for a container whose allocator takes its memory from a pool or arena that start-up reserved (both come later in this lesson). You keep the familiar interface and lose the allocation.

The catch is "never pushed past". If one extra element arrives, a plain vector quietly asks the heap for a bigger block, copies everything over, and frees the old one — all inside your 1 ms. The last section shows how to catch that.

::: key Which rule clashes with modern C++
The no-dynamic-allocation rule, because most standard containers and `std::string` allocate. You comply by preallocating at init, using fixed-capacity containers, `std::array` and `std::span`, and custom allocators, without giving up RAII or type safety.
:::

::: warning Allocation hides in ordinary-looking code
Growing a vector is easy to spot. These are not. On g++ 13 with its standard library, a program that counted every call to `operator new` printed:

```text
12-char string: 0 allocations
20-char string: 1 allocations
std::function with 48-byte capture: 1 allocations
```

A short `std::string` fits inside the string object itself (the **[[small-string optimization|small-string]]**, up to 15 characters here), so it does not allocate. One character past that limit, it does. A `std::function` holding a lambda that captured six doubles allocated too. Inserting into a `std::map` or `std::unordered_map`, and building a `std::stringstream`, allocate as well. Keep all of these out of the loop, or prove they stay silent.
:::

## Arenas: allocate forward, free everything at once

An **arena** (also called a bump allocator or monotonic buffer) is a slab of bytes with one number attached: the offset of the next free byte. To allocate $n$ bytes, round the offset up to the alignment the object needs, hand out the address, and move ("bump") the offset forward by $n$. There is no search, so the time is the same every call. Individual objects are never freed. Instead, the whole arena is reset to zero at once — at the end of a phase, a frame or a mode.

Picture a notepad where you only write on the next blank line, and tear off the page when it is done. Arenas suit data built together and thrown away together, such as the scratch space one control cycle needs and then forgets.

::: example A 256-byte arena, by hand and from the library
```cpp laptop
#include <cstddef>
#include <cstdio>
#include <memory_resource>
#include <new>
#include <vector>

// A hand-rolled arena: a slab of bytes and a "next free" offset.
class Arena {
public:
    void* allocate(std::size_t n, std::size_t align) {
        std::size_t start = (used_ + align - 1) / align * align;  // round up
        if (start + n > sizeof(buf_)) return nullptr;             // full
        used_ = start + n;
        return buf_ + start;
    }
    void reset() { used_ = 0; }          // frees everything at once
    std::size_t offset_of(const void* p) const {
        return static_cast<std::size_t>(static_cast<const std::byte*>(p) - buf_);
    }
    std::size_t used() const { return used_; }
private:
    alignas(std::max_align_t) std::byte buf_[256];
    std::size_t used_ = 0;
};

int main() {
    Arena a;
    void* name  = a.allocate(10, 1);    // 10 chars
    void* gains = a.allocate(24, 8);    // three doubles
    void* scale = a.allocate(4, 4);     // one float
    std::printf("offsets: %zu %zu %zu, used %zu of 256\n",
                a.offset_of(name), a.offset_of(gains), a.offset_of(scale), a.used());
    void* big = a.allocate(300, 8);
    std::printf("300 more bytes: %s\n", big ? "ok" : "refused (nullptr)");
    a.reset();
    std::printf("after reset: used %zu\n", a.used());

    // The standard library's arena: a monotonic buffer over a fixed array,
    // with "no more memory" as the fallback instead of the heap.
    alignas(std::max_align_t) static std::byte slab[1024];
    std::pmr::monotonic_buffer_resource arena{slab, sizeof slab,
                                              std::pmr::null_memory_resource()};
    std::pmr::vector<double> v{&arena};
    v.reserve(64);                       // 64 * 8 = 512 bytes from the slab
    for (int i = 0; i < 64; ++i) v.push_back(i * 0.5);
    std::printf("pmr vector: size %zu, last %.1f\n", v.size(), v.back());
    try {
        v.push_back(99.0);               // growing needs 1024 more bytes
    } catch (const std::bad_alloc&) {
        std::printf("65th element: std::bad_alloc, heap never touched\n");
    }
}
```

```text
offsets: 0 16 40, used 44 of 256
300 more bytes: refused (nullptr)
after reset: used 0
pmr vector: size 64, last 31.5
65th element: std::bad_alloc, heap never touched
```

Follow the offsets. The 10 name bytes go at offset 0, so the next free byte is 10. The doubles need an address that is a multiple of 8, so the arena rounds 10 up: $(10 + 8 - 1) / 8 = 17 / 8 = 2$ in whole-number division, and $2 \times 8 = 16$. The doubles take bytes 16 to 39. The float needs a multiple of 4, and 40 already is one, so it lands at 40 and the arena has used $40 + 4 = 44$ bytes. Bytes 10 to 15 are wasted padding — the small price of alignment.

The 300-byte request cannot fit, so it is refused with `nullptr`. And `reset()` frees all three objects in one step.

The second half uses the standard library's version, from the **[[pmr|pmr-name]]** part of C++17. `monotonic_buffer_resource` is an arena over the `slab` array. When it runs out, it asks its *upstream* resource for more, and here the upstream is `null_memory_resource()`, which always refuses. The vector's 64 doubles take $64 \times 8 = 512$ bytes. The 65th element makes the vector try to double its room to 128 elements, which needs $128 \times 8 = 1024$ new bytes. Only $1024 - 512 = 512$ remain, so the request fails loudly, and the heap is never asked.
:::

## Pools: fixed-size slots and a free list

An arena cannot give back one object. A **pool** can. A pool is a row of equal-sized **slots**, each big enough for one object of a single type. Acquiring hands out a free slot. Releasing puts that slot back. Because every slot is the same size, a returned slot fits the next request perfectly, so a pool cannot fragment.

The trick is how the pool remembers which slots are free without extra memory. A free slot has nothing in it, so the pool uses its bytes to store a pointer to the next free slot. The free slots form a chain, called an **[[intrusive free list|free-list-picture]]** — "intrusive" because the links live inside the slots themselves. The pool keeps one pointer, `free_`, to the head of the chain.

- **Acquire:** if `free_` is null, the pool is empty — return `nullptr`. Otherwise take the head slot, move `free_` to the head's `next`, and build the object in the slot with placement new.
- **Release:** run the object's destructor, then write the old `free_` into the slot and make the slot the new head.

Both are a few pointer moves with no loop, so both are $O(1)$, read "order one": the same time every call, however big the pool is.

A slot must be either a link or an object, never both at once. C++ has a type made for exactly that: a **[[union|union-type]]**, whose members share the same bytes. The object part is a raw byte array marked `alignas(T)` — "line this up the way a `T` must be lined up" — and sized `sizeof(T)`. A `static_assert` checks at compile time that the slot really is big enough, so a mistake stops the build instead of corrupting memory. Its form is `static_assert(condition, "message")`: if the condition is false when the program compiles, compilation fails with that message.

::: example A pool of four telemetry messages
```cpp
#include <cstdint>
#include <cstdio>
#include <new>

struct Telemetry {
    std::uint32_t seq;
    float altitude_m;
    float speed_mps;
};

// Four slots. A free slot holds a pointer to the next free slot;
// a used slot holds a Telemetry. Never both at once, so a union.
class TelemetryPool {
public:
    TelemetryPool() {                    // init: thread the free list
        for (int i = 0; i < 3; ++i) slots_[i].next = &slots_[i + 1];
        slots_[3].next = nullptr;
        free_ = &slots_[0];
    }
    Telemetry* acquire(std::uint32_t seq, float alt, float spd) {
        if (free_ == nullptr) return nullptr;       // pool empty
        Slot* s = free_;                            // take the head...
        free_ = s->next;                            // ...and unlink it
        return ::new (s->bytes) Telemetry{seq, alt, spd};  // build in place
    }
    void release(Telemetry* t) {
        t->~Telemetry();                            // end its lifetime
        Slot* s = reinterpret_cast<Slot*>(t);       // same address as slot
        s->next = free_;                            // push on the head
        free_ = s;
    }
    int slot_index(const Telemetry* t) const {
        return static_cast<int>(reinterpret_cast<const Slot*>(t) - slots_);
    }
private:
    union Slot {
        Slot* next;
        alignas(Telemetry) unsigned char bytes[sizeof(Telemetry)];
    };
    static_assert(sizeof(Slot) >= sizeof(Telemetry), "slot too small");
    Slot slots_[4];
    Slot* free_ = nullptr;
};

int main() {
    std::printf("sizeof(Telemetry) = %zu, sizeof(pool) = %zu\n",
                sizeof(Telemetry), sizeof(TelemetryPool));
    TelemetryPool pool;
    Telemetry* m[5];
    for (int i = 0; i < 5; ++i) {
        m[i] = pool.acquire(i, 1000.0f * i, 50.0f * i);
        if (m[i]) std::printf("acquire %d -> slot %d\n", i, pool.slot_index(m[i]));
        else      std::printf("acquire %d -> nullptr (pool empty)\n", i);
    }
    pool.release(m[1]);
    std::printf("released slot 1\n");
    Telemetry* again = pool.acquire(5, 5000.0f, 250.0f);
    std::printf("acquire 5 -> slot %d, seq %u, altitude %.0f m\n",
                pool.slot_index(again), again->seq, again->altitude_m);
}
```

```text
sizeof(Telemetry) = 12, sizeof(pool) = 72
acquire 0 -> slot 0
acquire 1 -> slot 1
acquire 2 -> slot 2
acquire 3 -> slot 3
acquire 4 -> nullptr (pool empty)
released slot 1
acquire 5 -> slot 1, seq 5, altitude 5000 m
```

Check the size. That output is from a typical 64-bit laptop, where a pointer is 8 bytes. A `Telemetry` is three 4-byte fields, $3 \times 4 = 12$ bytes. A `Slot` must hold either 12 bytes or an 8-byte pointer, and the pointer needs an address that is a multiple of 8, so the slot rounds up from 12 to the next multiple of 8, which is 16. Four slots take $4 \times 16 = 64$ bytes, and the `free_` pointer adds 8: $64 + 8 = 72$. ORBIT's Run button builds 32-bit WebAssembly, where a pointer is 4 bytes and needs only a multiple of 4. There the slot is just the 12 bytes of a `Telemetry`, so the pool is $4 \times 12 + 4 = 52$ bytes, and the first line reads `sizeof(pool) = 52`. Either way the sum matches the output, and there is no hidden header anywhere — the pool *is* its storage.

Four acquires take slots 0 to 3 in the order start-up chained them. The fifth finds `free_` null and gets `nullptr` — a clear, testable answer. Releasing message 1 pushes slot 1 onto the head of the chain, so the next acquire gets slot 1 back.
:::

This pool is written for one message type and four slots. The module's first exercise asks you to turn it into a template, `Pool<T, N>`, that works for any type and any count — the same union `Slot`, the same free list, placement new in `acquire`, and a `static_assert` that `T` fits.

::: warning Every slot needs exactly one constructor and one destructor
A pool does not know which slots hold live objects. Releasing a pointer twice links its slot into the chain twice, so two later acquires hand out the same memory. Releasing a pointer from somewhere else links a stranger's memory into the chain. Neither is detected, so pair each acquire with exactly one release.
:::

## Proving the loop never allocates

Saying "we don't allocate in the loop" is a promise. Flight software wants a proof, and there is a cheap one. The global `operator new` is an ordinary function you may replace for the whole program. Replace it with a version that counts every call — and, once a flag says "steady state", stops the program on the spot.

Then run the full test suite with the flag set during the loop. Any hidden allocation — a vector growing, a long string, a `std::function` — stops the run and prints its size. Because it is a program, not a person reading code, it can run on every change in **[[CI|ci-name]]**.

::: example An allocation guard around a control loop
```cpp laptop
#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <new>
#include <vector>

// --- the allocation guard: one per program ---------------------------
std::atomic<long> g_allocs{0};
std::atomic<bool> g_steady{false};

void* operator new(std::size_t n) {
    if (g_steady.load()) {
        std::fprintf(stderr, "FATAL: %zu-byte allocation in steady state\n", n);
        std::abort();
    }
    g_allocs.fetch_add(1);
    if (void* p = std::malloc(n)) return p;
    throw std::bad_alloc{};
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

// --- a stand-in for a control task ------------------------------------
struct Sample { double t, accel; };

int main(int argc, char**) {
    std::vector<Sample> window;
    window.reserve(100);                 // init: the one allocation
    std::printf("allocations during init: %ld\n", g_allocs.load());

    g_steady.store(true);                // from here on, none allowed
    const int limit = (argc > 1) ? 101 : 100;   // run with an argument to overflow
    for (int cycle = 0; cycle < 1000; ++cycle) {
        window.clear();                  // keeps its capacity
        for (int i = 0; i < limit; ++i) window.push_back({cycle * 1e-3, 9.8});
    }
    g_steady.store(false);

    std::printf("1000 cycles done, size %zu, capacity %zu\n",
                window.size(), window.capacity());
    std::printf("allocations in total: %ld\n", g_allocs.load());
}
```

Run with no argument, each cycle fills the reserved window with exactly 100 samples:

```text
allocations during init: 1
1000 cycles done, size 100, capacity 100
allocations in total: 1
```

One allocation, at start-up, and none in $1000 \times 100 = 100\,000$ push-backs after it. That is the proof, for the paths the tests ran.

Run with an argument, each cycle pushes 101 samples. The first time the 101st arrives, the program stops:

```text
FATAL: 3200-byte allocation in steady state
```

(and the shell reports `Aborted`, exit status 134). Where does 3200 come from? A `Sample` is two doubles, $2 \times 8 = 16$ bytes. A full vector of 100 grows by doubling its capacity to 200, so it asks for $200 \times 16 = 3200$ bytes. The guard caught the exact overflow, with its size, the first time it happened.
:::

::: key How to prove a loop is allocation-free
Instrument the allocator: override global `operator new` and `delete` to count and, during the steady-state region, abort. Run the full test suite with the flag set. It is a mechanical, repeatable check you can put in CI.
:::

::: warning The guard only sees what goes through operator new
Code that calls `malloc` directly — a C library, or the C++ runtime itself, which on g++ gets the memory for a thrown exception from `malloc` — slips past it. A thorough setup also wraps `malloc` (the GNU linker's `--wrap=malloc` option does this) or builds without exceptions. And the guard only proves the paths your tests reach, so drive the loop through every mode, fault paths included.
:::

## Check yourself

::: check
A heap of $8\,\mathrm{KiB}$ is filled with sixteen $512$-byte blocks. Blocks 2, 3, 6, 9, 10 and 11 are then freed (counting from 0). How many bytes are free in total? What is the largest single request that can succeed, assuming the allocator merges free blocks that touch?
:::

::: answer
Six blocks are free: $6 \times 512 = 3072$ bytes in total. Now look at which free blocks touch. Blocks 2 and 3 are neighbors, so they merge into one hole of $2 \times 512 = 1024$ bytes. Block 6 stands alone at $512$ bytes. Blocks 9, 10 and 11 are three neighbors, merging into $3 \times 512 = 1536$ bytes. The largest hole is $1536$ bytes, so that is the largest request that can succeed. A request for $2048$ bytes fails even though $3072$ bytes are free — fragmentation in one line.
:::

::: check
Explain in your own words why the steady-state loop of flight code must not call `new`, even if every call to `new` in testing took less than a microsecond.
:::

::: answer
Testing only shows the times you happened to measure. The time `new` takes depends on the whole history of allocations and frees before it, so after hours of running with a different pattern of requests the search can take far longer. No bound can be written down, so the call cannot be fitted inside a fixed budget such as 1 ms. On top of that, a long run can fragment the heap until a request fails while plenty of memory is free in total, and mid-flight a failed request has no sensible recovery. Allocating everything at start-up removes both risks.
:::

::: check
A teammate wants to keep a `std::vector<Measurement>` inside the 1 kHz navigation task because the code reads nicely. What would you let them keep, what must change, and how would you make sure it stays that way?
:::

::: answer
They can keep the vector interface — `push_back`, `size`, range-for, passing a `std::span` to helpers. What must change is where the memory comes from and when. Either `reserve` the largest count the task can ever need during start-up, so steady-state `push_back` and `clear` only reuse that room, or back the container with a pool or arena reserved at start-up (such as a `std::pmr` vector over a `monotonic_buffer_resource` with a null upstream), or switch to a fixed-capacity container. To keep it true, run the tests with the allocation guard: if anyone later pushes past the reserved capacity, the tests fail with the size of the offending request.
:::

::: check
In the `TelemetryPool`, messages 0 to 3 are acquired, then message 2 is released, then message 0 is released. Which slot does the next acquire return, and which slot does the acquire after that return?
:::

::: answer
Releasing message 2 pushes slot 2 onto the empty free list, so the list is: slot 2. Releasing message 0 pushes slot 0 onto the head, so the list is: slot 0, then slot 2. Acquire takes the head, so the next acquire returns slot 0 and the one after returns slot 2. A free list is last-in, first-out, like a stack of plates: the most recently returned slot is handed out first.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Heap problems in flight | unbounded worst-case time, fragmentation, and no good answer to failure |
| Fragmentation | free memory split into holes; a request can fail with plenty free in total |
| Power of Ten rule 3 | no dynamic memory allocation after initialization |
| Two phases | start-up may allocate; steady state only reuses |
| Placement new | `::new (addr) T(args)` builds in owned storage and allocates nothing |
| Fixed-capacity container | capacity fixed at compile time; `push_back` on full reports failure |
| `std::span` | pointer plus length; views any contiguous storage, owns nothing |
| Reserved vector | `reserve` at start-up; `clear` keeps capacity; never push past it |
| Arena | bump an offset (rounded up for alignment); reset everything at once |
| Pool | equal slots, intrusive free list in a union, $O(1)$ acquire and release, no fragmentation |
| Allocation guard | override `operator new` to count and abort in steady state; run in CI |

Next, lesson 05 looks at code that can run at any instant, between any two lines of your loop: interrupt service routines, where the rules of this lesson become even stricter.

::: context heap-name Why it is called the heap
The name has nothing to do with the "heap" data structure from computer science class, which is a kind of tree. It comes from the everyday meaning: a pile of memory that you grab pieces from, in no particular order, and throw pieces back onto.

The other big memory region, the stack, is named for how it behaves — plates stacked and unstacked in strict order. That strict order is why the stack never fragments, and the heap's lack of order is why it does.
:::

::: context fragmentation-picture Free, but not in one piece
Here is the example's heap drawn small, with eight blocks instead of 64. Blue blocks are live records; white blocks are free. Half the heap is free, but every free hole sits between two live blocks, so the biggest request that fits is one block wide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="40" height="40" fill="#1d6fd1"/>
    <rect x="60" y="30" width="40" height="40" fill="#ffffff"/>
    <rect x="100" y="30" width="40" height="40" fill="#1d6fd1"/>
    <rect x="140" y="30" width="40" height="40" fill="#ffffff"/>
    <rect x="180" y="30" width="40" height="40" fill="#1d6fd1"/>
    <rect x="220" y="30" width="40" height="40" fill="#ffffff"/>
    <rect x="260" y="30" width="40" height="40" fill="#1d6fd1"/>
    <rect x="300" y="30" width="40" height="40" fill="#ffffff"/>
  </g>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">4 of 8 blocks free</text>
  <rect x="120" y="88" width="80" height="26" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="160" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">2 blocks</text>
  <text x="270" y="106" font-size="12" text-anchor="middle" fill="#b4232c">no hole fits</text>
</svg>
```

Real allocators fight this with clever placement, but a long, varied run can always outwit them.
:::

::: context power-of-ten Ten rules on four pages
Gerard Holzmann of NASA's Jet Propulsion Laboratory published "The Power of Ten: Rules for Developing Safety-Critical Code" in 2006. He argued that long coding standards with hundreds of rules get ignored, and that a short list which a tool can check is worth more.

The rules were written for C, but they carry over to C++ almost unchanged. Lesson 11 goes through all ten and shows how each looks in modern C++.
:::

::: context span-view A window, not a box
Think of `std::span` as a window frame you hold up against a row of boxes. It shows where the row starts and how many boxes to look at. It does not own the boxes, and taking the frame away does not throw them out.

That is why a span can be passed around freely inside the loop: copying it copies two small numbers, a pointer and a length. The catch is the flip side of not owning anything — the storage it views must outlive it, which is easy when that storage was reserved once at start-up.
:::

::: context small-string A string that fits in its own pocket
A `std::string` object is a small fixed-size record: in g++'s library it is 32 bytes, holding a pointer, a length and room for a short string. When the text is short enough to fit in that room — 15 characters plus the terminating zero — it is stored right there and the heap is never touched. Longer text goes on the heap, and the pointer points to it.

The exact limit differs between standard libraries, which is one more reason to measure with an allocation guard instead of guessing.
:::

::: context pmr-name Polymorphic memory resources
`pmr` stands for "polymorphic memory resource". C++17 added the `std::pmr` namespace so a container can be told *at run time* where its memory comes from. `std::pmr::vector<double>` is an ordinary vector whose allocator forwards every request to a `memory_resource` object you pass in.

The library ships several: `monotonic_buffer_resource` (an arena), `unsynchronized_pool_resource` and `synchronized_pool_resource` (pools), and `null_memory_resource()`, which refuses every request. Chaining an arena to the null resource is a neat way to say "this slab, and not one byte more".
:::

::: context free-list-picture The chain through the empty slots
Here the pool from the example has slots 0 and 2 in use. The free list starts at `free_`, goes to slot 1, then to slot 3, then ends. The links are stored inside the free slots themselves, so the list costs no extra memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="60" width="70" height="44" fill="#1d6fd1"/>
    <rect x="100" y="60" width="70" height="44" fill="#ffffff"/>
    <rect x="180" y="60" width="70" height="44" fill="#1d6fd1"/>
    <rect x="260" y="60" width="70" height="44" fill="#ffffff"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="55" y="122">slot 0</text><text x="135" y="122">slot 1</text>
    <text x="215" y="122">slot 2</text><text x="295" y="122">slot 3</text>
    <text x="55" y="87" fill="#ffffff">in use</text><text x="215" y="87" fill="#ffffff">in use</text>
    <text x="135" y="87">next</text><text x="295" y="87">null</text>
  </g>
  <text x="135" y="22" font-size="12" text-anchor="middle" fill="#b4232c">free_</text>
  <line x1="135" y1="28" x2="135" y2="54" stroke="#b4232c" stroke-width="2"/>
  <polygon points="135,60 130,50 140,50" fill="#b4232c"/>
  <path d="M 150 60 C 180 30, 250 30, 285 54" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="290,60 279,54 287,48" fill="#1f2a44"/>
</svg>
```

Acquire takes slot 1 and moves `free_` to slot 3. Release of slot 0 would make `free_` point at slot 0, whose link would point at slot 1.
:::

::: context union-type Two names for the same bytes
A `struct` puts its members side by side, so it is as big as all of them together. A `union` stacks its members on top of each other in the same bytes, so it is as big as its largest member, rounded up for alignment. Only one member is "active" at a time: the one most recently written.

That is exactly a pool slot's life. While the slot is free, the `next` pointer is active. While it is in use, the object in `bytes` is. Reading the member that is not active is a bug, which is why the pool writes `next` only after the object has been destroyed.
:::

::: context ci-name Continuous integration
Continuous integration, or CI, is a server that builds the software and runs its tests automatically every time someone proposes a change. If a test fails, the change is blocked until it is fixed.

That makes a rule such as "no allocation in steady state" something a machine enforces on every change, every day, instead of something a reviewer has to remember. Flight software teams lean heavily on this: a check that runs by itself cannot be forgotten.
:::
