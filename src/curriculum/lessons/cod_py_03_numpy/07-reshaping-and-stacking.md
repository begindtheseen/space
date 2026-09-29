---
id: l07-reshaping-and-stacking
title: Reshaping, transposing and stacking
minutes: 21
covers:
  - reshape, ravel, transpose, stack, concatenate, C vs Fortran order
---

Take a carton of a dozen eggs. You can hold it as one long row of 12, as 2 rows of 6, or as 3 rows of 4. The eggs never move from their cups in the factory's long conveyor belt; only the way you *group* them changes. Now take two cartons and set them side by side, or one on top of the other — that is a different kind of change: you now have more eggs in one bigger arrangement.

NumPy has both kinds of change. **Reshaping** regroups the same numbers into a new shape, like the carton seen as 3 rows of 4. **Transposing** swaps which axis is rows and which is columns. **Stacking** and **concatenating** glue several arrays into one bigger one. None of them does arithmetic, and some of them do not even move a single byte.

These operations are the plumbing of flight-data code. A telemetry file arrives as one long run of numbers, `x0 y0 z0 x1 y1 z1 …`, and you need it as an `(N, 3)` table. Three separate arrays of x, y and z need to become one `(N, 3)` array of position vectors. A day of 10 Hz samples needs to become "seconds by samples" so the last lesson's `axis=` can average each second. The first lesson of this module promised to come back to strides and explain why some reshapes are free and others copy. This is that lesson.

## reshape: same numbers, new grouping

`a.reshape(shape)` returns the same elements, in the same order, grouped into a new shape. The number of elements must not change.

```python
import numpy as np

stream = np.arange(12.0)          # imagine x0 y0 z0 x1 y1 z1 ...
v = stream.reshape(4, 3)
print(v)
# [[ 0.  1.  2.]
#  [ 3.  4.  5.]
#  [ 6.  7.  8.]
#  [ 9. 10. 11.]]
print(v.shape, v.strides, v.base is stream)
# (4, 3) (24, 8) True
```

The numbers are read off the long row in order and poured into the new shape, **[[filling each row before starting the next|reshape-pour]]**. The first three become row 0 — the first vector — and so on. `v.base is stream` is `True`: `v` is a **view**, a new header over the same memory, exactly as in the lesson on views and copies. Its strides `(24, 8)` say "24 bytes to the next row, 8 bytes to the next column", which is how the long row of 8-byte numbers gets read as a table.

### Let NumPy work out one length: -1

You usually know one length and not the other. "I know these are 3-vectors; however many there are." Put `-1` for the length you do not know, and NumPy works it out from the total:

```python
print(stream.reshape(-1, 3).shape, stream.reshape(2, -1).shape, stream.reshape(2, 2, 3).shape)
# (4, 3) (2, 6) (2, 2, 3)
```

Read `reshape(-1, 3)` aloud as "whatever-by-three". Twelve elements in rows of 3 is 4 rows. Only one `-1` is allowed, and the lengths must divide exactly:

```python
stream.reshape(5, -1)
# ValueError: cannot reshape array of size 12 into shape (5,newaxis)
stream.reshape(-1, -1)
# ValueError: can only specify one unknown dimension
```

The first message says it plainly: 12 elements cannot be split into 5 equal rows.

::: key reshape and -1
`a.reshape(shape)` regroups the same elements, read in row-by-row order, into a new shape with the same total size. One length may be `-1`, meaning "work it out": `stream.reshape(-1, 3)` turns a flat run of $3N$ numbers into `(N, 3)`. When the memory layout allows it, the result is a view.
:::

::: example One second of 10 Hz data per row
A barometric altimeter logs altitude at 10 Hz, ten samples a second, for one minute: 600 numbers in a 1-D array. You want the average altitude of each second.

Regroup, then reduce. Sixty seconds of ten samples each is shape `(60, 10)`, and averaging each second means the 10 samples must disappear: `axis=1`, from the last lesson.

