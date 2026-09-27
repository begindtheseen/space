---
id: l06-axes-and-reductions
title: Axes and reductions
minutes: 20
covers:
  - "Axis semantics in reductions: sum, mean, std, min, argmax with axis="
---

Picture a teacher's grade book. Each row is a student and each column is a test. The teacher can ask two very different questions of the same table. "What was the class average on each test?" gives one number per column. "What is each student's average across the tests?" gives one number per row. Same numbers, same word "average", completely different answers.

NumPy has the same choice, and it is made with one small argument: `axis=`. A **[[reduction|reduce-word]]** is an operation that takes many numbers and boils them down to fewer — a sum, a mean, a maximum. With no `axis`, a reduction boils the *whole* array down to a single number. With `axis=0` or `axis=1`, it boils down along one direction only, and you get a smaller array back.

In flight-data work you do this constantly. A day of accelerometer data is an `(N, 3)` array: one row per sample, one column per axis. "What is the average x, y and z?" is one reduction. "How big is the acceleration at each instant?" is another. Mix them up and your code still runs — it just returns five numbers where you wanted three, or three where you wanted a million. This lesson gives you one sentence that makes the choice every time, and then the reductions you will use most: `sum`, `mean`, `std`, `min`, `max`, `argmin` and `argmax`, plus the versions that skip missing data.

## The axis that disappears

Here is the sentence to carry away: **`axis=` [[names the axis that disappears|axis-collapse]].**

Take five accelerometer samples from a satellite sitting on a test stand, in meters per second squared. Shape `(5, 3)`: axis 0 is time (5 samples), axis 1 is the x, y, z component (3 of them).

```python
import numpy as np

a = np.array([[0.12, -0.03, 9.79],
              [0.10, -0.05, 9.82],
              [0.15, -0.02, 9.80],
              [0.09, -0.04, 9.83],
              [0.14, -0.06, 9.81]])     # m/s^2, 5 samples x 3 axes

print(a.sum(axis=0), a.sum(axis=0).shape)
# [ 0.6  -0.2  49.05] (3,)
print(a.sum(axis=1), a.sum(axis=1).shape)
# [9.88 9.87 9.93 9.88 9.89] (5,)
print(a.sum())
# 49.45
```

Read each one aloud by naming what vanishes.

- `a.sum(axis=0)`: "sum away axis 0, the time axis." The five rows are squashed together, and one number per column is left: shape `(3,)`. The x column adds to $0.12 + 0.10 + 0.15 + 0.09 + 0.14 = 0.60$.
- `a.sum(axis=1)`: "sum away axis 1, the component axis." The three columns of each row are squashed together, and one number per row is left: shape `(5,)`. The first row gives $0.12 - 0.03 + 9.79 = 9.88$.
- `a.sum()`: no axis, so [[everything is squashed into one number|sum-accuracy]].

The shape rule is mechanical. **Cross out the reduced axis from the shape, and what is left is the result's shape.** `(5, 3)` with axis 0 crossed out is `(3,)`. With axis 1 crossed out it is `(5,)`.

::: key What axis= means in a reduction
The axis that is collapsed. For an (N,3) array, `sum(axis=0)` gives 3 numbers (one per column) and `sum(axis=1)` gives N numbers (one per row). Say aloud which axis disappears.
:::

::: warning "Along axis 0" is not "one per row"
People often think "axis 0 means rows, so I get one answer per row". It is the opposite. Axis 0 *counts* the rows, and reducing over it removes them, leaving one answer per *column*. If you catch yourself unsure, do not reason about rows and columns at all. Write the shape, cross out the axis, and read what is left.
:::

The same rule works for any number of axes. A week of gyro data stored as `(7, 86400, 3)` — 7 days, 86,400 one-second samples a day, 3 components — can be reduced in several ways:

```python
rng = np.random.default_rng(1)
g = rng.normal(0.0, 0.02, size=(7, 86400, 3))
print(g.std(axis=1).shape)          # cross out the samples
# (7, 3)
print(g.max(axis=0).shape)          # cross out the days
# (86400, 3)
print(g.mean(axis=(0, 1)).shape)    # cross out days and samples
# (3,)
```

