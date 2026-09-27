---
id: l03-slicing-views-and-copies
title: Slicing, views and copies
minutes: 20
covers:
  - "Indexing and slicing; views vs copies; base; fancy indexing and boolean masks"
---

Lay a sheet of cardboard with a rectangular hole cut in it over a page of a book. Through the hole you see a few lines. You have not copied anything: it is the same page, and if you write through the hole with a pen, the ink lands on the book. Now compare a photocopy of those lines. You can scribble all over the photocopy and the book stays clean.

In the Python basics module, slicing a list always made a photocopy: `xs[2:5]` was a brand-new list. NumPy does the opposite. Slicing an array gives you the cardboard window. The result is called a **view**: a new array object that looks at the *same* memory as the original. Write into the view and the original changes.

NumPy does this on purpose. A view costs nothing to make — no numbers move — so cutting a ten-second window out of a 200 MB telemetry file is instant. But it means that one of the most common bugs in scientific Python is a function that "only changed its own copy" and in fact changed the caller's data. This lesson teaches you to say, for any indexing expression, whether it gives a view or a copy — and to **prove** it with three tests, instead of guessing.

## Picking one element, one row, one column

For a one-dimensional array, indexing and slicing look exactly like lists. `x[i]` is element `i`, counting from 0; negative indexes count from the end; `x[a:b:c]` is "from `a` up to but not including `b`, in steps of `c`":

```python
>>> import numpy as np
>>> x = np.array([3.1, 4.1, 5.9, 2.6, 5.3, 5.8, 9.7, 9.3])
>>> x[0], x[-1]
(np.float64(3.1), np.float64(9.3))
>>> x[2:5]
array([5.9, 2.6, 5.3])
>>> x[::2]
array([3.1, 5.9, 5.3, 9.7])
>>> x[::-1]
array([9.3, 9.7, 5.8, 5.3, 2.6, 5.9, 4.1, 3.1])
>>> x[5:100]
array([5.8, 9.7, 9.3])
>>> x[8]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
IndexError: index 8 is out of bounds for axis 0 with size 8
```

The same rules as lists: an index past the end is an error, a slice past the end stops quietly at the end.

A two-dimensional array takes one index or slice **per axis**, separated by a comma. Here is a short gyro log: column 0 is time in seconds, columns 1 to 3 are the rotation rates about x, y and z in degrees per second.

```python
>>> tel = np.array([[0.0, 0.12, -0.03, 0.01], [0.1, 0.15, -0.02, 0.00], [0.2, 0.11, -0.04, 0.02], [0.3, 0.14, -0.03, 0.01], [0.4, 0.13, -0.05, 0.03]])
>>> tel[3, 1]
np.float64(0.14)
>>> tel[3]
array([ 0.3 ,  0.14, -0.03,  0.01])
>>> tel[:, 0]
array([0. , 0.1, 0.2, 0.3, 0.4])
>>> tel[1:3, :2]
array([[0.1 , 0.15],
       [0.2 , 0.11]])
>>> tel[::2, 3]
array([0.01, 0.02, 0.03])
>>> gyro = tel[:, 1:]
>>> gyro.shape
(5, 3)
```

Read each one aloud:

- `tel[3, 1]` — "row 3, column 1": one number, the x rate at $t = 0.3$ s.
- `tel[3]` — "row 3": a whole row. Leaving off the later indexes means "all of them".
- `tel[:, 0]` — "all rows, column 0": the time column. A bare colon `:` means "everything along this axis".
- `tel[1:3, :2]` — "rows 1 and 2, columns 0 and 1": a small block.
- `tel[::2, 3]` — "every second row, column 3".
- `tel[:, 1:]` — "all rows, columns 1 onward": the three gyro channels, shape `(5, 3)`.

You can also write `tel[3][1]`. It gives the same number, but it does two steps: first it makes the row `tel[3]`, then it indexes that. `tel[3, 1]` is one step, and — as the next lesson shows — the two forms stop agreeing once you use lists as indexes. Use the comma form.

A single integer index like `tel[3, 1]` hands you a NumPy scalar, a *copy of the value*. Changing the name you stored it in does not touch the array; only writing into the array with `tel[3, 1] = ...` does.

