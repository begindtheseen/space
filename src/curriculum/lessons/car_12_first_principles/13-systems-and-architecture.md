---
id: l13-systems-and-architecture
title: "The systems and architecture round"
minutes: 24
covers:
  - systems and architecture rounds: real-time considerations, embedded constraints, redundancy, fault management, sensor fusion architecture
---

Planning a long car trip, someone asks: "Why bring a spare tire but not a spare engine?" A good answer is not "spares are nice". It is "flats are common and a spare fixes one in ten minutes; engines rarely fail, and a spare would fill the trunk." Each choice comes with the failure it covers and the cost of what you left out.

The **systems and architecture round** asks that kind of question about a vehicle's computers and sensors. Its grading rule: the question is usually **not what is optimal but what you would actually fly, and why.**

There is no single right answer. Interviewers probe three things: do your choices come with reasons, are those reasons failures rather than taste, and do you know the cost of the backup you chose *not* to add? A beautiful design with no failure analysis misses the point.

The subject is narrow enough to prepare completely. This lesson ends with the design the module's exercise asks for: a vehicle with **[[three IMUs, two GNSS receivers and a star tracker|nav-sensors]]** — inertial units, satellite-navigation receivers, and a camera that navigates by the stars.

::: key
What the systems round probes: real-time behavior, embedded constraints, redundancy and voting, fault detection and isolation, sensor fusion architecture, and timing budgets. The question is usually not what is optimal but what you would actually fly and why.
:::

## Real-time behavior

A school bell rings at 8:00 whether or not you are ready. In a **[[real-time|real-time-meaning]]** system, a late answer is a wrong answer.

**Hard against soft deadlines.** A **deadline** is when a task must be done. Missing a **hard** deadline is a failure: no command came out, and the actuator (the motor or valve that moves something) held its last value. Missing a **soft** one only makes things a bit worse. Flight control is hard; formatting telemetry is soft. Say which you are building.

**Worst-case execution time, not average.** **Worst-case execution time** (WCET, said "W-C-E-T") is the longest a task can ever take, over every input and cache state. A good average with a bad slow tail loses to a slower algorithm with a tight bound. So flight code avoids **recursion** (a function calling itself), loops with no fixed limit, and loops whose length depends on the data.

**Jitter.** **[[Jitter|jitter]]** is wobble in *when* a task actually runs. A controller designed for samples exactly 5 ms apart, run with 10 percent jitter, is controlling a system it was not designed for. The damage shows up as reduced **phase margin** — the controller's safety buffer against oscillating. It usually hurts more than a small constant delay, which can be modeled and compensated.

**Scheduling and priority inversion.** A **scheduler** decides which task runs when. The common choice is **fixed-priority preemptive** scheduling — each task has a fixed rank, and a higher one can interrupt ("preempt") a lower one — with **rate-monotonic** priorities: fastest task, highest rank. Its timing can be analyzed on paper; its classic failure is **[[priority inversion|pathfinder]]**, worked through in the questions below; **priority inheritance** is the standard fix. Naming both is the kind of specific knowledge this round rewards.

## Embedded constraints

Flight computers are small, slow by phone standards, and hardened against radiation.

- **No dynamic allocation after initialization.** New memory requests while running have unbounded worst-case time and can fail — both unacceptable under a hard deadline.
- **A [[watchdog|watchdog]] the loop must service.** A hardware timer the software must reset regularly; if a task hangs, the watchdog resets the computer, so a hang becomes a restart, not a silent stall.
- **Small, fixed memory.** Buffers are sized when the code is built.
- **[[Single-event upsets|seu]].** Radiation can flip a single bit in memory. Defenses: error-correcting memory, periodic **scrubbing** (reading memory back and fixing flipped bits), and storing critical values twice or more and comparing.
- **Fixed point against floating point.** **Floating point** stores decimals with a movable point; **fixed point** stores them as whole numbers with a fixed, agreed scale. With floating-point hardware the question is moot. Without it, fixed point is faster and exactly reproducible, at the cost of range and designer time.

