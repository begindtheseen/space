---
id: l07-multirate-and-rate-transitions
title: Multirate models and the Rate Transition block
minutes: 24
covers:
  - Multirate models and Rate Transition blocks; data integrity versus determinism options
---

Think of a family sharing one whiteboard on the fridge. Mom writes the grocery list once a week. Her son checks it every afternoon on his way to the store. Two problems can happen. If he reads the board while she is halfway through rewriting it, he walks out with half of last week's list and half of this week's: eggs from one, milk from the other, and a list that makes no sense. And if nobody agrees *which* version he should use on Monday, he sometimes gets the new list and sometimes the old one, depending on who was quicker that morning.

A flight computer has the same fridge. The inertial sensors are read 1000 times a second, the attitude controller runs 100 times a second, and guidance plans the path 10 times a second. Each part runs at the rate its job needs. Where their signals meet, one side writes while the other reads, at different paces. A Simulink model with more than one rate is called a **multirate model**, and the block that sits where two rates meet is the **Rate Transition** block.

Lesson 6 showed how every block gets a sample time and how the colors show them. This lesson is about the seams between those colors: what can go wrong when a fast part and a slow part share data, the two checkboxes on the Rate Transition block that guard against it, and what each one costs in delay.

## Why a flight computer runs several rates

Running everything at the fastest rate would be simpler. It would also waste the processor. Guidance might take 15 ms to compute. At 1000 Hz there is only 1 ms per cycle, so guidance would never fit. And there is no reason to run it that often: the planned trajectory changes slowly, so recomputing it 10 times a second is plenty.

So the software is split into **rates**, each a periodic job with its own **period** $T$ (the time between runs) and frequency $1/T$. Read $T$ as "T", the period in seconds. A typical launch vehicle might have:

| Job | Rate | Period |
|---|---|---|
| Read the inertial sensors, filter them | 1000 Hz | 1 ms |
| Attitude control, actuator commands | 100 Hz | 10 ms |
| Guidance, mode logic | 10 Hz | 100 ms |

In Simulink each of these is a group of blocks with that discrete sample time. The fastest one is the **base rate**, the tick every other rate is counted in.

### Integer multiples

Pick the rates so that each slower period is a whole number of faster periods. Here, 100 ms is 10 times 10 ms, and 10 ms is 10 times 1 ms. When periods are **integer multiples** of each other, the rates line up: every slow tick lands exactly on a fast tick, and the whole pattern repeats every slowest period.

When they do not line up, the model still runs, but the tick the solver must stop at shrinks. In a fixed-step model, Simulink's automatic choice of step is the **greatest common divisor** of the sample times, the largest time that divides all of them evenly. And the pattern of hits only repeats after the **least common multiple**, called the **[[hyperperiod|hyperperiod]]**.

::: example Two rates that do not divide
A team gives the navigation filter a 4 ms period (250 Hz) and the controller a 10 ms period (100 Hz). Nothing runs at a faster rate.

**Step 1: the base step.** The largest time that divides both 4 ms and 10 ms is 2 ms. So the fixed step comes out as 2 ms, although no block in the model runs every 2 ms. Half of the base ticks do no useful work for one of the two rates.

**Step 2: do the rates line up?** $10 / 4 = 2.5$. Not a whole number. The controller's ticks at 0, 10, 20, 30 ms meet the navigation ticks at 0 and 20 ms, but at 10 and 30 ms the latest navigation value is 2 ms old. The age of the data the controller sees keeps changing.

**Step 3: how long until it repeats?** The least common multiple of 4 and 10 is 20 ms. Only every 20 ms does the timing pattern start over.

**Step 4: the fix.** Change the navigation period to 5 ms (200 Hz). Now $10 / 5 = 2$, a whole number. The base step becomes 5 ms, every controller tick is also a navigation tick, and the pattern repeats every 10 ms.

**Sanity check.** The navigation filter now runs a little slower, 200 Hz instead of 250 Hz, which the navigation engineer must agree to. In exchange, every transfer between the two rates has a fixed, known age. That trade is almost always worth it.
:::

