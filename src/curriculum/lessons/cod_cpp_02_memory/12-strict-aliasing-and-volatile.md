---
id: l12-strict-aliasing-and-volatile
title: Strict aliasing, bit_cast, and what volatile really promises
minutes: 20
covers:
  - 'Strict aliasing; memcpy and std::bit_cast as the legal reinterpretation'
  - 'volatile: what it does (memory-mapped I/O) and does not do (threads)'
---

Two rules govern what a compiler is allowed to assume about the memory your program touches, and both of them surprise people who learned C++ from the syntax.

The first is **strict aliasing**: unless two pointers have compatible types, the compiler may assume they never name the same object. That assumption is what lets it keep a value in a register across a store through some other pointer, and it is why casting a `float*` to a `std::uint32_t*` to look at the bits is not merely frowned upon but undefined — with observable consequences at `-O2`.

The second is **`volatile`**, which is the opposite: a promise by the compiler that it will not elide, duplicate or reorder accesses to that object. It exists for memory-mapped hardware registers, where a store *is* the observable effect and reading twice is not the same as reading once. It is routinely misused as a threading primitive, which it is not, and the distinction is the sort of thing a GNC interview asks about because the failure mode is a control loop that never sees a flag change.

Both rules are about the same question — what may the compiler assume about this memory — so they belong in one lesson.

## Strict aliasing

The rule, in the form you need: **the stored value of an object may be accessed only through an lvalue of its own type** (or a `const`/`volatile`-qualified or signed/unsigned variant of it), **or through `char`, `unsigned char` or `std::byte`**. Access through any other type is undefined behaviour.

The byte types are the deliberate escape hatch: inspecting any object as a sequence of bytes is always legal, which is what makes `memcpy` work and what made the hex dumps of lesson 11 well defined.

Why the rule exists is easier to see from the compiler's side. Given

```cpp
void f(float* a, std::uint32_t* b) { *a = 1.0f; *b = 7; /* … */ }
```

if `a` and `b` could overlap, every store through `b` would force a reload of `*a`. The rule says they cannot, so the value stays in a register. Removing the rule — `-fno-strict-aliasing` — costs real performance across a whole program, which is why no mainstream compiler removes it by default.

::: example Same source, two flags, two answers
```cpp
float scale_then_read(float* f, std::uint32_t* u) {
    *f = 1.0f;
    *u = 0x7F800000;        // the bit pattern of +infinity
    return *f;              // may be folded to 1.0f
}

int main() {
    float x = 0.0f;
    float r = scale_then_read(&x, reinterpret_cast<std::uint32_t*>(&x));
    std::printf("returned %g, and x is now %g\n", r, x);
}
```

Both pointers name `x`. Built with g++ 13.3.0 at `-O2`:

```text
returned 1, and x is now inf
```

Built at `-O2 -fno-strict-aliasing`:

```text
returned inf, and x is now inf
```

The first answer is self-contradictory on its face — the function returned `*f`, and `x` is `inf` — and it is what the rule licenses. The assembly says exactly what happened. At `-O2`:

```text
_Z15scale_then_readPfPj:
	movss	xmm0, DWORD PTR .LC0[rip]     ; xmm0 = 1.0f
	movss	DWORD PTR [rdi], xmm0         ; *f = 1.0f
	mov	DWORD PTR [rsi], 2139095040   ; *u = 0x7F800000
	ret                                   ; return xmm0, still 1.0f
```

At `-O2 -fno-strict-aliasing`:

```text
_Z15scale_then_readPfPj:
	mov	DWORD PTR [rdi], 0x3f800000
	mov	DWORD PTR [rsi], 2139095040
	movss	xmm0, DWORD PTR [rdi]         ; reload *f
	ret
```

One instruction different: the reload. With the rule in force the compiler knew the store through `u` could not have touched `*f`, so it returned the register it already had.

Diagnosis is weak here. At `-O2 -Wall -Wextra` g++ 13.3.0 reported nothing about this file; `-Wall` enables `-Wstrict-aliasing` at its conservative default level, and only `-Wstrict-aliasing=1`, the most aggressive and most false-positive-prone setting, produced:

```text
l12-aliasing.cpp:15:68: warning: dereferencing type-punned pointer might break strict-aliasing rules [-Wstrict-aliasing]
   15 |     float r = scale_then_read(&x, reinterpret_cast<std::uint32_t*>(&x));
      |                                                                    ^~
```

