---
id: l12-chrono-and-random
title: Clocks and random numbers you can trust
minutes: 24
covers:
  - "chrono: steady_clock for intervals, system_clock for wall time, never mixed"
  - "random: engines, distributions, reproducible seeding for Monte Carlo"
---

A kitchen has two kinds of clock. The stopwatch on the counter starts at zero and only ever counts up. The clock on the wall tells you what time it is, and sometimes somebody changes it: it springs forward for daylight saving, or gets set back because it ran fast. Time a boiled egg with the wall clock, and if someone sets it back four minutes halfway through, your egg "has been boiling" for a negative amount of time. For timing, you want the stopwatch. For writing "dinner at 18:30" in a diary, you want the wall clock.

Flight software has both jobs. Checking that a control cycle met its 1 ms deadline is stopwatch work. Stamping a telemetry packet so the ground can line it up with other data is wall-clock work. The C++ header `<chrono>` gives you one clock for each, and a type system that stops you mixing them by accident.

The second half is about dice. A Monte Carlo campaign runs a simulation thousands of times with random winds and sensor errors. When run 4,417 of 10,000 crashes, you must be able to rerun *exactly* run 4,417. The header `<random>` gives you random numbers you can replay — if you seed them the right way.

## Durations: an amount of time with its unit attached

A **duration** is an amount of time: "10 milliseconds", "1.5 seconds". In `<chrono>`, the unit is part of the type. `std::chrono::milliseconds` is a duration counted in thousandths of a second; `std::chrono::microseconds` counts millionths; `std::chrono::seconds` counts whole seconds. Underneath, each is one integer and a unit the compiler remembers.

With the line `using namespace std::chrono_literals;` you can write durations as literals: `10ms` (read "ten milliseconds"), `250us` ("two hundred fifty microseconds"), `2s`. The compiler converts between units for you, following one rule: **a conversion that cannot lose information happens automatically; one that could lose information must be asked for.**

- `std::chrono::microseconds us = 2ms;` compiles. Two milliseconds is exactly 2000 microseconds.
- `std::chrono::seconds s = 1500ms;` does not compile. 1.5 seconds cannot be stored as whole seconds, so g++ refuses with `error: conversion from 'duration<[...],ratio<[...],1000>>' to non-scalar type 'duration<[...],ratio<[...],1>>' requested`.
- `std::chrono::duration_cast<std::chrono::seconds>(1500ms)` compiles and gives 1 second. The cast is your written permission to **truncate** — throw away the fraction.
- `std::chrono::duration<double>(1500ms)` gives 1.5, a duration counted in seconds with a `double`. That form is handy for printing and for math.

`.count()` gives the raw number inside a duration, its unit forgotten. Call it as late as possible.

A plain `int period = 10;` could be milliseconds, microseconds or timer ticks, and nothing checks. A `milliseconds period{10};` says what it is.

## Two clocks, two jobs

A **clock** in `<chrono>` is a type with a static function `now()`. It returns a **time point**: a moment in time, stored as a duration since that clock's **epoch**, its own chosen zero. Time points and durations combine the way you would expect:

- time point minus time point gives a duration (how long between two moments);
- time point plus duration gives a later time point (a deadline);
- time point plus time point means nothing, like adding two dates, and does not compile.

**`std::chrono::system_clock`** is the wall clock. Since C++20 its epoch is fixed: midnight at the start of 1 January 1970, UTC, the **[[Unix epoch|unix-epoch]]**. It is the clock for anything lined up by date and time. But it can jump. The operating system may step it when **[[NTP|ntp]]**, the network time service, corrects it; an operator can set it; a spacecraft may set it when it first locks on to GPS time. A jump can go backward.

**`std::chrono::steady_clock`** is the stopwatch. It is **[[monotonic|monotonic]]**: each reading is never less than the one before, and it ticks at a constant rate. Its epoch is unspecified and means nothing to a person — on the Linux machine used for this lesson, it counted seconds since the computer booted. It is the right clock for measuring how long something took and for scheduling "10 ms from now".

