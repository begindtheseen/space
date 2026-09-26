---
id: l01-hard-soft-firm-real-time
title: Hard, soft and firm real-time; determinism, WCET and jitter
minutes: 23
covers:
  - Hard vs soft vs firm real-time, and why "fast" and "real-time" are unrelated properties
  - Determinism, worst-case execution time, and jitter as the three things you actually measure
---

Think about a car's airbag. When the car hits something, a small computer has a few hundredths of a second to decide and fire. If it fires a second late, it does not matter that its decision was perfect. The driver has already hit the steering wheel. The right answer, too late, is a wrong answer.

Now think about a video call. Sometimes the picture freezes for a moment, then catches up. Annoying, but nobody gets hurt, and the call goes on.

Both are computers racing a clock. What differs is what happens when they lose the race. This module is about writing code that never loses a race it must not lose — and being able to *prove* it will not, before the code flies. A guidance answer that is perfect but two cycles late is no answer at all: the vehicle has already moved on.

This lesson builds the words the rest of the module stands on. First, three kinds of real-time. Then why "fast" is a different thing. Then the three quantities you actually measure: determinism, worst-case execution time, and jitter.

## Hard, soft and firm real-time

A **real-time system** is one where correctness depends on *when* the answer appears, not only on what it is. Every such task has a **deadline** — the latest moment its answer is still useful. Real-time tasks come in three kinds, sorted by what a missed deadline costs.

**Hard real-time**: a missed deadline is a system failure, as bad as a wrong answer. The airbag is hard real-time. So is the loop steering a rocket's engine with **[[thrust-vector control|tvc]]** — tilting the engine to point the push. Suppose this cycle's command is not ready when the engine's actuator needs it. The vehicle flies on old data, and its stability margins were worked out assuming that would not happen. Miss enough cycles in a row and the vehicle loses control of its attitude — which way it is pointing. A **[[stale command|stale-command]]** can even be worse than none, because it keeps steering in a direction that is no longer right.

**Soft real-time**: a missed deadline makes the result worse, but is not itself a failure. A telemetry task that misses one radio window sends slightly older data next time. Nothing on the vehicle misbehaves, and the ground picture recovers when the next packet lands. The value of the answer fades gradually as it gets later.

**Firm real-time** sits between them. A late result is worthless, as in the hard case — but its lateness is not a failure, only wasted work. Picture a school bus. If you reach the stop after it leaves, getting to the stop was pointless, but the day goes on. On a spacecraft: a program that must tag a camera frame before the frame is thrown away. A late tag is dropped and the frame is lost, but nothing else goes wrong.

Hard and firm differ in **[[consequence, not tightness|value-curves]]**. A firm deadline can be shorter, in milliseconds, than a hard one on a slower loop.

The class, not the speed of the loop, decides how much care a deadline deserves. A hard task earns a written proof that it always fits, a measured worst case with margin, and a place on the list a **[[certification reviewer|certification]]** will make you defend line by line. A soft task earns a sensible design and a monitor. Spending hard-real-time rigor on everything wastes effort the truly hard tasks needed. Spending soft-real-time reasoning on the steering loop is how vehicles are lost.

## Fast is not real-time

The most common confusion in this subject is treating "fast" and "real-time" as one property. They are not related.

- **Fast** is about the *typical* time: how long it usually takes.
- **Real-time** is about the *bound*: the longest it can ever take, and whether that fits the deadline every single time — including the one time in a million when everything goes wrong together.

A system can be fast and not real-time: quick on most runs, but with no limit on how slow it gets under load. A system can also be real-time without being fast. A controller that always takes exactly $8\,\mathrm{ms}$ against a $50\,\mathrm{ms}$ deadline is in no hurry at all. It is real-time because $8\,\mathrm{ms}$ is a guarantee, not because it is quick.

::: example Two controllers, one deadline
A rate-control task runs at $100\,\mathrm{Hz}$ — $100$ times a second — so each cycle has a hard $10\,\mathrm{ms}$ deadline. Two versions are timed over ten thousand cycles on the real processor.

| | Version A | Version B |
| --- | --- | --- |
| Mean execution time | 6.0 ms | 1.4 ms |
| Measured worst case | 6.3 ms | 11.8 ms |
| Cycles over 10 ms | 0 | 3 |

