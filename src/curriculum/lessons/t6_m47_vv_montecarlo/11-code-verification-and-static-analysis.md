---
id: l11-code-verification-and-static-analysis
title: Code verification and static analysis
minutes: 21
covers:
  - 'Code verification: unit, integration and regression tests; statement, branch and MC-DC coverage'
  - 'Static analysis and formal methods: Coverity, Polyspace, model checking with SPIN'
  - Requirements-based testing, and why coverage without requirements-based tests proves very little
---

Imagine a calculator with one tiny fault: its minus key sometimes adds. You could do a perfect job of your math homework on it — every method right, every step written out — and still hand in wrong answers. Your work was flawless. The tool was not.

Everything so far in this module checks the vehicle: the physics, the dispersions, the margins. None of it checks that the software doing that work is right. The code computes the margins, flies the guidance law, and makes the fault decisions. A perfect Monte Carlo campaign run against flight code with a sign error in it verifies a vehicle that does not exist.

This lesson turns to the code itself. You will see three kinds of test, three ways to measure how much of the code the tests touched, what those measurements do and do not prove, and two ways to check code without running it at all.

## Three kinds of test

Think of building a bicycle. First you check each part on its own: does the brake lever pull, does the wheel spin true? Then you check that parts work together: when you pull the lever, does the brake on the wheel actually grip? Finally, every time you change anything — new tires, a new chain — you run through the whole checklist again, because the new chain might rub the old derailleur.

Software testing has the same three layers.

- A **unit test** exercises one function or module on its own. It feeds in chosen inputs and checks the output against a known right answer. Does this guidance function return the correct thrust direction for this exact state?
- An **integration test** checks that units work together across the real connection between them. Does the guidance module's output reach the control module in the form the control module expects? A surprising number of real defects live here. Each unit can be correct on its own while the connection between them — units, signs, timing, which axis is which — is wrong.
- A **regression test** is not a new kind of test. It is the whole existing suite, unit and integration together, re-run after every change to confirm that what used to work still works. (A "regression" is a step backward.)

Regression testing deserves its own name because of what happens without it. Flight software changes constantly. Each fix can quietly break something else. Unless every past fix is re-checked on every new change, the old fixes have no ongoing guarantee. A unit test written once and never run again is documentation, not verification. The value is in running the whole growing suite on every commit — the continuous-integration practice the next lesson builds out.

## Coverage: how much of the code did the tests touch?

Picture a teacher checking homework by flipping through to see that every page has ink on it. Every page was touched. That tells her nothing about whether the answers are right — but it does tell her if a page was skipped.

A **coverage** metric is that page-flip for code. It measures how much of the code a test suite actually ran. There are three standard levels, each a stronger version of the question.

**Statement coverage** is the fraction of lines (statements) that ran at least once. It is weak. A line can run correctly on the one input tried and then fail on inputs nobody tried.

**Branch coverage**, also called decision coverage, is stronger. Every decision — every `if`, every loop condition — must go both ways at least once: once true, once false. So each simple decision needs at least two well-chosen tests.

### When one decision hides several conditions

Branch coverage has a blind spot. A **compound decision** combines several yes-or-no **conditions** with `and` and `or`, such as `(A and B) or C`. Branch coverage only asks that the whole thing come out true once and false once. It never asks whether each piece matters.

Think of a lamp wired to several switches. You want proof that each switch really does something. The fair test is: hold every other switch still, flip just this one, and watch the lamp change. If it changes, that switch is live and wired the right way.

**Modified condition/decision coverage**, **MC-DC**, demands exactly that for code. For every condition inside a compound decision, the test suite must contain an **independence pair**: two tests that differ only in that one condition and give different results for the whole decision. That is direct evidence the condition is live, not just present in the source.

MC-DC is the coverage level required by **[[DO-178C|do-178c]]**, the aviation software standard, at its highest criticality level. It costs about $N+1$ tests for $N$ conditions (never more than $2N$), instead of the $2^N$ a full table of every combination needs. The saving comes because one well-chosen test can serve in the pairs of several conditions at once.

