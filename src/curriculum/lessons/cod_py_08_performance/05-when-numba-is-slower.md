---
id: l05-when-numba-is-slower
title: When @njit makes things slower
minutes: 18
covers:
  - 'Why an njit function can be slower: compile time, object mode fallback, unsupported types'
---

Suppose you need to get a letter to the mailbox at the end of your driveway. You could walk: twenty seconds. Or you could call a taxi: it is far faster than walking once it is moving, but it takes ten minutes to arrive, and you still have to walk to the curb and back. For the mailbox, the taxi loses. For a trip across town, the taxi wins by hours.

Numba is the taxi. The last lesson showed a coast simulation running about nine times faster per call once compiled. This lesson is about the trips where the taxi loses — where adding `@njit` makes the program slower, sometimes hundreds of times slower — and how to tell which of the usual causes you are looking at.

This matters in real GNC work because `@njit` gets sprinkled on code by people who have seen it work once. A dispersion harness that took two minutes starts taking three, and nobody knows why. With the measuring habits from the first lesson and the three suspects below, you can find out in a few minutes.

## The three suspects

When a function gets slower after you add `@njit`, it is almost always one of three things.

1. **Compile time is in the measurement.** The function is fast, but you are timing the compiler too.
2. **The function is not really compiled.** It fell back to **object mode**, where Numba runs Python objects through Python's own machinery, or its arguments are types Numba must convert slowly on every call.
3. **There was nothing left to speed up.** The time was already inside a NumPy call written in fast C, so Numba added its own overhead and removed nothing.

::: key
You add @njit and the function gets slower. Three causes: compilation time is being counted (warm it up first, or cache=True); the function fell back to object mode because of an unsupported type; or the function is already dominated by a NumPy call that Numba cannot improve, so you have only added overhead.
:::

The rest of the lesson takes them one at a time, with measurements. Every timing here is from one 4-core Intel Xeon at 2.1 GHz, shared with other jobs while these were taken, so the numbers are a little noisy. Yours will differ. Look at the ratios and the patterns, not the exact values.

## Suspect one: compile time is being counted

Every `@njit` function compiles the first time it is called with a new set of argument types. In the last lesson the first call of `coast` took $0.47\,\mathrm{s}$: about $0.35\,\mathrm{s}$ of Numba starting itself up and about $0.16\,\mathrm{s}$ of compiling `coast`. After that, each call took $0.53\,\mathrm{ms}$ instead of Python's $4.7\,\mathrm{ms}$.

So compiling is an investment. You pay a fixed cost up front and save a little on every call. The question is how many calls it takes to pay it back.

### The break-even count

Call the one-time compile cost $T_c$ ("T sub c"), the Python time per call $t_{py}$ and the compiled time per call $t_{nb}$. After $N$ calls, Python has spent $N\,t_{py}$ and Numba has spent $T_c + N\,t_{nb}$. Numba is ahead once

$$
T_c + N\,t_{nb} < N\,t_{py}.
$$

Move the $N$ terms to one side: $T_c < N\,(t_{py} - t_{nb})$. Divide both sides by the saving per call, $t_{py} - t_{nb}$, which is positive:

$$
N > N^* = \frac{T_c}{t_{py} - t_{nb}}.
$$

$N^*$, read "N star", is the **[[break-even|break-even]]** number of calls.

::: example Is Numba worth it for this script?
Use the coast numbers: $T_c = 0.47\,\mathrm{s}$, $t_{py} = 4.7\,\mathrm{ms}$, $t_{nb} = 0.53\,\mathrm{ms}$.

Step 1, the saving per call: $4.7 - 0.53 = 4.17\,\mathrm{ms} = 0.00417\,\mathrm{s}$.

Step 2, the break-even count: $N^* = 0.47 / 0.00417 \approx 113$ calls.

Step 3, apply it. A quick script that runs 20 cases: Python takes $20 \times 4.7 = 94\,\mathrm{ms}$. Numba takes $0.47 + 20 \times 0.00053 \approx 0.48\,\mathrm{s}$ — five times *slower*. A 500-case dispersion: Python takes $2.35\,\mathrm{s}$, Numba about $0.74\,\mathrm{s}$. Numba wins, and wins more the more cases you run.

