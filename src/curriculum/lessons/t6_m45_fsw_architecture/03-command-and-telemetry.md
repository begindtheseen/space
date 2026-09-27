---
id: l03-command-and-telemetry
title: Command and telemetry
minutes: 21
covers:
  - "Command and telemetry: CCSDS packet structure, dictionaries, limit checking, and command authentication"
---

Think about mailing a letter. The envelope has a standard layout: an address, a stamp, a return address, all in the places every post office expects. The post office never opens the letter. It reads the envelope, and that is enough to deliver it anywhere in the world. Inside, the letter only makes sense if the reader shares your language. And if the letter says "sell the house," the reader had better be sure it really came from you — so important letters get a signature nobody else can copy.

Every number your estimators produce and every command your controllers issue eventually leaves the flight computer as bytes on a wire, and the software at that door works exactly like the mail. **Telemetry** — reports flowing from the vehicle down to the ground — must be packed so that a ground system, built years later by people who never met the flight team, can still read it. **Commands** — instructions flowing up from the ground to the vehicle — must resist not only noise on the radio link but deliberate forgery. A wrong command carried out with full confidence is usually worse than a wrong measurement, which a filter can at least doubt.

This lesson covers the standard envelope both streams share (the **CCSDS packet**), the shared codebook that gives packets meaning (the **dictionary**), the automatic checks on telemetry values (**limit checking**), and the signature on commands (**authentication**).

## Two streams, two kinds of risk

Telemetry flows down all the time, whether anyone is watching or not. Commands flow up rarely and on purpose, and the flight computer acts on them directly.

That difference in consequence sets how hard each stream works to protect itself. A corrupted telemetry value that fails a check is dropped or flagged. Nothing on the vehicle acted on it, so the cost is a gap on a ground display. A corrupted or forged command that is accepted changes what the vehicle physically does. Keep that lopsidedness in mind for everything below.

## CCSDS packets: one envelope for decades

Space agencies agreed long ago on a common packet layout, the **Space Packet**, set down by the **[[Consultative Committee for Space Data Systems|ccsds]]** (CCSDS). Because it is standard, ground stations, relay satellites and flight computers built by different organizations, in different decades, can exchange data without special arrangements. You will meet CCSDS packets in almost any mission's documents, so it pays to know the fields down to the bit.

A packet begins with a six-byte **primary header**: three **[[16-bit words|header-bits]]**, each holding several fields packed side by side.

- **Word 0** holds a 3-bit version number, a 1-bit **type** flag (0 for telemetry, 1 for command), a 1-bit flag saying whether a secondary header follows, and an 11-bit **APID**. The APID, short for **application process identifier**, says which onboard application made the packet, or should receive it. It is the closest thing the packet has to an address. With 11 bits there are $2^{11} = 2048$ possible values, and **[[one of them is reserved|apid-idle]]**.
- **Word 1** holds 2 **sequence flags**, saying whether this packet stands alone or is the first, middle or last piece of a larger block of data split across several packets. The other 14 bits are the **sequence count**. It goes up by one for every packet from a given APID and **[[wraps around|wrap-around]]** to zero after $2^{14} - 1 = 16383$, so it counts 16384 values. Lesson 4 uses it to spot a missing packet.
- **Word 2** is a 16-bit **packet data length**. By the standard's definition it is *the number of bytes in the data field, minus one*. The "minus one" lets 16 bits describe a data field anywhere from 1 byte up to $2^{16} = 65536$ bytes (a data field is never empty).

After the primary header comes an optional secondary header, often a timestamp, and then the payload itself. What those bytes mean depends on the APID, and is written down in that application's dictionary — the next section.

::: key
A CCSDS primary header is six bytes: version (3 bits), type (1 bit), secondary-header flag (1 bit), APID (11 bits); sequence flags (2 bits) and sequence count (14 bits, wraps at 16384); packet data length (16 bits, the byte count of the data field minus one).
:::

