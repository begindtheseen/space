---
id: l09-systems-rounds-and-arguing-from-a-trade
title: Systems and architecture rounds, and arguing from a trade
minutes: 21
covers:
  - "Systems and architecture rounds: design a GNC flight software stack, a Monte Carlo pipeline, an FDIR scheme, a sensor suite for a given mission"
  - Explaining a design decision in terms of a trade rather than a preference
---

Ask two architects to design a house and you get two different houses. Both can be good. What makes one architect better is not finding the one "right" house. It is asking who will live there before drawing anything, knowing why the kitchen goes next to the dining room, and being able to say what was given up for the big windows.

A systems round in a GNC interview works the same way. There is almost never a single correct architecture waiting to be found. The round is graded on structure:

- Did you clarify the requirement before designing against it?
- Did you state your assumptions?
- Did you break the problem into sensible pieces?
- Did you go deep somewhere, to show real judgment, instead of skimming everything at the same shallow depth?
- And, running through all of it: was every choice defended as a **trade**, not asserted as a preference?

This lesson gives you that skeleton once, in full. Then it applies the skeleton to the four prompts this module is built around: a GNC flight software stack, a Monte Carlo verification pipeline, an **[[FDIR|fdir]]** scheme, and a sensor suite for a propulsive landing.

## Trade, not preference

Picture choosing between a bike and a bus to get to school. "I like the bike" is a **preference** — a bare statement with nothing behind it. "The bike over the bus, because I care more about leaving whenever I want than about staying dry; the cost is that I get wet when it rains" is a **trade**. It names three things:

1. **the alternative** you are choosing against (the bus);
2. **the axis** you are judging on (freedom to leave when you want);
3. **what you give up** by not choosing the alternative (staying dry).

Here is the same shape in GNC: "A convex formulation over a general nonlinear one, because I need a bounded solve time and a guarantee of the global optimum more than I need the slightly better cost a nonconvex formulation might reach. The cost I'm accepting is that not every physically reasonable objective can be written convexly, so I lose some modeling freedom."

That is checkable and defensible in a way a bare preference is not. An interviewer can push on any one of the three parts. They can challenge the axis, propose a different alternative, or question whether the cost you named is really the cost. Each time, you have something concrete to respond to.

Every "why not X?" question in a systems round, and most of the follow-ups inside one, tests exactly this. The habit to build: narrate each real design choice in this three-part shape *as you make it*, not only when asked to defend it afterward.

::: key
A trade names the alternative, the axis being optimized, and what is given up. A preference names none of the three. Interviewers push on trades to find the boundary of your reasoning; a bare preference gives them nothing to push on except "why", which is exactly the question you did not want to be asked twice.
:::

## The systems-round skeleton

Five steps, in order.

**1. Restate the requirement, and ask the one clarifying question that most changes the answer.** One, not a checklist — chosen because its answer would send the design down a truly different path. "Is this vehicle crewed or uncrewed?" changes a flight-software redundancy architecture more than almost anything else you could ask. Five low-leverage questions in a row sound like stalling. The one that matters shows you already understand the shape of the problem.

**2. State your assumptions.** Whatever the clarifying question does not settle, assume it out loud. It is the same discipline as every derivation earlier in this module.

**3. Give the decomposition.** A short, named list of the major pieces and how they connect. The rest of the answer hangs on this outline. If there is a whiteboard, draw it.

**4. Go deep on one part.** Depth on one piece is worth more than equal shallow coverage of all of them. Shallow coverage cannot tell a candidate who understands the domain from one who memorized a buzzword for each box. Pick the piece most central to the question, or the one you can defend most rigorously, and spend real time there.

**5. Close with failure modes, the trade you made, and what you would measure to know you were right.** Every real design has a way it breaks. Naming it unasked is the same instinct as volunteering a failure talk. The trade ties the whole answer together. The measurement makes the design **falsifiable** — something a test could prove wrong — instead of merely asserted.

