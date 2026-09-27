---
id: l10-false-sharing
title: "False sharing: when two threads fight over one cache line"
minutes: 22
covers:
  - False sharing and hardware_destructive_interference_size
---

Picture two students keeping score for two different games, in one shared notebook. Each writes only on her own line of the page. They never touch each other's numbers. But there is only one notebook, and you can only write in it while you are holding it. So every time Ana wants to add a point, she has to take the notebook from Ben. A second later Ben wants it back. The notebook spends more time being passed across the table than being written in.

Give each of them a notebook of their own and the passing stops. Nothing about the scores changed. Only where they were written.

Your processor does exactly this with memory. It never moves single bytes between cores; it moves whole blocks of 64 bytes called **cache lines**. If two threads write two different variables that happen to live in the same 64-byte block, the block gets passed back and forth between their cores like that notebook. That is **false sharing** — two threads that share no data, slowed down because their data shares a cache line. Last lesson's ring buffer has two indices, one written by the producer and one by the consumer, and where they sit in memory turns out to matter. This lesson shows why, measures it on a real machine, and gives you the C++17 constant, `std::hardware_destructive_interference_size`, that is meant to fix it.

## Memory comes in lines

Main memory is slow compared with a core: a read from the RAM chips takes on the order of a hundred nanoseconds, time enough for hundreds of instructions. So each core keeps a small, fast copy of the memory it has used recently, called its **[[cache|cache-word]]**. When the core reads an address, it looks in its cache first. Only on a miss does it fetch from further away.

The cache does not store single bytes. It stores memory in fixed blocks called **cache lines**. On x86-64 processors a line is 64 bytes. You can ask Linux directly:

```text
$ getconf LEVEL1_DCACHE_LINESIZE
64
$ nproc
4
```

That is the machine used for every number in this lesson: an Intel Xeon with 4 cores, running as a virtual machine.

A line always starts at an address that is a multiple of 64. So which line a byte belongs to is its address divided by 64, rounded down. Two `long` variables 8 bytes apart, the first at an address that is a multiple of 64, are in the same line. Two variables 64 bytes apart never are.

Reading one `long` fetches the whole 64-byte line around it. That is usually a gift, because the next variable you touch is often right next door. For threads, it is also the trouble.

::: key
A cache line is the unit the processor moves between memory and caches: 64 bytes on x86-64 (`getconf LEVEL1_DCACHE_LINESIZE` prints 64 on this machine). A byte's line is its address divided by 64, rounded down.
:::

## Keeping the copies honest: coherence

With 4 cores there can be 4 copies of the same line, one in each core's cache. If core 0 writes to its copy, the others are now out of date. The hardware must stop anyone from reading the old value forever. The rules that keep all the copies agreeing are called **cache coherence**.

Most processors use a scheme from the **[[MESI|mesi-name]]** family. Each core marks each line it holds with one of four states:

- **M, Modified.** "I have the only copy, and I changed it. Memory is out of date."
- **E, Exclusive.** "I have the only copy, and it matches memory."
- **S, Shared.** "I have a clean copy, and other cores may have one too."
- **I, Invalid.** "My copy is stale. Do not use it."

The one rule that matters for us: **to write a line, a core must own it alone** — it must be in M or E. If other cores hold copies, the writing core first sends them a message that says "throw your copy away", and their copies become I. Next time one of those cores touches the line, it misses and must fetch the fresh line from the writer.

Now put two threads on two cores. Thread A keeps writing variable `a`; thread B keeps writing variable `b`; `a` and `b` are in the same line. Every write by A invalidates B's copy. B's next write must pull the line back and invalidate A's copy. The line **[[ping-pongs|ping-pong]]** between the cores, and each trip costs tens of nanoseconds. Neither thread ever reads the other's variable. The hardware cannot know that; it only tracks whole lines.

::: key What is false sharing?
Two threads writing to different variables that happen to share one cache line, so the line ping-pongs between cores. The fix is padding or `alignas` to the destructive interference size, which can be worth several times the throughput.
:::

