---
id: l05-rtos-primitives
title: RTOS primitives and which of them can block unboundedly
minutes: 20
covers:
  - "RTOS primitives: tasks, semaphores, mutexes, message queues, and which of them can block unboundedly"
---

Think of a busy restaurant kitchen. Several cooks work at once, each on their own dish. They need ways to work together. A bell rings when an order comes in. There is one sharp mandoline slicer, and only one cook may use it at a time. Finished plates go onto a pass-through shelf with room for six, where waiters pick them up. Each of those is a different tool for a different job. Use the bell to guard the slicer, and sooner or later someone gets hurt.

A flight computer's software is the same. It runs on a **[[real-time operating system|rtos-word]]**, or RTOS — a small operating system whose main job is to run the most urgent work on time, every time. The RTOS gives tasks a handful of building blocks for working together, and they are not interchangeable.

Lessons two and three gave you an exact way to decide whether a task set meets its deadlines. Lesson four bounded the extra delay a shared lock can cost. Both proofs need every number in them to be a real, known bound. That depends on which building block you picked when two tasks had to coordinate. Pick a semaphore where the problem needs a mutex, or leave off a timeout where one belongs, and a proven task set picks up a wait the proof never counted.

This lesson goes through the building blocks — tasks, semaphores, mutexes, message queues — by what each is for. Then it asks the question that matters most: of everything a task can wait on, what limits the wait, and what does not?

## Tasks

The cooks are the tasks. A **task** is the RTOS word for a thread: an independent line of work with its own **stack** (its private scratch memory for local variables and function calls), its own priority, and its own [[state|task-states]]. A task is always in one of four states:

- **running** — on the processor right now;
- **ready** — could run, waiting for the processor;
- **blocked** — waiting for something (a lock, a message, a timer);
- **suspended** — switched off until someone switches it back on.

Everything in lessons one to four was already about tasks in this sense: a periodic task's execution time $C_i$ and period $T_i$, its priority, its response time. Nothing new is needed here except the name. What this lesson adds is the machinery tasks use to talk to each other — and each piece of it is a way for a task to become **blocked**.

## Semaphores

A semaphore is the kitchen's ticket counter. It holds a count. Taking a ticket lowers the count. If there are no tickets, you wait. Returning a ticket raises the count and lets one waiting person go.

Precisely: a **counting semaphore** holds a whole number that is never negative, and has two operations.

- **Wait** (also called take, or **[[P|dijkstra]]**): if the count is zero, block; otherwise lower the count by one and carry on.
- **Signal** (also called post, give, or V): raise the count by one, and wake one waiting task if there is any.

A **binary semaphore** is the special case where the count can only be $0$ or $1$ — a single ticket.

### A semaphore has no owner

The most important fact about a semaphore is not what it counts. It is that a semaphore has **no owner**. Any task — or an **[[interrupt handler|interrupt-handler]]** — may signal it, whether or not it ever waited on it. The RTOS does not remember who took the last ticket.

That is exactly right for **signaling** — one piece of code telling another "something happened". An interrupt handler posts a semaphore to wake the task that will process the data it just captured. The handler is not "holding" anything that needs giving back. It rings the bell and leaves.

It is exactly *wrong* for **mutual exclusion** — making sure only one task at a time touches some shared data. Priority inheritance, from the last lesson, works by finding who currently holds a resource and raising that holder's priority. That step needs an owner. A semaphore used as a lock has no owner to raise. So a semaphore-based lock cannot support priority inheritance at all, and it brings back exactly the unbounded inversion lesson four spent its whole length removing.

## Mutexes

Now the slicer. A **mutex** is a lock with an owner. Whichever task locks it is the only task allowed to unlock it, and the RTOS keeps track of who that is. Think of the slicer with a name tag clipped on: everyone can see whose turn it is.

