---
id: l07-googlemock-basics
title: GoogleMock, a pretend sensor that does what you say
minutes: 21
covers:
  - 'GoogleMock: mocking an ISensor or HAL interface; EXPECT_CALL, matchers, cardinalities'
---

A tennis player who wants to fix her backhand does not wait for an opponent to hit her a hundred backhands. She wheels out a ball machine. She sets it to fire high, spinning balls to her left, and it does exactly that, ball after ball, for as long as she likes. She can set it to send an awkward low ball on every fifth shot. A real opponent would never be that obliging.

Flight software has the same problem with its sensors. The code you most need to test is the code that runs when a sensor misbehaves: a read that fails, a value that freezes, a reading far outside its normal range. Real sensors almost never do those things when you ask. They fail at 3 a.m. during a thermal test, once, and then work perfectly for a week. You want a ball machine for sensors: a stand-in you can set to fail on the third read, every single time the test runs.

That stand-in is a **[[mock|test-double]]** — a test object that pretends to be a real part, returns whatever you tell it to, and records every call made to it so the test can check them. **GoogleMock** (often written gMock) is the mocking library that ships with GoogleTest. This lesson uses it to replace a pressure sensor and a vent valve behind their interfaces, so you can test a tank's safety logic without a tank. You will meet `MOCK_METHOD`, which builds a mock class; `EXPECT_CALL`, which says what calls you expect; **matchers**, which describe acceptable arguments; and **cardinalities**, which say how many times.

## From a hand-written fake to a mock

In the last lesson you made code mockable by **dependency injection**: instead of building its own driver, a class takes an interface reference in its constructor. That gave you a seam, and you filled it with a hand-written fake, `FakeBarometer` — a small class that implements the interface and hands back values you stored in it.

Hand-written fakes are fine for one or two cases. They get tiring fast. Every new test wants the fake to do something slightly different: fail on the second call, return a rising series of values, count how many times it was called. Soon the fake has more flags and counters than the code it is testing.

GoogleMock writes that class for you. Here is the code we will test. A propellant tank on a rocket stage has a pressure limit. Above it, a vent valve opens to let gas out. Both the sensor and the valve sit behind small interfaces, which is what a **[[hardware abstraction layer|hal]]** (HAL) looks like in code: the flight logic talks to "a pressure sensor", never to one particular chip.

```cpp
// tank.hpp
#pragma once
#include <algorithm>

class IPressureSensor {
public:
    virtual ~IPressureSensor() = default;
    // Reads channel ch into kpa. Returns false on a bus error.
    virtual bool read(int ch, double& kpa) = 0;
};

class IVentValve {
public:
    virtual ~IVentValve() = default;
    // 0.0 = closed, 1.0 = fully open.
    virtual void set_open(double fraction) = 0;
};

// Opens the vent in proportion to how far the tank is over its limit.
class TankGuard {
public:
    TankGuard(IPressureSensor& s, IVentValve& v, int ch)
        : sensor_(s), valve_(v), ch_(ch) {}

    void step() {
        double p = 0.0;
        if (!sensor_.read(ch_, p)) {        // bus error: touch nothing
            ++bad_reads_;
            return;
        }
        bad_reads_ = 0;
        same_ = (have_last_ && p == last_) ? same_ + 1 : 0;
        last_ = p;
        have_last_ = true;
        if (sensor_stuck()) return;         // frozen data: touch nothing
        if (p > kLimit) {
            valve_.set_open(std::min(1.0, (p - kLimit) / kBand));
        }
    }
    int bad_reads() const { return bad_reads_; }
    // Five identical samples in a row: a real transducer is never that quiet.
    bool sensor_stuck() const { return same_ >= 4; }

    static constexpr double kLimit = 300.0;  // kPa
    static constexpr double kBand  = 50.0;   // kPa from shut to wide open
private:
    IPressureSensor& sensor_;
    IVentValve& valve_;
    int ch_;
    int bad_reads_ = 0;
    int same_ = 0;
    double last_ = 0.0;
    bool have_last_ = false;
};
```