::: key
Skeleton for any systems-design answer: restate the requirement and ask the one clarifying question that most changes the answer; state assumptions; give the decomposition; go deep on one part; finish with failure modes, the trade you made, and what you would measure to know you were right.
:::

## Worked in full: a flight software stack for a reusable booster

Before the example, one idea it leans on. A flight computer runs different jobs at different speeds, the way a kitchen checks the stove every few seconds, the oven every few minutes and the pantry once a week. Grouping software by how often it must run is called a **[[rate architecture|rate-groups]]**.

::: example Flight software stack, skeleton applied
**Clarifying question.** "Is this a reusable first stage flying an established profile, or a new vehicle with no flight history — and is any part of the mission crewed?" Assume the answer is: uncrewed, established booster profile. That tells you how aggressive the FDIR philosophy can be.

**Assumptions.** One flight computer with a cold or hot backup. That is standard practice for an uncrewed booster, rather than the triple-redundant **[[voting|voting]]** architecture a crewed vehicle would need.

**Decomposition, by rate.**
- *Sensor and actuator drivers*, fastest: IMU sampling and control-surface or TVC commands, on the order of 1 kHz — one pass per millisecond. The rate is set by the fastest real dynamics that must be sampled without **[[aliasing|aliasing]]**: structural bending modes and actuator bandwidth.
- *Navigation and estimation*, moderate: on the order of 100 Hz, fusing the IMU with GPS and any other aiding sensor.
- *Guidance*, slower: on the order of 10 to 20 Hz, because the trajectory it updates changes more slowly than attitude does.
- *Mode manager and FDIR supervisor*, event-driven rather than purely periodic, watching health across every other layer.
- *Telemetry and ground interface*, decoupled from the control loops, so a slow downlink can never stall a real-time task.

**Depth: the mode manager and FDIR supervisor.**
- Each monitored quantity — sensor cross-checks, actuator position against command, navigation solution health — gets a **threshold** and a **persistence count**: the number of consecutive samples that must exceed the threshold before a fault is declared. A single noisy sample cannot trip a response meant for a real, sustained fault. The price is delay: a persistence of 5 samples at 100 Hz adds $5/100\,\mathrm{s} = 50\,\mathrm{ms}$ before the fault is declared.
- Isolation depends on redundancy. With two of a sensor you can *detect* a mismatch, but you cannot always tell which one is faulty without a third vote or an independent check. Three sensors add majority voting and real isolation.
- Recovery is a ranked ladder, not one action. First, switch to a healthy redundant sensor. If none exists, drop to a coarser control mode. Abort the mission phase only if no safe degraded mode is left.

**Failure modes, trade, measurement.**
- *Failure mode:* a strictly periodic, rate-grouped design is simple to reason about and test. But it can waste cycles on jobs that do not need every period, and it reacts slowly to an event that lands between ticks.
- *Trade:* periodic simplicity and predictable timing, against event-driven responsiveness plus the extra work of proving an event-driven system meets its deadlines.
- *Measurement:* the worst-case jitter and latency from fault detection to recovery action, observed in **[[hardware-in-the-loop|hil]]** testing, checked against the response time the fastest credible fault requires.
:::

## Applied more briefly: the other three prompts

### A Monte Carlo verification pipeline

A Monte Carlo campaign runs the same simulation thousands of times, each with slightly different random inputs, to see the whole spread of outcomes.

::: example Monte Carlo pipeline, skeleton applied
**Decomposition.**
- *Dispersion definition:* which parameters vary, over what distributions, and why those and not others.
- *Case generation and seeding:* a single master **[[seed|seed]]**, with each case's own sub-seed derived deterministically from it, so any one case can be replayed bit-for-bit without rerunning the whole campaign.
- *Execution and scale-out:* run cases in parallel, since they are independent by construction.
- *Scoring:* against criteria fixed *before* the campaign runs, never adjusted after seeing the results.
- *Storage:* summary statistics, plus enough raw data to replay any single case.
- *Reporting:* lead with the **tail** of the distribution — the rare bad end — not only the mean.
- *A hook into [[continuous integration|ci]]:* so a design change cannot silently make the dispersion result worse.

