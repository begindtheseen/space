---
id: l08-embedded-cpp-coding-rounds
title: The embedded-flavoured C++ coding round
minutes: 20
covers:
  - "C++ coding rounds: the standard algorithmic problems plus embedded-flavoured ones — ring buffers, fixed-point arithmetic, bit manipulation, memory-constrained algorithms, no allocation in the hot path"
---

A GNC coding round looks like a generic algorithms interview for about the first minute, and then it does not. The problems are recognizable — a ring buffer, a fixed-point multiply, a bit-manipulation puzzle — but a correct answer to any of them is the entry ticket, not the differentiator. What is actually being assessed is whether you notice the properties that matter for code that runs in a flight-software hot path: no allocation, no unbounded recursion, no data-dependent execution time, deterministic arithmetic. A candidate who produces working code and stops has passed the first bar. A candidate who produces working code and then says, unprompted, "this allocates every iteration, which I wouldn't do in a control loop — here's the fixed-footprint version" has shown the actual judgment the role needs, in about thirty seconds.

::: key
Correctness is the entry ticket, not the signal. The signal is noticing determinism: allocation in a hot path, unbounded loops or recursion, execution time that depends on the data — and raising it yourself, before the interviewer has to ask.
:::

## The ring buffer

A ring buffer is the structure behind telemetry queues, delay lines, and moving-average filters throughout flight software, and its entire interview content is in getting the wrap-around arithmetic right without an expensive operation in the hot path. Fixed capacity, oldest element overwritten when full — that semantics, precisely, and nothing fancier.

The naive wrap is `index = (index + 1) % capacity`, and the naive version is exactly what a reviewer is listening for you to avoid: a general integer modulo is a division instruction, among the slower operations a core has, and it is unnecessary here. Two better options, and the choice between them is itself a small trade worth stating out loud. If capacity is fixed at a power of two, `index = (index + 1) & (capacity - 1)` replaces the division with a single bitwise AND — fast, branch-free, but it constrains capacity to powers of two, which is a real constraint on a caller. If capacity can be arbitrary, `if (++index == capacity) index = 0;` is a comparison and a rarely-taken branch, works for any capacity, and on real hardware is nearly free because the branch predictor learns the pattern almost immediately. Neither is wrong; picking one and stating why — "I'm assuming capacity is a power of two here for the AND trick, which is a very ordinary thing to require in embedded code, but I'd note that as a documented constraint on the constructor" — is exactly the kind of trade-not-preference framing this module returns to repeatedly.

::: example Ring buffer, capacity 4, traced by hand
Pushing 1, 2, 3, 4, 5 into a capacity-4 buffer with the overwrite-oldest rule: after 1,2,3,4 the buffer holds $[1,2,3,4]$, full. Pushing 5 with `head = (head+1) & 3` overwrites the oldest slot in place rather than shifting anything, leaving the buffer's contents, read oldest-first from the new head, as $[2,3,4,5]$ — confirmed by direct implementation and test below, with no element ever copied more than once.
:::

```cpp
template <typename T, std::size_t N>   // N must be a power of two
class RingBuffer {
public:
    void push(const T& x) {
        buf_[head_] = x;
        head_ = (head_ + 1) & (N - 1);
        if (size_ < N) ++size_;
    }
    std::size_t size() const { return size_; }
    bool is_full() const { return size_ == N; }
private:
    std::array<T, N> buf_{};
    std::size_t head_ = 0, size_ = 0;
};
// compiled and tested: pushing 1,2,3,4,5 into RingBuffer<int,4> leaves
// size()==4, is_full()==true, contents oldest-first {2,3,4,5}, matching by hand above
```

Every member here is a fixed-size `std::array`, a couple of indices, and arithmetic — no heap allocation at construction, none on `push`, and the memory footprint is known at compile time from the template parameter, exactly the property a reviewer is checking for without needing to ask.

## Fixed-point arithmetic: Q15

Fixed-point arithmetic shows up because floating point is not always available, and even where it is, integer arithmetic is bit-exact and reproducible across compilers and optimization levels in a way that floating point, with its various legal reassociations, is not — a real concern when a test suite has to reproduce a flight result exactly. **Q15** represents a value in $[-1, 1)$ as a 16-bit signed integer, with the binary point placed so that the integer value equals the real value times $2^{15} = 32768$; the smallest representable step is $1/32768 \approx 3.05\times10^{-5}$.

Two design decisions inside the format are worth being able to explain, not only implement, because both are the kind of thing an interviewer asks "why" about immediately after you get the code right.

**Conversion saturates rather than wraps.** `q15_from_float(x)` computes `round(x * 32768)` and clamps the result to $[-32768, 32767]$ rather than letting it overflow and wrap. Wrapping is the default behaviour of a plain integer cast, and it is the wrong default here: a value that overflows in a control loop — a command that should have been at positive full-scale — would wrap around to a large-magnitude *negative* number under two's-complement overflow, which is a full-scale sign reversal delivered silently to whatever consumes that number next. Saturation instead clips to the correct-sign extreme, which is a far safer failure mode for anything downstream.