::: warning Do not answer a systems question with a list of technologies
The failure here is naming parts — "I would use a Kalman filter, a watchdog, triple redundancy and a CAN bus" — without saying what each is for. Every element should arrive attached to the failure it covers or the requirement it meets; if you cannot say, leave it out. Three justified pieces beat ten decorative ones.
:::

## Redundancy and voting

Airliners carry two pilots in case one falls ill. **Redundancy** means carrying more units than you need, so one failure does not end the mission. The words are precise:

- **Fail-safe**: after a failure, the system goes into a defined safe state.
- **Fail-operational**: after a failure, the system keeps meeting its requirements.
- **Dual redundancy** (two units) lets you **detect** a disagreement but not **isolate** which unit is wrong. Like two clocks that disagree: one is wrong, but which?
- **Triple redundancy** lets you detect *and* isolate, because the odd one out is identifiable. So three is the smallest really useful number for a critical measurement.

With three like sensors, **[[mid-value select|mid-value]]** — taking the median, the middle reading — usually beats averaging. If one unit fails "hard-over", jumping to a wildly wrong value, it drags an average by a third of its error. The median cannot leave the range spanned by the two healthy units. It is also cheaper and has nothing to tune.

**[[Dissimilar redundancy|shuttle-backup]]** means units that differ in design, maker or algorithm. Identical units cover random hardware failures, not a **common-mode fault** — one cause that hits every copy at once, like a design error or a shared weakness to some input. Name the difference in any answer.

::: example What triple redundancy actually buys
**Assumptions.** Three like units, each with an independent probability $q = 0.02$ of failing during the mission. The system works if at least two are healthy, so the odd one out can be outvoted.

**Reliability of the set.** The system survives if all three work, or exactly two work:

$$
R = (1-q)^3 + 3(1-q)^2 q.
$$

With $0.98^2 = 0.9604$ and $0.98^3 = 0.941192$:

$$
R = 0.941192 + 3 \times 0.9604 \times 0.02 = 0.941192 + 0.057624 = 0.998816.
$$

**Failure probability.** $1 - 0.998816 = 0.001184$, against $0.02$ for a single unit — an improvement of $0.02/0.001184 = 16.9$ times.

**Sanity check.** Two independent failures are needed, and there are 3 pairs of units, so failure should be near $3q^2 = 3 \times 0.0004 = 0.0012$. It is.

**Read it carefully.** Triplication buys not three times the reliability but about seventeen times here, because failure now needs two independent failures. The gain is roughly $q/(3q^2) = 1/(3q)$, so it is *largest for reliable units* — slightly surprising, and worth stating.

**The assumption doing the work.** Independence. If a [[common-mode fault|ariane-501]] can take out all three — the same software defect, the same connector type, the same vibration — the calculation is meaningless; true reliability is near that of one unit. It is the most important caveat in redundancy analysis; stating it unprompted marks someone who has done real failure analysis.
:::

::: note Why the formula has a 3 in it
"Exactly one fails" happens three ways — A, B or C is the one — each with probability $q(1-q)^2$, giving $3(1-q)^2 q$. "None fails" has one way, $(1-q)^3$. Either keeps the system working, so add them.
:::

## Fault detection and isolation

Backups need a rule for deciding who is wrong. Detection works on **residuals**: the difference between what a sensor reports and what another source predicts. A big residual signals a fault.

How big is "big"? Setting the **threshold** is a trade, like a smoke alarm's sensitivity. Too tight, and healthy sensors trip it constantly, so everyone learns to ignore the alarm. Too loose, and a real fault spoils the navigation before anyone notices. The two error rates move in opposite directions; the design must say which it will pay.

The standard answer: a threshold loose enough to keep false alarms rare, plus a **persistence counter** — the threshold must be exceeded several samples *in a row*. Noise is roughly independent from sample to sample; a real fault is not. So persistence suppresses false alarms far faster than it delays detection.

::: example Sizing a gyro comparison threshold
**The setup.** Three **rate gyros** (sensors of turning speed) are sampled at 200 Hz. Each has noise with a **standard deviation** — the typical size of the random wobble, written $\sigma$ and read "sigma" — of $\sigma = 0.02^\circ/\mathrm{s}$ on one axis. The residual is the difference between two units.

