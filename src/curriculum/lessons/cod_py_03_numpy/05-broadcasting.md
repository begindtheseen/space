---
id: l05-broadcasting
title: Broadcasting
minutes: 24
covers:
  - Broadcasting rules, newaxis, and when shapes are incompatible
---

A teacher gives the whole class five bonus points. Nobody writes "add 5" thirty times. The teacher says it once, and it applies to every row of the grade book.

NumPy lets you do the same thing with arrays. Write `scores + 5` and the single number `5` is used against every element. Write `readings - bias`, where `readings` holds a thousand rows of three numbers and `bias` holds just three, and the three bias numbers are used against every row. This stretching of a smaller array across a bigger one is called **[[broadcasting|broadcast-word]]** — using one array's values again and again, as if it had been copied out to the bigger shape, without actually copying anything.

Broadcasting is where most of NumPy's power comes from, and most of its silent bugs. The good version corrects a million gyroscope samples in one short line. The bad version quietly builds a 240-gigabyte array, or subtracts a bias from the wrong axis and hands you a plausible wrong answer. By the end of this lesson you will look at two shapes and say the result shape — or that it will fail — before you press Enter.

## One number against a whole array

Start with the case you already used in the lessons on creating and slicing arrays: an array and a plain number.

```python
import numpy as np

scores = np.array([71, 84, 90])
print(scores + 5)
# [76 89 95]
```

The `5` has no shape at all — it is a **scalar**, a single number. NumPy treats it as if it were an array of three fives, `[5, 5, 5]`, and adds element by element. Every arithmetic operator and comparison works this way, as do element-by-element functions such as `np.sqrt`.

## A row of three against many rows

Now the everyday telemetry case. A spacecraft's **[[gyroscope|gyro-bias]]** measures how fast the vehicle is turning about each of its three axes, x, y and z, in degrees per second. You have four samples, so the data is a table of 4 rows (time) by 3 columns (axis). Its **shape** — the length along each axis, which you met in the first lesson of this module — is `(4, 3)`, read "four by three".

Every real gyro has a small **bias**: it reads a little off even when the vehicle is perfectly still. Each axis has its own bias, so the bias is three numbers, shape `(3,)`. You want to subtract the x bias from every x reading, the y bias from every y reading, and the z bias from every z reading.

```python
raw = np.array([[ 1.25, -0.40, 0.10],
                [ 1.30, -0.35, 0.05],
                [ 1.20, -0.45, 0.15],
                [ 1.35, -0.30, 0.10]])      # deg/s, 4 samples x 3 axes
bias = np.array([0.05, -0.10, 0.10])       # deg/s, one per axis

print(raw.shape, bias.shape)
# (4, 3) (3,)
print(raw - bias)
# [[ 1.2  -0.3   0.  ]
#  [ 1.25 -0.25 -0.05]
#  [ 1.15 -0.35  0.05]
#  [ 1.3  -0.2   0.  ]]
```

Look at the first row. $1.25 - 0.05 = 1.20$, $-0.40 - (-0.10) = -0.30$, and $0.10 - 0.10 = 0$. The bias row was laid against each of the four rows in turn. No loop, and no four copies of `bias`.

This is the pattern you will use more than any other: an `(N, 3)` array of vectors — $N$ rows, however many, of three numbers each — combined with a `(3,)` array that holds one number per component. Multiplying instead of subtracting works the same way — `raw * gain` scales each column by its own gain.

## The rule, stated exactly

Here is how NumPy decides whether two shapes fit together, and what shape comes out.

1. **Write the two shapes one above the other, lined up on the right.** The last axis — the **[[trailing axis|trailing-axis]]** — sits under the last axis, the one before it under the one before it, and so on.
2. **If one shape is shorter, pad it on the left with 1s** until both have the same length. A missing leading axis counts as length 1.
3. **Compare each column of the stack.** Two lengths are compatible if they are **equal**, or if **one of them is 1**.
4. **The result takes the larger length in each column.** An axis of length 1 is stretched to match the other.
5. If any column has two different lengths and neither is 1, NumPy stops with an error.

