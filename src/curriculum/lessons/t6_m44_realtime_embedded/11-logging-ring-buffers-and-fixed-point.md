---
id: l11-logging-and-fixed-point
title: Logging under a real-time budget, and fixed-point arithmetic
minutes: 21
covers:
  - "Logging and telemetry under a real-time budget: lock-free ring buffers and never blocking the control task"
  - Fixed-point arithmetic and when it is still the right answer
---

Picture a race-car driver at 300 km/h. A reporter wants to know everything: speed, lap times, how the tires feel. If the driver stops to write notes in a diary, the car crashes. So the car carries a small recorder that quietly writes numbers into a loop of memory, and the pit crew reads them later. The driver never waits for the recorder.

This lesson closes the module with two practical questions. First: how do you see what a real-time system actually did, without the act of recording it becoming the one thing that breaks the deadline? Second: when is floating point — the way you have stored real numbers everywhere else in this course — *not* the right choice, and what replaces it?

Both answers lean on what you already have: bounded blocking from lesson four, the primitives of lesson five, static allocation from lesson eight, and the determinism this module has been about from its first page.

## Logging without ever waiting

### How a proven loop still misses its deadline

Here is the most common way a control loop that was *proven* schedulable misses a deadline in practice. It is not the control law. It is the logging code sitting next to it.

