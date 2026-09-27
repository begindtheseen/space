---
id: l03-stack-depth-and-no-recursion
title: Stack depth and why flight code does not recurse
minutes: 27
covers:
  - Stack-depth analysis and static stack bounding; no recursion
---

Picture the spring-loaded tray holder in a school cafeteria. Every time someone adds a tray, the pile gets taller; every time someone takes one, it gets shorter. The holder has a fixed height. Pile on more trays than it holds and they do not politely stop — they slide off onto the next counter, right into somebody else's lunch.

A program's **stack** works the same way. Each time a function is called, a block of memory called a **frame** is added to the top: the function's local variables, where to return to, and some saved registers. When the function returns, its frame is removed. Each task on a flight computer gets its own stack of a fixed size, often only a few kilobytes. If calls nest deeper than the stack can hold, the extra frames do not stop at the edge. They land on whatever memory is next — another task's stack, or the navigation state — and overwrite it without any error message.

You met the stack in the memory module: frames, `-fstack-usage`, and a recursive function running out of stack on a desktop. This lesson turns that into a flight-software discipline. You will add up the worst path through a whole **[[call graph|call-graph-picture]]** — the map of which function calls which — see the three things that break the sum — recursion, variable-length arrays, and calls the tools cannot see — and then check the answer on a running task by **painting** its stack.

## Why the worst case must be known

On a desktop, a stack overflow usually ends with a crash, because the operating system leaves an unmapped **[[guard page|guard-page]]** below the stack. Many flight microcontrollers have no such protection. There, an overflow is silent: the program keeps running with damaged data, and the symptom shows up later, somewhere unrelated — a sensor value that jumps, a command that goes to the wrong thruster.

So the stack size must be chosen to hold the deepest nesting the task can *ever* reach, and that depth must be known before flight. "The tests didn't overflow" is not enough, for the same reason a measured time is not a WCET: the tests only visit the paths they visit.

::: key
Stack overflow silently corrupts adjacent memory rather than raising an error, and with recursion or data-dependent depth the worst case cannot be bounded statically. Hence the ban on recursion and on variable-length arrays.
:::

## Step one: the size of each frame

A frame's size is a fact about the compiled code, not about the source. It depends on the processor, the compiler and the optimization level. So you ask the compiler. The flag `-fstack-usage` makes GCC write a `.su` file ("stack usage") beside each object file, with one line per function: where it is, its frame size in bytes, and a word saying what kind of size it is.

::: example Frame sizes for a small flight call graph
Here is a toy control step with three branches: estimation, command, and telemetry.

```cpp
#include <cstddef>
#include <cstdio>

// A small flight-style call graph:
//
//   control_step --> estimate --> predict_covariance
//                \-> command  --> saturate
//                \-> log_telemetry --> format_record
//
double state[6] = {1, 2, 3, 4, 5, 6};
double out_cmd = 0.0;
char   out_line[128];

double predict_covariance(const double* x) {
    double P[6][6];                               // 288 bytes of scratch
    for (int i = 0; i < 6; ++i)
        for (int j = 0; j < 6; ++j) P[i][j] = x[i] * x[j];
    double trace = 0.0;
    for (int i = 0; i < 6; ++i) trace += P[i][i];
    return trace;
}

double estimate(const double* x) {
    double xp[6];                                 // 48 bytes
    for (int i = 0; i < 6; ++i) xp[i] = x[i] * 0.99;
    return predict_covariance(xp);
}

double saturate(double u, double lim) {
    return u > lim ? lim : (u < -lim ? -lim : u);
}

double command(double t) {
    return saturate(-0.5 * t, 10.0);
}

int format_record(char* dst, std::size_t n, double a, double b) {
    char tmp[200];                                // 200 bytes of text scratch
    int len = std::snprintf(tmp, sizeof tmp, "trace=%.3f cmd=%.3f", a, b);
    std::snprintf(dst, n, "%s", tmp);
    return len;
}

int log_telemetry(double a, double b) {
    return format_record(out_line, sizeof out_line, a, b);
}

void control_step() {
    double t = estimate(state);
    out_cmd = command(t);
    log_telemetry(t, out_cmd);
}

int main() {
    control_step();
    std::printf("%s\n", out_line);
    return 0;
}
```

