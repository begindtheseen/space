---
id: l04-fundamental-and-fixed-width-types
title: Fundamental types, cstdint and size_t
minutes: 19
covers:
  - Fundamental types; fixed-width types from cstdint; size_t
---

A Python `int` has no width. It grows until memory runs out, and `2**70` is as ordinary as `3`. A Python `float` is always a C `double`. You have never had to choose a numeric type, and nothing in your Python experience prepares you for the fact that C++ offers about fourteen integer types, that most of them have no fixed size, and that choosing wrongly silently corrupts data rather than raising an exception.

This matters most where software meets hardware, which for a GNC engineer is most places. A telemetry packet is a contract: the flight computer writes bytes, the ground station reads them, and the two were compiled by different toolchains, possibly for different processors, possibly years apart. A struct whose field widths depend on the compiler is not a contract. The same applies to a shared-memory region between two processors on the vehicle, a message on a CAN bus, and a log file that a post-flight tool will parse.

This lesson gives you the type vocabulary, what the standard actually guarantees about it, and the rule for choosing a type for a field you have to transmit. The measurements below come from g++ 13.3.0 on x86-64 Linux; where a number is platform-specific, that is said explicitly, because the point of the lesson is knowing which numbers travel and which do not.

## What the standard guarantees, and what it does not

The signed integer types are `signed char`, `short`, `int`, `long` and `long long`, each with an `unsigned` counterpart. The standard does not fix their widths. It fixes only *minimums* and an ordering:

| Type | Minimum width the standard requires |
| --- | --- |
| `char` | 8 bits, and `sizeof(char) == 1` by definition |
| `short` | 16 bits |
| `int` | 16 bits |
| `long` | 32 bits |
| `long long` | 64 bits |

and `sizeof(char) <= sizeof(short) <= sizeof(int) <= sizeof(long) <= sizeof(long long)`. Everything else is up to the implementation. Note the consequence of the second line: `sizeof` counts `char`s, not bytes-as-octets — on a machine where a `char` is 16 bits, `sizeof(int)` might be 2 while `int` is 32 bits wide. Every machine you will meet has 8-bit `char`s, and `CHAR_BIT` from `<climits>` is 8, but the standard does not promise it.

Here is what this machine actually reports:

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

The dangerous line is `long`. Eight bytes here; four bytes on 64-bit Windows, and four bytes on any 32-bit target. You do not need a second machine to see it move — ask the same compiler for a 32-bit target and read its own predefined macros:

```bash
g++ -dM -E -x c++ /dev/null | grep __SIZEOF_LONG__
g++ -m32 -dM -E -x c++ /dev/null | grep __SIZEOF_LONG__
```

```text
#define __SIZEOF_LONG__ 8
#define __SIZEOF_LONG__ 4
```

One compiler, one machine, one afternoon, and `long` changed width. `__SIZEOF_POINTER__` goes from 8 to 4 with it. These combinations have names — Linux x86-64 is **LP64** (`long` and pointers are 64-bit, `int` is 32), 64-bit Windows is **LLP64** (only `long long` and pointers are 64-bit) — and a struct written with `long` in it has a different layout under each.

::: warning
`int` is 32 bits on every desktop and server platform in current use, and that stability makes it tempting to treat `int` as "the 32-bit type". It is not: it is 16 bits on some embedded targets, and the standard permits 16. Use `int` for loop counters and local arithmetic, where its width does not escape the function. Never use it for a field whose bytes leave the program.
:::

### `char` is three types, and its sign is not yours to assume

`char`, `signed char` and `unsigned char` are three *distinct* types — unlike `int` and `signed int`, which are the same type. Whether plain `char` is signed is implementation-defined. On x86 it is normally signed; on ARM and PowerPC it is normally unsigned, which is why a program that worked on a laptop can misbehave on a flight processor.

You can watch the compiler change its mind. This program asks the library what plain `char` is:

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

