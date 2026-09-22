---
id: l10-alignment-and-struct-layout
title: Alignment, padding, and the real size of a struct
minutes: 17
covers:
  - Alignment, alignas, struct padding, offsetof, packing and wire formats
---

A struct is bigger than the sum of its members, and the extra bytes are not waste the compiler could have avoided. They are there because the processor requires objects of each type to start at an address that is a multiple of that type's alignment, and because an array of the struct must keep every element aligned too.

You need this for three jobs a GNC engineer actually does. Sizing a telemetry table or a message pool, where a careless field order can cost fifty per cent more memory than a careful one. Reading a struct produced by another team, or another compiler, and knowing whether your declaration agrees with theirs. And building a wire format, where the layout must be fixed by the protocol rather than by whichever ABI compiled it — which is the subject of the next lesson and the reason this one exists.

The rules are short enough to do in your head, and this lesson gives them to you as an algorithm you can run on paper and then check against the compiler.

## Alignment

Every type has an **alignment requirement**: an object of that type must begin at an address that is a multiple of it. `alignof(T)` gives the number, and it is always a power of two.

```text
alignof: uint8_t 1  uint16_t 2  uint32_t 4  double 8  void* 8
```

For the fundamental types on this ABI, alignment equals size. That is not a rule of the language — it is the most common arrangement, and `alignof(long double)` is 16 while its size is 16 too, whereas on a 32-bit ARM target `alignof(double)` is often 4.

Two derived rules cover structs:

1. **A struct's alignment is the largest alignment among its members.**
2. **A struct's size is a multiple of its own alignment**, which may require padding at the end.

Rule 2 exists because of arrays. If `sizeof(S)` were not a multiple of `alignof(S)`, then `arr[1]` would start at a misaligned address, and pointer arithmetic — which adds `sizeof(S)` — would produce addresses the processor cannot use.

## Computing a layout by hand

Walk the members in declaration order, keeping a running offset.

1. Start at offset 0.
2. For each member, round the current offset **up** to the next multiple of that member's alignment. That is where it goes; record the offset. The bytes skipped are padding.
3. Advance the offset by the member's size.
4. At the end, round the offset up to a multiple of the struct's alignment. That is `sizeof`.

::: example Three layouts, computed and then checked
**The quiz's struct.**

```cpp
struct S {
    std::uint8_t  a;
    std::uint32_t b;
    std::uint8_t  c;
};
```

Offset 0: `a` needs alignment 1, so it goes at 0 and the offset becomes 1. `b` needs 4, so round 1 up to 4 — three bytes of padding — put it at 4, offset becomes 8. `c` needs 1, so it goes at 8 and the offset becomes 9. The struct's alignment is $\max(1, 4, 1) = 4$, so round 9 up to 12.

**The exercise's telemetry record.**

```cpp
struct Packet {
    std::uint8_t  id;
    std::uint32_t t_ms;
    std::uint16_t flags;
    double        value;
};
```

`id` at 0, offset 1. `t_ms` needs 4: round to 4 (3 bytes padding), offset 8. `flags` needs 2: already aligned, at 8, offset 10. `value` needs 8: round 10 up to 16 (6 bytes padding), offset 24. Struct alignment 8, and 24 is a multiple of 8, so `sizeof` is 24. The members total $1 + 4 + 2 + 8 = 15$ bytes, so 9 of the 24 are padding — 37.5 per cent of the record is nothing.

**The same fields, widest first.**

```cpp
struct PacketOrdered {
    double        value;
    std::uint32_t t_ms;
    std::uint16_t flags;
    std::uint8_t  id;
};
```

`value` at 0, offset 8. `t_ms` at 8, offset 12. `flags` at 12, offset 14. `id` at 14, offset 15. Round 15 up to 16. One byte of padding, all of it at the end.

Now check all three against the compiler, using `offsetof` from `<cstddef>`:

```cpp
std::printf("S: size %zu align %zu   offsets a=%zu b=%zu c=%zu\n",
            sizeof(S), alignof(S), offsetof(S, a), offsetof(S, b), offsetof(S, c));
```

```text
S: size 12 align 4   offsets a=0 b=4 c=8
Packet: size 24 align 8   offsets id=0 t_ms=4 flags=8 value=16
PacketOrdered: size 16 align 8   offsets value=0 t_ms=8 flags=12 id=14
```

Every offset matches the hand computation. Reordering the same four fields took the record from 24 bytes to 16 — a third less memory, no change to any code that uses it. A pool of 10,000 of these saves 80 kB.
:::

::: key
A member goes at the next offset that is a multiple of its own alignment; a struct's alignment is the largest of its members' and its size is rounded up to a multiple of that. Declare members in decreasing order of alignment to minimise padding. Check with `offsetof` and `sizeof`, and freeze the result with `static_assert`.
:::

## Freezing a layout you depend on

`offsetof` and `sizeof` are constant expressions, so a layout assumption can be a compile-time check rather than a comment:

```cpp
static_assert(sizeof(Packet) == 24, "layout changed");
static_assert(offsetof(Packet, value) == 16, "layout changed");
```

Put these next to any struct whose layout something outside the program depends on — a shared-memory region, a log file format, a structure read by ground software. The next person to insert a field gets a compile error naming the assumption instead of a corrupt telemetry stream three months later.

`offsetof` is defined for standard-layout types, which covers every C-like struct: no virtual functions, no virtual bases, all non-static data members with the same access control, and no base class that also has data members. Every wire-format struct you write should be standard-layout anyway, and `static_assert(std::is_standard_layout_v<Packet>)` says so.

## `alignas`: asking for more

`alignas(N)` raises an object's or a type's alignment. You cannot use it to *lower* alignment below what the type requires.

Three real uses.

**Raw storage for objects**, as lesson 06 showed: `alignas(T) unsigned char storage_[sizeof(T) * N];` gives the byte array `T`'s alignment so placement `new` is legal there.

**Cache-line separation.** Two atomics in different structs that share a 64-byte cache line make every write by one core invalidate the other's copy — false sharing. `alignas(64)` on each puts them in separate lines.

**Hardware requirements.** A DMA engine may require its buffer to start on a 32- or 64-byte boundary, and SIMD loads may require 16 or 32. `alignas(32) std::array<double, 64> buffer;` states it in the declaration rather than in a comment.

## Packing, and why it is the wrong tool for a wire format

Compilers offer a way to remove padding entirely: `__attribute__((packed))` on g++ and clang, `#pragma pack` more portably-ish. It does exactly what it says.

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

Fifteen bytes, exactly the sum of the members, and alignment 1. The `value` member starts at offset 7, and the whole object is only 1-aligned, so `value`'s address leaves a remainder of 7 when divided by 8 — misaligned for a `double`, as the program printed.

Reading `g_packet.value` directly is fine: the compiler knows the member is packed and emits whatever instruction sequence the target needs. The trouble starts when the address escapes. g++ 13.3.0 warns, with the warning on **by default** — not even `-Wall` is needed:

```text
l10-packed.cpp:24:23: warning: taking address of packed member of 'PacketPacked' may result in an unaligned pointer value [-Waddress-of-packed-member]
   24 |     const double* q = &g_packet.value;     // pointer to a misaligned member
      |                       ^~~~~~~~~~~~~~~
```

The resulting `const double*` violates the type's alignment requirement, and dereferencing it is undefined behaviour. UndefinedBehaviorSanitizer says so:

```text
about to read through a double* into a packed member
l10-packed-ub.cpp:18:16: runtime error: load of misaligned address 0x56429993302f for type 'const double', which requires 8 byte alignment
```

and the process exits non-zero under `-fno-sanitize-recover=all`.

On x86-64 the unsanitized build printed `-9.81` and exited 0, because this processor's load instructions tolerate misalignment. On many ARM and most DSP targets the same instruction faults, and on some it silently loads from the address with the low bits cleared — reading the wrong bytes entirely. So "we use packed structs and it works" is, once again, a statement about one processor.
:::

Three reasons not to use packing for a wire format, even though 15 is the number the protocol wants:

- **`packed` is not standard C++.** The spelling differs between compilers, and so does the behaviour of `#pragma pack` around nested structs.
- **It does not fix endianness.** A packed struct still stores `t_ms` in the host's byte order, so the same 15 bytes mean different things on a big-endian processor. The next lesson is about exactly this.
- **It trades a layout problem for an alignment problem.** Every pointer or reference to a member is now suspect, every `memcpy` of a member is fine but every direct use through a pointer is undefined, and the compiler may generate byte-at-a-time access that is slower than the padded version.

The answer that has none of these problems is to keep your in-memory struct naturally aligned and **serialise field by field** into a byte buffer, in an order and byte order the protocol specifies. That costs a few `memcpy` calls and buys portability across every compiler and every processor. Lesson 11 builds it.

::: warning
Do not `memcpy` a whole struct into a wire buffer, even a packed one. The padding bytes of a non-packed struct have unspecified values — they are not guaranteed to be zero even after aggregate initialisation — so the same logical packet can produce different bytes on two runs, which breaks checksums and makes captures non-reproducible. Copy each field.
:::

## Check yourself

::: check
Compute `sizeof` and every offset for `struct T { double a; std::uint8_t b; double c; std::uint8_t d; };`, then say what reordering saves.
:::

::: answer
`a` needs 8, goes at 0, offset becomes 8. `b` needs 1, goes at 8, offset 9. `c` needs 8: round 9 up to 16 — seven bytes of padding — offset becomes 24. `d` goes at 24, offset 25. The struct's alignment is 8, so round 25 up to 32. So `sizeof(T)` is 32, with offsets 0, 8, 16, 24, and the members total $8 + 1 + 8 + 1 = 18$ bytes: 14 bytes of padding. Reordered as `double a; double c; std::uint8_t b; std::uint8_t d;` the doubles sit at 0 and 8, the two bytes at 16 and 17, and the total rounds from 18 up to 24. That is 32 down to 24, a quarter saved, purely from grouping the wide members first.
:::

