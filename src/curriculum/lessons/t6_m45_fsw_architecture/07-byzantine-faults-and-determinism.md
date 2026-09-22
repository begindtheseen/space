---
id: l07-byzantine-faults-and-determinism
title: Byzantine faults and determinism
minutes: 20
covers:
  - Byzantine faults and why a majority vote does not handle an asymmetric liar
  - Determinism across redundant strings, and why a non-deterministic algorithm cannot be voted
---

Every fault lesson 6 threw at the voter shared one quiet assumption: whatever a channel reports, it reports the same thing to everyone listening. A stuck sensor is stuck the same way for every consumer of its data; a shared calibration defect biases every consumer's copy identically. That assumption is not a law of nature — it is a property of the hardware and wiring, and when it fails, a fault gets a name of its own: **Byzantine**, after the problem of coordinating loyal generals when a traitor among them is free to tell each one a different story. This lesson builds the failure precisely, shows two otherwise-healthy computers running the identical, correctly implemented voting algorithm reach two different answers, and then turns to a second, related way a vote can be defeated without any hardware fault at all: a lack of determinism in the software the "identical" replicas are supposed to be running.

## A fault that is not the same to everyone

Every fault this module has built so far — stuck, hard-over, drifting, common-mode — presents one value (however wrong) that every consumer of that channel observes identically. A **Byzantine fault** drops that assumption: the failing unit can present *different* values to *different* consumers, at the same instant, for the same quantity. This is not exotic; a partially failed output driver, a corrupted routing stage feeding two separate downstream computers over two separate physical paths, or a fault in a shared bus interface that corrupts data differently depending on which path it takes can all produce exactly this asymmetry, with nothing about the failure announcing itself as anything other than an ordinary disagreement to either individual observer.

Why does this matter more than an ordinary single-channel failure? Because every voter this module has built up to now reasons entirely from what it, locally, was told — and if what it was told is not what a *different*, equally healthy voter was told, two consumers can each run a correct algorithm on consistent-looking inputs and land on two different, individually well-justified answers, with neither one aware that the other exists or disagrees.

## Two healthy computers, one liar, two answers

Take two redundant flight computers, FC1 and FC2, each independently voting over the same three channels A, B, and C. A and B are honest: each reports the same value to both computers. C has a fault that makes it report a different value to each.

::: example An asymmetric liar produces two different, confident answers
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

A, B = 1.00, 1.20        # honest; identical to both FC1 and FC2
tol = 0.10
C_to_FC1, C_to_FC2 = 1.05, 1.20   # C tells FC1 and FC2 two different values

out1, fault1 = majority_vote([A, B, C_to_FC1], tol)
out2, fault2 = majority_vote([A, B, C_to_FC2], tol)
print(f"FC1 sees [A={A}, B={B}, C={C_to_FC1}] -> out={out1:.4f}, excludes channel {fault1}")
print(f"FC2 sees [A={A}, B={B}, C={C_to_FC2}] -> out={out2:.4f}, excludes channel {fault2}")
print(f"divergence between FC1 and FC2: {abs(out1-out2):.4f}")
# FC1 sees [A=1.0, B=1.2, C=1.05] -> out=1.0250, excludes channel [1]
# FC2 sees [A=1.0, B=1.2, C=1.2] -> out=1.2000, excludes channel [0]
# divergence between FC1 and FC2: 0.1750
```
FC1's copy of C sits close enough to A to form a majority with it, so FC1 trusts {A, C} and discards B — which is, in fact, perfectly healthy. FC2's copy of C sits close enough to B to form a majority with it instead, so FC2 trusts {B, C} and discards A — also perfectly healthy. Both computers ran the identical, correctly implemented majority-vote algorithm. Both are fully confident in their result. They disagree with each other by 0.175, and each has discarded a channel that was never actually at fault, keeping only the one channel that was lying to both of them the whole time.
:::

Notice what did *not* go wrong here: neither computer's voting logic has a bug, and A and B — the two honest channels — never disagreed with themselves. The entire fault lives upstream, in what C chose to tell each listener, and a voter that only ever sees its own local inputs has no way to detect it, because from either computer's vantage point everything it was given is internally consistent.

::: key
A Byzantine fault presents different values to different consumers of the same channel. A correctly implemented majority vote, run independently and correctly by two otherwise-healthy consumers, can then produce two different, individually well-supported answers — a failure mode no amount of care in the voting *algorithm* fixes, because the fault is in what each voter is told, not in how it decides.
:::

## What actually helps: making the liar contradict itself

The asymmetry is only dangerous because each consumer reasons in isolation. If FC1 and FC2 exchange, in one additional round, what value they each received from C — before either commits to a vote — the contradiction becomes visible to both of them at once.

::: example One round of cross-exchange exposes the liar to both consumers
```python
def exchange_and_vote(a, b, c_seen_by_me, c_seen_by_peer, tol):
    if abs(c_seen_by_me - c_seen_by_peer) > tol:
        # C told two different stories: exclude it outright, vote on what remains
        if abs(a - b) <= tol:
            return (a + b) / 2.0, "C excluded (inconsistent across consumers)"
        return None, "C excluded (inconsistent across consumers); A and B do not agree either"
    return majority_vote([a, b, c_seen_by_me], tol)

