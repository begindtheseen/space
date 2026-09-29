---
id: l02-data-races
title: Data races
minutes: 26
covers:
  - Data races as undefined behavior, not merely a wrong answer
---

Two friends keep score at a basketball game on one small whiteboard. Each time their team scores, whoever saw it walks to the board, reads the number, works out one more in their head, wipes the board and writes the new number. One evening both see the same basket. Both read 41. Both write 42. The team scored twice, and the board says one.

That lost point is the picture most people have of two threads sharing a variable: sometimes the answer is a little wrong. It is true, and it is the least of the problem. In C++, two threads touching the same variable without coordination is a **data race**, and a data race is **undefined behavior**, like reading past the end of an array. The compiler may assume it never happens, and optimizes on that assumption — enough to make a control loop ignore its stop flag forever.

Last lesson every example read shared data only after a `join`. This lesson drops that care on purpose: a counter that loses counts, the same counter right for the wrong reason, a stop flag that `-O2` turns into an infinite loop, and **ThreadSanitizer**, the tool that finds them. It closes with the data race's cousin, the **race condition**, which no tool finds for you.

## What a data race is, exactly

Start with the words the standard uses.

A **[[memory location|memory-location]]** is one scalar object — an `int`, a `double`, a `bool`, a pointer — or a run of adjacent bit-fields. Two different members of a `struct` are two different memory locations, so two threads each writing their own member do not touch the same location.

Two accesses **conflict** when they touch the same memory location and at least one of them is a write. Two reads never conflict: any number of threads can read a value that nobody is changing.

The last ingredient is **happens-before**, an ordering the program guarantees between two actions, so that the first is complete and visible when the second runs. Inside one thread, each statement happens before the next. Across threads, only **[[synchronization|synchronisation]]** creates it, and you have already used two kinds:

- everything a thread does before constructing a `std::thread` happens before the new thread's function starts;
- everything a thread does happens before the `join()` that waits for it returns.

Unlocking a mutex and then locking it (next lesson) and pairs of atomic operations (lesson 06) are the other ways.

Put together:

::: key
A **data race**: two threads access the same memory location, at least one access is a write, and the accesses are not ordered by a synchronization relationship (neither happens before the other). It is undefined behavior, so the program has no defined meaning at all, regardless of what it appears to do.
:::

Read that last sentence twice. It does not say "the variable may have a wrong value". It says the whole program has no meaning. In practice the damage usually lands near the race, but the standard gives you no floor.

Three things are *not* data races:

- Two threads reading the same variable while nobody writes it.
- A write and a read separated by `join()`, as in every example of lesson 01.
- Accesses to a `std::atomic` variable, which threads may touch at the same time (lesson 06).

## A counter that loses count

Here is the scoreboard in C++. A ground-station tool counts telemetry frames with two threads, one per antenna, and both add to one global.

::: example Two threads, one counter
```cpp laptop
#include <cstdio>
#include <thread>

long g_frames = 0;                    // shared, unprotected

void count_frames(int n) {
    for (int i = 0; i < n; ++i) {
        ++g_frames;                   // read, add one, write back
    }
}

int main() {
    std::thread a(count_frames, 1'000'000);
    std::thread b(count_frames, 1'000'000);
    a.join();
    b.join();
    std::printf("frames = %ld (expected 2000000)\n", g_frames);
}
```

Each thread adds one a million times, so the total should be 2,000,000. Built with `g++ -std=c++20 -Wall -Wextra -O0` (no optimization) on a 4-core machine, five runs printed:

```text
frames = 1311019 (expected 2000000)
frames = 1032473 (expected 2000000)
frames = 1090376 (expected 2000000)
frames = 1035820 (expected 2000000)
frames = 1058542 (expected 2000000)
```

Between 688,981 and 967,527 counts vanished each run — 34 to 48 percent. And no two runs agreed.

Where did they go? At `-O0`, g++ compiles `++g_frames` into three machine instructions (comments added):

```text
	mov	rax, QWORD PTR g_frames[rip]    ; load g_frames into register rax
	add	rax, 1                          ; add one to the register
	mov	QWORD PTR g_frames[rip], rax    ; store the register back
```

`++` looks like one step and is three: a load, an add, a store. If thread `a` loads 41, and thread `b` loads 41 before `a` has stored, both store 42. That is the **[[lost update|lost-update]]**, the whiteboard exactly. Two threads running truly at the same time on two cores do this hundreds of thousands of times a second.