That tracked owner is exactly what makes priority inheritance and priority ceiling possible. When a higher-priority task blocks on the lock, the RTOS knows which task to boost, because the mutex knows who is holding it. This is the structural reason, underneath the timing reason from lesson four, that flight code uses a mutex — never a semaphore — wherever mutual exclusion needs a bounded-blocking guarantee.

The same ownership makes a mutex wrong for signaling. An interrupt handler is not a task. It usually has no task priority to inherit into, and no business owning anything past the instant it runs. Most real-time operating systems refuse to let a mutex be locked from interrupt code at all.

So keep the two jobs on their own sides of the line:

- **signal** from an interrupt with a semaphore (or a lighter-weight equivalent many RTOSes offer, such as a **[[direct task notification|task-notification]]**);
- **protect shared data** between tasks with a mutex.

::: warning
The two look alike in code — both have a "take" and a "give" — and a binary semaphore used as a lock *works* in every test where no medium-priority task happens to run at the wrong moment. That is why this mistake survives review. Ask one question of every lock in the code: "if a high-priority task waits here, can the RTOS tell who to boost?" If the answer is no, it is the wrong primitive.
:::

## Message queues

The pass-through shelf is a **message queue** (also called a mailbox): a first-in, first-out line of fixed-size messages, with room for a fixed number of them. "**First-in, first-out**", or FIFO, means messages come out in the order they went in, like a line at a store. A task can **send** (put a message in) or **receive** (take the oldest one out), and either can be set to block or to return at once.

The queue's **capacity** — how many messages fit — is not a detail to leave at the default. It is a real-time design decision, shaped like any other schedulability question: how many messages can pile up before the consumer is guaranteed to have drained them? And what happens if that number is ever exceeded? There are three choices, and each says something different about what the system does under overload:

- **block the sender** until there is room;
- **drop** the new message;
- **[[overwrite the oldest|overflow-policy]]** entry.

### Sizing a queue

Picture the shelf again. Plates arrive steadily. The waiter sometimes gets held up at a table. While the waiter is away, plates keep coming. The shelf must hold every plate that can arrive during the waiter's longest possible delay.

In symbols: if the producer sends one message every $T_p$ seconds, and the consumer can be stalled for at most $S$ seconds, then up to

$$
N = \left\lceil \frac{S}{T_p} \right\rceil
$$

messages can arrive during the stall. Read $\lceil x \rceil$ as "the ceiling of $x$": round up to the next whole number. You round up because a message that arrives partway through the stall still needs a slot.

::: key
A message queue's capacity is a real-time design number, derived from the producer's rate and the consumer's proven worst-case delay: at least $\lceil S / T_p \rceil$ slots. It is not a default left unexamined.
:::

::: example Sizing a queue from the rates that actually feed it
A sensor-processing task puts one entry in a queue every cycle at $200\,\mathrm{Hz}$. One cycle is $1/200\,\mathrm{s} = 5\,\mathrm{ms}$, so $T_p = 5\,\mathrm{ms}$.

Its consumer is a lower-priority logging task. Higher-priority work elsewhere can delay it by up to $S = 18\,\mathrm{ms}$ in the worst case. (That number would come straight from response-time analysis on the logging task.) During that stall, the producer keeps running.

**Step 1 — divide the stall by the period:** $18 / 5 = 3.6$.

**Step 2 — round up:** $\lceil 3.6 \rceil = 4$ entries.

So a queue with fewer than [[four slots|queue-fill]] is *guaranteed* to overflow every time the worst-case stall happens. Overflow is then a certainty, not a rare fault — the same line lesson one drew between a bound you can prove and a number you merely hope for.

**Sanity check.** Four entries at $5\,\mathrm{ms}$ apart span $15\,\mathrm{ms}$ of arrivals, and a fifth would need $20\,\mathrm{ms}$ — longer than the $18\,\mathrm{ms}$ stall. So four is right.

