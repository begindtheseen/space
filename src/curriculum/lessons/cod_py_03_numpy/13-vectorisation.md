---
id: l13-vectorisation
title: Vectorization as the default
minutes: 18
covers:
  - Vectorization as the default, and when it genuinely does not apply
---

Picture a post office clerk stamping a thousand letters. In the first version, a customer walks up with one letter, the clerk asks their name, checks the address, finds the stamp, stamps it, says goodbye — and the next customer walks up. In the second version, someone hands the clerk a tray of a thousand letters already sorted, and the clerk stamps them one after another without looking up. The stamping takes the same time either way. Everything else — the greeting, the checking, the walking up — is what made the first version slow.

A Python loop over array elements is the first version. For every element, the Python [[interpreter|interpreter]] reads the next instruction, looks up what the variables are, checks their types, makes a new Python object for the result and cleans up the old one. The actual multiplication is a tiny part of that. An array expression like `v @ C.T` is the second version: Python does the paperwork *once* for the whole array, and then compiled code stamps through all the numbers in a tight loop.

Writing code as whole-array expressions instead of element loops is called **vectorization**, and it has been the quiet theme of this whole module: broadcasting, masks, reductions with `axis=`, `@` and `einsum` are all ways of saying "do this to every element" without writing the loop. This last lesson measures how much it is worth — you will see speedups of 50 to nearly 800 times — and then looks honestly at the cases where it does not apply: steps that depend on the step before, searches that should stop early, and expressions whose temporary arrays would not fit in memory.

## Where the time goes

When NumPy runs `v * 2.0` on a million numbers, one Python-level operation happens. NumPy checks the dtype once, allocates the result once, and hands both arrays to a loop written in C and compiled ahead of time. That loop knows every element is a float64 sitting 8 bytes after the last one, so it does nothing but load, multiply and store. Modern processors can even do several of those at once with **[[SIMD|simd]]** instructions.

When a Python `for` loop does the same thing, every iteration pays the full interpreter cost. Reading `v[i]` makes a brand-new Python float object to hold one number — a step called **[[boxing|boxing]]** — and multiplying it makes another. Each of those costs tens of nanoseconds, while the multiplication itself takes well under one. The loop spends almost all its time on paperwork.

That is also why vectorized code is not faster because of a GPU (NumPy does not use one) or lower precision (it is the same float64). It is faster because the per-element overhead is gone.

::: key Why vectorized code is faster
The per-element Python interpreter overhead and boxing are removed, and the inner loop runs in compiled, cache-friendly C. The array version pays the Python cost once per operation, not once per element.
:::

## Measuring it: rotate a million vectors

In lesson 8 you rotated a stack of vectors by a direction cosine matrix in one expression. Here is that expression against the loop a newcomer would write, timed with `timeit` (lesson 9 used it too). The loop computes `C @ v[i]` for each row; the vectorized version computes `v @ C.T`, which gives row $i$ equal to $\mathbf{C}\mathbf{v}_i$ because of how a transpose swaps the order of a product.

::: example A fifty-fold speedup, measured
```python
import math
from timeit import timeit
import numpy as np

rng = np.random.default_rng(0)
v = rng.normal(size=(1_000_000, 3))          # a million vectors, one per row
c, s = math.cos(0.3), math.sin(0.3)
C = np.array([[  c,   s, 0.0],
              [ -s,   c, 0.0],
              [0.0, 0.0, 1.0]])              # DCM: 0.3 rad about z

def rotate_loop(C, v):
    out = np.empty_like(v)
    for i in range(len(v)):
        out[i] = C @ v[i]
    return out

def rotate_vec(C, v):
    return v @ C.T

def best(f, repeats):
    return min(timeit(f, number=1) for _ in range(repeats))

print(np.allclose(rotate_loop(C, v), rotate_vec(C, v)))
t_loop = best(lambda: rotate_loop(C, v), 3)
t_vec = best(lambda: rotate_vec(C, v), 20)
print(f"loop:       {t_loop*1e3:8.1f} ms")
print(f"vectorised: {t_vec*1e3:8.2f} ms")
print(f"speedup:    {t_loop/t_vec:8.0f} x")
# True
# loop:         1035.7 ms
# vectorised:     1.31 ms
# speedup:         793 x
```

