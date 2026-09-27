---
id: l04-numba-njit
title: Numba – compiling the hot loop
minutes: 22
covers:
  - 'Numba njit: nopython mode, supported subset, cache=True, parallel and prange'
---

Imagine cooking from a recipe written in a language you do not speak. You have a phrasebook. Every time you reach "fold in the egg whites", you stop, look up each word, work out what it means, and then do it. Tomorrow you cook the same dish and look up the same words again. The cooking itself takes seconds. The looking up takes all afternoon.

Now imagine a friend translates the whole recipe once, the first time you use it, and tapes the translation to the fridge. The first day is slow, because of the translating. Every day after that, you read your own language at full speed.

Plain Python runs your code the first way. An **interpreter** — a program that reads your code and carries it out one small instruction at a time — looks up what every `+` and `*` means, every time around the loop. **Numba** is the friend with the translation. It is a **[[just-in-time compiler|jit-name]]** — a tool that turns a Python function into machine code the first time you call it, then reuses that machine code on every later call. In the last lesson you removed loops by working on whole arrays. This lesson is for the loops you cannot remove: a flight simulator stepping forward in time, where each step needs the one before it. That time-stepping loop sits at the heart of every 6-DOF simulator (six degrees of freedom: three for position, three for orientation) a GNC team runs in its dispersions.

## Why a Python loop is slow

Take one line from a simulator: `v += a * dt`. To your eye it is one multiply and one add. To the interpreter it is a small errand. It fetches the object called `a` and checks what kind of thing it is. It finds the multiply routine for that kind. It builds a brand-new Python number object to hold the answer. Then it does the same for the add. Each number lives inside a **[[boxed object|boxing]]** — a wrapper carrying its type, a reference count and the value — so even a plain `float` costs dozens of bytes and some bookkeeping.

A CPU can do the multiply and the add in about a nanosecond. The errands around them take tens of nanoseconds. In a tight loop, the errands are nearly all of the time.

Here is a coasting sounding rocket, the same kind of model you profiled in the first lesson. It goes straight up at speed `v0`, gravity and drag slow it, and the loop steps forward $0.001\,\mathrm{s}$ at a time until it lands. Save it as `coast.py`.

```python
import math
import numpy as np
from numba import njit

def coast_py(v0, m, dt):
    """Straight-up coast with drag: time until the rocket is back at h = 0."""
    h, v, t = 0.0, v0, 0.0
    while h >= 0.0:
        rho = 1.225 * math.exp(-h / 8500.0)          # air density, kg/m^3
        drag = 0.5 * rho * v * abs(v) * 0.36         # N, with Cd * area = 0.36 m^2
        g = 3.986e14 / (6.371e6 + h) ** 2            # m/s^2
        v += (-g - drag / m) * dt
        h += v * dt
        t += dt
    return t

coast = njit(coast_py)      # the same function, compiled by Numba
```

You cannot vectorise this loop over time. Step 500 needs the height from step 499. That dependence is exactly the kind of loop Numba was built for.

## Your first njit

The last line of `coast.py` is the whole trick. `njit` takes a Python function and hands back a compiled version of it. Most people write it as a **decorator** — a line starting with `@` placed above a function, which wraps the function as it is defined:

```python
@njit
def coast(v0, m, dt):
    ...
```

Read `@njit` as "at n-jit". The "n" stands for **nopython**, which the next section explains.

Now call both versions and time them:

```python
import time
from coast import coast_py, coast

t0 = time.perf_counter()
print(round(coast_py(300.0, 25.0, 0.001), 3))   # 14.846
t1 = time.perf_counter()
print(round(coast(300.0, 25.0, 0.001), 3))      # 14.846  (first call: compiles)
t2 = time.perf_counter()
print(round(coast(300.0, 25.0, 0.001), 3))      # 14.846  (second call: runs)
t3 = time.perf_counter()

print(f"Python {t1 - t0:.4f} s, first njit {t2 - t1:.3f} s, second njit {t3 - t2:.5f} s")
# Python 0.0047 s, first njit 0.470 s, second njit 0.00053 s
print(coast.signatures)
# [(float64, float64, float64)]
```

These timings come from one machine, a 4-core Intel Xeon at 2.1 GHz. Yours will differ, sometimes by a factor of two or more. The pattern is what carries over.

Three things happened.

