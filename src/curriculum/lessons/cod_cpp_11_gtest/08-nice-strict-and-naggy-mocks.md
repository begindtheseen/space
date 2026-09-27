---
id: l08-nice-strict-and-naggy-mocks
title: Nice, naggy and strict mocks, and the calls nobody mentioned
minutes: 21
covers:
  - NiceMock, StrictMock and what an uninteresting call means
---

Picture three bouncers at the door of a birthday party, each holding the same guest list. A guest who is not on the list at all walks up. The first bouncer shrugs and waves him in. The second waves him in too, but grumbles loudly to the host about it. The third turns him away and calls the host over. Now a different case: a guest who *is* on the list shows up with the wrong ticket, or comes back a second time after being let in once. All three bouncers stop that person. Being relaxed about strangers is a choice; letting in a listed guest with the wrong ticket is never allowed.

GoogleMock has the same three bouncers. In the last lesson you wrote expectations, the guest list, with `EXPECT_CALL`. This lesson is about what a mock does with a call that is not on the list at all, which GoogleMock calls an **uninteresting call**. You will meet the three attitudes a mock can take to such calls — **naggy**, **nice** and **strict** — and learn when each is right. You will also see how to demand that calls happen in a particular order, which is a separate question, and why a strict mock that fails is often telling you something about your design rather than about your test.

On a flight vehicle this matters most for **actuators**: valves, thrusters, pyrotechnic devices, anything that moves or changes the world. "The code must not command the vent valve when the pressure reading failed" is a safety requirement. It is a statement about a call that must *not* happen, and a strict mock is how you check it.

## Interesting, uninteresting and unexpected

Three words, three precise meanings. Get these straight and the rest of the lesson follows.

- A method is **interesting** in a test if the test wrote at least one `EXPECT_CALL` for it on that mock object.
- An **uninteresting call** is a call to a method that has *no* `EXPECT_CALL` at all in this test. The test said nothing about it, one way or the other. This is the stranger who is not on the list.
- An **unexpected call** is a call to an interesting method that none of its expectations accepts: the arguments fail every matcher, or every matching expectation has already been used up. This is the listed guest with the wrong ticket.

An unexpected call is always a test failure, whatever kind of mock you use. You saw one in the last lesson: `set_open(0.1)` arrived when the only expectation wanted about $0.6$, and GoogleMock reported "Unexpected mock function call". The test had spoken about `set_open`, and this call broke what it said.

An uninteresting call is different. The test never mentioned the method, so GoogleMock cannot know whether the call is fine. What it does is a setting you choose per mock object:

- **Naggy** (the default, a plain `MockFoo`): the call goes ahead, returns the type's default value, and GoogleMock prints a warning. The test still passes.
- **Nice** (`NiceMock<MockFoo>`): the call goes ahead, returns the default, and nothing is printed.
- **Strict** (`StrictMock<MockFoo>`): the call is a test failure.

`NiceMock` and `StrictMock` are **[[class templates that wrap your mock|wrapper-template]]**; you do not change the mock class at all, only the type of the variable in the test.

::: key
By default an uninteresting call produces a warning. NiceMock silences it, StrictMock turns it into a failure. StrictMock is valuable when the set of calls is itself part of the contract, for example that a failed read does not trigger an actuator command.
:::

## One test, three moods

Here is a small tank guard again. This version also reads the sensor's temperature after each good pressure read, to keep for a health log. The mock gains a second method.

