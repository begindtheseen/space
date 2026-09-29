---
id: l12-numpy-mapping-and-neighbours
title: Eigen and NumPy side by side, and the neighbors
minutes: 21
covers:
  - Eigen to NumPy mental mapping
  - 'Neighbors: Sophus for Lie groups, Ceres and GTSAM for least squares and factor graphs, SymForce for generated C++'
---

If you learn Spanish after English, most words are friendly. *Televisión* is television, *importante* is important. But a few words look familiar and mean something else. *Actual* means "current", not "actual". *Embarazada* means "pregnant", not "embarrassed". Language teachers call these **[[false friends|false-friends]]**, and they cause more mistakes than the words you have never seen, because you do not think to look them up.

You already speak NumPy. Eigen is your second language for the same ideas, and most of it maps across cleanly. This lesson gives you the phrasebook, then spends most of its time on the false friends: the places where the same-looking code does something different. The objective for this module is to port a NumPy rotation or filter to Eigen and match it to $10^{-12}$, and the false friends are exactly what stands between you and that match.

The second half of the lesson looks outward. Eigen is the floor that a whole neighborhood of libraries is built on: Sophus for rotations done properly, Ceres and GTSAM for fitting models to measurements, and SymForce for turning Python math into C++. You will not learn them all here, but you will know what each one is for, and why a GNC team would reach for it.

## The phrasebook

Here is the everyday mapping. In NumPy, `A` is an `ndarray` of `float64`; in Eigen, it is a `MatrixXd`, or better a fixed-size type such as `Matrix3d` when the size is known.

| You want | NumPy | Eigen |
|---|---|---|
| zeros, identity | `np.zeros((3, 3))`, `np.eye(3)` | `Matrix3d::Zero()`, `Matrix3d::Identity()` |
| one entry | `A[i, j]` | `A(i, j)` |
| a row, a column | `A[i, :]`, `A[:, j]` | `A.row(i)`, `A.col(j)` |
| a sub-block | `A[1:3, 0:2]` | `A.block(1, 0, 2, 2)` or `A.block<2, 2>(1, 0)` |
| transpose | `A.T` | `A.transpose()` |
| matrix product | `A @ B` | `A * B` |
| element-wise product | `A * B` | `A.array() * B.array()` or `A.cwiseProduct(B)` |
| dot, cross | `np.dot(a, b)`, `np.cross(a, b)` | `a.dot(b)`, `a.cross(b)` |
| length | `np.linalg.norm(a)` | `a.norm()` |
| column sums, column means | `A.sum(axis=0)`, `A.mean(axis=0)` | `A.colwise().sum()`, `A.colwise().mean()` |
| subtract a row from every row | `X - m` (automatic broadcasting) | `X.rowwise() - m` (you ask for it) |
| solve $A\mathbf{x} = \mathbf{b}$ | `np.linalg.solve(A, b)` | `A.partialPivLu().solve(b)`, or `A.ldlt().solve(b)` for a covariance |
| symmetric eigenvalues | `np.linalg.eigh(A)` | `SelfAdjointEigenSolver<Matrix3d>(A)` |
| change number type | `A.astype(np.float32)` | `A.cast<float>()` |
| evenly spaced | `np.linspace(0, 1, 5)` | `VectorXd::LinSpaced(5, 0.0, 1.0)` |

Most rows are the same idea with different spelling. A few rows hide false friends, and those get their own sections.

## False friend 1: the star

In NumPy, `*` multiplies element by element; the matrix product has its own operator, `@`. In Eigen, `*` on matrices *is* the matrix product, and element-wise work needs `.array()`. Same symbol, opposite meaning.

```python
import numpy as np

A = np.array([[1.0, 2.0], [3.0, 4.0]])
B = np.array([[5.0, 6.0], [7.0, 8.0]])
print(A * B)            # element-wise
print(A @ B)            # matrix product
# [[ 5. 12.]
#  [21. 32.]]
# [[19. 22.]
#  [43. 50.]]
```

