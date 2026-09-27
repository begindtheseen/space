---
id: l05-a-gnc-pipeline
title: A pipeline for GNC code
minutes: 26
covers:
  - 'A GNC pipeline: lint, static analysis, unit tests, coverage gate, Debug+ASan and Release builds, regression sims with tolerances, benchmark thresholds, docs, artefacts'
---

Think of the inspection line a new car goes through before it leaves the factory. One station checks that the paint has no scratches. Another checks the brakes. Another runs the engine and sniffs the exhaust. Each station is quick and checks one thing, and the cheap, fast checks come first, so a car with a dented door never wastes time on the expensive road test. No single station proves the car is good. Together they make it very hard for a bad one to slip through.

A CI pipeline for guidance, navigation and control code works the same way. It is a line of stations, and each one catches a different kind of mistake. This lesson builds the whole line for a small C++ attitude-control library, one station at a time, and runs every station for real so you can see what each one catches and what it misses. At the end you will put the stations together in one GitHub Actions workflow.

Here are the stations, in the order a change meets them:

1. **Lint and formatting**: is the code tidy and written the way the team agreed?
2. **Static analysis**: does reading the code, without running it, reveal likely bugs?
3. **Unit tests with a coverage gate**: do the pieces work, and did the tests actually run the new code?
4. **A Debug build with AddressSanitizer, and a Release build**: does the code misuse memory, and does it still behave when optimized?
5. **Regression sims with tolerances**: do the simulation results still match the approved ones?
6. **Benchmark thresholds**: did the code get slower?
7. **Docs and artifacts**: are the results saved where people can find them?

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

The simulation starts the spacecraft 0.1 rad (about 5.7 degrees) off target, with a moment of inertia of $2\,\mathrm{kg\,m^2}$, and lets the **[[PD controller|pd-controller]]** bring it back, with the torque limited to $0.05\,\mathrm{N\,m}$. The project builds with CMake, and its tests run with `ctest`, CMake's test runner. The versions used for every run in this lesson were g++ 13.3, clang-tidy and clang-format 18.1, CMake 3.28, gcovr 8.6 and Python 3.11.

## Station 1: lint and formatting

A **linter** reads code and flags style problems and suspicious patterns. A **formatter** rewrites code into one agreed layout. In CI you run the formatter in "check only" mode, so it fails the job instead of changing files:

```bash
clang-format --dry-run --Werror src/*.cpp src/*.hpp tests/*.cpp
```

`--dry-run` means "report, don't rewrite", and `--Werror` turns every report into an error, so the exit code is not zero and the job goes red. Run against the library before the team had agreed on a line length, it printed:

```text
src/attitude.cpp:14:69: error: code should be clang-formatted [-Wclang-format-violations]
double pd_torque(double angle_err_rad, double rate_rad_s, double kp, double kd) {
                                                                    ^
```

The line was longer than the default style allows. The team settled the question once, in a two-line `.clang-format` file (`BasedOnStyle: Google` and `ColumnLimit: 100`), and the check passed. For the project's Python tools, `ruff check` does the same job.

Formatting sounds trivial, and it is cheap, which is exactly why it runs first. A formatting failure costs seconds, and it keeps reviews about behavior instead of about spaces.

## Station 2: static analysis

**Static analysis** means finding bugs by reading the code, without running it. The tool knows patterns that often go wrong and checks every line for them. For C++, clang-tidy is common. It needs to know how each file is compiled, which CMake writes into a `compile_commands.json` file when the project sets `CMAKE_EXPORT_COMPILE_COMMANDS`. For Python, mypy checks type hints in the same spirit.

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

Line 28 is `double simulate(double angle0_rad, double dt_s, int steps)`. The tool's worry: a caller could write `simulate(0.01, 0.1, 20000)`, swapping the start angle and the time step. It compiles. It runs. It gives a wrong answer with no error at all, which is the silent kind of failure a simulator cannot afford.

The team has two honest choices. Fix it, for example by passing a small struct with named fields so the order cannot be confused. Or accept it on purpose and say why, right above the definition:

```cpp
// NOLINTNEXTLINE(bugprone-easily-swappable-parameters): order matches the interface spec
```

With that line in place, the same command exits with code 0. Either way the decision is written down and reviewed, not silently ignored.
:::

::: warning A suppression without a reason is a hidden bug
Static analyzers have false alarms, and turning one off is sometimes right. But a bare `NOLINT` tells the next reader nothing. Always name the check and give the reason on the same line, so a reviewer can disagree.
:::

## Station 3: unit tests and the coverage gate

Unit tests call each function with known inputs and compare the result with the expected answer. The test file for this library checks, for example, that `window_mean` of the gyro samples `{0.10, 0.12, 0.11, 0.13}` over the last two is 0.12, that the clamp limits $0.2\,\mathrm{N\,m}$ to $0.05\,\mathrm{N\,m}$, and that the simulation settles to within $10^{-6}$ rad of zero after 200 s.

Passing tests tell you that what was tested works. They do not tell you *how much* was tested. For that, you measure **coverage**: which lines of the code actually ran while the tests ran. To get it, you compile with `--coverage`, which adds counters to every line, run the tests, and ask a tool such as gcovr to add up the counts.

A **coverage gate** is a threshold: if coverage is below it, the job fails.

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

Exit code 2, so the job fails. The report also lists the lines that never ran: 18 to 25 is the clamp, 28 to 37 is the simulation. The gate did its job: it caught new code that arrived without tests.

**Suite C: calls everything, checks nothing.** This test calls every function and throws the answers away:

```cpp
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

Suite C is the lesson. Coverage measures **execution**: a line ran. It says nothing about whether any test **checked** what that line did. So a coverage number tells you which code is certainly *un*tested (the lines that never ran), but not which code is well tested.

::: key What is a coverage gate, and its failure mode?
A threshold below which CI fails. It catches untested new code, but coverage measures execution, not assertion quality: a suite can execute every line and check nothing. Use it as a floor, never as a definition of done.
:::

The kind of coverage above is **line coverage** (also called statement coverage): the share of lines that ran. It is the weakest kind. **Branch coverage** asks whether each `if` went both ways. Stricter still is **[[MC/DC|mcdc]]**, which flight software standards require for the most critical code. And **requirements coverage**, whether each requirement has a test that verifies it, is a different measure altogether: it is about what was checked, not what ran. A green line-coverage gate proves none of these.

For Python code the gate is one option on pytest (with the pytest-cov plugin): `pytest --cov=mysim --cov-fail-under=85`. When a project falls short, its last lines read like this real run:

```text
FAIL Required test coverage of 85% not reached. Total coverage: 69.86%
3 passed in 0.21s
```

All three tests passed, and the job still failed, because the gate is a separate check from the tests.

## Station 4: two builds, Debug with AddressSanitizer and Release

A C++ program can be built in very different ways from the same source. Two matter most here.

A **Debug** build turns optimization off (`-O0`) and keeps debug information. Add **AddressSanitizer**, or **ASan**, with `-fsanitize=address`, and the compiler puts a check around every memory access. If the program reads or writes memory it does not own, ASan stops it immediately and prints exactly where. The price is speed: the AddressSanitizer documentation describes a typical slowdown of about two times, and the program uses more memory.

A **Release** build is what you ship: optimized (`-O2` or `-O3`), no sanitizer, fast.

Why run both? Because each one hides bugs the other shows.

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

Read it top down. **Heap-buffer-overflow**: something read past the end of a block of memory from the heap. **READ of size 8**: eight bytes, one `double`. The stack trace names the file and line, `attitude.cpp:9`, which is `sum += samples[i];`. And "0 bytes after 32-byte region" says the read landed right after a block of 32 bytes, which is the vector's four doubles at 8 bytes each. The test failed, and the job goes red, on the pull request that introduced the bug.

`-fno-omit-frame-pointer` keeps a little bookkeeping in each function call so the stack trace is complete.
:::

ASan catches reads and writes past the end of arrays, use of memory after it was freed, and freeing twice. It catches them the moment they happen, every time the code path runs, instead of whenever the damage happens to show. That is why a use-after-free that only corrupts results in an optimized build is still caught: the Debug-plus-ASan job flags the bad access directly, and the Release job, running the same tests, checks the build you ship.

The Release job is not just a formality. Optimization really changes behavior:

- **It exposes undefined behavior.** C++ lets the optimizer assume that undefined things, like signed integer overflow, never happen. Code that relies on them can work at `-O0` and break at `-O2`.
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

Timing is noisy, so the benchmark program is careful. It runs the simulation a few times first to **warm up** (fill the caches, let the processor settle its clock speed), then times 15 repetitions and reports the **median**, the middle value, which ignores a few unlucky runs. A small Python script compares the result with the baseline and fails above a 10 percent threshold.

::: example A false alarm and a real regression
The baseline in `bench/baseline.json` is $35.5\,\mathrm{ns}$ per simulation step. The threshold is 10 percent, so anything above $35.5 \times 1.1 = 39.05\,\mathrm{ns}$ fails.

**Run 1, unchanged code**, on a machine that was busy with other work:

```text
simulate_ns_per_step: baseline 35.5, now 40.3, change +13.7%  TOO SLOW
```

The check: $(40.348 - 35.5) / 35.5 = 0.137$, so 13.7 percent. Nothing in the code changed. Ten more back-to-back runs of the same program gave medians from 35.3 to 35.9 ns, within 2 percent. The first run was a **false alarm** caused by noise on a shared machine.

**Run 2, a real regression.** Someone split every simulation step into four smaller substeps "for accuracy". The unit tests still pass. The benchmark:

```text
simulate_ns_per_step: baseline 35.5, now 139.9, change +294.1%  TOO SLOW
```

Almost exactly four times the work, and four times the time: $(139.9 - 35.5) / 35.5 = 2.94$, an increase of 294 percent. This is the quiet algorithmic regression the job exists for. It becomes a build failure, and the author has to either justify the cost or find a cheaper way.
:::

Run 1 is why a benchmark job needs a **consistent runner**: the same machine, with nothing else running, every time. Hosted runners are shared virtual machines, and their speed varies from job to job. Teams usually give benchmarks a dedicated self-hosted runner (the `bench` label in the workflow below) and set the threshold well above that machine's measured noise.

::: key What does a performance-regression job assert?
That a benchmarked hot path stays within a threshold of its baseline, e.g. no more than 10 percent slower, measured on a consistent runner with warmup and repetitions, so a quiet algorithmic regression is caught as a build failure.
:::

## Station 7: docs and artifacts

Two last jobs keep the results where people can find them.

**Docs.** A docs job builds the API documentation from the comments in the code, with a tool such as Doxygen for C++ or Sphinx for Python. Set it to treat warnings as errors (`WARN_AS_ERROR = YES` in Doxygen's settings file, `-W` for Sphinx), and a function whose documentation no longer matches its parameters fails the build.

**Artifacts.** Everything a reviewer or a later job needs is uploaded: the coverage report, the Release binaries, the regression output, the docs. The coverage report is uploaded with `if: always()`, because the day the gate fails is the day someone needs to see which lines were missed.

::: warning Artifacts do not keep file permissions
When a job uploads a compiled program as an artifact and another job downloads it, the "executable" permission is lost. Running it gives "Permission denied". Add `chmod +x` after the download, as the workflow below does, or pack the files into a `.tar` archive, which keeps permissions.
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

- **The shape.** `lint` runs first because it is fastest. The three build jobs `needs: lint`, so they start together once it passes, each on its own runner. `regression` and `benchmark` need the Release binaries, so they wait for `release`. Static analysis and docs depend on nothing and start right away. The result is a [[graph of jobs|job-graph]], not a single line, and the total time is set by the longest chain.
- **`concurrency`.** If you push a new commit to a pull request while the old one is still being checked, the old run is cancelled. Nobody needs results for a commit that has been replaced. On `main`, the expression is false, so every merge is checked to the end.
- **`permissions: contents: read`.** The automatic token can read the code and nothing else. A pipeline that only checks things needs no more.
- **`timeout-minutes`** on every job, so a hung simulation fails in minutes instead of holding a runner for hours.

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

When a pull-request pipeline has grown too slow, split first: move the long jobs to the schedule. Adding more runners can make things faster, but more hardware does not fix a design that puts an hour of work in front of every merge. Do it after the split, not instead of it.

::: warning Do not make it fast by removing checks
When a pipeline is slow, the tempting fixes are to drop the coverage gate or make checks optional. That makes it fast by making it useless. Move slow checks to a schedule, where they still run every day; do not delete them.
:::

## Check yourself

::: check
Put these stations in a sensible order for a pull request and say why: unit tests, clang-format check, Release build, regression sim.
:::

::: answer
clang-format first, because it takes seconds and fails for the most trivial reasons, so there is no point spending minutes compiling code that will be rejected for its layout. Then the Release build, since the tests and the regression sim both need compiled code. Unit tests next: they are fast and point to a specific function. The regression sim last, because it needs the built simulator and takes longer. In the workflow, the unit-test job and the Release job each build their own copy and run side by side, and the regression job `needs:` the Release build.
:::

::: check
A team's tests pass and line coverage is 92 percent. The manager says "so the code is 92 percent verified". What is wrong with that sentence?
:::

::: answer
92 percent line coverage only means 92 percent of lines ran while the tests ran. A test can run a line without checking its result, as the "calls everything, checks nothing" suite showed, reaching 100 percent. Coverage also says nothing about requirements: whether each requirement has a test that verifies it is a different measure. And line coverage is weaker than branch coverage or MC/DC. The honest statement is: "8 percent of the lines were never run by any test".
:::

::: check
In the off-by-one example, the Release build passed. Give two reasons you still want the Release job in the pipeline, not only the ASan job.
:::

::: answer
First, the Release build is what ships, so its behavior is the one that matters: optimization can expose undefined behavior that is harmless at `-O0`, and it can change floating-point results (like the fused multiply-add giving $5.55 \times 10^{-17}$ instead of 0). Second, timing: code that meets its deadline only matters in the build that flies, and the benchmark job needs Release binaries. The ASan job finds memory errors precisely; the Release job checks the product. Each catches what the other hides.
:::

::: check
The benchmark baseline is 120 ns per call and the threshold is 10 percent. Today's median is 129 ns. Does the job pass? And what would you check before trusting a failure at 135 ns?
:::

::: answer
The limit is $120 \times 1.10 = 132$ ns. The change is $(129 - 120)/120 = 0.075$, or 7.5 percent, so it passes. At 135 ns the change is $15/120 = 12.5$ percent, a failure. Before trusting it, check that it ran on the usual dedicated runner with nothing else running, rerun it to see whether the result repeats, and compare with the runner's known noise. A real regression repeats; a noisy outlier does not.
:::

::: check
The pull-request pipeline has reached 40 minutes because it now runs a 2,000-case Monte Carlo and a matrix of three compilers on two operating systems. What do you change?
:::

::: answer
Split it. Keep lint, static analysis, unit tests with the coverage gate, the ASan and Release builds, and a small regression set on every pull request, aiming for under about ten minutes. Move the 2,000-case Monte Carlo and the full compiler and OS matrix to a nightly scheduled workflow (lesson 6), which still runs them every day and reports failures. Only after the split, add runners if the fast part is still too slow.
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

::: context mcdc The strictest common coverage measure
MC/DC stands for modified condition/decision coverage. For every decision like `if (a && b)`, it asks that each condition (`a`, and separately `b`) be shown, by some test, to change the decision's outcome on its own while the others are held fixed. That needs far more careful tests than running each line once. The DO-178C standard for airborne software requires MC/DC for its most critical level, software whose failure could cause a catastrophe. You will meet it again when the course reaches flight-software certification.
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
