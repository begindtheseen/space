---
id: l09-drivers-volatile-buses
title: Device drivers, volatile, and buses
minutes: 21
covers:
  - "Device drivers, memory-mapped I/O, and the volatile keyword"
  - "Buses: UART, SPI, I2C, CAN, RS-422, Ethernet/UDP, and time-triggered protocols"
---

Picture a mailbox at the end of a long driveway, with a little red flag on the side. The mail carrier raises the flag when there is mail. Now imagine you glance at the flag once in the morning, write "flag down" on a sticky note, and from then on only check the sticky note. You will never get your mail. The flag changed; your note did not.

Everything so far in this module has been about code running on a processor. But flight software exists to talk to hardware outside that processor — a gyro, a valve driver, an actuator. That conversation happens in two places. Inside the computer, devices show up as special memory addresses, and some of them change on their own, like that mailbox flag. Outside it, the data travels over wires called buses, each with its own timing rules. Lessons two and three must account for those rules as carefully as for any task.

This lesson covers both halves: how the processor talks to a device at all, and what the wires between them really promise.

## Memory-mapped I/O

A device is controlled through its **[[registers|what-a-register-is]]**: small storage slots inside the device, each with a job. One holds incoming data. One holds status bits, such as "a new sample is ready". One holds control bits, such as "turn on".

**Memory-mapped I/O** gives each of those registers its own memory address. An ordinary load or store instruction then reads or writes the device, exactly as it would read or write RAM. No special instruction is needed. The device's datasheet lists the addresses.

That convenience is also the danger. From the address alone, the compiler cannot tell a device register from ordinary memory, so it optimizes both the same way. Three of its usual tricks break hardware:

1. **It may keep a copy.** If the program reads an address twice with no write in between, the compiler may reuse the first value instead of reading again. That is the sticky note on the mailbox: the hardware changed a status bit, and the program never sees it.
2. **It may reorder writes** that look independent. That is fatal when a device needs them in a set order — configure, then enable, never the other way round.
3. **It may delete a write** that looks pointless: the same value written twice, or a value the program never reads back. But writing to a "clear the interrupt" register or a "start a conversion" register *does something* physical. The act of writing is the whole point, whatever value is written.

## The volatile keyword

**`volatile`** is the C and C++ keyword that switches off all three tricks for one object. It tells the compiler: this memory can change, or matter, for reasons you cannot see in the program. So every read and write in the source must appear in the machine code, in the same order. That is exactly what a device register needs.

And that is *all* `volatile` does. It is **not a [[synchronization primitive|synchronization-primitive]]** — not a tool for making two threads agree. It only limits what the compiler does when it writes the machine code. It says nothing about what the processor does while running: executing instructions out of order, holding writes in a buffer for a while, or when one core's write becomes visible to another core.

So a `volatile` flag shared between two threads, or between an interrupt handler and the task it wakes, is not safe as a signal. If the flag is wider than what the processor can read or write in one step, a reader can catch it half-updated — this is called **[[tearing|tearing]]**. And nothing orders the flag against the other data around it, so on a multi-core system a reader can see the flag set but still read old data.

Signaling between threads or cores needs **atomics**: types whose reads and writes happen in one indivisible step, with an explicit **[[memory ordering|memory-ordering]]** that says which other reads and writes must be visible before or after. That is a promise about the running processor, which `volatile` was never designed to make.

Where `volatile` is both needed and enough is its real job: a location that changes for reasons the compiler cannot see, where the "other party" is hardware, not another thread.

::: key What volatile does and does not do
It stops the compiler from caching or reordering accesses to that object, which is what a memory-mapped register needs. It is NOT a synchronisation primitive: it provides no atomicity and no memory ordering between threads. For that, use atomics.
:::

Here are both tools in one short program. It compiles with `g++ -std=c++17` and runs as shown. A plain object stands in for the device, so it runs on any computer.

