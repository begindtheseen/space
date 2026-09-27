---
id: l10-decommutation-and-dropouts
title: Decommutation and dropouts
minutes: 20
covers:
  - 'The engineering variants: binary protocol decommutation, telemetry dropout detection, two-rate time alignment, ring buffer, PID with anti-windup, running median over a stream'
  - 'struct, endianness and checksums in Python; bit twiddling in C++'
---

Picture a long train rolling past a crossing. Every car is the same length. Each one has a bright yellow stripe painted on its front. If you want to count the cars, or read the number stenciled on each one, you watch for the yellow stripe. Now suppose fog rolls in and you miss a few seconds. You do not give up. You watch for the next yellow stripe, and you are back in step.

A spacecraft's radio downlink is that train. The data arrives as one endless row of bytes. Hidden in it are fixed-size **frames** — packages of readings, one after another. Each frame starts with the same agreed byte, the yellow stripe. Your job on the ground is to find the frames, check each one arrived undamaged, and pull out the numbers inside. That job is called **[[decommutation|decom-origin]]**: turning one stream of bytes back into separate channels of readings.

Last lesson gave you the tools: `struct`, byte order and checksums. This lesson assembles them into a working parser, then does the second half of the job: finding where data went missing, and computing honest statistics on what is left. Both are on the module's list of engineering variants, and the parser is the module's first exercise.

## What decommutation means

On board, a flight computer takes many sensor readings — a temperature, a pressure, a wheel speed — and packs them one after another into a single stream to send down. Packing many channels into one stream is **commutation**. Unpacking them on the ground is **decommutation**, or "decom" for short.

The rules for how the bytes are laid out are written in a document called the **packet spec** (short for specification — the agreed description). A spec tells you three things for every field:

- its **offset**, meaning how many bytes from the start of the frame it begins;
- its **width**, meaning how many bytes it takes;
- its **type and byte order**: signed or unsigned, integer or float, and big-endian or little-endian.

It also tells you how a frame starts and how its checksum is computed. Get any one of these wrong and the parser still runs. It prints numbers. They are the wrong numbers. That is why this is an interview favorite: the bugs are silent.

## A practice frame layout

We need a spec to work with. Here is one made up for this lesson. It is deliberately different from the one in the module's exercise, so that you still get to write that one yourself.

| Offset | Width | Field | Type |
| --- | --- | --- | --- |
| 0 | 1 | magic byte, always 0x7E | unsigned byte |
| 1 | 1 | sequence counter, 0 to 255 then wraps | unsigned byte |
| 2 | 4 | time since boot, milliseconds | unsigned 32-bit |
| 6 | 2 | temperature in hundredths of a degree C | signed 16-bit |
| 8 | 1 | status flags | unsigned byte |
| 9 | 1 | checksum | unsigned byte |

Every multi-byte field is **big-endian**: the most significant byte comes first, the way you write the digits of a number. So a frame is 10 bytes long.

The **[[magic byte|sync-marker]]** is the yellow stripe: a fixed value that marks where a frame begins. The **sequence counter** goes up by one each frame, so a gap in it means a frame was lost. The **checksum** here is additive: add up the first nine bytes and keep only the remainder after dividing by 256, so it fits in one byte. Read "$s \bmod 256$" aloud as "s mod 256": the remainder when $s$ is divided by 256.

In `struct` language, from last lesson, the first nine bytes are the format string `">BBIhB"`. The `>` means big-endian. `B` is an unsigned byte, `I` an unsigned 32-bit integer, `h` a signed 16-bit integer. Count the widths: $1 + 1 + 4 + 2 + 1 = 9$. Then one checksum byte makes 10. Always do that count out loud. A format string that is one byte short shifts every later field, and nothing crashes.

::: example Decoding one frame by hand
Here are ten bytes, written in hexadecimal (base 16, where `E8` means $14 \times 16 + 8 = 232$):

`7E 01 00 00 03 E8 08 66 00 D8`

