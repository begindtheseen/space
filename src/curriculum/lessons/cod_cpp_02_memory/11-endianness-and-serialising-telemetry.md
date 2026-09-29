---
id: l11-endianness-and-serialising-telemetry
title: Endianness and putting telemetry on the wire
minutes: 25
covers:
  - Endianness and serializing telemetry
---

When you write the number one thousand two hundred thirty-four, you write `1234`: the thousands first, the ones last. Nobody taught you that as a rule, but everyone who reads your number relies on it. Now imagine a friend who writes the same number ones-first: `4321`. Both of you are consistent. Both of you are right. And every number you pass to each other comes out wrong.

Computers have exactly this disagreement. A number bigger than one byte has to be stored as several bytes, and the question is which byte goes first. Some processors put the big end first; some put the little end first. Inside one machine it never matters, because the machine always agrees with itself. The moment bytes leave the machine — down a radio link, across a data bus, into a file — it matters a great deal.

A telemetry downlink carries bytes. Not structs, not `double`s: a sequence of **[[octets|octet]]**, 8-bit bytes, whose meaning is fixed by an **[[interface control document|icd]]** (ICD) written before anyone chose a compiler. Your job is to produce exactly those bytes from objects in memory, and to rebuild the objects from bytes someone else produced, with no assumption about either side's processor surviving the trip.

Lesson 10 showed why the struct's memory image is the wrong thing to send: its size depends on the ABI, its padding bytes hold leftovers, and packing it swaps those problems for misaligned members. This lesson builds what works instead. It is not hard — a dozen lines of shifts — but every line is a decision, and the most common defect in flight-to-ground interfaces is that one side decided differently.

The running example is the 15-byte packet from this module's second exercise: an 8-bit id, a 32-bit millisecond timestamp, 16 bits of flags and a 64-bit floating-point value.

## Byte order

The order in which a multi-byte number's bytes sit in memory is called its **byte order**, or **[[endianness|endian-name]]**.

- **Little-endian** puts the least significant byte — the "ones" end — at the lowest address.
- **Big-endian** puts the most significant byte there, the way you write `1234`.

Neither is better. Both are in service today.

C++20 lets you ask which one your machine uses, while the program compiles. `std::endian::native` comes from the header `<bit>`, and `if constexpr` picks a branch at compile time:

```cpp
#include <bit>
if constexpr (std::endian::native == std::endian::little) …
```

::: example What this machine does with four bytes and eight
A small `dump` helper prints the bytes of any object in address order, as two-digit hex numbers. (`0x` in front of a number means hexadecimal, base 16; two hex digits make one byte.)

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

Read it one line at a time. The number `0x0A0B0C0D` has `0A` as its most significant byte and `0D` as its least. In memory the **[[bytes come out|byte-order-picture]]** `0D 0C 0B 0A`: least significant first. So this machine is little-endian.

The `double` is stored the same way. Its **[[IEEE-754|ieee-754]]** bit pattern — the standard way a computer encodes a floating-point number — is `0xC0239EB851EB851F`. Read the memory bytes from right to left and you get that pattern back: `C0 23 9E B8 51 EB 85 1F`.

x86-64 is little-endian. So are the ARM chips in phones and in many newer flight computers. Big-endian is no museum piece, though. The **[[CCSDS|ccsds]]** Space Packet Protocol, which most space missions speak, sends its header fields most significant byte first. So does every Internet protocol header — "network byte order" means big-endian. And two families of processors still flying on spacecraft, PowerPC (the RAD750) and SPARC (the LEON), are big-endian. So a downlink defined by an ICD will often ask for big-endian fields while your processor is little-endian, and the conversion is not optional.
:::

::: key
Little-endian: least significant byte at the lowest address (x86-64, most ARM). Big-endian: most significant byte first (network byte order, CCSDS headers, PowerPC, SPARC). `std::endian::native`, from `<bit>` in C++20, answers at compile time which one the host uses.
:::

## Two ways to put a number in a buffer, and only one is portable

**With `memcpy`**, you copy the object's bytes as they sit in memory. You get the host's byte order, whatever that is:

```cpp
std::memcpy(out, &t_ms, 4);      // host order: on this machine, little-endian
```

