---
id: l12-mode-sequencer-and-fdir
title: A launch-vehicle mode sequencer with fault protection
minutes: 23
covers:
  - A launch-vehicle mode sequencer and FDIR/safe-mode logic
---

Think about a school fire drill. The day has a schedule: first period, second period, lunch. Each change happens when the bell rings, not before. But at any moment, whatever period it is, the fire alarm overrides the schedule and everyone goes to the same place by the same route. Someone also has to *decide* the alarm is real: a single puff of steam from the cafeteria does not empty the building, but smoke that keeps coming does.

A launch vehicle's flight software has exactly those two layers. The **mode sequencer** is the schedule: the chart that walks the vehicle through its flight phases, one at a time, each change guarded by a condition. **FDIR** is the fire alarm: **fault detection, isolation and recovery**, the logic that notices something has gone wrong, works out what, and moves the vehicle to a safe configuration.

This lesson builds both, for a reusable first-stage booster in the style of a Falcon 9, using every tool from the last four lessons: states and hierarchy (lesson 8), entry actions and parallel states (lesson 9), temporal logic and conditions (lesson 10), and exclusive guards (lesson 11). Then it runs the chart's logic in Python on a simulated flight and traces every decision.

## The flight phases

A booster's flight, from the pad to landing, in the order the chart visits it:

| State | What the vehicle is doing | Leaves when (guard) |
|---|---|---|
| PRELAUNCH | on the pad; engines light, clamps hold | `[launch_cmd && duration(accel > 11) >= 0.1]` |
| LIFTOFF | climbing straight up to clear the tower | `[after(4, sec) && alt > 100]` |
| PITCHOVER | a small, timed tilt toward downrange | `[after(10, sec)]` |
| GRAVITY_TURN | nose follows the velocity; gravity bends the path | `[speed >= 2200]` |
| MECO | main engine cutoff; thrust tails off | `[after(3, sec) && accel < 1]` |
| STAGE_SEP | stages separate | `[duration(sep_sw) >= 0.1]` or `[after(5, sec) && ~sep_sw]` |
| COAST | unpowered arc over the top | `[vz < 0 && alt < 70000]` |
| ENTRY_BURN | three engines slow the fall before thick air | `[speed <= 1300]` or `[alt < 40000 && speed > 1300]` |
| DESCENT | unpowered fall, steered by fins | `[alt <= 1540]` |
| LANDING_BURN | one engine brings it to a hover | final state of this chart |

Here `accel` is the sensed acceleration along the vehicle's long axis in m/s², `alt` the altitude in meters, `speed` the speed in m/s, `vz` the vertical velocity (negative when falling), and `sep_sw` the separation switch.

Each guard has a job.

- **Debounce** on liftoff and separation (`duration`), so one noisy sample cannot trigger a phase.
- **Minimum dwell times** (`after`): LIFTOFF stays at least 4 s whatever the altitude says, PITCHOVER is a fixed 10 s maneuver, and MECO waits 3 s for the thrust to die away.
- **Physical thresholds** on speed and altitude, where guidance or the trajectory design sets the number.
- Every guard is a **condition**; the chart uses no events.

Nine of the flight states sit inside a superstate FLIGHT. PRELAUNCH is outside it: a problem on the pad means "hold the countdown", not "abort". Beside FLIGHT is one more state, **ABORT**, whose entry action commands the engines off and the vehicle to its **[[safe configuration|safe-config]]**. The [[whole sequencer|sequencer-drawing]] is an exclusive (OR) group: PRELAUNCH, FLIGHT or ABORT.

## Safe mode reachable from anywhere

ABORT has to be reachable from every flight phase, including phases added next year. Lesson 8's answer: one transition, `[abort_req]`, drawn from FLIGHT's border to ABORT. Because outer transitions are tested before inner ones (lesson 11), that arrow is tested before any phase's own guards on every wake-up. No phase can delay it.

Two phases also have their own route to ABORT, for failures only they can see. STAGE_SEP gives up if the stages have not parted 5 s after the command. ENTRY_BURN gives up if the booster reaches 40 km still faster than 1300 m/s, meaning the burn is not working. These arrows start inside FLIGHT and cross its border.

