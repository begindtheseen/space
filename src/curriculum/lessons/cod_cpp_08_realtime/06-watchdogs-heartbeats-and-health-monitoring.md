---
id: l06-watchdogs-heartbeats-and-health-monitoring
title: Watchdogs, heartbeats and health monitoring
minutes: 24
covers:
  - Watchdogs, heartbeats and health monitoring
---

Some lawn mowers have a bar on the handle that you must hold down while you mow. Let go of it — because you tripped, or wandered off, or fainted — and the engine stops by itself. Nobody has to notice that something went wrong. The machine assumes the worst the moment you stop saying "I'm still here".

That idea is called a **[[dead man's switch|dead-mans-switch]]**, and flight computers carry one too, turned around. Instead of stopping the machine when the operator stops pressing, it *restarts* the computer when the software stops checking in. It is called a **watchdog**, and it is the last line of defense against the bug nobody predicted.

The earlier lessons in this module all try to make hangs impossible: bounded loops, no recursion, no allocation, tiny interrupt handlers. They help a great deal. But software is written by people, radiation flips bits, and hardware misbehaves. This lesson is about what happens when all that care is not enough: how a vehicle notices its software has stopped, and how it gets going again.

## The watchdog timer

A **watchdog timer** is a small hardware counter that counts down on its own, driven by its own clock. The software must reset the counter to its starting value regularly. That reset is called **petting** (or kicking, or feeding) the watchdog. If the counter ever reaches zero, the watchdog assumes the software is stuck and resets the whole processor, as if someone pressed the reset button.

Picture a **[[kitchen timer|countdown-picture]]** you have to keep winding back up. As long as you wind it every few minutes, it never rings. If you stop — because you fell asleep, or got locked in the garage — it rings, and someone comes to check on you.

The watchdog is built to be hard to fool.

- It is **hardware**, separate from the processor's normal work. A stuck program cannot stop it from counting.
- It usually runs from its **own [[oscillator|own-clock]]**, so even if the main clock fails, the countdown continues.
- On many chips, once software starts it, software **cannot turn it off** again until the next reset. A runaway program that happens to write into the wrong register cannot disable its own guard.

The time from the last pet to the reset is the **timeout**, $T$. On a flight computer it is usually tens to hundreds of milliseconds — long enough that a healthy system never gets near it, short enough that a hang is caught quickly.

## What a watchdog actually guarantees

It is worth being precise, because watchdogs are easy to over-trust.

A watchdog does **not** prevent the fault. The bug still happened. It does **not** notice wrong answers: a program that happily computes nonsense and keeps petting on time looks perfectly healthy to it. And a reset is not free. Everything in the processor's working memory is lost, the control loop stops for the time the computer takes to reboot, and the software must rebuild its state.

What it *does* guarantee is narrow and very valuable. Any **[[hang|kinds-of-hang]]** — an endless loop, a deadlock, a task waiting forever for a message that never comes, a processor that jumped into garbage — ends within a known time. An outage of unknown length becomes an outage of known length, followed by a recovery.

::: key What a watchdog guarantees
That a processor which stops petting the timer is reset within a known time. It converts a hang into a bounded outage plus a recovery, which is why the vehicle can survive software faults nobody predicted.
:::

::: example How long is the outage?
A lander's flight computer has a watchdog timeout of $T = 50\,\mathrm{ms}$, and it takes $300\,\mathrm{ms}$ to reboot and restart the control loop. The lander is descending at $20\,\mathrm{m/s}$.

The worst case is a hang right after a pet: the counter was full, so the full $50\,\mathrm{ms}$ runs out before the reset. The outage is then

$$
50\,\mathrm{ms} + 300\,\mathrm{ms} = 350\,\mathrm{ms} = 0.35\,\mathrm{s}.
$$

During that time nobody is steering, and the lander falls $0.35\,\mathrm{s} \times 20\,\mathrm{m/s} = 7\,\mathrm{m}$ on its last commanded throttle. That is a lot at the end of a descent, and a small amount high up.

Two lessons come out of the numbers. First, the reboot time usually dwarfs the timeout, so a fast restart matters as much as a short timeout. Second, the designers must know this number and check that the vehicle survives an outage that long in every phase — or arrange a backup computer to take over for phases where it would not.
:::

## Where to pet: heartbeats and a health monitor

Here is the most important design question, and the most common mistake. *Where in the code do you pet the watchdog?*

The tempting answer is "in a timer interrupt that fires every millisecond". It is wrong. A timer interrupt keeps firing even when a task is stuck in an endless loop, so the watchdog is petted forever and never catches anything. Petting has to be evidence that the *work* is getting done, not merely that the processor is awake.

So each important task gives off a **heartbeat**: a counter it increments every time it finishes one run. The navigation task finishes an update, and adds one to its counter. The control task finishes its cycle, and adds one to its own. A **health monitor** — a small task of its own, usually at high priority — checks all the counters at a fixed rate. Since the last check, did every counter advance by at least as much as it should have? If yes, every task is alive, and the monitor pets the watchdog. If any task fell short, the monitor reports which one and does *not* pet. Unless things recover, the watchdog resets the processor.

The counters also help a later reader. A counter that stopped at 137 says exactly when the task stopped.

::: example A stuck task, caught — and missed
This program simulates one flight computer millisecond by millisecond, with no real clock involved, so every run gives the same output. Three tasks give heartbeats: navigation and control run every millisecond, telemetry every 10 ms. The health monitor checks every 10 ms and expects at least 8 navigation beats, 8 control beats and 1 telemetry beat per check. The watchdog timeout is 50 ms. At $t = 138\,\mathrm{ms}$ the navigation task gets stuck. The program runs twice: once petting from the health monitor, once petting from a 1 kHz timer interrupt.

```cpp
// A simulated millisecond clock, three tasks, a health monitor
// and a hardware-style watchdog. Deterministic: no real time is used.
#include <array>
#include <cstdint>
#include <cstdio>

class Watchdog {                          // stands in for the hardware timer
public:
    explicit Watchdog(int timeout_ms) : timeout_(timeout_ms), left_(timeout_ms) {}
    void pet() { left_ = timeout_; }
    bool tick_1ms() { return --left_ <= 0; }  // true: "reset the processor"
private:
    int timeout_, left_;
};

struct Task {
    const char* name;
    int period_ms;                        // runs every period_ms
    int min_beats;                        // expected per 10 ms health check
    std::uint32_t beats = 0;              // heartbeat: +1 per completed run
    std::uint32_t seen = 0;               // value at the last health check
};

void run(bool pet_from_timer_isr) {
    std::array<Task, 3> tasks{{{"nav", 1, 8}, {"control", 1, 8}, {"telemetry", 10, 1}}};
    Watchdog wdg(50);
    int reports = 0;
    for (int t = 1; t <= 400; ++t) {                  // t in milliseconds
        if (wdg.tick_1ms()) {
            std::printf("t=%3d ms  WATCHDOG RESET\n", t);
            return;
        }
        for (Task& k : tasks) {
            const bool nav_stuck = (k.name[0] == 'n' && t >= 138);
            if (t % k.period_ms == 0 && !nav_stuck) ++k.beats;   // task finished
        }
        if (pet_from_timer_isr) wdg.pet();            // the classic mistake
        if (t % 10 == 0) {                            // health monitor, 100 Hz
            bool healthy = true;
            for (Task& k : tasks) {
                const std::uint32_t got = k.beats - k.seen;
                k.seen = k.beats;
                if (got < static_cast<std::uint32_t>(k.min_beats)) {
                    if (++reports <= 2)
                        std::printf("t=%3d ms  %s: %u beats, expected %d\n",
                                    t, k.name, got, k.min_beats);
                    healthy = false;
                }
            }
            if (healthy) wdg.pet();                   // pet only on evidence
        }
    }
    std::printf("t=400 ms  still running, no reset (%d unhealthy reports)\n", reports);
}

int main() {
    std::printf("-- pet from the health monitor --\n");
    run(false);
    std::printf("-- pet from a 1 kHz timer interrupt --\n");
    run(true);
}
```

```text
-- pet from the health monitor --
t=140 ms  nav: 7 beats, expected 8
t=150 ms  nav: 0 beats, expected 8
t=180 ms  WATCHDOG RESET
-- pet from a 1 kHz timer interrupt --
t=140 ms  nav: 7 beats, expected 8
t=150 ms  nav: 0 beats, expected 8
t=400 ms  still running, no reset (27 unhealthy reports)
```

Walk through the first run. The check at 130 ms saw a full set of beats and petted. Navigation then finished its runs at 131, 132, and so on up to 137 — that is $137 - 131 + 1 = 7$ beats — and got stuck at 138. So the check at 140 ms counted 7, one short of 8, reported it and did not pet. The check at 150 ms counted 0. With no more pets, the watchdog ran its full 50 ms from the last pet at 130 ms and reset at $130 + 50 = 180\,\mathrm{ms}$. From the hang at 138 ms to the reset took $180 - 138 = 42\,\mathrm{ms}$, less than the timeout, as it must be.

Now the second run. The monitor saw exactly the same problem and printed the same reports — 27 of them by the end, one every 10 ms from 140 to 400 ms, since $(400 - 140)/10 + 1 = 27$. But the timer interrupt kept petting every millisecond, so the watchdog never got anywhere near zero. The vehicle flew on with its navigation frozen, and the guard that was supposed to catch exactly this stayed quiet.
:::

::: warning Never pet from a timer interrupt, or from every task
Pet in exactly one place: the health monitor, after it has seen fresh heartbeats from every task that matters. Petting from a timer interrupt proves only that the timer works. Letting each task pet the watchdog directly is nearly as bad: as long as *one* task is healthy and keeps petting, the others can be stuck forever.
:::

What counts as "should have advanced" needs a little care. A task that runs every millisecond will do about 10 runs between 10 ms checks, but timing jitter can make it 9 now and 11 next time. So the threshold is set with some room, like the 8 used above. Too tight and a healthy system trips itself. Too loose and a task running at half speed looks fine.

## Windowed watchdogs: too early is also wrong

A plain watchdog only asks "did you pet before the time ran out?" A **windowed watchdog** also asks "did you pet *too soon*?" It has a closed window at the start of each cycle. A pet that arrives while the window is closed counts as a fault and resets the processor too.

Why would petting too soon be a problem? Because it is a sign that the program has gone wrong in a different way. Imagine a bug that sends the program into a tight loop which happens to contain the pet instruction. It pets thousands of times a second and does no real work. A plain watchdog is delighted. A **[[windowed watchdog|window-picture]]** sees pets arriving far too often and resets.

A window forces the petting rate to match the design: not too slow (hung) and not too fast (runaway). Many microcontrollers have one of each: a plain independent watchdog on its own clock, and a windowed one on the main clock.

## Setting the timeout

A watchdog's counter is driven by a clock of frequency $f$, usually slowed down first by a **prescaler** that divides the clock by a fixed number $P$. If the counter starts at $N$, it takes $N$ slowed ticks to reach zero, and each slowed tick lasts $P / f$ seconds. So the timeout is

$$
T = \frac{N \, P}{f}.
$$

The catch is the clock. The independent watchdog clock is usually a small, cheap resistor–capacitor oscillator inside the chip, chosen because it keeps running when everything else fails. Its frequency can be off by tens of percent, and it changes with temperature. So the real timeout can be noticeably shorter or longer than the one on paper.

::: example Choosing the reload value, with a sloppy clock
A watchdog runs from a nominal $f = 32\,\mathrm{kHz}$ clock with a prescaler of $P = 32$, and you want a timeout of about 1 s.

Solve for $N$: $N = T f / P = 1\,\mathrm{s} \times 32\,000\,\mathrm{Hz} / 32 = 1000$. Check: $T = 1000 \times 32 / 32\,000 = 1.0\,\mathrm{s}$.

Now suppose this chip's clock actually runs at $40\,\mathrm{kHz}$, 25% fast. The same setting gives

$$
T = \frac{1000 \times 32}{40\,000} = 0.8\,\mathrm{s}.
$$

If it runs slow at $24\,\mathrm{kHz}$, $T = 32\,000 / 24\,000 \approx 1.33\,\mathrm{s}$.

So the health monitor must pet well within the *shortest* possible timeout, 0.8 s, not the nominal 1 s. Petting every 100 ms leaves room for 8 missed checks, a comfortable margin. And the analysis of the outage must use the *longest*, 1.33 s, because that is how long a hang might go unnoticed. The sanity check: a faster clock counts down faster, so the timeout is shorter, which is what the numbers show.
:::

## After the reset

A reset clears the processor's working memory, but a good flight computer wakes up asking "why did I restart?" Most microcontrollers keep a **reset-cause register** that says whether the last reset came from power-on, the reset pin, software or the watchdog. The start-up code reads it first.

Next, it counts. A small **boot counter** lives in memory that a reset does not clear — a **[[section of RAM the start-up code leaves alone|noinit-memory]]**, or a nonvolatile memory such as flash. Each watchdog reset adds one, and a stretch of normal running sets it back to zero. If the counter climbs past a limit — say three watchdog resets in a row — the software stops trying the normal mode and starts in a minimal **safe mode** instead. This guards against a **reset loop**, where the same fault hangs the computer every time it boots, and the vehicle spends its life rebooting.

Everything the monitor saw — the reset cause, which task's heartbeat stopped, the counter values — goes into telemetry so the engineers on the ground can find the bug. That is exactly how the team behind **[[Mars Pathfinder|pathfinder]]** diagnosed its famous resets in 1997.

## Health monitoring beyond heartbeats

Heartbeats catch tasks that stop. A health monitor can watch much more, as long as each check is cheap and bounded:

- **Timing**: how long each task's last run took, against its budget from the timing analysis. A task that is late but not yet stuck shows up here first.
- **Stack use**: the canary words or painted stack from the stack-depth lesson. A changed canary means a stack came close to overflowing, or did.
- **Queue overruns**: the counters from the interrupt lesson. Any overrun means data was lost.
- **Data sanity**: a navigation estimate that is not a number, a quaternion whose length has drifted far from 1, a sensor stuck on one value.
- **Memory checks**: checksums over code and important tables, which matter a great deal under radiation (lesson 08).

Each check gives the monitor a yes-or-no answer. Some answers only go into telemetry. Some make the monitor stop petting. Most feed the fault-handling logic of the **[[next lesson|fdir-bridge]]**, which decides whether to retry, switch to a backup sensor, enter safe mode, or reset — with the watchdog always waiting underneath, for the day the software cannot decide anything at all.

::: warning A watchdog is not a substitute for finding the bug
A system that resets itself every few hours can look "fine" in testing, because it recovers each time. Treat every watchdog reset in testing as a serious bug report: log the reset cause and the heartbeats, and do not ship until you know why it happened.
:::

## Check yourself

::: check
A colleague says: "We have a watchdog, so we don't need to worry about infinite loops." Give two reasons that is wrong.
:::

::: answer
First, the watchdog only limits how long a hang lasts; it does not prevent it. The vehicle still loses control for the timeout plus the reboot time — hundreds of milliseconds in the lander example — and loses everything in working memory. Second, a watchdog only catches a loop if the pet stops. If the loop contains the pet, or the pet comes from a timer interrupt, or another healthy task keeps petting, the loop is never caught. Bounded loops (lesson 02) prevent the problem; the watchdog is the backup for the case nobody foresaw.
:::

::: check
A health monitor checks every 20 ms. The attitude task runs at 500 Hz. About how many heartbeats should it see per check, and what threshold would you choose? Why not use exactly that number?
:::

::: answer
At 500 Hz the task runs every $1/500 = 2\,\mathrm{ms}$, so in $20\,\mathrm{ms}$ it runs about $20/2 = 10$ times. Timing jitter means one check may see 9 and the next 11, even when all is well. So choose a threshold with some room, such as 8. Using exactly 10 would make a healthy system report a fault every time jitter moved one run across the boundary, and a monitor that cries wolf gets ignored or disabled.
:::

::: check
A watchdog clock is nominally $32\,\mathrm{kHz}$ with a prescaler of 256, and the reload value is 4095. What is the nominal timeout? If the clock can run up to 50% fast, what is the shortest timeout, and how often would you pet?
:::

::: answer
$T = N P / f = 4095 \times 256 / 32\,000 = 1\,048\,320 / 32\,000 \approx 32.8\,\mathrm{s}$. A clock 50% fast runs at $48\,\mathrm{kHz}$, so $T = 1\,048\,320 / 48\,000 \approx 21.8\,\mathrm{s}$. Pet comfortably within that: every second, say, would leave room for many missed checks. But a timeout over 20 seconds is far too long for a control computer — a hang would go unfixed for that long — so a real design would pick a much smaller reload value or prescaler.
:::

::: check
Explain what a windowed watchdog catches that a plain watchdog misses, with an example of a bug that causes it.
:::

::: answer
A plain watchdog only resets if pets stop coming. A windowed watchdog also resets if a pet comes too early, while its window is closed. That catches a runaway program that pets far too often: for example, a corrupted jump (maybe a radiation-flipped bit) that sends the processor into a tight loop around the health monitor's pet instruction. The loop pets thousands of times a second and does no real work, which a plain watchdog accepts as healthy. The window makes the petting rate itself a health check.
:::

::: check
After a watchdog reset, why must the flight software not start again in its normal mode every time?
:::

::: answer
If the fault that caused the hang is still there — a bad parameter in memory, a failed sensor that makes a task wait forever, a bug triggered by the current flight phase — the normal mode will hang again, and the watchdog will reset again, forever. That is a reset loop, and the vehicle does nothing useful during it. So the start-up code reads the reset-cause register and a boot counter kept in memory that survives the reset. After a set number of watchdog resets in a row, it starts in a minimal safe mode that avoids the suspect code and waits for the ground to diagnose the problem from telemetry.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Watchdog timer | hardware countdown on its own clock; software pets it; zero means reset |
| Guarantee | a hang becomes a bounded outage plus a recovery; it does not catch wrong answers |
| Outage | up to timeout plus reboot time; must be survivable in every phase |
| Heartbeat | a counter each task increments when it finishes a run |
| Health monitor | checks every heartbeat advanced enough; pets only then, in one place |
| Never pet from | a timer interrupt, or from each task separately |
| Windowed watchdog | a pet that is too early is also a fault; catches runaway loops |
| Timeout | $T = N P / f$; design for the clock's worst-case frequency |
| After a reset | read the reset cause, count boots in memory that survives, fall back to safe mode after repeats |
| Beyond heartbeats | timing, stack canaries, queue overruns, data sanity, checksums |

The next lesson, on fault detection, isolation and recovery, takes the health monitor's yes-or-no answers and builds them into a ladder of responses, from retrying a reading up to the safe mode that a reset loop falls back to.

::: context dead-mans-switch Where the name comes from
The dead man's switch started on trains. A driver had to keep a pedal or handle pressed; if the driver collapsed and let go, the brakes came on automatically. The name is grim but exact: the device assumes the operator is incapacitated the moment the "I'm still here" signal stops.

Lawn mowers, jet skis and treadmill safety cords use the same idea. A watchdog timer is the software version, with a reset instead of brakes.
:::

::: context countdown-picture The countdown, drawn
Each pet sends the counter back to the top. When the pets stop, the counter runs all the way down, and the processor restarts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="140" x2="30" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="158" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
  <text x="36" y="18" font-size="11" fill="#1f2a44">counter</text>
  <polyline points="30,30 70,70 70,30 110,70 110,30 150,70 150,30 260,140" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="70" y="24">pet</text><text x="110" y="24">pet</text><text x="150" y="24">pet</text>
  </g>
  <text x="200" y="70" font-size="11" fill="#6c7a93">software hangs</text>
  <circle cx="260" cy="140" r="5" fill="#b4232c"/>
  <text x="268" y="130" font-size="12" fill="#b4232c">reset</text>
</svg>
```

The time from the last pet to the reset — the length of that final slope — is the timeout.
:::

::: context own-clock Why the watchdog gets its own clock
If the watchdog counted using the processor's main clock, then a failure of that clock would stop the processor *and* the watchdog at the same moment. The countdown would freeze, and the reset would never come.

So the independent watchdog on most microcontrollers runs from a separate small oscillator built into the chip. It is not precise, but it does not need to be: its only job is to keep counting when everything else has stopped.
:::

::: context kinds-of-hang Ways software stops without crashing
A hang is any state where the software is still powered and "running" but no longer doing its job. The common kinds are:

- an endless loop, from a loop bound that was never reached;
- a deadlock, where two tasks or a task and an interrupt wait for each other;
- waiting forever for a message, a byte or a flag that never arrives, because the sender failed;
- a wild jump into memory that holds data instead of code, often after a stack overflow or a flipped bit.

None of these produces an error message. From the outside they all look the same: silence. That is why the watchdog listens for silence.
:::

::: context window-picture The window, drawn
After each pet, the watchdog starts a new cycle. A pet in the closed part of the cycle is too early and causes a reset. A pet in the open part is accepted. No pet by the end of the cycle is too late and also causes a reset.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="40" width="130" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="160" y="40" width="150" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="65" font-size="12" text-anchor="middle" fill="#1f2a44">closed: too early</text>
  <text x="235" y="65" font-size="12" text-anchor="middle" fill="#1f2a44">open: pet here</text>
  <line x1="310" y1="30" x2="310" y2="90" stroke="#b4232c" stroke-width="2"/>
  <text x="314" y="104" font-size="11" fill="#b4232c">too late</text>
  <text x="30" y="104" font-size="11" fill="#1f2a44">last pet</text>
  <text x="170" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">time since last pet</text>
  <line x1="30" y1="112" x2="340" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="344,112 334,107 334,117" fill="#1f2a44"/>
</svg>
```

The healthy petting rate sits in the blue zone, and both kinds of failure land outside it.
:::

::: context noinit-memory Memory a reset does not wipe
When a C++ program starts, its start-up code zeroes some memory and copies initial values into the rest, so global variables begin in a known state. A reset runs that start-up code again — which would wipe a boot counter.

So embedded programs set aside a small section that the start-up code is told to skip, often named `.noinit`, placed there by the linker script (lesson 10). A value in it survives a watchdog reset, though not a power loss. The software must check it is valid before trusting it, typically with a magic number and a checksum stored beside it, because after power-on it holds whatever random bits the RAM woke up with.
:::

::: context pathfinder Mars Pathfinder's resets
A few days after Mars Pathfinder landed in July 1997, its computer began resetting itself over and over. The cause was priority inversion: a low-priority weather-data task held a lock that a high-priority bus-management task needed, while medium-priority tasks kept the low-priority one from running and releasing the lock. The high-priority task missed its deadline, a check in the software noticed, and the system reset.

The resets kept the lander alive and in contact. Engineers reproduced the problem on a copy of the hardware on Earth and fixed it by turning on priority inheritance for that lock, a setting in the operating system, sent up as a patch. It is a classic example of a reset turning a hang into a recoverable outage, and of the diagnostic data that made the fix possible.
:::

::: context fdir-bridge From alarm bell to action plan
A health monitor answers "is something wrong?" The next lesson answers "what do we do about it?" Fault detection, isolation and recovery (FDIR) takes each monitor's answer, waits to make sure it is not a one-off glitch, works out which part is at fault, and picks the smallest response that fixes it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="60" y="10" width="240" height="26" fill="#8fb8f0"/>
    <rect x="60" y="42" width="240" height="26" fill="#8fb8f0"/>
    <rect x="60" y="74" width="240" height="26" fill="#8fb8f0"/>
    <rect x="60" y="116" width="240" height="30" fill="#f2b880"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="180" y="28">retry or ignore a glitch</text>
    <text x="180" y="60">switch to a backup unit</text>
    <text x="180" y="92">enter safe mode</text>
    <text x="180" y="136">watchdog reset: no logic needed</text>
  </g>
  <text x="330" y="60" font-size="11" text-anchor="middle" fill="#6c7a93">FDIR</text>
</svg>
```

The watchdog sits at the very bottom of that ladder. It needs no logic at all, which is exactly why it still works when all the logic above it has failed.
:::
