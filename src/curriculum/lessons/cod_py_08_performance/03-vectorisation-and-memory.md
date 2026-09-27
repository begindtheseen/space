---
id: l03-vectorisation-and-memory
title: Vectorise by default, but watch the memory
minutes: 22
covers:
  - 'Vectorisation as the default; when it costs more memory than it saves time'
---

Picture unloading the groceries from the car. You could carry one can at a time: walk in, put it down, walk back, pick up the next. Most of your time goes on walking, not carrying. So you grab a whole bag per trip, and the job takes a fraction of the time.

Now picture being so pleased with this that you try to carry everything at once, in one giant box. The box does not fit through the door. You have to unpack it on the porch, and you end up slower than if you had carried sensible bags. The best trip is as big as the door allows, and no bigger.

Python code has the same two lessons. Doing arithmetic one number at a time in a Python loop is the one-can-per-trip plan. Handing NumPy a whole array at once is carrying a bag, and it is usually 50 to 100 times faster. That style is called **vectorisation**, and it is step four of the order of attack from the first lesson. But an array expression can also build the giant box: a temporary array so big it no longer fits in the computer's fast memory, or in its memory at all. This lesson is about both halves: vectorise by default, and know when a bag has become a box.

## Why a Python loop is slow

Here is dynamic pressure, $q = \tfrac{1}{2}\rho v^2$, where $\rho$ (read "rho") is air density in $\mathrm{kg/m^3}$ and $v$ is speed in $\mathrm{m/s}$. We compute it for a million telemetry samples, first with a loop, then with array arithmetic.

```python
import timeit
import numpy as np

rng = np.random.default_rng(0)
n = 1_000_000
rho = rng.uniform(0.01, 1.2, n)      # kg/m^3
v = rng.uniform(100.0, 800.0, n)     # m/s

def q_loop(rho, v):
    out = np.empty(len(rho))
    for i in range(len(rho)):
        out[i] = 0.5 * rho[i] * v[i] ** 2
    return out

def q_vec(rho, v):
    return 0.5 * rho * v**2

print(np.allclose(q_loop(rho, v), q_vec(rho, v)))   # True
t_loop = min(timeit.repeat(lambda: q_loop(rho, v), number=1, repeat=3))
t_vec = min(timeit.repeat(lambda: q_vec(rho, v), number=1, repeat=3))
print(f"loop {t_loop * 1e3:.0f} ms, vectorised {t_vec * 1e3:.2f} ms")
# one machine: loop 288 ms, vectorised 3.87 ms
```

Same answer, about 75 times faster. (Your times will differ, and so will the exact ratio.) That is about 290 nanoseconds per sample in the loop and under 4 nanoseconds per sample for the array version.

Where do the 290 nanoseconds go? Python is run by an **[[interpreter|interpreter]]**, a program that reads your code one small instruction at a time and carries each one out. For the single line `out[i] = 0.5 * rho[i] * v[i] ** 2`, it must, every time round the loop:

- fetch `rho[i]` from the array, and wrap the raw number in a fresh Python float object, a **[[boxed|boxed]]** number;
- check what type each operand is before each `*` and `**`, then find the right code to run for that type;
- make a new float object for every intermediate result, and throw the old ones away;
- unwrap the final answer and store it back into `out`.

The actual multiplying is a tiny part of that. All the checking and wrapping is **overhead**: work that is not your calculation.

`q_vec` pays the overhead once per *array*, not once per *number*. The expression `0.5 * rho * v**2` makes three calls into NumPy. Each call checks the types once, then runs a tight loop written in C over a long run of raw 8-byte numbers sitting side by side in memory. Those loops are simple enough that the processor can even do several numbers per instruction with **[[SIMD|simd]]** instructions.

::: key
Vectorisation means replacing a Python loop over elements with whole-array operations, so the per-element work runs in NumPy's compiled loops. The interpreter overhead is paid once per array operation instead of once per element.
:::

## Vectorising a real simulation

The dynamic pressure example has no loop left at all. A simulation cannot lose its time loop: step 100 depends on step 99. But a Monte Carlo dispersion has a second direction, the cases, and the cases do not depend on each other. So you can loop over time and vectorise over cases. Every variable becomes an array with one entry per case.