Read `step()` slowly, because every test below pokes at one line of it. It asks the sensor for a reading. If the read fails, it counts the failure and leaves the valve alone. If the read works, it checks whether the value is identical to the last one; five identical samples in a row means the **[[pressure transducer|transducer]]** has frozen, and a frozen sensor is ignored. Otherwise, above $300\,\mathrm{kPa}$ (read "kilopascals"; sea-level air is about $101\,\mathrm{kPa}$), it opens the vent by the fraction $(p - 300)/50$, capped at $1$.

Notice that `read` hands its answer back through `double& kpa`, an **[[out-parameter|out-parameter]]** — an argument the function writes into — while its return value is only a yes-or-no status. Drivers are full of this shape, so a mock must be able to fill in out-parameters, not only return values.

## MOCK_METHOD builds the mock class

A mock class inherits from the interface and declares each method with the **`MOCK_METHOD`** macro:

```cpp
// mocks.hpp
#pragma once
#include <gmock/gmock.h>
#include "tank.hpp"

class MockPressureSensor : public IPressureSensor {
public:
    MOCK_METHOD(bool, read, (int ch, double& kpa), (override));
};

class MockVentValve : public IVentValve {
public:
    MOCK_METHOD(void, set_open, (double fraction), (override));
};
```

`MOCK_METHOD` takes four things in order: the return type, the method name, the argument list in parentheses, and a list of qualifiers in parentheses. Put `override` in the qualifiers every time, so the compiler complains if the mock's signature drifts away from the interface's. A `const` method gets `(const, override)`. The [[macro|macro]] expands into a real override that records each call and looks up what to do.

::: warning
If a return type or argument type has a comma in it, wrap that type in its own parentheses, or the macro counts the comma as a separator: `MOCK_METHOD((std::pair<bool, double>), sample, (), (override));`. Without the extra parentheses the error message is long and confusing.
:::

## EXPECT_CALL: what should happen, and what to hand back

An **expectation** is a sentence the test says to the mock before the code runs: "I expect `read` to be called with these arguments, this many times, and when it is, do this." You write it with **`EXPECT_CALL`**:

```cpp
EXPECT_CALL(sensor, read(Eq(2), _))
    .WillOnce(DoAll(SetArgReferee<1>(330.0), Return(true)));
```

Read it aloud as "expect a call to `sensor.read` whose first argument equals 2 and whose second argument can be anything; the first time it happens, write 330 into argument 1 and return true". The pieces:

- **`Eq(2)`** and **`_`** (read "underscore", or "anything") are **matchers**. A matcher is a test that an argument must pass for the call to count. `Eq(2)` means "equal to 2". `_` accepts any value.
- **`.WillOnce(action)`** says what the mock does the next time a matching call arrives. An **action** is what the mock does in response to a call.
- **`Return(true)`** is the action "return this value".
- **`SetArgReferee<1>(330.0)`** writes $330.0$ into the argument at position 1, the out-parameter `kpa`. Positions count from zero, so position 0 is `ch` and position 1 is `kpa`.
- **`DoAll(a, b, …)`** runs several actions in order and returns what the last one returns. You need it whenever you set an out-parameter and also return a status.

The order in a test is always the same: create the mocks, set the expectations, then run the code. An expectation set after the call has happened is too late; the call has already been judged.

::: key
GoogleMock lets you test **interaction**: which calls the code under test makes, with what arguments, how many times and in what order, plus canned return values and out-parameters. It is how flight logic is tested against a sensor that is not present.
:::

### The matchers you will use most

| Matcher | Accepts an argument that… |
| --- | --- |
| `_` | is anything at all |
| `Eq(v)` | equals `v` (writing `v` alone means the same thing) |
| `Ne(v)`, `Lt(v)`, `Le(v)`, `Gt(v)`, `Ge(v)` | is not equal to, less than, at most, greater than, at least `v` |
| `DoubleNear(v, tol)` | is a `double` within `tol` of `v` |

A plain value in an argument slot is shorthand for `Eq`: `read(2, _)` means the same as `read(Eq(2), _)`. Writing `Eq` out makes the intent visible, which is why this lesson does.

`DoubleNear` matters because the valve fraction is computed, not typed in. Lesson 03 showed why computed `double` values almost never match exactly; the same reasoning applies here. $(330 - 300)/50$ is $0.6$ on paper, but a different order of operations could land a few units in the last place away. `DoubleNear(0.6, 1e-9)` accepts anything within one billionth of $0.6$.

