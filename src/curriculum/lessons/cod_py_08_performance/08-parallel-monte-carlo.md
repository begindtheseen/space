---
id: l08-parallel-monte-carlo
title: Running a Monte Carlo on every core
minutes: 22
covers:
  - 'multiprocessing, concurrent.futures and joblib for embarrassingly parallel Monte Carlo'
  - 'Serialisation cost and why passing large arrays between processes can dominate'
---

Imagine a teacher with 400 math tests to grade and three friends willing to help. The job splits perfectly. Each test is graded on its own, and no grader needs to know what another grader wrote. Hand each friend a stack, and four people finish in about a quarter of the time.

Now imagine the teacher insists on photocopying the whole answer book — a hundred pages — and stapling a fresh copy to *every single test* before handing it over. The grading still takes the same time. But the photocopier now runs all day, and the helpers spend most of their time waiting for paper. Four people could end up slower than one.

A **Monte Carlo** run is the stack of tests. A GNC team simulates the same landing hundreds of times with slightly different masses, winds and engine performance, and looks at the spread of the landing points. Every case is independent of every other. That makes it the perfect job for the **processes** from the last lesson. This lesson shows three standard ways to hand out the stack — `multiprocessing`, `concurrent.futures` and joblib — and then measures the photocopier: the hidden cost of sending data to the workers, which can quietly eat the whole speedup.

## An embarrassingly parallel job

A job is **[[embarrassingly parallel|embarrassingly-parallel]]** when it splits into pieces that need nothing from each other while they run. There is no talking between workers, no shared running total, no waiting for a neighbor's answer. You split the work, run the pieces anywhere, and collect the results at the end.

Monte Carlo is the textbook case. Here is one case of a small descent simulation. A body falls from $5\,\mathrm{km}$ through an exponential atmosphere with a random crosswind, and the function returns how far downrange it lands, in meters. The mass, the wind and the drag area (drag coefficient times reference area, $C_D A$) are each drawn at random. Save it as `mc_case.py`.

```python
import math
import numpy as np


def run_case(seed):
    """One dispersed descent. Returns the downrange miss in meters."""
    rng = np.random.default_rng(seed)
    mass = 25_000.0 * (1 + 0.02 * rng.standard_normal())   # kg, 2 % spread
    wind = 8.0 * rng.standard_normal()                      # m/s crosswind
    cd_area = 12.0 * (1 + 0.05 * rng.standard_normal())     # Cd*A in m^2

    x, h, vx, vh = 0.0, 5_000.0, 0.0, -250.0
    dt = 0.001
    while h > 0.0:
        rho = 1.225 * math.exp(-h / 8_500.0)
        rel_x = vx - wind
        speed = math.hypot(rel_x, vh)
        k = 0.5 * rho * cd_area * speed / mass
        vx -= k * rel_x * dt
        vh += (-9.81 - k * vh) * dt
        x += vx * dt
        h += vh * dt
    return x
```

Each call runs about $22{,}000$ time steps of pure Python and takes around $5\,\mathrm{ms}$ on the test machine. Notice what goes in: one **seed**, and nothing else. Everything a case needs, it makes for itself. That will matter a lot later.

## Giving every case its own random numbers

Before any speed, get the randomness right. A Monte Carlo is only as good as its random numbers, and parallel code has a classic trap.

A **random number generator** is a machine that produces a long stream of numbers that look random but are completely fixed by a starting value called the **seed**. Same seed, same stream. That is a feature: it makes a run repeatable, so a strange case can be rerun and studied.

The trap is NumPy's old global generator, the one behind `np.random.normal()`. It lives inside the process. When worker processes are created by copying the parent (the `fork` start method, the Linux default before Python 3.14), every worker gets a copy of the *same* generator in the *same* state. So they draw the same "random" numbers.

