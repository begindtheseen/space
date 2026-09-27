---
id: l07-fault-detection-isolation-and-recovery
title: Fault detection, isolation and recovery
minutes: 21
covers:
  - Fault detection, isolation and recovery; safe modes
---

Think about the last time you got sick. First you **noticed** something was wrong: a sore throat, a fever. Then you worked out **what** was wrong: it is my throat, not my stomach. Then you **did something** about it: drank tea, took medicine, stayed home. And if it got bad enough, you stopped doing everything else, went to bed, and called a doctor. You did not try to finish your homework with a fever of 39 °C. You got yourself into a simple, safe state and waited for help.

A spacecraft has to do the same thing on its own. Nobody is watching it all the time. A satellite in low Earth orbit may talk to a ground station for ten minutes out of every ninety. A Mars orbiter is so far away that a message takes many minutes to arrive — the **[[one-way light time|light-time]]**. When a gyro starts lying or a thruster valve sticks, the flight software is the only one there. It has to notice, figure out which part is bad, and fix or work around it, in seconds, with no human in the loop.

That job has a name: **[[fault detection, isolation and recovery|fdir-name]]**, or **FDIR** for short. **Detection** is noticing that something is wrong. **Isolation** is working out which part is wrong. **Recovery** is putting the vehicle back into a working state. When recovery on board runs out of ideas, the last step is a **safe mode**: a simple, well-tested state that keeps the spacecraft alive until engineers on the ground can look. This lesson builds each piece in C++, the way flight code does it.

## Detection: noticing that something is wrong

A **fault** is something broken: a dead sensor, a stuck valve, a flipped bit. A **failure** is what the vehicle does wrong because of it: pointing the wrong way, losing power. FDIR tries to catch faults before they become failures.

Flight software catches faults with **monitors**. A monitor is a small piece of code that runs every frame and checks one thing. There are a few kinds you meet again and again:

- **Limit checks.** Is the value inside the range it can physically have? A battery voltage of 45 V on a 28 V bus is wrong. A gyro reading of 10 rad/s on a gyro that can only measure 5 is wrong.
- **Cross-checks.** Do two things that should agree actually agree? Two gyros on the same axis should read nearly the same rate.
- **Rate checks.** Is the value changing faster than physics allows? A tank temperature cannot jump 50 K in one millisecond.
- **Heartbeats.** Did a task report in on time? Lesson 06 built these.
- **Assertions.** Is something true that the code itself relies on? We come back to these at the end.

### One bad sample is not a fault

Sensors are noisy. A single strange reading might be a real fault, or it might be a burst of electrical noise, or a particle hitting the chip. If the software acted on every odd sample, it would switch hardware off all day long. That is called a **false alarm** (or a false positive): the monitor trips when nothing is broken.

The fix is a **persistence counter**. The monitor only believes a fault after it has seen the bad condition on $N$ frames *in a row*. Every good frame resets the count to zero. Read $N$ as "the persistence", and think of it as "how many strikes before you're out" — except that here one good pitch wipes all the strikes.

Here is a persistence monitor for a gyro with a limit of 0.5 rad/s and $N = 3$:

```cpp
#include <cstdint>
#include <cstdio>

// One monitor: "gyro rate above limit" must be seen on N frames in a row
// before it counts as a fault. One bad frame alone is ignored.
struct PersistenceMonitor {
    float limit;            // rad/s
    std::uint8_t needed;    // frames in a row before we believe it
    std::uint8_t count{0};  // frames in a row so far

    // Returns true on the frame the fault is confirmed.
    bool update(float rate) {
        if (rate > limit || rate < -limit) {
            if (count < needed) { ++count; }
        } else {
            count = 0;                        // one good frame resets it
        }
        return count == needed;
    }
};

int main() {
    PersistenceMonitor gyro_x{0.5F, 3};
    const float samples[] = {0.10F, 0.90F, 0.12F, 0.80F, 0.85F, 0.95F, 0.90F};
    for (int i = 0; i < 7; ++i) {
        bool fault = gyro_x.update(samples[i]);
        std::printf("frame %d  rate %.2f  count %d  %s\n", i,
                    static_cast<double>(samples[i]), gyro_x.count,
                    fault ? "FAULT CONFIRMED" : "ok");
    }
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra` and run, it prints:

```text
frame 0  rate 0.10  count 0  ok
frame 1  rate 0.90  count 1  ok
frame 2  rate 0.12  count 0  ok
frame 3  rate 0.80  count 1  ok
frame 4  rate 0.85  count 2  ok
frame 5  rate 0.95  count 3  FAULT CONFIRMED
frame 6  rate 0.90  count 3  FAULT CONFIRMED
```

Walk through it. Frame 1 is bad, so the count goes to 1. Frame 2 is good, so the count drops back to 0 — that lonely spike was ignored. Frames 3, 4 and 5 are all bad, so the count climbs 1, 2, 3, and on frame 5 the fault is **[[confirmed|persistence-picture]]**. Notice two flight habits in the code. The count stops growing once it reaches `needed`, so an 8-bit counter can never wrap around to zero after 255 bad frames. And the loop in `update` has no loop at all: the monitor does a fixed, tiny amount of work every frame, which keeps its timing bounded (lessons 01 and 02).

::: key
A monitor declares a fault only after the bad condition **persists** for $N$ consecutive frames. A larger $N$ means fewer false alarms but a slower response: detection takes at least $N$ frame periods.
:::

::: example How much does persistence buy?
Suppose a monitor runs at 10 Hz, and noise alone pushes one sample over the limit with probability $p = 0.001$ (one sample in a thousand). Assume each sample's noise is independent of the others. How many false alarms per day do we get for $N = 1, 2, 3, 4$?

**Frames per day.** A day is 86,400 s, and at 10 frames per second that is

$$
86400 \times 10 = 864000 \text{ frames}.
$$

**Chance that a given frame completes a run of $N$ bad samples.** For independent samples you multiply the chances, so it is about $p^N$.

**False alarms per day** are frames per day times that chance:

- $N = 1$: $0.001 \times 864000 = 864$ per day. Useless — the vehicle would be reacting to noise every two minutes.
- $N = 2$: $0.001^2 \times 864000 = 0.864$ per day. About one a day. Still too many.
- $N = 3$: $0.001^3 \times 864000 = 0.000864$ per day. Over a 15-year mission ($15 \times 365.25$ days) that is about 4.7 false alarms in total.
- $N = 4$: about $8.6 \times 10^{-7}$ per day, or about 0.005 in 15 years.

**The price** is the delay. At 10 Hz one frame is 0.1 s, so the fastest possible detection is $N \times 0.1$ s: 0.3 s for $N = 3$ and 0.4 s for $N = 4$.

**Sanity check.** Each extra frame of persistence cut the false alarms by a factor of 1,000, which is $1/p$, as it should. And a few tenths of a second is short compared with how fast a spacecraft's attitude drifts off, so $N = 3$ or $4$ is a sensible choice here. A thruster that is firing when it should not may need a shorter $N$; a slow battery-temperature trend can afford a much longer one.
:::

::: warning The independence assumption is doing a lot of work
The multiplication $p^N$ only holds if one noisy sample does not make the next one more likely to be noisy. Real interference often comes in bursts — a motor switching on, a radio transmitting — and then three bad samples in a row are far more likely than $p^3$. Engineers check persistence settings against recorded data from the real vehicle, not only against the formula.
:::

## Isolation: which part is broken?

Knowing that *something* is wrong is not enough. To fix it, the software has to know *which* part to stop trusting. That is isolation.

Picture two friends each wearing a watch. If the watches disagree by ten minutes, you know one of them is wrong. But which one? You cannot tell. Now add a third friend. If two watches say 3:00 and one says 3:10, you bet on the two that agree. **[[Two can detect a fault; three can isolate it|two-vs-three]].** That is why so many spacecraft carry three or four gyros, and why flight computers often come in threes.

The rule in code: with three sensors, the **odd one out** is the one that disagrees with *both* of the others while those two agree with each other. You still apply persistence before you act, because noise can make any single comparison look bad.

There is a second way to get a "third opinion" without buying a third sensor. You can compare a sensor with a *different kind* of measurement, or with a physics model. A gyro says the spacecraft turned 2° in the last minute; the star tracker says it turned 2° too. That is **[[analytical redundancy|analytical-redundancy]]**: the extra opinion comes from math and other sensors, not from a duplicate part.

