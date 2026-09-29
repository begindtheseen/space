---
id: l03-coverage
title: 'Coverage: what your tests never touched'
minutes: 23
covers:
  - 'Simulink Coverage: decision, condition, MC/DC, lookup-table, signal-range and relational-boundary coverage'
  - Interpreting missing coverage as a missing test or as dead logic
---

A building inspector walks through a new house with a floor plan and a pen. Every room she enters, she ticks on the plan. At the end, some rooms have no tick. That does not mean those rooms are broken. It means nobody looked. Either she forgot them, and must go back, or the plan shows a room that cannot be reached at all, a door that opens onto a wall, and that is a problem with the house.

The previous lesson built tests that run themselves: harnesses, test sequences, assessments, baseline and equivalence tests. Every one of them can pass and still leave parts of the model unexercised. **Coverage** is the inspector's floor plan: a measurement of which parts of the design your tests actually made happen. **Simulink Coverage** is the MathWorks product that records it while your tests run, block by block and transition by transition, and reports the percentage exercised along with a list of exactly what was missed.

Coverage does not tell you the model is right. The assessments do that. Coverage tells you where your assessments had a chance to catch a mistake and where they never did. For flight software this is not optional. The civil aviation standard **[[DO-178C|do-178c]]** requires structural coverage evidence for software whose failure could hurt people, and the most critical software must reach the strictest kind, MC/DC, which this lesson builds up to.

## Decisions and conditions

Two words carry the whole lesson.

A **decision** is a yes-or-no question whose answer chooses what the logic does next. In a model, a Switch block asks one ("is the control input above the threshold?"), an If block asks one, a Saturation block asks whether the input is above the upper limit and whether it is below the lower one, and each Stateflow transition asks whether its guard is true.

A **condition** is one of the simple yes-or-no pieces a decision is built from, with no AND, OR or NOT inside it. The decision $(a \land b) \lor c$, read "a and b, or c", has three conditions: $a$, $b$ and $c$. In code it is written `(a && b) || c`. In a model, the conditions are the inputs to [[Logical Operator blocks|logical-operator]], or the pieces of a Stateflow guard.

Here is a guard from a launch-vehicle mode manager, the kind you built in the previous module:

$$
\text{abort} = (\text{pressure\_low} \land \text{past\_liftoff}) \lor \text{range\_safety\_cmd}.
$$

Abort if the chamber pressure is low after liftoff, or if the range safety officer commands it. It has exactly the shape $(a \land b) \lor c$, and it is the running example for the rest of the lesson.

## Decision and condition coverage

**Decision coverage** asks: has every decision taken every one of its outcomes? For a two-way decision, each must have been true in at least one test and false in at least one test. The percentage is outcomes seen divided by outcomes possible.

**Condition coverage** asks the same about each condition: has every condition been true at least once and false at least once?

::: example Two tests, and what they cover
Run the abort guard with two tests, writing each as $(a, b, c)$ with 1 for true and 0 for false:

- Test 1: $(1, 1, 1)$. Then $a \land b = 1$, and $1 \lor 1 = 1$. Abort is true.
- Test 2: $(0, 0, 0)$. Then $a \land b = 0$, and $0 \lor 0 = 0$. Abort is false.

**Decision coverage.** The decision was true once and false once. 2 of 2 outcomes: 100%.

**Condition coverage.** $a$ was 1 in test 1 and 0 in test 2. So were $b$ and $c$. 6 of 6 condition outcomes: 100%.

**But look closer.** In test 1, would abort still be true if $a$ were false? Yes: $c = 1$ carries it alone. So test 1 never showed that $a$ matters. Would it change if $c$ were false? No, $a \land b = 1$ carries it. The two tests flipped every condition at once, so they cannot say which condition caused the answer to change.

**Sanity check.** Imagine a bug that wired the guard as $c$ alone, dropping $a \land b$. Test 1 gives $c = 1$, abort true, correct. Test 2 gives $c = 0$, abort false, correct. Both tests pass on a guard that would never abort on low pressure. 100% decision and condition coverage missed a lethal bug.
:::

## MC/DC: each condition must prove it matters

