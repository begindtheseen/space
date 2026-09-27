---
id: l10-alignment-and-struct-layout
title: Alignment, padding, and the real size of a struct
minutes: 21
covers:
  - Alignment, alignas, struct padding, offsetof, packing and wire formats
---

Picture a parking lot with numbered spaces. Motorcycles can park in any space. Cars, by the lot's rule, must start on an even-numbered space. Buses must start on a space numbered with a multiple of four. Now park a motorcycle, then a bus, then another motorcycle, in that order. The bus cannot start at space 1, so spaces 1, 2 and 3 stay empty. The lot fills up faster than the vehicles alone would need.

A C++ struct is that parking lot. Its members are the vehicles, and the numbered spaces are **bytes**. The empty spaces are called **padding**: bytes the compiler leaves unused so that every member starts where the processor wants it to. That is why a struct is often bigger than the sum of its members. The extra bytes are not waste the compiler could have avoided; they are the price of the rule.

You need this for three jobs a GNC engineer really does. The first is sizing a telemetry table or a pool of messages, where a careless field order can cost fifty percent more memory than a careful one. The second is reading a struct produced by another team, or another compiler, and knowing whether your declaration agrees with theirs. The third is building a **wire format** — the exact sequence of bytes a packet has on a radio link or a data bus — where the layout must be fixed by the protocol, not by whichever compiler happened to build the code. That third job is the next lesson, and it is the reason this one exists.

The rules are short enough to run in your head. This lesson gives them to you as a recipe you can do on paper and then check against the compiler.

## Alignment

Every byte of memory has a number, its **[[address|byte-addresses]]**. Every type has an **alignment requirement**: an object of that type must begin at an address that is a multiple of that number. `alignof(T)`, read "align-of T", gives the number. It is always a **[[power of two|why-power-of-two]]** — 1, 2, 4, 8, 16.

Here is what g++ 13.3.0 reports on 64-bit Linux, the machine used for every output in this lesson:

```text
alignof: uint8_t 1  uint16_t 2  uint32_t 4  double 8  void* 8
```

For these basic types, alignment equals size on this **[[ABI|abi]]** — the platform's rulebook for how types are laid out in memory. That match is common, but it is not a rule of the language. On 32-bit x86 Linux, for example, a `double` inside a struct needs only 4-byte alignment even though it is 8 bytes long. And `long double` here is 16 bytes with alignment 16, so for it the two numbers happen to agree again.

Two more rules cover structs:

1. **A struct's alignment is the largest alignment among its members.**
2. **A struct's size is a multiple of its own alignment**, which may need padding at the end.

Rule 2 exists because of arrays. The elements of an array sit back to back, each `sizeof(S)` bytes after the last. If `sizeof(S)` were not a multiple of `alignof(S)`, then `arr[1]` would start at a misaligned address. Pointer arithmetic, which steps by exactly `sizeof(S)`, would produce addresses the processor cannot use.

::: key
The compiler inserts padding so each member meets its alignment requirement, and the amounts differ by ABI and compiler. A struct's alignment is the largest of its members' alignments, and its size is rounded up to a multiple of that alignment so that every element of an array stays aligned.
:::

## Computing a layout by hand

Walk through the members in the order they are declared, keeping a running count of bytes used so far. That count is the **offset** — how many bytes from the start of the struct.

1. Start at offset 0.
2. For each member, round the current offset **up** to the next multiple of that member's alignment. That is where the member goes. The bytes you skipped are padding.
3. Add the member's size to the offset.
4. At the end, round the offset up to a multiple of the struct's alignment (its largest member alignment). The result is `sizeof` the struct.

::: example Three layouts, computed and then checked
**A housekeeping record.**

```cpp
struct Status {
    std::uint8_t  mode;
    std::uint16_t raw;
    std::uint8_t  health;
    std::uint32_t count;
};
```

