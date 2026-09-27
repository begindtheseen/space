---
id: l08-sanitizers-and-valgrind
title: Sanitizers and Valgrind
minutes: 28
covers:
  - AddressSanitizer, UBSan, ThreadSanitizer, LeakSanitizer
  - Valgrind memcheck, helgrind, callgrind and when to prefer it over ASan
---

A building can be protected from fire in two ways. One is a smoke detector in every room, built in with the house: cheap, always on, and it goes off the moment there is smoke, in the room where the smoke is. The other is a fire inspector. The inspector needs no wiring and can check any building, even one built by someone else long ago, but the visit is slow and expensive, so it happens now and then, not every day.

C++ bugs get the same two kinds of protection. **Sanitizers** are the smoke detectors: the compiler builds checks into your program, and it stops with a report the moment it does something illegal with memory, numbers or threads. **Valgrind** is the inspector: it runs an ordinary, already-built program on a simulated processor and watches every memory access, with no recompiling, at a much higher cost in time.

These are the worst bugs for a flight team. A read past the end of an array, a pointer to freed memory, two threads touching one variable: none reliably crashes. The program prints a believable answer until one day, with a different compiler, input or timing, it does not. Every buggy program below runs to the end with no error message when built normally.

## Sanitizers: checks the compiler writes for you

A **sanitizer** is a compiler option that adds checking code around risky operations. GCC and Clang both have them, turned on with `-fsanitize=` (read "f sanitize equals"). Four matter:

| Flag | Name | Catches |
|---|---|---|
| `-fsanitize=address` | AddressSanitizer (ASan) | out-of-bounds reads and writes, use after free |
| `-fsanitize=leak` | LeakSanitizer (LSan) | memory never freed |
| `-fsanitize=undefined` | UndefinedBehaviorSanitizer (UBSan) | signed overflow, bad shifts, and other undefined behavior |
| `-fsanitize=thread` | ThreadSanitizer (TSan) | data races between threads |

Build with debug information and a little optimization, so reports name files and lines and the program runs at a sensible speed:

```bash
g++ -g -O1 -fno-omit-frame-pointer -fsanitize=address prog.cpp -o prog_asan
```

`-g` adds line numbers, as for gdb; `-fno-omit-frame-pointer` helps the report print a clean call stack. The examples here used g++ 13.3.

## AddressSanitizer: reads and writes where they should not be

**AddressSanitizer**, ASan for short, checks every memory access in your code. Around every block of memory, it leaves a few bytes of no-man's-land, a **[[redzone|redzone]]**. And it keeps a small second map, the **[[shadow memory|shadow-memory]]**, recording for every 8 bytes of your memory whether they may be touched. Before each load or store, the compiled code checks the shadow; if the answer is "no", the program stops with a report. Freed memory is marked forbidden too, and held back for a while before reuse, so a late access lands on poison instead of someone's new data.

::: example A loop that reads one sample too many
This function averages gyro rates, with a classic off-by-one: `<=` where `<` belongs.

```cpp
// overflow.cpp: average the last n gyro samples (with an off-by-one).
#include <cstdio>

double average(const double* s, int n) {
    double sum = 0.0;
    for (int i = 0; i <= n; ++i)   // bug: should be i < n
        sum += s[i];
    return sum / n;
}

int main() {
    double* samples = new double[4]{0.010, 0.012, 0.011, 0.009};
    std::printf("mean rate = %.4f rad/s\n", average(samples, 4));
    delete[] samples;
}
```

Built normally, it runs and prints:

```text
mean rate = 0.0105 rad/s
```

That is even the right answer: $0.010 + 0.012 + 0.011 + 0.009 = 0.042$, and $0.042 / 4 = 0.0105$. The fifth read, `s[4]`, happened to find a 0 in the memory after the array. Luck, not correctness. Now build with ASan and run it:

```text
==22061==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x503000000060 ...
READ of size 8 at 0x503000000060 thread T0
    #0 0x5601ed8a928e in average(double const*, int) overflow.cpp:7
    #1 0x5601ed8a9337 in main overflow.cpp:13
    ...
0x503000000060 is located 0 bytes after 32-byte region [0x503000000040,0x503000000060)
allocated by thread T0 here:
    #0 0x7f449fafe6c8 in operator new[](unsigned long) ...
    #1 0x5601ed8a92ab in main overflow.cpp:12
    ...
SUMMARY: AddressSanitizer: heap-buffer-overflow overflow.cpp:7 in average(double const*, int)
```

