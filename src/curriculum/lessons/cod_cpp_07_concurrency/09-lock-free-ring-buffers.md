---
id: l09-lock-free-ring-buffers
title: Lock-free ring buffers for telemetry
minutes: 21
covers:
  - Lock-free single-producer single-consumer ring buffers for telemetry
  - Lock-free is not wait-free; progress guarantees
---

Picture a sushi bar with a round conveyor belt and eight plate spots. One chef puts plates on. One customer takes them off. The chef never touches a plate already on the belt, and the customer never puts one back. Neither of them ever has to ask the other's permission. The chef only has to look whether the next spot is free, and the customer only has to look whether there is a plate in front of them.

That is the whole idea of this lesson. A **ring buffer** is an array used in a circle, with one side writing and the other side reading. When exactly one thread writes and exactly one thread reads, it can be built with no mutex at all, from two atomic indices and the release and acquire orderings of lesson 06.

Flight software uses it constantly. The 1 kHz control task produces a **[[telemetry|telemetry]]** record every cycle: time, attitude, rates, commands. A lower-priority task packs those records for the radio. The control task must never wait for the radio task. If it blocked on a mutex the radio task held, a high-priority task would be waiting on a low-priority one, which is the priority inversion of lesson 12. A lock-free single-producer, single-consumer ring removes the mutex, and with it the wait.

## The ring: two indices chasing each other

Take an array of $N$ slots. Keep two numbers:

- **head**: the slot the producer will write next. Only the producer changes it.
- **tail**: the slot the consumer will read next. Only the consumer changes it.

To **push**, the producer writes into `buf[head]` and moves head forward one. To **pop**, the consumer reads `buf[tail]` and moves tail forward one. When an index walks off the end of the array, it goes back to slot 0. Draw the array as a circle and the two indices chase each other around the **[[ring|ring-picture]]**.

When head and tail are equal, the consumer has read everything the producer wrote: the ring is **empty**. The tricky case is **full**. If the producer were allowed to fill every slot, head would come all the way round and equal tail again, and "full" would look exactly like "empty".

There are two standard ways out:

1. **Keep one slot empty.** The ring counts as full when moving head forward would make it equal tail. So an $N$-slot ring holds at most $N - 1$ items. This is what the exercise solution does.
2. **Use counters instead of positions.** Let head and tail count every item ever pushed and popped, and never wrap them by hand. The slot is `count % N`. Empty is `head == tail`, full is `head - tail == N`, and all $N$ slots are usable. It relies on unsigned arithmetic wrapping round, which is well defined in C++, and it works across the **[[wrap|counter-wrap]]** as long as $N$ is a power of two.

::: key Empty and full in a ring buffer
With the one-empty-slot rule: empty is `head == tail`; full is `next(head) == tail`; an N-slot ring holds N minus 1 items. With free-running counters: empty is `head == tail`, full is `head - tail == N`, and all N slots are used.
:::

For comparison, here is `push` and `pop` in the counters form. A test that pushes into a 4-slot ring until it refuses reports 4 items stored, where the one-empty-slot ring would stop at 3.

```cpp
bool push(const T& v) {
    const std::size_t h = head_.load(std::memory_order_relaxed);
    if (h - tail_.load(std::memory_order_acquire) == N) return false;  // full
    buf_[h & (N - 1)] = v;
    head_.store(h + 1, std::memory_order_release);
    return true;
}
bool pop(T& out) {
    const std::size_t t = tail_.load(std::memory_order_relaxed);
    if (t == head_.load(std::memory_order_acquire)) return false;      // empty
    out = buf_[t & (N - 1)];
    tail_.store(t + 1, std::memory_order_release);
    return true;
}
```

### Power-of-two capacity and masking

Moving an index forward means `next = (i + 1) % N`. The `%` is a division, and an integer division takes many cycles on most processors. If $N$ is a power of two, there is a cheaper way. $N - 1$ is then a block of ones in binary: for $N = 8$, $N - 1 = 7 = 0\text{b}111$. The bitwise AND `i & (N - 1)`, read "i and N minus one", keeps the low three bits of `i` and throws the rest away, which is exactly the remainder after dividing by 8.

