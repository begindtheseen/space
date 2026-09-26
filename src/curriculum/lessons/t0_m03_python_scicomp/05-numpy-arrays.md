---
id: l05-numpy-arrays
title: "NumPy: arrays, broadcasting and vectorised thinking"
minutes: 23
covers:
  - NumPy arrays, broadcasting, vectorisation, dtypes, float64 semantics
---

Imagine a cashier who walks to the back room to look up the price of every single item. Now imagine a conveyor belt that scans the whole cart in one pass. Same groceries, same prices, very different wait. That is the difference between a Python `for` loop and NumPy.

Here is where it matters. A trajectory **[[Monte Carlo|monte-carlo]]** — a study that runs the same flight many times with slightly different random inputs — draws a hundred thousand launch angles, flies each one, and asks where the worst 0.13 % of landing points fall. Written as a Python loop over samples, that takes minutes. Written the way NumPy wants it, it takes a fraction of a second, and the code is shorter. The trick is one idea: describe the whole calculation as arithmetic on arrays, and let fast compiled code run the loop.

NumPy's **array** is the data structure every scientific Python library shares: SciPy returns arrays, matplotlib plots them, pandas tables are built on them. The habits you build here — thinking in shapes, predicting broadcasting, knowing how numbers are stored — carry through the whole course.

## The ndarray

Picture an egg carton: every cup holds the same kind of thing, in fixed rows and columns. A NumPy array — its full name is **ndarray**, "n-dimensional array" — is a carton of numbers. All the numbers have the same type. They sit side by side in one unbroken block of memory. And the array carries a **shape**, which says how many dimensions it has and how long each one is.

Build one from a list, or with a ready-made constructor:

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

The shape is a **tuple** — a fixed list of numbers in round brackets:

- `(3,)` is one row of three numbers: a **vector**. (The comma marks a one-item tuple.)
- `(2, 3)` is two rows of three: a **matrix**.
- `(1000, 3)` is a thousand 3-vectors stacked as rows. That is how you will store a thousand positions.

`ndim` is the number of dimensions and `size` the total count of numbers. `reshape` rearranges the same numbers into a new shape, `ravel` flattens them into one line, and `.T` **transposes** — swaps rows and columns.

### Picking out elements

Indexing works like Python lists, with a comma between the dimensions. `M[i, j]` is one element (row `i`, column `j`, counting from $0$). `M[i]` or `M[i, :]` is row `i`. `M[:, j]` is column `j` — the colon means "all of them". Slices like `a[2:5]` and negative indices like `a[-1]` (the last one) work as for lists.

A slice of an array is a **[[view|view-vs-copy]]**, not a copy. It looks at the same memory as the original, so writing into the slice writes into the original. Call `.copy()` when you need an independent array.

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

Two more kinds of indexing do the work of loops.

A **boolean mask** is an array of `True`/`False` values with the same shape. `a[mask]` keeps only the elements where the mask is `True`. `np.where(cond, x, y)` picks, element by element, from `x` where `cond` is true and from `y` where it is false. **Fancy indexing** with a list of positions, `a[[0, 2, 5]]`, gathers any elements you name.

```python
alt = np.array([120e3, 95e3, 210e3, 60e3])
print(alt > 100e3)            # [ True False  True False]
print(alt[alt > 100e3])       # [120000. 210000.]
print(np.where(alt > 100e3, "space", "air"))   # ['space' 'air' 'space' 'air']
print(np.argmax(alt))         # 2
```

`np.argmax` gives the *position* of the largest value — here index $2$, the $210\,\mathrm{km}$ altitude.

## dtypes and float64

Every array has one **dtype** (data type): the kind of number in every cup. The ones you will meet:

- `float64` — the default for anything with a decimal point;
- `float32` — a smaller, less precise decimal;
- `int64` — the default for lists of whole numbers;
- `bool` — `True`/`False`;
- `complex128` — complex numbers.

NumPy picks the dtype from your input and **promotes** when types mix. An `int64` array plus a float gives `float64`, and dividing integers with `/` gives `float64`. But NumPy never widens an existing array in place.

That matters for integers. A NumPy integer has a fixed number of binary digits, and when it runs out it **[[wraps around|int-wrap]]** silently, like a car's odometer rolling past 999999 to 000000:

```python
print(np.array([1, 2, 3]).dtype)                 # int64
print(np.array([1, 2, 3]) / 2)                   # [0.5 1.  1.5]
print(np.array([2_147_483_647], dtype=np.int32) + 1)   # [-2147483648]
```

A plain Python `int` can grow as big as it likes. A NumPy `int32` cannot: $2^{31} - 1 + 1$ becomes $-2^{31}$, with no error. So store anything that could get large, or that will be divided, as a float. When you convert input you do not control, say so explicitly: `np.asarray(x, dtype=float)`.

### How fine is the ruler?

A decimal in a computer is like a reading on a ruler. There are only so many tick marks, and every value snaps to the nearest one.

`float64` is the IEEE-754 **double**. It stores a sign, 53 **significant bits** (binary digits of the number itself, worth about 15.95 decimal digits), and an 11-bit exponent that covers about $10^{-308}$ to $10^{308}$. `float32` is the **single**: 24 significant bits, about 7.2 decimal digits.

The gap between two neighboring tick marks is called one **[[unit in the last place|ulp-ruler]]**, or **ulp**. It grows with the size of the number, because the same number of digits must stretch over a bigger value. Near $6.4 \times 10^6$ — Earth's radius in metres, which lies between $2^{22}$ and $2^{23}$ — the float32 ulp is $2^{22 - 23} = 0.5$ and the float64 ulp is $2^{22 - 52} \approx 9.3 \times 10^{-10}$:

```python
print(float(np.float32(6378137.3)))            # 6378137.5
print(np.finfo(np.float32).eps)                # 1.1920929e-07
print(np.finfo(np.float64).eps)                # 2.220446049250313e-16
print(np.spacing(np.float64(6.4e6)))           # 9.313225746154785e-10
```

`np.spacing(x)` gives the ulp at `x`, and `np.finfo(...).eps` gives it at $1$.

::: key
float32 vs float64: float32 carries about 7 decimal digits, which is about 0.5 m of resolution on a $6.4 \times 10^6\,\mathrm{m}$ Earth radius. Orbit propagation and covariance work run in float64; float32 shows up only in bandwidth-limited telemetry or GPU work.
:::

An Earth-centred position stored in float32 cannot tell $6\,378\,137.3\,\mathrm{m}$ from $6\,378\,137.5\,\mathrm{m}$. A position advanced step by step in float32 can pick up that half-metre error at every step. So leave NumPy's default alone — `np.zeros(n)` is float64 — and convert to `float32` only at the edge where a telemetry format or a graphics card demands it.

### Special values

float64 keeps a few special patterns: $+\infty$, $-\infty$, and **NaN**, "not a number". NumPy produces them instead of stopping with an error. `np.array([1.0]) / 0` gives `[inf]` with a `RuntimeWarning`; `0/0` gives `nan`; `np.sqrt(-1.0)` gives `nan`.

NaN spreads like a spilled drink. Any arithmetic with it gives NaN, so the `np.sum` of an array holding one NaN is NaN. It is also the only value **[[not equal to itself|nan-not-equal]]**: `np.nan == np.nan` is `False`.

The tools:

- test for it with `np.isnan`;
- skip over it with `np.nanmean` and its relatives;
- compare computed floats with `np.isclose(a, b, rtol, atol)` or `np.allclose`, never `==`;
- when a NaN would mean a bug, wrap the code in `with np.errstate(invalid="raise", divide="raise"):`. The warnings become errors, and the error points at the line that made the NaN.

## Vectorisation: arithmetic on whole arrays

Arithmetic signs and the functions in `np` — `np.sin`, `np.sqrt`, `np.exp`, `np.abs` and the rest, called **ufuncs** ("universal functions") — act on every element of an array at once. **Reductions** — `np.sum`, `np.mean`, `np.std`, `np.min`, `np.max`, `np.percentile`, `np.cumsum` — boil an array down. Both run in compiled C. Writing code this way is called **vectorising** it.

The circular-orbit speed $v = \sqrt{\mu/r}$ at three altitudes becomes one line. Here $\mu$ ("mu") is Earth's gravity constant and $r$ the distance from Earth's center:

```python
MU = 3.986004418e14
R_EARTH = 6_378_137.0
alt = np.array([200e3, 400e3, 800e3])
v = np.sqrt(MU / (R_EARTH + alt))
print(v)                  # [7784.26174857 7668.55817541 7451.83133349]
print(v.mean(), v.max())  # 7634.883752486317 7784.2617485656265
```