**Magic.** Byte 0 is `7E`. That matches, so this could be a frame.

**Sequence.** Byte 1 is `01`: frame number 1.

**Time.** Bytes 2 to 5 are `00 00 03 E8`. Big-endian means the first byte is the biggest place. Only the last two bytes are nonzero: $3 \times 256 + 232 = 1000$. So $t = 1000\,\mathrm{ms}$, one second after boot.

**Temperature.** Bytes 6 and 7 are `08 66`. That is $8 \times 256 + 102 = 2150$ hundredths of a degree, or $21.50\,^\circ\mathrm{C}$. The top bit of `08` is 0, so the signed value is positive.

**Status.** Byte 8 is `00`: no flags set.

**Checksum.** Add bytes 0 to 8 as ordinary numbers: $126 + 1 + 0 + 0 + 3 + 232 + 8 + 102 + 0 = 472$. Then $472 - 256 = 216$, and 216 in hex is `D8`. Byte 9 is `D8`. The frame is good.

Sanity check: a room-temperature reading of 21.5 °C at one second after boot is believable. Had you read the temperature little-endian by mistake, you would get `66 08`, which is 26,120 hundredths, or 261.2 °C — hotter than an oven. A wildly implausible value is often the first sign of a byte-order bug.
:::

## Designing the parser

Now the loop. Keep one index, $i$, pointing at the byte you are examining. At each step there are three cases.

1. **Not a magic byte.** Move on one byte: $i$ becomes $i + 1$. This is **resynchronization**, or "resync": hunting byte by byte for the next place a frame could start.
2. **A magic byte, but the checksum fails.** Either the frame was damaged, or this `7E` was an ordinary data byte that happened to equal the magic value. You cannot tell which. So step forward only one byte, not a whole frame, and keep hunting. Jumping ten bytes could skip straight over the start of the next real frame.
3. **A magic byte and a good checksum.** Unpack the fields, save them, and jump $i$ forward by the full frame length.

One rule sits above all three: only look at a frame if a whole frame still remains. The loop condition is $i + 10 \le n$, where $n$ is the number of bytes you have. Read $\le$ as "is at most".

::: warning Never emit a partial frame
Radio data arrives in **[[chunks|chunked-stream]]**, and a chunk boundary can fall in the middle of a frame. The last few bytes of a chunk are then the front of a frame whose back has not arrived yet. If your parser unpacks them anyway, it invents a value from half a message. The fix is the loop condition above, plus one more thing: hand those leftover bytes back to the caller, so they can be glued onto the front of the next chunk.
:::

Here is the parser. It returns three things: the good frames, the leftover bytes, and a count of failed checksums.

```python
# int01_l10_decom.py -- a decommutator for a 10-byte, big-endian frame
import struct

MAGIC = 0x7E
FMT = ">BBIhB"            # magic, seq, t_ms, raw value, status  (9 bytes)
FRAME_LEN = 10            # 9 bytes of body + 1 checksum byte

def checksum(body):
    """Additive checksum: sum of the bytes, kept to one byte."""
    return sum(body) % 256

def build(seq, t_ms, raw, status=0):
    body = struct.pack(FMT, MAGIC, seq, t_ms, raw, status)
    return body + bytes([checksum(body)])

def parse(buf):
    """Return (frames, leftover, bad). O(n) time for n bytes."""
    frames, bad = [], 0
    i, n = 0, len(buf)
    while i + FRAME_LEN <= n:              # a whole frame must remain
        if buf[i] != MAGIC:
            i += 1                         # hunt for the next magic byte
            continue
        body = buf[i:i + FRAME_LEN - 1]
        if checksum(body) != buf[i + FRAME_LEN - 1]:
            bad += 1
            i += 1                         # this 0x7E was not a real start
            continue
        _, seq, t_ms, raw, status = struct.unpack(FMT, body)
        frames.append({"seq": seq, "t_ms": t_ms,
                       "value": raw / 100.0, "status": status})
        i += FRAME_LEN                     # jump to the byte after the frame
    return frames, buf[i:], bad

good = build(1, 1000, 2150) + build(2, 1100, 2163)
broken = bytearray(build(3, 1200, 2171)); broken[6] ^= 0x40   # flip one bit
blob = b"\x00\x7e\x13" + good + bytes(broken) + build(4, 1300, -512)
chunk1, chunk2 = blob[:-4], blob[-4:]      # the radio splits the stream

frames, rest, bad = parse(chunk1)
print("chunk 1:", [(f["seq"], f["t_ms"], f["value"]) for f in frames])
print("bad checksums:", bad, " leftover bytes:", len(rest))
frames, rest, bad = parse(rest + chunk2)
print("chunk 2:", [(f["seq"], f["t_ms"], f["value"]) for f in frames])
print("leftover bytes:", len(rest))
```

