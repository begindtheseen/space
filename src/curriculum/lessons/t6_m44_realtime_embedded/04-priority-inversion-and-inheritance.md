---
id: l04-priority-inversion
title: Priority inversion, priority inheritance and priority ceiling
minutes: 24
covers:
  - Priority inversion, priority inheritance and priority ceiling; the Mars Pathfinder failure and its fix
---

Picture a single bathroom in a busy house, with one key. Your little brother has the key and is inside. You are next in line, and you are in a real hurry. Normally you wait a minute or two — however long he takes. But now imagine your older sister calls your brother away to help her carry groceries, for half an hour, while he still has the key in his pocket. You are not waiting for the bathroom anymore. You are waiting for the groceries, which have nothing to do with you.

That is the whole problem of this lesson. In a real-time system the "key" is a lock on shared data, and the people are tasks with different priorities. Every deadline argument so far assumed a task is only delayed by tasks of equal or higher priority. The response-time equation has that built in: its interference sum runs over $\mathrm{hp}(i)$ — read it "h-p of i", the tasks with higher priority than task $i$ — and nothing else. Add an ordinary **[[mutex|mutex-word]]** (a lock only one task can hold at a time) around data a high-priority and a low-priority task share, and that assumption can break badly. The most important task ends up waiting on the least important, for a time set by a third task that should delay neither.

