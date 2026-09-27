---
id: l05-interrupt-service-routines
title: Interrupt service routines
minutes: 24
covers:
  - 'Interrupt service routines: what you may and may not do inside one'
---

You are cooking dinner and the doorbell rings. You put the spoon down, walk to the door, sign for the package, set it inside, and walk back to the stove. The whole trip takes thirty seconds and the sauce does not burn.

What you do *not* do is open the box at the door, read the instructions and build the bookshelf while dinner smokes on the stove. And you certainly do not stand at the door waiting for someone in the kitchen to hand you a pen — there is nobody in the kitchen, because you are the one who was cooking.

A flight computer gets doorbells all the time: a new gyro reading is ready, a byte arrived on a radio link, a timer ticked. The code that answers each one is an **interrupt service routine**, and it follows the same rules as you at the door. This lesson explains what an interrupt is, why the rules are so strict, and the standard way to hand work from the door back to the kitchen.

## What an interrupt is

Most of the time a processor runs your program one instruction after another. An **interrupt** is a signal from hardware that says "stop what you are doing and deal with me now". A sensor raises one when a measurement is ready. A serial port raises one when a byte arrives. A hardware timer raises one on every tick.

When an interrupt arrives, the processor finishes the instruction it is on, saves the registers it was using, and jumps to a function registered for that interrupt. The address of each handler lives in a table at a fixed place in memory, the **[[vector table|vector-table]]**. The handler is the **interrupt service routine**, or **ISR** — a function the hardware calls, not your code. When the ISR returns, the processor restores the saved registers and carries on with the interrupted instruction stream as if nothing had happened.

Three facts about that trip shape everything else.

- **It can happen between any two instructions.** Your control task does not get to choose. It might be halfway through updating a three-number vector when the ISR runs.
- **The interrupted code is frozen until the ISR returns.** On a single-core processor there is nobody else to run it. The task cannot finish anything, release anything or answer anything while the ISR is running.
- **Interrupts have priorities.** A higher-priority interrupt can interrupt a lower-priority ISR (this is called **nesting**), but an ISR blocks every interrupt of its own priority and below until it returns.

The time from the hardware raising the signal to the first instruction of the ISR is the **[[interrupt latency|latency]]**. On a small microcontroller it is a few dozen clock cycles at best. On a vehicle, interrupts come from the inertial measurement unit's "data ready" line (often at 1 kHz or more), from serial links carrying GPS and telemetry, and from the timer that starts each control cycle.

## What an ISR must not do

Every rule below comes from those three facts. Take them one at a time.

**Do not block.** To *block* is to stop and wait for something: a message, a semaphore, a flag, a byte. An ISR that waits is waiting for some other code to act. But the code most likely to act is the task it interrupted, which is frozen until the ISR returns. So the ISR waits forever. You, at the door, waiting for someone in the kitchen to bring a pen.

**Do not take a lock that ordinary code can hold.** This is the same trap with a name. Suppose the navigation task takes a mutex to update the shared state, and in the middle of that update the interrupt fires. The ISR tries to take the same mutex. The mutex is held by the task, the task cannot run until the ISR returns, and the ISR cannot return until it gets the mutex. That is a **[[deadlock|deadlock-picture]]**: two parties each waiting for the other, forever. The same happens inside library calls that lock internally, which is why the next rule exists.

**Do not allocate.** The previous lesson showed that `new` has no bounded worst-case time. There is a second reason here: most allocators protect their records with a lock. If the interrupted task was in the middle of `new` when the ISR ran and the ISR also calls `new`, the ISR deadlocks on the allocator's lock — or, with no lock, corrupts the allocator's records.

**Do not call anything with unbounded runtime.** `printf`, writing to a log file, formatting strings, walking a list whose length depends on the data, erasing a block of flash memory: each can take a long and unpredictable time, and many lock or allocate inside.

**Do not do heavy work.** Even bounded work costs something if it is long. While the ISR runs, the control task is frozen and every interrupt of equal or lower priority waits. A 30-microsecond Kalman filter update inside an ISR delays everything else by 30 microseconds, on every interrupt. And if the ISR takes longer than the gap between two of its own interrupts, the next one is missed.

::: key What you may not do inside an ISR
Block, allocate, take a lock that a non-interrupt context can hold, call anything with unbounded runtime, or do heavy work. The idiom is to capture the minimum state, set a flag or push into a lock-free queue, and return.
:::