The word "false" is there to set it apart from **true sharing**, where two threads really do use the same variable. True sharing has to cost something, because the data must travel. False sharing is pure waste, caused only by where the compiler happened to put things.

## False sharing, measured

Here are two counters, each bumped by its own thread 100 million times. The only difference between the two structs is where the second counter sits. `alignas(64)` (read "align as 64") tells the compiler to start that member at an address that is a multiple of 64, which puts it at the start of a fresh cache line.

::: example Two counters, one line or two
```cpp
#include <atomic>
#include <chrono>
#include <cstdio>
#include <thread>

struct Together {                 // both counters in one 64-byte line
    std::atomic<long> a{0};
    std::atomic<long> b{0};
};

struct Apart {                    // each counter on its own line
    alignas(64) std::atomic<long> a{0};
    alignas(64) std::atomic<long> b{0};
};

constexpr long kIters = 100'000'000;

template <typename S>
double run(S& s) {
    auto start = std::chrono::steady_clock::now();
    std::thread t1([&] { for (long i = 0; i < kIters; ++i) s.a.fetch_add(1, std::memory_order_relaxed); });
    std::thread t2([&] { for (long i = 0; i < kIters; ++i) s.b.fetch_add(1, std::memory_order_relaxed); });
    t1.join();
    t2.join();
    std::chrono::duration<double> dt = std::chrono::steady_clock::now() - start;
    return dt.count();
}

int main() {
    static Together together;
    static Apart apart;
    std::printf("sizeof(Together) = %zu, sizeof(Apart) = %zu\n", sizeof(Together), sizeof(Apart));
    std::printf("gap a->b: together %td bytes, apart %td bytes\n",
                reinterpret_cast<char*>(&together.b) - reinterpret_cast<char*>(&together.a),
                reinterpret_cast<char*>(&apart.b) - reinterpret_cast<char*>(&apart.a));
    double t = run(together);
    double p = run(apart);
    std::printf("together: %.2f s   apart: %.2f s   ratio %.1fx\n", t, p, t / p);
    std::printf("sums: %ld %ld %ld %ld\n", together.a.load(), together.b.load(), apart.a.load(), apart.b.load());
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -pthread` and run on the 4-core machine above:

```text
sizeof(Together) = 16, sizeof(Apart) = 128
gap a->b: together 8 bytes, apart 64 bytes
together: 3.49 s   apart: 0.61 s   ratio 5.7x
sums: 100000000 100000000 100000000 100000000
```

Reading it line by line:

1. `Together` is 16 bytes: two 8-byte counters side by side, 8 bytes apart. In this build `together` landed at an address that is a multiple of 64 (`nm` on the program shows it), so both counters are in one line.
2. `Apart` is 128 bytes: `alignas(64)` on each member pushed `b` to offset 64, and the struct's size was rounded up to a multiple of 64. Now each counter owns a line. The [[two layouts|sizeof-layouts]] are drawn in the note.
3. The same work took 3.49 s together and 0.61 s apart, about 5.7 times longer when the counters share a line. Two more runs gave 5.5 and 5.4 times. Your numbers will differ with the machine and the load, but the direction will not.
4. Per increment: $3.49\,\mathrm{s} / 10^8 \approx 35\,\mathrm{ns}$ together, against $0.61\,\mathrm{s} / 10^8 \approx 6\,\mathrm{ns}$ apart. The extra 29 ns or so is, roughly, the price of pulling the line over from the other core.

Sanity check: all four sums are exactly 100,000,000, so the slow version is not wrong, only slow. That fits: false sharing never breaks correctness. It only burns time.
:::

How bad is "slow"? The same 200 million increments done by **one** thread, on two counters, took about 1.23 s on this machine. So two threads fighting over one line took almost three times as long as one thread doing all the work alone. Adding a thread made the program slower. That is the classic signature of false sharing: parallel code that scales backwards.

::: warning Suspect false sharing when more threads make it slower
If a loop gets slower as you add threads, and the threads write only their "own" variables, look at where those variables sit. Per-thread counters in adjacent struct members, or `counts[thread_id]` in a plain array, share lines. The fix is either to pad each one to its own line, or to count in a local variable inside each thread and write the total out once at the end. A local variable lives in a register or on the thread's own stack, so nothing is shared until that final write.
:::