Same source, same machine, one flag, two answers. The rule that follows: use `char` only for text. For a byte of data, write `std::uint8_t`; for small arithmetic, write `std::int8_t`.

### `bool`, and the floating types

`bool` holds `true` or `false` and occupies one byte here — `sizeof(bool)` is not required to be 1, and a `bool` inside a struct still costs a whole byte, so a packed flags field wants an integer with named bits, not eight `bool`s.

`float` is IEEE-754 binary32 (about 7 decimal digits), `double` is binary64 (about 16 digits). `long double` is 16 bytes here but carries only 64 bits of significand: it is the x87 80-bit format, padded out for alignment. It is 8 bytes on MSVC and nothing special at all on ARM, so never put it in a wire format. The numerical-methods module covers precision; for now, `double` is the default for physics and `float` is what you use when you have measured that you can afford it.

## Fixed-width types: `<cstdint>`

`<cstdint>` gives types whose widths are in their names:

| Family | Members | What it promises |
| --- | --- | --- |
| Exact | `int8_t`, `int16_t`, `int32_t`, `int64_t` and `uint…` | exactly that many bits, no padding, two's complement |
| Least | `int_least8_t` … | at least that many bits, smallest such type |
| Fast | `int_fast8_t` … | at least that many bits, fastest such type |
| Pointer | `intptr_t`, `uintptr_t` | wide enough to hold a pointer |
| Maximum | `intmax_t`, `uintmax_t` | the widest integer the implementation has |

The exact-width types are technically optional: an implementation provides `int32_t` only if it has a 32-bit type with no padding bits. Every implementation you will use has them. They are not new types — they are aliases. On this platform `std::int32_t` *is* `int`, `std::int64_t` *is* `long` (not `long long`), and `std::uint8_t` *is* `unsigned char`. Two consequences follow, and both bite.

**`uint8_t` is a character type.** Print one and you get text:

```text
mode as %d = 65, as %c = A
```

`std::cout << my_uint8` prints `A` too. Lesson 12 gives the fix; the habit is to cast to `int` or `unsigned` before printing a byte.

**`int64_t` is not always `long long`.** `printf("%lld", t_ns)` is wrong here, where `int64_t` is `long`. `<cinttypes>` supplies the right format string as a macro:

```cpp
std::int64_t t_ns = 1234567890123456789;
std::printf("value = %" PRId64 "\n", t_ns);
```

```text
PRId64 = "ld", value = 1234567890123456789
```

`PRId64` expanded to `"ld"` on this platform and would expand to `"lld"` on one where `int64_t` is `long long`. That is the whole point of the macro.

::: key
`int` and `long` have implementation-defined width, so a struct written as a wire format or shared with another processor can change size across a toolchain change. `int32_t` and `uint8_t` state exactly what is on the wire.
:::

## `std::size_t` and `std::ptrdiff_t`

`std::size_t` is an unsigned integer type large enough to hold the size of any object. It is what `sizeof` returns, what `std::vector::size()` returns, and what every standard-library index takes. It is 8 bytes here and 4 bytes on a 32-bit target — it tracks the pointer width, not `int`.

`std::ptrdiff_t` is its signed companion: the type of the difference between two pointers, 8 bytes here.

Both come from `<cstddef>`. `printf` prints a `size_t` with `%zu` — not `%d`, which is a different width and a different signedness and, strictly, undefined behaviour.

The important property of `size_t` is that it is **unsigned**, and that is the source of the single most common loop bug in C++. `v.size() - 1` on an empty container is not $-1$; it is

```text
empty v.size()-1  = 18446744073709551615
```

which is $2^{64}-1$. Unsigned arithmetic is defined to wrap, so nothing is undefined here and nothing warns — the value is simply enormous, and a loop condition like `i >= 0` on an unsigned type is true forever. Lesson 05 takes this apart properly; for now, note that the type you must use to index containers is the type that does this.