- All three calls agree: the rocket is in the air for $14.846\,\mathrm{s}$. Compiling did not change the physics.
- The **first** compiled call was a hundred times *slower* than Python. That $0.47\,\mathrm{s}$ is Numba reading the function, working out the types and producing machine code. You pay it once per process.
- The **second** compiled call took $0.53\,\mathrm{ms}$ against Python's $4.7\,\mathrm{ms}$ — about $8.9$ times faster. The loop ran $14\,846$ steps, so Python spent about $317\,\mathrm{ns}$ per step and Numba about $36\,\mathrm{ns}$.

The last line shows the **[[signature|signature]]** Numba compiled: the types of the arguments, here three 64-bit floats. Numba compiles one machine-code version per distinct set of argument types. Call `coast` with integers and it would compile a second version.

::: example A 500-case dispersion
A dispersion runs the coast 500 times with launch speeds drawn between $250$ and $350\,\mathrm{m/s}$. Here are a pure-Python loop and a compiled loop over the cases.

```python
import timeit
import numpy as np
from numba import njit, prange
from coast import coast_py, coast

rng = np.random.default_rng(1)
v0s = rng.uniform(250.0, 350.0, 500)          # 500 launch speeds, m/s

def all_py(v0s, m, dt):
    return [coast_py(v0, m, dt) for v0 in v0s.tolist()]

@njit
def all_nb(v0s, m, dt):
    out = np.empty(v0s.size)
    for i in range(v0s.size):
        out[i] = coast(v0s[i], m, dt)
    return out

@njit(parallel=True)
def all_par(v0s, m, dt):
    out = np.empty(v0s.size)
    for i in prange(v0s.size):
        out[i] = coast(v0s[i], m, dt)
    return out

all_nb(v0s, 25.0, 0.001)      # warm up: compile before timing
all_par(v0s, 25.0, 0.001)
for f in (all_py, all_nb, all_par):
    best = min(timeit.repeat(lambda: f(v0s, 25.0, 0.001), number=1, repeat=5))
    print(f"{f.__name__:7s} {best:.3f} s   mean flight {np.mean(f(v0s, 25.0, 0.001)):.3f} s")
# all_py  1.668 s   mean flight 14.816 s
# all_nb  0.263 s   mean flight 14.816 s
# all_par 0.069 s   mean flight 14.816 s
```

Look at the first two lines of output (the third is for a later section).

Step 1, the speedup: $1.668 / 0.263 \approx 6.3$. The compiled dispersion is about six times faster.

Step 2, the check: the mean flight time is $14.816\,\mathrm{s}$ both ways. Always compare answers before celebrating a speedup.

Step 3, note the method: each number is the best of five repeats, taken *after* a warm-up call, so compile time is not in it. On a second run of the same script the numbers moved by a few percent ($1.596\,\mathrm{s}$ and $0.267\,\mathrm{s}$). That spread is normal, and the benchmarking lesson at the end of the module shows how to report it.

Why six times here but nine times for the single case? The Python loop over cases has its own overhead, and the mean case in this dispersion is a little shorter. Speedups depend on the workload, which is why you measure the one you care about.
:::

## Nopython mode and the supported subset

**Nopython mode** means Numba compiles the *whole* function to machine code that never touches a Python object. Every variable must have one fixed machine type — a 64-bit float, a 64-bit integer, a 1-D array of float64 — so the CPU can work on raw numbers with no errands. `@njit` is shorthand for `@jit(nopython=True)`.

How does Numba know the types when you never wrote them down? It uses **[[type inference|type-inference]]**. It looks at the types of the arguments you passed, then follows the code line by line. `h` starts as `0.0`, a float. `math.exp` of a float is a float. A float times a float is a float. If every line works out, compilation succeeds. If any line produces something Numba cannot give a fixed machine type, it stops with a `TypingError`.

That means Numba compiles a **supported subset** of Python, not all of it. Roughly:

- **Works:** integers, floats, complex numbers and booleans; NumPy arrays and most of the NumPy functions and ufuncs (element-by-element functions like `np.sin`) on them (including `np.random`); the `math` module; tuples; `for`, `while` and `if`; calls to other `@njit` functions; lists whose items are all one type; and Numba's own `numba.typed.List` and `numba.typed.Dict`.
- **Does not work:** anything that needs the general Python object machinery.

