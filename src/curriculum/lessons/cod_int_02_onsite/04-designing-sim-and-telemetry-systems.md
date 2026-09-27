---
id: l04-designing-sim-and-telemetry-systems
title: Designing a simulation system and a telemetry pipeline, aloud
minutes: 21
covers:
  - Engineering system design: GNC simulation infrastructure for a constellation; a telemetry pipeline for six thousand satellites; how you would verify this flight software; how you would architect a fault-tolerant flight computer
---

Imagine a friend asks you to plan a birthday party for "some people". You would not start by buying balloons. You would ask: how many people, what budget, indoors or outdoors, any allergies? Then you would sketch the plan — food here, games there, who drives whom. Then you would ask what could go wrong: rain, a late cake, a guest who cannot eat nuts. Only then would you choose between options, like pizza (cheap, fast) or a sit-down meal (nicer, slower).

A **[[system design round|what-the-round-is]]** — an interview where you sketch how a large piece of software should be built, talking the whole time — works the same way. The interviewer gives you a big, vague problem: "design the simulation infrastructure for a constellation GNC team", or "design a telemetry pipeline for six thousand satellites". There is no single right answer. What they watch is *how* you get from a vague request to a design you can defend.

This lesson gives you a five-step way to run that conversation, then walks through the two designs the module lists. The next lesson takes the other two prompts from the same topic: how you would verify flight software, and how you would build a flight computer that survives failures.

## A five-step way to run the answer

The five steps are the party plan with engineering names.

1. **Clarify the requirements.** Ask questions before drawing anything. Who uses this system? How many satellites, how many engineers, how many runs a night? What must never go wrong, and what may be slow? A **requirement** is a statement the finished system must meet ("a nightly regression finishes before 7 a.m.").
2. **Put numbers first.** Turn the answers into sizes: bytes per second, cases per night, terabytes per year. This is a **[[back-of-envelope|back-of-envelope]]** estimate — rough arithmetic that tells you which parts are hard. A design for 10 megabytes a day and a design for 10 terabytes a day look nothing alike.
3. **Draw boxes and interfaces.** Each **box** is a component with one job. Each **interface** is the agreed shape of what passes between two boxes — the message format, the function signature, the units. Name the data on every arrow.
4. **Walk the failure modes.** A **failure mode** is one specific way a part can break: a link drops, a disk fills, a message arrives twice, a random seed is forgotten. For each one, say how the system notices and what it does.
5. **Name the trade-offs.** A **trade-off** is a choice where getting more of one good thing costs you another. Say which you chose and why ("I store raw data forever because it is cheap and it lets us re-process after a bug; the cost is a bigger archive").

::: key Running a system-design answer
Clarify requirements, then numbers first, then boxes and interfaces, then failure modes, then trade-offs. Say each step out loud; the reasoning is what is being graded.
:::

::: warning Drawing before asking
The most common slip is to hear "telemetry pipeline" and start drawing a database. Two minutes of questions first changes everything that follows. If the interviewer says "you decide", state your assumption out loud and write it in the corner of the whiteboard, so you and they can come back to it.
:::

## Design one: GNC simulation infrastructure for a constellation

GNC means guidance, navigation and control: the software that decides where a vehicle should go, works out where it is, and fires thrusters or spins wheels to get there. A **simulation** is a program that pretends to be the world — the orbit, the sensors, the thrusters — so the GNC code can fly thousands of times on the ground before it flies once in space.

For a constellation, one sim is not enough. The team needs an **infrastructure**: the shared machinery that builds, runs, checks, stores and shows thousands of simulations every day. The exercise for this module lists eight pieces to cover. Here they are in the order you might draw them.

### 1. Module boundaries and interfaces

Split the world into boxes that match how the real vehicle is split: **dynamics** (how the satellite moves and rotates), **environment** (gravity, drag, sunlight), **sensors** (star trackers, gyros, GPS), **actuators** (reaction wheels, thrusters), and the **flight software** under test. Each box talks only through a defined interface: a struct of inputs and outputs, with units and frames written down.

