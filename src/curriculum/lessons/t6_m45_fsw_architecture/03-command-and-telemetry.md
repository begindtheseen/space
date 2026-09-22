---
id: l03-command-and-telemetry
title: Command and telemetry
minutes: 19
covers:
  - "Command and telemetry: CCSDS packet structure, dictionaries, limit checking, and command authentication"
---

Every measurement you have ever estimated from in this curriculum, and every actuator command any controller you have written has ever issued, eventually has to leave the flight computer as bytes on a wire, and the software at that boundary has requirements of its own that have nothing to do with estimation or control. Telemetry has to carry enough structure that a ground system built years later, by people who never met the flight software team, can still parse it correctly. Commanding has to resist not only corruption in transit but deliberate forgery, because a wrong command executed with full confidence is often worse than a wrong measurement a filter can downweight. This lesson covers the structure both streams share — the packet format, the dictionaries that give packets meaning, the limit checks applied to telemetry, and the authentication applied to commands.

## Two streams, two different risk profiles

Telemetry flows from vehicle to ground (or to a crew display): a continuous or periodic report of internal state, generated whether or not anyone is watching. Command flows from ground (or crew) to vehicle: a comparatively rare, deliberate instruction that the flight computer is going to act on directly. The asymmetry in consequence drives an asymmetry in how hard each stream works to protect itself. A corrupted telemetry point that fails a sanity check is dropped or flagged — nothing on the vehicle acted on it, so the cost of catching it late is a gap in a ground display. A corrupted, or forged, command that is accepted and executed changes what the vehicle is physically doing. Everything below — the packet format both streams share, and the checks each stream adds on top of it — should be read with that asymmetry in mind.

## CCSDS packets: one structure, decades of interoperability

Spacecraft telemetry and command have used a common packet structure since the Consultative Committee for Space Data Systems standardized the Space Packet Protocol, precisely so that ground systems, relay satellites, and flight computers built by different organizations, in different decades, can still exchange data without each side needing to know anything bespoke about the other. You will meet CCSDS-structured packets on essentially any mission whose documentation you read, so the fields are worth knowing at the bit level, not only by name.

A CCSDS space packet opens with a six-byte **primary header**, three 16-bit words:

- **Word 0**: a 3-bit version number, a 1-bit type flag (telemetry or command), a 1-bit secondary-header flag, and an 11-bit application process identifier (APID) — the field that says which onboard application generated (or should receive) this packet, the closest thing this protocol has to an address.
- **Word 1**: a 2-bit sequence-flags field (whether this packet is a stand-alone unit, or the first, middle, or last segment of one that was split across several packets) and a 14-bit sequence count, incremented on every packet from a given APID and wrapping at 16384 — the field lesson 4 uses to detect a dropped packet.
- **Word 2**: a 16-bit packet data length, defined by the standard as the number of bytes in the data field *minus one*, a one-off convention that exists so a data field of the maximum representable size can still be expressed in 16 bits.

Everything after the primary header — an optional secondary header (commonly a timestamp) followed by the packet's actual payload — is specific to the APID and defined by that application's own dictionary, the subject of the next section.

::: key
A CCSDS primary header is six bytes: version (3 bits), type (1 bit), secondary-header flag (1 bit), APID (11 bits); sequence flags (2 bits) and sequence count (14 bits, wraps at 16384); packet data length (16 bits, the byte count of the data field minus one).
:::

::: warning
The packet data length field is the data field's byte count *minus one*, not the byte count itself. Code that forgets the offset either allocates one byte short of every packet it parses or reports every packet as one byte longer than it is — an error that a fixed-size test packet can hide for a long time, because it only ever shows up as an off-by-one at a boundary nobody happened to test.
:::

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
Six bytes carry an APID, a sequence count, and a data length, and nothing about parsing them depends on which mission or which ground system wrote the code that produced them — the entire point of standardizing this structure once. Note the "minus one" convention live in the arithmetic: an 18-byte data field is encoded as `17`, and any code that forgets to add the one back on will consistently misjudge every packet's length by a single byte.
:::

## Dictionaries: the shared meaning behind an APID