For the gyro example:

```text
raw    (4, 3)
bias      (3,)   -> padded to (1, 3)
-------------
result (4, 3)    3 vs 3: equal.   4 vs 1: stretch the 1.
```

::: key The broadcasting rule
Align shapes from the trailing axis. Two dimensions are compatible if they are equal or one of them is 1; a missing leading dimension counts as 1. The result takes the maximum along each axis.
:::

The rule looks only at shapes, never values. That makes it predictable — and means it cannot tell whether a stretch was what you meant.

::: example Predicting shapes before running anything
Work out each result shape with the rule, then check it with `np.broadcast_shapes`, which applies the rule to shapes alone without building any arrays.

**Pair 1: `(8, 1, 6, 1)` with `(7, 1, 5)`.** Line them up on the right and pad the shorter one:

```text
(8, 1, 6, 1)
(1, 7, 1, 5)
------------
(8, 7, 6, 5)
```

Column by column from the right: 1 and 5 → 5. 6 and 1 → 6. 1 and 7 → 7. 8 and the padded 1 → 8. No clash, so the result is `(8, 7, 6, 5)`.

**Pair 2: `(5, 1, 3)` with `(4, 3)`.** Pad the second to `(1, 4, 3)`. Then 3 and 3 → 3, 1 and 4 → 4, 5 and 1 → 5. The result is `(5, 4, 3)`.

**Pair 3: `(4, 3)` with `(4,)`.** Line up on the right: the `4` of the short shape sits under the `3`. Four is not three, and neither is one. This fails.

```python
print(np.broadcast_shapes((8, 1, 6, 1), (7, 1, 5)))
# (8, 7, 6, 5)
print(np.broadcast_shapes((5, 1, 3), (4, 3)))
# (5, 4, 3)
np.broadcast_shapes((4, 3), (4,))
# ValueError: shape mismatch: objects cannot be broadcast to a single shape.
#   Mismatch is between arg 0 with shape (4, 3) and arg 1 with shape (4,).
```

All three agree with the hand calculation. Notice that pair 3 failed even though both shapes contain a 4. Lining up on the *right* is the whole trick — the 4s are in different columns.
:::

::: note Why it has to be the right-hand end
Why not line shapes up on the left? Because of how people store data. The last axis of an array is usually the "small, meaningful" one: the three components of a vector, or the four numbers of a quaternion (another way to store which way a vehicle points). Leading axes are usually "how many of them": how many samples, how many satellites, how many days. Lining up on the right means a single vector of shape `(3,)` fits a whole stack of vectors `(N, 3)`, a stack of those `(D, N, 3)`, and so on, with no extra work. The leading axes can be anything; the part that matches is the meaning at the end.
:::

## When shapes do not fit

Here is the classic first-week mistake. You have four vectors, one per row, and you want to divide each one by its own length to get **unit vectors** — vectors of length 1 pointing the same way.

```python
v = np.array([[3.0, 4.0, 0.0],
              [0.0, 0.0, 2.0],
              [1.0, 2.0, 2.0],
              [6.0, 0.0, 8.0]])
n = np.sqrt((v**2).sum(axis=1))    # length of each row
print(n, n.shape)
# [ 5.  2.  3. 10.] (4,)
v / n
# ValueError: operands could not be broadcast together with shapes (4,3) (4,)
```

(The `sum(axis=1)` adds across each row; the next lesson is all about `axis=`.) The lengths are right: $\sqrt{3^2 + 4^2} = 5$, and $\sqrt{6^2 + 8^2} = 10$. The problem is the shapes. Lined up on the right, the `4` in `(4,)` sits under the `3` in `(4, 3)`. NumPy reads `n` as "one number per *column*", and there are only three columns.

**Read the error message as a shape diagram.** "could not be broadcast together with shapes (4,3) (4,)" is NumPy handing you both shapes. Write them one above the other, right-aligned, and the clashing column jumps out.