Read it in four steps.

1. **What:** `heap-buffer-overflow`, a `READ of size 8`: one `double`.
2. **Where:** frame `#0` of the first stack: line 7, `sum += s[i];`, in `average`, called from line 13.
3. **Whose memory:** "0 bytes after 32-byte region". The block is $4 \times 8 = 32$ bytes, and the read landed on the first byte past its end: `s[4]`.
4. **Born where:** the second stack, "allocated by thread T0 here", points to line 12, the `new double[4]`.

The whole diagnosis, on the first run, where the normal build passed. The program exits with status 1, so a test script sees a failure.
:::

The same format covers **use after free**. Here a pointer is kept into a `std::vector`, and then the vector grows. A vector that runs out of room moves its data to a bigger block and frees the old one, so the old pointer now points at freed memory:

```cpp
// uaf.cpp: keep a pointer into a vector, then let the vector grow.
#include <cstdio>
#include <vector>

int main() {
    std::vector<double> alt = {100.0, 101.5};
    double* newest = &alt.back();    // points into the vector's buffer
    alt.push_back(103.2);            // grows: buffer moved, old one freed
    std::printf("newest = %.1f\n", *newest);
}
```

The normal build printed `newest = 0.0`: wrong, and silent. ASan says:

```text
==22099==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000018 ...
READ of size 8 at 0x502000000018 thread T0
    #0 0x555c1a6d1add in main uaf.cpp:9
0x502000000018 is located 8 bytes inside of 16-byte region [0x502000000010,0x502000000020)
freed by thread T0 here:
    #0 ... in operator delete(void*, unsigned long) ...
    ...
    #7 0x555c1a6d1ab5 in main uaf.cpp:8
previously allocated by thread T0 here:
    ...
    #6 0x555c1a6d156b in main uaf.cpp:6
```

Three stacks tell the memory's life story: born on line 6 (two doubles, 16 bytes), freed on line 8 by `push_back`, used after death on line 9. "8 bytes inside" is element `[1]`, the `101.5` that `newest` pointed at.

::: key
AddressSanitizer (`-fsanitize=address`) stops at the first out-of-bounds access or use after free and prints what was accessed, where, and where the memory was allocated and freed. It costs roughly 2x in run time, so it can run the whole test suite.
:::

## LeakSanitizer: memory nobody freed

A **memory leak** is memory the program asked for and never gave back. Leaking 64 bytes per telemetry frame at 100 frames a second is 6.4 kB a second, and a flight computer runs out eventually. **LeakSanitizer** (LSan) waits until the program exits, finds blocks that nothing points to any more, and reports the stack that allocated each. On Linux it is built into ASan; `-fsanitize=leak` turns it on alone.

```cpp
// leak.cpp: a telemetry packet allocated per frame and never freed.
#include <cstdio>
#include <cstring>

char* make_packet(int seq) {
    char* p = new char[64];
    std::snprintf(p, 64, "SEQ=%d", seq);
    return p;
}

int main() {
    for (int seq = 0; seq < 3; ++seq) {
        char* pkt = make_packet(seq);
        std::printf("%s\n", pkt);        // sent... and forgotten
    }
}
```

```text
==22243==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 192 byte(s) in 3 object(s) allocated from:
    #0 0x7f4b2d816362 in operator new[](unsigned long) ...
    #1 0x55f0effb619e in make_packet(int) leak.cpp:6

SUMMARY: LeakSanitizer: 192 byte(s) leaked in 3 allocation(s).
```

Three packets of 64 bytes: $3 \times 64 = 192$ bytes, from line 6. "Direct" means nothing points to them. The modern fix is a `std::string` or `std::unique_ptr<char[]>`, which frees itself.

## UBSan: undefined behavior that is not a memory error

Some mistakes are not about memory. For certain operations the C++ standard says the result is **[[undefined behavior|undefined-behavior]]**: no promise at all, and the compiler may assume it never happens. Signed integer overflow is the famous one. **UBSan**, `-fsanitize=undefined`, checks for these at run time.

::: example A mission clock that runs out after 36 minutes
A flight computer counts **mission elapsed time** (MET), the time since launch, in microseconds, in a plain `int`. The control loop adds 1,000 µs every 1 ms cycle.

