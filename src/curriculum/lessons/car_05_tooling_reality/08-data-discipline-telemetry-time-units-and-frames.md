---
id: l08-data-discipline-telemetry-time-units-and-frames
title: "Data discipline: telemetry, time, units and frames"
minutes: 21
covers:
  - Python for analysis, tooling, pipelines and test infrastructure
---

Nearly everything an analyst or a GNC engineer touches on a given day starts as data someone else recorded: a sensor log from a test, a telemetry stream from a flight, the output files of a simulation campaign. Reading that data correctly — the right format, the right time base, the right units, the right reference frame — sounds like the least interesting part of the job. It is also where the single most common class of real, consequential error in this field actually lives, because a units mismatch or a frame error does not usually look like an error. It looks like a number, and the number is wrong by a clean, specific, entirely explicable amount that nobody notices until it matters.

This lesson is a second lesson on Python's role in this field, specifically the part of that role spent moving and interpreting data rather than modeling dynamics — because the discipline this lesson teaches is exercised constantly, in exactly the pipelines and tooling the earlier lesson on Python's role described in the abstract.

## Telemetry formats and files too large to load carelessly

Raw telemetry from real hardware is commonly packed binary — every byte doing work, decoded according to a format specification, often called an interface control document, that maps byte offsets to physical quantities, each with a stated unit and scale factor. Ground-test data and simulation output more often arrive as row-per-sample text, commonly comma-separated, which is easy to read by eye but wasteful of space and slow to parse at scale. Large scientific datasets frequently use a structured binary format built for exactly this problem — organized so that a program can read one slice of a large file, a specific time window or a specific channel, without reading the entire file into memory first.

That last property matters because telemetry files get large fast: a single test or flight, logging dozens of channels at a few hundred hertz for an hour, produces tens of millions of samples. Reading an entire multi-gigabyte file into memory at once, the way a small script naturally tends to, can fail outright on a machine without enough memory, or be far slower than the analysis needs — most questions asked of a large log only need one channel, or one time window, not the whole file. The alternative is to read in chunks, read only the columns or time range actually needed, or use a format that supports reading a slice directly, rather than loading everything and filtering afterward.

## Time bases: three clocks that are not the same clock

A pipeline that combines two data streams — a sensor log and a ground event log, say — has to know what clock each one is stamped in, because "seconds since some reference" is not one universal quantity. GPS time and Coordinated Universal Time (UTC) are two real, commonly encountered examples that disagree by a specific, known number of seconds: UTC periodically inserts a leap second to stay aligned with Earth's rotation, while GPS time does not, so the two clocks drift apart by exactly one second at each insertion and then hold that offset until the next one. As of the most recent leap second, inserted at the end of 2016, that offset is 18 seconds — a figure that only changes if and when another leap second is inserted, which happens irregularly and is announced well in advance, not on a fixed schedule.

::: example Treating GPS time as UTC without converting
```python
gps_utc_offset_s = 18   # since the most recent leap second, 31 Dec 2016
t_gps = 100_000.5
t_utc_true = t_gps - gps_utc_offset_s
t_utc_assumed_equal = t_gps   # BUG: code treats the GPS timestamp as already UTC

print(t_utc_true, t_utc_assumed_equal - t_utc_true)
# 99982.5   18.0
```

A pipeline that differences a GPS-timestamped sensor event against a UTC-timestamped ground event, without converting one to match the other, is off by exactly 18 seconds — small enough to look like a plausible timing jitter rather than an obvious error, and large enough to completely invalidate any analysis that depends on knowing which event happened first, or how far apart two events actually were, at the sub-second precision most GNC timing questions actually need.
:::

Mission elapsed time, spacecraft clock ticks, and other program-specific time bases add more of the same problem in different clothing: each is a legitimate, well-defined way to timestamp a sample, and none of them are directly comparable to another without an explicit, correct conversion. The discipline is not memorizing every possible time base — it is never assuming two timestamps are in the same base without checking, because the cost of being wrong is a silent, specific, and rarely round-numbered error.

## Units: a magnitude error with a clean, recognizable size

A units mismatch happens when a value crosses an interface between two pieces of code that disagree, without either one realizing it, about what unit that value is in. The result is a specific error: the value used is the correct number, in the wrong unit, so it is wrong by exactly the conversion factor between the two units — never a random amount.

::: example An impulse crossing an interface in the wrong unit
A thruster-performance routine, written against a supplier's data sheet specified in pound-force-seconds — a unit still found on some propulsion hardware documentation — computes the actual impulse delivered by a burn and reports the number 850,000, meaning 850,000 lbf·s. The navigation code consuming that number, per its own interface specification, expects every dynamics quantity in SI, and uses 850,000 directly as newton-seconds when it updates its estimate of the vehicle's velocity change:

```python
LBF_TO_N = 4.4482216153
reported_value = 850_000.0          # what the thruster routine returns
mass_kg = 2200.0

true_impulse_Ns = reported_value * LBF_TO_N     # the value really means lbf*s
true_dv = true_impulse_Ns / mass_kg

nav_believed_dv = reported_value / mass_kg      # nav uses it uncorrected, as if N*s

print(round(true_impulse_Ns, 1), round(true_dv, 2), round(nav_believed_dv, 2))
# 3780988.4   1718.63   386.36
```

The burn actually delivers 3,780,988 N·s of impulse — 1,718.6 m/s of real velocity change to the vehicle. The navigation system, never having converted the unit, believes only 386.4 m/s was delivered. The vehicle's actual state and the navigation system's belief about its own state are now 1,332.3 m/s apart, and nothing about either number looks wrong in isolation — 386 m/s is a perfectly plausible-looking delta-v for many burns, which is exactly what makes this class of error dangerous rather than merely inconvenient. This is the same shape of error, worked with clean invented numbers here, behind one of the most widely documented public case studies in this field: a 1999 NASA interplanetary mission lost because ground software produced values in pound-force-seconds that navigation software consumed as newton-seconds, a mismatch that survived undetected through months of otherwise successful operation.
:::

## Frames: a direction error with a size that hides from a magnitude check

A frame error is structurally different from a units error in one specific, useful way: it changes the direction of a quantity while often leaving its magnitude completely unchanged, which means a sanity check that only compares magnitudes — "is this an aerospace-reasonable acceleration" — can pass right over it.

::: example A thrust vector never rotated out of the body frame
A vehicle commands 1,000 N of thrust along its own body x-axis, and the vehicle is yawed 30° from the inertial frame. Correctly used, the commanded thrust has to be rotated into the inertial frame before it can be combined with an inertial-frame state:

```python
import numpy as np

def rot_z(deg):
    th = np.radians(deg)
    c, s = np.cos(th), np.sin(th)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

thrust_body = np.array([1000.0, 0.0, 0.0])
mass, yaw_deg = 2200.0, 30.0

a_correct = (rot_z(yaw_deg) @ thrust_body) / mass    # rotated into inertial frame
a_bug = thrust_body / mass                            # BUG: used as if already inertial

print(np.round(a_correct, 4), np.round(a_bug, 4))
# [0.3937 0.2273 0.    ]  [0.4545 0.     0.    ]
```

Both vectors have exactly the same magnitude, 0.4545 m/s² — the rotation does not add or remove energy, it only changes direction — so a check that only asked "is the acceleration magnitude reasonable" would find nothing wrong with either one. The direction error between them is exactly 30°, which is not a coincidence: a pure, unrotated frame error reproduces the misalignment angle exactly, since nothing else about the vector was touched. Left uncorrected for ten seconds of constant acceleration, the two accelerations put the vehicle 11.8 meters apart in position — a small-looking number after ten seconds that only grows, and compounds, the longer the error goes unnoticed.
:::

::: key
A units error changes a quantity's magnitude by a specific, clean conversion factor and can be caught by a magnitude sanity check. A frame error changes a quantity's direction, often leaving its magnitude untouched, and hides from exactly that kind of check — the two require different tests, and a suite that only checks magnitudes will silently miss every frame error it encounters.
:::

## The discipline that actually prevents both

Nothing in either example above depended on a subtle conceptual mistake — both bugs are one missing conversion and one missing rotation, the kind of thing anyone can do on a Friday afternoon. The discipline that catches them before they ship is not cleverness; it is making units and frames impossible to lose track of, and testing explicitly for exactly these two failure modes rather than trusting a result that merely looks plausible.

In practice this means naming variables with their unit and frame explicit rather than implicit — `thrust_N` rather than `thrust`, `pos_eci_m` rather than `position` — so that a mismatch is at least visible to a careful reader even before any test catches it; validating units and frames explicitly at every interface between pieces of code written by different people or at different times, exactly where the two examples above broke down; and writing tests specifically aimed at these two failure modes — a test that would fail if a unit conversion were dropped, and a separate test that would fail if a rotation were dropped or applied in the wrong direction — rather than relying on a single end-to-end test whose plausible-looking output, as both examples showed, is exactly what a units or frame bug is good at producing.

::: warning "The number looks reasonable" is the failure mode, not the safeguard
Both examples in this lesson produced an output that, read in isolation, looked like an ordinary, plausible value. That is not a coincidence — it is what makes units and frame errors the most common class of real error in this kind of work rather than a rare, exotic one. A specific, targeted test for the conversion and the rotation catches what a plausibility check, by design, cannot.
:::