::: key
Two things Numba cannot compile in nopython mode: arbitrary Python objects, including most classes, pandas DataFrames, dicts with heterogeneous value types and general list-of-anything; and calls into libraries it has no lowering for, such as SciPy routines or the Python C API.
:::

**Lowering** is the compiler's word for turning a high-level operation into machine instructions. Numba ships lowerings for NumPy and `math`. It has none for `scipy.integrate.solve_ivp` or a pandas `groupby`, so it cannot compile code that calls them.

Here is what the error looks like when you pass a plain Python dict:

```python
from numba import njit

@njit
def total_mass(stage):
    return stage["dry"] + stage["prop"]

total_mass({"dry": 22.0, "prop": 410.0})
# TypingError: Failed in nopython mode pipeline (step: nopython frontend)
# non-precise type pyobject
```

"Non-precise type pyobject" is Numba saying "this is a general Python object and I cannot pin it to a machine type". The fix is a habit: **unpack at the boundary**. Keep the dicts, DataFrames and classes in the Python harness. Pull the numbers out into floats and NumPy arrays, and pass only those into the compiled core — `total_mass(22.0, 410.0)`, or a column as `df["v0"].to_numpy()`.

::: warning A TypingError is a gift
When `@njit` fails, the error points at the line and the type that broke it. People are tempted to switch to plain `@jit` with options that allow Python objects, to make the error go away. That trades a clear message for slow code. Read the error, move the object out of the compiled function, and try again. The next lesson shows how slow the other road is.
:::

## cache=True: keep the translation

The first call of `coast` cost $0.47\,\mathrm{s}$. That cost comes back in every *new* Python process: every time you rerun the script, every worker process in a parallel dispersion, every job in a test suite.

Pass `cache=True` and Numba writes the machine code to disk, in the `__pycache__` folder next to your source file. The next process that imports the function loads the saved code instead of compiling it.

```python
@njit(cache=True)
def coast(v0, m, dt):
    ...
```

Some of that $0.47\,\mathrm{s}$ is Numba starting itself up the first time it compiles anything in a process, and caching does not remove that part. To see the two costs apart, compile a tiny function first, then call the cached `coast`:

```python
import time
from numba import njit

@njit
def tiny(x):
    return x + 1.0

t0 = time.perf_counter(); tiny(1.0); t1 = time.perf_counter()
from coast_cached import coast        # coast.py with @njit(cache=True)
t2 = time.perf_counter(); coast(300.0, 25.0, 0.001); t3 = time.perf_counter()
print(f"Numba start-up {t1 - t0:.2f} s, coast first call {t3 - t2:.3f} s")
# 1st run: Numba start-up 0.36 s, coast first call 0.163 s
# 2nd run: Numba start-up 0.34 s, coast first call 0.003 s
# 3rd run: Numba start-up 0.35 s, coast first call 0.003 s
```

On the first run, compiling `coast` took $0.163\,\mathrm{s}$. On every later run, loading it from the cache took $0.003\,\mathrm{s}$ — fifty times less.

::: example What the cache is worth in a test suite
A continuous-integration job — the automatic test run on every code change — starts 40 separate test processes, and each one calls `coast`. Without the cache, each process compiles it: $40 \times 0.163 = 6.52\,\mathrm{s}$. With the cache warm, each loads it: $40 \times 0.003 = 0.12\,\mathrm{s}$. The saving is about $6.4\,\mathrm{s}$ per run of the suite, from one keyword. With ten compiled functions, it is about a minute.
:::

::: warning The cache watches only its own file
Numba throws a cached version away when the function's own source file changes. It does not notice when a *different* file that the function calls has changed. If `coast` calls a compiled `density` in `atmos.py` and you edit `atmos.py`, the cached `coast` can keep running the old density. When results look stale, delete the `__pycache__` folder and rerun.
:::

## parallel=True and prange: sharing the cases out

Picture 500 envelopes to stuff and four friends at the table. You do not stuff them one at a time. You give each friend a pile of 125. Nobody needs anyone else's envelopes, so four people finish in about a quarter of the time.

The 500 dispersion cases are like that. Case 17 never looks at case 18. Work that splits into fully independent pieces like this is called **embarrassingly parallel**.

Numba does the dealing for you. Add `parallel=True` to the decorator and write `prange` ("parallel range") where you would write `range`. Numba cuts the loop's iterations into chunks and runs the chunks on several **[[threads|threads]]** — separate workers inside one program that each run on their own CPU core. Because this is machine code with no Python objects, the threads run truly at the same time.

