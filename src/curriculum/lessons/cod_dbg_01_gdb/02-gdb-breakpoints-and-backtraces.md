---
id: l02-gdb-breakpoints-and-backtraces
title: 'gdb: stopping a program and reading its stack'
minutes: 17
covers:
  - 'gdb: break, conditional breakpoints, watchpoints, run, bt, frame, up/down'
---

Think of a video of a soccer match. Watching it at full speed, you see a goal and a crowd going wild, but you cannot tell who made the mistake that let it in. So you pause. You scrub back three seconds. You pause again on the pass that split the defense. Being able to stop time, look around, and step back through what led here is what turns "we lost a goal" into "the left back was out of position".

A **debugger** does that for a running program. It can pause the program at a line you choose, show you every variable at that moment, and tell you the chain of function calls that led there. This lesson uses **[[gdb|gdb-name]]**, the GNU Debugger, the standard debugger on Linux for C and C++. This lesson covers the half of gdb that answers "where": where did it crash, how did it get there, and which line wrote the bad value. Lesson 03 covers the half that answers "what": looking at memory and variables in detail.

On a GNC team you meet gdb when a filter crashes in a simulation run, when a unit test segfaults in continuous integration, and, as lessons 05 and 06 show, when a flight computer leaves a crash file behind. The commands are the same everywhere, so learning them on a small program is learning them for real.

## The bug we will hunt

Here is a small four-state filter. Someone ported it from a MATLAB prototype, a common path in GNC teams. Read it once; do not hunt for the bug yet. Let the debugger find it.

```cpp
// nav.cpp: a tiny 4-state filter, ported from a MATLAB prototype.
#include <cstdio>

struct Imu {
    double gyro_bias;   // rad/s
    double accel_scale;
};

struct Filter {
    double x[4];        // state: altitude, velocity, gyro bias, accel scale
    Imu*   imu;         // the sensor this filter reads
    int    updates;
};

double read_gyro(const Imu* imu, double raw) {
    return raw - imu->gyro_bias;
}

void update(Filter& f, const double K[4], double residual) {
    // MATLAB indexes from 1, so the prototype said: for i = 1:4
    for (int i = 1; i <= 4; ++i) {
        f.x[i] += K[i - 1] * residual;
    }
    f.updates++;
}

double step(Filter& f, double raw_gyro, double residual) {
    const double K[4] = {0.5, 0.2, 0.01, 0.001};
    update(f, K, residual);
    return read_gyro(f.imu, raw_gyro);
}

int main() {
    Imu imu{0.002, 1.0};
    Filter f{{100.0, 0.0, 0.0, 1.0}, &imu, 0};
    double residuals[5] = {0.0, 0.0, 0.4, -0.2, 0.1};
    for (int k = 0; k < 5; ++k) {
        double rate = step(f, 0.010, residuals[k]);
        std::printf("k=%d  rate=%.4f  alt=%.3f\n", k, rate, f.x[0]);
    }
    return 0;
}
```

A few words for the GNC parts. The **state** `x` is the filter's best guess of four numbers. Each step, a **residual** (the difference between what a sensor measured and what the filter predicted) nudges each state by a **gain** `K[i]` times the residual. Then the filter reads the gyroscope and subtracts its bias. The details of the filter do not matter here; the memory does.

## Building for the debugger

gdb can only show you names and line numbers if the compiler leaves them in the program. Two flags matter.

- **`-g`** adds **[[debug information|debug-info]]**: tables that map each machine instruction back to a file and line, and each variable to where it lives in memory. It does not change what the code does.
- **`-O0`** turns optimization off, so each line of source becomes its own instructions and every variable stays in memory where gdb can find it. With `-O2`, the compiler reorders lines and keeps variables in registers, and gdb starts saying `<optimized out>`.

```text
$ g++ -g -O0 -Wall -Wextra -o nav nav.cpp
$ ./nav
k=0  rate=0.0080  alt=100.000
k=1  rate=0.0080  alt=100.000
Segmentation fault
$ echo $?
139
```

