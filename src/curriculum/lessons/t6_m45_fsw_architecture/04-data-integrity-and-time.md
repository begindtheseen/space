---
id: l04-data-integrity-and-time
title: Data integrity and time management
minutes: 26
covers:
  - "Data integrity: CRCs, checksums, sequence counts and staleness checks on every input"
  - Time management, epochs, leap seconds and monotonic vs wall-clock time
---

Think about a letter sent through the mail. Three different things can go wrong with it. The envelope can arrive sealed and neat, but the ink inside got wet and a few words changed. The letter can get lost, and nothing ever tells you it was sent. Or it can arrive perfectly readable but three weeks late, saying "meet me tomorrow at noon" about a day that is already over.

Flight software has the same three problems with every piece of data it receives. A packet from a sensor can pass every format check — right length, right layout, right **[[APID|apid]]** (the number that says which source sent it) — and still be corrupted inside, missing entirely, or correct but describing a moment that has already passed. This lesson builds the check that catches each of the three. Then it looks at the one thing all of them quietly depend on: the clock you measure "how old" against. That clock has sharp edges of its own.

These checks live low in the software stack. In lesson 1's layering, each **[[device manager|device-manager]]** — the layer that talks to one piece of hardware — runs them before anything above it sees the value. That is where the words "typed and validated" actually get built, one check at a time.

## Four things every input carries

Before the details, here is the rule the whole lesson supports. Every value that enters flight software should travel with four companions:

- a **timestamp** — when the value was measured;
- a **validity flag** — the source's own claim that the value is good;
- a **sequence count** — a number that goes up by one with every packet, so a missing one shows up as a gap;
- a **checksum** (or better, a CRC) — a short code computed from the data, so a change to the data shows up as a mismatch.

The sender attaches them. The receiver — the consumer — has to check all four, every time it uses the value. The validity flag alone is not enough. A unit that has frozen can keep sending "valid" forever.

::: key
Every input to flight software must carry a timestamp, a validity flag, a sequence count and a checksum — and the consumer must check all four. Stale-but-valid data is one of the most common real integration failures, and it is invisible unless the age is checked on every use.
:::

## Corruption: checksums versus CRCs

Picture a grocery receipt. You could check it by adding up all the prices and comparing with the total at the bottom. That catches a lot: if one price got smudged from \$3 to \$8, the sum is off by \$5. But if two items swapped places on the list, the sum is exactly the same. And if one price went up by \$2 while another went down by \$2, the sum is the same again.

That is an **additive checksum**: add up the bytes of a message, keep the sum **[[modulo|modulo]]** some fixed number (keep only the remainder after dividing, the way a clock keeps only the hour), and send that sum along with the data. The receiver adds up what arrived and compares. It is cheap and it catches many single-byte errors. But it only cares *which* byte values are present, not *where* they are. Swapped bytes, or two changes that cancel, slip straight through.

::: note Why it has to be true
Addition does not care about order: $a + b = b + a$. So for bytes $d_1, d_2, \ldots, d_n$, the checksum $\left(d_1 + d_2 + \cdots + d_n\right) \bmod 256$ gives the same answer for every rearrangement of them. Likewise, if $d_1$ grows by $k$ and $d_2$ shrinks by $k$, the total changes by $k - k = 0$. No rule built only from a sum can tell those messages apart.
:::

A **cyclic redundancy check (CRC)** is built differently. Here is a version with ordinary numbers. Take the message $1234$ and divide it by a fixed number, say $97$. The remainder is $70$. Send "$1234$, remainder $70$". Now suppose the digits arrive swapped as $4231$. The digits still add to $10$, but $4231$ divided by $97$ leaves a remainder of $60$, not $70$. Caught. Division cares about where each digit sits, because a digit's position sets how much it is worth.

A real CRC does the same thing with bits. It treats the message as one long binary number, divides it by a fixed **[[generator polynomial|crc-division]]** using a special kind of division with no carries, and sends the remainder. Every bit's *position* changes the result, not only its value. That is exactly the kind of error a checksum misses.

