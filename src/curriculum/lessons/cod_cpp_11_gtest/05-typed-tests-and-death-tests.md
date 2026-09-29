---
id: l05-typed-tests-and-death-tests
title: Typed tests and death tests
minutes: 23
covers:
  - Typed and type-parameterized tests for template code
  - Death tests for contract violations
---

Two everyday pictures for two tools.

The first is a phone charger that claims to work with every phone. You would not believe that claim after plugging in one phone. You would try each model on the shelf, and run the same checks on each: does it charge, does it get hot, does it stop when full. The checks stay the same. What changes is the *kind* of thing you plug in.

The second is the test button on a smoke alarm. A smoke alarm that stays quiet all year might be fine, or its battery might be dead. The only way to know it will scream when there is a fire is to make it scream on purpose. You press the button, and you are happy when it is loud.

C++ flight code needs both checks. **Template code** — a class or function written once and used with many types, like a filter that works on `float` and on `double` — needs the same tests run for every type it will be used with. That is what **typed tests** do. And flight code is full of **[[contracts|design-by-contract]]**: promises a function makes, and demands it places on its caller, such as "the index you give me is inside the table". When a caller breaks a contract, good flight code stops on purpose rather than carrying on with garbage. A **death test** is the smoke-alarm button: a test that passes only when the program really does stop.

## One recipe, many types

A template is a recipe, not a finished function. When your code uses `RingBuffer<float, 4>` and `RingBuffer<std::int16_t, 4>`, the compiler **[[writes out a separate copy|template-instantiation]]** of the class for each type. The copies share source code, but they are different machine code, and they can behave differently. Arithmetic on a 16-bit integer overflows where arithmetic on a `double` does not. Dividing two integers throws away the fraction. A comparison that is exact for integers is risky for floating point.

So a test that uses only `double` has tested one copy out of three. Writing the same test three times by hand, one per type, is the loop problem from lesson 04 in a new costume: it is tedious, and the copies drift apart. GoogleTest has two tools for running one test body over a list of types.

### Typed tests: you know the types now

A **typed test** runs every test in a suite once per type in a list you give up front. It takes three steps.

1. Write the fixture as a **class template**: `template <typename T> class RingBufferTest : public ::testing::Test { ... };`.
2. List the types with `::testing::Types<...>` and attach the list with `TYPED_TEST_SUITE(Fixture, TypeList)`.
3. Write each test with `TYPED_TEST(Fixture, Name)` instead of `TEST_F`. Inside, the name **`TypeParam`** is the type being tested this time around, and you reach the fixture's members through `this->`, a [[small but required prefix|this-arrow]].

Here it is on the ring buffer from lesson 01, now a template, used to hold the last few samples of a sensor. On a real flight computer those samples often arrive as **[[raw 16-bit counts|adc-counts]]** from a converter chip, before anything turns them into `float` engineering units. So the type list is a 16-bit integer, `float` and `double`.

```cpp
#include <gtest/gtest.h>
#include <array>
#include <cstddef>
#include <cstdint>

// A fixed-size history of the last N samples. Pushing into a full
// buffer drops the oldest sample.
template <typename T, std::size_t N>
class RingBuffer {
public:
    void push(T value) {
        data_[head_] = value;
        head_ = (head_ + 1) % N;
        if (size_ < N) ++size_;
    }
    std::size_t size() const { return size_; }
    // i = 0 is the oldest sample still held.
    T at(std::size_t i) const { return data_[(head_ + N - size_ + i) % N]; }
    // Average of the samples held. Has a bug for one of the types.
    T mean() const {
        T sum{};
        for (std::size_t i = 0; i < size_; ++i) sum += at(i);
        return sum / static_cast<T>(size_);
    }

private:
    std::array<T, N> data_{};
    std::size_t head_ = 0;
    std::size_t size_ = 0;
};

template <typename T>
class RingBufferTest : public ::testing::Test {
protected:
    RingBuffer<T, 4> buf_;
};

using SampleTypes = ::testing::Types<std::int16_t, float, double>;
TYPED_TEST_SUITE(RingBufferTest, SampleTypes);

TYPED_TEST(RingBufferTest, StartsEmpty) {
    EXPECT_EQ(this->buf_.size(), 0u);
}

TYPED_TEST(RingBufferTest, FifthPushDropsTheOldest) {
    for (int i = 1; i <= 5; ++i) {
        this->buf_.push(static_cast<TypeParam>(10 * i));
    }
    ASSERT_EQ(this->buf_.size(), 4u);
    EXPECT_EQ(this->buf_.at(0), static_cast<TypeParam>(20));
    EXPECT_EQ(this->buf_.at(3), static_cast<TypeParam>(50));
}

TYPED_TEST(RingBufferTest, MeanOfFourLargeSamples) {
    for (int i = 0; i < 4; ++i) {
        this->buf_.push(static_cast<TypeParam>(20000));
    }
    EXPECT_EQ(this->buf_.mean(), static_cast<TypeParam>(20000));
}
```

