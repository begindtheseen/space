---
id: l07-debugging-python
title: 'Debugging Python: pdb, breakpoint() and py-spy'
minutes: 24
covers:
  - 'Python: pdb, breakpoint(), py-spy for a live process'
---

A car mechanic has two ways to find out what is wrong with an engine. One is to switch it off, put the car up on the lift, and look at every part at leisure: turn this gear by hand, check that belt, measure that gap. The other is to leave the engine running and listen with a stethoscope, because some problems only exist while the engine is turning, and switching it off would make them vanish.

Debugging Python works the same way, with one tool for each. **pdb**, the Python debugger, is the lift: it stops the program and lets you look at and change anything, one line at a time. **py-spy** is the stethoscope: it listens to a Python program that is already running, without stopping it, without changing its code, and without restarting it.

On a GNC team, much of the code around the flight software is Python: telemetry parsers, Monte Carlo drivers, plotting tools. When one gives a wrong number, crashes on line 40,000 of a log, or seems to hang overnight, these are the tools you reach for. What you learned about gdb in lessons 02 to 05 carries over, often down to the one-letter command names.

## pdb: a debugger that is part of Python

**pdb** ships inside Python's standard library, so there is nothing to install. It does for Python what gdb does for C++. The easiest way to start it is to run your script through it:

```bash
python3 -m pdb burn.py
```

Read `-m pdb` as "run the module named pdb". pdb loads your script, stops before its first line, and shows the prompt `(Pdb)`, waiting for a command. The commands will look familiar:

| pdb command | What it does | gdb cousin |
|---|---|---|
| `b 5` | set a **breakpoint** at line 5 | `break` |
| `b 5, i == 4` | a breakpoint that only stops when the condition is true | `break … if` |
| `c` | continue running until the next breakpoint | `continue` |
| `n` | next: run the current line, stepping over calls | `next` |
| `s` | step: go into the function being called | `step` |
| `r` | return: run until the current function returns | `finish` |
| `unt` | until: like `n`, but will not go backwards in a loop | `until` |
| `p expr` / `pp expr` | print (or pretty-print) any Python expression | `print` |
| `a` | show the current function's arguments | `info args` |
| `l` / `ll` | list the source near here / the whole function | `list` |
| `w` | where: print the call stack | `bt` |
| `u` / `d` | move up or down one stack frame | `up` / `down` |
| `display expr` | show `expr` every time it changes at a stop | `display` |
| `q` | quit | `quit` |

In pdb, `p` takes any Python expression, not only a variable name: `p sum(samples) / len(samples)` and `p [x for x in samples if x > 950]` both work, because pdb hands the text to Python to evaluate in the paused frame.

::: key
pdb is Python's built-in debugger. `python3 -m pdb script.py` starts it; `b`, `c`, `n`, `s`, `r`, `p`, `w`, `u`/`d` work like gdb's break, continue, next, step, finish, print, bt, up/down.
:::

::: example Finding a skipped sample in a thrust integral
A short script adds up the **[[total impulse|impulse-meaning]]** of an engine burn: thrust in newtons times time in seconds, summed over samples taken every 0.5 s.

```python
# burn.py: total impulse from thrust samples, sampled every dt seconds.
def total_impulse(thrust_n, dt):
    total = 0.0
    for i in range(1, len(thrust_n)):
        total += thrust_n[i] * dt
    return total

samples = [900.0, 1000.0, 1000.0, 1000.0, 950.0]
print(f"impulse = {total_impulse(samples, 0.5):.1f} N*s")
```

```text
impulse = 1975.0 N*s
```

First, work out what it should say. The five samples add to $900 + 1000 + 1000 + 1000 + 950 = 4850$ N. Times 0.5 s, that is 2425 N·s. The program says 1975, which is 450 N·s short. And 450 is exactly $900 \times 0.5$, the first sample's share. That is already a strong **hypothesis**: the first sample is being skipped. Now test it with pdb instead of guessing:

```text
$ python3 -m pdb burn.py
> .../burn.py(2)<module>()
-> def total_impulse(thrust_n, dt):
(Pdb) b 5
Breakpoint 1 at .../burn.py:5
(Pdb) c
> .../burn.py(5)total_impulse()
-> total += thrust_n[i] * dt
(Pdb) p i, thrust_n[i], total
(1, 1000.0, 0.0)
```