**The residual's noise.** [[Two independent noises subtract|noise-sums]], and the difference has $\sigma_d = \sigma\sqrt2$: $0.02 \times 1.4142 = 0.0283$ degrees per second.

**A three-sigma threshold.** $3 \times 0.0283 = 0.0849$ degrees per second. Pure noise passes it, either side, with probability $0.0027$ per sample.

**False alarms with no persistence.** $200 \times 0.0027 = 0.54$ per second — one every $1/0.54 = 1.85$ seconds. Unusable: it would report a gyro fault before liftoff.

**Persistence of three samples in a row.** $0.0027^3 = 1.97\times 10^{-8}$, so the rate is $200 \times 1.97\times 10^{-8} = 3.94\times 10^{-6}$ per second. The mean time between false alarms is $1/(3.94\times 10^{-6}) = 2.54\times 10^5\,\mathrm{s}$, which is $2.54\times 10^5/86400 = 2.94$ days. Not enough for a long mission.

**Four in a row.** $0.0027^4 = 5.3\times 10^{-11}$, giving $200 \times 5.3\times 10^{-11} = 1.06\times 10^{-8}$ per second, and a mean time between false alarms of $1/(1.06\times 10^{-8}) = 9.4\times 10^7\,\mathrm{s}$ — that is $9.4\times 10^7/(86400 \times 365.25) = 3.0$ years.

**What it costs in delay.** Four samples at 200 Hz take $4/200 = 0.02$ s, or 20 ms — tiny next to how fast the vehicle responds to a real fault like a hard-over, a stuck output or a bias jump. That lopsided trade is why persistence works.

**The assumption to state.** Sample-to-sample independence. Gyro noise has a **white** part, fresh each sample, and a slowly wandering **bias** that is not. A bias drift above the threshold *stays* above it, so persistence does not suppress it — right for a real bias fault, but the numbers above apply only to the white part. Saying so shows understanding, not recital.
:::

## Sensor fusion architecture

**Sensor fusion** combines sensors into one best estimate of where the vehicle is and how it points. Three arrangements are standard.

**Vote first, then filter.** Mid-value select reduces like sensors to one value, so the **estimator** — the software that blends measurements into a best guess — sees one clean input. Simple, cheap, keeps fault logic out of the estimator; works only among sensors of one type.

**Centralized filter.** One estimator, usually a **[[Kalman filter|kalman]]**, takes every measurement. The best statistical use of the data, and the natural place to fuse *different* sensor types. Weakness: one bad measurement corrupts the whole estimate unless every measurement is checked on the way in.

**Federated filters.** A local filter per sensor, then a master filter combining them. Isolation is excellent — a runaway local filter can be dropped — at the cost of more computing and of accounting for correlation from shared information.

The practical answer is usually a mix: vote among like sensors, fuse the survivors in one filter, and **gate every measurement entering that filter**. The gate takes the **innovation** — the gap between a new measurement and what the filter expected — scales it by the filter's predicted uncertainty (its **covariance**), and compares it with a **chi-squared** threshold (said "kai-squared", the standard yardstick for such scaled gaps). Measurements outside the gate are rejected and counted; a sensor whose rejections keep coming is declared failed. Without the gate, a slowly failing inertial unit is absorbed without complaint — the exact failure this round tests for.

::: example Three inertial units, two satellite receivers, one star tracker
The exercise's design, with the failure each element covers and the cost of what was left out.

**Inertial units — three.** Mid-value select at 200 Hz on turn rate and acceleration, per axis. Three is the minimum that isolates.

- *Single failure:* its residual against the other two exceeds the threshold four samples in a row; it leaves the vote, and navigation continues on two with no loss. **Fail-operational.**
- *Double failure:* the two survivors disagree, and inertial evidence cannot pick one. The tie is broken from outside — against satellite velocity or the star tracker's attitude rate. If neither validates, the inertial solution is declared untrusted and the system enters safe mode. **Fail-safe, not fail-operational.**

**Satellite navigation receivers — two.** Position and velocity once a second (1 Hz), gated into the filter.

- *Single failure:* caught against the other receiver and the position worked forward from inertial data, then excluded.
- *Double failure, or lost signal:* the filter **coasts** on inertial data until the error exceeds the requirement.
- A third receiver would isolate without inertial help; it was left out because the inertial units are trusted for a short coast — a dependency to write down.

