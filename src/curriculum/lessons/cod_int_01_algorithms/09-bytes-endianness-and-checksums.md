---
id: l09-bytes-endianness-and-checksums
title: Bytes, endianness and checksums
minutes: 24
covers:
  - struct, endianness and checksums in Python; bit twiddling in C++
---

Write the date 03/04 on a note and hand it to two friends. One reads it as March 4th. The other, who grew up in Europe, reads it as the 3rd of April. The digits are identical. What differs is an agreement about *which part comes first*. Neither friend is wrong; they just follow different conventions, and if nobody says which one the note uses, someone misses a meeting.

Computers have this exact problem. A number like 1000 does not fit in one byte, so it is stored as several bytes in a row — and machines and protocols disagree about which byte comes first. Spacecraft telemetry reaches the ground as a long string of raw bytes. To turn them back into a channel number, a timestamp and a temperature, you must know each field's width, type and byte order, and check that nothing was damaged on the way down.

This lesson builds those pieces: bytes and hexadecimal, byte order, Python's `struct` module, checksums, and the same work done by hand in C++ with shifts and masks. Lesson 10 then assembles them into a full telemetry decoder.

## Bits, bytes and hex

A **bit** is a single 0 or 1. A **byte** is 8 bits, so it can hold $2^8 = 256$ different patterns: the whole numbers 0 to 255.

Writing bytes in binary is long (`10100101`), and in decimal it hides the bit pattern (165). Engineers use **[[hexadecimal|hex-nibbles]]** instead: base 16, with digits 0 to 9 and then A to F for 10 to 15. One hex digit stands for exactly 4 bits, so every byte is exactly two hex digits. The prefix `0x` means "this number is hex". So `0xA5` is $10 \times 16 + 5 = 165$, which is `1010 0101` in binary: `A` is `1010` and `5` is `0101`.

In Python, a `bytes` object is an unchangeable list of byte values. Indexing it gives a plain integer:

```python
# int01_l09_bytes.py -- bytes, hex and endianness
b = bytes([0xA5, 0x34, 0x12])
print(b, len(b))
print(b[0], hex(b[0]), f"{b[0]:08b}")
print(b.hex(" "))
```

```bash
python3 int01_l09_bytes.py
# b'\xa54\x12' 3
# 165 0xa5 10100101
# a5 34 12
```

::: warning Python prints some bytes as letters
Look at the first line of output: `b'\xa54\x12'`. The middle byte is `0x34`, but Python showed it as the character `4`, because `0x34` happens to be the code for the digit 4 in ASCII text. That is only a display habit, and it makes raw bytes very hard to read. Always print binary data with `.hex(" ")`, which shows every byte as two hex digits with spaces between.
:::

## Byte order: which end first

Take the 16-bit number `0x1234`. It needs two bytes: `0x12`, the **most significant byte** (the "big end", worth $256$ times as much), and `0x34`, the **least significant byte** (the "little end").

There are two ways to lay them out in memory or on a wire:

- **Little-endian:** little end first. The bytes are `34 12`.
- **Big-endian:** big end first. The bytes are `12 34`, the same order you would write the number.

This choice is called **[[endianness|endian-origin]]**. Most desktop and laptop processors (x86) and most ARM chips as normally configured are little-endian. Internet protocols send multi-byte numbers big-endian, and that is so standard that big-endian is also called **network byte order**. Telemetry formats come in both flavors, which is why every binary spec states its byte order, and why you must read that line of the spec first.

```python
# int01_l09_bytes.py (part 2)
n = 0x1234                                   # 4660
print(n.to_bytes(2, "little").hex(" "), n.to_bytes(2, "big").hex(" "))

raw = bytes([0x34, 0x12])
print(int.from_bytes(raw, "little"), int.from_bytes(raw, "big"))
print(raw[0] | (raw[1] << 8))                # little-endian by hand

t = bytes([0xE8, 0x03, 0x00, 0x00])
print(t[0] | (t[1] << 8) | (t[2] << 16) | (t[3] << 24))
```

```bash
# 34 12 12 34
# 4660 13330
# 4660
# 1000
```

