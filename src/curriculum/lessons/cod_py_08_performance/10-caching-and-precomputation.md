---
id: l10-caching-and-precomputation
title: Caching and precomputation
minutes: 24
covers:
  - 'Caching and precomputation: lookup tables, interpolators built once'
---

Nobody works out $7 \times 8$ by counting on their fingers every time. You did the counting once, years ago, and now you remember the answer: $56$. A cook in a busy kitchen does the same thing with onions. She chops a whole tub of them before dinner starts, instead of chopping one onion every time an order comes in.

Programs can do both tricks. **Precomputation** means doing work ahead of time, once, before the loop that needs it. **Caching** means keeping an answer you already worked out, so the next time somebody asks the same question you look the answer up instead of working it out again. The stored answers live in a **cache** — a place where results are kept for quick reuse.

Rocket software is full of both. A flight computer does not compute the drag of the vehicle from the airflow on every cycle. It reads a **[[lookup table|flight-tables]]** of drag against speed that engineers built on the ground from wind-tunnel tests and fluid simulations. The same goes for engine thrust against time, air density against height, and control gains against vehicle mass. In a Monte Carlo dispersion those tables are read millions of times. This lesson is about building such things once, using them many times, and the traps that come with remembered answers.

## Does this line change inside the loop?

Back in the first lesson of this module, the profiler caught a function that rebuilt a 201-point atmosphere table on every call. Building the table once, when the module loaded, made the whole simulation about 15.6 times faster. That fix came from one question, and it is worth asking about every line inside a loop:

> Does this line depend on anything that changes from one pass of the loop to the next?

If the answer is no, the line is **[[loop-invariant|loop-invariant]]** — it gives the same result on every pass. Move it above the loop. That move is called **hoisting**.

Here is a small example: a state that moves forward in time by a fixed matrix, the way a constant-velocity model steps position and velocity. The matrix never changes, but the first version builds it on every step.

```python
import timeit
import numpy as np

dt = 0.01

def step_inside(x, n):
    for _ in range(n):
        A = np.array([[1.0, dt], [0.0, 1.0]])   # the same matrix, every step
        x = A @ x
    return x

def step_hoisted(x, n):
    A = np.array([[1.0, dt], [0.0, 1.0]])       # built once
    for _ in range(n):
        x = A @ x
    return x

x0 = np.array([0.0, 1.0])
print(np.round(step_hoisted(x0, 100_000), 6))   # [1000.    1.]
for f in (step_inside, step_hoisted):
    t = timeit.repeat(lambda: f(x0, 100_000), number=1, repeat=5)
    print(f.__name__, round(min(t), 3), "s")
# step_inside 0.165 s
# step_hoisted 0.079 s
```

The timings in this lesson come from one machine, a 2.1 GHz Intel Xeon cloud server with Python 3.11, NumPy 2.4 and SciPy 1.17. Yours will differ. Look at the ratios, which tend to carry over.

Moving one line roughly halved the time. A small NumPy array costs about a microsecond (a millionth of a second) to build, and a hundred thousand of them add up.

::: warning Hoist only what truly does not change
If the matrix depended on the step size and the step size changed during the flight (an adaptive integrator does exactly that), hoisting it would freeze the first value and give wrong answers. Before you move a line, check every name it reads. A faster answer that is wrong is a bug, so compare the outputs before and after, as the first lesson did.
:::

## Interpolators built once

An **interpolator** is a function made from a table: you give it the table once, and afterward it will estimate a value between the table's points. SciPy has several. `CubicSpline` joins the points with smooth curved pieces, one piece between each pair of points, and `RegularGridInterpolator` handles tables with two or more inputs, like drag against both speed and angle.

Using an interpolator has two steps, and they cost very different amounts.

- **Construction** — `CubicSpline(x, y)` — prepares the table. A **[[cubic spline|spline-setup]]** has to solve for the curve's bend at every table point so that the pieces join smoothly. That is real work, and it grows with the size of the table.
- **Evaluation** — `spline(0.95)` — uses the prepared pieces to answer one question. That is cheap.

The trap is building inside the function the loop calls, so the preparation is redone every call. Here is a table of the drag coefficient (a number with no units that says how draggy the shape is) against Mach number (speed divided by the speed of sound), with 41 points from Mach 0 to Mach 5.

