---
id: l06-sample-times
title: 'Sample times: the beat every block runs on'
minutes: 22
covers:
  - 'Sample times: continuous, discrete, inherited, constant; colour coding'
---

Think about the clocks in a school. The bell rings every 50 minutes to change classes. The cafeteria runs on its own schedule, once at noon. The hall lights stay on the whole day and never change. And the teacher's voice is continuous: it never stops between bells. All of these run side by side in the same building, each on its own timing.

A Simulink model is the same. The plant's physics flows continuously. The flight software runs in beats: an IMU read 400 times a second, a navigation filter 100 times, guidance 10 times. Some values, such as a vehicle's dry mass, never change at all. The number that says how often a block computes its output is its **sample time**. Lesson 4 met it as a rule — the fixed step must divide every sample time — and lesson 5 dealt with events that fall between beats. This lesson is about the beats themselves: the four kinds of sample time you will set, how Simulink works out the ones you did not set, and how to see them on the diagram at a glance.

This matters on a real team for a blunt reason. A flight computer runs each piece of code at a fixed rate, and a model that gets a rate wrong produces a filter that is ten times too slow, or a controller that thinks it runs faster than it does. Such bugs do not crash the model. They quietly change the answer.

## The four kinds

Every block's sample time is written as a pair $[T_s, T_o]$. Read $T_s$ as "T sub s", the **[[sample period|sample-period]]**: how much time passes between one run of the block and the next. Read $T_o$ as "T sub o", the **offset**: how long after time zero the first run happens. A single number means an offset of zero.

**Continuous: 0.** A continuous block has no beat. Its output is a smooth function of time, and the solver computes it at every step and at every stage inside a step. Integrator, Transfer Fcn and State-Space are continuous. So are the Sine Wave and Step sources by default. The sample time is written `0`, or `[0, 0]`.

**Discrete: $[T_s, T_o]$.** A discrete block updates only at its **sample hits**, the times

$$
t = n T_s + T_o, \qquad n = 0, 1, 2, \dots
$$

Between hits its output holds still, like a scoreboard that only changes when someone scores. That hold is called a **[[zero-order hold|zero-order-hold]]**. A 50 Hz controller has $T_s = 0.02$ s. The offset must satisfy $0 \le T_o < T_s$. Unit Delay, Discrete Transfer Fcn and Discrete-Time Integrator are the everyday discrete blocks; you give them a period in their Sample time parameter.

**Inherited: -1.** A block with sample time `-1` has no rate of its own. It takes the rate of the signal that drives it. A Gain block after a 100 Hz filter runs at 100 Hz; the same Gain after a continuous Integrator is continuous. Most blocks that do simple math — Gain, Sum, Product, Saturation — default to `-1`. If a block's inputs come in at different rates that are whole-number multiples of each other, it takes the fastest of them.

**Constant: inf.** A block with sample time `inf` produces an output that never changes during the run. Simulink computes it once at the start and never again. The Constant block defaults to `inf`. Downstream blocks that depend only on constants become constant too, so a whole chain of arithmetic on fixed parameters costs nothing per step.

::: key
Sample times. Continuous: 0 — computed at every solver step. Discrete: $[T_s, T_o]$ — runs at $t = nT_s + T_o$ and holds its output between hits. Inherited: -1 — takes the rate of its driving signal. Constant: inf — computed once and never again.
:::

There are a few more kinds you will meet later: a **fixed in minor step** time `[0, 1]` for a block that is continuous but only changes at the solver's main steps, and triggered and asynchronous times for blocks that run only when an event fires. The architecture module covers triggered subsystems.

::: example Sample hits in a GNC model
A flight software model has four discrete parts. The IMU runs at 400 Hz, the navigation filter at 100 Hz, guidance at 10 Hz, and a telemetry packer at 10 Hz but offset by 50 ms. Write each sample time, list the first sample hits, and find the fixed step the model needs.

**Step 1: periods.** The period is one over the rate. IMU: $1/400 = 0.0025$ s. Navigation: $1/100 = 0.01$ s. Guidance: $1/10 = 0.1$ s. Telemetry: $[0.1, 0.05]$.

