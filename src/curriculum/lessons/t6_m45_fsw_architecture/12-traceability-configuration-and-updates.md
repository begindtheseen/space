---
id: l12-traceability-config-updates
title: Traceability, configuration management, and in-flight updates
minutes: 25
covers:
  - Requirements traceability from a vehicle requirement to a line of code to a test
  - Configuration management of gains, I-loads and tables separately from the executable
  - "In-flight software update: when it is the safer choice and when it is not"
---

Think about a family recipe for chili. The recipe card says what to do: brown the onions, add the beans, simmer an hour. Taped to it is a small note: "Grandma likes 2 teaspoons of chili powder; the kids like 1." The steps rarely change. The seasoning changes all the time. You would never rewrite the whole card to adjust the chili powder — and you would never let anyone change the steps without tasting the result.

Flight software is kept the same way. The **executable** — the compiled program — is the recipe card. The **tables** of gains, limits and settings it reads are the seasoning note. They change on different schedules, so they are managed on different tracks. And every step on the card should have a reason you can point to, and a taste test that proves it works.

Everything this module has built — the mode manager, the voter, the residual monitor, the abort logic — is only as trustworthy as the process that keeps it correct while things change. A gain gets retuned after a test. A new payload adds a mode. A defect turns up after the software has already flown. This closing lesson covers three practices that keep a verified system verified: tracing every requirement to its code and its test, managing tunable data separately from the executable, and deciding on purpose — not by habit — when to update software in flight.

## Traceability: from "why" to "proof"

A **requirement** is a written, approved statement of something the vehicle must do, usually phrased with **[["shall"|shall]]**: "Safe mode shall be reachable from every operational state." **Traceability** is a maintained chain of links from that requirement, through the design that meets it, to the specific code that carries out the design, to the specific test that proves it works.

The chain answers three questions that come up again and again on a program:

- **A requirement changes.** Which code is affected? Follow the links forward.
- **A defect is found.** Which requirement should have prevented it — or was the need never written down at all? Follow the links backward.
- **A reviewer asks why a piece of code behaves as it does.** Is there an approved reason, or only "someone thought it was a good idea once"?

::: example A traceability matrix, using this module's own work
| Requirement | Design element | Code | Test |
| --- | --- | --- | --- |
| Safe shall be reachable from every operational state | Mode table with an unconditional transition to `SAFE` from every non-safe state (lesson 2) | `TRANSITIONS` table and `request_mode` (lesson 2) | Reverse-reachability search over the full table (lesson 11), re-run on every table change |
| Safe shall be exitable only by explicit command | `SAFE`'s only outgoing transition needs `ground_recovery_cmd` (lesson 2) | The one row in `TRANSITIONS["SAFE"]` | Check that every edge leaving `SAFE` is tagged explicit (lesson 11) |
| A voted attitude rate shall be flagged when redundant channels disagree | Mid-value select with tolerance-based agreement checking (lesson 6) | `majority_vote` / `mid_value_select` | Fault-injection tests: hard-over masking; common-mode non-detection recorded as a known limitation (lesson 6) |

Read across the first row. The *why* is the requirement. The *what* is the design: an unconditional safing edge from every mode. The *where* is the code: the `TRANSITIONS` table. The *proof* is the test: the reachability search.

Now read the test cell of the third row. It says openly that a common-mode error is *not* detected. That is the honest thing to write. A trace that records only successes is worse than no trace, because it hides the very gap lesson 6 spent a whole lesson finding.
:::

### Both directions

Traceability runs **[[both ways|two-way-trace]]**, and each direction finds a different kind of gap.

- **A requirement with no code** is either not built yet, or its trace is broken. Either way, the program must know before flight.
- **Code with no requirement** is behavior nobody can point to an approved reason for. A reviewer cannot judge it against any intent. It is either dead weight or an **[[unreviewed behavior waiting to surprise someone|leftover-code]]**.

A trace kept up to date as work happens, rather than assembled in a rush before a review, makes both gaps visible. Better still, a computer can check it.

