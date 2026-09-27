---
id: l06-dependency-injection
title: Dependency injection — opening a seam for the test
minutes: 20
covers:
  - Dependency injection as the precondition for mockability
---

Think about two lamps. One has a cord and a plug. The other was wired straight into the wall by the builder. Both give light. Now suppose you want to check the lamp on a bench — does it work at low voltage, does the switch really cut the power? The first lamp you unplug and plug into a test box. The second you cannot test at all without tearing into the wall.

Code has the same two shapes. A flight-software class that needs a sensor can either *be handed* the sensor from outside, or *build its own* sensor driver inside itself. The second shape is the lamp wired into the wall. It works on the vehicle. But on your laptop, where there is no sensor, it cannot be tested — and even on the vehicle you cannot make the sensor fail on demand to see what the code does.

This lesson is about the plug. **Dependency injection** means giving an object the things it depends on from outside, instead of letting it create them. It sounds like a small change of style. It is actually the step that makes everything in the next three lessons possible: the pretend sensors, the mocks, the fault tests. No plug, no test box.

## A class that builds its own hardware

Here is a real job. A small sounding rocket carries a **[[barometer|apogee-detection]]** — a pressure sensor. As the rocket climbs, the air pressure falls; after the top of the flight, called **apogee**, it rises again. The flight computer turns pressure into altitude and fires the parachute charge when the rocket has fallen a safe margin below its highest point. Our detector declares apogee once the altitude drops more than $10\,\mathrm{m}$ below the peak, so a single noisy reading is not mistaken for the start of the fall.

A first version, written the way code often starts:

```cpp
class ApogeeDetector {
public:
    ApogeeDetector() : baro_("/dev/i2c-1", 0x76) {}   // builds its own driver

    void update() {
        const std::optional<double> p = baro_.read_pressure_pa();
        // ... same logic as before ...
    }

private:
    BaroDriver baro_;   // a concrete chip on a concrete bus
};
```

`BaroDriver` is the code that talks to one particular pressure chip at address `0x76` on the **[[I2C bus|i2c]]** named `/dev/i2c-1`. The detector's constructor builds that driver itself. Nobody outside can choose anything.

Now try to test it. On a laptop there is no `/dev/i2c-1`, so the driver fails to open, and every read fails. On the flight computer the chip is real, but it reports the pressure of the room you are sitting in, which never changes. To test apogee detection you need pressures that fall and then rise. To test fault handling you need a read that fails at exactly the moment you choose. The detector's design gives you no way to supply either.

The problem is not the logic inside `update()`. It is that the class has decided, all by itself, which barometer it talks to. There is nowhere to plug anything else in.

## Seams: a place to plug something in

Michael Feathers, in *Working Effectively with Legacy Code*, gave that "somewhere" a name. A **[[seam|seam-word]]** is a place where you can change what a program does without editing the code at that place. Every seam has an **enabling point**: the spot, somewhere else, where you choose which behavior you get.

In the lamp picture, the plug is the seam and the wall socket you choose is the enabling point. In C++ there are several kinds of seam.

- An **object seam**: the class calls its dependency through a base class with virtual functions, and whoever constructs the class chooses which derived object to pass in. The constructor call is the enabling point.
- A **template seam**: the dependency's type is a template parameter. The enabling point is where the template is used, `ApogeeDetectorT<SomeBaro>`.
- A **link seam**: the build links a different `.cpp` file that defines the same functions. The enabling point is the build script. It works, but it is coarse — one choice for the whole test program.
- A **preprocessor seam**: `#ifdef` switches code on or off. The enabling point is a compiler flag. Of the four, this is the one to avoid, for reasons the last section explains.

**Dependency injection** is the everyday way to build the first two. The class states what it needs, and something outside hands it over.

## Constructor injection of an interface

Start by writing down what the detector actually needs from a barometer. Not "the pressure chip at address 0x76 on bus 1". Only "something I can ask for a pressure, which might fail". That is an **interface**: a class with nothing but pure **[[virtual functions|vtable]]**, which says what can be done and nothing about how.