Why so strict? Because then the flight-software box can be the *real* flight code, not a copy. And a sensor model can be swapped from "perfect" to "noisy" to "the real sensor on a bench" without touching anything else.

### 2. Determinism and seeded reproducibility

A simulation is **deterministic** when the same inputs always give exactly the same outputs, bit for bit. That sounds automatic for a computer. It is not. Random noise, multiple threads finishing in different orders, and reading the wall clock all break it.

The fix for randomness is a **seed** — the starting number for a pseudo-random generator. Same seed, same "random" numbers, same run. For a batch of many runs, derive each case's seed from one **base seed** plus the case number. Then case 417 from last Tuesday can be re-run alone, today, and it fails in exactly the same way. That is the difference between "we saw a failure once" and "here is the failure, on my screen".

### 3. The dispersed Monte Carlo layer

A single run uses the nominal values: thrust exactly as designed, sensors exactly as specified. Real hardware is never nominal. A **dispersion** is a random spread applied to an uncertain input, like "thruster strength is 1% off, one standard deviation". A **[[Monte Carlo|monte-carlo-name]]** run flies hundreds or thousands of cases, each with a fresh draw of every dispersion, and reports the spread of results — for example, "99.7% of cases point within 0.05 degrees".

### 4. Hardware-in-the-loop hooks

**Hardware-in-the-loop** (HIL) means a real flight computer, or real sensor, is wired into the simulation: the sim computes the physics and feeds fake sensor signals into real hardware, which sends real commands back. The infrastructure must be ready for it from day one: the interfaces in step 1 are the **hooks**, and the sim must be able to run in **real time** — one simulated second per real second — when hardware is attached.

### 5. A C++ core with a Python harness

The physics steps millions of times per run, so the core is written in C++ for speed. Around it sits a Python **harness** — the code that sets up cases, launches them, collects results and makes plots. Engineers can write a new test in ten lines of Python while the hot loop stays fast. The two are joined by a **[[binding layer|python-bindings]]**.

### 6. Continuous integration with tolerance-based regression

**Continuous integration** (CI) runs the test suite automatically on every change to the code. A **regression** is something that used to work and now does not. A **regression test** compares today's results with stored, trusted ones.

The catch: with floating-point numbers, harmless changes (a new compiler, a reordered sum) can move the eighth decimal place. So comparisons use **tolerances** — an allowed difference. A **relative tolerance** says "within one part in a billion of the size of the number". An **absolute tolerance** says "within 0.001 degrees, whatever the size". Each quantity gets its own tolerance, chosen from physics: an attitude error only matters above some fraction of the sensor noise.

### 7. Results storage

Every run stores its inputs (code version, seed, dispersion settings) next to its outputs. Then any plot can be traced back to exactly what produced it. Summary numbers go in a database you can query; full time histories go in cheaper bulk storage.

### 8. The visualisation layer

Engineers need to see results: dashboards of nightly pass rates, scatter plots of Monte Carlo outcomes, a 3-D replay of one failing case. The visualisation reads only from results storage, never from a live run, so every picture is reproducible.

::: example Sizing the nightly Monte Carlo
Numbers first. Suppose (our assumptions, stated out loud) each case simulates one day of flight at $100$ steps per second, each step costs $2$ microseconds of CPU time, and the nightly campaign runs $1000$ cases.

**Steps per case.** One day is $24 \times 3600 = 86\,400$ seconds. At $100$ steps per second that is $86\,400 \times 100 = 8\,640\,000$ steps.

**Time per case.** $8\,640\,000 \times 2 \times 10^{-6}\,\mathrm{s} \approx 17.3\,\mathrm{s}$.

**Whole campaign.** $17.3 \times 1000 = 17\,280\,\mathrm{s}$ of CPU time, which is $17\,280 / 3600 = 4.8$ CPU-hours. Spread over $64$ cores, that is $17\,280 / 64 = 270\,\mathrm{s}$, about $4.5$ minutes.