::: example A bug that lives in one type only
Compile and run it with `g++ -std=c++20 -Wall -Wextra typed.cpp -lgtest -lgtest_main -pthread`. The report, trimmed to the lines that matter:

```text
[==========] Running 9 tests from 3 test suites.
[----------] 3 tests from RingBufferTest/0, where TypeParam = short
typed.cpp:58: Failure
Expected equality of these values:
  this->buf_.mean()
    Which is: 3616
  static_cast<TypeParam>(20000)
    Which is: 20000
[  FAILED  ] RingBufferTest/0.MeanOfFourLargeSamples, where TypeParam = short (0 ms)
[----------] 3 tests from RingBufferTest/1, where TypeParam = float
[----------] 3 tests from RingBufferTest/2, where TypeParam = double
[  PASSED  ] 8 tests.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] RingBufferTest/0.MeanOfFourLargeSamples, where TypeParam = short
```

Read it step by step.

**Three tests times three types is nine.** GoogleTest made one suite per type and named them `RingBufferTest/0`, `/1` and `/2`, telling you which type each one is. (`std::int16_t` prints as `short`, the built-in type it is an alias for on this machine.)

**Only the 16-bit version failed.** The average of four samples of $20000$ should be $20000$, and for `float` and `double` it is. For `short` it came out as $3616$.

**Where does 3616 come from?** The running sum is kept in a variable of type `T`. Four samples of $20000$ add up to $80000$. But a 16-bit integer holds only whole numbers from $-32768$ to $32767$ — there are $2^{16} = 65536$ possible values. When C++20 squeezes $80000$ into a `short`, it keeps the remainder after removing whole multiples of $65536$, a **[[wraparound|sixteen-bit-wrap]]**:

$$
80000 - 65536 = 14464, \qquad 14464 \div 4 = 3616.
$$

The test's number matches the arithmetic exactly, so we understand the failure completely.

**The fix** is to add up in a wider type than the samples, for example a 64-bit integer when `T` is an integer and `T` itself otherwise. A test that used only `double` would never have found this. On a vehicle, the raw-count version is the one closest to the hardware.
:::

::: warning Why `this->` is required
Inside a `TYPED_TEST`, writing plain `buf_` fails to compile. The test body lives in a class template that inherits from `RingBufferTest<TypeParam>`, and C++ does not look inside a base class that depends on a template parameter when it sees a plain name. Writing `this->buf_` tells the compiler "this is a member; look it up later, when the type is known". For a type defined inside the fixture, write `typename TestFixture::SomeType`, where `TestFixture` is GoogleTest's name for the fixture of the current type.
:::

### Type-parameterized tests: the types come later

Sometimes the person who writes the tests does not know the types. Picture a team that owns a *contract* for integrators: any integrator in the flight software must leave a constant alone, must get a straight line exactly, and so on. The team writes those tests once. Every other team that writes a new integrator should be able to run the whole contract against it without editing the tests.

That is a **type-parameterized test**. You write the tests with no type list at all, register them, and let someone else supply the types later — even in a different file. The steps are:

1. `TYPED_TEST_SUITE_P(Fixture);` declares that this suite is type-parameterized (the `_P` is for "parameterized").
2. Each test is written with `TYPED_TEST_P(Fixture, Name)`.
3. `REGISTER_TYPED_TEST_SUITE_P(Fixture, Name1, Name2, ...);` lists every test in the suite.
4. Later, and possibly elsewhere, `INSTANTIATE_TYPED_TEST_SUITE_P(Prefix, Fixture, TypeList);` runs the whole suite for the given types.

