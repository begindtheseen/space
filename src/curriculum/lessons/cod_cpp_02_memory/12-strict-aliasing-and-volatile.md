---
id: l12-strict-aliasing-and-volatile
title: Strict aliasing, bit_cast, and what volatile really promises
minutes: 22
covers:
  - 'Strict aliasing; memcpy and std::bit_cast as the legal reinterpretation'
  - 'volatile: what it does (memory-mapped I/O) and does not do (threads)'
---

A teacher takes attendance from a list of names. She assumes two different names are two different students. So when "Sam" says here and then "Alex" says here, she counts two. If one student answers to both names, her count is wrong — and it is not her fault. She was promised one name per student.

A compiler reading your program makes a promise-based assumption like hers. Two pointers of unrelated types, it assumes, never point at the same object. That promise is called **strict aliasing**, and breaking it gives wrong answers at `-O2` (read "oh-two"), the compiler setting that turns on its main optimizations and a common choice for flight builds.

Now picture checking your mailbox. If you walked out an hour ago and it was empty, you might be tempted to say "still empty" without walking out again. For your own kitchen drawer that shortcut is fine: nobody else touches it. For a mailbox, the mail carrier changes it while you are not looking. **`volatile`** is how you tell the compiler "this is a mailbox, not a drawer: go and look every time." It exists for hardware registers, where the hardware changes the value, and where writing is itself the action.

`volatile` is also widely misused as a way for threads to talk to each other, which it is not. The difference shows up in GNC interviews because the failure is a control loop that never sees a flag change.

Both rules answer the same question — what may the compiler assume about this memory? — so they share a lesson.

## Strict aliasing

Two names for the same object are **aliases** of each other. The rule, in the form you need:

> The stored value of an object may be read or written only through its own type (or a `const`, `volatile`, signed or unsigned version of it), **or through `char`, `unsigned char` or `std::byte`**. Access through any other type is **[[undefined behavior|undefined-behavior]]**.

The byte types are a deliberate way out. Looking at any object as a row of bytes is always legal. That is what makes `memcpy` work, and what made lesson 11's hex dumps well defined.

Why have the rule at all? Look at it from the compiler's side:

```cpp
void f(float* a, std::uint32_t* b) { *a = 1.0f; *b = 7; /* … */ }
```

If `a` and `b` could point at the same bytes, every write through `b` would force the compiler to re-read `*a` from memory. The rule says they cannot, so the compiler may keep `*a` in a **[[register|register]]** — a tiny, very fast storage slot inside the processor. Turning the rule off with `-fno-strict-aliasing` costs speed across the whole program, which is why no mainstream compiler turns it off by default.

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

`reinterpret_cast<std::uint32_t*>(&x)` takes the address of the `float` `x` and relabels it as a pointer to an integer. So `f` and `u` both point at `x` — **[[two names for one object|alias-picture]]**. Built with g++ 13.3.0 at `-O2`:

```text
returned 1, and x is now inf
```

Built at `-O2 -fno-strict-aliasing`:

```text
returned inf, and x is now inf
```

The first answer contradicts itself. The function returned `*f`, `f` points at `x`, and `x` is infinity — yet it returned 1. That is what the rule allows. The **[[assembly|reading-assembly]]** shows exactly what happened. At `-O2`:

```text
_Z15scale_then_readPfPj:
	endbr64
	movss	xmm0, DWORD PTR .LC0[rip]
	movss	DWORD PTR [rdi], xmm0
	mov	DWORD PTR [rsi], 2139095040
	ret
```

Line by line: load the constant 1.0f into register `xmm0`. Store it through `f` (whose address is in `rdi`). Store the integer 2139095040, which is `0x7F800000`, through `u` (in `rsi`). Return — and the return value is whatever is in `xmm0`, still 1.0f.

At `-O2 -fno-strict-aliasing`:

```text
_Z15scale_then_readPfPj:
	endbr64
	mov	DWORD PTR [rdi], 0x3f800000
	mov	DWORD PTR [rsi], 2139095040
	movss	xmm0, DWORD PTR [rdi]
	ret
```

The difference that matters is the last `movss`: a fresh read of `*f` from memory after the store through `u`. With the rule in force, the compiler knew the store through `u` could not have touched `*f`, so it returned the register it already had.

