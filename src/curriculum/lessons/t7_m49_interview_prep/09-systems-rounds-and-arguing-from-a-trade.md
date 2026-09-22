---
id: l09-systems-rounds-and-arguing-from-a-trade
title: Systems and architecture rounds, and arguing from a trade
minutes: 19
covers:
  - "Systems and architecture rounds: design a GNC flight software stack, a Monte Carlo pipeline, an FDIR scheme, a sensor suite for a given mission"
  - Explaining a design decision in terms of a trade rather than a preference
---

A systems round almost never has a single correct architecture waiting to be found. It is graded on structure: whether you clarified the requirement before designing against it, whether you stated your assumptions, whether you decomposed the problem sensibly, whether you went deep enough somewhere to show real judgment rather than skimming everything at the same shallow depth, and — running through every part of it — whether every design choice was defended as a trade rather than asserted as a preference. This lesson gives you that skeleton once, in full, and then applies it to the four systems prompts this module is built around: a GNC flight software stack, a Monte Carlo verification pipeline, an FDIR scheme, and a sensor suite for a propulsive landing.

## Trade, not preference

A **preference** is a bare assertion: "I'd use a convex solver" with nothing behind it. A **trade** names three things: the alternative you are choosing against, the axis you are judging it on, and what you are giving up by not choosing the alternative. "A convex formulation over a general nonlinear one, because I need a bounded solve time and a global-optimum guarantee more than I need the slightly better cost a nonconvex formulation might reach — the cost I'm accepting is that not every physically reasonable objective is expressible convexly, so I lose some modelling freedom" is a trade. It is checkable, interruptible, and defensible in a way a bare preference is not, because an interviewer can push on any one of the three named parts — challenge the axis, propose a different alternative, question whether the cost you named is really the cost — and you have something concrete to respond to.

Every "why not X" question in a systems round, and most of the follow-ups inside one, is testing exactly this. The habit to build is narrating every real design choice in that three-part shape as you make it, not only when asked to defend it afterward.

::: key
A trade names the alternative, the axis being optimized, and what is given up. A preference names none of the three. Interviewers push on trades to find the boundary of your reasoning; a bare preference gives them nothing to push on except "why," which is exactly the question you did not want to be asked twice.
:::

## The systems-round skeleton

**Restate the requirement, and ask the one clarifying question that most changes the answer.** Not a checklist of questions — one, chosen because the answer to it would send the design down a genuinely different path. "Is this vehicle crewed or uncrewed?" changes a flight-software redundancy architecture more than almost anything else you could ask; asking five lower-leverage questions in a row reads as stalling, while asking the one that matters reads as already understanding the shape of the problem.

**State your assumptions.** Whatever the clarifying question does not resolve, assume explicitly and say so, the same discipline as every derivation earlier in this module.

**Give the decomposition.** A short, named list of the major pieces and how they relate — this is the outline the rest of the answer hangs on, and it is worth sketching as an actual diagram if a whiteboard is available.

**Go deep on one part.** Depth on one piece is worth more than equal shallow coverage of all of them, because equal shallow coverage cannot distinguish a candidate who understands the domain from one who has memorized a list of buzzwords for each box in the diagram. Pick the piece most central to the question, or the piece you can defend the most rigorously, and spend real time there.

**Close with failure modes, the trade you made, and what you would measure to know you were right.** Every real design has a way it breaks; naming it unprompted is the same instinct as volunteering a failure talk. The trade closes the loop on the whole answer. The measurement makes the design falsifiable rather than merely asserted.

## Worked in full: a GNC flight software stack for a reusable booster

::: example Flight software stack, skeleton applied
**Clarifying question.** "Is this a reusable first stage flying an established profile, or a new vehicle without flight history — and is any part of the mission crewed?" (Answer assumed: uncrewed, established booster profile, informing how aggressive the FDIR philosophy can be.)

**Assumptions.** Single flight computer with a cold or hot backup, standard practice for an uncrewed booster rather than the triple-redundant voting architecture a crewed vehicle would require.

**Decomposition, by rate.** A sensor and actuator driver layer running fastest (IMU sampling and control-surface or TVC commands, on the order of a kilohertz, driven by the fastest real dynamics — structural modes and actuator bandwidth — that must be sampled without aliasing). A navigation and estimation layer at a moderate rate (order 100 Hz), fusing IMU with GPS and any other aiding sensor. A guidance layer at a lower rate still (order 10–20 Hz), since guidance updates a trajectory that changes on a slower timescale than attitude control does. A mode manager and FDIR supervisor, event-driven rather than purely periodic, watching health across every other layer. A telemetry and ground-interface layer, decoupled from the control loops so a slow downlink can never stall a real-time task.

