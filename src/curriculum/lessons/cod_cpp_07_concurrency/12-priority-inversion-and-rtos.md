---
id: l12-priority-inversion-and-rtos
title: Priority inversion, Mars Pathfinder, and real-time operating systems
minutes: 21
covers:
  - Priority inversion and priority inheritance; the Mars Pathfinder case
  - "RTOS landscape: FreeRTOS, RTEMS, VxWorks, Linux PREEMPT_RT"
---

Picture a restaurant kitchen with one stove and a strict rule: whoever has the highest rank and is ready to cook gets the stove. The head chef outranks the sous-chef, who outranks the junior cook.

The junior cook is using the kitchen's only big pot. The head chef needs that pot, so she waits for the junior to finish and hand it over. That should take a minute. But now the sous-chef arrives with a long job that doesn't need the pot at all. He outranks the junior, so he takes the stove. The junior cannot finish, so the pot is never handed over, so the head chef waits. The most important person in the kitchen is now waiting for the sous-chef's whole job, a job that has nothing to do with her.

That upside-down situation is **priority inversion**: a high-priority task ends up waiting for a lower-priority one. Last lesson built schedules that assumed tasks never share anything. This lesson shows what goes wrong when they share a mutex, runs it live on Linux, fixes it with one line of setup, and tells the true story of a Mars lander that kept resetting itself because of it. Then it surveys the operating systems that flight software actually runs on.

## Three tasks and one mutex

Put the kitchen on a single processor with a preemptive, fixed-priority scheduler, the kind from last lesson. Three tasks:

- **High** (H): urgent, runs often, shares some data with Low through a mutex.
- **Medium** (M): does long work, never touches that mutex.
- **Low** (L): background work, sometimes locks the mutex for a short time.

Now the sequence that causes trouble:

1. L locks the mutex and starts its short piece of work.
2. H becomes ready. It preempts L, runs, and asks for the mutex. L holds it, so H blocks. L resumes.
3. M becomes ready. It outranks L, so it preempts L.
4. M runs for as long as it likes. L cannot run, so it cannot unlock. H cannot run, because it is waiting for the mutex.

Some waiting is unavoidable. If H needs data that L is halfway through changing, H must wait for L to finish; that is what the mutex is for. That wait is bounded: it lasts at most as long as L's **[[critical section|critical-section]]**, the stretch of code L runs while holding the lock. The disaster is step 4. H is now waiting on M, and M's run time has no connection to the mutex at all. With several medium tasks, the wait can go on and on. This is called **unbounded priority inversion**, and it breaks every schedule computed last lesson, because none of those numbers included "and sometimes the highest-priority task waits for the medium ones".

::: key Priority inversion and its fix
A high-priority task blocks on a mutex held by a low-priority task, which is itself preempted by a medium-priority task, so the high-priority task waits on the medium one indefinitely. The fix is **priority inheritance**: the holder temporarily runs at the priority of the highest waiter.
:::

## Watching it happen

Linux's `SCHED_FIFO` class (lesson 13 covers it fully) gives threads [[fixed priorities from 1 to 99|rt-throttle]]: the highest-priority ready thread always runs, and runs until it blocks or yields. The program below pins all three threads to one core, so they must take turns like tasks on a single-processor flight computer, and times how long H waits for the mutex.

The mutex is a POSIX `pthread_mutex_t`, not a `std::mutex`, because the setting we need is only available there. `pthread_mutexattr_setprotocol` picks how the mutex treats priorities: `PTHREAD_PRIO_NONE` does nothing special, `PTHREAD_PRIO_INHERIT` turns on priority inheritance. Wrapping it in a class with `lock()` and `unlock()` lets `std::lock_guard` use it.