Two steps work, then the program dies with a **[[segmentation fault|segfault]]**: it touched memory it was not allowed to touch, and the operating system killed it. (Exactly how your shell words that line varies; the exit status 139 does not.)

## run and bt: where did it crash?

Start gdb with the program's name, then type `run`. The `(gdb)` at the start of a line is gdb's prompt; you type what comes after it.

```text
$ gdb -q ./nav
(gdb) run
k=0  rate=0.0080  alt=100.000
k=1  rate=0.0080  alt=100.000

Program received signal SIGSEGV, Segmentation fault.
0x000055555555517e in read_gyro (imu=0x3f3a36e2eb1c432d, raw=0.01) at nav.cpp:16
16	    return raw - imu->gyro_bias;
```

(`-q` means quiet: skip the welcome banner. If your program needs arguments or input, pass them to `run` as you would in the shell: `run < flight.log` or `run --rate 50`.)

The program did not die this time. gdb caught the fault and froze it at the exact instruction, with everything still in memory. It tells you the function (`read_gyro`), its arguments, the file and line (`nav.cpp:16`), and prints that line.

Now ask how the program got there. **`bt`**, short for **backtrace**, prints the **call stack**: the chain of function calls that are still in progress.

```text
(gdb) bt
#0  0x000055555555517e in read_gyro (imu=0x3f3a36e2eb1c432d, raw=0.01) at nav.cpp:16
#1  0x000055555555529a in step (f=..., raw_gyro=0.01, residual=0.40000000000000002) at nav.cpp:30
#2  0x0000555555555389 in main () at nav.cpp:38
```

Read it from the bottom up, like a story. `main` at line 38 called `step`. `step` at line 30 called `read_gyro`. `read_gyro` crashed at line 16. Each line is one **[[stack frame|stack-frames]]**: the block of stack memory that holds one function call's arguments and local variables. Frame `#0` is always the innermost one, where the program stopped. The hex number after the frame number is an address in the code: for frame 0 it is where the program stopped, and for the others it is the **[[return address|return-address]]**, the spot the caller will continue from.

Line 16 dereferences `imu`, and the argument list says `imu=0x3f3a36e2eb1c432d`. That is not a sensible pointer. Stack and heap addresses on 64-bit Linux look like `0x7fff...` or `0x5555...`; this one points nowhere. So the crash is not really `read_gyro`'s fault: it was handed a garbage pointer. The failure is here; the defect is somewhere else.

::: warning The top frame is where it died, not what killed it
Beginners fix frame 0: they add `if (imu == nullptr) return 0;` to `read_gyro` and move on. But `imu` is not null, it is garbage, and the check would not even catch it. A crash in a small, correct function almost always means it was given bad data. Walk down the stack to find who supplied it, and then ask who corrupted it.
:::

## frame, up and down: stepping through the stack

When gdb stops, commands like `print` look at variables in the **selected frame**, which starts as frame 0. To look at another call's variables, select its frame.

- **`frame N`** selects frame number `N` (read it as "frame N").
- **`up`** moves one frame toward `main` (outward, toward the caller).
- **`down`** moves one frame back toward frame 0 (inward).

::: example Following the bad pointer down the stack
Select frame 1, the `step` call that passed the pointer, and print the filter:

```text
(gdb) frame 1
#1  0x000055555555529a in step (f=..., raw_gyro=0.01, residual=0.40000000000000002) at nav.cpp:30
30	    return read_gyro(f.imu, raw_gyro);
(gdb) print f
$1 = (Filter &) @0x7fffffffc980: {x = {100, 0.20000000000000001, 0.080000000000000016, 1.004}, imu = 0x3f3a36e2eb1c432d, updates = 3}
(gdb) print f.imu
$2 = (Imu *) 0x3f3a36e2eb1c432d
```

The filter's `imu` field itself holds the garbage. Now go up once more to `main` and compare with where the `Imu` really lives:

```text
(gdb) up
#2  0x0000555555555389 in main () at nav.cpp:38
38	        double rate = step(f, 0.010, residuals[k]);
(gdb) print k
$3 = 2
(gdb) print imu
$4 = {gyro_bias = 0.002, accel_scale = 1}
(gdb) print &imu
$5 = (Imu *) 0x7fffffffc940
```

The sensor object itself is fine, and it lives at `0x7fffffffc940`, but `f.imu` holds `0x3f3a36e2eb1c432d`. Something overwrote the pointer. And it happened on step `k = 2`, the first step whose residual was not zero.

Now read the state printed in frame 1 as evidence. The residual was 0.4. The gains are 0.5, 0.2, 0.01 and 0.001. If `x[0]` had been updated, it would read $100 + 0.5 \times 0.4 = 100.2$, but it is still 100. Instead:

- `x[1]` $= 0 + 0.5 \times 0.4 = 0.2$: it got the gain meant for `x[0]`.
- `x[2]` $= 0 + 0.2 \times 0.4 = 0.08$: the gain meant for `x[1]`.
- `x[3]` $= 1 + 0.01 \times 0.4 = 1.004$: the gain meant for `x[2]`.

Every state got its neighbor's update, shifted by one. The fourth gain, $0.001 \times 0.4 = 0.0004$, went into a fifth slot, and there is no fifth slot. Right after `x[3]` in the [[layout of the Filter struct|struct-layout]] comes `imu`.

Sanity check: in lesson 03 you will look at those 8 bytes directly and see that `0x3f3a36e2eb1c432d` is exactly how the number 0.0004 is stored as a `double`. The pointer was overwritten by a filter state.
:::

The `$1`, `$2`, … labels are gdb's **value history**: every printed result is saved, and you can reuse it later (`print $1.x[0]`).

::: key
**gdb: bt, frame N, info locals.** `bt` prints the call stack; `frame N` selects a stack frame so that `print` and `info` operate in its scope; `info locals` dumps that frame's local variables. This trio answers most crash questions.
:::

To learn the value of the pointer that a crashing line dereferenced, you select the frame it lives in and print it there. `info locals` and its partners get a full treatment in lesson 03.

## Breakpoints: stopping where you choose

A crash stops the program for you. Most bugs do not crash; they give a wrong number. For those, you tell gdb where to stop. A **breakpoint** is a marker on a line of code: when the program reaches it, gdb pauses the program before that line runs.

- **`break read_gyro`** stops at the start of a function.
- **`break nav.cpp:22`** stops at a file and line.
- **`info breakpoints`** lists them, with their numbers.
- **`continue`** (short `c`) runs on until the next stop.
- **`delete 1`** removes breakpoint 1; **`disable 1`** switches it off but keeps it.

```text
(gdb) break update
Breakpoint 1 at 0x11a2: file nav.cpp, line 21.
(gdb) break read_gyro
Breakpoint 2 at 0x117a: file nav.cpp, line 16.
(gdb) run
Breakpoint 1, update (f=..., K=0x7fffffffc8f0, residual=0) at nav.cpp:21
21	    for (int i = 1; i <= 4; ++i) {
(gdb) continue
Breakpoint 2, read_gyro (imu=0x7fffffffc940, raw=0.01) at nav.cpp:16
16	    return raw - imu->gyro_bias;
```

At this stop, on the first step, `imu=0x7fffffffc940`: healthy. You can type `bt` at any breakpoint, not only after a crash, to see how the program reached it.

A plain breakpoint in a loop is tiresome, though. The update loop runs four times per step and five steps per run. If the bug only happens on one pass out of twenty, you do not want to type `continue` nineteen times.

## Conditional breakpoints

A **conditional breakpoint** stops only when a C++ expression is true at that line. You add `if` and the condition:

```text
(gdb) break nav.cpp:22 if i == 4
```

gdb checks `i == 4` each time line 22 is reached, and quietly continues when it is false. The condition can use any variable visible at that line: `if residual != 0`, `if k > 100 && f.x[0] < 0`, `if ptr == 0`.