**With shifts**, you pick each byte out of the number's value yourself, and the host's order never enters into it. `v >> 8`, read "v shifted right by 8", moves the value's bits 8 places toward the low end — for an unsigned number that is the same as dividing by 256 and dropping the remainder. Casting the result to `std::uint8_t` keeps only the lowest 8 bits, which is one byte of the value:

```cpp
void store_u32_le(std::uint8_t* p, std::uint32_t v) {
    for (int i = 0; i < 4; ++i) p[i] = static_cast<std::uint8_t>(v >> (8 * i));
}
void store_u32_be(std::uint8_t* p, std::uint32_t v) {
    for (int i = 0; i < 4; ++i) p[i] = static_cast<std::uint8_t>(v >> (8 * (3 - i)));
}
```

Walk through `store_u32_le`. When `i` is 0, it shifts by 0 and stores the lowest byte in `p[0]`. When `i` is 1, it shifts by 8 and stores the next byte in `p[1]`. Then 16, then 24. The **[[shift|shift-picture]]** is a statement about the number's *value*, not about where its bytes happen to sit in memory. So `store_u32_le` writes least significant byte first on a big-endian machine exactly as it does here. `store_u32_be` counts down instead of up, so the most significant byte lands in `p[0]`.

That is the property that matters: the same source produces the same wire bytes on every host. No `#ifdef`, no runtime check, no conversion function someone might forget to call.

Reading back works the same way in reverse. `<<`, read "shift left", moves bits toward the high end, and `|=`, read "or-equals", merges them in:

```cpp
std::uint32_t load_u32_le(const std::uint8_t* p) {
    std::uint32_t v = 0;
    for (int i = 0; i < 4; ++i) v |= std::uint32_t{p[i]} << (8 * i);
    return v;
}
```

::: example The same number, three ways
Take the timestamp 168,000 ms. In hex that is `0x00029040`.

```cpp
std::uint32_t t_ms = 168000;               // 0x00029040
store_u32_le(le, t_ms);
store_u32_be(be, t_ms);
std::memcpy(host, &t_ms, 4);               // whatever this machine does
```

```text
shift-built little:        40 90 02 00
shift-built big:           00 02 90 40
memcpy of the object:      40 90 02 00
big-endian bytes read with a little-endian reader: 1083179520
and read correctly with a big-endian reader: 168000
```

The little-endian bytes are `40 90 02 00`: the low byte `40` first. The big-endian bytes are the same four in the opposite order.

The `memcpy` result matches the little-endian result *on this machine*. That is exactly what makes the bug hard to find. A `memcpy`-based serializer passes every test on a development laptop. Then it produces reversed fields the first time it runs on a big-endian processor, or the first time the ground segment decodes it the way the ICD says.

The last two lines show what that looks like downstream. The big-endian bytes `00 02 90 40`, read by a little-endian reader, become `0x40900200`, which is 1,083,179,520. As milliseconds, that is

$$
\frac{1\,083\,179\,520\ \mathrm{ms}}{1000 \times 86\,400\ \mathrm{s/day}} \approx 12.5\ \text{days},
$$

where 2 minutes 48 seconds (168 s) was meant. Not a crash, not a checksum failure: a plausible-looking wrong number that then flows into a rate computation. Sanity check: the wrong value is about 6,400 times the right one, so no filter that only rejects negative or zero times would ever catch it.
:::

## Floating point on the wire

You cannot shift a `double`; `>>` only works on integers. So serializing one takes two steps. First copy its bit pattern into a `std::uint64_t`, an integer of the same size. Then store that integer with the same shift-based routine.

```cpp
std::uint64_t bits;
std::memcpy(&bits, &p.value, sizeof bits);     // the legal reinterpretation
store_u64_le(out + 7, bits);
```

`memcpy` is the correct, standard way to reinterpret the bytes of one type as another. The shortcut `*reinterpret_cast<std::uint64_t*>(&p.value)` is undefined behavior; lesson 12 explains why and gives the C++20 alternative, `std::bit_cast`.

Notice that this `memcpy` does a completely different job from the one rejected above. Here it turns a `double` into its bit pattern inside one machine — an integer holding the same bits. It does not decide a byte order; the shifts after it do that.