Read the same two bytes `34 12` as little-endian and you get 4660, the right value. Read them as big-endian and you get 13330, a perfectly believable wrong number. Nothing crashes. That is what makes byte-order bugs dangerous.

### Assembling a number by hand

The line `raw[0] | (raw[1] << 8)` is the whole idea of little-endian in one expression. Byte 0 is the ones place. Byte 1 is worth $2^8 = 256$ times as much, so shift it left by 8 bits. Byte 2 is worth $2^{16}$, so shift it by 16, and byte 3 by 24. Then OR the pieces together; since they occupy different bits, OR acts like adding:

$$
v = b_0 + 256\,b_1 + 256^2\,b_2 + 256^3\,b_3 .
$$

Read $b_0$ as "b sub zero", the first byte to arrive. For big-endian, the first byte gets the biggest weight instead.

::: key Endianness
Little-endian puts the least significant byte first: `0x1234` is stored `34 12`. Big-endian puts the most significant byte first: `12 34`. Network byte order is big-endian. A little-endian unsigned value from bytes $b_0, b_1, \dots$ is $b_0 + 256\,b_1 + 256^2\,b_2 + \dots$, which in code is `b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)`.
:::

::: example A timestamp from four bytes
A 32-bit little-endian timestamp in milliseconds arrives as `E8 03 00 00`. What time is it?

**Name the bytes.** $b_0 = \mathrm{0xE8} = 232$, $b_1 = \mathrm{0x03} = 3$, $b_2 = 0$, $b_3 = 0$.

**Weight them.** $232 + 256 \times 3 + 65{,}536 \times 0 + 16{,}777{,}216 \times 0 = 232 + 768 = 1000$.

So the timestamp is 1000 ms, one second after the clock started.

**Read it the wrong way.** As big-endian, the same bytes give $\mathrm{0xE8030000} = 232 \times 16{,}777{,}216 + 3 \times 65{,}536 = 3{,}892{,}510{,}720$ ms, about 45 days. Sanity check: a test that has run for one second should not report 45 days, and a stream of timestamps that jump by millions every frame is the usual first sign of a byte-order mix-up.
:::

## Python's struct module

Shifting every field by hand gets tedious. Python's `struct` module does it for you: describe the layout with a short **format string**, and `struct` packs values into bytes or unpacks bytes into values.

The first character sets the byte order:

| Prefix | Byte order | Sizes and padding |
| --- | --- | --- |
| `<` | little-endian | standard sizes, no padding |
| `>` | big-endian | standard sizes, no padding |
| `!` | network, which is big-endian | standard sizes, no padding |
| `=` | this machine's order | standard sizes, no padding |
| `@` or nothing | this machine's order | this machine's sizes, with padding |

Then one letter per field:

| Letter | C type | Bytes | Range or meaning |
| --- | --- | --- | --- |
| B, b | unsigned, signed char | 1 | 0 to 255; -128 to 127 |
| H, h | unsigned, signed short | 2 | 0 to 65,535; -32,768 to 32,767 |
| I, i | unsigned, signed int | 4 | 0 to about 4.29 billion |
| Q, q | unsigned, signed long long | 8 | 64-bit integers |
| f | float | 4 | 32-bit floating point |
| d | double | 8 | 64-bit floating point |

Capital letters are unsigned, small letters are signed (except `f` and `d`). So `"<HIf"` reads aloud as "little-endian: an unsigned 16-bit integer, then an unsigned 32-bit integer, then a 32-bit float". Its size is $2 + 4 + 4 = 10$ bytes, and `struct.calcsize` will confirm that for you.

```python
# int01_l09_struct.py -- struct format strings
import struct

print(struct.calcsize("<HIf"), struct.calcsize("@HIf"))

rec = struct.pack("<HIf", 7, 1000, 1.5)      # channel, time in ms, value
print(len(rec), rec.hex(" "))
print(struct.unpack("<HIf", rec))
print(struct.pack(">HIf", 7, 1000, 1.5).hex(" "))

blob = b"\xff\xff" + rec                     # two junk bytes, then the record
print(struct.unpack_from("<H", blob, 2), struct.unpack_from("<If", blob, 4))

(v,) = struct.unpack("<f", struct.pack("<f", 0.1))
print(v)
```

