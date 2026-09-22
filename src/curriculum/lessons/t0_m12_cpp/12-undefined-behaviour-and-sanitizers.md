---
id: l12-undefined-behaviour-and-sanitizers
title: Undefined behaviour, and the sanitizers that catch it
minutes: 26
covers:
  - undefined behaviour
  - profiling and sanitizers: perf, valgrind, ASan/UBSan
---

Python has no undefined behaviour. Index past the end of a list and you get an `IndexError`; add two integers and they grow without limit; read a name before assigning it and you get a `NameError`. Every mistake is a defined event with a defined message. C++ is different in kind, not degree. The standard lists a few hundred situations — a signed integer overflowing, an array indexed out of bounds, an uninitialised variable read, a freed object used — for which it *imposes no requirements*. The program may crash, may print the wrong number, may print the right number in every test and the wrong one in flight, and the compiler is permitted to assume none of it ever happens.

That last clause is what makes undefined behaviour the most dangerous class of bug in flight software. Tests exercise the behaviour of one build, with one compiler, one set of flags and one set of inputs. Undefined behaviour is exactly the class of defect whose consequences differ between builds and inputs — so a test suite that passes proves less than it appears to. This lesson explains what undefined behaviour is, why the language has it, how the compiler exploits it, and then introduces the two tools that make it visible: UndefinedBehaviorSanitizer and AddressSanitizer, compile-time instrumentation that turns "may do anything" into a report with a file and a line number.

The sanitizers are half of the topic this lesson shares with the next; lesson 13 covers the profilers, valgrind and the static analysers. The three together are the tooling that a flight project runs on every commit — and that the flight build itself never contains.

## What "undefined" means

The standard distinguishes three kinds of behaviour it does not fully pin down. **Implementation-defined** behaviour is a documented choice the compiler makes and sticks to: the size of `int`, whether `char` is signed. **Unspecified** behaviour is one of several valid outcomes with no requirement to say which: the order in which the arguments of a function call are evaluated. **Undefined** behaviour is the absence of any requirement at all. Once a program performs an operation with undefined behaviour, the standard says nothing about anything the program does — including, in principle, the output it produced *before* the operation, because the compiler may have reordered it.

::: key
Four sources of undefined behaviour in C++: signed integer overflow; out-of-bounds array access; use of an uninitialised value; use-after-free or dangling reference. The compiler may assume undefined behaviour never happens, which is how a null check gets optimised away.
:::

