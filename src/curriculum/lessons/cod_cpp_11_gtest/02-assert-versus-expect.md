---
id: l02-assert-versus-expect
title: ASSERT versus EXPECT, and failure messages that talk
minutes: 22
covers:
  - 'ASSERT_* versus EXPECT_* and when a fatal assertion is correct'
---

Picture a mechanic doing a safety inspection on a car. She walks around with a clipboard. The left headlight is out: she writes it down and keeps going. A wiper blade is torn: she writes that down too. At the end you get one list with every problem on it, and you can fix them all in a single trip to the parts store.

Now picture a different moment. She tries to lift the car on the hoist, and the hoist will not lift. She does not carry on and try to inspect the brakes from underneath a car that is still on the floor. She stops, because every check after this one depends on the car being in the air. Pressing on would give nonsense at best, and a crushed mechanic at worst.

GoogleTest gives you both kinds of check. An **`EXPECT_*`** assertion is the clipboard: it writes the failure down and lets the test keep going. An **`ASSERT_*`** assertion is the hoist: if it fails, the test function stops right there. This lesson shows exactly what each one does, when a stop is the right call, and how to add a message to any check so a failure tells you what went wrong without a debugger. On a flight project with thousands of tests, a clear failure line is the difference between a five-minute fix and an afternoon of guessing.

## Two families, same comparisons

Every check in GoogleTest comes in two flavors with the same ending. `EXPECT_EQ` and `ASSERT_EQ` both check that two values are equal. `EXPECT_TRUE` and `ASSERT_TRUE` both check a condition is true. Here is the menu you will use most, with how to read each one aloud:

| Check | Passes when | Read it |
| --- | --- | --- |
| `EXPECT_TRUE(c)`, `EXPECT_FALSE(c)` | `c` is true, or false | "expect true" |
| `EXPECT_EQ(a, b)`, `EXPECT_NE(a, b)` | `a == b`, or `a != b` | "expect equal", "expect not equal" |
| `EXPECT_LT(a, b)`, `EXPECT_LE(a, b)` | `a < b`, or `a <= b` | "less than", "less or equal" |
| `EXPECT_GT(a, b)`, `EXPECT_GE(a, b)` | `a > b`, or `a >= b` | "greater than", "greater or equal" |
| `EXPECT_STREQ(a, b)` | two C strings have the same characters | "string equal" |

Swap `EXPECT` for `ASSERT` in any row and you get the fatal version. The comparison is the same; only what happens on failure changes.

Prefer the most specific check. `EXPECT_EQ(rate, 400)` prints both values when it fails. `EXPECT_TRUE(rate == 400)` only prints that the condition was false, and you have to go and find out what `rate` really was.

::: warning
`EXPECT_EQ` on two `const char*` compares the *pointers*, not the text. Two copies of `"imu"` stored in different places are unequal pointers. Use `EXPECT_STREQ` for C strings, or compare `std::string` objects, where `==` compares the characters.
:::

## EXPECT: write it down and keep going

An `EXPECT_*` failure is a **nonfatal failure** — the test is now marked failed, but the next line still runs. That is what you want most of the time, because you see every broken thing in one run.

::: example Four checks, two failures, one run
Someone edited an IMU's default settings in a hurry. The test compares each field with the datasheet:

```cpp
// a3.cpp
#include <gtest/gtest.h>
#include <string>

struct ImuConfig {
    std::string name;
    int rate_hz;
    int range_dps;      // largest rate it can measure, degrees per second
    bool self_test_on_boot;
};

// Bug report: someone edited the defaults in a hurry.
ImuConfig default_imu() { return {"imu", 200, 2000, false}; }

TEST(ImuDefaultsTest, MatchTheDatasheet) {
    const ImuConfig c = default_imu();
    EXPECT_EQ(c.name, "imu");
    EXPECT_EQ(c.rate_hz, 400);
    EXPECT_EQ(c.range_dps, 2000);
    EXPECT_TRUE(c.self_test_on_boot);
}
```

```text
[ RUN      ] ImuDefaultsTest.MatchTheDatasheet
a3.cpp:17: Failure
Expected equality of these values:
  c.rate_hz
    Which is: 200
  400

a3.cpp:19: Failure
Value of: c.self_test_on_boot
  Actual: false
Expected: true

[  FAILED  ] ImuDefaultsTest.MatchTheDatasheet (0 ms)
```

