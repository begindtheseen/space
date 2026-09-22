---
id: l07-the-heap
title: The heap: what the allocator does, how long it takes, and how it fragments
minutes: 19
covers:
  - 'The heap: fragmentation, non-deterministic allocation time, allocator behaviour'
---

`new` looks like a language feature and is a function call into a program you did not write. That program — the allocator — maintains a data structure describing which parts of a large region are in use, searches it on every request, updates it on every release, and occasionally asks the kernel for more. It is good software, and on a desktop it is essentially free. It is also the single most common reason a C++ program cannot be used in a hard real-time loop.

The argument against heap allocation in flight software is usually stated as two sentences: the time is not bounded, and the heap fragments. Both are true and neither is obvious, so this lesson measures them. You will see the allocator's timing as a distribution rather than a number, watch a heap arrive at a state where seven megabytes are free and a four-kilobyte request still has to grow the process, and then build the thing flight code uses instead, which costs three instructions and whose worst case you can read off the source.

Everything measured here is glibc 2.39's allocator on x86-64 Linux with g++ 13.3.0 at `-O2`. A different allocator has different numbers. The *shapes* are general.

## What the allocator is doing

A general-purpose allocator has to answer "give me `n` bytes" for any `n`, in any order, forever, without knowing what comes next. To do that it keeps free memory in a structure organised by size, and every request is a search.

The mechanisms differ by implementation; glibc's are representative.

- **Free lists organised by size.** Small blocks go on per-size lists so an exact fit can be found immediately. Larger ones go on sorted lists that must be scanned for a block big enough, and the best fit may be split, leaving a remainder that goes back on a list.
- **A per-thread cache.** The fastest path avoids all of that, taking a block from a small cache belonging to the calling thread. That path is a few instructions. Whether you get it depends on what that thread has freed recently.
- **Arenas and locks.** When several threads allocate at once they are steered to separate arenas, but an arena is still shared state protected by a lock. A request that has to wait for that lock waits for however long the holder takes.
- **Asking the kernel.** When nothing fits, the allocator extends the heap or maps new pages. That is a system call: a transition to the kernel, possibly page faults on first touch, and a cost measured in microseconds rather than nanoseconds.

Every one of those paths is correct. The problem is that *which one you get* depends on the entire allocation history of the process, and a deadline cares about the slowest.

## The timing is a distribution

::: example Three things timed in one process
The benchmark times 200,000 iterations of each of: an empty region between two clock reads, a bump allocation from a pre-reserved arena, and `new double[n]` followed by `delete[]`, with `n` drawn from the same pseudo-random sequence (16 to 4111 doubles, so 128 B to 32 KiB) in both allocating cases.

```cpp
auto t0 = Clock::now();
double* p = new double[n];
auto t1 = Clock::now();
```

One run, `g++ -std=c++20 -O2`, nanoseconds:

```text
nanoseconds, 200000 samples each
empty timed region     min    23  median    26  p99     37  p99.9      56  max    58006
arena.allocate         min    23  median    26  p99     31  p99.9      58  max    17924
new double[n]          min    34  median    40  p99     72  p99.9     193  max    32292
```

Read the first row first, because it is the honest floor: two calls to `steady_clock::now()` with *nothing between them* cost 26 ns at the median. Everything else is measured on top of that.

Against that floor, the arena allocation is invisible — same minimum, same median — because a bump allocation is an add, a mask, a compare and a store, and that is below what this timer can resolve. `new double[n]` costs about 14 ns more than the floor at the median, and about 137 ns more at the 99.9th percentile. So the allocator's typical cost is small, its tail is roughly ten times its median, and both of those are facts you could have guessed.

Now the row that matters: the maximum. It is 58 µs for the **empty region**, 18 µs for the arena, 32 µs for `new`. An empty region cannot take 58 µs of work, so those maxima are not allocator behaviour at all — they are this process being descheduled by the operating system in the middle of a measurement. Three repeat runs gave heap maxima of 32 µs, 98 µs and 36 µs, and arena maxima of 18 µs, 48 µs and 44 µs, with no consistent ordering between them.