Sanity check: the totals are all between 1,000,000 and 2,000,000, which fits — each thread's own additions can be overwritten by the other's, but a thread never erases its own.
:::

Now build the same file with `-O2`, the setting you would ship. Five runs:

```text
frames = 2000000 (expected 2000000)
frames = 2000000 (expected 2000000)
frames = 2000000 (expected 2000000)
frames = 2000000 (expected 2000000)
frames = 2000000 (expected 2000000)
```

Perfect. Is the race gone? Look at what g++ made of `count_frames`:

```text
_Z12count_framesi:
	endbr64
	test	edi, edi
	jle	.L3
	mov	rdx, QWORD PTR g_frames[rip]
	lea	eax, -1[rdi]
	lea	rax, 1[rdx+rax]
	mov	QWORD PTR g_frames[rip], rax
.L3:
	ret
```

The loop is gone. The compiler loads `g_frames` once, adds `n` in one go (the two `lea` instructions compute `g_frames + (n - 1) + 1`), and stores once. It may do that because, in a program without data races, no other thread could be looking at `g_frames` in the middle of the loop, so the million intermediate values are invisible and need not exist.

Each thread now finishes its million in a few nanoseconds, long before the other has even started — creating a thread takes tens of microseconds, as you measured last lesson. The race is still there; the right answer is timing luck. Change the loop body or the timing, and the two load-add-store sequences can overlap and the answer halves.

::: warning The right answer proves nothing
A racy program that passes its tests has been shown to pass *on that compiler, at that optimization level, on that machine, with that timing* — nothing more. Change any one and the behavior may change. A race is a bug the moment it is written, not the moment it is noticed.
:::

## The optimizer assumes you did not race

The counter shows the rule the compiler works by. Stated plainly: **because a data race is undefined behavior, the compiler may assume that no other thread changes an ordinary variable between two synchronization points.** Within that stretch of code it can keep a copy of the variable in a **[[register|register]]**, read it once instead of a hundred times, and combine or delay writes.

Those are the optimizations that make single-threaded code fast. They are also exactly what breaks a thread that is waiting for another thread to change something.

::: example A stop flag that never stops
A control loop runs until another thread asks it to stop, through a plain `bool`:

```cpp laptop
#include <chrono>
#include <cstdio>
#include <thread>

bool g_stop = false;          // plain bool: this is the bug
long g_cycles = 0;

void control_loop() {
    while (!g_stop) {
        ++g_cycles;           // stand-in for one cycle of work
    }
    std::puts("control loop saw the stop flag");
}

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);   // print each line at once
    std::thread t(control_loop);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    g_stop = true;            // ask the loop to finish
    std::puts("stop requested");
    t.join();
    std::printf("cycles run: %ld\n", g_cycles);
}
```

At `-O0` it behaves. One run printed:

```text
control loop saw the stop flag
stop requested
cycles run: 40562520
```

(The first two lines came out in either order across runs; the two threads race to print.) About 40 million cycles in 100 ms is about 400 million per second, a believable speed for a loop this small.

At `-O2`, run under `timeout 3` so it could not run forever:

```text
stop requested
```

and then nothing, until `timeout` killed it after 3 seconds and reported exit status 124. `main` set the flag and sat in `t.join()` forever, because the loop never ended. Here is the compiled loop:

```text
_Z12control_loopv:
	endbr64
	cmp	BYTE PTR g_stop[rip], 0
	jne	.L5
.L6:
	jmp	.L6
.L5:
	lea	rdi, .LC0[rip]
	jmp	puts@PLT
```

Read it line by line. `cmp` reads `g_stop` **once**. If it is already true, jump to `.L5` and print. Otherwise fall into `.L6: jmp .L6` — "at label L6, jump to label L6" — an empty loop that never reads memory again. The compiler reasoned: nothing inside the loop changes `g_stop`, and no other thread may change it without synchronization, so its value cannot change, so read it once. The load was **hoisted** — lifted out of the loop.

And `++g_cycles` vanished completely. The loop never ends, so nothing after it can ever read `g_cycles`, so the increments had no visible effect and were removed.

Sanity check: `-O0` keeps every load, so it happened to work; `-O2` assumed no race and hung. Same source, two behaviors: undefined behavior you can watch.
:::