The same pattern works for any number of axes. A stack of $N$ rotation matrices has shape `(N, 3, 3)`, and `C[:, 0, 1]` reads "for every matrix, row 0, column 1" — one number from each of the $N$ matrices, shape `(N,)`. You will use exactly this to build a stack of matrices without a loop.

::: key
Index a 2-D array with one entry per axis: `a[i, j]` is one element, `a[i]` is row `i`, `a[:, j]` is column `j`, `a[i0:i1, j0:j1]` is a block, and `a[::k]` takes every `k`th row. A bare `:` means "all of this axis". Prefer `a[i, j]` to `a[i][j]`.
:::

## A slice is a view

Now the surprise. Take a slice, give it a name, and change it:

```python
>>> x = np.array([3.1, 4.1, 5.9, 2.6, 5.3, 5.8, 9.7, 9.3])
>>> w = x[4:7]
>>> w
array([5.3, 5.8, 9.7])
>>> w[1] = -5.0
>>> x
array([ 3.1,  4.1,  5.9,  2.6,  5.3, -5. ,  9.7,  9.3])
```

You wrote into `w`, and `x` changed. Element 1 of `w` *is* element 5 of `x`; there is only one copy of that number in memory.

Here is why, using the picture from lesson 1. An array is a block of bytes plus a header: dtype, shape, strides, and where in the block to start, the **offset**. A basic slice needs no new numbers at all. NumPy writes a new header that points into the same block:

- `x[4:7]` starts 4 elements in, so its offset is $4 \times 8 = 32$ bytes; its shape is `(3,)`; its stride is still 8 bytes.
- `x[::2]` starts at the beginning, has shape `(4,)`, and its stride is 16 bytes: step over every other number.
- `x[::-1]` starts at the last element and has a stride of $-8$: walk backward.
- `tel[:, 0]` has shape `(5,)` and stride 32, because moving down one row of four `float64`s jumps $4 \times 8 = 32$ bytes.

```python
>>> x.strides
(8,)
>>> x[4:7].shape, x[4:7].strides
((3,), (8,))
>>> x[::2].shape, x[::2].strides
((4,), (16,))
>>> x[::-1].strides
(-8,)
>>> tel.strides
(32, 8)
>>> tel[:, 0].shape, tel[:, 0].strides
((5,), (32,))
```

Every one of these is a new way of **[[walking the same bytes|view-walk]]**. That is the whole trick: anything you can describe with a start, a length and an even step along each axis can be a view. That is what **[[basic slicing|basic-and-advanced]]** means — indexing with integers, slices and `:` only.

::: key
Is `x[::2]` a view or a copy? A view: basic slicing only changes offset, shape and strides. Mutating it changes the parent. Fancy indexing (`x[[0,2,4]]`) and boolean masking always copy.
:::

The last sentence of that box is the next lesson. For now, hold on to the rule: basic slicing, view.

## Proving it: three tests

"I think it's a view" is not good enough when the answer decides whether your flight data gets corrupted. There are three ways to check, and they agree.

**Test 1: `np.shares_memory(a, b)`.** It [[answers the question directly|shares-memory-cost]]: is there any byte that both arrays use? `True` means a change to one can show up in the other.

**Test 2: `.base`.** Every array has a `.base` attribute. An array that owns its memory has `base` equal to `None`. A view's `base` is the array that owns the memory it looks at. Check it with `is`, the identity test from the basics module.

**Test 3: change one and look.** Write a recognizable value into the suspect array and see whether the other array changed. It is the bluntest test, and the one nobody can argue with. Do it on a scratch copy of your data, or put the old value back afterward.

```python
>>> x = np.array([3.1, 4.1, 5.9, 2.6, 5.3, 5.8, 9.7, 9.3])
>>> w = x[4:7]
>>> np.shares_memory(x, w)
True
>>> w.base is x
True
>>> x.base is None
True
>>> v = w[1:]
>>> v.base is x
True
>>> w is x[4:7]
False
```

Look at the last three lines. `v` is a view of a view, and its `base` is not `w` but `x`, the array that actually **[[owns the memory|owner-and-base]]**. And `w is x[4:7]` is `False`: every time you slice, NumPy makes a new header object, so `is` cannot tell you whether two arrays share data. Two different objects can be two windows on the same page. That is why you need `shares_memory` or `.base`.

