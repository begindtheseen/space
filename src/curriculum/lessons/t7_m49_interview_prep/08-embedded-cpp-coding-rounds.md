---
id: l08-embedded-cpp-coding-rounds
title: The embedded-flavored C++ coding round
minutes: 23
covers:
  - "C++ coding rounds: the standard algorithmic problems plus embedded-flavoured ones — ring buffers, fixed-point arithmetic, bit manipulation, memory-constrained algorithms, no allocation in the hot path"
---

Think about a school bus. Getting the kids to school is the minimum. A parent wants to know whether it arrives on time *every* day, not on average. A bus that is usually early but an hour late once a month is a bad bus.

Code that flies is judged the same way. A GNC coding round looks like an ordinary algorithms interview for about the first minute. The problems are familiar: a ring buffer, a fixed-point multiply, a bit puzzle. But a correct answer is only the entry ticket. What is really being assessed is whether you notice the properties that matter for code in a flight-software **[[hot path|hot-path]]** — the code that runs every cycle of a control loop, under a hard deadline. Those properties are: no memory allocation, no unbounded recursion, no running time that depends on the data, and arithmetic that gives the same bits every time.

A word for all of that together: **determinism** — the code takes a predictable amount of time and memory, every time. A candidate who writes working code and stops has passed the first bar. A candidate who writes working code and then says, unasked, "this allocates every iteration, which I wouldn't do in a control loop — here's the fixed-footprint version" has shown the judgment the role needs, in about thirty seconds.

::: key
What an aerospace coding round is really testing: correctness is the entry ticket. The signal is whether you notice determinism — allocation in a hot path, unbounded loops, recursion, data-dependent execution time — and raise it yourself before the interviewer does.
:::

## The ring buffer

Picture a round table with four seats and a queue of guests. When the table is full and a new guest arrives, the guest who has been sitting longest gets up, and the newcomer takes that same seat. Nobody else moves.

That is a **ring buffer**: a fixed number of slots, used in a circle, where a new item overwrites the oldest one when the buffer is full. It sits behind telemetry queues, delay lines and moving-average filters all through flight software. Its whole interview content is getting the wrap-around arithmetic right without an expensive operation in the hot path. Fixed capacity, oldest overwritten when full — exactly that, nothing fancier.

### Wrapping the index

The index is the seat number of the next slot to write. After the last slot it must go back to zero. The naive way is `index = (index + 1) % capacity;`. That `%` (read "mod", the remainder after division) is exactly what a reviewer is listening for you to avoid. A general integer **[[modulo|division-cost]]** is a division instruction, one of the slowest things a processor core does. And here it is unnecessary. There are two better options, and choosing between them is itself a small trade worth saying out loud.

**Option 1: power-of-two capacity, and a bitwise AND.** If the capacity is a power of two, then `index = (index + 1) & (capacity - 1);` does the same job. The `&` is **bitwise AND**: it keeps only the bits that are 1 in both numbers. For capacity 4, `capacity - 1` is binary `011`, so the AND keeps the two lowest bits and throws away the rest — 4 (`100`) becomes 0. One instruction, no branch. The cost: the caller is forced to use capacities of 1, 2, 4, 8, 16, and so on.

**Option 2: any capacity, and a compare.** The line `if (++index == capacity) index = 0;` works for any capacity. It is a comparison plus a branch that is almost never taken, and on real hardware it is nearly free, because the **[[branch predictor|branch-predictor]]** learns the pattern almost at once.

Neither is wrong. What the interviewer wants is the choice and the reason: "I'm assuming a power-of-two capacity for the AND trick. That's a very ordinary thing to require in embedded code, but I'd make it a documented constraint on the class." That is a **trade**, not a preference — the framing this module keeps coming back to.

::: example Ring buffer, capacity 4, traced by hand
Push 1, 2, 3, 4, 5 into a capacity-4 buffer that overwrites the oldest.

- Push 1: written to slot 0, head moves to $1 \,\&\, 3 = 1$. Size 1.
- Push 2: slot 1, head 2. Push 3: slot 2, head 3. Push 4: slot 3, head $4 \,\&\, 3 = 0$. The buffer is full: slots hold $[1, 2, 3, 4]$.
- Push 5: written to slot 0, the oldest one, replacing the 1. Head moves to 1. Size stays 4.

