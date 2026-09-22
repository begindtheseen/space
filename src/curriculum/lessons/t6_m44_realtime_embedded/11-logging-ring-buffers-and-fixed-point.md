---
id: l11-logging-and-fixed-point
title: Logging under a real-time budget, and fixed-point arithmetic
minutes: 17
covers:
  - "Logging and telemetry under a real-time budget: lock-free ring buffers and never blocking the control task"
  - Fixed-point arithmetic and when it is still the right answer
---

Two practical questions close this module. First: how do you get visibility into what a real-time system actually did, without the act of recording it becoming the one thing that breaks the deadline everything else in this module has been built to protect? Second: when is the numeric representation you have used everywhere else in this curriculum — floating point — not the right choice, and what replaces it? Both answers draw directly on everything already built: bounded blocking from lesson four, the primitives of lesson five, static allocation from lesson eight, and the determinism that has been this module's subject from its first paragraph.

## Logging under a real-time budget

The most common way a proven-schedulable control loop misses its deadline in practice has nothing to do with its own control law. It is the logging code sitting next to it: a `printf`, a blocking write to a file or a socket, a lock shared with a lower-priority logger — any of it, executed on the control task's own thread, reintroduces exactly the unbounded-blocking hazards lessons four and five spent their length eliminating, for a piece of code whose entire purpose is visibility rather than control. A control task can be response-time-analysed to the microsecond and still miss its deadline because the diagnostic line appended to help debug it blocked on a full buffer or a contended lock.

The standard fix separates *capturing* data from *doing something slow with it*, in time as well as in code. The control task writes a fixed-size record into a preallocated **lock-free ring buffer** — lesson eight's static allocation, applied to logging — using an operation that cannot block even momentarily: advance a write index, store the record, publish the new index. A separate, lower-priority logging task, possibly on a different, non-isolated core entirely, reads from the same buffer whenever it gets scheduled and performs the genuinely slow work — formatting, writing to flash, queuing for downlink — fully decoupled from the control task's own timing.

"Lock-free" deserves precision here rather than treatment as a buzzword. For the single-producer, single-consumer case a control task and its logger actually need, correctness follows from a simple fact: the writer only ever touches its own write index and the buffer slots it is currently filling, the reader only ever touches its own read index and the slots it is currently draining, and neither task ever writes to a variable the other task writes to. The writer publishes its new index with an atomic store using release ordering; the reader observes it with an atomic load using acquire ordering, which guarantees the reader never sees an advanced index before the data it points to has actually been written. No mutex, and no possibility of the writer blocking on the reader or the reverse. This simplicity is specific to one writer and one reader — a buffer with multiple producers or multiple consumers is a genuinely harder problem, needing real compare-and-swap-based synchronisation rather than plain loads and stores, and is worth naming as a different problem rather than assuming the same simple argument extends to it.

::: example Sizing a lock-free log buffer
A control task, running at $200\,\mathrm{Hz}$, writes one $32$-byte record per cycle. Its logging task can be delayed by up to $5\,\mathrm{s}$ — a downlink outage, or a burst of higher-priority work elsewhere — during which the control task keeps writing regardless:

$$
32\,\mathrm{B} \times 200\,\mathrm{Hz} \times 5\,\mathrm{s} = 32\,000\,\mathrm{bytes}.
$$

Rounding up to the next power of two gives $32\,768$ bytes ($2^{15}$), a deliberate choice beyond mere convenience: with a power-of-two buffer size, wraparound is computed with a bitwise mask, `index & 32767`, rather than a modulo operation. The mask is a single, constant-time instruction regardless of the index's value; an integer division (which is what a general modulo compiles to when the divisor is not known to be a power of two at compile time) can itself have operand-dependent timing on some processors — the same "an operation's cost can depend on more than its own inputs alone" caution lesson eight raised about cache and branch prediction, showing up again in an instruction most engineers assume is uniformly cheap.
:::

::: key
Never let the control task block on logging. A lock-free, single-producer single-consumer ring buffer — preallocated, power-of-two sized, indices published with acquire/release ordering — lets the control task record data with a bounded, tiny, constant-time operation, while a separate lower-priority task does the slow work of getting that data off the vehicle.
:::

## Fixed-point arithmetic

**Fixed-point** representation stores a real number as a scaled integer: in a $Q_N$ format, the stored integer is $\mathrm{round}(x \times 2^N)$, so an ordinary integer add, subtract or comparison instruction *is* the fixed-point operation, with no extra work at all. Multiplication needs a wider intermediate — multiplying two $Q_N$ values produces a $Q_{2N}$ result — followed by a right shift back down by $N$ bits to return to $Q_N$.