That is the finding, and it is stronger than the one the benchmark set out to make: **on a general-purpose operating system you cannot measure the allocator's worst case, because something else always intervenes first.** You can measure its median and its percentiles and they look fine. The number you would need in order to certify a deadline is the one measurement cannot give you. On an RTOS the scheduling noise goes away and you are left with the allocator's own worst case — which is a property of the heap's history, not of the call, and so is still not something a test run establishes.
:::

::: warning
Do not quote the nanosecond figures above as "the cost of `new`". They are one allocator, one machine, one size distribution, one thread, at `-O2`, with a timer that costs 26 ns to read. Quote the *structure*: a fast median, a tail an order of magnitude above it, and a maximum you cannot bound by running the program. If you need numbers for your own target, take these measurements there.
:::

## Fragmentation

The second argument is not about time. A heap can reach a state where the free memory exists but is in the wrong shape.

::: example Seven megabytes free, and a four-kilobyte request still grows the process
The program allocates 100,000 blocks of 128 bytes, frees every other one, then allocates 1,500 blocks of 4,096 bytes. Free space inside the heap is read from glibc's `mallinfo2().fordblks`; resident memory from `/proc/self/statm`.

```text
after 100k x 128 B           live  12.21 MiB   free-in-heap   0.12 MiB   rss  18.04 MiB
after freeing every other    live   6.10 MiB   free-in-heap   6.98 MiB   rss  18.17 MiB
after 1500 x 4096 B          live  11.96 MiB   free-in-heap   6.89 MiB   rss  24.06 MiB
```

Line two is a heap holding **6.98 MiB of free space**. Line three asks for $1500 \times 4096 = 6\,144\,000$ bytes, which is 5.86 MiB — comfortably less than what is free.

It did not use it. Free space in the heap fell by only 0.09 MiB, while resident memory rose from 18.17 to 24.06 MiB, an increase of 5.89 MiB — almost exactly the amount requested. The allocator took new memory from the kernel for essentially every one of those 1,500 blocks.

The reason is that the 6.98 MiB is not one piece. Freeing 50,000 blocks raised free-in-heap from 0.12 MiB to 6.98 MiB, a rise of 6.86 MiB, which is $6.86 \times 1048576/50000 = 144$ bytes per freed block — a 128-byte request plus the allocator's per-block bookkeeping. So the free space is **50,000 separate holes of 144 bytes**, each one walled in by a block that is still live, so none of them can merge with a neighbour. Not one can hold 4,096 bytes. This is *external fragmentation*: free bytes that no single request can use.

The numbers repeat to the second decimal across runs, because the pattern is deterministic. Real workloads are not, which makes this worse rather than better: the state a real heap reaches depends on the exact sequence of requests over the whole mission, so it is not reproducible in test and not predictable in advance.
:::

Two consequences follow, and they are the ones to be able to state.

**An allocation can fail with memory still available.** After hours or months of normal operation, a request the program made successfully a thousand times returns `std::bad_alloc` or `nullptr`, because the free space has been ground into pieces smaller than the request. There is no error in the code, nothing changed, and the failure time depends on the mission profile.

**There is nowhere to put the failure.** A control loop that cannot allocate its working buffer this cycle has no useful response. It cannot wait, it cannot ask the operator, and it cannot skip the cycle.

::: key
A general-purpose allocator's cost depends on the heap's entire history, so its worst case is not bounded by anything you can measure; and external fragmentation means a request can fail while free memory remains, at an unpredictable time. These are the two independent reasons `new` is forbidden after initialisation in hard real-time flight software. Average speed is not one of the reasons.
:::

## How long is a long time?

A 1 kHz control loop has 1 ms — 1,000,000 ns — to do everything: read sensors, run the filter, run the control law, write actuator commands, and still leave margin. A 40 ns allocation is nothing. A 200 ns allocation is nothing. Even a 30 µs stall is only 3% of the budget.

