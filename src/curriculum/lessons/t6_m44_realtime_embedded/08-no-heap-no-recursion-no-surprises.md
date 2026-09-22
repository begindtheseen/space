---
id: l08-no-heap-no-recursion
title: No heap, no recursion, and the limits of predictable hardware
minutes: 24
covers:
  - "No dynamic allocation after initialisation: static pools, fixed-capacity containers, and placement construction"
  - Bounded loops, no recursion, and the rest of the Power of Ten rules
  - Cache and branch-predictor effects on determinism; why the fastest code is not always the most predictable
---

Lesson one defined determinism as a provable bound on timing, and lesson seven showed what happens to a stack that has no provable bound on its depth. This lesson supplies the source-code discipline that keeps both promises: two rules about what flight code may not do — allocate memory after startup, or call itself recursively — and one rule about what the processor does whether you ask it to or not, which no amount of source-code discipline alone removes. All three share a single underlying shape, worth stating before the details: a bound is only provable when the thing being bounded does not depend on history that could, in principle, run forever or run differently every time. Watch for that shape to recur three times in this lesson.

## Why malloc is banned after initialisation

A general-purpose allocator — `malloc`, `new` without a fixed destination — has an execution time that depends on the fragmentation state of the heap, which depends on the entire history of every allocation and deallocation since the program started. There is no way to write down a worst-case execution time for a call to `malloc` in the sense lesson one requires, because the worst case is not a property of this call's arguments; it is a property of an unbounded, unpredictable history that the call itself cannot see and the analysis cannot enumerate. This is the same failure lesson one used WCET to rule out, applied to memory instead of time: a quantity that depends on history rather than on the current input has no bound a static analysis can compute.

The second problem is independent of the first and, in some ways, worse. A fragmented heap can fail to satisfy a request even when the total free memory would be more than enough, because no single free block is large enough — and that failure can appear after hours or days of otherwise normal operation, in an allocation pattern no ground test happened to reproduce. The code path that handles an allocation failure is, by construction, the least exercised path in the entire system, which is exactly the wrong property for code that only runs when something has already gone wrong.

The fix is not "be careful with malloc" — it is to remove the allocator from flight operation entirely. Every allocation happens once, during initialisation, where a shortage is a ground-testable, fail-to-launch condition rather than an in-flight one. After that point, three techniques cover what dynamic allocation used to do:

- **Static pools**: a fixed-size array of $N$ pre-allocated objects, handed out and returned through an index or a free list, with $N$ chosen from a proven worst-case need — the identical reasoning lesson five used to size a message queue and lesson seven used to size a stack, applied to a third kind of resource.
- **Fixed-capacity containers**: a bounded container — a fixed-size array, or a vector-like type whose capacity is set once at construction and never grows — in place of a container that silently reallocates when it runs out of room.
- **Placement construction**: C++'s placement `new` constructs an object directly into memory a pool already owns, calling the constructor without ever asking an allocator for storage.

::: example Sizing a static pool the same way you sized a queue
A telemetry-formatting task draws packet buffers from a static pool instead of allocating them. The worst-case number of packets in flight at once, established from the same kind of response-time argument lesson five used for a queue, is $40$; each buffer is $64$ bytes.

$$
40 \times 64 = 2\,560\,\mathrm{bytes}.
$$

That is the pool's fixed size, allocated once during initialisation and never resized. A request for a $41^\mathrm{st}$ buffer, if it ever happened, would be a detectable, telemetry-visible fault — "pool exhausted" — rather than a silent allocator failure discovered by whatever code next tries to use a null pointer. The number $40$ is not a guess rounded up for comfort; it is the same kind of proven worst case as the queue depth in lesson five and the stack budget in lesson seven, because it is the same underlying question asked a third time: what is the most this resource will ever need to hold at once.
:::

## Bounded loops and no recursion

Static WCET analysis, from lesson one, walks every loop and needs a provable maximum iteration count for each one — a number fixed by the code's own structure, not by how quickly external data happens to satisfy some condition. A loop written as `while (!done)`, with `done` set only by an external event of unknown timing, has no such bound: it might finish on the first pass or never finish at all, and a static analyser has no way to tell which. Flight coding standards require every loop to carry an independent, statically provable bound — a `for` loop over a fixed range, or a `while` loop with an explicit counter that cannot be bypassed — precisely so that the static half of WCET analysis has something to compute.

