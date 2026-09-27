---
id: l04-stepping-and-changing-state
title: Stepping through code and changing it while it runs
minutes: 23
covers:
  - step vs next vs finish vs until; tbreak; display; set var
---

Think about following a recipe video. Most of the time you let it play. When the cook does something you do not understand, you pause and go forward a few seconds at a time. When she says "now make the sauce, which I showed you last week", you have a choice: trust that the sauce works and skip ahead to the part where it is ready, or open last week's video and watch the sauce being made. And once in a while you think "what if I used half the salt?" and try it yourself.

A debugger lets you do all of that to a running program. In lessons 02 and 03 you learned to stop a program at a breakpoint and look around: the call stack, the arguments, the locals, raw memory. This lesson is about moving. You will learn to go forward one line at a time, to decide at each function call whether to go inside it or treat it as one step, to jump to the end of a function or a loop, to have values printed for you at every stop, and to change a variable while the program is paused to ask "what if?".

On a GNC team this is how you check one cycle of a guidance or control loop by hand. You stop at the top of the cycle, step through the filter update, watch the estimate change line by line, and compare each number with what you worked out on paper. When they disagree, you have found the exact line where your understanding and the code part ways.

## The program we will walk through

Here is a small C++ program that pretends to be a rocket climbing straight up. Each time around the loop it works out the acceleration (thrust minus gravity minus drag), then updates the speed `v` and the height `h` over a time step of half a second. It is a tiny **[[time-stepping loop|time-stepping]]**, the same shape as the loop at the heart of every flight simulator.

```cpp
#include <cstdio>

double drag(double v) {
    double k = 0.002;          // drag constant, 1/m
    return k * v * v;          // m/s^2
}

double accel(double v, double thrust_acc) {
    double g = 9.81;
    double a = thrust_acc - g - drag(v);
    return a;
}

int main() {
    double v = 0.0;            // speed, m/s
    double h = 0.0;            // height, m
    const double dt = 0.5;     // time step, s
    int steps = 4;
    for (int i = 0; i < steps; i++) {
        double a = accel(v, 20.0);
        v = v + a * dt;
        h = h + v * dt;
    }
    std::printf("after %d steps: v = %.3f m/s, h = %.3f m\n", steps, v, h);
    return 0;
}
```

Counting from the `#include` as line 1, the lines that matter are: line 4 (`double k` inside `drag`), line 9 (`double g` inside `accel`), line 10 (the line that calls `drag`), lines 19 to 23 (the loop), and line 24 (the `printf`). Inside gdb, `list 14,25` prints the numbered lines so you never have to count by hand.

Build it with debug information and no optimization, and run it once without the debugger:

```text
$ g++ -g -O0 -o climb climb.cpp
$ ./climb
after 4 steps: v = 20.021 m/s, h = 25.218 m
```

The `-g` flag stores the **[[debug information|debug-info]]**, the map from machine code back to source lines and variable names, and `-O0` tells the compiler not to rearrange the code. Both matter for stepping, as you will see at the end of the lesson. All the sessions below were run with GNU gdb 15.1 and g++ 13.3.

## next: one line at a time, calls and all

The command **`next`** (short form `n`) runs the current line to the end and stops at the next line in the same function. If the line calls a function, the whole call happens, at full speed, and you do not see inside it. It is the "trust the sauce" button.

Set a breakpoint on line 20, the line that calls `accel`, and run:

```text
(gdb) break 20
Breakpoint 1 at 0x1208: file climb.cpp, line 20.
(gdb) run
Breakpoint 1, main () at climb.cpp:20
20	        double a = accel(v, 20.0);
(gdb) next
21	        v = v + a * dt;
(gdb) info locals
a = 10.19
i = 0
v = 0
h = 0
dt = 0.5
steps = 4
```

