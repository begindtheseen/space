---
id: l13-systems-and-architecture
title: "The systems and architecture round"
minutes: 24
covers:
  - systems and architecture rounds: real-time considerations, embedded constraints, redundancy, fault management, sensor fusion architecture
---

The last round of this module is the systems and architecture round, and it is the one where the evaluation criterion is stated most plainly in the module's own material: the question is usually **not what is optimal but what you would actually fly, and why.**

That sentence should change how you answer. A systems question has no single right answer and the interviewer knows it. What they are probing is whether your design decisions come attached to reasons, whether those reasons are failure modes rather than preferences, and whether you know the cost of the redundancy you chose *not* to add. A candidate who describes a beautiful architecture with no failure analysis has answered a different question from the one asked.

The subject matter is narrow enough to prepare completely: real-time behaviour, embedded constraints, redundancy and voting, fault detection and isolation, sensor fusion architecture, and the timing budget that ties them together. This lesson takes them in that order and ends with the architecture the module's own exercise asks for.

::: key
What the systems round probes: real-time behaviour, embedded constraints, redundancy and voting, fault detection and isolation, sensor fusion architecture, and timing budgets. The question is usually not what is optimal but what you would actually fly and why.
:::

## Real-time behaviour

**Hard against soft deadlines.** A hard deadline missed is a failure: the control loop did not produce a command and the actuator held its last value. A soft deadline missed only degrades performance. Flight control is hard, telemetry formatting is soft, and saying which you are designing for determines everything downstream.

**Worst-case execution time, not average.** The number that matters is the longest the task can take, over all inputs and cache states; an algorithm with a good average and a bad tail is worse than a slower one with a tight bound. Hence the avoidance of recursion, unbounded loops and data-dependent iteration counts.

**Jitter.** Variation in when a task actually runs. A controller designed for a fixed sample interval but executed with 10 per cent jitter has an effective plant it was not designed against, and the effect shows up as reduced phase margin. Jitter is usually more damaging than a small constant latency, which can be modelled and compensated.

**Scheduling and priority inversion.** Fixed-priority pre-emptive scheduling with rate-monotonic priorities — fastest task highest — is the common choice because its behaviour is analysable. The classic failure is priority inversion, covered in the questions below; priority inheritance is the standard mitigation, and naming the failure and its fix is the kind of specific knowledge this round rewards.

## Embedded constraints

- **No dynamic allocation after initialisation.** Allocation has unbounded worst-case time and can fail; both are unacceptable in a loop with a hard deadline.
- **A watchdog that the loop must service**, so a hung task produces a reset rather than a silent stall.
- **Memory is finite and usually small.** Buffers are sized at compile time and their sizing is part of the design.
- **Single-event upsets.** Radiation flips bits; mitigations are error-correcting memory, periodic scrubbing, and storing critical state in more than one place with a comparison.
- **Fixed point against floating point.** Where the processor has hardware floating point the question is moot; where it does not, fixed point is faster and exactly reproducible, at the cost of range and of the designer's time.

::: warning Do not answer a systems question with a list of technologies
The failure mode here is naming components — "I would use a Kalman filter, a watchdog, triple redundancy and a CAN bus" — without saying what each one is for. Every element of an architecture should arrive attached to the failure it covers or the requirement it meets. If you cannot name what an element is for, leave it out; an architecture with three justified pieces beats one with ten decorative ones.
:::

## Redundancy and voting

The vocabulary first, because it is used precisely.

- **Fail-safe**: on a failure the system enters a defined safe state.
- **Fail-operational**: on a failure the system continues to meet its requirements.
- **Dual redundancy** lets you **detect** a disagreement but not **isolate** which unit is wrong. Two sensors that differ tell you one is faulty and nothing more.
- **Triple redundancy** lets you detect and isolate, because the odd one out is identifiable. This is why three is the smallest number that is genuinely useful for a critical measurement.

With three like sensors, **mid-value select** — take the median — is usually preferred to averaging: a hard-over failure on one unit shifts an average by a third of the error, and does not move the median at all until the failed unit crosses the other two. The median is also cheaper and has no tuning parameters.

**Dissimilar redundancy** means units that differ in design, manufacturer or algorithm. Identical triplication covers random hardware failures; it does not cover a common-mode fault such as a design error or a shared vulnerability to a particular input. Naming the distinction is worth a sentence.

::: example What triple redundancy actually buys
**Assumptions.** Three like units, each with an independent probability $q = 0.02$ of failing over the mission. The system works if at least two are healthy, so the odd one out can be identified and outvoted.

**Reliability of the set.** $R = (1-q)^3 + 3(1-q)^2 q$: with $0.98^2 = 0.9604$ and $0.98^3 = 0.941192$,