```python
import multiprocessing as mp
import numpy as np


def bad_case(i):
    return round(np.random.normal(), 4)   # global generator, no seed


if __name__ == "__main__":
    np.random.seed(0)
    ctx = mp.get_context("fork")
    with ctx.Pool(4) as pool:
        print(pool.map(bad_case, range(8), chunksize=1))

# One run (the order changes from run to run, the repeats do not go away):
# [1.7641, 1.7641, 1.7641, 0.4002, 0.9787, 2.2409, 0.4002, 0.9787]
```

Eight "different" cases, but the value $1.7641$ appears three times and $0.4002$ twice. Your dispersion would silently contain copies of the same case, and its spread would come out too small.

The fix is to give each case its own generator, built from its own seed, and to make the seeds with **[[SeedSequence|seed-sequence]]**. `np.random.SeedSequence(2024).spawn(400)` takes one master seed, $2024$, and hands back $400$ child seeds that are designed to produce independent streams. Case number $i$ always gets child $i$, no matter which worker runs it, or when.

::: key
Seed per case, not per worker. Build the seeds with `SeedSequence(master).spawn(n_cases)` and create `np.random.default_rng(seed)` inside the case. Then the results are identical whether you use one core or sixty-four.
:::

## Three ways to hand out the stack

Python has three common tools for spreading independent cases over processes. They do the same job with slightly different handles.

- **`multiprocessing.Pool`** — the original, in the standard library since Python 2.6. `pool.map(f, items)` calls `f` on each item in worker processes and returns the results **in the same order as the inputs**.
- **`concurrent.futures.ProcessPoolExecutor`** — a newer, tidier standard-library interface that also offers threads with the same methods (`ThreadPoolExecutor`, from the last lesson). It has `map`, and also `submit`, which you will see shortly.
- **joblib** — a separate package, widely used in scientific Python. You write `Parallel(n_jobs=4)(delayed(f)(x) for x in items)`. Read `delayed(f)(x)` as "call `f` on `x`, but later, in a worker". `n_jobs=-1` means "use every core".

All three need the `if __name__ == "__main__":` guard from the last lesson. Here are all three running the same $400$ cases, plus a serial run to compare against. Save it next to `mc_case.py` and run it.

```python
import os
import time
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor

import numpy as np
from joblib import Parallel, delayed

from mc_case import run_case

if __name__ == "__main__":
    n_cases = 400
    seeds = np.random.SeedSequence(2024).spawn(n_cases)
    print("cores:", os.cpu_count())

    t0 = time.perf_counter()
    serial = [run_case(s) for s in seeds]
    t_serial = time.perf_counter() - t0
    print(f"serial            {t_serial:5.2f} s")

    t0 = time.perf_counter()
    with mp.Pool(processes=4) as pool:
        a = pool.map(run_case, seeds, chunksize=10)
    print(f"multiprocessing   {time.perf_counter() - t0:5.2f} s")

    t0 = time.perf_counter()
    with ProcessPoolExecutor(max_workers=4) as ex:
        b = list(ex.map(run_case, seeds, chunksize=10))
    print(f"concurrent.futures{time.perf_counter() - t0:5.2f} s")

    t0 = time.perf_counter()
    c = Parallel(n_jobs=4)(delayed(run_case)(s) for s in seeds)
    print(f"joblib            {time.perf_counter() - t0:5.2f} s")

    print("identical:", serial == a == b == c)
    miss = np.array(serial)
    print(f"mean miss {miss.mean():.1f} m, spread {miss.std():.1f} m")

# One run on a 4-core machine (yours will differ):
# cores: 4
# serial             2.13 s
# multiprocessing    0.56 s
# concurrent.futures 0.56 s
# joblib             0.88 s
# identical: True
# mean miss -1.7 m, spread 61.5 m
```

Three things to notice.

First, `identical: True`. All four lists hold exactly the same $400$ numbers in the same order. That is the per-case seeding paying off: the answer does not depend on how the work was split.

