---
id: l07-the-heap
title: The heap: what the allocator does, how long it takes, and how it fragments
minutes: 21
covers:
  - 'The heap: fragmentation, non-deterministic allocation time, allocator behavior'
---

Picture a busy parking garage with no assigned spots. Most days you drive in and find a space in seconds. Some days you circle for ten minutes. And now and then the garage has plenty of empty space in total, but it is all single gaps between parked cars, and your trailer will not fit in any of them. How long parking takes, and whether it works at all, depends on everyone who parked before you.

That garage is the **heap** — the pool of memory a program hands out on request while it runs. When you write `new`, it looks like a piece of the language. It is really a function call into a program you did not write, the **[[allocator|who-wrote-malloc]]**: the code that keeps track of which parts of the heap are in use, searches for a free piece on every request, and updates its records on every release.

The allocator is good software, and on a laptop it is nearly free. It is also the most common reason a piece of C++ cannot run in a hard real-time loop — the kind of loop on a rocket that must finish its work every millisecond, every time. Flight-software rules give two reasons: the time is not bounded, and the heap fragments. Neither is obvious, so this lesson measures both, then builds what flight code uses instead.

Every number below comes from glibc 2.39's allocator on x86-64 Linux, compiled with g++ 13.3.0 at `-O2`. A different allocator gives different numbers. The *shapes* are general.

## What the allocator is doing

A general-purpose allocator has a hard job. It must answer "give me `n` bytes" for any `n`, in any order, forever, without knowing what will be asked next. To manage that, it keeps free memory in lists sorted by size, and every request is a search. glibc's design is typical:

- **[[Free lists|free-lists]] by size.** Small free blocks sit on one list per size, so an exact fit is found at once. Larger free blocks sit on sorted lists that must be scanned for one big enough. The best fit may be split, and the leftover piece goes back on a list.
- **A per-thread cache.** The fastest path skips all of that and takes a block from a small cache that belongs to the calling thread. That costs a few instructions. Whether you get it depends on what that thread freed recently.
- **Arenas and locks.** When several threads allocate at once, the allocator steers them to separate **arenas** — separate sub-heaps. An arena is still shared, so it is protected by a **lock**, a flag that lets only one thread in at a time. A thread that finds the lock taken waits for as long as the holder takes.
- **Asking the kernel.** When nothing fits, the allocator grows the heap or maps fresh pages from the operating system. That is a **[[system call|system-call]]** — a trip into the kernel — and it costs microseconds rather than nanoseconds.

Every one of those paths is correct. The trouble is that *which one you get* depends on everything the program has allocated and freed since it started. And a deadline only cares about the slowest.

## The time a request takes is a spread

::: example Three things timed in one program
The benchmark times 200,000 of each of three things: an empty region between two clock reads, a bump allocation from a block reserved in advance (the arena you will build at the end of this lesson), and `new double[n]` followed by `delete[]`. The size `n` comes from the same pseudo-random sequence in both allocating cases: 16 to 4111 doubles, so 128 bytes to about 32 KiB.

```cpp
auto t0 = Clock::now();
double* p = new double[n];
auto t1 = Clock::now();
```

One run, `g++ -std=c++20 -O2`, in nanoseconds:

```text
nanoseconds, 200000 samples each
empty timed region   min    26  median    29  p99     31  p99.9      54  max    46710
arena.allocate       min    26  median    29  p99     31  p99.9      60  max    29437
new double[n]        min    38  median    43  p99     62  p99.9     161  max    25209
```

The columns are **[[percentiles|percentiles]]**. The median is the middle sample. "p99" is the time that 99% of samples beat, and "p99.9" the time that 999 in 1000 beat.

**Step 1: read the first row first.** Two calls to `steady_clock::now()` with *nothing between them* take 29 ns at the median. That is the cost of the stopwatch itself. Every other row sits on top of it.

**Step 2: compare the arena to that floor.** Same minimum, same median. A bump allocation is an add, a mask, a compare and a store — too little work for this stopwatch to see.

