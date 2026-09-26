---
id: l08-no-heap-no-recursion
title: No heap, no recursion, and the limits of predictable hardware
minutes: 25
covers:
  - "No dynamic allocation after initialisation: static pools, fixed-capacity containers, and placement construction"
  - Bounded loops, no recursion, and the rest of the Power of Ten rules
  - Cache and branch-predictor effects on determinism; why the fastest code is not always the most predictable
---

Before a week of backpacking in the wilderness, you pack everything at home. Food for seven days, a water filter, spare socks. Once you are on the trail, there is no store. If you forgot something, you find out at the worst possible moment, far from help. So you do the worrying at home, with a checklist, where running short means you simply do not leave yet.

Flight code is packed the same way. This lesson gives the coding habits that keep lesson one's timing bounds and lesson seven's stack bounds provable: two rules about what flight code may not do — grab new memory after startup, or have a function call itself — plus the rules that go with them. Then it turns to something the processor does whether you ask or not, which no coding rule fully removes.

All of these share one idea, and it is worth saying before the details. **You can only prove a bound on something if it does not depend on a history that could run forever, or run differently every time.** Watch for that idea three times in this lesson.

## Why malloc is banned after initialization

Picture a parking lot. Cars come and go all day, parking wherever there is a gap. By evening there are plenty of empty spaces — but scattered one here, two there. Then a bus arrives. The lot has more than enough empty space in total, yet no single gap is long enough for the bus.

A computer's **heap** is that parking lot. It is the pool of memory a program can ask for while it runs. In C you ask with `malloc`; in C++ with `new`. The code that hands out and takes back those pieces is the **allocator**. The scattered-gaps problem is called **[[fragmentation|fragmentation]]**.

The allocator causes two separate problems for flight code.

**Its time has no bound.** To answer a request, an allocator searches its list of free gaps. How long that takes depends on how broken up the heap is, which depends on every allocation and release since the program started. So no one can write down a worst-case execution time for a call to `malloc`. The worst case is not a property of this call's arguments; it is a property of a long history the analysis cannot see.

**It can fail in the middle of the mission.** A fragmented heap can refuse a request even when the total free memory is more than enough — the bus and the parking lot. That can first happen after days of normal running, in a pattern no ground test reproduced. And the code that handles "allocation failed" is, by its nature, the least-run code in the system — the wrong property for code that only runs when something has already gone wrong.

::: key Why no dynamic allocation after init
Unbounded and history-dependent execution time, plus the possibility of failing mid-mission once the heap fragments — in a code path that is by construction the least tested. Allocate at initialisation, then fixed-capacity containers and static pools.
:::

The fix is not "be careful with malloc". It is to take the allocator out of flight operation entirely. Every allocation happens once, during **initialization** — the startup phase before the vehicle depends on the software. A shortage there shows up on the ground as a fail-to-launch condition, not in flight. After that, three tools do everything dynamic allocation used to do:

- **Static pools.** A fixed-size array of $N$ objects, set aside in advance. Code borrows a slot and hands it back, tracked by an index or a list of free slots. You choose $N$ from a proven worst-case need — the same reasoning lesson five used to size a message queue and lesson seven used to size a stack, applied to a third kind of resource.
- **Fixed-capacity containers.** A container whose size is set once and never grows: a plain fixed array, or a vector-like type with a capacity fixed at construction. It replaces a container that quietly asks for more memory when it runs out of room.
- **Placement construction.** C++'s **[[placement new|placement-new]]** builds an object in memory the pool already owns. It runs the object's constructor without ever asking the allocator for storage.

Here is a small pool built from all three. It compiles with `g++ -std=c++17` and runs as shown.

