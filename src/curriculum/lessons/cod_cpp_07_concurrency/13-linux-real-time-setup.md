---
id: l13-linux-real-time-setup
title: Setting up Linux for a real-time loop
minutes: 26
covers:
  - sched_setscheduler, SCHED_FIFO, CPU pinning, mlockall
---

Picture two ways of serving people. At a deli counter you take a number and everyone is served in turn. At a hospital emergency room, a nurse checks how urgent each person is, and the most urgent goes in first, every time, even if a sprained ankle has waited an hour.

Linux, out of the box, runs its threads like the deli counter. That is right for a laptop or a build server and wrong for a flight computer. A 1 kHz control loop does not want a fair share of the processor. It wants the processor the instant its millisecond comes round, and nothing to make it wait once it starts.

Lesson 11 said a control task is judged by its worst cycle, not its average. Lesson 12 surveyed the operating systems built for that promise, including Linux with PREEMPT_RT. SpaceX engineers have said publicly that their flight computers run Linux, so this lesson is the practical half: the calls that turn an ordinary Linux process into a real-time one. Choose the **scheduling policy** (who goes first). **Pin** the thread to a core (where it runs). **Lock** its memory (so nothing is fetched late). Keep the loop itself quiet. Then assemble all four into a 1 kHz loop and measure how late it wakes.

## How Linux chooses who runs

The **scheduler** is the part of the kernel that picks which ready thread gets each core. Every thread carries a **scheduling policy** — the rule the scheduler uses for it — and, for real-time policies, a **priority** number. Three policies matter.

**`SCHED_OTHER`** (read "sched other") is the default, the deli counter. It is a **[[fair-share scheduler|fair-share]]**: every runnable thread gets a slice of the core in proportion to its weight. The only knob is the **nice value**, from $-20$ to $19$. A higher nice value is "nicer" to others: it asks for a *smaller* share. Nice never lifts a thread out of the time-sharing crowd. `chrt -p` prints a thread's policy, and field 19 of `/proc/<pid>/stat` is its nice value:

```text
$ nice -n 19 sh -c 'chrt -p $$; cut -d" " -f19 /proc/$$/stat'
pid 20907's current scheduling policy: SCHED_OTHER
pid 20907's current scheduling priority: 0
19
```

Still `SCHED_OTHER`, now with nice 19: *less* urgent, the opposite of what a control loop needs.

**`SCHED_FIFO`** ("sched fife-oh", first in, first out) is the emergency room. Each thread gets a priority from $1$ to $99$; higher means more urgent. The rules:

1. Any runnable `SCHED_FIFO` or `SCHED_RR` thread runs before every `SCHED_OTHER` thread, whatever their nice values.
2. Among real-time threads, the highest priority that is ready runs.
3. A `SCHED_FIFO` thread keeps its core until it blocks (sleeps, waits on a lock, waits for I/O), gives it up with `sched_yield`, or a higher-priority thread becomes ready. There is no time slice.
4. Threads of equal priority queue up in the order they became ready — first in, first out.

**`SCHED_RR`** ("round robin") is `SCHED_FIFO` with one change: threads of *equal* priority take turns, each getting a time slice (100 ms here; `/proc/sys/kernel/sched_rr_timeslice_ms` prints `100`). `chrt -m` prints each policy's priority range:

```text
$ chrt -m
SCHED_OTHER min/max priority : 0/0
SCHED_FIFO min/max priority : 1/99
SCHED_RR min/max priority : 1/99
SCHED_BATCH min/max priority : 0/0
SCHED_IDLE min/max priority : 0/0
SCHED_DEADLINE min/max priority : 0/0
```

::: key Linux scheduling policies
`SCHED_OTHER`: default time-sharing, shares weighted by nice ($-20$ most favored, $19$ least). `SCHED_FIFO`: priority $1$–$99$, higher wins, runs until it blocks, yields or is preempted. `SCHED_RR`: the same plus a time slice among equal priorities. Every runnable real-time thread outranks every `SCHED_OTHER` thread. Raising nice lowers a share; it never makes a thread real time.
:::

Lesson 11's rate-monotonic rule plugs straight in: the fastest periodic task gets the highest `SCHED_FIFO` priority, and so on down. The kernel has **[[its own FIFO threads|kernel-rt-threads]]** too (`ps -eLo cls,rtprio,comm` lists them), so choose your priority on purpose.

::: warning A FIFO thread that never sleeps takes the core away
A `SCHED_FIFO` thread stuck in a loop that never blocks starves every lower-priority thread on its core, including the shell you would kill it from. Linux's safety net: `sched_rt_runtime_us` is `950000` and `sched_rt_period_us` is `1000000` (in `/proc/sys/kernel/`), so real-time threads get at most 0.95 s of each second. That is a seat belt, not a design. A real-time loop must sleep every cycle.
:::

## Asking for SCHED_FIFO

Two **[[POSIX|posix-name]]** calls change a thread's policy.

```cpp
#include <pthread.h>
#include <sched.h>

sched_param sp{};
sp.sched_priority = 80;

// Form 1: returns -1 and sets errno on failure. pid 0 means "the caller".
int r1 = sched_setscheduler(0, SCHED_FIFO, &sp);

// Form 2: returns 0, or the error number itself (it does not set errno).
int r2 = pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
```