Warnings barely help here. At `-O2 -Wall -Wextra`, g++ 13.3.0 said nothing about this file. Only `-Wstrict-aliasing=1`, the most aggressive level and the one with the most false alarms, produced:

```text
l12-aliasing.cpp:12:68: warning: dereferencing type-punned pointer might break strict-aliasing rules [-Wstrict-aliasing]
   12 |     float r = scale_then_read(&x, reinterpret_cast<std::uint32_t*>(&x));
      |                                                                    ^~
```

UBSan did not catch it either: the sanitized build printed the same wrong answer. You do not find this bug by turning on warnings. You avoid it by never writing the cast.
:::

::: key
Why does strict aliasing matter? The compiler assumes objects of unrelated types do not overlap, so a reinterpret_cast read of a float through an int* is undefined and can be optimized into nonsense. Use std::memcpy or, in C++20, std::bit_cast.
:::

::: warning
`-fno-strict-aliasing` is a real flag, and some large codebases, the Linux kernel among them, build with it. It is a choice to give up an optimization across the whole build so that code the standard does not define keeps working. It does not make the code portable: build it with another compiler, or forget the flag, and you are back to the first answer. Treat it as a way to keep an old code tree alive, not as permission to write the cast.
:::

## The legal reinterpretations

Reinterpreting means looking at an object's bytes as if they were another type — for instance, seeing the 32 bits of a `float` as a `std::uint32_t`. Three ways are well defined.

**`std::memcpy`.** Always correct, for any two **[[trivially copyable|trivially-copyable]]** types of the same size. It is not a real function call in the finished program: compilers recognize it and emit a plain move.

**`std::bit_cast<To>(from)`, C++20.** Read "bit-cast to `To`". Same requirements: both types trivially copyable, sizes equal. It is an expression rather than a statement, so it fits in an initializer, and it works in a constant expression.

**Byte inspection.** Reading through `const unsigned char*` or `const std::byte*` is explicitly allowed. That is what a hex dump does.

One that is **not** well defined: a **union type pun**, where you write one member of a `union` and read a different one. That is defined in C and undefined in C++, although g++ and clang++ both support it as a documented extension. Do not rely on it in portable code.

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

Called with $-9.81$, and with a third line for comparison:

```text
memcpy   0xC11CF5C3
bit_cast 0xC11CF5C3
static_cast 9  (a value conversion, not a bit pattern)
```

The first two agree: `0xC11CF5C3` is the IEEE-754 single-precision pattern of $-9.81$. The third line heads off the most common mix-up. `static_cast<std::uint32_t>(9.81f)` is 9, because `static_cast` converts the *value*: it drops the fractional part and gives you a number, not a bit pattern. Three operations, three meanings, and only two of them are about memory at all.

Now compile at `-O2`, with each function marked so the compiler keeps it as a separate function. Add a third, `bits_cast`, that uses the forbidden `*reinterpret_cast<std::uint32_t*>(&f)`:

```text
_Z11bits_memcpyf:
	endbr64
	movd	eax, xmm0
	ret
_Z12bits_bitcastf:
	endbr64
	movd	eax, xmm0
	ret
_Z9bits_castf:
	endbr64
	movd	eax, xmm0
	ret
```

All three are identical: one instruction, `movd`, which copies the 32 bits from the floating-point register `xmm0` to the integer register `eax`. The `memcpy` copied nothing through memory, and `bit_cast` called nothing. So the correct spelling costs nothing over the undefined one, which removes the last argument for the cast.

The `static_assert` shows the other thing `bit_cast` buys. It is `constexpr` — usable while compiling — so a bit pattern can be computed and checked before the program ever runs. `memcpy` cannot appear in a constant expression.
:::

::: key
Access an object's stored value only through its own type or through `char`, `unsigned char` or `std::byte`; anything else is undefined, and the optimizer acts on the assumption that you obeyed. To reinterpret bytes, use `std::memcpy` or C++20's `std::bit_cast`, both of which compile to the same single instruction as the illegal cast. `static_cast` converts values, not representations, and a union type pun is defined in C but not in C++.
:::

## `volatile`

