---
id: l11-endianness-and-serialising-telemetry
title: Endianness and putting telemetry on the wire
minutes: 21
covers:
  - Endianness and serialising telemetry
---

A telemetry downlink carries bytes. Not structs, not `double`s — a sequence of octets whose meaning is fixed by an interface control document that was written before anyone chose a compiler. Your job is to produce exactly those octets from objects in memory, and to reconstruct the objects from octets someone else produced, with no assumption about either side's processor surviving the trip.

Lesson 10 showed why the struct's memory image is the wrong thing to send: its size depends on the ABI, its padding bytes hold whatever was in that stack slot, and packing it trades those problems for misaligned members. This lesson builds the thing that works instead. It is not difficult — a dozen lines of shifts — but every line of it is a decision that has to be made deliberately, and the most common defect in flight-to-ground interfaces is that one side made a different one.

The running example is the 15-byte packet from this module's second exercise: an 8-bit id, a 32-bit millisecond timestamp, 16 bits of flags and a 64-bit value.

## Byte order

A multi-byte integer has to be laid out in memory somehow. **Little-endian** puts the least significant byte at the lowest address; **big-endian** puts the most significant byte there. Neither is better; both are in service.

C++20 lets you ask, at compile time:

```cpp
#include <bit>
if constexpr (std::endian::native == std::endian::little) …
```

::: example What this machine does with four bytes and eight
```cpp
std::uint32_t t_ms = 0x0A0B0C0D;
dump("uint32_t 0x0A0B0C0D:", &t_ms, sizeof t_ms);

double az = -9.81;
dump("double -9.81:", &az, sizeof az);

std::uint64_t bits;
std::memcpy(&bits, &az, sizeof bits);
std::printf("%-26s 0x%016llX\n", "its IEEE-754 pattern:",
            static_cast<unsigned long long>(bits));
```

```text
std::endian::native = little
uint32_t 0x0A0B0C0D:       0D 0C 0B 0A
double -9.81:              1F 85 EB 51 B8 9E 23 C0
its IEEE-754 pattern:      0xC0239EB851EB851F
```

The `uint32_t` whose value is `0x0A0B0C0D` is stored as `0D 0C 0B 0A`: least significant byte first. The `double` is stored the same way — its IEEE-754 bit pattern is `0xC0239EB851EB851F` and the bytes in memory are that pattern reversed. x86-64 is little-endian, and so is the ARM in most phones and most flight computers built in the last fifteen years.

Big-endian is not a museum piece, though. The CCSDS Space Packet Protocol, which is what most space missions speak, specifies most-significant-byte-first for its header fields, and so does every Internet protocol header — "network byte order" means big-endian. SPARC and PowerPC processors, still flying, are big-endian. So a downlink defined by an ICD will typically ask for big-endian fields while your processor is little-endian, and the conversion is not optional.
:::

## Two ways to put a number in a buffer, and only one of them is portable

**With `memcpy`**, you get the host's byte order, whatever that is:

```cpp
std::memcpy(out, &t_ms, 4);      // host order: on this machine, little-endian
```

**With shifts**, you get the order you wrote, and the host's own order never enters into it:

```cpp
void store_u32_le(std::uint8_t* p, std::uint32_t v) {
    for (int i = 0; i < 4; ++i) p[i] = static_cast<std::uint8_t>(v >> (8 * i));
}
void store_u32_be(std::uint8_t* p, std::uint32_t v) {
    for (int i = 0; i < 4; ++i) p[i] = static_cast<std::uint8_t>(v >> (8 * (3 - i)));
}
```

`v >> 8` means "divide by 256" — a statement about the *value*, not about the bytes — so `store_u32_le` produces least-significant-byte-first on a big-endian machine just as it does here. This is the property that matters: the same source produces the same wire bytes everywhere, with no `#ifdef`, no runtime detection and no conversion function that someone might forget to call.