When gdb shows you a line, that line has **not run yet**. It is the next thing the program will do. After `next`, line 20 has run, so `a` now holds the answer from `accel`: $20 - 9.81 - 0 = 10.19\,\mathrm{m/s^2}$, since the drag at zero speed is zero. The call to `accel`, and the call to `drag` inside it, both happened during that single `next`.

Two small comforts. Pressing Enter on an empty line repeats the last command, so you can type `next` once and then tap Enter to walk line by line. And `next 3` does three `next`s in a row.

## step: go inside the call

The command **`step`** (short form `s`) also runs one line, but if that line calls a function that has debug information, gdb goes *into* the function and stops at its first line. It is the "open last week's video" button.

Continue to the second pass around the loop and step in:

```text
(gdb) continue
Breakpoint 1, main () at climb.cpp:20
20	        double a = accel(v, 20.0);
(gdb) step
accel (v=5.0949999999999998, thrust_acc=20) at climb.cpp:9
9	    double g = 9.81;
(gdb) step
10	    double a = thrust_acc - g - drag(v);
(gdb) step
drag (v=5.0949999999999998) at climb.cpp:4
4	    double k = 0.002;          // drag constant, 1/m
(gdb) bt
#0  drag (v=5.0949999999999998) at climb.cpp:4
#1  0x00005555555551b4 in accel (v=5.0949999999999998, thrust_acc=20) at climb.cpp:10
#2  0x0000555555555222 in main () at climb.cpp:20
```

Each time gdb enters a function it prints the function's name and its arguments, which is a free `info args`. The speed is now $5.095\,\mathrm{m/s}$ (the long tail of digits is how the nearest double to 5.095 prints). Two `step`s later we are two calls deep, and `bt` shows the stack: `drag` called from `accel` called from `main`.

`step` does not go into functions that have no debug information, such as `printf` from the C library. It treats them like `next` would, which is almost always what you want. If you step into something you did not mean to, the next command gets you out.

## finish: run to the end of this function

The command **`finish`** (short form `fin`) runs until the current function returns, stops in the caller right after the call, and prints the value the function returned. It is the "skip to where the sauce is ready" button, pressed after you have already opened the video.

```text
(gdb) finish
Run till exit from #0  drag (v=5.0949999999999998) at climb.cpp:4
0x00005555555551b4 in accel (v=5.0949999999999998, thrust_acc=20) at climb.cpp:10
10	    double a = thrust_acc - g - drag(v);
Value returned is $1 = 0.051918049999999993
(gdb) finish
Run till exit from #0  0x00005555555551b4 in accel (v=5.0949999999999998, thrust_acc=20)
    at climb.cpp:10
0x0000555555555222 in main () at climb.cpp:20
20	        double a = accel(v, 20.0);
Value returned is $2 = 10.13808195
(gdb) next
21	        v = v + a * dt;
```

Notice where gdb stops: back on line 10, in the middle of it. The call to `drag` is done, but the subtraction that uses its result has not happened yet. Also notice the **[[$1 and $2|value-history]]**: gdb saves every printed result in a numbered slot so you can use it later, for example `print $1 * 2`.

::: key
step enters the called function; next executes the call as one unit; finish runs until the current function returns and prints its return value. until is next that will not go backwards in a loop.
:::

::: example Checking one loop cycle against a hand calculation
You want to know whether the second cycle of the loop computes what you expect. Before stepping, work it out on paper.

Cycle one starts at rest, so $a = 20 - 9.81 = 10.19\,\mathrm{m/s^2}$. Then $v = 0 + 10.19 \times 0.5 = 5.095\,\mathrm{m/s}$, and $h = 0 + 5.095 \times 0.5 = 2.5475\,\mathrm{m}$.

Cycle two, drag first: $k v^2 = 0.002 \times 5.095^2 = 0.002 \times 25.959 = 0.05192\,\mathrm{m/s^2}$.

Then the acceleration: $20 - 9.81 - 0.05192 = 10.13808\,\mathrm{m/s^2}$.