```python
rng = np.random.default_rng(2)
alt = 400.0 + np.arange(600) * 0.05 + rng.normal(0, 0.3, 600)   # m, climbing 0.5 m/s
per_s = alt.reshape(60, 10).mean(axis=1)
print(per_s.shape, per_s[:3].round(3), per_s[-1].round(3))
# (60,) [400.223 400.697 401.187] 429.607
print(alt[:10].mean().round(3))
# 400.223
```

Check the first entry against a direct average of the first ten samples: both are 400.223. Check the size of the numbers: the climb is 0.05 m per sample, so over 60 seconds the altitude rises about $0.05 \times 600 = 30$ m, and the last second's average is about 429.6 m — close to $400 + 30$, with a little noise. The reshape copied nothing: `np.shares_memory(alt.reshape(60, 10), alt)` is `True`.

This only works because `reshape` reads in row-by-row order. Samples 0 to 9 land in row 0, samples 10 to 19 in row 1, and so on — exactly one second per row. If the length is not a multiple of 10, trim first: `alt[: len(alt) // 10 * 10]`.
:::

## ravel and flatten: back to one long row

Going the other way — any shape down to 1-D — has two spellings that differ in one important way.

- **`a.ravel()`** returns a 1-D view when it can, and a copy only when it must.
- **`a.flatten()`** always returns a new copy.

```python
r = v.ravel(); f = v.flatten()
print(np.shares_memory(r, v), np.shares_memory(f, v))
# True False
r[0] = 99.0
print(v[0, 0])
# 99.0
f[1] = -1.0
print(v[0, 1])
# 1.0
```

Writing into the ravelled array changed `v`, because they share memory. Writing into the flattened one did not. Use `ravel` when you only want to read the numbers in a long line — it is free. Use `flatten` (or `ravel().copy()`) when you will change the result and the original must stay as it was.

::: key ravel vs flatten
`ravel()` gives a 1-D view when the layout allows, else a copy; `flatten()` always copies. `reshape(-1)` behaves like `ravel()`. Check with `np.shares_memory(a, b)` when it matters.
:::

## transpose: swap the axes

The **transpose** of a table swaps its rows and columns: row 0 becomes column 0. For a 2-D array, `a.T` does it. In the first lesson you saw that `.T` only rewrites the header — it swaps the shape and swaps the strides:

```python
t = v.T
print(t.shape, t.strides)
# (3, 4) (8, 24)
```

Now moving along a *row* of `t` jumps 24 bytes (one whole row of `v`), and moving down a *column* steps 8 bytes. Nothing was copied.

For arrays with more than two axes, `.T` reverses *all* the axes, which is rarely what you want. An `(N, 3, 3)` stack of matrices — `N` matrices, each 3 by 3 — has `.T` shape `(3, 3, N)`. What you almost always want is to transpose each matrix and leave the stack alone. Two ways to say it:

```python
S = np.zeros((5, 3, 3))
print(np.transpose(S, (0, 2, 1)).shape)
# (5, 3, 3)
print(S.swapaxes(1, 2).shape, S.swapaxes(-1, -2).strides)
# (5, 3, 3) (72, 8, 24)
print(S.T.shape)
# (3, 3, 5)
```

`np.transpose(S, (0, 2, 1))` lists the old axes in their new order: "axis 0 stays first, then old axis 2, then old axis 1". `S.swapaxes(1, 2)` says the same thing more briefly: "swap axes 1 and 2". Writing `swapaxes(-1, -2)` — "swap the last two" — works for any number of leading stack axes. The strides `(72, 8, 24)` show the last two strides swapped: still a view.

::: key transpose
`a.T` reverses all axes: for 2-D, rows become columns. `np.transpose(a, axes)` puts the axes in the order you list. `a.swapaxes(i, j)` swaps two axes. For a stack of matrices `(N, 3, 3)`, transpose each with `swapaxes(-1, -2)` or `np.transpose(S, (0, 2, 1))`, not `.T`. All of these are views: they only change shape and strides.
:::