```cpp
// guard.hpp
#pragma once
#include <algorithm>
#include <cstdio>

class IPressureSensor {
public:
    virtual ~IPressureSensor() = default;
    virtual bool read(int ch, double& kpa) = 0;   // false on a bus error
    virtual double temperature_c() const = 0;     // sensor body temperature
};

class IVentValve {
public:
    virtual ~IVentValve() = default;
    virtual void set_open(double fraction) = 0;  // 0 closed .. 1 open
};

class TankGuard {
public:
    TankGuard(IPressureSensor& s, IVentValve& v) : sensor_(s), valve_(v) {}
    void step() {
        double p = 0.0;
        if (!sensor_.read(2, p)) { ++bad_reads_; return; }
        last_temp_c_ = sensor_.temperature_c();    // kept for the health log
        if (p > 300.0) valve_.set_open(std::min(1.0, (p - 300.0) / 50.0));
    }
    int bad_reads() const { return bad_reads_; }
private:
    IPressureSensor& sensor_;
    IVentValve& valve_;
    int bad_reads_ = 0;
    double last_temp_c_ = 0.0;
};
```

```cpp
// mocks.hpp
#pragma once
#include <gmock/gmock.h>
#include "guard.hpp"

class MockPressureSensor : public IPressureSensor {
public:
    MOCK_METHOD(bool, read, (int ch, double& kpa), (override));
    MOCK_METHOD(double, temperature_c, (), (const, override));
};

class MockVentValve : public IVentValve {
public:
    MOCK_METHOD(void, set_open, (double fraction), (override));
};
```

::: example The same test with a naggy, a nice and a strict sensor
Each test feeds $280\,\mathrm{kPa}$, below the $300\,\mathrm{kPa}$ limit, and checks that the valve is never touched. The valve is a `StrictMock` with no expectations, so any valve call at all fails. The only difference between the three tests is the type of the sensor mock. None of them says anything about `temperature_c`, so when the guard calls it, that is an uninteresting call.

```cpp
// t_moods.cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include "mocks.hpp"

using ::testing::_;
using ::testing::DoAll;
using ::testing::NiceMock;
using ::testing::Return;
using ::testing::SetArgReferee;
using ::testing::StrictMock;

// The one thing each test cares about: 280 kPa means "leave the valve alone".
template <class Sensor>
void feed_280(Sensor& sensor) {
    EXPECT_CALL(sensor, read(2, _))
        .WillOnce(DoAll(SetArgReferee<1>(280.0), Return(true)));
}

TEST(Moods, Naggy) {
    MockPressureSensor sensor;                 // the default: naggy
    StrictMock<MockVentValve> valve;
    feed_280(sensor);
    TankGuard(sensor, valve).step();
}

TEST(Moods, Nice) {
    NiceMock<MockPressureSensor> sensor;
    StrictMock<MockVentValve> valve;
    feed_280(sensor);
    TankGuard(sensor, valve).step();
}

TEST(Moods, Strict) {
    StrictMock<MockPressureSensor> sensor;
    StrictMock<MockVentValve> valve;
    feed_280(sensor);
    TankGuard(sensor, valve).step();
}
```

Built with `g++ -std=c++20 -Wall -Wextra t_moods.cpp -o t_moods -lgmock -lgtest -lgtest_main -pthread` and run:

```text
Running main() from ./googletest/src/gtest_main.cc
[==========] Running 3 tests from 1 test suite.
[----------] Global test environment set-up.
[----------] 3 tests from Moods
[ RUN      ] Moods.Naggy

GMOCK WARNING:
Uninteresting mock function call - returning default value.
    Function call: temperature_c()
          Returns: 0
NOTE: You can safely ignore the above warning unless this call should not happen.  Do not suppress it by blindly adding an EXPECT_CALL() if you don't mean to enforce the call.  See https://github.com/google/googletest/blob/main/docs/gmock_cook_book.md#knowing-when-to-expect-useoncall for details.
[       OK ] Moods.Naggy (0 ms)
[ RUN      ] Moods.Nice
[       OK ] Moods.Nice (0 ms)
[ RUN      ] Moods.Strict
unknown file: Failure
Uninteresting mock function call - returning default value.
    Function call: temperature_c()
          Returns: 0

[  FAILED  ] Moods.Strict (0 ms)
[----------] 3 tests from Moods (0 ms total)

[----------] Global test environment tear-down
[==========] 3 tests from 1 test suite ran. (0 ms total)
[  PASSED  ] 2 tests.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] Moods.Strict

 1 FAILED TEST
```

