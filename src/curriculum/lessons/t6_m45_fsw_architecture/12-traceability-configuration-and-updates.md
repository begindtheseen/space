---
id: l12-traceability-config-updates
title: Traceability, configuration management, and in-flight updates
minutes: 21
covers:
  - Requirements traceability from a vehicle requirement to a line of code to a test
  - Configuration management of gains, I-loads and tables separately from the executable
  - "In-flight software update: when it is the safer choice and when it is not"
---

Every mechanism this module has built — the mode manager, the voter, the residual monitor, the abort logic — is only as trustworthy as the process that keeps it correct as the vehicle, the mission, and the team around it change. A gain gets retuned after a test campaign. A new payload adds a mode. A defect is found after the software has already flown once. This closing lesson covers the three practices that keep a verified system verified through changes like these: tracing every requirement to the code that implements it and the test that proves it, managing tunable data under a discipline separate from the executable that reads it, and deciding, deliberately rather than by default, when updating flight software in flight is the safer choice and when it is not.

## Requirements traceability

**Traceability** is a maintained, documented chain: a vehicle-level requirement, through the design element that implements it, to the specific code that realizes that design, to the specific test that exercises that code and demonstrates the requirement is met. It exists to answer three questions that come up constantly across a program's life, each of them expensive to answer without it: when a requirement changes, which code is affected; when a defect is found, which requirement (if any) should have prevented it, or is there a gap in what was ever required at all; and when a reviewer asks why a piece of code behaves the way it does, is there a documented, approved reason, rather than an answer that begins with "someone thought this was a good idea once."

::: example A traceability row, using this module's own worked examples
| Requirement | Design element | Code | Test |
| --- | --- | --- | --- |
| Safe shall be reachable from every operational state | Mode table with an unconditional transition to `SAFE` from every non-safe state (lesson 2) | `TRANSITIONS` table and `request_mode` (lesson 2) | Reverse-reachability search over the full table (lesson 11), re-run on every table change |
| Safe shall be exitable only by explicit command | `SAFE`'s sole outgoing transition requires `ground_recovery_cmd` (lesson 2) | The one row in `TRANSITIONS["SAFE"]` | Check that every edge leaving `SAFE` is tagged `explicit=True` (lesson 11) |
| A voted attitude rate shall be flagged when redundant channels disagree | Mid-value select with tolerance-based agreement checking (lesson 6) | `majority_vote` / `mid_value_select` | Fault-injection tests: hard-over masking, common-mode non-detection documented as a known limitation (lesson 6) |

Read the third row carefully: the test column documents that a common-mode error is *not* detected by this requirement's implementation, and says so explicitly, rather than silently passing only the cases the implementation happens to handle. A trace that only records success is worse than no trace at all, because it actively hides the gap lesson 6 spent an entire lesson establishing.
:::

Traceability runs in both directions, and both matter. A requirement with no code tracing to it is either unimplemented or the trace itself is broken — either way, something a program needs to know before it flies, not after. Code with no requirement tracing to it is a different kind of problem: functionality nobody can point to an approved reason for, which is exactly the code a reviewer cannot evaluate against any documented intent and exactly the code most likely to be either dead weight or an undocumented, unreviewed behavior change waiting to surprise someone. A traceability matrix that is actually kept current, rather than assembled retroactively before a review, is what makes both gaps visible instead of assumed away.

::: key
Traceability runs both directions: every requirement needs code and a test, and every piece of code needs a requirement it traces back to. A gap in either direction is a real finding — unimplemented intent, or undocumented behavior — not paperwork to fill in after the fact.
:::

## Configuration management: gains and tables, separately from the executable

Lesson 1 introduced cFS Table Services as the mechanism that lets gains, limits, and schedules load from data files validated separately from the app that reads them; lesson 3 made the same point about telemetry and command dictionaries. The general practice both instances draw on is **configuration management**: tunable data — gains, I-loads (initial load values set before flight), limit tables, calibration constants — is versioned, reviewed, and released on its own track, distinct from the compiled executable that consumes it.

