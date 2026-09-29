---
id: l11-benchmark-methodology
title: Benchmarks you can believe
minutes: 24
covers:
  - 'Benchmark methodology: warmup, repetitions, frequency scaling, noise'
---

Say you want to know how fast you run 100 meters. You run it once, on a cold morning, into the wind, and the stopwatch says 16.2 seconds. Is that your time? Not really. A coach would have you warm up, run it several times, and write down the wind. One run tells you about that morning. Several runs, done the same way, tell you about you.

Timing code works the same way. A **benchmark** is a timing done carefully enough that you can compare it with another timing: the old code against the new, this machine against that one, today against last month. Every lesson in this module has made claims like "15.6 times faster". This last lesson is about what it takes for such a claim to be true.

It matters on real programs. A GNC team's dispersion harness might get a **[[performance regression gate|regression-gate]]** in its automated tests: a check that fails if a change makes the simulator slower. If the gate cannot tell a real slowdown from ordinary wobble, it is worse than useless.

## The same code, timed twice

Start with an experiment. Here is the Kepler's-equation solver from the caching lesson, solving $20{,}000$ orbit positions by Newton's method. Save it as `kepler_bench.py`; the later code in this lesson imports it. When you run the file, it times the same function twice in a row.

```python
import math, time

def solve_all(e=0.3, n=20_000):
    """Solve Kepler's equation for n mean anomalies by Newton's method."""
    out = []
    for i in range(n):
        M = 2 * math.pi * i / n
        E = M
        while True:
            dE = (E - e * math.sin(E) - M) / (1.0 - e * math.cos(E))
            E -= dE
            if abs(dE) < 1e-12:
                break
        out.append(E)
    return out

if __name__ == "__main__":
    t0 = time.perf_counter(); solve_all(); t1 = time.perf_counter()
    t2 = time.perf_counter(); solve_all(); t3 = time.perf_counter()
    first, second = (t1 - t0) * 1e3, (t3 - t2) * 1e3
    print(f"first {first:.2f} ms, second {second:.2f} ms, change {100 * (second - first) / first:+.1f}%")
# first 13.59 ms, second 12.42 ms, change -8.6%
```

Nothing changed between the two calls, yet the second was 8.6 percent faster. Running the program five times gave changes of $-8.6$, $+3.6$, $-3.8$, $-9.1$ and $+0.1$ percent.

All the timings in this lesson come from one machine: a 4-core 2.1 GHz Intel Xeon cloud server, shared with other work, running Python 3.11 and NumPy 2.4. Your numbers will be different. What carries over is the pattern.

That wobble is **noise** — the part of a timing that comes from the computer and not from your code. Had you changed one line between those two calls, you would have "measured" an 8.6 percent improvement that was never there.

So a timing needs four things before it means anything: a fixed input, a warmup, enough repetitions to see the spread, and a note of the conditions it was taken in. The rest of the lesson takes them one at a time.

::: key
How do you benchmark honestly? Fix the input, warm up, repeat enough times to see the spread, report the minimum and the variability, pin the frequency governor or note that you did not, and state the machine. A single timing number with no spread is not a measurement.
:::

## Fix the input

The time a function takes can depend on what you feed it. Newton's method needs more passes for a very stretched orbit than for a round one. So both versions you compare must get the same input, every time.

- Use the same sizes: the same number of cases, time steps and table points.
- Seed every random number generator, as in `np.random.default_rng(42)`, so the "random" input is identical on every run.
- Use a realistic size. The first lesson warned that a tiny case can have a different hotspot from the real one. A benchmark on ten time steps measures start-up, not the simulator.

## Warm up first

The first time code runs, it pays for things that later runs get for free:

- **Compilation.** A Numba `@njit` function is translated to machine code on its first call.
- **Loading.** Imports, tables read from disk and anything a function builds lazily on first use.
- **Fresh memory.** The first time a program touches a new block of memory, the operating system has to hand it over, a **[[page fault|page-fault]]** for each small page. The processor's fast memory caches also start out empty.
- **Clock speed.** A processor that was idle may be running slowly and take a moment to speed up.

