---
id: l11-real-time-and-scheduling
title: "Real time: deadlines, worst cases and rate-monotonic scheduling"
minutes: 24
covers:
  - Hard, firm and soft real time; WCET and why average latency is irrelevant
  - Rate-monotonic scheduling and utilization bounds
---

Think about a drummer in a band. Nobody cares how fast the drummer can hit the drum. What matters is that each beat lands exactly when the song needs it. A drummer who is "fast on average" but misses one beat in a thousand has still ruined the song.

Now think about a mail carrier. If your letter arrives an hour late, you are a little annoyed, and the letter is still useful.

Computers that control machines are drummers. The phrase **real time** does not mean "fast". It means **on time**: a result counts only if it arrives before its **deadline**, the latest moment it is still any good. A thrust-vector control loop running at 1 kHz has a deadline every millisecond. This lesson sorts real-time work into three kinds, shows why a task's average time says almost nothing about its deadlines, and gives you a paper test of whether periodic tasks will *always* make them: rate-monotonic scheduling and its utilization bound.

## Hard, firm and soft real time

Every real-time task has deadlines. The three kinds differ in what a missed deadline *costs*.

- **Hard real time.** Missing a deadline is a failure of the system. A late result is not merely worse; it can cause damage. Example: an engine's valve timing. A valve opened too late in the cycle can damage the engine. The rocket version: the ignition sequence of a liquid engine, where propellant valves and the igniter must act in a precise order within milliseconds.
- **Firm real time.** A late result is worthless, so it is thrown away, but an occasional miss does not break the system. Example: a video frame. If a frame is not ready when the screen refreshes, it is dropped; the next one is shown instead. One drop is only a flicker. The onboard camera stream a launch vehicle sends down is like this.
- **Soft real time.** A late result is still useful, only less so. Example: the telemetry display on a ground console. If the tank-pressure number updates 200 ms late, the controller watching it still wants to see it.

One vehicle has all three: the control loop is hard, the camera stream firm, the ground display soft. Which operating system, how much margin and how much testing all follow from the kind.

::: key
Hard real time: a missed deadline is a system failure (engine valve timing, a control loop). Firm: a late result is worthless and discarded, but rare misses are tolerated (a video frame). Soft: a late result still has some value (a telemetry display).
:::

## Periods, deadlines and the worst case

Most flight tasks are **periodic**: they run once every fixed interval. Three numbers describe such a task:

- $T$, the **period**: how often it runs. A 1 kHz control loop has $T = 1\,\mathrm{ms}$.
- $D$, the **deadline**: how long after it is released each run must finish. Very often $D = T$: finish this cycle's work before the next cycle starts.
- $C$, the **execution time**: how long one run takes on the processor, if nothing interrupts it.

$C$ is not one number: a branch goes the other way, data misses in the cache, an interrupt steals a few microseconds. The number that decides whether a hard deadline is always met is the largest of them all, the **worst-case execution time**, or **WCET** — the longest a task can ever take for one run, over every input and every state of the machine.

There are two ways to get a WCET, and serious projects use both.

1. **Measure.** Run the task millions of times under the worst load you can create and record the longest run, the **[[high-water mark|high-water-mark]]**. It is easy, but it only tells you the worst case *you saw*; the true one is at least that large.
2. **Analyze.** Tools read the compiled machine code, find its longest path, and model the processor's timing to put a proven upper bound on it. That is hard on processors with caches and deep pipelines, one reason flight processors are often simpler than desktop ones.

In practice teams add a margin to the measured high-water mark and make the schedule fit with it.

## Why the average is the wrong number

Here is the trap. Suppose a control task has a 1 ms period. You measure it and the average run takes 100 microseconds. Ten percent of the budget. Plenty of margin?

Not if one run in ten thousand takes 3 ms. That run ends after its deadline, and the actuator gets its command late. The average hides it: 9,999 runs at 100 µs and one at 3 ms average out to about 100 µs. A hard requirement is a promise about *every* cycle, so only the tail of the distribution matters.

::: key Why average latency is the wrong metric
A control loop must finish before its deadline every cycle. A task with a 100 microsecond average and a 3 millisecond tail on a 1 millisecond period misses deadlines, no matter how good the average looks. Hard real time is a statement about the worst case.
:::