```bash
python3 int01_l09_struct.py
# 10 12
# 10 07 00 e8 03 00 00 00 00 c0 3f
# (7, 1000, 1.5)
# 00 07 00 00 03 e8 3f c0 00 00
# (7,) (1000, 1.5)
# 0.10000000149011612
```

Line by line:

- `calcsize("<HIf")` is 10, as computed. But `calcsize("@HIf")` is 12 on this machine: with no prefix, `struct` inserts two bytes of **[[padding|padding]]** after the `H` so the `I` starts on a multiple of 4. A 10-byte packet read with a 12-byte format goes wrong.
- `pack` turned three values into 10 bytes. Find them in the hex: `07 00` is 7, `e8 03 00 00` is 1000, and `00 00 c0 3f` is 1.5 as a **[[32-bit float|float-bits]]**.
- `unpack` reverses it and always returns a **tuple**, even for a single field.
- With `>` the same values come out big-endian: `00 07`, `00 00 03 e8`, `3f c0 00 00`. Each field's bytes are reversed; the order of the fields is not.
- `unpack_from(fmt, buffer, offset)` reads starting partway into a longer buffer, without slicing a copy: the tool for pulling fields out of a stream.
- `0.1` packed as a 32-bit float comes back as `0.10000000149011612`. A float32 carries only about 7 significant digits, so compare floats from telemetry with a tolerance, never with `==`.

::: key struct in one breath
Always start the format with an explicit byte order: `<` little, `>` big, `!` network. `H` is 2 bytes, `I` is 4, `f` is 4, `B` is 1, `d` is 8. `struct.calcsize("<HIf")` is 10. `unpack` returns a tuple; `unpack_from(fmt, buf, offset)` reads at an offset.
:::

::: warning Leaving off the byte-order prefix
A format with no prefix, like `"HIf"`, means "this machine's order, this machine's sizes, with padding". It may work on your laptop and then read garbage on a machine with a different byte order, or read the wrong offsets because of padding. Every format string for a wire or file protocol should start with `<`, `>` or `!`, chosen from the spec.
:::

::: example Decoding a record by hand
A little-endian `"<HIf"` record arrives as the 10 bytes

`07 00 E8 03 00 00 00 00 C0 3F`

**Split by width.** `H` takes 2 bytes, `I` takes 4, `f` takes 4. So the fields are `07 00`, then `E8 03 00 00`, then `00 00 C0 3F`. The offsets are 0, 2 and 6, and $6 + 4 = 10$ uses every byte.

**The channel.** $7 + 256 \times 0 = 7$.

**The time.** From the earlier example, $232 + 256 \times 3 = 1000$ ms.

**The value.** Reverse the little-endian bytes to get the bit pattern `0x3FC00000`. As a 32-bit float that is exactly 1.5 (the context note on floats shows why).

Sanity check: `struct.unpack("<HIf", rec)` printed `(7, 1000, 1.5)`, the same three numbers.
:::

## Checksums: did the bytes arrive intact?

Radio links flip bits. A cosmic ray, a burst of noise or a weak signal can turn a 0 into a 1. A **checksum** is a small number computed from the data by the sender and sent along with it. The receiver computes it again from what arrived. If the two disagree, the data was damaged, and the frame is thrown away.

Two simple checksums show up in interview problems:

- **XOR checksum:** XOR all the bytes together. Each bit of the result says whether that bit position had an odd number of 1s across all the bytes. This is a **parity** check, done 8 bit positions at once.
- **Additive checksum:** add all the bytes and keep the result modulo 256, meaning the remainder after dividing by 256. In code that is `sum(data) % 256`, or `& 0xFF`.