`g.std(axis=1)` is "the spread of each component on each day". `g.mean(axis=(0, 1))` — a tuple of axes — squashes days *and* samples together, leaving the three overall component means. Just as a negative list index counts from the end, `axis=-1` is always the last axis — often the clearest way to say "the components".

## The everyday reductions

All of these take `axis=` the same way, as a method (`a.mean(axis=0)`) or a function (`np.mean(a, axis=0)`):

| Reduction | What it returns |
| --- | --- |
| `sum` | the total |
| `mean` | the average: the sum divided by how many |
| `std` | the standard deviation: the typical distance from the mean |
| `var` | the variance: the standard deviation squared |
| `min`, `max` | the smallest and largest value |
| `argmin`, `argmax` | the *position* of the smallest and largest value |
| `any`, `all` | whether any, or all, of a boolean array is `True` |

```python
print(a.mean(axis=0))
# [ 0.12 -0.04  9.81]
print(a.min(axis=0), a.max(axis=1))
# [ 0.09 -0.06  9.79] [9.79 9.82 9.8  9.83 9.81]
```

The mean of z is 9.81 — gravity, as it should be for a satellite sitting still on a stand with its z axis up. The small x and y means, 0.12 and $-0.04$, are the accelerometer's bias plus any tilt of the stand.

### Standard deviation, and ddof

The **standard deviation** measures how spread out numbers are around their mean. The recipe: subtract the mean from each value, square each difference, average those squares, and take the square root. For the x column, the differences from the mean 0.12 are $0, -0.02, 0.03, -0.03, 0.02$. Their squares add to $0 + 0.0004 + 0.0009 + 0.0009 + 0.0004 = 0.0026$.

Now the one choice in the recipe: "average those squares" means divide by *what*? NumPy's default divides by $N$, the number of values. Statisticians often divide by $N - 1$ instead, when the numbers are a sample from something bigger and you want to estimate that bigger thing's spread. The argument **`ddof`** — "delta degrees of freedom" — sets how much to subtract from $N$: the divisor is $N - \text{ddof}$.

```python
print(a.std(axis=0))
# [0.02280351 0.01414214 0.01414214]
print(a.std(axis=0, ddof=1))
# [0.0254951  0.01581139 0.01581139]
```

For x: $\sqrt{0.0026 / 5} = 0.0228$ with the default `ddof=0`, and $\sqrt{0.0026 / 4} = 0.0255$ with `ddof=1`. With five samples that is a 12 percent difference. With 86,400 samples it is invisible.

::: warning Different tools, different default
`np.std` and `np.var` default to `ddof=0` (divide by $N$). The pandas library's `.std()` and Python's `statistics.stdev` default to dividing by $N - 1$. If a colleague's number differs from yours in the third digit on a short data set, check this first — and write `ddof=` explicitly in any code that reports a noise figure.
:::

::: note Why N − 1 exists
When you compute the spread around the *sample's own* mean, that mean was chosen to sit in the middle of those exact samples. So the samples are, on average, a little closer to their own mean than to the true mean of the process. Dividing by $N$ therefore comes out a little small, on average. Dividing by $N - 1$ corrects for this exactly, for the variance. With one sample there is no spread at all to measure, and $N - 1 = 0$ says so honestly.
:::

### argmin and argmax: where, not what

`max` tells you the biggest value. `argmax` tells you *where* it is — its index along the reduced axis. That is usually what you actually need: which sample, which satellite, which pass.

```python
print(a.argmax(axis=0), a.argmin(axis=0))
# [2 2 3] [3 4 0]
```

Read `[2 2 3]` as: the biggest x is in row 2 (0.15), the biggest y is in row 2 ($-0.02$), the biggest z is in row 3 (9.83). If there is a tie, you get the first position.

With no axis, `argmax` counts through the array as if it were flattened into one long line, row after row. To turn that single count back into a row and a column, use `np.unravel_index`:

```python
k = a.argmax()
print(k)
# 11
print(np.unravel_index(k, a.shape))
# (np.int64(3), np.int64(2))
```

