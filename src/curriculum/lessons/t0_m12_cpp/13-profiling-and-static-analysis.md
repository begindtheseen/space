---
id: l13-profiling-and-static-analysis
title: Profiling and static analysis: perf, valgrind, clang-tidy and cppcheck
minutes: 26
covers:
  - profiling and sanitizers: perf, valgrind, ASan/UBSan
  - static analysis: clang-tidy, cppcheck
---

Two questions about a flight program have no answer inside the compiler. The first is *where does the time go* — not on average, but in the worst cycle, the one the scheduler must plan for. The second is *what is wrong with the code that has not run yet* — the branch no test takes, the copy nobody noticed, the moved-from variable read three lines later. Profilers answer the first by watching the program run; static analysers answer the second by reading the source without running it. Both are part of the continuous-integration pipeline of any serious flight-software project, and the tenth Power of Ten rule — compile with every warning on, tolerate none, and run static analysers routinely — is about exactly this.

The previous lesson covered the sanitizers, which instrument a build to catch undefined behaviour as it happens. This lesson covers the rest of the toolbox: a timing harness you write yourself, `perf` for sampling a running program, valgrind's family of instrumentation tools — including the heap profiler that proves a loop allocation-free, which the module's first exercise asks you to run — and the two static analysers you will meet most often, clang-tidy and cppcheck.

A note on what was and was not run for this lesson. Every valgrind and clang-tidy output below is real, from the programs shown. `perf` and cppcheck were not installed on the machine these lessons were written on, so for those two you get the commands and how to read what they print, not pasted output.

## Measure before you optimise, and measure the right thing

Three habits separate a measurement from a guess. Measure an optimised build — `-O2` at least — because the unoptimised build of template-heavy code like Eigen bears no relation to the one that flies. Measure on hardware that resembles the target, or at least understand how it differs. And for a real-time loop, record the *distribution* of cycle times and report the worst case and the tail, because the scheduler has to fit the worst cycle and the mean tells you nothing about it.

::: example A timing harness that keeps the tail
```cpp
#include <Eigen/Dense>
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdio>

using Clock = std::chrono::steady_clock;
using Vector6d = Eigen::Matrix<double, 6, 1>;
constexpr double kMu = 3.986004418e14;

// RAII timer: measures from construction to destruction and records the result.
class ScopedTimer {
 public:
  explicit ScopedTimer(double& out_ns) : out_(out_ns), start_(Clock::now()) {}
  ~ScopedTimer() { out_ = std::chrono::duration<double, std::nano>(Clock::now() - start_).count(); }
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
  static std::array<double, kCycles> cycle_ns{};     // static: fixed storage, not the stack
  Vector6d x;
  x << 6778137.0, 0, 0, 0, 7668.56, 0;
  for (int i = 0; i < kCycles; ++i) {
    ScopedTimer timer(cycle_ns[i]);
    x = rk4_step(x, 0.0, 0.1, two_body);
  }
  std::sort(cycle_ns.begin(), cycle_ns.end());
  double sum = 0.0;
  for (double v : cycle_ns) sum += v;
  std::printf("rk4 step over %d cycles: mean %.0f ns  median %.0f ns  p99 %.0f ns  p99.9 %.0f ns  max %.0f ns\n",
              kCycles, sum / kCycles, cycle_ns[kCycles / 2], cycle_ns[kCycles * 99 / 100],
              cycle_ns[kCycles * 999 / 1000], cycle_ns[kCycles - 1]);
  std::printf("(x[0] = %.1f m)\n", x[0]);
  return 0;
}
// Output (g++ -O2, desktop Linux, two runs):
// rk4 step over 100000 cycles: mean 243 ns  median 236 ns  p99 248 ns  p99.9 310 ns  max 63699 ns
// rk4 step over 100000 cycles: mean 254 ns  median 236 ns  p99 260 ns  p99.9 405 ns  max 352410 ns
```