**Step 1: compare the means.** $6.0 / 1.4 \approx 4.3$, so Version B is more than four times faster on average. Someone reading only that column would pick B.

**Step 2: compare against the deadline.** A deadline is checked on every cycle, not on average. B went over $10\,\mathrm{ms}$ three times.

**Step 3: turn cycles into time.** At $100$ cycles per second, ten thousand cycles is $10\,000 / 100 = 100\,\mathrm{s}$. That is shorter than a **[[single stage burn|stage-burn]]**. So B would likely miss deadlines during one flight.

**Answer:** Version A flies. Its mean is four times worse, and that does not matter, because the mean is not what a deadline is checked against.
:::

::: key
**Hard real-time**: a missed deadline is a system failure, not a degradation. Correctness depends on *when* the answer appears as much as on what it is. Fast is not the same as real-time — a deterministic 5 ms is worth more to a control loop than an average 1 ms with a 20 ms **[[tail|tail]]**.
:::

## Determinism

In everyday talk, "deterministic" means the same thing happens every time. Here it means something looser and more useful. **Determinism** is when the *timing* has a known upper limit: for every legal input, you can prove the code finishes within some time, and that time fits the deadline.

Flight code branches on sensor data, so no two runs follow the same steps. That is fine. A task that always takes somewhere between $2$ and $4\,\mathrm{ms}$, depending on input, is deterministic in this sense — because $4\,\mathrm{ms}$ is a proven ceiling.

So the goal is not constant time, which is rarely possible and rarely needed. The goal is *analyzable* time:

- every loop has a provable maximum number of passes;
- the cost of every branch is known;
- no path waits on something outside with no time limit;
- the worst case over every path is a number you can write down before the code runs.

Lesson eight builds on exactly this. Flight code bans the heap so memory behaviour can be analyzed. It bans recursion and unbounded loops so the order of steps can be analyzed. And it watches the **[[cache|cache]]** and the branch predictor, because those two are the usual reasons a loop that *looks* bounded takes an unpredictable time in practice.

## Worst-case execution time

**Worst-case execution time**, or **WCET** ("double-u-see-ee-tee"), is the longest a piece of code can take, over every input and hardware state it can legally meet. It is the only timing number a proof of schedulability may use.

Everywhere else in software, the average and the **percentiles** are the numbers worth reporting. (The 99th percentile is the time that 99 runs out of 100 finish within.) Here they do not count at all. The next two lessons test an inequality — is the worst case at most the deadline? An inequality built from anything softer than a worst case proves nothing about the one cycle that matters.

WCET is found two ways, and a serious program uses both, because each catches what the other misses.

- **Measurement** runs the code on the real processor over the widest and nastiest set of inputs and hardware states you can arrange: caches cold, branch histories at their worst, other traffic on the memory bus. It records the largest time seen. It is honest about the real hardware, and blind to any path the tests never ran.
- **Static analysis** reads the code instead of running it. It bounds every loop by its provable maximum, walks every path through the **[[control-flow graph|control-flow-graph]]**, and adds up costs from a model of the processor's timing. It covers every path, and it is only as accurate as its processor model.

A mature process compares the two, uses the larger number in the proof, and treats a big gap between them as a sign that the model or the tests are missing something.

::: key
**WCET** — worst-case execution time. The only statistic a schedulability proof can use. Bounded by measurement over dispersed cases plus static analysis of loop bounds; the mean and even the 99.9th percentile are irrelevant to the proof.
:::

::: example WCET margin for a task in a 10 ms frame
A $100\,\mathrm{Hz}$ control task gets a $10\,\mathrm{ms}$ **frame** — the slot of time each cycle is allowed. It is timed on seven cycles. One of them happens to run a fault-logging branch that is almost never taken in flight. The times, in milliseconds: $2.1, 1.9, 2.0, 2.2, 1.8, 12.4, 2.0$.

**Step 1: the mean.** Add the seven times and divide by seven:

$$
\bar{C} = \frac{2.1+1.9+2.0+2.2+1.8+12.4+2.0}{7} = \frac{24.4}{7} \approx 3.49\,\mathrm{ms}.
$$