::: example Choosing the types for a telemetry header
Design the fixed part of a downlink packet. For each field, ask: what is the full range this value can take, including faults, and what happens when it exceeds it?

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

```text
sizeof(TelemetryHeader) = 12
offsets: apid=0 seq=2 t_ms=4 mode=8 flags=9 len=10
uint32 ms rolls over after 49.7 days
uint16 seq counter rolls over after 65536 packets
```

Twelve bytes, and every offset is a multiple of the field's own size, so the compiler inserted no padding. The justifications:

- `apid` is an 11-bit identifier in the CCSDS space-packet standard, so 16 bits is the smallest type that holds it.
- `seq_count` is *designed* to wrap; unsigned wrap is defined behaviour, so `++seq` on a `uint16_t` is correct and needs no special case. $65536$ packets at 10 Hz is about 1.8 hours between rollovers, and the ground station reconstructs the high bits.
- `t_ms` as `uint32_t` covers $2^{32}$ ms = 49.7 days. Ample for a launch, wrong for a station module: an ISS payload wants `uint64_t` microseconds. State the mission duration when you justify a time field.
- `mode` and `flags` are one byte each because the mode enumeration has fewer than 256 values and flags are bits. Lesson 10 shows how to keep the enumeration and the byte in step.
- `payload_len` as `uint16_t` caps a packet at 65,535 bytes, which is the same order as the CCSDS packet-length limit — check your project's interface control document for the exact figure. The point is that the type encodes the protocol's constraint rather than leaving it to a comment.

Now write the same struct with `int`, `long` and `bool` instead. It compiles, it runs, and it is 24 bytes here and a different number on the ground station's Windows build, so the first field the decoder reads after `t_ms` is garbage. Nothing warns, because nothing is wrong as far as either compiler can see. This is the whole argument for `<cstdint>` in one paragraph.
:::

::: example Sizing an IMU sample buffer
A 1 kHz IMU delivers three accelerations and three angular rates. You must hold five seconds of history in a fixed buffer.

Choose `float` for each channel: an accelerometer good to $10^{-4}\,\mathrm{m/s^2}$ over a $\pm 160\,\mathrm{m/s^2}$ range needs about $\log_2(320/10^{-4}) \approx 21.6$ bits of mantissa, and binary32 provides 24. Six channels at 4 bytes is 24 bytes, plus a `uint32_t` timestamp is 28, and the compiler will not pad it because every member is 4-byte aligned.

Five seconds at 1 kHz is 5000 samples, so

$$
5000 \times 28\,\mathrm{bytes} = 140{,}000\,\mathrm{bytes} = 136.7\,\mathrm{KiB}.
$$

Check it against your budget before writing a line of code — on a flight processor with 512 KiB of RAM that buffer is a quarter of everything you have. Had you reached for `double` out of habit, the six channels would be 48 bytes, the sample 56 (the `uint32_t` pads out to the 8-byte alignment), and the buffer 280,000 bytes: more than half the RAM for precision the sensor does not have. The type choice *is* the design.
:::

::: warning
`std::uint8_t` is an alias for `unsigned char`, so it inherits every character-type behaviour: it prints as text, it is what `std::string` is made of, and it is one of the few types allowed to alias any other object's bytes. It is the right type for a byte of data and the wrong type for "a small number I want to see".
:::

::: key
Use `<cstdint>` exact-width types for anything whose bytes leave the program: telemetry, shared memory, files, buses. Use `int` for local arithmetic and loop counters. Use `std::size_t` for sizes and indices into standard containers, and remember it is unsigned.
:::

## Check yourself

::: check
`sizeof(long)` printed 8. Your ground-station tool is a 64-bit Windows build. A packet field declared `long` is written by the vehicle and read by the tool. What happens, and what does the compiler say about it?
:::

