---
id: l06-real-time-linux
title: Real-time Linux, and why a flight programme can run it
minutes: 22
covers:
  - "Real-time Linux: PREEMPT_RT, SCHED_FIFO and SCHED_DEADLINE, CPU isolation, IRQ affinity, mlockall"
  - Why a flight programme can fly Linux at all, and what it has to switch off to do so
---

A stock Linux kernel is not a real-time operating system, and it was never meant to be one. It is built to maximise throughput and fairness across an unpredictable mix of processes, which means long stretches where the kernel disables preemption for its own bookkeeping, a scheduler that treats priority as a hint rather than a guarantee, and a virtual memory system that can stall any thread, however important, on a page fault at any moment. None of that is a defect — it is exactly the right design for a desktop or a server. It is exactly the wrong design for a control loop with a hard deadline.

And yet modern launch vehicles fly Linux. Both things are true at once because the Linux a flight computer runs is not the stock kernel, configured the ordinary way. It is a specific kernel variant, on a specific hardware configuration, with a specific and fairly long list of ordinary Linux behaviour switched off. This lesson goes through that list mechanism by mechanism — what each change actually does to the kernel, not only what it is called — because "why can it fly Linux" only has an honest answer once you know exactly what is no longer running when it does.

## Why the stock kernel cannot give you a bound

Three separate problems, all present before any real-time configuration is applied. The kernel has **non-preemptible regions**: code holding a spinlock, or running an interrupt handler, runs to completion on that core no matter what else becomes ready to run in the meantime, including a task at the highest user priority the system has. How long those regions can run is not a number the kernel publishes or bounds by design — it is however long that particular code path happens to take. The default scheduler, the **Completely Fair Scheduler**, optimises for balanced throughput across all processes; a "nice" value or a real-time priority steers it, but nothing in its design promises a bounded wait for the highest-priority runnable thread the way lesson two's rate-monotonic assignment does. And ordinary **virtual memory** can stall any thread on a page fault — a page evicted under memory pressure, or a heap page touched for the first time — with a latency set by the storage device backing it, not by anything the scheduler controls. Bolting a real-time priority onto a thread running under this kernel proves nothing: the priority only matters once the thread is actually runnable, and any of these three mechanisms can keep it from being runnable for a duration nobody has bounded.

## PREEMPT_RT

The **PREEMPT_RT** patch set (largely merged into the mainline kernel as the `PREEMPT_RT` configuration option) attacks the non-preemptible-region problem directly, by changing what those regions are made of. Most kernel spinlocks are converted into **sleeping, priority-inheriting locks**: a thread that would have spun, uninterruptible, now blocks the way lesson four's mutexes block, and — this is the part that makes it a real fix rather than a relabelling — the kernel lock itself carries the identical priority-inheritance mechanism from lesson four, so a low-priority kernel-side holder is boosted the instant a higher-priority thread waits on it. The same bounded-blocking argument that protected a user-level mutex now protects the kernel's own internals.

Most **interrupt handlers** become **threaded**: instead of running at an implicit priority above everything else in the system, uninterruptible, for however long the handler takes, each becomes an ordinary schedulable kernel thread with a priority you assign. A low-priority device's interrupt can no longer hold off your control loop's response to a high-priority one — you rank the IRQ threads the same way lesson two ranked ordinary tasks, and a genuinely urgent interrupt outranks a genuinely unimportant one instead of every interrupt outranking every thread by default. What remains genuinely non-preemptible after both changes is deliberately shortened and audited down to a small, boundable core.

None of this is free. Converting spinlocks to sleeping locks and threading interrupt handlers both add overhead — a context switch costs more than a spin, and there is real bookkeeping in tracking inherited priorities through the kernel's own locks — so a `PREEMPT_RT` kernel has measurably lower average-case throughput than the stock kernel on the same hardware. That is precisely the trade lesson one asked you to want: a slightly slower average in exchange for a worst case you can actually bound, rather than a faster average with a tail nobody has measured.

## SCHED_FIFO and SCHED_DEADLINE

`PREEMPT_RT` fixes the kernel's own internals; the scheduling *policy* your task runs under is a separate choice, and Linux offers two that map directly onto this module's theory. **`SCHED_FIFO`** is a genuine fixed-priority class: the highest-priority ready `SCHED_FIFO` thread runs, with no time-slicing among threads at the same priority — it runs until it blocks, yields, or a higher-priority thread becomes ready. This is rate-monotonic or deadline-monotonic priority assignment, as computed in lessons two and three, given directly to the kernel as the rule it enforces, rather than a hope the fair scheduler happens to honour.