Position 11 in a row-by-row walk through a `(5, 3)` array is row 3, column 2 — the 9.83 — because $11 = 3 \times 3 + 2$: three full rows of three, then two more.

::: key argmax and argmin
`argmax(axis=k)` returns the index along axis `k` where the maximum sits, with the same "that axis disappears" shape as `max(axis=k)`. With no axis it returns one index into the flattened array; `np.unravel_index(i, a.shape)` converts it back to a row and column. Ties go to the first occurrence.
:::

::: example Which pass had the worst downlink?
Four satellites each made five passes over a ground station. For each pass, the table holds the **[[link margin|link-margin]]** in decibels (dB): how much stronger the signal was than the minimum needed. Bigger is better, and anything below 3 dB is worrying. Shape `(4, 5)`: axis 0 is the satellite, axis 1 is the pass.

```python
m = np.array([[6.1, 4.8, 7.2, 5.5, 6.0],
              [3.9, 5.2, 4.4, 2.7, 5.8],
              [7.5, 6.9, 8.1, 7.0, 6.6],
              [5.0, 1.9, 4.6, 5.3, 4.9]])   # dB
```

**Each satellite's worst pass.** "Per satellite" means the passes must disappear, so reduce axis 1:

```python
print(m.min(axis=1), m.argmin(axis=1))
# [4.8 2.7 6.6 1.9] [1 3 4 1]
```

Satellite 1's worst pass was pass 3, at 2.7 dB. Satellite 3's was pass 1, at 1.9 dB. Check row 1 by eye: 3.9, 5.2, 4.4, 2.7, 5.8 — the smallest is indeed 2.7, at position 3.

**Each pass's worst satellite.** Now the satellites disappear, axis 0:

```python
print(m.min(axis=0), m.argmin(axis=0))
# [3.9 1.9 4.4 2.7 4.9] [1 3 1 1 3]
```

Satellite 1 is the weakest on three of the five passes. That points at the satellite (maybe a degraded transmitter), not at the ground station.

**The single worst pass in the fleet.**

```python
k = m.argmin()
print(k, np.unravel_index(k, m.shape), m.min())
# 16 (np.int64(3), np.int64(1)) 1.9
```

Position 16 in a row-by-row walk through 5 columns is satellite 3, pass 1, because $16 = 3 \times 5 + 1$. It matches the table.

**How many passes were worrying?** A comparison gives a boolean array, and `True` counts as 1 when you sum:

```python
print((m < 3.0).sum(), (m < 3.0).sum(axis=1), (m < 3.0).mean())
# 2 [0 1 0 1] 0.1
```

Two passes out of twenty were under 3 dB, one each for satellites 1 and 3. The mean of a boolean array is the *fraction* that is true: $2 / 20 = 0.1$, or 10 percent.
:::

## keepdims: leave a length-1 axis behind

Often you reduce so that you can go back and use the result against the original. Subtract each column's mean from every sample, for example, to see the noise alone:

```python
mean = a.mean(axis=0)          # shape (3,)
print((a - mean).round(3))
# [[ 0.    0.01 -0.02]
#  [-0.02 -0.01  0.01]
#  [ 0.03  0.02 -0.01]
#  [-0.03  0.    0.02]
#  [ 0.02 -0.02  0.  ]]
```

That worked, by the last lesson's broadcasting rule: `(5, 3)` against `(3,)`, right-aligned, fits.

Now do the same per *row* — subtract each sample's own mean — and it breaks:

```python
a - a.mean(axis=1)
# ValueError: operands could not be broadcast together with shapes (5,3) (5,)
```

The per-row means have shape `(5,)`, and a `(5,)` array lines up with the *last* axis, which has length 3. You met this exact clash last lesson with vector lengths. You could fix it with `[:, None]`. The cleaner fix is **`keepdims=True`**, which tells the reduction to keep the squashed axis in place with length 1 instead of removing it:

```python
print(a.mean(axis=1, keepdims=True).shape, a.mean(axis=0, keepdims=True).shape)
# (5, 1) (1, 3)
print((a - a.mean(axis=1, keepdims=True)).shape)
# (5, 3)
```