`parallel=True` also lets Numba spread whole-array expressions like `a * b + c` across the cores, but `prange` is the part you control directly.

::: example Four cores on the dispersion
Look at the third line of the dispersion output: `all_par` took $0.069\,\mathrm{s}$, against $0.263\,\mathrm{s}$ for the one-core compiled loop.

Step 1, the speedup from threads: $0.263 / 0.069 \approx 3.81$.

Step 2, the **parallel efficiency** — the speedup divided by the number of cores: $3.81 / 4 \approx 0.95$. Each core did about $95\%$ useful work. Close to perfect, because the cases are independent and each one is long enough to swamp the cost of handing it out.

Step 3, the whole journey: $1.668 / 0.069 \approx 24$. Compiling gave about $6\times$ and four cores gave about $3.8\times$; multiply them and you get the same $24\times$. The mean flight time is still $14.816\,\mathrm{s}$.
:::

### The two rules of prange

**Rule one: iterations must not step on each other.** In `all_par`, iteration `i` writes only `out[i]`. That is safe. If two iterations wrote to the same place — say every case added its landing error into `out[0]` — the threads would race. A **[[race condition|race]]** is two threads updating the same memory at the same moment, so one update overwrites the other and is lost. The answer comes out wrong, and differently wrong each run.

**Rule two: sums are allowed, but their order is not fixed.** There is one pattern Numba does handle for you, the **reduction** — a loop that folds many values into one, like `s += x[i]` or `p *= x[i]`. Numba gives each thread its own private partial sum, then adds the partial sums together at the end. No race.

But it changes the answer in the last few digits. Here is the same sum of one million random numbers with one to four threads:

```python
import numpy as np
import numba
from numba import njit, prange

@njit(parallel=True)
def total(x):
    s = 0.0
    for i in prange(x.size):
        s += x[i]          # Numba spots this as a reduction
    return s

x = np.random.default_rng(7).normal(0.0, 1.0, 1_000_000)
for n in (1, 2, 3, 4):
    numba.set_num_threads(n)
    print(n, repr(total(x)))
# 1 -112.78554893201051
# 2 -112.78554893200692
# 3 -112.78554893200169
# 4 -112.78554893202494
```

Four different answers from the same numbers. The spread is about $2.3 \times 10^{-11}$ on a total of about $113$, a relative difference of about $2 \times 10^{-13}$.

Nothing is broken. Floating-point addition is not **[[associative|associativity]]**: the grouping changes the rounding. In Python, `(0.1 + 0.2) + 0.3` gives `0.6000000000000001`, while `0.1 + (0.2 + 0.3)` gives `0.6`. Every computer addition rounds to the nearest representable number, and different groupings round at different moments. Splitting a sum across threads regroups it: thread one adds up its chunk, thread two adds up its chunk, and the chunk totals are added last. More threads, different chunks, different rounding. On some threading setups the chunking can even differ between runs with the same thread count.

::: key
A parallel reduction with `prange` adds its terms in chunks whose boundaries depend on the thread count and the scheduler. Floating-point addition is not associative, so the result can change in the last few digits between runs or machines. For bitwise-reproducible results, store per-case results in an array in parallel, then reduce them in one fixed order.
:::

::: warning Do not compare parallel results with ==
A regression test that checks `total(x) == -112.78554893201051` will pass on your laptop and fail on the build server with a different core count. Compare with a tolerance, like `np.isclose(a, b, rtol=1e-12)`. If a certification or review requires identical bits, use the per-case-array pattern from the key box: parallel for the heavy work, serial for the final sum.
:::

How many threads Numba uses is set by the environment variable `NUMBA_NUM_THREADS`, or at run time by `numba.set_num_threads(n)`, as the example did. By default it uses every core it can see.

## Check yourself

::: check
Your compiled function takes $0.4\,\mathrm{s}$ on its first call and $2\,\mathrm{ms}$ on every call after. A colleague times only the first call and reports "Numba made it slower". What happened, and how should it be measured?
:::

