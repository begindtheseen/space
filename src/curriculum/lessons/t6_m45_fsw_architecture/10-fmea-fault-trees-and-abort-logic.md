---
id: l10-fmea-fault-trees-abort
title: FMEA, fault trees, and the abort decision
minutes: 27
covers:
  - FMEA and fault trees; identifying the single points of failure a voter does not cover
  - Abort logic and autonomous flight termination systems
---

Picture packing for a camping trip. A careful camper goes down the gear list and asks of each item: "What if this one breaks?" The tent pole snaps — bring tape. The stove will not light — bring matches. Then she hits an item where the honest answer is "nothing": if the only map gets soaked, there is no backup. That line is the one worth finding before the trip.

A second camper works the other way. She starts from the outcome she fears — "cold and wet in the dark" — and asks what would have to happen: the tent fails *and* it rains, or the group gets lost. Working backward shows which worry is the big one.

Flight software engineers use both habits as tools. The **FMEA** — failure modes and effects analysis — is a table with one row per way a part can break. The **fault tree** works backward from one bad outcome and combines the chances of its causes. Lesson 9 taught how a monitor *detects* a fault; these tools ask whether the design can detect *every* way things break, and what the software does about each.

Then comes the weightiest decision a flight computer can make: an **abort**, and in the most serious case ending a flight that has become a danger to people on the ground. It is built from nothing new: a monitored condition, a fixed rule, bounded time, exhaustive testing, and authority split so no single chain of software decides alone.

## FMEA: one row per way a part can break

An FMEA is a table. Each row is one **[[failure mode|failure-mode]]** — one specific way a part can go wrong, like "the gyro output freezes" rather than the vague "the gyro fails". A gyro, remember, is the sensor that measures how fast the vehicle is turning.

The columns force a concrete answer for each row:

- **Failure mode** — what breaks, and how.
- **Local effect** — what happens right at the part.
- **Vehicle effect** — what that does to the whole vehicle.
- **Detection** — what, exactly, notices it.
- **Isolation** — how the software works out *which* unit is to blame.
- **Response** — what the software does next.
- **Residual risk** — how bad things are if the detection fails.

Here is a small FMEA for three gyros that feed the navigation filter. The lesson numbers point back to where each tool was built.

