---
id: l04-fancy-indexing-and-masks
title: Fancy indexing and boolean masks
minutes: 22
covers:
  - "Indexing and slicing; views vs copies; base; fancy indexing and boolean masks"
---

A coach wants some players for a drill. There are two ways to call them. She can read out shirt numbers: "7, 2, 7 again, 11." Or she can hand the team a checklist with a yes or a no next to every name: "everyone with a yes, step forward." Either way the chosen players form a new line, separate from the bench. Sending someone in the new line for water does not change who sits on the bench.

Those are the two indexing tools in this lesson. Picking elements by a list of positions is called **fancy indexing** (its official name is *integer-array indexing*). Picking them with an array of `True`/`False` values is called **boolean masking**, and the True/False array is the **mask**. Together, NumPy's documentation calls them **[[advanced indexing|advanced-name]]**.

They are the everyday tools of telemetry work: drop the samples where a sensor failed, keep the rows above 10 km, clip every rate above a limit, find the first moment a value crossed a threshold. And they come with a rule that mirrors lesson 3: advanced indexing always makes a **copy** — yet assigning through it still writes into the original. This lesson shows why those two facts do not contradict each other.

## Picking by position: fancy indexing

Put a list (or an integer array) of positions inside the square brackets, and you get those elements, in that order. Here is the distance a dropped test article has fallen, in meters, sampled every half second:

```python
>>> import numpy as np
>>> alt = np.array([0.0, 1.2, 4.9, 11.0, 19.6, 30.6, 44.1, 60.0])
>>> alt[[1, 3, 5]]
array([ 1.2, 11. , 30.6])
>>> idx = np.array([7, 0, 7, 2])
>>> alt[idx]
array([60. ,  0. , 60. ,  4.9])
>>> alt[[-1, -2]]
array([60. , 44.1])
>>> alt[[8]]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
IndexError: index 8 is out of bounds for axis 0 with size 8
```

Notice the double square brackets in `alt[[1, 3, 5]]`. The outer pair is the indexing; the inner pair is the list of positions. Read it "alt at positions 1, 3 and 5". The result has one element per position in the list, so:

- the order follows the list, not the array — `alt[idx]` starts with element 7;
- a position can repeat — 7 appears twice, so 60.0 appears twice;
- negative positions count from the end, as usual;
- a position past the end is an error. Unlike a slice, a list of positions never stops quietly.

With a 2-D array, a list on one axis picks whole rows or columns:

```python
>>> m = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
>>> m[[0, 2]]
array([[1, 2, 3],
       [7, 8, 9]])
>>> m[:, [2, 0]]
array([[3, 1],
       [6, 4],
       [9, 7]])
>>> m[[0, 2], [1, 2]]
array([2, 9])
>>> m[np.ix_([0, 2], [1, 2])]
array([[2, 3],
       [8, 9]])
```

`m[[0, 2]]` is rows 0 and 2. `m[:, [2, 0]]` is "all rows, columns 2 then 0" — column order swapped.

The third line is the one that surprises everyone. With a list on **both** axes, NumPy does not make a block. It **[[pairs the lists up|pairs-not-block]]**, position by position: element `(0, 1)` and element `(2, 2)`, which are 2 and 9. To get the $2 \times 2$ block of rows 0 and 2 and columns 1 and 2, use the helper `np.ix_`, as in the fourth line.

::: key
Fancy indexing `a[[i0, i1, ...]]` returns the elements at those positions, in that order, repeats allowed. On a 2-D array, `a[[r0, r1]]` picks rows and `a[:, [c0, c1]]` picks columns. `a[rows, cols]` with two lists pairs them up element by element; `a[np.ix_(rows, cols)]` gives the block.
:::

## Why fancy indexing has to copy

In lesson 3 a slice was a view because it could be described by a new header: a starting point, a length and one even step per axis. Try that with `alt[[7, 0, 7, 2]]`. The positions jump forward, back, forward again, and repeat. There is no single stride that **[[walks that path|no-single-stride]]**. So NumPy has no choice: it allocates a new block and copies the chosen numbers into it.

Prove it with the tests from lesson 3:

```python
>>> alt = np.array([0.0, 1.2, 4.9, 11.0, 19.6, 30.6, 44.1, 60.0])
>>> pick = alt[[1, 3, 5]]
>>> np.shares_memory(alt, pick)
False
>>> pick.base is alt
False
>>> pick[0] = -1.0
>>> alt
array([ 0. ,  1.2,  4.9, 11. , 19.6, 30.6, 44.1, 60. ])
```

No shared memory, a base that is not `alt`, and writing into `pick` left `alt` unchanged. All three tests say copy.