$$
3 \times 0.9604 \times 0.02 + 0.941192 = 0.998816.
$$

**Failure probability.** $1 - 0.998816 = 0.001184$, against 0.02 for a single unit — an improvement of $0.02/0.001184 = 16.9$ times.

**Read it carefully.** Triplication does not buy three times the reliability; it buys roughly a factor of seventeen here, because the remaining failure mode requires two independent failures and $3q^2$ is small. The improvement scales as $1/q$, so it is largest for reliable units, which is slightly counter-intuitive and worth stating.

**The assumption that does the work.** Independence. If a common-mode fault can take out all three — the same software defect, the same connector type, the same vibration environment — the calculation above is meaningless and the true reliability is close to that of one unit. This is the single most important caveat in redundancy analysis, and stating it unprompted is the mark of someone who has done a real failure analysis.
:::

## Fault detection and isolation

Redundancy without a decision rule does nothing. Detection works on **residuals**: the difference between what a sensor reports and what another source predicts.

Sizing the threshold is a trade. Too tight and healthy sensors trip it constantly, so the crew or the autonomy learns to ignore the alarm — an expensive failure mode. Too loose and a real fault goes undetected long enough to corrupt the navigation solution. The two error rates move in opposite directions, and the design must state which one it is prepared to pay.

The standard resolution is a threshold that is loose enough to keep false alarms rare, combined with a **persistence counter** requiring the threshold to be exceeded for several consecutive samples. Because noise is roughly independent from sample to sample and a real fault is not, persistence suppresses false alarms far faster than it delays detection.

::: example Sizing a gyro comparison threshold
**The setup.** Three rate gyros sampled at 200 Hz. Each has a noise standard deviation of $\sigma = 0.02^\circ/\mathrm{s}$ on a single axis. The residual is the difference between two units.

**The residual's noise.** Two independent noises subtract, so the difference has $\sigma_d = \sigma\sqrt2$: $0.02 \times 1.4142 = 0.0283\,$ degrees per second.

**A three-sigma threshold.** $3 \times 0.0283 = 0.0849$ degrees per second. The two-sided probability of exceeding three sigma is 0.0027 per sample.

**The false-alarm rate, with no persistence.** $200 \times 0.0027 = 0.54$ per second, or one every $1/0.54 = 1.85$ seconds. Unusable: the system would annunciate a gyro fault before the vehicle left the pad.

**Add a persistence counter of three consecutive samples.** $0.0027^3 = 1.97\times 10^{-8}$, so the rate is $200 \times 1.97\times 10^{-8} = 3.94\times 10^{-6}$ per second, and the mean time between false alarms is $1/3.94\times 10^{-6} = 2.54\times 10^5\,\mathrm{s}$, which is $2.54\times 10^5/86400 = 2.94$ days. Better, and still not enough for a long mission.

**Four consecutive samples.** $0.0027^4 = 5.3\times 10^{-11}$, giving $200 \times 5.3\times 10^{-11} = 1.06\times 10^{-8}$ per second and a mean time between false alarms of $1/1.06\times 10^{-8} = 9.4\times 10^7\,\mathrm{s}$ — $9.4\times 10^7/(86400 \times 365.25) = 3.0$ years.

**What it costs in detection delay.** Four samples at 200 Hz is 20 ms. For a fault that matters — a hard-over, a stuck output, a bias jump — 20 ms is negligible against the vehicle's response time. That asymmetry is the whole reason persistence works.

**The assumption to state.** Sample-to-sample independence. Gyro noise has a white component that is independent and a slowly varying bias that is not. A bias drift that exceeds the threshold stays above it, so persistence does not suppress it at all — which is correct behaviour for a real bias fault, but it means the calculation above applies only to the white part. Saying this is the difference between quoting a formula and understanding it.
:::

## Sensor fusion architecture

Three arrangements, with the trade between them.

**Vote first, then filter.** Like sensors are reduced to one value by mid-value select, and the filter sees a single clean input. Simple, cheap, and it keeps fault logic out of the estimator. It only works between sensors of the same type.

**Centralised filter.** One estimator takes every measurement. Statistically the best use of the data, and the natural place to fuse dissimilar sensors — inertial, satellite navigation, star tracker. Its weakness is that one bad measurement corrupts the whole state unless every measurement is gated.

**Federated filters.** A local filter per sensor, then a master filter combining their outputs. Isolation is excellent — a diverging local filter can be dropped — and degradation is graceful, at the cost of more computation and of accounting for the correlation that shared information introduces.