Now compare with the session above. `step` into `accel` showed `v=5.0949999999999998`, which matches $5.095$. The first `finish` printed `Value returned is $1 = 0.051918049999999993`, which matches the drag. The second `finish` printed `$2 = 10.13808195`, which matches the acceleration.

Every number agrees, so cycle two is right. Sanity check: drag should be small at $5\,\mathrm{m/s}$, about half a percent of gravity, and $0.052$ out of $9.81$ is about $0.5\%$. If one number had disagreed, you would know which function to read, because `finish` hands you each function's answer separately.
:::

## until: get out of the loop

Stepping through a loop with `next` is fine for one or two passes. After that it gets tedious, because `next` keeps carrying you back to the top. The command **`until`** (short form `u`) fixes that.

`until` with no argument behaves like `next`, with one difference: it will not stop at a line that is *earlier* in the program than where you are now. So when you are at the end of a loop body, about to jump back to the top, `until` runs every remaining pass of the loop and stops at the first line after it. That jump back to the top of a loop is called the loop's **[[back edge|back-edge]]**.

Here we stop on line 22, the last line of the body. One `next` takes us to line 19, the `for` line, where the program is about to add one to `i`, test `i < steps`, and jump back:

```text
(gdb) break 22
Breakpoint 1 at 0x124a: file climb.cpp, line 22.
(gdb) run
Breakpoint 1, main () at climb.cpp:22
22	        h = h + v * dt;
(gdb) next
19	    for (int i = 0; i < steps; i++) {
(gdb) delete 1
(gdb) until
24	    std::printf("after %d steps: v = %.3f m/s, h = %.3f m\n", steps, v, h);
```

One `until` ran the three remaining passes and landed on line 24, after the loop. Had you typed `next` there, you would have gone back to line 20 instead.

`until` also takes a place to stop: `until 24` means "run until you reach line 24 in this function, or until this function returns". A close relative, `advance 24`, works the same way, except that the place you name may be in a different function.

::: warning Breakpoints still fire during until, finish and next
`until`, `finish` and `next` let the program run at full speed, and any breakpoint the program meets on the way stops it. In the session above, `delete 1` removed the breakpoint on line 22 first. Without that, `until` would have stopped on line 22 again in the very next pass. The same thing happens with `until 24` if a breakpoint sits on line 20: you land on line 20, not 24. If a "run to here" command stops somewhere unexpected, run `info breakpoints` before you suspect anything stranger.
:::

## tbreak: a breakpoint that removes itself

Often you want to stop somewhere exactly once, for example at the start of `main`, and never again. The command **`tbreak`** sets a **temporary breakpoint**: it works like `break`, but gdb deletes it the first time it is hit.

```text
(gdb) tbreak main
Temporary breakpoint 1 at 0x11d9: file climb.cpp, line 15.
(gdb) info breakpoints
Num     Type           Disp Enb Address            What
1       breakpoint     del  y   0x00000000000011d9 in main() at climb.cpp:15
(gdb) run
Temporary breakpoint 1, main () at climb.cpp:15
15	    double v = 0.0;            // speed, m/s
(gdb) info breakpoints
No breakpoints, watchpoints, tracepoints, or catchpoints.
```

Look at the `Disp` column, short for **disposition**, meaning what happens to the breakpoint after it is hit. For `tbreak` it says `del`, for "delete". After the stop, the list is empty. The command `start` is a shortcut for exactly this: it sets a temporary breakpoint on `main` and runs the program.

Temporary breakpoints keep your breakpoint list short. A cluttered list of old breakpoints is the most common reason a `continue` or `until` stops somewhere you did not expect.

## display: have gdb print things for you

When you step through a loop, you usually want to see the same few variables after every step. Typing `print v` and `print h` every time is slow. The command **`display`** registers an expression, and gdb prints it every time the program stops.