**Depth: seeding and replay.** Reproducibility is what makes a failing case debuggable at all. Without it, a rare failure found on run 8,347 of 10,000 can only be chased by rerunning the whole campaign and hoping it happens again.

**Failure modes, trade, measurement.**
- *Trade:* full fidelity on every case is expensive and limits how many cases you can afford. A cheaper, lower-fidelity first pass that flags suspects for a full-fidelity rerun lets you run far more cases overall — at some risk of missing a rare, narrow failure mode the cheap model cannot see.
- *Measurement:* check whether the tail statistic you actually care about — say, a 99.87th-percentile miss distance — has **[[converged|tail-convergence]]** as the case count grows. Do not assume a round number of cases was automatically enough.
:::

### An FDIR scheme for a sensor suite

**What is monitored.** Usually a mix of three kinds of check:

- **absolute checks:** is this value physically plausible at all?
- **relative checks:** does this sensor agree with a redundant or a dissimilar one?
- **rate checks:** is this value changing faster than the physics allows?

**How.** Each check pairs a threshold with a persistence requirement, for the reason above: a single bad sample should not trigger a response meant for a fault that persists.

**Isolation** is bounded by redundancy. Two identical sensors let you detect disagreement, but not always say which one is wrong. A third, or a **dissimilar** sensor measuring a related but different quantity, is usually what buys real isolation.

**Recovery** runs from switching to a healthy redundant source, to falling back on a less accurate sensor that still works, to commanding a safe, degraded mode when no adequate source remains.

### A sensor suite for a propulsive landing

Defend each sensor on cost, mass, accuracy and failure behavior together.

- **IMU.** Close to non-negotiable. It is cheap and small, and it is the only sensor fast enough for the control loop's own rate. The cost: used alone, its error drifts without bound.
- **Radar altimeter or lidar.** Either adds a direct, drift-free measurement of range and range rate exactly where it matters most — near the ground, where inertial drift is largest compared with the margin left. The trade between the two: lidar has finer angular and range resolution; a radar altimeter is typically more robust to dust, plume interaction and obscured or featureless surfaces, during the very phase when the environment is harshest for optical sensors.
- **Camera for [[terrain-relative navigation|trn]].** It bounds horizontal position error against a map instead of letting it drift with time. The cost: it needs a pre-loaded map, enough light and enough surface texture.
- **GNSS** (satellite navigation, such as GPS). Cheap, and gives an absolute position fix higher up. But it is not relied on near touchdown, where **[[multipath|multipath]]**, vehicle attitude and engine plume effects can degrade or drop the signal exactly when it would matter most. That is itself the trade to state plainly: GNSS is a good, cheap sensor for the phase where losing it briefly is recoverable, and a bad one to depend on alone for the phase where it is not.

::: warning
A systems answer that lists every plausible sensor or component with no trade attached is a shopping list, not a design. What sets an answer apart is not the length of the list. It is whether each item is there for a stated, defensible reason that also explains what was not chosen, and why.
:::

## Check yourself

::: check
State the systems-round skeleton in order, and say briefly what each step checks for.
:::

::: answer
1. **Restate the requirement and ask the one highest-leverage clarifying question.** Checks whether you can spot what actually changes the design, instead of gathering information generically.
2. **State assumptions.** Checks that unknowns are handled out loud, not silently.
3. **Give the decomposition.** Checks structural thinking.
4. **Go deep on one part.** Checks real domain judgment, not surface familiarity.
5. **Close with failure modes, the trade made, and what you would measure.** Checks that the design is falsifiable and that you know its edges — the same instinct as the limitations section of a project talk earlier in this module.
:::

::: check
Why does one well-chosen clarifying question sound better than several, even though more questions gather more information?
:::

::: answer
One well-chosen question shows you already understand the shape of the problem well enough to know which unknown would redirect the design. Crewed versus uncrewed, for instance, changes a redundancy architecture more than almost any other single fact.