A call to **[[printf|printf-cost]]** (C's formatted-print function), a blocking write to a file or a network socket, a lock shared with a lower-priority logger — any of these, run on the control task's own thread, brings back exactly the unbounded blocking that lessons four and five worked so hard to remove. And it does it for code whose only job is to let you *see*, not to control anything.

So a control task can be response-time-analyzed to the microsecond and still miss its deadline, because the debug line someone added blocked on a full buffer or a busy lock.

### Split capture from the slow work

The fix separates two jobs, in time as well as in code:

- **Capturing** the data. This must be tiny, fixed and never wait.
- **Doing something slow with it**: formatting it as text, writing it to flash memory, queuing it for the radio link to the ground (the **downlink**).

The control task only captures. It writes a fixed-size record into a preallocated **lock-free [[ring buffer|ring-picture]]** — lesson eight's static allocation, applied to logging. A **ring buffer** is an array used as a loop: when the writer reaches the end, it wraps around to the start. **Lock-free** means neither side ever takes a lock, so neither side can ever be made to wait by the other.

The capture step has three parts, and none of them can block, even for a moment:

1. Read the write index.
2. Store the record in that slot.
3. Publish the new index, so the reader can see the record.

A separate, lower-priority logging task — possibly on a different core that is not reserved for real-time work — reads from the same buffer whenever it gets scheduled. It does all the slow work. Its timing no longer touches the control task at all.

### Why no lock is needed

"Lock-free" is not a buzzword here. It is a claim you can check. The case a control task and its logger need is **single-producer, single-consumer (SPSC)**: exactly one task writes into the buffer (the **producer**) and exactly one task reads from it (the **consumer**).

The argument is about *who writes which variable*:

- The writer only ever changes its own **write index** (often called the head) and the slots it is filling.
- The reader only ever changes its own **read index** (the tail) and the slots it is emptying.
- Neither task ever writes a variable the other one writes.

With no variable written by both sides, there is no race for a lock to protect. What remains is an **ordering** question: the reader must never see the new index *before* the record it points to has really been written. Compilers and processors are allowed to reorder memory operations, so you must say what order you need. You do it with **[[atomic operations|acquire-release]]**:

- The writer publishes the new index with an atomic store using **release** ordering: "everything I wrote before this is finished before anyone sees this."
- The reader loads the index with an atomic load using **acquire** ordering: "once I see this, I also see everything written before it."

No mutex, and no way for the writer to block on the reader or the reverse.

This simple argument works only for *one* writer and *one* reader. With two producers, both would change the same write index — a variable two tasks both write. That is a genuinely harder problem. It needs a real atomic read-modify-write such as **[[compare-and-swap|compare-and-swap]]**, not plain loads and stores. Name it as a different problem; do not assume the easy argument stretches to cover it.

Here is the whole thing in C++, small enough to read in one go:

```cpp
#include <atomic>
#include <cstdint>
#include <cstdio>

struct Record { uint32_t cycle; float value; };   // fixed size, no pointers

template <uint32_t N>                             // N must be a power of two
class SpscRing {
  static_assert(N > 0 && (N & (N - 1)) == 0, "size must be a power of two");
  Record slots_[N];                               // preallocated, never grows
  std::atomic<uint32_t> head_{0};                 // written only by the producer
  std::atomic<uint32_t> tail_{0};                 // written only by the consumer
public:
  // Control task: never waits. If the buffer is full, drop and return false.
  bool push(const Record& r) {
    uint32_t h = head_.load(std::memory_order_relaxed);
    uint32_t t = tail_.load(std::memory_order_acquire);
    if (h - t == N) return false;                 // full
    slots_[h & (N - 1)] = r;                      // 1. store the record
    head_.store(h + 1, std::memory_order_release);// 2. then publish it
    return true;
  }
  // Logging task: reads whatever has been published.
  bool pop(Record& out) {
    uint32_t t = tail_.load(std::memory_order_relaxed);
    uint32_t h = head_.load(std::memory_order_acquire);
    if (t == h) return false;                     // empty
    out = slots_[t & (N - 1)];
    tail_.store(t + 1, std::memory_order_release);
    return true;
  }
};

static SpscRing<8> ring;                          // static: no heap anywhere

int main() {
  for (uint32_t i = 0; i < 10; ++i)               // 10 pushes into 8 slots
    if (!ring.push({i, 0.5f * i})) std::printf("dropped cycle %u\n", (unsigned)i);
  Record r;
  while (ring.pop(r)) std::printf("%u ", (unsigned)r.cycle);
  std::printf("\n");
}
// Output:
// dropped cycle 8
// dropped cycle 9
// 0 1 2 3 4 5 6 7
```

Notice what `push` does when the buffer is full: it gives up on that one record and returns at once. The control task never waits for room. Losing a log record is a nuisance. Missing a control deadline is a failure. A real system also counts the drops, so the ground knows data is missing.

### Size it, then round up to a power of two

How big must the buffer be? Big enough to hold everything the control task writes while the logger is not reading:

$$
\text{size} = \text{record size} \times \text{rate} \times \text{worst-case logger delay}.
$$

Then round up to a **power of two** — a number like $2^{15}$, made by doubling $2$ again and again. With a power-of-two size $N$, wrapping an index around is a **[[bitwise mask|mask-picture]]**: `index & (N - 1)`. The mask keeps only the low bits of the index. It is one instruction, and it takes the same time whatever the index is.

The alternative is the remainder operation, `index % N`. When the size is only known at run time, that compiles to a real integer division. On some processors, division takes a different number of cycles depending on the numbers going in. That is lesson eight's warning again — an operation's cost can depend on more than which operation it is — showing up in an instruction most engineers assume is always cheap.

::: example Sizing a lock-free log buffer
A control task runs at $200\,\mathrm{Hz}$ (two hundred cycles per second). Each cycle it writes one $32$-byte record. The logging task can be held up for as long as $5\,\mathrm{s}$ — by a downlink outage, or a burst of higher-priority work elsewhere. The control task keeps writing the whole time.

Multiply record size by rate by delay:

$$
32\,\mathrm{B} \times 200\,\mathrm{Hz} \times 5\,\mathrm{s} = 32\,000\,\mathrm{bytes}.
$$

Step by step: $32 \times 200 = 6400$ bytes each second, and $6400 \times 5 = 32\,000$ bytes over the five seconds.

Now round up to the next power of two. $2^{14} = 16\,384$ is too small; $2^{15} = 32\,768$ is the first one big enough. So the buffer is $32\,768$ bytes, and wraparound on a byte index is the mask `index & 32767`.

**Sanity check.** $32\,768$ is a little more than $32\,000$, so there is room to spare — about $768$ bytes, or $24$ extra records.
:::

::: key
Never let the control task block on logging. A lock-free, single-producer single-consumer ring buffer — preallocated, power-of-two sized, indices published with acquire/release ordering — lets the control task record data with a bounded, tiny, constant-time operation, while a separate lower-priority task does the slow work of getting that data off the vehicle.
:::

::: warning A "quick" printf in the loop
The debug line added "just for today" is the classic way a proven loop starts missing deadlines. Formatted printing, file writes and shared logging locks all have unbounded or history-dependent timing. If a line of code in the control task does anything but copy a fixed-size record into a preallocated buffer, it does not belong there.
:::

## Fixed-point arithmetic

### Store cents, not dollars

A shop's cash register does not store \$12.34 as a decimal fraction. It stores $1234$ cents — a whole number — and remembers that the real value is that number divided by $100$. Adding prices is then ordinary whole-number addition.

**Fixed-point** arithmetic does the same with binary. It stores a real number $x$ as a scaled integer. In a format called $Q_N$ (read "Q N"; $N$ is the number of fraction bits), the stored integer is

$$
\text{stored} = \mathrm{round}(x \times 2^N).
$$

The real value is the stored integer divided by $2^N$. The **[[Q15 format|q15-range]]**, very common, uses $N = 15$ inside a signed 16-bit integer, so the scale factor is $2^{15} = 32\,768$.

What this buys:

- **Add, subtract and compare** are plain integer instructions, with no extra work at all. Two numbers with the same scale add like cents.
- **Multiply** needs one extra step. Multiplying two $Q_N$ numbers gives a result scaled by $2^N \times 2^N = 2^{2N}$, a $Q_{2N}$ value. It needs a wider temporary integer to hold it, then a **right shift** by $N$ bits (dividing by $2^N$, written `>> N`) to bring it back to $Q_N$.

::: example Q15 multiplication, and where addition needs care
**Converting.** With scale $32\,768$: $0.5 \times 32\,768 = 16\,384$ and $0.25 \times 32\,768 = 8192$.

**Multiplying.** Multiply the stored integers as ordinary integers:

$$
16\,384 \times 8192 = 134\,217\,728.
$$

That is a $Q_{30}$ result. Shift right by $15$ bits, which divides by $32\,768$:

$$
134\,217\,728 \div 32\,768 = 4096.
$$

Read it back: $4096 \div 32\,768 = 0.125$. That is exactly $0.5 \times 0.25$, with no rounding error at all this time. The shift threw away only the low bits that a $Q_{30}$-to-$Q_{15}$ conversion is supposed to throw away.

**Adding.** Now add $0.7$ and $0.5$. First, $0.7 \times 32\,768 = 22\,937.6$, which rounds to $22\,938$. Then

$$
22\,938 + 16\,384 = 39\,322.
$$

But the largest number a signed 16-bit integer can hold is $32\,767$. The sum does not fit. In plain 16-bit arithmetic it would **[[wrap around|wraparound]]** to a large *negative* number — the true answer, $1.2$, turned into roughly $-0.8$.

**Sanity check.** Q15 covers only $-1$ up to just under $+1$, and $1.2$ is outside that. So an overflow is exactly what we should expect.
:::

The two operations fail in opposite ways. Multiplication grows the *scale* — the number of fraction bits — and a shift fixes that. Addition grows the *range* of the value itself. A fixed-width integer does not absorb that on its own. You need a wider accumulator, or explicit **[[saturation|saturation]]** (clamping the answer to the largest value that fits), and you decide which at the exact line of code where the addition happens. Never leave it to overflow silently.

Here are both operations in a few lines of Python:

```python
SCALE = 2**15                      # Q15: 15 fraction bits


def to_q15(x):
    return round(x * SCALE)


def q15_mul(a, b):
    return (a * b) >> 15           # Q30 product, shifted back to Q15


def q15_add_sat(a, b):
    s = a + b                      # add in a wider type first
    return max(-32768, min(32767, s))  # then clamp to the int16 range


a, b = to_q15(0.5), to_q15(0.25)
print(a, b, q15_mul(a, b), q15_mul(a, b) / SCALE)   # 16384 8192 4096 0.125
c = to_q15(0.7)
print(c, c + a, q15_add_sat(c, a) / SCALE)          # 22938 39322 0.999969482421875
```

The saturated sum is $0.99997$, the largest value Q15 can hold. It is wrong, but it is wrong by the smallest amount possible, and in the right direction.

### When fixed point is still the right answer

Most modern chips have a hardware **floating-point unit** (FPU). So why use fixed point at all? Several real reasons, and they all come back to this module's theme:

- **Predictable timing on chips with no FPU.** Small, cheap, low-power microcontrollers — exactly the kind chosen for a narrow subsystem board — often have no FPU. There, floating point is done in software by a library routine with its own branches for normalizing, rounding and special cases. That is the kind of data-dependent code lesson eight said is hard to bound tightly. Integer operations are a handful of instructions with fixed timing.
- **Data-dependent timing even with an FPU.** Some processors handle very tiny **[[subnormal|subnormal]]** floating-point values through a slow path — microcode or a trap — instead of the normal fast pipeline. The same multiply can suddenly take many times longer because of the value going in. That erodes a tight worst-case bound even when a real FPU is present.
- **Bit-for-bit reproducibility.** Integer arithmetic gives identical results on every compiler, every optimization level and every processor with the same integer width. That is a hard requirement for a **[[voted, redundant flight computer|voting]]**, where independent copies of the same calculation must agree exactly for the comparison to mean anything. Floating point makes no such promise in general. Different use of **[[fused multiply-add|fma]]**, different precision for in-between results, and different optimization choices can each change the last bits, while every one of them still obeys the IEEE 754 floating-point standard.
- **Hardware with no FPU at all.** Cost, power and radiation-hardening often produce flight-qualified chips with no FPU. Fixed point is what makes real control-law computation possible on them.

The honest balance goes the other way too.

Fixed point's **dynamic range** — the span from the smallest to the largest value it can represent — is far smaller than float's. A Q15 value covers only $[-1, 1)$ (from $-1$, included, up to $1$, not included), at the same step size everywhere: $2^{-15} \approx 3.05 \times 10^{-5}$. Floating point trades a little precision for an enormous range, through its exponent, for free. A quantity that swings over several orders of magnitude during a mission — a growing integrator, say — needs careful, manual scaling analysis in fixed point. Floating point's exponent does that work automatically.

And on modern processors *with* a hardware FPU at a similar clock speed, floating point is usually not slower for add, subtract, multiply or divide. Speed is rarely the deciding argument today. The reasons that still favor fixed point on capable hardware are determinism and bit-for-bit reproducibility. Say that plainly, against the old intuition that fixed point wins mainly because it is faster.

::: warning Fixed point on a signal with a huge range
Choosing fixed point for a signal whose size changes by orders of magnitude over a mission — propellant mass from full to nearly empty, for example — without a scaling analysis swaps a timing problem for a correctness problem. The format either saturates at the top of its range or loses most of its precision near the bottom, silently. Choose the format and scale factor for *this* signal's actual range, not the one that worked for the last signal.
:::

## Check yourself

::: check
A control task writes its diagnostics by calling a logging library that takes an internal mutex. That mutex is shared with a lower-priority task that formats telemetry. The control task's response-time analysis, which ignores this call, shows it meets its deadline comfortably. What is wrong with trusting that proof?
:::

::: answer
Response-time analysis from lessons two and three counts only interference from *higher*-priority tasks. A mutex shared with a *lower*-priority task brings back the priority-inversion hazard from lesson four. Unless that mutex uses priority inheritance or a priority ceiling, the control task's true worst-case blocking is not in the proof at all — a medium-priority task could keep the formatter from releasing the lock for as long as it likes.

The fix is not to add a blocking term and redo the analysis. It is to take the shared lock out of the control task's path completely: write into a lock-free ring buffer and let a separate logging task call the library. Then there is no blocking term to add.
:::

::: check
Explain why a single-producer, single-consumer ring buffer needs no mutex, in terms of which variables each side changes. Then explain why the argument breaks with two producer tasks.
:::

::: answer
The writer only ever changes its own write index and the slots it is filling. The reader only ever changes its own read index and the slots it is emptying. No variable is written by both sides, so there is no race for a lock to protect. The only requirement left is ordering: the writer publishes its index with a release store and the reader loads it with an acquire load, so the reader never sees the new index before the data behind it is written.

With two producers, both must change the same write index. Now a variable is written by two independent tasks — exactly the shared, changing state a mutex exists to protect. At the very least it needs a true atomic read-modify-write such as compare-and-swap, not the plain loads and stores the single-producer case relies on.
:::

::: check
Why does a power-of-two buffer size matter beyond tidy arithmetic? What, in this module's own terms, would go wrong with a buffer of exactly $30\,000$ bytes whose size is set at run time?
:::

::: answer
With a size that is not a power of two, wraparound needs a general remainder, `index % 30000`, instead of a bitwise mask. With the size known only at run time, that is a real integer division, and on some processors a division's cycle count depends on the numbers going in. That is exactly the operand-dependent timing lesson eight warned makes a worst-case bound harder to pin down.

The buffer would still *work*: $30\,000$ bytes is not functionally wrong. But it puts, into the one instruction that wraps the index, the same kind of hardware timing variation the rest of the module has worked to design out.
:::

::: check
In Q15, compute $0.75 \times 0.5$ the way a fixed-point processor would. Show the stored integers, the wide product, and the shift.
:::

::: answer
Convert with scale $32\,768$: $0.75 \times 32\,768 = 24\,576$ and $0.5 \times 32\,768 = 16\,384$.

Multiply as integers: $24\,576 \times 16\,384 = 402\,653\,184$. That is a $Q_{30}$ value, too big for 16 bits, so it needs a 32-bit temporary.

Shift right by $15$ (divide by $32\,768$): $402\,653\,184 \div 32\,768 = 12\,288$.

Read back: $12\,288 \div 32\,768 = 0.375$, which is exactly $0.75 \times 0.5$. It fits easily inside $[-1, 1)$, as a product of two numbers smaller than $1$ always does.
:::

::: check
A guidance calculation runs on three independently powered flight computers, and a voter expects their outputs to agree exactly. One computer turns out to have been built with a different compiler optimization level. Why is this a bigger worry for a floating-point version of the calculation than for a fixed-point one?
:::

::: answer
Fixed-point arithmetic is ordinary integer arithmetic. For the same source code and the same integer width, it gives bit-identical results on every compiler and every optimization level. There is no room for the compiler to pick a different, still-correct answer.

Floating point has that room. Using or not using fused multiply-add, keeping in-between results in wider registers, and choosing different instructions at different optimization levels can each change the last bit or several — while every version stays fully within IEEE 754. Usually that difference does not matter. For a voter that expects exact agreement, it trips the comparison even though nothing is actually faulty.
:::

## Summary

| Idea | Meaning |
| --- | --- |
| Lock-free SPSC ring buffer | One writer, one reader, and no variable written by both; no mutex needed |
| Publishing the index | Writer: atomic store with release; reader: atomic load with acquire |
| Full buffer | The control task drops the record and counts it; it never waits |
| Buffer sizing | Record size × rate × worst-case logger delay, rounded up to a power of two |
| Power-of-two benefit | Wraparound by bitwise mask — constant time, unlike a general remainder |
| Fixed point ($Q_N$) | Integer scaled by $2^N$; add, subtract, compare are native; multiply needs a wide temporary and a right shift by $N$ |
| Overflow | Multiply grows the scale (fix with a shift); add grows the range (fix with a wider accumulator or saturation) |
| Why fixed point still wins | Predictable timing without an FPU, no data-dependent float paths, bit-for-bit reproducibility for voting |
| Why float still wins | Automatic dynamic range through the exponent; similar speed on hardware with a real FPU |

That closes the module. Every lesson in it asked the same question of a different part of the system: not "how fast is this?" but "what is the worst it can ever be, and can you prove it?" A scheduler proves it for a task set. Priority inheritance proves it for a lock. A guard region proves it for a stack. A ring buffer proves it for a log call that used to threaten the very deadline it was meant to help you debug. The next module builds on this to design flight software that keeps flying when a piece of it fails.

::: context printf-cost Why printf is slow and unpredictable
`printf` turns numbers into text, and how long that takes depends on the numbers: printing a float digit by digit can take thousands of cycles. The standard output stream usually has an internal lock, so two threads printing at once wait for each other. And when its buffer fills, the call blocks until the terminal, file or serial port catches up. Any one of those alone is enough to break a deadline.
:::

::: context ring-picture The ring, drawn
Eight slots in a circle. The writer (head) moves clockwise filling slots; the reader (tail) follows behind emptying them. The shaded slots hold records waiting to be read. When head catches up to tail from behind, the ring is full; when tail catches up to head, it is empty.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <path d="M180,20 A80,80 0 0 1 236.6,43.4 L208.3,71.7 A40,40 0 0 0 180,60 Z" fill="#8fb8f0"/>
    <path d="M236.6,43.4 A80,80 0 0 1 260,100 L220,100 A40,40 0 0 0 208.3,71.7 Z" fill="#8fb8f0"/>
    <path d="M260,100 A80,80 0 0 1 236.6,156.6 L208.3,128.3 A40,40 0 0 0 220,100 Z" fill="#8fb8f0"/>
    <path d="M236.6,156.6 A80,80 0 0 1 180,180 L180,140 A40,40 0 0 0 208.3,128.3 Z" fill="#ffffff"/>
    <path d="M180,180 A80,80 0 0 1 123.4,156.6 L151.7,128.3 A40,40 0 0 0 180,140 Z" fill="#ffffff"/>
    <path d="M123.4,156.6 A80,80 0 0 1 100,100 L140,100 A40,40 0 0 0 151.7,128.3 Z" fill="#ffffff"/>
    <path d="M100,100 A80,80 0 0 1 123.4,43.4 L151.7,71.7 A40,40 0 0 0 140,100 Z" fill="#ffffff"/>
    <path d="M123.4,43.4 A80,80 0 0 1 180,20 L180,60 A40,40 0 0 0 151.7,71.7 Z" fill="#ffffff"/>
  </g>
  <line x1="215" y1="185" x2="200" y2="165" stroke="#b4232c" stroke-width="2"/>
  <text x="220" y="196" font-size="11" fill="#b4232c">head: next write</text>
  <line x1="140" y1="12" x2="195" y2="32" stroke="#1d6fd1" stroke-width="2"/>
  <text x="40" y="14" font-size="11" fill="#1d6fd1">tail: next read</text>
  <text x="290" y="96" font-size="11" fill="#1f2a44">3 records</text>
  <text x="290" y="110" font-size="11" fill="#1f2a44">waiting</text>
</svg>
```
:::

::: context acquire-release Release and acquire, like a mailbox flag
Think of a rural mailbox with a little red flag. You put the letter inside first, then raise the flag. The mail carrier sees the flag, then opens the box — and the letter is there. Release ordering is the promise "the letter goes in before the flag goes up". Acquire ordering is "after I see the flag, I look inside". Without those promises, a fast processor could, in effect, raise the flag before the letter is in.
:::

::: context compare-and-swap What compare-and-swap does
Compare-and-swap is a single hardware instruction that says: "if this variable still holds the value I expect, replace it with my new value; otherwise, tell me it changed." Two producers can each try to claim the next slot this way. The winner's swap succeeds; the loser sees the index moved and tries again. That retry loop is what makes multi-producer buffers harder to analyze: in the worst case, a producer might retry many times.
:::

::: context mask-picture Why the mask gives the remainder
For a power of two such as $8 = 1000_2$, the number one less, $7 = 0111_2$, is all ones in the low bits. ANDing an index with it keeps the low three bits, which is exactly the remainder after dividing by $8$. Index $13 = 1101_2$ becomes $0101_2 = 5$, and $13 \div 8$ is $1$ remainder $5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="30" text-anchor="start" font-size="12">13</text>
    <text x="150" y="30">1</text><text x="180" y="30">1</text><text x="210" y="30">0</text><text x="240" y="30">1</text>
    <text x="30" y="65" text-anchor="start" font-size="12">&amp; 7</text>
    <text x="150" y="65">0</text><text x="180" y="65">1</text><text x="210" y="65">1</text><text x="240" y="65">1</text>
    <text x="30" y="110" text-anchor="start" font-size="12">= 5</text>
    <text x="150" y="110" fill="#6c7a93">0</text><text x="180" y="110" fill="#b4232c">1</text><text x="210" y="110" fill="#b4232c">0</text><text x="240" y="110" fill="#b4232c">1</text>
  </g>
  <line x1="130" y1="80" x2="260" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="165" y="92" width="90" height="26" rx="4" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="270" y="110" font-size="11" fill="#1d6fd1">low 3 bits kept</text>
</svg>
```
:::

::: context q15-range What Q15 can hold
A signed 16-bit integer runs from $-32\,768$ to $32\,767$. Divide by $32\,768$ and Q15 runs from exactly $-1$ up to $32\,767/32\,768 \approx 0.99997$. The top end falls one step short of $1$ because zero takes one of the non-negative slots. Every step is the same size, $2^{-15}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="42" x2="30" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="42" x2="180" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="30" cy="50" r="4" fill="#1d6fd1"/>
  <circle cx="330" cy="50" r="4" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="30" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">-1</text>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="330" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">+1</text>
  <text x="30" y="78" font-size="11" text-anchor="middle" fill="#1d6fd1">-32768</text>
  <text x="180" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="320" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">32767</text>
  <text x="330" y="100" font-size="11" text-anchor="end" fill="#b4232c">+1 itself is not reachable</text>
</svg>
```
:::

::: context wraparound How 1.2 becomes -0.8
A 16-bit register has room for $65\,536$ patterns. When a sum passes $32\,767$, the pattern it lands on is the one that means a negative number. So $39\,322$ is read as $39\,322 - 65\,536 = -26\,214$, and $-26\,214 / 32\,768 \approx -0.8$. Like a car odometer rolling past its top value back to zero, the number keeps counting, but its meaning flips. In a control law, that flip turns "push hard right" into "push hard left".
:::

::: context saturation Saturation, like a speedometer pinned at the stop
A saturating add clamps any result above the top of the range to the top, and any result below the bottom to the bottom — the way a car speedometer needle stops at its end mark instead of wrapping back to zero. Many signal-processing chips have saturating add instructions built in for exactly this reason. The answer is still wrong, but it is wrong by the least possible amount, and it keeps the right sign.
:::

::: context subnormal Numbers smaller than small
A normal floating-point number has a hidden leading $1$ in its binary digits. Below the smallest normal value — about $1.18 \times 10^{-38}$ for a 32-bit float — the format switches to **subnormal** numbers, which drop that hidden $1$ so values can shrink gradually toward zero. Many chips handle them outside the fast hardware path. A filter state slowly decaying toward zero can wander into this range and make one multiply suddenly far slower. A common guard is to switch on "flush-to-zero" mode, which treats subnormals as zero.
:::

::: context voting Where voting comes next
The next module, on flight software architecture, builds redundant computers that run the same calculation and a voter that compares their outputs. If the three answers must match bit for bit, anything that lets two healthy computers disagree — a different compiler flag, a different rounding choice — looks to the voter exactly like a fault. That is why reproducibility is a design requirement there, not a nicety.
:::

::: context fma One rounding instead of two
A fused multiply-add computes $a \times b + c$ in one step and rounds only once at the end. Doing it as a separate multiply and add rounds twice, once after each step. The fused version is usually *more* accurate — but it is different in the last bit. So whether the compiler chooses to fuse is enough, on its own, to make two correct builds disagree.
:::