::: example A trace check that runs both ways
Four requirements, four pieces of code and three tests, each tagged with the requirements it serves.

```python
REQUIREMENTS = ["SAFE-1", "SAFE-2", "VOTE-1", "TIME-1"]
CODE = {                       # code unit -> requirements it implements
    "modes.TRANSITIONS": ["SAFE-1", "SAFE-2"],
    "modes.request_mode": ["SAFE-1", "SAFE-2"],
    "voter.mid_value_select": ["VOTE-1"],
    "nav.align_platform": [],
}
TESTS = {                      # test -> requirements it verifies
    "test_reachability": ["SAFE-1"],
    "test_safe_exit_explicit": ["SAFE-2"],
    "test_vote_fault_injection": ["VOTE-1"],
}
implemented = {r for reqs in CODE.values() for r in reqs}
verified = {r for reqs in TESTS.values() for r in reqs}
print("requirements with no code:", [r for r in REQUIREMENTS if r not in implemented])
print("requirements with no test:", [r for r in REQUIREMENTS if r not in verified])
print("code with no requirement:", [c for c, reqs in CODE.items() if not reqs])
# requirements with no code: ['TIME-1']
# requirements with no test: ['TIME-1']
# code with no requirement: ['nav.align_platform']
```

**Step 1.** Gather every requirement that some code claims: `SAFE-1`, `SAFE-2`, `VOTE-1`. `TIME-1` is missing — nothing implements it.

**Step 2.** Gather every requirement some test claims. Again `TIME-1` is missing — nothing proves it.

**Step 3.** Look the other way: `nav.align_platform` lists no requirement at all. Why is it there? Someone must find out before flight.

Sanity check: three requirements are fully traced, one has a gap in both code and test, and one piece of code is an orphan — each gap is exactly one line of output.
:::

::: key
Traceability runs both directions: every requirement needs code and a test, and every piece of code needs a requirement it traces back to. A gap in either direction is a real finding — unimplemented intent, or undocumented behavior — not paperwork to fill in after the fact.
:::

## Configuration management: tables apart from the executable

Back to the chili. The seasoning note lives beside the recipe, not inside it. In flight software the same idea is **configuration management**: tunable data is versioned, reviewed and released on its own track, apart from the compiled executable that reads it.

What counts as tunable data?

- **Gains** — the numbers that set how hard a control loop pushes back against an error.
- **[[I-loads|i-loads]]** — initialization loads, mission-specific values set before flight, such as target orbit or launch azimuth.
- **Limit tables** — the thresholds for the limit checking of lesson 3 and the monitors of lesson 9.
- **Calibration constants** — the scale factors and biases for each sensor.

Lesson 1 showed the mechanism in NASA's core Flight System: Table Services loads gains, limits and schedules from data files that are validated separately from the app that reads them. Lesson 3 made the same point about command and telemetry dictionaries.

The reason is turnaround time. A gain retuned after a test campaign should not need the full verification cycle of a rebuilt executable when the program's logic has not changed at all. If it did, routine tuning would cost as much as a code change. That either slows legitimate updates, or — worse — tempts a team to treat code changes as casually as table changes. Two tracks let each change be checked at the level of rigor that matches what actually changed.

::: key
Why gains and I-loads live in tables: they can be re-verified, re-approved and uploaded without rebuilding or re-qualifying the executable, and they carry their own version and checksum. It separates "what the vehicle does" from "how the vehicle is tuned", which are on different change cadences.
:::

Separate does not mean unchecked. A table loaded without the checks of lesson 4 — integrity and range — can misfly a vehicle as surely as a bug in the executable. Configuration management changes *which* checking path the data travels, not whether it travels one.

::: example A gain table checked at load time
Two gains for a pitch controller: `pitch_kp`, which pushes back in proportion to the angle error, and `pitch_kd`, which pushes back against the rate of change. Analysis has **[[certified|certified-range]]** a safe range for each.

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

**Good table.** The CRC recomputed at load matches the stored one. $1.85$ lies between $0.10$ and $4.00$, and $0.22$ between $0.01$ and $1.00$. Accepted.