::: key
Choose each slower sample time as an integer multiple of the faster ones. Then every slow hit is also a fast hit, the base step is the fastest period, and a Rate Transition block can make the transfer deterministic. Deterministic transfer between rates requires the periods to be integer multiples of each other.
:::

## Single-tasking and multitasking

How do several rates share one processor? Simulink offers two ways to run a multirate model, and the choice changes what can go wrong.

**Single-tasking** means everything runs in one thread of work, one block after another, at the base rate. At a tick where the slow blocks are due, they run too, in the same pass. Nothing ever interrupts anything. That makes it safe, but the pass that includes the slow blocks must still finish before the next base tick. In the table above, the 1 ms pass that includes 15 ms of guidance work would **[[overrun|overrun]]**: it would still be busy when the next tick arrived.

**Multitasking** means each rate becomes its own **task**, a separate job the operating system schedules. Faster tasks get higher **priority**: when a fast task is due, it **[[preempts|preemption]]** a slower one, meaning it pauses the slow task, runs to the end, and lets the slow task continue where it stopped. Now guidance can spread its 15 ms of work across its 100 ms period, sliced up between the fast tasks. This is how real flight software with several rates runs, and it is what the code generators produce for a multitasking model.

In the model's Configuration Parameters, on the Solver pane, the choice appears as a checkbox, "Treat each discrete rate as a separate task". Checked means multitasking. Older releases of Simulink called this setting the tasking mode, with the values SingleTasking and MultiTasking, and you will still see those words in older models and documents.

Multitasking fixes the overrun. It also brings back the fridge problems, because a fast task can now run while a slow task is halfway through writing its output.

::: warning Simulation hides multitasking bugs
On your desktop, Simulink runs a multitasking model in a single thread and imitates the priorities; there is no real preemption. So a signal copied between rates with no protection can still give a perfect-looking plot. On the target, the same copy shows up as a rare glitch that nobody can reproduce. That is why Simulink checks every connection between two rates when it compiles the model, and why that check matters even when the plot looks fine.
:::

## Two things that go wrong at a seam

### Torn data

A signal is not always written in one instant. A quaternion is four numbers; a position vector is three. The processor writes them one at a time. If the writer is preempted after two of the four, a reader that runs in the gap gets a **torn value**: part new, part old, a mixture that was never a real value.

::: example A torn quaternion
The 10 Hz guidance task holds the commanded attitude as a **[[unit quaternion|quaternion]]** $q = [q_0, q_1, q_2, q_3]$, scalar first. The old command is "no rotation", $[1, 0, 0, 0]$. The new command is a 90° turn about the z axis:

$$
q_{\text{new}} = [\cos 45^\circ,\ 0,\ 0,\ \sin 45^\circ] = [0.7071,\ 0,\ 0,\ 0.7071].
$$

**Step 1: the preemption.** Guidance writes $q_0$ and $q_1$ from the new value. Then the 100 Hz controller preempts it and reads all four.

**Step 2: what the controller gets.** New first half, old second half:

$$
q_{\text{torn}} = [0.7071,\ 0,\ 0,\ 0].
$$

**Step 3: is it even a valid quaternion?** An attitude quaternion must have length 1. This one has length $\sqrt{0.7071^2 + 0 + 0 + 0} = 0.7071$. It is neither the old command nor the new one. Code that rotates a vector with a quaternion assumes length 1; with this one, every rotated vector comes out at $0.7071^2 = 0.5$ of its true length.

**Sanity check.** Both real commands have length 1: $1^2 = 1$ and $0.7071^2 + 0.7071^2 = 1.000$. Only the mixture fails. A torn value is not "slightly stale"; it can be nonsense.
:::

### Data of changing age

The second problem is subtler. Suppose the controller never sees a torn value, but it sometimes gets the guidance output from this period and sometimes from the last one, depending on how quickly guidance finished. The answer changes from run to run, even with identical inputs. That is a loss of **[[determinism|determinism]]**: the same inputs no longer give the same outputs. A test that passed yesterday can fail today, and a flight log can no longer be replayed exactly.

## The Rate Transition block

The **Rate Transition** block sits on a signal line where the rate changes. It has one input at one rate and one output at another. Its dialog has two checkboxes, and they answer the two problems above.