**Step 2: sample hits.** Use $t = nT_s + T_o$ with $n = 0, 1, 2$. IMU: 0, 0.0025, 0.005 s. Navigation: 0, 0.01, 0.02 s. Guidance: 0, 0.1, 0.2 s. Telemetry: $0.05$, $0.05 + 0.1 = 0.15$ and $0.25$ s.

**Step 3: the fixed step.** Every period and every offset must be a whole-number multiple of the step. The largest such step is the **[[greatest common divisor|gcd]]** of 0.0025, 0.01, 0.1 and 0.05. Each of those is a multiple of 0.0025 ($0.01 = 4 \times 0.0025$, $0.05 = 20 \times 0.0025$, $0.1 = 40 \times 0.0025$), and nothing larger divides 0.0025 itself. So the fixed step is 0.0025 s. This is what Simulink calls the **[[fundamental sample time|fundamental]]**, and it is what it chooses when you leave the step size on `auto`.

**Step 4: count the runs.** In each 0.1 s, the IMU runs $0.1/0.0025 = 40$ times, navigation 10 times, guidance once and telemetry once.

**Sanity check.** The telemetry packer never runs at the same instant as guidance: guidance fires on the tenths, telemetry halfway between them. That is exactly why someone gave it an **[[offset|offset]]** — to spread the work across the frame.
:::

Python can do Step 3 for you. Work in whole microseconds so the arithmetic is exact:

```python
from math import gcd

# sample times in microseconds, as [period, offset]
rates = {"IMU": (2500, 0), "nav": (10000, 0), "guidance": (100000, 0),
         "telemetry": (100000, 50000)}

base = 0
for period, offset in rates.values():
    base = gcd(base, gcd(period, offset))
print("fundamental step:", base / 1e6, "s")

for name, (period, offset) in rates.items():
    hits = [(offset + n * period) / 1e6 for n in range(3)]
    print(f"{name:10s} runs at t = {hits} ...")
# fundamental step: 0.0025 s
# IMU        runs at t = [0.0, 0.0025, 0.005] ...
# nav        runs at t = [0.0, 0.01, 0.02] ...
# guidance   runs at t = [0.0, 0.1, 0.2] ...
# telemetry  runs at t = [0.05, 0.15, 0.25] ...
```

::: warning Decimal periods and round-off
In floating-point arithmetic, 0.1 is not exactly one tenth, and $0.1/0.0025$ may not come out as exactly 40. Simulink allows for this with a small tolerance, but periods such as 0.003 s (333.3 Hz) next to 0.01 s produce a fundamental step of 0.001 s and many hits that line up with nothing. Choose rates whose periods divide each other cleanly — 400, 200, 100, 50, 10 Hz — and the timing stays simple, in the model and on the flight computer.
:::

## Inherited sample time: convenient and non-local

Inheritance is what makes a block reusable. A Gain does not care what rate it runs at; it multiplies. Set it to `-1` and the same block works in a 400 Hz loop and a 10 Hz loop. A whole subsystem built from inherited blocks can be dropped anywhere and pick up the rate of whatever feeds it.

Simulink works out these rates when it compiles the model — when you run it, or press **Update Diagram** (Ctrl+D). It starts from the blocks whose rates are set and passes each rate along the lines to the inherited blocks downstream, a process called **[[sample-time propagation|propagation]]**. In some cases it also passes rates backward, from a block to an inherited source that feeds it.

The catch is in the word "non-local". Look at an inherited block by itself and you cannot tell its rate. The answer lives somewhere upstream, maybe three subsystems away. Change that far-off block, and this one changes too, without anyone touching it.

::: key
Inherited sample time (-1): the block takes the rate of its driving signal, which lets a subsystem be reused at several rates. It also makes the actual rate non-local, so sample-time colour coding and the model display are how you check what you actually got.
:::

::: example A reused filter, ten times too slow
A team builds a smoothing filter as a subsystem, with every block inherited. Inside, it computes

$$
y_n = 0.9\, y_{n-1} + 0.1\, u_n,
$$