::: example Priority inversion on Linux, with and without inheritance
```cpp laptop
// Priority inversion, live. Build: g++ -std=c++20 -O2 -pthread inversion.cpp
// Needs permission to use SCHED_FIFO (root, or CAP_SYS_NICE).
#include <pthread.h>
#include <sched.h>
#include <cstdio>
#include <ctime>
#include <mutex>
#include <thread>

// A mutex whose protocol we choose: PTHREAD_PRIO_NONE or PTHREAD_PRIO_INHERIT.
// It has lock() and unlock(), so std::lock_guard works with it.
class PosixMutex {
public:
    explicit PosixMutex(int protocol) {
        pthread_mutexattr_t attr;
        pthread_mutexattr_init(&attr);
        pthread_mutexattr_setprotocol(&attr, protocol);
        pthread_mutex_init(&m_, &attr);
        pthread_mutexattr_destroy(&attr);
    }
    ~PosixMutex() { pthread_mutex_destroy(&m_); }
    PosixMutex(const PosixMutex&) = delete;
    PosixMutex& operator=(const PosixMutex&) = delete;
    void lock() { pthread_mutex_lock(&m_); }
    void unlock() { pthread_mutex_unlock(&m_); }
private:
    pthread_mutex_t m_;
};

double now_ms() {
    timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1e3 + t.tv_nsec / 1e6;
}

// Burn this thread's own CPU time (not wall time) for ms milliseconds.
void work_ms(double ms) {
    auto cpu = [] { timespec t; clock_gettime(CLOCK_THREAD_CPUTIME_ID, &t);
                    return t.tv_sec * 1e3 + t.tv_nsec / 1e6; };
    const double end = cpu() + ms;
    while (cpu() < end) { }
}

void become_fifo(int priority) {
    sched_param p{};
    p.sched_priority = priority;
    if (pthread_setschedparam(pthread_self(), SCHED_FIFO, &p) != 0)
        std::puts("could not set SCHED_FIFO (need root or CAP_SYS_NICE)");
}

void sleep_until_ms(double t_ms) {
    timespec t;
    t.tv_sec = static_cast<time_t>(t_ms / 1e3);
    t.tv_nsec = static_cast<long>((t_ms - t.tv_sec * 1e3) * 1e6);
    clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &t, nullptr);
}

double run(int protocol) {
    PosixMutex bus(protocol);             // shared resource, like a data bus
    double high_waited = 0;
    const double t0 = now_ms() + 50;      // everyone starts relative to t0

    std::thread low([&] {                 // priority 10: holds the lock for 5 ms of work
        become_fifo(10);
        sleep_until_ms(t0);
        std::lock_guard<PosixMutex> g(bus);
        work_ms(5);
    });
    std::thread high([&] {                // priority 30: needs the lock at t0 + 1 ms
        become_fifo(30);
        sleep_until_ms(t0 + 1);
        const double asked = now_ms();
        std::lock_guard<PosixMutex> g(bus);
        high_waited = now_ms() - asked;
    });
    std::thread medium([&] {              // priority 20: 100 ms of work, never touches the lock
        become_fifo(20);
        sleep_until_ms(t0 + 2);
        work_ms(100);
    });
    low.join(); high.join(); medium.join();
    return high_waited;
}

int main() {
    cpu_set_t one;                        // put every thread on one core, like a
    CPU_ZERO(&one);                       // single-processor flight computer
    CPU_SET(3, &one);
    sched_setaffinity(0, sizeof one, &one);

    std::printf("PTHREAD_PRIO_NONE:    high task waited %6.1f ms\n", run(PTHREAD_PRIO_NONE));
    std::printf("PTHREAD_PRIO_INHERIT: high task waited %6.1f ms\n", run(PTHREAD_PRIO_INHERIT));
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -pthread` and run as root on the 4-core machine (all three threads confined to core 3). Three runs gave the same output to the tenth of a millisecond:

```text
PTHREAD_PRIO_NONE:    high task waited  104.2 ms
PTHREAD_PRIO_INHERIT: high task waited    4.1 ms
```

Follow the timeline for the first line, with times after $t_0$:

1. At 0 ms, L (priority 10) locks `bus` and starts 5 ms of work.
2. At 1 ms, H (30) wakes, preempts L, and asks for `bus`. L holds it, so H blocks. L has done about 1 ms of its work.
3. At 2 ms, M (20) wakes. It outranks L, so L stops with about 3 ms of work left, and M runs its full 100 ms.
4. At about 102 ms, M finishes. L runs its last 3 ms and unlocks at about 105 ms. H gets the mutex.
5. H waited from 1 ms to about 105 ms: 104 ms, matching the output. For all but 4 ms of that, the processor was running a *lower*-priority task that never touched the mutex.

