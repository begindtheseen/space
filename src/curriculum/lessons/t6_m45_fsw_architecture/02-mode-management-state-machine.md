---
id: l02-mode-management-state-machine
title: Mode management as an explicit state machine
minutes: 20
covers:
  - Mode management as an explicit state machine, with guard conditions and an exit to safe from every state
---

Somewhere in every flight vehicle's software is a piece of code whose entire job is to know what the vehicle is currently doing and to decide what it is allowed to do next. Not the physics of doing it — that is the GNC application's job, one layer down — but the supervisory question: are we in prelaunch checkout, powered ascent, coasting, entry, landing, or safe mode, and is the transition someone or something just requested actually legal from here. That piece of code is the mode manager, and how you write it is one of the more consequential design decisions in the whole stack, because a mode manager that can be talked into an illegal or unrecoverable state has just made every other safety argument about the vehicle conditional on it never happening.

The right way to build one is as an explicit state machine: an enumerated list of states, a table of which transitions between them are legal, and a guard condition attached to each transition that the software can evaluate from telemetry it already has. The wrong way — and the way it happens by default if nobody designs it on purpose — is a scatter of boolean flags and `if` statements spread across the codebase, each one a local, ad hoc decision about whether some action is currently allowed. This lesson builds the first way, on a small worked example you will reuse later in the module, and lesson 11 comes back to formally prove the property that matters most about it: that safe is reachable from every single state.

## Why the scattered version is a bug generator

Picture the alternative first, because you will recognize it from real codebases. A flag `in_ascent` is set here, checked there; a second flag `entry_started` gets set somewhere else, sometimes before `in_ascent` is cleared and sometimes after, depending on which code path executed that cycle; a third piece of code decides independently whether safing is currently allowed, using its own copy of "are we mid-burn" logic that drifted out of sync with the first two flags months ago. Nothing in this design enumerates the full set of reachable combinations of flags, so nobody can answer "is there a reachable state where safing is blocked" without reading every line that touches every flag. Illegal combinations are not rejected, because nothing is checking for them as a class — each check only knows about its own flag. And when a requested transition is silently ignored because some unrelated flag happened to be in the wrong state, nothing tells the ground; the vehicle simply keeps doing what it was doing; and the operator, reading telemetry that still says the old mode, has no way to tell "we're still here because it's correct" from "we're still here because a request was silently dropped."

An explicit state machine closes off all three failure modes by construction. The states are enumerated, so the questions "what is the full set of reachable states" and "from this state, what can happen next" have answers you can read off a table rather than infer from scattered code. Transitions are looked up in that one table, so an illegal one is rejected by the same mechanism every time, not by whichever of several ad hoc checks happened to be watching. And because the table-driven design returns an explicit accept-or-refuse result, a refusal can always be reported rather than silently swallowed.

## States, guards, and the transition table

A **state** is one named condition the vehicle's supervisory logic can be in; at any instant it is in exactly one. A **guard condition** is a boolean function of telemetry the software already possesses — never a judgment call, never something requiring information outside what has already been measured or commanded — that must evaluate true for a specific transition to be permitted. A **transition** is a triple: the state it leaves from, the state it goes to, and the guard that must hold.

Take a small satellite bus as the running example for this lesson and the next several: six modes, `BOOT`, `STANDBY`, `SUN_POINT`, `SLEW`, `PAYLOAD_OPS`, and `SAFE`. The nominal flow checks out the bus (`BOOT`), parks it in a known idle state (`STANDBY`), points it at the sun for power (`SUN_POINT`), slews to a target (`SLEW`), operates a payload (`PAYLOAD_OPS`), and returns to sun-pointing when the operation finishes. `SAFE` sits outside that sequence entirely.

| From | To | Guard |
| --- | --- | --- |
| `BOOT` | `STANDBY` | self-test passed |
| `STANDBY` | `SUN_POINT` | attitude solution valid |
| `SUN_POINT` | `SLEW` | slew command valid AND power OK |
| `SUN_POINT` | `STANDBY` | stand-down commanded |
| `SLEW` | `PAYLOAD_OPS` | slew complete AND attitude valid |
| `PAYLOAD_OPS` | `SUN_POINT` | payload operation complete |
| any non-`SAFE` state | `SAFE` | — (unconditional) |
| `SAFE` | `STANDBY` | explicit ground recovery command AND health nominal |