What you meant was "one number per *row*". A per-row number needs shape `(4, 1)`: four rows, and a length-1 column axis that can stretch across the three components.

## newaxis: adding a length-1 axis

To turn shape `(4,)` into `(4, 1)`, index with **`np.newaxis`** in the spot where you want a new axis of length 1. `np.newaxis` is another name for Python's `None`, and most people write `None` because it is shorter.

```python
print(n[:, np.newaxis].shape, n[:, None].shape, n[None, :].shape)
# (4, 1) (4, 1) (1, 4)
print(np.newaxis is None)
# True

u = v / n[:, None]
print(u)
# [[0.6        0.8        0.        ]
#  [0.         0.         1.        ]
#  [0.33333333 0.66666667 0.66666667]
#  [0.6        0.         0.8       ]]
```

Read `n[:, None]` aloud as "all of n, then a new axis". The `:` keeps the existing axis where it is, and the `None` adds a length-1 axis after it. `n[None, :]` puts the new axis first instead, giving `(1, 4)` — a row, not a column.

Now the shapes line up: `(4, 3)` over `(4, 1)` gives 3 against 1 (stretch) and 4 against 4 (equal), so the result is `(4, 3)`. Check the first row: $3/5 = 0.6$ and $4/5 = 0.8$, and $0.6^2 + 0.8^2 = 1$. A unit vector, as it should be.

::: key newaxis
`x[:, None]` (same as `x[:, np.newaxis]`) turns shape `(N,)` into `(N, 1)` — one value per row. `x[None, :]` turns it into `(1, N)` — one value per column. `np.newaxis is None`. Adding a length-1 axis changes no data; it is a view.
:::

::: warning (N,) and (N, 1) are not the same thing
A 1-D array of shape `(N,)` broadcasts as a *row*. To use it as one value per row of an `(N, 3)` array, you need `(N, 1)`. If you forget the `None`, one of two things happens. Either NumPy raises the error above (good — you find out), or, if `N` happens to equal the length of the last axis, it silently does the wrong thing (bad). Put the `None` in whenever you mean "per row", and assert the shape when it matters.
:::

## Outer combinations: every row with every column

Broadcasting can stretch *both* arrays at once. Take a column of shape `(3, 1)` and a row of shape `(1, 4)`:

```python
a = np.array([[0], [10], [20]])     # shape (3, 1)
b = np.array([[1, 2, 3, 4]])        # shape (1, 4)
print((a + b).shape)
# (3, 4)
print(a + b)
# [[ 1  2  3  4]
#  [11 12 13 14]
#  [21 22 23 24]]
```

By the rule: 1 against 4 gives 4, and 3 against 1 gives 3, so the result is `(3, 4)`. The column is stretched sideways across four columns, the row is stretched downward across three rows, and they are added. Every entry of `a` meets every entry of `b`. That is an **[[outer combination|outer-table]]** — the same thing as an addition table you might have made in elementary school.

::: key An outer combination
`a.shape = (3,1)`, `b.shape = (1,4)` gives `(a+b).shape == (3,4)`. Each array is stretched along its length-1 axis, producing the outer combination. This is the mechanism behind most accidental memory explosions in NumPy code.
:::

With 1-D arrays you get the same effect with `None`. If `t` has shape `(3,)` and `k` has shape `(4,)`, then `t[:, None] + k` has shape `(3, 4)`. You do not even need `k[None, :]`, because the rule pads the missing leading axis with a 1 for you.

::: example Pairwise distances between four satellites
Four small satellites fly in a cluster. Their positions, in kilometers, are the rows of `r`, shape `(4, 3)`. You want the distance between every pair — a 4-by-4 table.

The idea: put the "first satellite" on axis 0 and the "second satellite" on axis 1, keep the x, y, z components on axis 2, and let broadcasting subtract every satellite from every other.

