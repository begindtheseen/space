---
id: l10-time-sync-bare-metal-toolchains
title: Time synchronisation, bare metal versus Linux, and the toolchain
minutes: 18
covers:
  - "Time synchronisation: GPS pulse-per-second, PTP, and disciplined timestamping of every sample"
  - Bare-metal microcontrollers vs embedded Linux, and where the boundary sits on a real vehicle
  - Cross-compilation, toolchains, bootloaders and firmware update
---

A vehicle is not one computer. It is many boards — a valve controller here, a navigation computer there, an actuator driver somewhere else — and every one of them has to agree closely enough on what instant "now" is that data captured on one board can be fused with data captured on another as if a single clock had stamped both. This lesson covers how that agreement is engineered, where each board's software actually runs from and why the choice differs board to board, and how code gets onto a board in the first place and stays safely updatable for the rest of the vehicle's life.

## Time synchronisation

A GPS receiver with a fix produces, alongside its position solution, a **pulse-per-second (PPS)**: a dedicated electrical pulse aligned to the UTC second boundary, accurate typically to well under a microsecond. Its accuracy comes specifically from being a hardware signal rather than a message: it carries none of the driver buffering, bus transfer or task-wake-up latency a timestamp riding inside an ordinary serial data packet would pick up. Every board that needs a shared time reference **disciplines** its local oscillator against this pulse continuously — not read once and trusted thereafter, but steered against each incoming edge, because even a good local oscillator drifts on its own between corrections.

**PTP** (Precision Time Protocol, IEEE 1588) distributes comparable sub-microsecond accuracy over an ordinary Ethernet network instead of a dedicated PPS wire to every board, through a defined exchange of timestamped messages between a grandmaster clock and everything that synchronises to it. Its accuracy depends on timestamping happening in hardware, at the network interface itself, at the instant a PTP message actually crosses the wire — timestamping in software, after the operating system's own driver and scheduling latency, would reintroduce exactly the jitter PTP exists to remove, and is why a software-only implementation lands closer to millisecond accuracy than microsecond.

Both mechanisms serve the same underlying discipline: **timestamp at the instant the physical quantity was sampled**, ideally in hardware at the sensor or the analogue-to-digital converter itself, never at whenever a software task happens to notice the resulting packet. Everything between the physical sample and the software noticing it — bus transfer, driver buffering, scheduling latency — is a real latency that must be measured and compensated, not treated as negligible. A latency that varies is a jitter problem in lesson one's sense; a latency that is *constant* is, in practice, the more dangerous of the two, because a constant offset produces a clean, repeatable error that looks exactly like a sensor calibration bias and gets tuned away by a calibration or filter-tuning process instead of being recognised and removed as the timing error it actually is.

::: example What a timestamp error costs, and what an undisciplined clock costs over time
A vehicle moving at $2\,\mathrm{km/s}$ has a position that changes with velocity times elapsed time, so a timestamp error propagates directly into a position error at the same rate:

$$
2\,000\,\mathrm{m/s} \times 0.001\,\mathrm{s} = 2\,\mathrm{m}.
$$

One millisecond of timestamp error costs two metres of position error — not a rounding concern at any velocity a launch vehicle reaches. Now suppose a board's local oscillator, specified at $20$ parts per million, loses its PPS reference during a brief GPS outage and free-runs for a $60\,\mathrm{s}$ holdover before reacquiring:

$$
20\times10^{-6} \times 60\,\mathrm{s} = 1\,200\,\mathrm{\mu s} = 1.2\,\mathrm{ms}.
$$

At $2\,\mathrm{km/s}$, that undisciplined drift alone is worth $2\,000 \times 0.0012 = 2.4\,\mathrm{m}$ of position error by the time the outage ends — from a board that was, by its own local clock, behaving normally the entire time. Disciplining against PPS or PTP is not a refinement on top of an otherwise-correct navigation solution; a $1.2\,\mathrm{ms}$ drift this small already outweighs many of the sensor-noise terms the rest of the estimator is built to minimise.
:::

::: key
Timestamp at the instant the physical quantity was sampled, not at packet arrival — and measure and compensate whatever latency remains between the two. A constant latency is the dangerous case: it becomes a bias no amount of filter tuning removes, because tuning is exactly what it looks like it needs.
:::

## Bare-metal microcontrollers versus embedded Linux

A **bare-metal** microcontroller runs with no operating system at all, or at most a minimal RTOS with no memory management unit, no process isolation, no virtual memory — code runs directly on the hardware it was compiled for. It is maximally predictable, in exactly lesson one's sense, and has a minimal resource footprint, at the cost of a thin software ecosystem: drivers and libraries you write yourself or obtain from the silicon vendor, rather than the enormous body of existing, tested code a general-purpose OS carries. This is the natural home for a narrow, physically local job — a single valve controller, one actuator's driver, one sensor's digitisation and basic health check — where the entire task is simple and bounded enough that an operating system buys nothing and costs real determinism.

