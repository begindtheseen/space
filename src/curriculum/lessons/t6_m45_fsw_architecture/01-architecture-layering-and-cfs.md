---
id: l01-architecture-layering-and-cfs
title: Architecture layering, and NASA cFS as a reference
minutes: 22
covers:
  - "Layering: hardware abstraction, device managers, the GNC application, the mode manager, telemetry and command"
  - "NASA core Flight System as a public reference architecture: apps, the software bus, tables"
---

Think about a busy restaurant. The chef does not unload the delivery truck. The prep cooks wash, chop and label the vegetables, so the chef gets "500 g diced onion" instead of a muddy sack. The manager decides whether the kitchen is serving breakfast, serving lunch, or closed because the fryer caught fire. The waiters take orders from the dining room and bring back news of how things are going. Orders travel on paper tickets clipped to a rail, so nobody has to shout across the kitchen.

Each person has one job, and each hands the next person something cleaner and more meaningful than what they received. Swap in a new onion supplier and the chef never notices. That is not an accident of this one restaurant. It is how every kitchen that works is organized.

Flight software is organized the same way. If you have written estimators and controllers, you may picture flight software as one program: read the sensors, run the filter, run the controller, write the actuators, repeat. That picture is right for one control loop on a bench. It is not what flies. What flies splits the work into **layers** — separate pieces of software, each with one job, stacked so that each talks only to its neighbors through a narrow, well-defined interface. This lesson gives you the layers and the reasons for them. Then it shows you a real, public flight software framework, NASA's **core Flight System (cFS)**, that you can download, build and read. Every later lesson in this module — the mode manager, the voting, the fault detection — is a statement about which layer does what.

## The five layers

Read a flight software stack from the hardware up, and **[[five layers|layer-cake]]** appear. Each has its own job and its own reason to exist as a separate piece.

**Hardware abstraction.** This is the lowest software above the chips. It is often called the **HAL** (hardware abstraction layer) or **BSP** (board support package). It knows the **[[register|registers]]** map of one specific processor, the timing of one specific wire protocol such as an **[[SPI or I2C bus|serial-buses]]**, and which interrupt goes where. Its job is to turn "write these bits to this address" into a few named operations — `spi_transfer`, `gpio_set`, `timer_read` — that look the same whatever processor sits underneath. Nothing above this layer should contain a register address or a bus timing constant.

**Device managers.** A **device manager** owns one physical instrument — a gyro, a GNSS receiver, a valve driver — and turns the HAL's raw bytes into a typed, checked measurement in physical units. Here a raw **[[ADC count|adc-counts]]** becomes a rotation rate in degrees per second. A status byte becomes a true-or-false `health_ok`. A bus timeout becomes an explicit "no data" instead of silence. The device manager also owns the checks that belong to *that* device: its checksum format, its valid range, its units. It is the prep cook.

**The GNC application.** This is the physics code: the state estimator, the guidance law, the controller. It receives typed, checked inputs in physical units and produces typed commands for the device managers to send out. It does not know whether a rate came from a tiny MEMS gyro on an SPI bus or a fiber-optic gyro on a serial line, and it must not need to know. Every estimation and control lesson you have done so far was written from inside this one layer. It is the chef.

**The mode manager.** Something has to decide *which* GNC behavior runs right now — ascent guidance, coast attitude hold, entry guidance, safe mode — and make sure only allowed changes between them happen. That is a supervising decision, different in kind from anything the estimator computes. Lesson 2 builds it as an explicit state machine. It is the restaurant manager.

**Telemetry and command.** This is the door to the outside world. **Telemetry** packages the vehicle's internal state and sends it to the ground or a crew display. **Command** accepts instructions from the ground or crew and turns them into internal requests. It is one shared service that every other layer uses, not something each piece reinvents. Lesson 3 covers it in detail. These are the waiters.

Between the pieces runs a **message bus** — the ticket rail. Applications hand each other data by posting messages on it, never by reaching into each other's code.

::: key
Standard flight software layering: hardware abstraction, device managers, the GNC application, the mode manager, and command/telemetry services — with a message bus between them so applications do not call each other directly. Each layer gives the one above a narrower, more meaningful interface, and nothing above a layer needs to know how that layer does its job.
:::

## Why a boundary is a boundary

