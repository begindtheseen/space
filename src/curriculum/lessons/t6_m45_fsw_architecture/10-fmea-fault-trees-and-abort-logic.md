---
id: l10-fmea-fault-trees-abort
title: FMEA, fault trees, and the abort decision
minutes: 22
covers:
  - FMEA and fault trees; identifying the single points of failure a voter does not cover
  - Abort logic and autonomous flight termination systems
---

Detection, from lesson 9, tells you a fault is present. It does not, by itself, tell you whether your architecture has any way to detect *every* failure mode a vehicle can suffer, nor what the software should do about the ones it finds. This lesson builds the two tools that answer those questions systematically rather than by instinct: the failure modes and effects analysis (FMEA), which walks every failure mode a component can exhibit and asks, for each one, what actually detects it and what the software does in response; and the fault tree, which combines the probabilities of individual failures into the probability of a hazardous outcome. It then turns to the single most consequential decision a flight computer can make — an abort, potentially culminating in flight termination — and treats it, deliberately, as nothing more exotic than everything else in this module: a monitored condition, a deterministic rule, bounded in time, tested exhaustively, with authority divided so no single chain of software carries a decision that consequential alone.

## FMEA: a systematic accounting, row by row

An FMEA is a table, one row per failure mode, with columns that force a specific, concrete answer rather than a general impression: the failure itself, its immediate (local) effect, its effect at the vehicle level, how the software **detects** it, how the software **isolates** it (identifies which unit is responsible), what the software **does** in response, and — the column that matters most — the **residual risk** if detection fails. A well-run FMEA does not stop at the failures a design already knows how to handle; its value is in the row where every honest answer in the detection column is "nothing currently catches this," because that row is a single point of failure the rest of the design has been silently assuming does not exist.

