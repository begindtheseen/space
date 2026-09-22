---
id: l09-drivers-volatile-buses
title: Device drivers, volatile, and buses
minutes: 17
covers:
  - "Device drivers, memory-mapped I/O, and the volatile keyword"
  - "Buses: UART, SPI, I2C, CAN, RS-422, Ethernet/UDP, and time-triggered protocols"
---

Everything so far in this module has been about code running on a processor. Flight software's whole purpose is to talk to hardware beyond that processor — a gyro, a valve driver, an actuator — and that conversation happens through registers mapped into memory and across a physical bus with its own timing rules, which the response-time analysis of lessons two and three has to account for as carefully as any task. This lesson covers both halves: how the processor addresses a device at all, and what the wires between them actually guarantee.

## Memory-mapped I/O

**Memory-mapped I/O** places a device's control, status and data registers at specific memory addresses, so an ordinary load or store instruction reads or writes a peripheral exactly as it would read or write RAM — no special I/O instruction required. The convenience is also the hazard: the compiler has no way to know, from the address alone, that a given location is a hardware register rather than ordinary memory, and it applies the same optimisations either way. It may cache a value it already read into a register instead of reading the address again, silently missing a status bit the hardware changed in the meantime. It may reorder two writes it judges independent, which is fatal when a device requires them in a specific order — configure, then enable, never the reverse. It may eliminate what looks like a redundant write — the same value written twice, or a value never subsequently read by the program — when the write's side effect, not its value, is the entire point: writing to a "clear interrupt flag" register or a "start conversion" register does something physical regardless of what value is written.

**`volatile`** is the keyword that stops all three optimisations for a given object: it tells the compiler that this memory may change, or matter, for reasons outside the program's own visible control flow, so every read and write in the source must appear, in that order, in the generated code. That is what a memory-mapped register needs, and it is the entire scope of what `volatile` provides. It is emphatically **not a synchronisation primitive**: it constrains only what the compiler does when generating code, and says nothing about what the processor does at runtime — out-of-order execution, store buffers, or what one core's write makes visible to another core at all. A `volatile` flag shared between two threads, or between an interrupt handler and the task it wakes, is not thereby safe to use as a signal: nothing prevents the value from tearing if it is wider than the platform's atomic access size, and nothing orders it against any other memory access happening around it on a multi-core system. Cross-thread and cross-core signalling needs atomics, with an explicit memory ordering, precisely because that is a runtime guarantee `volatile` was never designed to give. Where `volatile` is both necessary and sufficient is its actual purpose: a location the compiler must treat as changing for reasons it cannot see, where the "other party" changing it is hardware, not another thread of code the language's own memory model has any visibility into.

A **device driver**, in this setting, is the one piece of code allowed to hold `volatile`-qualified pointers to raw register addresses at all. It wraps them into a defined interface — initialise, read, write, and an interrupt handler built from lesson seven's top-half-and-bottom-half split — so that everything above the driver deals in ordinary function calls and ordinary types, and the dangerous, easy-to-get-wrong low-level access is confined to one reviewed, tested location instead of scattered through the codebase wherever a register happens to be convenient to touch directly.

::: key
`volatile` stops the compiler from caching or reordering accesses to an object — exactly what a memory-mapped register needs, because the register can change for reasons the program's own logic does not express. It gives no atomicity and no cross-thread or cross-core ordering; that is what atomics are for.
:::

::: warning
A common and dangerous pattern is a `volatile bool` "stop flag" set by one thread and polled by another, on the strength that `volatile` "makes it safe." It compiles, and on some platforms it even usually works, which is worse than an outright failure: it has no guaranteed atomicity, no ordering with respect to any other data the flag is meant to protect, and its apparent reliability is a property of a specific compiler and processor, not of the code. Use an atomic type with an explicit memory order for cross-thread signalling, and reserve `volatile` for what only it does correctly — memory-mapped hardware.
:::

## Buses

Off the processor, a bus carries the same conversation with its own physical and timing rules, and those rules differ enough between buses that "how long will this transfer take" has a different, bus-specific answer each time.

