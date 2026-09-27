---
id: l04-fundamental-and-fixed-width-types
title: Fundamental types, cstdint and size_t
minutes: 22
covers:
  - Fundamental types; fixed-width types from cstdint; size_t
---

Think of a paper form with little boxes for your ZIP code: five boxes, one digit each. If your code had six digits, the form could not hold it. Whoever printed the form decided the size in advance, and everyone who fills it in or reads it has to agree on that size.

A Python `int` is not like that. It is a bag that stretches. `2**70` fits as easily as `3`, and you have never had to decide how big a number might get. C++ integers are the form with boxes. Each type is a fixed row of **[[bits|bits-and-bytes]]** — ones and zeros — chosen before the program runs. C++ offers about fourteen integer types. Most of them do not have a fixed size across machines. And when a value does not fit, C++ does not raise an exception. It quietly keeps the part that fits.

This matters where software meets hardware. A **[[telemetry packet|telemetry-packet]]** — a bundle of measurements the vehicle sends to the ground — is a form both sides must agree on. The flight computer writes the bytes and the ground station reads them, with programs built by different compilers, maybe for different processors, maybe years apart. A struct whose field sizes depend on the compiler is not an agreement. The same goes for memory shared between two processors, a CAN bus message, and a log file a post-flight tool will read.

This lesson gives you the types, what the C++ standard promises about each, and the rule for picking a type for a field you send. The measurements come from g++ 13.3.0 on x86-64 Linux. Where a number belongs to this platform only, the lesson says so: the skill is knowing which numbers travel.

## What the standard promises, and what it does not

A **type** tells the compiler how many bytes a value takes and what those bytes mean. A **byte** is 8 bits on every machine you will meet.

The **signed** integer types can hold negative numbers. They are `signed char`, `short`, `int`, `long` and `long long`. Each has an **unsigned** twin, like `unsigned int`, that holds only zero and positive numbers but reaches twice as high.

Here is the surprise. The standard does not fix their widths. It only sets a *minimum* for each, and an order:

| Type | Minimum width the standard requires |
| --- | --- |
| `char` | 8 bits, and `sizeof(char) == 1` by definition |
| `short` | 16 bits |
| `int` | 16 bits |
| `long` | 32 bits |
| `long long` | 64 bits |

and `sizeof(char) <= sizeof(short) <= sizeof(int) <= sizeof(long) <= sizeof(long long)`. Read `<=` as "is less than or equal to". `sizeof(x)`, read "size of x", is an operator that gives the size of a type or value.

Everything else is up to the **implementation** — the compiler plus the platform it targets. One odd detail: `sizeof` counts in units of `char`, not 8-bit bytes. Where a `char` were 16 bits, `sizeof(int)` could be 2 for a 32-bit `int`. Every machine you will meet has 8-bit `char`s (`CHAR_BIT` from `<climits>` is 8), but the standard does not promise it.

Here is what this machine reports. The library tool `std::numeric_limits<T>` gives the smallest and largest value of a type `T`. Read `std::` as "standard", and `::` as "colon colon": it means "the name on the right, found inside the name on the left".

```cpp
#include <cstddef>
#include <cstdio>
#include <limits>

int main() {
    std::printf("char        %2zu  %20d %20d\n", sizeof(char),
                int{std::numeric_limits<char>::min()}, int{std::numeric_limits<char>::max()});
    std::printf("short       %2zu  %20d %20d\n", sizeof(short),
                int{std::numeric_limits<short>::min()}, int{std::numeric_limits<short>::max()});
    std::printf("int         %2zu  %20d %20d\n", sizeof(int),
                std::numeric_limits<int>::min(), std::numeric_limits<int>::max());
    std::printf("long        %2zu  %20ld %20ld\n", sizeof(long),
                std::numeric_limits<long>::min(), std::numeric_limits<long>::max());
    std::printf("long long   %2zu  %20lld %20lld\n", sizeof(long long),
                std::numeric_limits<long long>::min(), std::numeric_limits<long long>::max());
    std::printf("bool        %2zu\nfloat       %2zu\ndouble      %2zu\nlong double %2zu\n",
                sizeof(bool), sizeof(float), sizeof(double), sizeof(long double));
    std::printf("void*       %2zu\nsize_t      %2zu\nptrdiff_t   %2zu\n",
                sizeof(void*), sizeof(std::size_t), sizeof(std::ptrdiff_t));
    return 0;
}
```