On the desktop it prints `trace=89.189 cmd=-10.000`. For flight we care about the target, so compile it with the **[[ARM cross-compiler|cross-compiler]]** for a Cortex-M4 microcontroller. `-fno-inline` keeps every function separate so each gets its own line:

```text
arm-none-eabi-g++ -std=c++20 -Wall -Wextra -O2 -fno-inline -mcpu=cortex-m4 -mthumb -fstack-usage -c stack_graph.cpp -o sg_arm.o
```

The file `sg_arm.su`:

```text
stack_graph.cpp:14:8:double predict_covariance(const double*)	336	static
stack_graph.cpp:23:8:double estimate(const double*)	72	static
stack_graph.cpp:29:8:double saturate(double, double)	24	static
stack_graph.cpp:33:8:double command(double)	8	static
stack_graph.cpp:37:5:int format_record(char*, std::size_t, double, double)	232	static
stack_graph.cpp:44:5:int log_telemetry(double, double)	24	static
stack_graph.cpp:48:6:void control_step()	16	static
stack_graph.cpp:54:5:int main()	8	static
```

**Step 1: compare with the source.** `predict_covariance` declares a $6 \times 6$ array of `double`: $36 \times 8 = 288$ bytes. Its frame is 336, which is 48 bytes more — saved registers, the return address and padding to keep the stack aligned. The frame is always at least the locals, usually a bit more.

**Step 2: the word "static".** It means the frame size is a constant fixed at compile time. That is what we need to add frames up.

**Sanity check.** The same file built for the desktop gives different numbers — `predict_covariance` is 320 bytes there, `format_record` 256. Different processor, different frames. Always measure with the flight compiler and the flight flags.
:::

## Step two: the worst path through the call graph

Knowing each frame is half the job. At any moment, the stack holds the frames of *every function on the current chain of calls*, from the task's entry point down to whatever is running now. So the stack use at a moment is the **sum of the frames along one path** in the call graph. The worst case is the path with the largest sum.

Written as a rule, for a function $f$:

$$
S(f) = s(f) + \max_{g \in \text{callees}(f)} S(g),
$$

read "S of f equals s of f plus the largest S among the functions f calls". Here $s(f)$ is $f$'s own frame from the `.su` file, and $S(f)$ is the deepest stack use starting at $f$. A function that calls nothing has $S(f) = s(f)$. You work from the bottom of the graph up.

::: example Adding up the worst path, and finding what is missing
Use the ARM numbers. Start at the leaves and work up.

**Branch 1, estimation.** `predict_covariance` calls nothing we wrote, so its depth is 336. Then `estimate`: $72 + 336 = 408$. From `control_step`: $16 + 408 = 424$ bytes.

**Branch 2, command.** `saturate`: 24. `command`: $8 + 24 = 32$. From `control_step`: $16 + 32 = 48$ bytes.

**Branch 3, telemetry.** `format_record` is 232 — but it calls `snprintf`, which lives in the C library, and the library was not compiled with `-fstack-usage`. There is no `.su` line for it. Stopping at what we can see: $16 + 24 + 232 = 272$ bytes.

On these numbers, branch 1 is the worst at 424 bytes. **That answer is wrong.**

**Step 2: look inside the library.** The linked program can be **[[disassembled|disassembly]]** — turned back into readable machine instructions — and each function's first few instructions show how much stack it reserves. For the newlib C library shipped with this toolchain:

```text
00009aa4 <snprintf>:
    9aa4:	b40c      	push	{r2, r3}
    9aa6:	b510      	push	{r4, lr}
    ...
    9aae:	b09c      	sub	sp, #112	@ 0x70

0000a480 <_svfprintf_r>:
    a480:	e92d 4ff0 	stmdb	sp!, {r4, r5, r6, r7, r8, r9, sl, fp, lr}
    a484:	b0c3      	sub	sp, #268	@ 0x10c

0000c19c <_dtoa_r>:
    c19c:	e92d 4ff0 	stmdb	sp!, {r4, r5, r6, r7, r8, r9, sl, fp, lr}
    ...
    c1a2:	b09b      	sub	sp, #108	@ 0x6c
```

