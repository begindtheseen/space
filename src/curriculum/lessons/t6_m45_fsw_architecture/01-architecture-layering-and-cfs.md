---
id: l01-architecture-layering-and-cfs
title: Architecture layering, and NASA cFS as a reference
minutes: 18
covers:
  - "Layering: hardware abstraction, device managers, the GNC application, the mode manager, telemetry and command"
  - "NASA core Flight System as a public reference architecture: apps, the software bus, tables"
---

Every flight vehicle you will ever work on runs software built from the same handful of layers, in the same order, for the same reasons. A guidance engineer who has only ever written estimators and controllers tends to picture flight software as one program: read the sensors, run the filter, run the controller, write the actuators, repeat. That picture is correct for a single control loop running by itself on a bench. It is not what ships. What ships separates "talk to this specific piece of hardware" from "know what a gyro measurement means" from "decide what the vehicle is trying to do" from "tell the ground what happened," and it separates them on purpose, as distinct pieces of software with a narrow, typed interface between each pair.

This lesson gives you the layering and the reasons for it, then grounds the whole discussion in a real, publicly available flight software architecture — NASA's core Flight System (cFS) — so that "layering" stops being an abstract diagram and becomes something you can clone, build, and read. Everything else in this module assumes you have this picture: the mode manager of lesson 2, the voting of lessons 5 through 7, and the fault detection of lessons 8 through 10 are all statements about *which layer* does *what*, and none of them make sense if the layers themselves are not clear first.

## The five layers, and what crosses each boundary

Read a flight software stack from the hardware up, and five layers appear, each with a distinct job and a distinct reason for existing as its own layer rather than as code folded into its neighbor.

**Hardware abstraction (HAL/BSP).** The lowest software layer above the silicon. It knows the register map of a specific microcontroller, the timing of a specific SPI or I2C bus, the interrupt vector table of a specific processor. Nothing above this layer should contain a register address or a bus timing constant. Its job is to turn "write these bits to this register at this address" into a small set of named operations — `spi_transfer`, `gpio_set`, `timer_read` — that look the same regardless of which processor is under them.

**Device managers.** One layer up, a device manager owns a specific physical instrument — a gyro, a GNSS receiver, a valve driver — and turns the HAL's raw bytes into a typed, validated, physical-unit measurement or command. This is where a raw ADC count becomes a rate in degrees per second, where a status byte becomes a boolean `health_ok`, where a bus timeout becomes an explicit "no data" rather than silence. A device manager also owns the parts of data integrity that are specific to *that* device: its own checksum format, its own valid range, its own units.

**The GNC application.** This is the physics-aware code: the state estimator, the guidance law, the controller. It receives typed, physical-unit, validated inputs from the device managers below it and produces typed, physical-unit commands for the device managers to send onward. It does not know whether the rate it is reading came from a MEMS gyro over SPI or a fiber-optic gyro over a serial bus, and it must not need to know — every lesson on estimation and control you have already done was written from inside this one layer.

**The mode manager.** Above the GNC application, something has to decide *which* GNC behavior is running right now — ascent guidance, coast attitude hold, entry guidance, safe mode — and to enforce that only sanctioned transitions between those behaviors happen. That decision is a supervisory one, distinct in kind from anything the estimator or controller computes, and lesson 2 builds it as an explicit state machine.

**Telemetry and command.** The boundary to the outside world. Telemetry packages internal state for a ground station or crew display; command accepts instructions from the ground or crew and turns them into internal requests. This is a shared service used by every other layer, not something each app or driver reinvents — lesson 3 covers its structure in detail.

::: key
The five-layer stack, bottom to top: hardware abstraction (HAL/BSP) → device managers → the GNC application → the mode manager → telemetry and command. Each layer presents a narrower, more meaningful interface to the layer above it, and nothing above a layer needs to know how that layer does its job.
:::

## Why the boundary is a boundary, not a suggestion

The reason to draw these lines is not aesthetic. Three concrete engineering properties fall out of keeping them sharp.

**Reuse.** A guidance law tested against a simulated device manager — one that returns synthetic rates and positions instead of real sensor bytes — is the same code that flies. Swap the device manager underneath it for a different sensor model, or the vehicle underneath *that* for a different airframe with the same sensor suite, and the GNC application does not change. This is why a company that builds more than one vehicle keeps a shared estimator and controller codebase across vehicle programs: the layering is what makes that sharing safe rather than accidental.