**Storage.** If each case saves $50$ channels once per second as 8-byte numbers, that is $50 \times 86\,400 \times 8 \approx 34.6\,\mathrm{MB}$ per case, or about $34.6\,\mathrm{GB}$ per night.

**Sanity check.** A few minutes of compute and a few tens of gigabytes a night is modest. So the hard part of this design is not raw speed. It is reproducibility, tolerances and triage — which is where you should spend your talking time.
:::

Here is what seeded reproducibility and a tolerance check look like in a Python harness. The "case" is a stand-in for a real simulation.

```python
import numpy as np

def run_case(rng):
    # stand-in for one dispersed simulation: draw a thrust error and a sensor bias
    thrust_error = rng.normal(0.0, 0.01)      # 1 percent, one sigma
    gyro_bias = rng.normal(0.0, 1e-4)         # rad/s, one sigma
    return 100.0 * (1 + thrust_error) + 50.0 * gyro_bias

def run_campaign(base_seed, n_cases):
    children = np.random.SeedSequence(base_seed).spawn(n_cases)
    return np.array([run_case(np.random.default_rng(s)) for s in children])

a = run_campaign(base_seed=2024, n_cases=1000)
b = run_campaign(base_seed=2024, n_cases=1000)
print(np.array_equal(a, b))                              # True: same seed, same answers
print(np.allclose(a, b * (1 + 1e-12), rtol=1e-9, atol=0))  # True: within tolerance
print(round(a.mean(), 2), round(a.std(), 2))             # 100.04 0.99
```

Each case gets its own child seed spawned from the base seed, so the cases are independent of each other and any one can be re-run alone. The last line shows the dispersion doing its job: the mean sits near the nominal $100$ and the spread is about $1\%$.

::: warning Tolerances pulled out of the air
Setting every tolerance to $10^{-6}$ "to be safe" gives a suite that fails on every compiler update, so people learn to ignore it. Setting them wide hides real bugs. Say where each tolerance comes from: sensor noise, a requirement, or measured run-to-run spread.
:::

## Design two: a telemetry pipeline for six thousand satellites

**Telemetry** is the stream of measurements a spacecraft sends home: temperatures, voltages, wheel speeds, attitude, error counters. A **pipeline** is the chain of stages that takes those raw bytes from the ground antennas all the way to a plot on an engineer's screen.

### Numbers first

Ask how much data each satellite sends. If the interviewer lets you choose, choose out loud. Our assumption: each satellite reports $2000$ **channels** (separate measurements) once per second, each stored as a $4$-byte number. That is $8000$ bytes per second, or $64$ kilobits per second, per satellite.

::: example How big is the stream?
With $6000$ satellites at $8000\,\mathrm{B/s}$ each (our stated assumption):

**Rate.** $6000 \times 8000 = 48\,000\,000\,\mathrm{B/s}$, which is $48\,\mathrm{MB/s}$, or $48 \times 8 = 384\,\mathrm{Mbit/s}$.

**Samples.** $6000 \times 2000 = 12\,000\,000$ individual values arrive every second.

**Per day.** $48\,000\,000 \times 86\,400 \approx 4.15 \times 10^{12}\,\mathrm{B}$, about $4.1\,\mathrm{TB}$ a day.

**Per year.** $4.15\,\mathrm{TB} \times 365 \approx 1.5\,\mathrm{PB}$ (a **petabyte** is a thousand terabytes).

**What the numbers tell you.** $384\,\mathrm{Mbit/s}$ fits through one good network link, so ingest is not exotic. But twelve million values a second is too many to write one row at a time into an ordinary database, and $1.5\,\mathrm{PB}$ a year is too much to keep on fast disks. So the design needs batching on the way in, and two tiers of storage.

**Sanity check.** Sixty-four kilobits per second is less than a phone's video call. Plenty of spacecraft send far less; payload data is a separate, much bigger stream. If the interviewer's number differs, rescale: the answer is proportional to the per-satellite rate.
:::

### Boxes and interfaces

Now the skeleton. Each item below is one box.