Count them: four checks ran, two failed, and both are listed with file and line. The rate is off by a factor of $400 / 200 = 2$ and the boot self-test is switched off. You fix both in one edit.

Had every line been `ASSERT_EQ`, the run would have stopped at line 17. You would fix the rate, rebuild, run again, and only then discover the self-test flag. For independent checks like these, stopping early only makes you play whack-a-mole.
:::

::: key
EXPECT records the failure and continues. Use it by default, for checks that do not depend on each other, so one run reports every problem.
:::

## ASSERT: stop, because the rest would be nonsense

An `ASSERT_*` failure is a **fatal failure**. The test is marked failed, and the current function returns on the spot. Nothing below that line runs.

Why would you ever want less information? Because some checks are **guards**: the lines after them are only safe, or only meaningful, if the guard passed. The classic case is a pointer.

::: example A null pointer takes down the whole program
A lookup function returns a pointer to a sensor's settings, or `nullptr` — the special "points at nothing" value — when no sensor has that name:

```cpp
// sensors.hpp
#pragma once
#include <string>
#include <vector>

struct SensorConfig {
    std::string name;
    double rate_hz;      // how often it reports
    double noise;        // one-sigma noise, in the sensor's units
};

// Returns a pointer to the entry with this name, or nullptr if none.
inline const SensorConfig* find_sensor(const std::vector<SensorConfig>& table,
                                       const std::string& name) {
    for (const auto& s : table)
        if (s.name == name) return &s;
    return nullptr;
}

// The flight table. Someone renamed "baro" to "baro1" last week.
inline std::vector<SensorConfig> flight_table() {
    return {{"imu", 400.0, 0.002}, {"baro1", 50.0, 0.8}, {"gps", 10.0, 2.5}};
}
```

The first version of the test guards the pointer with `EXPECT_NE`:

```cpp
// a1.cpp
#include <gtest/gtest.h>
#include "sensors.hpp"

TEST(SensorTableTest, BaroIsConfigured) {
    const auto table = flight_table();
    const SensorConfig* baro = find_sensor(table, "baro");
    EXPECT_NE(baro, nullptr);
    EXPECT_EQ(baro->rate_hz, 50.0);   // reads through the pointer
}

TEST(SensorTableTest, ImuIsFastest) {
    const auto table = flight_table();
    EXPECT_EQ(table.front().name, "imu");
}
```

The table has no `"baro"` any more, so `baro` is null. The `EXPECT_NE` records that and carries on. The next line reads `baro->rate_hz` — through a null pointer:

```text
[ RUN      ] SensorTableTest.BaroIsConfigured
a1.cpp:7: Failure
Expected: (baro) != (nullptr), actual: NULL vs (nullptr)

bash: line 1:  8132 Segmentation fault      ./a1
$ echo $?
139
```

The operating system killed the program with a **[[segmentation fault|segfault]]**. Look at what is missing. `ImuIsFastest` never ran. There is no summary, no list of failed tests. In CI you get one crash and no idea how many other tests would have passed or failed.

Change one word, and add a message:

```cpp
    ASSERT_NE(baro, nullptr) << "no sensor named baro in the flight table";
    EXPECT_EQ(baro->rate_hz, 50.0);   // reads through the pointer
```

```text
[ RUN      ] SensorTableTest.BaroIsConfigured
a2.cpp:7: Failure
Expected: (baro) != (nullptr), actual: NULL vs (nullptr)
no sensor named baro in the flight table

[  FAILED  ] SensorTableTest.BaroIsConfigured (0 ms)
[ RUN      ] SensorTableTest.ImuIsFastest
[       OK ] SensorTableTest.ImuIsFastest (0 ms)
[  PASSED  ] 1 test.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] SensorTableTest.BaroIsConfigured
```

The guard failed, the test function returned before touching the pointer, and the rest of the suite ran. The exit code is now a clean 1 instead of 139, and the message names the real problem: the sensor was renamed.
:::

Dereferencing a null pointer is **[[undefined behavior|undefined-behavior]]**, and a crash is the *lucky* outcome. The same goes for every access that a check is meant to protect: reading an element of an array or `std::vector` at an index you have not confirmed is in range, calling `.front()` on a container that might be empty, or following an iterator that might be the end. In each case, the check that makes the next line safe must be an `ASSERT`.