Here is the biggest of these, measured.

```python
import time
import numpy as np
from numba import njit

@njit
def drag_sum(v, rho):
    total = 0.0
    for i in range(v.size):
        total += 0.5 * rho[i] * v[i] * v[i]
    return total

rng = np.random.default_rng(0)
v = rng.uniform(100.0, 300.0, 1_000_000)
rho = rng.uniform(0.1, 1.2, 1_000_000)

for call in range(1, 6):
    t0 = time.perf_counter()
    drag_sum(v, rho)
    t1 = time.perf_counter()
    print(f"call {call}: {(t1 - t0) * 1e3:8.2f} ms")
# call 1:   446.39 ms
# call 2:     1.80 ms
# call 3:     0.86 ms
# call 4:     0.92 ms
# call 5:     0.91 ms
```

The first call spent almost half a second compiling. The second call was still about twice as slow as the rest, a smaller one-time cost as memory and Numba's own bookkeeping settle after first use. From the third call on, the time is steady.

A **warmup** is a few untimed calls made before the timed ones, so that the one-time costs are paid before the stopwatch starts.

::: example What one cold call does to an average
**The five calls.** $446.39$, $1.80$, $0.86$, $0.92$ and $0.91\,\mathrm{ms}$.

**The mean (the ordinary average).** Add them up and divide by five: $(446.39 + 1.80 + 0.86 + 0.92 + 0.91)/5 = 450.88/5 \approx 90.2\,\mathrm{ms}$.

**The steady state.** The last three calls sit between $0.86$ and $0.92\,\mathrm{ms}$.

**The damage.** The mean says the function takes about $90\,\mathrm{ms}$, about a hundred times its real steady cost. One cold call wrecked the average.

**Sense check.** Called a million times in a dispersion, the function compiles once, half a second in total. The steady-state number is the one that predicts the dispersion's runtime.
:::

::: warning Decide what you are measuring
Both numbers are real. A command-line tool that runs once and exits lives in the cold-start world, and its users feel the compile every time. A Monte Carlo that calls a function a million times lives in the steady state. Say which one your benchmark measures. Never mix them by timing the first call along with the rest.
:::

## Repeat, and look at the spread

Once the code is warm, time it many times. `timeit.repeat` from the first lesson does this. It runs your function `number` times in a row and times the whole batch, then does that `repeat` times, and returns one time per batch.

```python
import statistics, timeit
from kepler_bench import solve_all

times = timeit.repeat(solve_all, number=1, repeat=30)
ms = sorted(t * 1e3 for t in times)
q1, med, q3 = statistics.quantiles(ms, n=4)
print(f"min {ms[0]:.1f}  median {med:.1f}  mean {statistics.mean(ms):.1f}  max {ms[-1]:.1f}")
print(f"IQR {q1:.1f} to {q3:.1f}  stdev {statistics.stdev(ms):.2f}")
# min 12.0  median 13.4  mean 14.2  max 22.9
# IQR 12.2 to 14.8  stdev 3.00
```

Four summaries of the same 30 times, and they disagree:

- the **minimum**, the fastest run: $12.0\,\mathrm{ms}$;
- the **median**, the middle run when they are sorted in order: $13.4\,\mathrm{ms}$;
- the **mean**, the ordinary average: $14.2\,\mathrm{ms}$;
- the **maximum**, the slowest run: $22.9\,\mathrm{ms}$, almost twice the minimum.

The times are **[[lopsided|skew]]**: bunched up near the minimum with a long tail of slow runs. That shape has a reason: noise can only ever add time. Another program grabbing the processor, a memory cache being flushed, the clock slowing down — none of these can make your code faster than its own cost. So the fastest runs had the least interference, and the slow ones got hit.

