---
id: l11-safing-reachability
title: "Safing modes: proving safe is reachable"
minutes: 23
covers:
  - Safing modes and the rule that safe must be reachable, stable and exitable only by an explicit decision
---

Think about a fire drill at school. Three rules make it work. First, every room has a route to an exit — not most rooms, every one, including the new art room added last summer. Second, the meeting spot is out on the field, not in the building's own hallway, so it still works when the building is the thing on fire. Third, nobody goes back inside because the smoke *seems* to have cleared. They wait until the fire chief says so.

A spacecraft's **safe mode** — the fallback it drops into when something goes wrong — follows the same three rules. Every mode must have a route to it. It must keep working without the equipment that may have failed. And the vehicle leaves it only when a person decides to.

Lesson 2 built a mode table for a small satellite and made those rules true *by construction*: it gave every mode an unconditional edge to `SAFE` and gave `SAFE` exactly one exit, gated by a ground command. That is a good way to *design* the property in. It is not proof that the property *holds*. Everything this module has shown since — a shared defect that fools a voter, a slow drift that sneaks under a monitor — says to distrust "I designed it that way, so it must be true". This lesson replaces the claim with a proof, then breaks it on purpose with a change that looks perfectly reasonable in a code review, to show what the proof catches that people miss.

## Three properties of a safe mode

Here are the fire-drill rules in engineering words.

**Reachable.** Every mode has a path to safe. There must be no corner of the mode table from which the vehicle cannot be commanded somewhere survivable. That is why the edge to safe is unconditional: the moment you most need safe mode is the moment something has broken, and a guard on that edge could be the very thing the fault stops from becoming true.

**Stable.** Once in safe mode, the vehicle can stay there indefinitely using the smallest set of working equipment. Safe mode must not depend on the unit whose failure sent it there — the meeting spot is outside the building.

**Exitable only by an explicit decision.** No onboard logic may decide on its own that things look fine again. An automatic exit risks the vehicle **[[cycling in and out of safe|safe-cycling]]** while the real fault is still there, which is worse than staying put.

One twist: "safe" does not always mean "quiet". For a satellite it usually means pointing the solar panels at the Sun and waiting. For a **[[booster on a landing burn|phase-dependent]]**, shutting down is not survivable at all; the survivable action may be to keep flying the burn. So what safe mode *does* has to be designed for each flight phase.

::: key
Properties of a safing mode: reachable from everywhere, stable once entered without depending on whatever failed, and exited only by an explicit decision — never autonomously. What "safe" means is phase-dependent: on a landing burn the survivable action may be to keep flying the burn.
:::

::: key
The one non-negotiable property of a mode state machine: every mode has an unconditional transition to safe. No reachable state may exist from which the vehicle cannot be commanded somewhere survivable.
:::

## The property as a graph question

A mode table is a **[[directed graph|directed-graph]]**: a set of dots joined by one-way arrows. Each mode is a dot, called a **node**. Each legal transition is an arrow, called an **edge**, pointing from the mode you leave to the mode you enter. "One-way" matters: `STANDBY` → `SUN_POINT` being legal says nothing about `SUN_POINT` → `STANDBY`.

Two of the three properties become questions about this picture.

- **Reachable:** from every node, can you follow arrows and arrive at `SAFE`? Not "from the nodes someone checked by hand" — from every one, including any added after the first design.
- **Exitable only by explicit decision:** is every arrow *leaving* `SAFE` marked as needing an explicit command, with no other way out?

Notice one thing about the first question. We follow arrows without asking whether each arrow's guard is true right now. That is a question about the **shape** of the table, which we can answer without running the vehicle. For ordinary edges, a path on paper might be blocked in flight by a guard that never comes true. But the edges *into* `SAFE` have no guard at all. So if a mode has a direct edge to `SAFE`, the path on paper is also a path in flight. That is one more reason the safing edges are unconditional: it makes the shape of the table tell the truth.

Reachability is a question a computer answers exactly. For any finite table, a search either confirms every node has a path or names the ones that do not. A careful human read is limited by what one person notices, and this module's whole second half has been faults that hide from a check that only looks where you expect trouble.

## Searching backward from SAFE

The obvious method is to start a search from each mode in turn and see whether it finds `SAFE`. That works, but it repeats the job once per mode. There is a neater trick: search once, backward.

Build the **reverse graph**: flip every arrow, so wherever the table has $a \to b$ ("a to b"), the reverse graph has $b \to a$. Then start at `SAFE` and find everything you can reach in the reverse graph. Anything you reach has a forward path *to* `SAFE` in the real table. Anything left over has none.