Step 4, what caching changes: with `cache=True` the compile of `coast` drops to about $0.003\,\mathrm{s}$ in later runs, but the $0.35\,\mathrm{s}$ start-up remains. That start-up is paid once per process no matter how many functions you compile, so it matters most for many short scripts.

Sanity check: a hundred-odd calls to repay less than half a second of compiling seems reasonable when each call saves about four milliseconds.
:::

### Accidental recompiles

Compilation happens once per **signature** — per set of argument types — not once per function. Feed the same function a float32 array, an int, a 2-D array or a slice, and each one is a fresh compile:

```python
import time
import numpy as np
from numba import njit

@njit
def scale(x, k):
    return x * k

calls = [
    (np.ones(10), 2.0),                     # float64 array, float
    (np.ones(10, dtype=np.float32), 2.0),   # float32 array
    (np.ones(10, dtype=np.int64), 2),       # int64 array, int
    (np.ones(10), 2),                       # float64 array, but an int factor
    (np.ones((2, 5)), 2.0),                 # a 2-D array
    (np.ones(20)[::2], 2.0),                # a strided slice
]
for x, k in calls:
    t0 = time.perf_counter()
    scale(x, k)
    print(f"{time.perf_counter() - t0:.3f} s")
print(len(scale.signatures), "versions compiled")
# 0.534 s
# 0.101 s
# 0.102 s
# 0.101 s
# 0.146 s
# 0.102 s
# 6 versions compiled
```

One tiny function, six compilations, over a second in all. The first includes Numba's start-up; the other five, about $0.55\,\mathrm{s}$ together, are pure waste. Writing `2` instead of `2.0` was enough to trigger one of them. The slice `np.ones(20)[::2]` counts because it skips every other element, so its memory is laid out differently from a plain array and Numba compiles separate code for it.

The fixes:

- **Warm up before timing.** Call the function once on inputs of the real types, then measure.
- **Use `cache=True`**, so later processes load the machine code instead of compiling it.
- **Normalise types at the boundary.** Convert inputs once with `np.ascontiguousarray(x, dtype=np.float64)` and pass `float(k)`, so every call has the same signature.
- **Give an explicit signature** when you want to be strict. `@njit("float64(float64[:])")` compiles once, when the function is defined — this is **[[eager compilation|eager]]** — and rejects any other argument type with a `TypeError` instead of compiling again.

## Suspect two: object mode and unsupported types

### Object mode

In **nopython mode**, Numba compiles everything to machine code with no Python objects. **Object mode** is the opposite: Numba keeps every value as a Python object and calls back into the interpreter for every operation. It does the same errands the interpreter does, plus some of its own.

Why would anyone want that? In older versions of Numba, plain `@jit` tried nopython mode first, and if type inference failed it **fell back** to object mode, printing a warning that was easy to miss. The code ran, gave the right answer and was no faster, or slower. This was such a common trap that [[Numba 0.59|history]] made nopython the default for `@jit` as well. Today, object mode happens only when you ask for it with `@jit(forceobj=True)`, or inside a `with numba.objmode():` block. You will still meet the old behaviour in older code and older environments, which is why it is worth recognising.

Here is object mode on a loop that calls SciPy's error function, `erf`, which Numba cannot compile:

```python
import timeit, warnings
import numpy as np
from numba import jit
from scipy.special import erf

def erf_total(x):
    s = 0.0
    for v in x:
        s += erf(v)          # a SciPy ufunc: Numba has no lowering for it
    return s

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    erf_obj = jit(forceobj=True)(erf_total)     # force object mode
    erf_obj(np.zeros(3))

x = np.random.default_rng(0).normal(size=100_000)
for name, f in (("plain Python", erf_total), ("object mode", erf_obj),
                ("NumPy whole-array", lambda x: erf(x).sum())):
    best = min(timeit.repeat(lambda: f(x), number=3, repeat=5)) / 3
    print(f"{name:17s} {best * 1e3:6.2f} ms")
print(erf_obj.nopython_signatures)
# plain Python       20.61 ms
# object mode        27.33 ms
# NumPy whole-array   1.58 ms
# []
```

Object mode is about $1.3$ times *slower* than the plain Python it was meant to speed up ($27.33 / 20.61 \approx 1.33$). The real fix here was not Numba at all: `erf` is already a NumPy-style ufunc, so calling it on the whole array is about $13$ times faster than the loop.