And ABORT has no way out. That is deliberate: it is **latched**. Once the vehicle has decided to abort, no later sensor reading may talk it back into flying. Only a reset from outside (on the ground, a person) can clear it. A fault flag that can clear itself invites **[[chattering|chatter]]**: in, out and back into safe mode on successive steps as a noisy signal hovers near its threshold.

::: key
Safe mode belongs on a superstate border: one transition from the superstate that contains every flight phase, so it is tested first on every wake-up and covers phases added later. Safe states and fault flags are latched: once set, only an explicit external reset clears them.
:::

## Proving the guards exclusive

Lesson 11 asked for a written argument, state by state, that no two outgoing guards can be true at once. Here it is for this chart.

| Source | Outgoing guards | Why at most one is true |
|---|---|---|
| PRELAUNCH | one guard | nothing to compare |
| LIFTOFF, PITCHOVER, GRAVITY_TURN, MECO, COAST, DESCENT | one guard each | nothing to compare |
| STAGE_SEP | `duration(sep_sw) >= 0.1`; `after(5, sec) && ~sep_sw` | the first needs `sep_sw` true now, the second needs it false |
| ENTRY_BURN | `speed <= 1300`; `alt < 40000 && speed > 1300` | partition on speed at 1300 |
| FLIGHT border | `abort_req`, overlapping every inner guard | on purpose: abort wins by hierarchy, documented as a requirement |

The last row is lesson 11's "explicit, documented priority": the overlap is the point, the priority comes from the outer-before-inner rule, and a comment beside the arrow says so.

::: warning A guard can be exclusive and still leave you stuck
Exclusivity is not the only question. Ask of each state: "what if *no* guard ever becomes true?" MECO waits for `accel < 1`. If an engine fails to shut down, that never happens and the chart sits in MECO forever. The answer is not another guard in the sequencer, but a monitor in FDIR ("thrust still present 2 s after cutoff command") that raises `abort_req`. Every wait in a sequencer needs a timeout somewhere.
:::

## FDIR: detect, isolate, recover

FDIR runs beside the sequencer, not inside it, so the chart's top level uses parallel (AND) decomposition, as in lesson 9. Three parallel states run in this execution order each wake-up:

1. **FDIR** watches sensors and raises fault flags.
2. **ABORT_SUPERVISOR** turns fault flags into one decision, `abort_req`.
3. **SEQUENCER** is the phase machine above.

Because FDIR runs first, a fault detected on a wake-up reaches the supervisor and the sequencer on that same wake-up. With the sequencer first, it would react one step later: still deterministic, 0.02 s slower at 50 Hz.

Each of FDIR's three letters is a separate job.

- **Detection:** decide that something is really wrong, not a noisy sample. The standard tool is a **persistence counter**: count consecutive bad samples, reset to zero on a good one, declare a fault at $N$. It is `duration`'s debounce, written as a counter because it runs over nine engines.
- **Isolation:** decide *which* part failed. With one pressure sensor per engine, the sensor names the engine. With redundant units, isolation is by **voting**: of three accelerometers, the one that disagrees with the other two is the liar.
- **Recovery:** do something that makes the vehicle safe or keeps the mission going. For one failed engine, shut it down and fly on with eight, since the vehicle is designed to tolerate an **[[engine out|engine-out]]**. For two, abort.

::: key
FDIR (fault detection, isolation and recovery): recognise an anomaly, determine which component is responsible, and command a safe configuration. It is inherently mode logic with hierarchy and parallelism, which is exactly what a Stateflow chart expresses, so a chart is its usual home.
:::

### The engine monitor

Here is the engine monitor's during action, in MATLAB action language. `pc` is a vector of nine chamber pressures scaled so 1.0 is normal, and `asc_powered` is set true by LIFTOFF's entry action and false by MECO's:

```text
ENGINE_MON
du:
for i = 1:9
    if asc_powered && ~eng_failed(i)
        if pc(i) < PC_MIN
            bad_count(i) = bad_count(i) + 1;
        else
            bad_count(i) = 0;
        end
        if bad_count(i) >= N_PERSIST
            eng_failed(i) = true;
            eng_shutdown(i) = true;
            n_out = n_out + 1;
        end
    end
end
```