- **Ensure data integrity during data transfer.** The reader always gets a complete value, never a torn one. The block does this with **[[protected buffers|double-buffer]]**: the writer fills one copy while the reader uses another, and they swap only when the writing is finished.
- **Ensure deterministic data transfer (maximum delay).** The transfer happens at fixed, known instants, so the reader always gets the value from the same period, and the delay is always the same.

Both are checked by default. The block also has an **Initial conditions** parameter: the value its output holds before the first real value has come through.

::: key
What does a Rate Transition block do? It transfers a signal between blocks at different sample rates, with options trading data integrity (no torn values) against determinism (predictable latency). In a deployed model these choices become real buffering code.
:::

What the block does with both boxes checked depends on the direction of the transfer.

### Fast to slow: a sample-and-hold, no delay

Take a signal going from the 100 Hz controller to a 10 Hz telemetry task. The Rate Transition block acts as a **[[zero-order hold|zoh]]**: at each slow tick it grabs the fast signal's current value and holds it for the whole slow period.

The block runs at the slow rate, but with the fast task's priority. At $t = 0.1\,\mathrm{s}$, the fast task runs first, the block copies the value the fast task computed at $t = 0.1\,\mathrm{s}$, and then the slow task starts and reads that copy for its whole run. No fast update can land in the middle, and no time is lost: the slow task sees the value from its own instant.

### Slow to fast: a hold with one slow period of delay

Now go the other way: guidance at 10 Hz sends a command to the controller at 100 Hz. At $t = 0.1\,\mathrm{s}$ both tasks are due. The fast task has the higher priority, so it runs first. But guidance has not yet computed its $t = 0.1\,\mathrm{s}$ output; it will finish some time in the next 100 ms, preempted many times along the way. The fast task cannot wait for it.

So the block hands the fast task the value guidance finished in the *previous* slow period, and holds it constant until the next slow tick. In multitasking mode, with deterministic transfer, this slow-to-fast transfer is a **unit delay at the slow rate**: the fast side always sees the slow output exactly one slow period late. That fixed delay is the "maximum delay" in the checkbox's name. It is the price of determinism.

::: example The delay a 10 Hz guidance command picks up
Guidance runs at 10 Hz ($T_{\text{slow}} = 0.1\,\mathrm{s}$), the controller at 100 Hz, and a deterministic Rate Transition sits between them. Guidance outputs $c_0$ from its run at $t = 0$, $c_1$ from its run at $t = 0.1\,\mathrm{s}$, and so on.

**Step 1: the timeline.** The controller's ticks from $t = 0$ to $0.09\,\mathrm{s}$ read the block's initial condition. The ticks from $0.10$ to $0.19\,\mathrm{s}$ read $c_0$. The ticks from $0.20$ to $0.29\,\mathrm{s}$ read $c_1$. Every value arrives exactly $0.1\,\mathrm{s}$ after the instant it was computed for, every time.

**Step 2: what the delay costs.** A pure delay of $T$ seconds makes a sine wave of angular frequency $\omega$ (read "omega", in rad/s) arrive late by $\omega T$ radians of phase. Lesson 8 derives this. Suppose the guidance loop crosses over at $\omega = 0.5\,\mathrm{rad/s}$:

$$
\omega T = 0.5 \times 0.1 = 0.05\,\mathrm{rad} = 0.05 \times \frac{180^\circ}{\pi} = 2.86^\circ.
$$

**Step 3: the same delay on a faster loop.** If this command fed a loop crossing over at $2\,\mathrm{rad/s}$, the same 0.1 s would cost $2 \times 0.1 = 0.2\,\mathrm{rad} = 11.5^\circ$.

**Sanity check.** Slow guidance loops have low crossover frequencies, so a delay of one guidance period costs them a few degrees, which is why this design is normal. A signal that feeds a fast loop across a slow-to-fast seam pays much more, and that has to be checked.
:::

::: warning Do not put a fast loop across a slow seam
If a feedback loop runs through a slow-to-fast Rate Transition, the whole loop now carries a delay of one *slow* period, not one fast period. A 100 Hz controller whose feedback passes through a 10 Hz block behaves like a 10 Hz controller with extra lag. Keep each feedback loop inside one rate, and pass only commands and slowly changing values across the seams.
:::

