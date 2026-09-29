---
id: l03-block-operations
title: 'Block operations: windows inside a matrix'
minutes: 17
covers:
  - 'Block operations: block, head, tail, segment, row, col'
---

Hold a paper picture frame over a big photo. Through the frame you see only one part of the picture — a face in a crowd, say. The frame has not cut the photo. If you draw a mustache on the face through the frame, the mustache is on the photo itself. Move the frame and you are looking at a different part of the same photo.

Eigen has frames like that for matrices. A **block** — a rectangular window onto part of a matrix or vector — lets you read or write that part as if it were a small matrix of its own, without copying anything. The last lesson's `Map` was a window onto memory from outside Eigen. A block is a window onto a piece of an Eigen object.

Navigation software needs these windows constantly. A navigation filter keeps all it knows in one long **[[state vector|state-vector]]**: position, then velocity, maybe then attitude errors and sensor biases. Its uncertainty lives in one big square **[[covariance matrix|covariance]]**. The code keeps asking for pieces: "the position part", "the velocity part", "how position errors relate to velocity errors". This lesson gives you every tool for asking: `block`, `head`, `tail`, `segment`, `row` and `col`.

## Rows and columns

The simplest windows are a single row or a single column.

- `M.row(i)` is row $i$ of `M`, read "M dot row i". It behaves like a row vector.
- `M.col(j)` is column $j$. It behaves like a column vector.

As always in Eigen, counting starts at zero. For a rotation matrix, **[[the columns have a real meaning|rotation-columns]]**: column $j$ is where the rotation sends the $j$-th axis. So `R.col(0)` is "where the body's $x$ axis points", which is often exactly what you want to know.

Both are writable. `M.col(0).setZero();` zeroes the first column of `M` itself. `M.row(3) *= 10.0;` scales one row. `M.row(0).swap(M.row(1));` swaps two rows in place.

## General blocks

For any rectangle, give its top-left corner and its size. Eigen offers two spellings.

- `M.block(i, j, p, q)` — the **dynamic-size** form. The window starts at row $i$, column $j$, and is $p$ rows tall and $q$ columns wide. All four numbers can be ordinary variables.
- `M.block<p, q>(i, j)` — the **fixed-size** form. The size goes in the angle brackets, as template arguments, so it must be known when compiling. The start still goes in the parentheses and can be a variable.

Read `P.block<3, 3>(0, 3)` as "the 3-by-3 block of P starting at row zero, column three".

::: warning The last two numbers are sizes, not end points
In `block(i, j, p, q)`, $p$ and $q$ are how many rows and columns you want, not where to stop. NumPy slices are the other way round: `M[1:3, 2:4]` stops *before* row 3 and column 4. The same window in Eigen is `M.block(1, 2, 2, 2)` — start $(1, 2)$, size $2 \times 2$. The translation is: NumPy `M[i:i+p, j:j+q]` is Eigen `M.block(i, j, p, q)`. When you port code, convert each slice by that rule, one at a time.
:::

::: example A tour of the windows
A $4 \times 4$ matrix numbered 1 to 16 makes it easy to see which numbers each window picks up.

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    Eigen::Matrix4d M;
    M <<  1,  2,  3,  4,
          5,  6,  7,  8,
          9, 10, 11, 12,
         13, 14, 15, 16;

    std::cout << "block<2,2>(1,2) =\n" << M.block<2, 2>(1, 2) << "\n";
    std::cout << "block(0,1,3,2) =\n" << M.block(0, 1, 3, 2) << "\n";
    std::cout << "row(2) = " << M.row(2) << "\n";
    std::cout << "col(3) = " << M.col(3).transpose() << "\n";

    Eigen::VectorXd v(7);
    v << 10, 11, 12, 13, 14, 15, 16;
    std::cout << "head(2)       = " << v.head(2).transpose() << "\n";
    std::cout << "tail<3>()     = " << v.tail<3>().transpose() << "\n";
    std::cout << "segment(2, 4) = " << v.segment(2, 4).transpose() << "\n";

    // Blocks are windows you can write through.
    M.col(0).setZero();
    M.row(3) *= 10.0;
    M.row(0).swap(M.row(1));
    std::cout << "after writes =\n" << M << "\n";
    return 0;
}
```

```text
block<2,2>(1,2) =
 7  8