Check it with numbers. $13 = 0\text{b}1101$. Keep the low three bits, $0\text{b}101 = 5$. And $13 \bmod 8 = 5$. For $N = 1024$: $1025 \mathbin{\&} 1023 = 1$ and $1024 \mathbin{\&} 1023 = 0$, the same as the remainders. So the solution writes `(h + 1) & (N - 1)`, and it enforces the power of two at compile time:

```cpp
static_assert(N >= 2 && (N & (N - 1)) == 0, "N must be a power of two");
```

That test works because a power of two has exactly one bit set, and subtracting one clears that bit and sets every bit below it, so the AND of the two is zero. For any other number, the highest set bit survives and the AND is not zero.

::: warning Masking with a size that is not a power of two
`i & (N - 1)` equals `i % N` only when N is a power of two. With N = 10, `12 & 9` is 8, not 2, and the ring silently writes into the wrong slots. Keep the `static_assert`: it turns the mistake into a compile error.
:::

## Which orderings, and why each one

Each index has exactly one writer. That single fact decides every ordering in the ring.

**Reading your own index: relaxed.** The producer is the only thread that writes head, so when the producer reads head it always gets its own last value. No other thread's work needs to be seen through it. The same holds for the consumer and tail.

**The producer's head store: release.** This is the publish step. The producer writes the item into `buf[h]`, *then* stores the new head. Release means every write before the store, including the item, is visible to any thread whose acquire load reads that head value.

**The consumer's head load: acquire.** When the consumer loads head with acquire and sees the new value, the release store synchronizes with this load (lesson 07). So the write of `buf[h]` happens before the consumer's read of `buf[h]`. That is the happens-before arrow that makes reading the slot race-free.

**The consumer's tail store: release, and the producer's tail load: acquire.** This pair runs the other way, and it is easy to forget. Its message is "I have finished reading slot t; you may reuse it". Without it, the producer could overwrite slot `t` while the consumer is still copying out of it, a race on the slot in the other direction.

::: key The orderings in an SPSC ring
Own index: relaxed load. Other side's index: acquire load. Own index after touching the slot: release store. The producer's release on head publishes the item; the consumer's acquire on head sees it. The consumer's release on tail frees the slot; the producer's acquire on tail sees it free.
:::

Here is the ring from the exercise, with a test: a producer writes the sequence numbers 0 to 999,999, a consumer checks it receives each one exactly once, in order.

::: example The SPSC ring, a million items, and ThreadSanitizer
```cpp
#include <array>
#include <atomic>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <thread>

// Capacity N must be a power of two. One slot is kept empty, so
// head == tail means empty and next(head) == tail means full.
template <typename T, std::size_t N>
class SpscRing {
    static_assert(N >= 2 && (N & (N - 1)) == 0, "N must be a power of two");
public:
    bool push(const T& v) {                                  // producer only
        const std::size_t h = head_.load(std::memory_order_relaxed);
        const std::size_t next = (h + 1) & (N - 1);
        if (next == tail_.load(std::memory_order_acquire)) return false;  // full
        buf_[h] = v;
        head_.store(next, std::memory_order_release);        // publishes buf_[h]
        return true;
    }

    bool pop(T& out) {                                       // consumer only
        const std::size_t t = tail_.load(std::memory_order_relaxed);
        if (t == head_.load(std::memory_order_acquire)) return false;     // empty
        out = buf_[t];
        tail_.store((t + 1) & (N - 1), std::memory_order_release);        // frees slot t
        return true;
    }

private:
    std::array<T, N> buf_{};
    alignas(64) std::atomic<std::size_t> head_{0};   // written by producer
    alignas(64) std::atomic<std::size_t> tail_{0};   // written by consumer
};

int main() {
    constexpr std::uint32_t kCount = 1'000'000;
    static SpscRing<std::uint32_t, 1024> ring;

    std::uint64_t full_spins = 0, empty_spins = 0;
    std::uint32_t received = 0;
    bool ok = true;

    {
        std::jthread producer([&] {
            for (std::uint32_t seq = 0; seq < kCount; ++seq)
                while (!ring.push(seq)) ++full_spins;        // full: try again
        });
        std::jthread consumer([&] {
            std::uint32_t expected = 0, v = 0;
            while (received < kCount) {
                if (!ring.pop(v)) { ++empty_spins; continue; }  // empty: try again
                if (v != expected) ok = false;               // gap or duplicate
                ++expected;
                ++received;
            }
        });
    }   // both jthreads join here

    std::printf("received %u, sequence %s\n", received, ok ? "ok" : "BROKEN");
    std::printf("producer found it full %llu times, consumer found it empty %llu times\n",
                (unsigned long long)full_spins, (unsigned long long)empty_spins);
}
```

