---
id: l05-numpy-arrays
title: "NumPy: arrays, broadcasting and vectorised thinking"
minutes: 22
covers:
  - NumPy arrays, broadcasting, vectorisation, dtypes, float64 semantics
---

A trajectory Monte Carlo draws a hundred thousand launch angles, propagates each, and asks where the 99.87th-percentile landing point falls. Written as a Python `for` loop over samples, that analysis takes minutes; written the way NumPy wants it, it takes a fraction of a second, and the code is shorter. The difference is not cleverness. It is the single idea this lesson teaches: describe the whole computation as arithmetic on arrays, and let compiled code run the loop.

NumPy's `ndarray` is the data structure every scientific Python library shares. SciPy's integrators return arrays, matplotlib plots arrays, pandas columns are arrays underneath. So the habits you form here — thinking in shapes, knowing what broadcasting will do before you run it, knowing which dtype the numbers are stored in — are the habits the rest of the module and the rest of the curriculum rely on.

## The ndarray

An array is a block of numbers, all of the same type, laid out in a contiguous buffer with a *shape* describing how many dimensions it has and how long each is. Build one from a list, or with a constructor:

```python
import numpy as np

a = np.array([1.0, 2.5, 4.0])
print(a.shape, a.ndim, a.size, a.dtype)   # (3,) 1 3 float64

print(np.zeros(3))                # [0. 0. 0.]
print(np.ones((2, 3)))            # [[1. 1. 1.]
                                  #  [1. 1. 1.]]
print(np.arange(0, 10, 2.5))      # [0.  2.5 5.  7.5]   start, stop (excluded), step
print(np.linspace(0, 1, 5))       # [0.   0.25 0.5  0.75 1.  ]   start, stop (included), count
print(np.eye(2))                  # [[1. 0.]
                                  #  [0. 1.]]
```

The shape is a tuple. `(3,)` is a one-dimensional array of three numbers — a vector; `(2, 3)` is two rows of three — a matrix; `(1000, 3)` is a thousand 3-vectors stacked as rows, which is how you will store a thousand positions. `reshape` rearranges the same buffer into a new shape, `ravel` flattens to one dimension, and `.T` transposes.

Indexing follows Python lists, extended to several axes: `M[i, j]` is one element, `M[i]` or `M[i, :]` is row `i`, `M[:, j]` is column `j`. Slices `a[2:5]` and negative indices `a[-1]` work as for lists. A slice of an array is a *view*, not a copy: it shares the buffer with the original, so writing into the slice writes into the original. Call `.copy()` when you need independence.

```python
r = np.array([[7000.0, 0.0, 0.0],
              [0.0, 7000.0, 0.0],
              [0.0, 0.0, 7000.0]])
print(r[1])          # [   0. 7000.    0.]
print(r[:, 0])       # [7000.    0.    0.]
first = r[0]
first[0] = 1.0       # this writes into r as well
print(r[0, 0])       # 1.0
```

Two more indexing forms do the work of loops. A *boolean mask* is an array of `True`/`False` of the same shape, and `a[mask]` selects the elements where it is true; `np.where(cond, x, y)` picks elementwise from two arrays. *Fancy indexing* with an integer array, `a[[0, 2, 5]]`, gathers arbitrary elements.

```python
alt = np.array([120e3, 95e3, 210e3, 60e3])
print(alt > 100e3)            # [ True False  True False]
print(alt[alt > 100e3])       # [120000. 210000.]
print(np.where(alt > 100e3, "space", "air"))   # ['space' 'air' 'space' 'air']
print(np.argmax(alt))         # 2
```

## dtypes and float64

Every array has one *dtype*, the type of every element. The ones you will meet: `float64` (the default for anything with a decimal point), `float32`, `int64` (the default for integer lists), `bool`, and `complex128`. NumPy chooses the dtype from the input and promotes when types mix — an `int64` array plus a float gives `float64`, and true division of integers gives `float64` — but it never widens an array in place. That matters for integers, which have fixed width and *wrap around* silently:

```python
print(np.array([1, 2, 3]).dtype)                 # int64
print(np.array([1, 2, 3]) / 2)                   # [0.5 1.  1.5]
print(np.array([2_147_483_647], dtype=np.int32) + 1)   # [-2147483648]
```

A Python `int` has unlimited size; a NumPy `int32` does not, and $2^{31} - 1 + 1$ becomes $-2^{31}$ with no exception. Store anything that could be large, or that will be divided, as a float, and pass `dtype=float` explicitly when converting input you do not control: `np.asarray(x, dtype=float)`.

`float64` is the IEEE-754 double: 53 significant bits (about 15.95 decimal digits), an 11-bit exponent that spans roughly $10^{-308}$ to $10^{308}$, and a sign. `float32` is the single: 24 significant bits, about 7.2 decimal digits. The gap between adjacent representable numbers — one *unit in the last place*, or ulp — scales with the magnitude of the number. Near $6.4 \times 10^6$, which lies between $2^{22}$ and $2^{23}$, the float32 ulp is $2^{22 - 23} = 0.5$ and the float64 ulp is $2^{22 - 52} \approx 9.3 \times 10^{-10}$:

```python
print(np.float32(6378137.3))                   # 6378137.5
print(np.finfo(np.float32).eps)                # 1.1920929e-07
print(np.finfo(np.float64).eps)                # 2.220446049250313e-16
print(np.spacing(np.float64(6.4e6)))           # 9.313225746154785e-10
```

::: key
float32 vs float64: float32 carries about 7 decimal digits, which is about 0.5 m of resolution on a $6.4 \times 10^6\,\mathrm{m}$ Earth radius. Orbit propagation and covariance work run in float64; float32 shows up only in bandwidth-limited telemetry or GPU work.
:::

A position expressed as an Earth-centred float32 cannot distinguish $6\,378\,137.3\,\mathrm{m}$ from $6\,378\,137.5\,\mathrm{m}$; a velocity integrated in float32 accumulates that half-metre error every step. Leave NumPy's default alone — `np.zeros(n)` is float64 — and convert to `float32` only at the boundary where a telemetry format or a GPU demands it.

### Special values

float64 reserves patterns for $\pm\infty$ and for *NaN*, "not a number". NumPy produces them instead of raising: `np.array([1.0]) / 0` gives `[inf]` with a `RuntimeWarning`, `0/0` gives `nan`, and `np.sqrt(-1.0)` gives `nan`. NaN is contagious — any arithmetic with it yields NaN, and `np.sum` of an array containing one NaN is NaN — and it is the only value not equal to itself: `np.nan == np.nan` is `False`. Test with `np.isnan`, ignore with `np.nanmean` and friends, and use `np.isclose(a, b, rtol, atol)` or `np.allclose` to compare computed floats, never `==`. When a NaN would indicate a bug, `with np.errstate(invalid="raise", divide="raise"):` turns the warnings into exceptions so the traceback points at the line that made it.

## Vectorisation: arithmetic on whole arrays

Arithmetic operators and the functions in `np` — `np.sin`, `np.sqrt`, `np.exp`, `np.abs` and the rest, collectively *ufuncs* — act elementwise on whole arrays, and *reductions* — `np.sum`, `np.mean`, `np.std`, `np.min`, `np.max`, `np.percentile`, `np.cumsum` — collapse them. Both run in compiled C. The circular-speed table from the first lesson becomes one line:

```python
MU = 3.986004418e14
R_EARTH = 6_378_137.0
alt = np.array([200e3, 400e3, 800e3])
v = np.sqrt(MU / (R_EARTH + alt))
print(v)                  # [7784.26174857 7668.55817541 7451.83133349]
print(v.mean(), v.max())  # 7634.883752486317 7784.2617485656265
```

Compare with the loop version, which does the same arithmetic one sample at a time:

```python
def ranges_loop(v0, angles_rad, g=9.80665):
    out = []
    for th in angles_rad:                  # Python-level loop: slow
        out.append(v0**2 * np.sin(2 * th) / g)
    return np.array(out)

def ranges_vec(v0, angles_rad, g=9.80665):
    return v0**2 * np.sin(2 * angles_rad) / g   # one expression: fast
```

Both return the same array. The second is typically 50–200 times faster for $10^5$ samples, and the reason is worth understanding rather than memorising:

::: key
A per-sample Python loop is slow in a 100k-run Monte Carlo because the CPython interpreter pays type dispatch and object overhead on every iteration — each `th` is a boxed Python object, each `*` looks up what multiplication means for that object, each result is allocated. NumPy pushes the loop into compiled C over a contiguous buffer, typically 50–200× faster.
:::

Time it yourself with `time.perf_counter()` around each call, or `%timeit` in a notebook. The rule that falls out: **if you are writing `for` over samples, time steps of a fixed grid, or vector components, stop and look for the array expression.** Loops over *time* in an ODE integrator are different — each step depends on the last — and those are what SciPy's compiled integrators are for.

Reductions take an `axis`. For an `(N, 3)` array of positions, `X.mean(axis=0)` averages down the rows and returns the `(3,)` mean position, while `X.mean(axis=1)` averages across each row's three components — rarely what you want. `np.linalg.norm(X, axis=1)` returns the `(N,)` array of lengths. Omitting `axis` reduces over everything to a scalar.

## Broadcasting

Arithmetic between arrays of *different* shapes follows one rule, and you must be able to apply it in your head:

::: key
The NumPy broadcasting rule: shapes are compared right to left; two dimensions are compatible if they are equal or one of them is 1, and size-1 dimensions are stretched to match. A missing leading dimension counts as 1. (3,1) with (1,5) broadcasts to (3,5).
:::

A scalar is shape `()`, so `2 * a` stretches the 2 across every element. An `(N, 3)` array minus a `(3,)` array compares `3` with `3` — equal — then treats the missing dimension of the `(3,)` as 1 and stretches it to `N`: every row has the same vector subtracted. That is how you mean-centre a cloud of samples in one line, `X - X.mean(axis=0)`.

```python
row = np.arange(3).reshape(3, 1)     # shape (3, 1): [[0], [1], [2]]
col = np.arange(5).reshape(1, 5)     # shape (1, 5): [[0, 1, 2, 3, 4]]
print((row + col).shape)             # (3, 5)
print(row + col)
# [[0 1 2 3 4]
#  [1 2 3 4 5]
#  [2 3 4 5 6]]
```

The stretching is virtual: NumPy does not allocate the `(3, 5)` copies of `row` and `col`, it strides through the originals. To *insert* a size-1 axis, index with `None` (an alias of `np.newaxis`): `sigma[:, None]` turns a `(3,)` into a `(3, 1)`, and `sigma[None, :]` into a `(1, 5)`-style row. Multiplying those two forms is the outer product, which is exactly how a diagonal covariance is assembled from per-axis standard deviations:

```python
sigma = np.array([1.0, 2.0, 3.0])          # 1-sigma per axis
print(sigma[:, None] * sigma[None, :])     # sigma sigma^T, shape (3, 3)
# [[1. 2. 3.]
#  [2. 4. 6.]
#  [3. 6. 9.]]
```

Shapes that cannot be reconciled — `(3,)` with `(4,)`, say — raise `ValueError: operands could not be broadcast together`. That error is your friend. The dangerous case is the one that *does* broadcast when you did not mean it to.

::: warning A `(3,1)` where you meant a `(3,)`
`x = np.array([[1.0], [2.0], [3.0]])` has shape `(3,1)`. Multiply it by a `(3,)` vector `y` and the rule gives `(3,1) × (1,3) → (3,3)`: a matrix, where you expected three numbers, with no error raised. `x.sum()` is then nine terms instead of three, and every downstream statistic is wrong by a factor you will not notice until the plot looks odd. Whenever a function hands you an array, print its `.shape`; flatten a column with `.ravel()` before combining it with vectors; and in tests assert the shape you expect.
:::

