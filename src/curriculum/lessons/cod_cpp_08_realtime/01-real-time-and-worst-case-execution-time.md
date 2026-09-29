---
id: l01-real-time-and-worst-case-execution-time
title: Real time and worst-case execution time
minutes: 26
covers:
  - 'Worst-case execution time: measurement, static analysis and their limits'
---

Think of a drummer in a marching band. Every half second the drum has to hit. It does not matter how beautiful a hit is if it lands a quarter second late: the band is already out of step. A late beat is a wrong beat.

A flight computer lives the same way. It reads its sensors, works out where the vehicle is, decides what to do, and sends commands to the engines or fins — and it does this again and again on a fixed beat, often a thousand times a second. A correct answer that arrives after the beat is as bad as a wrong answer, because the vehicle has already moved on. Software like this is called **real-time**: software that must deliver the right result *by a deadline*, not only the right result.

The question this lesson answers is the one every real-time engineer asks first: *how long can this piece of code possibly take?* Not usually, not on average — at most, ever. That number is the **worst-case execution time**, or **WCET**. You will see why it is hard to know, the two ways of finding it — measuring and analyzing — and what each misses. You already know threads, lock-free queues and fixed-size Eigen types from the earlier modules. This module is about the rules that make such code safe to fly, and nearly every rule traces back to this question.

## Frames and deadlines

A flight computer divides time into equal slices called **frames** (also called minor cycles or ticks). A timer interrupts the processor at the start of each frame, and a small piece of code called the **[[scheduler|scheduler-word]]** runs the jobs for that frame, in a fixed order. Each job is a **task**: a function with one purpose, such as "read the gyros" or "run the attitude controller".

The **rate** of a loop is how many frames happen each second, measured in **[[hertz|hertz-name]]** (Hz, "per second"). The length of one frame, the **period**, is one divided by the rate:

$$
T = \frac{1}{f}.
$$

Read it as "T equals one over f". With $f = 1000\,\mathrm{Hz}$ (one kilohertz, 1 kHz), the period is $T = 1/1000\,\mathrm{s} = 1\,\mathrm{ms}$ — one millisecond. So a 1 kHz control loop has **one millisecond** to do everything: read, estimate, decide, command, and report. That millisecond is the **frame budget**.

Slower jobs run in slower loops called **rate groups**. A guidance task might run at 50 Hz (a 20 ms frame) and telemetry at 10 Hz (100 ms). The fast inner loop — the one that keeps the vehicle pointed — is usually the tightest.

To feel a millisecond from the processor's side, count clock ticks. A flight processor running at 200 MHz ticks 200 million times a second, so one millisecond is $200 \times 10^6 \times 10^{-3} = 200{,}000$ ticks — not many once a navigation filter multiplies a few dozen matrices.

The **deadline** of a task is the moment its result must be ready — usually the end of the frame. If any task in the frame runs long, the next frame starts late, and every task after it is late too. That is a **[[frame overrun|overrun]]**. In a **hard real-time** system, missing a deadline is a failure: the fin command that should have gone out at $t = 5.001\,\mathrm{s}$ is useless at $5.002\,\mathrm{s}$. In a **soft real-time** system, such as video streaming, a late result is worse but still useful. Guidance, navigation and control are hard real-time.

::: key
A 1 kHz loop has a 1 ms frame: $T = 1/f$. Every task that runs in the frame must finish, in its worst case, before the frame ends. A late answer is a wrong answer.
:::

::: example Checking a 1 kHz frame budget
A vehicle's fast loop runs these tasks every frame. Each number is that task's worst-case execution time, in milliseconds.

| Task | WCET (ms) |
| --- | --- |
| read inertial sensors | 0.045 |
| navigation filter | 0.310 |
| guidance update | 0.120 |
| control law | 0.065 |
| write actuator commands | 0.030 |
| pack telemetry | 0.150 |

**Step 1: add the worst cases.** $0.045 + 0.310 + 0.120 + 0.065 + 0.030 + 0.150 = 0.720\,\mathrm{ms}$.

