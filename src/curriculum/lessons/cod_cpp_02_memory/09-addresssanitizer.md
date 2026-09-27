---
id: l09-addresssanitizer
title: AddressSanitizer: how it works, how to read it, what it misses
minutes: 23
covers:
  - AddressSanitizer as the daily tool for this material
  - Dangling pointers, use-after-free, double free, buffer overrun, uninitialised reads
---

Think of a museum at night. In front of each painting is a thin strip of floor wired to an alarm. Walk up to look and nothing happens. Step onto the strip and the alarm goes off at once, with a photo of exactly where you stood. The guard does not find a scratched frame next week; they know the moment your foot lands.

**AddressSanitizer** — **ASan** for short — does that for memory. Lesson 08 showed five bugs whose visible behavior tells you almost nothing. ASan turns "the program sometimes acts strangely" into "line 13 read 8 bytes that line 6 freed and line 5 allocated". Learning to read its output is the most valuable hour in this module.

ASan is not a debugger, and it does not read your source looking for mistakes. It has two parts. The first is **[[instrumentation|instrumentation]]**: you add one compiler flag, and the compiler puts a check before every memory access. The second is a runtime library that replaces the allocator, so it can mark memory as valid or not. You pay with a slower, bigger program. You gain a report at the instruction that went wrong, with the history of the memory involved, instead of a crash somewhere unrelated an hour later.

On a flight-software team, ASan runs the test suite on the ground; it never flies. This lesson covers how it works, every field of a report, the flags you will set, what it costs, and the four things it does not catch.

## Shadow memory: the one idea

ASan keeps a second, smaller map of your program's memory, called **[[shadow memory|shadow-memory]]**. For every 8 bytes of your memory there is one shadow byte describing them.

Before every load or store, the compiled code does a quick check. It works out where the shadow byte is (a shift and an add), reads it, and looks at the value:

- **`00`** means all 8 bytes are **addressable** — fair game. The access goes ahead.
- **`01` to `07`** means only that many leading bytes are addressable. This is how an overrun of a buffer whose size is not a multiple of 8 still gets caught.
- **Anything else** is a **poison** value, meaning "do not touch", and the value names the reason.

To make overruns catchable at all, ASan surrounds every heap block and every stack array with **[[redzones|redzones]]**: strips of poisoned bytes, like the alarm strip in front of a painting. Touching one is caught instantly.

Freed heap blocks get similar treatment. Instead of handing them straight back for reuse, ASan poisons them and holds them in a **[[quarantine|quarantine]]** for a while. So a use-after-free hits poisoned memory and is caught, instead of quietly landing in someone else's fresh allocation.

That is the whole design. Everything in a report follows from it.

## Reading a report, line by line

::: example One use-after-free, annotated
```cpp
#include <cstdio>

struct Frame { double az; double t_s; };

Frame* acquire()          { return new Frame{-9.81, 0.02}; }
void   release(Frame* f)  { delete f; }

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);
    Frame* f = acquire();
    release(f);
    std::printf("reading after release\n");
    std::printf("%.2f\n", f->az);       // use after free
    return 0;
}
```

Built with `g++ -std=c++20 -O1 -g -fno-omit-frame-pointer -fsanitize=address -fsanitize=undefined -fno-sanitize-recover=all`:

```text
reading after release
=================================================================
==9418==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010 at pc 0x55d614fcd469 bp 0x7ffdae809e70 sp 0x7ffdae809e60
READ of size 8 at 0x502000000010 thread T0
    #0 0x55d614fcd468 in main l09-report.cpp:13
    ...

0x502000000010 is located 0 bytes inside of 16-byte region [0x502000000010,0x502000000020)
freed by thread T0 here:
    #0 0x7f141d4ff5e8 in operator delete(void*, unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:164
    #1 0x55d614fcd38a in release(Frame*) l09-report.cpp:6
    #2 0x55d614fcd3e5 in main l09-report.cpp:11
    ...

previously allocated by thread T0 here:
    #0 0x7f141d4fe548 in operator new(unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:95
    #1 0x55d614fcd2fa in acquire() l09-report.cpp:5
    #2 0x55d614fcd3da in main l09-report.cpp:10
    ...

SUMMARY: AddressSanitizer: heap-use-after-free l09-report.cpp:13 in main
```