NumPy copies even when your positions happen to be evenly spaced: `alt[[0, 2, 4, 6]]` is a copy though `alt[::2]` is a view of the same elements. NumPy decides by the *kind* of index — a list or array means copy — not by the numbers inside it.

::: warning `.base` is not always None for a copy
A fancy-indexed result sometimes has a `.base` that is a temporary array NumPy made along the way:

```python
>>> m = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
>>> cols = m[:, [2, 0]]
>>> cols.base is None, cols.base is m
(False, False)
>>> np.shares_memory(m, cols)
False
```

So "is the base `None`?" is the wrong test. Ask `np.shares_memory`, which is always the final word.
:::

## Boolean masks

A comparison between an array and a number is done **element-wise**, like arithmetic. The result is an array of `True` and `False`, the same shape as the original, with dtype `bool`:

```python
>>> alt = np.array([0.0, 1.2, 4.9, 11.0, 19.6, 30.6, 44.1, 60.0])
>>> fast = alt > 15.0
>>> fast
array([False, False, False, False,  True,  True,  True,  True])
>>> fast.dtype, fast.shape
(dtype('bool'), (8,))
>>> alt[fast]
array([19.6, 30.6, 44.1, 60. ])
```

That True/False array is a mask. Put it inside the square brackets and you get the elements where the mask is `True`, in their original order. Picture the mask as a **[[stencil with holes|mask-stencil]]** laid over the data. The mask must be the same length as the axis it selects along.

Masks are handy for counting. `True` counts as 1 and `False` as 0 in arithmetic, as you saw in the basics module, so `.sum()` counts the `True`s and `.mean()` gives the fraction that are `True`:

```python
>>> fast.sum()
np.int64(4)
>>> fast.mean()
np.float64(0.5)
>>> fast.any(), fast.all()
(np.True_, np.False_)
```

Four of the eight samples are beyond 15 m, which is a fraction of 0.5. `.any()` asks "is at least one `True`?" and `.all()` asks "are they all `True`?" NumPy 2 shows a single True/False result as **[[np.True_ and np.False_|numpy-bool-scalar]]**; they behave like `True` and `False`.

A mask made from one column can select whole rows of a table. Here is the gyro log from lesson 3 again (columns: time, then x, y and z rates in deg/s):

```python
>>> tel = np.array([[0.0, 0.12, -0.03, 0.01], [0.1, 0.15, -0.02, 0.00], [0.2, 0.11, -0.04, 0.02], [0.3, 0.14, -0.03, 0.01], [0.4, 0.13, -0.05, 0.03]])
>>> t = tel[:, 0]
>>> gx = tel[:, 1]
>>> tel[gx > 0.125]
array([[ 0.1 ,  0.15, -0.02,  0.  ],
       [ 0.3 ,  0.14, -0.03,  0.01],
       [ 0.4 ,  0.13, -0.05,  0.03]])
>>> tel[gx > 0.125].shape
(3, 4)
>>> tel[tel > 0.1]
array([0.12, 0.15, 0.2 , 0.11, 0.3 , 0.14, 0.4 , 0.13])
```

`gx > 0.125` has one `True`/`False` per row, so `tel[gx > 0.125]` keeps whole rows: the three samples with an x rate above 0.125 deg/s. A mask shaped like the whole table, like `tel > 0.1`, picks single elements instead, and the result is flattened into one row, since they no longer form a rectangle.

Masking copies, for the same reason fancy indexing does: the kept elements are scattered. The same three tests prove it:

```python
>>> kept = alt[fast]
>>> np.shares_memory(alt, kept)
False
>>> kept[0] = 0.0
>>> alt[4]
np.float64(19.6)
```

::: key
A comparison such as `a > 15.0` gives a `bool` array of the same shape: a mask. `a[mask]` returns the elements where the mask is `True`, as a new 1-D array (or whole rows, when a 1-D mask indexes the rows of a table). `mask.sum()` counts the `True`s, `mask.mean()` gives their fraction, and `.any()` and `.all()` reduce a mask to one answer. Fancy indexing and boolean masking always copy.
:::

## Combining masks: &, | and ~

Real conditions have more than one part: "between 0.1 s and 0.3 s, **and** the rates are calm". Masks combine with three operators, each working element by element:

| Operator | Read it | `True` where |
| --- | --- | --- |
| `a & b` | "a and b" | both are `True` |
| `a \| b` | "a or b" | at least one is `True` |
| `~a` | "not a" | `a` is `False` |