Now the second line. At step 2, H blocks on a mutex whose protocol is `PTHREAD_PRIO_INHERIT`, so the kernel raises L to priority 30 while it holds the lock. At 2 ms, M (20) no longer outranks L, so L keeps running and unlocks at about 5 ms. H waited from 1 ms to 5 ms: the 4 ms of L's work that was left, plus a little overhead, 4.1 ms. Only then does M run.

Sanity check: 104.2 ms is M's 100 ms plus L's leftover 4 ms, and 4.1 ms is L's leftover alone. The difference, 100 ms, is exactly the medium task's run.
:::

### The two standard fixes

**Priority inheritance** is what [[the example turned on|pi-timeline]]: while a task holds a mutex that a higher-priority task is waiting for, the holder runs at the waiter's priority. When it unlocks, it drops back. The wait is now bounded by the critical section, the part that is unavoidable anyway.

**Priority ceiling** goes one step further. You give the mutex a **ceiling**, the priority of the highest task that ever locks it. Whoever locks the mutex is raised to the ceiling at once, before anyone has to wait. In POSIX this is the protocol `PTHREAD_PRIO_PROTECT`, with the ceiling set by one more call on the attribute:

```cpp
#include <pthread.h>

void make_ceiling_attr(pthread_mutexattr_t* attr) {
    pthread_mutexattr_init(attr);
    pthread_mutexattr_setprotocol(attr, PTHREAD_PRIO_PROTECT);
    pthread_mutexattr_setprioceiling(attr, 30);   // highest priority of any user
}
```

Adding this as a third run to the example printed `PTHREAD_PRIO_PROTECT: high task waited 0.0 ms`. Read that carefully: L ran at priority 30 from the moment it locked, so when H woke at 1 ms, it could not preempt a task of its own priority and did not run until L unlocked at about 5 ms. H's delay was about the same 4 ms; it moved from waiting *inside* `lock()` to waiting to be scheduled at all. The ceiling protocol's advantage is elsewhere: a task can be blocked at most once, by one critical section, per activation, and some patterns of deadlock become impossible. Its cost is that you must know every mutex's users at design time, which flight software usually does.

::: key
Priority inheritance (`PTHREAD_PRIO_INHERIT`): the holder is raised to the highest waiter's priority only while someone waits. Priority ceiling (`PTHREAD_PRIO_PROTECT` with `pthread_mutexattr_setprioceiling`): the holder is raised to the mutex's fixed ceiling as soon as it locks. Either one bounds a high-priority task's blocking by a lower task's critical section.
:::

::: warning `std::mutex` has no protocol setting
The C++ standard says nothing about priorities, so `std::mutex` cannot turn on inheritance. On Linux with glibc it is a plain `PTHREAD_PRIO_NONE` mutex. A real-time program shares data between priorities through its own wrapper around `pthread_mutex_t` created with `PTHREAD_PRIO_INHERIT` or `PTHREAD_PRIO_PROTECT`, as above, or avoids the mutex entirely with a lock-free queue like lesson 9's. And the setting must be on **every** mutex shared across priorities: one forgotten mutex is all it takes, as the next section shows.
:::

### Putting blocking back into the schedule

With inheritance in place, the time a task can lose to a lower-priority lock holder has a limit, called its **blocking time** $B_i$. Response-time analysis from last lesson grows one term:

$$
R_i = C_i + B_i + \sum_{j \in hp(i)} \left\lceil \frac{R_i}{T_j} \right\rceil C_j
$$

::: example Adding a shared mutex to last lesson's task set
Take last lesson's first task set: control ($C = 0.3$ ms, $T = 1$ ms), navigation ($C = 2$, $T = 10$), telemetry ($C = 15$, $T = 100$). Now control and telemetry share the vehicle state through one inheritance mutex, and telemetry holds it for at most 0.2 ms while copying the state.

**Control** can be blocked once by telemetry's critical section: $B_1 = 0.2$. So $R_1 = 0.3 + 0.2 = 0.5\,\mathrm{ms} \le 1$. Meets its deadline.

**Navigation** never locks the mutex, yet it can still be delayed: while telemetry holds the lock with control waiting, telemetry runs at control's priority, above navigation. So $B_2 = 0.2$ too. Iterating with control above it:

- start: $R = 2 + 0.2 + 0.3 = 2.5$
- control releases $\lceil 2.5/1 \rceil = 3$: $R = 2.2 + 0.9 = 3.1$
- $\lceil 3.1/1 \rceil = 4$: $R = 2.2 + 1.2 = 3.4$
- $\lceil 3.4/1 \rceil = 4$: $R = 3.4$, no change.

$R_2 = 3.4 \le 10$. Meets its deadline.

**Telemetry** is the lowest priority, so nothing below it can block it: $B_3 = 0$, and its response time is last lesson's 30 ms.

Sanity check: without inheritance there is no finite $B_1$ at all. Navigation's 2 ms could slip in while telemetry holds the lock and control waits, giving at least $0.3 + 0.2 + 2 = 2.5$ ms, and control would miss its 1 ms deadline: the inversion from the first example. These iterations were checked with python3.
:::

## The Mars Pathfinder resets

**[[Mars Pathfinder|pathfinder-mission]]** landed on Mars on 4 July 1997. A few days into the mission, the lander started resetting itself: the whole computer rebooted, again and again. The account below follows Glenn Reeves, who led the Pathfinder flight software team and wrote up [[what happened|reeves-account]] after the mission.

The flight computer ran the **VxWorks** real-time operating system. Many software tasks shared an **information bus**, a region of shared memory through which they passed data, and access to it was guarded by a mutex. Three tasks matter:

- a **bus management task**, high priority, which ran frequently to move data around the information bus;
- a **meteorological data task** (the ASI/MET task), low priority, which ran rarely and published its weather data through the bus, taking the mutex to do so;
- a **communications task**, medium priority, which ran for a long time.

Now you can see it coming. The meteorological task held the mutex. The bus management task blocked waiting for it. The communications task preempted the meteorological task and ran. The bus management task, the most urgent of the three, sat blocked. After a while a **[[watchdog|pathfinder-watchdog]]** check noticed that the bus management task had not completed on time, concluded something had gone badly wrong, and reset the computer.

The team reproduced the resets on an exact copy of the lander at JPL, with the operating system's tracing turned on, and the trace showed the inversion. The VxWorks mutex took an option at creation that turns priority inheritance on, and this one had been created with it off. The fix was to turn it on. A small patch uploaded to the lander changed that setting, and the resets stopped.

::: key What happened on Mars Pathfinder
A high-priority bus-management task blocked on a mutex held by a low-priority meteorological task while a medium-priority communications task ran, so a watchdog reset the lander repeatedly. The fix, uploaded in flight, was to enable priority inheritance on that mutex.
:::

It is worth noticing what saved the mission. The watchdog turned a silent hang into a reset, which is safe. The replica on the ground let the team reproduce the problem. The tracing let them see it. And the ability to change the software after launch let them fix it. Pathfinder is now a standard teaching example in real-time courses.

## Real-time operating systems

A **real-time operating system (RTOS)** is an operating system built so that its own timing is predictable: its scheduler is preemptive with fixed priorities, its system calls have bounded worst-case times, and its mutexes offer priority inheritance or ceilings. It gives you tasks, mutexes, semaphores, message queues and timers, and very little else. Four names cover most of what you will meet in aerospace.

**FreeRTOS.** A small, free, open-source kernel for **[[microcontrollers|microcontroller-word]]**, maintained by Amazon since 2017 and published under the MIT license. It is a handful of C files that you compile into your own program; there is no separate operating system to boot. Its mutexes include priority inheritance. It is common on small boards everywhere, including many cubesats.

**RTEMS**, the Real-Time Executive for Multiprocessor Systems. Free and open source, with support for POSIX threads, so code like this lesson's example can be ported to it. It has flown on many spacecraft, and it is one of the operating systems NASA's **[[core Flight System|cfs-osal]]** runs on.

**VxWorks.** A commercial RTOS from Wind River, used for decades in aerospace and defense. It ran Mars Pathfinder, and NASA's later Mars rovers Spirit, Opportunity and Curiosity use it too. In VxWorks, priority inheritance is the `SEM_INVERSION_SAFE` option when a mutex semaphore is created — the option Pathfinder's mutex was missing.

