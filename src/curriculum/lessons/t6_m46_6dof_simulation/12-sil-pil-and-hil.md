---
id: l12-sil-pil-and-hil
title: SIL, PIL and HIL
minutes: 19
covers:
  - The SIL, PIL and HIL progression and what each step actually adds
---

Think about how a school play gets ready. First the cast sits around a table and reads the script aloud. That catches wrong lines and missing scenes. Next they rehearse on the real stage. Now they find out whether an actor can really cross from one side to the other before her next line. Last comes the dress rehearsal: real costumes, real lights, and a live band that keeps playing whether or not you are ready. That is when someone discovers the costume zipper sticks, or the spotlight cable is too short.

Each rehearsal catches problems the one before it *could not* catch. Reading at a table can never reveal a stuck zipper, however many times you do it.

Testing flight software works the same way. The previous lesson said the GNC box should run the genuine flight code, not a copy. It did not say *where* that code runs. There are three answers, each more demanding than the last:

- **software-in-the-loop (SIL)** — the flight code runs on an ordinary development computer;
- **processor-in-the-loop (PIL)** — it runs on the real flight processor;
- **hardware-in-the-loop (HIL)** — it runs inside the real flight computer, wired to real or **[[stimulated|stimulator-word]]** sensors and actuators, against a real clock.

For each step up, this lesson asks one question: what can you find now that you could not possibly find before? And it puts a number behind each answer.

## SIL: the algorithm, on a workstation

In **SIL**, the compiled flight code runs on a **workstation** — an ordinary desktop development computer — inside the Python-driven simulation this module has been building. Everything so far is exercised in a SIL run: the two-rate loop, frame discipline, the sensor and actuator models, event detection.

SIL is where the great majority of GNC bugs are actually found. It is fast. It is cheap, so you can run thousands of cases overnight. And you can see every internal signal, so a wrong sign, a mishandled edge case or a guidance logic error has nowhere to hide.

What SIL cannot tell you is how the code behaves on hardware that is *not* a workstation. The workstation's processor, compiler and floating-point behavior are not the flight processor's. The previous lesson showed how much even number width alone can matter over a long run.

## PIL: the real processor, simulated inputs and outputs

In **PIL**, the flight code moves onto the actual flight processor — or a **[[cycle-accurate emulator|cycle-accurate]]** of it, a program that imitates that processor instruction by instruction and clock tick by clock tick. The sensor data and actuator commands still come from and go to the simulation, not real hardware.

What PIL adds is everything about *this processor running this code*:

- its real instruction timing;
- its real memory footprint — whether the code and data even fit;
- its real arithmetic, fixed-point or floating-point, exactly as the chip does it;
- and, most important for a control system, whether the code finishes within its **cycle budget** — the time allowed for one pass of the loop.

That last one matters because flight processors are often much slower than a workstation. Flight chips are **[[radiation-hardened|rad-hard]]**: built to survive the radiation in space. That toughness costs speed.

::: example A margin that exists on a workstation and not on the target
Suppose the GNC loop runs at $100\,\mathrm{Hz}$, so the cycle budget is $1/100\,\mathrm{s} = 10\,\mathrm{ms}$. A typical heavy task is a **[[Kalman filter measurement update|kalman-update]]**, the step where a navigation filter blends a new measurement into its estimate. Here the state has 9 numbers and the measurement 6. Time it on a workstation, then imagine a full GNC cycle as about 18 tasks of similar cost — sensor processing, navigation, guidance, control, actuator allocation.