```python
# int01_l09_checksums.py -- XOR, additive and CRC checks
import zlib

def xor8(data):
    c = 0
    for byte in data:
        c ^= byte
    return c

def sum8(data):
    return sum(data) % 256

good = bytes([0x07, 0x00, 0xE8, 0x03])
print(hex(xor8(good)), hex(sum8(good)))

one_flip = bytes([0x07 ^ 0x10, 0x00, 0xE8, 0x03])            # one bit flipped
two_flip = bytes([0x07 ^ 0x10, 0x00 ^ 0x10, 0xE8, 0x03])     # same bit, two bytes
swapped  = bytes([0x00, 0x07, 0xE8, 0x03])                   # two bytes swapped
for name, d in [("one flip", one_flip), ("two flips", two_flip), ("swapped", swapped)]:
    print(f"{name:9s} xor caught: {xor8(d) != xor8(good)!s:5s}"
          f" sum caught: {sum8(d) != sum8(good)!s:5s}"
          f" crc32 caught: {zlib.crc32(d) != zlib.crc32(good)}")
print(hex(zlib.crc32(good)))
```

```bash
python3 int01_l09_checksums.py
# 0xec 0xf2
# one flip  xor caught: True  sum caught: True  crc32 caught: True
# two flips xor caught: False sum caught: True  crc32 caught: True
# swapped   xor caught: False sum caught: False crc32 caught: True
# 0xb33dcffb
```

::: example An XOR and an additive checksum by hand
Compute both checksums of the four bytes `07 00 E8 03`.

**XOR, one byte at a time.** Start at 0.

- $0 \oplus \mathrm{0x07} = \mathrm{0x07}$, which is `00000111`.
- $\mathrm{0x07} \oplus \mathrm{0x00} = \mathrm{0x07}$: XOR with zero changes nothing.
- `00000111` XOR `11101000` (that is `0xE8`) $=$ `11101111`, which is `0xEF`. The bits differ in every place, so every result bit is 1 where exactly one input had a 1.
- `11101111` XOR `00000011` $=$ `11101100`, which is `0xEC`.

Read $\oplus$ as "XOR". The XOR checksum is `0xEC`.

**Additive.** $7 + 0 + 232 + 3 = 242$. That is below 256, so modulo 256 it stays 242, which is `0xF2`.

Both match the script's first line. Sanity check on XOR: `0xEC` is `11101100`, which has five 1 bits. Count the 1s in each bit column of the inputs and you find an odd number exactly in those five columns.
:::

### What each one misses

The script shows the weak spots.

- **One flipped bit** changes one column's parity, so XOR always catches it. Addition catches it too.
- **Two flips in the same bit position** of different bytes cancel out under XOR: each column is flipped twice, and the parity is back where it started. Addition caught this one, but it too can be fooled, for example by one byte going up by 16 while another goes down by 16.
- **Two bytes swapped** fool both, because XOR and addition do not care about order. $a \oplus b = b \oplus a$ and $a + b = b + a$.

That matters: a swap is what a byte-order bug looks like.

### CRC: the grown-up version

A **[[CRC|crc]]** (cyclic redundancy check) treats the whole message as one long binary number and divides it by a fixed "generator" pattern, using XOR in place of subtraction. The remainder is the check value. It is still cheap to compute, but the position of each bit matters, so swaps are caught, and a CRC of width $w$ bits catches every burst of errors up to $w$ bits long. CRC-32 is the one in Ethernet, ZIP and PNG files, and Python has it built in as `zlib.crc32` and `binascii.crc32`. A medium interview will not ask you to derive one; know that XOR and additive checksums are weak, that a CRC is the real-world upgrade, and that the spec says which to use.

::: key Checksums
XOR checksum: XOR of all the bytes; catches any single flipped bit, misses two flips in the same bit position and misses reordering. Additive checksum: sum of the bytes modulo 256; also misses reordering. A CRC depends on the position of every bit, catches reordering and all short bursts of errors, and is what real links use.
:::

## Bit twiddling in C++

Flight software does the same decoding in C++, assembling fields from bytes with shifts and masks exactly as in the Python by-hand lines. Three details trip people up.

**Use fixed-width types.** A plain `int` might be 16, 32 or 64 bits depending on the machine. The header `<cstdint>` gives types whose width is guaranteed: `uint8_t` (one unsigned byte), `uint16_t`, `uint32_t`, and signed versions `int8_t` through `int64_t`. Raw packet bytes are `uint8_t`.