**Step 2: compare with the frame.** The frame is $1\,\mathrm{ms}$. The **utilization** — the fraction of the frame the tasks use — is $0.720 / 1.000 = 0.72$, or 72 percent.

**Step 3: find the slack.** What is left is $1.000 - 0.720 = 0.280\,\mathrm{ms}$, 28 percent of the frame. That is the room for the scheduler itself, for interrupts, and for the software to grow.

**Sanity check.** The navigation filter alone uses about a third of the frame, which is typical: estimation is usually the heaviest job. And we added *worst* cases, not averages. Averages might total 40 percent, and the frame would still overrun on the day several tasks hit their slow paths at once.
:::

## Why one task has many execution times

Run the same function twice and you can get two different times. There are four main reasons, and all of them matter for WCET.

**Different paths.** An `if` that is usually false skips a block; on the rare day it is true, the block runs. A loop may run 3 times or 300. The time depends on which path the input takes.

**The memory system.** A modern processor keeps recently used data in a small, fast memory right next to it called a **[[cache|cache-picture]]**. Reading from the cache takes a few ticks; reading from main memory can take a hundred. So the same code runs fast when its data is already in cache (a "warm" cache) and slow when another task has pushed it out (a "cold" cache).

**The pipeline.** Processors start the next few instructions before the current one finishes, and they guess which way each branch will go. A wrong guess throws away that work and costs extra ticks. How often the guess is right depends on what ran before.

**Interruptions.** An **interrupt** is a hardware signal that makes the processor drop what it is doing, run a short handler, and come back. Interrupts arrive whenever the hardware wants — a sensor has data, a radio packet arrived — so they add time to whatever task was running.

So a task's execution time is not one number but a spread. The shortest is the **best-case execution time (BCET)**. Most runs cluster around a typical value. Somewhere to the right, possibly far to the right, is the longest time it can ever take: the WCET. The frame budget must hold the WCET, because the deadline must be met every time.

::: warning
"It ran in 80 nanoseconds" describes one run. The words "execution time" without "worst-case" in front of them do not belong in a timing budget. When someone gives you a timing number, ask: measured or analyzed? On what processor, with what cache state, over how many runs, and on which inputs?
:::

## Measuring: fast, real and incomplete

The obvious way to find the worst case is to run the code many times and keep the largest time you see. That largest time is the **high-water mark** — like the line a flood leaves on a wall. On a flight board, engineers measure in three common ways:

- read the processor's own **[[cycle counter|cycle-counter]]** just before and just after the task, and subtract;
- flip a spare output pin high at the start of the task and low at the end, and watch the pin on an **[[oscilloscope|scope-pulse]]** or logic analyzer, so the pulse width *is* the execution time;
- let the scheduler record every task's time every frame, and send the maximum down in telemetry.

Measuring uses the real processor, compiler output and memory. But it has one deep limit: **you only measure the paths and inputs you tried.** The next example shows that limit with real code.

::: example A worst case that 100,000 test runs never saw
Here is a pretend control task. On the normal path it does 64 multiply-adds. On one special input — standing in for a rare mode change — it also recomputes all its gains, which takes far longer. We time it on 100,000 pseudo-random inputs, then on the special one.