Read the stop line: file `burn.py`, line 5, inside `total_impulse`, and the arrow shows the line about to run. The first time line 5 runs, `i` is already 1, and `total` is still 0. So `thrust_n[0]`, the 900 N sample, is never added. Continue once more to be sure the pattern holds:

```text
(Pdb) c
> .../burn.py(5)total_impulse()
-> total += thrust_n[i] * dt
(Pdb) p i, total
(2, 500.0)
```

After one pass, `total` is $1000 \times 0.5 = 500$, as expected. The hypothesis is confirmed. The loop was written `range(1, len(thrust_n))`, a habit carried over from a language that counts from 1. The fix is `range(len(thrust_n))`, and the program then prints 2425.0 N·s, matching the hand calculation.
:::

The `...` at the start of each path stands for the folder the script sits in; pdb prints the full path.

With five samples, pressing `c` a few times is fine. With 50,000 samples, you want to stop only at the one that matters. A **conditional breakpoint** does that: write the condition after a comma, as any Python expression.

```text
(Pdb) b 5, i == 4
Breakpoint 1 at .../burn.py:5
(Pdb) c
> .../burn.py(5)total_impulse()
-> total += thrust_n[i] * dt
(Pdb) p i, thrust_n[i], total
(4, 950.0, 1500.0)
```

pdb checked `i == 4` every time line 5 came around and stopped only on the last sample. By then `total` is 1500, which is $(1000 + 1000 + 1000) \times 0.5$: samples 1, 2 and 3, and still no 900.

## Stepping into, over and out of functions

Stepping works exactly as in gdb. `n` runs one line; if that line calls a function, the whole call happens as one step. `s` goes into the call and stops at its first line. `r` runs to the end of the current function and stops as it returns, showing the return value.

```text
(Pdb) b 9
Breakpoint 1 at .../burn.py:9
(Pdb) c
> .../burn.py(9)<module>()
-> print(f"impulse = {total_impulse(samples, 0.5):.1f} N*s")
(Pdb) s
--Call--
> .../burn.py(2)total_impulse()
-> def total_impulse(thrust_n, dt):
(Pdb) s
> .../burn.py(3)total_impulse()
-> total = 0.0
(Pdb) r
--Return--
> .../burn.py(6)total_impulse()->1975.0
-> return total
```

`--Call--` marks the moment of entering a function, and `--Return--` the moment of leaving it. The `->1975.0` after the function name is the value being returned, the same job gdb's `finish` does with "Value returned is".

Two more habits carry over from gdb. `w` prints the stack, but newest frame last, the opposite order from gdb's `bt`; an arrow `>` marks the frame you are in. And typing `total = 2425.0` at the prompt changes a variable, like gdb's `set var`.

::: warning pdb commands can hide your variables
A variable called `n`, `s`, `c`, `l`, `a`, `p` or `r` collides with a pdb command. Typing `c` to see a variable named `c` does not print it; it continues the program, and your stop is gone. Use `p c` to print, and `!c = 0` to assign.
:::

## Post-mortem: opening a Python crash after it happened

A **[[post-mortem|post-mortem-word]]** is an examination after death. In debugging it means: the program has already crashed with an exception, and you want to look around at the exact moment it died. It is Python's answer to opening a core dump in gdb (lesson 05), except that it happens in the same run.

Here is a telemetry parser. Each line looks like `alt=1204.5,vel=88.1`, and it turns each line into a dictionary of numbers.

```python
# telem.py: parse "name=value" telemetry lines into a dict of floats.
def parse(line):
    out = {}
    for field in line.split(","):
        name, value = field.split("=")
        out[name] = float(value)
    return out

lines = ["alt=1204.5,vel=88.1", "alt=1290.0,vel=86.9", "alt=1374.2,vel=,temp=301"]
for n, line in enumerate(lines):
    print(n, parse(line))
```

```text
0 {'alt': 1204.5, 'vel': 88.1}
1 {'alt': 1290.0, 'vel': 86.9}
Traceback (most recent call last):
  File ".../telem.py", line 11, in <module>
    print(n, parse(line))
             ^^^^^^^^^^^
  File ".../telem.py", line 6, in parse
    out[name] = float(value)
                ^^^^^^^^^^^^
ValueError: could not convert string to float: ''
```