A packet's bytes carry no meaning on their own; the APID and, within the payload, each field's position, only mean something against a **dictionary** — a table, shared by the flight software and the ground system, that maps each APID (for telemetry) or command mnemonic (for command) to its structure: field names, byte offsets, data types, engineering-unit scale factors, and, for telemetry, the limits the next section covers. This is the same idea as lesson 1's device-manager interface, one layer up: in the same way that a device manager turns raw bus bytes into a named, typed quantity for the GNC application, a telemetry dictionary turns a raw APID and byte offset into a named, typed quantity for a ground display or an onboard limit checker, and a command dictionary turns a named command into the exact byte layout the flight computer expects.

The dictionary is not optional documentation sitting beside the code; on a well-run program it *is* the source the flight software's packet-handling code and the ground system's decommutation tables are both generated from, so the two sides cannot silently drift apart — a mismatch between what the flight computer believes it is sending and what the ground believes it is receiving is exactly the kind of latent bug that a shared, single-source dictionary is built to make impossible. Because a dictionary is itself a versioned artifact that changes across a program's life — a new sensor adds a mnemonic, a calibration update changes a scale factor — it belongs under the same configuration management discipline lesson 12 covers for gains and tables, tracked and reviewed independently of the executable that reads it.

## Limit checking

Every telemetry point a dictionary describes commonly carries four thresholds: a red-low, a yellow-low, a yellow-high, and a red-high limit. A value between the two yellow limits is nominal; between a yellow and the corresponding red limit it is a caution; at or beyond a red limit it is an alarm. This four-level scheme, evaluated automatically against the dictionary's own limits, is what lets a ground controller — or an onboard monitor — scan thousands of telemetry points without reading every one, because attention is drawn only to the ones outside their green band.

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
Nothing in `limit_status` knows what a battery or a propellant line is; it reads whatever thresholds the dictionary entry supplies. Add a mnemonic to the dictionary and the same function checks it, with no new code — which is exactly the reuse argument lesson 1 made about layering, applied here to telemetry.
:::

A single-sample check like this one is deliberately the naive version: a value that crosses into yellow for one noisy sample and immediately returns to green should usually not page an operator at two in the morning, and lesson 9 builds the persistence and hysteresis logic that turns this raw classification into something that reports a real trend rather than every momentary blip.

## Command authentication

Everything so far in this lesson applies symmetrically to telemetry and command, but command carries one requirement telemetry does not: proof that the command actually originated from an authorized source and was not altered in transit by anyone else, including someone who knows the packet format perfectly well. That proof is **authentication**, and it is a different property from the integrity checks — a CRC or checksum — that lesson 4 covers, in a way that is worth making precise now rather than leaving implicit.

A CRC is a public, keyless algorithm: its definition is in a standard anyone can read, and computing one requires no secret. That makes a CRC excellent at catching *accidental* corruption — a bit flipped by noise on the line — because an accidental error has no way to also produce a matching CRC for the corrupted bytes. But an adversary who can alter a command in transit can recompute a fresh, correct CRC over the altered bytes with equal ease, because nothing about computing a CRC required knowledge the adversary lacks. A CRC alone provides no defense against a deliberate change.

Authentication requires a secret the sender and the flight computer share (or, in an asymmetric scheme, a private signing key only the authorized sender holds) folded into the check, most commonly as an HMAC — a keyed hash — appended to the command. Recomputing a *matching* tag for an altered command now requires the secret, which an attacker who can merely observe or intercept traffic does not have.

::: example A CRC does not stop tampering; an HMAC does
```python
import zlib, hmac, hashlib

cmd = b"CMD:MECO_INHIBIT_CLEAR:ARM=1"
tampered = b"CMD:MECO_INHIBIT_CLEAR:ARM=0"

crc_tampered_recomputed = zlib.crc32(tampered)
print(f"CRC-32 of original:  {zlib.crc32(cmd):#010x}")
print(f"CRC-32 of tampered, recomputed by whoever tampered it: {crc_tampered_recomputed:#010x}")
# both are internally "correct" CRCs -- a CRC check alone accepts the tampered command

key = b"ground-segment-shared-key-do-not-reuse"
tag_original = hmac.new(key, cmd, hashlib.sha256).hexdigest()
forged_ok = hmac.compare_digest(hmac.new(key, tampered, hashlib.sha256).hexdigest(), tag_original)
print(f"does the tampered command verify against the original's HMAC tag? {forged_ok}")
# does the tampered command verify against the original's HMAC tag? False
```
The tampered command arrives with its own perfectly valid CRC, because computing a CRC needs nothing the tamperer lacks; a receiver checking only the CRC accepts it. The HMAC tag, computed with a key the tamperer does not have, cannot be reproduced for the altered bytes, so the same tampering that slipped past the CRC is rejected outright by the authentication check.
:::