The search itself is **[[breadth-first search|breadth-first]]**. Keep a set of nodes already found and a queue of nodes waiting to be explored. Put `SAFE` in both. Then repeat: take the next node off the queue, look at each node with an arrow into it, and any you have not seen yet goes into the found set and onto the queue. Stop when the queue is empty.

::: note Why the backward search finds exactly the right nodes
Take any path in the reverse graph from `SAFE` to some mode $X$: $\text{SAFE} \to n_1 \to n_2 \to \cdots \to X$. Each reverse arrow $u \to v$ exists only because the real table has $v \to u$. So read the same list of nodes backward, $X \to \cdots \to n_2 \to n_1 \to \text{SAFE}$, and every step is a real arrow. That is a forward path from $X$ to `SAFE`. The argument runs the other way too: any forward path to `SAFE`, flipped, is a reverse path from `SAFE`. So "reached from `SAFE` in the reverse graph" and "has a path to `SAFE` in the real table" pick out exactly the same nodes.

The search also finishes quickly. Each node enters the queue at most once, and each arrow is looked at once when its end node is taken off the queue. So the work grows in direct proportion to (number of modes) + (number of transitions) — what programmers call **linear time**.
:::

::: example Confirming the property on lesson 2's table
The table below is lesson 2's: six modes, six nominal transitions, five safing edges and one recovery edge. Each edge is written as (from, to, guard name, needs explicit command).

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

**Step 1.** The loop builds `reverse`: for each edge $a \to b$ it records $a$ in the list for $b$. So `reverse["SAFE"]` holds all five non-safe modes.

**Step 2.** The search starts at `SAFE`, takes it off the queue, and finds those five modes in one step. Each goes into `reached`. Exploring them adds nothing new.

**Step 3.** All six modes are in `reached`, so the leftover set is empty. Reachability holds.

**Step 4.** The second check lists the edges leaving `SAFE`. There is one, to `STANDBY`, and its explicit flag is `True`. Exitability holds.

Sanity check: six modes in, six found, one door out with a command on it — the same shape lesson 2 designed. And the search never looked at `self_test_pass` or any other guard's value. It answered a question about shape.
:::

## A change that looks complete, and is not

Now make the kind of change real programs make all the time: add a capability. A later engineer adds a gyro **[[calibration|calibration]]** sequence with two new modes. It starts from `STANDBY`, runs `CALIBRATE`, checks the result in `CAL_VERIFY`, and loops back to `CALIBRATE` to retry if needed. The plan is to wire it back into the rest of the table once the calibration logic is finished.

The diff adds an entry edge and two internal edges. Each one is sensible. At a glance it looks like a small, self-contained addition — exactly the kind of change that sails through a routine review.

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

**Step 1.** In the reverse graph, `SAFE` still points back to the original five non-safe modes, and the search finds them as before.

**Step 2.** Could the search reach `CALIBRATE`? Only if `CALIBRATE` had an arrow into something already found. Its one outgoing arrow goes to `CAL_VERIFY`. Same question for `CAL_VERIFY`: its one outgoing arrow goes back to `CALIBRATE`. The two only point at each other.

**Step 3.** The search ends with eight modes in the table and six found. The leftover two are reported.

Every edge in the diff is real and does something sensible. What the diff cannot show — a diff shows what changed, not what the whole graph now looks like — is that neither new mode has any arrow leading back out. A vehicle that enters `CALIBRATE` and never finishes, or keeps retrying, has no path to safety. No single new transition is wrong. The new corner of the graph was never connected back.

The search finds this in a moment over eight nodes. A reviewer reading two sensible-looking new modes has no comparable way to notice.
:::

::: key
Reachability is a property of the whole graph, not of any single row. A change can add only transitions that are each correct and still break the property. Check the graph after every change, not the diff.
:::

## Checking "stable"

Graph search checks reachable and exitable. Stable needs a different check, but it can be mechanical too. List what safe mode **depends on**: the sensors, actuators and radios it uses. List the faults that **trigger** safe mode, and which unit each one blames — that list comes straight from the FMEA of lesson 10. Any unit on both lists is a problem: safe mode would be leaning on the very thing that failed.

::: example Does safe mode lean on what failed?
A small satellite's safe mode points at the Sun using its **coarse sun sensors**, controls attitude with **[[magnetorquers|magnetorquers]]**, and keeps its receiver on.