**Step 3: compare `new` to the floor.** Its median is $43 - 29 = 14$ ns above the floor. Its p99.9 is 161 ns, nearly four times its own median. Over three runs the medians barely moved (42 to 43 ns), while the heap's p99.9 wandered between 161 and 218 ns.

**Step 4: now the column that matters, the maximum.** The *empty* region's worst sample was 46,710 ns — about 47 µs. The heap's was 25 µs. In another run the empty region's worst was 1.8 ms. An empty region cannot contain 47 µs of work, let alone 1.8 ms. Those maxima are the operating system **[[pausing this program|preemption]]** mid-measurement to run something else.

That is the finding, and it is stronger than the one the benchmark set out to make. **On a general-purpose operating system you cannot measure the allocator's worst case, because something else always gets in the way first.** The median and the percentiles look fine. The one number you would need to promise a deadline is the one measurement cannot give you.
:::

On a **[[real-time operating system|rtos]]** the scheduling noise goes away. What is left is the allocator's own worst case. That depends on the heap's history, not on the call in front of you, so a test run still cannot establish it.

::: warning Do not quote these nanoseconds as "the cost of new"
They are one allocator, one machine, one size mix, one thread, at `-O2`, with a stopwatch that costs 29 ns to read. Quote the *shape*: a fast median, a tail several times higher, and a maximum you cannot bound by running the program. If you need numbers for your own target, measure there.
:::

## Fragmentation

The second argument is not about time at all. A heap can reach a state where the free memory exists but is the wrong shape. That is **fragmentation**: free space broken into pieces too small to use.

Think of a bookshelf where every other book has been removed. Half the shelf is empty. But each gap is one book wide, so a box set that needs a long stretch of shelf cannot go anywhere.

::: example 7 MiB free, and a 4 KiB request still grows the program
The program allocates 100,000 blocks of 128 bytes. Then it frees every other one. Then it allocates 1,500 blocks of 4,096 bytes. After each step it prints three numbers: bytes in use (`live`) and free space inside the heap (`free-in-heap`), both from glibc's `mallinfo2()`, and the memory the program actually holds from the operating system, its **resident set size** (`rss`), read from `/proc/self/statm`. ([[MiB|mib]] is 1,048,576 bytes.)

```text
after 100k x 128 B         live  13.82 MiB   free-in-heap   0.11 MiB   rss  17.98 MiB
after freeing every other  live   6.96 MiB   free-in-heap   6.97 MiB   rss  18.17 MiB
after 1500 x 4096 B        live  12.84 MiB   free-in-heap   6.89 MiB   rss  24.06 MiB
```

**Line two** is a heap holding **6.97 MiB of free space**.

**Line three** asks for $1500 \times 4096 = 6\,144\,000$ bytes, which is $6\,144\,000 / 1\,048\,576 = 5.86$ MiB. That is comfortably less than what is free.

It did not use the free space. Free-in-heap fell by only $6.97 - 6.89 = 0.08$ MiB. Meanwhile resident memory rose from 18.17 to 24.06 MiB, an increase of 5.89 MiB — almost exactly the amount requested. The allocator went to the kernel for fresh memory for nearly every one of those 1,500 blocks.

Here is why. Freeing 50,000 blocks raised free-in-heap by $6.97 - 0.11 = 6.86$ MiB. Divide by the number of blocks:

$$
\frac{6.86 \times 1\,048\,576}{50\,000} \approx 144 \ \text{bytes per freed block}
$$

That is the 128 bytes asked for plus the allocator's own bookkeeping for each block. So the free space is **50,000 separate holes of 144 bytes**. Each hole is walled in by a block that is still live, so no two holes can merge. Not one can hold 4,096 bytes. This is **[[external fragmentation|external-fragmentation]]**: free bytes that no single request can use.

Sanity check: `live` fell by $13.82 - 6.96 = 6.86$ MiB when the blocks were freed, the same amount free-in-heap rose. The bookkeeping adds up. (The first two columns repeat exactly from run to run; `rss` moves by a few hundredths of a MiB.)
:::

Real software does not repeat its requests like this toy, which makes things worse, not better. The state a real heap reaches depends on the exact order of requests over the whole mission, so it cannot be reproduced in a test or predicted in advance.

