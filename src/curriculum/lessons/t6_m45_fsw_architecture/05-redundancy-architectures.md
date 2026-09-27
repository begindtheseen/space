---
id: l05-redundancy-architectures
title: Redundancy architectures, classical and modern
minutes: 21
covers:
  - "Redundancy architectures: cold, warm and hot standby; dual-dual; cross-strapping"
  - Commodity multi-core computers running Linux with redundant flight strings and voted output, as publicly described for modern launch and crew vehicles
---

Think about three kinds of backup you already know. A car's spare tire sits in the trunk doing nothing until you get a flat. Then you stop, jack up the car and bolt it on — it works, but it takes twenty minutes. A theater's understudy has learned the part and is dressed and waiting backstage. If the lead falls ill, she goes on after a short scramble to catch up on where the play is. An airliner's copilot sits in the cockpit through the whole flight, watching the same instruments with hands near the controls. If the captain slumps over, the copilot is flying within a second.

All three are "a backup". They differ in how fast they take over and in how much they cost while nothing is wrong. Flight computers face the same choice. "Add a backup computer" is not one decision but a family of them. Which member you pick sets how fast the vehicle recovers from a failure, how much the spare costs in mass and power, and how much complexity you take on.

This lesson walks through that family: cold, warm and hot standby; dual-dual; and cross-strapping. Then it looks at the design several modern launch and crew vehicles have publicly described: several identical flight computers, built from ordinary **[[commodity|commodity-vs-hardened]]** multi-core processors running Linux, voting on their outputs. Lessons 6 and 7 build the vote itself. This lesson is about the wiring and staffing choices that decide what gets fed into it.

## Cold, warm and hot standby

First, some words. A **string** is one complete chain that can do the job: a computer plus the sensors, buses and power it depends on. A **failover** is the moment control passes from a failed string to a spare. A **[[single point of failure|single-point]]** is any one part whose failure takes out the whole function.

**Cold standby** is the spare tire. The backup is switched off, or on but not set up. Bringing it into service means powering it up, running its self-tests and building its internal state from scratch — the whole boot sequence that lesson 2's mode manager walks through from `BOOT` onward. It costs the least power while waiting and recovers the slowest.

**Warm standby** is the understudy. The backup is powered and running, but it is not tracking what the primary is doing moment to moment. On failover it must first **resynchronize** — pull the current vehicle state from telemetry or a shared store — before its output can be trusted. That is faster than cold, because start-up is already done. It is not instant, because catching up takes time.

**Hot standby** is the copilot. The backup is powered, running and computing the same outputs from the same inputs as the primary, all the time. Failover is close to instant: there is no boot and no catching up, only a decision about which unit's already-current output to use.

### How recovery time turns into downtime

The three differ mainly in one number: the **mean time to recover (MTTR)**, the average time from a failure until the spare is doing the job. A second number describes the hardware: the **mean time between failures (MTBF)**, the average time a string runs before it fails.

The fraction of the time the function is down is called the **unavailability**. For recovery times much shorter than the time between failures it is

$$
U = \frac{\text{MTTR}}{\text{MTBF} + \text{MTTR}} \approx \frac{\text{MTTR}}{\text{MTBF}} .
$$

Multiply by the mission length and you get the expected **downtime**: the total time, on average, the function is out over the whole mission.

::: note Why it has to be true
Picture the timeline as a repeating cycle: the string runs for about MTBF, fails, is down for about MTTR, then runs again. One cycle lasts $\text{MTBF} + \text{MTTR}$, and of that the function is down for $\text{MTTR}$. So the down fraction is $\text{MTTR}/(\text{MTBF} + \text{MTTR})$. When MTTR is tiny next to MTBF, the bottom is almost exactly MTBF. Another way to see it: over a mission of length $T$ you expect about $T/\text{MTBF}$ failures, each costing MTTR of downtime, so the downtime is $(T/\text{MTBF}) \times \text{MTTR}$.
:::