out1x, reason1x = exchange_and_vote(A, B, C_to_FC1, C_to_FC2, tol)
out2x, reason2x = exchange_and_vote(A, B, C_to_FC2, C_to_FC1, tol)
print(f"FC1 with exchange: {out1x}  ({reason1x})")
print(f"FC2 with exchange: {out2x}  ({reason2x})")
# FC1 with exchange: None  (C excluded (inconsistent across consumers); A and B do not agree either)
# FC2 with exchange: None  (C excluded (inconsistent across consumers); A and B do not agree either)
```
`|C_to_FC1 - C_to_FC2| = 0.15`, larger than the tolerance, so both consumers now see the contradiction directly and exclude C outright — before it gets anywhere near a vote. In this particular example, A and B were chosen 0.20 apart specifically so that C was needed to form any majority at all, so once C is excluded, neither consumer finds one either, and both correctly report no trustworthy answer. That is the actual guarantee cross-exchange buys: not that you are handed a good value — sometimes, as here, there genuinely isn't one available — but that both consumers reach the *same* conclusion about the situation, instead of each confidently reaching a *different* one. A system where two computers fail identically and loudly is one the rest of the architecture (an FDIR monitor, a fallback source, a crew alert) can act on consistently; a system where they disagree behind each other's backs, each fully confident, is not.
:::

The general result behind this — how many Byzantine-faulty participants a fixed number of honest ones can tolerate, and how many rounds of exchange that requires — is a classical result in distributed computing, and it is more expensive than the ordinary majority vote of lesson 6: it requires participants to actively communicate with each other, not only report to a common consumer, and it scales less favorably as the number of tolerated liars grows. In practice, flight software more often manages Byzantine exposure by engineering it out at the source — physically and electrically isolating each channel's fan-out to its consumers so that a fault cannot easily reach one consumer's copy without reaching the other's identically — and by adding the cross-exchange step above on the specific handful of values where an asymmetric fault would be most costly, rather than running full Byzantine agreement everywhere.

## Determinism: the assumption a bit-exact vote needs from *good* software

Lesson 6 flagged, but did not fully explain, why a bit-exact majority vote is the right tool specifically for deterministic replicated computation. This section makes that precise, because it is the second way a vote can be defeated with zero hardware fault anywhere in the system.

**Determinism** means: the same code, given the same inputs, produces the same output, every time, on every replica. A bit-exact vote across three lockstep computers is only meaningful if this holds — if it does not, two fully healthy replicas, computing nothing wrong, can produce different bit patterns for what is mathematically the same result, and a bit-exact vote reads that difference as a fault.

Floating-point arithmetic is the most common way determinism quietly breaks, because floating-point addition is not associative: the order operations happen in changes the last bit of the result.

::: example Order of summation changes the bit pattern, with nothing "wrong" anywhere
```python
a, b, c = 0.1, 0.2, 0.3
left = (a + b) + c
right = a + (b + c)
print(f"(a+b)+c = {left!r}")
print(f"a+(b+c) = {right!r}")
print(f"bit-exact equal? {left == right}")
# (a+b)+c = 0.6000000000000001
# a+(b+c) = 0.6
# bit-exact equal? False
```
Nothing here is a bug in the ordinary sense — both expressions compute a mathematically identical sum, correctly, to full floating-point precision. They do not, however, produce the identical bit pattern, because floating-point addition rounds after every operation and the rounding depends on the order the additions happen in.
:::

::: example A healthy replica flagged as faulted purely because it summed in a different order
```python
values = [0.1, 0.7, 0.3, 0.9, 0.2, 0.6, 0.4, 0.8, 0.5, 1.1]

def sum_forward(vals):
    total = 0.0
    for v in vals:
        total += v
    return total

lane_A = sum_forward(values)                 # reference implementation
lane_B = sum_forward(list(values))           # identical algorithm, identical order
lane_C = sum_forward(list(reversed(values))) # a later refactor iterated backward