::: warning The debugging `printf` that breaks the system
The most common slip is adding a `printf` to an ISR "for a minute" to see whether it runs. `printf` formats text (slow), may lock the output stream (deadlock risk), and on many embedded setups sends characters out a slow serial port one by one. The timing of the whole system changes while you are measuring it, and the bug you were chasing may vanish or a new one may appear. Instead, increment a counter in the ISR and print the counter from a task.
:::

## Capture, hand off, return

So what *should* an ISR do? The same three steps as you at the door.

1. **Capture** the minimum state: read the data register, note the time. Hardware often overwrites its buffer on the next sample, so the data must be copied out now.
2. **Hand it off** to a task: set a flag, or copy the data into a slot of a queue that the task will empty.
3. **Acknowledge and return**: clear the interrupt's pending flag (so it does not fire again at once) and get out.

All the real work — filtering, estimating, logging — happens later in an ordinary task, where blocking and long computations are allowed and timing is planned. Engineers call this split **[[top half and bottom half|top-bottom-half]]**, or deferred work.

The best hand-off tool is the one from the concurrency module: a **single-producer, single-consumer queue** (SPSC queue) over static storage. The ISR is the only producer and the task is the only consumer, so no lock is needed — each side only ever moves its own index. Pushing never waits. If the queue is full, the ISR does not wait for space. It counts an **overrun** (a sample lost because there was nowhere to put it) and returns, and the task reports the count as a fault. The slots were reserved at start-up, so nothing is allocated.

::: example A Cortex-M ISR, down to the instructions
Here is an ISR for an analog-to-digital converter (ADC) on an ARM Cortex-M4 microcontroller. The register addresses are placeholders; real ones come from the chip's reference manual. `SpscQueue` is a lock-free ring of the kind built in the concurrency module: two `std::atomic<std::uint32_t>` indices, `try_push` returns `false` when full, and a `static_assert` checks that the atomics are lock-free on this processor.

```cpp
// Placeholder addresses: the real ones come from the chip's reference manual.
constexpr std::uintptr_t kAdcStatus = 0x40012000u;
constexpr std::uintptr_t kAdcData   = 0x4001204Cu;
inline volatile std::uint32_t& reg32(std::uintptr_t addr) {
    return *reinterpret_cast<volatile std::uint32_t*>(addr);
}

struct Reading { std::uint32_t tick; std::uint16_t counts; };

SpscQueue<Reading, 32> g_adc_queue;          // static storage, built at start-up
std::atomic<std::uint32_t> g_tick{0};
std::atomic<std::uint32_t> g_adc_overruns{0};

extern "C" void ADC_IRQHandler() {
    const Reading r{g_tick.load(std::memory_order_relaxed),
                    static_cast<std::uint16_t>(reg32(kAdcData))};  // capture
    reg32(kAdcStatus) = 0;                                          // acknowledge
    if (!g_adc_queue.try_push(r))                                   // hand off
        g_adc_overruns.fetch_add(1, std::memory_order_relaxed);     // count, never wait
}                                                                   // return
```

Compiled with `arm-none-eabi-g++ -std=c++20 -O2 -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16 -fno-exceptions -fno-rtti` (GCC 13.2), the disassembler shows the normal path — capture, acknowledge, push, return — is 22 instructions, with no calls to any other function:

```text
00000000 <ADC_IRQHandler>:
   0:	push	{r4}
   2:	ldr	r3, [pc, #80]	@ (54 <ADC_IRQHandler+0x54>)
   4:	ldr	r2, [pc, #80]	@ (58 <ADC_IRQHandler+0x58>)
   6:	ldr	r4, [r3, #0]
   8:	ldr	r0, [r2, #76]	@ 0x4c
   a:	movs	r1, #0
   c:	str	r1, [r2, #0]
   ...
  2e:	dmb	ish
  32:	str.w	r2, [r3, #260]	@ 0x104
  36:	ldr.w	r4, [sp], #4
  3a:	bx	lr
```

