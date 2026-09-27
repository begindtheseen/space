---
id: l13-profiling-and-static-analysis
title: Profiling and static analysis: perf, valgrind, clang-tidy and cppcheck
minutes: 26
covers:
  - profiling and sanitizers: perf, valgrind, ASan/UBSan
  - static analysis: clang-tidy, cppcheck
---

There are two ways to improve an essay. You can read it aloud to a friend with a stopwatch and notice where you stumble. Or you can hand it to a proofreader who never hears it read, but marks every misspelled word. Both help, and they find different problems.

Flight code gets the same two treatments. The first question is *where does the time go* — not on average, but in the worst cycle, the one the scheduler must plan for. A **profiler** answers it: a tool that watches the program run and reports where the time and memory go. The second question is *what is wrong with code that has not run yet* — the branch no test takes, the copy nobody noticed. A **static analyzer** answers it: a tool that reads the source code without ever running it.

Flight-software projects run both on every change; NASA's **[[tenth Power of Ten rule|power-of-ten-rule-10]]** demands it. The previous lesson covered the **sanitizers**, which build checks into the program so it catches undefined behavior while it runs. This lesson covers the rest: a timing harness you write yourself, `perf`, valgrind — including the heap profiler that proves a loop never allocates, as the module's first exercise asks — and the static analyzers clang-tidy and cppcheck.

The valgrind and clang-tidy output below is real, from the programs shown. `perf` and cppcheck were not installed on the machine these lessons were written on, so for those two you get the commands and how to read them.

## Measure before you speed anything up

Guesses about where a program is slow are usually wrong. Three habits turn a guess into a measurement.

- **Measure an optimized build.** Template-heavy code like Eigen runs many times slower at `-O0` than in the build that flies.
- **Measure on hardware like the target.** Caches and clocks differ.
- **Record every cycle, then look at the worst.** A real-time loop must finish *every* cycle before its deadline, so what matters is the maximum and the rare slow cycles near it.

Those rare slow cycles are the **tail** of the distribution. We name points in it with **[[percentiles|percentile]]**. The **median** is the middle value: half the cycles were faster, half slower. The **99th percentile**, written p99 and read "p ninety-nine", is the time that 99 out of 100 cycles beat. The 99.9th percentile, p99.9, is the time that 999 out of 1000 cycles beat.

::: example A timing harness that keeps the tail
This program times 100 000 RK4 steps of lesson 10's two-body problem, one at a time.

```cpp
#include <Eigen/Dense>
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdio>

using Clock = std::chrono::steady_clock;
using Vector6d = Eigen::Matrix<double, 6, 1>;
constexpr double kMu = 3.986004418e14;  // Earth's mu, m^3/s^2

// RAII timer: measures from construction to destruction and records the result.
class ScopedTimer {
 public:
  explicit ScopedTimer(double& out_ns) : out_(out_ns), start_(Clock::now()) {}
  ~ScopedTimer() {
    out_ = std::chrono::duration<double, std::nano>(Clock::now() - start_).count();
  }

 private:
  double& out_;
  Clock::time_point start_;
};

Vector6d two_body(double, const Vector6d& x) {
  const Eigen::Vector3d r = x.head<3>();
  const double r3 = std::pow(r.norm(), 3);
  Vector6d dx;
  dx << x.tail<3>(), -kMu / r3 * r;
  return dx;
}

template <typename State, typename Deriv>
State rk4_step(const State& x, double t, double dt, Deriv&& f) {
  const State k1 = f(t, x);
  const State k2 = f(t + 0.5 * dt, x + (0.5 * dt) * k1);
  const State k3 = f(t + 0.5 * dt, x + (0.5 * dt) * k2);
  const State k4 = f(t + dt, x + dt * k3);
  return x + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

int main() {
  constexpr int kCycles = 100000;
  static std::array<double, kCycles> cycle_ns{};  // static: fixed storage, not the stack
  Vector6d x;
  x << 6778137.0, 0, 0, 0, 7668.56, 0;
  for (int i = 0; i < kCycles; ++i) {
    ScopedTimer timer(cycle_ns[i]);
    x = rk4_step(x, 0.0, 0.1, two_body);
  }
  std::sort(cycle_ns.begin(), cycle_ns.end());
  double sum = 0.0;
  for (double v : cycle_ns) sum += v;
  std::printf("mean %.0f ns  median %.0f ns  p99 %.0f ns  p99.9 %.0f ns  max %.0f ns\n",
              sum / kCycles, cycle_ns[kCycles / 2], cycle_ns[kCycles * 99 / 100],
              cycle_ns[kCycles * 999 / 1000], cycle_ns[kCycles - 1]);
  std::printf("(x[0] = %.1f m)\n", x[0]);
  return 0;
}
// g++ -std=c++20 -Wall -Wextra -O2 -I/usr/include/eigen3 timing.cpp -o timing
// Output, two runs on a desktop Linux machine:
// mean 276 ns  median 267 ns  p99 295 ns  p99.9 442 ns  max 41420 ns
// (x[0] = 2119839.7 m)
// mean 270 ns  median 254 ns  p99 322 ns  p99.9 416 ns  max 139302 ns
// (x[0] = 2119839.7 m)
```