::: example Q15 multiplication, and where addition needs care
Representing $0.5$ and $0.25$ in $Q_{15}$ (scale factor $2^{15}=32\,768$): $0.5 \to 16\,384$, $0.25 \to 8\,192$. Multiplying as plain integers,

$$
16\,384 \times 8\,192 = 134\,217\,728 \quad (\text{a } Q_{30} \text{ result}),
$$

$$
134\,217\,728 \gg 15 = 4\,096 \;\to\; 4\,096 / 32\,768 = 0.125,
$$

exactly $0.5\times0.25$, with no rounding error at all in this particular case — the shift discards only the low bits a $Q_{30}$-to-$Q_{15}$ conversion is supposed to discard. Addition needs the opposite caution: adding $0.7$ ($22\,938$ in $Q_{15}$) and $0.5$ ($16\,384$) gives $39\,322$, which exceeds $32\,767$, the largest value a signed 16-bit $Q_{15}$ integer can hold. Multiplication grows the *magnitude* of the fractional scale, handled by a shift; addition grows the *range* of the value itself, which a fixed-width type does not absorb automatically the way multiplication's extra bits do — it needs either a wider accumulator or explicit saturation, decided at the point in the code where the addition happens, not left to overflow silently.
:::

**When fixed point is still the right answer**, several real reasons beyond raw speed, all connecting back to this module's central concern:

- **Determinism.** Integer arithmetic's execution time is as analysable as any other integer operation — small, fixed, constant across inputs. On hardware without a hardware floating-point unit, common on small, cheap, low-power microcontrollers chosen for exactly those reasons on a narrow subsystem board, floating point is emulated in software: a library routine with its own branches for normalisation, rounding and special cases, exactly the kind of data-dependent code lesson eight's WCET discussion warns is hard to bound tightly, in place of a handful of fixed-latency integer instructions.
- **Data-dependent timing even with a hardware FPU.** Some processors handle denormalised (subnormal) floating-point values through a slow microcoded or trapped path rather than the normal pipeline — a direct instance of lesson eight's warning that hardware behaviour can depend on the data, not only the operation, in ways that erode a tight WCET bound even when a dedicated floating-point unit is present.
- **Bit-for-bit reproducibility.** Integer and fixed-point arithmetic gives identical results across every compiler, optimisation level and processor implementing the same integer width — a hard requirement for a voted, redundant flight computer architecture, where independently running copies of the same computation must agree exactly for a voter's comparison to mean anything. Floating point offers no such guarantee in general: differing use of fused multiply-add, differing intermediate precision, and differing optimisation choices can all produce bit-level differences between otherwise IEEE-754-compliant systems.
- **Hardware that has no FPU at all.** Cost, power and radiation-hardening constraints routinely produce flight-qualified parts with no floating-point unit at all; fixed point is what makes meaningful control-law computation possible on that hardware in the first place.

The honest balance the other direction: fixed point's dynamic range is far more limited than float's. A $Q_{15}$ value covers only $[-1, 1)$ at a fixed resolution across that entire range, where float trades some precision for an enormous range through its exponent, essentially for free within that range. A quantity that spans widely varying magnitudes over a mission — an accumulating integrator, a value that could legitimately range over several orders of magnitude — needs deliberate, manual scaling analysis under fixed point to avoid overflow or unacceptable precision loss, real engineering work float's exponent absorbs automatically. And on modern processors *with* a hardware FPU running at a comparable clock, floating point is typically not slower for ordinary addition, subtraction, multiplication or division — throughput is rarely the decisive argument today. The reasons that still favour fixed point on capable modern hardware are the determinism and bit-reproducibility arguments above, not raw speed, which is worth stating plainly against the older intuition that fixed point wins mainly because it is faster.

::: warning
Choosing fixed point for a signal whose magnitude varies by orders of magnitude across a mission phase — propellant mass from full to nearly empty, for instance — without a deliberate scaling analysis trades one determinism problem for a correctness one: the representation either saturates at the top of its range or loses most of its precision near the bottom, silently, unless the format and scale factor are chosen with the actual range in mind rather than assumed to work the way they did for the last signal that used them.
:::

## Check yourself