**Corrupted table.** `pitch_kd` changed from $0.22$ to $0.95$ *after* the CRC was computed. Notice that $0.95$ is inside its certified range — a range check alone would pass it. The CRC catches it, the same way lesson 4 caught a damaged packet.

**Out-of-range table.** Its CRC is consistent, because it was computed on the bad value. But $9.50$ is more than twice the $4.00$ ceiling. The range check rejects it.

Sanity check: each check catches something the other misses. The CRC guards against damage; the range guards against a wrong value that was packaged correctly.

The certified range is exactly what a traceability row should point to. Some requirement or analysis set `pitch_kp` between $0.10$ and $4.00$, and this check is where that requirement is enforced — every time a table loads, not only when someone remembers to look.
:::

::: warning
A table from a configuration-managed source is not trusted because of where it came from. Check integrity and range on every load, on the vehicle. The upload path, the ground tools and the memory it sits in can all damage it after it was approved.
:::

## In-flight software update: a decision, not a default

Updating the executable itself — not a table, the actual flight code — while the vehicle flies is sometimes the right call. Sometimes it is reckless. It is never automatic in either direction. It is a comparison of two risks.

**The risk of not updating** is the known defect staying aboard. How sure is it to cause harm, and how bad would the harm be?

**The risk of updating** is everything the update brings with it:

- a new defect the test campaign missed;
- the upload mechanism itself failing and leaving the computer unable to start — **[["bricking"|bricking]]** it;
- redundant strings ending up on different versions, so their outputs no longer match and the voter of lesson 6 flags healthy strings;
- losing the verification evidence the vehicle launched on, because the flight build is no longer the one that was tested.

Updating tends to be the safer choice when the known defect is *certain* to cause loss, the fix is *small*, it has been reproduced and tested on a **ground rig** identical to the flight computer, it can be **rolled back**, and there is a **quiescent phase** — a calm stretch with nothing time-critical happening — to do it in. The classic case is **[[Mars Pathfinder|pathfinder]]** in 1997: a defect kept resetting the spacecraft, the fix was a single setting, and it was reproduced and proven on an identical testbed on the ground before it was sent up.

Refusing tends to be the safer choice when the vehicle is in a fast, time-critical phase, when the new build has not been through full verification, or when a failed update could leave the computer unable to start.

### Is there time, in this phase?

One part of the decision can be computed: does the current phase have room for the whole update, *including* the time to undo it if it goes wrong? The onboard steps are:

- **verify** — the vehicle checks the uploaded image, for example its CRC;
- **upload** — the time to send it;
- **activate** — switching over to the new build;
- **rollback** — switching back to the old build if the new one misbehaves.

Add them all, then multiply by a **margin factor** so the plan does not depend on everything going exactly to schedule. With a factor of $2$:

$$
t_{\text{need}} = 2\,(t_{\text{verify}} + t_{\text{upload}} + t_{\text{activate}} + t_{\text{rollback}}).
$$

Read $t_{\text{need}}$ as "t sub need", the time the phase must offer.

::: example Is there time to update safely, in this phase?
The update needs $60\,\mathrm{s}$ to verify, $30\,\mathrm{s}$ to upload, $5\,\mathrm{s}$ to activate and $20\,\mathrm{s}$ to roll back. Compare two phases.

```python
def update_fits(phase_time_s, verify_s, upload_s, activate_s, rollback_s, margin_factor=2.0):
    bare_need = verify_s + upload_s + activate_s
    need_with_margin = margin_factor * (bare_need + rollback_s)
    return phase_time_s >= need_with_margin, bare_need, need_with_margin

for label, time_left in [("coast phase, 40 minutes left", 2400.0),
                         ("terminal descent, 45 seconds left", 45.0)]:
    ok, bare, need = update_fits(time_left, verify_s=60.0, upload_s=30.0, activate_s=5.0, rollback_s=20.0)
    print(f"{label}: bare need={bare:.0f} s, need with rollback and margin={need:.0f} s -> "
          f"{'proceed' if ok else 'defer to next window'}")
# coast phase, 40 minutes left: bare need=95 s, need with rollback and margin=230 s -> proceed
# terminal descent, 45 seconds left: bare need=95 s, need with rollback and margin=230 s -> defer to next window
```

