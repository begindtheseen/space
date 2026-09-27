---
id: l02-mode-management-state-machine
title: Mode management as an explicit state machine
minutes: 22
covers:
  - Mode management as an explicit state machine, with guard conditions and an exit to safe from every state
---

Think about a washing machine. It fills, then washes, then rinses, then spins, then stops. It never jumps from filling straight to spinning with a drum full of water. It will not start the spin while the lid is open. And one button always works, from any step: stop. Once you have pressed stop, the machine does not decide by itself, ten minutes later, that things look fine and start spinning again. You have to press start.

That little machine has everything this lesson is about. A short list of steps. Rules about which step may follow which. Conditions that must be true before a step can begin. One way out that works from everywhere. And a rule that leaving that way out takes a deliberate human choice.

Every flight vehicle has a piece of software doing this job. It is the **mode manager**: the code whose whole job is to know what the vehicle is doing right now — prelaunch checkout, powered ascent, coast, entry, landing, safe — and to decide whether a requested change is allowed from here. It does not fly the vehicle; the GNC application one layer down does that. It supervises. And because every other safety argument about the vehicle assumes the mode manager cannot be talked into a bad state, how you build it matters a great deal.

The right way is an explicit **[[state machine|state-machine]]**: a list of modes, a table of which changes between them are legal, and a condition attached to each change that the software can check from data it already has. This lesson builds one on a small satellite, and lesson 11 comes back to prove its most important property: that safe can be reached from every single mode.

## Why scattered flags breed bugs

First, the wrong way, because you will meet it in real code. Nobody designs it; it grows.

A flag `in_ascent` is set in one file and checked in another. A second flag, `entry_started`, is set somewhere else — sometimes before `in_ascent` is cleared, sometimes after, depending on which code ran that cycle. A third piece of code decides on its own whether safing is allowed, using its own copy of "are we mid-burn" logic, which drifted out of step with the other two flags months ago.

Three things go wrong at once.

1. **Nobody can list the states.** Each true-or-false flag doubles the number of **[[possible combinations|flag-combinations]]**. Nothing in the code lists which combinations can actually happen. To answer "is there a situation where safing is blocked?" you must read every line that touches every flag.
2. **Illegal combinations slip through.** Each check knows only its own flag. Nothing checks the whole picture, so nothing rejects a nonsense combination.
3. **Refusals are silent.** When a request is quietly ignored because some unrelated flag was in the wrong state, nothing tells the ground. The operator sees telemetry that still shows the old mode and cannot tell "we are here because that is correct" from "we are here because a request was dropped."

An explicit state machine closes all three holes by its very shape. The modes are listed, so "what states exist, and what can follow each?" is answered by reading one table. Every change is looked up in that same table, so an illegal one is rejected the same way every time. And every lookup returns an explicit yes or no, so a refusal can always be reported.

## States, guards and the transition table

Three words carry the whole design.

- A **state** (or mode) is one named condition the mode manager can be in. At any moment it is in exactly one.
- A **guard condition** is a true-or-false test, computed from telemetry the software already has, that must be true for a particular change to be allowed. It is never a judgment call and never needs information the software does not have. The word comes from computer science's **[[guarded commands|guard-word]]**.
- A **transition** is a triple: the state you leave, the state you enter, and the guard that must hold.

Our running example is a small satellite with six modes:

- `BOOT` — the computer has just started and is checking itself.
- `STANDBY` — a known, quiet idle state.
- `SUN_POINT` — the solar panels are aimed at the Sun to charge the batteries.
- `SLEW` — the satellite is turning toward a target.
- `PAYLOAD_OPS` — the payload (a camera, say) is working.
- `SAFE` — the fallback: the **[[minimum needed to survive|safe-mode]]** until people on the ground decide what to do.

The normal flow runs `BOOT` → `STANDBY` → `SUN_POINT` → `SLEW` → `PAYLOAD_OPS`, and then back to `SUN_POINT` when the payload is done. `SAFE` sits outside that loop. Here is the full table:

| From | To | Guard |
| --- | --- | --- |
| `BOOT` | `STANDBY` | self-test passed |
| `STANDBY` | `SUN_POINT` | attitude solution valid |
| `SUN_POINT` | `SLEW` | slew command valid AND power OK |
| `SUN_POINT` | `STANDBY` | stand-down commanded |
| `SLEW` | `PAYLOAD_OPS` | slew complete AND attitude valid |
| `PAYLOAD_OPS` | `SUN_POINT` | payload operation complete |
| any non-`SAFE` state | `SAFE` | none — unconditional |
| `SAFE` | `STANDBY` | explicit ground recovery command AND health nominal |

Look hard at the last two rows.

**Every non-safe state has an unconditional transition to `SAFE`.** "Unconditional" means no guard at all beyond the request itself. Here is why. The moment you most need safe mode is the moment something has broken. If reaching safe required some condition to be true, the fault could be exactly what stops that condition from becoming true — and then the escape hatch is jammed when you need it.

**`SAFE` has exactly one way out, and it needs an explicit command.** That command comes from ground or crew authority. No piece of onboard logic may decide on its own that things look fine again. This is the washing machine's rule: after stop, a person presses start. Lesson 11 is built around proving that a table really has this shape instead of trusting that it does.

::: key
The one non-negotiable property of a mode state machine: every mode has an unconditional transition to safe. No reachable state may exist from which the vehicle cannot be commanded somewhere survivable. Everything else in the table is mission logic; this is a safety property.
:::

::: key
A mode table is states, guards and transitions. Every state but safe carries an unconditional transition to safe. Safe carries exactly one transition out, gated by an explicit command, and no autonomous condition may take the vehicle out of it.
:::

## Turning the table into code

The table becomes code almost line for line. Instead of branching on scattered flags, the code *looks up* a request in the table.

Each state maps to a list of entries. Each entry holds three things: the target state, the guard written as a small function of the telemetry, and a true-or-false tag saying whether the transition needs an explicit command. The guards are written as **[[lambdas|lambda]]**, Python's one-line functions. Telemetry arrives as a dictionary, and each guard reads it with `tm.get(key, False)`. That means: "look up this key, and if it is not there, use `False`." So telemetry the software has not received yet can never satisfy a guard by accident.

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
# -> STANDBY     reason=''
# -> SUN_POINT   reason=''
# -> SLEW        reason=''
# -> PAYLOAD_OPS reason=''
# -> SUN_POINT   reason=''

print(request_mode("STANDBY", "PAYLOAD_OPS", {"slew_complete": True, "attitude_valid": True}))
# ('STANDBY', 'STANDBY -> PAYLOAD_OPS refused: not a legal transition or guard not satisfied')