**Modified condition/decision coverage (MC/DC)** closes exactly that gap. Beyond every decision taking every outcome and every condition taking every value, it requires that **each condition be shown to independently affect the decision's outcome**. That means finding, for each condition, two tests that differ *only* in that condition and give *different* outcomes. Such a pair is called an **independence pair**.

::: key
What does MC/DC require beyond decision coverage? That each condition in a decision has been shown to independently affect the outcome, holding the others fixed. Decision coverage only needs the decision to have been both true and false, which a single condition can achieve on its own.
:::

For a small decision you can find the pairs by listing all input rows. With three conditions there are $2^3 = 8$ rows. The short Python script below does it for $(a \land b) \lor c$: it tries every pair of rows that differ in one condition, keeps the pairs where the outcome changes, then searches for the smallest set of tests that contains a pair for every condition.

```python
from itertools import product, combinations

def decision(a, b, c):
    return (a and b) or c

rows = list(product([0, 1], repeat=3))           # all 8 input rows
names = "abc"

# Independence pairs: rows differing in ONE condition whose outcomes differ
pairs = {n: [] for n in names}
for r1, r2 in combinations(rows, 2):
    diff = [i for i in range(3) if r1[i] != r2[i]]
    if len(diff) == 1 and decision(*r1) != decision(*r2):
        pairs[names[diff[0]]].append((r1, r2))
for n in names:
    print(n, pairs[n])

# Smallest test set that contains a pair for every condition
for size in range(1, 9):
    found = [s for s in combinations(rows, size)
             if all(any(p[0] in s and p[1] in s for p in pairs[n]) for n in names)]
    if found:
        print(size, "tests:", found)
        break

# Output:
# a [((0, 1, 0), (1, 1, 0))]
# b [((1, 0, 0), (1, 1, 0))]
# c [((0, 0, 0), (0, 0, 1)), ((0, 1, 0), (0, 1, 1)), ((1, 0, 0), (1, 0, 1))]
# 4 tests: [((0, 1, 0), (0, 1, 1), (1, 0, 0), (1, 1, 0)), ((0, 1, 0), (1, 0, 0), (1, 0, 1), (1, 1, 0))]
```

Read the output line by line.

- **Condition $a$** has only one pair: $(0,1,0)$ and $(1,1,0)$. For $a$ to matter, $b$ must be 1 (otherwise $a \land b$ is 0 whatever $a$ is) and $c$ must be 0 (otherwise $c$ makes the answer 1 whatever $a$ is).
- **Condition $b$** has only one pair too, for the same reason turned around: $(1,0,0)$ and $(1,1,0)$.
- **Condition $c$** has three pairs. Any row where $a \land b$ is 0 works, because then $c$ alone decides.

The smallest set has 4 tests. Here is the first one as a table:

| Test | $a$ | $b$ | $c$ | $(a \land b) \lor c$ | Shows |
|---|---|---|---|---|---|
| T1 | 1 | 1 | 0 | 1 | pairs with T2 for $a$, with T3 for $b$ |
| T2 | 0 | 1 | 0 | 0 | pairs with T1 for $a$, with T4 for $c$ |
| T3 | 1 | 0 | 0 | 0 | pairs with T1 for $b$ |
| T4 | 0 | 1 | 1 | 1 | pairs with T2 for $c$ |

Three conditions, four tests. That is the usual pattern: a decision with $N$ conditions often needs [[as few as|n-plus-one]] $N + 1$ tests for MC/DC, compared with $2^N$ for every combination. For 10 conditions that is 11 tests instead of 1,024, which is why MC/DC is affordable at all.

::: key
You have 100 percent decision coverage and 70 percent MC/DC. What does that tell you? That compound guards are being exercised only in ways that do not isolate each condition, so a bug in an unexercised condition could hide. Either add the independence-demonstrating cases, or the condition is redundant and the logic should be simplified.
:::

The MC/DC percentage is roughly the share of conditions for which an independence pair has been seen. Tools differ in the [[fine details|masking]] of how they count, but the meaning is the same: the missing percentage is conditions that no test has proven matter. And if a condition can *never* be shown to matter, whatever the inputs, then removing it would not change the logic. That is the redundant case in the key above, and it usually means the guard was written wrong.