::: example Expected downtime over a mission, by standby type
A string fails on average once every $20000$ hours. The mission lasts $30$ days, which is $24 \times 30 = 720$ hours. Take recovery times of $45\,\mathrm{s}$ for cold (reboot and set up from scratch), $2\,\mathrm{s}$ for warm (resync state) and $0.05\,\mathrm{s}$ for hot (switch outputs).

```python
mtbf_hours = 20000.0          # given: mean time between primary-string failures
mission_hours = 24.0 * 30     # a 30-day mission

# unavailability ~= MTTR / MTBF when MTTR << MTBF
for name, mttr_s in [("cold", 45.0), ("warm", 2.0), ("hot", 0.05)]:
    mttr_hours = mttr_s / 3600.0
    unavailability = mttr_hours / (mtbf_hours + mttr_hours)
    downtime_ms = unavailability * mission_hours * 3600.0 * 1000.0
    print(f"{name}: MTTR={mttr_s:.2f} s -> expected downtime = {downtime_ms:.1f} ms")
# cold: MTTR=45.00 s -> expected downtime = 1620.0 ms
# warm: MTTR=2.00 s -> expected downtime = 72.0 ms
# hot: MTTR=0.05 s -> expected downtime = 1.8 ms
```

Check the cold case by hand. Expected failures in the mission: $720 / 20000 = 0.036$. Each costs $45\,\mathrm{s}$. So the expected downtime is $0.036 \times 45 = 1.62\,\mathrm{s}$, which is $1620\,\mathrm{ms}$. It matches.

Recovery time enters in a straight line. Going from cold to warm cuts it by $45 / 2 = 22.5$ times, and cuts expected downtime by the same factor, $1620 / 72 = 22.5$.
:::

Those averages hide the real question. A cold spare's $45\,\mathrm{s}$ does not matter during a long, calm coast. During a landing burn that lasts thirty seconds, it is the whole burn. So the useful question is: **how long does the most demanding flight phase allow recovery to take?** The answer picks the standby type.

Hot standby is not free. The spare must be powered, kept at the right temperature, and fed *exactly* the same inputs as the primary so its output is trustworthy the instant it is needed. That raises the same questions about identical inputs and identical results that lesson 7 covers for voting. Warm standby's resync is itself software, with its own correctness rules: the state it pulls must be recent and complete enough that the new unit does not start from a wrong or half picture of the vehicle.

None of the three is "correct" everywhere. A real vehicle usually mixes them, subsystem by subsystem, matched to how much recovery time each one's worst phase can absorb.

## Dual-dual and cross-strapping

A single pair — one primary, one backup — survives the loss of one unit. But if both units share a bus, a power feed or a sensor, the pair can still be taken out by that one shared thing.

**Dual-dual** doubles up at more than one level at once: two independent computers *and* two independent sensor sets or **[[buses|data-bus]]**. The goal is that no single wire, connector or shared part can cut every path between the sensors and the computers.

Picture two houses and two roads into town. If house A has a driveway only onto road 1, and house B only onto road 2, then when road 1 floods, house A is stuck — even though the house is fine. Give each house a driveway onto both roads, and a flood on either road strands nobody. That second driveway is **cross-strapping**: wiring every computer so it can reach every bus. It is what makes dual-dual's second level of redundancy actually pay off.

::: example Single-bus-failure coverage, with and without cross-strapping
Model each computer as the set of buses it can reach, fail one bus, and list the computers that can still reach a working one.

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

`buses - {failed_bus}` is the set of buses left after removing the failed one. If it is not empty, the computer survives. Without cross-strapping, one bus failure halves the working computers although no computer broke. With it, both stay up.

Sanity check: this is the flooded-road picture exactly. Cross-strapping turns "a bus failure takes out a computer" into "a bus failure takes out a bus", which is a strictly smaller loss.
:::

Cross-strapping has costs, and it is worth naming them. Every extra connection is another wire, connector and interface circuit that can fail. The wiring gets more tangled exactly where you wanted failure analysis to get simpler.