A third name, `std::chrono::high_resolution_clock`, sounds like the one to use for timing. It is not. It is allowed to be another name for either of the other two, and it is not promised to be monotonic. A short program printing each clock's properties on g++ 13 shows why that matters:

```
system_clock          is_steady=0
steady_clock          is_steady=1
high_resolution_clock is_steady=0, same as system_clock: 1
steady tick = 1/1000000000 s
steady now: 625.7 s since its epoch
system now: 1790457724.8 s since its epoch
```

On this library, `high_resolution_clock` *is* `system_clock`, jumps and all. Each clock's constant `is_steady` says whether it is monotonic; only `steady_clock` is guaranteed to say `1`. Its tick here is one nanosecond, and its reading matched the machine's uptime.

::: key
steady_clock is monotonic and cannot jump, which is what you need for measuring intervals and scheduling. system_clock is wall time and can be stepped by NTP or the operator. Never subtract one from the other.
:::

"Never subtract one from the other" is partly enforced for you. The two clocks' time points are different types, so `steady_clock::now() - system_clock::now()` does not compile; g++ says `no match for 'operator-'`. The type system only protects you while the values stay inside `<chrono>`, though.

::: warning The escape hatch is .count()
Once you write `.time_since_epoch().count()`, you have a bare number, and the compiler no longer knows its clock. A steady time stored in a field meant for UTC, or a stored steady count compared with a fresh system count, compiles cleanly and is nonsense: the two epochs differ by about 56 years on the machine above. Keep time points typed as long as you can, name every raw field with its clock and unit (`utc_us`, `mono_ns`), and convert at one marked place.
:::

## The control cycle: steady_clock

A 1 kHz control loop has a budget of 1 ms per cycle. To check it, read the steady clock at the start and the end of the work, and subtract:

```cpp
const auto t0 = std::chrono::steady_clock::now();
run_control_law();
const auto took = std::chrono::steady_clock::now() - t0;   // a duration
if (took > 1ms) report_overrun(took);
```

Why the steady clock? If the wall clock were used and NTP stepped it back 2 ms mid-cycle, `took` would come out negative and a real overrun would be hidden. Stepped forward, a healthy 0.4 ms cycle could be logged as a 50 ms disaster and trigger a fault response. The steady clock cannot jump, so the interval is the real one.

## The telemetry timestamp: system_clock

A telemetry packet needs a timestamp that means the same thing on the vehicle, in the control room and in a database next to radar tracks. That is wall time, so it comes from `system_clock`, converted to a plain integer with a fixed unit, because a packet is bytes, not a C++ type.