```python
import timeit
import numpy as np
from scipy.interpolate import CubicSpline

mach_tab = np.linspace(0.0, 5.0, 41)
cd_tab = 0.3 + 0.5 * np.exp(-((mach_tab - 1.1) / 0.3) ** 2) + 0.05 * mach_tab / (1 + mach_tab)

def cd_rebuild(m):
    spline = CubicSpline(mach_tab, cd_tab)   # built on every call
    return float(spline(m))

CD_SPLINE = CubicSpline(mach_tab, cd_tab)    # built once, when the module loads

def cd_cached(m):
    return float(CD_SPLINE(m))

print(round(cd_rebuild(0.95), 4), round(cd_cached(0.95), 4))   # 0.7139 0.7139
for f in (cd_rebuild, cd_cached):
    t = timeit.repeat(lambda: f(0.95), number=10_000, repeat=5)
    print(f.__name__, round(min(t) / 10_000 * 1e6, 1), "us per call")
# cd_rebuild 162.3 us per call
# cd_cached 4.4 us per call
```

Same answer, about 37 times faster. Nearly all of the $162\,\mu\mathrm{s}$ (read "microseconds") was construction: timing `CubicSpline(mach_tab, cd_tab)` on its own gives about $151\,\mu\mathrm{s}$.

How does the construction cost grow with the table? Timing the build and one evaluation for tables of different sizes, on the same machine, gave:

| Table points | Build time | One evaluation |
| --- | --- | --- |
| 41 | 148 µs | 4.1 µs |
| 401 | 163 µs | 4.1 µs |
| 4,001 | 304 µs | 4.1 µs |
| 40,001 | 2,816 µs | 4.2 µs |

The build has a fixed cost of about $150\,\mu\mathrm{s}$, plus a part that grows in step with the number of points. Evaluation barely changes, because finding the right piece is a quick search.

Tables with more inputs make the gap wider. A 51-by-41 table of a force coefficient against Mach and angle of attack, wrapped in `RegularGridInterpolator(..., method="cubic")`, took about $1740\,\mu\mathrm{s}$ to build and evaluate once, against about $35\,\mu\mathrm{s}$ to evaluate an interpolator built earlier. That is about 50 times.

::: key
Why is caching an interpolator outside the loop a big win? Constructing a spline or a grid interpolator does setup work proportional to the table size. Building it once and calling it inside the loop turns per-call setup into per-call evaluation, often an order of magnitude.
:::

::: example What rebuilding costs a whole dispersion
**The setup.** A dispersion runs $500$ cases. Each case takes $20{,}000$ time steps, and the integrator (a fourth-order Runge–Kutta) asks for the drag coefficient $4$ times per step.

**The count.** $500 \times 20{,}000 \times 4 = 40{,}000{,}000$ calls to the drag function — forty million.

**Rebuilding every call.** $4 \times 10^7 \times 162.3 \times 10^{-6}\,\mathrm{s} \approx 6490\,\mathrm{s}$. Divide by $3600$ to get hours: about $1.8$ hours spent on drag alone.

**Built once.** $4 \times 10^7 \times 4.4 \times 10^{-6}\,\mathrm{s} = 176\,\mathrm{s}$, or about $2.9$ minutes.

**Sense check.** $6490 / 176 \approx 37$, the same ratio as the single-call timing, as it should be: every call saved the same construction. And if the simulator can hand the spline a whole array of Mach numbers at once, the price per value drops again. Evaluating $100{,}000$ Mach numbers in one call took about $1.05\,\mathrm{ms}$ on the same machine, about $10.5\,\mathrm{ns}$ each. That is the vectorization lesson again: fewer, bigger calls.
:::

### What happens past the end of the table

A table stops somewhere. The drag table stops at Mach 5. Ask for Mach 15 and the three tools do three different things, none of which warns you by default.

```python
import numpy as np
from scipy.interpolate import CubicSpline, RegularGridInterpolator

mach_tab = np.linspace(0.0, 5.0, 41)
cd_tab = 0.3 + 0.5 * np.exp(-((mach_tab - 1.1) / 0.3) ** 2) + 0.05 * mach_tab / (1 + mach_tab)

print(round(float(cd_tab[-1]), 4))                          # 0.3417  (last table entry)
print(round(float(np.interp(15.0, mach_tab, cd_tab)), 4))   # 0.3417  (holds the end value)
print(round(float(CubicSpline(mach_tab, cd_tab)(15.0)), 4))  # 0.3755  (keeps the last cubic going)
grid = RegularGridInterpolator((mach_tab,), cd_tab)
try:
    grid([15.0])
except ValueError as err:
    print("ValueError:", err)   # ValueError: One of the requested xi is out of bounds in dimension 0
```

