---
id: l06-real-time-linux
title: Real-time Linux, and why a flight program can run it
minutes: 22
covers:
  - "Real-time Linux: PREEMPT_RT, SCHED_FIFO and SCHED_DEADLINE, CPU isolation, IRQ affinity, mlockall"
  - Why a flight program can fly Linux at all, and what it has to switch off to do so
---

Think of a family kitchen at dinnertime. Everyone shares the stove, the sink and the counter. Things mostly get done, and everyone gets a fair turn. But if you need to take a pan off the heat at *exactly* the right second, a shared kitchen is a gamble. Someone is at the sink. Someone left the good pan in the dishwasher. Nobody is doing anything wrong — the kitchen is built for fairness, not for your one critical second.

A stock Linux kernel is that kitchen. The **kernel** is the core of the operating system: the part that decides which program runs, hands out memory, and talks to hardware. Linux is built to get a lot of work done, fairly, across an unpredictable mix of programs. That is exactly right for a laptop or a server, and exactly wrong for a control loop with a hard deadline.

And yet [[modern launch vehicles fly Linux|linux-in-space]]. Both are true because the Linux on a flight computer is not the stock kernel set up the ordinary way. It is a particular build, on particular hardware, with a long list of normal behavior switched off. This lesson goes through that list one mechanism at a time, because "why can it fly Linux?" only has an honest answer once you know what is no longer running.

## Why the stock kernel cannot give you a bound

There are three separate problems, all present before any real-time setup.

**Parts of the kernel cannot be interrupted.** Code holding a **[[spinlock|spinlock]]** (a kernel lock where a waiting processor spins in a tight loop instead of sleeping), or code running an interrupt handler, runs to the end on that core. It does not matter what else becomes ready in the meantime — even the most urgent thread in the system waits. How long those **non-preemptible regions** last is not a number the kernel publishes or limits by design. It is however long that code path happens to take.

**The default scheduler is fair, not urgent.** Ordinary threads run under a fair-share scheduler (for years the **[[Completely Fair Scheduler|fair-scheduler]]**, CFS). It aims to give every program its share over time. A "nice" value tilts the shares, but nothing in its design promises the most important thread a bounded wait the way lesson two's rate-monotonic assignment does.

**Virtual memory can stall anyone.** Any thread can hit a **[[page fault|page-fault]]** — it touches memory that is not in RAM right now, and the kernel has to go and get it. If the page was pushed out to storage to make room, the wait is set by the storage device, not by anything the scheduler controls.

A real-time priority on top of this kernel proves nothing: a priority only matters once the thread can run, and any of these three can keep it from running for a time nobody has bounded.

## PREEMPT_RT

The **PREEMPT_RT** patch set attacks the non-preemptible regions directly, by changing what they are made of. It was developed outside the main kernel for about twenty years and was merged into mainline Linux in version 6.12, in 2024; today it is a build option, `CONFIG_PREEMPT_RT`.

### Spinlocks become sleeping, inheriting locks

Most kernel spinlocks are converted into **sleeping, priority-inheriting locks**. A thread that would have spun, unstoppable, now blocks the way lesson four's mutexes block. And — this is what makes it a real fix rather than a new label — the kernel lock carries the very same priority-inheritance mechanism from lesson four. A low-priority thread holding a kernel lock is boosted the instant a higher-priority thread waits on it. The bounded-blocking argument that protected a user-level mutex now protects the kernel's own insides.

### Interrupt handlers become threads

Most **interrupt handlers** become **threaded**. On a stock kernel, a handler runs at an implied priority above every thread in the system, unstoppable, for however long it takes. Under PREEMPT_RT, each one becomes an ordinary schedulable kernel thread with a priority *you* assign. A low-priority device's interrupt can no longer hold off your control loop. You [[rank the interrupt threads|irq-ladder]] the same way lesson two ranked ordinary tasks: an urgent interrupt outranks an unimportant one, instead of every interrupt outranking every thread.

What is still non-preemptible after both changes is deliberately shortened and checked, down to a small core that can be bounded.

### The price

None of this is free. A context switch costs more than a short spin, and tracking inherited priorities takes bookkeeping, so a PREEMPT_RT kernel has measurably lower average throughput. That is exactly the trade lesson one asked you to want: a slightly slower average, for a worst case you can bound.