::: example An integrator contract any scheme can sign
The contract lives in a header, so any test file can include it.

```cpp
// integrator_contract.hpp -- tests every integrator must pass.
#pragma once
#include <gtest/gtest.h>

template <typename Scheme>
class IntegratorContract : public ::testing::Test {};

TYPED_TEST_SUITE_P(IntegratorContract);

// y' = 0: nothing should change, however many steps we take.
TYPED_TEST_P(IntegratorContract, ConstantStaysConstant) {
    auto f = [](double /*t*/, double /*y*/) { return 0.0; };
    double y = 3.5;
    for (int i = 0; i < 100; ++i) y = TypeParam::step(f, 0.01 * i, y, 0.01);
    EXPECT_EQ(y, 3.5);
}

// y' = 2: every scheme of order one or higher gets a straight line exactly.
TYPED_TEST_P(IntegratorContract, StraightLineIsExact) {
    auto f = [](double /*t*/, double /*y*/) { return 2.0; };
    double y = 0.0;
    for (int i = 0; i < 8; ++i) y = TypeParam::step(f, 0.125 * i, y, 0.125);
    EXPECT_DOUBLE_EQ(y, 2.0);  // 8 steps of 0.125 s at 2 per second
}

REGISTER_TYPED_TEST_SUITE_P(IntegratorContract,
                            ConstantStaysConstant, StraightLineIsExact);
```

The contract never names a real integrator. It only says: whatever type `TypeParam` is, it has a static function `step(f, t, y, h)` that takes one step of size `h`. Our three schemes, in their own header:

```cpp
// schemes.hpp -- three fixed-step integrators, one step each.
#pragma once

struct Euler {
    template <typename F>
    static double step(F f, double t, double y, double h) {
        return y + h * f(t, y);
    }
};

struct Midpoint {
    template <typename F>
    static double step(F f, double t, double y, double h) {
        const double k1 = f(t, y);
        return y + h * f(t + 0.5 * h, y + 0.5 * h * k1);
    }
};

struct Rk4 {
    template <typename F>
    static double step(F f, double t, double y, double h) {
        const double k1 = f(t, y);
        const double k2 = f(t + 0.5 * h, y + 0.5 * h * k1);
        const double k3 = f(t + 0.5 * h, y + 0.5 * h * k2);
        const double k4 = f(t + h, y + h * k3);
        return y + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
    }
};
```

And the only file that knows both, the one that picks the types:

```cpp
// test_schemes.cpp -- run the contract against our three schemes.
#include "integrator_contract.hpp"
#include "schemes.hpp"

using Schemes = ::testing::Types<Euler, Midpoint, Rk4>;
INSTANTIATE_TYPED_TEST_SUITE_P(Ours, IntegratorContract, Schemes);
```

Listing the tests with `./test_schemes --gtest_list_tests`:

```text
Ours/IntegratorContract/0.  # TypeParam = Euler
  ConstantStaysConstant
  StraightLineIsExact
Ours/IntegratorContract/1.  # TypeParam = Midpoint
  ConstantStaysConstant
  StraightLineIsExact
Ours/IntegratorContract/2.  # TypeParam = Rk4
  ConstantStaysConstant
  StraightLineIsExact
```

All six pass. Check the second test by hand for Euler: each step adds $h \cdot f = 0.125 \times 2 = 0.25$, and eight steps add $8 \times 0.25 = 2.0$. Since $0.125$ and $0.25$ are exact in binary, not even a rounding creeps in, and the check could have been `EXPECT_EQ`. A fourth scheme written next year joins by adding one word to the `Types<...>` list.
:::

If you write a `TYPED_TEST_P` and forget to list it in `REGISTER_TYPED_TEST_SUITE_P`, the program refuses to start. It prints `integrator_contract.hpp:26: You forgot to list test StraightLineIsExact.` and aborts. That is deliberate: a contract test that silently never ran would be worse than no test.

