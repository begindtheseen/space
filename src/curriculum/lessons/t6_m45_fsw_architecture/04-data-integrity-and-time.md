---
id: l04-data-integrity-and-time
title: Data integrity and time management
minutes: 20
covers:
  - "Data integrity: CRCs, checksums, sequence counts and staleness checks on every input"
  - Time management, epochs, leap seconds and monotonic vs wall-clock time
---

A packet that parses cleanly against its dictionary — the right length, the right field layout, the right APID — has cleared exactly one hurdle. It can still be corrupted in a way that happens to leave the structure intact, missing entirely with nothing to say so, or perfectly correct but describing a moment that has already passed. This lesson is about the checks that catch each of those, and about the one resource all of them quietly depend on and that turns out to have its own sharp edges: the clock the checks measure age against.

Every device manager and every command handler in this module's architecture is supposed to run these checks before anything above it ever sees the value — this is where "typed, validated" from lesson 1's layering discussion actually gets built, one check at a time.

## Corruption: CRCs versus checksums

The simplest integrity check is an additive checksum: sum the bytes, keep the sum modulo some fixed value, and compare it against a copy of the sum sent with the data. It is cheap and it catches many single-value errors, but it has a specific, exploitable blind spot: it only depends on the *multiset* of byte values, not their *order* or *position*. Two bytes that swap places, or one byte that increases while another decreases by the same amount, leave the sum completely unchanged.

A cyclic redundancy check (CRC) is built differently: it treats the message as a polynomial over a finite field and computes the remainder after dividing by a fixed generator polynomial, a computation in which every bit's *position* affects the result, not only its value. That is what makes it sensitive to exactly the class of error a checksum misses.

::: example A byte swap that an additive checksum cannot see
```python
import zlib

def additive_checksum(data: bytes) -> int:
    return sum(data) % 256

packet = bytes([0x10, 0x27, 0x03, 0x00, 0x9A, 0x02])
swapped = bytearray(packet)
swapped[0], swapped[4] = swapped[4], swapped[0]
swapped = bytes(swapped)

print(f"original:  checksum={additive_checksum(packet)}  CRC-32={zlib.crc32(packet):#010x}")
print(f"swapped:   checksum={additive_checksum(swapped)}  CRC-32={zlib.crc32(swapped):#010x}")
# original:  checksum=214  CRC-32=0xb6e0fc7e
# swapped:   checksum=214  CRC-32=0xc8a7bb01
```
The two packets carry the same six byte values in a different order — exactly what a wire fault such as a buffer alignment error or a bit-serial framing slip can produce — and the checksum cannot distinguish them at all; the CRC changes completely. This is why CRCs, not additive checksums, guard telemetry and command payloads in practice, even though a checksum is cheaper to compute.
:::

## Sequence counts: catching what never arrived

A CRC tells you whether the packet in hand is intact. It says nothing about a packet that never arrived at all — corruption so total the receiver never sees anything to check. That is what the sequence count from lesson 3's primary header is for: a monotonically increasing count per APID lets a receiver notice a gap even when the missing packet left no other trace.

::: example Detecting a gap with modular arithmetic on the sequence count
```python
def check_sequence(expected_next, seq_count, modulus=0x4000):
    return (seq_count - expected_next) % modulus   # 0 = in order; N>0 = N packets missed

expected = 100
for received in [100, 101, 102, 105, 106]:
    gap = check_sequence(expected, received)
    print(f"expected {expected}, received {received}: "
          f"{'in order' if gap == 0 else f'GAP of {gap} missed packet(s)'}")
    expected = received + 1
# expected 100, received 100: in order
# expected 101, received 101: in order
# expected 102, received 102: in order
# expected 103, received 105: GAP of 2 missed packet(s)
# expected 106, received 106: in order
```
The gap of two is detected exactly where packets 103 and 104 went missing, with nothing about them ever having arrived. The modulus matters as much as the subtraction: the field this lesson is built on is 14 bits wide and wraps at 16384, so `check_sequence(16383, 2)` must — and does — report a gap of 3, correctly counting through the wraparound from 16383 back to 0, rather than reporting a nonsensical large negative gap from a raw, unwrapped subtraction.
:::

## Staleness: correct, but no longer true

A value can pass its CRC and arrive with the expected sequence count and still be unusable, because time has moved on since it was sampled. A staleness check compares a sample's timestamp against the current time and rejects it if the age exceeds a bound chosen for that specific quantity — a bound that has to reflect how fast the underlying physical quantity can actually change, not one constant reused everywhere. A guidance loop closing at 2 km/s cannot tolerate the same staleness in a position fix that a battery-voltage display can tolerate in a temperature reading.