**Linux with PREEMPT_RT.** Ordinary Linux is built for throughput and fairness, and parts of the kernel cannot be interrupted, which makes long delays possible. The **[[PREEMPT_RT|preempt-rt]]** changes make almost all of the kernel preemptible, so a high-priority thread can take the processor within a bounded, short time. After being maintained outside the main kernel for about two decades, it was merged into mainline Linux in version 6.12, released in November 2024. Linux does not give the hard, small-kernel guarantees of an RTOS, but with careful setup it gives short, measurable worst-case latencies alongside everything else Linux offers: networking, file systems, drivers. That is why Linux, often with PREEMPT_RT, is used on computers with bigger processors; lesson 14's case study runs Linux on its flight computers.

| System | Kind | Typical home | Priority inheritance |
|---|---|---|---|
| FreeRTOS | Small open-source kernel, linked into your program | Microcontrollers, cubesats | Built into its mutexes |
| RTEMS | Open-source RTOS with POSIX support | Spacecraft flight computers | POSIX protocols |
| VxWorks | Commercial RTOS | Mars landers and rovers, avionics | `SEM_INVERSION_SAFE` |
| Linux + PREEMPT_RT | General-purpose kernel made preemptible | Larger flight and ground computers | `PTHREAD_PRIO_INHERIT` |

::: key
An RTOS offers predictable timing: preemptive fixed-priority scheduling, bounded system calls, priority-inheritance mutexes. FreeRTOS: small open-source kernel for microcontrollers. RTEMS: open-source RTOS used on many spacecraft. VxWorks: commercial RTOS on NASA's Mars rovers. Linux PREEMPT_RT: real-time Linux, in mainline since 6.12 (2024).
:::

The machine used in this module is not a real-time kernel. `uname -v` prints `#1 SMP PREEMPT_DYNAMIC`, the ordinary preemption model, and the file `/sys/kernel/realtime`, which a PREEMPT_RT kernel provides, does not exist. That is one more reason last lesson's jitter tail reached almost 3 ms, and the example above still behaved as the theory says, because the scheduling classes and priority inheritance work on any Linux kernel.

## Check yourself

::: check
Using the kitchen picture, say which cook plays H, M and L, what the mutex is, and what priority inheritance would change.
:::

::: answer
The head chef is H, the sous-chef is M, the junior cook is L, and the big pot is the mutex. Without inheritance, the sous-chef's long job keeps the junior off the stove, so the pot never comes back and the head chef waits for the whole job. With inheritance, as soon as the head chef waits for the pot, the junior cook temporarily gets the head chef's rank, so the sous-chef cannot take the stove; the junior finishes, hands over the pot, and drops back to junior rank.
:::

::: check
In the example, what would the output have been if the medium task ran for 300 ms of work instead of 100 ms?
:::

::: answer
Without inheritance, H waits for M's whole run plus L's remaining work: about $300 + 4 = 304$ ms. With inheritance, M never gets between L and H, so H waits only for L's leftover work, about 4.1 ms, the same as before. That is the difference between unbounded and bounded inversion: one grows with the medium task, the other does not.
:::

::: check
A team says: "We use priority inheritance, so our high-priority task can never be delayed by lower-priority tasks." What is wrong with that?
:::

::: answer
Inheritance bounds the delay; it does not remove it. The high-priority task still waits for the rest of the lower task's critical section, and with several mutexes it can be blocked once by each. That is why response-time analysis adds a blocking term $B_i$, and why critical sections must be kept short. Inheritance also does nothing about deadlock; lock ordering from lesson 4 is still needed.
:::

::: check
The Pathfinder mutex was held by the meteorological task and wanted by the bus management task. Why did a third task, the communications task, matter at all?
:::

::: answer
Because its priority sat between the two. It outranked the meteorological task that held the mutex, so it preempted that task, and the mutex could not be released while it ran. The bus management task stayed blocked for as long as the communications task ran, not merely for the meteorological task's short critical section. It never needed the mutex to cause the harm; being in the middle was enough.
:::

::: check
You are choosing an operating system for (a) a 3U cubesat's attitude controller on a small microcontroller with 256 KiB of memory and (b) a flight computer with a multicore processor that also needs networking and a file system. Which of this lesson's four fits each, and why?
:::