Four is the minimum. A real design adds margin against a stall a little worse than measured, and rounds up to a size convenient for the buffer code. But the figure four came from the producer's rate and the consumer's proven worst-case delay, not from a guess.
:::

## Which operations can block unboundedly

Every blocking call is a candidate to appear in lesson four's response-time equation as a blocking term $B_i$ — as long as you can name its bound. Some bounds you can name straight away. Others need more work, or do not exist.

| Operation | Bounded by | Bound known? |
| --- | --- | --- |
| Task delay / sleep | The requested delay itself | Always — you chose the number |
| Mutex lock, with inheritance or ceiling | The longest critical section of a lower-priority holder | Yes, by design (lesson four) |
| Mutex lock, plain | Whatever preempts the holder — nothing to do with the lock | **No** — unbounded priority inversion |
| Semaphore wait (signaled by a task) | The signaling task's own worst-case response time | Only if that task is itself proven schedulable |
| Semaphore wait (signaled by an interrupt) | The longest gap between the device's events, plus interrupt latency | Only if the device's timing is known and interrupt latency is bounded (lesson seven) |
| Queue send, blocking, when full | How long until the consumer frees one slot | Only if the queue is sized so "full" cannot happen when it matters |
| Queue receive, blocking, when empty | The producer's own worst-case gap between sends | Only if the producer is itself proven schedulable |

Look down the right-hand column. Every "yes" has the same shape as lesson four's: a wait is safe to build a proof on exactly when something *upstream* of it is already bounded — a number you chose, a proven schedulability result, or a protocol like priority inheritance. A wait with nothing upstream bounding it is not a small risk to accept. It is a hole in the proof with a task's name on it.

::: key
A semaphore has no owner and cannot support priority inheritance — use it for signaling, never for mutual exclusion where a higher-priority task might wait on it. A mutex has an owner and supports both inheritance and ceiling — use it for mutual exclusion, never to signal from an interrupt handler.
:::

## The timeout: turning an unnamed wait into a bounded one

You arrange to meet a friend at the movies. You do not wait forever. You decide: "if they are not here by ten past, I go in and save them a seat." That decision turns an open-ended wait into one with a known end — and it forces you to decide in advance what you will do if it runs out.

Some waits in flight software really have no upstream bound. A queue may be fed by an outside device whose timing you do not control. A semaphore may, by design, only be signaled when something has gone wrong. The RTOS answer is not to accept the unbounded wait. It is a **timed wait**: a blocking call with an explicit maximum time. When the time runs out, the call returns a failure status instead of blocking any longer.

A timeout turns "unbounded, unknown" into "bounded, known, and equal to the value you chose". The price is that you must decide, explicitly, what the task does when the timeout fires.

::: example A timeout turns a hang into a number a proof can use
A consumer task has a deadline of $20\,\mathrm{ms}$. Each cycle it does a blocking receive on a queue, with a $5\,\mathrm{ms}$ timeout, then $3\,\mathrm{ms}$ of processing on whatever value it got.

**Normal case.** The receive succeeds quickly, as it almost always does. The task finishes well inside its deadline.

**Fault case.** The producer has stopped sending — the case the timeout exists for. The receive still returns, with a failure status, after exactly $5\,\mathrm{ms}$. The task then runs its $3\,\mathrm{ms}$ of processing on the **[[last known-good value|hold-last-good]]** instead of a fresh one. It finishes at

$$
5 + 3 = 8\,\mathrm{ms},
$$

still inside the $20\,\mathrm{ms}$ deadline. And the fault is now counted and visible in telemetry instead of silent.

**Without the timeout.** The fault case has no bound at all. The task waits on a producer that, by assumption, will never send. It does not complete that cycle — not late, not degraded, but absent. Depending on the RTOS, it may not be free to start its *next* cycle either.

**Sanity check.** Response-time analysis has nothing to say about a call with no upper limit. A $5\,\mathrm{ms}$ timeout hands the proof a number it can use, in exchange for one extra branch that handles the failure status.
:::