(Each `...` stands for the startup-library frames — `__libc_start_call_main`, `__libc_start_main_impl`, `_start` — that end every trace. The report goes on below the summary with a shadow dump, shown in the next section.)

Field by field:

- **`==9418==`** is the process id, there to tell several processes' output apart. Ignore it.
- **`heap-use-after-free`** is the error class. It tells you what kind of object and what kind of mistake before you read anything else. The full vocabulary is short: `heap-use-after-free`, `heap-buffer-overflow`, `stack-buffer-overflow`, `global-buffer-overflow`, `stack-use-after-scope`, `stack-use-after-return`, `attempting double-free`, `alloc-dealloc-mismatch` (say, `new[]` freed with plain `delete`), `stack-overflow`, and `LeakSanitizer: detected memory leaks`.
- **`on address 0x502000000010`** is the address touched. Because of **[[address randomization|aslr]]** it changes every run, so its value means nothing. It is the key that links the sections below.
- **`at pc …, bp …, sp …`** are three **[[processor registers|pc-bp-sp]]** at the moment of the bad access. You need them only when the trace has no function names.
- **`READ of size 8`** is the operation. A `double` is 8 bytes, so this was one whole member. `WRITE` instead of `READ` raises the urgency: a bad write corrupts, a bad read "only" lies.
- **`#0 … in main l09-report.cpp:13`** is where the bad access happened. Look here first.
- **`0 bytes inside of 16-byte region`** describes the block. Sixteen bytes is `sizeof(Frame)`: two doubles, $2 \times 8 = 16$. "0 bytes inside" means the access was at the very start, so it was the first member, `az`. For an overrun this line reads "N bytes after an M-byte region" instead, which tells you how far past the end you went.
- **`freed by thread T0 here:`** is the free trace: `release(Frame*)` at line 6, called from `main` at line 11. This is the most useful part of the report, and the part beginners skip.
- **`previously allocated by thread T0 here:`** is the allocation trace: `acquire()` at line 5, called from line 10.
- **`SUMMARY:`** repeats the class and the access site on one line. That is the line to search for in a CI log.

Three places, three questions answered: who used it, who freed it, who made it. When the free happens inside a library — as in lesson 08's vector, where the trace ran through `_M_realloc_insert` — the frame that matters is the first one in *your* code, and it is always there.
:::

## The shadow bytes at the bottom

Every report ends with a picture of the shadow map around the bad address, and a legend. For the report above:

```text
Shadow bytes around the buggy address:
  0x501ffffffd80: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
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

**Step 1: find the arrow.** `=>` marks the row that holds the bad address, and the square brackets mark the exact shadow byte.

**Step 2: look it up.** The bracketed byte is `fd`: *freed heap region*.

**Step 3: read the neighbors.** Next to it is a second `fd`. The 16-byte `Frame` needs two shadow bytes, because each covers 8 bytes: $16 / 8 = 2$. Around them are `fa` bytes, the heap redzone ASan placed between blocks.

You rarely need this section, but when you do it settles the question. A run of `00` where you expected a redzone means the access was inside a valid object. An `f3` means you ran off the end of a stack array. A `01` to `07` is the signature of an overrun by a few bytes — what an off-by-one on a string looks like.

## Turning it on

```bash
g++ -std=c++20 -O1 -g -fno-omit-frame-pointer \
    -fsanitize=address -fsanitize=undefined -fno-sanitize-recover=all \
    main.cpp -o main