```python
r = np.array([[6878.0,   0.0,  0.0],
              [6878.0,  30.0, 40.0],
              [6870.0,   6.0,  0.0],
              [6900.0, -20.0, 10.0]])      # km

d = r[:, None, :] - r[None, :, :]
print(r[:, None, :].shape, r[None, :, :].shape, d.shape)
# (4, 1, 3) (1, 4, 3) (4, 4, 3)
```

Check the shape by the rule. Right to left: 3 and 3 → 3. 1 and 4 → 4. 4 and 1 → 4. Result `(4, 4, 3)`: for each pair `(i, j)`, the difference vector `r[i] - r[j]`.

Now square, add up the three components, and take the square root, for the length of each difference vector:

```python
dist = np.sqrt((d**2).sum(axis=2))
print(dist.round(2))
# [[ 0.   50.   10.   31.37]
#  [50.    0.   47.33 62.32]
#  [10.   47.33  0.   40.94]
#  [31.37 62.32 40.94  0.  ]]
```

Sanity checks. The diagonal is all zeros — every satellite is zero kilometers from itself. The table is symmetric — the distance from 1 to 3 equals the distance from 3 to 1. And one entry by hand: satellites 0 and 1 differ by $(0, 30, 40)$ km, and $\sqrt{30^2 + 40^2} = 50$ km, which matches `dist[1, 0]`. The closest pair is 0 and 2, only 10 km apart.
:::

::: warning The memory bill for "every pair"
The intermediate array `d` has $N \times N \times 3$ numbers. At 8 bytes per `float64`, 1,000 satellites need $1000 \times 1000 \times 3 \times 8 = 24{,}000{,}000$ bytes, about 24 MB — fine. A catalog of 100,000 [[tracked objects|conjunction-scale]] needs $100{,}000^2 \times 3 \times 8 = 2.4 \times 10^{11}$ bytes, about **240 GB**. That will not fit on your laptop. Before an outer combination, multiply out the result shape and the item size. For big catalogs, work in chunks of rows, or use a spatial search that never forms every pair.
:::

The same trap hides in a single missing `None`. If `x` has shape `(N,)` and `col` has shape `(N, 1)`, then `x - col` is `(N, N)`, not `(N,)`. With five elements that is a 5-by-5 surprise. With ten million elements it is 800 terabytes of surprise.

## Broadcasting copies nothing

"Stretched" sounds as if NumPy makes copies. It does not. In the first lesson of this module you met **strides** — how many bytes to step in memory to move one place along each axis. A stretched axis gets a stride of **0**: moving along it does not move in memory at all, so the same values are read again and again.

You can see this with `np.broadcast_to`, which returns the stretched array as a read-only view:

```python
b4 = np.broadcast_to(np.array([0.05, -0.10, 0.10]), (4, 3))
print(b4)
# [[ 0.05 -0.1   0.1 ]
#  [ 0.05 -0.1   0.1 ]
#  [ 0.05 -0.1   0.1 ]
#  [ 0.05 -0.1   0.1 ]]
print(b4.strides, b4.flags.writeable)
# (0, 8) False
```

The strides `(0, 8)` say: to go down a row, move **[[0 bytes|stride-zero]]**; to go across a column, move 8 bytes (one `float64`). Four rows, one set of three numbers in memory. That is why broadcasting a `(3,)` bias across ten million rows costs nothing extra. The only big array is the *result* — and that is why the result shape is the thing to predict.

::: warning In-place operations cannot grow the left side
`s += t` writes the answer back into `s`, so the broadcast result must already have `s`'s shape. With `s` of shape `(3,)` and `t` of shape `(2, 3)`, `s + t` is fine (it makes a new `(2, 3)` array), but `s += t` fails with "non-broadcastable output operand with shape (3,) doesn't match the broadcast shape (2,3)". The right-hand side may stretch; the left-hand side cannot.
:::

## Where you will meet it

Besides per-axis corrections and unit vectors, broadcasting turns up in:

- subtracting a column's mean, computed by a reduction, from every row ([[the next lesson|keepdims-bridge]]'s `keepdims` makes this painless);
- building a table of every pair: distances between satellites, differences between time stamps, a grid of angles against ranges;
- scaling a batch of matrices `(N, 3, 3)` by `N` separate numbers, reshaped to `(N, 1, 1)`.

Each one is the same habit. Write the shapes one above the other, right-aligned. Say which axis stretches. Say the result shape. Then run it, and `assert` the shape if the code will live on.

::: example Correcting a gyro with bias and scale factor
A gyro's readings need two corrections per axis. First subtract the bias. Then divide by the **scale factor**, the gain by which each axis over- or under-reads. For this unit the scale factors are 1.02 (x reads 2 percent high), 0.98 (y reads 2 percent low) and 1.00 (z is exact).

```python
scale = np.array([1.02, 0.98, 1.00])
rate = (raw - bias) / scale
print(rate.shape)
# (4, 3)
print(rate.round(4))
# [[ 1.1765 -0.3061  0.    ]
#  [ 1.2255 -0.2551 -0.05  ]
#  [ 1.1275 -0.3571  0.05  ]
#  [ 1.2745 -0.2041  0.    ]]
```

Shapes: `(4, 3) - (3,)` is `(4, 3)`, then `(4, 3) / (3,)` is `(4, 3)`. Check the first row by hand. After the bias, it was $(1.20, -0.30, 0)$. Divide each by its own scale factor: $1.20 / 1.02 = 1.1765$, $-0.30 / 0.98 = -0.3061$, $0 / 1.00 = 0$. That matches.

Does it make sense? The x axis read 2 percent high, so the corrected x rate should be a little smaller than the biased one: 1.1765 is less than 1.20. The y axis read 2 percent low, so its corrected size should be a little bigger: 0.3061 is more than 0.30. The same one line would correct ten million samples.
:::

::: warning A square array can hide the wrong axis
Some teams store vectors as *columns* instead of rows: shape `(3, N)`, with row 0 all the x values. Subtracting a `(3,)` bias from that lines the bias up against the *columns* — samples, not axes. With `N = 5`, you get a shape error and find the bug. With `N = 3`, the shapes are `(3, 3)` and `(3,)`, everything fits, and you subtract the x bias from sample 0, the y bias from sample 1, and so on. No error, wrong answer. For column layout, write `p - bias[:, None]`. Better, pick rows-are-samples, `(N, 3)`, and keep to it everywhere.
:::

## Check yourself

::: check
Without running anything, give the result shape (or say it fails) for: (a) `(6, 1)` with `(1, 5)`; (b) `(10, 3)` with `(10,)`; (c) `(2, 1, 4)` with `(3, 1)`; (d) `(7,)` with a plain number.
:::

::: answer
(a) Right-aligned: 1 and 5 → 5, 6 and 1 → 6. Result `(6, 5)`, an outer combination.

(b) The `10` of `(10,)` lines up under the `3`. Ten is not three and neither is 1, so it fails with "operands could not be broadcast together with shapes (10,3) (10,)". To use one number per row, write `b[:, None]`, shape `(10, 1)`.

(c) Pad `(3, 1)` to `(1, 3, 1)`. Then 4 and 1 → 4, 1 and 3 → 3, 2 and 1 → 2. Result `(2, 3, 4)`.

(d) A plain number has no axes; it fits anything. Result `(7,)`.
:::

::: check
`t` is an array of 500 time stamps, shape `(500,)`. `c` is an array of 12 event times, shape `(12,)`. Write one expression that gives, for every time stamp and every event, the time stamp minus the event time. What is its shape, and which axis is which?
:::

::: answer
`t[:, None] - c`. The first operand has shape `(500, 1)`, and `c` is padded to `(1, 12)`. Right-aligned: 1 and 12 → 12, 500 and 1 → 500. The result is `(500, 12)`. Axis 0 runs over the time stamps and axis 1 over the events, so entry `[i, j]` is `t[i] - c[j]`.
:::