(Read $\bar{C}$ as "C bar", the mean execution time.) The **utilisation** — the fraction of the frame the task uses — would be $3.49 / 10 \approx 0.349$, about a third. Looks comfortable.

**Step 2: the worst sample.** The largest time is $12.4\,\mathrm{ms}$. Its utilisation is $12.4 / 10 = 1.24$. That one cycle needed $124\%$ of the frame. It cannot fit, no matter what else runs.

**Sanity check:** the worst case is more than three times the mean, and bigger than the frame. The mean hid it completely.

Seven samples do not prove the true worst case is $12.4\,\mathrm{ms}$ — a longer campaign or a static analysis of the logging branch might find worse. What they already prove is that the mean was the wrong number. A report built on $3.49\,\mathrm{ms}$ would have called this task safe. It is not.
:::

::: warning
Timing a task and reporting the mean, or even the 99th percentile, is not a WCET measurement. It describes typical behaviour, and a hard deadline does not care about typical behaviour. A rare branch, a cold cache line, a page of memory untouched since startup: each is invisible to a short test, and each can turn a comfortable mean into a missed deadline on the thousandth day of the mission.
:::

## Jitter

Picture a metronome that is slightly broken. It is supposed to tick every half second, but some ticks come a little early and some a little late. A musician following it would drift in and out of time. That wobble is **jitter**.

For a computer, **jitter** is the variation in the actual period or start time of a task that is meant to be periodic. A $100\,\mathrm{Hz}$ loop should wake every $10\,\mathrm{ms}$. If it sometimes wakes after $9.6\,\mathrm{ms}$ and sometimes after $10.3\,\mathrm{ms}$, it has jitter — even if every cycle finishes well inside its deadline.

Jitter comes from every layer that is not itself perfectly predictable: how long an interrupt takes to be answered, depending on what the processor was doing; a higher-priority task that sometimes runs long; other processor cores competing for memory; a general-purpose scheduler's own clock tick.

Why does a control engineer care? A varying sample time acts like a varying time delay that the controller cannot correct for, and the loop's **[[phase margin|phase-margin]]** was worked out assuming a fixed one. The job here is to [[measure jitter honestly|jitter-picture]] and shrink it at its source — a hardware timer, a predictable scheduling rule, a processor core reserved for the loop. Trying to cancel it inside the controller afterwards does not work in general.

::: key
**Jitter**: variation in the actual period or start time of a periodic task. It matters to control because it appears as a varying sample time and an effective time delay, eating phase margin at crossover. It is a separate measurement from WCET: a task can run for a short, tightly bounded time and still carry large jitter, if what varies is *when* it starts rather than how long it runs.
:::

::: example Measuring jitter from wake-up timestamps
A task meant to run at $100\,\mathrm{Hz}$ writes down its own wake-up time every cycle. Five in a row, in milliseconds: $0.0,\ 10.2,\ 19.8,\ 30.1,\ 39.9$.

**Step 1: the periods.** Subtract each time from the next: $10.2 - 0.0 = 10.2$, $19.8 - 10.2 = 9.6$, $30.1 - 19.8 = 10.3$, $39.9 - 30.1 = 9.8\,\mathrm{ms}$.

**Step 2: the deviations.** Subtract the nominal $10\,\mathrm{ms}$ from each: $+0.2,\ -0.4,\ +0.3,\ -0.2\,\mathrm{ms}$.

**Step 3: two summary numbers**, which answer different questions.

- The largest single deviation is $0.4\,\mathrm{ms}$. That says how far any one cycle strayed.
- The peak-to-peak spread of the periods is $10.3 - 9.6 = 0.7\,\mathrm{ms}$. That says how much the period itself swings — the number a control-margin calculation needs, because a fixed-delay model cannot capture a swing.

**Sanity check:** the average period is $(39.9 - 0.0)/4 \approx 9.98\,\mathrm{ms}$, almost exactly nominal. The average would have hidden all of the jitter. Five samples cannot bound a real system, but the recipe is the same at any size: log every wake-up, subtract neighbours, and report the spread, not the average.
:::

## Check yourself