The **traceback** says where it died: line 6, in `parse`, called from line 11. It does not say *which field* or *which line of the log*. With three lines you could read them by eye; with 40,000 lines from a test stand, you cannot.

::: example A post-mortem on a bad telemetry line
Run the script with `-c continue`. That tells pdb to start running at once, and if an uncaught exception happens, to stop right there instead of exiting:

```text
$ python3 -m pdb -c continue telem.py
0 {'alt': 1204.5, 'vel': 88.1}
1 {'alt': 1290.0, 'vel': 86.9}
Traceback (most recent call last):
  ...
ValueError: could not convert string to float: ''
Uncaught exception. Entering post mortem debugging
Running 'cont' or 'step' will restart the program
> .../telem.py(6)parse()
-> out[name] = float(value)
(Pdb) p field
'vel='
(Pdb) p name, value
('vel', '')
(Pdb) p line
'alt=1374.2,vel=,temp=301'
(Pdb) u
> .../telem.py(11)<module>()
-> print(n, parse(line))
(Pdb) p n
2
```

Step by step: `p field` shows the piece being parsed, `'vel='`. `p name, value` shows that splitting on `=` gave the name `vel` and an empty value. `p line` shows the whole raw line. Then `u` moves up one frame, into the loop that called `parse`, and `p n` says it is line number 2 of the log (counting from 0, so the third line).

Now the report writes itself: "log line 2 has an empty `vel` field, and `parse` has no rule for missing values". Whether to skip the field, store NaN or reject the line is a team decision. pdb found the exact record and field without a single added `print`.
:::

If you are already inside an interactive Python session (`python3 -i script.py`, or a notebook) when an exception happens, `import pdb; pdb.pm()` opens the same post-mortem view on the last exception. `pm` is short for post-mortem.

## breakpoint(): a stop sign written into the code

Sometimes you do not want to start the whole program under pdb. You want it to run at full speed and stop at one spot, maybe only in a rare case. For that, Python has a built-in function, **`breakpoint()`**. Where it runs, the program pauses and opens pdb right there. It was added in Python 3.7 by **[[PEP 553|pep-553]]**; before that, people wrote `import pdb; pdb.set_trace()`, which does the same thing and still works.

Here is a function that scales a controller gain by **dynamic pressure** $q$ (read "q"), the pressure of the air hitting the vehicle, in pascals. A gain schedule like this makes the controller gentler when the air is thick and stronger when it is thin. We want to stop only in the odd case where the ratio grows past 3:

```python
# gain.py: scale a PID gain by dynamic pressure q (Pa).
def scheduled_gain(k_ref, q, q_ref=20000.0):
    ratio = q_ref / q
    if ratio > 3.0:
        breakpoint()          # pause here only in the odd case
    return k_ref * ratio

for q in [40000.0, 20000.0, 5000.0]:
    print(q, scheduled_gain(0.8, q))
```

```text
$ python3 gain.py
40000.0 0.4
20000.0 0.8
> .../gain.py(6)scheduled_gain()
-> return k_ref * ratio
(Pdb) p q, ratio
(5000.0, 4.0)
(Pdb) c
5000.0 3.2
```

The first two calls ran without stopping. On the third, $20000 / 5000 = 4.0$, which is more than 3, so the program paused. Notice that pdb stops on the line *after* `breakpoint()`, line 6, because the call itself has already happened. After `c`, the program finished: $0.8 \times 4.0 = 3.2$.

### Turning every breakpoint() off at once

The clever part of `breakpoint()` is that it is not hard-wired to pdb. It looks at an **[[environment variable|env-var]]** called `PYTHONBREAKPOINT` first:

```text
$ PYTHONBREAKPOINT=0 python3 gain.py
40000.0 0.4
20000.0 0.8
5000.0 3.2
```

With `PYTHONBREAKPOINT=0`, every `breakpoint()` call does nothing, and the program runs straight through. Set it to the name of another function instead, like `PYTHONBREAKPOINT=ipdb.set_trace` for the popular third-party debugger ipdb, and every `breakpoint()` opens that instead. Leave it unset and you get pdb.