**How it works.** `ScopedTimer` is lesson 3's RAII applied to a clock. Created, it reads the **[[steady_clock|steady-clock]]**; destroyed at the end of the loop body, it reads it again and writes the difference into its slot. The slots are a `static` array, set aside before the program starts, so measuring allocates nothing. Printing `x[0]` stops the optimizer from deleting the unused computation.

**Reading the numbers.** In the first run the median step costs 267 ns, and the p99 is 295 ns, only about 10% more. Tidy so far. But the maximum is 41 420 ns, which is $41420 / 267 \approx 155$ times the median; in the second run it is about 548 times. That is not the arithmetic. It is the platform: the operating system pausing the program, an interrupt, a memory page being fetched. A real-time operating system shrinks these pauses but never removes them, and a loop planned around the mean of 276 ns would miss its deadline the first time one hit.

**Sanity check.** Both runs end at the same `x[0]`: same work, different timing. Report the maximum and the p99.9, and find out what causes them.
:::

::: warning Three ways benchmarks lie
An unoptimized build measures the compiler's laziness, not your code. A result nobody uses lets the optimizer delete the computation, so print a checksum. And the first iterations run "cold", with empty caches, so discard a warm-up or report the distribution rather than one total.
:::

## perf: taking snapshots of a running program

Imagine a teacher who glances up once a minute and writes down what each student is doing at that instant. After an hour, the tally shows how the class spent its time, and nobody was interrupted for long. That is **[[sampling|sampling-picture]]**, and it is how Linux `perf` works.

A hardware timer interrupts the program many times a second. Each time, `perf` records which instruction was running and, with `-g`, the chain of calls that led there (the **call stack**). Each snapshot costs almost nothing, so `perf` can watch a control loop on a real test bench at full speed.

The main commands:

- `perf stat ./tests` reads the processor's **hardware counters** over a run: cycles, instructions completed, cache misses, mispredicted branches, and **[[instructions per cycle|instructions-per-cycle]]**. A value well below one means the processor is mostly waiting for memory.
- `perf record -g ./bench` collects samples; `perf report` lists functions by their share of them, and who called the expensive ones.

Build optimized, with `-g -fno-omit-frame-pointer` so the stacks turn into names and line numbers.

Read a report from the top and ask: *are these the functions I expected?* A surprise near the top — `operator new`, `memcpy`, a string formatter — is an allocation or copy that lesson 9 forbade in the hot loop, found by measuring. A big share for a tiny function usually means its data misses the cache. **[[Flame graphs|flame-graph]]** draw the same samples as a picture.

## valgrind: running the program on a pretend processor

Valgrind does the opposite of `perf`: it watches *everything*. It runs your unchanged program on a processor simulated in software and checks every instruction. The program runs twenty to fifty times slower, but you get complete answers — every access, every allocation, every cache line, the same every run. Build with `-g` for line numbers, and pick a tool with `--tool=`.

### memcheck: bad memory and uninitialized values

**memcheck**, the default, finds accesses outside memory you own, uses of freed memory, and leaks. Its special strength is reads of **uninitialized** values — memory never given a value — which AddressSanitizer misses. At exit it also counts every heap allocation.

::: example An uninitialized member found by memcheck
A gyro calibration has two fields; the programmer set only one.

```cpp
#include <cstdio>

struct GyroCal {
  double scale;
  double bias;  // forgotten below
};

double corrected(const GyroCal& cal, double raw) {
  double out = cal.scale * raw;
  if (cal.bias > 0.0) out -= cal.bias;  // decision on an uninitialized value
  return out;
}

int main() {
  GyroCal cal;
  cal.scale = 1.02;
  std::printf("corrected = %f\n", corrected(cal, 0.01));
  return 0;
}
```

```text
$ g++ -std=c++20 -Wall -Wextra -O0 -g uninit.cpp -o uninit
$ valgrind -q --track-origins=yes ./uninit
==7482== Conditional jump or move depends on uninitialised value(s)
==7482==    at 0x1091A1: corrected(GyroCal const&, double) (uninit.cpp:10)
==7482==    by 0x109200: main (uninit.cpp:17)
==7482==  Uninitialised value was created by a stack allocation
==7482==    at 0x1091C1: main (uninit.cpp:14)
   ... more reports from inside printf, where the tainted result went ...
corrected = 0.010200
```

**Where it was used:** line 10, the `if` on `cal.bias`, called from line 17. **Where it came from:** `--track-origins=yes` adds that the value was born in a stack allocation made when `main` started (line 14) — the room for `GyroCal cal;`, with no value put in `bias`.