```cpp
#include <Eigen/Dense>
#include <iostream>

int main() {
    Eigen::Matrix2d A;
    A << 1.0, 2.0,
         3.0, 4.0;
    Eigen::Matrix2d B;
    B << 5.0, 6.0,
         7.0, 8.0;

    std::cout << "A * B (matrix product):\n" << A * B << "\n";
    std::cout << "A.array() * B.array() (element-wise):\n"
              << A.array() * B.array() << "\n";

    Eigen::Matrix2d C = A;          // a COPY: C owns its own four doubles
    C(0, 0) = 100.0;
    std::cout << "A(0,0) after changing C: " << A(0, 0) << "\n";

    std::cout << "A in memory order:";
    for (int i = 0; i < 4; ++i) std::cout << ' ' << A.data()[i];
    std::cout << "\n";
    return 0;
}
```

```text
A * B (matrix product):
19 22
43 50
A.array() * B.array() (element-wise):
 5 12
21 32
A(0,0) after changing C: 1
A in memory order: 1 3 2 4
```

The worst part of this false friend is that both answers are the same shape. A $3 \times 3$ times a $3 \times 3$ gives a $3 \times 3$ either way, so nothing fails to compile and nothing looks odd. A NumPy line `P * H` pasted into C++ as `P * H` becomes a completely different calculation. Translate by meaning, never by symbol.

## False friend 2: the equals sign

In Python, `C = A` does not copy anything. It gives the same array a second name, so changing `C[0, 0]` changes `A[0, 0]` too. In C++, `Eigen::Matrix2d C = A;` makes a real copy: `C` owns its own four numbers, and the program above shows `A(0, 0)` still equal to 1 after `C(0, 0)` became 100.

Both languages do have *views*. A NumPy slice such as `A[:, 0]` is a view into `A`'s memory, and so is Eigen's `A.col(0)`: write through either and the original changes. The difference is only in what plain assignment does. In NumPy you call `.copy()` to get independence. In Eigen you get independence by default, and a view only when you ask for a block, a `Map`, or a reference.

::: warning Python habits that go wrong in C++
Two habits cause trouble. First, relying on `C = A` to share memory: in C++, the update you make to `C` never reaches `A`. Second, writing `auto C = A.col(0);` and expecting a copy: `auto` keeps the *view* type (you met this in the lesson on expression templates), so `C` still points into `A`, and changes flow both ways. When you want a separate vector, name the type: `Eigen::Vector3d c = A.col(0);`.
:::

## False friend 3: the order in memory

A matrix is a grid, but memory is one long line of numbers, so a library must choose how to lay the grid out. NumPy's default is **row-major**: row 0 first, then row 1. Eigen's default is **[[column-major|layout-picture]]**: column 0 first, then column 1. The last line of the C++ output shows it: the grid with rows `1 2` and `3 4` sits in memory as `1 3 2 4`. In NumPy the same grid sits as `1 2 3 4`.

Inside one library you rarely notice. It matters the moment raw memory crosses between them: a NumPy buffer handed to C++, a C array from a message, a file of numbers. If six numbers written row by row are read column by column, the matrix comes out scrambled, and nothing warns you. The fix is to tell Eigen the layout when you wrap the buffer with `Map`:

```cpp
#include <Eigen/Dense>
#include <iostream>

int main() {
    // Six doubles laid out the NumPy way: row 0 is 1 2 3, row 1 is 4 5 6.
    double buf[6] = {1.0, 2.0, 3.0, 4.0, 5.0, 6.0};

    using RowMajor23 = Eigen::Matrix<double, 2, 3, Eigen::RowMajor>;
    Eigen::Map<Eigen::Matrix<double, 2, 3>> wrong(buf);   // default: column-major
    Eigen::Map<RowMajor23> right(buf);

    std::cout << "column-major view:\n" << wrong << "\n";
    std::cout << "row-major view:\n" << right << "\n";

    right(1, 2) = 60.0;                  // writes through to the buffer
    std::cout << "buf[5] = " << buf[5] << "\n";
    return 0;
}
```

```text
column-major view:
1 3 5
2 4 6
row-major view:
1 2 3
4 5 6
buf[5] = 60
```

The row-major view matches what NumPy showed for `np.arange(1.0, 7.0).reshape(2, 3)`, and writing through it changed the original buffer, with no copy anywhere. This is the same pattern **[[pybind11|pybind11-bridge]]** uses to let C++ work directly on a NumPy array.

The same false friend hides in reshaping. NumPy's `reshape` fills row by row. Eigen 3.4's `reshaped(2, 3)` fills column by column, so the vector `1 2 3 4 5 6` becomes rows `1 3 5` and `2 4 6`, not `1 2 3` and `4 5 6`.