The slots now hold $[5, 2, 3, 4]$. Reading from the head, which in a full buffer points at the oldest element, gives $[2, 3, 4, 5]$ oldest-first.

**Sanity check.** The oldest value, 1, is gone, and the four newest remain in order. No element was moved or copied more than once. The code below produces exactly this.
:::

```cpp
#include <array>
#include <cstddef>

template <typename T, std::size_t N>
class RingBuffer {
    static_assert(N > 0 && (N & (N - 1)) == 0, "N must be a power of two");
public:
    void push(const T& x) {
        buf_[head_] = x;                 // overwrite the oldest slot
        head_ = (head_ + 1) & (N - 1);   // wrap with an AND, no division
        if (size_ < N) ++size_;
    }
    // i-th element counted from the oldest (i = 0 is the oldest)
    const T& oldest(std::size_t i) const {
        return buf_[(head_ - size_ + i) & (N - 1)];
    }
    std::size_t size() const { return size_; }
    bool is_full() const { return size_ == N; }
private:
    std::array<T, N> buf_{};
    std::size_t head_ = 0, size_ = 0;
};
// Pushing 1,2,3,4,5 into RingBuffer<int, 4> gives size() == 4,
// is_full() == true, and oldest(0..3) == 2, 3, 4, 5.
```

Look at what the class holds: one fixed-size `std::array`, two indices, and some arithmetic. There is no **[[heap allocation|heap]]** when it is built and none on `push`. The memory it uses is known when the program is compiled, from the template parameter `N`. That is exactly the property a reviewer checks without needing to ask. The `static_assert` makes the power-of-two constraint a compile error instead of a silent bug; it uses a bit trick from later in this lesson.

## Fixed-point arithmetic: Q15

Picture doing all your money math in cents instead of dollars. $\$0.25$ becomes 25. Everything is a whole number, and you remember that the decimal point sits two places from the right. That is **fixed-point** arithmetic: fractions stored as whole numbers with an agreed, fixed position for the point.

Why bother, when computers have floating point? Some small processors have no floating-point hardware. And integer arithmetic is **bit-exact** — identical bits across compilers and optimization settings — while floating point is not, because a compiler may legally regroup operations and change the last bits. That matters when a test suite must reproduce a flight result exactly.

**Q15** is the most common format. It stores a value in $[-1, 1)$ — from $-1$ up to, but not including, $+1$ — as a 16-bit signed integer. The integer is the real value times $2^{15} = 32768$:

$$
\text{stored integer} = \text{real value} \times 32768.
$$

So 0.5 is stored as 16384. The integer runs from $-32768$ to $32767$. The smallest step, one **[[LSB|lsb]]** (least significant bit), is $1/32768 \approx 3.05\times10^{-5}$.

::: key
Q15: a 16-bit signed integer holding a value in $[-1, 1)$; stored integer = value × 32768; one LSB = $1/32768 \approx 3.05\times10^{-5}$.
:::

Two design decisions inside Q15 are worth being able to explain, not only code. An interviewer asks "why" about both the moment your code works.

### Conversion saturates instead of wrapping

`q15_from_float(x)` computes `round(x * 32768)` and **saturates**: anything too big is clamped to the nearest end of the range, $-32768$ or $32767$.

The default behavior of a plain integer cast is to **[[wrap|twos-complement]]** instead, and that is the wrong default here. Suppose a command should have been at positive full scale but overflowed. Under two's-complement wrapping it becomes a large *negative* number. That is a full-scale sign reversal — "push hard right" silently turned into "push hard left" — handed to whatever uses the number next. Saturation clips to the extreme with the correct sign. For anything downstream, that is a far safer way to fail.

### Multiplication rounds instead of truncating

Multiply two Q15 numbers and you get a 32-bit product with 30 fraction bits. To get back to Q15 you shift right by 15 bits, which is dividing by 32768.

A plain right shift **truncates**: it throws away the dropped bits, which rounds toward negative infinity. On average that makes every product half an LSB too low. It is a small error, but it always points the same way — a **systematic** error, not a random one.