::: example Two nominal cases: below the limit, and above it
Here are two tests. The first feeds a pressure below the limit and demands the valve never moves. The second feeds $330\,\mathrm{kPa}$ and demands exactly one valve command of about $0.6$.

```cpp
// t_tank.cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include "mocks.hpp"

using ::testing::_;
using ::testing::DoAll;
using ::testing::DoubleNear;
using ::testing::Eq;
using ::testing::Return;
using ::testing::SetArgReferee;

TEST(TankGuardTest, BelowLimitLeavesValveAlone) {
    MockPressureSensor sensor;
    MockVentValve valve;
    EXPECT_CALL(sensor, read(Eq(2), _))
        .WillOnce(DoAll(SetArgReferee<1>(280.0), Return(true)));
    EXPECT_CALL(valve, set_open(_)).Times(0);

    TankGuard guard(sensor, valve, 2);
    guard.step();
}

TEST(TankGuardTest, OverLimitOpensValveInProportion) {
    MockPressureSensor sensor;
    MockVentValve valve;
    EXPECT_CALL(sensor, read(Eq(2), _))
        .WillOnce(DoAll(SetArgReferee<1>(330.0), Return(true)));
    EXPECT_CALL(valve, set_open(DoubleNear(0.6, 1e-9))).Times(1);

    TankGuard guard(sensor, valve, 2);
    guard.step();
}
```

Build and run with `g++ -std=c++20 -Wall -Wextra t_tank.cpp -o t_tank -lgmock -lgtest -lgtest_main -pthread`:

```text
Running main() from ./googletest/src/gtest_main.cc
[==========] Running 2 tests from 1 test suite.
[----------] Global test environment set-up.
[----------] 2 tests from TankGuardTest
[ RUN      ] TankGuardTest.BelowLimitLeavesValveAlone
[       OK ] TankGuardTest.BelowLimitLeavesValveAlone (0 ms)
[ RUN      ] TankGuardTest.OverLimitOpensValveInProportion
[       OK ] TankGuardTest.OverLimitOpensValveInProportion (0 ms)
[----------] 2 tests from TankGuardTest (0 ms total)

[----------] Global test environment tear-down
[==========] 2 tests from 1 test suite ran. (0 ms total)
[  PASSED  ] 2 tests.
```

Neither test has an `EXPECT_EQ`. The checking lives in the expectations: GoogleMock verifies each one when the mock object is [[destroyed at the end of the test|verify-at-destruction]]. Sanity check on the number: $330 - 300 = 30\,\mathrm{kPa}$ over the limit, and $30 / 50 = 0.6$, a bit more than half open, which is right for a tank a bit more than halfway through its $50\,\mathrm{kPa}$ band.
:::

Now watch a failure, because that is what the output is for. Suppose someone "tidies" the formula and divides by `kLimit` instead of `kBand`. The code now asks for $30/300 = 0.1$. Run only the second test, with `./t_tank --gtest_filter='*Proportion'` (lesson 09 explains filters):

```text
Running main() from ./googletest/src/gtest_main.cc
Note: Google Test filter = *Proportion
[==========] Running 1 test from 1 test suite.
[----------] Global test environment set-up.
[----------] 1 test from TankGuardTest
[ RUN      ] TankGuardTest.OverLimitOpensValveInProportion
unknown file: Failure

Unexpected mock function call - returning directly.
    Function call: set_open(0.1)
Google Mock tried the following 1 expectation, but it didn't match:

t_tank.cpp:29: EXPECT_CALL(valve, set_open(DoubleNear(0.6, 1e-9)))...
  Expected arg #0: is approximately 0.59999999999999998 (absolute error <= 1.0000000000000001e-09)
           Actual: 0.1, which is -0.5 from 0.6
         Expected: to be called once
           Actual: never called - unsatisfied and active

t_tank.cpp:29: Failure
Actual function call count doesn't match EXPECT_CALL(valve, set_open(DoubleNear(0.6, 1e-9)))...
         Expected: to be called once
           Actual: never called - unsatisfied and active

[  FAILED  ] TankGuardTest.OverLimitOpensValveInProportion (0 ms)
[----------] 1 test from TankGuardTest (0 ms total)

[----------] Global test environment tear-down
[==========] 1 test from 1 test suite ran. (0 ms total)
[  PASSED  ] 0 tests.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] TankGuardTest.OverLimitOpensValveInProportion

 1 FAILED TEST
```