Sanity check: about $7.7\,\mathrm{km/s}$ at $400\,\mathrm{km}$, and slower higher up, as orbits should be.

Now compare a loop with the vectorised version. Both compute the flat-ground range $R = v_0^2\sin(2\theta)/g$ for many launch angles:

```python
def ranges_loop(v0, angles_rad, g=9.80665):
    out = []
    for th in angles_rad:                  # Python-level loop: slow
        out.append(v0**2 * np.sin(2 * th) / g)
    return np.array(out)

def ranges_vec(v0, angles_rad, g=9.80665):
    return v0**2 * np.sin(2 * angles_rad) / g   # one expression: fast
```

Both return the same array. The second is many times faster for $10^5$ samples, and the reason is worth understanding, not memorising:

::: key
A per-sample Python loop is slow in a 100k-run Monte Carlo because the CPython interpreter pays type dispatch and object overhead on every iteration — each `th` is a **[[boxed|boxed-objects]]** Python object, each `*` looks up what multiplication means for that object, each result is allocated. NumPy pushes the loop into compiled C over a contiguous buffer, typically 50–200× faster.
:::

**CPython** is the standard Python program that reads and runs your code line by line — the **interpreter**. **Type dispatch** is the step where it asks "what kind of thing is this, and what does `*` mean for it?" In the loop it asks that question a hundred thousand times. NumPy asks once.

Time it yourself with `time.perf_counter()`. The rule: **if you are writing `for` over samples, over the points of a fixed grid, or over vector components, stop and look for the array expression.** Loops over *time* in a simulation are different, because each step needs the one before. Those are what SciPy's compiled solvers are for.

### Reducing along an axis

Reductions take an `axis`. For an `(N, 3)` array `X` of positions:

- `X.mean(axis=0)` averages *down the rows* and returns the `(3,)` mean position;
- `X.mean(axis=1)` averages *across* each row's three parts — rarely what you want;
- `np.linalg.norm(X, axis=1)` returns the `(N,)` array of lengths;
- no `axis` at all reduces everything to one number.

## Broadcasting

Think of a times table. Write $0, 1, 2$ down the left side and $0, 1, 2, 3, 4$ across the top. Every cell combines its row label with its column label. You never wrote the row labels out five times; each one was "stretched" across its row.

That is **broadcasting**: the rule for arithmetic between arrays of *different* shapes. You must be able to apply it in your head.

::: key
The NumPy broadcasting rule: shapes are compared right to left; two dimensions are compatible if they are equal or one of them is 1, and size-1 dimensions are stretched to match. A missing leading dimension counts as 1. (3,1) with (1,5) broadcasts to (3,5).
:::

Walk through three cases:

- **A number and an array.** A single number has shape `()`, so `2 * a` stretches the 2 across every element.
- **`(N, 3)` minus `(3,)`.** Compare from the right: `3` with `3`, equal. The `(3,)` has no second dimension, so it counts as 1 and stretches to `N`. Every row gets the same vector subtracted. That is how you centre a cloud of samples on its mean in one line: `X - X.mean(axis=0)`.
- **`(3, 1)` plus `(1, 5)`** — the [[times table|broadcast-grid]]:

```python
row = np.arange(3).reshape(3, 1)     # shape (3, 1): [[0], [1], [2]]
col = np.arange(5).reshape(1, 5)     # shape (1, 5): [[0, 1, 2, 3, 4]]
print((row + col).shape)             # (3, 5)
print(row + col)
# [[0 1 2 3 4]
#  [1 2 3 4 5]
#  [2 3 4 5 6]]
```

The stretching is pretend: NumPy re-reads the originals instead of building bigger copies.

To *add* a size-1 dimension, index with `None` (another name for `np.newaxis`). `sigma[:, None]` turns a `(3,)` into a `(3, 1)` column; `sigma[None, :]` turns it into a `(1, 3)` row. Multiplying the two gives every product of pairs — the **outer product**. That is how a grid of spreads for a **[[covariance|covariance-word]]** is built from the per-axis standard deviations:

```python
sigma = np.array([1.0, 2.0, 3.0])          # 1-sigma per axis
print(sigma[:, None] * sigma[None, :])     # sigma sigma^T, shape (3, 3)
# [[1. 2. 3.]
#  [2. 4. 6.]
#  [3. 6. 9.]]
```