print(request_mode("BOOT", "STANDBY", {}))
# ('BOOT', 'BOOT -> STANDBY refused: not a legal transition or guard not satisfied')
```

Read the first block from the top. The dictionary holds the six nominal rows and the recovery row. The loop then adds the five safing rows, one per non-safe state, each with a guard that always returns `True`. The function `request_mode` does three things in order: accept a request to stay put; search the current state's list for a matching target whose guard passes; and otherwise refuse, with a reason.

Now the second block. The normal sequence advances one mode at a time, and each step reports an empty reason, which means "accepted."

Then two refusals. Asking for `PAYLOAD_OPS` straight from `STANDBY` is refused, even though the telemetry offered would have satisfied that later guard. `PAYLOAD_OPS` is simply not a legal target from `STANDBY`, so the lookup fails before any guard is even checked. Skipping steps is impossible.

Last, asking for `STANDBY` from `BOOT` with an empty dictionary is refused. `tm.get("self_test_pass", False)` found no key and used `False`. A missing report is never read as permission.
:::

::: example Safe is reachable from everywhere and left only by command
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

All five non-safe states accept a request into `SAFE` with an *empty* telemetry dictionary. Nothing has to be true, which is the point: this row must work even when everything else has failed.

From `SAFE`, a request for `SUN_POINT` is refused whatever telemetry comes with it, because no such row exists. Only one request succeeds: `STANDBY`, with both the ground recovery command and a healthy status. Sanity check: five modes in, one door out, and that door has a command on it — the same shape as the table.
:::

## What a guard may depend on

A guard reads only telemetry the software already has: a flag set by a health check, a comparison of a measured value to a limit, a command flag set by an authenticated uplink. It never depends on something the software would have to guess or wait for without limit.

That rule is exactly why the safing guard is `True`. Suppose instead that entering safe required "attitude solution valid." A navigation failure is one of the most likely reasons to *want* safe mode. That same failure would then make safe mode unreachable. Nothing about an escape hatch should depend on machinery that might be the thing that broke.

Two smaller rules are easy to get backwards.

**Staying put is always accepted.** `request_mode(s, s, tm)` returns `(s, "")` with no guard. "Keep doing what you are already doing" should not need fresh permission every cycle. If it did, a single cycle of odd telemetry could make the mode manager refuse to leave things as they are, and every caller would need special handling for that.

**Missing means no.** A guard that reads a key that has not arrived must treat it as unsatisfied. In code, that whole rule is the `False` in `.get(key, False)`. Engineers call this **[[failing closed|fail-closed]]**. Getting the default backwards is the most common way a mode manager's guards quietly stop meaning what their author intended.

::: warning Missing data is not permission
Suppose a guard reads a missing telemetry field as `True`. Every ground test passes, because in testing the field is always present. The guard only misbehaves in the one situation it exists for: real telemetry loss, in flight. Then it waves the transition through on no data at all. Test every guard with the key absent, not only with it present and false.
:::

## Refusals are telemetry, not silence

`request_mode` never changes state without saying so, and it never refuses without a reason. That reason string is not a debugging aid. Whenever it is not empty, it belongs in the vehicle's telemetry, because a refused request is exactly what a ground controller needs to see as it happens.

Picture an operator watching a satellite sit in `STANDBY`. Five seconds ago she sent a slew command. Was it received and refused? Received and still pending? Lost on the way up? If the mode manager refuses silently, its telemetry looks identical to a mode manager that was never asked. She is debugging blind at the moment she most needs the software to explain itself. Pilots call a version of this problem **[[mode confusion|mode-confusion]]**.

## Testing every pair, not only the nominal path

The examples checked the normal sequence and a few hand-picked refusals. That is needed, but not enough. With six states there are $6 \times 5 = 30$ possible *changes* (each state to each of the five others). Of those, the table allows 12: six nominal rows, five safing rows and one recovery row. That leaves 18 that must always be refused. Checking all of that by eye does not scale as modes are added.

The disciplined test tries **[[every pair|cross-product]]** — every current state against every requested state — under several kinds of hostile telemetry: an empty dictionary, every flag `True`, every flag `False`. It checks that nothing outside the table is ever accepted and that every refusal keeps the mode and gives a reason.

::: example A cross-product test that looks for holes
Continuing from the code above:

```python
LEGAL = {("BOOT", "STANDBY"), ("STANDBY", "SUN_POINT"), ("SUN_POINT", "SLEW"),
         ("SUN_POINT", "STANDBY"), ("SLEW", "PAYLOAD_OPS"), ("PAYLOAD_OPS", "SUN_POINT"),
         ("SAFE", "STANDBY")} | {(s, "SAFE") for s in ALL_STATES if s != "SAFE"}

ALL_TRUE = {k: True for k in ["self_test_pass", "attitude_valid", "slew_cmd_valid",
            "power_ok", "stand_down_cmd", "slew_complete", "payload_op_complete",
            "ground_recovery_cmd", "health_nominal"]}
ADVERSARIAL = [{}, ALL_TRUE, {k: False for k in ALL_TRUE}]

refused = 0
for src in ALL_STATES:
    for dst in ALL_STATES:
        if src == dst:
            continue
        for tm in ADVERSARIAL:
            new, reason = request_mode(src, dst, tm)
            if new == dst:
                assert (src, dst) in LEGAL, f"hole: {src} -> {dst} accepted"
            else:
                assert new == src and reason, "a refusal must keep the mode and say why"
        if request_mode(src, dst, ALL_TRUE)[0] == src:
            refused += 1
