---
id: l07-interrupts-and-memory-protection
title: Interrupts, latency and memory protection
minutes: 17
covers:
  - "Interrupt handling, interrupt latency, and the split between the handler and the deferred half"
  - Memory protection with an MMU or MPU; stack sizing and stack-overflow detection
---

Two mechanisms sit underneath everything the last six lessons proved. Scheduling theory assumes a task starts running when the scheduler says it does — but the very first thing that happens on real hardware, before any scheduler runs at all, is an interrupt, and how long that takes is a bound nothing so far has supplied. And every proof in this module assumes a task's own memory behaves — but nothing about a schedulability proof stops a stack from silently overrunning into someone else's data. This lesson bounds both: how long an interrupt can take to reach the code that matters, and what stops a memory error from becoming a mystery three subsystems away from its cause.

## Interrupt latency

**Interrupt latency** is the time from a hardware event asserting an interrupt to the first instruction of its handler executing. It has several components stacked in series: the processor's own hardware response time, any interval during which interrupts happen to be masked by other code (a critical section that disables interrupts, or a higher-priority interrupt already in progress), the cost of saving enough context to run the handler safely, and dispatch through the interrupt vector to the correct routine. Every one of these is a real duration, and the sum is a quantity you must bound the same way lesson one bounded WCET — by the worst case across every legal state the processor could be in when the event arrives, not by a typical case.

The reason this matters beyond its own number: while a handler runs, it typically preempts everything of equal or lower priority in the system, interrupts included, for as long as it takes. A handler that does real, unbounded work — a computation whose time depends on the data, a blocking call, a lock a lower-priority context might hold for a while — is not merely slow; it is a source of latency for every other interrupt and for the entire scheduled system beneath it, in exactly the shape lesson four spent its length eliminating from ordinary tasks. An interrupt handler that behaves like an unbounded critical section reintroduces unbounded priority inversion at the hardware level, where none of the previous lessons' fixes apply, because most kernels do not permit locking a priority-inheriting mutex from interrupt context at all.

## The split: top half and bottom half

The standard answer is to split the work in two. The **top half** — the interrupt handler proper — does the absolute minimum required at interrupt time: acknowledge the device so the interrupt line stops asserting, capture whatever data would otherwise be lost (a hardware register, a timestamp, a single sample), and nothing more. No blocking calls, no locks that a lower-priority context might hold for a while, no data-dependent work — its execution time must be small and provable, because for as long as it runs, it is effectively above the entire scheduled system. The **bottom half** — the deferred portion, called a softirq, tasklet or workqueue item in Linux and built from an ordinary semaphore-signalled task in a generic RTOS, exactly as in lesson five — does the actual processing, at a priority you assign, competing for the CPU like any other schedulable entity rather than preempting unconditionally.

This is not a new idea introduced for interrupts specifically; it is lesson six's threaded-interrupt change from a different angle. `PREEMPT_RT` turns most interrupt handlers into schedulable kernel threads for exactly this reason — the bottom half, formalised as an ordinary thread with an ordinary priority, so that lesson two's assignment rules and lesson three's response-time analysis apply to it the same way they apply to everything else. The top half shrinks to the few instructions that genuinely cannot wait; everything that can wait, waits, at a priority the schedulability proof already accounts for.

::: example An interrupt latency budget
A sensor sample must be captured, timestamped and available to the control task within $10\,\mathrm{\mu s}$ of the hardware event that produced it — the deadline for the handling path as a whole. Two components are fixed by the hardware and by how little the top half is allowed to do: hardware and trap-entry latency, $200\,\mathrm{ns}$, and the top half itself — acknowledge the device, copy the raw sample into a preallocated slot, signal the waiting task, nothing else — measured at $300\,\mathrm{ns}$ worst case.

$$
10\,000\,\mathrm{ns} - 200\,\mathrm{ns} - 300\,\mathrm{ns} = 9\,500\,\mathrm{ns}
$$

remain for the scheduler to notice the signalled task is now the highest-priority ready thread and actually run it — the bottom half's own dispatch latency, which is precisely the kind of number lesson six's isolation and priority-inheritance machinery exists to bound. Note where the budget went: only half a microsecond is spent inside the interrupt path itself; the other $95\%$ of the budget is deliberately left for the ordinary, provable, schedulable half of the system, rather than spent doing real work at a priority nothing in this module can analyse.
:::