::: warning The length field is one short
The packet data length is the data field's byte count *minus one*, not the byte count. Code that forgets the offset either reads one byte too few from every packet or thinks every packet is one byte longer than it is. A test that only ever uses one fixed packet size can hide this for a long time, because it shows up only as an off-by-one at a boundary nobody tested.
:::

To pack fields into a 16-bit word, you shift each one left to its position and combine them with OR. To unpack, you shift right and keep only the bits you want with AND and a **mask** — a number whose binary digits are 1 exactly where the field sits. For example `0x7FF` (written in **[[hexadecimal|hex]]**) is eleven 1s in binary, so `word0 & 0x7FF` keeps just the APID.

::: example Packing and unpacking a CCSDS-style primary header
```python
import struct

def pack_primary_header(version, ptype, sec_hdr_flag, apid, seq_flags, seq_count, data_len_minus_1):
    word0 = (version & 0b111) << 13 | (ptype & 0b1) << 12 | (sec_hdr_flag & 0b1) << 11 | (apid & 0x7FF)
    word1 = (seq_flags & 0b11) << 14 | (seq_count & 0x3FFF)
    word2 = data_len_minus_1 & 0xFFFF
    return struct.pack(">HHH", word0, word1, word2)

def unpack_primary_header(raw: bytes):
    word0, word1, word2 = struct.unpack(">HHH", raw)
    return dict(
        version=(word0 >> 13) & 0b111, ptype=(word0 >> 12) & 0b1,
        sec_hdr_flag=(word0 >> 11) & 0b1, apid=word0 & 0x7FF,
        seq_flags=(word1 >> 14) & 0b11, seq_count=word1 & 0x3FFF,
        data_len_minus_1=word2,
    )

hdr = pack_primary_header(version=0, ptype=0, sec_hdr_flag=1, apid=0x123,
                           seq_flags=0b11, seq_count=4092, data_len_minus_1=17)
print(hdr.hex())
# 0923cffc0011
print(unpack_primary_header(hdr))
# {'version': 0, 'ptype': 0, 'sec_hdr_flag': 1, 'apid': 291, 'seq_flags': 3,
#  'seq_count': 4092, 'data_len_minus_1': 17}
print("packet length in bytes:", unpack_primary_header(hdr)["data_len_minus_1"] + 1)
# packet length in bytes: 18
```

Follow the first word by hand. Version 0 and type 0 add nothing. The secondary-header flag 1 shifted left 11 places is `0x0800`. The APID is `0x123` (291 in decimal). Together: `0x0800 + 0x123 = 0x0923`. Those are the first two bytes printed.

The second word: sequence flags `0b11` (3, meaning "stand-alone packet") shifted left 14 places is `0xC000`. The count 4092 is `0xFFC`. Together: `0xCFFC`. The third word is 17, which is `0x0011`. The `">HHH"` tells `struct` to write three 16-bit unsigned numbers with the most significant byte first, which is the order CCSDS uses.

Unpacking reverses each step and gets every field back. Notice the "minus one" at work: an 18-byte data field is stored as 17, and the last line adds the one back. Sanity check: the header came out exactly six bytes (twelve hex digits), as the standard says.
:::

## Dictionaries: the shared codebook

A packet's payload bytes mean nothing on their own. They mean something only when read against a **dictionary**: a table, shared by the flight software and the ground system, that describes each packet. For telemetry, it maps each APID to its fields: names (called **mnemonics**, like `BATT_V` for battery voltage), byte positions, data types, scale factors to engineering units, and the limits covered in the next section. For commands, it maps each command's name to the exact byte layout the flight computer expects.

This is the device-manager idea from lesson 1, one layer up. A device manager turns raw bus bytes into a named, typed quantity for the GNC application. A telemetry dictionary turns an APID and a byte position into a named, typed quantity for a ground display, a process ground engineers call **[[decommutation|decom]]**.