Two consequences follow, and you should be able to state both.

**An allocation can fail with memory still available.** After hours or months of normal running, a request that worked a thousand times fails with `std::bad_alloc` (or a null pointer from `malloc`). The free space has been ground into pieces smaller than the request. Nothing in the code changed. When it fails depends on what the vehicle has been doing.

**There is nowhere to put the failure.** A control loop that cannot get its working buffer this cycle has no good response. It cannot wait, it cannot ask the operator, and it cannot skip the cycle.

::: key
Why is `new` banned after initialization in flight software? Allocation time is not bounded (the allocator may search free lists or take a lock), and long-running allocation and release fragments the heap so a later request can fail with memory still available. Both are unacceptable when a deadline must be met every cycle for years. These are the two independent reasons: determinism and fragmentation. Average speed is not one of them.
:::

## How long is a long time?

A loop that runs at 1 kHz — a thousand times a second — has 1 ms, or 1,000,000 ns, to read sensors, run the filter and the control law, write actuator commands, and leave margin. A 43 ns allocation is nothing. Even a 30 µs stall is only 3% of the budget.

The problem is how quickly rare things become certain. A 1 kHz loop runs

$$
1000 \times 86\,400 \times 365 = 3.15 \times 10^{10}
$$

cycles in a year: a thousand per second, times 86,400 seconds in a day, times 365 days. Now take an event with a chance of $10^{-9}$ per cycle, one in a billion. No test campaign will ever see it. Over that year it happens

$$
3.15 \times 10^{10} \times 10^{-9} \approx 32 \ \text{times.}
$$

If that event is a missed control deadline, you get 32 of them a year, at times nobody can predict, on a vehicle. That is why flight software is analyzed by worst cases, not percentiles. And it is why a part whose worst case cannot be established is left out on principle, not on measurement.

## What flight code does instead

Allocate everything during initialization, before the loop starts, and then never call the allocator again. In practice that means three tools:

- **Fixed-capacity containers.** A `StaticVector<T, N>` or a ring buffer that keeps its storage as a member, built with the placement `new` of lesson 06. No allocator, capacity known at compile time, and a defined answer when it is full.
- **Pools.** A fixed array of, say, message objects, handed out and returned. The most that can be in use at once is a number you chose.
- **Arenas.** A block of memory reserved once and handed out by moving a pointer forward, then reset all at once at a known point — typically the top of each control cycle.

The arena is worth seeing in full. It is the thing the benchmark found too fast to measure:

```cpp
#include <cstddef>

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

Walk through `allocate`. Picture a notepad where you always write on the next blank line. `used_` is how far down the page you have written.

1. **Round up.** `(used_ + align - 1) & ~(align - 1)` moves `used_` forward to the next multiple of `align`. Read `&` as "bitwise and" and `~` as "bitwise not" (flip every bit). The trick works because alignments are always **[[powers of two|power-of-two-mask]]**, which lesson 10 explains.
2. **Check capacity.** If the request would run past the end, return `nullptr`. That is a defined failure the caller can test for.
3. **Bump.** Move `used_` past the new block and return its address.

Every call follows the same few instructions, so the worst case equals the best case. This is called a **[[bump allocator|bump-allocator]]**. There is no `free`. The whole arena is released at once by `reset()`.

What you give up is real, and you should say so in a code review:

- An arena cannot release one object. It only suits allocations that all end together, such as everything one control cycle needs.
- Capacity is fixed, so running out must be handled. Here `allocate` returns `nullptr`, and the caller must check.
- `allocate` returns raw bytes. Building an object in them is placement `new`, and destroying it is your explicit call. So an arena is the wrong tool for types with non-trivial destructors, unless you keep a list of what to destroy.

::: warning A benchmark of new in a tight loop flatters the heap
Allocating and freeing the same size over and over is the allocator's best case: the block you freed a moment ago sits in the thread cache and comes straight back. A real system allocates from many places, in mixed sizes, with lifetimes that overlap. The heap it has after a month looks nothing like the heap a benchmark has after a second.
:::

## Check yourself

::: check
A colleague times `new` in a loop, sees a median of 40 ns, and concludes heap allocation is fine in the 1 kHz loop because 40 ns is 0.004% of the budget. Give two independent reasons the conclusion does not follow.
:::

::: answer
First, the median is the wrong statistic. A deadline is missed by the worst case, not the typical case. The same kind of measurement showed a p99.9 about four times the median and a maximum roughly 600 times the median ($25\,209 / 43 \approx 586$) — and even that maximum was operating-system noise, not a bound. A loop that meets its deadline 999 times in 1000 misses it $1000 \times 86\,400 / 1000 = 86\,400$ times a day at 1 kHz.

Second, the benchmark measures a heap in a state the benchmark made: a tight loop of allocate-and-free, the allocator's best case, since the block freed a moment ago is handed straight back from the thread cache. A real system reaches a very different state after a month.

And the fragmentation result is a separate reason entirely: even if the time were fine, an allocation that fails with memory still free is not.
:::

::: check
In the fragmentation experiment, 6.97 MiB was free and 5.86 MiB of 4 KiB requests could not use it. Would the result change if the 1,500 requests had been for 64 bytes each?
:::

::: answer
Yes, completely. Sixty-four bytes fits inside a 144-byte hole. The allocator would fill those requests from the existing free lists, with no new memory from the kernel. Free-in-heap would fall by about the amount requested, and resident memory would stay flat.

That is the heart of fragmentation. It is not a property of the heap alone, but a relationship between the shape of the free space and the size of the *next* request. The same heap is fine for one pattern and hopeless for another, and which pattern arrives depends on what the vehicle is doing.
:::

::: check
The arena's `allocate` computes `(used_ + align - 1) & ~(align - 1)`. Work it out for `used_ = 13` and `align = 8`. What does it assume, and how would you guard that assumption?
:::

::: answer
Step by step: $13 + 8 - 1 = 20$. In binary, $20$ is `10100` and $8 - 1 = 7$ is `00111`, so `~7` ends in `...11000`. Then `10100 & ...11000` is `10000`, which is 16. So 13 rounds up to 16, the next multiple of 8.

Adding `align - 1` pushes any value that is not already a multiple past the next one. The mask clears the low bits, which throws away the remainder. (Check with `used_ = 16`: $16 + 7 = 23$ is `10111`, masked to `10000` = 16. An already aligned value stays put.)

It assumes `align` is a power of two, because only then is `align - 1` a run of low one-bits. For `align = 24` it produces nonsense. The language guarantees every alignment is a power of two, but a careful arena still checks: a `static_assert` when the alignment is known at compile time, or `assert((align & (align - 1)) == 0)` when it is not. Getting it wrong returns a misaligned pointer, and building an object there is undefined behavior.
:::

::: check
Why is "the empty timed region had the biggest maximum" the most important line in the timing table?
:::

::: answer
Because it changes what the other maxima mean. If a region with no work in it can take 47 µs, then the 25 µs worst case measured around `new` is not evidence about `new`. Both are dominated by the operating system taking the CPU away in the middle of a measurement.

Without that control row you would report "allocation can take 25 µs" and be wrong about why. With it, the honest statement is that the allocator's own worst case is hidden under the noise, so it was not measured at all. The number you need to certify the deadline cannot be found by running the program, so you must bound it by design or not use it.
:::

::: check
Your subsystem needs a varying number of contact points each cycle, at most 64, each a 48-byte struct with a trivial destructor. Propose a design with no allocator call in the loop, and say what happens when a 65th contact arrives.
:::

::: answer
Give the subsystem a `std::array<Contact, 64>` member and a `std::size_t count_`. Fill it from index 0 each cycle, and hand out the used part as `std::span<const Contact>{points_.data(), count_}`.

The storage is part of the subsystem object, so it is created once, when that object is built during initialization. Each cycle only writes structs; there is no allocator involved, and since `Contact` is trivial there is no per-cycle construction either.

The full case must be chosen on purpose. When a 65th contact is offered, either drop it and increment a counter that goes into telemetry, or replace the lowest-quality contact already held. Either is fine. Silently writing a 65th element is not.

The cost is $64 \times 48 = 3072$ bytes of storage, used or not. That is the trade: fixed, known memory in exchange for a bounded cycle.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| allocator | a program with size-sorted free lists, a per-thread cache, arenas with locks, and a path to the kernel |
| timing floor | two `steady_clock::now()` calls cost 29 ns at the median on this machine |
| `new double[n]` | about 14 ns above the floor at the median; p99.9 about four times its median |
| maximum | tens of µs (once 1.8 ms) for *every* row, the empty one included: operating-system noise |
| consequence | the allocator's worst case cannot be established by measurement on a general-purpose OS |
| external fragmentation | free bytes no single request can use: 6.97 MiB free as 144-byte holes, and 4 KiB requests grew the program |
| failure mode | an allocation fails with memory still free, at a time set by mission history |
| 1 kHz for a year | $3.15 \times 10^{10}$ cycles, so a one-in-a-billion event happens about 32 times |
| arena (bump allocator) | round up, check, bump; same cost every call; no single free, only `reset()` |
| flight practice | allocate at initialization; fixed-capacity containers, pools and arenas afterwards |

The next lesson turns to the other half of the heap's reputation: five ways a program can use memory it does not own, what the language says about each, and why "it worked when I ran it" is not evidence.

::: context who-wrote-malloc The allocator is somebody else's program
On Linux, `new` ends up calling `malloc` in the C library, glibc. glibc's allocator is known as **ptmalloc**, and it grew out of Doug Lea's classic **dlmalloc**, extended to work well with many threads.

Other allocators exist and make different trade-offs: jemalloc (used by FreeBSD), tcmalloc (from Google), mimalloc (from Microsoft). You can swap one in without changing your code. That is exactly why this lesson's numbers belong to one allocator only — swap it and every row of the timing table changes, though the shape does not.
:::

::: context free-lists Bins of free blocks
A free list is a chain of free blocks, each one holding the address of the next. The allocator keeps many chains, sorted by size, so it can go straight to the right one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="32">32 B</text>
    <text x="10" y="72">64 B</text>
    <text x="10" y="112">large</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="60" y="18" width="40" height="20" fill="#8fb8f0"/>
    <rect x="130" y="18" width="40" height="20" fill="#8fb8f0"/>
    <rect x="200" y="18" width="40" height="20" fill="#8fb8f0"/>
    <rect x="60" y="58" width="70" height="20" fill="#8fb8f0"/>
    <rect x="60" y="98" width="110" height="20" fill="#f2b880"/>
    <rect x="200" y="98" width="140" height="20" fill="#f2b880"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <path d="M100 28 H126"/><path d="M170 28 H196"/><path d="M170 108 H196"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="130,28 122,24 122,32"/><polygon points="200,28 192,24 192,32"/><polygon points="200,108 192,104 192,112"/>
  </g>
  <text x="10" y="142" font-size="11" fill="#6c7a93">small sizes: take the first block. large: scan for one big enough, maybe split it.</text>
</svg>
```