It also raises a new question. If a misbehaving computer can reach a bus that healthy computers also use, can its fault spread onto that bus and take them down too? A computer that jams a shared bus with garbage is sometimes called a **[[babbling idiot|babbling-idiot]]**. So each cross-strapped interface needs **fault isolation**: electrical and logical barriers strong enough that one unit's fault cannot corrupt or hog a shared bus. Cross-strapping buys connections. It does not, by itself, buy isolation. Without the isolation, the single point of failure has only moved — from "a bus" to "whatever stops one computer's fault from riding that bus to every other computer on it".

## Commodity multi-core computers, Linux and voted output

So far this is about whole units and how they are wired. A newer choice is about what each unit is built from.

Traditionally a flight computer's chip was picked for **[[radiation hardness|commodity-vs-hardened]]** first and speed second. A **radiation-hardened** processor is one designed to shrug off the particle strikes of space. Those strikes cause **single-event upsets** (a bit flipped by a passing particle) and slow damage from total dose, both covered in lesson 8. Hardened processors are often single-core and much slower, and cost far more per unit of computing, than commercial chips of the same era.

Several modern launch and crew vehicle programs have publicly described a different trade. Build each flight computer from a **commodity** multi-core processor — the kind found in commercial servers — running a general-purpose operating system such as **[[Linux|linux-flight]]**. Then get the reliability a hardened chip would have given from the *architecture* instead: several independently powered flight computers, each running the identical flight software, checking and voting on each other.

The publicly described designs nest two levels of checking:

1. **Inside one computer: a lockstep pair.** Two processor cores run the identical software on identical inputs, in **[[lockstep|lockstep]]**, and compare their outputs continuously. If the two disagree, that computer knows something inside it is wrong. It withdraws — **abstains** — rather than offering a value it cannot vouch for.
2. **Across computers: a vote.** Several such computers — commonly three, each with its own power and its own clock — each produce a value or abstain. A vote across those that answered settles the value that actually commands an actuator.

::: example Lockstep within a computer, then a vote across computers
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

Walk through it. FC1's two cores both say $12.5$, so FC1 votes $12.5$. FC2 is the same. FC3's cores say $9.1$ and $12.48$ — they disagree, so FC3 never enters the vote at all. The two computers left agree, and they settle the output.

The point: a fault inside one computer never reaches the vote as a wrong value. Its own internal check caught it first. Only a fault that hit *both* of a computer's cores in exactly the same way could slip past — a much narrower and rarer event than an ordinary upset in one core.
:::

Why accept "radiation-soft" commodity chips at all? It is a resource trade, not a free win. Commodity multi-core processors give far more computing per watt and per dollar than hardened ones. That buys more capable estimation and guidance, and more margin for checks running alongside the flight code, for the same mass and power. The price is that each commodity core is *more* likely to suffer an upset than a hardened one (lesson 8 puts numbers on this). So the architecture must make up the difference with replication, lockstep checking, voting, and memory protection — **EDAC** and **ECC** memory that detects and corrects flipped bits, and **scrubbing** that sweeps memory to fix them — also covered in lesson 8.

Whether the trade is right depends on the mission: how long it lasts, how harsh its radiation environment is, and how much the extra computing is worth. That is why both approaches are still in use across the industry.

::: key
Standby type trades recovery time for steady-state cost: cold (reboot and initialize) is cheapest and slowest, hot (continuously computing, switch output only) is most expensive and fastest, and warm sits between. Cross-strapping turns "a bus failure takes out a computer" into "a bus failure takes out a bus", at the cost of more connections and a fault-isolation requirement at each one. Commodity multi-core, Linux-based flight computers trade a higher per-part upset rate for far more compute per watt, and win the reliability back through lockstep checking within each computer and voting across several.
:::

## Check yourself

