---
id: l01-the-ndarray
title: "The ndarray: dtype, shape and strides"
minutes: 21
covers:
  - "ndarray: dtype, shape, ndim, strides, itemsize"
---

Picture two ways to keep a dozen eggs. In the first, each egg sits in its own little box somewhere in the kitchen, and you keep a card with a list of which cupboard each box is in. In the second, all twelve eggs sit side by side in one carton. Counting them, carrying them or checking each one for cracks is far faster with the carton. You grab one thing, and the eggs are all right there, in order.

A Python list of numbers is the first way. A **NumPy array** is the second. **[[NumPy|numpy-name]]** is the Python library for doing arithmetic on large blocks of numbers, and nearly every scientific Python tool you will meet — SciPy, pandas, matplotlib — is built on top of it. Its central object is the **ndarray** (say "N-D array", for *n-dimensional array*): one block of memory holding numbers that are all the same type, packed side by side, plus a small description of how to read them.

This matters in guidance and navigation work because the data is big. An inertial measurement unit (IMU), the box of accelerometers and gyroscopes at the heart of navigation, sampled at 100 Hz for one day gives 8.64 million rows. A Starlink-scale fleet sends telemetry from thousands of satellites. A Monte Carlo run — the same landing simulation repeated thousands of times with random changes — gives thousands of trajectories. You cannot loop over those one Python float at a time and still go home tonight. This lesson shows what an array really is in memory, and the handful of attributes — `dtype`, `shape`, `ndim`, `itemsize`, `strides` — that describe it. Every later lesson in this module leans on this picture.

## Why a list of floats is slow

In the Python basics module you learned that a variable is a name tag tied to an object. The same is true inside a list. A list does not hold its numbers. It holds a row of **pointers** — memory addresses — and each pointer leads to a separate float object somewhere else in memory. That is why this lesson calls a list of floats a row of **[[boxes of pointers|boxes-of-pointers]]**.

Each of those float objects is a full Python object. Memory is counted in **bytes** (one byte is 8 bits, 8 on-off switches), and a float's number takes 8 bytes. Besides those 8 bytes, it carries a count of how many names refer to it and a pointer to its type. Ask Python how big one is:

```python
>>> import sys
>>> sys.getsizeof(9.81)
24
>>> xs = [0.02, 0.11, 3.94]
>>> sys.getsizeof(xs)
88
```

The float is 24 bytes, of which only 8 are the number. That wrapping is called **[[boxing|boxing]]**: the raw number is put inside a box that Python can hand around. The list itself is 88 bytes, and that counts only its header and its three pointers, not the floats they point to.

So a list of a million floats costs about 8 MB of pointers plus about 24 MB of float objects — roughly 32 MB to hold 8 MB of actual numbers.

Memory is only half the story. Speed is the other half. To compute `2.0 * x + 1.0` for every `x` in a list, the interpreter does this, once per element:

1. Follow the pointer to find the object.
2. Check its type, to find out what `*` means for it.
3. Unbox the 8-byte number, multiply, and box the result into a brand-new float object.
4. Do the same again for `+`.

That bookkeeping costs tens of nanoseconds per element, and it dwarfs the arithmetic, which takes about a nanosecond. An array pays the type check once for the whole block. Then a tight loop written in C — a language translated ahead of time into the processor's own instructions — walks straight along memory, where every number sits right after the one before. That layout is exactly what the processor's **[[cache|cpu-cache]]** is built to read quickly.

Here is one measurement, on the machine these lessons were checked on, for a million elements:

```python
# list_vs_array.py
import timeit
import numpy as np

n = 1_000_000
vals = [0.001 * i for i in range(n)]
arr = np.array(vals)
tl = min(timeit.repeat(lambda: [2.0 * x + 1.0 for x in vals], number=5, repeat=5)) / 5
ta = min(timeit.repeat(lambda: 2.0 * arr + 1.0, number=5, repeat=5)) / 5
print(f"list comprehension: {tl*1e3:.1f} ms")
print(f"array expression:   {ta*1e3:.1f} ms")
print(f"speedup: {tl/ta:.0f}x")
```

```text
list comprehension: 31.1 ms
array expression:   0.8 ms
speedup: 37x
```