The second reason to stop is **[[cascading failures|cascade]]**. Suppose a test decodes a 32-byte telemetry packet and then checks twelve fields. If decoding failed, all twelve field checks fail too. You get thirteen red lines, and twelve of them say nothing new. Put `ASSERT_TRUE` on the decode, and the one line that matters is the only line you see.

::: key
ASSERT aborts the current test function on failure; EXPECT records the failure and continues. Use ASSERT when continuing would crash or produce meaningless cascading failures, for example after checking a pointer or a container size.
:::

A good test often has this shape: one or two `ASSERT` guards at the top that make the rest safe, then a row of `EXPECT` checks on the actual behavior.

## How ASSERT stops: a hidden return

`ASSERT_*` does not stop the program, throw an exception, or jump out of the whole test. It **[[expands to a hidden return statement|return-trick]]**, `return;` — "leave the current function now". That one fact explains two rules that surprise everyone the first time.

**Rule 1: `ASSERT_*` only compiles inside a function that returns `void`.** A `return;` with no value is illegal in a function that promises to return a `double`. Try it:

```cpp
// a5.cpp
#include <gtest/gtest.h>
#include "sensors.hpp"

double baro_rate() {
    const auto table = flight_table();
    const SensorConfig* s = find_sensor(table, "baro");
    ASSERT_NE(s, nullptr);
    return s->rate_hz;
}
```

```text
a5.cpp: In function 'double baro_rate()':
a5.cpp:7:5: error: void value not ignored as it ought to be
    7 |     ASSERT_NE(s, nullptr);
      |     ^~~~~~~~~
```

The message is cryptic, but now you know what it means: an `ASSERT` sits in a function that returns something. A constructor fails the same way, which is why lesson 01 moved fatal checks into `SetUp`. The fix is to make the helper return `void` and hand its result back through a reference parameter.

**Rule 2: in a helper, `ASSERT_*` leaves the helper, not the test.** The `return;` leaves whichever function it is written in. If that is a helper called by the test, the test keeps running after the helper comes back.

::: example The guard that guarded nothing
Here the null check lives in a `void` helper, so it compiles. Then two tests call it:

```cpp
// a4.cpp
#include <gtest/gtest.h>
#include <iostream>
#include "sensors.hpp"

// A helper that checks a sensor exists and copies it out.
void load_sensor(const std::string& name, SensorConfig& out) {
    const auto table = flight_table();
    const SensorConfig* s = find_sensor(table, name);
    ASSERT_NE(s, nullptr) << "no sensor named " << name;
    out = *s;
}

TEST(HelperTest, WithoutGuard) {
    SensorConfig baro{"none", 0.0, 0.0};
    load_sensor("baro", baro);            // fails inside, returns early
    std::cout << "  still running: rate_hz = " << baro.rate_hz << "\n";
    EXPECT_GT(baro.rate_hz, 0.0);
}

TEST(HelperTest, WithGuard) {
    SensorConfig baro{"none", 0.0, 0.0};
    ASSERT_NO_FATAL_FAILURE(load_sensor("baro", baro));
    std::cout << "  never printed\n";
    EXPECT_GT(baro.rate_hz, 0.0);
}
```

```text
[ RUN      ] HelperTest.WithoutGuard
a4.cpp:9: Failure
Expected: (s) != (nullptr), actual: NULL vs (nullptr)
no sensor named baro

  still running: rate_hz = 0
a4.cpp:17: Failure
Expected: (baro.rate_hz) > (0.0), actual: 0 vs 0

[  FAILED  ] HelperTest.WithoutGuard (0 ms)
[ RUN      ] HelperTest.WithGuard
a4.cpp:9: Failure
Expected: (s) != (nullptr), actual: NULL vs (nullptr)
no sensor named baro

a4.cpp:22: Failure
Expected: load_sensor("baro", baro) doesn't generate new fatal failures in the current thread.
  Actual: it does.

[  FAILED  ] HelperTest.WithGuard (0 ms)
```

Walk through the first test. The helper's `ASSERT_NE` fails and the helper returns without copying. Control goes back to the test, which prints `still running` and checks a `rate_hz` of $0$ that nobody ever loaded. That second failure is noise. If the test had used a pointer the helper was supposed to fill, it would have crashed.

The second test wraps the call in `ASSERT_NO_FATAL_FAILURE(...)`, which reads "assert no fatal failure". It runs the helper, and if the helper produced a fatal failure, it makes a fatal failure in the test too, so the test returns as well. `never printed` is, in fact, never printed.
:::