::: key
`breakpoint()` (Python 3.7+) pauses the program and opens pdb at that spot. `PYTHONBREAKPOINT=0` makes every `breakpoint()` a no-op; setting it to a function's name picks a different debugger.
:::

::: warning A forgotten breakpoint() in a pipeline
A `breakpoint()` left in code that runs without a person at a keyboard, such as a nightly Monte Carlo job or a ground-station service, will stop and wait for a debugger command that never comes, or end the run if there is no input at all. Search for `breakpoint(` before you commit. Many teams add a lint rule for it, and set `PYTHONBREAKPOINT=0` in automated jobs as a second line of defense.
:::

## py-spy: listening to a program that is already running

Now the other half. Imagine a Monte Carlo landing simulation that someone launched this morning. It has been running for hours, printing nothing. Is it stuck in an endless loop? Is it nearly done? Where is it spending its time?

pdb cannot help: it needs the program started under it, or a `breakpoint()` placed beforehand, and stopping a four-hour run loses four hours. You want to peek in from outside. That is **py-spy**.

py-spy is a **[[sampling profiler|sampling-profiler]]** for Python: many times a second, it reads the running program's memory from the outside, works out which Python function each thread is in, and writes that down. It does not stop the program, and it does not need any change to the code. Because it only reads, it adds very little overhead to the program being watched. It is a separate tool, installed with `pip install py-spy`.

Here is the "stuck" simulation. Each run drops a vehicle from about 1,000 m and steps it forward in time until it reaches the ground:

```python
# sim.py: a Monte Carlo landing simulation that "seems stuck".
import math, random, time

def drag(v, rho=1.225, cd=0.8, area=10.0):
    return 0.5 * rho * v * v * cd * area

def propagate(alt, vel, dt=0.001):
    while alt > 0.0:
        vel += (-9.80665 + drag(vel) / 25000.0) * dt
        alt += vel * dt
    return vel

def monte_carlo(runs):
    worst = 0.0
    for k in range(runs):
        v = propagate(1000.0 + random.random() * 50.0, -60.0)
        worst = min(worst, v)
    return worst

print(monte_carlo(1_000_000))
```

It is started in one terminal with `python3 sim.py`. In another terminal, you find its **process ID** (PID), the number the operating system uses to name a running program, with `pgrep -f sim.py`. Then you ask py-spy three different questions.

### py-spy dump: where is it right now?

`py-spy dump` prints the current call stack of every thread, once, like a single photograph:

```text
$ py-spy dump --pid 21525
Process 21525: python3 sim.py
Python v3.11.15 (/usr/bin/python3.11)

Thread 21525 (active+gil)
    propagate (sim.py:9)
    monte_carlo (sim.py:16)
    <module> (sim.py:20)
```

Read it top to bottom as newest to oldest, like gdb's `bt`: the program is on line 9 of `propagate`, called from line 16 of `monte_carlo`, called from line 20 at the top level. Add `--locals` and py-spy also prints each frame's variables:

```text
$ py-spy dump --locals --pid 21585
...
    monte_carlo (sim.py:16)
        Arguments:
            runs: 1000000
        Locals:
            worst: -138.81040921671118
            k: 12680
            v: -137.24979623973988
```

That is the answer to "is it stuck?". It is not stuck: it is on run number `k = 12680` out of `runs = 1000000`. It was asked to do a million runs, and that takes a while. This photograph was taken about 3 seconds after the start.

::: example How long will it take?
Use the dump to estimate the finish time. In about 3 s it finished 12,680 runs, so it manages about $12680 / 3 \approx 4230$ runs per second.

For a million runs: $1\,000\,000 / 4230 \approx 236$ s, or about 3.9 minutes on the computer that took the dump. That is a sanity check you can do on any long job in thirty seconds, without stopping it: take two dumps some seconds apart, compare the loop counter, and divide.

If the counter had not moved between two dumps, and the stack showed the same line both times, *that* would suggest a real hang, and the dump would already tell you which line it is stuck on.
:::

### py-spy top: where does the time go, live?

`py-spy top` shows a live table that updates every second, like the Linux `top` command but for Python functions:

```text
$ py-spy top --pid $(pgrep -f sim.py)
Collecting samples from 'python3 sim.py' (python v3.11.15)
Total Samples 400
GIL: 100.00%, Active: 100.00%, Threads: 1

  %Own   %Total  OwnTime  TotalTime  Function (filename)
 70.00% 100.00%    2.73s     4.00s   propagate (sim.py)
 30.00%  30.00%    1.27s     1.27s   drag (sim.py)
  0.00% 100.00%   0.000s     4.00s   <module> (sim.py)
  0.00% 100.00%   0.000s     4.00s   monte_carlo (sim.py)
```

**%Own** is the share of samples in which that function itself was running. **%Total** also counts time spent in the functions it called. `monte_carlo` has 0 percent own time but 100 percent total, because it does nothing itself except call `propagate`. `propagate` spends 70 percent of samples on its own lines and calls `drag` for the other 30. The **[[GIL|gil]]** line says the program held Python's global lock 100 percent of the time: it was busy computing Python code the whole time, not waiting on a disk or network.

### py-spy record: a profile you can keep

`py-spy record` samples for a while and saves the result to a file. By default it writes a **flame graph**, an SVG picture you open in a web browser:

```text
$ py-spy record -o prof.svg -d 3 --pid 21525
py-spy> Sampling process 100 times a second for 3 seconds. Press Control-C to exit.
py-spy> Wrote flamegraph data to 'prof.svg'. Samples: 299 Errors: 0
```

`-d 3` means "for 3 seconds". At the default 100 samples per second, 3 seconds gives about 300 samples, and it took 299. You can also let py-spy start the program for you, which avoids looking up a PID: `py-spy record -o prof.svg -- python3 sim.py`. Everything after `--` is the command to run. Flame graphs get a full treatment in lesson 09, when you profile C++ with perf.

::: key
py-spy is a sampling profiler that attaches to a live Python process by PID, with no code change and no restart: `py-spy dump --pid N` (the stack now, `--locals` for variables), `py-spy top --pid N` (live table), `py-spy record -o prof.svg --pid N` (flame graph).
:::

::: warning Permission to look
Reading another process's memory is a privilege on Linux. If py-spy says it cannot attach to a process you did not start from it, run it with `sudo`, or launch the program through py-spy (`py-spy record -- python3 sim.py`), which is always allowed. Inside a Docker container, the container must be started with `--cap-add SYS_PTRACE`. This is the same **[[ptrace|ptrace]]** rule that governs `gdb -p` from lesson 05.
:::

## Choosing the right tool

Pick by the question. "Why is this value wrong?" or "Why did it crash?": pdb, because you need to see and change variables and can afford to stop. "Is it stuck?" or "Where does the time go?" in a program already running: py-spy, `dump` first, then `top` or `record`.

One limit: py-spy shows Python functions. Time spent inside compiled code, such as a big NumPy matrix product, shows up as the Python line that called it. The `--native` option adds the C and C++ frames; for more depth you are back to gdb and perf.

## Check yourself

::: check
Your script is paused at `(Pdb)` inside a function with a variable called `c`. You type `c` to see its value. What happens, and what should you have typed?
:::

::: answer
`c` is the pdb command for continue, so the program resumes running and you lose the stop. pdb commands win over variable names. To see the variable, type `p c` (print it). To change it, type `!c = 5`; the `!` tells pdb that the line is a Python statement, not a command.
:::

::: check
A function has been giving wrong answers only for very large inputs, one call in a thousand. How would you stop exactly on the bad calls, without editing the file and without stepping through 999 good calls? And if you were allowed to edit the file?
:::

::: answer
Without editing, start with `python3 -m pdb script.py` and set a conditional breakpoint on a line inside the function, for example `b 12, x > 1e6`, then `c`. pdb evaluates the condition each time line 12 is reached and stops only when it is true. With editing allowed, put `if x > 1e6: breakpoint()` in the function and run the script normally; it pauses only in the rare case. Either way the 999 good calls run at full speed.
:::

::: check
You find three `breakpoint()` calls left in a data pipeline that is about to run in the nightly job. You cannot change the code tonight. What can you do, and why does it work?
:::

