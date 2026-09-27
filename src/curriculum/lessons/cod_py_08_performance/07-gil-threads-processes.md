---
id: l07-gil-threads-processes
title: The GIL, threads and processes
minutes: 21
covers:
  - 'The GIL: what it does and does not block'
  - 'Threads for I/O and released-GIL numerics, processes for CPU-bound Python'
---

Picture a classroom discussion with a **talking stick**. Only the person holding the stick may speak. Everyone else can still do plenty — read silently, write notes, wait for a phone call — but nobody else talks until the stick is passed to them. Add more students and the room does not get any louder. There is still one voice at a time.

Python has a talking stick. It is called the **Global Interpreter Lock**, or **GIL** — a lock inside the standard Python program that lets only one thread at a time run Python code. It is the reason a laptop with eight cores can run a pure-Python loop no faster with eight threads than with one. It is also the reason some threaded programs speed up beautifully: the GIL only guards *speaking*, and a lot of real work is silent.

This matters the moment a GNC team tries to use all the cores in a machine. A 500-case Monte Carlo of a landing, a batch of telemetry downloads from ground stations, a pile of large matrix products for a covariance analysis — each one wants a different tool. By the end of this lesson you will know what the GIL blocks, what it leaves alone, and how to pick between **threads** and **processes** for a given job, backed by measurements you can repeat on your own machine.

## Threads and processes

Start with two ways to share a job with helpers.

The first is roommates in one apartment. They share the same kitchen, the same fridge and the same whiteboard. If one writes a shopping list on the whiteboard, everyone sees it at once. That is a **thread** — one line of work running inside a program, sharing all of the program's memory with the other threads.

The second is neighbors in separate houses. Each has a private kitchen and fridge. To share a shopping list, one has to write it down and carry it over. That is a **process** — a whole running program with its own private memory. Two processes cannot see each other's variables. They only share what is deliberately sent between them.

Each has a cost and a benefit:

- Threads are cheap to start (about a millisecond for a small pool) and share data for free. But in standard Python they take turns on the GIL.
- Processes cost more to start (about $0.01$ to $0.1\,\mathrm{s}$ for a pool of four, depending on how they are started) and must copy data across. But each process has its **own** interpreter and its own GIL, so they genuinely run at the same time on different cores.

A **core** is one independent worker inside the processor chip. Your machine has a fixed number of them, and Python will tell you how many:

```python
import os
print(os.cpu_count())
# 4
```

That $4$ is the machine these lesson timings came from. Yours might say $8$ or $16$. Every timing in this lesson is from one run on that one machine, so treat the numbers as the shape of the answer, not as the answer. Your speedups will differ, and on a busy machine they will wobble from run to run.

## What the GIL does

The standard Python program, called CPython, does not run your source code directly. It first translates each function into small instructions called **[[bytecode|bytecode]]** — steps like "load this variable", "add these two", "store the result". Then an **interpreter** loop reads the bytecode one instruction at a time and carries it out.

The GIL is a single lock around that interpreter loop. A thread must hold the lock to execute bytecode. So:

- Two threads can never execute Python bytecode at the same instant, in the same process.
- A thread that is running Python gives up the lock every so often so the others get a turn. CPython asks the running thread to hand it over after a **[[switch interval|switch-interval]]** of $5\,\mathrm{ms}$ by default.
- A thread gives up the lock at once whenever it starts to wait for something, such as a file or a network reply.

Why have a lock at all? Every Python object carries a count of how many names point at it, and the object is freed when that count reaches zero. That bookkeeping is called **[[reference counting|reference-counting]]**. If two threads bumped the same count at the same time, one update could be lost, and an object could be freed while still in use. One big lock was the simple, fast way to make that impossible.

::: key
What does the GIL actually prevent? Two threads executing Python bytecode at the same time. It does not block threads waiting on I/O, nor threads inside NumPy, BLAS or compiled extensions that release it, which is why array-heavy code can still scale with threads.
:::

Read that twice. The GIL prevents one specific thing. Everything else is allowed.

## Measuring it: pure-Python work on threads