### Where padding goes

`alignas(64)` on a member starts that member on a new line, and the compiler rounds the struct's size up to a multiple of its strictest alignment. So an array of such structs keeps each element's hot member on its own line:

```cpp
#include <atomic>

struct alignas(64) PerThreadStats {     // every element starts on its own line
    std::atomic<long> packets{0};
};

PerThreadStats stats[4];                // one per core; sizeof(PerThreadStats) == 64
static_assert(sizeof(PerThreadStats) == 64);
```

The cost is memory: 64 bytes to hold 8. That is a good trade for the few variables written from different threads at a high rate, and a bad one for everything else, because padding spreads your data over more lines and the cache holds less of what you use.

## The standard's constant: `hardware_destructive_interference_size`

Writing `64` by hand has a problem: the right number depends on the processor. C++17 added two constants to the header `<new>` so the compiler can tell you:

- **`std::hardware_destructive_interference_size`** — the smallest distance, in bytes, that two objects should be apart so that writes to one do not disturb the other. Use it to *separate* things written by different threads. "Destructive" because sharing a line destroys performance.
- **`std::hardware_constructive_interference_size`** — the largest size of a block of memory you can expect to sit in one line. Use it to *keep together* things one thread uses together, such as a small struct of values read at the same moment. "Constructive" because sharing a line helps.

With g++ 13 on x86-64, both are 64:

```cpp
#include <cstdio>
#include <new>

int main() {
#ifdef __cpp_lib_hardware_interference_size
    std::printf("__cpp_lib_hardware_interference_size = %ld\n", (long)__cpp_lib_hardware_interference_size);
    std::printf("destructive  = %zu\n", std::hardware_destructive_interference_size);
    std::printf("constructive = %zu\n", std::hardware_constructive_interference_size);
#else
    std::printf("not supported\n");
#endif
}
```

```text
__cpp_lib_hardware_interference_size = 201703
destructive  = 64
constructive = 64
```

The `#ifdef` checks a **[[feature-test macro|feature-macro]]**, a name the library defines only when it provides the feature. It earns its place: the same file built with this machine's clang++ 18, which uses the same GCC standard library, prints `not supported`. The library only defines the constants when the compiler tells it the numbers, and clang 18 does not.

### The warning, and why it exists

Use the constant in a header and g++ 13 warns you. This header lays out two ring-buffer indices:

```cpp
// indices.hpp
#pragma once
#include <atomic>
#include <cstddef>
#include <new>

struct Indices {
    alignas(std::hardware_destructive_interference_size) std::atomic<std::size_t> head{0};
    alignas(std::hardware_destructive_interference_size) std::atomic<std::size_t> tail{0};
};
```

Including it from a `.cpp` file and compiling with `-Wall` gives, for each use (first one shown):

```text
In file included from useh.cpp:1:
indices.hpp:7:18: warning: use of 'std::hardware_destructive_interference_size' [-Winterference-size]
    7 |     alignas(std::hardware_destructive_interference_size) std::atomic<std::size_t> head{0};
      |                  ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
indices.hpp:7:18: note: its value can vary between compiler versions or with different '-mtune' or '-mcpu' flags
indices.hpp:7:18: note: if this use is part of a public ABI, change it to instead use a constant variable you define
indices.hpp:7:18: note: the default value for the current CPU tuning is 64 bytes
indices.hpp:7:18: note: you can stabilize this value with '--param hardware_destructive_interference_size=64', or disable this warning with '-Wno-interference-size'
```

The same struct used only inside one `.cpp` file draws no warning.

The worry is the **[[ABI|abi-word]]**, the agreement between separately compiled pieces of a program about how types are laid out in memory. The constant is the compiler's guess for the processor it tunes for. Build two libraries with different settings and `sizeof(Indices)` can differ between them; if they share an `Indices` object, they disagree about where `tail` is. A header is exactly how one type gets compiled by several builds.