"the new output is 90% of the old output plus 10% of the new input". They tuned it in a 100 Hz loop. Someone later reuses the subsystem after a 10 Hz sensor. What changes?

**Step 1: the filter's time constant at 100 Hz.** Each step, the output keeps 0.9 of its old value. A continuous lag with time constant $\tau$ ("tau") keeps $e^{-T_s/\tau}$ per step. Setting $e^{-T_s/\tau} = 0.9$ gives

$$
\tau = \frac{-T_s}{\ln 0.9} = \frac{0.01}{0.10536} \approx 0.0949\,\mathrm{s}.
$$

**Step 2: the same coefficients at 10 Hz.** The coefficients did not change, so the filter still keeps 0.9 per step. But a step is now 0.1 s:

$$
\tau = \frac{0.1}{0.10536} \approx 0.949\,\mathrm{s}.
$$

**Step 3: the result.** The filter now responds ten times more slowly. It still runs, with no warning, and its output looks smooth and reasonable. In a control loop, that extra lag eats phase margin and may make the loop unstable.

**Sanity check.** A discrete filter's coefficients encode "per step", not "per second". Ten times longer steps with the same per-step coefficients must mean a ten times longer time constant. The numbers agree.

**The fix.** Either compute the coefficients from the sample time inside the subsystem (for example $a = e^{-T_s/\tau}$ with $\tau$ as a parameter), or set the subsystem's input rate explicitly so a wrong placement is caught.
:::

::: warning Inherited sources
A source block, such as a Sine Wave, with sample time `-1` has nothing upstream to inherit from. Simulink then gives it a rate from the blocks it feeds, or falls back to a default such as the fundamental step. Either way, the rate is decided somewhere else. For sources and at subsystem boundaries, set the rate on purpose. Many flight teams make that a modeling rule: every Inport of a flight software subsystem carries an explicit sample time.
:::

## Seeing the rates: colors and the Timing Legend

Since rates can be non-local, you need a way to see all of them at once. Simulink paints them on the diagram. Turn on **sample time colors** (in the Debug tab, under Information Overlays, Sample Time), update the diagram, and every block and line is colored by its rate.

The idea is a map legend. Each rate in the model gets its own color. The documented scheme gives continuous blocks black, the fastest discrete rate red, the second-fastest green, and further rates further colors in order of speed. Constant blocks, triggered blocks and **[[hybrid|hybrid]]** subsystems (ones containing more than one rate) each get their own color as well.

Two details make the colors trustworthy only if you know them:

- **Colors mean rank, not a fixed period.** Red means "the fastest discrete rate in this model", not "400 Hz". Add a faster block and the old red rate becomes green, and every color after it shifts.
- **Colors update when the diagram updates.** Change a sample time and nothing repaints until you press Update Diagram or run the model.

The key to the map is the **Timing Legend**, a panel (Ctrl+J opens it) that lists every rate in the model. Each row shows the color, a short **annotation** such as D1 for the fastest discrete rate and D2 for the next, and the actual period and offset. You can also choose to show those annotations on the diagram itself, instead of or alongside the colors, which helps anyone who has trouble telling the colors apart. Click a row in the legend and Simulink highlights the blocks at that rate.

::: key
Sample-time colour coding: after Update Diagram, each rate in the model is drawn in its own colour — continuous black, the fastest discrete rate red, the next green, and so on by speed, with separate colours for constant, triggered and hybrid (multi-rate) blocks. The Timing Legend lists every colour with its annotation (D1, D2, …) and its period and offset.
:::

Here is how a GNC engineer uses the map in practice. Open a model from another team and turn on the colors. The plant should be black. The flight software should be red, green and further colors, in blocks that match the design document. A hybrid subsystem is a place where rates meet and deserves a close look; lesson 7 shows the Rate Transition block that belongs there. A constant block where you expected a changing signal is a parameter someone froze. And any block colored "continuous" inside the flight software is a bug waiting to happen, because the flight computer has no continuous time to give it.

::: warning A continuous block in the flight software
An Integrator or Transfer Fcn that ends up inside a flight software subsystem runs happily in simulation — the solver integrates it at every step. But the code that runs on the flight computer must be discrete. If you see black inside a subsystem that will become flight code, replace the block with its discrete version (Discrete-Time Integrator, Discrete Transfer Fcn) at the correct rate. Lesson 9's golden rule makes this a requirement.
:::