::: example A staleness check, and the bug in checking only one side of it
```python
def is_stale(sample_time_s, now_s, max_age_s):
    return (now_s - sample_time_s) > max_age_s

now = 1000.000
for sample_t in [999.950, 999.910, 999.899, 1000.050]:
    age = now - sample_t
    verdict = "STALE, reject" if is_stale(sample_t, now, 0.100) else "fresh, accept"
    print(f"sample timestamped {sample_t:.3f}s: age={age:.3f}s -> {verdict}")
# sample timestamped 999.950s: age=0.050s -> fresh, accept
# sample timestamped 999.910s: age=0.090s -> fresh, accept
# sample timestamped 999.899s: age=0.101s -> STALE, reject
# sample timestamped 1000.050s: age=-0.050s -> fresh, accept
```
The first three checkpoints behave exactly as intended. The fourth exposes a real bug in `is_stale` as written: a timestamp claiming to be fifty milliseconds in the *future* produces a negative age, which is not greater than `max_age_s` and so is waved through as "fresh." A sample cannot honestly be from the future — a timestamp like that means a clock fault, a corrupted field, or a spoofed packet, not a value worth trusting more than an old one. A staleness check that only bounds the old side of the interval is half a check; the complete version rejects an age outside `[-skew_tolerance, max_age_s]`, where `skew_tolerance` allows only the small, explainable clock disagreement two honest systems might have, not an arbitrary claim from the future.
:::

::: warning
A staleness bound copied from a different signal "because it was already there in the code" is a silent hazard: too loose for a fast-changing quantity, it lets old data steer a control loop; too tight for a slow one, it manufactures nuisance rejections of perfectly good data. Set it from the physics of the specific quantity being checked.
:::

## Time management: which clock, and can it move backward

Every check in this lesson needs a "now," and which clock supplies it matters as much as the checks themselves.

Flight systems work with several time scales that agree on the length of a second but disagree, by design, on when to insert a correction for Earth's slightly irregular rotation. **UTC** inserts an occasional leap second to stay aligned with solar time; the most recent one landed at the end of 2016, bringing the offset between International Atomic Time (TAI) and UTC to 37 seconds, unchanged since. **GPS time** never leaps: it was set equal to UTC at the GPS epoch (1980-01-06) and has run, by definition, a fixed 19 seconds behind TAI ever since — a constant that cannot change, because both are continuous, non-leaping atomic time scales. Combine the two fixed relationships and GPS time currently reads 18 seconds ahead of UTC.

::: example GPS time, TAI, and UTC arithmetic
```python
tai_minus_utc_s = 37   # current, since the 2016 leap second
gps_minus_tai_s = -19  # fixed by definition, since the GPS epoch
gps_minus_utc_s = gps_minus_tai_s + tai_minus_utc_s
print(f"GPS - UTC = {gps_minus_utc_s} s")
# GPS - UTC = 18 s

gps_week, gps_sow = 2308, 400000.0
utc_seconds_of_week = gps_sow - gps_minus_utc_s
print(f"GPS week {gps_week}, {gps_sow:.1f} s of week -> UTC seconds of week = {utc_seconds_of_week:.1f}")
# GPS week 2308, 400000.0 s of week -> UTC seconds of week = 399982.0
```
A GNSS receiver reports time on the GPS scale; a piece of ground software logging events on the UTC scale that forgets this fixed 18-second offset will misalign every GNSS-tagged event against every other timestamp in its log by that much — enough, on its own, to make a staleness check pass or fail incorrectly if the two scales are silently mixed.
:::

The distinction between a **monotonic** clock and a **wall clock** matters at least as much as which epoch is in use. A wall clock reports the current calendar time and can be stepped — corrected backward or forward — by a ground time update, an NTP-style synchronization, or a leap second itself. A monotonic clock reports elapsed time since some arbitrary reference and, by contract, never runs backward, never jumps, and is unaffected by anything that adjusts the wall clock alongside it.

::: example A wall-clock step corrupts an age calculation; a monotonic clock cannot
```python
def age(sample_s, now_s):
    return now_s - sample_s

sample_wall = 1000.00
print(f"age, no step: {age(sample_wall, 1000.05):.3f} s")
# age, no step: 0.050 s
print(f"age, after a -0.30 s wall-clock step between sample and check: {age(sample_wall, 999.80):.3f} s")
# age, after a -0.30 s wall-clock step between sample and check: -0.200 s
```
A wall-clock correction applied between when a value was sampled and when its age is checked produces a negative age — the earlier staleness example's "impossible future timestamp" bug, except now self-inflicted by the clock rather than by a corrupted field. A monotonic clock, used for every interval measurement in flight software — staleness ages, watchdog timeouts, persistence counters, control-loop timing — cannot be stepped by anything, so this failure mode cannot occur from timing logic alone. The wall clock (and a GPS- or UTC-tagged epoch) is still needed for *when in history* an event happened, for the ground and for time-tagged logs; it is simply the wrong tool for measuring *how long*.
:::