The practical answer for a launch or spacecraft vehicle is usually a combination: vote among like sensors, fuse the survivors in one filter, and **gate every measurement entering that filter** with a normalised residual test. The gate compares the innovation, scaled by its predicted covariance, against a chi-squared threshold; a measurement outside the gate is rejected and counted, and a sensor whose rejections persist is declared failed. Without that gate, a diverging inertial unit is incorporated smoothly and without complaint, which is the specific failure the round is testing you for.

::: example Three inertial units, two satellite receivers, one star tracker
The architecture the module's exercise asks for, with the failure each element covers and the cost of what was left out.

**Inertial units — three.** Mid-value select at 200 Hz on rate and acceleration, per axis. Three is the minimum that isolates: two would detect a disagreement without saying which unit to believe.

- *Single failure:* the residual of the failed unit against the other two exceeds the threshold for four consecutive samples; it is removed from the vote; navigation continues on the remaining two with no performance loss. **Fail-operational.**
- *Double failure:* the two survivors disagree and neither can be preferred on inertial evidence alone. The tie is broken externally — compare each against the satellite-derived velocity, or against the star tracker's attitude rate — and if neither can be validated, the system declares the inertial solution untrusted and enters its safe mode. **Fail-safe, not fail-operational.**

**Satellite navigation receivers — two.** Position and velocity at 1 Hz, gated into the filter.

- *Single failure:* detected by comparison with the other receiver and with the inertially propagated position; the faulty one is excluded.
- *Double failure, or loss of signal:* the filter coasts on inertial data, and the mission constraint is how long it can coast before the error exceeds requirement.
- A third receiver would isolate without relying on inertial propagation. It was not added because the inertial units are already trusted for a short coast — but that is a dependency, and it must be written down.

**Star tracker — one.** Attitude at 1 to 10 Hz, gated.

- *Its failure:* covered not by a second tracker but by the inertial units, which propagate attitude well over the tracker's update interval. The tracker's function is to bound inertial drift, so losing it degrades slowly rather than suddenly.
- *The cost of not adding a second:* an unbounded attitude drift if the tracker fails early in a long mission, and no protection against a *plausible-but-wrong* attitude — a tracker returning a confident wrong solution, which a single unit cannot detect except through the inertial residual. Gating against the propagated attitude is what covers that, which is why the gate is not optional.

**Timing budget at a 1 kHz control rate**, a 1000 microsecond frame:

| Task | Budget |
| --- | --- |
| Inertial unit read and decode | 50 µs |
| Voting and fault detection | 10 µs |
| Navigation filter propagate and update | 300 µs |
| Guidance | 60 µs |
| Control law | 40 µs |
| Actuator output and housekeeping | 80 µs |
| **Total** | **540 µs** |

$50 + 10 + 300 + 60 + 40 + 80 = 540$, so $540/1000 = 0.54$ — 54 per cent utilisation and 46 per cent margin. The margin is not slack: it absorbs worst-case execution time above the nominal figures, interrupt load, and growth during development, which is historically the thing that consumes it.

**What to say last.** *"Every element covers a named failure. The three inertial units buy isolation of a single failure; the second receiver buys detection but not isolation, and I am relying on inertial propagation to arbitrate; the single star tracker buys drift bounding and nothing else, so its loss is a slow degradation rather than a failure. I did not add a fourth inertial unit or a third receiver, and the cost is that a double inertial failure is fail-safe rather than fail-operational."*
:::

## Check yourself

::: check
Why is three the smallest useful number of like sensors for a critical measurement?
:::

::: answer
Because two can **detect** a disagreement but cannot **isolate** which unit is wrong. When two sensors differ by more than their combined noise, you know one is faulty and you have no evidence that identifies which, so the only safe response is to distrust both.

With three, the faulty unit is the one that disagrees with the other two, so it can be identified and removed, and the measurement survives. That is what "fail-operational for one failure" means and it is why three is the standard for critical channels.

The follow-up to be ready for: a fourth unit buys fail-operational behaviour after *two* failures, and the question of whether to pay for it is a reliability calculation against a requirement, not a matter of taste.
:::

::: check
A design uses a three-sigma threshold on a sensor residual with no persistence counter, sampled at 500 Hz. Estimate the false-alarm rate and say what you would change.
:::

::: answer
The two-sided probability of exceeding three sigma is 0.0027 per sample. At 500 Hz that is $500 \times 0.0027 = 1.35$ false alarms per second — roughly one every 0.74 seconds. Unusable.

Two changes, in order of preference. **Add a persistence counter**: requiring four consecutive exceedances reduces the per-event probability to $0.0027^4 = 5.3\times 10^{-11}$ and the rate to $500 \times 5.3\times 10^{-11} = 2.65\times 10^{-8}$ per second, a mean time between false alarms of over a year, at the cost of an 8 ms detection delay. **Or raise the threshold**, which costs detection sensitivity for small faults — a bias just under the threshold is never seen at all.