Each 4-byte register pushed and each `sub sp` adds to the frame. `snprintf`: $8 + 8 + 112 = 128$ bytes. Its worker `_svfprintf_r`: 9 registers is $36$ bytes, plus $268$, so $304$. The number formatter `_dtoa_r`, which `%f` needs: $36 + 108 = 144$.

**Step 3: redo branch 3.** $16 + 24 + 232 + 128 + 304 + 144 = 848$ bytes — and `_dtoa_r` calls further helpers still, so the true figure is higher.

**Sanity check.** The telemetry branch is at least twice the estimation branch, and almost all of it is in one library call used to print two numbers. The analysis looked done at 424 bytes; it was off by a factor of two because one call was invisible. That is the most common way stack budgets go wrong, and it is why flight code often replaces `printf`-family calls with small formatting routines whose frames are known.
:::

You would not do this by hand for a real program. GCC can write the call graph together with the frame sizes using `-fcallgraph-info=su`, and dedicated stack-analysis tools read the compiled program, build the whole graph, and report the worst path. But every tool has the same blind spots, and they are worth knowing by name.

## What breaks the sum

**A cycle: recursion.** If `a` calls `b` and `b` calls `a`, the formula for $S(a)$ needs $S(b)$, which needs $S(a)$. There is no bottom to start from. The depth is whatever the data makes it — the depth of a tree, the length of a list — and nothing in the code says how large that can be. A stack-analysis tool reports such a graph as unbounded. This is why Power of Ten rule 1 bans recursion.

**A frame whose size is not a constant.** A **[[variable-length array|vla-history]]** (VLA) is a local array whose length is only known at run time, like `double window[n];`. Standard C++ does not allow it, but GCC accepts it as an extension, and it compiles silently at `-Wall -Wextra`. Its frame grows with `n`, so it has no fixed size. The C function `alloca`, which carves memory off the stack at run time, has the same problem.

**A call the tool cannot see.** A call through a function pointer, a virtual function or a callback can go to any of several functions. The tool must be told the possible targets, or it cannot finish the sum. Library code without `.su` data is the same kind of hole, as the telemetry branch showed.

**Interrupts.** An **[[interrupt|interrupt-frame]]** can arrive at the moment the task is at its deepest. On many microcontrollers the interrupt handler's frames land on the same stack; on others there is a separate interrupt stack. Either way the handler's own worst path must be added to *some* stack's budget — and if interrupts can interrupt each other (**nesting**), their paths add up too.

::: example Spotting a variable-length array
Two ways to average a window of samples:

```cpp
#include <cstddef>

double average_last(const double* samples, std::size_t n) {
    double window[n];                  // variable-length array: size known only at run time
    double sum = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        window[i] = samples[i];
        sum += window[i];
    }
    return n ? sum / static_cast<double>(n) : 0.0;
}

double average_fixed(const double* samples) {
    double window[32];                 // fixed size: the frame is a constant
    double sum = 0.0;
    for (std::size_t i = 0; i < 32; ++i) {
        window[i] = samples[i];
        sum += window[i];
    }
    return sum / 32.0;
}
```

`g++ -std=c++20 -Wall -Wextra -O2 -fstack-usage -c vla.cpp` prints no warning at all. The `.su` file tells the truth:

```text
vla.cpp:3:8:double average_last(const double*, std::size_t)	32	dynamic
vla.cpp:13:8:double average_fixed(const double*)	8	static
```

**Step 1.** The word `dynamic` means "32 bytes plus however much the run-time size needs". With `n = 1000000`, that is 8 MB — more than any flight task's whole stack.

**Step 2.** The fixed version is `static`. Its 8 bytes are smaller than the 256-byte array, because the optimizer noticed it only needs the running sum and kept everything in registers. Another reminder that frame sizes come from the compiled code.

**Step 3: make the compiler complain.** Adding `-Wvla` produces:

```text
vla.cpp: In function 'double average_last(const double*, std::size_t)':
vla.cpp:4:12: warning: variable length array 'window' is used [-Wvla]
    4 |     double window[n];                  // variable-length array: size known only at run time
      |            ^~~~~~
```