::: example The same number, three ways
```cpp
std::uint32_t t_ms = 168000;               // 0x00029040
store_u32_le(le, t_ms);
store_u32_be(be, t_ms);
std::memcpy(host, &t_ms, 4);               // whatever this machine does
```

```text
shift-built little:      40 90 02 00
shift-built big:         00 02 90 40
memcpy of the object:    40 90 02 00
big-endian bytes read back as little: 168000
big-endian bytes read with a little-endian reader: 1083179520
and read correctly with a big-endian reader: 168000
```

The `memcpy` result coincides with the little-endian result *on this machine*, which is exactly what makes the bug hard to find: a `memcpy`-based serialiser passes every test on the development laptop and produces reversed fields the first time it runs on a big-endian target, or the first time the ground segment decodes it as the ICD says.

The last two lines are what that looks like downstream. Big-endian bytes `00 02 90 40` read by a little-endian reader give $0\mathrm{x}40900200 = 1\,083\,179\,520$ instead of 168,000. Not a crash, not a checksum failure — a timestamp of thirteen days where twenty-eight seconds was meant, which then flows into a rate computation.
:::

## Floating point on the wire

A `double` cannot be shifted, so serialising one is two steps: get its bit pattern into a `std::uint64_t`, then store that with the same shift-based routine.

```cpp
std::uint64_t bits;
std::memcpy(&bits, &p.value, sizeof bits);     // the legal reinterpretation
store_u64_le(out + 7, bits);
```

`memcpy` is the correct and standard way to reinterpret the bytes of one type as another; `*reinterpret_cast<std::uint64_t*>(&p.value)` is undefined behaviour, and lesson 12 explains why and gives the C++20 alternative, `std::bit_cast`. Note that `memcpy` here is doing a completely different job from the `memcpy` rejected above: it is converting a `double` to its bit pattern inside one machine, not deciding a byte order.

Two assumptions are being made, and both should be asserted rather than assumed:

```cpp
static_assert(std::numeric_limits<double>::is_iec559, "needs IEEE-754 binary64");
static_assert(sizeof(double) == 8);
```

On this toolchain `is_iec559` is 1 and `digits` is 53, so `double` is IEEE-754 binary64. The C++ standard does not require that, and a few DSP toolchains genuinely differ — which is precisely why the check belongs in the code, where a port to such a target fails to compile instead of silently downlinking nonsense.

## The whole packet

::: example Fifteen bytes, written and read back
```cpp
constexpr std::size_t kWireSize = 15;

void serialise(const Packet& p, std::uint8_t* out) {
    out[0] = p.id;
    store_u32_le(out + 1, p.t_ms);
    store_u16_le(out + 5, p.flags);
    std::uint64_t bits;
    std::memcpy(&bits, &p.value, sizeof bits);
    store_u64_le(out + 7, bits);
}

Packet deserialise(const std::uint8_t* in) {
    Packet p{};
    p.id    = in[0];
    p.t_ms  = load_u32_le(in + 1);
    p.flags = load_u16_le(in + 5);
    std::uint64_t bits = load_u64_le(in + 7);
    std::memcpy(&p.value, &bits, sizeof p.value);
    return p;
}
```

With `Packet p{7, 168000, 0x0102, -9.81}`:

```text
sizeof(Packet) = 24, wire image = 15 bytes
wire: 07 40 90 02 00 02 01 1F 85 EB 51 B8 9E 23 C0
round trip: id 7  t_ms 168000  flags 0x0102  value -9.81
identical: yes
```

Account for all fifteen bytes. `07` is the id. `40 90 02 00` is 168,000 little-endian, since $168\,000 = \mathrm{0x00029040}$. `02 01` is `0x0102` little-endian. The last eight are the IEEE-754 pattern of $-9.81$, least significant byte first, matching the dump from the first example exactly.

The struct is 24 bytes in memory and 15 on the wire, and no part of the program needs to know both numbers. The serialiser's offsets — 0, 1, 5, 7 — are the protocol's, written once, checkable against the ICD by reading the function. Reordering the struct's members to save padding, as lesson 10 recommends, changes nothing here.