```bash
python3 int01_l10_decom.py
# chunk 1: [(1, 1000, 21.5), (2, 1100, 21.63)]
# bad checksums: 2  leftover bytes: 9
# chunk 2: [(4, 1300, -5.12)]
# leftover bytes: 0
```

Walk through what happened. The blob starts with three junk bytes, `00 7E 13`. The `00` is skipped. The `7E` looks like a start, but its "frame" fails the checksum — that is the first bad count — so the parser steps one byte and keeps hunting. Frames 1 and 2 parse cleanly. Frame 3 had one bit flipped in transit, so its checksum fails — the second bad count — and it is dropped. Frame 4 was split: its first six bytes ended chunk 1 and its last four started chunk 2. Chunk 1 handed back 9 leftover bytes instead of guessing, and frame 4 came out whole on the next call, with its negative temperature, −5.12 °C, read correctly through the signed `h`.

Notice what the output does not contain: frame 3. Its sequence number is missing between 2 and 4. That gap is exactly what the second half of this lesson detects.

::: key Parsing a binary protocol
Endianness, field widths and the exact struct format string, resynchronisation after a corrupt frame, checksum verification, and refusing to emit a truncated trailing frame. Say all five aloud before coding.
:::

**Complexity.** Each byte of the input can be the start of at most one candidate frame, and checking a candidate costs a fixed 10 bytes of work. So the time is $O(n \cdot L)$ with frame length $L$, and since $L$ is a constant, that is $O(n)$. Space is $O(f)$ for the $f$ frames returned, plus fewer than $L$ leftover bytes. Say it that way in the room: "Linear in the input, linear in the output."

::: note Why a one-byte step cannot miss a good frame
Suppose an intact frame starts at position $p$, and the parser is somewhere before it. Every step moves $i$ forward by exactly 1, except after a frame is accepted, when it moves by 10. Single steps visit every position, so the only way to pass over $p$ is to accept a frame that starts in the 9 bytes just before $p$. That would be a false start — some data bytes that happen to begin with `7E` — whose checksum also happens to match. That is rare, and no parser can tell it from a real frame. Apart from that, the parser lands on $p$ exactly. So resyncing one byte at a time finds every frame that arrived intact, at the cost of sometimes testing a false start.
:::

::: warning The checksum only catches some damage
An **[[additive checksum|checksum-strength]]** misses any damage that keeps the total the same — for example two bytes swapped, or one byte up by 5 and another down by 5. The module's exercise uses XOR instead, which misses different damage: the same bit flipped in two bytes. Real links add a stronger check such as a CRC. In an interview, say which errors your checksum catches and which it cannot.
:::

## Dropouts: where did the data go?

Back to the train. If cars pass every 10 seconds and suddenly 40 seconds go by between two cars, you know about three cars went past in the fog. The same reasoning finds gaps in telemetry.

A sensor sampled at a fixed rate has a **nominal period** $T$: the time it is supposed to leave between samples. At 10 Hz, $T = 100\,\mathrm{ms}$. Real samples wobble a little around that, called **[[jitter|jitter]]**. So you do not flag every step that is not exactly $T$. You flag a **dropout** — a stretch where samples are missing — only when the step is clearly too long:

$$
\Delta t_i = t_{i+1} - t_i > k \, T .
$$

Read $\Delta t_i$ as "delta t sub i": the time between sample $i$ and the next one. The threshold factor $k$ is a number you choose, commonly 1.5. It must be above 1 so jitter is not flagged, and below 2 so a single missing sample is caught.

How many samples are missing in a gap? If $\Delta t$ is about $m$ periods, then $m - 1$ samples should have sat between the two you have:

$$
\text{missing} = \operatorname{round}\!\left(\frac{\Delta t}{T}\right) - 1 .
$$

Rounding absorbs the jitter.

A **sequence counter**, like the one in our frame, gives a second opinion that does not depend on clocks. If consecutive frames carry counters $a$ and $b$, the number lost is $(b - a - 1) \bmod 256$. The mod handles the wrap from 255 back to 0: from counter 254 to counter 2, $(2 - 254 - 1) \bmod 256 = 3$ frames are missing, namely 255, 0 and 1.

## Statistics on noisy telemetry

Missing and bad values also show up inside the data. Ground software often marks an unusable reading as **[[NaN|nan]]** — "not a number", a special floating-point value meaning "no valid reading here".

NaN is contagious: any arithmetic with a NaN gives NaN. So a plain average of a list with one NaN in it is NaN. The fix is to skip NaN values and count only the good ones. The mean is then

$$
\bar{x} = \frac{1}{n_{\text{good}}} \sum_{\text{good } i} x_i ,
$$

read "x bar", and the **[[standard deviation|std-ddof]]** — the typical distance of a reading from the mean — is

$$
\sigma = \sqrt{\frac{1}{n_{\text{good}}} \sum_{\text{good } i} (x_i - \bar{x})^2 } .
$$

Read $\sigma$ as "sigma".

::: warning Do not turn NaN or a gap into zero
Filling a missing temperature with 0 is not "no data". It is a claim that the part was at 0 °C, and it drags the mean down. Skip missing values when you compute statistics, and report how many you skipped, so a reader knows how much the numbers rest on.
:::

Here is the dropout finder and the NaN-aware statistics together:

```python
# int01_l10_dropouts.py -- find gaps and summarize noisy telemetry
import math

def find_dropouts(t_ms, period_ms, k=1.5):
    """Gaps where the step exceeds k nominal periods. O(n) time, O(g) space."""
    gaps = []
    for a, b in zip(t_ms, t_ms[1:]):
        dt = b - a
        if dt > k * period_ms:
            missing = round(dt / period_ms) - 1
            gaps.append((a, b, missing))
    return gaps

def nan_stats(values):
    """Mean and population std of the non-NaN values. O(n) time, O(1) space."""
    n, total = 0, 0.0
    for v in values:
        if not math.isnan(v):
            n += 1
            total += v
    if n == 0:
        return float("nan"), float("nan"), 0
    mean = total / n
    sq = sum((v - mean) ** 2 for v in values if not math.isnan(v))
    return mean, math.sqrt(sq / n), n

t = [0, 100, 200, 300, 700, 800, 900, 1000, 1110, 1200, 1500]   # ms, 10 Hz
v = [21.5, 21.6, float("nan"), 21.7, 21.9, 22.0, 21.8, float("nan"), 22.1, 22.0, 22.3]
gaps = find_dropouts(t, 100)
print("gaps:", gaps)
print("samples missing:", sum(m for _, _, m in gaps))
mean, std, n = nan_stats(v)
print(f"good values: {n}  mean: {mean:.3f}  std: {std:.3f}")
print("plain mean:", sum(v) / len(v))

import numpy as np
a = np.array(v)
print(f"numpy: {np.nanmean(a):.3f} {np.nanstd(a):.3f}")
```

