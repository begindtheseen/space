---
id: l09-profiling-with-perf-and-benchmarks
title: Finding where the time goes
minutes: 28
covers:
  - perf stat (IPC, cache misses, branch misses), perf record/report, flame graphs
  - hyperfine for wall clock, Google Benchmark for microbenchmarks
---

Your family is late for school every morning. Everyone has a theory. Dad blames the shower. Your sister blames the toaster, which is slow. Then someone writes down the time at every step for one week, and the answer is none of those: ten minutes go to hunting for shoes. Buying a faster toaster would have cost money and saved about thirty seconds.

Programs are the same. When code is too slow, everyone has a guess about which part is slow, and the guesses are usually wrong. **Profiling** means measuring where a program really spends its time, instead of guessing. A **profiler** is the tool that does the measuring.

On a spacecraft, speed is not a luxury. A guidance loop that runs 100 times a second has 10 milliseconds per pass, every pass. On the ground, a Monte Carlo campaign that takes a week instead of a night limits how many designs a team can try. This lesson treats speed the way Lesson 01 treated bugs: as an experiment, where the measurement decides.

## Measure first, then change one thing

Lesson 01's loop was observe, hypothesize, predict, test. Performance work uses the same loop, with a stopwatch as the instrument.

::: key
**Why profile before optimizing?** Engineers guess wrong about hotspots most of the time, and optimization always costs readability. A profile turns the work into measurement-driven engineering, and gives you the before number you need to prove the after number.
:::

A **hotspot** is the small part of the code where most of the time goes, like the shoe hunt.

Write down three numbers for every speed-up you try:

1. **Baseline**: how long it takes now, measured.
2. **Hypothesis**: where you think the time goes, and how much you expect to save, written *before* you look at a profile.
3. **After**: how long it takes with one change, measured the same way.

Writing the hypothesis first keeps you honest. After seeing the profile, every guess looks right.

Two kinds of time matter. **Wall-clock time** is what a stopwatch on the [[wall|wall-clock]] would show from start to finish. **CPU time** is how long a processor actually worked on your program, split into **user** time (your own code and libraries) and **system** time (the operating system working for you, for example reading files). A program that waits on a disk or a network has much more wall-clock time than CPU time.

## A program to speed up

Here is the program this lesson follows. It moves a satellite around a 400 km circular orbit in steps of 0.1 s, a million steps in all. After each step it keeps the newest radius in a window of the last 4,096 values, and checks how fast the radius is changing using the two newest samples. For a circular orbit that rate should stay close to zero.

```cpp
// climb.cpp: propagate a circular low Earth orbit for 1,000,000 steps and
// keep the last 4096 radii for a "rate of change of radius" check.
#include <cmath>
#include <cstdio>
#include <vector>

const double MU = 3.986e14;             // Earth's GM, m^3/s^2
const double DT = 0.1;                  // time step, s
const int N = 4096;                     // samples kept in the window

struct State { double x, y, vx, vy; };

// One semi-implicit Euler step under point-mass gravity.
State step(State s) {
    double r = std::sqrt(s.x * s.x + s.y * s.y);
    double a = -MU / (r * r * r);
    s.vx += a * s.x * DT;
    s.vy += a * s.y * DT;
    s.x += s.vx * DT;
    s.y += s.vy * DT;
    return s;
}

// Rate of change of radius from the two newest samples, m/s.
double radial_rate(std::vector<double> window, int newest) {
    int before = (newest + N - 1) % N;
    return (window[newest] - window[before]) / DT;
}

int main() {
    const double r0 = 6.771e6;                   // 400 km altitude
    State s{r0, 0.0, 0.0, std::sqrt(MU / r0)};
    std::vector<double> window(N, r0);
    double worst = 0.0;
    for (int k = 0; k < 1000000; ++k) {
        s = step(s);
        window[k % N] = std::sqrt(s.x * s.x + s.y * s.y);
        worst = std::fmax(worst, std::fabs(radial_rate(window, k % N)));
    }
    std::printf("largest radial rate: %.4f m/s\n", worst);
}
```