Isolation also means drawing walls. Engineers divide the vehicle into **[[fault containment regions|containment]]**: boxes whose faults must not spread into their neighbors. A shorted heater should blow its own fuse, not pull down the whole power bus. In software, a crashed task should be restarted on its own, not take the navigation filter with it.

## Recovery: climbing the FDIR ladder

Once the bad part is isolated, the software recovers. Good recovery uses the *smallest* action that fixes the problem, and only goes bigger if the problem persists. Engineers draw this as a **[[recovery ladder|ladder]]**, with each rung more drastic than the one below:

1. **Retry or ignore locally.** Re-read the sensor, discard one sample, use the last good value.
2. **Switch to a spare.** Stop using the bad gyro; carry on with the other two. Swap to the backup valve.
3. **Reset the part or the task.** Power-cycle the unit, restart the software task.
4. **Safe mode.** Stop the mission, get the whole vehicle into a simple survivable state, wait for the ground.
5. **Processor reset or switch to the backup computer.** If even safe mode cannot run, the watchdog from lesson 06 restarts everything.

Each rung has a **budget**: how many times it may be tried before the software climbs to the next one. Without budgets, a vehicle can get stuck in a loop — reset the unit, the fault comes back, reset again — forever. Counting attempts and escalating is what turns a loop into a ladder.

::: warning Recovery must not flip-flop
A common design slip is a monitor that isolates a sensor, then sees the sensor looking fine again and un-isolates it, then isolates it again. The vehicle's control keeps jumping between two answers. Flight FDIR makes isolation "sticky": once a part is marked bad, the software does not trust it again on its own. Putting it back into use is a decision for the ground.
:::

::: example Detection, isolation and recovery in 60 lines
Three gyros measure the same axis. While all three are healthy, the software flies with the **median** (the middle value), which throws away a single wild reading on the very frame it happens. A monitor looks for an odd one out; after 3 frames in a row it isolates that gyro and drops to "degraded" mode, averaging the two survivors. Two assertions guard the output. When an assertion fails, it does not stop the program — it sends the vehicle to safe mode.

```cpp
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstdio>

enum class Mode : std::uint8_t { Nominal, Degraded, Safe };
Mode g_mode = Mode::Nominal;

void enter_safe_mode(const char* why) {
    if (g_mode != Mode::Safe) { std::printf("  -> SAFE MODE: %s\n", why); }
    g_mode = Mode::Safe;
}

// A flight assertion does something: it never compiles to nothing.
#define FLIGHT_ASSERT(cond) \
    do { if (!(cond)) { enter_safe_mode("assert failed: " #cond); } } while (0)

constexpr float kTol = 0.02F;         // rad/s: allowed disagreement
constexpr std::uint8_t kPersist = 3;  // bad frames in a row before acting

std::array<bool, 3> g_healthy{true, true, true};
std::array<std::uint8_t, 3> g_strikes{0, 0, 0};

// Detect and isolate: with three good gyros, the one that disagrees
// with both others (while they agree) is the odd one out.
void check_gyros(const std::array<float, 3>& w) {
    if (g_mode != Mode::Nominal) { return; }  // isolation needs all three
    for (int i = 0; i < 3; ++i) {
        const int j = (i + 1) % 3;
        const int k = (i + 2) % 3;
        const bool odd = std::fabs(w[i] - w[j]) > kTol && std::fabs(w[i] - w[k]) > kTol
                         && std::fabs(w[j] - w[k]) <= kTol;
        g_strikes[i] = odd ? static_cast<std::uint8_t>(g_strikes[i] + 1) : 0;
        if (g_strikes[i] >= kPersist) {
            g_healthy[i] = false;             // isolate: stop using it
            g_mode = Mode::Degraded;          // recover: carry on with two
            std::printf("  -> gyro %c isolated\n", 'A' + i);
            return;
        }
    }
}

// The rate to fly with: median of three, or the mean of the two survivors.
float selected_rate(const std::array<float, 3>& w) {
    float out = 0.0F;
    if (g_mode == Mode::Nominal) {
        out = std::max(std::min(w[0], w[1]), std::min(std::max(w[0], w[1]), w[2]));
    } else {
        float sum = 0.0F;
        for (int i = 0; i < 3; ++i) { if (g_healthy[i]) { sum += w[i]; } }
        out = sum / 2.0F;
    }
    FLIGHT_ASSERT(std::isfinite(out));        // "impossible" -- so act on it
    FLIGHT_ASSERT(std::fabs(out) < 3.0F);     // beyond the gyro's own range
    return std::isfinite(out) ? out : 0.0F;
}

int main() {
    const std::array<std::array<float, 3>, 6> frames{{
        {0.100F, 0.101F, 0.099F},
        {0.100F, 0.180F, 0.101F},   // B jumps
        {0.100F, 0.185F, 0.100F},
        {0.101F, 0.190F, 0.100F},   // third bad frame in a row
        {0.100F, 0.200F, 0.099F},
        {0.100F, 0.210F, NAN},      // C now sends garbage
    }};
    for (std::size_t f = 0; f < frames.size(); ++f) {
        std::printf("frame %zu\n", f);
        check_gyros(frames[f]);
        const float w = selected_rate(frames[f]);
        std::printf("  rate used %.4f rad/s, mode %d\n", static_cast<double>(w),
                    static_cast<int>(g_mode));
    }
}
```

