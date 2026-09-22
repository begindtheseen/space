---
id: l05-promotion-conversion-and-undefined-behaviour
title: Integer promotion, signed versus unsigned, and undefined behaviour
minutes: 21
covers:
  - Integer promotion, signed/unsigned pitfalls, signed overflow as undefined behaviour
---

In Python, `a + b` on two integers gives the mathematically correct integer, always. In C++, `a + b` first converts both operands to some common type according to a table you have never read, computes in that type, and may produce a result the type cannot hold — at which point the program's behaviour is either defined to wrap, or undefined entirely, depending on whether the type was unsigned or signed.

Those rules are the origin of a large share of the defects that get found in flight software review. They are not hard, and they are fully mechanical. What makes them dangerous is that the wrong answer usually looks plausible: a counter that goes backwards, a loop that runs once too often, a check that is silently always true. There is no exception, no traceback, no line in a log.

This lesson gives you the conversion rules, then treats undefined behaviour properly — what it is, why signed overflow is in that category, and how to find it. That last part needs care. You cannot demonstrate undefined behaviour by running a program and reporting what it printed, because what it printed is a fact about one build, not about C++. Everything below is either a measured result of a well-defined operation, or a diagnostic from a tool, and where a result is merely what this build happened to do, it says so.

## Integral promotion: narrow types do not do arithmetic

Before any arithmetic operator sees its operands, every operand of a type narrower than `int` is converted to `int` — or to `unsigned int` if `int` cannot represent all values of the original type. This is *integral promotion*, and it applies to `bool`, `char`, `signed char`, `unsigned char`, `short`, `unsigned short`, and therefore to `std::int8_t`, `std::uint8_t`, `std::int16_t` and `std::uint16_t`.

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

Read the first line again. Two `uint8_t` values added gave **300**, not 44. The sum did not wrap at 255 because the addition never happened in 8 bits: both operands became `int`, the sum is an `int`, and 300 fits comfortably. `sizeof` of the expression proves it — 4 bytes, not 1.

The wrap happens on the way back. Storing 260 into a `uint8_t` keeps the value modulo 256, giving 4; storing 130 into an `int8_t` gives $130 - 256 = -126$. So a narrow type has two distinct moments where a value can change, and they follow different rules: the *operation* happens in `int`, and the *conversion back* is what truncates.

::: warning
This is why `std::uint16_t crc = crc * 31 + byte;` can be wrong in a way that `std::uint32_t` arithmetic is not. Both operands promote to `int`, the multiplication is done in 32-bit signed arithmetic, and if the intermediate exceeds `INT_MAX` that is signed overflow — undefined behaviour — even though every variable in sight is unsigned. Write `crc = static_cast<std::uint16_t>(crc * 31U + byte)` so that the arithmetic happens in `unsigned int`, where it is defined to wrap.
:::

## The usual arithmetic conversions

After promotion, if the two operands still have different types, they are brought to a common type by this sequence, applied in order until one applies:

1. If both are signed, or both unsigned, the one of lower *rank* converts to the higher. Rank is the ordering `int` < `long` < `long long`.
2. If the unsigned operand has rank greater than or equal to the signed one, the signed operand converts to **unsigned**.
3. Otherwise, if the signed type can represent every value of the unsigned type, the unsigned operand converts to the **signed** type.
4. Otherwise both convert to the unsigned version of the signed type.

Rule 2 is the famous one:

```text
(unsigned)-1      = 4294967295
-1 < 1u           false
-1 < 1ul          false
-1L < 1u          true
empty v.size()-1  = 18446744073709551615
int8_t from 200   = -56
uint8_t from -1   = 255
```

`-1 < 1u`: `-1` is an `int`, `1u` is an `unsigned int`, equal rank, so rule 2 sends the signed side to unsigned. $-1$ converts to $2^{32}-1 = 4294967295$, which is not less than 1, so the comparison is **false**. Nothing overflowed, nothing is undefined; the conversion is defined to be modular for unsigned destinations. The answer is simply not the one arithmetic would give.

`-1L < 1u` is **true**, and that is the line to study. Here the signed operand is `long`, rank higher than `unsigned int`, and a 64-bit `long` can represent every 32-bit `unsigned int` value — so rule 3 applies, the *unsigned* side converts, and the comparison is the arithmetic one. The rule is not "unsigned wins"; it is "the type that can hold both wins, and if there is none, unsigned wins". On a platform where `long` is 32 bits, that same line would be false.

g++ 13.3.0 with `-Wall -Wextra` flags the dangerous ones and stays quiet about the safe one:

```text
warning: comparison of integer expressions of different signedness: 'int' and 'unsigned int' [-Wsign-compare]
    7 |     std::printf("-1 < 1u           %s\n", (-1 < 1u) ? "true" : "false");
      |                                            ~~~^~~~
```

::: key
The usual arithmetic conversions promote the signed operand to unsigned when the unsigned type has rank at least as high, so `-1 < 1u` is false: `-1` becomes a very large unsigned value. Mixing signed and unsigned in a comparison is a classic loop-bound bug; compile with `-Wsign-compare`, which `-Wall` enables.
:::

### Converting a value that does not fit

Assignment and casts convert too, and here the destination's signedness decides the rule.

**To an unsigned type**: the result is the value modulo $2^N$. Always defined, always has been. `static_cast<std::uint8_t>(-1)` is $-1 + 256 = 255$.

**To a signed type**: if the value fits, it is unchanged. If it does not, C++20 defines the result as the unique value congruent modulo $2^N$ — the two's-complement wrap — where C++17 and earlier left it implementation-defined. g++ 13.3.0 with `-std=c++20` gives $200 - 256 = -56$ for `static_cast<std::int8_t>(200)`, as the output above shows.

Neither of these is an error, and by default neither warns. `-Wconversion` makes g++ speak up:

```text
warning: conversion from 'int' to 'int8_t' {aka 'signed char'} changes value from '200' to '-56' [-Wconversion]
```

clang++ 18.1.3 reports the same thing under `-Wall` alone, as `-Wconstant-conversion`, with its own wording. And there is a cheaper defence than any warning flag: **braces**. Initialise with `{}` and a narrowing conversion of a constant is a hard error in both compilers:

```text
error: narrowing conversion of '200' from 'int' to 'int8_t' {aka 'signed char'} [-Wnarrowing]
```

```text
error: constant expression evaluates to 200 which cannot be narrowed to type 'std::int8_t' (aka 'signed char')
note: insert an explicit cast to silence this issue
```

Write `std::int8_t x{200};` rather than `std::int8_t x = 200;` and the compiler refuses to lose your data.

::: key
`std::int8_t x = 200;` does not fit, so the value is converted; on this toolchain `x` holds $-56$, and `-Wconversion` warns. The lesson is to pick a type wide enough for the range, which is why flight code uses explicit fixed-width types.
:::

## Unsigned wrap is defined. Signed overflow is not.

Two operations that look identical are in completely different categories.

**Unsigned overflow is defined**: the result is reduced modulo $2^N$. A `uint16_t` sequence counter going from 65535 to 0 is correct, portable, well-specified behaviour that you can design around.

**Signed overflow is undefined behaviour**: the standard places no requirement on what the program does. Not "it wraps", not "it is implementation-defined" — no requirement at all.

The historical reason is that not every machine used two's complement, and the committee refused to make one representation mandatory. C++20 finally fixed the *representation* as two's complement, but it deliberately left overflow undefined, because by then the optimisers depended on it.

Here is what "the compiler may assume it never happens" means, concretely. Two functions that differ only in signedness:

```cpp
bool wraps(int x) { return x + 1 < x; }
bool wraps_u(unsigned x) { return x + 1u < x; }
```

Compile at `-O2` and read the assembly. g++ 13.3.0:

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

clang++ 18.1.3 produces the same pair. The signed version does no arithmetic and no comparison: `xorl %eax, %eax` sets the return value to zero and returns. The compiler reasoned that if `x + 1` does not overflow then it is greater than `x`, and if it does overflow the program has no defined behaviour and therefore need not be catered for — so the function is `return false`, unconditionally, for every input including `INT_MAX`. The unsigned version is compiled as written, comparing against `0xFFFFFFFF`, because there the wrap is real and the answer for that one input is genuinely `true`.

That is the whole mechanism. Undefined behaviour is not a promise that something bad happens; it is permission for the compiler to assume something never happens, and to delete the code that would only run if it did. Bounds checks, null checks and overflow checks written *after* the operation they were meant to guard are the classic casualties.

::: warning
"I ran it and it wrapped, so it wraps" is not evidence. It is one observation of one build at one optimisation level. The same source compiled at `-O2`, or next year, or by the other compiler, is free to behave differently — and the assembly above shows an optimiser doing exactly that. Never reason about undefined behaviour from experiment.
:::

## What undefined behaviour is, and three instances

**Undefined behaviour** is behaviour for which the standard imposes no requirements. A program that executes it has no defined meaning at all — not from that point on, and formally not before it either. The compiler is entitled to assume your program never does it, and to optimise on that assumption.

Three instances to be able to name:

1. **Signed integer overflow.** `INT_MAX + 1`. Shown above.
2. **Reading an uninitialised variable.** The `double sum;` from lesson 01. There is no "whatever was in memory" guarantee; the compiler may assume the read never happens and simplify accordingly.
3. **Indexing past the end of an array.** `v[v.size()]` on a `std::vector`, or `buf[10]` on a `double buf[10]`. `operator[]` does not check; `at()` does and throws.

Two more you will meet constantly: **dereferencing a null or dangling pointer** (lesson 11), and a **data race** — two threads touching the same object with no synchronisation and at least one writing.

Note what is *not* undefined: unsigned wrap, converting a `double` to an `int` when the value fits, and comparing two pointers into the same array. Knowing the boundary is what lets you use the defined parts confidently.

::: example Catching signed overflow with the sanitizer
The honest way to find undefined behaviour is to build with instrumentation that checks for it at run time. `-fsanitize=undefined` (UBSan) is one flag and costs a few per cent.

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

```bash
g++ -std=c++20 -Wall -Wextra -O0 -g -fsanitize=undefined overflow.cpp -o overflow
./overflow
```

```text
overflow.cpp:7:16: runtime error: signed integer overflow: 2147483000 + 1000 cannot be represented in type 'int'
-2147483296
```

The message came from g++ 13.3.0's UBSan at `-O0`, and it names the file, the line, the column, the two operands and the type. It says `'int'` rather than `'int32_t'` because on this platform they are the same type.

The `-2147483296` printed afterwards is **what this build did**, not what C++ says happens: UBSan reports and then continues by default. Do not learn that number. Add `-fno-sanitize-recover=all` and the program stops instead, exiting with status 1 — which is what you want in a test suite, because a check that reports and carries on is a check a test runner can miss.

Two limits worth knowing. UBSan finds only what actually executes, so it is only as good as your test coverage. And it is a debug and test tool, not something you ship: the flight build has no sanitizer, which is precisely why the sanitized build has to be run over the whole test campaign.
:::

## The unsigned countdown loop

Everything above converges on one loop that every C++ programmer writes once:

```cpp
for (std::size_t i = v.size() - 1; i >= 0; --i) { /* ... */ }
```

On an empty vector, `v.size() - 1` is `18446744073709551615`, as measured above — defined unsigned wrap, no warning from `-Wall`. And `i >= 0` is true for every possible value of an unsigned type, so the loop never ends by its own condition; it runs with an enormous index straight past the end of the container, which *is* undefined behaviour. On a non-empty vector it is no better: the last iteration decrements 0 to $2^{64}-1$ and the same thing happens.

`-Wextra` does catch the condition, through `-Wtype-limits`:

```text
warning: comparison of unsigned expression in '>= 0' is always true [-Wtype-limits]
```

The idiom that works keeps the decrement inside the condition, so the test happens while `i` is still positive:

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

`i-- > 0` tests the old value and leaves the decremented one for the body, so the body sees `size()-1` down to `0`, and on an empty container the very first test compares 0 with 0 and stops. Lesson 09 gives you the alternative that avoids indices altogether.

::: example An integer bug in a descent timer
A landing sequencer stores time-to-touchdown in milliseconds and counts down:

```cpp
std::uint32_t t_remaining_ms = 30000;
// ... each control cycle, 10 ms apart:
t_remaining_ms -= 10;
if (t_remaining_ms < 500) { /* arm the legs */ }
```

Run the cycle 3000 times and `t_remaining_ms` is 0. Run it once more and it is not $-10$: it is $2^{32} - 10 = 4294967286$. The comparison `< 500` becomes false, and the legs, having been armed, un-arm.

Everything here is defined behaviour. Nothing overflowed in the undefined sense, nothing warns, and every test that ran the sequence for exactly the right duration passed. The defect is a design error about the *range* of a value, dressed as an arithmetic error.

Three fixes, in increasing order of merit. Use a signed type, `std::int32_t`, so the value can legitimately go negative — but then decrementing far enough is genuinely undefined behaviour, so you have swapped a wrong answer for a worse one. Clamp before subtracting: `t_remaining_ms = (t_remaining_ms > 10) ? t_remaining_ms - 10 : 0;`, which is correct and explicit about what happens at the boundary. Or, best, do not accumulate at all: store the touchdown time and compute `t_touchdown_ms - now_ms` each cycle, which has no state to drift and makes the sign of the result meaningful — negative means you are late, which is information the old design threw away.
:::

## Check yourself

::: check
`std::uint8_t a = 200, b = 100;` and `a + b` printed 300. Explain why, and say what `std::uint8_t c = a + b;` would leave in `c`.
:::