::: example Catching the out-of-range pass
The loop is meant to touch `x[0]` to `x[3]`. So ask gdb to stop if it ever reaches line 22 with `i == 4`:

```text
(gdb) break nav.cpp:22 if i == 4
Breakpoint 1 at 0x11ab: file nav.cpp, line 22.
(gdb) info breakpoints
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x00000000000011ab in update(Filter&, double const*, double) at nav.cpp:22
	stop only if i == 4
(gdb) run
Breakpoint 1, update (f=..., K=0x7fffffffc8f0, residual=0) at nav.cpp:22
22	        f.x[i] += K[i - 1] * residual;
(gdb) print i
$1 = 4
(gdb) print f.x[i]
$2 = 6.9533558071425219e-310
(gdb) print &f.x[i]
$3 = (double *) 0x7fffffffc9a0
(gdb) print &f.imu
$4 = (Imu **) 0x7fffffffc9a0
```

It stops on the very first call. `i` is 4, so the loop does run one pass too far. `f.x[4]` prints as a strange, tiny number, because gdb is reading the pointer's 8 bytes as if they were a `double`. And the two addresses are identical: `&f.x[4]` and `&f.imu` are both `0x7fffffffc9a0`. Writing to `f.x[4]` writes over the pointer. That is the defect, caught in the act.

Why did the first two steps survive? Look at the residual in the stop line: `residual=0`. On steps 0 and 1 the loop wrote `x[4] += 0.001 * 0`, which puts the same bits back, so the pointer stayed valid. On step 2 the residual was 0.4 and the pointer's bits changed. A bug that is present on every pass but only visible on some is very common, and it is why "it worked for the first two samples" proves little.
:::

::: warning A condition that never comes true
If a conditional breakpoint never fires, gdb says nothing: the program runs to the end as if the breakpoint were not there. Before concluding "that never happens", check the line is really executed (a plain breakpoint there, or `info breakpoints`, which shows how many times each was hit) and that the condition is spelled right. `if i = 4`, with one `=`, assigns instead of comparing, and changes your program.
:::

## Watchpoints: who changed this value?

The conditional breakpoint worked because we already suspected the loop. Often you do not know where to look. You only know that a variable ends up wrong. For that, gdb has the most powerful trick in this lesson.

::: key
**Watchpoint:** a breakpoint on data rather than code: gdb stops when an expression's value changes. It is the tool for finding who corrupted a variable, and hardware watchpoints make it nearly free for small objects.
:::

You set one with **`watch`** and an expression. The expression must be in scope when you set it, so first stop somewhere the variable exists. Here, `f` lives in `main`:

::: example Catching the corrupter with a watchpoint
```text
(gdb) break main
Breakpoint 1 at 0x12bf: file nav.cpp, line 33.
(gdb) run
Breakpoint 1, main () at nav.cpp:33
33	int main() {
(gdb) watch f.imu
Hardware watchpoint 2: f.imu
(gdb) continue
Hardware watchpoint 2: f.imu

Old value = (Imu *) 0x0
New value = (Imu *) 0x7fffffffc940
main () at nav.cpp:36
36	    double residuals[5] = {0.0, 0.0, 0.4, -0.2, 0.1};
```

The first stop is innocent: line 35 initialized `f`, setting `imu` from zero to the real sensor's address. Continue:

```text
(gdb) continue
k=0  rate=0.0080  alt=100.000
k=1  rate=0.0080  alt=100.000

Hardware watchpoint 2: f.imu

Old value = (Imu *) 0x7fffffffc940
New value = (Imu *) 0x3f3a36e2eb1c432d
update (f=..., K=0x7fffffffc8f0, residual=0.40000000000000002) at nav.cpp:21
21	    for (int i = 1; i <= 4; ++i) {
```

Caught. The pointer went from the good address to garbage inside `update`, with residual 0.4. Notice two things.

1. gdb reports the line **after** the write. The processor only notices the change once the writing instruction has finished, so the program is stopped at the next thing to run, here the loop's `++i` on line 21. The guilty line is the one right before it: line 22.
2. Steps 0 and 1 did not trigger it, even though line 22 wrote to that memory then too. A watchpoint fires when the **value changes**, and writing the same bits back is not a change.

