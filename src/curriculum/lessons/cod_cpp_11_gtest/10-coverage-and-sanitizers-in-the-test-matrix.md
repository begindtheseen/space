---
id: l10-coverage-and-sanitizers-in-the-test-matrix
title: Coverage and sanitizers in the test matrix
minutes: 26
covers:
  - 'Coverage with gcov, lcov and llvm-cov; interpreting an uncovered branch'
  - 'Sanitizer builds in the test matrix'
---

The morning after a snowfall, look out over a school playground. You can see exactly where people walked: paths to the doors, a circle around the swings. You can also see, with total certainty, the corners nobody visited. The snow cannot tell you whether the people who walked were paying attention. It can only tell you where nobody went.

**Code coverage** is that snow for your program. While the tests run, counters record which lines and which branches ran. Afterwards you look for the untouched corners. On a flight computer those corners are often the most important code there is: the fault handlers, the "both sensors failed" paths, the code that runs once in a thousand flights. They are the corners tests forget, because nothing goes wrong in a normal run.

Coverage finds code that no test reached. A second tool finds bugs in the code that *was* reached. Think of a soccer referee. The final score tells you who won, but a referee watches every play and blows the whistle on a foul the score would never show. A **sanitizer** is a referee inside your program. Your tests check the score — the answers. The sanitizer watches every memory access and every thread, and stops the game at the first foul. This lesson puts both into the **test matrix**, the set of builds that CI runs on every change.

## What the counters record

The CMake module (lesson 08 there, *Sanitizer, coverage and ccache builds*) set up a `coverage` preset. It compiles with `--coverage -O0`. At compile time GCC writes a map of every branch into a `.gcno` file; when the tests run, the counts are written to a matching `.gcda` file. This lesson starts where that one stopped: reading the counts, by hand and with tools, and deciding what an untouched corner means.

Our code under test is a small piece of a drone's altitude logic. It prefers the barometer, falls back to GPS, and reports "no source" if both have failed. A second function limits a throttle command to the range 0 to 1:

```cpp
// src/altitude.cpp
#include <gnc/altitude.hpp>

namespace gnc {

Altitude select_altitude(Reading baro, Reading gps) {
    if (baro.valid) {
        return {baro.meters, Source::Baro};
    } else if (gps.valid) {
        return {gps.meters, Source::Gps};
    } else {
        return {0.0, Source::None};  // fault: no altitude source
    }
}

double clamp_throttle(double cmd) {
    double c = cmd < 0.0 ? 0.0 : cmd;
    c = c > 1.0 ? 1.0 : c;
    if (c > 1.0) {
        c = 1.0;  // "just in case"
    }
    return c;
}

}  // namespace gnc
```

`Reading` holds a value in meters and a `valid` flag; `Source` is an enum with `Baro`, `Gps` and `None`. The tests look reasonable:

```cpp
// tests/test_altitude.cpp
#include <gnc/altitude.hpp>
#include <gtest/gtest.h>

using gnc::Reading;
using gnc::Source;

TEST(SelectAltitude, PrefersBarometer) {
    auto a = gnc::select_altitude(Reading{1520.0, true}, Reading{1523.5, true});
    EXPECT_EQ(a.source, Source::Baro);
    EXPECT_DOUBLE_EQ(a.meters, 1520.0);
}

TEST(SelectAltitude, FallsBackToGps) {
    auto a = gnc::select_altitude(Reading{0.0, false}, Reading{1523.5, true});
    EXPECT_EQ(a.source, Source::Gps);
    EXPECT_DOUBLE_EQ(a.meters, 1523.5);
}

TEST(ClampThrottle, LimitsBothEnds) {
    EXPECT_DOUBLE_EQ(gnc::clamp_throttle(-0.2), 0.0);
    EXPECT_DOUBLE_EQ(gnc::clamp_throttle(0.7), 0.7);
    EXPECT_DOUBLE_EQ(gnc::clamp_throttle(1.3), 1.0);
}
```

All three pass. The question coverage answers is: what did they *not* do?

## gcov: the raw counts

**gcov** is the program that ships with GCC and turns a `.gcno` map plus a `.gcda` count file into an annotated copy of your source. You point it at the `.gcda` file. The flag `-b` adds branch counts and `-c` prints them as numbers instead of percentages.

::: example Reading gcov's report line by line
After `cmake --preset coverage`, a build and `ctest --preset coverage`, run gcov from the project folder:

```text
$ gcov -b -c build/coverage/src/CMakeFiles/gnc.dir/altitude.cpp.gcda
File '/home/you/gnc/src/altitude.cpp'
Lines executed:83.33% of 12
Branches executed:100.00% of 10
Taken at least once:80.00% of 10
No calls
Creating 'altitude.cpp.gcov'
```

The annotated file, `altitude.cpp.gcov`, lands in the current folder. Here are the lines that matter (trimmed):