The `ScopedTimer` is lesson 3's RAII applied to a clock: it reads `steady_clock` — monotonic, unaffected by clock adjustments — when constructed and again when destroyed, and writes the difference into the slot it was given. The slots live in a `static` array so that the measurement itself allocates nothing and touches no new stack. Then the numbers: an RK4 step costs 236 ns in the median and 248 ns at the 99th percentile — the arithmetic is utterly consistent — while the *maximum* is 64 µs in one run and 352 µs in the next, 270 to 1500 times the median. Those are the operating system pre-empting the process, an interrupt, a page fault: nothing to do with the code, everything to do with the platform. On a real-time operating system they shrink, but they do not vanish, and a control loop specified against the mean of 243 ns would miss its deadline on the very first one. Report the maximum and the 99.9th percentile, and find out what causes them.
:::

::: warning
Benchmarks lie in three familiar ways. An unoptimised build measures the compiler's laziness, not your code. A result that is never used lets the optimiser delete the computation — print a checksum or store to a `volatile`. And the first iterations run cold, with the caches empty and the clock frequency ramping, so discard a warm-up or report the distribution rather than a single total.
:::

## perf: sampling the running program

Linux `perf` is the production profiler on the bench. It works by *sampling*: a hardware timer interrupts the program at a fixed rate, records the program counter and, with `-g`, the call stack, and moves on. The overhead is a fraction of a percent, so it can be pointed at a program running at real speed, including a control loop on a hardware-in-the-loop rig. `perf stat ./tests` reads the processor's hardware counters over a whole run and reports elapsed time, cycles, instructions retired, the ratio of the two (instructions per cycle, where a value well below one says the core is waiting for memory), cache misses and branch mispredictions. `perf record -g ./bench` collects samples into a file; `perf report` then lists functions by their share of samples, and with a call graph shows who called the expensive ones. Build with `-g -fno-omit-frame-pointer` so the stacks resolve to names and lines, on an optimised build so the numbers mean something.

Read a `perf report` from the top: the first few symbols are where the time is, and the question is whether they are the functions you expected. A surprise near the top — `operator new`, `memcpy`, a string formatter — is an allocation or a copy that lesson 9 forbade, found by measurement rather than inspection. A large share attributed to a tiny function usually means a cache miss on its data, not slow arithmetic. Flame graphs render the same data as a picture of the stack and are worth learning to read; they are a script over `perf` output.

## valgrind: instrumenting the whole program

Valgrind takes the opposite approach: it runs your unmodified binary on a synthetic processor, instrumenting every instruction. That costs twenty to fifty times in speed and gives a completeness no sampler can match — every memory access, every allocation, every cache line, deterministically. It needs no recompilation, only `-g` for line numbers, and it has several tools.

**memcheck**, the default, finds reads and writes outside allocated memory, uses of freed memory, leaks, and — its unique strength among the tools in this module — reads of *uninitialised* values, which AddressSanitizer does not detect. It also prints, at exit, a count of every allocation the program made.

::: example An uninitialised member found by memcheck
```cpp
struct GyroCal {
  double scale;
  double bias;      // forgotten in the initialiser below
};

double corrected(const GyroCal& cal, double raw) {
  double out = cal.scale * raw;
  if (cal.bias > 0.0) out -= cal.bias;     // decision on an uninitialised value
  return out;
}

int main() {
  GyroCal cal;
  cal.scale = 1.02;
  std::printf("corrected = %f\n", corrected(cal, 0.01));
  return 0;
}
// $ g++ -std=c++20 -O0 -g uninit.cpp -o uninit && valgrind -q --track-origins=yes ./uninit
// ==17186== Conditional jump or move depends on uninitialised value(s)
// ==17186==    at 0x1091A1: corrected(GyroCal const&, double) (uninit.cpp:10)
// ==17186==    by 0x109200: main (uninit.cpp:17)
// ==17186==  Uninitialised value was created by a stack allocation
// ==17186==    at 0x1091C1: main (uninit.cpp:14)
// corrected = 0.010200
```