**Step 1, the bare need.** $60 + 30 + 5 = 95\,\mathrm{s}$ to verify, upload and activate.

**Step 2, add rollback.** $95 + 20 = 115\,\mathrm{s}$ to be able to undo it.

**Step 3, add margin.** $2 \times 115 = 230\,\mathrm{s}$.

**Step 4, compare.** Forty minutes is $2400\,\mathrm{s}$, more than ten times $230\,\mathrm{s}$: proceed. Forty-five seconds is less than even the bare $95\,\mathrm{s}$: defer to the next window.

The update did not change between the two phases. What changed is whether the flight had room to recover if it went wrong. The same update is a comfortable choice in a long coast and a reckless one in terminal descent.
:::

The rollback time is not a detail. It is what turns an update from a one-way commitment into a recoverable action — in the same sense lesson 5's warm standby was recoverable. The previous, flight-proven build has to stay aboard and quick to restore, not be **[[overwritten the moment the new one arrives|two-images]]**. A plan that skips the rollback time, or deletes the old build to save memory, has turned a decision that could have been made carefully into one that cannot be undone.

::: warning
"We have time to upload the update" is not the same as "we have time to upload it, confirm it, and still roll back if it is wrong." Budget for the rollback explicitly, with margin. The whole point of that margin is that it is there in the unlikely case — and the unlikely case is the one where you need it.
:::

## Closing the module

This module opened by splitting a vehicle's software into layers, each talking to the next through a narrow interface. Everything since has been about what happens at the edges of those layers when something breaks. A mode manager whose safing property had to be proved, not assumed. A voter exactly as strong as its assumptions about independence and determinism, and no stronger. A watchdog that answers one question and no other. A residual monitor that trades false alarms against missed faults by design. An FMEA whose most valuable row is the one with nothing in the detection column.

This lesson's three practices keep all of that true after the vehicle has left the pad: a trace from every requirement to the code and the test that back it, tunable data managed and checked on its own track, and a deliberate, time-budgeted answer to whether an update makes the vehicle safer or only different.

## Check yourself

::: check
A traceability matrix shows a piece of flight code with no requirement tracing to it. Why is this worth investigating, instead of assuming the code does something too obvious to need a written requirement?
:::

::: answer
Code with no traced requirement has no approved statement of what it should do or why it exists. No reviewer can check it against an intent, and no one can say whether changing or removing it would break something the vehicle needs.

It might be harmless leftover code. It might equally be behavior that was never reviewed as carefully as the rest, or a requirement that lives only in one engineer's memory. Investigating is how you tell these apart. Skipping it treats a real unknown as a known.
:::

::: check
The traceability example records in the test column that a voted rate's common-mode failure is *not* detected. Why is recording a known gap better than leaving that row out?
:::

::: answer
Leaving the row out does not remove the limitation. It only removes the record of it. A later engineer reading the matrix sees no mention of common-mode failure and cannot tell whether it was considered and accepted, or never thought of.

Recording it turns a silent gap into a documented, traceable decision, visible exactly where someone would look when asking what this requirement does and does not cover.
:::

::: check
Why does keeping gain tables apart from the executable not mean the gains skip verification?
:::

::: answer
Configuration management changes which checking path the data travels — its own review, versioning and load-time checks — not whether it is checked at all. A corrupted or out-of-range gain can misfly a control loop as surely as a bug in the code.

The worked example enforces this on every load: a table is rejected if its CRC does not match its contents, and separately rejected if any value is outside the range analysis certified, however cleanly it was packaged.
:::

::: check
A team argues that because their in-flight update is "only a table change, not a code change", it needs no reserved rollback time. Is a table update exempt from the timing check?
:::