Your numbers will differ from machine to machine, but the gap is always large: here the array did the same work about 37 times faster. The last lesson of this module, on vectorization, shows how to measure this carefully and when the gap is bigger or smaller.

::: key
A list of floats is a row of pointers to separate 24-byte boxed float objects. An ndarray is one contiguous block of same-typed numbers plus a small header that says how to read it. Array arithmetic runs one compiled loop over that block, with no per-element interpreter work and no boxing.
:::

## Your first array

Everyone imports NumPy under the short name **[[np|np-convention]]**. Then `np.array` turns a list into an array:

```python
>>> import numpy as np
>>> a = np.array([0.02, 0.11, 3.94])
>>> a
array([0.02, 0.11, 3.94])
>>> type(a)
<class 'numpy.ndarray'>
>>> a * 2
array([0.04, 0.22, 7.88])
>>> a + a
array([0.04, 0.22, 7.88])
```

Notice what `a * 2` did. With a list, `* 2` would have made the list twice as long. With an array, arithmetic is **element-wise**: it happens to each element, and the result is a new array of the same length. No loop appears anywhere in your code.

Asking for one element needs a word of warning, because NumPy 2 prints it in a way that surprises people:

```python
>>> a[2]
np.float64(3.94)
>>> print(a[2])
3.94
>>> float(a[2])
3.94
```

`a[2]` is not a plain Python float. It is a **NumPy scalar**, a single number that keeps its NumPy type, and at the prompt NumPy 2 shows its type along with the value: `np.float64(3.94)`. Read it as "a float64 whose value is 3.94". The number is the same; `print` shows the bare value, and `float(...)` converts it to an ordinary Python float if you need one.

## dtype: what every element is

Because an array is one packed block, every element must be the same kind of number, stored in the same number of bytes. That shared kind is the array's **dtype** — its *data type*. The common ones:

| dtype | What it holds | Bytes per element |
| --- | --- | --- |
| `float64` | a decimal number, about 16 significant digits | 8 |
| `float32` | a decimal number, about 7 significant digits | 4 |
| `int64` | a whole number from about $-9.2 \times 10^{18}$ to $9.2 \times 10^{18}$ | 8 |
| `int32` | a whole number from about $-2.1 \times 10^{9}$ to $2.1 \times 10^{9}$ | 4 |
| `uint8` | a whole number from 0 to 255 | 1 |
| `bool` | `True` or `False` | 1 |

`float64` is the same **[[double-precision float|float64-is-double]]** as an ordinary Python float, just without the box. The number in the name is the size in bits; divide by 8 to get bytes. So `float32` is 32 bits, which is 4 bytes.

If you do not say, NumPy looks at what you gave it and picks. Whole numbers only gives `int64` on a 64-bit computer, which is what the outputs in this module show. ORBIT's in-browser Python is 32-bit, so there the same array is `int32`: 4 bytes an element, whole numbers up to about 2.1 billion. When the size matters, say it with `dtype=`. Any decimal point anywhere promotes the whole array to `float64`. You can also choose with `dtype=`:

```python
>>> import numpy as np
>>> np.array([1, 2, 3]).dtype
dtype('int64')
>>> np.array([1, 2.5, 3]).dtype
dtype('float64')
>>> np.array([True, False, True]).dtype
dtype('bool')
>>> np.array([1.0, 2.0], dtype=np.float32).dtype
dtype('float32')
```

The dtype belongs to the array, not to the values you later put in it. So a value that does not fit the dtype gets converted — silently:

```python
>>> counts = np.array([3, 1, 4, 1, 5])
>>> counts[0] = 2.9
>>> counts
array([2, 1, 4, 1, 5])
>>> counts.astype(np.float64)
array([2., 1., 4., 1., 5.])
>>> counts
array([2, 1, 4, 1, 5])
```

The 2.9 was chopped to 2 on its way into an integer array. No error, no warning. The method `.astype(new_dtype)` makes a *new* array with a new dtype; it leaves the original alone, which is why `counts` still prints as integers afterward.

