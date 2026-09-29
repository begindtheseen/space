---
id: l07-the-memory-model
title: The C++ memory model
minutes: 22
covers:
  - The C++ memory model; is_lock_free; atomic_ref
---

Think of a group chat. Each friend's own messages always arrive in the order that friend sent them. But if Ana and Ben post at nearly the same moment, your phone might show Ana first while Carla's shows Ben first. Nobody's phone is broken. The chat promises order *within* each sender, plus one more thing: if Ben replies to Ana, everyone sees Ana's message before the reply. A reply ties two timelines together.

A multi-core computer behaves like that chat. Each core sees its own writes in order, but other cores can see them late, or in a different order. The only orders every thread can count on are the ones a program deliberately ties together.

The **memory model** is the part of the C++ standard that says exactly which orders are promised. Earlier lessons used pieces of it: data races (lesson 02), mutexes (lesson 03), and the orderings on atomics (lesson 06). This lesson puts the pieces into one picture, built from four relations. Then it answers two practical questions for flight code. Is this atomic done by the hardware, or by a hidden lock? And how do you make an access atomic when the variable sits in a plain struct you may not change?

## Memory locations: what counts as "the same place"

The standard's unit is the **memory location**: one object of a scalar type (an `int`, a `double`, a pointer, an `enum`), or one run of adjacent **[[bit-fields|bit-fields]]** that sit next to each other in a struct. Two threads may freely write two *different* memory locations at the same time, even neighboring bytes of one array. The compiler must not turn a write to `a[0]` into a read-modify-write of the whole word that also rewrites `a[1]`.

Bit-fields are the exception. `unsigned mode : 3; unsigned armed : 1;` pack into one memory location, because no instruction writes three bits alone: writing `mode` means "read the word, change three bits, write it back". So one thread writing `mode` while another writes `armed` is a data race, despite the different names.

::: key Memory locations
A memory location is one scalar object, or one maximal run of adjacent non-zero-width bit-fields. Different memory locations can be written by different threads with no synchronization. Adjacent bit-fields share a location, so writing them from two threads is a race.
:::

## Why the orders need rules at all

A program appears to run line by line. It does not. The compiler moves loads and stores under the **[[as-if rule|as-if-rule]]**: any change is allowed if this thread cannot tell. The processor reorders too: a store can wait in a core's private **[[store buffer|store-buffer]]** while later loads race ahead.

None of that shows from inside one thread. Only a second thread watching the same memory can notice. So the standard does not promise "your code runs in order". It defines relations between actions, and says what a thread may see given those relations.

## Four relations

### Sequenced-before: order inside one thread

**Sequenced-before** is the order of evaluation inside one thread. In `a = 1; b = 2;`, the write to `a` is sequenced before the write to `b`. It is the program order you already think in.

Sequenced-before is a promise about *this* thread's view only. Another thread may still see `b == 2` while `a` is still `0`.

### Synchronizes-with: the thread-to-thread link

**Synchronizes-with** is a link from an action in one thread to an action in another. It is the reply in the group chat. These are the pairs you will use most:

- A **release store** to an atomic, and an **acquire load** of the same atomic that reads the value that store wrote (lesson 06).
- An **unlock** of a mutex, and the next **lock** of the same mutex (lesson 03).
- The end of the `std::thread` or `std::jthread` constructor, and the start of the new thread's function.
- The end of a thread's function, and the return of `join()` on that thread.
- Making a promise ready, and a `get()` on its future that sees the value (next lesson).

Plain reads and writes never create one, however far apart in time they are.

::: key What acquire guarantees
If an acquire load reads a value written by a release store, the store synchronizes with the load. Everything the writing thread did before that store is then visible to the reading thread after the load. Acquire is a one-way barrier: later reads and writes cannot move above it.
:::

### Happens-before: chains of the two

**Happens-before** is what you get by chaining those two relations. Action A happens before action B if you can walk from A to B along a path of sequenced-before steps (inside a thread) and synchronizes-with steps (between threads), in any mix. Leaving aside one rarely used ordering, **[[memory_order_consume|consume]]**, that is the whole definition.

It is the arrow that matters, not the clock. If A happens before B, then B sees the effects of A. If neither happens before the other, they are **unordered**, whatever a stopwatch would have said.

