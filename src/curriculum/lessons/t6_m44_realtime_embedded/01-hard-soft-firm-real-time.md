---
id: l01-hard-soft-firm-real-time
title: Hard, soft and firm real-time; determinism, WCET and jitter
minutes: 21
covers:
  - Hard vs soft vs firm real-time, and why "fast" and "real-time" are unrelated properties
  - Determinism, worst-case execution time, and jitter as the three things you actually measure
---

Every other module in this curriculum asks whether a number is right. This one asks whether it arrived on time. A guidance solution that is numerically perfect but two frames late is not a solution at all — the vehicle has already moved, and the control loop has to act on something else instead. Real-time systems engineering makes "on time" a property you can prove before the code flies, rather than one you hope for afterward.

This lesson sets up the vocabulary the rest of the module depends on: whether a task is hard, soft or firm real-time; why "fast" does not mean what people assume it means here; and what you measure to decide whether code belongs in a control loop. The answers decide whether a late result is a logged anomaly or a loss-of-mission event, and which statistic — mean, tail, or worst case — a reviewer is entitled to demand from you.

## Hard, soft and firm real-time

A **real-time system** is one in which correctness depends on *when* an answer appears, not only on what the answer is. Real-time tasks split into three kinds, by what a missed deadline costs.

**Hard real-time**: a missed deadline is a system failure, exactly as severe as a wrong answer. The rate-control loop commanding a launch vehicle's thrust-vector-control actuators is hard real-time: if this cycle's command is not ready when the actuator driver needs it, the vehicle flies on stale data, the stability margins were computed assuming it would not, and enough missed cycles in a row is a loss of attitude control. A late answer is as useless as no answer at all, and sometimes worse, because a stale command steers actively in the wrong direction rather than holding.

**Soft real-time**: a missed deadline degrades the result but is not itself a failure. A telemetry downlink task that misses one transmission window sends slightly staler data next time; nothing on the vehicle misbehaves, and the ground picture recovers as soon as the next packet lands. Utility falls off gradually with lateness rather than dropping to zero.

**Firm real-time** sits between them: a late result is worthless, as in the hard case, but its lateness is not a system failure — only wasted work. An onboard classifier that must tag a horizon-camera frame before that frame is discarded is firm real-time: a late tag is dropped, the frame is lost, but nothing else misbehaves and no safety margin is spent. Hard and firm differ in consequence, not in tightness — a firm deadline can be tighter, in absolute terms, than a hard one on a slower loop.

The classification, not the sample rate, decides how much engineering effort a deadline deserves. A hard real-time task earns a schedulability proof, a measured worst-case execution time with margin, and a place on the list a certification reviewer will make you defend line by line. A soft task earns a reasonable design and a monitor. Spending hard-real-time rigor everywhere wastes effort the genuinely hard tasks needed; spending soft-real-time reasoning on the rate loop is how vehicles are lost.

## Fast is not real-time

The most persistent confusion in this subject is treating "fast" and "real-time" as one property. **Speed** is a statement about typical latency. **Real-time** is a statement about the *bound* on latency — the worst it can ever be, and whether that worst case fits the deadline every time, including the one time in a million when everything goes wrong together. A system can be fast and not real-time (typical latency low, worst case under load unbounded), and real-time without being fast (a controller that always takes exactly 8 ms against a 50 ms deadline has enormous margin and no urgency, but it is real-time because 8 ms is a guarantee, not because it is quick).

::: example Two controllers, one deadline
A 100 Hz rate-control task has a hard 10 ms deadline. Two implementations are profiled over ten thousand cycles on the target processor.

| | Version A | Version B |
| --- | --- | --- |
| Mean execution time | 6.0 ms | 1.4 ms |
| Measured worst case | 6.3 ms | 11.8 ms |
| Cycles exceeding 10 ms | 0 | 3 |

Version B is more than four times faster on average, and a reviewer skimming the mean column alone would prefer it. But schedulability is a per-cycle guarantee, not a statistical one: three cycles in ten thousand exceeded the deadline, and at 100 Hz ten thousand cycles is a hundred seconds — well inside a single stage burn. Version A is the one that flies. Its mean is worse than B's by a factor of four, and that is irrelevant, because the mean is not the quantity a deadline is checked against.
:::

::: key
**Hard real-time**: a missed deadline is a system failure, not a degradation. Correctness depends on *when* the answer appears as much as on what it is. Fast is not the same as real-time — a deterministic 5 ms is worth more to a control loop than an average 1 ms with a 20 ms tail.
:::

## Determinism

**Determinism**, here, does not mean the same instructions execute every time — flight code branches on sensor data, and it would be strange if it did not. It means the *timing* is bounded and the bound is known: for every legal input, there is a provable upper limit on how long the code takes, and that limit fits the deadline. Determinism is a property of the bound, not of any single run. A task that always takes somewhere between 2 ms and 4 ms, depending on input, is deterministic in the sense this subject needs, even though no two runs take the same time.