```cpp
// ubsan.cpp: mission elapsed time kept as int microseconds.
#include <cstdio>

int main() {
    int met_us = 0;                        // 32-bit int on this platform
    const int tick_us = 1000;              // 1 ms control cycle
    for (int cycle = 0; cycle < 2'200'000; ++cycle)   // about 36.7 minutes
        met_us += tick_us;
    std::printf("MET = %d us\n", met_us);

    int shift = 40;
    unsigned flags = 1u << shift;          // shift past the width
    std::printf("flags = %u\n", flags);
}
```

First, the arithmetic. A 32-bit signed `int` holds at most $2^{31} - 1 = 2\,147\,483\,647$ µs, which is $2147.48$ s, or 35.79 minutes. The loop runs 2,200,000 cycles of 1 ms, 36.67 minutes, so the counter overflows about 52 seconds before the end.

The normal build prints:

```text
MET = -2094967296 us
flags = 256
```

A negative mission time, with no warning at run time. The UBSan build names both mistakes, file, line and column:

```text
ubsan.cpp:8:16: runtime error: signed integer overflow: 2147483000 + 1000 cannot be represented in type 'int'
ubsan.cpp:12:25: runtime error: shift exponent 40 is too large for 32-bit type 'unsigned int'
```

Check the first line: 2,147,483,000 is the last multiple of 1,000 that fits, and 1,000 more would pass $2\,147\,483\,647$. The second line is the other bug: shifting a 32-bit value by 40 places is also undefined.

Built with `-O2` instead of `-O0`, the same source prints `flags = 0`, not 256: with undefined behavior the answer depends on the compiler. The fix for the clock is `std::int64_t`, which holds microseconds for about 292,000 years.
:::

By default UBSan reports and keeps going, which is why both errors appeared. To make a test fail, add `-fno-sanitize-recover=all`: the program then stops with exit status 1 at the first report.

::: key
UBSan catches undefined behavior that is not a memory error: signed integer overflow, shifts past the width, misaligned or null-derived pointer arithmetic, invalid enum or bool values, and float-to-int conversions that do not fit.
:::

::: warning Not every check is in the default group
With GCC, `-fsanitize=undefined` does *not* include the float-to-int check. A test converting $3 \times 10^9$ to `int` passed silently until built with `-fsanitize=undefined,float-cast-overflow`, which reported `3e+09 is outside the range of representable values of type 'int'`. Clang includes that check by default.
:::

## ThreadSanitizer: two threads, one variable, no rules

A **data race** is two threads accessing the same memory, at least one of them writing, with nothing forcing an order between them. Picture two people updating one whiteboard tally. Each reads the number, adds one in their head, and writes it back. If both read 41 at once, both write 42, and a count is lost. Testing rarely catches this: the bad timing may need two threads to hit the same few nanoseconds, once in a million runs, or only on the flight processor.

**ThreadSanitizer** (TSan), `-fsanitize=thread`, does not wait for the bad timing. For every access it records which thread made it and what that thread had synchronized with, using a rule called **[[happens-before|happens-before]]**. Two accesses from different threads, one a write, not ordered by any lock, atomic or join, are reported, even if they ran a millisecond apart and the answer came out right.

::: example A race that passes every test
A sensor thread and a control thread both count frames in one shared variable:

```cpp
// race.cpp: a sensor thread and a control thread share one counter.
#include <cstdio>
#include <thread>

long frames = 0;                 // shared, no lock, not atomic

void sensor_loop() {
    for (int i = 0; i < 100000; ++i)
        ++frames;                // write
}

void control_loop() {
    for (int i = 0; i < 100000; ++i)
        ++frames;                // write
}

int main() {
    std::thread a(sensor_loop);
    std::thread b(control_loop);
    a.join();
    b.join();
    std::printf("frames = %ld (expected 200000)\n", frames);
}
```

Built normally and run five times, it printed `frames = 200000 (expected 200000)` every time. Now with TSan (`g++ -g -fsanitize=thread race.cpp`):

```text
WARNING: ThreadSanitizer: data race (pid=22376)
  Read of size 8 at 0x55e6a8a45020 by thread T2:
    #0 control_loop() race.cpp:14
    ...
  Previous write of size 8 at 0x55e6a8a45020 by thread T1:
    #0 sensor_loop() race.cpp:9
    ...
  Location is global 'frames' of size 8 at 0x55e6a8a45020

  Thread T2 (tid=22382, running) created by main thread at:
    #2 main race.cpp:19
  Thread T1 (tid=22381, running) created by main thread at:
    #2 main race.cpp:18

SUMMARY: ThreadSanitizer: data race race.cpp:14 in control_loop()
...
frames = 200000 (expected 200000)
ThreadSanitizer: reported 2 warnings
```

