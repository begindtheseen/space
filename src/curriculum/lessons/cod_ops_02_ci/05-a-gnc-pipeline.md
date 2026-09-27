---
id: l05-a-gnc-pipeline
title: A pipeline for GNC code
minutes: 28
covers:
  - 'A GNC pipeline: lint, static analysis, unit tests, coverage gate, Debug+ASan and Release builds, regression sims with tolerances, benchmark thresholds, docs, artefacts'
---

Think of the inspection line a new car goes through at the factory. One station checks the paint, another the brakes, another sniffs the exhaust. Each is quick and checks one thing, and the cheap checks come first, so a car with a dented door never wastes time on the road test. No single station proves the car is good. Together they make it very hard for a bad one to slip through.

A CI pipeline for guidance, navigation and control code works the same way. This lesson builds the whole line, seven stations from linting to published artifacts, for a small C++ attitude-control library, runs every station for real so you can see what each catches and misses, and then joins them in one GitHub Actions workflow.

## The code under test

The library is small on purpose. It has four functions: a smoothing filter for gyro readings, a PD control law, a torque limiter, and a single-axis attitude simulation that ties them together. Here is the header, `src/attitude.hpp`:

```cpp
#pragma once
#include <cstddef>
#include <vector>

namespace gnc {

// Mean of the last n gyro samples (a simple smoothing filter).
double window_mean(const std::vector<double>& samples, std::size_t n);

// PD control law: torque that pushes the angle error and the rate to zero.
double pd_torque(double angle_err_rad, double rate_rad_s, double kp, double kd);

// Limit a commanded torque to what the reaction wheel can deliver.
double clamp_torque(double torque_nm, double max_nm);

// Single-axis attitude sim: returns the angle (rad) after `steps` steps of dt.
double simulate(double angle0_rad, double dt_s, int steps);

}  // namespace gnc
```

The simulation starts the spacecraft 0.1 rad (about 5.7 degrees) off target, with a moment of inertia of $2\,\mathrm{kg\,m^2}$, and lets the **[[PD controller|pd-controller]]** bring it back, with the torque limited to $0.05\,\mathrm{N\,m}$. The project builds with CMake and runs its tests with `ctest`, CMake's test runner. Every run below used g++ 13.3, clang-tidy and clang-format 18.1, CMake 3.28, gcovr 8.6 and Python 3.11.

## Station 1: lint and formatting

A **linter** reads code and flags style problems and suspicious patterns. A **formatter** rewrites code into one agreed layout. In CI you run the formatter in "check only" mode, so it fails the job instead of changing files:

```bash
clang-format --dry-run --Werror src/*.cpp src/*.hpp tests/*.cpp
```

`--dry-run` means "report, don't rewrite", and `--Werror` turns every report into an error, so the job goes red. Checked against Google's published style (add `--style=Google`), the library had one complaint:

```text
src/attitude.cpp:14:69: error: code should be clang-formatted [-Wclang-format-violations]
double pd_torque(double angle_err_rad, double rate_rad_s, double kp, double kd) {
                                                                    ^
```

The line was longer than that style's 80 characters. The team settled the question once, in a two-line `.clang-format` file (`BasedOnStyle: Google` and `ColumnLimit: 100`), and the check passed. For Python, `ruff check` lints and `ruff format --check` checks the layout. Formatting is cheap, which is why it runs first: a failure costs seconds, and reviews stay about behavior instead of spaces.

## Station 2: static analysis

**Static analysis** means finding bugs by reading the code, without running it. The tool knows patterns that often go wrong and checks every line for them. For C++, clang-tidy is common; it reads how each file is compiled from a [[compile_commands.json|compile-commands]] file that CMake writes. For Python, mypy checks type hints in the same spirit.

::: example A bug waiting to happen, found by reading
Run clang-tidy with its "bugprone" and "performance" families of checks, treating warnings as errors:

```bash
clang-tidy -p build --checks='-*,bugprone-*,performance-*' --warnings-as-errors='*' src/attitude.cpp
```

The `-*` first turns every check off, then `bugprone-*` and `performance-*` turn two families back on. Its report:

```text
src/attitude.cpp:28:17: error: 3 adjacent parameters of 'simulate' of convertible types are easily swapped by mistake [bugprone-easily-swappable-parameters,-warnings-as-errors]
1 warning treated as error
```

