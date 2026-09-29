---
id: l06-atomics-and-memory-orderings
title: Atomics and memory orderings
minutes: 23
covers:
  - "std::atomic and memory orderings: relaxed, acquire/release, seq_cst"
---

A country mailbox in the United States has a little red flag on its side. You put a letter inside, close the door, and *then* raise the flag. The mail carrier sees the flag from the road, stops, and takes the letter. The flag is tiny, but the whole system depends on one rule about order: the letter goes in *before* the flag goes up. A flag raised over an empty box sends the carrier away with nothing.

Earlier lessons protected shared data with a mutex. For one small value — a frame counter, a "new data" flag — a mutex is heavy. C++ offers a lighter tool: **`std::atomic<T>`**, read "atomic of T", a variable whose individual operations no other thread can ever see half-done.

Atomics bring a second question that mutexes hid: *in what order do other threads see my writes?* That is the mailbox flag. This lesson covers the atomic operations, then the three orderings — **relaxed**, **acquire/release** and **sequentially consistent** — what each guarantees, where each belongs, and what each costs on x86.

## std::atomic: operations that cannot be cut in half

Lesson 2 showed that `++count` on a plain `int` from two threads is a data race: read, add, write back, interleaved. An **[[atomic|atomic-word]]** operation is one indivisible step: every other thread sees it either not started or finished, never in between. Two threads doing atomic operations on the same `std::atomic` object never make a data race.

The operations you need, on `std::atomic<int> a`:

| Operation | What it does | Returns |
|---|---|---|
| `a.load()` | read the value | the value |
| `a.store(v)` | write `v` | nothing |
| `a.fetch_add(n)` | add `n` in one step (also `fetch_sub`, `fetch_and`, `fetch_or`) | the value *before* |
| `a.exchange(v)` | write `v` in one step | the value *before* |
| `a.compare_exchange_weak(e, d)` | if `a == e`, write `d`; otherwise copy `a` into `e` | `true` if it wrote |

The last three are **read-modify-write** operations: read, change and write in one step. The operators `++a`, `a += 5` and `a = 3` are atomic too.

`exchange` is handy for "only the first one": if four threads may detect the same fault, each does `if (!fault_reported.exchange(true)) send_report();`, and exactly one gets `false` back. A four-thread test of that pattern prints `threads that sent the fault report: 1`.

### Compare-and-exchange

**Compare-and-exchange** (CAS, "compare and swap") says: "if `a` still holds `expected`, replace it with `desired` and return `true`. If not, put the current value into `expected` and return `false`." That builds any update as a loop: compute the new value, try to install it, and if another thread got in first, recompute from the fresh value and retry. Two versions:

- **`compare_exchange_weak`** may fail even when `a == expected`, a **[[spurious failure|weak-cas-why]]**, on processors whose hardware builds CAS from two instructions. In a retry loop that costs nothing, and there the weak form can be faster.
- **`compare_exchange_strong`** fails only if the value really differed. Use it when you are *not* looping — one attempt, and a failure must mean "someone else changed it".

On x86 both compile to the same single instruction, `lock cmpxchg`.

::: example A frame counter and a peak detector
Four worker threads each process a million fake accelerometer frames. They count frames with `fetch_add`, and track the largest reading seen, in milli-g, with a compare-and-exchange loop.

```cpp
#include <atomic>
#include <cstdio>
#include <thread>
#include <vector>

std::atomic<long> frames_seen{0};   // a statistics counter
std::atomic<int>  peak_mg{0};       // the largest acceleration seen, milli-g

// Raise peak_mg to v if v is larger. Retries if another thread got there first.
void update_peak(int v) {
    int seen = peak_mg.load(std::memory_order_relaxed);
    while (v > seen &&
           !peak_mg.compare_exchange_weak(seen, v, std::memory_order_relaxed)) {
        // On failure, compare_exchange_weak has put the current value in 'seen'.
    }
}

int main() {
    std::vector<std::jthread> workers;
    for (int t = 0; t < 4; ++t) {
        workers.emplace_back([t] {
            for (int i = 0; i < 1'000'000; ++i) {
                frames_seen.fetch_add(1, std::memory_order_relaxed);
                update_peak((i * 7 + t * 13) % 30'011);   // fake readings
            }
        });
    }
    workers.clear();   // each jthread joins as it is destroyed

    std::printf("frames_seen = %ld\n", frames_seen.load());
    std::printf("peak_mg     = %d\n", peak_mg.load());
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` it prints, and the ThreadSanitizer build prints the same with no report:

```text
frames_seen = 4000000
peak_mg     = 30010
```

Walking through `update_peak`:

1. Read the current peak into `seen`.
2. If `v` is not bigger, stop: nothing to do.
3. Otherwise try to swap `seen` for `v`. If the peak is still `seen`, the swap happens and the loop ends.
4. If another thread raised the peak meanwhile, the swap fails and `seen` now holds the newer peak. Back to step 2.

Sanity check: 4 × 1,000,000 = 4,000,000, so no increment was lost. The readings are $(7i + 13t) \bmod 30{,}011$, at most 30,010, and a python3 check confirms 30,010 occurs.
:::

::: key
`std::atomic<T>` operations are indivisible: `load`, `store`, `fetch_add` (returns the old value), `exchange` (returns the old value), and `compare_exchange_weak/strong(expected, desired)`, which writes only if the value equals `expected` and otherwise loads the current value into `expected`. The weak form may fail spuriously, so use it in a loop; use strong for a single attempt.
:::

## Why order is a separate question

An atomic makes *one* variable safe. But a navigation task writes a whole `NavSolution` struct, then sets an atomic flag `nav_ready`. The consumer waits for the flag, then reads the struct, which is not atomic. What stops it seeing the flag up and the struct half-written?

Two things reorder memory operations, both to make single-threaded code faster:

- **The compiler** may move a store later or a load earlier, as long as *this* thread cannot tell the difference.
- **The processor** runs instructions out of order and holds stores in a small queue, the **[[store buffer|store-buffer-picture]]**, before they reach memory that other cores can see.

One thread never notices, since it always sees its own writes in program order. Another thread can. So every atomic operation takes an optional **memory order** argument saying how much ordering it enforces on the memory around it: `std::memory_order_relaxed`, `std::memory_order_acquire`, `std::memory_order_release`, `std::memory_order_acq_rel` and `std::memory_order_seq_cst`. (There is also `memory_order_consume`; it is **[[discouraged|consume-note]]**, and compilers treat it as acquire.) If you leave the argument out, you get `seq_cst`.

## Relaxed: atomic, and nothing more

`std::memory_order_relaxed` gives you exactly two things:

1. **Atomicity.** The operation itself is indivisible, so a relaxed `fetch_add` never loses an increment.
2. **One modification order for that variable.** All threads agree on the order in which that one variable's values happened. If a counter went 5, 6, 7, no thread sees 7 and then 6.

It gives no ordering with respect to *any other memory*: writes before a relaxed store may become visible after it. Perfect for `frames_seen`, where nobody reads other data because of its value; wrong for a flag that publishes data.

::: key What relaxed gives you
`memory_order_relaxed` gives atomicity of the operation itself and a single modification order for that variable, but no ordering with respect to any other memory. It is right for a statistics counter and wrong for publishing data.
:::

## Acquire and release: publishing data through a flag

Back to the mailbox: letter before flag for the producer, flag before looking for the consumer. That pair of promises is release and acquire:

- A **release store** — `flag.store(true, std::memory_order_release)` — keeps every read and write that comes *before* it in the producer's code from moving *after* it. The letter goes in before the flag goes up.
- An **acquire load** — `flag.load(std::memory_order_acquire)` — keeps every read and write that comes *after* it in the consumer's code from moving *before* it. You look in the box after seeing the flag.

Each is a **[[one-way barrier|one-way-barrier]]**: it blocks movement in one direction only.

Put them together and you get the guarantee: if an acquire load reads the value written by a release store, then *everything the producer did before the store is visible to the consumer after the load*. This **message-passing** pattern is how nearly every lock-free handoff in flight software works, including the ring buffer of lesson 9.