::: warning MC/DC is about each condition, not each decision
It is tempting to count tests per decision ("this guard was true and false, done"). MC/DC asks about every condition inside, one at a time, with the others held still. When you add a test to close an MC/DC gap, write down which condition and which partner test it pairs with, as in the table above. If you cannot name the pair, the test probably did not close the gap.
:::

## Turning coverage on

In the Test Manager, coverage is a setting on the test file: tick the box to record coverage for the component under test, choose the metrics, and every test case's run adds to one combined report. From the command line, the coverage functions do the same for a single simulation:

```matlab
testObj = cvtest('pitch_ctrl');
testObj.settings.decision  = 1;
testObj.settings.condition = 1;
testObj.settings.mcdc      = 1;
covData = cvsim(testObj);
cvhtml('pitch_ctrl_coverage', covData);
```

`cvtest` describes what to measure, `cvsim` runs the model and collects the data, and `cvhtml` writes an HTML report. The report colors each block green when fully covered and red when not, and lists every missed outcome. Coverage data from several runs can be added together, because what matters is the whole test suite, not one run.

## Coverage of tables, ranges and boundaries

Decisions and conditions are about logic. A GNC model is also full of numbers flowing through tables and comparisons, and Simulink Coverage has three more measures aimed at them.

### Lookup-table coverage

A 1-D lookup table with $n$ breakpoints has $n - 1$ intervals between breakpoints, where it interpolates, plus one region below the first breakpoint and one above the last, where it extrapolates. That makes $n + 1$ regions. **Lookup-table coverage** records which regions the tests actually used. Full coverage means every interpolation interval and both extrapolation regions were visited at least once. For a 2-D table, the regions multiply: $(n_1 + 1)(n_2 + 1)$.

It catches a real danger. Aerodynamic tables often have a few breakpoints packed around Mach 1, the [[transonic|transonic]] region, where the coefficients change fast. A test suite that only flies subsonic never checks that the transonic part of the table is correct, or that it is even wired to the right input.

::: example Coverage of a drag table
A drag-coefficient table has Mach breakpoints $0,\ 0.5,\ 0.8,\ 1.0,\ 1.2,\ 2.0,\ 3.0$. The test suite flies trajectories from Mach 0 to Mach 2.5. What lookup-table coverage does it get?

**Step 1: count the regions.** There are $n = 7$ breakpoints, so $7 - 1 = 6$ interpolation intervals, plus 2 extrapolation regions: $6 + 2 = 8$.

**Step 2: which were visited.** Mach 0 to 2.5 passes through $[0, 0.5]$, $[0.5, 0.8]$, $[0.8, 1.0]$, $[1.0, 1.2]$, $[1.2, 2.0]$ and part of $[2.0, 3.0]$. That is all 6 interpolation intervals. Neither extrapolation region is visited: nothing went below Mach 0 or above Mach 3.0.

**Step 3: the percentage.** $6 / 8 = 75\%$.

**Sanity check.** The two missing regions are very different. Below Mach 0 is impossible for a vehicle, so no honest test can reach it: that is a candidate for justification, as the last section explains. Above Mach 3.0 is possible if the vehicle can fly faster than the table's range, and then the model is extrapolating, which is worth a test and a hard look at the table's range.
:::

### Signal-range coverage

**Signal-range coverage** is different from the others. It gives no percentage. For every signal, it records the smallest and largest value seen across all tests. You compare those with the ranges the design must handle. If the flight envelope reaches a [[dynamic pressure|dynamic-pressure]] of 35 kPa but no test went above 20 kPa, the top of the envelope is untested, however green the other reports look.

### Relational-boundary coverage

Many bugs sit right at an edge. Someone writes `>` where the requirement said "at or above", or a threshold is off by one count. **Relational-boundary coverage** checks, for each comparison such as $x > 5$, whether tests put the two sides of the comparison close together on both sides of the edge. For whole numbers that means one test where $x = 5$ exactly and one where $x = 6$, the two values on either side of the boundary. For decimal numbers it means one test within a small tolerance at or slightly below the threshold and one slightly above.

Why both? Because `x > 5` and `x >= 5` give the same answer for every whole number except 5. A test suite that never sends exactly 5 cannot tell the two apart, and one of them is the wrong one.