Shapes that cannot be matched — `(3,)` with `(4,)`, say — raise `ValueError: operands could not be broadcast together`. That error is your friend. The dangerous case is the one that *does* broadcast when you did not mean it to.

::: warning A `(3,1)` where you meant a `(3,)`
`x = np.array([[1.0], [2.0], [3.0]])` has shape `(3,1)`. Multiply it by a `(3,)` vector `y` and the rule gives `(3,1) × (1,3) → (3,3)`: a matrix where you expected three numbers, and no error. With `y = [1, 2, 3]`, `(x * y).sum()` adds nine terms and gives $36$ instead of the $14$ you wanted. Every statistic after that is wrong, and you will not notice until a plot looks odd. Whenever a function hands you an array, print its `.shape`. Flatten a column with `.ravel()` before combining it with vectors. In tests, assert the shape you expect.
:::

## Matrix products: `@` versus `*`

`*` always multiplies element by element, with broadcasting. Matrix multiplication — rows times columns, as in the linear algebra module — is the `@` operator:

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

These are the same numbers as the `Vec3` example in the last lesson: dot product $32$, cross product $(-3, 6, -3)$, and a quarter turn about $z$ sending $x$ to $y$.

`@` follows the shape rule of linear algebra: `(m,k) @ (k,n)` gives `(m,n)`, and the inner sizes must match. For a stack of matrices — an `(N,3,3)` array of rotation matrices applied to an `(N,3)` array of vectors — `@` broadcasts over the first dimension. So `np.einsum("nij,nj->ni", R, v)` or `(R @ v[:, :, None])[:, :, 0]` turns every vector by its own matrix with no loop.

`np.linalg` also supplies `solve`, `inv`, `det`, `eig` and `norm`. Always prefer `np.linalg.solve(A, b)` to `np.linalg.inv(A) @ b`, for reasons the linear algebra module takes up.

## Random numbers for Monte Carlo

Make one random number generator with a **[[seed|seed-word]]** — a starting number — and draw everything from it. Do not use the old global `np.random.seed` functions. The seed makes a run repeatable: the same seed gives the same "random" numbers every time. That is the difference between a certification result and an anecdote.

```python
rng = np.random.default_rng(seed=0)
theta = rng.normal(loc=30.0, scale=2.0, size=100_000)   # degrees; mean, 1-sigma, count
u = rng.uniform(0.0, 1.0, size=5)
```

`rng.normal(mean, sigma, size)` draws the whole sample from a **normal distribution** (the bell curve) in one call — the vectorised way. Here $\sigma$ ("sigma") is the **standard deviation**, the typical spread. Statistics come from reductions: `theta.mean()`, `theta.std()`, and `np.percentile(theta, 99.87)`, the value that 99.87 % of samples lie below. For a normal distribution that sits at the mean plus $3\sigma$ — the **[[three-sigma|three-sigma]]** point (the probability module derives the 0.13 % tail). Use the same generator for every draw in a run, so no stream of numbers accidentally repeats.

::: example Vectorised Monte Carlo range
A ball fired at $v_0 = 100\,\mathrm{m/s}$ on flat ground travels $R = v_0^2 \sin(2\theta)/g$. Draw $10^5$ launch angles around $30^\circ$ with a $2^\circ$ spread, and get the statistics of the range with no loop over samples:

```python
def monte_carlo_range(v0, mean_deg, sigma_deg, n, g=9.80665, seed=0):
    rng = np.random.default_rng(seed)
    theta = np.radians(rng.normal(mean_deg, sigma_deg, size=n))
    return v0**2 * np.sin(2.0 * theta) / g

R = monte_carlo_range(100.0, 30.0, 2.0, 100_000)
print(R.shape, R.dtype)                       # (100000,) float64
print(R.mean(), R.std(), np.percentile(R, 99.87))
```

`np.radians` converts the whole array from degrees to radians at once.

**Check 1: no spread.** With `sigma_deg=0`, every angle is exactly $30^\circ$, so every sample equals

$$
R = \frac{10^4 \times \sin 60^\circ}{9.80665} = \frac{8660.3}{9.80665} = 883.10\,\mathrm{m}.
$$

At $45^\circ$, where $\sin 90^\circ = 1$, it is $10^4/9.80665 = 1019.72\,\mathrm{m}$ — the longest possible range.