11 12
block(0,1,3,2) =
 2  3
 6  7
10 11
row(2) =  9 10 11 12
col(3) =  4  8 12 16
head(2)       = 10 11
tail<3>()     = 14 15 16
segment(2, 4) = 12 13 14 15
after writes =
  0   6   7   8
  0   2   3   4
  0  10  11  12
  0 140 150 160
```

Check each one against the numbered matrix.

1. `block<2,2>(1,2)` starts at row 1, column 2 — the number $7$ — and takes 2 rows and 2 columns: $7, 8, 11, 12$. You can see it **[[framed in the grid|block-frame]]**.
2. `block(0,1,3,2)` starts at row 0, column 1 — the number $2$ — and takes 3 rows, 2 columns.
3. `row(2)` is the third row, $9$ to $12$, and `col(3)` is the last column, $4, 8, 12, 16$.
4. The writes changed `M` itself: column 0 became zeros, row 3 was multiplied by ten ($14 \times 10 = 140$), and then the first two rows traded places, so the old row 1, $(0, 6, 7, 8)$, is now on top.
:::

Eigen also has names for the common corners and strips, which read well in code: `topLeftCorner(p, q)`, `bottomRightCorner<p, q>()`, `topRows(n)`, `bottomRows<n>()`, `leftCols(n)`, `rightCols<n>()`, `middleRows(i, n)` and `middleCols(i, n)`. Each is a block with some of the numbers filled in for you. Eigen 3.4 added NumPy-style slicing too: `M(Eigen::seqN(1, 2), Eigen::seqN(2, 2))` is the same window as `M.block(1, 2, 2, 2)` ("start 1, take 2" in each direction).

## Pieces of a vector

For vectors there are three shortcuts, each with a fixed-size form in angle brackets:

- `v.head(n)` or `v.head<n>()` — the first $n$ entries.
- `v.tail(n)` or `v.tail<n>()` — the last $n$ entries.
- `v.segment(i, n)` or `v.segment<n>(i)` — $n$ entries starting at index $i$. Like `block`, the second number is a *count*, not an end point. In the tour, `segment(2, 4)` started at index 2 (the $12$) and took four entries.

In a 6-element state that holds position then velocity, `x.head<3>()` is the position and `x.tail<3>()` is the velocity. In a 15-element inertial navigation state, `x.segment<3>(6)` might be the attitude error and `x.segment<3>(9)` the gyro bias. Giving those indices names, as constants, keeps the code readable.

## Fixed-size or dynamic-size blocks

Both spellings give a window, and neither copies. So what does the angle-bracket form buy you? The same three things a fixed-size matrix bought you in lesson 01.

1. **Unrolled code.** `P.block<3, 3>(0, 3)` has a type whose size is $3 \times 3$ at compile time, so every loop over it can be unrolled.
2. **Compile-time size checks.** Assigning `x.head<4>()` to a `Vector3d` fails the build with `YOU_MIXED_MATRICES_OF_DIFFERENT_SIZES`. Written as `x.head(4)`, it compiles, and a debug build stops at run time with a failed assertion inside `resize`; a release build does not check at all.
3. **No hidden heap.** Copying a fixed-size block into a `Matrix3d` stays on the stack. Copying a dynamic-size block into a `MatrixXd` asks the heap for a buffer.

There is one thing a fixed-size block cannot check at compile time: the *start*. The starting row and column are ordinary run-time arguments, so a window that hangs off the edge is only caught when that line runs. On a $6 \times 6$ matrix, `P.block<3, 3>(4, 4)` asks for rows 4, 5 and 6, and there is no row 6. A debug build stops with:

```text
Assertion `startRow >= 0 && BlockRows >= 0 && startRow + BlockRows <= xpr.rows() && startCol >= 0 && BlockCols >= 0 && startCol + BlockCols <= xpr.cols()' failed.
```

A release build built with `NDEBUG` reads past the end of the matrix without a word. Even `P.block<7, 7>(0, 0)` on a $6 \times 6$ matrix compiles in Eigen 3.4 and is only caught by that same run-time assertion.