```python
SAFE_MODE_USES = {"coarse_sun_sensors", "magnetometer", "magnetorquers", "receiver"}
SAFING_TRIGGERS = {
    "star_tracker_fault": "star_tracker",
    "wheel_fault": "reaction_wheels",
    "gyro_fault": "gyros",
    "css_fault": "coarse_sun_sensors",
}
for trigger, unit in sorted(SAFING_TRIGGERS.items()):
    if unit in SAFE_MODE_USES:
        print(f"UNSTABLE: {trigger} sends us to a safe mode that uses {unit}")
print("safe mode avoids:", sorted(u for u in SAFING_TRIGGERS.values() if u not in SAFE_MODE_USES))
# UNSTABLE: css_fault sends us to a safe mode that uses coarse_sun_sensors
# safe mode avoids: ['gyros', 'reaction_wheels', 'star_tracker']
```

**Step 1.** Three triggers blame units that safe mode never uses: the star tracker, the wheels, the gyros. For those faults, safe mode is independent of what broke. Good.

**Step 2.** The fourth trigger, a coarse sun sensor fault, blames a unit safe mode relies on to find the Sun. That entry is flagged.

**Step 3.** The fix is a design decision, not a code tweak: for example, a safe-mode variant that holds a slow spin without sun sensors, or a second, separate set of sun sensors. After the fix, re-run the check.

Sanity check: four triggers, three clear, one flagged, and the flagged one is exactly the unit on both lists.
:::

## Why this has to run on every change

A six-mode table is small enough that a determined reviewer might have caught the `CALIBRATE` gap by hand. Real mode tables grow well past six: contingency modes, calibration sequences, payload modes, each added by a different engineer at a different time. The number of paths a reviewer would need to hold in mind grows with the table. The time for any one review does not.

The search, though, costs almost nothing. It is linear in the size of the table, so it can run as an automatic check on **[[every single change|every-change]]**, the same way a test suite runs on every code change. Run that way, the `CALIBRATE` gap is caught the moment it is written, before it reaches a reviewer at all. That is a far stronger guarantee than hoping whoever reviews that diff is having a careful day.

::: warning
"We reviewed the mode table and it looked right" is not evidence that the reachability property holds — for the same reason "the three channels agreed" was not evidence of correctness in lesson 6. A review, like a vote, checks whether something looks consistent with what you expected, not whether a specific property is true of the whole structure. Run the search; do not substitute a review for it.
:::

## Check yourself

::: check
Explain why "this mode is reached from `SAFE` in the reverse graph" means the same as "`SAFE` is reached from this mode in the original graph". Why does that let you run the search only once?
:::

::: answer
The reverse graph has an arrow $b \to a$ exactly when the original has $a \to b$. So a path in the reverse graph from `SAFE` to mode $X$ is the same list of transitions as a path from $X$ to `SAFE` in the original, read in the opposite order. Every step, flipped back, is a real transition.

Because one search from `SAFE` in the reverse graph finds every mode with a path to `SAFE`, you run it once, from one node, instead of once per mode.
:::

::: check
The `CALIBRATE` change added three edges, and each is a valid transition. Why does the graph still fail the reachability property, and what does that tell you about reviewing a mode-table change by reading only the new edges?
:::

::: answer
The property needs every mode to have a path to `SAFE`. `CALIBRATE` and `CAL_VERIFY` only point at each other, never back at any of the original six modes or at `SAFE`. However many times the retry loop runs, no path leads out.

Reading only the new edges checks that each one makes sense on its own. It cannot show whether the new modes, taken together, connect back to the rest of the graph. Reachability is a whole-graph property, so it needs a whole-graph check.
:::

::: check
A colleague says that once a mode table has passed the reachability check, it does not need checking again unless someone remembers to re-run it before the next flight. What is wrong with this plan?
:::

::: answer
The `CALIBRATE` example is exactly a table that passed, then was broken by a later, reasonable-looking change that did not touch anything previously checked. "Remembering to re-run it" depends on a person realizing that a change might affect reachability — the very judgment the automatic search exists to remove. The check must run on every change to the table, automatically, like a test suite.
:::

::: check
Name the three properties a safing mode must have. Which does the reverse-reachability search verify, which does the `leaving_safe` check verify, and how is the third one checked?
:::

::: answer
Reachable, stable, and exitable only by an explicit decision.