The fix is to give the flag real synchronization. Declare it `std::atomic<bool> g_stop{false};` (read "a std atomic of bool") and change nothing else: at `-O2` it printed all three lines and exited normally, because every read of an atomic must really happen. Lesson 06 explains why. Or use last lesson's tool: a `std::jthread` whose loop checks its `std::stop_token`, which is built on the same atomic machinery.

::: warning volatile is not the fix
Marking the flag `volatile` makes this loop re-read `g_stop`, and the program appears to work. It is still a data race: `volatile` gives no atomicity and no ordering of the *other* memory the threads share, as the memory module's volatile lesson showed. Use `std::atomic` or a mutex.
:::

Lost updates and hoisted loads are the common failures, not the only ones. A racing reader can see a **[[torn value|torn-read]]**, half old and half new. And the compiler and processor may reorder independent writes, so another core sees them in a different order from the code — lesson 07's subject.

## ThreadSanitizer finds races for you

**ThreadSanitizer**, **TSan** for short, is AddressSanitizer's sibling for data races. It watches every memory access and every synchronization operation, tracks which accesses are ordered by happens-before, and reports any conflicting pair that is not.

You build with:

```text
g++ -std=c++20 -g -O1 -fsanitize=thread frames.cpp -o frames
```

`-fsanitize=thread` turns it on; `-g` puts source line numbers in the report; `-O1` keeps the program fast enough to test with. TSan cannot be combined with AddressSanitizer in one build — g++ says `'-fsanitize=thread' is incompatible with '-fsanitize=address'` — so a project runs its tests once under each.

