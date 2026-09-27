---
id: l02-creating-arrays
title: Making arrays
minutes: 18
covers:
  - "Creation: zeros, ones, full, arange, linspace, eye, default_rng"
---

When you start a spreadsheet, you do not type every cell. You ask for an empty sheet, you type 0 in one cell and drag it down a thousand rows, you fill a column with times by typing the first two and letting the program continue the pattern. The numbers come from a rule, not from your fingers.

NumPy works the same way. In the last lesson you built arrays by typing lists into `np.array`. That is fine for four rows of test data. Real work needs a thousand-row results table waiting to be filled, a time grid at exactly 100 Hz, a $3 \times 3$ matrix meaning "no rotation", or a million samples of sensor noise. Each of those has a one-line **creation function**, and this lesson covers the ones you will use every day: `np.zeros`, `np.ones`, `np.full`, `np.arange`, `np.linspace`, `np.eye` and `np.random.default_rng`.

Two habits run through all of them. First, the size you ask for is a **shape**, the tuple from lesson 1. Second, each function picks a **dtype**, and you should know which one, because the wrong one silently eats your decimals.

## From a list: np.array

`np.array` copies a Python list into a new array. A list of lists becomes a table, one inner list per row:

```python
>>> import numpy as np
>>> q = np.array([1.0, 0.0, 0.0, 0.0])
>>> q.shape
(4,)
>>> C = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])
>>> C.shape
(3, 3)
>>> np.array([1, 2, 3], dtype=np.float64)
array([1., 2., 3.])
```

`q` here is a **[[quaternion|quaternion]]** for "no rotation", four numbers with shape `(4,)`. `C` is a $3 \times 3$ table. Passing `dtype=` overrides NumPy's guess; here it turns whole numbers into floats.

Every row must have the same length, because an array is a rectangle:

```python
>>> np.array([[1.0, 2.0], [3.0]])
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ValueError: setting an array element with a sequence. The requested array has an inhomogeneous shape after 1 dimensions. The detected shape was (2,) + inhomogeneous part.
```

**Inhomogeneous** means "not all the same". The first row has two numbers and the second has one, so there is no rectangle to build. When you read a file and see this error, one of your rows is short — often a line cut off at the end of a log.

## Blank arrays: zeros, ones and full

Often you know the shape of the answer before you know the numbers. You make the array first and fill it in later. This is called **[[preallocating|preallocation]]** the array.

```python
>>> np.zeros(4)
array([0., 0., 0., 0.])
>>> np.zeros((2, 3))
array([[0., 0., 0.],
       [0., 0., 0.]])
>>> np.ones((2, 2))
array([[1., 1.],
       [1., 1.]])
>>> np.full(3, 9.80665)
array([9.80665, 9.80665, 9.80665])
>>> np.full((2, 3), np.nan)
array([[nan, nan, nan],
       [nan, nan, nan]])
>>> np.zeros(3, dtype=np.int64)
array([0, 0, 0])
```

- `np.zeros(shape)` fills with 0.0. For one axis you can pass a plain number; for more, pass a tuple.
- `np.ones(shape)` fills with 1.0.
- `np.full(shape, value)` fills with any value you choose. Here that is standard gravity, $g_0 = 9.80665\,\mathrm{m/s^2}$.
- `np.zeros` and `np.ones` make `float64` unless you pass `dtype=`.

`np.full(shape, np.nan)` deserves a special mention. **[[NaN|nan-marker]]**, "not a number", is a float value meaning "no value here". Starting a results table as all NaN means that any row you forgot to fill stands out: it is still NaN, and any average that includes it comes out NaN too, instead of quietly pulling the answer toward zero.

::: warning The shape goes in one tuple
`np.zeros(2, 3)` does not make a 2-by-3 array:

```python
>>> np.zeros(2, 3)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: Cannot interpret '3' as a data type
```

The second argument of `np.zeros` is the dtype, so NumPy tried to read `3` as a type. Write `np.zeros((2, 3))`, with the inner brackets. The same goes for `ones` and `full`.
:::

`np.full` is the one that sets a trap. It takes its dtype from the fill value, so a whole-number fill makes an integer array:

```python
>>> k = np.full(3, 7)
>>> k.dtype
dtype('int64')
>>> k[0] = 7.5
>>> k
array([7, 7, 7])
>>> np.full(3, 7.0).dtype
dtype('float64')
```

As in lesson 1, the 7.5 was chopped to 7 on its way in. Write the fill value as `7.0`, or pass `dtype=np.float64`.