::: check
A ground tool reformats telemetry for a dashboard. It usually takes $5\,\mathrm{ms}$ but sometimes $40\,\mathrm{ms}$ when the network is busy, and nobody on the vehicle side cares when it does. Classify it. Then say what would have to change about the *consequence* of lateness — not the deadline — to move it into another class.
:::

::: answer
It is soft real-time. A late update makes the dashboard less fresh, which is unwelcome but not a failure, and things recover smoothly when a timely update arrives.

It would become firm if a late result stopped being useful at all, rather than merely stale — for example, if the dashboard threw away any update that missed its slot, so the work behind it was wasted. It would become hard only if something downstream treated a missing update as a failure, such as an automatic safing action triggered when the update does not arrive. None of this depends on the $5\,\mathrm{ms}$ figure. The class is about what a miss costs.
:::

::: check
A colleague says Version B in the first example is more than four times faster on average, so it should fly, and its rare $11.8\,\mathrm{ms}$ cycles can be fixed later. What is wrong with that plan?
:::

::: answer
Schedulability must hold on every cycle, not on average. A task that sometimes misses its deadline is not a slower working controller — it is a controller that fails, however rarely. Shipping B now means flying a loop that can miss its deadline in the meantime, and on a flight vehicle "the meantime" may be the only flight it gets. B becomes a candidate only once its worst case, not its mean, is shown to fit the deadline. Only then is its speed real margin rather than an average hiding a failure.
:::

::: check
Static analysis of a task's WCET usually gives a larger number than measurement on the same code. Why? And why is "static bound above the measured maximum" the safer way for them to disagree?
:::

::: answer
Static analysis bounds every path, including combinations of branches, cache states and loop counts that a finite test campaign may never trigger together. So it tends to include pessimistic combinations real runs rarely produce all at once. Measurement only reports what it saw.

A static bound above the measured maximum means the analysis is covering a case that is possible but not yet seen — safe, if a little cautious. A measured time *above* the static bound would mean the processor model or the code's control-flow graph is wrong. That is a more serious problem, and it must be fixed before flight.
:::

::: check
A task takes between $3.0$ and $3.4\,\mathrm{ms}$ depending on input, and the $3.4\,\mathrm{ms}$ bound is proven. A reviewer asks why it was not rewritten to take exactly $3.4\,\mathrm{ms}$ every time, so the timing is "truly" predictable. What is the right answer?
:::

::: answer
Determinism needs a proven bound, not a constant time. The proof in the next lessons uses the worst case, $3.4\,\mathrm{ms}$, exactly as it would if every run took that long. Padding every fast path out to $3.4\,\mathrm{ms}$ adds nothing to the proof and burns processor time doing make-work on cycles that were honestly fast. Constant-time code is sometimes worth building for a different reason — to defeat a **timing side-channel**, where an attacker learns secrets by watching how long code takes — but that has nothing to do with meeting deadlines.
:::

::: check
Two tasks both have a $20\,\mathrm{ms}$ period. Task A's wake-ups drift slowly later over a long run: each period is close to nominal, only the total offset wanders. Task B's wake-ups sit within $\pm 0.05\,\mathrm{ms}$ of nominal almost always, but now and then one cycle is skipped entirely, so that one period is $40\,\mathrm{ms}$. Which is the worse jitter problem? Why can a single "maximum deviation" number fail to tell them apart?
:::

::: answer
B is worse, even though its typical deviation is far smaller. A's drift is slow and smooth. A control loop copes with that fairly well, because it looks like a delay that changes very slowly. B's skipped cycle is a big, sudden jump — one period of $40\,\mathrm{ms}$ instead of $20\,\mathrm{ms}$ — and that kind of abrupt timing error eats margin the fastest.