::: example A byte swap that an additive checksum cannot see
The same six byte values, in two orders. Python's `zlib.crc32` computes a standard 32-bit CRC.

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

Step by step: the code swaps byte 0 ($\mathrm{0x10}$) with byte 4 ($\mathrm{0x9A}$). The byte values are unchanged, so their sum is unchanged: $214$ both times. The CRC changes completely. A swap like this is what real wire faults produce — a buffer written at the wrong offset, or a framing slip on a serial line.

Sanity check: the checksum was *supposed* to be blind here, by the note above, and it is. This is why CRCs, not additive checksums, guard telemetry and command packets, even though a checksum is cheaper to compute.
:::

## Sequence counts: catching what never arrived

A CRC tells you whether the packet in your hand is intact. It says nothing about a packet that never arrived. There is nothing in your hand to check.

Think of numbered tickets at a deli counter. If you hear "41… 42… 45", you know two tickets were skipped, even though you never saw them. That is the **sequence count** from lesson 3's packet header. Each source (each APID) numbers its packets $0, 1, 2, \ldots$ in order. If the receiver expected $103$ and got $105$, two packets are missing.

The count has a fixed size. In the CCSDS header from lesson 3 it is a 14-bit field, so it can hold $2^{14} = 16384$ values, $0$ to $16383$. After $16383$ it **wraps** back to $0$, like a car's **[[odometer rolling over|odometer]]**. So the gap must be computed modulo $16384$:

$$
\text{gap} = (\text{received} - \text{expected}) \bmod 16384 .
$$

Read "mod" as "keep the remainder after dividing by". A gap of $0$ means in order. A gap of $N$ means $N$ packets were missed.

::: example Detecting a gap with modular arithmetic
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

($\mathrm{0x4000}$ is $16384$ written in hexadecimal.) The gap of two shows up exactly where packets $103$ and $104$ went missing, even though nothing about them ever arrived.

Now the wrap. Say the receiver expects $16383$ and gets $2$. The packets $16383$, $0$ and $1$ are missing: three of them. The formula gives $(2 - 16383) \bmod 16384 = -16381 \bmod 16384 = 3$. Correct.
:::

::: warning Forgetting the wrap
Plain subtraction gives $2 - 16383 = -16381$, a huge negative gap that looks like a disaster. A receiver that forgets the field wraps raises a false alarm on every ordinary rollover — about once every $16384$ packets, forever. Always subtract modulo the field size.
:::

## Staleness: correct, but no longer true

A value can pass its CRC, arrive with the expected sequence count, and still be useless, because time has moved on since it was measured. Last week's weather forecast is a perfectly good forecast. It is just about the wrong day.

A **staleness check** compares a sample's timestamp with the current time. The difference is the sample's **age**:

$$
\text{age} = t_{\text{now}} - t_{\text{sample}} .
$$

If the age is more than a limit, the value is **stale** and rejected. That limit must come from how fast the real quantity can change. A vehicle moving at $2\,\mathrm{km/s}$ travels $2000 \times 0.1 = 200\,\mathrm{m}$ in a tenth of a second. So a position fix $0.1\,\mathrm{s}$ old is already $200\,\mathrm{m}$ out of date. A tank temperature that drifts a degree a minute is still fine a second later.

::: example A staleness check, and the bug in checking only one side
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

The first three lines behave as intended: $0.050$ and $0.090\,\mathrm{s}$ are under the $0.100\,\mathrm{s}$ limit, and $0.101\,\mathrm{s}$ is over it.

The fourth line is a real bug. That timestamp claims to be $50\,\mathrm{ms}$ in the *future*. Its age is negative, a negative number is never greater than $0.100$, so it is waved through as "fresh". But a sample cannot honestly come from the future. A timestamp like that means a clock fault, a corrupted field, or a spoofed packet. It deserves *less* trust, not more.

The fix bounds the age on both sides. It allows a small **[[clock skew|clock-skew]]** — the honest disagreement between two clocks — and nothing more:

```python
def age_ok(sample_time_s, now_s, max_age_s, skew_s):
    age = now_s - sample_time_s
    return -skew_s <= age <= max_age_s

now = 1000.000
for sample_t in [999.950, 999.899, 1000.001, 1000.050]:
    verdict = "accept" if age_ok(sample_t, now, 0.100, 0.002) else "REJECT"
    print(f"sample at {sample_t:.3f} s: age={now - sample_t:+.3f} s -> {verdict}")
# sample at 999.950 s: age=+0.050 s -> accept
# sample at 999.899 s: age=+0.101 s -> REJECT
# sample at 1000.001 s: age=-0.001 s -> accept
# sample at 1000.050 s: age=-0.050 s -> REJECT
```

A millisecond "in the future" is inside the $2\,\mathrm{ms}$ skew allowance, so it passes. Fifty milliseconds is not, so it is rejected.
:::

::: warning Copying a staleness limit
A limit copied from a different signal "because it was already in the code" is a silent hazard. Too loose for a fast-changing quantity, it lets old data steer a control loop. Too tight for a slow one, it throws away good data all day long. Set each limit from the physics of the quantity it guards.
:::

## Which time scale: TAI, UTC and GPS

Every check above needs a "now". Which clock supplies it matters as much as the checks.

Picture three friends whose watches all tick at exactly the same rate. They still might not show the same time, because each one set their watch differently. Flight systems live with three such watches, called **time scales**. All three agree on how long a second is. They disagree on the number shown.

- **TAI** (International Atomic Time) is the steady count from atomic clocks. It never jumps.
- **UTC** (Coordinated Universal Time) is the clock on your phone. Earth's spin is slightly irregular, so UTC now and then adds a **[[leap second|leap-second]]** to stay in step with the Sun. The most recent was at the end of 2016. Since then $\text{TAI} - \text{UTC} = 37\,\mathrm{s}$.
- **GPS time** never leaps. It was set equal to UTC at the **GPS epoch**, 6 January 1980, when UTC was already $19\,\mathrm{s}$ behind TAI. GPS has run exactly $19\,\mathrm{s}$ behind TAI ever since, and that can never change, because neither of them leaps.

An **epoch** is the starting moment a clock counts from, like "year zero" for that clock. Put the two fixed facts together:

$$
\text{GPS} - \text{UTC} = (\text{GPS} - \text{TAI}) + (\text{TAI} - \text{UTC}) = -19 + 37 = 18\,\mathrm{s}.
$$

GPS time currently reads $18\,\mathrm{s}$ ahead of UTC.

::: example Converting a GPS timestamp to UTC
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

A GPS receiver reports time as a **[[week number and seconds into that week|gps-week]]**. To get UTC, subtract $18\,\mathrm{s}$: $400000 - 18 = 399982\,\mathrm{s}$.

Sanity check: GPS is ahead, so the UTC reading must be smaller. It is. Software that logs events in UTC but forgets this offset puts every GPS-tagged event $18\,\mathrm{s}$ out of line with everything else in the log. That alone is enough to make a staleness check pass or fail wrongly when the two scales get mixed.
:::

## Monotonic clocks and wall clocks

Picture a kitchen wall clock and a stopwatch. Twice a year someone changes the wall clock for daylight saving time — an hour forward, or an hour back. If you timed your pasta by the wall clock on that night, you might "cook" it for minus fifty minutes. A stopwatch never gets reset in the middle. It only counts up.

A **wall clock** reports calendar time and can be **stepped** — moved forward or backward — by a time update from the ground, by a network time service like **[[NTP|ntp]]**, or by a leap second. A **monotonic clock** reports time elapsed since some arbitrary starting point. By contract it never runs backward and never jumps, and nothing that adjusts the wall clock touches it. ("Monotonic" means "only goes one way".)

::: example A wall-clock step breaks an age calculation
```python
def age(sample_s, now_s):
    return now_s - sample_s

sample_wall = 1000.00
print(f"age, no step: {age(sample_wall, 1000.05):.3f} s")
# age, no step: 0.050 s
print(f"age, after a -0.30 s wall-clock step between sample and check: {age(sample_wall, 999.80):.3f} s")
# age, after a -0.30 s wall-clock step between sample and check: -0.200 s
```