## Matrix products: `@` versus `*`

`*` is always elementwise, with broadcasting. Matrix multiplication is the `@` operator:

::: key
`@` performs matrix multiplication (`__matmul__`). For two 1-D operands it contracts them into a scalar dot product; `*` is always elementwise. A `(3,3) @ (3,)` gives a `(3,)`; a `(3,) @ (3,)` gives a scalar.
:::

```python
a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])
print(a * b)                  # [ 4. 10. 18.]  elementwise
print(a @ b)                  # 32.0            dot product
print(np.cross(a, b))         # [-3.  6. -3.]
print(np.linalg.norm(a))      # 3.7416573867739413

R = np.array([[0.0, -1.0, 0.0],
              [1.0,  0.0, 0.0],
              [0.0,  0.0, 1.0]])           # 90 degrees about z
print(R @ np.array([1.0, 0.0, 0.0]))     # [0. 1. 0.]
```

`@` follows the same shape logic as linear algebra: `(m,k) @ (k,n)` gives `(m,n)`, and the inner dimensions must agree. For stacks of matrices — an `(N,3,3)` array of rotation matrices applied to an `(N,3)` array of vectors — `@` broadcasts over the leading dimension, so `np.einsum("nij,nj->ni", R, v)` or `(R @ v[:, :, None])[:, :, 0]` rotates every vector by its own matrix without a loop. `np.linalg` also supplies `solve`, `inv`, `det`, `eig` and `norm`; `np.linalg.solve(A, b)` is always preferred to `np.linalg.inv(A) @ b`, for reasons the linear-algebra module takes up.

## Random numbers for Monte Carlo

Create one generator with a seed and draw from it; never call the old `np.random.seed` global functions. Seeding makes a run reproducible, which is the difference between a certification result and an anecdote.

```python
rng = np.random.default_rng(seed=0)
theta = rng.normal(loc=30.0, scale=2.0, size=100_000)   # degrees; mean, 1-sigma, count
u = rng.uniform(0.0, 1.0, size=5)
```

`rng.normal(mean, sigma, size)` draws the whole sample at once — that is the vectorised idiom — and the result feeds directly into array arithmetic. Statistics come from reductions: `theta.mean()`, `theta.std()`, and `np.percentile(theta, 99.87)` for the value that 99.87 % of samples lie below, which for a normal distribution sits at the mean plus $3\sigma$ (the probability module derives the 0.13 % tail). Use the same generator for every draw in a run so the streams do not accidentally repeat.

::: example Vectorised Monte Carlo range
A projectile fired at $v_0 = 100\,\mathrm{m/s}$ on flat ground travels $R = v_0^2 \sin(2\theta)/g$. Draw $10^5$ launch angles about $30^\circ$ with a $2^\circ$ dispersion and find the statistics of the range, with no loop over samples:

```python
def monte_carlo_range(v0, mean_deg, sigma_deg, n, g=9.80665, seed=0):
    rng = np.random.default_rng(seed)
    theta = np.radians(rng.normal(mean_deg, sigma_deg, size=n))
    return v0**2 * np.sin(2.0 * theta) / g

R = monte_carlo_range(100.0, 30.0, 2.0, 100_000)
print(R.shape, R.dtype)                       # (100000,) float64
print(R.mean(), R.std(), np.percentile(R, 99.87))
```

Two checks that need no random numbers at all. With `sigma_deg=0` every angle is exactly $30^\circ$ and every sample equals $R = 10^4 \times \sin 60^\circ / 9.80665 = 883.10\,\mathrm{m}$; at $45^\circ$ it is $10^4/9.80665 = 1019.72\,\mathrm{m}$. And for a small dispersion the range varies almost linearly with angle, so the sample standard deviation should be close to

$$
\sigma_R \approx \left|\frac{dR}{d\theta}\right|\sigma_\theta = \frac{2 v_0^2 \cos(2\theta)}{g}\,\sigma_\theta = \frac{2 \times 10^4 \times 0.5}{9.80665} \times 0.03491 \approx 35.6\,\mathrm{m}.
$$