::: key
`block<r, c>(i, j)` gives a fixed-size $r \times c$ window starting at row $i$, column $j$; `block(i, j, r, c)` gives the same window with a dynamic size. Both are views: reading one reads the matrix and writing one writes the matrix, with no copy. Prefer the fixed form when the size is known: its size is checked at compile time and its loops unroll. The start index is checked only at run time, and only when assertions are on.
:::

## Building filter matrices from blocks

Blocks really earn their keep when you build and use the matrices of a navigation filter. Here is a one-paragraph reminder of the idea; the Kalman filter itself has its own module.

A **Kalman filter** keeps an estimate $\mathbf{x}$ of the vehicle's state and a covariance $\mathbf{P}$ saying how unsure it is. Each time step it *predicts*: it moves the state forward with a model, $\mathbf{x} \leftarrow \mathbf{F}\mathbf{x}$, and grows the uncertainty the same way, $\mathbf{P} \leftarrow \mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$. Read $\mathbf{F}^{\mathsf{T}}$ as "F transpose". $\mathbf{F}$ is the **state transition matrix**: the rule for how the state changes over one step.

For a vehicle coasting in a straight line over a short time $\Delta t$ (read "delta t", the time step), the **[[constant-velocity model|constant-velocity]]** says the new position is the old position plus $\Delta t$ times the velocity, and the velocity stays the same. With position in the top half of the state and velocity in the bottom half, that makes $\mathbf{F}$ out of four $3 \times 3$ blocks:

$$
\mathbf{F} = \begin{bmatrix} \mathbf{I} & \Delta t\,\mathbf{I} \\ \mathbf{0} & \mathbf{I} \end{bmatrix}
$$

where $\mathbf{I}$ is the $3 \times 3$ identity and $\mathbf{0}$ is all zeros. In Eigen you start from the $6 \times 6$ identity and write the top-right block.

::: example One prediction step, built from blocks
A tracked object is at $(100, 0, 50)\,\mathrm{m}$, moving at $(2, -1, 0.5)\,\mathrm{m/s}$. Each position axis is uncertain by $10\,\mathrm{m}$ (variance $100\,\mathrm{m^2}$) and each velocity axis by $1\,\mathrm{m/s}$ (variance $1\,\mathrm{m^2/s^2}$). Predict $0.1\,\mathrm{s}$ ahead.

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

using Vec6 = Eigen::Matrix<double, 6, 1>;
using Mat6 = Eigen::Matrix<double, 6, 6>;

int main() {
    const double dt = 0.1;                         // s

    // State: position (m) then velocity (m/s).
    Vec6 x;
    x << 100.0, 0.0, 50.0,   2.0, -1.0, 0.5;

    // Constant-velocity model: new position = position + dt * velocity.
    Mat6 F = Mat6::Identity();
    F.block<3, 3>(0, 3) = dt * Eigen::Matrix3d::Identity();   // top-right corner

    // Uncertainty: 10 m on each position axis, 1 m/s on each velocity axis.
    Mat6 P = Mat6::Zero();
    P.block<3, 3>(0, 0) = 100.0 * Eigen::Matrix3d::Identity(); // m^2
    P.block<3, 3>(3, 3) = 1.0 * Eigen::Matrix3d::Identity();   // (m/s)^2

    x = F * x;
    P = F * P * F.transpose();

    std::cout << "position = " << x.head<3>().transpose() << " m\n";
    std::cout << "velocity = " << x.tail<3>().transpose() << " m/s\n";
    std::cout << "F =\n" << F << "\n";
    std::cout << "position sigma = "
              << P.block<3, 3>(0, 0).diagonal().cwiseSqrt().transpose() << " m\n";
    std::cout << "pos-vel covariance block =\n" << P.block<3, 3>(0, 3) << "\n";
    return 0;
}
```

```text
position = 100.2  -0.1 50.05 m
velocity =   2  -1 0.5 m/s
F =
  1   0   0 0.1   0   0
  0   1   0   0 0.1   0
  0   0   1   0   0 0.1
  0   0   0   1   0   0
  0   0   0   0   1   0
  0   0   0   0   0   1
position sigma = 10.0005 10.0005 10.0005 m
pos-vel covariance block =
0.1   0   0
  0 0.1   0
  0   0 0.1