With `keepdims=True`, the rule is "replace the reduced axis's length by 1", not "cross it out". A `(5, 1)` result lines up with `(5, 3)` and stretches across the columns — **[[one value per row|keepdims-picture]]**, exactly as meant.

::: key keepdims
`keepdims=True` keeps the reduced axis with length 1: an `(N, 3)` array reduced with `axis=1, keepdims=True` gives `(N, 1)`, which broadcasts straight back against the original. Use it whenever the result goes back into arithmetic with the array it came from.
:::

::: example Magnitudes and unit vectors from one reduction
The **magnitude** of a vector — its length — is the square root of the sum of the squares of its components: for $(x, y, z)$ it is $\sqrt{x^2 + y^2 + z^2}$. For the five accelerometer samples, one magnitude per sample means the components must disappear: axis 1.

```python
mag = np.sqrt((a**2).sum(axis=1))
print(mag.round(4), mag.shape)
# [9.7908 9.8206 9.8012 9.8305 9.8112] (5,)
print(np.linalg.norm(a, axis=1).round(4))
# [9.7908 9.8206 9.8012 9.8305 9.8112]
```

Check the first by hand: $0.12^2 + 0.03^2 + 9.79^2 = 0.0144 + 0.0009 + 95.8441 = 95.8594$, and $\sqrt{95.8594} = 9.7908$. Every magnitude is close to $g_0 = 9.81\,\mathrm{m/s^2}$, as it should be for an instrument at rest on Earth.

`np.linalg.norm(a, axis=1)` does the same job in one call. It follows the same axis rule: `axis=1` gives one length per row, `axis=0` would give one number per column, and no axis at all gives a single number for the whole table — almost never what you want for a stack of vectors.

To turn each row into a unit vector, divide by its length, and keep the axis so the shapes fit:

```python
u = a / np.linalg.norm(a, axis=1, keepdims=True)
print(u.shape, np.linalg.norm(u, axis=1).round(12))
# (5, 3) [1. 1. 1. 1. 1.]
```

Every row now has length 1, which is the check that matters.
:::

::: warning A zero-length row makes NaN
If a row is all zeros, its length is 0, and $0 / 0$ gives `nan` plus a warning. When zero rows can happen (a sensor that was off, a padding row), divide by a "safe" length where zeros are replaced with 1 — `np.where(n > 0, n, 1.0)` — and then set those rows back to zero with a boolean mask, as in the lesson on masks.
:::

## Missing data: the nan-aware reductions

Telemetry has gaps. A packet is dropped, a sensor reboots, and the ground software fills the hole with **`nan`** — "not a number", a special floating-point value that means "no value here". Any arithmetic with `nan` gives `nan`, so one gap poisons the whole reduction:

```python
T = np.array([21.4, 21.9, np.nan, 22.3, 22.0, np.nan, 21.7])   # battery temp, deg C
print(T.mean(), T.max())
# nan nan
```

NumPy has a second family of reductions that **[[skip the nans|nan-origin]]**, each named with a `nan` prefix: `np.nansum`, `np.nanmean`, `np.nanstd`, `np.nanvar`, `np.nanmin`, `np.nanmax`, `np.nanargmin`, `np.nanargmax`. They take `axis=`, `keepdims=` and `ddof=` exactly like the plain ones.

```python
print(np.nanmean(T), np.nanmax(T), np.nanmin(T))
# 21.86 22.3 21.4
print(np.nanargmax(T), np.isnan(T).sum())
# 3 2
```

The mean is over the five real readings: $(21.4 + 21.9 + 22.3 + 22.0 + 21.7) / 5 = 109.3 / 5 = 21.86$. The hottest reading is at index 3. And `np.isnan(T).sum()` counts the gaps — always worth reporting next to a statistic, because a mean of 5 values and a mean of 86,000 values do not deserve the same trust.

::: key nan-aware reductions
A single `nan` makes `sum`, `mean`, `std`, `min`, `max` return `nan`. `np.nansum`, `np.nanmean`, `np.nanstd`, `np.nanmin`, `np.nanmax`, `np.nanargmin`, `np.nanargmax` ignore `nan` values and accept the same `axis=`, `keepdims=` and `ddof=` arguments.
:::