The operational reason is turnaround time. A gain retuned after a test campaign, or a limit adjusted after a design review, should not require the full verification cycle of a recompiled, relinked executable if the executable's own logic has not changed at all — that would make routine, low-risk tuning as expensive as a code change, which either slows down legitimate updates or, worse, pressures a team into treating code changes as casually as they should be treating table updates. Separating the two tracks lets each be reviewed at a level of rigor matched to what actually changed.

Separate does not mean unverified. A table loaded without the load-time checks lesson 4 covered — integrity, range — is exactly as capable of misbehaving a vehicle as a defect in the executable would be; configuration management changes *which* verification path tunable data travels, not whether it travels one at all.

::: example A gain table checked at load time, not trusted because it came from a config-managed source
```python
import zlib, json

def make_table(gains, cert_min, cert_max):
    payload = json.dumps(gains, sort_keys=True).encode()
    return {"gains": gains, "crc32": zlib.crc32(payload), "cert_min": cert_min, "cert_max": cert_max}

def load_table(table, cert_min, cert_max):
    payload = json.dumps(table["gains"], sort_keys=True).encode()
    if zlib.crc32(payload) != table["crc32"]:
        return None, "CRC mismatch: table failed integrity check, rejected"
    for name, value in table["gains"].items():
        lo, hi = cert_min[name], cert_max[name]
        if not (lo <= value <= hi):
            return None, f"{name}={value} outside certified range [{lo}, {hi}], rejected"
    return table["gains"], ""

cert_min = {"pitch_kp": 0.10, "pitch_kd": 0.01}
cert_max = {"pitch_kp": 4.00, "pitch_kd": 1.00}

good = make_table({"pitch_kp": 1.85, "pitch_kd": 0.22}, cert_min, cert_max)
print(load_table(good, cert_min, cert_max))
# ({'pitch_kp': 1.85, 'pitch_kd': 0.22}, '')

corrupted = make_table({"pitch_kp": 1.85, "pitch_kd": 0.22}, cert_min, cert_max)
corrupted["gains"] = {"pitch_kp": 1.85, "pitch_kd": 0.95}   # payload changed after the CRC was computed
print(load_table(corrupted, cert_min, cert_max))
# (None, 'CRC mismatch: table failed integrity check, rejected')

out_of_range = make_table({"pitch_kp": 9.50, "pitch_kd": 0.22}, cert_min, cert_max)
print(load_table(out_of_range, cert_min, cert_max))
# (None, 'pitch_kp=9.5 outside certified range [0.1, 4.0], rejected')
```
A table that is corrupted after its checksum was computed — the same class of error lesson 4 caught on a telemetry packet — is rejected outright, as is a value nobody certified as safe to fly, even if its CRC is internally consistent. The certified range itself is exactly the kind of thing a traceability row from the previous section should point at: some requirement or analysis established that `pitch_kp` outside $[0.10, 4.00]$ is unacceptable, and this check is where that requirement is actually enforced, every time a table loads, not only when someone remembers to check by hand.
:::

## In-flight software update: a decision, not a default

Updating the executable itself — not a table, the actual flight code — while a vehicle is in flight is sometimes the right call: a defect discovered after launch that threatens the remainder of the mission, or a capability an extended mission now needs that the original build never anticipated. It is not a decision to make lightly or by default, because the update itself introduces risk that leaving the current, already-validated build in place does not: a new defect the update campaign did not catch, time spent validating and uploading that the vehicle does not get back, and — if something goes wrong — a need to fall back to the previous build under time pressure rather than at leisure.

The decision that matters is a comparison: how much time does the current flight phase actually offer, against how much time the update genuinely needs — to validate, to upload, to activate, and, if it goes wrong, to roll back to the known-good build — with margin to spare rather than the bare minimum.