Every read or write of a `volatile` object counts as an **observable side effect** of the program — something the outside world can see, in the same category as writing to a file. So the compiler must emit every such access, exactly once each, and must not reorder them relative to each other.

That is the whole promise, and its use follows from it: a **[[memory-mapped hardware register|memory-mapped-io]]**. There, writing 1, then 0, then 1 is a pulse the device counts, and reading twice can return two different values because the hardware changed underneath.

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

`kCtrl` points at a fixed address, `0x40021000`, the kind of address where a microcontroller puts a device's control register. `(void)*kCtrl` reads the register and throws the value away. g++ 13.3.0 at `-O2` gives:

```text
_Z23write_sequence_volatilev:
	endbr64
	mov	DWORD PTR ds:1073876992, 1
	mov	DWORD PTR ds:1073876992, 0
	mov	DWORD PTR ds:1073876992, 1
	mov	eax, DWORD PTR ds:1073876992
	ret
_Z20write_sequence_plainv:
	endbr64
	mov	DWORD PTR ds:1073876992, 1
	ret
```

1073876992 is `0x40021000` written in decimal. The volatile version emits all four accesses, in order. The plain version emits **one store**. The compiler saw that the 1 and the 0 are overwritten before anyone could read them, and that the final read is unused, so it deleted them. On real hardware that is a device that never receives its reset pulse — a driver that works at `-O0` and fails at `-O2`, which is a miserable afternoon.

The polling loops are worse:

```text
_Z10poll_plainv:
	endbr64
	ret
_Z13poll_volatilev:
	endbr64
	.p2align 4,,10
	.p2align 3
.L6:
	movzx	eax, BYTE PTR g_ready_v[rip]
	test	al, al
	je	.L6
	ret
```

`poll_plain` compiled to a single `ret`: return at once. Nothing inside the loop changes `g_ready` or has any side effect, so the compiler **[[removed the loop entirely|forward-progress]]**. `poll_volatile` re-reads the byte on every pass (`movzx` loads it, `test` checks it, `je` jumps back if it is zero). That is what a flag set by an **[[interrupt service routine|isr]]** needs.
:::

::: key
What does volatile guarantee and not guarantee? It prevents the compiler from eliding or reordering accesses to that object relative to other volatile accesses, which is what memory-mapped hardware registers require. It provides no atomicity and no inter-thread ordering, so it is not a threading tool.
:::

## What `volatile` does not do

It gives you **no atomicity**. An **atomic** operation happens all at once, with nothing able to see it half done. `v = v + 1` on a `volatile int` is a read, an add and a write — three steps. Two threads doing it at the same time can lose an update exactly as they could without the qualifier.

It gives you **no ordering with respect to ordinary accesses**. The compiler may move normal reads and writes across a volatile one. And — the part people forget — the *processor* may reorder them too, whatever the compiler emitted. `volatile` is not a memory barrier.

And a **data race** is **still undefined behavior**. The standard defines a data race as two accesses to the same object from different threads, at least one of them a write, with nothing that **[[orders one before the other|happens-before]]**. `volatile` does not provide that ordering, so a racy program is undefined whether or not the object is `volatile`.

The right tools are `std::atomic<T>`, which gives atomicity and a choice of ordering, and mutexes, which give both plus mutual exclusion. `std::atomic<bool> g_ready;` is the flag you actually want. On x86-64, loading it compiles to the same `movzx` the volatile load used, so correctness costs nothing here.

Two places `volatile` is still right alongside threads. A variable shared with a **signal handler** is `volatile std::sig_atomic_t`, because that is what the standard specifies for that case. And a **memory-mapped register** stays `volatile` even when only one thread touches it: the qualifier is about the hardware, not about concurrency.

::: warning
C++20 **deprecated** — marked for eventual removal — several uses of `volatile` that promised more than they delivered: `++`, `--`, compound assignments such as `v += 1`, and using the value of an assignment. Compound assignment was later taken off that list, but `++v` still gets flagged. g++ 13.3.0 at `-std=c++20 -Wall -Wextra`, for `volatile int v`:

```text
chk-vol.cpp:3:23: warning: '++' expression of 'volatile'-qualified type is deprecated [-Wvolatile]
    3 | int main(){ v += 1; ++v; v = v + 1; return v; }
      |                       ^
```