To talk about the tail, engineers use **[[percentiles|percentile-word]]**. The **p99** (read "p ninety-nine") is the value that 99 percent of samples are at or below; p99.9 leaves one sample in a thousand above it. The **max** is the worst sample of all. For a hard deadline, the max, and how it might grow, is what you design against.

::: example Measuring a 1 kHz loop's jitter on ordinary Linux
This skeleton of a periodic task sleeps until each 1 ms tick, using an absolute wake-up time, and records how late it woke. That lateness is the loop's **jitter**, the variation in when each cycle really starts, and every microsecond of it comes out of the task's budget.

```cpp
#include <algorithm>
#include <cstdio>
#include <ctime>
#include <vector>

// A 1 kHz loop: sleep until the next 1 ms tick, then record how late we woke.
long long to_ns(const timespec& t) { return t.tv_sec * 1'000'000'000LL + t.tv_nsec; }

int main() {
    constexpr int kCycles = 20'000;               // 20 seconds at 1 kHz
    constexpr long kPeriodNs = 1'000'000;         // 1 ms
    std::vector<long long> late_us_x10;           // lateness in tenths of a microsecond
    late_us_x10.reserve(kCycles);                 // allocate before the loop, not in it

    timespec next;
    clock_gettime(CLOCK_MONOTONIC, &next);
    for (int i = 0; i < kCycles; ++i) {
        next.tv_nsec += kPeriodNs;                // the tick we want to wake at
        if (next.tv_nsec >= 1'000'000'000) { next.tv_nsec -= 1'000'000'000; ++next.tv_sec; }
        clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, nullptr);
        timespec now;
        clock_gettime(CLOCK_MONOTONIC, &now);
        late_us_x10.push_back((to_ns(now) - to_ns(next)) / 100);
    }

    std::vector<long long> s = late_us_x10;
    std::sort(s.begin(), s.end());
    double sum = 0;
    for (long long v : s) sum += v;
    auto pct = [&](double p) { return s[static_cast<std::size_t>(p * (s.size() - 1))] / 10.0; };
    std::printf("cycles %zu\n", s.size());
    std::printf("mean   %8.1f us\n", sum / s.size() / 10.0);
    std::printf("median %8.1f us\n", pct(0.5));
    std::printf("p99    %8.1f us\n", pct(0.99));
    std::printf("p99.9  %8.1f us\n", pct(0.999));
    std::printf("max    %8.1f us\n", s.back() / 10.0);

    // Histogram: how many wake-ups fell in each lateness band.
    const long long edges[] = {0, 100, 200, 500, 1000, 2000, 5000, 10000};   // tenths of us
    const char* names[] = {"< 10 us", "10-20 us", "20-50 us", "50-100 us", "100-200 us",
                           "200-500 us", "500-1000 us", ">= 1000 us"};
    long counts[8] = {};
    for (long long v : s) {
        int b = 0;
        while (b < 7 && v >= edges[b + 1]) ++b;
        ++counts[b];
    }
    for (int b = 0; b < 8; ++b) std::printf("%-12s %6ld\n", names[b], counts[b]);
    long misses = std::count_if(s.begin(), s.end(), [](long long v) { return v >= 10000; });
    std::printf("woke a full period (1 ms) or more late: %ld times\n", misses);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` and run as an ordinary process on the 4-core virtual machine used throughout this module (`nproc` prints 4), with other programs busy on it at the same time:

```text
cycles 20000
mean       91.5 us
median     82.7 us
p99       160.0 us
p99.9     346.1 us
max      2898.6 us
< 10 us           0
10-20 us          0
20-50 us          1
50-100 us     16029
100-200 us     3924
200-500 us       29
500-1000 us       7
>= 1000 us       10
woke a full period (1 ms) or more late: 10 times
```

Reading it:

1. The mean is 91.5 µs and the median 82.7 µs. If you stopped here you would say "the loop wakes about 90 µs late, leaving 900 µs of each cycle for work".
2. The p99 is 160 µs and the p99.9 is 346 µs. Still inside the period.
3. The max is 2,898.6 µs, almost 3 ms: that cycle woke nearly three whole periods late. Ten cycles out of 20,000 woke 1 ms or more late. At 1 kHz that is ten missed deadlines in 20 seconds before the task has done any work at all.
Sanity check: the histogram rows add up to $0 + 0 + 1 + 16029 + 3924 + 29 + 7 + 10 = 20000$, the number of cycles. Two other runs gave maxima of 1,757 µs and 1,886 µs, with 2 and 3 cycles a full period late. The tail moved around from run to run, but it was there every time.
:::