```text
        -:    0:Runs:4
        2:    6:    if (baro.valid) {
branch  0 taken 1 (fallthrough)
branch  1 taken 1
        1:    8:    } else if (gps.valid) {
branch  0 taken 1 (fallthrough)
branch  1 taken 0
        1:    9:        return {gps.meters, Source::Gps};
    #####:   11:        return {0.0, Source::None};  // fault: no altitude source
        3:   18:    if (c > 1.0) {
branch  0 taken 0 (fallthrough)
branch  1 taken 3
    #####:   19:        c = 1.0;  // "just in case"
```

Read the left column first. A number is how many times that line ran. A dash means the line holds no code (a brace, a blank line). **`#####`** means the line holds code that ran **zero** times. Two lines are marked: line 11, the fault return, and line 19, the "just in case" assignment.

Now the branch lines. Each `if` has two roads, numbered 0 and 1. Branch 0 is the [[fallthrough|fallthrough]] road, into the body when the condition is true. On line 8, branch 0 was taken once (the GPS fallback test) and branch 1, the road to the final `else`, was taken **0** times. On line 18 it is the other way round: the body was never entered.

The summary lines now make sense. "Branches executed: 100% of 10" means every condition was *evaluated* at least once. "Taken at least once: 80% of 10" means only 8 of the 10 roads were *driven*: $8/10 = 0.8$. And "Lines executed: 83.33% of 12" is 10 of 12 lines: $10/12 \approx 0.8333$.

**Sanity check.** There are five `if`-shaped decisions (two `if`s in `select_altitude`, two `?:` and one `if` in `clamp_throttle`), with two roads each, which is the 10 branches gcov counted. The [[run count at the top|runs-four]], 4, is one run of the test program per test, plus one more you did not ask for.
:::

Two words from that output deserve their own definitions. **Line coverage** is the fraction of lines that ran. **Branch coverage** is the fraction of branch roads that were taken. Branch coverage is the stricter one and the one worth watching, because a whole `if` can sit on a line that ran while one of its roads never did.

## lcov: one report for the whole library

Reading `.gcov` files one at a time does not scale to a library of two hundred files. **lcov** runs gcov over a whole folder and gathers the results into one `.info` file; **genhtml** turns that into web pages, with untested lines in red.

The obvious command points lcov at the whole build folder. With lcov 2.0 and GCC 13, which is what Ubuntu 24.04 ships, it stops with an error:

```text
$ lcov --rc branch_coverage=1 --capture --directory build/coverage --output-file all.info
...
Processing build/coverage/tests/CMakeFiles/gnc_tests.dir/test_altitude.cpp.gcda
geninfo: ERROR: mismatched end line for _ZN36SelectAltitude_PrefersBarometer_Test8TestBodyEv at /home/you/gnc/tests/test_altitude.cpp:7: 7 -> 11
    (use "geninfo --ignore-errors mismatch ..." to bypass this error)
```

(The path is shortened.) The error is about the *test* file, not the library. That long name is the function a `TEST` macro creates behind the scenes, and lcov 2.0 does not like the [[line numbers GCC records for it|mismatch]]. There are two ways past it, and this lesson uses the first:

1. **Capture from the library's folder only.** We want the coverage of `gnc`, the code that flies, not of the tests. The library's counts live in `build/coverage/src`, and the macro-made functions are not there, so the error never arises. `--include` keeps only files under our own `src/`, which drops inline functions from system headers such as `<cmath>` that would otherwise appear in the report.
2. **Tell lcov to downgrade the error to a warning** with `--ignore-errors mismatch`, capture everything, and then filter. This works too, but a whole-tree number mixes test code and GoogleTest's own header functions into the total: on this project it reported $29.8\%$ branch coverage, a meaningless figure.

Here is the command we keep, and its output:

```text
$ lcov --rc branch_coverage=1 --capture --directory build/coverage/src \
       --include "$PWD/src/*" --output-file build/coverage/gnc.info
...
Found 1 data files in build/coverage/src
Processing build/coverage/src/CMakeFiles/gnc.dir/altitude.cpp.gcda
Finished .info-file creation
$ lcov --rc branch_coverage=1 --summary build/coverage/gnc.info
Summary coverage rate:
  lines......: 83.3% (10 of 12 lines)
  functions..: 100.0% (2 of 2 functions)
  branches...: 80.0% (8 of 10 branches)
```

The same 10 of 12 lines and 8 of 10 branches gcov gave, now for the whole library in one number. `genhtml --branch-coverage build/coverage/gnc.info --output-directory build/coverage/html` makes the web version.

::: warning
Counters **add up** across runs, and they belong to one particular compile of each file. Rebuild after editing a file without clearing the old counts and the test run prints `libgcov profiling error: ... overwriting an existing profile data with a different checksum`. The old `.gcda` no longer matches the new map, and the numbers after it cannot be trusted. Run `lcov --zerocounters --directory build/coverage` before every measured run, or start from a fresh build folder.
:::

## llvm-cov: Clang's source-based coverage