Read `&sp` as "the address of sp". On Linux, scheduling belongs to each **thread**, so `sched_setscheduler(0, …)` changes only the calling thread. For a `std::thread t` from lesson 1, `t.native_handle()` gives the `pthread_t`.

A real-time thread can lock up a core, so Linux allows it only with one of two permissions:

- the **[[capability|linux-capabilities]]** `CAP_SYS_NICE`, which root has; or
- a nonzero **`RLIMIT_RTPRIO`**, a resource limit meaning "may use real-time priorities up to this number". It is usually 0 for ordinary users; systems raise it with a line such as `@realtime - rtprio 99` in `/etc/security/limits.conf`.

::: example Asking for SCHED_FIFO, with and without permission
This program reads its limit, asks for `SCHED_FIFO` at priority 80, reports what it got, and then locks its memory (a later section of this lesson explains `mlockall`).

```cpp laptop
#include <cerrno>
#include <cstdio>
#include <cstring>
#include <sched.h>
#include <sys/mman.h>
#include <sys/resource.h>

const char* policy_name(int p) {
    switch (p) {
        case SCHED_OTHER: return "SCHED_OTHER";
        case SCHED_FIFO:  return "SCHED_FIFO";
        case SCHED_RR:    return "SCHED_RR";
        default:          return "other";
    }
}

int main() {
    rlimit rt{};
    getrlimit(RLIMIT_RTPRIO, &rt);
    std::printf("RLIMIT_RTPRIO soft limit: %lu\n", (unsigned long)rt.rlim_cur);
    std::printf("FIFO priority range: %d..%d\n",
                sched_get_priority_min(SCHED_FIFO), sched_get_priority_max(SCHED_FIFO));
    std::printf("before: %s\n", policy_name(sched_getscheduler(0)));

    sched_param sp{};
    sp.sched_priority = 80;
    if (sched_setscheduler(0, SCHED_FIFO, &sp) == -1)
        std::printf("sched_setscheduler: %s (errno %d)\n", std::strerror(errno), errno);
    std::printf("after:  %s, priority %d\n", policy_name(sched_getscheduler(0)),
                (sched_getparam(0, &sp), sp.sched_priority));

    if (mlockall(MCL_CURRENT | MCL_FUTURE) == -1)
        std::printf("mlockall: %s (errno %d)\n", std::strerror(errno), errno);
    else
        std::printf("mlockall: ok\n");
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, run as root and then as the unprivileged user `nobody` (`setpriv --reuid=65534 --regid=65534 --clear-groups ./ex1`):

```text
--- as root
RLIMIT_RTPRIO soft limit: 0
FIFO priority range: 1..99
before: SCHED_OTHER
after:  SCHED_FIFO, priority 80
mlockall: ok
--- as nobody
RLIMIT_RTPRIO soft limit: 0
FIFO priority range: 1..99
before: SCHED_OTHER
sched_setscheduler: Operation not permitted (errno 1)
after:  SCHED_OTHER, priority 0
mlockall: ok
```

Step by step:

1. Both runs have `RLIMIT_RTPRIO` 0.
2. Root succeeds anyway: it holds `CAP_SYS_NICE`, which overrides the limit.
3. `nobody` has neither, so the call fails with `EPERM`, "Operation not permitted", errno 1.
4. Root cannot raise the limit for `nobody` here: `ulimit -r 50` fails with `Operation not permitted`, because this sandboxed VM's *hard* limit is 0. On your own Linux box the `limits.conf` line does it.
5. `mlockall` works for both, because this small program fits in the memory-lock limit (8192 KiB, from `ulimit -l`).

Sanity check: after the failure the thread is still `SCHED_OTHER`. Failure is safe but silent; a program that ignores the return value runs as an ordinary thread and shows it only as missed deadlines.
:::

::: warning Check every return value, and the thread-attribute trap
Check the return value and stop if you did not get the policy you asked for. And if you set the policy on a `pthread_attr_t` before creating a thread, also call `pthread_attr_setinheritsched(&attr, PTHREAD_EXPLICIT_SCHED)`. Without it the new thread inherits its creator's policy and your attribute is ignored, with no error.
:::

## Pinning a thread to a core

Lesson 10 showed each core caches what it used, so a thread moved to another core starts cold. A thread that always runs on one core stays warm and knows who it competes with.

A **CPU affinity mask** is the set of cores a thread may run on. Setting it to one core **pins** the thread there:

```cpp
#include <pthread.h>
#include <sched.h>

cpu_set_t set;
CPU_ZERO(&set);          // start with no cores
CPU_SET(3, &set);        // allow core 3 only