**Sanity check.** A build script can refuse any `.su` line that does not end in `static`. That single check catches VLAs and `alloca` everywhere in the code, including files nobody reviewed carefully.
:::

::: warning
Replacing recursion with a loop does not help if the loop pushes onto an array that grows without limit, or if the depth becomes a VLA. The fix for a naturally recursive job — walking a tree, searching a graph — is an explicit stack with a **fixed capacity**, and a defined result (a fault status) when the capacity is reached. Then the frame is a constant and the overflow case is a value you can test.
:::

## Step three: check it on the running system

A static bound says how deep the stack *can* go. You also want to know how deep it *does* go in practice, to catch mistakes in the analysis and to see how much margin is really there. Two cheap techniques do this on flight hardware.

**Stack painting.** Before a task starts, fill its whole stack with a known byte pattern, such as `0xA5` in every byte. Let the system run. Every byte a frame ever touched has been overwritten; untouched bytes still hold the pattern. Scan from the far end of the stack (the end the stack grows *toward*) and count how many pattern bytes are left. The stack size minus that count is the **high-water mark**: the deepest the stack has ever been. Many real-time operating systems offer this as a built-in feature.

**A canary.** Keep the last few bytes at the far end of the stack as a known pattern and check them regularly — for example, once per frame from a health monitor. If they have changed, the stack has overflowed at some point, and the software can declare a fault instead of carrying on with damaged memory. The name comes from **[[the canary in the coal mine|canary-name]]**.

::: example Painting a task's stack
This program gives a thread its own 64 KiB stack in a global array, paints it once, and then runs the thread in three modes of increasing depth. After each run it scans for the high-water mark and checks a 32-byte canary.

```cpp
#include <pthread.h>
#include <cstddef>
#include <cstdio>
#include <cstring>

// Give a task its own stack, paint every byte with a pattern, let the task
// run, then count how much of the pattern is still untouched.
constexpr std::size_t   kStackBytes  = 64 * 1024;
constexpr std::size_t   kCanaryBytes = 32;           // the lowest 32 bytes
constexpr unsigned char kPaint       = 0xA5;
alignas(64) unsigned char task_stack[kStackBytes];

volatile unsigned char sink = 0;

template <std::size_t Bytes>
__attribute__((noinline)) void work() {
    volatile unsigned char scratch[Bytes];           // fixed size, known at compile time
    scratch[0] = 1;
    scratch[Bytes - 1] = 2;
    sink = scratch[0] + scratch[Bytes - 1];
}

void* task_body(void* arg) {
    switch (*static_cast<int*>(arg)) {
        case 0:  work<256>();       break;           // cruise
        case 1:  work<4 * 1024>();  break;           // maneuver
        default: work<12 * 1024>(); break;           // rare: sensor re-calibration
    }
    return nullptr;
}

std::size_t high_water_bytes() {
    // The stack grows down from the top, so untouched paint sits at the bottom.
    std::size_t untouched = 0;
    while (untouched < kStackBytes && task_stack[untouched] == kPaint) ++untouched;
    return kStackBytes - untouched;
}

bool canary_intact() {
    for (std::size_t i = 0; i < kCanaryBytes; ++i)
        if (task_stack[i] != kPaint) return false;
    return true;
}

void run_task(int mode) {
    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setstack(&attr, task_stack, kStackBytes);
    pthread_t th;
    pthread_create(&th, &attr, task_body, &mode);
    pthread_join(th, nullptr);
    pthread_attr_destroy(&attr);
}

int main() {
    std::memset(task_stack, kPaint, kStackBytes);    // paint once, at start-up
    const int modes[] = {0, 1, 0, 1, 2, 0};
    for (int m : modes) {
        run_task(m);
        std::printf("after mode %d: high-water %5zu of %zu bytes, canary %s\n",
                    m, high_water_bytes(), kStackBytes,
                    canary_intact() ? "intact" : "DAMAGED");
    }
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 paint.cpp -o paint -pthread`; the output is the same on every run:

```text
after mode 0: high-water  6312 of 65536 bytes, canary intact
after mode 1: high-water  8544 of 65536 bytes, canary intact
after mode 0: high-water  8544 of 65536 bytes, canary intact
after mode 1: high-water  8544 of 65536 bytes, canary intact
after mode 2: high-water 16736 of 65536 bytes, canary intact
after mode 0: high-water 16736 of 65536 bytes, canary intact
```