Two rows deserve a second look before the code. Every non-`SAFE` state has an unconditional transition to `SAFE`: no guard beyond the request itself, because a vehicle that needs to reach safety cannot be made to wait on a condition that a fault might be the very thing preventing from becoming true. And `SAFE` has exactly one way out, gated by an *explicit* command — ground or crew authority, not a piece of onboard logic that decided on its own that things looked fine again. That single row is what "exitable only by an explicit decision" means in the module's own language, and it is worth committing to memory now, because lesson 11 is built entirely around proving that a table has this shape rather than trusting that it does.

::: key
A mode table is states, guards, and transitions. Every state but safe carries an unconditional transition to safe. Safe carries exactly one transition out, gated by an explicit command, and no autonomous condition may take the vehicle out of it.
:::

## Implementing the table

The table above translates directly into code that looks up a request rather than branching on scattered flags. Each entry pairs a target state with a guard function over a telemetry dictionary; a missing key is read with a default of `False`, so telemetry the software has not yet received can never accidentally satisfy a guard.

::: example A table-driven mode manager
```python
TRANSITIONS = {
    "BOOT": [("STANDBY", lambda tm: tm.get("self_test_pass", False), False)],
    "STANDBY": [("SUN_POINT", lambda tm: tm.get("attitude_valid", False), False)],
    "SUN_POINT": [
        ("SLEW", lambda tm: tm.get("slew_cmd_valid", False) and tm.get("power_ok", False), False),
        ("STANDBY", lambda tm: tm.get("stand_down_cmd", False), False),
    ],
    "SLEW": [("PAYLOAD_OPS", lambda tm: tm.get("slew_complete", False) and tm.get("attitude_valid", False), False)],
    "PAYLOAD_OPS": [("SUN_POINT", lambda tm: tm.get("payload_op_complete", False), False)],
    "SAFE": [("STANDBY", lambda tm: tm.get("ground_recovery_cmd", False) and tm.get("health_nominal", False), True)],
}
ALL_STATES = ["BOOT", "STANDBY", "SUN_POINT", "SLEW", "PAYLOAD_OPS", "SAFE"]
for s in ALL_STATES:
    if s != "SAFE":
        TRANSITIONS.setdefault(s, []).append(("SAFE", lambda tm: True, False))

def request_mode(current, target, telemetry):
    if target == current:
        return current, ""                          # staying put is always legal
    for (tgt, guard_fn, explicit) in TRANSITIONS.get(current, []):
        if tgt == target and guard_fn(telemetry):
            return target, ""
    return current, f"{current} -> {target} refused: not a legal transition or guard not satisfied"
```

```python
state = "BOOT"
for target, tm in [("STANDBY", {"self_test_pass": True}),
                    ("SUN_POINT", {"attitude_valid": True}),
                    ("SLEW", {"slew_cmd_valid": True, "power_ok": True}),
                    ("PAYLOAD_OPS", {"slew_complete": True, "attitude_valid": True}),
                    ("SUN_POINT", {"payload_op_complete": True})]:
    state, reason = request_mode(state, target, tm)
    print(f"-> {state:11} reason='{reason}'")
# -> STANDBY    reason=''
# -> SUN_POINT  reason=''
# -> SLEW       reason=''
# -> PAYLOAD_OPS reason=''
# -> SUN_POINT  reason=''

print(request_mode("STANDBY", "PAYLOAD_OPS", {"slew_complete": True, "attitude_valid": True}))
# ('STANDBY', 'STANDBY -> PAYLOAD_OPS refused: not a legal transition or guard not satisfied')

print(request_mode("BOOT", "STANDBY", {}))
# ('BOOT', 'BOOT -> STANDBY refused: not a legal transition or guard not satisfied')
```
The nominal sequence advances one mode at a time, each transition reported with an empty reason string. Requesting `PAYLOAD_OPS` directly from `STANDBY` — skipping `SUN_POINT` and `SLEW` — is refused even though the telemetry offered would have satisfied the *later* guard, because `PAYLOAD_OPS` never appears as a legal target from `STANDBY` in the table at all: the lookup fails before any guard is even evaluated. And requesting `STANDBY` from `BOOT` with an empty telemetry dictionary is refused because `tm.get("self_test_pass", False)` defaults to `False` — a key the software has not yet received can never be silently read as permission.
:::