**Check 2: the spread.** For a small spread, the range changes almost in a straight line with the angle. So its standard deviation should be the slope times the angle's standard deviation. The slope of $R$ is $dR/d\theta = 2 v_0^2 \cos(2\theta)/g$, and $2^\circ$ is $0.03491\,\mathrm{rad}$:

$$
\sigma_R \approx \left|\frac{dR}{d\theta}\right|\sigma_\theta = \frac{2 \times 10^4 \times \cos 60^\circ}{9.80665} \times 0.03491 = \frac{2 \times 10^4 \times 0.5}{9.80665} \times 0.03491 \approx 35.6\,\mathrm{m}.
$$

If your `R.std()` comes out near $35.6\,\mathrm{m}$ (this seed gives $35.66$), the vectorised line is doing what the mathematics says.
:::

::: example Centring and covariance of a sample cloud
Suppose `X` is an `(N, 3)` array of landing positions in metres. The **sample covariance** measures how the cloud spreads along and between the axes:

$$
\mathbf{P} = \frac{1}{N-1}\sum_i (\mathbf{x}_i - \bar{\mathbf{x}})(\mathbf{x}_i - \bar{\mathbf{x}})^\mathsf{T}
$$

Here $\bar{\mathbf{x}}$ ("x bar") is the mean position, $\sum_i$ adds over every sample, and the result is a $3 \times 3$ matrix. Every step is a broadcast or a matrix product:

```python
rng = np.random.default_rng(1)
X = rng.normal(0.0, [10.0, 20.0, 5.0], size=(1000, 3))   # 1-sigma per axis, broadcast over rows
xbar = X.mean(axis=0)              # shape (3,)
D = X - xbar                       # (1000,3) - (3,) -> (1000,3)
P = D.T @ D / (len(X) - 1)         # (3,1000) @ (1000,3) -> (3,3)
print(P.shape)                     # (3, 3)
print(np.sqrt(np.diag(P)))         # about [10. 20.  5.]
```

Step by step:

1. The spread list `[10.0, 20.0, 5.0]` has shape `(3,)`. It broadcasts against `size=(1000, 3)`, so each column gets its own spread.
2. `X - xbar` subtracts the mean from every row: `(1000,3) - (3,)`.
3. `D.T @ D` adds up the outer products $\mathbf{d}_i\mathbf{d}_i^\mathsf{T}$ over all 1000 rows in one product.
4. The square roots of the diagonal give back the per-axis spreads — about $10$, $20$ and $5\,\mathrm{m}$, within a few percent for a thousand samples.

Add `np.linalg.eigh(P)` and the same three lines give the axes of the **[[dispersion ellipse|footprint]]** that a landing-footprint plot shows.
:::

::: warning Growing an array in a loop
`np.append(a, x)` inside a loop copies the whole array every time. Building $10^5$ samples that way takes time that grows like $n^2$ — slower than a plain list. Instead, compute the whole array at once; or make an empty one first with `out = np.empty(n)` and fill it with `out[i] = ...`; or collect in a Python list and call `np.array(list)` once at the end.
:::

::: warning Integer arrays that should have been floats
`np.zeros(n, dtype=int)` followed by `out[i] = 0.5` stores `0`. `np.array([6378137, 400000])` is `int64`. Division with `/` promotes to float, but `**` and `*` do not, so `r**3` on an integer array of Earth radii overflows `int64` and returns nonsense. Write `6378137.0`, or pass `dtype=float`.
:::

## Check yourself

::: check
What shape comes out of each of these, or does it raise an error? (a) `(4,3) + (3,)`; (b) `(4,3) + (4,)`; (c) `(5,1,3) * (2,1)`; (d) `(1000,3) @ (3,3)`.
:::

::: answer
(a) Right to left: `3` with `3`, equal. The `(3,)` gets a leading 1, which stretches to 4. Result `(4,3)`.

(b) `3` with `4`: neither equal nor 1, so `ValueError`. To subtract one value per row you need `(4,1)`, that is `v[:, None]`.

(c) `3` with `1` gives 3; `1` with `2` gives 2; then `5` with a missing dimension gives 5. Result `(5,2,3)`.

(d) This is a matrix product, not broadcasting. The inner sizes `3` and `3` match, giving `(1000,3)`. Each row vector is multiplied by the matrix from the right, which is how you apply $\mathbf{R}^\mathsf{T}$ to a stack of vectors.
:::