print("pairs tried:", 6 * 5, " legal:", len(LEGAL), " refused even with every flag true:", refused)
# pairs tried: 30  legal: 12  refused even with every flag true: 18
```

Step by step: `LEGAL` writes down, independently of the code, the 12 changes the table allows. The three telemetry dictionaries are the hostile cases. The two loops try all 30 changes against each dictionary. Any accepted change must be in `LEGAL`; any refusal must keep the old mode and carry a reason.

Sanity check: even with *every* flag set to `True` — the most permissive telemetry possible — exactly 18 changes are still refused, and $12 + 18 = 30$. The refusals come from the table's shape, not from lucky telemetry.
:::

A sweep like this is good practice on its own. It is also the first step toward a proof. Once you stop asking "does this table look right?" and start asking "can I search it?", you are one step from lesson 11's graph search, which proves that safe is reachable no matter how the table grows.

## Check yourself

::: check
Why is "stay in the current mode" an unconditional accept, rather than a row in the table with its own guard?
:::

::: answer
Staying put changes nothing about the vehicle. If it had a guard, "keep doing what you are validly doing" would fail on any cycle where that guard's telemetry happened to be false — even though remaining where you are never needed that condition. Making self-transitions always legal keeps the table focused on real changes of state, which is the only place a guard's question, "is it now safe to move?", makes sense.
:::

::: check
A colleague wants the `SAFE` → `STANDBY` guard to also require `time_since_safe_entry > 30` seconds, to stop the vehicle bouncing out of safe too soon after a fault. Does that break the rule that safe is exited only by an explicit decision?
:::

::: answer
No. The rule is about *who* authorizes leaving safe: it must stay a ground or crew command, never a condition the software satisfies alone. It does not limit how many other conditions the command is combined with. The new guard still requires `ground_recovery_cmd` as one of its AND terms, so the transition is still impossible without it.

What *would* break the rule is a guard that could become true from telemetry alone, with no command term at all. That would let the vehicle leave safe on its own judgment — the one thing this row exists to prevent.
:::

::: check
The vehicle is in `SLEW`. In one telemetry cycle, two requests arrive: first `PAYLOAD_OPS` with `{"slew_complete": True, "attitude_valid": True}`, then — because a fault manager running in parallel decided to act — `SAFE`. If both go to `request_mode` in that order, where does the vehicle end up? What does this say about handling two requests in one cycle?
:::

::: answer
Each call is independent and only returns a result. The first call moves the state from `SLEW` to `PAYLOAD_OPS`, since its guard passes. The second call now starts from `PAYLOAD_OPS` and moves to `SAFE`, because every non-safe state accepts a request into safe. Final state: `SAFE`, which is what you want.

But that only worked because the calls ran strictly in order, each feeding the next. A real mode manager must *guarantee* the ordering instead of relying on luck. For example, it can give a safing request priority and handle it first, or accept exactly one request per cycle from a single authoritative source. Leaving the outcome to accidental call order is the kind of hidden behavior a table-driven design is meant to remove.
:::

::: check
Someone adds a new row: `PAYLOAD_OPS` → `SLEW`, guarded by `resume_slew_cmd`, so an interrupted slew can resume without going back through `SUN_POINT`. Is that a self-contained change, or must anything else in the table be re-examined?
:::

::: answer
It is not self-contained. Any new transition changes what can reach what. The property this module cares most about — safe is reachable from every state — is a statement about the whole graph, not about one row.

In this case safe stays reachable, because `PAYLOAD_OPS` already had its own unconditional edge to `SAFE`, before and after the change. But that must be *checked*, not assumed, after every edit. Lesson 11 builds the tool that checks it automatically.
:::

::: check
A junior engineer writes a guard as `lambda tm: tm["attitude_valid"]` instead of `lambda tm: tm.get("attitude_valid", False)`. What actually happens the first time it runs on telemetry that has no attitude report yet?
:::

::: answer
`tm["attitude_valid"]` raises a `KeyError` when the key is missing. The guard does not return `False`; it crashes. What happens next depends on the code around it. An uncaught exception in the mode manager's request path could stop mode processing altogether, which is far more dangerous than correctly refusing one transition.

The `.get(key, False)` form turns "not received yet" into an ordinary case with a clear result — the guard is not satisfied — instead of an exception whose effect depends on whatever surrounds the guard.
:::

## Summary

| Term | Meaning |
| --- | --- |
| State (mode) | One named condition the mode manager can be in; exactly one at a time |
| Guard condition | A true-or-false test on telemetry the software already has |
| Transition | (from, to, guard) — legal only if the table has it and the guard holds |
| Unconditional exit to safe | Every non-safe state's guard to `SAFE` is `True`; a fault must never block it |
| Explicit-only recovery | `SAFE`'s one way out needs a ground or crew command term, never telemetry alone |
| Self-transition | Asking for the current state is always accepted, with no guard |
| Missing telemetry | Read so the guard is unsatisfied, never satisfied (fail closed) |
| Refusal | Keeps the current mode and returns a non-empty reason, which goes into telemetry |
| Cross-product test | All $6 \times 5 = 30$ changes tried under hostile telemetry: 12 legal, 18 refused |

This lesson built the table and made safe reachable by construction. The next lessons move to the boundary with the ground — command and telemetry — and then to the ways things fail, and lesson 11 returns to this exact table to turn "reachable by construction" into a proof.

::: context state-machine The six modes as a picture
A **finite state machine** is a set of states plus arrows saying which state may follow which. Here are this lesson's six modes. Blue arrows are the nominal flow, red arrows are the unconditional safing edges (one from every other mode), and the dashed arrow is the single way out of safe, which needs a ground command.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ab" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#1d6fd1"/></marker>
    <marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#b4232c"/></marker>
  </defs>
  <g stroke="#b4232c" stroke-width="1.3" marker-end="url(#ar)">
    <line x1="37" y1="39" x2="58" y2="148"/>
    <line x1="112" y1="39" x2="80" y2="148"/>
    <line x1="195" y1="39" x2="96" y2="150"/>
    <line x1="170" y1="104" x2="100" y2="156"/>
    <line x1="300" y1="104" x2="101" y2="168"/>
  </g>
  <line x1="98" y1="150" x2="138" y2="41" stroke="#1d6fd1" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#ab)"/>
  <g stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#ab)">
    <line x1="64" y1="27" x2="88" y2="27"/>
    <line x1="160" y1="22" x2="188" y2="22"/>
    <line x1="190" y1="33" x2="162" y2="33"/>
    <line x1="262" y1="39" x2="298" y2="78"/>
    <line x1="282" y1="92" x2="258" y2="92"/>
    <line x1="214" y1="80" x2="224" y2="41"/>
  </g>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="15" width="54" height="24" rx="5"/>
    <rect x="90" y="15" width="70" height="24" rx="5"/>
    <rect x="190" y="15" width="80" height="24" rx="5"/>
    <rect x="160" y="80" width="96" height="24" rx="5"/>
    <rect x="282" y="80" width="60" height="24" rx="5"/>
    <rect x="40" y="150" width="60" height="24" rx="5" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="37" y="31">BOOT</text>
    <text x="125" y="31">STANDBY</text>
    <text x="230" y="31">SUN_POINT</text>
    <text x="208" y="96">PAYLOAD_OPS</text>
    <text x="312" y="96">SLEW</text>
    <text x="70" y="166">SAFE</text>
  </g>
  <text x="250" y="170" font-size="11" fill="#6c7a93" text-anchor="middle">dashed: ground command only</text>
</svg>
```
:::