::: key What acquire guarantees
If an acquire load reads a value written by a release store, then everything the writing thread did before that store is visible to the reading thread after the load. Acquire is a one-way barrier: later reads and writes cannot move above it. Release is the mirror: earlier reads and writes cannot move below it. The pair must be on the *same* atomic variable.
:::

::: example Publishing a navigation solution
```cpp
#include <atomic>
#include <cstdio>
#include <thread>

struct NavSolution {
    double position_m[3];
    double velocity_mps[3];
    long   time_us;
};

NavSolution nav;                    // plain data, not atomic
std::atomic<bool> nav_ready{false}; // the flag that publishes it

int main() {
    std::thread producer([] {
        nav = {{6'771'000.0, 0.0, 0.0}, {0.0, 7'672.0, 0.0}, 1'000'000};
        nav_ready.store(true, std::memory_order_release);        // publish
    });
    std::thread consumer([] {
        while (!nav_ready.load(std::memory_order_acquire)) { }   // wait for the flag
        std::printf("r = %.0f m, v = %.0f m/s, t = %ld us\n",
                    nav.position_m[0], nav.velocity_mps[1], nav.time_us);
    });
    producer.join();
    consumer.join();
}
```

Built normally, and built with `-fsanitize=thread`, it prints the same line, and TSan reports nothing:

```text
r = 6771000 m, v = 7672 m/s, t = 1000000 us
```

Step by step:

1. The producer fills in `nav`: a position of 6,771,000 m from Earth's center (about 400 km up, a space-station orbit) and a speed of 7,672 m/s.
2. It stores `true` into `nav_ready` with release, so every write to `nav` above is visible no later than the flag.
3. The consumer spins until its acquire load reads that `true`. The pair is complete, so it sees all of `nav`, and its plain reads are not a data race.

Now change both orderings to `std::memory_order_relaxed` and rebuild. On this x86 machine the ordinary build *still prints the right line*. The TSan build prints it too, and then:

```text
WARNING: ThreadSanitizer: data race
  Read of size 8 at 0x5559fde6f090 by thread T2:
    #0 operator() publish.cpp:21
  Previous write of size 8 at 0x5559fde6f090 by thread T1:
    #0 operator() publish.cpp:16
  Location is global 'nav' of size 56 at 0x5559fde6f060
...
ThreadSanitizer: reported 3 warnings
```

Three reports, one for each field the consumer reads (lines 16 and 21 are the write of `nav` and the `printf` that reads it).

Sanity check: 6,771,000 − 6,371,000 m (Earth's radius) is 400 km, and circular orbital speed there is $\sqrt{\mu/r} \approx 7{,}673$ m/s (with Earth's $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$), so the numbers are sensible and arrived intact both times. The relaxed version is still a data race: x86 and the compiler happened not to reorder, and the language promised neither.
:::

::: warning "It prints the right answer" is not evidence
On x86, relaxed message passing usually works because the hardware keeps stores in order. On ARM, which is weaker ordered, the flag can arrive before the data, and on any processor the optimizer may move plain writes past a relaxed store. A million passing runs prove only that you have not met the reordering yet. ThreadSanitizer checks the rules, not the lucky outcome.
:::

::: warning Getting the pair wrong
Release belongs on the *store* that publishes; acquire belongs on the *load* that receives. `store(v, memory_order_acquire)` and `load(memory_order_release)` are not "the other way round": they are not allowed at all, and the behavior is undefined. And `volatile` is no substitute. In C++, `volatile` tells the compiler to perform every read and write of that variable exactly as written, which is for **[[memory-mapped hardware registers|volatile-for-hardware]]**. It makes nothing atomic and orders nothing between threads, so a `volatile bool` flag is still a data race.
:::

For read-modify-write operations, `std::memory_order_acq_rel` acts as an acquire for what it reads and a release for what it writes. Taking a lock is an acquire and releasing it is a release; that is where the names come from.

## Sequential consistency: the default, and one total order

