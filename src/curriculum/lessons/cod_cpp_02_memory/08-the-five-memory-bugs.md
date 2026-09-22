---
id: l08-the-five-memory-bugs
title: Five ways to use memory you do not own
minutes: 21
covers:
  - Dangling pointers, use-after-free, double free, buffer overrun, uninitialised reads
---

Five bugs account for most memory corruption in C++: a pointer to an object that has died, a use of memory after it was freed, a second free of the same block, a write past the end of a buffer, and a read of storage that was never given a value. They are different mistakes with different causes, and they have one thing in common that makes them harder to teach than anything else in this module.

All five are **undefined behaviour**. That means the standard imposes no requirement at all: a program containing one of them has no defined meaning, and what it appears to do is a property of one build on one machine on one day. You cannot learn what a double free "does" by writing one and running it — as this lesson demonstrates by writing one and running it three ways, getting three different results, none of which is the answer.

So the goal here is not to catalogue symptoms. It is to know what each bug is, why the language declines to define it, and how to produce evidence that one exists. The evidence comes from the sanitizers, which lesson 09 takes up in full.

## What undefined behaviour licenses

The practical content of "undefined behaviour" is a permission granted to the compiler: it may assume your program does not contain any, and optimise on that assumption. The assumption is not a formality. Consider a function that looks defensive:

```cpp
int reading_or_error(const int* p) {
    int v = *p;
    if (p == nullptr) return -1;
    return v;
}
```

Dereferencing a null pointer is undefined, so after line 2 the compiler may assume `p` is not null. The check on line 3 therefore tests a condition that cannot be true, and dead code can be deleted. At `-O0`, g++ 13.3.0 emits the check:

```text
	mov	rax, QWORD PTR -24[rbp]
	mov	eax, DWORD PTR [rax]
	mov	DWORD PTR -4[rbp], eax
	cmp	QWORD PTR -24[rbp], 0
	jne	.L2
	mov	eax, -1
```

At `-O2` the entire function is:

```text
_Z16reading_or_errorPKi:
	endbr64
	mov	eax, DWORD PTR [rdi]
	ret
```

Two instructions. The null check is gone — not because the optimiser is hostile, but because the code said, one line earlier, that the pointer is valid. This is why "I added a check and it still crashed" happens, and why the honest description of undefined behaviour is not "it might do anything at run time" but "the code you wrote may not be the code that runs".

::: key
Undefined behaviour is a contract: you promise not to do it, and the compiler optimises as if you kept the promise. An observed result — a crash, a plausible number, a clean exit — is a fact about one build, never a fact about the language. Reason about what is undefined; use a sanitizer to produce evidence that it happened.
:::

## The same defect, three builds, three answers

::: example One double free, observed three ways
```cpp
struct Frame { double v[4]; };

int main() {
    Frame* f = new Frame{};
    std::printf("allocated\n");
    delete f;
    std::printf("deleted once\n");
    delete f;                            // undefined behaviour
    std::printf("deleted twice\n");
    return 0;
}
```

**Build 1, `g++ -O0`.** glibc's allocator notices that the block is already in its cache and aborts:

```text
allocated
deleted once
free(): double free detected in tcache 2
```

The shell reports `Aborted` and exit status 134.

**Build 2, `g++ -O1`.** The program prints all three lines and exits 0. Nothing is detected, because nothing happens: `nm -C` on the object file shows no reference to `operator new` or `operator delete` at all. The C++ standard permits an implementation to elide an allocation whose result is not observable, and the second `delete` is undefined, so the optimiser removed the allocation and both deallocations. There is no double free in the program that ran, because there is no allocation in the program that ran.

**Build 3, `g++ -O1 -fsanitize=address -fno-sanitize-recover=all`:**

```text
allocated
deleted once
==1132==ERROR: AddressSanitizer: attempting double-free on 0x503000000040 in thread T0:
    #0 ... in operator delete(void*, unsigned long)
    #1 0x5610d3f1537f in main l08-doublefree.cpp:12

0x503000000040 is located 0 bytes inside of 32-byte region [0x503000000040,0x503000000060)
freed by thread T0 here:
    #0 ... in operator delete(void*, unsigned long)
    #1 0x5610d3f1535a in main l08-doublefree.cpp:10

previously allocated by thread T0 here:
    #0 ... in operator new(unsigned long)
    #1 0x5610d3f152c0 in main l08-doublefree.cpp:8
```

Exit status 1, and three line numbers: where the second `delete` was (12), where the first one was (10), and where the block came from (8).