Save it as `ring.cpp`. Built with `g++ -std=c++20 -Wall -Wextra -O2`, on one machine (4 cores):

```text
received 1000000, sequence ok
producer found it full 805697 times, consumer found it empty 497959 times
```

Built with `g++ -std=c++20 -Wall -Wextra -O1 -g -fsanitize=thread`:

```text
received 1000000, sequence ok
producer found it full 245562 times, consumer found it empty 3994 times
```

ThreadSanitizer printed no warnings, and the exit status was 0. Walk through it:

1. **The check.** The consumer expects 0, then 1, then 2, and so on. Any lost item would show as a gap, and any item read twice as a repeat; either one sets `ok` to false. It stayed true for all 1,000,000.
2. **The spin counts.** When `push` returns false the producer tries again, and likewise the consumer on an empty ring. The counts swing wildly from run to run, from a few thousand to several hundred thousand, depending on which thread the operating system happened to run faster. That is normal. Only the first line must be the same every time.
3. **The capacity.** `SpscRing<std::uint32_t, 1024>` holds at most 1,023 items. The ring is `static`, so it lives for the whole program instead of on `main`'s stack.
4. **Why `main` may read `received` and `ok`.** Those are plain variables written by the consumer thread. They are read only after the closing brace, where both `jthread`s have joined, and a join synchronizes with the joining thread.
5. **The whole run** took between about 45 and 100 ms of wall time on this machine, program start included, varying from run to run.

Now make one change: write the head store as `head_.store(next, std::memory_order_relaxed);` and save it as `ring_bug.cpp`. Built with `-O2`, it still prints `received 1000000, sequence ok`. Built with `-fsanitize=thread`, ThreadSanitizer says (stack frames and build ids trimmed):

```text
WARNING: ThreadSanitizer: data race (pid=17350)
  Read of size 4 at 0x55f217363080 by thread T2:
    #0 SpscRing<unsigned int, 1024ul>::pop(unsigned int&) ring_bug.cpp:26
  Previous write of size 4 at 0x55f217363080 by thread T1:
    #0 SpscRing<unsigned int, 1024ul>::push(unsigned int const&) ring_bug.cpp:18
  Location is global 'main::ring' of size 4224 at 0x55f217363080
SUMMARY: ThreadSanitizer: data race ring_bug.cpp:26 in SpscRing<unsigned int, 1024ul>::pop(unsigned int&)
```

and exits with status 66. Line 18 is `buf_[h] = v;` and line 26 is `out = buf_[t];`. With a relaxed head store there is no synchronizes-with link, so no happens-before arrow from the slot write to the slot read: a data race on the array, exactly as the rule predicts.

Sanity check on the size in that report: 1,024 slots of 4 bytes is 4,096 bytes, then head and tail each start a new 64-byte block, $4{,}096 + 64 + 64 = 4{,}224$ bytes. It matches.
:::

::: warning A passing stress test is not a proof
The relaxed version passed a million-item test, and on this machine it always will: g++ produced *identical* machine code for both versions, because on x86-64 an ordinary store already behaves like a release store. The same source on an **[[ARM|arm-barriers]]** flight computer compiles differently, and the bug can fire there. That is why the test must run under **[[ThreadSanitizer|tsan-how]]**, which checks the happens-before rules themselves, not what one processor happened to do.
:::