::: warning
A blocking call with no timeout, inside a hard-real-time task, is acceptable only when every task or interrupt that could signal it is itself proven schedulable, with a known worst-case response time. That proof must be written down, not assumed — it is exactly the kind of dependency that is easy to state out loud and easy to forget when the signaling task is changed later. When in doubt, or when the signal comes from outside your own analysis (outside hardware, another subsystem, a human operator), use a timed wait, and give the task an explicit, bounded, tested response to a timeout.
:::

## Check yourself

::: check
A designer protects a shared navigation-state structure, read by a high-priority control task and written by a low-priority estimator task, with a binary semaphore instead of a mutex. What goes wrong, and why does switching to a mutex fix it?
:::

::: answer
A binary semaphore has no owner. If the high-priority task blocks waiting for the low-priority task to finish writing, the RTOS has no record of which task to raise in priority. Priority inheritance cannot work, because it depends on knowing the current holder, and only a mutex tracks that.

The result is the unbounded priority inversion lesson four built by hand: an unrelated medium-priority task can preempt the low-priority writer, and the high-priority reader waits on that unrelated task with no bound. A mutex gives the RTOS an owner to boost the instant the high-priority task blocks, and the bounded-blocking guarantee is back.
:::

::: check
An interrupt handler needs to wake a task the instant new data arrives. Should it signal a semaphore or lock a mutex, and why is the other option often not even available from interrupt code?
:::

::: answer
A semaphore. Signaling has no notion of ownership: the handler is not holding anything and does not need to be tracked as a holder, so a semaphore's "anyone may signal" rule fits exactly.

A mutex needs an owner that will later unlock it, and priority inheritance needs a task whose priority can be raised. An interrupt handler has neither. That is why most RTOSes forbid locking a mutex from interrupt code — a direct result of mutexes being built around task ownership.
:::

::: check
In the queue-sizing example, the consumer's worst-case stall turns out to be $28\,\mathrm{ms}$ instead of $18\,\mathrm{ms}$. The producer still runs at $200\,\mathrm{Hz}$. Recompute the minimum queue depth.
:::

::: answer
The period is still $5\,\mathrm{ms}$. Divide: $28 / 5 = 5.6$. Round up: $\lceil 5.6 \rceil = 6$ entries — two more than before.

Check: six arrivals $5\,\mathrm{ms}$ apart span $25\,\mathrm{ms}$, and a seventh would need $30\,\mathrm{ms}$, longer than the stall.

The shape is the same as a response-time calculation. A longer proven worst-case delay for the consumer directly raises the resource needed — here buffer slots instead of processor time. The queue must be resized whenever the consumer's worst-case response time changes, not left at whatever depth happened to work in informal testing.
:::

::: check
A producer and a receiver are both released at the start of every $10\,\mathrm{ms}$ cycle. The producer has higher priority, sends one message per cycle, and has a proven worst-case response time of $6\,\mathrm{ms}$. The receiver does a blocking receive with no timeout. Is that acceptable, and what number bounds the receiver's wait?
:::

