---
id: l06-tmr-and-voting
title: Triple modular redundancy and voting
minutes: 20
covers:
  - Triple modular redundancy and voting; mid-value select; what a voter can and cannot detect
---

Triple modular redundancy — three independent channels computing or measuring the same quantity, with a voter reconciling them into one answer used downstream — is the single most recognizable pattern in fault-tolerant flight software, and it is also the pattern most often trusted to do more than it actually does. A voter is a precisely limited piece of logic: it can tell you when the three channels disagree, and it can produce a sensible output when exactly one of them is wrong in an obvious way. It cannot tell you that a value is *correct*. Those are different claims, and the gap between them is where real failures live.

This lesson builds a voter, shows it correctly doing the job it is good at, and then shows the specific way it fails that a working GNC engineer has to be able to state precisely, not merely gesture at: when all three channels are wrong in the same way, a voter reports full health on a value that is wrong. Lesson 7 adds a second, structurally different failure mode — a channel that lies differently to different listeners — that defeats a vote even without every channel being wrong.

## Two ways to reconcile three channels

Given three values meant to represent the same quantity, a voter has to produce one output (or explicitly refuse to). This lesson uses two concrete schemes throughout, both standard in flight software and worth knowing by name and by exact behavior.

**Majority vote**, here implemented with a tolerance: check each of the three pairs for agreement within a tolerance; if exactly one pair agrees, output that pair's average and flag the third channel; if all three agree, output the average of all three; if no pair agrees, refuse to produce a value at all and flag every channel, because a "majority" that does not exist should never be manufactured by picking one arbitrarily.

**Mid-value select**: output the median of the three values, always, with no notion of "agreement" at all — there is no case in which it refuses to answer.

```python
def majority_vote(values, tol):
    a, b, c = values
    pairs = [(0, 1, a, b), (0, 2, a, c), (1, 2, b, c)]
    agreeing = [(i, j) for (i, j, x, y) in pairs if abs(x - y) <= tol]
    if len(agreeing) == 0:
        return None, [0, 1, 2]
    if len(agreeing) == 3:
        return sum(values) / 3.0, []
    (i, j) = agreeing[0]
    k = ({0, 1, 2} - {i, j}).pop()
    return (values[i] + values[j]) / 2.0, [k]

def mid_value_select(values):
    return sorted(values)[1]
```

Both are instances of the same pattern this module calls triple modular redundancy: three replicated channels feeding a single reconciling function. What differs is what each function assumes and what it promises, and that difference is the second half of this lesson.

## What a voter is good at: masking a hard failure

Take three redundant strings reporting the same body pitch rate, in degrees per second, and let one of them fail hard — stuck, or wildly out of family, the kind of failure that is unmistakably wrong the moment you look at it next to the other two.

::: example Correctly masking a hard-over failure
```python
A, B, C = 1.00, 1.02, 6.00      # deg/s; C is stuck hard-over
tol = 0.10

mv_out, mv_fault = majority_vote([A, B, C], tol)
mid_out = mid_value_select([A, B, C])
print(f"|A-B|={abs(A-B):.3f}  |A-C|={abs(A-C):.3f}  |B-C|={abs(B-C):.3f}")
print(f"majority_vote -> out={mv_out}, faulted={mv_fault}")
print(f"mid_value_select -> out={mid_out}")
# |A-B|=0.020  |A-C|=5.000  |B-C|=4.980
# majority_vote -> out=1.01, faulted=[2]
# mid_value_select -> out=1.02
```
A and B agree to within two hundredths of a degree per second; C disagrees with both by roughly five degrees per second. Both schemes correctly isolate channel 2 (C): majority vote reports the average of the agreeing pair and flags C explicitly; mid-value select's median lands on B, which is one of the two healthy values, without ever needing an explicit notion of "agreement" to get there. This is the case a voter exists for, and it works exactly as advertised.
:::

## What a voter cannot detect: the common-mode error

Now let the exact same three channels agree tightly with each other — and be wrong together. A common-mode error is any fault that affects all three channels the same way: a calibration constant baked identically into all three builds, a shared power or timing input, or — the case that matters most for a GNC engineer specifically — a software defect present in the identical code all three channels run.

::: example Perfect agreement, and a five-degree-per-second error nobody catches
```python
true_value = 1.00
A, B, C = 5.998, 6.020, 5.990   # a shared +5 deg/s calibration defect in all three
tol = 0.10

mv_out, mv_fault = majority_vote([A, B, C], tol)
mid_out = mid_value_select([A, B, C])
print(f"spread = {max(A,B,C)-min(A,B,C):.3f}")
print(f"majority_vote -> out={mv_out:.3f}, faulted={mv_fault}")
print(f"mid_value_select -> out={mid_out:.3f}")
print(f"error vs truth: majority={mv_out-true_value:.3f}, midvalue={mid_out-true_value:.3f}")
# spread = 0.030
# majority_vote -> out=6.003, faulted=[]
# mid_value_select -> out=5.998
# error vs truth: majority=5.003, midvalue=4.998
```
The three channels agree to within three hundredths of a degree per second — tighter than the hard-failure case above by two orders of magnitude — and every voter in this lesson reports full health, zero flagged channels, output near six degrees per second. The truth is one degree per second. Both schemes are off by roughly five degrees per second, and nothing about running either voter, however carefully, reveals it.
:::