You did not need to suspect `update`, the loop, or MATLAB. You only needed to know which variable went bad.
:::

The word "Hardware" in the output matters. Modern processors have a few **[[debug registers|hardware-watchpoints]]** that watch an address and interrupt the program the moment it is written, at full speed. When gdb cannot use them, it falls back to a **software watchpoint**: it runs the program one instruction at a time and compares the value after each, which is far slower. Keep watched expressions small (a pointer, an `int`, one `double`) and they stay in hardware.

::: warning A watchpoint on a local dies with its frame
`watch` on a local variable is deleted when that function returns, because the variable no longer exists. Here `f` belongs to `main`, which lives for the whole run, so it was fine. To keep watching a memory location regardless of scope, use `watch -l f.imu` (`-l` is short for `-location`): gdb works out the address once and watches that address. Relatives: `rwatch` stops on reads, `awatch` on reads or writes.
:::

## The fix

The loop was translated from MATLAB, where `for i = 1:4` counts 1, 2, 3, 4 because [[MATLAB arrays start at 1|one-based]]. In C++, an array of four has indices 0 to 3:

```cpp
    for (int i = 0; i < 4; ++i) {
        f.x[i] += K[i] * residual;
    }
```

Rebuilt and rerun:

```text
k=0  rate=0.0080  alt=100.000
k=1  rate=0.0080  alt=100.000
k=2  rate=0.0080  alt=100.200
k=3  rate=0.0080  alt=100.100
k=4  rate=0.0080  alt=100.150
```

Check the numbers. The rate is $0.010 - 0.002 = 0.008$ rad/s every step, as it should be. The altitude now moves: $100 + 0.5 \times 0.4 = 100.2$, then $100.2 + 0.5 \times (-0.2) = 100.1$, then $100.1 + 0.5 \times 0.1 = 100.15$. Before the fix, the altitude never moved at all. That was a second symptom of the same bug, sitting in plain sight in the printed output.

Following lesson 01, the fix is not finished until a test would catch the bug again. Here, a test that checks `x[0]` after one update with a nonzero residual fails before the fix and passes after it.

Could a tool have caught it sooner? Compiling the buggy file with `g++ -O2 -Wall` prints `warning: iteration 3 invokes undefined behavior` for line 22, because the optimizer notices the fourth pass indexes past the array. AddressSanitizer, from the memory module, does **not** catch it: the bad write stays inside the `Filter` object, in memory the program owns, so ASan only reports the crash in `read_gyro` afterwards. That is exactly why a watchpoint is worth knowing.

## Check yourself

::: check
A program crashes and `bt` shows five frames, `#0` in `std::vector<double>::operator[]` and `#4` in `main`. Which frame's code is most likely wrong, and how do you look at it?
:::

::: answer
Probably not frame 0: the standard library's `operator[]` is very well tested, and it crashed because it was handed a bad index or a bad vector. Walk outward with `up` (or `frame 1`, `frame 2`) to the first frame that is your own code, and print the index and the vector's size there. The defect is usually in the frame that computed the bad argument, which may be one or two frames further up.
:::

::: check
You set `watch total` inside a function `sum_residuals`, where `total` is a local. You type `continue`, and gdb reports that the watchpoint was deleted. What happened, and how could you watch that memory anyway?
:::

::: answer
`total` is a local variable of `sum_residuals`. When that function returned, its stack frame, and the variable with it, stopped existing, so gdb deleted the watchpoint. If you want to know who writes that address afterwards (for example, a dangling pointer still writing to the old stack slot), use `watch -l total`, which watches the address itself. If you only wanted to see how `total` changes during one call, set the watchpoint again at the start of each call.
:::

::: check
Write the gdb command to stop at line 57 of `ekf.cpp` only when `n` is larger than the array length stored in `len`.
:::

::: answer
`break ekf.cpp:57 if n > len`. gdb evaluates `n > len` in the scope of that line each time it is reached and stops only when it is true. Both `n` and `len` must be visible at line 57.
:::