On a well-run program the dictionary is not documentation sitting beside the code. It *is* the single source from which both the flight software's packet code and the ground system's decoding tables are generated. That way the two sides cannot quietly drift apart. A mismatch between what the flight computer thinks it sends and what the ground thinks it receives is exactly the hidden bug a single-source dictionary exists to prevent.

A dictionary also changes over a program's life: a new sensor adds a mnemonic, a calibration changes a scale factor. So it is a versioned item under **configuration management**, tracked and reviewed separately from the executable that reads it — the same discipline lesson 12 applies to gains and tables.

## Limit checking

Each telemetry point in a dictionary usually carries four thresholds: **red-low**, **yellow-low**, **yellow-high** and **red-high**. Think of a car's temperature gauge with a green middle, yellow warning bands, and red at both ends.

- Between the two yellow limits: nominal (green).
- Between a yellow limit and the red limit beyond it: **caution** (yellow).
- At or beyond a red limit: **alarm** (red).

This **[[four-level scheme|limit-bands]]**, checked automatically against the dictionary's own numbers, lets a ground controller — or an onboard monitor — watch thousands of telemetry points without reading each one. Attention goes only to the points outside green.

::: example A limit checker driven by the dictionary
```python
DICTIONARY = {
    "BATT_V": {"units": "V", "red_low": 22.0, "yellow_low": 24.0, "yellow_high": 33.0, "red_high": 34.5},
    "PROP_TEMP": {"units": "degC", "red_low": -10.0, "yellow_low": 0.0, "yellow_high": 40.0, "red_high": 50.0},
}

def limit_status(mnemonic, value, dictionary=DICTIONARY):
    d = dictionary[mnemonic]
    if value <= d["red_low"] or value >= d["red_high"]:
        return "RED"
    if value <= d["yellow_low"] or value >= d["yellow_high"]:
        return "YELLOW"
    return "GREEN"

for mnem, val in [("BATT_V", 28.4), ("BATT_V", 23.1), ("BATT_V", 21.5),
                   ("PROP_TEMP", 45.0), ("PROP_TEMP", 20.0)]:
    print(f"{mnem}={val} {DICTIONARY[mnem]['units']} -> {limit_status(mnem, val)}")
# BATT_V=28.4 V -> GREEN
# BATT_V=23.1 V -> YELLOW
# BATT_V=21.5 V -> RED
# PROP_TEMP=45.0 degC -> YELLOW
# PROP_TEMP=20.0 degC -> GREEN
```

Check each line against the thresholds. A battery at 28.4 V sits between 24.0 and 33.0: green. At 23.1 V it is below yellow-low (24.0) but above red-low (22.0): yellow. At 21.5 V it is below red-low: red. The propellant at 45.0 °C is past yellow-high (40.0) but short of red-high (50.0): yellow. At 20.0 °C it is comfortably green.

Notice that `limit_status` knows nothing about batteries or propellant. It reads whatever thresholds the dictionary supplies. Add a new mnemonic to the dictionary and the same function checks it with no new code — lesson 1's reuse argument, applied to telemetry.
:::

This single-sample check is deliberately naive. A value that pokes into yellow for one noisy sample and drops straight back to green should not wake an operator at two in the morning. Lesson 9 adds the persistence counters and hysteresis that turn this raw color into a report of real trends rather than every momentary blip.

## Command authentication

Everything so far applies to both streams alike. Commands need one more thing. The flight computer must be able to prove that a command came from an authorized sender and was not changed on the way — even by someone who knows the packet format perfectly. That proof is called **authentication**. It is a different property from the integrity checks, such as a **CRC** (cyclic redundancy check), that lesson 4 covers in full. The difference is worth making precise now.

A CRC is a public algorithm with no secret. Its recipe is in a standard anyone can read. That makes it excellent at catching *accidental* damage: a bit flipped by radio noise has no way to also fix up the CRC to match. But someone who deliberately changes a command can simply recompute a fresh, correct CRC over the altered bytes. Nothing about computing a CRC needs knowledge the attacker lacks. A CRC alone gives no protection against a deliberate change. It is like counting the words in a letter: a forger who rewrites the letter can count the words too.