- **Ingest through a [[streaming bus|streaming-bus]].** Ground stations push raw frames onto a bus — a durable, ordered log that many readers can consume at their own pace. If a downstream box stops, data waits on the bus instead of being lost.
- **[[Decommutation|decom]] and schema handling.** Raw frames are packed bytes. Decommutation unpacks them into named channels with units, using a **schema** — the description of which bytes mean what. Schemas change when flight software changes, so every frame must say which schema version it uses.
- **A hot time-series store plus a columnar archive.** The **hot store** keeps recent data (say the last 30 days) on fast storage for live dashboards. The **[[columnar archive|columnar]]** keeps everything, compressed, on cheap storage, organised by column so a query for one channel across months reads only that channel.
- **Partitioning by time.** Data is split into chunks by hour or day. Queries touch only the chunks they need, and old chunks can be moved or deleted as a unit.
- **Continuous aggregates for dashboards.** A dashboard of $6000$ satellites cannot redraw from raw one-second data. The pipeline keeps pre-computed summaries — the minute-by-minute minimum, mean and maximum — updated as data arrives.
- **Gap and duplicate detection.** Links drop, and ground stations overlap, so the same frame can arrive twice or not at all. Every frame carries a satellite ID and a sequence counter. A jump in the counter is a gap; a repeat is a duplicate, dropped before storage.
- **Retention and [[export-control handling|export-control]].** Decide how long each tier keeps data, and who may see it. Spacecraft telemetry can be export-controlled, so access control is part of the design, not an afterthought.
- **A query path every plot can be traced to.** Any number on any screen can be traced back through the aggregate, to the stored samples, to the raw frame and schema version. When a plot looks wrong, that trail is how you find out why.

::: key Telemetry pipeline skeleton (card int02_c5)
Ingest through a streaming bus, decommutation and schema handling, a hot time-series store plus a columnar archive, partitioning by time, continuous aggregates for dashboards, gap and duplicate detection, retention and export-control handling, and a query path every plot can be traced to.
:::

### Failure modes and trade-offs

Walk the failures out loud. A ground station goes down: the other stations cover, and the bus absorbs a burst when it returns. A new flight-software version ships with a new schema: frames tagged with the new version are decoded with the new schema, old frames keep the old one. A disk fills: partitions by time let you move the oldest day off in one step.

Then name the trade-offs. Keeping raw frames forever costs storage but lets you re-decode everything after a schema bug. Minute aggregates make dashboards fast but hide one-second spikes, so the drill-down path must reach raw data. A hot window of 30 days is a guess; say you would size it from how far back operators actually look.

::: warning Forgetting the numbers once you have them
Candidates often compute the data rate and then never use it. Refer back: "twelve million samples a second is why I batch writes", "one and a half petabytes a year is why the archive is columnar and compressed". Numbers that do not change the design were not worth computing.
:::

## Check yourself

::: check
An interviewer says only "design a system to store satellite telemetry". List four questions you would ask before drawing anything, and say which part of the design each answer changes.
:::

::: answer
Good questions include: how many satellites and how many channels each (sets the data rate and the storage size); how fresh must dashboards be (decides whether you need streaming aggregates or a nightly batch); how long must data be kept (sizes the archive and the retention policy); who may see it (drives export-control and access design); and do we need raw frames or only decoded values (decides whether you keep raw data for re-processing). Each answer moves a number or a box, which is why you ask first.
:::

::: check
Your nightly Monte Carlo fails on case 417 only. What two things must the infrastructure already have for you to debug this tomorrow morning?
:::

::: answer
First, seeded reproducibility: case 417's seed must be derivable from the base seed and the case number, so you can re-run exactly that case alone and see the same failure. Second, results storage that recorded the inputs — code version, seed and dispersion settings — next to the outputs, so you know precisely what produced the failure. Without both, a one-in-a-thousand failure cannot be reproduced and tends to get ignored.
:::

::: check
Redo the telemetry sizing for $6000$ satellites if each sends only $500$ channels once per second, $4$ bytes each. Give bytes per second, terabytes per day, and say whether the design changes.
:::