```

Each flag earns its place:

- **`-fsanitize=address`** turns on ASan. It must be on the **link** step as well as the compile step, because it pulls in the runtime library.
- **`-fsanitize=undefined`** adds **UBSan**, the undefined-behavior sanitizer. It is cheap and catches a different set of bugs: signed overflow, misaligned access, null dereference, bad shifts, and out-of-bounds indexes into arrays whose size the compiler knows. The two work together.
- **`-fno-sanitize-recover=all`** makes any finding stop the program with a non-zero exit status. Without it, several UBSan checks print a message and carry on, so a test suite can finish green with the warning scrolled off the top of the log. This one flag is the difference between a sanitizer that protects you and one that decorates your logs.
- **`-O1`** rather than `-O0`, because ASan at `-O0` is very slow; `-O2` works too. Keep lesson 08's warning in mind, though: optimization can delete a bug outright, as it did with the double free.
- **`-g`** for line numbers, and **`-fno-omit-frame-pointer`** for complete stack traces. Without it, lesson 08's vector trace stopped inside the library and never reached `main`.

At run time, the `ASAN_OPTIONS` environment variable tunes the runtime. The ones worth knowing: `detect_leaks=1` (on by default on Linux), `detect_stack_use_after_return=1`, `halt_on_error=1`, `abort_on_error=1` to leave a core file, and `log_path=…` to write reports to files instead of the terminal.

::: warning One shadow scheme per program
ASan cannot be combined with ThreadSanitizer or MemorySanitizer in one build: each uses its own shadow memory. It combines fine with UBSan, and with LeakSanitizer, which on Linux is part of the ASan runtime. So the usual setup in CI is two jobs: one ASan plus UBSan, one ThreadSanitizer.
:::

## Leaks and use-after-return

::: example Two findings a normal build never mentions
**A leak.** A **leak** is memory allocated and never freed. Here are three allocations with no `delete`:

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
==9541==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 384 byte(s) in 3 object(s) allocated from:
    #0 0x7fc3742fe548 in operator new(unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:95
    #1 0x556d6f4d32fa in make_frame() l09-leak.cpp:5
    #2 0x556d6f4d33c2 in main l09-leak.cpp:10
    ...

SUMMARY: AddressSanitizer: 384 byte(s) leaked in 3 allocation(s).
```

Exit status 1. The **[[leak check|leak-scan]]** runs at exit, finds blocks that were never freed and that nothing points to any more, and prints where they were allocated. Check the size: each `Frame` is $16 \times 8 = 128$ bytes, and three of them are $3 \times 128 = 384$ bytes. "Direct leak" means nothing points at the block. "Indirect leak" means it was reachable only from another block that leaked.

**A use after return.** A function stores the address of its own local where someone else can find it:

```cpp
#include <cstdio>

const double* g_latest = nullptr;

void publish() {
    double local[4] = {1.0, 2.0, 3.0, 4.0};
    g_latest = local;             // stores the address of a frame that is about to die
}

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);
    publish();
    std::printf("reading a dead frame\n");
    std::printf("%.1f\n", g_latest[0]);
    return 0;
}
```

g++ 13.3.0 warns about this one (`storing the address of local variable 'local' in 'g_latest' [-Wdangling-pointer=]`); clang++ 18.1.3 says nothing. A warning does not stop the build, and a plain `-O1` build ran and printed `0.0` — not the `1.0` that was stored. ASan names the problem exactly:

```text
reading a dead frame
=================================================================
==9561==ERROR: AddressSanitizer: stack-use-after-return on address 0x7fdf78c00020 at pc 0x5597ac0f9522 bp 0x7fff4de94d40 sp 0x7fff4de94d30
READ of size 8 at 0x7fdf78c00020 thread T0
    #0 0x5597ac0f9521 in main l09-uar.cpp:14
    ...

Address 0x7fdf78c00020 is located in stack of thread T0 at offset 32 in frame
    #0 0x5597ac0f92d8 in publish() l09-uar.cpp:5

  This frame has 1 object(s):
    [32, 64) 'local' (line 6) <== Memory access at offset 32 is inside this variable
```

It names the dead function, the variable inside it, and the line where that variable was declared. The `[32, 64)` range is 32 bytes, four doubles: $4 \times 8 = 32$. To do this, ASan must keep a returned function's frame poisoned after it returns, which costs more than its other checks. On this g++ 13.3.0 build it was on by default. Where it is not, `ASAN_OPTIONS=detect_stack_use_after_return=1` turns it on.
:::