::: key
Typed tests: `TYPED_TEST_SUITE(Fixture, ::testing::Types<A, B, C>)` then `TYPED_TEST(Fixture, Name)`, with `TypeParam` naming the current type and `this->` reaching fixture members; use them when you know the types while writing the tests. Type-parameterized tests: `TYPED_TEST_SUITE_P`, `TYPED_TEST_P`, `REGISTER_TYPED_TEST_SUITE_P`, then `INSTANTIATE_TYPED_TEST_SUITE_P(Prefix, Fixture, Types)` elsewhere; use them to ship a contract that types written later must pass.
:::

## Death tests: pressing the alarm's test button

A **precondition** is the caller's side of a contract: something that must be true before a function is called. "The index is less than the table size" is a precondition. When a precondition is broken, the function has two choices. It can carry on and return whatever garbage the memory holds, or it can stop the program, loudly, at the exact point where things went wrong. In flight-adjacent code the second is usually right. A stopped process is noticed by a supervisor or a **[[watchdog|safe-mode]]**, which switches to a backup or a safe mode. Garbage in a gain table is not noticed until it has steered the vehicle.

That leaves a testing puzzle. The check you most want to test ends the program. If the test runner *is* that program, it dies too, and no report is written.

GoogleTest's answer is to run the dangerous statement in a **[[child process|fork]]** — a copy of the test program that the operating system makes on request. The child runs the statement. The parent watches from outside, and then checks how the child ended and what it wrote to its error output, called **standard error**, or `stderr`. The parent is never at risk, so it can report the result like any other test.

There are three macros.

- `EXPECT_DEATH(statement, regex)` passes if `statement` makes the child die — exit with a nonzero code or be killed by a **[[signal|signals]]** — *and* the child's `stderr` contains a match for `regex`, a **regular expression** (a search pattern for text). An empty pattern `""` matches anything.
- `ASSERT_DEATH(statement, regex)` is the same check, but fatal: if it fails, the current test function stops, as with every other `ASSERT_`.
- `EXPECT_EXIT(statement, predicate, regex)` lets you say exactly *how* the child must end. `::testing::ExitedWithCode(42)` demands a normal exit with code $42$. `::testing::KilledBySignal(SIGABRT)` demands death by the abort signal. There is an `ASSERT_EXIT` twin too.

::: example A contract check and a safe-mode exit
```cpp
#include <gtest/gtest.h>
#include <csignal>
#include <cstddef>
#include <cstdio>
#include <cstdlib>

// A contract check that stays on in every build type.
#define GNC_EXPECTS(cond)                                             \
    do {                                                              \
        if (!(cond)) {                                                \
            std::fprintf(stderr, "contract violated: %s (%s:%d)\n",   \
                         #cond, __FILE__, __LINE__);                  \
            std::abort();                                             \
        }                                                             \
    } while (0)

// Read gain i from a table of n gains. Asking past the end is a bug
// in the caller, so the function refuses to go on.
double gain_at(const double* gains, std::size_t n, std::size_t i) {
    GNC_EXPECTS(i < n);
    return gains[i];
}

// Called when the controller finds itself in a state it cannot handle.
// Exit code 42 tells the supervisor process to switch to the backup.
[[noreturn]] void enter_safe_mode(const char* why) {
    std::fprintf(stderr, "SAFE MODE: %s\n", why);
    std::exit(42);
}

const double kGains[3] = {2.0, 0.5, 0.1};

TEST(GainTableDeathTest, IndexPastEndAborts) {
    EXPECT_DEATH(gain_at(kGains, 3, 3), "contract violated: i < n");
}

TEST(GainTableTest, IndexInsideTableReturnsTheGain) {
    EXPECT_EQ(gain_at(kGains, 3, 2), 0.1);
}

TEST(GainTableDeathTest, AbortIsReallySigabrt) {
    EXPECT_EXIT(gain_at(kGains, 3, 7), ::testing::KilledBySignal(SIGABRT),
                "contract violated");
}

TEST(SafeModeDeathTest, ExitsWithCode42AndSaysWhy) {
    EXPECT_EXIT(enter_safe_mode("attitude estimate diverged"),
                ::testing::ExitedWithCode(42), "SAFE MODE: attitude");
}
```