::: example Measure a cycle, stamp the packet
```cpp
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <format>
#include <string>

using namespace std::chrono_literals;

struct Packet {
    std::int64_t utc_us;        // wall time: microseconds since 1970-01-01 00:00 UTC
    std::int64_t cycle_us;      // how long the control cycle took
    bool         overran;       // did it miss its 1 ms deadline?
};

int main() {
    constexpr auto budget = 1ms;

    // Measure one cycle with the steady clock.
    const auto t0 = std::chrono::steady_clock::now();
    volatile double x = 0.0;
    for (int i = 0; i < 200'000; ++i) x = x + 1e-6;     // stand-in for the control law
    const auto t1 = std::chrono::steady_clock::now();
    const auto took = t1 - t0;                          // a steady_clock::duration

    // Stamp the packet with the wall clock.
    const auto wall = std::chrono::system_clock::now();
    const Packet p{
        std::chrono::duration_cast<std::chrono::microseconds>(wall.time_since_epoch()).count(),
        std::chrono::duration_cast<std::chrono::microseconds>(took).count(),
        took > budget,
    };

    std::printf("cycle took %lld us, overran: %s\n",
                static_cast<long long>(p.cycle_us), p.overran ? "yes" : "no");
    std::printf("utc_us = %lld\n", static_cast<long long>(p.utc_us));
    const std::string iso = std::format("{:%FT%TZ}",
        std::chrono::floor<std::chrono::milliseconds>(wall));
    std::printf("as text: %s\n", iso.c_str());
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, one run printed:

```
cycle took 556 us, overran: no
utc_us = 1790457714158246
as text: 2026-09-26T21:21:54.158Z
```

Walk through it.

1. `t0` and `t1` are steady time points; `took` is their difference, a duration in the steady clock's nanosecond ticks.
2. `took > budget` compares 556 µs with 1 ms. The library converts both to a common unit first, so no one has to remember that 1 ms is 1000 µs. 556 is less than 1000, so `overran` is false.
3. `wall` is a system time point. `time_since_epoch()` gives its duration since 1970, `duration_cast` truncates it to microseconds, and `count()` finally makes it a plain number for the packet. The field's name says its clock and unit.
4. `std::format` with `{:%FT%TZ}` prints the same moment as ISO 8601 text: date, a `T`, time, `Z` for UTC. `floor` to milliseconds keeps the text short.

Sanity check: $1.790 \times 10^{15}$ µs is $1.790 \times 10^{9}$ s. Divided by about $3.156 \times 10^{7}$ s in a year, that is about 56.7 years after 1970 — late 2026, matching the date printed. Your run will print your own time and a different cycle length.
:::

## A loop that keeps its beat: sleep_until

A 100 Hz loop should start a cycle every 10 ms. The first idea is: do the work, then sleep 10 ms. That is wrong, and it is worth seeing why.

`std::this_thread::sleep_for(d)` (header `<thread>`) sleeps for at least the duration `d`. If the work takes 3 ms and you then sleep 10 ms, each cycle is 13 ms long, not 10. The error adds up every cycle. This slow slipping of a schedule is called **[[drift|drift-timeline]]**.

`std::this_thread::sleep_until(t)` sleeps until the time point `t`. Keep a running time point `next`, add exactly one period to it each cycle, and sleep until it. However long the work took, the next cycle starts on schedule, and wake-up lateness does not accumulate, because `next` comes from the schedule, not from when you woke.

::: example Drift against a fixed schedule
```cpp
#include <chrono>
#include <cstdio>
#include <thread>

using namespace std::chrono_literals;
using Clock = std::chrono::steady_clock;

// Pretend to do 3 ms of guidance work by spinning on the clock.
void do_work() {
    const auto until = Clock::now() + 3ms;
    while (Clock::now() < until) {}
}