The toy rocket from the first lesson flies until it hits the ground, and different cases land at different times. That is a branch: "if this case is still flying, step it". In array code a branch becomes a **mask**, an array of `True`/`False`, and `np.where(mask, a, b)` picks from `a` where the mask is `True` and from `b` where it is `False`.

```python
import numpy as np

HEIGHTS = np.arange(201) * 500.0
RHOS = 1.225 * np.exp(-HEIGHTS / 8500.0)

def run_all_vectorised(v0, m=25.0, dt=0.01):
    h = np.zeros_like(v0)                    # one height per case
    v = v0.copy()
    t = np.zeros_like(v0)
    flying = np.ones(v0.shape, dtype=bool)   # the mask
    while flying.any():
        rho = np.interp(h, HEIGHTS, RHOS)
        g = 3.986e14 / (6.371e6 + h) ** 2
        a = -g - 0.5 * rho * v * np.abs(v) * 0.36 / m
        h = np.where(flying, h + v * dt, h)  # landed cases stay put
        v = np.where(flying, v + a * dt, v)
        t = np.where(flying, t + dt, t)
        flying = h >= 0.0
    return t

v0 = np.random.default_rng(1).uniform(250.0, 350.0, 500)
t_land = run_all_vectorised(v0)
print(len(t_land), round(t_land.min(), 2), round(t_land.max(), 2))   # 500 14.12 15.39
```

::: example A 500-case dispersion, one case at a time or all at once
**The setup.** 500 launch speeds between 250 and $350\,\mathrm{m/s}$. The one-case-at-a-time version is the first lesson's fixed `run_case`, called 500 times in a list comprehension. The vectorised version is the function above.

**Same answers.** The largest difference between the 500 landing times from the two versions is exactly 0.0 seconds. Vectorising must not change the physics, so check this every time.

**Timing on one machine.** Best of three: 1.47 s one at a time, 0.033 s all at once.

**The ratio.**

$$
\frac{1.47\,\mathrm{s}}{0.033\,\mathrm{s}} \approx 44.
$$

**Sense check.** Each of the 1,539 time steps now costs about twenty NumPy calls on 500-long arrays instead of 500 passes through the Python loop body. The ratio is smaller than the 75 of the dynamic-pressure example, because 500 numbers is a short array and each NumPy call has a fixed start-up cost of about half a microsecond on this machine. Vectorising pays best on long arrays.
:::

::: warning Vectorised code does the work for everyone
`np.where` computes both options for every case and then keeps one. Cases that landed early are still pushed through `np.interp` and the drag formula on every step until the last case lands. If one case flies ten times longer than the rest, most of the arithmetic is wasted. It is usually still much faster than the loop, but it is a real cost, and it is one reason a compiled loop (the Numba lessons) sometimes beats a vectorised one.
:::

## The price: temporary arrays

A bag of groceries has to be held somewhere while you carry it. Array expressions are the same. `0.5 * rho * v**2` runs as separate steps, and each step writes a whole new array: first $0.5\rho$, then $v^2$, then their product. Each of those in-between arrays is a **temporary**: made, used once, thrown away. With ten million samples, every one of them is $10^7 \times 8 = 8 \times 10^7$ bytes, 80 MB.

You can see this with **`tracemalloc`**, a module in the standard library that records memory allocations, including NumPy's. `get_traced_memory()` returns the current and the peak number of bytes since tracing started.

```python
import tracemalloc
import numpy as np

n = 10_000_000
rng = np.random.default_rng(0)
rho = rng.uniform(0.01, 1.2, n)
v = rng.uniform(100.0, 800.0, n)

def q_plain(rho, v):
    return 0.5 * rho * v**2

def q_inplace(rho, v):
    q = v * v              # the one new array
    q *= rho               # in place: no new array
    q *= 0.5
    return q

for f in (q_plain, q_inplace):
    tracemalloc.start()
    q = f(rho, v)
    peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    print(f"{f.__name__:9s} result {q.nbytes / 1e6:.0f} MB, peak {peak / 1e6:.0f} MB")
# q_plain   result 80 MB, peak 160 MB
# q_inplace result 80 MB, peak 80 MB
```