**Why testing missed it.** The program printed $1.02 \times 0.01 = 0.0102$, a believable number. The **[[garbage in bias|leftover-garbage]]** happened to be tiny and positive, so subtracting it changed nothing visible. Other leftovers on another day would give another answer.

**Two surprises.** `g++ -Wall -Wextra` printed no warning, at `-O0` or `-O2`. And at `-O2` memcheck reported nothing, because the optimizer rearranged the code so no jump depended on the value. Which build you check matters. GCC's `-fanalyzer` and clang-tidy, below, both catch this bug from the source.
:::

::: example Proving a loop allocation-free with memcheck and massif
Lesson 10's propagator, two ways: fixed-size `Vector6d`, or (with `-DNAIVE`) dynamic `VectorXd`, where every vector result is a heap allocation.

```cpp
#include <Eigen/Dense>
#include <cmath>
#include <cstdio>
#include <numbers>
#ifdef NAIVE
using Vec = Eigen::VectorXd;          // dynamic size: every result lives on the heap
#else
using Vec = Eigen::Matrix<double, 6, 1>;  // fixed size: lives on the stack
#endif
constexpr double kMu = 3.986004418e14;

Vec two_body(const Vec& x) {
  const Eigen::Vector3d r = x.head<3>();
  const double r3 = std::pow(r.norm(), 3);
  Vec dx(6);
  dx << x.tail<3>(), -kMu / r3 * r;
  return dx;
}

Vec rk4_step(const Vec& x, double dt) {
  const Vec k1 = two_body(x);
  const Vec k2 = two_body(x + (0.5 * dt) * k1);
  const Vec k3 = two_body(x + (0.5 * dt) * k2);
  const Vec k4 = two_body(x + dt * k3);
  return x + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

int main() {
  const double r0 = 6778137.0;
  const double v0 = std::sqrt(kMu / r0);
  const double period = 2.0 * std::numbers::pi * std::sqrt(r0 * r0 * r0 / kMu);
  const int n = static_cast<int>(std::round(period));
  const double dt = period / n;
  Vec x(6);
  x << r0, 0, 0, 0, v0, 0;
  for (int i = 0; i < n; ++i) x = rk4_step(x, dt);
  std::printf("period %.1f s, %d steps of dt = %.4f s, x[0] = %.3f m\n", period, n, dt, x[0]);
  return 0;
}
```

```text
$ g++ -std=c++20 -O2 -g -Wall -Wextra -I/usr/include/eigen3 prop.cpp -o orbit_plain
$ g++ -std=c++20 -O2 -g -Wall -Wextra -DNAIVE -I/usr/include/eigen3 prop.cpp -o naive_prop

$ valgrind ./orbit_plain
period 5553.6 s, 5554 steps of dt = 0.9999 s, x[0] = 6778137.000 m
==10383==   total heap usage: 1 allocs, 1 frees, 4,096 bytes allocated

$ valgrind ./naive_prop
period 5553.6 s, 5554 steps of dt = 0.9999 s, x[0] = 6778137.000 m
==10385==   total heap usage: 44,435 allocs, 44,435 frees, 2,210,608 bytes allocated

$ valgrind --tool=massif --massif-out-file=m.out ./orbit_plain && ms_print m.out
    (peak heap 4.008 KB: one flat step, the printf buffer)
$ valgrind --tool=massif --massif-out-file=m.out ./naive_prop && ms_print m.out
    (peak heap 76.07 KB: 72 KiB taken by the C++ runtime at start-up,
     then a sawtooth only a few hundred bytes tall, repeated thousands of times)
```

**The fixed-size count:** one allocation, the 4096-byte buffer the C library gives `printf`. The 5554 RK4 steps allocated nothing.

**The naive count:** 44 435. Take away three made outside the loop (the state `x`, the `printf` buffer, a start-up pool of the C++ runtime) and $44\,432 = 8 \times 5554$ remain — eight per step. Four are `k1` to `k4`, three are the temporaries like `x + (0.5 * dt) * k1` passed to `two_body`, and one is the new state, each $6 \times 8 = 48$ bytes.

**The picture.** **massif**, valgrind's heap profiler, snapshots how much heap is in use over time, and `ms_print` draws it. The naive program's 76 KB peak is mostly a 72 KiB pool the C++ runtime takes once at start-up; the loop adds only a few hundred bytes at a time, tens of thousands of times.

**Sanity check.** The *peak* barely tells the programs apart; the *count* does. For the exercise's "demonstrate zero allocations in the loop", the memcheck count is the proof and the massif chart the picture. Lesson 9's allocation guard is a third proof, and the only one that runs in the test suite on every commit.
:::

### cachegrind and callgrind

**cachegrind** simulates the caches and charges each miss to a source line, turning lesson 9's argument about memory order into numbers. This program sums a $1024 \times 1024$ grid of doubles, stored row by row, walking it two ways:

```cpp
#include <cstdio>
#include <vector>

constexpr int kN = 1024;

int main() {
  std::vector<double> a(kN * kN, 1.0);   // 8 MiB, stored row by row
  double sum = 0.0;
#ifdef COLS
  for (int j = 0; j < kN; ++j)
    for (int i = 0; i < kN; ++i) sum += a[i * kN + j];   // walk down each column
#else
  for (int i = 0; i < kN; ++i)
    for (int j = 0; j < kN; ++j) sum += a[i * kN + j];   // walk along each row
#endif
  std::printf("sum = %.0f\n", sum);
  return 0;
}
```

```text
$ valgrind --tool=cachegrind --cache-sim=yes ./sweep_row
sum = 1048576
D1  misses:      276,527  (  143,273 rd   + 133,254 wr)
$ valgrind --tool=cachegrind --cache-sim=yes ./sweep_col
sum = 1048576
D1  misses:    1,194,030  (1,060,776 rd   + 133,254 wr)
```

"D1" is the first-level data cache; "rd" and "wr" are reads and writes. The writes, identical in both, come from filling the 8 MiB grid: one miss per 64-byte **[[cache line|cache-line-walk]]**. The row walk reads neighboring addresses, so it too misses about once per line. The column walk jumps 8 KiB per read, and one column touches 1024 lines — 64 KiB, more than the machine's 48 KiB first-level cache — so each line is thrown out before the walk returns: about one miss per read. Same additions, $1\,060\,776 / 143\,273 \approx 7.4$ times the read misses. Counted, not timed. (Check yourself works through every number.)

**callgrind** counts the instructions each function executes and builds a call graph. Instruction counts do not jitter the way times do, so it is the tool for comparing two builds.

### Which tool when

Lesson 12's sanitizers, valgrind and `perf` overlap, so line them up:

| Tool | How it works | Speed | Best at |
| --- | --- | --- | --- |
| ASan, UBSan | checks compiled into a special build | about 2× slower | memory errors and undefined behavior, in CI |
| valgrind | simulates every instruction, no rebuild | 20–50× slower | uninitialized reads, allocation counts, cache misses |
| `perf` | samples the real program | nearly full speed | where real time goes |

::: key
AddressSanitizer catches out-of-bounds access, use-after-free and leaks; UndefinedBehaviorSanitizer catches signed overflow, misaligned access, invalid casts and null dereference. Both are compile flags (-fsanitize=address,undefined) and belong in CI, not in the flight build.
:::

::: key
Profilers observe the running program: a `ScopedTimer` harness records the distribution of cycle times (report the maximum and the tail, never the mean alone); `perf` samples a program at full speed with hardware counters; valgrind instruments every instruction at 20–50× slowdown — memcheck for memory errors, uninitialized values and the allocation count, massif for the heap over time, cachegrind for cache misses per line, callgrind for instruction counts.
:::

## Static analysis: reading the code without running it

A static analyzer reads the source, works out what each path could do, and reports anything wrong, suspicious, or against a chosen rule set — including code no test reaches.

### The compiler is the first analyzer

`-Wall -Wextra -Werror` is the floor. Flight projects add `-Wpedantic`; `-Wconversion` and `-Wsign-conversion` for silent **narrowing** (a `double` squeezed into an `int`); `-Wshadow` for a local hiding an outer name; `-Wold-style-cast`, `-Wnon-virtual-dtor` and `-Woverloaded-virtual` for lesson 4's mistakes; and `-Wnull-dereference`, `-Wdouble-promotion` and `-Wformat=2`.

GCC's `-fanalyzer` follows each path looking for null dereferences, double frees and leaks. On the gyro program, where `-Wall -Wextra` said nothing, it reports a `use of uninitialized value` warning for `bias` and draws the path there. These checks are free and run on every build, and `-Werror` makes each one a build failure: Power of Ten rule 10 in one flag.

### clang-tidy

**clang-tidy** is built on the Clang compiler's front end, so it understands code as well as a compiler does. Its several hundred checks come in families: `bugprone-*` (use after move, narrowing, endless loops), `cppcoreguidelines-*` (uninitialized members, magic numbers, C-style variable-argument calls), `performance-*` (needless copies), `modernize-*`, `readability-*`, `cert-*` and `misc-*`.

It learns each file's flags from a **[[compile_commands.json|compile-commands]]** file, which CMake writes with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`, or it runs inside the build with `-DCMAKE_CXX_CLANG_TIDY=clang-tidy`. A `.clang-tidy` file at the repository root fixes the checks for the whole team.