::: warning Transposing a 1-D array does nothing
`np.arange(3.0).T.shape` is `(3,)`. A 1-D array has one axis, and reversing one axis leaves it alone. There is no "row vector" or "column vector" in 1-D. If you need a column, add an axis: `x[:, None]` gives `(3, 1)`, as in the broadcasting lesson.
:::

## C order and Fortran order

A computer's memory is one long street of bytes. A 2-D table has to be laid down that street in *some* order, and there are two natural choices.

- **C order** (also called **row-major**): lay down row 0, then row 1, then row 2. Moving along a row steps through neighboring memory. This is NumPy's default, and the C and C++ languages' order.
- **Fortran order** (also called **column-major**): lay down column 0, then column 1. Moving down a column steps through neighboring memory. This is the order of **[[Fortran|fortran-history]]**, MATLAB, and the classic linear-algebra libraries.

You can see the difference in the strides. A `(1000, 3)` array of `float64`:

```python
c = np.zeros((1000, 3))
f = np.zeros((1000, 3), order='F')
print(c.strides, f.strides)
# (24, 8) (8, 8000)
```

In C order, the next element along the row (axis 1) is 8 bytes away and the next row is 24 bytes away. In Fortran order it is the other way round: the next element down a column (axis 0) is 8 bytes away, and the next column is $1000 \times 8 = 8000$ bytes away. **[[The axis with the smallest stride|c-vs-f-picture]]** is the one that is **contiguous** — its neighbors sit side by side in memory.

Look back at `v.T`: its strides were `(8, 24)`. A C-order array's transpose *is* a Fortran-order array, with no copying. `t.flags['F_CONTIGUOUS']` is `True`.

### Order changes what reshape and ravel do

`reshape` and `ravel` take an `order=` argument too. It says in which order to *read* the old elements and *fill* the new shape:

```python
a = np.arange(6).reshape(2, 3)
print(a.ravel(order='C'), a.ravel(order='F'))
# [0 1 2 3 4 5] [0 3 1 4 2 5]
print(a.reshape(3, 2, order='F'))
# [[0 4]
#  [3 2]
#  [1 5]]
```

With `order='F'`, `ravel` walks down each column first: 0, 3, then 1, 4, then 2, 5. `reshape(3, 2, order='F')` reads that way and fills the new shape column by column too, so the first column of the result is 0, 3, 1.

This is also why some reshapes must copy. A reshape can be a view only if the new shape can be walked with fixed strides over the old memory. The transpose `v.T` is laid out column by column, so reading it row by row jumps around:

```python
w = v.T.reshape(12)
print(w, np.shares_memory(w, v))
# [99.  3.  6.  9.  1.  4.  7. 10.  2.  5.  8. 11.] False
```

(The 99 is from the ravel demonstration above.) The numbers `99, 3, 6, 9` are 24 bytes apart in memory, but then `1` is back near the start. No single stride can describe that walk, so NumPy quietly made a copy. That is fine — but it means writing into `w` will never change `v`.

::: key C order vs Fortran order
C order vs Fortran order determines which axis is contiguous in memory, so it changes cache behavior of loops and reductions and whether a reshape can be a view. It also matters at library boundaries: LAPACK and Eigen default to column-major. NumPy defaults to C order (row-major, last axis contiguous); `order='F'` gives column-major (first axis contiguous). The transpose of a C-order array is a Fortran-order view.
:::

### When order changes speed

Reading memory in order is fast because the processor fetches it in chunks called **[[cache lines|cache-line]]**, typically 64 bytes, and guesses what you will need next. Striding across memory wastes most of each chunk. Here is a Python loop that sums a 4000-by-4000 array one row at a time, run on a C-order copy and a Fortran-order copy of the same numbers:

```python
import timeit

rng = np.random.default_rng(0)
C = rng.normal(size=(4000, 4000))
F = np.asfortranarray(C)

def rows(a):
    s = 0.0
    for i in range(a.shape[0]):
        s += a[i].sum()
    return s

for name, a in [("C", C), ("F", F)]:
    t = min(timeit.repeat(lambda: rows(a), number=3, repeat=5)) / 3
    print(name, "row loop", round(t * 1e3, 1), "ms")
# C row loop 9.9 ms
# F row loop 121.0 ms
```

