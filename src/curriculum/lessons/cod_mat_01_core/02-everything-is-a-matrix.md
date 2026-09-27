---
id: l02-everything-is-a-matrix
title: Everything is a matrix
minutes: 22
covers:
  - Everything is a matrix; the colon operator, linspace, zeros, ones, eye
  - Concatenation, reshape, size, length, numel
---

Picture a muffin tin. It has rows and columns of cups, and every cup holds one muffin. A tin with one row of six cups is still a muffin tin. So is a tin with a single cup — a strange tin, but it still has one row and one column. The shape of the tin is part of what it is, before you put anything in it.

In the last lesson the Workspace panel listed every variable with a size of `1x1`. That was the muffin tin with one cup. In MATLAB, every value is a grid of numbers with rows and columns. A single number is a one-by-one grid. A list of numbers is a grid with one row, or one column. A table of sensor readings is a grid with many of each. The grid has a name: a **matrix**, a rectangle of numbers arranged in rows and columns.

This is the biggest difference from plain Python. In Python you reach for lists, and later for **[[NumPy|numpy-comparison]]** arrays when you want real maths. In MATLAB the NumPy-style array is the language itself, and it is always at least two-dimensional. GNC work is full of matrices — a rotation between two frames is a 3-by-3 matrix, a batch of IMU samples is an N-by-3 matrix, a state-space model is four matrices — so a language that thinks in grids is a good fit. This lesson shows how to build them.

## Building a matrix with square brackets

You type a matrix inside square brackets, row by row:

- a **space** or a **comma** moves to the next column;
- a **semicolon** starts a new row.

```matlab
r = [1 2 3]         % one row, three columns: a row vector
% r =
%      1     2     3

c = [1; 2; 3]       % three rows, one column: a column vector
% c =
%      1
%      2
%      3

A = [1 2 3; 4 5 6]  % two rows, three columns
% A =
%      1     2     3
%      4     5     6
```

A **row vector** is a matrix with one row. A **column vector** is a matrix with one column. The size of a matrix is always written rows first, then columns: `A` is **2-by-3**, written `2x3` and read "two by three". A handy memory hook is "RC", like the RC car: rows, then columns.

Notice that the semicolon has two jobs. At the end of a line it hides the echo, as you saw in lesson 1. Inside square brackets it starts a new row. MATLAB can tell them apart by where they sit.

### Flipping rows and columns

A single quote after a matrix gives its **[[transpose|transpose-picture]]** — the same numbers with rows turned into columns. Read `A'` as "A transpose" (some people say "A prime").

```matlab
A'
% ans =
%      1     4
%      2     5
%      3     6
```

The 2-by-3 matrix became 3-by-2. The first row of `A`, `1 2 3`, is now the first column. Transposing a row vector gives a column vector, which is a quick way to type a long column: `[1 2 3]'` is the same as `[1; 2; 3]`.

::: warning The quote also flips the sign of imaginary parts
For ordinary real numbers, `A'` is the plain transpose. For complex numbers, `A'` also takes the **[[complex conjugate|complex-conjugate]]**, changing every $+i$ to $-i$. The plain transpose, with no sign change, is written `A.'` (dot, quote). This matters in signal processing, where FFT results are complex. If your data might be complex and you only want to flip its shape, use `.'`.
:::

::: key
Everything is a matrix. A scalar is 1-by-1, a row vector is 1-by-n, a column vector is n-by-1. Inside `[ ]`, spaces or commas separate columns and semicolons separate rows. Size is always rows by columns. `A'` transposes (and conjugates complex numbers); `A.'` transposes without conjugating.
:::

::: example A rotation matrix, typed by hand
A spacecraft's attitude is often stored as a 3-by-3 matrix that turns a vector's components in one frame into its components in another. Here is the one for a rotation of $30^\circ$ about the $z$ axis:

```matlab
Rz = [cosd(30) -sind(30) 0;
      sind(30)  cosd(30) 0;
      0         0        1]
% Rz =
%     0.8660   -0.5000         0
%     0.5000    0.8660         0
%          0         0    1.0000
```