::: answer
(a) FreeRTOS: a small kernel compiled into the program, bounded timing, priority-inheritance mutexes, and it fits in a small microcontroller's memory. (b) Linux with PREEMPT_RT, or VxWorks if a commercial RTOS is preferred: the processor is large enough for a full operating system, Linux supplies networking and file systems, and PREEMPT_RT with the real-time setup of lesson 13 keeps worst-case latency short and measurable.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Priority inversion | High task waits for a lower one | Unbounded when a medium task preempts the lock holder |
| Priority inheritance | Holder runs at the highest waiter's priority | `PTHREAD_PRIO_INHERIT`; wait bounded by the critical section |
| Priority ceiling | Holder runs at the mutex's ceiling while it holds it | `PTHREAD_PRIO_PROTECT`, `pthread_mutexattr_setprioceiling` |
| Measured, one core | L holds 5 ms, M runs 100 ms | H waited 104.2 ms without inheritance, 4.1 ms with |
| Blocking time $B_i$ | Longest wait for lower tasks' critical sections | $R_i = C_i + B_i + \sum \lceil R_i/T_j \rceil C_j$ |
| Mars Pathfinder, 1997 | VxWorks; bus management (high), ASI/MET (low), communications (medium) | Watchdog resets; fixed by enabling priority inheritance in flight |
| FreeRTOS | Small open-source kernel | Microcontrollers; mutexes inherit priority |
| RTEMS | Open-source RTOS | Many spacecraft; runs NASA's cFS |
| VxWorks | Commercial RTOS | Mars Pathfinder and later rovers |
| Linux PREEMPT_RT | Preemptible Linux kernel | Mainline since 6.12 (November 2024) |

Next lesson turns ordinary Linux into a platform for a real-time task: `SCHED_FIFO` and its priorities, pinning a task to its own core, and `mlockall` to keep page faults out of the loop.

::: context critical-section The part done behind the lock
A critical section is the code between `lock()` and `unlock()`. Everything else in a task can overlap with other tasks; this part cannot, so its length is a delay handed to anyone who wants the same lock. A common flight-software habit: lock, copy the few values you need into local variables, unlock, and then do the slow work on the copy. A critical section measured in microseconds makes every blocking term in the schedule small.
:::

::: context rt-throttle Why real-time priorities need permission
A `SCHED_FIFO` thread runs until it blocks, so one stuck in a loop at high priority can freeze everything below it on that core, including your shell. Linux therefore lets only privileged processes (root, or ones granted `CAP_SYS_NICE` or a real-time limit) use these priorities. As a safety net it also, by default, holds real-time threads to 950,000 µs of every 1,000,000 µs; this machine's `/proc/sys/kernel/sched_rt_runtime_us` reads 950000. Designers of a real-time system decide deliberately whether to keep it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="304" height="28" fill="#1d6fd1"/>
  <rect x="324" y="30" width="16" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <text x="172" y="49" font-size="12" text-anchor="middle" fill="#fff">real-time threads: up to 950 ms</text>
  <text x="332" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">50 ms</text>
  <line x1="20" y1="68" x2="340" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="86" font-size="11" fill="#1f2a44">0</text>
  <text x="340" y="86" font-size="11" text-anchor="end" fill="#1f2a44">1 s</text>
  <text x="180" y="86" font-size="11" text-anchor="middle" fill="#6c7a93">each second, 50 ms stays for everything else</text>
</svg>
```
:::

::: context pi-timeline The example's two runs, drawn
The first 10 ms of each run, one core. Without inheritance (top), M takes the core at 2 ms and H stays blocked until M's 100 ms are done. With inheritance (bottom), L runs at H's priority from 1 ms, unlocks at about 5 ms, and H runs before M.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="4" y="16" font-size="11" fill="#1f2a44">PRIO_NONE</text>
  <rect x="40" y="24" width="30" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <rect x="70" y="24" width="4" height="20" fill="#b4232c"/>
  <rect x="74" y="24" width="26" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <rect x="100" y="24" width="240" height="20" fill="#1d6fd1"/>
  <text x="220" y="38" font-size="11" text-anchor="middle" fill="#fff">M runs 100 ms, H still blocked</text>
  <text x="4" y="86" font-size="11" fill="#1f2a44">PRIO_INHERIT</text>
  <rect x="40" y="94" width="30" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <rect x="70" y="94" width="4" height="20" fill="#b4232c"/>
  <rect x="74" y="94" width="120" height="20" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="134" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">L at H's priority</text>
  <rect x="194" y="94" width="6" height="20" fill="#b4232c"/>
  <rect x="200" y="94" width="140" height="20" fill="#1d6fd1"/>
  <text x="270" y="108" font-size="11" text-anchor="middle" fill="#fff">then M</text>
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="146">0</text><text x="70" y="146">1</text><text x="100" y="146">2</text><text x="190" y="146">5</text><text x="330" y="146">10 ms</text>
  </g>
  <text x="40" y="164" font-size="11" fill="#6c7a93">orange L, red H, blue M; 30 px per ms</text>
</svg>
```
:::