With `PC_MIN = 0.8` and `N_PERSIST = 5`, an engine is declared failed on its fifth consecutive low sample, 0.08 s after the first at 50 Hz. `eng_failed(i)` is latched: nothing ever sets it back to false in flight, and the `~eng_failed(i)` test stops a failed engine from being counted twice.

Here is the counter on its own, in Python, fed a one-sample glitch and then a real failure:

```python
def persist(count, bad, n):
    """One wake-up of an n-sample persistence counter: returns (count, tripped)."""
    count = count + 1 if bad else 0
    return count, count >= n

pc = [1.0, 0.3, 1.0, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]   # chamber pressure, 1.0 = nominal
count = 0
for k, p in enumerate(pc):
    count, tripped = persist(count, p < 0.8, 5)
    print(k, p, count, tripped)
# 0 1.0 0 False
# 1 0.3 1 False      <- glitch
# 2 1.0 0 False      <- reset
# 3 0.3 1 False
# 4 0.3 2 False
# 5 0.3 3 False
# 6 0.3 4 False
# 7 0.3 5 True       <- fault declared on the 5th bad sample in a row
# 8 0.3 6 True
```

::: warning A consecutive counter can miss an intermittent fault
A connector that fails two samples out of every three never produces five bad samples in a row, so a consecutive counter never trips, however long it goes on. An **up/down counter** adds 1 on a bad sample and subtracts 1 on a good one, never going below 0. On the pattern bad, bad, good, repeated, it climbs 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5, and trips on the 11th sample. Pick the counter to match the faults you expect.
:::

### The watchdog and the supervisor

A **[[watchdog|watchdog]]** checks that something is still alive. The guidance computer increments a heartbeat counter `hb` every wake-up. The watchdog, a second parallel state inside FDIR, compares it with last wake-up's value: if unchanged, it adds one to `hb_stale`, otherwise it resets it. The transition `[hb_stale >= 5]` from WD_OK to WD_FAULT fires after five stale beats, and WD_FAULT's entry action sets the latched flag `wd_fault`.

ABORT_SUPERVISOR has two states, MONITORING and ABORT_LATCHED, and one transition between them:

```text
MONITORING --[n_out >= 2 || wd_fault]--> ABORT_LATCHED     (entry: abort_req = true;)
```

Read `||` as "or". The abort rules live in one place a reviewer can read, not spread over every monitor.

## Running the chart on a simulated flight

The chart's logic is small enough to reproduce line for line in Python. The simulated vehicle is a crude two-dimensional **[[point-mass model|point-mass]]** with plausible, made-up numbers: 550 t at liftoff, nine engines of 845 kN each, a 3° pitch-over, and air that thins with altitude. The chart runs at 50 Hz; `after` and `duration` are counted in whole wake-ups, as in lesson 10. Two deliberate glitches are injected: one 15 m/s² vibration spike on the pad at 3.00 s, and one bad pressure sample on engine 4 at 40.00 s.

::: example The nominal flight, traced
Every row is a wake-up on which something happened. Altitude, speed and sensed acceleration are the values at that wake-up.

| t (s) | Region | What happened | alt (m) | speed (m/s) | accel (m/s²) |
|---|---|---|---|---|---|
| 3.02 | SEQUENCER | pad spike ignored: held 1 sample, `duration` reset | 0 | 0 | 9.8 |
| 4.12 | SEQUENCER | PRELAUNCH to LIFTOFF | 0 | 0 | 14.0 |
| 10.82 | SEQUENCER | LIFTOFF to PITCHOVER | 100 | 30 | 14.4 |
| 20.82 | SEQUENCER | PITCHOVER to GRAVITY_TURN | 643 | 80 | 15.2 |
| 40.02 | FDIR | engine 4 counter 1 back to 0 | 3239 | 199 | 16.9 |
| 145.94 | SEQUENCER | GRAVITY_TURN to MECO | 65,873 | 2200 | 43.6 |
| 148.94 | SEQUENCER | MECO to STAGE_SEP | 68,946 | 2186 | 0.0 |
| 149.54 | SEQUENCER | STAGE_SEP to COAST | 69,549 | 2184 | 0.1 |
| 353.70 | SEQUENCER | COAST to ENTRY_BURN | 70,000 | 2181 | 0.1 |
| 368.08 | SEQUENCER | ENTRY_BURN to DESCENT | 57,716 | 1299 | 78.0 |
| 444.28 | SEQUENCER | DESCENT to LANDING_BURN | 1537 | 306 | 21.1 |
| 456.68 | SEQUENCER | vertical speed reaches 0: end of trace | 6 | 0 | 29.2 |