Each of these has a `_like` partner that copies the shape and dtype of an array you already have:

```python
>>> acc = np.array([[0.02, -0.11, 9.79], [0.03, -0.10, 9.80]])
>>> np.zeros_like(acc)
array([[0., 0., 0.],
       [0., 0., 0.]])
>>> np.full_like(acc, np.nan).shape
(2, 3)
```

That saves you from typing the shape twice and getting it wrong when the input changes.

::: warning np.empty is not empty
You will see `np.empty(shape)` in other people's code. It is faster than `zeros` because it does not write anything: it hands you the block of memory with whatever bytes happened to be there. The values look like random garbage, sometimes like plausible numbers. Only use it when you are certain every element will be written before it is read. When in doubt, use `zeros` or `full(shape, np.nan)`.
:::

::: key
`np.zeros(shape)`, `np.ones(shape)` and `np.full(shape, value)` make a new array of that shape; the shape is a tuple such as `(2, 3)`. `zeros` and `ones` default to `float64`; `full` takes its dtype from the value, so `np.full(3, 7)` is an integer array. `np.full(shape, np.nan)` marks "not yet filled". `zeros_like(a)` copies the shape and dtype of `a`.
:::

## Counting in steps: arange

`np.arange` is the array version of `range` from the Python basics module. Read it "a-range", for *array range*, not "arrange". It takes a start, a stop and a step, and the stop is **not** included — the same half-open rule as `range` and slicing:

```python
>>> np.arange(5)
array([0, 1, 2, 3, 4])
>>> np.arange(2, 10, 3)
array([2, 5, 8])
>>> np.arange(0.0, 1.0, 0.25)
array([0.  , 0.25, 0.5 , 0.75])
```

With whole numbers it is perfect. You get integer indexes, sample numbers, or every third sample number, exactly.

With a decimal step it has a flaw. Watch:

```python
>>> np.arange(1.0, 1.3, 0.1)
array([1. , 1.1, 1.2, 1.3])
>>> (1.3 - 1.0) / 0.1
3.0000000000000004
```

The stop was 1.3, and 1.3 is not supposed to be included. It is. Here is why. `arange` works out how many elements to make by dividing the distance by the step and rounding **up**. In exact arithmetic that is $(1.3 - 1.0) / 0.1 = 3$, which gives 3 elements. But neither 0.1 nor 1.3 can be stored exactly as a float, as you saw in the floating-point lesson of the basics module, and the division gives 3.0000000000000004. Rounded up, that is 4. So you get an extra element that should not be there.

Whether this happens depends on tiny rounding errors in the particular numbers. You cannot see it coming by looking at your code.

::: warning Use arange for whole numbers, linspace for decimals
With a decimal step, `np.arange` may give one element more or one fewer than you expect, depending on rounding you cannot see. For float grids, use `np.linspace`, which takes the number of points instead of the step. If you need `arange`, count in whole numbers and scale afterward: `np.arange(1001) * 0.01`.
:::

## Evenly spaced points: linspace

`np.linspace(start, stop, num)` — read "lin-space", for *linear spacing* — makes exactly `num` evenly spaced points from `start` to `stop`, and by default it **includes** the stop:

```python
>>> np.linspace(0.0, 1.0, 5)
array([0.  , 0.25, 0.5 , 0.75, 1.  ])
>>> np.linspace(0.0, 1.0, 5, endpoint=False)
array([0. , 0.2, 0.4, 0.6, 0.8])
>>> t, dt = np.linspace(0.0, 2.0, 5, retstep=True)
>>> t
array([0. , 0.5, 1. , 1.5, 2. ])
>>> dt
np.float64(0.5)
```

Because both ends are included, `num` points make `num - 1` gaps. So the spacing is

$$
\Delta t = \frac{\text{stop} - \text{start}}{\text{num} - 1},
$$

read "delta t", the step between neighbors. In the first line, $(1.0 - 0.0)/(5 - 1) = 0.25$. With `endpoint=False` the stop is left out, the points split the range into `num` gaps instead, and the step is $1.0 / 5 = 0.2$. With `retstep=True`, `linspace` also hands back the step it used, which is a cheap sanity check.

This "points versus gaps" count is the classic **[[fencepost|fencepost]]** problem, and it is the part of `linspace` to think about every time.

::: example A time grid at 100 Hz
A test records for 10 seconds at 100 Hz, starting at $t = 0$. Build its time stamps.