`np.interp` quietly holds the last value. `CubicSpline` carries on along its last curved piece, which at Mach 15 already gives a value about 10 percent above the table's end and keeps growing. `RegularGridInterpolator` refuses, which is the safest of the three. Going past the table is called **[[extrapolation|extrapolation]]**.

::: warning A cached table has edges
Build the table to cover every value the dispersion can reach, with a margin, and check the inputs against its edges. A dispersed trajectory that goes faster or higher than the nominal one will walk off a table built around the nominal, and `np.interp` will not tell you.
:::

## Remembering answers: functools.lru_cache

Hoisting works when the input never changes. Sometimes the input does change, but it keeps coming back to the same few values. Then you want the times-tables trick: work out each answer the first time it is asked, write it down, and look it up after that. That is **[[memoisation|memoisation]]** — caching the results of a function, keyed by its arguments.

It is only safe for a **pure function**: one whose answer depends on its arguments and nothing else, and which changes nothing outside itself.

Python has memoisation built in. The **decorator** `functools.lru_cache` — a line starting with `@` that wraps a function in extra behavior — keeps a dictionary from arguments to results. On a call it looks the arguments up. If they are there, a **hit**, it returns the stored result without running the function. If not, a **miss**, it runs the function and stores the result.

A real place this pays off is a **[[gain schedule|gain-schedule]]**: control gains worked out for a set of flight conditions and picked by the current condition. Here the gains for a pitch controller are computed from the vehicle's mass by solving a matrix equation with `scipy.linalg.solve_continuous_are`. You do not need the control theory for this lesson. What matters is that each solve costs about half a millisecond, and the mass is rounded to the nearest $10\,\mathrm{kg}$, so the same few masses come up again and again as the propellant burns off.

```python
import timeit
from functools import lru_cache
import numpy as np
from scipy.linalg import solve_continuous_are

def pitch_gain(mass_kg):
    """LQR feedback gains for a pitch axis whose inertia scales with mass."""
    inertia = 0.8 * mass_kg                       # kg m^2, a made-up scaling
    A = np.array([[0.0, 1.0], [0.0, 0.0]])
    B = np.array([[0.0], [1.0 / inertia]])
    Q = np.diag([10.0, 1.0])
    R = np.array([[0.01]])
    P = solve_continuous_are(A, B, Q, R)          # the expensive part
    return tuple((B.T @ P / R[0, 0]).ravel())

@lru_cache(maxsize=None)
def pitch_gain_cached(mass_bin_kg):
    return pitch_gain(mass_bin_kg)

masses = np.linspace(520.0, 380.0, 2000)          # mass falls as propellant burns
bins = [float(round(m / 10.0) * 10.0) for m in masses]   # nearest 10 kg

def run_plain():
    return [pitch_gain(b) for b in bins]

def run_cached():
    pitch_gain_cached.cache_clear()               # start every repeat cold
    return [pitch_gain_cached(b) for b in bins]

assert run_plain() == run_cached()
tp = min(timeit.repeat(run_plain, number=1, repeat=5))
tc = min(timeit.repeat(run_cached, number=1, repeat=5))
print(f"plain {tp:.3f} s, cached {tc:.4f} s, speed-up {tp / tc:.0f}x")
print(pitch_gain_cached.cache_info())
# plain 1.115 s, cached 0.0086 s, speed-up 130x
# CacheInfo(hits=1985, misses=15, maxsize=None, currsize=15)
```

`cache_info()` shows what happened: $2000$ calls, $15$ misses (one for each $10\,\mathrm{kg}$ bin from $380$ to $520\,\mathrm{kg}$), and $1985$ hits. `cache_clear()` empties the cache, which the timing uses so that every repeat pays for its own misses.

The name tells you what happens when the cache is full. **LRU** stands for **[[least recently used|lru]]**: with `maxsize=128` (the default), once 128 answers are stored, adding a new one throws out the answer that has gone longest without being asked for. `maxsize=None` never throws anything out.

::: example How much can a cache save?
**Cost of one solve.** $1.115\,\mathrm{s} / 2000 \approx 0.56\,\mathrm{ms}$.