::: answer
The first call included compilation (and Numba's one-time start-up), which happens once per process for each new set of argument types. It is not the running speed of the function. Call the function once to warm it up, then time repeated calls and take the best or report the spread. If the first-call cost matters in practice — many short processes — add `cache=True` so later processes load saved machine code instead of compiling.
:::

::: check
Which of these can be passed straight into an `@njit` function: a NumPy float64 array, a pandas DataFrame, a tuple `(22.0, 410.0)`, an instance of your own `Stage` class? What do you do with the others?
:::

::: answer
The NumPy array and the tuple of floats are fine: both have fixed machine types. The DataFrame and the `Stage` instance are general Python objects, so nopython mode rejects them with a TypingError ("non-precise type pyobject"). Keep them in the Python harness and pass their contents in: columns as arrays with `df["col"].to_numpy()`, and attributes as floats, such as `stage.dry`.
:::

::: check
A dispersion loop runs in $2.0\,\mathrm{s}$ compiled on one core and $0.62\,\mathrm{s}$ with `prange` on four cores. Work out the speedup and the parallel efficiency.
:::

::: answer
Speedup $= 2.0 / 0.62 \approx 3.2$. Efficiency $=$ speedup $/$ cores $= 3.2 / 4 \approx 0.81$, so about $81\%$. That is decent. Some time is going to handing out work, uneven case lengths or memory traffic. It is worth checking that each case is long enough to be worth sending to a thread.
:::

::: check
Inside a `prange` loop, each case computes a miss distance `d`, and the code does `worst = max(worst, d)` and also `hist[bin] += 1` into a shared histogram array. Which line is a problem?
:::

::: answer
`worst = max(worst, d)` on a scalar is a reduction pattern Numba can handle, like a sum, and the maximum does not even depend on grouping. The histogram line is the problem: two cases landing in the same bin update the same array element at the same moment, which is a race, and counts get lost. Store each case's bin in `bins[i]` inside the `prange` loop, then build the histogram afterwards in an ordinary serial loop (or with `np.bincount`).
:::

::: check
You edit `aero.py`, which holds a compiled drag function called by a `@njit(cache=True)` simulator in `sim.py`. The simulator's results do not change. What is the likely reason and the fix?
:::

::: answer
The cached machine code for the simulator was keyed to `sim.py`, which did not change, so Numba kept loading the old version that has the old drag function built in. Numba does not track changes in other files a cached function depends on. Delete the `__pycache__` folder (or touch `sim.py`) so the simulator is recompiled.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| `@njit` | Compile a function to machine code on first call | Shorthand for `@jit(nopython=True)` |
| Nopython mode | No Python objects inside the compiled code | Every variable gets one machine type by type inference |
| Signature | The argument types a version was compiled for | New argument types trigger a new compilation |
| Supported subset | What Numba can compile | Numbers, NumPy arrays and functions, `math`, tuples, typed lists and dicts |
| Not supported | What stays in the harness | Most classes, DataFrames, heterogeneous dicts and lists, SciPy calls |
| `cache=True` | Save machine code to `__pycache__` | New processes load in milliseconds instead of compiling |
| `parallel=True`, `prange` | Split loop iterations across threads | Iterations must be independent; reductions allowed |
| Parallel efficiency | Speedup divided by core count | $0.263 / 0.069 / 4 \approx 0.95$ in the example |
| Reduction order | Chunked sums regroup additions | Last-digit differences; compare with a tolerance |

This lesson made Numba look like magic. The next lesson is about the times it is not: when adding `@njit` makes a function slower, and how to tell compile time, object mode and unsupported types apart.

::: context jit-name Just in time, and who built it
"Just in time" is borrowed from factories, where parts arrive at the assembly line at the moment they are needed instead of piling up in a warehouse. A just-in-time compiler translates a function at the moment it is first called, knowing the exact types it was called with. An **ahead-of-time** compiler, like the one for C++, translates everything before the program ever runs. Numba was started in 2012 at Continuum Analytics (now Anaconda) and is open source. Java and JavaScript engines use the same just-in-time idea inside every web browser.
:::

::: context boxing What a Python float really is
In C, a double-precision number is 8 bytes of bits and nothing else. In CPython, the float `2.5` is a whole object: a reference count (how many names point at it), a pointer to its type, and then the 8 bytes of value — 24 bytes in all. Every arithmetic result is a fresh object that must be created and later freed. Numba removes the box and keeps the raw 8 bytes in a CPU register.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44" font-weight="700">Python float object (24 bytes)</text>
  <rect x="20" y="30" width="96" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="116" y="30" width="96" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="212" y="30" width="96" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="68" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">ref count</text>
  <text x="164" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">type pointer</text>
  <text x="260" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">value 2.5</text>
  <text x="20" y="98" font-size="12" fill="#1f2a44" font-weight="700">Numba float64 (8 bytes)</text>
  <rect x="212" y="108" width="96" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260" y="129" font-size="11" text-anchor="middle" fill="#1f2a44">value 2.5</text>
  <text x="200" y="129" font-size="11" text-anchor="end" fill="#6c7a93">no box, no bookkeeping</text>
</svg>
```
:::

::: context signature One function, many versions
A Numba function is really a **dispatcher**: a front desk that looks at the types of the arguments on each call and routes to the matching machine-code version, compiling a new one if none exists. `coast(300.0, 25.0, 0.001)` compiles a float64 version. `coast(300, 25, 1)` with integers would compile a second one. You can list them with `.signatures`. The next lesson shows how accidental new signatures quietly cost compile time.
:::

::: context type-inference How Numba works out types
Type inference is like a detective following clues forward from the facts it is given. The arguments' types are the facts. Each operation has a rule: float times float is float, `len` of an array is an integer, indexing a float64 array gives a float64. Numba applies the rules to every line until every variable has a type. If a variable could be a float on one path and a string on another, there is no single machine type for it, and inference fails. That is why a function that is fine in Python can be rejected by `@njit`.
:::

::: context threads Threads, and a preview of the GIL
A thread is a worker inside one program. All threads share the same memory, which makes it cheap to hand them work — no copying — and dangerous if two of them write the same spot. Ordinary Python threads cannot run Python code at the same moment because of the **global interpreter lock**, the GIL. Numba's `prange` threads run compiled machine code with no Python objects, so the lock does not hold them back. Numba also has `@njit(nogil=True)`, which lets a compiled function release the lock so your own Python threads can run it side by side. The lesson on the GIL explains all of this properly.
:::

::: context race Two workers, one whiteboard
Two people are keeping a tally on a whiteboard. Both read "7" at the same moment. Both add one in their heads. Both write "8". Two events happened, but the tally went up by one. That is a race: the result depends on the exact timing of the two threads.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="60" width="80" height="40" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="85" font-size="13" text-anchor="middle" fill="#1f2a44">hist[3]</text>
  <text x="40" y="30" font-size="12" fill="#1d6fd1">thread A</text>
  <text x="270" y="30" font-size="12" fill="#1d6fd1">thread B</text>
  <text x="20" y="55" font-size="11" fill="#1f2a44">reads 7</text>
  <text x="20" y="75" font-size="11" fill="#1f2a44">adds 1</text>
  <text x="20" y="95" font-size="11" fill="#1f2a44">writes 8</text>
  <text x="280" y="55" font-size="11" fill="#1f2a44">reads 7</text>
  <text x="280" y="75" font-size="11" fill="#1f2a44">adds 1</text>
  <text x="280" y="95" font-size="11" fill="#1f2a44">writes 8</text>
  <line x1="75" y1="91" x2="138" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="276" y1="91" x2="222" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="135" font-size="12" text-anchor="middle" fill="#b4232c">two updates, final value 8, not 9</text>
</svg>
```

The cure is to give each iteration its own place to write, and combine afterwards.
:::

::: context associativity Why grouping changes the answer
A float64 carries about 16 significant digits. Picture a calculator that can only show 4 digits. With it, $(1000 + 0.4) + 0.4$ gives $1000$ then $1000$ again, because each $0.4$ is rounded away on its own. But $1000 + (0.4 + 0.4)$ adds $0.8$ first and rounds to $1001$. Same three numbers, different answers. A float64 does the same thing in its 16th digit, which is why summing in chunks moves the last digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="20" y="30" font-size="12" fill="#1f2a44">(1000 + 0.4) + 0.4</text>
  <text x="170" y="30" font-size="12" fill="#6c7a93">1000.4 → 1000</text>
  <text x="275" y="30" font-size="12" fill="#b4232c">= 1000</text>
  <text x="20" y="70" font-size="12" fill="#1f2a44">1000 + (0.4 + 0.4)</text>
  <text x="170" y="70" font-size="12" fill="#6c7a93">1000.8 → 1001</text>
  <text x="275" y="70" font-size="12" fill="#1d6fd1">= 1001</text>
  <text x="20" y="105" font-size="11" fill="#6c7a93">a 4-digit calculator rounds after every addition</text>
</svg>
```
:::