Here is a chain, traced by hand. An estimator thread computes an attitude quaternion into a plain array `q`, then does `ready.store(true, release)`. A control thread does `ready.load(acquire)`, sees `true`, and reads `q`. Follow the **[[arrows|hb-picture]]**:

1. The estimator's writes to `q` are sequenced before its release store to `ready`. (Program order inside the estimator.)
2. The release store synchronizes with the acquire load, because the load read the `true` that store wrote. (The link between threads.)
3. The acquire load is sequenced before the controller's reads of `q`. (Program order inside the controller.)

Chained, each write to `q` happens before each read of `q`, so the controller sees the finished quaternion. Had the load read `false`, there would be no step 2 and reading `q` would be a race. That is why the controller checks the flag *before* it reads.

### Why happens-before makes a program race-free

Now the formal definition from lesson 02 can be stated in these words. Two accesses **conflict** if they touch the same memory location and at least one is a write.

::: key What a data race is, formally
Two threads access the same memory location, at least one writes, at least one access is not atomic, and neither access happens before the other: the accesses are not ordered by a synchronization relationship. That is a data race. It is undefined behavior, so the whole program has no defined meaning, whatever it appears to do.
:::

The promise you get in return is strong. If your program has no data races and uses only the default `seq_cst` ordering, it behaves as if the threads' steps were shuffled into one single sequence, with no reordering anyone can detect. That promise is called **[[sequential consistency for data-race-free programs|sc-drf]]**. So the one thing you must get right is a happens-before arrow between every pair of conflicting plain accesses. Then you can reason line by line again.

::: warning "It happened earlier" is not "it happens before"
Sleeping 10 ms between a write in one thread and a read in another creates no happens-before. The read is still a race, and the compiler may still keep the value in a register forever. Only the relations above order threads; time does not.
:::

### Modification order: one history per atomic variable

The fourth relation is about atomic variables only. Every atomic object has a **modification order**: a single total order of all the writes ever made to it, and every thread agrees on that order. Even `memory_order_relaxed` keeps it.

The **coherence** rules then boil down to this: once a thread has read a value from an atomic, it never later reads an *older* value of that atomic. Its view of one variable only moves forward.

The modification order gives no agreement across *different* variables. Two threads can disagree about whether `x` or `y` changed first, like the two phones in the chat. Only `seq_cst` adds one global order across variables, as lesson 06 showed.

::: key What relaxed still gives you
A relaxed operation is atomic, and it respects the variable's single modification order. It gives no ordering with respect to any other memory. That suits a statistics counter and is wrong for publishing data.
:::

## Fences, briefly

A **fence**, `std::atomic_thread_fence(order)`, is an ordering that is not attached to any one variable. A release fence followed by a relaxed store works like a release store. A relaxed load followed by an acquire fence works like an acquire load. One fence can cover several relaxed atomics at once.

```cpp laptop
#include <atomic>
#include <cstdio>
#include <thread>

double g_attitude[4];                        // plain data: a quaternion
std::atomic<bool> g_ready{false};

void estimator() {
    g_attitude[0] = 0.7071; g_attitude[1] = 0.0;
    g_attitude[2] = 0.7071; g_attitude[3] = 0.0;
    std::atomic_thread_fence(std::memory_order_release);
    g_ready.store(true, std::memory_order_relaxed);
}

void controller() {
    while (!g_ready.load(std::memory_order_relaxed)) { }
    std::atomic_thread_fence(std::memory_order_acquire);
    std::printf("q = [%.4f %.4f %.4f %.4f]\n",
                g_attitude[0], g_attitude[1], g_attitude[2], g_attitude[3]);
}

int main() {
    std::jthread c(controller), e(estimator);
}
```

This is correct code. It prints `q = [0.7071 0.0000 0.7071 0.0000]`, and the fences form the same happens-before chain as before.

::: warning ThreadSanitizer does not understand fences in g++ 13
Build the program above with `-fsanitize=thread` and g++ 13 warns at compile time: `warning: 'atomic_thread_fence' is not supported with '-fsanitize=thread' [-Wtsan]`. Run it and ThreadSanitizer reports four data races on `g_attitude`, one per element, on correct code. Prefer a release store and an acquire load on the flag itself: your tools can check that form.
:::