On the machine used to write this lesson, the Fortran copy was 6 to 13 times slower over several runs (the C time wobbled between 9 and 18 ms; the Fortran time stayed near 120 ms), because each row of it is scattered 32,000 bytes apart. But when NumPy does the whole reduction itself — `a.sum(axis=0)` or `a.sum(axis=1)` — every timing, in either order, landed between about 4.5 and 5.8 ms. NumPy picks a good walking order for its own loops. The order matters most when *your* code walks the array one piece at a time, or when you hand the raw memory to another library.

::: warning Library boundaries expect a layout
When you pass an array's raw memory to C, C++, Fortran or GPU code (through a compiled extension, a shared-memory buffer or a binary file another tool reads), that code assumes a layout. **[[LAPACK and Eigen|lapack-eigen]]** assume column-major unless told otherwise. A `(3, N)` C-order array handed to a column-major reader comes out as the transposed data, with no error. Use `np.ascontiguousarray` or `np.asfortranarray` to get the layout the other side expects, and write the expected order in the interface's documentation.
:::

## Gluing arrays: stack and concatenate

Now the second kind of change: several arrays in, one bigger array out. The question to ask is **does the result have a new axis, or a longer old one?**

- **`np.concatenate(arrays, axis=k)`** joins arrays *along an existing axis*. No new axis; axis `k` gets longer. The arrays must match on every other axis.
- **`np.stack(arrays, axis=k)`** puts the arrays side by side along a *new* axis at position `k`. The arrays must all have exactly the same shape, and the result has one more axis.

```python
a = np.zeros((4, 3)); b = np.ones((2, 3))
print(np.concatenate([a, b]).shape)          # default axis=0
# (6, 3)
np.concatenate([a, b], axis=1)
# ValueError: all the input array dimensions except for the concatenation axis must match exactly,
#   but along dimension 0, the array at index 0 has size 4 and the array at index 1 has size 2
np.stack([a, b])
# ValueError: all input arrays must have the same shape
print(np.stack([a, a]).shape, np.stack([a, a], axis=-1).shape)
# (2, 4, 3) (4, 3, 2)
```

Concatenating 4 rows and 2 rows gives 6 rows — the usual "append more samples" operation. Joining them side by side along axis 1 fails, because 4 rows cannot sit next to 2 rows. `stack` refuses different shapes outright, and with two `(4, 3)` arrays it makes a new axis of length 2, first by default or last with `axis=-1`.

::: example Three component arrays into one array of vectors
A **[[relative-navigation sensor|relnav]]** gives the position of a docking target in three separate arrays, one per component, in meters. You want the standard `(N, 3)` layout: one row per sample, one column per component.

```python
x = np.array([12.0, 13.5, 15.0, 16.4])   # m
y = np.array([10.0, 17.6, 25.1, 32.7])
z = np.array([ 0.0,  0.4,  0.8,  1.2])

r = np.stack([x, y, z], axis=1)
print(r.shape)
# (4, 3)
print(r)
# [[12.  10.   0. ]
#  [13.5 17.6  0.4]
#  [15.  25.1  0.8]
#  [16.4 32.7  1.2]]
```

Three arrays of shape `(4,)` stacked along a new axis 1 give `(4, 3)`. Row 0 is `(12.0, 10.0, 0.0)` — the first x, first y and first z, which is the first position vector. Check one more: row 3 should be the last x, y and z, `(16.4, 32.7, 1.2)`. It is.

With `axis=0` (the default) you would get `(3, 4)` instead: one *row* per component, which is the column-per-sample layout the broadcasting lesson warned about. And `np.concatenate([x, y, z])` would give a flat `(12,)` array — all the x values, then all the y values — with no axis at all separating them.

Now add a time column so each row reads `t, x, y, z`:

```python
t = np.array([0.0, 10.0, 20.0, 30.0])     # s
print(np.column_stack([t, r]).shape)
# (4, 4)
```

`column_stack` treats the 1-D `t` as a column, `(4, 1)`, and joins it to the `(4, 3)` array along axis 1. The spelled-out version is `np.concatenate([t[:, None], r], axis=1)`.
:::

### The shortcuts: vstack, hstack, column_stack

Three helpers wrap `concatenate` with a guess about what 1-D arrays mean:

| Function | Joins along | What it does with 1-D inputs |
| --- | --- | --- |
| `np.vstack` | axis 0 (rows) | treats each as a row `(1, N)`, so three `(4,)` give `(3, 4)` |
| `np.hstack` | axis 1 for 2-D, axis 0 for 1-D | joins them end to end: three `(4,)` give `(12,)` |
| `np.column_stack` | axis 1 (columns) | treats each as a column `(N, 1)`, so three `(4,)` give `(4, 3)` |

```python
print(np.column_stack([x, y, z]).shape)
# (4, 3)
print(np.vstack([x, y, z]).shape, np.hstack([x, y, z]).shape)
# (3, 4) (12,)
```

For 2-D inputs, `vstack` is `concatenate(axis=0)` and `hstack` is `concatenate(axis=1)`. The 1-D behavior is where people get surprised: `hstack` of three component arrays does *not* give vectors.

::: key stack vs concatenate
`np.concatenate` joins along an existing axis (the result has the same number of axes, one of them longer). `np.stack` joins along a new axis (all inputs the same shape; one extra axis). `np.stack([x, y, z], axis=1)` and `np.column_stack([x, y, z])` turn three `(N,)` arrays into `(N, 3)`. `vstack` gives `(3, N)`; `hstack` of 1-D arrays gives `(3N,)`. Stacking and concatenating always copy.
:::

::: warning Do not grow an array inside a loop
`np.concatenate` makes a brand-new array every time, copying everything. Calling it once per sample in a loop — `data = np.concatenate([data, new_row[None]])` — [[copies the whole growing array again and again|grow-loop]], so a run of $N$ samples costs about $N^2 / 2$ row copies. Collect pieces in a Python list and call `np.stack` or `np.concatenate` once at the end, or allocate with `np.zeros((N, 3))` up front and fill rows.
:::

## Check yourself

::: check
A binary file holds 3,000,000 `float64` numbers written as `x y z x y z …`. After loading them into a 1-D array `raw`, what one call gives you the `(N, 3)` array of vectors, and what is `N`? Does it copy?
:::

::: answer
`raw.reshape(-1, 3)`. The `-1` is worked out as $3{,}000{,}000 / 3 = 1{,}000{,}000$, so the result is `(1000000, 3)`. Because the numbers were written x, y, z for one sample and then the next, row-by-row filling puts each sample's three components in one row. `raw` is contiguous, so the reshape is a view: no copy, no extra memory.
:::

::: check
`A` has shape `(2, 3)` and holds `[[0, 1, 2], [3, 4, 5]]`. Write out `A.ravel()`, `A.ravel(order='F')`, and `A.T.ravel()`. Which of the three share memory with `A`?
:::

::: answer
`A.ravel()` reads row by row: `[0, 1, 2, 3, 4, 5]`, a view. `A.ravel(order='F')` reads column by column: `[0, 3, 1, 4, 2, 5]`. `A.T` is `[[0, 3], [1, 4], [2, 5]]`, and ravelling it row by row gives the same `[0, 3, 1, 4, 2, 5]`. Those last two must be copies: the order 0, 3, 1, … jumps forward 3 elements then back 2, which no single stride can describe. Only the first shares memory with `A`.
:::

::: check
`Cs` is a stack of 500 rotation matrices, shape `(500, 3, 3)`. Your colleague writes `Cs.T` to get each matrix's transpose. What shape do they get, and what should they have written?
:::