Flight software usually settles it the plain way the note suggests: define your own constant, once, for [[the processor you fly|adjacent-line]], and write down where the number came from.

```cpp
#include <cstddef>

// Our flight processor: 64-byte lines (checked with getconf on the target).
inline constexpr std::size_t kCacheLine = 64;
```

::: warning The command-line option in g++ 13's note is misspelled
g++ 13 rejects the option its own note suggests: `unrecognized command-line option '--param=hardware_destructive_interference_size=64'; did you mean '--param=destructive-interference-size='?`. The one that works, and silences the warning, is `--param destructive-interference-size=64`.
:::

::: key
`std::hardware_destructive_interference_size` (in `<new>`, C++17): minimum spacing that keeps two objects off one cache line; use it to separate data written by different threads. `std::hardware_constructive_interference_size`: maximum size expected to fit in one line; use it to keep together data used together. Both are 64 with g++ 13 on x86-64. g++ warns (`-Winterference-size`) when they are used in a header, because the value can change with compiler version and tuning and so can change a type's layout; define your own constant for a public type.
:::

## The ring buffer's head and tail

Last lesson's ring buffer has two indices. The producer writes `head_`; the consumer writes `tail_`. The exercise solution puts `alignas(64)` on both. Is that false sharing avoided, or true sharing that cannot be avoided?

Both. Each side *must* read the other's index, because that is how the producer knows the buffer is not full and the consumer knows it is not empty. That is true sharing: the value has to travel. But each side also writes its own index on every operation. If the two indices share a line, every push invalidates the line the consumer is about to read, and every pop invalidates it for the producer.

The trick that makes padding pay is to read the other side's index **rarely**. Each side keeps a private copy of the other side's index, and only reloads the real one when its copy says "full" or "empty". While the buffer has room, the producer and consumer then each touch only their own lines, and padding keeps those lines apart.

::: example Padding a ring buffer that caches the other index
`Pad` is a template parameter so one program can build both layouts. With `Pad = 8` every field is packed into the first line; with `Pad = 64` the producer's fields, the consumer's fields and the data each start on their own line.

```cpp
#include <array>
#include <atomic>
#include <chrono>
#include <cstddef>
#include <cstdio>
#include <thread>

constexpr std::size_t kLine = 64;   // this machine: getconf LEVEL1_DCACHE_LINESIZE

// Each side keeps a private copy of the OTHER side's index and re-reads
// the shared atomic only when the copy says "full" (producer) or "empty"
// (consumer). Pad = 8 packs everything together; Pad = kLine separates
// the producer's data from the consumer's data.
template <typename T, std::size_t N, std::size_t Pad>
class SpscRing {
    static_assert((N & (N - 1)) == 0, "N must be a power of two");
public:
    bool push(const T& v) {
        const std::size_t h = head_.load(std::memory_order_relaxed);
        const std::size_t next = (h + 1) & (N - 1);
        if (next == tail_cache_) {                                 // looks full
            tail_cache_ = tail_.load(std::memory_order_acquire);   // look again
            if (next == tail_cache_) return false;                 // really full
        }
        buf_[h] = v;
        head_.store(next, std::memory_order_release);
        return true;
    }
    bool pop(T& out) {
        const std::size_t t = tail_.load(std::memory_order_relaxed);
        if (t == head_cache_) {                                    // looks empty
            head_cache_ = head_.load(std::memory_order_acquire);
            if (t == head_cache_) return false;                    // really empty
        }
        out = buf_[t];
        tail_.store((t + 1) & (N - 1), std::memory_order_release);
        return true;
    }
private:
    alignas(Pad) std::atomic<std::size_t> head_{0};   // producer writes
    std::size_t tail_cache_ = 0;                      // producer only
    alignas(Pad) std::atomic<std::size_t> tail_{0};   // consumer writes
    std::size_t head_cache_ = 0;                      // consumer only
    alignas(Pad) std::array<T, N> buf_{};
};

template <std::size_t Pad>
double run() {
    constexpr long kCount = 100'000'000;
    static SpscRing<long, 65536, Pad> ring;
    long last = -1;
    bool ok = true;
    auto start = std::chrono::steady_clock::now();
    std::thread producer([] {
        for (long i = 0; i < kCount; ++i)
            while (!ring.push(i)) { }
    });
    for (long got = 0; got < kCount; ) {
        long v;
        if (ring.pop(v)) { ok = ok && (v == last + 1); last = v; ++got; }
    }
    producer.join();
    std::chrono::duration<double> dt = std::chrono::steady_clock::now() - start;
    std::printf("pad %2zu: %s, %.2f s, %.0f million items/s\n",
                Pad, ok ? "sequence ok" : "SEQUENCE BROKEN", dt.count(), kCount / dt.count() / 1e6);
    return dt.count();
}

int main() {
    double packed = run<8>();
    double padded = run<kLine>();
    std::printf("padded is %.1fx faster\n", packed / padded);
}
```