**Cast before you shift.** In C++, arithmetic on a `uint8_t` first promotes it to a plain `int`, which is signed. Shifting `0x80` left by 24 as a 32-bit signed `int` pushes a 1 into the sign bit, which C++17 treats as **undefined behavior**: the program is allowed to do anything. Casting each byte to `uint32_t` *before* shifting keeps the arithmetic unsigned and well defined.

**Copy float bits with memcpy.** A float field arrives as 4 bytes. It is tempting to write `*(float*)p` and read them in place. Do not. That breaks the **[[strict aliasing rule|strict-aliasing]]**, which lets the compiler assume a `float*` and a `uint8_t*` or `uint32_t*` never point at the same memory. It may also read from an address that is not a multiple of 4, which some processors cannot do. The safe way is to assemble a `uint32_t` from the bytes, then copy its bit pattern into a `float` with `std::memcpy`. Compilers turn that copy into a single move instruction, so it costs nothing. C++20 adds `std::bit_cast` for the same job.

```cpp
// int01_l09_bits.cpp -- assemble little-endian fields from raw bytes
#include <cstdint>
#include <cstdio>
#include <cstring>

std::uint16_t le_u16(const std::uint8_t* p) {
    return static_cast<std::uint16_t>(p[0] | (p[1] << 8));
}

std::uint32_t le_u32(const std::uint8_t* p) {
    return static_cast<std::uint32_t>(p[0])
         | (static_cast<std::uint32_t>(p[1]) << 8)
         | (static_cast<std::uint32_t>(p[2]) << 16)
         | (static_cast<std::uint32_t>(p[3]) << 24);
}

float le_f32(const std::uint8_t* p) {
    std::uint32_t bits = le_u32(p);
    float f;
    std::memcpy(&f, &bits, sizeof f);   // copy the bit pattern, no pointer cast
    return f;
}

int main() {
    // channel 7, time 1000 ms, value 1.5, packed little-endian ("<HIf")
    const std::uint8_t rec[10] = {0x07, 0x00, 0xE8, 0x03, 0x00, 0x00,
                                  0x00, 0x00, 0xC0, 0x3F};
    std::printf("channel %u\n", static_cast<unsigned>(le_u16(rec)));
    std::printf("t_ms    %u\n", static_cast<unsigned>(le_u32(rec + 2)));
    std::printf("value   %g\n", static_cast<double>(le_f32(rec + 6)));

    const std::uint8_t top[4] = {0x00, 0x00, 0x00, 0x80};
    std::printf("high bit %u\n", static_cast<unsigned>(le_u32(top)));

    std::uint8_t status = 0x03;
    status |= 1u << 7;                                   // set bit 7
    status &= static_cast<std::uint8_t>(~(1u << 0));     // clear bit 0
    std::printf("status 0x%02X, bit 1 = %u\n", static_cast<unsigned>(status),
                static_cast<unsigned>((status >> 1) & 1u));

    std::uint16_t probe = 0x1234;
    std::uint8_t pb[2];
    std::memcpy(pb, &probe, sizeof probe);
    std::printf("this machine stores 0x1234 as %02X %02X\n",
                static_cast<unsigned>(pb[0]), static_cast<unsigned>(pb[1]));

    std::uint8_t xs = 0;
    for (std::uint8_t byte : rec) xs ^= byte;
    std::printf("xor 0x%02X\n", static_cast<unsigned>(xs));
    return 0;
}
```

```bash
g++ -std=c++17 -Wall -o int01_l09_bits int01_l09_bits.cpp && ./int01_l09_bits
# channel 7
# t_ms    1000
# value   1.5
# high bit 2147483648
# status 0x82, bit 1 = 1
# this machine stores 0x1234 as 34 12
# xor 0x13
```

What each part shows:

- `le_u16` and `le_u32` are the formula $b_0 + 256\,b_1 + \dots$ as shifts and ORs, with every byte cast to `uint32_t` first in `le_u32`.
- The bytes `00 00 00 80` set only the top bit. With the casts the answer is $2^{31} = 2{,}147{,}483{,}648$, as it should be.
- `le_f32` reads the float through `memcpy` and gets 1.5.
- The status lines are lesson 7's set, clear and test moves on a `uint8_t`.
- The `probe` lines show this machine is little-endian. The decoding functions would still be right on a big-endian machine, because they build each value from bytes with arithmetic instead of reinterpreting memory. That is the portable way.
- The XOR over all 10 record bytes is `0x13`.