::: check
A colleague writes `w = x - m` where `x` has shape `(1_000_000,)` and `m` was built as `x.reshape(-1, 1).mean(axis=1, keepdims=True)` — they meant it to be the same length as `x`. The program slows to a crawl and then dies. What went wrong?
:::

::: answer
`m` has shape `(1_000_000, 1)`, a column. Right-aligned against `x`, which counts as a row `(1, 1_000_000)`, both axes stretch, and the result is `(1_000_000, 1_000_000)`: an outer combination. That is $10^{12}$ numbers, or $8 \times 10^{12}$ bytes (about 8 TB) of `float64`. The fix is to make both sides the same kind: `x - m[:, 0]`. An `assert w.shape == x.shape` would have caught it at once.
:::

::: check
Show that `np.broadcast_to(np.arange(3.0), (1000, 3))` uses no extra memory for its data, and explain why you cannot write into it.
:::

::: answer
Its strides are `(0, 8)`. Moving down one of the 1,000 rows moves 0 bytes, so all 1,000 rows are the same three `float64` numbers in memory — 24 bytes of data, not 24,000. You cannot write into it because a write to row 5 would also change row 0 and every other row: they are the same memory. NumPy marks the view read-only (`flags.writeable` is `False`) so that cannot happen by accident.
:::

::: check
You have `(N, 3)` positions `r` and a single ground-station position `g`, shape `(3,)`. Write the expression for the `(N,)` array of ranges from the station to each position, and say every shape along the way.
:::

::: answer
`np.sqrt(((r - g)**2).sum(axis=1))`. `r - g` is `(N, 3)` minus `(3,)`, padded to `(1, 3)`, so the result is `(N, 3)`: each row is that position minus the station. `**2` keeps `(N, 3)`. `.sum(axis=1)` adds the three components of each row, leaving `(N,)`. `np.sqrt` keeps `(N,)`. No `None` was needed: `g` really is one number per component.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Broadcasting | a smaller array's values are reused across a bigger shape, with no copying |
| The rule | right-align the shapes, pad on the left with 1s; each pair must be equal or contain a 1; the result takes the larger |
| Scalar | a plain number fits any shape |
| `(N, 3)` with `(3,)` | one value per component, applied to every row |
| `(N, 3)` with `(N,)` | fails; use `x[:, None]`, shape `(N, 1)`, for one value per row |
| `np.newaxis` | the same object as `None`; `x[:, None]` is `(N, 1)`, `x[None, :]` is `(1, N)` |
| `(3,1)` with `(1,4)` | `(3,4)`: outer combination, every row meets every column |
| Pairwise | `r[:, None, :] - r[None, :, :]` is `(N, N, 3)`; memory grows as $N^2$ |
| Stride 0 | a stretched axis moves 0 bytes; `np.broadcast_to` shows it |
| Error message | "could not be broadcast together with shapes …" — write the shapes right-aligned and find the clash |
| `np.broadcast_shapes` | computes the result shape from shapes alone |

The next lesson turns things around. Instead of stretching a small array up, a **reduction** such as `sum` or `mean` collapses a big array down along one axis — and `keepdims=True` leaves behind exactly the length-1 axis that broadcasting needs to put the result back against the original.

::: context broadcast-word One signal, many receivers
A radio station broadcasts: one transmitter sends one signal, and every radio in range plays the same program. Nobody makes a separate copy for each listener. NumPy borrowed the word for the same reason. One small array sends its values out to every row or column of a bigger one, and nothing is copied. The same idea, with the same right-aligned rule, appears in other array tools such as PyTorch and JAX.
:::

::: context gyro-bias Why every gyro has a bias
A spacecraft gyroscope (on small satellites usually a tiny vibrating chip, on bigger ones a fiber-optic or ring-laser gyro) measures turning rate. Tiny imperfections make it report a small rate even when nothing turns. That offset is the **bias**, and it drifts slowly with temperature and age. If you ignore it, integrating the rate over an hour turns a bias of 0.01 degrees per second into 36 degrees of attitude error. Navigation filters estimate the bias continuously and subtract it — one `(3,)` array against a stream of `(N, 3)` readings.
:::

