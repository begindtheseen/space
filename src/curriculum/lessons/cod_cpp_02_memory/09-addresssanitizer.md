---
id: l09-addresssanitizer
title: AddressSanitizer: how it works, how to read it, what it misses
minutes: 22
covers:
  - AddressSanitizer as the daily tool for this material
  - Dangling pointers, use-after-free, double free, buffer overrun, uninitialised reads
---

Lesson 08 showed five defects whose observable behaviour is not a reliable guide to anything. The tool that turns them from "occasionally the program acts strangely" into "line 14 read eight bytes that line 7 freed and line 6 allocated" is AddressSanitizer, and learning to read its output is the highest-value hour in this module.

ASan is not a debugger and not a static analyser. It is a compiler instrumentation plus a runtime library: you add one flag, the compiler rewrites every memory access to check a side table first, and the runtime replaces the allocator so it can mark memory as valid or not. The cost is a slower, larger binary. The benefit is that the failure is reported at the instruction that caused it, with the history of the memory involved, instead of somewhere unrelated an hour later.

This lesson covers the mechanism in enough detail to explain the report, every field of the report itself, the flags and environment variables you will actually set, what it costs on real code, and — as important — the four things it does not catch, so you know what else has to be in the build.

## Shadow memory: the one idea

ASan keeps a **shadow map**: for every eight bytes of your program's memory, one byte describing them. The shadow byte says how many of those eight bytes are currently valid, or, if none are, why not.

Every load and store the compiler emits is preceded by a check: compute the shadow address (a shift and an add), read one byte, and if it is not zero, decide whether this particular access is allowed. Zero means all eight bytes are addressable and the access proceeds. A small number, 1 to 7, means that many leading bytes are addressable and the rest are not — which is how an overflow of a buffer whose size is not a multiple of eight is caught. Anything else is a **poison** value naming a reason.

To make overflows detectable at all, the runtime allocator places **redzones** around every heap block and the compiler places them around stack objects; those bytes are poisoned, so touching them is caught immediately. And freed heap blocks are not returned to the allocator straight away: they go into a **quarantine** and their shadow is poisoned, so a use-after-free is caught rather than silently landing in someone else's fresh allocation.

That is the whole design. Everything in a report follows from it.

## Reading a report, line by line

::: example One use-after-free, annotated
```cpp
struct Frame { double az; double t_s; };

Frame* acquire()          { return new Frame{-9.81, 0.02}; }
void   release(Frame* f)  { delete f; }

int main() {
    Frame* f = acquire();
    release(f);
    std::printf("reading after release\n");
    std::printf("%.2f\n", f->az);       // use after free
    return 0;
}
```

Built with `g++ -std=c++20 -O1 -g -fsanitize=address -fno-sanitize-recover=all`:

```text
reading after release
=================================================================
==7355==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010 at pc 0x55df04b5037e bp 0x7fff287c48d0 sp 0x7fff287c48c0
READ of size 8 at 0x502000000010 thread T0
    #0 0x55df04b5037d in main l09-report.cpp:14
    ...

0x502000000010 is located 0 bytes inside of 16-byte region [0x502000000010,0x502000000020)
freed by thread T0 here:
    #0 0x7f8b74aff5e8 in operator delete(void*, unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:164
    #1 0x55df04b502dc in release(Frame*) l09-report.cpp:7
    ...

previously allocated by thread T0 here:
    #0 0x7f8b74afe548 in operator new(unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:95
    #1 0x55df04b5027a in acquire() l09-report.cpp:6
    ...

SUMMARY: AddressSanitizer: heap-use-after-free l09-report.cpp:14 in main
```

(Each `...` stands for the library frames the trace ends with — `__libc_start_call_main`, `__libc_start_main_impl`, `_start` — and the report continues below the summary with the shadow dump shown in the next section.)

Field by field:

- **`==7355==`** is the process id. It differs on every run and is there so that interleaved output from several processes can be sorted out. Ignore it.
- **`heap-use-after-free`** is the error class. The vocabulary is small and worth knowing: `heap-use-after-free`, `heap-buffer-overflow`, `stack-buffer-overflow`, `global-buffer-overflow`, `stack-use-after-scope`, `stack-use-after-return`, `attempting double-free`, `alloc-dealloc-mismatch`, `stack-overflow`, and `LeakSanitizer: detected memory leaks`. The class tells you what kind of object and what kind of mistake before you read anything else.
- **`on address 0x502000000010`** is the address touched. Under ASLR it differs every run; its value means nothing, but it is the key that links the three sections below.
- **`at pc …, bp …, sp …`** are the program counter, frame pointer and stack pointer. You need these only when the symbolised trace is missing.
- **`READ of size 8`** is the operation. A `double` is 8 bytes, so this is one whole member. `WRITE` instead of `READ` changes the urgency: a bad write corrupts, a bad read merely lies.
- **`#0 … in main l09-report.cpp:14`** is the access site, and it is the first place to look. Frames below it are the call chain; the library frames below `main` are noise.
- **`0 bytes inside of 16-byte region [0x…10,0x…20)`** describes the block. Sixteen bytes is `sizeof(Frame)`, and "0 bytes inside" says the access was at the very start — so it was the first member, `az`. For an overflow this line reads "N bytes after a …-byte region" instead, which tells you the overrun distance immediately.
- **`freed by thread T0 here:`** is the deallocation trace. Frame `#1` names `release(Frame*)` at line 7. This is the single most useful part of the report and the part beginners skip.
- **`previously allocated by thread T0 here:`** is the allocation trace: `acquire()` at line 6.
- **`SUMMARY:`** repeats the class and the access site in one line, which is what a CI log should be grepped for.

Three line numbers, three questions answered: who used it, who freed it, who made it. When the free happens inside a library — as it did in lesson 08's vector example, where the deallocation trace ran through `_M_realloc_insert` — the frame that matters is the lowest one in *your* code, and it is always there.
:::

## The shadow bytes at the bottom

Every report ends with a dump of the shadow map around the address, and a legend. For the report above:

```text
Shadow bytes around the buggy address:
  ...
  0x501fffffff80: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
=>0x502000000000: fa fa[fd]fd fa fa fa fa fa fa fa fa fa fa fa fa
  0x502000000080: fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa
  ...
Shadow byte legend (one shadow byte represents 8 application bytes):
  Addressable:           00
  Partially addressable: 01 02 03 04 05 06 07 
  Heap left redzone:       fa
  Freed heap region:       fd
  Stack left redzone:      f1
  Stack mid redzone:       f2
  Stack right redzone:     f3
  Stack after return:      f5
  Stack use after scope:   f8
  Global redzone:          f9
  Global init order:       f6
  Poisoned by user:        f7
  Container overflow:      fc
  Array cookie:            ac
  Intra object redzone:    bb
  ASan internal:           fe
  Left alloca redzone:     ca
  Right alloca redzone:    cb
```

The `=>` marks the line containing the address, and the square brackets mark the exact shadow byte. It is `fd`: *freed heap region*. Next to it is a second `fd`, because the 16-byte `Frame` needs two shadow bytes, and around them are `fa` bytes — heap left redzone — which is the padding ASan put between blocks.

You rarely need this section, but when you do it is decisive. A run of `00` where you expected a redzone means the access was inside a valid object and the bug is elsewhere. A `f3` means you ran off the top of a stack array. And `01` through `07` is the signature of an overflow by a few bytes into a partially valid word, which is what a string operation off by one looks like.

## Turning it on

```bash
g++ -std=c++20 -O1 -g -fno-omit-frame-pointer \
    -fsanitize=address -fsanitize=undefined -fno-sanitize-recover=all \
    main.cpp -o main
```

Each flag earns its place:

- `-fsanitize=address` is the instrumentation, and it must be on the **link** line as well as the compile line, because it pulls in the runtime.
- `-fsanitize=undefined` adds UBSan, which is nearly free and catches a disjoint set — signed overflow, misaligned access, null dereference, bad shifts, invalid enum values. The two compose.
- `-fno-sanitize-recover=all` makes a finding abort with a non-zero exit status. Without it, several UBSan checks print and continue, so a test suite finishes green with the diagnostic scrolled off the top of the log. This one flag is the difference between a sanitizer that protects you and one that decorates your logs.
- `-O1` rather than `-O0`, because ASan at `-O0` is very slow and some warnings only exist with optimisation on; `-O2` is fine too.
- `-g` for line numbers and `-fno-omit-frame-pointer` for reliable stack traces.