The answer is 80 MB either way. The plain expression needed 160 MB at its peak, because two 80 MB temporaries existed at once. (NumPy was already a little clever and reused one of them for the final product, a trick called **[[temporary elision|elision]]**. Otherwise the peak would have been 240 MB.) The **in-place** version writes each result into an array that already exists: `q *= rho` means "multiply `q` by `rho` and store the answer back in `q`". Every NumPy arithmetic function can also do this with an `out=` argument, like `np.multiply(q, rho, out=q)`.

In-place was also faster: on one machine, about 27 ms against 50 ms. Less memory written is less time spent writing it.

::: warning In place changes the array everyone shares
`q *= rho` changes `q` itself. If `q` is the same array as one of your inputs, you have overwritten your input. Writing `q = v` and then `q *= rho` does *not* make a copy: both names point to one array, so `v` is now ruined. Start from a new array (`q = v * v`, or `q = v.copy()`) before operating in place.
:::

## Fast memory is small

Why does writing less memory make code faster? Because the processor does not work straight from the main memory. It keeps copies of recently used data in small, very fast stores called **caches**, arranged in layers. On the machine used for this lesson, each core has a **[[cache hierarchy|memory-hierarchy]]** of:

- **L1 cache**: 48 KB, the fastest, about a nanosecond away;
- **L2 cache**: 2 MB, a few nanoseconds away;
- **L3 cache**: shared by all cores, very large on this server chip (260 MB; a laptop has more like 10 to 30 MB);
- **main memory (RAM)**: 15 GB, around a hundred nanoseconds away for a single fetch.

When all of an operation's arrays fit in cache, NumPy's loop runs at the speed of arithmetic. When they do not, it runs at the speed at which memory can pour data in, the **memory bandwidth**. Here is the cost per element of multiplying two arrays, measured on one machine at growing sizes:

| Elements | Memory touched (3 arrays) | Time per element |
|---|---|---|
| 1,000 | 0.024 MB | 0.54 ns |
| 100,000 | 2.4 MB | 1.04 ns |
| 10,000,000 | 240 MB | 2.08 ns |
| 50,000,000 | 1,200 MB | 2.11 ns |

Same code, same arithmetic, about four times slower per element once the data no longer sits in the fast caches. A vectorised expression with several big temporaries pushes every temporary out to slow memory and pulls it back in. That traffic is the price of vectorising.

## When the bag becomes a box

Broadcasting makes it easy to write a calculation that builds an enormous temporary without noticing. Here is a real kind of job: for each of 500 satellites, find the closest of 100,000 tracked debris pieces. Positions are in kilometers.

The shortest vectorised version broadcasts [[every satellite against every piece of debris|broadcast-grid]]. `a[:, None, :]` has shape (500, 1, 3) and `b[None, :, :]` has shape (1, 100000, 3), so their difference has shape (500, 100000, 3): every pair's separation vector. Then square, add along the last axis, take the square root, and take the smallest along each row.