::: answer
Run the job with the environment variable `PYTHONBREAKPOINT=0`, for example `PYTHONBREAKPOINT=0 python3 pipeline.py`. `breakpoint()` checks that variable every time it is called, and the value `0` makes it do nothing, so all three calls become no-ops and the job runs straight through. Then remove them from the code properly the next day.
:::

::: check
A Python process launched eight hours ago has printed nothing for the last hour. Name the first command you would run, what you would look for in its output, and how you would tell "slow" from "stuck".
:::

::: answer
`py-spy dump --locals --pid <PID>`, after finding the PID with `pgrep -f`. Note the function, the line, and any loop counters. Run the same dump a minute later. If the counters moved, it is making progress, and their speed gives the finish time. If the same line and values show both times, it is stuck, and the stack says where. Nothing about this stops or restarts the eight-hour run.
:::

::: check
In a `py-spy top` table, a function shows `%Own 0.00%` and `%Total 100.00%`. What does that tell you about it? Would making its own lines faster help?
:::

::: answer
It is on the call stack in every sample (100 percent total) but was never the function actually running (0 percent own). So all of its time is spent inside the functions it calls; it is an outer loop or a driver, like `monte_carlo` calling `propagate`. Making its own lines faster would change nothing measurable. The time lives in its callees, so look at the functions with high %Own instead.
:::

## Summary

| Tool or idea | What it is for | How to use it |
|---|---|---|
| pdb | Stop a Python program and inspect or change it | `python3 -m pdb script.py`; `b`, `c`, `n`, `s`, `r`, `p`, `w`, `u`/`d` |
| Conditional breakpoint | Stop only in the interesting case | `b 12, x > 1e6` |
| Post-mortem | Land on the line that raised the exception | `python3 -m pdb -c continue script.py`, or `pdb.pm()` |
| `breakpoint()` | A pause written into the code (Python 3.7+) | Program runs normally, opens pdb there |
| `PYTHONBREAKPOINT=0` | Turn every `breakpoint()` into a no-op | Set it in automated jobs |
| `py-spy dump` | One snapshot of every thread's stack in a live process | `py-spy dump --pid N` (`--locals`) |
| `py-spy top` | Live table of where the time goes | `%Own` versus `%Total` |
| `py-spy record` | Saved profile, flame graph by default | `py-spy record -o prof.svg --pid N` |

The next lesson goes back to C++ and hands some of the hunting to the compiler itself: sanitizers that catch memory errors, undefined behavior and data races the moment they happen, and Valgrind, which checks a program you cannot even rebuild.

::: context impulse-meaning Thrust times time
Impulse is how much "push" an engine delivers in total: thrust multiplied by how long it acts, measured in newton-seconds (N·s). A 1,000 N engine firing for 2 s delivers 2,000 N·s, the same as a 2,000 N engine firing for 1 s. When the thrust varies, you add up thrust times time over many short slices, which is exactly what `burn.py` does. Total impulse is what sets how much a burn changes a spacecraft's velocity, so an integral that skips a sample makes a maneuver come out short.
:::

::: context post-mortem-word After death
*Post mortem* is Latin for "after death". Doctors use it for an examination to find out why someone died; engineers borrowed it for any review after a failure, and a "post-mortem meeting" on a software team is a review of what went wrong. For a debugger it is literal: the program has already died of an uncaught exception, but its last stack frames are still in memory, so you can walk through them and read every variable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" font-weight="700" fill="#1f2a44">Frames kept after the exception</text>
  <rect x="20" y="30" width="200" height="34" fill="#fff" stroke="#1f2a44"/>
  <text x="30" y="46" font-size="12" fill="#1f2a44">&lt;module&gt;  line 11</text>
  <text x="30" y="59" font-size="11" fill="#6c7a93">n = 2, line = 'alt=1374.2,...'</text>
  <rect x="20" y="74" width="200" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="30" y="90" font-size="12" fill="#1f2a44">parse  line 6</text>
  <text x="30" y="103" font-size="11" fill="#1f2a44">field = 'vel=', value = ''</text>
  <text x="30" y="132" font-size="12" fill="#b4232c">ValueError raised here</text>
  <line x1="120" y1="108" x2="120" y2="120" stroke="#b4232c" stroke-width="2"/>
  <line x1="240" y1="91" x2="290" y2="91" stroke="#1d6fd1" stroke-width="2"/>
  <text x="296" y="95" font-size="12" fill="#1d6fd1">you start</text>
  <line x1="265" y1="84" x2="265" y2="54" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="265,47 260,57 270,57" fill="#1d6fd1"/>
  <text x="274" y="62" font-size="12" fill="#1d6fd1">u</text>