Two failures come out of one bug, and both are useful. The first says a call arrived, `set_open(0.1)`, that no expectation accepted, and shows exactly which matcher rejected it and by how much. The second fires when the mock is destroyed: the expected call with $0.6$ never came. The line `0.59999999999999998` is $0.6$ printed to full precision; it is the nearest `double` to $0.6$, which is why `DoubleNear` was the right matcher.

## Cardinalities: how many times

A **[[cardinality|cardinality]]** is the number of times a call is allowed to happen. You set it with `.Times(…)`:

| You write | It means |
| --- | --- |
| `.Times(0)` | must never be called |
| `.Times(3)` | exactly three times |
| `.Times(AtLeast(1))` | one or more times |
| `.Times(AtMost(2))` | zero, one or two times |
| `.Times(Between(2, 4))` | two, three or four times |

`.Times(0)` is the quiet hero of fault testing. "When the read fails, the valve is not touched" is a safety requirement, and a `Times(0)` expectation turns it into a check.

When you leave `.Times` out, GoogleMock works it out from the actions:

- no `WillOnce` and no `WillRepeatedly`: exactly once;
- $n$ `WillOnce` actions and no `WillRepeatedly`: exactly $n$ times;
- $n$ `WillOnce` actions followed by a `WillRepeatedly`: at least $n$ times.

**`.WillRepeatedly(action)`** is the action for every call after the `WillOnce` actions run out. Chain them to script a story: fail, fail, then work.

::: key
Cardinalities: `Times(0)` means never, `Times(n)` exactly $n$, `AtLeast(n)`, `AtMost(n)`, `Between(a, b)`. With no `Times`, the count is inferred from the number of `WillOnce` actions, and a trailing `WillRepeatedly` makes it "at least that many".
:::

::: warning
A call with no action still returns something: the default value for its type. For `bool` that is `false`, for numbers `0`, for pointers `nullptr`. So `EXPECT_CALL(sensor, read(_, _)).Times(3);` with no `Return` quietly makes every read fail, and leaves `kpa` untouched. If your "nominal" test is mysteriously taking the failure path, look for a missing `Return(true)`.
:::

## Driving the faults on demand

Here is where the ball machine pays for itself. Three cases matter for any sensor: it works, it fails outright, or it keeps "working" while reporting a frozen value. A **stuck sensor** is the nastiest, because every read succeeds and every status bit says all is well. Real hardware does it: a converter locks up, a driver keeps returning its last buffer, a cable fault leaves a register unchanged. Much of avionics design is about catching data that looks valid but is not.

With a mock, you can produce all three at will.

::: example Bus errors, recovery, and a frozen sensor
```cpp
// t_faults.cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include "mocks.hpp"

using ::testing::_;
using ::testing::DoAll;
using ::testing::Gt;
using ::testing::Return;
using ::testing::SetArgReferee;

TEST(TankGuardFaults, BusErrorsNeverMoveTheValve) {
    MockPressureSensor sensor;
    MockVentValve valve;
    EXPECT_CALL(sensor, read(_, _)).Times(3).WillRepeatedly(Return(false));
    EXPECT_CALL(valve, set_open(_)).Times(0);

    TankGuard guard(sensor, valve, 2);
    for (int i = 0; i < 3; ++i) guard.step();
    EXPECT_EQ(guard.bad_reads(), 3);
}

TEST(TankGuardFaults, RecoversAfterTwoBadReads) {
    MockPressureSensor sensor;
    MockVentValve valve;
    EXPECT_CALL(sensor, read(_, _))
        .WillOnce(Return(false))
        .WillOnce(Return(false))
        .WillOnce(DoAll(SetArgReferee<1>(340.0), Return(true)));
    EXPECT_CALL(valve, set_open(Gt(0.0))).Times(1);

    TankGuard guard(sensor, valve, 2);
    guard.step();
    guard.step();
    EXPECT_EQ(guard.bad_reads(), 2);
    guard.step();
    EXPECT_EQ(guard.bad_reads(), 0);
}

TEST(TankGuardFaults, StuckSensorIsFlaggedAndIgnored) {
    MockPressureSensor sensor;
    MockVentValve valve;
    EXPECT_CALL(sensor, read(_, _))
        .Times(8)
        .WillRepeatedly(DoAll(SetArgReferee<1>(350.0), Return(true)));
    EXPECT_CALL(valve, set_open(Gt(0.0))).Times(4);

    TankGuard guard(sensor, valve, 2);
    for (int i = 0; i < 8; ++i) guard.step();
    EXPECT_TRUE(guard.sensor_stuck());
}
```

