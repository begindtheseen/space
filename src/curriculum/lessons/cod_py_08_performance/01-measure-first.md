---
id: l01-measure-first
title: Measure first, then change the code
minutes: 24
covers:
  - 'Measure first: timeit, cProfile, pstats, snakeviz, line_profiler, memory_profiler'
---

Suppose you are late for school every morning, and you decide the shower is the problem. You take faster showers for a week. You are still late. Then one morning you time everything with a stopwatch, and the shower turns out to be four minutes. Looking for your shoes is twelve. You were fixing the wrong thing, and you only found out because you measured.

Slow programs are like slow mornings. People are sure they know which part is slow, and they are usually wrong. The complicated-looking maths in an integrator is often fast. A boring one-line table lookup is often where the time goes. The cure is a stopwatch for code.

This module is about making Python simulations fast enough to be useful. A GNC team runs a **[[Monte Carlo dispersion|dispersion]]** — the same flight simulated hundreds of times with slightly different winds, masses and engine thrusts — to see how far the landing point can wander. If one run takes five seconds, a thousand runs take over an hour, and every guidance change waits on that hour. This first lesson gives you the stopwatches: `timeit` for small pieces, `cProfile` and `pstats` for the whole program, `snakeviz` for a picture of it, `line_profiler` for single lines and `memory_profiler` for memory.

## Guessing is not measuring

A **hotspot** is the small part of a program where most of the time goes. In most programs a few functions eat most of the runtime, and the rest barely matter. Speeding up anything other than the hotspot makes the code harder to read and the program no faster.

Before you change one line, you want two things:

- a **baseline** — a number for how long the real job takes right now, measured the same way you will measure it afterward;
- a **profile** — a breakdown of where that time goes, function by function.

The baseline lets you say "it went from 0.95 seconds to 0.06 seconds" instead of "it feels faster". It also catches a change that made things worse, which happens more often than you would think.

::: key
First rule of optimization: measure. Profile the real workload, find where the time actually is, and record a baseline number. Engineers guess wrong about hotspots most of the time, and without a baseline you cannot prove the change helped.
:::

## A small simulator to practice on

Here is a toy model of a sounding rocket's coast phase. It launches straight up at some speed, gravity and air drag slow it down, and it falls back. The function `run_case` steps it forward in time until it hits the ground and returns the flight time. `run_all` runs twenty cases with random launch speeds, like a tiny dispersion. Save it as `sim.py`.

```python
import math
import numpy as np

def density_table():
    # exponential atmosphere sampled every 500 m up to 100 km
    heights = [500.0 * i for i in range(201)]
    rhos = [1.225 * math.exp(-h / 8500.0) for h in heights]
    return heights, rhos

def density(h):
    heights, rhos = density_table()
    return float(np.interp(h, heights, rhos))

def gravity(h):
    r = 6.371e6 + h
    return 3.986e14 / r**2

def derivs(h, v, m):
    rho = density(h)
    drag = 0.5 * rho * v * abs(v) * 0.3 * 1.2   # Cd * area
    return v, -gravity(h) - drag / m

def run_case(v0, m=25.0, dt=0.01):
    h, v, t = 0.0, v0, 0.0
    while h >= 0.0:
        dh, dv = derivs(h, v, m)
        h += dh * dt
        v += dv * dt
        t += dt
    return t

def run_all(n=20):
    rng = np.random.default_rng(1)
    return [run_case(v0) for v0 in rng.uniform(250.0, 350.0, n)]
```

Before reading on, guess which function is slowest. Most people pick `run_case`, because it has the loop, or `gravity`, because it has the physics.

## timeit: a stopwatch for small pieces

The simplest stopwatch is `time.perf_counter()`. It reads a [[high-resolution clock|perf-counter]] in seconds. Read it before and after, and subtract.

```python
import time
import sim

t0 = time.perf_counter()
sim.run_all()
t1 = time.perf_counter()
print(f"{t1 - t0:.3f} s")   # about 1 s on one machine
```

One reading is not enough. The computer is doing other things at the same time, and the first run pays one-time costs like loading files. So the standard library gives you **`timeit`**, a module that runs a piece of code many times and hands you back the times. `timeit.repeat` runs the statement `number` times in a row, measures that whole batch, and does the batch `repeat` times.