::: context pathfinder-mission A lander, a rover, and an airbag bounce
Mars Pathfinder was a NASA mission built by JPL: a lander that bounced to a stop on airbags, and Sojourner, the first wheeled rover on Mars. It was part of NASA's "faster, better, cheaper" era and landed in Ares Vallis. The lander relayed Sojourner's data to Earth, which is why a lander that kept rebooting was a problem for the whole mission.
:::

::: context reeves-account How the story became famous
In December 1997, Mike Jones circulated a summary of a talk given by David Wilner of Wind River, the company behind VxWorks, at the IEEE Real-Time Systems Symposium. Glenn Reeves replied with a detailed first-hand account from the flight software team. Together they are why this bug is known in such detail. The idea of priority inheritance itself had been set out formally in 1990 by Lui Sha, Ragunathan Rajkumar and John Lehoczky, in a paper that also introduced the priority ceiling protocol.
:::

::: context pathfinder-watchdog The timeline on the lander
The three Pathfinder tasks on one processor. The meteorological task (L) takes the mutex, the bus task (H) blocks on it, the communications task (M) runs, and the bus task misses its check.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="4" y="36" font-size="11" fill="#1f2a44">bus (H)</text>
  <text x="4" y="76" font-size="11" fill="#1f2a44">comms (M)</text>
  <text x="4" y="116" font-size="11" fill="#1f2a44">ASI/MET (L)</text>
  <rect x="80" y="104" width="30" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <rect x="110" y="24" width="12" height="20" fill="#b4232c"/>
  <rect x="122" y="28" width="178" height="12" fill="#fff" stroke="#b4232c" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="210" y="20" font-size="11" text-anchor="middle" fill="#b4232c">blocked on the mutex</text>
  <rect x="122" y="104" width="16" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <rect x="138" y="64" width="162" height="20" fill="#1d6fd1"/>
  <text x="219" y="78" font-size="11" text-anchor="middle" fill="#fff">comms runs</text>
  <line x1="80" y1="140" x2="350" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">L locks</text>
  <text x="150" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">H waits</text>
  <line x1="300" y1="14" x2="300" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <text x="318" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">reset</text>
</svg>
```

With inheritance on, L would run at H's priority from the moment H blocked, finish its short critical section before M could start, and hand the mutex to H.
:::

::: context microcontroller-word A whole computer on one chip
A microcontroller is a single chip holding a processor, its memory and its input-output hardware: timers, serial ports, converters for analog signals. Many have well under a megabyte of memory and no memory-management unit, so they cannot run Linux. They sit everywhere in a vehicle: in a reaction wheel, a valve driver, a sensor board. An RTOS for them must be tiny, which is what FreeRTOS was built for.
:::

::: context cfs-osal Write once, run on several kernels
NASA's core Flight System, cFS, reaches the operating system only through a thin layer called the OSAL, the Operating System Abstraction Layer. Flight applications call OSAL functions to create tasks, mutexes and queues, and the OSAL maps them to RTEMS, VxWorks or POSIX systems such as Linux. So the same application can be developed and tested on a Linux laptop and then flown on an RTOS, which is how many missions use it.
:::

::: context preempt-rt What the real-time patches change
PREEMPT_RT makes three big changes to the Linux kernel. Most of its internal spinlocks, which used to keep a core busy and unpreemptible, become sleeping locks with priority inheritance. Hardware interrupt handlers run mostly as ordinary kernel threads with priorities you can set, so a device's interrupt cannot delay a more important task. And the long unpreemptible stretches are broken up. The result is that the highest-priority thread gets the processor within a short, bounded time. A kernel built this way shows `PREEMPT_RT` in `uname -v`.
:::