::: warning `is` answers the wrong question
`a is b` asks "are these the same Python object?" Two views of one array are different objects that share memory, so `is` says `False` even though writing through one changes the other. To ask "do these share data?", use `np.shares_memory(a, b)`. To ask "is this a view of that?", use `b.base is a`.
:::

::: key
Prove view versus copy with `np.shares_memory(a, b)` (do they use any of the same bytes?), with `.base` (a view's `base` is the owning array; an owner's `base` is `None`), or by writing into one and checking the other.
:::

::: example Cutting windows out of a telemetry record
A channel is logged at 100 Hz for 60 s. You want the stretch from $t = 10$ s to $t = 20$ s, and a slower 10 Hz version of the whole record. How many numbers get copied?

```python
>>> import numpy as np
>>> t = np.arange(6000) / 100
>>> t.shape, t.nbytes
((6000,), 48000)
>>> win = t[1000:2000]
>>> win.shape, win[0], win[-1]
((1000,), np.float64(10.0), np.float64(19.99))
>>> slow = t[::10]
>>> slow.shape, slow.strides
((600,), (80,))
>>> slow[:3]
array([0. , 0.1, 0.2])
>>> np.shares_memory(t, win), np.shares_memory(t, slow)
(True, True)
>>> win.base is t, slow.base is t
(True, True)
```

**The record.** 60 s at 100 Hz is $60 \times 100 = 6000$ samples. Counting in whole numbers and dividing, as lesson 2 recommended, gives times $0.00, 0.01, \ldots, 59.99$ s.

**The window.** $t = 10$ s is sample $10 \times 100 = 1000$ and $t = 20$ s is sample 2000. The half-open slice `t[1000:2000]` holds $2000 - 1000 = 1000$ samples, from 10.00 s to 19.99 s. That is exactly 10 s of data, and the sample at 20.00 s belongs to the next window — just what you want when you cut a record into back-to-back pieces.

**The slow version.** Keeping every tenth sample turns 100 Hz into $100 / 10 = 10$ Hz and 6000 samples into $6000 / 10 = 600$. The stride is $10 \times 8 = 80$ bytes: skip ten `float64`s each step.

**What was copied.** Nothing. Both results share memory with `t`, and both have `t` as their base. For a 48 kB record that does not matter; for a 20 GB one it is the difference between instant and impossible.
:::

## Writing through a slice

Views are not only a trap. They are also how you fill arrays in place. Assigning to a slice writes into the array it came from:

```python
>>> x = np.zeros(6)
>>> x[1:4] = 7.0
>>> x
array([0., 7., 7., 7., 0., 0.])
>>> x[::2] = [1.0, 2.0, 3.0]
>>> x
array([1., 7., 2., 7., 3., 0.])
```

A single number on the right is written into every selected spot. An array or list on the right must have one value per selected spot: `x[::2]` selects three places, so three values.

This is how you fill the preallocated arrays from lesson 2. Here is a stack of two rotation matrices, each a turn about the $z$ axis by an angle $\psi$ (read "psi"), built without a loop:

```python
>>> psi = np.array([0.0, np.pi / 2])
>>> C = np.zeros((2, 3, 3))
>>> C[:, 0, 0] = np.cos(psi)
>>> C[:, 0, 1] = np.sin(psi)
>>> C[:, 1, 0] = -np.sin(psi)
>>> C[:, 1, 1] = np.cos(psi)
>>> C[:, 2, 2] = 1.0
>>> C[0]
array([[ 1.,  0.,  0.],
       [-0.,  1.,  0.],
       [ 0.,  0.,  1.]])
>>> C[1]
array([[ 6.123234e-17,  1.000000e+00,  0.000000e+00],
       [-1.000000e+00,  6.123234e-17,  0.000000e+00],
       [ 0.000000e+00,  0.000000e+00,  1.000000e+00]])
```

`np.cos(psi)` works element by element, giving one cosine per angle, shape `(2,)`. `C[:, 0, 0]` selects one spot in each of the two matrices, also shape `(2,)`, so the two line up. `C[0]` is the identity (a zero angle, so no rotation); the `-0.` is a **[[negative zero|negative-zero]]**, from $-\sin 0$, and it equals 0. `C[1]` is a quarter turn. Its diagonal shows $6.1 \times 10^{-17}$ instead of 0, because $\pi/2$ cannot be stored exactly — the **[[rounding at the last digit|cos-pi-over-2]]** that lesson 10 is about. The same `out[:, i, j] = ...` pattern builds any stack of small matrices, including the skew matrices in this module's first exercise.

