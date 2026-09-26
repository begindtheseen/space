---
id: l08-data-discipline-telemetry-time-units-and-frames
title: "Data discipline: telemetry, time, units and frames"
minutes: 22
covers:
  - Python for analysis, tooling, pipelines and test infrastructure
---

Suppose a friend texts you "meet at 3". Three o'clock by whose clock — yours, or the one in the time zone they flew in from? And if they say "it's 20 minutes away", is that walking or driving? Every number that arrives from someone else carries hidden baggage: what clock it was measured on, what unit it is in, and which way it points. Leave any of that behind and the number still *looks* fine. It is only wrong.

Nearly everything a GNC engineer or analyst touches starts as data someone else recorded: a sensor log from a test, a **[[telemetry|telemetry-word]]** stream from a flight (telemetry is measurements sent back from a vehicle, often by radio), the output files of a simulation campaign. Reading it correctly — right format, right clock, right units, right direction — sounds like the dullest part of the job. It is also where the most common class of real, costly error in this field lives. A units or frame mistake rarely looks like a mistake. It looks like a number, and the number is wrong by a clean, specific amount that nobody notices until it matters.

This is the second lesson on Python's role in the job. The earlier one described analysis, tooling and pipelines in general. This one is about the daily part of that work: moving data around and reading it correctly. Most of it is done in Python, with **NumPy** (fast arrays of numbers) and **pandas** (tables of data).

## Telemetry formats, and files too big to load carelessly

Data arrives in a few common shapes.

- **Packed binary.** Raw telemetry from real hardware usually squeezes every **byte** (a group of 8 bits, the 0s and 1s a computer stores) to do work. To read it you need the format's rulebook, often called an **[[interface control document|icd]]**, or ICD. It says which bytes hold which physical quantity, and each quantity's unit and **scale factor** (the number you multiply the stored whole number by to get the real value).
- **Row-per-sample text.** Ground-test data and simulation output often come as one line per sample, with values separated by commas — a **CSV** file, for "comma-separated values". It is easy to read by eye but wasteful of space and slow to read at scale.
- **Structured binary for science.** Big scientific datasets often use a format such as **[[HDF5|hdf5]]**, built so a program can read one slice — one time window, or one channel — without reading the whole file first.

That last property matters because telemetry files get big fast. A test or flight logging dozens of **channels** (separate measured quantities) at a few hundred **hertz** (samples per second) for an hour produces **[[tens of millions of samples|data-volume]]**. Reading an entire multi-gigabyte file into memory at once — the thing a small script does naturally — can fail outright on a machine without enough memory, or waste most of its time. And most questions only need one channel or one time window.

The better habits: read the file in **chunks** (pandas can hand you a big CSV a block of rows at a time), read only the columns or time range you need, or use a format that lets you read a slice directly. Load less, then filter — not load everything, then filter.

## Time bases: three clocks that are not the same clock

When a pipeline combines two data streams — say a sensor log and a ground event log — it has to know which clock stamped each one. "Seconds since some starting moment" is not one universal quantity. A **time base** is the clock-and-starting-point a timestamp is measured on.

Two real time bases that disagree:

- **UTC** (Coordinated Universal Time, said "U-T-C") is the world's civil time. To stay in step with Earth's slightly irregular spin, it sometimes adds a **[[leap second|leap-seconds]]** — one extra second, announced months ahead, not on a fixed schedule.
- **[[GPS time|gps-time]]**, the clock used by the GPS satellites, never adds leap seconds.

So every time UTC adds a leap second, the two clocks slide exactly one more second apart, then hold that gap until the next one. The most recent leap second was added at the end of 2016. Since then GPS time has been **18 seconds ahead** of UTC. That number changes only if another leap second is added.

::: example Treating GPS time as UTC without converting
```python
gps_utc_offset_s = 18   # since the most recent leap second, 31 Dec 2016
t_gps = 100_000.5
t_utc_true = t_gps - gps_utc_offset_s
t_utc_assumed_equal = t_gps   # BUG: code treats the GPS timestamp as already UTC

print(t_utc_true, t_utc_assumed_equal - t_utc_true)
# 99982.5   18.0
```