At run time, the `ASAN_OPTIONS` environment variable tunes the runtime. The ones worth knowing: `detect_leaks=1` (on by default on Linux), `detect_stack_use_after_return=1`, `halt_on_error=1`, `abort_on_error=1` to produce a core file, and `log_path=…` to write reports to files instead of stderr.

::: warning
ASan cannot be combined with ThreadSanitizer or MemorySanitizer — one shadow-memory scheme per process. It composes fine with UndefinedBehaviorSanitizer and with LeakSanitizer, which on Linux is part of the ASan runtime. So the normal arrangement in CI is two jobs: one ASan+UBSan, one TSan.
:::

## Leaks and use-after-return

::: example Two findings the default build never mentions
**A leak.** Three allocations, no `delete`:

```cpp
#include <cstdio>

struct Frame { double v[16]; };

Frame* make_frame() { return new Frame{}; }

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);
    for (int i = 0; i < 3; ++i) {
        Frame* f = make_frame();
        f->v[0] = i;
        // no delete: one leak per iteration
    }
    std::printf("done\n");
    return 0;
}
```

```text
done

=================================================================
==3596==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 384 byte(s) in 3 object(s) allocated from:
    #0 0x7f746d2fe548 in operator new(unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:95
    #1 0x55e74bef827a in make_frame() l09-leak.cpp:6
    #2 0x55e74bef8357 in main l09-leak.cpp:11
    ...

SUMMARY: AddressSanitizer: 384 byte(s) leaked in 3 allocation(s).
```

Exit status 1. The report runs at exit, counts what was never freed and is no longer reachable, and gives the allocation trace: 3 objects of $16 \times 8 = 128$ bytes each, so $3 \times 128 = 384$ bytes. "Direct leak" means nothing points at it; "indirect leak" means it was only reachable from something else that leaked.

**A use after return.** A function stores the address of its own local where someone else can find it:

```cpp
const double* g_latest = nullptr;

void publish() {
    double local[4] = {1.0, 2.0, 3.0, 4.0};
    g_latest = local;             // stores the address of a frame that is about to die
}

int main() {
    publish();
    std::printf("%.1f\n", g_latest[0]);
}
```

Neither g++ 13.3.0 nor clang++ 18.1.3 warns about this shape — the address escapes through a global rather than through a `return`, which is exactly the case lesson 11 of the previous module flagged as the one compilers miss. ASan does not miss it:

```text
reading a dead frame
=================================================================
==5268==ERROR: AddressSanitizer: stack-use-after-return on address 0x7f95f5200020 at pc 0x55cac06c74c5 bp 0x7ffdb46d6ef0 sp 0x7ffdb46d6ee0
READ of size 8 at 0x7f95f5200020 thread T0
    #0 0x55cac06c74c4 in main l09-uar.cpp:15
    ...

Address 0x7f95f5200020 is located in stack of thread T0 at offset 32 in frame
    #0 0x55cac06c7298 in publish() l09-uar.cpp:6

  This frame has 1 object(s):
    [32, 64) 'local' (line 7) <== Memory access at offset 32 is inside this variable
```

It names the dead frame's function, the variable inside it, and the line it was declared on. This check has to keep the frame's shadow poisoned after the function returns, which costs more than the others; on this g++ 13.3.0 build it was active by default, and where it is not, `ASAN_OPTIONS=detect_stack_use_after_return=1` turns it on.
:::

## What it costs

::: example Measured on a matrix multiply
A 220×220 double matrix multiply repeated 8 times — about 850 million multiply-adds over three matrices totalling 1.13 MB, so almost every instruction is a load or a store.

Three runs of `g++ -std=c++20 -O2 -g`:

```text
c[0] = 10592.0   time = 22 ms   peak RSS = 4660 KB
c[0] = 10592.0   time = 27 ms   peak RSS = 4648 KB
c[0] = 10592.0   time = 24 ms   peak RSS = 4700 KB
```

and three of the same source with `-fsanitize=address` added:

```text
c[0] = 10592.0   time = 135 ms   peak RSS = 8792 KB
c[0] = 10592.0   time = 110 ms   peak RSS = 8764 KB
c[0] = 10592.0   time = 99 ms   peak RSS = 8824 KB
```

Time: about 4.5 times slower. Memory: about 1.9 times the peak resident set.