Why is even the *median* 80 µs? Part of it is the kernel's **[[timer slack|timer-slack]]**, which lets an ordinary thread's sleep end up to 50 µs late on this machine so the kernel can batch wake-ups and save power. Part is the [[virtual machine|vm-steal]]. The long tail is everything else: other programs that got the core first, interrupts, the kernel doing its own housekeeping.

::: warning A p99.9 from a short test is a guess
The p99.9 of 20,000 samples rests on the 20 worst ones; the max rests on one. A driver that stalls once an hour will not show up in a 20-second run. Flight teams run timing tests for hours or days under deliberate stress, and still add margin.
:::

### Where tails come from, and what to remove

The work of real-time engineering is finding each source of a long tail and taking it out of the **hot path**, the code that runs every cycle. The usual suspects:

- **Heap allocation.** `new` and `malloc` can take a lock or ask the operating system for memory; their time is not bounded.
- **Exceptions.** Unwinding the stack takes time that depends on its depth and the destructors run.
- **RTTI and `dynamic_cast`.** The cast searches the class hierarchy at run time.
- **Unbounded loops and recursion.** If the iteration count depends on the data, so does the time.
- **I/O.** A file or socket write can block as long as the device or kernel wants.
- **Page faults.** Touching memory not yet mapped makes the operating system stop the thread to fix it. Lesson 13's `mlockall` prevents this.
- **Locks shared with lower-priority threads.** The next lesson shows how these can make a high-priority task wait almost without limit.

::: key Five sources of non-determinism to remove from a hot path
Heap allocation, exceptions, RTTI and `dynamic_cast`, unbounded loops and recursion, and I/O. Add virtual dispatch and `std::string` when you are being strict.
:::

Notice the example does this itself: `reserve` allocates the whole vector before the loop, so `push_back` never allocates inside it.

## Rate-monotonic scheduling

Now suppose you have several periodic tasks on one processor. A **[[preemptive|preemptive-word]]**, fixed-priority scheduler always runs the highest-priority task that is ready, interrupting any lower one the instant a higher one becomes ready. You choose each task's priority once, at design time. Which order should you choose?

Think of a kitchen with one stove. The cook who needs it every minute should go before the cook who needs it once an hour: the frequent one has almost no slack. **Rate-monotonic scheduling (RMS)** is exactly that rule: **the shorter the period, the higher the priority**. "Rate" is how often the task runs; "monotonic" means priority always goes up as rate goes up. A 1 kHz task beats a 100 Hz task, which beats a 10 Hz task.

In 1973, **[[Liu and Layland|liu-layland]]** proved two results about this rule, under a set of assumptions: the tasks are periodic, independent (no shared locks), each deadline equals its period, the scheduler is preemptive, there is one processor, and switching between tasks costs nothing.

1. Among all fixed-priority assignments, rate-monotonic is the best: if any fixed priority order meets every deadline, rate-monotonic does too.
2. A simple test on **utilization** is enough to guarantee it.

The **utilization** of a task is the fraction of the processor it uses: $U_i = C_i / T_i$, read "C sub i over T sub i". A task that needs 0.3 ms every 1 ms uses $0.3$, or 30 percent. The total utilization is the sum over all $n$ tasks:

$$
U = \sum_{i=1}^{n} \frac{C_i}{T_i}
$$

Read $\sum$ ("sigma") as "add up, for every task $i$ from 1 to $n$". The **Liu and Layland bound** says the tasks are guaranteed schedulable under rate-monotonic priorities if

$$
U \le n\left(2^{1/n} - 1\right)
$$

Read $2^{1/n}$ as "two to the power one over n", the $n$-th root of 2. Computed with python3:

| Tasks $n$ | Bound $n(2^{1/n}-1)$ |
|---|---|
| 1 | 1.000 |
| 2 | 0.828 |
| 3 | 0.780 |
| 4 | 0.757 |
| 5 | 0.743 |
| 10 | 0.718 |
| 100 | 0.696 |
| very many | $\ln 2 \approx 0.693$ |