Second, joblib was slower here. Its default engine, called **[[loky|loky]]**, starts fresh Python workers that must each import NumPy before they can work, and $0.3\,\mathrm{s}$ of start-up is a large slice of a $2\,\mathrm{s}$ job. The workers are kept alive afterwards, and a second `Parallel` call in the same script took $0.57\,\mathrm{s}$, the same as the others. On a real dispersion where each case runs for seconds, the three tools perform alike. Pick the one whose interface you like.

Third, `chunksize=10`. That sends the cases to workers in batches of ten instead of one at a time. More on why in a moment.

::: example Speedup and efficiency from the table
**Speedup** $S$ is serial time over parallel time. **Efficiency** $E$ is speedup divided by the number of workers $N$ — what fraction of the perfect result you got.

For `multiprocessing` above, with $N = 4$:

$$
S = \frac{2.13\,\mathrm{s}}{0.56\,\mathrm{s}} \approx 3.80, \qquad E = \frac{S}{N} = \frac{3.80}{4} \approx 0.95.
$$

So $95\%$ efficiency. That is excellent, and it is what an embarrassingly parallel job with small inputs should look like. Sanity check: $S$ is below $N = 4$ and $E$ is below $1$, as they must be when every worker does an equal share.
:::

### Progress reports with submit

Sometimes you want to see cases finish as they go, for example to print progress during an hour-long run. `ex.submit(f, x)` starts one call and immediately hands back a **future** — a ticket you can cash in later for the result. `as_completed` gives you the tickets in the order the cases *finish*, which is not the order they started. So keep a note of which case each ticket belongs to, and put each result back in its own slot.

```python
from concurrent.futures import ProcessPoolExecutor, as_completed

import numpy as np

from mc_case import run_case

if __name__ == "__main__":
    seeds = np.random.SeedSequence(2024).spawn(400)
    miss = np.empty(len(seeds))
    with ProcessPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(run_case, s): i for i, s in enumerate(seeds)}
        for done, fut in enumerate(as_completed(futures), start=1):
            miss[futures[fut]] = fut.result()   # put it back in its slot
            if done % 100 == 0:
                print(f"{done} of {len(seeds)} cases done")
    print(f"mean miss {miss.mean():.1f} m, spread {miss.std():.1f} m")

# 100 of 400 cases done
# 200 of 400 cases done
# 300 of 400 cases done
# 400 of 400 cases done
# mean miss -1.7 m, spread 61.5 m
```

Same mean and spread as before, because each case still used its own seed.

## The part that stays serial

Parallel work is rarely all of a program. Before the cases run, something reads the vehicle configuration and builds the aerodynamic tables. After them, something makes plots and writes the report. Those steps run once, on one core.

**Amdahl's law** says how much that serial part limits you. Call $p$ the fraction of the original run time that can be spread over workers, so $1 - p$ is the fraction that cannot. With $N$ workers the serial part still takes $1 - p$, and the parallel part shrinks to $p / N$. The speedup is the old time (call it $1$) over the new time:

$$
S(N) = \frac{1}{(1 - p) + \dfrac{p}{N}}
$$

Read it aloud as "S of N equals one over one-minus-p plus p over N". As $N$ grows without limit, $p/N$ shrinks toward zero, and the speedup can never pass $\frac{1}{1-p}$. If $5\%$ of the job is serial, no number of cores ever makes it more than $20$ times faster. There is a **[[picture of this|amdahl-picture]]** in the notes.

::: example Planning a dispersion with a serial tail
A 500-case dispersion spends $30\,\mathrm{s}$ loading tables and making plots (serial), and $2400\,\mathrm{s}$ running cases (parallel). The machine has $8$ cores.

The total is $30 + 2400 = 2430\,\mathrm{s}$. The parallel fraction is

$$
p = \frac{2400}{2430} \approx 0.988, \qquad 1 - p \approx 0.0123.
$$

With $N = 8$:

$$
S = \frac{1}{0.0123 + 0.988/8} = \frac{1}{0.0123 + 0.1235} \approx 7.36.
$$

The new run time is $2430 / 7.36 \approx 330\,\mathrm{s}$, about $5.5$ minutes. Check it the direct way: $30\,\mathrm{s}$ serial plus $2400 / 8 = 300\,\mathrm{s}$ of cases is $330\,\mathrm{s}$. Same answer. The ceiling for this job is $\frac{1}{0.0123} \approx 81\times$, far above $8$, so here the serial tail barely matters. It starts to matter when the cases get fast — for example after you have compiled them — and the $30\,\mathrm{s}$ of loading becomes the biggest piece.
:::

## The hidden cost: sending data to workers

Now the photocopier. Processes do not share memory. So when you ask a worker to run `f(x)`, Python has to get `x` into the worker's memory. It does that in three steps, for **every task**:

1. **[[Pickle|pickle]]** the argument — turn the object into a flat string of bytes. This is called **serialisation**.
2. Push the bytes through a **pipe**, a one-way channel between processes provided by the operating system.
3. **Unpickle** them in the worker — rebuild the object from the bytes.

The result travels back the same way. For a seed, or a few numbers, this costs microseconds. For a big NumPy array it costs real time. On the test machine, pickling an $80\,\mathrm{MB}$ array took about $0.05\,\mathrm{s}$ and unpickling another $0.05\,\mathrm{s}$, before the pipe even moved it.

Here is the effect on a real run. Each case needs to read one value from an $80\,\mathrm{MB}$ gust table. The script tries three ways of getting the table to the workers.

```python
import time
from concurrent.futures import ProcessPoolExecutor

import numpy as np
from joblib import Parallel, delayed

from mc_case import run_case


def case_with_table(seed, table):
    """A case that reads one gust value from a big table."""
    return run_case(seed) + 0.0 * table[123]


_table = None                      # each worker's own reference


def load_table(table):
    global _table
    _table = table


def case_using_global(seed):
    return run_case(seed) + 0.0 * _table[123]


if __name__ == "__main__":
    table = np.random.default_rng(0).normal(size=10_000_000)   # 80 MB
    seeds = np.random.SeedSequence(7).spawn(100)

    t0 = time.perf_counter()
    ref = [case_with_table(s, table) for s in seeds]
    print(f"serial                     {time.perf_counter() - t0:5.2f} s")

    t0 = time.perf_counter()
    with ProcessPoolExecutor(max_workers=4) as ex:
        a = list(ex.map(case_with_table, seeds, [table] * len(seeds)))
    print(f"table sent with every case {time.perf_counter() - t0:5.2f} s")

    t0 = time.perf_counter()
    with ProcessPoolExecutor(max_workers=4, initializer=load_table,
                             initargs=(table,)) as ex:
        b = list(ex.map(case_using_global, seeds))
    print(f"table sent once per worker {time.perf_counter() - t0:5.2f} s")

    t0 = time.perf_counter()
    c = Parallel(n_jobs=4)(delayed(case_with_table)(s, table) for s in seeds)
    print(f"joblib, automatic memmap   {time.perf_counter() - t0:5.2f} s")
    print("identical:", ref == a == b == c)

# One run on a 4-core machine (yours will differ):
# serial                      0.62 s
# table sent with every case 22.20 s
# table sent once per worker  0.19 s
# joblib, automatic memmap    0.58 s
# identical: True
```

Read those numbers slowly. The serial run took $0.62\,\mathrm{s}$. Sending the table with every case took $22.2\,\mathrm{s}$ — about $36$ times *slower* than doing it all on one core. Sending it once per worker took $0.19\,\mathrm{s}$, a real $3.3\times$ speedup. Same cases, same answers, same four cores. The only difference was how often $80\,\mathrm{MB}$ crossed a pipe.

The `initializer` argument names a function that each worker runs once when it starts, with `initargs` as its arguments. Here it stores the table in a module-level variable, and every later case in that worker reads it from there.