::: warning Reading a whole struct straight off the wire
A common shortcut is to declare a C++ `struct` with the packet's fields and `memcpy` the whole packet into it. It fails in three quiet ways: the compiler may add padding between fields (the same padding `@HIf` showed), the host's byte order may not match the wire's, and the layout can change between compilers. Decode field by field from explicit offsets, as above, unless the codebase has a checked, documented reason to do otherwise.
:::

## Pieces, not yet the machine

You now have every part a binary decoder needs: field widths and offsets, byte order, format strings, `unpack_from`, checksums, and the C++ shifts, casts and `memcpy`. What is missing is the loop around them: scanning a stream for the start of each frame, skipping damaged frames, getting back in step after garbage, and refusing to decode a frame cut off at the end of the buffer. That loop is lesson 10 and the module's **[[decommutator exercise|bridge-decom]]**.

## Check yourself

::: check
The 16-bit value 500 is sent little-endian. Which two bytes go on the wire, in order? What value would a receiver get if it wrongly read them as big-endian?
:::

::: answer
$500 = 1 \times 256 + 244$, so the high byte is 1 (`0x01`) and the low byte is 244 (`0xF4`). Little-endian sends the low byte first: `F4 01`. Read as big-endian, the first byte is taken as the high byte: $244 \times 256 + 1 = 62{,}465$. Check in Python: `(500).to_bytes(2, "little").hex()` gives `f401`, and `int.from_bytes(bytes([0xF4, 0x01]), "big")` gives 62465.
:::

::: check
What does `struct.calcsize("<BHd")` return? What about `">BHd"`? Would `"@BHd"` be the same? Explain why or why not.
:::

::: answer
`B` is 1 byte, `H` is 2, `d` is 8, so with `<` (no padding) the size is $1 + 2 + 8 = 11$. With `>` it is also 11: the byte order changes which end of each field comes first, not how many bytes there are. `"@BHd"` is usually bigger, because native mode pads each field to its natural alignment: one pad byte after `B` so `H` starts at offset 2, then padding so `d` starts at a multiple of 8. That gives $1 + 1 + 2 + 4 + 8 = 16$ bytes on a typical 64-bit machine.
:::

::: check
Compute the XOR checksum of the three bytes `A5 0F F0`. Then say which single change to the data an XOR checksum would *not* notice: flipping the lowest bit of the first byte, or swapping the second and third bytes.
:::

::: answer
`A5` is `10100101`, `0F` is `00001111`, `F0` is `11110000`. First, `10100101` XOR `00001111` $=$ `10101010` (`0xAA`). Then `10101010` XOR `11110000` $=$ `01011010`, which is `0x5A`. Flipping the lowest bit of the first byte changes one column's parity, so the checksum becomes `0x5B` and the error is caught. Swapping the second and third bytes leaves the checksum at `0x5A`, because XOR does not depend on order — that change goes unnoticed.
:::

::: check
In C++, why is `p[0] | (p[1] << 8) | (p[2] << 16) | (p[3] << 24)`, with `p` a `const uint8_t*`, risky for a 32-bit field, and what is the fix?
:::

::: answer
Each `uint8_t` is promoted to a signed `int` before the shift. If `p[3]` is 128 or more, `p[3] << 24` sets the sign bit of a 32-bit `int`, which is undefined behavior in C++17, and the result can also sign-extend when it is widened. The fix is to cast each byte to `std::uint32_t` before shifting, as in `static_cast<std::uint32_t>(p[3]) << 24`, so all the arithmetic is unsigned and well defined.
:::

::: check
A colleague reads a float field with `float v = *reinterpret_cast<const float*>(buf + 7);`. Give two reasons this can go wrong, and write the safe version in words.
:::