One run on the 4-core machine:

```text
pad  8: sequence ok, 1.35 s, 74 million items/s
pad 64: sequence ok, 0.46 s, 216 million items/s
padded is 2.9x faster
```

Step by step:

1. The producer thread pushes the numbers 0 to 99,999,999; `main` is the consumer and pops them.
2. The consumer checks each value is exactly one more than the last. Both runs print `sequence ok`, so both layouts are correct.
3. Packed, 100 million items took 1.35 s. Padded, 0.46 s. Seven runs in all gave speed-ups between 2.9 and 4.5 times.
4. Why: packed, `head_` (written on every push) and `tail_` (written on every pop) share a line with both private copies, so every operation steals the line from the other side. Padded, each side mostly touches only its own line and the slot it is using.

Sanity check: in the padded run, $10^8 / 0.46\,\mathrm{s} \approx 2.2 \times 10^8$ items per second, the printed 216 million. Each item moves 8 bytes, so that is under 2 GB/s, far below what memory can carry. The limit is coordination between the cores, not bandwidth, which is what this lesson predicts.
:::

::: warning Padding alone is not a guaranteed win: measure
The exercise's simpler ring, which reads the *other* index on every push and pop, behaved the opposite way on this machine. With `head_` and `tail_` 8 bytes apart it moved 34 to 127 million items per second over three runs; with `alignas(64)` on both, 21 to 28 million. Why: when every operation reads the other side's index anyway, the line must travel every time no matter what. Padding then means two lines travel instead of one. Separating the lines pays only when each side stops reading the other's line most of the time, which is what the cached copies do. Performance advice about caches is a hypothesis until you have measured it on your processor.
:::

## Where this lives on a vehicle

A flight computer's control loop and telemetry thread often run on different cores and hand data through a queue like the one above. Per-core statistics — packets received, checksum failures, cycle overruns — are the "each thread writes its own counter" pattern of the first example. In both, a struct's layout, invisible in the code's logic, can decide whether an update costs 6 nanoseconds or 35. And a line bouncing between cores is a delay that depends on what the *other* core is doing, so your loop's timing now depends on another thread. That kind of variation is the subject of the next lesson.

## Check yourself

::: check
A struct holds `std::atomic<int> x;` followed by `std::atomic<int> y;`. The struct starts at address 1,000,000 (decimal). Are `x` and `y` on the same 64-byte cache line?
:::

::: answer
`x` is at 1,000,000 and `y` at 1,000,004 (an `int` is 4 bytes). The line of an address is the address divided by 64, rounded down: $1{,}000{,}000 / 64 = 15{,}625$ exactly, and $1{,}000{,}004 / 64 = 15{,}625.06$, which rounds down to 15,625. Same line number, so the same line. If one thread writes `x` and another writes `y`, they falsely share it.
:::

::: check
In MESI terms, why do many threads *reading* one variable cost almost nothing, while two threads *writing* different variables on one line cost a lot?
:::

::: answer
Readers can all hold the line in the Shared state at once, each reading its own copy, with no messages. A write needs the only copy (Modified or Exclusive), so the writer must first invalidate every other copy. With two writers on one line, each write invalidates the other's copy, and the other's next write fetches the line back: it crosses between cores on nearly every write.
:::