**How many points?** At 100 Hz the step is $1 / 100 = 0.01$ s. Ten seconds is $10 / 0.01 = 1000$ gaps. With a sample at both $t = 0$ and $t = 10$, that is $1000 + 1 = 1001$ points.

```python
>>> import numpy as np
>>> t = np.linspace(0.0, 10.0, 1001)
>>> t.shape
(1001,)
>>> t[:4]
array([0.  , 0.01, 0.02, 0.03])
>>> t[-1]
np.float64(10.0)
>>> t[1] - t[0]
np.float64(0.01)
```

**Check the step.** $(10.0 - 0.0) / (1001 - 1) = 0.01$ s, and `t[1] - t[0]` agrees.

**Compare with arange.** The obvious `arange` call leaves out the last sample, because its stop is never included:

```python
>>> bad = np.arange(0.0, 10.0, 0.01)
>>> bad.shape
(1000,)
>>> bad[-1]
np.float64(9.99)
>>> t_int = np.arange(1001) * 0.01
>>> t_int[-1]
np.float64(10.0)
```

Counting in whole numbers and scaling, as in `t_int`, gets the same 1001 points. Sanity check: a grid ending at 9.99 s would be 10 ms short, and if you had asked for 1000 points with `linspace` the step would have been $10 / 999 \approx 0.01001$ s, which is not 100 Hz at all. Always ask "points or gaps?"
:::

::: key
`np.arange(start, stop, step)` excludes `stop`, like `range`; use it for whole-number steps. `np.linspace(start, stop, num)` gives exactly `num` points and includes both ends, so the step is $(\text{stop} - \text{start})/(\text{num} - 1)$; use it for float grids. `endpoint=False` leaves out the stop; `retstep=True` also returns the step.
:::

## The identity matrix: eye

A **matrix** is a rectangular table of numbers, the kind you will multiply vectors by. The **identity matrix** is the square one with 1s down its **main diagonal** — from top left to bottom right — and 0s everywhere else. Multiplying a vector by it gives the same vector back, the way multiplying a number by 1 does. NumPy makes it with `np.eye`, a pun on the letter $I$, the usual symbol for it:

```python
>>> np.eye(3)
array([[1., 0., 0.],
       [0., 1., 0.],
       [0., 0., 1.]])
>>> np.eye(2, 3)
array([[1., 0., 0.],
       [0., 1., 0.]])
```

`np.eye(n)` is $n \times n$. `np.eye(n, m)` is $n$ rows by $m$ columns with 1s on the diagonal as far as it goes.

In GNC code the identity shows up constantly. A **[[direction cosine matrix|dcm-identity]]** that equals `np.eye(3)` means "these two frames are lined up; no rotation". An estimator — the software that works out where the vehicle is from noisy measurements — often starts its uncertainty as a number times the identity. Multiplying an array by a plain number multiplies every element, so

```python
>>> P0 = 100.0**2 * np.eye(3)
>>> P0
array([[10000.,     0.,     0.],
       [    0., 10000.,     0.],
       [    0.,     0., 10000.]])
```

puts $100^2 = 10{,}000\,\mathrm{m^2}$ on the diagonal. That is a **[[covariance|covariance]]** saying "each of my three position coordinates is uncertain by about 100 m, and the errors are unrelated". You will meet this matrix in the Kalman filter module.

::: key
`np.eye(n)` is the $n \times n$ identity: 1s on the main diagonal, 0s elsewhere. `np.eye(3)` is the direction cosine matrix for "no rotation", and `sigma**2 * np.eye(n)` is a diagonal covariance.
:::

## Random numbers: default_rng

Simulations need noise: sensor errors, wind gusts, engine thrust that is a little off. NumPy makes random numbers through a **generator**, an object that produces a stream of numbers that look random. You create one with `np.random.default_rng`, giving it a **[[seed|seed]]**, a whole number that fixes where the stream starts:

```python
>>> import numpy as np
>>> rng = np.random.default_rng(42)
>>> rng.normal(0.0, 0.01, size=4)
array([ 0.00304717, -0.01039984,  0.00750451,  0.00940565])
>>> rng.uniform(-1.0, 1.0, size=(2, 3))
array([[-0.8116453 ,  0.9512447 ,  0.5222794 ],
       [ 0.57212861, -0.74377273, -0.09922812]])
>>> rng.integers(0, 10, size=5)
array([5, 3, 1, 9, 7])
>>> rng.random(3)
array([0.82276161, 0.4434142 , 0.22723872])
```

The methods you will use most:

- `rng.normal(mean, std, size)` draws from the bell-shaped **[[normal distribution|normal-distribution]]**. `std` is the **standard deviation**, the typical size of the spread: about two thirds of draws land within one standard deviation of the mean. Sensor noise is usually modeled this way.
- `rng.uniform(low, high, size)` draws evenly from `low` up to `high`, every value equally likely.
- `rng.integers(low, high, size)` draws whole numbers from `low` up to but **not including** `high` — half-open again.
- `rng.random(size)` draws evenly from 0 up to 1.

`size` is a shape, exactly as for `zeros`.

Now the important part. Make a second generator with the same seed, and it gives the same numbers:

```python
>>> again = np.random.default_rng(42)
>>> again.normal(0.0, 0.01, size=4)
array([ 0.00304717, -0.01039984,  0.00750451,  0.00940565])
```

That is what makes a simulation **reproducible**: run it tomorrow, or on a teammate's laptop, and it gives the same answer. When case 317 of a Monte Carlo run fails, you can rerun the study and watch case 317 fail again, exactly the same way. Lesson 11 is all about doing this properly across thousands of cases, and why the older `np.random.seed` style is avoided.

::: example Simulating a noisy accelerometer
An accelerometer sits still on a table. It should read standard gravity, $9.80665\,\mathrm{m/s^2}$, but it has noise with a standard deviation of $0.02\,\mathrm{m/s^2}$. Simulate five readings and average them.

```python
>>> import numpy as np
>>> rng = np.random.default_rng(7)
>>> truth = np.full(5, 9.80665)
>>> meas = truth + rng.normal(0.0, 0.02, size=5)
>>> meas
array([9.8066746 , 9.81262491, 9.80116724, 9.78883816, 9.79755658])
>>> meas.mean()
np.float64(9.801372300846298)
>>> meas.mean() - 9.80665
np.float64(-0.005277699153701576)
```

**Step 1.** `np.full(5, 9.80665)` makes five copies of the true value. The fill value has a decimal point, so the dtype is `float64`.

**Step 2.** `rng.normal(0.0, 0.02, size=5)` makes five noise values centered on zero with a spread of 0.02.

**Step 3.** Adding two arrays of the same shape adds them element by element, so each reading is truth plus its own noise.

**Step 4.** `.mean()` averages the five readings: about $9.8014\,\mathrm{m/s^2}$, which is $0.0053\,\mathrm{m/s^2}$ below the truth.

**Sanity check.** Each reading is off by roughly 0.02 or less, and all five sit between 9.788 and 9.813, so that fits. Averaging $n$ independent readings shrinks the typical error by $\sqrt{n}$, so the mean should typically be off by about $0.02 / \sqrt{5} \approx 0.0089\,\mathrm{m/s^2}$. An error of 0.0053 is well within that. Run it again with seed 7 and you get exactly these numbers; change the seed and you get a different, equally believable set.
:::

::: warning Without a seed, every run is different
`np.random.default_rng()` with no argument takes its seed from the operating system, so every run draws different numbers. That is fine for a quick look, and wrong for any result you will report or test. Pass a seed, and write it down with the result.
:::

::: key
`rng = np.random.default_rng(seed)` makes a generator. `rng.normal(mean, std, size)`, `rng.uniform(low, high, size)`, `rng.integers(low, high, size)` (high excluded) and `rng.random(size)` draw arrays of any shape. The same seed gives the same numbers every time, which makes simulations reproducible.
:::

## Check yourself

::: check
You need the sample times for a 5-minute ground test logged at 50 Hz, with a sample at $t = 0$ and at $t = 300$ s. Write the `linspace` call and give its step. Then say what `np.arange(0.0, 300.0, 0.02)` would give you instead.
:::

::: answer
Five minutes is $5 \times 60 = 300$ s. At 50 Hz the step is $1 / 50 = 0.02$ s, so there are $300 / 0.02 = 15{,}000$ gaps and $15{,}000 + 1 = 15{,}001$ points: `np.linspace(0.0, 300.0, 15001)`. The step is $300 / (15001 - 1) = 0.02$ s, as it should be.

`np.arange(0.0, 300.0, 0.02)` leaves out the stop, so at best it ends at 299.98 s with 15,000 points and misses the last sample. Because the step is a decimal, rounding could even change the count by one. For a float grid, `linspace` is the safe choice; `np.arange(15001) * 0.02` is the safe `arange` version.
:::