int main() {
    constexpr auto period = 10ms;          // 100 Hz
    constexpr int cycles = 100;

    // Version A: sleep for a period after the work. Each cycle's work time adds on.
    auto start = Clock::now();
    for (int i = 0; i < cycles; ++i) {
        do_work();
        std::this_thread::sleep_for(period);
    }
    auto a = Clock::now() - start;

    // Version B: sleep until the next scheduled tick. The schedule never slips.
    start = Clock::now();
    auto next = start;
    for (int i = 0; i < cycles; ++i) {
        do_work();
        next += period;
        std::this_thread::sleep_until(next);
    }
    auto b = Clock::now() - start;

    using ms = std::chrono::duration<double, std::milli>;
    std::printf("sleep_for:   %.1f ms for %d cycles\n", ms(a).count(), cycles);
    std::printf("sleep_until: %.1f ms for %d cycles\n", ms(b).count(), cycles);
}
```

Two runs on one Linux machine printed:

```
sleep_for:   1310.7 ms for 100 cycles
sleep_until: 1000.1 ms for 100 cycles
sleep_for:   1311.9 ms for 100 cycles
sleep_until: 1000.1 ms for 100 cycles
```

Check it against arithmetic.

1. Version A: each cycle is 3 ms of work plus at least 10 ms of sleep, so $100 \times (3 + 10) = 1300$ ms. The measured 1310.7 ms is 10.7 ms more: about 0.1 ms per cycle of oversleep, the operating system waking the thread a little late each time. That lateness also piles up.
2. Version B: 100 periods of 10 ms is $1000$ ms. Measured: 1000.1 ms. The work time vanished into the schedule, and the only error is the lateness of the very last wake-up.

Sanity check: after 100 cycles the `sleep_for` loop is 311 ms behind — 31 whole cycles lost in one second — while the `sleep_until` loop is on time. Timings vary by machine; the difference between "slips every cycle" and "does not slip" does not.
:::

Both loops use `steady_clock`; a schedule of `system_clock` time points would jump whenever the wall clock is stepped. And if a cycle overruns so badly that `next` is already past, `sleep_until` returns at once and the loop races to catch up. Flight loops usually detect that (`Clock::now() > next`), log an overrun, and skip ahead to the next future tick instead.

## Random numbers: engines

Software does the same thing every time, so a "random" number from it is really **pseudo-random**: the output of a fixed formula that looks random but is completely determined by where it started.

`<random>` splits the job into two parts. The first is the **engine**: an object with internal state that produces a long stream of unsigned integers, each fully determined by the state. The starting state comes from a **seed**, a number you supply. Same seed, same stream, every time.

The engine you will see most is the **[[Mersenne Twister|mersenne]]**:

- `std::mt19937` produces 32-bit numbers;
- `std::mt19937_64` produces 64-bit numbers.

Its stream repeats only after $2^{19937} - 1$ outputs, a number with 6,002 digits. Its state is large — `sizeof(std::mt19937)` was 5000 bytes on g++ 13 — so make one per run, not one per sample.

The engine's output is fully specified by the standard, down to the bit. The standard even states a check value: the 10,000th output of a default-constructed engine. On g++ 13:

```
10000th output of default mt19937: 4123659995
10000th output of default mt19937_64: 9981545732273789042
```

Those are exactly the values the standard requires, so any conforming library, on any processor, produces the same stream from the same seed.

## Random numbers: distributions

An engine gives raw integers. A simulation wants a wind gust in m/s with a bell-curve spread, or a sensor bias anywhere between $-0.5$ and $+0.5$ degrees. A **distribution** turns the engine's integers into numbers of the shape you ask for:

- `std::uniform_real_distribution<double> bias{-0.5, 0.5};` — any value in that range, equally likely;
- `std::uniform_int_distribution<int> die{1, 6};` — a whole number from 1 to 6, equally likely;
- `std::normal_distribution<double> gust{0.0, 2.0};` — a bell curve with mean 0 and standard deviation 2.

You call a distribution with the engine as its argument, `double g = gust(eng);`, and it pulls as many raw numbers as it needs to return one value.

Here is the catch. The standard says what *shape* each distribution must produce, but not *which algorithm* produces it. So libstdc++ (g++), libc++ (clang) and Microsoft's library may turn the same engine stream into different numbers. The engine is portable; the distribution is not. A campaign is reproducible run for run only on the same standard library version; for identical numbers on two platforms, write your own transformation from the engine's output.

Distributions can also carry state of their own. A normal distribution's usual algorithms produce values in pairs, so g++'s version keeps the second value of each pair for the next call. That hidden state is the trap in the warning below.

## Seeding for a reproducible Monte Carlo

Where do seeds come from? `std::random_device` is a source of **non-deterministic** numbers, usually drawn from the operating system's [[entropy pool|entropy]]. It is good for choosing a seed, and useless for reproducing a run, because you can never get the same value again unless you wrote it down. (On some older toolchains, notably MinGW builds of g++ before 9.2, it even returned the same sequence every run.)

The rules for a **[[Monte Carlo|monte-carlo]]** campaign follow from all this:

1. **Seed every engine from a recorded value.** If you pick the campaign's base seed with `random_device`, log it before the first run starts.
2. **One engine per case.** Build each case's engine from the base seed and the case number, so case 4,417 can be rerun alone without running cases 0 to 4,416 first. `std::seed_seq seq{base_seed, case_index}; std::mt19937_64 eng{seq};` does that; the mixing done by `std::seed_seq` is itself fully specified by the standard.
3. **One engine per thread.** Never share an engine between threads. Two threads calling it at once is a data race, and even with a lock, which thread draws which numbers would depend on timing.
4. **Distributions belong to the case, too.** Create them inside the case, or call `.reset()` on one before reusing it, so no leftover state leaks from one case into the next.

::: key
Seed `std::mt19937` explicitly from a recorded value — logged — with one generator per case (and one per thread), never from `random_device` in a run you need to reproduce. Distributions carry state, so reusing a distribution across cases can leak between them. The engine's output is identical on every standard library; a distribution's is not.
:::

::: example A landing-dispersion Monte Carlo you can replay
A lander's touchdown point misses the target by an error in $x$ and an error in $y$, each normally distributed with mean 0 and standard deviation $\sigma = 10$ m. What fraction of landings fall within $r = 15$ m of the target?

```cpp
#include <cstdint>
#include <cstdio>
#include <random>