**Cost with the cache.** Only the misses do real work: $15 \times 0.56\,\mathrm{ms} \approx 8.4\,\mathrm{ms}$. The $1985$ hits cost a dictionary lookup each, well under a microsecond. The measurement said $8.6\,\mathrm{ms}$, so the prediction is close.

**The ceiling.** If a hit were free, the best possible speed-up would be calls divided by misses: $2000 / 15 \approx 133$. The measured $130$ sits right under that ceiling.

**Sense check.** The ceiling depends on how often inputs repeat, not on how clever the cache is. Round the mass to the nearest $1\,\mathrm{kg}$ instead and there would be about $141$ distinct values, so the ceiling would drop to about $2000/141 \approx 14$.
:::

::: warning Four ways a cache bites
- **Arrays cannot be keys.** The cache stores arguments in a dictionary, so they must be **[[hashable|hashable]]**. Passing a NumPy array raises `TypeError: unhashable type: 'numpy.ndarray'`. Pass a tuple or a float instead.
- **Floats must match exactly.** $500.0$ and $500.0000001$ are different keys, so an unrounded mass would miss every time and the cache would only grow. Rounding to bins fixes that, but rounding is a modeling choice: the gain for $503\,\mathrm{kg}$ is now the gain for $500\,\mathrm{kg}$. Decide that on purpose.
- **Returned objects are shared.** A cached function hands every caller the same object. If it returns a list and one caller changes it, every later caller sees the change. Return tuples, or arrays you never modify.
- **Stale answers.** If the function reads anything besides its arguments — a global table, a file — and that thing changes, the cache keeps returning the old answer. Call `cache_clear()`, or better, pass that thing in as an argument.
:::

## Lookup tables: trading memory and accuracy for speed

The drag table came from outside the program. You can also build a table yourself, from a function that is slow to evaluate, and read the table instead of calling the function.