::: key
Lookup-table coverage: every interpolation interval and both extrapolation regions visited. Signal-range coverage: the minimum and maximum each signal reached. Relational-boundary coverage: each comparison tested close to both sides of its threshold, where `>` and `>=` differ.
:::

## Missing coverage: a missing test, or dead logic?

Every red mark in a coverage report demands an answer, and there are only two honest ones.

**A missing test.** The outcome can happen in flight, but no test made it happen. The fix is to add a test that does, with an assessment that checks the right thing happens there. Most gaps are this kind, and they are the whole point of measuring coverage: each one was a place a bug could have hidden.

**[[Dead logic|dead-logic]].** The outcome can *never* happen, whatever the inputs, because something else in the design prevents it. No test can reach it. Then the logic itself is the problem. Either it should be removed, because code that can never run is still code that has to be reviewed, stored and trusted, or the thing that blocks it is the bug.

Telling them apart takes thought, not a tool setting. Ask: *is there any input, in the full range the design must handle, that reaches this outcome?*

::: example One report, two red marks
The coverage report of an engine-controller model shows two outcomes never reached.

**Mark 1: the abort guard's condition $a$ (pressure low) was never shown to matter.** Look back at its only independence pair: pressure low must flip abort while past liftoff is true and the range safety command is false. The tests include a nominal flight (pressure fine) and a range safety abort (command true), but no test drops the pressure after liftoff with no command. That input is entirely possible in flight: it is an engine failure. **Missing test.** Add it, with an assessment that abort goes true within the required time.

**Mark 2: a Switch after the throttle logic never took its "true" branch.** Its decision is $\text{throttle} > 105$ (percent). Trace the signal upstream: it comes out of a Saturation block with limits 0 and 100. After that block the throttle can never exceed 100, so it can never exceed 105. No test can reach this branch. **Dead logic.** Now ask why it is there. If the saturation limits are right, the Switch is left over from an older design and should go. If the engine really can run at up to 110%, the saturation is the bug, and it has been silently removing a capability.

**Sanity check.** The same red color meant opposite actions: write a test for one, change the design for the other. A team that "fixes" coverage gaps by always adding tests would have tried, and failed, to reach Mark 2 forever. A team that always justifies gaps would have missed the engine-failure test in Mark 1.
:::

When an outcome is truly unreachable for a good reason, for example defensive code that guards against a hardware fault a model cannot produce, Simulink Coverage lets you record a **[[justification|justification]]**: the outcome is marked as reviewed and excluded from the percentage, with a written rationale that an auditor can read. A separate product, Simulink Design Verifier, can help from both sides: it can search for an input that reaches an uncovered outcome, or prove that none exists, which is strong evidence of dead logic.

::: warning Never add a test only to turn a block green
A test written only to reach an outcome, with no assessment of what should happen there, raises the coverage number and proves nothing. Coverage measures where your checks *could* catch a bug. It only means something if each test also checks the behavior it reached.
:::

## Check yourself

::: check
A decision is $a \lor b$, read "a or b". Which tests give MC/DC, and how many do you need?
:::

::: answer
For $a$ to matter, $b$ must be 0: the pair $(0,0) \to 0$ and $(1,0) \to 1$. For $b$ to matter, $a$ must be 0: the pair $(0,0) \to 0$ and $(0,1) \to 1$. The row $(0,0)$ is shared, so three tests do it: $(0,0)$, $(1,0)$ and $(0,1)$. That is $N + 1 = 3$ for $N = 2$ conditions. The row $(1,1)$ is not needed.
:::

::: check
Why can 100% decision coverage be reached on $(a \land b) \lor c$ without ever showing that $b$ matters?
:::

::: answer
Decision coverage only needs the whole decision to be true once and false once. Setting $c = 1$ makes it true and $(0,0,0)$ makes it false, and in neither test does changing $b$ alone change the outcome. For $b$ to matter, $a$ must be 1 and $c$ must be 0, a combination decision coverage never forces you to try.
:::

::: check
A 2-D lookup table has 9 breakpoints for altitude and 6 for Mach. How many regions must be visited for full lookup-table coverage?
:::