The round-trip test is the one test this code needs, and it should compare *all* fields including the `double` by exact equality: serialisation must be lossless, so `q.value == p.value` is the right assertion, not a tolerance. Add a second test that feeds a hand-written byte array and checks the decoded values, so a change to the serialiser that breaks the format cannot be masked by the matching change to the deserialiser.
:::

## Why not `memcpy` the whole struct

Because the padding bytes are not yours.

::: example The same packet, twice, different bytes
Two `Packet` objects with identical field values: one brace-initialised, one whose members are assigned individually, with a function in between that writes over that region of stack.

```text
braced:    07 [00] [00] [00] 40 90 02 00 02 01 [00] [00] [00] [00] [00] [00] 1F 85 EB 51 B8 9E 23 C0
member:    07 [00] [00] [00] 40 90 02 00 02 01 [0C] [27] [D0] [7F] [00] [00] 1F 85 EB 51 B8 9E 23 C0
```

That is one run. The four bracketed bytes in the second line are different on every run of the same binary, which is itself the finding.

The bracketed bytes are padding. The brace-initialised object had zeros there on this build; the member-assigned one carried `0C 27 D0 7F`, which is the low half of a stack address left behind by the previous call — and which differed on every run, because of address-space randomisation.

So a `memcpy` of the struct produces a 24-byte image whose nine padding bytes are unpredictable. Every checksum over that image differs run to run; two captures of "the same packet" do not compare equal; and, since those bytes are part of a stack address, the downlink is leaking information about the process's memory layout. The standard is explicit that padding has unspecified values and that even brace-initialisation does not guarantee zeros, so the zeros above are not something to rely on either.
:::

::: warning
The symmetric mistake is on the receiving side: `const Packet* p = reinterpret_cast<const Packet*>(buffer);`. It is wrong twice. The buffer is a `std::uint8_t` array whose address need not satisfy `alignof(Packet)`, so the members may be misaligned — undefined behaviour, and a fault on many targets. And reading a `Packet` through a pointer obtained from an array of unrelated type violates the strict aliasing rules, which is lesson 12. Decode field by field into a `Packet` you declared, as `deserialise` does; it costs a few instructions and is correct everywhere.
:::

::: key
Fix the wire format's byte order in the protocol, not in the processor. Build multi-byte fields with shifts, which produce the same bytes on any host; use `memcpy` only to convert a floating-point value to its bit pattern, never to decide byte order and never on a whole struct. Decode field by field into a properly aligned object rather than casting the receive buffer.
:::

## Check yourself

::: check
A ground station decodes a timestamp field as 1,083,179,520 ms where the vehicle sent 168,000 ms. What is wrong, and how would you confirm it from a single captured packet?
:::

::: answer
The two sides disagree about byte order for that field. $168\,000$ is `0x00029040`; $1\,083\,179\,520$ is `0x40900200`, which is the same four bytes reversed. So one end is writing least-significant-byte-first and the other is reading most-significant-byte-first, or the reverse. To confirm from one packet, dump the raw bytes and look at the field: `40 90 02 00` is the little-endian encoding, `00 02 90 40` the big-endian one, and whichever you see tells you which end is deviating from the ICD. The fix is never to "swap it on the ground" — fix whichever side disagrees with the document, because a compensating swap is invisible to the next person and breaks again when a third consumer appears. The structural fix is to have both sides generate their codecs from the same ICD, or at minimum to check in a fixed byte array as a test vector that both sides decode.
:::

::: check
Why is `store_u32_le` correct on a big-endian machine, when it was written and tested on a little-endian one?
:::

::: answer
Because every operation in it is defined on the *value*, not on the storage. `v >> (8 * i)` is a shift of the integer's numeric value — the standard defines it as division by $2^{8i}$ for an unsigned type — and the cast to `std::uint8_t` keeps the low eight bits, which is the byte of numeric significance $256^i$, regardless of where that byte happens to sit in memory. The result is written to `p[i]`, an explicit index into a byte array, so the position in the buffer is chosen by you rather than by the ABI. Nothing in the function ever looks at the object representation of `v`, which is the only place the host's endianness is visible. That is the whole technique: if you never take the address of a multi-byte object during serialisation, byte order cannot leak in.
:::