::: key
**Top half**: the minimum work that must happen at interrupt time — acknowledge, capture, signal — kept small enough that its own worst-case time is provable. **Bottom half**: the actual processing, deferred to an ordinary schedulable task at a priority you choose, brought back inside the scheduling theory of lessons two through five.
:::

## Memory protection: MMU and MPU

An **MMU** (memory management unit) performs full virtual-to-physical address translation through page tables, giving each process its own address space and letting the kernel mark individual pages read-only, non-executable, or entirely inaccessible to a given process. It is what makes the Linux side of a flight computer's architecture from lesson six workable at all — separate processes cannot corrupt one another's memory by construction, because they do not share an address space to begin with.

An **MPU** (memory protection unit), common on the bare-metal microcontrollers this module returns to in lesson ten, is simpler: there is no address translation — every address is already the physical one — but a small number of protection regions (often eight to sixteen) can each be assigned permissions: read, write, execute, privileged-only. No virtual memory is needed for an MPU to do useful work: a region can be marked no-access to create a **guard region**, a deliberate gap between one task's stack and whatever sits next in memory.

The guard region is the entire value. Without one, a stack that overruns its allocation writes into whatever happens to be adjacent — another variable, another task's stack, code — silently, and the visible symptom shows up wherever that corrupted memory is next read, which can be an entirely different subsystem, much later, with no obvious connection to the overrun that caused it. With a guard region in place, the first out-of-bounds write lands in the no-access gap and faults immediately, at the exact instruction and the exact task responsible. The fault is not a nicer outcome in some abstract sense — it converts an undiagnosable, action-at-a-distance failure into a precise, attributable one, which is the same trade lesson one drew between an unbounded tail and a bounded worst case: a hard fault you can act on beats a silent corruption you cannot even locate.

## Stack sizing

A task's worst-case stack usage is the sum of the stack frame sizes along its **deepest possible call path** — a static, structural question with exactly the shape of WCET analysis from lesson one: walk the call graph, and for a bounded, non-recursive graph (lesson eight explains why recursion breaks this), there is a single provable deepest path and a single provable worst-case total.

::: example Sizing a guard region from the actual call graph
A control task's deepest call chain is `main_loop` → `read_sensors` → `kalman_update` → `matrix_inverse_3x3`, with measured or statically bounded frame sizes of $64$, $96$, $512$ and $128$ bytes:

$$
64 + 96 + 512 + 128 = 800\,\mathrm{bytes}.
$$

A real allocation adds margin against an unaccounted interrupt frame, a slightly pessimistic compiler layout, or a call path not yet identified — doubling is a common, simple choice — giving $1\,600\,\mathrm{bytes}$ as the stack allocation, with the guard region placed immediately past it. The $800\,\mathrm{byte}$ figure is not a measurement from a test run that happened to reach that depth; it is the sum along the one call path that is structurally the worst the code can produce, which is the only figure a guard region sized from testing alone could not promise to catch.
:::

Where no MPU or MMU is available at all, the fallback is a software technique: fill the unused stack region with a known pattern (**stack painting**) during initialisation, and periodically — or after any unusually deep call — check whether the pattern nearest the boundary has been disturbed. It is strictly weaker than a hardware guard: it only catches what it happens to check, at the moment it happens to check it, rather than faulting synchronously at the exact instruction that overran. It is worth having on hardware with no protection unit at all, and worth having as a second, independent check even where one exists.

::: warning
Sizing a stack from what a debugger showed during a test campaign repeats lesson one's WCET mistake in a different variable: a measurement campaign only ever reports the paths it happened to exercise, and the one that matters is the path nobody tested — an error-handling branch, a rare combination of nested calls, exactly the situation lesson eight will show recursion makes unanalysable in principle. Size a stack from the call graph's worst case, not from an observed maximum, for the same reason WCET is established by analysis and not by profiling alone.
:::

## Check yourself

::: check
An interrupt handler for a sensor bus performs a full Kalman filter update directly inside the top half, arguing this minimises latency by avoiding a context switch to a separate task. What is wrong with this design?
:::