**Step 1: the mark only rises.** Paint, once overwritten, stays overwritten. After the rare mode 2 ran once, the mark stayed at 16,736 bytes even when the task went back to cruise. That is exactly what you want from a flight measurement: it remembers the worst moment even if nobody was watching.

**Step 2: check the jump.** Mode 2's scratch is 12 KiB and mode 1's is 4 KiB. The mark rose by $16736 - 8544 = 8192$ bytes, which is exactly $12 \times 1024 - 4 \times 1024$. The scan agrees with the source.

**Step 3: the baseline.** Even the light mode 0 left a mark of 6,312 bytes, far more than its 256-byte scratch. The thread library keeps its own bookkeeping at the top of the stack it is given, and starting a thread runs library code with frames of its own. Painting counts all of it — which is its strength. It measures what really happened, including code you did not write.

**Sanity check.** The worst mark is $16736 / 65536 \approx 0.26$, about 26 percent of the stack, and the canary is intact. If mode 2 had never been triggered in this test, the mark would have said 13 percent. Painting has the same limit as timing measurements: it only knows the paths that ran. That is why it *checks* the static bound instead of replacing it.
:::

::: warning
Do not confuse a stack canary with GCC's `-fstack-protector` option. The option places a guard value inside *each function's frame* to catch a buffer overrun within that frame, and aborts the program when it is damaged. The canary in this lesson sits at the *end of the whole stack* to catch the stack growing too deep. Different problem, different fix; flight projects may use both.
:::

## Putting a stack budget together

A task's stack size is chosen from four numbers:

1. the static worst path of the task, including library calls;
2. the worst interrupt path that can land on the same stack, times the nesting depth;
3. a margin, written into the project's rules, for tool error and code growth;
4. a painted high-water mark from long tests, used to check that 1 and 2 are believable.

::: example Sizing a 2 KiB task stack
Suppose the telemetry task from the earlier example, with its known worst path of at least 848 bytes, goes through a stack-analysis tool that reads the library too. The tool reports 1,000 bytes after `_dtoa_r`'s helpers are added. The deepest interrupt handler needs 160 bytes, and interrupts can nest two levels. The task's stack is 2,048 bytes, and the project rule says worst case at most 75 percent.

**Step 1: interrupts.** $2 \times 160 = 320$ bytes.

**Step 2: total worst case.** $1000 + 320 = 1320$ bytes.

**Step 3: compare.** $1320 / 2048 \approx 0.645$, so about 64 percent. The rule allows $0.75 \times 2048 = 1536$ bytes. It fits, with $1536 - 1320 = 216$ bytes to spare under the rule.

**Step 4: check with painting.** A 48-hour test run shows a high-water mark of 1,090 bytes. That is below the static 1,320, as it must be. If painting had shown *more* than the static bound, the analysis would be wrong — a missed call, an unmodeled interrupt — and the budget could not be trusted until the gap was explained.

**Sanity check.** The static bound came out above the painted mark by 230 bytes. A static bound should always be at least the measurement; being somewhat above it is normal, because the test never hit every interrupt at the deepest point of the deepest path at once.
:::

## Check yourself

::: check
A task's call graph is: `run` (frame 40) calls `a` (frame 120) and `b` (frame 64); `a` calls `c` (frame 200); `b` calls `c` and `d` (frame 500). What is the worst-case stack use from `run`, and along which path?
:::

::: answer
Work from the bottom. $S(c) = 200$ and $S(d) = 500$. $S(a) = 120 + S(c) = 320$. $S(b) = 64 + \max(S(c), S(d)) = 64 + 500 = 564$. $S(\text{run}) = 40 + \max(320, 564) = 604$ bytes, along `run` → `b` → `d`. Notice that `a` has the bigger own frame than `b`, but the worst path goes through `b` because of what `b` calls. You must follow every path to the bottom, not just the fattest-looking frames.
:::

::: check
Now `d` is changed to call `run` again under a rare condition. What happens to the analysis, and what are two ways to fix the code?
:::