Clang has its own coverage system. Instead of counting the arcs of the compiled program, it counts **regions** of the source code: stretches such as "the body of this `if`" or "the right-hand side of this `&&`". This is called [[source-based coverage|source-based]]. It needs different flags, and the counts go through three steps:

```text
$ clang++ -std=c++20 -fprofile-instr-generate -fcoverage-mapping -Iinclude \
      src/altitude.cpp tests/test_altitude.cpp -lgtest -lgtest_main -pthread \
      -o build/llvm/gnc_tests
$ LLVM_PROFILE_FILE=build/llvm/gnc_tests.profraw build/llvm/gnc_tests
$ llvm-profdata merge -sparse build/llvm/gnc_tests.profraw -o build/llvm/gnc_tests.profdata
$ llvm-cov report build/llvm/gnc_tests -instr-profile=build/llvm/gnc_tests.profdata \
      -show-region-summary=false src/altitude.cpp
Filename           Functions  Missed Functions  Executed   Lines  Missed Lines   Cover   Branches  Missed Branches   Cover
src/altitude.cpp           2                 0   100.00%      17             4  76.47%         10                2  80.00%
```

(The path is shortened and the spacing narrowed.) Step by step: the flags make the compiler add counters and a map from counters to source regions. `LLVM_PROFILE_FILE` names the raw count file the program writes as it exits. `llvm-profdata merge` turns one or many raw files into an indexed profile. `llvm-cov report` prints the table, and `llvm-cov show ... -show-branches=count` prints the source with counts, like gcov's annotated file:

```text
    8|      1|    } else if (gps.valid) {
  ------------------
  |  Branch (8:16): [True: 1, False: 0]
  ------------------
   11|      0|        return {0.0, Source::None};  // fault: no altitude source
   18|      3|    if (c > 1.0) {
  ------------------
  |  Branch (18:9): [True: 0, False: 3]
  ------------------
```

The branches agree exactly with gcov: 10 branches, 2 never taken, $8/10 = 80\%$. The line numbers do not: llvm-cov counts 17 lines, gcov 12. Each tool decides differently which lines "hold code" (llvm-cov counts closing braces inside a region, for example). So compare coverage over time using **one** tool, and never compare a gcov percentage with an llvm-cov one.

Which should you use? gcov and lcov come with GCC, which most embedded flight toolchains are built on. llvm-cov's regions are more precise about conditions inside one line, and Clang 18 can also measure [[MC/DC|mcdc]], the stricter criterion avionics standards ask for. Many teams run the coverage job with whichever compiler their CI already uses.

## Reading an uncovered branch

Here is the real work. The report gives you two red lines. What do they mean?

An uncovered branch has exactly two possible meanings. **Either** the branch can happen in real life and no test makes it happen — a **gap** in the tests. **Or** the branch can never happen, whatever the inputs — **dead code**, which is a defect of its own, because it claims to handle a case that does not exist and misleads everyone who reads it. Deciding which one you are looking at, and writing it down, is the actual job.

::: key
A branch shows as uncovered: either a missing test for a reachable case, or dead logic that cannot be reached and should be removed. Both are findings; recording which one it is, is the actual work.
:::

To decide, ask: *is there any input, any state, any sequence of events that reaches this road?* Then try to write the test that does it. If you can, it was a gap. If you can prove no input reaches it, it is dead.

::: example Two red lines, two different findings
**Line 8, the road to the final `else`.** Can the barometer and the GPS both be invalid at once? Of course: a GPS dropout during a pressure-port icing event, or a power glitch that resets both. This is a reachable fault path, the one the comment even names, and no test drove it. It is a **gap**. The fix is a test:

```cpp
TEST(SelectAltitude, ReportsNoneWhenBothFail) {
    auto a = gnc::select_altitude(Reading{0.0, false}, Reading{0.0, false});
    EXPECT_EQ(a.source, Source::None);
}
```

**Line 18, the "just in case" check.** Trace the values. After line 17, `c` is either $1.0$ or a value that was not greater than $1.0$. So `c > 1.0` can never be true afterwards. The branch is **dead**.

But look harder before deleting it, because a dead branch often sits where its author sensed a real danger. What input could slip past both limits? A **[[NaN|nan]]** — "not a number", the value a floating-point calculation produces from something like $0/0$. Every comparison with NaN is false. So `NaN < 0.0` is false and `c` stays NaN; `NaN > 1.0` is false and `c` stays NaN; the dead check is false too. A NaN throttle command walks straight through all three. A test proves it:

```text
tests/test_altitude.cpp:33: Failure
Expected equality of these values:
  gnc::clamp_throttle(std::nan(""))
    Which is: nan
  0.0
    Which is: 0
```

The resolution is two changes. Delete the dead check, with a sentence in the commit saying why it could not be reached. Handle the case the author was really worried about, and test that:

```cpp
double clamp_throttle(double cmd) {
    if (std::isnan(cmd)) {
        return 0.0;  // a NaN command means upstream failed: idle
    }
    return cmd < 0.0 ? 0.0 : (cmd > 1.0 ? 1.0 : cmd);
}
```