::: warning Plain argmax does not skip nan
`np.argmax(T)` on the array above returns `2` — the position of the first `nan`, because NumPy treats `nan` as the "winner" in `max` and `argmax`. No error, no warning, wrong index. Use `np.nanargmax` on data with gaps. And if an entire row is `nan`, `np.nanmean` returns `nan` with a "Mean of empty slice" warning, while `np.nanargmax` raises "All-NaN slice encountered" — there is no honest answer to give.
:::

## Reductions that keep the axis: cumulative ones

One more family looks like a reduction but does not shrink anything. `np.cumsum(x, axis=k)` gives the running total along axis `k`, so the result has the *same* shape as `x`. `np.cumprod` is the running product. Integrating a rate into an angle, sample by sample, is a `cumsum` times the time step along the time axis. The `axis=` argument still names the direction you walk along; it just does not disappear this time.

## Check yourself

::: check
`w` holds wind-tunnel pressures with shape `(12, 40, 6)`: 12 runs, 40 time steps per run, 6 sensors. Give the shape of (a) `w.mean(axis=1)`, (b) `w.max(axis=(0, 1))`, (c) `w.std(axis=-1, keepdims=True)`, (d) `w.argmin(axis=0)`.
:::

::: answer
(a) Cross out the 40: `(12, 6)`, the average of each sensor in each run.
(b) Cross out 12 and 40: `(6,)`, the highest pressure each sensor ever saw.
(c) Axis `-1` is the last, the 6 sensors; `keepdims` replaces it with 1: `(12, 40, 1)`, the spread across sensors at each time step of each run, ready to broadcast back against `w`.
(d) Cross out the 12: `(40, 6)`. Each entry is a run number, 0 to 11 — the run in which that sensor, at that time step, read lowest.
:::

::: check
A reaction wheel's speed error was logged once a second for 30 days, stored as `e` with shape `(30, 86400)`. Write the expression for the **[[root mean square|rms-budget]]** (RMS) error of each day — the square root of the mean of the squares — and give its shape.
:::

::: answer
`np.sqrt(np.mean(e**2, axis=1))`, shape `(30,)`. Work from the inside: `e**2` squares each sample and keeps the shape `(30, 86400)`. `mean(axis=1)` averages away the 86,400 samples of each day, leaving `(30,)`. The square root keeps `(30,)`. The order matters: squaring *before* averaging is what makes positive and negative errors both count.
:::

::: check
Three sensors give noise standard deviations of 0.0100, 0.0102 and 0.0098 on your laptop and 0.0101, 0.0103 and 0.0099 on a teammate's analysis sheet, from the same 50 samples each. What is the most likely cause, and how big should the ratio between the two be?
:::