```cpp
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <cstdio>

// A pretend 1 kHz control task. Most cycles take the short path.
// One rare input (a mode change) takes a much longer path.
std::array<double, 64> gains{};
volatile double sink = 0.0;

void control_step(std::uint32_t input) {
    double u = 0.0;
    for (std::size_t i = 0; i < gains.size(); ++i) {   // normal path: 64 multiply-adds
        u += gains[i] * static_cast<double>(input + i);
    }
    if (input == 777'777u) {                            // rare path: recompute every gain
        for (int pass = 0; pass < 200; ++pass) {
            for (std::size_t i = 0; i < gains.size(); ++i) {
                gains[i] = gains[i] * 0.999 + 0.001 * static_cast<double>(pass);
            }
        }
    }
    sink = u;
}

std::int64_t time_one(std::uint32_t input) {
    auto t0 = std::chrono::steady_clock::now();
    control_step(input);
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count();
}

int main() {
    constexpr int kRuns = 100'000;
    static std::array<std::int64_t, kRuns> ns{};
    std::uint32_t x = 12345u;
    for (int r = 0; r < kRuns; ++r) {
        x = x * 1664525u + 1013904223u;                 // simple pseudo-random inputs
        ns[r] = time_one(x % 1'000'000u);
    }
    std::sort(ns.begin(), ns.end());
    std::printf("test inputs : %d\n", kRuns);
    std::printf("fastest     : %lld ns\n", static_cast<long long>(ns[0]));
    std::printf("median      : %lld ns\n", static_cast<long long>(ns[kRuns / 2]));
    std::printf("99.9th pct  : %lld ns\n", static_cast<long long>(ns[kRuns * 999 / 1000]));
    std::printf("slowest seen: %lld ns\n", static_cast<long long>(ns[kRuns - 1]));
    std::printf("runs > 1 us : %ld\n",
                static_cast<long>(std::count_if(ns.begin(), ns.end(),
                                                [](std::int64_t t) { return t > 1000; })));
    std::printf("rare input  : %lld ns\n", static_cast<long long>(time_one(777'777u)));
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` and run on a Linux desktop-class machine:

```text
test inputs : 100000
fastest     : 77 ns
median      : 80 ns
99.9th pct  : 208 ns
slowest seen: 40910 ns
runs > 1 us : 21
rare input  : 2769 ns
```

**Read it line by line.** The median is 80 ns: half the runs were faster, half slower. The 99.9th percentile — the time that 999 runs out of 1000 beat — is 208 ns, so even the task's own spread is more than double from typical to rare.

**The slowest time seen is 40,910 ns**, about 511 times the median. That was not the task: the operating system paused this program to run something else, and the clock kept ticking. Twenty-one runs were hit this way. A measurement mixes the task's own time with interference.

**The rare path never ran.** Its true time, 2,769 ns, is about $2769 / 80 \approx 35$ times the median. Not one of the 100,000 inputs was 777,777, so this worst path was never exercised. If you had set the budget from "the task's own slowest run", you would have been off by a factor of 13 ($2769 / 208 \approx 13$).

**Sanity check.** One input in a million triggers the slow path, and we tried a tenth of a million inputs. With truly random inputs, the chance that every one of them misses is $(1 - 10^{-6})^{100\,000} \approx 0.90$ — about 90 percent. Rare paths are rare. That is exactly why testing misses them.
:::

The exact nanoseconds will differ on your machine. The shape will not: a tight cluster, a thin tail, a few huge outliers from interference, and a worst path testing never reached.

::: example Same code, same input, different time
This task sums one value from each 64-byte chunk of a 32 KiB table. We time it right after running it once (the table is warm in cache), then again after reading through 64 MiB of other data, which pushes the table out of cache.

```cpp
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <vector>

// The same task on the same input, timed with its data in cache ("warm")
// and after something else has pushed that data out of cache ("cold").
std::array<double, 4096> table{};          // 32 KiB of filter coefficients
volatile double sink = 0.0;

void task() {
    double s = 0.0;
    for (std::size_t i = 0; i < table.size(); i += 8) {   // touch every 64-byte line once
        s += table[i];
    }
    sink = s;
}

std::int64_t time_task() {
    auto t0 = std::chrono::steady_clock::now();
    task();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count();
}

int main() {
    std::vector<unsigned char> other(64u << 20, 1);   // 64 MiB of "other work" (made at startup)
    constexpr int kTrials = 201;
    std::array<std::int64_t, kTrials> warm{}, cold{};
    for (int t = 0; t < kTrials; ++t) {
        task();                                      // bring the table into cache
        warm[t] = time_task();                       // time it warm
        unsigned sum = 0;
        for (std::size_t i = 0; i < other.size(); i += 64) sum += other[i];  // evict it
        sink = sum;
        cold[t] = time_task();                       // time it cold
    }
    std::sort(warm.begin(), warm.end());
    std::sort(cold.begin(), cold.end());
    std::printf("warm cache, median: %lld ns\n", static_cast<long long>(warm[kTrials / 2]));
    std::printf("cold cache, median: %lld ns\n", static_cast<long long>(cold[kTrials / 2]));
    return 0;
}
```