::: key
MC-DC (modified condition/decision coverage): each condition in a compound decision must be shown to independently change the outcome, by a pair of tests that differ only in that condition. Costs between $N+1$ and $2N$ tests for $N$ conditions instead of $2^N$. Required at the highest DO-178C level. A test set that satisfies branch coverage can satisfy MC-DC for none of its conditions.
:::

::: example A fault-detection trip, checked by hand
A **[[fault-detection|fdir]]** trip is coded as `TRIP = (A and B) or C`. In words: trip if both a rate-limit flag $A$ and a duration flag $B$ are set, or if a hard-fault flag $C$ is set on its own. (Here $1$ means "set" or "true" and $0$ means "not set".) It is the lamp with [[three switches|trip-circuit]].

**Step 1: the full table.** Three conditions give $2^3 = 8$ rows.

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

**Step 2: find the independence pairs.** Look for two rows that differ in exactly one input and have different TRIP values.

- For $A$ there is exactly one pair: $(0,1,0)\to0$ and $(1,1,0)\to1$. Flipping $A$ only matters when $B$ is set and $C$ is not.
- For $B$ there is exactly one pair: $(1,0,0)\to0$ and $(1,1,0)\to1$. By the same logic, $A$ must be set and $C$ not.
- For $C$ there are three pairs. Flipping $C$ changes the result whenever "$A$ and $B$" is not already true on its own: when $(A,B)$ is $(0,0)$, $(0,1)$ or $(1,0)$.

**Step 3: pick a small set that covers all three.** Take four rows: $(0,1,0)\to0$, $(0,1,1)\to1$, $(1,0,0)\to0$, $(1,1,0)\to1$. Check it. $A$'s pair is rows one and four. $B$'s pair is rows three and four. $C$'s pair is rows one and two. So four tests cover all three conditions: $N+1 = 4$, against $2^N = 8$ for the full table.

**Step 4: compare with branch coverage.** A minimal branch-coverage suite needs one test giving TRIP $=0$ and one giving TRIP $=1$ — say $(0,0,0)\to0$ and $(1,1,0)\to1$. The decision has gone both ways, so branch coverage is complete. But these two rows differ in two conditions at once, $A$ and $B$. So they form no independence pair for anything. **None of the three conditions — not $A$, not $B$, not $C$ — is shown to matter.** Branch coverage is fully met by a test set that proves nothing about any single condition.

**Sanity check.** Could $C$ be wired backwards and still pass that two-test suite? Yes: $C$ was $0$ in both tests, so its effect was never seen. That is exactly the kind of fault MC-DC exists to catch.

The same search, done by a short program:

```python
import itertools

def trip(A, B, C):
    return (A and B) or C

rows = list(itertools.product([0, 1], repeat=3))

def pairs(rows, k):
    """Independence pairs for condition k: rows differing only in k, with different outcomes."""
    out = []
    for r in rows:
        if r[k] == 0:
            s = list(r); s[k] = 1; s = tuple(s)
            if s in rows and trip(*r) != trip(*s):
                out.append((r, s))
    return out

for k, name in enumerate("ABC"):
    print(name, len(pairs(rows, k)), "pair(s) in the full table")

four = [(0, 1, 0), (0, 1, 1), (1, 0, 0), (1, 1, 0)]
two = [(0, 0, 0), (1, 1, 0)]
for label, tests in [("4-row set", four), ("2-row branch set", two)]:
    shown = [n for k, n in enumerate("ABC") if pairs(tests, k)]
    print(label, "shows independence for:", shown or "none")
# A 1 pair(s) in the full table
# B 1 pair(s) in the full table
# C 3 pair(s) in the full table
# 4-row set shows independence for: ['A', 'B', 'C']
# 2-row branch set shows independence for: none
```
:::

## Checking code without running it

Every technique so far runs the code on chosen inputs. That is like checking a bridge by driving trucks over it: you learn about the trucks you drove. An engineer reading the blueprint can find a weak beam no truck has touched yet.

**Static analysis** is the blueprint check. The tool reads the source code without running it, and reasons about all possible runs at once instead of one input at a time. The industrial names you will meet most in flight software are **Coverity** and **Polyspace**. Using **[[abstract interpretation|abstract-interpretation]]** and related methods, they flag whole classes of defect that a particular test might never trigger:

- a **null-pointer dereference** — the code follows an address that points at nothing — reachable only on an error path nobody wrote a test for;
- an array index that can run past the end of the array under some mix of inputs no test listed;
- an **[[integer overflow|overflow]]**, where a number grows too big for its storage and silently wraps around;
- a variable read before anything was ever written to it, on some path through the code.

The strength is that nobody has to invent the triggering input first; the tool explores what can happen on its own. The weakness is that reasoning about every possible run has to be cautious. So a real analyzer also reports **false positives**: warnings that, on closer look, cannot actually happen. Sorting real defects from false alarms — **triage** — is real engineering work in its own right.

### Model checking: trying every move

Think of tic-tac-toe. It is small enough that a computer can play out every possible game and prove that neither side can force a win. It does not sample some games; it checks them all.

**Model checking** does this for a special and important kind of software: **state machines** and concurrent logic. A state machine is a program that is always in one of a fixed list of modes and moves between them by rules. That is exactly the shape of a vehicle's mode manager: prelaunch, ascent, coast, entry, landing, safe, and the transitions between them.

A tool such as **[[SPIN|spin-story]]** takes a formal model of the state machine and a property to check. For example, "the vehicle can never be in SAFE and ARMED at the same time", or "every path out of ABORT eventually reaches a final state". It then **explores every reachable state and every order in which concurrent events could happen**. Either it proves the property holds in all of them, or it hands back a **counterexample**: the exact sequence of steps that breaks it.

That is a different kind of guarantee from testing. A test suite, however big, samples particular runs. A model checker proves a property over the entire set of reachable states. The price is **[[state-space explosion|state-explosion]]**: the number of reachable states can grow far faster than the model itself, especially with several processes running at once. So in practice the tool checks a carefully simplified model of the logic, not the full flight code line for line. The proof is only as trustworthy as that simplification is faithful.

::: warning A proof about the model is not automatically a proof about the code
Model checking proves a property of the *model* fed to the tool — completely, with mathematical certainty, but only of that model. If the simplification left out a real interaction that the flight code contains, the proof says nothing about it, however rigorous it is. Keep the model faithful to the code, usually by generating it from the same source or by a written, reviewed mapping between the two. Otherwise the exhaustive guarantee is about the wrong thing.
:::

## The coverage caveat: touched is not tested

Back to the teacher flipping pages. Ink on every page means every page was touched. It does not mean one answer is right.

Every coverage number in this lesson — statement, branch, MC-DC — measures **test adequacy**: how much of the code's structure the tests exercised. None of them measures **correctness**: whether the code, when it ran, did what the requirements say. A test can run every line, take every branch, and satisfy every independence pair while checking almost nothing about the values the code produced. A suite built that way can reach $100\%$ coverage on code with a real bug in it.

::: key
The coverage caveat: coverage measures test adequacy, never correctness. Write requirements-based tests first, then measure coverage to find what the requirements missed. Tests written to chase a coverage number assert whatever the code already does.
:::

::: example A fully covered function with a bug its tests miss
A `clamp` function should return `lo` when the input is below the range, `hi` when it is above, and the input unchanged otherwise. Someone has slipped in an **[[off-by-one|off-by-one]]** bug on the high side. Two test suites run it:

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

print(weak_suite(clamp_buggy))            # PASS -- every branch run, bug missed
try:
    print(requirements_suite(clamp_buggy))
except AssertionError as e:
    print("FAIL:", e)                     # FAIL: above range must clamp to hi