Two assumptions hide in this code. Both should be checked by the compiler, not trusted:

```cpp
static_assert(std::numeric_limits<double>::is_iec559, "needs IEEE-754 binary64");
static_assert(sizeof(double) == 8);
```

On this toolchain `is_iec559` is true (IEC 559 is the international name for IEEE 754) and a `double` has 53 bits of precision: it is IEEE-754 binary64. The C++ standard does not require that, and a few DSP toolchains really do differ. That is exactly why the check belongs in the code. A port to such a target then fails to compile, instead of quietly sending nonsense to the ground.

::: key
Fix the wire format's byte order in the protocol, not in the processor. Build multi-byte fields with shifts, which produce the same bytes on any host; use `memcpy` only to convert a floating-point value to its bit pattern, never to decide byte order and never on a whole struct.
:::

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

`out + 1` means "the address one byte past `out`", so each field is written at its own offset in the buffer. `store_u16_le` and `store_u64_le` are `store_u32_le` with loops of 2 and 8. Run it with `Packet p{7, 168000, 0x0102, -9.81}`:

```text
sizeof(Packet) = 24, wire image = 15 bytes
wire:                      07 40 90 02 00 02 01 1F 85 EB 51 B8 9E 23 C0
round trip: id 7  t_ms 168000  flags 0x0102  value -9.81
identical: yes
```

Account for all fifteen bytes.

- Byte 0, `07`, is the id.
- Bytes 1 to 4, `40 90 02 00`, are 168,000 little-endian, since $168\,000 = \mathrm{0x00029040}$.
- Bytes 5 and 6, `02 01`, are the flags `0x0102`, low byte first.
- Bytes 7 to 14 are the IEEE-754 pattern of $-9.81$, least significant byte first — the same eight bytes as the memory dump in the first example.

That is $1 + 4 + 2 + 8 = 15$ bytes, as the protocol wants. The struct is 24 bytes in memory and 15 on the wire, and no part of the program needs to know both numbers. The serializer's offsets — 0, 1, 5, 7 — belong to the protocol. They are written once, and anyone can check them against the ICD by reading the function. Reordering the struct's members to save padding, as lesson 10 recommends, changes nothing here.

The round-trip test compares *every* field, including the `double`, by exact equality. Serialization must lose nothing, so `q.value == p.value` is the right check, not "close enough".
:::

::: warning
A round trip alone is not enough. Add a second test that decodes a **[[fixed byte array|test-vector]]** written by hand from the ICD and checks the values, and one that serializes a known packet and compares against those bytes. Otherwise a change that breaks the format in the serializer can be hidden by a matching change in the deserializer.
:::

## Why not `memcpy` the whole struct

Because the padding bytes are not yours.

::: example The same packet, different bytes
One program makes two `Packet` objects with identical field values. The first is brace-initialized in `main`. The second lives in another function and gets its members assigned one at a time, after an unrelated function has written pointers over that part of the stack. Each is copied to a byte array with `memcpy` and printed, with the padding bytes in square brackets. The program was built with g++ 13.3.0 at `-O0` and run twice:

```text
braced:  07 [00] [00] [00] 40 90 02 00 02 01 [C6] [46] [A0] [7F] [00] [00] 1F 85 EB 51 B8 9E 23 C0
member:  07 [AE] [76] [9D] 40 90 02 00 02 01 [76] [9D] [FE] [7F] [00] [00] 1F 85 EB 51 B8 9E 23 C0

braced:  07 [00] [00] [00] 40 90 02 00 02 01 [5D] [60] [4F] [7F] [00] [00] 1F 85 EB 51 B8 9E 23 C0
member:  07 [B9] [6B] [AD] 40 90 02 00 02 01 [6B] [AD] [FE] [7F] [00] [00] 1F 85 EB 51 B8 9E 23 C0
```

The unbracketed bytes are the fields, and they match the struct layout from lesson 10: `id` at 0, `t_ms` at 4, `flags` at 8, `value` at 16. They are identical in all four lines.