```python
>>> gz = tel[:, 3]
>>> in_window = (t >= 0.1) & (t <= 0.3)
>>> in_window
array([False,  True,  True,  True, False])
>>> calm = (np.abs(gx) < 0.14) & (np.abs(gz) < 0.025)
>>> calm
array([ True, False,  True, False, False])
>>> tel[in_window & calm]
array([[ 0.2 ,  0.11, -0.04,  0.02]])
>>> ~calm
array([False,  True, False,  True,  True])
>>> tel[(gx > 0.14) | (gz > 0.025)]
array([[ 0.1 ,  0.15, -0.02,  0.  ],
       [ 0.4 ,  0.13, -0.05,  0.03]])
```

`np.abs` is the element-wise absolute value. Check `calm` by hand: row 0 passes both tests; row 1 fails because 0.15 is not below 0.14; row 3 fails because 0.14 is not *below* 0.14. Only row 2 is both in the window and calm.

Every comparison inside a combination needs its own **parentheses**. Leave them out and Python reads it differently, because `&` and `|` **[[bind more tightly|precedence]]** than `<` and `>=`:

```python
>>> tel[t >= 0.1 & t <= 0.3]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: ufunc 'bitwise_and' not supported for the input types, and the inputs could not be safely coerced to any supported types according to the casting rule ''safe''
```

Python grouped it as `t >= (0.1 & t) <= 0.3` and tried to compute `0.1 & t` first. `&` on floats is meaningless, hence the error. With integer arrays the same mistake fails a step later, with the `ValueError` shown next.

And you cannot use the words `and`, `or` and `not`:

```python
>>> tel[(t >= 0.1) and (t <= 0.3)]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ValueError: The truth value of an array with more than one element is ambiguous. Use a.any() or a.all()
```

The keyword `and` asks each side one yes-or-no question: "is this whole thing true?" Five `True`/`False` values have no single answer — true if *any* is `True`, or only if *all* are? NumPy **[[refuses to guess|ambiguous]]** and raises this error. The same error appears for `if mask:` and `while mask:`. The fix depends on what you meant: `&`/`|` for element-by-element logic, or `mask.any()`/`mask.all()` when you really want one answer for an `if`.

::: warning The two ways to break a combined mask
Write `(a > 1) & (a < 5)`, never `a > 1 & a < 5` (wrong grouping) and never `(a > 1) and (a < 5)` (the "truth value of an array is ambiguous" `ValueError`). In an `if`, say which question you mean: `if mask.any():` or `if mask.all():`.
:::

::: key
Combine masks element-wise with `&` (and), `|` (or) and `~` (not), and wrap every comparison in parentheses: `(t >= 0.1) & (t <= 0.3)`. The keywords `and`, `or`, `not` and a bare `if mask:` raise `ValueError: The truth value of an array with more than one element is ambiguous`; use `.any()` or `.all()` when you need one answer.
:::

## Assigning through a mask writes in place

So far we have been *reading*: `y = x[mask]` makes a copy. *Writing* is different. With a fancy index or a mask on the **left** of `=`, NumPy writes straight into the original array:

```python
>>> rate = np.array([0.4, -0.2, 0.7, -0.1, 0.3, 0.9])
>>> rate[[0, 2]] = 0.0
>>> rate
array([ 0. , -0.2,  0. , -0.1,  0.3,  0.9])
>>> rate[rate < 0] = 0.0
>>> rate
array([0. , 0. , 0. , 0. , 0.3, 0.9])
>>> rate[rate > 0.5] = 0.5
>>> rate
array([0. , 0. , 0. , 0. , 0.3, 0.5])
```

`rate[rate < 0] = 0.0` reads "wherever rate is negative, set it to zero" — in place, with no copy and no loop. The last line **clips** every value above 0.5 down to 0.5.

This does not contradict "masking copies". On the right of `=`, `x[...]` is a **[[fetch|fetch-and-store]]**: NumPy builds a result and hands it to you, and for advanced indexing that result is a copy. On the left, it is a **store**: "put these values at these places in `x`". No intermediate array is involved.

The trap is doing both in one line — a fetch followed by a store — which is called **chained indexing**:

```python
>>> rate = np.array([0.4, -0.2, 0.7, -0.1, 0.3, 0.9])
>>> rate[rate < 0][0] = 99.0
>>> rate
array([ 0.4, -0.2,  0.7, -0.1,  0.3,  0.9])
>>> rate[[1, 3]][0] = 99.0
>>> rate
array([ 0.4, -0.2,  0.7, -0.1,  0.3,  0.9])
```

Nothing changed, and no error was raised: the fetch made a temporary copy, `[0] = 99.0` stored into it, and the copy was thrown away. To change "the first negative element", get its position first, then store with a single index:

```python
>>> where_neg = np.flatnonzero(rate < 0)
>>> where_neg
array([1, 3])
>>> rate[where_neg[0]] = 99.0
>>> rate
array([ 0.4, 99. ,  0.7, -0.1,  0.3,  0.9])
```

(With basic slicing, chained indexing does work, because each step is a view: `x[2:6][0] = 5` changes `x` — which is why the trap is easy to fall into.)

::: warning Chained advanced indexing writes into a copy
`x[mask][0] = v` and `x[[1, 3]][0] = v` change nothing: the first bracket makes a temporary copy, and the second writes into it. Put the whole selection in one pair of brackets, or turn the mask into positions with `np.flatnonzero` first.
:::

::: warning Repeated positions store once
`counts[[1, 1, 1]] += 1.0` adds 1 to `counts[1]` only **once**, not three times. The line is a fetch (three copies of the old value), an addition, then a store to the same place three times over. To accumulate every repeat, use `np.add.at(counts, [1, 1, 1], 1.0)`, which adds 3.
:::

::: key
Assignment through a fancy index or a mask writes in place: `x[[0, 2]] = 0.0` and `x[x < 0] = 0.0` change `x`. Reading `y = x[mask]` copies; writing `x[mask] = v` stores. Chained forms like `x[mask][0] = v` write into a temporary copy and are lost.
:::

::: example Cleaning telemetry dropouts
A temperature channel, in °C, writes the **[[sentinel|sentinel]]** value $-999.0$ whenever the sensor fails to respond. Find the dropouts, compute a correct average, and mark the gaps properly.

```python
>>> import numpy as np
>>> temp = np.array([21.4, 21.5, -999.0, 21.7, -999.0, 21.9, 22.0, 22.1])
>>> temp.mean()
np.float64(-233.425)
>>> bad = temp == -999.0
>>> bad.sum()
np.int64(2)
>>> np.flatnonzero(bad)
array([2, 4])
>>> temp[~bad].mean()
np.float64(21.766666666666666)
>>> temp[bad] = np.nan
>>> temp
array([21.4, 21.5,  nan, 21.7,  nan, 21.9, 22. , 22.1])
>>> np.isnan(temp).sum()
np.int64(2)
```

**The naive mean.** Averaging everything gives $-233.4$ °C, colder than anywhere on Earth. The two sentinels dominate: the six good values sum to 130.6, and $(130.6 - 2 \times 999) / 8 = -233.425$.

**Find the dropouts.** `bad` is `True` at the two sentinel samples; `bad.sum()` counts 2, and `np.flatnonzero(bad)` says they are samples 2 and 4.

**The correct mean.** `~bad` keeps the six good samples. Their mean is $130.6 / 6 \approx 21.77$ °C. Sanity check: every good reading lies between 21.4 and 22.1, and so does 21.77.

**Mark the gaps.** `temp[bad] = np.nan` stores NaN into the two dropout slots, in place, so no later calculation can mistake $-999$ for a temperature. `np.isnan(temp)` is the mask for NaN, and it finds the same two samples.
:::

::: warning Never test for NaN with ==
`temp == np.nan` is `False` for every element, even the NaN ones, because **NaN is not equal to anything, itself included**. A mask built that way finds nothing and raises no error. Use `np.isnan(temp)`.
:::

## Where are the Trues? np.nonzero and np.flatnonzero

A mask says *which* elements. Sometimes you need *where* they are: their positions. `np.nonzero(mask)` returns them, as a tuple with one index array per axis:

```python
>>> alt = np.array([0.0, 1.2, 4.9, 11.0, 19.6, 30.6, 44.1, 60.0])
>>> np.nonzero(alt > 15.0)
(array([4, 5, 6, 7]),)
>>> np.flatnonzero(alt > 15.0)
array([4, 5, 6, 7])
>>> np.flatnonzero(alt > 15.0)[0]
np.int64(4)
```

For a 1-D mask the tuple holds one array, which is easy to forget; `np.flatnonzero` hands you the array directly. The last line answers "when did the fall first pass 15 m?": sample 4, which is $4 \times 0.5 = 2.0$ s after release.

For a 2-D mask, `np.nonzero` gives the row positions and the column positions, and those two arrays are exactly the paired lists that fancy indexing takes:

```python
>>> m = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
>>> rows, cols = np.nonzero(m > 4)
>>> rows
array([1, 1, 2, 2, 2])
>>> cols
array([1, 2, 0, 1, 2])
>>> m[rows, cols]
array([5, 6, 7, 8, 9])
>>> m[m > 4]
array([5, 6, 7, 8, 9])
```