::: example clang-tidy on twenty-seven lines with four bugs
```cpp
#include <cstdio>
#include <utility>
#include <vector>

struct Config {
  double gain;
  int channel;
  Config() {}  // members left uninitialized
};

int scale_counts(double volts) {
  int counts = volts * 4096.0 / 3.3;  // narrowing double -> int
  return counts;
}

void consume(std::vector<double> samples) { std::printf("%zu\n", samples.size()); }

int main() {
  Config cfg;
  std::vector<double> buffer(1000, 1.0);
  consume(std::move(buffer));
  std::printf("%zu\n", buffer.size());  // use after move
  for (int i = 0; i < 3; i++) {
    std::printf("%d %f\n", i, cfg.gain);
  }
  return scale_counts(1.5) + cfg.channel;
}
```

```text
$ g++ -std=c++20 -Wall -Wextra -c tidy_demo.cpp       (no warnings at all)
$ clang-tidy --checks='-*,bugprone-*,cppcoreguidelines-narrowing-conversions,cppcoreguidelines-pro-type-member-init,performance-*' tidy_demo.cpp -- -std=c++20
tidy_demo.cpp:8:3: warning: constructor does not initialize these fields: gain, channel [cppcoreguidelines-pro-type-member-init]
tidy_demo.cpp:12:16: warning: narrowing conversion from 'double' to 'int' [bugprone-narrowing-conversions,cppcoreguidelines-narrowing-conversions]
tidy_demo.cpp:16:34: warning: the parameter 'samples' is copied for each invocation but only used as a const reference; consider making it a const reference [performance-unnecessary-value-param]
tidy_demo.cpp:22:24: warning: 'buffer' used after it was moved [bugprone-use-after-move]
```

Each finding reads `file:line:column: warning: message [check-name]`, and each is a lesson of this module caught by a machine. Line 8 leaves two members holding garbage (lesson 1: `double gain = 0.0;` and `Config() = default;`). Line 12 silently chops a `double` to an `int` (lesson 1: range check, then `static_cast`, or brace initialization to make it an error). Line 16 copies a thousand doubles it only reads (lesson 2). Line 22 reads a moved-from object (lesson 3). The compiler said nothing; the analyzer found all four without running anything.

Now add a repository `.clang-tidy` that enables broader families and promotes one check to an error:

```text
Checks: "-*,bugprone-*,cppcoreguidelines-*,performance-*,readability-*,modernize-*,-modernize-use-trailing-return-type"
WarningsAsErrors: "bugprone-use-after-move"
```

Plain `clang-tidy tidy_demo.cpp -- -std=c++20` in that folder now also reports `use '= default'`, `4096.0 is a magic number` (lesson 7 would name it with `constexpr`), and `do not call c-style vararg functions` on every `printf` (flight code logs through a typed interface). The use after move becomes `error: ... [bugprone-use-after-move,-warnings-as-errors]` and clang-tidy exits with status 1, failing the build job. A project decides once which checks must never slip, and the tool enforces it on every commit.
:::

### cppcheck and the rest

**cppcheck** is the other analyzer common in aerospace. It needs no particular compiler, copes with incomplete code, and runs fast. It is tuned to raise few **[[false alarms|false-positive]]**, so its default findings are almost always real: an array indexed past its end, a null dereference, an uninitialized variable, a leak, a `delete` that does not match `new[]`. Run `cppcheck --enable=warning,style,performance,portability --std=c++20 --error-exitcode=1 src/` (or `--project=build/compile_commands.json`); the nonzero exit code on a finding is what continuous integration watches. A paid add-on checks **[[MISRA|misra]]** rules, which many aerospace contracts require. clang-tidy knows the language more deeply; cppcheck knows the rule sets and runs anywhere.

Projects often add a commercial analyzer — Coverity, Polyspace, PC-lint, Klocwork — against MISRA C++, AUTOSAR C++14 or JSF++. The tools differ; the way of working does not. Every analyzer runs on every commit with zero findings tolerated. A false alarm is silenced *at that one line*, naming the check and the reason — `// NOLINT(bugprone-use-after-move): reset() reinitializes the object` — never for a whole file. And a finding is fixed by restoring the rule it broke, not by rewording until the tool goes quiet.

::: key
Static analyzers read the code without running it: the compiler with `-Wall -Wextra -Werror` and the stricter warnings is the first; clang-tidy applies hundreds of named checks (`bugprone-*`, `cppcoreguidelines-*`, `performance-*`, `modernize-*`) from a `.clang-tidy` file over a `compile_commands.json`; cppcheck is compiler-independent with a low false-positive rate and MISRA support. All run in continuous integration with zero findings tolerated, which is Power of Ten rule 10.
:::

::: warning "It's only a warning"
A warning called "noise" is a decision not to look. When a tool is wrong, suppress that one line with the check and the reason, so the next reader sees a decision, not a habit. A project with three hundred tolerated warnings has no warnings at all, because nobody reads them.
:::

## Check yourself

::: check
In the first run of the timing harness, the median was 267 ns and the maximum was 41 420 ns. Which number does a real-time schedule have to use, what most likely caused the maximum, and what would you do next?
:::