The problem is the *rate at which rare things become certain*. A 1 kHz loop runs

$$
1000 \times 86400 \times 365 = 3.1536 \times 10^{10}
$$

cycles in a year. An event with a probability of $10^{-9}$ per cycle — one in a billion, far past anything a test campaign will observe — happens about 32 times over that year. If the consequence of that event is a missed control deadline, you have 32 of them, at times nobody can predict, on a vehicle. This is why the analysis is done on worst cases rather than percentiles, and why a component whose worst case cannot be established is excluded on principle rather than on measurement.

## What flight code does instead

Allocate everything during initialisation, before the loop starts, and then never call the allocator again. In practice that means:

- **Fixed-capacity containers.** A `StaticVector<T, N>` or a ring buffer with its storage as a member, built with the placement `new` of lesson 06. No allocator, capacity known at compile time, a defined result when full.
- **Pools.** A fixed array of message objects handed out and returned, so the maximum in flight is a constant you chose.
- **Arenas.** A block of memory reserved once and handed out by bumping a pointer, reset at a known point — typically the top of each control cycle.

The arena is worth showing, because it is three lines and it is the thing the benchmark above found immeasurably fast:

```cpp
class Arena {
public:
    Arena(unsigned char* base, std::size_t cap) : base_(base), cap_(cap) {}
    void* allocate(std::size_t n, std::size_t align) {
        std::size_t p = (used_ + align - 1) & ~(align - 1);
        if (p + n > cap_) return nullptr;          // defined failure, not UB
        used_ = p + n;
        return base_ + p;
    }
    void reset() { used_ = 0; }
private:
    unsigned char* base_;
    std::size_t cap_;
    std::size_t used_{0};
};

alignas(16) static unsigned char g_arena[1 << 20];   // 1 MiB, reserved once
```

`allocate` rounds `used_` up to the requested alignment — the `(x + a - 1) & ~(a - 1)` idiom works because alignments are powers of two, which lesson 10 explains — checks the capacity, bumps the pointer and returns. Every path is the same handful of instructions, so the worst case is the same as the best case. There is no `free`: the whole arena is released at once by `reset()`.

What you give up is real and you should say so in a review. An arena cannot release an individual object, so it only suits allocations with a common end point, such as everything a single control cycle needs. Capacity is fixed, so exhaustion must be handled — here by returning `nullptr`, which the caller must check. And `allocate` returns raw bytes: constructing objects in them is placement `new`, and destroying them is your explicit call, which means an arena is the wrong tool for types with non-trivial destructors unless you keep a list of what to destroy.

## Check yourself

::: check
A colleague benchmarks `new` in a loop, sees a median of 40 ns, and concludes that heap allocation is fine in the 1 kHz loop because 40 ns is 0.004% of the budget. Give two independent reasons the conclusion does not follow.
:::

::: answer
First, the median is the wrong statistic: a deadline is missed by the worst case, not the typical case, and the same measurement showed a 99.9th percentile roughly five times the median and a maximum four orders of magnitude above it. A loop that meets its deadline 999 times in a thousand fails 86,400 times a day at 1 kHz. Second, the benchmark measures a heap in a state the benchmark itself created — a tight loop of same-sized allocate-and-free, which is the allocator's best case, since the block just freed is in the thread cache and is handed straight back. A real system allocates from many subsystems, in mixed sizes, with lifetimes that overlap, and the state it reaches after a month is not the state a benchmark reaches after a second. The fragmentation measurement is the other half of the answer: even if the timing were acceptable, an allocation that fails with memory still free is not.
:::

::: check
In the fragmentation experiment, 6.98 MiB was free and a request for 5.86 MiB in 4 KiB pieces could not use it. Would the result change if the 1,500 requests had been for 64 bytes each instead?
:::