## What it costs

::: example Measured on a matrix multiply
The test program multiplies two 220 × 220 matrices of doubles, 8 times over. That is $220^3 \times 8 = 85\,184\,000$ multiply-adds, about 85 million, on three matrices totaling $3 \times 220^2 \times 8 = 1\,161\,600$ bytes, about 1.16 MB. Nearly every instruction is a load or a store, so this is close to ASan's worst case.

Three runs of `g++ -std=c++20 -O2 -g`:

```text
c[0] = 547.0   time = 46 ms   peak RSS = 4404 KB
c[0] = 547.0   time = 29 ms   peak RSS = 4508 KB
c[0] = 547.0   time = 30 ms   peak RSS = 4396 KB
```

and three of the same source with `-fsanitize=address` added:

```text
c[0] = 547.0   time = 116 ms   peak RSS = 8548 KB
c[0] = 547.0   time = 103 ms   peak RSS = 8548 KB
c[0] = 547.0   time = 103 ms   peak RSS = 8428 KB
```

(`peak RSS` is the most memory the program held at once.)

**Step 1: time.** Compare medians, since the 46 ms run is an outlier: $103 / 30 \approx 3.4$. ASan made it about 3.4 times slower.

**Step 2: memory.** Again medians: $8548 / 4404 \approx 1.9$. About twice the peak memory.

**Step 3: sanity check.** `c[0]` is 547.0 in every run, with and without ASan. The instrumentation changed the speed, not the answer.

The project's own documentation quotes about 2× as a typical slowdown. The gap is informative, not contradictory. The check adds a shadow lookup and a branch to every memory access, so the cost grows with how *dense* the memory traffic is. A triple loop doing one multiply-add per two loads is the worst case. A program that spends its time on arithmetic, system calls or waiting for input is barely slowed.

The memory cost varies too. The shadow map is one byte per 8 (12.5% of the memory touched), plus redzones for every live allocation, plus a few megabytes of fixed overhead. Three large arrays sit near the low end; a million small objects near the high end.
:::

Either way, the numbers are why ASan runs in CI and on developer machines, not on the vehicle. Flight builds ship without it.

::: key
What does AddressSanitizer catch? Heap and stack buffer overflow, use-after-free, use-after-return and scope, double free, and with LeakSanitizer, leaks. It costs about 2x on typical code and several times that when the code is memory-dense, plus roughly 2x peak memory, which is why it belongs in CI rather than in a flight build.
:::

## What it does not catch

Four gaps, and each needs a different answer.

**Uninitialized reads.** ASan answers "is this address valid?", not "has anything been written here?". Lesson 08's forgotten gain was invisible to it. Use `-Wall` with optimization on, valgrind, MemorySanitizer where available, and brace-initialization everywhere.

**Overflow from one member into another.** ASan's redzones sit between *allocations*, not between members of one object. This program writes one element past a four-element member array:

```cpp
struct Telemetry {
    double samples[4];
    int    checksum;          // sizeof(Telemetry) == 40, offsetof(checksum) == 32
};
Telemetry* t = new Telemetry{};
t->checksum = 42;
for (int i = 0; i < 5; ++i) t->samples[i] = -9.80;   // one past samples[3]
```

The fifth write lands at offset $4 \times 8 = 32$, inside the 40-byte allocation. No redzone is touched, so **ASan alone reports nothing**. At `-O0` the checksum was visibly damaged: it printed `-1717986918`, which is the low 4 bytes of the `double` $-9.80$ read as an `int`. At `-O1` and `-O2` it printed `42`. The compiler assumed the out-of-bounds write could not reach `checksum`, and printed the 42 it already knew. The damage is real, invisible to ASan, and hidden by the optimizer.