| Failure mode | Local effect | Vehicle effect | Detection | Isolation | Response | Residual risk if detection fails |
| --- | --- | --- | --- | --- | --- | --- |
| Gyro total loss (no output) | Channel silent | One of three rate sources gone | Data-integrity check (lesson 4): no packets, sequence counter stalls | Trivial — the silent channel | Continue on remaining two channels, flag | Low — loss is self-announcing |
| Gyro stuck-at-plausible (frozen, in-family value) | Channel reports a fixed value indistinguishable from a real, static rate | Filter may weight a frozen input as valid | Cross-check against the other two channels (lesson 6's voter) | Voter isolates it once the vehicle actually rotates and the frozen channel diverges | Exclude, continue on remaining two | High until the vehicle maneuvers enough to separate the frozen value from truth |
| Slow bias drift, within valid range | Gradually growing error, never clearly out of family | Filter incorporates a slowly-wrong measurement | Residual monitor (lesson 9) against the other channels' consensus | Persistence counter attributes the drift once it exceeds threshold | Exclude once declared; degraded to two channels until then | High during the drift's early phase — this is lesson 9's ramp-versus-step result directly |
| Shared calibration constant wrong in all three channels | All three agree, all three wrong | Filter incorporates a confidently-wrong measurement | **None** among the three channels themselves (lesson 6's common-mode result) | Not possible from these three channels alone | Requires an independent measurement principle, outside this triad | Full — this is the row with no answer in this triad |
| Bus delivers correct data late, past its staleness bound | Value is right, timing is wrong | A control loop or filter using an old value as current | Staleness check (lesson 4) | Trivial — the late packet's own timestamp | Reject, hold last valid or fall back | Low if the staleness bound was set correctly for this signal |

::: key
The most valuable row in an FMEA is not the one with a clean detection story — it is the one whose detection column is honestly empty. That row names a single point of failure, and finding it on paper, during design, is the entire reason to build the table rather than trust that redundancy alone has covered everything.
:::

The shared-calibration row is not a hypothetical filler entry — it is lesson 6's common-mode result, written into the format this lesson uses to make failure coverage explicit rather than implicit. A voter, however well implemented, cannot appear in that row's detection column, because voting checks agreement among the three channels the defect already contaminated identically. Filling in that row honestly, rather than skipping it because "the voter handles redundancy," is precisely what turns an FMEA from paperwork into an analysis that finds real gaps.

## Fault trees: combining basic events into a top-event probability

Where an FMEA works from a component outward — "if this fails, what happens" — a fault tree works from a hazardous outcome backward: "what combination of basic events would have to occur for this top event to happen." Basic events combine through logic gates: an **AND** gate requires every input beneath it to occur before the event above it fires (each additional AND term makes the combined event *less* likely, because more independent things all have to go wrong at once); an **OR** gate fires if any single input beneath it occurs (each additional OR term makes the combined event *more* likely, because there are more independent ways to reach it).

::: example A top event built from a fault-tree structure
```python
# Top event: "the vehicle acts on a wrong attitude solution."
# AND gate: a plausible-but-wrong reading occurs AND the independent cross-check misses it.
# OR gate:  ...combined with the separate possibility that no cross-check was available at all.
p_plausible_wrong_reading = 2.0e-5    # given, from the FMEA's stuck-at-plausible row
p_cross_check_misses_it = 3.0e-3      # given: false-negative rate of the independent monitor
p_and_gate = p_plausible_wrong_reading * p_cross_check_misses_it

p_no_cross_check_axis = 1.0e-6        # given: probability the monitor is unavailable for this axis
p_top = 1 - (1 - p_and_gate) * (1 - p_no_cross_check_axis)

print(f"AND gate: P(undetected wrong reading) = {p_and_gate:.3e}")
print(f"P(top event) = {p_top:.3e}")
print("dominant contributor:", "AND gate" if p_and_gate > p_no_cross_check_axis else "missing cross-check")
# AND gate: P(undetected wrong reading) = 6.000e-08
# P(top event) = 1.060e-06
# dominant contributor: missing cross-check
```
The AND gate's probability, $6.0\times10^{-8}$, is the product of two independent, already-small probabilities — this is the arithmetic reason AND gates are where redundancy earns its keep, since making any single term smaller shrinks the whole product. The OR term, a flat $1.0\times10^{-6}$ probability that the cross-check is unavailable for this axis at all, is more than an order of magnitude larger than the AND gate despite each individual number looking small, and it dominates the top event's total probability. A fault tree makes this kind of comparison explicit and numeric rather than a matter of impression — here, the single largest lever on the top event is making sure the independent cross-check is *available* on every axis, not further improving a detection scheme that, when present, already works well.
:::

## Abort logic: the same pattern, at the highest stakes

An abort is a decision to depart from the nominal mission sequence toward a survivable outcome — in this module's terms, most often a transition the mode manager of lesson 2 executes into (or through) `SAFE`. In the most severe cases, publicly documented range-safety practice extends this to autonomous flight termination: a flight computer, monitoring the vehicle's trajectory against limits approved before flight, authorized to end powered flight if the vehicle departs those limits by enough to threaten public safety, without waiting for a human decision if time does not allow one. Everything below concerns the **software and decision logic** of that authority — what is monitored, how the decision is computed, and how authority over it is divided. It says nothing about, and this lesson does not cover, any mechanism that physically carries out a termination; that is not GNC content, and it is not this module's subject.

The flight computer implementing this logic monitors quantities directly available from the vehicle's own navigation and guidance solution: instantaneous impact point relative to pre-approved safety limits, rate or attitude excursions beyond bounds consistent with controlled flight, and loss of a valid navigation solution for longer than a bounded time. None of this requires anything beyond what earlier lessons in this module have already built: valid, staleness-checked, cross-checked state estimates (lessons 4, 6, 9) evaluated against a fixed rule set, in exactly the shape of lesson 2's guard conditions.

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

for tm in [{"cross_track_m": 300.0, "body_rate_dps": 4.0, "nav_valid": True},
           {"cross_track_m": 1500.0, "body_rate_dps": 4.0, "nav_valid": True},
           {"cross_track_m": 300.0, "body_rate_dps": 4.0, "nav_valid": False}]:
    result, checks = evaluate_abort_rules(tm, RULES)
    print(f"{tm} -> {'TRIP: ' + result if result else 'no trip'} ({checks}/{len(RULES)} rules evaluated)")
# {'cross_track_m': 300.0, ...} -> no trip (3/3 rules evaluated)
# {'cross_track_m': 1500.0, ...} -> TRIP: trajectory_deviation (1/3 rules evaluated)
# {'cross_track_m': 300.0, ..., 'nav_valid': False} -> TRIP: loss_of_nav (3/3 rules evaluated)
```
Every call evaluates at most three comparisons — the worst case is knowable before the software ever runs, which is exactly the bounded-time property this curriculum's real-time systems material requires of anything running on a hard deadline. The rule set is fixed and enumerable, which is what makes it **testable**: every rule can be exercised individually and in combination, against the full range of telemetry it might see, before flight — not sampled or hoped about, but exhaustively checked the way lesson 2's cross-product testing checked a mode table.
:::

**Deterministic** means the same telemetry produces the same decision on every evaluation, on every redundant string — precisely lesson 7's requirement, now applied to the highest-consequence decision the vehicle's software makes. A rule table with no hidden state, no dependence on execution order, and no floating-point reduction whose order varies between replicas satisfies this by construction; anything that does not was covered, and its risk explained, in lesson 7.

**Divided authority** is the direct answer to a question this module has asked repeatedly since lesson 6: what happens when the one chain of software making a decision is itself wrong? A single evaluation path, however well tested, is a single point of failure for a decision this consequential — exactly the gap an FMEA's empty detection column names. Publicly documented range-safety practice addresses it by requiring **concurrence**: independent computation chains, evaluating independently, must agree before an irreversible action proceeds, and in architectures where time allows it, a human range-safety authority retains override or enable/inhibit authority over the autonomous system rather than the software holding sole authority throughout.

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
Neither chain alone can trigger the action; only agreement between two independently computed conclusions does. This is a direct, deliberate application of lesson 6's own lesson about voting turned to a different purpose — here the "vote" requires unanimity from two independent paths rather than a majority among three, because for this specific decision a false trip (destroying a healthy, expensive vehicle) and a missed trip (failing to act when action was required) are both severe enough that neither chain is trusted alone.
:::

## Why this logic receives the most verification in the program

Because this decision is autonomous, time-bounded, and irreversible once executed, it is treated, on every program that documents its software assurance practice publicly, as the most safety-critical logic the vehicle carries — and safety criticality is what sets how much verification rigor a piece of software receives, not a uniform standard applied everywhere. In practice that means requirements-based test coverage aimed at exercising every rule and every combination the fixed table can produce, independent verification and validation performed by a team separate from the one that wrote the logic, and — the connection lesson 12 makes explicit — a documented trace from each specific approved safety limit through to the exact line of code that checks it and the exact test that exercises that line. None of this is special machinery beyond what this module has already built; it is the ordinary practice of this module's earlier lessons — determinism, bounded time, exhaustive testing of a fixed table, divided authority — applied with the highest rigor to the one decision where a bug is least tolerable.

## Check yourself

::: check
In the FMEA table's shared-calibration-constant row, the detection column is empty. Why is an empty cell here more informative than a filled one would be in a routine row, and what does lesson 6 tell you about why voting specifically cannot fill it?
:::

::: answer
An empty detection cell names an actual single point of failure — a failure mode the current design has no way to catch — rather than merely describing a failure the design already handles. Lesson 6 showed precisely why voting among the three channels cannot fill this cell: a shared defect contaminates all three channels identically, so they agree with each other and a voter, which only checks agreement, reports full health. Filling this cell requires something outside the triad entirely — an independent measurement principle — which is exactly what the row's format is designed to surface rather than paper over.
:::

::: check
Using this lesson's fault-tree worked example, if the independent cross-check's false-negative rate improved tenfold (from $3.0\times10^{-3}$ to $3.0\times10^{-4}$) but the probability that the cross-check is unavailable on a given axis stayed at $1.0\times10^{-6}$, would the top-event probability improve by roughly the same factor? Why or why not?
:::

::: answer
No, not by anywhere near a factor of ten overall, because the top event is now dominated by the unchanged OR term. The AND gate would shrink tenfold, from $6.0\times10^{-8}$ to $6.0\times10^{-9}$, but the OR term at $1.0\times10^{-6}$ was already more than an order of magnitude larger than the original AND gate and is untouched by this improvement, so the top event barely moves — from about $1.06\times10^{-6}$ to about $1.0\times10^{-6}$. This is the fault tree doing its job: it shows precisely that improving detection accuracy further is not where the risk actually lives once cross-check availability is the larger term.
:::

::: check
Explain why the rule table in `evaluate_abort_rules` is described as running in "bounded time," and what property of the code — not only its typical behavior — makes that true.
:::

::: answer
The function contains no loop whose length depends on the data it is evaluating, no recursion, and no operation whose cost varies with input — it always performs at most `len(RULES)` comparisons and returns, regardless of which telemetry it receives. That means its worst-case execution time can be established once, from the code's structure alone, before it ever runs against real data; "bounded" describes a property provable from the code, not an observation about how fast it happened to run in testing.
:::

::: check
A reviewer proposes simplifying the concurrence check so that only the primary chain's decision is required, with the independent monitor logged for post-flight analysis instead of gating the action. What property does this change remove, and why does this lesson treat that as unacceptable for this specific decision?
:::

::: answer
It removes divided authority: the action would now depend on a single computation chain's conclusion, which reintroduces exactly the single-point-of-failure problem an FMEA's empty detection cell names and that lesson 6 showed a solitary chain cannot self-diagnose. For a decision that is autonomous, time-bounded, and irreversible, a wrong conclusion from the one chain now empowered to act — whether a false trip that destroys a healthy vehicle or a missed trip that fails to act when required — has no independent check standing between it and execution; logging the monitor's disagreement after the fact catches the error too late to matter.
:::

::: check
Why does this lesson describe the abort/termination decision as needing more verification rigor than other flight software, rather than the same rigor applied uniformly across the vehicle's whole codebase?
:::

::: answer
Verification effort is finite, and this lesson's own fault-tree example shows that risk is not spread evenly across a system — a small number of decisions and failure modes dominate the overall hazard probability. The abort/termination decision is autonomous, time-bounded, and irreversible once executed, so a defect in it is both especially consequential and, being autonomous, not caught by a human noticing something looks wrong first. Concentrating the highest level of requirements-based testing, independent verification, and documented traceability on precisely this logic is how a program spends a necessarily finite verification budget where a defect would do the most damage, rather than spreading it thin enough that no part of the system receives the scrutiny this decision specifically requires.
:::

::: check
A junior engineer asks why this lesson's abort-logic examples never mention any physical mechanism that acts once a decision is made. What is the stated reason, and what is this lesson's subject instead?
:::

::: answer
This lesson's subject is the software and decision-authority engineering around the decision — what the flight computer monitors, how the decision itself is computed deterministically and in bounded time, how it is tested, and how authority over it is divided — which is the GNC and flight-software content this module is built to teach and the content this decision is examined on. Any physical mechanism that might act on the decision is a separate engineering discipline entirely, outside this module's scope, and deliberately left out of this lesson rather than summarized.
:::

## Summary

| Term | Meaning |
| --- | --- |
| FMEA | Table of failure mode → local effect → vehicle effect → detection → isolation → response → residual risk |
| Empty detection cell | A single point of failure the current design has no answer for |
| Fault tree | Basic events combined by AND (all required, shrinks with more terms) and OR (any suffices, grows with more terms) into a top-event probability |
| Dominant contributor | The gate or term whose probability sets the top event's order of magnitude; found by comparing terms, not by inspection |
| Abort | A decision to depart the nominal sequence toward survivability; typically a transition into or through the mode manager's `SAFE` |
| Autonomous flight termination | Publicly documented range-safety practice: a bounded-time, deterministic rule evaluation against pre-approved trajectory limits |
| Deterministic, bounded, testable | The decision function is fixed, has a known worst-case evaluation cost, and can be exhaustively exercised before flight |
| Divided authority / concurrence | Independent computation chains must agree before an irreversible action executes |

The next lesson returns to lesson 2's mode manager with everything this module has now shown about how things actually fail, and replaces "safe is reachable from every state, asserted by construction" with a proof: a graph search over the mode table that either confirms the property or names the exact state that breaks it.