`std::memory_order_seq_cst`, **sequentially consistent**, is what `a.store(v)` or `a.load()` give with no order named. It includes acquire and release, and adds: *all* `seq_cst` operations, on *all* variables, happen in one order every thread agrees on, consistent with each thread's program order.

That matters when two threads each set their own flag and then check the other's:

```cpp
// x and y start at 0
// Thread A              // Thread B
x.store(1);              y.store(1);
r1 = y.load();           r2 = x.load();
```

Can both `r1` and `r2` end up 0? In one total order, whichever store comes first, the other thread's load comes after it and sees 1. So under `seq_cst`, $r_1 = r_2 = 0$ is forbidden. With acquire/release it is *allowed*: nothing stops a store being overtaken by a later load of a *different* variable. This is the **store-buffering** pattern, and on x86 it really happens.

::: example Store buffering, caught on x86
Two threads run the pattern above 200,000 times for each choice of ordering, meeting at a `std::barrier` (a C++20 meeting point where threads wait until all have arrived) before and after each trial:

```cpp
#include <atomic>
#include <barrier>
#include <cstdio>
#include <thread>

std::atomic<int> x{0}, y{0};
int r1, r2;

template <std::memory_order Store, std::memory_order Load>
long count_both_zero(int trials) {
    std::barrier sync(2);
    long both_zero = 0;
    std::thread a([&] {
        for (int i = 0; i < trials; ++i) {
            sync.arrive_and_wait();          // start together
            x.store(1, Store);
            r1 = y.load(Load);
            sync.arrive_and_wait();          // both done
        }
    });
    for (int i = 0; i < trials; ++i) {
        sync.arrive_and_wait();
        y.store(1, Store);
        r2 = x.load(Load);
        sync.arrive_and_wait();
        if (r1 == 0 && r2 == 0) ++both_zero;
        x.store(0); y.store(0);              // reset for the next trial
    }
    a.join();
    return both_zero;
}

int main() {
    const int trials = 200'000;
    std::printf("relaxed:          %ld of %d trials had r1 == r2 == 0\n",
        count_both_zero<std::memory_order_relaxed, std::memory_order_relaxed>(trials), trials);
    std::printf("release/acquire:  %ld of %d trials had r1 == r2 == 0\n",
        count_both_zero<std::memory_order_release, std::memory_order_acquire>(trials), trials);
    std::printf("seq_cst:          %ld of %d trials had r1 == r2 == 0\n",
        count_both_zero<std::memory_order_seq_cst, std::memory_order_seq_cst>(trials), trials);
}
```