```text
$ g++ -O2 -g -fno-omit-frame-pointer -o climb climb.cpp
$ ./climb
largest radial rate: 0.4347 m/s
```

Make a guess before reading on. Most people point at `step`: it has a square root and a division, the slowest arithmetic a processor does. Write it down. **Hypothesis: `step` is more than half the run time.**

The build flags matter. `-O2` turns on optimization, because timing an unoptimized build measures the wrong program. `-g` keeps function names and line numbers for the profiler, without slowing the code. `-fno-omit-frame-pointer` keeps one register pointing at each function's stack frame, so a profiler can walk from a function back to its caller quickly.

## Wall-clock timing with hyperfine

The shell's `time` command runs a program once, and one run can be off by a lot if something else was busy. **hyperfine** is a command-line benchmarking tool, written in Rust, that runs a command many times and reports the average and the spread. `--warmup 2` does two untimed runs first, so files and caches are warm. `--runs 20` sets the number of timed runs.

::: example Baseline for climb
```text
$ hyperfine --warmup 2 --runs 20 ./climb
Benchmark 1: ./climb
  Time (mean ± σ):     930.9 ms ±  92.7 ms    [User: 929.2 ms, System: 1.4 ms]
  Range (min … max):   883.2 ms … 1320.7 ms    20 runs

  Warning: Statistical outliers were detected. Consider re-running this
  benchmark on a quiet system without any interferences from other programs.
```
(hyperfine 1.20.0.) The **mean** of the 20 runs is 930.9 ms. **σ**, read "sigma", is the **standard deviation**, a typical distance of one run from the mean: 92.7 ms. User time, 929.2 ms, is nearly all of the wall-clock time, so the program is computing, not waiting. The **range** gives the fastest and slowest runs.

Why is σ so big? The slowest run is $1320.7 - 930.9 = 389.8$ ms above the mean, more than four σ. Something else on the computer probably slowed that run, and hyperfine warns about it. The minimum, 883.2 ms, is the best estimate of the cost when nothing interferes.

Sanity check: a million steps in 0.93 s is 0.93 µs per step. For a few multiplications and one square root that seems slow, a hint worth keeping.
:::

Two more options are worth knowing: `--prepare 'cmd'` runs a command before every timed run, and `--export-markdown results.md` saves the table for your notes. Given two or more commands, hyperfine compares them, as you will see below.

::: warning Compare like with like
Time the same build, on the same input and computer, one after the other. A laptop on battery or a busy server can shift every number by 20% or more.
:::

## Counting what the processor does: perf stat

A stopwatch says how long. It does not say *why*. For that, Linux has **perf**, the standard profiler that comes with the Linux kernel. Its simplest mode, `perf stat`, runs a program and reads the processor's **hardware counters**: tiny counters built into the chip that count events such as clock ticks and finished instructions.

```text
$ perf stat ./climb
$ perf stat -e cycles,instructions,cache-references,cache-misses,branches,branch-misses ./climb
```

The first line prints a default set of counters; the second, with `-e` for "events", picks which to count. perf prints one line per counter, with a helpful ratio after a `#` sign.

- **cycles**: ticks of the processor's clock, 3 billion per second at 3 GHz.
- **instructions**: machine instructions that finished.
- **IPC**, **instructions per cycle**: instructions divided by cycles, printed as "insn per cycle". A well-fed modern core finishes several per cycle, because it works on many at once, like an [[assembly line|pipeline]]. An IPC well below 1 means most cycles are spent waiting.
- **cache-misses**: times the data was not in the fast **cache** next to the core and had to come from farther away, shown as a percentage of **cache-references**.
- **branch-misses**: times the processor guessed wrong which way an `if` or a loop would go, shown as a percentage of all **branches**.