Built together with the first file (`g++ … t_tank.cpp t_faults.cpp …`) and run, the last part of the output is:

```text
[----------] 3 tests from TankGuardFaults
[ RUN      ] TankGuardFaults.BusErrorsNeverMoveTheValve
[       OK ] TankGuardFaults.BusErrorsNeverMoveTheValve (0 ms)
[ RUN      ] TankGuardFaults.RecoversAfterTwoBadReads
[       OK ] TankGuardFaults.RecoversAfterTwoBadReads (0 ms)
[ RUN      ] TankGuardFaults.StuckSensorIsFlaggedAndIgnored
[       OK ] TankGuardFaults.StuckSensorIsFlaggedAndIgnored (0 ms)
[----------] 3 tests from TankGuardFaults (0 ms total)

[----------] Global test environment tear-down
[==========] 5 tests from 2 test suites ran. (0 ms total)
[  PASSED  ] 5 tests.
```

Walk through the stuck case, because the count of 4 is the whole point. The mock returns $350\,\mathrm{kPa}$ eight times. That is $50\,\mathrm{kPa}$ over the limit, so a healthy guard would open the vent fully. On step 1 there is no previous sample, so `same_` is 0. On steps 2, 3, 4 and 5 the value repeats, so `same_` becomes 1, 2, 3, 4. The guard commands the valve on steps 1 to 4, where `same_` is below 4. On step 5, `same_` reaches 4, `sensor_stuck()` turns true, and from then on the guard ignores the data. Steps 1 to 4 make four commands; steps 5 to 8 make none. Total: 4, which is what `Times(4)` demands.

The middle test scripts a story: two `WillOnce(Return(false))`, then one good read. The count of bad reads goes 1, 2, then back to 0, and the valve moves exactly once, with some fraction greater than zero. `Gt(0.0)` is the right matcher when the test cares that the valve opened, not by how much.
:::

### Stale is not the same as fresh

The stuck test checks more than "the code did not crash". It checks that a sample the guard has already seen is not treated as new information. That property has a name: a **stale** sample is an old value handed back again, and a good estimator must never use a stale sample as if it were **fresh**. Two checks are common, and both are easy to drive with a mock.

The first is the one `TankGuard` uses: compare each value with the last one and count identical repeats. It needs nothing from the sensor, but it can only say "suspicious" after several repeats, because a real value can repeat once by chance. For a sensor that returns several numbers, such as an IMU with a gyro and an accelerometer vector, compare all six numbers; a live IMU practically never repeats all of them exactly.

The second is stronger: many sensors put a **sequence counter** (or a timestamp) in every packet, a number that goes up by one with each new measurement. If the counter has not moved, the packet is stale, immediately, with no waiting:

```cpp
struct ImuSample { Vec3 gyro, accel; std::uint32_t seq = 0; };

void step() {
    ImuSample s;
    if (!imu_.read(s)) { valid_ = false; return; }
    if (have_seq_ && s.seq == last_seq_) {   // same packet again: stale
        valid_ = false;
        return;
    }
    have_seq_ = true;
    last_seq_ = s.seq;
    rate_ = s.gyro;
    valid_ = true;
}
```

The test hands back the same packet twice and checks that the first read counts as fresh and the second does not:

```cpp
TEST(RateFilterTest, RepeatedPacketIsStale) {
    MockImuPacket imu;
    const ImuSample same{{0.01, 0.0, 0.0}, {0.0, 0.0, 9.81}, 41};
    EXPECT_CALL(imu, read(_))
        .Times(2)
        .WillRepeatedly(DoAll(SetArgReferee<0>(same), Return(true)));

    RateFilter f(imu);
    f.step();
    EXPECT_TRUE(f.valid());    // first sight of packet 41: fresh
    f.step();
    EXPECT_FALSE(f.valid());   // packet 41 again: stale, not fresh
}
```

Either way, the pattern is the same: `WillRepeatedly` with an identical value produces a frozen sensor on demand, and the test asserts what the code *does* with it — flags it invalid and leaves the output untouched — not only that the call happened.

Each of those three situations would be close to impossible to arrange on the bench on demand. You would need to short a data line at exactly the right moment, or freeze a sensor's output while the rest of the board keeps running, and then do it again identically on every build. With a mock, each is four lines, runs in under a millisecond, and behaves the same on every run. That is the real gift of mocking: **controllability** — you decide exactly what the outside world does, including the rare and dangerous parts, and you get the same thing every time.

::: warning
A mock tests your logic against *your idea* of the sensor. It knows nothing about the real chip's timing, its electrical noise, the driver's bugs, or what really happens on the bus when a cable is loose. If you believe the sensor returns kilopascals and it really returns pounds per square inch, every mock test passes and the rocket still vents at the wrong pressure. Mock tests sit in front of **[[hardware-in-the-loop|hil]]** testing, never in place of it.
:::

## Order, and what comes next

The key block above says GoogleMock can check *in what order* calls happen. By default it does not care: two expectations can be satisfied in either order. When order matters, as in "arm the pyrotechnic circuit, then fire it", you ask for it explicitly with a sequence, which the next lesson shows alongside its cousins.

There is also a question this lesson has stepped around. In `BelowLimitLeavesValveAlone`, what if `step()` had called some other method on the sensor that you set no expectation for at all? GoogleMock has three different attitudes to such a call, called naggy, nice and strict, and choosing between them is the subject of the next lesson.

## Check yourself

::: check
An interface has `virtual int temperature_mc(int sensor_id) const = 0;` (temperature in millidegrees Celsius). Write the `MOCK_METHOD` line for it.
:::

::: answer
`MOCK_METHOD(int, temperature_mc, (int sensor_id), (const, override));`

The four parts are the return type `int`, the name, the argument list in parentheses, and the qualifiers in parentheses. The method is `const` in the interface, so the qualifier list must say `const` as well as `override`; without `const` the mock would declare a different method, and `override` would make the compiler catch the mismatch.
:::

::: check
A test writes `EXPECT_CALL(sensor, read(_, _)).WillOnce(Return(true)).WillOnce(Return(false)).WillRepeatedly(Return(true));` and no `Times`. How many calls are allowed? What does the fifth call return?
:::

::: answer
Two `WillOnce` actions followed by a `WillRepeatedly` means the inferred cardinality is "at least 2". Any number of calls from 2 upward passes. The first call returns true, the second false, and every call after that, including the fifth, uses the `WillRepeatedly` action and returns true. Note that none of these actions sets `kpa`, so the code under test will see whatever value its variable already held (0.0 in `TankGuard`).
:::

::: check
The guard is given $362.5\,\mathrm{kPa}$. What fraction should the valve receive, and which matcher and tolerance would you use in the expectation?
:::

::: answer
The tank is $362.5 - 300 = 62.5\,\mathrm{kPa}$ over the limit. $62.5 / 50 = 1.25$, which is more than 1, so `std::min` caps it at exactly $1.0$. The expectation is `EXPECT_CALL(valve, set_open(DoubleNear(1.0, 1e-9))).Times(1);`. Here the value is exactly 1.0 because `std::min` returns the literal `1.0`, so `Eq(1.0)` would also pass, but `DoubleNear` keeps the test honest if the formula is ever reshaped. This test is worth writing: it is the one that proves the cap works.
:::

::: check
A colleague's IMU interface is `virtual bool read(Vec3& gyro, Vec3& accel) = 0;`. Write an expectation that, on the next call only, fills the gyro with `Vec3{0.01, 0.0, -0.02}` and the accelerometer with `Vec3{0.0, 0.0, 9.81}` and reports success.
:::