```text
warm cache, median: 329 ns
cold cache, median: 533 ns
```

**Step 1.** Same function, same table, same instructions. Only the cache state changed.

**Step 2.** The ratio is $533 / 329 \approx 1.62$. The cold run took about 60 percent longer.

**Sanity check.** This machine notices the loop walking through memory in order and fetches the next chunks early, which hides part of the cold-cache cost; a less regular pattern would show a wider gap. Now picture tests where the task always runs right after a small task — every measurement would be the warm number, and the cold case would first appear in flight.
:::

## Static analysis: a bound without running

The other way to find the WCET is to work it out from the program itself, without running it. A **static WCET analyzer** reads the compiled machine code and does three jobs:

1. **Find every path.** It builds the **control-flow graph** — a map of every block of instructions and every jump between them.
2. **Price every block.** It models the exact processor: how many ticks each instruction takes, what the pipeline does, and which memory reads *must* hit the cache and which *might* miss. When it cannot be sure, it assumes the slow case.
3. **Find the longest path.** It searches the graph for the path with the largest total. That total is the WCET bound.

If the model is right, the result is a **safe upper bound**: a number the real time can never exceed, on any input. That is what measurement can never give you. Commercial tools of this kind exist — AbsInt's **[[aiT|ait-airbus]]** is the best-known example.

Static analysis has limits of its own, and they are why this module has rules:

- **It needs loop bounds.** A loop with no provable maximum count has no longest path. That is the subject of the next lesson.
- **It needs a finite call graph.** Recursion puts a loop in the calls themselves.
- **It needs to know where every call goes.** A call through a function pointer or a virtual function can go to many places. The tool needs to be told which.
- **It needs a correct processor model.** For a simple processor that is achievable. For a modern chip with deep pipelines, big shared caches and several cores sharing memory, the model gets so cautious that the bound can be many times the real time — if the maker publishes enough detail to build it at all. This is why **[[multicore processors are hard to certify|multicore-interference]]** in avionics.
- **It is pessimistic.** When the tool cannot decide, it assumes the worst. The bound is safe but often loose, and may include a path the program can never take.

::: key
Worst-case execution time is the upper bound on how long a task can take. Measurement only samples the paths and inputs you tried; caches, branch prediction and interrupt timing can produce a worse case you never hit. Static analysis plus measurement plus margin is the practice.
:::

::: note Why a longest path is a safe bound
Every run of the program follows *some* path through the control-flow graph. If the analyzer has priced each block with a time at least as long as the block can really take, then any real run's time is a sum of numbers each no bigger than the analyzer's, along a path no longer than the longest path. So the real time is at most the longest-path total. Two things can break this: a block priced too low (a wrong processor model), or a path the graph does not contain (a jump the tool did not know about, such as an unresolved function pointer). Everything in this module that bans "clever" control flow is protecting the second assumption.
:::

## The practice: both methods, plus margin

Flight teams use both methods, because each covers the other's blind spot.

- **Static analysis** finds paths no test reached and gives a bound for every input.
- **Measurement** checks the analysis model against reality and catches effects the model left out.
- **Margin** is the part of the frame the project refuses to spend. It absorbs model errors, code growth and interference nobody predicted. Projects write it into requirements, for example "worst-case frame use at most 80 percent".

When the two disagree, the gap is information: either the tool is pessimistic or the tests never reached the slow path, and you must find out which.

