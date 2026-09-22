---
id: l05-redundancy-architectures
title: Redundancy architectures, classical and modern
minutes: 20
covers:
  - "Redundancy architectures: cold, warm and hot standby; dual-dual; cross-strapping"
  - Commodity multi-core computers running Linux with redundant flight strings and voted output, as publicly described for modern launch and crew vehicles
---

"Add a backup computer" is not a single design decision; it is a family of them, and which member of the family you pick changes how fast the vehicle recovers from a failure, how much the redundancy costs in mass and power, and how much complexity you have taken on in exchange. This lesson works through that family — cold, warm, and hot standby, dual-dual configurations, and cross-strapped connectivity — and then looks at the architecture several modern launch and crew vehicles have publicly described using: multiple identical flight computers, built from commodity multi-core processors running Linux rather than radiation-hardened single-core silicon, voting on their outputs. Lessons 6 and 7 build the voting mechanics in full; this lesson is about the wiring and staffing choices that decide what gets fed into that vote in the first place.

## Cold, warm, and hot standby

**Cold standby** keeps a backup unpowered, or powered but uninitialized, until the primary fails. Bringing it into service means powering it up, running its self-tests, and initializing its internal state from scratch — the full boot sequence lesson 2's mode manager walks through, `BOOT` onward. It is the cheapest option in steady-state power and the slowest to recover.

**Warm standby** keeps a backup powered and running, but not tracking the primary's current internal state in real time; on failover it has to resynchronize — pull the current vehicle state from telemetry or a shared store — before its output can be trusted. Recovery is faster than cold standby because initialization is already done; it is not instant, because state resynchronization takes a finite, if short, amount of time.

**Hot standby** keeps a backup powered, running, and continuously tracking the same inputs and computing the same outputs as the primary, in real time, the whole time. Failover is close to instantaneous, because there is no boot and no resync — only a decision about which unit's already-current output to use.

The three differ almost entirely in one number: mean time to recover, and that number drives how much downtime a vehicle accumulates over a mission.

::: example Expected downtime over a mission, by standby type
```python
mtbf_hours = 20000.0          # given: mean time between primary-string failures
mission_hours = 24.0 * 30     # a 30-day mission

# unavailability ~= MTTR / MTBF when MTTR << MTBF (standard availability arithmetic)
for name, mttr_s in [("cold (reboot and initialize from scratch)", 45.0),
                      ("warm (resync state from telemetry)", 2.0),
                      ("hot (switch which output is already used)", 0.05)]:
    mttr_hours = mttr_s / 3600.0
    unavailability = mttr_hours / (mtbf_hours + mttr_hours)
    downtime_ms = unavailability * mission_hours * 3600.0 * 1000.0
    print(f"{name}: MTTR={mttr_s:.2f} s -> expected downtime over the mission = {downtime_ms:.3f} ms")
# cold (reboot and initialize from scratch): MTTR=45.00 s -> expected downtime = 1619.999 ms
# warm (resync state from telemetry): MTTR=2.00 s -> expected downtime = 72.000 ms
# hot (switch which output is already used): MTTR=0.05 s -> expected downtime = 1.800 ms
```
Recovery time enters this calculation directly and linearly: cutting it by roughly twenty-two-fold (forty-five seconds to two seconds, cold to warm) cuts expected downtime by the same factor. Whether that difference matters depends entirely on what the vehicle is doing during the seconds a cold standby needs to reboot — irrelevant during a long, unhurried coast, and potentially catastrophic during a landing burn measured in tens of seconds. This is the actual engineering question a standby-type choice answers: how much does a flight phase's own duration bound the recovery time you can tolerate.
:::

Hot standby is not free. Keeping a second unit continuously computing the same thing the primary computes means powering, thermally managing, and — if its output is meant to be trustworthy the instant it is needed — keeping it fed with exactly the same inputs as the primary, which raises the same state-consistency and determinism questions lesson 7 covers for voting generally. Warm standby's resynchronization step is itself a piece of software with its own correctness requirements: state pulled from telemetry has to be recent and complete enough that the newly active unit does not start from a wrong or partial picture of the vehicle. None of the three is categorically "correct" — a real vehicle typically uses different standby types for different subsystems, matched to how much recovery time each subsystem's worst-case operating phase can absorb.

## Dual-dual and cross-strapping

A single redundant pair — one primary, one backup — is redundant against the loss of one unit, but the pair itself can still be a single point of failure if both units share a bus, a power feed, or a sensor input. A **dual-dual** architecture answers this by doubling redundancy at more than one level simultaneously: two independent computers, each themselves connected to two independent sensor sets or buses, so that no single wire, connector, or shared component failure can take out every path between a sensor and every computer.

**Cross-strapping** is the specific wiring choice that makes dual-dual's second level of redundancy actually pay off: instead of computer A reaching only bus 1 and computer B reaching only bus 2, both computers are wired to reach both buses. Without cross-strapping, a failure of bus 1 takes computer A down along with it even though computer A itself is perfectly healthy, because it has no other way to reach data. With cross-strapping, the same bus failure leaves both computers still able to reach a working bus.

