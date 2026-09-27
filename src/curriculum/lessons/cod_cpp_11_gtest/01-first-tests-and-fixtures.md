---
id: l01-first-tests-and-fixtures
title: Your first tests, and fixtures that start fresh
minutes: 20
covers:
  - 'TEST and TEST_F; test suites and fixtures; SetUp and TearDown'
---

Before a pilot takes off, she walks around the airplane with a checklist. Tires inflated? Yes. Fuel caps closed? Yes. Pitot tube cover removed? Yes. Each line is one small question with a yes-or-no answer, and she asks every question every single time, even on the hundredth flight. Nobody trusts memory for this. The checklist is how a mistake that slipped in last night gets caught this morning.

Flight software needs the same habit. A guidance program has thousands of small functions: one averages altimeter samples, one wraps an angle, one converts a sensor reading into a rate. Each of them can break when somebody edits it, or edits something it depends on. A **[[unit test|unit-test]]** — a small program that calls one piece of your code with known inputs and checks the answer — is one line of that checklist. Hundreds of them run in a few seconds, every time anyone changes anything.

This module teaches **GoogleTest**, the C++ testing library most flight and robotics teams use, and its partner **GoogleMock**, which lets you test flight logic against a pretend sensor. In this first lesson you write your first tests with the `TEST` macro, group them into a **test suite**, and then meet the **test fixture** — a small class that gives every test a fresh, identical starting point. You already know how to build with CMake and register tests with `ctest` from the CMake module. Now you learn what goes inside a test.

## A first test

Our code under test is a tiny filter. A barometric altimeter on a drone reports altitude many times a second, and each reading jitters by a meter or so. A **moving average** — the average of the last few samples — smooths that jitter. This one keeps the last four samples, in meters:

```cpp
// ma.hpp
#pragma once
#include <array>
#include <cstddef>

// Average of the last N altitude samples, in metres.
class MovingAverage {
public:
    void push(double x) {
        sum_ -= buf_[next_];
        buf_[next_] = x;
        sum_ += x;
        next_ = (next_ + 1) % buf_.size();
        if (count_ < buf_.size()) ++count_;
    }
    std::size_t count() const { return count_; }
    double value() const { return count_ == 0 ? 0.0 : sum_ / count_; }
private:
    std::array<double, 4> buf_{};
    std::size_t next_ = 0;
    std::size_t count_ = 0;
    double sum_ = 0.0;
};
```

The array is a **ring buffer**: the newest sample overwrites the oldest one, and `next_` walks around the four slots like the hand of a clock. The running `sum_` saves adding up all four samples every time.

Here are two tests for it:

```cpp
// t1.cpp
#include <gtest/gtest.h>
#include "ma.hpp"

TEST(MovingAverageTest, StartsEmpty) {
    MovingAverage f;
    EXPECT_EQ(f.count(), 0u);
    EXPECT_EQ(f.value(), 0.0);
}

TEST(MovingAverageTest, AveragesWhatItHasSoFar) {
    MovingAverage f;
    f.push(100.0);
    f.push(104.0);
    EXPECT_EQ(f.count(), 2u);
    EXPECT_EQ(f.value(), 102.0);
}
```

Read it line by line.

- `#include <gtest/gtest.h>` brings in GoogleTest.
- `TEST(MovingAverageTest, StartsEmpty)` starts a test. `TEST` is a **[[macro|macro]]** — a piece of code the preprocessor rewrites before the compiler sees it. It takes two names. The first, `MovingAverageTest`, is the **test suite** — a named group of related tests. The second, `StartsEmpty`, is the test's own name. Together they make the full name `MovingAverageTest.StartsEmpty`, read "moving average test dot starts empty".
- The body between the braces is ordinary C++. It builds the thing under test, pokes it, and checks the result.
- `EXPECT_EQ(a, b)` is an **assertion** — a check that says "these two must be equal". Read it "expect equal". If they are not, the test is marked failed and GoogleTest prints both values. The `0u` is zero written as an unsigned number, to match the type `count()` returns and keep the compiler from warning about comparing signed with unsigned.

Notice there is no `main` function. The library `gtest_main` supplies **[[one for you|gtest-main]]**: it finds every test in the program and runs them all. Compile and run:

```text
$ g++ -std=c++20 -Wall -Wextra t1.cpp -o t1 -lgtest -lgtest_main -pthread
$ ./t1
Running main() from ./googletest/src/gtest_main.cc
[==========] Running 2 tests from 1 test suite.
[----------] Global test environment set-up.
[----------] 2 tests from MovingAverageTest
[ RUN      ] MovingAverageTest.StartsEmpty
[       OK ] MovingAverageTest.StartsEmpty (0 ms)
[ RUN      ] MovingAverageTest.AveragesWhatItHasSoFar
[       OK ] MovingAverageTest.AveragesWhatItHasSoFar (0 ms)
[----------] 2 tests from MovingAverageTest (0 ms total)

[----------] Global test environment tear-down
[==========] 2 tests from 1 test suite ran. (0 ms total)
[  PASSED  ] 2 tests.
```

Every test gets a `[ RUN ]` line when it starts and an `[ OK ]` or `[ FAILED ]` line when it ends. The program's **exit code** is 0 when everything passed and 1 when anything failed, which is what `ctest` and a CI job look at.

::: key
`TEST(SuiteName, TestName) { ... }` defines one test. The suite name groups related tests; the full name is `SuiteName.TestName`. Link `gtest_main` and you do not write `main` yourself. The test program exits with 0 if every test passed and non-zero otherwise.
:::

::: warning
Do not put an underscore in suite or test names. GoogleTest glues the two names together with underscores to build a hidden class name, so `Moving_Average` plus `Test_1` can collide with `Moving` plus `Average_Test_1`. Use `CamelCase` for both names and the problem never comes up.
:::

### Tests that stand alone

Look at the two tests again. Each one builds its own `MovingAverage f;`. Neither one knows the other exists. That is on purpose, and it is the most important rule in this lesson: **every test must be independent**. It must pass or fail the same way whether it runs first, last, alone, or in parallel with the others. A test that only passes when another test ran before it is a trap waiting to go off. The example below springs that trap for real, so you can see how it looks.

::: example A shared filter that breaks a good test
Suppose someone "saves typing" by making one global filter for the whole suite:

```cpp
// t4.cpp
#include <gtest/gtest.h>
#include "ma.hpp"

MovingAverage g_filter;   // one filter shared by every test: a trap

TEST(SharedFilterTest, TwoSamples) {
    g_filter.push(100.0);
    g_filter.push(104.0);
    EXPECT_EQ(g_filter.value(), 102.0);
}

TEST(SharedFilterTest, OneSample) {
    g_filter.push(50.0);
    EXPECT_EQ(g_filter.count(), 1u);
    EXPECT_EQ(g_filter.value(), 50.0);
}
```

Run the whole program. `TwoSamples` runs first and leaves two samples behind. Then `OneSample` pushes a third:

```text
[ RUN      ] SharedFilterTest.OneSample
t4.cpp:14: Failure
Expected equality of these values:
  g_filter.count()
    Which is: 3
  1u
    Which is: 1

t4.cpp:15: Failure
Expected equality of these values:
  g_filter.value()
    Which is: 84.666666666666671
  50.0
    Which is: 50

[  FAILED  ] SharedFilterTest.OneSample (0 ms)
```

Check the number by hand: the filter holds $100$, $104$ and $50$, and $(100 + 104 + 50) / 3 = 254 / 3 \approx 84.67$. That matches the printout, so the filter works. The test is what is broken.

Now run only that one test, using the **filter** flag that picks tests by name:

```text
$ ./t4 --gtest_filter=SharedFilterTest.OneSample
[ RUN      ] SharedFilterTest.OneSample
[       OK ] SharedFilterTest.OneSample (0 ms)
[  PASSED  ] 1 test.
```

It passes. The same test, the same code, a different answer, depending only on what ran before it. That is **[[order dependence|order-dependence]]**, and it is why shared mutable state between tests is banned.
:::

## Fixtures: the same starting point, every time

Independence has a cost. Suppose ten tests all need a filter that already holds four samples. Writing the same four `push` lines ten times is boring, and worse, if the setup ever changes you must fix it in ten places and will miss one.

A **test fixture** solves both problems. Think of a **[[fixture|fixture-word]]** in a machine shop: a clamp that holds every part in exactly the same spot, so each part gets drilled the same way. In GoogleTest a fixture is a class that derives from `::testing::Test`. Its members are the shared objects. Its constructor (or a `SetUp` function) prepares them. And here is the part that matters most: **GoogleTest builds a brand-new fixture object for each test and destroys it afterward.** Tests share the *code* that sets things up, never the *objects* themselves.