That is why the **minimum** is the steadiest estimate of what the code itself costs. The same 30-repeat experiment, run again a minute later, gave a minimum of $12.0\,\mathrm{ms}$ again, while the median moved from $13.4$ to $12.2$ and the maximum from $22.9$ to $17.9$.

The minimum is not the whole story, though. Your users do not get the best run every time. So report a measure of the **spread** as well. Two common ones:

- the **[[interquartile range|iqr]]** (IQR): the range that holds the middle half of the runs. Here $12.2$ to $14.8\,\mathrm{ms}$. Slow outliers barely move it.
- the **standard deviation**: a typical distance of a run from the mean. Here $3.00\,\mathrm{ms}$. A few very slow runs inflate it a lot, which makes it a poor fit for lopsided timings.

How many repeats? Enough that another batch gives about the same minimum and median. For millisecond code, 20 to 30 is a good start. For something that takes a minute, 5 may be all you can afford; then say so.

### Timing something very short

For very short code, set `number` larger. Reading `time.perf_counter()` itself costs about $64\,\mathrm{ns}$ on this machine, and one `math.sin` call costs about $22\,\mathrm{ns}$. Timing one `sin` call with the stopwatch would mostly measure the stopwatch. Run it a million times per batch (`number=1_000_000`) and divide, and the stopwatch cost becomes a rounding error. `python -m timeit` picks such a `number` for you.

::: warning timeit switches off the garbage collector
While it times, `timeit` turns off Python's **[[garbage collector|gc]]**. That makes timings steadier, but code that creates lots of objects can look faster than it will be in the real program, where the collector runs. If your code allocates heavily, compare with a plain `time.perf_counter()` loop, or pass `setup="gc.enable()"` to `timeit`.
:::

## Where the noise comes from

**Other programs.** On a shared machine something else is always running. In one experiment, the Kepler timing was repeated 30 times on a quiet machine, then again while four other programs kept all four cores busy. Quiet: minimum $11.8$, median $12.2$, maximum $12.9\,\mathrm{ms}$. Busy: minimum $11.7$, median $13.0$, maximum $29.4\,\mathrm{ms}$. The minimum hardly moved, and the slow tail more than doubled. In a repeat of the same experiment the busy minimum rose to $16.8\,\mathrm{ms}$: with enough load, even the best run gets hit. Close what you can before you benchmark.

**Threads inside libraries.** NumPy's matrix routines run on several threads, through a library called **[[BLAS|blas]]**. On a quiet machine that is faster. On a busy one, the threads fight with everything else.

```python
import statistics, timeit
import numpy as np

rng = np.random.default_rng(42)          # the same input every run
a = rng.normal(size=(300, 300))

ms = sorted(t / 10 * 1e3 for t in timeit.repeat(lambda: a @ a, number=10, repeat=30))
print(f"min {ms[0]:.3f}  median {statistics.median(ms):.3f}  max {ms[-1]:.3f} ms")
```

Saved as `matmul.py` and run three times with the default threads, then twice with one thread (set from the shell with `OPENBLAS_NUM_THREADS=1 python matmul.py`), it gave:

```text
default threads:  min 0.283  median 7.998  max 18.399 ms
default threads:  min 3.612  median 4.195  max 15.972 ms
default threads:  min 0.286  median 1.847  max 19.998 ms
one thread:       min 0.870  median 0.880  max 1.033 ms
one thread:       min 0.865  median 0.897  max 1.051 ms
```

With four threads the best run was three times faster than one thread, but the medians jumped between $1.8$ and $8.0\,\mathrm{ms}$ from one run of the program to the next. With one thread every run agreed to within a few percent. Neither is wrong, but a benchmark has to say which setting it used.

## Frequency scaling

A processor does not run at one fixed speed. **Frequency scaling** means the chip changes its clock rate — how many steps it takes per second — while it runs. It slows down when idle to save power. It speeds up above its rated speed, called **[[turbo boost|turbo]]**, when only a few cores are busy and it is cool. And it slows again when it gets hot or when all the cores are working. A laptop on battery may hold itself back on purpose.