::: check
A control task writes its diagnostic output with a direct call to a logging library that takes an internal mutex shared with a lower-priority telemetry-formatting task. The control task's own response-time analysis, ignoring this call, proves it comfortably meets its deadline. What is wrong with trusting that proof?
:::

::: answer
The proof from lessons two and three accounts only for interference from higher-priority tasks; a mutex shared with a *lower*-priority task reintroduces exactly the priority-inversion hazard lesson four built by hand, and unless that mutex specifically uses priority inheritance or ceiling, the control task's true worst-case blocking is not in the proof at all. The fix is not to add the blocking term and re-run the analysis — it is to remove the shared lock from the control task's path entirely, via a lock-free ring buffer to a separate logging task, so there is no blocking term to add in the first place.
:::

::: check
Explain why a single-producer, single-consumer ring buffer needs no mutex, in terms of which variables each side actually touches — and why that argument would not extend to a buffer with two producer tasks.
:::

::: answer
Correctness follows from the writer only ever modifying its own write index and the slots it is currently filling, and the reader only ever modifying its own read index and the slots it is currently draining — neither side ever writes a variable the other side writes, so there is no race to protect against with a lock, only an ordering requirement (acquire/release on the published index) to guarantee the reader never sees data before it is actually written. With two producers, both would need to modify the same write index, which is now a variable two independent tasks both write — exactly the shared-mutable-state situation a mutex exists to protect, or at minimum a genuine atomic read-modify-write operation like compare-and-swap, not the simple, uncontended loads and stores the single-producer case gets to rely on.
:::

::: check
Why does a power-of-two ring buffer size matter beyond making the arithmetic look tidy — what specifically would go wrong, in this module's own terms, with a buffer sized to an arbitrary number such as $30\,000$ bytes?
:::

::: answer
A non-power-of-two size forces wraparound to be computed with a general modulo operation rather than a bitwise mask, and a general integer division's execution time is not guaranteed constant across operand values on every processor — precisely the kind of operand-dependent timing lesson eight warned makes a worst-case bound harder to establish tightly. It is not that $30\,000$ bytes would be functionally wrong; the buffer would work. It would reintroduce, in the one instruction responsible for index wraparound, the same category of hardware-dependent timing variability the rest of this module has spent its effort designing around everywhere else.
:::

::: check
A guidance computation runs identically on three independently powered flight computers, and their outputs are compared by a voter that expects exact agreement. One of the three computers is later found to use a slightly different compiler optimisation level than the other two. Why is this a more serious concern for a floating-point implementation of the computation than for a fixed-point one?
:::

::: answer
Fixed-point arithmetic is ordinary integer arithmetic, which produces bit-identical results across compilers and optimisation levels for the same source computation on the same integer width — there is no room for a compiler to choose a different, still-correct result. Floating-point arithmetic has more room: differing use of fused multiply-add, differing choices about extended-precision intermediate registers, and differing instruction selection at different optimisation levels can each produce a result that differs in the last bit or several, while remaining entirely within IEEE-754 correctness. For most purposes that difference is immaterial; for a voter expecting exact agreement across independently built or independently optimised strings, it is exactly the kind of mismatch that trips a comparison with no actual fault behind it.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Lock-free SPSC ring buffer | One writer, one reader, disjoint variables each side touches; no mutex needed |
| Publishing the index | Atomic store (release) by the writer, atomic load (acquire) by the reader |
| Ring buffer sizing | Rate × record size × worst-case consumer stall, rounded up to a power of two |
| Power-of-two benefit | Wraparound by bitwise mask — constant time, unlike a general modulo |
| Fixed-point ($Q_N$) | Integer scaled by $2^N$; add/subtract/compare are native; multiply needs a wide intermediate and a shift |
| Why fixed point still wins | Deterministic timing without an FPU, immunity to data-dependent float paths, bit-for-bit reproducibility for voting |
| Why float still wins | Automatic dynamic range via the exponent; comparable speed on hardware with a real FPU |
| The core trade | Fixed point trades float's automatic range for a guarantee: identical results, every time, on every compliant integer unit |

That closes the module. Every lesson in it has been one instance of the same demand, asked of a different part of the system: not "how fast is this," but "what is the worst it can ever be, and can you prove it." A scheduler proves it of a task set. Priority inheritance proves it of a lock. A guard region proves it of a stack. A ring buffer proves it of a log call that used to threaten the very deadline it was meant to help you debug. The habit is the same everywhere it appears: name the worst case, prove the bound, and never mistake a comfortable average for evidence of either.