Start at 0. `mode` needs alignment 1, so it goes at 0 and the offset becomes 1. `raw` needs 2: round 1 up to 2, which skips one byte of padding. `raw` goes at 2 and the offset becomes 4. `health` needs 1, so it goes at 4 and the offset becomes 5. `count` needs 4: round 5 up to 8, skipping three bytes. `count` goes at 8 and the offset becomes 12. The struct's alignment is $\max(1, 2, 1, 4) = 4$, read "the largest of 1, 2, 1 and 4". 12 is already a multiple of 4, so `sizeof(Status)` is 12. The members add up to $1 + 2 + 1 + 4 = 8$ bytes, so 4 bytes are padding.

**The exercise's telemetry record.**

```cpp
struct Packet {
    std::uint8_t  id;
    std::uint32_t t_ms;
    std::uint16_t flags;
    double        value;
};
```

`id` goes at 0; offset 1. `t_ms` needs 4: round 1 up to 4 (3 bytes of padding), so it goes at 4; offset 8. `flags` needs 2, and 8 is already a multiple of 2, so it goes at 8; offset 10. `value` needs 8: round 10 up to 16 (6 bytes of padding), so it goes at 16; offset 24. The struct's alignment is 8, and 24 is a multiple of 8, so `sizeof(Packet)` is 24.

The members total $1 + 4 + 2 + 8 = 15$ bytes. So **[[9 of the 24 bytes|packet-picture]]** are padding: $9/24 = 0.375$, or 37.5 percent of the record holds nothing.

**The same fields, widest first.**

```cpp
struct PacketOrdered {
    double        value;
    std::uint32_t t_ms;
    std::uint16_t flags;
    std::uint8_t  id;
};
```

`value` at 0; offset 8. `t_ms` at 8; offset 12. `flags` at 12; offset 14. `id` at 14; offset 15. Round 15 up to a multiple of 8: 16. One byte of padding, all of it at the end.

Now check all three against the compiler. `offsetof(S, m)`, read "offset-of m in S", comes from `<cstddef>` and gives a member's offset in bytes:

```cpp
std::printf("Packet: size %zu align %zu   offsets id=%zu t_ms=%zu flags=%zu value=%zu\n",
            sizeof(Packet), alignof(Packet), offsetof(Packet, id),
            offsetof(Packet, t_ms), offsetof(Packet, flags), offsetof(Packet, value));
```

```text
Status: size 12 align 4   offsets mode=0 raw=2 health=4 count=8
Packet: size 24 align 8   offsets id=0 t_ms=4 flags=8 value=16
PacketOrdered: size 16 align 8   offsets value=0 t_ms=8 flags=12 id=14
```

Every offset matches the hand computation. Reordering the same four fields took the record from 24 bytes to 16 — a third less memory, with no change to any code that uses the fields by name. A pool of 10,000 of these saves $10{,}000 \times 8 = 80{,}000$ bytes, about 80 kB. That is a real amount on a flight computer with a few megabytes of RAM.
:::

::: key
A member goes at the next offset that is a multiple of its own alignment; a struct's alignment is the largest of its members' and its size is rounded up to a multiple of that. Declare members in decreasing order of alignment to minimize padding. Check with `offsetof` and `sizeof`, and freeze the result with `static_assert`.
:::

::: warning
Do not add up the member sizes and call that the struct's size. `Packet` is not 15 bytes in memory; it is 24. The difference only shows up when you allocate a big array of them, or when another program reads your bytes and expects 15.
:::

## Freezing a layout you depend on

`offsetof` and `sizeof` are **constant expressions**: the compiler knows their values while it compiles. So a layout assumption can be a compile-time check instead of a comment. `static_assert(condition, "message")` stops the build with that message if the condition is false:

```cpp
static_assert(sizeof(Packet) == 24, "layout changed");
static_assert(offsetof(Packet, value) == 16, "layout changed");
```

Put checks like these next to any struct whose layout something outside the program depends on: a shared-memory region, a log file format, a structure read by ground software. The next person to insert a field gets a compile error naming the assumption, instead of a corrupt telemetry stream three months later.