Two things did catch it here. g++ warned at `-O1` and `-O2` (`iteration 4 invokes undefined behavior`), because the loop bound was a constant. And UBSan, in the recommended combined build, stopped the program: `runtime error: index 4 out of bounds for type 'double [4]'`. UBSan's bounds check works only when the compiler can see the array's size at the point of indexing. Through a plain pointer it cannot. So `std::array` with `.at()`, or a `std::span` with a checked length, remains the real defense.

**Data races.** Two threads touching the same memory without coordination is a different problem, needing a different shadow scheme: **[[ThreadSanitizer|tsan]]**, in its own build.

**Logic.** ASan has no opinion about a sign error in your attitude math. It finds memory misuse, which is a large share of your crashes and none of your wrong answers.

::: key
ASan keeps one shadow byte per 8 bytes of memory, poisons redzones around every allocation, quarantines freed blocks, and checks the shadow on every access. Build with `-fsanitize=address -fsanitize=undefined -fno-sanitize-recover=all -g -O1`, and run the whole test suite under it in CI. It does not catch uninitialized reads, overflow between members of one object, data races, or wrong logic.
:::

## Check yourself

::: check
A report says `heap-buffer-overflow`, `WRITE of size 4`, and `4 bytes after 40-byte region`. Reconstruct as much of the bug as you can before opening the file.
:::

::: answer
A 40-byte heap block was allocated, and something wrote 4 bytes starting 4 bytes past its end — at offsets 44 to 47 from the block's start.

A 4-byte write is an `int`, a `float` or a `std::uint32_t`. If the block is an array of that type, 40 bytes is $40 / 4 = 10$ elements, indices 0 to 9. Offset 44 is $44 / 4 = 11$, so the write went to index 11, not 10 — two past the end. That is not the classic off-by-one; it looks like an index with an extra term in it, or a loop bound taken from a different array.

The allocation trace names the line that made the 40 bytes, so you can confirm the element type, and the access trace names the line that wrote. All of that is available before you open an editor, which is the point of reading the report properly.
:::

::: check
Why does `-fno-sanitize-recover=all` matter more in CI than on your own machine?
:::

::: answer
On your own machine you are watching the output. In CI, the program's exit status is the only thing anyone looks at.

Several UBSan checks default to "report and continue". Without the flag, an instrumented program can print a runtime error and still exit 0. The test job goes green, and the finding is buried in a log nobody opens. With the flag, the first finding stops the process, the test fails, and the report is the last thing in the log. The general rule: a diagnostic that does not change an exit status will be ignored — first occasionally, then forever.
:::

::: check
Your team's test suite takes 4 minutes. Roughly how long should it take under ASan, and how would you decide whether to run it on every commit?
:::

::: answer
Expect something like 8 to 15 minutes — 2 times for typical code, 3 to 4 times for memory-heavy code like the matrix multiply. You cannot narrow it further from first principles: a suite that spends much of its time starting processes, reading files or waiting will be barely slowed. So you measure: run it once under ASan and use the real number.

A common setup runs the plain build and fast unit tests on every commit, and the sanitized build on every merge to the main branch plus nightly over the long tests. The merge gate is what makes that safe: a sanitized run that happens only weekly finds bugs already a week old and tangled with a hundred other changes.
:::

::: check
The member overflow damaged `checksum` at `-O0` and did not at `-O1`. Which of the two is the bug, and what would you write in the defect report?
:::

::: answer
Neither. The loop bound is the bug. `for (int i = 0; i < 5; ++i) t->samples[i] = …` writes past the end of a four-element array, which is undefined behavior no matter what a particular build does. The `-O0` damage and the `-O1` non-damage are two permitted outcomes of one defect: in one, the write reached the member; in the other, the compiler had already decided `checksum` could not change and printed the value it knew.

The defect report says: "Line N writes `samples[4]` of a four-element array — undefined behavior. At `-O0` this overwrote `checksum`; at `-O1` the damage is hidden because the compiler assumes it cannot happen. AddressSanitizer does not detect this class, because the write stays inside one allocation; the UBSan bounds check does, when the array type is visible. Fix the bound, and guard with `std::span` or `.at()`."
:::

::: check
The leak report said "Direct leak of 384 byte(s) in 3 object(s)". A colleague says it does not matter, because the program exits right afterwards and the operating system takes everything back. Respond.
:::