The last line is the tell. `nopython_signatures` lists the versions compiled to real machine code. An empty list means none were.

::: warning How to catch object mode
Always write `@njit`, never a bare `@jit` in code that may run on an older Numba. Treat any `NumbaWarning` mentioning "falling back to object mode" as an error, not noise. When a compiled function is mysteriously slow, check that `f.nopython_signatures` is not empty.
:::

### Types that must be converted on every call

Nopython mode also needs its *inputs* as machine types. A NumPy array already is one: a block of raw float64 values that Numba can read in place. Other types have to be converted every time you call the function, and the conversion can cost more than the work.

::: example A list where an array should be
The same compiled sum of squares gets called four ways on $100\,000$ numbers:

```python
import timeit
import numpy as np
from numba import njit, typed

@njit
def sumsq(x):
    s = 0.0
    for i in range(len(x)):
        s += x[i] * x[i]
    return s

def sumsq_py(x):
    s = 0.0
    for v in x:
        s += v * v
    return s

arr = np.random.default_rng(0).normal(size=100_000)
lst = arr.tolist()
tl = typed.List(lst)
for name, f, a in (("njit, array", sumsq, arr), ("njit, list", sumsq, lst),
                   ("njit, typed.List", sumsq, tl), ("Python, list", sumsq_py, lst)):
    f(a)                                   # warm up
    best = min(timeit.repeat(lambda: f(a), number=3, repeat=5)) / 3
    print(f"{name:17s} {best * 1e3:7.2f} ms")
# njit, array          0.07 ms
# njit, list          58.88 ms
# njit, typed.List     1.97 ms
# Python, list         2.14 ms
```

Step 1, compare the compiled versions: with a Python list, the call is $58.88 / 0.07 \approx 840$ times slower than with an array.

Step 2, compare with no Numba at all: the compiled function on a list is $58.88 / 2.14 \approx 27.5$ times slower than the plain Python loop.

Step 3, find why. A Python list is a list of pointers to separate float objects. On every call, Numba copies each of the $100\,000$ floats out of its box into a native list, runs the loop, then checks every element on the way out in case the function changed any of them. That round trip is called a **[[reflected list|reflected]]**, and Numba prints a deprecation warning when it sees one. The loop itself is still $0.07\,\mathrm{ms}$; the rest is conversion.

Step 4, the fix: pass `np.asarray(lst)` once, outside the hot path. A `numba.typed.List` avoids the copy but still pays about $2\,\mathrm{ms}$ in access overhead here, close to plain Python; for numbers, arrays are the right container.
:::

The **unsupported types** from the last lesson — DataFrames, your own classes, dicts of mixed values, lists that mix floats and strings — do not quietly slow down under `@njit`. They fail with a `TypingError`, or with "can't unbox heterogeneous list" for a mixed list. That is the good outcome. The slow outcomes are the types Numba *can* accept but has to convert: Python lists and sets, and arrays of a different dtype than the rest of your code, which cost a recompile each.

## Suspect three: the time was already in NumPy

A NumPy function like `A @ b` or `np.sort` is a single call into compiled C (for matrix products, into a tuned linear algebra library, **[[BLAS|blas]]**). The interpreter's errands happen once per call, not once per element. Wrapping that one call in `@njit` does not remove any per-element errands, because there were none. What Numba can do is swap NumPy's implementation for its own, and its own is not always as good.

```python
import timeit
import numpy as np
from numba import njit

def matvec(A, b):
    return A @ b

def sort(x):
    return np.sort(x)

def rms(x):
    return np.sqrt(np.mean(x * x))

rng = np.random.default_rng(0)
A, b = rng.normal(size=(2000, 2000)), rng.normal(size=2000)
x = rng.normal(size=1_000_000)
for f, args in ((matvec, (A, b)), (rms, (x,)), (sort, (x,))):
    g = njit(f)
    g(*args)                                    # warm up
    t_np = min(timeit.repeat(lambda: f(*args), number=5, repeat=5)) / 5
    t_nb = min(timeit.repeat(lambda: g(*args), number=5, repeat=5)) / 5
    print(f"{f.__name__:6s} NumPy {t_np * 1e3:6.2f} ms   njit {t_nb * 1e3:6.2f} ms")
# matvec NumPy   0.33 ms   njit   0.33 ms
# rms    NumPy   1.16 ms   njit   1.36 ms
# sort   NumPy   7.62 ms   njit 115.66 ms
```