::: answer
The worst case — the maximum, or a high percentile plus a justified margin — because the scheduler must guarantee *every* cycle. A 41 µs spike in a 267 ns computation (155 times longer) is not the arithmetic; it is the platform: the operating system pausing the program, an interrupt, a page fault. Next, find out whether the flight target has the same delays. A real-time kernel, with the loop pinned to one core and interrupts sent elsewhere, shrinks them enormously. Measure there, over a run long enough to be representative.
:::

::: check
Name the valgrind tool for each job: (a) finding a read of an uninitialized `double`; (b) counting how many heap allocations a run makes; (c) drawing heap usage over time; (d) counting cache misses per source line; (e) comparing the instruction counts of two builds.
:::

::: answer
(a) memcheck, with `--track-origins=yes` to see where the value came from. (b) memcheck again: `total heap usage` at exit. (c) massif, drawn with `ms_print`. (d) cachegrind, with `--cache-sim=yes`. (e) callgrind, whose counts repeat exactly. All run on the unchanged program built with `-g`, twenty to fifty times slower.
:::

::: check
In the cachegrind results, both walks show 133 254 write misses, while the read misses are 143 273 for the row walk and 1 060 776 for the column walk. Explain all three numbers.
:::

::: answer
The writes come from filling the grid: $1024 \times 1024 \times 8 = 8\,388\,608$ bytes, which is $8\,388\,608 / 64 = 131\,072$ cache lines, one miss each plus a little overhead. The fill is identical in both programs, so the count is too.

The row walk reads neighboring addresses, so it misses once per line — about 131 072 times, plus bookkeeping.

The column walk reads one double from each of 1024 lines per column: a 64 KiB working set, bigger than the 48 KiB first-level cache, so each line is evicted before the next column needs it. About one miss per read: 1 048 576 reads, 1 060 776 misses — about 7.4 times the row walk.
:::

::: check
clang-tidy reports `performance-unnecessary-value-param` on the by-value `samples` parameter of `consume`, and `bugprone-use-after-move` on `buffer.size()`. Give the fix for each, and the lesson of this module each fix comes from.
:::

::: answer
`consume` only reads `samples`, so take `const std::vector<double>&` and no thousand-element copy is made — lesson 2, pass large read-only objects by `const` reference.

For the use after move, read the size before `std::move(buffer)`, or drop the line. A moved-from object is valid but unspecified; the only sensible things to do with it are assign it a new value or let it be destroyed — lesson 3. With `bugprone-use-after-move` under `WarningsAsErrors`, this finding fails the build until fixed.
:::

::: check
When would you reach for `perf` rather than valgrind, and when the other way round?
:::

::: answer
`perf` samples the program at nearly full speed, so it answers questions about *real* time: where a loop spends its cycles on the bench, whether it waits on memory, how it behaves under realistic load, even on a hardware-in-the-loop rig. Valgrind slows the program twenty to fifty times, so it is useless for timing — but it sees *everything*, identically every run: every allocation, every uninitialized read, every cache miss by line. Use `perf` to find where time goes; use valgrind to find exactly what the code does with memory.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `ScopedTimer` | RAII around `steady_clock::now()`, one slot per cycle |
| median, p99, p99.9, max | a real-time loop is judged by its worst cycle; the mean hides it |
| `perf stat`, `record -g`, `report` | hardware counters; sampled call stacks; functions by share |
| instructions per cycle | well below one means the processor is waiting for memory |
| valgrind | unchanged program on a simulated processor, 20–50× slower |
| memcheck | bad accesses, uninitialized reads, leaks, `total heap usage` |
| massif, `ms_print` | heap in use over time; the count, not the peak, proves a loop allocation-free |
| cachegrind, callgrind | cache misses per line; repeatable instruction counts and call graph |
| ASan, UBSan | compile-flag checkers for memory errors and undefined behavior; CI only |
| compiler warnings | `-Wall -Wextra -Werror`, `-Wconversion`, `-Wshadow` and more; `-fanalyzer` |
| clang-tidy | check families from `.clang-tidy`; `WarningsAsErrors` for rules that must not slip |
| cppcheck | compiler-independent, few false alarms, `--error-exitcode=1`, MISRA add-on |
| suppression | `// NOLINT(check): reason` at the line, never for the whole file |

The final lesson connects the loop to Python: the allocation-free, profiled, analyzed C++ core becomes a module that a Monte Carlo script can call ten thousand times.

::: context power-of-ten-rule-10 The rule that makes the tools mandatory
The Power of Ten is a short 2006 paper by Gerard Holzmann of NASA's Jet Propulsion Laboratory: ten rules for code that must not fail. Rule 10 says to compile with all warnings enabled at the most careful setting, to treat every warning as something to fix, and to check the code every day with at least one good static analyzer — ideally more than one — with zero warnings allowed.

The reasoning is practical. A human reviewer gets tired; a tool does not. The other nine rules (no recursion, bounded loops, no heap after start-up, and so on) exist partly so that tools like the ones in this lesson *can* check them mechanically.
:::