## Keeping head and tail apart

Look at the two `alignas(64)` in the class. They put head and tail in different 64-byte blocks of memory. A processor moves memory between its cores in blocks of that size, called **cache lines** (`getconf LEVEL1_DCACHE_LINESIZE` prints 64 on this machine). If head and tail shared a line, every push by one core would snatch the line away from the other core, even though the two threads never write the same variable. That slowdown is called **false sharing**, and lesson 10 measures it and introduces `std::hardware_destructive_interference_size`. The picture of this ring's **[[layout|ring-layout]]** is in the note.

The alignment changes speed, not correctness. The orderings above are what make the ring correct.

It does not always change speed for the better, either. In this simple ring each side reads the *other* side's index on every push and pop, so that line bounces between the cores anyway. Lesson 10 measures it and finds that the padding only pays once each side keeps a private copy of the other's index and rereads it rarely. Measure before you trust the padding.

## Progress guarantees: lock-free is not wait-free

"Lock-free" is used loosely to mean "has no mutex". It has a precise meaning, one of a ladder of **[[progress guarantees|herlihy]]** that say what can stop a thread from finishing.

Picture three doors. A locked door with one key: if the key-holder falls asleep in the doorway, nobody gets through. A revolving door: somebody is always getting through, though a shy person might keep getting pushed back round. A row of turnstiles, one per person: everybody gets through within a fixed number of steps. Those are blocking, lock-free and wait-free, and there is one more rung between the first two.

- **Blocking.** A thread can be stopped forever by another thread that is paused. A mutex is blocking: if the holder is descheduled, every waiter waits.
- **Obstruction-free.** A thread finishes in a bounded number of steps *if the other threads pause*. Contention can still make everyone retry forever.
- **Lock-free.** At every moment, *some* thread finishes its operation in a bounded number of steps. The system as a whole never stalls. But one particular thread may be unlucky again and again: it can **starve**.
- **Wait-free.** *Every* thread finishes each operation in a bounded number of its own steps, whatever the others are doing.

Each level includes the ones above it: wait-free implies lock-free, which implies obstruction-free. Real-time analysis needs a bound on *this* task's time, so wait-free is the property it wants.

::: key Lock-free versus wait-free
Lock-free guarantees that some thread makes progress, so the system cannot stall as a whole. Wait-free guarantees every thread completes its operation in a bounded number of steps, which is the stronger property real-time analysis actually wants.
:::

**The SPSC ring's push and pop are wait-free.** Read `push` again: two loads, one compare, one copy, one store, and return. There is no loop inside it, and it never waits for the other thread. If the ring is full it returns `false` at once. The retry loop in the test belongs to the *caller*, and it was the test's choice. A flight producer does something else: it **[[drops the record and counts the drop|drop-policy]]**, and the control task moves on.

**A compare-and-swap loop is lock-free, but not wait-free.** Some updates cannot be done by one atomic instruction. The usual tool is `compare_exchange_weak(expected, desired)`, read "compare exchange weak": if the variable still holds `expected`, write `desired` and return true; otherwise load the current value into `expected` and return false. You loop until it succeeds. A thread's attempt fails only because another thread's attempt succeeded in between, so someone always makes progress: lock-free. But nothing bounds how many times one thread can lose.

::: example Counting the retries of a CAS loop
A counter must never pass a limit, so `fetch_add` cannot be used. Four threads each add one, a million times, through a CAS loop, and record how often they lost.

