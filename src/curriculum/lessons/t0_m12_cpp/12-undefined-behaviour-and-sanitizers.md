---
id: l12-undefined-behaviour-and-sanitizers
title: Undefined behavior, and the sanitizers that catch it
minutes: 24
covers:
  - undefined behavior
  - profiling and sanitizers: perf, valgrind, ASan/UBSan
---

Imagine a board game whose rulebook says, for a few moves: "If a player does this, the rest of the game has no rules." Not "they lose a turn" — *no rules at all*. Anything that happens next counts as legal.

Python has no moves like that. Index past the end of a list and you get an `IndexError`. Add two integers and they grow as big as they need. Read a name before assigning it and you get a `NameError`. Every mistake is a defined event with a defined message.

C++ is different in kind. The C++ standard — the official rulebook for the language — lists a long catalog of situations for which it **[[imposes no requirements|no-requirements]]**: a signed integer overflowing, an array indexed out of bounds, an uninitialized variable read, a freed object used. This is **undefined behavior**, or UB. The program may crash, print the wrong number, or print the right number in every test and the wrong one in flight. And the compiler is allowed to assume none of it ever happens.

That last point makes UB the most dangerous class of bug in flight software. Tests exercise one build, with one compiler, one set of flags and one set of inputs. UB is exactly the kind of defect whose effects change between builds and inputs. So a passing test suite proves less than it seems to. This lesson explains what UB is, why the language has it, and how the compiler uses it. Then it introduces the two tools that make it visible: **UndefinedBehaviorSanitizer** and **AddressSanitizer**, which add checks to a build that turn "may do anything" into a report with a file and a line number.

The next lesson covers the profilers, valgrind and the static analyzers. Together with the sanitizers, they run on every change — and the flight build itself contains none of them.

## What "undefined" means

The standard has three levels of "not fully pinned down".

- **Implementation-defined** behavior is a choice the compiler makes, writes down and sticks to. Examples: the size of `int`, or whether a `char` is signed.
- **Unspecified** behavior is one of several allowed outcomes, with no need to say which. Example: the order in which a function call's arguments are evaluated.
- **Undefined** behavior is the absence of any rule at all. Once a program does an operation with UB, the standard says nothing about anything the program does — in principle including output it printed *before* the operation, because the compiler may have reordered the code.

The first two are bounded. You know the menu of possible results. UB has no menu.

::: key
Four sources of undefined behavior in C++: signed integer overflow; out-of-bounds array access; use of an uninitialised value; use-after-free or dangling reference. The compiler may assume undefined behavior never happens, which is how a null check gets optimized away.
:::

GNC code meets other members of the family too:

- shifting by at least the width of the type, or by a negative amount;
- integer division by zero;
- dereferencing a null pointer;
- a **misaligned** load — reading, say, a `double` from an address that is not a multiple of its size — through a cast pointer;
- a **[[data race|data-race]]**: two threads touching the same object without coordination, at least one of them writing;
- reading an object through a pointer to an unrelated type, a **[[strict aliasing|strict-aliasing]]** violation (use `memcpy` or C++20's `std::bit_cast` to reinterpret bytes instead);
- modifying an object declared `const`;
- casting an out-of-range integer to a plain `enum` that has no fixed underlying type;
- the container mistakes from lesson 6, which are use-after-free in disguise.

Two notes about decimals. Dividing a `double` by zero is *not* undefined: the **[[IEEE 754|ieee-754]]** floating-point rules give infinity or NaN ("not a number"), and the result carries on through later math. But converting a `double` that is outside the range of `int` into an `int` *is* undefined — the kind of mistake that has **[[destroyed a rocket|ariane-bridge]]**.

## What the compiler does with the assumption

The compiler treats "this program has no UB" as a fact, and simplifies the code using it. Signed overflow shows this most cleanly.

An `int` on your machine is 32 bits. Its largest value, `INT_MAX`, is $2^{31} - 1 = 2{,}147{,}483{,}647$. On the hardware, adding 1 to that **[[wraps around|wraparound]]** to the most negative value, like a car's odometer rolling over. But the C++ standard does not promise that. For signed integers, going past the top is UB.

::: example The overflow check that is not there
```cpp
#include <climits>
#include <cstdio>

// Intended as an overflow check. Signed overflow is undefined behaviour, so the
// compiler may assume x + 1 never overflows, and then x + 1 < x is always false.
bool would_overflow(int x) { return x + 1 < x; }

int main() {
  int x = INT_MAX;
  std::printf("INT_MAX = %d\n", x);
  std::printf("would_overflow(INT_MAX) = %s\n", would_overflow(x) ? "true" : "false");
  return 0;
}
// $ g++ -std=c++20 -O2 ovf.cpp -o ovf && ./ovf      (the same with -O0)
// INT_MAX = 2147483647
// would_overflow(INT_MAX) = false
//
// $ g++ -std=c++20 -O2 -g -fsanitize=undefined ovf.cpp -o ovf && ./ovf
// INT_MAX = 2147483647
// ovf.cpp:6:39: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
// would_overflow(INT_MAX) = true
```

Two people reasoned about line 6, and they reasoned differently.

- **The programmer:** if `x + 1` wraps around to a negative number, it will be less than `x`, and the comparison catches it.
- **The compiler:** `x + 1` cannot overflow, because overflow is UB and this program has no UB. So `x + 1` is bigger than `x` for every `x`. So the function always returns `false`, and the addition need not even happen.

The GCC 13 used here made that simplification even at `-O0`, with optimization off. The check was gone from the very program the tests ran.

Under UndefinedBehaviorSanitizer the addition gets a check. The report names the file, line and column (`ovf.cpp:6:39`), the operation and the values. The function then returns what the programmer expected.

The right check never does the overflowing operation. Compare first — `x == INT_MAX` — or use the compiler builtin `__builtin_add_overflow`, or do the arithmetic in a wider or unsigned type.
:::

The same reasoning does other surprising things:

- it deletes a null check placed *after* a dereference, because the dereference "proves" the pointer was not null;
- it turns a loop whose signed counter would overflow into an infinite loop;
- it reads past the end of an array with no check, because a valid program would never ask it to.

None of this is a compiler bug. The license is what makes C++ fast. There are no bounds checks on every index. Signed counters can be widened into full machine registers. Memory accesses can be reordered freely. Removing UB from the language would remove most of those optimizations with it. So the language keeps the license, and the toolchain supplies detectors.

You can ask the compiler to *define* some of these cases. `-fwrapv` makes signed overflow wrap around. `-ftrapv` makes it stop the program. `-fno-strict-aliasing` allows reading bytes through the wrong pointer type. `-fno-delete-null-pointer-checks` keeps those checks. Some flight projects build with `-fwrapv`. But these flags close a few doors and leave hundreds open. The sanitizers are the general tool.

::: example The read past the end that produced the right answer
A function averages a window of four accelerometer readings, in $\mathrm{m/s^2}$.

```cpp
#include <cstdio>

double mean_of(const double* v, int n) {
  double s = 0.0;
  for (int i = 0; i <= n; ++i) s += v[i];   // <= : reads one past the end
  return s / n;
}

int main() {
  double window[4] = {9.78, 9.81, 9.83, 9.80};
  std::printf("mean = %f\n", mean_of(window, 4));
  return 0;
}
// $ g++ -std=c++20 -Wall -Wextra -O2 oob.cpp -o oob && ./oob
// mean = 9.805000
```

The loop runs `i = 0, 1, 2, 3, 4` — five times, because of `<=`. So it reads `v[4]`, the eight bytes right past the array. There is no warning; the compiler cannot see through the pointer to the array's size.

Check the arithmetic: $9.78 + 9.81 + 9.83 + 9.80 = 39.22$, and $39.22 / 4 = 9.805$. The printed mean is *correct*. Whatever sat past `window` on the **[[stack|stack-picture]]** happened to be zero. A test of this function passes.

Change the code around it, or the compiler, and the mean picks up a random extra term. This is how UB looks in the field: a bug present since the first commit, exercised by every test, detected by none, waiting for something unrelated to move.
:::

## UndefinedBehaviorSanitizer

**UBSan** is a set of extra checks turned on with the flag `-fsanitize=undefined`. Wherever the compiler writes an operation that *could* be undefined — a signed addition, a shift, an integer division, a pointer dereference, an index into an array whose size it knows, a load of an `enum` or a `bool` — it also writes a check. When a check fails, it prints a message and, by default, lets the program continue.

```cpp
#include <cstdio>

int main(int argc, char**) {
  unsigned int bits = 1u;
  int shift = 30 + argc + 1;                 // 32 when run with no arguments
  unsigned int mask = bits << shift;         // shift by the full width: undefined
  double big = 3.0e9 * argc;                 // 3e9 does not fit in an int
  int n = static_cast<int>(big);             // out-of-range conversion: undefined
  std::printf("mask = %u, n = %d\n", mask, n);
  return 0;
}
// $ g++ -std=c++20 -O1 -g -fsanitize=undefined misc.cpp -o misc && ./misc
// misc.cpp:6:28: runtime error: shift exponent 32 is too large for 32-bit type 'unsigned int'
// mask = 1, n = -2147483648
//
// $ g++ -std=c++20 -O1 -g -fsanitize=undefined,float-cast-overflow misc.cpp -o misc && ./misc
// misc.cpp:6:28: runtime error: shift exponent 32 is too large for 32-bit type 'unsigned int'
// misc.cpp:8:28: runtime error: 3e+09 is outside the range of representable values of type 'int'
// mask = 1, n = -2147483648
```

(`argc` counts the program's command-line words, so it is 1 here. Using it stops the compiler from working out the answer in advance.)

Look at what each run caught. The default group caught the shift by 32. It did *not* catch the conversion of $3 \times 10^9$ to `int`, which is bigger than $2{,}147{,}483{,}647$. That conversion quietly produced $-2{,}147{,}483{,}648$ — the processor's "invalid integer" value — with no message. Only the second run, which names the extra check `float-cast-overflow`, reported it. An index out of bounds shows up the same way, as `runtime error: index 4 out of bounds for type 'int [4]'`, when the compiler can see the array's size.

UBSan's cost is modest, typically tens of percent in speed, so a whole test suite runs under it comfortably. Add `-fno-sanitize-recover=undefined` to make the first report fatal, so a build-server job fails instead of scrolling messages past.

## AddressSanitizer

**ASan** finds the memory errors UBSan cannot see: each instruction is fine on its own, but it touches memory the program does not own.

It works like a building with a guard at every door. ASan keeps **[[shadow memory|shadow-memory]]**: one byte of notes for every eight bytes of program memory, recording whether those bytes may be used. Around every stack, heap and global object it places **red zones** — "poisoned" padding — so an access one element past the end lands on poison. Freed heap memory is held in **quarantine** for a while instead of being reused, so a use-after-free finds poison instead of some new object's data. Every load and store checks the shadow first.

The cost is about twice as slow and two to three times the memory. At exit, a built-in part called **LeakSanitizer** reports every allocation that was never freed.

::: example A reference into a vector, after the vector grew
```cpp
#include <cstdio>
#include <vector>

int main(int argc, char**) {
  std::vector<double> gains{0.5, 1.5, 2.5};
  const double& first = gains[0];          // reference into the vector's buffer
  for (int i = 0; i < argc + 2; ++i) gains.push_back(1.0 * i);   // reallocates
  std::printf("first = %f\n", first);      // heap-use-after-free: the old buffer is gone
  return 0;
}
// $ g++ -std=c++20 -O1 -g -fsanitize=address -fno-omit-frame-pointer asan.cpp -o asan && ./asan
// ==8106==ERROR: AddressSanitizer: heap-use-after-free on address 0x503000000040 at pc ...
// READ of size 8 at 0x503000000040 thread T0
//     #0 0x... in main asan.cpp:8
//
// 0x503000000040 is located 0 bytes inside of 24-byte region [0x503000000040,0x503000000058)
// freed by thread T0 here:
//     #0 0x... in operator delete(void*, unsigned long)
//     #1 0x... in std::__new_allocator<double>::deallocate(double*, unsigned long)
//     ...
// previously allocated by thread T0 here:
//     #0 0x... in operator new(unsigned long)
//     #1 0x... in std::__new_allocator<double>::allocate(unsigned long, void const*)
//     ...
// SUMMARY: AddressSanitizer: heap-use-after-free asan.cpp:8 in main
```

This is lesson 6's warning caught in the act. The vector starts with room for three doubles. Pushing three more forces it to move to a bigger buffer and free the old one. `first` still points into the old one.

The report has three parts, and each answers a question.

1. **What happened?** A read of 8 bytes (one `double`) at a freed address, at `asan.cpp:8` — the `printf`.
2. **Who freed it?** `operator delete`, called from the vector's allocator: the move to a bigger buffer inside `push_back`.
3. **Who allocated it?** `operator new`, from the same allocator, when the vector was built. The 24-byte region is the original buffer: $3 \times 8 = 24$ bytes.

With the sanitizer off, `first` reads whatever now sits at that address; one run here printed `first = 0.000000` instead of `0.5`. The addresses and the process number (`8106`) change from run to run. The file and line do not.
:::

Run the earlier `mean_of` under ASan, and the silent read becomes a loud one:

```text
==7983==ERROR: AddressSanitizer: stack-buffer-overflow on address 0x7f9cfdc00040 ...
READ of size 8 at 0x7f9cfdc00040 thread T0
    #0 0x... in mean_of(double const*, int) oob.cpp:5
    #1 0x... in main oob.cpp:11
Address 0x7f9cfdc00040 is located in stack of thread T0 at offset 64 in frame
    #0 0x... in main oob.cpp:9
  This frame has 1 object(s):
    [32, 64) 'window' (line 10) <== Memory access at offset 64 overflows this variable
```

It names the variable, its extent — bytes 32 to 64, which is $4 \times 8 = 32$ bytes — and the exact offset of the bad read, 64, the first byte past the end. And a `new Table{}` of 64 doubles that is never deleted ends the run with:

```text
==8262==ERROR: LeakSanitizer: detected memory leaks
Direct leak of 512 byte(s) in 1 object(s) allocated from:
    #0 0x... in operator new(unsigned long)
    #1 0x... in load_table() leak.cpp:3
    #2 0x... in main leak.cpp:5
```

$64 \times 8 = 512$ bytes, allocated in `load_table` and never returned.

::: key
AddressSanitizer catches out-of-bounds access, use-after-free and leaks; UndefinedBehaviorSanitizer catches signed overflow, misaligned access, invalid casts and null dereference. Both are compile flags (`-fsanitize=address,undefined`) and belong in CI, not in the flight build.
:::

### The standard recipe

`-fsanitize=address,undefined -fno-omit-frame-pointer -g -O1` means:

- both sanitizers together;
- keep **frame pointers**, so the stack traces are complete;
- `-g` debug information, so the traces carry line numbers;
- light optimization, so the code resembles the release build without the sanitizer's own checks being optimized into confusion.

Environment variables tune the run: `ASAN_OPTIONS=halt_on_error=1:detect_leaks=1` and `UBSAN_OPTIONS=print_stacktrace=1` are the usual ones.

Two more sanitizers complete the set. **ThreadSanitizer**, `-fsanitize=thread`, finds data races. It cannot share a build with ASan, because each needs its own shadow-memory layout, so it gets a separate build. **MemorySanitizer** finds reads of uninitialized memory. It works only with Clang and needs a specially built standard library, so in practice that job falls to the compiler's `-Wuninitialized` warning and to valgrind's memcheck, in the next lesson.

Why not fly with the sanitizers on, since they catch so much? Because they double the memory, add a run-time library that allocates and takes locks, change timing unpredictably, and need operating-system features a flight computer may not have. Every one of those breaks lesson 9's rules. The flight build is protected differently: by having run the *same tests* under sanitizer builds, by the static analyzers of the next lesson, by `-Wall -Wextra -Werror`, and by code that avoids the places UB lives.

::: warning
A sanitizer reports only the UB that the tests actually *run*. A path no test takes is never examined. A bounds error that depends on a sensor value nobody simulated is still there. Sanitizer runs are necessary, not sufficient; how much of the code the tests cover is what gives them reach.
:::

## Writing code with no UB to find

The best defense is to write in the part of C++ where UB cannot arise — mostly the part this module has been teaching.

- Initialize every variable where you declare it.
- Use `std::array`, `std::span` and range-for loops instead of raw pointers and hand-written indices, so there is no index arithmetic to get wrong.
- Keep counters and bit fields in unsigned or fixed-width types whose wraparound is defined, or check before adding.
- Clamp a `double` into range before converting it to an integer.
- Hold objects by value or by an RAII owner, reach them by reference, and never keep a reference into a container across an operation that could reallocate it.
- Reinterpret bytes with `memcpy` or `std::bit_cast`, never through a cast pointer.
- Compile with `-Wall -Wextra -Werror`, and add `-Wconversion` and `-Wshadow` when the codebase can bear them.

Then build the test program three ways and run it three ways: a Debug build with ASan and UBSan, a Release build with `-DNDEBUG`, and the flight cross-build. A defect that shows up in only one of the three is almost always UB.

::: warning
Do not "fix" a sanitizer report by making the symptom go away. If ASan reports a use-after-free on a reference into a vector, the fix is not a bigger `reserve` that happens to avoid the reallocation in the test. The fix is to stop holding the reference across the `push_back`. The report points at a broken rule, and the rule is what needs restoring.
:::

## Check yourself

::: check
`would_overflow(INT_MAX)` returned `false` at both `-O0` and `-O2`, and `true` under UBSan. Explain all three results, and write a correct overflow check for adding 1 to an `int`.
:::

::: answer
The compiler may assume `x + 1` never overflows, since overflow is UB. Under that assumption `x + 1 < x` is false for every `x`. GCC folded the comparison to the constant `false` in its earliest simplification passes, which here ran even at `-O0`.

Under UBSan the addition gets a check. The check reports the overflow, and then the comparison runs on the wrapped value, which is negative and less than `x`. That gives `true` — the naive expectation, plus a diagnostic.

A correct check never performs the overflowing operation: `if (x == INT_MAX) { /* would overflow */ }`, or `int r; if (__builtin_add_overflow(x, 1, &r)) { ... }`, or compute in `std::int64_t` and check the range of the result.
:::

::: check
Classify each as defined or undefined: `1.0 / 0.0`; `1 / 0`; a `static_cast` of `3.0e9` to `int`; `std::uint32_t{1} << 32`; `std::uint8_t{250} + std::uint8_t{10}` stored into a `std::uint8_t`.
:::

::: answer
- `1.0 / 0.0` is defined: IEEE 754 gives positive infinity.
- `1 / 0` is undefined: integer division by zero.
- Converting `3.0e9` to `int` is undefined: the value is outside the range of `int`. UBSan needs `-fsanitize=float-cast-overflow` to report it.
- `std::uint32_t{1} << 32` is undefined: the shift amount equals the width of the type.
- The last is defined. Both operands are first promoted to `int`, the sum 260 is computed exactly, and storing it in a `std::uint8_t` wraps it modulo 256: $260 - 256 = 4$. Unsigned conversion has a rule for this.
:::

::: check
In the `heap-use-after-free` report, what does the "freed by" stack trace tell you about the cause, and what is the correct fix?
:::

::: answer
The freeing call is `operator delete`, reached from the vector's own allocator. So the vector itself released the buffer — a reallocation, triggered by `push_back` when the capacity of three was exceeded. The reference `first` was bound to an element of the old buffer and dangled from that moment.

The fix is not to grow the starting capacity so the test happens to avoid reallocation. It is to stop holding a reference across an operation that can reallocate: copy the value into a `double` before the loop, or index `gains[0]` again after the loop.
:::

::: check
`mean_of` read one element past its array and printed the correct mean without any sanitizer. Why did it seem to work, and why is that outcome worse than a crash?
:::

::: answer
The extra read fetched the eight bytes after `window` on the stack. In that build they happened to hold zero, so the sum was unchanged and the mean was exact.

The behavior is undefined, so nothing guarantees the zero. Different local variables, a different compiler or optimization level, or a different caller could put any value there, and the mean would gain a random error. A crash would have been found in the first test. A silently correct answer lets the bug survive until a change in an unrelated part of the program — possibly in flight — exposes it. AddressSanitizer turns the silent read into a `stack-buffer-overflow` report at the exact line.
:::

::: check
Which tool would you reach for to find: a memory leak; a data race between two tasks; a signed overflow in a telemetry counter; a read of an uninitialized `double`? Which two sanitizers cannot share a build, and why is none of them in the flight program?
:::

::: answer
- A leak: AddressSanitizer, whose LeakSanitizer part reports unfreed allocations at exit.
- A data race: ThreadSanitizer, `-fsanitize=thread`.
- A signed overflow: UndefinedBehaviorSanitizer.
- An uninitialized read: MemorySanitizer under Clang with a specially built standard library, or, more practically, valgrind's memcheck (lesson 13) together with `-Wuninitialized`.

ThreadSanitizer and AddressSanitizer each need their own shadow-memory layout and run-time library, so they cannot be combined in one program. None goes into the flight build, because they double the memory, add a run-time that allocates and locks, and change timing — each one a violation of the hot-loop rules. They run on the test programs in continuous integration instead.
:::

## Summary

| Item | Meaning |
| --- | --- |
| undefined behavior | the standard imposes no requirements; the compiler assumes it never happens |
| implementation-defined / unspecified | a documented choice / one of several allowed outcomes; both bounded, UB is not |
| four common sources | signed overflow; out-of-bounds access; uninitialized read; use-after-free or dangling reference |
| also undefined | oversized shifts, integer division by zero, null dereference, misaligned access, data races, strict-aliasing violations, out-of-range `double`-to-`int` |
| defined despite appearances | unsigned wraparound; floating-point division by zero (infinity or NaN) |
| optimizer consequence | `x + 1 < x` folds to `false`; null checks after a dereference disappear |
| `-fsanitize=undefined` | UBSan: reports overflow, shifts, bounds, null and misaligned access with file and line; low cost |
| `-fsanitize=address` | ASan: shadow memory and red zones; heap and stack overflows, use-after-free, leaks; about 2× slower |
| recipe | `-fsanitize=address,undefined -fno-omit-frame-pointer -g -O1` in a CI build of the tests |
| `-fsanitize=thread` | ThreadSanitizer for data races; a separate build from ASan |
| not in flight | sanitizers double memory and change timing; the flight build relies on the CI runs, static analysis and `-Werror` |

The next lesson covers the rest of the toolbox: measuring where time goes with `perf` and valgrind, proving the allocation-free claim with valgrind's heap tools, and the static analyzers — clang-tidy and cppcheck — that read the code without running it.

::: context no-requirements Demons out of your nose
In 1992, on an online forum about the C standard, a programmer explained "undefined" by saying that when a program does something undefined, it would be perfectly legal for the compiler to make demons fly out of your nose. The phrase stuck. C and C++ programmers still say "nasal demons" for UB. The joke makes a serious point: the standard does not merely fail to say *which* bad thing happens — it places no limit on what happens at all.
:::

::: context data-race Two hands on one whiteboard
Picture two people updating the same number on a whiteboard. Each reads it, adds one in their head, and writes the result. If both read "5" at the same moment, both write "6", and one update is lost. In a program the threads are the people, and a **data race** is two of them touching the same memory at once, with at least one writing and nothing — a lock or an atomic operation — making them take turns. In C++ it is more than a lost update: it is undefined behavior, because the compiler assumed nobody else was writing.
:::

::: context strict-aliasing One piece of memory, two types
"Aliasing" means two names for the same memory. The **strict aliasing** rule says that you may not read an object's memory through a pointer to an unrelated type — for example, looking at a `float`'s bytes through an `int*`. The compiler relies on this: it assumes a write through an `int*` cannot change any `float`, so it may keep the `float` in a register and never reload it. `memcpy` and `std::bit_cast` copy the bytes into a new object of the new type, which the rules allow, and modern compilers turn them into a single instruction anyway.
:::

::: context ieee-754 The rulebook for decimals
IEEE 754 is the standard, first published in 1985, that almost every processor follows for floating-point numbers. It fixes how a `double` is stored — a sign bit, 11 exponent bits and 52 fraction bits — and exactly what every operation returns, including the awkward cases. Dividing a positive number by zero gives $+\infty$; $0/0$ gives NaN, "not a number". These special values then flow through later math, so one bad division can turn an entire state vector into NaN — defined behavior, but still a bug to catch.
:::

::: context ariane-bridge A conversion that ended a first flight
The dangers of turning a big floating-point number into a small integer are not hypothetical. On 4 June 1996, the first Ariane 5 rocket broke up about 40 seconds after launch. Its inertial reference software, reused from Ariane 4, converted a horizontal-velocity value from a 64-bit float to a 16-bit signed integer. Ariane 5 flew faster sideways than Ariane 4 ever had, the value no longer fit, and the conversion failed. The code was in Ada, which raised an error rather than silently producing garbage — but the unhandled error shut down both inertial reference units. In C++ the same conversion would have been undefined behavior.
:::

::: context wraparound The odometer and the integer circle
Picture a car's odometer: after 999,999 it rolls over to 000,000. Hardware integers roll over the same way. In the usual encoding, called two's complement, a 32-bit `int` counts up to $2{,}147{,}483{,}647$, and one more lands on $-2{,}147{,}483{,}648$. The hardware does this happily. C++ says that for *signed* integers you may not rely on it — the overflow is undefined — while for *unsigned* integers the rollover is guaranteed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="30" r="5" fill="#b4232c"/>
  <circle cx="180" cy="170" r="5" fill="#1f2a44"/>
  <circle cx="250" cy="100" r="4" fill="#1d6fd1"/>
  <circle cx="110" cy="100" r="4" fill="#1d6fd1"/>
  <text x="180" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="258" y="104" font-size="12" fill="#1d6fd1">+2^30</text>
  <text x="102" y="104" font-size="12" text-anchor="end" fill="#1d6fd1">−2^30</text>
  <text x="194" y="18" font-size="12" fill="#1f2a44">INT_MAX = 2147483647</text>
  <text x="166" y="18" font-size="12" text-anchor="end" fill="#b4232c">INT_MIN</text>
  <path d="M232.4,146.4 A70,70 0 0,0 232.4,53.6" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="229.8,50.6 240.2,54.8 232.7,61.4" fill="#1d6fd1"/>
  <text x="300" y="150" font-size="11" text-anchor="middle" fill="#1d6fd1">counting up</text>
  <text x="180" y="60" font-size="11" text-anchor="middle" fill="#b4232c">+1 rolls over here</text>
</svg>
```
:::

::: context stack-picture What sits past the end
Local variables live side by side in the function's patch of stack. `window` takes 32 bytes, four doubles. The loop's fifth read lands on the next 8 bytes, which belong to something else — here they held zero, so nothing looked wrong.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="40" width="64" height="34" fill="#8fb8f0"/>
    <rect x="84" y="40" width="64" height="34" fill="#8fb8f0"/>
    <rect x="148" y="40" width="64" height="34" fill="#8fb8f0"/>
    <rect x="212" y="40" width="64" height="34" fill="#8fb8f0"/>
    <rect x="276" y="40" width="64" height="34" fill="#fff" stroke-dasharray="4 3"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="52" y="61">9.78</text><text x="116" y="61">9.81</text><text x="180" y="61">9.83</text><text x="244" y="61">9.80</text>
    <text x="308" y="61">???</text>
    <text x="52" y="92">v[0]</text><text x="116" y="92">v[1]</text><text x="180" y="92">v[2]</text><text x="244" y="92">v[3]</text>
  </g>
  <text x="308" y="92" font-size="12" text-anchor="middle" fill="#b4232c">v[4]</text>
  <text x="148" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">window: 4 × 8 = 32 bytes</text>
  <text x="308" y="28" font-size="11" text-anchor="middle" fill="#b4232c">not yours</text>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">i &lt;= n makes the loop read one slot too many</text>
</svg>
```
:::

::: context shadow-memory A notebook beside the memory
For every 8 bytes of program memory, ASan keeps 1 byte of notes. A note of 0 means "all 8 bytes usable"; a special value means "poison — a red zone or freed memory". Before every load or store, the instrumented program looks up the note. Red zones sit on both sides of each object, so stepping one past either end hits poison at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="14" y="30" font-size="11" fill="#1f2a44">memory</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="70" y="16" width="48" height="24" fill="#f2b880"/>
    <rect x="118" y="16" width="48" height="24" fill="#8fb8f0"/>
    <rect x="166" y="16" width="48" height="24" fill="#8fb8f0"/>
    <rect x="214" y="16" width="48" height="24" fill="#8fb8f0"/>
    <rect x="262" y="16" width="48" height="24" fill="#f2b880"/>
  </g>
  <g font-size="10" text-anchor="middle" fill="#1f2a44">
    <text x="94" y="32">red zone</text><text x="142" y="32">8 bytes</text><text x="190" y="32">8 bytes</text><text x="238" y="32">8 bytes</text><text x="286" y="32">red zone</text>
  </g>
  <text x="14" y="94" font-size="11" fill="#1f2a44">shadow</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="84" y="80" width="20" height="20" fill="#f2b880"/>
    <rect x="132" y="80" width="20" height="20" fill="#fff"/>
    <rect x="180" y="80" width="20" height="20" fill="#fff"/>
    <rect x="228" y="80" width="20" height="20" fill="#fff"/>
    <rect x="276" y="80" width="20" height="20" fill="#f2b880"/>
  </g>
  <g font-size="10" text-anchor="middle" fill="#1f2a44">
    <text x="94" y="94">fa</text><text x="142" y="94">00</text><text x="190" y="94">00</text><text x="238" y="94">00</text><text x="286" y="94">fa</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 2">
    <line x1="94" y1="40" x2="94" y2="80"/><line x1="142" y1="40" x2="142" y2="80"/><line x1="190" y1="40" x2="190" y2="80"/>
    <line x1="238" y1="40" x2="238" y2="80"/><line x1="286" y1="40" x2="286" y2="80"/>
  </g>
  <text x="190" y="122" font-size="11" text-anchor="middle" fill="#6c7a93">1 shadow byte per 8 bytes; fa marks a heap red zone</text>
</svg>
```

A full ASan report ends with a map of these notes around the bad address: `00` for usable memory, `fa` for a heap red zone, `fd` for freed memory.
:::