Three builds of the same source: an abort, a clean run, and a precise diagnosis. Anyone who concludes from build 2 that "double-freeing a small object is harmless in practice" has learned something false from a real experiment, which is exactly the trap this module is written to avoid. The sanitizer is the only one of the three that told the truth.
:::

## Dangling pointers and use-after-free

A **dangling pointer** holds the address of an object whose lifetime has ended. Using it is undefined. The two main producers are storage being freed — a use-after-free — and a scope or frame ending, which lessons 04 and 05 showed.

The version that catches people who have internalised Python is the one where nothing looks like a free at all.

::: example A reference into a vector, and one push_back too many
```cpp
std::vector<double> az;
az.push_back(-9.81);
double& first = az[0];              // a reference into the vector's buffer
std::printf("before: %.2f, capacity %zu\n", first, az.capacity());

for (int i = 0; i < 8; ++i) az.push_back(-9.80);   // forces reallocation
std::printf("after push_back: capacity %zu\n", az.capacity());
first = -9.79;                      // undefined behaviour
std::printf("%.2f\n", az[0]);
```

```text
before: -9.81, capacity 1
after push_back: capacity 16
about to write through the stale reference
==1176==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010 at pc 0x5570faee6715
WRITE of size 8 at 0x502000000010 thread T0
    #0 0x5570faee6714 in main l08-uaf.cpp:15

0x502000000010 is located 0 bytes inside of 8-byte region [0x502000000010,0x502000000018)
freed by thread T0 here:
    #0 ... in operator delete(void*, unsigned long)
    #1 ... in std::_Vector_base<double, …>::_M_deallocate(double*, unsigned long)
    #2 ... in std::vector<double, …>::_M_realloc_insert<double>(…)
    #3 ... in std::vector<double, …>::push_back(double&&)
    #4 0x5570faee669d in main l08-uaf.cpp:12
```

The capacity went from 1 to 16, which is the whole story: the vector could not fit nine elements in a buffer sized for one, so it allocated a new buffer, copied the elements, and freed the old one. `first` still points into the old one. Nothing in the source says `delete`, and the "free" frame in the report is inside `push_back`, which is precisely why the report's deallocation trace is worth reading rather than skipping — it names `_M_realloc_insert`, and the line it attributes to your code is line 12, the `push_back`.

Built at `-O1` with no sanitizer, the same program printed `-9.81` and exited 0: the write went into the freed block, where nobody looked again, and the read of `az[0]` came from the *new* buffer, which still held the copied value. A test asserting `az[0] == -9.81` would pass.

The rule to carry: **any operation that can change a container's size can invalidate every pointer, reference and iterator into it.** For `std::vector` that is `push_back`, `insert`, `resize`, `reserve` and `emplace_back`. Take the index, not the reference, or take the reference after you have finished growing.
:::

## Buffer overrun

Writing outside an object's bounds is undefined, whether the object is on the heap, on the stack, or static. The classic producer is `<=` where `<` was meant:

```cpp
const int kCapacity = 8;
double* telemetry = new double[kCapacity];
for (int i = 0; i <= kCapacity; ++i) {      // <= : one too many
    telemetry[i] = -9.80 - 0.01 * i;
}
```

g++ 13.3.0 compiled that without a warning at `-Wall -Wextra -Wpedantic`, and the unsanitized build printed `filled` and exited 0. AddressSanitizer:

```text
==1154==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x506000000060 at pc 0x5588b001f32a
WRITE of size 8 at 0x506000000060 thread T0
    #0 0x5588b001f329 in main l08-overrun.cpp:9

0x506000000060 is located 0 bytes after 64-byte region [0x506000000020,0x506000000060)
allocated by thread T0 here:
    #0 ... in operator new[](unsigned long)
    #1 0x5588b001f2c7 in main l08-overrun.cpp:7
SUMMARY: AddressSanitizer: heap-buffer-overflow l08-overrun.cpp:9 in main
```

"0 bytes after 64-byte region" is the diagnosis: eight doubles is 64 bytes, and the write landed at the first byte past the end. `heap-buffer-overflow` distinguishes it from `stack-buffer-overflow`, which lesson 03 produced, and `global-buffer-overflow`, which the same mistake on a namespace-scope array gives.

What makes this class of bug dangerous on a vehicle is not the one byte. It is that the byte belongs to something: the allocator's bookkeeping for the next block, or the next member of a struct, or a return address. The corruption surfaces later, somewhere unrelated, and the stack trace at that point names an innocent function.

## Uninitialised reads