The exact-size lists make small requests fast. The large list is where the search time — and its variation — comes from.
:::

::: context system-call A trip into the kernel
Your program runs in **user mode**, where it cannot touch hardware or other programs' memory. Only the operating system's core, the **kernel**, can hand out new memory pages. A **system call** is the doorway: the program stops, the CPU switches into kernel mode, the kernel does the work, and control comes back.

On Linux, growing the heap uses `brk` or `mmap`. Each crossing costs far more than an ordinary function call, and the first time the program touches each new 4 KiB page there is a further cost, a **page fault**, while the kernel attaches real memory to it.
:::

::: context percentiles Reading p99 and p99.9
Sort all 200,000 timings from fastest to slowest. The **median** is the one in the middle. **p99** is the one 99% of the way along: only 1 sample in 100 was slower. **p99.9** is 99.9% of the way along: only 1 in 1000 was slower, so 200 samples here.

For a web page, p99 is often what engineers watch. For a control loop that runs 86.4 million times a day, even p99.9 leaves 86,400 slower cycles every day, so only the true maximum really matters.
:::

::: context preemption Why an empty region can take a millisecond
A desktop operating system shares each CPU core among many programs. Every few milliseconds, or whenever something more urgent turns up, the **scheduler** can pause your program and run another one. Your program cannot tell — except that the clock has jumped.