The reverse-reachability search verifies **reachable**: every mode has a path to `SAFE`. Reading the edges leaving `SAFE` and confirming each is tagged explicit verifies **exitable only by explicit decision**. A table could pass one and fail the other — every mode might reach `SAFE` while an untagged edge lets the vehicle leave `SAFE` on its own judgment.

**Stable** is not a graph question. It is checked by crossing the list of units safe mode depends on with the list of units whose faults trigger safing, and making sure no unit is on both.
:::

::: check
Another engineer proposes fixing the `CALIBRATE` bug with a direct edge `CALIBRATE` → `SAFE`, leaving `CAL_VERIFY` untouched. Does this fix both new modes? Trace the search rather than guessing.
:::

::: answer
Yes, in this case. In the reverse graph, `SAFE` now has an arrow to `CALIBRATE`, so the search reaches `CALIBRATE`. `CAL_VERIFY` has a real edge `CAL_VERIFY` → `CALIBRATE` (the retry), which in the reverse graph is `CALIBRATE` → `CAL_VERIFY`, so the search reaches `CAL_VERIFY` next. Both are found.

But it worked only because `CAL_VERIFY` happened to point at `CALIBRATE`. Had its only edge gone to some third, still-disconnected mode, the same fix would have repaired `CALIBRATE` alone. That is why you re-run the search after every proposed fix instead of trusting that it "sounds right".
:::

::: check
A booster is descending on its landing burn when a sensor fault triggers safing. A teammate says safe mode should shut the engine down and hold attitude, "like the satellite does". What is wrong with that?
:::

::: answer
What "safe" means depends on the flight phase. A satellite can sit still, pointed at the Sun, and survive for days. A booster seconds from the ground cannot: shutting the engine down means hitting the ground at full speed. The survivable action in that phase may be to keep flying the burn, perhaps with a simpler guidance law or reduced sensor set. Safe mode must be designed for each phase, not copied from another vehicle.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Reachable | Every mode has a directed path to `SAFE`; no corner of the table is a trap |
| Stable | Safe mode holds indefinitely on minimal equipment, never on the unit that failed |
| Exitable only by explicit decision | Every edge leaving `SAFE` needs an explicit command; no autonomous exit |
| Phase-dependent safe | What safe mode does is designed per phase; on a landing burn it may mean keep flying |
| Directed graph | Modes are nodes, legal transitions are one-way edges |
| Reverse-reachability search | Flip every edge, breadth-first search from `SAFE`; nodes found have a forward path to `SAFE` |
| Linear time | Work grows in proportion to modes + transitions; cheap enough for every change |
| A diff is not the graph | Individually valid new edges can leave a new corner cut off from safety |
| Stability check | No unit safe mode uses may also be a unit whose fault triggers safing |

This finishes the module's mode-manager thread: a safing property designed in, then proved. The final lesson turns from what the software does at runtime to how a program keeps it trustworthy as it changes — tracing each requirement to its code and test, managing tunable data apart from the executable, and deciding when an update in flight is the safer choice.

::: context safe-cycling Why an automatic exit is worse than staying
Suppose safe mode exited by itself whenever the fault symptom went quiet. A flaky sensor that fails for a minute, recovers, and fails again would drag the vehicle out of safe, back into normal operations, and straight back into safe, over and over. Each switch is a moment of risk: attitude changes, equipment powering up and down, commands half-finished. It is the same chattering that hysteresis stops in a fault monitor (lesson 9). Requiring a person to decide breaks the loop, and it gives the ground time to understand the fault before trusting the vehicle again.
:::

::: context phase-dependent Safe on a satellite, safe on a booster
The same word covers two very different actions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="40" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">Sun</text>
  <rect x="100" y="28" width="24" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="76" y="34" width="24" height="12" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <rect x="124" y="34" width="24" height="12" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <line x1="60" y1="40" x2="74" y2="40" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="112" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">satellite: point panels</text>
  <text x="112" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">at the Sun and wait</text>
  <line x1="190" y1="150" x2="350" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <rect x="262" y="40" width="16" height="70" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="262,110 278,110 274,120 266,120" fill="#6c7a93"/>
  <polygon points="264,120 276,120 270,142" fill="#b4232c"/>
  <text x="300" y="60" font-size="11" fill="#1f2a44">booster:</text>
  <text x="300" y="74" font-size="11" fill="#1f2a44">keep the</text>
  <text x="300" y="88" font-size="11" fill="#1f2a44">burn going</text>
  <line x1="220" y1="40" x2="220" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,130 214,118 226,118" fill="#1d6fd1"/>
  <text x="212" y="80" font-size="11" text-anchor="end" fill="#1d6fd1">falling</text>