| Failure mode | Local effect | Vehicle effect | Detection | Isolation | Response | Residual risk if detection fails |
| --- | --- | --- | --- | --- | --- | --- |
| Gyro total loss (no output) | Channel silent | One of three rate sources gone | Data-integrity check (lesson 4): no packets, sequence counter stalls | Easy — the silent channel | Continue on the other two, flag | Low — a silent unit announces itself |
| Gyro stuck at a plausible value | Channel reports a fixed value that looks like a real, steady rate | Filter may trust a frozen input | Cross-check against the other two channels (lesson 6's voter) | Voter isolates it once the vehicle really turns and the frozen channel falls out of step | Exclude, continue on two | High until the vehicle turns enough to expose the frozen value |
| Slow bias drift, within the valid range | Error grows slowly, never plainly out of family | Filter takes in a slowly wrong measurement | Residual monitor (lesson 9) against the other channels | Persistence counter blames the drifting unit once it crosses the threshold | Exclude once declared | High early in the drift — lesson 9's ramp-versus-step result |
| Shared calibration constant wrong in all three | All three agree, all three wrong | Filter takes in a confidently wrong measurement | **None** among the three channels (lesson 6's common-mode result) | Not possible from these three alone | Needs an independent way of measuring, outside this group of three | Full — no answer inside this triad |
| Bus delivers correct data late, past its staleness limit | Value right, timing wrong | A loop treats an old value as current | Staleness check (lesson 4) | Easy — the packet's own timestamp | Reject, hold the last good value or fall back | Low, if the staleness limit was set right |

Read the fourth row slowly. Its empty detection cell is the most useful cell in the table. It names a **[[single point of failure|single-point]]** — one fault that, on its own, defeats the design, which the rest of the design had quietly assumed away.

::: key
The most valuable row in an FMEA is not the one with a clean detection story. It is the one whose detection column is honestly empty. That row names a single point of failure, and finding it on paper, during design, is the whole reason to build the table instead of trusting that redundancy has covered everything.
:::

Why can the voter not go in that empty cell? Lesson 6 showed it: a voter checks whether the three channels *agree*. A shared defect makes all three wrong in exactly the same way, so they agree perfectly and the voter reports full health. The fault is **common-mode** — one cause hitting every copy at once.

::: key
TMR with voting covers independent random hardware faults — a single upset or failure is outvoted. It does NOT cover common-mode faults: the same software defect, the same bad table, the same wrong input, or a shared power or timing source.
:::

::: warning
The tempting shortcut is to skip the shared-calibration row because "the voter handles redundancy". That is exactly how single points of failure survive to flight. Write the row, and leave the detection column empty if nothing fills it. An empty cell you can see is a problem you can fix. A row you never wrote is a problem you will meet in flight.
:::

## Filling the empty row

If comparing the copies cannot find a shared fault, what can? Something that does not share it. There are four common answers.

**A different way of measuring the same thing.** A gyro measures turn rate by one physical effect. A **[[star tracker|independent-principle]]** — a camera that recognizes star patterns — measures which way the vehicle points by a completely different one. Turn the gyro rates into an attitude over time and compare it with the star tracker. A calibration error baked into all three gyros will not be baked into a camera. The residual monitors of lesson 9 do exactly this comparison.

**A simpler independent monitor.** Write a much smaller program that only checks whether the answer is reasonable: "the commanded rate is below the structural limit", "altitude is falling during descent". A small checker is easier to get right, and it does not share the voting copies' defect.

**Design diversity.** Two or more teams write the same function separately, from the same requirement, and the versions are compared. This is called **[[N-version programming|n-version]]**. It is expensive, and it helps less than you might hope, because independent teams tend to make mistakes in the same hard spots.

**Verification.** Find the defect before flight: requirements-based testing of every case, independent review, and where it pays, mathematical proof. Most programs put the bulk of their money here and into independent monitors, rather than into diversity.

## Fault trees: working backward from the bad outcome

An FMEA works outward from a part: "if this breaks, what happens?" A fault tree works backward from a bad outcome, called the **top event**: "what would have to happen for this to occur?" The causes at the bottom, which you already have probabilities for, are the **basic events**. They join through two kinds of **[[logic gate|gate-symbols]]**.

- An **AND gate** fires only if *every* input below it happens. More inputs make it *less* likely, because more things must all go wrong at once.
- An **OR gate** fires if *any* input below it happens. More inputs make it *more* likely, because there are more ways in.

For independent basic events with probabilities $p_1, p_2, \ldots, p_n$ (read "p one, p two, up to p n"), the gates combine like this. The symbol $\prod$ ("product of") means multiply them all together:

$$
P_{\text{AND}} = p_1 \, p_2 \cdots p_n = \prod_{i} p_i,
\qquad
P_{\text{OR}} = 1 - \prod_{i} (1 - p_i).
$$

When every $p_i$ is small, the OR formula is very close to adding them up: $P_{\text{OR}} \approx p_1 + p_2 + \cdots + p_n$.

::: key
AND gate: all inputs must happen; for independent events multiply, so the result is smaller than any input. OR gate: any input suffices; $P = 1 - \prod(1 - p_i)$, about the sum when the $p_i$ are small, so the result is larger than any input.
:::

::: note Why the gates have to work this way
**AND.** For independent events, the chance that both happen is the chance of the first times the chance of the second. Flip two coins: the chance of two heads is $\tfrac{1}{2} \times \tfrac{1}{2} = \tfrac{1}{4}$. More inputs mean more factors below $1$, so the product keeps shrinking.

**OR.** "At least one happens" is the opposite of "none happens". The chance that input $i$ does *not* happen is $1 - p_i$. The chance that none happens is the product $\prod (1 - p_i)$. So at least one happens with probability $1 - \prod (1 - p_i)$. For two inputs this expands to $1 - (1 - p_1)(1 - p_2) = p_1 + p_2 - p_1 p_2$. When both are small, the last term $p_1 p_2$ is tiny, which is why adding is such a good shortcut.
:::

::: example A top event built from a fault tree
Top event: "the vehicle acts on a wrong attitude solution." It happens in two ways, joined by an OR gate:

- an AND gate: a plausible-but-wrong reading occurs **and** the independent cross-check misses it (its **false-negative rate** is how often it stays quiet when it should fire); or
- the cross-check was not available on that axis at all.

```python
p_plausible_wrong_reading = 2.0e-5    # from the FMEA's stuck-at-plausible row
p_cross_check_misses_it = 3.0e-3      # false-negative rate of the independent monitor
p_and_gate = p_plausible_wrong_reading * p_cross_check_misses_it

p_no_cross_check_axis = 1.0e-6        # chance the monitor is unavailable on this axis
p_top = 1 - (1 - p_and_gate) * (1 - p_no_cross_check_axis)

print(f"AND gate: P(undetected wrong reading) = {p_and_gate:.3e}")
print(f"P(top event) = {p_top:.3e}")
print("dominant contributor:", "AND gate" if p_and_gate > p_no_cross_check_axis else "missing cross-check")
# AND gate: P(undetected wrong reading) = 6.000e-08
# P(top event) = 1.060e-06
# dominant contributor: missing cross-check
```

**Step 1, the AND gate.** Multiply the two small chances: $2.0 \times 10^{-5} \times 3.0 \times 10^{-3} = 6.0 \times 10^{-8}$. Two small numbers multiplied make a much smaller one. That is where redundancy earns its keep.

**Step 2, the OR gate.** Combine $6.0 \times 10^{-8}$ with the $1.0 \times 10^{-6}$ chance that no cross-check exists: $1 - (1 - 6.0 \times 10^{-8})(1 - 1.0 \times 10^{-6}) \approx 1.06 \times 10^{-6}$. The shortcut gives the same: $0.06 \times 10^{-6} + 1.0 \times 10^{-6}$.

**Step 3, read it.** The "no cross-check" term is about $17$ times bigger than the AND gate, even though both numbers looked small on their own. So it sets the answer. The biggest lever is making sure the cross-check *exists* on every axis, not making a working cross-check even better.

Sanity check: the top event ($1.06 \times 10^{-6}$) is bigger than either input, as an OR gate must be.
:::

::: example When the AND gate lies: a shared cause
Three gyros each fail with probability $p = 1.0 \times 10^{-3}$ over a mission. The fault tree says "all three fail" is an AND gate, so

$$
p^3 = (1.0 \times 10^{-3})^3 = 1.0 \times 10^{-9}.
$$

One in a billion. But suppose $1\%$ of gyro failures come from a **[[shared cause|common-cause]]** that takes out all three at once — a bad batch of parts, a shared power supply. Engineers write that fraction as $\beta$ ("beta"), here $\beta = 0.01$.

**Step 1.** The shared-cause chance is $\beta p = 0.01 \times 1.0 \times 10^{-3} = 1.0 \times 10^{-5}$.

**Step 2.** The truly independent part of each failure is $(1 - \beta)p = 9.9 \times 10^{-4}$, so all three failing independently is $(9.9 \times 10^{-4})^3 \approx 9.7 \times 10^{-10}$.

**Step 3.** Either route loses all three (an OR gate), so the total is about $1.0 \times 10^{-5} + 9.7 \times 10^{-10} \approx 1.0 \times 10^{-5}$.

The honest answer is about ten thousand times worse than the naive $10^{-9}$. A tiny shared cause swamps the product.
:::

::: warning
Multiplying at an AND gate is only allowed when the inputs are truly independent. Before you multiply, ask what the inputs share: code, a table, power, a clock, a batch of parts, a mounting bracket. Anything shared is a common cause, and it belongs in the tree as its own basic event under an OR gate.
:::

## Abort logic: the same pattern, at the highest stakes

An **abort** is a decision to leave the planned mission sequence and head for a survivable outcome. In this module's terms it is usually a transition that lesson 2's mode manager makes into, or through, `SAFE`.

The most serious case is **flight termination**. A launch range approves safety limits before flight. If the vehicle strays far enough past them to threaten people, powered flight is ended. Older systems left that decision to a human safety officer watching radar. Modern vehicles carry an **[[autonomous flight termination system|afss]]**: a flight computer that checks the vehicle's state against the approved limits and can decide itself when there is no time to wait for a person.

This lesson covers only the **software and decision logic** of that authority: what is monitored, how the decision is computed, and how authority is shared. Any mechanism that physically carries out a termination is not GNC content and not this module's subject.

What does the computer watch? Quantities the vehicle's own navigation and guidance already produce:

- the **[[instantaneous impact point|impact-point]]** — where the vehicle would come down if its engines stopped right now — compared with the approved limits;
- turn rates or attitudes beyond what controlled flight could produce;
- how long the navigation solution has been invalid, compared with a fixed time limit.

The inputs are the checked, fresh, cross-checked estimates of lessons 4, 6 and 9. The rule is a fixed table of tests, shaped like lesson 2's guard conditions.

::: example A fixed rule table, evaluated in bounded time
```python
def evaluate_abort_rules(telemetry, rules):
    """Fixed, ordered rule table. Runs in bounded time: at most len(rules)
    comparisons, no data-dependent loops, no recursion, no allocation."""
    for checks, (name, predicate) in enumerate(rules, start=1):
        if predicate(telemetry):
            return name, checks
    return None, len(rules)

RULES = [
    ("trajectory_deviation", lambda tm: abs(tm["cross_track_m"]) > 1200.0),
    ("rate_excursion", lambda tm: abs(tm["body_rate_dps"]) > 25.0),
    ("loss_of_nav", lambda tm: not tm["nav_valid"]),
]

cases = [("nominal", {"cross_track_m": 300.0, "body_rate_dps": 4.0, "nav_valid": True}),
         ("off course", {"cross_track_m": 1500.0, "body_rate_dps": 4.0, "nav_valid": True}),
         ("nav lost", {"cross_track_m": 300.0, "body_rate_dps": 4.0, "nav_valid": False})]
for label, tm in cases:
    result, checks = evaluate_abort_rules(tm, RULES)
    print(f"{label}: {'TRIP ' + result if result else 'no trip'} ({checks}/{len(RULES)} rules evaluated)")
# nominal: no trip (3/3 rules evaluated)
# off course: TRIP trajectory_deviation (1/3 rules evaluated)
# nav lost: TRIP loss_of_nav (3/3 rules evaluated)
```

**Nominal:** $300\,\mathrm{m}$ off track is inside the $1200\,\mathrm{m}$ limit, $4$ degrees per second is under $25$, navigation is valid — no trip. **Off course:** $1500\,\mathrm{m}$ is past $1200\,\mathrm{m}$, so the first rule trips after one check. **Nav lost:** the first two rules pass and the third trips.

No call does more than three comparisons, so the worst case is known before the software runs — the **bounded-time** property the real-time module before this one demands of anything with a hard deadline. And a fixed, short rule set is **testable**: every rule, alone and in combination, can be exercised before flight, the way lesson 2's cross-product test tried every pair of modes.
:::

**Deterministic** means the same telemetry gives the same decision every time, on every redundant string. That is lesson 7's requirement, now applied to the most serious decision the software makes. A rule table with no hidden memory, no dependence on the order tasks run in, and no floating-point sums whose order can change between copies is deterministic by construction.

## Divided authority

What if the one chain of software making a decision is itself wrong? For a decision this serious, a single chain is a single point of failure — the empty FMEA cell again. The answer is **divided authority**: no one chain of computation holds the decision alone. Where time allows, a human range-safety officer also keeps the power to enable, inhibit or override the automatic system.

There are two ways to combine two independent chains, and they are the two fault-tree gates.

- **Concurrence** (an AND): both chains must reach the same conclusion before anything happens. One chain misfiring cannot act alone, so false trips become far rarer.
- **Either-may-act** (an OR): either chain can act on its own. One chain missing a real problem is covered by the other, so missed trips become far rarer.

::: example Concurrence: two independent chains must agree
```python
def concurrence(primary_flags_trip: bool, monitor_flags_trip: bool) -> bool:
    return primary_flags_trip and monitor_flags_trip

for p, m in [(True, True), (True, False), (False, True), (False, False)]:
    print(f"primary={p!s:5} monitor={m!s:5} -> executes: {concurrence(p, m)}")
# primary=True  monitor=True  -> executes: True
# primary=True  monitor=False -> executes: False
# primary=False monitor=True  -> executes: False
# primary=False monitor=False -> executes: False
```

Only the first line acts: neither chain alone can trigger the action. Now put numbers on the trade. Say each chain has a false-trip chance of $1.0 \times 10^{-4}$ and a missed-trip chance of $1.0 \times 10^{-5}$ per flight, independently.

**With concurrence (AND).** A false trip needs both chains to misfire: $(1.0 \times 10^{-4})^2 = 1.0 \times 10^{-8}$. But a missed trip happens if *either* chain misses, an OR: about $1.0 \times 10^{-5} + 1.0 \times 10^{-5} = 2.0 \times 10^{-5}$.

**With either-may-act (OR).** A false trip happens if either misfires: about $2.0 \times 10^{-4}$. A missed trip needs both to miss: $(1.0 \times 10^{-5})^2 = 1.0 \times 10^{-10}$.

Each choice makes one error ten thousand times rarer and the other about twice as common. Which to pick depends on which error is worse. For flight termination a missed trip can endanger the public, so ranges demand an extremely reliable termination function and set the rules for combining redundant chains. For a crew abort, a false trip is itself dangerous. Either way, no single chain decides alone.
:::

::: warning
"Two chains" only helps if the chains are independent. Two copies of the same code fed the same input are one chain twice — the common-mode trap from the FMEA. Divided authority needs independent sensors, independent logic, or both.
:::

## Why this logic gets the most verification

This decision is automatic, time-bounded and cannot be undone, so programs treat it as the most safety-critical logic on the vehicle. **Safety criticality** — how much harm a defect could cause — sets how much checking a piece of software gets. Checking effort is limited, and the fault tree shows risk is never spread evenly, so it goes where a bug would hurt most. For the abort logic that means:

- requirements-based tests of every rule and every combination the fixed table can produce;
- **[[independent verification and validation|iv-and-v]]** — checking by a team separate from the one that wrote the logic;
- a documented trace from each approved safety limit to the line of code that checks it and the test that exercises that line (lesson 12).

None of this is special machinery. It is this module's ordinary practice, applied with the most care.

## Check yourself

::: check
In the FMEA's shared-calibration-constant row, the detection column is empty. Why is that empty cell more useful than a filled cell in a routine row? Why can voting not fill it, and what could?
:::

::: answer
A filled cell describes a failure the design already handles. The empty cell names a real single point of failure: a fault the design cannot catch.

Voting cannot fill it because a shared defect makes all three channels wrong the same way. They agree, and a voter only checks agreement, so it reports full health.

What can fill it is something that does not share the defect: an independent way of measuring the same quantity (a star tracker checking the gyros), a simpler independent monitor, a separately written version of the logic, or verification that finds the defect before flight.
:::

::: check
In the fault-tree example, suppose the cross-check's false-negative rate improves tenfold, from $3.0 \times 10^{-3}$ to $3.0 \times 10^{-4}$, but the chance that no cross-check exists on an axis stays at $1.0 \times 10^{-6}$. Does the top-event probability improve tenfold? Work it out.
:::

::: answer
The AND gate shrinks tenfold: $2.0 \times 10^{-5} \times 3.0 \times 10^{-4} = 6.0 \times 10^{-9}$.

The OR gate then gives $1 - (1 - 6.0 \times 10^{-9})(1 - 1.0 \times 10^{-6}) \approx 1.006 \times 10^{-6}$.

So the top event goes from about $1.06 \times 10^{-6}$ to about $1.006 \times 10^{-6}$ — roughly a $5\%$ improvement, nowhere near tenfold. The unchanged "no cross-check" term dominates. The fault tree has told you where the risk lives: in availability, not in detection accuracy.
:::

::: check
Four identical flight computers each fail with probability $2.0 \times 10^{-3}$ per mission. Someone computes the chance that all four fail as $(2.0 \times 10^{-3})^4$. What is that number, and what question should you ask before trusting it?
:::

::: answer
$(2.0 \times 10^{-3})^4 = 16 \times 10^{-12} = 1.6 \times 10^{-11}$.

The question: are the four failures really independent? The AND-gate product is only valid if they are. If the computers share software, a power bus, a clock or a batch of parts, a shared cause can take out all four at once. Even a small shared fraction swamps the product — with $\beta = 0.01$ the shared-cause term alone is $0.01 \times 2.0 \times 10^{-3} = 2.0 \times 10^{-5}$, over a million times larger.
:::

::: check
Explain why `evaluate_abort_rules` is said to run in "bounded time". What property of the code, not only its speed in testing, makes that true?
:::

::: answer
The function has no loop whose length depends on the telemetry, no recursion, and no step whose cost changes with the input. It always does at most `len(RULES)` comparisons — three here — and returns. So its worst-case running time can be worked out from the structure of the code alone, before it ever runs. "Bounded" is a property you can prove from the code, not an observation about how fast it happened to run in a test.
:::

::: check
A reviewer proposes letting only the primary chain's decision count, with the independent monitor merely logged for analysis after the flight. What property does this remove, and why is that unacceptable for this decision?
:::

::: answer
It removes divided authority. The action now rests on one chain — a single point of failure, which cannot diagnose its own defect (lesson 6). For an automatic, irreversible decision, a wrong conclusion from that chain — a false trip that destroys a healthy vehicle, or a missed trip — has nothing standing between it and execution. A log read after the flight catches the error too late to matter.
:::

::: check
A junior engineer asks why the abort-logic examples never mention any physical mechanism that acts on the decision. What is the reason, and what is the lesson's subject instead?
:::

::: answer
The subject is the software and decision-authority engineering: what the computer monitors, how the decision is computed deterministically and in bounded time, how it is tested, and how authority is shared. Any mechanism that physically acts on the decision is a separate discipline, outside this module, and left out on purpose.
:::

## Summary

| Term | Meaning |
| --- | --- |
| FMEA | Table: failure mode → local effect → vehicle effect → detection → isolation → response → residual risk |
| Empty detection cell | A single point of failure the design has no answer for |
| Common-mode fault | One cause that hits every redundant copy at once; a voter cannot see it |
| Filling the empty row | Independent measuring principle, simpler independent monitor, design diversity, verification |
| Fault tree | Works backward from a top event through AND and OR gates to basic events |
| AND gate | All inputs needed; multiply independent probabilities; smaller than any input |
| OR gate | Any input suffices; $1 - \prod(1 - p_i) \approx \sum p_i$; larger than any input |
| Shared cause | Breaks the AND-gate product; model it as its own basic event |
| Abort | Leaving the nominal sequence for survivability; usually a transition into or through `SAFE` |
| Autonomous flight termination | Deterministic, bounded-time rules checked against limits approved before flight |
| Divided authority | No single chain decides alone; concurrence (AND) cuts false trips, either-may-act (OR) cuts missed trips |

The next lesson returns to lesson 2's mode manager and replaces "safe is reachable from every state, by construction" with a proof: a graph search over the mode table that either confirms the property or names the exact state that breaks it.

::: context failure-mode A mode is a way, not a part
"Failure mode" uses *mode* in its old sense of "manner" or "way". One part has many failure modes, and each gets its own row because each needs a different detector. A gyro can go silent, freeze, drift, read with the wrong scale, or send good data late. A single row saying "gyro fails" would hide the fact that the voter catches the first and misses others. The skill of FMEA is splitting a part's failures finely enough that every row has one honest answer in the detection column.
:::

::: context single-point Where a single point of failure hides
A single point of failure is any one element whose fault, on its own, defeats the system. In a triple-redundant chain it is rarely a single box. It is whatever the three boxes *share*.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="70" width="90" height="34" rx="4" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="65" y="84" font-size="11" text-anchor="middle" fill="#b4232c">shared</text>
  <text x="65" y="98" font-size="11" text-anchor="middle" fill="#b4232c">calibration table</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="150" y="20" width="70" height="30" rx="4"/>
    <rect x="150" y="72" width="70" height="30" rx="4"/>
    <rect x="150" y="124" width="70" height="30" rx="4"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="185" y="40">gyro A</text><text x="185" y="92">gyro B</text><text x="185" y="144">gyro C</text>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" fill="none">
    <line x1="110" y1="80" x2="150" y2="35"/><line x1="110" y1="87" x2="150" y2="87"/><line x1="110" y1="94" x2="150" y2="139"/>
  </g>
  <rect x="260" y="70" width="80" height="34" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="91" font-size="12" text-anchor="middle" fill="#1f2a44">voter</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="220" y1="35" x2="260" y2="80"/><line x1="220" y1="87" x2="260" y2="87"/><line x1="220" y1="139" x2="260" y2="94"/>
  </g>
  <text x="300" y="130" font-size="11" text-anchor="middle" fill="#6c7a93">sees three</text>
  <text x="300" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">matching values</text>
</svg>
```

Draw the redundancy, then look for every line that fans out to all copies from one place.
:::

::: context independent-principle Two sensors that cannot share a mistake
A gyro and a star tracker answer related questions in unrelated ways. The gyro senses rotation from inside the box — by the Sagnac effect in a fiber-optic or ring-laser gyro, or by vibrating masses in a small MEMS gyro. The star tracker takes a picture of the sky and matches the star pattern against a catalog. A wrong gyro scale factor cannot make stars appear in the wrong place, so if the two disagree, one of them is wrong. That is why spacecraft nearly always pair them, and why a navigation filter blends them: the gyro is smooth and fast, the tracker is slow but does not drift.
:::

::: context n-version The experiment that tempered N-version programming
In 1986 John Knight and Nancy Leveson — the author of this module's reading on system safety — had 27 programs written independently from one specification and ran each against a million test cases. The versions failed on the same inputs together far more often than independence would predict. Different people find the same parts of a problem hard. Diversity still helps, but the AND-gate arithmetic that assumes independent versions promises much more than it delivers, which is why most programs spend their money on verification and simple independent monitors instead.
:::

::: context gate-symbols The fault tree for the worked example
Fault trees are drawn top-down. The bad outcome sits at the top; each gate collects the events that feed it. This is the tree the worked example computes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="8" width="160" height="30" rx="4" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#b4232c">acts on wrong attitude</text>
  <text x="180" y="34" font-size="11" text-anchor="middle" fill="#b4232c">1.06e-6</text>
  <line x1="180" y1="38" x2="180" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M165,72 Q180,62 195,72 Q192,58 180,50 Q168,58 165,72 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="208" y="66" font-size="11" fill="#1f2a44">OR</text>
  <line x1="172" y1="70" x2="100" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="188" y1="70" x2="270" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M86,112 L86,100 Q100,92 114,100 L114,112 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="122" y="108" font-size="11" fill="#1f2a44">AND 6.0e-8</text>
  <line x1="92" y1="112" x2="55" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="108" y1="112" x2="145" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <circle cx="55" cy="160" r="20"/><circle cx="145" cy="160" r="20"/><circle cx="270" cy="160" r="20"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="55" y="164">2.0e-5</text><text x="145" y="164">3.0e-3</text><text x="270" y="164">1.0e-6</text>
    <text x="55" y="194">bad reading</text><text x="145" y="194">check misses</text><text x="270" y="194">no check</text>
  </g>
</svg>
```

The flat-bottomed shape is AND; the curved, pointed one is OR; circles are basic events.
:::

::: context common-cause The beta factor
Reliability engineers model shared causes with a single number, the **beta factor**: the fraction of a unit's failures that would also take out its redundant partners. Typical values quoted for identical redundant hardware run from about 1% to 10%. The example used 1%, the optimistic end, and the shared term still beat the independent one by a factor of about ten thousand. That is why real designs chase separation — different power buses, different mounting locations, different part batches — before they chase extra copies.
:::

::: context afss Autonomous flight safety on real rockets
For decades, US ranges relied on a human safety officer watching tracking data, ready to send a command if a rocket strayed. Autonomous flight safety systems move that judgment into onboard computers running pre-approved rules, which react faster and do not depend on a radio link or ground radar. Falcon 9 began flying with one in 2017, and NASA developed its own for other vehicles. The rules and limits are approved by the range before flight; the flight software's job is to evaluate them exactly, deterministically, and on time.
:::

::: context impact-point Where would it land if the engines stopped now?
The instantaneous impact point is computed by taking the vehicle's current position and velocity and asking where a thrown object with that state would hit the ground. It moves downrange fast during ascent. The range draws boundaries around populated areas; if the impact point crosses one, the vehicle is no longer safe to keep flying.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="130" x2="350" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <rect x="260" y="118" width="80" height="12" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="146" font-size="11" text-anchor="middle" fill="#b4232c">keep-out zone</text>
  <path d="M30,130 Q60,40 140,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="140" cy="30" r="5" fill="#1d6fd1"/>
  <text x="150" y="26" font-size="11" fill="#1d6fd1">vehicle now</text>
  <path d="M140,30 Q200,28 230,130" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="230" cy="130" r="5" fill="#b4232c"/>
  <text x="222" y="118" font-size="11" text-anchor="end" fill="#1f2a44">impact point</text>
  <text x="30" y="146" font-size="11" fill="#1f2a44">pad</text>
</svg>
```

The dashed arc is the unpowered fall. Guidance keeps the red dot out of the orange zone.
:::

::: context iv-and-v A team whose job is to disagree
Independent verification and validation means the checking is done by people who did not write the software and do not report to those who did. NASA runs a dedicated facility for it in Fairmont, West Virginia. Independence matters for the same reason it matters in a voter: the original team shares its own assumptions, so it tends to test for the mistakes it already thought of. A separate team is a separate "channel" with different blind spots.
:::