For code whose time is spent computing, the run time is close to inversely proportional to the clock. That means a change in clock speed looks exactly like a change in your code.

::: example A slowdown that is not in the code
**The setup.** Suppose the Kepler benchmark took $12.0\,\mathrm{ms}$ while the chip was boosting to $3.0\,\mathrm{GHz}$. Later, the same chip is warm and has dropped to its base clock of $2.1\,\mathrm{GHz}$. (These clock values are for illustration; this cloud machine does not report them.)

**The new time.** Fewer steps per second means proportionally more time: $12.0 \times 3.0 / 2.1 \approx 17.1\,\mathrm{ms}$.

**The false alarm.** $17.1 / 12.0 \approx 1.43$. Someone comparing the two numbers would report a 43 percent slowdown, and not one line of code changed.

**Sense check.** $3.0 / 2.1 \approx 1.43$ as well: the whole "slowdown" is the ratio of the two clock speeds, as it must be when the clock is the only thing that changed.
:::

On a Linux machine you control, the operating system's **[[frequency governor|governor]]** decides how the clock moves. You can read it, and with administrator rights you can pin it:

```text
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
sudo cpupower frequency-set --governor performance
```

The `performance` governor holds the clock high, which removes much of this noise. Some people also switch turbo boost off. The `pyperf` package's `python -m pyperf system tune` command applies several such settings at once.

Often you cannot do any of this. On the cloud machine used for this lesson, the file `scaling_governor` does not exist: the virtual machine's host controls the clock, and the guest cannot see or change it. That is fine, provided the report says so. "Governor not controlled (cloud VM)" is honest. Silence is not.

## Comparing two versions

Usually the question is a comparison: is the new version faster? Here is a real, small change to the Kepler solver. Version B looks up `math.sin` and `math.cos` once, before the loop, instead of on every pass (the hoisting idea from the caching lesson, applied to a name lookup).

Two rules make the comparison fair:

- **Interleave.** Time A, then B, then A, then B. If the machine slows down halfway through, both versions feel it, instead of the slowdown being blamed on whichever ran last.
- **Check the answers match.** A faster version that gives different answers is not a faster version.

```python
import math, statistics, timeit

Ms = [2 * math.pi * i / 20_000 for i in range(20_000)]

def solve_a():
    out = []
    for M in Ms:
        E = M
        while True:
            dE = (E - 0.3 * math.sin(E) - M) / (1.0 - 0.3 * math.cos(E))
            E -= dE
            if abs(dE) < 1e-12:
                break
        out.append(E)
    return out

def solve_b():
    sin, cos = math.sin, math.cos          # look the functions up once
    out = []
    for M in Ms:
        E = M
        while True:
            dE = (E - 0.3 * sin(E) - M) / (1.0 - 0.3 * cos(E))
            E -= dE
            if abs(dE) < 1e-12:
                break
        out.append(E)
    return out

assert solve_a() == solve_b()
ta, tb = [], []
for _ in range(20):                        # interleave: A, B, A, B, ...
    ta += timeit.repeat(solve_a, number=1, repeat=1)
    tb += timeit.repeat(solve_b, number=1, repeat=1)
for name, t in (("A", ta), ("B", tb)):
    ms = sorted(x * 1e3 for x in t)
    print(f"{name}: min {ms[0]:.2f}  median {statistics.median(ms):.2f}  max {ms[-1]:.2f} ms")
print(f"ratio of minimums A/B: {min(ta) / min(tb):.3f}")
wins = sum(b < a for a, b in zip(ta, tb))
print(f"B faster in {wins} of {len(ta)} rounds")
# A: min 11.14  median 11.68  max 12.81 ms
# B: min 10.33  median 10.81  max 12.22 ms
# ratio of minimums A/B: 1.078
# B faster in 19 of 20 rounds
```

::: example Is B really faster?
**The minimums.** $11.14 / 10.33 \approx 1.078$, so B is about 8 percent faster by its best run.

