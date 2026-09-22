---
id: l05-redundancy-voting-and-fault-management
title: "Redundancy, voting, and fault management"
minutes: 18
covers:
  - redundancy, voting and fault management as first-class design concerns
---

The previous lesson assumed the flight computer works. This one starts from the fact that, eventually, on some flight, a specific unit will not: a sensor will drift, a computer will glitch, a connector will fail. None of that is a defect in the design — it is a property of physical hardware operating for long enough, in a harsh enough environment, that low-probability events stop being negligible. Redundancy, voting and fault management exist because a vehicle still has to behave correctly when that happens, and this lesson is about how that requirement gets designed in from the start rather than patched on afterward.

"First-class design concern" is doing specific work in that sentence. It means the question "what happens when this fails" is asked while the architecture is still being decided — how many flight computers, how many of each sensor, how a final command gets chosen when sources disagree — not asked after the nominal design is finished, as a separate pass to see what might go wrong. A system designed this way looks different from the start: it has more than one of the things that must not silently fail, and it has an explicit, tested answer for what happens when one of them does.

## Voting: turning several imperfect answers into one trustworthy one

The simplest version of the redundancy problem: you have three sensors measuring the same physical quantity, each with some ordinary noise, and one of them develops a fault and starts reporting something wrong. What single number should the rest of the system use?

A plain average seems reasonable and is exactly the wrong choice, because an average gives every input equal weight, including the faulted one — a single badly wrong sensor pulls the average toward itself by an amount proportional to how wrong it is, with no limit. **Voting** — here, taking the median of the three readings — behaves completely differently: as long as at least two of the three sources still agree with each other, the median tracks the agreeing majority almost exactly, and the third, disagreeing source is essentially ignored, no matter how far off it drifts.

::: example A drifting sensor, voted out
Two sensors read a true value of 118.4 with ordinary small noise; a third develops a growing bias fault:

```python
import numpy as np
true_value = 118.4
readings = [
    (118.308, 118.520, 124.400),   # k=0, sensor 3 already biased high
    (118.475, 118.409, 124.700),   # k=1
    (118.294, 118.286, 125.300),   # k=3
    (118.407, 118.432, 126.500),   # k=7, fault has grown further
]
for s1, s2, s3 in readings:
    med = float(np.median([s1, s2, s3]))
    avg = float(np.mean([s1, s2, s3]))
    print(f"s3={s3:8.3f}  median={med:8.3f}  average={avg:8.3f}")
# s3= 124.400  median= 118.520  average= 120.409
# s3= 124.700  median= 118.475  average= 120.528
# s3= 125.300  median= 118.294  average= 120.627
# s3= 126.500  median= 118.432  average= 121.113
```

Across the full run, the median's worst error against the true value of 118.4 is 0.12 — essentially just the ordinary sensor noise. The plain average's worst error is 2.713, more than twenty times larger, and it keeps growing as the faulted sensor drifts further, because the average has no mechanism for recognizing that one of its three inputs has stopped being trustworthy. The median does not know anything about sensor 3 specifically — it never inspects which sensor is which — it simply reflects whichever value two of the three sources agree on, which is exactly the property that makes it robust to a single bad input.
:::

Voting like this is only one shape of the idea — some architectures compare all sources pairwise and explicitly flag whichever one disagrees with the rest, rather than only computing a median — but the underlying principle is the same: with enough independent sources and a rule that favors agreement over any single input, one faulted source stops being able to corrupt the system's answer by itself.

## What redundancy buys you, in numbers, and the assumption it rests on

Redundancy's benefit can be stated precisely if you are willing to assume each unit fails independently of the others, with some probability $p$ per unit. For a single unit with no redundancy (simplex), the system fails whenever that one unit fails: $P(\text{fail}) = p$. For a triplex system using 2-of-3 voting, the system only fails if at least two of the three units fail at once:

$$
P(\text{fail}) = \binom{3}{2}p^2(1-p) + \binom{3}{3}p^3
$$