One run on one machine (a 4-core virtual machine, `nproc` = 4, on an Intel Xeon at 2.1 GHz), built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
relaxed:          105 of 200000 trials had r1 == r2 == 0
release/acquire:  71 of 200000 trials had r1 == r2 == 0
seq_cst:          0 of 200000 trials had r1 == r2 == 0
```

Over five runs the relaxed count ranged from 41 to 1,671 and the release/acquire count from 71 to 520. The `seq_cst` count was 0 every time.

What happened in the non-zero trials:

1. Thread A's store `x = 1` sat in its core's store buffer, invisible to the other core.
2. A's load of `y` ran before it drained, while B's `y = 1` sat in *B's* buffer, so A read 0.
3. The same happened for B. Both read 0.

Sanity check: well under 1% of trials, because both threads must hit a tiny window together. Rare is the dangerous kind. `seq_cst` stays at zero because the compiler emits a different instruction, shown next.
:::

::: key
`memory_order_seq_cst` is the default. It adds one total order over all `seq_cst` operations that every thread agrees on. In the store-buffering test (each thread stores its own flag, then loads the other's), only `seq_cst` forbids $r_1 = r_2 = 0$; relaxed and acquire/release allow it, and x86 really produces it.
:::

## What it costs on x86

x86 processors follow a memory model called **[[total store order|x86-tso]]**. Loads stay in order with earlier loads, and stores stay in order with earlier loads and stores. The one reordering allowed: a later load may go ahead of an earlier store to a different address, while that store sits in the store buffer. That one exception is exactly the store-buffering result.

So on x86, acquire and release are free: the hardware already gives those orders, and the compiler only has to avoid reordering on its own. A `seq_cst` store is the one that costs, because it must stop the store buffer from letting a later load go first. Compile these one-line functions with `g++ -std=c++20 -O2 -S`:

```cpp
#include <atomic>
std::atomic<int> a;
void store_relaxed(int v) { a.store(v, std::memory_order_relaxed); }
void store_release(int v) { a.store(v, std::memory_order_release); }
void store_seq_cst(int v) { a.store(v); }
int  load_acquire()       { return a.load(std::memory_order_acquire); }
int  load_seq_cst()       { return a.load(); }
int  add_relaxed()        { return a.fetch_add(1, std::memory_order_relaxed); }
int  add_seq_cst()        { return a.fetch_add(1); }
int  swap_seq_cst(int v)  { return a.exchange(v); }
bool cas(int& e, int d)   { return a.compare_exchange_strong(e, d); }
```

The key instruction g++ 13 emits for each (the rest is argument moves and `ret`):

```text
store_relaxed:  movl        %edi, a(%rip)
store_release:  movl        %edi, a(%rip)
store_seq_cst:  xchgl       a(%rip), %edi
load_acquire:   movl        a(%rip), %eax
load_seq_cst:   movl        a(%rip), %eax
add_relaxed:    lock xaddl  %eax, a(%rip)
add_seq_cst:    lock xaddl  %eax, a(%rip)
swap_seq_cst:   xchgl       a(%rip), %eax
cas:            lock cmpxchgl %esi, a(%rip)
```

Reading the list:

- Relaxed and release stores, and acquire and `seq_cst` loads, are all a plain `mov`.
- The `seq_cst` store becomes `xchg`, which on x86 always locks and drains the store buffer. Older compilers wrote `mov` then `mfence`, a full fence; same job. (clang 18 also uses `xchg`.)
- Read-modify-writes are locked instructions anyway, so relaxed saves nothing there on x86; on ARM it can.

How much does that `xchg` cost? On one machine (the same 4-core, 2.1 GHz virtual machine), a tight loop of 100 million stores to one atomic took about 0.67 ns per release store and about 5.8 ns per `seq_cst` store, roughly eight times slower. Such numbers vary a lot between processors; measure on your own target.

::: warning Do not weaken orderings to go faster without a reason
Start with `seq_cst`. Use acquire/release for a publish/receive pair, and relaxed only for values nobody uses to decide what other memory to read. On x86 a wrong relaxed usually still works, so the bug waits for an ARM processor or a new compiler. You save nanoseconds; the bug costs a corrupted state vector.
:::

## What comes next

Lesson 7 builds the formal model underneath them — the *happens-before* relation that makes "visible" precise, `is_lock_free` to check whether an atomic really is lock-free on your target, and `std::atomic_ref` for applying atomic operations to ordinary variables.

## Check yourself

::: check
`a` is a `std::atomic<int>` holding 10. Thread 1 runs `int e = 10; bool ok = a.compare_exchange_strong(e, 20);`. A moment earlier, thread 2 ran `a.fetch_add(5)`. What are `ok`, `e` and `a` afterwards?
:::

::: answer
Thread 2 made `a` 15 first. Thread 1's compare-exchange compares `a` (15) with `e` (10): not equal, so nothing is written, `ok` is `false`, and the current value 15 is copied into `e`. So `ok == false`, `e == 15`, `a == 15`. The `fetch_add` returned 10, the value before the add. If thread 1 wanted to add 10 to whatever the value is, it would loop: compute `e + 10` from the fresh `e` and try again.
:::

::: check
A telemetry task counts dropped packets with `drops.fetch_add(1, std::memory_order_relaxed)` in three threads, and a housekeeping task prints `drops.load(std::memory_order_relaxed)` once a second. Is anything wrong?
:::

::: answer
No. Relaxed gives atomicity, so no increment is lost, and a single modification order for `drops`, so the printed values never go backwards. The housekeeping task does not use the count to decide what other data to read, so no ordering with other memory is needed. It may lag by a few increments, which is fine for a statistic.
:::

::: check
A producer writes a 64-byte command into a buffer, then does `ready.store(true, std::memory_order_release)`. The consumer does `if (ready.load(std::memory_order_relaxed)) execute(buffer);`. What is wrong, and what is the fix?
:::

::: answer
The release store is only half of the pair. The guarantee "everything before the release store is visible" applies to a thread whose *acquire* load reads the stored value. With a relaxed load, the consumer's reads of `buffer` may effectively happen before the flag was seen, so it can execute a half-written command, and the plain reads of `buffer` are a data race. Fix: `ready.load(std::memory_order_acquire)`.
:::

::: check
Explain in your own words why the store-buffering outcome $r_1 = r_2 = 0$ is impossible with `seq_cst` but possible with release stores and acquire loads.
:::

::: answer
With `seq_cst` all four operations fit in one order everyone agrees on, respecting each thread's program order. Whichever store is first in that order, the *other* thread's load comes later than it, so that load reads 1: at least one of $r_1, r_2$ is 1. With release/acquire there is no such single order. A release store only stops earlier operations from moving after it; an acquire load only stops later ones moving before it. Nothing stops a store from being overtaken by a later load of a *different* variable, which is exactly what an x86 store buffer does. Both loads can run while both stores are still buffered, and both read 0.
:::

::: check
On x86-64 with g++ 13, which of these compile to a plain `mov`: a relaxed store, a release store, a `seq_cst` store, an acquire load, a `seq_cst` load? Why is the odd one out different?
:::

::: answer
Every one except the `seq_cst` store is a plain `mov`. The `seq_cst` store becomes `xchg` (older compilers: `mov` plus `mfence`). x86 already keeps loads and stores in order except for one case: a store waiting in the store buffer can be passed by a later load. Only `seq_cst` forbids that, so only the `seq_cst` store needs an instruction that drains the store buffer. On one 2.1 GHz machine that made a store roughly eight times slower in a tight loop.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| `std::atomic<T>` | A variable whose operations are indivisible | No data race between atomic operations |
| `fetch_add`, `exchange` | Read-modify-write in one step | Return the value before |
| `compare_exchange_weak/strong` | Write only if the value equals `expected` | On failure loads current value into `expected`; weak may fail spuriously, loop it |
| `relaxed` | Atomicity plus one modification order for that variable | No ordering of other memory: counters yes, publishing no |
| `release` store / `acquire` load | One-way barriers that pair on one variable | Reading the released value makes all earlier writes visible |
| `acq_rel` | Both, for read-modify-write | What lock and unlock do inside a mutex |
| `seq_cst` | Default; one total order of all `seq_cst` operations | Only it forbids store-buffering $r_1 = r_2 = 0$ |
| x86 cost | Loads and non-`seq_cst` stores are plain `mov` | `seq_cst` store is `xchg` (or `mov` + `mfence`) |
| `volatile` | Every access done as written, for hardware registers | Not atomic, no inter-thread ordering |

Next lesson makes "visible" exact: the C++ memory model and its happens-before relation, `is_lock_free`, and `std::atomic_ref`.

::: context atomic-word Uncuttable
"Atomic" comes from the Greek *atomos*, "uncuttable", the same root as the atom, which was once thought to be the smallest piece of matter. An atomic operation is one that cannot be cut into smaller visible steps. The atom later turned out to be cuttable; an atomic operation, by definition, is not. In hardware it is usually one instruction with a special prefix or a special pair of instructions that the processor guarantees no other core can interleave with.
:::

::: context weak-cas-why Why the weak form can fail for no reason
x86 has one instruction for compare-and-exchange. ARM, POWER and RISC-V instead offer a pair: a *load-linked* (or *load-exclusive*) that reads a value and starts watching its address, and a *store-conditional* that writes only if nobody touched that address in between. The pair can fail for reasons that have nothing to do with your value, such as an interrupt or another write nearby. `compare_exchange_weak` maps onto one attempt of that pair; `compare_exchange_strong` must hide such failures in a loop of its own.
:::

::: context store-buffer-picture The store buffer
Each core writes into its own small store buffer, and the buffer drains to the shared cache a little later. The core reads its own buffer first, so it always sees its own writes. Another core cannot see into that buffer. So core 0 can have written `x = 1` and still read `y = 0`, while core 1 has written `y = 1` and reads `x = 0`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="120" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">core 0</text>
  <rect x="220" y="10" width="120" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">core 1</text>
  <rect x="20" y="64" width="120" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">store buffer: x = 1</text>
  <rect x="220" y="64" width="120" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">store buffer: y = 1</text>
  <rect x="20" y="126" width="320" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="151" font-size="12" text-anchor="middle" fill="#1f2a44">shared cache: x = 0, y = 0</text>
  <line x1="80" y1="46" x2="80" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="46" x2="280" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="94" x2="80" y2="124" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="280" y1="94" x2="280" y2="124" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="90" y="114" font-size="11" fill="#6c7a93">drains later</text>
  <path d="M140,36 C190,60 170,110 200,126" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="203,130 194,124 202,119" fill="#b4232c"/>
  <text x="150" y="112" font-size="11" fill="#b4232c">load y: 0</text>
</svg>
```
:::