```bash
python3 int01_l10_dropouts.py
# gaps: [(300, 700, 3), (1200, 1500, 2)]
# samples missing: 5
# good values: 9  mean: 21.878  std: 0.239
# plain mean: nan
# numpy: 21.878 0.239
```

Both functions make one pass, or two, over the data, so each is $O(n)$ time. The dropout finder stores one entry per gap, $O(g)$ space for $g$ gaps; the statistics need only a few running numbers, $O(1)$ space. The empty case returns NaN with a count of zero rather than dividing by zero.

::: example Counting the gaps by hand
Use the timestamps from the code: $0, 100, 200, 300, 700, 800, 900, 1000, 1110, 1200, 1500$ ms, with $T = 100\,\mathrm{ms}$ and $k = 1.5$.

**The threshold.** $k\,T = 1.5 \times 100 = 150\,\mathrm{ms}$. Any step longer than 150 ms is a gap.

**The steps.** Subtract neighbors: 100, 100, 100, 400, 100, 100, 100, 110, 90, 300. Two are over 150: the 400 (from 300 to 700) and the 300 (from 1200 to 1500). The 110 and 90 are jitter, and they are correctly left alone.

**Missing counts.** $400 / 100 = 4$, so $4 - 1 = 3$ samples are missing: the ones at 400, 500 and 600 ms. $300 / 100 = 3$, so $3 - 1 = 2$ are missing: 1300 and 1400 ms. Total: 5.

**The mean.** Two of the eleven values are NaN, leaving 9. Their sum is $21.5 + 21.6 + 21.7 + 21.9 + 22.0 + 21.8 + 22.1 + 22.0 + 22.3 = 196.9$, and $196.9 / 9 \approx 21.878\,^\circ\mathrm{C}$.

Sanity check: 11 samples received plus 5 missing is 16, and a 10 Hz sensor running from 0 to 1500 ms should give $1500/100 + 1 = 16$ samples. It adds up. And the mean sits between the smallest good value, 21.5, and the largest, 22.3, as a mean must.
:::

::: note NumPy does the same in one line
`np.nanmean` and `np.nanstd` skip NaNs for you, and `np.diff(t)` gives all the steps at once, so `np.flatnonzero(np.diff(t) > 1.5 * T)` lists the gap positions. In an interview, write the loop first so the interviewer sees the logic, then mention the vectorized version. Note that `np.nanstd` divides by $n$ by default, like the code above; pass `ddof=1` to divide by $n - 1$.
:::

## Check yourself

::: check
A frame in this lesson's layout arrives as `7E 05 00 00 07 D0 FF 38 01 ??`. Decode the sequence number, time and temperature, and work out what the checksum byte must be.
:::

::: answer
Sequence: `05`, frame 5. Time: `00 00 07 D0` big-endian is $7 \times 256 + 208 = 2000$ ms. Temperature: `FF 38` is $255 \times 256 + 56 = 65{,}336$ as an unsigned number; its top bit is set, so as a signed 16-bit number it is $65{,}336 - 65{,}536 = -200$ hundredths, or −2.00 °C. Status: `01`, bit 0 set. Checksum: $126 + 5 + 0 + 0 + 7 + 208 + 255 + 56 + 1 = 658$, and $658 - 2 \times 256 = 146$, which is `92` in hex. So the last byte must be `92`.
:::

::: check
The parser finds a magic byte but the checksum fails. A teammate suggests skipping ahead a full 10 bytes "because that frame is bad anyway". What goes wrong?
:::

::: answer
The byte that looked like magic may not have been a real frame start at all — it may have been a data byte equal to `7E`, sitting just before a real frame. Skipping 10 bytes can then jump over the true start, losing a good frame, and possibly several more if the parser lands out of step again. Stepping one byte costs a little extra checking but guarantees every intact frame is found. The time stays $O(n)$ either way.
:::

::: check
Your parser is fed a 3,000-byte chunk and returns 7 leftover bytes. What should the caller do with them, and why does the parser not unpack them?
:::