::: example Measurement says yes, the analysis says no
A project's rule: every 1 kHz frame must fit within 80 percent of its budget, so within $0.8 \times 1\,\mathrm{ms} = 0.800\,\mathrm{ms}$.

After a 72-hour test run, the recorded high-water mark for the whole frame is $0.520\,\mathrm{ms}$. The static analyzer's bound for the same frame is $0.810\,\mathrm{ms}$.

**Step 1: the measurement.** $0.520 / 0.800 = 0.65$. By measurement, the frame uses 65 percent of its allowance. It looks comfortable.

**Step 2: the bound.** $0.810 > 0.800$. By analysis, the frame can exceed the limit by $0.010\,\mathrm{ms}$, or 10 microseconds.

**Step 3: what engineers do.** They ask the tool which path produced $0.810\,\mathrm{ms}$. Suppose it is the sensor re-calibration branch running with a cold cache in the same frame as a large telemetry packet. If the design guarantees those two never happen in the same frame, the team tells the analyzer that fact, and the bound drops. If they *can* happen together, the team moves the telemetry packing to a slower rate group, or speeds it up, until the bound fits.

**Sanity check.** The 72-hour test ran about $72 \times 3600 \times 1000 \approx 2.6 \times 10^8$ frames and never came near $0.810\,\mathrm{ms}$. That is not a contradiction: millions of frames can all miss one rare combination of events.
:::

::: warning
Two traps catch new engineers. First, turning off interrupts or caches "to get clean numbers" measures a system that will not fly. Second, measuring on a desktop and using the numbers for a flight board: different processor, cache and compiler target, so the numbers do not carry over. Measure on the real hardware.
:::

## Where WCET shows up in flight code

Once you think in worst cases, the rules in the rest of this module stop looking arbitrary. Loops need provable bounds so the analyzer can price them. Recursion is banned because a cycle in the call graph has no longest path. General-purpose `new` is banned after start-up because its time varies from call to call. Interrupt handlers must be tiny because their time is added to whatever they interrupt. And because something unforeseen can still hang a task, a **[[watchdog|watchdog-bridge]]** timer resets the processor if the software stops checking in.

## Check yourself

::: check
A navigation loop runs at 400 Hz. What is its frame budget, and how many ticks is that on a 200 MHz processor?
:::

::: answer
The period is $T = 1/f = 1/400\,\mathrm{s} = 0.0025\,\mathrm{s} = 2.5\,\mathrm{ms}$. At 200 MHz the processor ticks $200 \times 10^6$ times each second, so in $2.5\,\mathrm{ms}$ it ticks $200 \times 10^6 \times 0.0025 = 500{,}000$ times. Sanity check: a 400 Hz loop is 2.5 times slower than a 1 kHz loop, so its frame should be 2.5 times the 1 kHz frame's $200{,}000$ ticks — and it is.
:::

::: check
A teammate times the attitude controller one million times on the flight board and reports "WCET = 41 µs". Name three things that could make the real worst case longer than that.
:::

::: answer
Any three of these. (1) A path the test inputs never triggered, such as a mode change or a fault response. (2) A colder cache: in flight, a different task might run first and evict the controller's data. (3) Interrupts arriving mid-task and adding their handlers' time. (4) Branch mispredictions that depend on what ran just before. (5) Other cores competing for the memory bus. A million runs shows only what those runs did, so "41 µs" is a high-water mark, not a WCET.
:::

::: check
Why can a static WCET analyzer give a bound that no test ever reaches, and why is that sometimes a problem and sometimes a gift?
:::

::: answer
The analyzer assumes the slow case whenever it cannot prove the fast one: a read that *might* miss the cache is priced as a miss, and every path in the graph counts as possible, even branch combinations the program never takes. So its longest path can exceed anything the real program does. That is a problem when the loose bound rejects a design that would really fit. It is a gift when the "impossible" path turns out to be possible — then the analysis has found a worst case testing missed. To tell which, look at the path it reports.
:::