The project's own documentation quotes roughly a 2× slowdown as typical, and the gap is informative rather than contradictory. The instrumentation adds a shadow lookup and a branch to every memory access, so the overhead is proportional to how *dense* the memory traffic is. A triple loop that does one multiply-add per two loads is the worst case; a program that spends its time in arithmetic, in system calls or waiting on I/O is barely affected. Measure your own workload before deciding what the sanitized test suite will cost.

The memory figure is smaller than the often-quoted 3× for the same reason it varies: the shadow map is one byte per eight, so 12.5% of the *touched* address space, plus redzones proportional to the number of live allocations, plus a fixed runtime overhead of a few megabytes. A program with three large arrays and few allocations, like this one, is near the low end; a program with a million small objects is near the high end.

Either way the number is a reason to run ASan in CI and on a developer machine, not on the vehicle. Flight builds ship without it.
:::

## What it does not catch

Four gaps, and each needs a different answer.

**Uninitialised reads.** ASan answers "is this address valid", not "has anything been written here". Lesson 08's uninitialised gain was invisible to it. Use `-Wuninitialized` with optimisation on, valgrind's memcheck, MemorySanitizer where available, and brace-initialisation everywhere.

**Overflow from one member into another.** ASan's redzones sit between *allocations*, not between members of the same object. This program writes one element past a four-element member array:

```cpp
struct Telemetry {
    double samples[4];
    int    checksum;          // sizeof(Telemetry) == 40, offsetof(checksum) == 32
};
Telemetry* t = new Telemetry{};
t->checksum = 42;
for (int i = 0; i < 5; ++i) t->samples[i] = -9.80;   // one past samples[3]
```

The write lands at offset 32, inside the 40-byte allocation, so no redzone is touched and **ASan reports nothing**. At `-O0` the checksum was visibly corrupted, printing `-1717986918` — the low four bytes of the `double` $-9.80$. At `-O1` and `-O2` it printed `42`, because the compiler kept `checksum` in a register across the loop, being entitled to assume the out-of-bounds write could not reach it. So the corruption is real, invisible to the tool, and hidden by the optimiser. `std::array` with `.at()`, or a `std::span` bound, is the defence.

**Data races.** A different problem needing a different shadow scheme: ThreadSanitizer, in its own build.

**Logic.** ASan has no opinion about a sign error in your quaternion. It finds memory misuse, which is a large share of your crashes and none of your wrong answers.

::: key
ASan keeps one shadow byte per eight bytes of memory, poisons redzones around every allocation and quarantines freed blocks, and checks the shadow on every access. Build with `-fsanitize=address -fsanitize=undefined -fno-sanitize-recover=all -g -O1`, and run the whole test suite under it in CI. It catches heap and stack overflow, use-after-free, use-after-scope and return, double free, allocator mismatch and leaks. It does not catch uninitialised reads, overflow between members of one object, data races, or wrong logic.
:::

## Check yourself

::: check
A report says `heap-buffer-overflow`, `WRITE of size 4`, and `4 bytes after 40-byte region`. Reconstruct as much of the bug as you can before opening the file.
:::

::: answer
A heap block of 40 bytes was allocated and something wrote 4 bytes starting 4 bytes past its end — so at offsets 44 to 47, relative to the start of the block. A 4-byte write is an `int`, a `float`, or a `std::uint32_t`. If the block is an array of that type, 40 bytes is 10 elements at indices 0 to 9, and the write was to index 11, not 10 — two past the end, which is not a classic off-by-one but looks like an index computed with an extra term, or a loop whose bound came from a different array. The report's allocation trace will name the line that produced the 40 bytes, so you can confirm the element type, and the access trace names the writing line. That much is available before you open an editor, which is the point of reading the report properly.
:::

::: check
Why does `-fno-sanitize-recover=all` matter more in CI than on your own machine?
:::

::: answer
Because on your machine you are watching the output, and in CI a program's exit status is the only thing anyone looks at. Several UBSan checks default to "report and continue", so without the flag an instrumented binary can print a runtime error and still exit 0, the test job goes green, and the finding is buried in a log that nobody opens. With the flag, the first finding aborts the process, the test fails, and the report is the last thing in the log. The same reasoning applies to `ASAN_OPTIONS=halt_on_error=1` for the error classes ASan is willing to continue past. The general principle is that a diagnostic which does not change an exit status will be ignored, eventually and then permanently.
:::