An object with automatic or dynamic storage duration and no initialiser holds an **indeterminate value**. Reading it is undefined for every type except `unsigned char` and `std::byte`.

::: example Two gains set, one forgotten
```cpp
struct Gains { double kp; double ki; double kd; };

double control(double err) {
    Gains g;                       // no initialiser: members are indeterminate
    g.kp = 1.5;
    g.kd = 0.05;
    return g.kp * err + g.ki * err + g.kd * err;   // reads g.ki
}
```

The program printed:

```text
control(0.20) = 0.310000
```

which is $1.5 \times 0.20 + 0 \times 0.20 + 0.05 \times 0.20 = 0.31$. The uninitialised `ki` happened to be zero in that stack slot, three runs in a row, so the controller produced a plausible number that was wrong only in the sense of being an accident. That is the worst case for a reviewer: the test passes.

Two tools found it, and the *conditions* under which they found it are the lesson.

g++ 13.3.0 with `-Wall` at `-O1`:

```text
l08-uninit.cpp:10:27: warning: 'g.Gains::ki' is used uninitialized [-Wuninitialized]
   10 |     return g.kp * err + g.ki * err + g.kd * err;   // reads g.ki
      |                         ~~^~
l08-uninit.cpp:7:11: note: 'g' declared here
```

The same source at `-O0` with the same `-Wall -Wextra -Wpedantic` produced **nothing**. This warning depends on the dataflow analysis the optimiser performs, so it does not exist at `-O0`. A project that builds its debug configuration at `-O0` and relies on warnings is not getting this one.

Valgrind's memcheck, on the `-O0` build:

```text
==2003== Conditional jump or move depends on uninitialised value(s)
==2003==    at 0x48C4181: __printf_fp_buffer_1.isra.0 (printf_fp.c:230)
==2003==    by 0x48C31B2: printf (printf.c:33)
==2003==    by 0x1091D2: main (l08-uninit.cpp:14)
==2003==  Uninitialised value was created by a stack allocation
==2003==    at 0x109149: control(double) (l08-uninit.cpp:6)
```

Read that carefully: the *reported* location is inside `printf`, because memcheck flags the point where an undefined value first affects a decision, and it propagates undefinedness through arithmetic silently. The useful line is the last one, which `--track-origins=yes` added: the value came from a stack allocation at line 6, which is `Gains g;`.

Note also what did **not** find it: AddressSanitizer. ASan tracks whether an address is valid, not whether the bytes at it have been written, so an uninitialised read of valid storage is invisible to it. That is a genuine gap in the daily tool, and the reason uninitialised values are handled by a different technique — MemorySanitizer, valgrind, or simply not creating them.

The fix costs one character. `Gains g{};` value-initialises every member to zero, and `Gains g{1.5, 0.0, 0.05};` names all three. Brace-initialise every local, always; the previous module said so about narrowing conversions, and this is the second reason.
:::

::: warning
`double x;` at block scope is indeterminate, but a namespace-scope or `static` `double x;` is zero — static-duration objects are zero-initialised before anything runs, as lesson 01 said. So the same declaration is a bug in one place and fine in another, which is why "it worked when it was a global" is a real and confusing bug report.
:::

## Saying what you actually know

When you write about one of these bugs — in a commit message, a defect report, a code review — three statements are available, and they are not equally strong.

1. *"This is undefined behaviour because the object's lifetime ended at line 12."* A statement about the language. Always available, always true, and the only one that survives a compiler upgrade.
2. *"AddressSanitizer reports heap-use-after-free at line 15, freed at line 12."* Evidence that the program really executes the undefined operation, with the tool and the version named.
3. *"On this build it printed -9.81 and exited 0."* A fact about one binary. Worth recording when it explains why the bug was not noticed; never a description of the bug.

The failure mode to avoid is using 3 where 1 belongs: "writing one past the end is fine for `double` arrays because the allocator rounds up" is a sentence with a real experiment behind it and no truth in it.

## Check yourself

::: check
The `-O1` build of the double free had no call to `operator new` in the object file. Is the resulting program correct?
:::

::: answer
The question does not have an answer, and that is the point. A program containing undefined behaviour has no defined meaning, so "correct" and "incorrect" do not apply to it as a whole — the standard does not say what it should do, so nothing it does can be a deviation. What you can say is narrower and more useful: the *source* contains a defect, at the line with the second `delete`, and any build of it is entitled to do anything. The `-O1` binary happening to be harmless is not a property you can rely on: adding a print between the two deletes, taking the address of `f`, or upgrading the compiler can all bring the allocation back and with it the abort. Eliding the allocation is explicitly permitted even for well-defined programs, which is why the elision is not itself a compiler bug.
:::