::: key
**What PREEMPT_RT changes**: kernel spinlocks become priority-inheriting sleeping mutexes, interrupt handlers become schedulable threads, and non-preemptible sections are shortened. Throughput goes down slightly; worst-case latency becomes bounded. That is the trade a control loop wants.
:::

## SCHED_FIFO and SCHED_DEADLINE

The **scheduling policy** — the rule for choosing among ready threads — is a separate choice. Linux offers two that map straight onto this module's theory.

### SCHED_FIFO: fixed priorities

**`SCHED_FIFO`** is a true fixed-priority class. The highest-priority ready `SCHED_FIFO` thread runs. There is no time-slicing among threads of the same priority: a thread runs until it blocks, gives up the processor, or a higher-priority thread becomes ready. ("FIFO" — first in, first out — describes how equal-priority threads take turns: in the order they became ready.)

This is lessons two and three's rate-monotonic or deadline-monotonic assignment, enforced by the kernel.

### SCHED_DEADLINE: earliest deadline first, with a budget

**`SCHED_DEADLINE`** implements earliest-deadline-first, exactly as in lesson two, with one addition. Each task declares a three-number reservation: `runtime`, `deadline` and `period` — "I need up to this much processor time, finished by this deadline, every this often". The kernel refuses to admit a new task unless the total stays within the processor:

$$
\sum_i \frac{\text{runtime}_i}{\text{period}_i} \;\le\; 1 .
$$

Read the $\sum$ as "add up, over every task $i$". It is lesson two's EDF test $U \le 1$, now checked by the kernel before the task may run. (By default Linux actually keeps $5\%$ of each processor back for ordinary work, so the real limit is $0.95$ per processor. The shape of the test is what matters.)

The addition is a **runtime budget**. If a task tries to run longer than its declared `runtime` within one period, the kernel **[[throttles|throttle-picture]]** it: the task is stopped until its next period begins. This is Linux's answer to lesson two's domino effect. An overrun stays with the task that caused it, instead of delaying whichever deadline comes next.

::: example An admission test you have already derived
Three tasks are proposed for `SCHED_DEADLINE`, each given as (runtime, period) in milliseconds, with deadline equal to period: $(2, 10)$, $(1, 5)$ and $(4, 20)$.

**Step 1 — each task's share of the processor:**

$$
\frac{2}{10} = 0.2, \qquad \frac{1}{5} = 0.2, \qquad \frac{4}{20} = 0.2 .
$$

**Step 2 — add them:** $U = 0.2 + 0.2 + 0.2 = 0.6$.

**Step 3 — compare:** $0.6 \le 1$, and also under the default $0.95$ cap, so the kernel admits all three.

**Why no more work is needed.** On one processor with deadlines equal to periods, EDF's $U \le 1$ is the *exact* condition, unlike the only-sufficient Liu–Layland bound. One addition proves this trio schedulable.

**Where they sit.** `SCHED_DEADLINE` tasks, whenever runnable, run ahead of every `SCHED_FIFO` and `SCHED_RR` thread, and those in turn run ahead of the default class, `SCHED_OTHER`. It is a strict ladder with the reservation-checked class on top.
:::

## CPU isolation, IRQ affinity and the rest of the checklist

The policy decides *which thread* runs. The next changes decide *what else can get in the way* on its core.

### Owning a core

Picture a highway with one lane reserved for ambulances. No ordinary car may drift into it. That is **CPU isolation**.

**`isolcpus`** (a kernel boot setting; the `cpuset` and `nohz_full` settings do related jobs) removes a core from the general scheduler's load balancing. The kernel never moves ordinary threads onto it to even out the work. Add **CPU affinity** — pinning your real-time thread to that core — and the isolated core runs only what you put there. No threads hop on, and no stranger disturbs its cache.

**IRQ affinity** does the same job for interrupts. By default an interrupt can land on any core, including the isolated one. So each interrupt's affinity mask is changed to keep it off that core. Now the isolated core is free of interrupt jitter as well as scheduler jitter.

Deep **[[power-saving states|c-states]]** (C-states) are switched off on that core. Waking from deep sleep takes real time, and a real-time core cannot pay that at unpredictable moments, so it stays awake and pays a steady power bill instead.