::: warning
An `ASSERT` inside a helper protects only the helper. When a helper contains fatal checks, call it through `ASSERT_NO_FATAL_FAILURE(helper(...))`, or check `if (HasFatalFailure()) return;` right after the call. Otherwise the test walks on past a failed guard as if nothing happened.
:::

## Messages that tell you what went wrong

Every assertion, `EXPECT` or `ASSERT`, accepts extra text with `<<`, the same operator you use with `std::cout`. The text is printed under the failure, and only when it fails. Anything you can print can go in: numbers, strings, names.

This matters most when one line of test code runs many times, as in a loop. A bare failure says "5 vs 10" but not *which* of the forty table rows was the 5.

::: example Naming the row that failed
Every sensor in a table must report at least $10\,\mathrm{Hz}$ (ten times a second) and have a noise figure above zero:

```cpp
// a6.cpp
#include <gtest/gtest.h>
#include <vector>
#include "sensors.hpp"

// Every sensor must report at least 10 times a second and have noise > 0.
TEST(SensorTableTest, EverySensorIsUsable) {
    const std::vector<SensorConfig> table = {
        {"imu", 400.0, 0.002}, {"baro1", 50.0, 0.8},
        {"mag", 5.0, 0.3},     {"gps", 10.0, 0.0}};
    for (std::size_t i = 0; i < table.size(); ++i) {
        const SensorConfig& s = table[i];
        EXPECT_GE(s.rate_hz, 10.0) << "row " << i << " (" << s.name << ")";
        EXPECT_GT(s.noise, 0.0)    << "row " << i << " (" << s.name << ")";
    }
}
```

```text
[ RUN      ] SensorTableTest.EverySensorIsUsable
a6.cpp:12: Failure
Expected: (s.rate_hz) >= (10.0), actual: 5 vs 10
row 2 (mag)

a6.cpp:13: Failure
Expected: (s.noise) > (0.0), actual: 0 vs 0
row 3 (gps)

[  FAILED  ] SensorTableTest.EverySensorIsUsable (0 ms)
```

Check it by hand. Row $0$ (imu, $400\,\mathrm{Hz}$) and row $1$ (baro1, $50\,\mathrm{Hz}$) pass both checks. Row $2$ (mag) reports at $5\,\mathrm{Hz}$, half the minimum. Row $3$ (gps) sits exactly at $10\,\mathrm{Hz}$, which passes `>=`, but its noise is $0$, which fails `>`. Two failures, and the messages name both rows. Without the messages, both failures would point at lines 12 and 13 and nothing else.

These are `EXPECT`s on purpose: the rows do not depend on each other, so you want every bad row in one run.
:::

A good message answers "which case?" and, when it helps, "what was I checking for?" — `"row 3 (gps)"`, `"after 200 steps at h = 0.01 s"`, `"quaternion from star tracker frame 17"`. It does not repeat the values; GoogleTest already prints those. When the same context applies to several checks, even inside helper functions, the `SCOPED_TRACE` macro **[[labels every failure in a block|scoped-trace]]**.

::: warning
Do not put anything with a side effect in a failure message, such as `<< next_sample()`. GoogleTest only evaluates the message when the check fails, so the call happens on a failing run and silently does not happen on a passing one. The test then behaves differently depending on whether it passes, which is the last thing you want.
:::

## Choosing, line by line

Ask one question of each check: **if this check fails, is the next line still safe and still meaningful?**

- Yes: use `EXPECT`. Most checks in a test are like this.
- No, the next line would crash or read garbage: use `ASSERT`. Pointers, indexes, container sizes, optional values, file opens and decode steps are the usual suspects.
- No, the next lines would all fail as an echo of this one: use `ASSERT`, to keep the report short and honest.

A test written this way reads like a launch **[[checklist with hold points|launch-hold]]**: a few items that stop the count, and many that are logged and fixed later.

## Check yourself

::: check
What is the difference, in what happens next, between a nonfatal and a fatal failure? Which assertion family produces each?
:::

::: answer
A nonfatal failure, from `EXPECT_*`, marks the test failed and lets the next line of the test run. A fatal failure, from `ASSERT_*`, marks the test failed and makes the current function return immediately, so no later line in that function runs. In both cases GoogleTest then goes on to the next test.
:::

::: check
A test opens a calibration file with `std::ifstream in(path);`, checks `in.is_open()`, and then reads twelve numbers and checks each one. Which assertion should the open check use, and which should the twelve number checks use? Explain.
:::