```cpp
#include <atomic>
#include <cstdint>
#include <cstdio>
#include <thread>

// A device's registers, in the order the datasheet lists them.
struct UartRegs {
    volatile std::uint32_t data;
    volatile std::uint32_t status;    // bit 0: transmitter ready
    volatile std::uint32_t control;   // bit 0: enable
};

// On the vehicle this would be the address from the datasheet, e.g.
//   UartRegs* const uart = reinterpret_cast<UartRegs*>(0x4000C000);
// Here a plain object stands in for the hardware so the program runs anywhere.
static UartRegs fake_device{0, 1, 0};
UartRegs* const uart = &fake_device;

void uart_send(std::uint8_t byte) {
    uart->control = 1;                        // enable first...
    while ((uart->status & 1u) == 0) { }      // ...re-read status on every pass
    uart->data = byte;                        // ...then write: all kept, in order
}

// Between two threads, use an atomic, never a volatile flag.
int sample = 0;
std::atomic<bool> ready{false};

int main() {
    uart_send('A');
    std::printf("sent 0x%02X\n", static_cast<unsigned>(uart->data));

    std::thread producer([] {
        sample = 42;                                    // write the data...
        ready.store(true, std::memory_order_release);   // ...then publish it
    });
    while (!ready.load(std::memory_order_acquire)) { }  // wait for the flag
    std::printf("sample = %d\n", sample);               // guaranteed to see 42
    producer.join();
}
// Output:
// sent 0x41
// sample = 42
```