There is one more false friend you already know from two lessons ago: the quaternion. NumPy has no quaternion type of its own, and the Python libraries you are likely to pair with it (SciPy's `Rotation`, for one) hand quaternions around as four plain numbers, usually scalar-last. Eigen's constructor is scalar-first. Treat every quaternion crossing the boundary the way that lesson taught.

::: key Eigen to NumPy mapping: three gotchas
Eigen defaults to column-major while NumPy defaults to row-major; Eigen quaternion storage is scalar-last while the constructor is scalar-first; and Eigen matrix `*` is a matrix product while NumPy `*` is element-wise.
:::

## Smaller false friends

A handful of smaller differences each cost someone an afternoon.

- **Slice ends.** Python's `A[1:3]` stops *before* index 3: two elements. Eigen's `block(1, 0, 2, 2)` takes a start and a *size*. Eigen 3.4 also has `Eigen::seq(1, 2)`, whose end is *included*. The NumPy slice `X[1:3, 0:2]` is `X(Eigen::seq(1, 2), Eigen::seq(0, 1))`.
- **Argument order.** `np.linspace(0, 1, 5)` puts the count last. `VectorXd::LinSpaced(5, 0.0, 1.0)` puts it first. Both give `0 0.25 0.5 0.75 1`.
- **Random numbers.** `np.random.rand` gives numbers from 0 up to 1. Eigen's `Random()` gives numbers between $-1$ and $1$. A test that assumes positive entries will fail.
- **Broadcasting.** NumPy stretches shapes automatically: `X - X.mean(axis=0)` subtracts the column means from every row. Eigen makes you say it: `X.rowwise() - X.colwise().mean()`. Wordier, but it never broadcasts by accident.
- **Mixed number types.** NumPy quietly promotes `float32 + float64` to `float64`. Eigen refuses to compile `Vector3f + Vector3d`; the error mentions `ScalarBinaryOpTraits<float, double, ...>`. Convert on purpose with `.cast<double>()`.

::: example Porting a rotation and a covariance, matched to 1e-12
A NumPy prototype rotates a covariance and a vector by $30°$ about $z$:

```python
import numpy as np

th = np.deg2rad(30.0)
R = np.array([[np.cos(th), -np.sin(th), 0.0],
              [np.sin(th),  np.cos(th), 0.0],
              [0.0,         0.0,        1.0]])
P = np.diag([4.0, 1.0, 0.25])          # covariance, m^2
v = np.array([100.0, 0.0, 0.0])        # m

P2 = R @ P @ R.T
w = R @ v
print(float(P2[0, 1]), float(w[1]), float(np.trace(P2)))
# 1.2990381056766578 49.99999999999999 5.25
```

The Eigen port translates by meaning: `@` becomes `*`, `.T` becomes `.transpose()`, `np.diag` becomes `asDiagonal()`.

```cpp
#include <Eigen/Dense>
#include <cmath>
#include <cstdio>

int main() {
    const double th = 30.0 * M_PI / 180.0;
    Eigen::Matrix3d R;
    R << std::cos(th), -std::sin(th), 0.0,
         std::sin(th),  std::cos(th), 0.0,
         0.0,           0.0,          1.0;
    const Eigen::Matrix3d P = Eigen::Vector3d(4.0, 1.0, 0.25).asDiagonal();
    const Eigen::Vector3d v(100.0, 0.0, 0.0);

    const Eigen::Matrix3d P2 = R * P * R.transpose();
    const Eigen::Vector3d w = R * v;
    std::printf("%.17g %.17g %.17g\n", P2(0, 1), w(1), P2.trace());

    // The values NumPy printed, pasted in by hand.
    const double np_p01 = 1.2990381056766578, np_w1 = 49.99999999999999, np_tr = 5.25;
    const double worst = std::fmax(std::fabs(P2(0, 1) - np_p01),
                         std::fmax(std::fabs(w(1) - np_w1), std::fabs(P2.trace() - np_tr)));
    std::printf("largest difference: %.1e (%s)\n", worst, worst < 1e-12 ? "PASS" : "FAIL");
    return 0;
}
```

```text
1.299038105676658 49.999999999999993 5.25
largest difference: 2.2e-16 (PASS)
```

**Check the numbers by hand.** The rotated covariance has off-diagonal entry $(4 - 1)\sin 30° \cos 30° = 3 \times 0.5 \times 0.866 \approx 1.299\,\mathrm{m^2}$. The rotated vector's $y$ part is $100 \sin 30° = 50\,\mathrm{m}$, which both libraries print as a hair under 50. The trace is $4 + 1 + 0.25 = 5.25\,\mathrm{m^2}$, and it must not change under a rotation, because turning a cloud of uncertainty does not make it bigger or smaller.

**Why not exactly equal?** The off-diagonal entries differ by $2.2 \times 10^{-16}$, one **[[unit in the last place|ulp]]** for a number near 1.3. NumPy hands matrix products to a separate linear algebra library that may add the terms in a different order, and floating-point addition gives slightly different roundings in different orders. That is why the objective says "match to $10^{-12}$" and not "match exactly". A difference near $10^{-16}$ is rounding. A difference near $10^{-1}$ is a false friend.
:::

## The neighbors

Eigen does vectors, matrices, decompositions and basic geometry. GNC work needs more: rotations handled with the right calculus, and fitting a model to hundreds of measurements at once. Four open-source libraries built on Eigen show up again and again. All four take and return Eigen types, so everything in this module carries straight over.

### Sophus: rotations as a curved space

You cannot add two rotations the way you add two vectors. Adding two rotation matrices entry by entry gives a matrix that is not a rotation at all. Rotations live on a curved surface, the way cities live on the curved Earth. A **Lie group** (say "lee") is the mathematician's name for a set like this: smooth and curved, where you can combine elements (do one rotation after another) and undo them.

The trick for working on a curved surface is the one a hiker uses with a paper map: near where you stand, the ground is nearly flat. So you describe a small change as an ordinary 3-vector in that flat **[[tangent space|tangent-plane]]**, then "wrap" it back onto the curved surface. The wrap is called the **exponential map**, and the unwrap is the **logarithm**. For rotations, the exponential of the small vector $\boldsymbol{\omega}$ (read "omega") is the turn by angle $\lVert\boldsymbol{\omega}\rVert$ about the axis $\boldsymbol{\omega}/\lVert\boldsymbol{\omega}\rVert$, which is exactly what Eigen's `AngleAxisd` builds.

**Sophus** is a C++ library, built on Eigen, that packages these groups as types: `SO3` for rotations, `SE3` for a rotation plus a translation (a full pose), and others, each with `exp()`, `log()` and the derivatives that go with them. An error-state Kalman filter, which you will meet in the navigation modules, keeps its attitude error as exactly such a small tangent vector.

### Ceres: fitting a model to many measurements

Many GNC problems end in **least squares**: find the unknowns that make the sum of squared mismatches between model and measurements as small as possible. Orbit determination from a pass of range measurements, calibrating a camera, aligning an IMU are all of this form. When the model is not a straight line the problem is **nonlinear**, and solvers attack it by repeated small linear steps, each needing the **Jacobian**: the table of how every residual changes when every unknown changes.

**[[Ceres Solver|ceres-name]]**, from Google, solves large nonlinear least-squares problems. Its most loved feature is **automatic differentiation**. You write your residual once, as a template on the number type `T` (the template skill from the templates module). Ceres runs it with ordinary `double`s to get the value, and with special **[[dual numbers|dual-numbers]]** that carry a derivative along with each value to get the exact Jacobian. No hand-derived formulas, no finite-difference step size to tune.

Eigen ships a small, unofficial version of the same idea in its `unsupported` folder, which lets you watch it happen:

::: example A range Jacobian, computed automatically
A ground station sits at the origin. A spacecraft is at $\mathbf{p} = (3000, 4000, 12\,000)\,\mathrm{m}$. We want the range $r = \lVert \mathbf{p} - \mathbf{s} \rVert$ and its derivative with respect to $\mathbf{p}$.

```cpp
#include <Eigen/Dense>
#include <unsupported/Eigen/AutoDiff>
#include <cstdio>

// One function, written once, for any number type T.
template <typename T>
T range(const Eigen::Matrix<T, 3, 1>& p, const Eigen::Vector3d& station) {
    return (p - station.cast<T>()).norm();
}

int main() {
    const Eigen::Vector3d station(0.0, 0.0, 0.0);          // m
    const Eigen::Vector3d p(3000.0, 4000.0, 12000.0);      // spacecraft, m

    // 1. Plain doubles: only the value.
    std::printf("range = %.1f m\n", range(p, station));

    // 2. Dual numbers: the value AND its derivative with respect to p.
    using AD = Eigen::AutoDiffScalar<Eigen::Vector3d>;
    Eigen::Matrix<AD, 3, 1> pa;
    for (int i = 0; i < 3; ++i) pa(i) = AD(p(i), 3, i);    // seed: d p_i / d p_i = 1
    const AD r = range(pa, station);
    std::printf("auto   dr/dp = %.6f %.6f %.6f\n",
                r.derivatives()(0), r.derivatives()(1), r.derivatives()(2));

    // 3. The hand-derived Jacobian, (p - s)^T / r, for comparison.
    const Eigen::Vector3d J = (p - station) / (p - station).norm();
    std::printf("by hand dr/dp = %.6f %.6f %.6f\n", J(0), J(1), J(2));
    std::printf("difference    = %.1e\n", (r.derivatives() - J).cwiseAbs().maxCoeff());
    return 0;
}
```

```text
range = 13000.0 m
auto   dr/dp = 0.230769 0.307692 0.923077
by hand dr/dp = 0.230769 0.307692 0.923077
difference    = 0.0e+00
```

**By hand.** $r = \sqrt{3000^2 + 4000^2 + 12\,000^2} = \sqrt{9 \times 10^6 + 16 \times 10^6 + 144 \times 10^6} = \sqrt{169 \times 10^6} = 13\,000\,\mathrm{m}$. The derivative of a distance with respect to the far point is the unit vector pointing from the station to that point: $(3000, 4000, 12\,000)/13\,000 = (3/13, 4/13, 12/13) \approx (0.2308, 0.3077, 0.9231)$. The units cancel (meters of range per meter of position), and the vector has length 1, as a direction must.

The same templated function gave both the value and the exact derivative. Had someone derived it by hand and written $(\mathbf{s} - \mathbf{p})/r$ by mistake, the sign would be flipped, the filter would still run, and it would slowly diverge. Automatic differentiation removes that whole class of bug.
:::

### GTSAM: many unknowns tied together

**GTSAM** (Georgia Tech Smoothing and Mapping) also solves least-squares problems, but it describes them as a **[[factor graph|factor-graph]]**: circles for the unknowns (the vehicle's pose at each moment, the position of each landmark) and small squares for the measurements that tie them together. An IMU reading ties two poses in a row; a camera sighting ties a pose to a landmark; a GNSS fix pins one pose to the Earth. GTSAM's solvers, including one called iSAM2 that updates the answer as each new measurement arrives, are used for visual-inertial navigation and mapping in robotics and aerospace research.

Where a Kalman filter keeps only the current state and forgets the past, a factor-graph smoother can revise the whole recent trajectory when a new measurement shows an earlier guess was off.

### SymForce: write the math once, generate the C++

The last neighbor attacks the slowest, most error-prone step of all: turning math into flight code by hand. In Python you may have used SymPy to write a model with symbols, differentiate it, and turn it into a fast function with `lambdify`. **SymForce**, from the drone company Skydio, is the production version of that idea. You write the measurement model symbolically in Python, SymForce computes the Jacobians symbolically, simplifies the expressions, and **generates** plain, optimized C++ that uses Eigen types. It also includes Lie group types and an optimizer, so it overlaps with all three neighbors above.

::: key What SymForce is and why it matters here
SymForce is a Skydio toolchain that writes the mathematics symbolically in Python and generates optimized C++, including analytic Jacobians. It is the production version of the SymPy-plus-`lambdify` pattern, and it removes the hand-differentiation bug class.
:::

| Library | The job | The idea to remember |
|---|---|---|
| Sophus | rotations and poses as Lie groups | small changes live in a flat tangent space; `exp` and `log` move between |
| Ceres | nonlinear least squares | residual written once as a template; automatic Jacobians |
| GTSAM | factor graphs, smoothing and mapping | unknowns as nodes, measurements as factors; incremental solving |
| SymForce | symbolic math to generated C++ | derive in Python, ship fast C++ with exact Jacobians |

::: warning A neighbor is a dependency
Each of these libraries is large, and each has its own conventions: quaternion order, which frame a pose maps from and to, which side a small change is applied on. Before using one in flight code, find those conventions in its documentation, and write the same round-trip and known-answer tests you wrote for Eigen at every boundary.
:::

## Check yourself

::: check
Translate this NumPy line to Eigen, assuming `K` is $6 \times 3$ and `y` has 3 entries: `x = x + K @ y`. Then translate `s = a * b` where `a` and `b` are two $3$-vectors multiplied element by element.
:::

::: answer
`@` is the matrix product, which is Eigen's `*`: `x += K * y;` (or `x.noalias() += K * y;`, since `x` does not appear in the product).

NumPy's `*` on two vectors is element-wise, which in Eigen is `s = a.cwiseProduct(b);` or `s = (a.array() * b.array()).matrix();`. Writing `a * b` in Eigen for two column vectors would not compile, because a $3 \times 1$ times a $3 \times 1$ is not a valid matrix product; Eigen's error even says `INVALID_VECTOR_VECTOR_PRODUCT__IF_YOU_WANTED_A_DOT_OR_COEFF_WISE_PRODUCT_YOU_MUST_USE_THE_EXPLICIT_FUNCTIONS`. For square matrices it would compile and silently compute the wrong thing.
:::

::: check
A C++ function receives a pointer to 9 doubles from a Python harness. The Python side built them with `M.ravel()` from a $3 \times 3$ NumPy array. Write the Eigen line that views them correctly without copying, and say what goes wrong with `Eigen::Map<Eigen::Matrix3d>`.
:::

::: answer
`ravel()` on a default NumPy array lays the numbers out row by row. So the view must be row-major:

`Eigen::Map<Eigen::Matrix<double, 3, 3, Eigen::RowMajor>> M(ptr);`

With `Eigen::Map<Eigen::Matrix3d>`, Eigen reads the same 9 numbers column by column, so the matrix it sees is the transpose of the real one. For a symmetric matrix such as a covariance, the transpose is the same matrix and the bug hides. For a rotation matrix, you silently get the inverse rotation.
:::

::: check
Your Eigen port of a NumPy filter step agrees to $3 \times 10^{-16}$ on every output. A reviewer asks why not exactly. Another port disagrees by $0.4$ on one entry. What would you say about each?
:::

::: answer
A difference of $3 \times 10^{-16}$ is one or two units in the last place of a `double` near 1. It comes from doing the same additions and multiplications in a different order, which rounds slightly differently; NumPy passes products to a separate linear algebra library that orders the work its own way. It is well inside the $10^{-12}$ target.

A difference of $0.4$ is not rounding. It is a translation error, most likely one of the false friends: an element-wise `*` turned into a matrix product (or the reverse), a buffer read in the wrong storage order, a quaternion with its scalar in the wrong slot, or a slice end off by one.
:::

::: check
Convert these NumPy calls: `np.linspace(-1, 1, 21)`, `X[2:5, :]` for a matrix with 4 columns, and `X - X.mean(axis=0)`.
:::

::: answer
`Eigen::VectorXd::LinSpaced(21, -1.0, 1.0)` (count first).

`X[2:5, :]` is rows 2, 3 and 4: three rows, all 4 columns. In Eigen, `X.middleRows(2, 3)`, or `X.block(2, 0, 3, 4)`, or `X(Eigen::seq(2, 4), Eigen::all)` with an included end of 4.

`X.rowwise() - X.colwise().mean()`: the column means form one row, and `rowwise()` says "subtract it from every row".
:::

::: check
For each task, name the neighbor you would reach for first: (a) generate the C++ for a star-tracker measurement model and its Jacobian from a Python derivation; (b) refine a whole day of spacecraft positions from ranging passes, with a nonlinear model; (c) keep the attitude error of a filter as a small 3-vector and apply it to the attitude correctly; (d) fuse IMU, camera and GNSS measurements over a sliding window of poses.
:::

::: answer
(a) SymForce: symbolic derivation in Python, generated C++ with exact Jacobians.

(b) Ceres: a large nonlinear least-squares problem, with automatic differentiation for the Jacobians.

(c) Sophus: the error is a tangent-space vector, and `exp` applies it to the rotation (SymForce's Lie group types could do this too).

(d) GTSAM: each measurement becomes a factor between poses, and the smoother solves for the whole window, updating as data arrives.
:::

## Summary

| Idea | NumPy | Eigen |
|---|---|---|
| Matrix product | `A @ B` | `A * B` |
| Element-wise product | `A * B` | `A.array() * B.array()`, `cwiseProduct` |
| `C = A` | a second name, shared memory | a real copy |
| Default layout | row-major | column-major; `Map` with `RowMajor` to match NumPy |
| Quaternion | usually four plain numbers | constructor $(w, x, y, z)$, storage $(x, y, z, w)$ |
| Slices | end excluded | `block(start, size)`; `seq(a, b)` includes `b` |
| Broadcasting | automatic | explicit `rowwise()`, `colwise()` |
| Porting target | | match to $10^{-12}$, not bit for bit |
| Sophus | | Lie groups: `SO3`, `SE3`, `exp`, `log` |
| Ceres, GTSAM | | least squares with autodiff; factor graphs and smoothing |
| SymForce | | Python symbolic math to generated C++ with exact Jacobians |

This closes the Eigen module. Everything in it comes back when you build real estimators: the Kalman filter and navigation modules use these fixed-size types, decompositions and quaternions on every page, and the flight software modules add the build, test and real-time discipline around them, starting with the next C++ module on CMake.

::: context false-friends Words that lie
The term "false friends" comes from the French *faux amis*, a phrase from a 1928 book for French speakers learning English. Every pair of languages has them, and they are dangerous for the same reason as the Eigen and NumPy ones: the sentence looks fine, so you do not stop to check. Engineers borrow the phrase for any two tools where identical-looking code means different things.
:::

::: context layout-picture Two ways to flatten a grid
The same $2 \times 3$ grid, laid into memory two ways. Row-major reads across each row, like lines of text. Column-major reads down each column, the way the Fortran language and the old linear algebra libraries written in it have always done, which is where Eigen's default comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="20" y="30" width="34" height="30"/><rect x="54" y="30" width="34" height="30"/><rect x="88" y="30" width="34" height="30"/>
    <rect x="20" y="60" width="34" height="30"/><rect x="54" y="60" width="34" height="30"/><rect x="88" y="60" width="34" height="30"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="37" y="50">1</text><text x="71" y="50">2</text><text x="105" y="50">3</text>
    <text x="37" y="80">4</text><text x="71" y="80">5</text><text x="105" y="80">6</text>
  </g>
  <text x="71" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">the grid</text>
  <text x="150" y="42" font-size="12" fill="#1d6fd1">row-major (NumPy)</text>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="#8fb8f0">
    <rect x="150" y="50" width="30" height="24"/><rect x="180" y="50" width="30" height="24"/><rect x="210" y="50" width="30" height="24"/>
    <rect x="240" y="50" width="30" height="24"/><rect x="270" y="50" width="30" height="24"/><rect x="300" y="50" width="30" height="24"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="165" y="67">1</text><text x="195" y="67">2</text><text x="225" y="67">3</text><text x="255" y="67">4</text><text x="285" y="67">5</text><text x="315" y="67">6</text>
  </g>
  <text x="150" y="112" font-size="12" fill="#b4232c">column-major (Eigen)</text>
  <g stroke="#b4232c" stroke-width="1.5" fill="#f2b880">
    <rect x="150" y="120" width="30" height="24"/><rect x="180" y="120" width="30" height="24"/><rect x="210" y="120" width="30" height="24"/>
    <rect x="240" y="120" width="30" height="24"/><rect x="270" y="120" width="30" height="24"/><rect x="300" y="120" width="30" height="24"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="165" y="137">1</text><text x="195" y="137">4</text><text x="225" y="137">2</text><text x="255" y="137">5</text><text x="285" y="137">3</text><text x="315" y="137">6</text>
  </g>
</svg>
```
:::

::: context pybind11-bridge C++ under a Python harness
pybind11 is a small C++ library for making C++ functions callable from Python. Its Eigen support converts between NumPy arrays and Eigen types. Passed by value, an array is copied. Passed as an `Eigen::Ref` or wrapped with a `Map`, C++ works on the NumPy memory itself, as long as the layout matches, which is why the row-major versus column-major question matters so much at this boundary. A common GNC arrangement is a fast C++ filter or dynamics core driven by a Python Monte Carlo harness that sets up thousands of runs and plots the results.
:::

::: context ulp The smallest step a double can take
Doubles are spaced unevenly: close together near zero, far apart for big numbers. The gap between one double and the next is called one ulp, a unit in the last place. For numbers between 1 and 2 it is $2^{-52} \approx 2.2 \times 10^{-16}$. So two answers that differ by one ulp are as close as two different doubles can possibly be. Measuring differences in ulps, or against a tolerance like $10^{-12}$, is how numerical code is compared across libraries, compilers and machines.
:::

::: context tangent-plane Flat maps of a round world
Stand anywhere on a globe and lay a flat sheet of paper against it. Near the touching point, the paper and the globe almost agree, so small steps can be planned on the flat sheet. That sheet is the tangent space. The exponential map takes a step drawn on the sheet and wraps it onto the globe. For rotations, the "globe" is the set of all rotations and the sheet is ordinary 3-D space, where a small rotation is a 3-vector you can add, scale and put in a covariance matrix.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="120" r="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="40" x2="270" y2="40" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="180" cy="40" r="4" fill="#1f2a44"/>
  <line x1="180" y1="40" x2="240" y2="40" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="240,40 231,35 231,45" fill="#b4232c"/>
  <path d="M 180 40 A 80 80 0 0 1 231.4 58.7" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="231.4" cy="58.7" r="4" fill="#1d6fd1"/>
  <text x="190" y="26" font-size="12" fill="#b4232c">small step on the sheet</text>
  <text x="246" y="74" font-size="12" fill="#1d6fd1">exp wraps it on</text>
  <text x="60" y="30" font-size="12" fill="#1f2a44">tangent space</text>
  <text x="140" y="140" font-size="12" fill="#1f2a44">rotations</text>
</svg>
```
:::

::: context ceres-name Named after a dwarf planet
Ceres Solver takes its name from the dwarf planet Ceres. It was discovered by Giuseppe Piazzi on 1 January 1801, followed for a few weeks, and then lost in the glare of the Sun. The young Carl Friedrich Gauss used the handful of observations, and his method of least squares, to predict where it would reappear, and astronomers found it there at the end of 1801. It was one of the first great successes of least squares, and an orbit-determination problem at that.
:::

::: context dual-numbers Carrying a derivative along
A dual number is a pair: a value, and the derivative of that value with respect to the inputs. Arithmetic on pairs follows the rules of calculus. Adding two pairs adds values and adds derivatives; multiplying uses the product rule. Start each input with derivative 1 with respect to itself and 0 for the others, run the ordinary code, and the result arrives carrying its exact derivative. There is no step size and no truncation error, only the usual floating-point rounding. Ceres calls its dual numbers Jets.
:::

::: context factor-graph Circles and squares
In a factor graph, each circle is an unknown and each square is a measurement that links the circles it depends on. Solving the graph means finding the circles' values that best agree with all the squares at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="60" y1="60" x2="180" y2="60"/><line x1="180" y1="60" x2="300" y2="60"/>
    <line x1="180" y1="60" x2="240" y2="120"/><line x1="300" y1="60" x2="240" y2="120"/>
    <line x1="60" y1="60" x2="60" y2="20"/>
  </g>
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2">
    <circle cx="60" cy="60" r="16"/><circle cx="180" cy="60" r="16"/><circle cx="300" cy="60" r="16"/>
  </g>
  <circle cx="240" cy="120" r="16" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <g fill="#f2b880" stroke="#1f2a44">
    <rect x="113" y="53" width="14" height="14"/><rect x="233" y="53" width="14" height="14"/>
    <rect x="203" y="83" width="14" height="14"/><rect x="263" y="83" width="14" height="14"/>
    <rect x="53" y="13" width="14" height="14"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="64">x1</text><text x="180" y="64">x2</text><text x="300" y="64">x3</text><text x="240" y="124">L</text>
  </g>
  <text x="120" y="92" font-size="11" fill="#6c7a93" text-anchor="middle">IMU</text>
  <text x="90" y="24" font-size="11" fill="#6c7a93">GNSS fix</text>
  <text x="350" y="146" font-size="11" fill="#6c7a93" text-anchor="end">camera sees landmark L</text>
</svg>
```
:::