Read the three rows.

- **matvec:** a tie. Inside `@njit`, `A @ b` calls the same BLAS routine NumPy does. You gain nothing.
- **rms:** about $17\%$ slower ($1.36 / 1.16 \approx 1.17$). Numba compiles its own versions of `x * x` and `np.mean`, and here they are a little slower than NumPy's.
- **sort:** about $15$ times slower ($115.66 / 7.62 \approx 15.2$). Numba reimplements `np.sort` itself, and NumPy's [[own sort|numpy-sort]] is heavily tuned.

The lesson: `@njit` pays off on **loops you wrote**, where the interpreter's per-element errands are the cost. It does not pay off on code that is already one NumPy call. If a profile shows the time inside `np.sort`, `np.linalg.solve` or `A @ b`, Numba is the wrong tool; a better algorithm, or doing that call fewer times, is the right one.

### The same trap in miniature: calling across the boundary

Every call from Python into a compiled function goes through Numba's **dispatcher**, which checks the argument types, finds the right machine code and converts the arguments. That costs something, and for a tiny function the cost is bigger than the work.

```python
import timeit
import numpy as np
from numba import njit

def gravity(h):
    return 3.986e14 / (6.371e6 + h) ** 2

gravity_nb = njit(gravity)
gravity_nb(0.0)                                     # warm up

@njit
def all_gravity(hs):                                # the loop moved inside
    out = np.empty(hs.size)
    for i in range(hs.size):
        out[i] = gravity_nb(hs[i])
    return out

hs = np.linspace(0.0, 100e3, 100_000)
hl = hs.tolist()
all_gravity(hs)
for name, stmt in (("Python loop, Python fn", lambda: [gravity(h) for h in hl]),
                   ("Python loop, njit fn", lambda: [gravity_nb(h) for h in hl]),
                   ("loop inside njit", lambda: all_gravity(hs))):
    best = min(timeit.repeat(stmt, number=3, repeat=5)) / 3
    print(f"{name:23s} {best * 1e3:6.2f} ms")
# Python loop, Python fn    9.35 ms
# Python loop, njit fn     15.71 ms
# loop inside njit          0.14 ms
```

Compiling `gravity` and calling it from a Python loop made the loop $1.7$ times slower: each crossing into Numba costs about $(15.71 - 9.35)\,\mathrm{ms} / 100\,000 \approx 64\,\mathrm{ns}$ more than a Python call. Moving the loop *inside* the compiled code made it $9.35 / 0.14 \approx 67$ times faster than the original. Compile the loop, not the loop body.

::: warning parallel=True has a start-up cost too
Handing a `prange` loop to several threads costs a few microseconds. On this machine, a 100-element loop took $0.7\,\mathrm{\mu s}$ serial and about $3.6\,\mathrm{\mu s}$ with `parallel=True` — five times slower. Use `prange` over dispersion cases or over millions of elements, not over the three axes of a vector.
:::

## A checklist for a slow njit

When `@njit` disappoints, work down this list in order. Each step takes a minute.

1. **Time the second call, not the first.** If the second call is fast, the problem is compile time: warm up, add `cache=True`, or run more cases per process.
2. **Look at `f.signatures`.** More than one or two entries means mixed input types are causing recompiles. Normalise dtypes at the boundary.
3. **Look at `f.nopython_signatures`** and at the warnings. Empty, or a "falling back to object mode" warning, means the function is not really compiled.
4. **Check the argument types.** Python lists, sets and mixed dtypes should become float64 NumPy arrays before the call.
5. **Profile inside.** If the time is in one NumPy call (a sort, a solve, a matrix product), take `@njit` off and attack that call instead.
6. **Check the calling pattern.** A tiny compiled function called from a Python loop: move the loop inside.

## Check yourself

::: check
A compiled function has $T_c = 0.3\,\mathrm{s}$, and it takes $2.0\,\mathrm{ms}$ per call in Python and $0.5\,\mathrm{ms}$ compiled. A script calls it 150 times per run. Does Numba help, and by how much?
:::