::: example How much does voting actually buy, assuming independence?
For two illustrative values of $p$ — these are chosen only to demonstrate the arithmetic, not a claim about any real vehicle's actual failure rate:

```python
import math

def triplex_fail(p):
    return math.comb(3, 2)*p**2*(1-p) + math.comb(3, 3)*p**3

for p in (0.02, 0.001):
    simplex = p
    triplex = triplex_fail(p)
    print(f"p={p:6.4f}  simplex={simplex:.6f}  triplex-2-of-3={triplex:.8f}  ratio={simplex/triplex:,.1f}x")
# p=0.0200  simplex=0.020000  triplex-2-of-3=0.00118400  ratio=16.9x
# p=0.0010  simplex=0.001000  triplex-2-of-3=0.00000300  ratio=333.6x
```

At a one-in-a-thousand per-unit failure probability, triplex voting drops the system-level failure probability by more than two orders of magnitude, and the improvement gets more dramatic as the per-unit probability shrinks — redundancy is most valuable precisely when the individual units are already fairly reliable, which is the regime real flight hardware is actually designed to operate in.
:::

That entire calculation rests on one assumption stated explicitly at the start: independence. Real failures are not always independent, and the ones that are not are the actually hard part of this problem. A **common-mode failure** is a single root cause that defeats more than one redundant unit at once — three sensors from the same manufacturing lot sharing a design flaw, three computers sharing a single power supply that fails, or a burst of radiation, a well-documented real hazard for electronics operating above most of the atmosphere's shielding, flipping bits in more than one unit within the same short window. Against a common-mode failure, tripling the hardware buys nothing, because the arithmetic above assumed the three failures were statistically unrelated, and a common-mode event makes them highly related. This is why real fault-tolerant design spends real effort on manufacturing and power diversity where it is practical, and on hardware and software specifically designed to tolerate or detect the kind of single-cause-multiple-symptom failure that plain voting cannot see coming — the redundancy count is necessary, but by itself it is not sufficient.

::: key
Voting converts several imperfect, redundant measurements or computations into one trustworthy answer by favoring agreement over any single disagreeing input; a plain average does the opposite; a triplex 2-of-3 architecture can reduce system-level failure probability by orders of magnitude versus a single unit, assuming failures are independent — and that assumption, not the redundancy count, is where common-mode failures do their damage.
:::

## Fault management: detect, isolate, recover

Redundant hardware and a voting rule are necessary but not sufficient by themselves; something has to actually notice a fault, figure out which unit caused it, and decide what to do next. This is usually described as three separate capabilities, each of which can fail on its own even if the others work:

**Detection** is noticing that something is wrong at all — a vote that does not converge cleanly, a sensor reading outside its physically possible range, a checksum that does not match. A system with excellent redundant hardware and no detection logic will happily keep using a faulted unit's output forever, because nothing is watching for the disagreement.

**Isolation** is figuring out specifically which unit is at fault, not merely that some disagreement exists. Detecting that "the three sensors disagree" is not the same as knowing which one is wrong; isolation is what lets the system stop trusting the faulted unit specifically, rather than either guessing or distrusting everything.

**Recovery** is deciding what to do once a fault is isolated — continue operating on the remaining good units, switch to a backup, or, if the fault is severe enough, command the vehicle to a safe, well-understood configuration rather than continuing the original plan with degraded information. Recovery is a designed, specific decision for each class of fault, not a generic "figure it out" fallback.

All three have to be deliberately designed and, importantly, deliberately tested — a fault-management path that has never actually been exercised by an injected fault during testing is not verified any more than an unverified simulation was in the previous lesson, and for the same reason: a plausible-looking design is not the same as a demonstrated one. Injecting a specific, realistic fault during test — a sensor forced to a stuck value, a computer forced to stop responding — and confirming that detection, isolation and recovery all happen the way the design intends is how this part of the system earns the same kind of trust a control loop's timing budget or a simulation's verification case earns elsewhere in this module.