Read the three results against the three bouncers. The naggy sensor let the call through, returned $0$ (the default for a `double`), and printed a `GMOCK WARNING`; the test passed. The nice sensor did the same silently. The strict sensor failed the test. The code is identical in all three, and so is its behavior. Only the test's opinion about a call it never mentioned changed.

Sanity check: in every test the guard read $280\,\mathrm{kPa}$, which is below $300$, so it never called `set_open`. That is why the strict valve stayed quiet in all three.
:::

Notice the `NOTE` GoogleMock printed. It is good advice: do not silence the warning by adding an `EXPECT_CALL` for a call you do not actually require. An `EXPECT_CALL` is a demand. If you write `EXPECT_CALL(sensor, temperature_c())` only to hush the warning, you have made every future version of the guard *fail* if it stops reading the temperature — a thing nobody asked for. That is **[[over-specification|over-specification]]**: a test that pins down details the requirement does not care about, so it breaks whenever the code is reorganized, even when the behavior is still right.

::: warning
`NiceMock` forgives *uninteresting* calls only. It does not forgive *unexpected* ones. If a nice sensor has `EXPECT_CALL(sensor, read(2, _))` and the code calls `read(3, p)`, the test fails with "Unexpected mock function call", exactly as it would with a naggy or strict mock. Once a test has spoken about a method, every call to that method must match what it said.
:::

### Default behavior without a demand: ON_CALL

Sometimes you want a nice mock to return something more sensible than zero, without demanding the call. That is what **`ON_CALL`** is for. It sets the default action for calls to a method, and, unlike `EXPECT_CALL`, it does not make the method interesting and does not require any call to happen:

```cpp
NiceMock<MockPressureSensor> sensor;
ON_CALL(sensor, temperature_c()).WillByDefault(Return(21.5));
```

Now any call to `temperature_c` returns $21.5$ degrees Celsius, silently, however many times it happens, including zero. A useful rule of thumb: **`EXPECT_CALL` what the test requires; `ON_CALL` what it merely allows.** On a plain naggy mock, `ON_CALL` sets the return value but the warning still appears, because the call is still uninteresting.

## Which mood, when

The three moods are not a scale from sloppy to rigorous. Each is right in its place.

A **nice mock** fits a collaborator whose calls are incidental to what you are testing. The guard's health-log temperature read is a good example: a test about venting does not care whether the temperature was read, so that call should be neither demanded nor complained about. GoogleMock's own cookbook recommends nice mocks for most collaborators and strict mocks only where they earn their place.

A **naggy mock** is a reasonable setting while you are still writing a test. The warnings show you every call you did not think about, and you then decide for each one: demand it, allow it with `ON_CALL`, or question why it happens at all.

A **strict mock** fits a collaborator where the *set of calls is itself the requirement*. Actuators are the classic case. For a valve, a thruster or a pyrotechnic device, "no command unless one of these specific commands" is exactly what safety analysis asks for. A strict mock with no expectations at all is the neatest way to write "this device must not be touched in this situation".

You can mix moods in one test, as the example did: a nice sensor and a strict valve. That pairing is common in flight-logic tests. Sensors are asked questions freely; actuators are commanded only on purpose.

## A strict failure is a design signal

Here is where a strict mock earns its keep. Suppose a teammate adds one line to the bad-read path: "if the pressure read fails, close the vent, to be safe".

