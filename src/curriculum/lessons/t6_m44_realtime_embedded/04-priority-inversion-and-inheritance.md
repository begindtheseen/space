---
id: l04-priority-inversion
title: Priority inversion, priority inheritance and priority ceiling
minutes: 22
covers:
  - Priority inversion, priority inheritance and priority ceiling; the Mars Pathfinder failure and its fix
---

Every deadline argument in the last two lessons assumed a task is only ever delayed by tasks of equal or higher priority. That assumption is built into the response-time equation itself — the interference sum runs over $\mathrm{hp}(i)$, the higher-priority tasks, and nothing else appears. Add an ordinary mutex protecting data shared between a high-priority and a low-priority task, and the assumption can break in the worst possible way: a task with the highest priority in the system can end up waiting on a task with the lowest, for a duration that has nothing to do with either task's own numbers and everything to do with a third task that has no business delaying either of them.

This happened in flight, on Mars Pathfinder, in July 1997. A high-priority information-bus task blocked on a mutex held by a low-priority meteorological data task, which was itself preempted by a medium-priority communications task — and while that medium-priority task ran, the low-priority task could not finish and release the mutex, so the high-priority task sat blocked for far longer than the mutex's own critical section could explain. The bus task missed its deadline repeatedly, the watchdog concluded the system was unhealthy and reset it, and the pattern recurred until JPL diagnosed it on an identical ground testbed and fixed it in flight, by uplink, by turning on a feature that had been available the entire time and had not been enabled: priority inheritance.

This lesson builds that exact failure shape with concrete numbers you can check by hand, shows it missing its deadline, and then shows the fix bounding the damage to something a schedulability proof can account for.

## Priority inversion, precisely

**Priority inversion** is any situation where a higher-priority task is delayed by a lower-priority one. A small amount of it is unavoidable and harmless: if a high-priority task needs a mutex a low-priority task is already holding, it must wait for that critical section to finish, and that wait is bounded by the critical section's own length — a number you can measure and add to the response-time equation as a blocking term. This is **bounded** priority inversion, and it is a normal, accounted-for cost of sharing a resource.

**Unbounded priority inversion** is the dangerous version: the high-priority task waits not merely for the low-priority task's critical section, but for however long *anything else* keeps that low-priority task from running at all. If a medium-priority task — one with no interest in the shared resource whatsoever — preempts the low-priority holder while it is inside the critical section, the high-priority task is now waiting on the medium-priority task's own execution time, indirectly, through a lock it never touches. Swap the medium task's ten milliseconds for ten seconds and the high-priority task's wait grows to match, while the mutex and its critical section are completely unchanged. The word "unbounded" does not mean infinite; it means the wait is bounded by something that has nothing to do with the resource being shared, so no analysis of the resource alone can bound it.

## Demonstration: the Pathfinder shape, with plain mutexes

Three tasks, invented numbers built to have exactly the shape of the real failure — a high-priority attitude-control task, a low-priority sensor-logging task holding a mutex the high-priority task also needs, and a medium-priority telemetry-formatting task that takes no locks at all:

| Task | Priority | Job | Needs the mutex |
| --- | --- | --- | --- |
| H | highest | period $50\,\mathrm{ms}$, $C_H = 10\,\mathrm{ms}$ | for its entire job |
| M | medium | one-shot, $C_M = 40\,\mathrm{ms}$, no locks | no |
| L | lowest | one-shot, $C_L = 6\,\mathrm{ms}$ | for its entire job |

$L$ starts at $t=0$ and locks the mutex immediately. $H$ releases at $t=2\,\mathrm{ms}$ and, being highest priority, would normally preempt $L$ at once — but its first action is to lock the same mutex, which $L$ already holds, so $H$ blocks instead. Control returns to $L$, the next-highest ready task, which resumes its critical section. $M$ releases at $t=3\,\mathrm{ms}$ and, having higher priority than $L$, preempts it immediately.

::: example Plain mutex: the blocking is unbounded
| Time | Event |
| --- | --- |
| $t=0$ | $L$ starts, locks the mutex |
| $t=2$ | $H$ releases, tries to lock the mutex, blocks (held by $L$) |
| $t=2$–$3$ | $L$ resumes, continues its critical section (now $3\,\mathrm{ms}$ done, $3\,\mathrm{ms}$ remaining) |
| $t=3$ | $M$ releases, preempts $L$ (higher priority, holds no locks) |
| $t=3$–$43$ | $M$ runs to completion, $40\,\mathrm{ms}$ — $L$ cannot run, so cannot finish or release the mutex |
| $t=43$–$46$ | $L$ resumes, finishes its last $3\,\mathrm{ms}$, releases the mutex at $t=46$ |
| $t=46$–$56$ | $H$ acquires the mutex, runs its full $10\,\mathrm{ms}$ |