Authentication folds a secret into the check. The most common form is an **HMAC** (hash-based message authentication code): a **[[keyed hash|hmac]]** computed from the command bytes and a secret key that only the ground and the flight computer share. The result, a short string called a **tag**, is sent with the command. The flight computer recomputes the tag with its copy of the key and accepts the command only if the tags match. (A related approach uses a private signing key held only by the sender, with a public key on board to check it.) To forge a matching tag for altered bytes, you need the key — which someone who can only watch or intercept the radio link does not have.

::: example A CRC does not stop tampering; an HMAC does
```python
import zlib, hmac, hashlib

cmd = b"CMD:MECO_INHIBIT_CLEAR:ARM=1"
tampered = b"CMD:MECO_INHIBIT_CLEAR:ARM=0"

crc_tampered_recomputed = zlib.crc32(tampered)
print(f"CRC-32 of original:  {zlib.crc32(cmd):#010x}")
# CRC-32 of original:  0xc4f3f402
print(f"CRC-32 of tampered, recomputed by whoever tampered it: {crc_tampered_recomputed:#010x}")
# CRC-32 of tampered, recomputed by whoever tampered it: 0xb3f4c494
# both are internally "correct" CRCs -- a CRC check alone accepts the tampered command

key = b"ground-segment-shared-key-do-not-reuse"
tag_original = hmac.new(key, cmd, hashlib.sha256).hexdigest()
forged_ok = hmac.compare_digest(hmac.new(key, tampered, hashlib.sha256).hexdigest(), tag_original)
print(f"does the tampered command verify against the original's HMAC tag? {forged_ok}")
# does the tampered command verify against the original's HMAC tag? False
```

Walk through it. One character changed, `1` to `0`. The tamperer recomputed the CRC over the new bytes and got `0xb3f4c494`. A receiver that checks only the CRC finds that it matches the bytes it received, and accepts the forged command.

Now the HMAC. The ground computed a tag over the original command with the secret key and sent it along. The tamperer cannot compute a new tag without the key, so the tampered command arrives with the old tag. The flight computer recomputes the tag over the bytes it received, compares, and finds a mismatch: `False`, rejected. (`compare_digest` compares in a way that takes the same time however many characters match, so an attacker cannot learn the tag by timing the check.)
:::

::: warning A genuine command can be sent twice
Authentication proves who wrote a command. It does not prove the command is *new*. An attacker who records a real, correctly signed "fire thruster" command can **[[replay|replay]]** it later, and its tag will still check out. The defense is to put a counter or timestamp inside the authenticated bytes, and have the flight computer reject any command whose counter it has already seen or that is too old.
:::

The command dictionary, the list of authorized senders, and the record of which commands need which level of authority are, like the telemetry dictionary, versioned items under configuration management. At the most serious end of the command set, they are the software boundary that the abort logic of lesson 10 relies on being impossible to forge.

## Check yourself

::: check
A ground engineer reads a raw CCSDS primary header and finds its third 16-bit word is `0x004F`. How many bytes long is the data field? How long is the whole packet?
:::

::: answer
`0x004F` is $4 \times 16 + 15 = 79$ in decimal. The field stores the data length minus one, so the data field is $79 + 1 = 80$ bytes. Adding the six-byte primary header, the whole packet is $80 + 6 = 86$ bytes.
:::

::: check
Two ground tools decode the same telemetry stream. Both parse the identical raw bytes correctly, yet they show different engineering values for one mnemonic. What is the likely cause, and what process failure does it point to?
:::

::: answer
They are almost certainly using different versions of the telemetry dictionary — a different scale factor, offset or limit set for that mnemonic. The raw bytes and packet structure are the same and parsed correctly by both, so the difference must lie in how each tool turns bytes into units.