::: example Safe is reachable from everywhere and leaves only by explicit command
```python
for s in ALL_STATES:
    if s == "SAFE":
        continue
    print(s, "->", request_mode(s, "SAFE", {}))
# BOOT -> ('SAFE', '')
# STANDBY -> ('SAFE', '')
# SUN_POINT -> ('SAFE', '')
# SLEW -> ('SAFE', '')
# PAYLOAD_OPS -> ('SAFE', '')

print(request_mode("SAFE", "SUN_POINT", {"attitude_valid": True}))
# ('SAFE', 'SAFE -> SUN_POINT refused: not a legal transition or guard not satisfied')
print(request_mode("SAFE", "STANDBY", {"ground_recovery_cmd": True, "health_nominal": True}))
# ('STANDBY', '')
```
Every one of the five non-safe states accepts a request into `SAFE` with an empty telemetry dictionary — no condition has to be true, because the whole point of this row is that it must work even when everything else has failed. `SAFE` refuses a request into `SUN_POINT` outright, no matter what telemetry accompanies it, because no such row exists in its table entry; it accepts only the one row that requires both an explicit ground command and a nominal health flag together.
:::

## What a guard is allowed to depend on

A guard function reads only telemetry the software already has: a flag set by a health check, a threshold comparison on a measured quantity, an explicit command flag set by an authenticated uplink. It never depends on something the software would have to guess, estimate outside its own model, or wait on indefinitely. This matters for the unconditional exit to safe specifically: if entering safe required, say, "attitude solution valid," then a navigation failure — one of the most likely reasons to want safe mode in the first place — could simultaneously be the reason the vehicle cannot reach it. The guard on the safing transition is `True` precisely because nothing about a well-designed escape hatch should be conditioned on the machinery that might itself be broken.

Two smaller conventions are worth calling out because they are easy to get backwards. Requesting to stay in the current mode is always accepted — `request_mode(s, s, tm)` returns `(s, "")` unconditionally in the code above — because refusing a no-op transition would make "keep doing what you were already doing" a special case that has to be separately justified every cycle, and it needlessly complicates every caller. And a guard reading a telemetry key that has not arrived yet must treat it as unsatisfied, never as satisfied: the `.get(key, False)` pattern is the whole of that rule in code, but getting the default backwards — treating missing data as permission rather than its absence — is the single most common way a mode manager's guard logic quietly stops meaning what its author intended.

::: warning
A guard that silently defaults a missing or malformed telemetry field to `True` — because the author only tested the case where the field was present — will pass an actual pre-flight check by accident every time the field genuinely is present, and only fail in exactly the situation it exists to prevent: real telemetry loss, in flight, when the vehicle needs the check to work.
:::

## Refusals are telemetry, not silence

`request_mode` never mutates state and returns no reason on a rejected transition without also saying why. That reason string is not a debugging convenience; it belongs in the vehicle's telemetry stream on every cycle it is non-empty, because a refused transition is exactly the kind of event a ground controller or an automated ground system needs to see in real time. A mode manager that refuses a request and says nothing produces telemetry indistinguishable from a mode manager that was never asked — and an operator staring at a vehicle stuck in `STANDBY`, wondering whether the slew command they sent five seconds ago was received, refused, or lost in transit, is now debugging blind at exactly the moment they most need the software to be legible.

## Testing beyond the nominal path

The examples above check the nominal sequence and a small number of hand-picked refusals, which is necessary but not sufficient: a mode manager with six states and a handful of transitions still has thirty non-trivial (current, requested) pairs, and eyeballing a table for "did I remember every illegal one" scales badly as states are added. The disciplined version of this testing asks, for every current state and every possible requested state, whether the transition table's decision matches what the table says it should be, across a range of telemetry values including the adversarial ones — a missing key, a requested self-transition, a request into safe with nothing else true. That systematic sweep is good engineering practice on its own, and it is also exactly the kind of check that generalizes into a formal proof once you stop asking "does this table look right" and start asking "can I search it." Lesson 11 does precisely that, once you have seen — over the next several lessons — the range of failures a mode manager's safing property has to survive.

## Check yourself

::: check
Why is "stay in the current mode" implemented as an unconditional accept rather than as a transition with its own guard in the table?
:::

::: answer
A self-transition means nothing about the vehicle's operational state is changing, so gating it behind a guard would make "continue doing what you are already validly doing" fail whenever that cycle's telemetry happened not to satisfy some condition — even though nothing about remaining in the current mode required that condition to begin with. Treating self-transitions as always legal keeps the guard table focused on genuine changes of state, which is the only place a guard's question ("is it now safe to move") actually applies.
:::

::: check
A colleague proposes adding a guard to the `SAFE -> STANDBY` recovery transition that also requires `time_since_safe_entry > 30` seconds, reasoning that this prevents "bouncing" out of safe mode too quickly after a fault. Does this violate the rule that safe is exited only by an explicit decision?
:::