::: check
The frame from the first example has 0.280 ms of slack. A new feature adds a task with a measured high-water mark of 0.150 ms and a static bound of 0.260 ms. The project rule is worst-case use at most 80 percent. Does it fit?
:::

::: answer
Use the worst case, the static bound. The new total is $0.720 + 0.260 = 0.980\,\mathrm{ms}$, 98 percent of the frame, and the rule allows $0.800\,\mathrm{ms}$. It does not fit: under the rule only $0.800 - 0.720 = 0.080\,\mathrm{ms}$ was free. The measured number would give $0.870\,\mathrm{ms}$ — also a fail, but it hides how badly. The feature must get faster or move to a slower rate group.
:::

## Summary

| Idea | Meaning | Fact to remember |
| --- | --- | --- |
| Real-time | the right answer by a deadline | a late answer is a wrong answer |
| Frame and period | fixed time slice for one pass of a loop | $T = 1/f$; 1 kHz gives 1 ms |
| Frame budget | the time the frame's tasks may use | add worst cases, never averages |
| Utilization, slack | used fraction; unused time | 0.720 ms of 1 ms is 72 percent, 28 percent slack |
| BCET, typical, WCET | fastest, usual, longest possible time | the budget must hold the WCET |
| Sources of variation | paths, cache, pipeline, interrupts | same input can run about 60 percent slower with a cold cache |
| High-water mark | largest measured time | real, but only for paths and inputs tried |
| Static WCET analysis | longest path through a priced control-flow graph | safe if the model is right; needs loop bounds and a finite call graph |
| Practice | static analysis plus measurement plus margin | the margin is written into requirements |

A static analyzer can only price a loop whose count it can bound. Next, in *Bounded loops*, you will make every loop's upper bound provable — and see what to do when a loop's natural exit depends on the outside world.

::: context scheduler-word The conductor of the frame
In a small flight computer the scheduler can be as simple as a table: at the start of frame 0 run tasks A, B and C; in frame 1 run A, B and D; and so on, repeating. This is called a **cyclic executive**, and it is popular in flight software because its timing is easy to reason about. Bigger systems use a **real-time operating system** (RTOS) that switches between tasks by priority. Either way, the scheduler depends on each task finishing within its WCET.
:::

::: context hertz-name A unit named after a person
The hertz is named after Heinrich Hertz, the German physicist who first produced and detected radio waves in the 1880s. One hertz means once per second, so it is the same thing as $1/\mathrm{s}$. A kilohertz (kHz) is a thousand times per second, a megahertz (MHz) a million. You meet both in this lesson: a 1 kHz control loop running on a processor clocked in hundreds of megahertz.
:::

::: context overrun What a frame overrun looks like
Each frame starts on the timer's tick. If the tasks finish early, the processor waits (the gray slack). If they run past the next tick, the next frame starts late, and its tasks are squeezed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="20" y1="40" x2="20" y2="108"/><line x1="130" y1="40" x2="130" y2="108"/>
    <line x1="240" y1="40" x2="240" y2="108"/><line x1="345" y1="40" x2="345" y2="108"/>
  </g>
  <rect x="20" y="60" width="79" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="99" y="60" width="31" height="30" fill="#e6e9ef" stroke="#6c7a93"/>
  <text x="59" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">tasks</text>
  <text x="114" y="54" font-size="11" text-anchor="middle" fill="#6c7a93">slack</text>
  <rect x="130" y="60" width="130" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="240" y="60" width="20" height="30" fill="#b4232c" stroke="#1f2a44"/>
  <text x="185" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">rare slow path</text>
  <text x="250" y="54" font-size="11" text-anchor="middle" fill="#b4232c">overrun</text>
  <rect x="260" y="60" width="85" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="302" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">starts late</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="122">0 ms</text><text x="130" y="122">1 ms</text><text x="240" y="122">2 ms</text><text x="340" y="122">3 ms</text>
  </g>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">timer ticks every 1 ms</text>