::: context percentile Where the median and the tail sit
A percentile is a position in a sorted list. Sort all 100 000 cycle times from fastest to slowest. The one halfway down is the median. The one 99% of the way down is p99. Below is the second run of the timing harness: a tall hump of ordinary cycles, then a tail too thin to see — and one cycle far off the right edge.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="31" y="93" width="18" height="47"/>
    <rect x="51" y="50" width="18" height="90"/>
    <rect x="71" y="105.5" width="18" height="34.5"/>
    <rect x="91" y="94.5" width="18" height="45.5"/>
    <rect x="111" y="134.4" width="18" height="5.6"/>
    <rect x="131" y="138.4" width="18" height="1.6"/>
  </g>
  <line x1="30" y1="140" x2="240" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="243" y1="146" x2="249" y2="134" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="249" y1="146" x2="255" y2="134" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="258" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3">
    <line x1="64" y1="40" x2="64" y2="140"/>
    <line x1="132" y1="40" x2="132" y2="140"/>
    <line x1="226" y1="40" x2="226" y2="140"/>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="64" y="33">median 254</text>
    <text x="132" y="33">p99 322</text>
    <text x="226" y="33">p99.9 416</text>
  </g>
  <circle cx="320" cy="140" r="4" fill="#b4232c"/>
  <text x="320" y="126" font-size="11" fill="#b4232c" text-anchor="middle">max</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="156">220</text>
    <text x="110" y="156">300</text>
    <text x="190" y="156">380</text>
    <text x="320" y="156">139 302</text>
    <text x="180" y="176">cycle time (ns); bar height = number of cycles</text>
  </g>
</svg>
```

The mean mixes the hump and the tail into one number that describes neither.
:::

::: context steady-clock Why not use the wall clock?
A computer has more than one clock. The "wall clock" (`std::chrono::system_clock`) tells the time of day, and it can jump: the computer may correct itself against an internet time server, or someone may change the time zone. If it jumps backward in the middle of a measurement, you get a negative duration.

`std::chrono::steady_clock` never goes backward. It does not know the time of day at all; it only counts forward at a steady rate. That makes it the right clock for "how long did this take". Flight computers make the same split: a mission clock kept in step with the ground, and a free-running counter for timing loops.
:::

::: context sampling-picture Counting samples to estimate time
Each tick below is one sample: at that instant, `perf` notes which function was running. Functions that run longer collect more ticks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="30" y="16" font-size="11" fill="#1f2a44">each tick = one sample</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="26" x2="40" y2="40"/><line x1="60" y1="26" x2="60" y2="40"/><line x1="80" y1="26" x2="80" y2="40"/>
    <line x1="100" y1="26" x2="100" y2="40"/><line x1="120" y1="26" x2="120" y2="40"/><line x1="140" y1="26" x2="140" y2="40"/>
    <line x1="160" y1="26" x2="160" y2="40"/><line x1="180" y1="26" x2="180" y2="40"/><line x1="200" y1="26" x2="200" y2="40"/>
    <line x1="220" y1="26" x2="220" y2="40"/><line x1="240" y1="26" x2="240" y2="40"/><line x1="260" y1="26" x2="260" y2="40"/>
    <line x1="280" y1="26" x2="280" y2="40"/><line x1="300" y1="26" x2="300" y2="40"/><line x1="320" y1="26" x2="320" y2="40"/>
  </g>
  <rect x="30" y="40" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="150" y="40" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="210" y="40" width="60" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <rect x="270" y="40" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="90" y="59">two_body</text>
    <text x="180" y="59">rk4_step</text>
    <text x="240" y="59" fill="#b4232c">new</text>
    <text x="300" y="59">two_body</text>
  </g>
  <text x="330" y="86" font-size="11" fill="#6c7a93" text-anchor="end">time →</text>
  <g font-size="11" fill="#1f2a44">
    <text x="30" y="104">two_body: 9 of 15 samples = 60%</text>
    <text x="30" y="121">rk4_step: 3 of 15 samples = 20%</text>
    <text x="30" y="138" fill="#b4232c">operator new: 3 of 15 samples = 20% (a surprise!)</text>
  </g>
</svg>
```

With thousands of samples a second, the tally gets very close to the true share of time.
:::

::: context instructions-per-cycle Is the processor busy or waiting?
A modern processor can finish several instructions in one tick of its clock when everything it needs is close at hand. If a loop shows an instructions-per-cycle value of 2 or 3, the processor is working flat out. If it shows 0.3, then for most ticks nothing finished at all — the processor was waiting for data to arrive from main memory, which takes on the order of a hundred nanoseconds, hundreds of clock ticks.

That one number tells you which kind of fix to look for: faster arithmetic, or better memory layout like lesson 9's struct-of-arrays.
:::

::: context flame-graph Stacks drawn as flames
A flame graph turns thousands of call-stack samples into one picture. Each function is a bar; the functions it called sit on top of it; a bar's width is its share of the samples. The result looks like a row of flames, and the widest towers are where the time goes.