::: context trailing-axis Lining shapes up on the right
The last axis is the "trailing" one, because it trails at the end of the shape. The rule compares the columns of the stack from right to left, padding missing axes with 1.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="34" font-size="12" fill="#6c7a93">A</text>
  <text x="20" y="72" font-size="12" fill="#6c7a93">B</text>
  <text x="20" y="130" font-size="12" fill="#6c7a93">result</text>
  <g font-size="14" text-anchor="middle" fill="#1f2a44">
    <rect x="90" y="16" width="44" height="26" fill="#fff" stroke="#1f2a44"/><text x="112" y="34">8</text>
    <rect x="150" y="16" width="44" height="26" fill="#fff" stroke="#1f2a44"/><text x="172" y="34">1</text>
    <rect x="210" y="16" width="44" height="26" fill="#fff" stroke="#1f2a44"/><text x="232" y="34">6</text>
    <rect x="270" y="16" width="44" height="26" fill="#fff" stroke="#1f2a44"/><text x="292" y="34">1</text>
    <rect x="90" y="54" width="44" height="26" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/><text x="112" y="72" fill="#6c7a93">1</text>
    <rect x="150" y="54" width="44" height="26" fill="#fff" stroke="#1f2a44"/><text x="172" y="72">7</text>
    <rect x="210" y="54" width="44" height="26" fill="#fff" stroke="#1f2a44"/><text x="232" y="72">1</text>
    <rect x="270" y="54" width="44" height="26" fill="#fff" stroke="#1f2a44"/><text x="292" y="72">5</text>
    <rect x="90" y="112" width="44" height="26" fill="#8fb8f0" stroke="#1d6fd1"/><text x="112" y="130">8</text>
    <rect x="150" y="112" width="44" height="26" fill="#8fb8f0" stroke="#1d6fd1"/><text x="172" y="130">7</text>
    <rect x="210" y="112" width="44" height="26" fill="#8fb8f0" stroke="#1d6fd1"/><text x="232" y="130">6</text>
    <rect x="270" y="112" width="44" height="26" fill="#8fb8f0" stroke="#1d6fd1"/><text x="292" y="130">5</text>
  </g>
  <line x1="80" y1="96" x2="324" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="112" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">padded 1</text>
  <text x="292" y="160" font-size="11" text-anchor="middle" fill="#1d6fd1">start here</text>
  <polygon points="330,160 320,155 320,165" fill="#1d6fd1"/>
</svg>
```

Here A is `(8, 1, 6, 1)` and B is `(7, 1, 5)`, padded on the left to `(1, 7, 1, 5)`. Every column holds a pair that is equal or contains a 1, so the result is `(8, 7, 6, 5)`.
:::

::: context outer-table The addition table
Remember the addition table from elementary school: numbers down the side, numbers across the top, and each box holds the side number plus the top number. That is exactly `a + b` with `a` of shape `(3, 1)` and `b` of shape `(1, 4)`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g font-size="13" text-anchor="middle">
    <rect x="110" y="12" width="50" height="28" fill="#f2b880" stroke="#1f2a44"/><text x="135" y="31" fill="#1f2a44">1</text>
    <rect x="160" y="12" width="50" height="28" fill="#f2b880" stroke="#1f2a44"/><text x="185" y="31" fill="#1f2a44">2</text>
    <rect x="210" y="12" width="50" height="28" fill="#f2b880" stroke="#1f2a44"/><text x="235" y="31" fill="#1f2a44">3</text>
    <rect x="260" y="12" width="50" height="28" fill="#f2b880" stroke="#1f2a44"/><text x="285" y="31" fill="#1f2a44">4</text>
    <rect x="50" y="48" width="50" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="75" y="67" fill="#1f2a44">0</text>
    <rect x="50" y="76" width="50" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="75" y="95" fill="#1f2a44">10</text>
    <rect x="50" y="104" width="50" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="75" y="123" fill="#1f2a44">20</text>
    <g fill="#1f2a44">
      <rect x="110" y="48" width="200" height="84" fill="#fff" stroke="#1f2a44"/>
      <text x="135" y="67">1</text><text x="185" y="67">2</text><text x="235" y="67">3</text><text x="285" y="67">4</text>
      <text x="135" y="95">11</text><text x="185" y="95">12</text><text x="235" y="95">13</text><text x="285" y="95">14</text>
      <text x="135" y="123">21</text><text x="185" y="123">22</text><text x="235" y="123">23</text><text x="285" y="123">24</text>
    </g>
  </g>
  <text x="75" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">a + b</text>
  <text x="75" y="150" font-size="11" text-anchor="middle" fill="#6c7a93">a: (3, 1)</text>
  <text x="210" y="150" font-size="11" text-anchor="middle" fill="#6c7a93">b: (1, 4) on top; result (3, 4)</text>
</svg>
```