::: answer
```cpp
const Vec3 g{0.01, 0.0, -0.02};
const Vec3 a{0.0, 0.0, 9.81};
EXPECT_CALL(imu, read(_, _))
    .WillOnce(DoAll(SetArgReferee<0>(g), SetArgReferee<1>(a), Return(true)));
```

Position 0 is `gyro` and position 1 is `accel`, counting from zero. `DoAll` runs the three actions in order and returns the value of the last one, `true`. Because there is one `WillOnce` and no `Times`, exactly one call is expected. For a stuck-IMU test, replace `WillOnce` with `.Times(n).WillRepeatedly(…)` so the same two vectors come back on every read.
:::

::: check
A test for a star tracker has `EXPECT_CALL(tracker, read(_)).Times(1);`, but the code calls `read` twice. Describe what GoogleMock reports and when.
:::

::: answer
On the second call, the one expectation is already used up. GoogleMock reports a failure on the spot: "Mock function called more times than expected", followed by "Expected: to be called once" and "Actual: called twice - over-saturated and active". The call returns the type's default value (for example `false` for a `bool`), so the code under test may then misbehave in a way that causes more failures. The report points at the `EXPECT_CALL` line, so you know which expectation was exceeded.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Mock | a stand-in object that returns what you script and records every call |
| `MOCK_METHOD(ret, name, (args), (quals))` | builds one mocked override; always include `override`, add `const` when needed |
| `EXPECT_CALL(mock, method(matchers))` | declares a call you expect; set it before the code runs |
| Matchers | `_`, `Eq`, `Ne`, `Lt`, `Le`, `Gt`, `Ge`, `DoubleNear(v, tol)` |
| Actions | `Return(v)`, `SetArgReferee<i>(v)` for out-parameters, `DoAll(…)` to combine |
| `WillOnce` / `WillRepeatedly` | script the next call / every call after the scripted ones |
| Cardinalities | `Times(0)`, `Times(n)`, `AtLeast`, `AtMost`, `Between`; inferred when left out |
| Verification | when the mock is destroyed, every unsatisfied expectation fails the test |
| What mocks buy | controllable, repeatable faults; they complement hardware testing, never replace it |

The next lesson, *NiceMock, StrictMock and what an uninteresting call means*, deals with the calls you did not write expectations for, shows how to demand an order with `InSequence`, and explains why a strict mock that fails is often telling you something about your design.

::: context test-double A fake that also keeps score
Last lesson's `FakeBarometer` was one kind of test double: it played back readings and counted calls, and the test then asked it questions afterward. A mock turns that around. You tell it *before* the code runs which calls should arrive, with which arguments and how many times, and it judges every call as it happens, failing the test the moment one breaks the plan. That is why a mock test often has no `EXPECT_EQ` at all: the expectations are the checks. A GoogleMock object can also act as a plain stub, returning canned values with no demands, when that is all a test needs.
:::

::: context hal The layer between logic and chips
A hardware abstraction layer is a thin set of interfaces that hides which exact chip is on the board. The flight logic asks "read pressure on channel 2"; the layer below knows which bus, which register and which conversion formula that means.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="10" width="280" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="33" font-size="13" text-anchor="middle" fill="#1f2a44">flight logic: TankGuard</text>
  <rect x="40" y="62" width="280" height="36" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="85" font-size="13" text-anchor="middle" fill="#1f2a44">HAL: IPressureSensor, IVentValve</text>
  <rect x="40" y="114" width="130" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="105" y="137" font-size="12" text-anchor="middle" fill="#1f2a44">real driver</text>
  <rect x="190" y="114" width="130" height="36" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="255" y="137" font-size="12" text-anchor="middle" fill="#1f2a44">mock (in tests)</text>
  <line x1="180" y1="46" x2="180" y2="62" stroke="#1f2a44" stroke-width="2"/>
  <line x1="105" y1="98" x2="105" y2="114" stroke="#1f2a44" stroke-width="2"/>
  <line x1="255" y1="98" x2="255" y2="114" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="172" font-size="11" text-anchor="middle" fill="#6c7a93">either one plugs in below the same interface</text>