```python
import timeit
import sim

times = timeit.repeat(sim.run_all, number=1, repeat=5)
print([round(t, 3) for t in times])   # [1.052, 0.967, 0.956, 0.951, 0.963]
print("best:", round(min(times), 3), "s")   # best: 0.951 s
```

These numbers came from one machine, a 2.1 GHz Intel Xeon in the cloud. Yours will differ, and they do not even repeat exactly on the same machine. The first run was the slowest; the rest sit within about 2 percent of each other. The **minimum** is usually the fairest single number, because noise from the rest of the computer can only ever add time, never take it away. The last lesson in this module, on benchmark methodology, goes into how to report a timing honestly.

For a tiny piece of code, `timeit` repeats it thousands of times so the total is long enough to measure. From a terminal:

```text
python -m timeit -s "import sim" "sim.density(12_000.0)"
10000 loops, best of 5: 32.9 usec per loop
```

The `-s` part is **setup**: it runs once and is not timed. `usec` means microseconds, millionths of a second. So one call to `density` takes about $33\,\mu\mathrm{s}$ (read "$\mu$s" as "microseconds"). In a Jupyter notebook the same thing is written `%timeit sim.density(12_000.0)`.

::: example Is 33 microseconds a lot?
**The question.** A call to `density` costs about $33\,\mu\mathrm{s}$ and a call to `gravity` about $86\,\mathrm{ns}$ (nanoseconds, billionths of a second). The 20-case run calls each one 29,500 times. How much of the 0.95-second baseline can each one explain?

**Density.** Multiply the cost per call by the number of calls:

$$
29{,}500 \times 33 \times 10^{-6}\,\mathrm{s} \approx 0.97\,\mathrm{s}.
$$

**Gravity.** The same sum:

$$
29{,}500 \times 86 \times 10^{-9}\,\mathrm{s} \approx 0.0025\,\mathrm{s}.
$$

**Sense check.** The density calls alone add up to about the whole baseline, and gravity is a quarter of one percent of it. But this needed the call count, which you would not normally know. A profiler gives you counts and times together, for every function at once.
:::

## cProfile and pstats: where does the time go?

A **profiler** is a tool that watches a program run and records where the time went. Python ships with one called **`cProfile`**. It is a **[[deterministic profiler|deterministic-profiler]]**: it notes the clock at every function call and every return, so it catches every call and counts them exactly. Its partner module **`pstats`** sorts and prints what it recorded.

```python
import cProfile
import pstats
import sim

with cProfile.Profile() as pr:
    sim.run_all()

stats = pstats.Stats(pr).strip_dirs().sort_stats("cumulative")
stats.print_stats(6)
```

The output looks like this (times from one machine on Python 3.11, first few lines trimmed; Python 3.12 and later fold list comprehensions into their function, so the `<listcomp>` row disappears there):

```text
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.000    0.000    2.344    2.344 sim.py:32(run_all)
        1    0.000    0.000    2.329    2.329 sim.py:34(<listcomp>)
       20    0.025    0.001    2.329    0.116 sim.py:23(run_case)
    29500    0.100    0.000    2.304    0.000 sim.py:18(derivs)
    29500    0.053    0.000    2.186    0.000 sim.py:10(density)
    29500    0.035    0.000    1.689    0.000 sim.py:4(density_table)
```

Each row is one function. Here is how to read the columns:

- **ncalls** — how many times it was called. These counts do not depend on the machine: you will see 29500 too.
- **tottime** — the total time spent inside the function's own lines, *not* counting the functions it called.
- **cumtime** — the **cumulative time**: the function's own time *plus* everything it called, all the way down.
- **percall** — the time divided by the number of calls, once for each of the two columns before it.

The difference between [[tottime and cumtime|tottime-cumtime]] is the most useful thing to understand here. `run_case` has a huge cumtime (2.329 s) but a tiny tottime (0.025 s). It is not slow itself. It calls something slow. Walk down the cumtime column and watch where the time goes: `derivs` holds 2.304 s, and of that `density` holds 2.186 s, and of that `density_table` holds 1.689 s. The hotspot is not the loop, not the integrator and not gravity. It is the function that rebuilds a 201-row atmosphere table from scratch, every single time anyone asks for the air density.