**Recursion** fails the identical requirement for a related reason. A recursive function's call depth depends on its input, so the call graph is not only cyclic — it has no single deepest path to sum frame sizes along, the exact method lesson seven used to size a stack. Where a bounded, non-recursive call graph has one provable worst case, a recursive one has none, and the practical consequence is exactly lesson seven's stack overflow: unbounded call depth is unbounded stack usage, waiting for whatever input finally drives it past the guard region.

::: example A recursive call chain that passed testing and would not pass flight
A command queue is walked recursively, one stack frame per queued item, at $32$ bytes per frame. During testing the queue never held more than ten items:

$$
10 \times 32 = 320\,\mathrm{bytes} \quad\text{— comfortably inside any reasonable stack.}
$$

A fault condition later in the mission backs up ten thousand commands instead of ten — a backlog nobody engineered and testing never produced, exactly the least-tested-path pattern from the allocator discussion above:

$$
10\,000 \times 32 = 320\,000\,\mathrm{bytes} = 312.5\,\mathrm{KiB}.
$$

Against a typical $16\,\mathrm{KiB}$ task stack, the overflow does not wait for ten thousand items — it happens at $16\,384 / 32 = 512$, a backlog the fault condition reaches almost immediately. An iterative walk uses a small, fixed number of local variables regardless of the queue's length — on the order of tens of bytes, independent of $N$ — because it has no call-depth-per-item to accumulate in the first place. The recursive version was not a subtly bad choice; it converted an ordinary backlog into a stack overflow, and it did so at a queue length testing never came near.
:::

## The rest of the Power of Ten rules

No dynamic allocation and no recursion are two of ten rules from a widely used safety-critical coding standard; the remainder share the same purpose — keeping a function's behaviour small enough for a reviewer, and a static-analysis tool, to verify completely, rather than trust. **Short functions** fit in a reviewer's working memory and in a single pass of most static analysers; a thousand-line function is not merely hard to read, it is hard for a tool to exhaustively check. **Assertion density** — the earlier C++ module's own territory in full — asks for at least two assertions per function, checking preconditions, postconditions and invariants, because a violated assumption caught immediately at its source is a bounded, diagnosable fault, where the same violation discovered three functions later is not. **Smallest possible scope for data** limits how much code could conceivably corrupt a given variable, the same bounding instinct applied to space that bounded loops apply to time — a global that ten functions can touch has ten times the surface for a bug to hide in, compared with a variable visible to one. **Check every return value**, covered fully in the prerequisite C++ module, makes every failure visible at its call site rather than silently discarded. **Restricted preprocessor use** keeps a reviewer and a static analyser looking at the code that will actually run, rather than at a macro that expands into a different shape depending on definitions elsewhere. **Restricted pointer use** — no more than one level of dereference in most contexts, and function pointers used only where the possible targets are enumerable — keeps the call graph resolvable, which is not a separate concern from stack sizing above: an unresolvable call graph defeats the same worst-case-path analysis recursion defeats, for the same underlying reason. **Compiling with every warning enabled, zero warnings tolerated, alongside static analysis tools**, is what turns the rest of this list from a style guide into something a machine checks on every build — the identical role `-Werror` played for `[[nodiscard]]` in the prerequisite module, generalised to the whole rule set.

::: key
Every Power of Ten rule reduces to the same test: can a reviewer, and a static-analysis tool, compute an exact bound — on time, on memory, on what a variable could hold, on what a call could resolve to — without running the program and hoping. No allocation after init and no recursion are the two rules with the sharpest, most direct consequences for a real-time proof; the rest exist to make sure nothing else in the function quietly reopens the same problem.
:::

## Cache and branch-predictor effects on determinism