```

Work it through by hand.

1. The block assignment put $0.1$ on the diagonal of the top-right corner of $\mathbf{F}$, exactly where the printout shows it.
2. New position on the first axis: $100 + 0.1 \times 2 = 100.2\,\mathrm{m}$. Second axis: $0 + 0.1 \times (-1) = -0.1\,\mathrm{m}$. Third: $50 + 0.1 \times 0.5 = 50.05\,\mathrm{m}$. Velocity does not change.
3. New position variance on each axis: $100 + 0.1^2 \times 1 = 100.01\,\mathrm{m^2}$, so the standard deviation is $\sqrt{100.01} \approx 10.0005\,\mathrm{m}$. The line of code that got it chains three steps: the top-left block, its `.diagonal()` (the variances), and `.cwiseSqrt()` (the square root of each one).
4. A new cross term appeared: position and velocity errors are now linked, with covariance $0.1 \times 1 = 0.1\,\mathrm{m^2/s}$. That makes sense: if the velocity estimate is too high, the predicted position will be too far along, so the two errors now move together.

Sanity check: the position uncertainty grew, but only by half a millimeter. In a tenth of a second, a $1\,\mathrm{m/s}$ velocity error moves the position by only $0.1\,\mathrm{m}$, and that adds to a $10\,\mathrm{m}$ uncertainty **[[in quadrature|quadrature]]** (square, add, square root), which barely changes it.
:::

::: note Why it has to be true
Where did $100.01$ and $0.1$ come from? Multiply the matrices one block at a time. Write $\sigma_p^2$ (read "sigma p squared") for the position variance and $\sigma_v^2$ for the velocity variance, so $\mathbf{P} = \begin{bmatrix} \sigma_p^2 \mathbf{I} & \mathbf{0} \\ \mathbf{0} & \sigma_v^2 \mathbf{I} \end{bmatrix}$. Block matrices multiply like ordinary $2 \times 2$ matrices, with blocks in place of numbers:

$$
\mathbf{F}\mathbf{P} = \begin{bmatrix} \mathbf{I} & \Delta t\,\mathbf{I} \\ \mathbf{0} & \mathbf{I} \end{bmatrix} \begin{bmatrix} \sigma_p^2 \mathbf{I} & \mathbf{0} \\ \mathbf{0} & \sigma_v^2 \mathbf{I} \end{bmatrix} = \begin{bmatrix} \sigma_p^2 \mathbf{I} & \Delta t\,\sigma_v^2 \mathbf{I} \\ \mathbf{0} & \sigma_v^2 \mathbf{I} \end{bmatrix}
$$

Now multiply by $\mathbf{F}^{\mathsf{T}} = \begin{bmatrix} \mathbf{I} & \mathbf{0} \\ \Delta t\,\mathbf{I} & \mathbf{I} \end{bmatrix}$ on the right:

$$
\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}} = \begin{bmatrix} (\sigma_p^2 + \Delta t^2 \sigma_v^2)\,\mathbf{I} & \Delta t\,\sigma_v^2\,\mathbf{I} \\ \Delta t\,\sigma_v^2\,\mathbf{I} & \sigma_v^2\,\mathbf{I} \end{bmatrix}
$$

With $\sigma_p^2 = 100$, $\sigma_v^2 = 1$ and $\Delta t = 0.1$, the top-left block has $100 + 0.01 = 100.01$ on its diagonal and the off-diagonal blocks have $0.1$ — exactly the program's output. Thinking in blocks turned a $6 \times 6$ multiplication into a $2 \times 2$ one.
:::

The same trick builds a **measurement matrix**. A position fix — from GPS, say — measures the first three states and says nothing about velocity. Its matrix $\mathbf{H}$ is $3 \times 6$: an identity in the left three columns, zeros in the right three.

```cpp
Eigen::Matrix<double, 3, 6> H = Eigen::Matrix<double, 3, 6>::Zero();
H.leftCols<3>().setIdentity();
```

Multiplying it by the predicted state above gives `H * x = 100.2 -0.1 50.05`: the position part, as it should.

::: warning `auto` keeps the window, not the numbers
A block is a view, and `auto` keeps whatever type it is given. So `auto pos = x.head<3>();` makes `pos` a window onto `x`, not a copy of three numbers:

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    Eigen::Matrix<double, 6, 1> x;
    x << 1, 2, 3, 4, 5, 6;

    auto view = x.head<3>();                 // a window onto x
    Eigen::Vector3d copy = x.head<3>();      // three numbers of its own

    x.setZero();                             // change the state afterwards

    std::cout << "view = " << view.transpose() << "\n";
    std::cout << "copy = " << copy.transpose() << "\n";
    return 0;
}
```