**Star tracker — one.** Attitude (which way the vehicle points) at 1 to 10 Hz, gated.

- *Its failure:* covered by the inertial units, which carry attitude forward well between updates. The tracker's job is to bound inertial drift, so losing it degrades slowly, not suddenly.
- *The cost of no second tracker:* unbounded drift if it fails early in a long mission, and no protection against a *plausible-but-wrong* attitude, which one tracker cannot catch except through the inertial residual. Gating against the propagated attitude covers that — why the gate is not optional.

**Timing budget at a 1 kHz control rate** — a 1000 microsecond frame:

| Task | Budget |
| --- | --- |
| Inertial unit read and decode | 50 µs |
| Voting and fault detection | 10 µs |
| Navigation filter propagate and update | 300 µs |
| Guidance | 60 µs |
| Control law | 40 µs |
| Actuator output and housekeeping | 80 µs |
| **Total** | **540 µs** |

$50 + 10 + 300 + 60 + 40 + 80 = 540$, and $540/1000 = 0.54$: 54 percent used, 46 percent margin. The margin is not spare: it absorbs worst-case overruns, interrupts, and development growth, which historically eats it.

**What to say last.** *"Every element covers a named failure. Three inertial units isolate a single failure. The second receiver detects but does not isolate; inertial propagation arbitrates. The one star tracker bounds drift, so losing it is a slow degradation. I added no fourth inertial unit or third receiver, so a double inertial failure is fail-safe, not fail-operational."*
:::

## Check yourself

::: check
Why is three the smallest useful number of like sensors for a critical measurement?
:::

::: answer
Because two can **detect** a disagreement but cannot **isolate** which unit is wrong. When two differ by more than their combined noise, one is faulty but nothing says which, so the safe move is to distrust both.

With three, the faulty unit is the one disagreeing with the other two; it is removed and the measurement survives. That is "fail-operational for one failure", the standard for critical channels.

Expect the follow-up: a fourth unit buys fail-operational after *two* failures — a reliability calculation against a requirement, not taste.
:::

::: check
A design uses a three-sigma threshold on a sensor residual with no persistence counter, sampled at 500 Hz. Estimate the false-alarm rate and say what you would change.
:::

::: answer
Noise passes three sigma with probability 0.0027 per sample. At 500 Hz that is $500 \times 0.0027 = 1.35$ false alarms per second — one every $1/1.35 = 0.74$ seconds. Unusable.

Two fixes, best first. **Add a persistence counter**: requiring four exceedances in a row cuts the per-event probability to $0.0027^4 = 5.3\times 10^{-11}$ and the rate to $500 \times 5.3\times 10^{-11} = 2.66\times 10^{-8}$ per second — a mean time between false alarms of over a year — at the cost of an 8 ms detection delay (four samples at 500 Hz). **Or raise the threshold**, which costs sensitivity to small faults: a bias slightly under the threshold is never seen at all.

Persistence is the better lever: a small, bounded delay for a huge cut in false alarms, whereas raising the threshold permanently blinds the monitor to a class of real faults.
:::

::: check
Why can a Kalman filter with no measurement gating be dangerous in a fault-tolerant architecture?
:::

::: answer
Because the filter takes in a wrong measurement as faithfully as a right one. A slowly failing sensor — a drifting bias, not a hard-over — gives plausible readings. The filter absorbs them, the estimate follows the fault, and the innovations stay small because the filter now agrees with the bad sensor. By the time anything looks wrong, estimate and covariance are both wrong — and the covariance says all is well.

The fix is a gate on every measurement: form the innovation, scale it by its predicted covariance, and compare with a chi-squared threshold for the right number of degrees of freedom. Rejected measurements are counted; a sensor whose rejections persist is declared failed.

The general principle: **redundancy without a decision rule is not fault tolerance.** Averaging, or an unguarded filter, carries a failed sensor straight into the output.
:::

::: check
What is priority inversion, and why does it belong in an answer about real-time design?
:::