::: check
A colleague writes `counts = np.full(10, 0)` and later stores average rates like 0.25 and 1.75 into it. Every value comes out as 0 or 1. Explain, and fix it two ways.
:::

::: answer
`np.full` takes its dtype from the fill value. The fill value `0` is a whole number, so `counts` is an `int64` array. Storing 0.25 converts it to an integer by dropping the fraction, giving 0; 1.75 becomes 1. There is no warning.

Fix it by making the fill value a float, `np.full(10, 0.0)`, or by naming the dtype, `np.full(10, 0, dtype=np.float64)`. `np.zeros(10)` would also work, since `zeros` makes `float64` by default.
:::

::: check
What shapes and dtypes do these make? `np.zeros((4, 3))`, `np.eye(2)`, `np.arange(6)`, `np.full((2,), np.nan)`, `rng.integers(0, 6, size=(10, 2))`.
:::

::: answer
- `np.zeros((4, 3))`: shape `(4, 3)`, `float64`, all 0.0.
- `np.eye(2)`: shape `(2, 2)`, `float64`, 1s on the diagonal.
- `np.arange(6)`: shape `(6,)`, `int64`, the numbers 0 to 5.
- `np.full((2,), np.nan)`: shape `(2,)`, `float64` — NaN is a float, so the array must be.
- `rng.integers(0, 6, size=(10, 2))`: shape `(10, 2)`, `int64`, whole numbers from 0 to 5 (6 is excluded). That is twenty rolls of a six-sided die, numbered 0 to 5.
:::

::: check
Two teammates run the same Monte Carlo script and get different answers. The script makes its generator with `np.random.default_rng()`. What is going on, and what one change fixes it?
:::

::: answer
With no argument, `default_rng()` picks its seed from the operating system, which gives a different seed on every run. So every run draws different random numbers and the results differ.

Pass a fixed seed, for example `np.random.default_rng(2024)`, and record it with the results. Now both teammates draw the same stream and get identical answers.
:::

::: check
Why does `np.linspace(0.0, 1.0, 10)` not have a step of 0.1? What call does?
:::

::: answer
Ten points with both ends included make only nine gaps, so the step is $(1.0 - 0.0) / (10 - 1) = 1/9 \approx 0.111$.

For a step of 0.1 from 0 to 1 including both ends you need ten gaps, which is eleven points: `np.linspace(0.0, 1.0, 11)`. Alternatively, `np.linspace(0.0, 1.0, 10, endpoint=False)` gives ten points with step 0.1, stopping at 0.9.
:::

## Summary

| Function | Makes | Watch out for |
| --- | --- | --- |
| `np.array(list)` | an array copied from a list or nested lists | rows must all be the same length |
| `np.zeros(shape)`, `np.ones(shape)` | filled with 0.0 or 1.0, `float64` | shape as a tuple: `np.zeros((2, 3))` |
| `np.full(shape, value)` | filled with `value` | dtype comes from `value`: `7` gives integers |
| `np.full(shape, np.nan)` | a "not yet filled" table | NaN spreads into any average |
| `np.zeros_like(a)` | same shape and dtype as `a` | |
| `np.arange(start, stop, step)` | stepped values, `stop` excluded | decimal steps can gain or lose an element |
| `np.linspace(start, stop, num)` | `num` points, both ends included | step is $(\text{stop}-\text{start})/(\text{num}-1)$ |
| `np.eye(n)` | the $n \times n$ identity | "no rotation" DCM; `s**2 * np.eye(n)` covariance |
| `np.random.default_rng(seed)` | a random generator | same seed, same numbers |
| `rng.normal`, `uniform`, `integers`, `random` | random arrays of any shape | `integers` excludes `high` |

Now you can make arrays of any shape. The next lesson is about reaching into them — taking one sample, one column, or every tenth row — and the surprise that comes with it: most slices share memory with the array they came from.

::: context quaternion Four numbers for an attitude
A **quaternion** is a set of four numbers that describes how a body is rotated relative to a reference frame. Spacecraft flight software uses them because they avoid the "gimbal lock" problem of three-angle descriptions and are cheap to update. `[1, 0, 0, 0]` (in the scalar-first convention) means no rotation at all. The attitude representation module covers them properly; for now, they are an example of a short, fixed-length 1-D array.
:::

::: context preallocation Why not grow an array one row at a time
With a list, `append` is cheap, because Python keeps spare room at the end. An array has no spare room: it is one exact block. `np.append(a, x)` therefore builds a brand-new array and copies everything across, every single time. Appending a million rows one at a time copies about half a trillion numbers in total. So the habit is: make the whole array once with `zeros` or `full`, then write rows into it — or collect rows in a list and call `np.array` once at the end.
:::