::: example A strict valve catches a line nobody specified
```cpp
// t_signal.cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include "mocks.hpp"

using ::testing::_;
using ::testing::NiceMock;
using ::testing::Return;
using ::testing::StrictMock;

// Somebody added "close the vent to be safe" to the bad-read path.
class TankGuardV2 {
public:
    TankGuardV2(IPressureSensor& s, IVentValve& v) : sensor_(s), valve_(v) {}
    void step() {
        double p = 0.0;
        if (!sensor_.read(2, p)) {
            valve_.set_open(0.0);                 // the new line
            return;
        }
        if (p > 300.0) valve_.set_open(std::min(1.0, (p - 300.0) / 50.0));
    }
private:
    IPressureSensor& sensor_;
    IVentValve& valve_;
};

TEST(TankGuardV2Test, BadReadCommandsNothing) {
    NiceMock<MockPressureSensor> sensor;
    StrictMock<MockVentValve> valve;           // no expectations at all
    EXPECT_CALL(sensor, read(_, _)).WillOnce(Return(false));

    TankGuardV2(sensor, valve).step();
}
```

Output:

```text
Running main() from ./googletest/src/gtest_main.cc
[==========] Running 1 test from 1 test suite.
[----------] Global test environment set-up.
[----------] 1 test from TankGuardV2Test
[ RUN      ] TankGuardV2Test.BadReadCommandsNothing
unknown file: Failure
Uninteresting mock function call - returning directly.
    Function call: set_open(0)

[  FAILED  ] TankGuardV2Test.BadReadCommandsNothing (0 ms)
[----------] 1 test from TankGuardV2Test (0 ms total)

[----------] Global test environment tear-down
[==========] 1 test from 1 test suite ran. (0 ms total)
[  PASSED  ] 0 tests.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] TankGuardV2Test.BadReadCommandsNothing

 1 FAILED TEST
```

The failure names the exact call, `set_open(0)`: the valve was commanded fully closed after a failed read. A naggy valve would have printed a warning that scrolls past in a long CI log; a nice valve would have said nothing at all. Only the strict mock turns it into a red test.
:::

The tempting reaction is "the test is too strict; switch the valve to a `NiceMock`". Resist it, and ask what the failure is telling you. There are three honest answers, and each leads somewhere different:

1. **The new line is a bug.** Nobody asked for it, so remove it. The test did its job.
2. **The behavior is wanted, and the requirement changed.** Then the test changes on purpose, with an `EXPECT_CALL(valve, set_open(0.0))`, and the change gets reviewed like any other change to a safety requirement. Here that review matters: for a vent that protects against over-pressure, closing it when you have lost your pressure reading may be the *least* [[safe choice|fail-safe]], because the tank could be climbing toward its burst pressure with the vent shut.
3. **The design is muddled.** If a strict mock needs a long list of expectations for calls unrelated to what the test is about, the class is probably doing too many jobs, or the interface is too chatty. The fix is in the code: split the class, or narrow the interface, until each test only has to talk about the calls it cares about.

In none of the three is the right answer "make the mock nicer". That is what people mean when they say a StrictMock failure is often a **[[design signal|listening-to-tests]]** rather than a test bug: the test is the first place anyone notices that the code does something nobody decided it should.

::: warning
The opposite mistake is making every mock strict "to be thorough". Then every harmless refactor, like reading the temperature once per second instead of once per step, breaks dozens of unrelated tests, and people learn to update expectations without thinking. A failure that happens for no reason teaches the team to ignore failures. Use strict mocks where the calls are the contract, and nice ones elsewhere.
:::

## Order is a separate question

A strict mock checks *which* calls happen. It says nothing about *order*. For some devices, order is the whole point. A **[[pyrotechnic|pyro]]** separation system must be armed before it is fired and disarmed afterward. Firing before arming should never pass a test.

GoogleMock checks order with **`InSequence`**. While an `InSequence` object exists, every `EXPECT_CALL` you write joins one sequence, and the calls must arrive in the order the expectations were written.

::: example A strict mock misses a wrong order; InSequence catches it
The code under test has a bug: it fires the first bolt before arming.