It flagged `++v` and not `v += 1`, but both are a read, a change and a write, and neither is atomic. `++v` looks like one indivisible step, which is exactly the misunderstanding the deprecation targets. If you mean a read and a write, write them separately. If you meant atomic, use `std::atomic`.
:::

## Check yourself

::: check
`scale_then_read` returned 1 while `x` held infinity. Which line of the program is the defect, and would replacing the cast with a `union` fix it?
:::

::: answer
The defect is the `reinterpret_cast<std::uint32_t*>(&x)` at the call site. It creates a second pointer, of an unrelated type, to the same object. From that moment the program has no defined meaning, and the odd return value is a consequence, not a separate bug.

A `union { float f; std::uint32_t u; }` would not fix it in C++. Writing one member and reading another is defined in C and undefined in C++. The program would then rely on a compiler extension — one g++ and clang++ do honor, so it works today, with no standard behind it when the code moves to another compiler.

The fix that is correct everywhere is `std::bit_cast<std::uint32_t>(x)` or a `memcpy`. Both produce a *value* instead of a second pointer, so no aliasing question arises.
:::

::: check
`memcpy`, `bit_cast` and the `reinterpret_cast` all compiled to `movd eax, xmm0`. If the generated code is identical, in what sense is one of them wrong?
:::

::: answer
In the sense that matters: identical output is a fact about this one function in this one build, not something you can carry anywhere. The cast's problem is not the instruction it produced but the promise it broke. Having written it, you told the compiler something false. The damage appears wherever the optimizer *uses* that promise — in the surrounding code, at other optimization levels, and after the function is inlined into its caller.

`scale_then_read` is the demonstration: there, the same kind of cast changed the answer. `memcpy` and `bit_cast` make no false promise, so there is nothing to be exploited later, and they cost nothing. When the correct spelling generates the same instruction as the incorrect one, there is no trade to discuss.
:::

::: check
An interrupt handler sets a flag and the control loop polls it. Explain what is wrong with each of `bool ready`, `volatile bool ready` and `std::atomic<bool> ready`, and say which you would ship.
:::

::: answer
Plain `bool ready` is wrong outright. As the assembly showed, the compiler may read the flag once, or not at all, and turn `while (!ready) {}` into nothing, so the loop never sees the change.

`volatile bool ready` fixes that — every pass re-reads — and decades of embedded code use it. But it gives no atomicity and no ordering. Suppose the handler fills a data buffer and then sets the flag. Nothing stops the compiler or the processor from making the flag visible to the loop before the buffer's contents are.

`std::atomic<bool> ready` gives both. With the default ordering, the handler's store and the loop's load create a happens-before link, so everything written before the store is guaranteed visible after the load.

Ship the atomic. On x86-64 its load is the same instruction as the volatile load, so it costs nothing here. On a processor that reorders more freely it costs a barrier instruction — which is exactly the correctness you were missing.
:::

::: check
Why is reading an object through `const unsigned char*` always legal, when reading it through `const std::uint32_t*` may not be?
:::

::: answer
Because the byte types are carved out of the aliasing rule on purpose. The standard lets any object's stored value be accessed through `char`, `unsigned char` or `std::byte` as well as its own type. That keeps copying, hashing, dumping and inspecting possible, and each of those needs to see the bytes of something whose type it does not know.

`std::uint32_t` gets no such exemption. It is an ordinary type, so reading a `float` through it is access through an unrelated type, and the compiler may assume the two never overlap.

The exemption also runs one way only. You may read a `float` as bytes. You may not take a byte buffer, relabel its address as a `float*` and read through it, unless a `float` object was first placed there.
:::

::: check
A driver writes a 32-bit configuration word to a memory-mapped register, then reads the same register back to confirm it. Write declarations for that and explain each qualifier.
:::

::: answer
Declare `volatile std::uint32_t* const kCfg` pointing at the register's address, then `inline void write_cfg(std::uint32_t v) { *kCfg = v; }` and a matching `inline std::uint32_t read_cfg() { return *kCfg; }`.

Read the declaration right to left from the name, as in lesson 02. `kCfg` is a `const` pointer: it names one fixed hardware address and can never be pointed anywhere else. It points to a `volatile std::uint32_t`: the thing pointed at is the register, and every access to it must be emitted and kept in order with other volatile accesses.