Read the pairs column by column: `(1, 1)`, `(1, 2)`, `(2, 0)`, `(2, 1)`, `(2, 2)` — the five places holding a value above 4. `np.where(mask)` with only one argument does the same thing as `np.nonzero(mask)`.

## Choosing element by element: np.where

`np.where(cond, a, b)` with three arguments builds a new array: where `cond` is `True` it takes the value from `a`, and elsewhere from `b`. It is an element-by-element `if`/`else`:

```python
>>> rate = np.array([0.4, -0.2, 0.7, -0.1, 0.3, 0.9])
>>> np.where(rate < 0, 0.0, rate)
array([0.4, 0. , 0.7, 0. , 0.3, 0.9])
>>> np.where(rate > 0.5, 0.5, rate)
array([ 0.4, -0.2,  0.5, -0.1,  0.3,  0.5])
>>> rate
array([ 0.4, -0.2,  0.7, -0.1,  0.3,  0.9])
```

The results match the masked assignments earlier, except that `np.where` returns a **new** array and leaves `rate` alone. Use masked assignment to fix data in place; use `np.where` to get a cleaned copy and keep the raw data.

::: key
`np.nonzero(mask)` returns a tuple of index arrays, one per axis, giving where the mask is `True`; `np.flatnonzero(mask)` gives the positions of a 1-D mask directly; `np.where(mask)` with one argument equals `np.nonzero(mask)`. `np.where(cond, a, b)` returns a new array taking `a` where `cond` is `True` and `b` elsewhere.
:::

::: example A thrust ratio without dividing by zero
An engine test logs commanded and achieved thrust, in kN. The engine is off (commanded 0) at the first and last moment, and the last reading shows 3 kN of sensor noise. Compute achieved ÷ commanded, reporting 0 while the engine is off, with no warnings.

The obvious attempt gets the right numbers but prints warnings:

```python
>>> import numpy as np
>>> cmd = np.array([0.0, 500.0, 1000.0, 1000.0, 0.0])
>>> got = np.array([0.0, 480.0, 1010.0, 995.0, 3.0])
>>> np.where(cmd > 0, got / cmd, 0.0)
<stdin>:1: RuntimeWarning: divide by zero encountered in divide
<stdin>:1: RuntimeWarning: invalid value encountered in divide
array([0.   , 0.96 , 1.01 , 0.995, 0.   ])
```

**Why the warnings?** Python works out every argument *before* calling a function. So `got / cmd` is computed for all five elements before `np.where` looks at the mask — including $0 / 0$ (NaN, "invalid value") and $3 / 0$ (infinity, "divide by zero"). `np.where` throws those away, but the warnings have already fired.

**The safe pattern: fix the denominator first.**

```python
>>> on = cmd > 0
>>> safe = np.where(on, cmd, 1.0)
>>> safe
array([   1.,  500., 1000., 1000.,    1.])
>>> ratio = got / safe
>>> ratio[~on] = 0.0
>>> ratio
array([0.   , 0.96 , 1.01 , 0.995, 0.   ])
```

1. `on` marks the moments the engine was commanded on.
2. `safe` is the commanded thrust with a harmless 1.0 wherever it was 0, so no division by zero can happen.
3. `got / safe` divides. The "off" moments get meaningless values ($0/1$ and $3/1$), but no warnings.
4. `ratio[~on] = 0.0` overwrites those moments with 0, in place.

**Check.** $480 / 500 = 0.96$, $1010 / 1000 = 1.01$ and $995 / 1000 = 0.995$: within 4% of the command each time, believable for a test stand, and the shutdown noise was not reported as an infinite ratio. The same four steps turn vectors into unit vectors while leaving zero-length vectors as zeros.
:::

## Check yourself

::: check
`v = np.array([5.0, 6.0, 7.0, 8.0, 9.0])`. Give the result of `v[[4, 4, 0]]`, `v[[1, 3]]`, `v[v >= 7.0]` and `v[(v > 5.5) & (v < 8.5)]`, and say for each whether it shares memory with `v`.
:::

::: answer
- `v[[4, 4, 0]]` is `[9., 9., 5.]`: position 4 twice, then position 0, in that order.
- `v[[1, 3]]` is `[6., 8.]`.
- `v[v >= 7.0]` is `[7., 8., 9.]`: the mask is `[False, False, True, True, True]`.
- `v[(v > 5.5) & (v < 8.5)]` is `[6., 7., 8.]`: the first mask is `True` from 6.0 on, the second is `True` up to 8.0, and `&` keeps where both are.

None of them shares memory with `v`. All four use advanced indexing (a list or a mask), which always copies.
:::