::: answer
Per satellite: $500 \times 4 = 2000\,\mathrm{B/s}$. Fleet: $6000 \times 2000 = 12\,000\,000\,\mathrm{B/s} = 12\,\mathrm{MB/s}$ ($96\,\mathrm{Mbit/s}$). Per day: $12\,000\,000 \times 86\,400 \approx 1.04 \times 10^{12}\,\mathrm{B}$, about $1.0\,\mathrm{TB}$ — a quarter of before, as it should be, because the channel count dropped by four. Three million samples a second still needs batched writes and a tiered store, so the boxes stay the same; only the sizes shrink.
:::

::: check
Why should the regression tolerance on a pointing error not be $10^{-12}$ degrees, and how would you choose a better one?
:::

::: answer
At $10^{-12}$ degrees, harmless floating-point changes — a new compiler, a sum done in a different order — would fail the test, and the team would learn to ignore red results. Choose it from physics or requirements: for example, a small fraction of the star tracker's noise, or of the pointing requirement, or a few times the run-to-run spread you measured when nothing meaningful changed.
:::

::: check
Explain why the flight-software box in the simulation should talk to the rest only through a defined interface. Give two benefits.
:::

::: answer
A defined interface (inputs, outputs, units and frames written down) lets the box be the real flight code rather than a copy, so what you test is what flies. It also lets you swap what sits on the other side — a perfect sensor model, a noisy one, or real hardware on a HIL bench — without changing the flight code. A third benefit: when a test fails, the interface tells you which side of the boundary to look at.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Answer shape | clarify requirements, numbers first, boxes and interfaces, failure modes, trade-offs |
| Module boundaries | dynamics, environment, sensors, actuators, flight software, joined by written interfaces |
| Determinism | same inputs give identical outputs; each case's seed derives from a base seed and case number |
| Dispersed Monte Carlo | many runs with random spreads on uncertain inputs; report the spread of outcomes |
| HIL hooks | interfaces that let real hardware replace a model, with the sim able to run in real time |
| C++ core, Python harness | fast physics loop, quick-to-write setup, launch and plotting |
| Tolerance-based regression | CI compares with trusted results using tolerances chosen from physics |
| Telemetry sizing | 6000 satellites at 8000 B/s each gives 48 MB/s, about 4.1 TB a day and 1.5 PB a year |
| Telemetry skeleton | bus, decommutation and schemas, hot store plus columnar archive, time partitions, aggregates, gap and duplicate checks, retention and export control, traceable queries |

Next lesson takes the other two design prompts: how you would verify flight software, and how you would build a flight computer that keeps working when parts of it fail.

::: context what-the-round-is What happens in the room
In a system design round you usually get a whiteboard, or a shared online drawing tool, and about 30 to 60 minutes. The interviewer gives one open problem and then mostly listens, pushing now and then ("what if a ground station goes down?"). There is no hidden right answer to guess. You are graded on whether your questions were sharp, your numbers sensible, your boxes clean, and whether you noticed what could break. Thinking in silence and then presenting a finished picture scores worse than thinking aloud, because the interviewer cannot see reasoning you did not say.
:::

::: context back-of-envelope Arithmetic small enough for an envelope
The phrase comes from the idea that the sum is short enough to scribble on the back of an envelope. The goal is the right *size* — a factor of two either way is fine — not a precise figure. Engineers use it to find which part of a system is hard before spending weeks on it. You will practise the same skill, named Fermi estimation, two lessons from now.
:::