**Depth: the mode manager and FDIR supervisor.** Each monitored quantity — sensor cross-checks, actuator position-versus-command residuals, navigation solution health — gets a threshold and a persistence count, so a single noisy sample cannot trip a fault response that a real, sustained fault should. Isolation depends on redundancy: with dual redundancy you can *detect* a mismatch but not always tell which side is faulty without a third vote or an independent check; triple redundancy adds majority voting and genuine isolation. Recovery is a ranked ladder, not a single action — switch to a healthy redundant sensor first, degrade to a coarser control mode if no healthy redundant source exists, and only abort the mission phase entirely if no safe degraded mode is available.

**Failure modes, trade, measurement.** Failure mode: a rate-grouped, strictly periodic architecture is simple to reason about and test but can waste cycles on components that do not need to run every period, and can be slow to react to an event that falls between periodic ticks. The trade: periodic simplicity and predictable timing, against event-driven responsiveness and the added complexity of proving an event-driven system meets its deadlines. What you would measure: worst-case observed jitter and latency for the fault-detection-to-recovery-action path under hardware-in-the-loop testing, checked against the mission's required response time for the fastest credible fault.
:::

## Applied more briefly: the other three prompts

::: example Monte Carlo pipeline, skeleton applied
**Decomposition.** A dispersion definition (which parameters vary, over what distributions, and why those and not others); case generation and seeding (a single master seed, with each case's sub-seed derived deterministically from it, so any one case can be replayed bit-for-bit without rerunning the whole campaign); execution and scale-out (parallel across cases, since they are independent by construction); scoring against criteria fixed *before* the campaign runs, never adjusted after seeing the results; storage of both summary statistics and enough raw data to replay any individual case; reporting that leads with the tail of the distribution, not only the mean; and a hook into continuous integration so a design change cannot silently regress the dispersion result.

**Depth: seeding and replay.** This is the detail worth going deep on, because reproducibility is what makes a failing case debuggable at all — without it, a rare failure found on run 8,347 of 10,000 can only be chased by rerunning the whole campaign and hoping it recurs.

**Failure modes, trade, measurement.** Full fidelity on every case is expensive and limits how many cases you can afford to run; a cheaper, lower-fidelity first pass that flags candidates for a full-fidelity rerun trades some risk of missing a rare, narrow failure mode for the ability to run far more cases overall. What you would measure: whether the tail statistic you actually care about — a 99.87th-percentile miss distance, for instance — has converged as case count grows, rather than assuming a round number of cases was automatically enough.
:::

**An FDIR scheme for a sensor suite.** What is monitored is usually a mix of absolute checks (is this value physically plausible at all), relative checks (does this sensor agree with a redundant or dissimilar one), and rate checks (is this value changing faster than the physics allows). Each check pairs a threshold with a persistence requirement, for the same reason given above: a single bad sample should not trigger a fault response that a real fault would need to sustain to be real. Isolation is bounded by redundancy — two like sensors let you detect disagreement but not always say which one is wrong; a third, or a dissimilar sensor measuring a related but different quantity, is usually what buys genuine isolation. Recovery ranges from switching to a healthy redundant source, to falling back on a lower-accuracy but still-available sensor, to commanding a safe, degraded mode when no adequate source remains.

**A sensor suite for a propulsive landing, defended on cost, mass, accuracy, and failure behaviour.** An IMU is close to non-negotiable — cheap, small, and the only sensor fast enough for the control loop's own rate, at the cost of unbounded drift if used alone. A radar altimeter or lidar adds a direct, drift-free range and range-rate measurement precisely where it matters most, near the ground, where inertial-only drift is largest relative to the remaining margin — the trade between the two is lidar's finer angular and range resolution against a radar altimeter's typically better robustness to dust, plume interaction, and obscured or non-cooperative surfaces during the exact phase where the environment is most hostile to optical sensors. Terrain-relative navigation from a camera bounds horizontal position error against a map rather than letting it drift with time, at the cost of needing a pre-loaded map and adequate lighting and surface texture. GNSS is cheap and gives an absolute position fix at higher altitude, but is not depended upon near touchdown, where multipath, vehicle attitude, and engine plume effects can degrade or drop the signal exactly when it would matter most — which is itself the trade worth stating plainly: GNSS is a good, cheap sensor for the phase where losing it briefly is recoverable, and a bad one to be solely dependent on for the phase where it is not.

::: warning
A systems answer that lists every plausible sensor or component with no trade attached to any of them is a shopping list, not a design. The differentiator is not the length of the list; it is whether each item on it is there because of a stated, defensible reason that also explains what was not chosen and why.
:::

## Check yourself

::: check
State the systems-round skeleton in order, and explain briefly what each step is checking for.
:::

::: answer
Restate the requirement and ask the one highest-leverage clarifying question (checks whether you can identify what actually changes the design, rather than only gathering information generically); state assumptions (checks that unresolved unknowns are handled explicitly rather than silently); give the decomposition (checks structural thinking); go deep on one part (checks real domain judgment rather than surface familiarity); close with failure modes, the trade made, and what you would measure (checks that the design is falsifiable and that you know its edges, the same instinct tested in the project-talk limitations section earlier in this module).
:::

::: check
Why does asking one well-chosen clarifying question read better than asking several, even though more questions gather more information?
:::

::: answer
A single, well-chosen question demonstrates that you already understand the shape of the problem well enough to know which unknown would actually redirect the design — crewed versus uncrewed, for instance, changes a redundancy architecture more than almost any other single fact. A list of several questions, even individually reasonable ones, reads as generic information-gathering rather than targeted judgment, and can come across as stalling before committing to an answer. If more information genuinely turns out to be needed once you start decomposing, asking a second question at that point is fine — the point is not "exactly one question ever," but leading with the one that matters most rather than a checklist.
:::

::: check
Turn "I'd use a radar altimeter for terminal descent" into a proper trade, naming the alternative, the axis, and what is given up.
:::

::: answer
"A radar altimeter over a lidar for the terminal descent range measurement, judged on robustness to the descent environment — dust, plume interaction, and non-cooperative or featureless terrain — where a radar altimeter is typically more robust than an optical sensor. What's given up is the finer range and angular resolution a lidar can provide, which would matter more if precision terrain-relative positioning were the primary goal of this particular sensor rather than a robust, low-resolution range-to-ground measurement." Naming the alternative (lidar), the axis (robustness to the specific environment), and the cost (resolution) turns a bare preference into a defensible, interruptible claim.
:::

::: check
In an FDIR scheme, why does a good fault check require a threshold *and* a persistence count, rather than a threshold alone?
:::

::: answer
A threshold alone flags any single sample that crosses it, including one caused by ordinary sensor noise rather than a real fault — and a fault response (switching sensors, degrading a mode, aborting a phase) is itself costly and sometimes irreversible, so triggering it on noise is a real cost, not a harmless false alarm. Requiring the threshold to be exceeded for several consecutive samples (a persistence count) filters out single-sample noise while still catching a real, sustained fault within a bounded, known delay — a deliberate trade between fault-detection latency and false-alarm rate, tuned to the specific consequences of each kind of error for that particular check.
:::

::: check
Why does per-case sub-seeding from a single master seed matter for a Monte Carlo verification pipeline, beyond only "having a random seed" for reproducibility?
:::

::: answer
A single global seed for the whole campaign makes the *campaign* reproducible only as a whole — rerunning it from scratch reproduces the same ten thousand cases, but there is no way to isolate and rerun the one case that failed without regenerating everything up to that point in the sequence, which is often prohibitively expensive. Deriving each case's own seed deterministically from a master seed and that case's index means any single case can be regenerated and replayed in isolation, bit-for-bit, which is what actually makes a failing case debuggable rather than merely reproducible in principle.
:::

::: check
Why is "go deep on one part" scored more favourably than covering all parts of a design at equal, shallow depth, even though the shallow version touches on more of the total problem?
:::

::: answer
Shallow, equal-depth coverage of every part cannot distinguish genuine domain understanding from a memorized list of the right words attached to each box in a diagram — anyone who has read a survey of the topic can produce that. Depth on one part forces you to reason through second- and third-order consequences (what happens when this specific check fails, what the actual numbers or thresholds would plausibly be, what the failure cascades into), which is much harder to fake and is a direct, checkable demonstration of understanding rather than familiarity. An interviewer choosing where to push back will almost always push on the deep part precisely because it is where real signal is available to find.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Trade vs preference | A trade names the alternative, the axis, and the cost given up; a preference names none of the three |
| Systems skeleton | Restate + one clarifying question; state assumptions; decompose; go deep on one part; close with failure modes, the trade, and what you'd measure |
| Flight software stack | Layered by rate (drivers, estimation, guidance, mode management, telemetry), redundancy scaled to crewed/uncrewed, FDIR with threshold-plus-persistence and a ranked recovery ladder |
| Monte Carlo pipeline | Dispersion definition, seeded and replayable case generation, scale-out execution, criteria fixed before scoring, tail-focused reporting, CI hook |
| FDIR scheme | Absolute, relative, and rate checks, each with threshold and persistence; isolation bounded by redundancy; recovery as a ranked ladder |
| Landing sensor suite | Defended on cost, mass, accuracy, and failure behaviour together, never on one axis alone |

The next lesson turns to the controls, estimation, and dynamics questions that recur across rounds — not to rehearse the module's own quiz, but to build the catalog of follow-up questions that separate memorization from understanding.