That is **preemption**. If it lands between `t0` and `t1`, the measured time includes however long your program sat waiting. That is how two back-to-back clock reads came out 1.8 ms apart in one run.
:::

::: context rtos Real-time operating systems
A **real-time operating system** (RTOS) is built so the highest-priority ready task always runs, and the time to switch tasks has a known upper bound. That makes worst cases something you can analyze.

Spacecraft use them widely. NASA's Mars rovers Spirit, Opportunity and Curiosity run Wind River's VxWorks, and the open-source RTEMS flies on many science missions. Even there, flight rules still ban heap allocation after start-up, because the allocator's worst case depends on the heap's history, and no scheduler fixes that.
:::

::: context mib MiB versus MB
Computer memory comes in powers of two, so engineers use binary units. One **KiB** (kibibyte) is $2^{10} = 1024$ bytes. One **MiB** (mebibyte) is $2^{20} = 1\,048\,576$ bytes. The plain **MB** (megabyte) is exactly $10^6$ bytes.

The gap is about 5% at this size, so 6,144,000 bytes is 6.14 MB but only 5.86 MiB. Mixing the two up is a classic way to be 5% wrong on a memory budget.
:::

::: context external-fragmentation The picture of a fragmented heap
Live blocks (blue) alternate with free holes (white). Plenty of free space in total, but no hole is big enough for the orange request.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="40" y="30" width="30" height="30" fill="#fff"/>
    <rect x="70" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="100" y="30" width="30" height="30" fill="#fff"/>
    <rect x="130" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="160" y="30" width="30" height="30" fill="#fff"/>
    <rect x="190" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="220" y="30" width="30" height="30" fill="#fff"/>
    <rect x="250" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="280" y="30" width="30" height="30" fill="#fff"/>
    <rect x="310" y="30" width="30" height="30" fill="#8fb8f0"/>
  </g>
  <text x="10" y="20" font-size="12" fill="#1f2a44">heap: live 144 B blocks with 144 B holes between them</text>
  <rect x="10" y="80" width="200" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="96" font-size="12" text-anchor="middle" fill="#1f2a44">4096 B request</text>
  <text x="220" y="96" font-size="12" fill="#b4232c">fits in no hole</text>
</svg>
```

The opposite, **internal fragmentation**, is space wasted *inside* a block — like the 16 extra bytes (bookkeeping plus rounding) that each 128-byte request carried here.
:::

::: context power-of-two-mask Why the mask trick needs a power of two
A power of two in binary is a single 1 followed by zeros: 8 is `1000`. Subtract one and you get all ones below it: 7 is `0111`. Flip that with `~` and you get a mask that keeps every bit from the 8s place up and clears the three low bits.

Clearing the low bits of a number rounds it *down* to a multiple of 8. Adding 7 first turns that into rounding *up*. For 24 (`11000`), 23 is `10111` — not a clean run of low ones — so the trick breaks. Lesson 10 shows why the hardware wants these alignments in the first place.
:::

::: context bump-allocator A pointer that only moves forward
An arena is one long block with a marker. Each request moves the marker forward (after rounding up to the alignment). `reset()` moves it back to the start.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="340" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="40" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="70" y="40" width="6" height="30" fill="#6c7a93"/>
  <rect x="76" y="40" width="90" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="166" y="40" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">A</text>
  <text x="121" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">B</text>
  <text x="186" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">C</text>
  <line x1="206" y1="30" x2="206" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="206" y="22" font-size="12" text-anchor="middle" fill="#b4232c">used_</text>
  <text x="73" y="95" font-size="11" text-anchor="middle" fill="#6c7a93">padding</text>
  <text x="280" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">free</text>
  <text x="10" y="112" font-size="11" fill="#1f2a44">no search, no lists: the cost is the same every call</text>
</svg>
```

The gray sliver is padding from rounding up, so block B starts on its alignment.
:::