A single "maximum deviation" figure can come out about the same for both. Over a long run, A's slowly wandering offset can reach $20\,\mathrm{ms}$ too, which matches B's one $20\,\mathrm{ms}$ jump. The same number then describes two very different hazards. A proper report gives the shape of the distribution — and period-to-period swings as well as offsets — not only the single extreme.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Real-time system | Correctness depends on *when* the answer appears, not only what it is |
| Hard real-time | A missed deadline is a system failure |
| Soft real-time | A missed deadline degrades the result gradually; not a failure |
| Firm real-time | A late result is worthless, but the system does not fail |
| Fast vs real-time | Fast = typical time; real-time = a proven bound on the worst case that fits the deadline |
| Determinism | The timing bound is known and provable, not that every run takes the same time |
| WCET | Worst-case execution time; the only statistic a schedulability proof may use |
| How WCET is found | Measurement over adversarial cases, reconciled with static analysis of loops and paths |
| Jitter | Variation in a periodic task's actual period or start time |

Next lesson: many tasks share one processor. You will meet the first tool that turns "every deadline is met" from a hope into a proof — rate-monotonic priorities and a one-line utilisation test — and see exactly where that test stops being enough.

::: context tvc Steering by tilting the engine
A rocket has no air to push against for most of its flight, so fins do little. Instead it steers by tilting its engine a few degrees on a pivot called a gimbal. Pointing the push slightly off-center makes the rocket turn, the way pushing a shopping cart from one corner swings it around. Two actuators — powerful electric or hydraulic pistons — do the tilting, and a computer loop tells them where to go many times a second. That loop is the classic hard real-time task.
:::

::: context stale-command Why old data can be worse than none
If a steering command does not arrive, a well-designed actuator can hold still. If an *old* command arrives dressed up as new, the actuator obeys it. The rocket has turned since that command was computed, so the correction may now point the wrong way and make the error bigger. That is why flight software counts cycles, stamps commands with times, and treats a late command as a fault rather than quietly using it.
:::

::: context value-curves Three shapes of lateness
One way to picture the three classes: plot how much the answer is worth against when it arrives. Soft fades gradually after the deadline. Firm drops to zero — worthless, but no harm. Hard drops below zero — being late does real damage.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="340" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="336" y="104" font-size="11" fill="#1f2a44" text-anchor="end">finish time</text>
  <text x="10" y="45" font-size="11" fill="#1f2a44">value</text>
  <line x1="170" y1="22" x2="170" y2="165" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="170" y="176" font-size="11" fill="#6c7a93" text-anchor="middle">deadline</text>
  <polyline points="40,40 170,40 330,82" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="300" y="66" font-size="12" fill="#1d6fd1">soft</text>
  <polyline points="40,44 170,44 170,90 330,90" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <text x="250" y="84" font-size="12" fill="#1f2a44">firm</text>
  <polyline points="40,48 170,48 170,150 330,150" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="250" y="144" font-size="12" fill="#b4232c">hard: failure</text>
</svg>
```
:::

::: context certification Who checks flight software
Before software flies, someone independent has to agree it is safe. For airliners the standard is DO-178C, which sorts software by how bad its failure would be. NASA's software rules, NPR 7150.2, likewise put flight software in its most demanding class. At the strictest levels, reviewers expect evidence for every claim — including a timing argument for each hard deadline — not a promise that it ran fine in the lab.
:::

::: context stage-burn How long a stage burns
A launch vehicle's first stage typically fires for about two and a half minutes before it separates. At $100$ cycles per second, that is roughly $15\,000$ control cycles — more than the ten thousand in the test. A problem that shows up three times in ten thousand cycles should be expected several times in a single ascent.
:::

::: context tail The tail of a timing histogram
Time a task thousands of times and draw a histogram: how many runs took each amount of time. Most runs pile up near the mean. A few rare, slow runs stretch out to the right — the **tail**. The deadline only cares about the far end of that tail.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="342" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1d6fd1">
    <rect x="42" y="60" width="12" height="70"/><rect x="54" y="40" width="12" height="90"/>
    <rect x="66" y="85" width="12" height="45"/><rect x="78" y="112" width="12" height="18"/>
    <rect x="102" y="122" width="12" height="8"/><rect x="198" y="125" width="12" height="5"/>
  </g>
  <rect x="306" y="125" width="12" height="5" fill="#b4232c"/>
  <line x1="64" y1="28" x2="64" y2="130" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="64" y="22" font-size="11" fill="#1d6fd1" text-anchor="middle">mean 1.4</text>
  <line x1="270" y1="28" x2="270" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <text x="270" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">deadline 10</text>
  <text x="313" y="116" font-size="11" fill="#b4232c" text-anchor="middle">11.8</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="30" y="146">0</text><text x="78" y="146">2</text><text x="126" y="146">4</text><text x="174" y="146">6</text>
    <text x="222" y="146">8</text><text x="270" y="146">10</text><text x="318" y="146">12</text>
  </g>
  <text x="340" y="162" font-size="11" fill="#6c7a93" text-anchor="end">execution time, ms</text>
</svg>
```