A list of several questions, even reasonable ones, sounds like generic information-gathering rather than targeted judgment, and can come across as stalling before committing to an answer.

The rule is not "exactly one question, ever". If more information turns out to be needed once you start decomposing, asking a second question then is fine. The point is to lead with the one that matters most, not a checklist.
:::

::: check
Turn "I'd use a radar altimeter for terminal descent" into a proper trade, naming the alternative, the axis, and what is given up.
:::

::: answer
"A radar altimeter over a lidar for the terminal-descent range measurement, judged on robustness to the descent environment — dust, plume interaction, and non-cooperative or featureless terrain — where a radar altimeter is typically more robust than an optical sensor. What I give up is the finer range and angular resolution a lidar can provide. That would matter more if precise terrain-relative positioning were this sensor's main job, rather than a robust, lower-resolution range to the ground."

- Alternative: lidar.
- Axis: robustness to this specific environment.
- Cost: resolution.

Naming all three turns a bare preference into a claim someone can interrupt and you can defend.
:::

::: check
In an FDIR scheme, why does a good fault check need a threshold *and* a persistence count, rather than a threshold alone?
:::

::: answer
A threshold alone flags any single sample that crosses it, including one caused by ordinary sensor noise. And a fault response — switching sensors, degrading a mode, aborting a phase — is itself costly and sometimes irreversible. Triggering it on noise is a real cost, not a harmless false alarm.

Requiring the threshold to be exceeded for several consecutive samples filters out single-sample noise, while still catching a real, sustained fault within a bounded, known delay. It is a deliberate trade between how fast faults are detected and how often false alarms happen, tuned to the consequences of each kind of error for that particular check.
:::

::: check
Why does deriving each case's seed from a single master seed matter for a Monte Carlo pipeline, beyond only "having a random seed" for reproducibility?
:::

::: answer
A single global seed for the whole campaign makes the campaign reproducible only as a whole. Rerunning it from scratch reproduces the same ten thousand cases. But there is no way to rerun just the one case that failed without regenerating everything before it in the sequence, which is often far too expensive.

Deriving each case's seed deterministically from the master seed and that case's index means any single case can be regenerated and replayed on its own, bit-for-bit. That is what makes a failing case actually debuggable, not merely reproducible in principle.
:::

::: check
Why is "go deep on one part" scored higher than covering every part of a design at equal, shallow depth, even though the shallow version touches more of the problem?
:::

::: answer
Shallow, equal coverage cannot tell real understanding from a memorized list of the right words for each box in a diagram. Anyone who has read a survey of the topic can produce that.

Depth on one part forces you through second- and third-order consequences: what happens when this specific check fails, what the numbers or thresholds would plausibly be, what the failure cascades into. That is much harder to fake, and it is a direct, checkable demonstration of understanding rather than familiarity. An interviewer choosing where to push will almost always push on the deep part, because that is where the real signal is.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Trade vs preference | A trade names the alternative, the axis, and the cost given up; a preference names none of the three |
| Systems skeleton | Restate + one clarifying question; state assumptions; decompose; go deep on one part; close with failure modes, the trade, and what you'd measure |
| Flight software stack | Layered by rate (drivers ~1 kHz, estimation ~100 Hz, guidance ~10–20 Hz, event-driven mode management, decoupled telemetry); redundancy scaled to crewed/uncrewed; FDIR with threshold-plus-persistence and a ranked recovery ladder |
| Monte Carlo pipeline | Dispersion definition, seeded and replayable case generation, scale-out execution, criteria fixed before scoring, tail-focused reporting, CI hook |
| FDIR scheme | Absolute, relative, and rate checks, each with threshold and persistence; isolation bounded by redundancy; recovery as a ranked ladder |
| Landing sensor suite | Defended on cost, mass, accuracy, and failure behavior together, never on one axis alone |

The next lesson turns to the controls, estimation and dynamics questions that recur across rounds. It does not rehearse the module's own quiz; it builds the catalog of follow-up questions that separate memorization from understanding.