**The medians.** $11.68 / 10.81 \approx 1.080$. The typical run agrees: about 8 percent.

**The rounds.** In $19$ of the $20$ back-to-back rounds, B beat A. If the two were really equal, each round would be a coin toss, and 19 heads out of 20 tosses is extremely unlikely.

**The overlap.** The ranges still overlap: A's fastest run ($11.14\,\mathrm{ms}$) is faster than B's slowest ($12.22\,\mathrm{ms}$). So in the one round where A won, a single before-and-after timing would have told you the change made things worse.

**The verdict.** B is about 8 percent faster on this machine, and the evidence is the agreement of three different views of 40 runs. That same 8 percent is the size of the $-8.6$ percent "change" that identical code showed at the start of the lesson. Only the repeated, interleaved measurement can tell the two apart.
:::

::: warning Order is a hidden variable
Whatever runs second can inherit warm caches and a clock that has already sped up. Timing 20 back-to-back pairs of the identical solver, three separate times, the second call was the faster one in 14, 12 and 12 of the 20 pairs, and single pairs differed by as much as 24 percent. The tilt toward the second call was small on this machine; on others it is large. If you always time the old version first and the new one second, the new one gets any such gift every time. Alternate the order, and warm up both before timing either.
:::

## Writing it down

A benchmark result is only useful if someone else can understand it and you can repeat it next month. Record, next to the numbers:

- **the machine**: processor, number of cores, operating system;
- **the software**: Python, NumPy and any other library that matters;
- **the settings that move the numbers**: library thread counts, the frequency governor or "not controlled";
- **the method**: the input and its seed, the warmup, `repeat` and `number`;
- **the result**: minimum, median and a spread, against a **baseline** measured the same way.

A small helper can gather most of it:

```python
import os, platform, statistics, timeit
from pathlib import Path
import numpy as np

def machine_report():
    gov = Path("/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor")
    return {
        "cpu": platform.machine(),
        "cores": os.cpu_count(),
        "os": platform.system() + " " + platform.release(),
        "python": platform.python_version(),
        "numpy": np.__version__,
        "blas_threads": os.environ.get("OPENBLAS_NUM_THREADS", "default"),
        "governor": gov.read_text().strip() if gov.exists() else "not visible",
    }

def bench(func, warmup=3, repeat=30, number=1):
    for _ in range(warmup):                   # untimed: compile, load, fill caches
        func()
    per_call = [t / number * 1e3 for t in timeit.repeat(func, number=number, repeat=repeat)]
    q1, med, q3 = statistics.quantiles(per_call, n=4)
    return {"min_ms": round(min(per_call), 2), "median_ms": round(med, 2),
            "iqr_ms": round(q3 - q1, 2), "max_ms": round(max(per_call), 2),
            "warmup": warmup, "repeat": repeat, "number": number}

if __name__ == "__main__":
    from kepler_bench import solve_all
    print(machine_report())
    print(bench(solve_all))
# {'cpu': 'x86_64', 'cores': 4, 'os': 'Linux 6.18.44-fc-v42', 'python': '3.11.15',
#  'numpy': '2.4.6', 'blas_threads': 'default', 'governor': 'not visible'}
# {'min_ms': 12.37, 'median_ms': 12.68, 'iqr_ms': 0.62, 'max_ms': 14.19,
#  'warmup': 3, 'repeat': 30, 'number': 1}
```

`platform.machine()` only gives the processor family, `x86_64`; on Linux the exact model is in `/proc/cpuinfo`.

A regression gate in automated tests uses the same ideas. Numbers from two different machines cannot be compared, so the gate should time the old code and the new code on the same machine, in the same job, interleaved. It should fail only when the new version is slower by more than the noise that machine shows when nothing has changed. Measure that noise first, by running the gate on two identical versions a few dozen times.

## Check yourself

::: check
A teammate posts in chat: "I sped up the atmosphere model: 4.1 s before, 3.8 s after." What questions would you ask before believing it?
:::