`offsetof` is guaranteed to work only for **[[standard-layout|standard-layout]]** types — plain, C-like structs. Every wire-facing struct you write should be one, and you can say so in code:

```cpp
static_assert(std::is_standard_layout_v<Packet>);
```

## `alignas`: asking for more

`alignas(N)`, read "align-as N", raises the alignment of an object or a type to `N`. It can only raise it. You cannot use it to lower alignment below what the type needs, and so it can never remove padding.

It has three real uses.

**Raw storage for objects.** Lesson 06 used `alignas(T) unsigned char storage_[sizeof(T) * N];`. The byte array alone would have alignment 1; `alignas(T)` gives it `T`'s alignment, so placement `new` may build a `T` there.

**Keeping two cores out of each other's way.** Processors move memory into their caches in chunks called **cache lines**, usually 64 bytes. If two variables written by two different cores share one line, every write by one core throws away the other core's copy of the whole line. That slowdown is called **[[false sharing|false-sharing]]**. `alignas(64)` on each variable puts them on separate lines.

**Hardware requirements.** A **[[DMA|dma]]** engine may insist its buffer start on a 32- or 64-byte boundary, and some vector instructions insist on 16 or 32. Writing `alignas(32) std::array<double, 64> buffer;` states that in the declaration, where the compiler enforces it, rather than in a comment.

## Packing, and why it is the wrong tool for a wire format

Compilers offer a way to remove padding entirely: `__attribute__((packed))` on g++ and clang, or `#pragma pack`, which more compilers understand. It does exactly what it says. The struct shrinks to the sum of its members.

::: example A packed record: 15 bytes, and a warning worth heeding
```cpp
struct __attribute__((packed)) PacketPacked {
    std::uint8_t  id;
    std::uint32_t t_ms;
    std::uint16_t flags;
    double        value;
};

PacketPacked g_packet{1, 20, 0, -9.81};
```

```text
PacketPacked: size 15 align 1   offsets id=0 t_ms=1 flags=5 value=7
&g_packet.value mod 8 = 7
value = -9.81
```

Read the output line by line. The size is 15 bytes, exactly the sum of the members, and the alignment has dropped to 1. `value` now starts at offset 7. The object `g_packet` happened to sit on a multiple of 8, so `value`'s address leaves a remainder of 7 when divided by 8. (Read `mod` as "the remainder after dividing by".) A `double` wants remainder 0. So `value` is **[[misaligned|misaligned-load]]**.

Reading `g_packet.value` directly is fine. The compiler knows this member is packed and emits whatever instructions the target needs. The trouble starts when the member's address escapes into an ordinary pointer. g++ 13.3.0 warns about that with no flags at all — not even `-Wall`:

```text
l10-packed.cpp:21:23: warning: taking address of packed member of 'PacketPacked' may result in an unaligned pointer value [-Waddress-of-packed-member]
   21 |     const double* q = &g_packet.value;     // pointer to a misaligned member
      |                       ^~~~~~~~~~~~~~~
```

A `const double*` promises an 8-aligned address, and this one breaks the promise. Reading through it is undefined behavior. **[[UndefinedBehaviorSanitizer|ubsan]]**, built with `-fsanitize=address,undefined -fno-sanitize-recover=all`, says so and exits with status 1:

```text
l10-packed.cpp:22:16: runtime error: load of misaligned address 0x55a51087d027 for type 'const double', which requires 8 byte alignment
```

Without the sanitizer, the same program on x86-64 printed `-9.81` and exited with status 0, because this processor's load instructions tolerate misalignment. Many ARM and DSP processors do not. On some the same load traps; on others it quietly reads from the address with the low bits cleared, which means reading the wrong bytes. So "we use packed structs and it works" is a statement about one processor.
:::

The number 15 is the size the protocol wants. Even so, there are three reasons not to use packing for a wire format.