::: context flag-combinations How fast flags multiply
Each true-or-false flag can be in 2 positions, so $n$ independent flags can be in $2^n$ combinations. Three flags give 8. Ten flags give 1,024. Twenty give more than a million. Most of those combinations should never happen, but with scattered flags nothing says which ones are impossible, so nobody can check them all. A state machine with six named states has exactly six situations to think about.
:::

::: context guard-word Where "guard" comes from
In 1975 the computer scientist Edsger Dijkstra described **guarded commands**: a statement that may run only when a true-or-false test, its guard, is true. The picture is a guard at a gate who lets you through only if you meet the condition. Mode tables borrow the word directly: the guard on a transition is the test that must pass before the gate opens.
:::

::: context safe-mode What a satellite does in safe mode
For a typical satellite, safe mode means: turn off everything that is not needed to survive, point the solar panels at the Sun so the batteries stay charged, keep the radio listening, and wait. It uses the fewest, simplest parts possible, so it does not depend on whatever just failed. There is a twist: for a rocket booster in the middle of a landing burn, doing nothing is not survivable. There, "safe" may mean keep flying the burn. What safe means depends on the flight phase.
:::

::: context lambda A function in one line
In Python, `lambda tm: tm.get("power_ok", False)` makes a tiny unnamed function. It takes one input, called `tm`, and returns the value after the colon. It does the same job as a normal `def guard(tm):` function whose only line is `return tm.get("power_ok", False)`. Storing guards as lambdas lets each row of the table carry its own test right next to its target state.
:::