Read the **interleaving** it describes. Thread T1, started on line 18, *wrote* `frames` on line 9 in `sensor_loop`. Thread T2, started on line 19, *read* the same 8 bytes on line 14 in `control_loop`, and no mutex, atomic or join ordered the write before the read. `++frames` is really three steps (read, add, write), so T2 could read a stale value and write it back over T1's update: the lost whiteboard count.

The final count was right, and TSan reported the race anyway. It exits with status 66 so a test script notices.

The fix makes the increment one indivisible step with `std::atomic` (and `#include <atomic>`):

```cpp
std::atomic<long> frames{0};     // fixed: atomic increments
// ... and print frames.load() at the end
```

Rebuilt with TSan, it prints the same count, no warnings, and exits with status 0.
:::

::: key
ThreadSanitizer detects data races: two threads accessing the same memory with at least one write and no synchronisation. It reports the race even on an execution where the outcome happened to be correct, which is exactly what stress testing cannot guarantee.
:::

::: warning A reported race is a real bug, even when the answer is right
A data race is undefined behavior in C++ whatever number comes out, so "the tests pass" does not make a TSan report a false alarm. It means the outcome happens to be harmless on this machine, with this compiler, today. And `volatile` does not fix it: `volatile` only stops the compiler from removing or merging accesses; it makes nothing atomic and orders nothing between threads. Use `std::atomic` or a `std::mutex`.
:::

## Sanitizers in practice

- **What mixes.** ASan, LSan and UBSan combine: `-fsanitize=address,undefined` is the everyday build. TSan cannot share a build with ASan (g++: `'-fsanitize=thread' is incompatible with '-fsanitize=address'`), so a typical **[[CI|ci-jobs]]** setup runs the whole suite twice: once under ASan+UBSan, once under TSan.
- **Keep the optimization you ship.** Sanitizers work at `-O1` and `-O2`. A bug seen only in Release usually means optimization exposed undefined behavior or changed thread timing. Build that same configuration with `-g` and sanitizers added, and run the failing test in a loop until the report appears. Turning optimization off tends to hide the bug, not fix it.
- **Know the price.** ASan costs roughly 2x in run time, the figure its authors quote as typical; TSan often 5 to 15 times. Cheap enough for every test on every change, but sanitizers are for testing, never for the binary you fly.

## Valgrind: inspecting a program you cannot rebuild

Sanitizers require a recompile, and sometimes you cannot: the bug is inside a vendor's closed-source library, shipped only as a `.so` file, or in a pre-built tool from another team. For those cases there is **[[Valgrind|valgrind-name]]**.

Valgrind runs your unmodified program on a kind of simulated CPU. It reads the machine code a small block at a time, translates it, adds checking code, and runs the result. This is **[[dynamic binary instrumentation|dbi]]**. Every part of the program gets checked, including libraries you have no source for. The price is speed.

Valgrind is a family of tools, picked with `--tool=`. Three matter here.

### memcheck: the default

**memcheck** runs when you type `valgrind ./program`. It finds invalid heap reads and writes, use after free, leaks, and one thing ASan cannot see at all: **use of uninitialised values**. Here it is on the same normally built binary that printed a believable answer earlier:

```text
$ valgrind ./overflow_plain
==22264== Memcheck, a memory error detector
==22264== Invalid read of size 8
==22264==    at 0x1091BE: average(double const*, int) (overflow.cpp:7)
==22264==    by 0x10925C: main (overflow.cpp:13)
==22264==  Address 0x4e210a0 is 0 bytes after a block of size 32 alloc'd
==22264==    at 0x48485C3: operator new[](unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==22264==    by 0x109205: main (overflow.cpp:12)
==22264==
mean rate = 0.0105 rad/s
...
==22264== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 0 from 0)
```

The same diagnosis as ASan: line 7, 0 bytes past a 32-byte block from line 12. The `==22264==` prefix is the process ID, which keeps Valgrind's messages apart from the program's output. With `--leak-check=full`, memcheck also reports the packet leak: `192 bytes in 3 blocks are definitely lost`.

::: example The bug ASan and UBSan both miss
A guidance setup function forgets to set one field on one path:

```cpp
// uninit.cpp: a mode flag that one code path forgets to set.
#include <cstdio>

struct Guidance {
    int    mode;        // 0 = coast, 1 = burn
    double throttle;
};

Guidance init(bool from_config) {
    Guidance g;
    if (from_config) g.mode = 1;    // the other path never sets mode
    g.throttle = 0.7;
    return g;
}

int main() {
    Guidance g = init(false);
    if (g.mode == 1)
        std::printf("BURN at %.0f%%\n", g.throttle * 100);
    else
        std::printf("coast\n");
}
```