Without `volatile`, the compiler could replace the read-back with the value it just wrote, so the confirmation would confirm nothing. Without the `const` on the pointer, nothing stops a later edit from pointing it somewhere else.

What the qualifiers do not give you is any promise that the write has reached the device before the read goes out. That is a question about the bus, usually answered by a barrier the chip vendor's header supplies — one more reason `volatile` alone is never the whole driver.
:::

## Summary

| Rule | Detail |
| --- | --- |
| strict aliasing | an object's value may be accessed only through its own type, a cv- or sign-variant, or `char`/`unsigned char`/`std::byte` |
| what it buys the compiler | values stay in registers across stores through unrelated pointers |
| observed | `-O2` returned 1 where the object held `inf`; `-fno-strict-aliasing` returned `inf` |
| diagnosis | `-Wall -Wextra` and UBSan said nothing; only `-Wstrict-aliasing=1` warned |
| `std::memcpy` | the always-legal reinterpretation; compiles to one instruction |
| `std::bit_cast<To>(x)` | C++20, same rules, an expression, usable in a constant expression |
| `static_cast` | converts the value, not the representation |
| union type pun | defined in C, undefined in C++, supported as a g++/clang++ extension |
| `volatile` | every access is an observable side effect: not elided, not duplicated, not reordered against other volatile accesses |
| observed | three volatile stores emitted; three plain stores collapsed to one; a plain polling loop compiled to `ret` |
| `volatile` does not give | atomicity, inter-thread ordering, or freedom from data races |
| use instead | `std::atomic<T>` or a mutex; `volatile std::sig_atomic_t` for signal handlers |
| `-Wvolatile` | C++20 deprecated `++v` on volatile objects, and g++ 13.3.0 warns |

Lesson 13 leaves the low-level rules behind and asks the design question this module has been building toward: when should a type be a value you copy, and what does the compiler write for you when it is not?

::: context undefined-behavior Not "random", but "no rules at all"
**Undefined behavior** does not mean the program does something random. It means the C++ standard places no requirement at all on what happens. The compiler is allowed to assume it never occurs, and it builds its optimizations on that assumption.

That is why the symptoms are so strange: the compiler did nothing wrong by its own logic. It reasoned correctly from a promise your code broke. The same source can work at `-O0`, fail at `-O2`, and work again after an unrelated edit.
:::

::: context register The processor's scratch pad
A **register** is one of a few dozen tiny storage slots built into the processor itself. Reading one takes well under a nanosecond; reading main memory can take a hundred times longer. So compilers work hard to keep values in registers and avoid reloading them.

On x86-64, `rdi`, `rsi` and `rax` are 64-bit general-purpose registers, `eax` is the low 32 bits of `rax`, and `xmm0` is a register for floating-point values. Keeping `*f` in `xmm0` instead of re-reading memory is exactly the kind of saving strict aliasing permits.
:::

::: context alias-picture Two pointers, one float
After the cast, both parameters point at the same four bytes. The compiler assumed a `float*` and a `uint32_t*` never do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="90" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">float* f</text>
  <rect x="20" y="80" width="90" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">uint32_t* u</text>
  <line x1="110" y1="35" x2="222" y2="58" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="230,60 219,52 217,63" fill="#1d6fd1"/>
  <line x1="110" y1="95" x2="222" y2="72" stroke="#b4232c" stroke-width="2"/>
  <polygon points="230,70 217,67 219,78" fill="#b4232c"/>
  <rect x="232" y="50" width="110" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="287" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">x: 4 bytes</text>
  <text x="287" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">one object, two names</text>