::: answer
The saving per call is $2.0 - 0.5 = 1.5\,\mathrm{ms}$, so the break-even count is $N^* = 0.3 / 0.0015 = 200$ calls. At 150 calls, Numba loses. Python takes $150 \times 2.0 = 300\,\mathrm{ms}$. Numba takes $300 + 150 \times 0.5 = 375\,\mathrm{ms}$, about $75\,\mathrm{ms}$ slower. With `cache=True` removing most of $T_c$ in later runs, the picture flips, as long as the process start-up of Numba itself is not the bigger part.
:::

::: check
`step.signatures` shows `(Array(float64, 1, 'C', ...), float64)` and `(Array(float32, 1, 'C', ...), float64)`, plus `(Array(float64, 1, 'A', ...), int64)`. What does each extra entry tell you, and what would you change?
:::

::: answer
Each entry is a separate compilation. The float32 one means some caller passes single-precision arrays; the `'A'` layout means some caller passes a slice that is not contiguous in memory; the `int64` means someone passes an integer where a float is meant. Convert inputs once at the boundary with `np.ascontiguousarray(x, dtype=np.float64)` and `float(k)`, or give an explicit signature so the wrong types raise an error instead of silently compiling again.
:::

::: check
Why can a function running in object mode be slower than the same function run as plain Python, not merely as slow?
:::

::: answer
In object mode, Numba still keeps every value as a Python object and calls the interpreter's machinery for each operation, so none of the per-operation cost goes away. On top of that it adds its own wrapping: the dispatcher, the conversions around each call into Python, and code that is less tuned than CPython's own loop. In the `erf` example that made it about $1.3$ times slower than plain Python.
:::

::: check
A profile shows $90\%$ of a post-processing function's time is in `np.linalg.solve` on a $500 \times 500$ matrix inside a loop over 400 time points. A colleague suggests `@njit`. What do you expect, and what would you look at instead?
:::