Output (mode 0 is nominal, 1 degraded, 2 safe):

```text
frame 0
  rate used 0.1000 rad/s, mode 0
frame 1
  rate used 0.1010 rad/s, mode 0
frame 2
  rate used 0.1000 rad/s, mode 0
frame 3
  -> gyro B isolated
  rate used 0.1005 rad/s, mode 1
frame 4
  rate used 0.0995 rad/s, mode 1
frame 5
  -> SAFE MODE: assert failed: std::isfinite(out)
  rate used 0.0000 rad/s, mode 2
```

Follow the story frame by frame.

- **Frame 1.** Gyro B jumps to 0.180. The median of 0.100, 0.180 and 0.101 is 0.101, so the rate the controller uses barely moves. Voting has already protected the vehicle, before the fault is even confirmed.
- **Frame 3.** B has been the odd one out three frames running. It is **isolated**, and the mode drops to degraded. The rate used is the mean of A and C: $(0.101 + 0.100) / 2 = 0.1005$ rad/s.
- **Frame 5.** Gyro C sends NaN ("not a number", a floating-point value that means "no valid result"). With only two gyros left, the software cannot tell which is right, so the cross-check cannot isolate anything. The assertion `std::isfinite(out)` catches the garbage instead, and the vehicle enters **safe mode**.

**Sanity check.** The rate stayed near 0.100 rad/s on every frame where the software trusted it, which is the true rate A kept reporting. The bad gyro never reached the controller, and the one frame of garbage was turned into a safe-mode entry, not into a wild thruster command.
:::

## Safe mode: the spacecraft goes to bed

**Safe mode** is the bottom rung before a full reset. Its job is not to do the mission. Its job is to stay alive long enough for people to understand what happened. A typical safe mode does four things:

- **Point to stay powered.** Turn the solar panels toward the Sun, often using simple **[[sun sensors|sun-safe]]** instead of the star tracker and the full navigation filter.
- **Stay warm (or cool).** Hold a thermal attitude and turn on survival heaters.
- **Keep talking.** Point an antenna, or use a low-gain antenna that does not need pointing, so the ground can reach the vehicle.
- **Stop everything else.** Science instruments go off. Planned maneuvers are canceled. Only the smallest, most-tested software runs.

Then it **waits**. Leaving safe mode is a command from the ground, sent after engineers have read the telemetry and understood the fault. The software does not climb back up the ladder on its own, for the same reason isolation is sticky.

Why keep safe mode so simple? Because it runs exactly when something unexpected has happened. The code that runs in that moment must depend on as few parts as possible, and must have been tested more than anything else on board. A safe mode that needs the star tracker is useless on the day the star tracker is the thing that broke.

::: warning Safe mode is not free
Every safe-mode entry costs days of mission time: the ground has to notice, diagnose, and command recovery. A science mission can lose a week of observations. So a safe mode that trips on false alarms is a real cost, not a harmless precaution. That is why detection needs persistence and why each rung of the ladder is tried before the next.
:::

## Assertions that do something in flight