::: check
A colleague writes `pos[pos[:, 2] < 0][:, 2] = 0.0` to set every negative altitude (column 2) of a position table to zero. It runs without error but the table is unchanged. Explain, and write a version that works.
:::

::: answer
The expression is chained. `pos[pos[:, 2] < 0]` is a fetch with a boolean mask, so it builds a temporary **copy** of the rows with negative altitude. `[:, 2] = 0.0` then stores zeros into column 2 of that copy, and the copy is thrown away. `pos` itself is never written.

Do the store in one indexing operation on `pos`. A mask and an integer can sit side by side, one per axis: rows chosen by the mask, column 2.

```python
neg = pos[:, 2] < 0
pos[neg, 2] = 0.0
```

Now the whole selection sits on the left of `=`, so NumPy stores directly into `pos`. You can prove it worked with `(pos[:, 2] < 0).sum()`, which should now be 0.
:::

::: check
Why does `if (err > 1e-3):` raise an error when `err` is an array of measurement errors, and what are the two different things the author might have meant?
:::

::: answer
`err > 1e-3` is a mask with one `True`/`False` per error. `if` needs a single yes-or-no answer, and a mask with more than one element could be read two ways, so NumPy raises `ValueError: The truth value of an array with more than one element is ambiguous. Use a.any() or a.all()`.

The author meant one of:

- "is **any** error too large?" — `if (err > 1e-3).any():`, typical for a failure check;
- "are **all** errors too large?" — `if (err > 1e-3).all():`.

These can give opposite answers, which is exactly why NumPy will not choose for you.
:::

::: check
`h = np.array([120.0, 95.0, 88.0, 102.0, 79.0, 60.0])` is a descending vehicle's height in meters, one sample per second from $t = 0$. Using a mask and `np.flatnonzero`, find the first second at which it was below 90 m, and the number of samples below 90 m.
:::

::: answer
The mask `h < 90.0` is `[False, False, True, False, True, True]`: 88, 79 and 60 are below 90, while 102 is not.

`np.flatnonzero(h < 90.0)` gives `[2, 4, 5]`, so the first position is 2. At one sample per second from $t = 0$, that is $t = 2$ s.

`(h < 90.0).sum()` counts the `True`s: 3 samples.
:::

::: check
Explain why `x[[0, 2, 4]]` is a copy while `x[0:5:2]` is a view, even though both select the same three elements. Then say what `x[[0, 2, 4]] = 1.0` does to `x`.
:::

::: answer
`x[0:5:2]` is basic slicing. NumPy can describe the result with a new header — start at element 0, three elements, a stride of two elements — over the same memory, so it returns a view.

`x[[0, 2, 4]]` is fancy indexing. A list of positions can be in any order and can repeat, so in general no single stride describes it. NumPy decides by the kind of index, not by the particular numbers in the list, so it always allocates a new array and copies. It does not check whether your list happens to be evenly spaced.

`x[[0, 2, 4]] = 1.0` is different again: fancy indexing on the left of `=` is a store, not a fetch. It writes 1.0 into positions 0, 2 and 4 of `x` itself, in place.
:::

## Summary

| Expression | What it does | View or copy |
| --- | --- | --- |
| `a[[i0, i1, i2]]` | elements at those positions, in that order | copy |
| `a[:, [c0, c1]]` | chosen columns | copy |
| `a[rows, cols]` | pairs `(rows[k], cols[k])` | copy |
| `a[np.ix_(rows, cols)]` | the block of those rows and columns | copy |
| `a > v` | a `bool` mask, same shape as `a` | new array |
| `a[mask]` | elements (or rows) where mask is `True` | copy |
| `(m1) & (m2)`, `(m1) \| (m2)`, `~m1` | element-wise and, or, not; parenthesize comparisons | new mask |
| `mask.sum()`, `mask.any()`, `mask.all()` | count, "any?", "all?" | one number |
| `a[mask] = v`, `a[[i, j]] = v` | store into `a` | in place |
| `a[mask][0] = v` | stores into a temporary copy | lost |
| `np.nonzero(mask)`, `np.flatnonzero(mask)` | positions of the `True`s | new arrays |
| `np.where(cond, x, y)` | `x` where `cond`, else `y` | new array |
| `np.isnan(a)` | the NaN mask; `a == np.nan` never works | new mask |

With lessons 3 and 4 you can pull any piece out of an array and know whether it is a view or a copy. The next lesson, on broadcasting, shows how arrays of *different* shapes combine — how a row of three biases subtracts from every row of an `(N, 3)` table, and how a length-1 axis stretches — which is the other rule that bites everyone.