::: answer
Each dimension has $n + 1$ regions: $9 + 1 = 10$ for altitude and $6 + 1 = 7$ for Mach. The regions of the table are all the combinations, $10 \times 7 = 70$.
:::

::: check
A guard in a chart is `count >= 3`, where `count` is a whole number. Which test values give relational-boundary coverage, and what bug would they catch?
:::

::: answer
The two whole numbers on either side of the boundary: `count = 2` (guard false) and `count = 3` (guard true). They catch an off-by-one: if the requirement meant "more than 3" the guard should be `count > 3`, and the two versions differ only at `count = 3`. A test that jumps from 0 to 10 would pass either way.
:::

::: check
A Stateflow transition's guard is `alt < 0`, and its "true" outcome is never covered. The altitude signal comes from a navigation filter that can report small negative altitudes during a pad test. Missing test or dead logic?
:::

::: answer
A missing test. Before deciding it is dead, ask whether any valid input reaches it. A navigation filter's altitude can dip slightly below zero from noise on the pad, so the outcome can really happen. Add a test that drives the altitude below zero and assesses what the chart should do then. It would only be dead logic if something upstream, such as a saturation at zero, made a negative value impossible.
:::

## Summary

| Measure | Full coverage means | Catches |
|---|---|---|
| Decision | every decision both true and false | branches never taken |
| Condition | every condition both true and false | conditions never flipped |
| MC/DC | each condition shown to change the outcome with the others held fixed; often $N+1$ tests | a condition that is wrong or missing but masked by others |
| Lookup table | every interpolation interval and both extrapolation regions visited; $n+1$ per dimension | untested table regions, wrong input wiring |
| Signal range | (no percentage) the min and max each signal reached | envelope edges never tested |
| Relational boundary | each comparison tested close to both sides of its threshold | `>` versus `>=`, off-by-one thresholds |
| Missing coverage | either a missing test or dead logic | add a test with an assessment, or fix or remove the logic |

The next lesson ties all of this back to where it started, the requirements: authoring them in Requirements Toolbox, linking each one to the blocks that implement it and the tests that verify it, and checking the model against modeling guidelines with Model Advisor.

::: context do-178c The rulebook for airborne software
DO-178C, *Software Considerations in Airborne Systems and Equipment Certification*, was published in 2011 by RTCA, and aviation authorities such as the FAA use it to approve aircraft software. It sorts software into levels by how bad a failure would be. Level A, where a failure could be catastrophic, requires MC/DC coverage of the code. Level B requires decision coverage, and Level C statement coverage, which means every line ran. A supplement, DO-331, covers model-based development and adds coverage analysis of the models themselves. Launch vehicles are not aircraft, but NASA and many rocket companies borrow these ideas for their flight software.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="14" width="320" height="30" fill="#b4232c"/>
  <text x="30" y="34" font-size="12" fill="#ffffff">Level A: catastrophic, MC/DC</text>
  <rect x="20" y="50" width="250" height="30" fill="#f2b880"/>
  <text x="30" y="70" font-size="12" fill="#1f2a44">Level B: hazardous, decision</text>
  <rect x="20" y="86" width="180" height="30" fill="#8fb8f0"/>
  <text x="30" y="106" font-size="12" fill="#1f2a44">Level C: major, statement</text>
</svg>
```

Longer bars mean stricter coverage demands.
:::

::: context logical-operator The guard as blocks
In a Simulink diagram, the abort guard is two Logical Operator blocks: an AND with inputs $a$ and $b$, feeding an OR whose other input is $c$. Coverage treats each block input as a condition and each block output as part of a decision, so the report can point at the exact input line that was never shown to matter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="14" y="34" font-size="11" fill="#1f2a44">a: pressure low</text>
  <text x="14" y="64" font-size="11" fill="#1f2a44">b: past liftoff</text>
  <text x="14" y="104" font-size="11" fill="#1f2a44">c: range safety</text>
  <line x1="104" y1="30" x2="140" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <line x1="104" y1="60" x2="140" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <rect x="140" y="18" width="50" height="54" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="165" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">AND</text>
  <line x1="190" y1="45" x2="230" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <line x1="104" y1="100" x2="215" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="215" y1="100" x2="215" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="215" y1="80" x2="230" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <rect x="230" y="34" width="50" height="58" fill="#f2b880" stroke="#1f2a44"/>
  <text x="255" y="68" font-size="12" fill="#1f2a44" text-anchor="middle">OR</text>
  <line x1="280" y1="63" x2="310" y2="63" stroke="#1f2a44" stroke-width="2"/>
  <text x="314" y="67" font-size="12" fill="#1f2a44">abort</text>
</svg>
```
:::