Walk through it. The sample is stamped at $1000.00\,\mathrm{s}$. With no step, a check fifty milliseconds later reads $1000.05$, and the age is $0.05\,\mathrm{s}$. Now suppose a tenth of a second really passes, but in between a correction steps the clock back by $0.30\,\mathrm{s}$. The clock at the check reads $1000.00 + 0.10 - 0.30 = 999.80$. The age comes out as $999.80 - 1000.00 = -0.20\,\mathrm{s}$.

That is the "impossible future timestamp" from the staleness example, except now the clock caused it, not a bad packet. On a monotonic clock this cannot happen.
:::

So flight software uses the monotonic clock for every *interval*: staleness ages, watchdog timeouts, persistence counters, control-loop timing. In Python that is `time.monotonic()`; in C on Linux it is `clock_gettime(CLOCK_MONOTONIC, ...)`. The wall clock, tied to an epoch (GPS, UTC or TAI), is still needed for a different job: saying *when in history* something happened, for the ground and for time-tagged logs. It is the wrong tool for measuring *how long*.

::: key
Use a monotonic clock for every duration, timeout and staleness age: it never steps backward and is immune to time corrections. Use an epoch-based wall clock (GPS, UTC or TAI) only to say when an event happened, and keep the fixed 18-second GPS-minus-UTC offset in mind whenever timestamps from both scales appear in the same log.
:::

## Check yourself

::: check
An engineer wants to protect telemetry packets with an additive checksum because "it's cheaper than a CRC and we're bandwidth-limited." What specific kind of error will this choice miss?
:::

::: answer
An additive checksum depends only on which byte values are present, not on their order or position. So any corruption that reorders bytes — or raises one byte while lowering another by the same amount — leaves the checksum unchanged. The worked example shows it: a packet and its byte-swapped copy have the same checksum ($214$) but different CRCs. A CRC depends on each bit's position, so it catches these.
:::

::: check
A receiver expects sequence count $16383$ next and instead receives $1$. Using the modular gap formula with a 14-bit field, how many packets were missed? Why would plain subtraction get this wrong?
:::

::: answer
$(1 - 16383) \bmod 16384 = -16382 \bmod 16384 = 2$. Two packets were missed: $16383$ and $0$ (the counter wrapped from $16383$ through $0$ to $1$).

Plain subtraction gives $1 - 16383 = -16382$, a huge negative number that looks like a serious fault instead of a two-packet gap. A receiver that forgets the wrap would raise that false alarm on every ordinary rollover, whether or not anything was lost.
:::

::: check
Why must a staleness limit be chosen for each signal, instead of one constant for every telemetry point in the system?
:::

::: answer
Staleness asks whether a value still describes the present, and how fast "the present" changes is different for every signal. A position fix on a vehicle moving at kilometers per second is hundreds of meters out of date after a tenth of a second. A slowly changing temperature is still good seconds later. One constant is either too loose for the fast signals — letting stale data steer a control loop — or too tight for the slow ones — rejecting good data routinely. Each limit has to come from the physics of that quantity.
:::

::: check
A staleness check is written as `(now - sample_time) > max_age`, with nothing else. When does it silently accept data it should reject, and what does the fix need?
:::

::: answer
It accepts any sample whose timestamp claims to be in the future. The age is then negative, and a negative number is never greater than a positive `max_age`. Such a timestamp cannot be honest — it points to a clock fault, a corrupted field or a spoofed packet. The fix bounds the age on both sides: reject anything older than `max_age`, and anything more than a small, stated clock-skew allowance in the future.
:::

::: check
An engineer times a control loop's period with `time.time()` (a wall clock) instead of a monotonic clock. The loop timing statistics now and then show a negative period. What is the most likely cause, and what should be used instead?
:::