```text
(gdb) display i
1: i = 0
(gdb) display v
2: v = 5.0949999999999998
(gdb) display/f h
3: /f h = 0
(gdb) next
19	    for (int i = 0; i < steps; i++) {
1: i = 0
2: v = 5.0949999999999998
3: /f h = 2.5474999999999999
(gdb) next
20	        double a = accel(v, 20.0);
1: i = 1
2: v = 5.0949999999999998
3: /f h = 2.5474999999999999
```

Each display gets a number. The `/f` after `display` is a format letter, the same ones `print` and `x` use from lesson 03: `/f` for floating point, `/x` for hexadecimal, `/d` for decimal. You can read `display/f h` aloud as "display, format float, h".

To manage the list: `info display` shows it, `undisplay 2` removes display number 2, and `disable display 2` pauses it without forgetting it. A display is only shown when its variables make sense where you stopped. A display of `i` is quietly skipped while you are inside `drag`, because `i` belongs to `main`.

::: example Watching the loop state change pass by pass
With `display i`, `display v` and `display/f h` active, you step from line 22 of pass one to line 20 of pass two. Predict each value before looking at the session above.

After line 22 of pass one: $h = 0 + 5.095 \times 0.5 = 2.5475\,\mathrm{m}$. The loop counter is still $0$, because the `i++` has not run yet.

Then `next` from line 19 runs the `i++` and the test $1 < 4$, which is true, so we land on line 20 with $i = 1$. Speed and height do not change on these lines.

The session agrees: after the first `next`, `h` reads $2.5474999999999999$ (the nearest double to $2.5475$) and `i` is still $0$; after the second, `i` is $1$ and nothing else moved.

The detail worth noticing is when `i` changes. It happens on the `for` line, on the way back to the top, not at the bottom of the body. Displays make this kind of detail visible without any extra typing.
:::

## set var: change the program while it is paused

So far you have only watched. gdb also lets you **change** the program's state while it is paused, and then let it carry on with the new value. This turns the debugger into a **[[lab bench|fault-injection]]**: "what if the speed were $60\,\mathrm{m/s}$ right here?" You do not need to edit the code, rebuild and rerun.

The command is **`set var`**, short for `set variable`:

```text
(gdb) break accel
Breakpoint 1 at 0x118a: file climb.cpp, line 9.
(gdb) run
Breakpoint 1, accel (v=0, thrust_acc=20) at climb.cpp:9
9	    double g = 9.81;
(gdb) set v = 60
Ambiguous set command "v = 60": var, variable, varsize-limit, verbose.
(gdb) set var v = 60
(gdb) print drag(60)
$1 = 7.1999999999999993
(gdb) finish
Run till exit from #0  accel (v=60, thrust_acc=20) at climb.cpp:9
0x0000555555555222 in main () at climb.cpp:20
20	        double a = accel(v, 20.0);
Value returned is $2 = 2.9900000000000002
(gdb) print v
$3 = 0
```

Three things happened here, and each teaches something.

First, plain `set v = 60` failed. The word `set` also controls gdb's own settings (`set pagination`, `set verbose`, and dozens more), and gdb could not tell whether `v` was the start of one of them. Writing `set var` removes the doubt. Make it a habit, and you will never be caught by a variable whose name happens to match a gdb setting. You may also see `print v = 60`, which does the same assignment and prints the result.

Second, `print drag(60)` **called a function** inside the paused program and printed what it returned: $0.002 \times 60^2 = 7.2$. This is a quick way to test a function on any input you like.

Third, after `finish`, main's `v` is still $0$. The `v` we changed was `accel`'s parameter, which is a **[[copy|pass-by-value]]** of main's `v`, made when the call started. Changing the copy changed what `accel` computed ($20 - 9.81 - 7.2 = 2.99$) but not main's variable.

Other things you can set: an element (`set var cmd[2] = 0.5`), a struct field (`set var s->scale = 0.25`), even a pointer. And you can change how long the loop runs:

```text
(gdb) set var steps = 2
(gdb) delete 1
(gdb) continue
Continuing.
after 2 steps: v = 6.588 m/s, h = 4.041 m
[Inferior 1 (process 19528) exited normally]
```

::: example What the altered run printed, checked by hand
The program printed $v = 6.588\,\mathrm{m/s}$ and $h = 4.041\,\mathrm{m}$. Can we explain both numbers?

Pass one used the forced speed of $60\,\mathrm{m/s}$ inside `accel`, so $a = 2.99\,\mathrm{m/s^2}$. Main's `v` was really $0$, so $v = 0 + 2.99 \times 0.5 = 1.495\,\mathrm{m/s}$ and $h = 0 + 1.495 \times 0.5 = 0.7475\,\mathrm{m}$.

Pass two ran normally: drag is $0.002 \times 1.495^2 = 0.00447\,\mathrm{m/s^2}$, so $a = 20 - 9.81 - 0.00447 = 10.18553\,\mathrm{m/s^2}$. Then $v = 1.495 + 10.18553 \times 0.5 = 6.588\,\mathrm{m/s}$ and $h = 0.7475 + 6.588 \times 0.5 = 4.041\,\mathrm{m}$.

Both match. Then the loop stopped, because `steps` was now $2$. Sanity check: the unaltered program reached $10.16\,\mathrm{m/s}$ after two passes. Our run is slower, because pass one saw heavy drag, so $6.588$ is in the right direction.
:::

::: warning A changed run is an experiment, not the flight
Once you `set var` anything, the rest of that run is no longer the program's real behavior. Note down what you changed, and do not report numbers from an altered run as if they came from the real one. Changing a variable also does not rerun code that already used the old value. And `print` with a function call really runs that function, side effects included. On real hardware, a function that sends a command to a valve would really send it.
:::

## Why stepping gets strange with optimized code

Everything above used `-O0`. With optimization on (`-O2`), the compiler reorders lines, keeps variables in registers and throws away ones it no longer needs, and copies small functions straight into their callers. The machine code no longer lines up with your source line by line. Then `next` seems to jump backwards and forwards, `step` skips a function that was merged into its caller, and `print` answers `<optimized out>`.

That is not gdb being broken; the variable truly has no home at that moment. For stepping sessions, build with `-O0 -g`, or with **`-Og`**, which optimizes only in ways that keep debugging pleasant. When the bug only shows up at `-O2`, you debug the `-O2` build and lean more on breakpoints, `finish` and `info registers` than on single steps. When a single source line is still too big a step, gdb has `stepi` and `nexti`, which move one **[[machine instruction|machine-instructions]]** at a time.

## Check yourself

::: check
You are stopped on a line that reads `x = filter(y) + 1;`. You trust `filter` completely. Which command moves you to the following line, and what do you see of `filter`?
:::

::: answer
`next`. It runs the whole line, including the entire call to `filter`, and stops on the next line of the current function. You see nothing of `filter`'s inside: no stops, no printed arguments. If you had typed `step`, you would have landed on the first line of `filter`.
:::

::: check
You typed `step` by accident and are now three lines into a long function you do not care about. How do you get back to the caller fastest, and what extra information does that command give you?
:::

::: answer
`finish`. It runs the rest of the function at full speed, stops in the caller right after the call, and prints `Value returned is $N = ...`, the function's return value. That value is saved in the value history, so you can use `$N` in later expressions.
:::

::: check
You are on the last line of a loop body that will run 500 more times. What does `next` do there, what does `until` do, and why are they different?
:::

::: answer
`next` runs the line and stops at the loop header; one more `next` puts you back at the top of the body, and you go around again. `until` refuses to stop at any line earlier in the program than where you are, so it lets all 500 remaining passes run and stops at the first line after the loop. (Any breakpoint inside the loop would still stop it.)
:::

::: check
You set `break 40` for a one-off look and later wonder why `continue` keeps stopping on line 40. What would have avoided this, and how do you tell from `info breakpoints` which kind you have?
:::