Everything above is a source-code discipline; this last piece is not, because it comes from the processor itself. A modern processor is fast on average because of two mechanisms that both depend on **history** rather than on the current instruction alone. A **cache** holds recently or predictably used data close to the processor, so an access already "warm" in cache costs a handful of cycles while the same access, cold, waits for main memory at a cost one to two orders of magnitude larger — typically a few cycles for a first-level cache hit against a plausible order of a couple of hundred cycles for a genuine main-memory access, depending heavily on the processor. A **branch predictor** guesses, from the recent history of a given branch, which way it will go this time, and speculatively executes down the guessed path to keep the pipeline full; a correct guess costs nothing extra, a misprediction discards the speculative work and costs a real, if smaller, penalty — commonly cited in the low tens of cycles on a typical modern pipeline.

The point is the parallel to `malloc` earlier in this very lesson: both mechanisms produce a timing outcome that depends on what happened *before* this particular execution, not on this call's own inputs — the identical history-dependence that made an allocator's WCET unanalysable. A loop body that runs in four cycles when its data and its branch history are warm from the previous thousand iterations can run in several times that on the one iteration where the cache line was recently evicted by something else on the same core, or the branch guessed wrong because this iteration's data broke the pattern the last thousand had established. This is precisely the mechanism behind lesson one's own worked example: the $12.4\,\mathrm{ms}$ outlier against a $2\,\mathrm{ms}$ typical case was attributed there to "a cache-cold path," and this is what that phrase means concretely.

::: example Optimised for the common case, and what it costs the worst case
Two implementations of a lookup used in a hot loop, profiled with both a warm and a deliberately cold cache and branch history.

| | Branch-heavy, sorted for the common case | Branch-free, fixed access pattern |
| --- | --- | --- |
| Typical (warm) | $4$ cycles | $9$ cycles |
| Worst case (cold, mispredicted) | $\approx 160$ cycles | $\approx 20$ cycles |
| Worst-to-typical ratio | $40\times$ | $2.2\times$ |

The first version is faster in the ordinary case — it exploits a data-dependent branch that is usually taken the same way, and a cache access pattern that is usually warm — and dramatically slower in the case where those assumptions fail, because a misprediction discards pipeline work and a cache miss waits on main memory, and both penalties are paid at once when the assumption breaks. The second version gives up some typical-case speed by touching a fixed, small working set and avoiding the data-dependent branch entirely, and in exchange its worst case is close to its typical case — a small, provable gap rather than a large, history-dependent one. This is lesson one's Version A and Version B again, with the hardware mechanism behind the gap made explicit: the fastest code, measured by its average, is not the same code as the most predictable, measured by the ratio between its worst case and everything else.
:::

Three practices follow directly. Keep a hot loop's working set deliberately small enough to fit a known cache level, rather than letting it fall out of cache depending on whatever else recently ran on the same core — lesson six's core isolation removes *other tasks'* interference, but a routine's own data footprint is a self-inflicted version of the same problem. Avoid data-dependent branches in the innermost hot path where possible, or arrange both directions to cost about the same, so a misprediction is not paired with a large cache penalty at the same instant. And avoid virtual dispatch or function pointers in that same inner path — the identical reasoning that made an unresolvable call graph a stack-sizing problem above makes it a branch-prediction problem here too, since an indirect call is far harder for the processor to predict than a direct one. None of this replaces measurement: a WCET campaign, from lesson one, has to include a deliberately cold cache and an adversarially trained predictor among its test conditions, not only the warm, friendly steady state a simple benchmark loop produces by default.

::: warning
A benchmark that runs the same hot loop ten thousand times in a tight timing loop measures the warm-cache, well-predicted case almost exclusively — by the thousandth iteration, the cache and the branch predictor have both converged to whatever pattern the benchmark itself established, which is not the pattern a real control cycle sees arriving between long stretches of other work. A WCET campaign needs the cold case deliberately induced — flush the cache, or interleave the measurement with enough unrelated work to evict it — or it will report the fast number and call it the worst one.
:::

## Check yourself

::: check
A developer argues that a small, fixed-size memory pool created once at startup is no better than `malloc` because it still involves managing free and used slots. What is the actual distinction that matters for a schedulability proof?
:::