To picture cache misses, think of cooking: the counter is instant, the fridge takes a few steps, the grocery store half an hour. The processor has the same layers, the **[[memory hierarchy|memory-hierarchy]]**: registers, caches called L1, L2 and L3, then main memory, RAM. A trip to RAM costs on the order of 100 nanoseconds, hundreds of cycles. A loop that keeps going to the store is slow however few instructions it has.

Branch misses come from guessing. The processor does not wait to learn which way an `if` goes; it guesses and works ahead. A wrong guess throws that work away, roughly 15 to 20 cycles. A branch that almost always goes the same way costs almost nothing; one on random data can be wrong half the time.

::: key
**perf stat shows a very low IPC and high cache-miss rate. What does that suggest?** The loop is memory-bound rather than compute-bound: the CPU is stalling on data. Look at layout and access patterns (structure of arrays vs array of structures, stride, working-set size) rather than at instruction count.
:::

Three words from that card. **Stride** is how far apart in memory two elements you touch one after the other are. **Working set** is how much memory a loop touches over and over. And the two layouts, **[[structure of arrays versus array of structures|soa-aos]]**, are two ways to store many objects that each have several fields.

::: example Reading a perf stat line
Suppose `perf stat` on a filter loop reports 3,000,000,000 cycles, 1,200,000,000 instructions, 27,000,000 cache misses out of 60,000,000 cache references, and 1,000,000 branch misses out of 200,000,000 branches. (These are round numbers chosen for the arithmetic, not a real run.)

IPC is instructions over cycles:

$$\mathrm{IPC} = \frac{1.2 \times 10^{9}}{3.0 \times 10^{9}} = 0.40$$

The cache-miss rate is misses over references: $27 / 60 = 0.45$, so 45%. The branch-miss rate is $1 / 200 = 0.005$, so 0.5%.

An IPC of 0.40 means fewer than one instruction finishes every two cycles, and almost half the cache checks miss. Branches are fine: half a percent is well predicted. The verdict is memory-bound. Cleverer arithmetic would not help, because the core is waiting for data, not for arithmetic. A better data layout and walking order would.
:::

Linux controls who may read the counters through a setting called [[perf_event_paranoid|perf-permissions]]. Inside some virtual machines the hardware counters are not available at all, and perf can only count software events such as `task-clock`.

## Where the time goes: perf record and perf report

`perf stat` gives totals. To learn *which function* is hot, you **sample**: `perf record` interrupts the program many times per second and notes where it was, including the chain of calls that got there. Where the program is found most often is where it spends most of its time.

```text
$ perf record -g ./climb          # sample, with call stacks (-g); writes perf.data
$ perf report                     # interactive table, hottest first
$ perf report --no-children       # sort by time spent in each function itself
```

`perf report` shows two percentages when you record with `-g`. **Self** is the share of samples where that function was the one running. **Children** (also called inclusive) adds the time spent in everything it called. `main` always has nearly 100% children, because everything runs inside it, and often a small self. The hotspot is where self is large.