// One Monte Carlo case: 10,000 landings with 10 m scatter in x and y.
// Returns the fraction that land within 15 m of the target.
double run_case(std::uint64_t seed) {
    std::mt19937_64 eng{seed};                        // one engine per case, seeded from a logged value
    std::normal_distribution<double> scatter{0.0, 10.0};
    int inside = 0;
    const int n = 10'000;
    for (int i = 0; i < n; ++i) {
        const double x = scatter(eng);
        const double y = scatter(eng);
        if (x * x + y * y <= 15.0 * 15.0) ++inside;
    }
    return static_cast<double>(inside) / n;
}

int main() {
    const std::uint64_t seeds[] = {20260926, 20260926, 20260927};
    for (std::uint64_t s : seeds)
        std::printf("seed %llu -> %.4f inside 15 m\n", static_cast<unsigned long long>(s), run_case(s));
}
```

With g++ 13 it printed:

```
seed 20260926 -> 0.6709 inside 15 m
seed 20260926 -> 0.6709 inside 15 m
seed 20260927 -> 0.6792 inside 15 m
```

Step by step:

1. The first two lines used the same seed and gave the same answer to all four digits. That is reproducibility: log `20260926`, and this exact case can be rerun next month.
2. A different seed gave a slightly different answer. Each is an estimate from 10,000 random landings.
3. How close should they be to the truth? For this bell-curve scatter, the fraction inside radius $r$ has an exact formula, $1 - e^{-r^2 / (2\sigma^2)}$:

$$
1 - e^{-15^2 / (2 \times 10^2)} = 1 - e^{-1.125} \approx 0.6753.
$$

4. The typical random error of a fraction $p$ estimated from $n$ samples is $\sqrt{p(1-p)/n} = \sqrt{0.6753 \times 0.3247 / 10000} \approx 0.0047$.

Sanity check: $0.6709$ is $0.0044$ below the exact answer and $0.6792$ is $0.0039$ above — each within one typical error. Built against a different standard library, the same seeds would give different, equally valid numbers.
:::

::: warning A shared distribution leaks between cases
This program reseeds the engine identically for two runs but reuses one `normal_distribution`:

```cpp
std::normal_distribution<double> gust{0.0, 1.0};   // shared across cases: the mistake