::: answer
A high-priority task needs a resource — a **mutex** (a lock only one task may hold at a time), or a shared buffer — currently held by a low-priority task. The high task waits. A medium-priority task, needing neither, preempts the low one. The low task cannot run, so cannot release the resource, so the high task stays blocked — in effect demoted below the medium one — for a time nothing in the original analysis bounds.

It belongs because it is the standard example of a real-time failure that no spare processor time fixes: the budget can show 46 percent margin and the deadline still be missed.

The fixes: **priority inheritance** — the holder temporarily takes the priority of the highest task waiting for it — or the **priority ceiling protocol**, where holding a resource raises the holder to a fixed ceiling priority. Naming one fix is enough; naming the failure matters most.
:::

::: check
An interviewer asks you to defend not adding a fourth inertial unit. Answer it.
:::

::: answer
*"Three gives fail-operational for one failure and fail-safe for two. A fourth gives fail-operational for two; does the requirement ask for that?*

*In numbers: with a per-unit mission failure probability of 2 percent, the chance of two or more failures among three units is about $0.001184$ — roughly one in 850. If the requirement allows that, a fourth unit buys very little. If it does not, the fourth is mandatory.*

*The cost of a fourth is not only mass and power. It is another item in the timing budget, more interfaces, more voting logic — and more common-mode exposure, since an identical fourth shares every design weakness of the first three. Buying reliability, I would first ask whether a dissimilar third unit beats an identical fourth, because independence is the assumption the calculation rests on and the one most likely to be false.*

*I would write down the dependency: after a double failure, satellite navigation and the star tracker arbitrate, so that path must be validated."*

What makes it work: a number, what the requirement would have to say, and a named cost beyond mass.
:::

## Summary

| Item | Statement |
| --- | --- |
| The criterion | Not what is optimal but what you would actually fly, and why |
| Real-time | Hard against soft deadlines; worst case, not average; jitter; rate-monotonic scheduling; priority inversion and inheritance |
| Embedded | No allocation after initialization; watchdog; fixed buffers; single-event upsets and scrubbing; fixed against floating point |
| Dual redundancy | Detects, does not isolate |
| Triple redundancy | Detects and isolates; mid-value select beats averaging |
| Triplication value | $q = 0.02$ per unit gives system failure $0.001184$, a factor of 16.9 better |
| The key caveat | Independence; common-mode faults invalidate the whole calculation |
| Threshold sizing | Three sigma on a residual of $\sigma\sqrt2$; persistence of four samples at 200 Hz gives a false alarm every 3.0 years for a 20 ms delay |
| Fusion architecture | Vote among like sensors, fuse survivors, gate every measurement with a normalized residual test |
| Timing budget | 540 µs of a 1000 µs frame at 1 kHz — 54 percent used, 46 percent margin |

That completes the module. It all comes down to one habit: say what you assume, work without drifting, check against something you know, and name the weakest step. Derivations, estimates, puzzles, code and architectures are all the same examination.

::: context nav-sensors Three ways to know where you are
An **IMU** (inertial measurement unit, said "I-M-U") measures turn rate with gyros and acceleration with accelerometers. It needs nothing outside the vehicle, but small errors pile up, so it drifts. A **GNSS** receiver (global navigation satellite system — GPS is one) gets position and velocity from satellite signals: it does not drift, but it updates slowly and can lose signal. A **star tracker** is a camera that photographs stars and matches them to a catalog, giving very precise pointing direction. Each covers the others' weakness, which is why vehicles carry all three.
:::

::: context real-time-meaning Real-time does not mean fast
"Real-time" sounds like "very fast", but it means *on time, every time*. A system that answers in 1 ms, always, is real-time. One that usually answers in 0.1 ms but sometimes takes 50 ms is not, even though it is faster on average. An airbag controller is the classic everyday example: firing a little late is the same as not firing. Flight control is the same kind of system.
:::