::: answer
`.T` reverses all three axes, giving `(3, 3, 500)`: not a stack of transposed matrices, but a completely rearranged array. They wanted `Cs.swapaxes(-1, -2)` or `np.transpose(Cs, (0, 2, 1))`, both of shape `(500, 3, 3)`, where entry `[n, i, j]` is the old entry `[n, j, i]`. Both are free views. The next lesson uses exactly this to rotate vectors back the other way.
:::

::: check
You have 24 hourly arrays, each `(3600, 3)` — one per hour of a day of one-second gyro samples. Give the shape produced by (a) `np.concatenate(hours)`, (b) `np.stack(hours)`, (c) `np.stack(hours, axis=1)`. Which would you use to compute the mean of each hour with a reduction?
:::

::: answer
(a) Joined along the existing axis 0: `(86400, 3)`, one long day of samples. (b) A new axis in front: `(24, 3600, 3)`. (c) A new axis in position 1: `(3600, 24, 3)`. For hourly means, (b) is the natural one: `np.stack(hours).mean(axis=1)` removes the 3,600 samples and leaves `(24, 3)`, one mean vector per hour. (You could also get there from (a) with `.reshape(24, 3600, 3)`, since the hours were concatenated in order.)
:::

::: check
Why is `np.zeros((1000, 3), order='F')` strides `(8, 8000)` and not `(8, 24)`?
:::

::: answer
In Fortran order the first axis is contiguous: stepping down a column moves to the next element in memory, 8 bytes. To step to the next column, you must skip the entire first column, which is 1,000 elements of 8 bytes: 8,000 bytes. The `(8, 24)` pattern belongs to the transpose of a `(4, 3)` C-order array, where each column of the transposed view is only 3 elements long.
:::

## Summary

| Operation | What it does | View or copy |
| --- | --- | --- |
| `a.reshape(s)` | same elements, new grouping, filled row by row | view when the layout allows |
| `reshape(-1, 3)` | "whatever by three"; one `-1` allowed | as above |
| `a.ravel()` | to 1-D | view when possible |
| `a.flatten()` | to 1-D | always a copy |
| `a.T` | reverse all axes | view |
| `np.transpose(a, axes)`, `swapaxes` | reorder or swap chosen axes | view |
| C order | row-major, last axis contiguous, NumPy's default | strides like `(24, 8)` |
| Fortran order | column-major, first axis contiguous | strides like `(8, 8000)` |
| `np.concatenate` | join along an existing axis | copy |
| `np.stack` | join along a new axis | copy |
| `column_stack`, `vstack`, `hstack` | shortcuts; watch what they do with 1-D inputs | copy |

The next lesson is where arrays start behaving like the vectors and matrices of mechanics: `@` for matrix products, `np.cross` for cross products, and `einsum` for anything with named axes — including rotating a million vectors by a direction cosine matrix in one line, with the transpose from this lesson doing the key work.