If your `R.std()` comes out near $35.6\,\mathrm{m}$, the vectorised expression is doing what the mathematics says. Note that `np.radians` converts degrees to radians for the whole array, and that `rng.normal(..., size=n)` returns the entire sample in one call.
:::

::: example Mean-centring and covariance of a sample cloud
Suppose `X` is an `(N, 3)` array of landing positions in metres. The sample covariance is $\mathbf{P} = \frac{1}{N-1}\sum_i (\mathbf{x}_i - \bar{\mathbf{x}})(\mathbf{x}_i - \bar{\mathbf{x}})^\mathsf{T}$, a $3 \times 3$ matrix. Every step is a broadcast or a matrix product:

```python
rng = np.random.default_rng(1)
X = rng.normal(0.0, [10.0, 20.0, 5.0], size=(1000, 3))   # 1-sigma per axis, broadcast over rows
xbar = X.mean(axis=0)              # shape (3,)
D = X - xbar                       # (1000,3) - (3,) -> (1000,3)
P = D.T @ D / (len(X) - 1)         # (3,1000) @ (1000,3) -> (3,3)
print(P.shape)                     # (3, 3)
print(np.sqrt(np.diag(P)))         # about [10. 20.  5.]
```

The `scale` argument `[10.0, 20.0, 5.0]` broadcasts against `size=(1000, 3)`, giving each column its own dispersion. `D.T @ D` sums the outer products $\mathbf{d}_i\mathbf{d}_i^\mathsf{T}$ over all rows in a single product, and the square roots of the diagonal recover the per-axis standard deviations, to within sampling error of a few per cent for a thousand samples. The same three lines, with `np.linalg.eigh(P)`, give the axes of the dispersion ellipsoid that a landing footprint plot shows.
:::

::: warning Growing an array in a loop
`np.append(a, x)` inside a loop copies the whole array every iteration, so building $10^5$ samples that way is $O(n^2)$ and slower than a plain list. Either compute the whole array at once, or preallocate `out = np.empty(n)` and assign `out[i] = ...`, or collect in a Python list and call `np.array(list)` once at the end.
:::

::: warning Integer arrays that should have been floats
`np.zeros(n, dtype=int)` and then `out[i] = 0.5` stores `0`. `np.array([6378137, 400000])` is `int64`, and while `/` promotes to float, `**` and `*` do not, so `r**3` for an integer array of Earth radii overflows `int64` and returns nonsense. Write `6378137.0`, or pass `dtype=float`.
:::

## Check yourself

::: check
What shape results from each of these, or does it raise? (a) `(4,3) + (3,)`; (b) `(4,3) + (4,)`; (c) `(5,1,3) * (2,1)`; (d) `(1000,3) @ (3,3)`.
:::

::: answer
(a) Right to left: `3` vs `3` equal; the `(3,)` gains a leading 1 which stretches to 4. Result `(4,3)`. (b) `3` vs `4`: neither equal nor 1 — `ValueError`. To subtract a per-row value you need `(4,1)`, i.e. `v[:, None]`. (c) `3` vs `1` → 3; `1` vs `2` → 2; then `5` vs a missing dimension → 5. Result `(5,2,3)`. (d) Matrix product, not broadcasting: inner dimensions `3` and `3` agree, giving `(1000,3)` — every row-vector multiplied by the matrix from the right, which is how you apply $\mathbf{R}^\mathsf{T}$ to a stack of vectors.
:::

::: check
`np.arange(0.0, 1.0, 0.1)` sometimes has 10 elements and sometimes 11 depending on the endpoint arithmetic. Which constructor should you use for a plotting grid, and why?
:::

::: answer
`np.linspace(start, stop, num)`. Its `num` is an integer you choose, the endpoints are exactly `start` and `stop`, and the spacing is derived, so the length never depends on floating-point rounding of `stop/step`. `arange` with a float step computes the count as `ceil((stop - start)/step)`, and when the division lands a hair above an integer you get an extra element. Use `arange` for integer steps and `linspace` for real grids.
:::