In `uart_send`, `volatile` makes the compiler re-read `status` on every pass of the wait loop and keep the three accesses in order. (A real driver would also put a limit on that wait loop, by lesson eight's rules.) In `main`, the atomic `ready` does the job `volatile` cannot. The *release* store promises that `sample = 42` is visible to anyone who sees `ready` become true. The *acquire* load promises the reader then sees it.

::: warning The volatile stop flag
A common and dangerous pattern is a `volatile bool` "stop flag" set by one thread and checked by another, on the belief that `volatile` "makes it safe". It compiles, and on some machines it even usually works — which is worse than failing outright. It has no guaranteed atomicity and no ordering with the data it is meant to guard. Its apparent reliability belongs to one compiler and one processor, not to the code. Use an atomic with an explicit memory order between threads, and keep `volatile` for what only it does right: memory-mapped hardware.
:::

### Device drivers

A **device driver** is the one piece of code allowed to hold `volatile` pointers to raw register addresses. It wraps them in a clean interface — initialize, read, write — plus an interrupt handler built from lesson seven's top-half and bottom-half split. Everything above the driver then deals in ordinary function calls and ordinary types. The risky, easy-to-get-wrong register access lives in one reviewed, tested place, instead of scattered through the code wherever a register was handy to poke.

## Buses

Off the processor, the same conversation travels over a **bus**: a set of wires plus the rules for using them. Think of roads between towns. A private driveway, a road with a traffic light, and a four-way stop all move cars, but each answers "how long until I get through?" differently. Buses are the same. Each one has its own answer to "how long will this transfer take?"

A few words first. A bus is **[[synchronous|clock-or-no-clock]]** if one wire carries a shared clock that tells everyone when to read each bit. It is **asynchronous** if there is no clock wire and both ends agree on a speed in advance. Speed is given in **bits per second** ($\mathrm{bit/s}$). For serial links it is often called the **baud rate**. **Point-to-point** means exactly two devices on the wire. **Multi-master** means any device may start talking.

| Bus | Wiring | Clock wire? | How a device is chosen | Real-time character |
| --- | --- | --- | --- | --- |
| UART | Point-to-point | No (agreed baud rate) | Not needed | Transfer time computable from baud rate and frame size |
| SPI | One master, a chip-select line per device | Yes | Its own chip-select line | Fast, simple, no built-in error checking |
| I2C | Shared two-wire bus | Yes | 7- or 10-bit address | Clock stretching can add delay the protocol does not tightly bound |
| CAN | Shared differential pair, multi-master | No (nodes resynchronize on bit edges) | Message identifier, which also sets priority | Bounded, non-destructive priority arbitration — deterministic by design |
| RS-422 | Differential pair, long runs | No | Not needed | UART-style framing, better noise immunity, harsh environments |
| Ethernet / UDP | Switched network | No shared clock wire | MAC and IP addresses | No small bound without extra scheduling (time-triggered, below) |

**UART** is the simplest. There is one device at each end, so no addressing. Data can flow both ways at once. Each byte is wrapped in a small **[[frame|uart-frame]]** so the receiver knows where it starts and stops.

**SPI** adds a clock wire shared by all devices, plus a separate **chip-select** wire for each device. Pulling a device's chip-select line low says "you, listen". It is fast and simple. But every new device costs another wire, so it scales poorly past a handful, and it has no error checking of its own.

**I2C** uses just two wires for many devices, each with its own address. For real-time work, its worst case deserves suspicion. A slow device is allowed to **[[stretch the clock|clock-stretching]]** — hold the clock wire low until it is ready — and the basic protocol puts no tight limit on how long. That is lesson five's unbounded blocking, the thing you learned to distrust in a software primitive, now showing up in hardware.

### CAN: fixed-priority scheduling in copper

**CAN** (controller area network) is the bus most worth understanding in scheduling terms. Its arbitration *is* fixed-priority scheduling, built into the electrical behavior of the wires.

Every CAN message carries an **identifier** that names it. On the wire, a $0$ bit is **dominant** and a $1$ bit is **recessive**: if any node sends a $0$, the whole bus reads $0$. When two nodes start sending at the same moment, each one [[listens while it talks|can-arbitration]], comparing the bit it sent with the bit the bus actually shows. At the first bit where one sends $1$ and the other sends $0$, the bus shows $0$. The node that sent $1$ sees the mismatch and stops at once. The other node carries on as if nothing happened, and its message arrives intact.

So the message with the numerically lower identifier always wins. No collision, no garbled data, no retry. A lower identifier means higher priority, decided on the wire, with no software scheduler involved. It is lesson two's fixed-priority theory, running on copper.

::: example A CAN frame's transmission time is a schedulable quantity
A classic CAN frame with an 11-bit identifier carries an $8$-byte payload. Counting the header, the error check, the gap between frames and the worst-case **[[bit stuffing|bit-stuffing]]**, it can take up to $135$ bits on the wire. This short program adds up the pieces:

```python
def can_frame_bits(payload_bytes):
    """Worst-case bits on the wire for a classic CAN frame with an 11-bit identifier,
    including the 3-bit gap between frames and the worst possible bit stuffing."""
    fixed = 47                       # every field except the data
    data = 8 * payload_bytes
    stuffable = 34 + data            # the bits where stuffing can happen
    stuff = (stuffable - 1) // 4     # worst case: one extra bit per four
    return fixed + data + stuff

print(can_frame_bits(8))             # 135
```

Step by step: $47$ fixed bits, plus $8 \times 8 = 64$ data bits, is $111$. Stuffing can touch $34 + 64 = 98$ bits, adding at most $\lfloor 97/4 \rfloor = 24$ more. ($\lfloor\ \rfloor$ means "round down".) In total, $111 + 24 = 135$ bits.

Divide by the bus speed to get time:

$$
\frac{135\,\mathrm{bits}}{500\,000\,\mathrm{bit/s}} = 270\,\mathrm{\mu s}, \qquad \frac{135\,\mathrm{bits}}{1\,000\,000\,\mathrm{bit/s}} = 135\,\mathrm{\mu s}.
$$

That figure is this message's $C_i$ (read "C sub i") in exactly lesson two's sense: a fixed worst-case time it occupies the bus. The identifier is its priority.

So a bus carrying several message types at different rates is a schedulability problem of the same shape as a processor carrying several tasks. With the same fixed-point reasoning lesson three built for a CPU, you can show that a high-priority command message always gets onto the bus within a bounded time — bit times in place of instruction times. One difference: a frame already on the wire is never cut off, so a waiting high-priority message can be held up by at most one lower-priority frame, like a short critical section.

Sanity check: at $1\,000\,000\,\mathrm{bit/s}$, each bit takes $1\,\mathrm{\mu s}$, so $135$ bits take $135\,\mathrm{\mu s}$.
:::

### RS-422, Ethernet and time-triggered networks

**RS-422** is best thought of as UART-style framing carried on a **differential** pair: two wires carrying opposite signals, with the receiver reading the difference between them. Electrical noise hits both wires about equally and cancels out in the difference. So RS-422 runs over much longer cables and survives far more noise than a single-wire signal. That is why it lives on in older and harsher-environment aerospace links.

**Ethernet with UDP** brings far more bandwidth than anything above. But plain Ethernet gives no small worst-case bound. Modern switched, full-duplex Ethernet avoids the collisions of the old shared-cable days, yet ordinary traffic still waits in line behind other ordinary traffic at each switch, with no priority structure promising a bound.

The fix, when you want Ethernet's bandwidth and a real deadline together, is a **time-triggered** add-on: **TTEthernet**, or the IEEE 802.1 **[[Time-Sensitive Networking|tsn]]** standards. These reserve scheduled time slots for specific critical traffic, on the same wires that also carry ordinary best-effort traffic. The critical traffic gets CAN-like determinism; the bulk traffic gets Ethernet's bandwidth; and both share one network instead of needing two.

::: example What an ordinary UART link costs your budget
A ground-support debug link, or a simple serial sensor, sends a $32$-byte packet at $115\,200$ baud. It uses the common $8\mathrm{N}1$ framing: one start bit, eight data bits, no parity bit, one stop bit — ten bits on the wire for every byte of data.

Bits to send: $32 \times 10 = 320$ bits. Divide by the bit rate:

$$
\frac{320}{115\,200}\,\mathrm{s} = 2.78\times10^{-3}\,\mathrm{s} = 2.78\,\mathrm{ms}.
$$

Even the simplest bus on the list has a transfer time you can compute, and it belongs in the budget the moment it sits on a path with a deadline. $2.78\,\mathrm{ms}$ is more than a quarter of a $10\,\mathrm{ms}$ control frame. Treating a UART transfer as instant because it is "only a serial port" is the same mistake as leaving a bus out of a schedulability proof that counts every millisecond of CPU time.

Sanity check: $115\,200$ baud is $11\,520$ bytes per second with ten bits each, so $32$ bytes take $32 / 11\,520 \approx 0.00278\,\mathrm{s}$. Same answer.
:::

## Check yourself

::: check
A developer writes a busy-wait loop on a hardware status register, using an ordinary (non-`volatile`) pointer. The compiler reads the register once before the loop, then spins checking that saved copy. What goes wrong, and what does adding `volatile` to the register's type fix?
:::

::: answer
Without `volatile`, the compiler sees that nothing in the program writes to that address, so it concludes the value cannot change. It may read it once, before the loop, and keep the copy in a processor register. The loop then spins forever on a stale value, even though the hardware has already updated the real register — the sticky note on the mailbox.

Declaring the register `volatile` forces the compiler to read the real memory location on every pass. The loop then sees the hardware's current value each time and can notice the change it is waiting for.
:::

::: check
A shared "data ready" flag is declared `volatile`. An interrupt handler sets it, and the task it wakes reads it. A reviewer says this is not enough on a multi-core system. What is missing, and what should replace the plain `volatile` flag?
:::

::: answer
`volatile` only stops the compiler from caching or reordering accesses to that one object. It says nothing about the processor at run time — out-of-order execution, write buffers, or whether one core's write becomes visible to another core before or after the writes around it.

So on a multi-core system, the task could see the flag set while still reading old values of the very data the flag was meant to announce. Nothing orders the two.

The fix is an atomic type with an explicit memory ordering: typically a release store when setting the flag, paired with an acquire load when reading it. That gives the cross-core visibility and ordering guarantee `volatile` was never designed to supply.
:::

::: check
Why is CAN called "fixed-priority scheduling, built into the wires"? How does its arbitration avoid the collide-and-retry pattern of old shared-cable Ethernet?
:::

::: answer
Every CAN message carries an identifier that both names it and sets its priority: a numerically lower identifier wins. When two nodes send at once, each compares the bit it sends with the bit on the bus. A node sending a recessive $1$ while the bus shows a dominant $0$ — from a competing message with a lower identifier — detects the mismatch and stops immediately. The winning message is not damaged, so no data is lost.

That is lesson two's fixed-priority scheduling, enforced by how the bus behaves electrically instead of by a software scheduler. Engineers then choose the identifiers the same way lesson two assigns priorities — for example, most urgent or shortest period gets the lowest identifier.

Old shared-cable Ethernet did the opposite. It let the collision happen, noticed it afterwards, and made every sender involved wait a random time and try again. That scheme has no priority structure and no promise of when a frame gets through — after sixteen failed tries, the frame is simply dropped.
:::

::: check
A team needs both large bulk transfers (camera images) and a hard-deadline command channel on the same physical network. They are considering plain switched Ethernet for both. What is the risk, and what kind of solution does this lesson point to?
:::

::: answer
Plain switched Ethernet, even without collisions, has no priority structure that bounds how long a command waits behind bulk traffic already queued at a switch. A hard deadline sharing a wire with unbounded best-effort traffic is exactly the unbounded blocking lesson five warned about — now at the network level instead of inside one processor.

The solution is a time-triggered add-on to Ethernet, such as TTEthernet or IEEE 802.1 Time-Sensitive Networking. It reserves scheduled time slots for the critical command traffic on the same hardware that carries the bulk images. The command channel gets a bound the plain protocol cannot give, without a second, separate network.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Memory-mapped I/O | Device registers addressed like ordinary memory; the compiler cannot tell them apart without help |
| `volatile` | Forces every read and write to appear in the machine code, in order — a rule for the compiler only |
| What `volatile` is not | A synchronization primitive: no atomicity, no ordering between threads or cores |
| Atomics | Indivisible reads and writes with an explicit memory order; the right tool between threads |
| Device driver | The one place raw, `volatile` register access lives; everything else uses its interface |
| UART / RS-422 | Simple, point-to-point, asynchronous; RS-422 adds long cable runs and noise immunity |
| SPI | Shared clock, one chip-select per device, fast, no error checking |
| I2C | Shared, addressed, two wires; clock stretching risks delay the protocol does not tightly bound |
| CAN | Differential, multi-master; the identifier sets priority; bitwise arbitration is fixed-priority scheduling in hardware |
| CAN frame time | Worst case $135$ bits for $8$ data bytes: $270\,\mathrm{\mu s}$ at $500\,\mathrm{kbit/s}$ |
| Ethernet / UDP | High bandwidth, no small bound without extra scheduling |
| Time-triggered (TTEthernet, TSN) | Reserved time slots for critical traffic, sharing wires with bulk best-effort traffic |

Buses move data between chips. The next lesson asks a question that sits above any one bus: which instant does a piece of data really belong to, how does every board on a vehicle agree on that instant, and where does the line fall between a bare-metal microcontroller and a full Linux flight computer?

::: context what-a-register-is Registers, two kinds
The word **register** means two different things in this course. A *processor* register is one of the handful of tiny, very fast storage slots inside the processor where arithmetic happens. A *device* register is a storage slot inside a peripheral, like a sensor or a serial port, with a fixed job. Memory-mapped I/O makes device registers look like memory addresses. The "keep a copy" trick in this lesson is the compiler moving a device register's value into a processor register and never reading the device again.
:::

::: context synchronization-primitive What "synchronization" means here
Two threads **synchronize** when one can be sure it sees the other's work, complete and in the right order. The tools that give that promise — mutexes, semaphores, atomics — are called synchronization primitives. You met mutexes and semaphores in lessons four and five. Each one makes a promise about the running machine, not just about how the compiler writes code, and that is exactly the promise `volatile` lacks.
:::

::: context tearing Reading a number half-written
Suppose a 64-bit timestamp is stored as two 32-bit halves, and the processor can only write 32 bits at a time. The writer changes the low half, then the high half. A reader who looks between those two writes gets the new low half glued to the old high half — a value that was never true.

When a counter rolls over from $0\mathrm{x}0000\,0000\,\mathrm{FFFF\,FFFF}$ to $0\mathrm{x}0000\,0001\,0000\,0000$, a torn read can come out about $4.3$ billion ticks wrong ($2^{32} = 4\,294\,967\,296$). `volatile` does nothing to prevent this. An atomic type does.
:::

::: context memory-ordering Release and acquire, in words
A **release** store says: "everything I wrote before this is finished and visible to anyone who sees this store". An **acquire** load says: "once I see that store, I also see everything written before it". Together they work like sealing an envelope: the writer puts the data in, then seals it (release); the reader checks the seal (acquire) and knows the contents are complete. Without that pair, a multi-core processor is allowed to let another core see the seal before the contents.
:::

::: context clock-or-no-clock Keeping time with or without a clock wire
With a clock wire, the sender ticks a shared beat and the receiver reads one bit per tick, so the two can never drift apart. Without one, both ends agree on a speed and each keeps its own time. The receiver restarts its count at the edge of every start bit, which is why a UART frame begins with one, and why a mismatch of a few percent between the two clocks is enough to garble the data.
:::

::: context uart-frame One byte on a UART wire
Here is the letter "A" (hexadecimal $41$, binary $0100\,0001$) in $8\mathrm{N}1$ framing. The line rests high. A low start bit announces the byte, the eight data bits follow lowest bit first, and a high stop bit ends it: ten bits for eight bits of data.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5"
    points="10,30 40,30 40,70 70,70 70,30 100,30 100,70 250,70 250,30 280,30 280,70 310,70 310,30 350,30"/>
  <g stroke="#8fb8f0" stroke-width="1">
    <line x1="40" y1="20" x2="40" y2="80"/><line x1="70" y1="20" x2="70" y2="80"/>
    <line x1="100" y1="20" x2="100" y2="80"/><line x1="130" y1="20" x2="130" y2="80"/>
    <line x1="160" y1="20" x2="160" y2="80"/><line x1="190" y1="20" x2="190" y2="80"/>
    <line x1="220" y1="20" x2="220" y2="80"/><line x1="250" y1="20" x2="250" y2="80"/>
    <line x1="280" y1="20" x2="280" y2="80"/><line x1="310" y1="20" x2="310" y2="80"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="96">start</text>
    <text x="85" y="96">1</text><text x="115" y="96">0</text><text x="145" y="96">0</text><text x="175" y="96">0</text>
    <text x="205" y="96">0</text><text x="235" y="96">0</text><text x="265" y="96">1</text><text x="295" y="96">0</text>
    <text x="330" y="96">stop</text>
  </g>
  <text x="175" y="114" font-size="11" text-anchor="middle" fill="#6c7a93">data bits, lowest first: 0x41 = "A"</text>
  <text x="20" y="22" font-size="11" fill="#6c7a93">idle</text>
</svg>
```
:::

::: context clock-stretching Why I2C can hang
On I2C, every device can only pull a wire low, never drive it high — a resistor pulls it high when nobody is pulling. So a slow device can hold the clock low for as long as it needs, and the master must wait. A device that crashes while holding a wire low can freeze the whole bus. That is why flight drivers for I2C add their own timeouts and a bus-recovery routine; the related SMBus standard even sets a timeout of about $25$ to $35\,\mathrm{ms}$ for this reason.
:::

::: context can-arbitration Two nodes, one wire, one winner
Node A sends identifier $0\mathrm{x}123$ and node B sends $0\mathrm{x}127$ at the same instant. The first eight bits match. At the ninth, A sends a dominant $0$ and B a recessive $1$; the bus shows $0$, B sees the mismatch and drops out. A's frame continues, undamaged.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="8" y="38">A 0x123</text><text x="8" y="72">B 0x127</text><text x="8" y="106">bus</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="84" y="38">0</text><text x="108" y="38">0</text><text x="132" y="38">1</text><text x="156" y="38">0</text>
    <text x="180" y="38">0</text><text x="204" y="38">1</text><text x="228" y="38">0</text><text x="252" y="38">0</text>
    <text x="276" y="38" fill="#1d6fd1" font-weight="700">0</text><text x="300" y="38">1</text><text x="324" y="38">1</text>
    <text x="84" y="72">0</text><text x="108" y="72">0</text><text x="132" y="72">1</text><text x="156" y="72">0</text>
    <text x="180" y="72">0</text><text x="204" y="72">1</text><text x="228" y="72">0</text><text x="252" y="72">0</text>
    <text x="276" y="72" fill="#b4232c" font-weight="700">1</text>
    <text x="84" y="106">0</text><text x="108" y="106">0</text><text x="132" y="106">1</text><text x="156" y="106">0</text>
    <text x="180" y="106">0</text><text x="204" y="106">1</text><text x="228" y="106">0</text><text x="252" y="106">0</text>
    <text x="276" y="106">0</text><text x="300" y="106">1</text><text x="324" y="106">1</text>
  </g>
  <rect x="264" y="22" width="24" height="94" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="72" font-size="11" fill="#b4232c">B stops</text>
  <text x="180" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">11 identifier bits, most significant first; 0 is dominant</text>
</svg>
```
:::

::: context bit-stuffing Why CAN adds extra bits
CAN has no clock wire, so receivers keep in step by watching for edges where the signal flips. A long run of identical bits has no edges. So after five identical bits in a row, the sender inserts one opposite bit, and receivers remove it. The worst case — data arranged to force a stuffed bit as often as possible — is what makes a nominal $111$-bit frame take up to $135$ bits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="47" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="64" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="81" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="98" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="115" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="132" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="149" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="166" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="183" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="200" y="30" width="34" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="217" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">1</text>
  <rect x="234" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="251" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="268" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="302" y="30" width="34" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="319" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">0</text>
  <line x1="30" y1="76" x2="200" y2="76" stroke="#1d6fd1" stroke-width="2"/>
  <text x="115" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">five identical bits</text>
  <text x="217" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">stuffed bit</text>
  <text x="268" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">data continues</text>
</svg>
```
:::

::: context tsn Where time-triggered Ethernet flies
TTEthernet was developed from Hermann Kopetz's time-triggered architecture research — his book is on this module's resource list — and NASA's Orion spacecraft uses it for its onboard network. The IEEE 802.1 Time-Sensitive Networking standards bring similar scheduled traffic to ordinary Ethernet switches, and are spreading through cars and factories. Both depend on every node sharing one accurate clock, which is exactly the subject of the next lesson.
:::