So this is not a class of bug you find by compiling with warnings on. You avoid it by never writing the cast.
:::

::: warning
`-fno-strict-aliasing` is a real flag and some codebases — the Linux kernel among them — use it. It is a decision to give up an optimisation across the whole build in exchange for being able to write code the standard does not define. It does not make the code portable: another compiler with the flag absent, or a compiler that does not have the flag, is back to the first answer. Treat it as a way to keep a legacy tree working, not as a licence to type-pun.
:::

## The legal reinterpretations

Three ways to look at an object's bytes as another type are well defined.

**`std::memcpy`.** Always correct, for any trivially copyable types of the same size. It is not a function call in the generated code: compilers recognise it and emit the move.

**`std::bit_cast<To>(from)`, C++20.** Same requirements — both types trivially copyable, sizes equal — and it is an expression rather than a statement, so it works in an initialiser and in a constant expression.

**Byte inspection.** Reading through `const unsigned char*` or `const std::byte*` is explicitly allowed, which is what a hex dump does.

And one that is not: a **union type pun**, writing one member and reading another. That is defined in C and undefined in C++, although g++ and clang++ both support it as a documented extension. Do not rely on it in portable code.

::: example memcpy, bit_cast, and the cast that converts instead
```cpp
std::uint32_t bits_memcpy(float f) {
    std::uint32_t u;
    std::memcpy(&u, &f, sizeof u);
    return u;
}

std::uint32_t bits_bitcast(float f) {
    return std::bit_cast<std::uint32_t>(f);
}

static_assert(std::bit_cast<std::uint32_t>(1.0f) == 0x3F800000u);
```

```text
memcpy   0xC11CF5C3
bit_cast 0xC11CF5C3
static_cast 9  (a value conversion, not a bit pattern)
```

The first two agree: `0xC11CF5C3` is the IEEE-754 binary32 pattern of $-9.81$. The third line is there to head off the commonest confusion: `static_cast<std::uint32_t>(9.81f)` is 9, because `static_cast` converts the *value* — it rounds toward zero and gives you a number, not a bit pattern. Three operations, three different meanings, and only two of them are about memory at all.

Compiled at `-O2` with the functions marked `noinline` so both are emitted:

```text
_Z11bits_memcpyf:
	movd	eax, xmm0
	ret
_Z12bits_bitcastf:
	movd	eax, xmm0
	ret
```

Byte for byte identical: one instruction each. The `memcpy` did not copy anything and `bit_cast` did not call anything. So the correct spelling costs nothing over the undefined one, which removes the last argument for the cast.

The `static_assert` is the other thing `bit_cast` buys: it is `constexpr`, so a bit pattern can be computed and checked at compile time. `memcpy` cannot appear in a constant expression.
:::

::: key
Access an object's stored value only through its own type or through `char`, `unsigned char` or `std::byte`; anything else is undefined and the optimiser acts on the assumption that you obeyed. To reinterpret bytes, use `std::memcpy` or C++20's `std::bit_cast`, both of which compile to the same single instruction as the illegal cast. `static_cast` converts values, not representations, and a union type pun is defined in C but not in C++.
:::

## `volatile`

An access to a `volatile` object is an **observable side effect** of the program, in the same category as writing to a file. The compiler must emit every such access, exactly once each, and must not reorder them with respect to each other.

That is the whole specification, and everything it is good for follows: a memory-mapped hardware register, where writing 1 then 0 then 1 is a pulse the peripheral counts, and where reading twice returns two different values because the hardware changed underneath.

::: example What the qualifier is worth, in instructions
```cpp
volatile std::uint32_t* const kCtrl  = reinterpret_cast<volatile std::uint32_t*>(0x40021000u);
std::uint32_t*          const kPlain = reinterpret_cast<std::uint32_t*>(0x40021000u);

void write_sequence_volatile() { *kCtrl = 0x1;  *kCtrl = 0x0;  *kCtrl = 0x1;  (void)*kCtrl; }
void write_sequence_plain()    { *kPlain = 0x1; *kPlain = 0x0; *kPlain = 0x1; (void)*kPlain; }

bool          g_ready   = false;
volatile bool g_ready_v = false;

void poll_plain()    { while (!g_ready)   { } }
void poll_volatile() { while (!g_ready_v) { } }
```

g++ 13.3.0 at `-O2`:

```text
_Z23write_sequence_volatilev:
	mov	DWORD PTR ds:1073876992, 1
	mov	DWORD PTR ds:1073876992, 0
	mov	DWORD PTR ds:1073876992, 1
	mov	eax, DWORD PTR ds:1073876992
	ret

_Z20write_sequence_plainv:
	mov	DWORD PTR ds:1073876992, 1
	ret
```

The volatile version emits all four accesses in order. The plain version emits **one store**: the intermediate 1 and 0 are dead, the final read is unused, and the compiler is entitled to remove them. On real hardware that would be a peripheral that never receives its reset pulse — a driver that works at `-O0` and fails at `-O2`, which is a genuinely miserable afternoon.

The polling loops are worse:

```text
_Z10poll_plainv:
	ret

_Z13poll_volatilev:
.L6:
	movzx	eax, BYTE PTR g_ready_v[rip]
	test	al, al
	je	.L6
	ret
```

`poll_plain` compiled to a single `ret`. The loop body has no side effects and `g_ready` is not modified inside it, so the compiler removed the loop entirely. `poll_volatile` reloads the byte on every iteration, which is what a flag set by an interrupt service routine requires.
:::

## What `volatile` does not do

It gives you **no atomicity**. `v = v + 1` on a `volatile int` is a load, an add and a store, and two threads doing it can lose an update exactly as they could without the qualifier.

It gives you **no ordering with respect to non-volatile accesses**. The compiler may move ordinary loads and stores across a volatile one, and — the part people forget — the *processor* may reorder them regardless of what the compiler emitted. `volatile` is not a memory barrier.

And a data race is **still undefined behaviour**. The standard defines a data race as two conflicting accesses from different threads without a happens-before relation; `volatile` does not create one. A racy program is undefined whether or not the object is `volatile`.

The correct tools are `std::atomic<T>`, which gives atomicity and a choice of ordering, and mutexes, which give both plus mutual exclusion. `std::atomic<bool> g_ready;` is the flag you actually want, and on x86-64 a relaxed atomic load compiles to the same `mov` the volatile load did — so you are not paying for the correctness.

Two places `volatile` is still right alongside threads. A variable shared with a **signal handler** is `volatile std::sig_atomic_t`, because that is what the standard specifies for that case. And a **memory-mapped register** accessed from one thread stays `volatile` regardless — the qualifier is about the hardware, not about the concurrency.

::: warning
C++20 deprecated several uses of `volatile` because they promised more than they delivered. g++ 13.3.0 at `-Wall -Wextra` reports, for `volatile int v`:

```text
chk-vol.cpp:3:23: warning: '++' expression of 'volatile'-qualified type is deprecated [-Wvolatile]
    3 | int main(){ v += 1; ++v; v = v + 1; return v; }
      |                       ^
```

The compound forms `v += 1` and `++v` look atomic and are not, which is exactly the misunderstanding the deprecation targets. Write the load and the store separately if you mean them, and use `std::atomic` if you meant atomic.
:::

## Check yourself

::: check
`scale_then_read` returned 1 while `x` held infinity. Which line of the program is the defect, and would replacing the cast with a `union` fix it?
:::

::: answer
The defect is the `reinterpret_cast<std::uint32_t*>(&x)` at the call site, which creates a second pointer of an incompatible type to the same object; from that moment the program has no defined meaning and the function's odd return value is a consequence, not a separate bug. A `union { float f; std::uint32_t u; }` would not fix it in C++: writing one member and reading another is defined in C and undefined in C++, so the program would still be relying on an extension — one that g++ and clang++ do honour, which makes it work today and leaves you with no standard backing when the code is ported. The fix that is correct everywhere is `std::bit_cast<std::uint32_t>(x)` or a `memcpy`, both of which produce a value rather than a second pointer, so no aliasing question arises.
:::

::: check
`memcpy`, `bit_cast` and the `reinterpret_cast` all compile to `movd eax, xmm0`. If the generated code is identical, in what sense is one of them wrong?
:::

::: answer
In the sense that matters: the identical output is a fact about this function in this build, not a property you can carry anywhere. The cast's problem is not the instruction it produced but the assumption it broke — having written it, you have told the compiler something false, and the consequences appear wherever the optimiser *uses* that assumption, which is in surrounding code, at other optimisation levels, and after inlining. `scale_then_read` is the demonstration: there the same kind of cast changed the answer. `memcpy` and `bit_cast` make no false claim, so there is no assumption to be exploited later, and they cost nothing. When the correct spelling generates the same instruction as the incorrect one, there is no trade to discuss.
:::