```text
view = 0 0 0
copy = 1 2 3
```

If you meant "save the position before the update", `view` silently follows the change. Worse, if `x` is destroyed while the view is still around, the view dangles, like a Map whose buffer is gone. When you want the numbers, name the type: `Eigen::Vector3d pos = x.head<3>();`. Lesson 05 shows that this `auto` trap reaches beyond blocks, because almost every Eigen expression is a **[[recipe, not a result|expression-bridge]]**.
:::

## Check yourself

::: check
A colleague's NumPy code reads `P[3:6, 0:3]` from a $6 \times 6$ covariance. Write the Eigen equivalent in both the fixed-size and dynamic-size forms, and say which rows and columns it covers.
:::

::: answer
`P.block<3, 3>(3, 0)` (fixed) or `P.block(3, 0, 3, 3)` (dynamic). The NumPy slice `3:6` covers rows 3, 4 and 5 — it stops before 6 — so it starts at row 3 and is 3 rows tall. `0:3` covers columns 0, 1 and 2, so it starts at column 0 and is 3 wide. With position in states 0–2 and velocity in 3–5, this is the velocity–position cross-covariance block.
:::

::: check
For `v` holding $10, 11, 12, 13, 14, 15, 16$, what are `v.segment(4, 2)`, `v.head<1>()` and `v.tail(3)`?
:::

::: answer
`v.segment(4, 2)` starts at index 4, which holds $14$, and takes two entries: $(14, 15)$. `v.head<1>()` is the first entry, $(10)$, as a 1-element fixed-size vector. `v.tail(3)` is the last three: $(14, 15, 16)$. Remember the indices start at zero, so index 4 is the fifth entry.
:::

::: check
Which of these fail to compile, which fail only at run time in a debug build, and which are fine, for `Eigen::Matrix<double, 6, 1> x`?
(a) `Eigen::Vector3d a = x.head<3>();` (b) `Eigen::Vector3d b = x.head<4>();` (c) `Eigen::Vector3d c = x.head(4);` (d) `Eigen::Vector3d d = x.segment<3>(5);`
:::

::: answer
(a) is fine: a fixed-size 3-element window copied into a `Vector3d`. (b) fails to compile, because a 4-element fixed-size window cannot be assigned to a 3-element vector and both sizes are in the types (`YOU_MIXED_MATRICES_OF_DIFFERENT_SIZES`). (c) compiles, because `head(4)` has a dynamic size; a debug build then stops with a failed assertion when the line runs, and a release build does not check. (d) compiles, because the start index 5 is a run-time value; it asks for entries 5, 6 and 7 of a 6-element vector, so a debug build stops with the block-bounds assertion, and a release build reads past the end.
:::

::: check
A 9-element state stores position (0–2), velocity (3–5) and accelerometer bias (6–8). Write one line that subtracts the bias estimate from a measured acceleration `a_meas` (a `Vector3d`), and one line that sets the velocity–bias covariance block of the $9 \times 9$ matrix `P` to zero.
:::

::: answer
`Eigen::Vector3d a_corr = a_meas - x.segment<3>(6);` reads the bias through a fixed-size window starting at index 6. For the covariance, the velocity rows are 3–5 and the bias columns are 6–8, so `P.block<3, 3>(3, 6).setZero();`. A covariance must stay symmetric, so the mirror block has to be zeroed too: `P.block<3, 3>(6, 3).setZero();`.
:::

::: check
A teammate writes `auto pos_before = x.head<3>();`, runs the filter update, then logs `x.head<3>() - pos_before` as "how far the update moved the position". The log is always zero. Why, and what is the fix?
:::

::: answer
`auto` made `pos_before` a block — a window onto `x` — not a copy. When the update changed `x`, the window showed the new values, so the difference is the new position minus itself: zero every time. The fix is to store the numbers: `Eigen::Vector3d pos_before = x.head<3>();`. Naming the type forces Eigen to copy the three values out at that moment.
:::

## Summary