The macro `GNC_EXPECTS` prints the failed condition as text (the `#cond` turns the code `i < n` into the string `"i < n"`), the file and the line, then calls `std::abort()`. The run:

```text
[ RUN      ] GainTableDeathTest.IndexPastEndAborts
[       OK ] GainTableDeathTest.IndexPastEndAborts (0 ms)
[ RUN      ] GainTableDeathTest.AbortIsReallySigabrt
[       OK ] GainTableDeathTest.AbortIsReallySigabrt (0 ms)
[ RUN      ] SafeModeDeathTest.ExitsWithCode42AndSaysWhy
[       OK ] SafeModeDeathTest.ExitsWithCode42AndSaysWhy (0 ms)
[ RUN      ] GainTableTest.IndexInsideTableReturnsTheGain
[       OK ] GainTableTest.IndexInsideTableReturnsTheGain (0 ms)
[  PASSED  ] 4 tests.
```

Three things to see.

**The table has three gains, at indexes $0$, $1$ and $2$.** Index $3$ is one past the end — the most common off-by-one — and it died with the expected message. Index $2$, the last valid one, returned $0.1$ and did not die. Always test the edge on *both* sides: one death test just past it, one ordinary test just inside it.

**Each check says something different.** The first test says "it died, and said why". The second says "it died *by abort*, not by some unrelated crash". The third says "the safe-mode path exits with the exact code the supervisor listens for".

**The order changed.** In the source file, `GainTableTest` sits between two death tests. In the run, all three death tests went first. That is the naming rule below at work.
:::

::: key
What is a death test and when do you want one? A test asserting the process terminates (and optionally what it prints) when a contract is violated. In flight-adjacent code it is how you verify an assertion or a safe-mode abort actually fires. Macros: `EXPECT_DEATH(stmt, regex)`, `ASSERT_DEATH(stmt, regex)`, `EXPECT_EXIT(stmt, ::testing::ExitedWithCode(n) or ::testing::KilledBySignal(sig), regex)`. Name the suite `*DeathTest`.
:::

### Why the suite name ends in DeathTest

Making a child process is safest while the test program has only one **thread** (one line of execution). A copy made while other threads are running copies the memory but not those threads, and a lock another thread was holding at that moment may stay locked forever in the child. Ordinary tests may start threads that are still around later. So GoogleTest runs every suite whose name ends in `DeathTest` *before* all other suites, while the program is most likely still single-threaded. That is why the convention is a rule you follow, not a style choice: name death-test suites `SomethingDeathTest`. If the tests use a fixture, give the same fixture a second name with `using GainTableDeathTest = GainTableTest;`.

If your program must start threads anyway, you can switch to a slower, safer method with the flag `--gtest_death_test_style=threadsafe`. There, the child is a fresh start of the whole test program, told to run only the one death test.

::: warning A death test only sees `stderr`, and the child's changes stay in the child
The regex is matched against the child's standard error, not standard output. A message printed with `std::printf` or `std::cout` will not match, and the test fails with "died but not with expected error". Also, anything the statement changes — a counter, a flag, a log in memory — changes only in the child's copy. After `EXPECT_DEATH(record_and_abort(), "")`, a global fault counter in the parent still reads $0$. Test side effects with ordinary tests.
:::

### When the alarm has no battery: assert and NDEBUG

The standard `assert(condition)` from `<cassert>` looks like a contract check, and in a debug build it is one: it prints the condition and aborts. But `assert` is defined to do *nothing at all* when the macro `NDEBUG` is defined, and [[release builds define it|ndebug]]. Here is the same death test written against an `assert`:

```cpp
#include <gtest/gtest.h>
#include <cassert>
#include <cstddef>

double gain_at(const double* gains, std::size_t n, std::size_t i) {
    assert(i < n && "gain index past end of table");
    return gains[i];
}

const double kGains[3] = {2.0, 0.5, 0.1};

TEST(GainAssertDeathTest, IndexPastEndAborts) {
    EXPECT_DEATH(gain_at(kGains, 3, 3), "gain index past end");
}
```

Built normally, it passes. Built with `-O2 -DNDEBUG`, as a release configuration does, the compiler first warns `unused parameter 'n'` — the check has vanished, so nothing reads `n` any more — and then the test fails:

```text
[ RUN      ] GainAssertDeathTest.IndexPastEndAborts
assertdeath.cpp:13: Failure
Death test: gain_at(kGains, 3, 3)
    Result: failed to die.
 Error msg:
[  DEATH   ] 

[  FAILED  ] GainAssertDeathTest.IndexPastEndAborts (0 ms)
```

This is the death test doing its job: it found a contract check that is not there in the build that ships. You have two honest options. Keep contract checks that must fire in flight as always-on checks, like `GNC_EXPECTS`, which do not depend on `NDEBUG`. Or accept that a check is debug-only, and run its death test only in the debug configuration of your CI matrix. What you must not do is believe the release build is protected because the debug build's tests passed.

::: warning Death tests are for contract violations, not for ordinary errors
A sensor read that fails, a file that is missing, a message with a bad checksum: these are things the world does, and flight code must handle them and keep flying. Return an error, raise a fault flag, count it. Test that with ordinary tests. A death test belongs where the *code itself* is wrong — a caller broke a promise — and stopping is the designed response.
:::

## Check yourself

::: check
A template `Saturate<T>(x, lo, hi)` clamps a value into a range, and your team uses it with `std::int32_t`, `float` and `double`. Nobody outside the team will add types. Typed tests or type-parameterized tests? Write the lines that attach the types.
:::

::: answer
Typed tests. You know all the types while writing the tests, and nobody else will instantiate them, so the extra registering step of type-parameterized tests buys nothing.

```cpp
template <typename T>
class SaturateTest : public ::testing::Test {};

using SatTypes = ::testing::Types<std::int32_t, float, double>;
TYPED_TEST_SUITE(SaturateTest, SatTypes);

TYPED_TEST(SaturateTest, ClampsHigh) {
    EXPECT_EQ(Saturate<TypeParam>(TypeParam(9), TypeParam(0), TypeParam(5)), TypeParam(5));
}
```

Each `TYPED_TEST` runs three times, in suites named `SaturateTest/0`, `/1` and `/2`.
:::

::: check
The ring buffer's mean test pushed four samples of $20000$. For `std::int16_t`, what would `mean()` return for four samples of $10000$? And for four samples of $9000$? Explain which ones fail.
:::

::: answer
Four samples of $10000$ sum to $40000$, which is above $32767$, so it wraps: $40000 - 65536 = -25536$. Then $-25536 \div 4 = -6384$. The test fails, and the answer even has the wrong sign.

Four samples of $9000$ sum to $36000$, also above $32767$: $36000 - 65536 = -29536$, and $-29536 \div 4 = -7384$. It fails too.

Any four samples summing to more than $32767$ fail — an average of about $8192$ or more. A test with small values, say $20$, $30$, $40$, $50$, would pass for every type and hide the bug. Typed tests only help when the values you push reach the edges of the smallest type.
:::

::: check
Why does GoogleTest insist that a `TYPED_TEST_P` is listed in `REGISTER_TYPED_TEST_SUITE_P`, instead of finding the tests by itself as it does for `TEST`?
:::

::: answer
The tests of a type-parameterized suite are instantiated later, possibly in another file, from a list the registering line produces. Registration is how the suite's "table of contents" is fixed at the point where the tests are written. If a test were defined but left off the list, it would compile and never run, for every type, forever — and a contract with a silently missing clause is dangerous. So GoogleTest checks the list against the definitions and aborts at startup with "You forgot to list test ..." when they disagree.
:::

::: check
A teammate writes `EXPECT_DEATH(enter_safe_mode("sun sensor lost"), "")` and says the safe-mode path is now tested. What does this test miss, and how would you tighten it?
:::

::: answer
It checks only that the process died somehow. It would also pass if `enter_safe_mode` crashed with a segmentation fault before telling anyone anything, or exited with the wrong code so the supervisor never switched to the backup. Tighten it with `EXPECT_EXIT` and a message:

```cpp
EXPECT_EXIT(enter_safe_mode("sun sensor lost"),
            ::testing::ExitedWithCode(42), "SAFE MODE: sun sensor lost");
```