There is one more thing to watch. There is a difference between making a *new* array and changing an *existing* one:

```python
>>> tel = np.array([[0.0, 0.12, -0.03, 0.01], [0.1, 0.15, -0.02, 0.00], [0.2, 0.11, -0.04, 0.02]])
>>> col = tel[:, 3]
>>> col = col * 1000.0
>>> tel[:, 3]
array([0.01, 0.  , 0.02])
>>> col = tel[:, 3]
>>> col *= 1000.0
>>> tel[:, 3]
array([10.,  0., 20.])
```

`col * 1000.0` builds a new array, and `col = ...` moves the name `col` onto it. The view is dropped and `tel` is untouched. `col *= 1000.0` is **in-place** arithmetic: it multiplies the numbers where they already sit, which is inside `tel`. The operators `+=`, `-=`, `*=` and `/=` all work in place on arrays.

::: warning Augmented assignment writes through a view
`a -= b` on a view changes the parent; `a = a - b` does not. Inside a function that receives an array, `x -= x.mean()` modifies the caller's data, even if the caller passed a slice. Write `x = x - x.mean()` unless changing the caller's array is the point, and then say so in the docstring.
:::

::: example The bias removal that edited the log
A gyro reads a small rate even when it is still: its **[[bias|gyro-bias]]**. A helper subtracts the average of the first three samples. Here it is, called on the x-rate column of the gyro log:

```python
# bias_bug.py
import numpy as np

def remove_bias(rate, n=3):
    """Subtract the mean of the first n samples."""
    rate -= rate[:n].mean()
    return rate

tel = np.array([[0.0, 0.12, -0.03, 0.01],
                [0.1, 0.15, -0.02, 0.00],
                [0.2, 0.11, -0.04, 0.02],
                [0.3, 0.14, -0.03, 0.01],
                [0.4, 0.13, -0.05, 0.03]])
gx = remove_bias(tel[:, 1])
print(np.shares_memory(gx, tel))   # True
print(tel[:, 1])                   # [-0.00666667  0.02333333 -0.01666667  0.01333333  0.00333333]
```

**What the numbers should be.** The first three x rates are 0.12, 0.15 and 0.11, with mean $(0.12 + 0.15 + 0.11) / 3 = 0.38 / 3 \approx 0.12667$ deg/s. Subtracting it from 0.12 gives about $-0.00667$, and from 0.15 about $0.02333$. Those match, so the arithmetic is right.

**What went wrong.** [[The raw log is gone|raw-data-rule]]. `tel[:, 1]` is a view, `-=` wrote into it, and the raw column now holds the corrected values. Run the script twice in a notebook and the bias is subtracted twice. `np.shares_memory(gx, tel)` proves it: `True`.

**The fix.** Return a new array instead:

```python
# bias_fixed.py
import numpy as np

def remove_bias(rate, n=3):
    """Return a new array: rate minus the mean of its first n samples."""
    return rate - rate[:n].mean()

tel = np.array([[0.0, 0.12, -0.03, 0.01],
                [0.1, 0.15, -0.02, 0.00],
                [0.2, 0.11, -0.04, 0.02],
                [0.3, 0.14, -0.03, 0.01],
                [0.4, 0.13, -0.05, 0.03]])
gx = remove_bias(tel[:, 1])
print(np.shares_memory(gx, tel))   # False
print(tel[:, 1])                   # [0.12 0.15 0.11 0.14 0.13]
print(gx)                          # [-0.00666667  0.02333333 -0.01666667  0.01333333  0.00333333]
```

**Check.** The corrected values are the same as before, the raw column still reads 0.12, 0.15, 0.11, 0.14, 0.13, and the two arrays share no memory. Sanity check on size: the corrected rates are all within about 0.025 deg/s of zero, as they should be once a steady offset of about 0.13 is removed.
:::

## Getting a real copy

When you need independence, ask for it. `.copy()` makes a new array with its own memory:

```python
>>> c = x[4:7].copy()
>>> np.shares_memory(x, c)
False
>>> c.base is None
True
>>> c[0] = 0.0
>>> x[4]
np.float64(5.3)
```

All three tests agree: no shared memory, a base of `None` (it owns its data), and writing into `c` left `x[4]` alone. `np.array(existing_array)` also copies, by default.

Copy when a slice will outlive the moment: when you store "the raw data" before processing it, when a function hands data back to a caller who might change it, and when you keep a small piece of a huge array. That last one has its own trap:

```python
>>> big = np.zeros(10_000_000)
>>> head = big[:10]
>>> del big
>>> head.nbytes
80
>>> head.base.nbytes
80000000
>>> head = head.copy()
>>> head.base is None
True
```

`head` is only 80 bytes of numbers, but it is a view, and a view keeps its base alive. Deleting the name `big` did not free the 80 MB block, because `head.base` still refers to it. Copying the ten numbers lets the big block go.

::: warning A small view can hold a huge array in memory
As long as any view of an array exists, the whole block it came from stays in memory. If you slice ten samples out of a gigabyte file and keep them in a list for later, keep `.copy()`s, or the gigabyte stays too.
:::

## View or copy: the list so far

| Expression | Result | Why |
| --- | --- | --- |
| `a[3:9]`, `a[::2]`, `a[::-1]`, `a[:, 0]`, `a[1:3, :2]` | view | basic slicing: new offset, shape, strides |
| `a[i]` on a 2-D array | view | one row, with one fewer axis |
| `a[i, j]` (all integers) | a NumPy scalar | a single value; not linked to `a` |
| `a.T` | view | strides swapped (lesson 1) |
| `a + 1`, `a * b`, `np.cos(a)` | new array | arithmetic always makes a result |
| `a.copy()`, `np.array(a)` | new array | copying is the point |
| `a[[0, 2, 4]]`, `a[a > 0]` | new array | fancy and boolean indexing: next lesson |

## Check yourself

::: check
`a = np.arange(12.0)`. For each, say view or copy and give the shape: `a[2:8]`, `a[::3]`, `a[5]`, `a[2:8].copy()`, `a * 2`.
:::

::: answer
- `a[2:8]`: view, shape `(6,)` — elements 2 to 7, since $8 - 2 = 6$.
- `a[::3]`: view, shape `(4,)` — elements 0, 3, 6, 9, with a stride of $3 \times 8 = 24$ bytes.
- `a[5]`: neither a view nor an array. It is a single value, the NumPy scalar `np.float64(5.0)`, with shape `()`.
- `a[2:8].copy()`: copy, shape `(6,)`, with its own memory.
- `a * 2`: a new array, shape `(12,)`. Arithmetic never returns a view.
:::

::: check
Write three lines that prove `b = a[:, 1]` is a view of a 2-D array `a`, one line for each kind of test.
:::

::: answer
- `np.shares_memory(a, b)` returns `True`: the two arrays use some of the same bytes.
- `b.base is a` returns `True` (assuming `a` owns its memory): `b` looks into `a`'s block.
- `b[0] = -999.0; print(a[0, 1])` prints `-999.0`: writing through `b` changed `a`. Put the old value back afterward.
:::

::: check
A `float64` array `P` has shape `(1000, 6)`. What are the shape and strides of `P[::5, 3:]`? How many bytes does making it copy?
:::

::: answer
The strides of `P` are `(48, 8)`: a row is $6 \times 8 = 48$ bytes.

`::5` on axis 0 keeps rows 0, 5, 10, …, 995, which is $1000 / 5 = 200$ rows, and the stride becomes $5 \times 48 = 240$ bytes. `3:` on axis 1 keeps columns 3, 4 and 5, three columns, and the stride stays 8 bytes.

So the shape is `(200, 3)` and the strides are `(240, 8)`. It is a basic slice, so it is a view and copies 0 bytes.
:::

::: check
Explain why `w is x[4:7]` is `False` straight after `w = x[4:7]`, and why that does not mean `w` and `x[4:7]` are independent.
:::

::: answer
Every slicing operation builds a new array object — a new header — even when it describes the same numbers. So the second `x[4:7]` is a different Python object from `w`, and `is`, which tests object identity, says `False`.