::: key
Use a monotonic clock for every duration, timeout, and staleness age; it never steps backward and is immune to time corrections. Use an epoch-based wall clock (GPS, UTC, or TAI) only to say when an event happened in history, and keep the fixed 18-second GPS-minus-UTC offset in mind whenever timestamps from both scales appear in the same log.
:::

## Check yourself

::: check
Two telemetry packets carry the same six byte values but in a different order, one of them corrupted in transit. An engineer proposes protecting the packet with an additive checksum because "it's cheaper than a CRC and we're bandwidth-limited." What specific class of error will this choice miss?
:::

::: answer
An additive checksum depends only on the multiset of byte values present, not their order or position, so any corruption that reorders bytes — or that increases one byte while decreasing another by the same amount — leaves the checksum unchanged while the CRC of the same two byte sequences differs. The worked example in this lesson shows exactly this: identical checksums, different CRCs, for a packet and its byte-swapped corruption.
:::

::: check
A receiver expects sequence count 16383 next and instead receives sequence count 1. Using the modular gap formula from this lesson with a 14-bit field, how many packets were missed, and why would a naive non-modular subtraction get this wrong?
:::

::: answer
`(1 - 16383) % 16384 = 2`, so two packets were missed: the counter wrapped from 16383 through 0 to 1. A non-modular subtraction would compute `1 - 16383 = -16382`, a large negative number that looks like a serious fault rather than the two-packet gap it actually is — exactly the kind of false alarm a receiver that forgets the field wraps would raise on every ordinary rollover, whether or not anything was actually lost.
:::

::: check
Why must a staleness bound be chosen per-signal rather than as one constant applied to every telemetry point in the system?
:::

::: answer
Staleness measures whether a value is still representative of the present physical state, and how fast that state can change is different for every signal — a position fix on a vehicle moving at kilometers per second can become materially wrong within milliseconds, while a slowly-varying temperature is still representative seconds later. One constant is either too loose for the fast-changing signals, letting stale data steer a control loop, or too tight for the slow ones, rejecting good data as a matter of routine; the bound has to come from the physics of the specific quantity being checked, as this lesson's warning states.
:::

::: check
A staleness check is implemented as `(now - sample_time) > max_age`, with no other condition. Under what circumstance does this check silently accept data it should reject, and what does the fix require?
:::

::: answer
It silently accepts a sample whose timestamp claims to be in the future relative to "now," because that produces a negative age, which is never greater than a positive `max_age`. Such a timestamp cannot be honestly current — it indicates a clock fault, a corrupted timestamp field, or a spoofed packet — so the fix is to bound the age on both sides: reject anything older than `max_age` and anything more than a small, explicitly allowed clock-skew tolerance in the future.
:::

::: check
A software engineer times a control loop's iteration period using `time.time()` (a wall clock) rather than a monotonic clock, and the vehicle's loop timing statistics occasionally show a negative iteration period. What is the most likely cause, and what should the engineer use instead?
:::

::: answer
The most likely cause is a wall-clock correction — an NTP-style synchronization, a ground time update, or a leap second — landing between the two `time.time()` calls used to measure the interval, stepping the clock backward by more than the loop's own period and producing a negative elapsed time that is physically meaningless. The fix is to measure every duration, including loop timing, with a monotonic clock, which is guaranteed never to step backward regardless of what happens to the system's notion of wall-clock time.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Checksum | Sum of bytes; blind to reordering or compensating changes |
| CRC | Polynomial remainder; sensitive to bit position, catches what a checksum misses |
| Sequence count | Per-APID counter; a gap reveals a packet that never arrived, with modular arithmetic across the wrap |
| Staleness | `age = now - sample_time`; reject both too old and (if present) impossibly in the future |
| TAI, UTC, GPS time | Agree on the second's length; UTC leaps (37 s behind TAI since 2016), GPS never leaps (fixed 19 s behind TAI, so 18 s ahead of UTC) |
| Monotonic clock | Never steps backward; the only correct source for a duration, timeout, or age |
| Wall clock | Can be stepped; correct only for saying when an event happened in history |

Every check in this lesson runs on a single input, once. The next lesson turns to what happens once a vehicle carries more than one redundant source for the same quantity — the architectures used to combine or choose between them — before lessons 6 and 7 show exactly what a voter built on top of those architectures can, and cannot, be trusted to catch.