**Independent verification.** Each layer can be reviewed, tested, and reasoned about against a narrower specification than the whole system. A device manager's job is fully specified by "accept these raw bytes, produce this typed value, and do these validity checks" — a reviewer can check it against that specification without understanding the guidance law it feeds. A guidance law's job is fully specified in terms of typed physical quantities — a reviewer can check its mathematics without knowing which bus the rate gyro sits on. Collapse the layers and every review has to hold the entire stack in mind at once.

**Fault containment.** When a device manager encounters malformed data, it can refuse to pass it upward rather than letting the GNC application try to make sense of garbage. When the GNC application is itself under test, faults injected below it — a stuck sensor, a dropped packet — arrive at its input exactly where a fault detector is meant to see them, not buried inside a monolith where nothing distinguishes "the sensor lied" from "the estimator has a bug."

::: warning
Layering is a statement about where code lives and what it is allowed to assume, not a fault-tolerance mechanism by itself. A software defect *inside* the GNC application layer — a sign error in a gain, a wrong frame transform — is not caught by the fact that the layer exists. Layering organizes the system so that fault detection and redundancy (lessons 5 through 10) have a clean place to attach; it does not perform that detection on its own.
:::

## Hardware abstraction and device managers in code

The value of the HAL/device-manager split is easiest to see by building two different drivers for physically different hardware and putting the same interface in front of both.

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
Both drivers end up reporting close to the same physical rate through the same `gyro_rate_dps()` call, but they get there by entirely different means: one divides a raw count by a scale factor it alone knows, the other has no conversion to do at all. A GNC application built against `DeviceManager` cannot tell which is underneath, and a vehicle that changes gyro vendor between builds changes one driver class and nothing else.
:::

## A public, buildable reference: NASA's core Flight System

Abstract layering is easier to trust once you have seen it as real, running code rather than a diagram. NASA's core Flight System (cFS) is a flight software framework used across multiple NASA missions and released as open source; you can clone it, build it, and run its sample mission on a workstation. It is a direct, concrete instance of the layering above, and it makes one architectural decision explicit that the abstract picture leaves implicit: it draws the boundary between the GNC-application layer and everything around it as a boundary between separate *processes* (or, in the terminology cFS uses, separate *apps*), each with its own address space, each independently started, stopped, and restarted, communicating only through a message bus.

cFS is built from a core flight executive (cFE) that provides four services common to every app — Executive Services (starting, stopping, and monitoring apps), the Software Bus (message passing), Table Services (loading and validating configuration data separately from code, the subject of lesson 12), and Time and Event Services (a shared time base and a shared logging/event-reporting path) — plus a platform support layer underneath that plays the HAL's role, and a set of independently developed apps on top that play the device-manager and GNC-application roles. Every app publishes the messages it produces and subscribes to the messages it needs; no app calls another app's internal functions, holds a pointer into another app's memory, or knows another app exists beyond the message identifiers it publishes and subscribes to.

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
The mode manager app publishing `MODE_CHANGE` does not know or care that a recorder app exists, and would emit the identical call whether zero apps or ten were subscribed. A navigation app and an FDIR app subscribed to the same `GYRO_RATE` message both receive it, independently, on the same publish — which is exactly the shape you need for lesson 9's residual monitor to watch the same data the navigation filter consumes, without being wired into the navigation filter's internals.
:::

This publish/subscribe structure is what makes the reuse and fault-containment arguments from the previous section concrete rather than aspirational. An app that crashes takes down its own process; Executive Services can detect that and restart it without the rest of the system losing its own state, because no other app held a direct reference into the crashed app's memory in the first place. An app written for one mission is reused on the next by copying its source tree and relinking, because its only contract with the rest of the system is the message identifiers it publishes and subscribes to — never a function signature or a shared data structure. And Table Services gives every app a way to load tunable data — gains, limits, schedules — from a file that is validated on load and can be updated without recompiling or relinking the app itself, which is the mechanism lesson 12 returns to under the name configuration management.

## Check yourself

::: check
A device manager for a radar altimeter returns a Python `float` in meters, already validated to be non-negative and non-stale. What work did it do that the HAL beneath it did not, and why does the GNC application above it need that work already done?
:::