Here is a small piece of pure-Python work: stepping a falling body forward in time with a loop. There is no NumPy inside, so every step is bytecode. The script runs four copies of it three ways — one after another, on four threads, and on four processes — and times each. Save it as `gil_cpu.py` and run it with `python3 gil_cpu.py`.

```python
import os
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor


def coast(n):
    """Pure-Python work: step a falling body forward n times."""
    h, v, dt = 0.0, 300.0, 0.001
    for _ in range(n):
        v -= 9.81 * dt
        h += v * dt
    return h


def timed(label, fn):
    t0 = time.perf_counter()
    fn()
    dt = time.perf_counter() - t0
    print(f"{label:<10} {dt:5.2f} s")
    return dt


if __name__ == "__main__":
    print("cores:", os.cpu_count())
    N = 10_000_000
    jobs = [N] * 4

    timed("serial", lambda: [coast(n) for n in jobs])
    with ThreadPoolExecutor(max_workers=4) as pool:
        timed("threads", lambda: list(pool.map(coast, jobs)))
    with ProcessPoolExecutor(max_workers=4) as pool:
        timed("processes", lambda: list(pool.map(coast, jobs)))

# One run on a 4-core machine (yours will differ):
# cores: 4
# serial      1.57 s
# threads     1.65 s
# processes   0.53 s
```

A few things in that script are new, so take them one at a time.

- `ThreadPoolExecutor` and `ProcessPoolExecutor` come from the standard library module `concurrent.futures`. Each is a **pool** — a team of workers kept ready to take jobs. `max_workers=4` sets the team size.
- `pool.map(coast, jobs)` works like the built-in `map`: it calls `coast` on each item of `jobs`, but hands the calls out to the workers. Wrapping it in `list(...)` waits until every result is back.
- The `with` block shuts the pool down cleanly at the end, waiting for any unfinished work.
- `if __name__ == "__main__":` is the **[[main guard|main-guard]]**. The code under it runs only when you start this file directly, not when another Python process imports it. Worker processes may import your file to find `coast`; without the guard, each of them would try to start its own pool, and Python stops with an error. Any script that starts processes needs it.

::: example Reading the timing table
The run above gave serial $1.57\,\mathrm{s}$, threads $1.65\,\mathrm{s}$ and processes $0.53\,\mathrm{s}$ for four identical jobs.

The **speedup** is the old time divided by the new time — how many times faster the new way is.

For threads: $1.57 / 1.65 \approx 0.95$. A speedup below $1$ means a *slowdown*. The four threads took turns on the GIL, so the work was still done one piece at a time, and passing the lock back and forth added about $5\%$.

For processes: $1.57 / 0.53 \approx 2.96$. Close to $3$ times faster on $4$ cores.

Why not the full $4$? Starting the worker processes, sending each its job and collecting the result all take time, and other programs on the machine were using a little of the processor too. A speedup of about $3$ on $4$ cores is a normal, healthy result. Sanity check: it cannot be more than $4$ with four cores doing equal shares of work, and it is not.
:::

::: warning Threads that seem to work
The GIL makes each *single* bytecode step safe, not your whole line of code. A line like `total = total + 1` is several bytecode steps (read, add, write), and the lock can change hands between them, so two threads can both read the old value and one update is lost. It may pass a test a thousand times and fail on the next. If threads share and change the same variable, protect it with a `threading.Lock`, or better, have each thread return its own result and combine them at the end.
:::

## What the GIL does not block: waiting

Now the silent work. Think of eight friends each phoning a different pizza shop. Most of each call is waiting on hold. One friend can hold the talking stick and speak while the other seven wait on hold — waiting does not need the stick.

Programs wait all the time. They wait for a file to come off the disk, for a reply from a server, for a sensor to send its next packet. That is **I/O** — input and output, the program talking to the world outside its memory. While a thread waits on I/O, CPython hands the GIL to someone else.

Here `time.sleep` stands in for a network request to a ground station. Each request takes $0.25\,\mathrm{s}$, almost all of it waiting.