</svg>
```

Because the logic only knows the middle layer, a mock can take the real driver's place without the logic noticing.
:::

::: context transducer Why a perfect signal is a warning sign
A pressure transducer turns pressure into an electrical signal, which an analog-to-digital converter turns into a number. Every real one has noise: the last digit or two flickers from sample to sample, even when the tank pressure is steady. So a series of bit-for-bit identical readings is suspicious. It usually means the converter, the bus or the driver has frozen and keeps handing back its last value.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="146" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
  <polyline points="20,60 40,55 60,63 80,57 100,61 120,54 140,59 160,62 180,56" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="100" y="40" font-size="12" text-anchor="middle" fill="#1d6fd1">healthy: small flicker</text>
  <polyline points="180,56 200,58 220,58 240,58 260,58 280,58 300,58 320,58 340,58" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="260" y="85" font-size="12" text-anchor="middle" fill="#b4232c">stuck: perfectly flat</text>
</svg>
```

That is why `TankGuard` treats five identical samples as a fault rather than as good news.
:::

::: context out-parameter Returning two things at once
A C++ function has one return value. A driver wants to say two things: "did the read work?" and "what was the value?". A common answer in embedded code is to return the status and write the value into a reference argument, the out-parameter. It avoids exceptions, which many flight codebases turn off, and it makes the caller look at the status. The catch for testing is that a mock has to write into that reference too, which is the job of `SetArgReferee`. Newer code sometimes returns a `std::optional` or a small struct instead; a mock handles those with a plain `Return`.
:::

::: context macro Code that writes code
A macro is a text substitution done by the preprocessor before the compiler proper sees the file. `MOCK_METHOD(bool, read, (int ch, double& kpa), (override))` expands into a full method definition with the right signature, plus hidden bookkeeping: a list of expectations for that method, a record of calls, and the code that matches each call against the list. You never see that code, which is why a typo inside the macro can produce a very long error message. Read the first error, not the last.
:::

::: context verify-at-destruction When the expectations are checked
Some checks happen during the test, some at the end. An unexpected or excess call fails the moment it happens. A call that was expected but never came can only be judged once nothing more can happen, which is when the mock object is destroyed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,60 330,55 330,65" fill="#1f2a44"/>
  <circle cx="50" cy="60" r="6" fill="#1d6fd1"/>
  <text x="50" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">EXPECT_CALL</text>
  <circle cx="170" cy="60" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="170" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">code runs</text>
  <text x="170" y="86" font-size="11" text-anchor="middle" fill="#b4232c">wrong or extra call:</text>
  <text x="170" y="101" font-size="11" text-anchor="middle" fill="#b4232c">fails now</text>
  <circle cx="290" cy="60" r="6" fill="#b4232c"/>
  <text x="290" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">closing brace</text>
  <text x="290" y="86" font-size="11" text-anchor="middle" fill="#b4232c">missing call:</text>
  <text x="290" y="101" font-size="11" text-anchor="middle" fill="#b4232c">fails here</text>
</svg>
```

Mocks declared as local variables in a `TEST` are destroyed at the closing brace, so this is automatic. If you ever create a mock with `new` and forget to delete it, the missing-call checks never run.
:::

::: context cardinality A word from set theory
In mathematics, the cardinality of a set is how many things are in it: the set of days in a week has cardinality 7. GoogleMock borrows the word for "how many calls". `Times(3)` says the set of matching calls must have exactly three members; `AtLeast(1)` says it must not be empty. Treat a cardinality as part of the requirement, not decoration. "The valve is commanded once per step", "never on a bad read" and "at most twice in this scenario" are all statements a reviewer can check against the design.
:::

::: context hil The real hardware still gets its turn
Hardware-in-the-loop (HIL) testing runs the real flight computer, with its real software and often real sensors and actuators, wired to a simulator that plays the part of the world: the simulator produces the signals the sensors would see in flight, and reads back what the computer commands. It catches what no mock can: timing on the real processor, driver bugs, wrong units at the chip, a connector wired backwards. It is also slow, expensive and shared by the whole team. A sensible split is to use mocks for every logic path, including rare faults, thousands of times a day, and HIL for the smaller set of tests where the physical parts are the thing in question.
:::