::: answer
The vehicle writes 8 bytes and the tool reads 4, because 64-bit Windows uses the LLP64 data model where `long` is 32 bits. Every field after it in the packet is then misaligned by four bytes, so the decoded values are not merely wrong but structurally wrong — the tool reads half of one field and half of the next. Neither compiler says anything: each is correctly implementing `long` for its own platform, and neither can see the other. The only defence is to declare the field `std::int32_t` or `std::int64_t` so both sides agree, and to check `sizeof` of the whole struct with a `static_assert`, which lesson 13 shows.
:::

::: check
Why is `std::printf("%d\n", sizeof(buf))` wrong, and what breaks?
:::

::: answer
`sizeof` yields a `std::size_t`, which is unsigned and 8 bytes here, while `%d` tells `printf` to read a 4-byte signed `int`. `printf` is variadic, so the compiler cannot check the argument against the format automatically from the type system — it reads whatever bytes the calling convention put there and interprets them as an `int`. The result is a wrong number on a good day and undefined behaviour on principle. The correct specifier is `%zu`. In practice g++ with `-Wall` does catch this specific case with `-Wformat`, because it special-cases `printf`, which is a good reason never to build without `-Wall`.
:::

::: check
A colleague stores a flight-mode enumerator in a `char` because "it only has six values", and compares it with `if (mode == 200)`. On your x86 laptop the comparison is never true even when the byte really does contain 200. Why, and what should the field have been?
:::

::: answer
Plain `char` is signed on x86, so a byte holding the bit pattern for 200 has the value $200 - 256 = -56$, and $-56 \ne 200$. The comparison also promotes both sides to `int` before comparing, so there is no truncation to hide behind — it genuinely compares $-56$ with $200$. On an ARM flight processor, where plain `char` is normally unsigned, the same source would compare $200$ with $200$ and the branch would be taken, so this is a bug that appears or disappears when you change target. The field should be `std::uint8_t`, which is unsigned everywhere, and the constant should come from a named enumeration rather than a literal.
:::

::: check
Given `std::int64_t` is `long` here, what is wrong with `std::printf("%lld", t)`, and why does the problem disappear on many other machines?
:::

::: answer
`%lld` tells `printf` to read a `long long`. On this platform `int64_t` is `long`, a different type — the same width and the same representation, so in practice the bytes line up and the output looks right, but the program is relying on a coincidence of the ABI rather than on anything guaranteed. On a platform where `int64_t` is `long long` the specifier is correct, which is exactly why the bug hides: it is invisible until you move to a platform where `long` is 32 bits, and then `%lld` reads eight bytes where four were pushed. `PRId64` from `<cinttypes>` expands to whatever is right for the platform — `"ld"` here — and is the only portable answer.
:::

::: check
You need a counter of commands sent to a thruster over a 20-minute flight, at up to 50 Hz. Pick a type and justify it. Then say what you would pick if the same code had to run on a satellite for ten years.
:::

::: answer
Twenty minutes at 50 Hz is $20 \times 60 \times 50 = 60{,}000$ commands. That exceeds the 65,535 limit of `uint16_t` uncomfortably closely — a 22-minute flight or a mode that commands faster would wrap — so `std::uint32_t` is the honest choice, with $4.29 \times 10^9$ of headroom, at a cost of two extra bytes. For ten years at 50 Hz the count is $10 \times 3.156\times10^7 \times 50 \approx 1.58 \times 10^{10}$, which overflows `uint32_t` ($4.29 \times 10^9$) after about 2.7 years, so the field must be `std::uint64_t`. The general method: compute the worst-case count over the full mission, multiply by a safety factor, and choose the smallest exact-width type that holds it — then write a `static_assert` or a comment recording the arithmetic, because the next person will not redo it.
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

Lesson 05 takes the unsigned types further: what happens when a narrow type meets an arithmetic operator, why `-1 < 1u` is false, and why signed overflow is in a different category of wrong from unsigned wrap.
