---
id: l11-safing-reachability
title: "Safing modes: proving safe is reachable"
minutes: 17
covers:
  - Safing modes and the rule that safe must be reachable, stable and exitable only by an explicit decision
---

Lesson 2 built a mode table for a small satellite bus and asserted, by construction, that every state could reach `SAFE` and that `SAFE` could be left only by an explicit command. "By construction" meant: the table was designed with an unconditional edge to `SAFE` from every other row, and with exactly one, explicitly gated, row leaving `SAFE`. That is a reasonable way to *design* the property in. It is not a proof that the property *holds* — and everything this module has shown since, from a common-mode defect that fools a voter completely to a slow drift that outruns a fault monitor, is exactly the kind of thing that should make you distrust "I designed it that way, so it must be true" as a substitute for checking. This lesson replaces the assertion with a proof, and then breaks it on purpose, with a change that looks entirely reasonable in a diff, to show precisely what the proof catches that a review does not.

## The property, stated as a graph question

A mode table is a directed graph: states are nodes, legal transitions are edges. Two properties from lesson 2 translate directly into graph questions.

**Safe is reachable from everywhere**: every node in the graph has a directed path to the node `SAFE`. Not "the states we thought to check by hand" — every one, including any added after the table's first design.

**Safe is exited only by an explicit decision**: every edge *leaving* `SAFE` is tagged as requiring an explicit command, and there is no other way out.

The first property is exactly a reachability question, and reachability is a question graph search answers exactly, not approximately — for any finite table, the search either confirms every node has a path or names the ones that do not, with no ambiguity and no dependence on which paths a reviewer happened to trace by eye. That is the entire reason to reach for a search algorithm here rather than a careful read of the table: a careful read is bounded by what one person notices, and this module's whole second half has been examples of faults that hide from a check that only looks where you expect trouble.

## Reverse-reachability from SAFE

The search itself is simple: build the *reverse* graph — an edge from $b$ to $a$ wherever the original table has an edge from $a$ to $b$ — and find every node reachable from `SAFE` in that reversed graph, by breadth-first search. A node reachable from `SAFE` in the reverse graph is, by construction, exactly a node with a forward path *to* `SAFE` in the original table. Run this once, compare the result against the full set of states, and any state left out is a state with no path to safety at all.

::: example Confirming the property on lesson 2's table
```python
from collections import deque

STATES = ["BOOT", "STANDBY", "SUN_POINT", "SLEW", "PAYLOAD_OPS", "SAFE"]
NOMINAL = [
    ("BOOT", "STANDBY", "self_test_pass", False),
    ("STANDBY", "SUN_POINT", "attitude_valid", False),
    ("SUN_POINT", "SLEW", "slew_cmd_valid_and_power_ok", False),
    ("SLEW", "PAYLOAD_OPS", "slew_complete_and_attitude_valid", False),
    ("PAYLOAD_OPS", "SUN_POINT", "payload_op_complete", False),
    ("SUN_POINT", "STANDBY", "stand_down_cmd", False),
]
SAFING = [(s, "SAFE", "safing_command", False) for s in STATES if s != "SAFE"]
RECOVERY = [("SAFE", "STANDBY", "ground_recovery_cmd_and_health_nominal", True)]
GOOD_TABLE = NOMINAL + SAFING + RECOVERY

def can_reach_safe(states, edges, target="SAFE"):
    """Structural check: does SOME path to target exist in the transition
    graph. Guard truth values do not enter here -- this is about the shape
    of the table, not whether a specific guard happens to be true right now."""
    reverse = {s: [] for s in states}
    for (a, b, guard, explicit) in edges:
        reverse[b].append(a)
    reached, q = {target}, deque([target])
    while q:
        node = q.popleft()
        for pred in reverse[node]:
            if pred not in reached:
                reached.add(pred)
                q.append(pred)
    return reached

reached = can_reach_safe(STATES, GOOD_TABLE)
print("states with a path to SAFE:", sorted(reached))
print("states with NO path to SAFE:", sorted(set(STATES) - reached))
# states with a path to SAFE: ['BOOT', 'PAYLOAD_OPS', 'SAFE', 'SLEW', 'STANDBY', 'SUN_POINT']
# states with NO path to SAFE: []

leaving_safe = [(a, b, g, ex) for (a, b, g, ex) in GOOD_TABLE if a == "SAFE"]
print("edges leaving SAFE:", leaving_safe)
print("every exit from SAFE is an explicit command:", all(ex for (_, _, _, ex) in leaving_safe))
# edges leaving SAFE: [('SAFE', 'STANDBY', 'ground_recovery_cmd_and_health_nominal', True)]
# every exit from SAFE is an explicit command: True
```
Every one of the six states shows up with a path to `SAFE`, and the empty-set check confirms there is no state left out. The second check reads the table's `SAFE`-outgoing edges directly and confirms the only one present requires an explicit command — both halves of lesson 2's design intent, now demonstrated rather than assumed. Note what the search did *not* need: it never evaluated `self_test_pass` or `attitude_valid` against any telemetry, because reachability is a question about the table's shape, answerable without running the vehicle at all.
:::