Persistence is the better lever because it trades a small, bounded delay against an enormous reduction in false alarms, whereas raising the threshold permanently blinds the monitor to a class of real faults.
:::

::: check
Why can a Kalman filter with no measurement gating be dangerous in a fault-tolerant architecture?
:::

::: answer
Because the filter's job is to incorporate measurements, and it will incorporate a wrong one exactly as diligently as a right one. A sensor that fails slowly — a drifting bias rather than a hard-over — produces measurements that look plausible, so the filter absorbs them, the state follows the fault, and the innovations stay small because the filter has been pulled to agree with the faulty sensor. By the time anything is visibly wrong, the estimate and its covariance are both wrong, and the covariance says the estimate is good.

The mitigation is a gate on every measurement: form the innovation, normalise it by its predicted covariance, and compare against a chi-squared threshold for the appropriate number of degrees of freedom. Measurements outside the gate are rejected and counted; a sensor whose rejection count persists is declared failed and removed.

The general principle to state: **redundancy without a decision rule is not fault tolerance.** Averaging redundant sensors, or fusing them in an unguarded filter, propagates a failed sensor straight into the output.
:::

::: check
What is priority inversion, and why does it belong in an answer about real-time design?
:::

::: answer
A high-priority task needs a resource — a mutex, a shared buffer — that is currently held by a low-priority task. The high-priority task blocks. A medium-priority task, which needs nothing from either, pre-empts the low-priority one. The low-priority task cannot run, so it cannot release the resource, so the high-priority task stays blocked, effectively at the medium task's priority. Its deadline is missed by an amount that depends on the medium task and is not bounded by anything in the original analysis.

It belongs in the answer because it is the standard example of a real-time system failing for a reason that no amount of processor headroom fixes. The timing budget can show 46 per cent margin and the deadline still be missed.

The mitigations are priority inheritance, where the resource holder temporarily inherits the priority of the highest-priority waiter, and the priority ceiling protocol, where holding a resource raises the holder to a fixed ceiling priority. Naming one is sufficient; naming the failure is what matters.
:::

::: check
An interviewer asks you to defend not adding a fourth inertial unit. Answer it.
:::

::: answer
*"Three gives fail-operational behaviour for one failure and fail-safe for two. A fourth would give fail-operational for two, and the question is whether the requirement asks for that.*

*Quantitatively: with a per-unit mission failure probability of two per cent, the probability of two or more failures among three units is about $0.001184$, roughly one in eight hundred. If the requirement permits that, the fourth unit buys very little; if it does not, it is mandatory.*

*The cost of the fourth is not only mass and power. It is a fourth item in the timing budget, a fourth set of interfaces, more voting logic, and — importantly — more opportunities for a common-mode fault, because a fourth identical unit shares every design weakness the first three have. If I were buying more reliability I would first ask whether a dissimilar third unit beats an identical fourth, because independence is the assumption the whole calculation rests on and it is the one most likely to be false.*

*What I would write down is the dependency: with three units, a double failure leaves the vehicle relying on satellite navigation and the star tracker to arbitrate, and that path must be validated."*

Three elements make this answer work: a number, an explicit statement of what the requirement would have to say, and a named cost beyond mass.
:::

## Summary

| Item | Statement |
| --- | --- |
| The criterion | Not what is optimal but what you would actually fly, and why |
| Real-time | Hard against soft deadlines; worst-case execution time, not average; jitter; rate-monotonic scheduling; priority inversion and inheritance |
| Embedded | No allocation after initialisation; watchdog; fixed buffers; single-event upsets and scrubbing; fixed against floating point |
| Dual redundancy | Detects, does not isolate |
| Triple redundancy | Detects and isolates; mid-value select beats averaging |
| Triplication value | $q = 0.02$ per unit gives system failure $0.001184$, a factor of 16.9 better |
| The key caveat | Independence; common-mode faults invalidate the whole calculation |
| Threshold sizing | Three sigma on a residual of $\sigma\sqrt2$; persistence of four samples at 200 Hz gives a false alarm every 3.0 years for a 20 ms delay |
| Fusion architecture | Vote among like sensors, fuse survivors, gate every measurement with a normalised residual test |
| Timing budget | 540 µs of a 1000 µs frame at 1 kHz — 54 per cent utilisation, 46 per cent margin |

That completes the module. The whole of it reduces to one habit applied in four settings: say what you are assuming, work without drift, check the answer against something you know, and name the weakest step. The derivations, the estimates, the puzzles, the code and the architectures are all the same examination.