`--track-origins=yes` adds the second half of the report: not only where the uninitialised value was *used* (the `if` on line 10) but where it *came from* (the `GyroCal cal;` on line 14, a stack allocation with no initialiser). The program printed a plausible number — `bias` happened to hold a non-positive garbage value — which is why this class of bug survives testing. Note the `-O0`: an optimised build of this program had folded the branch away entirely, and memcheck reported nothing, because there was no longer a conditional jump to depend on the value. The compiler's own `-Wuninitialized` warning fired in both builds and is the first line of defence; memcheck is the second, for the cases the compiler cannot see across function boundaries.
:::

::: example Proving a loop allocation-free with memcheck and massif
Two versions of the two-body propagator from lesson 10: the fixed-size `Vector6d` version, and a version written with dynamic `VectorXd` so that every arithmetic result is a heap allocation.

```text
$ valgrind --tool=memcheck ./orbit_plain
period 5553.6 s, 5554 steps of dt = 0.9999 s
==16134==   total heap usage: 1 allocs, 1 frees, 4,096 bytes allocated

$ valgrind --tool=memcheck ./naive_prop
x[0] = 6778136.4
==16178==   total heap usage: 38,881 allocs, 38,881 frees, 1,944,016 bytes allocated

$ valgrind --tool=massif --massif-out-file=massif.out ./orbit_plain && ms_print massif.out
    (peak heap 4,104 bytes, 4 snapshots)
$ valgrind --tool=massif --massif-out-file=massif.out ./naive_prop && ms_print massif.out
    (peak heap 77,896 bytes, 64 snapshots, a sawtooth of allocation and release)
```

The fixed-size propagator makes one allocation in its whole run — 4 KiB, the buffer the C library gives `printf` — and none in 5554 RK4 steps. The dynamic version makes 38,881: seven per step (four derivative results and three temporaries), which is 38,878 plus the same three at start-up. **massif** is the heap *profiler*: it snapshots heap size over time and `ms_print` draws it, so the naive program shows a sawtooth peaking at 76 KiB and the fixed-size one a flat line. For the exercise's "demonstrate zero allocations in the loop", the memcheck summary is the count and the massif graph is the picture; the allocation guard from lesson 9 is the third proof, and unlike these two it can run inside the test suite on every commit.
:::

**cachegrind** simulates the cache hierarchy and attributes misses to source lines, which makes lesson 9's argument quantitative. The two sweeps of a $1024 \times 1024$ matrix of doubles — 1 048 576 reads each, row-major and column-major — give:

```text
$ valgrind --tool=cachegrind --cache-sim=yes ./sweep_row
D1  misses:      276,532  (  143,279 rd   + 133,253 wr)
$ valgrind --tool=cachegrind --cache-sim=yes ./sweep_col
D1  misses:    1,194,035  (1,060,782 rd   + 133,253 wr)
```

The 133 253 write misses are identical in both — they are the initialisation of the 8 MiB vector, one miss per 64-byte line — so the difference is entirely the sweep: 143 279 read misses for row-major, close to the 131 072 lines the matrix occupies, against 1 060 782 for column-major, essentially one miss per read. In the column walk each read is 8 KiB from the last; a column touches 1024 distinct lines, 64 KiB, more than the 32 KiB first-level cache, so by the time the next column comes round every line has been evicted. Seven times the misses for the same arithmetic, counted exactly rather than timed. **callgrind**, the fourth tool, counts instructions per function and builds a call graph; because instruction counts do not jitter, it is the tool for comparing two builds of the same code.

## Static analysis: reading the code

A static analyser never runs the program. It parses the source, builds a model of what each path does, and reports constructs that are wrong, suspicious or against a chosen rule set. It finds the bugs in code no test reaches, and it finds them before the code is even compiled into a test.