Built with `-fsanitize=address,undefined`, it prints `coast`, exits with status 0, and reports nothing. Nothing went out of bounds or overflowed; the memory was allowed to be read, only never *written*. Whether the engine burns depends on leftover bytes on the stack. Now memcheck, on a normal build, with `--track-origins=yes` to ask where the bad value came from:

```text
$ valgrind --track-origins=yes ./un_plain
==22308== Conditional jump or move depends on uninitialised value(s)
==22308==    at 0x109223: main (uninit.cpp:18)
==22308==  Uninitialised value was created by a stack allocation
==22308==    at 0x109189: init(bool) (uninit.cpp:9)
```

"Conditional jump" means an `if` decided something, on line 18, `if (g.mode == 1)`, using a value never set. "Created by a stack allocation" in `init`, line 9, points at the local `Guidance g`: the root cause, found without touching the build.
:::

The sanitizer answer for this bug is **[[MemorySanitizer|msan]]**, `-fsanitize=memory`: Clang only, and every library in the program must be compiled with it too:

```bash
clang++ -g -O1 -fsanitize=memory -fno-omit-frame-pointer uninit.cpp -o un_msan
```

When that whole-program rebuild is not possible, memcheck is the practical tool.

### helgrind: races without a rebuild

**helgrind**, `valgrind --tool=helgrind`, finds data races and misuse of threads and locks, such as locks taken in an order that could deadlock. On the normally built race program:

```text
==22320== Possible data race during read of size 8 at 0x10C020 by thread #3
==22320== Locks held: none
==22320==    at 0x10928E: control_loop() (race.cpp:14)
...
==22320== This conflicts with a previous write of size 8 by thread #2
==22320== Locks held: none
==22320==    at 0x109265: sensor_loop() (race.cpp:9)
...
==22320==  Address 0x10c020 is 0 bytes inside data symbol "frames"
```

The same two lines TSan found; "Locks held: none" on both sides says why it is a race. TSan is faster and belongs in CI; helgrind is for a threaded binary you cannot rebuild.

### callgrind: counting every instruction

**callgrind**, `valgrind --tool=callgrind`, is not a bug finder but a profiler: it counts exactly how many machine instructions each function and source line executes, and how often each function is called. `callgrind_annotate` turns its output into a report. Here, on a program that drops 200 simulated vehicles with drag and altitude-dependent gravity:

```text
$ valgrind --tool=callgrind --callgrind-out-file=cg.out ./prop
$ callgrind_annotate cg.out
80,660,010 (100.0%)  PROGRAM TOTALS

46,805,068 (58.03%)  prop.cpp:propagate(double, double, double) [prop]
17,019,152 (21.10%)  prop.cpp:gravity(double) [prop]
14,891,758 (18.46%)  prop.cpp:drag(double) [prop]
...
31,910,910 (39.56%)          vel += (-gravity(alt) + drag(vel) / 25000.0) * dt;
17,019,152 (21.10%)  => prop.cpp:gravity(double) (2,127,394x)
```

The counts are exact and repeatable, which makes callgrind good for comparing two versions of a function. `gravity` was called 2,127,394 times, about 10,637 steps per vehicle. But instructions are not time: a cache miss costs far more than an addition, and callgrind does not see that. For time on real hardware, lesson 09 uses perf.

## When to prefer Valgrind over ASan

Both find heap overflows and use after free. The choice comes down to what you can change and what you can afford.

::: example Measuring the cost
A memory-heavy program (20,000 small heap objects, read over and over) was timed three ways:

| Build and run | Time | Relative |
|---|---|---|
| normal, `-O1` | 0.43 s | 1x |
| ASan, `-O1 -fsanitize=address` | 1.30 s | $1.30 / 0.43 \approx 3.0$x |
| normal build under `valgrind` (memcheck) | 9.05 s | $9.05 / 0.43 \approx 21$x |

On the `prop` program scaled up to 2,000 vehicles, which barely touches memory, ASan cost $0.62 / 0.58 \approx 1.07$x and memcheck $7.68 / 0.58 \approx 13$x. ASan adds work only to memory accesses; memcheck translates every instruction, so it is slow everywhere. Valgrind's own quick-start guide warns of 20 to 30 times, and memory-heavy code can reach 50.