::: answer
That is about a 7 percent change, which is the size of ordinary run-to-run noise, so a single pair of numbers cannot show it. Ask:

- How many times was each version run, and what were the minimum and the spread of each?
- Were the runs interleaved, or all "before" first and all "after" second?
- Was there a warmup, and was the same seeded input used for both?
- Same machine, same library versions and thread settings? Was the clock governor controlled, or was it a laptop that may have been plugged in for one and not the other?
- Do the two versions give the same answers?

Only repeated, interleaved runs with spreads smaller than the gap would make the claim convincing.
:::

::: check
Ten timings of a function, in milliseconds, are $5.1, 5.0, 5.2, 5.0, 9.8, 5.1, 5.0, 5.3, 5.1, 12.4$. Find the minimum, the median and the mean. Which would you report as the code's own cost, and why do the mean and median differ?
:::

::: answer
Sorted: $5.0, 5.0, 5.0, 5.1, 5.1, 5.1, 5.2, 5.3, 9.8, 12.4$.

The minimum is $5.0\,\mathrm{ms}$. With ten values, the median is the average of the 5th and 6th: $(5.1 + 5.1)/2 = 5.1\,\mathrm{ms}$. The mean is the sum, $63.0$, divided by $10$: $6.3\,\mathrm{ms}$.

The two slow runs ($9.8$ and $12.4$) were almost certainly hit by noise. They drag the mean up by more than 20 percent but barely touch the median. Report the minimum ($5.0$) as the code's own cost, the median ($5.1$) as the typical run, and mention the slow tail, since two runs in ten being twice as slow is worth knowing.
:::

::: check
A function decorated with `@njit(cache=True)` is timed with `timeit.repeat(f, number=1, repeat=5)` right after starting Python, and the first of the five times is much larger than the others. The machine had not compiled this function before. Explain what happened, and how to fix the benchmark.
:::

::: answer
The first call compiled the function to machine code, and `cache=True` then saved that code to disk. The first of the five timings includes the compile; the other four do not.

To measure the steady state, call the function a few times before timing (a warmup), or drop the first timing. If the cold-start cost matters (for example, a script that runs once), measure it separately and report it as its own number. On the next fresh start of Python, the cached machine code is loaded instead of compiled, so the first call is much cheaper than this time, but still a little slower than later ones.
:::

::: check
Explain in your own words why noise makes timings lopsided, with a long tail on the slow side, and what that means for which summary number to trust.
:::

::: answer
Every source of noise — another program taking the processor, caches being flushed, the clock slowing down, the operating system doing its own work — can only add time to a run. Nothing can make the code run faster than its own cost. So the runs pile up a little above that cost, and the unlucky ones spread out far to the slow side.

That makes the minimum the most stable estimate of the code's own cost: it is the run that was interfered with least, and it changes little from one session to the next. The mean is pulled up by the slow tail and changes the most. The median sits in between and describes a typical run. A good report gives the minimum and a spread such as the interquartile range.
:::

## Summary

| Idea | What it means | What to do |
| --- | --- | --- |
| Benchmark | A timing careful enough to compare | Fixed input, warmup, repeats, conditions written down |
| Noise | Time added by the machine, not the code | Close other work; repeat; never trust one number |
| Warmup | One-time costs: compiling, loading, fresh memory, clock ramp-up | Make a few untimed calls first; report cold start separately if it matters |
| Repetitions | Many timings of the same code | `timeit.repeat`, 20–30 repeats for millisecond code; larger `number` for tiny code |
| Minimum | Fastest run, least interference | Steadiest estimate of the code's own cost |
| Median and IQR | Typical run and middle half of runs | Report with the minimum; robust to slow outliers |
| Frequency scaling | The clock changes with load, heat and power | Pin the governor, or state that you did not |
| Library threads | BLAS threads fight with other work | Report the thread count; one thread is steadier |
| Comparing versions | Is B really faster than A? | Interleave, check the answers match, count wins, compare min and median |
| Regression gate | Automated check for slowdowns | Same machine, same job, threshold above measured noise |