**Multiplication rounds rather than truncates.** `q15_mul(a, b)` computes the full 32-bit product, adds $2^{14}$ (half an LSB, in the wider representation) before shifting right by 15, rather than shifting straight down. A right shift alone truncates toward negative infinity, which biases *every single product* slightly toward zero — a small, one-directional, systematic error rather than a zero-mean random one. In an integrator or a filter running thousands of updates a second, that one-directional bias accumulates into a real, drifting error; adding the rounding term before the shift makes the error zero-mean instead.

```cpp
int16_t q15_from_float(float x) {
    long v = lroundf(x * 32768.0f);
    if (v > 32767) v = 32767;
    if (v < -32768) v = -32768;
    return static_cast<int16_t>(v);
}

int16_t q15_mul(int16_t a, int16_t b) {
    int32_t prod = static_cast<int32_t>(a) * static_cast<int32_t>(b);
    return static_cast<int16_t>((prod + (1 << 14)) >> 15);
}
```

::: example Q15 arithmetic, verified
`q15_from_float(0.5) = 16384` and `q15_from_float(-0.5) = -16384` — exact representations. `q15_from_float(1.0)` computes a raw rounded value of exactly $32768$, one past the positive limit, and saturates to $32767$ — $1.0$ itself is not exactly representable in a format whose positive range tops out immediately under it. `q15_mul(16384, 16384) = 8192`: $0.5 \times 0.5 = 0.25$, and $8192/32768 = 0.25$ exactly. `q15_mul(1, 16384) = 1`: the true product is $1/32768 \times 0.5 = 1/65536$, which rounds to the nearest representable value of $1$ (one LSB) rather than truncating to $0$ — precisely the rounding-versus-truncation distinction above, made concrete: truncation would have silently produced zero here.
:::

## Bit manipulation, and where it actually gets used