::: context jitter A clock that wobbles
Here are ticks at 200 Hz, one every 5 ms. On top, each tick is exactly on time. Below, each one is off by up to 10 percent — up to half a millisecond early or late:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="12" fill="#1f2a44">steady</text>
  <line x1="40" y1="45" x2="340" y2="45" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="40" y1="33" x2="40" y2="57"/><line x1="100" y1="33" x2="100" y2="57"/><line x1="160" y1="33" x2="160" y2="57"/>
    <line x1="220" y1="33" x2="220" y2="57"/><line x1="280" y1="33" x2="280" y2="57"/><line x1="340" y1="33" x2="340" y2="57"/>
  </g>
  <text x="70" y="24" font-size="11" fill="#1f2a44" text-anchor="middle">5 ms</text>
  <text x="10" y="80" font-size="12" fill="#1f2a44">jittered</text>
  <line x1="40" y1="101" x2="340" y2="101" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3">
    <line x1="100" y1="89" x2="100" y2="113"/><line x1="160" y1="89" x2="160" y2="113"/><line x1="220" y1="89" x2="220" y2="113"/><line x1="280" y1="89" x2="280" y2="113"/>
  </g>
  <g stroke="#b4232c" stroke-width="3">
    <line x1="40" y1="89" x2="40" y2="113"/><line x1="105" y1="89" x2="105" y2="113"/><line x1="156" y1="89" x2="156" y2="113"/>
    <line x1="226" y1="89" x2="226" y2="113"/><line x1="277" y1="89" x2="277" y2="113"/><line x1="340" y1="89" x2="340" y2="113"/>
  </g>
  <text x="190" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">dashed: where each tick should be</text>
</svg>
```

A controller's math assumes the top row. Fed the bottom row, every step uses the wrong time gap, and small errors of that kind eat into its safety margin.
:::

::: context pathfinder The bug that reset a Mars lander
Priority inversion is famous because it happened on Mars. In 1997, soon after NASA's Mars Pathfinder landed, its computer began resetting itself again and again. Engineers on Earth traced it to priority inversion: a high-priority task was stuck waiting for a shared resource held by a low-priority task, while medium-priority work kept the low one from finishing. A watchdog-style check noticed the missed deadline and reset the system. The fix was to switch on priority inheritance in the operating system — done by uploading a change to the lander on Mars.
:::

::: context watchdog A timer that bites
The name fits: a watchdog sits quietly as long as you keep checking in. The software "kicks" or "pets" the timer every cycle, which starts its countdown again. If the software freezes and stops kicking, the countdown reaches zero and the watchdog resets the computer. A frozen flight computer is the worst outcome — it sends nothing, or sends the same stale command forever — so a quick restart into a known state is far better.
:::

::: context seu When a cosmic ray flips a bit
Space is full of fast charged particles — from the Sun, and from cosmic rays arriving from far outside the solar system. When one passes through a memory chip, it can leave enough electric charge behind to flip a stored 0 into a 1. That is a **single-event upset**: nothing is broken, but one number is now wrong. Error-correcting memory stores a few extra check bits with each word, so a single flipped bit can be found and repaired. Scrubbing reads through memory regularly, fixing flips before a second one lands in the same word.
:::

::: context mid-value Median against average, with one broken sensor
Three sensors measure the same thing. One fails hard-over and reads 57 instead of about 10:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <rect x="10" y="12" width="84" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="52" y="31" text-anchor="middle">A: 10.1</text>
    <rect x="10" y="60" width="84" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="52" y="79" text-anchor="middle">B: 10.0</text>
    <rect x="10" y="108" width="84" height="28" fill="#fff" stroke="#b4232c" stroke-width="2"/>
    <text x="52" y="127" text-anchor="middle" fill="#b4232c">C: 57 (failed)</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="94" y1="26" x2="150" y2="74"/><line x1="94" y1="74" x2="150" y2="74"/><line x1="94" y1="122" x2="150" y2="74"/>
  </g>
  <rect x="150" y="56" width="92" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="196" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">middle</text>
  <text x="196" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">of three</text>
  <line x1="242" y1="74" x2="262" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="268" y="70" font-size="12" fill="#1d6fd1">median 10.1</text>
  <text x="268" y="86" font-size="11" fill="#1d6fd1">(healthy)</text>
  <text x="196" y="122" font-size="11" text-anchor="middle" fill="#b4232c">average would be 25.7</text>
</svg>
```

The average is $(10.1 + 10.0 + 57)/3 = 25.7$ — ruined by one bad unit. The median stays with the healthy pair.
:::