**Embedded Linux**, tuned as lesson six describes, brings a rich driver ecosystem, POSIX APIs, process isolation through its MMU, and the ability to run several largely independent pieces of software on one machine. It is the natural home for the vehicle's higher-level computer: the guidance, navigation and control application itself, fusing data from many bare-metal boards, coordinating vehicle mode across subsystems, and talking to the ground — work whose difficulty is fundamentally software complexity, many interacting pieces that must be built, tested and updated somewhat independently, rather than raw timing tightness alone.

The boundary between the two is not "safety-critical versus not" — a valve controller failing is exactly as consequential as a guidance computer failing, and both sides of a real vehicle carry hard deadlines. It is closer to a boundary of **scope**: a bare-metal board owns one narrow, physically bounded job with a control loop simple enough to prove correct in full, wired to only the I/O that job needs; the Linux-based flight computer owns system-level coordination, where the complexity being managed is the interaction of many pieces of software rather than the tightness of any one loop, and Linux's tools for managing that kind of complexity — processes, a filesystem, a real network stack, the ability to update one subsystem without touching another — earn their cost despite giving up some of the bare-metal side's simplicity. A real vehicle draws this line deliberately, board by board, rather than adopting one architecture throughout.

## Cross-compilation, toolchains and bootloaders

Flight hardware is rarely capable of hosting its own compiler, and even where it could, building on the target would be slower and less reproducible than building on ordinary development machines. **Cross-compilation** builds code on one architecture (an x86-64 desktop or a continuous-integration server) targeting another (an ARM Cortex-M or Cortex-A core, for instance) that the flight hardware actually runs. A **toolchain** — compiler, linker, assembler and standard library, all built for a specific target triple — differs meaningfully by target: `arm-none-eabi-gcc` builds for a bare-metal ARM target with no operating system beneath it at all, while a triple such as `arm-linux-gnueabihf` targets an embedded Linux system with a full C library and kernel interface underneath.

The **bootloader** is the first code to run at power-up, before the flight application itself. It is typically staged: a tiny, deliberately unchanging first stage performs the minimum hardware initialisation needed to load a slightly larger second stage, which in turn loads and verifies the actual application. The first stage is kept as small and simple as anything on the vehicle gets, because it is the one piece of code with nothing beneath it able to recover from a fault in it — if the first-stage bootloader is ever bad, there is no code left to fix it.

**Firmware update** has to satisfy a requirement beyond ordinary software deployment: it must never leave a board unable to boot, because a board that will not boot is, for a vehicle already integrated, stacked, in orbit, or on another planet's surface, often unrecoverable by any means short of physical access nobody has. The standard answer is an **A/B scheme**: two complete copies of the application live in separate storage banks, an update writes only to the inactive bank while the active one keeps running and keeps being what boots, and the bootloader switches which bank is primary only after the new image is verified — by checksum or signature at minimum, ideally by an actual successful boot and self-test — with a factory "golden" image, never touched by an ordinary update, as the last resort if both A and B are ever in doubt. Mars Pathfinder's own fix from lesson four is, in this light, a real instance of exactly this class of operation: new behaviour delivered to a vehicle already on another planet, with no possibility of physical recovery if it had gone wrong.

::: example Why the update target matters as much as the update itself
A $2\,048\,\mathrm{KiB}$ (2 MiB) firmware image is written to flash at a typical page-program throughput of $50\,\mathrm{KiB/s}$:

$$
\frac{2\,048\,\mathrm{KiB}}{50\,\mathrm{KiB/s}} = 41.0\,\mathrm{s}.
$$

Forty-one seconds is a long time for a board to be without a working image, if the write target were the bank currently booted and running. Under the A/B scheme it is not: the write lands entirely in the inactive bank, the active bank keeps the vehicle flying (or the board otherwise functioning) for the full forty-one seconds and beyond, and only a verified, successfully booted new image ever becomes primary. The forty-one-second figure is a real number worth knowing — for scheduling an update window, for bounding how long a supervisory process should wait before deciding an update has stalled — but it is a number that matters for planning the operation, not a window of vulnerability the vehicle has to survive unprotected.
:::

::: warning
An update that writes to the *active* bank in place — no A/B separation, no golden fallback — is one power loss or one bit error away from a board that will never boot again. This is not a hypothetical: it is the specific failure mode the A/B scheme exists to make structurally impossible, and it is worth treating as a hard requirement for any board that cannot be physically reached after it ships, which on a launch vehicle is effectively every board once it is on the pad.
:::

## Check yourself