::: answer
The filter update is data-dependent, non-trivial work with no small, provable worst-case time, and running it inside the top half means it executes at a priority effectively above the entire scheduled system, for however long it happens to take on that particular input. Every other interrupt and every task in the system inherits that as latency, in exactly the unbounded-blocking shape lesson four eliminated from ordinary tasks — except here it cannot be fixed by priority inheritance, since most kernels forbid the locks that mechanism depends on inside interrupt context. The fix is the standard split: the top half captures the raw sample and signals a task: the bottom half, running at an assigned priority lesson two's theory already covers, performs the filter update.
:::

::: check
In the interrupt latency budget example, suppose the top half is later found to take $700\,\mathrm{ns}$ instead of $300\,\mathrm{ns}$, with hardware latency and the overall deadline unchanged. Recompute the remaining budget for the bottom half's dispatch, and say what this does to the top half's own status as "the part kept small and provable."
:::

::: answer
$10\,000 - 200 - 700 = 9\,100\,\mathrm{ns}$ remain — still comfortable here, but the top half has more than doubled, which is the actual concern: it means someone added work to the top half beyond the bare acknowledge-capture-signal pattern, and that work is now running at the priority nothing in this module's scheduling theory can analyse. The right response is to find what grew and move it to the bottom half if it can wait at all, not to accept the new figure because the total budget still happens to fit — the top half's smallness is the property being protected, not merely the total.
:::

::: check
Explain why an MPU, which performs no address translation at all, can still stop a stack overflow from corrupting adjacent memory, and what the practical difference is between that and the software stack-painting technique.
:::

::: answer
An MPU does not need address translation to enforce permissions — it only needs to know which physical address ranges are currently accessible and how, so it can mark a small gap immediately past a stack's allocation as no-access and fault on any access into it, translation or not. The practical difference from stack painting is timing and certainty: the MPU faults synchronously, at the exact instruction that overran, whether or not anyone was looking for the problem at that moment, while stack painting only detects an overrun the next time something explicitly checks the pattern, which can be arbitrarily long after the actual overrun and can miss an overrun that writes past the checked region entirely.
:::

::: check
A task's call graph has two branches after `read_sensors`: a nominal path through `apply_filter` (frame $80\,\mathrm{bytes}$) and a fault path through `apply_filter` then `emergency_recovery` (frames $80$ and $240\,\mathrm{bytes}$), with `read_sensors` itself using $96\,\mathrm{bytes}$ and `main_loop` using $64\,\mathrm{bytes}$. Testing only ever exercised the nominal path. What stack allocation does the worst-case call graph actually require, and why would testing alone have under-sized it?
:::

::: answer
The worst-case path includes the fault branch: $64 + 96 + 80 + 240 = 480\,\mathrm{bytes}$, against a nominal-path figure of only $64+96+80=240\,\mathrm{bytes}$ — exactly double. A stack sized from testing alone, having never exercised `emergency_recovery`, would have been set from the $240\,\mathrm{byte}$ figure, and the first time the fault path actually triggers in flight — the least-tested code path in the system, by construction — the stack would overrun by the full $240\,\mathrm{bytes}$ the recovery function needs, precisely when the system is already in a fault condition and can least afford a second, unrelated failure on top of it.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Interrupt latency | Time from hardware event to the first instruction of the handler; hardware response plus masked-interrupt time plus context save plus dispatch |
| Top half | Minimal interrupt-time work — acknowledge, capture, signal; small enough to have a provable worst-case time |
| Bottom half | Deferred processing as an ordinary schedulable task, at an assigned priority, covered by lessons two through five |
| MMU | Full address translation; separates processes into distinct address spaces |
| MPU | No translation, a handful of permissioned regions; enough to create a no-access guard region |
| Guard region | Turns a stack overflow into an immediate, attributable fault instead of silent corruption |
| Stack sizing | Sum of frame sizes along the deepest path in the call graph — a structural bound, not a testing result |
| Stack painting | Software fallback: known pattern, checked periodically; weaker than a hardware guard, better than nothing |

Both mechanisms in this lesson bound damage from something external to a task's own logic — an interrupt's timing, a stack's spatial overrun. The next lesson turns to damage a task can do entirely to itself, through the memory and control-flow choices flight coding standards ban outright.