## Check yourself

::: check
Give the sample time you would type for each: (a) a navigation filter at 50 Hz; (b) a vehicle's dry mass, fixed for the run; (c) a Gain that should run at the rate of whatever drives it; (d) a rigid-body dynamics Integrator.
:::

::: answer
(a) $1/50 = 0.02$, so `0.02` (or `[0.02, 0]`). (b) `inf`, constant: computed once. (c) `-1`, inherited. (d) `0`, continuous. The Integrator's default is already continuous, so you would not usually type anything.
:::

::: check
A block has sample time `[0.04, 0.01]`. List its first four sample hits, and say which of these is allowed as the model's fixed step: 0.02 s, 0.01 s, 0.005 s.
:::

::: answer
Hits at $t = 0.04\,n + 0.01$: 0.01, 0.05, 0.09 and 0.13 s. The fixed step must divide both the period 0.04 and the offset 0.01. 0.02 divides 0.04 but not 0.01, so it is not allowed. 0.01 divides both ($0.04 = 4 \times 0.01$), so it is allowed and is the largest choice. 0.005 is also allowed but twice as costly.
:::

::: check
You add a 1 kHz sensor model to a model whose fastest rate was 100 Hz. The controller blocks, which were red, turn green. Did their rate change?
:::

::: answer
No. The colors show rank, not period. The new 1 kHz rate is now the fastest discrete rate, so it takes the first color (red), and the 100 Hz blocks move to the second color (green). Check the Timing Legend: the 100 Hz row still shows a period of 0.01 s, now under the annotation D2 instead of D1.
:::

::: check
A discrete filter with coefficient 0.95 per step was tuned at 200 Hz. What is its time constant, and what does it become if the subsystem inherits a 50 Hz rate instead?
:::

::: answer
At 200 Hz, $T_s = 0.005$ s and $\tau = -T_s/\ln 0.95 = 0.005/0.05129 \approx 0.0975$ s. At 50 Hz, $T_s = 0.02$ s and $\tau = 0.02/0.05129 \approx 0.390$ s, four times longer, because the steps are four times longer with the same per-step coefficient. The color map or the Timing Legend would show the subsystem at the slower rate.
:::

::: check
Why does a whole chain of Gain and Sum blocks fed only by Constant blocks cost nothing per step?
:::

::: answer
The Gain and Sum blocks are inherited (-1). Their only inputs are constant (inf), so they inherit the constant rate too. Simulink computes the whole chain once when the simulation starts and never again, and the colors show the chain in the constant color.
:::

## Summary

| Kind | Typed as | Runs | Typical blocks |
|---|---|---|---|
| Continuous | `0` | Every solver step and stage | Integrator, Transfer Fcn, State-Space |
| Discrete | `Ts` or `[Ts, To]` | At $t = nT_s + T_o$, holds between | Unit Delay, Discrete Transfer Fcn |
| Inherited | `-1` | At the rate of its driving signal | Gain, Sum, Product, Saturation |
| Constant | `inf` | Once, at the start | Constant |
| Fundamental sample time | `auto` fixed step | GCD of all periods and offsets | — |
| Colour coding | Debug, Information Overlays, Sample Time | Black continuous, red fastest discrete, green next | Timing Legend lists them all |

A model with several rates needs something at every place where they meet, or a fast block will read a slow signal halfway through its update. The next lesson builds multirate models properly with the Rate Transition block, and weighs its two promises: data integrity and determinism.

::: context sample-period Period and rate are two views of one number
Engineers switch between the **period** $T_s$, in seconds, and the **rate** $f = 1/T_s$, in hertz (times per second). A 50 Hz loop has a 0.02 s period; a 400 Hz IMU has a 2.5 ms period. Flight software documents usually quote rates, and Simulink parameters want periods, so the conversion happens constantly. Hertz is named after Heinrich Hertz, who first demonstrated radio waves in the 1880s.
:::