| Bus | Topology | Synchronous? | Addressing | Real-time character |
| --- | --- | --- | --- | --- |
| UART | Point-to-point | No (agreed baud rate) | None | Transmission time computable from baud rate and frame size |
| SPI | Master + per-device chip-select | Yes (shared clock) | None (one line per device) | Fast, simple, no built-in error checking |
| I2C | Shared two-wire bus | Yes | 7- or 10-bit device address | Clock-stretching and arbitration can add unbounded-ish delay |
| CAN | Differential, multi-master | Yes | Message identifier (also sets priority) | Bounded, non-destructive priority arbitration — deterministic by design |
| RS-422 | Differential, longer range | No | None | UART-like framing, better noise immunity, harsher environments |
| Ethernet / UDP | Switched, shared media | No (plain) | MAC / IP | No small bound without augmentation (see time-triggered, below) |

**UART** is the simplest: asynchronous, point-to-point, full-duplex, with no addressing because there is only ever one device on the other end. **SPI** adds a shared clock and a separate chip-select line per device, which is fast and simple but scales poorly past a handful of devices and provides no error checking of its own. **I2C** trades those extra pins for a genuinely shared, addressed bus over two wires — and for a real-time system, its worst-case timing deserves real suspicion: a slave device is permitted to stretch the clock, holding the bus, for a duration nothing in the protocol bounds tightly in the general case, which is exactly the shape of unbounded blocking lesson five taught you to distrust in a software primitive, now showing up in hardware.

**CAN** is the bus most worth understanding in scheduling terms, because its arbitration *is* fixed-priority scheduling, implemented electrically. Every message carries an identifier, and when two nodes transmit simultaneously, each compares its own identifier bit by bit against what actually appears on the (differential, wired-AND) bus; the node transmitting a numerically lower identifier — dominant bits win non-destructively — continues, and every other node backs off immediately, without collision, retry, or the backoff-and-retransmit pattern older shared-media Ethernet used. A lower message identifier is a higher priority, decided at the physical layer, with no software scheduler involved at all — lesson two's fixed-priority theory, running on copper.

::: example A CAN frame's transmission time is a schedulable quantity
A classic CAN 2.0A frame (an 11-bit identifier) carrying an $8$-byte payload is, once header, CRC, and worst-case bit-stuffing are accounted for, on the order of $135$ bits.

$$
\frac{135\,\mathrm{bits}}{500\,000\,\mathrm{bit/s}} = 270\,\mathrm{\mu s}, \qquad \frac{135\,\mathrm{bits}}{1\,000\,000\,\mathrm{bit/s}} = 135\,\mathrm{\mu s}.
$$

That figure is this message's $C_i$, in exactly lesson two's sense — a fixed worst-case occupancy of the bus — and the identifier is this message's priority. A bus carrying several message types at different rates is a schedulability problem of the same shape as a processor carrying several tasks, response-time analysis included: a low-identifier, high-priority command message can be shown to always get onto the bus within a bounded time of wanting to, by the identical fixed-point reasoning lesson three built for a CPU, with bit time in place of instruction time.
:::

**RS-422** is best understood as UART framing carried on differential signalling instead of single-ended levels — the same asynchronous character-oriented protocol, but able to run over much longer cable runs and tolerate far more electrical noise, which is why it persists on older and harsher-environment aerospace links even where a newer bus would otherwise be preferred.

**Ethernet and UDP** bring far higher bandwidth than any of the above, and, in a plain configuration, no small worst-case latency bound at all: switched full-duplex Ethernet avoids the classic collision problem of a shared coaxial segment, but ordinary traffic still queues behind other ordinary traffic with no priority structure guaranteeing a bound. The fix, where Ethernet's bandwidth is wanted alongside a real deadline, is a **time-triggered** augmentation — TTEthernet, or the IEEE 802.1 Time-Sensitive Networking standards — which reserves scheduled time slots for specific, critical traffic on the same physical wiring that also carries ordinary best-effort traffic. The critical traffic gets CAN-like determinism; the bulk traffic gets Ethernet's bandwidth; both share one network instead of requiring two.

::: example What an ordinary UART link costs your budget
A ground-support debug link, or a simple serial sensor, transfers a $32$-byte packet at $115\,200$ baud, with the usual $8N1$ framing — one start bit, eight data bits, one stop bit, ten bits per byte:

$$
\frac{32 \times 10}{115\,200} = 2.78\times10^{-3}\,\mathrm{s} = 2.78\,\mathrm{ms}.
$$

Even the simplest bus on this list has a computable transmission time that belongs in a budget the moment it sits on a path with a deadline — $2.78\,\mathrm{ms}$ is not negligible against a $10\,\mathrm{ms}$ control frame, and treating a UART transfer as instantaneous because it is "only a serial port" is the same mistake as leaving a bus's occupancy out of a schedulability proof that otherwise accounts for every millisecond of CPU time.
:::