The first analyser is the compiler. `-Wall -Wextra -Werror` is the floor; a flight project adds `-Wpedantic`, `-Wconversion` and `-Wsign-conversion` (implicit narrowing), `-Wshadow` (a local hiding an outer name), `-Wold-style-cast`, `-Wnon-virtual-dtor` and `-Woverloaded-virtual` (lesson 4's mistakes), `-Wnull-dereference`, `-Wdouble-promotion` (a `float` silently computed in `double`) and `-Wformat=2`. GCC's `-fanalyzer` adds path-sensitive checks for null dereferences, double frees and leaks. These are free, they run on every build, and `-Werror` makes each one a build failure — Power of Ten rule 10 in one flag.

**clang-tidy** is built on the Clang front end, so it understands the code as well as the compiler does, and it ships several hundred checks in named families: `bugprone-*` for likely bugs (use after move, narrowing, integer division in a floating context, infinite loops), `cppcoreguidelines-*` for the C++ Core Guidelines (uninitialised members, magic numbers, C-style varargs, pointer arithmetic), `performance-*` for needless copies, `modernize-*` for pre-C++11 idioms, `readability-*`, `cert-*` and `misc-*`. It reads a `compile_commands.json` — CMake writes one with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON` — so it sees each file with its real flags, or it runs during the build itself with `-DCMAKE_CXX_CLANG_TIDY=clang-tidy`. A `.clang-tidy` file at the repository root fixes the check set for everyone.

::: example clang-tidy on twenty-five lines with four bugs
```cpp
#include <cstdio>
#include <utility>
#include <vector>

struct Config {
  double gain;
  int channel;
  Config() {}                                   // members left uninitialised
};

int scale_counts(double volts) {
  int counts = volts * 4096.0 / 3.3;            // narrowing double -> int
  return counts;
}

void consume(std::vector<double> samples) { std::printf("%zu\n", samples.size()); }

int main() {
  Config cfg;
  std::vector<double> buffer(1000, 1.0);
  consume(std::move(buffer));
  std::printf("%zu\n", buffer.size());          // use after move
  for (int i = 0; i < 3; i++) { std::printf("%d %f\n", i, cfg.gain); }
  return scale_counts(1.5) + cfg.channel;
}
// $ clang-tidy --checks='-*,bugprone-*,cppcoreguidelines-narrowing-conversions,cppcoreguidelines-pro-type-member-init,performance-*' tidy_demo.cpp -- -std=c++20
// tidy_demo.cpp:8:3: warning: constructor does not initialize these fields: gain, channel [cppcoreguidelines-pro-type-member-init]
// tidy_demo.cpp:12:16: warning: narrowing conversion from 'double' to 'int' [bugprone-narrowing-conversions,cppcoreguidelines-narrowing-conversions]
// tidy_demo.cpp:16:34: warning: the parameter 'samples' is copied for each invocation but only used as a const reference; consider making it a const reference [performance-unnecessary-value-param]
// tidy_demo.cpp:22:24: warning: 'buffer' used after it was moved [bugprone-use-after-move]
```

Every finding is a lesson from this module caught mechanically. The empty constructor leaves two members indeterminate (lesson 1: initialise at the declaration — `double gain = 0.0;` and `Config() = default;`). The `int counts = volts * ...` narrows a `double` silently (lesson 1: `static_cast` after a range check, or brace initialisation to make it an error). `consume` copies a thousand doubles it only reads (lesson 2: `const std::vector<double>&`). And `buffer.size()` after `std::move(buffer)` reads a moved-from object (lesson 3). The program compiles without a single warning from `g++ -Wall -Wextra`; the analyser found all four without running it.

With a repository `.clang-tidy` that enables the broader families and promotes one check to an error —

```text
Checks: "-*,bugprone-*,cppcoreguidelines-*,performance-*,readability-*,modernize-*,-modernize-use-trailing-return-type"
WarningsAsErrors: "bugprone-use-after-move"
```

— the same file also draws `use '= default' to define a trivial default constructor`, `4096.0 is a magic number; consider replacing it with a named constant` (lesson 7's `constexpr`), `do not call c-style vararg functions` on every `printf` (a flight codebase routes logging through a typed interface instead), and the use-after-move becomes `error: ... [bugprone-use-after-move,-warnings-as-errors]`, failing the run. Choosing which checks a project enables, and which it promotes to errors, is a decision made once and enforced on every commit.
:::

**cppcheck** is the other analyser you will see in aerospace codebases. It is independent of any compiler, parses tolerant of incomplete code, runs quickly, and is tuned for a low false-positive rate: its default findings are things that are almost certainly wrong — an array indexed out of bounds with a constant, a null dereference, an uninitialised variable, a resource leak, a `delete` mismatched with `new[]`, a function that can never be called. Run it as `cppcheck --enable=warning,style,performance,portability --std=c++20 --error-exitcode=1 src/`, or over the CMake compilation database with `--project=build/compile_commands.json`; the non-zero exit code is what a continuous-integration job keys on. Its commercial add-on checks MISRA compliance, which is the coding standard many aerospace contracts specify, and this is the niche cppcheck fills alongside clang-tidy rather than instead of it: clang-tidy knows the language more deeply, cppcheck knows the rule sets and runs anywhere.

Beyond these two, aerospace projects often run a commercial analyser — Coverity, Polyspace, PC-lint, Klocwork — against a standard such as MISRA C++, AUTOSAR C++14 or JSF++. The tools differ; the workflow does not. Every analyser runs in continuous integration on every commit with zero tolerated findings. A false positive is suppressed *at the line*, with the check named and a justification — `// NOLINT(bugprone-use-after-move): reset() reinitialises the object` — never by disabling the check for the file or the project. And a finding is fixed by restoring the rule it broke, not by rewriting the line until the analyser is quiet.

::: key
Profilers observe the running program: a `ScopedTimer` harness records the distribution of cycle times (report the maximum and the tail, never the mean alone); `perf` samples a program at full speed with hardware counters; valgrind instruments every instruction at 20–50× slowdown — memcheck for memory errors, uninitialised values and the allocation count, massif for the heap over time, cachegrind for cache misses per line, callgrind for instruction counts.
:::

::: key
Static analysers read the code without running it: the compiler with `-Wall -Wextra -Werror` and the stricter warnings is the first; clang-tidy applies hundreds of named checks (`bugprone-*`, `cppcoreguidelines-*`, `performance-*`, `modernize-*`) from a `.clang-tidy` file over a `compile_commands.json`; cppcheck is compiler-independent with a low false-positive rate and MISRA support. All run in continuous integration with zero findings tolerated, which is Power of Ten rule 10.
:::

::: warning
A warning that is "just noise" is a decision someone made not to look. The compiler and the analysers are wrong sometimes, and the correct response to a false positive is a one-line suppression naming the check and the reason, so that the next reader sees a decision rather than a habit. A project with three hundred tolerated warnings has no warnings at all, because nobody reads them.
:::

## Check yourself

::: check
The timing harness reported a median of 236 ns and a maximum of 63 699 ns. Which number does a real-time schedulability analysis use, what most likely caused the maximum on the machine used here, and what would you do next?
:::

::: answer
The analysis uses the worst case — the maximum, or a high percentile with a justified margin — because the scheduler must guarantee every cycle, not the typical one. A 64 µs excursion in a 236 ns computation is not the arithmetic; it is the platform: the operating system pre-empted the process, serviced an interrupt or took a page fault. The next step is to determine whether the target platform has the same sources of jitter — a real-time kernel with the loop pinned to a core and interrupts routed elsewhere shrinks them by orders of magnitude — and to measure there, recording the maximum over a run long enough to be representative.
:::

::: check
Name the valgrind tool for each job: finding a read of an uninitialised `double`; counting how many heap allocations a run makes; drawing peak heap usage over time; counting cache misses per source line; comparing the instruction counts of two builds.
:::

::: answer
memcheck for the uninitialised read (with `--track-origins=yes` to see where the value came from); memcheck again for the allocation count, which it prints as `total heap usage` at exit; massif for the heap profile over time, rendered with `ms_print`; cachegrind for cache misses attributed to lines, with `--cache-sim=yes`; callgrind for deterministic instruction counts and the call graph. All run on the unmodified binary, built with `-g`, at a 20–50× slowdown.
:::

::: check
In the cachegrind results both sweeps show 133 253 write misses, while read misses are 143 279 for the row sweep and 1 060 782 for the column sweep. Account for all three numbers.
:::

::: answer
The write misses come from initialising the vector: $1024 \times 1024$ doubles are 8 MiB, which is 131 072 cache lines of 64 bytes, one miss each, plus a little overhead — the same in both programs because the initialisation is identical. The row sweep reads consecutive addresses, so it misses once per line, about 131 072 times, and the 143 279 figure is that plus the vector's own bookkeeping. The column sweep reads one double from each of 1024 lines per column, a 64 KiB working set that exceeds the 32 KiB first-level cache, so every line is evicted before the next column returns to it: essentially one miss per read, 1 048 576 reads, 1 060 782 misses. Same additions, seven times the cache traffic.
:::

::: check
clang-tidy reports `performance-unnecessary-value-param` on `void consume(std::vector<double> samples)` and `bugprone-use-after-move` on `buffer.size()`. Give the fix for each and the lesson of this module each fix comes from.
:::

::: answer
`consume` only reads `samples`, so take it by `const` reference — `const std::vector<double>& samples` — and no copy of the thousand elements is made (lesson 2, passing large objects you only read by `const T&`). The use after move is fixed by not reading `buffer` after `std::move(buffer)`: read the size before the move, or ask the callee, or simply drop the line; a moved-from object is valid but unspecified and the only sensible operations are assignment and destruction (lesson 3). If a project has `WarningsAsErrors` naming `bugprone-use-after-move`, the second finding fails the build until it is fixed.
:::

::: check
When would you reach for `perf` rather than valgrind, and when the reverse?
:::

::: answer
`perf` samples a program running at full speed with negligible overhead, so it is the tool for questions about *real* time: where a loop spends its cycles on the bench, whether it is memory-bound (instructions per cycle), how it behaves under realistic load, including on a hardware-in-the-loop rig. Valgrind slows the program 20–50× and changes its timing entirely, so it is useless for measuring time, but it observes *everything* deterministically: every allocation, every uninitialised read, every cache miss attributed to a line, instruction counts that are identical run to run. Use `perf` to find out where time goes; use valgrind to find out exactly what the code does with memory.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `ScopedTimer` | RAII around `steady_clock::now()`; record per-cycle times into fixed storage |
| report max and p99.9 | a real-time loop is judged by its worst cycle; the mean hides it |
| `perf stat`, `perf record -g`, `perf report` | hardware counters over a run; sampled call stacks; functions by share of samples |
| instructions per cycle | well below one means the core is waiting for memory |
| valgrind | runs the unmodified binary under instrumentation, 20–50× slower, needs only `-g` |
| memcheck | invalid accesses, uninitialised values (`--track-origins=yes`), leaks, `total heap usage` count |
| massif, `ms_print` | heap size over time; the exercise's zero-allocation picture |
| cachegrind, callgrind | cache misses per line; deterministic instruction counts and call graph |
| compiler warnings | `-Wall -Wextra -Werror` plus `-Wconversion -Wshadow -Wold-style-cast -Wnon-virtual-dtor` and more |
| clang-tidy | `.clang-tidy` check families over `compile_commands.json`; `WarningsAsErrors` for the rules that must not slip |
| cppcheck | compiler-independent, low false positives, `--error-exitcode=1`, MISRA add-on |
| suppression | `// NOLINT(check): reason` at the line, never for the file |

The final lesson closes the loop with Python: the allocation-free, profiled, analysed C++ core becomes a module a Monte Carlo script can call ten thousand times.