::: answer
No. The timing check counts verify, upload, activate and rollback time, and none of those care whether the new item is a table or an executable. A bad gain table can misfly the vehicle as readily as a code defect — that is why the load-time checks exist.

A table update may well need a shorter verify step than a whole new executable, which shrinks the bare need. It does not remove the need to budget rollback time, with margin, against the phase the update happens in.
:::

::: check
In the timing example, suppose a faster fallback mechanism cuts the rollback time from $20\,\mathrm{s}$ to $5\,\mathrm{s}$, with everything else the same. Would the update now proceed during the $45\,\mathrm{s}$ terminal-descent phase?
:::

::: answer
The bare need is still $60 + 30 + 5 = 95\,\mathrm{s}$. With rollback it becomes $95 + 5 = 100\,\mathrm{s}$, and with the margin factor $2 \times 100 = 200\,\mathrm{s}$.

$200\,\mathrm{s}$ is still far more than $45\,\mathrm{s}$, so the update still defers. The requirement dropped from $230\,\mathrm{s}$ to $200\,\mathrm{s}$ — a real improvement, but nowhere near enough. The bare need alone, $95\,\mathrm{s}$, is already more than twice the $45\,\mathrm{s}$ available, so no rollback speed-up could make this phase a safe window.
:::

::: check
A new engineer proposes updating flight software mid-mission only because "a better algorithm is now available". No defect is being fixed and no new capability is needed. How should this proposal be judged differently from an update that fixes a mission-threatening defect?
:::

::: answer
The timing check and the load-time checks apply exactly as before. What changes is the other side of the comparison.

A defect fix is weighed against the cost of *not* updating, which may be losing the mission. A pure improvement is weighed against a vehicle that is already doing its job safely. The update is the thing bringing new risk — a new defect, a failed upload, strings on different versions, lost verification evidence. With no matching benefit to the mission, it has a much harder time justifying that risk, however attractive the new algorithm looks.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Requirement | Approved "shall" statement of what the vehicle must do |
| Traceability | Requirement → design → code → test, kept current and checked in both directions |
| Requirement with no code | Unbuilt, or a broken trace — close it before flight |
| Code with no requirement | Behavior no one can review against an approved intent |
| Configuration management | Gains, I-loads, limits and calibrations versioned and reviewed on their own track |
| Why tables | Re-verify and upload without rebuilding the executable; own version and checksum; "what it does" apart from "how it is tuned" |
| Load-time checks | CRC for integrity and certified range for value, on every load |
| Update decision | Compare the risk of the known defect with the risks the update brings |
| Update timing | $t_{\text{need}} = 2\,(t_{\text{verify}} + t_{\text{upload}} + t_{\text{activate}} + t_{\text{rollback}})$ must fit in the phase |
| Rollback | Reserved time and an intact previous build; what makes an update recoverable |

This closes the module. The architecture, the mode manager, the voter, the fault monitors and the practices in this lesson together answer the question the module opened with: how do you build software that keeps flying when a piece of it stops working?

::: context shall The one word that makes a requirement
In requirement writing, "shall" marks something that must be true and must be verified. "Should" marks a goal, and "will" usually states a fact about something outside the system. Engineers are strict about this because each "shall" becomes a row in the trace: it needs a design, code and a test. A requirement also has to be testable. "The software shall be robust" cannot be traced to a test; "safe mode shall be reachable from every operational state" can, and lesson 11 wrote that test.
:::

::: context two-way-trace Links that run both ways
The same links, followed in opposite directions, find opposite problems. NASA's software engineering requirements, NPR 7150.2, ask for traceability in both directions for exactly this reason.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="50" width="76" height="34" rx="4"/>
    <rect x="98" y="50" width="70" height="34" rx="4"/>
    <rect x="182" y="50" width="70" height="34" rx="4"/>
    <rect x="266" y="50" width="84" height="34" rx="4"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="46" y="71">requirement</text><text x="133" y="71">design</text>
    <text x="217" y="71">code</text><text x="308" y="71">test</text>
  </g>
  <line x1="30" y1="36" x2="320" y2="36" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="330,36 318,30 318,42" fill="#1d6fd1"/>
  <text x="180" y="24" font-size="11" text-anchor="middle" fill="#1d6fd1">forward: is every requirement built and tested?</text>
  <line x1="330" y1="100" x2="40" y2="100" stroke="#b4232c" stroke-width="2"/>
  <polygon points="30,100 42,94 42,106" fill="#b4232c"/>
  <text x="180" y="122" font-size="11" text-anchor="middle" fill="#b4232c">backward: does every line of code have a reason?</text>