**Step by step.** GPS time runs 18 s ahead, so to get UTC you subtract: $100{,}000.5 - 18 = 99{,}982.5$ s. The buggy line skips the subtraction and keeps $100{,}000.5$. The error is the difference: $100{,}000.5 - 99{,}982.5 = 18.0$ s.

**Why it matters.** A pipeline that compares a GPS-stamped sensor event with a UTC-stamped ground event, without converting one, is off by exactly 18 seconds. That is small enough to pass for timing jitter, not an obvious blunder. It is also large enough to wreck any analysis that needs to know which event came first, or how far apart two events were, at the under-a-second precision most GNC timing questions need.

**Sanity check.** The error is exactly the offset, 18.0 s, and not some odd number — a clean size like this is the fingerprint of a missing conversion.
:::

Mission elapsed time (seconds since launch), spacecraft clock ticks, and program-specific time bases are more of the same problem in different clothes. Each is a legitimate, well-defined timestamp. None can be compared with another without an explicit, correct conversion. The discipline is not memorizing every time base. It is **never assuming two timestamps share a time base without checking**, because being wrong gives a silent, specific, rarely round-looking error.

## Units: a size error with a clean, recognizable size

A **units mismatch** happens when a value crosses an **interface** — the boundary where one piece of code hands data to another — and the two sides disagree about its unit without either noticing. The value used is the right number in the wrong unit. So it is wrong by exactly the conversion factor between the two units — never by a random amount.

The example uses **impulse**: force multiplied by the time it acts, which equals the change in momentum. Divide impulse by mass and you get the change in velocity, $\Delta v$ (said "delta-v"):

$$
\Delta v = \frac{J}{m}
$$

where $J$ is the impulse in newton-seconds (N·s) and $m$ the mass in kilograms. The other unit is the **[[pound-force|pound-force]]** (lbf), a US unit of force. One lbf is 4.4482216153 N.

::: example An impulse crossing an interface in the wrong unit
A thruster-performance routine is written from a supplier's data sheet in pound-force-seconds, a unit still found on some propulsion paperwork. It reports the burn's impulse as the number 850,000, meaning 850,000 lbf·s. The navigation code, by its own interface rules, expects every quantity in SI. It uses 850,000 directly as newton-seconds to update its estimate of the vehicle's velocity change:

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

**Step 1, the truth.** Convert: $850{,}000 \times 4.4482 \approx 3{,}780{,}988$ N·s. Divide by mass: $3{,}780{,}988 / 2200 \approx 1{,}718.6$ m/s of real velocity change.

**Step 2, what navigation believes.** It skips the conversion: $850{,}000 / 2200 \approx 386.4$ m/s.

**Step 3, the gap.** $1{,}718.6 - 386.4 = 1{,}332.3$ m/s between the vehicle's real state and what its own navigation believes.

**Sanity check.** The ratio $1{,}718.6 / 386.4 \approx 4.45$ is exactly the lbf-to-newton factor, as it must be. Yet 386 m/s is a perfectly believable delta-v for many burns. Nothing looks wrong in isolation — which is what makes this error dangerous rather than merely annoying.

The numbers here are invented to be clean, but the shape is real. It is the same shape as one of the most widely told case studies in the field: the **[[1999 loss of a NASA Mars mission|mars-climate-orbiter]]**, where ground software produced values in pound-force-seconds that navigation software used as newton-seconds, a mismatch that went unnoticed through months of otherwise normal operation.
:::

## Frames: a direction error that hides from a size check

A **reference frame** is a set of three directions you measure along — like "forward, left, up" for you, or "north, east, up" for a map. A GNC engineer uses at least two all the time:

- the **body frame**, fixed to the vehicle and turning with it ("along the nose");
- an **inertial frame**, fixed relative to the stars and not turning with the vehicle ("toward a fixed point in space").

A **frame error** means using a vector — a quantity with a size and a direction — in the wrong frame. It is different from a units error in one very useful way: it changes the *direction* and often leaves the *size* (the **magnitude**) exactly the same. So a check that only asks "is this a reasonable-sized acceleration?" can sail right past it.