Line 28 is `double simulate(double angle0_rad, double dt_s, int steps)`. The worry: a caller could write `simulate(0.01, 0.1, 20000)`, swapping the start angle and the time step. It compiles, runs, and gives a wrong answer with no error at all.

The team has two honest choices. Fix it, for example with a small struct of named fields. Or accept it on purpose and say why, right above the definition:

```cpp
// NOLINTNEXTLINE(bugprone-easily-swappable-parameters): order matches the interface spec
```

With that line in place, the same command exits with code 0, and the decision is written down where a reviewer sees it.
:::

::: warning A suppression without a reason is a hidden bug
Static analyzers have false alarms, and turning one off is sometimes right. But a bare `NOLINT` tells the next reader nothing. Always name the check and give the reason on the same line, so a reviewer can disagree.
:::

## Station 3: unit tests and the coverage gate

Unit tests call each function with known inputs and compare the result with the expected answer. The test file for this library checks, for example, that `window_mean` of the gyro samples `{0.10, 0.12, 0.11, 0.13}` over the last two is 0.12, that the clamp limits $0.2\,\mathrm{N\,m}$ to $0.05\,\mathrm{N\,m}$, and that the simulation settles to within $10^{-6}$ rad of zero after 200 s.

Passing tests say that what was tested works, not *how much* was tested. For that you measure **coverage**: which lines of the code ran while the tests ran. Compile with `--coverage`, which adds a counter to every line, run the tests, and let a tool such as gcovr add up the counts. A **coverage gate** is a threshold: below it, the job fails.

```bash
gcovr --root . --filter src/ --fail-under-line 85
```

`--filter src/` counts only the library, not the tests themselves. `--fail-under-line 85` fails the job if fewer than 85 percent of lines ran.

::: example Three test suites, three coverage reports
**Suite A: the full tests.** Every function is called and checked.

```text
File                                       Lines     Exec  Cover   Missing
------------------------------------------------------------------------------
src/attitude.cpp                              23       23   100%
```

Exit code 0. The gate passes.

**Suite B: only the first two tests.** Someone added the clamp and the simulation but tested only `window_mean` and `pd_torque`.

```text
src/attitude.cpp                              23        8    34%   18-20,22-23,25,28-35,37
------------------------------------------------------------------------------
TOTAL                                         23        8    34%
------------------------------------------------------------------------------
(ERROR) Failed minimum line coverage (got 34.8%, minimum 85.0%)
```

Exit code 2, so the job fails, and the report lists the lines that never ran: 18 to 25 is the clamp, 28 to 37 the simulation. The gate caught new code that arrived without tests.

**Suite C: calls everything, checks nothing.** This test calls every function and throws the answers away:

```cpp
#include <cstdio>
#include <vector>

#include "attitude.hpp"

// Calls everything, checks nothing.
int main() {
  const std::vector<double> gyro = {0.10, 0.12, 0.11, 0.13};
  gnc::window_mean(gyro, 2);
  gnc::clamp_torque(0.2, 0.05);
  gnc::clamp_torque(-0.2, 0.05);
  gnc::simulate(0.1, 0.01, 20000);
  std::printf("PASS\n");
  return 0;
}
```

```text
src/attitude.cpp                              23       23   100%
TOTAL                                         23       23   100%
```

100 percent, and the gate passes. Yet this suite would pass if `window_mean` returned 42.
:::

Suite C is the lesson. Coverage measures **execution**: a line ran. It says nothing about whether any test **checked** what that line did. So coverage tells you which code is certainly *un*tested, never which code is well tested.

::: key What is a coverage gate, and its failure mode?
A threshold below which CI fails. It catches untested new code, but coverage measures execution, not assertion quality: a suite can execute every line and check nothing. Use it as a floor, never as a definition of done.
:::

The kind of coverage above is **line coverage** (also called statement coverage): the share of lines that ran. It is the weakest kind. **Branch coverage** asks whether each `if` went both ways. Stricter still is **[[MC/DC|mcdc]]**, which flight software standards require for the most critical code. And **requirements coverage**, whether each requirement has a test that verifies it, is a different measure altogether: it is about what was checked, not what ran. A green line-coverage gate proves none of these.

For Python the gate is an option of pytest's pytest-cov plugin: `pytest --cov=mysim --cov-fail-under=85`. A project that falls short ends like this:

```text
FAIL Required test coverage of 85% not reached. Total coverage: 69.86%
3 passed in 0.21s
```