for (int run = 0; run < 2; ++run) {
    std::mt19937 eng{7};                           // same seed both times
    std::printf("run %d:", run);
    for (int i = 0; i < 3; ++i) std::printf(" %+.4f", gust(eng));
    std::printf("\n");
}
```

With g++ 13 the two runs printed

```
run 0: -0.7201 -1.0847 -0.0371
run 1: +0.3995 -0.7201 -1.0847
```

Same seed, different numbers. Run 1 began with $+0.3995$, the spare half of a pair the distribution computed during run 0 and kept for later. A fresh distribution with seed 7 gives `-0.7201 -1.0847 -0.0371 +0.3995`, which shows where that value came from. Create the distribution inside the case, or call `gust.reset()` at the start of each one.
:::

## Check yourself

::: check
A cubesat's flight computer sets its wall clock from GPS once it gets a fix, which can move the clock by several seconds. The attitude loop computes `dt` for its integrator as the difference between two `system_clock::now()` readings. What goes wrong, and what is the fix?
:::

::: answer
When the GPS fix steps the wall clock, one `dt` includes that jump: seconds too large, or negative. The integrator propagates the attitude by a wildly wrong time step in that cycle. The fix is to take both readings from `steady_clock`, which is monotonic and never jumps, so `dt` is always the real elapsed time. `system_clock` stays for timestamps only.
:::

::: check
Which of these compile, and what value results? (a) `std::chrono::milliseconds a = 3s;` (b) `std::chrono::seconds b = 3500ms;` (c) `auto c = std::chrono::duration_cast<std::chrono::seconds>(3500ms);`
:::

::: answer
(a) compiles: 3 s is exactly 3000 ms, a lossless conversion, so it happens automatically; `a.count()` is 3000. (b) does not compile: 3.5 s cannot be stored in whole seconds, and `<chrono>` refuses a lossy conversion without a cast. (c) compiles: the cast gives permission to truncate, and `c.count()` is 3 — the half second is thrown away, not rounded.
:::

::: check
A 50 Hz loop (period 20 ms) does 4 ms of work and then calls `sleep_for(20ms)`. Ignoring operating-system lateness, how long do 500 cycles take, and how many cycles late is it at the end? What should it do instead?
:::

::: answer
Each cycle takes $4 + 20 = 24$ ms, so 500 cycles take $500 \times 24 = 12{,}000$ ms $= 12$ s. On schedule they should take $500 \times 20 = 10{,}000$ ms $= 10$ s. It is 2 s late, which is $2000 / 20 = 100$ cycles. Instead, keep `next += 20ms` each cycle and call `sleep_until(next)` with `steady_clock` time points; the 4 ms of work then fits inside each period and the loop stays on schedule.
:::

::: check
A teammate seeds each Monte Carlo case with `std::mt19937_64 eng{std::random_device{}()};` and logs only the final statistics. Case 812 of 5,000 produces a crash. What can and cannot be done, and how should the harness change?
:::

::: answer
Case 812 cannot be replayed: its seed came from `random_device` and was never written down. The harness should pick a base seed (from `random_device` is fine), log it before the campaign, and build each case's engine from the base seed and the case number, for example with `std::seed_seq{base, case_index}`. Then case 812 can be rerun alone, in a debugger, on the same library build, with identical random numbers.
:::

::: check
Two engineers run the same Monte Carlo with the same logged seed, one built with g++ (libstdc++) and one with clang using libc++. The engines' first outputs match, but the dispersed wind values differ. Is something broken?
:::

::: answer
No. The engine's output is fully specified, so matching raw numbers are expected. The distributions' algorithms are not — only the shape of the result is — so the two libraries may turn identical engine output into different wind values. Each run is valid and reproducible on its own library. For bit-identical results across both, use the same standard library for both, or convert the engine's output with your own fixed transformation.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| duration | an amount of time with its unit in the type | `10ms`; lossless conversions automatic, lossy need `duration_cast` (truncates) |
| time point | a moment: a duration since a clock's epoch | point − point = duration; point + duration = point |
| `steady_clock` | the stopwatch | monotonic, cannot jump; intervals, deadlines, scheduling |
| `system_clock` | the wall clock | Unix epoch (1970 UTC); can be stepped; timestamps |
| `high_resolution_clock` | an alias for one of the others | not portably monotonic; on libstdc++ it is `system_clock` |
| never mixed | different clocks' points are different types | `.count()` is where mix-ups sneak in |
| `sleep_until(next)`, `next += period` | fixed-rate loop | no drift, unlike `sleep_for` |
| engine | deterministic stream from a seed | `mt19937`, `mt19937_64`; output identical on every library |
| distribution | shapes engine output | algorithm not specified: differs between libraries; carries state |
| `random_device` | non-deterministic numbers | only for picking a seed, which you then log |
| reproducible Monte Carlo | replay any case exactly | logged seed, one engine per case and per thread |

Next comes **C++20 ranges and views**: the algorithms of this module rewritten as pipelines you can read left to right, with the lambdas of lesson 10 as their building blocks.

::: context unix-epoch Why 1970
The Unix operating system, begun at Bell Labs around 1970, counted time as seconds since midnight UTC on 1 January 1970, and the convention spread to almost every computer. That count skips leap seconds: every day is treated as exactly 86,400 seconds. C++20 made `system_clock` follow the same convention. Spacecraft often keep other time scales too, such as GPS time, which has no leap seconds and has run 18 s ahead of UTC since the start of 2017.
:::

::: context ntp How computers agree on the time
The Network Time Protocol lets a computer ask time servers what time it is and correct its own clock. A small error is usually fixed by slewing — running the clock a little fast or slow until it catches up, so time never jumps. A large error, or a clock set for the first time, is often fixed by stepping — jumping straight to the right time, forward or back. That step is what breaks any interval measured with the wall clock. A steady clock is never stepped.
:::

::: context monotonic A word from mathematics
A monotonic sequence only ever moves one way. For a clock, that means a later reading is never smaller than an earlier one, so a subtraction of two readings can never go negative. On Linux, libstdc++ builds `steady_clock` on the kernel's `CLOCK_MONOTONIC`, which counts from boot and is never stepped. The one thing it does not promise is to tick while the machine is suspended: a laptop's steady clock stands still while it sleeps. Flight computers do not usually suspend, so this rarely matters on a vehicle.
:::

::: context drift-timeline Drift, drawn
Each bar below is one cycle: orange for 3 ms of work, blue for sleeping. With `sleep_for`, every cycle is 13 ms, so the start of each cycle falls further behind the 10 ms tick marks. With `sleep_until`, the sleep shrinks to whatever is left of the period, and every cycle starts on a tick.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="30" x2="20" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="120" y1="30" x2="120" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="220" y1="30" x2="220" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="320" y1="30" x2="320" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="20" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">0</text>
  <text x="120" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">10 ms</text>
  <text x="220" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">20 ms</text>
  <text x="320" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">30 ms</text>
  <rect x="20" y="40" width="30" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="50" y="40" width="100" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="150" y="40" width="30" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="180" y="40" width="100" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="280" y="40" width="30" height="20" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="340" y="55" font-size="11" text-anchor="middle" fill="#b4232c">late</text>
  <text x="20" y="76" font-size="11" fill="#1f2a44">sleep_for(10ms): starts at 0, 13, 26 ms</text>
  <rect x="20" y="88" width="30" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="50" y="88" width="70" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="120" y="88" width="30" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="150" y="88" width="70" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="220" y="88" width="30" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="250" y="88" width="70" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="20" y="136" font-size="11" fill="#1f2a44">sleep_until(next): starts at 0, 10, 20 ms</text>
</svg>
```
:::