To move a vector from the body frame to the inertial frame you multiply it by a **rotation matrix**. For a vehicle turned by an angle $\theta$ (said "theta") about the vertical axis — a turn called **yaw** — the matrix is

$$
R_z(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}
$$

read "R sub z of theta": a rotation about the $z$ axis by $\theta$.

::: example A thrust vector never rotated out of the body frame
A vehicle of mass 2,200 kg commands 1,000 N of thrust along its own body x-axis (its nose), and it is yawed 30° from the inertial frame. Before the thrust can be combined with an inertial-frame state, it has to be rotated into the inertial frame:

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
# [0.3936 0.2273 0.    ]  [0.4545 0.     0.    ]
```

**Step 1, correct.** Rotating $(1000, 0, 0)$ by 30° gives $(1000\cos 30°,\ 1000\sin 30°,\ 0) = (866.0,\ 500.0,\ 0)$ N. Divide by 2,200 kg: $(0.3936,\ 0.2273,\ 0)$ m/s².

**Step 2, buggy.** No rotation: $(1000, 0, 0)/2200 = (0.4545,\ 0,\ 0)$ m/s².

**Step 3, compare sizes.** $\sqrt{0.3936^2 + 0.2273^2} = 0.4545$ m/s². Both vectors have exactly the same magnitude. A check that only asked "is the acceleration size reasonable?" finds nothing wrong with either.

**Step 4, compare directions.** The angle between them is exactly 30° — the yaw that was skipped, and nothing else, because the only difference between the two is that one was rotated and one was not.

**Step 5, what it costs.** The two accelerations differ by a vector of size $2 \times 0.4545 \times \sin 15° \approx 0.2353$ m/s². Held constant for 10 seconds, a position gap grows as $\tfrac{1}{2}\,\Delta a\, t^2 = \tfrac{1}{2} \times 0.2353 \times 10^2 \approx 11.8$ m. Small after ten seconds — and it only grows, as the square of time, for as long as nobody notices.

**Sanity check.** At $t = 20$ s the gap would be four times larger, about 47 m: doubling the time quadruples a gap that grows with $t^2$.
:::

::: note Why a rotation cannot change a vector's length
Take any vector $(x, y)$ in the plane and rotate it by $\theta$. The new vector is $(x\cos\theta - y\sin\theta,\ x\sin\theta + y\cos\theta)$. Square and add its parts:

$$
\begin{aligned}
&(x\cos\theta - y\sin\theta)^2 + (x\sin\theta + y\cos\theta)^2 \\
&= x^2(\cos^2\theta + \sin^2\theta) + y^2(\sin^2\theta + \cos^2\theta) + 2xy(-\cos\theta\sin\theta + \sin\theta\cos\theta) \\
&= x^2 + y^2
\end{aligned}
$$

because $\cos^2\theta + \sin^2\theta = 1$ and the cross terms cancel. The squared length is unchanged, so the length is unchanged. A rotation only turns a vector; it never stretches it. That is exactly why a frame error slips past any check that looks only at size.
:::

::: key
A units error changes a quantity's magnitude by a specific, clean conversion factor and can be caught by a magnitude sanity check. A frame error changes a quantity's direction, often leaving its magnitude untouched, and hides from exactly that kind of check — the two require different tests, and a suite that only checks magnitudes will silently miss every frame error it encounters.
:::

## The discipline that actually prevents both

Neither bug above came from a deep misunderstanding. One is a missing conversion and one is a missing rotation — the kind of slip anyone makes on a tired Friday afternoon. What catches them before they ship is not cleverness. It is making units and frames impossible to lose track of, and testing for exactly these two failures instead of trusting a result that merely looks plausible. In practice, three habits:

1. **Put the unit and frame in the name.** Write `thrust_N` rather than `thrust`, and `pos_eci_m` rather than `position` — where **[[ECI|eci]]** names the frame and `m` the unit. Then a mismatch is visible to a careful reader even before a test catches it.
2. **Check at every interface.** Confirm units and frames wherever code written by different people, or at different times, hands data across — exactly where both examples broke.
3. **Write a test aimed at each failure.** One test that fails if a unit conversion is dropped. A separate test that fails if a rotation is dropped or applied the wrong way round. Not one end-to-end test whose plausible-looking output is exactly what these bugs are good at producing.

::: warning "The number looks reasonable" is the failure mode, not the safeguard
Both examples in this lesson produced an output that, read alone, looked like an ordinary, believable value. That is not a coincidence — it is what makes units and frame errors the most common class of real error in this work rather than a rare, exotic one. A specific, targeted test for the conversion and the rotation catches what a plausibility check, by design, cannot.
:::

## Check yourself

::: check
Name three distinct time bases that can appear in GNC-adjacent data, and explain the concrete risk of combining two of them without an explicit conversion.
:::

::: answer
GPS time, UTC, and a mission-elapsed or spacecraft-clock time base are all legitimate ways timestamps appear in this kind of data. Combining two without converting produces a timing error equal to whatever offset exists between them — for GPS time and UTC, 18 seconds since the most recent leap second at the end of 2016. That is small enough to look like ordinary timing noise rather than an obvious mistake, yet large enough to ruin any analysis that depends on the true order or spacing of events.
:::

::: check
In the impulse example, explain why the navigation system's belief about its own velocity change ends up wrong by 1,332.3 m/s, and why that specific number is the size it is rather than some other error.
:::

::: answer
The reported value, 850,000, really means pound-force-seconds. So the true impulse is $850{,}000 \times 4.4482 \approx 3{,}780{,}988$ N·s, and the true velocity change is $3{,}780{,}988 / 2200 \approx 1{,}718.6$ m/s. Navigation uses the same number as if it were already newton-seconds and gets $850{,}000 / 2200 \approx 386.4$ m/s. The gap, $1{,}718.6 - 386.4 = 1{,}332.3$ m/s, is not random: it is the exact, computable result of applying the lbf-to-N factor to one calculation and not the other. Equivalently, the true value is about 4.45 times the believed one.
:::

::: check
Explain the key structural difference between a units error and a frame error, and why that difference matters for what kind of test catches each one.
:::

::: answer
A units error changes a quantity's magnitude by a clean conversion factor, usually leaving its direction (or its role in the calculation) alone. A frame error changes a quantity's direction and often leaves its magnitude completely unchanged, because a rotation never adds or removes length. So a test or sanity check that only compares magnitudes against a plausible range tends to catch the units error, whose size is now wrong, and miss the frame error entirely, whose size never changed. Each failure needs a test aimed at the specific thing it corrupts.
:::

::: check
In the frame-error example, the direction error between the correct and buggy acceleration vectors is exactly 30°. Explain why that number is exactly the vehicle's yaw angle and not some other value.
:::

::: answer
The buggy version uses the body-frame thrust vector completely unrotated. The correct version rotates the same vector by the vehicle's 30° yaw to express it in the inertial frame. Both start from the identical vector, and the only difference is that one was rotated and the other was not. So the angle between the results is exactly the rotation that was skipped — the yaw angle, 30°, with nothing else contributing.
:::

::: check
Explain why loading an entire multi-gigabyte telemetry file into memory before doing anything with it is often the wrong approach, and name one concrete alternative.
:::

::: answer
A long, high-rate log can reach tens of millions of samples across many channels, and most questions need only one channel or one time window. Loading everything first can run out of memory outright, or waste a lot of time reading data that is thrown away immediately. Concrete alternatives: read the file in chunks, or read only the columns or time range needed — directly, if the format (such as HDF5) supports reading a slice — instead of loading the whole file and filtering afterward.
:::

::: check
Describe one concrete discipline — a naming convention, a boundary check, or a specific test — that would have caught the units bug before it shipped, and one that would have caught the frame bug, and explain why each is aimed at the failure mode it catches.
:::

::: answer
For the units bug: name the interface value explicitly, such as `impulse_lbf_s` rather than a bare `impulse`, and add a boundary check or test asserting that it is converted to newton-seconds before any SI calculation uses it. That makes the missing conversion visible and testable instead of hidden. For the frame bug: a test that supplies a known nonzero yaw and asserts that the inertial-frame vector matches a hand-computed rotated value — not merely that its magnitude is reasonable. It fails immediately if the rotation is ever dropped, because it checks direction, the exact property a magnitude check cannot see.
:::

## Summary

| Concept | The risk | What catches it |
| --- | --- | --- |
| Telemetry format | Misreading byte offsets or columns against the wrong specification | Reading against the stated interface document, not assumption |
| Large files | Loading more data than needed, or than memory allows | Chunked, sliced, or format-native partial reads |
| Time base | Combining timestamps from different clocks without converting | Explicit conversion (for example, GPS time is 18 s ahead of UTC) before any differencing |
| Units | A value crossing an interface in the wrong unit, wrong by a clean factor | Explicit unit-labeled names and a magnitude-focused boundary test |
| Frames | A vector used in the wrong reference frame, direction wrong, magnitude often unchanged | A test that checks direction against a known rotation, not only magnitude |
| Impulse and $\Delta v$ | $\Delta v = J/m$; 1 lbf = 4.4482216153 N | Convert before dividing |
| Rotation | $R_z(\theta)$ turns a vector without changing its length | Check direction, not only size |

The next lesson turns from getting data right to the less glamorous, far more common daily work of catching a mistake before it ships: continuous integration, regression suites, build breakages, and reproducing someone else's result.

::: context telemetry-word Measuring from far away
**Telemetry** is built from two Greek pieces: *tele*, "far" (as in telephone and television), and *metron*, "measure". It means measurements taken on a vehicle and sent back to people who are far away. A rocket's telemetry stream might carry thousands of channels at once — tank pressures, engine temperatures, gyro rates, computer health — all packed into a radio signal and unpacked on the ground according to the interface control document.
:::

::: context icd The rulebook between two teams
An **interface control document** is the written agreement between the team that sends data and the team that reads it. For a telemetry packet it might say: bytes 12 and 13 hold chamber pressure as a whole number from 0 to 65,535; multiply by 0.1 to get kilopascals. Without that page, the bytes are meaningless.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="20" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="30" y="40">10</text>
    <rect x="50" y="20" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="70" y="40">11</text>
    <rect x="90" y="20" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="110" y="40">12</text>
    <rect x="130" y="20" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="150" y="40">13</text>
    <rect x="170" y="20" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="190" y="40">14</text>
    <text x="110" y="14">byte offset</text>
  </g>
  <line x1="130" y1="50" x2="130" y2="74" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="92">stored whole number × scale factor 0.1</text>
    <text x="20" y="110">= chamber pressure in kilopascals</text>
  </g>
</svg>
```