</svg>
```

Systems handle an overrun in different ways — skip the late frame, log it, or treat repeated overruns as a fault — but none of them is good news.
:::

::: context cache-picture A small fast desk and a big slow library
A cache is like the few books on your desk versus the whole library down the hall. The desk holds little, but grabbing a book from it is quick. The library holds everything, but every trip costs time. The processor copies memory to the cache in small chunks called **cache lines**, typically 64 bytes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="35" width="70" height="50" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="50" y="65" font-size="12" text-anchor="middle" fill="#ffffff">CPU</text>
  <rect x="120" y="40" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="155" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">cache</text>
  <rect x="240" y="20" width="105" height="80" fill="#e6e9ef" stroke="#1f2a44"/>
  <text x="292" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">main memory</text>
  <line x1="85" y1="60" x2="120" y2="60" stroke="#1f2a44" stroke-width="3"/>
  <line x1="190" y1="60" x2="240" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="102" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">fast</text>
  <text x="215" y="30" font-size="11" text-anchor="middle" fill="#b4232c">slow</text>
  <text x="180" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">small and near  ·  big and far</text>
</svg>
```

Many small flight microcontrollers run from on-chip memory with little or no data cache, partly because it makes timing easier to predict.
:::

::: context cycle-counter Counting ticks from inside the chip
Many processors have a register that counts clock ticks since reset. On many ARM Cortex-M microcontrollers (the M3, M4 and M7, for example) it is called `CYCCNT`, part of a debug block named the DWT (data watchpoint and trace unit). Read it before a task and after, subtract, and divide by the clock rate to get seconds: 20,000 ticks at 200 MHz is $20{,}000 / (200 \times 10^6) = 100\,\mu\mathrm{s}$. The read itself takes a few ticks, which you subtract by timing an empty section once.
:::

::: context scope-pulse Seeing time on a screen
Set a spare output pin high when the task starts and low when it ends. On an oscilloscope, the pin draws a pulse, and its width is the task's execution time. The trace also shows jitter: how much the start and end wobble from frame to frame.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <polyline points="15,80 60,80 60,35 150,35 150,80 200,80 200,35 290,35 290,80 345,80" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="20" x2="150" y2="20" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="60,20 68,16 68,24" fill="#b4232c"/>
  <polygon points="150,20 142,16 142,24" fill="#b4232c"/>
  <text x="105" y="14" font-size="11" text-anchor="middle" fill="#b4232c">execution time</text>
  <text x="60" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">start</text>
  <text x="150" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">end</text>
  <text x="245" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">next frame</text>
</svg>
```

It costs two instructions in the code and needs no software to record anything, which is why it is a favorite first check on new hardware.
:::

::: context ait-airbus Timing analysis in real certification
AbsInt, a German company, makes the aiT family of static WCET analyzers. Airbus has used aiT to check the timing of flight-control software, including on the A380, and the tool is often cited in aircraft certification. The underlying method, **abstract interpretation**, reasons about all possible machine states at once instead of running one input at a time. You will meet the same idea again in the static-analysis lesson at the end of this module, where it proves the absence of run-time errors instead of timing bounds.
:::

::: context multicore-interference When cores share a road
Two cores on one chip usually share a cache and a path to main memory. When core B floods memory with requests, core A's reads wait in line, and A's tasks slow down even though nothing in A changed. This is **interference**, and it is hard to bound because it depends on what the *other* core is doing. Aviation authorities have written special guidance for certifying multicore processors — the FAA's position paper CAST-32A was an early one. Some flight projects simply turn off the extra cores, or give each core its own slice of memory time.
:::

::: context watchdog-bridge The last line of defense against a hang
A watchdog is a hardware timer that counts down. The software resets it — "pets" it — regularly. If a task gets stuck in an endless loop and stops petting it, the timer reaches zero and restarts the processor. It does not prevent a timing failure; it limits how long one can last. Lesson 6 covers watchdogs, heartbeats and health monitoring in detail.
:::