::: check
A reviewer proposes replacing `double& first = az[0];` with `double* first = &az[0];`. Does that fix the use-after-free?
:::

::: answer
No. A pointer and a reference into a vector's buffer are equally invalidated by reallocation; the only difference is that the pointer can be reassigned afterwards and the reference cannot. The fix is to stop holding an address across an operation that can move the elements. Either take the index — `std::size_t i = 0;` and use `az[i]` at each point of use, which stays correct because the index is relative to whatever buffer exists now — or do all the growing first and take the reference afterwards, or call `az.reserve(n)` up front so no reallocation can occur within the region of interest. In flight code the underlying answer is usually different again: the buffer has a fixed capacity chosen at compile time, so there is no reallocation to invalidate anything.
:::

::: check
`-Wuninitialized` fired at `-O1` and not at `-O0`. What does that tell you about how to configure a project's builds?
:::

::: answer
That the warning set and the optimisation level are not independent, so a project needs at least one build configuration that compiles with optimisation *and* warnings enabled, even if nobody runs that binary. Many of g++'s most valuable warnings — uninitialised use, some array-bounds checks, some dangling cases — are products of the optimiser's dataflow analysis and simply do not exist at `-O0`. The common arrangement is a debug build at `-O0 -g` for stepping, a release build at `-O2`, and a CI job that compiles at `-O2 -Wall -Wextra -Werror` purely to collect diagnostics. Warnings are still only a filter: the `Observer` bug in lesson 04 produced no diagnostic at any level from either compiler, which is why the sanitized test run is the other half.
:::

::: check
Why can AddressSanitizer report a use-after-free precisely but not an uninitialised read at all?
:::

::: answer
Because they are questions about different things. ASan maintains shadow memory recording, for every eight bytes of the program's address space, whether those bytes are currently addressable — inside a live allocation, inside a live stack object, or poisoned as a redzone or a freed block. A use-after-free is a question about addressability: the block was marked poisoned at `delete`, so a later access to it is a lookup away from being caught, and because ASan also stores the allocation and deallocation stack traces it can show you all three locations. An uninitialised read is a question about *definedness*: the address is perfectly valid and the access is legal; what is wrong is that nothing has written a value there yet. Tracking that requires propagating a validity bit through every arithmetic operation, which is what MemorySanitizer and valgrind's memcheck do and what makes them much slower. The practical consequence is that ASan and UBSan in CI do not remove the need to brace-initialise.
:::

::: check
A colleague's code reads one element past a heap array once per control cycle. The system has run for six months without incident. Write the two-sentence review comment.
:::

::: answer
"Line 88 reads `telemetry[n]` where the array has `n` elements, which is undefined behaviour: the compiler may assume it does not happen and is entitled to optimise the surrounding loop accordingly, and the byte read belongs to the allocator's bookkeeping for the next block. Six months of clean operation is evidence about one binary on one processor, not about the code — changing the array size, the optimisation level or the compiler version changes what that byte is, so please change the bound to `i < n` and add an AddressSanitizer run to CI." The comment works because it makes a claim about the language rather than about observed behaviour, which means it cannot be answered with "but it works".
:::

## Summary

| Bug | What it is | What catches it |
| --- | --- | --- |
| dangling pointer | address of an object whose lifetime ended | ASan `heap-use-after-free`, `stack-use-after-scope`, `stack-use-after-return` |
| use-after-free | access to a freed heap block | ASan `heap-use-after-free`, with free and allocation traces |
| double free | freeing the same block twice | ASan `attempting double-free`; glibc may abort; the optimiser may erase it |
| buffer overrun | access outside an object's bounds | ASan `heap-`/`stack-`/`global-buffer-overflow` |
| uninitialised read | reading storage never written | `-Wuninitialized` at `-O1` and above; valgrind memcheck; **not** ASan |
| vector invalidation | `push_back` reallocates; all pointers, references and iterators die | ASan, via the free frame inside `_M_realloc_insert` |
| UB's licence | the compiler assumes it cannot happen and deletes code that says otherwise | reading the assembly, as with the deleted null check |
| honest reporting | say what is undefined; cite the sanitizer; label observed results as one build | — |

Lesson 09 takes AddressSanitizer on its own terms: how it works, how to read every field of a report, what it costs, what it misses, and how to wire it into a build so a finding fails a test instead of scrolling past.