### Unchecking the boxes

Each box can be turned off, trading safety for speed or memory.

| Integrity | Determinism | What you get |
|---|---|---|
| on | on | Fixed timing, never torn; slow-to-fast adds one slow period of delay |
| on | off | Never torn, but the reader gets the newest complete value, so the delay varies from run to run |
| off | off | A plain copy: least memory and least delay, but torn values are possible |

Integrity without determinism suits values where freshness matters more than repeatability, such as a status word for telemetry. Neither box is only safe when you can show that the writer can never be preempted mid-write.

## Seeing the seams in a model

With sample-time colors turned on (lesson 6), each rate has its own color, and every line where one color meets another is a seam. Simulink looks at these at compile time. When a model runs multitasking, a direct connection between two rates with no Rate Transition is reported, because it is exactly the unprotected copy in the last row of the table.

The Solver pane also has an option, "Automatically handle rate transition for data transfer", that inserts hidden Rate Transition blocks wherever they are missing. It is convenient. Many flight teams prefer to place every Rate Transition by hand, so that each seam, and each delay it adds, is visible in the diagram and can be reviewed.

When this model becomes **[[flight code|codegen-bridge]]**, each Rate Transition becomes real code: buffers, a flag or index saying which buffer is current, and copies at fixed points in the tasks. The checkboxes you tick here decide how much memory those buffers take and how old the data is when it arrives. The code-generation module comes back to this.

## Check yourself

::: check
A model has blocks at 2 ms, 6 ms and 20 ms. What base step does a fixed-step solver get, and after how long does the pattern of hits repeat? Which pair of rates cannot have a deterministic transfer?
:::

::: answer
The greatest common divisor of 2, 6 and 20 is 2, so the base step is 2 ms. The least common multiple of 2, 6 and 20 is 60, so the pattern repeats every 60 ms. Check the ratios: $6/2 = 3$ and $20/2 = 10$ are whole numbers, but $20/6 = 3.33$ is not. So the 6 ms and 20 ms rates cannot exchange data deterministically. Changing 20 ms to 18 ms or 24 ms (both multiples of 6) would fix it.
:::

::: check
Explain, in your own words, why a torn value can only happen in multitasking mode, not in single-tasking mode.
:::

::: answer
A torn value needs the writer to be interrupted in the middle of writing, with the reader running in the gap. In single-tasking mode every block runs to the end, one after another, in one thread, so nothing is ever interrupted. In multitasking mode a fast task can preempt a slow one at any moment, including between two elements of a vector, so the reader can see half an update.
:::

::: check
A 1 kHz navigation filter sends its estimated position to a 50 Hz guidance task through a Rate Transition with both options checked. Is there added delay? What value does guidance see at $t = 0.04\,\mathrm{s}$?
:::

::: answer
This is fast to slow, so the block acts as a zero-order hold with no added delay. At $t = 0.04\,\mathrm{s}$ the fast task runs first (higher priority), the block copies the position the filter computed at $0.04\,\mathrm{s}$, and guidance uses that copy for its whole run. It sees the filter's $t = 0.04\,\mathrm{s}$ estimate.
:::

::: check
A mode-logic block at 20 Hz sends a command to a 200 Hz controller through a deterministic Rate Transition. How much delay does the transfer add, and how much phase does that delay cost at $1\,\mathrm{rad/s}$?
:::

::: answer
Slow to fast in deterministic mode adds one slow period: $T = 1/20 = 0.05\,\mathrm{s}$. The phase cost at $\omega = 1\,\mathrm{rad/s}$ is $\omega T = 1 \times 0.05 = 0.05\,\mathrm{rad}$, which is $0.05 \times 180/\pi = 2.86^\circ$. The controller's own 200 Hz rate does not enter; the delay is set by the slow side.
:::

::: check
A colleague unchecks "Ensure deterministic data transfer" on a slow-to-fast Rate Transition "to get rid of the delay". What changes, and what new problem appears?
:::