```cpp
#include <atomic>
#include <cstdint>
#include <cstdio>
#include <thread>
#include <vector>

std::atomic<std::uint32_t> g_events{0};
constexpr std::uint32_t kLimit = 4'000'000'000u;   // saturate here, never wrap

struct Stats { std::uint64_t retries = 0, worst = 0; };

// Add 1, but never past kLimit. fetch_add cannot do this, so: a CAS loop.
void saturating_increment(Stats& s) {
    std::uint32_t old = g_events.load(std::memory_order_relaxed);
    std::uint64_t tries = 0;
    while (old < kLimit &&
           !g_events.compare_exchange_weak(old, old + 1, std::memory_order_relaxed)) {
        ++tries;                     // someone else got there first; old was refreshed
    }
    s.retries += tries;
    if (tries > s.worst) s.worst = tries;
}

int main() {
    constexpr int kThreads = 4, kPerThread = 1'000'000;
    std::vector<Stats> stats(kThreads);
    {
        std::vector<std::jthread> ts;
        for (int i = 0; i < kThreads; ++i)
            ts.emplace_back([&stats, i] {
                Stats local;                             // private while counting
                for (int k = 0; k < kPerThread; ++k) saturating_increment(local);
                stats[i] = local;
            });
    }
    std::printf("final count %u\n", g_events.load());
    for (int i = 0; i < kThreads; ++i)
        std::printf("thread %d: %llu retries, worst single call %llu retries\n", i,
                    (unsigned long long)stats[i].retries, (unsigned long long)stats[i].worst);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, on one machine (4 cores), one run:

```text
final count 4000000
thread 0: 324817 retries, worst single call 20 retries
thread 1: 342595 retries, worst single call 16 retries
thread 2: 327247 retries, worst single call 18 retries
thread 3: 357275 retries, worst single call 18 retries
```

Walk through it:

1. **The total is right.** $4 \times 1{,}000{,}000 = 4{,}000{,}000$. No increment was lost, because a CAS only writes if nobody changed the value since it was read.
2. **Retries are common.** Each thread lost about a third of a million times, roughly one failed attempt for every three increments. Every failure meant some *other* thread's CAS had succeeded in between, which is the lock-free guarantee at work.
3. **The worst case is not bounded.** In this run the unluckiest single call retried 20 times before it got through. In another run the worst was 45. Nothing in the code or the hardware puts a ceiling on that number. With more threads, or one thread often interrupted at the wrong moment, it can grow. That is exactly what "not wait-free" means.
4. **Why `Stats local`.** Each thread counts in a private variable and copies it out once at the end, so the threads do not fight over neighboring memory while measuring (lesson 10 explains why that would matter).

Sanity check: about 330,000 retries per thread against 1,000,000 successes is about 0.33 failures per success, well under one. With four threads hammering one variable, most attempts still win, which fits a machine with four cores taking turns on one cache line.
:::

::: note Where the ring sits on the ladder, precisely
Push and pop each take a fixed number of steps, so each is wait-free, provided the loads and stores are themselves single instructions, which `static_assert(std::atomic<std::size_t>::is_always_lock_free)` confirms (lesson 07). Even `fetch_add` depends on the processor: on x86-64 it is one instruction and wait-free, while some ARM processors implement it as a small retry loop, which makes it only lock-free.
:::

## Check yourself

::: check
A ring has N = 8 slots and uses the one-empty-slot rule. Head is 5 and tail is 6. Is the ring empty, full, or neither? How many items does it hold?
:::

::: answer
Full. The next head would be $(5 + 1) \mathbin{\&} 7 = 6$, which equals tail, so the rule says full. The items sit in slots 6, 7, 0, 1, 2, 3, 4: seven items, which is $N - 1 = 7$, the most this ring can hold. Slot 5 is the one kept empty. It is not empty, because empty needs head equal to tail, and 5 is not 6.
:::

::: check
The same ring uses free-running 64-bit counters instead, with capacity 8. After a long run, head is 1,000,003 and tail is 999,996. Which slot does the next push write, and is there room?
:::

::: answer
$\text{head} - \text{tail} = 1{,}000{,}003 - 999{,}996 = 7$ items, fewer than 8, so there is room for one more. The next push writes slot $1{,}000{,}003 \mathbin{\&} 7$. Since $1{,}000{,}000 = 8 \times 125{,}000$, the remainder of 1,000,003 is 3, so slot 3. After that push, head minus tail is 8, and the ring is full with all 8 slots in use.
:::

::: check
A colleague changes the producer's tail load from acquire to relaxed and keeps everything else. The head orderings are untouched. Is the ring still correct? What could go wrong?
:::

::: answer
No. The consumer's release store of tail says "I finished reading slot t". The producer's acquire load is what makes that finished read happen before the producer's next write into slot t. With a relaxed load there is no happens-before arrow, so the producer's write into a slot it sees as freed can conflict with the consumer's read of the same slot. That is a data race on the array in the reuse direction. Try it: with that one change, ThreadSanitizer reports the producer's write on line 18 racing with the consumer's read on line 26.
:::

::: check
A logging function uses a mutex. The logger thread is always the only one holding it for more than a microsecond. The control task locks it once per cycle. Name the progress guarantee, and say why a real-time engineer objects even though the logger is "fast".
:::

::: answer
It is blocking. If the operating system deschedules the logger while it holds the mutex, perhaps to run a medium-priority task, the control task waits for as long as that lasts, with no bound set by the control task's own code. That is the priority inversion of lesson 12. Speed in the average case does not help: the analysis needs a worst-case bound, and a blocking design only has one if every thread that can hold the lock is analyzed too. A wait-free ring gives the control task a bound that depends only on its own steps.
:::

::: check
Why does `SpscRing` fail badly if two threads both call `push`? Point to the exact line.
:::

::: answer
Both producers can read the same head value `h` with their relaxed loads, both see room, both write `buf_[h]`, one overwriting the other, and both store the same `next`. One item is lost, and the two writes to `buf_[h]` are a data race. The line is `const std::size_t h = head_.load(std::memory_order_relaxed);` followed by the plain store of head: the design assumes a single writer of head. With several producers, head must be claimed with a compare-and-swap, and the ring becomes a harder multi-producer design that is at best lock-free, not wait-free.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Ring buffer | array used in a circle | producer writes at head, consumer reads at tail |
| Empty / full | one empty slot kept | empty `head == tail`; full `next(head) == tail`; holds N minus 1 |
| Counters variant | free-running counts | full when `head - tail == N`; all N slots used |
| Masking | `i & (N - 1)` | equals `i % N` only for power-of-two N |
| Orderings | who owns what | own index relaxed; other's acquire; own store release |
| Cache-line separation | `alignas(64)` on head and tail | speed, not correctness; lesson 10 |
| Testing | stress test plus TSan | a pass on x86 proves nothing about ordering |
| Lock-free | some thread always progresses | a CAS loop; retries unbounded per thread |
| Wait-free | every thread bounded | SPSC push and pop; what real-time analysis wants |

Next lesson zooms in on the `alignas(64)` in the ring: it measures false sharing, where two threads writing different variables on one cache line slow each other down, and shows the standard's constant for the line size.

::: context telemetry The data a vehicle sends home
Telemetry is the stream of measurements a vehicle sends to the ground: times, positions, attitudes, temperatures, voltages, counters and error flags. It is packed into frames and sent over the radio downlink, whose rate is limited, so the flight software chooses what to send and how often. The control task produces the raw values far faster than the radio can send them, which is why a buffer sits between the two.
:::

::: context ring-picture The ring, drawn
Eight slots in a circle. Filled slots hold items the consumer has not read yet. The producer writes at head and moves clockwise; the consumer reads at tail and follows. When head catches up to one behind tail, the ring is full.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g transform="translate(180,100)">
    <path d="M0,0 L0,-80 A80,80 0 0,1 56.57,-56.57 Z" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M0,0 L56.57,-56.57 A80,80 0 0,1 80,0 Z" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M0,0 L80,0 A80,80 0 0,1 56.57,56.57 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M0,0 L56.57,56.57 A80,80 0 0,1 0,80 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M0,0 L0,80 A80,80 0 0,1 -56.57,56.57 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M0,0 L-56.57,56.57 A80,80 0 0,1 -80,0 Z" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M0,0 L-80,0 A80,80 0 0,1 -56.57,-56.57 Z" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M0,0 L-56.57,-56.57 A80,80 0 0,1 0,-80 Z" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <circle r="28" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="27" y="-60" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
    <text x="61" y="-22" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
    <text x="61" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
    <text x="27" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
    <text x="-27" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
    <text x="-61" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">5</text>
    <text x="-61" y="-22" font-size="12" text-anchor="middle" fill="#1f2a44">6</text>
    <text x="-27" y="-60" font-size="12" text-anchor="middle" fill="#1f2a44">7</text>
  </g>
  <text x="300" y="115" font-size="12" fill="#1d6fd1">tail = 2</text>
  <line x1="298" y1="112" x2="262" y2="120" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="20" y="180" font-size="12" fill="#b4232c">head = 5</text>
  <line x1="80" y1="170" x2="115" y2="150" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">items in slots 2, 3, 4</text>
</svg>
```
:::

