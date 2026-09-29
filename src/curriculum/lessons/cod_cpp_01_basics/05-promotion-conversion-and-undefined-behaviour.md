---
id: l05-promotion-conversion-and-undefined-behaviour
title: Integer promotion, signed versus unsigned, and undefined behavior
minutes: 22
covers:
  - Integer promotion, signed/unsigned pitfalls, signed overflow as undefined behavior
---

Picture two small measuring cups and one big mixing bowl. You never mix inside the little cups. You pour both into the bowl, stir there, and then pour the result back into a cup. If there is more than the cup holds, some spills. The mixing was fine. The spill happened on the way back.

C++ integer arithmetic works like that kitchen, and the rules for which bowl you use are fixed and mechanical. In Python, `a + b` on two integers always gives the true answer. In C++, `a + b` first converts both sides to a common type, computes in that type, and may get a result the type cannot hold. What happens next depends on the type. For an unsigned type the answer wraps around, and that is defined. For a signed type the program has **undefined behavior**, and the language says nothing at all about what it does.

These rules cause a large share of the defects found in flight-software review. They are not hard, but the wrong answer looks reasonable: a counter that goes backwards, a loop that runs once too often, a check that is quietly always true. No exception, no log line.

One caution. You cannot show undefined behavior by running a program and reporting what it printed: that is a fact about one build, not about C++. So everything below is a measured result of a well-defined operation or a message from a tool, unless the lesson says otherwise. The toolchain is g++ 13.3.0 and clang++ 18.1.3 on x86-64 Linux.

## Integral promotion: narrow types do not do arithmetic

Here is the rule. Before any arithmetic operator sees its operands, every operand narrower than `int` is converted to `int` — or to `unsigned int` if `int` cannot hold all its values. This is **[[integral promotion|promotion-bowl]]**. It applies to `bool`, `char`, `signed char`, `unsigned char`, `short` and `unsigned short`, and so to `std::int8_t`, `std::uint8_t`, `std::int16_t` and `std::uint16_t`.

```cpp
#include <cstdint>
#include <cstdio>
#include <type_traits>

int main() {
    std::uint8_t a = 200, b = 100;
    std::printf("uint8_t 200 + 100 = %d   (sizeof of the sum: %zu)\n", a + b, sizeof(a + b));
    std::printf("the sum's type is int: %d\n",
                static_cast<int>(std::is_same_v<decltype(a + b), int>));

    short s1 = 30000, s2 = 30000;
    std::printf("short 30000 + 30000 = %d   (sizeof of the sum: %zu)\n", s1 + s2, sizeof(s1 + s2));

    std::int8_t t = 120;
    t = static_cast<std::int8_t>(t + 10);
    std::printf("int8_t 120 + 10 stored back = %d\n", static_cast<int>(t));

    std::uint8_t u = 250;
    u = static_cast<std::uint8_t>(u + 10);
    std::printf("uint8_t 250 + 10 stored back = %d\n", static_cast<int>(u));
    return 0;
}
```

```text
uint8_t 200 + 100 = 300   (sizeof of the sum: 4)
the sum's type is int: 1
short 30000 + 30000 = 60000   (sizeof of the sum: 4)
int8_t 120 + 10 stored back = -126
uint8_t 250 + 10 stored back = 4
```

Read the first line again. Two `uint8_t` values added to give **300**, not 44. The sum did not wrap at 255, because the addition never happened in 8 bits. Both operands were poured into `int`, and 300 fits. `sizeof` of the expression proves it: 4 bytes, not 1. (`decltype(a + b)`, read "decl-type of a plus b", names the type of an expression; `std::is_same_v` asks whether two types are the same.)

The spill happens on the way back. Storing 260 into a `uint8_t` keeps the value **[[modulo 256|modulo-clock]]** — the remainder after taking out whole 256s — so $260 - 256 = 4$. Storing 130 into an `int8_t` gives $130 - 256 = -126$. So a narrow value can change at two moments, under two rules. The *operation* happens in `int`. The *conversion back* is what cuts.

::: warning
Promotion can turn unsigned arithmetic into signed arithmetic, and bring undefined behavior into code with no signed type in sight:

```cpp
std::uint16_t a = 50000;              // an unsigned value
std::uint32_t sq = a * a;             // but the multiply happens in int
```