::: answer
Integral promotion converts both operands to `int` before the addition, because `int` can represent every `std::uint8_t` value. The addition therefore happens in 32-bit signed arithmetic, where 300 fits, and the type of `a + b` is `int` — `sizeof(a + b)` is 4. Assigning that `int` back to a `std::uint8_t` converts it modulo 256, so `c` holds $300 - 256 = 44$. The wrap belongs to the assignment, not to the addition, which is why `std::printf("%d", a + b)` and `std::printf("%d", c)` disagree.
:::

::: check
`-1 < 1u` is false but `-1L < 1u` is true, on this platform. Give the rule, and say what would change on a 32-bit target.
:::

::: answer
In `-1 < 1u` both operands have rank `int`, so the unsigned type's rank is not lower, and the signed operand converts to unsigned: $-1$ becomes $2^{32}-1$, which is not less than 1, so the result is false. In `-1L < 1u` the signed operand is `long`, which here is 64 bits and can represent every value of a 32-bit `unsigned int`, so the *unsigned* operand converts to `long` instead and the comparison is the ordinary arithmetic one, giving true. On a 32-bit target `long` is 32 bits and cannot represent all `unsigned int` values, so the second rule applies again and `-1L < 1u` becomes false. The same source, the same compiler, a different answer — which is why `-Wsign-compare` exists and why you should never leave signed and unsigned mixed in a comparison.
:::

::: check
Why can the compiler legally turn `bool wraps(int x) { return x + 1 < x; }` into `return false;`, and why can it not do the same to the `unsigned` version?
:::

::: answer
For any `x` where `x + 1` does not overflow, `x + 1 < x` is false by arithmetic. The only remaining case is `x == INT_MAX`, where the addition is signed overflow and therefore undefined behaviour — so the standard places no requirement on the program for that input, and the compiler is entitled to assume the input never occurs. With that assumption the function is false for every input it must handle, so `return false` is a valid compilation. For `unsigned`, wrap is defined: at `x == UINT_MAX` the sum really is 0, which really is less than `x`, so `true` is the required answer for that input and the comparison must actually be performed. Both compilers emit exactly this difference, which makes the assembly a direct measurement of what "undefined" buys the optimiser.
:::

::: check
A reviewer rejects `for (std::size_t i = n - 1; i >= 0; --i)` even though `n` is documented as always positive. Give two independent reasons.
:::

::: answer
First, the loop condition is unconditionally true for an unsigned type, so the loop has no exit through its own test; `-Wtype-limits` under `-Wextra` says so. When `i` reaches 0 the `--i` wraps it to $2^{64}-1$ and the next iteration indexes far out of bounds, which is undefined behaviour. The documented positivity of `n` does not help, because the failure is at the *bottom* of the range, not the top. Second, "documented as always positive" is a comment, not a guarantee: the day someone calls it with `n == 0`, `n - 1` is $2^{64}-1$ and the loop starts out of bounds. A review standard that accepts loops whose correctness depends on a comment has no way to check itself. Write `for (std::size_t i = n; i-- > 0;)`, which is correct for `n == 0` with no special case.
:::

::: check
UBSan printed `signed integer overflow: 2147483000 + 1000 cannot be represented in type 'int'` and then the program printed `-2147483296`. Which of those two lines may you quote in a design review as a fact about C++, and why?
:::

::: answer
Only the first. The diagnostic is a statement that the program executed an operation the standard does not define, which is true of the program regardless of build. The `-2147483296` is what one compiler, at one optimisation level, on one machine, happened to produce; the standard requires nothing of it, so it is not a property of the code and citing it would encourage exactly the reasoning that gets people into trouble — designing around observed wrap. The only correct conclusion from the second line is that the program must be changed so the operation never happens: a wider type, an explicit range check, or unsigned arithmetic where wrap is genuinely intended.
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
| Signed overflow | **undefined behaviour**; the compiler assumes it never happens |
| Undefined behaviour | no requirement on the program; instances: signed overflow, uninitialised read, out-of-bounds index, null or dangling dereference, data race |
| `-Wsign-compare`, `-Wtype-limits`, `-Wconversion` | the warnings that catch the above |
| `{}` initialisation | turns a narrowing conversion of a constant into a compile error |
| `-fsanitize=undefined` | finds it at run time; add `-fno-sanitize-recover=all` in tests |
| `for (std::size_t i = n; i-- > 0;)` | the countdown loop that is correct for `n == 0` |

Lesson 06 turns from arithmetic to the object model: what a variable actually is in C++, how assignment differs from Python's name binding, and what a reference is.