::: check
In the watchpoint session, why did gdb report line 21 when the bad write happened on line 22?
:::

::: answer
A hardware watchpoint triggers after the writing instruction has completed, because only then has the value changed. The program is stopped at the next instruction to execute, which belongs to the loop's `++i` on line 21. The rule: when a watchpoint fires, the culprit is the statement right before the one gdb shows.
:::

::: check
The `alt` column stayed at exactly `100.000` for every printed step before the crash. How could that alone have pointed you at the bug, without a debugger?
:::

::: answer
The first element of the state, altitude, should change whenever the residual is nonzero, since its gain is 0.5. Steps 0 and 1 had zero residual, so no change was expected there; but you know from the code that later residuals are not zero, and after the fix the altitude does move. An element that never updates while its neighbors do is the classic signature of an index shifted by one. Looking at printed output with an expectation in mind is itself an experiment.
:::

## Summary

| Command | What it does | Example |
| --- | --- | --- |
| `g++ -g -O0` | build with debug info, no optimization | `g++ -g -O0 -o nav nav.cpp` |
| `run` | start the program under gdb | `run < flight.log` |
| `bt` | print the call stack, frame 0 innermost | `bt` |
| `frame N` | select frame N for `print` and `info` | `frame 1` |
| `up` / `down` | select the caller / the callee | `up` |
| `break` | stop at a function or line | `break nav.cpp:22` |
| conditional breakpoint | stop only when an expression is true | `break nav.cpp:22 if i == 4` |
| `watch` | stop when a value changes | `watch f.imu`, `watch -l f.imu` |
| `continue`, `info breakpoints`, `delete` | resume, list, remove | `delete 1` |

gdb stops the program and tells you where you are. Lesson 03 is about looking around once you are there: `info args`, `info locals`, `print` with its formats and array syntax, raw memory with `x`, and the processor's own registers, including what to do when there is no debug information at all.

::: context gdb-name Where gdb comes from
gdb is part of the GNU Project, the free software effort started by Richard Stallman in the 1980s; Stallman wrote the first version of gdb in 1986. It is free, it runs on nearly every Unix-like system, and it understands C, C++, Rust, Fortran, Ada and more. Other debuggers exist, such as LLDB from the LLVM project and the debugger built into Visual Studio, but the ideas in this lesson (breakpoints, backtraces, frames, watchpoints) are the same in all of them.
:::

::: context debug-info What -g actually puts in the file
With `-g`, the compiler writes extra sections into the executable in a standard format called DWARF. They hold a table from machine-code addresses to source file and line, the type of every variable, and where each variable lives (for example, "32 bytes below the frame's base"). The program's code is the same with or without it; the file is only bigger. That is why release builds are often compiled with `-g` and then the debug sections are split off into a separate file and archived, so a crash from the field can still be read later.
:::

::: context segfault Segmentation fault and exit code 139
Your program's memory is divided into regions the operating system has handed out: code, stack, heap and so on. Touching an address outside them makes the processor raise a fault, and Linux sends the program the signal SIGSEGV, number 11, whose default action is to kill it. A shell reports a program killed by signal $n$ with exit status $128 + n$, so $128 + 11 = 139$. The word "segmentation" is a leftover from older machines that divided memory into segments.
:::