With the two new tests (`ReportsNoneWhenBothFail` and `NanCommandMeansIdle`, which expects `0.0`), zeroed counters and a fresh run:

```text
Summary coverage rate:
  lines......: 100.0% (10 of 10 lines)
  functions..: 100.0% (2 of 2 functions)
  branches...: 100.0% (10 of 10 branches)
```

**Sanity check.** The branch count is still 10, but they are different branches: 2 from `isnan`, 4 from the nested `?:`, and 4 from `select_altitude`, which is $2 + 4 + 4 = 10$. The line count fell from 12 to 10 because the dead `if` and its body are gone.
:::

Notice what the coverage number did *not* do. It did not tell us to add a NaN test. It pointed at a line, and a person asking "why is this here?" found a real hazard next to it. That is how coverage earns its keep.

::: warning
There are three ways to make a red line go away without learning anything, and all three are common. **Deleting the branch because it is red** — without showing it is unreachable — can throw away the only code that handles a real fault. **Excluding the file**, or wrapping lines in lcov's `LCOV_EXCL_START` and `LCOV_EXCL_STOP` markers, hides the question instead of answering it. If an exclusion is truly justified (a defensive check for a hardware state you have proved impossible, say), it should be one line, with the reason written next to it, reviewed like code. **Lowering the team's coverage threshold** makes the number agree with the code instead of making the code worthy of the number. The goal is never the percentage; it is knowing what every untested road means.
:::

## Sanitizers: turning hidden bugs into failures

A test can pass while the code under it does something illegal. In C++, reading freed memory, overflowing a signed integer or two threads writing one variable at once are **undefined behavior**: the language makes no promise about what happens. Often "what happens" is that the program keeps going and gets the right answer anyway — today, on this machine, with this compiler. The bug is **latent**: present, but not showing.

A sanitizer build adds checks around every risky operation. When one fires, the program stops with a report. So the tests you already have — which drive the code down its paths — become bug detectors for everything those paths touch.

::: key
Why run the test suite under sanitizers in CI? Tests exercise the code paths, and sanitizers turn latent undefined behaviour on those paths into a deterministic failure. A green suite without sanitizers proves only that the bug did not manifest today.
:::

::: example A dangling reference that passes the ordinary build
An event log for a flight computer stores events in a `std::vector` and hands back a reference to the one it added:

```cpp
#include <gtest/gtest.h>

#include <vector>

struct Event {
    double t;      // seconds since liftoff
    double value;  // the measurement that tripped the event
    int code;      // which event it was
};

class EventLog {
public:
    const Event& add(double t, double value, int code) {
        events_.push_back({t, value, code});
        return events_.back();
    }
    std::size_t size() const { return events_.size(); }

private:
    std::vector<Event> events_;
};

TEST(EventLog, FirstEventKeepsItsCode) {
    EventLog log;
    const Event& first = log.add(0.0, 3.2, 101);
    log.add(0.5, 7.9, 102);  // the vector grows and moves its storage
    EXPECT_EQ(log.size(), 2u);
    EXPECT_EQ(first.code, 101);
}
```

The second `push_back` needs more room, so the vector allocates a bigger block, copies both events into it and frees the old block. `first` still points into the **freed** block. Built with `-Wall -Wextra` and no sanitizer, the compiler says nothing, and the test passes — at `-O0` and at `-O2`:

```text
[  PASSED  ] 1 test.
```

It passes because the freed block still held the old bytes when the test read them. Built with `-fsanitize=address,undefined -fno-sanitize-recover=all -fno-omit-frame-pointer`:

```text
==10178==ERROR: AddressSanitizer: heap-use-after-free on address 0x503000000aa0 ...
READ of size 4 at 0x503000000aa0 thread T0
    #2 ... in EventLog_FirstEventKeepsItsCode_Test::TestBody() event_log_test.cpp:28
0x503000000aa0 is located 16 bytes inside of 24-byte region [0x503000000a90,0x503000000aa8)
freed by thread T0 here:
    #8 ... in EventLog::add(double, double, int) event_log_test.cpp:14
    #9 ... in EventLog_FirstEventKeepsItsCode_Test::TestBody() event_log_test.cpp:26
```

(Trimmed.) ASan names the bug, the line that read (28), the line that freed (the `push_back` on line 14, called from line 26), and the exact spot: 16 bytes into a 24-byte `Event`.

**Sanity check.** An `Event` is two 8-byte doubles and a 4-byte `int`, $8 + 8 + 4 = 20$ bytes, padded to 24 so the next event's doubles line up on 8-byte boundaries. `code` starts after the two doubles, at byte 16, and is 4 bytes long: the "READ of size 4" at offset 16. The fix is to return an index or a copy, not a reference into a container that can move.
:::

ASan with UBSan is one sanitizer build. Concurrency bugs need a different one: **ThreadSanitizer** (TSan), which watches every memory access by every thread.

::: example A data race that fails one run in fourteen
A telemetry counter is bumped by two radio threads:

```cpp
class FrameCounter {
public:
    void on_frame() { ++count_; }
    int count() const { return count_; }

private:
    int count_ = 0;
};

TEST(FrameCounter, CountsFramesFromTwoThreads) {
    FrameCounter c;
    auto radio = [&c] {
        for (int i = 0; i < 1000; ++i) c.on_frame();
    };
    std::thread a(radio);
    std::thread b(radio);
    a.join();
    b.join();
    EXPECT_EQ(c.count(), 2000);
}
```

`++count_` is really three steps: read, add one, write back. If both threads read the same old value, one increment is lost. In the ordinary build, run 1,000 times in a row on a four-core machine, the test failed **72** times and passed 928. That is a **flaky** test, the worst kind: it fails about one run in fourteen ($1000/72 \approx 13.9$), gets re-run, passes, and the team learns to ignore it.

Built with `-fsanitize=thread -g`, it failed 50 runs out of 50:

```text
WARNING: ThreadSanitizer: data race (pid=13343)
  Read of size 4 at 0x7fff8a3b5ef4 by thread T2:
    #0 FrameCounter::on_frame() frame_counter_test.cpp:7
  Previous write of size 4 at 0x7fff8a3b5ef4 by thread T1:
    #0 FrameCounter::on_frame() frame_counter_test.cpp:7
SUMMARY: ThreadSanitizer: data race frame_counter_test.cpp:7 in FrameCounter::on_frame()
[       OK ] FrameCounter.CountsFramesFromTwoThreads (111 ms)
[  PASSED  ] 1 test.
ThreadSanitizer: reported 1 warnings
```

Look closely: GoogleTest printed `OK` and `PASSED`, because this time the count did come out 2000. But TSan made the program [[exit with code 66|exit-code]], and CTest judges by the exit code, so `ctest --preset tsan` reported `83% tests passed, 1 tests failed out of 6`. TSan does not need the threads to collide; it sees that the two accesses had [[no ordering between them|happens-before]]. Changing `count_` to `std::atomic<int>` makes the test pass 100% of the time, with no report.

**Sanity check.** $5$ of $6$ tests passed, and $5/6 \approx 0.833$, which CTest rounds to the $83\%$ it printed.
:::

## The test matrix

You cannot fold every instrument into one build. GCC refuses to combine two of them:

```text
$ g++ -fsanitize=address,thread ...
cc1plus: error: '-fsanitize=thread' is incompatible with '-fsanitize=address'
```

Each sanitizer keeps its own bookkeeping about memory — ASan a [[shadow map|shadow-memory]] of which bytes are usable, TSan a record of which thread touched what — and the two layouts collide. Coverage wants `-O0` and clean counts, while sanitizers are usually run with optimization so the tests stay fast. So CI builds the *same* targets several ways and runs the same tests in each. That grid of builds is the **test matrix**:

| Preset | Flags added | Catches | Typical cost |
| --- | --- | --- | --- |
| `debug` | `-O0 -g` | wrong answers | baseline |
| `release` | `-O2` | answers that change with optimization | faster than baseline |
| `asan` | `-fsanitize=address,undefined` | use-after-free, overflows, leaks, signed overflow | about 2x slower |
| `tsan` | `-fsanitize=thread` | data races | about 5 to 15x slower |
| `coverage` | `--coverage -O0` | untested code (a report, not a bug) | slower, plus report time |

The `release` row is there because undefined behavior sometimes only turns into a wrong answer once the optimizer takes advantage of it. The slowdowns are the figures the sanitizer projects themselves publish; your code may differ.

The CMake options come from the CMake module's `gnc_build_options` target, with one more switch, `GNC_TSAN`, that adds `-fsanitize=thread` to the compile and link options in the same way. The presets then add environment settings for the test run:

```json
{ "name": "asan", "inherits": "base", "configurePreset": "asan",
  "environment": { "ASAN_OPTIONS": "detect_leaks=1:abort_on_error=1",
                   "UBSAN_OPTIONS": "print_stacktrace=1" } },
{ "name": "tsan", "inherits": "base", "configurePreset": "tsan",
  "environment": { "TSAN_OPTIONS": "halt_on_error=1" } }
```

These two entries go in the `testPresets` list; the hidden `base` test preset sets `"output": {"outputOnFailure": true}` so a failing test's report appears in the CI log. `detect_leaks=1` asks ASan to check for leaked memory at exit, and `halt_on_error=1` stops TSan at the first race.

Finally, the CI file. In GitHub Actions a **matrix** runs one job description once per value:

```yaml
name: tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-24.04
    strategy:
      fail-fast: false
      matrix:
        preset: [debug, release, asan, tsan, coverage]
    steps:
      - uses: actions/checkout@v4
      - name: Install tools
        run: sudo apt-get update && sudo apt-get install -y ninja-build libgtest-dev libgmock-dev lcov
      - name: Configure
        run: cmake --preset ${{ matrix.preset }}
      - name: Build
        run: cmake --build --preset ${{ matrix.preset }}
      - name: Test
        run: ctest --preset ${{ matrix.preset }}
      - name: Coverage report
        if: matrix.preset == 'coverage'
        run: |
          lcov --rc branch_coverage=1 --capture --directory build/coverage/src \
               --include "$PWD/src/*" --output-file build/coverage/gnc.info
          lcov --rc branch_coverage=1 --summary build/coverage/gnc.info
          genhtml --branch-coverage build/coverage/gnc.info --output-directory build/coverage/html
      - name: Keep the coverage report
        if: matrix.preset == 'coverage'
        uses: actions/upload-artifact@v4
        with:
          name: coverage-html
          path: build/coverage/html
```

Five jobs run side by side, one per preset, from one description. The `if:` lines make the report steps run only in the coverage job. The **[[fail-fast|fail-fast]]** setting matters: with `fail-fast: false` every job runs to the end. Without it, the first failing job cancels the others, and you lose the very comparison the matrix exists for. "It fails under `tsan` only" is a diagnosis; "it failed and everything else was cancelled" is not.

The presets and the commands in these steps were run for this lesson on a four-core Ubuntu 24.04 machine, preset by preset; all five passed with the fixed code.

::: warning
A sanitizer only watches code that was *compiled* with it. The GoogleTest library installed by `libgtest-dev` was not, and neither is any other prebuilt library you link. For ASan and UBSan that mostly means bugs *inside* those libraries go unseen. TSan is touchier: code it cannot see can make it report races that are not there, or miss ones that are. When that bites, build GoogleTest from source in the sanitizer jobs (with `FetchContent`, as the CMake module showed) so it gets the same flags as everything else.
:::

## Check yourself

::: check
gcov prints "Branches executed: 100.00% of 10" and "Taken at least once: 80.00% of 10" for the same file. Explain the difference, and say which number the team should track.
:::