So a 10-minute test suite takes about 20 minutes under ASan, fine for every merge request, but $10 \times 20 = 200$ to $10 \times 50 = 500$ minutes under memcheck: a tool for one targeted run, not a gate.
:::

In short:

| Situation | Choose | Why |
|---|---|---|
| Your own code, every change, in CI | ASan+UBSan; TSan in its own job | about 2x: whole suite |
| Third-party, pre-built or closed-source binary | memcheck | no recompile |
| Suspected uninitialised read | memcheck, or Clang MSan | ASan and UBSan miss it |
| A threaded binary you cannot rebuild | helgrind | TSan needs a recompile |
| Stack or global array overrun | ASan | memcheck tracks heap blocks only |
| Exact instruction and call counts | callgrind | counts, not time |

The stack-array row comes from a real test. When a loop read `q[4]` from a local `double q[4]`, ASan stopped with `stack-buffer-overflow` on the right line. Memcheck said nothing about that line; it complained only later, deep inside `printf`, about printing an uninitialised value. It saw the damage, not where it was done.

::: key
ASan vs Valgrind memcheck for CI: pick ASan. It needs a recompile but costs roughly 2x runtime, so it can run the whole suite. Valgrind needs no recompile, which is why you reach for it on a third-party or pre-built binary, but at roughly 20x slowdown it is a targeted tool, not a gate.
:::

::: warning Do not run a sanitized program under Valgrind
Both tools want to own the program's memory. An ASan build under Valgrind fails at start-up with `ASan runtime does not come first in initial library list`. Give Valgrind a normal `-g` build.
:::

## Check yourself

::: check
An ASan report says: `heap-buffer-overflow`, `WRITE of size 4`, "located 8 bytes after 40-byte region", allocated at `filter.cpp:31`. The code allocated `new float[10]`. Which element was written, and what kind of bug is it most likely?
:::

::: answer
A `float` is 4 bytes, so the $10 \times 4 = 40$-byte region holds elements 0 to 9. The first byte past the end is where element 10 would start; 8 bytes further is $10 + 8/4 = 12$. So the code wrote `x[12]`, three past the last valid index, 9. Being more than one past the end suggests a wrong size or index calculation rather than a `<=` slip.
:::

::: check
A sensor driver counts bytes received in an `int32_t` and is never reset. The link runs at 2,000,000 bytes per second. When does the counter overflow, and which tool would have reported it in a test that ran long enough?
:::

::: answer
The largest `int32_t` is $2^{31} - 1 = 2\,147\,483\,647$. At $2 \times 10^6$ bytes per second, that takes $2\,147\,483\,647 / 2\,000\,000 \approx 1074$ s, about 17.9 minutes. Signed overflow is undefined behavior, so UBSan reports it, with file and line, the moment it happens. A test can push that many bytes in a loop in seconds, without waiting for real time.
:::

::: check
TSan reports a race on a `bool stop_requested` flag written by the ground-command thread and read by the control loop. A teammate proposes declaring it `volatile bool`. What do you say?
:::

::: answer
No. `volatile` only stops the compiler from removing or merging accesses; it gives no atomicity and no ordering between threads, so the race and the undefined behavior remain. Use `std::atomic<bool>` (or a mutex). Atomic stores and loads are ordered between threads, so data written before setting the flag is also visible to the thread that reads it.
:::

::: check
You are handed a navigation library as a pre-built `.so` with no source, and a test program that uses it sometimes prints a different answer for the same input. Which tool do you run first, with what command, and what kinds of report would you hope to see?
:::

::: answer
Valgrind memcheck, since the library cannot be rebuilt with sanitizers: `valgrind --track-origins=yes ./test_program`, with the test program built normally with `-g`. "Same input, different answer" suggests reading memory never written, so the hoped-for report is `Conditional jump or move depends on uninitialised value(s)` with its origin; an `Invalid read` would point to out-of-bounds or freed memory. A 20 to 50 times slowdown is fine for one targeted run.
:::

## Summary

| Tool | Build or run | Finds | Cost |
|---|---|---|---|
| ASan | `-fsanitize=address` | heap, stack and global out-of-bounds; use after free | about 2x |
| LSan | built into ASan on Linux; `-fsanitize=leak` | memory never freed, with allocation stack | at exit |
| UBSan | `-fsanitize=undefined` (+ `float-cast-overflow` on GCC) | signed overflow, bad shifts, bad enum/bool, bad pointer arithmetic | small |
| TSan | `-fsanitize=thread`, not with ASan | data races, even when the answer was right | about 5–15x |
| memcheck | `valgrind ./prog` | heap errors, leaks, uninitialised reads, no recompile | about 20–50x |
| helgrind | `valgrind --tool=helgrind ./prog` | races and lock misuse, no recompile | slow |
| callgrind | `valgrind --tool=callgrind ./prog` | exact instruction and call counts | slow |