::: context stack-frames The stack at the moment of the crash
Every function call pushes a frame onto the stack; every return pops it. At the crash, three calls were in progress, and `bt` lists them from the top of the stack (newest) down to `main` (oldest). On x86-64 the stack grows toward lower addresses, so frame 0 sits at the lowest address.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="20" width="170" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="145" y="37" font-size="12" fill="#1f2a44" text-anchor="middle">#2 main</text>
  <text x="145" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">imu, f, residuals, k</text>
  <rect x="60" y="60" width="170" height="40" fill="#ffffff" stroke="#1f2a44"/>
  <text x="145" y="77" font-size="12" fill="#1f2a44" text-anchor="middle">#1 step</text>
  <text x="145" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">f, raw_gyro, residual, K</text>
  <rect x="60" y="100" width="170" height="40" fill="#f2b880" stroke="#1f2a44"/>
  <text x="145" y="117" font-size="12" fill="#1f2a44" text-anchor="middle">#0 read_gyro</text>
  <text x="145" y="132" font-size="11" fill="#1f2a44" text-anchor="middle">imu (bad), raw</text>
  <line x1="260" y1="30" x2="260" y2="130" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="254,124 266,124 260,136" fill="#6c7a93"/>
  <text x="270" y="60" font-size="11" fill="#6c7a93">stack grows</text>
  <text x="270" y="75" font-size="11" fill="#6c7a93">toward lower</text>
  <text x="270" y="90" font-size="11" fill="#6c7a93">addresses</text>
  <text x="20" y="44" font-size="11" fill="#1d6fd1">up</text>
  <text x="14" y="126" font-size="11" fill="#b4232c">down</text>
  <text x="145" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">frame 0 is where it stopped</text>
</svg>
```
:::

::: context return-address The hex number in each frame
When a function calls another, the processor saves the address of the next instruction in the caller so it knows where to resume after the call returns. That saved address is the return address. gdb uses these saved addresses, plus the debug information, to walk back through the frames, which is how `bt` works at all. The addresses begin with `0x5555...` because gdb turns off address randomization by default: without it, Linux would load the program at a different random address every run, a security feature that makes attacks harder. With it off, addresses repeat from run to run, so you can compare them.
:::

::: context hardware-watchpoints How watching memory can be nearly free
x86-64 processors have four debug address registers, DR0 to DR3. Each can hold an address and a length of up to 8 bytes, and the processor itself checks every memory write against them, raising a debug exception on a match. There is no slowdown, because the checking happens inside the hardware. That is why a watchpoint on one pointer, `int` or `double` is cheap. Watching something bigger than the registers can cover, or more locations than there are registers, makes gdb fall back to software watchpoints, which single-step the program and can be hundreds of times slower. ARM processors used on many flight computers have similar watchpoint hardware, usually with a small, fixed number of slots.
:::

::: context struct-layout Why x[4] is the same address as imu
`Filter` holds four `double`s of 8 bytes each, so `x` covers byte offsets 0 to 31. The pointer `imu`, also 8 bytes on a 64-bit machine, starts at offset 32 with no padding needed. `x[4]` would be at offset $4 \times 8 = 32$: exactly on top of `imu`. C++ does not check array indices, so the write goes wherever the arithmetic points.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="70" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="130" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="190" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="250" y="30" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="40" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">x[0]</text>
  <text x="100" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">x[1]</text>
  <text x="160" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">x[2]</text>
  <text x="220" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">x[3]</text>
  <text x="280" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">imu</text>
  <text x="10" y="22" font-size="11" fill="#6c7a93">0</text>
  <text x="70" y="22" font-size="11" fill="#6c7a93">8</text>
  <text x="130" y="22" font-size="11" fill="#6c7a93">16</text>
  <text x="190" y="22" font-size="11" fill="#6c7a93">24</text>
  <text x="250" y="22" font-size="11" fill="#6c7a93">32</text>
  <text x="280" y="84" font-size="12" fill="#b4232c" text-anchor="middle">x[4] lands here</text>
  <line x1="280" y1="72" x2="280" y2="62" stroke="#b4232c" stroke-width="2"/>
  <text x="10" y="110" font-size="11" fill="#6c7a93">byte offsets inside Filter</text>
</svg>
```
:::

::: context one-based Counting from 1 versus 0
MATLAB and Fortran number arrays from 1, like people do: the first element is `a(1)`. C, C++, Python and Rust number from 0, because an index there is an offset: `x[i]` is the element `i` steps past the start, so the first one is 0 steps away. GNC algorithms are very often prototyped in MATLAB or Simulink and then written in C or C++ for flight, so every translated loop and every index into a matrix is a place for exactly this bug. Reviewers check them one by one.
:::