</svg>
```

For the satellite, doing less is safer. For the booster, doing less means hitting the ground.
:::

::: context directed-graph Lesson 2's table as dots and arrows
Every mode is a dot. Every legal transition is a one-way arrow. The safing arrows (red) run from every other mode into `SAFE`; one blue arrow leaves it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
    <marker id="r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
    <marker id="b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
  </defs>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="10" y="20" width="56" height="24" rx="4" fill="#fff" stroke="#1f2a44"/><text x="38" y="36">BOOT</text>
    <rect x="80" y="20" width="64" height="24" rx="4" fill="#fff" stroke="#1f2a44"/><text x="112" y="36">STANDBY</text>
    <rect x="158" y="20" width="76" height="24" rx="4" fill="#fff" stroke="#1f2a44"/><text x="196" y="36">SUN_POINT</text>
    <rect x="248" y="20" width="48" height="24" rx="4" fill="#fff" stroke="#1f2a44"/><text x="272" y="36">SLEW</text>
    <rect x="232" y="84" width="92" height="24" rx="4" fill="#fff" stroke="#1f2a44"/><text x="278" y="100">PAYLOAD_OPS</text>
    <rect x="120" y="160" width="60" height="26" rx="4" fill="#f2b880" stroke="#b4232c" stroke-width="2"/><text x="150" y="177">SAFE</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.3" fill="none" marker-end="url(#a)">
    <line x1="66" y1="32" x2="78" y2="32"/>
    <line x1="144" y1="28" x2="156" y2="28"/>
    <line x1="158" y1="38" x2="146" y2="38"/>
    <line x1="234" y1="32" x2="246" y2="32"/>
    <line x1="280" y1="44" x2="280" y2="82"/>
    <path d="M240,84 Q215,70 205,46"/>
  </g>
  <g stroke="#b4232c" stroke-width="1.3" fill="none" marker-end="url(#r)">
    <line x1="38" y1="44" x2="124" y2="160"/>
    <line x1="106" y1="44" x2="138" y2="158"/>
    <line x1="190" y1="44" x2="156" y2="158"/>
    <line x1="266" y1="44" x2="170" y2="158"/>
    <line x1="260" y1="108" x2="182" y2="166"/>
  </g>
  <path d="M120,174 Q60,140 96,46" fill="none" stroke="#1d6fd1" stroke-width="1.8" marker-end="url(#b)"/>
  <text x="50" y="130" font-size="11" fill="#1d6fd1">ground cmd</text>
</svg>
```

Count them: six black nominal arrows, five red safing arrows, one blue recovery arrow — twelve edges, matching the table in the example.
:::

::: context breadth-first Searching in rings
Breadth-first search explores like ripples from a stone dropped in a pond. First everything one step from the start, then everything two steps away, and so on. The queue is what keeps the order: nodes found earlier are explored earlier. For reachability the order does not matter much — any complete search gives the same answer — but breadth-first has a bonus: it finds the *shortest* path to each node, which is handy when you want to report how many transitions separate a mode from safety.
:::

::: context calibration Why a gyro needs calibrating
Every gyro has a small **bias**: it reads a tiny rate even when perfectly still. The bias wanders slowly with temperature and age. A calibration sequence holds the spacecraft steady, or turns it through known angles checked against a star tracker, and estimates the bias so the software can subtract it. It is routine, which is exactly why adding it looks harmless — and why the missing escape edge in the example is so easy to overlook.
:::

::: context magnetorquers Steering with Earth's magnetic field
A magnetorquer is a coil of wire, often wound on a metal rod. Run current through it and it becomes a weak electromagnet that pushes against Earth's magnetic field, slowly turning the spacecraft. It has no moving parts and uses no propellant, only electricity from the solar panels. That simplicity makes magnetorquers a favorite for safe mode on satellites in low orbit: they are weak and slow, but they are very unlikely to be the thing that failed.
:::

::: context every-change Checks that run by themselves
Most flight software teams use **continuous integration**: every time someone submits a change, a server builds the software and runs the automatic checks, and the change cannot merge until they pass. Adding the reachability search to that list costs a fraction of a second. Some programs go further with **model checkers** — tools such as SPIN, used at NASA's Jet Propulsion Laboratory — that explore every reachable state of a design, including guard conditions and timing, rather than only the shape of a table.
:::