::: context counter-wrap Why wrapping counters still work
Unsigned integers in C++ wrap round: after the largest value comes 0, by definition, not by accident. The difference `head - tail` is computed with the same wrap, so it stays correct even after head has wrapped and tail has not, as long as the true difference is small. The slot, `count & (N - 1)`, also stays continuous across the wrap when N is a power of two, because N divides $2^{64}$. A 64-bit counter at a billion pushes per second would wrap after about 585 years. A 32-bit counter at 1 kHz wraps after about 49.7 days, and the ring keeps working through it.
:::

::: context arm-barriers Same source, different machine code
x86-64 processors already keep ordinary stores in order with each other and ordinary loads in order with each other, so a release store and an acquire load compile to plain moves. The ordering only restrains the compiler. ARM processors, common in flight computers and phones, reorder much more, so on 64-bit ARM a release store becomes the special instruction `stlr` and an acquire load becomes `ldar`, while relaxed ones are plain `str` and `ldr`. A missing release that is harmless in practice on x86 can reorder on ARM.
:::

::: context tsan-how How ThreadSanitizer knows
ThreadSanitizer, built into GCC and Clang with `-fsanitize=thread`, adds a check to every memory access and every synchronizing operation. It keeps, for each thread, a record of what that thread has synchronized with, and for recently touched memory, which thread last accessed it and when. Two conflicting accesses with no happens-before path between them are reported, whether or not anything went wrong on this run. The LLVM documentation lists a typical slowdown of 5 to 15 times and a memory cost of 5 to 10 times, so it runs in tests, not in flight.
:::