::: warning An integer array quietly eats your decimals
`np.array([0, 0, 0])` is `int64`. Storing 0.75 in it stores 0. This bites when you build an array of zeros from integer literals and then fill it with measurements. Write the literals as floats (`[0.0, 0.0, 0.0]`) or pass `dtype=np.float64`, and check `.dtype` whenever a result looks strangely round. Whole numbers that are too big for a small integer type misbehave too: they **[[wrap around|wraparound]]** instead of raising an error.
:::

::: key
dtype is the one type shared by every element: `float64` (8 bytes, the default for decimals), `float32` (4 bytes, about 7 digits), `int64`, `bool` (1 byte) and others. Values stored into an array are converted to its dtype without warning. `.astype()` returns a converted copy.
:::

## shape, ndim and size

Telemetry usually comes as a table: one row per sample, one column per channel. An array can have as many **axes** — directions you can index along — as you need. A table has two.

```python
>>> import numpy as np
>>> acc = np.array([[0.02, -0.11, 9.79], [0.03, -0.10, 9.80], [0.01, -0.12, 9.81], [0.02, -0.09, 9.78]])
>>> acc
array([[ 0.02, -0.11,  9.79],
       [ 0.03, -0.1 ,  9.8 ],
       [ 0.01, -0.12,  9.81],
       [ 0.02, -0.09,  9.78]])
>>> acc.shape
(4, 3)
>>> acc.ndim
2
>>> acc.size
12
>>> len(acc)
4
>>> acc[2, 1]
np.float64(-0.12)
```

These are four accelerometer samples, each with an x, y and z reading in m/s². The z column sits near 9.8 because the sensor is resting on a table, feeling gravity.

- **shape** is a tuple giving the length of each axis. `(4, 3)` is read "four by three": 4 rows, 3 columns. Axis 0 runs down the rows; axis 1 runs across the columns.
- **ndim** is the number of axes, which is `len(acc.shape)`. Here 2.
- **size** is the total number of elements, the product of the shape: $4 \times 3 = 12$.
- `len(acc)` is the length of the first axis only: 4 rows.
- `acc[2, 1]` picks row 2, column 1 — the y reading of the third sample. Counting starts at 0, as with lists. The next lessons cover indexing in full.

In GNC code, the shape `(N, 3)` — "N by three", N samples of a three-component vector — is everywhere: positions, velocities, accelerations, angular rates. Get used to reading shapes aloud.

One-dimensional arrays and single numbers have shapes too:

```python
>>> v = np.array([7000.0, 0.0, 0.0])
>>> v.shape, v.ndim
((3,), 1)
>>> g = np.array(9.81)
>>> g.shape, g.ndim
((), 0)
```

A position vector of three numbers has shape `(3,)`. The trailing comma is how Python writes a one-element tuple, as you saw in the lists lesson. An array made from a single number has the empty shape `()` and zero axes.

::: warning (3,) is not (3, 1) or (1, 3)
A shape of `(3,)` is a flat row of three numbers with one axis. `(3, 1)` is a table of three rows and one column; `(1, 3)` is one row of three columns. All three hold three numbers, and all three print differently and combine differently with other arrays. The broadcasting lesson shows how much this matters. When code misbehaves, print `.shape` first.
:::

## itemsize and nbytes

**itemsize** is the number of bytes one element takes — the dtype's size. **nbytes** is the size of the whole data block: `size × itemsize`.

```python
>>> acc.itemsize
8
>>> acc.nbytes
96
>>> acc.astype(np.float32).nbytes
48
```