Each task you add lowers the bound a little, down toward $\ln 2$, the natural logarithm of 2, about 0.693, and never below it. So a rule of thumb: **if the total utilization is under about 69 percent, rate-monotonic priorities meet every deadline, however many tasks there are.**

::: key Rate-monotonic scheduling: the utilization bound
For $n$ independent periodic tasks with deadlines equal to periods, fixed priorities assigned by rate are schedulable if total utilization $U = \sum C_i/T_i \le n\left(2^{1/n} - 1\right)$, which tends to $\ln 2 \approx 0.693$, about 69 percent. Above that you need an exact response-time analysis.
:::

::: note Why the bound tends to ln 2
Write $2^{1/n}$ as $e^{(\ln 2)/n}$. For a large $n$ the exponent $(\ln 2)/n$ is tiny, and for a tiny $x$, $e^x \approx 1 + x$. So $2^{1/n} - 1 \approx (\ln 2)/n$, and multiplying by $n$ gives $n\left(2^{1/n}-1\right) \approx \ln 2$. Checked with python3: for $n = 1000$ the bound is 0.69339, and $\ln 2 = 0.69315$.
:::

::: example Checking a flight task set against the bound
A small flight computer runs three periodic tasks. Their WCETs come from measured high-water marks plus margin.

| Task | Rate | Period $T$ | WCET $C$ | $C/T$ |
|---|---|---|---|---|
| Attitude control | 1 kHz | 1 ms | 0.3 ms | 0.30 |
| Navigation filter | 100 Hz | 10 ms | 2 ms | 0.20 |
| Telemetry packing | 10 Hz | 100 ms | 15 ms | 0.15 |

Step 1, priorities by rate: control highest, navigation middle, telemetry lowest.

Step 2, total utilization: $U = 0.3/1 + 2/10 + 15/100 = 0.30 + 0.20 + 0.15 = 0.65$. The processor is busy 65 percent of the time.

Step 3, the bound for $n = 3$: $3\left(2^{1/3} - 1\right)$. The cube root of 2 is 1.2599, so this is $3 \times 0.2599 = 0.780$.

Step 4, compare: $0.65 \le 0.780$. The test passes, so every task meets every deadline, every cycle, as long as no run exceeds its WCET.

Sanity check: the [[schedule drawn out|rm-timeline]] for the first 4 ms agrees. Control runs 0–0.3 ms, 1–1.3, 2–2.3, 3–3.3. Navigation fills the gaps: 0.7 ms before the 1 ms tick, 0.7 ms before the 2 ms tick, then its last 0.6 ms, finishing at 2.9 ms, well inside its 10 ms deadline. Telemetry gets the processor only in what is left over.
:::

::: warning The bound is sufficient, not necessary
Passing the test proves the tasks are schedulable. *Failing* it proves nothing either way: many task sets above the bound still meet every deadline. Tasks whose [[periods divide one another|harmonic-periods]], as 1, 10 and 100 ms do, are an important case: they can be schedulable right up to 100 percent. And one thing is always true: if $U > 1$, the tasks need more processor time than exists, and no scheduler can save them.
:::

## When the bound fails: response-time analysis

When a task set is above the bound, you do the exact test instead. It answers the question directly: what is the longest time from the moment a task is released to the moment it finishes? That time is its **worst-case response time**, $R_i$. If $R_i \le D_i$ for every task, the set is schedulable. If not, it is not.

The worst case for task $i$ is when every higher-priority task is released at the same instant. Then it needs its own $C_i$ plus all the time those tasks steal while it runs. A higher-priority task $j$ with period $T_j$ is released $\lceil R_i / T_j \rceil$ times during a window of length $R_i$. The brackets $\lceil\ \rceil$ are read "ceiling": round up to the next whole number, because even a partly overlapping release steals a full $C_j$. So:

$$
R_i = C_i + \sum_{j \in hp(i)} \left\lceil \frac{R_i}{T_j} \right\rceil C_j
$$

Here $hp(i)$, read "h p of i", is the set of tasks with higher priority than $i$. $R_i$ appears on both sides, so you solve it by repeating: start with $R_i = C_i + \sum C_j$, put that into the right-hand side, get a new $R_i$, and repeat until the number stops changing (the answer) or grows past the deadline (a miss).