```python
import time
import numpy as np

n, m = 9, 6
rng = np.random.default_rng(0)
P = np.eye(n) * 0.1
H = rng.standard_normal((m, n))
R = np.eye(m) * 0.01
x = np.zeros(n)
z = rng.standard_normal(m)

def kf_update(x, P, H, R, z):
    S = H @ P @ H.T + R
    K = P @ H.T @ np.linalg.inv(S)
    x_new = x + K @ (z - H @ x)
    P_new = (np.eye(len(x)) - K @ H) @ P
    return x_new, P_new

for _ in range(200):
    kf_update(x, P, H, R, z)          # warm-up

n_trials = 50000
t0 = time.perf_counter()
for _ in range(n_trials):
    kf_update(x, P, H, R, z)
t1 = time.perf_counter()
per_op_us = (t1 - t0)/n_trials*1e6

n_ops = 18                             # a full cycle's worth of comparable operations
cycle_workstation_us = per_op_us*n_ops
ratio = 35.0                           # illustrative workstation-to-flight-processor speed gap
cycle_flight_us = cycle_workstation_us*ratio
budget_ms = 10.0

print(f"per operation: {per_op_us:.3f} us")
print(f"full cycle, workstation: {cycle_workstation_us:.1f} us "
      f"({cycle_workstation_us/1000/budget_ms:.1%} of a {budget_ms} ms budget)")
print(f"full cycle, flight-representative processor: {cycle_flight_us/1000:.2f} ms "
      f"({cycle_flight_us/1000/budget_ms:.1%} of budget)")
# per operation: 17.838 us
# full cycle, workstation: 321.1 us (3.2% of a 10.0 ms budget)
# full cycle, flight-representative processor: 11.24 ms (112.4% of budget)
```

This measures real time on whatever computer runs it, so your numbers will differ a little. The comparison with the budget is the point, not the exact microseconds.

Step by step. One update took about $17.84\,\mathrm{\mu s}$ (microseconds, millionths of a second). Eighteen of them: $18 \times 17.838 \approx 321\,\mathrm{\mu s}$. As a share of the budget: $0.321 / 10 = 3.2\%$. Nothing in a SIL run would ever raise a concern.

Now suppose the flight processor is about $35$ times slower — an illustrative gap. Then $321\,\mathrm{\mu s} \times 35 \approx 11.24\,\mathrm{ms}$. That is $112\%$ of the budget: the cycle is not finished when the next one is due.

Be honest about how rough this is. Multiplying by a speed ratio ignores **cache** behavior (how often the chip finds data in its small fast memory), **pipelining** (how many instructions it overlaps), the mix of instructions, and whether the chip even has floating-point hardware. That is exactly why PIL exists, instead of this multiplication being good enough. But the direction is the lesson: a margin invisible from the workstation can already be gone on the real chip, and only running the real code on the real (or cycle-accurate) processor tells you which side of the line you are on.
:::

::: warning Treating a timing estimate as a certified margin
The speed-ratio scaling above is a reason to go and run PIL, not a replacement for it. It knows nothing about cache misses, pipeline stalls, interrupts taking the processor away, or a dozen other things that make real execution time on real silicon differ from a multiplication. Treating a spreadsheet estimate as a certified timing margin is exactly the mistake PIL exists to prevent.
:::

## HIL: real hardware, real interfaces, real time

**HIL** adds the actual flight computer box, the real electrical connections to sensors (or stimulators that drive those connections exactly as a real sensor would), the real actuator connections, and — most important — a clock that nothing in the simulation controls. That is **[[real time|real-time]]**: the next tick arrives when the wall clock says so, ready or not.

This is a jump SIL and PIL cannot make, however well they model the software and processor. In SIL and PIL the simulation is always free to wait. It advances the tick only when the computation has finished, however long that took. So the code never actually races the clock.