```cpp
#include <array>
#include <cstddef>
#include <cstdio>
#include <new>

struct Packet {
    unsigned id;
    float value;
    Packet(unsigned i, float v) : id(i), value(v) {}
};

// A fixed pool of N packets. The storage is part of the object itself,
// so it exists before main() runs and never grows.
template <typename T, std::size_t N>
class StaticPool {
public:
    template <typename... Args>
    T* create(Args... args) {
        for (std::size_t i = 0; i < N; ++i) {          // bounded: at most N steps
            if (!used_[i]) {
                used_[i] = true;
                return new (&slots_[i]) T(args...);     // placement new: no allocator
            }
        }
        return nullptr;                                  // "pool exhausted": a known, testable fault
    }
    void destroy(T* p) {
        std::size_t i = static_cast<std::size_t>(
            reinterpret_cast<Slot*>(p) - slots_.data());
        p->~T();                                         // run the destructor by hand
        used_[i] = false;
    }
private:
    struct alignas(T) Slot { unsigned char bytes[sizeof(T)]; };
    std::array<Slot, N> slots_{};
    std::array<bool, N> used_{};
};

static StaticPool<Packet, 2> pool;   // sized from a proven worst case, not a guess

int main() {
    Packet* a = pool.create(1u, 0.5f);
    Packet* b = pool.create(2u, 1.5f);
    Packet* c = pool.create(3u, 2.5f);   // a third request finds the pool full
    std::printf("a=%u b=%u c=%s\n", a->id, b->id, c ? "ok" : "pool exhausted");
    pool.destroy(a);
    Packet* d = pool.create(4u, 3.5f);   // the freed slot is reused
    std::printf("d=%u\n", d->id);
}
// Output:
// a=1 b=2 c=pool exhausted
// d=4
```

In `create`, the loop runs at most $N$ times, so its worst case is known in advance. `new (&slots_[i]) T(args...)` is placement new: "build a `T` right here, in this slot". Running out returns `nullptr`, a plain, testable result.

::: example Sizing a static pool the way you sized a queue
A telemetry-formatting task takes packet buffers from a static pool instead of allocating them. The worst-case number of packets in use at once is $40$. That comes from the same kind of response-time argument lesson five used for a queue. Each buffer is $64$ bytes. Multiply:

$$
40 \times 64 = 2\,560\,\mathrm{bytes}.
$$

That is the pool's fixed size, set aside once at initialization and never resized.

A request for a $41^\mathrm{st}$ buffer, if it ever happened, would be a detectable fault reported in telemetry — "pool exhausted" — not a silent allocator failure found when later code uses a null pointer.

The $40$ is not a guess rounded up for comfort. Like lesson five's queue depth and lesson seven's stack budget, it answers one question: what is the most this resource will ever hold at once? Sanity check: $2\,560$ bytes is $2.5\,\mathrm{KiB}$, tiny on any flight computer. The point is not saving memory; it is knowing the number.
:::

::: warning Allocation hides in ordinary-looking code
In C++, a lot of code calls the allocator without the word `new` appearing. `std::vector::push_back` asks for more memory when the vector is full. `std::string` and `std::function` can allocate. Throwing an exception usually allocates too. A flight code base bans or wraps these after initialization, and many teams replace the global allocator with one that faults loudly if it is called once the system is running.
:::

## Bounded loops and no recursion

Lesson one's static timing analysis needs a provable maximum number of passes for every loop, fixed by the code's own structure. A loop written `while (!done)`, where `done` is set by some outside event at an unknown time, has no such bound: it might finish on the first pass or never. So flight standards require every loop to carry a bound you can prove by reading the code — a `for` loop over a fixed range, or a `while` loop with a counter that cannot be skipped.

**Recursion** — a function calling itself, directly or through other functions — fails the same test for a related reason. Think of two mirrors facing each other: the reflections go on as far as the light lets them. A recursive function's call depth depends on its input. So its call graph has a [[loop in it|cyclic-call-graph]], and there is no single deepest path to add frame sizes along — the exact method lesson seven used to size a stack. A call graph without recursion has one provable worst case. A recursive one has none.

The practical result is lesson seven's stack overflow: unbounded call depth is unbounded stack use. Without a guard region, the overflow quietly damages whatever memory sits next to the stack, and the symptom turns up far from the cause.

::: example A recursive walk that passed testing and would fail in flight
A command queue is walked recursively, one stack frame per queued item, at $32$ bytes per frame. During testing the queue never held more than ten items:

$$
10 \times 32 = 320\,\mathrm{bytes}.
$$

That fits easily in any reasonable stack.

Later in the mission, a fault backs up ten thousand commands instead of ten — a backlog nobody designed for and testing never produced. This is the least-tested-path pattern from the allocator section again:

$$
10\,000 \times 32 = 320\,000\,\mathrm{bytes} = \frac{320\,000}{1024}\,\mathrm{KiB} = 312.5\,\mathrm{KiB}.
$$

($\mathrm{KiB}$, read "kibibyte", is $1024$ bytes.)

The task stack is a typical $16\,\mathrm{KiB} = 16\,384$ bytes. So the overflow does not wait for ten thousand items. It comes at

$$
\frac{16\,384}{32} = 512\ \text{items},
$$

a backlog the fault reaches almost at once.

An iterative walk — a plain loop — uses a fixed few tens of bytes of local variables however long the queue is. The recursive version was not a slightly worse choice: it turned an ordinary backlog into a stack overflow, at a queue length testing never came near.
:::

## The rest of the Power of Ten rules

"No allocation after startup" and "no recursion" are two of ten rules in a widely used safety-critical coding standard called **[[the Power of Ten|power-of-ten-origin]]**. All ten have the same purpose. They keep each function small and plain enough for a human reviewer and an automatic checking tool to verify it completely, instead of trusting it. In spirit:

1. **Simple control flow, no recursion.** No `goto`, no jumping out of functions sideways, no function that calls itself.
2. **A bound on every loop** that a tool can prove from the code.
3. **No allocation after initialization.**
4. **Short functions** — about one printed page, roughly 60 lines — so each fits in a reviewer's head and in one pass of a checking tool.
5. **Assertion density**: at least two assertions per function on average, checking what must be true on entry, on exit and throughout. A broken assumption caught where it happens is a fault you can diagnose; found three functions later, it is not.
6. **Smallest possible scope for data.** A global that ten functions can touch gives a bug ten places to hide. It is the bounding instinct applied to space instead of time.
7. **Check every return value**, and check inputs inside every function, so failures show up where they happen.
8. **Restricted preprocessor**: header includes and simple macros only, so everyone reads the code that will actually run.
9. **Restricted pointer use**: at most one level of dereferencing (following a pointer to what it points at), and no function pointers without a strong reason. A function pointer hides which function a call will reach, which breaks the call graph — the same analysis recursion breaks.
10. **All warnings on, zero warnings, plus static analysis** on every build. This turns the other nine from a style guide into something a machine checks every time — the job `-Werror` did in the prerequisite C++ module, widened to the whole rule set.

::: key The Power of Ten rules, in spirit
Simple control flow, no recursion; a statically provable bound on every loop; no allocation after initialisation; short functions; assertion density; smallest possible scope for data; check every return value; restricted preprocessor; restricted pointer use; compile with all warnings on, zero warnings, plus static analysers.
:::

::: key What every rule is for
Every Power of Ten rule reduces to the same test: can a reviewer, and a static-analysis tool, compute an exact bound — on time, on memory, on what a variable could hold, on what a call could reach — without running the program and hoping? No allocation after init and no recursion are the two rules with the sharpest, most direct effect on a real-time proof. The rest make sure nothing else in the function quietly reopens the same problem.
:::

## Cache and branch-predictor effects on determinism

Everything above is about the code you write. This last piece is not. It comes from the processor itself.

Picture a workshop. Tools you used a minute ago are on the bench, in arm's reach. Everything else is out in the garage. Grabbing a tool from the bench takes a second; fetching one from the garage takes a couple of minutes. You work fast when the job keeps reaching for the same few tools, and slowly when it keeps sending you to the garage.

A modern processor is fast on average because of two tricks, and both depend on **history** — on what happened before.