::: context consume-note The ordering nobody uses
`memory_order_consume` was meant to be a cheaper acquire that orders only the reads that depend on the loaded value, such as following a pointer you just loaded. Specifying and implementing "depends on" turned out so hard that the C++17 standard discouraged using it, and every major compiler quietly treats it as acquire. You can ignore it; if you meet it in old code, read it as acquire.
:::

::: context one-way-barrier Barriers that open in one direction
Picture the producer's code as a column of operations. The release store is a gate: operations above it may not sink through it, but operations below may drift up past it. The acquire load in the consumer is the mirror: operations below may not float up through it, but those above may sink below. Both gates together keep "write the data" before "see the flag" before "read the data".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">producer</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">consumer</text>
  <rect x="30" y="28" width="120" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="90" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">write nav</text>
  <rect x="30" y="72" width="120" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">release store</text>
  <line x1="165" y1="52" x2="165" y2="74" stroke="#b4232c" stroke-width="2"/>
  <line x1="159" y1="64" x2="171" y2="76" stroke="#b4232c" stroke-width="2"/>
  <line x1="171" y1="64" x2="159" y2="76" stroke="#b4232c" stroke-width="2"/>
  <rect x="210" y="72" width="120" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">acquire load</text>
  <rect x="210" y="116" width="120" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="270" y="134" font-size="11" text-anchor="middle" fill="#1f2a44">read nav</text>
  <line x1="345" y1="96" x2="345" y2="118" stroke="#b4232c" stroke-width="2"/>
  <line x1="339" y1="100" x2="351" y2="112" stroke="#b4232c" stroke-width="2"/>
  <line x1="351" y1="100" x2="339" y2="112" stroke="#b4232c" stroke-width="2"/>
  <line x1="150" y1="85" x2="208" y2="85" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="210,85 200,80 200,90" fill="#1d6fd1"/>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#1d6fd1">load reads the stored true: the pair is made</text>
</svg>
```

The red crosses mark the moves that are forbidden: the write sinking below the release, and the read rising above the acquire.
:::

::: context volatile-for-hardware What volatile is really for
A sensor or radio chip is often controlled through **memory-mapped registers**: addresses that are not memory at all but wires into the device. Reading one twice can give two different answers, and writing one starts an action, so the compiler must not merge, drop or cache those accesses. `volatile` tells it exactly that. It says nothing about other threads. Java and C# gave their `volatile` keyword thread-ordering meaning, which is where much of the confusion comes from; C and C++ never did.
:::

::: context x86-tso The x86 memory model has a name
Intel and AMD describe their ordering rules in prose in their manuals. In 2010 Peter Sewell and colleagues published a precise version, "x86-TSO: A Rigorous and Usable Programmer's Model for x86 Multiprocessors", in Communications of the ACM. TSO stands for *total store order*: all cores agree on one order of stores, and the only relaxation is each core's own store buffer. That is why store buffering is the one surprising result you can see on x86.
:::