On your laptop, `assert(x > 0)` from `<cassert>` stops the program with a message when the condition is false. That is great for finding bugs. It is terrible in flight. First, a program that stops is a spacecraft with no attitude control. Second, the standard `assert` **[[disappears when NDEBUG is defined|ndebug]]**, which release builds usually do, so in flight it checks nothing at all.

NASA/JPL's *Power of Ten* rules, which lesson 11 walks through in full, ask for assertions anyway — at least two per function — but of a flight kind. An **assertion** here is a runtime check of a condition that should be *impossible* if the code is right: a mode value outside the enum, an index past the end, a rate that is not a finite number. When one fails, it must *do* something useful: return an error to the caller, isolate a part, or, as in the example above, enter safe mode.

::: key
Use a minimum of two runtime assertions per function, checking conditions that should be impossible. Assertions must have an effect other than nothing in flight, such as entering a safe mode.
:::

The `FLIGHT_ASSERT` macro in the example shows the shape. It is always compiled in. It never calls `abort`. It routes the failure into the FDIR system, which then decides how far up the ladder to go. And notice the value of checking `std::isfinite(out)`: a **[[NaN slips through ordinary comparisons|nan-compare]]**, so the cross-check alone missed it.

::: warning An assertion is not error handling for expected events
A gyro that goes out of range is a fault you *expect* to happen someday, so it gets a monitor with persistence. An assertion is for something that should never happen if the software itself is correct. If an assertion trips in normal operation, the bug is in the design, not in the hardware.
:::

## Check yourself

::: check
A monitor runs at 50 Hz with persistence $N = 5$. What is the shortest time from the start of a real fault to its confirmation?
:::

::: answer
One frame at 50 Hz lasts $1/50 = 0.02$ s. The fault must be seen on 5 frames in a row, so confirmation takes at least $5 \times 0.02 = 0.1$ s. It can take a little longer if the fault starts right after a frame was sampled, because the first bad sample then arrives up to one frame later.
:::

::: check
A spacecraft has two star trackers. They start to disagree by 0.5°. Can the software tell which one is wrong using only the two trackers? What could it add to decide?
:::

::: answer
No. Two sensors can *detect* a disagreement but cannot say which one is at fault — either could be the liar. To isolate, it needs a third opinion. That can be a third tracker, or analytical redundancy: propagate the last trusted attitude forward with the gyros and see which tracker agrees with the prediction.
:::

::: check
Why does the persistence counter in the lesson stop incrementing at `needed` instead of counting forever?
:::

::: answer
The counter is a `std::uint8_t`, which holds 0 to 255. If a fault lasted 256 frames and the counter kept going, it would wrap around to 0 and the monitor would report "no fault" in the middle of a real one. Capping it at `needed` keeps the count in range forever and still tells the truth.
:::

::: check
A team proposes that safe mode should use the full navigation filter and the star tracker "so that attitude is more accurate". What is the argument against?
:::

::: answer
Safe mode runs when something unexpected has gone wrong, and the broken thing might be the star tracker or the filter. Safe mode must depend on as few parts as possible and on the most-tested code. Coarse Sun pointing with simple sun sensors is less accurate, but it keeps the panels powered even when the complex parts have failed — and accuracy is not the goal of safe mode, survival is.
:::

::: check
Rewrite this check so it would pass a Power of Ten review: `assert(index < kTableSize);` in a function that reads `table[index]`.
:::

::: answer
The standard `assert` vanishes under `NDEBUG` and would stop the program if it did fire. A flight version is always compiled and has an effect. For example:

```cpp
if (index >= kTableSize) {
    report_fault(Fault::BadIndex);   // tell FDIR
    return kDefaultValue;            // and do not read past the end
}
return table[index];
```

The check stays in the flight build, the out-of-range read never happens, and the FDIR system decides whether this is worth a safe-mode entry.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Fault vs failure | broken part vs wrong vehicle behavior | FDIR catches faults before they become failures |
| Monitor | code that checks one thing every frame | limit, cross-check, rate, heartbeat, assertion |
| Persistence $N$ | bad on $N$ frames in a row before acting | false alarms about $p^N$ per frame; delay at least $N$ frames |
| Isolation | which part is bad | two detect, three isolate; or analytical redundancy |
| Median vote | middle of three values | hides one wild value on the frame it happens |
| Recovery ladder | smallest fix first, escalate on a budget | retry, spare, reset, safe mode, processor reset |
| Sticky isolation | a part marked bad stays bad | putting it back is a ground decision |
| Safe mode | simple survival state | power, thermal, comms; wait for ground |
| Flight assertion | check of an "impossible" condition | at least two per function; must act in flight |