In an integrator or a filter running thousands of updates a second, a one-directional error piles up into real drift. The fix is to add half an LSB before shifting. In the 32-bit product, half an LSB of the result is $2^{14}$. Adding it turns truncation into **round-to-nearest**, whose error averages to zero.

```cpp
#include <cmath>
#include <cstdint>

int16_t q15_from_float(float x) {
    if (x >= 1.0f)  return 32767;        // saturate: clamp before
    if (x <= -1.0f) return -32768;       // rounding can overflow
    long v = std::lround(x * 32768.0f);
    if (v > 32767) v = 32767;            // x just below 1.0 rounds up to 32768
    return static_cast<int16_t>(v);
}

int16_t q15_mul(int16_t a, int16_t b) {
    int32_t prod = static_cast<int32_t>(a) * static_cast<int32_t>(b);
    int32_t r = (prod + (1 << 14)) >> 15;   // add half an LSB, then shift
    if (r > 32767) r = 32767;               // only (-1) * (-1) gets here
    return static_cast<int16_t>(r);
}
```

Two details in this code are interview follow-ups in their own right. First, the input is clamped *before* rounding, because rounding a huge float into a `long` can itself overflow. Second, the multiply has one overflow case: $(-1) \times (-1) = +1$, which Q15 cannot hold, so the result saturates to 32767. Noticing that corner unprompted is exactly the kind of thing the round rewards.

::: example Q15 arithmetic, checked
**Conversion.**
- $0.5 \times 32768 = 16384$, so `q15_from_float(0.5) = 16384`, and `q15_from_float(-0.5) = -16384`. Both exact.
- $1.0 \times 32768 = 32768$, one past the top of the range, so `q15_from_float(1.0)` saturates to $32767$. The value 1.0 itself cannot be stored; the range stops one LSB short of it.
- $-1.0 \times 32768 = -32768$, which *is* in range, so $-1.0$ is stored exactly.

**Multiplication.**
- `q15_mul(16384, 16384)`: the product is $268\,435\,456$. Add $16\,384$ and shift right 15: $8192$. In real terms, $0.5 \times 0.5 = 0.25$, and $8192/32768 = 0.25$ exactly.
- `q15_mul(1, 16384)`: one LSB times 0.5. The product is $16\,384$. Add $16\,384$ to get $32\,768$, shift right 15: $1$. The true answer is half an LSB, and rounding takes it to 1 LSB. Truncation would have shifted $16\,384$ right by 15 and silently produced $0$.

**Sanity check on the drift.** Suppose an integrator adds up one product per update at 1000 updates a second, and truncation makes each one half an LSB low on average. After 60 seconds that is $0.5 \times 1000 \times 60 = 30\,000$ LSB, or $30\,000/32768 \approx 0.92$ — nearly the whole range, from an error too small to see in any single product.
:::

## Bit manipulation, and where it is really used

Short bit puzzles show up as warm-ups. Have these cold rather than working them out live.

**Is $x$ a power of two?** For $x > 0$, test `x & (x - 1) == 0`. A power of two has exactly one bit set, like `01000`. Subtracting one flips that bit off and turns on every bit below it: `00111`. The two share no bits, so the AND is zero. Any other number has a higher bit that survives.

