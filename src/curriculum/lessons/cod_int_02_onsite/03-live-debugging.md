---
id: l03-live-debugging
title: Live debugging
minutes: 26
covers:
  - 'Live debugging: here is code that crashes or leaks, find it'
---

Think about a car that makes a strange clunk. A poor mechanic starts swapping parts at random: new tires, new battery, new brakes, and maybe the clunk stops, and nobody knows why. A good mechanic does something different. She drives the car until she can make the clunk happen on purpose. She listens to exactly where it comes from. She narrows it down — front or back, left or right — until only one part is left. Then she checks that part, and only then does she replace it.

Debugging code is the same job. One onsite round is **reported** to go like this: the interviewer hands you a short program that crashes or leaks, and says "find it". What they are watching is not whether you spot the bug in ten seconds. It is whether you work like the good mechanic, out loud, so they can follow your reasoning. That is the **[[think-aloud|think-aloud]]** part, and it matters as much as the answer.

This lesson gives you a method, then the four tools that do most of the finding, then five small buggy programs — the classic bugs from last lesson, now broken on purpose — each with what the tools really printed and the fix. Every fixed program here was compiled with `g++ -std=c++17 -Wall` and run.

## A method, not a guess

Here is the method in five steps. Say each step aloud as you do it.

1. **Reproduce.** Make the failure happen on demand, with the smallest input that still shows it. A bug you cannot trigger reliably cannot be fixed with confidence, because you cannot tell whether your fix worked.
2. **Read the error — all of it.** Compilers and tools print the file and line. Read the *first* error first; later ones are often echoes of it. Most people glance at an error message. Reading it slowly finds a surprising number of bugs on the spot.
3. **[[Bisect|bisect]].** Cut the search space in half, and in half again. Comment out half the code, or test the input's first half, or check a value halfway through the run. Each test halves what is left.
4. **Form one hypothesis at a time.** Say "I think `latest` is used after it was freed. If so, the address sanitizer will report a use-after-free on line 18." A hypothesis comes with a prediction. Then test the prediction.
5. **Use the tools.** Build with debug information and sanitizers, and let the machine find the exact line.

::: key The live-debugging method
Reproduce with the smallest input; read the whole error, first error first; bisect to halve the search; state one hypothesis with a prediction and test it; build with `-g -fsanitize=address,undefined`, and reach for valgrind and a gdb backtrace. Narrate every step.
:::

::: warning Do not start by editing
The most common mistake in this round is changing code before understanding the bug — adding a check here, a print there, hoping the crash goes away. If the crash disappears and you do not know why, the bug is probably still there, hidden. Say what you think is wrong first, then change one thing.
:::

## The four tools

- **`-g`** tells the compiler to include **[[debug information|debug-info]]** — a map from machine instructions back to your file names and line numbers. Without it, tools can only show raw addresses. It does not change what the program does.
- **`-fsanitize=address,undefined`** builds the program with two **sanitizers**, checks the compiler adds to your code. **AddressSanitizer** (ASan) catches bad memory use — use-after-free, reading past the end of a buffer, double delete, and leaks at exit. **UndefinedBehaviorSanitizer** (UBSan) catches things like signed overflow. The program runs about twice as slow, and stops at the first error with a detailed report.
- **valgrind** runs your unchanged program inside a simulated processor that watches every memory access. No rebuild is needed, but it runs many times slower. Its leak report is the classic one.
- **gdb** is the debugger. For a crash, the one command to know is `bt`, for **[[backtrace|backtrace]]**: the chain of function calls that led to the crash, innermost first.

Every tool output below is real, from the programs shown. Long lines of library frames were trimmed and marked with `...`.

## Bug 1: use after free

A receiver keeps a pointer to the latest packet. Shutdown frees it. Then something reads it.

```cpp
#include <cstdio>

struct Packet { int seq; double value; };

Packet* latest = nullptr;

void receive(int seq) {
    delete latest;                  // drop the old packet
    latest = new Packet{seq, 0.5 * seq};
}

void shutdown() { delete latest; }  // frees it, but latest still points there

int main() {
    receive(1);
    receive(2);
    shutdown();
    std::printf("last seq = %d\n", latest->seq);   // reads freed memory
}
```

Built normally, it ran without crashing and printed a different garbage number each time, for example:

```text
last seq = 1691714034
```