**Step 1.** Check first, time second. `np.allclose` confirms the two functions give the same answer (lesson 10: never `==` on computed floats). A fast wrong answer is worthless.

**Step 2.** `best` runs a function several times and keeps the fastest run. The fastest run is the one least disturbed by whatever else the computer was doing.

**Step 3.** The loop takes about $1.04\,\mathrm{s}$: roughly a microsecond per vector, nearly all of it overhead, since the arithmetic is only 15 flops.

**Step 4.** The array expression takes about $1.3\,\mathrm{ms}$. The ratio is about 790. On a different computer the milliseconds will differ, but a ratio in the hundreds is typical.

**Sanity check.** Is $1.3\,\mathrm{ms}$ believable for a million vectors? The data is $24\,\mathrm{MB}$ in and $24\,\mathrm{MB}$ out. Moving $48\,\mathrm{MB}$ in $1.3\,\mathrm{ms}$ is about $37\,\mathrm{GB/s}$, around what a modern machine's memory can deliver across its cores; matrix products are handed to the BLAS library from lesson 9, which can use several cores at once (this machine has 4). So the vectorized version is limited by how fast memory can move, not by arithmetic — as fast as this job can go.
:::

::: warning Time the right thing
Build the input *outside* the timed code, or you measure the random-number generator too. Run the vectorized version a few times: the first run can pay one-off costs (memory being handed to the program for the first time). And report the ratio along with the machine, never a bare "it is fast".
:::

## Not every array expression is equally fast

Vectorizing removes the interpreter overhead, but *how* you write the array expression still matters. Here are the lengths of the same million vectors, three ways:

::: example Three ways to compute a million lengths
```python
import math
from timeit import timeit
import numpy as np

rng = np.random.default_rng(0)
v = rng.normal(size=(1_000_000, 3))

def norms_loop(v):
    out = np.empty(len(v))
    for i in range(len(v)):
        x, y, z = v[i]
        out[i] = math.sqrt(x*x + y*y + z*z)
    return out

def best(f, repeats):
    return min(timeit(f, number=1) for _ in range(repeats))

t_loop = best(lambda: norms_loop(v), 3)
t_sum = best(lambda: np.sqrt((v * v).sum(axis=1)), 20)
t_ein = best(lambda: np.sqrt(np.einsum("ij,ij->i", v, v)), 20)
print(f"loop:             {t_loop*1e3:7.1f} ms")
print(f"(v*v).sum(axis=1):{t_sum*1e3:7.1f} ms  {t_loop/t_sum:5.0f} x")
print(f"einsum:           {t_ein*1e3:7.1f} ms  {t_loop/t_ein:5.0f} x")
# loop:               766.0 ms
# (v*v).sum(axis=1):   16.3 ms     47 x
# einsum:               4.9 ms    155 x
```

**Step 1.** The loop takes about $770\,\mathrm{ms}$, the same microsecond-per-row overhead as before.

**Step 2.** `np.sqrt((v * v).sum(axis=1))` is about 47 times faster — a big win, but short of fifty. Why? `v * v` first builds a whole new $24\,\mathrm{MB}$ **temporary** array, which is written to memory and read back. Then `sum(axis=1)` adds along an axis only 3 long, and a reduction does its per-row setup a million times for just three numbers each.

**Step 3.** `np.einsum("ij,ij->i", v, v)` (lesson 8) says "for each row `i`, multiply and add over `j`" as one operation. It never builds the temporary, and it is about 155 times faster than the loop.

**Sanity check.** All three compute the same thing: lesson 10's `np.allclose` on any pair returns `True`. The lesson is not "always use einsum". It is that the first vectorized version is usually a huge win, and when you need more, look for temporaries and for reductions over tiny axes.
:::

::: key Vectorisation as the default
Write whole-array expressions first: broadcasting, masks, `axis=` reductions, `@` and `einsum`. Check the result against a simple version, then measure with `timeit`. Speedups of 50 to several hundred times over an element loop are normal. Among array expressions, fewer temporaries is usually faster.
:::

## When it genuinely does not apply

Vectorization needs one thing: the work on each element must not depend on the result for another element. When that is true, the whole array can be done at once. Three situations break it.

### 1. Each step needs the one before: recurrences