::: check
`np.arange(1.0, 1.3, 0.1)` returns four numbers, `[1.  1.1 1.2 1.3]` — it includes the stop value it was told to leave out. Why, and which constructor should you use for a plotting grid?
:::

::: answer
`arange` with a decimal step works out the count as `ceil((stop - start)/step)` — "round up". In float64, $(1.3 - 1.0)/0.1$ comes out as $3.0000000000000004$, a hair above 3, so it rounds up to 4 and you get an extra point.

Use `np.linspace(start, stop, num)`. You choose the whole number `num`, the ends are exactly `start` and `stop`, and the spacing is worked out from them. The length can never depend on rounding. Use `arange` for whole-number steps and `linspace` for decimal grids.
:::

::: check
A function returns velocities as a `(1000,3)` float64 array `V`. Write one expression for the array of speeds, and one for the index of the fastest sample.
:::

::: answer
`speed = np.linalg.norm(V, axis=1)` (or `np.sqrt((V**2).sum(axis=1))`) gives shape `(1000,)`. Then `i = np.argmax(speed)` gives the index, and `V[i]` the matching velocity vector. `axis=1` reduces across each row's three parts. `axis=0` would give three column lengths, and no `axis` would give a single number.
:::

::: check
Why does `np.array([0.1, 0.2]).sum() == 0.3` come out `False`, and what should a test assert instead?
:::

::: answer
None of 0.1, 0.2 or 0.3 can be stored exactly in binary. The rounded sum, `0.30000000000000004`, is one ulp away from the rounded `0.3`. Assert closeness instead: `np.isclose(a.sum(), 0.3)` or `np.testing.assert_allclose(a.sum(), 0.3, rtol=1e-12)`. The floating-point lesson explains where the gap comes from and when it grows into something that matters.
:::

::: check
A telemetry decoder hands you positions as `float32` arrays in Earth-centred metres. A colleague proposes doing the orbit determination in float32 "since the data is float32 anyway". What is wrong with that argument?
:::

::: answer
How finely the data was measured and how precisely you calculate are different things. Float32 positions near $6.4 \times 10^6\,\mathrm{m}$ are snapped to $0.5\,\mathrm{m}$ steps. That is a property of the measurement, and you cannot undo it.

But the estimator then forms differences, sums of squares and matrix inverses. In float32 each of those operations would lose more digits — a covariance update can subtract two nearly equal numbers of size $10^{13}$. In float64 those errors stay at the $10^{-16}$ relative level. Convert on input with `np.asarray(x, dtype=np.float64)` and work in float64 throughout. Float32 is for storage and sending.
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

The next lesson looks inside `float64`: why `0.1 + 0.2` misses `0.3`, what machine epsilon really measures, and how one subtraction can throw away every digit you have.

::: context monte-carlo Named after a casino
A Monte Carlo study answers "what are the odds?" by brute force: roll the dice thousands of times and count. The method was worked out at Los Alamos in the late 1940s by Stanislaw Ulam and John von Neumann, and their colleague Nicholas Metropolis named it after the Monte Carlo casino in Monaco. Launch teams use it to certify a trajectory: every uncertain input — engine thrust, wind, mass, sensor errors — is drawn at random for each run, and the spread of the results shows how bad things can plausibly get.
:::

::: context view-vs-copy Two windows onto one room
A view is a second window looking into the same room. Move the furniture through one window and the other window sees it moved. `first = r[0]` opens a new window onto row 0 of `r`; it does not build a new room. NumPy does this on purpose, because copying a large array for every slice would waste time and memory. When you really want a separate room, say so with `.copy()`. You can check with `np.shares_memory(a, b)`.
:::

::: context int-wrap The odometer problem
An `int32` has 32 binary digits, one of them used for the sign, so its largest value is $2^{31} - 1 = 2\,147\,483\,647$. Add one and the bits roll over, like an odometer, to the most negative value, $-2\,147\,483\,648$. A famous example is waiting in the calendar: many older computers count time as signed 32-bit seconds since 1 January 1970, and that count runs out at 03:14:07 UTC on 19 January 2038. `int64` pushes the limit to about $9.2 \times 10^{18}$, but it still has one.
:::