Twelve elements at 8 bytes each is 96 bytes. The same table in `float32` is half that. (`nbytes` counts only the numbers. The array's small header is not included.)

::: example A day of IMU data, list versus array
An inertial measurement unit reports three accelerations at 100 Hz. How much memory does one day take as a `float64` array, and as a list of lists of Python floats?

**Rows.** One day is $86{,}400$ s. At 100 samples per second that is $86{,}400 \times 100 = 8{,}640{,}000$ rows.

**Array.** The shape is `(8640000, 3)`, so the size is $8{,}640{,}000 \times 3 = 25{,}920{,}000$ elements. At an itemsize of 8 bytes, `nbytes` is $25{,}920{,}000 \times 8 = 207{,}360{,}000$ bytes, about 207 MB.

**List of lists.** Each row is its own small list. Measured on Python 3.11, one row costs about 160 bytes:

- three float objects at 24 bytes each: $3 \times 24 = 72$ bytes;
- the inner list object, a header plus three pointers: 80 bytes;
- the outer list's pointer to that row: 8 bytes.

That is $72 + 80 + 8 = 160$ bytes per row, against $3 \times 8 = 24$ bytes per row in the array. For the whole day, $8{,}640{,}000 \times 160 = 1{,}382{,}400{,}000$ bytes, about 1.38 GB.

**Compare.** $160 / 24 \approx 6.7$, so the list version is almost seven times bigger. Sanity check: 207 MB times 6.7 is about 1.38 GB, which matches. A laptop can hold the array comfortably; the list version starts to strain it, and it will be far slower to process as well.
:::

## strides: how NumPy finds an element

Memory is not a table. It is one long numbered row of bytes, like a street of houses. So how does a two-dimensional array find row 2, column 1?

It stores one more tuple: the **strides**. The stride for an axis is the number of bytes you must jump to move one step along that axis.

```python
>>> acc.strides
(24, 8)
```

Read it as: "to move one row down, jump 24 bytes; to move one column across, jump 8 bytes." Moving across one column steps over one `float64`, which is 8 bytes. Moving down one row steps over a whole row of three `float64`s, which is $3 \times 8 = 24$ bytes. The rows are laid end to end, first row first — this is called **[[row-major|row-major]]** order.

With the strides, finding any element is one small sum. Write $s_0$ (read "s sub zero") for the stride of axis 0 and $s_1$ for axis 1. Element `[i, j]` starts at this many bytes from the start of the block:

$$
\text{offset} = i \, s_0 + j \, s_1 .
$$

For `acc[2, 1]` that is $2 \times 24 + 1 \times 8 = 56$ bytes. Since each element is 8 bytes, 56 bytes in is element number $56 / 8 = 7$ in the flat row, counting from 0: row 0 holds elements 0 to 2, row 1 holds 3 to 5, row 2 holds 6 to 8, and column 1 of row 2 is element 7. The **[[stride picture|stride-picture]]** in the notes draws this.

::: key
An ndarray's header holds its dtype, shape and strides. **shape** gives the length of each axis, **ndim** the number of axes, **itemsize** the bytes per element, and **strides** the bytes to step along each axis. Element `[i, j]` sits at byte offset $i \, s_0 + j \, s_1$ from the start of the data. A `(4, 3)` `float64` array has strides `(24, 8)`.
:::

::: example Finding one number in a state history
A simulation stores its state history — position $x, y, z$ and velocity $v_x, v_y, v_z$ — in a `float64` array of shape `(1000, 6)`. Where in memory is the $v_y$ of sample 10?

```python
>>> import numpy as np
>>> states = np.zeros((1000, 6))
>>> states.shape, states.strides
((1000, 6), (48, 8))
>>> states.nbytes
48000
>>> 10 * states.strides[0] + 4 * states.strides[1]
512
```

**The strides.** One column is one `float64`: 8 bytes. One row is six of them: $6 \times 8 = 48$ bytes. So the strides are `(48, 8)`, as NumPy reports.

**The indexes.** Sample 10 is row 10. The columns are $x, y, z, v_x, v_y, v_z$ at positions 0 to 5, so $v_y$ is column 4.

**The offset.** $10 \times 48 + 4 \times 8 = 480 + 32 = 512$ bytes from the start.

**Sanity check.** $512 / 8 = 64$, so it is element 64 in the flat row. Ten full rows of six hold elements 0 to 59; row 10 starts at 60, and column 4 is $60 + 4 = 64$. The two counts agree. The total size, $1000 \times 6 \times 8 = 48{,}000$ bytes, also matches `nbytes`.
:::

## Changing the description, not the data

Here is the idea that makes NumPy fast in a second way. Since the strides say how to walk the data, you can get a new way of *seeing* the same numbers by writing a new header, without moving a single byte.

The **transpose** of a table swaps its rows and columns. NumPy writes it `acc.T`:

```python
>>> acc.T.shape
(3, 4)
>>> acc.T.strides
(8, 24)
```

The shape flipped from `(4, 3)` to `(3, 4)`, and the strides flipped from `(24, 8)` to `(8, 24)`. Nothing was copied. The same 96 bytes are now read column by column. For an array of 200 MB, that is the difference between an instant and a long wait.

An array that shares another array's data but has its own header is called a **view**. Views are everywhere in NumPy — slicing makes them — and they are why the question "if I change this, does that change too?" has a surprising answer. That is the subject of lesson 3. Lesson 7 comes back to strides to explain why some reshapes are free and others copy.

::: warning A view is not a copy
Because `acc.T` shares memory with `acc`, writing into one changes what the other shows. Lesson 3 covers how to tell, and how to get a real copy with `.copy()` when you need one.
:::

## Check yourself

::: check
An array `imu` has dtype `float32` and shape `(200, 6)`. Give its `ndim`, `size`, `itemsize`, `nbytes` and `strides`.
:::

::: answer
- `ndim` is the number of axes, the length of the shape tuple: 2.
- `size` is the product of the shape: $200 \times 6 = 1200$ elements.
- `itemsize` for `float32` is 32 bits, which is $32 / 8 = 4$ bytes.
- `nbytes` is size times itemsize: $1200 \times 4 = 4800$ bytes.
- `strides`: one column is one element, 4 bytes; one row is six elements, $6 \times 4 = 24$ bytes. So `(24, 4)`.
:::

::: check
A script builds `temps = np.array([20, 21, 19])` and later does `temps[1] = 21.6`. What is stored, and why was there no error? How should the array have been made?
:::

::: answer
`temps` was built from whole numbers only, so its dtype is `int64`. Storing 21.6 converts the value to the array's dtype, and converting a float to an integer drops the fractional part, so 21 is stored. NumPy does not warn, because converting on assignment is its normal rule: the dtype belongs to the array.

Make it a float array from the start: `np.array([20.0, 21.0, 19.0])` or `np.array([20, 21, 19], dtype=np.float64)`. Checking `temps.dtype` would have shown the problem.
:::

::: check
Explain, in terms of what sits in memory, why a list of one million Python floats uses about four times the memory of a `float64` array of the same numbers.
:::

::: answer
The array stores each number as 8 raw bytes, side by side: 8 MB for a million.

The list stores an 8-byte pointer for each element, and each pointer leads to a separate float object of 24 bytes (the 8-byte value plus a reference count and a type pointer). That is $8 + 24 = 32$ bytes per element, or about 32 MB. And $32 / 8 = 4$.
:::

::: check
A `float64` array has shape `(3, 5)`. What are its strides, and at what byte offset does element `[1, 3]` start? Check your answer by counting elements.
:::

::: answer
One column is one `float64`, 8 bytes. One row is five of them, $5 \times 8 = 40$ bytes. Strides: `(40, 8)`.

Offset of `[1, 3]`: $1 \times 40 + 3 \times 8 = 40 + 24 = 64$ bytes.

Check: $64 / 8 = 8$, so it is flat element 8. Row 0 holds elements 0 to 4, row 1 starts at element 5, and column 3 of row 1 is $5 + 3 = 8$. It agrees.
:::

::: check
At the prompt, `v[0]` shows `np.float64(7000.0)` but `print(v[0])` shows `7000.0`. Are these different numbers? What is `v[0]`, and how would you get an ordinary Python float from it?
:::

::: answer
They are the same number shown two ways. `v[0]` is a NumPy scalar of type `float64`. At the prompt, NumPy 2 displays a scalar together with its type, as `np.float64(7000.0)`; `print` shows only the value. `float(v[0])` converts it to a plain Python float. For arithmetic you rarely need to convert, because NumPy scalars behave like numbers.
:::

## Summary

| Attribute or idea | Meaning | Example for `acc`, a `(4, 3)` `float64` array |
| --- | --- | --- |
| ndarray | one contiguous block of same-typed numbers plus a header | `np.array([[...], ...])` |
| `dtype` | the type every element shares | `float64` |
| `shape` | length of each axis | `(4, 3)` |
| `ndim` | number of axes, `len(shape)` | `2` |
| `size` | total elements, product of shape | `12` |
| `itemsize` | bytes per element | `8` |
| `nbytes` | `size * itemsize` | `96` |
| `strides` | bytes to step along each axis | `(24, 8)` |
| Element offset | byte position of `[i, j]` | $i \, s_0 + j \, s_1$ |
| NumPy scalar | one element, shown as `np.float64(...)` | `acc[2, 1]` |
| List of floats | pointers to 24-byte boxed objects | about 4 times the memory, far slower |

The next lesson shows the ways to make arrays without typing every number: filled with zeros or a constant, as evenly spaced time grids, as identity matrices, and full of reproducible random noise.

::: context numpy-name Where NumPy came from
The name is short for *Numerical Python*. In the late 1990s and early 2000s, Python had two competing array libraries, Numeric and numarray, and scientific code was split between them. In 2005 Travis Oliphant merged the two into one package, NumPy, and the community settled on it. NumPy 2.0, released in 2024, was the first major version change in about eighteen years; one visible change is how single numbers print, which this lesson shows.
:::

::: context boxes-of-pointers A list holds addresses, not numbers
The list is a row of addresses. The numbers live in separate objects scattered around memory, each with its own header. The array is one run of raw 8-byte numbers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">Python list</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="10" y="26" width="34" height="24"/><rect x="44" y="26" width="34" height="24"/><rect x="78" y="26" width="34" height="24"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="27" y="42">ptr</text><text x="61" y="42">ptr</text><text x="95" y="42">ptr</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="27" y1="50" x2="170" y2="36"/><line x1="61" y1="50" x2="250" y2="82"/><line x1="95" y1="50" x2="180" y2="112"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="170" y="24" width="84" height="24" fill="#8fb8f0"/>
    <rect x="250" y="70" width="84" height="24" fill="#8fb8f0"/>
    <rect x="180" y="100" width="84" height="24" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="212" y="40">float 0.02</text><text x="292" y="86">float 0.11</text><text x="222" y="116">float 3.94</text>
  </g>
  <text x="10" y="150" font-size="12" fill="#1f2a44">ndarray data block</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#f2b880">
    <rect x="10" y="158" width="60" height="26"/><rect x="70" y="158" width="60" height="26"/><rect x="130" y="158" width="60" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="175">0.02</text><text x="100" y="175">0.11</text><text x="160" y="175">3.94</text>
  </g>
  <text x="200" y="175" font-size="11" fill="#6c7a93">8 + 8 + 8 bytes, side by side</text>
</svg>
```
:::

::: context boxing What is inside the box
A CPython float object on a 64-bit machine is 24 bytes: 8 for a **reference count** (how many names point at it, so Python knows when to free it), 8 for a pointer to its type (so `+` knows it is a float), and 8 for the number. Every arithmetic result in a Python loop needs a fresh box, which means asking for memory, filling in the header, and later freeing it. The array skips all of that: the loop inside NumPy works on the raw 8-byte numbers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="100" height="36" fill="#fff"/>
    <rect x="120" y="30" width="100" height="36" fill="#fff"/>
    <rect x="220" y="30" width="100" height="36" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="52">ref count</text><text x="170" y="52">type pointer</text><text x="270" y="52">value 9.81</text>
    <text x="70" y="84">8 bytes</text><text x="170" y="84">8 bytes</text><text x="270" y="84">8 bytes</text>
  </g>
  <text x="20" y="20" font-size="12" fill="#1f2a44">one Python float: 24 bytes, 8 of them the number</text>
</svg>
```
:::

::: context cpu-cache Why side by side is fast
A processor is much faster than main memory. To hide that, it keeps small, very fast memories called **caches**, and it never fetches one number alone: it pulls in a whole **cache line**, usually 64 bytes, at a time. With an array, one fetch brings in eight neighboring `float64`s, and the processor can even guess which line comes next and fetch it early. With a list, each float may live anywhere, so many fetches bring in one useful number and a lot of nothing.
:::

::: context np-convention Why everyone writes np
`import numpy as np` binds the module to the short name `np`, exactly like the `import ... as ...` form from the modules lesson. It is only a convention, but it is universal: documentation, Stack Overflow answers and every flight-data notebook you will read use `np.`, so using it makes your code instantly familiar. Do not write `from numpy import *`; it would replace Python's own `sum`, `min`, `max` and `abs` with NumPy's versions, which behave differently.
:::

::: context float64-is-double The same float you already know
An ordinary Python float is an IEEE 754 **double-precision** number: 64 bits, with 53 bits of significand, giving about 15 to 16 significant decimal digits. NumPy's `float64` is exactly that format — so everything from the floating-point lesson in the Python basics module (why `0.1 + 0.2` is not `0.3`, why you compare with a tolerance) still holds, element by element. `float32` has 24 bits of significand, about 7 digits, which is not enough for an orbit position in meters; lesson 10 shows why.
:::

::: context wraparound When a small integer overflows
A `uint8` holds 0 to 255, like a car odometer with only 256 positions. Go past the top and it rolls back to the start. Adding `np.uint8(100)` to a `uint8` array holding 200 and 100 gives 44 and 200: $200 + 100 = 300$, and $300 - 256 = 44$. No error is raised. Image and sensor data often arrive as `uint8` or `uint16`, so convert with `.astype(np.float64)` before doing arithmetic on them.
:::

::: context row-major Rows laid end to end
In row-major order, also called **C order** after the C language, the whole of row 0 is stored first, then row 1, and so on. The last index changes fastest as you walk through memory. Fortran and many linear-algebra libraries use **column-major** order instead, storing whole columns end to end. NumPy can do either; row-major is its default. Lesson 7 shows when the difference matters.
:::

::: context stride-picture The table and the street of bytes
The `(4, 3)` array `acc` is one street of twelve 8-byte houses. The strides turn a row and column into a house number. Element `[2, 1]` is at $2 \times 24 + 1 \times 8 = 56$ bytes, which is house number 7.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="20" y="20" width="40" height="22"/><rect x="60" y="20" width="40" height="22"/><rect x="100" y="20" width="40" height="22"/>
    <rect x="20" y="42" width="40" height="22"/><rect x="60" y="42" width="40" height="22"/><rect x="100" y="42" width="40" height="22"/>
    <rect x="20" y="64" width="40" height="22"/><rect x="60" y="64" width="40" height="22" fill="#f2b880"/><rect x="100" y="64" width="40" height="22"/>
    <rect x="20" y="86" width="40" height="22"/><rect x="60" y="86" width="40" height="22"/><rect x="100" y="86" width="40" height="22"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="end">
    <text x="15" y="35">0</text><text x="15" y="57">1</text><text x="15" y="79">2</text><text x="15" y="101">3</text>
  </g>
  <text x="80" y="79" font-size="11" fill="#1f2a44" text-anchor="middle">[2,1]</text>
  <text x="160" y="46" font-size="11" fill="#1d6fd1">down one row: 24 bytes</text>
  <text x="160" y="64" font-size="11" fill="#1d6fd1">across one column: 8 bytes</text>
  <g stroke="#1f2a44" stroke-width="1" fill="#8fb8f0">
    <rect x="20" y="140" width="27" height="22"/><rect x="47" y="140" width="27" height="22"/><rect x="74" y="140" width="27" height="22"/>
    <rect x="101" y="140" width="27" height="22" fill="#fff"/><rect x="128" y="140" width="27" height="22" fill="#fff"/><rect x="155" y="140" width="27" height="22" fill="#fff"/>
    <rect x="182" y="140" width="27" height="22"/><rect x="209" y="140" width="27" height="22" fill="#f2b880"/><rect x="236" y="140" width="27" height="22"/>
    <rect x="263" y="140" width="27" height="22" fill="#fff"/><rect x="290" y="140" width="27" height="22" fill="#fff"/><rect x="317" y="140" width="27" height="22" fill="#fff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="33" y="155">0</text><text x="60" y="155">1</text><text x="87" y="155">2</text><text x="114" y="155">3</text>
    <text x="141" y="155">4</text><text x="168" y="155">5</text><text x="195" y="155">6</text><text x="222" y="155">7</text>
    <text x="249" y="155">8</text><text x="276" y="155">9</text><text x="303" y="155">10</text><text x="330" y="155">11</text>
  </g>
  <text x="20" y="182" font-size="11" fill="#6c7a93">memory: row 0, row 1, row 2, row 3, end to end</text>
  <text x="222" y="130" font-size="11" fill="#b4232c" text-anchor="middle">byte 56</text>
</svg>
```
:::