The **chunked** version does the same maths a few satellites at a time, so each temporary is small. It also uses **`np.einsum`**, which computes a sum of products described by a short string of letters. `np.einsum("ijk,ijk->ij", d, d)` means "multiply `d` by itself element by element, and add over the `k` axis", which is the squared length of each separation vector, without first building a separate `d**2` array. The name comes from **[[Einstein's summation convention|einsum]]**.

```python
import time
import tracemalloc
import numpy as np

rng = np.random.default_rng(3)
sats = rng.uniform(-7000.0, 7000.0, size=(500, 3))        # km
debris = rng.uniform(-7000.0, 7000.0, size=(100_000, 3))  # km

def closest_broadcast(a, b):
    d = a[:, None, :] - b[None, :, :]        # shape (500, 100000, 3)
    return np.sqrt((d**2).sum(axis=2)).min(axis=1)

def closest_chunked(a, b, rows=4):
    out = np.empty(len(a))
    for s in range(0, len(a), rows):
        d = a[s:s + rows, None, :] - b[None, :, :]   # shape (rows, 100000, 3)
        d2 = np.einsum("ijk,ijk->ij", d, d)           # squared distances
        out[s:s + rows] = np.sqrt(d2.min(axis=1))
    return out

def measure(f, *args):
    tracemalloc.start()
    t0 = time.perf_counter()
    result = f(*args)
    seconds = time.perf_counter() - t0
    peak_mb = tracemalloc.get_traced_memory()[1] / 1e6
    tracemalloc.stop()
    return result, seconds, peak_mb

r1, t1, m1 = measure(closest_broadcast, sats, debris)
r2, t2, m2 = measure(closest_chunked, sats, debris, 4)
r3, t3, m3 = measure(closest_chunked, sats, debris, 64)
print(np.allclose(r1, r2), np.allclose(r1, r3))   # True True
print(f"broadcast  {t1:.2f} s  peak {m1:6.0f} MB")  # peak 2800 MB
print(f"4 rows     {t2:.2f} s  peak {m2:6.0f} MB")  # peak 22 MB
print(f"64 rows    {t3:.2f} s  peak {m3:6.0f} MB")  # peak 358 MB
print(round(r1.min(), 1), "km")                   # 7.6 km
```

This needs about 3 GB of free memory for the broadcast line. If your computer has less, cut the debris to 20,000 pieces. The peak-memory numbers are exact and will match yours. The times, measured four times each on one machine, were:

| Version | Times (s) | Peak memory |
|---|---|---|
| Full broadcast | 10.19, 2.02, 2.28, 3.97 | 2,800 MB |
| Chunks of 64 satellites | 0.98, 1.07, 0.96, 0.99 | 358 MB |
| Chunks of 4 satellites | 0.66, 0.67, 0.72, 0.68 | 22 MB |

The version with a Python loop in it is three times faster than the "fully vectorised" one at its best, and fifteen times faster than its first run. It also uses about 130 times less memory. The broadcast's times jump around because the operating system has to find and hand over 2.8 GB of fresh memory, and how long that takes depends on what else is going on. The small chunks are steady.

::: example Where the 2,800 MB came from, and what happens at scale
**The separation array.** Shape (500, 100000, 3), 8 bytes per number:

$$
500 \times 100{,}000 \times 3 \times 8 = 1.2 \times 10^9\ \text{bytes} = 1{,}200\ \text{MB}.
$$

**Its square.** `d**2` is another array the same shape: another 1,200 MB, alive at the same time as `d`.

**The sum.** `.sum(axis=2)` gives shape (500, 100000): $500 \times 100{,}000 \times 8 = 400$ MB.

**Peak.** $1200 + 1200 + 400 = 2{,}800$ MB. That matches `tracemalloc` exactly.

**Now scale it up.** The team wants 4,000 satellites instead of 500, eight times more. Every temporary grows eightfold, so the peak becomes $8 \times 2800 = 22{,}400$ MB, about 22 GB. On a laptop with 16 GB the program either crashes with a `MemoryError` or the operating system starts shuffling memory to disk and everything grinds nearly to a halt.

**The chunked version at scale.** Each chunk of 4 satellites still makes a $4 \times 100{,}000 \times 3 \times 8 = 9.6$ MB separation array, however many satellites there are. More satellites means more chunks, a longer loop, and the same small peak. Time grows in step with the work; memory does not grow at all.
:::

Notice the middle row of the table. Chunks of 64 satellites are safer than the full broadcast but slower than chunks of 4, because each 154 MB chunk has outgrown the fast caches. The best chunk is big enough that the Python loop around it runs only a few hundred times, so its overhead is small, and small enough that its temporaries stay in cache. A few megabytes per temporary is a good starting point. Then measure two or three sizes, as with everything in this module.

::: key
When does vectorisation cost more than it saves? When the intermediate arrays no longer fit in cache or memory: a broadcast that materialises an N by M temporary can be slower than a loop, and can simply exhaust RAM. Chunk the computation, or use einsum and in-place operations.
:::

::: warning Estimate the biggest temporary before you run it
Before running a broadcast, multiply out the shape of the largest array it creates and multiply by 8 bytes (for float64). If the answer is more than a few hundred megabytes, chunk it. It takes ten seconds with a pencil, and it is much cheaper than finding out from a crashed overnight run.
:::

::: note Why chunking cannot change the answer
Each satellite's closest distance depends only on that satellite's row: its separations to all the debris. No row uses another row's numbers. So computing the rows 4 at a time, or all 500 at once, does exactly the same arithmetic on each row, in the same order along the debris axis for the `min`. The only differences come from `einsum` adding the three squared components in a slightly different way from `.sum`, which can change the last binary digit, and that is why the check uses `np.allclose` rather than `==`.
:::

## A decision rule

Putting the two halves together:

1. **Vectorise by default.** Any loop over the elements of a large array, doing the same arithmetic to each, belongs in NumPy. Across Monte Carlo cases is often the best direction to vectorise.
2. **Estimate memory.** Work out the biggest temporary. If it is small, you are done.
3. **If it is big, cut it down.** Chunk along an axis that does not mix rows, use `einsum` to fuse "multiply then sum" into one step, use in-place operations (`*=`, `out=`) to avoid temporaries, or [[rewrite the maths|expand-square]] so a tuned library routine does the heavy part.
4. **Measure.** Time the plain and the chunked version, and check the peak memory with `tracemalloc` or `memory_profiler`.
5. **If the loop cannot be vectorised cleanly**, because each step depends on the last or the branching is messy, that is the job for a compiler, which is where the next lessons go.

The memory side matters on a real vehicle program as much as the time side. Monte Carlo runs are often done on shared machines or in batches of parallel processes, each with its own share of memory. A job that needs 22 GB per process cannot run eight at once on a 64 GB machine, however fast it is.

## Check yourself

::: check
Why does the loop version of $q = \tfrac{1}{2}\rho v^2$ spend most of its time on work that is not arithmetic? Name two kinds of that work.
:::

::: answer
Because Python's interpreter handles each element separately, and each element carries fixed costs that dwarf one multiplication. Any two of: wrapping each raw number from the array in a new Python float object (boxing) and unwrapping the result; checking the types of the operands before every `*` and `**` and looking up the code for them; creating and discarding a new object for every intermediate result; running the loop machinery itself (`range`, indexing). The vectorised version pays those costs once per array operation instead of once per element.
:::

::: check
You want $r = \sqrt{x^2 + y^2 + z^2}$ for 20 million position samples stored in three float64 arrays. Written as `np.sqrt(x**2 + y**2 + z**2)`, roughly what is the peak extra memory, ignoring any clever reuse by NumPy? How would you lower it?
:::

::: answer
Each array of 20 million float64 numbers is $2 \times 10^7 \times 8 = 1.6 \times 10^8$ bytes, 160 MB. Follow the steps. `x**2` and `y**2` make two temporaries, and their sum makes a third while both still exist: three arrays, 480 MB. After that the first two are freed; `z**2` and the next sum again have three alive at once, and `np.sqrt` needs two. So the peak is three arrays, 480 MB. (Measured with `tracemalloc`, NumPy's temporary elision brought it to 320 MB, but you cannot count on that.) To guarantee a lower peak, build one array and work in place: `r = x * x`, `r += y * y`, `r += z * z`, `np.sqrt(r, out=r)`. Only `r` and one squared temporary ever exist, 320 MB. To go lower still, chunk: process a million samples at a time, and the temporaries are 8 MB each.
:::

::: check
In the satellite example, how big is the separation array for one chunk of 16 satellites? Would you expect 16 to be faster or slower than 4 on the machine in this lesson, and why?
:::

::: answer
$16 \times 100{,}000 \times 3 \times 8 = 3.84 \times 10^7$ bytes, 38.4 MB. That is far bigger than the 2 MB L2 cache, while a chunk of 4 (9.6 MB) is closer to cache size and a chunk of 1 (2.4 MB) nearly fits. So 16 should be somewhat slower than 4, and faster than 64 (154 MB). It is not a certainty from the numbers alone; the rule of thumb says to measure. (On the lesson's machine, 16 rows took about 0.86 s against 0.65 s for 4.)
:::

::: check
A teammate writes `q = v` and then `q *= 0.5 * rho` to save memory. What goes wrong?
:::

::: answer
`q = v` does not copy the array; `q` and `v` are two names for the same memory. `q *= ...` then multiplies that shared array in place, so `v` now holds $\tfrac{1}{2}\rho v$ instead of the speeds. Any later code that uses `v` gets wrong numbers, with no error message. Start with a new array instead: `q = v * v` then `q *= rho` and `q *= 0.5`, or `q = v.copy()` first if that is what you want.
:::

::: check
A vectorised dispersion with 2,000 cases stores the full state history, 6 float64 numbers per case per step, for 100,000 steps. How much memory is that? Suggest a change that keeps the analysis possible.
:::

::: answer
$2000 \times 100{,}000 \times 6 \times 8 = 9.6 \times 10^9$ bytes, 9.6 GB, before any temporaries. That is too much for most laptops. Options: keep only what the analysis needs (final state, peak values, a few summary numbers updated as the loop runs); record every 100th step instead of every step (96 MB); or run the cases in chunks of, say, 200, and write each chunk's results to disk before starting the next. The later lesson on data bigger than memory covers the disk side.
:::

## Summary

| Idea | Meaning | Fact to carry |
|---|---|---|
| Vectorisation | Whole-array operations instead of a Python loop per element | Overhead paid per array, not per element; often 50–100x |
| Interpreter overhead | Type checks, boxing, object creation per element | About 290 ns per element in the lesson's loop, under 4 ns vectorised |
| Mask and `np.where` | Branches in array form | Both branches computed for every element |
| Temporary | Full-size array made mid-expression | Each costs $N \times 8$ bytes for float64 |
| In place | `*=`, `out=` write into an existing array | Lower peak memory, often faster; beware shared arrays |
| Cache | Small fast memory near the core | Out-of-cache work ran about 4x slower per element here |
| Chunking | Do the work a slice at a time | Memory stays flat; pick chunks of a few MB, then measure |
| `np.einsum` | Sum of products from a subscript string | Squares and sums without a separate squared array |

The next lesson picks up the loops that cannot be vectorised cleanly: compiling them with Numba's `@njit`, so a plain Python loop runs at the speed of C.

::: context interpreter What the interpreter actually runs
Python first turns your source code into **bytecode**, a list of small, simple instructions like "load this variable", "multiply the top two things", "store the result". The interpreter is a loop inside CPython that reads one bytecode instruction at a time and carries it out. That loop is written in C and is quick, but every instruction still costs tens of nanoseconds of bookkeeping. You can see the bytecode for any function with the `dis` module: `import dis; dis.dis(q_loop)`.
:::

::: context boxed Numbers in boxes
A NumPy float64 array stores its numbers as bare 8-byte values, packed side by side. A Python `float` is a full object: on a typical 64-bit build, `sys.getsizeof(1.0)` is 24 bytes, holding a reference count, a pointer to its type and the 8-byte value itself. Taking a number out of an array to use in Python means building one of these objects, a **box**, around it. Doing that a million times is a million small memory allocations.
:::

::: context simd One instruction, many numbers
**SIMD** stands for "single instruction, multiple data". Modern processors have wide registers that hold several numbers at once and instructions that work on all of them together. The AVX-512 instructions on the lesson's machine hold 512 bits, which is eight float64 numbers, so one multiply instruction can do eight multiplications. NumPy's simple loops over packed arrays are written so the compiler can use these. This is also where the word **vector** in "vectorisation" comes from: a vector register.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="12" fill="#1f2a44">a</text>
  <text x="10" y="70" font-size="12" fill="#1f2a44">b</text>
  <text x="10" y="126" font-size="12" fill="#1f2a44">a×b</text>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="40" y="14" width="36" height="24"/><rect x="76" y="14" width="36" height="24"/>
    <rect x="112" y="14" width="36" height="24"/><rect x="148" y="14" width="36" height="24"/>
    <rect x="184" y="14" width="36" height="24"/><rect x="220" y="14" width="36" height="24"/>
    <rect x="256" y="14" width="36" height="24"/><rect x="292" y="14" width="36" height="24"/>
    <rect x="40" y="54" width="36" height="24"/><rect x="76" y="54" width="36" height="24"/>
    <rect x="112" y="54" width="36" height="24"/><rect x="148" y="54" width="36" height="24"/>
    <rect x="184" y="54" width="36" height="24"/><rect x="220" y="54" width="36" height="24"/>
    <rect x="256" y="54" width="36" height="24"/><rect x="292" y="54" width="36" height="24"/>
  </g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <rect x="40" y="110" width="36" height="24"/><rect x="76" y="110" width="36" height="24"/>
    <rect x="112" y="110" width="36" height="24"/><rect x="148" y="110" width="36" height="24"/>
    <rect x="184" y="110" width="36" height="24"/><rect x="220" y="110" width="36" height="24"/>
    <rect x="256" y="110" width="36" height="24"/><rect x="292" y="110" width="36" height="24"/>
  </g>
  <line x1="184" y1="82" x2="184" y2="104" stroke="#b4232c" stroke-width="2"/>
  <polygon points="184,108 179,100 189,100" fill="#b4232c"/>
  <text x="194" y="98" font-size="11" fill="#b4232c">one instruction, 8 products</text>
</svg>
```
:::

::: context elision When NumPy reuses a temporary
In `0.5 * rho * v**2`, the product at the end combines two temporaries that nobody else can see. NumPy can detect this case (the array has no other references and is large) and write the answer into one of them instead of allocating a third array. This optimisation, added in NumPy 1.13, is called **temporary elision**. It works on common platforms for large arrays, but it is an implementation detail: you cannot count on it, which is why explicit in-place operations are still worth writing when memory is tight.
:::

::: context memory-hierarchy A ladder of memories
Faster memory is more expensive and must sit physically closer to the arithmetic units, so there is less of it. Data moves up the ladder in chunks of 64 bytes (a **cache line**, eight float64 numbers) when it is needed. Sizes below are for the lesson's machine; the times are rough typical values.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="12" width="60" height="30" fill="#1d6fd1"/>
  <rect x="120" y="50" width="120" height="30" fill="#8fb8f0"/>
  <rect x="80" y="88" width="200" height="30" fill="#8fb8f0"/>
  <rect x="30" y="126" width="300" height="30" fill="#f2b880"/>
  <text x="180" y="32" font-size="12" text-anchor="middle" fill="#ffffff">L1</text>
  <text x="180" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">L2 2 MB</text>
  <text x="180" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">L3 260 MB (shared)</text>
  <text x="180" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">RAM 15 GB, about 100 ns</text>
  <text x="222" y="32" font-size="11" fill="#1f2a44">48 KB, about 1 ns</text>
  <text x="30" y="180" font-size="11" fill="#6c7a93">higher = smaller and faster; lower = bigger and slower</text>
</svg>
```
:::

::: context broadcast-grid The whole table, or one strip at a time
The full broadcast builds the separation of every satellite from every piece of debris at once: a table with 500 rows and 100,000 columns, three numbers in each cell. The chunked version builds a strip of 4 rows, finds each row's minimum, throws the strip away, and moves down. Drawn to scale below, the strip is 4/500 of the table's height, less than one percent, which is why its memory stays tiny.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="250" height="150" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="80" width="250" height="1.2" fill="#b4232c"/>
  <line x1="290" y1="80.6" x2="304" y2="80.6" stroke="#b4232c" stroke-width="1.5"/>
  <text x="308" y="78" font-size="11" fill="#b4232c">4 rows</text>
  <text x="308" y="92" font-size="11" fill="#b4232c">9.6 MB</text>
  <text x="165" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">100,000 debris</text>
  <text x="28" y="95" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 28 95)">500 satellites</text>
  <text x="165" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">full table: 1,200 MB</text>
  <text x="165" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">(3 numbers per cell)</text>
</svg>
```
:::

::: context einsum Einstein's shorthand
Albert Einstein, writing about relativity, got tired of writing summation signs. He adopted a rule: when an index letter appears twice in a product, sum over it. So $a_i b_i$ means $a_1 b_1 + a_2 b_2 + a_3 b_3$, a dot product. `np.einsum` uses the same idea with an explicit output: in `"ijk,ijk->ij"`, the letter `k` appears in the inputs but not after the arrow, so it is summed away, leaving an `ij` array of squared lengths. `"ij,jk->ik"` is a matrix product.
:::

::: context expand-square Another route: rewrite the maths
There is a third way to find the closest debris. Expand the square: $|\mathbf{a} - \mathbf{b}|^2 = |\mathbf{a}|^2 + |\mathbf{b}|^2 - 2\,\mathbf{a} \cdot \mathbf{b}$. All the dot products at once are one matrix product, `a @ b.T`, which NumPy hands to a highly tuned linear-algebra library. On the lesson's machine it took about 0.36 s, the fastest version, but it builds the full 500 by 100,000 distance table (400 MB each for the table and for the product) and subtracting large nearly equal numbers cost precision: answers differed by about $2 \times 10^{-10}$ km. Chunking it as well keeps the speed without the memory.
:::