::: answer
With only data integrity on, the fast side gets the newest complete value. Sometimes that is this period's output (if the slow task happened to finish early), sometimes the previous one. The average delay drops, but it now varies with how long the slow task took, which depends on the data and on the other tasks. The values are still never torn, but the system is no longer deterministic: the same inputs can give different outputs, and tests stop being exactly repeatable.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Multirate model | Blocks at more than one sample time | Fastest period is the base rate |
| Integer multiples | Each slow period is a whole number of fast periods | Needed for deterministic transfer; auto step is the GCD, pattern repeats every LCM |
| Single-tasking | All rates in one thread, no interruption | Safe, but the slow work must fit in one base period |
| Multitasking | One task per rate, faster preempts slower | Fits long slow work; needs protected transfers |
| Torn value | Part-new, part-old read after preemption mid-write | Prevented by "Ensure data integrity during data transfer" |
| Determinism | Same inputs, same outputs, fixed delays | "Ensure deterministic data transfer (maximum delay)" |
| Fast to slow | Zero-order hold at the slow rate | No added delay |
| Slow to fast (deterministic, multitasking) | Hold of the previous slow output | One slow period of delay; phase cost $\omega T_{\text{slow}}$ |

The one-slow-period delay is the first delay this module has put into a loop on purpose. The next lesson meets the second: an algebraic loop, a cycle of blocks that all need each other's answer at the same instant, is often broken by inserting a Unit Delay, and that delay's phase cost of $\omega T_s$ radians gets derived and checked against a real margin.

::: context hyperperiod The beat the whole schedule repeats on
The hyperperiod is the length of time after which every task's pattern of runs starts over at the same moment. With rates of 1, 10 and 100 ms it is 100 ms. Real-time engineers analyze one hyperperiod, because if every deadline is met in that window it is met forever. Awkward rates make the hyperperiod long: periods of 7 ms and 11 ms repeat only every 77 ms, and a scheduling problem might appear only once in that long cycle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="34" font-size="12" fill="#1f2a44">4 ms</text>
  <text x="10" y="74" font-size="12" fill="#1f2a44">10 ms</text>
  <line x1="50" y1="40" x2="350" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="80" x2="350" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <g fill="#1d6fd1">
    <rect x="48" y="26" width="5" height="14"/><rect x="104" y="26" width="5" height="14"/><rect x="160" y="26" width="5" height="14"/><rect x="216" y="26" width="5" height="14"/><rect x="272" y="26" width="5" height="14"/><rect x="328" y="26" width="5" height="14"/>
  </g>
  <g fill="#b4232c">
    <rect x="48" y="66" width="5" height="14"/><rect x="188" y="66" width="5" height="14"/><rect x="328" y="66" width="5" height="14"/>
  </g>
  <text x="50" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="190" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="330" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">20 ms</text>
  <text x="190" y="116" font-size="11" fill="#6c7a93" text-anchor="middle">both rates meet only at 0 and 20 ms</text>
</svg>
```

Each tick mark is one run. The two rows share a tick only at 0 and 20 ms, so 20 ms is the hyperperiod.
:::

::: context overrun When a frame runs out of time
An overrun happens when a task is still running at the moment its next run is due. On a real-time target this is a serious fault: the control output for that frame is late or missing, and if it keeps happening the loop behaves as if it had a much longer, irregular delay. Real-time systems count overruns, and many flight programs treat even one as a failure to be investigated. Simulation on a desktop cannot overrun, because simulated time waits for the computer, which is why timing has to be measured on the target.
:::

::: context preemption A task that pauses another
Preemption is how a real-time operating system keeps fast jobs on time. A timer interrupt fires every base tick. The scheduler checks which tasks are due, and if a higher-priority one is ready, it saves the running task's registers and switches to the new one. When that finishes, the paused task resumes exactly where it was, unaware anything happened. Giving faster tasks higher priority is called rate-monotonic scheduling, and it is the standard choice for periodic flight software.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="8" y="38" font-size="12" fill="#1f2a44">fast</text>
  <text x="8" y="88" font-size="12" fill="#1f2a44">slow</text>
  <line x1="45" y1="50" x2="350" y2="50" stroke="#6c7a93" stroke-width="1"/>
  <line x1="45" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <rect x="50" y="30" width="30" height="20" fill="#1d6fd1"/>
  <rect x="150" y="30" width="30" height="20" fill="#1d6fd1"/>
  <rect x="250" y="30" width="30" height="20" fill="#1d6fd1"/>
  <rect x="80" y="80" width="70" height="20" fill="#f2b880"/>
  <rect x="180" y="80" width="70" height="20" fill="#f2b880"/>
  <rect x="280" y="80" width="40" height="20" fill="#f2b880"/>
  <line x1="150" y1="60" x2="150" y2="78" stroke="#b4232c" stroke-width="2"/>
  <line x1="250" y1="60" x2="250" y2="78" stroke="#b4232c" stroke-width="2"/>
  <text x="200" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">slow task paused (red) each time fast task is due</text>
</svg>
```