```text
char         1                  -128                  127
short        2                -32768                32767
int          4           -2147483648           2147483647
long         8  -9223372036854775808  9223372036854775807
long long    8  -9223372036854775808  9223372036854775807
bool         1
float        4
double       8
long double 16
void*        8
size_t       8
ptrdiff_t    8
```

Check one row against the bits. A 4-byte `int` is 32 bits. A signed 32-bit type reaches from $-2^{31}$ to $2^{31}-1$, which is $-2147483648$ to $2147483647$. That matches the third line.

The dangerous line is `long`. It is 8 bytes here. It is 4 bytes on 64-bit Windows, and 4 bytes on any 32-bit target. You do not need a second computer to see it move. Ask the same compiler to pretend it targets a 32-bit machine (`-m32`), and print the sizes it has built in (`-dM -E` lists the compiler's predefined macros):

```bash
g++ -dM -E -x c++ /dev/null | grep __SIZEOF_LONG__
g++ -m32 -dM -E -x c++ /dev/null | grep __SIZEOF_LONG__
```

```text
#define __SIZEOF_LONG__ 8
#define __SIZEOF_LONG__ 4
```

One compiler, one machine, and `long` changed width (`__SIZEOF_POINTER__` drops from 8 to 4 too). These combinations have names, called **[[data models|data-models]]**. Linux on x86-64 is **LP64**: `long` and pointers are 64-bit, `int` is 32. 64-bit Windows is **LLP64**: only `long long` and pointers are 64-bit. A struct with a `long` in it has a different layout under each.

::: warning
`int` is 32 bits on every desktop and server in use today, and that makes it tempting to think of `int` as "the 32-bit type". It is not. It is 16 bits on some small embedded chips, and the standard allows that. Use `int` for loop counters and arithmetic inside a function, where its width never leaves the function. Never use it for a field whose bytes leave the program.
:::

### `char` is three types, and its sign is not yours to assume

`char`, `signed char` and `unsigned char` are three *different* types. (`int` and `signed int`, by contrast, are two spellings of one type.) Whether plain `char` is signed is up to the implementation. On x86 it is normally signed. On most ARM and PowerPC Linux targets it is normally unsigned. So a program that worked on a laptop can misbehave on a flight processor.

You can watch the compiler change its mind. This program asks the library what plain `char` is. `static_cast<char>(200)`, read "static cast to char of 200", is an explicit, visible type conversion:

```cpp
#include <cstdio>
#include <limits>

int main() {
    std::printf("char is_signed = %d, lowest = %d\n",
                std::numeric_limits<char>::is_signed,
                int{std::numeric_limits<char>::min()});
    char c = static_cast<char>(200);
    std::printf("char c = 200 -> %d\n", static_cast<int>(c));
    return 0;
}
```

```bash
g++ -std=c++20 charsign.cpp -o a && ./a
g++ -std=c++20 -funsigned-char charsign.cpp -o b && ./b
```

```text
char is_signed = 1, lowest = -128
char c = 200 -> -56
char is_signed = 0, lowest = 0
char c = 200 -> 200
```

Same source, same machine, one flag, two answers. Where does $-56$ come from? A signed byte uses **[[two's complement|twos-complement]]**: bit patterns 0 to 127 mean themselves, and patterns 128 to 255 mean those numbers minus 256. So the pattern for 200 means $200 - 256 = -56$.

The rule that follows: use `char` only for text. For a byte of data, write `std::uint8_t`. For a small signed number, write `std::int8_t`.

### `bool`, and the floating types

`bool` holds `true` or `false`. It takes one byte here (the standard does not require exactly 1), and a `bool` in a struct costs a whole byte. So a packed field of eight on/off flags should be one integer with named bits, not eight `bool`s.

`float` and `double` hold numbers with a decimal point, in the formats of a standard called **[[IEEE 754|ieee-754]]**. `float` is binary32, about 7 decimal digits. `double` is binary64, about 16 digits. `long double` is 16 bytes here but holds only 64 bits of precision: it is the old x87 80-bit format, padded out to 16 bytes. On Microsoft's compiler and on 32-bit ARM it is plain `double`; on 64-bit ARM Linux it is a 16-byte format done in software. Never put it in a wire format. The numerical-methods module covers precision. For now, `double` is the default for physics, and `float` is what you use once you have measured that you can afford it.

## Fixed-width types: `<cstdint>`

The header `<cstdint>` (say "C standard int") gives integer types whose widths are in their names. `std::int32_t` is "a signed integer, exactly 32 bits". The `u` in `std::uint8_t` means unsigned. The `_t` ending is an old C habit that marks a type name.

| Family | Members | What it promises |
| --- | --- | --- |
| Exact | `int8_t`, `int16_t`, `int32_t`, `int64_t` and `uint…` | exactly that many bits, no padding, two's complement |
| Least | `int_least8_t` … | at least that many bits, smallest such type |
| Fast | `int_fast8_t` … | at least that many bits, fastest such type |
| Pointer | `intptr_t`, `uintptr_t` | wide enough to hold a pointer |
| Maximum | `intmax_t`, `uintmax_t` | the widest integer the implementation has |

The exact-width types are, strictly, optional. An implementation provides `int32_t` only if it has a 32-bit type with no padding bits. Every implementation you will use has them.

They are **aliases** — second names for types that already exist. On this platform `std::int32_t` *is* `int`, `std::int64_t` *is* `long` (not `long long`), and `std::uint8_t` *is* `unsigned char`. Two consequences follow, and both bite.

**`uint8_t` is a character type.** Print one and you may get a letter instead of a number:

```cpp
#include <cinttypes>
#include <cstdint>
#include <cstdio>
#include <iostream>

int main() {
    std::uint8_t mode = 65;
    std::printf("mode as %%d = %d, as %%c = %c\n", mode, mode);
    std::cout << "cout says: " << mode << '\n';
    std::cout << "cast first: " << static_cast<int>(mode) << '\n';

    std::int64_t t_ns = 1234567890123456789;
    std::printf("PRId64 = \"%s\", value = %" PRId64 "\n", PRId64, t_ns);
    return 0;
}
```

```text
mode as %d = 65, as %c = A
cout says: A
cast first: 65
PRId64 = "ld", value = 1234567890123456789
```

65 is the character code for `A`, and `std::cout` treats every character type as text. The habit (lesson 12 has more) is to cast a byte to `int` before printing it.

**`int64_t` is not always `long long`.** In a `printf` format, `%ld` means "a `long`" and `%lld` means "a `long long`". Here `int64_t` is `long`, so `%lld` is the wrong one. The header `<cinttypes>` supplies the right format letters as a macro, `PRId64` (say "print d, 64"). It expanded to `"ld"` on this platform. It would expand to `"lld"` where `int64_t` is `long long`. That is the whole point of the macro: the right letters on every platform, without you having to know which one you are on.

::: key
`int` and `long` have implementation-defined width, so a struct written as a wire format or shared with another processor can change size across a toolchain change. `int32_t` and `uint8_t` state exactly what is on the wire.
:::

## `std::size_t` and `std::ptrdiff_t`

`std::size_t` (say "size-t") is an unsigned integer type big enough to hold the size of any object. It is what `sizeof` gives you, what `std::vector::size()` returns, and what every standard-library index takes. It is 8 bytes here and 4 bytes on a 32-bit target. It follows the width of a pointer, not the width of `int`.

`std::ptrdiff_t` is its signed partner: the type you get when you subtract one pointer from another. It is 8 bytes here. Both come from `<cstddef>`.

`printf` prints a `size_t` with `%zu`. Not `%d` — that means a 4-byte signed `int`, a different width and a different signedness, and the mismatch is undefined behaviour.

The key fact about `size_t` is that it is **unsigned**, and that causes the most common loop bug in C++. Picture a car's odometer at 000000. Roll it back one mile and it does not show $-1$. It shows 999999. Unsigned numbers do the same thing. `v.size() - 1` on an empty container is not $-1$. It is

```text
empty v.size()-1  = 18446744073709551615
```

which is $2^{64}-1$, read "two to the sixty-fourth, minus one". Unsigned arithmetic is defined to wrap around like that odometer. Nothing is illegal here and nothing warns. The value is enormous, and a loop test like `i >= 0` on an unsigned type is true forever. Lesson 05 takes this apart. For now, remember that the type you must use to index containers is the type that does this.

::: example Choosing the types for a telemetry header
Design the fixed front part of a downlink packet. For each field, ask two questions. What is the full range this value can take, including when things go wrong? And what happens when it goes past that range?

```cpp
struct TelemetryHeader {
    std::uint16_t apid;         // application process id
    std::uint16_t seq_count;    // sequence counter, wraps at 65536
    std::uint32_t t_ms;         // time since boot, milliseconds
    std::uint8_t  mode;         // flight mode enumerator
    std::uint8_t  flags;        // bit field of status flags
    std::uint16_t payload_len;  // bytes of payload following
};
```

Print its size and where each field starts. `offsetof(T, field)` gives the byte position of a field inside a struct:

```text
sizeof(TelemetryHeader) = 12
offsets: apid=0 seq=2 t_ms=4 mode=8 flags=9 len=10
uint32 ms rolls over after 49.7 days
uint16 seq counter rolls over after 65536 packets
```

Add it up: $2 + 2 + 4 + 1 + 1 + 2 = 12$ bytes. Every offset is a multiple of the field's own size, so the compiler inserted no **[[padding|header-layout]]** — no hidden filler bytes. Now the reasons for each choice:

- `apid` is an 11-bit identifier in the **[[CCSDS|ccsds]]** space-packet standard. 16 bits is the smallest type that holds it.
- `seq_count` is *meant* to wrap. Unsigned wrap is defined behaviour, so `++seq` on a `uint16_t` is correct and needs no special case: 65535 goes to 0. At 10 packets per second, $65536 / 10 = 6553.6$ s, about 1.8 hours between rollovers. The ground station counts the rollovers to rebuild the full count.
- `t_ms` as `uint32_t` covers $2^{32}$ ms. Divide by 1000 to get seconds and by 86,400 to get days: 49.7 days. Plenty for a launch. Wrong for a space-station module, which wants a `uint64_t` count of microseconds. When you justify a time field, state the mission length.
- `mode` and `flags` are one byte each. The mode list has fewer than 256 values, and flags are single bits. Lesson 10 shows how to keep the list and the byte in step.
- `payload_len` as `uint16_t` caps the payload at 65,535 bytes. That is about the size of the CCSDS packet-length limit — check your project's interface control document for the exact figure. The point is that the type carries the protocol's limit, instead of leaving it to a comment.

The same fields written the careless way:

```cpp
struct LooseHeader {
    int  apid;
    int  seq_count;
    long t_ms;
    int  mode;
    bool flags;
    int  payload_len;
};
```

```text
sizeof(LooseHeader) = 32, offsets: t_ms=8 mode=16 flags=20 len=24
```

It compiles and runs, and it is 32 bytes here. On a 32-bit build or 64-bit Windows, `long` is 4 bytes, the struct is 24 bytes, and `mode` sits at offset 12 instead of 16 — so a ground tool built there reads `mode` from the middle of the vehicle's `t_ms`. Nothing warns, because neither compiler can see anything wrong. That is the whole argument for `<cstdint>`.
:::

::: example Sizing an IMU sample buffer
An IMU (inertial measurement unit) reports 1000 times a second, or 1 kHz. Each report has three accelerations and three rotation rates. You must keep the last five seconds in a fixed buffer. How much memory does it take?

**Pick the channel type.** The accelerometer is good to $10^{-4}\,\mathrm{m/s^2}$ over a range of $\pm 160\,\mathrm{m/s^2}$. The full span is $320\,\mathrm{m/s^2}$. Telling apart $320 / 10^{-4} = 3.2 \times 10^{6}$ steps needs $\log_2(3.2 \times 10^6) \approx 21.6$ bits. A `float` carries 24 bits of precision, so `float` is enough.

**Size one sample.** Six channels at 4 bytes is 24 bytes. Add a `uint32_t` timestamp: 28 bytes. Every member is 4 bytes, so there is no padding.

**Size the buffer.** Five seconds at 1000 samples per second is 5000 samples:

$$
5000 \times 28\,\mathrm{bytes} = 140{,}000\,\mathrm{bytes} \approx 136.7\,\mathrm{KiB}.
$$

(One **[[KiB|kib]]** is 1024 bytes, so $140{,}000 / 1024 \approx 136.7$.)

**Check it against the budget.** On a flight processor with 512 KiB of RAM, a quarter is 128 KiB, so this one buffer is a bit more than a quarter of everything you have. Had you reached for `double` out of habit, the six channels would take 48 bytes. The 4-byte timestamp makes 52, and the compiler pads the struct to 56 so that each `double` in the next sample starts on an 8-byte boundary. The buffer becomes $5000 \times 56 = 280{,}000$ bytes, about 273 KiB: more than half the RAM, spent on precision the sensor does not have. The type choice *is* the design.
:::

::: warning
`std::uint8_t` is an alias for `unsigned char`, so it behaves like a character type everywhere: it prints as text, and it is one of the few types allowed to look at the raw bytes of any other object. It is the right type for a byte of data, and the wrong type for "a small number I want to see printed".
:::

::: key
Use `<cstdint>` exact-width types for anything whose bytes leave the program: telemetry, shared memory, files, buses. Use `int` for local arithmetic and loop counters. Use `std::size_t` for sizes and indices into standard containers, and remember it is unsigned.
:::

## Check yourself

::: check
`sizeof(long)` printed 8. Your ground-station tool is a 64-bit Windows build. A packet field declared `long` is written by the vehicle and read by the tool. What happens, and what does either compiler say about it?
:::

::: answer
The vehicle writes 8 bytes and the tool reads 4, because 64-bit Windows uses the LLP64 data model, where `long` is 32 bits. Every later field is shifted by four bytes, so each decoded value is built from the wrong bytes. Neither compiler says anything: each builds `long` correctly for its own platform, and neither can see the other. The fix is to declare the field `std::int32_t` or `std::int64_t`, so both sides agree, and to check `sizeof` of the whole struct with a `static_assert`, which lesson 13 shows.
:::

::: check
Why is `std::printf("%d\n", sizeof(buf))` wrong, and what catches it?
:::

::: answer
`sizeof` gives a `std::size_t`: unsigned, and 8 bytes here. `%d` tells `printf` to read a 4-byte signed `int`. `printf` is a variadic function — it accepts any number of arguments of any type — so the language itself does not check the arguments against the format. It reads whatever is there and treats it as an `int`. On x86-64 it often prints the right number by luck, but the mismatch is undefined behaviour. The correct specifier is `%zu`. In practice g++ with `-Wall` does catch this, because `-Wformat` knows the rules of `printf`: it reports "format '%d' expects argument of type 'int', but argument 2 has type 'long unsigned int'". That is one more reason never to build without `-Wall`.
:::

::: check
A colleague stores a flight-mode number in a plain `char` because "it only has six values", and tests `if (mode == 200)`. On your x86 laptop the test is never true, even when the byte really holds the pattern for 200. Why? And what should the field have been?
:::

::: answer
Plain `char` is signed on x86, so the byte pattern for 200 means $200 - 256 = -56$. Before comparing, C++ converts both sides to `int`, so nothing is cut off to hide behind: it really compares $-56$ with $200$, and they differ. On an ARM flight processor, where plain `char` is normally unsigned, the same source compares $200$ with $200$ and the branch runs. So this bug appears or vanishes when you change target. The field should be `std::uint8_t`, which is unsigned everywhere, and the 200 should come from a named enumeration instead of a bare number.
:::

::: check
Here `std::int64_t` is `long`. What is wrong with `std::printf("%lld", t)`? And why is the mirror-image habit, writing `%ld` because it works here, worse?
:::

::: answer
`%lld` promises a `long long`, but `t` is a `long`. On this platform the two have the same width and the same bit layout, so the output looks right — but the program relies on a coincidence, and g++ `-Wall` warns: "format '%lld' expects argument of type 'long long int', but argument 2 has type 'int64_t' {aka 'long int'}". The mirror-image habit is worse. `%ld` is correct here, so nothing warns. Move to 64-bit Windows or a 32-bit target, where `long` is 32 bits and `int64_t` is `long long`, and `%ld` reads only 4 of the 8 bytes that were passed. `PRId64` from `<cinttypes>` expands to the right letters on each platform — `"ld"` here — and is the only portable answer.
:::

::: check
You need a counter of commands sent to a thruster during a 20-minute flight, at up to 50 per second. Pick a type and justify it. Then pick again for the same code running on a satellite for ten years.
:::

::: answer
Twenty minutes is $20 \times 60 = 1200$ s. At 50 per second that is $1200 \times 50 = 60{,}000$ commands. A `uint16_t` stops at 65,535, uncomfortably close: a 22-minute flight, or a mode that commands faster, would wrap it. So `std::uint32_t` is the honest choice. It holds about $4.29 \times 10^9$, for two extra bytes. For ten years, a year is about $3.156 \times 10^7$ s, so the count is $10 \times 3.156 \times 10^7 \times 50 \approx 1.58 \times 10^{10}$. That is more than `uint32_t` holds; it would wrap after $4.29 \times 10^9 / 50 / 3.156 \times 10^7 \approx 2.7$ years. So the field must be `std::uint64_t`. The method: work out the worst-case count over the mission, add a margin, pick the smallest exact-width type that holds it, and record the arithmetic in a comment or `static_assert`.
:::

## Summary

| Type | Width here | Guaranteed | Use it for |
| --- | --- | --- | --- |
| `char` | 1 byte, signed | ≥ 8 bits, signedness implementation-defined | text only |
| `short` / `int` | 2 / 4 bytes | ≥ 16 bits each | local arithmetic |
| `long` | 8 bytes (4 on Windows and 32-bit) | ≥ 32 bits | avoid in interfaces |
| `long long` | 8 bytes | ≥ 64 bits | wide local arithmetic |
| `bool` | 1 byte | — | conditions, not packed flags |
| `float` / `double` | 4 / 8 bytes | IEEE-754 binary32 / binary64 in practice | `double` by default |
| `std::int32_t` etc. | exact | exact width, no padding, two's complement | anything on a wire |
| `std::uint8_t` | 1 byte | alias of `unsigned char` | a byte of data; cast to print |
| `std::size_t` | 8 bytes | unsigned, holds any object's size | sizes and container indices |
| `std::ptrdiff_t` | 8 bytes | signed pointer difference | pointer arithmetic |
| `PRId64` from `<cinttypes>` | `"ld"` here | correct format for `int64_t` | printing fixed-width integers |

Lesson 05 takes the unsigned types further: what happens when a narrow type meets an arithmetic operator, why `-1 < 1u` is false, and why signed overflow is a different kind of wrong from unsigned wrap.

::: context bits-and-bytes Bits, bytes, and what a width buys you
A **bit** is one switch: 0 or 1. Eight bits make a **byte**. Each bit doubles the number of patterns, so $N$ bits give $2^N$ patterns: a byte has $2^8 = 256$, a 16-bit type has 65,536, a 32-bit type about 4.29 billion.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="20" y="30" width="40" height="34"/><rect x="60" y="30" width="40" height="34"/>
    <rect x="100" y="30" width="40" height="34"/><rect x="140" y="30" width="40" height="34"/>
    <rect x="180" y="30" width="40" height="34"/><rect x="220" y="30" width="40" height="34"/>
    <rect x="260" y="30" width="40" height="34"/><rect x="300" y="30" width="40" height="34"/>
  </g>
  <g font-size="15" fill="#1d6fd1" text-anchor="middle" font-weight="700">
    <text x="40" y="53">1</text><text x="80" y="53">1</text><text x="120" y="53">0</text><text x="160" y="53">0</text>
    <text x="200" y="53">1</text><text x="240" y="53">0</text><text x="280" y="53">0</text><text x="320" y="53">0</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="22">128</text><text x="80" y="22">64</text><text x="120" y="22">32</text><text x="160" y="22">16</text>
    <text x="200" y="22">8</text><text x="240" y="22">4</text><text x="280" y="22">2</text><text x="320" y="22">1</text>
  </g>
  <text x="180" y="90" font-size="12" fill="#1f2a44" text-anchor="middle">128 + 64 + 8 = 200</text>
</svg>
```

The byte above holds the pattern for 200. Whether that pattern *means* 200 or $-56$ depends on the type you told the compiler.
:::

::: context telemetry-packet What telemetry is
**Telemetry** means "measuring from far away". A vehicle packs its measurements — temperatures, pressures, positions, its current mode — into small blocks of bytes called packets, and radios them to the ground many times a second. Engineers in mission control watch this stream live, and it is recorded for analysis after the flight. Every packet has a fixed layout written down in an interface document. If the flight code and the ground code disagree about that layout by even one byte, every number on the screen after that byte is wrong.
:::

::: context data-models Three data models, one source file
The same C++ types get different widths under the three common data models. The letters say which types are 64 bits: in LP64, **L**ong and **P**ointer; in LLP64, **L**ong **L**ong and **P**ointer; in ILP32, **I**nt, **L**ong and **P**ointer are all 32.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" font-weight="700">
    <text x="120" y="20">int</text><text x="200" y="20">long</text><text x="280" y="20">pointer</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="50" font-weight="700">ILP32</text><text x="10" y="64" font-size="11" fill="#6c7a93">32-bit targets</text>
    <text x="10" y="95" font-weight="700">LP64</text><text x="10" y="109" font-size="11" fill="#6c7a93">Linux, macOS</text>
    <text x="10" y="140" font-weight="700">LLP64</text><text x="10" y="154" font-size="11" fill="#6c7a93">64-bit Windows</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="120" y="38" width="32" height="22" fill="#8fb8f0"/><rect x="200" y="38" width="32" height="22" fill="#8fb8f0"/><rect x="280" y="38" width="32" height="22" fill="#8fb8f0"/>
    <rect x="120" y="83" width="32" height="22" fill="#8fb8f0"/><rect x="200" y="83" width="64" height="22" fill="#f2b880"/><rect x="280" y="83" width="64" height="22" fill="#f2b880"/>
    <rect x="120" y="128" width="32" height="22" fill="#8fb8f0"/><rect x="200" y="128" width="32" height="22" fill="#8fb8f0"/><rect x="280" y="128" width="64" height="22" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="136" y="53">32</text><text x="216" y="53">32</text><text x="296" y="53">32</text>
    <text x="136" y="98">32</text><text x="232" y="98">64</text><text x="312" y="98">64</text>
    <text x="136" y="143">32</text><text x="216" y="143">32</text><text x="312" y="143">64</text>
  </g>
</svg>
```

Only `int` stays put in all three, and even that is a habit of today's machines, not a promise.
:::

::: context twos-complement How a byte holds a negative number
Two's complement is the way nearly every processor stores signed integers, and C++20 made it the only allowed way. Take the 256 patterns of a byte in order. The first half, 0 to 127, mean themselves. The second half, 128 to 255, mean the pattern minus 256, so they run from $-128$ up to $-1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="160" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="40" width="160" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="24" y="32">0</text><text x="336" y="32">255</text>
    <text x="24" y="88">0</text><text x="336" y="88">−1</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="176" y="32" text-anchor="end">127</text><text x="184" y="32">128</text>
    <text x="176" y="88" text-anchor="end">127</text><text x="184" y="88">−128</text>
  </g>
  <line x1="270" y1="36" x2="270" y2="74" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="18" font-size="12" fill="#b4232c" text-anchor="middle">pattern 200</text>
  <text x="270" y="106" font-size="12" fill="#b4232c" text-anchor="middle">means −56</text>
</svg>
```

Top labels are the unsigned meaning, bottom labels the signed meaning. The nice part: adding and subtracting work the same way for both, so the processor needs only one adder.
:::

::: context ieee-754 The rulebook for decimal-point numbers
IEEE 754 is the standard, first published in 1985, that almost every processor follows for floating-point numbers. A binary32 `float` has 1 sign bit, 8 exponent bits and 23 fraction bits, plus a hidden leading 1 for 24 bits of precision. A binary64 `double` has 1, 11 and 52, for 53 bits. C++ does not strictly require IEEE 754, but every platform you will use follows it. The Python module on floating point showed why `0.1 + 0.2` is not `0.3`; the same is true in C++, because it is the same `double`.
:::

::: context header-layout The twelve bytes of the header
Here is `TelemetryHeader` laid out byte by byte. Every field starts at a multiple of its own size, so no filler bytes are needed. Lesson 13 locks this layout in with `static_assert`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="33" y="22">0</text><text x="59" y="22">1</text><text x="85" y="22">2</text><text x="111" y="22">3</text>
    <text x="137" y="22">4</text><text x="163" y="22">5</text><text x="189" y="22">6</text><text x="215" y="22">7</text>
    <text x="241" y="22">8</text><text x="267" y="22">9</text><text x="293" y="22">10</text><text x="319" y="22">11</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="52" height="34" fill="#8fb8f0"/>
    <rect x="72" y="30" width="52" height="34" fill="#fff"/>
    <rect x="124" y="30" width="104" height="34" fill="#f2b880"/>
    <rect x="228" y="30" width="26" height="34" fill="#8fb8f0"/>
    <rect x="254" y="30" width="26" height="34" fill="#fff"/>
    <rect x="280" y="30" width="52" height="34" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="46" y="51">apid</text><text x="98" y="51">seq</text><text x="176" y="51">t_ms</text>
    <text x="241" y="84">mode</text><text x="270" y="96">flags</text><text x="306" y="51">len</text>
  </g>
</svg>
```

Byte numbers along the top; the whole header is exactly 12 bytes.
:::

::: context ccsds The space-packet standard
CCSDS, the Consultative Committee for Space Data Systems, is a group of space agencies that writes shared standards so that one agency's ground station can talk to another's spacecraft. Its space packet begins with a 6-byte primary header. In it, the APID (application process identifier) is 11 bits, so it can name up to 2048 sources on board; the sequence count is 14 bits; and the packet length field is 16 bits. Many missions build their own headers on top of this one.
:::

::: context kib Kilobytes and kibibytes
Memory comes in powers of two, so engineers often count it in **kibibytes**: 1 KiB is $2^{10} = 1024$ bytes, and 1 MiB is $1024 \times 1024$ bytes. A **kilobyte**, kB, is exactly 1000 bytes. The two differ by 2.4 %, and the gap grows with each step up (a MiB is 4.9 % more than a MB). Chip datasheets use KiB for RAM, so a "512 KiB" processor has $524{,}288$ bytes.
:::