::: context reshape-pour Pouring the carton
Reshape never moves a number. It reads the elements in order and pours them into the new shape, one row at a time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <g stroke="#1f2a44">
      <rect x="18" y="20" width="27" height="24" fill="#8fb8f0"/><rect x="45" y="20" width="27" height="24" fill="#8fb8f0"/><rect x="72" y="20" width="27" height="24" fill="#8fb8f0"/>
      <rect x="99" y="20" width="27" height="24" fill="#fff"/><rect x="126" y="20" width="27" height="24" fill="#fff"/><rect x="153" y="20" width="27" height="24" fill="#fff"/>
      <rect x="180" y="20" width="27" height="24" fill="#f2b880"/><rect x="207" y="20" width="27" height="24" fill="#f2b880"/><rect x="234" y="20" width="27" height="24" fill="#f2b880"/>
      <rect x="261" y="20" width="27" height="24" fill="#fff"/><rect x="288" y="20" width="27" height="24" fill="#fff"/><rect x="315" y="20" width="27" height="24" fill="#fff"/>
    </g>
    <text x="31" y="36">0</text><text x="58" y="36">1</text><text x="85" y="36">2</text><text x="112" y="36">3</text><text x="139" y="36">4</text><text x="166" y="36">5</text>
    <text x="193" y="36">6</text><text x="220" y="36">7</text><text x="247" y="36">8</text><text x="274" y="36">9</text><text x="301" y="36">10</text><text x="328" y="36">11</text>
    <g stroke="#1f2a44">
      <rect x="120" y="76" width="40" height="22" fill="#8fb8f0"/><rect x="160" y="76" width="40" height="22" fill="#8fb8f0"/><rect x="200" y="76" width="40" height="22" fill="#8fb8f0"/>
      <rect x="120" y="98" width="40" height="22" fill="#fff"/><rect x="160" y="98" width="40" height="22" fill="#fff"/><rect x="200" y="98" width="40" height="22" fill="#fff"/>
      <rect x="120" y="120" width="40" height="22" fill="#f2b880"/><rect x="160" y="120" width="40" height="22" fill="#f2b880"/><rect x="200" y="120" width="40" height="22" fill="#f2b880"/>
      <rect x="120" y="142" width="40" height="22" fill="#fff"/><rect x="160" y="142" width="40" height="22" fill="#fff"/><rect x="200" y="142" width="40" height="22" fill="#fff"/>
    </g>
    <text x="140" y="91">0</text><text x="180" y="91">1</text><text x="220" y="91">2</text>
    <text x="140" y="113">3</text><text x="180" y="113">4</text><text x="220" y="113">5</text>
    <text x="140" y="135">6</text><text x="180" y="135">7</text><text x="220" y="135">8</text>
    <text x="140" y="157">9</text><text x="180" y="157">10</text><text x="220" y="157">11</text>
  </g>
  <text x="18" y="14" font-size="11" fill="#6c7a93">stream, shape (12,)</text>
  <text x="250" y="124" font-size="11" fill="#6c7a93">reshape(4, 3)</text>
  <line x1="180" y1="48" x2="180" y2="68" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="180,74 175,64 185,64" fill="#1d6fd1"/>