```python
import time
from concurrent.futures import ThreadPoolExecutor


def fetch_pass(station):
    """Stand-in for a network request: mostly waiting."""
    time.sleep(0.25)          # the thread waits; the GIL is free
    return f"{station}: ok"


stations = ["KSC", "VAN", "WAL", "HAW", "GUA", "SVA", "MAD", "CAN"]

t0 = time.perf_counter()
for s in stations:
    fetch_pass(s)
print(f"one at a time: {time.perf_counter() - t0:.2f} s")

t0 = time.perf_counter()
with ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(fetch_pass, stations))
print(f"8 threads:     {time.perf_counter() - t0:.2f} s")
print(results[0])

# one at a time: 2.00 s
# 8 threads:     0.25 s
# KSC: ok
```

Eight waits of $0.25\,\mathrm{s}$ in a row take $8 \times 0.25 = 2.00\,\mathrm{s}$. On eight threads the waits overlap, so the whole batch takes about as long as one wait: an $8\times$ speedup, with only $4$ cores. Cores do not matter much here, because nobody is computing. That is the first job threads are made for.

## What the GIL does not block: compiled numerics

The second kind of silent work is number crunching that happens outside the interpreter.

When you call `np.sin(x)` on an array with five million numbers, Python runs a handful of bytecode steps to make the call. Then NumPy's compiled C loop does all five million sines. That C loop does not touch any Python objects while it runs, so NumPy **releases the GIL** — hands the stick back — for the duration, and takes it again when it is done. While one thread is deep in that loop, another thread can take the GIL and start its own NumPy call.

The same is true of large matrix products, which NumPy passes to a **[[BLAS|blas]]** library, and of many SciPy routines, and of any compiled extension written to release the lock: Numba functions compiled with `nogil=True`, Cython code inside a `with nogil:` block, and C++ code behind pybind11 that uses `py::gil_scoped_release`. You will meet all three in the Numba and pybind11 lessons.

```python
import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"   # so NumPy itself uses one core
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor

rng = np.random.default_rng(0)
blocks = [rng.normal(size=5_000_000) for _ in range(4)]


def heavy(x):
    # every line runs inside NumPy's compiled loops
    return np.sqrt(np.exp(np.sin(x) ** 2)).sum()


t0 = time.perf_counter()
serial = [heavy(b) for b in blocks]
t_serial = time.perf_counter() - t0

with ThreadPoolExecutor(max_workers=4) as pool:
    t0 = time.perf_counter()
    threaded = list(pool.map(heavy, blocks))
    t_threads = time.perf_counter() - t0

print(f"serial:    {t_serial:.2f} s")
print(f"4 threads: {t_threads:.2f} s")
print(f"speedup:   {t_serial / t_threads:.1f}x")
print(serial == threaded)

# One run on a 4-core machine (other runs gave from 2x to 3.2x):
# serial:    0.45 s
# 4 threads: 0.15 s
# speedup:   3.0x
# True
```

The first two lines tell the BLAS library inside NumPy to use one core. Some NumPy operations — matrix products especially — already spread themselves over every core without being asked. If we let them, the comparison would mix two kinds of threading together. With it set to $1$, every speedup you see comes from our four Python threads.

The result: about $3\times$ on $4$ cores in that run, and at least $2\times$ in every other run on a busy machine — from threads, in standard Python with its GIL. The last line checks that the threaded answers match the serial ones exactly, which they do: each thread computed the same sums on the same data.

::: warning A thread speedup is not a license
Threads only win when *most* of the time is spent in released-GIL code. A function that calls NumPy on small arrays of a few hundred numbers spends most of its time in the Python bytecode around those calls, and threads will not help it. Profile first, as in the first lesson, and check what fraction of the time is really inside compiled code.
:::

## Processes for CPU-bound Python

A job is **CPU-bound** when its speed is limited by how fast the processor can compute, not by waiting. Most simulation code in Python is CPU-bound: an integrator loop, a guidance law evaluated every step, event checks, logging into lists. Threads cannot help it, because it is all bytecode.

Processes can. Each process is a separate copy of Python with its own interpreter and its own GIL, so four processes really do run four loops at once on four cores. The price is that they share nothing automatically. Their arguments and results have to be packed up and sent across, which the next lesson measures carefully.