Everything in this lesson assumed a fault came from a part wearing out or a bug. In space there is another cause that hits even perfect hardware: radiation. The next lesson, on radiation effects and software mitigations, shows how a single particle can flip a bit, and why voting, checksums and scrubbing are the everyday defenses.

::: context light-time Why nobody can joystick a Mars orbiter
Radio travels at the speed of light, about 300,000 km per second. Mars is between roughly 55 million and 400 million kilometers from Earth, depending on where the two planets are in their orbits. So a command takes between about 3 and 22 minutes to arrive, and the reply takes as long again. If a fault starts a spin, the spacecraft may have tumbled for most of an hour before engineers even see it and send a fix. That is why fault response has to live on board.
:::

::: context fdir-name Many names for one job
"FDIR" is the name used at the European Space Agency and in much of the industry. At NASA's Jet Propulsion Laboratory the same job is usually called **fault protection**, and some teams say **FDIR** for fault detection, isolation and *reconfiguration*. In aircraft and cars you may hear **health management** or **diagnostics**. The ideas are the same: notice, locate, respond, and keep the vehicle safe while you do.
:::

::: context persistence-picture The counter, frame by frame
The bars are the gyro samples from the program; the red line is the limit. A single spike (frame 1) is forgiven because the next frame is good. Three bad frames in a row (3, 4 and 5) confirm the fault.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="95" x2="340" y2="95" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="300" y="89" font-size="11" fill="#b4232c">limit 0.5</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="42" y="131" width="26" height="9" fill="#8fb8f0"/>
    <rect x="84" y="59" width="26" height="81" fill="#f2b880"/>
    <rect x="126" y="129" width="26" height="11" fill="#8fb8f0"/>
    <rect x="168" y="68" width="26" height="72" fill="#f2b880"/>
    <rect x="210" y="63" width="26" height="77" fill="#f2b880"/>
    <rect x="252" y="54" width="26" height="86" fill="#b4232c"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="155">0</text><text x="97" y="155">1</text><text x="139" y="155">2</text>
    <text x="181" y="155">3</text><text x="223" y="155">4</text><text x="265" y="155">5</text>
    <text x="55" y="172">c=0</text><text x="97" y="172">c=1</text><text x="139" y="172">c=0</text>
    <text x="181" y="172">c=1</text><text x="223" y="172">c=2</text><text x="265" y="172">c=3</text>
  </g>
  <text x="265" y="44" font-size="11" fill="#b4232c" text-anchor="middle">fault</text>
  <text x="30" y="20" font-size="11" fill="#6c7a93">frame number and count c (N = 3)</text>
</svg>
```
:::

::: context two-vs-three Why a third opinion settles it
With two gyros, a disagreement is one broken line between them: you know the pair is unhappy, but not who caused it. With three, there are three comparisons. The bad gyro breaks the two lines it is part of, and the line between the two good ones stays fine. The pattern of broken lines points straight at the culprit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="80" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">two: who is wrong?</text>
  <line x1="40" y1="90" x2="120" y2="90" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <circle cx="40" cy="90" r="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="120" cy="90" r="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="95" font-size="13" fill="#1f2a44" text-anchor="middle">A</text>
  <text x="120" y="95" font-size="13" fill="#1f2a44" text-anchor="middle">B</text>
  <text x="80" y="140" font-size="11" fill="#6c7a93" text-anchor="middle">detect only</text>
  <text x="270" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">three: B is the odd one</text>
  <line x1="220" y1="120" x2="320" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="220" y1="120" x2="270" y2="45" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <line x1="320" y1="120" x2="270" y2="45" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <circle cx="220" cy="120" r="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="320" cy="120" r="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="270" cy="45" r="18" fill="#f2b880" stroke="#1f2a44"/>
  <text x="220" y="125" font-size="13" fill="#1f2a44" text-anchor="middle">A</text>
  <text x="320" y="125" font-size="13" fill="#1f2a44" text-anchor="middle">C</text>
  <text x="270" y="50" font-size="13" fill="#1f2a44" text-anchor="middle">B</text>
  <text x="270" y="152" font-size="11" fill="#6c7a93" text-anchor="middle">solid: agree, dashed: disagree</text>
</svg>
```
:::