::: example Single-bus-failure coverage, with and without cross-strapping
```python
without = {"FC1": {"BUS1"}, "FC2": {"BUS2"}}
with_cs = {"FC1": {"BUS1", "BUS2"}, "FC2": {"BUS1", "BUS2"}}

def survivors(topology, failed_bus):
    return [fc for fc, buses in topology.items() if buses - {failed_bus}]

for label, topo in [("without cross-strap", without), ("with cross-strap", with_cs)]:
    print(f"{label}:")
    for bus in ["BUS1", "BUS2"]:
        print(f"  {bus} fails -> computers still able to reach a bus: {survivors(topo, bus)}")
# without cross-strap:
#   BUS1 fails -> computers still able to reach a bus: ['FC2']
#   BUS2 fails -> computers still able to reach a bus: ['FC1']
# with cross-strap:
#   BUS1 fails -> computers still able to reach a bus: ['FC1', 'FC2']
#   BUS2 fails -> computers still able to reach a bus: ['FC1', 'FC2']
```
Without cross-strapping, a single bus failure halves the number of computers still able to do useful work, even though every computer's own hardware is fine. With cross-strapping, the identical bus failure leaves both computers standing. This is the whole return on cross-strapping's investment: it converts "a bus failure takes out a computer" into "a bus failure takes out a bus," which is a strictly smaller claim.
:::

Cross-strapping is not without cost, and the cost is worth naming rather than glossing over. Every additional cross-strap connection is a physical wire, connector, and interface circuit that itself can fail, so the connectivity graph gets more complex exactly where you are trying to make failure analysis simpler. And cross-strapping raises a containment question that a non-cross-strapped design does not have to answer: if a misbehaving computer can reach a bus that other, healthy computers also depend on, its interface to that bus has to be electrically and logically isolated well enough that its fault cannot propagate onto the shared bus and take healthy computers down with it. Cross-strapping buys connectivity redundancy; it does not by itself buy fault isolation, and a design that adds the wiring without also handling that isolation question has only moved the single point of failure from "a bus" to "whatever stops one computer's fault from riding that bus to every other computer attached to it."

## Commodity multi-core computers, Linux, and voted output

Everything so far describes redundancy at the level of whole units and their wiring. A separate, more recent architectural choice concerns what each unit is actually built from. Traditionally, a flight computer's silicon was chosen for radiation tolerance first and raw compute second: a radiation-hardened, often single-core processor, selected because it resists the single-event upsets and total ionizing dose lesson 8 covers, at a significant cost in available compute per watt and per dollar relative to commercial silicon of the same era. Several modern launch and crew vehicle programs have publicly described a different trade: build each flight computer from a commodity multi-core processor of the kind found in commercial servers, running a general-purpose operating system such as Linux, and get the reliability a radiation-hardened single string would have bought from architecture instead — replication, comparison, and voting across multiple independently powered flight computers, each running the identical flight software.

The architecture publicly described for this style of avionics typically nests two levels of checking. Within one flight computer, two processor cores execute the identical software in lockstep on the identical inputs and compare their outputs continuously; if the two disagree, that computer has detected a fault in itself and excludes its own output from the next level rather than presenting a value it cannot vouch for. Across flight computers, several such units — commonly three, each independently powered and independently clocked — each produce a value (or abstain, per the lockstep check above), and a vote across the computers that did produce one settles the value that actually commands an actuator.

::: example Two levels of checking: lockstep within a computer, then a vote across computers
```python
def lockstep_output(core_a_value, core_b_value):
    if core_a_value == core_b_value:
        return core_a_value, True
    return None, False   # the two cores disagree: this computer abstains

computers = [
    ("FC1", 12.500, 12.500),
    ("FC2", 12.500, 12.500),
    ("FC3", 9.100, 12.480),   # a fault inside FC3 -- its own two cores disagree
]

votes = []
for name, a, b in computers:
    value, agree = lockstep_output(a, b)
    print(f"{name}: core_a={a}, core_b={b} -> "
          f"{'value=' + str(value) if agree else 'cores disagree, self-excluded from the vote'}")
    if agree:
        votes.append(value)
print(f"computers casting a vote: {len(votes)} of {len(computers)}")
# FC1: core_a=12.5, core_b=12.5 -> value=12.5
# FC2: core_a=12.5, core_b=12.5 -> value=12.5
# FC3: core_a=9.1, core_b=12.48 -> cores disagree, self-excluded from the vote
# computers casting a vote: 2 of 3
```
FC3 never reaches the cross-computer vote with a bad value at all — its own internal check caught the disagreement and withdrew it first, leaving only FC1 and FC2, which agree, to settle the output. This nesting is what lets the overall system tolerate a fault inside one computer without that computer ever contributing a wrong answer to the vote lessons 6 and 7 examine in full.
:::