The goal is not constant execution time — rarely achievable and rarely necessary — it is *analyzable* execution time: every loop has a provable iteration bound, every branch's cost is known, no path depends on unbounded external state, and the worst case over every reachable path is a number you can write down before the code runs. Lesson eight builds directly on this: static allocation exists so memory behaviour is analyzable, bounded loops and no recursion exist so control flow is analyzable, and cache and branch-predictor awareness matter because those two mechanisms most often make an apparently bounded loop's *timing* secretly unbounded in practice.

## Worst-case execution time

**Worst-case execution time (WCET)** is the longest time code can take, over every input and hardware state it can legally encounter, and it is the only statistic a schedulability argument may use. Everywhere else in software the mean and the tail percentiles are the numbers worth reporting; here they are not admissible at all, because the response-time analysis of the next two lessons is an inequality — is the worst case at most the deadline — and an inequality built from anything softer than a worst case proves nothing about the one cycle that matters.

WCET is established two ways, and a serious programme uses both, because each is blind to what the other catches. **Measurement** runs the code on the target processor over as wide and adversarial a set of inputs and hardware states as can be engineered — cold caches, worst-case branch histories, competing bus traffic — and records the observed maximum; it is honest about the real hardware and blind to any path the campaign never exercised. **Static analysis** bounds every loop by its provable maximum iteration count, walks every path through the control-flow graph, and computes a bound from a model of the pipeline, cache and memory latencies; it is exhaustive over the code's structure and only as accurate as its processor model. A mature process reconciles both, uses the larger figure in the schedulability proof, and treats a large gap between them as a sign the processor model or the test campaign is missing something.

::: example WCET margin: a control task with a 10 ms frame
A 100 Hz control task is profiled over seven cycles, one of which happens to exercise a fault-logging branch almost never taken in flight. Measured times: $2.1, 1.9, 2.0, 2.2, 1.8, 12.4, 2.0$ ms. The mean is

$$
\bar{C} = \frac{2.1+1.9+2.0+2.2+1.8+12.4+2.0}{7} = 3.486\,\mathrm{ms},
$$

which against a $10\,\mathrm{ms}$ frame looks comfortable — a utilisation of $3.486/10 = 0.349$. But the worst of the seven samples is $12.4\,\mathrm{ms}$, a utilisation of $12.4/10 = 1.24$: this one cycle alone needed more frame than was available. The task that "averages fine" contains at least one path that, by itself, cannot be scheduled.

Seven samples do not prove the true worst case is exactly $12.4\,\mathrm{ms}$; a larger campaign or static analysis of the logging branch might find a longer one. What they already prove is that the mean was the wrong number to report — an argument built on $\bar{C}=3.486\,\mathrm{ms}$ would have called this task safe. It is not.
:::

::: warning
Profiling a task and reporting the mean, or even the 99th percentile, is not a WCET measurement — it describes typical behaviour, and a hard deadline does not care about typical behaviour. A rare branch, a cold cache line, a page untouched since boot: each is invisible to a short campaign and each can turn a comfortable mean into a missed deadline on flight day one thousand.
:::

## Jitter

**Jitter** is variation in the actual period or start time of a task meant to be periodic. A 100 Hz loop meant to wake every $10\,\mathrm{ms}$ but sometimes waking at $9.6\,\mathrm{ms}$ and sometimes $10.3\,\mathrm{ms}$ has jitter, even if every cycle finishes well inside its deadline. It comes from every layer that is not itself perfectly deterministic: interrupt latency depending on what the processor was doing, a higher-priority task occasionally running long, contention from other cores, and a general-purpose scheduler's own tick.

The digital control module works the frequency-domain consequence through in full; the one line that belongs here is why a real-time engineer bounds jitter at all — a varying sample time behaves like a varying, uncorrectable time delay, and a loop's phase margin was computed assuming a fixed one. The job here is to measure jitter honestly and drive it down at the source — a hardware timer, a deterministic scheduling policy, an isolated core — rather than to compensate for it in the controller after the fact, which does not work in general.

::: example Measuring jitter from wake-up timestamps
A task intended to run at $100\,\mathrm{Hz}$ logs its own wake-up time every cycle. Five consecutive timestamps, in milliseconds: $0.0,\ 10.2,\ 19.8,\ 30.1,\ 39.9$. The four measured periods are the successive differences: $10.2,\ 9.6,\ 10.3,\ 9.8\,\mathrm{ms}$, deviating from the $10\,\mathrm{ms}$ nominal by $+0.2,\ -0.4,\ +0.3,\ -0.2\,\mathrm{ms}$.

Two numbers matter here, and they answer different questions. The largest single deviation from nominal is $0.4\,\mathrm{ms}$ — how far any one cycle strayed. The peak-to-peak spread of the measured periods is $10.3-9.6=0.7\,\mathrm{ms}$ — how much the period itself swings, the figure a frequency-domain tolerance calculation needs, because it is the swing a fixed-delay model cannot capture. Five samples cannot bound a real system's jitter, but the arithmetic is the same at any campaign size: log every wake-up, difference them, and report the spread rather than an average that would wash the swings out.
:::