```cpp
// t_pyro.cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>

using ::testing::InSequence;
using ::testing::StrictMock;

class IPyro {
public:
    virtual ~IPyro() = default;
    virtual void arm() = 0;
    virtual void fire(int channel) = 0;
    virtual void disarm() = 0;
};

class MockPyro : public IPyro {
public:
    MOCK_METHOD(void, arm, (), (override));
    MOCK_METHOD(void, fire, (int channel), (override));
    MOCK_METHOD(void, disarm, (), (override));
};

// Fires the two separation bolts. (Bug: fires before arming.)
void separate_stage(IPyro& pyro) {
    pyro.fire(1);
    pyro.arm();
    pyro.fire(2);
    pyro.disarm();
}

TEST(Separation, StrictButUnordered) {
    StrictMock<MockPyro> pyro;
    EXPECT_CALL(pyro, arm());
    EXPECT_CALL(pyro, fire(1));
    EXPECT_CALL(pyro, fire(2));
    EXPECT_CALL(pyro, disarm());
    separate_stage(pyro);
}

TEST(Separation, InOrder) {
    StrictMock<MockPyro> pyro;
    InSequence seq;
    EXPECT_CALL(pyro, arm());
    EXPECT_CALL(pyro, fire(1));
    EXPECT_CALL(pyro, fire(2));
    EXPECT_CALL(pyro, disarm());
    separate_stage(pyro);
}
```

The start of the output (the rest is more failures that follow from the first):

```text
[ RUN      ] Separation.StrictButUnordered
[       OK ] Separation.StrictButUnordered (0 ms)
[ RUN      ] Separation.InOrder
unknown file: Failure

Unexpected mock function call - returning directly.
    Function call: fire(1)
Google Mock tried the following 2 expectations, but none matched:

t_pyro.cpp:44: tried expectation #0: EXPECT_CALL(pyro, fire(1))...
         Expected: all pre-requisites are satisfied
           Actual: the following immediate pre-requisites are not satisfied:
t_pyro.cpp:43: pre-requisite #0
                   (end of pre-requisites)
         Expected: to be called once
           Actual: never called - unsatisfied and active
```

and at the end:

```text
[  PASSED  ] 1 test.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] Separation.InOrder

 1 FAILED TEST
```

The strict-but-unordered test **passed**. Every call was on the list, exactly once each, so a strict mock had nothing to complain about. The sequenced test failed on the very first call: `fire(1)` arrived while its "pre-requisite", the `arm()` expectation on line 43, was still unsatisfied. Count the calls to check: four calls made, four expectations, each met once, so only order could tell the two tests apart.
:::

::: key
StrictMock and InSequence answer different questions. StrictMock: is every call one the test expected? InSequence: did the expected calls come in the written order? Use either, both, or neither.
:::

`InSequence` is an [[RAII object|insequence-scope]]: the ordering applies from where it is created to the end of its scope. Expectations written outside that scope are free to happen at any time.

## Check yourself

::: check
A test has `NiceMock<MockImu> imu;` and `EXPECT_CALL(imu, read(_, _)).Times(2);`. The code calls `read` three times and `temperature_c()` once. What does GoogleMock report?
:::

::: answer
The third `read` is an *unexpected* call: `read` is interesting (it has an expectation), and its only expectation is used up after two calls. That fails the test with "Mock function called more times than expected", even on a nice mock. The `temperature_c()` call is *uninteresting* (no expectation mentions it), and a nice mock lets it through silently, returning $0$. So the test fails, for the third `read` only.
:::

::: check
In your own words, what is the difference between an uninteresting call and an unexpected call?
:::

::: answer
An uninteresting call is to a method the test never mentioned with `EXPECT_CALL`; the test has no opinion, so the mock's mood decides what happens (allow silently, allow with a warning, or fail). An unexpected call is to a method the test *did* mention, but no expectation accepts this particular call: wrong arguments, or the expected count is already used up. The test has an opinion and the call contradicts it, so it fails whatever the mood.
:::

::: check
You are testing a reaction-control thruster manager. When the attitude error is inside the deadband, no thruster may fire. The manager also asks the propellant gauge for the tank level every cycle, for telemetry. Which mocks should be nice and which strict, and what expectations does the "inside the deadband" test need?
:::