::: example Response times when utilization is above the bound
The navigation filter grows: its WCET is now 4 ms. New utilization: $0.30 + 4/10 + 0.15 = 0.85$. That is above the three-task bound of 0.780, so the simple test says nothing. Work out each response time (all times in ms).

**Control** (highest priority, nothing above it): $R_1 = C_1 = 0.3 \le 1$. Meets its deadline.

**Navigation** ($C = 4$, $T = 10$, control above it with $C = 0.3$, $T = 1$):

| Try | $R$ in | Control releases $\lceil R/1 \rceil$ | New $R = 4 + 0.3 \times$ releases |
|---|---|---|---|
| 1 | 4.3 | 5 | 5.5 |
| 2 | 5.5 | 6 | 5.8 |
| 3 | 5.8 | 6 | 5.8, no change |

$R_2 = 5.8 \le 10$. Meets its deadline.

**Telemetry** ($C = 15$, $T = 100$, both others above it):

| Try | $R$ in | $\lceil R/1 \rceil$ | $\lceil R/10 \rceil$ | New $R = 15 + 0.3\lceil R/1\rceil + 4\lceil R/10\rceil$ |
|---|---|---|---|---|
| 1 | 19.3 | 20 | 2 | 15 + 6 + 8 = 29 |
| 2 | 29 | 29 | 3 | 15 + 8.7 + 12 = 35.7 |
| 3 | 35.7 | 36 | 4 | 15 + 10.8 + 16 = 41.8 |
| 4 | 41.8 | 42 | 5 | 15 + 12.6 + 20 = 47.6 |
| 5 | 47.6 | 48 | 5 | 15 + 14.4 + 20 = 49.4 |
| 6 | 49.4 | 50 | 5 | 15 + 15 + 20 = 50 |
| 7 | 50 | 50 | 5 | 50, no change |

$R_3 = 50 \le 100$. Meets its deadline.

All three pass, though the utilization test could not promise it. Sanity check: in 50 ms, control runs 50 times ($50 \times 0.3 = 15$ ms), navigation 5 times ($5 \times 4 = 20$ ms) and telemetry once (15 ms), and $15 + 20 + 15 = 50$: the processor was busy the whole window, as a worst case should be. A python3 run of the iteration gives the same sequences.

Now push telemetry to $C = 40$ ms ($U = 1.10$). The iteration goes 44.3, 73.5, 94.2, 108.5: past the 100 ms deadline, so telemetry misses, as it must with $U > 1$.
:::

::: note Other schedulers
**Earliest deadline first (EDF)** always runs the ready task whose deadline is soonest; Liu and Layland showed in the same paper that, under the same assumptions, it meets every deadline whenever $U \le 1$. Flight software still mostly uses fixed priorities: they are simple to build and inspect, and when overloaded they fail in a predictable place, the lowest-priority task, while an overloaded EDF system can miss deadlines far less predictably.
:::

Keep two assumptions in view. Every $C$ is a *worst* case: plug in averages and the analysis proves nothing. And the tasks were independent; sharing data through a mutex breaks that, as the next lesson shows.

## Check yourself

::: check
Classify each as hard, firm or soft real time, and say why: (a) a car's airbag trigger; (b) a weather app refreshing the radar picture; (c) audio samples on a video call.
:::

::: answer
(a) Hard: an airbag that fires late is a failure. (b) Soft: a radar image a few seconds late is still useful. (c) Firm: an audio sample that misses its moment is dropped (a tiny glitch), but an occasional drop does not break the call.
:::

::: check
A test of a 500 Hz loop reports a mean execution time of 0.4 ms and a max of 2.3 ms. The deadline equals the period. Does the loop meet its hard deadline? What is the one number you would quote in a review?
:::

::: answer
A 500 Hz loop has a period of $1/500\,\mathrm{s} = 2\,\mathrm{ms}$, so its deadline is 2 ms. The max, 2.3 ms, is past it: at least one cycle missed, whatever the mean. Quote the max, with how long and under what load it was measured, then hunt the tail's source: an allocation, a page fault, a lock or an interrupt.
:::

::: check
Four independent periodic tasks have utilizations 0.20, 0.15, 0.25 and 0.10, deadlines equal to periods. Are they guaranteed schedulable under rate-monotonic priorities?
:::