::: answer
One side divided by $N = 50$ (NumPy's default, `ddof=0`) and the other by $N - 1 = 49$ (a spreadsheet or pandas default). The standard deviations then differ by a factor of $\sqrt{50 / 49} \approx 1.0102$, about 1 percent: $0.0100 \times 1.0102 = 0.0101$, which matches. Agree on one convention and write `ddof=` explicitly.
:::

::: check
`b = np.array([[True, False, True], [False, False, True]])`. What do `b.sum()`, `b.sum(axis=0)`, `b.any(axis=1)` and `b.all(axis=0)` return?
:::

::: answer
`b.sum()` counts every `True`: 3. `b.sum(axis=0)` removes the 2 rows, one count per column: `[1, 0, 2]`. `b.any(axis=1)` removes the 3 columns, asking of each row "is any entry True?": `[True, True]`. `b.all(axis=0)` asks of each column "are all entries True?": only the last column is `True` in both rows, so `[False, False, True]`.
:::

::: check
Temperatures from 8 thermistors, 1,000 samples each, sit in `T` with shape `(1000, 8)` and contain some `nan` gaps. Write one line that gives each thermistor's mean, and one that gives the sample index of each thermistor's highest reading.
:::

::: answer
The samples must disappear, and they are axis 0. `np.nanmean(T, axis=0)` gives shape `(8,)`, one mean per thermistor, skipping gaps. `np.nanargmax(T, axis=0)` gives `(8,)` sample indices. The plain `T.mean(axis=0)` would return `nan` for every thermistor with even one gap, and `T.argmax(axis=0)` would point at the first gap instead of the hottest reading.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| `axis=k` | names the axis that disappears; cross it out of the shape to get the result's shape |
| `(N, 3)`, `axis=0` | 3 numbers, one per column (component) |
| `(N, 3)`, `axis=1` | N numbers, one per row (sample) |
| no axis | the whole array to one number; `argmax` then indexes the flattened array |
| tuple of axes | `axis=(0, 1)` removes both |
| `std`, `var` | divide by $N - \text{ddof}$; NumPy's default is `ddof=0` |
| `argmin`, `argmax` | the position, not the value; ties go to the first; `np.unravel_index` for 2-D positions |
| `keepdims=True` | the reduced axis stays with length 1, ready to broadcast back |
| booleans | `sum` counts `True`; `mean` gives the fraction `True` |
| `nan` | poisons plain reductions; use `nanmean`, `nanstd`, `nanmax`, `nanargmax` and friends |
| `np.linalg.norm(v, axis=1)` | one length per row of an `(N, 3)` array |

The next lesson changes the shape of an array without reducing it at all: `reshape` regroups the same numbers into new axes (so a stream of samples can become days by samples, ready for this lesson's `axis=`), `transpose` swaps axes around, and `stack` and `concatenate` glue arrays together.

::: context reduce-word Why "reduction"
The name comes from the idea of reducing a list to one value by applying an operation between neighbors: $1 + 2 + 3 + 4$ is "reduce with plus". Python has the same idea as `functools.reduce`. NumPy's reductions are all built on one mechanism, `np.add.reduce`, `np.maximum.reduce` and so on, which is why they all accept the same `axis=` and `keepdims=` arguments and follow the same shape rule.
:::

::: context axis-collapse Which way the table gets squashed
Think of the array as a grid of boxes: reducing along an axis presses the grid flat in that direction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#fff">
    <rect x="30" y="30" width="90" height="100"/>
    <line x1="60" y1="30" x2="60" y2="130"/><line x1="90" y1="30" x2="90" y2="130"/>
    <line x1="30" y1="50" x2="120" y2="50"/><line x1="30" y1="70" x2="120" y2="70"/>
    <line x1="30" y1="90" x2="120" y2="90"/><line x1="30" y1="110" x2="120" y2="110"/>
  </g>
  <text x="75" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">(5, 3)</text>
  <line x1="75" y1="136" x2="75" y2="156" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="75,164 70,154 80,154" fill="#1d6fd1"/>
  <g stroke="#1d6fd1" fill="#8fb8f0">
    <rect x="30" y="168" width="90" height="20"/>
    <line x1="60" y1="168" x2="60" y2="188"/><line x1="90" y1="168" x2="90" y2="188"/>
  </g>
  <text x="130" y="182" font-size="12" fill="#1d6fd1">axis=0 → (3,)</text>
  <line x1="126" y1="80" x2="166" y2="80" stroke="#b4232c" stroke-width="2"/>
  <polygon points="174,80 164,75 164,85" fill="#b4232c"/>
  <g stroke="#b4232c" fill="#f2b880">
    <rect x="180" y="30" width="30" height="100"/>
    <line x1="180" y1="50" x2="210" y2="50"/><line x1="180" y1="70" x2="210" y2="70"/>
    <line x1="180" y1="90" x2="210" y2="90"/><line x1="180" y1="110" x2="210" y2="110"/>
  </g>
  <text x="220" y="84" font-size="12" fill="#b4232c">axis=1 → (5,)</text>
  <text x="220" y="40" font-size="11" fill="#6c7a93">rows: samples (axis 0)</text>
  <text x="220" y="56" font-size="11" fill="#6c7a93">columns: x, y, z (axis 1)</text>
</svg>
```

Pressing down (axis 0) removes the five rows and leaves one number per column. Pressing sideways (axis 1) removes the three columns and leaves one number per row.
:::

::: context sum-accuracy How NumPy adds a million numbers
Adding a million floating-point numbers one after another lets a small rounding error pile up at every step. `np.sum` on floats uses **pairwise summation**: it adds numbers in small blocks, then adds the block totals, and so on up a tree. The rounding error then grows roughly with the logarithm of the number of values rather than with the number itself. It is one reason `np.sum(x)` and a hand-written Python loop can disagree in the last few digits — and why a reduction is usually the more accurate of the two.
:::

::: context link-margin What a link margin is
A radio link needs the received signal to be a certain amount stronger than the background noise for the data to come through cleanly. The **link margin** is how much extra you have beyond that minimum, measured in decibels. Decibels are a log scale: every 3 dB is roughly a doubling of power, and 10 dB is ten times. A margin of 6 dB means about four times the power strictly needed; a margin near 0 dB means the link is on the edge of dropping. Operators watch per-pass margins across a fleet to spot a failing transmitter or a mis-pointed antenna before a pass is lost.
:::

::: context keepdims-picture Reducing, then stretching back
With `keepdims=True`, the squashed axis stays as length 1, so the result slots straight back against the original.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#fff">
    <rect x="20" y="30" width="90" height="100"/>
    <line x1="50" y1="30" x2="50" y2="130"/><line x1="80" y1="30" x2="80" y2="130"/>
    <line x1="20" y1="50" x2="110" y2="50"/><line x1="20" y1="70" x2="110" y2="70"/>
    <line x1="20" y1="90" x2="110" y2="90"/><line x1="20" y1="110" x2="110" y2="110"/>
  </g>
  <text x="65" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">a: (5, 3)</text>
  <line x1="120" y1="80" x2="160" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="168,80 158,75 158,85" fill="#1d6fd1"/>
  <text x="145" y="100" font-size="11" text-anchor="middle" fill="#1d6fd1">mean</text>
  <text x="145" y="114" font-size="11" text-anchor="middle" fill="#1d6fd1">axis=1</text>
  <g stroke="#1d6fd1" fill="#8fb8f0">
    <rect x="180" y="30" width="30" height="100"/>
    <line x1="180" y1="50" x2="210" y2="50"/><line x1="180" y1="70" x2="210" y2="70"/>
    <line x1="180" y1="90" x2="210" y2="90"/><line x1="180" y1="110" x2="210" y2="110"/>
  </g>
  <text x="195" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">(5, 1)</text>
  <g stroke="#8fb8f0" stroke-dasharray="4 3" fill="none">
    <rect x="240" y="30" width="30" height="100"/><rect x="270" y="30" width="30" height="100"/><rect x="300" y="30" width="30" height="100"/>
  </g>
  <line x1="215" y1="80" x2="232" y2="80" stroke="#b4232c" stroke-width="2"/>
  <polygon points="240,80 230,75 230,85" fill="#b4232c"/>
  <text x="285" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">stretched to (5, 3)</text>
  <text x="180" y="155" font-size="11" fill="#6c7a93">a − a.mean(axis=1, keepdims=True)</text>
</svg>
```

Without `keepdims`, the means come out as `(5,)`, which right-aligns against the 3 columns and fails.
:::

::: context nan-origin Where nan comes from
`nan` is part of the IEEE 754 floating-point standard that nearly every computer follows. It is what you get from undefined arithmetic such as $0/0$ or $\infty - \infty$, and it has a strange property: `nan == nan` is `False`, which is why you test for it with `np.isnan`, never with `==`. Ground systems use it on purpose as a placeholder for "no data", because unlike a fake value such as 0 or $-999$, it cannot silently pass as a real reading — anything computed from it turns into `nan` too, which is loud.
:::

::: context rms-budget Why engineers love RMS
A plain mean of an error that swings positive and negative can come out near zero even when the error is large: the swings cancel. Squaring first makes every error count as positive, and the square root puts the answer back in the original units. That is the **root mean square**. Pointing requirements for telescopes and antennas are often written as RMS numbers ("pointing jitter under 0.1 arcseconds RMS"), and for a signal whose mean is zero, the RMS equals the standard deviation with `ddof=0`.
:::