print(f"lane A: {lane_A!r}")
print(f"lane B: {lane_B!r}")
print(f"lane C: {lane_C!r}")
print(f"A == B (bit-exact)? {lane_A == lane_B}")
print(f"A == C (bit-exact)? {lane_A == lane_C}")
# lane A: 5.6
# lane B: 5.6
# lane C: 5.6000000000000005
# A == B (bit-exact)? True
# A == C (bit-exact)? False
```
A bit-exact vote across these three lanes finds the majority {A, B} and flags C as faulted. But C computed nothing wrong: it ran a different, equally valid summation order over the identical input values, and floating-point non-associativity did the rest. A vote discarded a fully healthy lane for no reason beyond this, because the three replicas were not deterministic with respect to each other — the exact failure mode lesson 6 named without yet explaining, now produced from real, unmodified Python floats.
:::

Summation order is one instance of a broader category. Anything that lets two replicas, executing the same source code, take a different path through floating-point operations — iterating a hash-based container in an order that depends on memory layout, a parallel reduction that completes its partial sums in whatever order threads happen to finish, a compiler that reassociates floating-point expressions differently at two optimization levels, an uninitialized read that happens to pick up different stack garbage on two runs, a random-number generator seeded from wall-clock time rather than a value shared identically across replicas — breaks the bit-exact guarantee a majority vote depends on, without any replica having done anything incorrect by the standard a code reviewer would normally apply.

::: warning
"The three replicas run the same source code" is not the same claim as "the three replicas are deterministic with respect to each other." Fixed iteration order, fixed (or absent) floating-point reassociation, identically seeded and identically consumed random draws, and no dependence on memory addresses or thread completion order all have to be engineered in deliberately — they are not a free consequence of writing correct code.
:::

## Check yourself

::: check
In the main worked example, why does FC1 trust the pair {A, C} while FC2 trusts the pair {B, C}, given that both are running the identical `majority_vote` function?
:::

::: answer
Each computer's vote depends only on the values it was given, and C reported a different value to each: FC1's copy of C (1.05) happens to fall within tolerance of A (1.00), while FC2's copy of C (1.20) falls within tolerance of B (1.20) instead. The algorithm is identical and correctly applied in both cases; the divergence comes entirely from the inconsistent inputs C supplied, not from any difference in how FC1 and FC2 process them.
:::

::: check
A reviewer says the fault in this lesson's main example "isn't really a voting failure, because A and B — the two honest channels — never disagreed with themselves." Is this an accurate description of what went wrong, and what does it get right or wrong about where the problem lives?
:::

::: answer
It is accurate as far as it goes — A and B were each internally consistent, and the entire asymmetry originated with C. But it undersells the danger: the practical consequence is exactly the same as a voting failure, because two consumers meant to agree on one shared answer now disagree, and downstream logic acting on FC1's output and downstream logic acting on FC2's output will behave as though two different measurements were true. The problem lives upstream of the vote, in the delivery path to each consumer, but a system is judged by what it does, not by which layer is technically at fault, and what it did here was disagree with itself.
:::

::: check
Why does the cross-exchange fix in this lesson require an *additional round of communication* between FC1 and FC2, rather than something either could add to its own local voting logic alone?
:::

::: answer
The fault this lesson describes is invisible to any consumer reasoning only from its own local inputs — FC1's view of A, B, and its copy of C is internally consistent on its own, and no amount of cleverness applied to that view alone can reveal that C told FC2 something different. Detecting the inconsistency requires comparing what two different consumers were told, which is information neither one has until it explicitly asks the other — hence one additional round of communication, not a smarter local algorithm.
:::

::: check
Two engineers each independently reimplement the same averaging function in C++, using the same compiler and the same input array, and are surprised when a bit-exact comparison of their outputs fails even though both implementations are correct by every ordinary test. What is the most likely explanation, based on this lesson?
:::

::: answer
The two implementations most likely perform the floating-point additions in a different order — a different loop structure, a different choice of accumulator, or a different use of an intermediate container whose iteration order is not source-identical between the two — and because floating-point addition is not associative, a different summation order can produce a result that differs in the last bit even though both computations are mathematically correct. "Correct" by ordinary testing standards (matching to a reasonable numerical tolerance) is a weaker claim than "bit-exact," and only the latter is what a tight-tolerance majority vote actually requires.
:::

::: check
A team wants to vote across three replicas of a guidance computation that includes a Monte Carlo dispersion check using a pseudo-random number generator. What has to be true about the random number generator across the three replicas for a bit-exact vote over this computation to be meaningful?
:::

::: answer
All three replicas must be seeded identically and must consume the generator's output stream in the identical order and the identical quantity, so that each replica draws exactly the same sequence of pseudo-random numbers as the other two; if any replica seeds independently (for instance, from wall-clock time) or consumes a different number of draws before the point being compared, the replicas will diverge through no fault in the guidance logic itself, in exactly the same way an unconstrained summation order does. In practice this often means treating the random seed itself as a value distributed to all replicas alongside their other inputs, rather than generated locally by each one.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Byzantine fault | A faulty channel presents different values to different consumers of the same data, simultaneously |
| Ordinary (non-Byzantine) fault | The faulty channel's (wrong) value is the same to every consumer |
| Asymmetric divergence | Two honest consumers, each running a correct vote, reach two different answers because their inputs from the faulty channel disagreed |
| Cross-exchange | Consumers compare what they were told about a channel before voting, exposing an inconsistent channel to both at once |
| What cross-exchange guarantees | Consistency of conclusion across consumers — not necessarily a trustworthy value |
| Determinism | Same code, same inputs, same output, every replica, every run |
| Floating-point non-associativity | `(a+b)+c` and `a+(b+c)` can differ in the last bit; summation order must be fixed across replicas for a bit-exact vote to be meaningful |

Lessons 6 and 7 together are this module's first demonstration: what a voter can mask, what it structurally cannot, and what it takes — determinism, and sometimes an extra round of communication — for the vote itself to mean what it claims to mean. The next lessons turn to a different source of failure entirely: radiation striking the silicon the vote runs on, and the watchdog that is supposed to notice when a computer stops running at all.