::: answer
Total $U = 0.20 + 0.15 + 0.25 + 0.10 = 0.70$. The bound for $n = 4$ is $4\left(2^{1/4} - 1\right) = 4 \times 0.1892 = 0.757$. Since $0.70 \le 0.757$, yes: every deadline is met under rate-monotonic priorities.
:::

::: check
Two tasks: A with $C = 2$ ms, $T = 5$ ms; B with $C = 4$ ms, $T = 10$ ms. Compute $U$, compare it with the two-task bound, and find B's worst-case response time.
:::

::: answer
$U = 2/5 + 4/10 = 0.4 + 0.4 = 0.8$. The two-task bound is $2\left(\sqrt{2} - 1\right) = 0.828$, and $0.8 \le 0.828$, so the set passes the test. Response time for B (A has the higher priority, since its period is shorter): start with $R = 4 + 2 = 6$. A is released $\lceil 6/5 \rceil = 2$ times, so $R = 4 + 2 \times 2 = 8$. Again: $\lceil 8/5 \rceil = 2$, $R = 8$, no change. $R_B = 8 \le 10$, which agrees with the bound.
:::

::: check
Why is a measured high-water mark not a proven WCET, and what do teams do about it?
:::

::: answer
A measurement covers only the runs you made, with the inputs, cache states and interrupts that happened to occur; the true worst case can be a combination you never hit. So the real WCET is at least the measured max. Teams test long under stress, add margin, keep utilization well below the limit, and for the most critical code use static analysis that bounds the longest path through the machine code.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Real time | Correct only if on time | Not "fast": every result has a deadline |
| Hard / firm / soft | Cost of a miss | Failure / result discarded / result worth less |
| Period $T$, deadline $D$, WCET $C$ | How often, by when, how long at worst | Often $D = T$ |
| Tail latency | The slow end of the distribution | Only the max matters for a hard deadline; the mean is irrelevant |
| Measured jitter, 1 kHz loop | Ordinary Linux, 4-core VM | Mean 91.5 µs, p99.9 346 µs, max 2,899 µs |
| Hot-path hygiene | Remove unbounded-time operations | Allocation, exceptions, RTTI, unbounded loops, I/O |
| Rate-monotonic | Fixed priority by rate | Shorter period, higher priority |
| Utilization | Fraction of the processor used | $U = \sum C_i / T_i$ |
| Liu and Layland bound | Sufficient schedulability test | $U \le n(2^{1/n} - 1) \to \ln 2 \approx 0.693$ |
| Response-time analysis | Exact test | $R_i = C_i + \sum_{hp(i)} \lceil R_i/T_j \rceil C_j$, need $R_i \le D_i$ |

Next lesson breaks the "independent tasks" assumption on purpose: a high-priority task that shares a mutex with a low-priority one can be made to wait behind a medium one, which is exactly what reset a spacecraft on Mars, and the fix is a small change to how the mutex behaves.

::: context high-water-mark A line on the wall
A high-water mark is the line a flood leaves on a wall: the highest the water ever reached. In software it is the largest value a quantity has ever had while the system ran — the longest cycle time, the deepest stack, the fullest queue. Flight software commonly records high-water marks for every task and sends them down in telemetry, so the team can see how close to its limits the vehicle actually came.
:::

::: context percentile-word The tail, drawn to scale
The example's numbers on one axis from 0 to 3,000 µs. Mean, p99 and p99.9 are bunched near the left; the max sits far to the right, past the 1 ms deadline. A percentile is a position in the sorted list of samples: sort all 20,000, and p99 is the one 99 percent of the way along.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="76" x2="40" y2="84"/><line x1="140" y1="76" x2="140" y2="84"/><line x1="240" y1="76" x2="240" y2="84"/><line x1="340" y1="76" x2="340" y2="84"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="98">0</text><text x="140" y="98">1000</text><text x="240" y="98">2000</text><text x="330" y="98">3000 us</text>
  </g>
  <line x1="140" y1="20" x2="140" y2="80" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="146" y="30" font-size="11" fill="#b4232c">deadline 1 ms</text>
  <circle cx="49.2" cy="80" r="4" fill="#1d6fd1"/>
  <circle cx="56" cy="80" r="4" fill="#1d6fd1"/>
  <circle cx="74.6" cy="80" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="329.9" cy="80" r="5" fill="#b4232c"/>
  <text x="44" y="64" font-size="11" fill="#1d6fd1">mean, p99</text>
  <text x="62" y="118" font-size="11" fill="#1f2a44">p99.9 = 346</text>
  <text x="326" y="64" font-size="11" text-anchor="end" fill="#b4232c">max = 2899</text>