::: answer
First, it breaks the strict aliasing rule: the bytes are `uint8_t` data being read through a `float*`, and the compiler is allowed to assume that never happens, so optimized code can misbehave. Second, `buf + 7` is not a multiple of 4, and some processors fault or run slowly on a misaligned 4-byte read. (A third: if the wire is big-endian and the host little-endian, the bytes are in the wrong order anyway.) The safe version: assemble a `uint32_t` from the four bytes with casts and shifts in the wire's byte order, then `std::memcpy` its 4 bytes into a `float` (or use `std::bit_cast` in C++20).
:::

## Summary

| Idea | Meaning | Example |
| --- | --- | --- |
| byte | 8 bits, 0 to 255, two hex digits | 0xA5 is 165, binary 10100101 |
| little-endian | least significant byte first | 0x1234 stored 34 12 |
| big-endian, network order | most significant byte first | 0x1234 stored 12 34 |
| assembling | b0 + 256 b1 + 256² b2 + 256³ b3 | E8 03 00 00 is 1000 |
| struct prefix | `<` little, `>` big, `!` network; none means native with padding | calcsize of `<HIf` is 10, of `@HIf` is 12 here |
| struct letters | B 1, H 2, I 4, f 4, d 8 bytes; capitals unsigned | unpack returns a tuple |
| unpack_from | read at an offset without slicing | unpack_from with offset 4 |
| XOR checksum | XOR of every byte | 07 00 E8 03 gives 0xEC |
| additive checksum | sum of bytes modulo 256 | 07 00 E8 03 gives 0xF2 |
| CRC | position-sensitive check; catches swaps and short bursts | zlib.crc32 |
| C++ assembly | cast to uint32_t, shift, OR | portable on any host |
| C++ floats | assemble the bits, then memcpy into a float | never cast the pointer |

Next lesson puts these pieces inside a loop: a decommutator that finds each frame in a raw stream, checks it, skips damaged frames, resynchronizes byte by byte, and notices when telemetry drops out.

::: context hex-nibbles Why engineers read hex
Hex exists because 16 is $2^4$: each hex digit maps to exactly four bits, a group sometimes called a nibble. So you can convert between hex and binary in your head, one digit at a time, without any arithmetic on the whole number. Decimal does not line up with bits at all. That is why memory dumps, packet captures and telemetry specs are all written in hex.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" font-size="13" text-anchor="middle">
    <rect x="40" y="40" width="30" height="30" fill="#8fb8f0"/>
    <rect x="70" y="40" width="30" height="30" fill="#8fb8f0"/>
    <rect x="100" y="40" width="30" height="30" fill="#8fb8f0"/>
    <rect x="130" y="40" width="30" height="30" fill="#8fb8f0"/>
    <rect x="190" y="40" width="30" height="30" fill="#f2b880"/>
    <rect x="220" y="40" width="30" height="30" fill="#f2b880"/>
    <rect x="250" y="40" width="30" height="30" fill="#f2b880"/>
    <rect x="280" y="40" width="30" height="30" fill="#f2b880"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="60">1</text><text x="85" y="60">0</text><text x="115" y="60">1</text><text x="145" y="60">0</text>
    <text x="205" y="60">0</text><text x="235" y="60">1</text><text x="265" y="60">0</text><text x="295" y="60">1</text>
    <text x="100" y="95">A = 10</text>
    <text x="250" y="95">5</text>
    <text x="175" y="25">0xA5 = 16 x 10 + 5 = 165</text>
  </g>