::: answer
The call graph now has a cycle, `run` → `b` → `d` → `run`, so the formula for $S(\text{run})$ depends on itself and has no answer; a tool will report the stack as unbounded. The depth now depends on how many times the rare condition happens in a row, which the code does not limit. Fix one: restructure so the work `d` wanted from `run` is done by returning a status and letting the caller act on it at the top level — no cycle at all. Fix two, if the repetition is truly needed: turn it into a loop with a constant maximum number of passes, as in the bounded loops lesson, so that each repeat reuses the same frames instead of stacking new ones.
:::

::: check
Your `.su` file has a line ending in `dynamic`. What does that mean, and name two things in the source that can cause it.
:::

::: answer
It means the function's frame size is not a compile-time constant: part of it is decided at run time, so the frame cannot be added into a static worst-path sum. Two common causes are a variable-length array (a local array whose length is a run-time value, such as `double buf[n];`, which GCC accepts as an extension) and a call to `alloca`. Compiling with `-Wvla` turns the first into a warning, and a build check that rejects any `.su` line not ending in `static` catches both.
:::

::: check
After a long test, the painted high-water mark of a task is 3,400 bytes, but the static analysis said the worst case is 3,100 bytes. What does this tell you?
:::

::: answer
The static bound must never be below what really happened, so the analysis is wrong somewhere. Something used stack that the analysis did not count. Typical suspects: a library function without stack data, a call through a function pointer or virtual function the tool resolved to the wrong targets, an interrupt handler (or nested interrupts) landing on this stack, or build flags that differ between the analyzed build and the tested build. Until the 300-byte gap is explained, the stack budget cannot be trusted.
:::

::: check
Why does stack painting report a high-water mark rather than the stack depth right now, and why is that the more useful number?
:::

::: answer
Painting detects bytes that were *ever* written. Once a frame overwrites the pattern, the pattern does not come back when the frame is popped, so the scan finds the deepest point the stack has reached since it was painted, not where it is at this moment. That is more useful because overflow is about the worst moment: the stack may be shallow 99.99 percent of the time and deep for a few microseconds during a rare event nobody was watching. The high-water mark still records it.
:::

## Summary

| Idea | Meaning | Fact to remember |
| --- | --- | --- |
| Frame | one call's locals, return address, saved registers | size comes from the compiled code: `-fstack-usage` writes `.su` |
| `static` / `dynamic` | frame size constant or decided at run time | reject any `dynamic` in flight code |
| Worst path | largest sum of frames along any call chain | $S(f) = s(f) + \max S(\text{callee})$ |
| Hidden callees | library code, function pointers, virtual calls | `snprintf` with `%f` took the path from 424 to over 848 bytes |
| Recursion | a cycle in the call graph | no bottom, so no bound; banned by rule 1 |
| VLA and `alloca` | run-time sized stack memory | GCC accepts VLAs silently; use `-Wvla` |
| Interrupts | handler frames on some stack | add worst handler path times nesting depth |
| Stack painting | fill with a pattern, scan for untouched bytes | gives the high-water mark; only rises |
| Stack canary | known bytes at the far end, checked regularly | a damaged canary means an overflow happened |
| Budget | static path + interrupts + margin, checked by painting | painted mark above the static bound means the analysis is wrong |

Stack is only one of the two places memory comes from. Next, in *Static memory: pools, arenas and fixed-capacity containers*, you will remove the other — the heap — from the running flight loop, and prove that nothing allocates once the vehicle is flying.