</svg>
```

Forward finds missing work. Backward finds unexplained work.
:::

::: context leftover-code The code that had no job on Ariane 5
On Ariane 5's first flight in 1996, the inertial reference software ran an alignment function that was only useful before liftoff. It kept running for about 40 seconds after liftoff — a leftover from Ariane 4, where it helped with late countdown holds. Ariane 5 flew a faster trajectory, so a horizontal velocity value grew larger than on Ariane 4. Converting it to a 16-bit integer overflowed, both reference units shut down the same way, and the rocket was lost. The code served no requirement on the new rocket. A backward trace asking "why is this running in flight?" is exactly the question that could have flagged it.
:::

::: context i-loads Where "I-load" comes from
The term comes from the Space Shuttle program: **initialization loads**, the mission-specific numbers loaded into the flight software before each launch. Target orbit, launch azimuth, payload mass properties, abort landing sites — the software's logic stayed the same from flight to flight, while its I-loads changed every mission. The name has stuck across the industry for any pre-flight, mission-specific setting that lives outside the code.
:::

::: context certified-range Where a certified range comes from
A gain's limits are not guesses. Control engineers analyze the loop across every flight condition and every uncertainty they expect — mass, center of gravity, aerodynamics, sensor delays — and find the range of gains for which the loop stays stable with healthy **stability margins**, the extra room before it would start to oscillate. That analysis is the evidence behind the numbers $0.10$ and $4.00$. The load-time check turns that analysis into a rule the vehicle enforces on itself.
:::

::: context bricking Why a failed update is so dangerous
A computer starts by running a small, fixed **boot loader** that reads the flight software from memory and starts it. If an update writes a damaged image to the only place the boot loader looks, the next restart finds nothing it can run. On the ground, a technician plugs in a cable and reflashes the board. In space there is no technician. The computer is as useful as a brick — hence the slang — unless the design left a way back.
:::

::: context pathfinder Mars Pathfinder, 1997
Days after landing on Mars, Pathfinder began resetting itself. The cause was **priority inversion**: a low-priority weather task held a shared lock, a medium-priority task kept it from finishing, and a high-priority bus task waiting for the lock missed its deadline, which triggered a reset. Engineers at the Jet Propulsion Laboratory reproduced the fault on an identical ground testbed. The fix was to switch on priority inheritance for that lock — one setting — and it was uploaded and worked. Certain defect, tiny change, proven on the ground first: the textbook case for updating.
:::

::: context two-images Two slots for two builds
Many flight computers keep two complete software images in separate memory areas. The new build is written into the spare slot, checked, then started. If it misbehaves, the computer restarts from the old slot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="140" height="44" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">slot A</text>
  <text x="90" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">flight-proven build</text>
  <rect x="200" y="20" width="140" height="44" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">slot B</text>
  <text x="270" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">new build, uploaded</text>
  <rect x="130" y="100" width="100" height="32" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">boot loader</text>
  <line x1="200" y1="100" x2="250" y2="68" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="254,65 242,68 248,77" fill="#1d6fd1"/>
  <text x="300" y="96" font-size="11" text-anchor="middle" fill="#1d6fd1">try new</text>
  <line x1="160" y1="100" x2="110" y2="68" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <polygon points="106,65 118,68 112,77" fill="#b4232c"/>
  <text x="60" y="96" font-size="11" text-anchor="middle" fill="#b4232c">fall back</text>
</svg>
```

Overwriting slot A to save memory throws away the way back.
:::