::: answer
A wall-clock correction — a network time sync, a ground time update or a leap second — landed between the two `time.time()` calls and stepped the clock backward by more than one loop period. The measured interval came out negative, which is physically meaningless. Every duration, including loop timing, should be measured with a monotonic clock (`time.monotonic()`), which never steps backward whatever happens to the wall clock.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Four companions | Timestamp, validity flag, sequence count, checksum — the consumer checks all four |
| Additive checksum | Sum of bytes mod a number; blind to reordering and to changes that cancel |
| CRC | Remainder after dividing the message by a fixed generator; depends on bit position |
| Sequence count | Per-APID counter; gap $= (\text{received} - \text{expected}) \bmod 16384$ for a 14-bit field |
| Staleness | $\text{age} = t_{\text{now}} - t_{\text{sample}}$; reject if too old or impossibly in the future |
| TAI, UTC, GPS | Same second length; UTC leaps ($37\,\mathrm{s}$ behind TAI since 2016); GPS never leaps ($19\,\mathrm{s}$ behind TAI, so $18\,\mathrm{s}$ ahead of UTC) |
| Monotonic clock | Never steps backward; the only right source for a duration, timeout or age |
| Wall clock | Can be stepped; right only for saying when an event happened |

Every check in this lesson looks at one input, once. The next lesson turns to vehicles that carry more than one source for the same quantity, and the ways of wiring and running those spares — before lessons 6 and 7 show exactly what a voter built on top of them can, and cannot, catch.

::: context apid The return address on a packet
APID stands for **Application Process Identifier**. It is an 11-bit number in every CCSDS packet header (lesson 3), so it can take $2^{11} = 2048$ values. Each source of packets on the vehicle — the star tracker's driver, the power app, the GNC app — gets its own APID. Ground software uses it to decide which dictionary entry decodes the rest of the packet. It is also why sequence counts are kept *per APID*: each source numbers its own packets.
:::

::: context device-manager Where the checks physically live
In the layering from lesson 1, the hardware abstraction layer moves raw bytes, and the device manager above it turns those bytes into a meaningful, checked value — "pitch rate, $0.21\,\mathrm{deg/s}$, measured at time $t$, good". Putting the CRC, sequence and staleness checks here means every application above receives data already vetted, and no application is tempted to skip a check "because the driver probably did it". One place does the checking, and every user of the data benefits.
:::

::: context modulo Clock arithmetic
"Modulo" means "keep only the remainder". A clock face works modulo $12$: four hours after $10$ o'clock is $2$ o'clock, because $14 \bmod 12 = 2$. An additive checksum mod $256$ keeps the sum inside one byte, since a byte holds $0$ to $255$. The same idea returns for sequence counts, where the counter lives on a "clock face" with $16384$ positions instead of $12$.
:::

::: context crc-division Division without carries
A CRC divides bits the way you did long division in school, with one change: instead of subtracting, you use exclusive-or (XOR), where $1 \oplus 1 = 0$ and nothing ever carries into the next column. The divisor is the generator, written as a polynomial: $x^3 + x + 1$ means the bit pattern $1011$. The remainder is always one bit shorter than the generator, so a 32-bit CRC comes from a 33-bit generator.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="24" font-size="13" fill="#1f2a44">message bits, then 3 zeros for the remainder</text>
  <text x="40" y="52" font-size="16" fill="#1f2a44" font-family="monospace">1 1 0 1 0 0 0</text>
  <text x="20" y="78" font-size="16" fill="#1d6fd1" font-family="monospace">⊕ 1 0 1 1</text>
  <line x1="40" y1="86" x2="200" y2="86" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="52" font-size="12" fill="#6c7a93">each step: XOR the generator</text>
  <text x="220" y="68" font-size="12" fill="#6c7a93">under the leading 1</text>
  <text x="20" y="116" font-size="13" fill="#1f2a44">generator 1011 = x³ + x + 1</text>
  <text x="20" y="138" font-size="13" fill="#b4232c">remainder of 1101 is 001 — send 1101 001</text>