A command dictionary, a set of authenticated commanders, and a record of which command mnemonics require which authorization level are, like the telemetry dictionary, versioned artifacts under configuration management — and, on the more consequential end of the command set, are exactly the kind of software boundary the abort logic of lesson 10 depends on being unforgeable.

## Check yourself

::: check
A ground engineer reads a raw CCSDS primary header and finds the third 16-bit word equal to `0x004F`. How many bytes long is the packet's data field?
:::

::: answer
`0x004F` is 79 in decimal, and the field is defined as the data length minus one, so the data field is `79 + 1 = 80` bytes long. The total packet, including the six-byte primary header, is 86 bytes.
:::

::: check
Two ground tools decommutate the same telemetry stream and disagree about the engineering-unit value of one mnemonic, even though both parsed the identical raw bytes correctly. What is the most likely explanation given this lesson, and what process failure does it point to?
:::

::: answer
The two tools are almost certainly using different versions of the telemetry dictionary — a different scale factor, offset, or limit set for that mnemonic — even though the raw bytes and the packet structure itself are identical and correctly parsed by both. This points to a configuration-management failure: the dictionary was not tracked as a single, versioned source that both tools were built from, and it drifted. The fix is the same one lesson 12 gives for gains and tables generally — one authoritative, versioned dictionary that every consumer, onboard and on the ground, is built or configured from.
:::

::: check
Why does a single-sample limit check of the kind built in this lesson's example risk generating false alarms in practice, and which later lesson addresses it directly?
:::

::: answer
Ordinary measurement noise can push a value across a yellow or red threshold for one sample and back within tolerance the next, with nothing actually wrong; a limit checker that reports every single-sample crossing as an alarm will report noise as frequently as it reports real trends, which trains an operator to discount the alarm rather than to trust it. Lesson 9 builds persistence counters and hysteresis specifically to require a sustained exceedance, rather than a single sample, before a condition is declared and reported.
:::

::: check
Explain, in one sentence each, why a CRC is the wrong tool to stop a deliberately forged command, and why an HMAC is the right one.
:::

::: answer
A CRC is a public, keyless algorithm, so anyone able to alter a command's bytes can recompute a matching CRC over the altered bytes and the check will pass; an HMAC folds in a secret key the forger does not have, so a matching tag cannot be recomputed for altered bytes without that key, and the check correctly fails.
:::

::: check
A new payload team wants to add ten new telemetry mnemonics partway through integration and testing. Under the structure this lesson describes, what has to happen before the flight software or the ground system can correctly display any of them?
:::

::: answer
The ten mnemonics have to be added to the shared telemetry dictionary first — with their APID, byte offsets, types, units, and limits defined — because neither the flight software's packet-handling code nor the ground system's decommutation tables have any way to interpret a byte range they have no dictionary entry for. If the flight software and ground system generate their tables from that one shared dictionary, adding the entries there and rebuilding both sides is the entire integration step; if the two sides maintain their own separate copies, this is exactly the drift risk the earlier check-and-answer pair described.
:::

## Summary

| Term | Meaning |
| --- | --- |
| CCSDS primary header | 6 bytes: version, type, secondary-header flag, 11-bit APID, sequence flags, 14-bit sequence count, 16-bit data length minus one |
| APID | Application process ID; identifies the onboard app that produced or should receive a packet |
| Dictionary | The shared, versioned table mapping an APID or command mnemonic to its structure, units, and limits |
| Limit status | Nominal / caution / alarm from a value against its dictionary's yellow and red thresholds |
| Integrity (CRC/checksum) | Catches accidental corruption; computed with no secret, so it cannot stop deliberate tampering |
| Authentication (HMAC) | Requires a shared secret; a forged command cannot reproduce a valid tag without it |

The next lesson stays with the correctness of a single input — sequence counts, staleness, and the CRCs this lesson set aside for lesson 4 to cover in full — before the module turns, in lesson 5, to what happens when more than one redundant source of the same quantity has to be reconciled into one answer.