The bracketed bytes are padding, and they are a mess. Even the brace-initialized object carries leftovers in its second padding gap. The member-assigned one has leftovers in both. The run of bytes ending `FE 7F 00 00` is the upper six bytes of a stack address on this machine, left behind by the earlier function. And the values change on every run of the same program, because **[[the operating system moves the stack|aslr]]** to a random place each time.

So a `memcpy` of the struct makes a 24-byte image whose 9 padding bytes are unpredictable. Every checksum over that image differs from run to run. Two captures of "the same packet" do not compare equal. And because those bytes include part of a stack address, the downlink is leaking information about the program's memory layout. The C++ standard says padding has unspecified values, and brace-initialization does not promise zeros — as the first line of each run shows.
:::

::: warning
The mirror-image mistake is on the receiving side: `const Packet* p = reinterpret_cast<const Packet*>(buffer);`. It is wrong twice. The buffer is a `std::uint8_t` array, whose address need not be a multiple of `alignof(Packet)`, so the members may be misaligned — undefined behavior, and a trap on many processors. And reading a `Packet` through a pointer made from an array of another type breaks the strict aliasing rule, which is lesson 12. Decode field by field into a `Packet` you declared, as `deserialise` does. It costs a few instructions and is correct everywhere.
:::

::: key
Decode field by field into a properly aligned object rather than casting the receive buffer. Padding bytes are not part of an object's value, so never `memcpy`, `memcmp` or hash a whole struct as if its bytes were its meaning.
:::

## Check yourself

::: check
A ground station decodes a timestamp field as 1,083,179,520 ms where the vehicle sent 168,000 ms. What is wrong, and how would you confirm it from a single captured packet?
:::

::: answer
The two sides disagree about byte order for that field. 168,000 is `0x00029040`, and 1,083,179,520 is `0x40900200` — the same four bytes in reverse order. So one end writes least significant byte first and the other reads most significant byte first, or the other way round.

To confirm from one packet, dump the raw bytes and look at that field. `40 90 02 00` is the little-endian encoding; `00 02 90 40` is the big-endian one. Whichever you see tells you which end is departing from the ICD.

The fix is never to "swap it on the ground". Fix whichever side disagrees with the document. A compensating swap is invisible to the next person and breaks again when a third program starts reading the data. The lasting fix is to generate both sides' code from the same ICD, or at least to check in a fixed byte array as a test vector that both sides must decode.
:::

::: check
Why is `store_u32_le` correct on a big-endian machine, when it was written and tested on a little-endian one?
:::

::: answer
Because every operation in it works on the *value*, not on the storage. `v >> (8 * i)` shifts the number's value; for an unsigned type the standard defines it as dividing by $2^{8i}$ and dropping the remainder. The cast to `std::uint8_t` keeps the low eight bits, which is the byte worth $256^i$, wherever that byte happens to sit in memory. The result goes into `p[i]`, an explicit position in a byte array, so you choose the position, not the ABI.

Nothing in the function ever looks at how `v` is stored in memory, which is the only place the host's byte order shows. That is the whole technique: if you never take the address of a multi-byte number while serializing, byte order cannot leak in.
:::

::: check
The `Packet` is 24 bytes in memory and 15 on the wire. A reviewer asks why you do not declare the struct `packed` so both numbers are 15. Give two answers.
:::

::: answer
First, it would not solve the problem. A packed struct still stores its multi-byte members in the *host's* byte order. A `memcpy` of it gives little-endian fields on this machine and big-endian ones on a PowerPC, so the wire format would still not be fixed by the protocol.

Second, it makes the in-memory type worse for no gain. The members become misaligned. Taking the address of one is a portability defect that g++ warns about by default. Reading through such a pointer is undefined behavior that UBSan reports as a misaligned load. And on a processor that traps on misaligned access, the flight code crashes where the padded version would not.

The serializer costs a handful of instructions per packet and keeps the in-memory type naturally aligned and fast. For a downlink, the packed struct is never the better trade.
:::

::: check
Your serializer and deserializer are each other's inverse, and your round-trip test passes. What defect can that test not detect, and what second test catches it?
:::

::: answer
It cannot detect that both of them disagree with the ICD *in the same way*. If `store_u32_le` were accidentally written big-endian, a `load_u32_le` written to match would decode it perfectly. The round trip would pass while every packet on the downlink was wrong. The same blindness covers a wrong field order, a wrong offset, or a field left out of both sides.

