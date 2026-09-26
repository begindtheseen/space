---
id: l10-time-sync-bare-metal-toolchains
title: Time synchronisation, bare metal versus Linux, and the toolchain
minutes: 22
covers:
  - "Time synchronisation: GPS pulse-per-second, PTP, and disciplined timestamping of every sample"
  - Bare-metal microcontrollers vs embedded Linux, and where the boundary sits on a real vehicle
  - Cross-compilation, toolchains, bootloaders and firmware update
---

Picture a relay race filmed by three phones in the stands. Afterward you want to line the three videos up to see whether the baton was passed inside the zone. If one phone's clock is half a second off, the replay lies: it shows a runner crossing a line she had not reached yet. The videos are fine. The clocks are the problem.

A rocket has the same problem, much sharper. It is not one computer but many boards: a valve controller, a navigation computer, a driver for each steering actuator. Each records data with its own clock, and the navigation software mixes that data as if one clock had stamped it all. So every board has to agree on what instant "now" is, to within a millionth of a second or so.

This lesson answers three practical questions. How do the boards agree on the time? Does each board's software run on bare hardware or on an operating system, and why? And how does code get onto a board, and get safely replaced for the rest of the vehicle's life?

## Agreeing on the time

Every computer keeps time with a small **[[oscillator|crystal-oscillator]]** — an electronic part that ticks at a fixed rate, the way a pendulum swings in an old clock. Counting ticks tells the computer how much time has passed. But no oscillator is perfect. A typical one might run fast or slow by $20$ **[[parts per million|ppm]]** (ppm) — $20$ extra or missing ticks in every million. That sounds tiny. Left alone, it adds up.

So each board needs something outside itself to correct its clock against, again and again. Two tools do that job on real vehicles.

### The GPS pulse-per-second