::: answer
"Executed" means each branching condition was *evaluated* at least once — the program arrived at every `if`. "Taken at least once" means each *road* out of those conditions was actually followed. You can evaluate an `if` a thousand times and always go the same way; then both of its branches count as executed, but only one as taken. Here 8 of the 10 roads were taken, $8/10 = 80\%$. Track the "taken" figure (lcov's "branches" line shows the same thing): an untaken road is exactly the untested case, such as a fault path.
:::

::: check
A flight-mode handler switches over an `enum class Mode { Idle, Ascent, Coast, Descent }`, with one `case` for each of the four modes and a `default:` that commands safe mode. Coverage shows the `default:` never ran. Is it a gap or dead code? What would you need to know to decide, and what would you do in each case?
:::

::: answer
It depends on where the `Mode` value comes from. If every `Mode` in the program is created from the four named values, no input reaches `default:` and it looks dead. But if a `Mode` is ever made by casting a number — decoded from a telemetry uplink, read from memory after a reset, `static_cast<Mode>(raw_byte)` — then a corrupted byte such as 7 produces a `Mode` that matches no `case`, and `default:` is the only thing standing between that and undefined control behavior. Then it is a reachable fault path and a **gap**: write a test that casts an out-of-range value and checks that safe mode is commanded. If you can show no cast exists anywhere, record that reasoning; many teams still keep such a `default:` as a deliberate defensive check, excluded from coverage with a one-line written justification. Either way the decision and its reason get written down.
:::

::: check
You rebuild the coverage configuration after editing one source file and run the tests again. The output contains `overwriting an existing profile data with a different checksum`. What happened, and what numbers are now in your report?
:::

::: answer
The `.gcda` count file from the previous run belongs to the old compile of that file. After the edit, the new object file has a new map (`.gcno`) with a different checksum, so the runtime cannot add the new counts to the old file correctly and overwrites it, while other files' counters from the earlier run are still there and keep adding up. The report is a mix of two different programs' runs, and cannot be trusted. Zero the counters (`lcov --zerocounters --directory build/coverage`) or use a fresh build folder before every measured run.
:::

::: check
The `asan` job of the matrix fails with `heap-use-after-free`, while the `debug`, `release` and `coverage` jobs are green. A teammate says "three out of four pass, it's probably a sanitizer false alarm". Why is that reasoning backwards?
:::

::: answer
The three green jobs do not check memory at all, so they cannot disagree with ASan; they simply cannot see the problem. A use-after-free is undefined behavior: in those builds the freed memory happened to still hold the right bytes, so the answers came out right *today*. ASan reports an actual read of freed memory, with the line that read, the line that freed and the line that allocated. ASan false positives on code it fully instruments are rare. The failing job is the only one that looked. Fix the bug, for example by not keeping references into a container that can reallocate.
:::

::: check
Your team wants one CI job instead of five, built with `-fsanitize=address,thread,undefined --coverage`. Give two reasons this does not work.
:::

::: answer
First, it will not compile: GCC reports that `-fsanitize=thread` is incompatible with `-fsanitize=address`, because each keeps its own incompatible bookkeeping about memory. Second, coverage and sanitizers pull in opposite directions: coverage wants `-O0` so each counted line is a real source line, and clean counts not disturbed by extra instrumented code, while sanitizer runs are slow and are usually optimized to keep test time sane. Separate presets, run as a matrix with `fail-fast: false`, cost one build folder each and tell you *which* instrument found the problem.
:::

## Summary

| Idea | In one line |
| --- | --- |
| gcov | `gcov -b -c file.gcda`: annotated source; `#####` is a line that never ran; branch 0 is the fallthrough road |
| Executed vs taken | a condition evaluated vs each road actually followed; track "taken" |
| lcov | capture from the library's folder (`--directory build/coverage/src --include ...`) to avoid the lcov 2.0 "mismatched end line" error on `TEST` functions; `--summary`, then genhtml |
| Counters | add up across runs and belong to one compile; zero them before a measured run |
| llvm-cov | `-fprofile-instr-generate -fcoverage-mapping`, then `llvm-profdata merge`, then `llvm-cov report` or `show`; do not compare its percentages with gcov's |
| Uncovered branch | a missing test for a reachable case, or dead logic to remove; decide and record which |
| Gaming the number | deleting, excluding or lowering the threshold hides the finding |
| Sanitizers | turn latent undefined behavior on tested paths into a deterministic failure |
| ASan and UBSan | memory errors and undefined arithmetic; about 2x slower |
| TSan | data races, even when the threads did not collide this run; cannot combine with ASan |
| Test matrix | same targets, presets `debug`, `release`, `asan`, `tsan`, `coverage`, CI matrix with `fail-fast: false` |

The last lesson, *Testing numerical kernels*, turns to the code where "the right answer" is hardest to write down: integrators, attitude propagation and filters. It tests them through invariants, convergence order and golden data, and runs them through this same matrix.

::: context fallthrough The road straight ahead
In the compiled program, an `if` becomes a comparison followed by a jump. One road is the jump: the processor leaps to some other address. The other road is to do nothing special and carry on with the next instruction in memory — to "fall through". GCC lays out the body of the `if` straight after the test, so the fallthrough road is the one into the body.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="10" width="160" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">test: c &gt; 1.0 ?</text>
  <line x1="180" y1="40" x2="180" y2="72" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="180,78 175,68 185,68" fill="#1d6fd1"/>
  <text x="188" y="62" font-size="11" fill="#1d6fd1">branch 0: fall through</text>
  <rect x="100" y="80" width="160" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">body: c = 1.0</text>
  <rect x="100" y="130" width="160" height="30" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">return c</text>
  <line x1="180" y1="110" x2="180" y2="124" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,130 175,120 185,120" fill="#1f2a44"/>
  <path d="M100 25 H60 V145 H94" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="100,145 90,140 90,150" fill="#b4232c"/>
  <text x="12" y="90" font-size="11" fill="#b4232c">branch 1:</text>
  <text x="12" y="104" font-size="11" fill="#b4232c">jump</text>
</svg>
```

That is why gcov writes "(fallthrough)" next to branch 0. Which road is "0" is a detail of how the code was laid out, so always check the count next to it rather than assume.
:::

::: context runs-four Four runs from three tests
`gtest_discover_tests` works by running the test program once at build time with `--gtest_list_tests`, to learn the test names. Then CTest runs the program once per test, with a filter that selects that one test. So three tests make four runs: one listing run plus three real ones.

The listing run executes none of your code, so it adds nothing to the line counts. But it shows that the counters record every run of the program, whatever caused it, which is exactly why stale runs can pollute a report.
:::

::: context mismatch Why a macro confuses lcov
A `TEST(Suite, Name)` line expands into a whole class plus a function called `TestBody`, all "written" on that one source line, with the body you typed after it. The compiler records where each function starts and ends so tools can map counts back to lines. For functions made by a macro, the start line is the macro's line while the body runs on for several more.

lcov 2.0 added strict consistency checks on this information, and with GCC 13's records for these macro-made functions the check fails. Nothing is wrong with your tests. The problem only appears if you collect coverage of the test files themselves, which is one more reason to measure the library you ship rather than the whole build folder.
:::

::: context source-based Counting regions instead of jumps
gcov works on the compiled program: it counts how often each jump between blocks of machine code was followed, then maps those counts back to lines. Clang's source-based coverage works the other way round. It marks regions in the source first — this `if` body, that side of an `&&`, this `?:` arm — and places a counter for each.

Because the map starts from the source, it stays accurate at any optimization level and can show two conditions on one line separately. The price is Clang-only flags and the extra `llvm-profdata` step. Both methods found the same 2 untaken branches here, which is what you would hope from two honest instruments.
:::

::: context mcdc The standard avionics asks for
Avionics software in the US and Europe is usually certified against a standard called DO-178C. The most critical level, Level A, is software whose failure could be catastrophic, such as flight controls. At that level the standard asks for **MC/DC**: modified condition/decision coverage.

Branch coverage asks whether each `if` went both ways. MC/DC goes further: for a decision like `if (a && b)`, it asks for tests showing that *each* condition, on its own, can flip the outcome. Two tests can take both roads of `a && b` while never showing that `b` matters. Clang 18 measures MC/DC with `-fcoverage-mcdc`; GCC gained a similar option, `-fcondition-coverage`, in version 14.
:::

::: context nan A value that is not equal to itself
IEEE 754, the standard behind `float` and `double` on nearly every processor, reserves special bit patterns for "not a number". They are produced by operations with no sensible answer, such as $0/0$, `std::sqrt(-1.0)` or infinity minus infinity. A NaN then spreads: any arithmetic with a NaN gives NaN.

The strange rule is about comparisons. Every ordered comparison with a NaN is false, and even `x == x` is false when `x` is NaN. That is why a chain of `<` and `>` limits passes a NaN through untouched, and why `std::isnan` exists. In flight code a NaN usually means an upstream failure, such as a division by a zero-length vector, and must be caught before it reaches an actuator.
:::

::: context exit-code The number CTest actually reads
Every program ends by handing the operating system a small whole number, its **exit code**. Zero means success; anything else means failure. CTest decides pass or fail from that number, not from the text a test prints.

GoogleTest returns 1 when any test failed. The sanitizers have their own codes: ThreadSanitizer, by default, turns an otherwise clean exit into code 66 if it reported anything, and ASan, by default, exits with code 1 when it stops the program. That is why a TSan run can print `[  PASSED  ]` and still fail in CTest, which is what you want: the race is the finding, whatever the count said.
:::

::: context happens-before How TSan knows without seeing a crash
TSan does not wait for two threads to hit the same variable at the same instant. It keeps a record of which events are ordered: everything before `std::thread` starts comes before the thread's first step; a mutex unlock comes before the next lock of that mutex; `join` comes after everything the thread did. That ordering is called **happens-before**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="42" font-size="12" fill="#1f2a44">thread A</text>
  <text x="10" y="112" font-size="12" fill="#1f2a44">thread B</text>
  <line x1="70" y1="38" x2="350" y2="38" stroke="#1f2a44" stroke-width="2"/>
  <line x1="70" y1="108" x2="350" y2="108" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="130" cy="38" r="7" fill="#b4232c"/>
  <text x="130" y="22" font-size="11" text-anchor="middle" fill="#b4232c">write count_</text>
  <circle cx="270" cy="108" r="7" fill="#b4232c"/>
  <text x="270" y="134" font-size="11" text-anchor="middle" fill="#b4232c">read count_</text>
  <line x1="137" y1="44" x2="263" y2="102" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="200" y="66" font-size="11" text-anchor="middle" fill="#6c7a93">no lock, no atomic:</text>
  <text x="200" y="80" font-size="11" text-anchor="middle" fill="#6c7a93">no ordering</text>
</svg>
```

If two accesses to one variable, at least one a write, have no happens-before path between them, they are a data race — even if, this time, they were milliseconds apart. That is why TSan found the race 50 times out of 50 while the plain test failed only 72 times in 1,000.
:::

::: context shadow-memory A second map of memory
ASan keeps a **shadow**: a separate area of memory with one byte describing every 8 bytes of your program's memory. A shadow value of 0 means all 8 bytes are usable; other values mark "only the first few bytes are usable", "freed" or "guard zone next to an allocation". Before every load and store, the compiler-inserted check looks up the shadow byte.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="28" font-size="12" fill="#1f2a44">memory</text>
  <rect x="80" y="12" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="160" y="12" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="240" y="12" width="80" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="120" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">8 bytes</text>
  <text x="200" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">8 bytes</text>
  <text x="280" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">8 bytes</text>
  <line x1="120" y1="38" x2="120" y2="78" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="200" y1="38" x2="200" y2="78" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="280" y1="38" x2="280" y2="78" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="10" y="98" font-size="12" fill="#1f2a44">shadow</text>
  <rect x="105" y="80" width="30" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="185" y="80" width="30" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="265" y="80" width="30" height="26" fill="#ffffff" stroke="#b4232c"/>
  <text x="120" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="200" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="280" y="98" font-size="12" text-anchor="middle" fill="#b4232c">fd</text>
  <text x="330" y="124" font-size="11" text-anchor="end" fill="#b4232c">fd = freed: any read here is reported</text>
</svg>
```

Freed blocks are also held back from reuse for a while, so a dangling pointer keeps pointing at memory marked "freed" long enough to be caught. The shadow is one eighth the size of the memory it describes, and together with the guard zones it is why ASan uses so much more memory than a normal build.
:::

::: context fail-fast Why let the other jobs finish
By default, GitHub Actions cancels the rest of a matrix as soon as one job fails, to save machine time. For a build matrix that is the wrong trade. The *pattern* of results is the diagnosis: failing only under `release` points at undefined behavior the optimizer exploited; only under `tsan`, at a race; everywhere, at a plain wrong answer. Setting `fail-fast: false` keeps every job running so you see the whole pattern from one push.
:::