::: check
The `Packet` is 24 bytes in memory and 15 on the wire. A reviewer asks why you do not simply declare the struct `packed` so both numbers are 15. Give two answers.
:::

::: answer
First, it would not actually solve the problem. A packed struct still stores its multi-byte members in the *host's* byte order, so a `memcpy` of it produces little-endian fields on this machine and big-endian ones on a PowerPC — the wire format would still not be fixed by the protocol. Second, it makes the in-memory type worse for no gain: the members become misaligned, so taking the address of one is a portability defect that g++ warns about by default, dereferencing such a pointer is undefined behaviour that UBSan reports as a misaligned load, and on a target that faults on misaligned access the flight code crashes where the padded version would not. The serialiser costs a handful of instructions per packet and leaves the in-memory type naturally aligned and fast; there is no scenario in which the packed struct is the better trade for a downlink.
:::

::: check
Your serialiser and deserialiser are each other's inverse, and your round-trip test passes. What defect can that test not detect, and what second test catches it?
:::

::: answer
It cannot detect that both of them disagree with the ICD in the same way. If `store_u32_le` were accidentally written as big-endian, `load_u32_le` written to match would decode it perfectly and the round trip would pass while every packet on the downlink was wrong. The same blindness covers a wrong field order, a wrong offset, or a field silently omitted from both sides. The second test is a fixed byte array, written out by hand from the ICD and checked into the repository, that the deserialiser must decode to known values — and the matching direction, a known `Packet` that the serialiser must turn into exactly those bytes. Those are the only tests in this area that can fail when both halves of your code agree with each other and not with the specification.
:::

::: check
The padding bytes in the member-assigned packet contained `0C 27 D0 7F` and changed on every run. Beyond irreproducible captures, why does that matter?
:::

::: answer
Because those bytes were part of a stack address, so `memcpy`-ing the struct to the downlink would transmit information about the process's memory layout — the kind of leak that defeats address-space randomisation and that a security review will flag whether or not the link is encrypted. It also breaks anything that treats the image as a value: a checksum or CRC computed over the 24 bytes differs between two packets carrying identical data, so deduplication, caching and "has this changed" comparisons all behave randomly, and a byte-for-byte comparison of two captures fails for no reason anyone can see. The general rule is that padding bytes are not part of the object's value, so nothing that treats a struct as a sequence of bytes is well defined — which includes `memcpy` to a wire buffer, `memcmp` between two structs, and hashing a struct by its bytes.
:::

## Summary

| Item | Detail |
| --- | --- |
| little-endian | least significant byte at the lowest address; x86-64 and most ARM |
| big-endian | most significant byte first; network byte order, CCSDS headers, SPARC, PowerPC |
| `std::endian::native` | C++20, in `<bit>`; a compile-time answer for the host |
| `memcpy` into a buffer | gives the *host's* order; passes on a little-endian laptop, fails on the target |
| shift-based store | `p[i] = v >> (8*i)` for little-endian, `v >> (8*(3-i))` for big; host-independent |
| floating point | `memcpy` to `std::uint64_t`, then store the bits; assert `is_iec559` |
| the 15-byte packet | `07 40 90 02 00 02 01 1F 85 EB 51 B8 9E 23 C0` for id 7, t 168000 ms, flags 0x0102, value −9.81 |
| padding on the wire | unspecified bytes; different every run; never `memcpy` a whole struct |
| receiving | decode field by field; do not `reinterpret_cast` the buffer to a struct pointer |
| the test | round trip all fields with exact equality, plus a fixed byte array decoded to known values |

Lesson 12 explains the rule that makes `memcpy` the legal reinterpretation and the cast the illegal one — strict aliasing — and then takes up the one qualifier that really does constrain how the compiler touches memory: `volatile`.