::: check
Why is a GPS PPS pulse trusted for sub-microsecond timing when the GPS receiver's own position-and-time data message, carried over a serial link, is not accurate to anywhere near that level?
:::

::: answer
The PPS output is a dedicated electrical edge generated directly from the receiver's internal timing, with no serial framing, driver buffering or bus transfer between the event and the pin changing state, so its accuracy is limited mainly by the receiver's own internal timing hardware. The data message travels through the receiver's serial transmitter, the physical link, and the receiving board's driver and task-wake-up latency — every one of them a real, variable delay — before software ever sees it, so its effective timestamp accuracy is set by the slowest, most variable link in that chain rather than by the receiver's actual timing precision.
:::

::: check
A board's timestamp latency is constant at $0.4\,\mathrm{ms}$ on every sample, verified by careful measurement. A colleague argues this is not worth fixing because it is "only a fixed offset, and the filter will absorb it." Why is this the more dangerous case, not the safer one, in a vehicle moving at several kilometres per second?
:::

::: answer
A constant latency produces a constant position error — at $2\,\mathrm{km/s}$, $2\,000\times0.0004=0.8\,\mathrm{m}$ — that looks, to a filter tuning process or a calibration procedure, exactly like an ordinary sensor bias, and both are commonly "absorbed" by adjusting a bias state or a calibration constant to cancel it out. Once that happens, the timing error has been renamed as a sensor property and is no longer visible as a timing problem at all, so it survives any later fix to the actual latency source and any change in vehicle velocity shifts the now-mislabelled "sensor bias" without anyone connecting the two. A variable latency is at least visible as noise; a constant one is invisible precisely because it is easy to explain away as something else.
:::

::: check
A vehicle's designers are deciding whether a new thrust-vector actuator controller should run bare-metal or under embedded Linux. The controller's job is narrow — read a position sensor, close a single control loop, drive a motor — but the team is attracted to Linux for its driver support and easier debugging. What does this lesson's framing say the actual deciding question is?
:::

::: answer
Not whether the job is safety-critical — it is, on either architecture — but whether the difficulty being managed is raw timing tightness in one narrow, physically bounded loop, or the complexity of coordinating many interacting pieces of software. A single actuator's position loop is the former: a small, provable control loop wired to exactly the I/O it needs, which is the case this lesson describes as bare metal's natural home, and where Linux's richer tooling is solving a complexity problem this particular job does not have while giving up determinism it does need. Easier debugging and driver support are real conveniences, but they are arguments for the system-level flight computer's side of the boundary, not for a single-purpose actuator controller's.
:::

::: check
A firmware update process writes the new image directly over the currently running application in place, with a checksum check before rebooting into it. What specific failure mode is still possible that an A/B scheme would have prevented, and why can this failure be unrecoverable on a deployed vehicle?
:::

::: answer
A power loss, a communication fault, or any interruption during the write itself — after the checksum check has already passed on a previous, now partially overwritten image, or before the new image is complete enough to check — leaves the active bank in a corrupted, half-written state with no working image anywhere on the board. Because the write target was the bank the board actually boots from, there is no fallback to boot into afterward. On a board that is unreachable except electronically — already stacked on a vehicle, in orbit, or on another planet's surface — there is no physical means to reflash it, so this specific failure mode is not a bug to fix later; it is a permanent loss of that board for the rest of the mission.
:::

## Summary

| Term | Meaning |
| --- | --- |
| GPS PPS | Hardware pulse aligned to the UTC second, sub-microsecond accuracy, disciplines local oscillators continuously |
| PTP | Sub-microsecond sync over Ethernet via hardware-timestamped message exchange with a grandmaster clock |
| Timestamp discipline | Stamp at the physical sample instant; measure and compensate the rest; a constant latency becomes an untraceable bias |
| Bare-metal | No OS or a minimal RTOS; maximal determinism, thin ecosystem; fits one narrow, physically local job |
| Embedded Linux | Full OS, rich ecosystem, process isolation; fits system-level coordination of many interacting pieces |
| The real boundary | Scope of complexity (timing tightness vs software interaction), not "safety-critical or not" |
| Cross-compilation | Build on a development host, target the flight hardware's architecture via a dedicated toolchain |
| Bootloader staging | A tiny, unchanging first stage with nothing beneath it to recover it if it fails |
| A/B firmware update | Write only the inactive bank; verify before switching; a golden image as the last resort |

Every board in this lesson still has to be verified before it flies, and that means knowing, provably, how long its code takes to run — not by watching it run once, but by measurement disciplined the way the rest of this module has insisted on. The next lesson closes the module with the two remaining practical questions: how a flight computer logs and reports what it did without ever blocking the loop that matters, and when fixed-point arithmetic is still the right tool for the job.