**Counting the set bits.** **[[Kernighan's trick|kernighan]]**: `n &= n - 1` clears the lowest set bit. Repeat until $n$ is zero and count the loops. The loop runs once per set bit, not once per bit position — a small but real efficiency point.

```cpp
#include <cstdint>

bool is_power_of_two(uint32_t x) {
    return x != 0 && (x & (x - 1)) == 0;
}

int count_set_bits(uint32_t n) {
    int count = 0;
    while (n != 0) {
        n &= n - 1;     // clear the lowest set bit
        ++count;
    }
    return count;
}
// is_power_of_two(64) == true, is_power_of_two(96) == false,
// count_set_bits(0b10110000) == 3
```

These are not only puzzles. The same moves appear in fixed-point work. To divide or take a square root in fixed point, code often **normalizes** a value first: it counts the leading zero bits to find how far to shift the number up. That is routine in fixed-point division and square-root routines written for processors with no hardware divider.

## No allocation in the hot path

Picture a restaurant that sometimes has to go buy ingredients before cooking. Usually dinner takes 20 minutes; once in a while, two hours. You cannot plan an evening around that kitchen.

A general-purpose memory allocator — what runs when you call `new` — is that kitchen. Its worst-case time is not bounded. Fragmentation, locks inside a multi-threaded allocator, and memory that is tidied up lazily all mean a call to `new` can occasionally take far longer than usual. "Occasionally much longer" is exactly what a control loop with a fixed real-time deadline cannot tolerate.

So "no allocation in the hot path" is not a style preference. It is a **determinism requirement**. The standard responses:

- fixed-capacity containers sized at compile time, like the ring buffer above;
- **object pools** — memory grabbed once at startup and reused;
- in general, never letting a data structure's size depend on runtime input inside a loop that has a deadline.

The same rule applies to the stack. Recursion whose depth grows with the input uses stack memory that the data, not the programmer, decides. On an embedded target with a small fixed stack, an input larger than any you tested can overflow it.

::: warning
If your working solution allocates inside a loop, say so yourself, before the interviewer does, and offer the fixed-footprint version: "This is correct, but it allocates a new vector every iteration, which I wouldn't ship in a control loop — here's the version with a preallocated buffer." Arguing that modern allocators are fast enough misses the point. The objection is determinism, not average speed.
:::

## The lock-free queue, and a moving average

### Single producer, single consumer

The control task produces telemetry. Another task sends it to the ground. The control task must never wait on the other one. The tool is a **lock-free single-producer single-consumer (SPSC) queue**: the same ring buffer, shared between two threads, with no **mutex** (a lock only one thread can hold at a time).

The design idea fits in one breath. There are two indices. The producer is the only one that writes the **head** index; the consumer is the only one that writes the **tail** index. No memory location is written by both sides, which removes the classic cause of a **[[data race|data-race]]** without any lock.

Order matters, though:

1. The producer writes the new element, *then* publishes the updated head.
2. The consumer reads the published head, *then* reads the element it points to.

Compilers and processors are allowed to reorder memory operations, so this order must be enforced with atomic operations: a **release** store when publishing the index, and an **acquire** load when reading it. Release–acquire guarantees that anything written before the release is visible to a thread that sees the new value through the acquire.

```cpp
#include <array>
#include <atomic>
#include <cstddef>

template <typename T, std::size_t N>   // N a power of two; holds up to N - 1 items
class SpscQueue {
public:
    bool push(const T& x) {                        // producer thread only
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t next = (h + 1) & (N - 1);
        if (next == tail_.load(std::memory_order_acquire)) return false;  // full
        buf_[h] = x;                                // 1. write the data
        head_.store(next, std::memory_order_release);  // 2. then publish it
        return true;
    }
    bool pop(T& out) {                              // consumer thread only
        std::size_t t = tail_.load(std::memory_order_relaxed);
        if (t == head_.load(std::memory_order_acquire)) return false;     // empty
        out = buf_[t];
        tail_.store((t + 1) & (N - 1), std::memory_order_release);
        return true;
    }
private:
    std::array<T, N> buf_{};
    std::atomic<std::size_t> head_{0};   // written only by the producer
    std::atomic<std::size_t> tail_{0};   // written only by the consumer
};
// One producer pushing 1..1,000,000 while one consumer pops them sums to
// 500000500000, and ThreadSanitizer reports no race.
```

Unlike the telemetry buffer earlier, this queue refuses a push when full instead of overwriting, so the producer can decide what to drop. One slot stays empty so that "full" and "empty" look different.

In an interview, stating the design correctly is the expected bar. Whether the memory-ordering details are truly right is something you confirm with a tool built for it, such as a **[[thread sanitizer|sanitizer]]**, not by eye. Saying that out loud is honest, and it is the right answer to "how confident are you in this?"

### A moving average with no division

A moving average over the last $W$ samples looks like it needs a sum of $W$ numbers and a division every update. It needs neither. Keep a **running sum**: add the new sample, subtract the sample the ring buffer is about to overwrite. That is two operations, whatever $W$ is.

For the final divide by $W$: if $W$ is a power of two, it is a right shift, the same trick as the ring-buffer index. If it is not, multiply by a precomputed fixed-point reciprocal of $W$. Either way, no division runs in the update.

## Check yourself

::: check
Why is `index % capacity` usually avoided in a ring buffer's hot path, and what are the two standard replacements, each with its own trade?
:::

::: answer
A general integer modulo compiles to a division instruction, one of the slowest operations a core has — and unnecessary when a much cheaper equivalent exists.

1. **Power-of-two capacity:** `index & (capacity - 1)`. One bitwise AND, fast and branch-free, but the caller is forced into power-of-two capacities.
2. **Any capacity:** `if (++index == capacity) index = 0;`. Works for any capacity and is nearly free once the branch predictor learns the pattern, at the cost of a branch (almost always predicted correctly) instead of none.

Neither is always better. The trade is flexible capacity against a slightly simpler, branch-free operation.
:::

::: check
Explain, physically rather than procedurally, why `q15_mul` adds $2^{14}$ before shifting right by 15 instead of shifting at once.
:::

::: answer
A plain right shift throws away the dropped bits without asking whether the true value was nearer the result below or the one above. That is not a zero-mean error: it pushes every product downward — toward zero for positive values, further negative for negative ones — by up to almost one full LSB, about half an LSB on average, the same direction every time.

Adding half an LSB ($2^{14}$ in the 32-bit product) before shifting turns this into round-to-nearest, whose error averages to zero and stays within half an LSB either way. That matters in an integrator or a repeated filter update: a one-directional bias compounds over thousands of iterations into growing drift, while a zero-mean rounding error does not.
:::

::: check
Why does `q15_from_float` need to saturate rather than let the value wrap, and what would concretely go wrong if it wrapped?
:::

::: answer
A signed overflow that wraps under two's-complement arithmetic does not clip to a big value of the right sign. It flips to a big value of the *opposite* sign.

A command that should have saturated at positive full scale would wrap to a large negative value. Delivered to a control loop or an actuator, that is a full-scale sign reversal, happening silently, with no error flag. Saturating to the nearest end of the range gives a bounded, correctly signed, physically sensible output even when the true value is out of range — a far safer failure for whatever uses the number next.
:::

::: check
You are shown a working solution that uses recursion, with recursion depth proportional to the size of the input. Why might it be flagged in an aerospace-flavored round, even though it gives the right answer and runs quickly on the test cases?
:::

::: answer
Depth proportional to input size means stack use that the data, not the design, decides. On an embedded target with a small, fixed stack, an input larger than any tested can overflow the stack — with no compiler warning, and a failure that may be silent or catastrophic depending on what memory lies past the stack.

It is the same requirement behind no allocation in the hot path — time and memory must be bounded and known in advance, independent of the data — applied to the stack instead of the heap. A candidate is expected to notice it and, if the role calls for it, convert the recursion into an explicit loop with a fixed, known memory footprint.
:::

::: check
Describe, at the level of a design conversation rather than a formal proof, why a single-producer single-consumer ring buffer can be made lock-free. Name the one thing you would want to verify with a tool, not by eye, before trusting it in flight software.
:::

::: answer
There are exactly two sides, and each owns exactly one index: only the producer writes the head, only the consumer writes the tail. No memory location is written by both, which removes the classic cause of a data race.

The producer writes the data, then publishes the new index. The consumer reads the published index, then reads the data it points to. A release store paired with an acquire load guarantees the data write is visible before the index update is seen.

The thing to verify with a tool is exactly that memory-ordering correctness: that the compiler and processor cannot reorder the data write and the index publish so that the consumer sees a stale or half-written element. A thread sanitizer or a model checker is built to catch that; casual code review does not reliably catch it.
:::

## Summary

| Idea | Statement |
| --- | --- |
| What's really tested | Correctness is the entry ticket; determinism — allocation, recursion depth, worst-case timing — is the signal, and raising it yourself is the differentiator |
| Ring buffer wrap | Power-of-two capacity with `& (N-1)`, or any capacity with a compare-and-reset branch; say which and why |
| Q15 format | 16-bit signed, LSB $=1/32768$, range $[-1,1)$ |
| Q15 conversion | Saturates on overflow — wrapping would silently flip the sign at full scale |
| Q15 multiply | Rounds via `+ (1<<14)` before the shift — truncation alone makes every product about half an LSB low |
| Bit tricks | `x & (x-1) == 0` tests a power of two; `n &= n-1` clears the lowest set bit |
| No allocation, no unbounded recursion | The same determinism requirement, applied to the heap and to the stack |
| SPSC lock-free queue | Each side owns exactly one index; correctness rests on release/acquire ordering, worth verifying with a tool rather than by eye |

The next lesson moves from single coding problems to the systems and architecture round. There, the same habit — stating a trade instead of a bare preference — is what a twenty-minute design answer is graded on.

::: context hot-path Where the hot path is
A flight computer runs its guidance, navigation and control code in a loop at a fixed rate — often 50 to 1000 times a second. Each pass has a deadline: if the loop at 100 Hz is not done within 10 ms, the next pass starts late, and the controller acts on stale data. The **hot path** is the code that runs on every pass. Code that runs once, at startup, can take its time and allocate freely. Code in the hot path must be fast in its *worst* case, because a single slow pass is a missed deadline, not a slightly lower average.
:::

::: context division-cost Why division is the slow one
Adding two integers takes a processor about one clock cycle. Integer division is done more like long division, one bit or a few bits at a time, so it can take several to dozens of cycles, depending on the chip. Some small microcontrollers, such as the ARM Cortex-M0 family, have no divide instruction at all, and the compiler has to call a software routine. That is why embedded programmers reach for shifts and masks: when the divisor is a power of two, a shift or an AND does the same job in one cycle.
:::

::: context branch-predictor How a processor guesses ahead
A modern processor starts working on the next several instructions before it knows the result of the current one. At an `if`, it cannot know yet which way to go, so it guesses, based on what that `if` did before. A correct guess costs nothing; a wrong one throws away the work and costs perhaps 10 to 20 cycles. The ring-buffer wrap test is false on every push except one per trip around the buffer, so the predictor guesses "not taken" and is almost always right. Many small embedded cores have little or no prediction, which is one more reason the branch-free AND is attractive there.
:::

::: context heap Stack, heap and a fixed footprint
A program keeps memory in two main places. The **stack** holds each function's local variables. It grows when a function is called and shrinks when it returns, fast and in strict order. The **heap** is a big shared pool; `new` asks the allocator to find a free piece of it, and `delete` hands it back. Finding a free piece means searching and bookkeeping, and after many allocations of different sizes the free space can be broken into scraps too small to use, called fragmentation. A class like the ring buffer, whose size is fixed by a template parameter, needs neither search nor bookkeeping: its **footprint** is known when the program is compiled.
:::

::: context lsb The smallest step
The **least significant bit** is the rightmost bit of a binary number: the one worth the least. In Q15 it is worth $1/32768$ of full scale, so it is the smallest change the format can represent — its resolution.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="20" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="40" y="30" width="20" height="30"/><rect x="60" y="30" width="20" height="30"/>
    <rect x="80" y="30" width="20" height="30"/><rect x="100" y="30" width="20" height="30"/>
    <rect x="120" y="30" width="20" height="30"/><rect x="140" y="30" width="20" height="30"/>
    <rect x="160" y="30" width="20" height="30"/><rect x="180" y="30" width="20" height="30"/>
    <rect x="200" y="30" width="20" height="30"/><rect x="220" y="30" width="20" height="30"/>
    <rect x="240" y="30" width="20" height="30"/><rect x="260" y="30" width="20" height="30"/>
    <rect x="280" y="30" width="20" height="30"/><rect x="300" y="30" width="20" height="30"/>
    <rect x="320" y="30" width="20" height="30"/>
  </g>
  <line x1="40" y1="22" x2="40" y2="68" stroke="#b4232c" stroke-width="2.5"/>
  <text x="30" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">sign</text>
  <text x="190" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">15 fraction bits</text>
  <text x="40" y="84" font-size="12" text-anchor="middle" fill="#b4232c">binary point</text>
  <text x="330" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">LSB</text>
  <text x="330" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">= 1/32768</text>
</svg>
```

One sign bit, then fifteen bits that sit to the right of the binary point — hence "Q15".
:::

::: context twos-complement Why overflow flips the sign
Computers store signed integers in **two's complement**. Picture the 65,536 values of a 16-bit integer arranged around a clock face. Counting up from 0 you reach 32767 at the top of the positive side — and the very next step lands on $-32768$, the most negative value.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M180,30 A70,70 0 0,1 180,170" fill="none" stroke="#1d6fd1" stroke-width="6"/>
  <path d="M180,170 A70,70 0 0,1 180,30" fill="none" stroke="#f2b880" stroke-width="6"/>
  <circle cx="180" cy="170" r="4" fill="#1f2a44"/>
  <text x="180" y="192" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="192" y="22" font-size="12" fill="#1d6fd1">32767</text>
  <text x="168" y="22" font-size="12" text-anchor="end" fill="#b4232c">−32768</text>
  <line x1="185" y1="30" x2="175" y2="30" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="175,26 167,30 175,34" fill="#b4232c"/>
  <text x="266" y="100" font-size="12" fill="#1d6fd1">positive</text>
  <text x="94" y="100" font-size="12" text-anchor="end" fill="#1f2a44">negative</text>
</svg>
```

Counting up from 0 at the bottom runs up the right side. One step past 32767 wraps across the top to −32768. That jump is the full-scale sign reversal saturation prevents.
:::

::: context kernighan Watching the lowest bit disappear
Take $n = 1011\,0000$ in binary. Then $n - 1 = 1010\,1111$: the lowest 1 became 0, and the zeros below it became 1s. AND them together: $1010\,0000$. Exactly one bit — the lowest set bit — is gone. Do it again: $1010\,0000 - 1 = 1001\,1111$, AND gives $1000\,0000$. Once more gives $0$. Three loops, three set bits. The trick is usually credited to Brian Kernighan, co-author of the classic book on the C language, though it was published earlier; many processors now offer a single "population count" instruction that does the same job.
:::

::: context data-race What a data race is
A **data race** happens when two threads touch the same memory at the same time, at least one of them writing, with nothing forcing an order between them. The result depends on exact timing, so the bug may appear once in a million runs — and never while you are watching. In C++ a data race is **undefined behavior**: the language makes no promise at all about what the program does. That is why "each index is written by only one thread" is the heart of the SPSC design: it leaves only the ordering question, which atomics answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="50" width="40" height="30" fill="#fff"/>
    <rect x="60" y="50" width="40" height="30" fill="#fff"/>
    <rect x="100" y="50" width="40" height="30" fill="#8fb8f0"/>
    <rect x="140" y="50" width="40" height="30" fill="#8fb8f0"/>
    <rect x="180" y="50" width="40" height="30" fill="#8fb8f0"/>
    <rect x="220" y="50" width="40" height="30" fill="#fff"/>
    <rect x="260" y="50" width="40" height="30" fill="#fff"/>
    <rect x="300" y="50" width="40" height="30" fill="#fff"/>
  </g>
  <line x1="120" y1="18" x2="120" y2="44" stroke="#b4232c" stroke-width="2"/>
  <polygon points="115,40 120,50 125,40" fill="#b4232c"/>
  <text x="120" y="14" font-size="12" text-anchor="middle" fill="#b4232c">tail: consumer writes</text>
  <line x1="240" y1="112" x2="240" y2="86" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="235,90 240,80 245,90" fill="#1d6fd1"/>
  <text x="240" y="126" font-size="12" text-anchor="middle" fill="#1d6fd1">head: producer writes</text>
</svg>
```

Blue slots hold items waiting to be read. The consumer reads at the tail and moves it right; the producer writes at the head and moves it right. Each arrow has one owner.
:::

::: context sanitizer Letting a tool check the threads
**ThreadSanitizer** is a checker built into the GCC and Clang compilers. Compile with `-fsanitize=thread`, run the program, and it watches every memory access, reporting any pair of accesses from different threads that are not properly ordered. It slows the program down a lot, so it is for testing, not flight. It only sees the interleavings that actually happen in the runs you give it, so heavy, repeated stress tests help. Model checkers go further by exploring every allowed interleaving of a small program. Both find mistakes a careful human reader misses.
:::