That points to a configuration-management failure. The dictionary was not kept as one versioned source that both tools were built from, and it drifted. The fix is the one lesson 12 gives for gains and tables: one authoritative, versioned dictionary from which every user, onboard and on the ground, is built or configured.
:::

::: check
Why does a single-sample limit check like the one in this lesson's example cause false alarms in practice? Which later lesson fixes it?
:::

::: answer
Ordinary measurement noise can push a value across a yellow or red line for one sample and back the next, with nothing actually wrong. A checker that reports every single crossing reports noise as often as real trends. Operators then learn to ignore the alarm instead of trusting it. Lesson 9 adds persistence counters, which demand several exceedances in a row, and hysteresis, before a condition is declared.
:::

::: check
In one sentence each: why is a CRC the wrong tool to stop a deliberately forged command, and why is an HMAC the right one?
:::

::: answer
A CRC is a public algorithm with no secret, so anyone who alters a command's bytes can recompute a matching CRC and the check passes. An HMAC mixes in a secret key the forger does not have, so a matching tag cannot be computed for altered bytes, and the check fails as it should.
:::

::: check
Partway through integration and testing, a payload team wants to add ten new telemetry mnemonics. Under the structure this lesson describes, what must happen before the flight software or the ground system can show any of them correctly?
:::

::: answer
The ten mnemonics must first be added to the shared telemetry dictionary, with their APID, byte positions, types, units and limits. Neither the flight software's packet code nor the ground decoding tables can interpret bytes that have no dictionary entry.

If both sides are generated from that one dictionary, adding the entries and rebuilding both sides is the whole job. If each side keeps its own copy, both copies must be edited by hand — exactly the drift risk from the previous question.
:::

## Summary

| Term | Meaning |
| --- | --- |
| CCSDS primary header | 6 bytes: version, type, secondary-header flag, 11-bit APID; sequence flags, 14-bit sequence count; 16-bit data length minus one |
| APID | Application process ID: which onboard app made or should receive a packet |
| Sequence count | Goes up by one per packet per APID; wraps at 16384 |
| Dictionary | Shared, versioned table giving each APID or command its fields, units and limits |
| Limit status | Green, yellow (caution) or red (alarm) from a value against its yellow and red limits |
| Integrity (CRC, checksum) | Catches accidental damage; has no secret, so cannot stop tampering |
| Authentication (HMAC) | Needs a shared secret key; a forged command cannot carry a valid tag |
| Replay protection | A counter or timestamp inside the authenticated bytes, so an old genuine command is refused |

The next lesson stays with a single input and asks whether it can be trusted: CRCs in full, sequence counts, timestamps and staleness. After that, from lesson 5 on, the module turns to reconciling several redundant sources of the same quantity into one answer.

::: context ccsds Who writes the standard
The Consultative Committee for Space Data Systems was formed in 1982 by the world's major space agencies, including NASA and the European Space Agency. It writes recommended standards for how spacecraft and ground systems exchange data: packet formats, radio link protocols, time codes, security. Because agencies and companies follow them, a ground station in one country can track and decode a spacecraft built in another. The standards are free to download from the committee's website.
:::

::: context header-bits The six bytes, bit by bit
Each 16-bit word is a row of 16 on-off switches. The fields sit side by side, most significant bit on the left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="20" y="15" width="60" height="30" fill="#8fb8f0"/>
    <rect x="80" y="15" width="20" height="30" fill="#fff"/>
    <rect x="100" y="15" width="20" height="30" fill="#fff"/>
    <rect x="120" y="15" width="220" height="30" fill="#f2b880"/>
    <rect x="20" y="60" width="40" height="30" fill="#8fb8f0"/>
    <rect x="60" y="60" width="280" height="30" fill="#fff"/>
    <rect x="20" y="105" width="320" height="30" fill="#fff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="34">ver 3</text>
    <text x="90" y="34">T</text>
    <text x="110" y="34">S</text>
    <text x="230" y="34">APID 11</text>
    <text x="40" y="79">flg 2</text>
    <text x="200" y="79">sequence count 14</text>
    <text x="180" y="124">packet data length 16 (bytes minus one)</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="end">
    <text x="16" y="34">0</text><text x="16" y="79">1</text><text x="16" y="124">2</text>
  </g>