Get the offset wrong by one byte and you read a completely different quantity; get the scale factor wrong and every value is off by the same factor.
:::

::: context hdf5 A file you can read one drawer at a time
**HDF5** stands for Hierarchical Data Format, version 5. "Hierarchical" means it is organized like folders inside folders. A single file can hold many named datasets — one per channel, say — and a Python library such as `h5py` can pull out just rows 1,000,000 to 1,010,000 of one channel without touching the rest. Think of a filing cabinet where you open one drawer instead of tipping the whole cabinet onto the floor. Another common choice for table-shaped data is **Parquet**, which stores each column separately for the same reason.
:::

::: context data-volume How fast the samples pile up
Multiply channels by sample rate by seconds. Forty channels at 200 Hz for one hour:

$$
40 \times 200 \times 3600 = 28{,}800{,}000 \text{ samples}
$$

Fifty channels at 500 Hz for an hour is 90 million. Stored as 8-byte numbers, that second log is $90{,}000{,}000 \times 8 = 720{,}000{,}000$ bytes — about 0.72 gigabytes, before timestamps, before text formatting (which is several times bigger), and before a second test on the same day.
:::

::: context leap-seconds How the GPS–UTC gap grew
GPS time was set equal to UTC in January 1980. Every leap second since then has widened the gap by exactly one second. There have been 18.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="170" x2="40" y2="36" stroke="#6c7a93" stroke-width="1"/>
  <path d="M40.0,170 H51.2 V163 H58.8 V156 H66.2 V149 H81.2 V142 H100.0 V135 H115.0 V128 H122.5 V121 H133.8 V114 H141.2 V107 H148.8 V100 H160.0 V93 H171.2 V86 H182.5 V79 H235.0 V72 H257.5 V65 H283.8 V58 H306.2 V51 H317.5 V44 H340.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44">
    <text x="40" y="186" text-anchor="middle">1980</text>
    <text x="115" y="186" text-anchor="middle">1990</text>
    <text x="190" y="186" text-anchor="middle">2000</text>
    <text x="265" y="186" text-anchor="middle">2010</text>
    <text x="340" y="186" text-anchor="middle">2020</text>
    <text x="34" y="174" text-anchor="end">0</text>
    <text x="34" y="111" text-anchor="end">9</text>
    <text x="34" y="48" text-anchor="end">18</text>
    <text x="120" y="40" fill="#b4232c">GPS − UTC, seconds</text>
  </g>