::: context nan-marker NaN as a flag you cannot miss
NaN is a special float value defined by the IEEE 754 standard. Any arithmetic with it gives NaN again: $\text{NaN} + 1$ is NaN, and the mean of an array containing one NaN is NaN. That sounds annoying, but it is exactly what you want from a "missing" marker, because a forgotten gap cannot hide inside an average. A 0 in the same spot would silently drag the average down. Lesson 4 shows how to find NaNs with a mask.
:::

::: context fencepost Posts and gaps
A fence 10 m long with a post every meter needs 11 posts, not 10. Points include both ends; gaps sit between them. `linspace` counts posts. The time step counts gaps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#6c7a93" stroke-width="2"/>
  <g fill="#1d6fd1">
    <rect x="26" y="30" width="8" height="40"/><rect x="101" y="30" width="8" height="40"/>
    <rect x="176" y="30" width="8" height="40"/><rect x="251" y="30" width="8" height="40"/>
    <rect x="326" y="30" width="8" height="40"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="88">0</text><text x="105" y="88">0.25</text><text x="180" y="88">0.5</text>
    <text x="255" y="88">0.75</text><text x="330" y="88">1</text>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="67" y="24">gap</text><text x="142" y="24">gap</text><text x="217" y="24">gap</text><text x="292" y="24">gap</text>
  </g>
  <text x="180" y="104" font-size="11" fill="#6c7a93" text-anchor="middle">linspace(0, 1, 5): 5 points, 4 gaps of 0.25</text>
</svg>
```
:::

::: context dcm-identity A matrix that means "lined up"
A **direction cosine matrix**, or DCM, converts a vector's components from one frame (say, the Earth-fixed frame) to another (the spacecraft body). Each entry is the cosine of the angle between one axis of the first frame and one axis of the second. When the frames are lined up, each axis is at 0° to its partner ($\cos 0° = 1$) and at 90° to the others ($\cos 90° = 0$). That is exactly the identity matrix. This module's first exercise builds a full DCM from three angles.
:::

::: context covariance A table of uncertainties
A **covariance matrix** describes how uncertain an estimate is. The diagonal entries are the **variances**, the squares of the standard deviations, one per quantity; so 10,000 m² means a standard deviation of $\sqrt{10000} = 100$ m. The off-diagonal entries say whether errors in two quantities tend to move together. Zeros there mean "unrelated". A Kalman filter keeps this matrix up to date as measurements arrive, and it usually starts life as a number times `np.eye`.
:::

::: context seed Where a random stream starts
A computer cannot flip a real coin. A generator runs a fixed recipe that turns one number into the next, producing a stream that passes every statistical test for randomness but is completely determined by where it starts. That starting number is the **seed**. Numbers made this way are called **pseudo-random**. NumPy's default recipe is called PCG64. Same seed, same recipe, same stream — on any machine.
:::

::: context normal-distribution The bell curve
In a normal (or Gaussian) distribution, values near the mean are most likely, and the chance falls off smoothly on both sides. About 68% of draws land within one standard deviation $\sigma$ (read "sigma") of the mean, and about 95% within two. Many small independent disturbances added together behave this way, which is why sensor noise is usually modeled as normal.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polygon points="100,110 100,65.1 110,59.5 120,54.1 130,49.1 140,44.7 150,41.0 160,38.3 170,36.6 180,36.0 190,36.6 200,38.3 210,41.0 220,44.7 230,49.1 240,54.1 250,59.5 260,65.1 260,110" fill="#8fb8f0"/>
  <polyline points="20,100.0 30,97.2 40,94.0 50,90.2 60,86.0 70,81.2 80,76.1 90,70.7 100,65.1 110,59.5 120,54.1 130,49.1 140,44.7 150,41.0 160,38.3 170,36.6 180,36.0 190,36.6 200,38.3 210,41.0 220,44.7 230,49.1 240,54.1 250,59.5 260,65.1 270,70.7 280,76.1 290,81.2 300,86.0 310,90.2 320,94.0 330,97.2 340,100.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="30" x2="180" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="126">−σ</text><text x="180" y="126">mean</text><text x="260" y="126">+σ</text>
  </g>
  <text x="180" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">about 68%</text>
  <text x="180" y="144" font-size="11" fill="#6c7a93" text-anchor="middle">normal distribution</text>
</svg>
```
:::