</svg>
```
:::

::: context timer-slack Why the kernel wakes you a little late
Waking the processor costs energy, so Linux lets an ordinary thread's timers fire a little late, in a window called the timer slack, and groups nearby wake-ups together. On this machine an ordinary thread's slack is 50,000 ns, 50 µs, which `prctl(PR_GET_TIMERSLACK)` reports. Threads in the real-time scheduling classes, which lesson 13 sets up with `SCHED_FIFO`, get no slack. That alone removes a large part of the 80 µs median seen here.
:::

::: context vm-steal A computer inside a computer
A virtual machine is a whole simulated computer run as a program by a host machine's hypervisor. The "4 cores" this lesson measured are really threads of the host, and the host can pause them to run other guests or its own work. The guest cannot prevent it and often cannot even see it. That is one reason nobody runs a hard real-time loop in an ordinary cloud virtual machine, and why the numbers here are a worst-case teaching example, not what a tuned flight computer does.
:::

::: context preemptive-word Taking the processor back
Preemptive means the scheduler can stop a running task at almost any instruction and give the processor to a more urgent one; the stopped task resumes later where it left off. The other kind, cooperative scheduling, lets each task run until it chooses to give the processor up. Cooperative systems are simpler, but one slow task delays everyone, which is why almost every real-time operating system is preemptive.
:::

::: context liu-layland The paper behind the bound
Chung Laung Liu and James Layland published "Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment" in the Journal of the ACM in 1973. It introduced both the rate-monotonic priority rule with its utilization bound and the deadline-driven scheduler now called earliest deadline first. It remains one of the most cited papers in real-time computing, and nearly every real-time scheduling course starts from it.
:::

::: context rm-timeline The first 4 ms, drawn
The worked task set under rate-monotonic priorities. Control (top row) runs at every 1 ms tick; navigation fills the gaps and finishes at 2.9 ms; telemetry starts only after that.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="4" y="40" font-size="11" fill="#1f2a44">control</text>
  <text x="4" y="80" font-size="11" fill="#1f2a44">nav</text>
  <text x="4" y="120" font-size="11" fill="#1f2a44">telemetry</text>
  <rect x="50" y="26" width="22.5" height="22" fill="#b4232c"/>
  <rect x="125" y="26" width="22.5" height="22" fill="#b4232c"/>
  <rect x="200" y="26" width="22.5" height="22" fill="#b4232c"/>
  <rect x="275" y="26" width="22.5" height="22" fill="#b4232c"/>
  <rect x="72.5" y="66" width="52.5" height="22" fill="#1d6fd1"/>
  <rect x="147.5" y="66" width="52.5" height="22" fill="#1d6fd1"/>
  <rect x="222.5" y="66" width="45" height="22" fill="#1d6fd1"/>
  <rect x="267.5" y="106" width="7.5" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <rect x="297.5" y="106" width="52.5" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <line x1="50" y1="136" x2="350" y2="136" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3">
    <line x1="125" y1="18" x2="125" y2="136"/><line x1="200" y1="18" x2="200" y2="136"/><line x1="275" y1="18" x2="275" y2="136"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="152">0</text><text x="125" y="152">1</text><text x="200" y="152">2</text><text x="275" y="152">3</text><text x="345" y="152">4 ms</text>
  </g>
  <text x="267" y="100" font-size="11" text-anchor="middle" fill="#1d6fd1">done 2.9</text>
</svg>
```
:::

::: context harmonic-periods When every period divides the next
Periods are harmonic when each one divides every longer one, like 1, 10 and 100 ms. Then every longer task's release lines up with a release of every shorter one, and no fragment of processor time is wasted between them. Under rate-monotonic priorities such a set meets every deadline whenever $U \le 1$. That is one reason flight software likes rates such as 1,000, 100 and 10 Hz, or 400, 200, 100 and 50 Hz: the schedule packs perfectly, and the analysis stays simple.
:::