joblib did well without being asked, because it has a built-in trick: any NumPy argument larger than $1\,\mathrm{MB}$ is written once to a temporary file, and the workers open it as a **memory map** instead of receiving a copy. The next lesson is all about memory maps.

::: key
Why can passing big arrays to worker processes dominate the runtime? Each argument is pickled, copied through a pipe and unpickled per task. If the per-case work is small relative to the data, you pay serialisation for nothing; batch the work, use shared memory, or have workers load data themselves.
:::

::: example How much data did the slow version move?
$100$ cases, each carrying the $80\,\mathrm{MB}$ table:

$$
100 \times 80\,\mathrm{MB} = 8000\,\mathrm{MB} = 8\,\mathrm{GB}.
$$

Eight gigabytes pickled, piped and unpickled, to deliver data that each case read *one number* of. Spread over the $22.2\,\mathrm{s}$ run, that is about $8000 / 22.2 \approx 360\,\mathrm{MB/s}$ through the pipes. Pickling and unpickling alone, at the rate measured above, account for $100 \times 0.1 = 10\,\mathrm{s}$ of processor time.

Now compare with the useful work. One case took about $0.62 / 100 = 6.2\,\mathrm{ms}$. Moving its table took roughly $22.2 / 100 \approx 0.22\,\mathrm{s}$ — about $36$ times longer than the case itself. Whenever the data per task costs more to move than the task costs to run, parallelism loses.

Once per worker, the table moved $4$ times instead of $100$: $4 \times 80 = 320\,\mathrm{MB}$, twenty-five times less.
:::

### Four ways to stop paying for the photocopier

1. **Send small things.** Pass a seed, an index or a file name, and let the worker build or load what it needs. This is why `run_case` takes only a seed.
2. **Send the big thing once per worker.** Use `initializer` and `initargs`, as above, or joblib's automatic memory mapping.
3. **Let workers read the data themselves.** Save the array to disk once with `np.save`, and have each worker open it with `np.load(path, mmap_mode="r")`. The operating system shares the file's pages among all the workers. The next lesson shows how.
4. **Use shared memory.** The standard module `multiprocessing.shared_memory` makes a block of memory that several processes can see at once. Only its *name* is sent to the workers.

```python
from concurrent.futures import ProcessPoolExecutor
from multiprocessing import shared_memory

import numpy as np


def column_mean(args):
    name, shape, col = args
    shm = shared_memory.SharedMemory(name=name)          # attach, no copy
    table = np.ndarray(shape, dtype=np.float64, buffer=shm.buf)
    result = float(table[:, col].mean())
    del table                                            # drop the view first
    shm.close()
    return result


if __name__ == "__main__":
    data = np.random.default_rng(1).normal(size=(1_000_000, 8))   # 64 MB
    shm = shared_memory.SharedMemory(create=True, size=data.nbytes)
    shared = np.ndarray(data.shape, dtype=data.dtype, buffer=shm.buf)
    shared[:] = data                                     # one copy, up front

    jobs = [(shm.name, data.shape, c) for c in range(8)]
    with ProcessPoolExecutor(max_workers=4) as ex:
        means = list(ex.map(column_mean, jobs))
    print(np.round(means, 4))

    del shared
    shm.close()
    shm.unlink()                                         # free the block

# [ 0.002   0.002  -0.0001 -0.0009  0.0011 -0.0001 -0.0003  0.001 ]
```

`np.ndarray(shape, dtype=..., buffer=shm.buf)` makes an array that *uses* the shared block as its storage instead of owning memory of its own. Each task sent only a short name, a shape and a column number. The last lines matter: `close` detaches this process, and `unlink` tells the operating system the block can be freed. Forget `unlink` and the memory stays taken after your program ends.