// Either the process-level call (pid 0 = calling thread)...
sched_setaffinity(0, sizeof set, &set);
// ...or the pthread form, which names the thread and returns an error number.
pthread_setaffinity_np(pthread_self(), sizeof set, &set);
```

The `_np` means **[[non-portable|np-suffix]]**: a glibc extension, not POSIX. From the shell, `taskset -c 3 ./loop` starts a program pinned to core 3, and `sched_getcpu()` tells a thread where it is.

Pinning keeps your thread on core 3; it does not keep *other* threads off it. For that, Linux has options on the **[[kernel command line|kernel-cmdline]]**:

- `isolcpus=3` removes core 3 from normal load balancing, so only threads pinned there run there.
- `nohz_full=3` stops the periodic scheduler tick on that core while one thread runs.
- Interrupts are steered to other cores through `/proc/irq/<n>/smp_affinity`.

A typical layout: cores 0–2 for housekeeping and telemetry, core 3 isolated for the control loop.

## Keeping memory in place: mlockall

A library picture: the books you use are on your desk, the rest downstairs. Reach for one that is not on the desk and you wait while it is fetched — at a moment you do not choose.

Linux memory works the same way. A program sees memory in 4 KiB **pages**. The kernel gives a page real memory only when it is first touched, and may take memory back from pages unused for a while. Touching a page with no memory behind it stops the thread while the kernel fixes it up: a **[[page fault|page-fault]]**. A **minor fault** needs only a zeroed page or one already in RAM: microseconds. A **major fault** reads from disk: milliseconds.

The fix is `mlockall`. Its flags are joined with `|`, read "bitwise or", meaning "both":

```cpp
#include <sys/mman.h>

mlockall(MCL_CURRENT | MCL_FUTURE);
```

`MCL_CURRENT` locks every page mapped now; `MCL_FUTURE`, every page mapped later. A locked page gets real memory at once and is never taken back. It needs `CAP_IPC_LOCK` or a large enough `RLIMIT_MEMLOCK`.

::: example Watching page faults move out of the loop
This program counts minor page faults with `getrusage` while it writes one byte into each page of a fresh 4 MiB buffer, twice. Given any argument, it calls `mlockall` first.

```cpp laptop
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <sys/mman.h>
#include <sys/resource.h>

long minor_faults() {
    rusage ru{};
    getrusage(RUSAGE_SELF, &ru);
    return ru.ru_minflt;
}

constexpr std::size_t kBytes = 4 * 1024 * 1024;   // 4 MiB = 1024 pages of 4 KiB

// Write one byte in every 4 KiB page; return faults taken and time used.
void touch(const char* label, volatile char* p) {
    long f0 = minor_faults();
    auto t0 = std::chrono::steady_clock::now();
    for (std::size_t i = 0; i < kBytes; i += 4096) p[i] = 1;
    auto t1 = std::chrono::steady_clock::now();
    long us = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count();
    std::printf("%-28s %5ld faults, %5ld us\n", label, minor_faults() - f0, us);
}

int main(int argc, char**) {
    bool lock = argc > 1;
    if (lock && mlockall(MCL_CURRENT | MCL_FUTURE) != 0) { std::perror("mlockall"); return 1; }
    std::printf("mlockall: %s\n", lock ? "yes" : "no");

    long f0 = minor_faults();
    char* buf = static_cast<char*>(std::malloc(kBytes));
    std::printf("%-28s %5ld faults\n", "malloc(4 MiB) itself:", minor_faults() - f0);

    touch("first pass over the buffer:", buf);
    touch("second pass:", buf);
    std::free(buf);
}
```

One run each way, on one machine (4 cores, `nproc` prints `4`):

```text
mlockall: no
malloc(4 MiB) itself:            1 faults
first pass over the buffer:   1025 faults,  1757 us
second pass:                     0 faults,    16 us
mlockall: yes
malloc(4 MiB) itself:         1025 faults
first pass over the buffer:      1 faults,    11 us
second pass:                     0 faults,     5 us
```

Reading it:

1. Without the lock, `malloc` returns addresses but no memory. The first pass faults on every page, 1025 times, costing about 1.8 ms: $1757 / 1024 \approx 1.7$ microseconds a page. The second pass, same work, takes 16 microseconds.
2. With `MCL_FUTURE`, the *allocation* takes the 1025 faults, and the passes run with almost none. (The one stray fault is not a buffer page, since all 1024 were present.)
3. Three runs each way gave the same fault counts, and first passes of 1.5 to 1.8 ms. Your times will differ.

Sanity check: $4 \times 1024 \times 1024 / 4096 = 1024$ pages, and the counts are 1024 plus one. The cost did not vanish; it moved from the loop into start-up, which is where you want it. And these were *minor* faults. One major fault would cost a whole control period.
:::

::: key What does mlockall buy a real-time process?
`mlockall(MCL_CURRENT | MCL_FUTURE)` pins the process pages in physical memory so a page fault cannot introduce a multi-millisecond stall at the worst moment. Paired with `SCHED_FIFO` and CPU pinning, it is the standard Linux real-time setup.
:::

Two gaps remain. The **stack** exists only as deep as the program has been, so a function going deeper for the first time mid-flight still faults. At start-up, call a function with a big local array and write to every page of it: **pre-faulting the stack**. And any heap memory the loop needs must be allocated, and touched, during initialization.

::: warning MCL_FUTURE makes large later allocations fail
With `MCL_FUTURE`, every new mapping must fit the memory-lock limit. Without `CAP_IPC_LOCK`, going past `RLIMIT_MEMLOCK` (8192 KiB here) makes `malloc` return null or `new` throw `std::bad_alloc`. One more reason to allocate everything up front.
:::

## A quiet hot path

The **hot path** is the code that runs every cycle: read sensors, run the control law, write actuators. Policy, pinning and locked memory make it *start* on time. They do nothing about code inside it that sometimes takes a hundred times longer than usual — sources of **non-determinism** in time. There is a standard list.

::: key Five sources of non-determinism to remove from a hot path
Heap allocation, exceptions, RTTI and `dynamic_cast`, unbounded loops and recursion, and I/O. Add virtual dispatch and `std::string` when you are being strict.
:::

Why each is on it:

- **Heap allocation.** `new` and `malloc` search free lists, may take a lock a lower-priority thread holds (lesson 12's priority inversion), and may ask the kernel for pages. No useful upper bound.
- **Exceptions.** A throw unwinds the stack through tables and allocates the exception object. Hard to bound.
- **RTTI and `dynamic_cast`.** A `dynamic_cast` may search the class hierarchy at run time.
- **Unbounded loops and recursion.** "Loop until converged" has no worst case you can write down.
- **I/O.** A `printf` or a socket send can block as long as the device or kernel likes.
- **Virtual dispatch** (strict list) is an indirect jump that may miss the cache. **`std::string`** hides allocation behind code like `+`.

You cannot see an allocation by reading code, but you can *catch* every one. C++ lets a program replace the global `operator new`, the function every `new` expression calls for memory. Replace it with one that counts, and aborts when a flag says "no allocation now". Exercise cpp07_ex2 asks you to build exactly this.

::: example Counting allocations in a control step
"Before" averages the last 8 gyro samples in a `std::vector` and builds a status `std::string`; "after" uses a `std::array` and a fixed `char` buffer.

```cpp
#include <array>
#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <new>
#include <string>
#include <vector>