The next lesson turns from "is it correct?" to "where does the time go?": perf, hardware counters and flame graphs, and how to prove that a change really made the code faster.

::: context redzone Fences around every block
A redzone is a strip of forbidden bytes that ASan places on each side of every block it hands out: heap blocks, local arrays on the stack, and global arrays. A read or write that runs off the end of a block lands in the fence and is caught. ASan's full report prints a map of the shadow bytes; in the first example, the key row ends `00 00 00 00[fa]`: four usable 8-byte groups, the four doubles, then the redzone byte that was hit, in brackets. `fa` is the code for a heap redzone. The fences are why ASan uses more memory than a normal build.
:::

::: context shadow-memory A small map beside the big one
For every 8 bytes of program memory, ASan keeps 1 byte of shadow memory saying how many of those 8 bytes may be touched: `00` for all of them, a number 1 to 7 for only the first few, and special negative codes for redzones and freed memory. Before every load or store, the compiled code finds the shadow byte with a shift and an add, and checks it. That is one extra load and compare per access, which is why the overhead is about 2x and not 20x.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" font-weight="700" fill="#1f2a44">Program memory, 8 bytes per box</text>
  <g stroke="#1f2a44" font-size="11" text-anchor="middle">
    <rect x="10" y="24" width="56" height="28" fill="#f2b880"/><text x="38" y="42" fill="#1f2a44" stroke="none">redzone</text>
    <rect x="66" y="24" width="56" height="28" fill="#8fb8f0"/><text x="94" y="42" fill="#1f2a44" stroke="none">s[0]</text>
    <rect x="122" y="24" width="56" height="28" fill="#8fb8f0"/><text x="150" y="42" fill="#1f2a44" stroke="none">s[1]</text>
    <rect x="178" y="24" width="56" height="28" fill="#8fb8f0"/><text x="206" y="42" fill="#1f2a44" stroke="none">s[2]</text>
    <rect x="234" y="24" width="56" height="28" fill="#8fb8f0"/><text x="262" y="42" fill="#1f2a44" stroke="none">s[3]</text>
    <rect x="290" y="24" width="56" height="28" fill="#f2b880"/><text x="318" y="42" fill="#1f2a44" stroke="none">redzone</text>
  </g>
  <g stroke="#6c7a93" stroke-dasharray="3 3">
    <line x1="38" y1="52" x2="38" y2="90"/><line x1="94" y1="52" x2="94" y2="90"/><line x1="150" y1="52" x2="150" y2="90"/><line x1="206" y1="52" x2="206" y2="90"/><line x1="262" y1="52" x2="262" y2="90"/><line x1="318" y1="52" x2="318" y2="90"/>
  </g>
  <text x="10" y="86" font-size="12" font-weight="700" fill="#1f2a44">Shadow, 1 byte each</text>
  <g stroke="#1f2a44" font-size="12" text-anchor="middle">
    <rect x="24" y="92" width="28" height="22" fill="#fff"/><text x="38" y="107" fill="#b4232c" stroke="none">fa</text>
    <rect x="80" y="92" width="28" height="22" fill="#fff"/><text x="94" y="107" fill="#1f2a44" stroke="none">00</text>
    <rect x="136" y="92" width="28" height="22" fill="#fff"/><text x="150" y="107" fill="#1f2a44" stroke="none">00</text>
    <rect x="192" y="92" width="28" height="22" fill="#fff"/><text x="206" y="107" fill="#1f2a44" stroke="none">00</text>
    <rect x="248" y="92" width="28" height="22" fill="#fff"/><text x="262" y="107" fill="#1f2a44" stroke="none">00</text>
    <rect x="304" y="92" width="28" height="22" fill="#fff"/><text x="318" y="107" fill="#b4232c" stroke="none">fa</text>
  </g>
  <text x="318" y="136" font-size="11" text-anchor="middle" fill="#b4232c">s[4] lands here</text>