That is the worst kind of bug: no crash, a wrong answer. Now rebuild with `g++ -std=c++17 -Wall -g -fsanitize=address,undefined`:

```text
==4244==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000030 ...
READ of size 4 at 0x502000000030 thread T0
    #0 0x55af8cc3c474 in main l03_uaf_bug.cpp:18
    ...
0x502000000030 is located 0 bytes inside of 16-byte region [0x502000000030,0x502000000040)
freed by thread T0 here:
    #0 0x7f9420cff5e8 in operator delete(void*, unsigned long) ...
    #1 0x55af8cc3c3f1 in shutdown() l03_uaf_bug.cpp:12
    #2 0x55af8cc3c41a in main l03_uaf_bug.cpp:17
previously allocated by thread T0 here:
    #0 0x7f9420cfe548 in operator new(unsigned long) ...
    #1 0x55af8cc3c2db in receive(int) l03_uaf_bug.cpp:9
    #2 0x55af8cc3c415 in main l03_uaf_bug.cpp:16
```

Read it in three parts. **What:** a read of 4 bytes (one `int`, the `seq` field) of freed heap memory, on line 18. **Freed where:** in `shutdown()`, line 12. **Allocated where:** in `receive()`, line 9, called from line 16 — the second packet. The report tells the whole life story of the memory. The region is 16 bytes because `Packet` is an `int` (4 bytes) plus 4 bytes of padding plus a `double` (8 bytes).

The fix is ownership. With a `unique_ptr`, freeing also empties the pointer, so there is nothing left to dangle:

```cpp
#include <cstdio>
#include <memory>

struct Packet { int seq; double value; };

std::unique_ptr<Packet> latest;

void receive(int seq) {
    latest = std::make_unique<Packet>(Packet{seq, 0.5 * seq});  // old one freed
}

int last_seq_then_shutdown() {
    int seq = latest ? latest->seq : -1;   // read first
    latest.reset();                        // then free; latest is now empty
    return seq;
}

int main() {
    receive(1);
    receive(2);
    std::printf("last seq = %d\n", last_seq_then_shutdown());
    std::printf("latest is %s\n", latest ? "set" : "empty");
}
```

```text
last seq = 2
latest is empty
```

## Bug 2: an off-by-one overrun

```cpp
#include <cstdio>
#include <vector>

double mean(const std::vector<double>& v) {
    double sum = 0;
    for (size_t i = 0; i <= v.size(); ++i)   // <= walks one past the end
        sum += v[i];
    return sum / v.size();
}

int main() {
    std::vector<double> temps = {20.5, 21.0, 21.5, 22.0};
    std::printf("mean = %.3f\n", mean(temps));
}
```

Built normally, it printed `mean = 21.250` — the right answer. The loop read one element past the end, that memory happened to hold zero, and adding zero changed nothing. The bug is real and invisible. ASan finds it:

```text
==4230==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x503000000060 ...
READ of size 8 at 0x503000000060 thread T0
    #0 0x560fb9723492 in mean(std::vector<double, std::allocator<double> > const&) l03_overrun_bug.cpp:7
    #1 0x560fb9723772 in main l03_overrun_bug.cpp:13
    ...
0x503000000060 is located 0 bytes after 32-byte region [0x503000000040,0x503000000060)
allocated by thread T0 here:
    ...
    #6 0x560fb972372b in main l03_overrun_bug.cpp:12
```

::: example Reading the overflow report's numbers
The vector holds $4$ doubles of $8$ bytes each, so its buffer is

$$
4 \times 8 = 32 \text{ bytes},
$$

which is the "32-byte region" in the report. The last valid index is $3$, at byte offset $3 \times 8 = 24$. The loop's final step reads index $4$, at byte offset

$$
4 \times 8 = 32,
$$

which is exactly where the buffer ends. That is why the report says "0 bytes after" the region, and why the read has size $8$: one whole `double`.

Check with the addresses: the region runs from `0x503000000040` to `0x503000000060`, and `0x60 - 0x40` is $96 - 64 = 32$ in decimal. The bad read is at `0x...060`, the first byte past the end. Everything agrees.
:::

The `<=` should be `<`. Better still, remove the index, so there is no boundary to get wrong:

```cpp
#include <cstdio>
#include <vector>

double mean(const std::vector<double>& v) {
    if (v.empty()) return 0.0;
    double sum = 0;
    for (double x : v)          // no index, so no off-by-one to make
        sum += x;
    return sum / v.size();
}

int main() {
    std::vector<double> temps = {20.5, 21.0, 21.5, 22.0};
    std::printf("mean = %.3f\n", mean(temps));
}
```

```text
mean = 21.250
```

::: warning A correct answer is not a passing test
The buggy version printed the right mean. A test that only checks the output would have passed it. This is why flight software teams run their tests under sanitizers too: the sanitizer checks *how* the answer was reached, not only what it was.
:::

## Bug 3: a leak on an early return

```cpp
#include <cstdio>

double* make_buffer(int n) { return new double[n]; }

double process(int n) {
    double* buf = make_buffer(n);
    for (int i = 0; i < n; ++i) buf[i] = i * 0.1;
    double last = buf[n - 1];
    if (last > 5.0) return last;   // early return: nobody frees buf
    delete[] buf;
    return last;
}

int main() {
    double total = 0;
    for (int k = 0; k < 3; ++k) total += process(100);
    std::printf("total = %.1f\n", total);
}
```

It printed `total = 29.7` and exited normally. A **leak** — memory borrowed and never given back — does not crash anything. It only grows, until a long-running program runs out. With ASan, a leak check runs when the program exits:

```text
==4215==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 2400 byte(s) in 3 object(s) allocated from:
    #0 0x7fef006fe6c8 in operator new[](unsigned long) ...
    #1 0x556181810323 in make_buffer(int) l03_leak_bug.cpp:3
    #2 0x55618181033f in process(int) l03_leak_bug.cpp:6
    #3 0x55618181052f in main l03_leak_bug.cpp:16
    ...
SUMMARY: AddressSanitizer: 2400 byte(s) leaked in 3 allocation(s).
```

valgrind, run on the ordinary `-g` build with `valgrind --leak-check=full`, agrees:

```text
==4360== 2,400 bytes in 3 blocks are definitely lost in loss record 1 of 1
==4360==    at 0x48485C3: operator new[](unsigned long) ...
==4360==    by 0x1091DE: make_buffer(int) (l03_leak_bug.cpp:3)
==4360==    by 0x1091F9: process(int) (l03_leak_bug.cpp:6)
==4360==    by 0x1092B4: main (l03_leak_bug.cpp:16)
```

::: example Where 2400 bytes came from
Each call to `process(100)` allocates $100$ doubles:

$$
100 \times 8 = 800 \text{ bytes}.
$$

The last value is $99 \times 0.1 = 9.9$, which is more than $5$, so every call takes the early return and never reaches `delete[]`. `main` calls it $3$ times:

$$
3 \times 800 = 2400 \text{ bytes in } 3 \text{ blocks}.
$$

That matches both reports exactly. And the printed total checks out too: $3 \times 9.9 = 29.7$.

So the report's numbers are a clue in themselves. "3 objects" means "once per call", which points straight at `process`.
:::

The fix is RAII from last lesson: a `std::vector` frees its memory on every way out of the function.

```cpp
#include <cstdio>
#include <vector>

double process(int n) {
    std::vector<double> buf(n);    // RAII: freed on every path out
    for (int i = 0; i < n; ++i) buf[i] = i * 0.1;
    return buf[n - 1];             // any return, early or late, is safe
}

int main() {
    double total = 0;
    for (int k = 0; k < 3; ++k) total += process(100);
    std::printf("total = %.1f\n", total);
}
```

```text
total = 29.7
```

## Bug 4: the missing virtual destructor

```cpp
#include <cstdio>
#include <vector>

struct Filter {
    ~Filter() {}                           // not virtual
    virtual double step(double x) = 0;
};

struct MovingAverage : Filter {
    std::vector<double> window = std::vector<double>(8, 0.0);
    double step(double x) override { window[0] = x; return x; }
};

int main() {
    Filter* f = new MovingAverage;
    std::printf("out = %.1f\n", f->step(3.0));
    delete f;                               // ~MovingAverage never runs
}
```

This one is caught before the program even runs. `-Wall` printed:

```text
l03_vdtor_bug.cpp:17:5: warning: deleting object of abstract class type 'Filter' which has non-virtual destructor will cause undefined behavior [-Wdelete-non-virtual-dtor]
   17 |     delete f;                               // ~MovingAverage never runs
      |     ^~~~~~~~
```