::: context shuttle-backup The Shuttle's fifth computer
The Space Shuttle is a well-known example. It flew with four main flight computers running identical software and voting on their outputs. That protected against a computer breaking, but not against a bug in the shared software, which all four would hit together. So a fifth computer ran the **Backup Flight System**, software written separately by a different team. If the main set failed as one, the crew could switch to the backup — a different design, unlikely to share the same flaw.
:::

::: context ariane-501 One bug, two "independent" units
In 1996 the first Ariane 5 rocket broke up about 40 seconds after launch. It had two inertial reference units for redundancy — but both ran the same software. A number converted into a too-small integer type overflowed, and the software shut down. The backup had already failed the same way a moment earlier, for the same reason. Two identical units gave no protection against a fault they shared. It is the textbook common-mode failure, and a reminder of the last lesson's overflow warning too.
:::

::: context noise-sums How noise adds up, and what three sigma means
Independent noises do not add like ordinary numbers, because they partly cancel. What adds is the **variance**, $\sigma^2$. The difference of two readings has variance $\sigma^2 + \sigma^2 = 2\sigma^2$, so its standard deviation is $\sigma\sqrt2$ — bigger than one sensor's noise, smaller than double it.

Random noise mostly stays near zero, with big values rare. For the bell-shaped **normal distribution**, 99.73 percent of samples land within three standard deviations of the middle; 0.27 percent land outside, split between the two tails.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon points="20.0,150.0 24.0,149.9 28.0,149.9 32.0,149.9 36.0,149.8 40.0,149.8 44.0,149.7 48.0,149.5 52.0,149.3 56.0,149.1 60.0,148.8 64.0,148.4 68.0,147.8 72.0,147.1 76.0,146.3 80.0,145.2 84.0,143.8 88.0,142.2 92.0,140.2 96.0,137.9 100.0,135.1 104.0,131.9 108.0,128.2 112.0,124.1 116.0,119.4 120.0,114.3 124.0,108.7 128.0,102.7 132.0,96.5 136.0,89.9 140.0,83.3 144.0,76.6 148.0,70.1 152.0,63.9 156.0,58.1 160.0,52.9 164.0,48.5 168.0,44.8 172.0,42.2 176.0,40.5 180.0,40.0 184.0,40.5 188.0,42.2 192.0,44.8 196.0,48.5 200.0,52.9 204.0,58.1 208.0,63.9 212.0,70.1 216.0,76.6 220.0,83.3 224.0,89.9 228.0,96.5 232.0,102.7 236.0,108.7 240.0,114.3 244.0,119.4 248.0,124.1 252.0,128.2 256.0,131.9 260.0,135.1 264.0,137.9 268.0,140.2 272.0,142.2 276.0,143.8 280.0,145.2 284.0,146.3 288.0,147.1 292.0,147.8 296.0,148.4 300.0,148.8 304.0,149.1 308.0,149.3 312.0,149.5 316.0,149.7 320.0,149.8 324.0,149.8 328.0,149.9 332.0,149.9 336.0,149.9 340.0,150.0" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3">
    <line x1="60" y1="60" x2="60" y2="150"/><line x1="300" y1="60" x2="300" y2="150"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="166">−3σ</text><text x="180" y="166">0</text><text x="300" y="166">+3σ</text>
    <text x="180" y="110">99.73% inside</text>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="40" y="54">0.135%</text><text x="320" y="54">0.135%</text>
  </g>
  <text x="180" y="184" font-size="11" fill="#6c7a93" text-anchor="middle">the tails are so thin they barely show</text>
</svg>
```

That 0.27 percent sounds tiny. But at 200 samples a second, "rare" happens about every two seconds — which is why the lesson needs persistence.
:::

::: context kalman The filter you will meet again
A **Kalman filter** keeps a best guess of the vehicle's state and a measure of how unsure it is. Each cycle it predicts forward using physics, then corrects the guess with new measurements, trusting each one in proportion to how reliable it is. Rudolf Kálmán published the idea in 1960, and it was soon used for Apollo navigation. Later modules in this course build it from the ground up; here you only need to know it blends measurements, and will blend a bad one too unless you gate it.
:::