::: context ring-layout The ring's bytes
`SpscRing<std::uint32_t, 1024>` is 4,224 bytes. The array fills the first 4,096. `alignas(64)` starts head on a new 64-byte cache line, and tail on the next one, so the producer's writes to head and the consumer's writes to tail never touch the same line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="230" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="125" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">buf_: 1,024 slots, 4,096 bytes</text>
  <rect x="240" y="30" width="55" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="267" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">head_</text>
  <rect x="295" y="30" width="55" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="322" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">tail_</text>
  <text x="10" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">0</text>
  <text x="240" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">4096</text>
  <text x="295" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">4160</text>
  <text x="345" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">4224</text>
  <text x="295" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">one 64-byte line each</text>
</svg>
```

The drawing is not to scale: the array is 64 times longer than each index's line.
:::

::: context herlihy Where the ladder comes from
The precise definitions of wait-free and lock-free come from the study of concurrent algorithms in the late 1980s and early 1990s. Maurice Herlihy's 1991 paper "Wait-free synchronization" is the landmark: it showed that some atomic instructions are strictly more powerful than others, and that compare-and-swap is strong enough to build any shared object in a wait-free way, at a cost. Obstruction-freedom was named later, in 2003, by Herlihy, Victor Luchangco and Mark Moir.
:::

::: context drop-policy What a flight producer does when the ring is full
A control task must not wait, so when `push` returns false it has two choices: drop the new record, or overwrite the oldest one, which needs a design where the producer may advance tail too. Either way it increments a dropped-records counter that goes down in the health telemetry. Ground operators then see that records were lost and how many, instead of a control loop that quietly ran late. The ring's size is chosen from the worst-case gap between consumer runs, so drops mean something else went wrong.
:::