The slow task's work (orange) is sliced into pieces between the fast task's runs (blue).
:::

::: context quaternion Four numbers for one attitude
A unit quaternion stores an orientation as four numbers: a scalar part $q_0 = \cos(\theta/2)$ and a vector part equal to the rotation axis times $\sin(\theta/2)$, where $\theta$ is the rotation angle. For a 90° turn about z, $\theta/2 = 45^\circ$, giving $[0.7071, 0, 0, 0.7071]$. Because $\cos^2 + \sin^2 = 1$, a true attitude quaternion always has length exactly 1. That built-in check is handy: flight software often tests the length and renormalizes, and a length far from 1 is a sign of corrupted data. The attitude modules later in the course use quaternions throughout.
:::

::: context determinism Why flight teams want repeatable runs
A deterministic system gives the same outputs for the same inputs, every run, bit for bit. For flight software this is what makes testing mean something. A hardware-in-the-loop test that fails can be replayed and debugged. The generated code can be compared value by value with the model. A failure seen in flight telemetry can be reproduced on the ground by feeding the logged inputs back in. A transfer whose delay depends on which task finished first breaks all three.
:::

::: context double-buffer Two copies, one pointer
Double buffering keeps two copies of the shared value. The writer always fills the copy the reader is not using. Only when all of it is written does the writer flip a single index or flag to say "the other copy is current now". Flipping one small number cannot be torn on most processors, so the reader always sees either the complete old copy or the complete new one. The cost is memory, one extra copy of the signal per Rate Transition, and a few instructions for the swap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="20" width="120" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="42" font-size="12" fill="#1f2a44" text-anchor="middle">copy A (current)</text>
  <rect x="120" y="76" width="120" height="34" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="98" font-size="12" fill="#1f2a44" text-anchor="middle">copy B (filling)</text>
  <text x="20" y="98" font-size="12" fill="#b4232c">writer</text>
  <line x1="62" y1="94" x2="116" y2="94" stroke="#b4232c" stroke-width="2"/>
  <polygon points="116,89 116,99 124,94" fill="#b4232c"/>
  <text x="300" y="42" font-size="12" fill="#1d6fd1">reader</text>
  <line x1="244" y1="38" x2="294" y2="38" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="244,33 244,43 236,38" fill="#1d6fd1"/>
  <text x="180" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">when B is complete, a flag flips: B becomes current</text>
</svg>
```
:::

::: context zoh Hold the last value, like a photo
A zero-order hold takes a sample and keeps it constant until the next sample, turning a changing signal into a staircase. The name means the hold uses a polynomial of order zero, a flat line, between samples. It is what every digital-to-analog converter does, and what Simulink does whenever a discrete signal feeds something faster. The hold itself is not free in a feedback loop: on average the staircase lags the smooth signal by half a sample period, which is why sample rates are chosen well above a loop's crossover frequency.
:::

::: context codegen-bridge Where the seams go next
When Embedded Coder generates C from a multitasking model, each rate becomes its own step function, and the engineer who assembles the flight software calls each one from a task at its rate. The Rate Transition blocks turn into small pieces of buffering code between those functions. The code-generation module later in this track shows the generated step functions and how they are hooked into a real-time operating system. The design decisions, though, are all made here, in the model, by where the Rate Transitions sit and which boxes are ticked.
:::