## A change that looks complete, and is not

Now make the change a real program makes routinely: a new capability is added. Suppose a later engineer adds a two-step gyro calibration sequence — entered from `STANDBY`, running through an internal check-and-retry loop — intending to wire it back into the rest of the table once the calibration logic itself is finished. The diff adds an entry edge and internal transitions; it looks, at a glance, like a small, self-contained, complete addition, exactly the kind of change that clears a routine review.

::: example The search catches what the diff does not show
```python
BUGGY_STATES = STATES + ["CALIBRATE", "CAL_VERIFY"]
BUGGY_TABLE = GOOD_TABLE + [
    ("STANDBY", "CALIBRATE", "cal_due", False),
    ("CALIBRATE", "CAL_VERIFY", "cal_step_done", False),
    ("CAL_VERIFY", "CALIBRATE", "cal_retry", False),
    # missing: any edge from CALIBRATE or CAL_VERIFY back to STANDBY or to SAFE
]

reached2 = can_reach_safe(BUGGY_STATES, BUGGY_TABLE)
print("states with NO path to SAFE:", sorted(set(BUGGY_STATES) - reached2))
# states with NO path to SAFE: ['CALIBRATE', 'CAL_VERIFY']
```
`CALIBRATE` and `CAL_VERIFY` have an entry point and a fully wired internal retry loop between the two of them — every edge that appears in the diff genuinely exists and genuinely does something sensible. What the diff does not show, because a diff shows what changed rather than what the whole graph now looks like, is that neither new state has *any* edge leaving that reaches back into the original six states. A vehicle that enters `CALIBRATE` and never satisfies `cal_step_done`, or cycles between `CALIBRATE` and `CAL_VERIFY` on repeated `cal_retry`, has no path to safety at all — not because any single transition in the new code is wrong, but because the new subgraph was never connected back to the one state (or, failing that, directly to `SAFE`) that would have given it an escape. The search finds this in the time it takes to run a breadth-first search over eight nodes; a reviewer reading the diff, seeing two new states with sensible-looking entry and internal logic, has no comparable way to notice that neither one connects back to anything.
:::

::: key
Reachability is a property of the whole graph, not of any single row. A change can add only transitions that are individually correct and still remove the property this module keeps returning to, because "every edge I added makes sense" says nothing about whether the resulting graph, as a whole, still lets every state reach safety. Check the graph, after every change, rather than the diff.
:::

## Why this has to run automatically, not occasionally

A mode table with six states is small enough that a determined reviewer might eventually have caught the `CALIBRATE` gap by hand, given enough time and enough suspicion. Real mode tables grow well past six states over a program's life — contingency modes, calibration sequences, payload-specific operating modes, each added by a different engineer at a different point in the schedule — and the number of (state, transition) pairs a reviewer would need to hold in mind to catch a gap like this one by inspection grows with it, while the time available for any one review does not. The search this lesson built costs nothing to run: it is linear in the number of states and transitions, meaning its running time grows only in direct proportion to the table's size, not faster — cheap enough to run as an automated check on every single change to the table, the same way a test suite runs on every code change, rather than as a one-time audit hoped to have caught everything at the start of the program. Run that way, the `CALIBRATE` gap is caught the moment it is introduced, before it reaches a reviewer at all, which is a categorically stronger guarantee than hoping the reviewer who happens to look at that diff is having a careful day.

::: warning
"We reviewed the mode table and it looked right" is not evidence the reachability property holds, for the same reason "the three channels agreed" was not evidence of correctness in lesson 6 — a review, like a vote, checks whether something looks consistent with expectation, not whether a specific formal property is actually true of the whole structure. Run the search; do not substitute a review for it.
:::

## Check yourself

::: check
Explain, in terms of the reverse-reachability search, why finding that a state is reachable from `SAFE` in the reversed graph is equivalent to finding that `SAFE` is reachable from that state in the original graph.
:::

::: answer
The reversed graph contains an edge from $b$ to $a$ exactly when the original graph contains an edge from $a$ to $b$; a directed path in the reversed graph is therefore, edge for edge, the same sequence of transitions as a path in the original graph traversed backward. So "there is a path from `SAFE` to state $X$ in the reversed graph" describes precisely the same sequence of transitions as "there is a path from $X$ to `SAFE` in the original graph," read in the opposite direction — the search only needs to be run once, from the single node `SAFE`, rather than once per state.
:::