How the worker processes get started is set by a **[[start method|start-methods]]**. On Linux, Python up to 3.13 uses `fork`, which clones the running program almost instantly; macOS and Windows use `spawn`, which starts a fresh Python and imports your file. On the test machine a pool of four took about $0.01\,\mathrm{s}$ to start with `fork` and $0.09\,\mathrm{s}$ with `spawn`. Both are tiny next to a Monte Carlo case that runs for seconds, but they add up if you create a new pool for every small job. Create the pool once and reuse it.

::: key
Threads or processes for a 500-case Monte Carlo in pure Python? Processes. Each case is CPU-bound Python, so threads serialise on the GIL. joblib or ProcessPoolExecutor gives near-linear scaling until memory bandwidth or per-case startup cost dominates.
:::

**Near-linear scaling** means the speedup grows almost in step with the number of cores: about $2\times$ on $2$ cores, about $4\times$ on $4$. It stops growing once something shared runs out. **[[Memory bandwidth|memory-bandwidth]]** — how fast the chip can move data between memory and the cores — is shared by every core, so if every worker streams big arrays, adding cores stops helping. And if each case is so short that starting it costs as much as running it, the start-up cost wins.

::: example Planning a 500-case dispersion
A team's landing Monte Carlo has $500$ cases. A single case is pure-Python physics and takes $4.8\,\mathrm{s}$. The workstation has $8$ cores.

**One after another.** $500 \times 4.8 = 2400\,\mathrm{s}$. Divide by $60$: $40\,\mathrm{min}$.

**Eight threads.** Every case is bytecode, so the threads take turns on the GIL. The best case is the same $40\,\mathrm{min}$, and in practice a few percent worse, as the timing table showed ($0.95\times$).

**Eight processes.** With perfect scaling, $2400 / 8 = 300\,\mathrm{s} = 5\,\mathrm{min}$. The test machine reached about $3$ of a possible $4$, so expect somewhat more than $5$ minutes — perhaps $6$ or $7$.

Sanity check: the process answer is between the perfect $5$ minutes and the serial $40$, as it must be. And notice the size of the prize. Making each case itself faster — say, $10\times$ by vectorising or compiling the hot loop, as earlier lessons showed — would multiply with the $8\times$ from processes, not replace it.
:::

## Choosing the tool

Put it together as a short list of questions to ask about the slow part of your program.

1. **Is it mostly waiting?** Downloads, database queries, reading many small files, talking to hardware. Use **threads**. They are cheap, share memory, and the GIL is free while they wait.
2. **Is it mostly inside compiled code that releases the GIL?** Big NumPy array operations, large matrix products, SciPy routines on big inputs, Numba or Cython or C++ code that drops the lock. **Threads** can work, and avoid copying data. Remember that some of these (BLAS especially) may already be using every core on their own.
3. **Is it Python bytecode doing arithmetic, loops, and object handling?** Use **processes**. Each gets its own GIL.

| Workload | Bottleneck | Tool | Why |
|---|---|---|---|
| 200 telemetry downloads | waiting on network | threads | GIL released while waiting |
| Large NumPy ufuncs on 4 blocks | compiled loops | threads | NumPy releases the GIL |
| 500 pure-Python sim cases | bytecode | processes | one GIL per process |
| Tiny NumPy calls in a Python loop | bytecode around the calls | processes, or fix the loop first | the GIL is held most of the time |

Future Python may soften this. There is now an optional **[[free-threaded|free-threading]]** build of CPython with no GIL at all. For the Python most teams run today, the table above is the rule.

## Check yourself

::: check
In your own words, what exactly does the GIL stop from happening? Name two kinds of work it does not stop.
:::

::: answer
It stops two threads in the same process from executing Python bytecode at the same moment. Only the thread holding the lock may run interpreter instructions. It does not stop a thread from waiting on I/O (a file read, a network reply, a `time.sleep`), because a waiting thread releases the lock. And it does not stop compiled code that has released the lock — NumPy's element-wise loops on large arrays, BLAS matrix products, and Numba, Cython or C++ code written to drop the lock — from running in parallel with other threads.
:::

::: check
A pure-Python function takes $3.0\,\mathrm{s}$ for one input. You run it on $6$ inputs using `ThreadPoolExecutor(max_workers=6)` on a $6$-core machine. Roughly how long does it take, and why?
:::

