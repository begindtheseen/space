---
id: l11-code-verification-and-static-analysis
title: Code verification and static analysis
minutes: 18
covers:
  - 'Code verification: unit, integration and regression tests; statement, branch and MC-DC coverage'
  - 'Static analysis and formal methods: Coverity, Polyspace, model checking with SPIN'
  - Requirements-based testing, and why coverage without requirements-based tests proves very little
---

Everything so far in this module verifies the vehicle: the physics, the dispersions, the margins. None of it verifies that the software computing those margins, flying that guidance law, and making that FDIR decision is itself correct — a perfect Monte Carlo campaign run against flight code with a sign error in it verifies a vehicle that does not exist. This lesson turns to the code directly: what it means to test it thoroughly, what a coverage number does and does not prove, and what the alternative to testing — reasoning about the code without running it at all — can offer instead.

## Three kinds of test, and why regression testing matters most over time

A **unit test** exercises one function or module in isolation, with contrived inputs chosen to probe specific behavior, checked against a known expected output — does this guidance-law function return the correct commanded thrust vector for this specific state. An **integration test** checks that units work correctly together: does the guidance module's output actually reach the control module in the form the control module expects, across the real interface between them, which is where a surprising number of real defects live, since each unit can be individually correct while the connection between them is not. A **regression test** is neither new in method nor new in scope — it is the entire existing test suite, unit and integration together, re-run after every change to confirm that something that used to work still does.

Regression testing is worth calling out on its own because of what happens without it: a codebase that changes constantly, as any flight software program's does, accumulates fixes that quietly break something else unless every past fix is re-verified on every new change. A unit test written once and never run again is documentation, not verification; the value is in running the whole accumulated suite on every commit, which is exactly the continuous-integration practice the next lesson builds out in full.

## Structural coverage: how much of the code was actually exercised

A **coverage** metric measures how much of the code a test suite actually executed, and the three standard levels answer progressively stronger versions of that question. **Statement coverage** is the fraction of executable statements run at least once by the suite — a weak criterion, since a statement can execute correctly on the one input tested and be relied on to handle inputs the suite never tries. **Branch** (or decision) **coverage** is stronger: every branch of every decision — both the true and the false outcome of every `if`, every loop condition — must be taken at least once, which at minimum requires two carefully chosen tests per simple decision rather than one.

Branch coverage, though, can be satisfied by a compound condition without ever showing that each individual piece of it matters. **Modified condition/decision coverage (MC-DC)** closes that gap: for every condition inside a compound decision, the test suite must include a pair of test cases that differ only in that one condition and produce different outcomes for the decision as a whole — direct evidence that the condition is "live" and correctly wired, not merely present in the source. It is the coverage level DO-178C requires at its highest criticality level, and it costs roughly $N+1$ tests for $N$ conditions rather than the $2^N$ a full truth table would need, because a well-chosen set of independence pairs can share test cases across multiple conditions at once.

::: example An FDIR trip condition, exhaustively checked by hand
A fault-detection trip is coded as `TRIP = (A and B) or C` — trip if both a rate-limit flag and a duration flag are set, or if a hard-fault flag is set on its own. The full truth table has $2^3=8$ rows:

| $A$ | $B$ | $C$ | TRIP |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 1 |
| 0 | 1 | 0 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 |

Searching this table for independence pairs — rows differing in exactly one input, with different TRIP outcomes — finds exactly one pair for $A$ (rows $A{=}0,B{=}1,C{=}0$ and $A{=}1,B{=}1,C{=}0$), exactly one for $B$ (rows $A{=}1,B{=}0,C{=}0$ and $A{=}1,B{=}1,C{=}0$), and three candidates for $C$, since toggling $C$ flips the outcome whenever $A\text{ and }B$ is not already true on its own. A set of four test rows — $(0,1,0){\to}0$, $(0,1,1){\to}1$, $(1,0,0){\to}0$, $(1,1,0){\to}1$ — covers an independence pair for every one of the three conditions at once: $N+1=4$ tests against $2^N=8$ for exhaustive coverage, confirming the general rule with an exact count.

Compare this against a minimal **branch-coverage** suite: two tests, one producing TRIP $=0$ and one producing TRIP $=1$ — say $(0,0,0){\to}0$ and $(1,1,0){\to}1$. This satisfies branch coverage completely (the decision has taken both outcomes), yet checking each condition's independence pairs against exactly these two rows shows that **none of the three conditions — not $A$, not $B$, not $C$ — is demonstrated to independently affect the outcome** by this pair. Branch coverage is fully satisfied by a test set that proves nothing about whether any individual condition in the compound decision actually matters.

```python
import itertools

def trip(A, B, C):
    return (A and B) or C

rows = list(itertools.product([False, True], repeat=3))
# ... searching rows for independence pairs per condition (as above) finds
# exactly 1 pair for A, 1 for B, 3 for C, and a 4-row covering set satisfies all three.
# The 2-row branch-coverage set {(F,F,F), (T,T,F)} covers zero of the three.
```
:::