`sort_stats("cumulative")` sorts by cumtime, which is how you walk down from the top. `sort_stats("tottime")` sorts by own time, which picks out the leaves: the functions actually burning the time. `strip_dirs()` shortens long file paths, and `print_stats(6)` prints only the top six rows.

::: key
cProfile gives per-function call counts and cumulative time for the whole program, which is how you find the hot function. line_profiler then shows the time per line inside that one function. Use them in that order.
:::

::: warning The profiler slows the program down
Under `cProfile` the run took 2.34 s instead of 0.95 s. The profiler does a little bookkeeping on every call, so code that makes many small calls looks slower than it really is, and its share of the total gets inflated. Use the profile to find *where* the time is. Then take the profiler away and time the fix with `timeit`, against the baseline you measured the same way.
:::

You can also profile a whole script from the terminal and save the result to a file:

```text
python -m cProfile -s cumulative sim_script.py
python -m cProfile -o sim.prof sim_script.py
```

The first prints the sorted table. The second saves the raw data to `sim.prof`, which `pstats.Stats("sim.prof")` can load later.

## snakeviz: a picture of the profile

A long table is hard to take in. **`snakeviz`** reads a `.prof` file and draws it in your web browser:

```text
snakeviz sim.prof
```

It draws an **[[icicle chart|icicle]]**. The top bar is the whole program. Under each bar sit the functions it called, each one as wide as its cumtime. A fat bar with a fat bar under it means "the time is passing through here, keep looking down". The widest bar at the bottom of a stack is your hotspot. For `sim.py`, `density_table` hangs under `density` and fills most of the width. The numbers are the same as in `pstats`; the picture makes the shape of the call tree easy to see.

## line_profiler: which line inside the function?

cProfile has told you which function. Now you want to know which line. **`line_profiler`** times every line of the functions you pick. You can use it from Python:

```python
from line_profiler import LineProfiler
import sim

lp = LineProfiler()
lp.add_function(sim.density)
lp.add_function(sim.density_table)
lp.runcall(sim.run_all)
lp.print_stats(output_unit=1e-3)   # report times in milliseconds
```

Part of the output (times from one machine):

```text
Line #      Hits         Time  Per Hit   % Time  Line Contents
==============================================================
     4                                           def density_table():
     5                                               # exponential atmosphere ...
     6     29500        643.4      0.0     34.0      heights = [500.0 * i for i in range(201)]
     7     29500       1241.0      0.0     65.7      rhos = [1.225 * math.exp(-h / 8500.0) for h in heights]
     8     29500          5.4      0.0      0.3      return heights, rhos
```

**Hits** is how many times the line ran. **Time** is the total time on that line, here in milliseconds. **% Time** is its share of the function. Line 7 alone costs 1.24 s: it calls `math.exp` 201 times per call, and that adds up to 29,500 × 201 = 5,929,500 calls to `math.exp` for a table that never changes.

The more common way to use it is from the terminal. Put `@profile` on the function you care about (you do not import anything; the tool provides the name), then run the script with **[[kernprof|kernprof]]**:

```text
kernprof -l -v sim_script.py
```

`-l` means line by line, and `-v` means show the results when it finishes. Remove the `@profile` lines when you are done, because plain `python` does not know that name.

::: warning Do not line-profile the whole program
line_profiler adds much more overhead than cProfile, and it only makes sense inside one or two functions. Run cProfile first to find the function, then point line_profiler at that function. Starting with line_profiler is like searching a city house by house for your lost keys instead of first asking which street you dropped them on.
:::

## The fix, and proving it

The table depends on nothing that changes during the flight. So build it once, when the module loads, and store it as NumPy arrays. Replace `density_table` and `density` with:

```python
import numpy as np

HEIGHTS = np.arange(201) * 500.0
RHOS = 1.225 * np.exp(-HEIGHTS / 8500.0)

def density(h):
    return float(np.interp(h, HEIGHTS, RHOS))
```

Now measure again, the same way as the baseline. Five repeats, one run each:

```text
[0.061, 0.065, 0.062, 0.066, 0.064]   best: 0.061 s   (same machine)
```