::: answer
`tbreak 40` sets a temporary breakpoint that gdb deletes the first time it is hit. In `info breakpoints`, the `Disp` (disposition) column shows `del` for a temporary breakpoint and `keep` for an ordinary one. Now that you have the ordinary one, `delete` with its number removes it.
:::

::: check
Inside a function `double thrust(double throttle)` you type `set var throttle = 1.0`, then `finish`. The caller passed its own variable `cmd` as the argument. What is `cmd` afterwards, and why?
:::

::: answer
`cmd` is unchanged. `throttle` is a parameter passed by value, a separate copy of `cmd` made when the call started. Changing the copy changes what `thrust` computes and returns, which `finish` prints, but not the caller's variable. To change the caller's value, select the caller's frame (`up`) and `set var cmd = 1.0` there.
:::

## Summary

| Command | What it does | Remember |
|---|---|---|
| `next` / `n` | run one line; calls happen as one unit | the shown line has not run yet |
| `step` / `s` | run one line; go into a called function | skips functions with no debug info |
| `finish` / `fin` | run until this function returns | prints `Value returned is $N` |
| `until` / `u` | like `next`, but never back up a loop | `until LINE` runs to that line |
| `tbreak LOC` | breakpoint deleted after first hit | `start` = `tbreak main` + `run` |
| `display EXPR` | print EXPR at every stop | `info display`, `undisplay N` |
| `set var X = V` | change a variable in the paused program | a changed run is an experiment |
| Enter | repeat the last command | handy with `next` and `step` |

So far the program has always been started inside gdb. The next lesson covers the two other ways a bug reaches you: a program that is already running and stuck, which you attach to with `gdb -p`, and a program that already crashed and left a core dump behind.

::: context time-stepping The loop at the heart of every simulator
A computer cannot follow a smooth motion. It jumps forward in small hops of time, here $\Delta t = 0.5\,\mathrm{s}$, and at each hop it updates the speed from the acceleration and the position from the speed. This program updates `v` first and then uses the new `v` for `h`, a variant called semi-implicit Euler. Real simulators use smaller steps and cleverer update rules, and you will meet them in the numerical methods modules, but the outer loop looks exactly like this one. That is why being able to step through one cycle of it pays off again and again.
:::

::: context debug-info What -g actually stores
A compiled program is only machine instructions and addresses. The names `v`, `drag` and `climb.cpp:20` are gone. With `-g`, the compiler adds extra sections to the executable in a format called DWARF: which address range belongs to which source line, where each variable lives at each moment (a stack slot, or a register), and the type of every variable. gdb reads those tables to turn an address back into "line 20". The program runs the same with or without them; they only make the file bigger.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="150" height="90" fill="#ffffff" stroke="#1f2a44"/>
  <text x="85" y="40" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">climb (executable)</text>
  <rect x="25" y="50" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="85" y="65" font-size="11" fill="#1f2a44" text-anchor="middle">machine code</text>
  <rect x="25" y="78" width="120" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="85" y="93" font-size="11" fill="#1f2a44" text-anchor="middle">DWARF (from -g)</text>
  <line x1="145" y1="89" x2="210" y2="89" stroke="#1f2a44"/>
  <polygon points="214,89 206,84 206,94" fill="#1f2a44"/>
  <text x="220" y="70" font-size="11" fill="#1f2a44">0x1208 is line 20</text>
  <text x="220" y="88" font-size="11" fill="#1f2a44">v is at frame base - 48</text>
  <text x="220" y="106" font-size="11" fill="#1f2a44">v has type double</text>