Read a few lines. At `8` it loads the data register (offset `0x4c` from the ADC's base address). At `c` it writes zero to the status register — the acknowledge. The `dmb` instructions are memory barriers that the `std::memory_order_release` store needs, so the task sees the slot's contents before it sees the new index. At `3a`, `bx lr` returns. On a Cortex-M the hardware saves the task's registers by itself on entry, which is why a plain C++ function can be an ISR, and why `extern "C"` is there: it keeps the name exactly `ADC_IRQHandler` so the vector table can find it.

Twenty-two instructions at, say, 100 MHz is well under a microsecond. That is the size an ISR should be.
:::

::: warning `volatile` is for hardware, not for sharing
`reg32` returns a `volatile` reference because a hardware register can change on its own, and every read and write must really happen. `volatile` does *not* make data safe to share between an ISR and a task: it gives no ordering and no protection from a **[[torn read|torn-read]]**. Shared variables must be `std::atomic` (checked lock-free), or the task must briefly switch interrupts off around its access. Keep such a switched-off stretch to a few instructions, because while it lasts every interrupt waits.
:::

## Trying the idiom on your own computer

A desktop program cannot install a real ISR, but it has something close: a **signal handler**. The operating system can interrupt your program between any two instructions, run a handler function, and then resume, exactly like an interrupt. Signal handlers even come with the same rule list, under the name **[[async-signal-safe|async-signal-safe]]**.

::: example A 1 kHz "interrupt" feeding a slower task
The handler below plays the ISR: a timer signal fires every $1000\,\mu\mathrm{s}$ (1 kHz), and each time the handler builds a 256-byte sample and copies it into a 16-slot SPSC queue. `main` plays the processing task: it wakes every 5 ms, drains the queue and does the "heavy" work (adding up the samples).

```cpp
// A host-side stand-in for an interrupt: a POSIX timer signal at 1 kHz.
// The handler plays the ISR; main() plays the processing task.
#include <atomic>
#include <csignal>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <sys/time.h>
#include <time.h>

struct Sample {                      // 256 bytes: one burst from a sensor
    std::uint32_t seq;
    std::int16_t counts[126];
};
static_assert(sizeof(Sample) == 256);

// Single-producer, single-consumer ring over static storage.
template <typename T, std::uint32_t N>
class SpscQueue {
    static_assert((N & (N - 1)) == 0, "N must be a power of two");
public:
    bool try_push(const T& item) {                 // producer only (the ISR)
        const std::uint32_t h = head_.load(std::memory_order_relaxed);
        const std::uint32_t t = tail_.load(std::memory_order_acquire);
        if (h - t == N) return false;              // full: refuse, never wait
        std::memcpy(&buf_[h % N], &item, sizeof(T));
        head_.store(h + 1, std::memory_order_release);
        return true;
    }
    bool try_pop(T& out) {                         // consumer only (the task)
        const std::uint32_t t = tail_.load(std::memory_order_relaxed);
        const std::uint32_t h = head_.load(std::memory_order_acquire);
        if (h == t) return false;                  // empty
        std::memcpy(&out, &buf_[t % N], sizeof(T));
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }
private:
    T buf_[N];
    std::atomic<std::uint32_t> head_{0};
    std::atomic<std::uint32_t> tail_{0};
};
static_assert(std::atomic<std::uint32_t>::is_always_lock_free);

constexpr std::uint32_t kWanted = 200;
SpscQueue<Sample, 16> g_queue;                     // static: built before main
std::atomic<std::uint32_t> g_produced{0};
std::atomic<std::uint32_t> g_dropped{0};

// ---- the "ISR": capture, copy, return --------------------------------
extern "C" void on_tick(int) {
    const std::uint32_t seq = g_produced.load(std::memory_order_relaxed);
    if (seq >= kWanted) return;
    Sample s;                                      // on the handler's stack
    s.seq = seq;
    for (int i = 0; i < 126; ++i) s.counts[i] = static_cast<std::int16_t>(seq + i);
    if (!g_queue.try_push(s)) g_dropped.fetch_add(1, std::memory_order_relaxed);
    g_produced.store(seq + 1, std::memory_order_relaxed);
}

int main() {
    struct sigaction sa {};
    sa.sa_handler = on_tick;
    sigemptyset(&sa.sa_mask);
    sigaction(SIGALRM, &sa, nullptr);

    itimerval tick{{0, 1000}, {0, 1000}};           // every 1000 us = 1 kHz
    setitimer(ITIMER_REAL, &tick, nullptr);

    std::uint32_t consumed = 0, max_backlog = 0;
    long long sum = 0;
    Sample s;
    while (consumed + g_dropped.load() < kWanted) {
        std::uint32_t this_round = 0;
        while (g_queue.try_pop(s)) {               // the heavy work lives here
            for (int i = 0; i < 126; ++i) sum += s.counts[i];
            ++consumed;
            ++this_round;
        }
        if (this_round > max_backlog) max_backlog = this_round;
        timespec nap{0, 5'000'000};                // task wakes every 5 ms;
        while (nanosleep(&nap, &nap) != 0) {}      // ticks cut the nap short
    }
    itimerval off{};
    setitimer(ITIMER_REAL, &off, nullptr);

    std::printf("produced %u, consumed %u, dropped %u\n",
                g_produced.load(), consumed, g_dropped.load());
    std::printf("checksum %lld, largest batch %u\n",
                sum, max_backlog);
}
```

One run on Linux with g++ 13:

```text
produced 200, consumed 200, dropped 0
checksum 4082400, largest batch 6
```

Every sample arrived. Check the checksum by hand: sample $s$ holds the numbers $s, s+1, \ldots, s+125$, so its total is $126s + (0 + 1 + \cdots + 125) = 126s + 7875$. Adding over $s = 0$ to $199$ gives $126 \times 19\,900 + 200 \times 7875 = 2\,507\,400 + 1\,575\,000 = 4\,082\,400$. It matches, so no sample was damaged on the way.

The task woke every 5 ms, so about 5 samples piled up each time. The largest batch was 6, because the task is sometimes a little late. That number can differ by one from run to run, since the timing depends on the machine.

The same program with only 4 slots printed `produced 200, consumed 150, dropped 50` on one run: the queue filled before the task woke, and the handler, which never waits, counted the overflow and moved on. That is the correct behavior of a too-small queue — lose data loudly, never hang.
:::

Notice what the handler does *not* do: no `printf`, no `new`, no lock, no loop that depends on anything but a constant. Its one loop runs exactly 126 times.

## How much time is too much

An ISR's cost is paid on every interrupt, so small numbers multiply fast. The fraction of the processor an ISR uses is its **load**:

$$
\text{load} = f \times t_{\text{ISR}},
$$

where $f$ is how many times per second it fires and $t_{\text{ISR}}$ (read "t sub ISR") is how long one call takes.

::: example What one `printf` costs at 10 kHz
A gyro raises a data-ready interrupt at $f = 10\,\mathrm{kHz}$ (10 000 times per second). A lean ISR takes $t_{\text{ISR}} = 2\,\mu\mathrm{s}$, which at 100 MHz is $100 \times 10^6 \times 2 \times 10^{-6} = 200$ clock cycles.

$$
\text{load} = 10\,000\,\mathrm{s^{-1}} \times 2 \times 10^{-6}\,\mathrm{s} = 0.02 = 2\%.
$$

Now someone adds a debug `printf` that takes about $30\,\mu\mathrm{s}$, so each call takes $32\,\mu\mathrm{s}$:

$$
\text{load} = 10\,000 \times 32 \times 10^{-6} = 0.32 = 32\%.
$$

A third of the processor now goes to one interrupt, taken away from the navigation and control tasks, and every lower-priority interrupt waits an extra $30\,\mu\mathrm{s}$ each time. The units check out: per second times seconds is a plain fraction. And the size makes sense: $32\,\mu\mathrm{s}$ out of every $100\,\mu\mathrm{s}$ gap is a third.
:::

::: example Sizing the hand-off queue
An IMU interrupt delivers one 256-byte sample every millisecond. The task that drains it normally runs every 5 ms, but under heavy load it can start up to 10 ms late. How many slots does the queue need?

The worst gap between two drains is $5 + 10 = 15\,\mathrm{ms}$. At one sample per millisecond, that is up to $15$ samples waiting. Queues like the one above use a power-of-two size (so `% N` is a cheap bit mask), so round up to $16$ slots. The storage is $16 \times 256 = 4096$ bytes, reserved at start-up.

Sanity check against the demo: the task there woke every 5 ms with almost no lateness and saw at most 6 samples waiting, comfortably inside 16. With 4 slots, a quarter of the samples were lost, as the arithmetic predicts: 5 or 6 arrive per nap, and only 4 fit.
:::

## Check yourself

::: check
A task holds a mutex while it copies a new guidance target into shared memory. A timer ISR that fires during that copy also wants to read the target, so it calls `lock()` on the same mutex. Walk through what happens on a single-core processor.
:::

::: answer
The ISR runs in the middle of the task's copy, so the task is frozen with the mutex still held. The ISR calls `lock()` and the mutex is taken, so the ISR waits. The only code that can release the mutex is the task, and the task cannot run until the ISR returns. The ISR never returns, the task never runs again: a deadlock. Every interrupt of equal or lower priority is blocked too. A watchdog (next lesson) is what finally rescues the processor. The fix is to never share a lock with an ISR: publish the target through an atomic or a lock-free queue, or let the task switch interrupts off for the few instructions of the copy.
:::

::: check
List the three steps of the ISR idiom and say, for each one, why it cannot be moved out of the ISR, or why everything else must be.
:::

::: answer
Capture: the hardware may overwrite its data register on the next sample, so the value must be copied out now, inside the ISR. Hand off: the task needs the data, so the ISR copies it into a preallocated slot of a lock-free SPSC queue (or sets a flag), which never waits and never allocates. Acknowledge and return: the pending flag must be cleared or the interrupt fires again at once, and returning quickly unfreezes the task and lets other interrupts in. Everything else — filtering, logging, formatting — is moved to a task, because in the ISR it would freeze the task, delay other interrupts and could miss the next sample.
:::

::: check
A UART (serial port) interrupt fires once per byte at $115\,200$ bits per second, with 10 bits per byte on the wire. How many interrupts per second is that, and what is the largest $t_{\text{ISR}}$ that keeps its load under $5\%$?
:::

::: answer
Bytes per second $= 115\,200 / 10 = 11\,520$, so $f = 11\,520$ interrupts per second. The gap between bytes is $1 / 11\,520 \approx 86.8\,\mu\mathrm{s}$. For load under $5\%$: $t_{\text{ISR}} < 0.05 / 11\,520 \approx 4.34 \times 10^{-6}\,\mathrm{s}$, about $4.3\,\mu\mathrm{s}$. That is about 434 cycles at 100 MHz — plenty for "read the byte, push it into a queue, return", and nowhere near enough for parsing a GPS message, which belongs in a task.
:::

::: check
Why does the hand-off queue's `try_push` return `false` when full instead of waiting for the task to make room?
:::

::: answer
Waiting is blocking. On a single core, room in the queue only appears when the task pops, and the task is frozen until the ISR returns, so a waiting ISR would wait forever. Returning `false` lets the ISR count an overrun and return on time. Losing one sample loudly (the counter becomes a health report) is far better than hanging the processor. And if overruns happen at all in testing, the queue is too small or the task is too slow, which the sizing arithmetic can fix.
:::

::: check
A teammate stores the latest altitude as a `volatile double` written by an ISR and read by the guidance task on a 32-bit processor. What can go wrong, and what would you change?
:::

::: answer
A `double` is 8 bytes, and a 32-bit processor may write it as two 4-byte halves. If the ISR fires between the task's two reads, the task gets half the old value and half the new one: a torn read that can be a wildly wrong number. `volatile` does not prevent that. Change it to go through the queue (the task pops whole samples), or use a `std::atomic` only if `is_always_lock_free` is true for it on this processor, or let the task switch interrupts off for the two instructions of the copy.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Interrupt | a hardware signal that makes the processor run a handler between any two instructions |
| ISR | the handler, found through the vector table; the interrupted code is frozen until it returns |
| Priorities | a higher priority can nest; an ISR blocks its own level and below |
| Forbidden in an ISR | blocking, allocating, locks shared with tasks, unbounded calls, heavy work |
| The idiom | capture the minimum, push into a lock-free queue or set a flag, acknowledge, return |
| SPSC hand-off | static slots, ISR is the only producer, full means count an overrun and return |
| Sharing | `volatile` for hardware registers; `std::atomic` or a short interrupts-off stretch for shared data |
| ISR load | $\text{load} = f \times t_{\text{ISR}}$ |
| Queue size | worst gap between drains times arrival rate, rounded up to a power of two |

An ISR that hangs, a deadlocked task, a loop that never ends: the next lesson, on watchdogs, heartbeats and health monitoring, is about how a vehicle notices that its software has stopped and gets it running again.

::: context vector-table A table of phone numbers
The vector table is a list of addresses at a fixed place in memory, one entry per interrupt source. When interrupt number 18 arrives, the processor looks up entry 18 and jumps there. Your job at start-up is to make sure every entry points at a real handler.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44">task running</text>
  <line x1="20" y1="40" x2="120" y2="40" stroke="#1d6fd1" stroke-width="6"/>
  <line x1="240" y1="40" x2="340" y2="40" stroke="#1d6fd1" stroke-width="6"/>
  <line x1="120" y1="40" x2="240" y2="40" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="180" y="32" font-size="11" text-anchor="middle" fill="#6c7a93">frozen</text>
  <line x1="120" y1="46" x2="120" y2="96" stroke="#b4232c" stroke-width="2"/>
  <polygon points="120,100 115,90 125,90" fill="#b4232c"/>
  <text x="112" y="72" font-size="11" text-anchor="end" fill="#b4232c">interrupt</text>
  <rect x="120" y="100" width="120" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">ISR</text>
  <line x1="240" y1="100" x2="240" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="240,46 235,56 245,56" fill="#1f2a44"/>
  <text x="248" y="80" font-size="11" fill="#1f2a44">return</text>
  <text x="180" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">address found in the vector table</text>
</svg>
```
:::

::: context latency Why latency is not zero
Before the first line of your ISR runs, the processor must finish its current instruction, save registers and fetch the handler's address. On an ARM Cortex-M3 or M4 with fast memory this takes about 12 clock cycles, done entirely in hardware.

Latency grows when something else is in the way: a higher-priority ISR already running, or a task that switched interrupts off for a while. The worst-case latency is the sum of those delays, and it is exactly why every ISR and every interrupts-off stretch must be short — each one adds to everybody else's latency.
:::

::: context deadlock-picture Two parties, each waiting for the other
A deadlock needs a cycle of waiting. Here the task holds the mutex and waits for the processor, which the ISR has; the ISR holds the processor and waits for the mutex, which the task has. Neither can move first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="50" width="110" height="50" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">task</text>
  <text x="75" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">holds mutex</text>
  <rect x="230" y="50" width="110" height="50" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">ISR</text>
  <text x="285" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">holds the CPU</text>
  <path d="M 130 60 C 170 20, 190 20, 226 56" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="230,60 219,57 226,49" fill="#b4232c"/>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#b4232c">waits for the CPU</text>
  <path d="M 230 92 C 190 132, 170 132, 134 96" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="130,92 141,95 134,103" fill="#b4232c"/>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#b4232c">waits for the mutex</text>
</svg>
```

On a desktop the operating system might eventually notice. On bare metal, only the watchdog will.
:::

::: context top-bottom-half Where the names come from
"Top half" and "bottom half" are the names the Linux kernel gives the two parts of interrupt handling. The top half is the ISR itself: fast, minimal, running with some interrupts held off. The bottom half is the deferred work, run later in a context where it may take its time.

Real-time operating systems use other names — "deferred procedure call", "deferred interrupt handling", or a high-priority task woken by the ISR — but the split is the same everywhere, because the reasons for it are the same everywhere.
:::

::: context torn-read Half old, half new
A 32-bit processor moves at most 4 bytes in one ordinary instruction, so reading an 8-byte `double` takes two loads. If an interrupt lands between them and rewrites the variable, the task ends up with the first half of the old value glued to the second half of the new one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="28" font-size="12" fill="#1f2a44">old value</text>
  <rect x="110" y="14" width="100" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="210" y="14" width="100" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="20" y="62" font-size="12" fill="#1f2a44">new value</text>
  <rect x="110" y="48" width="100" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="210" y="48" width="100" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="20" y="106" font-size="12" fill="#b4232c">task reads</text>
  <rect x="110" y="92" width="100" height="22" fill="#8fb8f0" stroke="#b4232c" stroke-width="2"/>
  <rect x="210" y="92" width="100" height="22" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="160" y="107" font-size="11" text-anchor="middle" fill="#1f2a44">first half: old</text>
  <text x="260" y="107" font-size="11" text-anchor="middle" fill="#1f2a44">second half: new</text>
</svg>
```

For a `double`, gluing halves from two different numbers can produce almost any value at all.
:::

::: context async-signal-safe The desktop version of the ISR rules
POSIX, the standard behind Linux and macOS system calls, lists the functions a signal handler may safely call. They are called async-signal-safe. The list includes `write`, `_exit` and a few dozen others. It does not include `printf` or `malloc`, for the same reason an ISR must avoid them: the handler may have interrupted the program in the middle of that very function, while its internal records were half updated.

Lock-free atomic operations are fine in a handler, which is why the demo's handler touches only atomics and its own queue.
:::