Its cousin `std::atomic_signal_fence` orders only the compiler, for a thread and its own signal handler.

## Is it really lock-free?

`std::atomic<T>` works for any type `T` that can be copied byte by byte. But the hardware has atomic instructions only for some sizes: on x86-64, aligned 1, 2, 4 and 8 bytes. For anything else the library quietly uses a lock, taken from a small table inside **[[libatomic|libatomic]]**.

A locking atomic is still correct, but it is wrong for three places flight code cares about:

- **An interrupt or signal handler.** If it interrupts a thread holding the hidden lock and then asks for the same lock, it waits forever.
- **A hard real-time task.** Its worst-case time now depends on whichever thread holds the lock.
- **Memory shared between processes.** The hidden lock lives inside one process. Lock-free atomics are meant to be **[[address-free|address-free]]**, and only those work across processes.

So C++ lets you ask.

- **`std::atomic<T>::is_always_lock_free`** is a `static constexpr bool`, known at compile time. `true` means the operation is done in hardware on every processor this build targets. You can `static_assert` it.
- **`a.is_lock_free()`** answers at run time. It can be `true` where `is_always_lock_free` is `false`, if it depends on the processor.
- Macros such as `ATOMIC_INT_LOCK_FREE` say `2` for "always", `1` for "sometimes", `0` for "never". `std::atomic_flag` is the one type always promised lock-free.

::: key is_lock_free and is_always_lock_free
`is_always_lock_free` is a compile-time constant: true means the atomic never uses a lock on any target this build supports. `is_lock_free()` asks at run time for this object. Put `static_assert(std::atomic<T>::is_always_lock_free)` on every atomic used from an interrupt handler, a real-time task or shared memory.
:::

::: example Which atomics are lock-free on this machine
This program asks both questions for seven types, from 1 to 24 bytes, plus a number the next section needs.

```cpp
#include <atomic>
#include <cstdint>
#include <cstdio>

struct Vec2  { float x, y; };                 //  8 bytes
struct Quat  { float w, x, y, z; };           // 16 bytes
struct Pos3  { double x, y, z; };             // 24 bytes

template <typename T>
void report(const char* name) {
    std::atomic<T> a{};
    std::printf("%-9s size %2zu  alignof %zu  always %-5s  now %-5s  ref_align %2zu\n",
                name, sizeof(T), alignof(T),
                std::atomic<T>::is_always_lock_free ? "true" : "false",
                a.is_lock_free() ? "true" : "false",
                std::atomic_ref<T>::required_alignment);
}

int main() {
    report<char>("char");
    report<std::uint16_t>("uint16_t");
    report<std::uint32_t>("uint32_t");
    report<double>("double");
    report<Vec2>("Vec2");
    report<Quat>("Quat");
    report<Pos3>("Pos3");
}
```

Build it with `g++ -std=c++20 -Wall -Wextra -O2` and the link fails:

```text
undefined reference to `__atomic_is_lock_free'
collect2: error: ld returned 1 exit status
```

`is_lock_free()` on a type that is not always lock-free becomes a call into libatomic, and g++ does not link that library by default. Add `-latomic` at the end of the command and it runs. On this machine (an Intel Xeon with 4 cores, as `nproc` reports), with g++ 13.3 and clang++ 18 alike:

```text
char      size  1  alignof 1  always true   now true   ref_align  1
uint16_t  size  2  alignof 2  always true   now true   ref_align  2
uint32_t  size  4  alignof 4  always true   now true   ref_align  4
double    size  8  alignof 8  always true   now true   ref_align  8
Vec2      size  8  alignof 4  always true   now true   ref_align  8
Quat      size 16  alignof 4  always false  now false  ref_align 16
Pos3      size 24  alignof 8  always false  now false  ref_align  8
```

Read it row by row:

1. **1, 2, 4 and 8 bytes are lock-free**, including the 8-byte struct `Vec2`: the hardware moves 8 bytes at once, whatever they hold.
2. **The 16-byte quaternion is not.** This processor does have a 16-byte compare-and-swap instruction, **[[cmpxchg16b|cmpxchg16b]]**, yet the library answers `false`. So a `std::atomic<Quat>` takes a hidden lock on every load and store.
3. **The 24-byte position is not**; no x86-64 instruction is that wide.
4. **The last column is surprising for `Vec2`.** Its natural alignment is 4, but atomic access needs 8. The next section explains.

Sanity check: 5 of the 7 types are 8 bytes or smaller, and exactly 5 rows say `true`. Every row of 8 bytes or less is lock-free and every larger row is not, which matches the rule that the hardware handles 1, 2, 4 and 8 bytes.
:::

So to share an attitude quaternion between threads, do not reach for `std::atomic<Quat>`: it compiles, and it locks. Publish it through a ring buffer (lesson 09), a mutex you can see, or a release-acquire flag, as above.

## `std::atomic_ref`: atomic access to a plain object

Sometimes you cannot change a variable's type. The struct is defined in a C header shared with ground software, or lives in a buffer written by hardware through **[[direct memory access|dma]]**. You still need two threads to touch one field safely.

C++20's **`std::atomic_ref<T>`**, read "atomic ref of T", is a small object that refers to a plain `T` and does atomic operations on it, with the same member functions as `std::atomic<T>` (`load`, `store`, `fetch_add` and the rest).

It comes with three rules:

1. **Alignment.** The object must be aligned to `std::atomic_ref<T>::required_alignment`. That can be larger than `alignof(T)`: for `Vec2` above it is 8, twice the natural 4. A `Vec2` at an address that is a multiple of 4 but not of 8 could **[[straddle|straddle]]** a boundary the hardware cannot write in one step. Write `alignas(std::atomic_ref<Vec2>::required_alignment) Vec2 v;` to be safe.
2. **All or nothing.** While any `atomic_ref` to an object exists, every access to that object must go through an `atomic_ref`. One plain read in the middle is a race again.
3. **Lifetime.** The object must outlive every `atomic_ref` that refers to it.

::: key atomic_ref and required_alignment
`std::atomic_ref<T>` gives atomic operations on an object not declared atomic. The object must be aligned to `std::atomic_ref<T>::required_alignment`, which can exceed `alignof(T)`. While any atomic_ref to it exists, all accesses must go through an atomic_ref. `is_always_lock_free` works on `atomic_ref` too.
:::

::: example A counter in a plain struct, with and without atomic_ref
A health struct keeps two counters. Two threads each count a million frames. One counter uses a plain `++`, the other goes through `atomic_ref`.

```cpp laptop
#include <atomic>
#include <cstdint>
#include <cstdio>
#include <thread>

struct Health {                    // a plain struct, laid out like the C header
    std::uint32_t frames_ok  = 0;
    std::uint32_t frames_bad = 0;
};

Health g_health;                   // shared by two threads

void count_plain(int n) {
    for (int i = 0; i < n; ++i) ++g_health.frames_ok;              // data race
}

void count_atomic(int n) {
    for (int i = 0; i < n; ++i)
        std::atomic_ref<std::uint32_t>{g_health.frames_bad}
            .fetch_add(1, std::memory_order_relaxed);               // no race
}