::: key
**Jitter** is variation in a periodic task's actual period or start time. It is a separate measurement from WCET: a task can have a tiny, tightly bounded execution time and still carry large jitter, if what varies is *when* it starts rather than how long it runs once started.
:::

## Check yourself

::: check
A ground-support tool reformatting telemetry for a dashboard sometimes takes 40 ms instead of its usual 5 ms when the network is congested, and nobody on the vehicle side cares when it does. Classify it, and say what would have to change about the *consequence* of lateness — not the deadline — to move it into a different class.
:::

::: answer
Soft real-time: a late update degrades dashboard freshness, which is unwelcome but not a failure, and the system recovers smoothly once a timely update arrives. It becomes firm real-time if a late result stops being useful at all rather than merely stale — say, if the dashboard discarded any update that missed its slot, so the work behind it was wasted rather than shown late. It becomes hard real-time only if something downstream treats a missing update as a failure condition, such as an automatic safing action triggered by its absence. None of this depends on tightening the 5 ms figure — classification is about what a miss costs.
:::

::: check
A colleague argues that because Version B above is nearly five times faster on average, it should be preferred and the rare 11.8 ms outlier treated as a future optimisation target. What is wrong with deferring it?
:::

::: answer
Schedulability must hold on every cycle, not on average, so a task that occasionally exceeds its deadline is not a slower working controller — it is not a working controller, on however small a fraction of cycles the overrun occurs. Deferring the outlier ships a loop that can miss its deadline in the meantime, and "in the meantime" on a flight vehicle can be the only flight it gets. Version B is not a candidate until its worst case, not its mean, is shown to fit the deadline; only then is its speed advantage real margin rather than an average concealing a failure.
:::

::: check
Why does static analysis of a task's WCET typically produce a larger number than a measurement campaign on the same code, and why is a static bound *above* the measured maximum the safer direction for the two to disagree?
:::

::: answer
Static analysis bounds every path, including combinations of branches, cache state and loop counts a finite campaign may never exercise together, so it tends to include pessimistic combinations real executions rarely produce all at once. A campaign only reports what it observed. A static bound above the measured maximum means the analysis is accounting for a legitimately possible case the campaign has not yet triggered — safe, if conservative. A measured maximum *above* the static bound would mean the processor model or the code's control-flow graph is wrong, a more serious problem to resolve before flight.
:::

::: check
A task's execution time varies between 3.0 and 3.4 ms depending on input, with the bound proven. A reviewer asks why it was not rewritten to take a constant 3.4 ms on every input, so timing is "truly" predictable. What is the right answer?
:::

::: answer
Determinism requires a provable bound, not a constant value, and 3.0–3.4 ms with a proven upper bound already gives the response-time analysis of the next lessons everything it needs — it uses the worst case, $3.4\,\mathrm{ms}$, exactly as it would if every run took that long. Padding every fast path up to the slow path's duration buys nothing for the proof and spends real CPU budget doing artificial work on cycles that reached the fast path honestly. Constant-time execution is occasionally worth engineering for an unrelated reason — defeating a timing side-channel — but predictability for a schedulability proof was already satisfied by the proven bound.
:::

::: check
Two $20\,\mathrm{ms}$-period tasks are compared. Task A's wake-ups drift smoothly later over a long run — each period close to nominal, only the accumulated phase wandering. Task B's wake-ups sit within $\pm0.05\,\mathrm{ms}$ of nominal almost always, but unpredictably one cycle is missing entirely, doubling that one period. Which is the more serious jitter problem, and why can a single "maximum deviation" number fail to distinguish them?
:::

::: answer
Task B is the more serious problem even though its typical deviation is far smaller. A's drift is slow and smooth, which a control loop tolerates reasonably well because it resembles a fixed delay changing very slowly. B's dropped cycle is a large, sudden discontinuity — exactly the kind of abrupt, uncorrelated timing error that erodes margin the most, and it cannot be treated as a slowly varying delay at all. A single "maximum deviation" figure can come out identical for both, since a smooth drift and a rare doubling can share the same worst single-cycle value, while describing entirely different hazards — a proper characterisation reports the shape of the distribution, not only its extreme.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Real-time system | Correctness depends on *when* the answer appears, not only on what it is |
| Hard real-time | A missed deadline is a system failure — no partial credit |
| Soft real-time | A missed deadline degrades the result smoothly; not a failure |
| Firm real-time | A late result is worthless but the system itself does not fail |
| Fast vs real-time | Fast = typical latency; real-time = a proven bound on worst-case latency that fits the deadline |
| Determinism | The *timing bound* is known and provable, not that every run takes the same time |
| WCET | Worst-case execution time; the only statistic a schedulability proof may use |
| WCET is established by | Measurement over adversarial cases, reconciled with static analysis of loop bounds and paths |
| Jitter | Variation in a periodic task's actual period or start time |

The next lesson gives you the first tool for turning "the deadline is met" from a hope into a proof: rate-monotonic priority assignment and a utilisation test that tells you, in one line of arithmetic, when a task set is safe beyond doubt — and sets up exactly where that test stops being enough.