You then write tests with `TEST_F` instead of `TEST` (read "test F", the F for fixture). The first name is now the fixture class's name, and inside the body you can use the fixture's members as if they were your own.

::: example A fixture with a full filter
```cpp
// t2.cpp
#include <gtest/gtest.h>
#include "ma.hpp"

class FullFilterTest : public ::testing::Test {
protected:
    FullFilterTest() {
        for (double h : {100.0, 102.0, 104.0, 106.0}) f.push(h);
    }
    MovingAverage f;
};

TEST_F(FullFilterTest, AverageOfFourSamples) {
    EXPECT_EQ(f.count(), 4u);
    EXPECT_EQ(f.value(), 103.0);
}

TEST_F(FullFilterTest, FifthSampleDropsTheOldest) {
    f.push(120.0);                  // 100 falls out of the window
    EXPECT_EQ(f.count(), 4u);
    EXPECT_EQ(f.value(), 108.0);    // (102 + 104 + 106 + 120) / 4
}

TEST_F(FullFilterTest, CountNeverPassesTheWindow) {
    for (int i = 0; i < 10; ++i) f.push(0.0);
    EXPECT_EQ(f.count(), 4u);
    EXPECT_EQ(f.value(), 0.0);
}
```

Work out the expected numbers before trusting them.

**First test.** The fixture pushed $100, 102, 104, 106$. Their sum is $412$, and $412 / 4 = 103$.

**Second test.** The fifth sample, $120$, overwrites the oldest slot, which held $100$. The window is now $102, 104, 106, 120$. The sum is $432$, and $432 / 4 = 108$. The average jumped by $5\,\mathrm{m}$, which makes sense: one sample $20\,\mathrm{m}$ higher than the one it replaced lifts a four-sample average by $20 / 4 = 5$.

**Third test.** Ten zeros push every real sample out, so the average is $0$ and the count stays at the window size, $4$.

The run:

```text
[ RUN      ] FullFilterTest.AverageOfFourSamples
[       OK ] FullFilterTest.AverageOfFourSamples (0 ms)
[ RUN      ] FullFilterTest.FifthSampleDropsTheOldest
[       OK ] FullFilterTest.FifthSampleDropsTheOldest (0 ms)
[ RUN      ] FullFilterTest.CountNeverPassesTheWindow
[       OK ] FullFilterTest.CountNeverPassesTheWindow (0 ms)
[  PASSED  ] 3 tests.
```

The third test filled the filter with zeros, and it did not matter to anyone. Each test got its own `f`, built fresh with the same four samples. Run them in any order and the answers stay the same.
:::

A few rules come with `TEST_F`.

- The first name in `TEST_F` must be the fixture class's name exactly. That name is also the suite name, so the tests show up as `FullFilterTest.AverageOfFourSamples` and so on.
- Put the members under `protected:` (or `public:`), not `private:`. Behind the scenes, each `TEST_F` becomes a class that derives from your fixture, and a derived class cannot see private members.
- You cannot mix `TEST` and `TEST_F` under the same suite name. GoogleTest refuses at run time with the message "mixing TEST_F and TEST in the same test suite is illegal". One suite, one fixture.

::: key
A test fixture gives shared setup and teardown plus shared members to the tests in a suite, constructed fresh per test. It removes duplication while keeping tests independent, which a static or global would not.
:::

::: warning
"Fresh per test" covers the fixture's own members and nothing else. A `static` member of the fixture, a global variable, a file on disk or a hardware register lives outside the fixture object, so a new fixture does not reset it. If a test changes something outside its fixture, the fixture must put it back. That is the job of the next section.
:::

## SetUp and TearDown

The fixture has two more places to put code. `SetUp()` runs after the constructor and before the test body. `TearDown()` runs after the test body and before the destructor. Both are **virtual** functions of `::testing::Test` — functions a derived class can replace with its own version — so you write them with `override`.

The simplest way to see the order is to make every step print a line:

```cpp
// t3.cpp
#include <gtest/gtest.h>
#include <iostream>

class LifecycleTest : public ::testing::Test {
protected:
    LifecycleTest()  { std::cout << "  constructor\n"; }
    ~LifecycleTest() override { std::cout << "  destructor\n"; }
    void SetUp() override    { std::cout << "  SetUp\n"; }
    void TearDown() override { std::cout << "  TearDown\n"; }
    int shots = 0;
};

TEST_F(LifecycleTest, First) {
    ++shots;
    std::cout << "  body of First, shots = " << shots << "\n";
}

TEST_F(LifecycleTest, Second) {
    ++shots;
    std::cout << "  body of Second, shots = " << shots << "\n";
}
```

```text
[ RUN      ] LifecycleTest.First
  constructor
  SetUp
  body of First, shots = 1
  TearDown
  destructor
[       OK ] LifecycleTest.First (0 ms)
[ RUN      ] LifecycleTest.Second
  constructor
  SetUp
  body of Second, shots = 1
  TearDown
  destructor
[       OK ] LifecycleTest.Second (0 ms)
```

Two things to see. The whole **[[five-step cycle|lifecycle]]** repeats for each test. And `shots` is $1$ in both bodies, never $2$: the second test got a new fixture, so it never saw the first test's `++shots`. That printout is the proof of "constructed fresh per test".

### Constructor or SetUp?

Both run before every test, so which should you use? A good default is the constructor and destructor, the way you would write any C++ class. They let you mark members `const`, and they follow the RAII habit from the memory module. Reach for `SetUp` and `TearDown` in two situations:

- **The setup needs a fatal check.** Lesson 02 teaches `ASSERT_*` assertions, which stop a test on the spot. They work inside `SetUp`, but a constructor will not even compile with one inside (the compiler says "returning a value from a constructor"). If `SetUp` fails that way, GoogleTest skips the test body and still runs `TearDown`.
- **The cleanup might fail or needs checks.** A destructor must not throw an exception, and checks inside it are awkward. `TearDown` is an ordinary function and can do anything. GoogleTest calls `TearDown` even when the test body failed, so cleanup still happens.

::: example A fixture that cleans up the disk
A telemetry logger appends one line per altitude sample to a file. The test needs a clean folder, and the folder must vanish afterward, or the next test will find old lines in it.

```cpp
// t6.cpp
#include <gtest/gtest.h>
#include <filesystem>
#include <fstream>
#include <string>

namespace fs = std::filesystem;

// Appends one line per sample to a telemetry log file.
void log_altitude(const fs::path& file, double metres) {
    std::ofstream out(file, std::ios::app);
    out << metres << '\n';
}

int count_lines(const fs::path& file) {
    std::ifstream in(file);
    int n = 0;
    for (std::string line; std::getline(in, line);) ++n;
    return n;
}

class TelemetryLogTest : public ::testing::Test {
protected:
    void SetUp() override {
        dir = fs::temp_directory_path() / "orbit_log_test";
        fs::create_directories(dir);
        ASSERT_TRUE(fs::exists(dir)) << "could not make " << dir;
        file = dir / "alt.log";
    }
    void TearDown() override {
        fs::remove_all(dir);        // leave nothing behind for the next test
    }
    fs::path dir, file;
};

TEST_F(TelemetryLogTest, OneSampleIsOneLine) {
    log_altitude(file, 1520.5);
    EXPECT_EQ(count_lines(file), 1);
}

TEST_F(TelemetryLogTest, ThreeSamplesAreThreeLines) {
    for (double h : {1520.5, 1523.0, 1525.4}) log_altitude(file, h);
    EXPECT_EQ(count_lines(file), 3);
}
```

With `TearDown` in place both tests pass, and afterward the folder is gone. Now delete the `remove_all` line and run again. The first test leaves one line in `alt.log`. The second test builds a fresh fixture, but the *file* is not part of the fixture. Its three lines are appended to the leftover one:

```text
[ RUN      ] TelemetryLogTest.ThreeSamplesAreThreeLines
t6b.cpp:42: Failure
Expected equality of these values:
  count_lines(file)
    Which is: 4
  3

[  FAILED  ] TelemetryLogTest.ThreeSamplesAreThreeLines (0 ms)
```

Sanity check: $1$ leftover line plus $3$ new lines is $4$, exactly what it printed. The fixture object was fresh; the disk was not. `TearDown` is what makes the outside world fresh too.
:::

## From the compiler command to ctest