**`SCHED_DEADLINE`** implements earliest-deadline-first, exactly as built in lesson two, with one addition. Each task declares a three-number reservation — `runtime`, `deadline`, `period` — and admission is refused unless

$$
\sum_i \frac{\text{runtime}_i}{\text{period}_i} \;\le\; 1,
$$

the identical $U \le 1$ test from lesson two's EDF theory, now enforced by the kernel before a task is even allowed to run under this policy. The addition is a **runtime budget**: if a task tries to run longer than its declared `runtime` within a period, the kernel throttles it — it stops running until its next period, rather than continuing to consume the processor. This is Linux's direct answer to the domino effect from lesson two: an overrunning task's damage is contained to itself, because it is cut off at its own declared budget instead of being allowed to keep running and delay whichever task's deadline happens to be nearest next.

::: example An admission test you have already derived
Three tasks are proposed for `SCHED_DEADLINE`, each as (runtime, period) in milliseconds, with deadline set equal to period: $(2, 10)$, $(1, 5)$, $(4, 20)$.

$$
U = \frac{2}{10} + \frac{1}{5} + \frac{4}{20} = 0.2 + 0.2 + 0.2 = 0.6.
$$

Since $U \le 1$, the kernel's admission controller accepts all three — and because this is EDF, $U\le1$ is not a sufficient-only test the way the Liu-Layland bound was for `SCHED_FIFO`; it is the exact condition, so no further analysis is needed for this trio. `SCHED_DEADLINE` tasks, whenever runnable, take priority over every `SCHED_FIFO` and `SCHED_RR` thread, which in turn outrank the default `SCHED_OTHER` class entirely — a strict hierarchy with the reservation-checked class on top.
:::

## CPU isolation, IRQ affinity and the rest of the checklist

Scheduling policy governs *which thread* runs; a further set of changes governs *what else could possibly interfere* on the core that thread runs on, even once the policy is right.

**`isolcpus`** (or the equivalent `cpuset` and `nohz_full` configuration) removes a core from the general scheduler's load-balancing entirely, so nothing the kernel would ordinarily migrate there for load-balancing reasons ever lands on it. Combined with **CPU affinity** — pinning your real-time task to that specific core — the isolated core runs only what you put there, eliminating cross-core migration jitter and the cache eviction a foreign task would cause. **IRQ affinity** does the matching job for interrupts: by default any interrupt can land on any core, including the isolated one, so its affinity mask is moved away, leaving the isolated core free of interrupt-handler jitter as well as scheduler jitter. Deep CPU **power-saving states (C-states)** are disabled on that core, because waking from one carries a real, sometimes large latency the processor pays in exchange for lower idle power — a cost a real-time core cannot afford to pay unpredictably, so it is kept out of those states and pays a higher constant power draw instead.

**`mlockall`** addresses the virtual-memory problem directly: it locks the calling process's pages into physical RAM so the kernel can never page them out, and pre-faults them so a page fault cannot occur later, mid-loop, with the storage-device latency that a fault would otherwise cost. The call takes two flags worth knowing individually — `MCL_CURRENT` locks pages already mapped, `MCL_FUTURE` locks pages mapped afterward too — and the second one matters even to code that never allocates after initialisation (lesson eight's rule), because the process's stack itself can still grow, and without `MCL_FUTURE` a newly touched stack page would not be locked, reopening exactly the fault `mlockall` exists to close.

Finally, the loop's own timing call matters: **`clock_nanosleep` with `TIMER_ABSTIME`, against `CLOCK_MONOTONIC`**, sleeps until an absolute future instant rather than for a relative duration measured from now. A relative sleep repeated every cycle accumulates the overhead of each call on top of the last, so the period drifts longer over time; an absolute sleep against a clock that never jumps (unlike `CLOCK_REALTIME`, which can be stepped by time synchronisation) holds the intended period exactly, cycle after cycle, which is the jitter-control half of everything else on this list.

::: key
**Real-time Linux checklist**: `SCHED_FIFO` (or `SCHED_DEADLINE`) at a chosen priority or reservation; `mlockall` with both flags; `isolcpus` plus CPU affinity to own a core outright; IRQ affinity moved off that core; deep C-states disabled; `clock_nanosleep` with `TIMER_ABSTIME` against `CLOCK_MONOTONIC`; and, inside the loop itself, no allocation, no blocking I/O, no unbounded lock.
:::

::: example What the checklist is worth, in published numbers
Neither figure below was measured for this lesson; both are the kind of result widely published by the real-time Linux community's own long-running latency-measurement efforts (the Linux Foundation's documentation and the OSADL continuous latency project among them), and they are worth carrying as an order of magnitude rather than a guarantee for any particular board.