::: key
MC-DC requires, for every condition in a compound decision, a pair of tests differing only in that condition with different outcomes — proof the condition is live, not merely present. It costs about $N+1$ tests for $N$ conditions rather than $2^N$, and a test set satisfying branch coverage alone can satisfy MC-DC for none of the conditions at all, exactly as the worked trip-logic example showed.
:::

## Static analysis and formal methods: verifying without running the code

Every technique so far runs the code against chosen inputs. **Static analysis** instead examines the source directly, without executing it, reasoning about the set of all possible executions at once rather than one input at a time. Tools in this category — Coverity and Polyspace are the industrial names most commonly encountered in a flight-software setting — use abstract interpretation and related techniques to flag classes of defect that a specific test input might never happen to trigger: a null-pointer dereference reachable only on an error path nobody wrote a test for, an array index that can exceed its bound under some combination of inputs no test enumerated, an integer computation that can silently overflow, a variable read before it is ever written on some path through the code. The strength of static analysis is exactly that it does not need a triggering input to be constructed by a human first — it explores the reachable behavior symbolically; the weakness is that abstract reasoning over all possible executions is inherently conservative, so a real static analyzer reports some number of **false positives**, flagged issues that closer inspection shows cannot actually occur, alongside genuine defects, and triaging that output is real engineering work in its own right.

**Model checking** goes a step further for a specific, important class of software: state machines and concurrent logic, exactly the shape of a vehicle's mode-management logic — prelaunch, ascent, coast, entry, landing, safe, and the transitions between them. A tool such as **SPIN** takes a formal model of the state machine's behavior and a property to check — "the vehicle can never be simultaneously in SAFE and ARMED," "every path out of ABORT eventually reaches a terminal state" — and **exhaustively explores every reachable state and every interleaving of concurrent events** to either prove the property holds in all of them or produce a specific counterexample trace showing exactly how it fails. This is a fundamentally different guarantee than testing offers: a test suite, however large, samples specific executions, while a model checker proves a property across the entire reachable state space at once. The cost is **state-space explosion** — the number of reachable states can grow far faster than the size of the model itself, particularly with several concurrent processes, which limits model checking in practice to a carefully abstracted model of the logic rather than the full flight code verbatim, meaning the proof is only as trustworthy as the abstraction's fidelity to what the code actually does.

::: warning A proof about the model is not automatically a proof about the code
Model checking proves a property of the *formal model* fed into the tool, exhaustively and with mathematical certainty — but only of that model. If the abstraction used to build the model omits a real interaction the actual flight code contains, the proof says nothing about that interaction, however rigorous the proof itself is. The model has to be kept faithful to the code it represents, usually by generating it from the same source or by an explicit, reviewed mapping between them, or the exhaustive guarantee is a guarantee about the wrong artifact.
:::

## The coverage caveat: adequacy is not correctness

Every coverage number in this lesson — statement, branch, MC-DC — measures **test adequacy**: how much of the code's structure a test suite exercised. None of them measures **correctness**: whether the code, when exercised, actually did what the requirements say it should. A test can execute every statement, take every branch, and satisfy every MC-DC independence pair while asserting almost nothing about the values the code actually produced, and a test suite built that way can reach one hundred percent coverage on code containing a real, uncaught defect.

::: example A fully covered function with a bug none of its tests catch
A `clamp` function is meant to return `lo` when the input is below range, `hi` when above, and the input unchanged otherwise. A coverage-chasing test suite exercises all three branches but checks only that a value comes back, not which value:

```python
def clamp_buggy(x, lo, hi):
    if x < lo:
        return lo
    elif x > hi:
        return hi + 1          # an injected off-by-one defect
    else:
        return x

def weak_suite(fn):
    assert fn(-5, 0, 10) is not None
    assert fn(15, 0, 10) is not None
    assert fn(5, 0, 10) is not None
    return "PASS"

def requirements_suite(fn):
    assert fn(-5, 0, 10) == 0,  "below range must clamp to lo"
    assert fn(15, 0, 10) == 10, "above range must clamp to hi"
    assert fn(5, 0, 10) == 5,   "in range must pass through unchanged"
    return "PASS"

print(weak_suite(clamp_buggy))           # PASS -- 100% branch coverage, bug undetected
print(requirements_suite(clamp_buggy))   # AssertionError: above range must clamp to hi
```

The weak suite achieves full statement and branch coverage on the buggy function and reports a clean pass, because it never checks the actual returned value against what the specification requires — only that the high branch executed at all. The requirements-based suite, checking the exact value the specification demands at each boundary, catches the defect immediately. Both suites exercise identical code paths; only the second one verifies anything.
:::