In HIL, it does. If a cycle overruns its budget, the next real tick arrives on schedule anyway. The result — a **stale command** (last cycle's actuator command held one cycle too long), a dropped sensor sample, an **[[interrupt|interrupt-word]]** left waiting in line — is a genuine defect. Nothing before HIL could have produced it, because nothing before HIL had a real clock to be late against.

::: example A defect that exists only when the clock is real
Model ten thousand cycles of a flight computer's execution time. Most cycles take about $9\,\mathrm{ms}$ (with a spread of $0.15\,\mathrm{ms}$). But $1.5\%$ of them get hit by **bus contention** — other hardware using the shared data connection at the same moment — or an interrupt, and take about $13\,\mathrm{ms}$ instead. These numbers are not measured from any particular hardware. They are built to have the right *shape*: the rare **[[long tail|long-tail]]** that real interrupt controllers and real bus sharing produce.

```python
import numpy as np

rng = np.random.default_rng(7)
n_cycles = 10000
budget_ms = 10.0

base = rng.normal(9.0, 0.15, n_cycles)
spike_mask = rng.random(n_cycles) < 0.015          # 1.5% of cycles hit real contention
spikes = rng.normal(13.0, 1.0, n_cycles)
cycle_time = np.clip(np.where(spike_mask, spikes, base), 6.0, None)

overruns = cycle_time > budget_ms
print("cycles over budget:", int(np.sum(overruns)), f"({100*np.mean(overruns):.2f}%)")
print("max cycle time (ms):", np.max(cycle_time))
print("HIL: stale-command ticks =", int(np.sum(overruns)))
print("SIL/PIL: stale-command ticks = 0 (every overrun above is invisible by construction)")
# cycles over budget: 121 (1.21%)
# max cycle time (ms): 15.362318949011456
# HIL: stale-command ticks = 121
# SIL/PIL: stale-command ticks = 0 (every overrun above is invisible by construction)
```

Out of $10{,}000$ cycles, $121$ ran past $10\,\mathrm{ms}$: $121 / 10{,}000 = 1.21\%$. The worst took $15.4\,\mathrm{ms}$. (Slightly fewer than $1.5\%$, because the random draw happened to pick 121 contended cycles, and every one of them overran.)

Under HIL, each of those $121$ cycles is a tick where an actuator held a **[[stale command|stale-command]]** one cycle too long. That is exactly the kind of rare, intermittent timing defect a flight anomaly investigation hunts for.

Run the identical flight code against the identical simulated vehicle under SIL or PIL, where the tick waits for the computation, and you get *zero* stale commands. Not because the computation is different — it is the same — but because nothing about a SIL or PIL clock can be late.
:::

::: warning Assuming HIL only matters for exotic failures
It is tempting to save HIL for unusual scenarios — a wiring fault, a rare sensor failure — and trust SIL and PIL for normal flight. The example shows an ordinary-sounding defect, a $1.2\%$ tail of overruns under normal load, that SIL and PIL cannot show by their very design. It appears only once a real clock is in charge. HIL is not a check for exotic cases. It is the only stage that tests the passing of real time at all.
:::

## What each step adds, and what none of them fixes

Here is the whole **[[ladder|rungs-picture]]** in one place.

- **SIL** checks the algorithm: is it correct? Fast, cheap, fully visible, and where most bugs are found.
- **PIL** checks the algorithm on the real chip: does the correct code also finish in time, fit in memory, and compute the same numbers on real silicon?
- **HIL** checks everything at the edges of the flight computer. Why does that need real hardware? Because in a pure software model, *you wrote both sides of every interface*. Your sensor model sends exactly the message your harness expects, because you made them match. Real hardware was built by someone else, to a document, and does not always do what the document says.

So the defects HIL finds are mostly **integration defects**, not algorithm defects:

- a message that arrives one frame later than the design assumed (real **bus timing** and latency);
- a device **driver** — the low-level code that talks to one piece of hardware — that behaves differently under load;
- an interrupt storm under a condition nobody modeled;
- a byte-order or **scaling** mismatch (a value sent in one unit, or with one scale factor, and read with another);
- a wiring mistake;
- a sensor whose real electrical failure looks nothing like the model's neat failure;
- a **power transient** — a brief dip or spike in voltage — when an actuator motor switches on.

What HIL does *not* improve is the physics. If the simulation's equations of motion are wrong, or its **[[aerodynamic database|aero-database]]** is wrong, or its integrator is too coarse, plugging in real hardware changes none of that. The flight computer is real, but the vehicle it is flying is still the simulated one. Physics errors are caught by validation, which is the subject of a later lesson in this module.

::: key What each step actually adds
SIL: the algorithm's correctness, on a workstation — fast, cheap, where most bugs are found. PIL: the real processor's real timing, memory and arithmetic — whether correct code also finishes in time and fits, on real silicon. HIL: real hardware, real electrical interfaces and a real clock — bus timing, driver behavior, interrupt interaction, sensor failure modes and power transients, which no software model even attempts to represent. Each step catches defects the step before it *cannot produce*, not merely defects it happened to miss. None of them makes wrong physics right.
:::

## Check yourself

::: check
SIL is the least realistic of the three stages. Why is it still where most GNC bugs are found?
:::

::: answer
It is fast and cheap — thousands of cases in the time one HIL run takes — and you can see every internal signal. That makes it the right tool for algorithm defects: a wrong sign, a mishandled edge case, a logic error in guidance or control.

What it cannot find are defects that exist only because of real processor timing or real hardware. That is why PIL and HIL exist as separate, later stages, rather than SIL being expected to catch everything.
:::

::: check
The PIL example measured about $321\,\mathrm{\mu s}$ on a workstation and estimated $11.24\,\mathrm{ms}$ on a flight processor, against a $10\,\mathrm{ms}$ budget. Why is that estimate not enough, on its own, to conclude the design will break its budget on the real chip?
:::

::: answer
The estimate scales only by a speed ratio. It ignores everything else that differs between a workstation and an embedded flight processor: cache size and hit rate, pipeline depth, whether the chip has floating-point hardware, the instruction mix, and how the compiler generates code for that particular chip. The real time could come out above or below $11.24\,\mathrm{ms}$ for reasons the multiplication cannot see.

Running the real code on the real (or cycle-accurate) processor — PIL — is what answers the question. The estimate only tells you it is worth asking.
:::

::: check
In the HIL example, $121$ of $10{,}000$ cycles overran. Explain exactly why the identical flight code, doing identical computations on identical simulated sensor data, shows zero overruns under SIL or PIL.
:::

::: answer
In SIL and PIL the clock is simulated. The simulation moves to the next tick only after the current tick's computation has finished, so there is no independent wall-clock time for the computation to fall behind.

HIL replaces that with a real clock that moves on no matter what the flight computer is doing. A cycle that runs past its budget then really collides with the next tick. The computation is the same in all three. Only HIL has a clock that can expose a computation that runs too long.
:::

::: check
A program runs a lot of PIL testing, confirms the flight code always finishes well within budget on the real processor, and decides it can cut HIL testing short. What kind of defect does that leave unchecked?
:::

::: answer
PIL confirms timing and arithmetic on the real processor, but the sensor and actuator data are still simulated. So PIL says nothing about real bus timing, real driver behavior under real interrupt load, the real electrical sensor interfaces and how they really fail, wiring, byte order or scaling mistakes between real boxes, or power transients when actuators switch — all of which need real hardware to exist at all.

Finishing in time on the real chip is necessary for a working system. It is not a substitute for testing the hardware the chip has to talk to.
:::

::: check
The lesson calls HIL "the only stage that tests the passing of real time at all." PIL uses the real flight processor — so why doesn't PIL count?
:::

::: answer
In PIL the processor is real, but the inputs usually still arrive on a schedule the simulation controls. The whole loop can run faster or slower than real time, and the simulated clock can wait for the processor instead of racing it.

Only in HIL is every part of the loop — the computation, the interfaces, and the clock that decides when the next input arrives — tied to actual wall-clock time that cannot be paused. That is what makes a real missed deadline possible in the first place.
:::

::: check
Why is a $1.2\%$ rate of overruns, as in the HIL example, a more serious operational finding than a bug that makes every single cycle fail?
:::

::: answer
A bug that fails every cycle is loud. It shows up on the first test run and is easy to reproduce and track down.

A $1.2\%$ intermittent overrun can pass a short test campaign by pure luck. It only shows up statistically, over a long enough run. That is much closer to what a real flight anomaly looks like: rare, hard to reproduce on demand, and found only because someone ran the real system long enough, under real timing, for the tail to appear.
:::

## Summary

| Stage | Runs on | What it adds |
| --- | --- | --- |
| SIL | Flight code on a workstation; everything else simulated | Algorithm correctness; fast and cheap; where most bugs are found |
| PIL | Flight code on the real (or cycle-accurate) processor; simulated inputs and outputs | Real timing, memory footprint and arithmetic on the actual chip |
| HIL | Flight code in the real flight computer, real interfaces, real clock | Bus timing, drivers, interrupts, electrical failure modes, power transients, wiring, byte order and scaling — and genuine missed deadlines |
| Not fixed by any | — | Wrong physics: equations of motion, aerodynamic data, integration error |
| PIL example | $321\,\mathrm{\mu s}$ on the workstation $\to$ about $11.24\,\mathrm{ms}$ on a $35\times$ slower chip, against $10\,\mathrm{ms}$ | A margin invisible on the workstation, gone on the target |
| HIL example | $121 / 10{,}000$ ($1.2\%$) cycles over budget | Stale commands that SIL and PIL cannot produce |

The next lesson looks at what HIL needs in order to run at all: real-time computers, motion tables that physically turn the sensors, and the stimulators that make a real sensor believe it is flying while it sits on a bench.

::: context stimulator-word Making a sensor believe it is flying
A **stimulator** feeds a real sensor, or the wires it plugs into, the signals it would see in flight. A GPS receiver can be fed radio signals from a signal generator that pretends to be the satellites overhead. An IMU's electrical output can be replaced by a box producing the same voltages or digital messages the IMU would produce. The flight computer cannot tell the difference, which is the whole point. The next lesson covers these devices in detail.
:::

::: context cycle-accurate Emulating a chip, tick by tick
An **emulator** is a program that pretends to be a different processor, running that processor's machine code on your own computer. A **cycle-accurate** emulator goes further: it also counts exactly how many clock ticks each instruction would take on the real chip. So it reports the true execution time, even though it may itself run much slower than the real thing. Teams use them when real flight processors are scarce or not yet built — there may be only a handful of flight-grade boards for a whole program.
:::

::: context rad-hard Why flight processors are slow
In space, fast charged particles pass through chips. One can flip a stored bit or even trigger a damaging short circuit. A **radiation-hardened** processor is designed and built to resist this, with larger transistors, extra error checking and special manufacturing. Those choices, and the long qualification process, mean flight processors lag desktop chips by many years. The RAD750, flown on many NASA missions, runs at up to about $200\,\mathrm{MHz}$, while a desktop processor runs at several gigahertz with many cores. That is why "fast enough on my laptop" says little about the flight computer.
:::

::: context kalman-update The measurement update, in one breath
A Kalman filter keeps a best guess of the state, $x$, and a matrix $P$ saying how unsure it is. When a measurement $z$ arrives, it compares $z$ with what it expected to see, $Hx$, and moves its guess part of the way toward the measurement. How far it moves is set by the gain $K$, which weighs how much it trusts its guess against how much it trusts the sensor (whose noise is $R$). Computing $K$ needs a matrix inverse, which is why this step is one of the most expensive in a navigation cycle. The navigation modules earlier in the course derive it fully.
:::

::: context real-time Two meanings of "real time"
In everyday speech "real time" means "live". In engineering it has a sharper meaning: a **real-time system** must finish each job before a fixed deadline, every time. It does not have to be fast — only on time. A $100\,\mathrm{Hz}$ loop is real-time if it always finishes within $10\,\mathrm{ms}$. A system that finishes in $1\,\mathrm{ms}$ on average but occasionally takes $15\,\mathrm{ms}$ is *not*: for a control loop, the rare late cycle is the one that matters.
:::

::: context interrupt-word What an interrupt is
An **interrupt** is a hardware signal that makes the processor drop what it is doing, run a short piece of code to deal with some event — a sensor message arriving, a timer going off — and then return. Interrupts let a computer react quickly without constantly checking every device. But they steal time from whatever was running. If many arrive at once (an "interrupt storm"), the main GNC task can be pushed past its deadline. A software simulation usually has no real interrupts at all, so this problem cannot appear until real hardware is attached.
:::

::: context long-tail The shape of the problem
Cycle times from the example, counted in $1\,\mathrm{ms}$ bins. The height is on a *log scale* — each grid line is ten times the one below — because otherwise the tail would be invisible next to the nearly $10{,}000$ normal cycles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="1">
    <line x1="40" y1="120" x2="330" y2="120"/><line x1="40" y1="90" x2="330" y2="90"/>
    <line x1="40" y1="60" x2="330" y2="60"/><line x1="40" y1="30" x2="330" y2="30"/>
  </g>
  <g font-size="11" text-anchor="end" fill="#6c7a93">
    <text x="36" y="154">1</text><text x="36" y="124">10</text><text x="36" y="94">100</text>
    <text x="36" y="64">1000</text><text x="36" y="34">10⁴</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="41" y="39" width="34" height="111"/><rect x="77" y="39.3" width="34" height="110.7"/>
  </g>
  <g fill="#b4232c" stroke="#1f2a44" stroke-width="1">
    <rect x="113" y="135.7" width="34" height="14.3"/><rect x="149" y="126.5" width="34" height="23.5"/>
    <rect x="185" y="101.1" width="34" height="48.9"/><rect x="221" y="100.2" width="34" height="49.8"/>
    <rect x="257" y="111.6" width="34" height="38.4"/><rect x="293" y="131.9" width="34" height="18.1"/>
  </g>
  <line x1="40" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="112" y1="20" x2="112" y2="150" stroke="#1f2a44" stroke-width="2" stroke-dasharray="5,4"/>
  <text x="116" y="18" font-size="11" fill="#1f2a44">10 ms budget</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="40" y="166">8</text><text x="112" y="166">10</text><text x="184" y="166">12</text>
    <text x="256" y="166">14</text><text x="328" y="166">16</text>
  </g>
  <text x="184" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">cycle time (ms)</text>
</svg>
```

Blue: $9{,}879$ normal cycles. Red: the $121$ that overran. A short test might easily contain none of them.
:::

::: context stale-command A late cycle on the timeline
Ticks every $10\,\mathrm{ms}$. Each bar is one cycle's computation. The third cycle takes about $13.5\,\mathrm{ms}$, so it is still running when the $30\,\mathrm{ms}$ tick arrives.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="345" y2="90" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="30" y1="30" x2="30" y2="96"/><line x1="100" y1="30" x2="100" y2="96"/>
    <line x1="170" y1="30" x2="170" y2="96"/><line x1="240" y1="30" x2="240" y2="96"/>
    <line x1="310" y1="30" x2="310" y2="96"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="110">0</text><text x="100" y="110">10</text><text x="170" y="110">20</text>
    <text x="240" y="110">30</text><text x="310" y="110">40 ms</text>
  </g>
  <rect x="30" y="60" width="63" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="100" y="60" width="63" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="170" y="60" width="94.5" height="18" fill="#b4232c" stroke="#1f2a44"/>
  <text x="240" y="24" font-size="11" text-anchor="middle" fill="#b4232c">tick arrives, cycle not done</text>
  <text x="290" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">old command held</text>
</svg>
```

The actuators keep acting on the previous command for another cycle. In SIL the $30\,\mathrm{ms}$ tick would wait.
:::

::: context rungs-picture What is real at each stage
Filled circles are real; hollow circles are simulated.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="120" y="22">flight code</text><text x="190" y="22">processor</text>
    <text x="260" y="22">interfaces</text><text x="325" y="22">clock</text>
  </g>
  <g font-size="13" font-weight="700" fill="#1f2a44">
    <text x="20" y="59">SIL</text><text x="20" y="99">PIL</text><text x="20" y="139">HIL</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <circle cx="120" cy="55" r="10" fill="#1d6fd1"/><circle cx="190" cy="55" r="10" fill="#fff"/>
    <circle cx="260" cy="55" r="10" fill="#fff"/><circle cx="325" cy="55" r="10" fill="#fff"/>
    <circle cx="120" cy="95" r="10" fill="#1d6fd1"/><circle cx="190" cy="95" r="10" fill="#1d6fd1"/>
    <circle cx="260" cy="95" r="10" fill="#fff"/><circle cx="325" cy="95" r="10" fill="#fff"/>
    <circle cx="120" cy="135" r="10" fill="#1d6fd1"/><circle cx="190" cy="135" r="10" fill="#1d6fd1"/>
    <circle cx="260" cy="135" r="10" fill="#1d6fd1"/><circle cx="325" cy="135" r="10" fill="#1d6fd1"/>
  </g>
</svg>
```

Each row adds one more real column. The flight code is real in every row — that was the previous lesson's rule.
:::

::: context aero-database Why real hardware cannot fix a wrong model
An **aerodynamic database** is a large table of the forces and moments the air puts on the vehicle, at each speed, angle and altitude, built from wind-tunnel tests and computer flow models. The simulation looks it up at every step. In HIL, the flight computer is real, but the air it is "flying" through is still that table. If the table is wrong, the flight computer gets exactly the same wrong answers it got in SIL. Only comparison with independent evidence — wind-tunnel data, analytic checks, and eventually flight data — can catch that.
:::