And check that the answers did not change. The twenty flight times come out identical to the old ones, with a largest difference of exactly 0.0. A speed-up that changes the answer is a bug.

::: example How big was the win?
**Before.** Best of five: 0.951 s.

**After.** Best of five: 0.061 s.

**The ratio.** The **speed-up** is the old time divided by the new time:

$$
\frac{0.951\,\mathrm{s}}{0.061\,\mathrm{s}} \approx 15.6.
$$

**Per call.** `timeit` puts the new `density` at about $1.0\,\mu\mathrm{s}$ against $33\,\mu\mathrm{s}$ before, about 33 times faster. The whole program gained less than that, 15.6 times, because the rest of the loop (the integrator, `gravity`, `np.interp` itself) did not get any faster and now takes a bigger share.

**Sense check.** A thousand-case dispersion goes from about $1000/20 \times 0.951 \approx 48$ seconds to about 3 seconds. All of it came from moving two lines, found by measuring, not by rewriting the integrator.
:::

This kind of fix, building something once instead of every call, is so common that a later lesson in this module is devoted to it: caching and precomputation.

## How much can one fix buy? Amdahl's law

Here is a question to ask before you spend a day on any function: if I made it infinitely fast, how much faster would the whole program get? The answer is called **[[Amdahl's law|amdahl]]**.

Say a fraction $p$ of the runtime is spent in the part you are speeding up, and you make that part $s$ times faster. The rest, a fraction $1 - p$, stays the same. The new runtime, as a fraction of the old, is

$$
(1 - p) + \frac{p}{s},
$$

so the overall speed-up $S$ (read "capital S") is

$$
S = \frac{1}{(1 - p) + p/s}.
$$

Even with $s$ as large as you like, the $p/s$ term shrinks to zero and $S$ can never beat $1/(1 - p)$. A function that takes 10 percent of the time can give at most $1/0.9 \approx 1.11$, an 11 percent gain, however clever the rewrite.

::: example Choosing what to fix in a landing dispersion
**The profile.** A 1,000-case landing dispersion takes 3 hours. cProfile says 60 percent of the time is in the aerodynamic table lookup, 25 percent in the integrator, and 15 percent in everything else. A teammate offers to make the integrator 10 times faster. You could instead make the aero lookup 10 times faster.

**Integrator.** Here $p = 0.25$ and $s = 10$:

$$
S = \frac{1}{0.75 + 0.025} = \frac{1}{0.775} \approx 1.29.
$$

Three hours becomes about $3 / 1.29 \approx 2.3$ hours.

**Aero lookup.** Here $p = 0.60$ and $s = 10$:

$$
S = \frac{1}{0.40 + 0.06} = \frac{1}{0.46} \approx 2.17.
$$

Three hours becomes about $3 / 2.17 \approx 1.4$ hours.

**The ceiling.** Even an infinitely fast aero lookup gives at most $1/0.40 = 2.5$, so 1.2 hours. To go further you would have to shrink the other 40 percent too. The profile told you which job was worth doing before anyone wrote code.
:::

::: note Why it has to be true
Call the old runtime $T$. The part you do not touch took $(1-p)T$ and still does. The part you speed up took $pT$ and now takes $pT/s$. So the new runtime is $T_{\text{new}} = (1-p)T + pT/s$. The speed-up is the old time over the new time, and the $T$ cancels:

$$
S = \frac{T}{(1-p)T + pT/s} = \frac{1}{(1-p) + p/s}.
$$

As $s$ grows, $p/s$ heads to $0$, so $S$ heads to $1/(1-p)$ and never passes it.
:::

## memory_profiler: where does the memory go?

Memory runs out too. A dispersion that stores every time step of every case can fill the computer's memory, and then it crashes or slows to a crawl. **`memory_profiler`** measures memory the way line_profiler measures time: line by line. Put `@profile` on the function (here it is imported from `memory_profiler`) and run the file with `python -m memory_profiler`.

```python
# mem.py -- run with:  python -m memory_profiler mem.py
import numpy as np
from memory_profiler import profile

@profile
def dispersion_table(n_cases=500, n_steps=20_000):
    rng = np.random.default_rng(0)
    t = np.linspace(0.0, 200.0, n_steps)
    v0 = rng.normal(300.0, 5.0, size=(n_cases, 1))
    v = v0 - 9.81 * t          # 500 x 20000 float64
    h = v0 * t - 4.905 * t**2  # another one
    return h.max(axis=1), v[:, -1]

if __name__ == "__main__":
    dispersion_table()
```

The interesting lines of the report:

```text
Line #    Mem usage    Increment  Occurrences   Line Contents
=============================================================
    10    115.1 MiB     76.4 MiB           1       v = v0 - 9.81 * t          # 500 x 20000 float64
    11    191.6 MiB     76.4 MiB           1       h = v0 * t - 4.905 * t**2  # another one
```

**Mem usage** is the memory the whole process holds after the line runs. **Increment** is how much that line added. The unit **[[MiB|mib]]** is a mebibyte, 1,048,576 bytes. Each of those lines builds a 500-by-20,000 grid of 8-byte numbers: $500 \times 20{,}000 \times 8 = 80{,}000{,}000$ bytes, which is 76.3 MiB. The report agrees. The exact starting number (the "Mem usage" before your code runs) depends on your machine, but the increments are the arrays themselves and come out the same.

For a single number, the highest memory the function ever reached, `memory_usage` from the same package runs a function and samples memory while it runs; pass `max_usage=True` to get the peak. The lesson after next uses these tools to catch vectorized code that is quietly using far more memory than its result needs.

## The order of attack

Profiling is step one of a longer plan, and the rest of this module follows that plan in order. When a simulation is too slow:

1. **Profile** it, and record a baseline.
2. **Fix the algorithm.** If the work grows too fast as the problem grows, no amount of tuning will save it. That is the next lesson.
3. **Remove redundant work**: things computed again and again that could be computed once, like the atmosphere table above.
4. **Vectorize**: hand whole arrays to NumPy instead of looping in Python.
5. **Compile** the scalar hotspot that is left, with Numba or C++.
6. **Parallelise** across cases, running many at once on many cores.

The order matters because the wins multiply. A 15-fold win from a fixed hotspot, then a 4-fold win from four cores, gives 60-fold. Parallelising first gives 4-fold, and spreads the same waste over more cores.

::: key
Order of attack when a simulation is too slow: profile, fix the algorithm, remove redundant work and recomputation, vectorize, then compile the remaining scalar hotspot with Numba or C++, then parallelise across cases. Parallelising a bad algorithm just buys you the same waste on more cores.
:::

::: warning Profile the real workload
A tiny test case can have a completely different hotspot. With 10 time steps, startup costs like importing NumPy dominate; with a million, the inner loop does. Profile one realistic case of the dispersion.
:::

## Check yourself

::: check
In a cProfile table, a function called `step` has tottime 0.02 s and cumtime 8.40 s, out of a 9-second run. Is `step` your hotspot? What do you do next?
:::

::: answer
Not by itself. Its own lines take only 0.02 s. The other 8.38 s are spent in functions that `step` calls. It is on the path to the hotspot, not the hotspot. Next, look at the rows for the functions it calls (sorted by cumulative time, they sit right below it) and follow the biggest cumtime downward until you reach a function whose tottime is large. That leaf is where the time is burned. Once you have that function, point line_profiler at it to find the line.
:::

::: check
A colleague times a function once with `time.perf_counter()`, gets 0.84 s, changes it, times it once more, and gets 0.79 s. She reports a 6 percent speed-up. What is missing?
:::

::: answer
A sense of the spread. In this lesson, five runs of the same unchanged code ranged from 0.951 to 1.052 s, a spread of about 10 percent. One before-and-after pair cannot separate a 6 percent change from that noise. She should time both versions several times with `timeit.repeat`, compare the minimums, and see whether the two sets overlap. If they do, she has not shown a change.
:::

::: check
Profiling says 30 percent of a run is in the drag model. What is the most the whole run can speed up if you make drag infinitely fast? And if you make it 3 times faster?
:::

::: answer
Amdahl's law with $p = 0.30$. Infinitely fast means $p/s \to 0$, so $S = 1/(1 - 0.30) = 1/0.70 \approx 1.43$, a 43 percent gain at most. Three times faster means $s = 3$:

$$
S = \frac{1}{0.70 + 0.30/3} = \frac{1}{0.70 + 0.10} = \frac{1}{0.80} = 1.25.
$$

So the whole run gets 25 percent faster, even though drag got three times faster.
:::

::: check
Why does the lesson say to time the fix with `timeit` rather than read the new speed from cProfile?
:::

::: answer
cProfile adds bookkeeping to every function call. In this lesson the run took 2.34 s under the profiler against 0.95 s without it. Code with many small calls is slowed more than code with few big calls, so profiled times distort the proportions and the totals. The profile is the right tool to find where the time is. The claim "it is now N times faster" should compare two measurements taken the same way, without the profiler, like the baseline.
:::

::: check
In the memory report, one line shows an increment of 152.6 MiB and builds a single array of float64 numbers with 2,000 rows. About how many columns does the array have?
:::

::: answer
Convert to bytes: $152.6 \times 1{,}048{,}576 \approx 1.60 \times 10^8$ bytes. Each float64 is 8 bytes, so that is about $2.0 \times 10^7$ numbers. Divide by 2,000 rows: about 10,000 columns. (Check: $2000 \times 10{,}000 \times 8 = 1.6 \times 10^8$ bytes, which is 152.6 MiB.)
:::

## Summary

| Tool or idea | What it tells you | How to use it |
|---|---|---|
| Baseline | How long the real job takes now | Measure before any change, the same way as after |
| `time.perf_counter()` | One reading of a precise clock | Read before and after, subtract |
| `timeit` | Repeated timings of a statement | `timeit.repeat(f, number=1, repeat=5)`, report the min and the spread |
| `cProfile` + `pstats` | Calls, tottime, cumtime per function | `sort_stats("cumulative")`, walk down to the hotspot |
| snakeviz | The profile as an icicle chart | `snakeviz sim.prof` |
| line_profiler | Time per line inside chosen functions | `@profile` then `kernprof -l -v`, or `LineProfiler` |
| memory_profiler | Memory added per line, or the peak | `python -m memory_profiler f.py`, `memory_usage(..., max_usage=True)` |
| Amdahl's law | The most one fix can buy | $S = 1/((1-p) + p/s) \le 1/(1-p)$ |
| Order of attack | What to try first | Profile, algorithm, redundancy, vectorize, compile, parallelise |

The next lesson takes step two of the order of attack: before tuning anything, check how the work grows as the input grows, because an algorithm that does $n^2$ work cannot be rescued by making each step faster.

::: context dispersion What a dispersion run is for
Real flights never go exactly to plan. The wind is different, the engine gives a percent more or less thrust, the rocket weighs a little more than the drawing says. A **dispersion** analysis draws each of these uncertain inputs at random from a realistic spread, runs the full simulation, and repeats hundreds or thousands of times. The cloud of results shows how far the landing point, the peak load or the fuel left over can stray. Teams rerun these whenever the guidance code changes, which is why a slow simulator slows the whole team down.
:::

::: context perf-counter Why not the wall clock
`time.time()` reads the calendar clock, which the computer may nudge while your code runs to keep it in step with internet time servers, and on some systems it only ticks every few milliseconds. `time.perf_counter()` is a separate counter made for measuring intervals: it never jumps backward, and it resolves well below a microsecond on a typical machine. Its value on its own means nothing; only the difference between two readings does.
:::

::: context deterministic-profiler Two kinds of profiler
A **deterministic** profiler like cProfile records every function call and return, so its call counts are exact, but the bookkeeping on each call adds overhead. A **sampling** profiler takes the other approach: it peeks at the program many times a second and notes which function is running, like taking snapshots. Over thousands of snapshots, the functions that show up most often are the ones using the time. Sampling adds far less overhead and can attach to a program that is already running, but its counts are estimates. `py-spy` is a popular sampling profiler for Python. Both answer the same question: where is the time?
:::

::: context tottime-cumtime Own time and total time
Think of `density`'s cumtime of 2.186 s as one bar. Only a thin sliver of it is `density`'s own work, its tottime. The rest belongs to the functions it called. The profiler's rows for those functions tell you how the rest splits up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44">density: cumtime 2.186 s</text>
  <rect x="20" y="32" width="320" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="32" width="7.8" height="30" fill="#b4232c"/>
  <rect x="27.8" y="32" width="247.2" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="275" y="32" width="65" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="151" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">density_table 1.689 s</text>
  <text x="307" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">interp</text>
  <line x1="24" y1="66" x2="24" y2="96" stroke="#b4232c" stroke-width="1.5"/>
  <text x="30" y="100" font-size="12" fill="#b4232c">tottime 0.053 s: density's own lines</text>
  <text x="307" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">0.444 s</text>
  <text x="20" y="130" font-size="12" fill="#1f2a44">cumtime = own time + everything it calls</text>
</svg>
```

Widths are to scale: 0.053 + 1.689 + 0.444 = 2.186 s.
:::

::: context icicle Reading an icicle chart
In snakeviz's icicle view, each row is one level deeper in the call tree, and each bar is as wide as that function's cumtime. The time flows downward like water. Where a wide bar sits on another wide bar, the time is passing through; the hotspot is where the width finally stops at a leaf. This sketch uses the profile of `sim.py`, drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="320" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">run_case 2.329 s</text>
  <rect x="20" y="43" width="316.6" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="178" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">derivs 2.304 s</text>
  <rect x="20" y="71" width="300.4" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="170" y="87" font-size="12" text-anchor="middle" fill="#1f2a44">density 2.186 s</text>
  <rect x="20" y="99" width="232.1" height="24" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <text x="136" y="115" font-size="12" text-anchor="middle" fill="#ffffff">density_table 1.689 s</text>
  <rect x="252.1" y="99" width="61" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="282.6" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">interp</text>
  <text x="20" y="145" font-size="12" fill="#6c7a93">width = cumtime; red = the hotspot</text>
</svg>
```
:::

::: context kernprof Where the name comes from
line_profiler was written by Robert Kern, a long-time contributor to the scientific Python tools, and its launcher script is named after him: kernprof, "Kern's profiler". The `-l` flag turns on the line-by-line profiler; without it, kernprof runs cProfile instead.
:::

::: context amdahl The speed limit on any single fix
Gene Amdahl, a computer designer at IBM, made this argument in 1967 about computers with many processors: the part of a job that cannot be split up limits how much extra processors can help. The same sum governs any speed-up of one part of a program. Here is the landing-dispersion example from this lesson, drawn to scale with 100 percent as the full bar.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44">Before: 100%</text>
  <rect x="20" y="24" width="180" height="22" fill="#b4232c"/>
  <rect x="200" y="24" width="75" height="22" fill="#1d6fd1"/>
  <rect x="275" y="24" width="45" height="22" fill="#6c7a93"/>
  <text x="110" y="40" font-size="11" text-anchor="middle" fill="#ffffff">aero 60</text>
  <text x="237" y="40" font-size="11" text-anchor="middle" fill="#ffffff">integ 25</text>
  <text x="297" y="40" font-size="11" text-anchor="middle" fill="#ffffff">15</text>
  <text x="20" y="68" font-size="12" fill="#1f2a44">Integrator 10x faster: 77.5%</text>
  <rect x="20" y="74" width="180" height="22" fill="#b4232c"/>
  <rect x="200" y="74" width="7.5" height="22" fill="#1d6fd1"/>
  <rect x="207.5" y="74" width="45" height="22" fill="#6c7a93"/>
  <text x="20" y="118" font-size="12" fill="#1f2a44">Aero 10x faster: 46%</text>
  <rect x="20" y="124" width="18" height="22" fill="#b4232c"/>
  <rect x="38" y="124" width="75" height="22" fill="#1d6fd1"/>
  <rect x="113" y="124" width="45" height="22" fill="#6c7a93"/>
  <text x="20" y="162" font-size="11" fill="#6c7a93">bar length = runtime, 3 px per percent</text>
</svg>
```
:::

::: context mib Mebibytes and megabytes
Computer memory comes in powers of two, so tools often count in **mebibytes**: 1 MiB is $2^{20} = 1{,}048{,}576$ bytes. A **megabyte** (MB) is a round million bytes. The two differ by about 5 percent, and at the gigabyte scale ($2^{30}$ against $10^9$) by about 7 percent. memory_profiler reports MiB, so an 80,000,000-byte array shows up as 76.3 MiB, not 80.
:::