::: answer
The HAL's job stops at moving bytes across a bus reliably — it can hand the device manager a block of raw serial data, but it has no notion of what a "valid" or "stale" altimeter reading looks like, because that requires knowing what an altimeter is. The device manager parses those bytes into a physical quantity, checks it against the sensor's known-valid range and freshness bound, and only then hands a float upward. The GNC application needs that work finished before it sees the value because its estimator assumes every input it receives is already a meaningful, current measurement — building range and staleness checks into the estimator's own code would mean repeating that logic in every algorithm that ever touches altimeter data, and getting it wrong once would corrupt the filter with a value nothing between the sensor and the math has ever inspected.
:::

::: check
Two engineers argue about where the following code belongs: "if the last GNSS fix is more than 250 ms old, mark GNSS invalid." One says it belongs inside the navigation filter, because the filter is what cares whether the fix is valid. The other says it belongs in the GNSS device manager. Which is closer to the layering this lesson describes, and why?
:::

::: answer
The device manager. The filter cares about the *consequence* of a stale fix — it should not incorporate one — but the *test* for staleness depends only on the timestamp and the freshness bound, neither of which involves anything the filter's model knows. Placing the check in the device manager means every consumer of GNSS data receives the same validity flag through the same typed interface, computed once, in the one place that owns the sensor's timing characteristics; placing it inside the filter means every other consumer of GNSS data — an FDIR monitor, a telemetry formatter, a ground display — has to reimplement the same test or go without it. The general rule this illustrates: a check belongs at the lowest layer that has everything it needs to perform the check and nothing else.
:::

::: check
In the software-bus example, `bus.publish(MSG_ID_MODE_CHANGE, ...)` was called with two apps subscribed to other message IDs and one subscribed to this one. If a third app were added later that also needed mode-change notifications, what would have to change in the mode manager app's code?
:::

::: answer
Nothing. The mode manager's only action is `bus.publish(MSG_ID_MODE_CHANGE, payload)`; it has no list of recipients to update and no knowledge that a new subscriber exists. The new app calls `bus.subscribe(MSG_ID_MODE_CHANGE, ...)` on its own initiative, and the next publish reaches it along with everyone else. This is the concrete payoff of publish/subscribe over direct function calls: adding a consumer is a one-sided change confined to the new consumer's own code.
:::

::: check
Why does cFS run each app as a separate process rather than as a function called from one big control loop, given that a single process would avoid the overhead of message passing between apps?
:::

::: answer
Running apps as separate processes means a fault inside one app — a crash, a hang, memory corruption — cannot directly corrupt another app's memory, because they do not share an address space; the operating system's process boundary enforces the isolation that a shared-loop design could only enforce by convention. It also means Executive Services can detect a failed app (through the OS or a heartbeat) and restart just that app, rather than the fault taking down or requiring a restart of the entire flight computer. The message-passing overhead is the price paid for fault containment and for the reuse property described earlier in this lesson — an app's only contract with the rest of the system is its published and subscribed message identifiers, which is what lets it be dropped into a different mission's build.
:::

::: check
A reviewer is asked to verify a new guidance law before it flies. Under the layering this lesson describes, what does the reviewer need to know about the specific IMU model installed on the vehicle, and what does that depend on?
:::

::: answer
In principle, nothing: the guidance law lives in the GNC application layer, which receives typed, physical-unit, validated state estimates and has no interface to any specific sensor. The reviewer's task is to check the guidance mathematics against its specification in those physical units. That independence holds only as long as the layering has actually been kept clean — if the guidance code contains a special case for one IMU's known quirk, or reads a raw field the device manager was supposed to abstract away, the reviewer now has to understand the sensor too, and the layer boundary has quietly been broken by the code that crossed it.
:::

## Summary

| Layer | Job | Does not know about |
| --- | --- | --- |
| Hardware abstraction (HAL/BSP) | Talk to a specific bus and processor | Anything above raw registers and bytes |
| Device manager | Typed, validated, physical-unit data for one instrument | Other devices, the GNC algorithms |
| GNC application | Estimation, guidance, control | Which physical sensor or bus produced its inputs |
| Mode manager | Supervises which GNC behavior is active | The internals of the estimator or controller |
| Telemetry and command | Boundary to ground/crew | Which app produced or will consume a given value |
| cFE (cFS core) | Executive, software bus, tables, time, events | App internals; delivers by message ID only |

The next lesson takes the mode-manager layer named here and builds it as an explicit state machine — a table of states, guard conditions, and transitions — the first of the two demonstrations this module is built around.