You can do the same thing slowly with gdb: attach, print the backtrace, detach, repeat. That trick, the [[poor man's profiler|poor-mans-profiler]], shows that sampling has no magic in it.

::: example Sixty samples of climb
The call stack of a long-running `climb` was sampled 60 times, a fifth of a second apart, and identical stacks were counted. Written from the outermost call to the innermost, with the library's long template names shortened:

```text
56  main ; std::vector<double> copy constructor ; ... ; __memcpy_avx512_unaligned_erms
 2  main ; std::vector<double> destructor ; free
 1  main ; std::vector<double> copy constructor ; ... ; malloc
 1  main ; step
```

Count. $56 + 2 + 1 + 1 = 60$. Copying a vector, allocating memory for the copy, and freeing it account for $59$ of $60$ samples:

$$\frac{59}{60} \approx 0.983 = 98.3\%$$

`step`, the function with the square root, appears once: $1/60 \approx 1.7\%$. The hypothesis "more than half" is wrong by a wide margin.

Where does the copy come from? In `radial_rate(std::vector<double> window, int newest)` the vector is passed **by value**, so every call copies all 4,096 doubles, $4096 \times 8 = 32{,}768$ bytes, and throws the copy away. A million calls copy about 32.8 billion bytes to read two numbers each time.

Sanity check: 32.8 GB in about 0.93 s is about 35 GB/s, a believable speed for copying data that stays in the fast caches. The numbers hang together.
:::

That profile is the textbook case for the next card.

::: key
**Your profile says 60 percent of time is in memcpy. What do you investigate?** Who is calling it and why: unnecessary copies of large objects, pass-by-value at an interface, vector reallocation from a missing reserve, or an expression producing temporaries. memcpy itself is rarely the problem.
:::

**memcpy** is the C library function that copies a block of bytes, and it is already about as fast as a copy can be. The fix is fewer copies, and the call graph that `-g` records points you at the caller making them.

## Flame graphs

A **flame graph** turns all the sampled stacks into one picture. Here is how to read one. Each box is a function. Its **width** is the share of samples that had that function on the stack, so wide means expensive. A box sits **on top of** the function that called it, so `main` is the wide base. The **top edge** shows who was actually running: a wide box with nothing above it is burning time itself. The warm colors are random and mean nothing. Left-to-right order is alphabetical, **not time**.

You make one from a perf recording with the free FlameGraph scripts by Brendan Gregg, who invented the picture:

```text
$ perf record -F 99 -g ./climb
$ perf script > out.perf
$ ./stackcollapse-perf.pl out.perf > out.folded
$ ./flamegraph.pl out.folded > climb.svg
```

`-F 99` asks for 99 samples per second, an odd number so sampling does not march in step with anything that repeats 100 times a second. The middle script **folds** each stack into one line, like the sixty-sample list above; the last draws an SVG you open in a web browser. For `climb`, the [[flame graph|flame-graph-picture]] is one enormous tower over the vector copy, with a sliver for `step` at the edge.

::: warning A flame graph is not a timeline
Two boxes side by side did not necessarily run one after the other. They are sorted by name. If you need "what happened when", you need a trace, which records time stamps, not a profile.
:::

## The fix, and the after number

The profile says "stop copying". Pass the vector by **const reference**, read "const ampersand": the function gets the caller's vector itself, and `const` promises not to change it.

```cpp
double radial_rate(const std::vector<double>& window, int newest) {
```

One line changes, and the output is the same, `largest radial rate: 0.4347 m/s`. That matters: a speed-up that changes the result is a bug.

::: example Measuring the change
hyperfine with two commands runs both and compares them:

```text
$ hyperfine --warmup 2 ./climb ./climb_ref
Benchmark 1: ./climb
  Time (mean ± σ):     935.5 ms ±  96.5 ms    [User: 933.7 ms, System: 1.6 ms]
  Range (min … max):   895.3 ms … 1209.8 ms    10 runs

Benchmark 2: ./climb_ref
  Time (mean ± σ):      32.6 ms ±   0.4 ms    [User: 31.3 ms, System: 1.3 ms]
  Range (min … max):    31.9 ms …  33.6 ms    90 runs

Summary
  ./climb_ref ran
   28.67 ± 2.98 times faster than ./climb
```

The ratio of the means is $935.5 / 32.6 \approx 28.7$, matching the summary line.

Now the three numbers for the notebook:

- Baseline: 935.5 ms.
- Hypothesis: `step` is more than half the time. Wrong: it was about 2% of the samples.
- After: 32.6 ms, 28.7 times faster, same output.

Sanity check against the profile: removing 59 of 60 samples should leave about one sample's worth, $935.5 / 60 \approx 15.6$ ms. The measurement, 32.6 ms, is two samples' worth. With only 60 samples, one sample more or less moves the prediction by 15.6 ms, so they agree as well as 60 samples can.
:::

That is the whole method: a written guess, a profile that overturned it, one change, a measured before and after. [[Amdahl's law|amdahl]] explains why the profile had to come first.

## Microbenchmarks with Google Benchmark

hyperfine times whole programs. To time one small function, say two ways to normalize a quaternion, you write a **microbenchmark**, and **Google Benchmark** is the standard C++ library for it. It runs your code in a loop, picks how many repeats it needs for a stable number, and reports the time per repeat.

A benchmark is a function that takes a `benchmark::State&`. The code inside `for (auto _ : state)` is what gets timed. `BENCHMARK(name)` registers it, and `BENCHMARK_MAIN()` writes the `main` function for you.

```text
$ g++ -O2 -std=c++17 bench.cpp -lbenchmark -lpthread -o bench
$ ./bench
```

The trap is that the optimizer is smarter than your benchmark. If the compiler can prove a result is never used, it may delete the code that makes it: [[dead code elimination|dead-code]]. Then you time nothing. Google Benchmark gives you two tools against this.

- `benchmark::DoNotOptimize(x)` tells the compiler "someone looks at `x`", so the work that produces `x` must really happen.
- `benchmark::ClobberMemory()` tells the compiler "all memory may be read now", so writes to memory before it must really be done.

::: example A benchmark that timed nothing
Two benchmarks that add up 1,000 doubles. The first never uses the sum. The second hands it to `DoNotOptimize`:

```cpp
// Part of bench.cpp; the file starts with #include <benchmark/benchmark.h>
// and <vector>, and ends with BENCHMARK_MAIN();
static void BM_SumUnused(benchmark::State& state) {
    std::vector<double> v(1000, 1.5);
    for (auto _ : state) {
        double sum = 0.0;
        for (double x : v) sum += x;
    }
}
BENCHMARK(BM_SumUnused);

static void BM_SumKept(benchmark::State& state) {
    std::vector<double> v(1000, 1.5);
    for (auto _ : state) {
        double sum = 0.0;
        for (double x : v) sum += x;
        benchmark::DoNotOptimize(sum);
    }
}
BENCHMARK(BM_SumKept);
```

The same file also walks a $2048 \times 2048$ matrix of doubles (32 MiB) in two orders: row by row, where the next element is right next door in memory, and column by column, where each step jumps $2048 \times 8 = 16{,}384$ bytes. Output with Google Benchmark 1.9.5, trimmed:

```text
Benchmark               Time             CPU   Iterations
---------------------------------------------------------
BM_SumUnused        0.000 ns        0.000 ns   1000000000000
BM_SumKept            642 ns          642 ns      1081141
BM_RowOrder          2.94 ms         2.94 ms          234
BM_ColumnOrder       21.1 ms         21.1 ms           34
```

Zero nanoseconds and a trillion iterations: adding 1,000 numbers cannot take zero time, so the compiler deleted the loop. The second line is the real cost, 642 ns.

Now the matrix. Both walks do the same $2048^2 = 4{,}194{,}304$ additions, yet column order takes $21.1 / 2.94 \approx 7.2$ times longer. Same work, very different time: the memory-bound signature. `perf stat` on the column walk would show far more cache misses and a much lower IPC. The fix is walking memory in the order it is laid out.
:::

The same trap bites code whose job is writing memory. A loop that fills a local buffer nobody reads was also timed at 0.000 ns. With `DoNotOptimize(buffer)` before the loop and `ClobberMemory()` after it, the same 256 writes took 72.1 ns.

::: warning Microbenchmarks flatter your code
A microbenchmark runs the same small input over and over, so its data stays in the fastest cache and its branches become perfectly predictable. The real program may be much slower. Use a microbenchmark to compare two versions of one function, then confirm the win with a whole-program measurement.
:::

## Check yourself

::: check
A teammate says, "The attitude filter is slow because of the matrix inverse. I'll rewrite it with a faster algorithm." What do you ask for before they start, and why?
:::

::: answer
Ask for a measured baseline and a profile. Hotspot guesses are often wrong, and a rewrite costs readability. A profile (`perf record -g` then `perf report`, or a flame graph) shows what share of the time the inverse really takes. If it is 5%, even an infinitely fast inverse saves at most 5%. And the baseline is needed to prove afterwards that the rewrite helped.
:::

::: check
hyperfine reports `Time (mean ± σ): 120.0 ms ± 1.5 ms [User: 30.0 ms, System: 5.0 ms]`. What is this program probably doing most of the time, and would a faster algorithm help much?
:::

::: answer
CPU time is $30 + 5 = 35$ ms, but wall-clock time is 120 ms. For about $120 - 35 = 85$ ms the program is waiting, probably for a disk, a network or a sleep. A faster algorithm could shrink at most the 30 ms of user time; the bigger win is in the waiting.
:::

::: check
`perf stat` shows 8,000,000,000 instructions and 2,500,000,000 cycles, with 0.2% cache misses. Compute the IPC. Is this loop memory-bound?
:::

::: answer
$\mathrm{IPC} = \frac{8.0 \times 10^9}{2.5 \times 10^9} = 3.2$ instructions per cycle, and almost every cache check hits. The loop is compute-bound, not memory-bound. To speed it up you need fewer instructions (a better algorithm, less repeated work), not a new data layout.
:::

::: check
In a flame graph, a box labeled `parse_packet` is wide, and a box labeled `crc32` sits on top of it, covering almost all of its width. To its left sits a box labeled `apply_command`. Where is the time going, and did `apply_command` run before `parse_packet`?
:::

::: answer
Almost all the time spent under `parse_packet` is spent inside `crc32`, which it calls: `crc32` is the hotspot, and `parse_packet` has little self time of its own. The picture cannot say which ran first. Left-to-right order in a flame graph is alphabetical, and "apply" sorts before "parse", so `apply_command` would sit on the left whatever the order in time.
:::

::: check
A microbenchmark of a new quaternion normalize reports 0.3 ns per call, ten times faster than the old one. What do you check first?
:::

::: answer
That the result is used. 0.3 ns is about one clock cycle, less than a square root takes, so the compiler may have deleted the work. Pass the output to `benchmark::DoNotOptimize`, add `benchmark::ClobberMemory()` if the function writes through a pointer, and re-run. Then confirm any win with a whole-program timing.
:::

## Summary

| Tool or idea | What it tells you | How to use it |
| --- | --- | --- |
| Baseline, hypothesis, after | proof that a change helped | write the guess before profiling; change one thing |
| hyperfine | wall-clock mean, σ, min/max, user/system | `hyperfine --warmup 2 ./a ./b` |
| perf stat | cycles, instructions, IPC, cache and branch misses | low IPC + many cache misses = memory-bound |
| perf record / report | which functions are hot, and who called them | `perf record -g`, then `perf report` |
| Flame graph | all stacks in one picture | width = share of samples; order is alphabetical |
| Hot memcpy | too many copies somewhere | find the caller: pass by value, missing reserve |
| Google Benchmark | time per call of a small function | `DoNotOptimize` results, `ClobberMemory` writes |

The last lesson of the module moves from "how fast" to "what happened": designing logs and flight-side ring buffers so that, after a flight, one dataset is enough to explain an anomaly nobody can rerun.

::: context wall-clock Why "wall clock"
The name is literal: the time a clock on the wall would measure between start and finish, including every moment the program spent waiting. Operating systems keep a separate count of processor time for each program because many programs share one computer. The shell's `time` command prints both: `real` is wall-clock time, and `user` and `sys` are CPU time. For flight software the number that matters is usually wall clock, because the deadline, "finish before the next 10 ms tick", is on the wall.
:::

::: context pipeline A factory line inside the chip
A processor core works like a car factory. One station fetches an instruction, the next decodes it, another does the arithmetic, another writes the result. While one instruction is in the arithmetic station, the next is being decoded and the one after that fetched. Modern cores also have several lines side by side, so they can finish several instructions per clock tick. When an instruction needs data that is not there yet, the stations behind it stall, and IPC drops.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="11" fill="#6c7a93">clock tick</text>
  <text x="130" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="190" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="250" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">3</text>
  <text x="310" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="20" y="46" font-size="11" fill="#1f2a44">instr A</text>
  <text x="20" y="80" font-size="11" fill="#1f2a44">instr B</text>
  <text x="20" y="114" font-size="11" fill="#1f2a44">instr C</text>
  <rect x="102" y="30" width="56" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="130" y="46" font-size="11" fill="#1f2a44" text-anchor="middle">fetch</text>
  <rect x="162" y="30" width="56" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="190" y="46" font-size="11" fill="#1f2a44" text-anchor="middle">decode</text>
  <rect x="222" y="30" width="56" height="24" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="250" y="46" font-size="11" fill="#ffffff" text-anchor="middle">execute</text>
  <rect x="162" y="64" width="56" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="190" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">fetch</text>
  <rect x="222" y="64" width="56" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="250" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">decode</text>
  <rect x="282" y="64" width="56" height="24" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="310" y="80" font-size="11" fill="#ffffff" text-anchor="middle">execute</text>
  <rect x="222" y="98" width="56" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="250" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">fetch</text>
  <rect x="282" y="98" width="56" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="310" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">decode</text>
  <text x="20" y="142" font-size="11" fill="#6c7a93">three instructions in flight at tick 3</text>
</svg>
```
:::

::: context memory-hierarchy Counter, fridge, store
Each layer of memory is bigger and slower than the one before. Typical sizes on a current desktop or server core: L1 data cache a few tens of KiB, L2 one or two MiB, L3 tens to hundreds of MiB shared by all cores, then gigabytes of RAM. Typical waits: about a nanosecond for L1, a few for L2, tens for L3, around a hundred for RAM. Memory moves between layers in blocks of 64 bytes called cache lines, which is why reading the element next door is nearly free and jumping 16 KiB is not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="12" width="60" height="24" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="180" y="28" font-size="11" fill="#ffffff" text-anchor="middle">registers</text>
  <rect x="125" y="42" width="110" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">L1 cache</text>
  <rect x="95" y="72" width="170" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="88" font-size="11" fill="#1f2a44" text-anchor="middle">L2 cache</text>
  <rect x="60" y="102" width="240" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">L3 cache</text>
  <rect x="20" y="132" width="320" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="148" font-size="11" fill="#1f2a44" text-anchor="middle">main memory (RAM), about 100 ns</text>
  <text x="20" y="28" font-size="11" fill="#6c7a93">small, fast</text>
  <text x="340" y="28" font-size="11" fill="#6c7a93" text-anchor="end">big, slow</text>
  <line x1="320" y1="34" x2="320" y2="124" stroke="#6c7a93"/>
  <polygon points="315,120 325,120 320,128" fill="#6c7a93"/>
</svg>
```
:::

::: context soa-aos Two ways to store many satellites
Say you track 10,000 debris objects, each with a position, a velocity and a name. An **array of structures** (AoS) stores one whole object after another: position, velocity, name, position, velocity, name. A **structure of arrays** (SoA) keeps one array of all positions, another of all velocities, another of all names. If a loop only updates positions, SoA packs every byte it needs side by side, so each 64-byte cache line brought in is fully used. With AoS, most of each cache line is velocities and names the loop never reads. Neither is always better; the loop decides.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="11" fill="#1f2a44">array of structures</text>
  <rect x="20" y="24" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="60" y="24" width="40" height="22" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="100" y="24" width="40" height="22" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="140" y="24" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="180" y="24" width="40" height="22" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="220" y="24" width="40" height="22" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="260" y="24" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="300" y="24" width="40" height="22" fill="#ffffff" stroke="#1f2a44"/>
  <text x="40" y="39" font-size="11" fill="#ffffff" text-anchor="middle">pos</text>
  <text x="80" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">vel</text>
  <text x="120" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">name</text>
  <text x="160" y="39" font-size="11" fill="#ffffff" text-anchor="middle">pos</text>
  <text x="200" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">vel</text>
  <text x="240" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">name</text>
  <text x="280" y="39" font-size="11" fill="#ffffff" text-anchor="middle">pos</text>
  <text x="320" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">vel</text>
  <text x="20" y="72" font-size="11" fill="#1f2a44">structure of arrays</text>
  <rect x="20" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="60" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="100" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="140" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="180" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="220" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="260" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="300" y="78" width="40" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="180" y="93" font-size="11" fill="#ffffff" text-anchor="middle">pos pos pos pos pos pos pos pos</text>
  <text x="20" y="115" font-size="11" fill="#6c7a93">blue = bytes a position-only loop needs</text>
</svg>
```
:::

::: context perf-permissions Who may read the counters
`/proc/sys/kernel/perf_event_paranoid` is a Linux setting that decides how much an ordinary user may measure. Higher numbers are stricter: at 2, a common default, users may profile their own programs in user space but not the kernel; some distributions go further and block unprivileged use entirely. Reading it is harmless: `cat /proc/sys/kernel/perf_event_paranoid`. Changing it needs administrator rights, and on shared machines that is a decision for whoever runs the machine, since counters can leak information between users.
:::

::: context poor-mans-profiler Sampling with a debugger
The sixty samples in this lesson were taken the slow, simple way: start the program, and sixty times attach gdb with `gdb -p <pid> -batch -ex bt`, save the backtrace, and wait a fifth of a second. Counting identical backtraces gives a profile. The trick has been passed around for years under the name "poor man's profiler", and it works on any machine where gdb works, even when perf is not available. perf does the same thing thousands of times per second with much less disturbance, which is why it is the tool of choice when you have it.
:::

::: context flame-graph-picture The flame graph for climb
Drawn from the sixty samples: 56 in memcpy, 1 in malloc, 2 freeing the copy, 1 in `step`. Each sample is the same width, so memcpy's box is 56/60 of the full width. `step` gets a sliver at the right, because "step" sorts after "std". The wide flat top of memcpy is the signature of a hotspot: a box with nothing above it is doing the work itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="96" width="320" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">main (60)</text>
  <rect x="20" y="72" width="304" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="172" y="87" font-size="11" fill="#1f2a44" text-anchor="middle">std::vector copy constructor (57)</text>
  <rect x="324" y="72" width="10.67" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="334.67" y="72" width="5.33" height="22" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="20" y="48" width="298.67" height="22" fill="#b4232c" stroke="#1f2a44"/>
  <text x="169" y="63" font-size="11" fill="#ffffff" text-anchor="middle">memcpy (56)</text>
  <rect x="318.67" y="48" width="5.33" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="324" y="48" width="10.67" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="340" y="30" font-size="11" fill="#1f2a44" text-anchor="end">malloc 1, free 2, step 1</text>
  <line x1="321" y1="34" x2="321" y2="47" stroke="#6c7a93"/>
  <line x1="337" y1="34" x2="337" y2="71" stroke="#6c7a93"/>
  <text x="20" y="18" font-size="11" fill="#6c7a93">width = share of samples; up = called by the box below</text>
</svg>
```
:::

::: context amdahl The limit on any speed-up
Gene Amdahl, a computer designer at IBM, stated the rule in 1967. If a fraction $p$ of the run time is in the part you speed up by a factor $s$, the whole program speeds up by

$$\frac{1}{(1-p) + p/s}$$

Make that part infinitely fast and you still get at most $1/(1-p)$. With `step` at $p \approx 0.017$, perfecting it could never beat about 1.7%. With the copying at $p \approx 0.983$, the ceiling is about 60 times. That is why the profile comes first: it tells you which $p$ is big.
:::

::: context dead-code Why the compiler may delete your loop
The C++ standard lets a compiler make any change that does not alter what the program visibly does: its output, its reads and writes of `volatile` objects, and similar. People call this the "as-if" rule. A sum that is never printed, stored or returned affects nothing visible, so the optimizer is allowed to remove it, and at `-O2` it usually does. This is good for real programs and a trap for benchmarks. `DoNotOptimize` works by passing the value through a tiny piece of inline assembly that the compiler cannot see into, so it must assume the value is used.
:::