Other members of the family that GNC code meets regularly: shifting by an amount greater than or equal to the width of the type, or by a negative amount; integer division by zero; dereferencing a null pointer; a misaligned load through a cast pointer; two threads accessing the same object without synchronisation, one of them writing (a data race); reading an object through a pointer to an unrelated type (a *strict aliasing* violation — use `memcpy` or C++20's `std::bit_cast` to reinterpret bytes); modifying an object declared `const`; casting an out-of-range integer to an `enum class` with no fixed underlying type; and the container mistakes from lesson 6, which are use-after-free in disguise. Two floating-point notes: dividing a `double` by zero is *not* undefined — IEEE 754 gives infinity or NaN, and the result propagates — but converting a `double` outside the range of `int` to an `int` *is*.

## What the compiler does with the assumption

The compiler treats "no undefined behaviour" as a fact about your program and simplifies accordingly. Signed overflow is the cleanest illustration.

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
// ovf.cpp:6:39: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
// INT_MAX = 2147483647
// would_overflow(INT_MAX) = true
```

The programmer reasoned: if `x + 1` wraps around to a negative number, the comparison catches it. The compiler reasoned: `x + 1` cannot overflow, because overflow is undefined and the program has no undefined behaviour; therefore `x + 1 > x` for every `x`; therefore the function returns `false` unconditionally, and the addition need not even be performed. GCC makes that simplification at every optimisation level, so the check is gone from the binary the tests ran. Under UndefinedBehaviorSanitizer the addition is instrumented: the report names the file, line, operation and values, and the function then returns the answer the programmer expected. The correct check compares before adding — `x == INT_MAX`, or the compiler builtin `__builtin_add_overflow`, or arithmetic in a wider or unsigned type.
:::

The same reasoning removes a null check placed *after* a dereference (the dereference "proves" the pointer was not null), turns a loop whose signed counter would overflow into an infinite one, and lets the compiler read past the end of an array without any check because a valid program would never have asked it to. Nothing here is a compiler bug. The language grants the licence because that licence is what makes C++ fast: no bounds checks on every index, signed counters that can be widened to machine registers, memory accesses reordered freely. Removing undefined behaviour from the language would remove most of its optimisations with it. Instead, the language keeps the licence and the toolchain supplies detectors.

A compiler can be asked to *define* some of these behaviours. `-fwrapv` makes signed overflow wrap, `-ftrapv` makes it trap, `-fno-strict-aliasing` permits type punning through pointers, `-fno-delete-null-pointer-checks` keeps the checks. Some flight projects build with `-fwrapv`. These flags close a few doors and leave hundreds open; the sanitizers are the general tool.

::: example The read past the end that produced the right answer
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

The loop reads `v[4]`, eight bytes beyond the array. No warning — the compiler cannot see through the pointer — and the program prints the correct mean, because whatever happened to lie past `window` on the stack was a zero. A test of this function passes. Change the surrounding code so that a different variable sits there, or build with another compiler, and the mean acquires a random contribution. This is the shape of undefined behaviour in the field: a bug that has been present since the first commit, that every test has exercised and none has detected, waiting for a layout change.
:::

## UndefinedBehaviorSanitizer

UBSan is a set of compile-time instrumentations selected with `-fsanitize=undefined`. Wherever the compiler emits an operation that could be undefined — a signed addition, a shift, an integer division, a pointer dereference, an index into an array whose bound it knows, a load of an `enum` or `bool` — it also emits a check, and the check prints a diagnostic when it fails and, by default, lets the program continue:

```text
ovf.cpp:6:39: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
misc.cpp:6:39: runtime error: shift exponent 32 is too large for 32-bit type 'unsigned int'
ub.cpp:5:26: runtime error: index 4 out of bounds for type 'int [4]'
```

The overhead is modest, typically a few tens of percent, so an entire test suite runs under it comfortably. Add `-fno-sanitize-recover=undefined` to make the first report fatal, so that a continuous-integration job fails rather than scrolling diagnostics past. Some checks are not in the default group and are named explicitly: `-fsanitize=float-cast-overflow` catches the out-of-range `double`-to-`int` conversion, which the default set does not — the `static_cast<int>(3.0e9)` in the shift example passed silently and produced `-2147483648`, the processor's "indefinite integer" result, with no diagnostic until that flag was added.

## AddressSanitizer

ASan finds the memory errors that UBSan cannot see: accesses that are individually well-formed instructions but touch memory the program does not own. It works by *shadow memory* — one byte of bookkeeping for every eight bytes of application memory, recording whether they are addressable — and by *red zones*, poisoned padding placed around every stack, heap and global object, so that an access one element past the end lands on poison. Freed heap memory is quarantined rather than reused, so a use-after-free finds poison instead of the next object's data. Every load and store is instrumented to consult the shadow. The cost is about two times in speed and two to three times in memory, and at exit LeakSanitizer reports every allocation that was never freed.

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
// ==14761==ERROR: AddressSanitizer: heap-use-after-free on address 0x503000000040 at pc ... 
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

This is lesson 6's warning caught in the act. The report has three parts, and each answers a question. *What happened*: a read of eight bytes at an address that has been freed, at `asan.cpp:8`, the `printf`. *Who freed it*: `operator delete` called from the vector's allocator — the reallocation inside `push_back`. *Who allocated it*: `operator new` from the same allocator when the vector was constructed. The 24-byte region is the original three-`double` buffer. With the sanitizer off, `first` reads whatever now occupies that address and the program prints a plausible number. Addresses and process ids vary from run to run; the file and line do not.
:::

Run the earlier `mean_of` under ASan and the silent read becomes:

```text
==14777==ERROR: AddressSanitizer: stack-buffer-overflow on address 0x7fdb6ae00040 ...
READ of size 8 at 0x7fdb6ae00040 thread T0
    #0 0x... in mean_of(double const*, int) oob.cpp:5
    #1 0x... in main oob.cpp:11
Address 0x7fdb6ae00040 is located in stack of thread T0 at offset 64 in frame main
  This frame has 1 object(s):
    [32, 64) 'window' (line 10) <== Memory access at offset 64 overflows this variable
```

which names the variable, its extent and the exact offset of the bad access. And a `new Table{}` that is never deleted ends the run with:

```text
==14786==ERROR: LeakSanitizer: detected memory leaks
Direct leak of 512 byte(s) in 1 object(s) allocated from:
    #0 0x... in operator new(unsigned long)
    #1 0x... in load_table() leak.cpp:3
    #2 0x... in main leak.cpp:5
SUMMARY: AddressSanitizer: 512 byte(s) leaked in 1 allocation(s).
```

::: key
AddressSanitizer catches out-of-bounds access, use-after-free and leaks; UndefinedBehaviorSanitizer catches signed overflow, misaligned access, invalid casts and null dereference. Both are compile flags (`-fsanitize=address,undefined`) and belong in CI, not in the flight build.
:::

The standard recipe is `-fsanitize=address,undefined -fno-omit-frame-pointer -g -O1`: both sanitizers together, frame pointers kept so that the stack traces are complete, debug information so that they carry line numbers, and light optimisation so that the code resembles the release build without the sanitizer's own checks being optimised into confusion. Environment variables tune the run-time — `ASAN_OPTIONS=halt_on_error=1:detect_leaks=1` and `UBSAN_OPTIONS=print_stacktrace=1` are the usual ones. Two further sanitizers complete the set. ThreadSanitizer, `-fsanitize=thread`, detects data races and cannot be combined with ASan, so it is a separate build. MemorySanitizer detects reads of uninitialised memory; it is Clang-only and needs an instrumented standard library, so in practice the uninitialised-value job falls to the compiler's `-Wuninitialized` warnings and to valgrind's memcheck in the next lesson.

Why not ship the flight build with the sanitizers on, since they catch so much? Because they double the memory footprint, add a run-time library that allocates and takes locks, change timing unpredictably, and need operating-system facilities a flight computer may not have. Everything about them violates lesson 9. The flight build is protected differently: by having run the *same tests* under the sanitizer builds, by the static analysers of the next lesson, by `-Wall -Wextra -Werror`, and by code that avoids the constructs where undefined behaviour lives.

::: warning
A sanitizer reports only the undefined behaviour that the tests *execute*. A path no test takes is unexamined, and a bounds error that depends on a sensor value nobody simulated is still there. Sanitizer runs are necessary, not sufficient; coverage of the test suite is what gives them reach.
:::

## Writing code with no undefined behaviour to find

The most effective defence is to write in the subset of C++ where undefined behaviour cannot arise, which is largely the subset this module has been teaching. Initialise every variable at its declaration. Use `std::array`, `std::span` and range-for instead of raw pointers and manual indices, so that there is no index arithmetic to get wrong. Keep counters and bit fields in unsigned or fixed-width types whose arithmetic is defined, or check before adding. Clamp a `double` into range before converting it to an integer. Hold objects by value or by RAII owner, reach them by reference, and never keep a reference into a container across an operation that could reallocate it. Reinterpret bytes with `memcpy` or `std::bit_cast`, never through a cast pointer. Compile with `-Wall -Wextra -Werror`, and add `-Wconversion` and `-Wshadow` when the codebase can bear them.

Then build the test binary three ways and run it three ways: a Debug build with ASan and UBSan, a Release build with `-DNDEBUG`, and the flight cross-build. A defect that appears in only one of the three is, almost always, undefined behaviour.

::: warning
Do not "fix" a sanitizer report by making the symptom go away. If ASan reports a use-after-free on a reference into a vector, the fix is not a larger initial `reserve` that happens to avoid reallocation in the test; it is to stop holding the reference across the `push_back`. The report identifies a rule that was broken, and the rule is what needs restoring.
:::

## Check yourself

::: check
`would_overflow(INT_MAX)` returned `false` at both `-O0` and `-O2`, and `true` under UBSan. Explain all three results, and write a correct overflow check for adding 1 to an `int`.
:::

::: answer
The compiler is entitled to assume `x + 1` never overflows, since overflow is undefined; under that assumption `x + 1 < x` is false for every `x`, and GCC folds the comparison to a constant during its earliest simplification passes, which run even at `-O0`. Under UBSan the addition is instrumented: the instrumentation reports the overflow and the comparison is then performed on the wrapped value, which is negative and less than `x`, giving `true` — the naive expectation, plus a diagnostic. A correct check never performs the overflowing operation: `if (x == INT_MAX) { /* would overflow */ }`, or `int r; if (__builtin_add_overflow(x, 1, &r)) { ... }`, or compute in `std::int64_t` and range-check the result.
:::

::: check
Classify each as defined or undefined: `1.0 / 0.0`; `1 / 0`; `static_cast<int>(3.0e9)`; `std::uint32_t{1} << 32`; `std::uint8_t{250} + std::uint8_t{10}` assigned to a `std::uint8_t`.
:::

::: answer
`1.0 / 0.0` is defined: IEEE 754 gives positive infinity. `1 / 0` is undefined: integer division by zero. `static_cast<int>(3.0e9)` is undefined: the value is outside the range of `int`, and UBSan needs `-fsanitize=float-cast-overflow` to report it. `std::uint32_t{1} << 32` is undefined: the shift amount equals the width of the type. The last is defined: both operands promote to `int`, the sum 260 is computed exactly, and converting it to `std::uint8_t` wraps modulo 256 to 4 by the rules for unsigned conversion.
:::

::: check
In the `heap-use-after-free` report, what does the "freed by" stack trace tell you about the cause, and what is the correct fix?
:::

::: answer
The freeing call is `operator delete` reached from the vector's allocator, which means the vector itself released the buffer — a reallocation triggered by `push_back` when the capacity of three was exceeded. The reference `first` was bound to an element of that old buffer and dangled from that moment. The fix is not to grow the initial capacity so that the test happens to avoid reallocation; it is to stop holding a reference across an operation that can reallocate — read the value into a `double` before the loop, or index `gains[0]` again after the loop.
:::

::: check
`mean_of` read one element past its array and printed the correct mean without any sanitizer. Why did it appear to work, and why is that outcome worse than a crash?
:::

::: answer
The extra read fetched the eight bytes following `window` on the stack, which in that build happened to hold zero, so the sum was unchanged and the mean was exact. The behaviour is undefined, so nothing guarantees the zero: a different set of local variables, a different compiler or optimisation level, or a different call site could place any value there, and the mean would acquire a random error. A crash would have been found in the first test; a silently correct answer means the bug survives until a layout change in an unrelated part of the program — possibly in flight — exposes it. AddressSanitizer converts the silent read into a `stack-buffer-overflow` report at the exact line.
:::

::: check
Which tool would you reach for to find: a memory leak; a data race between two tasks; a signed overflow in a telemetry counter; a read of an uninitialised `double`? Which two of the sanitizers cannot share a build, and why is none of them in the flight binary?
:::

::: answer
A leak: AddressSanitizer, whose LeakSanitizer component reports unfreed allocations at exit. A data race: ThreadSanitizer, `-fsanitize=thread`. A signed overflow: UndefinedBehaviorSanitizer. An uninitialised read: MemorySanitizer under Clang with an instrumented standard library, or, more practically, valgrind's memcheck (lesson 13) together with `-Wuninitialized`. ThreadSanitizer and AddressSanitizer both need their own shadow-memory layout and run-time, so they cannot be combined in one binary. None goes into the flight build because they double the memory footprint, add a run-time that allocates and locks, and change timing — each a violation of the hot-loop rules; they run in continuous integration on the test binaries instead.
:::

## Summary

| Item | Meaning |
| --- | --- |
| undefined behaviour | the standard imposes no requirements; the compiler assumes it never happens |
| implementation-defined / unspecified | a documented choice / one of several valid outcomes; both are bounded, UB is not |
| four common sources | signed overflow; out-of-bounds access; uninitialised read; use-after-free or dangling reference |
| also undefined | oversized shifts, integer division by zero, null dereference, misaligned access, data races, strict-aliasing violations, out-of-range `double`-to-`int` |
| defined despite appearances | unsigned wrap; floating-point division by zero (infinity or NaN) |
| optimiser consequence | `x + 1 < x` folds to `false`; null checks after a dereference disappear |
| `-fsanitize=undefined` | UBSan: reports overflow, shifts, bounds, null and misaligned access with file and line; low overhead |
| `-fsanitize=address` | ASan: shadow memory and red zones; heap and stack overflow, use-after-free, leaks; about 2× slower |
| recipe | `-fsanitize=address,undefined -fno-omit-frame-pointer -g -O1` in a CI build of the tests |
| `-fsanitize=thread` | ThreadSanitizer for data races; a separate build from ASan |
| not in flight | sanitizers double memory and change timing; the flight build relies on the CI runs, static analysis and `-Werror` |

The next lesson covers the rest of the toolbox: measuring where time goes with `perf` and valgrind, proving the allocation-free claim with valgrind's heap tools, and the static analysers — clang-tidy and cppcheck — that read the code without running it.