::: context call-graph-picture A map of who calls whom
Each box is a function; each arrow is "calls". The stack at any moment holds one chain of boxes from the top down. This is the graph from the lesson's example, with the ARM frame sizes in bytes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="180" y1="42" x2="65" y2="78"/><line x1="180" y1="42" x2="180" y2="78"/><line x1="180" y1="42" x2="295" y2="78"/>
    <line x1="65" y1="106" x2="65" y2="138"/><line x1="180" y1="106" x2="180" y2="138"/><line x1="295" y1="106" x2="295" y2="138"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="120" y="14" width="120" height="28" fill="#1d6fd1"/>
    <rect x="10" y="78" width="110" height="28" fill="#8fb8f0"/><rect x="125" y="78" width="110" height="28" fill="#ffffff"/><rect x="240" y="78" width="110" height="28" fill="#f2b880"/>
    <rect x="10" y="138" width="110" height="28" fill="#8fb8f0"/><rect x="125" y="138" width="110" height="28" fill="#ffffff"/><rect x="240" y="138" width="110" height="28" fill="#f2b880"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="180" y="32" fill="#ffffff">control_step 16</text>
    <text x="65" y="96">estimate 72</text><text x="180" y="96">command 8</text><text x="295" y="96">log_telemetry 24</text>
    <text x="65" y="156">predict_cov 336</text><text x="180" y="156">saturate 24</text><text x="295" y="156">format_record 232</text>
  </g>
  <text x="295" y="178" font-size="11" text-anchor="middle" fill="#b4232c">+ snprintf …</text>
</svg>
```

The orange chain looks smaller until the library frames hidden below `format_record` are added.
:::

::: context guard-page A tripwire below the stack
On a desktop, the operating system leaves one or more memory pages just past the end of each stack deliberately unmapped. Touching them causes a fault, and the program dies with a "segmentation fault" instead of quietly damaging memory. Some microcontrollers can get a similar effect from a **memory protection unit** (MPU), which can mark a small region at the stack's end as off-limits. Many simple flight processors have no such unit, or run without it configured.
:::

::: context cross-compiler Building on one machine for another
A **cross-compiler** runs on your desktop but produces machine code for a different processor. `arm-none-eabi-g++` makes code for ARM microcontrollers that run with no operating system ("none") and follow ARM's embedded calling rules ("eabi"). The Cortex-M4 is a common microcontroller core in small spacecraft and drones. Lesson 10 sets up a full cross-compiling build with CMake and a linker script.
:::

::: context disassembly Reading the machine's own words
A disassembler, such as `objdump -d`, turns the bytes of a compiled program back into processor instructions you can read. At the start of most functions sits a short **prologue**: `push` or `stmdb` saves registers onto the stack, and `sub sp, #N` moves the stack pointer down by $N$ more bytes to make room for locals. Adding those up gives the frame size of a function nobody compiled with `-fstack-usage`. It is tedious by hand, which is why stack-analysis tools do it automatically.
:::

::: context vla-history A C feature C++ never adopted
Variable-length arrays arrived in the C language with the C99 standard. C11 later made them optional, because they were hard to implement well and easy to misuse. Standard C++ never included them: in C++ an array's length must be a constant expression. GCC and Clang still accept them in C++ as an extension, which is why a strict flag like `-Wvla` or `-pedantic` is needed to notice one.
:::

::: context interrupt-frame An interrupt lands on top
When an interrupt arrives, its handler's frames go on top of whatever the task had on the stack at that instant. If that instant is the task's deepest point, the two add.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="20" width="120" height="170" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="120" y="150" width="120" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="120" y="115" width="120" height="35" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="120" y="80" width="120" height="35" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="120" y="55" width="120" height="25" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="174">control_step</text><text x="180" y="137">log_telemetry</text>
    <text x="180" y="102">format_record</text><text x="180" y="72">interrupt handler</text>
  </g>
  <line x1="120" y1="28" x2="240" y2="28" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="250" y="32" font-size="11" fill="#b4232c">stack limit</text>
  <text x="112" y="186" font-size="11" text-anchor="end" fill="#1f2a44">stack starts here</text>
  <text x="112" y="72" font-size="11" text-anchor="end" fill="#1f2a44">arrives at the</text>
  <text x="112" y="86" font-size="11" text-anchor="end" fill="#1f2a44">worst moment</text>
  <text x="250" y="120" font-size="11" fill="#1f2a44">task frames</text>
</svg>
```

Drawn upward here; in memory, most stacks grow toward lower addresses. The direction does not change the arithmetic.
:::

::: context canary-name Why it is called a canary
Coal miners once carried canaries underground. The small birds were more sensitive to poisonous gases than people, so a canary in trouble was an early warning to get out. A stack canary plays the same role: a small thing placed where damage shows first, checked so the system can react before the damage spreads. The same word is used for the guard values of `-fstack-protector` and for "canary releases" of new software to a few users first.
:::