::: context ulp-ruler Snapping to the nearest tick
Near Earth's radius, float32 has a tick mark every half metre. Any value in between snaps to the nearest tick, so $6\,378\,137.3$ is stored as $6\,378\,137.5$. Float64 has ticks about a billionth of a metre apart at the same size.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="25" y1="70" x2="335" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="40" y1="60" x2="40" y2="80"/><line x1="95" y1="60" x2="95" y2="80"/><line x1="150" y1="60" x2="150" y2="80"/>
    <line x1="205" y1="60" x2="205" y2="80"/><line x1="260" y1="60" x2="260" y2="80"/><line x1="315" y1="60" x2="315" y2="80"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="98">…36.5</text><text x="95" y="98">…37.0</text><text x="150" y="98">…37.5</text>
    <text x="205" y="98">…38.0</text><text x="260" y="98">…38.5</text><text x="315" y="98">…39.0</text>
  </g>
  <circle cx="128" cy="70" r="5" fill="#b4232c"/>
  <text x="120" y="40" font-size="12" text-anchor="middle" fill="#b4232c">true 6 378 137.3</text>
  <path d="M132,62 C136,52 144,52 148,62" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="150,66 144,60 152,58" fill="#b4232c"/>
  <circle cx="150" cy="70" r="4" fill="#1d6fd1"/>
  <text x="180" y="122" font-size="12" text-anchor="middle" fill="#1d6fd1">float32 ticks every 0.5 m: stored as 6 378 137.5</text>
</svg>
```
:::

::: context nan-not-equal Why NaN is not equal to itself
NaN means "this calculation had no sensible answer". Two NaNs could come from completely different failures — one from $0/0$, one from $\sqrt{-1}$ — so the floating-point standard, IEEE 754, says a NaN compares unequal to everything, itself included. A handy result: `x != x` is `True` only when `x` is NaN. Use `np.isnan(x)` in real code, because it says what you mean.
:::

::: context boxed-objects What a boxed number is
In a NumPy float64 array, each number is 8 bytes sitting right next to its neighbors, nothing else. A plain Python float is a whole object — a small box holding the value plus a label saying "I am a float" and a count of who is using it. On a typical 64-bit computer that box takes 24 bytes. A loop has to open each box, read its label, decide what `*` means, and build a new box for the answer. Compiled C running over the array skips all of that.
:::

::: context broadcast-grid Broadcasting as a times table
The `(3, 1)` column and the `(1, 5)` row are each stretched along their size-1 dimension until both are `(3, 5)`. Then they are added cell by cell.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="13" text-anchor="middle">
    <text x="122" y="36" fill="#1d6fd1">0</text><text x="166" y="36" fill="#1d6fd1">1</text><text x="210" y="36" fill="#1d6fd1">2</text><text x="254" y="36" fill="#1d6fd1">3</text><text x="298" y="36" fill="#1d6fd1">4</text>
    <text x="80" y="70" fill="#b4232c">0</text><text x="80" y="100" fill="#b4232c">1</text><text x="80" y="130" fill="#b4232c">2</text>
  </g>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.2">
    <rect x="100" y="50" width="220" height="90"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="144" y1="50" x2="144" y2="140"/><line x1="188" y1="50" x2="188" y2="140"/><line x1="232" y1="50" x2="232" y2="140"/><line x1="276" y1="50" x2="276" y2="140"/>
    <line x1="100" y1="80" x2="320" y2="80"/><line x1="100" y1="110" x2="320" y2="110"/>
  </g>
  <g font-size="13" text-anchor="middle" fill="#1f2a44">
    <text x="122" y="70">0</text><text x="166" y="70">1</text><text x="210" y="70">2</text><text x="254" y="70">3</text><text x="298" y="70">4</text>
    <text x="122" y="100">1</text><text x="166" y="100">2</text><text x="210" y="100">3</text><text x="254" y="100">4</text><text x="298" y="100">5</text>
    <text x="122" y="130">2</text><text x="166" y="130">3</text><text x="210" y="130">4</text><text x="254" y="130">5</text><text x="298" y="130">6</text>
  </g>
  <text x="210" y="16" font-size="11" text-anchor="middle" fill="#1d6fd1">col, shape (1, 5)</text>
  <text x="40" y="100" font-size="11" text-anchor="middle" fill="#b4232c">row,</text>
  <text x="40" y="114" font-size="11" text-anchor="middle" fill="#b4232c">(3, 1)</text>
  <text x="210" y="162" font-size="12" text-anchor="middle" fill="#1f2a44">row + col has shape (3, 5)</text>
</svg>
```
:::