The lines are not drawn to make a pretty diagram. Keeping them sharp buys three real engineering properties.

**Reuse.** A guidance law tested against a simulated device manager — one that returns made-up rates instead of real sensor bytes — is the same code that flies. Swap the device manager for a different sensor, or move the whole application to a different airframe with the same kind of sensors, and the GNC application does not change. That is why a company that builds several vehicles can share one estimator and controller codebase across them. The layering is what makes that sharing safe instead of lucky. (Reuse still demands that you re-check the old code's assumptions against the new vehicle — the most famous rocket loss caused by **[[reused code|ariane-501]]** is the proof.)

**Independent review.** Each layer can be checked against a narrower specification than the whole system. A device manager's job is fully described by "take these raw bytes, produce this typed value, run these validity checks." A reviewer can check that without understanding the guidance law it feeds. A guidance law's job is fully described in physical quantities, so its reviewer can check the mathematics without knowing which bus the gyro sits on. Collapse the layers, and every review must hold the entire stack in mind at once.

**Fault containment.** **Fault containment** means keeping a problem inside the piece where it started. When a device manager gets malformed data, it can refuse to pass it up, instead of letting the GNC application try to make sense of garbage. And when faults are injected in testing — a stuck sensor, a dropped packet — they arrive at the GNC application's input, exactly where a fault detector is meant to see them. In one big program, nothing separates "the sensor lied" from "the estimator has a bug."

::: warning Layers organize; they do not detect
Layering says where code lives and what it may assume. It is not a fault-tolerance mechanism by itself. A bug *inside* the GNC application — a sign error in a gain, a wrong frame transform — is not caught because the layer exists. Layering gives fault detection and redundancy (lessons 5 through 10) a clean place to attach. It does not do that detection for them.
:::

## Hardware abstraction and device managers in code

The easiest way to see the value of the HAL and device-manager split is to write two drivers for two quite different gyros and put the same interface in front of both.

The first gyro reports raw counts. Its data sheet says it produces 131 counts for every degree per second of rotation. So to get a rate you divide: a reading of 4213 counts means $4213 / 131 \approx 32.16$ degrees per second. The second gyro already does that arithmetic inside itself and sends a rate in degrees per second directly.

::: example Two gyro drivers, one device-manager interface
```python
class GyroDriverA:
    """Talks to a gyro over SPI; the raw interface returns ADC counts."""
    def read_raw_counts(self):
        return 4213

    def read_rate_dps(self):
        counts_per_dps = 131.0
        return self.read_raw_counts() / counts_per_dps


class GyroDriverB:
    """Talks to a different gyro over a serial bus; it already reports
    engineering units, so its device manager does less conversion."""
    def read_rate_dps(self):
        return 32.15


class DeviceManager:
    """The layer the GNC application actually talks to. It never learns
    which physical part or bus produced the number."""
    def __init__(self, driver):
        self._driver = driver

    def gyro_rate_dps(self):
        return self._driver.read_rate_dps()


for name, driver in [("GyroDriverA (SPI, raw counts)", GyroDriverA()),
                      ("GyroDriverB (serial, engineering units)", GyroDriverB())]:
    dm = DeviceManager(driver)
    print(f"{name}: device manager reports {dm.gyro_rate_dps():.3f} deg/s")
# GyroDriverA (SPI, raw counts): device manager reports 32.160 deg/s
# GyroDriverB (serial, engineering units): device manager reports 32.150 deg/s
```

Walk through what happened. Driver A read 4213 counts and divided by 131, giving 32.160 deg/s. Driver B had no conversion to do and returned 32.150 deg/s. Both answers came out through the same call, `gyro_rate_dps()`.

Now the sanity check. The two gyros measure the same spin and agree to within 0.01 deg/s, about 0.03 percent — the kind of small difference two real sensors always show. A GNC application written against `DeviceManager` cannot tell which gyro is underneath. If the vehicle changes gyro supplier between builds, one driver class changes and nothing else does.
:::

## A real reference: NASA's core Flight System

A layer diagram is easier to trust once you have seen it as running code. NASA's **core Flight System** is a flight software framework built at NASA's Goddard Space Flight Center, **[[flown on real missions|cfs-history]]**, and released as open source. You can clone it, build it and run its sample mission on a laptop. It is a direct, concrete example of the layers above.

cFS has three tiers:

- **At the bottom**, an **[[operating system abstraction layer and a platform support package|osal-psp]]**. Together these play the HAL's role. They hide which real-time operating system and which circuit board are underneath, so the same application code runs on a flight computer or on your laptop.
- **In the middle**, the **core Flight Executive (cFE)**: a small set of services every application uses. **Executive Services** start, stop, restart and keep track of applications. The **Software Bus** carries messages between them. **Table Services** load and check configuration data kept separately from code. **Time Services** give everyone one shared clock. **Event Services** give everyone one shared path for reporting events ("valve 3 opened", "checksum failed"). A small File Services piece handles standard file headers.
- **At the top**, the **apps**: independently written programs that play the device-manager, GNC, mode-manager and telemetry-and-command roles. The sample mission includes a Command Ingest app, which receives commands from the ground, and a Telemetry Output app, which sends packets down.

### The software bus: publish and subscribe

The rule that holds cFS together is simple. Every app **publishes** the messages it produces and **subscribes** to the messages it needs. Each kind of message has a number, its **message ID**. No app calls another app's functions, holds a pointer into another app's data, or even knows another app exists. It only knows the message IDs it sends and receives. That pattern is called **[[publish/subscribe|pub-sub]]**, and it is the ticket rail from the restaurant.

::: example A minimal publish/subscribe software bus
```python
class SoftwareBus:
    def __init__(self):
        self._subscribers = {}

    def subscribe(self, msg_id, app_name, callback):
        self._subscribers.setdefault(msg_id, []).append((app_name, callback))

    def publish(self, msg_id, payload):
        delivered = []
        for app_name, callback in self._subscribers.get(msg_id, []):
            callback(payload)
            delivered.append(app_name)
        return delivered


bus = SoftwareBus()
MSG_ID_GYRO_RATE = 0x0AA1
MSG_ID_MODE_CHANGE = 0x0BB2

received_by_nav, received_by_fdir, received_by_recorder = [], [], []
bus.subscribe(MSG_ID_GYRO_RATE, "NAV", lambda p: received_by_nav.append(p))
bus.subscribe(MSG_ID_GYRO_RATE, "FDIR", lambda p: received_by_fdir.append(p))
bus.subscribe(MSG_ID_MODE_CHANGE, "RECORDER", lambda p: received_by_recorder.append(p))

delivered = bus.publish(MSG_ID_GYRO_RATE, {"rate_dps": 0.42})
print(f"publish GYRO_RATE -> delivered to: {delivered}")
# publish GYRO_RATE -> delivered to: ['NAV', 'FDIR']

delivered2 = bus.publish(MSG_ID_MODE_CHANGE, {"mode": "SAFE"})
print(f"publish MODE_CHANGE -> delivered to: {delivered2}")
# publish MODE_CHANGE -> delivered to: ['RECORDER']
```

Step by step: the bus keeps a dictionary from each message ID to a list of subscribers. Three subscriptions go in — navigation and fault detection both want gyro rates, a recorder wants mode changes. Publishing a gyro rate walks that message's list and hands the payload to NAV and FDIR. Publishing a mode change reaches only the recorder.

Notice what the publisher did *not* need. The app publishing `MODE_CHANGE` has no idea a recorder exists. It would make the identical call with zero subscribers or ten. And navigation and fault detection (FDIR, for fault detection, isolation and recovery) both receive the same gyro message independently. That is exactly the shape lesson 9 needs: a residual monitor that watches the same data the navigation filter uses, without being wired into the filter's insides.
:::

### What the software bus buys

The publish/subscribe structure turns the three promises of layering into real mechanics.

**Reuse.** An app's only contract with the rest of the system is its list of message IDs. So an app written for one mission can be copied to the next and rebuilt, with no function signatures or shared data structures to untangle.

**Restart and containment.** Executive Services can stop, restart or reload one app without restarting the whole computer, because no other app depends on that app's internal state. There is an honest limit here. On most cFS platforms the apps are **[[tasks that share one memory space|threads-vs-processes]]**, not walled-off processes. A wild pointer in one app can still scribble on another app's memory. The message-only rule keeps apps from depending on each other *by design*; it does not make a memory bug physically impossible.

**Tables.** Table Services lets every app load its tunable numbers — gains, limits, schedules — from a data file. The file is checked when it loads and can be replaced without recompiling or relinking the app. Lesson 12 returns to this under the name *configuration management*: "what the vehicle does" lives in the code, "how the vehicle is tuned" lives in tables, and the two change on different schedules.

### The life of an app

Every cFS app follows the same simple life story. Knowing it helps when you read real cFS code.

1. **Register.** Executive Services starts the app, and the app registers itself.
2. **Set up.** The app creates a **pipe** — its personal inbox on the software bus — subscribes to the message IDs it needs, and loads its tables.
3. **Run.** The app enters its main loop: wait for a message on its pipe, handle it, publish any results, report that it is still running, and go back to waiting. Many apps are woken by a periodic "wake up" message from a scheduler app, which is how a 50 Hz control loop gets its beat.
4. **Get watched.** Each app keeps counters that go up as it works. A **[[Health and Safety app|health-and-safety]]** checks those counters. If an app stops checking in, it can report the problem, restart the app, or in the worst case reset the processor.
5. **Exit.** When commanded to stop, or on a fatal error, the app leaves its loop and Executive Services cleans up after it.

::: warning A running app is not a correct app
Step 4 only tells you that an app keeps looping. An app can check in on time, every time, while computing garbage — a bad gain, a flipped sign, a diverged filter. Lesson 8 makes this point about watchdog timers, and it applies to health counters just the same.
:::

## Check yourself

::: check
A device manager for a radar altimeter hands the GNC application a number in meters that it has already checked is not negative and not stale. What work did it do that the HAL below it did not? And why does the GNC application need that work already done?
:::

::: answer
The HAL stops at moving bytes across a bus reliably. It can hand the device manager a block of raw serial data, but it has no idea what a "valid" or "stale" altimeter reading looks like — that needs knowing what an altimeter is. The device manager turns those bytes into a physical quantity, checks it against the sensor's valid range and freshness limit, and only then passes a number up.

The GNC application needs that done first because its estimator assumes every input is already a meaningful, current measurement. Putting range and staleness checks inside the estimator would mean repeating them in every algorithm that ever touches altimeter data. Get one copy wrong, and a value nobody inspected goes straight into the filter.
:::

::: check
Two engineers argue about where this code belongs: "if the last GNSS fix is more than 250 ms old, mark GNSS invalid." One says inside the navigation filter, since the filter cares whether the fix is valid. The other says in the GNSS device manager. Which fits this lesson's layering better, and why?
:::

::: answer
The device manager. The filter cares about the *consequence* of a stale fix — it should not use it. But the *test* for staleness needs only the timestamp and the 250 ms limit. Nothing in the filter's model is involved.

Put in the device manager, the check runs once, in the one place that owns the sensor's timing, and every user of GNSS data gets the same validity flag through the same interface. Put inside the filter, every other user — a fault monitor, a telemetry formatter, a ground display — must copy the test or go without it. The general rule: a check belongs at the lowest layer that has everything it needs to do the check.
:::

::: check
In the software-bus example, a third app is added later that also wants mode-change messages. What must change in the mode manager's code?
:::

::: answer
Nothing. The mode manager's only action is `bus.publish(MSG_ID_MODE_CHANGE, payload)`. It keeps no list of recipients and does not know a new subscriber exists. The new app calls `bus.subscribe(MSG_ID_MODE_CHANGE, ...)` in its own setup, and the next publish reaches it along with everyone else. Adding a listener is a one-sided change made entirely in the listener's own code. That is the payoff of publish/subscribe over direct function calls.
:::

::: check
cFS runs each app as its own separately started task with its own pipe, instead of as a function called from one big control loop. Message passing costs some time. What does the design buy in return? And what does it *not* buy on a platform where all the apps share one memory space?
:::

::: answer
It buys independence. Each app can be started, stopped, restarted or reloaded by Executive Services on its own, without restarting the whole flight computer, because no other app depends on its internals. Its only contract is its list of published and subscribed message IDs, which is what lets it be dropped into another mission's build. Each task can also get its own priority and its own wake-up rate.

It does not buy hardware memory protection. When the apps are tasks in one shared memory space, a memory-corrupting bug in one app can still damage another's data. The message-only interface removes *designed-in* dependence between apps; it cannot stop an accidental wild write. Walled-off memory needs an operating system that gives each app its own protected space.
:::

::: check
A reviewer must approve a new guidance law before flight. Under this lesson's layering, what does the reviewer need to know about the specific IMU (inertial measurement unit) on the vehicle? What does that answer depend on?
:::

::: answer
In principle, nothing. The guidance law lives in the GNC application layer. It receives typed, checked state estimates in physical units and has no interface to any specific sensor. The reviewer checks the guidance mathematics against its specification in those units.

That holds only while the layering is kept clean. If the guidance code has a special case for one IMU's known quirk, or reads a raw field the device manager was supposed to hide, the reviewer now has to understand the sensor too. The boundary has been quietly broken by the code that crossed it.
:::

## Summary

| Layer or idea | Job | Does not know about |
| --- | --- | --- |
| Hardware abstraction (HAL/BSP) | Talk to one specific bus and processor | Anything above raw registers and bytes |
| Device manager | Typed, checked, physical-unit data for one instrument | Other devices, the GNC algorithms |
| GNC application | Estimation, guidance, control | Which sensor or bus produced its inputs |
| Mode manager | Decides which GNC behavior is active | The insides of the estimator or controller |
| Telemetry and command | The door to ground and crew | Which app produced or will use a value |
| Message bus | Carries messages by ID; apps never call each other | What any subscriber does with a message |
| cFE (cFS core) | Executive, software bus, tables, time, events | App internals |

The next lesson takes the mode-manager layer named here and builds it as an explicit state machine: a table of states, guard conditions and transitions, with a guaranteed way to reach safe from everywhere.

::: context layer-cake The stack at a glance
Each layer talks down to the one below through a narrow interface and hands a cleaner, more meaningful product up. The bus on the side is how applications pass messages without calling each other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="10" width="250" height="32" fill="#8fb8f0"/>
    <rect x="20" y="46" width="250" height="32" fill="#fff"/>
    <rect x="20" y="82" width="250" height="32" fill="#8fb8f0"/>
    <rect x="20" y="118" width="250" height="32" fill="#fff"/>
    <rect x="20" y="154" width="250" height="32" fill="#f2b880"/>
    <rect x="290" y="10" width="50" height="176" fill="#fff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="145" y="31">Telemetry and command</text>
    <text x="145" y="67">Mode manager</text>
    <text x="145" y="103">GNC application</text>
    <text x="145" y="139">Device managers</text>
    <text x="145" y="175">Hardware abstraction</text>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="315" y="90">message</text>
    <text x="315" y="104">bus</text>
  </g>
</svg>
```
:::

::: context registers What a register is
A **register** is a tiny storage slot built into a chip, usually 8, 16 or 32 bits wide, sitting at a fixed address. Writing a pattern of bits to one register might switch on a timer. Reading another might return the last byte a sensor sent. Each chip has its own map of which address does what, printed in its data sheet. Code full of those addresses works on exactly one chip, which is why the HAL keeps them all in one place.
:::

::: context serial-buses SPI and I2C
Both are ways for a processor to talk to nearby chips over a few wires. **SPI** (serial peripheral interface) uses a clock wire, a wire in each direction and a "chip select" wire per device; it is fast and simple. **I2C** (inter-integrated circuit, said "I squared C") uses only two wires shared by many devices, each with an address; it is slower but saves pins. Flight hardware also uses sturdier buses such as RS-422 serial lines and MIL-STD-1553. The HAL hides which one a sensor uses.
:::

::: context adc-counts Where 131 counts per degree per second comes from
An **ADC** (analog-to-digital converter) turns a voltage into a whole number, a **count**. A gyro with a 16-bit signed output has counts from −32,768 to +32,767. If the part is set to measure up to ±250 degrees per second, then

$$
\frac{32\,768}{250} \approx 131 \ \text{counts per deg/s}.
$$

Set it to a wider range and each count stands for more rotation. That scale factor lives in the device manager, and nowhere else.
:::

::: context ariane-501 When reused code met a new rocket
On 4 June 1996, the first Ariane 5 broke up about 40 seconds after liftoff. Its inertial reference software had been reused from Ariane 4. One routine converted a horizontal-velocity value from a 64-bit floating-point number to a 16-bit integer. Ariane 5 flew a faster trajectory, the value no longer fit, and the conversion raised an error. The backup unit ran the same code on the same data and had already failed the same way. Reuse was not the mistake; reusing without re-checking the old assumptions against the new vehicle was. Lesson 6 explains why identical redundant copies give no protection against this kind of fault.
:::

::: context cfs-history Where cFS came from
cFS grew out of flight software work at NASA's Goddard Space Flight Center in the 2000s. Its core executive first flew on the Lunar Reconnaissance Orbiter, launched in 2009, and the framework has since been used on many NASA missions and on university and commercial small satellites. Because it is public, it is one of the few real flight architectures you can read line by line. The module's reading exercise asks you to build it and trace one command in and one telemetry packet out.
:::

::: context osal-psp Two thin layers at the bottom
The **OSAL** (operating system abstraction layer) gives apps one set of calls for tasks, queues, timers and files, whether the computer underneath runs VxWorks, RTEMS or Linux. The **PSP** (platform support package) handles the particular board: how it boots, where its memory is, how it resets. Together they are cFS's version of the HAL. They are why you can build the sample mission on a laptop running Linux and later run the same app code on a flight computer.
:::

::: context pub-sub Publish and subscribe, drawn
Publishers post a message with an ID. The bus looks up who subscribed to that ID and delivers a copy to each. Nobody on either side knows who is on the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="30" width="80" height="30" fill="#8fb8f0"/>
    <rect x="10" y="90" width="80" height="30" fill="#8fb8f0"/>
    <rect x="140" y="20" width="60" height="110" fill="#fff"/>
    <rect x="260" y="15" width="90" height="28" fill="#f2b880"/>
    <rect x="260" y="60" width="90" height="28" fill="#f2b880"/>
    <rect x="260" y="105" width="90" height="28" fill="#f2b880"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="90" y1="45" x2="140" y2="45"/>
    <line x1="90" y1="105" x2="140" y2="105"/>
    <line x1="200" y1="45" x2="260" y2="29"/>
    <line x1="200" y1="45" x2="260" y2="74"/>
    <line x1="200" y1="105" x2="260" y2="119"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="49">Gyro DM</text>
    <text x="50" y="109">Mode mgr</text>
    <text x="170" y="72">bus</text>
    <text x="305" y="33">NAV</text>
    <text x="305" y="78">FDIR</text>
    <text x="305" y="123">Recorder</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="115" y="38">GYRO</text>
    <text x="115" y="98">MODE</text>
  </g>
</svg>
```
:::

::: context threads-vs-processes Tasks, processes and memory walls
A **process** gets its own private memory; the operating system, helped by the processor's memory-protection hardware, stops other processes from touching it. A **task** (or thread) runs its own sequence of instructions but can share memory with other tasks. cFS apps are usually tasks in one shared space, which is fast and works on small real-time operating systems. Some operating systems used in avionics add hard partitions between software pieces, so that one partition cannot write into another or steal its time. That is containment enforced by hardware rather than by convention.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="160" height="80" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1f2a44"><rect x="22" y="40" width="40" height="40"/><rect x="70" y="40" width="40" height="40"/><rect x="118" y="40" width="40" height="40"/></g>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5"><rect x="190" y="30" width="48" height="60"/><rect x="246" y="30" width="48" height="60"/><rect x="302" y="30" width="48" height="60"/></g>
  <g fill="#f2b880" stroke="#1f2a44"><rect x="198" y="45" width="32" height="30"/><rect x="254" y="45" width="32" height="30"/><rect x="310" y="45" width="32" height="30"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="14">tasks: one shared memory</text>
    <text x="270" y="14">processes: separate walls</text>
    <text x="90" y="112">a stray write can cross</text>
    <text x="270" y="112">hardware blocks it</text>
  </g>
</svg>
```
:::

::: context health-and-safety Who watches the apps
The Health and Safety app is itself an ordinary cFS app. Each cycle it looks at every monitored app's execution counter. A counter that stops rising means that app has stopped looping. What happens next is set in a table: send an event to the ground, restart the app, or reset the processor. Lesson 8 treats the same idea in hardware as a watchdog timer, and explains why a reset is a real-time decision, not a free reflex.
:::