| Configuration | Typical worst-case scheduling latency, under load |
| --- | --- |
| Stock kernel, ordinary priority | Tens of milliseconds |
| `PREEMPT_RT` alone, no isolation | Low hundreds of microseconds |
| `PREEMPT_RT` with the full checklist above | Tens of microseconds |

The gap between the second and third rows is the entire point of this lesson: `PREEMPT_RT` alone fixes the kernel's own preemptibility, but a real-time thread sharing a core with unrelated work, and subject to unrelated interrupts, still inherits jitter from both. The checklist's remaining items are not optional refinements on top of `PREEMPT_RT` — for a hard deadline in the tens-of-microseconds range, most of the achievable improvement lives in isolation and locked memory, not in the kernel patch alone.
:::

## Why a flight programme can fly Linux at all

The honest answer is narrow: because the combination above converts "usually fast, occasionally very slow" into "bounded, and the bound is small enough." Nothing about Linux being feature-rich — a mature driver ecosystem, POSIX APIs the whole team already knows, a toolchain everyone has used, decades of tested library code — earns it a place in a hard-real-time loop on its own; a system with excellent average performance and an unbounded tail is exactly what lesson one already ruled out. What earns Linux its place is that the tail can be made small and provably bounded on the specific cores configured this way, and once that is true, everything else Linux brings becomes a genuine engineering advantage rather than a liability to work around.

That bound is bought by switching real things off, and it is worth listing them plainly rather than leaving "some tuning" implicit: **swap**, entirely, for the locked process, so no page it touches can ever be written out and faulted back in; **deep C-states**, on the isolated core, trading power efficiency for wake latency; the **load balancer**, on that core, trading system-wide utilisation for freedom from migration; **variable clock frequency**, in many configurations, since a core whose clock rate itself changes is one more source of execution-time variance layered on top of everything lesson one already asked you to bound; and, at the system level, every background daemon, cron job, and housekeeping task that is not the flight application, either removed from the image entirely or kept off the isolated cores by the same affinity mechanism. A flight computer's Linux image is not a general-purpose distribution with real-time flags flipped on — it is a deliberately minimal image with almost everything not required for the mission left out, built and fixed before launch.

It also is not, even after every item on this list, a hard-real-time kernel in the sense a small purpose-built RTOS is by construction — nothing stops a driver bug or a misconfigured affinity mask from silently reintroducing the jitter this whole apparatus exists to remove, in a way a minimal kernel with real-time as its only job structurally cannot suffer. What the checklist buys is a *specific, carefully configured slice* of the machine — the isolated cores running the flight-critical tasks — behaving like a real-time system, while other cores on the identical box continue running ordinary Linux for the work that does not need the guarantee: ground communication formatting, non-critical logging, diagnostics. Partitioning by core, not converting the whole machine, is how one physical computer serves both needs at once — which is also why a real flight architecture treats the isolation boundary as something to verify continuously, not something to configure once and trust forever.

::: warning
Enabling `PREEMPT_RT` alone and calling the result "real-time" is the single most common shortcut in this area, and the published-numbers example above shows exactly how much is left on the table by stopping there — roughly an order of magnitude of achievable latency improvement sits in isolation, affinity and locked memory, not in the kernel patch by itself. A `SCHED_FIFO` thread that migrates onto a non-isolated core, or wakes an interrupt handler still affine to its own core, loses the guarantee silently: nothing crashes, nothing logs an error, and the deadline is missed only occasionally, under exactly the load conditions ground testing is least likely to reproduce.
:::

## Check yourself

::: check
A team enables `PREEMPT_RT`, sets their control task to `SCHED_FIFO` at a high priority, and declares the loop real-time. What is missing, and what published-order-of-magnitude improvement are they leaving on the table by stopping there?
:::

::: answer
Missing: CPU isolation and affinity, IRQ affinity moved off the real-time core, `mlockall`, disabled deep C-states, and an absolute-time sleep call — everything past the kernel patch and the scheduling policy. `PREEMPT_RT` fixes the kernel's own non-preemptible regions and gives real meaning to `SCHED_FIFO` priority, but the task still shares its core with unrelated interrupts and migratable work unless isolated. Per the published figures in this lesson, that is roughly the gap between "low hundreds of microseconds" and "tens of microseconds" of worst-case latency — most of the achievable improvement, not a marginal refinement.
:::

::: check
Explain, in terms of what each one actually changes in the kernel, why `PREEMPT_RT`'s conversion of spinlocks matters for a real-time thread that never touches a spinlock itself.
:::