```cpp
class IBarometer {
public:
    virtual ~IBarometer() = default;
    // Static pressure in pascals, or no value if the read failed.
    virtual std::optional<double> read_pressure_pa() = 0;
};
```

The return type is a `std::optional<double>`, an [[optional value|optional]]: a box that either holds a `double` or is empty. An empty box is how the sensor says "the read failed". The `I` at the front of `IBarometer` is a common naming habit for interfaces. The `= 0` makes the function **pure virtual**: the interface has no code for it, and every real barometer class must supply its own.

Then the detector takes an `IBarometer&` — a reference to *some* barometer — in its constructor and keeps it:

```cpp
class ApogeeDetector {
public:
    explicit ApogeeDetector(IBarometer& baro) : baro_(baro) {}

    // Called once per control cycle.
    void update() {
        const std::optional<double> p = baro_.read_pressure_pa();
        if (!p) {                 // failed read: say so, decide nothing
            fault_ = true;
            return;
        }
        fault_ = false;
        const double h = pressure_altitude_m(*p);
        if (h > max_h_) max_h_ = h;
        if (max_h_ - h > kDropM) apogee_ = true;
    }

    bool apogee() const { return apogee_; }
    bool sensor_fault() const { return fault_; }

private:
    static constexpr double kDropM = 10.0;  // must fall this far below the peak
    IBarometer& baro_;
    double max_h_ = -1.0e9;
    bool apogee_ = false;
    bool fault_ = false;
};
```

The logic did not change. What changed is who decides. On the flight computer, the real driver class inherits from `IBarometer`, and `main` connects the two:

```cpp
int main() {
    BaroDriver baro("/dev/i2c-1", 0x76);   // the real chip
    ApogeeDetector det(baro);              // handed in, not built inside
    // ... run the control loop, calling det.update() each cycle ...
}
```

That spot in `main`, where real objects are created and connected, is the [[enabling point for flight|composition-root]]. The test program is another enabling point, and it connects something else.

::: key
Why is dependency injection a precondition for mocking? If the class constructs its own concrete driver there is no seam to substitute. Taking the dependency as an interface reference or template parameter is what makes the test double possible, and usually improves the design anyway.
:::

::: warning A reference must not outlive the thing it refers to
The detector stores a reference, so the barometer must live at least as long as the detector. In `main` above, `baro` is declared first, so it is destroyed last — correct. Declaring them the other way round, or handing the detector a barometer that lives inside a function that has already returned, leaves a **dangling reference**, the same bug as the memory module's dangling pointer. Passing a temporary like `ApogeeDetector det(FakeBarometer{})` does not even compile, because a non-const reference cannot bind to a temporary — which is the language protecting you. When the detector should *own* its barometer, take a `std::unique_ptr<IBarometer>` instead.
:::

## A hand-written fake

Before reaching for GoogleMock in the next lesson, write a pretend barometer yourself. It shows exactly what a mocking library automates. Pretend objects used in tests have a family name: **[[test doubles|test-double]]**. This one is a **fake** — a working, simplified implementation. It plays back a script of readings instead of reading a chip, and it counts how often it was asked.

```cpp
class FakeBarometer : public IBarometer {
public:
    std::deque<std::optional<double>> script;
    int reads = 0;

    std::optional<double> read_pressure_pa() override {
        ++reads;
        if (script.empty()) return std::nullopt;
        const std::optional<double> next = script.front();
        script.pop_front();
        return next;
    }

    // Test helper: queue the pressure you would feel at altitude h.
    void queue_altitude(double h_m) {
        script.push_back(101325.0 * std::pow(1.0 - h_m / 44330.77, 1.0 / 0.190263));
    }
};
```

`std::deque` is a queue you can pop from the front. `std::nullopt` is the empty `optional`: a failed read. The helper `queue_altitude` turns an altitude into the pressure the standard atmosphere gives at that height, so the tests can be written in meters, which people read more easily than pascals. The detector converts back with the inverse formula:

$$
h = 44330.77 \left(1 - \left(\frac{p}{101325}\right)^{0.190263}\right)\ \mathrm{m}.
$$