This happened in flight, on **[[Mars Pathfinder|pathfinder]]**, in July 1997. A high-priority information-bus task blocked on a mutex held by a low-priority weather-data task. A medium-priority communications task then preempted the low-priority one. While it ran, the low task could not finish and release the mutex, so the bus task stayed blocked and missed its deadline. A **[[watchdog|watchdog]]** check decided the system was unhealthy and reset the whole computer. It kept happening until engineers at JPL (NASA's Jet Propulsion Laboratory) reproduced it on a copy of the spacecraft on the ground and fixed it by radio — by turning on a feature the operating system had all along: priority inheritance.

This lesson builds that failure with small numbers you can check by hand, then shows the fix.

## Priority inversion, precisely

Start with the plain version. **Priority inversion** is any moment when a higher-priority task is delayed by a lower-priority one. The priorities are upside down, "inverted", for a while.

A little of it is unavoidable and harmless. Suppose a high-priority task needs a mutex a low-priority task already holds. The stretch of code that runs while holding a lock is called a **critical section**. The high task must wait for that critical section to finish. The wait is limited by the critical section's own length — a number you can measure and add to the response-time equation as a **blocking term**. This is **bounded priority inversion**: a normal, planned-for cost of sharing data. It is like waiting for your brother to finish.

**Unbounded priority inversion** is the dangerous version. Say a medium-priority task — one with no interest in the shared data — preempts the low-priority holder while it is inside its critical section. Now the high task waits on the medium task's run time, through a lock the medium task never touches. Swap the medium task's ten milliseconds for ten seconds and the high task's wait grows to match. The mutex and its critical section have not changed at all.

The word "unbounded" does not mean infinite. It means the wait is limited only by things that have nothing to do with the shared resource. So no study of the resource alone can put a limit on it. That is the groceries.

## Demonstration: the Pathfinder shape, with a plain mutex

Here are three tasks with made-up numbers, in the shape of the real failure. $H$ is a high-priority attitude-control task. $L$ is a low-priority sensor-logging task that holds a mutex $H$ also needs. $M$ is a medium-priority telemetry-formatting task that takes no locks at all.

| Task | Priority | Job | Needs the mutex |
| --- | --- | --- | --- |
| H | highest | period $50\,\mathrm{ms}$, $C_H = 10\,\mathrm{ms}$ | for its entire job |
| M | medium | one-shot, $C_M = 40\,\mathrm{ms}$, no locks | no |
| L | lowest | one-shot, $C_L = 6\,\mathrm{ms}$ | for its entire job |

As before, $C$ is the execution time — how long the task computes when nothing interrupts it. $H$'s deadline equals its period, $50\,\mathrm{ms}$ after it is released.

Walk through it slowly. $L$ starts at $t=0$ and locks the mutex. $H$ is released at $t=2\,\mathrm{ms}$ and would normally preempt $L$ right away. But its first action is to lock the same mutex. So $H$ **blocks** — it stops and waits. Control goes back to $L$, the highest-priority task that is ready, and $L$ carries on with its critical section. Then $M$ is released at $t=3\,\mathrm{ms}$. $M$ has higher priority than $L$, so it preempts $L$ at once. This order of events — who runs when, sliced together — is called an **[[interleaving|interleaving-picture]]**.

::: example Plain mutex: the blocking is unbounded
| Time (ms) | Event |
| --- | --- |
| $t=0$ | $L$ starts, locks the mutex |
| $t=2$ | $H$ is released, tries to lock the mutex, blocks (held by $L$) |
| $t=2$–$3$ | $L$ resumes its critical section ($3\,\mathrm{ms}$ done, $3\,\mathrm{ms}$ left) |
| $t=3$ | $M$ is released, preempts $L$ (higher priority, holds no locks) |
| $t=3$–$43$ | $M$ runs to completion, $40\,\mathrm{ms}$. $L$ cannot run, so it cannot finish or release the mutex |
| $t=43$–$46$ | $L$ resumes, finishes its last $3\,\mathrm{ms}$, releases the mutex at $t=46$ |
| $t=46$–$56$ | $H$ gets the mutex and runs its full $10\,\mathrm{ms}$ |

**Blocking.** $H$ was blocked from $t=2$ to $t=46$. That is $46 - 2 = 44\,\mathrm{ms}$ of blocking, for a mutex whose entire critical section is only $6\,\mathrm{ms}$ long.

**Response time.** $H$ finishes at $t=56$. Measured from its release, its response time is $56 - 2 = 54\,\mathrm{ms}$. Its deadline is $50\,\mathrm{ms}$. That is a **miss**, by $4\,\mathrm{ms}$.

**Where the 44 ms came from.** One millisecond of $L$ continuing its slice ($t=2$ to $3$). Forty milliseconds of $M$ running for its own reasons. Three more milliseconds of $L$ finishing up. Add them: $1 + 40 + 3 = 44$. Forty of the forty-four belong to $M$, a task that never touches the mutex. The other four are what was left of $L$'s critical section when $H$ blocked — $L$ had already run $2$ of its $6$ milliseconds by then.

**Sanity check.** Response-time analysis as built in the last lesson would have called $H$ safe: $C_H = 10$ and no tasks above it, so $R_H = 10\,\mathrm{ms}$. It answered the wrong question — it never looked at the lock.
:::

## The fix: priority inheritance

Back to the bathroom. The fix is a house rule: while someone is waiting for the key, whoever holds it gets the waiting person's importance. Your big sister can no longer call your brother away, because right now he counts as you.

**Priority inheritance** changes what happens the instant a task blocks on a lock. When $H$ blocks on a mutex that $L$ holds, $L$ at once, and only for a while, [[borrows the higher priority|inheritance-picture]] and runs at $H$'s level. The rule in general: a lock holder runs at the highest priority of any task waiting on a lock it holds, for as long as it holds that lock. The moment it releases the lock, it drops back to its own **base priority** (the priority it was given at design time).

With $L$ running at $H$'s borrowed priority, $M$ can no longer preempt it. So $L$ runs until it finishes its critical section and releases the lock. Only tasks already more important than $H$ itself can interrupt it.

::: example The same scenario, with priority inheritance
| Time (ms) | Event |
| --- | --- |
| $t=0$ | $L$ starts, locks the mutex, runs at its own base priority |
| $t=2$ | $H$ is released, blocks on the mutex; $L$ **inherits** $H$'s priority |
| $t=2$–$6$ | $L$ continues at the inherited priority; $M$ is released at $t=3$ but cannot preempt it |
| $t=6$ | $L$ finishes its critical section (the $4\,\mathrm{ms}$ it had left at $t=2$), releases the mutex, drops back to base priority |
| $t=6$–$16$ | $H$ gets the mutex at once and runs its full $10\,\mathrm{ms}$ |
| $t=16$–$56$ | $M$, which has not run at all until now, finally runs its $40\,\mathrm{ms}$ |

**Blocking.** $H$ was blocked from $t=2$ to $t=6$: $6 - 2 = 4\,\mathrm{ms}$. That is exactly the critical section $L$ still had left when $H$ blocked. It does not depend on what $M$, or any other medium task, does.

**Response time.** $H$ finishes at $t=16$, a response time of $16 - 2 = 14\,\mathrm{ms}$ against a $50\,\mathrm{ms}$ deadline. It **meets** the deadline with $36\,\mathrm{ms}$ to spare.

**Sanity check.** The blocking fell from $44\,\mathrm{ms}$ to $4\,\mathrm{ms}$ without changing $L$'s critical section or $M$'s run time at all. The only change was *who was allowed to run* while $H$ waited. And $M$ still finishes at $t=56$, the same moment as before — the processor did the same total work, in a better order.
:::

### Putting the blocking back into the equation

Inheritance guarantees a bound: a task waits no longer than the longest critical section of a lower-priority task that could hold a resource it needs. That is a fixed number — exactly what response-time analysis can use. Add it as a **[[blocking term|blocking-term]]** $B_i$ ("B sub i") and the equation from lesson three becomes

$$
R_i = C_i + B_i + \sum_{j\,\in\,\mathrm{hp}(i)} \left\lceil \frac{R_i}{T_j}\right\rceil C_j .
$$

Read it left to right: task $i$'s own work, plus the longest it can be blocked by lower tasks, plus each higher task $j$ running $\lceil R_i / T_j \rceil$ times (its releases in the window, rounded up). Solve it by the same fixed-point iteration: guess, plug in, repeat until the number stops changing.

For $H$ in our example: $C_H = 10$, $B_H = 6$ (the whole critical section of $L$, the worst case if $H$ arrives the instant $L$ locks), and no higher-priority tasks. So $R_H = 10 + 6 = 16\,\mathrm{ms}$, safely under $50$. The measured $14\,\mathrm{ms}$ sits inside that bound, as it must.

So inheritance does not dodge response-time analysis. It makes the analysis true again, by putting a real limit on a term that had none.

::: key
**Unbounded priority inversion**: a high-priority task blocks on a resource held by a low-priority task, which is then preempted by an unrelated medium-priority task. The high task now waits on the medium task, with no bound related to the resource at all. **Priority inheritance**: the lock holder temporarily inherits the highest priority of anyone blocked on it, so blocking is bounded by the critical section length — and that bound enters response-time analysis as $B_i$.
:::

### What it looks like in code

On a POSIX system (Linux, VxWorks, QNX and many others share one standard thread interface, called **[[pthreads|pthreads]]**) inheritance is a property you switch on when you create the mutex. This compiles and runs as C++17 with `g++ -std=c++17 -pthread`:

```cpp
#include <pthread.h>
#include <cstdio>

pthread_mutex_t nav_lock;  // shared by the high- and low-priority tasks

int main() {
    pthread_mutexattr_t attr;
    pthread_mutexattr_init(&attr);
    // The one line Pathfinder was missing: turn on priority inheritance.
    int err = pthread_mutexattr_setprotocol(&attr, PTHREAD_PRIO_INHERIT);
    // (For a priority ceiling, pass PTHREAD_PRIO_PROTECT instead and
    //  declare the ceiling with pthread_mutexattr_setprioceiling.)
    pthread_mutex_init(&nav_lock, &attr);
    pthread_mutexattr_destroy(&attr);
    std::printf("inheritance enabled: %s\n", err == 0 ? "yes" : "no");
    // prints: inheritance enabled: yes

    pthread_mutex_lock(&nav_lock);
    // ... critical section: read or write the shared data ...
    pthread_mutex_unlock(&nav_lock);
    return 0;
}
```

The lock and unlock calls do not change. The operating system does the priority bookkeeping behind them.

## Priority ceiling protocol

Inheritance waits until someone is stuck before it helps. **[[Priority ceiling|ceiling-history]]** plans ahead. At design time, every resource is given a **ceiling**: the highest priority of any task that could *ever* lock it. In the version most systems use (POSIX calls it `PTHREAD_PRIO_PROTECT`), a task jumps to that ceiling the instant it takes the lock — not only once someone blocks on it, but right away, every time. It drops back to its base priority when it releases.

In bathroom terms: the key carries the importance of the most important person who ever uses that bathroom, from the moment anyone picks it up.

::: example The same numbers under priority ceiling
The mutex's ceiling is $H$'s priority, because $H$ is the highest-priority task that could ever lock it.

$L$ locks it at $t=0$ and at once runs at the ceiling, even though $H$ has not been released yet. $H$ is released at $t=2$. Its priority is only equal to the one $L$ is running at, not higher, so it cannot preempt $L$. $M$ arrives at $t=3$ and, as before, cannot preempt $L$ either.

$L$ runs its critical section without a break from start to finish: $0 + 6 = 6$, so it releases at $t=6$. $H$, which has been waiting since $t=2$, takes the mutex at $t=6$ and runs until $t=16$. That is the same $4\,\mathrm{ms}$ of blocking and $14\,\mathrm{ms}$ response time as with plain inheritance.
:::

The two agree here because there is one resource and one lower-priority holder. They differ in two ways once things get tangled.

**Chains of blocking.** Suppose two low-priority tasks each hold a different mutex that the same high-priority task will need, one after the other. Plain inheritance bounds the wait on *each* resource separately, so the high task can collect one critical section of blocking *per resource*. Priority ceiling limits the total, over the task's *whole* run, to at most one critical section: any lower task holding something the high task needs is already running at or above its priority, so the high task cannot even start until that holder is done.

**[[Deadlock|deadlock-picture]].** Deadlock is two tasks each holding one lock and each waiting forever for the other's. Priority ceiling makes it impossible by construction. Plain inheritance only changes priorities. It does nothing to stop two tasks from locking the same two mutexes in opposite orders.

::: note Why the ceiling rules out deadlock and chains
Take one processor, and tasks that never sleep while holding a lock. Claim: under the ceiling rule, a *running* task never finds a lock it wants already taken.

Suppose task $P$ is running and asks for lock $X$, but another task $Q$ holds $X$. Because $P$ uses $X$, the ceiling of $X$ is at least $P$'s priority. From the moment $Q$ locked $X$, it has been running at that ceiling — so at a priority at least as high as $P$'s. $Q$ has not finished with $X$ and does not sleep, so it is still ready to run. For $P$ to be running instead, the scheduler would have had to prefer $P$, which needs $P$'s priority to be *strictly higher* than $Q$'s current one. It is not. So $P$ cannot be running, and the situation is impossible.

Two things follow. **No deadlock**: deadlock needs a running task to wait on a held lock, and that never happens. **At most one block**: all of a task's waiting happens *before* it starts — waiting for the one lower task that was already inside a critical section with a high enough ceiling — and once it starts it never waits on a lock again.
:::

The stronger guarantee is not free. Priority ceiling needs you to know, before the system runs, every task that could ever lock each resource, so each ceiling can be declared. As code grows, a new task starts using a lock and nobody updates the ceiling. Inheritance needs no such list. It works from who is actually blocked on what, at run time — which is why Pathfinder could switch it on by flipping a setting, without redesigning its locking.

In practice, reach for **priority ceiling** when several locks are shared across overlapping tasks, deadlock is a real risk, and the locking is known at design time. **Plain inheritance** is usually enough, and far easier to retrofit, for the single-lock pattern built here.

::: key
**Priority ceiling**: the holder immediately takes the lock's priority ceiling — the highest priority of any task that could ever lock it. This additionally prevents deadlock and chained blocking, at the cost of needing the ceilings declared at design time.
:::

::: warning
An ordinary mutex, in a system with three or more priority levels sharing a resource, is a hidden unbounded-inversion bug — whether or not it has ever shown up in testing. The failure needs one particular interleaving: a medium task preempting the lock holder at just the wrong moment. Light testing can pass without ever producing it. Pathfinder's own team had seen a few unexplained resets before launch, could not make them happen again, and [[put them down to hardware glitches|testbed]]. The defense is not more testing. It is priority inheritance or priority ceiling on every mutex a high-priority task can wait on, decided at design time rather than discovered in flight.
:::

## Check yourself

::: check
A high-priority task blocks on a mutex held by a low-priority task, and no medium-priority task exists anywhere in the system. Is this bounded or unbounded priority inversion, and how long does the high-priority task wait?
:::

::: answer
Bounded. Nothing of in-between priority can preempt the holder, so once the high task blocks, the holder is the most important ready task. It runs straight to the end of its critical section, and the high task waits at most that critical section's length — a fixed number that depends on no third task.

Unbounded inversion needs a task of in-between priority to preempt the holder while it has the lock. Without one, the wait is the ordinary blocking term $B_i$.
:::

::: check
In the plain-mutex demonstration, $H$'s blocking time was $44\,\mathrm{ms}$ while the mutex's critical section is only $6\,\mathrm{ms}$ long. Account for all $44\,\mathrm{ms}$ — say which task owns each part — and then say which parts a schedulability argument could have bounded in advance and which it could not.
:::

::: answer
Go through the timeline:

- $1\,\mathrm{ms}$ ($t=2$ to $3$): $L$ continues the critical section it was already in the middle of, before $M$ arrives.
- $40\,\mathrm{ms}$ ($t=3$ to $43$): $M$ runs to completion. $M$ has nothing to do with the mutex; it only has higher priority than the task that happened to hold it.
- $3\,\mathrm{ms}$ ($t=43$ to $46$): $L$ finishes the rest of its critical section.

$1 + 40 + 3 = 44$, which splits as $4\,\mathrm{ms}$ of $L$ and $40\,\mathrm{ms}$ of $M$.

Only the $4$ could have been bounded in advance: it is what remained of $L$'s $6\,\mathrm{ms}$ critical section, and nothing can make it longer. The $40$ is $M$'s execution time, and $M$ never touches the lock, so no reasoning about the resource could cap it. Add a second medium task and it grows again.
:::

::: check
Why does priority inheritance stop the medium-priority task from preempting the lock holder, when normally a medium-priority task preempts a low-priority one as a matter of course?
:::

::: answer
Because the moment the high task blocks on the lock, the holder is no longer running at its own low base priority. It has temporarily inherited the priority of the task waiting on it, which is higher than the medium task's.

The scheduler follows its ordinary rule — the highest-priority ready task runs. Nothing about the medium task changed; the holder is running at a borrowed priority that beats it.
:::

::: check
Two low-priority tasks share a system with high-priority task $H$: $L_1$ sometimes holds mutex A, and $L_2$ sometimes holds mutex B. During one job, $H$ locks A, releases it, then locks B. Under plain priority inheritance, in the worst case, how many critical sections' worth of blocking can $H$ suffer in that job? How does priority ceiling improve on that number?
:::

::: answer
Under plain inheritance: two. In the worst case $H$ arrives while $L_1$ holds A *and* $L_2$ holds B (say $L_2$ locked B, $L_1$ preempted it and locked A). $H$ waits once for $L_1$'s critical section, then again for $L_2$'s. Each wait is bounded, but each resource can cost one.

Under priority ceiling: at most one. Both ceilings are at least $H$'s priority, because $H$ uses both locks. Once $L_2$ locks B it runs at or above $H$'s priority, so $L_1$ can never preempt it to lock A. Only one lower task can be inside a relevant critical section when $H$ arrives; once it finishes, $H$ runs and is never blocked again in that job.
:::

::: check
Pathfinder's fix was applied in flight, without recompiling or restructuring the spacecraft's task set, by switching on a setting for the affected mutex. Which of the two protocols does that tell you was used, and why was it the more practical choice for a fix sent by radio?
:::

::: answer
Priority inheritance. It works entirely at run time, from the operating system's own record of who holds each lock and who is waiting. So it can be switched on for one mutex without recomputing anything about the rest of the system.

Priority ceiling would have needed every relevant ceiling worked out and declared correctly first — design-time work, far riskier by uplink to a spacecraft on Mars than turning on one option the operating system already supported.
:::

## Summary

| Term | Statement |
| --- | --- |
| Priority inversion | A higher-priority task delayed by a lower-priority one |
| Bounded inversion | Wait limited to the lower task's critical section — normal |
| Unbounded inversion | An unrelated medium task keeps the holder from running; the wait is set by that task |
| Priority inheritance | Holder borrows the priority of the highest task blocked on it; one critical section per resource |
| Priority ceiling | Holder takes the lock's declared ceiling on locking; at most one block per job; no deadlock |
| Back into RTA | $R_i = C_i + B_i + \sum_{j\in\mathrm{hp}(i)}\lceil R_i/T_j\rceil C_j$, with $B_i$ the bounded blocking either protocol guarantees |
| This lesson's numbers | Plain mutex: $44\,\mathrm{ms}$ block, $54\,\mathrm{ms}$ response, misses $50\,\mathrm{ms}$. Inheritance or ceiling: $4\,\mathrm{ms}$ block, $14\,\mathrm{ms}$ response, meets it |
| In POSIX code | `PTHREAD_PRIO_INHERIT` for inheritance, `PTHREAD_PRIO_PROTECT` for ceiling |
| Choose ceiling when | Several shared locks, deadlock a real risk, locking known at design time |

You now have exact schedulability and bounded blocking. The next lesson looks at the building blocks tasks coordinate with — semaphores, mutexes, queues — and which of them can block a task for a time nothing so far has bounded.

::: context mutex-word Where "mutex" comes from
**Mutex** is short for **mut**ual **ex**clusion: "each one keeps the others out". Only one task at a time may hold it. Any other task that tries to lock it stops and waits until the holder unlocks it.

It protects shared data from being half-written. If the navigation task is halfway through updating a position — the new east value written, the new north value not yet — and the control task reads it at that moment, the control task gets a position that never existed. Wrapping both the write and the read in the same mutex makes each one happen all at once, as far as the other task can tell.
:::

::: context pathfinder The mission that made this famous
Mars Pathfinder landed on Mars on July 4, 1997, bouncing to a stop inside airbags. It carried the first Mars rover, a microwave-oven-sized robot called Sojourner. The lander's computer ran a commercial real-time operating system called VxWorks.

A few days after landing, the lander began resetting itself — each reset lost that day's work. Glenn Reeves, who led the flight software team, later wrote a clear public account of the hunt, and it is still the standard story told whenever someone asks why priority inheritance exists. The module's resource list points to it.
:::

::: context watchdog The dog that barks when you stop checking in
A **watchdog** is a timer that must be "petted" — reset — regularly by healthy software. If the software ever fails to pet it in time, the watchdog assumes something has hung and forces a reset.

On Pathfinder, a check noticed that the bus task had not finished when the next cycle began, and reset the computer. It did its job exactly: it detected trouble and got the system running again. What it could not do was say *why*, so the same trouble came back. A watchdog is a smoke alarm, not a fire investigator.
:::

::: context interleaving-picture The plain-mutex timeline, drawn out
Each row is one task; time runs left to right, from $0$ to $56\,\mathrm{ms}$. Blue is running, the thin gray line is $H$ blocked, and the red dashed line is $H$'s deadline at $t=52$ (released at $2$, plus $50$). $H$ cannot start until $46$ and finishes at $56$ — too late.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="12" y="34">H</text><text x="12" y="69">M</text><text x="12" y="104">L</text>
  </g>
  <line x1="50.7" y1="30" x2="286.4" y2="30" stroke="#6c7a93" stroke-width="2"/>
  <rect x="286.4" y="20" width="53.6" height="18" fill="#1d6fd1"/>
  <rect x="56.1" y="55" width="214.3" height="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="40" y="90" width="16.1" height="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="270.4" y="90" width="16" height="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <line x1="318.6" y1="12" x2="318.6" y2="116" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="40" y1="122" x2="340" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="138">0</text><text x="56.1" y="138">3</text><text x="163" y="138">M runs 40 ms</text>
    <text x="270.4" y="138">43</text><text x="296" y="138">46</text><text x="340" y="138">56</text>
  </g>
  <text x="170" y="48" font-size="11" fill="#6c7a93" text-anchor="middle">H blocked 44 ms</text>
  <text x="318.6" y="10" font-size="11" fill="#b4232c" text-anchor="middle">deadline</text>
</svg>
```
:::

::: context inheritance-picture The same three tasks, with inheritance
Same axes as before, $0$ to $56\,\mathrm{ms}$. At $t=2$, $H$ blocks and $L$ borrows its priority (red). $M$ arrives at $3$ but has to wait. $L$ releases at $6$, $H$ runs $6$ to $16$, and $M$ gets the processor last. $H$ finishes far ahead of its deadline.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="12" y="34">H</text><text x="12" y="69">M</text><text x="12" y="104">L</text>
  </g>
  <line x1="50.7" y1="30" x2="72.1" y2="30" stroke="#6c7a93" stroke-width="2"/>
  <rect x="72.1" y="20" width="53.6" height="18" fill="#1d6fd1"/>
  <line x1="56.1" y1="64" x2="125.7" y2="64" stroke="#6c7a93" stroke-width="2" stroke-dasharray="3 3"/>
  <rect x="125.7" y="55" width="214.3" height="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="40" y="90" width="10.7" height="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="50.7" y="90" width="21.4" height="18" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <line x1="318.6" y1="12" x2="318.6" y2="116" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="40" y1="122" x2="340" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="138">0</text><text x="72.1" y="138">6</text><text x="125.7" y="138">16</text>
    <text x="232" y="138">M runs 40 ms</text><text x="340" y="138">56</text>
  </g>
  <text x="140" y="104" font-size="11" fill="#b4232c">L boosted, t = 2 to 6</text>
  <text x="318.6" y="10" font-size="11" fill="#b4232c" text-anchor="middle">deadline</text>
</svg>
```
:::

::: context blocking-term Where the blocking term came from
In lesson three, the response-time equation had only two parts: a task's own work and the interference from higher-priority tasks. That was honest only because the tasks there shared nothing. The moment tasks share locks, a lower-priority task can delay a higher one, and the equation needs a third part to say so.

$B_i$ is that part. Under priority inheritance, a safe value is the longest critical section, among lower-priority tasks, of each lock task $i$ uses, added up over those locks. Under priority ceiling, it is the single longest such critical section. In the exercise "Break it like Pathfinder", you will measure $B_i$ directly — once without inheritance, where it grows with the medium task's work, and once with it, where it stops growing.
:::

::: context pthreads One thread interface, many systems
**POSIX** (the Portable Operating System Interface) is an IEEE standard describing how Unix-like operating systems should behave, so the same program can build on many of them. Its threads chapter is nicknamed **pthreads**, and every call in it starts with `pthread_`.

That shared interface is why the code above works almost unchanged on a Linux flight computer and on many real-time operating systems. You will use exactly this call in the exercise "Break it like Pathfinder". And in lesson six you will see Linux's real-time patch apply the same inheritance idea *inside* the kernel, to the kernel's own locks.
:::

::: context ceiling-history Who worked this out
Both protocols come from one paper: Lui Sha, Ragunathan Rajkumar and John Lehoczky, "Priority Inheritance Protocols: An Approach to Real-Time Synchronization", published in 1990 from Carnegie Mellon University. It named the unbounded-inversion problem, gave inheritance and the original ceiling protocol, and proved the "blocked at most once" and "no deadlock" results.

The immediate-jump version taught here, sometimes called the **highest locker** protocol, is simpler to build and gives the same two guarantees. It is what the Ada language's ceiling locking uses, what the automotive OSEK and AUTOSAR standards use for shared resources, and what POSIX calls `PTHREAD_PRIO_PROTECT`.
:::

::: context deadlock-picture Two tasks, two locks, stuck forever
Task $A$ locks X, then wants Y. Task $B$ locks Y, then wants X. Each is holding exactly what the other needs, and neither will let go until it gets the other one. Nothing will ever move again. The arrows form a circle, and a circle of waiting is what deadlock is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="80" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="42" font-size="13" text-anchor="middle" fill="#1f2a44">Task A</text>
  <rect x="250" y="20" width="80" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="42" font-size="13" text-anchor="middle" fill="#1f2a44">Task B</text>
  <rect x="30" y="100" width="80" height="34" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="122" font-size="13" text-anchor="middle" fill="#1f2a44">Lock X</text>
  <rect x="250" y="100" width="80" height="34" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="122" font-size="13" text-anchor="middle" fill="#1f2a44">Lock Y</text>
  <line x1="70" y1="100" x2="70" y2="58" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="70,54 65,64 75,64" fill="#1d6fd1"/>
  <text x="76" y="82" font-size="11" fill="#1d6fd1">held by</text>
  <line x1="290" y1="100" x2="290" y2="58" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="290,54 285,64 295,64" fill="#1d6fd1"/>
  <text x="296" y="82" font-size="11" fill="#1d6fd1">held by</text>
  <line x1="110" y1="50" x2="246" y2="108" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="250,110 238,110 243,101" fill="#b4232c"/>
  <line x1="250" y1="50" x2="114" y2="108" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="110,110 117,101 122,110" fill="#b4232c"/>
  <text x="180" y="68" font-size="11" fill="#b4232c" text-anchor="middle">waits for</text>
</svg>
```

The usual cure without ceilings is a rule that every task takes locks in the same agreed order.
:::

::: context testbed How JPL found it
A fault that appears once in a while in testing and never on demand is easy to blame on flaky hardware. On Mars, the resets kept coming, so the team ran an exact copy of the spacecraft in the lab with detailed event tracing switched on — a record of every task switch and lock. According to Reeves's account, it took many hours, but the reset happened on the ground copy, and the trace showed the inversion plainly.

The fix was to switch on inheritance for the mutex involved. A debugging interpreter the team had chosen to leave in the flight software let them make that change by radio. The lesson engineers took away: keep the tools that let you see inside a running system, even in flight.
:::