## Check yourself

::: check
Name three distinct time bases that can appear in GNC-adjacent data, and explain the concrete risk of combining two of them without an explicit conversion.
:::

::: answer
GPS time, UTC, and a mission-elapsed or spacecraft-clock time base are all legitimate ways timestamps appear in this kind of data. Combining two without converting produces a timing error equal to whatever offset exists between them — for GPS time and UTC, currently 18 seconds since the most recent leap second — which is small enough to look like ordinary timing noise rather than an obvious mistake, while being large enough to invalidate any analysis that depends on the true order or spacing of events.
:::

::: check
In the impulse example, explain why the navigation system's belief about its own velocity change ends up wrong by 1,332.3 m/s, and why that specific number is the size it is rather than some other error.
:::

::: answer
The thruster routine's reported value, 850,000, genuinely means pound-force-seconds, so the true impulse delivered is 850,000 times the lbf-to-newton conversion factor, giving 3,780,988 N·s and a true velocity change of 1,718.6 m/s. The navigation system uses the same number as if it were already in newton-seconds, computing 386.4 m/s instead. The 1,332.3 m/s gap is exactly the difference between those two calculations — it is not a random error, it is the specific, computable consequence of applying the lbf-to-N conversion factor to one number and not the other.
:::

::: check
Explain the key structural difference between a units error and a frame error, and why that difference matters for what kind of test catches each one.
:::

::: answer
A units error changes a quantity's magnitude by a clean conversion factor while typically leaving its direction (or its role in the calculation) unaffected; a frame error changes a quantity's direction, often leaving its magnitude completely unchanged, since a rotation does not add or remove magnitude. This matters because a test or sanity check that only compares magnitudes against a plausible range will tend to catch a units error, whose magnitude is now clearly wrong, while missing a frame error entirely, since the magnitude it is checking never changed — each failure mode needs a test aimed at the specific thing it corrupts.
:::

::: check
In the frame-error example, the direction error between the correct and buggy acceleration vectors is exactly 30°. Explain why that number is exactly the vehicle's yaw angle and not some other value.
:::

::: answer
The buggy version uses the body-frame thrust vector completely unrotated, while the correct version rotates the same vector by the vehicle's 30° yaw to express it in the inertial frame. Since both vectors start as the identical body-frame vector and the only difference between them is that one was rotated by the yaw angle and the other was not, the angle between the two resulting vectors is exactly the rotation that was skipped — the yaw angle itself, 30°, with no other contribution.
:::

::: check
Explain why loading an entire multi-gigabyte telemetry file into memory before doing anything with it is often the wrong approach, and name one concrete alternative.
:::

::: answer
A long, high-rate log can reach tens of millions of samples across many channels, and most analysis questions only need one channel or one time window rather than the entire file; loading everything first can exceed available memory outright or waste significant time reading data that will immediately be discarded. A concrete alternative is reading the file in chunks, or reading only the specific columns or time range needed — directly, if the file format supports doing so — rather than loading the whole file and filtering afterward.
:::

::: check
Describe one concrete discipline — a naming convention, a boundary check, or a specific test — that would have caught the units bug before it shipped, and one that would have caught the frame bug, and explain why each is aimed at the failure mode it catches.
:::

::: answer
For the units bug: naming the interface value explicitly, such as `impulse_lbf_s` rather than a bare `impulse`, combined with a boundary check or test asserting the value is converted to newton-seconds before being used in any SI calculation, would make the missing conversion visible and testable rather than implicit. For the frame bug: a specific test that supplies a known nonzero yaw and asserts the resulting inertial-frame vector matches a hand-computed rotated value — not merely that its magnitude is reasonable — would fail immediately if the rotation were ever dropped, because it is aimed at direction, the exact property a units-style magnitude check cannot see.
:::

## Summary

| Concept | The risk | What catches it |
| --- | --- | --- |
| Telemetry format | Misreading byte offsets or columns against the wrong specification | Reading against the stated interface document, not assumption |
| Large files | Loading more data than needed, or than memory allows | Chunked, sliced, or format-native partial reads |
| Time base | Combining timestamps from different clocks without converting | Explicit conversion (for example, GPS time is 18 s ahead of UTC) before any differencing |
| Units | A value crossing an interface in the wrong unit, wrong by a clean factor | Explicit unit-labeled names and a magnitude-focused boundary test |
| Frames | A vector used in the wrong reference frame, direction wrong, magnitude often unchanged | A test that checks direction against a known rotation, not only magnitude |

The next lesson turns from getting data right to the less glamorous, far more common daily work of catching a mistake before it ships: regression suites, build breakages, and reproducing someone else's result.