So far we compiled by hand. In a real project the tests live in `tests/` and CMake builds them. GoogleTest ships a CMake package, so the whole wiring is a few lines:

```cmake
cmake_minimum_required(VERSION 3.25)
project(filters LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)

enable_testing()
find_package(GTest REQUIRED)

add_executable(test_moving_average test_moving_average.cpp)
target_link_libraries(test_moving_average PRIVATE GTest::gtest_main)

include(GoogleTest)
gtest_discover_tests(test_moving_average)
```

`GTest::gtest_main` brings in both the library and the ready-made `main`. The last line asks CMake to **[[register every test by name|discover-bridge]]** with CTest. Build it and run `ctest`:

```text
$ ctest --test-dir build
    Start 1: FullFilterTest.AverageOfFourSamples
1/3 Test #1: FullFilterTest.AverageOfFourSamples ........   Passed    0.00 sec
    Start 2: FullFilterTest.FifthSampleDropsTheOldest
2/3 Test #2: FullFilterTest.FifthSampleDropsTheOldest ...   Passed    0.00 sec
    Start 3: FullFilterTest.CountNeverPassesTheWindow
3/3 Test #3: FullFilterTest.CountNeverPassesTheWindow ...   Passed    0.00 sec

100% tests passed, 0 tests failed out of 3
```

Each `TEST_F` became its own line in CTest. Lesson 09 explains how, and how to filter and label them.

Two command-line flags are worth knowing from day one. `--gtest_list_tests` prints every test name without running anything. `--gtest_filter` runs only the tests whose full name matches a pattern, where `*` stands for "anything": `./t2 --gtest_filter='*Oldest'` runs only `FullFilterTest.FifthSampleDropsTheOldest`. When one test fails in a big suite, running it alone like this is the first thing to try.

::: warning
If a test passes alone but fails in the full run, or the other way around, do not shrug and re-run. Something is leaking between tests: a global, a `static`, a file, an environment variable. Run with `--gtest_shuffle`, which runs the tests **[[in a random order|gtest-shuffle]]**, to shake the leak out, then fix the fixture so it resets what the test touched.
:::

## Check yourself

::: check
A test is declared `TEST(AttitudeFilterTest, RejectsNaN)`. What is the test suite, what is the test name, and what name does it print in the `[ RUN ]` line?
:::

::: answer
The suite is `AttitudeFilterTest` and the test is `RejectsNaN`. GoogleTest joins them with a dot, so the output says `[ RUN      ] AttitudeFilterTest.RejectsNaN`. That full name is also what you type after `--gtest_filter=` to run it alone.
:::

::: check
A fixture has a member `std::vector<double> samples;` and a test pushes three values into it. The next test in the same suite checks `samples.size()`. What does it see, and why?
:::

::: answer
It sees $0$. GoogleTest constructs a new fixture object before each test and destroys it after, so the second test's `samples` is a brand-new, empty vector. The three values pushed by the first test died with the first fixture object.
:::

::: check
A teammate replaces a fixture member with `static MovingAverage f;` "so it is only built once and the suite runs faster". What goes wrong, and what would you say?
:::

::: answer
A `static` member belongs to the class, not to each fixture object, so all tests now share one filter. Samples pushed by one test are still there in the next, and results depend on the order the tests run in, exactly like the global filter in the first example. Building a four-slot filter costs next to nothing, so there is no speed to gain. Keep it a normal member so it is constructed fresh per test.
:::

::: check
Put these in the order GoogleTest runs them for one `TEST_F`: `TearDown`, the fixture's constructor, the test body, `SetUp`, the fixture's destructor. Which of them still runs if the test body records a failure?
:::

::: answer
Constructor, `SetUp`, test body, `TearDown`, destructor. A failure in the body does not skip the rest: `TearDown` and the destructor still run, so cleanup always happens. (If `SetUp` itself hits a fatal failure, the body is skipped, but `TearDown` and the destructor still run.)
:::

::: check
Using the four-sample filter, a fixture pushes $10, 20, 30, 40$. A test then pushes $50$ and $60$. What average should the test expect? Show the window.
:::

::: answer
Start with $10, 20, 30, 40$. Pushing $50$ overwrites the oldest, $10$, giving $20, 30, 40, 50$. Pushing $60$ overwrites $20$, giving $30, 40, 50, 60$. The sum is $180$, and $180 / 4 = 45$. So the test should say `EXPECT_EQ(f.value(), 45.0);`. Sanity check: the window is four evenly spaced numbers, so its average is halfway between $40$ and $50$, which is $45$.
:::