Why accept commodity, radiation-*soft* silicon at all, rather than radiation-hardened parts throughout? The honest answer is a resource trade, not a free improvement: commodity multi-core processors deliver far more computation per watt and per dollar than radiation-hardened equivalents, which buys a vehicle far more onboard compute for the same mass and power budget — more capable estimation, more capable guidance, more margin for verification and simulation running alongside the flight code. The price is that any single commodity core is *more* likely, not less, to suffer a single-event upset than a hardened one (lesson 8 puts numbers on this), so the architecture has to make up the difference with replication, lockstep comparison, voting, and the memory-level protections — EDAC, ECC, scrubbing — that lesson 8 also covers, rather than leaning on the silicon alone. Whether that trade is the right one for a given vehicle depends on mission duration, orbit or trajectory (radiation environment), and how much the extra compute is worth — which is precisely why both architectures coexist across the industry rather than one having displaced the other.

::: key
Standby type trades recovery time for steady-state cost: cold (reboot and initialize) is cheapest and slowest, hot (continuously computing, switch output only) is most expensive and fastest, warm sits between them. Cross-strapping converts "a bus failure takes out a computer" into "a bus failure takes out a bus," at the cost of more connections and a fault-isolation requirement at each one. Commodity multi-core, Linux-based flight computers trade individually higher per-part upset susceptibility for far more compute per watt, recovered through lockstep checking within a computer and voting across several.
:::

## Check yourself

::: check
A subsystem's worst-case operating phase lasts eight seconds, end to end. Using the standby types from this lesson, which of cold, warm, and hot standby can plausibly recover within that window, based on the recovery times in this lesson's worked example?
:::

::: answer
Warm standby (2 s) and hot standby (0.05 s) both recover well within an eight-second window; cold standby's 45-second reboot-and-initialize time does not. This is exactly the kind of phase-duration comparison that should drive the standby-type choice for a given subsystem, rather than picking one standby type uniformly across the whole vehicle.
:::

::: check
A vehicle uses dual-dual redundancy — two computers, two sensor buses — but wires each computer to only one bus, not both. What single fault takes out one entire computer's useful function, even though that computer's own hardware never failed?
:::

::: answer
The failure of the one bus that computer is wired to. Without cross-strapping, a computer's ability to do useful work depends entirely on the health of the single bus it can reach, so a bus failure removes a healthy computer from service just as surely as a failure of the computer itself would — the "dual-dual" redundancy at the sensor-bus level buys nothing for that computer unless it can actually reach the surviving bus.
:::

::: check
Explain why cross-strapping, by itself, does not fully solve the single-point-of-failure problem it is built to address — what additional property does a cross-strapped interface need, and why?
:::

::: answer
Cross-strapping adds connectivity redundancy, but every wire it adds is itself a component that can fail, and more importantly, a cross-strapped connection creates a path by which a misbehaving computer could propagate a fault onto a bus that other, healthy computers also depend on. The additional property needed is electrical and logical isolation at each cross-strapped interface, strong enough that one computer's internal fault cannot corrupt or monopolize a bus shared with computers that are otherwise fine — without that isolation, cross-strapping has only relocated the single point of failure rather than removed it.
:::

::: check
In the two-level lockstep-then-vote architecture described in this lesson, what specifically stops a fault inside one flight computer's processing from ever reaching the cross-computer vote as a wrong value?
:::

::: answer
The lockstep check within that computer: its two cores execute the identical software on the identical inputs and their outputs are compared before anything leaves the computer. A fault that causes one core's output to differ from the other's is caught at that comparison, and the computer withdraws — abstains — from the cross-computer vote rather than presenting either core's value. Only a fault that affects both of a computer's lockstepped cores identically could pass this internal check and reach the vote, which is a much narrower, and much less likely, failure than an ordinary single-core upset.
:::

::: check
Why do modern vehicles described in this lesson accept commodity, non-radiation-hardened multi-core processors at all, given that lesson 8 shows such silicon is individually more susceptible to single-event upsets than radiation-hardened silicon?
:::

::: answer
Because the architecture recovers the reliability that radiation-hardened silicon would have provided at the part level through replication and checking instead: lockstep comparison within each computer, voting across several independently powered computers, and memory-level protections such as EDAC, ECC, and scrubbing (lesson 8). In exchange, commodity multi-core processors deliver substantially more computation per watt and per dollar than radiation-hardened equivalents, which funds more capable onboard estimation, guidance, and verification within the same mass and power budget — a resource trade rather than an unqualified improvement, and one that depends on mission duration and radiation environment to be the right call for a given vehicle.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Cold standby | Backup unpowered or uninitialized; recovers only after a full boot and initialization |
| Warm standby | Backup powered and running; recovers after resynchronizing state |
| Hot standby | Backup powered, running, and current; recovery is a near-instant output switch |
| Dual-dual | Redundancy doubled at more than one level (e.g., computers and the buses feeding them) |
| Cross-strapping | Every computer wired to reach every bus, so a bus failure does not remove a computer from service |
| Fault isolation at a cross-strap | The additional requirement that one unit's fault cannot propagate onto a bus shared with healthy units |
| Lockstep pair | Two cores executing identically; disagreement withdraws that computer from the vote entirely |
| Commodity multi-core + voting | Trades higher per-part upset rate for far more compute per watt, recovered via replication and checking |

The next two lessons build the voting step this lesson has referred to but not yet defined precisely: what a three-way vote can correctly mask, and — just as important — the two specific ways it can be fooled into agreeing on a wrong answer.