::: context analytical-redundancy A third opinion from physics
Hardware is heavy and expensive, so engineers also get extra opinions from equations. If the reaction wheels were commanded to produce a known torque, Newton's laws say how fast the spacecraft should start to turn. If the gyro reports something very different, either the gyro or a wheel is misbehaving. The navigation filter you meet later in the course does this all the time: every new measurement is compared with what the filter predicted, and a measurement far outside the expected spread is flagged and rejected.
:::

::: context containment Firewalls inside the vehicle
A fault containment region is a part of the system designed so that its failure cannot spread. In hardware that means separate power feeds, fuses, and isolated data lines. In software it means separate memory for each task (a memory protection unit can enforce this), separate stacks, and interfaces that check what they receive. The idea is the same as the watertight compartments in a ship: one flooded room must not sink the whole ship.
:::

::: context ladder The ladder, bottom to top
Each rung is tried a limited number of times. When its budget runs out, or when the fault is too severe for it, the software climbs to the next rung. The higher the rung, the more of the mission is interrupted.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="15" x2="60" y2="190" stroke="#1f2a44" stroke-width="2"/>
  <line x1="300" y1="15" x2="300" y2="190" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="60" y="160" width="240" height="24" fill="#8fb8f0"/>
    <rect x="60" y="125" width="240" height="24" fill="#8fb8f0"/>
    <rect x="60" y="90" width="240" height="24" fill="#f2b880"/>
    <rect x="60" y="55" width="240" height="24" fill="#f2b880"/>
    <rect x="60" y="20" width="240" height="24" fill="#b4232c"/>
  </g>
  <g font-size="12" text-anchor="middle">
    <text x="180" y="176" fill="#1f2a44">1  retry, use last good value</text>
    <text x="180" y="141" fill="#1f2a44">2  switch to a spare</text>
    <text x="180" y="106" fill="#1f2a44">3  reset the unit or task</text>
    <text x="180" y="71" fill="#1f2a44">4  safe mode</text>
    <text x="180" y="36" fill="#ffffff">5  processor reset or swap</text>
  </g>
  <line x1="330" y1="180" x2="330" y2="30" stroke="#6c7a93" stroke-width="2"/>
  <path d="M324,38 L330,26 L336,38 Z" fill="#6c7a93"/>
  <text x="20" y="110" font-size="11" fill="#6c7a93" transform="rotate(-90 20 110)" text-anchor="middle">more drastic</text>
</svg>
```
:::

::: context sun-safe Why the Sun is the safe place to look
The Sun is the brightest thing in the sky, so a very simple sensor — a few photodiodes behind small windows — can tell roughly where it is, even when the star tracker, the navigation filter and the main computer's software are all in doubt. Pointing the panels at the Sun keeps the batteries charging, which buys time for everything else. The Hubble Space Telescope, for example, entered safe mode in October 2018 after one of its gyroscopes failed, and stayed safe until the team had worked out how to bring a backup gyro into service.
:::

::: context ndebug The assertion that vanishes
The standard `assert` is a macro. When the name `NDEBUG` is defined — which most release build settings do, and CMake's Release configuration does by default by passing `-DNDEBUG` — the macro expands to nothing. The condition is not even evaluated. So an `assert` that protected your tests is absent from the flight binary. Flight code uses its own macro that is always compiled in, and routes failures to FDIR instead of calling `abort`.
:::

::: context nan-compare NaN is not equal to anything
Under the IEEE 754 floating-point rules, every ordered comparison with NaN is false: `NaN > 0.02`, `NaN <= 0.02` and even `NaN == NaN` all give `false`. So a cross-check like `fabs(a - b) > tol` quietly says "they agree" when one side is NaN. That is why flight code checks `std::isfinite` directly. Lesson 09 shows a compiler flag, `-ffast-math`, that can make even that check disappear.
:::