The classic bit-manipulation questions show up here mostly as short warm-ups, and they are worth having cold rather than rederived live. Checking whether an integer is a power of two: for $x>0$, `x & (x - 1) == 0`, because subtracting one from a power of two flips every bit below the single set bit, and ANDing the two leaves nothing in common. Counting set bits (Brian Kernighan's trick): repeatedly clear the lowest set bit with `n &= (n - 1)` and count the iterations, which runs in time proportional to the number of set bits rather than the bit width — a small but real efficiency point worth mentioning if it comes up.

These are not academic in this context: the same "clear the lowest set bit" and "test a single bit" operations appear directly in fixed-point work, for instance when normalizing a fixed-point value by counting leading zero bits to find how far to shift it before a division, a routine step in fixed-point square-root and division implementations that themselves avoid a hardware divider.

## No allocation in the hot path, and the lock-free queue

"No allocation in the hot path" is not a style preference; it is a determinism requirement. A general-purpose allocator's worst-case execution time is not bounded — fragmentation, locking in a multi-threaded allocator, and lazily reclaimed memory all mean a call to `new` can occasionally take far longer than its typical case, and "occasionally much longer" is exactly the property a control loop with a fixed real-time deadline cannot tolerate. The standard responses are the ones used throughout this lesson already: fixed-capacity containers sized at compile time, object pools allocated once at startup, and — the general version of the same idea — never letting a data structure's size depend on runtime input inside a loop that has a deadline.

A **lock-free single-producer single-consumer (SPSC) queue** is the concurrency-flavoured version of the same ring buffer, used to move telemetry out of a control task without that task ever blocking on a mutex. The core idea, stated at the level a design discussion actually needs: a fixed-capacity ring buffer with two indices, one written only by the producer and one written only by the consumer, so neither side ever writes a memory location the other side also writes — the classic recipe for avoiding a data race without a lock. The producer writes the new element, then publishes the updated index; the consumer reads the published index, and only then reads the element it points to. In real code this ordering has to be enforced with the appropriate atomic operations — a release store when publishing the index, an acquire load when reading it — so that the compiler and the processor are not free to reorder the data write after the index publish. Stating the *design* correctly in an interview is the expected bar; verifying the memory-ordering details are actually right is the kind of thing you would confirm with a tool built for it, such as a thread sanitizer, rather than by eye — an honest thing to say out loud if asked how confident you are in a from-scratch concurrent data structure.

A moving-average filter over the same ring buffer avoids division entirely by keeping a running sum: add the new sample, subtract the sample being evicted, and divide by the (fixed) window size only if it is not a power of two — and if it is, the same right-shift trick from the ring-buffer index applies to the division as well.

::: warning
If your working solution allocates inside a loop, point it out yourself before the interviewer does, and offer the fixed-footprint version. "This is correct, but it allocates a new vector every iteration, which I wouldn't ship in a control loop — here's the version with a preallocated buffer" costs thirty seconds and demonstrates exactly the judgment a flight-software round is checking for. Arguing that modern allocators are fast enough misses the point: the objection is determinism, not average-case speed.
:::

## Check yourself

::: check
Why is `index % capacity` generally avoided in a ring buffer's hot path, and what are the two standard replacements, each with its own trade?
:::

::: answer
A general integer modulo is implemented as a division instruction, one of the slower operations available, and unnecessary here when a much cheaper equivalent exists. If capacity is constrained to a power of two, `index & (capacity - 1)` replaces it with one bitwise AND — fast and branch-free, but it forces the caller into power-of-two capacities. If capacity must be arbitrary, `if (++index == capacity) index = 0;` works for any capacity and is nearly free in practice once the branch predictor learns the pattern, at the cost of an (almost always correctly predicted) branch instead of no branch at all. Neither is universally better; the trade is arbitrary-capacity flexibility against a marginally simpler, branch-free operation.
:::

::: check
Explain, physically rather than procedurally, why `q15_mul` adds $2^{14}$ before shifting right by 15, instead of shifting immediately.
:::

::: answer
A plain right shift truncates toward negative infinity, discarding the fractional bits below the result with no regard for whether the true value was closer to the truncated result or to one step above it. That discarding is not a zero-mean error — it biases every single product downward (toward zero for positive values, more negative for negative ones) by up to almost one full LSB, consistently, in the same direction, every time. Adding half an LSB ($2^{14}$ in the pre-shift 32-bit representation) before shifting converts this into round-to-nearest, whose error is zero-mean and bounded to within half an LSB in either direction — critical in an integrator or a repeated filter update, where a one-directional bias compounds over thousands of iterations into real, growing drift, while a zero-mean rounding error does not.
:::

::: check
Why does `q15_from_float` need to saturate rather than let the value wrap, and what would go wrong concretely if it wrapped instead?
:::

::: answer
A signed integer overflow that wraps under two's-complement arithmetic does not clip to a large value of the correct sign — it flips to a large-magnitude value of the *opposite* sign. A command value that should have saturated at positive full-scale would instead wrap around to a large negative value, which delivered to a control loop or an actuator downstream is a full-scale sign reversal happening silently, with no error flag and no indication anything went wrong. Saturating to the nearest representable extreme instead produces a bounded, correctly-signed, physically sensible output even when the true value is out of range — a far safer failure mode for anything consuming the number next.
:::

::: check
You are given a working solution that recursively computes something with recursion depth proportional to the size of the input. Why might this be flagged in an aerospace-flavoured round even if it produces the correct answer and runs quickly on the test cases given?
:::

::: answer
Recursion depth proportional to input size means stack usage that is not bounded independently of the data — on an embedded target with a small, fixed stack, a larger-than-tested input can overflow the stack with no compiler warning and a failure mode that can be silent or catastrophic depending on what memory sits past the stack. This is the same "worst-case execution time and memory must be bounded and known at compile time, independent of the data" property behind avoiding allocation in a hot path, applied here to the call stack instead of the heap — and it is exactly the kind of property a candidate is expected to notice and flag, converting the recursive version to an explicit iterative one with a fixed, known memory footprint if the role calls for it.
:::

::: check
Describe, at the level of a design conversation rather than a formal proof, why a single-producer single-consumer ring buffer can be made lock-free, and name the one thing you would want to verify with a tool rather than by eye before trusting it in flight software.
:::

::: answer
Because there are exactly two sides and each owns exactly one of the two indices — the producer only ever writes the head index, the consumer only ever writes the tail index — there is no location in memory that both sides write, which removes the classic cause of a data race. The producer writes new data, then publishes the updated index; the consumer reads the published index, then reads the data it points to, relying on the memory-ordering guarantees of a release store paired with an acquire load so the data write is guaranteed visible before the index update is observed. The thing worth verifying with a tool rather than by eye is exactly that memory-ordering correctness — that the compiler and processor are not reordering the data write and the index publish in a way that lets the consumer see a stale or partially-written element — which a thread sanitizer or a model checker is built to catch and casual code review is not reliably able to.
:::

## Summary

| Idea | Statement |
| --- | --- |
| What's really tested | Correctness is the entry ticket; determinism — allocation, recursion depth, worst-case timing — is the signal, and raising it yourself is the differentiator |
| Ring buffer wrap | Power-of-two capacity with `& (N-1)`, or arbitrary capacity with a compare-and-reset branch; state which and why |
| Q15 format | 16-bit signed, LSB $=1/32768$, range $[-1,1)$ |
| Q15 conversion | Saturates on overflow — wrapping would silently flip the sign at full scale |
| Q15 multiply | Rounds via `+ (1<<14)` before the shift — truncation alone biases every product toward zero |
| No allocation, no unbounded recursion | Both are the same determinism requirement applied to the heap and the stack respectively |
| SPSC lock-free queue | Each side owns exactly one index; correctness rests on release/acquire ordering, worth verifying with a tool rather than by eye |

The next lesson moves from individual coding problems to the systems and architecture round, where the same instinct for stating a trade explicitly, rather than a bare preference, is what a twenty-minute design answer is actually graded on.