::: context n-plus-one Why N plus 1 is the floor
Each condition needs its own pair of tests, and a pair is two tests. With clever sharing, as in the table, one test can belong to several pairs: T1 is in the pairs for both $a$ and $b$. For decisions built from chains of AND and OR, the sharing can be pushed until the $N$ pairs need only $N + 1$ distinct tests. Fewer is impossible: the pairs link tests together like branches of a tree, and a closed loop of links would need some condition to flip twice, so $N$ links, one per condition, always join at least $N + 1$ tests. Some decisions, with repeated or linked conditions, need more.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="30" y="30" font-size="12" fill="#1f2a44">T1 (1,1,0) true</text>
  <text x="30" y="62" font-size="12" fill="#1f2a44">T2 (0,1,0) false</text>
  <text x="30" y="94" font-size="12" fill="#1f2a44">T3 (1,0,0) false</text>
  <text x="30" y="126" font-size="12" fill="#1f2a44">T4 (0,1,1) true</text>
  <path d="M150,26 C185,32 185,52 150,58" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="188" y="46" font-size="12" fill="#1d6fd1">a</text>
  <path d="M150,26 C240,40 240,76 150,90" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="232" y="62" font-size="12" fill="#b4232c">b</text>
  <path d="M150,58 C290,72 290,108 150,122" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="280" y="94" font-size="12" fill="#1f2a44">c</text>
</svg>
```

Three arcs, one per condition, joining four tests.
:::

::: context masking Unique-cause and masking MC/DC
The strict form, **unique-cause** MC/DC, is the one in this lesson: the two tests of a pair differ in exactly one condition. A looser form, **masking** MC/DC, lets other conditions change too, as long as the logic shows those other changes could not have affected the outcome, because they were "masked" by another condition, like the right side of an AND whose left side is false. Masking MC/DC is widely accepted in certification and often needs fewer tests. Coverage tools let you choose which one to measure.
:::

::: context transonic Where the air changes its mind
Transonic means near the speed of sound, roughly Mach 0.8 to 1.2. There, shock waves start to form on the vehicle, and drag rises steeply over a small change in Mach number before easing off at higher speed. A table that describes that behavior needs its breakpoints bunched where the curve bends. For a rocket this region arrives in the first minute of flight, close to the moment of maximum aerodynamic load, so it is one of the most important stretches of any aero table.
:::

::: context dynamic-pressure How hard the air pushes
Dynamic pressure, written $q$, is $\tfrac{1}{2}\rho v^2$: half the air density times the speed squared. It measures how hard the oncoming air pushes on the vehicle. At 10 km altitude the air density is about $0.41\,\mathrm{kg/m^3}$, so at 400 m/s, $q = 0.5 \times 0.41 \times 400^2 \approx 33\,\mathrm{kPa}$. The largest value in flight, called max-Q, is when the structure and the control system are under the most stress, which is why the top of the $q$ range is exactly where you want tests.
:::

::: context dead-logic Why unreachable is not harmless
Dead logic sounds like a tidy-up issue: a bit of design nobody uses. But it is often a symptom. Something was meant to happen there, and something else now stops it. In the throttle example, the dead Switch pointed straight at a saturation limit that was removing a real capability. Dead logic in flight code also costs money: every line must be reviewed and traced to a requirement, and a line that can never run cannot be tested, so it needs a written argument instead.
:::

::: context justification Excluding an outcome, in writing
A justification says: this outcome was looked at by a person, it cannot be reached for this reason, and so it is left out of the percentage. In Simulink Coverage the justifications are kept in a filter file alongside the tests, each with its rationale, so the next reviewer can check the argument. A good rationale names the mechanism ("the input is saturated to 0 to 100 upstream by block X"), not a feeling ("never happens"). An auditor reads every one.
:::