This is step 2 of the method in action: read the warnings. If you ignored it, ASan stops the program at the `delete`:

```text
==4258==ERROR: AddressSanitizer: new-delete-type-mismatch on 0x503000000040 in thread T0:
  object passed to delete has wrong type:
  size of the allocated type:   32 bytes;
  size of the deallocated type: 8 bytes.
    #0 0x7f2652eff5e8 in operator delete(void*, unsigned long) ...
    #1 0x55c8b82476dd in main l03_vdtor_bug.cpp:17
```

::: example Why 32 bytes and 8 bytes
A `Filter` object holds only the hidden vptr, $8$ bytes. A `MovingAverage` holds the vptr plus a `std::vector`, and a vector object itself is three pointers — start, end, and end of capacity — on this 64-bit build:

$$
8 + 3 \times 8 = 32 \text{ bytes}.
$$

`new MovingAverage` allocated $32$ bytes. `delete f`, with a non-virtual destructor, treated the object as a plain `Filter` of $8$ bytes. The mismatch, $32$ against $8$, is exactly the derived part the program forgot about — including the vector, whose own $64$-byte buffer ($8$ doubles) is never freed.
:::

The fix is one word, `virtual`, plus a `unique_ptr` so no one writes `delete`:

```cpp
#include <cstdio>
#include <memory>
#include <vector>

struct Filter {
    virtual ~Filter() = default;           // the one-word fix
    virtual double step(double x) = 0;
};

struct MovingAverage : Filter {
    std::vector<double> window = std::vector<double>(8, 0.0);
    double step(double x) override { window[0] = x; return x; }
};

int main() {
    std::unique_ptr<Filter> f = std::make_unique<MovingAverage>();
    std::printf("out = %.1f\n", f->step(3.0));
}
```

```text
out = 3.0
```

## Bug 5: iterator invalidation

A **[[vector grows|vector-growth]]** by allocating a bigger buffer, moving its elements across, and freeing the old one. Any iterator, pointer or reference into the old buffer now dangles. That is **iterator invalidation**.

```cpp
#include <cstdio>
#include <vector>

int main() {
    std::vector<int> faults = {3, 7};
    faults.shrink_to_fit();                  // capacity is exactly 2
    for (int code : faults) {
        if (code == 3) faults.push_back(99); // grows: the loop's iterator dangles
        std::printf("fault %d\n", code);
    }
}
```

Built normally it printed `fault 3` then `fault 5` — a code that was never in the list. With ASan:

```text
==4201==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000014 ...
READ of size 4 at 0x502000000014 thread T0
    #0 0x5624a44657dc in main l03_iter_bug.cpp:7
    ...
0x502000000014 is located 4 bytes inside of 8-byte region [0x502000000010,0x502000000018)
freed by thread T0 here:
    ...
    #4 0x5624a4468ad9 in void std::vector<int, std::allocator<int> >::_M_realloc_insert<int>(...) /usr/include/c++/13/bits/vector.tcc:519
    ...
    #7 0x5624a446587d in main l03_iter_bug.cpp:8
```

The freed region is 8 bytes: two `int`s, the old buffer. The bad read is 4 bytes inside it — the second element, which the loop was about to visit. And the frame name `_M_realloc_insert` says it plainly: the free happened because `push_back` had to reallocate. Library frames look scary, but you only need to find the first line that is *your* file.

The fix: never grow a container while looping over it. Collect the additions, then append after the loop.

```cpp
#include <cstdio>
#include <vector>

int main() {
    std::vector<int> faults = {3, 7};
    std::vector<int> follow_ups;             // collect, then append after
    for (int code : faults) {
        if (code == 3) follow_ups.push_back(99);
        std::printf("fault %d\n", code);
    }
    faults.insert(faults.end(), follow_ups.begin(), follow_ups.end());
    std::printf("now %zu faults\n", faults.size());
}
```

```text
fault 3
fault 7
now 3 faults
```

## A plain crash, and gdb

Sometimes you get no sanitizer build, only a crash. This program looks up a channel by id:

```cpp
#include <cstdio>
#include <map>
#include <string>

struct Channel { std::string name; double scale; };

std::map<int, Channel*> channels;

double scaled(int id, double raw) {
    Channel* c = channels[id];     // missing id: inserts and returns nullptr
    return raw * c->scale;
}

int main() {
    static Channel gyro{"gyro_x", 0.01};
    channels[4] = &gyro;
    std::printf("%.2f\n", scaled(4, 250.0));
    std::printf("%.2f\n", scaled(5, 250.0));
}
```