::: answer
Make the thruster mock a `StrictMock` and give it no expectations in this test: any thruster command, of any kind, then fails the test, which is exactly the requirement "no thruster may fire". Make the propellant gauge a `NiceMock`, because the telemetry read is incidental to this test; use `ON_CALL(gauge, level()).WillByDefault(Return(…))` if the code needs a sensible value. Demanding the gauge read with `EXPECT_CALL` would be over-specification: a later change to read it less often would break a test about thrusters.
:::

::: check
A teammate's test fails with "Uninteresting mock function call - returning directly. Function call: command_gimbal(0, 0)" on a `StrictMock` gimbal, in a test about what happens after an engine-out. They propose switching to `NiceMock`. What should happen instead?
:::

::: answer
First decide what the call means. The code sent a gimbal command, centering the engine, in a situation where the test's author assumed it would send none. Either that is a bug (remove the call), or it is intended behavior (then it becomes a requirement: add an `EXPECT_CALL(gimbal, command_gimbal(0, 0))` and have the engine-out logic reviewed, since centering a gimbal after an engine failure is a real design decision), or it shows the class mixes jobs so that unrelated commands leak into this path (refactor). Switching to `NiceMock` would hide the call and answer none of those questions.
:::

::: check
Write the expectations for a valve that must be commanded to $0.5$, then to $1.0$, in that order, and nothing else.
:::

::: answer
```cpp
StrictMock<MockVentValve> valve;
{
    InSequence seq;
    EXPECT_CALL(valve, set_open(DoubleNear(0.5, 1e-9)));
    EXPECT_CALL(valve, set_open(DoubleNear(1.0, 1e-9)));
}
```

`StrictMock` makes any other valve method a failure. Each expectation has no `Times` and no action, so each means exactly one call. `InSequence` makes the $1.0$ command fail if it comes before the $0.5$ one. Any third call to `set_open` is also a failure: it matches no expectation that still has room, so it is unexpected. The braces end the `InSequence` scope once the two expectations are written, which is allowed; the order still applies when the code runs later.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Interesting method | the test wrote at least one `EXPECT_CALL` for it |
| Uninteresting call | a call to a method with no `EXPECT_CALL`: what happens depends on the mock's mood |
| Unexpected call | a call to an interesting method that no expectation accepts: always a failure |
| Naggy (default) | uninteresting call allowed, warning printed |
| `NiceMock<M>` | uninteresting call allowed silently |
| `StrictMock<M>` | uninteresting call fails the test |
| `ON_CALL(…).WillByDefault(…)` | sets a default action without demanding the call |
| `InSequence seq;` | expectations written in its scope must be met in order; separate from strictness |
| Design signal | a strict failure asks: bug, changed requirement, or muddled design? |

The next lesson, *gtest_discover_tests, CTest registration, test filters and labels*, takes all these test cases out of the terminal and into CTest and CI, where each one is reported, filtered and labeled by name; it also looks at Catch2, the main alternative to GoogleTest, and what it trades.

::: context wrapper-template Wrapping instead of rewriting
`NiceMock<MockPressureSensor>` is a class that inherits from your mock class and, in its constructor, tells GoogleMock how to treat uninteresting calls on this object. That is why you never edit `MockPressureSensor` to change its mood: the same mock class serves every test, and each test picks a mood by the type of its variable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="180" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">an uninteresting call arrives</text>
  <rect x="10" y="34" width="105" height="40" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="62" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">NiceMock</text>
  <rect x="127" y="34" width="105" height="40" rx="6" fill="#ffffff" stroke="#f2b880" stroke-width="2"/>
  <text x="180" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">naggy (plain)</text>
  <rect x="244" y="34" width="105" height="40" rx="6" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <text x="296" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">StrictMock</text>
  <text x="62" y="100" font-size="12" text-anchor="middle" fill="#1d6fd1">allowed</text>
  <text x="62" y="116" font-size="12" text-anchor="middle" fill="#1d6fd1">silent</text>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">allowed</text>
  <text x="180" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">warning printed</text>
  <text x="296" y="100" font-size="12" text-anchor="middle" fill="#b4232c">test fails</text>
  <line x1="10" y1="136" x2="349" y2="136" stroke="#6c7a93" stroke-width="1"/>
  <text x="180" y="158" font-size="11" text-anchor="middle" fill="#6c7a93">an unexpected call fails under all three</text>