A **[[cache|cache-ladder]]** is the bench. It is a small, fast memory right next to the processor that holds recently used data. An access that is already **warm** — sitting in the cache — costs a handful of cycles. (A **cycle** is one tick of the processor's clock.) The same access when **cold** — not in the cache — waits for main memory, one to two orders of magnitude longer. Typical numbers: a few cycles for the closest cache, against a couple of hundred cycles for main memory, depending heavily on the processor.

A **branch predictor** is a good guesser. Every `if` in the code is a **branch**: the processor must go one way or the other. Rather than wait to find out, it guesses from how that same branch went the last several times, and starts working down the guessed path. A right guess costs nothing extra. A wrong guess — a **misprediction** — throws the guessed work away and costs a real penalty, commonly in the low tens of cycles on a modern processor.

Here is the link to `malloc`: both tricks make the time depend on what happened *before* this run, not on this call's inputs — the same history-dependence that made the allocator's worst case unknowable.

A loop body that takes four cycles when everything is warm can take several times as long on the one pass where another job pushed its data out of the cache, or where the data broke the pattern and the branch guessed wrong. Lesson one listed "a cold cache line" among the things a short test campaign never sees. This is what that phrase means in the hardware.

::: example Fast on average, or predictable in the worst case
Two versions of a lookup used inside a hot loop are timed with a warm cache and branch history, and again with a deliberately cold cache and a mistrained predictor.

| | Branch-heavy, tuned for the common case | Branch-free, fixed access pattern |
| --- | --- | --- |
| Typical (warm) | $4$ cycles | $9$ cycles |
| Worst case (cold, mispredicted) | about $160$ cycles | about $20$ cycles |
| Worst-to-typical ratio | $160 / 4 = 40\times$ | $20 / 9 \approx 2.2\times$ |

The first version wins the ordinary case: its data branch usually goes the same way and its memory is usually warm. When those assumptions fail it pays both penalties at once — thrown-away guessed work and a wait on main memory.

The second version gives up some typical speed. It touches a small, fixed set of memory and has no data-dependent branch, so its worst case stays close to its typical case.

This is lesson one's Version A and Version B again, with the hardware reason for the gap in view. The fastest code by average is not the most predictable code by worst-to-typical ratio, and a hard deadline cares only about the second.
:::

Three habits follow.

- **Keep a hot loop's working set small** enough to fit a known level of cache. Lesson six's core isolation removes *other* tasks' interference; a routine's own oversized data is the self-inflicted version.
- **Avoid data-dependent branches in the innermost hot path**, or make both directions cost about the same.
- **Avoid virtual calls and function pointers in that inner path.** An indirect call is much harder for the processor to guess than a direct one.

None of this replaces measurement. A worst-case timing campaign from lesson one must include a deliberately cold cache and a [[deliberately mistrained predictor|speculation-and-spectre]] among its test conditions — not only the warm, friendly steady state a simple benchmark gives by default.

::: warning A tight benchmark measures the best case
A benchmark that runs the same loop ten thousand times in a row measures the warm, well-predicted case almost every time: the cache and predictor settle into the benchmark's own pattern. A real control cycle arrives after long stretches of other work. Flush the cache, or mix in enough unrelated work to push its data out, or the campaign will report the fast number and call it the worst one.
:::

## Check yourself

::: check
A developer says a small fixed-size memory pool, created once at startup, is no better than `malloc`, because it still keeps track of free and used slots. What is the difference that actually matters for a schedulability proof?
:::

::: answer
The question is not whether bookkeeping exists — a pool does track which slots are free. The question is whether that bookkeeping's worst-case time and outcome can be proven in advance.

A pool with $N$ slots answers with a search over at most $N$ entries, a number known at compile time, and its one failure, "pool exhausted", is simple and detectable. A general allocator's worst-case time depends on the whole history of earlier allocations and releases, which no fixed number bounds. The pool swaps an unanalyzable general mechanism for a small one that can be analyzed completely.
:::

::: check
Why does a recursive function defeat lesson seven's stack-sizing method, rather than just making the total larger?
:::

::: answer
The method adds frame sizes along the single deepest path through a call graph. That only works when the graph has no loops and a finite set of paths you can list — which is what makes "the deepest path" a well-defined thing you can compute.

A recursive function's call graph has a loop by construction, because the function calls itself. There is no fixed set of paths to list. The actual depth on any given call depends on the input, which the analysis does not know in advance.

So the sum does not merely grow: "the deepest path" stops being a question the call graph can answer at all.
:::

::: check
Explain why a branch predictor's behavior is "history-dependent" in the same sense that `malloc`'s time is. Why does that matter for how you test for worst-case timing?
:::

::: answer
The predictor's guess for a branch comes from a record of that branch's recent outcomes. So what it predicts now depends on every earlier run of that branch since the record was last disturbed — not on the current call's inputs alone.

That is the same shape as `malloc` depending on the whole allocation history. In both cases the worst case cannot be worked out from the current call by itself, because its cost depends on a history.

For testing, a benchmark that runs the same path over and over trains the predictor into its best case and never exercises a misprediction. A worst-case campaign must recreate the bad history on purpose.
:::

::: check
A reviewer flags a function that uses a function pointer to choose between several sensor-parsing routines at runtime, depending on which sensor is attached. Which two problems from this lesson does that pattern risk? Is either one automatically disqualifying?
:::

::: answer
It risks an unresolvable call graph — the restricted-pointer rule, which protects the deepest-path stack-sizing method. And it risks poorer branch prediction on the indirect call itself — the cache and predictor section.

Neither is automatically fatal. The Power of Ten rule itself bans function pointers, but its explanation allows them given a strong justification and a way for the checking tools to see every possible target. A fixed, finite table of sensor-type handlers, known when the program is built, meets that: an analyzer can still resolve the whole call graph. The indirect call is less predictable than a direct one, but the choice depends on which sensor is attached, not on its *readings*, so it does not flip from sample to sample.

What disqualifies the pattern is an open-ended set of targets, or one built while the program runs. Then neither the stack analysis nor the timing argument has a finite structure left to reason about.
:::

## Summary

| Rule or idea | Reason |
| --- | --- |
| No allocation after init | Allocator time is history-dependent and unbounded; failure is possible mid-mission on the least-tested path |
| Replacements | Static pools, fixed-capacity containers, placement new — sized from a proven worst case |
| Bounded loops | A provable limit on every loop is what makes static timing analysis possible at all |
| No recursion | The call graph gets a loop, so there is no single deepest path; depth depends on the data |
| Other Power of Ten rules | Short functions, assertion density, smallest data scope, checked returns, restricted preprocessor and pointers, all warnings as errors plus static analysis — all so a function can be verified completely |
| Cache | Warm access: a handful of cycles. Cold (main-memory) access: one to two orders of magnitude more |
| Branch prediction | Right guess: free. Misprediction: tens of cycles, and the guessed work thrown away |
| The core point | Both depend on history, exactly like `malloc`; code tuned for the common case can have a worst case far from its average, and a small worst-to-typical gap is what a timing proof needs |

You now have the code-level and hardware-level reasons flight code looks the way it does. The next lesson moves outward, from a task's own code to the world it talks to: device registers, the `volatile` keyword, and the buses a flight computer uses to reach its sensors and actuators.

::: context fragmentation Plenty of room, nowhere to put it
Here is a heap of $100\,\mathrm{KiB}$ after a day of use. Three gaps of $20\,\mathrm{KiB}$ each are free — $60\,\mathrm{KiB}$ in all — but a request for $40\,\mathrm{KiB}$ fails, because no single gap is that long.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="30" height="30" fill="#6c7a93" stroke="#1f2a44"/>
  <rect x="60" y="30" width="60" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="120" y="30" width="45" height="30" fill="#6c7a93" stroke="#1f2a44"/>
  <rect x="165" y="30" width="60" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="225" y="30" width="45" height="30" fill="#6c7a93" stroke="#1f2a44"/>
  <rect x="270" y="30" width="60" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="90" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">20 free</text>
  <text x="195" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">20 free</text>
  <text x="300" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">20 free</text>
  <text x="180" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">grey = in use, sizes in KiB</text>
  <rect x="30" y="80" width="120" height="24" fill="#b4232c" stroke="#1f2a44"/>
  <text x="90" y="96" font-size="11" text-anchor="middle" fill="#fff">request: 40</text>
  <text x="160" y="96" font-size="11" fill="#b4232c">fits in no single gap</text>
</svg>
```

Which gaps exist depends on the exact order of every earlier request and release. That is why fragmentation can appear after days of flight in a pattern no test repeated.
:::

::: context placement-new Building an object in a spot you already own
Ordinary `new` does two jobs: it asks the allocator for memory, then runs the constructor to set the object up in it. **Placement new**, written `new (address) T(...)`, does only the second job, at an address you supply.

Because nothing was allocated, nothing is freed with `delete`. Instead you call the destructor yourself, `p->~T()`, and mark the slot free again. The memory itself belongs to the pool for the life of the program.
:::

::: context cyclic-call-graph A chain has a bottom, a loop does not
On the left, each function calls the next and the chain ends, so the deepest path is fixed. On the right, `walk_queue` calls itself, once per item. Its depth is set by the data, not the code.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="30" y="10" width="110" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/><text x="85" y="27">main_loop</text>
    <rect x="30" y="62" width="110" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/><text x="85" y="79">read_sensors</text>
    <rect x="30" y="114" width="110" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/><text x="85" y="131">kalman_update</text>
    <rect x="215" y="62" width="110" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/><text x="270" y="79">walk_queue</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="85" y1="36" x2="85" y2="56"/><line x1="85" y1="88" x2="85" y2="108"/>
    <path d="M300,62 C300,30 240,30 240,56"/>
  </g>
  <polygon points="85,62 80,53 90,53" fill="#1f2a44"/>
  <polygon points="85,114 80,105 90,105" fill="#1f2a44"/>
  <polygon points="240,62 235,53 245,53" fill="#1f2a44"/>
  <text x="85" y="160" font-size="11" text-anchor="middle" fill="#1d6fd1">one deepest path</text>
  <text x="270" y="120" font-size="11" text-anchor="middle" fill="#b4232c">calls itself: depth</text>
  <text x="270" y="135" font-size="11" text-anchor="middle" fill="#b4232c">set by the data</text>
</svg>
```
:::

::: context power-of-ten-origin Where the Power of Ten came from
Gerard Holzmann of NASA's Jet Propulsion Laboratory published the ten rules in 2006, in a four-page article titled "The Power of Ten: Rules for Developing Safety-Critical Code". His point was that long coding standards with hundreds of rules get ignored, while ten rules a tool can check actually get followed. JPL built them into its own C coding standard. The article is short and free to read, and worth reading against your own code.
:::

::: context cache-ladder How far away the data is
Rough costs, drawn to the same scale. Exact numbers vary a lot between processors; the ratios are the point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="10" y="32">cache hit</text>
    <text x="10" y="67">mispredict</text>
    <text x="10" y="102">main memory</text>
  </g>
  <rect x="80" y="20" width="6" height="18" fill="#1d6fd1"/>
  <rect x="80" y="55" width="21" height="18" fill="#f2b880"/>
  <rect x="80" y="90" width="270" height="18" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="92" y="33">about 4 cycles</text>
    <text x="107" y="68">about 15 cycles</text>
    <text x="215" y="124" text-anchor="middle">about 200 cycles</text>
  </g>
</svg>
```

At a clock of $2\,\mathrm{GHz}$ (two billion cycles a second), $200$ cycles is $100\,\mathrm{ns}$. Small alone, but a loop that misses on every pass multiplies it.
:::

::: context speculation-and-spectre Guessing ahead has other costs too
Working ahead down a guessed path is called **speculative execution**. In 2018, researchers showed that the traces it leaves in the cache can leak secrets between programs — the attacks named Spectre and Meltdown. The fixes slowed some programs noticeably.

For a real-time engineer, the lesson is the same one as this section: the processor's cleverness is invisible in the source code, it depends on history, and it can change your timing when a software or firmware update changes how the processor guesses.
:::