- **`packed` is not standard C++.** The spelling differs between compilers, and so does the way `#pragma pack` treats nested structs.
- **It does not fix byte order.** A packed struct still stores `t_ms` in the host processor's byte order, so the same 15 bytes mean different numbers on a machine that orders bytes the other way. The next lesson is about exactly this.
- **It trades a layout problem for an alignment problem.** Every pointer or reference to a member is now suspect. And the compiler may have to read the members one byte at a time, which is slower than the padded version.

The answer with none of these problems is to keep your in-memory struct naturally aligned and **serialize field by field** — copy each field, one at a time, into a byte buffer, in the order and byte order the protocol specifies. That costs a few lines and works on every compiler and every processor. Lesson 11 builds it.

::: key
Serialize field by field in a defined order, placing each byte with shifts so the endianness is fixed (use memcpy only to get a float's bit pattern into an integer), instead of memcpy-ing the whole struct. `alignas(N)` can raise alignment but never lower it or remove padding; `__attribute__((packed))` removes padding but is non-standard, misaligns members, and does not fix byte order.
:::

::: warning
Do not `memcpy` a whole struct into a wire buffer, even a packed one. The padding bytes of an ordinary struct have unspecified values. They are not guaranteed to be zero, even after you initialize every member with braces. So the same packet can produce different bytes on two runs, which breaks checksums and makes recorded captures impossible to compare. Copy each field.
:::

## Check yourself

::: check
Compute `sizeof` and every offset for `struct T { double a; std::uint8_t b; double c; std::uint8_t d; };`, then say what reordering saves.
:::

::: answer
`a` needs 8, goes at 0; offset 8. `b` needs 1, goes at 8; offset 9. `c` needs 8: round 9 up to 16 — seven bytes of padding — so it goes at 16; offset 24. `d` goes at 24; offset 25. The struct's alignment is 8, so round 25 up to 32.

So `sizeof(T)` is 32, with offsets 0, 8, 16 and 24. The members total $8 + 1 + 8 + 1 = 18$ bytes, so 14 bytes are padding.

Reorder as `double a; double c; std::uint8_t b; std::uint8_t d;`. The doubles sit at 0 and 8, the two single bytes at 16 and 17, and the total of 18 rounds up to 24. That is 32 down to 24, a quarter saved, only by putting the wide members first. g++ agrees: 32 and 24.
:::

::: check
Why must a struct's size be a multiple of its alignment? Build the failure that would happen if it were not.
:::

::: answer
Because of arrays and pointer arithmetic. Suppose `struct U { double x; char c; };` had size 9 instead of 16, with alignment 8. In `U arr[2]`, `arr[1]` would begin 9 bytes after `arr[0]`. If `arr[0]` starts on a multiple of 8, `arr[1].x` starts 1 past a multiple of 8 — a misaligned `double`. Every access to the second element would be undefined behavior, and on a processor that traps on misaligned loads the array would be unusable.

Pointer arithmetic makes the same point: `p + 1` moves forward by exactly `sizeof(U)` bytes. If that step does not keep alignment, no array of `U` can be walked. Padding at the end is what keeps the step aligned, which is why the rounding happens at the end of the struct and not only between members.
:::

::: check
A colleague adds `std::uint64_t seq;` to the front of the 24-byte `Packet`, and the ground software starts decoding garbage. The header has `static_assert(sizeof(Packet) == 24)`. What happened, and what should have been asserted?
:::

::: answer
The `static_assert` did its job: with `seq` at the front, the struct becomes 32 bytes and the build failed. That is the good outcome. So if the ground software saw garbage, someone either deleted the check or changed it to 32 without asking what else had moved.

Size is the weakest thing to assert. It catches a change in total size, but not two fields swapped, and not a change that shifts every offset while the total happens to stay the same. The stronger set is one `static_assert` per member offset, plus the size, plus `std::is_standard_layout_v`.

Better still, do not make the ground depend on the struct's layout at all. The ground software should decode a defined byte sequence produced by a serializer, not a copy of memory. Then adding a field to the in-memory struct cannot change the wire format unless someone also edits the serializer.
:::

::: check
`-Waddress-of-packed-member` is on by default in g++ 13.3.0. `-Wdangling-reference` needs `-Wextra`, and `-Wstack-usage=` only works if you give it a number. What does that ordering tell you?
:::

::: answer
That compiler authors grade warnings by how often they are false alarms and how likely the flagged code is to be wrong. Taking the address of a packed member is almost always a real portability defect with almost no legitimate use, so it is on with no flags at all.

A possibly dangling reference needs reasoning about lifetimes across a function call, and that reasoning can be fooled by a function that returns a reference to something that really does outlive the call. So it sits behind `-Wextra`.

A stack-usage limit is a project policy, not a defect: the compiler cannot know how big your task's stack is, so you must give it the number.

The practical lesson is that a project's warning flags are a decision, not a default: `-Wall -Wextra -Wpedantic`, plus `-Wshadow`, `-Wconversion`, `-Wframe-larger-than=` and whatever else the target needs, all under `-Werror`, which turns warnings into errors.
:::

::: check
When is `alignas` the right answer, and when is it a sign you have misunderstood the problem?
:::

::: answer
It is right when something outside the type system needs stronger alignment than the type itself: raw storage that will hold a `T` built by placement `new`, a DMA buffer that must start on a 32-byte boundary, a vector load that needs 16 or 32, or two variables you want on separate cache lines to avoid false sharing. In each case the need comes from hardware or from a use the declaration cannot express, and `alignas` puts it where the compiler can enforce it.

It is a misunderstanding when you use it to try to *control layout* — to make a struct come out at a particular size, or to line its members up with a wire format. `alignas` can only increase alignment. It can never remove padding, so it can never shrink a struct. And a wire format should not be a copy of a struct's memory in the first place. If you reach for `alignas` to make `sizeof` come out right, what you want is a serializer.
:::

## Summary

| Rule | Detail |
| --- | --- |
| `alignof(T)` | the address multiple `T` must start on; always a power of two |
| this ABI | `uint8_t` 1, `uint16_t` 2, `uint32_t` 4, `double` 8, `void*` 8 |
| member placement | next offset that is a multiple of the member's alignment |
| struct alignment | the largest alignment among the members |
| struct size | rounded up to a multiple of the struct's alignment, so arrays stay aligned |
| minimizing padding | declare members in decreasing order of alignment |
| worked results | `Status` 12; `Packet` 24 with 9 bytes padding; reordered 16 with 1 |
| `offsetof(S, m)` | the member's byte offset, a constant expression; needs standard layout |
| freezing a layout | `static_assert` on `sizeof` *and* each `offsetof` |
| `alignas(N)` | raises alignment; cannot lower it and cannot remove padding |
| `__attribute__((packed))` | removes all padding; non-standard, misaligns members, does not fix byte order |
| `-Waddress-of-packed-member` | on by default in g++ 13.3.0; the pointer it warns about is undefined to read through |
| wire formats | serialize field by field in a defined order and byte order, never the whole struct |

Lesson 11 takes the 15 bytes the protocol wants and produces them portably: byte order, field-by-field serialization, and a round-trip test you can trust.

::: context byte-addresses Memory is one long numbered street
To the processor, memory is one long row of bytes, each with a number: its address. A pointer holds one of these numbers. Addresses are usually written in hexadecimal, so `0x1000` is 4096.

Alignment is a rule about those numbers. "Alignment 4" means the address must divide evenly by 4: 0, 4, 8, 12 and so on. In the picture, a 4-byte `uint32_t` may start at 4 or 8, but not at 5.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="20" y="30" width="26" height="30"/><rect x="46" y="30" width="26" height="30"/><rect x="72" y="30" width="26" height="30"/><rect x="98" y="30" width="26" height="30"/>
    <rect x="124" y="30" width="26" height="30" fill="#8fb8f0"/><rect x="150" y="30" width="26" height="30" fill="#8fb8f0"/><rect x="176" y="30" width="26" height="30" fill="#8fb8f0"/><rect x="202" y="30" width="26" height="30" fill="#8fb8f0"/>
    <rect x="228" y="30" width="26" height="30"/><rect x="254" y="30" width="26" height="30"/><rect x="280" y="30" width="26" height="30"/><rect x="306" y="30" width="26" height="30"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="33" y="50">0</text><text x="59" y="50">1</text><text x="85" y="50">2</text><text x="111" y="50">3</text>
    <text x="137" y="50">4</text><text x="163" y="50">5</text><text x="189" y="50">6</text><text x="215" y="50">7</text>
    <text x="241" y="50">8</text><text x="267" y="50">9</text><text x="293" y="50">10</text><text x="319" y="50">11</text>
  </g>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="20" y1="22" x2="20" y2="68"/><line x1="124" y1="22" x2="124" y2="68"/><line x1="228" y1="22" x2="228" y2="68"/><line x1="332" y1="22" x2="332" y2="68"/>
  </g>
  <text x="176" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">uint32_t at address 4</text>
  <text x="176" y="102" font-size="11" text-anchor="middle" fill="#b4232c">red lines: multiples of 4, where it may start</text>
  <text x="20" y="16" font-size="11" fill="#1f2a44">address</text>
</svg>
```
:::

::: context why-power-of-two Why the hardware cares
A processor does not fetch memory one byte at a time. It fetches in fixed-size chunks — 4, 8, 64 bytes — and each chunk starts at a multiple of its own size. A value that lies inside one chunk arrives in one fetch. A value that straddles two chunks needs two fetches and some shuffling, or the processor refuses.

Chunk sizes are powers of two because addresses are binary. Checking "is this address a multiple of 8?" is then only a check that the lowest three bits are zero, which costs the hardware almost nothing. That is also why `alignof` is always a power of two.
:::

::: context abi The rulebook the compiler follows
ABI stands for **application binary interface**. It is the written agreement, for one processor and operating system, about how programs lay out data and call functions: how big each type is, how it is aligned, which registers carry arguments, and so on. On 64-bit Linux it is the System V AMD64 ABI.

Two programs built by different compilers can call each other only because both follow the same ABI. Struct layout is part of it, which is why a struct's size can change when you move to a different processor — a different ABI — even though your source code has not changed.
:::

::: context packet-picture The Packet, byte by byte
Each small square is one byte. Colored blocks are members; grey blocks are padding. The top row is `Packet` as declared: 24 bytes, 9 of them padding. The bottom row is the same four fields, widest first: 16 bytes, 1 of them padding.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="24" y="24" width="13" height="30" fill="#f2b880"/>
    <rect x="37" y="24" width="39" height="30" fill="#6c7a93" fill-opacity="0.35"/>
    <rect x="76" y="24" width="52" height="30" fill="#8fb8f0"/>
    <rect x="128" y="24" width="26" height="30" fill="#f2b880"/>
    <rect x="154" y="24" width="78" height="30" fill="#6c7a93" fill-opacity="0.35"/>
    <rect x="232" y="24" width="104" height="30" fill="#1d6fd1"/>
    <rect x="24" y="80" width="104" height="30" fill="#1d6fd1"/>
    <rect x="128" y="80" width="52" height="30" fill="#8fb8f0"/>
    <rect x="180" y="80" width="26" height="30" fill="#f2b880"/>
    <rect x="206" y="80" width="13" height="30" fill="#f2b880"/>
    <rect x="219" y="80" width="13" height="30" fill="#6c7a93" fill-opacity="0.35"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="43">id</text><text x="102" y="43">t_ms</text><text x="141" y="43">flags</text><text x="193" y="43">padding</text>
    <text x="154" y="99">t_ms</text><text x="193" y="99">flags</text><text x="212" y="99">id</text>
  </g>
  <text x="284" y="43" font-size="11" text-anchor="middle" fill="#fff">value</text>
  <text x="76" y="99" font-size="11" text-anchor="middle" fill="#fff">value</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="24" y="18">0</text><text x="128" y="18">8</text><text x="232" y="18">16</text><text x="336" y="18">24</text>
    <text x="24" y="74">0</text><text x="128" y="74">8</text><text x="232" y="74">16</text>
  </g>
  <text x="244" y="99" font-size="11" fill="#1f2a44">16 bytes</text>
  <text x="24" y="126" font-size="11" fill="#1f2a44">top: Packet, 24 bytes · bottom: widest first</text>
</svg>
```
:::

::: context standard-layout What counts as standard-layout
A **standard-layout** type is one whose layout the language promises to be as plain as a C struct: members in declaration order, the first member at offset 0, no hidden extras. Roughly, it needs no virtual functions and no virtual base classes, the same access (`public` or `private`) for every data member, all data members declared in one class of any inheritance chain, and members that are themselves standard-layout.

Every struct in this lesson qualifies. A class with a `virtual` function does not, because the compiler adds a hidden pointer to it.
:::

::: context false-sharing Two cores fighting over one cache line
Each core keeps its own copy of recently used cache lines. When one core writes to a line, the hardware tells every other core to throw its copy away. If two unrelated counters, each written by a different core, live in the same 64-byte line, the line bounces between the cores on every write, even though they never touch each other's variable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="160" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="24" y="24" width="30" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="58" y="24" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="39" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <text x="73" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="100" y="68" font-size="11" text-anchor="middle" fill="#b4232c">one 64-byte line: shared</text>
  <rect x="200" y="20" width="140" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="204" y="24" width="30" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="219" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <rect x="200" y="76" width="140" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="204" y="80" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="219" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="270" y="68" font-size="11" text-anchor="middle" fill="#1d6fd1">alignas(64): a line each</text>
</svg>
```
:::

::: context dma Hardware that copies memory by itself
**DMA** stands for **direct memory access**. A DMA engine is a small piece of hardware that moves data between a device — a radio, an analog-to-digital converter, a star tracker's camera — and memory while the main processor does other work. Flight computers lean on DMA to stream sensor samples in without spending processor time on every byte.

DMA engines are simple, so they often demand simple addresses: a buffer starting on a 32- or 64-byte boundary, for instance. The chip's reference manual gives the number.
:::

::: context misaligned-load A double that straddles two words
In the packed struct, `value` occupies bytes 7 to 14. An 8-byte load wants bytes 0 to 7 or 8 to 15 — one aligned word. This value starts in the first word and ends in the second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="160" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="30" width="160" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="160" y="34" width="160" height="22" fill="#b4232c" fill-opacity="0.25" stroke="#b4232c" stroke-width="1.5"/>
  <text x="240" y="49" font-size="11" text-anchor="middle" fill="#1f2a44">value: bytes 7 to 14</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="20" y="22">0</text><text x="160" y="22">7</text><text x="180" y="22">8</text><text x="340" y="22">16</text>
  </g>
  <text x="100" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">aligned word 0–7</text>
  <text x="260" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">aligned word 8–15</text>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#b4232c">one value, two words: some processors trap</text>
</svg>
```

x86-64 does the two fetches for you, a little slower. Many embedded processors do not.
:::

::: context ubsan A sanitizer for the rules ASan does not watch
Lesson 09's AddressSanitizer watches *where* you read and write: out of bounds, after free. **UndefinedBehaviorSanitizer** (UBSan) watches for other broken rules: misaligned pointers, signed integer overflow, shifting by too many bits, and more. You turn both on together with `-fsanitize=address,undefined`.

By default UBSan prints a message and carries on. `-fno-sanitize-recover=all` makes it stop the program at the first error instead, which is what you want in a test run so a failure cannot scroll past unnoticed.
:::