::: warning Shared memory is shared
With shared memory, a worker that *writes* into the array changes it for everyone, at once, with no warning. For Monte Carlo inputs, treat the shared table as read-only. If each case must write results, give each case its own row and never let two cases write the same row.
:::

## Many tiny tasks: batch them

The pipe has a fixed cost per trip, not only a cost per byte. Each task sends a small message out and a small message back, and a worker has to wake up and pick it up. If a task does only a few microseconds of work, those trips cost more than the work.

On the test machine, $20{,}000$ tasks of about $10\,\mu\mathrm{s}$ each (read $\mu\mathrm{s}$ as "microseconds", millionths of a second) took $0.19\,\mathrm{s}$ serially. With `ProcessPoolExecutor.map` and the default `chunksize=1`, four processes took about $4\,\mathrm{s}$ — twenty times slower. With `chunksize=500`, which sends $500$ tasks per trip, they took $0.11\,\mathrm{s}$.

The defaults differ between the tools. `multiprocessing.Pool.map` picks a chunk size for you from the number of items. `ProcessPoolExecutor.map` uses $1$ unless you say otherwise. joblib's `Parallel` has `batch_size="auto"`, which measures how long tasks take and groups them to match. A good target is **[[tasks that last at least a tenth of a second|task-size]]** each.

::: warning Parallelise the outer loop
Put the parallel split at the outermost level — whole Monte Carlo cases — not inside a case. Splitting the time steps of one case across processes would mean a pipe trip every step, and the steps depend on each other anyway. Outer-loop parallelism has the fewest, biggest tasks and the least data to move.
:::

## Check yourself

::: check
What makes a Monte Carlo dispersion "embarrassingly parallel", and what would break that property?
:::

::: answer
Each case needs nothing from any other case while it runs: its own inputs, its own random numbers, its own result. So the cases can run in any order on any worker and be collected at the end. It would break if cases had to exchange information during the run — for example, if case $i$ needed the result of case $i - 1$ as its starting point, or if all cases updated one shared running total while they ran.
:::

::: check
A colleague's parallel dispersion gives a different mean each time it is run with a different number of workers. The case function calls `np.random.normal()` directly. What is wrong, and how do you fix it?
:::

::: answer
The case draws from NumPy's global generator, whose state depends on which process runs it and what that process ran before. With `fork`, workers can even start from identical copies and repeat each other's numbers. So which numbers a case gets depends on the scheduling. Fix: make a list of per-case seeds with `np.random.SeedSequence(master).spawn(n_cases)`, pass case $i$ its own seed, and create `rng = np.random.default_rng(seed)` inside the case. Then case $i$ always sees the same numbers, and the results are identical for any number of workers.
:::

::: check
A job is $90\%$ parallel. What is the best possible speedup on $4$ cores, on $16$ cores, and on unlimited cores?
:::

::: answer
With $p = 0.9$, $1 - p = 0.1$. For $N = 4$: $S = 1/(0.1 + 0.9/4) = 1/(0.1 + 0.225) = 1/0.325 \approx 3.08$. For $N = 16$: $S = 1/(0.1 + 0.05625) = 1/0.15625 = 6.4$. For unlimited cores the $p/N$ term goes to zero, so $S \to 1/0.1 = 10$. Going from $4$ to $16$ cores only doubles the speedup, because the serial $10\%$ is now most of the run time.
:::

::: check
Each of $1000$ tasks runs for $2\,\mathrm{ms}$ and takes a $40\,\mathrm{MB}$ array as an argument. Moving $80\,\mathrm{MB}$ cost about $0.2\,\mathrm{s}$ in the lesson's measurement. Roughly what does moving the arrays cost compared to the work, and what would you change?
:::

::: answer
Scaling the measurement, moving $40\,\mathrm{MB}$ costs about $0.1\,\mathrm{s}$ per task, so about $1000 \times 0.1 = 100\,\mathrm{s}$ of moving, against $1000 \times 0.002 = 2\,\mathrm{s}$ of useful work: fifty times more. Parallelising this as written would be far slower than serial. If the array is the same for every task, send it once per worker with an `initializer`, save it and memory-map it, or put it in shared memory. If each task needs a different slice, send the slice's start and stop indices instead and let the worker read the slice itself.
:::