A GPS receiver works out where it is by comparing extremely precise time signals from satellites. So once it has a fix, it knows the time very well. Besides the position message, it puts out a **pulse-per-second (PPS)**: a single electrical pulse on a dedicated wire, lined up with the start of each second of UTC (the world's official time). A good receiver's pulse is accurate to well under a microsecond (a millionth of a second).

Why trust a pulse more than the receiver's own message, which also says what time it is? Because of **[[what happens between the event and the software|pps-vs-message]]**. The message is a string of bytes. It crawls out of a serial port, across a cable, into a driver's buffer, and waits for a task to read it. Each step adds a varying delay. The pulse is only a wire changing voltage, and skips all of that.

A board uses the pulse to **discipline** its oscillator: at every pulse, it measures how far its own clock has drifted and nudges it back. "Discipline" means steering continuously, not setting the clock once and trusting it afterward. Even a good oscillator wanders between corrections, so the correction never stops.

### PTP: the same job over Ethernet

Running a dedicated pulse wire to every board gets messy. **PTP**, the Precision Time Protocol (standard IEEE 1588), gets similar accuracy over an ordinary Ethernet network instead. One clock is the **grandmaster** — the reference everyone else follows. The other boards trade short, **[[timestamped messages|ptp-exchange]]** with it and work out both their clock offset and the travel time of the message.

PTP's accuracy depends on *where* the timestamps are taken. They must be taken in hardware, at the network chip, at the instant a message crosses the wire. If instead software takes the timestamp after the operating system has handed the packet up, all the driver and scheduling delays come back. That is exactly the wobble PTP exists to remove. A software-only PTP setup typically lands at tens to hundreds of microseconds, not well under one.

### Timestamp the sample, not the packet

The PPS and PTP both serve one rule. **Timestamp at the instant the physical quantity was sampled** — the instant the accelerometer's voltage was measured — ideally in hardware, at the sensor or at the **analog-to-digital converter** (the chip that turns a voltage into a number). Never stamp it whenever a software task happens to notice the packet.

Everything between the real sample and the software noticing it — bus transfer, driver buffering, waiting to be scheduled — is a real delay, called **latency**. You measure it and subtract it. You never assume it is too small to matter.

Latency comes in two kinds:

- A latency that **varies** from sample to sample is jitter, in lesson one's sense. It shows up as noise.
- A latency that is **constant** — the same $0.4\,\mathrm{ms}$ every time — is, surprisingly, the more dangerous one.

Why is the steady one worse? A constant timing error makes a clean, repeatable error in the data. That looks exactly like a sensor **[[bias|bias-state]]** — a sensor that always reads a little high. So whoever tunes the filter or calibrates the sensor "fixes" it by adjusting the bias. The timing error has been renamed a sensor property, and it waits to bite when the vehicle's speed changes.

How big are these errors? Position changes by velocity times time. So if the timestamp is off by $\Delta t$ ("delta t", a small time error) on a vehicle moving at speed $v$, the position is off by

$$
\Delta x = v\,\Delta t.
$$

::: key
Timestamp discipline: timestamp at the instant the physical quantity was sampled, not at packet arrival. Measure and compensate the remaining latency. At 2 km/s, 1 ms of timestamp error is 2 m of position error, and a constant latency becomes a bias no tuning removes.
:::

::: example What a timestamp error costs, and what a free-running clock costs
**A timestamp error.** A vehicle moves at $2\,\mathrm{km/s}$, which is $2000\,\mathrm{m/s}$. Its timestamps are $1\,\mathrm{ms}$ off. A millisecond is $0.001\,\mathrm{s}$. Multiply speed by time error:

$$
\Delta x = 2000\,\mathrm{m/s} \times 0.001\,\mathrm{s} = 2\,\mathrm{m}.
$$

One millisecond costs two meters of position. That is not rounding at any speed a launch vehicle reaches.

**A clock left alone.** Now a board's oscillator is rated at $20$ ppm, which is $20 \times 10^{-6}$. GPS drops out briefly, and the board runs on its own clock for $60\,\mathrm{s}$ before the pulse comes back. That stretch on its own clock is called **holdover**. In the worst case the clock drifts by the rate error times the elapsed time:

$$
20 \times 10^{-6} \times 60\,\mathrm{s} = 0.0012\,\mathrm{s} = 1.2\,\mathrm{ms}.
$$

At $2000\,\mathrm{m/s}$, that is worth

$$
2000 \times 0.0012 = 2.4\,\mathrm{m}
$$

of position error by the time the outage ends. And the board did nothing wrong by its own clock the whole time.

**Sanity check.** $1.2\,\mathrm{ms}$ is a bit more than $1\,\mathrm{ms}$, and $2.4\,\mathrm{m}$ is a bit more than $2\,\mathrm{m}$, so the two answers agree. A drift this small already outweighs many of the sensor-noise terms the filter is built to shrink. Disciplining the clock is part of getting the right answer, not a nice extra.
:::

::: warning The latency that looks like a sensor
When a filter keeps wanting a bias you cannot explain, suspect timing before you suspect the sensor. A clean test: fly (or simulate) the same maneuver at two different speeds. A true sensor bias stays the same. A timing error grows with speed, because $\Delta x = v\,\Delta t$.
:::

## Bare metal or embedded Linux?

Think of two kitchens. One is a food truck that makes only tacos: no manager, everything within arm's reach, every order takes the same time. The other is a big restaurant kitchen with a manager, many stations and shared fridges. It can cook almost anything, with many cooks at once. But it has more moving parts, and an order's timing depends on what else is going on.

### Bare metal

A **bare-metal** microcontroller is the food truck. It runs with no operating system at all. The code runs directly on the chip it was compiled for. Many such boards run a small RTOS (lesson five) instead, which keeps the same character: no **[[memory management unit|mmu]]**, no separate processes walled off from each other, no virtual memory.

It is as predictable as software gets, because almost nothing runs that you did not write, and it needs very little memory and power. The price is a thin **ecosystem** — the ready-made drivers and libraries you can reuse. You write drivers yourself, or take them from the chip maker.

Bare metal fits a narrow, physically local job: one valve controller, one actuator's driver, one sensor's sampling and health check. The task is simple and bounded. An operating system would buy nothing and cost real predictability.

### Embedded Linux

**Embedded Linux**, tuned as lesson six describes, is the restaurant kitchen. It brings:

- a rich set of existing drivers;
- POSIX, the standard Unix programming interfaces, so code written for other Unix systems carries over;
- processes kept apart by the memory management unit, so one crashing program cannot scribble over another;
- the ability to run many mostly independent programs on one machine.

That makes it the natural home for the vehicle's main flight computer. It runs the guidance, navigation and control software, combines data from many bare-metal boards, coordinates the vehicle's mode, and talks to the ground. Its hard part is software complexity — many pieces built, tested and updated somewhat separately — more than any one loop's timing.

### Where the line really sits

The line between them is **not** "safety-critical versus not safety-critical". A valve controller failing is just as serious as the guidance computer failing. Both sides of a real vehicle have hard deadlines.

The line is about **scope**:

- A bare-metal board owns one narrow job, with a control loop simple enough to prove correct in full, wired only to the inputs and outputs it needs. The difficulty is timing tightness.
- The Linux flight computer coordinates the whole system. The difficulty is the interaction of many programs. Processes, a file system, a network stack, and updating one part without touching another are worth their cost there.

A real vehicle draws this line on purpose, board by board, rather than picking one architecture for everything.

## Getting code onto the board

### Cross-compilation and toolchains

Flight boards are usually too small to run their own compiler, and building on them would be slow and hard to repeat exactly. So engineers build on an ordinary computer and produce code for a different chip. That is **cross-compilation**: compiling on one kind of processor (say an x86-64 desktop or a build server) for another kind (say an ARM Cortex-M or Cortex-A core in the flight hardware).

The set of tools that does it is the **toolchain**: the compiler, the linker, the assembler and the standard library, all built for one specific target. The target is named by a **[[target triple|target-triple]]**. Two common ones:

- `arm-none-eabi-gcc` builds for a bare-metal ARM chip, with no operating system underneath.
- `arm-linux-gnueabihf` targets an ARM board running embedded Linux, with a full C library and a kernel underneath.

### The bootloader

When a board powers up, the first code that runs is the **bootloader**, not the flight software. Its job is to get the hardware ready and start the real program. It usually comes in stages, like a relay:

1. A tiny **first stage** does the bare minimum hardware setup needed to load the next stage. It never changes.
2. A somewhat larger **second stage** loads the flight application and checks that it is intact.
3. The application starts.

The first stage is kept as small and simple as anything on the vehicle. Why? Because nothing sits underneath it. If it is ever broken, there is no code left on the board that could fix it.

### Firmware updates that cannot brick the board

**Firmware** is the software stored on the board itself. Updating it must *never* leave the board unable to start. A board that will not boot is called **bricked** — as useful as a brick. On a vehicle stacked on the pad, in orbit, or on another planet, a bricked board is usually lost for good, because nobody can reach it.

The standard answer is the **A/B scheme**:

- The board's **[[flash memory|flash-memory]]** holds two complete copies of the application, in separate areas called **bank A** and **bank B**.
- The board runs from one bank, the **active** one. An update writes only to the other, **inactive** bank. Meanwhile the active bank keeps running and stays the one the board boots from.
- The bootloader switches which bank is primary only after the new copy is checked — at least by a checksum or a digital signature, and ideally by actually booting it and passing a self-test.
- A third, factory **[[golden image|ab-banks]]** is never touched by ordinary updates. It is the last resort if both A and B are ever in doubt.

Changing software on a vehicle nobody can reach is not rare. The [[Mars Pathfinder fix from lesson four|pathfinder-patch]] was exactly that kind of operation: new behavior sent to a spacecraft on another planet, with no way to recover by hand if it had gone wrong.

::: example How long an update takes, and why that is fine
A firmware image is $2048\,\mathrm{KiB}$ (a **KiB**, "kibibyte", is $1024$ bytes, so this is $2\,\mathrm{MiB}$). The flash chip can be written at about $50\,\mathrm{KiB/s}$. Divide size by speed:

$$
\frac{2048\,\mathrm{KiB}}{50\,\mathrm{KiB/s}} = 40.96\,\mathrm{s} \approx 41.0\,\mathrm{s}.
$$

**Sanity check.** $50 \times 40 = 2000$, just under $2048$, so a little over $40$ seconds is right.

Forty-one seconds is a long time for a board to have no working program — if you were writing over the bank it runs from. Under the A/B scheme you are not. The write lands in the inactive bank, and the active bank keeps the board working throughout. Only a checked, successfully booted new image ever becomes primary.

The number still matters: it sets the update window, and how long a supervising program should wait before declaring an update stuck. But it is a planning number, not a stretch of danger the vehicle must survive unprotected.
:::

::: warning Never write over the running copy
An update that writes over the *active* bank in place — no A/B split, no golden fallback — is one power cut or one flipped bit away from a board that never boots again. That is the exact failure the A/B scheme is built to make impossible. Treat A/B as a hard requirement for any board nobody can reach after it ships. On a launch vehicle, that is every board once it is on the pad.
:::

## Check yourself

::: check
Why is a GPS receiver's PPS pulse trusted for timing to well under a microsecond, when the receiver's own time message, sent over a serial link, is nowhere near that accurate?
:::

::: answer
The PPS is a single electrical edge made directly by the receiver's timing hardware. Nothing sits between the event and the pin changing voltage: no serial framing, no driver buffer, no bus transfer. Its accuracy is limited mainly by the receiver's own timing circuits.

The message goes through the receiver's serial transmitter, the cable, the receiving board's driver, and then waits for a task to wake up and read it. Each step adds a delay, and each delay varies. So when software sees the message is set by the slowest, most variable link in that chain, not by how well the receiver knows the time.
:::

::: check
A board's timestamp latency has been measured carefully: it is exactly $0.4\,\mathrm{ms}$ on every sample. A colleague says it is not worth fixing, because it is "only a fixed offset, and the filter will absorb it." The vehicle moves at $2\,\mathrm{km/s}$. Why is this the more dangerous case, not the safer one?
:::

::: answer
First, its size. With $\Delta x = v\,\Delta t$: $2000\,\mathrm{m/s} \times 0.0004\,\mathrm{s} = 0.8\,\mathrm{m}$ of position error, the same every time.

A constant error like that looks, to a filter-tuning process or a calibration, exactly like an ordinary sensor bias. The usual "fix" is to adjust a bias estimate or a calibration constant until it cancels. Once that happens, the timing error has been renamed a sensor property and is no longer visible as a timing problem.

Then two things go wrong. If someone later fixes the real latency, the "calibration" becomes wrong. And because the error is $v\,\Delta t$, it changes with speed, so the mislabeled "sensor bias" drifts and nobody connects it to timing. A varying latency at least shows up as noise. A constant one hides because it is easy to explain as something else.
:::

::: check
A board's oscillator is rated at $20$ ppm. How far, at worst, can its clock drift in one day with no corrections at all? What does that tell you about how often it must be disciplined?
:::

::: answer
One day is $24 \times 3600 = 86\,400\,\mathrm{s}$. The worst-case drift is the rate error times the time: $20 \times 10^{-6} \times 86\,400\,\mathrm{s} \approx 1.73\,\mathrm{s}$.

Almost two seconds a day is hopeless for sensor fusion, where the target is under a microsecond. Even one second of free running gives $20 \times 10^{-6} \times 1\,\mathrm{s} = 20\,\mu\mathrm{s}$ of drift. So the clock has to be corrected at every PPS edge (or every PTP exchange) — continuously, not once at startup.
:::

::: check
A team is choosing how to run a new controller for a thrust-vector actuator. Its job is narrow: read one position sensor, close one control loop, drive one motor. The team likes embedded Linux for its drivers and easier debugging. What is the real deciding question, and where does it point?
:::

::: answer
The deciding question is not "is it safety-critical?" — it is, either way. The question is what kind of difficulty the board has to manage: tight timing in one narrow, physically bounded loop, or the complexity of many interacting pieces of software.

One actuator's position loop is the first kind: a small loop that can be proved correct in full, wired to exactly the inputs and outputs it needs. That is bare metal's natural home. Linux's richer tools solve a complexity problem this job does not have, and cost predictability it does need. Good drivers and easy debugging are real conveniences, but they argue for the system-level flight computer, not a single-purpose actuator controller.
:::

::: check
An update process writes the new image directly over the running application, then checks a checksum before rebooting into it. What failure can still happen that an A/B scheme would prevent, and why can it be permanent on a vehicle in flight?
:::

::: answer
A power cut, a link dropout, or any interruption *during* the write. The old image is already partly overwritten and the new one is not finished, so the active bank holds a broken, half-written program. The checksum never gets a chance to help — there is nothing complete to check. Because the write went to the only bank the board boots from, there is no working copy left to fall back to.

On a board reachable only electronically — stacked on a vehicle, in orbit, or on another planet — nobody can reflash it by hand. That is not a bug to fix later; it is the loss of that board for the rest of the mission.
:::

## Summary

| Idea | Meaning |
| --- | --- |
| Oscillator drift | A clock rated at $\epsilon$ ppm can drift $\epsilon \times 10^{-6}$ times the elapsed time |
| GPS PPS | A hardware pulse lined up with each UTC second, well under a microsecond; used to discipline local clocks continuously |
| PTP (IEEE 1588) | Sub-microsecond sync over Ethernet, using hardware-timestamped messages with a grandmaster clock |
| Timestamp discipline | Stamp at the physical sample instant; measure and remove the rest; $\Delta x = v\,\Delta t$ |
| Constant latency | Looks like a sensor bias and gets tuned away instead of fixed |
| Bare metal | No OS or a small RTOS; most predictable, thin ecosystem; one narrow, local job |
| Embedded Linux | Full OS, rich ecosystem, process isolation; coordinating many interacting programs |
| The real boundary | Scope: timing tightness of one loop versus complexity of many programs — not "safety-critical or not" |
| Cross-compilation | Build on a development computer for the flight chip, with a toolchain for that target triple |
| Staged bootloader | A tiny, unchanging first stage with nothing underneath to rescue it |
| A/B firmware update | Write only the inactive bank; verify before switching; a golden image as last resort |

The next lesson closes the module with two last practical questions: how a flight computer records what it did without ever making the control loop wait, and when fixed-point arithmetic is still the right choice over floating point.

::: context crystal-oscillator The tick inside every computer
Most computer clocks count the vibrations of a tiny sliver of quartz. Squeeze quartz and it makes a small voltage; put a voltage on it and it bends. Wired into a circuit, it rings at a very steady rate set by its size and cut, like a tuning fork. A wristwatch's quartz rings $32\,768$ times a second, which is $2^{15}$, so halving it fifteen times gives exactly one tick per second. Temperature, aging and manufacturing spread all shift the rate a little. That small, slowly changing error is why a board's clock needs correcting.
:::

::: context ppm What "parts per million" means
A part per million is one in a million, $10^{-6}$ — the same idea as percent, which is parts per hundred. An oscillator that is off by $20$ ppm gains or loses $20$ microseconds every second. That sounds harmless, but it keeps adding up: over a day it reaches about $1.73$ seconds. Oscillators with temperature compensation get down to around one ppm, and atomic clocks go far lower, which is part of what makes GPS itself possible.
:::

::: context pps-vs-message Why the pulse beats the message
The pulse and the message leave the receiver at about the same moment, but they arrive at the software very differently. The pulse's edge reaches a hardware timer-capture pin in nanoseconds, and the timer records the count on the spot. The message has to be serialized, sent at a limited baud rate, buffered, and then read by a task that may be busy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="138" font-size="11" fill="#1f2a44">time</text>
  <line x1="60" y1="20" x2="60" y2="120" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="66" y="30" font-size="11" fill="#1d6fd1">PPS edge: stamped here</text>
  <rect x="80" y="55" width="90" height="20" fill="#8fb8f0"/>
  <text x="125" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">serial bytes</text>
  <rect x="170" y="55" width="60" height="20" fill="#f2b880"/>
  <text x="200" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">buffer</text>
  <rect x="230" y="55" width="70" height="20" fill="#6c7a93"/>
  <text x="265" y="69" font-size="11" text-anchor="middle" fill="#ffffff">task wakes</text>
  <line x1="300" y1="45" x2="300" y2="120" stroke="#b4232c" stroke-width="2"/>
  <text x="296" y="100" font-size="11" text-anchor="end" fill="#b4232c">message seen here</text>
  <line x1="60" y1="108" x2="300" y2="108" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 3"/>
</svg>
```
:::

::: context ptp-exchange How PTP measures both offset and travel time
The grandmaster sends a message at its time $t_1$; the board receives it at its own time $t_2$. The board replies at $t_3$; the grandmaster receives the reply at $t_4$. If the trip takes the same time both ways, then the one-way delay is $\frac{(t_2 - t_1) + (t_4 - t_3)}{2}$ and the board's clock offset is $\frac{(t_2 - t_1) - (t_4 - t_3)}{2}$. That "same both ways" assumption is why PTP-aware network switches exist: an uneven path shows up directly as an offset error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="80" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">grandmaster</text>
  <text x="280" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">board</text>
  <line x1="80" y1="25" x2="80" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="25" x2="280" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="40" x2="276" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="280,76 270,69 268,78" fill="#1d6fd1"/>
  <text x="72" y="44" font-size="11" text-anchor="end" fill="#1f2a44">t1</text>
  <text x="288" y="79" font-size="11" fill="#1f2a44">t2</text>
  <line x1="280" y1="105" x2="84" y2="140" stroke="#b4232c" stroke-width="2"/>
  <polygon points="80,141 90,134 92,143" fill="#b4232c"/>
  <text x="288" y="109" font-size="11" fill="#1f2a44">t3</text>
  <text x="72" y="144" font-size="11" text-anchor="end" fill="#1f2a44">t4</text>
  <text x="180" y="50" font-size="11" text-anchor="middle" fill="#1d6fd1">sync</text>
  <text x="180" y="150" font-size="11" text-anchor="middle" fill="#b4232c">delay request</text>
</svg>
```
:::

::: context bias-state Where "bias" comes back
A navigation filter, which you meet in the estimation modules, keeps a running guess not only of position and velocity but also of each sensor's bias — a steady offset, like a bathroom scale that always reads two kilograms heavy. The filter adjusts that guess to make the measurements fit. That is exactly why a constant timing error is so sneaky: the filter has a ready-made place to put it, and it will happily file a timing problem under "sensor bias" without complaint.
:::

::: context mmu What a memory management unit does
A memory management unit, or MMU, is hardware that translates the addresses a program uses into real memory locations, and refuses any access the program is not allowed. That lets an operating system give each process its own private view of memory, so one buggy program cannot overwrite another. Small microcontrollers usually have only a simpler **memory protection unit** (MPU), which can fence off regions but does not translate addresses. Lesson seven covers both.
:::

::: context target-triple Reading a target triple
The name is a short description of what the code will run on, read left to right: the processor family, then (optionally) the vendor, then the operating system, then the **ABI** — the rules for how functions pass arguments and how data is laid out. In `arm-none-eabi`, "none" means no operating system and "eabi" is the embedded ARM ABI. In `arm-linux-gnueabihf`, the "hf" means floating-point values are passed in hardware floating-point registers. Mixing code built for two different ABIs is a classic source of baffling crashes.
:::

::: context flash-memory Why writing flash takes so long
Flash memory keeps its contents with the power off, which is why firmware lives there. But it cannot be rewritten one byte at a time like ordinary memory. A whole block must first be erased, and then written a page at a time, and each step takes a physical process of pushing charge through a thin insulator. That is why an update takes tens of seconds rather than milliseconds, and why a power cut in the middle leaves a block half-written rather than cleanly old or cleanly new.
:::

::: context ab-banks The two banks and the golden copy
The board always boots from a bank that is known to work. An update only ever touches the other one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="90" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">Bank A</text>
  <text x="65" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">active, boots</text>
  <rect x="135" y="20" width="90" height="50" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="180" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">Bank B</text>
  <text x="180" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">new image here</text>
  <rect x="250" y="20" width="90" height="50" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">Golden</text>
  <text x="295" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">never updated</text>
  <line x1="180" y1="120" x2="180" y2="76" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,72 175,82 185,82" fill="#b4232c"/>
  <text x="180" y="136" font-size="11" text-anchor="middle" fill="#b4232c">update writes only here</text>
  <text x="65" y="95" font-size="11" text-anchor="middle" fill="#6c7a93">keeps running</text>
  <text x="295" y="95" font-size="11" text-anchor="middle" fill="#6c7a93">last resort</text>
</svg>
```
:::

::: context pathfinder-patch Changing software on another planet
In 1997, Mars Pathfinder kept resetting itself on the Martian surface because of the priority inversion you took apart in lesson four. Engineers at JPL reproduced the fault on an identical ground testbed, then sent up a small change that switched on priority inheritance for the offending mutex. It worked. The lesson for firmware updates: the ability to change flight code safely from far away is not a luxury. Sooner or later, a mission depends on it.
:::