The bar heights are a sketch, but the times on the axis are to scale and match Version B from the example: mean $1.4\,\mathrm{ms}$, worst $11.8\,\mathrm{ms}$, past the deadline.
:::

::: context cache Caches: fast when warm, slow when cold
Main memory is slow compared with the processor. So the chip keeps a small, very fast copy of recently used data, called the **cache**. When the data a loop needs is already there, the cache is "warm" and the loop flies. The first time through, or after another task has filled the cache with its own data, it is "cold", and every access waits on main memory. The same code, same inputs, can run several times slower cold than warm — which is why WCET tests deliberately start with a cold cache.
:::

::: context control-flow-graph A map of every path
A **control-flow graph** draws a program as boxes of straight-line code joined by arrows for every possible jump: each branch of an `if`, and the arrow back to the top of a loop. Static analysis finds the costliest route through this map. A loop arrow needs a known maximum number of trips, or the costliest route is endless.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="140" y="10" width="80" height="28" rx="4"/>
    <rect x="50" y="70" width="90" height="28" rx="4"/>
    <rect x="220" y="70" width="90" height="28" rx="4"/>
    <rect x="140" y="130" width="80" height="28" rx="4"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="29">read sensor</text>
    <text x="95" y="89">normal path</text>
    <text x="265" y="89">fault logging</text>
    <text x="180" y="149">loop body</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="165" y1="38" x2="105" y2="70"/><line x1="195" y1="38" x2="255" y2="70"/>
    <line x1="105" y1="98" x2="165" y2="130"/><line x1="255" y1="98" x2="195" y2="130"/>
  </g>
  <path d="M220,144 C290,144 300,190 180,190 C60,190 70,144 140,144" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="208" font-size="11" fill="#b4232c" text-anchor="middle">loop back: at most N times</text>
</svg>
```
:::

::: context phase-margin Phase margin, from the control modules
A feedback loop is stable with room to spare when its corrections do not arrive too late. **Phase margin** measures that room: how much extra delay the loop could take, at the frequency where its gain crosses one, before it starts to oscillate. Every millisecond of delay spends some of it, and the faster the loop, the more each millisecond costs. The digital control module works this out in full; here it is enough to know that jitter spends margin you designed for something else.
:::

::: context jitter-picture Reading jitter off a timeline
Grey ticks show where the wake-ups should be, every $10\,\mathrm{ms}$. The blue bars below show how far each measured period missed nominal, drawn to scale on a much larger axis so they can be seen.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="40" x2="340" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="2">
    <line x1="40" y1="30" x2="40" y2="50"/><line x1="112" y1="30" x2="112" y2="50"/><line x1="184" y1="30" x2="184" y2="50"/>
    <line x1="256" y1="30" x2="256" y2="50"/><line x1="328" y1="30" x2="328" y2="50"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="22">0</text><text x="112" y="22">10</text><text x="184" y="22">20</text><text x="256" y="22">30</text><text x="328" y="22">40 ms</text>
  </g>
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="26" y="134" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="26" y="84" font-size="11" fill="#6c7a93" text-anchor="end">+0.5</text>
  <text x="26" y="184" font-size="11" fill="#6c7a93" text-anchor="end">−0.5</text>
  <line x1="30" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="30" y1="180" x2="340" y2="180" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <g fill="#1d6fd1">
    <rect x="66" y="110" width="20" height="20"/>
    <rect x="138" y="130" width="20" height="40"/>
    <rect x="210" y="100" width="20" height="30"/>
    <rect x="282" y="130" width="20" height="20"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="76" y="104">+0.2</text><text x="148" y="194">−0.4</text><text x="220" y="94">+0.3</text><text x="292" y="164">−0.2</text>
  </g>
</svg>
```
:::