::: context zero-order-hold A staircase from samples
"Zero-order" means the value between samples is a polynomial of order zero — a constant. The hold keeps the last sample until the next one. That is also what a real digital-to-analog converter does to an actuator command, which is why a discrete controller in Simulink behaves the way the flight computer's output will.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M30,110 C90,30 150,20 210,60 C260,95 300,110 340,70" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <polyline points="30,110 80,110 80,59 130,59 130,38 180,38 180,44 230,44 230,73 280,73 280,93 330,93" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="30" cy="110" r="3.5"/><circle cx="80" cy="59" r="3.5"/><circle cx="130" cy="38" r="3.5"/><circle cx="180" cy="44" r="3.5"/><circle cx="230" cy="73" r="3.5"/><circle cx="280" cy="93" r="3.5"/></g>
  <text x="250" y="145" font-size="11" fill="#1f2a44">time, steps of Ts</text>
  <text x="282" y="60" font-size="11" fill="#1d6fd1">continuous</text>
  <text x="140" y="80" font-size="11" fill="#b4232c">held output</text>
</svg>
```

The dots are the sample hits; the flat lines are the hold.
:::

::: context gcd The biggest ruler that measures them all
The greatest common divisor of several numbers is the largest number that goes into each of them a whole number of times. For 12 and 18 it is 6. For periods, think of it as the longest tick of a metronome on which every block's beat still lands. Working in whole microseconds, as the Python snippet does, turns the periods into integers so the answer is exact.
:::

::: context fundamental The heartbeat of a fixed-step model
The fundamental sample time is the shortest tick from which every rate in the model can be built by counting. On the timeline below, the 0.0025 s ticks are the solver's beat; the 0.01 s navigation hits land on every fourth tick.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#8fb8f0" stroke-width="2">
    <line x1="30" y1="52" x2="30" y2="68"/><line x1="55" y1="52" x2="55" y2="68"/><line x1="80" y1="52" x2="80" y2="68"/><line x1="105" y1="52" x2="105" y2="68"/><line x1="130" y1="52" x2="130" y2="68"/><line x1="155" y1="52" x2="155" y2="68"/><line x1="180" y1="52" x2="180" y2="68"/><line x1="205" y1="52" x2="205" y2="68"/><line x1="230" y1="52" x2="230" y2="68"/><line x1="255" y1="52" x2="255" y2="68"/><line x1="280" y1="52" x2="280" y2="68"/><line x1="305" y1="52" x2="305" y2="68"/><line x1="330" y1="52" x2="330" y2="68"/>
  </g>
  <g fill="#b4232c"><circle cx="30" cy="38" r="5"/><circle cx="130" cy="38" r="5"/><circle cx="230" cy="38" r="5"/><circle cx="330" cy="38" r="5"/></g>
  <text x="30" y="22" font-size="11" fill="#b4232c">navigation, every 0.01 s</text>
  <text x="30" y="90" font-size="11" fill="#1d6fd1">fundamental step 0.0025 s</text>
</svg>
```
:::

::: context offset Why flight software staggers its tasks
A flight computer has one processor budget per frame. If guidance, telemetry and a health check all start on the same tick, that tick is crowded and the others are idle. Giving some tasks an offset spreads the load so the worst frame is lighter. It also lets data flow in order within a frame: a task offset slightly after the navigation update gets that update's fresh result. The price is that offsets have to be planned and documented, because they change when each output appears.
:::

::: context propagation How Simulink works out the rates
When Simulink compiles a model, it first collects every block whose rate is set: sources, discrete blocks, continuous blocks. Then it walks the lines, handing each inherited block the rate of its input, over and over, until nothing changes. If a block still has no rate at the end, Simulink either passes one backward from the blocks it feeds or assigns a default. The whole process happens before the first time step, which is why the colors only appear after an update.
:::

::: context hybrid Where two rates meet
A subsystem is hybrid when blocks inside it run at more than one rate: a 100 Hz filter feeding a 10 Hz guidance law, say. Nothing is wrong with that, but every line that crosses from one rate to another is a question: which sample does the slower block read, and can the faster block change the value while it is being read? Lesson 7 answers both with the Rate Transition block.
:::