::: context covariance-word What a covariance matrix holds
A **covariance matrix** $\mathbf{P}$ describes a cloud of uncertainty. Its diagonal holds each axis's **variance** — the standard deviation squared, $\sigma^2$. The off-diagonal entries say how two axes move together: positive if a sample high in $x$ tends to be high in $y$ too, zero if they are unrelated. The outer product $\boldsymbol{\sigma}\boldsymbol{\sigma}^\mathsf{T}$ in this lesson gives the grid you would get if all axes moved together perfectly. A navigation filter carries a matrix like $\mathbf{P}$ for its whole state, updating it many times a second.
:::

::: context seed-word Random numbers that are not random
A computer's "random" numbers come from a formula that turns one number into the next — a **pseudo-random** sequence. The seed is where the formula starts. Same seed, same sequence, every time; that is what lets a colleague rerun your Monte Carlo and get exactly your answer. `np.random.default_rng` uses a modern formula called PCG64. Change the seed to get a fresh, independent-looking sample.
:::

::: context three-sigma The three-sigma point
For a bell curve, about 99.87 % of samples fall below the mean plus three standard deviations, leaving about 0.13 % — roughly 1 in 741 — above it. Engineers often size margins to cover this "$3\sigma$" case.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="25" y1="150" x2="335" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon fill="#b4232c" points="292.5,150 292.5,148.8 296.2,149.1 300.0,149.3 303.8,149.5 307.5,149.7 311.2,149.8 315.0,149.8 318.8,149.9 322.5,149.9 326.2,149.9 330.0,150.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30.0,150.0 33.8,149.9 37.5,149.9 41.2,149.9 45.0,149.8 48.8,149.8 52.5,149.7 56.3,149.5 60.0,149.3 63.8,149.1 67.5,148.8 71.2,148.4 75.0,147.8 78.8,147.1 82.5,146.3 86.2,145.2 90.0,143.8 93.8,142.2 97.5,140.2 101.3,137.9 105.0,135.1 108.8,131.9 112.5,128.2 116.3,124.1 120.0,119.4 123.8,114.3 127.5,108.7 131.2,102.7 135.0,96.5 138.8,89.9 142.5,83.3 146.2,76.6 150.0,70.1 153.8,63.9 157.5,58.1 161.2,52.9 165.0,48.5 168.8,44.8 172.5,42.2 176.2,40.5 180.0,40.0 183.8,40.5 187.5,42.2 191.2,44.8 195.0,48.5 198.8,52.9 202.5,58.1 206.2,63.9 210.0,70.1 213.8,76.6 217.5,83.3 221.3,89.9 225.0,96.5 228.8,102.7 232.5,108.7 236.2,114.3 240.0,119.4 243.8,124.1 247.5,128.2 251.2,131.9 255.0,135.1 258.8,137.9 262.5,140.2 266.2,142.2 270.0,143.8 273.8,145.2 277.5,146.3 281.2,147.1 285.0,147.8 288.8,148.4 292.5,148.8 296.2,149.1 300.0,149.3 303.8,149.5 307.5,149.7 311.2,149.8 315.0,149.8 318.8,149.9 322.5,149.9 326.2,149.9 330.0,150.0"/>
  <line x1="180" y1="40" x2="180" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="292.5" y1="70" x2="292.5" y2="150" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="168" font-size="12" text-anchor="middle" fill="#1f2a44">mean</text>
  <text x="292.5" y="168" font-size="12" text-anchor="middle" fill="#b4232c">mean + 3σ</text>
  <text x="298" y="80" font-size="11" fill="#b4232c">0.13 %</text>
  <text x="298" y="94" font-size="11" fill="#b4232c">beyond</text>
  <text x="60" y="80" font-size="11" fill="#1f2a44">99.87 % below</text>
</svg>
```
:::

::: context footprint From covariance to a landing ellipse
Draw the landing points of a Monte Carlo and they form a tilted oval cloud. `np.linalg.eigh(P)` finds that oval's natural axes: the **eigenvectors** point along the long and short axes, and the square roots of the **eigenvalues** are the standard deviations along them. Scale those by three and you have the $3\sigma$ ellipse that range-safety teams draw around a landing zone or a stage's splash-down area. The linear algebra modules explain eigenvectors properly.
:::