Twelve boxes from seven numbers. With a thousand down the side and a thousand across the top, it is a million boxes from two thousand numbers — which is both the power and the danger.
:::

::: context conjunction-scale Why "every pair" is a real job
Operators of large constellations screen for possible close approaches, called **conjunctions**, between their satellites and everything else being tracked in orbit. Public catalogs list tens of thousands of objects. Checking every pair is an $N^2$ problem: doubling the catalog makes the work four times bigger. Real screening tools first throw out pairs that can never come close (their orbits never reach the same altitudes, for example) and only compute careful distances for the few that remain. The broadcasting trick in this lesson is perfect for a small cluster and a trap for a whole catalog.
:::

::: context stride-zero A stride of zero
A stride says how far to jump in memory to reach the next element along an axis. For a normal `(4, 3)` array of `float64`, the strides are `(24, 8)`: 24 bytes to the next row, 8 to the next column. A broadcast view of three numbers has strides `(0, 8)`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="24" font-size="12" fill="#1f2a44">memory: 3 numbers, 24 bytes</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="120" y="34" width="50" height="26" fill="#8fb8f0" stroke="#1d6fd1"/><text x="145" y="52">0.05</text>
    <rect x="170" y="34" width="50" height="26" fill="#8fb8f0" stroke="#1d6fd1"/><text x="195" y="52">-0.10</text>
    <rect x="220" y="34" width="50" height="26" fill="#8fb8f0" stroke="#1d6fd1"/><text x="245" y="52">0.10</text>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="20" y="92">row 0</text><text x="20" y="110">row 1</text><text x="20" y="128">row 2</text><text x="20" y="146">row 3</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2" fill="none">
    <path d="M62,88 C95,88 110,75 125,62"/>
    <path d="M62,106 C98,106 118,80 132,62"/>
    <path d="M62,124 C102,124 126,85 139,62"/>
    <path d="M62,142 C106,142 134,90 146,62"/>
  </g>
  <text x="200" y="100" font-size="12" fill="#b4232c">all 4 rows start at</text>
  <text x="200" y="116" font-size="12" fill="#b4232c">the same address:</text>
  <text x="200" y="132" font-size="12" fill="#b4232c">row stride 0 bytes</text>
</svg>
```

Every row points at the same three numbers. That is why the view is read-only.
:::

::: context keepdims-bridge Where the length-1 axes come from next
In this lesson you made length-1 axes by hand with `None`. The next lesson shows reductions such as `mean` and `sum`, and their `keepdims=True` option, which leaves the collapsed axis behind with length 1. That is exactly the shape broadcasting needs to subtract a per-row mean from every row, with no `None` at all. Later in the module, the lesson on products uses the same length-1 trick to turn a stack of vectors `(N, 3)` into a stack of columns `(N, 3, 1)` for batched matrix multiplication.
:::