The correct order of work follows directly: **write tests from the requirements first** — one or more tests per requirement, each with a real assertion checking the specific behavior that requirement demands — and only then **measure structural coverage** to find what the requirements-based tests failed to reach. A gap found this way is informative in either of two ways: it reveals a code path with no requirement driving a test for it, which needs either a missing requirement written and tested, or an explanation for why that path exists at all; or it reveals dead code that no requirement calls for, which is a candidate for removal rather than for a coverage-chasing test that would only paper over its absence of purpose. Writing tests to chase a coverage number directly, without requirements behind them, inverts this order and produces exactly the weak suite above: tests that assert whatever the code currently does rather than what it is required to do, which is indistinguishable from no verification at all the moment a real defect is introduced.

## Check yourself

::: check
Distinguish a unit test, an integration test, and a regression test, and explain why regression testing matters more as a codebase ages.
:::

::: answer
A unit test exercises one function or module in isolation against a known expected output; an integration test checks that separately correct units work together correctly across their real interfaces. A regression test is the accumulated suite of both, re-run after every change. Regression testing matters increasingly over time because each new change risks silently breaking something that used to work, and without re-running every previous test on every new change, a fix made months ago has no ongoing guarantee it is still in effect — the suite is what turns a one-time check into a standing guarantee.
:::

::: check
A test suite achieves 100% branch coverage on a three-condition compound decision using only two test cases. Explain why this does not imply MC-DC coverage, using the trip-logic example from this lesson.
:::

::: answer
Branch coverage only requires the overall decision to take both its true and false outcomes at least once, which two well-chosen test cases can satisfy regardless of whether any individual condition's effect was ever isolated. In the worked trip-logic example, the two-test branch-coverage set $(0,0,0)\to0$ and $(1,1,0)\to1$ satisfied branch coverage completely while providing zero independence pairs for any of the three conditions — none of $A$, $B$ or $C$ was shown to independently change the outcome, which is exactly what MC-DC additionally requires and branch coverage does not.
:::

::: check
What does static analysis verify that testing cannot, and what is the corresponding cost that comes with that strength?
:::

::: answer
Static analysis reasons about the set of all possible executions of the code at once, symbolically, so it can flag a defect reachable only on a path or input combination that no human ever wrote a specific test for — a null dereference on a rare error path, an overflow under an untested combination of inputs. The cost is that this conservative, exhaustive-style reasoning produces false positives, flagged issues that turn out, on inspection, not to be reachable or not to be real defects, so the tool's output requires real engineering triage rather than being trusted at face value.
:::

::: check
A model checker like SPIN proves that a mode-management state machine can never enter an illegal state combination. A reviewer asks whether this proves the flight software itself is free of that defect. What is the correct answer?
:::

::: answer
Not automatically: the model checker's proof applies to the formal model given to the tool, exhaustively and with certainty, but only to that model — if the abstraction used to build the model leaves out a real interaction the actual flight code contains, the proof says nothing about that interaction. The proof is trustworthy about the code itself only to the extent the model is kept faithful to it, typically through generating the model from the same source or maintaining an explicit, reviewed correspondence between them.
:::

::: check
A team reports "100% MC-DC coverage" on the flight guidance module as evidence the module is correct. Evaluate this claim.
:::

::: answer
The claim conflates adequacy with correctness. MC-DC coverage measures how thoroughly the test suite exercised the code's structure — specifically, that every condition in every compound decision was shown to independently affect its outcome — but it says nothing about whether the values the code produced when exercised were the values the requirements actually call for, exactly as the `clamp` example demonstrated with full branch coverage on a defective function. Correctness evidence requires the tests to be built from the requirements with real assertions checking required behavior; 100% MC-DC on a suite of weak assertions is a measure of thoroughness applied to a suite that never checked anything.
:::

## Summary

| Item | Statement |
| --- | --- |
| Unit / integration / regression | One module in isolation; modules together across their interfaces; the accumulated suite re-run on every change |
| Statement coverage | Every executable statement run at least once — weak, says nothing about the values produced |
| Branch coverage | Every branch outcome of every decision taken at least once |
| MC-DC | Each condition in a compound decision shown, by an independence pair, to independently affect the outcome; about $N+1$ tests for $N$ conditions |
| Static analysis (Coverity, Polyspace) | Reasons about all possible executions without running the code; catches untested-path defects, at the cost of false positives requiring triage |
| Model checking (SPIN) | Exhaustively proves or disproves a property over a formal model's entire reachable state space; only as trustworthy as the model's fidelity to the real code |
| The coverage caveat | Coverage measures test adequacy, never correctness; write requirements-based tests first, then use coverage to find what they missed |

Coverage and correctness are properties of the software examined in isolation; the next lesson puts that verified code, and the reduced and full campaigns this module has built, into the process that actually runs them on every change a program makes — and the still-broader discipline of testing the vehicle the way it will actually fly.