::: answer
About $6 \times 3.0 = 18\,\mathrm{s}$, perhaps a little more. Every line is bytecode, so the six threads take turns on the GIL and the work is done one piece at a time. Passing the lock back and forth adds a few percent (in the lesson's measurement, threads were at $0.95\times$ serial speed). With `ProcessPoolExecutor` on six cores it would be closer to $3\,\mathrm{s}$ plus start-up and transfer.
:::

::: check
A script needs to fetch $40$ files from a server. Each request spends about $0.5\,\mathrm{s}$ waiting for the reply and almost no time computing. Estimate the time one at a time and with $20$ threads.
:::

::: answer
One at a time: $40 \times 0.5 = 20\,\mathrm{s}$. With $20$ threads, the waits overlap $20$ at a time, so the $40$ requests go in $40 / 20 = 2$ waves of about $0.5\,\mathrm{s}$: about $1\,\mathrm{s}$. The number of cores barely matters, because nobody is computing — the GIL is free while each thread waits. (In practice the server's own limits may slow this down.)
:::

::: check
You write a script that uses `ProcessPoolExecutor` but forget `if __name__ == "__main__":`. On a Mac it crashes with an error about starting new processes. What went wrong?
:::

::: answer
macOS starts workers with the `spawn` method, which launches a fresh Python and imports your file so the worker can find your function. Without the guard, importing the file also runs the code that creates the pool — so each worker tries to create workers of its own. Python detects this and stops with an error. Putting the pool code under `if __name__ == "__main__":` means it runs only in the original program, not when a worker imports the file.
:::

::: check
A colleague times four large NumPy workloads on four threads and sees almost no speedup, even though NumPy releases the GIL. Give two possible reasons.
:::

::: answer
First, NumPy's BLAS library may already be using all four cores inside each call (for matrix products it does this by default), so the serial run was already parallel and there is nothing left to gain; setting `OPENBLAS_NUM_THREADS=1` before importing NumPy would show whether that is the cause. Second, the arrays may be small, so most of the time is Python bytecode around the NumPy calls, with the GIL held. A third possibility is that the work is limited by memory bandwidth, which all cores share.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| thread | a line of work inside one program, sharing its memory | cheap to start, shares data for free |
| process | a separate running program with private memory | own interpreter and own GIL; data must be sent across |
| GIL | lock around CPython's interpreter loop | only one thread executes Python bytecode at a time |
| switch interval | how often a running thread offers the GIL | $5\,\mathrm{ms}$ by default |
| released GIL | compiled code that hands the lock back while it works | NumPy loops, BLAS, Numba `nogil`, Cython `nogil`, pybind11 release |
| I/O-bound | limited by waiting | threads |
| CPU-bound Python | limited by bytecode | processes |
| speedup | old time ÷ new time | measured: threads $0.95\times$, processes $2.96\times$ on $4$ cores |
| main guard | `if __name__ == "__main__":` | required around code that starts processes |

The next lesson puts processes to work on a real Monte Carlo with `multiprocessing`, `concurrent.futures` and joblib, gives each case its own random numbers, and measures the hidden cost of sending big arrays to the workers.

::: context bytecode The small steps Python really runs
Python compiles each function into a list of simple instructions before running it. The line `v -= 9.81 * dt` becomes six of them: load `v`, load the number $9.81$, load `dt`, multiply, subtract in place, store `v`. You can see the list yourself with the standard `dis` module. The interpreter reads these instructions one by one, which is why a loop of a million trips runs a few million instructions and why pure-Python arithmetic is slow next to compiled code. The GIL guards exactly this instruction-by-instruction reading.
:::

::: context switch-interval Passing the stick every five milliseconds
If one thread held the GIL forever, the others would starve. So CPython sets a flag every so often asking the running thread to let go. The default gap is $0.005\,\mathrm{s}$, and you can read it with `sys.getswitchinterval()`. When the flag is set, the running thread releases the lock at a safe point between bytecode steps and another waiting thread picks it up. Five milliseconds is short for a person but long for a processor: at a couple of billion cycles per second, it is roughly ten million cycles of work per turn.
:::

::: context reference-counting Why one lock was the easy answer
Every Python object carries a number: how many names, lists or other objects point at it. Assigning `a = b` adds one; deleting a name subtracts one; at zero, the memory is freed. Adding one is really three steps — read the number, add, write it back. If two threads interleaved those steps on the same object, one of the updates could vanish, and later the object might be freed while something still used it, crashing the program. Putting a lock on every object would be slow. One lock over the whole interpreter kept single-threaded Python fast and safe, at the cost of parallel bytecode.
:::

::: context main-guard What the name main means
When Python runs a file directly, it sets that file's special variable `__name__` to the text `"__main__"`. When the same file is loaded any other way, `__name__` is something else: the module's own name, such as `"gil_cpu"`, when another file imports it, or `"__mp_main__"` when a spawned worker loads it. So `if __name__ == "__main__":` is a question: "was I started directly?" Code under it runs for the person who typed the command, and is skipped when a worker process imports the file to find the functions it needs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="150" height="120" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">python3 gil_cpu.py</text>
  <rect x="32" y="46" width="126" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="95" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">def coast(...) runs</text>
  <rect x="32" y="86" width="126" height="36" fill="#f2b880" stroke="#1f2a44"/>
  <text x="95" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">main block runs:</text>
  <text x="95" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">starts the pool</text>
  <rect x="190" y="15" width="150" height="120" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">worker imports file</text>
  <rect x="202" y="46" width="126" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="265" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">def coast(...) runs</text>
  <rect x="202" y="86" width="126" height="36" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="265" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">main block</text>
  <text x="265" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">skipped</text>
</svg>
```
:::

::: context blas The library under every matrix product
BLAS stands for Basic Linear Algebra Subprograms, a standard set of routines for vector and matrix arithmetic first written in the 1970s. Today it names an interface, with many fast implementations: OpenBLAS (the one NumPy ships with from pip), Intel's MKL, and Apple's Accelerate. These are tuned by hand for each chip and usually spread a big matrix product over every core by themselves. That is why `A @ B` on two large matrices can already keep a whole machine busy without you starting a single thread — and why adding your own threads on top may gain nothing.
:::

::: context start-methods Three ways to start a worker
`fork` copies the running program in one step: the worker starts life with every variable the parent had. It is fast but can misbehave if the parent was already running threads, which is why Python 3.14 changed the default on Linux to `forkserver`, a small clean helper process that forks the workers. `spawn` starts a brand-new Python and imports your file; it is the slowest to start and the default on macOS and Windows. Code that works under `spawn` works under all three, so write for it: keep the main guard and make worker functions importable at the top level of a file.
:::

::: context memory-bandwidth When more cores stop helping
Cores are fast; memory is comparatively slow. All the cores in a chip reach main memory through the same shared connection, which can move a few tens of gigabytes per second on a typical workstation. If each worker only reads a little data and does a lot of arithmetic on it, four workers get four times the work done. If each worker streams large arrays and does one addition per number, they queue up for the shared connection and the speedup flattens out well before the core count.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="140" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">cores used (1 to 8)</text>
  <text x="14" y="80" font-size="11" fill="#1f2a44" transform="rotate(-90 14 80)" text-anchor="middle">speedup</text>
  <line x1="50" y1="140" x2="330" y2="20" stroke="#1d6fd1" stroke-width="2"/>
  <text x="300" y="20" font-size="11" text-anchor="end" fill="#1d6fd1">compute-heavy</text>
  <polyline points="50,140 85,125 120,110 155,100 190,95 225,93 260,92 295,92 330,92" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="330" y="84" font-size="11" text-anchor="end" fill="#b4232c">memory-heavy</text>
</svg>
```
:::

::: context free-threading Python without the GIL
A proposal known as PEP 703 made the GIL optional. Python 3.13 shipped an experimental "free-threaded" build, often installed as `python3.13t`, in which threads really do run bytecode in parallel. Python 3.14 made that build officially supported, though still not the default. It pays for the freedom with more careful locking inside the interpreter, which makes single-threaded code somewhat slower, and some compiled libraries must be rebuilt for it. You can ask a running Python whether its GIL is on with `sys._is_gil_enabled()` in 3.13 and later.
:::