`cosd` and `sind` are cosine and sine that take the angle in degrees. (Plain `cos` and `sin` want radians, like Python's `math.cos`.) Pressing Enter inside the brackets continues the matrix on the next line, and each semicolon starts a row, so the three typed lines become the three rows.

Sanity check: every column of a rotation matrix must have length $1$. For the first column, $0.8660^2 + 0.5^2 = 0.75 + 0.25 = 1$. The third column is $(0, 0, 1)$, the $z$ axis, which a rotation about $z$ leaves alone. Both look right.
:::

## Ranges with the colon operator

Very often you want a row of evenly spaced numbers: sample times, loop counters, angles for a plot. The **colon operator** makes them. Read `a:b` as "a to b".

```matlab
k = 1:5           % from 1 to 5 in steps of 1
% k =
%      1     2     3     4     5

t = 0:0.25:1      % from 0 to 1 in steps of 0.25
% t =
%          0    0.2500    0.5000    0.7500    1.0000

d = 10:-3:0       % counting down by 3
% d =
%     10     7     4     1
```

With three numbers, the middle one is the **step**: `start:step:stop`. That order trips up Python users, whose `range(start, stop, step)` puts the step last.

The big rule: **the range includes both ends**. `1:5` has five elements, 1 through 5. Python's `range(1, 5)` stops before 5 and has four. When the stop value is not a whole number of steps from the start, MATLAB goes as far as it can without passing it:

```matlab
z = 0:0.3:1
% z =
%          0    0.3000    0.6000    0.9000
```

The next step would be $1.2$, past the stop, so the range ends at $0.9$. In general, a range `a:s:b` with a positive step has

$$
n = \left\lfloor \frac{b - a}{s} \right\rfloor + 1
$$

elements. The brackets $\lfloor \; \rfloor$ mean "round down to a whole number" (called the **floor**). For `0:0.3:1` that is $\lfloor 3.33 \rfloor + 1 = 3 + 1 = 4$, matching the four numbers above.

If the range cannot even start — `5:1` asks to count up from 5 to 1 — you get an **empty** matrix, 1-by-0: a row with no columns. No error: the result is an empty row. That is useful in loops, which then run zero times.

## linspace: when you know how many points you want

The colon operator is for when you know the step. **`linspace`** is for when you know the count. `linspace(a, b, n)` gives `n` evenly spaced points from `a` to `b`, always including both ends. The name means "linearly spaced".

```matlab
L = linspace(0, 1, 5)
% L =
%          0    0.2500    0.5000    0.7500    1.0000
```

Five points from 0 to 1 means four gaps, so each gap is $(1 - 0)/4 = 0.25$. In general, $n$ points have $n - 1$ gaps, so the spacing is

$$
\Delta = \frac{b - a}{n - 1}.
$$

($\Delta$ is the Greek capital "delta", read "delta", meaning a step or change.) If you leave out `n`, you get 100 points.

::: example A time vector for ten seconds of data at 100 Hz
A flight computer logs an accelerometer at $100\,\mathrm{Hz}$ — 100 samples per second, so one every $0.01\,\mathrm{s}$ — for ten seconds, starting at $t = 0$. Build the matching time vector.

With the colon operator you know the step:

```matlab
t = 0:0.01:10;
numel(t)
% ans = 1001
```

With `linspace` you need the count. How many samples? It is tempting to say $10 \times 100 = 1000$. But a sample at $t = 0$ *and* one at $t = 10$ means $1000$ gaps and $1001$ samples — the same reason a fence with 10 sections needs 11 posts. This is the **[[fencepost error|fencepost-error]]**, and it is everywhere in data work.

```matlab
t2 = linspace(0, 10, 1001);
```

Check the spacing: $(10 - 0)/(1001 - 1) = 10/1000 = 0.01\,\mathrm{s}$. The two vectors agree, up to the last-digit rounding every computer calculation has. The count formula agrees too: $\lfloor 10/0.01 \rfloor + 1 = 1000 + 1 = 1001$.
:::

::: warning Prefer linspace when the step is not a "nice" number
A step like `0.1` cannot be stored exactly in binary, in the same way that $1/3$ cannot be written exactly in decimal. MATLAB's colon operator is careful about this, but when you compute a step and the count really matters — "I need exactly 4096 points" — use `linspace`, which guarantees the count and both ends.
:::

## Ready-made matrices: zeros, ones, eye

Three functions build common matrices of any size:

- `zeros(m, n)` — an m-by-n matrix of zeros;
- `ones(m, n)` — an m-by-n matrix of ones;
- `eye(n)` — the n-by-n **[[identity matrix|identity-matrix]]**, with ones on the main diagonal (top-left to bottom-right) and zeros everywhere else. The name is a pun: "eye" sounds like $I$, the usual symbol for it.

```matlab
zeros(2, 3)
% ans =
%      0     0     0
%      0     0     0

ones(1, 4)
% ans =
%      1     1     1     1

eye(3)
% ans =
%      1     0     0
%      0     1     0
%      0     0     1
```

You will use `zeros` constantly to make an array of the right size before a loop fills it in. That habit, called preallocation, is the subject of lesson 6. `ones` is handy for a constant: `9.81 * ones(1, 5)` is five copies of $9.81$. And `eye(3)` is the rotation matrix for "no rotation at all", the natural starting attitude in a simulation.

::: warning zeros(3) is a square, not a row
With one argument, `zeros(n)`, `ones(n)` and `eye(n)` make an **n-by-n** square. So `zeros(3)` is a 3-by-3 block of nine zeros, not three zeros in a row. NumPy's `np.zeros(3)` gives three numbers, so Python users get this wrong at first. If you want a row of 1000 zeros, write `zeros(1, 1000)`. Writing `zeros(1000)` makes a million of them.
:::

## Gluing matrices together

**Concatenation** means joining matrices to make a bigger one. MATLAB uses the same square brackets you build matrices with, and the same rules: a space or comma places things side by side, a semicolon stacks them.

```matlab
A = [1 2 3; 4 5 6];
B = [A; 7 8 9]          % stack a new row under A
% B =
%      1     2     3
%      4     5     6
%      7     8     9

C = [A, [10; 20]]       % add a column on the right
% C =
%      1     2     3    10
%      4     5     6    20
```

The pieces have to fit, like bricks in a wall. To stack vertically, they need the same number of columns. To join side by side, they need the same number of rows. Try `[A; 1 2]`, a 2-by-3 on top of a 1-by-2, and MATLAB stops with an error saying the dimensions of the arrays being concatenated are not consistent.

This is the everyday way to assemble data. Three column vectors of accelerometer readings, `ax`, `ay` and `az`, each N-by-1, become one N-by-3 matrix with `[ax ay az]`. One row per sample, one column per axis.

The functions `horzcat` and `vertcat` do the same joins by name: `horzcat(A, B)` is `[A, B]`, and `vertcat(A, B)` is `[A; B]`. And the empty matrix, typed `[]`, is 0-by-0 and disappears when concatenated, so `[[] 5]` is plain `5`.

## Reshaping: same numbers, new shape

**`reshape`** rearranges the numbers of a matrix into a new number of rows and columns, without changing the numbers or their order. `reshape(v, m, n)` needs `m * n` to equal the number of elements in `v`.

The order is the key. MATLAB stores and reads a matrix **column by column**: down the first column, then down the second, and so on. This is called **[[column-major order|column-major]]**. So `reshape` fills the new shape down the columns too:

```matlab
v = 1:6;
M = reshape(v, 2, 3)
% M =
%      1     3     5
%      2     4     6
```

The numbers 1 and 2 went down the first column, 3 and 4 down the second, 5 and 6 down the third. You may give `[]` for one of the sizes, and MATLAB works it out: `reshape(v, [], 2)` makes a 3-by-2, because 6 elements in 2 columns needs 3 rows.

::: warning NumPy fills rows first; MATLAB fills columns first
NumPy's `np.arange(1, 7).reshape(2, 3)` gives the rows `1 2 3` and `4 5 6`. MATLAB's `reshape(1:6, 2, 3)` gives the rows `1 3 5` and `2 4 6`. Same call, different matrix. When you translate code that reshapes, check one small case by hand before trusting it.
:::

::: example Unpacking interleaved IMU telemetry
Telemetry often arrives as one long list with the three axes interleaved: $x_1, y_1, z_1, x_2, y_2, z_2, \ldots$ Here are four accelerometer samples, in $\mathrm{m/s^2}$:

```matlab
raw = [0.12 -0.05 9.79  0.10 -0.07 9.83  0.15 -0.04 9.80  0.11 -0.06 9.82];
```

That is 12 numbers, so 4 samples of 3 axes. We want a 4-by-3 matrix with one row per sample.

Step 1. Reshape into 3 rows. Because `reshape` fills down columns, each group of three consecutive numbers — one sample — lands in one column:

```matlab
S = reshape(raw, 3, [])
% S =
%     0.1200    0.1000    0.1500    0.1100
%    -0.0500   -0.0700   -0.0400   -0.0600
%     9.7900    9.8300    9.8000    9.8200
```

Step 2. Transpose, so samples become rows:

```matlab
imu = S';
size(imu)
% ans =
%      4     3
```

Sanity check: the third column should be gravity, near $9.81\,\mathrm{m/s^2}$, for a sensor sitting still with $z$ pointing up. It is. Had we written `reshape(raw, [], 3)` instead, the first column would have held $0.12, -0.05, 9.79, 0.10$ — a mix of axes, which a quick look at the numbers exposes at once.
:::

## Asking a matrix its size: size, numel, length

Three functions tell you how big a matrix is. They answer different questions, and mixing them up causes real bugs.

- **`size(A)`** returns the dimensions as a row: `[rows cols]`. `size(A, 1)` gives only the number of rows and `size(A, 2)` only the number of columns. You can also catch both at once: `[m, n] = size(A)`.
- **`numel(A)`** returns the **number of elements**, all the numbers in it, which is rows times columns.
- **`length(A)`** returns the **largest dimension**, whichever of rows or columns is bigger. For an empty matrix it returns 0.

For the 4-by-3 `imu` matrix from the example:

```matlab
size(imu)       % ans = 4 3
size(imu, 1)    % ans = 4, the number of samples
numel(imu)      % ans = 12
length(imu)     % ans = 4
```

**`isempty(A)`** answers true (`1`) when the matrix has no elements at all, such as `[]` or the 1-by-0 range `5:1`. Functions that must cope with missing data check it first.

::: warning length is only safe on vectors
On a vector, `length` gives the number of elements and all is well. On a matrix it gives the bigger dimension, whatever that happens to be. With 4 samples of 3 axes, `length(imu)` is 4, the samples. But with only 2 samples, a 2-by-3 matrix, `length` returns 3, the axes. Code that uses `length` to count samples works on long logs and breaks on short ones. Use `size(A, 1)` for "how many rows" and `numel(A)` for "how many numbers".
:::

### Which way is dimension 1?

`size(A, 1)` counts rows, so rows are **[[dimension 1|array-dimensions]]** and columns are dimension 2. Many functions let you choose which dimension to work along, and by default they work down the columns, dimension 1. So `mean(imu)` gives one mean per column — one per axis:

```matlab
mean(imu)
% ans =
%     0.1200   -0.0550    9.8100
```

`mean(imu, 2)` works along dimension 2 instead, across each row, giving one number per sample (which here mixes axes together and means nothing physical). The same choice appears in `sum`, `max`, `min` and many more. When your data has one row per sample, dimension 1 is "over time".

::: key
`size(A)` gives `[rows cols]`; `size(A,1)` is the row count. `numel(A)` is the total number of elements. `length(A)` is the largest dimension, so use it only on vectors. Functions like `mean` and `sum` work down columns (dimension 1) unless told otherwise.
:::

## Check yourself

::: check
Write the MATLAB that builds the 3-by-2 matrix with rows $(1, 2)$, $(3, 4)$ and $(5, 6)$. Then give its `size`, `numel` and `length`.
:::

::: answer
`P = [1 2; 3 4; 5 6]`. Spaces separate the two columns and semicolons separate the three rows.

`size(P)` is `[3 2]`, three rows and two columns. `numel(P)` is $3 \times 2 = 6$. `length(P)` is the bigger dimension, $3$.
:::

::: check
How many elements does each range have, and what is its last element? (a) `2:7` (b) `0:0.4:2` (c) `1:2:10` (d) `3:1`
:::

::: answer
(a) Six elements, 2 through 7, last element 7. Both ends are included.

(b) $\lfloor (2 - 0)/0.4 \rfloor + 1 = 5 + 1 = 6$ elements: 0, 0.4, 0.8, 1.2, 1.6, 2.0. The last is 2, which is exactly five steps from the start.

(c) $\lfloor (10 - 1)/2 \rfloor + 1 = 4 + 1 = 5$ elements: 1, 3, 5, 7, 9. The next would be 11, past the stop, so the last is 9.

(d) Empty, a 1-by-0 matrix. You cannot count up from 3 to 1.
:::

::: check
A ground test samples a pressure sensor every $0.5\,\mathrm{s}$ from $t = 0$ to $t = 60\,\mathrm{s}$ inclusive. Write the time vector two ways, once with the colon operator and once with `linspace`.
:::

::: answer
With the colon operator: `t = 0:0.5:60;`

With `linspace`, you need the count. There are $60/0.5 = 120$ gaps, so $121$ samples (fenceposts again): `t = linspace(0, 60, 121);`

Check the spacing: $(60 - 0)/(121 - 1) = 60/120 = 0.5\,\mathrm{s}$.
:::

::: check
What does `reshape([10 20 30 40 50 60], 3, 2)` give? What would you get from `reshape([10 20 30 40 50 60], 3, 2)'`?
:::

::: answer
`reshape` fills down the columns, so the first three numbers form the first column and the next three the second:

$$
\begin{bmatrix} 10 & 40 \\ 20 & 50 \\ 30 & 60 \end{bmatrix}
$$

Transposing that gives a 2-by-3 matrix with rows $(10, 20, 30)$ and $(40, 50, 60)$ — the "row by row" reading a NumPy user might have expected from the reshape alone.
:::

::: check
A teammate writes `n = length(data)` to count the samples in `data`, which has one row per sample and 6 columns (three accelerometer axes and three gyro axes). It works on every flight log. What happens on a log with 4 samples, and what should they write instead?
:::

::: answer
`data` is 4-by-6, and `length` returns the larger dimension, 6. So `n` is 6, not 4, and any loop over samples runs past the last row and errors — or worse, code that uses `n` for averaging silently divides by the wrong number.

The fix is `n = size(data, 1)`, which is always the row count, whatever the shape.
:::

## Summary

| Idea | MATLAB | Meaning |
| --- | --- | --- |
| Matrix | `[1 2 3; 4 5 6]` | spaces or commas between columns, semicolons between rows |
| Scalar, row, column | 1-by-1, 1-by-n, n-by-1 | every value is a matrix |
| Transpose | `A'`, `A.'` | rows become columns; `'` also conjugates complex numbers |
| Colon range | `a:b`, `a:s:b` | includes both ends; stops before passing `b` |
| Range length | $n = \lfloor (b-a)/s \rfloor + 1$ | empty when it cannot start |
| `linspace(a, b, n)` | n points, both ends | spacing $(b-a)/(n-1)$; default 100 points |
| `zeros`, `ones`, `eye` | `zeros(m, n)` | one argument means n-by-n square |
| Concatenation | `[A B]`, `[A; B]` | sizes must fit; `horzcat`, `vertcat` |
| `reshape(v, m, n)` | same elements, new shape | fills column by column; `[]` for one size |
| `size`, `numel`, `length` | `[rows cols]`, count, largest dimension | use `size(A,1)` to count rows |

Next lesson: a matrix is only useful if you can reach inside it. Lesson 3 is about indexing — picking out one element, a row, a column, or every element that passes a test — and about the one-based counting that makes MATLAB different from Python.

::: context numpy-comparison MATLAB and NumPy, side by side
NumPy borrowed a great deal from MATLAB, so the ideas map closely. A NumPy array can be one-dimensional: `np.array([1, 2, 3])` has shape `(3,)`, neither a row nor a column. MATLAB has no such thing. The smallest shape is 1-by-1, and a vector is always either a row or a column. That is why transposing a vector changes something in MATLAB but does nothing to a 1-D NumPy array. It also means that in MATLAB you must think about "row or column?" for every vector — a question that turns out to catch many shape bugs early.
:::

::: context transpose-picture Flipping across the diagonal
Transposing reflects a matrix across its main diagonal, the line from the top-left corner going down and right. The entry in row $i$, column $j$ moves to row $j$, column $i$. Entries on the diagonal stay put.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="70" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">A (2 by 3)</text>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <rect x="16" y="30" width="36" height="36" fill="#8fb8f0" stroke="#1f2a44"/><text x="34" y="53">1</text>
    <rect x="52" y="30" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/><text x="70" y="53">2</text>
    <rect x="88" y="30" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/><text x="106" y="53">3</text>
    <rect x="16" y="66" width="36" height="36" fill="#f2b880" stroke="#1f2a44"/><text x="34" y="89">4</text>
    <rect x="52" y="66" width="36" height="36" fill="#8fb8f0" stroke="#1f2a44"/><text x="70" y="89">5</text>
    <rect x="88" y="66" width="36" height="36" fill="#f2b880" stroke="#1f2a44"/><text x="106" y="89">6</text>
  </g>
  <line x1="150" y1="70" x2="196" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="202,70 192,65 192,75" fill="#1f2a44"/>
  <text x="176" y="60" font-size="12" fill="#b4232c" text-anchor="middle">A'</text>
  <text x="272" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">A' (3 by 2)</text>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <rect x="236" y="30" width="36" height="36" fill="#8fb8f0" stroke="#1f2a44"/><text x="254" y="53">1</text>
    <rect x="272" y="30" width="36" height="36" fill="#f2b880" stroke="#1f2a44"/><text x="290" y="53">4</text>
    <rect x="236" y="66" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/><text x="254" y="89">2</text>
    <rect x="272" y="66" width="36" height="36" fill="#8fb8f0" stroke="#1f2a44"/><text x="290" y="89">5</text>
    <rect x="236" y="102" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/><text x="254" y="125">3</text>
    <rect x="272" y="102" width="36" height="36" fill="#f2b880" stroke="#1f2a44"/><text x="290" y="125">6</text>
  </g>
</svg>
```

The blue diagonal entries, 1 and 5, do not move; the first row becomes the first column.
:::

::: context complex-conjugate What conjugate means
A complex number has a real part and an imaginary part, like $3 + 4i$, where $i$ is the square root of $-1$. Its conjugate flips the sign of the imaginary part: $3 - 4i$. Engineers meet complex numbers whenever something oscillates — frequency responses, Fourier transforms, the poles of a control system. For complex vectors the "conjugate transpose" is the version that makes lengths come out right, which is why MATLAB made it the short form `'`. For real data, which is most of what you handle day to day, the two transposes give the same answer.
:::

::: context fencepost-error Posts and gaps
A straight fence 10 meters long with a post every meter needs 11 posts, not 10: one at each end, plus one between each pair of sections. Sample times work the same way. Ten seconds at 100 samples per second, counting both $t = 0$ and $t = 10$, is 1001 samples. The error is so common that it has its own name, and it shows up again the moment you start indexing in the next lesson.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#6c7a93" stroke-width="3"/>
  <g stroke="#1f2a44" stroke-width="4">
    <line x1="30" y1="30" x2="30" y2="66"/><line x1="90" y1="30" x2="90" y2="66"/><line x1="150" y1="30" x2="150" y2="66"/>
    <line x1="210" y1="30" x2="210" y2="66"/><line x1="270" y1="30" x2="270" y2="66"/><line x1="330" y1="30" x2="330" y2="66"/>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="60" y="44">gap</text><text x="120" y="44">gap</text><text x="180" y="44">gap</text><text x="240" y="44">gap</text><text x="300" y="44">gap</text>
  </g>
  <text x="180" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">5 gaps need 6 posts: n points make n minus 1 gaps</text>
</svg>
```
:::

::: context identity-matrix The matrix that changes nothing
Multiplying any number by 1 leaves it alone. The identity matrix plays the same role for matrices: multiplying a vector by it gives back the same vector. For a rotation matrix that means "zero rotation" — the body frame lines up exactly with the reference frame. That is why simulations often start a vehicle's attitude at `eye(3)`, and why a test that checks $R R^\top$ against `eye(3)` is a quick way to catch a rotation matrix that has gone bad. Lesson 4 explains the matrix product that makes this work.
:::

::: context column-major Column by column in memory
Computer memory is one long line of slots, so a grid has to be laid out in some order. MATLAB, like the Fortran libraries it grew out of, stores the first column, then the second, and so on. C and NumPy's default store row by row instead. The order matters for `reshape`, for reading raw binary files, and — as lesson 3 shows — for what a single index like `M(5)` points at.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <rect x="20" y="20" width="32" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="36" y="41">1</text>
    <rect x="52" y="20" width="32" height="32" fill="#f2b880" stroke="#1f2a44"/><text x="68" y="41">3</text>
    <rect x="84" y="20" width="32" height="32" fill="#ffffff" stroke="#1f2a44"/><text x="100" y="41">5</text>
    <rect x="20" y="52" width="32" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="36" y="73">2</text>
    <rect x="52" y="52" width="32" height="32" fill="#f2b880" stroke="#1f2a44"/><text x="68" y="73">4</text>
    <rect x="84" y="52" width="32" height="32" fill="#ffffff" stroke="#1f2a44"/><text x="100" y="73">6</text>
  </g>
  <text x="68" y="106" font-size="11" fill="#1f2a44" text-anchor="middle">reshape(1:6, 2, 3)</text>
  <text x="250" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">order in memory</text>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <rect x="150" y="36" width="32" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="166" y="57">1</text>
    <rect x="182" y="36" width="32" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="198" y="57">2</text>
    <rect x="214" y="36" width="32" height="32" fill="#f2b880" stroke="#1f2a44"/><text x="230" y="57">3</text>
    <rect x="246" y="36" width="32" height="32" fill="#f2b880" stroke="#1f2a44"/><text x="262" y="57">4</text>
    <rect x="278" y="36" width="32" height="32" fill="#ffffff" stroke="#1f2a44"/><text x="294" y="57">5</text>
    <rect x="310" y="36" width="32" height="32" fill="#ffffff" stroke="#1f2a44"/><text x="326" y="57">6</text>
  </g>
  <text x="246" y="90" font-size="11" fill="#6c7a93" text-anchor="middle">column 1, then column 2, then column 3</text>
</svg>
```
:::

::: context array-dimensions Beyond rows and columns
Rows are dimension 1 and columns are dimension 2, and MATLAB allows more. A third dimension stacks whole matrices like pages in a book: a 3-by-3-by-1000 array could hold one rotation matrix for each of 1000 time steps. `size` then returns three numbers, and `zeros(3, 3, 1000)` builds such an array. You will not need this often in this module, but when you see a function argument called `dim`, it means "which of these directions to work along".
:::