This closes the performance module: measure, fix the algorithm, remove repeated work, vectorize, compile, parallelise, and prove each step with a benchmark someone else can trust. The next module, on packaging, turns code like this into something others can install and run the same way you do, which is also what makes a benchmark repeatable on someone else's machine.

::: context regression-gate A test that watches the clock
Most automated tests check that the answers are right. A performance regression gate checks that the code has not got slower: it runs a benchmark on every proposed change and fails the change if the time goes up by more than a set amount. A gate with a threshold smaller than the machine's noise fails at random, and people soon learn to ignore it. A gate with a threshold that is too large lets slow creep through, a few percent at a time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="70" width="300" height="40" fill="#8fb8f0" opacity="0.5"/>
  <line x1="40" y1="90" x2="340" y2="90" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="55" x2="340" y2="55" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g fill="#1f2a44">
    <circle cx="60" cy="88" r="4"/><circle cx="90" cy="95" r="4"/><circle cx="120" cy="83" r="4"/><circle cx="150" cy="92" r="4"/>
    <circle cx="180" cy="100" r="4"/><circle cx="210" cy="86" r="4"/><circle cx="270" cy="94" r="4"/><circle cx="300" cy="89" r="4"/>
  </g>
  <circle cx="240" cy="40" r="5" fill="#b4232c"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">one dot per proposed change</text>
  <text x="45" y="128" font-size="11" fill="#1d6fd1">baseline and its normal noise</text>
  <text x="45" y="50" font-size="11" fill="#b4232c">fail threshold</text>
  <text x="250" y="30" font-size="11" fill="#b4232c">gate fails</text>
</svg>
```
:::

::: context page-fault Memory handed over on first touch
When a program asks for a large block of memory, the operating system promises it but does not hand it over yet. The memory is split into pages, usually 4 KiB each, and the first time the program touches a page the processor stops, the system finds real memory for it, and the program carries on. That pause is a page fault. A million-element array of 8-byte numbers is about 2,000 pages, so the first pass over fresh memory pays about 2,000 small pauses that later passes do not.
:::

::: context skew Why the tail points one way
Here are the 30 repeats from the lesson, each dot one run, grouped into half-millisecond bins. Most runs pile up a little above 12 ms. A few were hit by noise and landed far to the right. The minimum sits at the left edge of the pile, the median a little inside it, and the mean is pulled right by the tail.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="42.5" y1="44" x2="42.5" y2="150" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="77.5" y1="30" x2="77.5" y2="150" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="98" y1="44" x2="98" y2="150" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3 3"/>
  <g fill="#1d6fd1">
    <circle cx="48.8" cy="140" r="3.5"/><circle cx="48.8" cy="132" r="3.5"/><circle cx="48.8" cy="124" r="3.5"/><circle cx="48.8" cy="116" r="3.5"/><circle cx="48.8" cy="108" r="3.5"/><circle cx="48.8" cy="100" r="3.5"/><circle cx="48.8" cy="92" r="3.5"/><circle cx="48.8" cy="84" r="3.5"/><circle cx="48.8" cy="76" r="3.5"/><circle cx="48.8" cy="68" r="3.5"/><circle cx="48.8" cy="60" r="3.5"/><circle cx="48.8" cy="52" r="3.5"/>
    <circle cx="61.2" cy="140" r="3.5"/><circle cx="61.2" cy="132" r="3.5"/>
    <circle cx="73.8" cy="140" r="3.5"/><circle cx="73.8" cy="132" r="3.5"/>
    <circle cx="86.2" cy="140" r="3.5"/><circle cx="86.2" cy="132" r="3.5"/><circle cx="86.2" cy="124" r="3.5"/>
    <circle cx="98.8" cy="140" r="3.5"/><circle cx="98.8" cy="132" r="3.5"/>
    <circle cx="111.2" cy="140" r="3.5"/><circle cx="111.2" cy="132" r="3.5"/><circle cx="111.2" cy="124" r="3.5"/><circle cx="111.2" cy="116" r="3.5"/>
    <circle cx="123.8" cy="140" r="3.5"/>
    <circle cx="198.8" cy="140" r="3.5"/><circle cx="273.8" cy="140" r="3.5"/><circle cx="298.8" cy="140" r="3.5"/><circle cx="311.2" cy="140" r="3.5"/>
  </g>
  <line x1="30" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="42.5" y="166">12</text><text x="92.5" y="166">14</text><text x="142.5" y="166">16</text><text x="192.5" y="166">18</text><text x="242.5" y="166">20</text><text x="292.5" y="166">22</text>
    <text x="330" y="166">ms</text>
  </g>
  <text x="42.5" y="40" font-size="11" fill="#6c7a93" text-anchor="middle">min</text>
  <text x="77.5" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">median</text>
  <text x="104" y="40" font-size="11" fill="#b4232c">mean</text>
  <text x="250" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">slow tail: runs hit by noise</text>
</svg>
```
:::