$H$ was blocked from $t=2$ to $t=46$: a blocking duration of $44\,\mathrm{ms}$, against a mutex whose entire critical section is $6\,\mathrm{ms}$ long. $H$ completes at $t=56$, a response time of $56-2=54\,\mathrm{ms}$ measured from its release, against its $50\,\mathrm{ms}$ deadline — a **miss**, by four milliseconds. Notice what the blocking duration is actually made of: one millisecond of $L$ finishing its immediate slice, forty milliseconds of $M$ running for reasons entirely its own, and three more milliseconds of $L$ cleaning up — $1+40+3=44$. Forty of those forty-four milliseconds belong to $M$, a task that never touches the mutex at all, and the remaining four are what was left of $L$'s critical section when $H$ blocked — it had already run two of its six milliseconds by then. Response-time analysis, exactly as built in the last lesson, would have proven $H$ safe: with $C_H=10$ and no higher-priority tasks above it, $R_H=10\,\mathrm{ms}$ was the entire (correct) answer to a question that turned out not to be the only thing that could delay $H$.
:::

## The fix: priority inheritance

**Priority inheritance** closes the gap by changing what happens the instant a task blocks on a lock. When $H$ blocks on a mutex $L$ holds, $L$ immediately, temporarily, runs at $H$'s priority — the highest priority of anything waiting on a resource it holds — for as long as it holds that resource. The moment it releases the lock, it drops back to its own base priority.

The effect is exactly the fix Pathfinder needed. With $L$ running at $H$'s (inherited) priority, $M$ can no longer preempt it — $M$'s own priority is lower than the priority $L$ is now running at — so $L$ is guaranteed to run, uninterrupted by anything except a task that was already higher priority than $H$ itself, until it finishes its critical section and releases the lock.

::: example The same scenario, with priority inheritance
| Time | Event |
| --- | --- |
| $t=0$ | $L$ starts, locks the mutex, runs at its own base priority |
| $t=2$ | $H$ releases, blocks on the mutex; $L$ **inherits** $H$'s priority |
| $t=2$–$6$ | $L$ continues at the inherited priority; $M$ releases at $t=3$ but cannot preempt it |
| $t=6$ | $L$ finishes its critical section (the remaining $4\,\mathrm{ms}$ it had left at $t=2$), releases the mutex, drops back to its base priority |
| $t=6$–$16$ | $H$ immediately acquires the mutex and runs its full $10\,\mathrm{ms}$ |
| $t=16$–$56$ | $M$, which never got to run at all until now, finally executes its $40\,\mathrm{ms}$ |

$H$ was blocked from $t=2$ to $t=6$: a blocking duration of $4\,\mathrm{ms}$ — exactly the length of the critical section $L$ still had left when $H$ blocked, no more, regardless of what $M$ or anything else at medium priority does in the meantime. $H$ completes at $t=16$, a response time of $16-2=14\,\mathrm{ms}$ against its $50\,\mathrm{ms}$ deadline: **meets**, with $36\,\mathrm{ms}$ to spare. The blocking dropped from $44\,\mathrm{ms}$ to $4\,\mathrm{ms}$ by changing nothing about $L$'s critical section or $M$'s execution time — only about which of them was allowed to run while $H$ waited.
:::

This is also the moment priority inheritance rejoins the arithmetic of the last two lessons rather than living in a separate world from it. The bound priority inheritance guarantees — blocking no longer than the longest critical section of any lower-priority task that could hold a resource this task needs — is a fixed, computable number, exactly the kind response-time analysis already knows how to use. Add it as a blocking term $B_i$ and the equation from lesson three becomes

$$
R_i = C_i + B_i + \sum_{j\,\in\,\mathrm{hp}(i)} \left\lceil \frac{R_i}{T_j}\right\rceil C_j,
$$

solved by the identical fixed-point iteration. Priority inheritance does not sidestep response-time analysis; it is what makes the analysis's own assumptions true again, by putting a real ceiling on a term that would otherwise be unbounded.

::: key
**Unbounded priority inversion**: a high-priority task blocks on a resource held by a low-priority task, which is then preempted by an unrelated medium-priority task — the high task now waits on the medium task, with no bound related to the resource at all. **Priority inheritance**: the lock holder temporarily takes the priority of the highest task blocked on it, so the wait is bounded by that one critical section's length, and the bound feeds directly into response-time analysis as $B_i$.
:::