::: answer
The distinction is not whether bookkeeping exists — a pool does track which slots are free — it is whether that bookkeeping's worst-case time and outcome are provable in advance. A fixed-size pool with $N$ slots has a request-handling time bounded by a search over at most $N$ fixed-size entries, known at compile time, and a failure mode (pool exhausted) that is a simple, detectable, bounded condition. A general-purpose allocator's worst-case time depends on an unbounded history of prior allocations and deallocations across the whole program, which cannot be bounded by any fixed number at all. The pool trades an unanalysable general mechanism for a specific, small, fully analysable one.
:::

::: check
Why does a recursive function's call graph defeat the same stack-sizing method that works for an ordinary, non-recursive function, rather than merely making the sum larger?
:::

::: answer
The method in lesson seven sums frame sizes along the single deepest path through a call graph that is acyclic and has a finite, enumerable set of paths — which is what makes "the deepest path" a well-defined, computable thing. A recursive function's call graph is cyclic by construction (the function calls itself), so there is no fixed set of paths to enumerate at all; the actual depth on any given call depends on the input, which the static analysis does not know in advance. It is not that the sum comes out larger — it is that "the deepest path" stops being a question the call graph alone can answer, which is a qualitatively different problem than a large but fixed number.
:::

::: check
Explain why a branch predictor's behaviour is "history-dependent" in the same sense `malloc`'s execution time is history-dependent, and why that parallel matters for how you test for worst-case timing.
:::

::: answer
A branch predictor's guess for a given branch is built from a table of that branch's recent outcomes, so what it predicts on this execution depends on every prior execution of that same branch since the table was last disturbed — not on anything about the current call's own inputs alone. This is the identical shape as `malloc`'s dependence on the full allocation history: in both cases, the worst case cannot be derived from the current call in isolation, because the current call's cost is a function of a history that a WCET campaign has to reproduce deliberately. It matters for testing because a benchmark that only ever runs the same code path repeatedly trains the predictor into its best case and never exercises the mispredicted one, which is exactly the case a hard deadline has to survive.
:::

::: check
A code reviewer flags a function that uses a function pointer to dispatch between several possible sensor-parsing routines, chosen at runtime based on which sensor is attached. Which two separate problems raised in this lesson does that pattern risk, and are both automatically disqualifying?
:::

::: answer
It risks an unresolvable call graph (the "restricted pointer use" rule, which threatens the deepest-path stack-sizing method) and reduced branch-prediction accuracy on the indirect call itself (this lesson's cache and predictor discussion). Neither is automatically disqualifying on its own: if the complete, finite set of possible targets is enumerable at compile or link time — a fixed table of sensor-type handlers, for instance — a static analyser can still resolve the call graph completely, and the indirect call, while less predictable than a direct one, is not data-dependent in the way a branch on sensor *readings* would be. What disqualifies the pattern is an open-ended or dynamically constructed set of possible targets, where neither the stack analysis nor the branch-prediction argument has a finite structure left to reason about.
:::

## Summary

| Rule | Reason |
| --- | --- |
| No allocation after init | Allocator time is history-dependent and unbounded; failure is possible mid-mission on the least-tested path |
| Replacement | Static pools, fixed-capacity containers, placement construction — sized from a proven worst case |
| Bounded loops | A statically provable iteration limit is what makes static WCET analysis possible at all |
| No recursion | Cyclic call graph has no single deepest path; depth is data-dependent, unlike a fixed call tree |
| Other Power of Ten rules | Short functions, assertion density, smallest data scope, checked returns, restricted preprocessor and pointers, all warnings as errors plus static analysis — all in service of a fully verifiable function |
| Cache | Warm access: a handful of cycles. Cold (main-memory) access: one to two orders of magnitude more |
| Branch prediction | Correct guess: free. Misprediction: tens of cycles, and discarded speculative work |
| The core point | Both are history-dependent, exactly like `malloc`; code optimised for the common case can have a worst case far from its average, and code with a small worst-to-typical gap is what a WCET proof needs |

You now have the source-level and hardware-level reasons flight code looks the way it does. The next lesson moves outward, from a task's own code to the world it talks to — device registers, the `volatile` keyword, and the buses a flight computer actually uses to reach its sensors and actuators.