::: example Reading a ThreadSanitizer report
The counter from the first example, saved as `frames.cpp` and built as above, printed this (the frames numbered #1 to #6 in the two access stacks, the standard library's thread start-up code, are cut; build IDs are removed and one long name is shortened to `(...)`):

```text
==================
WARNING: ThreadSanitizer: data race (pid=8469)
  Write of size 8 at 0x55c74f650020 by thread T1:
    #0 count_frames(int) frames.cpp:7 (frames+0x1392)

  Previous read of size 8 at 0x55c74f650020 by thread T2:
    #0 count_frames(int) frames.cpp:7 (frames+0x1369)

  Location is global 'g_frames' of size 8 at 0x55c74f650020 (frames+0x4020)

  Thread T1 (tid=8472, running) created by main thread at:
    #0 pthread_create ../../../../src/libsanitizer/tsan/tsan_interceptors_posix.cpp:1022 (libtsan.so.2+0x5ac1a)
    #1 std::thread::_M_start_thread(...) <null> (libstdc++.so.6+0xeceb0)
    #2 main frames.cpp:13 (frames+0x13e1)

  Thread T2 (tid=8473, running) created by main thread at:
    #0 pthread_create ../../../../src/libsanitizer/tsan/tsan_interceptors_posix.cpp:1022 (libtsan.so.2+0x5ac1a)
    #1 std::thread::_M_start_thread(...) <null> (libstdc++.so.6+0xeceb0)
    #2 main frames.cpp:14 (frames+0x13ff)

SUMMARY: ThreadSanitizer: data race frames.cpp:7 in count_frames(int)
==================
frames = 1000000 (expected 2000000)
ThreadSanitizer: reported 1 warnings
```

1. **`WARNING: ThreadSanitizer: data race`** names the bug class. `pid` is the process ID.
2. **`Write of size 8 ... by thread T1`** is one side of the race: an 8-byte write (a `long`), at that address, from thread T1, in `count_frames` at line 7 of `frames.cpp`.
3. **`Previous read of size 8 ... by thread T2`** is the other side: a read of the same address, from a different thread, with no happens-before between them. One write plus one other access to one location, unordered: the definition, word for word.
4. **`Location is global 'g_frames'`** names the variable. For heap memory it would show where the block was allocated.
5. **`Thread T1 ... created by main thread at ... main frames.cpp:13`** says where each thread was born: T1 is thread `a` on line 13, T2 is thread `b` on line 14.
6. **`SUMMARY`** is the one line to put in a bug report.

Why line 7, the `for`, and not line 8? At `-O1` the increment was folded into the loop, so the line information points at the loop; at `-O0` the report says line 8. The total, exactly half, fits both threads reading `0` before either wrote.

The program exited with status 66, TSan's signal to a test script that it found something. Sanity check: TSan flagged exactly the variable we expected, in the right function, between the two threads we started.
:::

TSan does not need the race to *go wrong* in that run: it checks the ordering, not the result. The `-O0` counter, run under TSan, happened to print the correct 2,000,000, and TSan still reported the race. Two writes to one global from two threads 200 ms apart, with no synchronization, were flagged too. The stop-flag build hung under TSan, but only after reporting the write on line 19 and the read on line 9. And a report is never a guess from the source: it is a real unordered pair in the run.

The limits: TSan sees only the code the run executes, so a race on an untested error path stays hidden. And it is slow — the LLVM documentation gives a typical slowdown of 5 to 15 times and memory use of 5 to 10 times — so it runs the ground test suite, never the flight build.

::: key
ThreadSanitizer (`-fsanitize=thread`, with `-g` and `-O1`) reports pairs of conflicting accesses not ordered by happens-before, even when the run gave the right answer. It checks only the paths the test executes, costs roughly 5 to 15 times in speed, and cannot be combined with AddressSanitizer.
:::

When you build the module's lock-free ring buffer, TSan is the judge. A buffer can pass a million-item stress test while TSan reports a race — for instance, if the index saying "the data is ready" is stored without the ordering that makes the data write visible. The passing test is timing luck, like the right answer at `-O2`.

## Race versus race condition

The two names sound alike and mean different things.

A **data race** is the precise, standard-defined thing of this lesson: unordered conflicting accesses to one memory location. It is undefined behavior. TSan can find it.

A **race condition** is broader and is about your logic: the program is correct for some orderings of events between threads and wrong for others. It is [[a design bug|therac]]. The behavior is well defined, only not what you wanted, and no sanitizer can know what you wanted.

You can have either one without the other.

::: example A race condition with no data race
A spacecraft has a 100 W power budget. Two threads each want to switch on a load if the budget allows. Every access to the budget is protected by a mutex (next lesson's tool; for now, read `std::lock_guard<std::mutex> lock(m_);` as "nobody else may touch the budget until this function returns"):

```cpp laptop
#include <chrono>
#include <cstdio>
#include <mutex>
#include <thread>

class PowerBudget {
public:
    int available() {                       // each call is locked...
        std::lock_guard<std::mutex> lock(m_);
        return watts_;
    }
    void take(int w) {                      // ...and so is this one
        std::lock_guard<std::mutex> lock(m_);
        watts_ -= w;
    }
private:
    std::mutex m_;
    int watts_ = 100;
};

PowerBudget g_budget;

void switch_on(const char* name, int w) {
    if (g_budget.available() >= w) {        // check
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
        g_budget.take(w);                   // act
        std::printf("%s on (%d W)\n", name, w);
    }
}

int main() {
    std::thread a(switch_on, "heater", 80);
    std::thread b(switch_on, "radio", 60);
    a.join();
    b.join();
    std::printf("budget left: %d W\n", g_budget.available());
}
```

Every run printed:

```text
heater on (80 W)
radio on (60 W)
budget left: -40 W
```

(with the first two lines sometimes swapped). Built with `-fsanitize=thread`, it printed the same and TSan reported **nothing**: every access to `watts_` is inside a lock, so there is no data race.

Trace it. The heater thread checks: 100 is at least 80, yes. The radio thread checks: still 100, at least 60, yes. Both act: $100 - 80 - 60 = -40$. Each step was safe; the *pair* "check, then act" was not. The `sleep_for` widens the gap so it happens every time; without it, it would happen rarely, which is worse.

Sanity check: the loads add up to 140 W against a 100 W budget, so at most one should have come on. The fix is to make check-and-act one locked step — a `try_take` that checks and subtracts under a single lock — which the next lesson builds.
:::

The reverse also exists: a data race that seems harmless to the logic, such as two threads both writing `true` to the same "fault seen" flag. People call these **[[benign races|benign-race]]**. There is no such thing in C++: it is still undefined behavior, and the optimizer may still transform the code as if it could not happen. Make the flag atomic.

::: warning Locks make accesses safe, not algorithms
Protecting every variable with a lock removes data races. It does not remove race conditions. Whenever code reads shared state, decides something, and then acts on the decision, ask: "what if another thread changes it in between?" The whole decision must sit inside one lock, or be one atomic operation.
:::

## Check yourself

::: check
For each pair, say whether it is a data race. (a) Two threads both read the constant table `kGravityModel` that was filled before either thread started. (b) Thread 1 writes `state.x` while thread 2 writes `state.y`, two `double` members of one struct. (c) A worker thread writes `result`; `main` reads `result` after `worker.join()`. (d) Two threads each run `++hits;` on a global `int hits`.
:::

::: answer
(a) No: two reads never conflict, and the table was filled before the threads were constructed, so before both started. (b) No: different members are different memory locations. (Lesson 10 shows they can still be slow if they share a cache line — performance, not correctness.) (c) No: the worker's write happens before `join()` returns, so the read is ordered after it. (d) Yes: same location, both write, and nothing orders them. It is undefined behavior, whatever total it prints.
:::

::: check
A colleague says: "Our racy counter printed the right total in 10,000 test runs at `-O2`, so the race is harmless." Give two reasons the conclusion is wrong, using what the `-O2` build actually did.
:::

::: answer
First, the right total came from the compiler turning the loop into one load, one add and one store, finished before the second thread started; a change to the loop body or timing can make the two sequences overlap and lose counts. Second, a data race is undefined behavior: no number of passing runs proves anything about the next build, compiler or machine. TSan reports the race even on a run with the right total.
:::

::: check
In the stop-flag example, why did the `-O2` loop become `jmp .L6`, and why did `++g_cycles` disappear with it?
:::

::: answer
The compiler may assume no other thread writes `g_stop` without synchronization, and the loop body has none, so `g_stop` cannot change during the loop: read it once, and if it was false, jump to yourself forever. `++g_cycles` vanished because a loop that never exits leaves no later code to read `g_cycles`, so the increments had no observable effect. A `std::atomic<bool>` forces a real read every time and fixes both.
:::

::: check
A test with a TSan build passes with no report. A reviewer still finds a data race in the telemetry code. How is that possible?
:::

::: answer
TSan only examines accesses that actually happen in the run. If the racing code sits on a path the test never took — an error handler, a mode never entered — TSan never saw it. A clean report speaks for the executed paths only, so test coverage of the concurrent code matters as much as the sanitizer.
:::

::: check
A thread runs `if (!queue.empty()) item = queue.pop();` where `empty()` and `pop()` each lock the queue's mutex internally. A second consumer thread runs the same line. Is there a data race? Is there a race condition? What goes wrong?
:::

::: answer
There is no data race: each access to the queue is inside its lock, so all accesses are ordered, and TSan would stay silent. There is a race condition: both threads can see `empty()` return false when one item is left, then both call `pop()`, and the second pops from an empty queue. The check and the act must be one locked operation, such as a `try_pop` that checks and removes under a single lock and reports whether it got anything.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Memory location | one scalar object, or a run of adjacent bit-fields | different struct members are different locations |
| Conflict | two accesses to one location, at least one a write | two reads never conflict |
| Happens-before | an ordering the program guarantees | from program order and synchronization: thread start, `join`, mutexes, atomics |
| Data race | conflicting accesses in two threads, neither happening before the other | undefined behavior: the whole program has no meaning |
| Lost update | two load-add-store sequences overlap | lost 34 to 48 percent of counts at `-O0` |
| Hoisting | a load moved out of a loop | the `-O2` stop-flag loop read `g_stop` once and spun forever |
| Fix for flags | `std::atomic<bool>` or a `std::stop_token` | not `volatile` |
| ThreadSanitizer | `-fsanitize=thread -g -O1` | reports unordered pairs even when the answer was right; executed paths only |
| Race condition | correctness depends on timing | defined behavior, a logic bug; TSan cannot see it |

The fix for most data races, and the first fix for the check-then-act race condition, is the mutex. Next lesson: `std::mutex` and the family of lock types around it, what each one is for, and what locking really costs.

::: context memory-location The unit the rules are about
The standard's exact wording: a memory location is either an object of scalar type or a maximal sequence of adjacent bit-fields all having nonzero width. The bit-field part exists because a processor cannot write a single bit; to change one bit-field it reads, modifies and writes a whole word, and would clobber its neighbors:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="11" fill="#1f2a44">struct S { double x, y; unsigned a:4, b:4; };</text>
  <rect x="20" y="32" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="80" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">x: location 1</text>
  <rect x="140" y="32" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="200" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">y: location 2</text>
  <rect x="260" y="32" width="40" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="280" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <rect x="300" y="32" width="40" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="320" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="290" y="80" font-size="11" text-anchor="middle" fill="#b4232c">a and b: one location</text>
  <text x="20" y="104" font-size="11" fill="#1f2a44">threads writing x and y: no race</text>
  <text x="20" y="122" font-size="11" fill="#b4232c">threads writing a and b: a data race</text>
</svg>
```
:::

::: context synchronisation Synchronization, the only bridge between threads
Synchronization is any operation the standard defines as creating order between threads. The full list is short: starting and joining threads, locking and unlocking mutexes, operations on atomics with suitable memory orderings, and a few library facilities built on those, such as condition variables and futures (lessons 05 and 08). Everything else — ordinary reads and writes, `volatile`, sleeping for a while and hoping — creates no order at all. When you ask "can thread B see what thread A wrote?", the answer is always found by tracing a chain of these operations from A's write to B's read.
:::

::: context lost-update The whiteboard, instruction by instruction
Two threads, one counter holding 41, each running load, add, store. One unlucky interleaving:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="11" text-anchor="middle" fill="#1d6fd1">thread a</text>
  <text x="180" y="16" font-size="11" text-anchor="middle" fill="#1f2a44">g_frames</text>
  <text x="300" y="16" font-size="11" text-anchor="middle" fill="#b4232c">thread b</text>
  <text x="60" y="40" font-size="11" text-anchor="middle" fill="#1d6fd1">load 41</text>
  <text x="180" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">41</text>
  <text x="300" y="64" font-size="11" text-anchor="middle" fill="#b4232c">load 41</text>
  <text x="180" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">41</text>
  <text x="60" y="88" font-size="11" text-anchor="middle" fill="#1d6fd1">add: 42</text>
  <text x="300" y="112" font-size="11" text-anchor="middle" fill="#b4232c">add: 42</text>
  <text x="60" y="136" font-size="11" text-anchor="middle" fill="#1d6fd1">store 42</text>
  <text x="180" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">42</text>
  <text x="300" y="160" font-size="11" text-anchor="middle" fill="#b4232c">store 42</text>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#b4232c">42, not 43</text>
  <line x1="120" y1="24" x2="120" y2="166" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="240" y1="24" x2="240" y2="166" stroke="#6c7a93" stroke-dasharray="3 3"/>
</svg>
```

Time runs downward. Thread b's store overwrites thread a's, and one increment is gone.
:::

::: context register Where the compiler keeps a copy
A **register** is a tiny storage slot inside the processor core itself; an x86-64 core has 16 general-purpose ones, named `rax`, `rdx` and so on. Arithmetic happens in registers, and reading one is far faster than reading memory. So compilers work hard to load a variable into a register once, work on it there, and write it back as late as they can. In a single thread nobody can tell. A second thread looking at the memory copy sees a stale value, which is why the compiler must be told, through synchronization, where the copies have to be brought up to date.
:::

::: context torn-read Half an old value, half a new one
A `double` is 8 bytes. A 32-bit processor often moves it as two 4-byte halves, in two separate instructions. If a reader's two loads fall between the writer's two stores, the reader gets the top half of one number and the bottom half of another, a value nobody wrote. For an altitude, that could be off by an arbitrary amount rather than slightly stale. Many small flight processors are 32-bit, which is one reason flight code never shares a multi-word value between tasks without a lock or an atomic snapshot.
:::

::: context therac Race conditions in the real world
The best-known race condition in safety engineering is the Therac-25, a radiation-therapy machine that gave several patients massive overdoses between 1985 and 1987. Among its software faults was a race: if an operator edited the treatment settings quickly enough, the machine could act on a mix of old and new settings. Nancy Leveson's investigation of the accidents became standard reading for safety-critical software engineers, and its central lesson is the one here — code that is correct for every ordering you tested can still be wrong for an ordering you did not.
:::

::: context benign-race Why "harmless" races are not
Programmers once reasoned: "both threads write `true`, so whoever wins, the flag is `true`". The trouble is that the argument reasons about machine instructions, and the compiler does not promise which instructions it emits for racy code. It may keep the flag in a register, merge or drop stores, or, as the stop-flag loop showed, never look at memory again. Hans Boehm's paper "How to miscompile programs with 'benign' data races" (2011) collected real examples. The rule since C++11 is simple to apply: if two threads touch it and one writes, it is an atomic or it is protected.
:::