std::atomic<long> g_allocs{0};
std::atomic<bool> g_forbid{false};

void* operator new(std::size_t n) {
    g_allocs.fetch_add(1, std::memory_order_relaxed);
    if (g_forbid.load(std::memory_order_relaxed)) {
        std::fputs("allocation in a no-allocation region\n", stderr);
        std::abort();
    }
    void* p = std::malloc(n);
    if (!p) std::abort();
    return p;
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

// Before: a moving average over the last 8 gyro samples, plus a status label.
double step_before(double gyro, std::string& status) {
    static std::vector<double> window;            // grows on the heap
    window.push_back(gyro);
    if (window.size() > 8) window.erase(window.begin());
    double sum = 0;
    for (double w : window) sum += w;
    status = "rate loop nominal, window " + std::to_string(window.size());
    return sum / window.size();
}

// After: the same result with fixed-capacity storage.
struct RateFilter {
    std::array<double, 8> window{};
    std::size_t next = 0, count = 0;
    std::array<char, 48> status{};

    double step(double gyro) {
        window[next] = gyro;
        next = (next + 1) % window.size();
        if (count < window.size()) ++count;
        double sum = 0;
        for (std::size_t i = 0; i < count; ++i) sum += window[i];
        std::snprintf(status.data(), status.size(), "rate loop nominal, window %zu", count);
        return sum / count;
    }
};

int main() {
    std::string status;
    long before = g_allocs.load();
    double a = 0;
    for (int i = 0; i < 1000; ++i) a = step_before(0.001 * i, status);
    std::printf("before: %ld allocations in 1000 steps, out %.4f, \"%s\"\n",
                g_allocs.load() - before, a, status.c_str());

    RateFilter f;                                  // initialisation happens here
    before = g_allocs.load();
    g_forbid.store(true);                          // from now on, any new aborts
    double b = 0;
    for (int i = 0; i < 1000; ++i) b = f.step(0.001 * i);
    g_forbid.store(false);
    std::printf("after:  %ld allocations in 1000 steps, out %.4f, \"%s\"\n",
                g_allocs.load() - before, b, f.status.data());
}
```

Output, built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
before: 1005 allocations in 1000 steps, out 0.9955, "rate loop nominal, window 8"
after:  0 allocations in 1000 steps, out 0.9955, "rate loop nominal, window 8"
```

Where the 1005 came from: the vector grew its capacity to 1, 2, 4, 8, then 16 at the ninth sample — 5 allocations — and never again, since `erase` keeps capacity. The string allocated once per step, 1000 times: 26 characters is too long for its small built-in buffer. $5 + 1000 = 1005$.

The fixed version ran with the trap armed, so one allocation would have stopped the program: it provably allocated nothing. Sanity check: both print 0.9955, and the average of the last eight inputs, $0.992$ to $0.999$, is $(0.992 + 0.999)/2 = 0.9955$.
:::

Add one call to `step_before` inside the armed region and the trap fires:

```text
allocation in a no-allocation region
Aborted
```

with exit status 134, the `SIGABRT` status lesson 1 taught you to read.

::: warning Short strings hide allocations, and abort hides output
g++'s `std::string` keeps up to 15 characters inside the object, with no allocation, so a test with short labels reports zero and the first long label in flight allocates. Test with the longest text possible. And `std::abort` does not flush `stdout`: piped `printf` lines just before it can vanish. That is why the trap writes to unbuffered `stderr`.
:::

The array form `new[]` calls `operator new` by default, so it is caught too. Direct `malloc` calls and the aligned `new` forms taking `std::align_val_t` are not; a strict build replaces those as well.

## Putting it together: a 1 kHz loop

A loop that works and then sleeps 1 ms runs slower than 1 kHz, because the work and the wake-up delay add to the sleep, cycle after cycle: **[[drift|sleep-drift]]**. The cure is to sleep until an *absolute* time on a fixed grid: now plus 1 ms, then that plus 1 ms, whatever happened in between.

The call is `clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, nullptr)`, read "sleep until time `next` on the monotonic clock". `TIMER_ABSTIME` makes `next` an absolute time. `CLOCK_MONOTONIC` only moves forward at a steady rate; the wall clock, `CLOCK_REALTIME`, can jump when the time is corrected.

::: example A complete real-time loop skeleton, measured
Everything in this lesson: lock memory, pre-fault the stack, pin to core 3, ask for `SCHED_FIFO` 80 (only when given an argument, to compare), arm the allocation trap, and run 5000 cycles of 1 ms, recording how late each wake-up was. All output comes after the loop.

```cpp laptop
// A 1 kHz control-loop skeleton for Linux: set up, then run with no
// allocation, no I/O and no page faults inside the loop.
#include <algorithm>
#include <array>
#include <atomic>
#include <cerrno>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <new>
#include <pthread.h>
#include <sched.h>
#include <sys/mman.h>
#include <sys/resource.h>

std::atomic<long> g_allocs{0};
std::atomic<bool> g_forbid{false};
void* operator new(std::size_t n) {
    g_allocs.fetch_add(1, std::memory_order_relaxed);
    if (g_forbid.load(std::memory_order_relaxed)) std::abort();
    void* p = std::malloc(n);
    if (!p) std::abort();
    return p;
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

constexpr long kPeriodNs = 1'000'000;        // 1 ms: a 1 kHz loop
constexpr int  kCycles   = 5000;             // 5 seconds
constexpr int  kCpu      = 3;                // the core we pin to
constexpr int  kPriority = 80;               // SCHED_FIFO priority, 1..99

std::array<long, kCycles> g_late_ns;         // static storage: no heap

void add_ns(timespec& t, long ns) {
    t.tv_nsec += ns;
    while (t.tv_nsec >= 1'000'000'000) { t.tv_nsec -= 1'000'000'000; ++t.tv_sec; }
}
long diff_ns(const timespec& a, const timespec& b) {    // a - b
    return (a.tv_sec - b.tv_sec) * 1'000'000'000L + (a.tv_nsec - b.tv_nsec);
}

// Touch 256 KiB of stack now, so the loop never faults a stack page in.
void prefault_stack() {
    volatile unsigned char dummy[256 * 1024];
    for (std::size_t i = 0; i < sizeof dummy; i += 4096) dummy[i] = 0;
}

void setup_realtime(bool want_rt) {
    if (mlockall(MCL_CURRENT | MCL_FUTURE) != 0)
        std::printf("mlockall failed: %s\n", std::strerror(errno));
    prefault_stack();

    cpu_set_t set;
    CPU_ZERO(&set);
    CPU_SET(kCpu, &set);
    int rc = pthread_setaffinity_np(pthread_self(), sizeof set, &set);
    if (rc != 0) std::printf("affinity failed: %s\n", std::strerror(rc));

    if (want_rt) {
        sched_param sp{};
        sp.sched_priority = kPriority;
        rc = pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
        if (rc != 0) std::printf("SCHED_FIFO failed: %s\n", std::strerror(rc));
    }
}

double control_law(double x) { return -0.8 * x; }   // stand-in for the real work

int main(int argc, char**) {
    const bool want_rt = argc > 1;
    setup_realtime(want_rt);
    int policy; sched_param sp{};
    pthread_getschedparam(pthread_self(), &policy, &sp);
    std::printf("policy %s, priority %d, cpu %d\n",
                policy == SCHED_FIFO ? "SCHED_FIFO" : "SCHED_OTHER", sp.sched_priority, sched_getcpu());

    double state = 1.0;
    const long allocs_before = g_allocs.load();
    g_forbid.store(true);                          // ---- hot path starts ----

    timespec next;
    clock_gettime(CLOCK_MONOTONIC, &next);
    for (int i = 0; i < kCycles; ++i) {
        add_ns(next, kPeriodNs);                   // the deadline grid, never drifts
        clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, nullptr);
        timespec now;
        clock_gettime(CLOCK_MONOTONIC, &now);
        g_late_ns[i] = diff_ns(now, next);         // how late did we wake?
        state = state + 0.001 * control_law(state);
    }

    g_forbid.store(false);                         // ---- hot path ends ----
    std::sort(g_late_ns.begin(), g_late_ns.end());
    long sum = 0;
    for (long v : g_late_ns) sum += v;
    std::printf("allocations in loop: %ld\n", g_allocs.load() - allocs_before);
    std::printf("wake-up lateness over %d cycles: mean %ld us, p99 %ld us, p99.9 %ld us, max %ld us\n",
                kCycles, sum / kCycles / 1000, g_late_ns[kCycles * 99 / 100] / 1000,
                g_late_ns[kCycles * 999 / 1000] / 1000, g_late_ns.back() / 1000);
    long missed = 0;
    for (long v : g_late_ns) if (v > kPeriodNs / 2) ++missed;
    std::printf("cycles woken more than half a period late: %ld\n", missed);
    std::printf("state after %d steps: %.6f\n", kCycles, state);
}
```

Run as root on one machine: 4 cores, a virtual machine, a stock kernel (not PREEMPT_RT), no `isolcpus`, with four busy loops in the background so the loop had to compete. `./loop` stays `SCHED_OTHER`; `./loop rt` asks for `SCHED_FIFO`:

```text
policy SCHED_OTHER, priority 0, cpu 3
allocations in loop: 0
wake-up lateness over 5000 cycles: mean 79 us, p99 92 us, p99.9 3657 us, max 4204 us
cycles woken more than half a period late: 29
state after 5000 steps: 0.018286
policy SCHED_FIFO, priority 80, cpu 3
allocations in loop: 0
wake-up lateness over 5000 cycles: mean 19 us, p99 35 us, p99.9 93 us, max 480 us
cycles woken more than half a period late: 0
state after 5000 steps: 0.018286
```

What the numbers say:

1. Zero allocations in both loops, with the trap armed.
2. `SCHED_OTHER`: mean lateness 79 microseconds, p99 92 — harmless-looking. But the worst wake-up was 4.2 ms and 29 cycles woke more than half a period late, because a busy loop held core 3 for its fair slice, which is milliseconds long. Lesson 11's point in real numbers: a fine average, missed deadlines.
3. `SCHED_FIFO` under the same load: mean 19 microseconds, worst 480, no cycle half a period late. The busy loop was preempted the moment the timer fired.
4. Over several runs, the `SCHED_OTHER` worst case was about 3 to 5.4 ms. The `SCHED_FIFO` worst case was about 60 microseconds to 2.3 ms, the bad runs on an *idle* machine. We did not find why; on a VM the suspects are waking an idle virtual core and the **[[hypervisor|hypervisor-steal]]** pausing the VM. Timings vary.

Part of the `SCHED_OTHER` mean is **[[timer slack|timer-slack]]**: Linux lets an ordinary thread's timers fire up to 50 microseconds late on purpose; real-time threads get none.

Sanity check: each step multiplies `state` by $1 - 0.001 \times 0.8 = 0.9992$, and $0.9992^{5000} \approx 0.018286$, which both runs print. The policy changed *when* the work ran, never *what* it computed.
:::

A stock kernel in a VM cannot promise a bound. `SCHED_FIFO` shrank the tail almost ten times, but a defensible bound takes the rest of the recipe: a PREEMPT_RT kernel (lesson 12), `isolcpus` and interrupt steering, real hardware, and hours of measurement under worst-case load.

::: warning Measure lateness at the tail, and measure long
A five-second run cannot contain the event that happens once an hour. Qualification runs last hours or days under the worst load you can create, and report the maximum. The mean is the least useful number on that line.
:::

## Check yourself

::: check
A colleague sets up a control thread with `nice -n -20` and says it is now real time. Two other threads on the same core are `SCHED_FIFO` at priority 10. Which runs first when all three are ready, and what should the colleague have done instead?
:::

::: answer
The `SCHED_FIFO` threads. Every runnable real-time thread outranks every `SCHED_OTHER` thread; nice, even $-20$, only changes a share *within* `SCHED_OTHER`. The control thread waits until both FIFO threads block. The fix: `pthread_setschedparam` with `SCHED_FIFO` and a priority above 10, chosen by rate, and a check of the return value.
:::

::: check
Your loop calls `sched_setscheduler(0, SCHED_FIFO, &sp)` and gets `-1` with `errno` equal to 1. What happened, and what are the two ways to fix it?
:::

::: answer
Errno 1 is `EPERM`: the process has neither `CAP_SYS_NICE` nor an `RLIMIT_RTPRIO` at least as large as the requested priority. Fix one: grant the program `CAP_SYS_NICE` (or run as root). Fix two: raise the user's limit, for example `@realtime - rtprio 99` in `/etc/security/limits.conf` with the user in that group. Until then the thread stays `SCHED_OTHER`.
:::

::: check
A test with 16 KiB of fresh stack use deep inside the control law shows one cycle 70 microseconds late the first time that branch runs, and never again. `mlockall(MCL_CURRENT | MCL_FUTURE)` was called at start-up. Explain, and give the fix.
:::

::: answer
The stack exists only as deep as the program has been. The first time that branch goes deeper it touches new stack pages — four page faults for 16 KiB. `MCL_FUTURE` locks them once they exist, which is why it never recurs, but it did not create them in advance. Fix: pre-fault the stack at start-up with a function whose local array is larger than the deepest use, writing one byte in every 4 KiB page.
:::

::: check
Rewrite this loop so it does not drift, and say why the original drifts: `while (true) { step(); sleep_for(1ms); }`.
:::

::: answer
Each cycle is `step()` plus 1 ms plus the wake-up delay, always longer than 1 ms, and the extra adds up: at 50 microseconds a cycle the loop falls a whole cycle behind every 20 cycles. Keep an absolute deadline instead:

```cpp
#include <ctime>

void step();

void run() {
    timespec next;
    clock_gettime(CLOCK_MONOTONIC, &next);
    while (true) {
        next.tv_nsec += 1'000'000;
        if (next.tv_nsec >= 1'000'000'000) { next.tv_nsec -= 1'000'000'000; ++next.tv_sec; }
        clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, nullptr);
        step();
    }
}
```

A late wake-up now delays only its own cycle.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| `SCHED_OTHER` | Default time-sharing policy | Fair shares weighted by nice, $-20$ to $19$; nice 19 is least favored |
| `SCHED_FIFO` | Fixed-priority real-time policy | Priorities $1$–$99$, higher wins; runs until it blocks or is preempted |
| `SCHED_RR` | Real-time with turns | Like FIFO, plus a time slice among equal priorities (100 ms here) |
| Setting policy | `sched_setscheduler`, `pthread_setschedparam` | Per thread on Linux; needs `CAP_SYS_NICE` or `RLIMIT_RTPRIO`, else `EPERM` |
| Pinning | `sched_setaffinity`, `pthread_setaffinity_np`, `taskset` | Keeps the thread on one core; `isolcpus` keeps others off it |
| `mlockall` with both flags | Lock all pages in RAM, now and later | Page faults move to start-up; pre-fault the stack too |
| Quiet hot path | Remove time non-determinism | No heap, exceptions, RTTI, unbounded loops, I/O; strictly no virtuals or `std::string` |
| Allocation trap | Replace global `operator new` | Count, and abort when a flag is set; proves zero allocations |
| Periodic loop | `clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, …)` | Absolute deadlines on a monotonic clock: no drift |

The next lesson, the module's last, is one real design: how SpaceX flies commodity processors through space radiation with three computers, self-checking pairs of cores and a vote — and why determinism makes that vote possible.

::: context fair-share How the deli counter keeps score
Linux's time-sharing scheduler was the Completely Fair Scheduler (CFS) from 2007; in Linux 6.6 it was replaced by EEVDF, "earliest eligible virtual deadline first". Both give each thread a share of the core in proportion to a weight set by its nice value. Nice 0 has weight 1024 and nice 19 has weight 15, so a nice-0 thread competing with a nice-19 thread gets $1024/(1024+15) \approx 98.6\%$ of the core. Each nice step changes the weight by about 1.25 times. Fairness is the goal, which is exactly why it cannot promise a deadline.
:::

::: context kernel-rt-threads Who else lives on the priority ladder
On this machine the kernel runs its own threads under `SCHED_FIFO`. The `migration` threads, one per core, move work between cores and sit at 99. The `watchdogd` thread and the threaded interrupt handlers (`irq/24-ACPI:Ged` and friends) sit at 50. A control loop at 80 outranks the interrupt threads: good for the loop, but a device whose interrupt waits behind it waits longer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="16" x2="60" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="60,10 55,20 65,20" fill="#1f2a44"/>
  <text x="72" y="11" font-size="11" fill="#1f2a44">more urgent</text>
  <line x1="54" y1="26" x2="66" y2="26" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="30" font-size="12" fill="#1f2a44">99</text>
  <rect x="80" y="16" width="260" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="88" y="30" font-size="12" fill="#1f2a44">migration/0 … migration/3 (kernel)</text>
  <line x1="54" y1="62" x2="66" y2="62" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="66" font-size="12" fill="#1f2a44">80</text>
  <rect x="80" y="52" width="260" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <text x="88" y="66" font-size="12" fill="#1f2a44">your 1 kHz control loop (SCHED_FIFO)</text>
  <line x1="54" y1="102" x2="66" y2="102" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="106" font-size="12" fill="#1f2a44">50</text>
  <rect x="80" y="92" width="260" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="88" y="106" font-size="12" fill="#1f2a44">irq/… threads, watchdogd (kernel)</text>
  <line x1="54" y1="140" x2="66" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <text x="34" y="144" font-size="12" fill="#1f2a44">1</text>
  <line x1="20" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <rect x="80" y="170" width="260" height="20" fill="#ffffff" stroke="#6c7a93"/>
  <text x="88" y="184" font-size="12" fill="#6c7a93">every SCHED_OTHER thread, any nice value</text>
</svg>
```
:::

::: context posix-name A portable interface for Unix
POSIX stands for "Portable Operating System Interface", with the X for Unix. It is a family of IEEE standards (numbered 1003) that fix the calls a Unix-like system provides: files, processes, signals, threads (`pthread_*`, "P-threads", for POSIX threads) and the real-time extensions that define `SCHED_FIFO`, `SCHED_RR` and `clock_nanosleep`. Linux, the BSDs, macOS, and real-time systems such as RTEMS and VxWorks all offer large parts of it, which is why the calls in this lesson look familiar across them.
:::

::: context linux-capabilities Root, split into pieces
Old Unix had one all-powerful user, root. Linux splits root's powers into separate **capabilities** that can be granted one at a time. `CAP_SYS_NICE` allows raising priorities and choosing real-time policies. `CAP_IPC_LOCK` allows locking memory beyond `RLIMIT_MEMLOCK`. A flight or test binary can be given exactly those two, for example with `setcap cap_sys_nice,cap_ipc_lock+ep ./loop`, instead of running with every power root has. Fewer powers means a bug can do less damage.
:::

::: context np-suffix Why the name ends in _np
POSIX reserves the suffix `_np`, "non-portable", for vendor extensions. `pthread_setaffinity_np` exists in glibc on Linux and not in the POSIX standard, so code that uses it will not compile unchanged on every Unix. glibc declares it only when `_GNU_SOURCE` is defined; g++ defines that by default when compiling C++, which is why the examples here needed nothing extra.
:::

::: context kernel-cmdline Settings the kernel reads at boot
The boot loader passes the kernel a line of text, the kernel command line, and `cat /proc/cmdline` prints it. Options such as `isolcpus=3`, `nohz_full=3` and `rcu_nocbs=3` go there, so changing them means a reboot. The VM used in this lesson has none of them on its command line — one reason its worst-case numbers are only a demonstration. On a real-time test bench, reading `/proc/cmdline` is the first thing to check.
:::

::: context page-fault When a page is not there yet
Each process sees virtual pages; the kernel maps each one to a real 4 KiB frame of RAM, or to nothing yet. Touching an unmapped page traps into the kernel, which finds or zeroes a frame, updates the map, and resumes the thread. `mlockall` does all of that up front and forbids undoing it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44">virtual pages</text>
  <text x="240" y="18" font-size="12" fill="#1f2a44">RAM frames</text>
  <rect x="20" y="28" width="90" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="65" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">page 0</text>
  <rect x="20" y="62" width="90" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="65" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">page 1</text>
  <rect x="20" y="96" width="90" height="26" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <text x="65" y="114" font-size="12" text-anchor="middle" fill="#b4232c">page 2</text>
  <rect x="240" y="28" width="90" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">frame 7</text>
  <rect x="240" y="62" width="90" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">frame 2</text>
  <line x1="110" y1="41" x2="240" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="75" x2="240" y2="41" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="114" font-size="12" fill="#b4232c">no frame yet: first touch</text>
  <text x="120" y="130" font-size="12" fill="#b4232c">stops the thread (page fault)</text>
  <text x="20" y="158" font-size="11" fill="#6c7a93">minor fault: microseconds · major fault (disk): milliseconds</text>
</svg>
```
:::

::: context sleep-drift Relative sleep drifts, absolute sleep does not
Top: "work, then sleep 1 ms" starts each cycle a little later than the last, and the lag grows. Bottom: "sleep until the next grid time" absorbs each cycle's work, so every cycle starts on the grid.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-dasharray="3 3">
    <line x1="30" y1="20" x2="30" y2="130"/><line x1="110" y1="20" x2="110" y2="130"/>
    <line x1="190" y1="20" x2="190" y2="130"/><line x1="270" y1="20" x2="270" y2="130"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="30" y="144">0 ms</text><text x="110" y="144">1 ms</text><text x="190" y="144">2 ms</text><text x="270" y="144">3 ms</text>
  </g>
  <text x="30" y="16" font-size="12" fill="#1f2a44">relative sleep</text>
  <rect x="30" y="24" width="20" height="18" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="130" y="24" width="20" height="18" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="230" y="24" width="20" height="18" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="330" y="24" width="20" height="18" fill="#b4232c" stroke="#1f2a44"/>
  <text x="150" y="58" font-size="11" fill="#b4232c">lag grows every cycle</text>
  <text x="30" y="84" font-size="12" fill="#1f2a44">absolute deadlines (TIMER_ABSTIME)</text>
  <rect x="30" y="92" width="20" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="110" y="92" width="20" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="190" y="92" width="20" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="270" y="92" width="20" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
</svg>
```
:::

::: context hypervisor-steal A computer inside a computer
A hypervisor is the program that runs virtual machines; this lesson's machine is a guest under KVM (`lscpu` says so). The hypervisor can pause a guest's virtual core to run something else, and the guest's scheduler cannot see or prevent it. So no setting inside a VM can promise a worst case. That is why real-time qualification is done on the flight hardware, or on identical bench hardware, never on a cloud VM.
:::

::: context timer-slack Late on purpose
To save power, Linux may delay a normal thread's timer wake-up by up to its timer slack so that several wake-ups can share one interrupt. The default slack is 50,000 ns, 50 microseconds (`cat /proc/self/timerslack_ns` prints `50000` here). Threads under `SCHED_FIFO` or `SCHED_RR` are not given slack, which is part of why the real-time run's mean lateness was so much smaller.
:::