At sea level, $p = 101325\,\mathrm{Pa}$, the bracket is $1 - 1 = 0$, so $h = 0$. At $1000\,\mathrm{m}$ the pressure is about $89875\,\mathrm{Pa}$, roughly $11\%$ lower, which is why a barometer makes a decent altimeter.

::: example Driving the detector through a flight and a fault
Two tests, both impossible with the hard-wired class:

```cpp
TEST(ApogeeDetector, FiresAfterTenMeterDropFromPeak) {
    FakeBarometer baro;
    for (double h : {100.0, 500.0, 900.0, 1000.0, 995.0, 985.0}) baro.queue_altitude(h);
    ApogeeDetector det(baro);

    for (int i = 0; i < 5; ++i) det.update();
    EXPECT_FALSE(det.apogee()) << "a 5 m dip is noise, not apogee";

    det.update();  // 985 m: 15 m below the 1000 m peak
    EXPECT_TRUE(det.apogee());
    EXPECT_EQ(baro.reads, 6);
}

TEST(ApogeeDetector, FailedReadRaisesFaultAndNeverFires) {
    FakeBarometer baro;
    baro.queue_altitude(1000.0);
    baro.script.push_back(std::nullopt);  // the bus glitches once
    baro.queue_altitude(1005.0);          // still climbing
    ApogeeDetector det(baro);

    det.update();
    det.update();
    EXPECT_TRUE(det.sensor_fault());
    det.update();
    EXPECT_FALSE(det.sensor_fault());
    EXPECT_FALSE(det.apogee()) << "a glitch must never look like a descent";
}
```

Both pass. Follow the first one step by step. The peak is $1000\,\mathrm{m}$ after four updates. The fifth reading, $995\,\mathrm{m}$, is only $1000 - 995 = 5\,\mathrm{m}$ below the peak, which is less than $10$, so no apogee yet. The sixth, $985\,\mathrm{m}$, is $15\,\mathrm{m}$ below, which is more than $10$, so apogee is declared. The fake also confirms the detector read the sensor exactly six times, once per update.

Now watch the second test catch a real bug. Suppose someone "simplifies" the start of `update()` to

```cpp
        const double p = baro_.read_pressure_pa().value_or(0.0);
        const double h = pressure_altitude_m(p);
```

`value_or(0.0)` means "the value if there is one, otherwise $0$". It compiles without a warning. The test says:

```text
[ RUN      ] ApogeeDetector.FailedReadRaisesFaultAndNeverFires
apogee_bug.cpp:85: Failure
Value of: det.sensor_fault()
  Actual: false
Expected: true

apogee_bug.cpp:88: Failure
Value of: det.apogee()
  Actual: true
Expected: false
a glitch must never look like a descent

[  FAILED  ] ApogeeDetector.FailedReadRaisesFaultAndNeverFires (0 ms)
```

Why did the parachute fire while the rocket was still climbing? A pressure of $0\,\mathrm{Pa}$ is outer space. Put $p = 0$ into the formula and the bracket becomes $1 - 0 = 1$, so $h = 44330.77\,\mathrm{m}$. For one cycle the detector believed the rocket had leapt to over $44\,\mathrm{km}$. The next true reading, $1005\,\mathrm{m}$, was then more than $43\,\mathrm{km}$ "below the peak", far more than $10\,\mathrm{m}$, so it declared apogee. On a real flight that is a parachute opening at full speed on the way up. The fake made the glitch happen on the exact cycle we chose, every time the test runs.
:::

Notice what the fake did *not* need: no hardware, no special build, no change to `ApogeeDetector`. The flight build and the test build compile the very same class. Only the object handed to the constructor differs.

## Template-parameter injection