::: context fdir Detect, isolate, recover
**FDIR** stands for **fault detection, isolation and recovery**. *Detection* notices that something is wrong: a reading is impossible, or two sensors disagree. *Isolation* works out which part is at fault. *Recovery* does something about it: switch to a backup, change mode, or abort safely. The three are separate because each needs different information. Detecting a disagreement needs two sources; isolating the culprit usually needs three, or an independent check. Some programs say FDIR, others FDI or simply fault management; the idea is the same, and every flight program has a document describing it.
:::

::: context rate-groups Loops inside loops
In a rate-grouped design, the fastest loop sets the heartbeat, and slower loops run on every $N$-th beat. At 1000 Hz, a 100 Hz task runs every 10th tick and a 10 Hz task every 100th.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="32" font-size="12" fill="#1f2a44">1 kHz</text>
  <text x="10" y="67" font-size="12" fill="#1f2a44">100 Hz</text>
  <text x="10" y="102" font-size="12" fill="#1f2a44">10 Hz</text>
  <g stroke="#8fb8f0" stroke-width="2">
    <line x1="70" y1="20" x2="70" y2="38"/><line x1="97" y1="20" x2="97" y2="38"/><line x1="124" y1="20" x2="124" y2="38"/>
    <line x1="151" y1="20" x2="151" y2="38"/><line x1="178" y1="20" x2="178" y2="38"/><line x1="205" y1="20" x2="205" y2="38"/>
    <line x1="232" y1="20" x2="232" y2="38"/><line x1="259" y1="20" x2="259" y2="38"/><line x1="286" y1="20" x2="286" y2="38"/>
    <line x1="313" y1="20" x2="313" y2="38"/><line x1="340" y1="20" x2="340" y2="38"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="70" y1="55" x2="70" y2="73"/><line x1="340" y1="55" x2="340" y2="73"/>
  </g>
  <line x1="70" y1="90" x2="70" y2="108" stroke="#b4232c" stroke-width="3"/>
  <text x="205" y="80" font-size="12" text-anchor="middle" fill="#6c7a93">10 ms between runs</text>
  <text x="205" y="122" font-size="12" text-anchor="middle" fill="#6c7a93">next run 100 ms later, off this strip</text>
</svg>
```

The strip shows 10 ms: eleven fast ticks, two 100 Hz runs at its ends, and one 10 Hz run. Each task must finish before its next turn.
:::

::: context voting Two out of three
With three identical computers or sensors, a **voter** compares their outputs and goes with the majority. If one disagrees with the other two, it is outvoted and flagged as faulty, and the system keeps running on the two that agree. With only two, a disagreement tells you *that* something is wrong but not *which* one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="10" width="90" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="20" y="55" width="90" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="20" y="100" width="90" height="30" rx="4" fill="#fff"/>
    <rect x="180" y="45" width="70" height="50" rx="4" fill="#f2b880"/>
    <line x1="110" y1="25" x2="180" y2="60"/><line x1="110" y1="70" x2="180" y2="70"/>
    <line x1="110" y1="115" x2="180" y2="80" stroke="#b4232c" stroke-dasharray="4,3"/>
    <line x1="250" y1="70" x2="290" y2="70"/>
  </g>
  <polygon points="290,65 300,70 290,75" fill="#1f2a44"/>
  <text x="65" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">A: 12.1</text>
  <text x="65" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">B: 12.0</text>
  <text x="65" y="120" font-size="12" text-anchor="middle" fill="#b4232c">C: 47.9</text>
  <text x="215" y="74" font-size="12" text-anchor="middle" fill="#1f2a44">voter</text>
  <text x="304" y="65" font-size="12" fill="#1f2a44">A, B</text>
  <text x="304" y="81" font-size="12" fill="#b4232c">C out</text>
</svg>
```

A and B agree, C does not, so C is isolated. Crewed spacecraft push this further: the Space Shuttle flew four primary computers that voted, plus a fifth running separately written backup software, so that a single software bug could not take out every computer at once.
:::