::: answer
No. "Exitable only by an explicit decision" constrains *who* authorizes leaving safe — it must remain a ground or crew command, never an autonomous condition the software satisfies on its own — not how many conditions that command may be combined with. Adding `time_since_safe_entry > 30` still leaves the explicit `ground_recovery_cmd` flag as a required term in the guard's AND; the transition remains impossible without it. What *would* violate the rule is a guard that could become true from telemetry alone, with no command term present at all, because that would let the vehicle leave safe on its own judgment — the one thing this row of the table exists to prevent.
:::

::: check
Using the table in this lesson, trace what happens if the vehicle is in `SLEW` and receives two requests in the same telemetry cycle: first a request to `PAYLOAD_OPS` with `{"slew_complete": True, "attitude_valid": True}`, and — because a fault manager running in parallel also decided to act — a request to `SAFE`. If both are passed to `request_mode` in that order, what is the vehicle's final state, and what does this suggest about how a real mode manager should handle two requests arriving in one cycle?
:::

::: answer
Each call to `request_mode` is independent and mutates nothing but its return value, so processing them in order means the first call moves the state to `PAYLOAD_OPS` (the guard is satisfied), and the second call — now evaluated with `current = "PAYLOAD_OPS"` — moves it on to `SAFE`, since every non-safe state accepts an unconditional request into safe. The final state is `SAFE`, which is the outcome you want. But this only worked because the calls were applied strictly in sequence with each one's output feeding the next one's input; a real mode manager has to guarantee that ordering explicitly — for instance by giving a safing request priority and evaluating it first, or by processing exactly one request per cycle from a single authoritative source — rather than leaving the outcome dependent on incidental call order, which is precisely the kind of implicit, unexamined behavior this lesson's table-driven design is meant to replace.
:::

::: check
Suppose a ninth table row were added: `PAYLOAD_OPS -> SLEW`, guarded by `resume_slew_cmd`, to let an interrupted slew resume directly from payload operations without first returning to `SUN_POINT`. Does adding this row require re-examining anything else in the table, or is it a self-contained change?
:::

::: answer
It is not self-contained. Adding any transition changes the graph of what is reachable from what, and the one property this module keeps returning to — that safe is reachable from every state — is a statement about the whole graph, not about any single row in isolation. In this particular case safe remains reachable, because `PAYLOAD_OPS` already had its own unconditional edge to `SAFE` before and after the change; but that has to be checked, not assumed, every time a row is added, and lesson 11 builds exactly the tool for checking it automatically rather than by rereading the table by eye after every edit.
:::

::: check
A junior engineer writes a guard as `lambda tm: tm["attitude_valid"]` instead of `lambda tm: tm.get("attitude_valid", False)`. What is the practical difference the first time this guard is evaluated against a telemetry sample that has not yet reported an attitude solution at all?
:::

::: answer
`tm["attitude_valid"]` raises a `KeyError` when the key is absent, rather than evaluating to a boolean — the guard does not fail closed, it crashes. Whether that is better or worse than silently defaulting to `False` depends on what happens next: an uncaught exception in the mode manager's request-handling path could halt mode processing entirely, which is a far more dangerous failure than correctly refusing one transition. The `.get(key, False)` form makes "telemetry not yet received" an ordinary, handled case with a well-defined outcome — the guard is not satisfied — instead of an exceptional one that depends on whatever the surrounding code does when an exception propagates out of a guard evaluation.
:::

## Summary

| Term | Meaning |
| --- | --- |
| State | One named condition the mode manager can be in; exactly one at a time |
| Guard condition | A boolean function of telemetry already available to the software |
| Transition | (from state, to state, guard) — legal only if the table contains it and the guard holds |
| Unconditional exit to safe | Every non-safe state's guard to `SAFE` is `True`; a fault must never be able to block it |
| Explicit-only recovery | `SAFE`'s one outgoing transition requires an authenticated command term, never telemetry alone |
| Self-transition | Requesting the current state is always accepted, with no guard |
| Missing telemetry | Read with a default that makes the guard unsatisfied, never satisfied |
| Refusal reporting | A rejected request returns a non-empty reason string, which belongs in telemetry |

This lesson designed the table and asserted, by construction, that safe is reachable from everywhere. The next few lessons show the range of failures — common-mode errors, Byzantine faults, radiation upsets, slow drifts — that a mode manager's fault response has to survive, and lesson 11 returns to this exact table to replace "asserted by construction" with a proof: a graph search over the transitions that either confirms the property or names the state that breaks it.