```

**What the weak suite did.** Its three inputs, $-5$, $15$ and $5$, send the code down all three branches. So it has full statement and branch coverage. But it only checks that *something* came back, never *what*. The high branch returned $11$ instead of $10$, and the suite said PASS.

**What the requirements suite did.** It ran the very same three inputs down the very same three paths. The difference is that each test checks the exact value the specification demands. The high-side check expects $10$, gets $11$, and fails at once with a message naming the broken requirement.

**Sanity check.** Both suites have identical coverage. Only one of them verifies anything.
:::

So the right order of work is:

1. **Write tests from the requirements first.** At least one test per requirement, each with a real check of the exact behavior that requirement demands.
2. **Then measure structural coverage**, to find what those tests did not reach.

A gap found this way tells you something either way. It may be a code path that no requirement drives. Then either a requirement is missing — write it and test it — or someone must explain why that path exists. Or it may be **dead code** that nothing calls for, which is a candidate for deletion, not for a test written only to touch it.

Writing tests to chase a coverage number turns this order upside down. It produces exactly the weak suite above: tests that record whatever the code happens to do right now, not what it is required to do. The moment a real bug arrives, such a suite is no better than none.

## Check yourself

::: check
Tell apart a unit test, an integration test and a regression test, and explain why regression testing matters more as a codebase gets older.
:::

::: answer
A unit test runs one function or module on its own and checks it against a known right answer. An integration test checks that units which are each correct also work together across their real connections. A regression test is the whole accumulated suite of both, re-run after every change. It matters more with age because every new change can silently break something that used to work. Without re-running every earlier test on every change, a fix made months ago has no ongoing guarantee it still holds. The suite turns a one-time check into a standing one.
:::

::: check
A test suite reaches $100\%$ branch coverage on a three-condition compound decision with only two tests. Using the trip-logic example, explain why this does not give MC-DC.
:::

::: answer
Branch coverage only asks the whole decision to come out true once and false once. Two tests can do that without ever isolating any single condition's effect. In the trip example, the tests $(0,0,0)\to0$ and $(1,1,0)\to1$ complete branch coverage, but they differ in both $A$ and $B$ at once, and $C$ is $0$ in both. So they form no independence pair for any condition. None of $A$, $B$ or $C$ is shown to change the outcome by itself — which is exactly what MC-DC adds.
:::

::: check
A decision has five conditions joined by `and` and `or`. About how many tests does MC-DC need, and how many would a full table of every combination need?
:::

::: answer
MC-DC needs about $N+1 = 5+1 = 6$ tests (and never more than $2N = 10$), because each test can serve in the independence pairs of several conditions. A full table of every combination needs $2^5 = 32$ tests. The gap grows fast: at ten conditions it is about $11$ against $1{,}024$.
:::

::: check
What can static analysis find that testing cannot, and what is the price of that strength?
:::

::: answer
Static analysis reasons about all possible runs of the code at once, without running it. So it can flag a defect that only happens on a path or input mix nobody wrote a test for — a null-pointer dereference on a rare error path, an overflow under an untried combination of inputs. The price is that this cautious, all-runs reasoning also produces false positives: warnings that turn out, on inspection, not to be reachable or not to be real defects. Its output needs engineering triage; it cannot be trusted at face value.
:::

::: check
SPIN proves that a mode-manager state machine can never enter an illegal pair of states. A reviewer asks whether this proves the flight software itself is free of that defect. What is the right answer?
:::

::: answer
Not automatically. The proof holds, completely and with certainty, for the formal model given to the tool — and only for that model. If the simplification used to build the model left out a real interaction that the flight code contains, the proof says nothing about that interaction. It speaks about the real code only as far as the model is kept faithful to it, usually by generating the model from the same source or keeping a written, reviewed mapping between the two.
:::

::: check
A team reports "$100\%$ MC-DC coverage" on the guidance module as evidence that the module is correct. Judge the claim.
:::

::: answer
It mixes up adequacy and correctness. MC-DC measures how thoroughly the tests exercised the code's structure — that every condition in every compound decision was shown to change its outcome. It says nothing about whether the values produced were the values the requirements call for, as the `clamp` example showed with full branch coverage on a buggy function. Evidence of correctness needs tests built from the requirements, with real checks of required behavior. Full MC-DC on a suite of weak checks measures how thoroughly a suite that checked nothing was run.
:::

## Summary

| Item | Statement |
| --- | --- |
| Unit / integration / regression | One module on its own; modules together across their connections; the whole suite re-run on every change |
| Statement coverage | Every line run at least once — weak, says nothing about the values produced |
| Branch coverage | Every decision taken both ways at least once |
| MC-DC | Each condition in a compound decision shown, by an independence pair, to change the outcome by itself; about $N+1$ tests for $N$ conditions instead of $2^N$ |
| Static analysis (Coverity, Polyspace) | Reasons about all possible runs without running the code; finds untested-path defects, at the cost of false positives to triage |
| Model checking (SPIN) | Proves or disproves a property over every reachable state of a formal model; only as trustworthy as the model's faithfulness to the code |
| The coverage caveat | Coverage measures test adequacy, never correctness; write requirements-based tests first, then use coverage to find what they missed |

Coverage and correctness are properties of the software on its own. The next lesson puts that code, and the reduced and full campaigns this module has built, into the process that runs them on every change — and into the wider habit of testing the vehicle the way it will fly.

::: context do-178c The rulebook for airplane software
**DO-178C** is the standard that aviation authorities such as the FAA use to approve software on airplanes. It sorts software into levels, A to E, by how bad a failure would be. Level A is software whose failure could be catastrophic, such as flight controls; it must meet the most objectives, including MC-DC. Spacecraft programs are not bound by it, but many borrow its ideas, and "MC-DC" as a term comes from this family of aviation standards.
:::

::: context fdir Noticing trouble and doing something about it
**FDIR** stands for fault detection, isolation and recovery: the flight software that watches for something going wrong, works out which part failed, and switches to a backup or a safe mode. Its trip logic is full of compound decisions like `(A and B) or C`, because a single flag is often too jumpy to trust alone. A trip that never fires, or fires on the wrong condition, can lose a vehicle — which is why this logic gets the strictest coverage.
:::

::: context trip-circuit The trip logic as a light switch circuit
`(A and B) or C` is a lamp with two switches in a row and a third on a bypass. Current flows if both $A$ and $B$ are closed, or if $C$ is closed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="45" x2="80" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <line x1="80" y1="45" x2="110" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="80" cy="45" r="3" fill="#1f2a44"/><circle cx="112" cy="45" r="3" fill="#1f2a44"/>
  <text x="95" y="22" font-size="12" fill="#1d6fd1" text-anchor="middle">A</text>
  <line x1="112" y1="45" x2="160" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <line x1="160" y1="45" x2="190" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="160" cy="45" r="3" fill="#1f2a44"/><circle cx="192" cy="45" r="3" fill="#1f2a44"/>
  <text x="175" y="22" font-size="12" fill="#1d6fd1" text-anchor="middle">B</text>
  <line x1="192" y1="45" x2="260" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <line x1="50" y1="45" x2="50" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="50" y1="100" x2="120" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="100" x2="150" y2="85" stroke="#b4232c" stroke-width="3"/>
  <circle cx="120" cy="100" r="3" fill="#1f2a44"/><circle cx="152" cy="100" r="3" fill="#1f2a44"/>
  <text x="135" y="125" font-size="12" fill="#b4232c" text-anchor="middle">C</text>
  <line x1="152" y1="100" x2="230" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="230" y1="100" x2="230" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="285" cy="45" r="22" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="285" y="49" font-size="11" fill="#1f2a44" text-anchor="middle">TRIP</text>
  <line x1="307" y1="45" x2="340" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <text x="20" y="35" font-size="11" fill="#6c7a93">in</text>
  <text x="340" y="35" font-size="11" fill="#6c7a93" text-anchor="end">out</text>
</svg>
```