</svg>
```
:::

::: context endian-origin Big-endians and little-endians
The words come from *Gulliver's Travels* (1726), where two nations go to war over which end of a boiled egg to crack first: the big end or the little end. The computer scientist Danny Cohen borrowed them in a 1980 note about network design, pointing out that the choice of byte order is just as arbitrary as the egg — and just as capable of starting fights. The point stuck: neither order is better, but everyone on one link must agree.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">0x12345678 in memory, lowest address on the left</text>
  <text x="10" y="55" font-size="11" fill="#1f2a44">little</text>
  <text x="10" y="100" font-size="11" fill="#1f2a44">big</text>
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="70" y="35" width="60" height="30"/><rect x="130" y="35" width="60" height="30"/>
    <rect x="190" y="35" width="60" height="30"/><rect x="250" y="35" width="60" height="30"/>
  </g>
  <g stroke="#1f2a44" fill="#f2b880">
    <rect x="70" y="80" width="60" height="30"/><rect x="130" y="80" width="60" height="30"/>
    <rect x="190" y="80" width="60" height="30"/><rect x="250" y="80" width="60" height="30"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="55">78</text><text x="160" y="55">56</text><text x="220" y="55">34</text><text x="280" y="55">12</text>
    <text x="100" y="100">12</text><text x="160" y="100">34</text><text x="220" y="100">56</text><text x="280" y="100">78</text>
  </g>
  <text x="330" y="55" font-size="11" fill="#6c7a93">x86</text>
  <text x="330" y="100" font-size="11" fill="#6c7a93">wire</text>
</svg>
```

"Wire" here means network byte order; a particular telemetry format may use either.
:::

::: context padding Why the native layout has gaps
Many processors read a 4-byte number fastest, or only at all, when its address is a multiple of 4. So a C compiler lays out a structure with gaps, called padding, to put each field on such a boundary. Python's `struct` in native `@` mode copies the C compiler's layout, gaps included: after a 2-byte `H` at offset 0 it skips offsets 2 and 3 so the 4-byte `I` starts at 4. A packet on a wire has no gaps unless its spec says so, which is why wire formats use `<`, `>` or `!`, which never pad.
:::

::: context float-bits How 1.5 becomes 3F C0 00 00
A 32-bit float, in the IEEE 754 standard nearly every processor uses, has three parts: 1 sign bit, 8 exponent bits and 23 fraction bits. The value is $(-1)^{s} \times 1.f \times 2^{e - 127}$. For 1.5, which is $1.1$ in binary times $2^0$: the sign is 0, the exponent field is $0 + 127 = 127$ (`01111111`), and the fraction is `1000…0`. Put together, `0 01111111 1000…0` is `0x3FC00000`, which little-endian sends as `00 00 C0 3F`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="24" height="30" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="44" y="30" width="96" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="140" y="30" width="200" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="32" y="50" fill="#ffffff">0</text>
    <text x="92" y="50">01111111</text>
    <text x="240" y="50">1000 0000 0000 0000 0000 000</text>
    <text x="32" y="78" font-size="11">sign</text>
    <text x="92" y="78" font-size="11">exponent, 8 bits</text>
    <text x="240" y="78" font-size="11">fraction, 23 bits</text>
    <text x="180" y="20" font-size="11">1.5 as float32 = 0x3FC00000</text>
  </g>
</svg>
```
:::

::: context crc Division without borrowing
A CRC treats the message bits as the coefficients of a long polynomial and divides by a fixed generator polynomial, doing the arithmetic with XOR, where adding and subtracting are the same and nothing carries. The remainder is appended to the message. Because every bit's position affects the remainder, a swap changes it. CRC-32 guards Ethernet frames, ZIP archives and PNG images; space links commonly use a 16-bit CRC on each transfer frame. Python's `zlib.crc32` computes CRC-32 in one call.
:::

::: context strict-aliasing The rule behind memcpy
C++ lets the compiler assume that pointers to different types, such as `float*` and `uint32_t*`, do not point at the same bytes. That assumption lets it keep values in registers and reorder loads, which makes code faster. Reading a `uint8_t` buffer through a `float*` breaks the assumption, so after optimization the program may read stale or wrong values — undefined behavior that often appears only in release builds. Copying the bytes with `std::memcpy`, or `std::bit_cast` in C++20, is always allowed, and compilers turn the copy into a single register move.
:::

::: context bridge-decom What lesson 10 adds
The decommutator exercise gives you a 12-byte frame: a magic byte `0xA5`, a little-endian `uint16` channel, a little-endian `uint32` time in milliseconds, a little-endian `float32` value, and an XOR checksum of the first eleven bytes. Every field uses something from this lesson. What lesson 10 adds is the scanning loop: how to find the magic byte, when to step forward by one byte instead of a whole frame, and why the loop must stop when fewer than 12 bytes remain.
:::