This is not a limitation of the specific tolerance chosen, or a bug in either function above; it is a structural fact about what voting *is*. A voter is a check for **agreement among the channels**, and agreement is necessary but nowhere near sufficient for correctness. When three replicas run the identical software on the identical bad input — or carry the identical defect in their identical code — they compute the identical wrong answer, and a mechanism built entirely out of comparing channels to each other has no channel left to compare against that would show the disagreement. Catching this class of failure requires something voting alone cannot supply: an independent measurement of the same physical quantity, from a different sensing principle or a different, independently developed piece of logic — a residual check against something that was never one of the three channels in the vote to begin with. Lessons 9 and 10 build exactly that.

::: key
A voter detects *disagreement* among redundant channels, not *incorrectness* of the value they agree on. Three channels running the same defective software, or sharing the same bad input, agree with each other and are wrong together — a common-mode error — and no comparison among only those three channels can reveal it. Triple modular redundancy defends against independent, random faults; it does nothing for a design fault shared by every replica.
:::

## Majority vote versus mid-value select: what each buys

The two schemes agreed closely in both cases above, which can make them look interchangeable. They are not, and the difference shows up precisely when the comparison tolerance is tightened to match what majority vote is actually for.

A majority vote comparing at a **tight, near bit-exact tolerance** is the right tool when the three channels are supposed to compute an *identical* value — three lockstep replicas of a deterministic algorithm, of the kind lesson 5 described voting across flight computers, where any daylight between two channels is itself evidence of a fault (lesson 7 has much more to say about what "identical" requires). It is the wrong tool applied to three **independently sampled physical measurements**, because independent sensors sampling independent noise are never expected to agree bit-exactly even when every one of them is working perfectly.

::: example A drifting channel: majority vote goes silent, mid-value select degrades gracefully
```python
A, B = 1.0002, 0.9997    # two independent, healthy channels -- never bit-identical
tol = 0.0                # bit-exact: appropriate for comparing deterministic replicas, not sensors
drift_rate = 0.006        # units per second

for t in [0, 8, 16, 24, 32, 40]:
    C = 1.0000 + drift_rate * t
    mv_out, mv_fault = majority_vote([A, B, C], tol)
    mid_out = mid_value_select([A, B, C])
    mv_str = "no majority" if mv_out is None else f"{mv_out:.6f}"
    print(f"t={t:3d}s  C={C:.4f}  majority={mv_str:>12}  mid_value={mid_out:.4f}")
# t=  0s  C=1.0000  majority= no majority  mid_value=1.0000
# t=  8s  C=1.0480  majority= no majority  mid_value=1.0002
# t= 16s  C=1.0960  majority= no majority  mid_value=1.0002
# t= 24s  C=1.1440  majority= no majority  mid_value=1.0002
# t= 32s  C=1.1920  majority= no majority  mid_value=1.0002
# t= 40s  C=1.2400  majority= no majority  mid_value=1.0002
```
Held to bit-exact agreement, the majority vote produces **no output at all, from the very first sample**, because A and B — both healthy — are never bit-identical to each other, let alone to C: a bit-exact vote is the wrong instrument for this signal and fails to form regardless of whether C has drifted at all. Mid-value select never has this problem, because it never required agreement in the first place: at $t=0$ it tracks C, sitting between A and B; once C drifts past both, the median locks onto A (the higher of the two stable channels) and stays there, bounded and defined, at every single time step — a control loop reading it always has a sensible number to act on, which is precisely what "degrades gracefully" means here. A control loop reading the majority vote instead has nothing, at every one of those same time steps.
:::

The lesson is not that mid-value select is strictly better — it is that the two schemes answer different questions and belong on different kinds of signal. Majority vote, at a tolerance appropriate to the quantity, is a genuine correctness check when the channels are supposed to match: a mismatch really does mean something is wrong, and refusing to produce a value when no majority exists is the right, conservative response to a situation the voter cannot resolve. Applied to independent sensors, that same refusal-on-disagreement behavior turns ordinary, harmless sensor noise into total loss of output. Mid-value select never refuses, which is exactly right for a continuous physical signal that should always have *some* current best estimate, and exactly wrong if what you actually needed to know was "did two of these three deterministic replicas fail to match" — a question mid-value select's median cannot even ask, because it discards that information by design.

::: warning
Choosing a voting scheme is choosing what kind of signal you believe you are voting on. A tight-tolerance majority vote applied to three physical sensors will manufacture nuisance total-loss-of-output events out of ordinary sensor noise; a mid-value select applied to three outputs that are supposed to match exactly will silently average away a real fault instead of flagging it, because it never checks for agreement in the first place.
:::

## What this leaves for the rest of the module