Now it passes only if the process exited normally with the exact code the supervisor listens for, and wrote the reason to `stderr`. The suite should also be named `...DeathTest`.
:::

::: check
Your CI runs the test suite in a Debug build and a Release build. A death test for an `assert`-based check passes in Debug and fails in Release with "failed to die". Is this a bug in the test? What are your options?
:::

::: answer
It is not a bug in the test — it is the test's finding. Release builds define `NDEBUG`, which removes every `assert`, so in the shipped build the check does not exist and a bad index reads past the end of the array.

The options are: make the check always-on (a macro like `GNC_EXPECTS` that does not depend on `NDEBUG`), which is the right choice for any check that must fire in flight; or decide on purpose that this check is debug-only and run the death test only in the Debug configuration, writing that decision down. Deleting the test so Release goes green is not an option.
:::

## Summary

| Tool | What it does | Written as |
|---|---|---|
| Typed test | Same tests for each type in a known list | `TYPED_TEST_SUITE(F, ::testing::Types<A, B>)`, `TYPED_TEST(F, Name)` |
| `TypeParam`, `this->` | The current type; reaching fixture members | `this->buf_.push(TypeParam(1))` |
| Type-parameterized test | A contract, instantiated with types later | `TYPED_TEST_SUITE_P`, `TYPED_TEST_P`, `REGISTER_TYPED_TEST_SUITE_P`, `INSTANTIATE_TYPED_TEST_SUITE_P` |
| Death test | Passes only if the statement ends the process | `EXPECT_DEATH(stmt, regex)`, `ASSERT_DEATH(stmt, regex)` |
| Exit test | Says how it must end | `EXPECT_EXIT(stmt, ::testing::ExitedWithCode(n), regex)`, `::testing::KilledBySignal(SIGABRT)` |
| Naming | Death suites run first, before threads start | suite name ends in `DeathTest` |
| `assert` and `NDEBUG` | `assert` vanishes in release builds | always-on checks for flight contracts |

Every test so far has called the code under test directly, with values the test chose. The next lesson, "Dependency injection — opening a seam for the test", asks what to do when the code reads its inputs from hardware — a barometer on a bus — and shows how to open a seam so a test can hand it any readings it likes.

::: context design-by-contract Promises in code
The idea of treating a function as a contract was worked out by Bertrand Meyer, who built it into his Eiffel language and named it Design by Contract. A contract has preconditions (what the caller must guarantee), postconditions (what the function guarantees back) and invariants (what stays true of an object between calls). C++ does not yet have contracts built in, so teams use macros like `GNC_EXPECTS`. Flight software standards lean on the same idea: check assumptions at interfaces, and make a violation loud.
:::

::: context template-instantiation One recipe, three dishes
When the compiler meets `RingBuffer<short, 4>`, it takes the template's text, puts `short` wherever `T` appears, and compiles the result as a brand-new class. It does the same for `float` and for `double`. The three classes share source code but not machine code: `sum += at(i)` becomes an integer add in one and a floating-point add in the others. That is why a bug can live in only one of them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="12" width="140" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="37" font-size="13" fill="#1f2a44" text-anchor="middle">RingBuffer&lt;T, 4&gt;</text>
  <line x1="150" y1="52" x2="65" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="52" x2="180" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="52" x2="295" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="15" y="110" width="100" height="40" rx="6" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <rect x="130" y="110" width="100" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="245" y="110" width="100" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="135" font-size="12" fill="#b4232c" text-anchor="middle">T = short</text>
  <text x="180" y="135" font-size="12" fill="#1f2a44" text-anchor="middle">T = float</text>
  <text x="295" y="135" font-size="12" fill="#1f2a44" text-anchor="middle">T = double</text>
  <text x="65" y="166" font-size="11" fill="#b4232c" text-anchor="middle">integer add</text>
  <text x="237" y="166" font-size="11" fill="#6c7a93" text-anchor="middle">floating-point add</text>