::: context iqr The middle half
Sort the runs from fastest to slowest and cut the list into four equal parts. The cut a quarter of the way in is the first quartile; the cut three quarters of the way in is the third. The interquartile range runs between them, so it holds the middle half of the runs. The fastest quarter and the slowest quarter are left out, which is why one wild run does not move it. In Python, `statistics.quantiles(data, n=4)` returns the three cuts: first quartile, median and third quartile.
:::

::: context gc Python's clean-up crew
Python frees most objects the moment nothing refers to them any more. Objects that refer to each other in a loop never reach that point, so a separate garbage collector wakes up every so often, after enough new objects have been created, and hunts for such loops. Each hunt is a short pause at an unpredictable moment. Turning it off while timing, as `timeit` does, removes that source of noise, and also removes a cost the real program will pay.
:::

::: context blas The library under NumPy's matrices
BLAS, short for Basic Linear Algebra Subprograms, is a standard set of routines for vector and matrix arithmetic dating back to the 1970s. NumPy hands its matrix products to a fast implementation of it, such as OpenBLAS, which splits big products across several threads and releases the interpreter lock while it works. That is the reason threads can speed up NumPy-heavy code, as the lesson on the GIL explained. It is also why a benchmark should record the thread count: environment variables such as `OPENBLAS_NUM_THREADS` or `OMP_NUM_THREADS` change it.
:::

::: context turbo Faster than the label says
A processor's rated speed, its base clock, is the speed it can hold with every core busy without overheating. When only a few cores are busy and the chip is cool, it can run faster for a while; Intel calls this Turbo Boost and AMD calls it Precision Boost. As the chip heats up, it steps back down. So the same code can run at different speeds a few seconds apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="140" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="335" y="95" font-size="11" fill="#6c7a93" text-anchor="end">base clock</text>
  <path d="M 50 125 L 80 125 L 95 40 L 180 40 L 200 55 L 240 55 L 260 70 L 340 70" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="58" y="118" font-size="11" fill="#1f2a44">idle</text>
  <text x="137" y="33" font-size="11" fill="#1d6fd1" text-anchor="middle">boost while cool</text>
  <text x="300" y="63" font-size="11" fill="#1f2a44" text-anchor="middle">hot: steps down</text>
  <text x="195" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">time (illustration, not measured)</text>
  <text x="44" y="30" font-size="11" fill="#1f2a44" text-anchor="end">GHz</text>
</svg>
```
:::

::: context governor Who sets the clock
On Linux, a small policy in the kernel called the frequency governor chooses the clock speed from moment to moment. Common ones are `performance`, which holds the clock high; `powersave`, which favors low power; and `schedutil`, which follows how busy the scheduler says the processor is. Laptops, desktops and servers ship with different defaults, which is one reason the same code benchmarks differently on them. Changing the governor needs administrator rights, and inside a cloud virtual machine it is usually not possible at all.
:::