</svg>
```

pdb opens on the frame that raised the error; `u` climbs to the caller.
:::

::: context pep-553 How Python grows
A PEP, a Python Enhancement Proposal, is a design document that proposes a change to the language and argues for it in public. PEP 553 proposed the built-in `breakpoint()` function together with the `PYTHONBREAKPOINT` environment variable, and it became part of Python 3.7. Its argument was practical: `import pdb; pdb.set_trace()` is long to type, easy to get wrong, and ties the code to one debugger. `breakpoint()` asks a hook, `sys.breakpointhook`, what to do, so the choice of debugger moves out of the code and into the environment.
:::

::: context env-var Settings that a program inherits
An environment variable is a named piece of text that every program receives from whatever started it, such as your shell. `PATH`, which lists the folders to search for commands, is the most famous one. Writing `PYTHONBREAKPOINT=0 python3 gain.py` sets the variable for that one command only; `export PYTHONBREAKPOINT=0` sets it for everything started from that shell afterwards. Build and test systems use environment variables for exactly this kind of switch, because it changes behavior without changing code.
:::

::: context sampling-profiler Taking photographs instead of filming
A sampling profiler does not record every function call. It takes a quick snapshot of the call stack at regular intervals, by default 100 times a second for py-spy, and counts. If `drag` is on top of the stack in 30 of 100 snapshots, it is using about 30 percent of the time. With more samples the estimate gets better. The benefit is low overhead: the program runs at almost its normal speed, which a tool that records every call cannot promise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" font-weight="700" fill="#1f2a44">Time, with a sample every 10 ms</text>
  <rect x="20" y="40" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="90" y="40" width="30" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="120" y="40" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="190" y="40" width="30" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="220" y="40" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="290" y="40" width="30" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="25" y1="32" x2="25" y2="74"/><line x1="55" y1="32" x2="55" y2="74"/><line x1="85" y1="32" x2="85" y2="74"/><line x1="115" y1="32" x2="115" y2="74"/><line x1="145" y1="32" x2="145" y2="74"/><line x1="175" y1="32" x2="175" y2="74"/><line x1="205" y1="32" x2="205" y2="74"/><line x1="235" y1="32" x2="235" y2="74"/><line x1="265" y1="32" x2="265" y2="74"/><line x1="295" y1="32" x2="295" y2="74"/>
  </g>
  <rect x="20" y="92" width="14" height="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="102" font-size="12" fill="#1f2a44">propagate: 7 of 10 samples</text>
  <rect x="200" y="92" width="14" height="12" fill="#f2b880" stroke="#1f2a44"/>
  <text x="220" y="102" font-size="12" fill="#1f2a44">drag: 3 of 10</text>
  <text x="20" y="124" font-size="11" fill="#6c7a93">Red ticks are the moments py-spy looks.</text>
</svg>
```
:::

::: context gil One lock for the whole interpreter
The standard Python interpreter, CPython, has a Global Interpreter Lock: only one thread at a time may run Python code. A thread waiting for a file, a network reply or a sleep lets go of the lock. So py-spy's "GIL: 100%" means some thread was running Python code in every sample; the program is busy computing. A low GIL figure with a slow program suggests it is waiting on something outside Python instead, and making the Python faster would not help. Newer Python versions offer an optional build without the GIL, but the standard build still has it.
:::

::: context ptrace The rule about looking into other programs
Linux guards the right to read or control another process with the same permission that debuggers use, named after the `ptrace` system call. Many distributions restrict it further so that an ordinary user can only attach to their own child processes. That is why `gdb -p` and `py-spy --pid` may need `sudo`, while `py-spy record -- python3 sim.py`, where the program is py-spy's own child, does not. It is a security rule: a program that can read another's memory could read its passwords.
:::