</svg>
```
:::

::: context this-arrow Why the compiler needs a hint
When the compiler first reads a template, it does not yet know `TypeParam`, so it cannot see inside `RingBufferTest<TypeParam>`. For all it knows, some specialization of that base has no `buf_` member at all. So the rule is that a plain name is looked up only in places the compiler can see right away. Writing `this->buf_` makes the name depend on the type, which postpones the lookup until the type is known. The templates module calls this two-phase name lookup.
:::

::: context adc-counts Why sensors speak in whole numbers
Many sensors produce a voltage, and an analog-to-digital converter turns that voltage into a whole number of steps, called counts. A 16-bit converter reports one of $65536$ possible values. Flight software often stores and filters these raw counts before scaling them to engineering units like $\mathrm{m/s^2}$, because integers are exact, compact and fast on small processors. It also means integer overflow is a real risk, not a classroom one.
:::

::: context sixteen-bit-wrap The odometer that rolls over
A 16-bit integer is like a car odometer with a fixed number of wheels: after the largest value it rolls round to the smallest. A signed 16-bit value runs from $-32768$ to $32767$, which is $65536$ values in all. Since C++20, converting a too-big integer into a smaller signed type is defined to keep the value modulo $2^{16}$, so $80000$ becomes $80000 - 65536 = 14464$. Before C++20 the result was left up to each compiler. Either way, the sum is wrong.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="320" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="34" x2="180" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="86" font-size="11" fill="#1f2a44">-32768</text>
  <text x="180" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="340" y="86" font-size="11" fill="#1f2a44" text-anchor="end">32767</text>
  <circle cx="251" cy="52" r="6" fill="#b4232c"/>
  <text x="251" y="30" font-size="11" fill="#b4232c" text-anchor="middle">14464</text>
  <text x="180" y="110" font-size="11" fill="#6c7a93" text-anchor="middle">80000 does not fit, so it lands 65536 lower</text>
</svg>
```
:::

::: context safe-mode What stopping looks like on a spacecraft
Spacecraft almost never simply stop. When software detects something it cannot handle, it drops into safe mode: a minimal, well-tested configuration that points the solar panels at the Sun, keeps the vehicle warm and listens for the ground. A watchdog is a hardware timer that resets the computer if the software stops checking in. Together they turn "the process died" into "the vehicle is safe and waiting". A death test checks the first link in that chain: that the fault really does trigger the stop.
:::

::: context fork A copy that can crash safely
On Linux, GoogleTest's default death-test method uses a system call named `fork`, which makes a near-exact copy of the running program. Both copies continue from the same line; one is the parent, one is the child. The child runs the dangerous statement and dies. The parent waits for it, reads the exit status and the text the child wrote to `stderr`, and records a pass or a fail.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="40" x2="330" y2="40" stroke="#1f2a44" stroke-width="3"/>
  <text x="30" y="28" font-size="12" fill="#1f2a44">parent: test runner</text>
  <line x1="110" y1="40" x2="150" y2="110" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="150" y1="110" x2="240" y2="110" stroke="#1d6fd1" stroke-width="2"/>
  <text x="120" y="75" font-size="11" fill="#1d6fd1">fork</text>
  <text x="150" y="130" font-size="11" fill="#1d6fd1">child runs statement</text>
  <text x="250" y="116" font-size="16" fill="#b4232c">X</text>
  <path d="M 256 104 L 280 48" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="268" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">exit status and stderr</text>
  <circle cx="280" cy="40" r="5" fill="#1f2a44"/>
  <text x="300" y="60" font-size="11" fill="#1f2a44">parent checks</text>
</svg>
```
:::

::: context signals How the operating system ends a process
A signal is a short message the operating system delivers to a process. Some are requests, some are sentences. `SIGABRT`, "abort", is what `std::abort()` raises; its default action ends the process. `SIGSEGV` is delivered when a program touches memory it may not, which is the usual crash. Checking for `KilledBySignal(SIGABRT)` tells a deliberate contract stop apart from an accidental segmentation fault.
:::

::: context ndebug The switch that removes asserts
`NDEBUG` stands for "no debug". The C and C++ standards say that when it is defined, `assert(x)` expands to nothing, so the condition is not even evaluated. CMake's Release and RelWithDebInfo configurations add `-DNDEBUG` to the compiler flags by default, which is why a check that guards you in Debug can be absent in the build you fly. Lesson 10 returns to build configurations in the CI test matrix.
:::