::: answer
For this three-pass toy, the colleague is right about the effect and wrong about the practice. The operating system does reclaim a process's memory at exit, so a leak on a path that runs once before exit costs nothing.

But `make_frame` leaks once *per call*. Put it in a 100 Hz loop and it leaks $128 \times 100 = 12\,800$ bytes per second. Over a day that is $12\,800 \times 86\,400 \approx 1.1 \times 10^9$ bytes, about 1.1 GB — and a date you can calculate on which the vehicle runs out of memory.

There is also a team reason. Accept some leaks and the report is never empty, and a report that is never empty is one nobody reads. The rule that lasts is zero findings, with any genuine exception written into a suppression file with its reason.
:::

## Summary

| Item | Detail |
| --- | --- |
| shadow memory | one byte per 8 bytes; `00` addressable, `01`–`07` partly, other values poisoned |
| redzone | poisoned strip around every heap block and stack array, so overruns are caught |
| quarantine | freed blocks held poisoned, not reused at once, so use-after-free is caught |
| error classes | `heap-`/`stack-`/`global-buffer-overflow`, `heap-use-after-free`, `stack-use-after-scope`, `stack-use-after-return`, `attempting double-free`, `alloc-dealloc-mismatch`, `stack-overflow`, leaks |
| report layout | class and address, access kind and size, access trace, region, free trace, allocation trace, summary |
| "0 bytes inside of 16-byte region" | the access was at the start of a 16-byte block |
| "4 bytes after 40-byte region" | an overrun, and by how much |
| build flags | `-fsanitize=address -fsanitize=undefined -fno-sanitize-recover=all -g -O1 -fno-omit-frame-pointer`, compile and link |
| `ASAN_OPTIONS` | `detect_leaks`, `detect_stack_use_after_return`, `halt_on_error`, `abort_on_error`, `log_path` |
| measured cost | 3.4× time and 1.9× peak memory on a memory-bound matrix multiply; about 2× time is typical |
| does not catch | uninitialized reads, overflow between members of one object, data races, wrong logic |
| cannot combine with | ThreadSanitizer, MemorySanitizer: run those as separate builds |

The next lesson turns from bugs to layout: why a struct is bigger than the sum of its members, what alignment really requires, and how to work out a layout by hand before the compiler tells you.

::: context instrumentation What "instrumenting" code means
To **instrument** something is to fit it with measuring devices, the way a test rocket is fitted with pressure and temperature sensors. Compiler instrumentation does the same to a program: while compiling, the compiler adds extra instructions around the ones you wrote.

For ASan, every load or store of memory gets a few added instructions that check the shadow byte first. Your source code does not change at all. Remove the flag and rebuild, and the checks are gone. AddressSanitizer came out of Google, was described in a 2012 research paper, and has shipped with GCC since version 4.8 and with clang since 3.1.
:::

::: context shadow-memory Finding a shadow byte
On 64-bit Linux, ASan finds the shadow byte for an address with one shift and one add: divide the address by 8 (shift right by 3), then add a fixed offset, `0x7fff8000`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">application memory: 16-byte Frame</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="28" width="20" height="24" fill="#8fb8f0"/><rect x="30" y="28" width="20" height="24" fill="#8fb8f0"/>
    <rect x="50" y="28" width="20" height="24" fill="#8fb8f0"/><rect x="70" y="28" width="20" height="24" fill="#8fb8f0"/>
    <rect x="90" y="28" width="20" height="24" fill="#8fb8f0"/><rect x="110" y="28" width="20" height="24" fill="#8fb8f0"/>
    <rect x="130" y="28" width="20" height="24" fill="#8fb8f0"/><rect x="150" y="28" width="20" height="24" fill="#8fb8f0"/>
    <rect x="170" y="28" width="20" height="24" fill="#f2b880"/><rect x="190" y="28" width="20" height="24" fill="#f2b880"/>
    <rect x="210" y="28" width="20" height="24" fill="#f2b880"/><rect x="230" y="28" width="20" height="24" fill="#f2b880"/>
    <rect x="250" y="28" width="20" height="24" fill="#f2b880"/><rect x="270" y="28" width="20" height="24" fill="#f2b880"/>
    <rect x="290" y="28" width="20" height="24" fill="#f2b880"/><rect x="310" y="28" width="20" height="24" fill="#f2b880"/>
  </g>
  <text x="90" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">8 bytes (az)</text>
  <text x="250" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">8 bytes (t_s)</text>
  <line x1="90" y1="74" x2="150" y2="96" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="250" y1="74" x2="190" y2="96" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="130" y="98" width="40" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="170" y="98" width="40" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="150" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">00</text>
  <text x="190" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">00</text>
  <text x="220" y="116" font-size="11" fill="#1f2a44">2 shadow bytes</text>