::: check
A subsystem's most demanding phase lasts eight seconds from start to finish. Using the recovery times in this lesson's downtime example, which of cold, warm and hot standby can plausibly recover inside that window?
:::

::: answer
Warm standby ($2\,\mathrm{s}$) and hot standby ($0.05\,\mathrm{s}$) both recover well inside eight seconds. Cold standby's $45\,\mathrm{s}$ reboot does not — the phase would be over more than five times before the spare was ready. This comparison of phase length with recovery time is what should drive the standby choice for each subsystem, rather than one choice for the whole vehicle.
:::

::: check
A vehicle has two computers and two sensor buses (dual-dual), but each computer is wired to only one bus. What single fault takes out one computer's useful function even though that computer's hardware never failed?
:::

::: answer
The failure of the one bus that computer is wired to. Without cross-strapping, a computer can only do useful work if its single bus is healthy. A bus failure removes a healthy computer from service just as surely as if the computer itself had broken. The second bus buys that computer nothing, because it cannot reach it.
:::

::: check
Why does cross-strapping, on its own, not fully solve the single-point-of-failure problem? What extra property does each cross-strapped interface need?
:::

::: answer
Every connection cross-strapping adds is another part that can fail. More importantly, it creates a path by which a misbehaving computer can push a fault onto a bus that healthy computers also depend on — babbling garbage, or holding the bus so nobody else can talk. Each cross-strapped interface therefore needs electrical and logical isolation strong enough that one computer's fault cannot corrupt or monopolize a shared bus. Without it, cross-strapping has only moved the single point of failure, not removed it.
:::

::: check
In the lockstep-then-vote design, what stops a fault inside one flight computer from reaching the cross-computer vote as a wrong value?
:::

::: answer
The lockstep check inside that computer. Its two cores run the identical software on the identical inputs, and their outputs are compared before anything leaves the computer. A fault that makes one core's answer differ from the other's is caught there, and the computer abstains from the vote rather than sending either value. Only a fault that affects both cores identically could pass the internal check — a much narrower and less likely event than an ordinary single-core upset.
:::

::: check
Commodity multi-core processors are individually *more* likely to suffer single-event upsets than radiation-hardened ones. Why do modern vehicles use them anyway?
:::

::: answer
Because the architecture wins back the reliability that hardened silicon would have given at the part level: lockstep comparison inside each computer, voting across several independently powered computers, and memory protection such as EDAC, ECC and scrubbing (lesson 8). In return, commodity processors give much more computing per watt and per dollar, which pays for more capable estimation, guidance and checking within the same mass and power. It is a trade, not a free improvement, and whether it is the right one depends on mission length and radiation environment.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Cold standby | Spare off or not set up; recovers only after a full boot and initialization |
| Warm standby | Spare powered and running; recovers after resynchronizing state |
| Hot standby | Spare powered, running and current; recovery is a near-instant output switch |
| MTTR, MTBF | Mean time to recover; mean time between failures |
| Unavailability | $U = \text{MTTR}/(\text{MTBF} + \text{MTTR}) \approx \text{MTTR}/\text{MTBF}$; downtime $\approx U \times$ mission length |
| Dual-dual | Redundancy doubled at more than one level, such as computers and the buses feeding them |
| Cross-strapping | Every computer wired to every bus, so a bus failure does not remove a computer |
| Fault isolation | Barriers so one unit's fault cannot spread onto a bus shared with healthy units |
| Lockstep pair | Two cores running identically; disagreement makes that computer abstain from the vote |
| Commodity multi-core + voting | Higher per-part upset rate, far more compute per watt; reliability won back by replication and checking |

The next lesson builds the vote this lesson kept pointing to: what a three-way vote can correctly hide from the rest of the vehicle, and the specific way it can be fooled into agreeing on a wrong answer.