**Step 1: the pad.** The clamps release at 4.00 s. The first sample above 11 m/s² is at 4.02 s, and `duration` reaches 0.1 s five wake-ups later, at 4.12 s: the sixth consecutive sample, as lesson 10 predicted. The spike at 3.00 s lasted one sample and was forgotten at 3.02 s.

**Step 2: the dwell times.** LIFTOFF was entered at 4.12 s. `after(4, sec)` was satisfied at 8.12 s, but the altitude only passed 100 m at 10.82 s, so altitude decided. PITCHOVER lasted exactly $20.82 - 10.82 = 10.00$ s, and MECO exactly $148.94 - 145.94 = 3.00$ s, both set by `after`.

**Step 3: separation.** STAGE_SEP's entry commanded separation at 148.94 s, the switch closed 0.5 s later at 149.44 s, and `duration(sep_sw)` reached 0.1 s at 149.54 s. The timeout guard `after(5, sec) && ~sep_sw` was never close.

**Step 4: engine 4's glitch.** The single bad sample took the counter to 1 at 40.00 s; the next good sample reset it. No fault, no shutdown.

**Sanity check.** MECO at about 146 s, 66 km and 2.2 km/s, with a 121 km peak on the coast, is the right size for a booster of this class. Every phase change came on the first wake-up its guard allowed.
:::

::: example Two engines out
Same flight, but engine 4 loses pressure at 70.00 s and engine 7 at 95.00 s, both for good. The rows up to 20.82 s are identical to the nominal flight.

| t (s) | Region | What happened | alt (m) | speed (m/s) |
|---|---|---|---|---|
| 70.08 | FDIR | engine 4: 5th bad sample; failed, shut down; `n_out` = 1 | 12,250 | 478 |
| 95.08 | FDIR | engine 7: 5th bad sample; failed, shut down; `n_out` = 2 | 24,193 | 776 |
| 95.08 | ABORT_SUPERVISOR | MONITORING to ABORT_LATCHED; `abort_req` = true | 24,193 | 776 |
| 95.08 | SEQUENCER | FLIGHT border to ABORT (was in GRAVITY_TURN) | 24,193 | 776 |

**Step 1: detection.** Bad samples at 70.00, 70.02, 70.04, 70.06 and 70.08 s: the fifth is at 70.08 s, when `bad_count(4)` reaches 5.

**Step 2: recovery from one engine out.** FDIR shuts engine 4 down and the vehicle flies on with eight. `n_out` is 1, below the abort threshold, so the supervisor stays in MONITORING.

**Step 3: two out.** At 95.08 s all three regions act on the same wake-up, in execution order: FDIR declares engine 7 failed, the supervisor sees `n_out >= 2` and latches `abort_req`, and the sequencer tests FLIGHT's border first and goes to ABORT. GRAVITY_TURN's own guard is never tested.

**Sanity check.** From the first bad sample of engine 7 to ABORT took $95.08 - 95.00 = 0.08$ s: four steps of 0.02 s after the first bad one, as designed. Had the sequencer run before FDIR, the same abort would come one wake-up later, at 95.10 s.
:::

Three more runs complete the set. With the separation switch stuck open, the chart goes STAGE_SEP to ABORT at 153.94 s, exactly $5.00$ s after entering STAGE_SEP. With the guidance heartbeat frozen from 120.00 s, WD_FAULT fires at 120.08 s and the chart aborts on the same wake-up. With only one of the three entry-burn engines lighting, the booster reaches 40 km at 1679 m/s and ENTRY_BURN goes to ABORT at 383.92 s.

## Reachable and covered

The last two properties a reviewer asks for are about the whole chart.

**Every state is reachable from PRELAUNCH.** Treat the chart as a graph, states as dots and transitions as arrows, and search it. Lesson 11 used a program to check guards; this one checks the arrows:

```python
from collections import deque

# every transition in the sequencer, source -> destinations
edges = {
    'PRELAUNCH':    ['LIFTOFF'],          # enters FLIGHT, whose default is LIFTOFF
    'LIFTOFF':      ['PITCHOVER'],
    'PITCHOVER':    ['GRAVITY_TURN'],
    'GRAVITY_TURN': ['MECO'],
    'MECO':         ['STAGE_SEP'],
    'STAGE_SEP':    ['COAST', 'ABORT'],
    'COAST':        ['ENTRY_BURN'],
    'ENTRY_BURN':   ['DESCENT', 'ABORT'],
    'DESCENT':      ['LANDING_BURN'],
    'LANDING_BURN': [],
    'ABORT':        [],
}
FLIGHT = ['LIFTOFF', 'PITCHOVER', 'GRAVITY_TURN', 'MECO', 'STAGE_SEP',
          'COAST', 'ENTRY_BURN', 'DESCENT', 'LANDING_BURN']
for s in FLIGHT:                          # FLIGHT's border arrow [abort_req]
    edges[s] = edges[s] + ['ABORT']

def reachable(start):
    seen, todo = {start}, deque([start])
    while todo:
        s = todo.popleft()
        for d in edges[s]:
            if d not in seen:
                seen.add(d)
                todo.append(d)
    return seen

print(sorted(set(edges) - reachable('PRELAUNCH')))
# []
```

The empty list says no state is unreachable in the graph. That is not enough on its own: an arrow whose guard can never be true is still in the graph. The simulated flights close the gap by actually taking each arrow.