</svg>
```
:::

::: context value-history Every answer gets a number
gdb keeps every value it prints in a list called the value history. The first is `$1`, the next `$2`, and so on. `$` alone means the most recent one and `$$` the one before it. You can use them like variables: `print $1 * 1000` converts a drag of about $0.0519\,\mathrm{m/s^2}$ into $51.9\,\mathrm{mm/s^2}$ without retyping it. Names that start with `$` and are not numbers are convenience variables you can make yourself, for example `set $peak = 0`, and gdb also uses the `$` prefix for registers, as in `$pc`.
:::

::: context back-edge Why until looks at line numbers
A loop compiles into a block of code with a jump at the bottom that goes back to the top. Compiler writers call that backward jump the loop's back edge. gdb does not really know where your loops are. `until` uses a simple rule instead: do not stop at an address lower than the current one in this frame. Because a back edge always goes to a lower address, the rule has the effect of "finish this loop".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="10" width="200" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="140" y="28" font-size="12" fill="#1f2a44" text-anchor="middle">19  for (i = 0; i &lt; steps; i++)</text>
  <rect x="40" y="44" width="200" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="140" y="62" font-size="12" fill="#1f2a44" text-anchor="middle">20  a = accel(v, 20.0)</text>
  <rect x="40" y="78" width="200" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="140" y="96" font-size="12" fill="#1f2a44" text-anchor="middle">21 and 22  update v and h</text>
  <rect x="40" y="130" width="200" height="26" fill="#ffffff" stroke="#1d6fd1"/>
  <text x="140" y="148" font-size="12" fill="#1f2a44" text-anchor="middle">24  printf(...)</text>
  <path d="M 240 91 C 290 91 290 23 244 23" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="244,23 252,18 252,28" fill="#b4232c"/>
  <text x="292" y="60" font-size="11" fill="#b4232c">back edge</text>
  <text x="292" y="74" font-size="11" fill="#b4232c">next follows it</text>
  <line x1="30" y1="23" x2="30" y2="143" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="30,150 25,140 35,140" fill="#1d6fd1"/>
  <text x="20" y="118" font-size="11" fill="#1d6fd1" text-anchor="end">until</text>
</svg>
```
:::

::: context fault-injection Changing state on purpose, as a test method
Forcing a value to see how the rest of the system reacts is called fault injection. GNC teams do it deliberately in simulation and on test benches: freeze a gyro reading, flip a status bit, feed in a sensor value that is out of range, then check that the fault detection logic notices and the vehicle reacts safely. `set var` in gdb is the hand-held version of the same idea. In later modules you will see it done at scale, with scripted fault campaigns run on every build.
:::

::: context pass-by-value Two variables called v
When `main` calls `accel(v, 20.0)`, the value inside main's `v` is copied into a brand-new variable, also called `v`, that lives in `accel`'s stack frame. Same name, different box. `set var v = 60` while stopped in `accel` writes into accel's box. If `accel` had taken `double& v`, a reference, both names would have meant the same box, and the change would have reached `main`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="140" height="100" fill="#ffffff" stroke="#1f2a44"/>
  <text x="90" y="40" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">frame: main</text>
  <rect x="45" y="60" width="90" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">v = 0</text>
  <rect x="200" y="20" width="140" height="100" fill="#ffffff" stroke="#1f2a44"/>
  <text x="270" y="40" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">frame: accel</text>
  <rect x="225" y="60" width="90" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="270" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">v = 60</text>
  <line x1="135" y1="75" x2="222" y2="75" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="178" y="68" font-size="11" fill="#6c7a93" text-anchor="middle">copied</text>
  <text x="270" y="110" font-size="11" fill="#b4232c" text-anchor="middle">set var changed this</text>
</svg>
```
:::

::: context machine-instructions Lines are made of instructions
One line of C++ usually becomes several machine instructions: load a value, multiply, add, store. `stepi` (short `si`) runs exactly one instruction, and `nexti` (short `ni`) does the same but treats a `call` instruction as one unit. Pair them with `display/i $pc`, which shows the instruction about to run each time you stop. You rarely need them at `-O0`. They earn their keep in optimized code, in code with no source available, and when a crash happens in the middle of a line and you need to know which part of the line it was.
:::