::: context advanced-name Basic, advanced and "fancy"
NumPy's documentation splits indexing into **basic** indexing (integers, slices and `:`), which gives views, and **advanced** indexing (integer arrays and boolean arrays), which copies. "Fancy indexing" is the older, informal name for the integer-array kind, from the days of NumPy's predecessor Numeric, and you will see it in books, blog posts and code reviews all the time. The two names mean the same thing.
:::

::: context pairs-not-block Pairs, not a block
With a list on both axes, `m[[0, 2], [1, 2]]` walks the two lists together, like a zipper: first `(0, 1)`, then `(2, 2)`. The result has one element per pair. `np.ix_` instead crosses them — every chosen row with every chosen column — to make a block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="30" y="30" width="36" height="30"/><rect x="66" y="30" width="36" height="30" fill="#8fb8f0"/><rect x="102" y="30" width="36" height="30"/>
    <rect x="30" y="60" width="36" height="30"/><rect x="66" y="60" width="36" height="30"/><rect x="102" y="60" width="36" height="30"/>
    <rect x="30" y="90" width="36" height="30"/><rect x="66" y="90" width="36" height="30"/><rect x="102" y="90" width="36" height="30" fill="#8fb8f0"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="50">1</text><text x="84" y="50">2</text><text x="120" y="50">3</text>
    <text x="48" y="80">4</text><text x="84" y="80">5</text><text x="120" y="80">6</text>
    <text x="48" y="110">7</text><text x="84" y="110">8</text><text x="120" y="110">9</text>
  </g>
  <text x="84" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">m[[0, 2], [1, 2]]</text>
  <text x="84" y="142" font-size="11" fill="#1d6fd1" text-anchor="middle">→ [2, 9]</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="210" y="30" width="36" height="30"/><rect x="246" y="30" width="36" height="30" fill="#f2b880"/><rect x="282" y="30" width="36" height="30" fill="#f2b880"/>
    <rect x="210" y="60" width="36" height="30"/><rect x="246" y="60" width="36" height="30"/><rect x="282" y="60" width="36" height="30"/>
    <rect x="210" y="90" width="36" height="30"/><rect x="246" y="90" width="36" height="30" fill="#f2b880"/><rect x="282" y="90" width="36" height="30" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="228" y="50">1</text><text x="264" y="50">2</text><text x="300" y="50">3</text>
    <text x="228" y="80">4</text><text x="264" y="80">5</text><text x="300" y="80">6</text>
    <text x="228" y="110">7</text><text x="264" y="110">8</text><text x="300" y="110">9</text>
  </g>
  <text x="264" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">m[np.ix_([0, 2], [1, 2])]</text>
  <text x="264" y="142" font-size="11" fill="#b4232c" text-anchor="middle">→ [[2, 3], [8, 9]]</text>
</svg>
```
:::

::: context no-single-stride A path no stride can walk
A view is one start and one fixed step. The positions 7, 0, 7, 2 go forward, back, forward and repeat, so no fixed step reaches them in that order. The only way to hand them over as an array is to copy them into a fresh block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="20" y="20" width="40" height="26" fill="#8fb8f0"/><rect x="60" y="20" width="40" height="26"/><rect x="100" y="20" width="40" height="26" fill="#8fb8f0"/><rect x="140" y="20" width="40" height="26"/>
    <rect x="180" y="20" width="40" height="26"/><rect x="220" y="20" width="40" height="26"/><rect x="260" y="20" width="40" height="26"/><rect x="300" y="20" width="40" height="26" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="37">0.0</text><text x="80" y="37">1.2</text><text x="120" y="37">4.9</text><text x="160" y="37">11.0</text>
    <text x="200" y="37">19.6</text><text x="240" y="37">30.6</text><text x="280" y="37">44.1</text><text x="320" y="37">60.0</text>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" fill="none">
    <path d="M320,50 Q180,90 40,50"/>
    <path d="M40,50 Q180,100 320,50"/>
    <path d="M320,50 Q220,85 120,50"/>
  </g>
  <text x="180" y="112" font-size="11" fill="#b4232c" text-anchor="middle">7 → 0 → 7 → 2: no single step fits</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#f2b880">
    <rect x="100" y="122" width="40" height="26"/><rect x="140" y="122" width="40" height="26"/><rect x="180" y="122" width="40" height="26"/><rect x="220" y="122" width="40" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="120" y="139">60.0</text><text x="160" y="139">0.0</text><text x="200" y="139">60.0</text><text x="240" y="139">4.9</text>
  </g>
  <text x="20" y="139" font-size="11" fill="#6c7a93">new block:</text>
</svg>
```
:::