| Tool | Meaning | Example |
|---|---|---|
| `row(i)`, `col(j)` | one row or column, as a view | `R.col(0)` is where the body $x$ axis points |
| `block(i, j, p, q)` | $p \times q$ window at $(i, j)$, dynamic size | `M.block(0, 1, 3, 2)` |
| `block<p, q>(i, j)` | the same window, size fixed at compile time | `P.block<3, 3>(0, 3)` |
| `head(n)`, `tail(n)` | first or last $n$ entries of a vector | `x.head<3>()` is position |
| `segment(i, n)` | $n$ entries starting at $i$ | `x.segment<3>(6)` |
| corners and strips | named blocks | `topLeftCorner`, `leftCols<3>()` |
| NumPy translation | `M[i:i+p, j:j+q]` becomes `M.block(i, j, p, q)` | last two numbers are sizes |
| writable view | writes go into the matrix itself | `F.block<3, 3>(0, 3) = dt * I` |
| checks | fixed size: compile time; start index: run time, debug only | `block<3, 3>(4, 4)` on $6 \times 6$ asserts |
| `auto` trap | `auto` keeps the view; name the type to copy | `Vector3d p = x.head<3>();` |

The next lesson, *Arrays versus matrices, reductions and broadcasting*, switches from "which numbers" to "what arithmetic": when `*` means a matrix product and when it means multiplying entry by entry, how to add up or find the largest of a matrix's entries, and how to apply one vector to every column at once, the way NumPy broadcasting does.

::: context state-vector Everything the filter knows, in one column
A navigation filter stacks all the quantities it estimates into one vector, in an order the whole team agrees on and writes down. A simple tracker uses 6 numbers: 3 of position and 3 of velocity. A typical inertial navigation filter uses 15: position, velocity, three small attitude errors, and three biases each for the gyroscopes and the accelerometers — the slowly drifting offsets every real sensor has.

Because everything sits in one vector, the filter's equations stay short: one matrix moves the whole state forward. The price is bookkeeping, and blocks are how the code does that bookkeeping by name instead of by hand-counted index.
:::

::: context covariance How unsure, and how the errors are linked
A covariance matrix describes the uncertainty of a whole state at once. Its diagonal holds each quantity's **variance**, the square of its standard deviation: a $10\,\mathrm{m}$ uncertainty shows up as $100\,\mathrm{m^2}$. Each off-diagonal entry says how two errors move together. A positive number means "when this one is too high, that one tends to be too high as well".

A covariance is always symmetric: entry $(i, j)$ equals entry $(j, i)$, because "how A moves with B" is the same as "how B moves with A". That is why editing one off-diagonal block usually means editing its mirror too.
:::

::: context rotation-columns The columns are the turned axes
Multiply a rotation matrix by the $x$ axis, $(1, 0, 0)$, and you pick out its first column. So column 0 is where the rotation sends the $x$ axis, column 1 where it sends $y$, and column 2 where it sends $z$. Here is a turn of $30°$ about $z$, seen from above.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="110" y1="170" x2="240" y2="170" stroke="#6c7a93" stroke-width="2"/>
  <line x1="110" y1="170" x2="110" y2="40" stroke="#6c7a93" stroke-width="2"/>
  <text x="246" y="174" font-size="12" fill="#6c7a93">x</text>
  <text x="104" y="34" font-size="12" fill="#6c7a93">y</text>
  <line x1="110" y1="170" x2="213.9" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="220,106.5 206.8,108.3 212.3,117.8" fill="#1d6fd1"/>
  <line x1="110" y1="170" x2="50" y2="66.1" stroke="#b4232c" stroke-width="3"/>
  <polygon points="46.5,60 47.4,73.3 56.9,67.8" fill="#b4232c"/>
  <path d="M160,170 A50,50 0 0,0 153.3,145" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="166" y="158" font-size="11" fill="#1f2a44">30°</text>
  <text x="180" y="96" font-size="12" fill="#1d6fd1">R.col(0) = (0.866, 0.5, 0)</text>
  <text x="122" y="60" font-size="12" fill="#b4232c">R.col(1) =</text>
  <text x="122" y="76" font-size="12" fill="#b4232c">(−0.5, 0.866, 0)</text>