::: example Is there time to update safely, in this phase?
```python
def update_is_safe(phase_margin_s, validate_s, upload_s, activate_s, rollback_s, margin_factor=2.0):
    bare_need = validate_s + upload_s + activate_s
    needed_with_margin = margin_factor * (bare_need + rollback_s) - rollback_s
    return phase_margin_s >= needed_with_margin, bare_need, needed_with_margin

for label, margin in [("coast phase, 40 minutes remaining", 2400.0),
                       ("terminal descent, 45 seconds remaining", 45.0)]:
    ok, bare, with_margin = update_is_safe(margin, validate_s=60.0, upload_s=30.0, activate_s=5.0, rollback_s=20.0)
    print(f"{label}: bare need={bare:.0f}s, need with rollback margin={with_margin:.0f}s -> "
          f"{'proceed' if ok else 'defer to next window'}")
# coast phase, 40 minutes remaining: bare need=95s, need with rollback margin=210s -> proceed
# terminal descent, 45 seconds remaining: bare need=95s, need with rollback margin=210s -> defer to next window
```
The update's own requirements — ninety-five seconds at bare minimum, before any margin — do not change between the two phases; what changes is how much of the vehicle's remaining time in that phase can absorb them. A long coast phase easily absorbs the update with margin to spare for a rollback if something goes wrong. Forty-five seconds of terminal descent cannot, and the same update that was a comfortable, low-risk choice in the first phase would be reckless in the second — not because the update itself changed, but because there was no longer room in the flight profile to recover if it did not go as planned.
:::

The rollback path this calculation reserves time for is not incidental — it is what turns an in-flight update from a one-way commitment into a recoverable action, in exactly the sense lesson 5's warm standby was recoverable: the previous, already-flight-proven build has to remain available and quickly restorable, not simply overwritten in place the moment the new one uploads. An update strategy that skips reserving that time, or that discards the old build to save storage, has converted a decision that could have been made conservatively into one that cannot be undone if the new build turns out to have a problem the validation campaign missed.

::: warning
"We have time to upload the update" is not the same question as "we have time to upload the update, confirm it, and still roll back if it is wrong." Budget for the rollback explicitly, with margin, rather than treating it as a step that only happens in the unlikely case something goes wrong — the whole value of reserving that margin is that it is available precisely when the unlikely case is the one that just happened.
:::

## Closing the module

This module opened by separating a vehicle's software into layers, each with a narrow, typed interface to the next. Everything since has been about what happens at the edges of those layers when something goes wrong: a mode manager whose safing property had to be proven rather than assumed, a voter whose guarantees turned out to be exactly as strong as its assumptions about independence and determinism and no stronger, a watchdog that answers one question precisely and no other, a residual monitor whose false-alarm and missed-detection rates trade against each other by design, and an FMEA whose most valuable row is the one with nothing in the detection column. This final lesson's three practices are what keep all of that engineering true after the vehicle that carries it has already left the pad: a trace from every requirement to the code and the test that back it, tunable data managed and validated on its own track, and a deliberate, time-budgeted answer to the question of whether an update makes the vehicle safer or simply different.

## Check yourself

::: check
A traceability matrix shows a piece of flight code with no requirement tracing to it. Why is this worth investigating, rather than assuming the code is simply implementing something obvious that didn't need a written requirement?
:::

::: answer
Code with no traced requirement has no documented, reviewed statement of what it is supposed to do or why it exists, which means no reviewer can check it against an approved intent, and no one can say with confidence whether removing or changing it violates something the vehicle actually needs. It may genuinely be harmless leftover code, but it may equally be an undocumented behavior that was never reviewed at the level the rest of the flight software was, or a requirement that exists only implicitly in one engineer's memory — the investigation is what tells these apart, and skipping it treats a real unknown as a known quantity.
:::

::: check
This lesson's traceability example explicitly records, in the test column, that a voted rate's common-mode failure mode is *not* detected. Why is recording a known gap better practice than leaving that row out of the matrix entirely?
:::