::: check
The `CALIBRATE` example added three new edges, and all three are structurally valid transitions between existing or new states. Why does the graph still fail the reachability property, and what does this tell you about reviewing a mode-table change by reading only the new edges?
:::

::: answer
The property requires every state to have a path to `SAFE`, and having valid edges is not the same as having an edge, or a chain of edges, that leads anywhere near `SAFE`: `CALIBRATE` and `CAL_VERIFY` only ever point at each other, never back at any of the six original states or at `SAFE` directly, so no path exists no matter how many times the internal loop is traversed. Reviewing only the new edges checks that each one, in isolation, makes sense; it cannot show whether the new states, taken together, are actually connected to the rest of the graph in a way that satisfies a whole-graph property like reachability — which is exactly why this lesson runs a search over the full graph rather than trusting a read of the diff.
:::

::: check
A colleague suggests that once a mode table has passed the reachability check for the first time, it does not need to be checked again unless someone remembers to re-run it before the next flight. What is wrong with this plan, based on this lesson's `CALIBRATE` example?
:::

::: answer
The `CALIBRATE` example is precisely a case of a table that passed the check, and then a later, individually reasonable-looking change broke the property again without anyone editing anything that had previously been checked. "Remembering to re-run it" depends on a person recognizing that a given change might affect reachability, which is exactly the judgment call this lesson's search exists to remove; the check needs to run on every change to the table, automatically, the same way a test suite runs on every code change, rather than depending on someone's judgment about when it might matter.
:::

::: check
Using the definitions in this lesson, what two separate conditions together make a state machine's safing property hold, and which one does the reverse-reachability search verify?
:::

::: answer
The two conditions are: every state has a path to `SAFE` (reachability), and `SAFE` can be left only through an edge tagged as requiring an explicit command (exitability). The reverse-reachability search verifies the first; the second is checked separately, by reading the table's `SAFE`-outgoing edges directly and confirming each one is tagged explicit, as this lesson's first worked example did with `leaving_safe`. Both checks are necessary — a table could pass one and fail the other, for instance by making every state reach `SAFE` while also leaving an unconditional, non-explicit exit from `SAFE` that lets the vehicle leave safety on its own judgment.
:::

::: check
A different engineer proposes fixing the `CALIBRATE` bug not by adding an edge back to `STANDBY`, but by adding a direct edge `CALIBRATE -> SAFE` and leaving `CAL_VERIFY` untouched. Does this fix the reachability property for both new states? Check by reasoning through the search rather than just the rule you already know.
:::

::: answer
No, not fully: adding `CALIBRATE -> SAFE` gives `CALIBRATE` a path to safety, so it is fixed, but `CAL_VERIFY`'s only outgoing edge is still `CAL_VERIFY -> CALIBRATE` (the retry edge), which now does reach `SAFE` indirectly through `CALIBRATE`'s new edge — so in this specific case, because `CAL_VERIFY` already pointed at `CALIBRATE`, the single added edge happens to repair both states at once. This is worth checking by tracing the path rather than assuming it, precisely because it would not hold in general: had `CAL_VERIFY`'s only edge instead pointed at some third, still-disconnected state, the same fix would have repaired `CALIBRATE` alone and left `CAL_VERIFY` exactly as broken as before, which is the entire reason to re-run the actual search after any proposed fix rather than trust that a fix "sounds like it should work."
:::

## Summary

| Term | Meaning |
| --- | --- |
| Reachability | Every state has a directed path to `SAFE` in the transition graph |
| Reverse-reachability search | Build the reversed graph, breadth-first search from `SAFE`; nodes found have a forward path to `SAFE` |
| Exitability | `SAFE`'s outgoing edges are all tagged as requiring an explicit command; no autonomous exit exists |
| A diff is not the graph | Individually valid new edges can still leave a new subgraph disconnected from safety |
| Automated, not occasional | The search is cheap enough to run on every change; re-run after every proposed fix, not just once |

This closes the module's second demonstration: a mode manager designed with a safing property, and a search that proves the property holds rather than assumes it — the same discipline, applied to a different structure, as lessons 6 and 7's proof that a voter's guarantees are exactly as strong as its assumptions and no stronger. The final lesson turns from what the software does at runtime to how the organization around it keeps that software trustworthy as it changes over a program's life: tracing a requirement to the code that implements it and the test that exercises it, keeping tunable data under configuration management separately from the executable, and deciding when updating flight software in flight is the safer choice rather than the riskier one.