## Check yourself

::: check
A developer writes a busy-wait loop that reads a hardware status register in an ordinary (non-`volatile`) local variable pattern: read the register once outside the loop, then spin checking that cached copy. What goes wrong, and what does adding `volatile` to the register's type fix?
:::

::: answer
Without `volatile`, the compiler is free to conclude the register's value cannot change from the program's own point of view — nothing in the visible code writes to it — and may hoist the read outside the loop entirely or cache it in a register, so the loop spins forever on a stale value even while the hardware has actually updated the real register. Declaring the register `volatile` forces the compiler to re-read the actual memory location on every access in the source, so the loop observes the hardware's real, current value each time and can actually detect the change it is waiting for.
:::

::: check
A shared "data ready" flag is declared `volatile` and set by an interrupt handler, read by the task it wakes. A reviewer says this is not sufficient for correctness on a multi-core system. What is missing, and what should replace the plain `volatile` flag?
:::

::: answer
`volatile` only prevents the compiler from caching or reordering accesses to that one object in the code it generates; it says nothing about the processor's own runtime behaviour — out-of-order execution, store buffers, or whether a write on one core becomes visible to another core before or after some other memory operation around it. On a multi-core system the task reading the flag could observe it set while still seeing stale values of whatever data the flag was meant to announce was ready, because nothing orders the two. The fix is an atomic type with an explicit memory ordering (an acquire load paired with a release store, typically), which provides the cross-core visibility and ordering guarantee `volatile` was never designed to supply.
:::

::: check
Why is CAN described in this lesson as "fixed-priority scheduling, implemented electrically," and in what specific way does its arbitration avoid the collision-and-retry pattern of older shared Ethernet?
:::

::: answer
Every CAN message carries an identifier that simultaneously names the message and sets its priority — a numerically lower identifier wins — and when two nodes transmit at once, each compares the bits it is sending against what actually appears on the wired bus; a node sending a "recessive" bit while a "dominant" bit appears (from a competing lower-identifier message) detects the mismatch and stops immediately, non-destructively, with no data lost. This is exactly rate- or deadline-monotonic priority assignment from lesson two, enforced by the electrical behaviour of the bus itself rather than by a software scheduler. It differs from classic Ethernet's collision handling, which lets a collision happen, detects it after the fact, and has every involved sender back off and retry — a scheme with no priority structure and no bound on how many retries a given frame might need.
:::

::: check
A team needs both large bulk data transfers (camera imagery) and a hard-deadline command channel on the same physical network, and is considering plain switched Ethernet for both. What is the risk, and what class of solution does this lesson point to?
:::

::: answer
Plain switched Ethernet, even without classic collisions, has no priority structure guaranteeing the command channel a bound on how long it waits behind bulk traffic already queued at a switch — a hard deadline sharing a wire with unbounded best-effort traffic is exactly the situation lesson five's discussion of unbounded blocking warned against, now at the network level rather than inside one processor. The class of solution is a time-triggered augmentation of Ethernet, such as TTEthernet or IEEE 802.1 Time-Sensitive Networking, which reserves scheduled time slots for the critical command traffic on the same physical hardware that also carries the bulk imagery, giving the command channel a bound the plain protocol cannot, without needing a second, separate network.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Memory-mapped I/O | Device registers addressed like ordinary memory; the compiler cannot tell them apart without help |
| `volatile` | Forces every read/write to appear in the generated code, in order — for the compiler only |
| What `volatile` is not | A synchronisation primitive; no atomicity, no cross-thread or cross-core ordering |
| Device driver | The one place raw, `volatile`-qualified register access lives; everything else uses its interface |
| UART / RS-422 | Simple, point-to-point, asynchronous; RS-422 adds range and noise immunity |
| SPI | Synchronous, per-device chip select, fast, no error checking |
| I2C | Shared, addressed, two-wire; clock-stretching risks unbounded-ish delay |
| CAN | Differential, multi-master; identifier sets priority; bitwise arbitration is fixed-priority scheduling in hardware |
| Ethernet / UDP | High bandwidth, no small bound without augmentation |
| Time-triggered (TTEthernet, TSN) | Reserved slots for critical traffic sharing hardware with bulk best-effort traffic |

Buses move data between chips; the next lesson addresses a question that sits above any one bus — what instant a piece of data actually corresponds to, how every board on a vehicle agrees on that instant, and where the line falls between a bare-metal microcontroller and a full Linux flight computer on a real vehicle.