</svg>
```
:::

::: context undefined-behavior The compiler's permission slip
Undefined behavior does not mean "some random number". It means the C++ standard places no requirement at all on what happens, and the optimizer is allowed to assume the situation never arises. From "signed overflow never happens" a compiler may conclude that `x + 1 > x` is always true and delete a safety check. That is why the MET example changed with `-O2`, and why g++ even warned at `-O2` that iteration 2,147,483 "invokes undefined behavior". Unsigned integers are different: they are defined to wrap around, modulo $2^{32}$ for a 32-bit type.
:::

::: context happens-before How TSan decides two accesses are ordered
Happens-before is the ordering the program itself guarantees. Inside one thread, earlier lines happen before later ones. Across threads, only synchronization creates order: unlocking a mutex happens before the next lock of it, a thread's end happens before the `join` that waits for it, an atomic store with release order happens before a load that sees it. TSan keeps a vector clock per thread, a small table of "what I know about everyone's progress", to check this. Two accesses with no happens-before path between them, one a write, are a race, however far apart in time they ran.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="60" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">T1 sensor</text>
  <text x="280" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">T2 control</text>
  <line x1="60" y1="26" x2="60" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <line x1="280" y1="26" x2="280" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="60" cy="56" r="6" fill="#b4232c"/>
  <text x="72" y="60" font-size="11" fill="#1f2a44">write frames (line 9)</text>
  <circle cx="280" cy="112" r="6" fill="#b4232c"/>
  <text x="178" y="116" font-size="11" fill="#1f2a44">read (line 14)</text>
  <line x1="68" y1="60" x2="272" y2="108" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="170" y="82" font-size="11" fill="#b4232c" text-anchor="middle">no lock, no atomic: race</text>
  <text x="180" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">time runs downward</text>
</svg>
```
:::

::: context ci-jobs Continuous integration
Continuous integration, CI, is the server that builds and tests every proposed change before it is allowed into the main branch. A typical C++ project runs several jobs in parallel for each change: a normal build, an ASan+UBSan build running all tests, and a TSan build running the threaded tests. A red result in any of them blocks the merge. This is where sanitizers pay off: the bug is caught while the author still remembers the change, not months later on a test stand.
:::

::: context valgrind-name The gate to the hall
The name comes from Norse mythology: Valgrind is the main gate of Valhalla, the hall of slain warriors. The project's own FAQ says so and gives the pronunciation as "val-grinned", rhyming with "grinned", not "grind". Valgrind was created by Julian Seward and first released in 2002; its tools, including memcheck, helgrind, cachegrind and callgrind, are still maintained today.
:::

::: context dbi Translating the program as it runs
Valgrind never lets your program's machine code run directly. It takes one short stretch of code at a time, translates it into its own simple intermediate language, lets the chosen tool add its checks, translates the result back into machine code, and runs that. Each translated block is kept, so hot loops are translated only once. Because the whole program passes through this, closed-source libraries are checked too. It also runs the program's threads one at a time, which is part of why it is slow on multi-core machines.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle">
    <rect x="6" y="30" width="72" height="44" fill="#fff" stroke="#1f2a44"/><text x="42" y="50" fill="#1f2a44">machine</text><text x="42" y="64" fill="#1f2a44">code block</text>
    <rect x="96" y="30" width="72" height="44" fill="#8fb8f0" stroke="#1f2a44"/><text x="132" y="50" fill="#1f2a44">translate</text><text x="132" y="64" fill="#1f2a44">to IR</text>
    <rect x="186" y="30" width="72" height="44" fill="#f2b880" stroke="#1f2a44"/><text x="222" y="50" fill="#1f2a44">tool adds</text><text x="222" y="64" fill="#1f2a44">checks</text>
    <rect x="276" y="30" width="78" height="44" fill="#8fb8f0" stroke="#1f2a44"/><text x="315" y="50" fill="#1f2a44">back to code,</text><text x="315" y="64" fill="#1f2a44">run it</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="78" y1="52" x2="94" y2="52"/><line x1="168" y1="52" x2="184" y2="52"/><line x1="258" y1="52" x2="274" y2="52"/>
  </g>
  <text x="180" y="98" font-size="11" fill="#6c7a93" text-anchor="middle">IR: Valgrind's own intermediate representation</text>
</svg>
```
:::

::: context msan Why MemorySanitizer is harder to use
MemorySanitizer tracks, for every bit of memory, whether it has been initialized, and reports when an uninitialized value decides a branch or is passed somewhere that matters. To do that it must see every write, so every piece of code in the program, including the C++ standard library, must be compiled with it; one uninstrumented library produces false alarms. That is why it is available in Clang only and why many teams use Valgrind memcheck for this bug class instead.
:::