Both operands promote to `int`, so the product is computed in 32-bit *signed* arithmetic. $50000^2 = 2{,}500{,}000{,}000$, and `INT_MAX` is $2{,}147{,}483{,}647$. That is signed overflow. g++ with `-Wall -Wextra` says nothing. UBSan, the run-time checker you will meet below, says:

```text
sq.cpp:6:26: runtime error: signed integer overflow: 50000 * 50000 cannot be represented in type 'int'
```

Write `static_cast<std::uint32_t>(a) * a`, so the multiply happens in a type wide enough — and unsigned, where wrap would at least be defined.
:::

## The usual arithmetic conversions

After promotion, if the two operands still have different types, they are brought to one common type. Each integer type has a **rank**, its place in the order `int` < `long` < `long long`. Apply these steps in order until one fits:

1. If both are signed, or both unsigned, the lower rank converts to the higher.
2. If the unsigned operand's rank is greater than or equal to the signed one's, the signed operand converts to **unsigned**.
3. Otherwise, if the signed type can hold every value of the unsigned type, the unsigned operand converts to the **signed** type.
4. Otherwise both convert to the unsigned version of the signed type.

Rule 2 is the famous one. Here are some measured results:

```text
(unsigned)-1      = 4294967295
-1 < 1u           false
-1 < 1ul          false
-1L < 1u          true
empty v.size()-1  = 18446744073709551615
int8_t from 200   = -56
uint8_t from -1   = 255
```

Walk through `-1 < 1u`. The suffix `u` makes `1u` an `unsigned int`. `-1` is an `int`. Same rank, one unsigned, so rule 2 sends the signed side to unsigned. $-1$ becomes $2^{32} - 1 = 4294967295$. That is not less than 1, so the comparison is **false**. Nothing overflowed and nothing is undefined. Conversion to an unsigned type is defined to wrap. The answer is not the one arithmetic would give.

`-1L < 1u` is **true**, and that is the line to study. `L` makes `-1L` a `long`, which outranks `unsigned int`. A 64-bit `long` can hold every 32-bit `unsigned int` value, so rule 3 applies: the *unsigned* side converts to `long`, and the comparison is ordinary arithmetic. The rule is not "unsigned wins". It is "the type that can hold both wins, and if none can, unsigned wins". On a platform where `long` is 32 bits, that same line would be false.

g++ with `-Wall -Wextra` flags the dangerous ones and stays quiet about the safe one:

```text
conversions.cpp:7:47: warning: comparison of integer expressions of different signedness: 'int' and 'unsigned int' [-Wsign-compare]
    7 |     std::printf("-1 < 1u           %s\n", (-1 < 1u) ? "true" : "false");
      |                                            ~~~^~~~
conversions.cpp:8:47: warning: comparison of integer expressions of different signedness: 'int' and 'long unsigned int' [-Wsign-compare]
    8 |     std::printf("-1 < 1ul          %s\n", (-1 < 1ul) ? "true" : "false");
      |                                            ~~~^~~~~
```

::: key
The usual arithmetic conversions promote the signed operand to unsigned when the unsigned type has rank at least as high, so `-1 < 1u` is false: `-1` becomes a very large unsigned value. Mixing signed and unsigned in a comparison is a classic loop-bound bug; compile with `-Wsign-compare`, which `-Wall` enables.
:::

### Converting a value that does not fit

Assignment and casts convert too. Here the destination decides the rule.

**To an unsigned type**, the result is the value modulo $2^N$, where $N$ is the width in bits. That has always been defined. `static_cast<std::uint8_t>(-1)` is $-1 + 256 = 255$.