::: context mersenne Twisting a Mersenne prime
Makoto Matsumoto and Takuji Nishimura published the Mersenne Twister in 1998. Its name comes from its period, $2^{19937} - 1$, which is a Mersenne prime: a prime of the form $2^p - 1$. The "19937" in `mt19937` is that exponent. Its internal state is 624 words of 32 bits, which is why the object is large, and why a fresh engine per random number would be slow. It is fast and statistically good for simulation, but not for cryptography: someone who sees enough outputs can reconstruct its state.
:::

::: context entropy Where unpredictable numbers come from
An operating system collects small unpredictable events — the exact timing of interrupts, device activity, and on many processors a hardware random-number instruction — and mixes them into a pool. Linux serves it through `/dev/urandom` and the `getrandom` call, and libstdc++'s `random_device` reads from sources like these. The numbers are good for seeds and for security keys. They cannot be replayed, which is exactly why a simulation that must be replayed records the seed.
:::

::: context monte-carlo Named after a casino
The Monte Carlo method was developed in the 1940s at Los Alamos by Stanislaw Ulam and John von Neumann, among others, and named after the casino in Monaco. GNC teams use it to fly a vehicle thousands of times in simulation, each run with different random dispersions, and to report how often it lands, docks or stays within limits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">one logged base seed, one engine per case</text>
  <rect x="130" y="30" width="100" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">base 20260926</text>
  <line x1="150" y1="60" x2="60" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="60" x2="180" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="60" x2="300" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="100" width="100" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">case 0 engine</text>
  <rect x="130" y="100" width="100" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">case 1 engine</text>
  <rect x="250" y="100" width="100" height="30" fill="#8fb8f0" stroke="#b4232c" stroke-width="2"/>
  <text x="300" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">case 4417</text>
  <text x="300" y="150" font-size="11" text-anchor="middle" fill="#b4232c">rerun alone, identical</text>
  <text x="180" y="170" font-size="11" text-anchor="middle" fill="#6c7a93">seed_seq{base, case index} for each</text>
</svg>
```
:::
