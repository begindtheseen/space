---
id: l11-transition-order-and-mutual-exclusivity
title: Transition order and mutually exclusive guards
minutes: 20
covers:
  - Transition evaluation order and guaranteeing mutual exclusivity
---

Picture a school's rules for a snow day, pinned to the office wall. Rule 1: if the roads are closed, school is closed. Rule 2: if it is below −20 °C, school starts two hours late. Now the roads are closed *and* it is −25 °C. Is school closed, or late? Whoever reads the list top to bottom says closed. Whoever reads rule 2 first says late. The list has a hole: two rules can both apply, and only the order decides.

A Stateflow state with several outgoing transitions is that list. Lesson 8 said Stateflow tests them one at a time and takes the first valid one, and lesson 10 added time-based conditions such as `after` and `duration` to what goes inside the brackets. This lesson answers the two questions a reviewer asks about every state in a flight chart: in what order are these transitions tested, and could that order ever change what happens?

The condition in square brackets on a transition is often called its **[[guard|guard-word]]**: it guards the arrow, letting the chart through only when it is true. The goal of this lesson is guards written so that the order never matters.

## Numbered transitions

Every transition leaving the same source (a state or a junction) gets an **execution order number**: 1, 2, 3, drawn as a small number on each arrow near where it leaves. Each wake-up, when the chart tests that source's transitions, it tests number 1 first, then 2, and so on, and takes the first one whose label is valid. Transitions after that one are not even tested.

This is **explicit ordering**, and it is how new charts work. It is controlled by the chart property **User specified state/transition execution order**, which is on by default in new charts. Stateflow numbers the transitions in the order you draw them. To change a number, right-click the transition and choose **Execution Order**, then pick the position you want. The numbers only rank transitions that share a source; a transition from ASCENT and one from LIFTOFF do not compete through their numbers.

::: key
Explicit ordering: each transition out of a source carries an execution order number. Stateflow tests them 1, 2, 3, … and takes the first valid one; later ones are not tested that wake-up.
:::

### The older rule: implicit ordering

Charts that use C as their action language can have the property switched off, and old charts often do. Then Stateflow orders the transitions itself, using three tie-breakers in turn:

1. **Hierarchy.** Each transition has a **parent**: the smallest state (or the chart) that contains both of its ends. Transitions whose parent is higher in the hierarchy are tested first.
2. **Label.** Among the rest, transitions with an event and a condition come first, then an event only, then a condition only, then no label at all.
3. **Geometry.** Still tied? Position on the drawing decides. For a state, Stateflow goes clockwise around the border starting from the **upper-left corner**. For a junction, it goes clockwise starting from the **[[12 o'clock position|clock-rule]]**.

The third rule is the dangerous one. Drag an arrow a few millimeters around the corner of a state, a change nobody would think of as a logic change, and the order can change. That is why explicit numbering became the default: the order is a visible decision, not an accident of layout.

::: warning Know which mode a chart is in before you review it
The same drawing can behave differently under explicit and implicit ordering. When you inherit an old chart, check the **User specified state/transition execution order** setting first. If it is off, the numbers you see on screen are Stateflow's computed order, and moving an arrow may renumber them.
:::

## Outer before inner, whatever the numbers say

There is one order the numbers never override. Lesson 8 showed that each wake-up Stateflow starts at the outermost active state and works inward. A superstate's outgoing transitions are all tested before any transition of the active substate inside it.

So when the chart is in ASCENT.GRAVITY_TURN, the full test order is: ASCENT's transitions 1, 2, … then, only if none was valid, GRAVITY_TURN's transitions 1, 2, …. A transition numbered 1 on GRAVITY_TURN still loses to a valid transition numbered 3 on ASCENT's border. This is exactly what makes a superstate border the right place for abort and safe-mode arrows: nothing inside can outrank them.

(Parallel states, from lesson 9, have their own execution order numbers, which decide which parallel state runs first in a wake-up. That is a separate ranking from the transition numbers here.)

::: key
Outer transitions are checked before inner ones: a superstate's outgoing transitions are all tested before its active substate's, whatever their numbers. Order numbers rank only transitions that share a source.
:::

::: example Which arrow wins?
A chart runs at 50 Hz. After stage separation is commanded, the booster sits in STAGE_SEP, inside a superstate FLIGHT. The transitions tested each wake-up, in order:

| Source | Number | Guard | Goes to |
|---|---|---|---|
| FLIGHT | 1 | `[abort_req]` | ABORT |
| STAGE_SEP | 1 | `[duration(sep_sw) >= 0.1]` | COAST |
| STAGE_SEP | 2 | `[after(5, sec)]` | SEP_FAIL |

`sep_sw` is the separation switch, true once the stages have physically parted. `SEP_FAIL` is a state for "separation did not happen in time". The chart enters STAGE_SEP at wake-up 0. Count time in whole steps.

**Case 1: the switch closes at wake-up 245 (4.90 s), and there is no abort.** FLIGHT's guard is false every time. `duration(sep_sw)` is 0 at wake-up 245 and reaches $0.1\,\mathrm{s}$ five steps later, at wake-up 250. `after(5, sec)` becomes true at wake-up $5 / 0.02 = 250$ too. At wake-up 250, both of STAGE_SEP's guards are true. Transition 1 is tested first, so the chart goes to COAST. Renumber them and the same flight goes to SEP_FAIL.

**Case 2: the switch closes one step later, at wake-up 246 (4.92 s).** At wake-up 250, `duration` is only $4 \times 0.02 = 0.08\,\mathrm{s}$, so transition 1 is false and transition 2 is true. The chart goes to SEP_FAIL, although the stages separated 80 ms earlier.

**Case 3: `abort_req` becomes true at wake-up 250 in Case 1.** FLIGHT's transition is tested before either of STAGE_SEP's, so the chart goes to ABORT. Neither of STAGE_SEP's guards is looked at.

**Sanity check.** Case 1 shows an overlap that only the numbers resolve; Case 2 shows the timeout guard is also wrong on its own terms, firing on a vehicle that did separate. Both come from the same guard, and the next section fixes it.
:::

## Making the order not matter

Relying on the numbers is legal. But a chart whose behavior depends on them has a hidden rule, and hidden rules survive reviews. The strong fix is to write the guards of each source so that **at most one can be true at any moment**. Guards like that are **mutually exclusive**: if one is true, all the others are false. Then the order numbers can be shuffled freely and nothing changes, because there is never more than one candidate.

There are three standard ways to get there.

- **Partition one variable.** Split a single quantity into ranges that do not overlap: `[q > 30000]`, `[q > 25000 && q <= 30000]`, `[q <= 25000]`. Every value of `q` lands in exactly one range, and a reviewer can check it by drawing a number line.
- **Carry the "not" of the earlier guard.** If guard 1 is `A`, write guard 2 as `B && ~A` (read `~A` as "not A"). Now guard 2 cannot be true while guard 1 is. Often a simpler "not" is enough, the way `~sep_sw` does below.
- **Make the priority explicit and write it down.** Sometimes overlap is the point: an abort must win over everything. Then keep the overlap, put the abort first, and say so in a comment on the chart and in the requirements. That is a documented decision, not a hidden one.

::: key
To guarantee two transitions out of one state cannot both fire, make the guard conditions provably mutually exclusive (for example partitioning on a single variable), or make the priority explicit and document it. Relying on the implicit evaluation order is how a reviewed chart still surprises you.
:::

For STAGE_SEP, the fix is one word. Change transition 2 to

```text
[after(5, sec) && ~sep_sw]
```

"Five seconds have passed *and* the switch is still open." Now if the stages have parted, the timeout is false. In Case 1 only COAST's guard is true at wake-up 250. In Case 2, at wake-up 250 the switch is closed, so SEP_FAIL's guard is false; the chart waits one more step and goes to COAST at wake-up 251.

### Proving it with a truth table

"I thought about it and they can't overlap" is not a proof. A **[[truth table|truth-table]]** is: a list of every combination of true and false for the simple conditions a guard is built from, with the value of each guard in each row. If no row has two guards true, the guards are mutually exclusive. With $k$ simple conditions the table has $2^k$ rows, 8 for three conditions, so a computer can list them all.

Here is a checker in Python. Each guard is a small function of the named conditions. One subtlety: the conditions are not always independent. `confirmed` (short for `duration(sep_sw) >= 0.1`) can only be true if `sep_sw` is true right now. A row where `confirmed` is true and `sep_sw` is false cannot happen, so the checker skips it rather than report a false alarm.

```python
from itertools import product

def overlaps(guards, names, possible=lambda **v: True):
    """Every possible row of the truth table where two or more guards are true."""
    rows = []
    for values in product([False, True], repeat=len(names)):
        v = dict(zip(names, values))
        if not possible(**v):
            continue                      # a row that cannot happen in flight
        fired = [dest for dest, guard in guards.items() if guard(**v)]
        if len(fired) > 1:
            rows.append((v, fired))
    return rows

names = ['confirmed', 'timeout', 'sep_sw']
# confirmed means sep_sw has been true for 0.1 s, so sep_sw is true now
possible = lambda confirmed, timeout, sep_sw: sep_sw or not confirmed

draft = {'COAST':    lambda confirmed, timeout, sep_sw: confirmed,
         'SEP_FAIL': lambda confirmed, timeout, sep_sw: timeout}
fixed = {'COAST':    lambda confirmed, timeout, sep_sw: confirmed,
         'SEP_FAIL': lambda confirmed, timeout, sep_sw: timeout and not sep_sw}

print(overlaps(draft, names, possible))
# [({'confirmed': True, 'timeout': True, 'sep_sw': True}, ['COAST', 'SEP_FAIL'])]
print(overlaps(fixed, names, possible))
# []
```

The draft has exactly one bad row, confirmed and timed out at once, which is Case 1. The fixed guards have none. The empty list is the proof, and it can live in the project's test suite, so a later edit that breaks exclusivity fails a test.

::: warning Leave out a real dependency and you prove the wrong thing
The `possible` filter is part of the argument, so it must be true. If you mark a row impossible that can happen, the checker skips the one row that matters. Write each dependency down with its reason, as the comment above does, and have the reviewer check those reasons as carefully as the guards.
:::

### Guards on numbers: test the edges

A truth table works for true-or-false conditions. Guards on numbers, such as `speed <= 1300`, have infinitely many values, but they only change at their **[[thresholds|edges]]**. So test values just below, exactly at, and just above each threshold, plus a few ordinary values. Overlaps and gaps live at the edges.

::: example Leaving the entry burn
The booster's ENTRY_BURN state has two exits. The first draft:

| Number | Guard | Goes to | Meaning |
|---|---|---|---|
| 1 | `[speed <= 1300]` | DESCENT | slowed enough: burn done |
| 2 | `[alt < 40000]` | SAFE | too low and the burn has not finished |

**Step 1: pick test values.** For speed in m/s: 1299.5, 1300, 1300.5 around the threshold, plus 0 and 2500. For altitude in meters: 39,999, 40,000, 40,001, plus 5000 and 70,000. That is $5 \times 5 = 25$ combinations.

**Step 2: find overlaps.** Both guards are true when speed is at most 1300 *and* altitude is below 40,000. Speeds 1299.5, 1300 and 0 qualify (3 values); altitudes 39,999 and 5000 qualify (2 values). That is $3 \times 2 = 6$ overlapping combinations. A booster that finished its burn at 38 km is sent to DESCENT only because of the numbering.

**Step 3: fix by partitioning on speed.** Guard 2 becomes `[alt < 40000 && speed > 1300]`. Now guard 1 needs speed at most 1300 and guard 2 needs speed above 1300; no speed is both. Rerunning the 25 combinations gives 0 overlaps.

**Sanity check.** "Burn done" and "burn not done" are opposites, so it is right that the two guards now split on the same variable, speed, at the same number, with `<=` on one side and `>` on the other.
:::

::: warning The number that is not a number
If a failed sensor delivers **[[NaN|nan]]** ("not a number"), every comparison with it is false: `speed <= 1300` and `speed > 1300` are *both* false. The fixed ENTRY_BURN guards are then both false forever and the chart stays in the burn. Mutual exclusivity is only half the question; the other half is what happens when no guard is true. Invalid data belongs to fault detection (next lesson), which must catch it before the sequencer sees it. Note too that `~(speed > 1300)` is *true* for NaN while `speed <= 1300` is false: rewriting a guard with a "not" can change its behavior on bad data.
:::

## Letting the tools look too

A truth table you write covers the guards you thought to check. MathWorks tools can look at the whole chart.

- **Stateflow's own checks.** When a chart is compiled, Stateflow reports some structural problems, such as an exclusive group with no default transition, which would leave the chart with no active state (a **state inconsistency**). During simulation it has long documented run-time checks for state inconsistencies and for **transition conflicts**: two transitions from the same source that are valid on the same step, resolved only by their order.
- **Simulink Design Verifier.** This add-on product uses **[[formal methods|formal-methods]]**, mathematics that reasons about every possible input rather than a sample of them. Its design error detection can report **dead logic**, a transition that no input can ever make true. Its property proving takes a statement such as "at most one of these guards is true" and either proves it for all inputs or returns a **counterexample**, a specific set of input values that breaks it.
- **Coverage.** Running tests with coverage measurement shows which transitions have actually been taken. A transition never taken is either untested or dead. Module cod_slk_04 covers this properly.

None of these replace writing guards that are exclusive by construction. They catch the ones you missed.

## Check yourself

::: check
A state has three transitions, numbered 1 `[x > 10]`, 2 `[x > 5]`, 3 `[x > 0]`. Which transition is taken when `x` is 7? When `x` is 12? Are the guards mutually exclusive?
:::

::: answer
At `x = 7`: guard 1 is false (7 is not above 10), guard 2 is true, so transition 2 is taken and guard 3 is not tested. At `x = 12`: all three guards are true; transition 1 is tested first and taken. The guards are not mutually exclusive: at 12 all three overlap, and the right answer depends on the numbers. The exclusive version is `[x > 10]`, `[x > 5 && x <= 10]`, `[x > 0 && x <= 5]`.
:::

::: check
The chart is in FLIGHT.COAST. FLIGHT's only outgoing transition, numbered 2 because someone deleted transition 1, is `[abort_req]`. COAST's transition numbered 1 is `[vz < 0 && alt < 70000]` to ENTRY_BURN. Both guards are true. Where does the chart go, and why?
:::

::: answer
To ABORT (wherever FLIGHT's transition leads). Outer transitions are tested before inner ones, so every transition out of FLIGHT is tested before any transition out of COAST. The order numbers only rank transitions that share a source, so FLIGHT's "2" and COAST's "1" never compete.
:::

::: check
An old C chart has implicit ordering. A state has two outgoing transitions with conditions only, both going to sibling states, one leaving from the top edge near the right corner and one leaving from the left edge near the bottom. Which is tested first?
:::

::: answer
They tie on hierarchy (same parent) and on label (conditions only), so geometry decides: clockwise around the state starting from its upper-left corner. Going clockwise from the upper-left corner, you travel along the top edge first, then down the right edge, along the bottom, and up the left edge. The one on the top edge comes first.
:::

::: check
Write guards for the transitions out of a HOLD state: go to IGNITION when `countdown == 0` and all checks pass (`go`), to SCRUB when `go` is false, and nowhere otherwise. Show they are mutually exclusive.
:::

::: answer
To IGNITION: `[countdown == 0 && go]`. To SCRUB: `[~go]`. Exclusivity: the first guard needs `go` true and the second needs `go` false, so they cannot both be true: they partition on the variable `go`. A four-row truth table over (countdown is zero, go) confirms it: rows with `go` true can only light the first guard; rows with `go` false light only the second. When `go` is true and the countdown is not zero, neither is true and the chart stays in HOLD, which is intended.
:::

::: check
A teammate says: "Our guards overlap in one case, but transition 1 always wins, and that's the case we want. Why change anything?" Give the strongest reply.
:::

::: answer
The behavior is right today only because of an ordering rule that a reader of the guards cannot see. A later edit that renumbers the transitions, or, in an implicit-ordering chart, drags an arrow, silently changes the flight logic, and a review of the guards will not catch it. Either make the guards exclusive, so the order stops mattering, or keep the overlap on purpose and document the priority on the chart and in the requirements, so it is a reviewed decision.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| Guard | the condition in `[ ]` on a transition | lets the chart through when true |
| Explicit ordering | numbers 1, 2, 3 on a source's transitions | default in new charts; right-click, Execution Order |
| Implicit ordering | Stateflow computes the order | hierarchy, then label, then geometry |
| Geometry rule | clockwise | states from the upper-left corner, junctions from 12 o'clock |
| Outer before inner | superstate's transitions first | numbers never override it |
| Mutually exclusive | at most one guard true at once | order no longer matters |
| Partition | split one variable into non-overlapping ranges | `<=` on one side, `>` on the other |
| Truth table | every true/false combination | $2^k$ rows; skip only truly impossible rows |
| NaN | every comparison false | exclusive guards can all be false: stuck |
| Design Verifier | formal proof or counterexample | dead logic, property proving |

The next lesson puts all of this together: a full launch-vehicle mode sequencer with a fault-detection and safe-mode layer, every guard written to be exclusive, and a simulated flight traced step by step.

::: context guard-word Where "guard" comes from
The word comes from computer science. In 1975 Edsger Dijkstra described "guarded commands": a command runs only if its guard, a true-or-false test, holds. In his version, if several guards were true at once the machine could pick *any* of them, on purpose. That freedom is useful for proofs about programs and terrible for a rocket, which is why flight charts either make the guards exclusive or fix the priority.
:::

::: context clock-rule The clock rule, drawn
Under implicit ordering, a junction's outgoing segments are ranked by angle, clockwise, starting at 12 o'clock. Here, the segment leaving at 2 o'clock is tested first, the one at 6 o'clock second, and the one at 9 o'clock third. For a state, the sweep starts at the upper-left corner instead and runs clockwise around the border.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="85" r="7" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="78" x2="180" y2="20" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <text x="180" y="14" font-size="11" text-anchor="middle" fill="#6c7a93">12 o'clock: start</text>
  <path d="M200,45 A45,45 0 0 1 222,70" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="219,64 224,74 227,63" fill="#b4232c"/>
  <line x1="186" y1="81" x2="258" y2="40" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="264" y="40" font-size="11" fill="#1d6fd1">1 (2 o'clock)</text>
  <line x1="180" y1="92" x2="180" y2="150" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="188" y="150" font-size="11" fill="#1d6fd1">2 (6 o'clock)</text>
  <line x1="173" y1="85" x2="90" y2="85" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="84" y="89" font-size="11" text-anchor="end" fill="#1d6fd1">3 (9 o'clock)</text>
</svg>
```
:::

::: context truth-table An old tool for a new job
Truth tables were popularized around 1921, independently, by the logician Emil Post and the philosopher Ludwig Wittgenstein, as a way to settle whether a statement in logic is always true. Engineers adopted them for digital circuits, where every gate is a small truth table. The only limit is size: each extra condition doubles the rows, so 10 conditions give 1024 rows and 30 give over a billion. A guard set of a handful of conditions is well within reach of a loop.
:::

::: context edges Why the edges are where bugs live
Testers call this boundary-value testing. Two guards on the same variable can only disagree at a threshold, so that is where overlaps and gaps hide. Here the number line for speed is split at 1300 m/s: the filled dot means 1300 belongs to the left range (`<=`), the open circle means the right range (`>`) starts just after it. Every speed lands in exactly one range.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#6c7a93"/>
  <line x1="20" y1="44" x2="176" y2="44" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="180" cy="44" r="4" fill="#1d6fd1"/>
  <line x1="184" y1="56" x2="340" y2="56" stroke="#b4232c" stroke-width="3"/>
  <circle cx="180" cy="56" r="4" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="100" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">speed &lt;= 1300: DESCENT</text>
  <text x="262" y="78" font-size="11" text-anchor="middle" fill="#b4232c">speed &gt; 1300: SAFE if low</text>
  <text x="180" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">1300 m/s</text>
</svg>
```
:::

::: context nan Why NaN compares false
Computers store decimals in the IEEE 754 floating-point format, which includes a special value, NaN, for results like $0/0$ or a sensor driver's "no valid reading". The standard says every ordered comparison involving NaN (less than, greater than, and their "or equal" forms) is false, and even `NaN == NaN` is false. MATLAB follows this, so `isnan(x)` is the only reliable test. Flight software usually validates sensor data and flags it invalid before any mode logic reads it.
:::

::: context formal-methods Proof instead of samples
A test checks the inputs you chose. A formal method turns the logic into mathematics and asks a solver whether *any* input could violate the property. Answering "no" covers infinitely many cases at once; answering "yes" comes with a concrete counterexample you can replay in simulation. Aviation software standards recognize formal methods as a kind of verification evidence, and they are strongest on exactly this kind of small, crisp logic: guards, modes and interlocks.
:::