::: answer
It is acceptable, because the wait has a named upstream bound. The producer is proven schedulable, and each cycle it sends within $6\,\mathrm{ms}$ of the shared release. So the receiver can never wait longer than $6\,\mathrm{ms}$ for that cycle's message. That $6\,\mathrm{ms}$ is the bound to use for the receive in the receiver's own response-time analysis. (Using it as a blocking term $B_i$ is safe, if a little pessimistic: part of those $6\,\mathrm{ms}$ is the producer's own run time, which the higher-priority interference sum already counts.)

The bound is borrowed from the producer's proof. If the producer's code or schedule changes, the $6\,\mathrm{ms}$ must be re-derived — which is why the dependency should be written down, not left implicit.
:::

## Summary

| Primitive | Purpose | Owner? | Priority inheritance? | Unbounded-blocking risk |
| --- | --- | --- | --- | --- |
| Task | Independent line of work with its own stack and priority | — | — | — |
| Counting / binary semaphore | Signaling, counting resources | No | No | Bounded only if the signaler is bounded |
| Mutex | Mutual exclusion | Yes | Yes (inheritance or ceiling) | Unbounded if plain, bounded otherwise |
| Message queue | Fixed-size producer–consumer handoff | — | — | Overflow unless sized from proven rates ($\lceil S/T_p \rceil$); empty-wait bounded only if the producer is |
| Timed wait (any primitive) | Turns an unnamed wait into a known one | — | — | Bounded by the chosen timeout, always |

Every row shares one property with the proofs of the last four lessons: a number is only as trustworthy as the argument behind it. The next lesson moves from the primitives to the operating system that hosts them — real-time Linux — and the kernel changes that let a general-purpose system host a hard-real-time task at all.

::: context rtos-word What makes an operating system "real-time"
Your laptop's operating system tries to keep everything feeling quick on average. A **real-time operating system** makes a narrower promise: the most urgent ready task always runs, and the operating system's own delays have a known worst case.

RTOSes are usually small — some fit in a few kilobytes. Well-known ones include FreeRTOS (free, and the cheapest way to try these ideas on a hobby board), VxWorks (commercial, flown on Mars Pathfinder and on many NASA missions since), and RTEMS (free, used on many spacecraft). The building blocks in this lesson look almost the same in all of them; only the function names change.
:::

::: context task-states The four states of a task
A task moves between states as it works. The RTOS picks the most important **ready** task to be **running**. A running task that waits on a lock, queue or timer becomes **blocked**; when the thing it waited for happens, it becomes ready again. **Suspended** is off until told otherwise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="90" height="34" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="42" font-size="13" text-anchor="middle" fill="#1f2a44">ready</text>
  <rect x="250" y="20" width="90" height="34" rx="8" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="42" font-size="13" text-anchor="middle" fill="#ffffff">running</text>
  <rect x="135" y="116" width="90" height="34" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="138" font-size="13" text-anchor="middle" fill="#1f2a44">blocked</text>
  <line x1="110" y1="30" x2="244" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="250,30 240,25 240,35" fill="#1f2a44"/>
  <text x="180" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">picked to run</text>
  <line x1="250" y1="46" x2="116" y2="46" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="110,46 120,41 120,51" fill="#6c7a93"/>
  <text x="180" y="62" font-size="11" text-anchor="middle" fill="#6c7a93">preempted</text>
  <line x1="280" y1="54" x2="222" y2="112" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="218,116 222,105 229,112" fill="#b4232c"/>
  <text x="300" y="96" font-size="11" text-anchor="middle" fill="#b4232c">waits</text>
  <line x1="140" y1="112" x2="84" y2="58" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="80,54 91,58 84,65" fill="#1d6fd1"/>
  <text x="70" y="96" font-size="11" text-anchor="middle" fill="#1d6fd1">event arrives</text>
</svg>
```
:::

::: context dijkstra Why "P" and "V"
The semaphore was invented in the early 1960s by the Dutch computer scientist Edsger Dijkstra, and he named the operations in Dutch. V comes from *verhogen*, "to raise". P comes from a word he made up, *prolaag*, short for "try to lower".

The name "semaphore" itself comes from railway signals: arms on a post that tell a train whether it may enter the next stretch of track. A train waits at a lowered arm, exactly as a task waits at a zero count.
:::

::: context interrupt-handler Code the hardware calls
An **interrupt** is a signal from hardware — a timer ticking, a sensor finishing a reading, a radio receiving a byte — that makes the processor drop what it is doing and run a short piece of code at once. That code is the **interrupt handler**, or **ISR** (interrupt service routine).

A handler is not a task. It borrows the processor for a moment and must finish fast. So the usual pattern is: the handler grabs the data, signals a semaphore, and returns; a normal task, woken by that signal, does the slow processing. Lesson seven is all about this split.
:::

::: context task-notification A lighter-weight bell
Signaling one particular task is so common that many RTOSes offer a shortcut that skips the separate semaphore object. FreeRTOS calls it a **direct-to-task notification**: each task carries a small built-in counter that an interrupt handler or another task can bump, and the task can block waiting for it. Because there is no separate object to create and look up, it is faster and uses less memory. It has the same owner-free "anyone may signal" shape, so it belongs on the signaling side of the line too.
:::

::: context overflow-policy Newest wins or oldest wins?
Which overflow rule is right depends on what the messages mean.

For a **control loop** reading a sensor, only the freshest value matters. Many designs use a queue of length one that is overwritten every time — a "latest value" mailbox. An old reading is worse than useless.

For **commands** or **event logs**, every message matters. Dropping one could lose a command to fire an engine. There, you size the queue so it cannot fill, block or reject at the sender, and count every rejection in telemetry.
A full four-slot queue (oldest on the left) meets message 5. Dropping loses the newest; overwriting loses the oldest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="30" font-size="11" fill="#1f2a44">full queue</text>
  <rect x="130" y="12" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="148" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <rect x="170" y="12" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="188" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <rect x="210" y="12" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="228" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <rect x="250" y="12" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="268" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="294" y="31" font-size="11" fill="#1f2a44">+5 arrives</text>
  <text x="12" y="80" font-size="11" fill="#1f2a44">drop newest</text>
  <rect x="130" y="62" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="148" y="81" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <rect x="170" y="62" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="188" y="81" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <rect x="210" y="62" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="228" y="81" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <rect x="250" y="62" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="268" y="81" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="300" y="81" font-size="11" fill="#b4232c">5 lost</text>
  <text x="12" y="130" font-size="11" fill="#1f2a44">overwrite oldest</text>
  <rect x="130" y="112" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="148" y="131" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <rect x="170" y="112" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="188" y="131" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <rect x="210" y="112" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="228" y="131" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
  <rect x="250" y="112" width="36" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/><text x="268" y="131" font-size="12" text-anchor="middle" fill="#1f2a44">5</text>
  <text x="300" y="131" font-size="11" fill="#b4232c">1 lost</text>
</svg>
```
:::

::: context queue-fill Four arrivals in one stall
The consumer is stalled for $18\,\mathrm{ms}$ (dashed gray box). The producer adds one entry every $5\,\mathrm{ms}$, at $0$, $5$, $10$ and $15$. The next would come at $20$, after the stall ends. So four entries pile up, and the queue needs at least four slots.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="270" height="22" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="165" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">consumer stalled 18 ms</text>
  <line x1="30" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <circle cx="30" cy="80" r="6"/><circle cx="105" cy="80" r="6"/><circle cx="180" cy="80" r="6"/><circle cx="255" cy="80" r="6"/>
  </g>
  <circle cx="330" cy="80" r="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="300" y1="24" x2="300" y2="92" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="104">0</text><text x="105" y="104">5</text><text x="180" y="104">10</text><text x="255" y="104">15</text>
    <text x="300" y="104">18</text><text x="330" y="104">20</text>
  </g>
  <text x="300" y="18" font-size="11" fill="#b4232c" text-anchor="middle">stall ends</text>
</svg>
```
:::

::: context hold-last-good Using yesterday's newspaper, on purpose
When a fresh input does not arrive, flight code usually keeps using the last value that passed its checks, and marks it as **stale** — often with a counter of how many cycles old it is. A control law can ride through one or two missing samples that way with little harm.

But stale data gets worse with every cycle. So the same code sets a limit: after some number of missed updates, it stops trusting the value and switches to a safe mode or a backup sensor. The timeout is what makes each miss *countable* in the first place.
:::