## Priority ceiling protocol

**Priority ceiling** goes one step further. Every resource is assigned, at design time, a **ceiling**: the highest priority of any task that could ever lock it. A task raises to that ceiling the instant it acquires the lock — not only once someone blocks on it, but immediately, unconditionally — and drops back to its base priority when it releases.

::: example The same numbers under priority ceiling
The mutex's ceiling is $H$'s priority, since $H$ is the highest-priority task that could ever lock it. $L$ locks it at $t=0$ and immediately runs at that ceiling — even though $H$ has not released yet. $M$ arrives at $t=3$ and, exactly as before, cannot preempt $L$, which is already running above $M$'s priority. $L$ finishes its (uninterrupted, from the very start) critical section at $t=0+6=6$ and releases. $H$, which has been waiting since $t=2$, acquires the mutex at $t=6$ and runs to $t=16$ — the identical $4\,\mathrm{ms}$ block and $14\,\mathrm{ms}$ response time as with plain inheritance.

The two protocols agree here because this scenario has one resource and one lower-priority holder — the case plain inheritance already handles completely. The protocols diverge once a task can lock more than one resource, or more than one lower-priority task can each hold a different resource the same high-priority task might need in sequence. Plain inheritance bounds the block from *each* resource separately, so a task touching several locks in a row can, in the worst case, accumulate one critical section's worth of blocking *per resource*. Priority ceiling bounds the total blocking, over the task's *entire execution*, to at most one critical section, ever — because a task cannot even begin a critical section of its own once anything with a resource at or above its ceiling is in use, which also happens to rule out the circular wait that causes deadlock. That is the second, separate benefit: priority ceiling makes deadlock structurally impossible, where plain inheritance changes only priorities and does nothing to prevent two tasks from locking the same two mutexes in opposite orders.
:::

Priority ceiling's stronger guarantee is not free. It requires knowing, before the system runs, the complete set of tasks that could ever lock each resource, so every ceiling can be computed and declared up front — a real cost when a codebase grows and a new task acquires a lock nobody assigned a ceiling anticipating. Priority inheritance needs no such global declaration; it operates purely from who is actually blocked on what, while the system runs, which is exactly why it was the fix available to enable on Pathfinder by flipping a flag already built into the operating system, without redesigning the locking structure of the flight software from the ground up. In practice: reach for priority ceiling when a system has several resources shared across overlapping sets of tasks and deadlock is a genuine risk; plain inheritance is usually enough, and is far easier to retrofit, when the danger is the single-resource unbounded-inversion pattern this lesson built by hand.

::: warning
An ordinary mutex, in a system with three or more distinct priority levels sharing a resource, is a latent unbounded-inversion bug whether or not it has ever shown up in testing. The failure needs a specific interleaving — a medium-priority task preempting the lock holder at the wrong moment — and a short or lightly loaded test campaign can pass for years without producing it, exactly as Pathfinder's ground testing did, before a busier, more representative timing pattern in actual operation found it. The defence is not more testing; it is priority inheritance or priority ceiling on every mutex a high-priority task can contend for, decided at design time rather than discovered in flight.
:::

## Check yourself

::: check
A high-priority task blocks on a mutex held by a low-priority task, and no medium-priority task exists anywhere in the system. Is this bounded or unbounded priority inversion, and how long does the high-priority task wait?
:::

::: answer
Bounded. With nothing of intermediate priority able to preempt the low-priority holder, it runs to the end of its critical section as soon as it is scheduled, and the high-priority task waits only for that critical section's length — a fixed, measurable number with no dependence on any third task. Unbounded inversion specifically requires a task of intermediate priority to preempt the holder while it has the resource locked; remove that task and the wait reverts to the ordinary, already-accounted-for blocking term response-time analysis expects.
:::

::: check
In the plain-mutex demonstration, $H$'s blocking time was $44\,\mathrm{ms}$ while the mutex's critical section is only $6\,\mathrm{ms}$ long. Account for all $44\,\mathrm{ms}$ — say which task owns each part — and then say which of those parts a schedulability argument could have bounded in advance and which it could not.
:::