</svg>
```
:::

::: context over-specification Tests that know too much
Imagine a driving test that fails you for adjusting the mirror before the seat instead of after. You drove safely, but the test cared about a detail that does not matter. Over-specified tests do that to code. Each needless `EXPECT_CALL`, exact count or exact order ties the test to how the code works today rather than to what it must achieve. The cost shows up later: a teammate makes a harmless change, twenty tests go red, and fixing them teaches everyone that red tests are noise. Specify what the requirement says, and allow the rest.
:::

::: context fail-safe Safe depends on the device
"Fail-safe" means that when something goes wrong, the system falls into its least dangerous state. Which state that is depends entirely on the device. For a main engine valve, closed is usually safe: no propellant flows. For a relief or vent valve that protects a tank from bursting, open is usually safe, which is why many relief valves are built to open on their own, with a spring, when pressure passes a set point or power is lost. So "close it to be safe" can be exactly backwards. Deciding the safe state is a system-level decision, recorded in the requirements, not a line one programmer adds on a hunch.
:::

::: context listening-to-tests When the test is hard, look at the code
A test is the first code that uses your class from the outside. If writing it is painful — a long list of expectations, mocks for things the test does not care about, calls you cannot explain — the pain usually comes from the design, not the test. Steve Freeman and Nat Pryce's book *Growing Object-Oriented Software, Guided by Tests* calls this "listening to the tests", and gives it a whole chapter. Strict mocks make the design louder: every call the class makes has to be accounted for, so a class that does five jobs shows it at once.
:::

::: context pyro Explosives that must be asked twice
Rockets use small explosive devices, called pyrotechnics or pyros, for jobs that must happen fast and exactly once: cutting separation bolts between stages, releasing fairings, firing some igniters. Because an accidental firing can destroy the vehicle or hurt people on the ground, the firing circuit has several independent switches in a row, often called inhibits. "Arm" closes one; "fire" closes the last. Both must be closed for current to reach the device.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="60" height="36" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="40" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">power</text>
  <line x1="70" y1="58" x2="110" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="112" cy="58" r="3" fill="#1f2a44"/>
  <line x1="112" y1="58" x2="148" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="152" cy="58" r="3" fill="#1f2a44"/>
  <text x="132" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">arm</text>
  <line x1="152" y1="58" x2="192" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="194" cy="58" r="3" fill="#1f2a44"/>
  <line x1="194" y1="58" x2="230" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="234" cy="58" r="3" fill="#1f2a44"/>
  <text x="214" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">fire</text>
  <line x1="234" y1="58" x2="272" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <rect x="272" y="40" width="78" height="36" rx="5" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="311" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">pyro bolt</text>
  <text x="180" y="18" font-size="11" text-anchor="middle" fill="#6c7a93">both switches open: no current can flow</text>
</svg>
```

Software mirrors that chain, which is why the order of `arm` and `fire` is a tested requirement.
:::

::: context insequence-scope Ordering that switches off by itself
You met RAII in the C++ basics: an object that does something when it is created and undoes it when it is destroyed. `InSequence` works that way. Its constructor tells GoogleMock "from now on, new expectations join one chain"; its destructor, at the closing brace, ends the chain. For partial orders, such as "arm before either fire, but the two fires in any order", GoogleMock has named `Sequence` objects and an `.After(…)` clause, which let one expectation belong to several chains.
:::