::: answer
Expect little or nothing: inside `@njit`, `np.linalg.solve` calls the same compiled LAPACK routine (LAPACK is BLAS's sibling library for solving and factoring matrices), so the $90\%$ does not shrink, and the remaining $10\%$ can gain at most that much. Look at the algorithm instead: is the matrix the same at every time point? Then factor it once and reuse the factorisation, or solve all 400 right-hand sides in one call with a $500 \times 400$ right-hand-side matrix.
:::

::: check
Someone passes a Python list of $50\,000$ floats into an `@njit` function inside a loop that runs 1000 times, and the program crawls. Explain what is happening on every call and give the fix.
:::

::: answer
A Python list is a reflected list to Numba: on each of the 1000 calls, all $50\,000$ floats are unboxed into a native list and checked again on the way out, so the conversion costs far more than the loop. Convert the list to a NumPy float64 array once, before the loop, with `np.asarray(lst, dtype=np.float64)`, and pass the array. The data is then read in place with no conversion.
:::

## Summary

| Suspect | What you see | Fix |
|---|---|---|
| Compile time counted | First call slow, second fast | Warm up; `cache=True`; more work per process |
| Break-even | $N^* = T_c / (t_{py} - t_{nb})$ | Below $N^*$ calls, Python wins |
| Recompiles | Many entries in `f.signatures` | One dtype and layout at the boundary; explicit signature |
| Object mode | `nopython_signatures` empty; fallback warning | Use `@njit`; move unsupported calls out |
| Converted types | Python list argument, deprecation warning | Pass a float64 NumPy array |
| Already NumPy | Time inside `@`, `sort`, `solve` | Leave NumPy alone; fix the algorithm |
| Tiny function | Python loop calling a compiled function | Move the loop inside the compiled code |

Numba is one way to get compiled speed without leaving Python. The next lesson looks at the other two, Cython and pybind11, where you write or keep the fast core in C or C++ and call it from a Python harness.

::: context break-even Where the lines cross
Plot total time against the number of calls. Python's line starts at zero and climbs steeply, $4.7\,\mathrm{ms}$ per call. Numba's line starts at $0.47\,\mathrm{s}$ and climbs gently, $0.53\,\mathrm{ms}$ per call. They cross at about 113 calls. Left of the crossing, Python is ahead; right of it, Numba is, and the gap keeps growing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="323" y2="30" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="50" y1="123.3" x2="323" y2="107.5" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="153" y1="170" x2="153" y2="117.3" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="153" cy="117.3" r="4" fill="#1f2a44"/>
  <text x="153" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">113 calls</text>
  <text x="323" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">300</text>
  <text x="44" y="127" font-size="11" text-anchor="end" fill="#1f2a44">0.47 s</text>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1.41 s</text>
  <text x="44" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="250" y="60" font-size="12" fill="#b4232c">Python</text>
  <text x="250" y="132" font-size="12" fill="#1d6fd1">Numba</text>
</svg>
```

The axis runs to 300 calls: Python reaches $300 \times 4.7\,\mathrm{ms} = 1.41\,\mathrm{s}$, Numba $0.47 + 300 \times 0.00053 \approx 0.63\,\mathrm{s}$.
:::

::: context eager Lazy and eager compilation
By default Numba is **lazy**: it waits for the first call to learn the argument types, then compiles. With a signature string like `"float64(float64[:])"` — a float64 result from a 1-D float64 array — it is **eager**: it compiles at the moment the `def` runs, when you import the module. That moves the cost to start-up, where it is predictable, and makes the function refuse a float32 array instead of compiling a second version. The `[:]` means "a 1-D array of any layout"; `[::1]` would demand a contiguous one.
:::

::: context history Why the default changed
For years, `@jit` silently falling back to object mode was one of the most common complaints about Numba: code ran, gave the right answer, and was no faster. The Numba developers first warned that the default would change, then made it happen in version 0.59, released in early 2024. Since then `@jit` means nopython mode unless you pass `forceobj=True`, and passing `nopython=False` only produces a warning. Tutorials and codebases from before then still show bare `@jit`, and a pinned older Numba will still fall back, which is why `@njit` remains the safe habit.
:::

::: context reflected What "reflected" means
A reflected list is Numba's way of letting a compiled function change a Python list and have the change show up back in Python — the change is "reflected" back. To do that, Numba copies every element into native memory on the way in and writes the elements back on the way out. The picture: a list is a row of pointers to boxed floats scattered in memory, while an array is one solid block of raw numbers that Numba can read where it sits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44" font-weight="700">Python list: pointers to boxes</text>
  <rect x="20" y="30" width="30" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="30" width="30" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="30" width="30" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="160" y="62" width="44" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="240" y="36" width="44" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="300" y="72" width="44" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="35" y1="42" x2="160" y2="73" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="65" y1="42" x2="240" y2="47" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="95" y1="42" x2="300" y2="83" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="182" y="77" font-size="11" text-anchor="middle" fill="#1f2a44">0.3</text>
  <text x="262" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">-1.2</text>
  <text x="322" y="87" font-size="11" text-anchor="middle" fill="#1f2a44">0.8</text>
  <text x="20" y="122" font-size="12" fill="#1f2a44" font-weight="700">NumPy array: one block</text>
  <rect x="20" y="132" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="132" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140" y="132" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="149" font-size="11" text-anchor="middle" fill="#1f2a44">0.3</text>
  <text x="110" y="149" font-size="11" text-anchor="middle" fill="#1f2a44">-1.2</text>
  <text x="170" y="149" font-size="11" text-anchor="middle" fill="#1f2a44">0.8</text>
</svg>
```
:::

::: context blas The library under every matrix product
BLAS, the Basic Linear Algebra Subprograms, is a standard set of routines for vector and matrix arithmetic, first published in 1979. Many teams have written versions tuned for particular CPUs, such as OpenBLAS and Intel's MKL, and NumPy calls one of them for `@`, `np.dot` and, through its sibling LAPACK, for `np.linalg.solve`. These routines use every trick the chip offers, including several cores at once. Neither you nor Numba will beat them with a hand-written loop, which is why wrapping them in `@njit` gains nothing.
:::

::: context numpy-sort Why NumPy's sort is hard to beat
NumPy's `np.sort` is written in C and has been tuned for years, with separate code for each data type. On modern x86 chips, recent NumPy versions sort float64 arrays with **SIMD** instructions — single instructions that compare several numbers at once. Numba's `np.sort` is a general quicksort written for Numba itself, which is correct and compiled but does not use those tricks. A fifteenfold gap on a million numbers is the result. When a library call is already the fastest version anyone has written, the gain from Numba is negative.
:::