A **[[recurrence|recurrence]]** is a calculation where step $k$ uses the result of step $k-1$. Numerically integrating an orbit is one: the acceleration at the next step depends on the position the last step just produced. A **Kalman filter** — the estimator that fuses a model with noisy sensor readings, which you will build in the estimation modules — is another: each update starts from the previous estimate and its uncertainty.

Here is the smallest possible Kalman filter, estimating one constant from noisy readings. You cannot compute step 50 without step 49, so there is no array expression that replaces the loop over time.

```python
from timeit import timeit
import numpy as np

rng = np.random.default_rng(2)
n = 100_000
z = 5.0 + rng.normal(0.0, 0.5, size=n)       # noisy measurements of a constant, m

def kalman_1d(z, r=0.25, q=1e-6):
    """Scalar Kalman filter for a slowly drifting constant. Each step needs the last."""
    x, p = 0.0, 100.0                        # initial estimate and its variance
    out = np.empty(len(z))
    for k in range(len(z)):
        p = p + q                            # predict: uncertainty grows a little
        K = p / (p + r)                      # gain: how much to trust the new reading
        x = x + K * (z[k] - x)               # update the estimate
        p = (1.0 - K) * p                    # update its variance
        out[k] = x
    return out

est = kalman_1d(z)
print(est[[0, 9, 99, 99_999]])
# [5.08182214 4.99532618 4.99540329 5.0074546 ]
t = min(timeit(lambda: kalman_1d(z), number=1) for _ in range(3))
print(f"{t*1e3:.0f} ms for {n} steps, {t/n*1e9:.0f} ns per step")
# 24 ms for 100000 steps, 236 ns per step
t2 = min(timeit(lambda: kalman_1d(z.tolist()), number=1) for _ in range(3))
print(f"{t2*1e3:.0f} ms with a list input")
# 11 ms with a list input
```

The estimate settles on $5.0$, as it should. The loop is the right code here. Two things still help.

First, inside an unavoidable scalar loop, plain Python floats are faster than NumPy's. `z[k]` on an array returns a NumPy scalar, which carries extra machinery for every arithmetic step; `z.tolist()` turns the array into a list of plain floats, and the same loop ran in less than half the time.

Second, and much bigger: **loop over time, vectorize over everything else.** A Monte Carlo study runs the same filter for a thousand cases. The cases do not depend on each other, so hold them in arrays and let every step move all of them at once:

```python
import time
import numpy as np

rng = np.random.default_rng(6)
steps, cases = 10_000, 1_000
z = 5.0 + rng.normal(0.0, 0.5, size=(steps, cases))   # every case's readings, m

def kalman_many(z, r=0.25, q=1e-6):
    """Loop over time (unavoidable); every case moves together as one array."""
    x = np.zeros(z.shape[1])
    p = np.full(z.shape[1], 100.0)
    for k in range(z.shape[0]):
        p = p + q
        K = p / (p + r)
        x = x + K * (z[k] - x)
        p = (1.0 - K) * p
    return x

t0 = time.perf_counter()
x = kalman_many(z)
print(f"{time.perf_counter() - t0:.2f} s for {steps} steps x {cases} cases")
# 0.07 s for 10000 steps x 1000 cases
```

That is ten million filter steps in $0.07\,\mathrm{s}$: about $7\,\mathrm{ns}$ each, against $100$ to $240\,\mathrm{ns}$ for one step in the scalar loop. The Python loop runs $10\,000$ times instead of $10\,000\,000$.