::: check
Your team's test suite takes 4 minutes. What should you expect it to take under ASan, and how would you decide whether to run it on every commit?
:::

::: answer
Somewhere between about 4.5 and 20 minutes, and you cannot narrow that from first principles — the measured slowdown here was 4.5× on a memory-bound kernel while the documented typical figure is about 2×, and a suite that spends much of its time starting processes, reading files or waiting will be closer to unaffected. So you measure: run it once under ASan and use the real number. On whether to run it every time, the usual arrangement is that the plain build plus the fast unit tests run on every commit, and the sanitized build runs on every merge to the main branch and nightly over the long tests. What makes that safe is the merge gate: a sanitized run that only happens weekly finds bugs that are already a week old and mixed in with a hundred other changes, which is most of the value gone.
:::

::: check
The intra-object overflow corrupted `checksum` at `-O0` and did not at `-O1`. Which of those two is the bug, and what would you write in the defect report?
:::

::: answer
Neither is the bug; the loop bound is. `for (int i = 0; i < 5; ++i) t->samples[i] = …` writes past the end of a four-element array, which is undefined behaviour regardless of what any particular build does with it. The `-O0` corruption and the `-O1` non-corruption are two permitted outcomes of the same defect: in one the write reached the member, in the other the compiler had already decided `checksum` could not be modified there and kept it in a register. The defect report says: "line N writes `samples[4]` on a four-element array — undefined behaviour; at `-O0` this was observed to overwrite `checksum`, and at `-O1` the corruption is hidden because the optimiser caches `checksum` in a register. AddressSanitizer does not detect this class, because the write stays inside the allocation, so the fix is the bound and the guard is a `std::span` or `.at()`, not the sanitizer."
:::

::: check
The leak report said "Direct leak of 384 byte(s) in 3 object(s)". A colleague says the program does not leak because it exits immediately afterwards and the operating system reclaims everything. Respond.
:::

::: answer
For this three-iteration toy, the colleague is right about the consequence and wrong about the practice. The operating system does reclaim a process's memory at exit, so a leak on a path that runs once before termination costs nothing directly. But the report is not about this run: `make_frame` leaks once per call, and the reason it matters is what happens when that function is called in a loop that runs for a mission. A 128-byte leak in a 100 Hz loop is 12.8 kB per second, 1.1 GB per day, and a calculable date on which the vehicle runs out of memory. Beyond that, treating some leaks as acceptable means the leak report is no longer empty, and a report that is never empty is a report nobody reads — which is how the one that matters gets missed. The maintainable rule is zero findings, with genuine exceptions written into a suppression file where the reason is recorded.
:::

## Summary

| Item | Detail |
| --- | --- |
| shadow map | one byte per eight bytes of memory; `00` addressable, `01`–`07` partially, other values poisoned |
| redzone | poisoned padding around every heap and stack object, so overruns are caught |
| quarantine | freed blocks are held poisoned rather than reused, so use-after-free is caught |
| error classes | `heap-`/`stack-`/`global-buffer-overflow`, `heap-use-after-free`, `stack-use-after-scope`, `stack-use-after-return`, `attempting double-free`, `alloc-dealloc-mismatch`, `stack-overflow`, leaks |
| report structure | class and address, access kind and size, access trace, region description, free trace, allocation trace, summary |
| "0 bytes inside of 16-byte region" | the access was at the start of a 16-byte block |
| "4 bytes after 40-byte region" | an overrun, and by how much |
| build flags | `-fsanitize=address -fsanitize=undefined -fno-sanitize-recover=all -g -O1 -fno-omit-frame-pointer`, compile and link |
| `ASAN_OPTIONS` | `detect_leaks`, `detect_stack_use_after_return`, `halt_on_error`, `log_path` |
| measured cost | 4.5× time and 1.9× peak memory on a memory-bound matrix multiply; about 2× time is the documented typical case |
| does not catch | uninitialised reads, member-to-member overflow inside one object, data races, wrong logic |
| incompatible with | ThreadSanitizer, MemorySanitizer — run those as separate builds |

Lesson 10 turns from bugs to layout: why a struct is bigger than the sum of its members, what alignment actually requires, and how to compute a layout by hand before the compiler tells you.