The second test is a fixed byte array, written out by hand from the ICD and checked into the repository, that the deserializer must decode to known values. Pair it with the other direction: a known `Packet` that the serializer must turn into exactly those bytes. Those are the only tests here that can fail when both halves of your code agree with each other but not with the specification.
:::

::: check
In the padding example, the member-assigned packet's padding held bytes that ended in `FE 7F 00 00` and changed on every run. Apart from captures that do not compare equal, why does that matter?
:::

::: answer
Because those bytes are part of a stack address. Sending the struct's memory image down the link would transmit information about where the program's stack lives — the kind of leak that undoes address randomization, and one a security review will flag whether or not the link is encrypted.

It also breaks anything that treats the image as a value. A checksum or CRC over the 24 bytes differs between two packets carrying identical data, so removing duplicates, caching and "has this changed?" checks all behave randomly. A byte-for-byte comparison of two captures fails for no reason anyone can see.

The general rule: padding bytes are not part of the object's value. So nothing that treats a struct as a plain sequence of bytes is well defined — `memcpy` to a wire buffer, `memcmp` between two structs, or hashing a struct by its bytes.
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
| the tests | round trip all fields with exact equality, plus a fixed byte array decoded to known values |

Lesson 12 explains the rule that makes `memcpy` the legal reinterpretation and the pointer cast the illegal one — strict aliasing — and then takes up the one qualifier that really does control how the compiler touches memory: `volatile`.

::: context octet Why protocols say octet
In everyday C++ a byte is 8 bits, and `std::uint8_t` is exactly 8 bits. But the C++ standard only promises that a byte is *at least* 8 bits, and some old machines and some digital signal processors use bytes of 16 or 32 bits.

Protocol documents avoid the question by saying **octet**, from the Latin for eight: a group of exactly 8 bits, whatever the machine calls a byte. When an ICD says "a 4-octet field", it means 32 bits on the wire, no matter what processor reads it.
:::

::: context icd The document both sides obey
An **interface control document** (ICD) is the written contract between two systems that must talk: the vehicle and the ground, or two boxes on the same bus. For a telemetry packet it lists every field's position, size, byte order, units and scaling.

On a real program, the flight team and the ground team usually work in different buildings, often at different companies, and meet only through this document. When the two disagree, the ICD wins by definition — which is why the fix for a byte-order mismatch is always to make the wrong side match the ICD.
:::

::: context endian-name A name from Gulliver's Travels
In Jonathan Swift's 1726 satire *Gulliver's Travels*, two nations go to war over which end of a boiled egg to crack first: the Big-Endians and the Little-Endians. The point of the joke is that the choice does not matter, but people fight over it anyway.

Computer scientist Danny Cohen borrowed the names in a 1980 note about the same kind of dispute over byte order, titled "On Holy Wars and a Plea for Peace". The words stuck, and so did the moral: pick one, write it down, and make both sides follow it.
:::

::: context byte-order-picture The same number, two orders
The number `0x0A0B0C0D` stored at addresses 100 to 103. Little-endian puts the small end, `0D`, at the lowest address; big-endian puts the big end, `0A`, there. The number's value is the same either way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="145" y="18">100</text><text x="195" y="18">101</text><text x="245" y="18">102</text><text x="295" y="18">103</text>
  </g>
  <text x="20" y="48" font-size="12" fill="#1f2a44">little</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="120" y="28" width="50" height="30" fill="#8fb8f0"/><rect x="170" y="28" width="50" height="30" fill="#fff"/>
    <rect x="220" y="28" width="50" height="30" fill="#fff"/><rect x="270" y="28" width="50" height="30" fill="#f2b880"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="145" y="48">0D</text><text x="195" y="48">0C</text><text x="245" y="48">0B</text><text x="295" y="48">0A</text>
  </g>
  <text x="20" y="92" font-size="12" fill="#1f2a44">big</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="120" y="72" width="50" height="30" fill="#f2b880"/><rect x="170" y="72" width="50" height="30" fill="#fff"/>
    <rect x="220" y="72" width="50" height="30" fill="#fff"/><rect x="270" y="72" width="50" height="30" fill="#8fb8f0"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="145" y="92">0A</text><text x="195" y="92">0B</text><text x="245" y="92">0C</text><text x="295" y="92">0D</text>
  </g>
  <text x="180" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">blue: least significant byte · orange: most significant</text>