::: answer
Yes, completely. Sixty-four bytes fits inside a 128-byte hole, so the allocator would satisfy those requests from the existing free list with no new memory from the kernel: free-in-heap would fall by roughly the amount requested and resident memory would stay flat. That is the whole point of the phenomenon — external fragmentation is not a property of the heap alone, it is a relationship between the shape of the free space and the size of the next request. It is also why the failure is so hard to predict: the same heap is fine for one request pattern and hopeless for another, and which pattern arrives depends on what the vehicle is doing.
:::

::: check
The arena's `allocate` computes `(used_ + align - 1) & ~(align - 1)`. What does that do, what does it assume, and what should happen if the assumption is violated?
:::

::: answer
It rounds `used_` up to the next multiple of `align`. Adding `align - 1` pushes any value that is not already a multiple up past the next one, and the mask `~(align - 1)` clears the low bits, which discards the remainder. It assumes `align` is a power of two, because only then is `align - 1` a mask of exactly the low bits; for `align = 24` the expression produces nonsense. The assumption is safe in practice because the language guarantees every alignment is a power of two, but the defensive form in a real arena is `static_assert` where the alignment is a compile-time constant, or an `assert((align & (align - 1)) == 0)` where it is not. Getting it wrong would return a misaligned pointer, and constructing an object there is undefined behaviour — lesson 10 shows what that costs.
:::

::: check
Why is "the empty timed region also had a 58 µs maximum" the most important line in the timing table?
:::

::: answer
Because it invalidates the naive reading of the other two maxima. If a region containing no work at all can take 58 µs, then the 32 µs maximum measured around `new` is not evidence about `new`: both are dominated by the operating system taking the CPU away mid-measurement. Without that control row you would report "allocation can take 32 µs" and be wrong about why. With it, the honest statement is that the allocator's own worst case is smaller than the noise floor of this experiment and therefore was not measured at all. That is a better argument against using the heap in a real-time loop than a large number would have been: the quantity you need in order to certify the deadline is not obtainable by running the program, so you must either bound it by construction or not use it.
:::

::: check
Your subsystem needs a variable number of contact points each cycle, at most 64, each a 48-byte struct with a trivial destructor. Propose a design with no allocator call in the loop, and state its failure behaviour.
:::

::: answer
Give the subsystem a `std::array<Contact, 64>` member plus a `std::size_t count_`, filled from index 0 each cycle, and hand the used portion out as `std::span<const Contact>{points_.data(), count_}`. The storage is part of the subsystem object, so it is allocated once when that object is constructed during initialisation; the per-cycle cost is writing the structs, with no allocator involved and no per-cycle construction at all since `Contact` is trivial. The failure behaviour is defined and must be chosen deliberately: when a 65th contact is offered, either drop it and increment a counter that goes into telemetry, or replace the lowest-quality contact already held. Either is acceptable; silently writing a 65th element is not. The `std::array` approach costs 3,072 bytes of the subsystem's storage whether or not they are used, which is the trade you are making — fixed, known memory in exchange for a bounded cycle.
:::

## Summary

| Fact | Detail |
| --- | --- |
| allocator | a program with free lists, size classes, a per-thread cache, arenas with locks, and a path to the kernel |
| timing floor | two `steady_clock::now()` calls cost 26 ns at the median on this machine |
| `new double[n]` | about 14 ns above the floor at the median, about 137 ns above it at p99.9 |
| maximum | 18 to 98 µs for *every* row including the empty one: operating-system noise, not allocator work |
| consequence | the allocator's worst case cannot be established by measurement on a general-purpose OS |
| external fragmentation | free bytes that no single request can use; 6.98 MiB free, a 4 KiB request still grew the process |
| failure mode | allocation fails with memory still free, at a time that depends on mission history |
| 1 kHz for a year | $3.15 \times 10^{10}$ cycles, so a one-in-a-billion event happens about 32 times |
| arena / bump allocator | align, bounds-check, bump; same cost every call; no individual free |
| flight practice | allocate at initialisation; fixed-capacity containers, pools and arenas afterwards |

Lesson 08 takes the other half of the heap's reputation: the five ways a program can use memory it does not own, what the standard says about each, and why "it worked" is not evidence.