::: answer
One millisecond came from $L$ finishing the slice of its critical section it was already partway through before $M$ arrived (from $t=2$ to $t=3$). Forty milliseconds came from $M$ running to completion — a task with no relationship to the mutex at all, only a higher priority than the task that happened to be holding it. Three milliseconds came from $L$ finishing the remainder of its critical section after $M$ finally released the processor. $1+40+3=44$, which splits as four milliseconds of $L$ and forty of $M$. Only the four is bounded by anything to do with the resource: it is what remained of $L$'s six-millisecond critical section at the moment $H$ blocked, and no arrangement of the other tasks can make it longer. The forty is bounded by nothing in this analysis at all — it is $M$'s execution time, and $M$ never touches the lock. Put a second medium-priority task in the system and the figure grows again. That is the concrete meaning of "unbounded": not that the number is infinite, but that it is set by tasks the resource argument never looked at, so no amount of reasoning about the critical section can cap it.
:::

::: check
Why does priority inheritance specifically prevent the medium-priority task from preempting the lock holder, when ordinarily a medium-priority task preempts a low-priority one as a matter of course?
:::

::: answer
Because the moment the high-priority task blocks on the lock, the holder's priority is no longer its own base (low) priority — it has temporarily inherited the priority of the task waiting on it, which is higher than the medium-priority task's. The scheduler still applies the ordinary rule, highest ready priority runs, but the holder is not running at its base priority anymore, so the medium-priority task is not actually higher priority than whatever is currently running; it is lower. Nothing about the medium-priority task's own scheduling changed — what changed is which priority the lock holder is entitled to borrow while it stands in the way of something more urgent.
:::

::: check
A task acquires mutex A, then while still holding A acquires mutex B, then releases both. Under plain priority inheritance, in the worst case, by how many critical sections' worth of time can a high-priority task be blocked by this pattern, and how does priority ceiling improve on that number?
:::

::: answer
Under plain inheritance, the high-priority task can in the worst case be blocked once for mutex A's critical section and, separately, once for mutex B's — up to two critical sections' worth of blocking, because inheritance bounds the wait on each resource individually but has no mechanism limiting how many different resources a single stretch of higher-priority work might need in sequence. Priority ceiling bounds the total to at most one critical section for the task's entire execution, because the ceiling protocol prevents a task from even starting a new critical section while any resource at or above its own ceiling is in use elsewhere, which collapses the chain to a single blocking episode however many resources are ultimately touched.
:::

::: check
Pathfinder's fix was applied in flight, without recompiling or restructuring the spacecraft's task set, by enabling a flag on the affected mutex. Which of the two protocols in this lesson does that fact tell you was used, and why was it the more practical choice for an in-flight fix specifically?
:::

::: answer
Priority inheritance. It is a purely runtime mechanism — it needs no prior declaration of ceilings for every resource and every task that could ever touch it, only the operating system's own bookkeeping of who currently holds and who is currently waiting on each lock — so it can be switched on for one specific mutex without recomputing anything about the rest of the system's locking structure. Priority ceiling would have required knowing, and correctly declaring, the ceiling of every resource in the system before the fix could be trusted, which is design-time work far riskier to attempt by uplink to a spacecraft already on the Martian surface than flipping one flag the operating system had supported the entire time.
:::

## Summary

| Term | Statement |
| --- | --- |
| Priority inversion | A higher-priority task delayed by a lower-priority one |
| Bounded inversion | Wait limited to the lower-priority task's own critical section — normal, accounted for |
| Unbounded inversion | An unrelated medium-priority task keeps the holder from running; the wait is set by that task, not the resource |
| Priority inheritance | Holder temporarily takes the priority of the highest task blocked on it; bounds the wait to one critical section |
| Priority ceiling | Holder takes the resource's pre-declared ceiling priority immediately on lock; bounds total blocking to one critical section for the whole execution and prevents deadlock |
| Feeds back into RTA | $R_i = C_i + B_i + \sum_{j\in\mathrm{hp}(i)}\lceil R_i/T_j\rceil C_j$, with $B_i$ the bounded blocking term either protocol guarantees |
| This lesson's numbers | Plain mutex: $44\,\mathrm{ms}$ block, $54\,\mathrm{ms}$ response, misses a $50\,\mathrm{ms}$ deadline. With inheritance or ceiling: $4\,\mathrm{ms}$ block, $14\,\mathrm{ms}$ response, meets it |
| Choose ceiling when | Multiple resources, overlapping task sets, deadlock is a real risk, and the full locking structure is known at design time |

You now have exact schedulability and bounded blocking — the two things that decide whether a task set meets its deadlines in principle. The next lesson looks at the primitives you actually build a schedule out of — tasks, semaphores, mutexes, queues — and which of them can block a task for a duration nothing in this module has bounded yet.