::: check
Why does `ProcessPoolExecutor.map(f, items)` with $100{,}000$ very short tasks often run slower than a plain loop, and what one-word argument fixes it?
:::

::: answer
The default sends one task per trip through the pipe, and each trip has a fixed cost of pickling a message, waking a worker and sending the result back. When each task is only microseconds of work, those trips cost more than the work itself. Passing `chunksize` (for example `chunksize=1000`) sends many tasks per trip, so the fixed cost is shared across the batch.
:::

## Summary

| Idea | Meaning | Formula or fact |
|---|---|---|
| embarrassingly parallel | pieces that need nothing from each other | Monte Carlo cases |
| per-case seeds | each case its own generator | `SeedSequence(m).spawn(n)`, `default_rng(seed)` |
| `multiprocessing.Pool` | original process pool | `pool.map(f, items, chunksize=...)`, ordered results |
| `ProcessPoolExecutor` | `concurrent.futures` process pool | `map`, or `submit` plus `as_completed` |
| joblib | `Parallel(n_jobs=4)(delayed(f)(x) for x in items)` | loky workers, auto memory map above $1\,\mathrm{MB}$ |
| speedup, efficiency | how much faster, fraction of ideal | $S = T_1 / T_N$, $E = S / N$ |
| Amdahl's law | serial part caps the speedup | $S(N) = 1 / \left((1-p) + p/N\right)$, at most $1/(1-p)$ |
| serialisation | pickle, pipe, unpickle, per task | $80\,\mathrm{MB}$ per case turned $0.62\,\mathrm{s}$ into $22.2\,\mathrm{s}$ |
| fixes | send less, send once, share | seeds and paths, `initializer`, memmap, `shared_memory` |
| `chunksize` | tasks per trip | batch many tiny tasks |

The next lesson meets data too big to fit in memory at all — a long telemetry recording — and handles it with `numpy.memmap`, chunked processing and Parquet files.

::: context embarrassingly-parallel A name that sounds like an insult
The phrase is meant kindly. It says the problem is so easy to split that it is almost embarrassing to call it parallel computing — no clever coordination, no messages between workers. Other names for the same thing are "perfectly parallel" and "pleasingly parallel". Rendering the frames of a film, testing many passwords, and running the cases of a Monte Carlo are all like this. The hard kind of parallel work is the opposite: a weather model or a fluid simulation, where each piece of space must trade data with its neighbors every time step.
:::

::: context seed-sequence Why spawn beats seed plus i
A tempting shortcut is to seed case $i$ with `master + i`. That usually works, but nothing promises that the streams from seeds $5$ and $6$ look unrelated. `SeedSequence` scrambles the master seed together with each child's position through a hashing step, so the children start in far-apart, well-mixed states. It is the method NumPy's own documentation recommends for parallel work. Keep the master seed in your run's configuration file, and any case can be rerun alone, on a laptop, bit for bit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="28" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="29" font-size="12" text-anchor="middle" fill="#1f2a44">master 2024</text>
  <line x1="180" y1="38" x2="45" y2="80" stroke="#1f2a44"/>
  <line x1="180" y1="38" x2="135" y2="80" stroke="#1f2a44"/>
  <line x1="180" y1="38" x2="225" y2="80" stroke="#1f2a44"/>
  <line x1="180" y1="38" x2="315" y2="80" stroke="#1f2a44"/>
  <rect x="10" y="80" width="70" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="100" y="80" width="70" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="190" y="80" width="70" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="280" y="80" width="70" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="45" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">case 0</text>
  <text x="135" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">case 1</text>
  <text x="225" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">case 2</text>
  <text x="315" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">case 399</text>
  <text x="270" y="97" font-size="12" text-anchor="middle" fill="#6c7a93">…</text>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">each case: its own independent stream</text>