All three tests passed, and the job still failed: the gate is a separate check.

## Station 4: two builds, Debug with AddressSanitizer and Release

The same C++ source can be built in very different ways. Two matter most here. A **Debug** build turns optimization off (`-O0`) and keeps debug information. Add **AddressSanitizer**, or **ASan**, with `-fsanitize=address`, and the compiler puts [[a check around every memory access|asan-shadow]]. If the program reads or writes memory it does not own, ASan stops it immediately and prints exactly where. The price is speed: the AddressSanitizer documentation describes a typical slowdown of about two times, and the program uses more memory.

A **Release** build is what you ship: optimized (`-O2` or `-O3`), no sanitizer, fast. Each one hides bugs the other shows.

::: example A bug that only one build catches
Someone "improves" `window_mean` and slips in an off-by-one error: `<=` where `<` belongs.

```cpp
double window_mean(const std::vector<double>& samples, std::size_t n) {
  double sum = 0.0;
  const std::size_t start = samples.size() - n;
  for (std::size_t i = start; i <= samples.size(); ++i) {  // BUG: one past the end
    sum += samples[i];
  }
  return sum / static_cast<double>(n);
}
```

With four samples, the loop now also reads `samples[4]`, which does not exist. What happens depends on the build.

**Release build** (`cmake -DCMAKE_BUILD_TYPE=Release`), full test suite:

```text
PASS (0 failures)
```

It passed. The eight bytes after the vector must have held a zero, or something tiny, on that run, so the sum came out the same. Next time, with other data in memory, it might not.

**Debug build with ASan**:

```bash
cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-fsanitize=address -fno-omit-frame-pointer"
cmake --build build-asan
ctest --test-dir build-asan --output-on-failure
```