Now the independence pairs make sense. Flipping $A$ only changes the lamp when $B$ is closed and the bypass $C$ is open.
:::

::: context abstract-interpretation Reasoning with ranges instead of numbers
Instead of running the code with $x = 3$, **abstract interpretation** runs it with "$x$ is somewhere from $0$ to $8$" and tracks how that range flows through each line. If an index into an eight-slot array can reach $8$, the tool warns, because the slots are numbered $0$ to $7$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="30" y="20" width="32" height="30"/><rect x="62" y="20" width="32" height="30"/>
    <rect x="94" y="20" width="32" height="30"/><rect x="126" y="20" width="32" height="30"/>
    <rect x="158" y="20" width="32" height="30"/><rect x="190" y="20" width="32" height="30"/>
    <rect x="222" y="20" width="32" height="30"/><rect x="254" y="20" width="32" height="30"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="46" y="40">0</text><text x="78" y="40">1</text><text x="110" y="40">2</text><text x="142" y="40">3</text>
    <text x="174" y="40">4</text><text x="206" y="40">5</text><text x="238" y="40">6</text><text x="270" y="40">7</text>
  </g>
  <rect x="30" y="62" width="256" height="12" fill="#8fb8f0"/>
  <rect x="286" y="62" width="32" height="12" fill="#b4232c"/>
  <text x="302" y="44" font-size="11" fill="#b4232c" text-anchor="middle">8?</text>
  <text x="158" y="96" font-size="11" fill="#1f2a44" text-anchor="middle">possible index: 0 to 8 — the last value runs off the end</text>