A virtual call goes through a small table of function addresses, which costs a few nanoseconds and stops the compiler from **inlining** the call (pasting the function's body in place of the call). In a $100\,\mathrm{Hz}$ loop that is nothing. In an inner loop running millions of times per second, or on a small processor, a team may prefer to pick the dependency when compiling instead.

That is **template-parameter injection**: make the dependency's *type* a template parameter. Nothing needs a base class or `virtual`. A C++20 **[[concept|concept]]** can state what any barometer type must provide, so a wrong type is rejected with a clear message.

::: example The same detector, chosen at compile time
```cpp
#include <gtest/gtest.h>
#include <cmath>
#include <concepts>
#include <deque>
#include <optional>

double pressure_altitude_m(double p_pa) {
    return 44330.77 * (1.0 - std::pow(p_pa / 101325.0, 0.190263));
}

// What any barometer type must provide. No base class, no virtual.
template <typename B>
concept Barometer = requires(B b) {
    { b.read_pressure_pa() } -> std::same_as<std::optional<double>>;
};

template <Barometer Baro>
class ApogeeDetectorT {
public:
    explicit ApogeeDetectorT(Baro& baro) : baro_(baro) {}
    void update() {
        const std::optional<double> p = baro_.read_pressure_pa();
        if (!p) { fault_ = true; return; }
        fault_ = false;
        const double h = pressure_altitude_m(*p);
        if (h > max_h_) max_h_ = h;
        if (max_h_ - h > 10.0) apogee_ = true;
    }
    bool apogee() const { return apogee_; }
    bool sensor_fault() const { return fault_; }
private:
    Baro& baro_;
    double max_h_ = -1.0e9;
    bool apogee_ = false;
    bool fault_ = false;
};

// The fake needs no base class now; it only has to fit the concept.
struct ScriptedBaro {
    std::deque<std::optional<double>> script;
    std::optional<double> read_pressure_pa() {
        if (script.empty()) return std::nullopt;
        auto next = script.front();
        script.pop_front();
        return next;
    }
};

TEST(ApogeeDetectorT, EmptyScriptMeansFault) {
    ScriptedBaro baro;
    ApogeeDetectorT<ScriptedBaro> det(baro);
    det.update();
    EXPECT_TRUE(det.sensor_fault());
    EXPECT_FALSE(det.apogee());
}
```

It passes: `[  PASSED  ] 1 test.` The flight build writes `ApogeeDetectorT<BaroDriver>`, the test writes `ApogeeDetectorT<ScriptedBaro>`, and each is a separate class compiled for its own barometer, with no virtual call.

Now hand it a type whose `read_pressure_pa` returns a plain `double`, with no way to report a failed read:

```cpp
struct WrongBaro { double read_pressure_pa() { return 101325.0; } };
void f() { WrongBaro w; ApogeeDetectorT<WrongBaro> d(w); }
```

The compiler refuses, and says why:

```text
tmpl_bad.cpp:3:50: error: template constraint failure for 'template<class Baro>  requires  Barometer<Baro> class ApogeeDetectorT'
```

The concept turned a design rule — "a barometer must be able to say it failed" — into something the compiler checks.
:::

Template injection has costs. The class now lives in a header, because a template's code must be visible wherever it is used. Every file that uses it recompiles when it changes. The barometer's type becomes part of the detector's type, so an `ApogeeDetectorT<BaroDriver>` and an `ApogeeDetectorT<ScriptedBaro>` cannot be stored in the same variable. And GoogleMock works with both styles, but mocking without virtual functions takes a little more setup. A common rule of thumb: use an interface by default, and switch to a template parameter where a profiler (a tool that measures where the running time goes) shows the virtual call matters or where the target has no room for it.

::: key
Two ways to inject: constructor injection of an interface reference (`explicit ApogeeDetector(IBarometer& baro)`, chosen at run time, one virtual call per use) and template-parameter injection (`template <Barometer Baro> class ApogeeDetectorT`, chosen at compile time, no virtual call, class lives in a header). Either one creates the seam; a hand-written fake or a GoogleMock mock then plugs into it.
:::

## Why not an #ifdef

There is a tempting shortcut that avoids all of this. Leave the class building its own driver, and switch the reading off in test builds:

```cpp
class ApogeeDetector2 {
public:
    void update() {
#ifdef UNIT_TEST
        const std::optional<double> p = test_pressure;   // test build
#else
        const std::optional<double> p = baro_.read_pressure_pa();   // flight build
#endif
        // ... same logic ...
        (void)p;
    }
#ifdef UNIT_TEST
    std::optional<double> test_pressure;
#endif
private:
    BaroDriver baro_{"/dev/i2c-1", 0x76};
};
```

It compiles both ways. It is still the wrong fix, for four reasons.

- **You no longer test what you ship.** The test binary is compiled from different source text than the flight binary. The line that reads the real sensor — the one that matters in flight — is never compiled in the tests, let alone run. A test that passes says something about a program that will never fly.
- **The class is harder to read.** Every reader has to run the preprocessor in their head, twice, to know what the code does.
- **It spreads.** One `#ifdef` becomes ten. Soon there are test-only members, like `test_pressure` above, and different memory layouts in the two builds.
- **It does not scale to faults.** Each new failure you want to simulate needs another test-only branch in production code.

Injection has none of these problems. The flight binary and the test binary contain the same `ApogeeDetector`, compiled from the same text. The only difference lives outside the class, at the enabling point. That is why reviewers treat "just add an `#ifdef` for the test" as a design smell: the class is telling you it needs a seam.

::: warning Hidden dependencies count too
A dependency is anything the class reaches out and grabs for itself, not only hardware. A call to the system clock, a global configuration object, a singleton logger or a file path all tie the class to one fixed world. A detector that times its decisions with the wall clock cannot be tested for "what happens after 3 seconds" without waiting 3 seconds. Inject a clock interface the same way you inject the barometer, and the test can move time forward instantly.
:::

The payoff comes in the next lesson. Our fake was about twenty lines, and it could only play back a script and count reads. Checking *which* calls happened, with *what* arguments and in *what* order, would mean writing much more by hand. GoogleMock generates that machinery from one line per method. But it can only plug into a seam that already exists. Injection comes first.

## Check yourself

::: check
A `ThermalController` class creates its own `HeaterDriver` with `new HeaterDriver(7)` in its constructor, where `7` is the heater's output pin. Describe the smallest change that lets a test replace the heater, and what the flight `main` looks like afterwards.
:::

::: answer
Define an interface for what the controller needs, for example

```cpp
class IHeater {
public:
    virtual ~IHeater() = default;
    virtual void set_on(bool on) = 0;
};
```

make `HeaterDriver` inherit from it, and give `ThermalController` a constructor `explicit ThermalController(IHeater& heater)` that stores the reference instead of calling `new`. The flight `main` then creates the real driver and hands it over:

```cpp
HeaterDriver heater(7);
ThermalController ctl(heater);
```

A test creates a fake heater that records every `set_on` call and passes that in. (As a bonus, the raw `new` is gone, so there is no longer a leak to worry about.)
:::

::: check
In the `value_or(0.0)` bug, the parachute fired while the rocket was climbing. Using the pressure-altitude formula, explain why a failed read that returned the sea-level pressure $101325\,\mathrm{Pa}$ instead of $0$ would also be dangerous, and in which part of the flight.
:::

::: answer
A reading of $101325\,\mathrm{Pa}$ gives $h = 44330.77 \times (1 - 1^{0.190263}) = 0\,\mathrm{m}$. During the climb, the peak so far is some altitude like $1000\,\mathrm{m}$, and a single reading of $0\,\mathrm{m}$ is $1000\,\mathrm{m}$ below it — far more than $10\,\mathrm{m}$. So the detector would declare apogee on the way up, at the first glitch after the rocket passed $10\,\mathrm{m}$. Any fixed stand-in value is wrong for some part of the flight. The only safe response to a failed read is to say "no data" and decide nothing, which is what the `optional` check does.
:::

::: check
Name the four kinds of seam from the lesson. For each, say where its enabling point is.
:::

::: answer
- Object seam: a virtual interface. Enabling point: the place that constructs the class and passes in a particular object (flight `main`, or the test).
- Template seam: a template parameter. Enabling point: where the template is named with a type, like `ApogeeDetectorT<ScriptedBaro>`.
- Link seam: a different `.cpp` file defining the same functions. Enabling point: the build script that chooses which file to link.
- Preprocessor seam: `#ifdef`. Enabling point: a compiler flag such as `-DUNIT_TEST`. This is the one to avoid, because the tested program is compiled from different text than the shipped one.
:::

::: check
A reviewer rejects this code: `ApogeeDetector* make_detector() { FakeBarometer fake; return new ApogeeDetector(fake); }`. What is wrong, and why did the compiler not stop it?
:::

::: answer
`fake` is a local variable, destroyed when `make_detector` returns. The detector keeps a reference to it, so every later `update()` calls a function on an object that no longer exists — a dangling reference, which is undefined behavior. The compiler accepted it because `fake` is a named variable (an lvalue), and a non-const reference may bind to one; the compiler does not track how long the detector will live. The fix is to make the barometer outlive the detector, for example by creating both in the same scope with the barometer first, or to have the detector own its barometer through a `std::unique_ptr<IBarometer>`.
:::

::: check
Your team's inner-loop sensor filter runs at $10\,\mathrm{kHz}$ on a small processor, and a profile shows the virtual call to its `ISensor` taking a noticeable share of the time. What injection style would you switch to, and what do you give up?
:::

::: answer
Switch to template-parameter injection: `template <SensorLike S> class Filter { S& sensor_; ... };`, with a concept stating what a sensor type must provide. The call is then resolved at compile time and can be inlined, so the virtual-call cost disappears. You give up: the class must live in a header; every user recompiles when it changes; `Filter<RealSensor>` and `Filter<FakeSensor>` are different types that cannot share a variable; and error messages involve templates. The seam still exists, so tests still work — the test instantiates `Filter<FakeSensor>`.
:::

## Summary

| Idea | Meaning | In code |
|---|---|---|
| Dependency | Anything a class needs from outside itself | a driver, a clock, a logger |
| Dependency injection | Hand the dependency in, don't build it inside | constructor parameter |
| Seam | Where behavior can change without editing that code | interface, template parameter, link, `#ifdef` |
| Enabling point | Where you choose what fills the seam | flight `main`, the test |
| Interface | Pure virtual functions only | `class IBarometer { virtual ... = 0; };` |
| Constructor injection | Interface reference, chosen at run time | `explicit ApogeeDetector(IBarometer&)` |
| Template injection | Type chosen at compile time, no virtual call | `template <Barometer Baro> class ApogeeDetectorT` |
| Fake | A hand-written, simplified working implementation | `FakeBarometer` with a script |
| `#ifdef TEST` | A seam that changes what you compile | avoid: you no longer test what you ship |

The next lesson, "GoogleMock, a pretend sensor that does what you say", replaces the hand-written fake with a generated mock of an `ISensor` or HAL interface. It uses `EXPECT_CALL` to state which calls must happen, how many times and with what arguments, and it scripts nominal, degraded and failed readings in a line each.

::: context apogee-detection How small rockets know when to open the chute
Hobby and university rockets very often use a barometric altimeter to fire the parachute charge. The logic is close to our detector: track the highest altitude seen, and act once the reading has fallen a margin below it. Real units add a short delay, filter the readings, and ignore the first seconds of flight, when the rocket's motion can briefly disturb the pressure the sensor feels. The margin matters: too small and noise fires the charge early; too large and the rocket is already falling fast when the chute opens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="150" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="165" font-size="11" fill="#1f2a44">time</text>
  <text x="36" y="22" font-size="11" fill="#1f2a44">altitude</text>
  <path d="M 30 150 Q 110 10 190 40 Q 250 62 320 140" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="120" y1="40" x2="300" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="120" y1="56" x2="300" y2="56" stroke="#b4232c" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="304" y="44" font-size="11" fill="#6c7a93">peak</text>
  <text x="304" y="60" font-size="11" fill="#b4232c">peak - 10 m</text>
  <circle cx="220" cy="56" r="5" fill="#b4232c"/>
  <text x="200" y="80" font-size="11" fill="#b4232c">fire</text>
</svg>
```
:::

::: context i2c Two wires, many chips
I2C (said "I-squared-C" or "I-two-C") is a simple bus for connecting small chips to a processor using two wires: one for data, one for a clock. Many chips can share the same two wires; each has a 7-bit address, such as `0x76`, so the processor can say which chip it is talking to. Pressure sensors, temperature sensors and small memories on flight computers and drones often sit on I2C. On Linux, a bus appears as a file such as `/dev/i2c-1`.
:::

::: context seam-word Borrowed from sewing
In clothing, a seam is where two pieces of fabric are stitched together. It is also where a tailor can open the garment and change it without cutting the cloth. Feathers chose the word because a software seam is the same kind of place: a joint in the program where one piece can be swapped for another without editing either piece. His book, first published in 2004, is still the standard guide to adding seams to code that was never designed for tests.
:::

::: context vtable How a virtual call finds its code
When a class has virtual functions, each object carries a hidden pointer to a small table, often called the vtable, holding the addresses of that class's versions of the functions. Calling `baro_.read_pressure_pa()` through an `IBarometer&` means: follow the object's pointer to its table, load the address in the right slot, jump there. A `BaroDriver` and a `FakeBarometer` have different tables, so the same line of code reaches different functions. That extra hop is the "few nanoseconds" a virtual call costs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="20" width="110" height="50" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">FakeBarometer</text>
  <text x="70" y="58" font-size="11" fill="#6c7a93" text-anchor="middle">vtable pointer</text>
  <line x1="125" y1="54" x2="170" y2="54" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="170" y="30" width="80" height="48" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="210" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">~dtor</text>
  <text x="210" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">read_...</text>
  <line x1="250" y1="64" x2="280" y2="64" stroke="#1d6fd1" stroke-width="2"/>
  <text x="284" y="68" font-size="11" fill="#1f2a44">fake code</text>
  <text x="15" y="120" font-size="11" fill="#1f2a44">object</text>
  <text x="170" y="120" font-size="11" fill="#1f2a44">table for its class</text>
  <text x="284" y="120" font-size="11" fill="#1f2a44">function</text>
</svg>
```
:::

::: context optional A box that may be empty
`std::optional<T>` (C++17) holds either a `T` or nothing. `if (!p)` asks "is the box empty?", and `*p` takes the value out of a full box. Compared with returning a magic number like $-1$ or $0$ for "failed", an `optional` makes the failure impossible to mistake for a real value — unless someone writes `value_or(0.0)`, which turns the box back into a magic number, as the example shows.
:::

::: context composition-root One place that wires everything
Many teams keep every "which real object goes where" decision in one spot near the start of the program, often called the composition root. The classes below it only ever see interfaces. A test is a second, tiny composition root: it builds the same detector and plugs a fake into it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">flight main</text>
  <text x="270" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">test</text>
  <rect x="30" y="32" width="120" height="34" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="54" font-size="12" fill="#1f2a44" text-anchor="middle">BaroDriver</text>
  <rect x="210" y="32" width="120" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="54" font-size="12" fill="#1f2a44" text-anchor="middle">FakeBarometer</text>
  <line x1="90" y1="66" x2="170" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="270" y1="66" x2="190" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="110" y="112" width="140" height="34" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="134" font-size="12" fill="#1f2a44" text-anchor="middle">ApogeeDetector</text>
  <text x="180" y="163" font-size="11" fill="#6c7a93" text-anchor="middle">same class, same code, sees only IBarometer</text>
</svg>
```
:::

::: context test-double Stunt doubles for code
Gerard Meszaros, in *xUnit Test Patterns* (2007), used "test double" as the umbrella name, after the stunt double who stands in for an actor. His kinds include the **dummy** (passed in but never used), the **stub** (returns canned answers), the **fake** (a real but simplified implementation), the **spy** (records how it was called) and the **mock** (is told in advance which calls to expect, and fails the test if they do not happen). Our `FakeBarometer` is a fake with a little spy in it: it counts reads. GoogleMock builds mocks, and the next lesson shows the difference.
:::

::: context concept Rules for template arguments
A C++20 concept is a named, compile-time test on types. `Barometer<B>` is true when a `B` has a `read_pressure_pa()` returning exactly `std::optional<double>`. Writing `template <Barometer Baro>` makes the compiler check it at the point of use and report "template constraint failure" there, instead of failing deep inside the class with a long, confusing message.
:::