::: check
A function returns velocities as a `(1000,3)` float64 array `V`. Write one expression for the array of speeds, and one for the index of the fastest sample.
:::

::: answer
`speed = np.linalg.norm(V, axis=1)` (or `np.sqrt((V**2).sum(axis=1))`) gives shape `(1000,)`; `i = np.argmax(speed)` gives the index, and `V[i]` the corresponding velocity vector. `axis=1` reduces across each row's three components; `axis=0` would give three column norms, and no `axis` would give a single number.
:::

::: check
Why does `np.array([0.1, 0.2]).sum() == 0.3` evaluate to `False`, and what should a test assert instead?
:::

::: answer
Neither 0.1 nor 0.2 nor 0.3 is representable exactly in binary, and the rounded sum `0.30000000000000004` differs from the rounded literal `0.3` by one ulp. Assert closeness: `np.isclose(a.sum(), 0.3)` or `np.testing.assert_allclose(a.sum(), 0.3, rtol=1e-12)`. The floating-point lesson explains where the discrepancy comes from and when it grows into something that matters.
:::

::: check
A telemetry decoder hands you positions as `float32` arrays in Earth-centred metres. A colleague proposes doing the orbit determination in float32 "since the data is float32 anyway". What is wrong with the argument?
:::

::: answer
The input resolution and the working precision are different things. float32 positions near $6.4 \times 10^6\,\mathrm{m}$ are quantised to $0.5\,\mathrm{m}$, which is a property of the measurement you cannot undo. But the estimator forms differences, sums of squares and matrix inverses whose intermediate values would lose further digits at every operation in float32 — a covariance update can subtract two nearly equal $10^{13}$-sized numbers — while float64 keeps those errors at the $10^{-16}$ relative level. Convert with `np.asarray(x, dtype=np.float64)` on input and work in float64 throughout; float32 is for storage and transmission.
:::

## Summary

| Idea | NumPy | Notes |
| --- | --- | --- |
| Create | `np.array(list)`, `np.zeros(n)`, `np.ones(shape)`, `np.arange(a, b, step)`, `np.linspace(a, b, num)`, `np.eye(n)` | default dtype float64 |
| Inspect | `.shape`, `.ndim`, `.size`, `.dtype` | print `.shape` when in doubt |
| Index | `M[i, j]`, `M[:, j]`, `a[mask]`, `a[[0, 2]]`, `np.where(c, x, y)` | slices are views; `.copy()` for independence |
| dtypes | `float64` (53 bits, about 16 digits), `float32` (24 bits, about 7 digits), `int64` wraps | `np.finfo(np.float64).eps` $= 2.22 \times 10^{-16}$ |
| float32 vs float64 | float32 ulp at Earth radius $= 0.5\,\mathrm{m}$; float64 ulp $\approx 9.3 \times 10^{-10}\,\mathrm{m}$ | GNC works in float64 |
| NaN / inf | `np.isnan`, `np.nanmean`, `np.isclose`, `np.errstate(invalid="raise")` | `nan != nan` |
| Vectorise | ufuncs `np.sin(a)`, reductions `a.mean(axis=0)`, `np.percentile(a, 99.87)` | 50–200× over a Python loop |
| Broadcasting | compare shapes right to left; equal or 1; stretch 1s | `(3,1)` with `(1,5)` → `(3,5)` |
| New axis | `a[:, None]`, `a[None, :]` | outer product `s[:, None] * s[None, :]` |
| Products | `*` elementwise; `a @ b` matrix / dot; `np.cross`, `np.linalg.norm(V, axis=1)` | `(3,) @ (3,)` is a scalar |
| Random | `rng = np.random.default_rng(seed)`; `rng.normal(mean, sigma, size)` | one generator per run |

The next lesson looks inside `float64` — why `0.1 + 0.2` misses `0.3`, what machine epsilon really bounds, and how a subtraction can throw away every digit you have.