But both headers point at the same bytes inside `x`. `np.shares_memory(w, x[4:7])` is `True`, and writing into one changes what the other shows. Identity of objects and sharing of memory are different questions.
:::

::: check
A function begins `def normalize(v): v /= np.max(np.abs(v))`. A caller writes `normalize(data[:, 2])`. What happens to `data`, and how would you change the function so the caller's array is never touched?
:::

::: answer
`data[:, 2]` is a basic slice, so `v` is a view of column 2. `/=` divides in place, so column 2 of `data` itself is rescaled. The caller's data changes without any assignment on the caller's side.

Make the function build a new array: `return v / np.max(np.abs(v))`. Now the result has its own memory, `np.shares_memory(result, data)` is `False`, and `data` is untouched. (Alternatively, start with `v = v.copy()`, but returning a new array is clearer.)
:::

## Summary

| Idea | Rule |
| --- | --- |
| Indexing | `a[i, j]` one element, `a[i]` a row, `a[:, j]` a column; `:` means all |
| Basic slicing | integers, `start:stop:step` and `:` only |
| View | a new header (offset, shape, strides) on the same memory |
| Basic slice gives | a view; writing into it changes the parent |
| Copy | `.copy()` or `np.array(a)`: its own memory |
| `np.shares_memory(a, b)` | `True` if any byte is used by both |
| `.base` | the owning array for a view; `None` for an owner |
| `is` | object identity, not data sharing; useless for this question |
| `a -= b` vs `a = a - b` | first writes in place (through views), second makes a new array |
| Filling a stack | `C[:, i, j] = values` writes one entry of each matrix |
| Memory | a view keeps its whole base alive; copy small pieces you keep |

The next lesson adds the two ways of indexing that *cannot* be described with an even step — picking elements by a list of positions, and picking them with a True/False mask — and shows why both always copy, and yet assigning through them still writes into the original.

::: context view-walk Same bytes, different walks
One block of eight `float64`s, three different headers. Each view is only a starting point, a count and a step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="20" y="20" width="40" height="26"/><rect x="60" y="20" width="40" height="26"/><rect x="100" y="20" width="40" height="26"/><rect x="140" y="20" width="40" height="26"/>
    <rect x="180" y="20" width="40" height="26"/><rect x="220" y="20" width="40" height="26"/><rect x="260" y="20" width="40" height="26"/><rect x="300" y="20" width="40" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="37">3.1</text><text x="80" y="37">4.1</text><text x="120" y="37">5.9</text><text x="160" y="37">2.6</text>
    <text x="200" y="37">5.3</text><text x="240" y="37">5.8</text><text x="280" y="37">9.7</text><text x="320" y="37">9.3</text>
  </g>
  <text x="20" y="14" font-size="11" fill="#6c7a93">x: one block, 8 bytes per number</text>
  <g fill="#1d6fd1">
    <circle cx="200" cy="70" r="5"/><circle cx="240" cy="70" r="5"/><circle cx="280" cy="70" r="5"/>
  </g>
  <text x="20" y="74" font-size="11" fill="#1d6fd1">x[4:7]  start 32 B, step 8</text>
  <g fill="#b4232c">
    <circle cx="40" cy="105" r="5"/><circle cx="120" cy="105" r="5"/><circle cx="200" cy="105" r="5"/><circle cx="280" cy="105" r="5"/>
  </g>
  <text x="20" y="130" font-size="11" fill="#b4232c">x[::2]  start 0 B, step 16</text>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <circle cx="320" cy="160" r="5"/><circle cx="280" cy="160" r="5"/><circle cx="240" cy="160" r="5"/><circle cx="200" cy="160" r="5"/>
    <circle cx="160" cy="160" r="5"/><circle cx="120" cy="160" r="5"/><circle cx="80" cy="160" r="5"/><circle cx="40" cy="160" r="5"/>
  </g>
  <text x="20" y="186" font-size="11" fill="#1f2a44">x[::-1]  start 56 B, step −8</text>