</svg>
```
:::

::: context ieee-754 Inside a double
IEEE 754 is the standard, first published in 1985, that almost every processor uses for floating-point numbers. A `double` is 64 bits split into three fields: 1 sign bit, 11 exponent bits and 52 fraction bits. The value is roughly $(-1)^{\text{sign}} \times 1.\text{fraction} \times 2^{\text{exponent} - 1023}$.

For $-9.81$ the pattern is `0xC0239EB851EB851F`. The sign bit is 1, so negative. The exponent field is `0x402` = 1026, so the power is $2^{3} = 8$, and $9.81 / 8 \approx 1.226$ is the part the fraction encodes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 90" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="24" width="10" height="30" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="30" y="24" width="55" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="85" y="24" width="260" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="25" y="16" font-size="11" text-anchor="middle" fill="#1f2a44">sign</text>
  <text x="57" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">exp 11</text>
  <text x="215" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">fraction, 52 bits</text>
  <text x="20" y="72" font-size="11" fill="#6c7a93">bit 63</text>
  <text x="345" y="72" font-size="11" text-anchor="end" fill="#6c7a93">bit 0</text>
</svg>
```
:::

::: context ccsds The standard most spacecraft speak
**CCSDS**, the Consultative Committee for Space Data Systems, is a group founded in 1982 by the world's space agencies, including NASA and ESA. It publishes standards so that one agency's ground station can talk to another agency's spacecraft.

Its Space Packet Protocol defines a 6-octet primary header — packet type, application ID, sequence count, length — sent most significant bit and byte first. Your mission's own data goes in the packet after that header, laid out by your ICD. A later module on command and telemetry comes back to CCSDS packet structure in detail.
:::

::: context shift-picture Shifting picks out one byte
To get byte 1 of `0x00029040`, shift right by 8 and keep the low 8 bits. The value's bytes slide one place toward the low end, the lowest byte falls off, and the byte you want is now at the bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="40" font-size="12" fill="#1f2a44">v</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="120" y="22" width="50" height="28"/><rect x="170" y="22" width="50" height="28"/>
    <rect x="220" y="22" width="50" height="28" fill="#8fb8f0"/><rect x="270" y="22" width="50" height="28"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="145" y="41">00</text><text x="195" y="41">02</text><text x="245" y="41">90</text><text x="295" y="41">40</text>
  </g>
  <text x="20" y="84" font-size="12" fill="#1f2a44">v &gt;&gt; 8</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="120" y="66" width="50" height="28"/><rect x="170" y="66" width="50" height="28"/>
    <rect x="220" y="66" width="50" height="28"/><rect x="270" y="66" width="50" height="28" fill="#8fb8f0"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="145" y="85">00</text><text x="195" y="85">00</text><text x="245" y="85">02</text><text x="295" y="85">90</text>
  </g>
  <text x="330" y="41" font-size="11" fill="#6c7a93">low</text>
  <text x="180" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">cast to uint8_t keeps the low byte: 0x90</text>
</svg>
```

The boxes show the value, most significant on the left, the way you write numbers — not memory. That is the point: shifts never look at memory.
:::

::: context test-vector Golden bytes
A **test vector** is a fixed input with a known correct output, written down once and checked into the code. For a codec it is a short byte array, copied by hand from the ICD's worked example or computed independently, together with the field values it must decode to.

Because it comes from the specification rather than from your code, it can disagree with your code — which is its whole job. Flight and ground teams often share the same vectors, so both sides are tested against one truth.
:::

::: context aslr Why the stack moves every run
**Address space layout randomization** (ASLR) makes the operating system place the stack, the heap and the program itself at random addresses each time a program starts. Lesson 01 saw it make printed addresses change between runs.

It exists to make attacks harder: many exploits need to know where something is in memory. That is also why leaking a stack address in a telemetry packet matters — it hands out exactly the information ASLR is trying to hide.
:::