::: warning Redundant hardware without fault management is not fault tolerance
Three sensors wired to a voting function is real progress over one sensor, but "we have three of them" is not by itself a complete answer to "what happens when one fails" — that answer also needs detection that actually fires, isolation that correctly identifies the bad unit, and a recovery action that has been tested, not merely designed. Treat all three as separate, individually verifiable requirements.
:::

## Check yourself

::: check
Explain what voting is solving for, given several redundant measurements of the same quantity, and why a plain average is a poor substitute for it.
:::

::: answer
Voting is solving for a single trustworthy value from several imperfect, redundant sources when one of them may be faulted. A plain average weights every source equally regardless of correctness, so a single badly wrong input pulls the result toward itself by an amount proportional to how wrong it is, with no limit; a voting scheme such as a median favors whichever value the majority of sources agree on, so a single disagreeing source is largely ignored rather than allowed to corrupt the combined result.
:::

::: check
In the drifting-sensor example, the median's worst error was 0.12 and the plain average's worst error was 2.713. Explain specifically why the gap between the two grows as the faulted sensor's bias grows.
:::

::: answer
The median only depends on which value two of the three sources agree on, so as long as the fault stays a minority of one out of three, growing that one sensor's bias further does not move the median at all — it stays anchored to the agreeing pair. The average, in contrast, includes the faulted sensor's value directly in its calculation with full weight, so as that sensor's bias grows, the average is pulled proportionally further from the true value, widening the gap between the two methods as the fault worsens.
:::

::: check
Explain concretely what it means for redundancy to be "a first-class design concern" rather than something added after the nominal design is finished.
:::

::: answer
It means the question of what happens when a given unit fails is asked while the architecture itself is being decided — how many flight computers, how many of each sensor, and how a command gets chosen when sources disagree — so that the answer shapes the hardware count and the software's voting and fault-management logic from the start. Treating it as an afterthought instead would mean designing the nominal system first and only later asking how it degrades, which tends to produce redundancy that is incomplete, mismatched to the real failure modes, or bolted onto an architecture that was never built to support it cleanly.
:::

::: check
The reliability calculation for triplex voting assumes each unit fails independently. Explain what a common-mode failure is and why it defeats the benefit that calculation predicts.
:::

::: answer
A common-mode failure is a single root cause — a shared design flaw, a shared power supply, a radiation event affecting more than one unit in the same short window — that can defeat multiple redundant units at once rather than one at a time. The reliability calculation's dramatic improvement comes entirely from treating the three units' failure probabilities as statistically independent; a common-mode event makes the failures highly correlated instead, so the arithmetic's assumption breaks down and the real protection redundancy provides against that specific failure can be far smaller than the independent-failure calculation suggests.
:::

::: check
Name the three components of fault management — detection, isolation and recovery — and explain why a system could have working redundant hardware and still fail to tolerate a fault if only one of the three is missing.
:::

::: answer
Detection notices that something is wrong; isolation determines specifically which unit is at fault; recovery decides and carries out what the system does in response. A system with redundant hardware but no detection logic will keep using a faulted unit's output indefinitely, since nothing is watching for the disagreement; a system that detects a fault but cannot isolate which unit caused it cannot safely decide which source to stop trusting; and a system that detects and isolates correctly but has no tested recovery action still has no actual response once the fault is found. All three have to work, and each has to be tested with an injected fault, for the system to be genuinely fault tolerant rather than merely equipped with extra hardware.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Voting | Combining several redundant sources into one answer that favors agreement over any single input |
| Simplex / triplex | One unit with no redundancy / three units combined by a voting rule |
| $P(\text{fail})$, triplex 2-of-3 | $\binom{3}{2}p^2(1-p) + \binom{3}{3}p^3$, assuming independent per-unit failure probability $p$ |
| Common-mode failure | A single root cause defeating multiple redundant units at once, breaking the independence assumption |
| FDIR | Fault detection, isolation and recovery — three separate, individually testable capabilities |

The next lesson moves from a single fault to a campaign built to find the ones that only show up rarely: Monte Carlo dispersion, and what a claim built on it is actually allowed to say.