::: check
Eight worker threads each increment `hits[i]`, where `long hits[8];` is a global array and `i` is the thread's number. Give two different fixes and say which one you would pick for a loop that runs a billion times.
:::

::: answer
The eight `long`s take 64 bytes, so they may all sit on one or two lines, and every increment steals a line from another core. Fix one: pad each counter onto its own line, for example an array of `struct alignas(64) Slot { long n; };`. Fix two: count in a local variable inside each thread's loop and write `hits[i] = local;` once at the end. For a billion-iteration loop the second is better: the hot loop touches only a register, and the shared array is written eight times in total instead of eight billion.
:::

::: check
Why does g++ 13 warn about `std::hardware_destructive_interference_size` in a header, but not in a single `.cpp` file? What would you do instead in a flight library's public header?
:::

::: answer
The value is the compiler's guess for the processor it is tuning for, and it can change with the compiler version or the `-mtune` setting. In a header, the same struct is compiled by every file and library that includes it; if two of them used different values, they would disagree on the struct's layout, an ABI break that shows up as memory corruption. Inside one `.cpp` file, only one compilation sees the type, so it cannot disagree with itself. For a public header, define your own `inline constexpr std::size_t kCacheLine = 64;` for the target processor, and use that.
:::

::: check
A teammate adds `alignas(64)` to both indices of a ring buffer whose `push` reads `tail_` and whose `pop` reads `head_` on every call. The benchmark gets slower. Explain, and say what change makes the padding pay.
:::

::: answer
Every push writes `head_` and reads `tail_`, and every pop does the reverse, so each index's line must cross to the other core on nearly every operation whatever the layout. Packed, the two indices travel together as one line; padded, two lines travel. Give each side a private cached copy of the other's index, reloaded only when it says "full" or "empty". Then each side mostly touches only its own line, and keeping the lines apart removes the ping-pong.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Cache line | Unit of memory the caches move | 64 bytes on x86-64; line number = address / 64, rounded down |
| Coherence (MESI) | Rules that keep all cores' copies agreeing | To write, a core must hold the only copy; other copies are invalidated |
| True sharing | Threads really use the same variable | The data must travel; the cost is real |
| False sharing | Different variables written by different threads on one line | Line ping-pongs; fix with padding, `alignas`, or local accumulation |
| Measured cost | Two counters, one line vs two, 4-core machine | About 5.5 times slower together; slower than one thread |
| `hardware_destructive_interference_size` | Spacing that keeps objects on separate lines | `<new>`, C++17; 64 with g++ 13 on x86-64 |
| `hardware_constructive_interference_size` | Size that fits in one line | Keep data used together within it |
| `-Winterference-size` | g++ warning for use in headers | Value may vary, so layout may vary; define your own constant |
| Ring buffer indices | Producer writes head, consumer writes tail | Padding pays when each side caches the other's index; measure |

Next lesson steps back from speed to *time*: what it means for a task to be real time, why the worst case and not the average decides whether a control loop works, and how to check on paper that a set of periodic tasks will always meet their deadlines.

::: context cache-word A notebook next to the desk
A cache is a small, fast memory that keeps copies of recently used data close to the core, like keeping the three books you are using on your desk instead of walking to the library shelf each time. This machine has 48 KiB of first-level data cache per core (192 KiB across 4 cores), then larger and slower second- and third-level caches. A hit in the first level takes a few nanoseconds; a trip to main memory takes on the order of a hundred.
:::

::: context mesi-name Four letters, four states
MESI is named for its four states: Modified, Exclusive, Shared, Invalid. It is also called the Illinois protocol, after the University of Illinois, where it was described in the 1980s. Real processors use relatives with an extra state: Intel's MESIF adds Forward (which sharer answers a request), and AMD's MOESI adds Owned (a changed line that can be shared without first writing it back to memory). The rule this lesson depends on is the same in all of them: a write needs the only copy.
:::