</svg>
```

Reading `R.col(0)` in code tells you, for instance, which way the vehicle's nose points in the world frame.
:::

::: context block-frame The frame over the numbered grid
The window `block<2,2>(1,2)` from the tour: start at row 1, column 2, then take two rows and two columns.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1" fill="#ffffff">
    <rect x="100" y="20" width="40" height="40"/><rect x="140" y="20" width="40" height="40"/><rect x="180" y="20" width="40" height="40"/><rect x="220" y="20" width="40" height="40"/>
    <rect x="100" y="60" width="40" height="40"/><rect x="140" y="60" width="40" height="40"/><rect x="180" y="60" width="40" height="40" fill="#8fb8f0"/><rect x="220" y="60" width="40" height="40" fill="#8fb8f0"/>
    <rect x="100" y="100" width="40" height="40"/><rect x="140" y="100" width="40" height="40"/><rect x="180" y="100" width="40" height="40" fill="#8fb8f0"/><rect x="220" y="100" width="40" height="40" fill="#8fb8f0"/>
    <rect x="100" y="140" width="40" height="40"/><rect x="140" y="140" width="40" height="40"/><rect x="180" y="140" width="40" height="40"/><rect x="220" y="140" width="40" height="40"/>
  </g>
  <rect x="180" y="60" width="80" height="80" fill="none" stroke="#b4232c" stroke-width="3"/>
  <g font-size="13" text-anchor="middle" fill="#1f2a44">
    <text x="120" y="45">1</text><text x="160" y="45">2</text><text x="200" y="45">3</text><text x="240" y="45">4</text>
    <text x="120" y="85">5</text><text x="160" y="85">6</text><text x="200" y="85">7</text><text x="240" y="85">8</text>
    <text x="120" y="125">9</text><text x="160" y="125">10</text><text x="200" y="125">11</text><text x="240" y="125">12</text>
    <text x="120" y="165">13</text><text x="160" y="165">14</text><text x="200" y="165">15</text><text x="240" y="165">16</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="85" y="45">row 0</text><text x="85" y="85">row 1</text><text x="85" y="125">row 2</text><text x="85" y="165">row 3</text>
    <text x="120" y="195">col 0</text><text x="160" y="195">col 1</text><text x="200" y="195">col 2</text><text x="240" y="195">col 3</text>
  </g>
  <text x="275" y="95" font-size="12" fill="#b4232c">start (1, 2)</text>
  <text x="275" y="112" font-size="12" fill="#b4232c">size 2 × 2</text>
</svg>
```

Nothing inside the red frame is copied. Writing `M.block<2,2>(1,2).setZero()` would put zeros in those four cells of `M` itself.
:::

::: context constant-velocity The simplest motion model
The constant-velocity model assumes the object keeps its current velocity over the next small time step. It is never exactly true: engines fire, drag slows things down, gravity pulls. The filter accounts for that by adding a little extra uncertainty at every prediction, called process noise, which this lesson's example left out to keep the numbers clean.

It is still used everywhere, from radar tracking to rendezvous, because over a tenth of a second almost anything moves nearly in a straight line, and the filter's measurements correct what the model gets wrong.
:::

::: context quadrature Why small errors hardly add up
Independent errors do not add like ordinary numbers. Their variances add, and the total standard deviation is the square root of the sum. A $10\,\mathrm{m}$ error and an independent $0.1\,\mathrm{m}$ error combine to $\sqrt{10^2 + 0.1^2} = \sqrt{100.01} \approx 10.0005\,\mathrm{m}$, not $10.1\,\mathrm{m}$.

It is the same rule as the long side of a right triangle, which is why it is called adding "in quadrature". The practical lesson for error budgets: shrinking an error that is already much smaller than the biggest one buys almost nothing. Work on the biggest error first.
:::

::: context expression-bridge Why a block is not a matrix
When you write `x.head<3>()` or `A + B`, Eigen does not compute anything yet. It builds a small object that describes the computation — "the first three entries of x", "A plus B, entry by entry" — and only does the work when you assign it to a real matrix. These objects are called expression templates.

That design is why Eigen can combine a long formula into one loop with no temporary matrices. It is also why `auto` is risky with Eigen: `auto` stores the description, not the answer, so the answer depends on what the inputs hold later. Lesson 05 takes this apart, along with `eval()` and `noalias()`.
:::