</svg>
```

Live, both shadow bytes read `00`. After `delete`, both become `fd`, which is exactly the `[fd]fd` in the report.
:::

::: context redzones Alarm strips around every block
ASan asks the real allocator for a bit more than you requested and poisons the extra on both sides. Stack arrays get the same treatment from the compiler.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="70" height="30" fill="#b4232c" opacity="0.35" stroke="#1f2a44"/>
  <rect x="80" y="30" width="200" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="280" y="30" width="70" height="30" fill="#b4232c" opacity="0.35" stroke="#1f2a44"/>
  <text x="45" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">fa fa</text>
  <text x="180" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">your block: 00 00 …</text>
  <text x="315" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">fa fa</text>
  <text x="45" y="80" font-size="11" text-anchor="middle" fill="#b4232c">redzone</text>
  <text x="315" y="80" font-size="11" text-anchor="middle" fill="#b4232c">redzone</text>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">one step past either end lands on poison</text>
</svg>
```

A redzone only catches an access that *lands in it*. A write that jumps far past the end, clear over the redzone into another live block, can slip through unseen.
:::

::: context quarantine Why freed memory waits before reuse
A normal allocator reuses a freed block as soon as it can, so a stale pointer ends up reading someone else's live data, and nothing looks wrong.

ASan keeps freed blocks poisoned in a first-in, first-out queue, and recycles the oldest only when the queue passes its size limit, 256 MB by default on 64-bit systems. A use-after-free that happens soon after the free is therefore caught. One that happens after a huge amount of other freeing can land in recycled memory and be missed.
:::

::: context aslr Address randomization
Modern operating systems load a program's code, heap, stack and libraries at different random addresses on every run. This is **address space layout randomization** (ASLR). It makes attacks harder, because an attacker cannot know where anything sits in advance.

For you it means that raw addresses in a report change every run and are useless as identifiers. The function names and line numbers are what stay the same.
:::

::: context pc-bp-sp Three registers worth naming
**Registers** are the processor's handful of built-in storage slots. The **program counter** (pc) holds the address of the instruction being run. The **stack pointer** (sp) holds the address of the top of the stack. The **base pointer** or frame pointer (bp) marks the current function's stack frame.

When a trace has function names and line numbers, you can ignore all three. They matter when symbols are missing and you must match the pc against a disassembly by hand.
:::

::: context leak-scan How LeakSanitizer decides what leaked
At exit, LeakSanitizer stops the program and scans the places pointers can live: globals, thread stacks and registers. It follows every pointer it finds into the heap, and from those blocks onward to more. Any block it never reaches is a leak.

This is the same "mark what is reachable" idea a garbage collector uses. It is also why a block still pointed to by a global is *not* reported, even if you forgot to free it: it is still reachable.
:::

::: context tsan ThreadSanitizer, the separate build
**ThreadSanitizer** (TSan) catches **data races**: two threads touching the same memory, at least one writing, with no lock or atomic operation ordering them. It keeps its own shadow memory recording which thread touched each location, and when.

That is a different shadow layout from ASan's, which is why the two cannot share a build. TSan is slower than ASan and needs more memory. Lesson 12 comes back to races when it explains why `volatile` does not prevent them.
:::