::: context ping-pong The line crossing the table
Two cores, one line holding `a` and `b`. Each write by one core invalidates the other core's copy, so the line keeps moving back and forth even though the cores never touch the same variable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="14" width="110" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="69" y="37" font-size="12" text-anchor="middle" fill="#1f2a44">core 0 writes a</text>
  <rect x="236" y="14" width="110" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="291" y="37" font-size="12" text-anchor="middle" fill="#1f2a44">core 1 writes b</text>
  <rect x="100" y="110" width="160" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="110" width="20" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="120" y="110" width="20" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="110" y="131" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <text x="130" y="131" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="200" y="131" font-size="11" text-anchor="middle" fill="#6c7a93">rest of line</text>
  <text x="180" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">one 64-byte cache line</text>
  <path d="M69,52 C69,90 90,104 104,108" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="108,110 97,110 102,101" fill="#b4232c"/>
  <path d="M291,52 C291,90 270,104 256,108" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="252,110 263,110 258,101" fill="#b4232c"/>
  <text x="180" y="72" font-size="11" text-anchor="middle" fill="#b4232c">each write takes the whole line</text>
  <text x="180" y="88" font-size="11" text-anchor="middle" fill="#b4232c">and invalidates the other copy</text>
</svg>
```
:::

::: context sizeof-layouts The two structs, byte by byte
The first example's two layouts, drawn to scale over two 64-byte lines. `Together` puts both 8-byte counters in line 0. `Apart` starts `b` at offset 64, in line 1, and leaves 56 bytes of padding after `a`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="144" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">line 0: bytes 0-63</text>
  <text x="272" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">line 1: bytes 64-127</text>
  <text x="88" y="38" font-size="11" text-anchor="middle" fill="#1d6fd1">a</text>
  <text x="104" y="38" font-size="11" text-anchor="middle" fill="#b4232c">b</text>
  <text x="12" y="62" font-size="11" fill="#1f2a44">Together</text>
  <rect x="80" y="46" width="16" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="96" y="46" width="16" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="112" y="46" width="96" height="24" fill="#fff" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="160" y="62" font-size="11" text-anchor="middle" fill="#6c7a93">rest of line</text>
  <text x="12" y="112" font-size="11" fill="#1f2a44">Apart</text>
  <rect x="80" y="96" width="16" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="96" y="96" width="112" height="24" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <text x="152" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">padding</text>
  <rect x="208" y="96" width="16" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="224" y="96" width="112" height="24" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <text x="280" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">padding</text>
  <text x="88" y="136" font-size="11" text-anchor="middle" fill="#1d6fd1">a</text>
  <text x="216" y="136" font-size="11" text-anchor="middle" fill="#b4232c">b</text>
  <line x1="208" y1="24" x2="208" y2="126" stroke="#1f2a44" stroke-width="1.5"/>
</svg>
```

Each coloured box is one 8-byte counter, drawn to scale; the vertical line marks the boundary at byte 64.
:::

::: context feature-macro Asking the library what it has
Every C++ library feature added since C++14 has a feature-test macro, a name like `__cpp_lib_hardware_interference_size` that is defined only if the library provides it. Its value is a date, `201703` meaning March 2017, the year and month the feature entered the draft standard. Testing it with `#ifdef` lets one source file build on compilers that have the feature and on ones that do not, which matters when flight code is built by several toolchains.
:::

::: context abi-word The contract between compiled pieces
ABI stands for application binary interface. The API is what you can write in source code; the ABI is what compiled machine code relies on: the size of each type, the offset of each member, how functions pass arguments. Two object files built separately never compare notes; they only work together if they assumed the same layout. Change a member's offset in one build and not the other, and one side reads the wrong bytes with no error message at all.
:::

::: context adjacent-line Why some libraries pad to 128
Intel documents a prefetcher in its cores that, on a miss, may also fetch the neighbouring line so the pair forms an aligned 128-byte block. Two threads writing in neighbouring lines can then still disturb each other a little. For that reason some concurrency libraries pad hot fields to 128 bytes on x86-64 instead of 64. Some ARM processors, including Apple's M-series chips, use 128-byte lines outright. This is one more reason the right number is a property of the processor you fly, checked on that processor.
:::