</svg>
```

Each box is drawn 20 units wide per bit, so the widths add up to 16 bits in every row: $3 + 1 + 1 + 11$, $2 + 14$, and $16$.
:::

::: context apid-idle The reserved APID
Eleven bits give APIDs 0 through 2047. The all-ones value, 2047, is set aside for **idle packets**: filler sent when a link must keep transmitting but has no real data to send. A ground system simply throws them away. So a mission has 2047 usable addresses, far more than even a large spacecraft needs.
:::

::: context wrap-around Counting like an odometer
An old car odometer with five digits rolls from 99999 back to 00000. The 14-bit sequence count does the same, from 16383 back to 0. A receiver checking for gaps must allow for this: after 16383, the next count is 0, not 16384. Code that treats the rollover as a jump of −16383 will report a huge false gap once every 16384 packets. Lesson 4 shows the correct subtraction.
:::

::: context hex Reading hexadecimal
**Hexadecimal** is counting in sixteens. It uses the digits 0–9 and then A–F for ten to fifteen. The prefix `0x` marks a hex number. Each hex digit stands for exactly four bits, which is why programmers use it for bit fields: `0x7FF` is `0111 1111 1111`, eleven 1s at the bottom, and `0x3FFF` is fourteen 1s. To convert `0x4F` to decimal, compute $4 \times 16 + 15 = 79$.
:::

::: context decom Where "decommutation" comes from
Early telemetry systems used a spinning switch called a **commutator** to connect many sensors, one after another, to a single radio channel. On the ground, a matching device separated the stream back into individual channels: **decommutation**. The spinning switches are long gone, but ground engineers still say "decom" for turning a packet's bytes back into named values.
:::

::: context limit-bands The limit bands for battery voltage
The example's battery limits drawn on one line. Dots mark the three sample values: 21.5 V (red), 23.1 V (yellow) and 28.4 V (green).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="40" height="20" fill="#b4232c"/>
  <rect x="60" y="30" width="40" height="20" fill="#f2b880"/>
  <rect x="100" y="30" width="180" height="20" fill="#8fb8f0"/>
  <rect x="280" y="30" width="30" height="20" fill="#f2b880"/>
  <rect x="310" y="30" width="30" height="20" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="68">22</text><text x="100" y="68">24</text><text x="280" y="68">33</text><text x="316" y="68">34.5</text>
    <text x="190" y="88">volts</text>
  </g>
  <g fill="#1f2a44">
    <circle cx="50" cy="22" r="4"/><circle cx="82" cy="22" r="4"/><circle cx="188" cy="22" r="4"/>
  </g>
</svg>
```

The scale is 20 units per volt, starting at 20 V on the left edge.
:::

::: context hmac How a keyed hash works
A **hash** function scrambles any input into a fixed-length fingerprint; SHA-256 gives 256 bits, written as 64 hex digits. Change one input bit and about half the output bits flip, unpredictably. An HMAC runs the hash over the message mixed with a secret key, in a specific two-pass recipe. Without the key, nobody can predict the fingerprint of a new message, so nobody can forge one. Real space links use standards such as CCSDS Space Data Link Security, which adds authentication, optional encryption and anti-replay counters to the radio link.
:::

::: context replay Replay attacks
In a **replay attack** the attacker does not forge anything. They record a real message and play it back later. Picture someone recording your garage door opener's signal and replaying it tonight. Modern openers defeat this with "rolling codes" that change every press, and spacecraft links do the same with a counter inside the authenticated data: each accepted command raises the counter, and a command with an old number is refused.
:::