</svg>
```

Notice the long flat stretch from 1999 to 2006: the Earth's spin happened not to need a correction for seven years. In 2022 the world's timekeepers voted to stop adding leap seconds by 2035, so the gap may one day freeze for good.
:::

::: context gps-time A clock that never jumps
Each GPS satellite carries atomic clocks, and your phone works out its position from tiny differences in when signals left each satellite. A clock that suddenly jumped by a second would break that arithmetic, so GPS time simply counts steadily and never inserts leap seconds. The GPS signal itself broadcasts the current GPS–UTC offset, so receivers can convert — but only if the software actually does.
:::

::: context pound-force Where the pound-force comes from
One **pound-force** is the weight of a one-pound mass under standard gravity. A pound of mass is exactly 0.45359237 kg, and standard gravity is exactly 9.80665 m/s², so

$$
1\ \text{lbf} = 0.45359237 \times 9.80665 = 4.4482216152605\ \text{N}
$$

exactly, by definition. Much US rocket-engine history is written in it: thrust in pounds, impulse in pound-seconds. That is why the conversion still turns up at interfaces today.
:::

::: context mars-climate-orbiter The Mars Climate Orbiter
NASA's **Mars Climate Orbiter** launched in December 1998 and was lost in September 1999 as it arrived at Mars. The investigation board found that ground software reported small thruster-firing effects in pound-force-seconds, while the navigation team's software expected newton-seconds. Each small error was off by a factor of about 4.45, and they added up over the months of cruise. The spacecraft reached Mars on a path far lower than planned and did not survive. The board also stressed that the process — reviews and checks at the interface — should have caught it. That is this lesson's point: the fix is discipline at interfaces, not a smarter engineer.
:::

::: context eci Earth-centered inertial
**ECI** stands for Earth-Centered Inertial. Its origin is the center of the Earth, and its axes point toward fixed directions in space, so the Earth spins *inside* it. It is the natural frame for writing down an orbit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="150" x2="200" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="206,150 196,145 196,155" fill="#1f2a44"/>
  <text x="212" y="154" font-size="12" fill="#1f2a44">inertial x</text>
  <line x1="60" y1="150" x2="173.1" y2="84.7" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="178.3,81.7 166.9,82.6 171.9,91.3" fill="#1d6fd1"/>
  <text x="182" y="80" font-size="12" fill="#1d6fd1">body x (nose)</text>
  <path d="M100,150 A40,40 0 0,0 94.6,130" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="106" y="138" font-size="12" fill="#b4232c">30° yaw</text>
  <text x="60" y="30" font-size="12" fill="#1f2a44">same thrust, two frames: the arrow is the same</text>
  <text x="60" y="46" font-size="12" fill="#1f2a44">length; only the frame it is written in differs</text>
</svg>
```

The picture is the lesson's example: the nose points 30° away from inertial x, so "1,000 N along body x" is not "1,000 N along inertial x". A name like `pos_eci_m` says the frame and the unit (meters) at a glance.
:::