Built with `-g` and run, it died with `Segmentation fault` — the operating system stopping a program that touched memory it may not use. In gdb, `run` and then `bt`:

```text
Program received signal SIGSEGV, Segmentation fault.
0x00005555555564fe in scaled (id=5, raw=250) at l03_segv_bug.cpp:11
11      return raw * c->scale;
#0  0x00005555555564fe in scaled (id=5, raw=250) at l03_segv_bug.cpp:11
#1  0x0000555555556634 in main () at l03_segv_bug.cpp:18
```

The backtrace gives the line and the arguments: `id=5`. Hypothesis: channel 5 does not exist, so `c` is null. The cause is a well-known trap: `channels[id]` on a `std::map` *inserts* a default value — here a null pointer — when the key is missing. Use `find`, which never inserts, and handle the missing case:

```cpp
#include <cstdio>
#include <map>
#include <string>

struct Channel { std::string name; double scale; };

std::map<int, Channel*> channels;

bool scaled(int id, double raw, double& out) {
    auto it = channels.find(id);   // find never inserts
    if (it == channels.end() || it->second == nullptr) return false;
    out = raw * it->second->scale;
    return true;
}

int main() {
    static Channel gyro{"gyro_x", 0.01};
    channels[4] = &gyro;
    for (int id : {4, 5}) {
        double v = 0;
        if (scaled(id, 250.0, v)) std::printf("channel %d: %.2f\n", id, v);
        else                      std::printf("channel %d: unknown\n", id);
    }
}
```

```text
channel 4: 2.50
channel 5: unknown
```

::: warning Print statements can lie at a crash
When the buggy program's output went to a pipe instead of a terminal, the first line, `2.50`, never appeared at all — even though that line ran before the crash. Output to a pipe or file is **[[buffered|output-buffering]]**, held in memory to be written later, and the crash threw the buffer away. So "my print did not appear, so the crash must be earlier" can be wrong. The backtrace does not have this problem.
:::

## Check yourself

::: check
List the five steps of the method, and say which step the `-Wall` warning in bug 4 belongs to.
:::

::: answer
Reproduce with the smallest input; read the whole error, first error first; bisect; form one hypothesis with a prediction and test it; use the tools (`-g`, sanitizers, valgrind, gdb). The warning belongs to step 2, reading the error: the compiler told you the exact line and the reason before the program ever ran.
:::

::: check
An ASan report says "READ of size 8 ... located 0 bytes after 80-byte region". The buffer holds doubles. How many elements does it have, and which index did the code read?
:::

::: answer
A double is 8 bytes, so $80 / 8 = 10$ elements, indices $0$ to $9$. "0 bytes after" the region means the read started at byte offset $80$, which is index $80 / 8 = 10$ — one past the last valid index. It is an off-by-one, most likely a `<=` where `<` was meant.
:::

::: check
A leak report says "1600 byte(s) in 4 object(s)". Each leaked object is an array of `float` (4 bytes each). What size was each array, and what is a good first hypothesis?
:::

::: answer
Each object is $1600 / 4 = 400$ bytes, which is $400 / 4 = 100$ floats. Four objects of the same size suggests the same allocation site ran four times without its matching `delete[]` — for example, a function with an early return called four times. Look at the frames under `operator new[]` for the function, and check every way out of it.
:::

::: check
Why did the buggy iterator program print `fault 5` when 5 was never in the vector, and why did the plain build not crash?
:::

::: answer
`push_back` reallocated, freeing the old two-element buffer, but the loop's iterator still pointed into it. The next read came from freed memory, whose contents may already have been overwritten — allocators commonly keep their own bookkeeping inside freed blocks — so the value was junk. Freed heap memory usually still belongs to the process, so reading it does not trigger a segmentation fault — which is exactly why ASan, which marks freed memory as poisoned, is needed to catch it.
:::

::: check
A crash happens only in the full 2,000-case test run, somewhere in the input file. What is your first move, before opening any tool?
:::

::: answer
Reproduce with the smallest input, using bisection on the input: run the first 1,000 cases, then whichever half still crashes, and so on. About $\log_2 2000 \approx 11$ halvings get you to a single case. Then build that case with `-g -fsanitize=address,undefined` and read the report.
:::