</svg>
```
:::

::: context loky Where joblib's workers come from
joblib can run tasks on several engines, called backends. The default for processes is loky, a pool written for joblib that starts workers as fresh Python programs (much like `spawn`) and keeps them alive between `Parallel` calls, so the start-up cost is paid once per session. If a worker crashes, loky reports an error, where the older `multiprocessing.Pool` can sit waiting forever. You can choose a thread backend instead with `Parallel(n_jobs=4, prefer="threads")`, which is the right choice for the I/O and released-GIL work from the last lesson.
:::

::: context amdahl-picture The ceiling in a picture
The blue line is the perfect speedup, $S = N$. The red curve is Amdahl's law for a job that is $95\%$ parallel. At $4$ cores it reaches $3.48$, at $8$ cores $5.93$, at $16$ cores only $9.14$, and it can never pass $20$. The gap between the lines is time spent in the serial $5\%$, which every extra core leaves untouched.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="106" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="180.7" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">8</text>
  <text x="255.3" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">12</text>
  <text x="330" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">16 cores</text>
  <text x="44" y="121.5" font-size="11" text-anchor="end" fill="#1f2a44">4</text>
  <text x="44" y="89" font-size="11" text-anchor="end" fill="#1f2a44">8</text>
  <text x="44" y="56.5" font-size="11" text-anchor="end" fill="#1f2a44">12</text>
  <text x="44" y="24" font-size="11" text-anchor="end" fill="#1f2a44">16</text>
  <line x1="50" y1="141.9" x2="330" y2="20" stroke="#1d6fd1" stroke-width="2"/>
  <text x="300" y="36" font-size="11" text-anchor="end" fill="#1d6fd1">ideal S = N</text>
  <polyline points="50.0,141.9 68.7,134.5 87.3,127.8 106.0,121.7 124.7,116.1 143.3,111.0 162.0,106.3 180.7,101.9 199.3,97.8 218.0,94.0 236.7,90.4 255.3,87.1 274.0,84.0 292.7,81.1 311.3,78.3 330.0,75.7" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="330" y="94" font-size="11" text-anchor="end" fill="#b4232c">p = 0.95</text>
</svg>
```
:::

::: context pickle Packing an object into a box
`pickle` is Python's standard way to turn almost any object — a number, a dictionary, a NumPy array, an instance of your own class — into a flat sequence of bytes, and back again. The name comes from preserving food in a jar. For a NumPy array, pickling mostly means copying its raw bytes, which is why the cost grows with the array's size: roughly $0.05\,\mathrm{s}$ each way for $80\,\mathrm{MB}$ on the test machine. Functions are pickled by *name*, not by their code, which is why a worker must be able to import the function you send it — and why a function defined inside another function or typed at the interactive prompt often cannot be sent at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="80" height="40" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">array</text>
  <line x1="90" y1="50" x2="140" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="115" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">pickle</text>
  <rect x="140" y="38" width="80" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">bytes in pipe</text>
  <line x1="220" y1="50" x2="270" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="245" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">unpickle</text>
  <rect x="270" y="30" width="80" height="40" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="310" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">new copy</text>
  <text x="180" y="95" font-size="11" text-anchor="middle" fill="#b4232c">paid again for every task that carries it</text>
</svg>
```
:::

::: context task-size A rule of thumb for task size
Each trip to a worker costs somewhere around tens to hundreds of microseconds of fixed overhead, depending on the machine and the tool. If a task lasts $0.1\,\mathrm{s}$ or more, that overhead is under about $1\%$ and you can forget it. If a task lasts $10\,\mu\mathrm{s}$, the overhead is many times the work. So either make each task bigger — a whole Monte Carlo case, or a batch of cases — or let `chunksize` and joblib's `batch_size` do the grouping.
:::