### Keeping memory in place

**`mlockall`** deals with virtual memory. It locks all of the program's pages into physical RAM, so the kernel can never push them out to storage, and brings every mapped page in right away. Its two flags:

- `MCL_CURRENT` locks the pages mapped now;
- `MCL_FUTURE` locks every page mapped from now on, too.

The second matters even for code that never allocates after start-up (lesson eight's rule), because the **stack** can still grow: a deep call chain on a rare branch can reach a new stack page long after start-up. `MCL_FUTURE` keeps that page locked in. But the *first* touch still makes the kernel find and zero a fresh page — a small, unplanned delay. So real-time programs also **pre-fault** the stack at start-up, touching the deepest stack they will ever need once, before the loop begins.

### Waking at the right instant

Finally, the loop's own timing call. Set an alarm "8 hours after I lie down", and since you always lie down a bit after waking, your wake-up time [[creeps later and later|drift-picture]]. Set it for 7:00 every day, and it does not.

**`clock_nanosleep` with `TIMER_ABSTIME`, against `CLOCK_MONOTONIC`,** sleeps until an absolute instant instead of for a duration measured from now. A relative sleep adds each cycle's running time and wake-up delay on top, so the period drifts longer; an absolute sleep holds it. `CLOCK_MONOTONIC` only ever moves forward steadily, while `CLOCK_REALTIME`, the wall clock, can be stepped by time synchronization and make the loop jump.

::: key
**Real-time Linux configuration checklist**: `SCHED_FIFO` with a chosen priority (or `SCHED_DEADLINE` with a reservation); `mlockall` with both flags, to prevent page faults; `isolcpus` plus CPU affinity to own a core; IRQ affinity moved off it; deep C-states disabled; `clock_nanosleep` with `TIMER_ABSTIME` against `CLOCK_MONOTONIC`, so error does not accumulate; and inside the loop, no allocation, no logging I/O, no unbounded locks.
:::

### The skeleton of a real-time loop

Here is the core of a $200\,\mathrm{Hz}$ loop with the in-program parts of the checklist. It compiles with `g++ -std=c++17` and runs; without administrator rights the scheduling call prints an error and the loop runs without the guarantee. Isolation, IRQ affinity and C-states are set outside the program, in boot and system settings.

```cpp
#include <sched.h>
#include <sys/mman.h>
#include <time.h>
#include <cstdio>

constexpr long kPeriodNs = 5'000'000;  // 5 ms, a 200 Hz loop
constexpr int kCycles = 200;           // one second, for the demo
long wake_error_ns[kCycles];           // log buffer made before the loop

int main() {
    // 1. Lock every page now and later: no page faults in the loop.
    if (mlockall(MCL_CURRENT | MCL_FUTURE) != 0) std::perror("mlockall");
    // 2. Fixed-priority real-time class (needs root or CAP_SYS_NICE).
    sched_param sp{};
    sp.sched_priority = 80;
    if (sched_setscheduler(0, SCHED_FIFO, &sp) != 0) std::perror("SCHED_FIFO");

    // 3. Absolute wake-ups on a clock that never jumps.
    timespec next{};
    clock_gettime(CLOCK_MONOTONIC, &next);
    for (int k = 0; k < kCycles; ++k) {
        next.tv_nsec += kPeriodNs;
        if (next.tv_nsec >= 1'000'000'000) { next.tv_nsec -= 1'000'000'000; ++next.tv_sec; }
        clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, nullptr);
        timespec now{};
        clock_gettime(CLOCK_MONOTONIC, &now);
        wake_error_ns[k] = (now.tv_sec - next.tv_sec) * 1'000'000'000L
                         + (now.tv_nsec - next.tv_nsec);
        // ... read sensors, run the control law, write actuators ...
    }
    long worst = 0;
    for (long e : wake_error_ns) if (e > worst) worst = e;
    std::printf("worst wake-up lateness: %ld us\n", worst / 1000);
    return 0;
}
// On an ordinary, untuned machine this printed:
//   worst wake-up lateness: 135 us
```

Inside the loop there is no `printf`, no allocation, no lock: it records each wake-up's lateness into an array made beforehand, and reports the **worst** lateness afterwards — not the average.

::: example What the checklist is worth, in published numbers
These figures were not measured for this lesson. They are the kind of result the real-time Linux community has published for years (the Linux Foundation's real-time documentation and the OSADL latency-monitoring farm among them), usually with a test program called **[[cyclictest|cyclictest]]**. Treat them as orders of magnitude, not a promise for any board.

| Configuration | Typical worst-case wake-up latency, under load |
| --- | --- |
| Stock kernel, ordinary priority | milliseconds, sometimes tens of milliseconds |
| PREEMPT_RT alone, no isolation | around a hundred microseconds |
| PREEMPT_RT with the full checklist | tens of microseconds or less |

**Reading it.** The first gap is the kernel patch. The second gap is the point of this lesson: a thread that shares its core with unrelated work and interrupts still picks up jitter from both.

**Sanity check against a period.** A $200\,\mathrm{Hz}$ loop has a $5\,\mathrm{ms}$ period. A few milliseconds of wake-up delay is a large fraction of that — far too much. A hundred microseconds is $0.1 / 5 = 2\%$ of the period. Tens of microseconds is well under $1\%$. So the checklist items are not optional polish on top of PREEMPT_RT: for a tight hard deadline, much of the achievable improvement lives in isolation and locked memory, not in the patch alone.
:::

## Why a flight program can fly Linux at all

The honest answer is narrow. The setup above turns "usually fast, sometimes very slow" into "bounded, and the bound is small enough".

Linux's rich features — mature drivers, the POSIX interface the team already knows, familiar tools, decades of tested libraries — do not earn it a place in a hard-real-time loop on their own. A great average with an unbounded tail is what lesson one ruled out. What earns Linux its place is that the tail can be made small and bounded on the cores set up this way. Once that is true, everything else it brings becomes a real advantage.

### What gets switched off

That bound is bought by switching real things off:

- **swap**, for the locked program — no page can be written out and faulted back in;
- **deep C-states**, on the isolated cores — power efficiency traded for wake-up time;
- the **load balancer**, on those cores — system-wide use traded for freedom from migration;
- **changing clock speed**, in many setups — one more source of execution-time variation;
- **every background service** and scheduled job that is not the flight application — removed from the image, or kept off the isolated cores.

A flight Linux image is not an everyday distribution with real-time flags turned on. It is deliberately minimal, built and frozen before launch.

### What it still is not

Even then, it is not a hard-real-time kernel the way a small purpose-built RTOS is by construction. A driver bug or a wrong affinity mask can quietly bring the jitter back.

What the checklist buys is a **carefully set-up slice** of the machine — the isolated cores running flight-critical tasks — behaving like a real-time system, while other cores run ordinary Linux for work that needs no guarantee: formatting data for the ground link, logging, diagnostics. **[[Partitioning by core|partition]]**, instead of converting the whole machine, is how one physical computer serves both needs at once. It is also why the isolation boundary must be verified continuously, not set once and trusted.

::: warning
Turning on PREEMPT_RT alone and calling the result "real-time" is the most common shortcut here, and the numbers above show what it leaves on the table. A `SCHED_FIFO` thread that migrates onto a non-isolated core, or shares its core with an interrupt still routed there, loses the guarantee silently. Nothing crashes. Nothing logs an error. The deadline is missed only now and then, under exactly the load conditions ground testing is least likely to reproduce.
:::

## Check yourself

::: check
A team turns on PREEMPT_RT, sets their control task to `SCHED_FIFO` at a high priority, and declares the loop real-time. What is missing, and roughly how much are they leaving on the table by stopping there?
:::

::: answer
Missing: CPU isolation and affinity, IRQ affinity moved off the real-time core, `mlockall` (with the stack pre-faulted), deep C-states disabled, and an absolute-time sleep — everything past the kernel patch and the scheduling policy.

PREEMPT_RT fixes the kernel's non-preemptible regions and makes the `SCHED_FIFO` priority mean something. But the task still shares its core with unrelated interrupts and threads, and can still take page faults. By this lesson's published figures, that is roughly the gap between "around a hundred microseconds" and "tens of microseconds or less" — much of the achievable improvement.
:::

::: check
Explain, in terms of what it changes in the kernel, why PREEMPT_RT's conversion of spinlocks matters for a real-time thread that never touches a spinlock itself.
:::

::: answer
A thread is delayed by a spinlock any time it needs the processor while some *other* code holds one. On a stock kernel, holding a spinlock switches off preemption on that core, so a real-time thread can be held up by kernel code it never called, for a time limited by nothing in particular.

Converting spinlocks to sleeping, priority-inheriting locks makes that code preemptible, and a holder that a higher-priority thread waits on is boosted as in lesson four. So the wait becomes bounded by a critical section's length instead of by some unrelated kernel operation.
:::

::: check
A `SCHED_DEADLINE` task with runtime $3\,\mathrm{ms}$ and period $10\,\mathrm{ms}$ asks to join an existing task with runtime $4\,\mathrm{ms}$ and period $8\,\mathrm{ms}$ on one processor. Is the new total admissible? And what does the kernel do differently from `SCHED_FIFO` if the new task tries to run for $5\,\mathrm{ms}$ in one period?
:::

::: answer
Add the shares: $3/10 = 0.3$ and $4/8 = 0.5$, so $U = 0.3 + 0.5 = 0.8$. That is under $1$, and under the default $0.95$ cap, so the pair is admitted.

If the new task then tries to run for $5\,\mathrm{ms}$ against its declared $3\,\mathrm{ms}$, `SCHED_DEADLINE` throttles it at the $3\,\mathrm{ms}$ mark: it stops until its next period starts.

A `SCHED_FIFO` thread has no budget: the same overrun keeps running at its fixed priority, delaying every lower-priority thread for as long as it lasts.
:::

::: check
Why does `mlockall` need to lock pages that are not mapped yet (`MCL_FUTURE`), when lesson eight will tell you flight code allocates nothing after start-up? And why do real-time programs pre-fault their stack as well?
:::

::: answer
Heap allocation is only one source of new pages. The stack is another: a deeper-than-usual call chain on a rare branch can reach a new stack page long after start-up, in code that allocates nothing.

`MCL_FUTURE` locks every page the program maps for the rest of its life, not only those mapped when `mlockall` was called, so that new stack page can never be pushed out to storage and faulted back in later.

But the first touch of a brand-new page still makes the kernel find and zero a page on the spot — a small, unplanned delay mid-loop. Pre-faulting the stack at start-up moves that cost to before the loop begins.
:::

::: check
A flight computer runs its attitude-control task on an isolated, PREEMPT_RT-tuned core, and its ground-communication formatting on another core of the same computer under the default scheduling policy. Is this a design flaw or a reasonable architecture — and what does it depend on to stay safe?
:::

::: answer
A reasonable and common architecture. Not every task needs a hard-real-time guarantee: a late telemetry packet is a soft-real-time problem, as lesson one distinguished. Forcing that work through the same discipline would spend effort and headroom for no benefit.

It depends on the partition holding. The isolated core's affinity, interrupt routing and memory locking must stay correct for the whole mission. Any change that lets ordinary work or an interrupt onto that core silently removes the guarantee, with no error anywhere obvious.
:::

## Summary

| Item | What it does |
| --- | --- |
| PREEMPT_RT | Most spinlocks become priority-inheriting sleeping locks; most interrupt handlers become threads; remaining non-preemptible sections shortened |
| `SCHED_FIFO` | Fixed-priority class; the highest-priority ready thread runs — rate/deadline-monotonic theory, enforced |
| `SCHED_DEADLINE` | EDF with a runtime budget; admission needs $\sum \text{runtime}_i/\text{period}_i \le 1$ (default cap $0.95$); overruns are throttled |
| `isolcpus` + affinity | Takes a core out of load balancing; pins the real-time thread to it |
| IRQ affinity | Moves interrupt handling off the isolated core |
| Deep C-states off | Avoids unpredictable wake-up delay from power saving |
| `mlockall(MCL_CURRENT \| MCL_FUTURE)` | Locks current and future pages in RAM; pre-fault the stack too |
| `clock_nanosleep(TIMER_ABSTIME, CLOCK_MONOTONIC)` | Sleeps to an absolute instant on a clock that never jumps; the period does not drift |
| Why Linux can fly | The bound made small enough by all of the above — not Linux's feature set on its own |
| What is switched off | Swap, deep C-states, load balancing and often clock-speed changes on the isolated cores; most background services everywhere |

The checklist bounds jitter and removes page faults from the hot loop. The next lesson takes on two more sources of trouble by name: the interrupt path itself, and the memory protection that decides what happens when a task's own code — not the kernel — is what goes wrong.

::: context linux-in-space Linux really does fly
SpaceX's software engineers have said in public question-and-answer sessions that the Falcon 9 and Dragon flight computers run Linux, on ordinary multi-core processors, with the flight software written in C++. Several computers run the same software side by side and cross-check each other, so one fault cannot steer the rocket alone.

NASA's Ingenuity helicopter, which flew on Mars from 2021 to 2024, also ran Linux, on a processor originally designed for smartphones. Both show the same idea: an off-the-shelf system, carefully constrained, instead of a custom one built from scratch.
:::

::: context spinlock Waiting by spinning
A **spinlock** is the simplest possible lock. A processor that wants it checks, again and again in a tight loop, "is it free yet?" — spinning — until it is. It never sleeps, so there is no cost of switching threads.

That is great when the lock is held for a few instructions. It is bad when held for long, because the spinning processor does no useful work. And on a stock kernel, a core holding a spinlock also refuses to be preempted, which is exactly what a real-time thread cannot live with.
:::

::: context fair-scheduler Fair is not the same as on time
The Completely Fair Scheduler, added in 2007, tracks how much processor time each thread has had and runs whichever has had the least. Over a second, everyone gets a fair share. In 2023, Linux 6.6 replaced it with a successor called EEVDF, built on a similar fairness idea.

Neither is designed to answer "will the most urgent thread run within $100\,\mu\mathrm{s}$?" That is why real-time threads use the separate `SCHED_FIFO` and `SCHED_DEADLINE` classes, which always run ahead of the fair ones.
:::

::: context page-fault When memory is not really there
Programs see a large, tidy **virtual** memory. The kernel quietly maps it, one **page** (usually $4\,\mathrm{KiB}$) at a time, onto real RAM. When a program touches a page that is not mapped right now, the processor stops it and calls the kernel: a **page fault**.

A **major** fault means the page was pushed out to storage and must be read back — milliseconds. A **minor** fault means the kernel only has to find a fresh page or fix a mapping — microseconds, but still unplanned.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">program's pages</text>
  <text x="200" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">RAM</text>
  <text x="310" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">storage</text>
  <rect x="30" y="26" width="60" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="30" y="52" width="60" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="30" y="78" width="60" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="170" y="26" width="60" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="170" y="52" width="60" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="280" y="78" width="60" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="37" x2="170" y2="37" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="90" y1="63" x2="170" y2="63" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="90" y1="89" x2="280" y2="89" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="185" y="120" font-size="11" text-anchor="middle" fill="#b4232c">touch this page: major fault, wait for storage</text>
</svg>
```

`mlockall` keeps every page in the RAM column.
:::

::: context irq-ladder Where interrupts sit, before and after
On a stock kernel (left), every interrupt handler runs above every thread, so even a trivial device can hold off the control loop. Under PREEMPT_RT (right), handlers become threads you can place anywhere in the priority ladder — the gyro's interrupt above the control loop, the logging disk's below it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">stock kernel</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">PREEMPT_RT</text>
  <rect x="20" y="26" width="140" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">all interrupt handlers</text>
  <rect x="20" y="58" width="140" height="26" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="75" font-size="11" text-anchor="middle" fill="#ffffff">control loop</text>
  <rect x="20" y="90" width="140" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="107" font-size="11" text-anchor="middle" fill="#1f2a44">other threads</text>
  <rect x="200" y="26" width="140" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">gyro interrupt thread</text>
  <rect x="200" y="58" width="140" height="26" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="75" font-size="11" text-anchor="middle" fill="#ffffff">control loop</text>
  <rect x="200" y="90" width="140" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="107" font-size="11" text-anchor="middle" fill="#1f2a44">disk interrupt thread</text>
  <rect x="200" y="122" width="140" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="139" font-size="11" text-anchor="middle" fill="#1f2a44">other threads</text>
  <text x="180" y="164" font-size="11" text-anchor="middle" fill="#6c7a93">higher priority at the top</text>
</svg>
```
:::

::: context throttle-picture A budget that runs out
A task declared runtime $3\,\mathrm{ms}$ every $10\,\mathrm{ms}$. This period it tries to run $5\,\mathrm{ms}$. The kernel lets it use its $3$, then stops it (red) until the next period starts at $10$, when the budget refills. Other tasks keep their time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="87" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <text x="73.5" y="46" font-size="11" text-anchor="middle" fill="#ffffff">runs 3 ms</text>
  <rect x="117" y="30" width="203" height="24" fill="#ffffff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="218.5" y="46" font-size="11" text-anchor="middle" fill="#b4232c">throttled until next period</text>
  <line x1="30" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="320" y1="22" x2="320" y2="76" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="88">0</text><text x="117" y="88">3</text><text x="320" y="88">10 ms</text>
  </g>
  <text x="320" y="16" font-size="11" text-anchor="middle" fill="#1f2a44">budget refills</text>
</svg>
```
:::

::: context c-states Why a sleeping processor is slow to wake
A modern processor saves power by shutting parts of itself down when it has nothing to do. These idle levels are numbered **C-states**: C0 is fully awake, and higher numbers are deeper sleep — clocks stopped, caches flushed, voltage cut. The deeper the sleep, the less power it uses, and the longer it takes to wake, anywhere from about a microsecond to hundreds of microseconds on some chips.

For a real-time core, that wake-up time lands exactly when an interrupt or timer needs it. So the core is kept in shallow states only, trading a little heat and power for a predictable response.
:::

::: context drift-picture Relative sleeps drift, absolute sleeps do not
Each cycle does some work (blue), then sleeps. A relative "sleep $5\,\mathrm{ms}$" starts counting only after the work, so every cycle comes out longer than $5\,\mathrm{ms}$ and the wake-ups slide later (red). An absolute "wake at $5$, $10$, $15$" lands on the grid every time (black ticks).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="20" y1="70" x2="20" y2="90"/><line x1="100" y1="70" x2="100" y2="90"/><line x1="180" y1="70" x2="180" y2="90"/><line x1="260" y1="70" x2="260" y2="90"/><line x1="340" y1="70" x2="340" y2="90"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="104">0</text><text x="100" y="104">5</text><text x="180" y="104">10</text><text x="260" y="104">15</text><text x="340" y="104">20 ms</text>
  </g>
  <rect x="20" y="30" width="16" height="16" fill="#1d6fd1"/>
  <rect x="116" y="30" width="16" height="16" fill="#1d6fd1"/>
  <rect x="212" y="30" width="16" height="16" fill="#1d6fd1"/>
  <rect x="308" y="30" width="16" height="16" fill="#1d6fd1"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="116" y1="24" x2="116" y2="56"/><line x1="212" y1="24" x2="212" y2="56"/><line x1="308" y1="24" x2="308" y2="56"/>
  </g>
  <text x="200" y="16" font-size="11" text-anchor="middle" fill="#b4232c">relative wake-ups: 6, 12, 18 ms</text>
</svg>
```

Here the work takes $1\,\mathrm{ms}$, so relative sleeps give a $6\,\mathrm{ms}$ period instead of $5$.
:::

::: context cyclictest How the numbers are measured
`cyclictest` is the standard tool for measuring real-time Linux. It starts threads that each sleep until an exact future time, over and over, and records how late each wake-up actually was. Run it for hours while the machine is kept busy — compiling software, copying files, flooding the network — and it prints the worst lateness it saw.

The exercise "A 200 Hz loop that actually holds 200 Hz" asks you to do the same thing with your own loop, and to report the maximum first, then the 99.9th percentile, then the spread — in that order of importance.
:::

::: context partition Two worlds in one box
Running urgent and non-urgent work on the same computer, kept apart, is called **mixed criticality**. Partitioning by core is the simplest way to keep them apart: each core belongs to one world.

It is not the only way. Some flight computers put a small, separate microcontroller next to the Linux computer for the very fastest loops, or run a **hypervisor** — a thin layer that splits one machine into walled-off virtual machines. Lesson ten comes back to where that boundary sits on a real vehicle.
:::