A classic example in orbit work is **[[Kepler's equation|kepler]]**,

$$
E - e \sin E = M.
$$

Given where a satellite is in time along its orbit — the **mean anomaly** $M$, an angle in radians — you want the **eccentric anomaly** $E$, another angle that tells you where it is in space. The **eccentricity** $e$ says how stretched the orbit is; $e = 0.3$ is a noticeably oval orbit. The equation cannot be rearranged to give $E$ directly, so it is solved by guessing and improving with Newton's method, which takes several passes.

For one orbit, $e$ is fixed, so $E$ depends only on $M$. Solve it once for $2001$ values of $M$ from $0$ to $2\pi$, store the answers, and interpolate after that.

```python
import math
import numpy as np

def kepler_E(M, e, tol=1e-12):
    """Solve Kepler's equation E - e*sin(E) = M by Newton's method."""
    E = M
    while True:
        dE = (E - e * math.sin(E) - M) / (1.0 - e * math.cos(E))
        E -= dE
        if abs(dE) < tol:
            return E

e = 0.3
M_TAB = np.linspace(0.0, 2 * math.pi, 2001)          # built once
E_TAB = np.array([kepler_E(M, e) for M in M_TAB])    # 2001 Newton solves, once

def kepler_table(M):
    return float(np.interp(M, M_TAB, E_TAB))

print(round(kepler_E(1.0, e), 6), round(kepler_table(1.0), 6))   # 1.288091 1.288091

# worst error over a fine grid of test points
M_test = np.linspace(0.0, 2 * math.pi, 200_001)
E_true = np.array([kepler_E(M, e) for M in M_test])
for n in (201, 2001, 20001):
    M_t = np.linspace(0.0, 2 * math.pi, n)
    E_t = np.array([kepler_E(M, e) for M in M_t])
    err = np.max(np.abs(np.interp(M_test, M_t, E_t) - E_true))
    print(n, f"{err:.2e} rad")
# 201 5.39e-05 rad
# 2001 5.39e-07 rad
# 20001 5.39e-09 rad
```

A table is never exact. Between two stored points, `np.interp` draws a straight line, and the true curve bends away from it. Look at the pattern in the errors: ten times as many points, a hundred times smaller error. That is the rule for straight-line interpolation. If the gap between table points is $\Delta$ (read "delta") and the curve's second derivative — how sharply it bends — is at most $|f''|_{\max}$, the worst error is about

$$
\text{error}_{\max} \approx \frac{\Delta^2}{8}\,|f''|_{\max}.
$$

Halve the gap, and the error drops by four. For Kepler's equation with $e = 0.3$, the largest bend is $|E''|_{\max} \approx 0.437$. With $201$ points the gap is $\Delta = 2\pi/200 \approx 0.0314\,\mathrm{rad}$, so the rule predicts $0.0314^2/8 \times 0.437 \approx 5.39 \times 10^{-5}\,\mathrm{rad}$ — exactly what the code measured. The gap between the curve and each straight piece is called the **[[chord error|chord-error]]**, and it is always largest in the middle of a gap.

::: note Why it has to be true
Take one gap, from $a$ to $a + \Delta$, and let $p(x)$ be the straight line through the two table points. The error $g(x) = f(x) - p(x)$ is zero at both ends. Pick any point $x$ inside and choose a number $K$ so that

$$
\phi(t) = f(t) - p(t) - K\,(t - a)(t - a - \Delta)
$$

is zero at $t = x$ too. Now $\phi$ is zero at three places: $a$, $x$ and $a + \Delta$. Between any two zeros of a smooth function its slope is zero somewhere (Rolle's theorem), so $\phi'$ has two zeros, and $\phi''$ has one, at some point $\xi$ (read "xi"). The line $p$ has no second derivative, and the product $(t - a)(t - a - \Delta)$ has second derivative $2$, so $\phi''(\xi) = f''(\xi) - 2K = 0$, which gives $K = f''(\xi)/2$. Putting $t = x$ back in,

$$
f(x) - p(x) = \frac{f''(\xi)}{2}\,(x - a)(x - a - \Delta).
$$

The product $(x - a)(x - a - \Delta)$ is largest in size at the middle of the gap, where it equals $-\Delta^2/4$. So the error is at most $\frac{\Delta^2}{8}\,|f''|_{\max}$.
:::

::: example Sizing a table for an accuracy target
**The goal.** Keep the Kepler table's error below $10^{-6}\,\mathrm{rad}$ for $e = 0.3$.

**Solve the rule for the gap.** $\Delta^2/8 \times 0.437 \le 10^{-6}$ gives $\Delta \le \sqrt{8 \times 10^{-6} / 0.437} \approx 0.00428\,\mathrm{rad}$.

**Count the points.** $2\pi / 0.00428 \approx 1468.6$ gaps. Round up to $1469$ gaps, which is $1470$ points.

**Memory.** $1470 \times 8$ bytes $= 11{,}760$ bytes for $E$, and the same again for $M$: about $23\,\mathrm{kB}$ in all. That fits easily in the processor's fastest memory.

**Sense check.** The 201-point table missed by $5.39 \times 10^{-5}$ and the 2001-point table by $5.39 \times 10^{-7}\,\mathrm{rad}$. The target lies between them, and so does $1470$, as it should.
:::

### A table is not automatically faster

Timing one call of each on the same machine gave about $0.68\,\mu\mathrm{s}$ for `kepler_E(1.0, 0.3)` and about $1.02\,\mu\mathrm{s}$ for `kepler_table(1.0)`. The table was *slower*. Newton's method needs only a handful of passes for this orbit, and each pass is a few fast `math` calls. `np.interp` on a single number spends most of its time on the overhead of a NumPy call.

The table wins when the function it replaces is expensive, or when you look up many values at once. Solving a million random $M$ values took about $271\,\mathrm{ms}$ with a vectorized six-pass Newton loop and about $91\,\mathrm{ms}$ with one `np.interp` call on the whole array: three times faster, at a known accuracy cost.

::: warning Measure the table too
A lookup table replaces computation with memory reads, and both have a price. For a cheap function like `math.exp` (about $47\,\mathrm{ns}$ a call here) a table is almost always slower. Time the table against the function it replaces, and check its error against the accuracy you need, before you keep it.
:::

## Caching across runs and across cases

Some precomputation is too slow to repeat even once per program run. `joblib.Memory` caches a function's results **on disk**, keyed by its arguments, so the second run of your program, or tomorrow's, loads the answer instead of recomputing it.

```python
import math, time
import numpy as np
from joblib import Memory

memory = Memory("table_cache", verbose=0)     # a folder on disk

def kepler_E(M, e, tol=1e-12):
    E = M
    while True:
        dE = (E - e * math.sin(E) - M) / (1.0 - e * math.cos(E))
        E -= dE
        if abs(dE) < tol:
            return E

@memory.cache
def kepler_table(e, n):
    M = np.linspace(0.0, 2 * math.pi, n)
    return M, np.array([kepler_E(m, e) for m in M])

t0 = time.perf_counter()
M_tab, E_tab = kepler_table(0.3, 1_000_001)
print(f"{time.perf_counter() - t0:.3f} s")
# first run of the program: 1.620 s
# every later run:          about 0.01 to 0.04 s
```

`joblib.Memory` notices if you change the arguments, and it notices if you edit the function's own code. It does not know about files or globals the function reads. If the input data changes, delete the cache folder or call `memory.clear()`. A saying often credited to Phil Karlton holds that the two hard problems in computer science are cache invalidation and naming things. **Cache invalidation** means deciding when a stored answer is no longer true.

In a Monte Carlo, split the work into two kinds:

- Things that are the **same for every case** — the drag spline, the atmosphere table, the Kepler table for the nominal orbit. Build them once per process, at module level or in a worker pool's startup function, and never inside the per-case function.
- Things that **depend on the dispersed inputs** — a gain that depends on this case's mass, a thrust curve scaled by this case's engine. These cannot be shared across cases, but inside one case they may still repeat, and memoisation can help there.

The parallel lesson showed that sending big arrays to worker processes costs time. Building a table once per worker, from a few small numbers, avoids sending it at all.

## Check yourself

::: check
A function inside a 50,000-step loop contains the line `R = np.diag([2.0, 2.0, 5.0])` and also the line `v = R @ state`. Which line can be hoisted, and what must you check before moving it?
:::

::: answer
`R = np.diag([2.0, 2.0, 5.0])` reads nothing that changes inside the loop, so it gives the same matrix on every pass and can be built once, before the loop. `v = R @ state` depends on `state`, which changes each step, so it stays inside.

Before moving the line, check every name it reads (here only constants) and confirm nothing inside the loop modifies `R` in place, for example with `R[0, 0] = ...`. Then run the old and new versions and compare the outputs to make sure they agree.
:::

::: check
A colleague's function `thrust(t)` builds `CubicSpline(t_tab, F_tab)` from a 300-point table and then evaluates it. It is called 12 million times in a dispersion. Using the timings in this lesson (build about $150\,\mu\mathrm{s}$, evaluation about $4\,\mu\mathrm{s}$), estimate the time before and after building the spline once.
:::

::: answer
Before: each call costs about $150 + 4 = 154\,\mu\mathrm{s}$. $12 \times 10^6 \times 154 \times 10^{-6}\,\mathrm{s} = 1848\,\mathrm{s}$, about $31$ minutes.

After: each call costs about $4\,\mu\mathrm{s}$. $12 \times 10^6 \times 4 \times 10^{-6}\,\mathrm{s} = 48\,\mathrm{s}$.

That is about $38$ times faster. The one-time build of $150\,\mu\mathrm{s}$ is too small to notice. These are estimates from another machine and another table, so the next step is to measure on the real code.
:::

::: check
You wrap `density(h)` in `@lru_cache(maxsize=None)` and pass the unrounded altitude from the integrator. After a long run, `cache_info()` shows `hits=0` and a huge `currsize`. Explain both numbers.
:::

::: answer
The cache only matches exact keys. The integrator's altitude is a float that is different on every step (it is almost never exactly the same number twice), so every call is a miss: `hits=0`. Every miss stores a new entry, and with `maxsize=None` nothing is ever thrown out, so `currsize` grows by one each call. The cache made each call slower (it now does a lookup and a store) and used memory for nothing.

Either round the altitude to bins on purpose, accepting the modeling error that brings, or better, use a lookup table with interpolation, which is built for continuous inputs.
:::

::: check
A straight-line table of some smooth function has 1001 points and a measured worst error of $2 \times 10^{-5}$. About how many points would bring the worst error down to $2 \times 10^{-7}$?
:::

::: answer
The error scales with the gap squared. You want the error $100$ times smaller, so the gap must be $\sqrt{100} = 10$ times smaller. The table has $1000$ gaps now, so it needs $10{,}000$ gaps, which is $10{,}001$ points.

The memory goes up tenfold too, from about $8\,\mathrm{kB}$ to about $80\,\mathrm{kB}$ for the values, which is usually fine.
:::

## Summary

| Idea | What it means | Rule or number to remember |
| --- | --- | --- |
| Precomputation | Do the work once, before the loop | Ask of each line: does it change inside the loop? |
| Hoisting | Moving a loop-invariant line above the loop | Building a small array costs about 1 µs each time |
| Interpolator built once | Construct `CubicSpline` or `RegularGridInterpolator` outside the loop | Build here about 150 µs plus a part growing with table size; evaluate about 4 µs |
| Extrapolation | Asking a table for a value past its end | `np.interp` holds the end value, `CubicSpline` continues the curve, `RegularGridInterpolator` raises |
| Memoisation | Remember a pure function's results by argument | `@functools.lru_cache`, `cache_info()`, `cache_clear()` |
| Speed-up ceiling | Best case for a cache | calls ÷ misses |
| Straight-line table error | Chord below a bending curve | $\text{error}_{\max} \approx \frac{\Delta^2}{8}\,\lvert f''\rvert_{\max}$ |
| Disk cache | Keep results between program runs | `joblib.Memory`; clear it when input data changes |

Every speed-up in this lesson was a claim backed by a timing. The next and last lesson of the module asks how much you can trust such a timing: warming up, repeating, frequency scaling and noise, and how to report a benchmark so that someone else can believe it.

::: context flight-tables Why flight software loves tables
Onboard computers must finish every control cycle before a hard deadline, often many times a second. A table lookup takes the same short time on every cycle, which makes the deadline easy to guarantee, while a model solved by iteration might take longer on some cycles than others. So launch vehicles carry aerodynamic databases, engine performance tables and gain schedules built on the ground from wind tunnels, test firings and fluid simulations. The price is memory and care: every table has edges and a resolution, and both have to be checked against the whole range of conditions the vehicle can see.
:::

::: context loop-invariant Why Python does not do this for you
Compilers for C and C++ move loop-invariant code out of loops automatically; the optimization is called loop-invariant code motion. Python's interpreter does not. It cannot be sure that `np.array` still means the same function on the next pass, because any line of the program could reassign the name `np` or change the list it was given. So it runs every line exactly as written, every time. Numba, from earlier in this module, compiles the loop and can hoist some work, but only for code it can compile.
:::

::: context spline-setup What a spline has to work out first
A cubic spline puts a separate cubic curve in every gap between table points and insists that neighboring pieces meet with the same height, slope and bend. Those joining rules link each point's bend to its neighbors', which gives one equation per point. The equations form a banded system: each one involves only a point and its two neighbors, so it can be solved in time proportional to the number of points. That solve is the construction cost. Evaluation afterward only has to find the right gap and work out one small cubic.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M 30 120 C 60 120 75 50 110 45 C 145 40 150 100 190 105 C 230 110 250 70 290 60 C 310 55 320 60 330 65" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1f2a44">
    <circle cx="30" cy="120" r="4"/><circle cx="110" cy="45" r="4"/><circle cx="190" cy="105" r="4"/><circle cx="290" cy="60" r="4"/><circle cx="330" cy="65" r="4"/>
  </g>
  <g stroke="#6c7a93" stroke-dasharray="3 3">
    <line x1="110" y1="30" x2="110" y2="140"/><line x1="190" y1="30" x2="190" y2="140"/><line x1="290" y1="30" x2="290" y2="140"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="150">piece 1</text><text x="150" y="150">piece 2</text><text x="240" y="150">piece 3</text><text x="310" y="150">piece 4</text>
  </g>
  <text x="180" y="20" font-size="12" fill="#b4232c" text-anchor="middle">pieces match height, slope and bend at joins</text>
</svg>
```
:::

::: context extrapolation Three answers past the edge
Past the last table point there is no data, so any value is a guess. The three SciPy and NumPy tools guess differently. `np.interp` holds the last value flat. `CubicSpline` keeps following its last cubic piece, which bends further and further away. `RegularGridInterpolator` stops with an error unless you pass `bounds_error=False`, and then it fills with NaN unless you give it a `fill_value`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="140" x2="30" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 30 110 C 70 110 80 40 110 45 C 140 50 160 90 200 92" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="200" y1="25" x2="200" y2="140" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="200" y="156" font-size="11" fill="#6c7a93" text-anchor="middle">table ends</text>
  <line x1="200" y1="92" x2="335" y2="92" stroke="#1d6fd1" stroke-width="2"/>
  <text x="335" y="106" font-size="11" fill="#1d6fd1" text-anchor="end">np.interp: flat</text>
  <path d="M 200 92 C 250 94 290 80 335 45" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <text x="330" y="38" font-size="11" fill="#1f2a44" text-anchor="end">CubicSpline: keeps curving</text>
  <text x="205" y="120" font-size="11" fill="#b4232c">RegularGridInterpolator:</text>
  <text x="205" y="133" font-size="11" fill="#b4232c">raises an error</text>
</svg>
```
:::

::: context memoisation A word with a missing r
Memoisation is not a typo for "memorization". The British researcher Donald Michie coined "memo functions" in a 1968 paper in *Nature*: a function that keeps a memo, a written note, of answers it has already given. The idea is older than the word, since people have always kept tables of hard-won results, from logarithm tables to star positions. Today it is used everywhere, from web servers to compilers to scientific codes.
:::

::: context gain-schedule Gains that change with the flight
A rocket's response to its engine gimbal changes enormously during ascent: its mass falls as propellant burns, its inertia shrinks, and the air pushing on it rises and then falls away. One fixed set of controller gains cannot suit all of that. So designers compute gains at a grid of flight conditions on the ground, often mass or time since launch and dynamic pressure, and the flight software picks or interpolates between them as it flies. That practice is called gain scheduling, and it is a lookup table with control theory behind every entry.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 40 110 L 100 110 L 100 95 L 160 95 L 160 80 L 220 80 L 220 65 L 280 65 L 280 50 L 340 50" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="116" x2="340" y2="44" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="190" y="150" font-size="11" fill="#1f2a44" text-anchor="middle">propellant burned (mass falling) →</text>
  <text x="48" y="30" font-size="11" fill="#1f2a44">gain</text>
  <text x="335" y="40" font-size="11" fill="#1d6fd1" text-anchor="end">one cached value per bin</text>
  <text x="335" y="80" font-size="11" fill="#6c7a93" text-anchor="end">true gain</text>
</svg>
```
:::

::: context lru Which answer gets thrown out
A cache with room for only a few answers has to choose what to forget. "Least recently used" forgets the answer that has gone the longest without being asked for, on the bet that what was needed a moment ago will be needed again soon. Your phone's list of recent apps works the same way. Python's `lru_cache` keeps its entries in order of use, so each hit moves an entry to the front and each new entry, when the cache is full, pushes the oldest one off the back.
:::

::: context hashable What a dictionary needs from a key
A Python dictionary finds a key fast by turning it into a number called its hash and jumping straight to a slot picked by that number. That only works if the key's hash never changes while it sits in the dictionary. Floats, strings and tuples of them cannot be changed, so they are hashable. Lists and NumPy arrays can be changed in place, so Python refuses to hash them rather than risk losing track of a key.
:::

::: context kepler Four hundred years old and still solved by iteration
Johannes Kepler published his laws of planetary motion in 1609. The equation $E - e\sin E = M$ connects time along an orbit to position on it. $M$, the mean anomaly, grows steadily with time. $E$, the eccentric anomaly, is an angle measured from the center of the ellipse. For a circle, $e = 0$ and the two are equal. For any other orbit there is no neat formula for $E$ in terms of $M$, so every orbit propagator that works in these angles solves it by iteration, usually Newton's method, millions of times in a long simulation.
:::

::: context chord-error Where the straight line misses
Straight-line interpolation joins two table points with a chord. A bending curve sags away from its chord, and the gap is biggest near the middle of each interval. The size of that gap is $\frac{\Delta^2}{8}$ times the bend, so a table with half the spacing misses by a quarter as much.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M 50 130 Q 180 -10 310 130" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="50" y1="130" x2="310" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="50" cy="130" r="4" fill="#1f2a44"/>
  <circle cx="310" cy="130" r="4" fill="#1f2a44"/>
  <line x1="180" y1="130" x2="180" y2="60" stroke="#b4232c" stroke-width="2"/>
  <text x="172" y="118" font-size="12" fill="#b4232c" text-anchor="end">largest error</text>
  <text x="180" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">chord (what np.interp returns)</text>
  <text x="80" y="60" font-size="12" fill="#1d6fd1">true curve</text>
  <text x="50" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">a</text>
  <text x="310" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">a + Δ</text>
</svg>
```
:::