</svg>
```

Ranges are cautious: sometimes the real code could never reach $8$, and the warning is a false positive.
:::

::: context overflow When a number runs out of room
A computer stores an integer in a fixed number of bits. A 16-bit signed integer holds $-32{,}768$ to $32{,}767$. Push past the top and the value wraps or, in some languages, the program raises an error. On Ariane 5's first flight in 1996, a velocity-related value was converted into a 16-bit integer, was too big to fit, and the error shut down the inertial reference system; the rocket broke up about 40 seconds after liftoff. Finding every conversion that can overflow is exactly the job static analyzers are built for.
:::

::: context spin-story A model checker that flew
**SPIN** was written by Gerard Holzmann at Bell Labs, starting in the 1980s, to check communication protocols; Holzmann later led a software reliability lab at NASA's Jet Propulsion Laboratory. In the late 1990s, NASA researchers used SPIN on the control software for Deep Space 1's Remote Agent and found concurrency errors. During the 1999 flight experiment the software deadlocked in a part that had not been model-checked, with the same kind of error — a sharp reminder that the proof covers only what was modelled.
:::

::: context state-explosion Why the number of states blows up
Two processes running side by side, each with $4$ states, can be in $4 \times 4 = 16$ combined states. Three processes with $10$ states each give $10^3 = 1{,}000$. Add each variable and each message queue, and the product explodes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="47">P1</text><text x="30" y="72">P1</text><text x="30" y="97">P1</text><text x="30" y="122">P1</text>
    <text x="75" y="22">P2</text><text x="100" y="22">P2</text><text x="125" y="22">P2</text><text x="150" y="22">P2</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="63" y="32" width="24" height="24"/><rect x="88" y="32" width="24" height="24"/><rect x="113" y="32" width="24" height="24"/><rect x="138" y="32" width="24" height="24"/>
    <rect x="63" y="57" width="24" height="24"/><rect x="88" y="57" width="24" height="24"/><rect x="113" y="57" width="24" height="24"/><rect x="138" y="57" width="24" height="24"/>
    <rect x="63" y="82" width="24" height="24"/><rect x="88" y="82" width="24" height="24"/><rect x="113" y="82" width="24" height="24"/><rect x="138" y="82" width="24" height="24"/>
    <rect x="63" y="107" width="24" height="24"/><rect x="88" y="107" width="24" height="24"/><rect x="113" y="107" width="24" height="24"/><rect x="138" y="107" width="24" height="24"/>
  </g>
  <text x="112" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">4 × 4 = 16 combined states</text>
  <text x="200" y="60" font-size="12" fill="#1f2a44">3 processes × 10 states</text>
  <text x="200" y="80" font-size="12" fill="#b4232c">= 1,000 states</text>
  <text x="200" y="110" font-size="12" fill="#1f2a44">5 processes × 10 states</text>
  <text x="200" y="130" font-size="12" fill="#b4232c">= 100,000 states</text>
</svg>
```

That is why engineers check a simplified model of the mode logic rather than the whole program.
:::

::: context off-by-one The most common bug in the world
An **off-by-one** error is being wrong by exactly one: using `<` where `<=` was meant, counting from $1$ when the list counts from $0$, or returning `hi + 1` instead of `hi`. Picture a fence 10 meters long with a post every meter: it needs $11$ posts, not $10$. These bugs love boundaries, which is why requirements-based tests aim right at them — the value just below, at, and just above each limit.
:::