::: context fail-closed Failing closed
A door lock that stays locked when its power fails is said to **fail closed**. A guard that says "no" when its data is missing does the same. The opposite, failing open, sometimes makes sense — a fire door should open when the power fails — so the choice must be made on purpose. For a guard that permits a mode change, a missing input means "not proven," and not proven means no. The unconditional path to safe is the deliberate exception, because safe is where you want to end up when data goes missing.
:::

::: context mode-confusion Mode confusion
Aviation safety researchers use **mode confusion** for the situation where the people operating a system believe it is in one mode while it is actually in another, or do not understand why it changed. It has been a factor in real aircraft accidents involving autopilots. The cure is the same in a cockpit and a control room: the software must always say clearly what mode it is in, what it was asked to do, and why it did or did not do it.
:::

::: context cross-product Thirty changes on one grid
Rows are the mode you are in; columns are the mode requested. Blue cells are the nominal transitions, red the safing edges, orange the one commanded recovery, grey the always-allowed "stay put." Every blank cell is one of the 18 changes the test must see refused.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="88" y="48">BOOT</text><text x="88" y="72">STANDBY</text><text x="88" y="96">SUN_POINT</text>
    <text x="88" y="120">SLEW</text><text x="88" y="144">PAYLOAD_OPS</text><text x="88" y="168">SAFE</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="107" y="28">BT</text><text x="131" y="28">SB</text><text x="155" y="28">SP</text>
    <text x="179" y="28">SL</text><text x="203" y="28">PO</text><text x="227" y="28">SF</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1" fill="#fff">
    <rect x="95" y="35" width="144" height="144"/>
  </g>
  <g fill="#6c7a93">
    <rect x="96" y="36" width="22" height="22"/><rect x="120" y="60" width="22" height="22"/><rect x="144" y="84" width="22" height="22"/>
    <rect x="168" y="108" width="22" height="22"/><rect x="192" y="132" width="22" height="22"/><rect x="216" y="156" width="22" height="22"/>
  </g>
  <g fill="#1d6fd1">
    <rect x="120" y="36" width="22" height="22"/><rect x="144" y="60" width="22" height="22"/><rect x="168" y="84" width="22" height="22"/>
    <rect x="120" y="84" width="22" height="22"/><rect x="192" y="108" width="22" height="22"/><rect x="144" y="132" width="22" height="22"/>
  </g>
  <g fill="#b4232c">
    <rect x="216" y="36" width="22" height="22"/><rect x="216" y="60" width="22" height="22"/><rect x="216" y="84" width="22" height="22"/>
    <rect x="216" y="108" width="22" height="22"/><rect x="216" y="132" width="22" height="22"/>
  </g>
  <rect x="120" y="156" width="22" height="22" fill="#f2b880"/>
  <g font-size="11" fill="#1f2a44">
    <text x="252" y="60">from: rows</text><text x="252" y="76">to: columns</text>
    <text x="252" y="100">12 legal</text><text x="252" y="116">18 refused</text>
  </g>
</svg>
```
:::