::: context commodity-vs-hardened Fast chips and tough chips
A widely flown radiation-hardened processor, the RAD750, runs at up to about $200\,\mathrm{MHz}$ and has flown on missions such as the Curiosity and Perseverance Mars rovers. A commodity laptop or server chip of the same era runs at several gigahertz on several cores. The hardened part is built with special processes and layouts so particle strikes rarely flip its bits and it tolerates years of dose. That toughness costs speed, power and money — a hardened flight board has been widely reported to cost a couple of hundred thousand dollars. The commodity route buys raw speed cheaply and pays for toughness with architecture instead.
:::

::: context single-point The one thing that takes everything down
A **single point of failure** is any one part whose failure alone defeats the function, no matter how much redundancy surrounds it. Two computers sharing one power cable have a single point: the cable. Finding these is a central job of redundancy design, and a formal method for it — the FMEA — comes in lesson 10. The honest habit is to ask of every shared item, "what if *this* fails?", including the wiring, the clock and the voter itself.
:::

::: context data-bus Shared wires that carry messages
A **data bus** is a set of wires many units share to send messages, like a party-line phone. Spacecraft often use standard buses such as MIL-STD-1553, which itself runs on two redundant wires (A and B), or SpaceWire and CAN. Because every unit on a bus depends on it, a bus is a natural single point of failure — and the reason dual-dual designs double the buses as well as the computers.
:::

::: context babbling-idiot When one unit shouts over everyone
A **babbling idiot** is a failed unit that transmits nonstop, or at the wrong times, so no healthy unit can get a message through. On a shared bus one babbler can silence every computer attached to it — a cross-strapped design makes it *more* units. The usual defense is a **bus guardian**: a small, independent circuit that only lets its unit transmit in its assigned time slot, and cuts it off otherwise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="3"/>
  <text x="330" y="124" font-size="12" text-anchor="end" fill="#1f2a44">shared bus</text>
  <rect x="40" y="20" width="70" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">FC1</text>
  <rect x="145" y="20" width="70" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">FC2</text>
  <rect x="250" y="20" width="70" height="34" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="285" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">FC3 fails</text>
  <line x1="75" y1="54" x2="75" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="54" x2="180" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="270" y="66" width="30" height="16" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="228" y="78" font-size="11" text-anchor="middle" fill="#1d6fd1">guardian</text>
  <line x1="285" y1="54" x2="285" y2="66" stroke="#b4232c" stroke-width="2"/>
  <line x1="285" y1="82" x2="285" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
</svg>
```

The guardian sits between the failing unit and the bus and blocks its babble.
:::

::: context linux-flight Linux in flight, as publicly described
In a 2020 public question-and-answer session, SpaceX's software engineers described Falcon 9 and Dragon flight computers as dual-core x86 processors running Linux, with flight software written in C++, with the two cores of each computer checking each other and three such computers checking one another. Linux here is not the desktop setup: it is trimmed down and tuned for predictable timing. The same general approach — commodity chips, several strings, voted output — has been described for other modern vehicles, while many science spacecraft still fly hardened single-core computers.
:::

::: context lockstep Two cores, one answer
In **lockstep**, two cores are fed the same inputs and run the same instructions at the same time, and a comparator checks their outputs. Agreement means both are probably right. Disagreement means one is wrong — but the pair cannot tell which, so the safe move is for the whole computer to fall silent. That makes each computer **fail-silent**: it either gives a checked answer or none. The vote across computers then only ever sees checked answers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="84" font-size="12" fill="#1f2a44">inputs</text>
  <line x1="62" y1="80" x2="90" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="62" y1="80" x2="90" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="28" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">core A</text>
  <rect x="90" y="98" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">core B</text>
  <line x1="170" y1="45" x2="210" y2="72" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="170" y1="115" x2="210" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="225" cy="80" r="16" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="225" y="85" font-size="14" text-anchor="middle" fill="#1f2a44">=?</text>
  <line x1="241" y1="80" x2="270" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="276" y="64" font-size="12" fill="#1d6fd1">same: send value</text>
  <text x="276" y="100" font-size="12" fill="#b4232c">differ: stay silent</text>
</svg>
```
:::