(The backslash `\` at the end of a line means "the command continues on the next line".) Output, trimmed:

```text
==12379==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x503000000060 ...
READ of size 8 at 0x503000000060 thread T0
    #0 0x55fc697a1afd in gnc::window_mean(std::vector<double, std::allocator<double> > const&, unsigned long) src/attitude.cpp:9
    #1 0x55fc697a0616 in main tests/test_attitude.cpp:18

0x503000000060 is located 0 bytes after 32-byte region [0x503000000040,0x503000000060)
SUMMARY: AddressSanitizer: heap-buffer-overflow src/attitude.cpp:9 in gnc::window_mean(...)
```

Read it top down. **Heap-buffer-overflow**: something read past the end of a block of memory from the [[heap|heap-memory]]. **READ of size 8**: eight bytes, one `double`. The stack trace names the file and line, `attitude.cpp:9`, which is `sum += samples[i];`. And "0 bytes after 32-byte region" says the read landed right after a block of 32 bytes, which is the vector's four doubles at 8 bytes each. The test failed, and the job goes red, on the pull request that introduced the bug.

`-fno-omit-frame-pointer` keeps a little bookkeeping in each function call so the stack trace is complete.
:::

ASan catches reads and writes past the end of arrays, use of memory after it was freed, and freeing twice. It catches them the moment they happen, every time the code path runs, instead of whenever the damage happens to show. That is why a use-after-free that only corrupts results in an optimized build is still caught: the Debug-plus-ASan job flags the bad access directly, and the Release job, running the same tests, checks the build you ship.

The Release job is not just a formality. Optimization really changes behavior:

- **It exposes undefined behavior.** C++ lets the optimizer assume that [[undefined things|undefined-behavior]], like signed integer overflow, never happen. Code that relies on them can work at `-O0` and break at `-O2`.
- **It changes floating-point arithmetic**, as the example below shows.
- **It changes timing.** Code that is fast enough in Release may miss a deadline in Debug, and a race between threads may only show up at one speed.

::: example Same source, two answers
Here is a one-line function, `a * b + c`, called with $a = 0.1$, $b = 10$, $c = -1$. The `volatile` stops the compiler from working out the answer while compiling:

```cpp
#include <cstdio>

double residual(double a, double b, double c) { return a * b + c; }

int main() {
  volatile double a = 0.1, b = 10.0, c = -1.0;
  std::printf("%.3g\n", residual(a, b, c));
}
```

Built with g++ 13.3 at two optimization levels, both for the same processor family:

```text
$ g++ -O0 -march=haswell fma.cpp -o fma && ./fma
0
$ g++ -O2 -march=haswell fma.cpp -o fma && ./fma
5.55e-17
```

With `-march=haswell` the compiler may use the processor's **[[fused multiply-add|fused-multiply-add]]** instruction, and at `-O2` it does: it computes `a * b + c` in one step, rounding once. At `-O0` it rounds `a * b` to exactly 1.0 first, and $1 - 1$ is exactly 0. Neither answer is wrong. They differ in the last bits, and a simulation that runs millions of such steps inherits the difference. Adding `-ffp-contract=off` to the `-O2` build forbids the fusing, and it prints 0 again.
:::

::: key Why run both a Debug-plus-ASan job and an optimised Release job?
Sanitizers need instrumented, unoptimised builds to report precise faults, but optimisation itself changes behaviour: it exposes undefined behaviour, different floating-point contraction and different timing. Each job catches bugs the other hides.
:::

## Station 5: regression sims with tolerances

Unit tests check small pieces. A **regression sim** runs a whole reference scenario and compares the output with a **golden file**: a saved result the team reviewed and approved. For this library, a small program prints the attitude angle once a second through a 60-second slew, and the golden file holds the approved CSV.

The comparison must use a **tolerance**, not exact equality, and the fused multiply-add example shows why. The golden file was made with a plain Release build. The same program built with `-march=haswell` produced a file that differs from it. Compared with no tolerance at all, then with a small one:

```text
$ python3 tools/compare_golden.py fma.csv golden/regression.csv --rtol 0 --atol 0
t: ok (largest difference 0)
angle: FAIL at row 7: -0.007286103374014379 vs -0.0072861033740143815
$ python3 tools/compare_golden.py fma.csv golden/regression.csv --rtol 1e-9 --atol 1e-12
t: ok (largest difference 0)
angle: ok (largest difference 2.6e-18)
```

A difference of $2.6 \times 10^{-18}$ rad is meaningless physically, but exact equality would turn it into a red build. The next lesson is all about this station: how the tolerance rule works, how to choose `rtol` and `atol` from the physics, and when to update a golden file.

## Station 6: benchmark thresholds

A GNC simulation that gets twice as slow still gives the right answers, so no functional test will notice. But a Monte Carlo campaign that took one night now takes two, and flight code that got slower may miss its real-time deadline. A **performance-regression job** times a hot path and fails if it got too much slower than a recorded **baseline**.

Timing is noisy, so the benchmark program is careful. It runs the simulation a few times first to **warm up** (fill the caches, let the processor settle its clock speed), then times 15 repetitions and reports the **[[median|median-timing]]**, the middle value, which ignores a few unlucky runs. A small Python script compares the result with the baseline and fails above a 10 percent threshold.

::: example A false alarm and a real regression
The baseline in `bench/baseline.json` is $35.5\,\mathrm{ns}$ per simulation step. The threshold is 10 percent, so anything above $35.5 \times 1.1 = 39.05\,\mathrm{ns}$ fails.

**Run 1, unchanged code**, run once right after building:

```text
simulate_ns_per_step: baseline 35.5, now 40.3, change +13.7%  TOO SLOW
```

The check: $(40.348 - 35.5) / 35.5 = 0.137$, so 13.7 percent. Nothing in the code changed. Ten more back-to-back runs of the same program gave medians from 35.3 to 35.9 ns, within 2 percent. The first run was a **false alarm**: noise, not code.

**Run 2, a real regression.** Someone split every simulation step into four smaller substeps "for accuracy". The unit tests still pass. The benchmark:

```text
simulate_ns_per_step: baseline 35.5, now 139.9, change +294.1%  TOO SLOW
```

Four times the work, four times the time: $(139.9 - 35.5) / 35.5 = 2.94$, an increase of 294 percent. This quiet algorithmic regression is what the job exists for. It is now a build failure, and the author must justify the cost or find a cheaper way.
:::

Run 1 is why a benchmark job needs a **consistent runner**: the same machine, with nothing else running, every time. Hosted runners are shared virtual machines whose speed varies from job to job, so teams give benchmarks a dedicated self-hosted runner (the `bench` label below) and set the threshold well above its measured noise.

::: key What does a performance-regression job assert?
That a benchmarked hot path stays within a threshold of its baseline, e.g. no more than 10 percent slower, measured on a consistent runner with warmup and repetitions, so a quiet algorithmic regression is caught as a build failure.
:::

## Station 7: docs and artifacts

**Docs.** A docs job builds the API documentation from the code comments, with Doxygen for C++ or Sphinx for Python. With warnings treated as errors (`WARN_AS_ERROR = YES` in Doxygen's settings file, `-W` for Sphinx), documentation that no longer matches a function's parameters fails the build.

**Artifacts.** Everything a reviewer or a later job needs is uploaded: coverage report, Release binaries, regression output, docs. The coverage report goes up with `if: always()`, because the day the gate fails is the day someone needs to see which lines were missed.

::: warning Artifacts do not keep file permissions
A compiled program uploaded by one job and downloaded by another loses its "executable" permission, and running it gives "Permission denied". Add `chmod +x` after the download, as below, or pack the files into a `.tar` archive, which keeps permissions.
:::

## The whole pipeline

Here are all seven stations as one GitHub Actions workflow. It passes actionlint 1.7.12.

```yaml
name: GNC pull request
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: pr-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v7
      - run: sudo apt-get update && sudo apt-get install -y clang-format
      - run: clang-format --dry-run --Werror src/*.cpp src/*.hpp tests/*.cpp
      - run: pipx run ruff check tools/

  static-analysis:
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - run: sudo apt-get update && sudo apt-get install -y clang-tidy
      - run: cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
      - run: clang-tidy -p build --checks='-*,bugprone-*,performance-*' --warnings-as-errors='*' src/*.cpp

  unit-coverage:
    needs: lint
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - run: cmake -S . -B build-cov -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS=--coverage
      - run: cmake --build build-cov
      - run: ctest --test-dir build-cov --output-on-failure
      - name: Coverage gate (fails under 85 percent of lines)
        run: pipx run gcovr --root . --filter src/ --fail-under-line 85 --html-details coverage.html
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: coverage-report
          path: coverage*.html

  debug-asan:
    needs: lint
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - run: >
          cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=Debug
          -DCMAKE_CXX_FLAGS="-fsanitize=address -fno-omit-frame-pointer"
      - run: cmake --build build-asan
      - run: ctest --test-dir build-asan --output-on-failure

  release:
    needs: lint
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - run: cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
      - run: cmake --build build-release
      - run: ctest --test-dir build-release --output-on-failure
      - uses: actions/upload-artifact@v7
        with:
          name: release-binaries
          path: |
            build-release/sim_regression
            build-release/bench_sim

  regression:
    needs: release
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - uses: actions/download-artifact@v8
        with:
          name: release-binaries
          path: build-release
      - run: chmod +x build-release/*
      - uses: actions/setup-python@v7
        with:
          python-version: "3.12"
      - run: python -m pip install numpy
      - run: ./build-release/sim_regression > regression.csv
      - run: python tools/compare_golden.py regression.csv golden/regression.csv --rtol 1e-9 --atol 1e-12

  benchmark:
    needs: release
    runs-on: [self-hosted, linux, bench]
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      - uses: actions/download-artifact@v8
        with:
          name: release-binaries
          path: build-release
      - run: chmod +x build-release/*
      - run: ./build-release/bench_sim > current.json
      - run: python3 tools/check_bench.py bench/baseline.json current.json

  docs:
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - run: sudo apt-get update && sudo apt-get install -y doxygen
      - run: doxygen Doxyfile
      - uses: actions/upload-artifact@v7
        with:
          name: api-docs
          path: docs/html/
```

A few things to notice:

- **The shape.** `lint` runs first because it is fastest. The three build jobs `needs: lint`, so they start together once it passes. `regression` and `benchmark` wait for the Release binaries. Static analysis and docs need nothing and start at once. The result is a [[graph of jobs|job-graph]], and the total time is set by its longest chain.
- **`concurrency`** cancels the run for an older commit when you push a newer one to the same pull request. On `main` the expression is false, so every merge is checked to the end.
- **`permissions: contents: read`** lets the automatic token read the code and nothing else.
- **`timeout-minutes`** on every job makes a hung simulation fail in minutes, not hours.

## What belongs on a pull request, and what waits for the night

Every station above is fast for this small library. In a real GNC codebase some checks are slow: a full Monte Carlo of a thousand landings, a propagation over months of simulated time, a benchmark suite, the full matrix of compilers and operating systems. Put all of it on every pull request, and the pipeline takes most of an hour.

Then people stop waiting for it. They merge before it finishes, or they stop reading red results, and the gate stops protecting anything. So a pipeline is split in two:

| Pull request (every change, minutes) | Nightly (once a day, hours) |
| --- | --- |
| Lint and formatting | Full Monte Carlo dispersion |
| Static analysis | Long-horizon propagations |
| Unit tests with coverage gate | Full benchmark suite |
| Debug + ASan build and Release build | Full OS and compiler matrix |
| A small regression set | Everything else too slow for a PR |

::: key What belongs in the fast pull-request pipeline versus the nightly pipeline?
Pull request: lint, unit tests, coverage gate, sanitizer build, a small regression set. Nightly: full Monte Carlo, long-horizon propagations, performance benchmarking and cross-platform matrices. Keep the PR loop under about ten minutes or people stop reading it.
:::

::: warning Split first, and never speed up by deleting checks
When a pull-request pipeline has grown too slow, move the long jobs to the schedule, where they still run every day. Dropping the coverage gate or making checks optional makes the pipeline fast by making it useless. More runners can help, but only after the split, not instead of it: more hardware does not fix a design that puts an hour of work in front of every merge.
:::

## Check yourself

::: check
A team's tests pass and line coverage is 92 percent. The manager says "so the code is 92 percent verified". What is wrong with that sentence?
:::

::: answer
92 percent line coverage only means 92 percent of lines ran during the tests. A test can run a line without checking its result, as the "checks nothing" suite showed at 100 percent. Requirements coverage is a different measure, and line coverage is weaker than branch coverage or MC/DC. The honest statement is: "8 percent of the lines were never run by any test".
:::

::: check
In the off-by-one example, the Release build passed. Give two reasons you still want the Release job in the pipeline, not only the ASan job.
:::

::: answer
First, the Release build is what ships: optimization can expose undefined behavior that is harmless at `-O0`, and it can change floating-point results (the fused multiply-add gave $5.55 \times 10^{-17}$ instead of 0). Second, timing only matters in the build that flies, and the benchmark job needs Release binaries. The ASan job finds memory errors precisely; the Release job checks the product.
:::

::: check
The benchmark baseline is 120 ns per call and the threshold is 10 percent. Today's median is 129 ns. Does the job pass? And what would you check before trusting a failure at 135 ns?
:::

::: answer
The limit is $120 \times 1.10 = 132$ ns. The change is $(129 - 120)/120 = 0.075$, or 7.5 percent, so it passes. At 135 ns the change is $15/120 = 0.125$, or 12.5 percent, a failure. Before trusting it, check that it ran on the usual dedicated runner with nothing else running, rerun it to see whether the result repeats, and compare with the runner's known noise. A real regression repeats; a noisy outlier does not.
:::

::: check
Sort these into "every pull request" or "nightly": the clang-format check, a 2,000-case Monte Carlo, the ASan build, a 30-day orbit propagation, a 12-case regression set, the full matrix of three compilers on two operating systems.
:::

::: answer
Every pull request: the clang-format check, the ASan build and the 12-case regression set. They are fast and catch the most common breakage right where it happens. Nightly: the 2,000-case Monte Carlo, the 30-day propagation and the full compiler and OS matrix. They take far too long for a loop that should stay under about ten minutes, but they still run every day, so a break is found within a day.
:::

## Summary

| Station | Tool used here | What it catches | What it misses |
| --- | --- | --- | --- |
| Lint, format | clang-format, ruff | Layout and style drift | Anything about behavior |
| Static analysis | clang-tidy, mypy | Bug patterns, found by reading | Bugs that depend on data |
| Unit tests + coverage gate | ctest, gcovr, pytest-cov | Broken functions; untested new code | Tests that run code but check nothing |
| Debug + ASan | `-fsanitize=address` | Out-of-bounds, use-after-free, double free | Optimizer-only behavior |
| Release | `-O2` | Behavior of the shipped build | Memory errors that happen to be harmless |
| Regression sim | golden file with `rtol`, `atol` | Changed simulation results | Errors the reference also has |
| Benchmark | median of repeats vs baseline | Slowdowns above the threshold | Anything within the noise |
| Docs, artifacts | Doxygen, `upload-artifact` | Stale docs; lost evidence | Nothing about correctness |

The next lesson opens up station 5: golden files, the exact tolerance rule, and the nightly Monte Carlo job that runs the heavy scenarios on a schedule.

::: context pd-controller The control law in the example
A PD controller, short for proportional-derivative, computes a torque from two things: how far off the angle is, and how fast it is changing. Here it is $\tau = -(k_p\,\theta + k_d\,\omega)$, read "tau equals minus k p theta plus k d omega", with $k_p = 0.8$ and $k_d = 1.6$. The first term pulls the spacecraft back toward the target like a spring. The second acts like a shock absorber, so it does not overshoot and swing forever. The control modules of the course derive how to choose the two gains.
:::

::: context compile-commands How the analyzer knows the compile flags
A C++ file means different things with different flags: which headers are found, which macros are defined, which language standard applies. So clang-tidy needs the exact compile command for each file. `compile_commands.json` is a list of them, one entry per source file, and CMake writes it into the build folder when the project sets `CMAKE_EXPORT_COMPILE_COMMANDS` to `ON`. The `-p build` option tells clang-tidy which folder to look in.
:::

::: context mcdc The strictest common coverage measure
MC/DC stands for modified condition/decision coverage. For every decision like `if (a && b)`, it asks that each condition (`a`, and separately `b`) be shown, by some test, to change the decision's outcome on its own while the others are held fixed. That needs far more careful tests than running each line once. The DO-178C standard for airborne software requires MC/DC for its most critical level, software whose failure could cause a catastrophe. You will meet it again when the course reaches flight-software certification.
:::

::: context asan-shadow How AddressSanitizer keeps watch
ASan sets aside a second area of memory, the shadow memory, with one shadow byte for every 8 bytes of the program's memory. A shadow byte of `00` means all 8 bytes may be used; values like `fa` mark forbidden "redzones" that ASan places around every block it hands out. Before each load or store, the compiled code looks up the shadow byte. The vector of four doubles is 32 bytes, so four `00` shadow bytes, followed by redzone. Reading `samples[4]` touched the first redzone byte, which is why the report said "0 bytes after 32-byte region".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44" font-weight="700">memory, 8 bytes per box</text>
  <g font-size="11" text-anchor="middle">
    <rect x="10" y="30" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="35" y="50" fill="#1f2a44">[0]</text>
    <rect x="60" y="30" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="85" y="50" fill="#1f2a44">[1]</text>
    <rect x="110" y="30" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="135" y="50" fill="#1f2a44">[2]</text>
    <rect x="160" y="30" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="185" y="50" fill="#1f2a44">[3]</text>
    <rect x="210" y="30" width="50" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="2"/><text x="235" y="50" fill="#b4232c">[4]?</text>
    <rect x="260" y="30" width="50" height="30" fill="#ffffff" stroke="#6c7a93"/><text x="285" y="50" fill="#6c7a93">redzone</text>
    <rect x="10" y="80" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="35" y="100" fill="#1f2a44">00</text>
    <rect x="60" y="80" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="85" y="100" fill="#1f2a44">00</text>
    <rect x="110" y="80" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="135" y="100" fill="#1f2a44">00</text>
    <rect x="160" y="80" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="185" y="100" fill="#1f2a44">00</text>
    <rect x="210" y="80" width="50" height="30" fill="#f2b880" stroke="#b4232c" stroke-width="2"/><text x="235" y="100" fill="#b4232c">fa</text>
    <rect x="260" y="80" width="50" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="285" y="100" fill="#1f2a44">fa</text>
  </g>
  <text x="10" y="126" font-size="11" fill="#1f2a44">shadow bytes: 00 = usable, fa = redzone</text>
  <text x="318" y="50" font-size="11" fill="#1f2a44">data</text>
  <text x="318" y="100" font-size="11" fill="#1f2a44">shadow</text>
</svg>
```
:::

::: context heap-memory Stack and heap
A running program keeps its data in two main places. The stack holds each function's local variables, and it is cleaned up automatically when the function returns. The heap is a large pool from which the program asks for blocks whose size is only known while it runs; a `std::vector` keeps its elements there, because it can grow. Mistakes with heap blocks, like reading past the end or using one after it was given back, are among the most common C++ bugs, and the debugging module comes back to them in detail.
:::

::: context undefined-behavior When the language makes no promise
The C++ standard lists operations whose result it does not define at all, such as overflowing a signed integer or reading past the end of an array. The compiler is allowed to assume such things never happen, and optimizers use that to simplify code. For example, since `x + 1` can never legally overflow for a signed `int`, the test `x + 1 > x` may be treated as always true. Built with g++ 13.3, a function returning that test gave `1` (true) even for the largest `int`, where the wrapped-around value would be the most negative one. Code that leans on undefined behavior works by luck, and optimization changes the luck.
:::

::: context fused-multiply-add One rounding instead of two
A normal computer computes `a * b + c` in two steps, rounding after each: first `a * b` is rounded to the nearest double, then the sum is rounded again. A fused multiply-add, or FMA, instruction does both operations and rounds only once, at the end. That is usually a little more accurate, and faster. With $0.1 \times 10$, the exact product of the stored values is a hair above 1; two-step rounding snaps it to 1.0 and then $1 - 1 = 0$, while FMA keeps the hair, $5.55 \times 10^{-17}$. GCC merges multiplies and adds into FMAs when the target processor has the instruction and optimization allows it; the flag `-ffp-contract=off` forbids it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44" font-weight="700">Two roundings (-O0)</text>
  <rect x="10" y="32" width="90" height="30" rx="5" fill="#ffffff" stroke="#1f2a44"/>
  <text x="55" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">a * b</text>
  <rect x="120" y="32" width="90" height="30" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="165" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">round: 1.0</text>
  <rect x="230" y="32" width="120" height="30" rx="5" fill="#ffffff" stroke="#1f2a44"/>
  <text x="290" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">+ c, round: 0</text>
  <line x1="100" y1="47" x2="120" y2="47" stroke="#1f2a44" stroke-width="2"/>
  <line x1="210" y1="47" x2="230" y2="47" stroke="#1f2a44" stroke-width="2"/>
  <text x="10" y="95" font-size="12" fill="#1f2a44" font-weight="700">One rounding (FMA, -O2 -march=haswell)</text>
  <rect x="10" y="105" width="200" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="110" y="125" font-size="11" fill="#1f2a44" text-anchor="middle">a * b + c, exactly</text>
  <rect x="230" y="105" width="120" height="30" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="290" y="125" font-size="11" fill="#1f2a44" text-anchor="middle">round: 5.55e-17</text>
  <line x1="210" y1="120" x2="230" y2="120" stroke="#1f2a44" stroke-width="2"/>
</svg>
```
:::

::: context median-timing Why the middle value
Timing measurements are lopsided. A run can never be much faster than the true cost, but it can be much slower, when the operating system briefly runs something else or a cache is cold. The mean, the ordinary average, is dragged up by those slow outliers. The median, the value in the middle once the times are sorted, is not: with 15 runs it is the 8th, and up to 7 bad runs cannot move it far. That is why the benchmark prints the median of 15 repetitions.
:::

::: context job-graph The pipeline as a graph
Drawn as boxes and arrows, the workflow is a graph: each arrow means "needs". GitHub starts every job whose arrows are satisfied, in parallel, on separate runners. So the time you wait is the longest chain of arrows, here lint, then release, then regression or benchmark, not the sum of all the jobs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="80" width="60" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44"/><text x="40" y="99">lint</text>
    <rect x="110" y="30" width="95" height="30" rx="5" fill="#ffffff" stroke="#1f2a44"/><text x="157" y="49">unit-coverage</text>
    <rect x="110" y="80" width="95" height="30" rx="5" fill="#ffffff" stroke="#1f2a44"/><text x="157" y="99">debug-asan</text>
    <rect x="110" y="130" width="95" height="30" rx="5" fill="#ffffff" stroke="#1f2a44"/><text x="157" y="149">release</text>
    <rect x="250" y="110" width="95" height="30" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="297" y="129">regression</text>
    <rect x="250" y="160" width="95" height="30" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="297" y="179">benchmark</text>
    <rect x="250" y="10" width="95" height="30" rx="5" fill="#ffffff" stroke="#6c7a93"/><text x="297" y="29">static-analysis</text>
    <rect x="250" y="55" width="95" height="30" rx="5" fill="#ffffff" stroke="#6c7a93"/><text x="297" y="74">docs</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="70" y1="90" x2="110" y2="45"/>
    <line x1="70" y1="95" x2="110" y2="95"/>
    <line x1="70" y1="100" x2="110" y2="145"/>
    <line x1="205" y1="145" x2="250" y2="125"/>
    <line x1="205" y1="150" x2="250" y2="175"/>
  </g>
  <text x="297" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">no needs: start at once</text>
</svg>
```
:::