## Summary

| Tool or idea | What it gives you |
| --- | --- |
| Method | reproduce, read the error, bisect, one hypothesis at a time, tools |
| `-g` | file names and line numbers in every report |
| `-fsanitize=address,undefined` | stops at the first bad memory access or undefined operation, with its history |
| LeakSanitizer and valgrind | leaked bytes, block count, and the allocation site |
| gdb `bt` | the chain of calls to the crash, with arguments |
| Use after free | fix with ownership: `unique_ptr`, which empties itself |
| Off by one | fix with a range-for; no index, no boundary |
| Leak on early return | fix with RAII: `std::vector` |
| Missing virtual destructor | `-Wall` warns; ASan reports a size mismatch; add `virtual` |
| Iterator invalidation | never grow a container while looping over it |

Next lesson leaves single bugs behind and goes up to whole systems: how to design a GNC simulation infrastructure and a telemetry pipeline for six thousand satellites, out loud, in a design round.

::: context think-aloud Why narrating matters
In a live round the interviewer cannot see inside your head. If you sit in silence for five minutes and then point at the bug, they learn only that you found it. If you say "I will reproduce it first, then check the free on line 12", they see a method they would trust on a real flight bug at 2 a.m. A wrong hypothesis said aloud and then tested is fine. It is how engineers work.
:::

::: context bisect Halving finds a needle fast
Each test cuts the suspects in half, so the number of tests grows very slowly with the size of the search: 1,000 lines need about 10 halvings, a million need about 20.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="16" width="320" height="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="29" font-size="11" fill="#1f2a44" text-anchor="middle">1000 lines</text>
  <rect x="20" y="46" width="160" height="18" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="180" y="46" width="160" height="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="260" y="59" font-size="11" fill="#1f2a44" text-anchor="middle">500</text>
  <rect x="180" y="76" width="80" height="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="260" y="76" width="80" height="18" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <text x="220" y="89" font-size="11" fill="#1f2a44" text-anchor="middle">250</text>
  <rect x="180" y="106" width="40" height="18" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="220" y="106" width="40" height="18" fill="#b4232c"/>
  <text x="290" y="119" font-size="11" fill="#b4232c">125, and so on</text>
</svg>
```

Git has this built in as `git bisect`, which halves the list of commits between "worked" and "broken".
:::

::: context debug-info What -g adds
The compiler turns your source into machine instructions and, normally, throws away the names and line numbers. With `-g` it keeps a table on the side: this instruction came from that line of that file, this memory slot is the variable `seq`. Sanitizers, valgrind and gdb all read that table to turn addresses like `0x55af8cc3c474` into `main l03_uaf_bug.cpp:18`. It makes the file bigger, not the program different.
:::

::: context backtrace Reading a backtrace
Every function call pushes a frame onto the stack; a backtrace lists them from the innermost out. Frame #0 is where the crash happened. Frame #1 called it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="16" width="200" height="30" rx="4" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="140" y="36" font-size="12" fill="#b4232c" text-anchor="middle">#0 scaled(id=5), line 11</text>
  <rect x="40" y="56" width="200" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="140" y="76" font-size="12" fill="#1f2a44" text-anchor="middle">#1 main(), line 18</text>
  <text x="140" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">library start-up frames below</text>
  <line x1="290" y1="80" x2="290" y2="28" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="290,20 284,32 296,32" fill="#1d6fd1"/>
  <text x="300" y="60" font-size="11" fill="#1d6fd1">calls</text>
</svg>
```

Read up from your own code until you reach the first frame in *your* file: that is where to look.
:::

::: context vector-growth Why a vector moves
A `std::vector` keeps its elements side by side in one heap block. When the block is full, there is no guarantee the memory right after it is free, so `push_back` allocates a bigger block (commonly one and a half to two times the size, depending on the library), moves the elements over and frees the old block. That is why growth is fast on average and why every pointer into the old block becomes stale at that moment. Calling `reserve` up front avoids the reallocation.
:::

::: context output-buffering Why output waits
Writing to the screen or a file one character at a time is slow, so the C library collects output in a buffer and writes it in chunks. To a terminal it flushes at every newline; to a pipe or a file it flushes only when the buffer fills or the program exits normally. A crash is not a normal exit, so whatever was waiting is lost. Printing to `stderr`, or calling `fflush(stdout)`, avoids it.
:::