::: answer
Leaving the row out entirely does not make the limitation disappear — it only removes the documented record of it, so a later engineer reviewing the matrix sees no mention of common-mode failure at all and has no way to tell whether it was considered and accepted as a residual risk, or simply never thought about. Recording it explicitly turns a silent gap into a documented, traceable decision: it is visible in exactly the place someone would look when reasoning about what this requirement does and does not cover, which is what a trustworthy trace is for.
:::

::: check
Why does separating gain tables from the executable under configuration management not mean the gains are exempt from verification?
:::

::: answer
Configuration management changes which verification track a piece of data travels — a table's own review, versioning, and load-time checks — rather than removing verification altogether; a corrupted or out-of-certified-range gain is exactly as capable of misbehaving a control loop as a defect in the executable's own logic. This lesson's worked example enforces that directly: a table is rejected if its checksum does not match its contents, and separately rejected if any value falls outside the range some prior analysis certified as safe, regardless of how cleanly it was packaged or how routine the update seemed.
:::

::: check
A team argues that because their in-flight update was "just a table change, not a code change," it does not need any reserved rollback margin. Is a table update exempt from the reasoning in this lesson's update-timing example?
:::

::: answer
No. The update-timing calculation cares about validate, upload, activate, and rollback time, none of which depend on whether the changed artifact is a table or an executable — a bad gain table loaded in place of a good one can misbehave the vehicle just as an executable defect can, as this lesson's load-time checks exist specifically to catch. A table update genuinely may need a shorter validation step than a full executable rebuild, which can shrink the "bare need" term in the calculation, but it does not remove the need to budget rollback margin against the specific phase the update is happening in.
:::

::: check
Using this lesson's phase-margin worked example, suppose the rollback time were reduced from 20 seconds to 5 seconds through a faster fallback mechanism, with everything else unchanged. Recompute whether the update would now proceed during the 45-second terminal-descent phase, and explain what changed.
:::

::: answer
With `rollback_s = 5`, the bare need stays `60 + 30 + 5 = 95` seconds, and the margin-adjusted requirement becomes `2.0 * (95 + 5) - 5 = 195` seconds — still comfortably above the 45 seconds available in terminal descent, so the update still defers. What changed is the margin requirement dropping from 210 to 195 seconds, a modest improvement from a faster rollback path; it is nowhere near enough to close a gap this large, which illustrates that shortening the rollback time helps, but the dominant costs here are validation and upload time, and no plausible rollback speed-up alone would make a 45-second phase a safe window for a 95-second bare-minimum update.
:::

::: check
A new engineer proposes updating flight software mid-mission purely because "a better algorithm is now available," with no defect being fixed and no new capability required for mission success. How should this lesson's framework evaluate that proposal differently from an update that fixes a defect threatening the mission?
:::

::: answer
The framework does not change — the same validate/upload/activate/rollback timing calculation and the same load-time verification still apply — but the *justification* side of the decision looks very different: an update fixing a defect that threatens the mission is weighed against the cost of *not* updating, which may be severe, while an update made purely for improvement with no problem being solved is weighed against a baseline that is already safely accomplishing the mission. Since the update itself is the one introducing new risk (an unvalidated change, a rollback that might be needed), a change with no corresponding mission-level benefit has a much harder time clearing the bar that the risk of updating is worth taking, however appealing the improvement is in the abstract.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Traceability | Requirement → design element → code → test, maintained and checked in both directions |
| Untraced requirement | Unimplemented, or the trace is broken — a gap to close before flight |
| Untraced code | Undocumented behavior nobody can review against an approved intent |
| Configuration management | Gains, I-loads, and tables versioned and reviewed on their own track, separate from the executable |
| Load-time validation | Integrity and range checks applied to config-managed data every time it loads, regardless of its source |
| In-flight update decision | Compare the update's validate/upload/activate/rollback time, with margin, against the current phase's actual time budget |
| Rollback margin | Reserved time and an intact previous build; what makes an update recoverable rather than a one-way commitment |

This closes the module. The architecture, the mode manager, the voter, the fault detectors, and the practices in this lesson are, together, the answer to the question this module opened with: how do you build software that keeps flying when a piece of it stops working.