::: answer
A thread does not need to use a spinlock directly to be affected by one — it is affected any time it needs the CPU while some *other* code, anywhere in the kernel, is holding one. Under the stock kernel, a spinlock disables preemption on that core for as long as it is held, so a real-time thread waiting to run can be blocked by kernel code it never called, for a duration bounded by nothing in particular. Converting spinlocks to sleeping, priority-inheriting locks means that code becomes preemptible while holding one, and if a higher-priority thread is waiting, the holder is boosted exactly as lesson four's user-level mutexes are boosted — so the real-time thread's wait becomes bounded by a critical section's length rather than by an arbitrary, unrelated kernel operation.
:::

::: check
A `SCHED_DEADLINE` task is admitted with runtime $3\,\mathrm{ms}$ and period $10\,\mathrm{ms}$ alongside an existing task at runtime $4\,\mathrm{ms}$, period $8\,\mathrm{ms}$. Is the new total admissible, and what does the kernel do differently from `SCHED_FIFO` if the new task tries to run for $5\,\mathrm{ms}$ in one period?
:::

::: answer
$U = 3/10 + 4/8 = 0.3 + 0.5 = 0.8 \le 1$, so the pair is admissible. If the task then tries to run for $5\,\mathrm{ms}$ against its declared $3\,\mathrm{ms}$ runtime, `SCHED_DEADLINE`'s budget enforcement throttles it at the $3\,\mathrm{ms}$ mark — it stops running until its next period rather than continuing. A `SCHED_FIFO` thread has no such budget: an equivalent overrun under `SCHED_FIFO` keeps running at its fixed priority regardless, delaying every lower-priority thread for as long as the overrun lasts, with nothing in the scheduler itself to contain it.
:::

::: check
Why does `mlockall` need to lock pages that have not been allocated yet (`MCL_FUTURE`), given that lesson eight will tell you flight code allocates nothing after initialisation?
:::

::: answer
Dynamic heap allocation is only one source of new pages; the call stack is another, and it can still grow during ordinary execution — a deeper-than-usual call chain, triggered by a rare branch, can touch a stack page for the first time well after initialisation, even in code that allocates no heap memory at all. Without `MCL_FUTURE`, that first touch is an ordinary page fault, with the latency lesson six's entire `mlockall` discussion exists to remove. `MCL_FUTURE` closes that gap by locking any page the process maps for the rest of its life, not only the ones mapped at the moment `mlockall` is called.
:::

::: check
A flight computer runs its attitude-control task on an isolated, `PREEMPT_RT`-tuned core, and its ground-communication formatting on another core of the same box under the stock scheduling policy. Is this a design flaw, or a reasonable architecture — and what does it depend on to stay safe?
:::

::: answer
A reasonable architecture, and a common one: not every task on a flight computer needs a hard-real-time guarantee, and forcing the ground-communication work through the same isolation and locked-memory discipline would spend real engineering effort and hardware headroom for no benefit, since a late telemetry packet is a soft-real-time problem lesson one already distinguished from a missed control deadline. It depends on the partition actually holding — the isolated core's affinity, interrupt routing and memory locking have to remain correctly configured for the life of the mission, and any change that lets ordinary work migrate onto the isolated core, or an interrupt re-attach to it, silently removes the guarantee the whole architecture is built on without producing an error anywhere obvious.
:::

## Summary

| Item | What it does |
| --- | --- |
| `PREEMPT_RT` | Converts most spinlocks to priority-inheriting sleeping locks; threads most interrupt handlers; shortens remaining non-preemptible sections |
| `SCHED_FIFO` | Fixed-priority scheduling class; runs the highest-priority ready thread, matching rate/deadline-monotonic theory directly |
| `SCHED_DEADLINE` | EDF with a runtime budget; admission requires $\sum \text{runtime}_i/\text{period}_i \le 1$; overruns are throttled, not left to cascade |
| `isolcpus` + affinity | Removes a core from load-balancing; pins the real-time task to it exclusively |
| IRQ affinity | Moves interrupt handling off the isolated core |
| Deep C-states disabled | Avoids unpredictable wake latency from CPU power-saving states |
| `mlockall(MCL_CURRENT \| MCL_FUTURE)` | Locks current and future pages into RAM; no page fault can occur later |
| `clock_nanosleep(TIMER_ABSTIME, CLOCK_MONOTONIC)` | Sleeps to an absolute instant on a clock that never jumps; period does not drift |
| What flies Linux at all | The bound made small enough by all of the above — not Linux's feature set on its own |
| What is switched off | Swap, deep C-states, load balancing, and often frequency scaling, on the isolated cores; most background services, system-wide |

The checklist in this lesson bounds jitter and removes page faults from the hot loop. The next lesson takes on two of the remaining sources of unbounded latency by name — the interrupt path itself, and the memory protection that decides what happens when a task's own code, not the kernel, is the thing that goes wrong.