**To a signed type**, a value that fits is unchanged. A value that does not fit is, since C++20, wrapped the same way — the **[[two's complement|twos-complement-history]]** result. Before C++20 the result was implementation-defined. `static_cast<std::int8_t>(200)` gives $200 - 256 = -56$, as the output shows.

Neither is an error, and g++ does not warn by default. `-Wconversion` makes it speak up:

```bash
g++ -std=c++20 -Wall -Wextra -Wconversion -c narrow.cpp -o /dev/null
```

```text
narrow.cpp:4:21: warning: conversion from 'int' to 'int8_t' {aka 'signed char'} changes value from '200' to '-56' [-Wconversion]
    4 |     std::int8_t x = 200;
      |                     ^~~
```

(Add `-Wpedantic` and g++ reports the same fact under another name, `overflow in conversion ... [-Woverflow]`. Warning names shift, so read your own build's output rather than a remembered message.)

clang++ warns about this constant case with no flags at all, as `-Wconstant-conversion`. And there is a cheaper defense than any flag: **braces**. Initialize with `{}` and narrowing a constant becomes a hard error in both compilers. g++, then clang++:

```text
error: narrowing conversion of '200' from 'int' to 'int8_t' {aka 'signed char'} [-Wnarrowing]
```

```text
error: constant expression evaluates to 200 which cannot be narrowed to type 'std::int8_t' (aka 'signed char')
note: insert an explicit cast to silence this issue
```

Write `std::int8_t x{200};` instead of `std::int8_t x = 200;`, and the compiler refuses to lose your data. A conversion that does not fit has destroyed real vehicles; one note tells the **[[Ariane 5|ariane-501]]** story.

::: key
`std::int8_t x = 200;` does not fit, so the value is converted; since C++20 the conversion is defined as the value modulo $2^8$, so `x` holds $-56$, and `-Wconversion` warns. The lesson is to pick a type wide enough for the range, which is why flight code uses explicit fixed-width types.
:::

## Unsigned wrap is defined. Signed overflow is not.

Two operations that look alike live in different categories.

**Unsigned overflow is defined.** The result is reduced modulo $2^N$. A `uint16_t` counter going from 65535 to 0 is correct, portable behavior you can design around.

**Signed overflow is undefined behavior.** The standard places no requirement on what the program does. Not "it wraps". Not "the compiler picks". No requirement at all.

C++20 fixed how negatives are stored, but left overflow undefined on purpose, because optimizers depend on it.

Here is what "the compiler may assume it never happens" means. Two functions differ only in signedness. Each asks "does adding 1 make the number smaller?":

```cpp
bool wraps(int x) { return x + 1 < x; }
bool wraps_u(unsigned x) { return x + 1u < x; }
```

Compile at `-O2` and read the **[[assembly|reading-assembly]]**, the processor's own instructions. g++:

```text
_Z5wrapsi:
	endbr64
	xorl	%eax, %eax
	ret
```

```text
_Z7wraps_uj:
	endbr64
	cmpl	$-1, %edi
	sete	%al
	ret
```

clang++ produces the same pair. The signed version does no addition and no comparison. `xorl %eax, %eax` sets the return value to zero, which is `false`, and returns. The compiler reasoned like this. If `x + 1` does not overflow, it is bigger than `x`, so the answer is false. If it does overflow, the program has no defined behavior, so that case need not be handled. Therefore: `return false`, for every input, even `INT_MAX`. The unsigned version is compiled as written. It compares `x` with `0xFFFFFFFF` (written `$-1` in the assembly), because there the wrap is real and the answer for that one input really is `true`.

That is the whole mechanism. Undefined behavior is not a promise that something bad happens. It is permission for the compiler to assume something never happens, and to delete code that would only run if it did. Overflow checks, bounds checks and null checks written *after* the operation they were meant to guard are the classic casualties.

::: warning
"I ran it and it wrapped, so it wraps" is not evidence. It is one run of one build. The same source at `-O2`, or next year, or with the other compiler, may behave differently — the assembly above shows an optimizer doing exactly that. So a program that works unoptimised can fail optimized, and a team must test the build it ships. Optimization can also change floating-point results in the last bits, for example by fusing `a*b + c` into one instruction with one rounding (called **contraction**). Never reason about undefined behavior from experiment.
:::

## What undefined behavior is, and three instances

Think of a board game's rulebook. It tells you what happens on every legal move. It says nothing about what happens if you flip the board over. The game is designed as if nobody ever does.

**Undefined behavior** is the flipped board. It is behavior the standard puts no requirement on. A program that does it has no defined meaning at all — formally, not even for the steps before it. The compiler may assume your program never does it, and optimize on that basis.

Three instances to be able to name:

1. **Signed integer overflow.** `INT_MAX + 1`. Shown above.
2. **Reading an uninitialised variable.** The `double sum;` from lesson 01. You are not promised "whatever was in memory"; the compiler may assume the read never happens and simplify around it.
3. **Indexing past the end of an array.** `v[v.size()]` on a `std::vector`, or `buf[10]` on `double buf[10]`. `operator[]` does not check. `at()` does, and throws an exception.

Two more you will meet constantly: **dereferencing a null or dangling pointer** (following a pointer that points at nothing, or at an object that has died — lesson 11), and a **[[data race|data-race]]**.

Know what is *not* undefined: unsigned wrap, converting a `double` to an `int` when the value fits, and comparing two pointers into the same array.

::: key
Undefined behavior is behavior the standard places no requirement on, so the compiler may assume it never happens and optimize accordingly. Examples: signed integer overflow, reading an uninitialised variable, indexing past the end of an array, dereferencing a null or dangling pointer, and a data race. Unsigned arithmetic, by contrast, is defined to wrap modulo $2^N$.
:::

::: example Catching signed overflow with the sanitizer
The honest way to find undefined behavior is to build with checks that watch for it while the program runs. `-fsanitize=undefined` turns on **[[UBSan|sanitizers]]**, the undefined-behavior sanitizer. It is one flag.

A timer counts microseconds in a signed 32-bit integer that is close to its top:

```cpp
#include <cstdint>
#include <cstdio>

int main() {
    std::int32_t dt_us = 2147483000;   // close to the top of int32_t
    std::int32_t step  = 1000;
    std::printf("%d\n", dt_us + step);  // 2147484000 does not fit
    return 0;
}
```

**Step 1: check by hand.** $2{,}147{,}483{,}000 + 1000 = 2{,}147{,}484{,}000$. The largest `int32_t` is $2{,}147{,}483{,}647$. The sum is 353 too big, so this is signed overflow.

**Step 2: build with the sanitizer and run.**

```bash
g++ -std=c++20 -Wall -Wextra -O0 -g -fsanitize=undefined overflow.cpp -o overflow
./overflow
```

```text
overflow.cpp:7:16: runtime error: signed integer overflow: 2147483000 + 1000 cannot be represented in type 'int'
-2147483296
```

**Step 3: read the message.** It names the file, line 7, column 16, the two operands and the type. It says `'int'`, not `'int32_t'`, because on this platform they are the same type.

**Step 4: do not learn the second line.** `-2147483296` is what *this build* did, not what C++ says. UBSan reports and then carries on by default. Add `-fno-sanitize-recover=all` and the program stops at the error with exit status 1. That is what you want in a test suite, because a check that reports and carries on is one a test runner can miss.

Two limits. UBSan finds only what actually runs, so it is only as good as your tests. And the flight build has no sanitizer, which is why the sanitized build must run the whole test campaign.
:::

## The unsigned countdown loop

Everything above meets in one loop every C++ programmer writes:

```cpp
for (std::size_t i = v.size() - 1; i >= 0; --i) { /* ... */ }
```

On an empty vector, `v.size() - 1` is `18446744073709551615`, as measured above: defined unsigned wrap, and `-Wall` says nothing. Then `i >= 0` is true for every value an unsigned type can hold, so the loop never ends by its own test. It indexes far past the end of the container, and *that* is undefined behavior. A non-empty vector is no better. On the last pass, `--i` (read "minus minus i": subtract one from `i`) turns 0 into $2^{64} - 1$, and the same thing happens.

`-Wextra` does catch the condition, through `-Wtype-limits`:

```text
warning: comparison of unsigned expression in '>= 0' is always true [-Wtype-limits]
```

The idiom that works moves the decrement into the test, so the test happens while `i` is still positive:

```cpp
#include <cstddef>
#include <cstdio>
#include <vector>

int main() {
    std::vector<int> v{10, 20, 30};
    for (std::size_t i = v.size(); i-- > 0;) std::printf("%zu:%d ", i, v[i]);
    std::printf("\n");

    std::vector<int> empty;
    for (std::size_t i = empty.size(); i-- > 0;) std::printf("unreachable\n");
    std::printf("empty vector: loop body ran zero times\n");
    return 0;
}
```

```text
2:30 1:20 0:10 
empty vector: loop body ran zero times
```

Read `i-- > 0` as "i, then decrement, is greater than zero". It tests the **[[old value|postfix-countdown]]** and hands the body the decremented one. So the body sees `size() - 1` down to `0`. On an empty container the first test compares 0 with 0 and stops. Lesson 09 shows a way to avoid indices altogether.

::: example An integer bug in a descent timer
A landing sequencer stores time-to-touchdown in milliseconds and counts down:

```cpp
std::uint32_t t_remaining_ms = 30000;
// ... each control cycle, 10 ms apart:
t_remaining_ms -= 10;
if (t_remaining_ms < 500) { /* arm the legs */ }
```

**Count the cycles.** $30000 / 10 = 3000$ cycles bring `t_remaining_ms` to exactly 0. So far, fine: from 490 down, the legs are armed.

**One more cycle.** The value does not become $-10$. It wraps to $2^{32} - 10 = 4294967286$. Now `< 500` is false, and the test that armed the legs says they should not be armed.

**Classify it.** Everything here is defined behavior. Nothing overflowed in the undefined sense, nothing warns, and every test that ran the sequence for exactly the planned time passed. The defect is a design error about the *range* of a value, dressed up as an arithmetic error.

**Three fixes, from worst to best.**

- Use a signed type, `std::int32_t`, so the value can go negative. But count down far enough and you hit genuine undefined behavior, so you have traded a wrong answer for a worse one.
- Clamp before subtracting: `t_remaining_ms = (t_remaining_ms > 10) ? t_remaining_ms - 10 : 0;`. Read `? :` as "if … then … else". This is correct and says plainly what happens at the boundary.
- Best: do not keep a running count at all. Store the touchdown time and compute `t_touchdown_ms - now_ms` each cycle (in a signed type wide enough). There is no state to drift, and the sign means something: negative says you are late, information the old design threw away.
:::

## Check yourself

::: check
`std::uint8_t a = 200, b = 100;` and `a + b` printed 300. Explain why, and say what `std::uint8_t c = a + b;` leaves in `c`.
:::

::: answer
Integral promotion converts both operands to `int` before adding, because `int` can hold every `std::uint8_t` value. So the addition happens in 32-bit signed arithmetic, where 300 fits, and `a + b` has type `int` — `sizeof(a + b)` is 4. Storing that `int` into a `std::uint8_t` converts it modulo 256, so `c` holds $300 - 256 = 44$. The wrap belongs to the assignment, not the addition. That is why `std::printf("%d", a + b)` and `std::printf("%d", c)` disagree.
:::

::: check
`-1 < 1u` is false but `-1L < 1u` is true, on this platform. Give the rule, and say what changes on a 32-bit target.
:::

::: answer
In `-1 < 1u` both operands have the rank of `int`, so the unsigned rank is not lower and the signed operand converts to unsigned: $-1$ becomes $2^{32} - 1$, not less than 1, so false. In `-1L < 1u` the signed operand is a 64-bit `long`, which can hold every 32-bit `unsigned int` value. So the *unsigned* operand converts to `long`, and the comparison is ordinary arithmetic: true. On a 32-bit target `long` is 32 bits and cannot hold every `unsigned int` value, so the last rule applies — both go to `unsigned long` — and `-1L < 1u` becomes false. Same source, same compiler, different answer. That is why `-Wsign-compare` exists and why you should never mix signed and unsigned in a comparison.
:::

::: check
Why may the compiler turn `bool wraps(int x) { return x + 1 < x; }` into `return false;`, and why may it not do the same to the `unsigned` version?
:::

::: answer
For every `x` where `x + 1` does not overflow, `x + 1 < x` is false by plain arithmetic. The only other case is `x == INT_MAX`, where the addition is signed overflow — undefined behavior — so the standard requires nothing for that input and the compiler may assume it never comes. With that assumption the function is false for every input it must handle, so `return false` is a valid translation. For `unsigned`, wrap is defined: at `x == UINT_MAX` the sum really is 0, which really is less than `x`. So `true` is the required answer for that input, and the comparison must actually be done. Both compilers show exactly this difference in their assembly.
:::

::: check
A reviewer rejects `for (std::size_t i = n - 1; i >= 0; --i)` even though `n` is documented as always positive. Give two separate reasons.
:::

::: answer
First, the loop test is always true for an unsigned type, so the loop has no exit through its own condition; `-Wtype-limits` under `-Wextra` says so. When `i` reaches 0, `--i` wraps it to $2^{64} - 1$, and the next pass indexes far out of bounds, which is undefined behavior. The promise that `n` is positive does not help, because the failure is at the *bottom* of the range. Second, a comment is not a guarantee: the day someone passes `n == 0`, `n - 1` is $2^{64} - 1$ and the loop starts out of bounds. Write `for (std::size_t i = n; i-- > 0;)`, which is correct for `n == 0` with no special case.
:::

::: check
UBSan printed `signed integer overflow: 2147483000 + 1000 cannot be represented in type 'int'`, and then the program printed `-2147483296`. Which of those two lines may you quote in a design review as a fact about the code, and why?
:::

::: answer
Only the first. The diagnostic says the program performed an operation the standard does not define, which is true whatever the build. The `-2147483296` is what one build happened to produce; the standard requires nothing of it, and quoting it encourages the wrong habit — designing around wrap you once observed. The only sound conclusion from the second line is that the code must change so the operation never happens: a wider type, an explicit range check, or unsigned arithmetic where wrap is really intended.
:::

## Summary

| Rule | Result |
| --- | --- |
| Integral promotion | anything narrower than `int` becomes `int` before arithmetic |
| `uint8_t(200) + uint8_t(100)` | `int` 300, not 44; the wrap happens on conversion back |
| Usual arithmetic conversions | higher rank wins; equal rank with one unsigned goes unsigned; a signed type that holds all unsigned values wins |
| `-1 < 1u` | false — `-1` converts to 4294967295 |
| `-1L < 1u` | true here — 64-bit `long` holds every `unsigned int` |
| Conversion to unsigned | modulo $2^N$, always defined |
| Conversion to signed that does not fit | modulo $2^N$ since C++20; `int8_t` from 200 gives $-56$ |
| Unsigned overflow | defined: wraps modulo $2^N$ |
| Signed overflow | **undefined behavior**; the compiler assumes it never happens |
| Undefined behavior | no requirement on the program; instances: signed overflow, uninitialised read, out-of-bounds index, null or dangling dereference, data race |
| `-Wsign-compare`, `-Wtype-limits`, `-Wconversion` | the warnings that catch the above |
| `{}` initialization | turns a narrowing conversion of a constant into a compile error |
| `-fsanitize=undefined` | finds it at run time; add `-fno-sanitize-recover=all` in tests |
| `for (std::size_t i = n; i-- > 0;)` | the countdown loop that is correct for `n == 0` |

Lesson 06 turns from arithmetic to the object model: what a variable really is in C++, how assignment differs from Python's name binding, and what a reference is.

::: context promotion-bowl Why arithmetic starts at int
Processors do arithmetic in registers, and on most machines a register is at least as wide as `int`. There is usually no cheap "add two bytes" instruction. So C, and C++ after it, decided long ago that narrow values are widened to `int` first — the mixing bowl — and only cut back down when stored.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="40" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">200</text>
  <rect x="20" y="70" width="40" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">100</text>
  <text x="40" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">uint8_t</text>
  <line x1="62" y1="33" x2="112" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="62" y1="83" x2="112" y2="64" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="115" y="44" width="130" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">int: 300</text>
  <text x="180" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">add happens here</text>
  <line x1="247" y1="58" x2="290" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="296,58 286,53 286,63" fill="#1f2a44"/>
  <rect x="298" y="45" width="40" height="26" fill="#8fb8f0" stroke="#b4232c" stroke-width="2"/>
  <text x="318" y="63" font-size="12" text-anchor="middle" fill="#b4232c">44</text>
  <text x="318" y="92" font-size="11" text-anchor="middle" fill="#b4232c">spills here</text>
</svg>
```
:::

::: context modulo-clock Modulo is clock arithmetic
A 12-hour clock already does modulo arithmetic. Five hours after 10 o'clock is 3 o'clock, not 15: you take away the whole 12 and keep the remainder. An 8-bit unsigned value is a clock with 256 positions, 0 to 255. Adding 10 to 250 goes round past 255 and lands on 4.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="75" r="55" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="35">12</text><text x="112" y="41">1</text><text x="128" y="57">2</text><text x="134" y="79">3</text><text x="128" y="101">4</text><text x="112" y="117">5</text>
    <text x="90" y="123">6</text><text x="68" y="117">7</text><text x="52" y="101">8</text><text x="46" y="79">9</text><text x="52" y="57">10</text><text x="68" y="41">11</text>
  </g>
  <line x1="90" y1="75" x2="65.8" y2="61.0" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="90" y1="75" x2="120.0" y2="75.0" stroke="#b4232c" stroke-width="3"/>
  <circle cx="90" cy="75" r="3" fill="#1f2a44"/>
  <text x="250" y="55" font-size="13" fill="#1d6fd1" text-anchor="middle">10 o'clock + 5 hours</text>
  <text x="250" y="78" font-size="13" fill="#b4232c" text-anchor="middle">= 3 o'clock</text>
  <text x="250" y="110" font-size="12" fill="#1f2a44" text-anchor="middle">uint8_t: 250 + 10 = 4</text>
</svg>
```

In symbols, $260 \bmod 256 = 4$, read "260 modulo 256 is 4".
:::

::: context twos-complement-history Why C++ waited until 2020
Older computers did not agree on how to store negative numbers. Some used **ones' complement**, where $-x$ is every bit of $x$ flipped, which gives two different zeros; the UNIVAC 1100 series and the CDC 6600 worked this way. Others used sign-and-magnitude. C and C++ were written to run on all of them, so the standards left signed conversions and overflow vague. By the 2010s every machine anyone targeted used two's complement, and C++20 finally made it the only representation. It still left signed overflow undefined, because compilers use that rule to optimize loops.
:::

::: context ariane-501 A conversion that destroyed a rocket
On 4 June 1996 the first Ariane 5 broke up about 40 seconds after lift-off. Its inertial reference software, reused from Ariane 4, converted a 64-bit floating-point value (a horizontal velocity term) into a 16-bit signed integer. Ariane 5 flew a faster trajectory, the value no longer fit, and that particular conversion had been left unprotected. The Ada runtime raised an exception, both inertial units shut down, and the vehicle steered itself off course. The code had been correct for the rocket it was written for. The range of the value had changed underneath it — the same lesson as picking a type wide enough for the range.
:::

::: context reading-assembly How to read those four lines
Assembly is the list of instructions the processor actually runs. In this syntax the source comes first and the destination last. `%edi` is the register holding the first argument, `x`. `%eax` is where a function leaves its return value, and `%al` is its lowest byte. `xorl %eax, %eax` XORs a register with itself, which always gives 0 — the cheapest way to write "return 0". `cmpl $-1, %edi` compares `x` with the bit pattern of $-1$, which is `0xFFFFFFFF`, the largest unsigned value. `sete %al` sets the result to 1 if they were equal. `endbr64` is a security marker for branch targets. The odd names like `_Z5wrapsi` are "mangled" function names that encode the argument types. Compiler Explorer (godbolt.org) shows this for any snippet.
:::

::: context data-race What a data race is
A modern flight computer runs several threads at once: one for guidance, one for telemetry, one for sensors. A **data race** happens when two threads touch the same variable at the same time, at least one of them writes, and nothing makes them take turns. The reader might see half of an old value and half of a new one. C++ declares any data race undefined behavior, so the compiler may assume a variable only your thread writes cannot change under you. Locks and `std::atomic` are the tools that prevent races; a later module covers them.
:::

::: context sanitizers Sanitizers: a checking build
A **sanitizer** is extra checking code the compiler weaves into your program. UBSan (`-fsanitize=undefined`) checks arithmetic, shifts, conversions and more; AddressSanitizer (`-fsanitize=address`) catches out-of-bounds reads and use of freed memory; ThreadSanitizer (`-fsanitize=thread`) looks for data races. Both GCC and Clang support all three. They slow the program down — UBSan a little, AddressSanitizer typically about twice — so teams run them in continuous integration over the whole test suite and fly the build without them. The next module leans on AddressSanitizer every day.
:::

::: context postfix-countdown Tracing i-- > 0 by hand
The **postfix** decrement `i--` gives back the value `i` had *before* it subtracted one. So the test checks the old value, and the body sees the new one. Here is a vector of size 3:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" font-weight="700">
    <text x="20" y="20">i before</text><text x="110" y="20">test</text><text x="210" y="20">i in body</text>
  </g>
  <line x1="15" y1="27" x2="345" y2="27" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="12" fill="#1f2a44">
    <text x="40" y="48">3</text><text x="110" y="48">3 &gt; 0 true</text><text x="230" y="48">2</text>
    <text x="40" y="72">2</text><text x="110" y="72">2 &gt; 0 true</text><text x="230" y="72">1</text>
    <text x="40" y="96">1</text><text x="110" y="96">1 &gt; 0 true</text><text x="230" y="96">0</text>
  </g>
  <g font-size="12" fill="#b4232c">
    <text x="40" y="120">0</text><text x="110" y="120">0 &gt; 0 false</text><text x="210" y="120">loop ends</text>
  </g>
  <text x="20" y="143" font-size="11" fill="#6c7a93">i wraps only after the last test, and is never used again</text>
</svg>
```
:::