::: check
Why must a struct's size be a multiple of its alignment? Construct the failure if it were not.
:::

::: answer
Because of arrays and pointer arithmetic. Suppose `struct U { double x; char c; };` had size 9 rather than 16 with alignment 8. Then in `U arr[2]`, `arr[1]` would begin at byte 9, so `arr[1].x` would be at address 9 — not a multiple of 8, and therefore a misaligned `double`. Every access to the second element would be undefined behaviour, and on a processor that faults on misaligned loads the array would be unusable. Pointer arithmetic makes the same point: `p + 1` advances by exactly `sizeof(U)` bytes, so if that step does not preserve alignment, no array of `U` can be walked. Trailing padding is what keeps the step aligned, which is why the rounding happens at the end of the struct and not only between members.
:::

::: check
A colleague adds `std::uint64_t seq;` to the front of a 24-byte `Packet` and the ground software starts decoding garbage. There is a `static_assert(sizeof(Packet) == 24)` in the header. What happened, and what should have been asserted?
:::

::: answer
The `static_assert` did its job and the build failed — which is the good outcome — so if ground software saw garbage, the assertion was either removed, or updated to the new size without anyone asking what else changed. Size is the weakest thing to assert: it catches a field added at the end but not a field reordered, and not a field added at the front that shifts every offset while the total happens to stay the same. The stronger assertion set is one `static_assert` per member offset, plus the size, plus `std::is_standard_layout_v`. Better still, do not depend on the struct's layout at all: the ground software should decode a defined byte sequence produced by a serialiser, not a memory image, so that adding a field to the in-memory struct cannot change the wire format without someone editing the serialiser.
:::

::: check
`-Waddress-of-packed-member` is on by default, while `-Wdangling-reference` needs `-Wextra` and `-Wstack-usage=` has to be asked for explicitly. What does that ordering tell you?
:::

::: answer
That the compiler authors grade warnings by false-positive rate and by how likely the flagged code is to be wrong. Taking the address of a packed member is almost always a real portability defect and there is almost no legitimate reason to do it, so it is on with no flags at all. A possibly-dangling reference involves reasoning about lifetimes across a function boundary, where the analysis can be fooled by a function that returns a reference to something that does outlive the call, so it sits behind `-Wextra`. A stack-usage budget is a project policy, not a defect — the compiler cannot know your task's stack size — so it must be given a number. The practical consequence is that a project's flag set is a decision, not a default: `-Wall -Wextra -Wpedantic` plus `-Wshadow`, `-Wconversion`, `-Wframe-larger-than=` and whatever else the target demands, all under `-Werror`.
:::

::: check
When is `alignas` the right answer, and when is it a sign you have misunderstood the problem?
:::

::: answer
It is right when something outside the type system requires a stronger alignment than the type needs: raw storage that will hold a `T` built by placement `new`, a DMA buffer whose engine demands a 32-byte boundary, a SIMD load that requires 16 or 32, or a pair of atomics you want in separate cache lines to avoid false sharing. In all of those the requirement comes from hardware or from a use the declaration cannot express, and writing it as `alignas` puts it where the compiler can enforce it. It is a misunderstanding when it is used to try to *control layout* — to make a struct come out at a particular size, or to line members up with a wire format. `alignas` can only increase alignment, never remove padding, so it cannot shrink a struct; and a wire format should not be a struct's memory image at all. If you reach for `alignas` to make `sizeof` come out right, what you want is a serialiser.
:::

## Summary

| Rule | Detail |
| --- | --- |
| `alignof(T)` | the address multiple `T` must start on; always a power of two |
| this ABI | `uint8_t` 1, `uint16_t` 2, `uint32_t` 4, `double` 8, `void*` 8 |
| member placement | next offset that is a multiple of the member's alignment |
| struct alignment | the largest alignment among the members |
| struct size | rounded up to a multiple of the struct's alignment, so arrays stay aligned |
| minimising padding | declare members in decreasing order of alignment |
| worked results | `S` 12; `Packet` 24 with 9 bytes padding; reordered 16 with 1 |
| `offsetof(S, m)` | the member's byte offset, a constant expression; needs standard layout |
| freezing a layout | `static_assert` on `sizeof` *and* each `offsetof` |
| `alignas(N)` | raises alignment; cannot lower it and cannot remove padding |
| `__attribute__((packed))` | removes all padding; non-standard, misaligns members, does not fix endianness |
| `-Waddress-of-packed-member` | g++ 13.3.0, on by default; the pointer it warns about is undefined to dereference |

Lesson 11 takes the 15 bytes the protocol wants and produces them portably: byte order, field-by-field serialisation, and a round trip you can test.