</svg>
```

Because each step lines the generator up under a particular bit, moving a bit changes which steps happen, and so changes the remainder.
:::

::: context odometer The counter that goes back to zero
A car's odometer with five digits reads $99999$ and then $00000$. The car did not teleport home; the display ran out of digits. A 14-bit sequence count does the same after $16383$. Picture the count on a ring instead of a line, and the gap is the distance forward around the ring.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="85" r="60" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="25" r="5" fill="#1f2a44"/>
  <text x="110" y="14" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <circle cx="80" cy="33.04" r="5" fill="#b4232c"/>
  <text x="44" y="30" font-size="12" text-anchor="middle" fill="#b4232c">16383</text>
  <circle cx="140" cy="33.04" r="5" fill="#1d6fd1"/>
  <text x="160" y="26" font-size="12" text-anchor="middle" fill="#1d6fd1">2</text>
  <path d="M 86 26 A 64 64 0 0 1 134 26" fill="none" stroke="#f2b880" stroke-width="3"/>
  <text x="110" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">16384 positions</text>
  <text x="200" y="60" font-size="12" fill="#1f2a44">expected 16383, got 2</text>
  <text x="200" y="80" font-size="12" fill="#1f2a44">missed: 16383, 0, 1</text>
  <text x="200" y="100" font-size="12" fill="#1f2a44">(2 − 16383) mod 16384 = 3</text>
</svg>
```
:::

::: context clock-skew Two honest clocks never agree exactly
Every clock runs very slightly fast or slow. Two quartz clocks that disagree by one part in a million drift apart by a millisecond every $1000\,\mathrm{s}$, about seventeen minutes. Flight computers correct this by syncing to a common time source, but between syncs a small disagreement, the **skew**, is normal. The skew allowance in a staleness check should be set from the measured worst case for the vehicle's clocks — a few milliseconds, say — not picked large enough to hide a real fault.
:::

::: context leap-second The minute with 61 seconds
When a leap second is added, UTC counts $23{:}59{:}58$, $23{:}59{:}59$, $23{:}59{:}60$, and only then $00{:}00{:}00$. Software that assumes every minute has 60 seconds has crashed or misbehaved at leap seconds more than once, in ground systems and on the internet. Leap seconds are announced only months ahead, so a vehicle cannot hard-code them. In 2022 the international body that sets time standards voted to stop adding leap seconds by 2035 — but flight software written today still has to handle them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="60" y1="42" x2="60" y2="58"/><line x1="130" y1="42" x2="130" y2="58"/>
    <line x1="200" y1="42" x2="200" y2="58"/><line x1="270" y1="42" x2="270" y2="58"/>
  </g>
  <rect x="200" y="44" width="70" height="12" fill="#f2b880"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="78">23:59:58</text><text x="130" y="78">23:59:59</text>
    <text x="200" y="78" fill="#b4232c">23:59:60</text><text x="270" y="78">00:00:00</text>
  </g>
  <text x="235" y="32" font-size="12" text-anchor="middle" fill="#b4232c">the extra second</text>
</svg>
```
:::

::: context gps-week Weeks, and a counter that rolled over
GPS satellites broadcast time as a week count since the 1980 epoch plus seconds into the week, counting from $0$ up to just under $604800$ (seven days). The original broadcast week field had only 10 bits, so it could count $1024$ weeks, about $19.6$ years, before wrapping to zero. It rolled over in August 1999 and again in April 2019, and some older receivers that did not handle the wrap reported dates about twenty years in the past. It is the same lesson as the sequence count: every counter has a size, and something must handle its wrap.
:::

::: context ntp The network's time service
NTP, the Network Time Protocol, is how computers on a network keep their wall clocks set. A computer asks a time server what time it is, allows for how long the question and answer took to travel, and adjusts its own clock. Usually it nudges the clock gradually, but after a large error it may step it at once. That step is exactly what breaks a duration measured on the wall clock. A vehicle running Linux (lesson 5) has this same machinery, which is one reason its flight software times everything on `CLOCK_MONOTONIC`.
:::