## Summary

| Idea | What it is |
| --- | --- |
| `TEST(Suite, Name)` | one test; full name `Suite.Name`; body is ordinary C++ |
| Test suite | a named group of related tests; the first name in `TEST` or `TEST_F` |
| `EXPECT_EQ(a, b)` | check two values are equal; prints both on failure |
| `gtest_main` | supplies `main`, runs every test, exit code 0 only if all pass |
| Test fixture | class deriving from `::testing::Test`; shared setup and members, constructed fresh per test |
| `TEST_F(Fixture, Name)` | a test that runs inside a new copy of the fixture |
| `SetUp` / `TearDown` | run before and after each test body; `TearDown` runs even if the body failed |
| Independence | a test passes or fails the same way alone, first, last or shuffled |
| `--gtest_filter`, `--gtest_list_tests` | run tests matching a pattern; list test names |

Every check in this lesson was `EXPECT_EQ`, which keeps going after a failure. The next lesson, *ASSERT versus EXPECT*, shows when a test must stop at the first failed check instead, and how to write failure messages that tell you what went wrong without opening a debugger.

::: context unit-test What counts as a "unit"
A unit is the smallest piece of code that makes sense to check on its own: usually one function or one class. A unit test runs in milliseconds, needs no hardware and no network, and checks one behavior. Bigger tests exist too. An **integration test** checks that several units work together, and a **hardware-in-the-loop** test runs the real flight computer against a simulator. Teams need all three, but unit tests are the ones you can afford to run on every change, hundreds of times a day.
:::

::: context macro What a macro does behind the scenes
The C preprocessor runs before the compiler and does text substitution. `TEST(MovingAverageTest, StartsEmpty)` is replaced by a whole class definition: a class named `MovingAverageTest_StartsEmpty_Test` that derives from `::testing::Test`, plus a static member whose initialization registers the test with GoogleTest before `main` starts. The braces you write become the body of that class's `TestBody()` function. That is why tests find themselves: nobody has to list them, because each one signs itself up as the program loads.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="140" height="44" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="80" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">TEST(Suite, Name)</text>
  <text x="80" y="56" font-size="11" fill="#1f2a44" text-anchor="middle">{ your code }</text>
  <line x1="150" y1="42" x2="196" y2="42" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="204,42 194,37 194,47" fill="#1f2a44"/>
  <text x="176" y="32" font-size="11" fill="#6c7a93" text-anchor="middle">expands</text>
  <rect x="206" y="12" width="146" height="116" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="279" y="32" font-size="11" fill="#1f2a44" text-anchor="middle">class Suite_Name_Test</text>
  <text x="279" y="48" font-size="11" fill="#1f2a44" text-anchor="middle">: public testing::Test</text>
  <rect x="216" y="58" width="126" height="26" rx="4" fill="#ffffff"/>
  <text x="279" y="75" font-size="11" fill="#1f2a44" text-anchor="middle">TestBody(): your code</text>
  <rect x="216" y="92" width="126" height="26" rx="4" fill="#f2b880"/>
  <text x="279" y="109" font-size="11" fill="#1f2a44" text-anchor="middle">registers itself</text>
  <text x="80" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">what you write</text>
  <text x="279" y="145" font-size="11" fill="#6c7a93" text-anchor="middle">what the compiler sees</text>
