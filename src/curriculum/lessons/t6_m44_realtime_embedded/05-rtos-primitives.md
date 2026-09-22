---
id: l05-rtos-primitives
title: RTOS primitives and which of them can block unboundedly
minutes: 17
covers:
  - "RTOS primitives: tasks, semaphores, mutexes, message queues, and which of them can block unboundedly"
---

Lessons two and three gave you an exact way to decide whether a task set meets its deadlines. Lesson four gave you a way to bound the extra delay a shared lock can cost. Both proofs depend on every number that goes into them being a real, known bound — and that depends, in turn, on which primitive you reached for when two tasks needed to coordinate. An RTOS offers a handful of building blocks for that coordination, and they are not interchangeable: choosing a semaphore where the problem calls for a mutex, or leaving off a timeout where one belongs, is how a proven-schedulable task set acquires a wait nothing in the proof accounted for.

This lesson catalogues the primitives — tasks, semaphores, mutexes, message queues — by what each one is actually for, and then asks the question the module's topic list poses directly: of everything a task can block on, what bounds the wait, and what does not.

## Tasks

A **task** (an RTOS's word for a thread) is an independent line of execution with its own stack, its own priority, and its own state: ready to run, currently running, blocked waiting on something, or suspended. Everything in lessons one through four is stated in terms of tasks in this sense — a periodic task's $C_i$ and $T_i$, its priority under rate-monotonic or deadline-monotonic assignment, its response time. Nothing new is needed here beyond naming the object those lessons were already about; what this lesson adds is the machinery tasks use to talk to each other.

## Semaphores

A **counting semaphore** holds a non-negative integer and two operations: **wait** (sometimes called take or P), which blocks if the count is zero and otherwise decrements it, and **signal** (post, give, or V), which increments the count and wakes one waiter if any exist. A **binary semaphore** is the special case where the count is restricted to $0$ or $1$.

The property that matters most is not what a semaphore counts — it is that a semaphore has **no owner**. Any task, or an interrupt handler, may signal a semaphore regardless of which task, if any, last waited on it. This is exactly the right shape for **signaling**: an interrupt handler posts a semaphore to wake the task that processes the data it captured, with no notion of the handler "holding" anything that needs to be given back. It is exactly the *wrong* shape for **mutual exclusion**. Priority inheritance, from the last lesson, works by identifying who currently holds a resource and temporarily raising that holder's priority — a step that requires an owner. A semaphore used to protect a shared data structure has no owner to raise, so a semaphore-based lock cannot support priority inheritance at all, and reintroduces exactly the unbounded inversion lesson four spent its length eliminating.

## Mutexes

A **mutex** is a lock with an owner: whichever task locks it is the only task permitted to unlock it, and the RTOS tracks that ownership. That tracked ownership is precisely what makes priority inheritance and priority ceiling implementable — the RTOS knows exactly which task to boost when a higher-priority task blocks on the lock, because the mutex knows who is holding it. This is the structural reason, beneath the behavioural one from lesson four, that flight code uses a mutex and not a semaphore wherever mutual exclusion with a bounded-blocking guarantee is required.

The ownership that makes a mutex right for mutual exclusion is exactly what makes it wrong for signaling. An interrupt handler is not a task and typically has no priority to inherit into and no business "owning" anything past the instant it runs; most real-time operating systems refuse to let a mutex be locked from interrupt context at all. Signal from an interrupt with a semaphore or a direct task notification; protect shared data between tasks with a mutex; keep the two uses on their own sides of that line.

## Message queues

A **message queue** (or mailbox) is a fixed-capacity FIFO of fixed-size messages, with blocking or non-blocking send and receive. Its capacity is not a detail to leave at a default — it is a real-time design decision with the same shape as any other schedulability question: how many messages can accumulate before the consumer is guaranteed to have drained them, and what happens if that bound is ever exceeded — block the sender, drop the message, or overwrite the oldest entry, each a different, explicit choice about what a control system does under overload.

::: example Sizing a queue from the rates that actually feed it
A sensor-processing task produces one queue entry every cycle at $200\,\mathrm{Hz}$ — one every $5\,\mathrm{ms}$. Its consumer, a lower-priority logging task, can be delayed by up to $18\,\mathrm{ms}$ in the worst case by higher-priority work elsewhere in the schedule (a number response-time analysis on the logging task would supply directly). During that stall, the producer keeps running:

$$
\frac{18\,\mathrm{ms}}{5\,\mathrm{ms}} = 3.6 \;\Rightarrow\; \lceil 3.6 \rceil = 4 \text{ entries}.
$$

A queue with fewer than four slots is guaranteed to overflow on the consumer's worst-case stall, every time it occurs, which makes overflow a certainty rather than a rare fault — exactly the distinction lesson one drew between a bound you can prove and a number you merely expect. Four is the minimum; a real design adds margin against a stall slightly worse than measured and rounds up to a size convenient for the buffer implementation, but the four-entry figure itself came directly from the producer's rate and the consumer's own proven worst-case delay, not from guessing.
:::

## Which operations can block unboundedly

Every blocking call is a candidate to appear in the response-time equation from lesson four as a blocking term $B_i$ — provided you can name its bound. Some can be named immediately; others cannot, without further work.

| Operation | Bounded by | Bound known? |
| --- | --- | --- |
| Task delay / sleep | The requested delay itself | Always — you chose the number |
| Mutex lock, with inheritance or ceiling | The longest critical section of a lower-priority holder | Yes, by design (lesson four) |
| Mutex lock, plain | Whatever preempts the holder — nothing related to the lock | **No** — unbounded priority inversion |
| Semaphore wait (signaled by a task) | The signaling task's own worst-case response time | Only if that task is itself proven schedulable |
| Semaphore wait (signaled by an ISR) | The interrupt's own worst-case latency | Yes, if interrupt latency is bounded (lesson seven) |
| Queue send, blocking, when full | How long until the consumer drains one slot | Only if the queue is sized so "full" cannot happen within any interval that matters |
| Queue receive, blocking, when empty | The producer's own worst-case interval between sends | Only if the producer is itself proven schedulable |

The pattern across every "yes" in the right-hand column is the same one lesson four established: a wait is safe to build a proof on exactly when something upstream of it is itself already bounded — a design choice, a proven schedulability result, or an explicit protocol like priority inheritance. A wait with nothing upstream bounding it is not a small risk to accept; it is a hole in the proof with a task's name on it.

::: key
A semaphore has no owner and cannot support priority inheritance — use it for signaling, never for mutual exclusion where a higher-priority task might wait on it. A mutex has an owner and supports both inheritance and ceiling — use it for mutual exclusion, never to signal from an interrupt handler. A message queue's capacity is a real-time design number, derived from the producer's rate and the consumer's proven worst-case delay, not a default left unexamined.
:::

## The timeout: turning an unnamed wait into a bounded one

Some waits genuinely have no upstream bound available — a queue fed by an external device whose timing you do not control, a semaphore that, by design, should only ever be signaled in a fault condition nobody can schedule around. The RTOS answer is not to accept the unbounded wait; it is a **timed wait**, a blocking call with an explicit maximum duration after which it returns a failure status rather than continuing to block. A timeout converts "unbounded, unknown" into "bounded, known, and equal to whatever value you chose" — at the cost of having to decide, explicitly, what the calling task does when the timeout actually fires.

::: example A timeout turns a hang into a number a proof can use
A consumer task, deadline $20\,\mathrm{ms}$, performs a blocking receive on a queue with a $5\,\mathrm{ms}$ timeout, followed by $3\,\mathrm{ms}$ of further processing on whatever value it obtained. Two cases. If the receive succeeds quickly, as it almost always does, the task finishes well inside its deadline. If the producer has stopped sending — a genuine fault, the case the timeout exists for — the receive still returns, with a failure status, after exactly $5\,\mathrm{ms}$; the task then runs its $3\,\mathrm{ms}$ of processing on the last known-good value instead of a fresh one (the same "hold last good value" discipline flight code uses for any missing input) and completes at $5+3=8\,\mathrm{ms}$ — still inside the $20\,\mathrm{ms}$ deadline, and now a countable, telemetry-visible fault instead of a silent one.

Remove the timeout and the fault case has no bound at all: the task waits on a producer that, by hypothesis, is never going to signal, and it does not complete that cycle — not late, not degraded, absent outright, and depending on the RTOS's task model it may not be free to run its *next* period's job either. Response-time analysis has nothing to say about a call with no upper limit; a five-millisecond timeout is a design decision that hands the proof a number it can use, in exchange for one extra branch handling the failure status.
:::

::: warning
A blocking call with no timeout, inside a hard-real-time task, is acceptable only when every task or interrupt that could signal it is itself proven schedulable with a known worst-case response time — and that proof must be written down, not assumed, because it is exactly the kind of dependency that is easy to state informally and easy to leave unchecked when the signaling task is modified later. When in doubt, or when the signal source is outside your own schedulability analysis entirely (external hardware, another subsystem, a human operator), use a timed wait and give the calling task an explicit, bounded, tested response to a timeout.
:::

## Check yourself

::: check
A designer protects a shared navigation-state structure, read by a high-priority control task and written by a low-priority estimator task, with a binary semaphore rather than a mutex. What specifically goes wrong, and why does switching to a mutex fix it?
:::

::: answer
A binary semaphore has no owner, so if the high-priority task blocks waiting for the low-priority task to finish writing, the RTOS has no record of which task to raise in priority — priority inheritance cannot operate, because it depends on identifying the current holder, which only a mutex tracks. The result is the same unbounded priority inversion lesson four built by hand: an unrelated medium-priority task can preempt the low-priority writer and the high-priority reader waits on that unrelated task with no bound. Switching to a mutex gives the RTOS an owner to boost the instant the high-priority task blocks, restoring the bounded-blocking guarantee.
:::

::: check
An interrupt handler needs to wake a task the instant new data arrives. Should it signal a semaphore or lock a mutex, and why is the other option often not even available from interrupt context?
:::

::: answer
A semaphore. Signaling has no notion of ownership — the handler is not "holding" anything and does not need to be tracked as a holder, so a semaphore's owner-free signal-to-anyone semantics fit exactly. A mutex requires an owner that can later unlock it and, in many real-time operating systems, priority inheritance requires a task context to raise, neither of which an interrupt handler has; most RTOS implementations disallow locking a mutex from interrupt context outright, which is a direct consequence of mutexes being built around task ownership.
:::

::: check
In the queue-sizing example, the consumer's worst-case stall is later found to be $28\,\mathrm{ms}$ rather than $18\,\mathrm{ms}$, with the producer's $200\,\mathrm{Hz}$ rate unchanged. Recompute the minimum queue depth.
:::

::: answer
$28/5 = 5.6$, so $\lceil 5.6\rceil = 6$ entries minimum — two more than before. The arithmetic is identical in form to a response-time calculation: a longer proven worst-case delay for the consumer directly increases the resource (here, buffer capacity rather than CPU time) needed to guarantee no overflow, and the queue must be resized whenever the consumer's own worst-case response time changes, not left at whatever depth happened to work during informal testing.
:::

::: check
A task performs a blocking receive with no timeout on a queue fed by another task in the same schedulability analysis, whose own worst-case response time has been proven to be $6\,\mathrm{ms}$. Is this acceptable without a timeout, and what value would you use for the blocking term $B_i$ in the receiver's response-time equation?
:::

::: answer
It is acceptable without a timeout, because the wait has a named upstream bound: the producer is itself proven schedulable with a worst-case response time of $6\,\mathrm{ms}$, so the receiver can never wait longer than $6\,\mathrm{ms}$ for the next message to arrive. That $6\,\mathrm{ms}$ is exactly the number to use as $B_i$ in the receiver's own response-time equation. The moment the producer's schedulability proof changes, or the producer's code changes in a way that could invalidate it, this bound has to be re-derived — which is the practical reason to document the dependency rather than leave it implicit.
:::

## Summary

| Primitive | Purpose | Owner? | Supports priority inheritance? | Unbounded-blocking risk |
| --- | --- | --- | --- | --- |
| Task | Independent thread of execution, own priority | — | — | — |
| Counting / binary semaphore | Signaling, resource counting | No | No | Bounded only if the signaler is itself bounded |
| Mutex | Mutual exclusion | Yes | Yes (with inheritance or ceiling) | Unbounded if used plain, bounded otherwise |
| Message queue | Bounded producer-consumer handoff | — | — | Overflow unless sized from proven rates; empty-wait bounded only if the producer is bounded |
| Timed wait (any primitive) | Converts an unnamed wait into a known one | — | — | Bounded by the chosen timeout, always |

Every primitive in this table shares one property with the schedulability proofs of the last four lessons: a number is only as trustworthy as the argument behind it. The next lesson moves from the primitives themselves to the operating system that hosts them — real-time Linux — and the specific kernel changes that make a general-purpose OS capable of hosting a hard-real-time task at all.