::: context mask-stencil The mask as a stencil
Line the mask up under the data, one `True` or `False` per element. The values over a `True` come through, in order, into a new, shorter array.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="37" font-size="11" fill="#6c7a93">alt</text>
  <text x="10" y="77" font-size="11" fill="#6c7a93">mask</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="45" y="20" width="38" height="26"/><rect x="83" y="20" width="38" height="26"/><rect x="121" y="20" width="38" height="26"/><rect x="159" y="20" width="38" height="26"/>
    <rect x="197" y="20" width="38" height="26" fill="#8fb8f0"/><rect x="235" y="20" width="38" height="26" fill="#8fb8f0"/><rect x="273" y="20" width="38" height="26" fill="#8fb8f0"/><rect x="311" y="20" width="38" height="26" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="64" y="37">0.0</text><text x="102" y="37">1.2</text><text x="140" y="37">4.9</text><text x="178" y="37">11.0</text>
    <text x="216" y="37">19.6</text><text x="254" y="37">30.6</text><text x="292" y="37">44.1</text><text x="330" y="37">60.0</text>
  </g>
  <g font-size="11" text-anchor="middle">
    <text x="64" y="77" fill="#b4232c">F</text><text x="102" y="77" fill="#b4232c">F</text><text x="140" y="77" fill="#b4232c">F</text><text x="178" y="77" fill="#b4232c">F</text>
    <text x="216" y="77" fill="#1d6fd1">T</text><text x="254" y="77" fill="#1d6fd1">T</text><text x="292" y="77" fill="#1d6fd1">T</text><text x="330" y="77" fill="#1d6fd1">T</text>
  </g>
  <text x="10" y="122" font-size="11" fill="#6c7a93">alt[mask]</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#8fb8f0">
    <rect x="197" y="105" width="38" height="26"/><rect x="235" y="105" width="38" height="26"/><rect x="273" y="105" width="38" height="26"/><rect x="311" y="105" width="38" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="216" y="122">19.6</text><text x="254" y="122">30.6</text><text x="292" y="122">44.1</text><text x="330" y="122">60.0</text>
  </g>
  <text x="120" y="145" font-size="11" fill="#6c7a93" text-anchor="middle">a new array of 4</text>
</svg>
```
:::

::: context numpy-bool-scalar True, the NumPy way
A single result from a NumPy reduction is a NumPy scalar, just as `a[2]` was `np.float64(...)` in lesson 1. For booleans NumPy 2 displays these as `np.True_` and `np.False_`; the trailing underscore is there because `True` and `False` are Python keywords. They work anywhere a `bool` does: in an `if`, with `not`, and in arithmetic. `bool(np.True_)` gives the plain Python `True` if you need one, for example for JSON output.
:::

::: context precedence Who grabs first
When Python reads an expression, some operators grab their neighbors before others do, the way multiplication goes before addition in $2 + 3 \times 4$. The bitwise operators `&` and `|` grab before the comparisons `<`, `<=`, `>` and `>=`. So `t >= 0.1 & t <= 0.3` becomes `t >= (0.1 & t) <= 0.3`, which is also a chained comparison — two mistakes in one. Python's designers chose this order for working with bits, long before NumPy existed; NumPy reuses `&` and `|` for masks because the keywords `and` and `or` cannot be redefined. Parentheses around each comparison settle it.
:::

::: context ambiguous Why NumPy will not pick for you
Python's `and`, `or`, `not` and `if` call `bool()` on an object to get one `True` or `False`. For an empty list the answer is `False` and for a non-empty one `True`, as you saw in the basics module. For a mask, "non-empty" is useless: `[False, False]` is non-empty, yet nothing in it is true. The only sensible answers are "any" or "all", and they often disagree. Rather than silently choosing one and hiding a bug, NumPy raises an error unless the array holds exactly one element.
:::

::: context fetch-and-store Two different operations behind the brackets
In the dunder-methods lesson of the idiomatic Python module you saw that Python turns syntax into method calls. `y = x[k]` calls `x.__getitem__(k)`, which must *return* an object — for advanced indexing, a newly built copy. `x[k] = v` calls `x.__setitem__(k, v)`, which returns nothing and writes `v` into `x` at the places `k` names. So the rule is not "masks copy" but "fetching through a mask copies". Storing through a mask never builds a separate array at all.
:::

::: context sentinel A number that means "no number"
A **sentinel** is a special value that a system writes in place of real data to say "missing" or "invalid", typically one that no real measurement could produce: $-999$, $9999$, or the largest value a field can hold. They are common in older telemetry formats and ground-station archives, which have no NaN. The danger is that a sentinel is a perfectly good float, so it slips into averages and plots unless you mask it out first — as the naive mean of $-233$ °C shows.
:::