::: answer
Keep them and put them in front of the next chunk before parsing it. Seven bytes is less than a whole 10-byte frame, so there is not enough data to check a checksum or read every field. They are almost certainly the front of a frame whose rest is in the next chunk. Unpacking them would invent a value from part of a message. Only the loop condition $i + L \le n$ is needed to prevent it.
:::

::: check
A 50 Hz sensor has timestamps $\dots, 4.000, 4.020, 4.041, 4.120, 4.140, \dots$ seconds. With $k = 1.5$, is there a dropout, and how many samples are missing?
:::

::: answer
At 50 Hz, $T = 1/50 = 0.020$ s, so the threshold is $1.5 \times 0.020 = 0.030$ s. The steps are 0.020, 0.021, 0.079 and 0.020. Only 0.079 is over 0.030, so there is one gap, between 4.041 and 4.120. $0.079 / 0.020 = 3.95$, which rounds to 4, so $4 - 1 = 3$ samples are missing. The 0.021 step is jitter and is correctly ignored.
:::

::: check
Five temperature readings are 20.0, NaN, 22.0, NaN, 24.0. What are the mean and the population standard deviation of the good values? What would a naive average give?
:::

::: answer
Three good values: 20.0, 22.0, 24.0. Mean: $66 / 3 = 22.0$. Deviations from the mean are −2, 0 and +2; squared, 4, 0 and 4; their average is $8/3 \approx 2.67$; the square root is about 1.63. So $\sigma \approx 1.63\,^\circ\mathrm{C}$. A naive average adds the NaNs in and returns NaN. Replacing NaNs with zeros instead would give $66/5 = 13.2$, which is wrong and much colder than any real reading.
:::

## Summary

| Idea | What it means | Fact to carry |
| --- | --- | --- |
| decommutation | splitting one byte stream back into channels | driven by the packet spec |
| magic byte | fixed value marking a frame start | resync by stepping one byte |
| format string | field types, widths, byte order | count the widths out loud |
| checksum | small check on a frame's bytes | verify before trusting any field |
| trailing bytes | a partial frame at a chunk's end | loop while a whole frame remains; return leftovers |
| parser cost | one candidate per byte, fixed work each | $O(n)$ time, $O(f)$ space |
| dropout | a step longer than $k\,T$ | missing is $\operatorname{round}(\Delta t / T) - 1$ |
| sequence gap | lost frames from counters | $(b - a - 1) \bmod 256$ |
| NaN-aware stats | skip bad values, count what is left | mean and std in $O(n)$ time, $O(1)$ space |

Next lesson keeps the stream flowing: a ring buffer that holds the most recent samples in fixed memory, and a way to line up two sensors that report at different rates.

::: context decom-origin A spinning switch in the sky
In early telemetry systems, a mechanical **commutator** — a rotating switch — connected each sensor to the radio in turn, many times a second: temperature, then pressure, then voltage, then back to temperature. The ground station ran a matching switch in step to split the signal back out. That is why unpacking a telemetry stream is still called decommutation, even though today the "switch" is a list of byte offsets in software.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="75" r="50" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="75" x2="125" y2="40" stroke="#b4232c" stroke-width="3"/>
  <circle cx="90" cy="75" r="4" fill="#1f2a44"/>
  <g fill="#1d6fd1">
    <circle cx="125" cy="40" r="6"/>
    <circle cx="125" cy="110" r="6"/>
    <circle cx="55" cy="110" r="6"/>
    <circle cx="55" cy="40" r="6"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="136" y="36">temp</text>
    <text x="136" y="120">pressure</text>
    <text x="4" y="124">voltage</text>
    <text x="10" y="30">speed</text>
  </g>
  <line x1="200" y1="75" x2="345" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" font-size="11" text-anchor="middle">
    <rect x="205" y="62" width="30" height="26" fill="#8fb8f0"/>
    <rect x="240" y="62" width="30" height="26" fill="#f2b880"/>
    <rect x="275" y="62" width="30" height="26" fill="#ffffff"/>
    <rect x="310" y="62" width="30" height="26" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="220" y="79">T</text>
    <text x="255" y="79">P</text>
    <text x="290" y="79">V</text>
    <text x="325" y="79">S</text>
    <text x="272" y="110">one stream, channels in turn</text>
  </g>