</svg>
```
:::

::: context reading-assembly How to read these listings
The listings are x86-64 assembly in Intel syntax: each line is one machine instruction, written `operation destination, source`. `mov` copies; `movss` copies one single-precision float; `DWORD PTR [rdi]` means "the 4 bytes at the address held in `rdi`". `ret` returns.

On 64-bit Linux, a function's first pointer argument arrives in `rdi` and the second in `rsi`, and a `float` result goes back in `xmm0`. `endbr64` is a security marker at each function's start and does nothing here. The odd names like `_Z15scale_then_readPfPj` are the compiler's encoded form of the C++ function name. `g++ -O2 -S -masm=intel file.cpp` writes this listing for any file.
:::

::: context trivially-copyable Types you may copy as bytes
A type is **trivially copyable** when copying its bytes produces a valid copy of the object. Every built-in number type qualifies, and so does any struct made of them with no user-written copy or move operations and no user-written destructor.

A `std::string` does not: its bytes include a pointer to a heap buffer, so a byte copy would give two strings sharing one buffer, and both would free it. `memcpy` and `bit_cast` are only defined for trivially copyable types for exactly this reason.
:::

::: context memory-mapped-io Where the hardware lives in the address space
On a microcontroller, some addresses are not memory at all. Writing to them sends a command to a device — a timer, a UART, a clock controller — and reading them returns the device's current state. This is **memory-mapped I/O**. The chip's reference manual lists each register's address.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="16" width="130" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="105" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">device registers</text>
  <rect x="40" y="56" width="130" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="105" y="80" font-size="11" text-anchor="middle" fill="#6c7a93">unused</text>
  <rect x="40" y="96" width="130" height="50" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="105" y="125" font-size="12" text-anchor="middle" fill="#1f2a44">RAM</text>
  <line x1="170" y1="30" x2="210" y2="30" stroke="#b4232c" stroke-width="2"/>
  <text x="214" y="34" font-size="11" fill="#b4232c">0x40021000: volatile</text>
  <text x="214" y="125" font-size="11" fill="#1f2a44">ordinary variables</text>
  <text x="30" y="24" font-size="11" text-anchor="end" fill="#1f2a44">high</text>
  <text x="30" y="146" font-size="11" text-anchor="end" fill="#1f2a44">low</text>
  <text x="180" y="164" font-size="11" text-anchor="middle" fill="#6c7a93">one address space, two very different kinds of thing</text>
</svg>
```

Real microcontrollers often put peripherals in the 0x40000000 region; the exact addresses come from the chip's manual.
:::

::: context forward-progress Why an empty loop may vanish
C++ has a **forward progress** rule: the compiler may assume that a loop with no side effects — no I/O, no volatile or atomic access, no synchronization — eventually ends. `while (!g_ready) {}` has none of those, and nothing in it changes `g_ready`.

So the compiler reasons: if `g_ready` is true, the loop exits at once; if it is false, the loop would spin forever doing nothing, which it may assume does not happen. Either way, returning at once is allowed. Making the flag `volatile` or atomic adds a side effect, and the loop stays.
:::

::: context isr Code the hardware calls
An **interrupt service routine** (ISR) is a function the processor jumps to when hardware signals an event — a timer tick, a byte arriving on a serial port, a sensor sample ready. The main program is paused mid-instruction stream, the ISR runs, and the main program resumes without knowing it was interrupted.

That is why the compiler, looking only at the main loop, cannot see anything change the flag: the code that changes it is never called from the loop. A later module on concurrency and real-time code covers what an ISR may and may not do.
:::

::: context happens-before Making "before" mean something across threads
In one thread, code runs in the order written, as far as that thread can tell. Across threads there is no such promise, unless you build one. An atomic store with release ordering, and an atomic load with acquire ordering that sees the stored value, create a **happens-before** link: everything written before the store is visible after the load.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="80" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">handler</text>
  <text x="280" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">control loop</text>
  <rect x="20" y="30" width="120" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="80" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">write buffer</text>
  <rect x="20" y="74" width="120" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <text x="80" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">ready.store(true)</text>
  <rect x="220" y="74" width="120" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <text x="280" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">ready.load() true</text>
  <rect x="220" y="114" width="120" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="280" y="132" font-size="11" text-anchor="middle" fill="#1f2a44">read buffer: safe</text>
  <line x1="140" y1="88" x2="212" y2="88" stroke="#b4232c" stroke-width="2"/>
  <polygon points="220,88 210,83 210,93" fill="#b4232c"/>
  <text x="180" y="80" font-size="11" text-anchor="middle" fill="#b4232c">synchronizes</text>
</svg>
```

A volatile flag gives no such link. The concurrency module later in the course builds this model properly.
:::