::: context aliasing Sampling fast enough
If you film a spinning wheel, it can appear to turn slowly backward. The camera samples too slowly to follow the real motion, so a fast motion masquerades as a slow one. That is **aliasing**. The rule of thumb, from the Nyquist sampling theorem, is that you must sample at more than twice the highest frequency you care about — and in practice control engineers go several times faster. A booster's first bending mode might be a few hertz to a few tens of hertz, and actuator dynamics faster still, which is part of why the innermost loop runs near a kilohertz.
:::

::: context hil Real hardware, simulated world
In **hardware-in-the-loop** (HIL) testing, the real flight computer runs the real flight software, but its sensors and actuators are replaced by a simulation that feeds it fake readings in real time and reacts to its commands. The computer cannot tell it is not flying. That lets engineers measure true timing — how long a fault really takes to detect and handle on the actual processor — and inject faults that would be too dangerous or expensive to cause on a real vehicle.
:::

::: context seed Where "random" numbers come from
A computer's random numbers are usually **pseudo-random**: a formula produces a long sequence that looks random, starting from a number called the **seed**. The same seed always produces the same sequence. So a Monte Carlo case run with seed 8347 can be rerun exactly, anywhere, any time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">master seed</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="40" x2="55" y2="85"/><line x1="180" y1="40" x2="180" y2="85"/><line x1="180" y1="40" x2="305" y2="85"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44">
    <rect x="15" y="85" width="80" height="30" rx="4"/><rect x="140" y="85" width="80" height="30" rx="4"/><rect x="265" y="85" width="80" height="30" rx="4"/>
  </g>
  <text x="55" y="105" font-size="12" text-anchor="middle" fill="#1f2a44">case 1</text>
  <text x="180" y="105" font-size="12" text-anchor="middle" fill="#1f2a44">case 2</text>
  <text x="305" y="105" font-size="12" text-anchor="middle" fill="#1f2a44">case 8347</text>
  <text x="180" y="134" font-size="12" text-anchor="middle" fill="#6c7a93">each case seed = f(master seed, case index)</text>
</svg>
```

Because each case's seed is computed from the master seed and the case number, case 8347 can be rebuilt without running cases 1 to 8346 first.
:::

::: context ci A robot that reruns the tests
**Continuous integration** (CI) is a server that automatically builds the software and runs its tests every time someone changes the code. If a test fails, the change is flagged before it is merged. Hooking a Monte Carlo campaign into CI — often a smaller campaign on every change and the full one nightly — means a tweak to a guidance gain that quietly worsens the worst landing gets caught the same day, not months later during a review.
:::

::: context tail-convergence Why a tail needs many cases
The 99.87th percentile is the value only 0.13% of cases exceed. In 10,000 cases that is about $10\,000 \times 0.0013 = 13$ cases — so your estimate of the tail rests on roughly a dozen points, and random chance alone moves that count by about $\pm 3.6$. The mean, by contrast, uses all 10,000. A simple check: plot the tail statistic against the number of cases run. If it is still wandering as the count grows, you need more cases before quoting it.
:::

::: context trn Navigating by the view out the window
**Terrain-relative navigation** (TRN) matches camera images of the ground against a map stored onboard, the way you might work out where you are by recognizing landmarks. NASA's Perseverance rover used it in 2021 to land in Jezero Crater: during descent it compared its camera images with an orbital map, worked out its position, and steered away from hazardous ground. It needs a good map, daylight and surface features to recognize, which is exactly the cost named in the lesson.
:::

::: context multipath Signals that bounce
**Multipath** happens when a satellite signal reaches the antenna by more than one route: directly, and also bounced off the ground or a nearby structure. The bounced copy arrives slightly late and confuses the receiver's measurement of distance to the satellite. Near the ground there is a lot to bounce off. Add a vehicle tilting its antenna away from the sky and an engine plume that can weaken the signal, and GNSS becomes least reliable in the last seconds before touchdown — the very moment a landing needs the best navigation.
:::