::: check
An interrupt handler sets a flag and the control loop polls it. Explain what is wrong with each of `bool ready`, `volatile bool ready`, and `std::atomic<bool> ready`, and say which you would ship.
:::

::: answer
Plain `bool ready` is wrong outright: as the assembly showed, the compiler may hoist the load out of the polling loop and compile `while (!ready) {}` to nothing, so the loop never observes the change. `volatile bool ready` fixes the elision — every iteration reloads — and is what decades of embedded code uses, but it gives no atomicity and no ordering: the handler may have written a data buffer before setting the flag, and nothing stops the compiler or the processor from making the flag visible to the loop before the buffer's contents. `std::atomic<bool> ready` gives both, and with the default sequentially consistent ordering a store in the handler and a load in the loop establish a happens-before edge, so the data written before the store is guaranteed visible after the load. Ship the atomic. On x86-64 a relaxed or acquire load of an atomic bool is the same instruction as the volatile load, so it costs nothing here; on a weakly ordered processor it costs a barrier, which is precisely the correctness you were missing.
:::

::: check
Why is reading an object through `const unsigned char*` always legal when reading it through `const std::uint32_t*` may not be?
:::

::: answer
Because the byte types are carved out of the aliasing rule by design. The standard says an object's stored value may be accessed through a `char`, `unsigned char` or `std::byte` lvalue in addition to its own type, precisely so that copying, hashing, dumping and inspecting an arbitrary object's representation remain possible — every one of those needs to see the bytes of something whose type it does not know. `std::uint32_t` gets no such exemption: it is an ordinary type, so accessing a `float` through it is an access through an incompatible type and the compiler may assume the two never overlap. The asymmetry is also why the exemption runs one way only: you may read a `float` as bytes, but you may not construct a `float*` out of a byte buffer and read through it without first placing a `float` object there.
:::

::: check
A driver writes a 32-bit configuration word to a memory-mapped register, then reads the same register back to confirm. Build a signature for that operation and explain each qualifier.
:::

::: answer
`inline void write_cfg(std::uint32_t v) { *kCfg = v; }` with `volatile std::uint32_t* const kCfg`, and a matching `std::uint32_t read_cfg() { return *kCfg; }`. Read the declaration right to left, as in lesson 02: `kCfg` is a `const` pointer — it names one fixed hardware address and must never be reseated — to a `volatile std::uint32_t` — the pointee is the register, and every access to it must be emitted and must not be reordered with other volatile accesses. Without the `volatile` the read-back could be folded into the value just written, so the confirmation would confirm nothing; without the `const` on the pointer, nothing stops a later edit from pointing it somewhere else. What the qualifiers do not give you is any guarantee that the write has reached the device before the read is issued — that is a question about the bus and usually needs a barrier the vendor's header supplies, which is one more reason `volatile` alone is never the whole driver.
:::

## Summary

| Rule | Detail |
| --- | --- |
| strict aliasing | an object's value may be accessed only through its own type, a cv- or sign-variant, or `char`/`unsigned char`/`std::byte` |
| what it buys the compiler | values stay in registers across stores through unrelated pointers |
| observed | `-O2` returned 1 where the object held `inf`; `-fno-strict-aliasing` returned `inf` |
| diagnosis | `-Wall -Wextra` said nothing; only `-Wstrict-aliasing=1` warned |
| `std::memcpy` | the always-legal reinterpretation; compiles to one instruction |
| `std::bit_cast<To>(x)` | C++20, same rules, an expression, usable in a constant expression |
| `static_cast` | converts the value, not the representation |
| union type pun | defined in C, undefined in C++, supported as a g++/clang++ extension |
| `volatile` | every access is an observable side effect: not elided, not duplicated, not reordered against other volatile accesses |
| observed | three volatile stores emitted; three plain stores collapsed to one; a plain polling loop compiled to `ret` |
| `volatile` does not give | atomicity, inter-thread ordering, or freedom from data races |
| use instead | `std::atomic<T>` or a mutex; `volatile std::sig_atomic_t` for signal handlers |
| `-Wvolatile` | C++20 deprecated `++v` and `v += 1` on volatile objects |

Lesson 13 leaves the low-level rules behind and asks the design question this module has been building toward: when should a type be a value you copy, and what does the compiler generate for you when it is not.