</svg>
```

Each group of three becomes one row, so one colored band of the stream is one vector of the table.
:::

::: context fortran-history Why it is called Fortran order
Fortran, from "formula translation", was one of the first programming languages, released by IBM in 1957 for scientific computing. It stores a 2-D array column by column. C, from the early 1970s, chose row by row. Decades of numerical code — including the linear-algebra libraries that NumPy, MATLAB and most engineering tools still call under the hood — were written in Fortran, so column-major order never went away. Many orbit and trajectory codes in the aerospace world are still Fortran today.
:::

::: context c-vs-f-picture The same table, laid down two ways
A 2-by-3 table has to go into memory as one line of six boxes. The arrows show which neighbor comes next in memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1d6fd1">C order (row-major)</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#b4232c">Fortran order (column-major)</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <g stroke="#1f2a44" fill="#fff">
      <rect x="30" y="30" width="40" height="28"/><rect x="70" y="30" width="40" height="28"/><rect x="110" y="30" width="40" height="28"/>
      <rect x="30" y="58" width="40" height="28"/><rect x="70" y="58" width="40" height="28"/><rect x="110" y="58" width="40" height="28"/>
      <rect x="210" y="30" width="40" height="28"/><rect x="250" y="30" width="40" height="28"/><rect x="290" y="30" width="40" height="28"/>
      <rect x="210" y="58" width="40" height="28"/><rect x="250" y="58" width="40" height="28"/><rect x="290" y="58" width="40" height="28"/>
    </g>
    <text x="50" y="49">0</text><text x="90" y="49">1</text><text x="130" y="49">2</text>
    <text x="50" y="77">3</text><text x="90" y="77">4</text><text x="130" y="77">5</text>
    <text x="230" y="49">0</text><text x="270" y="49">1</text><text x="310" y="49">2</text>
    <text x="230" y="77">3</text><text x="270" y="77">4</text><text x="310" y="77">5</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <path d="M56,42 L84,42"/><path d="M96,42 L124,42"/><path d="M134,50 L56,68"/><path d="M56,70 L84,70"/><path d="M96,70 L124,70"/>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" fill="none">
    <path d="M230,52 L230,64"/><path d="M236,66 L264,40"/><path d="M270,52 L270,64"/><path d="M276,66 L304,40"/><path d="M310,52 L310,64"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <g stroke="#1d6fd1" fill="#8fb8f0">
      <rect x="15" y="110" width="25" height="24"/><rect x="40" y="110" width="25" height="24"/><rect x="65" y="110" width="25" height="24"/>
      <rect x="90" y="110" width="25" height="24"/><rect x="115" y="110" width="25" height="24"/><rect x="140" y="110" width="25" height="24"/>
    </g>
    <text x="27" y="127">0</text><text x="52" y="127">1</text><text x="77" y="127">2</text><text x="102" y="127">3</text><text x="127" y="127">4</text><text x="152" y="127">5</text>
    <g stroke="#b4232c" fill="#f2b880">
      <rect x="195" y="110" width="25" height="24"/><rect x="220" y="110" width="25" height="24"/><rect x="245" y="110" width="25" height="24"/>
      <rect x="270" y="110" width="25" height="24"/><rect x="295" y="110" width="25" height="24"/><rect x="320" y="110" width="25" height="24"/>
    </g>
    <text x="207" y="127">0</text><text x="232" y="127">3</text><text x="257" y="127">1</text><text x="282" y="127">4</text><text x="307" y="127">2</text><text x="332" y="127">5</text>
  </g>
  <text x="90" y="156" font-size="11" text-anchor="middle" fill="#6c7a93">memory; strides (24, 8)</text>
  <text x="270" y="156" font-size="11" text-anchor="middle" fill="#6c7a93">memory; strides (8, 16)</text>
  <text x="180" y="180" font-size="11" text-anchor="middle" fill="#6c7a93">int64 elements, 8 bytes each</text>
</svg>
```

Same table, same values; only the street order and the strides differ.
:::

::: context cache-line Why neighbors are fast
The processor does not fetch one number from main memory at a time. It fetches a **cache line**, usually 64 bytes — eight `float64` numbers — into a small, very fast memory called the cache, and it prefetches the next lines when it sees you walking forward. Reading neighbors uses all eight numbers of each line. Jumping 32,000 bytes each step uses one number and throws away the other seven, and the prefetcher cannot keep up. Main memory is roughly a hundred times slower to reach than the nearest cache, so the walking order can matter more than the arithmetic.
:::

::: context lapack-eigen The libraries under the hood
**LAPACK** ("Linear Algebra PACKage") is the standard library of routines for solving equations, least squares and eigenvalues, written in Fortran and column-major. `np.linalg` calls it for you and takes care of the layout, so inside NumPy you rarely notice. **Eigen** is a C++ matrix library used widely in robotics and flight software; its matrices are column-major by default too. The layout bites when you pass bare memory across that boundary yourself, for example from a Python ground tool to a C++ flight-software simulator.
:::

::: context relnav What a relative-navigation sensor measures
When a spacecraft docks, it cares less about where it is around the Earth than about where the docking port is relative to itself. Relative-navigation sensors — lidars that time laser pulses, and cameras that track targets painted on the station — report the target's position in the vehicle's own frame, often as three separate channels. Cargo and crew vehicles approaching the International Space Station use sensors like these for the last few hundred meters. Before any math can be done on those channels, they are stacked into one `(N, 3)` array of vectors.
:::

::: context grow-loop Why appending to an array is slow and to a list is not
A NumPy array is one fixed block of memory, so making it one row longer means allocating a new block and copying everything across. Do that for every sample and the copying adds up to $1 + 2 + \dots + N \approx N^2 / 2$ rows. A Python list is different: when it runs out of room it grabs extra spare space, so most appends cost almost nothing, and the total work grows only in proportion to $N$. That is why "append to a list, convert once" is the standard pattern.
:::