::: answer
The open check should be `ASSERT_TRUE(in.is_open()) << path;`. If the file did not open, every read fails and all twelve number checks would fail as an echo of that one problem — a cascade that hides the real cause. The twelve number checks should be `EXPECT_*`, because each number is independent: if two are wrong, you want to see both in one run.
:::

::: check
This helper does not compile. Why, and how would you change it?

```cpp
int parse_count(const std::string& text) {
    ASSERT_FALSE(text.empty());
    return std::stoi(text);
}
```
:::

::: answer
`ASSERT_*` works by expanding to a bare `return;`, which is only legal in a function returning `void`. `parse_count` returns `int`, so the compiler rejects it. Make the helper `void parse_count(const std::string& text, int& out)`, put the `ASSERT_FALSE` first and `out = std::stoi(text);` after it. Then call it from the test as `ASSERT_NO_FATAL_FAILURE(parse_count(text, n));` so a failure inside also stops the test.
:::

::: check
A test program ends with "Segmentation fault" and exit code 139 after printing only three `[ RUN ]` lines, though the file has twenty tests. What most likely happened, and what change to the tests would make the run finish?
:::

::: answer
One test read through a bad pointer, an out-of-range index or an end iterator after a check that did not stop it — most likely an `EXPECT_*` guard that failed and let the next line run. The crash killed the whole process, so the other seventeen tests never ran and no summary was printed. Change that guard to `ASSERT_*`, so the failing test returns before the unsafe access and the rest of the suite runs and reports normally.
:::

::: check
Write the failure message you would attach to `EXPECT_NEAR(alt, expected, 0.5)` inside a loop over `for (double t : {0.0, 10.0, 20.0})`, so that a failure says which time it was. What would you not bother to include?
:::

::: answer
`EXPECT_NEAR(alt, expected, 0.5) << "at t = " << t << " s";` The message adds the one thing GoogleTest cannot know: which pass through the loop failed. There is no need to include `alt` or `expected`, because GoogleTest already prints both values and the tolerance when the check fails.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| `EXPECT_*` | nonfatal: records the failure, the test keeps running |
| `ASSERT_*` | fatal: records the failure and returns from the current function |
| When to ASSERT | when continuing would crash or produce meaningless cascading failures (pointer, size, index, open, decode) |
| When to EXPECT | independent checks, so one run shows every problem |
| Specific checks | `EXPECT_EQ`, `NE`, `LT`, `LE`, `GT`, `GE`, `STREQ` print both values; `EXPECT_TRUE(a == b)` does not |
| Hidden `return;` | `ASSERT_*` compiles only in `void` functions, and leaves only the function it is in |
| Helpers | wrap calls in `ASSERT_NO_FATAL_FAILURE(...)` or check `HasFatalFailure()` |
| `<< message` | extra text shown only on failure; name the case, do not repeat the values |

Every example here compared integers, strings and pointers, where equal means exactly equal. The next lesson, *Floating-point assertions*, shows why `EXPECT_EQ` on two `double` results almost always fails, and how to pick a tolerance from the numerics rather than by guessing.

::: context segfault Why the program was killed
Each program gets its own map of memory it is allowed to use. Address zero, where a null pointer points, is deliberately left off every map. When the program touches it, the processor raises a fault and the operating system ends the program with the signal SIGSEGV, number 11. A shell reports a program killed by signal $n$ as exit code $128 + n$, so $128 + 11 = 139$. A test runner that sees 139 knows the program crashed rather than failed politely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="80" height="36" rx="5" fill="#8fb8f0"/>
  <text x="50" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">exit 0</text>
  <text x="50" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">all passed</text>
  <rect x="140" y="30" width="80" height="36" rx="5" fill="#f2b880"/>
  <text x="180" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">exit 1</text>
  <text x="180" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">tests failed</text>
  <rect x="270" y="30" width="80" height="36" rx="5" fill="#b4232c"/>
  <text x="310" y="53" font-size="12" fill="#ffffff" text-anchor="middle">exit 139</text>
  <text x="310" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">128 + 11: crashed</text>
  <text x="180" y="18" font-size="12" fill="#6c7a93" text-anchor="middle">what CI sees from a test program</text>