Triple modular redundancy, done with either scheme above, earns its keep against the failure it is built for: one channel, independently, going wrong in a way the other two do not share. That is a large and genuinely common category of real hardware failure, and correctly masking it — as the first worked example did — is not a small thing. But this lesson has now shown, with real numbers, both a case voting cannot touch (common-mode error, agreement and all) and a case where the wrong choice of voting scheme turns healthy redundancy into an outage. Lesson 7 adds a third failure, structurally different from both: a single lying channel that tells two different listeners two different stories, so that even a correctly implemented majority vote, applied by two otherwise healthy computers, produces two different answers.

## Check yourself

::: check
Using `majority_vote` as defined in this lesson, three channels report 2.00, 2.03, and 2.05 with a tolerance of 0.10. What does the function output, and which channel, if any, is flagged?
:::

::: answer
All three pairwise differences (0.03, 0.05, 0.02) are within the 0.10 tolerance, so all three channels agree and the function takes the "all three agree" branch: it outputs the mean of all three, (2.00 + 2.03 + 2.05)/3 = 2.026\overline{6}, and flags nothing. No single channel is treated as suspect when every pair is within tolerance of every other.
:::

::: check
A student argues that the common-mode failure in this lesson's second worked example "isn't really a voting failure, because the voter did exactly what it was designed to do." Is this a fair defense of the voter, and what should the student conclude instead?
:::

::: answer
It is fair as a statement about the voter's logic — it did correctly report agreement among the three channels it was given — but it is not a defense that should reassure anyone about the vehicle's safety, because the whole point of running redundant channels was to catch a wrong answer, and the true answer is off by five degrees per second with the voter reporting full health throughout. The correct conclusion is not that the voter is broken, but that a voter checks a necessary condition (agreement) that is not sufficient for correctness, and that a design relying on voting alone to catch every kind of failure has covered independent hardware faults while leaving common-mode software and calibration defects completely uncovered.
:::

::: check
A team wants to vote on the output of three redundant, independently developed implementations of the same guidance algorithm, each running on identical hardware with identical inputs, and expects their outputs to match to the last bit. Which voting scheme from this lesson fits that description, and what tolerance should be used?
:::

::: answer
Majority vote, at a tight tolerance appropriate to bit-exact (or very nearly bit-exact) agreement — the channels are meant to compute the identical value, so any real disagreement is evidence of a fault, and mid-value select would discard that evidence by silently taking the median without ever checking whether the three matched. Note, though, that "independently developed implementations... expected to match to the last bit" is an unusually strong assumption; lesson 7 revisits exactly why even fault-free, correctly written independent implementations routinely fail to match bit-for-bit unless determinism is deliberately engineered into them.
:::

::: check
Explain, using the drifting-channel example in this lesson, why a majority vote at bit-exact tolerance can produce "no majority" even when none of the three channels has suffered a hard fault.
:::

::: answer
Bit-exact agreement requires two of the three values to be identical down to the last bit, and three independently sampled physical channels — even all fully healthy — carry independent measurement noise that makes exact matches essentially never happen. In the worked example, A and B never match each other exactly at any time step, regardless of what C is doing, so no pair ever satisfies the tolerance and the vote reports "no majority" from the very first sample — a consequence of applying an agreement standard suited to deterministic replicated computation onto signals that were never going to meet it, not evidence that anything is actually broken.
:::

::: check
A vehicle uses mid-value select on three independent altimeter channels during landing. One channel fails by slowly drifting upward over many seconds rather than failing hard. Based on this lesson, what does the vote output while the drift is in progress, and what does that imply about whether mid-value select, by itself, is a complete fault response?
:::

::: answer
While the drifting channel is below the other two, the median continues to track it, since it sits in the middle of the three; once the drift carries it above both healthy channels, the median locks onto the higher of the two healthy channels and stays bounded there, as this lesson's worked example showed. The output stays sensible and bounded throughout — mid-value select is doing exactly what it is designed to do — but at no point does it flag the drifting channel as faulty or alert anything downstream that one of the three inputs is degrading; it silently tolerates the bad channel rather than reporting it. Mid-value select alone is therefore not a complete fault response: it protects the immediate output but supplies no detection or isolation, which is why lessons 9 and 10 build separate residual-monitoring logic on top of it rather than treating the vote itself as a fault detector.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Triple modular redundancy (TMR) | Three replicated channels feeding one reconciling voter |
| Majority vote | Requires two of three to agree within tolerance; averages the agreeing pair, flags the outlier, refuses if no pair agrees |
| Mid-value select | Outputs the median of the three, unconditionally; never refuses, never explicitly flags |
| What a voter detects | Disagreement among redundant channels |
| What a voter cannot detect | A common-mode error: all channels wrong the same way, hence in agreement |
| Right tool for deterministic replicas | Majority vote, tight/bit-exact tolerance |
| Right tool for independent physical sensors | Mid-value select; bit-exact majority vote fails to form even when healthy |

Lesson 7 keeps the same three-channel setup and adds a fault that neither scheme in this lesson was built to survive: a single channel that reports a different value to each of two separate consumers, so that two otherwise-healthy computers, each running a correct vote, disagree with each other.