</svg>
```
:::

::: context basic-and-advanced The two families of indexing
NumPy's documentation splits indexing into two families. **Basic indexing** uses only integers, slices (`start:stop:step`) and the bare `:`. Anything it selects can be described by a start, a count and an even step along each axis, so it always gives a view (or a single scalar, when every axis gets an integer). **Advanced indexing** uses an array or list of positions, or an array of True/False values. Those can pick any scattered set of elements, which no single stride can describe — so NumPy has to copy them into a new block. That is lesson 4.
:::

::: context shares-memory-cost An exact answer, and a quick one
`np.shares_memory(a, b)` gives the exact answer, and for tricky strided arrays working it out can take real computation. Its cheaper cousin `np.may_share_memory(a, b)` only checks whether the two arrays' byte ranges overlap. It can say `True` when they do not truly share: for `a = np.arange(10)`, the even elements `a[::2]` and the odd elements `a[1::2]` sit in overlapping ranges but never touch the same byte, so `may_share_memory` says `True` and `shares_memory` says `False`. For proving a view, use the exact one.
:::

::: context owner-and-base Who owns the memory
Exactly one array owns a block of memory: the one that asked for it. Its `base` is `None`, and its `flags.owndata` is `True`. Every view, and every view of a view, has `base` pointing straight at that owner, which keeps the owner alive as long as any view exists. When the last view and the owner are gone, Python frees the block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="20" width="120" height="34" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">x owns the block</text>
  <text x="180" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">x.base is None</text>
  <rect x="20" y="100" width="100" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="119" font-size="12" text-anchor="middle" fill="#1f2a44">w = x[4:7]</text>
  <rect x="240" y="100" width="100" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="119" font-size="12" text-anchor="middle" fill="#1f2a44">v = w[1:]</text>
  <line x1="80" y1="100" x2="150" y2="60" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="155,56 144,58 150,66" fill="#1d6fd1"/>
  <line x1="280" y1="100" x2="210" y2="60" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="205,56 210,66 216,58" fill="#1d6fd1"/>
  <text x="95" y="80" font-size="11" text-anchor="middle" fill="#1d6fd1">base</text>
  <text x="265" y="80" font-size="11" text-anchor="middle" fill="#1d6fd1">base</text>
  <text x="180" y="145" font-size="11" text-anchor="middle" fill="#6c7a93">a view of a view still points at the owner</text>
</svg>
```

(One exception to keep in mind: the owner of the data can be an array you never named, such as a temporary NumPy made inside a function. So `b.base is a` being `False` does not prove a copy. `np.shares_memory` is the final word.)
:::

::: context negative-zero Why there is a minus zero
Floats store a sign bit separately from the size of the number, so the IEEE 754 standard has both $+0.0$ and $-0.0$. You get $-0.0$ from things like $-1 \times 0.0$ or $-\sin 0$. The two compare equal, `-0.0 == 0.0` is `True`, and in almost all arithmetic they behave the same. The sign only shows up in a few places, such as dividing by it: in NumPy, $1 / (-0.0)$ gives $-\infty$ rather than $+\infty$ — and `atan2`, where it decides which side of the cut you are on.
:::

::: context cos-pi-over-2 Why cos(π/2) is not zero
`np.pi` is the float closest to $\pi$, and it is smaller than the true $\pi$ by about $1.2 \times 10^{-16}$. Halve it and you are about $6.1 \times 10^{-17}$ short of $\pi/2$. Near $\pi/2$ the cosine falls with slope $-1$, so the cosine of that float is about $6.1 \times 10^{-17}$ instead of 0. The computer did the cosine perfectly; the input was not quite $\pi/2$. This is why rotation matrices are compared with a tolerance, never with `==`.
:::

::: context gyro-bias A rate that is not there
A **gyroscope** measures how fast the vehicle is turning. Real gyros report a small nonzero rate even when perfectly still — the **bias** — and it drifts slowly with temperature and time. Integrate an uncorrected bias of 0.13 deg/s for one minute and the attitude estimate is off by $0.13 \times 60 = 7.8°$. So navigation software estimates the bias, often first by averaging while the vehicle sits on the pad, and later with a Kalman filter in flight.
:::

::: context raw-data-rule Never edit the raw log
Flight-test and mission teams keep one hard rule: the raw telemetry, exactly as received, is never modified. Every correction produces a new, labeled product. If a processing step turns out to be wrong — a bias estimated from the wrong window, a sign flipped — you can rerun from the raw data. A view that silently writes into the raw array breaks that rule without anyone noticing, which is why the fixed `remove_bias` returns a new array.
:::