</svg>
```
:::

::: context sync-marker Longer stripes in real links
One magic byte is fine for practice, but a single byte value turns up by chance in ordinary data about once every 256 bytes, so false starts are common. Real space links use a longer sync marker to make chance matches rare. The CCSDS standards used by many space agencies define a 32-bit attached sync marker, `1ACFFC1D` in hex, placed before each transfer frame. The ground receiver searches for that pattern in the same resync-and-check way this lesson's parser does.
:::

::: context chunked-stream Why frames get cut in half
Bytes reach your program in whatever pieces the radio, the network or the file reader hands over: 4,096 bytes at a time, say. Those pieces know nothing about frame boundaries. With 10-byte frames and 4,096-byte chunks, most chunk edges land mid-frame. The picture shows frame 4 of the lesson's blob straddling two chunks. A streaming parser keeps the tail as leftover and joins it to the next chunk.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44">
    <rect x="20" y="40" width="100" height="30" fill="#8fb8f0"/>
    <rect x="120" y="40" width="100" height="30" fill="#ffffff"/>
    <rect x="220" y="40" width="60" height="30" fill="#f2b880"/>
    <rect x="280" y="40" width="40" height="30" fill="#f2b880"/>
  </g>
  <line x1="280" y1="20" x2="280" y2="95" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="59">frame 2</text>
    <text x="170" y="59">frame 3 (bad)</text>
    <text x="250" y="59">frame 4</text>
    <text x="300" y="59">…4</text>
    <text x="150" y="30">chunk 1</text>
    <text x="320" y="30">chunk 2</text>
    <text x="250" y="88">6 bytes</text>
    <text x="300" y="88">4 bytes</text>
    <text x="180" y="112" fill="#b4232c">chunk boundary</text>
  </g>
</svg>
```
:::

::: context checksum-strength Additive, XOR and CRC
Each check is a fingerprint of the frame, and each has blind spots. An additive sum mod 256 misses reordered bytes, because addition does not care about order. XOR misses the same bit flipped in two different bytes, because the two flips cancel. A **cyclic redundancy check** (CRC) mixes position into the fingerprint and catches all single bursts of damage up to its width, which is why links use CRC-16 or CRC-32. Interviewers like hearing that you know the difference, even when the spec in front of you uses a simple one.
:::

::: context jitter Why clocks wobble
A flight computer samples on a timer, but the timestamp is stamped when the software gets round to it, and that can be a millisecond late when something else is busy. Network and bus delays add more. The result is steps like 110 ms and 90 ms around a nominal 100 ms, which average out to the right rate. A threshold of $k = 1.5$ periods leaves half a period of room for this wobble while still catching a single missing sample, which makes a step of about two periods.
:::

::: context nan A value that is not equal to itself
NaN is defined by the IEEE 754 floating-point standard that nearly every computer uses. It comes from operations like 0/0, or is set on purpose to mean "no reading". Its strangest property is that `NaN == NaN` is false. So you cannot find NaNs by comparing with `==`; use `math.isnan(x)` in Python, `np.isnan` for arrays, or `std::isnan` in C++. The self-inequality is also the old trick: `x != x` is true only for NaN.
:::

::: context std-ddof Dividing by n or by n minus 1
The **population** standard deviation divides the sum of squares by $n$. The **sample** standard deviation divides by $n - 1$, which slightly enlarges it to correct for the mean itself having been estimated from the same data. For the nine good readings in the example, the population value is about 0.239 °C and the sample value about 0.254 °C. NumPy's `np.std` and `np.nanstd` divide by $n$ unless you pass `ddof=1`; Python's `statistics.stdev` divides by $n - 1$. Neither is wrong. Say which one you used.
:::