Brendan Gregg, a performance engineer, invented the flame graph in 2011 and published free scripts that turn `perf` output into one. Wide bars near the top that you did not expect are the first thing to look at.
:::

::: context leftover-garbage What was actually in bias
An uninitialized variable is not empty or zero. It holds whatever bytes were left in that spot of memory by earlier code. When this example was run with a line added to print `cal.bias`, it held $6.92 \times 10^{-310}$ — a number so tiny that subtracting it from $0.0102$ changes nothing.

Those bytes were, in fact, a memory address left behind on the stack (in hexadecimal, `0x7f7a2ef8f91b`), read as if it were a `double`. Nobody chose that value, and a different program layout would leave something else there, maybe a huge number. That is why uninitialized reads are undefined behavior: there is no right answer to test against.
:::

::: context cache-line-walk Why the column walk misses every time
Memory moves into the cache in lines of 64 bytes — eight doubles at once. Here is a toy version: each row of the grid is one line of four numbers, and the cache holds only two lines.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="78" y="24">along the rows</text>
    <text x="258" y="24">down the columns</text>
  </g>
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="30" y="36" width="96" height="24"/><rect x="30" y="60" width="96" height="24"/>
    <rect x="30" y="84" width="96" height="24"/><rect x="30" y="108" width="96" height="24"/>
    <rect x="210" y="36" width="96" height="24"/><rect x="210" y="60" width="96" height="24"/>
    <rect x="210" y="84" width="96" height="24"/><rect x="210" y="108" width="96" height="24"/>
  </g>
  <g stroke="#6c7a93" stroke-width="0.8">
    <line x1="54" y1="36" x2="54" y2="132"/><line x1="78" y1="36" x2="78" y2="132"/><line x1="102" y1="36" x2="102" y2="132"/>
    <line x1="234" y1="36" x2="234" y2="132"/><line x1="258" y1="36" x2="258" y2="132"/><line x1="282" y1="36" x2="282" y2="132"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="36" y1="48" x2="114" y2="48"/><line x1="36" y1="72" x2="114" y2="72"/>
    <line x1="36" y1="96" x2="114" y2="96"/><line x1="36" y1="120" x2="114" y2="120"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="122,48 113,44 113,52"/><polygon points="122,72 113,68 113,76"/>
    <polygon points="122,96 113,92 113,100"/><polygon points="122,120 113,116 113,124"/>
  </g>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="222" y1="40" x2="222" y2="120"/><line x1="246" y1="40" x2="246" y2="120"/>
    <line x1="270" y1="40" x2="270" y2="120"/><line x1="294" y1="40" x2="294" y2="120"/>
  </g>
  <g fill="#b4232c">
    <polygon points="222,128 218,119 226,119"/><polygon points="246,128 242,119 250,119"/>
    <polygon points="270,128 266,119 274,119"/><polygon points="294,128 290,119 298,119"/>
  </g>
  <g font-size="12" text-anchor="middle">
    <text x="78" y="154" fill="#1d6fd1">16 reads, 4 misses</text>
    <text x="258" y="154" fill="#b4232c">16 reads, 16 misses</text>
  </g>
</svg>
```

Along the rows, each line is loaded once and all four numbers get used. Down a column, the walk needs four lines but the cache holds two, so each line is thrown out before the walk comes back for its next number.
:::

::: context compile-commands A list of how every file is built
A real project compiles hundreds of files, each with its own include folders, defines and flags. An analyzer that guessed those would misread the code. `compile_commands.json` is a plain text file listing, for every source file, the exact compiler command used to build it.

CMake writes it into the build folder when asked, and clang-tidy, cppcheck and many code editors read it. It is also handy for you: when a file mysteriously fails to build, it shows exactly what the compiler was told.
:::

::: context false-positive When the alarm is wrong
A **false positive** is a warning about a problem that is not really there, like a smoke alarm going off because of toast. A **false negative** is the opposite: a real problem the tool missed.

Every analyzer trades one against the other. A tool that warns about everything misses nothing but buries real bugs under noise; a tool that warns only when sure stays quiet about some real bugs. cppcheck leans toward "only when sure", which is why its findings are worth acting on right away, and why projects run it next to a broader tool like clang-tidy.
:::

::: context misra Rules written for cars, used in rockets
MISRA stands for the Motor Industry Software Reliability Association, a group formed by the British car industry. Its first C coding rules came out in 1998, for software in engine controllers and brakes. The rules forbid the parts of the language most likely to cause silent bugs and require others, such as giving every `switch` a `default` case.

The rules spread well beyond cars, to trains, medical devices and aerospace. MISRA C++ followed in 2008, and a new edition in 2023 folded in the AUTOSAR C++14 guidelines. The F-35 fighter's JSF++ rules came from the same line of thinking.
:::