**Every state and transition is covered.** The sequencer has 12 states (PRELAUNCH, FLIGHT, the nine phases, ABORT) and 12 transitions (PRELAUNCH to FLIGHT, eight phase-to-phase links, STAGE_SEP to ABORT, ENTRY_BURN to ABORT, and FLIGHT's border arrow). Counting what the five runs took:

| Run | New transitions taken | Running total |
|---|---|---|
| Nominal | PRELAUNCH to FLIGHT and all eight phase links | 9 of 12 |
| Two engines out | FLIGHT border to ABORT | 10 of 12 |
| Separation stuck | STAGE_SEP to ABORT | 11 of 12 |
| Frozen heartbeat | none new in the sequencer (new in FDIR: WD_OK to WD_FAULT) | 11 of 12 |
| Weak entry burn | ENTRY_BURN to ABORT | 12 of 12 |

The nominal flight alone reaches every state except ABORT and 9 of 12 transitions, 75 percent. Each failure path needs its own test. That is what a **[[coverage|coverage-later]]** report is for.

## Check yourself

::: check
In the nominal trace, LIFTOFF was entered at 4.12 s and left at 10.82 s. Which half of the guard `[after(4, sec) && alt > 100]` held the chart there longer, and when would it have left if the vehicle had been lighter and passed 100 m at 7.00 s?
:::

::: answer
The altitude half: `after(4, sec)` became true at $4.12 + 4.00 = 8.12$ s, but `alt > 100` only at 10.82 s. With a lighter vehicle passing 100 m at 7.00 s, the altitude half is true first and `after(4, sec)` decides: the chart leaves at 8.12 s. That is the point of a minimum dwell time.
:::

::: check
The engine monitor runs at 50 Hz with `N_PERSIST = 5`. An engine's pressure reads bad at 30.00, 30.02, 30.04 and 30.06 s, good at 30.08 s, then bad from 30.10 s on. When is the engine declared failed? What would an up/down counter do?
:::

::: answer
The consecutive counter reaches 4 at 30.06 s, resets to 0 at 30.08 s, then counts 1 at 30.10, 2 at 30.12, 3 at 30.14, 4 at 30.16 and 5 at 30.18 s: failed at 30.18 s. An up/down counter goes 1, 2, 3, 4, then down to 3 at 30.08 s, then 4 at 30.10 and 5 at 30.12 s: failed at 30.12 s, three wake-ups sooner, because it does not throw away the evidence from before the good sample.
:::

::: check
A teammate proposes moving the ABORT arrow from FLIGHT's border to separate arrows, one from each of the nine phases, "so each phase can have its own abort rule". What do you lose?
:::

::: answer
Three things. Priority: on a phase, the abort arrow is one of several numbered arrows, and an overlapping guard numbered ahead of it could win; on the border it is tested before every phase guard. Completeness: a phase added later must remember its own abort arrow. Reviewability: nine arrows to check instead of one. Phase-specific abort rules belong in the supervisor's logic, feeding the one `abort_req`, not in nine arrows.
:::

::: check
Why does ABORT_SUPERVISOR's ABORT_LATCHED state have no outgoing transition, even though the two failed engines' pressure readings might recover a moment later?
:::

::: answer
Because the abort decision is latched. A reading that recovers could be a sensor coming back while the engine is still damaged, or a signal hovering near its threshold. Letting the flag clear would let the vehicle chatter in and out of abort, commanding engines on and off on successive steps. Only an explicit external reset may clear a latched fault.
:::

::: check
A test campaign runs only the nominal flight and the two-engines-out flight. What percentage of the sequencer's transitions is covered, and which runs would you add to reach 100 percent?
:::

::: answer
Nominal gives 9 transitions, two-engines-out adds FLIGHT's border arrow: 10 of 12, about 83 percent. Missing are STAGE_SEP to ABORT and ENTRY_BURN to ABORT. Add a run where the separation switch never closes, and one where the entry burn is too weak to slow the booster below 1300 m/s by 40 km.
:::

## Summary

| Idea | Meaning | In this chart |
|---|---|---|
| Mode sequencer | exclusive states, one per flight phase | PRELAUNCH, FLIGHT (nine phases), ABORT |
| Debounce, dwell | `duration(...)`, `after(...)` in guards | liftoff and separation; LIFTOFF, PITCHOVER, MECO |
| Safe mode on a border | one arrow from the superstate | `[abort_req]` from FLIGHT, tested first |
| Latched | set once, cleared only by external reset | ABORT, ABORT_LATCHED, `eng_failed`, `wd_fault` |
| FDIR | detect, isolate, recover | persistence counters, per-engine isolation, shutdown or abort |
| Persistence counter | N bad samples in a row | 5 at 50 Hz: 0.08 s after the first |
| Watchdog | fault if a heartbeat stops | 5 stale beats |
| Parallel order | FDIR, supervisor, sequencer | detection and abort on the same wake-up |
| Reachability | graph search from PRELAUNCH | no unreachable state |
| Coverage | every state and transition taken in a test | 5 runs for 12 of 12 transitions |

This finishes the module: a model built from referenced components with bus interfaces and a data dictionary, and a chart that runs it through its flight. The next module, cod_slk_04_codegen, verifies all of this and turns it into flight code, starting with the MIL, SIL, PIL and HIL progression from model to hardware.

::: context safe-config What "safe" means depends on the vehicle
For an uncrewed booster, safe usually means engines off and propellant valves closed, with the range's flight termination system as the final backstop. For a crewed vehicle it means firing the launch escape system to pull the capsule away. For a satellite in orbit, "safe mode" is a long-lived state: point the solar panels at the Sun, keep the batteries charged, keep the radio listening, and wait for the ground. The chart's shape is the same in all three; only the entry action differs.
:::

::: context sequencer-drawing The sequencer, drawn
The nine flight phases snake through FLIGHT in flight order; FLIGHT's default transition (not drawn) enters LIFTOFF. The red arrow leaves from FLIGHT's border, so it applies to every phase. Two more arrows, from STAGE_SEP and from ENTRY_BURN to ABORT, cross the border and are left out to keep the picture readable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="8" width="90" height="24" rx="7" fill="#ffffff" stroke="#1f2a44"/>
  <text x="55" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">PRELAUNCH</text>
  <line x1="55" y1="32" x2="55" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="51,48 55,54 59,48" fill="#1f2a44"/>
  <rect x="8" y="54" width="322" height="158" rx="10" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="16" y="70" font-size="11" fill="#1f2a44">FLIGHT</text>
  <rect x="18" y="78" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="63" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">LIFTOFF</text>
  <rect x="124" y="78" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="169" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">PITCHOVER</text>
  <rect x="230" y="78" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="275" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">GRAVITY_TURN</text>
  <rect x="18" y="126" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="63" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">COAST</text>
  <rect x="124" y="126" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="169" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">STAGE_SEP</text>
  <rect x="230" y="126" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="275" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">MECO</text>
  <rect x="18" y="176" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="63" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">ENTRY_BURN</text>
  <rect x="124" y="176" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="169" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">DESCENT</text>
  <rect x="230" y="176" width="90" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="275" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">LANDING_BURN</text>
  <line x1="108" y1="90" x2="118" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="118,86 124,90 118,94" fill="#1f2a44"/>
  <line x1="214" y1="90" x2="224" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="224,86 230,90 224,94" fill="#1f2a44"/>
  <line x1="275" y1="102" x2="275" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="271,120 275,126 279,120" fill="#1f2a44"/>
  <line x1="230" y1="138" x2="220" y2="138" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="220,134 214,138 220,142" fill="#1f2a44"/>
  <line x1="124" y1="138" x2="114" y2="138" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="114,134 108,138 114,142" fill="#1f2a44"/>
  <line x1="63" y1="150" x2="63" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="59,170 63,176 67,170" fill="#1f2a44"/>
  <line x1="108" y1="188" x2="118" y2="188" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="118,184 124,188 118,192" fill="#1f2a44"/>
  <line x1="214" y1="188" x2="224" y2="188" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="224,184 230,188 224,192" fill="#1f2a44"/>
  <line x1="330" y1="133" x2="338" y2="133" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="338,129 344,133 338,137" fill="#b4232c"/>
  <rect x="344" y="120" width="50" height="26" rx="7" fill="#ffffff" stroke="#b4232c"/>
  <text x="369" y="137" font-size="11" text-anchor="middle" fill="#b4232c">ABORT</text>
  <text x="366" y="162" font-size="11" text-anchor="middle" fill="#b4232c">abort_req</text>
</svg>
```
:::

::: context chatter Chattering, and where "latch" comes from
A latch is an electrical relay that stays in its new position after the signal that switched it goes away, like a door latch that holds the door shut once it clicks. Engineers borrowed the word for software flags that stay set. Without a latch, a signal wobbling around a threshold flips a mode back and forth every step, which is called chattering. Engines commanded on, off, on at 50 Hz are worse than either choice held steadily.
:::

::: context engine-out Engine out, for real
Losing one engine and flying on is not hypothetical. On SpaceX's CRS-1 mission in October 2012, one of the Falcon 9's nine first-stage engines lost pressure and was shut down by the flight computer about 80 seconds into flight. The vehicle continued, and the Dragon capsule reached the International Space Station. A secondary satellite on the same flight ended up in a lower orbit than planned. Detect, isolate, recover, in real life.
:::

::: context watchdog A dog that must be fed
A watchdog timer counts down on its own, and the software it watches must reset (or "kick") it before it reaches zero. If the software hangs, nobody kicks the timer, it expires, and the watchdog acts: resets the processor or hands control to a backup. Flight computers usually have a hardware watchdog as well as software ones like this lesson's heartbeat check.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="340" y2="90" stroke="#6c7a93"/>
  <polyline points="20,40 60,80 60,40 100,80 100,40 140,80 140,40 190,90" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="60" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">kick</text>
  <text x="100" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">kick</text>
  <text x="140" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">kick</text>
  <line x1="190" y1="30" x2="190" y2="100" stroke="#b4232c" stroke-width="1.5"/>
  <text x="196" y="40" font-size="11" fill="#b4232c">timer expires: fault</text>
  <text x="330" y="108" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
</svg>
```

The blue line is the timer counting down toward the grey zero line. Each kick sets it back to full. After the last kick nothing resets it, and it hits zero at the red line.
:::

::: context point-mass How crude is the simulated flight?
A point-mass model treats the whole vehicle as a single dot with a mass: thrust pushes it along the pitch angle, gravity pulls it down, air drag slows it. It ignores rotation, wind, the Earth's curvature and many other things a real trajectory simulation includes. That is fine here, because the point is the chart's logic: the sequencer only needs signals that rise and fall in a realistic order at realistic sizes. Full six-degree-of-freedom simulations add the rest.
:::

::: context coverage-later Where coverage comes back
State and transition coverage are the simplest kinds. Module cod_slk_04 adds decision, condition and MC/DC coverage, which ask whether each part of a guard like `n_out >= 2 || wd_fault` was shown to matter on its own. The frozen-heartbeat run above, which added nothing to transition coverage, is exactly the run that condition coverage demands: it is the only one where the `wd_fault` half of that guard causes the abort.
:::