</svg>
```
:::

::: context gtest-main Where main went
A C++ program needs exactly one `main`. The `gtest_main` library holds a short one that sets up GoogleTest, reads flags such as `--gtest_filter` from the command line, and calls `RUN_ALL_TESTS()`, which returns 0 if every test passed. It prints "Running main() from" and its own file name first, which is why that line opens every run. When you need your own start-up code, link only `gtest` and write `main` yourself, calling `::testing::InitGoogleTest(&argc, argv);` and then `return RUN_ALL_TESTS();`.
:::

::: context order-dependence Tests that only pass as a team
An order-dependent test is worse than no test, because it lies in both directions. It can fail when the code is fine, as in the example, and train people to ignore red results. It can also pass when the code is broken, because an earlier test happened to leave the state the later one needed. The leak usually hides until something changes the order: a new test is added, a filter runs a subset, or `ctest` runs tests in parallel as separate processes. Independence is what makes each result mean something.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">shared filter</text>
  <rect x="10" y="26" width="100" height="30" rx="5" fill="#8fb8f0"/>
  <text x="60" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">TwoSamples</text>
  <rect x="130" y="26" width="100" height="30" rx="5" fill="#b4232c"/>
  <text x="180" y="45" font-size="11" fill="#ffffff" text-anchor="middle">OneSample</text>
  <path d="M110 41 H128" stroke="#1f2a44" stroke-width="2"/>
  <text x="240" y="45" font-size="11" fill="#b4232c">count = 3: fail</text>
  <text x="10" y="92" font-size="12" fill="#1f2a44">fixture, fresh per test</text>
  <rect x="10" y="100" width="100" height="30" rx="5" fill="#8fb8f0"/>
  <text x="60" y="119" font-size="11" fill="#1f2a44" text-anchor="middle">TwoSamples</text>
  <rect x="130" y="100" width="100" height="30" rx="5" fill="#1d6fd1"/>
  <text x="180" y="119" font-size="11" fill="#ffffff" text-anchor="middle">OneSample</text>
  <line x1="120" y1="98" x2="120" y2="134" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="240" y="119" font-size="11" fill="#1d6fd1">count = 1: pass</text>
  <text x="120" y="152" font-size="11" fill="#6c7a93" text-anchor="middle">new object: nothing crosses</text>
</svg>
```
:::

::: context fixture-word Borrowed from the workshop
In manufacturing, a fixture is a holder bolted to a machine that grips a part in one exact position. With a good fixture, the thousandth part is drilled in the same place as the first, whoever loads it. Electronics test benches use the word too: a "test fixture" there is the rig of pins and clamps that holds a circuit board while it is checked. Software borrowed the word because the idea is the same: a known, repeatable starting position for every item that comes through.
:::

::: context lifecycle One test, five steps
For every `TEST_F`, GoogleTest builds a new fixture object, runs `SetUp`, runs your body, runs `TearDown`, and destroys the object. Then it starts over for the next test. Nothing made in one cycle survives into the next, unless it lives outside the fixture.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="4" y="30" width="64" height="34" rx="5" fill="#8fb8f0"/><text x="36" y="51">construct</text>
    <rect x="76" y="30" width="64" height="34" rx="5" fill="#8fb8f0"/><text x="108" y="51">SetUp</text>
    <rect x="148" y="30" width="64" height="34" rx="5" fill="#f2b880"/><text x="180" y="51">body</text>
    <rect x="220" y="30" width="64" height="34" rx="5" fill="#8fb8f0"/><text x="252" y="51">TearDown</text>
    <rect x="292" y="30" width="64" height="34" rx="5" fill="#8fb8f0"/><text x="324" y="51">destroy</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="68" y1="47" x2="76" y2="47"/><line x1="140" y1="47" x2="148" y2="47"/>
    <line x1="212" y1="47" x2="220" y2="47"/><line x1="284" y1="47" x2="292" y2="47"/>
  </g>
  <path d="M324 66 C324 104, 36 104, 36 68" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <polygon points="36,66 31,76 41,76" fill="#1d6fd1"/>
  <text x="180" y="114" font-size="11" fill="#1d6fd1" text-anchor="middle">next test: a brand-new object</text>
  <text x="180" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">once per TEST_F</text>
</svg>
```
:::

::: context discover-bridge One program, many CTest entries
Without help, CTest sees a test program as one opaque test: it runs the binary and looks only at the exit code. `gtest_discover_tests` runs the freshly built program with `--gtest_list_tests`, reads the names it prints, and registers each one as its own CTest test. Then a single failure is reported by name, and CTest can run tests in parallel and pick them by pattern. Lesson 09 of this module covers it in full, along with labels and the older `gtest_add_tests`.
:::

::: context gtest-shuffle Shaking out hidden coupling
`--gtest_shuffle` runs the tests in a random order and prints the random seed it used. If a failure shows up, pass the same number back with `--gtest_random_seed=` to replay exactly that order while you hunt the leak. Adding `--gtest_repeat=50` runs the whole shuffled suite fifty times, which catches leaks that need a rare ordering to show. Some teams run a shuffled pass in CI for exactly this reason.
:::