int main() {
    std::printf("required_alignment: uint32_t %zu, double %zu\n",
                std::atomic_ref<std::uint32_t>::required_alignment,
                std::atomic_ref<double>::required_alignment);
    const int n = 1'000'000;
    {
        std::jthread a(count_plain, n), b(count_plain, n);
    }
    {
        std::jthread a(count_atomic, n), b(count_atomic, n);
    }
    std::printf("plain  ++: %u (expected %d)\n", g_health.frames_ok, 2 * n);
    std::printf("atomic_ref: %u (expected %d)\n", g_health.frames_bad, 2 * n);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints the same thing on every run tried:

```text
required_alignment: uint32_t 4, double 8
plain  ++: 2000000 (expected 2000000)
atomic_ref: 2000000 (expected 2000000)
```

Both counters are right. Now build it with `-fsanitize=thread -g -O2` and run it. The same three lines come out, and ThreadSanitizer also prints this report (paths and the long stack frames trimmed):

```text
WARNING: ThreadSanitizer: data race (pid=7341)
  Read of size 4 at 0x563a4ef4e028 by thread T2:
    #0 count_plain(int) cod_cpp_07_07_ex2.cpp:14
  Previous write of size 4 at 0x563a4ef4e028 by thread T1:
    #0 count_plain(int) cod_cpp_07_07_ex2.cpp:14
  Location is global 'g_health' of size 8 at 0x563a4ef4e028
SUMMARY: ThreadSanitizer: data race cod_cpp_07_07_ex2.cpp:14 in count_plain(int)
ThreadSanitizer: reported 1 warnings
```

and the program exits with status 66 instead of 0. Walk through it:

1. **Why the plain counter looked right.** At `-O2` the compiler turned the million-step loop into one `addl` instruction, `frames_ok += n` (the assembly shows it). It may, because no other thread is allowed to watch. The two threads' jobs were so short that they most likely never overlapped. The right answer was luck.
2. **Why it is still a race.** Line 14 is the `++`. Two threads read and write `frames_ok`, one memory location, and nothing orders them. That is a data race, and the program is undefined whatever number came out.
3. **Why atomic_ref is clean.** Conflicting accesses that are both atomic are never a data race. Relaxed is enough, because nothing else is published through this counter.
4. **Why main may read the counters.** The `jthread`s were joined when their braces closed, and each join synchronizes with `main`, so every increment happens before the `printf` lines. The alignment is legal too: `uint32_t` needs 4 and a struct member gets 4.

Sanity check: $2 \times 1{,}000{,}000 = 2{,}000{,}000$, and both counters show that number, which is exactly why a passing count proves nothing about a race.
:::

::: warning Mixing plain and atomic access
The `atomic_ref` rule is easy to break: a logging function reads `g_health.frames_bad` directly while the counting thread still runs. That plain read is a race. While the object is shared, every access goes through `atomic_ref`, reads included.
:::

## Check yourself

::: check
A struct holds `unsigned heater_on : 1; unsigned valve_open : 1;`. The thermal thread writes `heater_on` and the propulsion thread writes `valve_open`, with no lock. Is that a data race? What if they were two separate `bool` members instead?
:::

::: answer
With bit-fields it is a race. Adjacent non-zero-width bit-fields form one memory location, so both threads write the same location with nothing ordering them. In practice each write reads the whole word, changes one bit and writes the word back, so one thread can undo the other's change. Two separate `bool` members are two memory locations, so there is no race.
:::

::: check
Thread A writes `x = 42;` then does `flag.store(1, std::memory_order_release);`. Thread B does `if (flag.load(std::memory_order_acquire) == 1) use(x);`. Name every link in the chain that makes B's read of `x` safe, and say what happens if B's load reads 0.
:::

::: answer
Three links. The write to `x` is sequenced before the release store in A. The release store synchronizes with the acquire load in B, because the load read the 1 that store wrote. The load is sequenced before `use(x)` in B. Chained, the write happens before the read, so B sees 42. If the load reads 0, there is no link, but B skips `use(x)` and never reads `x`, so there is still no race. The `if` keeps the program safe.
:::

::: check
One thread increments `std::atomic<int> count` with `memory_order_relaxed`. Another thread loads it relaxed twice, and the first load returns 7. Can the second load return 5? Can it return 9?
:::

::: answer
It cannot return 5. Every atomic has one modification order that all threads agree on, and the coherence rules say that once a thread has read a value, a later read by the same thread of the same variable never returns an earlier value in that order. 5 comes before 7, so it is ruled out. It can return 7 again, or 9, or anything later: relaxed promises no particular speed, only that the view moves forward.
:::

::: check
Your code needs `std::atomic<Stamp>`, where `Stamp` is two `std::uint64_t` fields, and it will be read from a signal handler. What single line catches the danger at build time on the machine in this lesson, and what would you change?
:::

::: answer
`static_assert(std::atomic<Stamp>::is_always_lock_free);` fails to compile, because 16-byte atomics are not lock-free with g++ 13 on x86-64. A locking atomic in a signal handler can deadlock if the handler interrupts a thread holding the hidden lock. Fixes: shrink the shared part to 8 bytes (pack a 32-bit sequence count and a 32-bit time offset into one `std::uint64_t`), or pass the stamps through a lock-free ring buffer, where only the 8-byte indices are atomic.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Memory location | the unit races are about | one scalar, or one run of adjacent bit-fields |
| Sequenced-before | order inside one thread | program order; says nothing to other threads |
| Synchronizes-with | link between two threads | release store to acquire load that reads it; unlock to lock; thread start; join |
| Happens-before | chains of the two above | if A happens before B, B sees A's effects |
| Data race | conflicting accesses, one not atomic, neither happens before the other | undefined behavior |
| Modification order | one history per atomic | all threads agree; reads never go backward |
| Fence | ordering not tied to one variable | release fence then relaxed store works like a release store |
| `is_always_lock_free` | compile-time lock-free promise | on this machine: 1, 2, 4, 8 bytes yes; 16 and 24 bytes no |
| `std::atomic_ref<T>` | atomic access to a plain object | align to `required_alignment`; all access atomic while it exists |

Next lesson steps up a level: instead of arranging happens-before by hand, you hand work to other threads and collect results through futures and promises, which carry their own synchronizes-with link inside.

::: context bit-fields Fields smaller than a byte
A bit-field is a struct member declared with a width in bits, such as `unsigned mode : 3;`, which holds values 0 to 7 in three bits. Flight software meets them in hardware register maps and packed status words, where eight on-off flags fit in one byte. The catch is that a processor cannot write three bits on their own. It reads the whole byte or word, changes the bits, and writes it back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="180" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">one byte, one memory location</text>
  <rect x="40" y="30" width="105" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="145" y="30" width="35" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="30" width="140" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="75" y1="30" x2="75" y2="66" stroke="#1f2a44" stroke-width="0.8"/>
  <line x1="110" y1="30" x2="110" y2="66" stroke="#1f2a44" stroke-width="0.8"/>
  <line x1="215" y1="30" x2="215" y2="66" stroke="#6c7a93" stroke-width="0.8"/>
  <line x1="250" y1="30" x2="250" y2="66" stroke="#6c7a93" stroke-width="0.8"/>
  <line x1="285" y1="30" x2="285" y2="66" stroke="#6c7a93" stroke-width="0.8"/>
  <text x="92" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">mode : 3</text>
  <text x="162" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">armed : 1</text>
  <text x="250" y="84" font-size="12" text-anchor="middle" fill="#6c7a93">unused : 4</text>
  <text x="180" y="108" font-size="12" text-anchor="middle" fill="#b4232c">writing mode rewrites armed too</text>
</svg>
```
:::

::: context as-if-rule The compiler's freedom
The as-if rule says a compiler may produce any machine code whose observable behavior matches what the program would do if run literally, step by step. Observable means input and output, `volatile` accesses, and the like. It does not include what another thread might see mid-way, unless the program used atomics or locks to make that visible. That is why the compiler may keep a variable in a register, merge two stores, or move a load earlier, and why a race lets it break your program.
:::

::: context store-buffer Why a core's write is late
Writing to the shared cache takes a while, so each core parks its stores in a small private queue, the store buffer, and carries on. Its own later loads check that queue first, so the core always sees its own writes. Another core cannot look inside the queue, so for a short time it still sees the old value.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="140" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">core 0: x = 1</text>
  <rect x="200" y="15" width="140" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">core 1: reads x</text>
  <rect x="30" y="70" width="120" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="90" font-size="12" text-anchor="middle" fill="#1f2a44">store buffer: x=1</text>
  <line x1="90" y1="55" x2="90" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="125" width="320" height="32" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">shared cache: x = 0 (still old)</text>
  <line x1="90" y1="100" x2="90" y2="125" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="100" y="117" font-size="11" fill="#6c7a93">later</text>
  <line x1="270" y1="55" x2="270" y2="125" stroke="#b4232c" stroke-width="1.5"/>
  <text x="280" y="95" font-size="12" fill="#b4232c">sees 0</text>
</svg>
```
:::

::: context consume Why one ordering is left out
Lesson 06 met `memory_order_consume` and set it aside: compilers treat it as acquire. The formal model pays for it with extra relations, "carries a dependency" and "dependency-ordered before", which make happens-before harder to state without making any real program faster today. Leave consume out, and happens-before is exactly the chains of sequenced-before and synchronizes-with described here.
:::

::: context hb-picture The chain, drawn
Downward arrows are sequenced-before, inside each thread. The red arrow is the synchronizes-with link, and it exists only because the load read the value the store wrote. Following arrows from any write of `q` reaches every read of `q`: that path is the happens-before relation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="85" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">estimator</text>
  <text x="275" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">controller</text>
  <rect x="20" y="30" width="130" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">write q[0..3]</text>
  <line x1="85" y1="60" x2="85" y2="92" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="85,100 80,90 90,90" fill="#6c7a93"/>
  <text x="95" y="82" font-size="11" fill="#6c7a93">sb</text>
  <rect x="20" y="100" width="130" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">store ready (release)</text>
  <rect x="210" y="100" width="130" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">load ready (acquire)</text>
  <line x1="150" y1="115" x2="200" y2="115" stroke="#b4232c" stroke-width="2"/>
  <polygon points="210,115 199,110 199,120" fill="#b4232c"/>
  <text x="180" y="108" font-size="11" text-anchor="middle" fill="#b4232c">sw</text>
  <line x1="275" y1="130" x2="275" y2="152" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="275,160 270,150 280,150" fill="#6c7a93"/>
  <text x="285" y="147" font-size="11" fill="#6c7a93">sb</text>
  <rect x="210" y="160" width="130" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">read q[0..3]</text>
</svg>
```
:::

::: context sc-drf The bargain at the heart of the model
The idea that a program free of data races may be treated as if it ran with no reordering at all comes from computer-architecture research around 1990, notably by Sarita Adve and Mark Hill. Java adopted it in 2004 and C++11 in 2011. The bargain is this: hardware and compilers keep all their speed tricks, and in return the programmer promises no races. Break the promise and you lose every guarantee, not only the ordering ones.
:::

::: context libatomic The helper library behind big atomics
libatomic is a small support library that ships with GCC. When an atomic operation is too big for one instruction, the compiler emits a call such as `__atomic_load` or `__atomic_is_lock_free`, and libatomic implements it, using a lock chosen from an internal table by the object's address. That is why `-latomic` must appear on the link line, at the end, once any such call exists. On a small embedded target the library may not exist at all, which is one more reason to keep shared atomics to 8 bytes or fewer.
:::

::: context address-free Why lock-free atomics work between processes
Two processes can map the same physical memory, each at a different address. A lock-free atomic works there, because the processor's atomic instruction acts on the memory itself, wherever each process sees it. A lock-based one does not: its hidden lock sits in a table inside each process, picked by that process's address, so the two processes take two different locks and protect nothing. The standard's wording says lock-free operations should be address-free for exactly this reason.
:::

::: context cmpxchg16b A 16-byte instruction the library does not trust
x86-64 processors have `cmpxchg16b`, a compare-and-swap on 16 aligned bytes; `grep cx16 /proc/cpuinfo` shows this machine has it. But a 16-byte atomic *load* built from it must be written as a compare-and-swap, which writes the memory. That fails on read-only memory and makes every reader fight over the cache line like a writer. GCC's library therefore does not report 16-byte atomics as lock-free, and compiling with `-mcx16` did not change the answer here.
:::

::: context dma Memory written by hardware
Direct memory access, or DMA, is when a device such as a radio, a sensor interface or a disk controller copies data straight into memory without the processor doing the copying. The software then finds a buffer that has changed under it. The buffer's layout is fixed by the device, so you cannot redeclare its fields as `std::atomic`. That is the kind of place `atomic_ref` was designed for, alongside structs shared with C code.
:::

::: context straddle Why alignment matters for atomic access
The hardware moves an aligned 8-byte block in one step. A `Vec2` placed at address 4 covers bytes 4 to 11, which crosses the boundary at 8, so the processor would need two accesses, and another core could see half old and half new. At address 8 it fits inside one aligned block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="50" x2="20" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="40" x2="180" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="340" y1="50" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="180" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">8</text>
  <text x="340" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">16</text>
  <rect x="100" y="30" width="160" height="22" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="25" font-size="12" text-anchor="middle" fill="#b4232c">Vec2 at 4: crosses 8</text>
  <rect x="180" y="100" width="160" height="22" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="260" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">Vec2 at 8: fits</text>
</svg>
```
:::