::: warning Do not fake it with cumsum
A few recurrences have array shortcuts: a running total is `np.cumsum`, and some linear filters have library routines (SciPy's `lfilter`, in the next module). But most GNC recurrences are nonlinear — gravity depends on position, the Kalman gain depends on the last variance — and no reshuffling of array operations removes the dependence. Code that "vectorizes" a recurrence by computing every step from the *initial* state gives a fast, wrong answer. If step $k$ needs step $k-1$, keep the loop.
:::

### 2. You can stop early

A vectorized expression always processes the whole array. A loop can quit the moment it has its answer. When the answer is usually near the start, the loop can win.

```python
from timeit import timeit
import numpy as np

n = 10_000_000
temp = np.full(n, 20.0)                  # deg C, a long thermal log
temp[1_500] = 95.0                       # an over-temperature spike early on

def first_over_loop(x, limit):
    for i, value in enumerate(x):
        if value > limit:
            return i
    return -1

def first_over_vec(x, limit):
    mask = x > limit
    return int(mask.argmax()) if mask.any() else -1

print(first_over_loop(temp, 80.0), first_over_vec(temp, 80.0))
# 1500 1500
t_loop = min(timeit(lambda: first_over_loop(temp, 80.0), number=1) for _ in range(5))
t_vec = min(timeit(lambda: first_over_vec(temp, 80.0), number=1) for _ in range(5))
print(f"loop, stops at 1500:  {t_loop*1e3:6.2f} ms")
print(f"vectorised, all 10M:  {t_vec*1e3:6.2f} ms")
# loop, stops at 1500:    0.08 ms
# vectorised, all 10M:    2.80 ms
```

The loop looked at 1501 values and stopped. The vectorized version built a 10-million-element mask (lesson 4) and scanned it: 35 times slower, even though each of its steps is far faster. (`argmax` on a boolean mask returns the first `True`, which is why it finds the first crossing — and why the `mask.any()` check is needed: on an all-`False` mask `argmax` returns 0.) If the spike had been near the end, the vectorized version would win by the usual factor of a hundred or so. The best of both is a middle road: search the array in vectorized **chunks** of, say, $100\,000$ values, and stop at the first chunk that contains a hit.

### 3. The temporaries do not fit

Broadcasting makes it easy to write an expression whose intermediate arrays are enormous (lesson 5 warned about this). Say you want the closest approach between any two of $n$ tracked objects. The all-pairs difference `pos[:, None, :] - pos[None, :, :]` has shape $(n, n, 3)$:

| $n$ objects | bytes for the $(n, n, 3)$ float64 difference alone |
| --- | --- |
| 5,000 | $5000^2 \times 3 \times 8 = 600\,\mathrm{MB}$ |
| 100,000 | $100\,000^2 \times 3 \times 8 = 240\,\mathrm{GB}$ |

The fix keeps the vectorization but applies it one **block** of rows at a time: compare 250 objects against all $n$, keep the smallest distance, move on.

```python
import numpy as np

rng = np.random.default_rng(4)
n = 5_000
pos = rng.normal(0.0, 7.0e6, size=(n, 3))          # m, a made-up cloud of objects

def closest_chunked(pos, block=250):
    best = np.inf
    for start in range(0, len(pos), block):
        p = pos[start:start + block]
        d = p[:, None, :] - pos[None, :, :]        # (block, n, 3)
        dist = np.sqrt((d * d).sum(axis=2))
        rows = np.arange(len(p))
        dist[rows, start + rows] = np.inf          # ignore each object's distance to itself
        best = min(best, dist.min())
    return best

print(closest_chunked(pos))
# 75939.43395788934
```

For $5000$ objects, the all-at-once version and this one give the same closest approach, $75\,939\,\mathrm{m}$. Measured on this lesson's machine, the all-at-once version peaked at $1367\,\mathrm{MB}$ of memory and took $4.97\,\mathrm{s}$; the blocked one peaked at $118\,\mathrm{MB}$ and took $0.65\,\mathrm{s}$. Smaller arrays stay in the processor's fast **[[cache|cache]]**, so the blocked version was faster as well as smaller. The Python loop runs only 20 times, so its overhead is nothing. For $100\,000$ objects, only the blocked version can run at all.

::: key When vectorization genuinely does not apply
Sequential recurrences (integrators, Kalman filters: step $k$ needs step $k-1$) — loop over time, vectorize over cases. Early exit (answer near the start) — loop, or vectorize in chunks and stop. Memory blow-up (huge broadcast temporaries) — process in blocks. In each case, keep the Python loop count small and the work per iteration large.
:::

### When the loop itself must be fast

Sometimes you are left with a long scalar loop that really matters: a propagator with a million steps, run thousands of times. Then the tool is to compile the loop. **[[Numba|numba]]** is a package that compiles a Python function full of loops over NumPy arrays into machine code when you add a decorator; **Cython** lets you write Python-like code with C types and compile it into an extension module. Neither is part of NumPy, and neither may be installed on your machine — this course's performance module covers both, with measurements. The order stays the same: vectorize first, measure, and compile only the loop that is left.

## Check yourself

::: check
A colleague's loop over 2 million telemetry rows takes $1.6\,\mathrm{s}$. After vectorizing, it takes $12\,\mathrm{ms}$. What is the speedup, and does it meet a "fifty-fold" goal? What should they check before celebrating?
:::

::: answer
$1.6\,\mathrm{s} / 0.012\,\mathrm{s} \approx 133$ times, well past fifty. Before celebrating: check that both versions give the same result with `np.allclose` (with tolerances chosen for the units), that the input was built outside the timed code, and that the vectorized time is the best of several runs. Report the ratio with the machine it was measured on.
:::

::: check
For each task, say whether it can be vectorized over its long axis, and why: (a) converting a million positions from kilometers to meters; (b) propagating one orbit with a fixed-step integrator for a million steps; (c) propagating ten thousand orbits for 100 steps each.
:::

::: answer
(a) Yes: each element is multiplied by 1000 independently, `pos * 1000.0`. (b) Not over time: each step needs the position from the previous step, so the million-step loop stays; it is the case for a compiled loop if it is too slow. (c) Loop over the 100 time steps, and vectorize over the 10,000 orbits, which are independent: hold them as a `(10000, 3)` position array and a `(10000, 3)` velocity array, and update all of them in each step. The Python loop runs 100 times, not a million.
:::

::: check
Explain why `np.sqrt((v * v).sum(axis=1))` was slower than `np.sqrt(np.einsum("ij,ij->i", v, v))` in the lesson, even though both are vectorized.
:::

::: answer
`v * v` builds a full temporary array the size of `v` ($24\,\mathrm{MB}$ for a million 3-vectors), which must be written to memory and read back by the sum. And `sum(axis=1)` reduces over an axis only 3 long, paying its per-row setup a million times for three numbers each. `einsum` does the multiply-and-add for each row in one pass with no temporary. Both avoid the Python interpreter overhead; one moves much less memory.
:::

::: check
You need the pairwise distances between $n = 20\,000$ debris objects in float64, and your machine has $16\,\mathrm{GB}$. Will the all-at-once broadcast fit? Pick a block size that keeps the $(\text{block}, n, 3)$ temporary under $100\,\mathrm{MB}$.
:::

::: answer
The full difference array is $20\,000^2 \times 3 \times 8 = 9.6 \times 10^{9}$ bytes, $9.6\,\mathrm{GB}$, and the squared differences and distances add more temporaries of similar or one-third size. That will not fit comfortably in 16 GB. For a block of $b$ rows the temporary is $b \times 20\,000 \times 3 \times 8 = 480\,000\,b$ bytes. Under $100\,\mathrm{MB}$ means $b < 100\,000\,000 / 480\,000 \approx 208$; a block of 200 gives $96\,\mathrm{MB}$, and the loop runs $100$ times.
:::

::: check
A search for the first sample where a battery voltage drops below a limit runs on day-long logs of 8.64 million samples. In most logs the voltage never drops. Would you use the loop with `break` or the vectorized mask? Why?
:::

::: answer
The vectorized mask. The loop only wins when it can stop early; if the voltage usually never drops, the loop has to look at all 8.64 million samples one by one, at around a hundred times the cost of the vectorized scan. If the drops, when they happen, are usually near the start, the chunked search gets both benefits: vectorized speed within each chunk, and stopping at the first chunk with a hit.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Why vectorizing is fast | interpreter overhead and boxing paid once, not per element; compiled C loop |
| Measured | DCM rotation of $10^6$ vectors: about 790 times; lengths: 47 times with a temporary, 155 with `einsum` |
| Method | check with `np.allclose`, then `timeit`, best of several runs, report the ratio |
| Temporaries | fewer and smaller is faster; avoid reductions over tiny axes when speed matters |
| Recurrences | loop over time, vectorize over cases; plain floats in scalar loops |
| Early exit | loop or chunked search when the answer is near the start |
| Memory blow-up | process broadcasts in blocks |
| Compiled loops | Numba or Cython for the loop that is left; not part of NumPy |

That closes the NumPy module. You can now build arrays, slice them without accidental copies, broadcast and reduce along the axis you mean, do linear algebra without inverting anything, compare floats honestly, reproduce random runs, move big telemetry to and from disk, and write all of it as array expressions. The SciPy module builds straight on this: its integrators, optimizers and signal filters all take and return the arrays you now know how to handle.

::: context interpreter What the interpreter does on every step
Python does not turn your program into machine code ahead of time. It compiles it to **bytecode**, a list of small instructions such as "load the variable `x`", "multiply the top two values", "store the result". The interpreter is a big loop in C that reads one bytecode instruction at a time and carries it out, checking the types of whatever it is handed as it goes. One line like `out[i] = C @ v[i]` is a dozen or more of those instructions, each with its own checks. That is the "paperwork" in the post office picture.
:::

::: context simd One instruction, several numbers
SIMD stands for "single instruction, multiple data". A modern processor has wide registers that hold four float64 values (or eight float32) side by side, and one instruction can add or multiply all of them at once. Compiled loops over contiguous arrays can use these instructions; a Python loop, which handles one boxed object at a time, never can. This is one reason the memory layout from lesson 1 — values packed one after another — matters so much.
:::

::: context boxing What boxing means
A NumPy array stores bare 8-byte numbers packed side by side. A Python float is a full object: a header with a reference count and a type pointer, plus the 8-byte value, 24 bytes in all, living wherever the memory allocator put it. Reading `v[i]` in a loop has to build one of these boxes around the bare number, and every arithmetic result builds another. Creating, checking and freeing those boxes is most of what a Python loop over numbers spends its time on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">ndarray: bare values, side by side</text>
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="10" y="26" width="50" height="24"/><rect x="60" y="26" width="50" height="24"/><rect x="110" y="26" width="50" height="24"/><rect x="160" y="26" width="50" height="24"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="35" y="43">1.5</text><text x="85" y="43">2.0</text><text x="135" y="43">0.7</text><text x="185" y="43">3.1</text>
  </g>
  <text x="10" y="80" font-size="12" fill="#1f2a44">v[1] in a loop: a new Python float object</text>
  <rect x="60" y="88" width="160" height="36" rx="5" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="66" y="94" width="44" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="112" y="94" width="44" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="160" y="94" width="54" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="88" y="110">refs</text><text x="134" y="110">type</text><text x="187" y="110">2.0</text>
  </g>
  <line x1="85" y1="50" x2="175" y2="88" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="180,91 169,89 175,81" fill="#b4232c"/>
  <text x="240" y="110" font-size="11" fill="#6c7a93">24 bytes, made and freed</text>
</svg>
```
:::

::: context recurrence Recurrences in flight software
Recurrences are everywhere in GNC because the physics is a recurrence: the state now plus the rate of change gives the state a moment later. Numerical integrators (Euler, Runge-Kutta), discrete-time filters, attitude propagation with quaternions and guidance laws that update every control cycle are all loops over time. On the flight computer they are written in C or C++ and run once per cycle, so the question never comes up there. It comes up in the Python analysis tools around them, where the fix is almost always to vectorize across cases, not across time.
:::

::: context cache Why smaller blocks can be faster
A processor keeps copies of recently used memory in small, very fast **caches** right on the chip — typically tens of kilobytes to a few megabytes, and a few tens of megabytes at the largest level. Reading from cache can be ten to a hundred times faster than reading from main memory. A 30 MB block of work mostly lives near the chip while it is being used; a 1.2 GB temporary has to go all the way out to main memory and back, and on its first use the operating system also has to hand the program all those fresh pages.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="60" height="40" rx="5" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="40" y="64" font-size="12" text-anchor="middle" fill="#fff">core</text>
  <rect x="90" y="30" width="90" height="60" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="135" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">cache</text>
  <text x="135" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">MB, fast</text>
  <rect x="210" y="16" width="140" height="88" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="280" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">main memory</text>
  <text x="280" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">GB, slower</text>
  <line x1="70" y1="60" x2="90" y2="60" stroke="#1f2a44" stroke-width="3"/>
  <line x1="180" y1="60" x2="210" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="114" font-size="11" text-anchor="middle" fill="#6c7a93">thick line: wide, quick path; thin line: narrower, slower</text>
</svg>
```
:::

::: context numba Numba and Cython
Numba, first released in 2012 and developed with support from Anaconda, compiles a decorated Python function to machine code the first time it is called, using the LLVM compiler toolkit. It understands NumPy arrays and plain loops, so a scalar Kalman filter written as a loop can run at C speed. Cython, which grew out of an earlier project called Pyrex in 2007, translates annotated Python-like code into C that is compiled into an extension module; parts of SciPy and pandas are written in it. Both are optional installs. The performance module later in this course shows when each is worth it, and how to measure that it was.
:::