</svg>
```
:::

::: context undefined-behavior A crash is the lucky case
The C++ standard calls some operations **undefined behavior**: reading through a null pointer, indexing past the end of an array, using an object after it was destroyed. The standard puts no rule at all on what happens next. Often the program crashes. Sometimes it reads whatever bytes happen to be there and carries on with a wrong number, and the test might even pass. The optimizer is allowed to assume undefined behavior never happens, so the results can be stranger still. An `ASSERT` guard makes sure the test never goes there. Lesson 10 adds sanitizers, which catch many of these at the moment they happen.
:::

::: context cascade One root, many echoes
When a guard check fails but the test keeps going, every later check that depended on it fails too. The report fills up with red, and the true cause is one line among many. Compiler errors behave the same way: a single missing brace can produce fifty errors, and experienced programmers fix the first one and rebuild. A fatal assertion on the guard gives you the root without the echoes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" rx="5" fill="#b4232c"/>
  <text x="180" y="30" font-size="12" fill="#ffffff" text-anchor="middle">decode failed</text>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="180" y1="40" x2="40" y2="92"/><line x1="180" y1="40" x2="110" y2="92"/>
    <line x1="180" y1="40" x2="180" y2="92"/><line x1="180" y1="40" x2="250" y2="92"/>
    <line x1="180" y1="40" x2="320" y2="92"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="12" y="92" width="56" height="24" rx="4" fill="#f2b880"/><text x="40" y="108">altitude</text>
    <rect x="82" y="92" width="56" height="24" rx="4" fill="#f2b880"/><text x="110" y="108">speed</text>
    <rect x="152" y="92" width="56" height="24" rx="4" fill="#f2b880"/><text x="180" y="108">pitch</text>
    <rect x="222" y="92" width="56" height="24" rx="4" fill="#f2b880"/><text x="250" y="108">roll</text>
    <rect x="292" y="92" width="56" height="24" rx="4" fill="#f2b880"/><text x="320" y="108">mode</text>
  </g>
  <text x="180" y="134" font-size="11" fill="#6c7a93" text-anchor="middle">every field check fails as an echo of one problem</text>
</svg>
```
:::

::: context return-trick What the macro turns into
Stripped of detail, `ASSERT_NE(p, nullptr) << msg;` becomes roughly: if the comparison succeeds, do nothing; otherwise record a fatal failure with the message, then `return;`. `EXPECT_NE` is the same thing without the `return`. So an `ASSERT` can only stop the function it is written in, and it can only be written where a bare `return;` is legal. GoogleTest also works in programs built with C++ exceptions switched off, as much embedded and flight code is, and a plain return works there where a throw would not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">EXPECT fails</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">ASSERT fails</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="30" y="26" width="120" height="24" rx="4" fill="#8fb8f0"/><text x="40" y="42">check (fails)</text>
    <rect x="30" y="60" width="120" height="24" rx="4" fill="#8fb8f0"/><text x="40" y="76">next line runs</text>
    <rect x="30" y="94" width="120" height="24" rx="4" fill="#8fb8f0"/><text x="40" y="110">last line runs</text>
    <rect x="210" y="26" width="120" height="24" rx="4" fill="#8fb8f0"/><text x="220" y="42">check (fails)</text>
    <rect x="210" y="60" width="120" height="24" rx="4" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/><text x="220" y="76" fill="#6c7a93">skipped</text>
    <rect x="210" y="94" width="120" height="24" rx="4" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/><text x="220" y="110" fill="#6c7a93">skipped</text>
  </g>
  <path d="M330 38 C356 38, 356 136, 300 136" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="292,136 302,131 302,141" fill="#b4232c"/>
  <text x="240" y="140" font-size="11" fill="#b4232c" text-anchor="middle">return;</text>
</svg>
```
:::

::: context scoped-trace Context that follows you into helpers
`SCOPED_TRACE(text)` puts a label on every failure that happens until the end of the enclosing braces, including failures inside functions called from there. In a loop over sensors, `SCOPED_TRACE("sensor " + name);` makes a failure deep in a shared checking helper print a line such as `a7.cpp:6: sensor mag` under "Google Test trace". It is the tool to reach for when the check is in a helper and the helper cannot know which case it is being called for.
:::

::: context launch-hold Hold points in a real countdown
A launch countdown is a long checklist, and some items are marked as hold points: if the check fails, the count stops until the problem is understood. Many other items are logged and dealt with without stopping. Launch teams also write down, in advance, the conditions that must be true to proceed, so no one decides under pressure. Good tests borrow that discipline: you decide while writing the test which checks are guards that stop it, not in the moment a failure appears.
:::