::: context monte-carlo-name Named after a casino
The Monte Carlo method was named in the 1940s by scientists working on nuclear weapons at Los Alamos, after the famous casino in Monaco, because it answers questions by rolling dice many times. The idea: when a problem has too many uncertain inputs to solve on paper, draw random values for all of them, run the model, repeat thousands of times, and look at the spread of answers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="112" width="30" height="8"/>
    <rect x="90" y="96" width="30" height="24"/>
    <rect x="120" y="68" width="30" height="52"/>
    <rect x="150" y="40" width="30" height="80"/>
    <rect x="180" y="44" width="30" height="76"/>
    <rect x="210" y="72" width="30" height="48"/>
    <rect x="240" y="98" width="30" height="22"/>
    <rect x="270" y="110" width="30" height="10"/>
  </g>
  <line x1="315" y1="30" x2="315" y2="120" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="315" y="22" font-size="11" text-anchor="middle" fill="#b4232c">requirement</text>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">outcome of each run (e.g. pointing error)</text>
  <text x="30" y="24" font-size="11" fill="#1f2a44">number of runs</text>
</svg>
```

The histogram shows how the runs landed; the question is how many cross the red line.
:::

::: context python-bindings How Python calls C++
A binding layer is a thin piece of code that makes C++ functions and classes look like ordinary Python ones. Libraries such as pybind11 generate it: you write a few lines naming which C++ functions to expose, compile, and Python can `import` the result. The heavy loop still runs at C++ speed; Python only calls it once per case. The cost is one more interface to keep in step — a change to a C++ struct must be mirrored in the binding, which is exactly the kind of boundary where unit and ordering mix-ups hide.
:::

::: context streaming-bus A conveyor belt that remembers
Think of a conveyor belt that keeps a copy of everything placed on it for a few days. Producers put items on one end; each consumer reads at its own pace and remembers how far it has got. If a consumer crashes, it restarts from its bookmark and nothing is lost. Apache Kafka is a widely used example of this kind of durable log.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="70" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">station A</text>
  <rect x="10" y="80" width="70" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">station B</text>
  <rect x="120" y="50" width="110" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="175" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">bus (ordered log)</text>
  <line x1="80" y1="35" x2="120" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="95" x2="120" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="270" y="20" width="80" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">decom</text>
  <rect x="270" y="80" width="80" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">raw archive</text>
  <line x1="230" y1="60" x2="270" y2="35" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="230" y1="70" x2="270" y2="95" stroke="#1d6fd1" stroke-width="1.5"/>
</svg>
```
:::

::: context decom Unpacking the bytes
To save radio bandwidth, a spacecraft packs its measurements tightly: a 12-bit temperature, then three 1-bit flags, then a 16-bit wheel speed, all squeezed into one frame. Decommutation ("decom" for short) is the unpacking: using the schema, it cuts the frame at the right bit positions, fixes the byte order, and multiplies by the right scale factor to get degrees or volts. You met the byte-level details in the algorithms module; here the design point is that the schema is versioned data, not something hard-coded.
:::

::: context columnar Rows versus columns
A row store keeps each moment's values together; a column store keeps each channel's values together. Asking "battery voltage for the last six months" in a column store reads one tidy strip instead of every row. Neighbouring values in one column are also similar, so they compress very well.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="85" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">row store</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">column store</text>
  <g stroke="#1f2a44" stroke-width="1" fill="#fff">
    <rect x="20" y="28" width="130" height="22"/><rect x="20" y="54" width="130" height="22"/>
    <rect x="20" y="80" width="130" height="22"/><rect x="20" y="106" width="130" height="22"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="28" y="43">t1: temp, volt, rpm</text><text x="28" y="69">t2: temp, volt, rpm</text>
    <text x="28" y="95">t3: temp, volt, rpm</text><text x="28" y="121">t4: temp, volt, rpm</text>
  </g>
  <rect x="200" y="28" width="40" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="250" y="28" width="40" height="100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="300" y="28" width="40" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="220" y="80">temp</text><text x="270" y="80">volt</text><text x="320" y="80">rpm</text>
  </g>
</svg>
```

The shaded column is all a voltage query has to read.
:::

::: context export-control Why the data has rules
Much spacecraft technical data falls under US export-control law (ITAR, from the first lesson of this module), which limits who may receive it. For a pipeline this means access control per user, logs of who read what, and care about where servers and backups physically sit. Mentioning it unprompted in an interview shows you know the data is not ordinary web traffic.
:::
